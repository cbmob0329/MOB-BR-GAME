/**
 * MOB BR main/tournament transfer contract.
 *
 * The main system is the sole owner of persistent data. This module creates a
 * read-only tournament entry snapshot, stores it for tournament.html, validates
 * the returned result, and commits it through state.js exactly once.
 */

import {
  GAME_DATA_VERSION,
  ROLE_IDS,
  STAT_IDS,
  TOURNAMENT_SCHEDULE_TEMPLATE,
  TOURNAMENT_SESSION_RULES,
  getChampionshipPoints,
  getCompanyRankData,
  getPlacementPoints,
  getTournamentEventsForDate,
  isChampionshipYear,
} from "../../data/game-data.js?v=37";
import {
  CASUAL_TOURNAMENT_RULES,
  FORMAL_CIRCUIT_RULES,
  createGroupAssignments,
  createGroupMatchPlan,
  createSimpleMatchPlan,
  deterministicShuffle,
  isCasualTournamentType,
  normalizeCircuitTier,
  resolveCpuTeamMaster,
  selectTeamIds,
  sourcePoolForTeamId,
  teamSeed,
} from "../../data/circuit-data.js?v=37";
import {
  LOCAL_CPU_TEAMS,
} from "../../data/cpu-local-data.js";
import {
  NATIONAL_CPU_TEAMS,
} from "../../data/cpu-national-data.js";
import {
  getWorldCpuTeamsForYear,
} from "../../data/cpu-world-data.js";
import {
  BATTLE_CONFIG_VERSION,
} from "../../data/battle-config.js?v=37";
import {
  CONSUMABLE_ITEMS,
  ITEM_MASTER_VERSION,
  getItem,
} from "../../data/shop-data.js";
import {
  getCasualCup,
} from "../../data/casual-data.js?v=37";
import {
  STRATEGIES,
  STRATEGY_MASTER_VERSION,
} from "../../data/strategy-data.js";
import {
  DuplicateTournamentResultError,
  STORAGE_KEYS,
  calculateChecksum,
} from "./state.js?v=37";

export const TOURNAMENT_BRIDGE_VERSION = "mobbr-tournament-bridge-2.3.0";
export const TOURNAMENT_ENTRY_SCHEMA_VERSION =
  "mobbr-tournament-entry-1.0.0";
export const TOURNAMENT_RESULT_SCHEMA_VERSION =
  "mobbr-tournament-result-1.0.0";
export const TOURNAMENT_RESUME_SCHEMA_VERSION =
  "mobbr-tournament-resume-1.0.0";
export const TOURNAMENT_ACK_SCHEMA_VERSION =
  "mobbr-tournament-ack-1.0.0";
export const REWARD_TABLE_VERSION = "mobbr-reward-table-1.1.0";

const TOURNAMENT_PAGE_URL = "./tournament.html";
const ALLOWED_RESULT_STATUSES = Object.freeze([
  "completed",
  "eliminated",
  "qualified",
  "champion",
  "stage_in_progress",
  "suspended",
]);
const FINAL_RESULT_STATUSES = Object.freeze([
  "completed",
  "eliminated",
  "qualified",
  "champion",
  "stage_in_progress",
]);
const RESOURCE_IDS = Object.freeze(["coin", "diamond", "ruby"]);
const TRAINING_POINT_IDS = Object.freeze([
  "power",
  "tech",
  "mental",
  "shoot",
]);
const MEMBER_RESULT_FIELDS = Object.freeze([
  "matches",
  "rounds",
  "kills",
  "assists",
  "downsGiven",
  "deaths",
  "revives",
  "damage",
  "damageTaken",
  "healing",
  "shots",
  "hits",
  "skillUses",
  "survivalTime",
  "weaponShots",
  "weaponHits",
  "weaponDamage",
  "weaponReloads",
]);

function deepClone(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertPlainObject(value, label) {
  if (!isPlainObject(value)) {
    throw new TournamentBridgeError(`${label} must be a plain object.`, {
      code: "INVALID_OBJECT",
    });
  }
  return value;
}

function assertNonEmptyString(value, label, maximumLength = 300) {
  if (typeof value !== "string") {
    throw new TournamentBridgeError(`${label} must be a string.`, {
      code: "INVALID_STRING",
    });
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maximumLength) {
    throw new TournamentBridgeError(
      `${label} must contain 1-${maximumLength} characters.`,
      { code: "INVALID_STRING_LENGTH" },
    );
  }
  return normalized;
}

function assertNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new TournamentBridgeError(
      `${label} must be a non-negative integer.`,
      { code: "INVALID_INTEGER" },
    );
  }
  return value;
}

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TournamentBridgeError(
      `${label} must be a positive integer.`,
      { code: "INVALID_INTEGER" },
    );
  }
  return value;
}

function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) {
    throw new TournamentBridgeError(`${label} must be finite.`, {
      code: "INVALID_NUMBER",
    });
  }
  return value;
}

function normalizeStorage(storage) {
  if (
    !storage ||
    typeof storage.getItem !== "function" ||
    typeof storage.setItem !== "function" ||
    typeof storage.removeItem !== "function"
  ) {
    throw new TypeError(
      "Storage must implement getItem, setItem, and removeItem.",
    );
  }
  return storage;
}

function isStorageQuotaError(error) {
  const name =
    String(error?.name ?? "");
  const message =
    String(error?.message ?? "");
  const code =
    Number(error?.code ?? -1);
  return (
    name === "QuotaExceededError" ||
    name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    code === 22 ||
    code === 1014 ||
    /quota|exceeded/i.test(message)
  );
}

function fallbackTournamentStorage(
  primaryStorage,
) {
  try {
    const candidate =
      globalThis.sessionStorage;
    if (
      candidate &&
      candidate !== primaryStorage &&
      typeof candidate.getItem === "function" &&
      typeof candidate.setItem === "function" &&
      typeof candidate.removeItem === "function"
    ) {
      return candidate;
    }
  } catch (_error) {
    // Restricted Safari contexts may deny sessionStorage access.
  }
  return null;
}

function removeTournamentResumeEverywhere(
  primaryStorage,
) {
  primaryStorage.removeItem(
    STORAGE_KEYS.tournamentResume,
  );
  try {
    fallbackTournamentStorage(
      primaryStorage,
    )?.removeItem(
      STORAGE_KEYS.tournamentResume,
    );
  } catch (_error) {
    // Ignore fallback cleanup failures.
  }
}

function nowIso(clock) {
  const value = clock();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TournamentBridgeError("Clock returned an invalid date.", {
      code: "INVALID_CLOCK",
    });
  }
  return date.toISOString();
}

function createGeneratedId(prefix) {
  if (
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function serializeTransferPayload(payload) {
  return JSON.stringify({
    bridgeVersion: TOURNAMENT_BRIDGE_VERSION,
    schemaVersion: payload.schemaVersion,
    checksum: calculateChecksum(payload),
    payload,
  });
}

function deserializeTransferPayload(serialized, expectedSchema, label) {
  if (typeof serialized !== "string" || !serialized) {
    throw new TournamentBridgeError(`${label} is empty.`, {
      code: "EMPTY_TRANSFER_DATA",
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    throw new TournamentBridgeError(`${label} is not valid JSON.`, {
      code: "INVALID_TRANSFER_JSON",
      cause: error,
    });
  }

  if (parsed?.payload && parsed?.checksum) {
    const actual = calculateChecksum(parsed.payload);
    if (actual !== parsed.checksum) {
      throw new TournamentBridgeError(`${label} checksum does not match.`, {
        code: "TRANSFER_CHECKSUM_MISMATCH",
      });
    }
    if (expectedSchema && parsed.payload.schemaVersion !== expectedSchema) {
      throw new TournamentBridgeError(
        `${label} schema is not supported: ${parsed.payload.schemaVersion}`,
        { code: "UNSUPPORTED_TRANSFER_SCHEMA" },
      );
    }
    return parsed.payload;
  }

  // Tournament output v1 was originally specified as a raw object.
  if (label === "Tournament result") {
    return parsed;
  }

  throw new TournamentBridgeError(`${label} envelope is invalid.`, {
    code: "INVALID_TRANSFER_ENVELOPE",
  });
}

function rewardBand(minPlace, maxPlace, {
  coin,
  diamond,
  ruby,
  companyExp,
  pointEach,
  badgePackId = null,
  badgePackCount = 0,
}) {
  return {
    minPlace,
    maxPlace,
    rewards: {
      coin,
      diamond,
      ruby,
      companyExp,
      trainingPoints: {
        power: pointEach,
        tech: pointEach,
        mental: pointEach,
        shoot: pointEach,
      },
      badgePacks:
        badgePackId && badgePackCount > 0
          ? { [badgePackId]: badgePackCount }
          : {},
      championshipPoints: 0,
      unlockFlags: {},
    },
  };
}

export const REWARD_TABLES = deepFreeze({
  local: {
    rewardTableId: "reward-local-v1",
    tableVersion: REWARD_TABLE_VERSION,
    maximumPlace: 20,
    bands: [
      rewardBand(1, 1, { coin: 1_000_000, diamond: 50, ruby: 30, companyExp: 30, pointEach: 100, badgePackId: "local_badge_pack", badgePackCount: 10 }),
      rewardBand(2, 2, { coin: 500_000, diamond: 25, ruby: 15, companyExp: 15, pointEach: 50, badgePackId: "local_badge_pack", badgePackCount: 7 }),
      rewardBand(3, 3, { coin: 300_000, diamond: 15, ruby: 10, companyExp: 12, pointEach: 30, badgePackId: "local_badge_pack", badgePackCount: 5 }),
      rewardBand(4, 6, { coin: 100_000, diamond: 10, ruby: 5, companyExp: 8, pointEach: 20, badgePackId: "local_badge_pack", badgePackCount: 3 }),
      rewardBand(7, 10, { coin: 50_000, diamond: 5, ruby: 3, companyExp: 5, pointEach: 10, badgePackId: "local_badge_pack", badgePackCount: 2 }),
      rewardBand(11, 20, { coin: 30_000, diamond: 3, ruby: 1, companyExp: 1, pointEach: 5, badgePackId: "local_badge_pack", badgePackCount: 1 }),
    ],
  },
  national: {
    rewardTableId: "reward-national-v1",
    tableVersion: REWARD_TABLE_VERSION,
    maximumPlace: 40,
    bands: [
      rewardBand(1, 1, { coin: 10_000_000, diamond: 500, ruby: 300, companyExp: 100, pointEach: 150, badgePackId: "national_badge_pack", badgePackCount: 10 }),
      rewardBand(2, 2, { coin: 5_000_000, diamond: 250, ruby: 150, companyExp: 75, pointEach: 100, badgePackId: "national_badge_pack", badgePackCount: 7 }),
      rewardBand(3, 3, { coin: 3_000_000, diamond: 150, ruby: 100, companyExp: 50, pointEach: 75, badgePackId: "national_badge_pack", badgePackCount: 5 }),
      rewardBand(4, 6, { coin: 1_000_000, diamond: 100, ruby: 50, companyExp: 30, pointEach: 50, badgePackId: "national_badge_pack", badgePackCount: 3 }),
      rewardBand(7, 10, { coin: 500_000, diamond: 50, ruby: 30, companyExp: 20, pointEach: 30, badgePackId: "national_badge_pack", badgePackCount: 2 }),
      rewardBand(11, 20, { coin: 300_000, diamond: 30, ruby: 10, companyExp: 15, pointEach: 20, badgePackId: "national_badge_pack", badgePackCount: 1 }),
      rewardBand(21, 40, { coin: 30_000, diamond: 3, ruby: 1, companyExp: 10, pointEach: 10, badgePackId: "national_badge_pack", badgePackCount: 1 }),
    ],
  },
  national_last_chance: {
    rewardTableId: "reward-national-last-chance-v1",
    tableVersion: REWARD_TABLE_VERSION,
    maximumPlace: 20,
    bands: [
      rewardBand(1, 1, { coin: 1_500_000, diamond: 60, ruby: 30, companyExp: 30, pointEach: 50, badgePackId: "national_badge_pack", badgePackCount: 5 }),
      rewardBand(2, 3, { coin: 800_000, diamond: 30, ruby: 15, companyExp: 20, pointEach: 35, badgePackId: "national_badge_pack", badgePackCount: 3 }),
      rewardBand(4, 10, { coin: 400_000, diamond: 15, ruby: 8, companyExp: 12, pointEach: 20, badgePackId: "national_badge_pack", badgePackCount: 2 }),
      rewardBand(11, 20, { coin: 100_000, diamond: 5, ruby: 2, companyExp: 5, pointEach: 8, badgePackId: "national_badge_pack", badgePackCount: 1 }),
    ],
  },
  world: {
    rewardTableId: "reward-world-v1",
    tableVersion: REWARD_TABLE_VERSION,
    maximumPlace: 41,
    bands: [
      rewardBand(1, 1, { coin: 100_000_000, diamond: 5_000, ruby: 1_000, companyExp: 1_000, pointEach: 300, badgePackId: "world_badge_pack", badgePackCount: 10 }),
      rewardBand(2, 2, { coin: 50_000_000, diamond: 800, ruby: 500, companyExp: 500, pointEach: 150, badgePackId: "world_badge_pack", badgePackCount: 7 }),
      rewardBand(3, 3, { coin: 30_000_000, diamond: 500, ruby: 250, companyExp: 250, pointEach: 100, badgePackId: "world_badge_pack", badgePackCount: 5 }),
      rewardBand(4, 6, { coin: 5_000_000, diamond: 300, ruby: 150, companyExp: 100, pointEach: 50, badgePackId: "world_badge_pack", badgePackCount: 3 }),
      rewardBand(7, 10, { coin: 2_500_000, diamond: 100, ruby: 100, companyExp: 50, pointEach: 30, badgePackId: "world_badge_pack", badgePackCount: 2 }),
      rewardBand(11, 20, { coin: 1_000_000, diamond: 50, ruby: 50, companyExp: 25, pointEach: 15, badgePackId: "world_badge_pack", badgePackCount: 1 }),
      rewardBand(21, 41, { coin: 100_000, diamond: 5, ruby: 5, companyExp: 10, pointEach: 10, badgePackId: "world_badge_pack", badgePackCount: 1 }),
    ],
  },
  stage_progress: {
    rewardTableId: "reward-stage-progress-v1",
    tableVersion: REWARD_TABLE_VERSION,
    maximumPlace: 40,
    bands: [
      rewardBand(1, 40, { coin: 0, diamond: 0, ruby: 0, companyExp: 0, pointEach: 0 }),
    ],
  },
  casual_denden: {
    rewardTableId: "reward-casual-denden-v1",
    tableVersion: REWARD_TABLE_VERSION,
    maximumPlace: 20,
    bands: [
      rewardBand(1, 1, { coin: 150_000, diamond: 8, ruby: 4, companyExp: 4, pointEach: 8 }),
      rewardBand(2, 2, { coin: 100_000, diamond: 5, ruby: 3, companyExp: 3, pointEach: 6 }),
      rewardBand(3, 3, { coin: 70_000, diamond: 4, ruby: 2, companyExp: 2, pointEach: 5 }),
      rewardBand(4, 6, { coin: 40_000, diamond: 2, ruby: 1, companyExp: 1, pointEach: 3 }),
      rewardBand(7, 10, { coin: 25_000, diamond: 1, ruby: 1, companyExp: 1, pointEach: 2 }),
      rewardBand(11, 20, { coin: 10_000, diamond: 0, ruby: 0, companyExp: 0, pointEach: 1 }),
    ],
  },
  casual_mobutetsu: {
    rewardTableId: "reward-casual-mobutetsu-v1",
    tableVersion: REWARD_TABLE_VERSION,
    maximumPlace: 20,
    bands: [
      rewardBand(1, 1, { coin: 500_000, diamond: 20, ruby: 10, companyExp: 10, pointEach: 20 }),
      rewardBand(2, 2, { coin: 300_000, diamond: 12, ruby: 6, companyExp: 8, pointEach: 16 }),
      rewardBand(3, 3, { coin: 200_000, diamond: 8, ruby: 4, companyExp: 6, pointEach: 12 }),
      rewardBand(4, 6, { coin: 100_000, diamond: 5, ruby: 2, companyExp: 4, pointEach: 8 }),
      rewardBand(7, 10, { coin: 60_000, diamond: 3, ruby: 1, companyExp: 2, pointEach: 5 }),
      rewardBand(11, 20, { coin: 30_000, diamond: 1, ruby: 0, companyExp: 1, pointEach: 3 }),
    ],
  },
  casual_rockets: {
    rewardTableId: "reward-casual-rockets-placeholder-v1",
    tableVersion: REWARD_TABLE_VERSION,
    maximumPlace: 20,
    bands: [
      rewardBand(1, 20, { coin: 0, diamond: 0, ruby: 0, companyExp: 0, pointEach: 0 }),
    ],
  },
  casual_tempest: {
    rewardTableId: "reward-casual-tempest-placeholder-v1",
    tableVersion: REWARD_TABLE_VERSION,
    maximumPlace: 20,
    bands: [
      rewardBand(1, 20, { coin: 0, diamond: 0, ruby: 0, companyExp: 0, pointEach: 0 }),
    ],
  },
  championship: {
    rewardTableId: "reward-championship-v1",
    tableVersion: REWARD_TABLE_VERSION,
    maximumPlace: 20,
    bands: [
      {
        minPlace: 1,
        maxPlace: 1,
        rewards: {
          coin: 100_000_000,
          diamond: 10_000,
          ruby: 10_000,
          companyExp: 2_000,
          trainingPoints: { power: 0, tech: 0, mental: 0, shoot: 0 },
          badgePacks: {
            local_badge_pack: 30,
            national_badge_pack: 30,
            world_badge_pack: 30,
          },
          championshipPoints: 0,
          unlockFlags: {},
        },
      },
      rewardBand(2, 20, { coin: 0, diamond: 0, ruby: 0, companyExp: 0, pointEach: 0 }),
    ],
  },
});

export function getTournamentIcon(tournamentType) {
  const casual =
    getCasualCup(
      tournamentType,
    );
  if (casual) {
    return casual.logoImage;
  }
  const tier =
    normalizeCircuitTier(
      tournamentType,
    );
  if (tier === "national") return "icon/national.png";
  if (tier === "world") return "icon/world.png";
  if (tier === "championship") return "icon/champ.png";
  return "icon/local.png";
}

function historyYear(entry) {
  const direct = Number(entry?.circuitYear ?? entry?.gameDate?.year);
  if (Number.isInteger(direct)) return direct;
  const match = /^(\d{4})-/.exec(String(entry?.tournamentId ?? ""));
  return match ? Number(match[1]) : null;
}

function latestHistory(snapshot, tournamentTypes, year = snapshot.gameDate.year) {
  const types = new Set(
    Array.isArray(tournamentTypes) ? tournamentTypes : [tournamentTypes],
  );
  return [...(snapshot.tournament?.history ?? [])]
    .reverse()
    .find(
      (entry) =>
        types.has(entry.tournamentType) &&
        (historyYear(entry) === year || historyYear(entry) === null),
    ) ?? null;
}

function advancementTeamIds(history, key) {
  const value = history?.advancement?.[key];
  return Array.isArray(value) ? value : [];
}

function playerIncluded(history, key, playerTeamId) {
  return advancementTeamIds(history, key).includes(playerTeamId);
}

function historyIncludesTeam(history, teamId) {
  if (!history || !teamId) return false;
  if (
    (history.advancement?.participantSeeds ?? []).some(
      (seed) => seed.teamId === teamId || seed.isPlayer === true,
    )
  ) {
    return true;
  }
  return (history.rankings ?? []).some(
    (row) => row.teamId === teamId || row.isPlayer === true,
  );
}

function casualChoiceAlreadyUsed(snapshot, event) {
  if (!event.choiceGroupId) return false;
  return (snapshot.tournament?.history ?? []).some(
    (entry) => entry.choiceGroupId === event.choiceGroupId,
  );
}

export function createChampionshipStandings(
  snapshot,
  championshipYear = snapshot.gameDate.year,
) {
  const totals = new Map();
  for (
    let year = championshipYear - 2;
    year <= championshipYear;
    year += 1
  ) {
    const final = latestHistory(snapshot, "world_final", year);
    if (!final || !Array.isArray(final.rankings)) continue;
    for (const row of final.rankings) {
      const current = totals.get(row.teamId) ?? {
        teamId: row.teamId,
        teamName: row.teamName ?? row.teamId,
        teamLogo: row.teamLogo ?? null,
        championshipPoints: 0,
        worldWins: 0,
        topThree: 0,
        appearances: 0,
        recentPlace: 999,
        recentYear: 0,
      };
      current.championshipPoints += getChampionshipPoints(row.place);
      current.worldWins += row.place === 1 ? 1 : 0;
      current.topThree += row.place <= 3 ? 1 : 0;
      current.appearances += 1;
      if (year >= current.recentYear) {
        current.recentYear = year;
        current.recentPlace = row.place;
      }
      totals.set(row.teamId, current);
    }
  }

  return [...totals.values()]
    .sort((left, right) =>
      right.championshipPoints - left.championshipPoints ||
      right.worldWins - left.worldWins ||
      right.topThree - left.topThree ||
      right.appearances - left.appearances ||
      left.recentPlace - right.recentPlace ||
      left.teamId.localeCompare(right.teamId),
    )
    .map((row, index) => ({
      place: index + 1,
      ...row,
      qualified: index < FORMAL_CIRCUIT_RULES.championship.teams,
    }));
}

export function getTournamentEntryAvailability(snapshot, event) {
  const history = snapshot.tournament?.history ?? [];
  if (history.some((entry) => entry.tournamentId === event.tournamentId)) {
    return {
      eligible: false,
      reason: "この大会は記録済みです。",
      status: "completed",
    };
  }
  if (casualChoiceAlreadyUsed(snapshot, event)) {
    return {
      eligible: false,
      reason: "今月のカジュアル大会は参加済みです。",
      status: "completed",
    };
  }

  const type = event.tournamentType;
  const playerTeamId = snapshot.playerTeam.teamId;
  const year = event.year ?? snapshot.gameDate.year;

  if (type === "casual_denden") {
    return {
      eligible: true,
      reason: "企業ランク制限なし。今月は4大会から1つだけ選べます。",
      status: "optional",
    };
  }
  if (type === "casual_mobutetsu") {
    const eligible =
      getCompanyRankData(snapshot.company.rank).index >=
      getCompanyRankData("C1").index;
    return {
      eligible,
      reason: eligible
        ? "企業ランクC1以上。Worldゲスト1チームが参戦します。"
        : "企業ランクC1で解放されます。",
      status: eligible ? "optional" : "locked",
    };
  }
  if (type === "casual_rockets") {
    return {
      eligible: true,
      reason:
        "参加条件なし。ジョーダンロケッツ確定、National・Local上位・Worldゲストで20チームです。",
      status: "optional",
    };
  }
  if (type === "casual_tempest") {
    return {
      eligible: true,
      reason:
        "参加条件なし。ゴールデンテンペスト確定、World中心の20チームです。",
      status: "optional",
    };
  }
  if (type === "local") {
    return {
      eligible: true,
      reason: "年1回のMOB BR開幕戦です。",
      status: "scheduled",
    };
  }

  const local = latestHistory(snapshot, "local", year);
  const nationalWeek1 = latestHistory(snapshot, ["national_week_1"], year);
  const nationalWeek2 = latestHistory(snapshot, ["national_week_2", "national"], year);
  const nationalLastChance = latestHistory(snapshot, "national_last_chance", year);
  const worldWeek1 = latestHistory(snapshot, "world_qualifier_week_1", year);
  const worldWeek2 = latestHistory(snapshot, ["world_qualifier_week_2", "world_qualifier"], year);
  const worldLastChance = latestHistory(snapshot, "world_last_chance", year);

  if (type === "national_week_1") {
    const eligible =
      local?.qualified === true ||
      (Number.isInteger(local?.finalPlace) && local.finalPlace <= 10);
    return {
      eligible,
      reason: eligible
        ? "LOCAL上位10チームとしてNATIONALへ進出しています。"
        : "LOCAL上位10チームのみ出場できます。",
      status: eligible ? "qualified" : "observer",
    };
  }
  if (type === "national_week_2") {
    const stageReady =
      nationalWeek1?.status === "stage_in_progress" ||
      nationalWeek1?.nextStageId === "national_week_2" ||
      nationalWeek1?.qualified === true;
    const eligible =
      stageReady &&
      historyIncludesTeam(nationalWeek1, playerTeamId);
    return {
      eligible,
      reason: eligible
        ? "NATIONAL 1週目の順位とグループを引き継ぎます。"
        : stageReady
          ? "プレイヤーチームはNATIONALへ出場していないため、CPU結果を新聞へ記録します。"
          : "NATIONAL 1週目の参加データがありません。",
      status: eligible ? "stage_continue" : "observer",
    };
  }
  if (type === "national_last_chance") {
    const eligible = playerIncluded(
      nationalWeek2,
      "lastChanceTeamIds",
      playerTeamId,
    );
    return {
      eligible,
      reason: eligible
        ? "NATIONAL本戦9～28位としてLast Chanceへ進出しています。"
        : playerIncluded(nationalWeek2, "directQualifierTeamIds", playerTeamId)
          ? "World進出が確定しているため、結果のみ新聞へ記録されます。"
          : "NATIONAL本戦29位以下のため出場できません。",
      status: eligible ? "qualified" : "observer",
    };
  }
  if (type === "world_qualifier_week_1") {
    const representatives = [
      ...advancementTeamIds(nationalWeek2, "directQualifierTeamIds"),
      ...advancementTeamIds(nationalLastChance, "qualifierTeamIds"),
    ];
    const eligible = representatives.includes(playerTeamId);
    return {
      eligible,
      reason: eligible
        ? "National代表10チームとしてWorld予選へ出場します。"
        : "National代表10チームのみ出場できます。",
      status: eligible ? "qualified" : "observer",
    };
  }
  if (type === "world_qualifier_week_2") {
    const stageReady =
      worldWeek1?.status === "stage_in_progress" ||
      worldWeek1?.nextStageId === "world_qualifier_week_2" ||
      worldWeek1?.qualified === true;
    const eligible =
      stageReady &&
      historyIncludesTeam(worldWeek1, playerTeamId);
    return {
      eligible,
      reason: eligible
        ? "World予選1週目の40チームTOTALを引き継ぎます。"
        : stageReady
          ? "プレイヤーチームはWorld予選へ出場していないため、CPU結果を新聞へ記録します。"
          : "World予選1週目の参加データがありません。",
      status: eligible ? "stage_continue" : "observer",
    };
  }
  if (type === "world_last_chance") {
    const eligible = playerIncluded(
      worldWeek2,
      "lastChanceTeamIds",
      playerTeamId,
    );
    return {
      eligible,
      reason: eligible
        ? "World予選11～30位としてLast Chanceへ出場します。"
        : playerIncluded(worldWeek2, "directQualifierTeamIds", playerTeamId)
          ? "World Final進出が確定しています。"
          : "World予選31位以下のため出場できません。",
      status: eligible ? "qualified" : "observer",
    };
  }
  if (type === "world_final") {
    const finalists = [
      ...advancementTeamIds(worldWeek2, "directQualifierTeamIds"),
      ...advancementTeamIds(worldLastChance, "qualifierTeamIds"),
    ];
    const eligible = finalists.includes(playerTeamId);
    return {
      eligible,
      reason: eligible
        ? "World Final進出20チームに選出されています。"
        : "World Final進出条件を満たしていません。",
      status: eligible ? "qualified" : "observer",
    };
  }
  if (type === "championship") {
    const standings = createChampionshipStandings(snapshot, year);
    const playerRow = standings.find(
      (row) => row.teamId === playerTeamId,
    );
    const eligible = playerRow?.place <= 20;
    return {
      eligible,
      reason: eligible
        ? `直近3年間のChampionship Point ${playerRow.place}位で出場します。`
        : "直近3年間のWorld Final 3大会・Championship Point上位20チームが出場します。",
      status: eligible ? "qualified" : "observer",
    };
  }
  return {
    eligible: false,
    reason: "出場予定はありません。",
    status: "observer",
  };
}

export const TOURNAMENT_TYPE_PRESETS = deepFreeze({
  local: {
    tournamentName: "MOB BR LOCAL",
    totalTeams: 20,
    matches: FORMAL_CIRCUIT_RULES.local.matches,
    cpuPoolId: "cpu-local",
    openingThemeId: "local",
    qualificationRule: {
      ruleId: "local-top-10-to-national",
      type: "top_n",
      maximumPlace: 10,
      nextTournamentType: "national_week_1",
    },
    matchPointRule: { enabled: false },
    rewardTableKey: "local",
  },
  national_week_1: {
    tournamentName: "MOB BR NATIONAL",
    totalTeams: 40,
    matches: 9,
    cpuPoolId: "circuit-national",
    openingThemeId: "national",
    qualificationRule: {
      ruleId: "national-week-1-continuation",
      type: "stage_continuation",
      nextTournamentType: "national_week_2",
    },
    matchPointRule: { enabled: false },
    rewardTableKey: "stage_progress",
  },
  national_week_2: {
    tournamentName: "MOB BR NATIONAL",
    totalTeams: 40,
    matches: 9,
    cpuPoolId: "circuit-national",
    openingThemeId: "national",
    qualificationRule: {
      ruleId: "national-annual-top8-lc9-28",
      type: "national_final_stage",
      directMaximumPlace: 8,
      lastChanceMinimumPlace: 9,
      lastChanceMaximumPlace: 28,
    },
    matchPointRule: { enabled: false },
    rewardTableKey: "national",
  },
  national_last_chance: {
    tournamentName: "NATIONAL LAST CHANCE",
    totalTeams: 20,
    matches: FORMAL_CIRCUIT_RULES.nationalLastChance.maximumMatches,
    cpuPoolId: "circuit-national-last-chance",
    openingThemeId: "national",
    qualificationRule: {
      ruleId: "national-lc-two-qualifiers",
      type: "national_last_chance",
      nextTournamentType: "world_qualifier_week_1",
      qualifierCount: 2,
    },
    matchPointRule: {
      enabled: true,
      ruleId: "national-last-chance-match-point",
      threshold: FORMAL_CIRCUIT_RULES.nationalLastChance.threshold,
      winnerMustWinMatchAfterThreshold: true,
    },
    rewardTableKey: "national_last_chance",
  },
  world_qualifier_week_1: {
    tournamentName: "MOB BR WORLD QUALIFIER",
    totalTeams: 40,
    matches: 9,
    cpuPoolId: "circuit-world",
    openingThemeId: "world",
    qualificationRule: {
      ruleId: "world-week-1-continuation",
      type: "stage_continuation",
      nextTournamentType: "world_qualifier_week_2",
    },
    matchPointRule: { enabled: false },
    rewardTableKey: "stage_progress",
  },
  world_qualifier_week_2: {
    tournamentName: "MOB BR WORLD QUALIFIER",
    totalTeams: 40,
    matches: 9,
    cpuPoolId: "circuit-world",
    openingThemeId: "world",
    qualificationRule: {
      ruleId: "world-top10-lc11-30",
      type: "world_qualifier_final_stage",
      directMaximumPlace: 10,
      lastChanceMinimumPlace: 11,
      lastChanceMaximumPlace: 30,
    },
    matchPointRule: { enabled: false },
    rewardTableKey: "stage_progress",
  },
  world_last_chance: {
    tournamentName: "WORLD LAST CHANCE",
    totalTeams: 20,
    matches: FORMAL_CIRCUIT_RULES.worldLastChance.matches,
    cpuPoolId: "circuit-world-last-chance",
    openingThemeId: "world",
    qualificationRule: {
      ruleId: "world-last-chance-top10",
      type: "top_n",
      maximumPlace: 10,
      nextTournamentType: "world_final",
    },
    matchPointRule: { enabled: false },
    rewardTableKey: "stage_progress",
  },
  world_final: {
    tournamentName: "MOB BR WORLD FINAL",
    totalTeams: 20,
    matches: FORMAL_CIRCUIT_RULES.worldFinal.maximumMatches,
    cpuPoolId: "circuit-world-final",
    openingThemeId: "world",
    qualificationRule: { ruleId: "world-final", type: "final" },
    matchPointRule: {
      enabled: true,
      ruleId: "world-match-point-50",
      threshold: FORMAL_CIRCUIT_RULES.worldFinal.threshold,
      winnerMustWinMatchAfterThreshold: true,
    },
    rewardTableKey: "world",
  },
  casual_denden: {
    tournamentName: "デンデンカップ",
    totalTeams: 20,
    matches: CASUAL_TOURNAMENT_RULES.casual_denden.matches,
    cpuPoolId: "casual-denden",
    openingThemeId: "denden",
    qualificationRule: { ruleId: "casual-final", type: "final" },
    matchPointRule: { enabled: false },
    rewardTableKey: "casual_denden",
  },
  casual_mobutetsu: {
    tournamentName: "モブテツカップ",
    totalTeams: 20,
    matches: CASUAL_TOURNAMENT_RULES.casual_mobutetsu.matches,
    cpuPoolId: "casual-mobutetsu",
    openingThemeId: "mobutetsu",
    qualificationRule: { ruleId: "casual-final", type: "final" },
    matchPointRule: { enabled: false },
    rewardTableKey: "casual_mobutetsu",
  },
  casual_rockets: {
    tournamentName: "ジョーダンロケッツカップ",
    totalTeams: 20,
    matches: CASUAL_TOURNAMENT_RULES.casual_rockets.matches,
    cpuPoolId: "casual-rockets",
    openingThemeId: "rockets",
    qualificationRule: { ruleId: "casual-final", type: "final" },
    matchPointRule: { enabled: false },
    rewardTableKey: "casual_rockets",
  },
  casual_tempest: {
    tournamentName: "ゴールデンテンペストカップ",
    totalTeams: 20,
    matches: CASUAL_TOURNAMENT_RULES.casual_tempest.matches,
    cpuPoolId: "casual-tempest",
    openingThemeId: "tempest",
    qualificationRule: { ruleId: "casual-final", type: "final" },
    matchPointRule: { enabled: false },
    rewardTableKey: "casual_tempest",
  },
  championship: {
    tournamentName: "MOB BR CHAMPIONSHIP",
    totalTeams: 20,
    matches: 5,
    cpuPoolId: "championship-top-20",
    openingThemeId: "championship",
    qualificationRule: { ruleId: "championship-final", type: "final" },
    matchPointRule: { enabled: false },
    rewardTableKey: "championship",
  },

  // Compatibility aliases for pre-Generation 25 save data.
  national: {
    tournamentName: "MOB BR NATIONAL",
    totalTeams: 40,
    matches: 9,
    cpuPoolId: "circuit-national",
    openingThemeId: "national",
    qualificationRule: { ruleId: "legacy-national", type: "national_final_stage" },
    matchPointRule: { enabled: false },
    rewardTableKey: "national",
  },
  world_qualifier: {
    tournamentName: "MOB BR WORLD QUALIFIER",
    totalTeams: 40,
    matches: 9,
    cpuPoolId: "circuit-world",
    openingThemeId: "world",
    qualificationRule: { ruleId: "legacy-world-qualifier", type: "world_qualifier_final_stage" },
    matchPointRule: { enabled: false },
    rewardTableKey: "world",
  },
});

export class TournamentBridgeError extends Error {
  constructor(message, { code = "TOURNAMENT_BRIDGE_ERROR", cause } = {}) {
    super(message, { cause });
    this.name = "TournamentBridgeError";
    this.code = code;
  }
}

export class TournamentEntryValidationError extends TournamentBridgeError {
  constructor(message, code = "INVALID_TOURNAMENT_ENTRY") {
    super(message, { code });
    this.name = "TournamentEntryValidationError";
  }
}

export class TournamentResultValidationError extends TournamentBridgeError {
  constructor(message, code = "INVALID_TOURNAMENT_RESULT") {
    super(message, { code });
    this.name = "TournamentResultValidationError";
  }
}

function getRewardTableForTournamentType(tournamentType) {
  const preset = TOURNAMENT_TYPE_PRESETS[tournamentType];
  if (!preset) {
    throw new TournamentEntryValidationError(
      `Unsupported tournament type: ${tournamentType}`,
      "UNSUPPORTED_TOURNAMENT_TYPE",
    );
  }
  return REWARD_TABLES[preset.rewardTableKey];
}

export function resolvePlacementRewards(rewardTableSnapshot, place) {
  assertPositiveInteger(place, "Placement");
  const band = rewardTableSnapshot.bands.find(
    (entry) => place >= entry.minPlace && place <= entry.maxPlace,
  );
  if (!band) {
    throw new TournamentResultValidationError(
      `No reward band for placement ${place}.`,
      "REWARD_BAND_NOT_FOUND",
    );
  }
  const rewards = deepClone(band.rewards);
  if (rewardTableSnapshot.rewardTableId === "reward-world-v1") {
    rewards.championshipPoints = getChampionshipPoints(place);
  }
  return deepFreeze(rewards);
}

export function getAnnualTournamentSchedule(year) {
  assertPositiveInteger(year, "Schedule year");
  const events = [];
  for (let month = 1; month <= 12; month += 1) {
    for (let week = 1; week <= 4; week += 1) {
      events.push(
        ...getTournamentEventsForDate({ year, month, week }),
      );
    }
  }
  return deepFreeze(events);
}

function createSeasonNumber(event) {
  return event.tournamentType === "championship" ? null : 1;
}

function createSessionId(event, idFactory) {
  return `${event.tournamentId}-${idFactory("session")}`;
}

function createPlayerMemberSnapshot(player) {
  return {
    playerId: player.playerId,
    name: player.name,
    role: player.role === "SAP" ? "SUP" : player.role,
    image: player.image,
    characterRank: player.characterRank,
    characterRankValue: player.characterRankValue,
    stats: deepClone(player.stats),
    maxHp: player.maxHp,
    currentHp: player.currentHp,
    weapon: {
      ...deepClone(player.weapon),
      ammoCurrent: player.weapon.ammoMax,
    },
    skills: deepClone(player.skills),
    specialAbilities: deepClone(player.specialAbilities),
    temporaryBonuses: deepClone(player.temporaryBonuses ?? {}),
    careerRecord: deepClone(player.careerRecord),
  };
}

function createStrategyInventory(snapshot) {
  return STRATEGIES.map((strategy) => {
    const persistentOwnedCount =
      strategy.rank === "D"
        ? 1
        : snapshot.inventory.strategies[strategy.id] ?? 0;
    return {
      strategyId: strategy.id,
      name: strategy.name,
      rank: strategy.rank,
      icon: strategy.icon,
      effect: deepClone(strategy.effect),
      persistentOwnedCount,
      tournamentRemaining:
        strategy.rank === "D" ? null : persistentOwnedCount,
      unlimited: strategy.rank === "D",
    };
  });
}

function createCarryItems(snapshot) {
  const slots = snapshot.inventory.carryBag.slots;
  return slots.map((itemId, slotIndex) => {
    if (!itemId) {
      return null;
    }
    const item = getItem(itemId);
    return {
      slotIndex,
      itemId,
      name: item.name,
      image: item.image,
      quantity: 1,
      source: "main_carry_bag",
      masterVersion: ITEM_MASTER_VERSION,
    };
  });
}

function countAwardsForPlayer(awards, playerId) {
  return awards.filter((award) => award.playerId === playerId).length;
}

function createRecordSnapshot(snapshot) {
  return {
    championshipPoints: snapshot.tournament.championshipPoints,
    totalKills: snapshot.records.totalKills,
    totalAssists: snapshot.records.totalAssists,
    totalDamage: snapshot.records.totalDamage,
    totalDamageTaken: snapshot.records.totalDamageTaken,
    tournamentWins: snapshot.records.tournamentWins,
    tournamentsEntered: snapshot.records.tournamentsEntered,
    playerAwards: Object.fromEntries(
      snapshot.playerTeam.members.map((player) => [
        player.playerId,
        countAwardsForPlayer(
          snapshot.tournament.awards ?? [],
          player.playerId,
        ),
      ]),
    ),
    memberCareer: deepClone(snapshot.records.memberCareer),
    championshipPointHistory: deepClone(
      snapshot.tournament.championshipPointHistory ?? [],
    ),
  };
}

function createSaveProjection(snapshot) {
  return {
    saveSlotId: snapshot.saveSlotId,
    gameDate: snapshot.gameDate,
    company: snapshot.company,
    playerTeam: snapshot.playerTeam,
    resources: snapshot.resources,
    trainingPoints: snapshot.trainingPoints,
    collectionBonuses: snapshot.collectionBonuses,
    inventory: snapshot.inventory,
    coaches: snapshot.coaches,
    records: snapshot.records,
    unlockFlags: snapshot.unlockFlags,
    settings: snapshot.settings,
    tournamentHistory: snapshot.tournament.history,
    processedResultSignatures:
      snapshot.tournament.processedResultSignatures,
    processedResultIds: snapshot.tournament.processedResultIds,
    processedEntryIds: snapshot.tournament.processedEntryIds ?? [],
    championshipPoints: snapshot.tournament.championshipPoints,
  };
}

export function calculateEntrySnapshotHash(snapshot) {
  return calculateChecksum(createSaveProjection(snapshot));
}

function createEntryChecksumPayload(entry) {
  const clone = deepClone(entry);
  delete clone.checksum;
  return clone;
}

export function calculateTournamentEntryChecksum(entry) {
  return calculateChecksum(createEntryChecksumPayload(entry));
}

function rankingsTeamIds(history, minimumPlace, maximumPlace) {
  return (history?.rankings ?? [])
    .filter(
      (row) =>
        Number.isInteger(row.place) &&
        row.place >= minimumPlace &&
        row.place <= maximumPlace,
    )
    .sort((left, right) => left.place - right.place)
    .map((row) => row.teamId);
}

function participantSeedsFromIds(
  teamIds,
  {
    playerTeamId,
    groupAssignments = null,
    guestTeamId = null,
  },
) {
  const groupByTeamId = {};
  if (groupAssignments) {
    for (const [groupId, ids] of Object.entries(groupAssignments)) {
      for (const teamId of ids) groupByTeamId[teamId] = groupId;
    }
  }
  return teamIds.map((teamId, index) => ({
    teamId,
    sourcePool:
      teamId === playerTeamId
        ? "player"
        : sourcePoolForTeamId(teamId),
    isPlayer: teamId === playerTeamId,
    groupId: groupByTeamId[teamId] ?? null,
    seedIndex: index + 1,
    guest: teamId === guestTeamId,
  }));
}

function historyParticipantSeeds(history, playerTeamId) {
  const stored = history?.advancement?.participantSeeds;
  if (Array.isArray(stored) && stored.length > 0) {
    return deepClone(stored);
  }
  const ids = (history?.rankings ?? []).map((row) => row.teamId);
  return participantSeedsFromIds(ids, { playerTeamId });
}

function requireHistory(snapshot, types, year, label) {
  const history = latestHistory(snapshot, types, year);
  if (!history) {
    throw new TournamentEntryValidationError(
      `${label}の結果データが見つかりません。`,
      "CIRCUIT_SOURCE_RESULT_MISSING",
    );
  }
  return history;
}

function uniqueTeamIds(teamIds, expectedCount, label) {
  const unique = [...new Set(teamIds.filter(Boolean))];
  if (unique.length !== expectedCount) {
    throw new TournamentEntryValidationError(
      `${label} must contain ${expectedCount} unique teams; received ${unique.length}.`,
      "CIRCUIT_PARTICIPANT_COUNT_MISMATCH",
    );
  }
  return unique;
}

export function createTournamentCircuitContext(snapshot, event) {
  const type = event.tournamentType;
  const year = event.year ?? snapshot.gameDate.year;
  const playerTeamId = snapshot.playerTeam.teamId;
  const seed = `${year}:${event.stageId}:${snapshot.saveSlotId}`;
  const base = {
    circuitYear: year,
    circuitStageId: event.circuitStageId ?? event.stageId,
    stagePart: event.stagePart ?? null,
    choiceGroupId: event.choiceGroupId ?? null,
    optional: event.optional === true,
    recordOnlyWhenEntered: event.recordOnlyWhenEntered === true,
    participantSeeds: null,
    groupAssignments: null,
    matchPlan: null,
    initialTotals: {},
    guestTeamId: null,
    sourceTournamentIds: [],
    championshipStandings: null,
  };

  if (type === "local") {
    return base;
  }

  if (type === "championship") {
    const standings = createChampionshipStandings(snapshot, year);
    const teamIds = uniqueTeamIds(
      standings
        .slice(0, FORMAL_CIRCUIT_RULES.championship.teams)
        .map((row) => row.teamId),
      FORMAL_CIRCUIT_RULES.championship.teams,
      "CHAMPIONSHIP participants",
    );
    return {
      ...base,
      sourceTournamentIds: [
        ...new Set(
          snapshot.tournament.history
            .filter((entry) => {
              const entryYear = historyYear(entry);
              return (
                entry.tournamentType === "world_final" &&
                entryYear >= year - 2 &&
                entryYear <= year
              );
            })
            .map((entry) => entry.tournamentId),
        ),
      ],
      participantSeeds: participantSeedsFromIds(teamIds, { playerTeamId }),
      matchPlan: createSimpleMatchPlan(
        teamIds,
        TOURNAMENT_TYPE_PRESETS.championship.matches,
      ),
      championshipStandings: standings.slice(0, 20),
    };
  }

  if (type === "casual_denden") {
    const localIds = selectTeamIds(
      LOCAL_CPU_TEAMS,
      CASUAL_TOURNAMENT_RULES.casual_denden.localSlots,
      `${seed}:local`,
    );
    const lowerNationalPool = NATIONAL_CPU_TEAMS.slice(20);
    const nationalIds = selectTeamIds(
      lowerNationalPool,
      CASUAL_TOURNAMENT_RULES.casual_denden.nationalLowerSlots,
      `${seed}:national-lower`,
    );
    const teamIds = [playerTeamId, ...localIds, ...nationalIds];
    return {
      ...base,
      participantSeeds: participantSeedsFromIds(teamIds, { playerTeamId }),
      matchPlan: createSimpleMatchPlan(
        teamIds,
        CASUAL_TOURNAMENT_RULES.casual_denden.matches,
      ),
    };
  }

  if (type === "casual_mobutetsu") {
    const strongPool = [
      ...LOCAL_CPU_TEAMS.slice(10),
      ...NATIONAL_CPU_TEAMS.slice(0, 24),
    ];
    const strongIds = selectTeamIds(
      strongPool,
      CASUAL_TOURNAMENT_RULES.casual_mobutetsu.localNationalStrongSlots,
      `${seed}:strong`,
    );
    const worldGuestId = selectTeamIds(
      getWorldCpuTeamsForYear(year),
      1,
      `${seed}:world-guest`,
    )[0];
    const teamIds = [playerTeamId, ...strongIds, worldGuestId];
    return {
      ...base,
      guestTeamId: worldGuestId,
      participantSeeds: participantSeedsFromIds(teamIds, {
        playerTeamId,
        guestTeamId: worldGuestId,
      }),
      matchPlan: createSimpleMatchPlan(
        teamIds,
        CASUAL_TOURNAMENT_RULES.casual_mobutetsu.matches,
      ),
    };
  }

  if (type === "casual_rockets") {
    const fixedNationalId =
      CASUAL_TOURNAMENT_RULES
        .casual_rockets
        .fixedNationalTeamId;
    const additionalNational =
      selectTeamIds(
        NATIONAL_CPU_TEAMS.filter(
          (team) =>
            team.teamId !==
            fixedNationalId,
        ),
        CASUAL_TOURNAMENT_RULES
          .casual_rockets
          .additionalNationalSlots,
        `${seed}:rockets-national`,
      );
    const localTopIds =
      selectTeamIds(
        LOCAL_CPU_TEAMS.slice(
          0,
          12,
        ),
        CASUAL_TOURNAMENT_RULES
          .casual_rockets
          .localTopSlots,
        `${seed}:rockets-local-top`,
      );
    const worldGuestIds =
      selectTeamIds(
        getWorldCpuTeamsForYear(
          year,
        ),
        CASUAL_TOURNAMENT_RULES
          .casual_rockets
          .worldGuestSlots,
        `${seed}:rockets-world`,
      );
    const teamIds = [
      playerTeamId,
      fixedNationalId,
      ...additionalNational,
      ...localTopIds,
      ...worldGuestIds,
    ];
    return {
      ...base,
      fixedTeamIds: [
        fixedNationalId,
      ],
      guestTeamIds:
        worldGuestIds,
      participantSeeds:
        participantSeedsFromIds(
          teamIds,
          {
            playerTeamId,
            guestTeamIds:
              worldGuestIds,
          },
        ),
      matchPlan:
        createSimpleMatchPlan(
          teamIds,
          CASUAL_TOURNAMENT_RULES
            .casual_rockets
            .matches,
        ),
    };
  }

  if (type === "casual_tempest") {
    const fixedWorldId =
      CASUAL_TOURNAMENT_RULES
        .casual_tempest
        .fixedWorldTeamId;
    const worldPool =
      getWorldCpuTeamsForYear(
        year,
      );
    const additionalWorld =
      selectTeamIds(
        worldPool.filter(
          (team) =>
            team.teamId !==
            fixedWorldId,
        ),
        CASUAL_TOURNAMENT_RULES
          .casual_tempest
          .additionalWorldSlots,
        `${seed}:tempest-world`,
      );
    const teamIds = [
      playerTeamId,
      fixedWorldId,
      ...additionalWorld,
    ];
    return {
      ...base,
      fixedTeamIds: [
        fixedWorldId,
      ],
      participantSeeds:
        participantSeedsFromIds(
          teamIds,
          {
            playerTeamId,
          },
        ),
      matchPlan:
        createSimpleMatchPlan(
          teamIds,
          CASUAL_TOURNAMENT_RULES
            .casual_tempest
            .matches,
        ),
    };
  }

  if (type === "national_week_1") {
    const local = requireHistory(snapshot, "local", year, "LOCAL");
    const localQualifierIds = uniqueTeamIds(
      advancementTeamIds(local, "directQualifierTeamIds").length > 0
        ? advancementTeamIds(local, "directQualifierTeamIds")
        : rankingsTeamIds(local, 1, 10),
      10,
      "LOCAL qualifiers",
    );
    const nationalIds = selectTeamIds(
      NATIONAL_CPU_TEAMS,
      30,
      `${seed}:national-30`,
      localQualifierIds,
    );
    const teamIds = uniqueTeamIds(
      [...localQualifierIds, ...nationalIds],
      40,
      "NATIONAL participants",
    );
    const groupAssignments = createGroupAssignments(teamIds, {
      playerTeamId,
      seed,
    });
    return {
      ...base,
      sourceTournamentIds: [local.tournamentId],
      groupAssignments,
      participantSeeds: participantSeedsFromIds(teamIds, {
        playerTeamId,
        groupAssignments,
      }),
      matchPlan: createGroupMatchPlan(
        groupAssignments,
        FORMAL_CIRCUIT_RULES.national.week1Sections,
        { matchNumberOffset: 0 },
      ),
    };
  }

  if (type === "national_week_2") {
    const week1 = requireHistory(
      snapshot,
      "national_week_1",
      year,
      "NATIONAL 1週目",
    );
    const seeds = historyParticipantSeeds(week1, playerTeamId);
    const groupAssignments =
      week1.advancement?.groupAssignments;
    if (!groupAssignments || seeds.length !== 40) {
      throw new TournamentEntryValidationError(
        "NATIONAL 1週目のグループデータが不完全です。",
        "CIRCUIT_GROUP_DATA_MISSING",
      );
    }
    return {
      ...base,
      sourceTournamentIds: [week1.tournamentId],
      participantSeeds: seeds,
      groupAssignments: deepClone(groupAssignments),
      initialTotals: deepClone(
        week1.advancement?.circuitTotals ?? {},
      ),
      matchPlan: createGroupMatchPlan(
        groupAssignments,
        FORMAL_CIRCUIT_RULES.national.week2Sections,
        { matchNumberOffset: 9 },
      ),
    };
  }

  if (type === "national_last_chance") {
    const national = requireHistory(
      snapshot,
      ["national_week_2", "national"],
      year,
      "NATIONAL本戦",
    );
    const teamIds = uniqueTeamIds(
      advancementTeamIds(national, "lastChanceTeamIds").length > 0
        ? advancementTeamIds(national, "lastChanceTeamIds")
        : rankingsTeamIds(national, 9, 28),
      20,
      "NATIONAL Last Chance participants",
    );
    return {
      ...base,
      sourceTournamentIds: [national.tournamentId],
      participantSeeds: participantSeedsFromIds(teamIds, { playerTeamId }),
      matchPlan: createSimpleMatchPlan(
        teamIds,
        FORMAL_CIRCUIT_RULES.nationalLastChance.maximumMatches,
      ),
    };
  }

  if (type === "world_qualifier_week_1") {
    const national = requireHistory(
      snapshot,
      ["national_week_2", "national"],
      year,
      "NATIONAL本戦",
    );
    const lastChance = requireHistory(
      snapshot,
      "national_last_chance",
      year,
      "NATIONAL Last Chance",
    );
    const representatives = uniqueTeamIds(
      [
        ...advancementTeamIds(national, "directQualifierTeamIds"),
        ...advancementTeamIds(lastChance, "qualifierTeamIds"),
      ],
      10,
      "National representatives",
    );
    const worldIds = selectTeamIds(
      getWorldCpuTeamsForYear(year),
      30,
      `${seed}:world-30`,
      representatives,
    );
    const teamIds = uniqueTeamIds(
      [...representatives, ...worldIds],
      40,
      "WORLD qualifier participants",
    );
    const groupAssignments = createGroupAssignments(teamIds, {
      playerTeamId,
      seed,
    });
    return {
      ...base,
      sourceTournamentIds: [national.tournamentId, lastChance.tournamentId],
      participantSeeds: participantSeedsFromIds(teamIds, {
        playerTeamId,
        groupAssignments,
      }),
      groupAssignments,
      matchPlan: createGroupMatchPlan(
        groupAssignments,
        FORMAL_CIRCUIT_RULES.worldQualifier.week1Sections,
        { matchNumberOffset: 0 },
      ),
    };
  }

  if (type === "world_qualifier_week_2") {
    const week1 = requireHistory(
      snapshot,
      "world_qualifier_week_1",
      year,
      "WORLD予選1週目",
    );
    const seeds = historyParticipantSeeds(week1, playerTeamId);
    const groupAssignments = week1.advancement?.groupAssignments;
    if (!groupAssignments || seeds.length !== 40) {
      throw new TournamentEntryValidationError(
        "WORLD予選1週目のグループデータが不完全です。",
        "CIRCUIT_GROUP_DATA_MISSING",
      );
    }
    return {
      ...base,
      sourceTournamentIds: [week1.tournamentId],
      participantSeeds: seeds,
      groupAssignments: deepClone(groupAssignments),
      initialTotals: deepClone(week1.advancement?.circuitTotals ?? {}),
      matchPlan: createGroupMatchPlan(
        groupAssignments,
        FORMAL_CIRCUIT_RULES.worldQualifier.week2Sections,
        { matchNumberOffset: 9 },
      ),
    };
  }

  if (type === "world_last_chance") {
    const qualifier = requireHistory(
      snapshot,
      ["world_qualifier_week_2", "world_qualifier"],
      year,
      "WORLD予選",
    );
    const teamIds = uniqueTeamIds(
      advancementTeamIds(qualifier, "lastChanceTeamIds").length > 0
        ? advancementTeamIds(qualifier, "lastChanceTeamIds")
        : rankingsTeamIds(qualifier, 11, 30),
      20,
      "WORLD Last Chance participants",
    );
    return {
      ...base,
      sourceTournamentIds: [qualifier.tournamentId],
      participantSeeds: participantSeedsFromIds(teamIds, { playerTeamId }),
      matchPlan: createSimpleMatchPlan(
        teamIds,
        FORMAL_CIRCUIT_RULES.worldLastChance.matches,
      ),
    };
  }

  if (type === "world_final") {
    const qualifier = requireHistory(
      snapshot,
      ["world_qualifier_week_2", "world_qualifier"],
      year,
      "WORLD予選",
    );
    const lastChance = requireHistory(
      snapshot,
      "world_last_chance",
      year,
      "WORLD Last Chance",
    );
    const teamIds = uniqueTeamIds(
      [
        ...advancementTeamIds(qualifier, "directQualifierTeamIds"),
        ...advancementTeamIds(lastChance, "qualifierTeamIds"),
      ],
      20,
      "WORLD Final participants",
    );
    return {
      ...base,
      sourceTournamentIds: [qualifier.tournamentId, lastChance.tournamentId],
      participantSeeds: participantSeedsFromIds(teamIds, { playerTeamId }),
      matchPlan: createSimpleMatchPlan(
        teamIds,
        FORMAL_CIRCUIT_RULES.worldFinal.maximumMatches,
      ),
    };
  }

  return base;
}

export function createTournamentEntryData(
  snapshot,
  event,
  {
    clock = () => new Date(),
    idFactory = createGeneratedId,
    tournamentOverrides = {},
  } = {},
) {
  assertPlainObject(snapshot, "Save snapshot");
  assertPlainObject(event, "Tournament event");
  const tournamentType = assertNonEmptyString(
    event.tournamentType,
    "Tournament type",
    100,
  );
  const preset = TOURNAMENT_TYPE_PRESETS[tournamentType];
  if (!preset) {
    throw new TournamentEntryValidationError(
      `Unsupported tournament type: ${tournamentType}`,
      "UNSUPPORTED_TOURNAMENT_TYPE",
    );
  }

  if (
    snapshot.tournament.activeEntryId !== null &&
    snapshot.tournament.activeEntryId !== undefined
  ) {
    throw new TournamentEntryValidationError(
      "An unfinished tournament entry already exists.",
      "ACTIVE_TOURNAMENT_EXISTS",
    );
  }

  const members = snapshot.playerTeam.members.map(createPlayerMemberSnapshot);
  const rewardTableSnapshot = deepClone(
    getRewardTableForTournamentType(tournamentType),
  );
  const createdAt = nowIso(clock);
  const entryId = idFactory("entry");
  const seasonNumber = createSeasonNumber(event);
  const seasonId =
    event.seasonId ??
    (seasonNumber === null
      ? `${event.year}-championship`
      : `${event.year}-sp${seasonNumber}`);
  const circuitContext = createTournamentCircuitContext(
    snapshot,
    event,
  );
  const totalTeams =
    tournamentOverrides.totalTeams ??
    circuitContext.participantSeeds?.length ??
    preset.totalTeams;

  const entry = {
    schemaVersion: TOURNAMENT_ENTRY_SCHEMA_VERSION,
    bridgeVersion: TOURNAMENT_BRIDGE_VERSION,
    entryId,
    entrySnapshotHash: calculateEntrySnapshotHash(snapshot),
    saveSlotId: snapshot.saveSlotId,
    createdAt,
    gameDate: {
      year: event.year ?? snapshot.gameDate.year,
      month: event.month ?? snapshot.gameDate.month,
      week: event.week ?? snapshot.gameDate.week,
      seasonId,
      seasonNumber,
    },
    tournament: {
      tournamentId:
        event.tournamentId ?? `${snapshot.gameDate.year}-${event.stageId}`,
      tournamentType,
      tournamentName:
        tournamentOverrides.tournamentName ?? preset.tournamentName,
      stageName: event.stageName ?? event.stageId,
      stageId: event.stageId,
      sessionId:
        tournamentOverrides.sessionId ?? createSessionId(event, idFactory),
      groupId: tournamentOverrides.groupId ?? null,
      totalTeams,
      matches:
        tournamentOverrides.matches ??
        preset.matches ??
        TOURNAMENT_SESSION_RULES.matchesPerSession,
      roundTargets: deepClone(
        tournamentOverrides.roundTargets ??
          TOURNAMENT_SESSION_RULES.simulationRoundTargets,
      ),
      roundEncounterRates: deepClone(
        tournamentOverrides.roundEncounterRates ??
          TOURNAMENT_SESSION_RULES.roundEncounterRates,
      ),
      qualificationRule: deepClone(
        tournamentOverrides.qualificationRule ?? preset.qualificationRule,
      ),
      matchPointRule: deepClone(
        tournamentOverrides.matchPointRule ?? preset.matchPointRule,
      ),
      rewardTableId: rewardTableSnapshot.rewardTableId,
      rewardTableVersion: rewardTableSnapshot.tableVersion,
      rewardTableSnapshot,
      cpuPoolId: tournamentOverrides.cpuPoolId ?? preset.cpuPoolId,
      openingThemeId:
        tournamentOverrides.openingThemeId ?? preset.openingThemeId,
      includesLastChance: event.includesLastChance === true,
      absentPlayerFastSimulation: true,
      circuitTier: normalizeCircuitTier(tournamentType),
      circuitYear: circuitContext.circuitYear,
      circuitStageId: circuitContext.circuitStageId,
      stagePart: circuitContext.stagePart,
      choiceGroupId: circuitContext.choiceGroupId,
      optional: circuitContext.optional,
      recordOnlyWhenEntered: circuitContext.recordOnlyWhenEntered,
      participantSeeds: deepClone(circuitContext.participantSeeds),
      groupAssignments: deepClone(circuitContext.groupAssignments),
      matchPlan: deepClone(circuitContext.matchPlan),
      initialTotals: deepClone(circuitContext.initialTotals),
      guestTeamId: circuitContext.guestTeamId,
      sourceTournamentIds: deepClone(circuitContext.sourceTournamentIds),
      championshipStandings: deepClone(
        circuitContext.championshipStandings,
      ),
      suppressAwards: [
        "national_week_1",
        "world_qualifier_week_1",
      ].includes(tournamentType),
    },
    company: {
      companyId: snapshot.company.companyId,
      companyName: snapshot.company.companyName,
      companyRank: snapshot.company.rank,
      companyRankIndex: snapshot.company.rankIndex,
      companyExp: snapshot.company.exp,
      badgeId: snapshot.company.badgeId,
      badgeImage: snapshot.company.badgeImage,
      roomId: snapshot.company.activeRoomId,
    },
    guide: {
      showPinkTournamentIntro:
        snapshot.ui?.guideFlags?.[
          `tournament:${tournamentType}`
        ] !== true,
      pinkImage:
        "icon/pink.png",
    },
    playerTeam: {
      teamId: snapshot.playerTeam.teamId,
      teamName: snapshot.playerTeam.teamName,
      teamLogo: snapshot.playerTeam.teamLogo,
      companyName: snapshot.playerTeam.companyName,
      members,
      teamCardBonus: snapshot.collectionBonuses.weeklyCoinRate,
      teamBadgeBonus: snapshot.collectionBonuses.trainingPointRate,
      currentForm: snapshot.playerTeam.currentForm,
      tournamentSeed:
        snapshot.playerTeam.tournamentSeed ?? idFactory("seed"),
    },
    resourcesSnapshot: {
      coin: snapshot.resources.coin,
      diamond: snapshot.resources.diamond,
      ruby: snapshot.resources.ruby,
      trainingPoints: deepClone(snapshot.trainingPoints),
    },
    strategyInventory: createStrategyInventory(snapshot),
    carryItems: createCarryItems(snapshot),
    carryBag: {
      capacity: snapshot.inventory.carryBag.capacity,
      slotCount: snapshot.inventory.carryBag.slots.length,
      itemMasterVersion: ITEM_MASTER_VERSION,
    },
    coaches: deepClone(snapshot.coaches),
    collectionBonuses: deepClone(snapshot.collectionBonuses),
    recordSnapshot: createRecordSnapshot(snapshot),
    settings: deepClone(snapshot.settings),
    masterVersions: {
      gameData: GAME_DATA_VERSION,
      battleConfig: BATTLE_CONFIG_VERSION,
      itemMaster: ITEM_MASTER_VERSION,
      strategyMaster: STRATEGY_MASTER_VERSION,
      saveMasterVersions: deepClone(snapshot.masterVersions),
    },
    returnContract: {
      resultSchemaVersion: TOURNAMENT_RESULT_SCHEMA_VERSION,
      outputStorageKey: STORAGE_KEYS.tournamentOutput,
      resumeStorageKey: STORAGE_KEYS.tournamentResume,
      ackStorageKey:
        STORAGE_KEYS.tournamentAck ?? "mob_br_tournament_ack_v1",
      requireResultSignature: true,
      requireChecksum: true,
      rewardsAppliedBy: "main_system_only",
    },
    checksum: null,
  };

  entry.checksum = calculateTournamentEntryChecksum(entry);
  validateTournamentEntryData(entry);
  validateTournamentEntryAgainstSave(entry, snapshot);
  return deepFreeze(entry);
}

function validateMember(member) {
  assertPlainObject(member, "Tournament member");
  assertNonEmptyString(member.playerId, "Player ID", 100);
  assertNonEmptyString(member.name, "Player name", 100);
  if (!ROLE_IDS.includes(member.role)) {
    throw new TournamentEntryValidationError(
      `Invalid player role: ${member.role}`,
      "INVALID_PLAYER_ROLE",
    );
  }
  assertPlainObject(member.stats, "Player stats");
  for (const statId of STAT_IDS) {
    const value = member.stats[statId];
    if (!Number.isInteger(value) || value < 1 || value > 73) {
      throw new TournamentEntryValidationError(
        `Invalid ${statId} for ${member.playerId}.`,
        "INVALID_PLAYER_STAT",
      );
    }
  }
  assertPlainObject(member.weapon, "Player weapon");
  if (member.weapon.ammoMax !== 12 || member.weapon.ammoCurrent !== 12) {
    throw new TournamentEntryValidationError(
      "Tournament weapon ammo must start at 12.",
      "INVALID_WEAPON_AMMO",
    );
  }
  for (const key of ["close", "mid", "far", "fireRate", "reload"]) {
    const value = member.weapon.internalValues?.[key];
    if (!Number.isInteger(value) || value < 0 || value > 72) {
      throw new TournamentEntryValidationError(
        `Invalid weapon value ${key}.`,
        "INVALID_WEAPON_VALUE",
      );
    }
  }
  if (!Array.isArray(member.skills) || member.skills.length !== 3) {
    throw new TournamentEntryValidationError(
      `${member.role} must have exactly three skills.`,
      "INVALID_PLAYER_SKILLS",
    );
  }
  for (const skill of member.skills) {
    if (
      !Number.isInteger(skill.level ?? 1) ||
      (skill.level ?? 1) < 1 ||
      (skill.level ?? 1) > 5
    ) {
      throw new TournamentEntryValidationError(
        `Invalid skill level for ${member.playerId}.`,
        "INVALID_PLAYER_SKILL_LEVEL",
      );
    }
    if (
      skill.customName !== null &&
      skill.customName !== undefined &&
      (
        typeof skill.customName !== "string" ||
        skill.customName.trim().length > 24
      )
    ) {
      throw new TournamentEntryValidationError(
        `Invalid custom skill name for ${member.playerId}.`,
        "INVALID_PLAYER_SKILL_NAME",
      );
    }
  }
  if (!Array.isArray(member.specialAbilities)) {
    throw new TournamentEntryValidationError(
      "Special abilities must be an array.",
      "INVALID_SPECIAL_ABILITIES",
    );
  }
}

export function validateTournamentEntryData(entry) {
  assertPlainObject(entry, "Tournament entry");
  if (entry.schemaVersion !== TOURNAMENT_ENTRY_SCHEMA_VERSION) {
    throw new TournamentEntryValidationError(
      `Unsupported entry schema: ${entry.schemaVersion}`,
      "UNSUPPORTED_ENTRY_SCHEMA",
    );
  }
  assertNonEmptyString(entry.entryId, "Entry ID", 300);
  assertNonEmptyString(entry.entrySnapshotHash, "Entry snapshot hash", 100);
  assertNonEmptyString(entry.saveSlotId, "Save slot ID", 100);
  assertNonEmptyString(entry.createdAt, "Created timestamp", 100);
  assertPlainObject(entry.tournament, "Tournament definition");
  assertNonEmptyString(entry.tournament.tournamentId, "Tournament ID", 300);
  assertNonEmptyString(entry.tournament.tournamentType, "Tournament type", 100);
  if (!TOURNAMENT_TYPE_PRESETS[entry.tournament.tournamentType]) {
    throw new TournamentEntryValidationError(
      "Tournament type is not supported.",
      "UNSUPPORTED_TOURNAMENT_TYPE",
    );
  }
  assertPositiveInteger(entry.tournament.totalTeams, "Total teams");
  assertPositiveInteger(entry.tournament.matches, "Match count");
  if (!Array.isArray(entry.tournament.roundTargets)) {
    throw new TournamentEntryValidationError(
      "Round targets must be an array.",
      "INVALID_ROUND_TARGETS",
    );
  }
  if (
    entry.tournament.rewardTableVersion !== REWARD_TABLE_VERSION ||
    entry.tournament.rewardTableSnapshot?.tableVersion !==
      REWARD_TABLE_VERSION
  ) {
    throw new TournamentEntryValidationError(
      "Reward table version does not match the main system.",
      "REWARD_TABLE_VERSION_MISMATCH",
    );
  }

  assertPlainObject(entry.playerTeam, "Player team");
  if (
    !Array.isArray(entry.playerTeam.members) ||
    entry.playerTeam.members.length !== 3
  ) {
    throw new TournamentEntryValidationError(
      "Player team must contain exactly three members.",
      "INVALID_TEAM_SIZE",
    );
  }
  entry.playerTeam.members.forEach(validateMember);
  const roles = entry.playerTeam.members.map((member) => member.role);
  if (
    new Set(roles).size !== 3 ||
    ROLE_IDS.some((role) => !roles.includes(role))
  ) {
    throw new TournamentEntryValidationError(
      "Player team must contain one IGL, ATK, and SUP.",
      "INVALID_TEAM_ROLES",
    );
  }

  if (
    !Array.isArray(entry.strategyInventory) ||
    entry.strategyInventory.length !== STRATEGIES.length
  ) {
    throw new TournamentEntryValidationError(
      "All 50 strategies must be included.",
      "STRATEGY_MASTER_MISMATCH",
    );
  }
  const strategyIds = new Set(entry.strategyInventory.map((item) => item.strategyId));
  if (
    strategyIds.size !== STRATEGIES.length ||
    STRATEGIES.some((strategy) => !strategyIds.has(strategy.id))
  ) {
    throw new TournamentEntryValidationError(
      "Strategy IDs do not match the main master.",
      "STRATEGY_MASTER_MISMATCH",
    );
  }

  if (!Array.isArray(entry.carryItems)) {
    throw new TournamentEntryValidationError(
      "Carry items must be an array.",
      "INVALID_CARRY_ITEMS",
    );
  }
  if (
    entry.carryItems.length !== entry.carryBag.slotCount ||
    entry.carryItems.length !== entry.carryBag.capacity ||
    entry.carryItems.length < 5 ||
    entry.carryItems.length > 10
  ) {
    throw new TournamentEntryValidationError(
      "Carry bag slot count must match the main save capacity (5-10).",
      "INVALID_CARRY_BAG_CAPACITY",
    );
  }
  for (const item of entry.carryItems) {
    if (item === null) continue;
    getItem(item.itemId);
    if (item.quantity !== 1) {
      throw new TournamentEntryValidationError(
        "Each carry-bag slot must contain one item unit.",
        "INVALID_CARRY_ITEM_QUANTITY",
      );
    }
  }

  const actualChecksum = calculateTournamentEntryChecksum(entry);
  if (actualChecksum !== entry.checksum) {
    throw new TournamentEntryValidationError(
      "Tournament entry checksum does not match.",
      "ENTRY_CHECKSUM_MISMATCH",
    );
  }
  return true;
}

export function validateTournamentEntryAgainstSave(entry, snapshot) {
  validateTournamentEntryData(entry);
  assertPlainObject(snapshot, "Save snapshot");
  if (entry.saveSlotId !== snapshot.saveSlotId) {
    throw new TournamentEntryValidationError(
      "Tournament entry belongs to a different save slot.",
      "ENTRY_SAVE_SLOT_MISMATCH",
    );
  }
  if (entry.entrySnapshotHash !== calculateEntrySnapshotHash(snapshot)) {
    throw new TournamentEntryValidationError(
      "The main save no longer matches the tournament entry snapshot.",
      "ENTRY_SNAPSHOT_MISMATCH",
    );
  }
  return true;
}

export function saveTournamentEntryToStorage(storage, entry) {
  const validStorage = normalizeStorage(storage);
  validateTournamentEntryData(entry);
  validStorage.setItem(
    STORAGE_KEYS.tournamentInput,
    serializeTransferPayload(entry),
  );
  return entry;
}

export function readTournamentEntryFromStorage(storage) {
  const validStorage = normalizeStorage(storage);
  const serialized = validStorage.getItem(STORAGE_KEYS.tournamentInput);
  if (serialized === null) return null;
  const entry = deserializeTransferPayload(
    serialized,
    TOURNAMENT_ENTRY_SCHEMA_VERSION,
    "Tournament entry",
  );
  validateTournamentEntryData(entry);
  return deepFreeze(entry);
}

export function prepareTournamentEntry({
  stateManager,
  storage,
  event,
  clock = () => new Date(),
  idFactory = createGeneratedId,
  tournamentOverrides = {},
}) {
  if (!stateManager || typeof stateManager.getSnapshot !== "function") {
    throw new TypeError("A game state manager is required.");
  }
  const validStorage = normalizeStorage(storage);
  const snapshot = stateManager.getSnapshot();
  if (!snapshot) {
    throw new TournamentBridgeError("No main save is loaded.", {
      code: "MAIN_SAVE_NOT_LOADED",
    });
  }
  const currentEvents = getTournamentEventsForDate(snapshot.gameDate);
  const matchingEvent = currentEvents.find(
    (candidate) => candidate.tournamentId === event.tournamentId,
  );
  if (!matchingEvent) {
    throw new TournamentEntryValidationError(
      "This tournament is not scheduled for the current game week.",
      "TOURNAMENT_NOT_CURRENT",
    );
  }

  const availability = getTournamentEntryAvailability(snapshot, matchingEvent);
  if (!availability.eligible) {
    throw new TournamentEntryValidationError(
      availability.reason,
      "TOURNAMENT_ENTRY_NOT_ELIGIBLE",
    );
  }

  const entry = createTournamentEntryData(snapshot, matchingEvent, {
    clock,
    idFactory,
    tournamentOverrides,
  });
  saveTournamentEntryToStorage(validStorage, entry);

  try {
    stateManager.transact("tournament_entry_prepared", (draft) => {
      draft.tournament.activeEntryId = entry.entryId;
      draft.ui.guideFlags =
        draft.ui.guideFlags ?? {};
      draft.ui.guideFlags[
        `tournament:${entry.tournament.tournamentType}`
      ] = true;
      draft.tournament.resumeData = {
        schemaVersion: TOURNAMENT_RESUME_SCHEMA_VERSION,
        state: "prepared",
        entryId: entry.entryId,
        entrySnapshotHash: entry.entrySnapshotHash,
        tournamentId: entry.tournament.tournamentId,
        tournamentType: entry.tournament.tournamentType,
        savedAt: entry.createdAt,
      };
    });
  } catch (error) {
    validStorage.removeItem(STORAGE_KEYS.tournamentInput);
    throw error;
  }

  return entry;
}

export function cancelPreparedTournament({ stateManager, storage }) {
  const validStorage = normalizeStorage(storage);
  if (stateManager?.getSnapshot()) {
    stateManager.transact("tournament_entry_cancelled", (draft) => {
      draft.tournament.activeEntryId = null;
      draft.tournament.resumeData = null;
    });
  }
  validStorage.removeItem(STORAGE_KEYS.tournamentInput);
  removeTournamentResumeEverywhere(
    validStorage,
  );
  validStorage.removeItem(STORAGE_KEYS.tournamentOutput);
  return true;
}

export function launchTournamentPage(
  navigate = (url) => globalThis.location.assign(url),
  url = TOURNAMENT_PAGE_URL,
) {
  if (typeof navigate !== "function") {
    throw new TypeError("Tournament navigation callback must be a function.");
  }
  navigate(url);
  return url;
}

function createResultSignaturePayload(result) {
  return {
    schemaVersion: result.schemaVersion,
    entryId: result.entryId,
    resultId: result.resultId,
    saveSlotId: result.saveSlotId,
    tournamentId: result.tournamentId,
    tournamentType: result.tournamentType,
    sessionId: result.sessionId,
    seasonId: result.seasonId,
    completedAt: result.completedAt,
    status: result.status,
    finalPlace: result.finalPlace,
    qualified: result.qualified,
    teamTotals: result.teamTotals,
    memberResults: result.memberResults,
    rewards: result.rewards,
    consumedCarryItems: result.consumedCarryItems,
  };
}

export function calculateTournamentResultSignature(result) {
  return `result-${calculateChecksum(createResultSignaturePayload(result))}`;
}

function createResultChecksumPayload(result) {
  const clone = deepClone(result);
  delete clone.checksum;
  return clone;
}

export function calculateTournamentResultChecksum(result) {
  return calculateChecksum(createResultChecksumPayload(result));
}

export function finalizeTournamentResultData(partialResult) {
  const result = deepClone(partialResult);
  result.schemaVersion = TOURNAMENT_RESULT_SCHEMA_VERSION;
  result.resultSignature = calculateTournamentResultSignature(result);
  result.checksum = calculateTournamentResultChecksum(result);
  return deepFreeze(result);
}

function normalizeLegacyPlayerStats(playerStats) {
  if (!Array.isArray(playerStats)) return [];
  return playerStats.map((player) => ({
    playerId: player.playerId ?? player.id,
    matches: player.matches ?? 0,
    rounds: player.rounds ?? 0,
    kills: player.kills ?? player.kp ?? 0,
    assists: player.assists ?? player.ap ?? 0,
    downsGiven: player.downsGiven ?? 0,
    deaths: player.deaths ?? 0,
    revives: player.revives ?? 0,
    damage: player.damage ?? 0,
    damageTaken: player.damageTaken ?? 0,
    healing: player.healing ?? 0,
    shots: player.shots ?? 0,
    hits: player.hits ?? 0,
    skillUses: player.skillUses ?? 0,
    survivalTime: player.survivalTime ?? 0,
    weaponShots: player.weaponShots ?? 0,
    weaponHits: player.weaponHits ?? 0,
    weaponDamage: player.weaponDamage ?? 0,
    weaponReloads: player.weaponReloads ?? 0,
    kp: player.kp ?? player.kills ?? 0,
    ap: player.ap ?? player.assists ?? 0,
  }));
}

export function normalizeTournamentResultData(rawResult, entry) {
  assertPlainObject(rawResult, "Tournament result");
  if (rawResult.schemaVersion === TOURNAMENT_RESULT_SCHEMA_VERSION) {
    return deepClone(rawResult);
  }

  if (rawResult.importId) {
    const mapped = {
      schemaVersion: TOURNAMENT_RESULT_SCHEMA_VERSION,
      entryId: rawResult.entryId ?? entry.entryId,
      resultId: String(rawResult.importId),
      saveSlotId: rawResult.saveSlotId ?? entry.saveSlotId,
      tournamentId:
        rawResult.tournamentId ?? entry.tournament.tournamentId,
      tournamentType:
        rawResult.tournamentType ?? rawResult.tier ??
        entry.tournament.tournamentType,
      sessionId:
        rawResult.sessionId ?? entry.tournament.sessionId,
      seasonId:
        rawResult.seasonId ?? entry.gameDate.seasonId,
      startedAt: rawResult.startedAt ?? entry.createdAt,
      completedAt: rawResult.completedAt ?? new Date().toISOString(),
      status: rawResult.status ?? "completed",
      playerTeamId: entry.playerTeam.teamId,
      companyName: entry.company.companyName,
      teamName: entry.playerTeam.teamName,
      finalPlace: rawResult.finalPlace ?? rawResult.placement,
      qualified: rawResult.qualified === true,
      nextStageId: rawResult.nextStageId ?? null,
      matchPointWinner: rawResult.matchPointWinner === true,
      matchesPlayed: rawResult.matchesPlayed ?? 0,
      teamTotals: rawResult.teamTotals ?? {
        placementPoints: 0,
        kp: 0,
        totalPoints: 0,
        ap: 0,
        damage: 0,
        damageTaken: 0,
        wins: 0,
        bestPlace: rawResult.finalPlace ?? rawResult.placement,
      },
      matchResults: rawResult.matchResults ?? [],
      roundResults: rawResult.roundResults ?? [],
      memberResults:
        rawResult.memberResults ??
        normalizeLegacyPlayerStats(rawResult.playerStats),
      awards:
        rawResult.awards ?? rawResult.individualAwards ?? [],
      recordsBroken: rawResult.recordsBroken ?? [],
      rewardTableId:
        rawResult.rewardTableId ?? entry.tournament.rewardTableId,
      rewardTableVersion:
        rawResult.rewardTableVersion ??
        entry.tournament.rewardTableVersion,
      rewards: rawResult.rewards ?? {},
      championshipPointDelta:
        rawResult.championshipPointDelta ??
        rawResult.championshipPoints ?? 0,
      consumedCarryItems: rawResult.consumedCarryItems ?? [],
      strategyUsage: rawResult.strategyUsage ?? [],
      newTournamentRecords: rawResult.newTournamentRecords ?? [],
      historyEntry: rawResult.historyEntry ?? null,
      summary: rawResult.summary ?? null,
      rankings: rawResult.rankings ?? [],
      resumeDataCleared: rawResult.resumeDataCleared !== false,
    };
    return deepClone(finalizeTournamentResultData(mapped));
  }

  throw new TournamentResultValidationError(
    `Unsupported tournament result schema: ${rawResult.schemaVersion}`,
    "UNSUPPORTED_RESULT_SCHEMA",
  );
}

function normalizeRewardObject(rewards) {
  assertPlainObject(rewards, "Tournament rewards");
  const normalized = {
    coin: rewards.coin ?? 0,
    diamond: rewards.diamond ?? 0,
    ruby: rewards.ruby ?? 0,
    companyExp: rewards.companyExp ?? 0,
    trainingPoints: {
      power: rewards.trainingPoints?.power ?? 0,
      tech: rewards.trainingPoints?.tech ?? 0,
      mental: rewards.trainingPoints?.mental ?? 0,
      shoot: rewards.trainingPoints?.shoot ?? 0,
    },
    badgePacks: rewards.badgePacks ?? {},
    championshipPoints: rewards.championshipPoints ?? 0,
    unlockFlags: rewards.unlockFlags ?? {},
  };
  for (const resourceId of RESOURCE_IDS) {
    assertNonNegativeInteger(
      normalized[resourceId],
      `Reward ${resourceId}`,
    );
  }
  assertNonNegativeInteger(normalized.companyExp, "Reward company EXP");
  for (const pointId of TRAINING_POINT_IDS) {
    assertNonNegativeInteger(
      normalized.trainingPoints[pointId],
      `Reward training point ${pointId}`,
    );
  }
  for (const [packId, quantity] of Object.entries(normalized.badgePacks)) {
    assertNonEmptyString(packId, "Badge pack ID", 150);
    assertNonNegativeInteger(quantity, `Badge pack ${packId}`);
  }
  assertNonNegativeInteger(
    normalized.championshipPoints,
    "Championship point reward",
  );
  assertPlainObject(normalized.unlockFlags, "Reward unlock flags");
  return normalized;
}

function rewardObjectsEqual(left, right) {
  return calculateChecksum(normalizeRewardObject(left)) ===
    calculateChecksum(normalizeRewardObject(right));
}

function combineRewardObjects(left, right) {
  const a = normalizeRewardObject(left);
  const b = normalizeRewardObject(right);
  const badgePacks = { ...a.badgePacks };
  for (const [packId, quantity] of Object.entries(b.badgePacks)) {
    badgePacks[packId] = (badgePacks[packId] ?? 0) + quantity;
  }
  return {
    coin: a.coin + b.coin,
    diamond: a.diamond + b.diamond,
    ruby: a.ruby + b.ruby,
    companyExp: a.companyExp + b.companyExp,
    trainingPoints: Object.fromEntries(
      TRAINING_POINT_IDS.map((pointId) => [
        pointId,
        a.trainingPoints[pointId] + b.trainingPoints[pointId],
      ]),
    ),
    badgePacks,
    championshipPoints:
      a.championshipPoints + b.championshipPoints,
    unlockFlags: { ...a.unlockFlags, ...b.unlockFlags },
  };
}

function validateMemberResults(result, entry) {
  if (!Array.isArray(result.memberResults)) {
    throw new TournamentResultValidationError(
      "Member results must be an array.",
      "INVALID_MEMBER_RESULTS",
    );
  }
  const expectedIds = new Set(
    entry.playerTeam.members.map((member) => member.playerId),
  );
  const resultIds = new Set();
  for (const member of result.memberResults) {
    assertPlainObject(member, "Member result");
    const playerId = assertNonEmptyString(
      member.playerId,
      "Member result player ID",
      100,
    );
    if (!expectedIds.has(playerId) || resultIds.has(playerId)) {
      throw new TournamentResultValidationError(
        `Unexpected or duplicate member result: ${playerId}`,
        "MEMBER_RESULT_ID_MISMATCH",
      );
    }
    resultIds.add(playerId);
    for (const field of MEMBER_RESULT_FIELDS) {
      assertNonNegativeInteger(
        member[field] ?? 0,
        `Member result ${playerId}.${field}`,
      );
    }
  }
  if (resultIds.size !== expectedIds.size) {
    throw new TournamentResultValidationError(
      "All three player member results are required.",
      "MEMBER_RESULT_COUNT_MISMATCH",
    );
  }
}

function validateConsumedCarryItems(result, entry) {
  if (!Array.isArray(result.consumedCarryItems)) {
    throw new TournamentResultValidationError(
      "Consumed carry items must be an array.",
      "INVALID_CONSUMED_ITEMS",
    );
  }
  const allowed = new Map();
  for (const item of entry.carryItems) {
    if (!item) continue;
    allowed.set(
      item.itemId,
      (allowed.get(item.itemId) ?? 0) + (item.quantity ?? 1),
    );
  }
  const consumedTotals = new Map();
  for (const item of result.consumedCarryItems) {
    const itemId = assertNonEmptyString(item.itemId, "Consumed item ID", 150);
    const quantity = assertNonNegativeInteger(
      item.quantity,
      `Consumed item ${itemId} quantity`,
    );
    consumedTotals.set(itemId, (consumedTotals.get(itemId) ?? 0) + quantity);
  }
  for (const [itemId, quantity] of consumedTotals) {
    if (quantity > (allowed.get(itemId) ?? 0)) {
      throw new TournamentResultValidationError(
        `Consumed item quantity exceeds the entry bag: ${itemId}`,
        "CONSUMED_ITEM_EXCEEDS_ENTRY",
      );
    }
  }
}

function validateTeamTotals(result) {
  assertPlainObject(result.teamTotals, "Team totals");
  for (const field of [
    "placementPoints",
    "kp",
    "totalPoints",
    "ap",
    "damage",
    "damageTaken",
    "wins",
  ]) {
    assertNonNegativeInteger(result.teamTotals[field] ?? 0, `Team total ${field}`);
  }
  if (
    result.teamTotals.totalPoints !==
    result.teamTotals.placementPoints + result.teamTotals.kp
  ) {
    throw new TournamentResultValidationError(
      "Team total points must equal placement points plus KP.",
      "TEAM_POINT_TOTAL_MISMATCH",
    );
  }
  if (result.teamTotals.bestPlace !== null) {
    assertPositiveInteger(result.teamTotals.bestPlace, "Best place");
  }
}

export function validateTournamentResultData(result, entry, snapshot) {
  assertPlainObject(result, "Tournament result");
  validateTournamentEntryData(entry);
  assertPlainObject(snapshot, "Main save snapshot");

  if (result.schemaVersion !== TOURNAMENT_RESULT_SCHEMA_VERSION) {
    throw new TournamentResultValidationError(
      `Unsupported result schema: ${result.schemaVersion}`,
      "UNSUPPORTED_RESULT_SCHEMA",
    );
  }
  for (const [label, value] of [
    ["Entry ID", result.entryId],
    ["Result ID", result.resultId],
    ["Result signature", result.resultSignature],
    ["Save slot ID", result.saveSlotId],
    ["Tournament ID", result.tournamentId],
    ["Tournament type", result.tournamentType],
    ["Session ID", result.sessionId],
    ["Season ID", result.seasonId],
    ["Completed timestamp", result.completedAt],
  ]) {
    assertNonEmptyString(value, label, 300);
  }
  if (!ALLOWED_RESULT_STATUSES.includes(result.status)) {
    throw new TournamentResultValidationError(
      `Unsupported result status: ${result.status}`,
      "INVALID_RESULT_STATUS",
    );
  }
  if (!FINAL_RESULT_STATUSES.includes(result.status)) {
    throw new TournamentResultValidationError(
      "A suspended tournament cannot be committed as a final result.",
      "RESULT_NOT_FINAL",
    );
  }
  if (result.entryId !== entry.entryId) {
    throw new TournamentResultValidationError(
      "Result entry ID does not match the prepared entry.",
      "RESULT_ENTRY_ID_MISMATCH",
    );
  }
  if (
    result.saveSlotId !== entry.saveSlotId ||
    result.saveSlotId !== snapshot.saveSlotId
  ) {
    throw new TournamentResultValidationError(
      "Result save slot does not match the main save.",
      "RESULT_SAVE_SLOT_MISMATCH",
    );
  }
  if (
    result.tournamentId !== entry.tournament.tournamentId ||
    result.tournamentType !== entry.tournament.tournamentType ||
    result.sessionId !== entry.tournament.sessionId
  ) {
    throw new TournamentResultValidationError(
      "Result tournament identity does not match the entry.",
      "RESULT_TOURNAMENT_IDENTITY_MISMATCH",
    );
  }
  if (
    result.rewardTableId !== entry.tournament.rewardTableId ||
    result.rewardTableVersion !== entry.tournament.rewardTableVersion
  ) {
    throw new TournamentResultValidationError(
      "Result reward table version does not match the entry snapshot.",
      "RESULT_REWARD_TABLE_MISMATCH",
    );
  }
  assertPositiveInteger(result.finalPlace, "Final place");
  if (result.finalPlace > entry.tournament.totalTeams) {
    throw new TournamentResultValidationError(
      "Final place exceeds the tournament team count.",
      "FINAL_PLACE_OUT_OF_RANGE",
    );
  }

  validateTeamTotals(result);
  validateMemberResults(result, entry);
  validateConsumedCarryItems(result, entry);

  const expectedPlacementRewards = resolvePlacementRewards(
    entry.tournament.rewardTableSnapshot,
    result.finalPlace,
  );
  const placementRewards =
    result.rewardBreakdown?.placement ?? result.rewards;
  if (!rewardObjectsEqual(placementRewards, expectedPlacementRewards)) {
    throw new TournamentResultValidationError(
      "Placement rewards do not match the entry reward table snapshot.",
      "RESULT_REWARD_VALUE_MISMATCH",
    );
  }
  if (result.rewardBreakdown) {
    const awardRewards =
      result.rewardBreakdown.awards ?? {
        coin: 0,
        diamond: 0,
        ruby: 0,
        companyExp: 0,
        trainingPoints: { power: 0, tech: 0, mental: 0, shoot: 0 },
        badgePacks: {},
        championshipPoints: 0,
        unlockFlags: {},
      };
    const expectedTotalRewards = combineRewardObjects(
      expectedPlacementRewards,
      awardRewards,
    );
    if (!rewardObjectsEqual(result.rewards, expectedTotalRewards)) {
      throw new TournamentResultValidationError(
        "Total rewards do not match placement plus award rewards.",
        "RESULT_TOTAL_REWARD_MISMATCH",
      );
    }
  }

  const expectedChampionshipPoints =
    result.tournamentType === "world_final"
      ? getChampionshipPoints(result.finalPlace)
      : 0;
  if (result.championshipPointDelta !== expectedChampionshipPoints) {
    throw new TournamentResultValidationError(
      "Championship point delta is inconsistent with the final place.",
      "CHAMPIONSHIP_POINT_MISMATCH",
    );
  }
  if (
    normalizeRewardObject(result.rewards).championshipPoints !==
    expectedChampionshipPoints
  ) {
    throw new TournamentResultValidationError(
      "Reward championship points are inconsistent.",
      "REWARD_CHAMPIONSHIP_POINT_MISMATCH",
    );
  }

  const expectedSignature = calculateTournamentResultSignature(result);
  if (result.resultSignature !== expectedSignature) {
    throw new TournamentResultValidationError(
      "Tournament result signature does not match.",
      "RESULT_SIGNATURE_MISMATCH",
    );
  }
  const expectedChecksum = calculateTournamentResultChecksum(result);
  if (result.checksum !== expectedChecksum) {
    throw new TournamentResultValidationError(
      "Tournament result checksum does not match.",
      "RESULT_CHECKSUM_MISMATCH",
    );
  }

  if (
    snapshot.tournament.processedResultSignatures.includes(
      result.resultSignature,
    ) ||
    snapshot.tournament.processedResultIds.includes(result.resultId) ||
    (snapshot.tournament.processedEntryIds ?? []).includes(result.entryId) ||
    snapshot.tournament.history.some(
      (history) => history.entryId === result.entryId,
    )
  ) {
    throw new DuplicateTournamentResultError(result.resultSignature);
  }
  if (
    snapshot.tournament.activeEntryId !== null &&
    snapshot.tournament.activeEntryId !== result.entryId
  ) {
    throw new TournamentResultValidationError(
      "Another tournament entry is active in the main save.",
      "ACTIVE_ENTRY_MISMATCH",
    );
  }
  return true;
}

export function readTournamentResultFromStorage(storage, entry) {
  const validStorage = normalizeStorage(storage);
  const serialized = validStorage.getItem(STORAGE_KEYS.tournamentOutput);
  if (serialized === null) return null;
  const raw = deserializeTransferPayload(
    serialized,
    null,
    "Tournament result",
  );
  return deepFreeze(normalizeTournamentResultData(raw, entry));
}

export function writeTournamentResultToStorage(storage, result) {
  const validStorage =
    normalizeStorage(storage);
  if (result.schemaVersion !== TOURNAMENT_RESULT_SCHEMA_VERSION) {
    throw new TournamentResultValidationError(
      "Only the current result schema can be written.",
      "UNSUPPORTED_RESULT_SCHEMA",
    );
  }
  const serialized =
    serializeTransferPayload(result);

  // The session copy keeps resume safety while the bulky local resume is
  // removed to reserve space for the final result payload.
  validStorage.removeItem(
    STORAGE_KEYS.tournamentResume,
  );
  try {
    validStorage.setItem(
      STORAGE_KEYS.tournamentOutput,
      serialized,
    );
  } catch (error) {
    if (!isStorageQuotaError(error)) {
      throw error;
    }
    validStorage.removeItem(
      STORAGE_KEYS.tournamentAck,
    );
    validStorage.setItem(
      STORAGE_KEYS.tournamentOutput,
      serialized,
    );
  }
  return result;
}

function createAck(result, appliedState, clock) {
  const ack = {
    schemaVersion: TOURNAMENT_ACK_SCHEMA_VERSION,
    entryId: result.entryId,
    resultId: result.resultId,
    resultSignature: result.resultSignature,
    saveSlotId: result.saveSlotId,
    tournamentId: result.tournamentId,
    appliedRevision: appliedState.revision,
    appliedAt: nowIso(clock),
    status: "applied",
  };
  return {
    ...ack,
    checksum: calculateChecksum(ack),
  };
}

export function importPendingTournamentResult({
  stateManager,
  storage,
  clock = () => new Date(),
}) {
  if (!stateManager || typeof stateManager.applyTournamentResult !== "function") {
    throw new TypeError("A game state manager is required.");
  }
  const validStorage = normalizeStorage(storage);
  const snapshot = stateManager.getSnapshot();
  if (!snapshot) {
    throw new TournamentBridgeError("No main save is loaded.", {
      code: "MAIN_SAVE_NOT_LOADED",
    });
  }
  const entry = readTournamentEntryFromStorage(validStorage);
  if (!entry) {
    throw new TournamentBridgeError(
      "Tournament entry data was not found.",
      { code: "TOURNAMENT_ENTRY_NOT_FOUND" },
    );
  }
  validateTournamentEntryAgainstSave(entry, snapshot);
  const result = readTournamentResultFromStorage(validStorage, entry);
  if (!result) {
    return deepFreeze({ imported: false, reason: "no_result" });
  }
  validateTournamentResultData(result, entry, snapshot);

  const normalizedForState = {
    ...deepClone(result),
    rewards: {
      ...normalizeRewardObject(result.rewards),
      championshipPoints: result.championshipPointDelta,
    },
  };
  const transaction = stateManager.applyTournamentResult(
    normalizedForState,
    { advanceWeekAfterCompletion: true },
  );
  const ack = createAck(result, transaction.state, clock);

  validStorage.setItem(
    STORAGE_KEYS.tournamentAck ?? "mob_br_tournament_ack_v1",
    serializeTransferPayload(ack),
  );
  validStorage.removeItem(STORAGE_KEYS.tournamentOutput);
  removeTournamentResumeEverywhere(
    validStorage,
  );
  validStorage.removeItem(STORAGE_KEYS.tournamentInput);

  return deepFreeze({
    imported: true,
    result,
    state: transaction.state,
    applyResult: transaction.result,
    ack,
  });
}

export function readTournamentResumeData(storage) {
  const validStorage =
    normalizeStorage(storage);
  const fallback =
    fallbackTournamentStorage(
      validStorage,
    );
  const serialized =
    fallback?.getItem(
      STORAGE_KEYS.tournamentResume,
    ) ??
    validStorage.getItem(
      STORAGE_KEYS.tournamentResume,
    );
  if (serialized === null) {
    return null;
  }
  const resume =
    deserializeTransferPayload(
      serialized,
      TOURNAMENT_RESUME_SCHEMA_VERSION,
      "Tournament resume data",
    );
  return deepFreeze(resume);
}

export function validateTournamentResumeData(resume, entry, snapshot) {
  assertPlainObject(resume, "Tournament resume data");
  if (resume.schemaVersion !== TOURNAMENT_RESUME_SCHEMA_VERSION) {
    throw new TournamentBridgeError(
      `Unsupported resume schema: ${resume.schemaVersion}`,
      { code: "UNSUPPORTED_RESUME_SCHEMA" },
    );
  }
  for (const field of [
    "entryId",
    "entrySnapshotHash",
    "phase",
    "savedAt",
  ]) {
    assertNonEmptyString(resume[field], `Resume ${field}`, 300);
  }
  if (
    resume.entryId !== entry.entryId ||
    resume.entrySnapshotHash !== entry.entrySnapshotHash
  ) {
    throw new TournamentBridgeError(
      "Resume data belongs to a different tournament entry.",
      { code: "RESUME_ENTRY_MISMATCH" },
    );
  }
  validateTournamentEntryAgainstSave(entry, snapshot);
  return true;
}

export function getTournamentBridgeStatus(storage, snapshot) {
  const validStorage = normalizeStorage(storage);
  const hasInput = validStorage.getItem(STORAGE_KEYS.tournamentInput) !== null;
  const hasOutput = validStorage.getItem(STORAGE_KEYS.tournamentOutput) !== null;
  const hasResume =
    validStorage.getItem(
      STORAGE_KEYS.tournamentResume,
    ) !== null ||
    fallbackTournamentStorage(
      validStorage,
    )?.getItem(
      STORAGE_KEYS.tournamentResume,
    ) !== null;
  let entry = null;
  let resume = null;
  let error = null;

  try {
    entry = hasInput ? readTournamentEntryFromStorage(validStorage) : null;
    if (entry && snapshot) {
      validateTournamentEntryAgainstSave(entry, snapshot);
    }
    resume = hasResume ? readTournamentResumeData(validStorage) : null;
    if (resume && entry && snapshot) {
      validateTournamentResumeData(resume, entry, snapshot);
    }
  } catch (caught) {
    error = caught;
  }

  const state = error
    ? "invalid"
    : hasOutput
      ? "result_pending"
      : resume
        ? "resume_available"
        : entry
          ? "entry_prepared"
          : "idle";

  return deepFreeze({
    state,
    entry,
    resume,
    hasInput,
    hasOutput,
    hasResume,
    error,
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function tournamentScheduleCategory(event) {
  if (event.choiceGroupId) return "CASUAL CHOICE";
  if (event.tournamentType === "championship") return "CHAMPIONSHIP";
  return "MOB BR";
}

function tournamentRuleSummary(event) {
  const type = event.tournamentType;
  if (type === "local") return "20チーム / 5MATCH / 上位10がNATIONALへ";
  if (type === "national_week_1") return "40チーム・A～D / 第1～3節 / 9MATCH";
  if (type === "national_week_2") return "第4～6節 / 9MATCH / 1～8位World確定 / 9～28位Last Chance";
  if (type === "national_last_chance") return "20チーム / 35POINT MATCH POINT / MP勝者＋残りTOTAL首位";
  if (type === "world_qualifier_week_1") return "National代表10＋World30 / 第1～3節 / 9MATCH";
  if (type === "world_qualifier_week_2") return "第4～6節 / 9MATCH / 上位10Final / 11～30位Last Chance";
  if (type === "world_last_chance") return "20チーム / 3MATCH / 上位10がWorld Finalへ";
  if (type === "world_final") return "20チーム / 50POINT MATCH POINT / 世界王者決定";
  if (type === "casual_denden") return "20チーム / 3MATCH / Local14＋National下位5";
  if (type === "casual_mobutetsu") return "企業C1以上 / 5MATCH / Worldゲスト1チーム";
  if (type === "casual_rockets") return "20チーム / 3MATCH / ジョーダンロケッツ＋National・Local上位＋World3";
  if (type === "casual_tempest") return "20チーム / 3MATCH / ゴールデンテンペスト＋World中心";
  if (type === "championship") return "3年に1回 / Championship Point上位20";
  return "大会ルールを確認してください";
}

function eventDateLabel(event) {
  return `${event.month}月 第${event.week}週`;
}

function formatRewards(rewards) {
  return `COIN ${new Intl.NumberFormat("ja-JP").format(rewards.coin)} / DIAMOND ${new Intl.NumberFormat("ja-JP").format(rewards.diamond)} / RUBY ${new Intl.NumberFormat("ja-JP").format(rewards.ruby)}`;
}

function weeklyBonusPresentation(imported) {
  const record =
    imported?.applyResult?.weekAdvance?.weeks?.[0]
      ?.weeklyBonus?.record;
  if (!record) return "";
  const badgeImage =
    imported?.state?.company?.badgeImage ?? "Play/b1.png";
  const formatter = new Intl.NumberFormat("ja-JP");
  return `
    <section class="weekly-bonus-show weekly-bonus-show--tournament">
      <div class="weekly-bonus-show__burst" aria-hidden="true"></div>
      <img src="${escapeAttribute(badgeImage)}" alt="">
      <span>WEEK START BONUS</span>
      <h3>${record.gameDate.year}年 ${record.gameDate.month}月 第${record.gameDate.week}週</h3>
      <div class="weekly-bonus-show__rewards">
        <strong><img src="icon/coin.png" alt="">${formatter.format(record.granted.coin)}</strong>
        <strong><img src="icon/daia.png" alt="">${formatter.format(record.granted.diamond)}</strong>
        <strong><img src="icon/rubi.png" alt="">${formatter.format(record.granted.ruby)}</strong>
      </div>
    </section>
  `;
}

export function renderTournamentSchedule(snapshot, storage) {
  const events = getAnnualTournamentSchedule(snapshot.gameDate.year);
  const currentEvents = getTournamentEventsForDate(snapshot.gameDate);
  const currentIds = new Set(currentEvents.map((event) => event.tournamentId));
  const status = getTournamentBridgeStatus(storage, snapshot);

  const orderedMonths = [
    ...Array.from(
      { length: 13 - snapshot.gameDate.month },
      (_value, index) =>
        snapshot.gameDate.month + index,
    ),
    ...Array.from(
      { length: snapshot.gameDate.month - 1 },
      (_value, index) => index + 1,
    ),
  ];

  let bridgePanel = "";
  if (status.state === "result_pending") {
    bridgePanel = `
      <section class="content-panel tournament-bridge-status tournament-bridge-status--result">
        <h2>大会結果を受信しました</h2>
        <p>結果を検証し、報酬・記録・次週進行を一度だけ反映します。</p>
        <button type="button" class="primary-button" data-action="import-tournament-result">
          大会結果を反映
        </button>
      </section>
    `;
  } else if (status.state === "resume_available") {
    bridgePanel = `
      <section class="content-panel tournament-bridge-status">
        <h2>大会を再開できます</h2>
        <p>${escapeHtml(status.entry.tournament.tournamentName)} / ${escapeHtml(status.resume.phase)}</p>
        <div class="tournament-bridge-actions">
          <button type="button" class="primary-button" data-action="resume-tournament">
            大会を再開
          </button>
          <button type="button" class="danger-button" data-action="cancel-tournament-entry">
            大会データを破棄
          </button>
        </div>
      </section>
    `;
  } else if (status.state === "entry_prepared") {
    bridgePanel = `
      <section class="content-panel tournament-bridge-status">
        <h2>大会参加データを準備済みです</h2>
        <p>${escapeHtml(status.entry.tournament.tournamentName)}</p>
        <div class="tournament-bridge-actions">
          <button type="button" class="primary-button" data-action="resume-tournament">
            大会画面へ
          </button>
          <button type="button" class="danger-button" data-action="cancel-tournament-entry">
            参加を取り消す
          </button>
        </div>
      </section>
    `;
  } else if (status.state === "invalid") {
    bridgePanel = `
      <section class="content-panel tournament-bridge-status tournament-bridge-status--error">
        <h2>大会データを確認できません</h2>
        <p>${escapeHtml(status.error.message)}</p>
        <code>${escapeHtml(status.error.code ?? status.error.name)}</code>
        <button type="button" class="danger-button" data-action="cancel-tournament-entry">
          不整合データを削除
        </button>
      </section>
    `;
  }

  return `
    ${bridgePanel}
    <section class="annual-circuit-overview">
      <span>MOB BR OFFICIAL SERIES</span>
      <h2>${snapshot.gameDate.year} MOB BR</h2>
      <div>
        <b>LOCAL</b><i>→</i><b>NATIONAL</b><i>→</i><b>NATIONAL LC</b><i>→</i><b>WORLD予選</b><i>→</i><b>WORLD LC</b><i>→</i><b>WORLD FINAL</b>
      </div>
      <p>MOB BRは年1回。毎月のカジュアル週は4つのカップから1大会だけ選択できます。</p>
    </section>
    <section class="tournament-current-week">
      <h2>CURRENT WEEK</h2>
      <p>${snapshot.gameDate.year}年 ${snapshot.gameDate.month}月 第${snapshot.gameDate.week}週</p>
      ${
        currentEvents.length
          ? currentEvents.map((event) => {
              const preset = TOURNAMENT_TYPE_PRESETS[event.tournamentType];
              const rewards = resolvePlacementRewards(
                getRewardTableForTournamentType(event.tournamentType),
                1,
              );
              const availability = getTournamentEntryAvailability(snapshot, event);
              const disabled = status.state !== "idle" || !availability.eligible;
              return `
                <article class="tournament-current-card ${availability.eligible ? "is-entry" : "is-observer"} ${event.choiceGroupId ? "is-casual-choice" : "is-formal-stage"}">
                  <img class="tournament-type-logo" src="${escapeAttribute(getTournamentIcon(event.tournamentType))}" alt="">
                  <span>${event.choiceGroupId ? "MONTHLY CASUAL CHOICE" : availability.eligible ? "FORMAL STAGE OPEN" : "TOURNAMENT NOTICE"}</span>
                  <h3>${escapeHtml(preset.tournamentName)}</h3>
                  <p>${escapeHtml(event.stageName)}</p>
                  <div class="tournament-rule-summary">${escapeHtml(tournamentRuleSummary(event))}</div>
                  <small>${escapeHtml(availability.reason)}</small>
                  ${preset.rewardTableKey === "stage_progress" ? `<small>この週は順位・TOTALを次段階へ引き継ぎます</small>` : `<small>1位報酬 ${escapeHtml(formatRewards(rewards))}</small>`}
                  <button
                    type="button"
                    class="primary-button"
                    data-action="prepare-tournament-entry"
                    data-tournament-id="${escapeAttribute(event.tournamentId)}"
                    ${disabled ? "disabled" : ""}
                  >
                    ${availability.eligible ? event.choiceGroupId ? "この大会を選ぶ" : "大会に参加" : availability.status === "locked" ? "LOCKED" : "出場予定なし"}
                  </button>
                </article>
              `;
            }).join("")
          : `
            <section class="content-panel tournament-no-event">
              <p>今週開催される大会はありません。</p>
            </section>
          `
      }
    </section>

    <section class="tournament-year-calendar">
      <header class="tournament-year-calendar__header">
        <div>
          <span>YEAR SCHEDULE</span>
          <h2>${snapshot.gameDate.year} TOURNAMENT CALENDAR</h2>
          <p>正式大会と月例カジュアル大会を、月・週単位で確認できます。</p>
        </div>
        <div class="tournament-calendar-legend">
          <span class="is-formal">正式大会</span>
          <span class="is-casual">カジュアル</span>
          <span class="is-current">今週</span>
        </div>
      </header>

      <div class="tournament-month-grid">
        ${orderedMonths.map((month) => {
          return `
            <article class="tournament-month-card ${
              snapshot.gameDate.month === month
                ? "is-current-month"
                : ""
            }">
              <header>
                <span>${String(month).padStart(2, "0")}</span>
                <strong>${month}月</strong>
              </header>

              <div class="tournament-month-card__weeks">
                ${Array.from({ length: 4 }, (_weekValue, weekIndex) => {
                  const week = weekIndex + 1;
                  const weekEvents =
                    events.filter(
                      (event) =>
                        event.month === month &&
                        event.week === week,
                    );
                  const isCurrentWeek =
                    snapshot.gameDate.month === month &&
                    snapshot.gameDate.week === week;

                  return `
                    <section class="tournament-week-cell ${isCurrentWeek ? "is-current" : ""}">
                      <div class="tournament-week-cell__label">
                        <span>W${week}</span>
                        ${isCurrentWeek ? "<b>NOW</b>" : ""}
                      </div>

                      <div class="tournament-week-cell__events">
                        ${
                          weekEvents.length > 0
                            ? weekEvents.map((event) => {
                                const preset =
                                  TOURNAMENT_TYPE_PRESETS[
                                    event.tournamentType
                                  ];
                                const completed =
                                  snapshot.tournament.history.some(
                                    (history) =>
                                      history.tournamentId ===
                                      event.tournamentId,
                                  );
                                const casual =
                                  Boolean(event.choiceGroupId);
                                return `
                                  <article class="tournament-calendar-event ${
                                    casual
                                      ? "is-casual"
                                      : "is-formal"
                                  } ${completed ? "is-completed" : ""}">
                                    <img
                                      src="${escapeAttribute(getTournamentIcon(event.tournamentType))}"
                                      alt=""
                                    >
                                    <div>
                                      <span>${casual ? "CASUAL CUP" : "FORMAL"}</span>
                                      <strong>${escapeHtml(preset.tournamentName)}</strong>
                                      <small>${escapeHtml(event.stageName)}</small>
                                    </div>
                                    <em>${completed ? "完了" : isCurrentWeek ? "開催中" : "予定"}</em>
                                  </article>
                                `;
                              }).join("")
                            : `
                              <div class="tournament-calendar-rest">
                                <span>PREPARATION WEEK</span>
                                <small>育成・ショップ・作戦準備</small>
                              </div>
                            `
                        }
                      </div>
                    </section>
                  `;
                }).join("")}
              </div>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

export function createTournamentBridgeController({
  stateManager,
  storage,
  root,
  openConfirm,
  openAlert,
  showToast,
  render,
  playProgression = null,
  companyProgressionPayload = null,
  navigateToTournament = (url) => globalThis.location.assign(url),
  clock = () => new Date(),
  idFactory = createGeneratedId,
}) {
  const validStorage = normalizeStorage(storage);
  if (!stateManager || !root) {
    throw new TypeError("Tournament bridge controller dependencies are missing.");
  }

  async function showError(title, error) {
    await openAlert({
      title,
      body: `<p>${escapeHtml(error.message)}</p>`,
      code: error?.code ?? error?.name ?? "TOURNAMENT_BRIDGE_ERROR",
    });
  }

  function playTournamentEntryLaunch(event) {
    const preset =
      TOURNAMENT_TYPE_PRESETS[event.tournamentType];
    const overlay =
      document.createElement("section");
    overlay.className =
      "tournament-entry-launch";
    overlay.innerHTML = `
      <div class="tournament-entry-launch__scan" aria-hidden="true"></div>
      <img src="${escapeAttribute(getTournamentIcon(event.tournamentType))}" alt="">
      <span>ENTRY ACCEPTED</span>
      <h2>${escapeHtml(preset.tournamentName)}</h2>
      <p>${escapeHtml(event.stageName)}</p>
      <div class="tournament-entry-launch__steps">
        <i>TEAM DATA</i>
        <i>EQUIPMENT</i>
        <i>STRATEGY</i>
        <i>READY</i>
      </div>
      <strong>大会会場へ移動します</strong>
    `;
    root.append(overlay);
    return new Promise((resolve) => {
      setTimeout(() => {
        overlay.classList.add("is-ready");
      }, 60);
      setTimeout(() => {
        overlay.classList.add("is-exit");
      }, 1450);
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 1780);
    });
  }

  async function handleAction(actionElement) {
    const action = actionElement.dataset.action;

    if (action === "prepare-tournament-entry") {
      const snapshot = stateManager.getSnapshot();
      const event = getTournamentEventsForDate(snapshot.gameDate).find(
        (candidate) =>
          candidate.tournamentId === actionElement.dataset.tournamentId,
      );
      if (!event) {
        await showError(
          "大会へ参加できません",
          new TournamentBridgeError("現在週の大会情報が見つかりません。", {
            code: "CURRENT_EVENT_NOT_FOUND",
          }),
        );
        return true;
      }
      if (!(await openConfirm({
        title: `${TOURNAMENT_TYPE_PRESETS[event.tournamentType].tournamentName}へ参加しますか？`,
        body: event.choiceGroupId
          ? "<p>今月のカジュアル大会は1つだけ選択できます。参加しない場合は記録されません。</p><p>現在の選手・武器・作戦・バッグ・特殊能力を参加データとして固定します。</p>"
          : "<p>現在の選手・武器・作戦・バッグ・特殊能力を大会参加スナップショットとして固定します。</p>",
        confirmLabel: event.choiceGroupId ? "この大会を選ぶ" : "大会へ進む",
      }))) return true;

      try {
        prepareTournamentEntry({
          stateManager,
          storage: validStorage,
          event,
          clock,
          idFactory,
        });
        showToast("大会参加データを保存しました");
        await playTournamentEntryLaunch(event);
        launchTournamentPage(navigateToTournament);
      } catch (error) {
        await showError("大会へ参加できません", error);
      }
      return true;
    }

    if (action === "resume-tournament") {
      try {
        const snapshot = stateManager.getSnapshot();
        const entry = readTournamentEntryFromStorage(validStorage);
        if (!entry) {
          throw new TournamentBridgeError(
            "大会参加データが見つかりません。",
            { code: "TOURNAMENT_ENTRY_NOT_FOUND" },
          );
        }
        validateTournamentEntryAgainstSave(entry, snapshot);
        const resume = readTournamentResumeData(validStorage);
        if (resume) {
          validateTournamentResumeData(resume, entry, snapshot);
        }
        launchTournamentPage(navigateToTournament);
      } catch (error) {
        await showError("大会を再開できません", error);
      }
      return true;
    }

    if (action === "cancel-tournament-entry") {
      if (!(await openConfirm({
        title: "大会データを削除しますか？",
        body: "<p>未確定報酬は付与されません。大会の途中状態は復元できなくなります。</p>",
        confirmLabel: "削除する",
        danger: true,
      }))) return true;
      try {
        cancelPreparedTournament({ stateManager, storage: validStorage });
        showToast("大会データを削除しました");
        render();
      } catch (error) {
        await showError("大会データを削除できません", error);
      }
      return true;
    }

    if (action === "import-tournament-result") {
      try {
        const beforeCompany =
          stateManager.getSnapshot().company;
        const imported = importPendingTournamentResult({
          stateManager,
          storage: validStorage,
          clock,
        });
        if (!imported.imported) {
          showToast("受信済みの大会結果はありません");
          return true;
        }
        const result = imported.result;
        if (
          Number(result.rewards?.companyExp ?? 0) > 0 &&
          typeof playProgression === "function" &&
          typeof companyProgressionPayload === "function"
        ) {
          await playProgression(
            companyProgressionPayload({
              beforeCompany,
              afterCompany:
                imported.state.company,
              companyExpResult:
                imported.applyResult.companyExpResult,
            }),
          );
        }
        await openAlert({
          title: "大会結果を反映しました",
          body: `
            <p><strong>${escapeHtml(result.teamName)}</strong></p>
            <p>${escapeHtml(result.tournamentId)} / ${result.finalPlace}位</p>
            <p>${escapeHtml(result.summary ?? "大会結果を保存しました。")}</p>
            <p>${escapeHtml(formatRewards(result.rewards))}</p>
          `,
        });
        render();
      } catch (error) {
        await showError("大会結果を反映できません", error);
      }
      return true;
    }

    return false;
  }

  async function importPendingResultIfAvailable() {
    if (!stateManager.getSnapshot()) return false;
    const status = getTournamentBridgeStatus(
      validStorage,
      stateManager.getSnapshot(),
    );
    if (status.state !== "result_pending") return false;
    try {
      const beforeCompany =
        stateManager.getSnapshot().company;
      const imported = importPendingTournamentResult({
        stateManager,
        storage: validStorage,
        clock,
      });
      if (imported.imported) {
        if (
          Number(imported.result.rewards?.companyExp ?? 0) > 0 &&
          typeof playProgression === "function" &&
          typeof companyProgressionPayload === "function"
        ) {
          await playProgression(
            companyProgressionPayload({
              beforeCompany,
              afterCompany:
                imported.state.company,
              companyExpResult:
                imported.applyResult.companyExpResult,
            }),
          );
        }
        await openAlert({
          title: "大会結果を受信しました",
          body: `
            <p>${escapeHtml(imported.result.tournamentId)}</p>
            <p>最終順位 ${imported.result.finalPlace}位</p>
            <p>${escapeHtml(imported.result.summary ?? "報酬と記録を保存しました。")}</p>
            <p>${escapeHtml(formatRewards(imported.result.rewards))}</p>
          `,
        });
        render();
        return true;
      }
    } catch (error) {
      await showError("大会結果を受信できません", error);
    }
    return false;
  }

  return Object.freeze({
    handleAction,
    importPendingResultIfAvailable,
    getStatus: () =>
      getTournamentBridgeStatus(validStorage, stateManager.getSnapshot()),
  });
}
