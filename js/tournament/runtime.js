/**
 * MOB BR tournament runtime and resume-state manager.
 *
 * The main system is the only persistent save owner. This module clones the
 * validated TournamentEntryData into an isolated, temporary runtime and stores
 * only resumable tournament progress in the tournament resume key.
 */

import {
  STORAGE_KEYS,
  calculateChecksum,
} from "../main/state.js?v=33";
import {
  TOURNAMENT_BRIDGE_VERSION,
  TOURNAMENT_ENTRY_SCHEMA_VERSION,
  TOURNAMENT_RESUME_SCHEMA_VERSION,
  readTournamentEntryFromStorage,
  validateTournamentEntryData,
} from "../main/tournament-bridge.js?v=33";
import {
  CPU_LOCAL_DATA_VERSION,
  CPU_LOCAL_MASTER_VERSION,
  LOCAL_CPU_TEAMS,
} from "../../data/cpu-local-data.js";
import {
  CPU_NATIONAL_DATA_VERSION,
  CPU_NATIONAL_MASTER_VERSION,
  NATIONAL_CPU_TEAMS,
} from "../../data/cpu-national-data.js";
import {
  CPU_WORLD_DATA_VERSION,
  CPU_WORLD_MASTER_VERSION,
  getWorldCpuTeamsForYear,
} from "../../data/cpu-world-data.js";
import {
  buildCpuBattleStats,
  calculateMaxHp,
  getRoleCommonSkills,
  resolveCpuRankFromRange,
  resolveCpuWeaponProfile,
} from "../../data/battle-config.js?v=33";
import {
  resolveCpuTeamMaster,
} from "../../data/circuit-data.js?v=33";
import {
  applyMatchPlanToDraft,
  getMatchParticipantIds,
} from "./circuit.js?v=33";

export const TOURNAMENT_RUNTIME_VERSION =
  "mobbr-tournament-runtime-2.1.0";

export const TOURNAMENT_PHASES = Object.freeze([
  "IDLE",
  "ENTRY_VALIDATION",
  "LOADING",
  "OPENING",
  "TEAM_INTRO",
  "DEPLOYMENT",
  "INITIAL_EXPLORATION",
  "MATCH_START",
  "ROUND_INTRO",
  "ROUND_EXPLORATION",
  "ENCOUNTER_PREVIEW",
  "STRATEGY_SELECT",
  "BATTLE_COUNTDOWN",
  "BATTLE",
  "BATTLE_OUTCOME",
  "ROUND_RESULT",
  "SPECTATOR_FAST_FORWARD",
  "ROUND_ADVANCE",
  "MATCH_CHAMPION",
  "MATCH_RESULT",
  "MATCH_POINT",
  "SESSION_COMPLETE",
  "NEXT_MATCH_WAIT",
  "TOURNAMENT_AWARDS",
  "TOURNAMENT_RESULT",
  "RETURNING_RESULT",
  "COMPLETE",
  "SUSPENDED",
  "ERROR",
]);

const PHASE_SET = new Set(TOURNAMENT_PHASES);

export const SAFE_RESUME_PHASES = Object.freeze([
  "LOADING",
  "OPENING",
  "TEAM_INTRO",
  "DEPLOYMENT",
  "INITIAL_EXPLORATION",
  "MATCH_START",
  "ROUND_INTRO",
  "ROUND_EXPLORATION",
  "ENCOUNTER_PREVIEW",
  "STRATEGY_SELECT",
  "BATTLE_COUNTDOWN",
  "BATTLE_OUTCOME",
  "ROUND_RESULT",
  "SPECTATOR_FAST_FORWARD",
  "ROUND_ADVANCE",
  "MATCH_CHAMPION",
  "MATCH_RESULT",
  "MATCH_POINT",
  "SESSION_COMPLETE",
  "NEXT_MATCH_WAIT",
  "TOURNAMENT_AWARDS",
  "TOURNAMENT_RESULT",
  "RETURNING_RESULT",
]);

const SAFE_RESUME_SET = new Set(SAFE_RESUME_PHASES);

export const PHASE_TRANSITIONS = Object.freeze({
  IDLE: Object.freeze(["ENTRY_VALIDATION", "ERROR"]),
  ENTRY_VALIDATION: Object.freeze(["LOADING", "ERROR"]),
  LOADING: Object.freeze(["OPENING", "SUSPENDED", "ERROR"]),
  OPENING: Object.freeze(["DEPLOYMENT", "TEAM_INTRO", "SUSPENDED", "ERROR"]),
  TEAM_INTRO: Object.freeze(["DEPLOYMENT", "SUSPENDED", "ERROR"]),
  DEPLOYMENT: Object.freeze([
    "INITIAL_EXPLORATION",
    "SUSPENDED",
    "ERROR",
  ]),
  INITIAL_EXPLORATION: Object.freeze([
    "MATCH_START",
    "SUSPENDED",
    "ERROR",
  ]),
  MATCH_START: Object.freeze(["ROUND_INTRO", "SUSPENDED", "ERROR"]),
  ROUND_INTRO: Object.freeze([
    "ROUND_EXPLORATION",
    "ENCOUNTER_PREVIEW",
    "ROUND_RESULT",
    "ROUND_ADVANCE",
    "SUSPENDED",
    "ERROR",
  ]),
  ROUND_EXPLORATION: Object.freeze([
    "ENCOUNTER_PREVIEW",
    "ROUND_RESULT",
    "ROUND_ADVANCE",
    "SUSPENDED",
    "ERROR",
  ]),
  ENCOUNTER_PREVIEW: Object.freeze([
    "STRATEGY_SELECT",
    "ROUND_ADVANCE",
    "SUSPENDED",
    "ERROR",
  ]),
  STRATEGY_SELECT: Object.freeze([
    "BATTLE_COUNTDOWN",
    "SUSPENDED",
    "ERROR",
  ]),
  BATTLE_COUNTDOWN: Object.freeze(["BATTLE", "SUSPENDED", "ERROR"]),
  BATTLE: Object.freeze(["BATTLE_OUTCOME", "ERROR"]),
  BATTLE_OUTCOME: Object.freeze([
    "ROUND_RESULT",
    "SPECTATOR_FAST_FORWARD",
    "SUSPENDED",
    "ERROR",
  ]),
  ROUND_RESULT: Object.freeze([
    "ROUND_ADVANCE",
    "SPECTATOR_FAST_FORWARD",
    "SUSPENDED",
    "ERROR",
  ]),
  SPECTATOR_FAST_FORWARD: Object.freeze([
    "MATCH_CHAMPION",
    "SUSPENDED",
    "ERROR",
  ]),
  ROUND_ADVANCE: Object.freeze([
    "ROUND_INTRO",
    "MATCH_CHAMPION",
    "SUSPENDED",
    "ERROR",
  ]),
  MATCH_CHAMPION: Object.freeze([
    "MATCH_RESULT",
    "SUSPENDED",
    "ERROR",
  ]),
  MATCH_RESULT: Object.freeze([
    "MATCH_POINT",
    "SESSION_COMPLETE",
    "NEXT_MATCH_WAIT",
    "TOURNAMENT_AWARDS",
    "SUSPENDED",
    "ERROR",
  ]),
  MATCH_POINT: Object.freeze([
    "SESSION_COMPLETE",
    "NEXT_MATCH_WAIT",
    "TOURNAMENT_AWARDS",
    "SUSPENDED",
    "ERROR",
  ]),
  SESSION_COMPLETE: Object.freeze([
    "TOURNAMENT_AWARDS",
    "SUSPENDED",
    "ERROR",
  ]),
  NEXT_MATCH_WAIT: Object.freeze([
    "DEPLOYMENT",
    "MATCH_START",
    "TOURNAMENT_AWARDS",
    "SUSPENDED",
    "ERROR",
  ]),
  TOURNAMENT_AWARDS: Object.freeze([
    "TOURNAMENT_RESULT",
    "SUSPENDED",
    "ERROR",
  ]),
  TOURNAMENT_RESULT: Object.freeze([
    "RETURNING_RESULT",
    "SUSPENDED",
    "ERROR",
  ]),
  RETURNING_RESULT: Object.freeze(["COMPLETE", "ERROR"]),
  COMPLETE: Object.freeze([]),
  SUSPENDED: Object.freeze([
    ...SAFE_RESUME_PHASES,
    "ERROR",
  ]),
  ERROR: Object.freeze(["ENTRY_VALIDATION", "LOADING"]),
});

export const OPENING_THEME_ASSETS = Object.freeze({
  local: Object.freeze({
    backgroundImage: "back/local.png",
    logoImage: "icon/local.png",
  }),
  national: Object.freeze({
    backgroundImage: "back/national.png",
    logoImage: "icon/national.png",
  }),
  world: Object.freeze({
    backgroundImage: "back/world.png",
    logoImage: "icon/world.png",
  }),
  championship: Object.freeze({
    backgroundImage: "back/champ.png",
    logoImage: "icon/champ.png",
  }),
});

export const TOURNAMENT_MAP_ASSETS = Object.freeze([
  Object.freeze({ mapId: "neon", name: "ネオン街", image: "back/neon.png" }),
  Object.freeze({ mapId: "desert", name: "砂漠", image: "back/sabak.png" }),
  Object.freeze({ mapId: "magma", name: "マグマ", image: "back/magma.png" }),
  Object.freeze({ mapId: "country", name: "田舎町", image: "back/inaka.png" }),
]);

const ROLE_ORDER = Object.freeze(["IGL", "ATK", "SUP"]);
const RUNTIME_HISTORY_LIMIT = 250;

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
    throw new TournamentRuntimeError(`${label} must be a plain object.`, {
      code: "INVALID_RUNTIME_OBJECT",
    });
  }
  return value;
}

function assertNonEmptyString(value, label, maximumLength = 300) {
  if (typeof value !== "string") {
    throw new TournamentRuntimeError(`${label} must be a string.`, {
      code: "INVALID_RUNTIME_STRING",
    });
  }
  const normalized = value.trim();
  if (!normalized || normalized.length > maximumLength) {
    throw new TournamentRuntimeError(
      `${label} must contain 1-${maximumLength} characters.`,
      { code: "INVALID_RUNTIME_STRING_LENGTH" },
    );
  }
  return normalized;
}

function assertNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new TournamentRuntimeError(
      `${label} must be a non-negative integer.`,
      { code: "INVALID_RUNTIME_INTEGER" },
    );
  }
  return value;
}

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value < 1) {
    throw new TournamentRuntimeError(`${label} must be a positive integer.`, {
      code: "INVALID_RUNTIME_INTEGER",
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

function nowIso(clock) {
  const value = clock();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TournamentRuntimeError("Clock returned an invalid date.", {
      code: "INVALID_RUNTIME_CLOCK",
    });
  }
  return date.toISOString();
}

function createGeneratedId(prefix = "runtime") {
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

function getThemeAssets(entry) {
  const themeId = entry.tournament.openingThemeId;
  return OPENING_THEME_ASSETS[themeId] ?? OPENING_THEME_ASSETS.local;
}

function chooseTournamentMap(entry) {
  const checksum = String(entry.checksum ?? entry.entryId);
  let value = 0;
  for (let index = 0; index < checksum.length; index += 1) {
    value = (value + checksum.charCodeAt(index) * (index + 1)) >>> 0;
  }
  return TOURNAMENT_MAP_ASSETS[value % TOURNAMENT_MAP_ASSETS.length];
}

function createOpeningCommentary(entry, role = null) {
  const team = entry.playerTeam;
  const member = role
    ? team.members.find((candidate) => candidate.role === role)
    : null;

  if (role && member) {
    return `${role}は${member.name}！武器は${member.weapon.weaponName}！`;
  }
  return `${entry.company.companyName}の${team.teamName}、3人がステージへ入ります！`;
}

export function createOpeningScenes(entry, teams = null) {
  validateTournamentEntryData(entry);
  const theme = getThemeAssets(entry);
  const map = chooseTournamentMap(entry);
  const members = [...entry.playerTeam.members].sort(
    (left, right) =>
      ROLE_ORDER.indexOf(left.role) - ROLE_ORDER.indexOf(right.role),
  );
  const coachNames = entry.coaches
    .map((coach) => coach.name ?? "初期コーチ")
    .join(" / ");
  const ownedStrategyCount = entry.strategyInventory.filter(
    (strategy) => strategy.unlimited || strategy.tournamentRemaining > 0,
  ).length;

  const featuredCpu =
    Array.isArray(teams)
      ? (
          teams.find((team) => team.guest === true) ??
          teams.find((team) => team.isPlayer !== true)
        )
      : null;

  const scenes = [
    {
      sceneId: "opening-title",
      type: "TOURNAMENT_TITLE",
      duration: 1800,
      backgroundImage: theme.backgroundImage,
      foregroundImages: [],
      text: entry.tournament.tournamentName,
      subtext: entry.tournament.stageName,
      commentary: `${entry.tournament.tournamentName}、開幕です！${entry.company.companyName}の挑戦がここから始まります！`,
      soundId: "opening_title",
      animationId: "logo_fade_in",
      canSkip: true,
    },
    {
      sceneId: "opening-stage",
      type: "STAGE_INTRO",
      duration: 1600,
      backgroundImage: map.image,
      foregroundImages: [],
      text: map.name,
      subtext: `${entry.gameDate.year} / ${entry.gameDate.seasonId}`,
      commentary: `舞台は${map.name}！地形と射線を読み切れるかが勝負の分かれ目です！`,
      soundId: "stage_intro",
      animationId: "stage_pan",
      canSkip: true,
    },
    {
      sceneId: "opening-team-count",
      type: "TEAM_COUNT",
      duration: 1500,
      backgroundImage: theme.backgroundImage,
      foregroundImages: [],
      text: `${entry.tournament.totalTeams} TEAMS`,
      subtext: entry.tournament.stageName,
      commentary: `全${entry.tournament.totalTeams}チームが集結！一瞬の判断が順位を大きく動かします！`,
      soundId: "team_count",
      animationId: "number_reveal",
      canSkip: true,
    },
    {
      sceneId: "opening-player-company",
      type: "PLAYER_COMPANY",
      duration: 1800,
      backgroundImage: theme.backgroundImage,
      foregroundImages: [entry.playerTeam.teamLogo || entry.company.badgeImage],
      text: entry.company.companyName,
      subtext: entry.playerTeam.teamName,
      commentary: createOpeningCommentary(entry),
      soundId: "player_company",
      animationId: "company_reveal",
      canSkip: true,
    },
    {
      sceneId: "opening-player-members",
      type: "PLAYER_MEMBERS",
      duration: 2600,
      backgroundImage: theme.backgroundImage,
      foregroundImages: members.map((member) => member.image),
      teamDataBindings: members.map((member) => ({
        playerId: member.playerId,
        role: member.role,
        name: member.name,
        rank: member.characterRank,
        weaponName: member.weapon.weaponName,
      })),
      text: entry.playerTeam.teamName,
      subtext: members.map((member) => `${member.role} ${member.name}`).join(" / "),
      commentary: members
        .map((member) => createOpeningCommentary(entry, member.role))
        .join(" "),
      soundId: "player_members",
      animationId: "member_lineup",
      canSkip: true,
    },
    {
      sceneId: "opening-featured-cpu",
      type: "FEATURED_CPU",
      duration: 1700,
      backgroundImage: theme.backgroundImage,
      foregroundImages: featuredCpu ? [featuredCpu.teamLogo] : [],
      text: featuredCpu?.teamName ?? "CPU ROSTER READY",
      subtext: featuredCpu
        ? `注目チーム / ${featuredCpu.members.map((member) => member.role).join("・")}`
        : entry.tournament.cpuPoolId,
      commentary: featuredCpu
        ? featuredCpu.guest
          ? `WORLDゲスト、${featuredCpu.teamName}が特別参戦！世界基準の戦いに注目です！`
          : `注目は${featuredCpu.teamName}！役割の噛み合った3人が大会を揺らします！`
        : "CPUチームの正式ロスターを確認しました。",
      soundId: "cpu_spotlight",
      animationId: "data_scan",
      canSkip: true,
    },
    {
      sceneId: "opening-coach-strategy",
      type: "COACH_STRATEGY",
      duration: 1600,
      backgroundImage: theme.backgroundImage,
      foregroundImages: entry.coaches.map((coach) => coach.image),
      text: `${ownedStrategyCount} STRATEGIES READY`,
      subtext: coachNames,
      commentary: `コーチ陣が最終確認中！使用可能な${ownedStrategyCount}作戦から勝負手を選びます！`,
      soundId: "strategy_ready",
      animationId: "strategy_cards",
      canSkip: true,
    },
    {
      sceneId: "opening-search",
      type: "INITIAL_SEARCH",
      duration: 1800,
      backgroundImage: map.image,
      foregroundImages: [],
      text: "INITIAL EXPLORATION",
      subtext: `${entry.carryItems.filter(Boolean).length} CARRY ITEMS`,
      commentary: "初動探索へ！バッグ、施設、接敵情報をそろえて最初のROUNDに備えます！",
      soundId: "exploration",
      animationId: "radar_scan",
      canSkip: true,
    },
    {
      sceneId: "opening-weapon-ready",
      type: "WEAPON_READY",
      duration: 1700,
      backgroundImage: map.image,
      foregroundImages: members.map((member) => member.weapon.image),
      teamDataBindings: members.map((member) => ({
        playerId: member.playerId,
        weaponId: member.weapon.weaponId,
        weaponName: member.weapon.weaponName,
      })),
      text: "WEAPONS READY",
      subtext: members.map((member) => member.weapon.weaponName).join(" / "),
      commentary: `武器準備完了！${members.map((member) => `${member.name}の${member.weapon.weaponName}`).join("、")}が戦場へ向かいます！`,
      soundId: "weapon_ready",
      animationId: "weapon_lineup",
      canSkip: true,
    },
    {
      sceneId: "opening-match-start",
      type: "MATCH_START",
      duration: 2100,
      backgroundImage: map.image,
      foregroundImages: [],
      text: "MATCH START",
      subtext: `${entry.tournament.matches} MATCH SESSION`,
      commentary: `${entry.tournament.tournamentName}、MATCH開始！生存、KP、順位、そのすべてを奪い合います！`,
      soundId: "match_start",
      animationId: "match_start_flash",
      canSkip: false,
    },
  ];

  return deepFreeze(
    scenes.map((scene, index) => ({
      ...scene,
      nextSceneId: scenes[index + 1]?.sceneId ?? null,
    })),
  );
}

function createPlayerTeamRecord(entry) {
  return {
    teamId: entry.playerTeam.teamId,
    teamName: entry.playerTeam.teamName,
    companyName: entry.company.companyName,
    teamLogo: entry.playerTeam.teamLogo,
    groupId: entry.tournament.groupId,
    isPlayer: true,
    isPlaceholder: false,
    source: "entry_data",
    members: deepClone(entry.playerTeam.members),
  };
}

function seedTextToUint32(seedText) {
  const text = String(seedText);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0 || 0x9e3779b9;
}

function createSeededRandom(seedText) {
  let state = seedTextToUint32(seedText);
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x1_0000_0000;
  };
}

function deterministicShuffle(entries, random) {
  const result = [...entries];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [
      result[swapIndex],
      result[index],
    ];
  }
  return result;
}

function getCpuPoolForEntry(entry) {
  switch (entry.tournament.cpuPoolId) {
    case "cpu-local":
      return {
        pool: LOCAL_CPU_TEAMS,
        source: "cpu-local",
        selectionMode: "local_pool",
      };
    case "cpu-national":
      return {
        pool: NATIONAL_CPU_TEAMS,
        source: "cpu-national",
        selectionMode: "national_pool",
      };
    case "cpu-world":
      return {
        pool: getWorldCpuTeamsForYear(entry.gameDate.year),
        source: "cpu-world",
        selectionMode:
          entry.gameDate.year >= 1993
            ? "world_pool_with_year5_expansion"
            : "world_formal_pool",
      };
    case "championship-top-20":
      return {
        pool: getWorldCpuTeamsForYear(entry.gameDate.year),
        source: "championship-top-20",
        selectionMode:
          "world_pool_fallback_pending_championship_point_table",
      };
    default:
      throw new TournamentRuntimeValidationError(
        `Unsupported CPU pool: ${entry.tournament.cpuPoolId}`,
        "UNSUPPORTED_CPU_POOL",
      );
  }
}

function resolveCpuTeamForm(entry, random) {
  const rates = entry.tournament.cpuFormRates;
  if (
    rates &&
    Number.isFinite(rates.slump) &&
    Number.isFinite(rates.hot) &&
    rates.slump >= 0 &&
    rates.hot >= 0 &&
    rates.slump + rates.hot <= 1
  ) {
    const roll = random();
    if (roll < rates.slump) {
      return {
        form: "slump",
        source: "entry_cpu_form_rates",
      };
    }
    if (roll >= 1 - rates.hot) {
      return {
        form: "hot",
        source: "entry_cpu_form_rates",
      };
    }
  }

  return {
    form: "normal",
    source: "default_normal_no_probability_specified",
  };
}

function getCpuFormRange(player, form) {
  if (form === "slump") {
    return player.slumpRankRange;
  }
  if (form === "hot") {
    return player.hotRankRange;
  }
  return player.normalRankRange;
}

function createCpuSkillSnapshots(player) {
  const commonSkills = getRoleCommonSkills(player.role);
  const commonById = new Map(
    commonSkills.map((skill) => [skill.id, skill]),
  );
  const skillIds =
    player.skillProfile === "unique" &&
    Array.isArray(player.uniqueSkillIds) &&
    player.uniqueSkillIds.length === 3
      ? player.uniqueSkillIds
      : commonSkills.map((skill) => skill.id);

  return skillIds.map((skillId) => {
    const common = commonById.get(skillId);
    if (common) {
      return {
        skillId: common.id,
        name: common.name,
        type: common.type,
        target: common.target,
        baseCt: common.baseCt,
        source:
          player.skillProfile === "unique"
            ? "unique_common_override"
            : "role_common",
      };
    }
    return {
      skillId,
      name: skillId,
      type: "UNRESOLVED_UNIQUE",
      target: "battle_defined",
      baseCt: null,
      source: "unique_skill_pending_battle_master",
    };
  });
}

function createCpuMemberRecord(sourcePlayer, teamId, form, random) {
  const rankRange = getCpuFormRange(sourcePlayer, form);
  const characterRank = resolveCpuRankFromRange(
    rankRange,
    random(),
  );
  const battleStats = buildCpuBattleStats(
    characterRank,
    sourcePlayer.role,
  );
  const maxHp = calculateMaxHp(battleStats.stamina);
  const weaponProfile = resolveCpuWeaponProfile(sourcePlayer);

  return {
    playerId: sourcePlayer.id,
    id: sourcePlayer.id,
    teamId,
    name: sourcePlayer.name,
    role: sourcePlayer.role,
    image: sourcePlayer.image,
    characterRank,
    sourceRankRange: deepClone(rankRange),
    sourceForm: form,
    battleStats: deepClone(battleStats),
    maxHp,
    currentHp: maxHp,
    combatState: "alive",
    weapon: {
      weaponId: `cpu-weapon-${sourcePlayer.id}`,
      weaponName: weaponProfile.weaponName,
      image: null,
      ammoMax: 12,
      ammoCurrent: 12,
      preferredRange: weaponProfile.preferredRange,
      source: weaponProfile.source,
    },
    skillProfile: sourcePlayer.skillProfile,
    skills: createCpuSkillSnapshots(sourcePlayer),
    specialAbilities: [],
    dataFallbacks:
      sourcePlayer.weaponSource === "role_template_fallback"
        ? ["weaponName", "preferredRange"]
        : [],
  };
}

function createCpuTeamRecord(
  sourceTeam,
  entry,
  selectionIndex,
  selectionMeta,
  random,
) {
  const formResult = resolveCpuTeamForm(entry, random);
  const members = sourceTeam.members.map((sourcePlayer) =>
    createCpuMemberRecord(
      sourcePlayer,
      sourceTeam.teamId,
      formResult.form,
      random,
    ),
  );

  return {
    teamId: sourceTeam.teamId,
    teamName: sourceTeam.name,
    companyName: sourceTeam.companyName,
    teamLogo: sourceTeam.logo,
    description: sourceTeam.description,
    groupId: null,
    isPlayer: false,
    isPlaceholder: false,
    source: selectionMeta.source,
    selectionMode: selectionMeta.selectionMode,
    selectionIndex,
    form: formResult.form,
    formSource: formResult.source,
    formLocked: true,
    unlockGameYear: sourceTeam.unlockGameYear,
    unlockCalendarYear: sourceTeam.unlockCalendarYear,
    isExpansionTeam: sourceTeam.isExpansionTeam,
    teamTrait: sourceTeam.teamTrait,
    members,
  };
}

export function selectCpuTeamsForEntry(entry) {
  validateTournamentEntryData(entry);
  const participantSeeds =
    entry.tournament.participantSeeds;

  if (
    Array.isArray(participantSeeds) &&
    participantSeeds.length > 0
  ) {
    const random = createSeededRandom(
      `${entry.entryId}|${entry.checksum}|circuit-participants`,
    );
    return deepFreeze(
      participantSeeds
        .filter(
          (seed) =>
            seed.teamId !== entry.playerTeam.teamId &&
            seed.isPlayer !== true,
        )
        .map((seed, index) => {
          const master = resolveCpuTeamMaster(
            seed.teamId,
            entry.gameDate.year,
          );
          if (!master) {
            throw new TournamentRuntimeValidationError(
              `Circuit team master not found: ${seed.teamId}`,
              "CIRCUIT_TEAM_MASTER_NOT_FOUND",
            );
          }
          const record = createCpuTeamRecord(
            master,
            entry,
            index + 1,
            {
              source: `circuit-${seed.sourcePool ?? "cpu"}`,
              selectionMode:
                seed.guest === true
                  ? "world_guest"
                  : "formal_circuit_seed",
            },
            random,
          );
          record.groupId = seed.groupId ?? null;
          record.guest = seed.guest === true;
          record.sourcePlace = seed.sourcePlace ?? null;
          return record;
        }),
    );
  }

  const requiredCount = Math.max(
    0,
    entry.tournament.totalTeams - 1,
  );
  const selectionMeta = getCpuPoolForEntry(entry);
  if (requiredCount > selectionMeta.pool.length) {
    throw new TournamentRuntimeValidationError(
      `CPU pool ${selectionMeta.source} has only ${selectionMeta.pool.length} teams for ${requiredCount} slots.`,
      "CPU_POOL_TOO_SMALL",
    );
  }

  const random = createSeededRandom(
    `${entry.entryId}|${entry.checksum}|${entry.tournament.cpuPoolId}`,
  );
  const selected = deterministicShuffle(
    selectionMeta.pool,
    random,
  ).slice(0, requiredCount);

  return deepFreeze(
    selected.map((team, index) =>
      createCpuTeamRecord(
        team,
        entry,
        index + 1,
        selectionMeta,
        random,
      ),
    ),
  );
}

export function createTournamentTeamSlots(entry) {
  validateTournamentEntryData(entry);
  const player = createPlayerTeamRecord(entry);
  const cpuTeams = selectCpuTeamsForEntry(entry);
  const participantSeeds = entry.tournament.participantSeeds;

  if (
    Array.isArray(participantSeeds) &&
    participantSeeds.length > 0
  ) {
    const cpuById = new Map(
      cpuTeams.map((team) => [team.teamId, team]),
    );
    const ordered = participantSeeds.map((seed) => {
      if (
        seed.teamId === entry.playerTeam.teamId ||
        seed.isPlayer === true
      ) {
        return {
          ...deepClone(player),
          groupId: seed.groupId ?? null,
          guest: false,
        };
      }
      const team = cpuById.get(seed.teamId);
      if (!team) {
        throw new TournamentRuntimeValidationError(
          `Circuit slot team missing: ${seed.teamId}`,
          "CIRCUIT_SLOT_TEAM_MISSING",
        );
      }
      return team;
    });
    return deepFreeze(ordered);
  }

  return deepFreeze([player, ...cpuTeams]);
}

function createPlayerMemberRuntime(member) {
  const sourceMaxHp =
    Number.isFinite(member.maxHp) && member.maxHp > 0
      ? member.maxHp
      : 500;
  const sourceHp =
    Number.isFinite(member.currentHp)
      ? Math.max(0, Math.min(sourceMaxHp, member.currentHp))
      : sourceMaxHp;
  const hpRate =
    sourceMaxHp > 0
      ? sourceHp / sourceMaxHp
      : 1;
  const scaledMaxHp =
    Math.max(
      650,
      Math.round(sourceMaxHp * 1.3),
    );
  return {
    playerId: member.playerId,
    teamId: null,
    role: member.role,
    hp:
      Math.max(
        sourceHp > 0 ? 1 : 0,
        Math.round(scaledMaxHp * hpRate),
      ),
    maxHp: scaledMaxHp,
    combatState: member.currentHp > 0 ? "alive" : "down",
    downCount: 0,
    deathCount: 0,
    reviveCount: 0,
    shots: 0,
    hits: 0,
    damage: 0,
    damageTaken: 0,
    kills: 0,
    assists: 0,
    healing: 0,
    skillUses: 0,
    weaponShots: 0,
    weaponHits: 0,
    weaponDamage: 0,
    weaponReloads: 0,
    currentAmmo: member.weapon.ammoCurrent,
    reloadRemaining: 0,
    skillCt: Object.fromEntries(
      member.skills.map((skill) => [skill.skillId, 0]),
    ),
    temporaryEffects: [],
  };
}

function createPlayerTeamRuntime(entry) {
  const members = entry.playerTeam.members.map((member) => {
    const sourceMaxHp =
      Number.isFinite(member.maxHp) && member.maxHp > 0
        ? member.maxHp
        : 500;
    const sourceHp =
      Number.isFinite(member.currentHp)
        ? Math.max(0, Math.min(sourceMaxHp, member.currentHp))
        : sourceMaxHp;
    const scaledMaxHp =
      Math.max(
        650,
        Math.round(sourceMaxHp * 1.3),
      );
    const currentHp =
      Math.max(
        sourceHp > 0 ? 1 : 0,
        Math.round(
          scaledMaxHp *
          (
            sourceMaxHp > 0
              ? sourceHp / sourceMaxHp
              : 1
          ),
        ),
      );
    return {
      playerId: member.playerId,
      maxHp: scaledMaxHp,
      currentHp,
      combatState: currentHp > 0 ? "alive" : "down",
    };
  });
  return {
    teamId: entry.playerTeam.teamId,
    matchHp: members.map((member) => member.currentHp),
    persistentHp: members.map((member) => member.currentHp),
    combatState: members.map((member) => member.combatState),
    skillCt: entry.playerTeam.members.map((member) =>
      Object.fromEntries(member.skills.map((skill) => [skill.skillId, 0])),
    ),
    temporaryBuffs: [],
    matchBuffs: [],
    currentStrategyId: "D-01",
    strategyConsumed: false,
    kills: 0,
    assists: 0,
    damage: 0,
    damageTaken: 0,
    wins: 0,
    bestPlace: null,
    points: 0,
    condition: entry.playerTeam.currentForm ?? "normal",
  };
}

function createCpuMemberRuntime(member) {
  return {
    playerId: member.playerId,
    teamId: member.teamId,
    role: member.role,
    hp: member.currentHp,
    maxHp: member.maxHp,
    combatState: "alive",
    downCount: 0,
    deathCount: 0,
    reviveCount: 0,
    shots: 0,
    hits: 0,
    damage: 0,
    damageTaken: 0,
    kills: 0,
    assists: 0,
    healing: 0,
    skillUses: 0,
    weaponShots: 0,
    weaponHits: 0,
    weaponDamage: 0,
    weaponReloads: 0,
    currentAmmo: member.weapon.ammoCurrent,
    reloadRemaining: 0,
    skillCt: Object.fromEntries(
      member.skills.map((skill) => [skill.skillId, 0]),
    ),
    temporaryEffects: [],
  };
}

function createCpuTeamRuntime(team) {
  return {
    teamId: team.teamId,
    matchHp: team.members.map((member) => member.currentHp),
    persistentHp: team.members.map((member) => member.currentHp),
    combatState: team.members.map(() => "alive"),
    skillCt: team.members.map((member) =>
      Object.fromEntries(
        member.skills.map((skill) => [skill.skillId, 0]),
      ),
    ),
    temporaryBuffs: [],
    matchBuffs: [],
    currentStrategyId: "D-01",
    strategyConsumed: false,
    kills: 0,
    assists: 0,
    damage: 0,
    damageTaken: 0,
    wins: 0,
    bestPlace: null,
    points: 0,
    condition: team.form,
    formLocked: team.formLocked,
  };
}

function createInventoryRuntime(entry) {
  const slots = entry.carryItems.map((item, slotIndex) =>
    item === null
      ? null
      : {
          slotIndex,
          itemId: item.itemId,
          name: item.name,
          image: item.image ?? null,
          source: item.source,
          quantity: item.quantity,
          initialQuantity: item.quantity,
          carryQuantity: item.quantity,
          explorationQuantity: 0,
          acquiredDuringTournament: false,
        },
  );
  return {
    capacity: entry.carryBag.capacity,
    slots,
    consumedCarryItems: {},
    acquiredItemIds: [],
    totalUses: 0,
    useHistory: [],
  };
}

function createStrategyRuntime(entry) {
  return Object.fromEntries(
    entry.strategyInventory.map((strategy) => [
      strategy.strategyId,
      {
        strategyId: strategy.strategyId,
        name: strategy.name,
        rank: strategy.rank,
        effect: deepClone(strategy.effect),
        unlimited: strategy.unlimited === true,
        persistentOwnedCount: strategy.persistentOwnedCount,
        tournamentRemaining: strategy.unlimited
          ? null
          : strategy.tournamentRemaining,
        uses: 0,
      },
    ]),
  );
}

function createEmptyTotals(entry) {
  return {
    teamId: entry.playerTeam.teamId,
    placementPoint: 0,
    kp: 0,
    ap: 0,
    damage: 0,
    damageTaken: 0,
    wins: 0,
    bestPlace: null,
    matchCount: 0,
    roundCount: 0,
  };
}

function appendPhaseHistory(runtime, phase, timestamp, reason = null) {
  runtime.phaseHistory.push({
    phase,
    at: timestamp,
    reason,
  });
  if (runtime.phaseHistory.length > RUNTIME_HISTORY_LIMIT) {
    runtime.phaseHistory.splice(
      0,
      runtime.phaseHistory.length - RUNTIME_HISTORY_LIMIT,
    );
  }
}

function runtimeChecksumPayload(runtime) {
  const clone = deepClone(runtime);
  delete clone.runtimeChecksum;
  return clone;
}

export function calculateTournamentRuntimeChecksum(runtime) {
  return calculateChecksum(runtimeChecksumPayload(runtime));
}

export function createTournamentRuntime(
  entry,
  {
    clock = () => new Date(),
    idFactory = createGeneratedId,
  } = {},
) {
  validateTournamentEntryData(entry);
  const timestamp = nowIso(clock);
  const teams = createTournamentTeamSlots(entry);
  const map = chooseTournamentMap(entry);
  const openingScenes = createOpeningScenes(entry, teams);
  const memberRuntime = Object.fromEntries(
    teams.flatMap((team) =>
      team.members.map((member) => {
        if (team.isPlayer) {
          const runtimeMember = createPlayerMemberRuntime(member);
          runtimeMember.teamId = team.teamId;
          return [member.playerId, runtimeMember];
        }
        return [
          member.playerId,
          createCpuMemberRuntime(member),
        ];
      }),
    ),
  );
  const teamRuntime = Object.fromEntries(
    teams.map((team) => [
      team.teamId,
      team.isPlayer
        ? createPlayerTeamRuntime(entry)
        : createCpuTeamRuntime(team),
    ]),
  );
  const cpuTeamIds = teams
    .filter((team) => !team.isPlayer)
    .map((team) => team.teamId);
  const initialOpponentId = cpuTeamIds[0] ?? null;

  const runtime = {
    runtimeVersion: TOURNAMENT_RUNTIME_VERSION,
    runtimeId: idFactory("runtime"),
    entrySchemaVersion: TOURNAMENT_ENTRY_SCHEMA_VERSION,
    entryId: entry.entryId,
    entrySnapshotHash: entry.entrySnapshotHash,
    entryChecksum: entry.checksum,
    entryData: deepClone(entry),
    revision: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    phase: "LOADING",
    previousPhase: "ENTRY_VALIDATION",
    resumeTargetPhase: "LOADING",
    phaseHistory: [
      { phase: "ENTRY_VALIDATION", at: timestamp, reason: "entry_loaded" },
      { phase: "LOADING", at: timestamp, reason: "runtime_created" },
    ],
    tournamentId: entry.tournament.tournamentId,
    sessionId: entry.tournament.sessionId,
    seasonId: entry.gameDate.seasonId,
    cpuMasterVersions: {
      localData: CPU_LOCAL_DATA_VERSION,
      localMaster: CPU_LOCAL_MASTER_VERSION,
      nationalData: CPU_NATIONAL_DATA_VERSION,
      nationalMaster: CPU_NATIONAL_MASTER_VERSION,
      worldData: CPU_WORLD_DATA_VERSION,
      worldMaster: CPU_WORLD_MASTER_VERSION,
    },
    match: 0,
    round: 0,
    playerTeamId: entry.playerTeam.teamId,
    teams: deepClone(teams),
    activeTeamIds:
      Array.isArray(entry.tournament.matchPlan) &&
      entry.tournament.matchPlan.length > 0
        ? [...entry.tournament.matchPlan[0].participantTeamIds]
        : teams.map((team) => team.teamId),
    eliminated: [],
    currentPairs:
      initialOpponentId === null
        ? []
        : [[entry.playerTeam.teamId, initialOpponentId]],
    currentOpponentId: initialOpponentId,
    lockedOpponentId: initialOpponentId,
    teamRuntime,
    memberRuntime,
    totals: createEmptyTotals(entry),
    matchTotals: [],
    roundTotals: [],
    inventory: createInventoryRuntime(entry),
    strategyRuntime: createStrategyRuntime(entry),
    explorationRuntime: {
      maximumPerMatch: 3,
      completedKeys: [],
      currentExploreIndex: 0,
      currentExploreKey: null,
      currentPage: "SEARCH",
      currentAreaName: map.name,
      pendingExploreItem: null,
      pendingItemUse: null,
      deterministicChoices: {},
      history: [],
    },
    facilityRuntime: {
      usedByExploreKey: {},
      deterministicOutcomes: {},
    },
    strategyUi: {
      tab: "ALL",
      selectedId: "D-01",
      confirmedId: null,
      confirmedAtRound: null,
    },
    commentaryHistory: [],
    awardRuntime: {
      awards: [],
      mvpCandidates: [],
      currentIndex: 0,
      completed: false,
    },
    matchPointRuntime: null,
    currentSection: null,
    circuitRuntime: {
      circuitYear: entry.tournament.circuitYear ?? entry.gameDate.year,
      circuitStageId: entry.tournament.circuitStageId ?? entry.tournament.stageId,
      stagePart: entry.tournament.stagePart ?? null,
      matchPlan: deepClone(entry.tournament.matchPlan ?? []),
      initialTotals: deepClone(entry.tournament.initialTotals ?? {}),
      sourceTournamentIds: deepClone(entry.tournament.sourceTournamentIds ?? []),
    },
    roundIntegration: {
      encounterRate: 0.75,
      encounters: {},
      cpuFastHistory: [],
      remainingAnnouncements: [],
      playerEliminatedAt: null,
      matchPlacements: {},
    },
    finalRankings: null,
    tournamentResultData: null,
    rewardPreview: null,
    opening: {
      scenes: deepClone(openingScenes),
      sceneIndex: 0,
      sceneId: openingScenes[0].sceneId,
      completed: false,
      skipped: false,
    },
    map: deepClone(map),
    randomState: {
      seed: entry.playerTeam.tournamentSeed,
      cursor: 0,
      finalizedDraws: {},
    },
    pendingVisualId: "opening-title",
    activeBattle: null,
    lastBattleResult: null,
    lastBattleEvents: [],
    battleHistory: [],
    resultSignature: null,
    returnStatus: "pending",
    suspendReason: null,
    error: null,
    runtimeChecksum: null,
  };

  if (
    Array.isArray(entry.tournament.matchPlan) &&
    entry.tournament.matchPlan.length > 0
  ) {
    const originalMatch = runtime.match;
    runtime.match = 1;
    applyMatchPlanToDraft(runtime, 1);
    runtime.match = originalMatch;
    runtime.round = 0;
  }

  runtime.runtimeChecksum = calculateTournamentRuntimeChecksum(runtime);
  validateTournamentRuntime(runtime, entry);
  return deepFreeze(runtime);
}

export function validateTournamentRuntime(runtime, entry = null) {
  assertPlainObject(runtime, "Tournament runtime");
  if (runtime.runtimeVersion !== TOURNAMENT_RUNTIME_VERSION) {
    throw new TournamentRuntimeValidationError(
      `Unsupported runtime version: ${runtime.runtimeVersion}`,
      "UNSUPPORTED_RUNTIME_VERSION",
    );
  }
  assertNonEmptyString(runtime.runtimeId, "Runtime ID", 300);
  assertNonEmptyString(runtime.entryId, "Runtime entry ID", 300);
  assertNonEmptyString(
    runtime.entrySnapshotHash,
    "Runtime entry snapshot hash",
    100,
  );
  if (!PHASE_SET.has(runtime.phase)) {
    throw new TournamentRuntimeValidationError(
      `Unknown tournament phase: ${runtime.phase}`,
      "INVALID_RUNTIME_PHASE",
    );
  }
  assertNonNegativeInteger(runtime.revision, "Runtime revision");
  assertPlainObject(runtime.cpuMasterVersions, "CPU master versions");
  assertNonNegativeInteger(runtime.match, "Runtime match");
  assertNonNegativeInteger(runtime.round, "Runtime round");
  if (!Array.isArray(runtime.teams) || runtime.teams.length < 1) {
    throw new TournamentRuntimeValidationError(
      "Runtime teams must be a non-empty array.",
      "INVALID_RUNTIME_TEAMS",
    );
  }
  if (!Array.isArray(runtime.activeTeamIds)) {
    throw new TournamentRuntimeValidationError(
      "Active team IDs must be an array.",
      "INVALID_ACTIVE_TEAMS",
    );
  }

  const runtimeTeamIds = runtime.teams.map((team) => team.teamId);
  if (
    new Set(runtimeTeamIds).size !== runtimeTeamIds.length ||
    runtime.teams.some((team) => team.isPlaceholder === true)
  ) {
    throw new TournamentRuntimeValidationError(
      "Runtime CPU teams must be unique formal roster records.",
      "INVALID_FORMAL_CPU_ROSTER",
    );
  }

  for (const team of runtime.teams.filter((candidate) => !candidate.isPlayer)) {
    if (
      !Array.isArray(team.members) ||
      team.members.length !== 3 ||
      new Set(team.members.map((member) => member.role)).size !== 3
    ) {
      throw new TournamentRuntimeValidationError(
        `CPU team roster is invalid: ${team.teamId}`,
        "INVALID_CPU_TEAM_ROSTER",
      );
    }
    for (const member of team.members) {
      if (
        !member.characterRank ||
        !member.battleStats ||
        member.weapon?.ammoMax !== 12 ||
        !Array.isArray(member.skills) ||
        member.skills.length !== 3
      ) {
        throw new TournamentRuntimeValidationError(
          `CPU player runtime source is invalid: ${member.playerId}`,
          "INVALID_CPU_PLAYER_RUNTIME_SOURCE",
        );
      }
    }
  }

  assertPlainObject(runtime.teamRuntime, "Team runtime");
  assertPlainObject(runtime.memberRuntime, "Member runtime");
  if (
    Object.keys(runtime.teamRuntime).length !== runtime.teams.length ||
    Object.keys(runtime.memberRuntime).length !== runtime.teams.length * 3
  ) {
    throw new TournamentRuntimeValidationError(
      "CPU/player runtime map counts are inconsistent.",
      "INVALID_RUNTIME_ROSTER_MAP_COUNT",
    );
  }
  if (
    runtime.currentOpponentId !== null &&
    (
      runtime.currentOpponentId === runtime.playerTeamId ||
      !runtimeTeamIds.includes(runtime.currentOpponentId)
    )
  ) {
    throw new TournamentRuntimeValidationError(
      "Current CPU opponent is invalid.",
      "INVALID_CURRENT_CPU_OPPONENT",
    );
  }
  assertPlainObject(runtime.inventory, "Inventory runtime");
  assertPlainObject(runtime.strategyRuntime, "Strategy runtime");
  assertPlainObject(runtime.explorationRuntime, "Exploration runtime");
  assertPlainObject(runtime.facilityRuntime, "Facility runtime");
  assertPlainObject(runtime.strategyUi, "Strategy UI runtime");
  assertPlainObject(runtime.awardRuntime, "Award runtime");
  assertPlainObject(runtime.roundIntegration, "Round integration runtime");
  if (
    !Number.isFinite(runtime.roundIntegration.encounterRate) ||
    runtime.roundIntegration.encounterRate < 0 ||
    runtime.roundIntegration.encounterRate > 1 ||
    !Array.isArray(runtime.roundIntegration.cpuFastHistory) ||
    !Array.isArray(runtime.roundIntegration.remainingAnnouncements)
  ) {
    throw new TournamentRuntimeValidationError(
      "Tournament round integration state is invalid.",
      "INVALID_ROUND_INTEGRATION",
    );
  }
  if (
    !Array.isArray(runtime.awardRuntime.awards) ||
    !Number.isInteger(runtime.awardRuntime.currentIndex) ||
    runtime.awardRuntime.currentIndex < 0
  ) {
    throw new TournamentRuntimeValidationError(
      "Tournament award state is invalid.",
      "INVALID_AWARD_RUNTIME",
    );
  }
  if (
    runtime.finalRankings !== null &&
    (
      !Array.isArray(runtime.finalRankings) ||
      runtime.finalRankings.length !== runtime.teams.length
    )
  ) {
    throw new TournamentRuntimeValidationError(
      "Tournament final rankings are invalid.",
      "INVALID_FINAL_RANKINGS",
    );
  }
  if (
    runtime.tournamentResultData !== null &&
    (
      typeof runtime.tournamentResultData !== "object" ||
      runtime.tournamentResultData.entryId !== runtime.entryId
    )
  ) {
    throw new TournamentRuntimeValidationError(
      "Tournament result runtime data is invalid.",
      "INVALID_TOURNAMENT_RESULT_RUNTIME",
    );
  }
  if (
    !Array.isArray(runtime.inventory.useHistory) ||
    !Number.isInteger(runtime.inventory.totalUses) ||
    runtime.inventory.totalUses < 0
  ) {
    throw new TournamentRuntimeValidationError(
      "Tournament item-use history is invalid.",
      "INVALID_ITEM_USE_HISTORY",
    );
  }
  if (
    !Array.isArray(runtime.explorationRuntime.completedKeys) ||
    !Array.isArray(runtime.explorationRuntime.history) ||
    !["SEARCH", "FACILITY", "BAG", "ALIVE_TEAMS"].includes(
      runtime.explorationRuntime.currentPage,
    )
  ) {
    throw new TournamentRuntimeValidationError(
      "Tournament exploration state is invalid.",
      "INVALID_EXPLORATION_STATE",
    );
  }
  if (
    !["ALL", "D", "C", "B", "A", "S", "SS"].includes(
      runtime.strategyUi.tab,
    ) ||
    !runtime.strategyRuntime[runtime.strategyUi.selectedId]
  ) {
    throw new TournamentRuntimeValidationError(
      "Tournament strategy UI state is invalid.",
      "INVALID_STRATEGY_UI_STATE",
    );
  }
  if (!Array.isArray(runtime.battleHistory)) {
    throw new TournamentRuntimeValidationError(
      "Battle history must be an array.",
      "INVALID_BATTLE_HISTORY",
    );
  }
  if (!Array.isArray(runtime.lastBattleEvents)) {
    throw new TournamentRuntimeValidationError(
      "Last battle events must be an array.",
      "INVALID_LAST_BATTLE_EVENTS",
    );
  }
  if (
    runtime.lastBattleResult !== null &&
    (
      typeof runtime.lastBattleResult !== "object" ||
      runtime.lastBattleResult.status !== "complete"
    )
  ) {
    throw new TournamentRuntimeValidationError(
      "Last battle result is invalid.",
      "INVALID_LAST_BATTLE_RESULT",
    );
  }
  if (
    !Array.isArray(runtime.opening?.scenes) ||
    runtime.opening.scenes.length !== 10
  ) {
    throw new TournamentRuntimeValidationError(
      "Opening runtime must contain 10 independent scenes.",
      "INVALID_OPENING_SCENES",
    );
  }
  if (Object.keys(runtime.strategyRuntime).length !== 50) {
    throw new TournamentRuntimeValidationError(
      "Tournament runtime must contain all 50 strategies.",
      "INVALID_STRATEGY_RUNTIME",
    );
  }
  if (
    runtime.inventory.capacity < 5 ||
    runtime.inventory.capacity > 10 ||
    runtime.inventory.slots.length !== runtime.inventory.capacity
  ) {
    throw new TournamentRuntimeValidationError(
      "Tournament inventory capacity is invalid.",
      "INVALID_RUNTIME_INVENTORY",
    );
  }
  const actualChecksum = calculateTournamentRuntimeChecksum(runtime);
  if (actualChecksum !== runtime.runtimeChecksum) {
    throw new TournamentRuntimeValidationError(
      "Tournament runtime checksum does not match.",
      "RUNTIME_CHECKSUM_MISMATCH",
    );
  }

  if (entry) {
    validateTournamentEntryData(entry);
    if (
      runtime.entryId !== entry.entryId ||
      runtime.entrySnapshotHash !== entry.entrySnapshotHash ||
      runtime.entryChecksum !== entry.checksum
    ) {
      throw new TournamentRuntimeValidationError(
        "Tournament runtime belongs to a different entry.",
        "RUNTIME_ENTRY_MISMATCH",
      );
    }
    if (runtime.teams.length !== entry.tournament.totalTeams) {
      throw new TournamentRuntimeValidationError(
        "Tournament team-slot count does not match entry data.",
        "RUNTIME_TEAM_COUNT_MISMATCH",
      );
    }
  }
  return true;
}

function refreshRuntimeChecksum(runtime) {
  runtime.runtimeChecksum = null;
  runtime.runtimeChecksum = calculateTournamentRuntimeChecksum(runtime);
  return runtime;
}

export function canTransitionTournamentPhase(fromPhase, toPhase) {
  if (!PHASE_SET.has(fromPhase) || !PHASE_SET.has(toPhase)) {
    return false;
  }
  return PHASE_TRANSITIONS[fromPhase].includes(toPhase);
}

export function transitionTournamentRuntime(
  runtime,
  nextPhase,
  {
    clock = () => new Date(),
    reason = null,
    patch = {},
  } = {},
) {
  validateTournamentRuntime(runtime);
  if (!PHASE_SET.has(nextPhase)) {
    throw new TournamentPhaseTransitionError(
      `Unknown destination phase: ${nextPhase}`,
      runtime.phase,
      nextPhase,
    );
  }
  if (!canTransitionTournamentPhase(runtime.phase, nextPhase)) {
    throw new TournamentPhaseTransitionError(
      `Cannot transition from ${runtime.phase} to ${nextPhase}.`,
      runtime.phase,
      nextPhase,
    );
  }
  assertPlainObject(patch, "Runtime transition patch");

  const next = deepClone(runtime);
  const timestamp = nowIso(clock);
  next.previousPhase = next.phase;
  next.phase = nextPhase;
  next.revision += 1;
  next.updatedAt = timestamp;
  Object.assign(next, deepClone(patch));
  appendPhaseHistory(next, nextPhase, timestamp, reason);
  refreshRuntimeChecksum(next);
  validateTournamentRuntime(next);
  return deepFreeze(next);
}

export function resolveSafeResumePhase(phase, previousPhase = null) {
  if (SAFE_RESUME_SET.has(phase)) {
    return phase;
  }
  if (phase === "BATTLE") {
    return "BATTLE_COUNTDOWN";
  }
  if (phase === "SUSPENDED" && SAFE_RESUME_SET.has(previousPhase)) {
    return previousPhase;
  }
  if (phase === "ERROR") {
    return "LOADING";
  }
  if (phase === "COMPLETE") {
    return "TOURNAMENT_RESULT";
  }
  return "LOADING";
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
    throw new TournamentResumeValidationError(`${label} is empty.`, {
      code: "EMPTY_RESUME_DATA",
    });
  }
  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (error) {
    throw new TournamentResumeValidationError(
      `${label} is not valid JSON.`,
      { code: "INVALID_RESUME_JSON", cause: error },
    );
  }
  if (!parsed?.payload || !parsed?.checksum) {
    throw new TournamentResumeValidationError(
      `${label} envelope is invalid.`,
      { code: "INVALID_RESUME_ENVELOPE" },
    );
  }
  const actual = calculateChecksum(parsed.payload);
  if (actual !== parsed.checksum) {
    throw new TournamentResumeValidationError(
      `${label} checksum does not match.`,
      { code: "RESUME_ENVELOPE_CHECKSUM_MISMATCH" },
    );
  }
  if (parsed.payload.schemaVersion !== expectedSchema) {
    throw new TournamentResumeValidationError(
      `${label} schema is not supported: ${parsed.payload.schemaVersion}`,
      { code: "UNSUPPORTED_RESUME_SCHEMA" },
    );
  }
  return parsed.payload;
}

export function createTournamentResumeData(
  runtime,
  {
    clock = () => new Date(),
    reason = "manual_checkpoint",
  } = {},
) {
  validateTournamentRuntime(runtime);
  const safePhase = resolveSafeResumePhase(
    runtime.phase,
    runtime.previousPhase,
  );
  const resumeRuntime = deepClone(runtime);
  resumeRuntime.resumeTargetPhase = safePhase;
  refreshRuntimeChecksum(resumeRuntime);

  return deepFreeze({
    schemaVersion: TOURNAMENT_RESUME_SCHEMA_VERSION,
    runtimeVersion: TOURNAMENT_RUNTIME_VERSION,
    entryId: runtime.entryId,
    entrySnapshotHash: runtime.entrySnapshotHash,
    entryChecksum: runtime.entryChecksum,
    tournamentId: runtime.tournamentId,
    sessionId: runtime.sessionId,
    phase: runtime.phase,
    safePhase,
    previousPhase: runtime.previousPhase,
    match: runtime.match,
    round: runtime.round,
    activeTeamIds: deepClone(runtime.activeTeamIds),
    teamRuntime: deepClone(runtime.teamRuntime),
    memberRuntime: deepClone(runtime.memberRuntime),
    totals: deepClone(runtime.totals),
    inventory: deepClone(runtime.inventory),
    strategyRuntime: deepClone(runtime.strategyRuntime),
    explorationRuntime: deepClone(runtime.explorationRuntime),
    facilityRuntime: deepClone(runtime.facilityRuntime),
    randomState: deepClone(runtime.randomState),
    pendingVisualId: runtime.pendingVisualId,
    resultSignature: runtime.resultSignature,
    reason,
    savedAt: nowIso(clock),
    runtime: resumeRuntime,
    runtimeChecksum: resumeRuntime.runtimeChecksum,
  });
}

export function validateTournamentResumeDataForEntry(resume, entry) {
  assertPlainObject(resume, "Tournament resume data");
  validateTournamentEntryData(entry);
  if (resume.schemaVersion !== TOURNAMENT_RESUME_SCHEMA_VERSION) {
    throw new TournamentResumeValidationError(
      `Unsupported resume schema: ${resume.schemaVersion}`,
      { code: "UNSUPPORTED_RESUME_SCHEMA" },
    );
  }
  if (resume.runtimeVersion !== TOURNAMENT_RUNTIME_VERSION) {
    throw new TournamentResumeValidationError(
      `Unsupported runtime version: ${resume.runtimeVersion}`,
      { code: "UNSUPPORTED_RESUME_RUNTIME" },
    );
  }
  for (const field of [
    "entryId",
    "entrySnapshotHash",
    "entryChecksum",
    "phase",
    "safePhase",
    "savedAt",
  ]) {
    assertNonEmptyString(resume[field], `Resume ${field}`, 300);
  }
  if (
    resume.entryId !== entry.entryId ||
    resume.entrySnapshotHash !== entry.entrySnapshotHash ||
    resume.entryChecksum !== entry.checksum
  ) {
    throw new TournamentResumeValidationError(
      "Resume data belongs to a different tournament entry.",
      { code: "RESUME_ENTRY_MISMATCH" },
    );
  }
  if (!PHASE_SET.has(resume.phase) || !SAFE_RESUME_SET.has(resume.safePhase)) {
    throw new TournamentResumeValidationError(
      "Resume phase is invalid.",
      { code: "INVALID_RESUME_PHASE" },
    );
  }
  validateTournamentRuntime(resume.runtime, entry);
  if (resume.runtimeChecksum !== resume.runtime.runtimeChecksum) {
    throw new TournamentResumeValidationError(
      "Resume runtime checksum does not match.",
      { code: "RESUME_RUNTIME_CHECKSUM_MISMATCH" },
    );
  }
  return true;
}

export function saveTournamentResumeData(
  storage,
  runtime,
  options = {},
) {
  const validStorage = normalizeStorage(storage);
  const resume = createTournamentResumeData(runtime, options);
  validStorage.setItem(
    STORAGE_KEYS.tournamentResume,
    serializeTransferPayload(resume),
  );
  return resume;
}

export function readTournamentResumeDataForEntry(storage, entry) {
  const validStorage = normalizeStorage(storage);
  const serialized = validStorage.getItem(STORAGE_KEYS.tournamentResume);
  if (serialized === null) {
    return null;
  }
  const resume = deserializeTransferPayload(
    serialized,
    TOURNAMENT_RESUME_SCHEMA_VERSION,
    "Tournament resume data",
  );
  validateTournamentResumeDataForEntry(resume, entry);
  return deepFreeze(resume);
}

export function clearTournamentResumeData(storage) {
  const validStorage = normalizeStorage(storage);
  validStorage.removeItem(STORAGE_KEYS.tournamentResume);
  return true;
}

export class TournamentRuntimeError extends Error {
  constructor(message, { code = "TOURNAMENT_RUNTIME_ERROR", cause } = {}) {
    super(message, { cause });
    this.name = "TournamentRuntimeError";
    this.code = code;
  }
}

export class TournamentRuntimeValidationError extends TournamentRuntimeError {
  constructor(message, code = "INVALID_TOURNAMENT_RUNTIME") {
    super(message, { code });
    this.name = "TournamentRuntimeValidationError";
  }
}

export class TournamentResumeValidationError extends TournamentRuntimeError {
  constructor(message, { code = "INVALID_TOURNAMENT_RESUME", cause } = {}) {
    super(message, { code, cause });
    this.name = "TournamentResumeValidationError";
  }
}

export class TournamentPhaseTransitionError extends TournamentRuntimeError {
  constructor(message, fromPhase, toPhase) {
    super(message, { code: "INVALID_PHASE_TRANSITION" });
    this.name = "TournamentPhaseTransitionError";
    this.fromPhase = fromPhase;
    this.toPhase = toPhase;
  }
}

export function createTournamentRuntimeManager({
  storage = globalThis.localStorage,
  clock = () => new Date(),
  idFactory = createGeneratedId,
} = {}) {
  const validStorage = normalizeStorage(storage);
  const listeners = new Set();
  let entry = null;
  let runtime = null;
  let operationLocked = false;

  function emit(type, detail = {}) {
    const snapshot = runtime ? deepFreeze(deepClone(runtime)) : null;
    for (const listener of listeners) {
      listener(snapshot, { type, ...detail });
    }
  }

  function replaceRuntime(nextRuntime, type, detail = {}) {
    validateTournamentRuntime(nextRuntime, entry);
    runtime = deepClone(nextRuntime);
    emit(type, detail);
    return getSnapshot();
  }

  function requireRuntime() {
    if (!runtime) {
      throw new TournamentRuntimeError("Tournament runtime is not loaded.", {
        code: "RUNTIME_NOT_LOADED",
      });
    }
    return runtime;
  }

  function withOperationLock(operation) {
    if (operationLocked) {
      throw new TournamentRuntimeError(
        "Another tournament operation is already running.",
        { code: "TOURNAMENT_OPERATION_LOCKED" },
      );
    }
    operationLocked = true;
    try {
      return operation();
    } finally {
      operationLocked = false;
    }
  }

  function boot({ preferResume = true } = {}) {
    return withOperationLock(() => {
      entry = readTournamentEntryFromStorage(validStorage);
      if (!entry) {
        throw new TournamentRuntimeError(
          "大会参加データが見つかりません。メイン画面から大会へ参加してください。",
          { code: "MISSING_TOURNAMENT_ENTRY" },
        );
      }
      validateTournamentEntryData(entry);

      if (preferResume) {
        const resume = readTournamentResumeDataForEntry(validStorage, entry);
        if (resume) {
          const restored = deepClone(resume.runtime);
          if (
            restored.explorationRuntime?.currentPage === "PASSIVE_INTEL"
          ) {
            restored.explorationRuntime.currentPage = "SEARCH";
          }
          restored.previousPhase = restored.phase;
          restored.phase = resume.safePhase;
          restored.resumeTargetPhase = resume.safePhase;
          restored.suspendReason = null;
          restored.error = null;
          restored.revision += 1;
          restored.updatedAt = nowIso(clock);
          appendPhaseHistory(
            restored,
            restored.phase,
            restored.updatedAt,
            "resume_loaded",
          );
          refreshRuntimeChecksum(restored);
          runtime = restored;
          emit("resumed", { resume });
          return getSnapshot();
        }
      }

      runtime = deepClone(
        createTournamentRuntime(entry, { clock, idFactory }),
      );
      emit("booted", { entry: deepFreeze(deepClone(entry)) });
      return getSnapshot();
    });
  }

  function getSnapshot() {
    return runtime ? deepFreeze(deepClone(runtime)) : null;
  }

  function getEntry() {
    return entry ? deepFreeze(deepClone(entry)) : null;
  }

  function transition(nextPhase, options = {}) {
    return withOperationLock(() => {
      const next = transitionTournamentRuntime(
        requireRuntime(),
        nextPhase,
        { ...options, clock },
      );
      return replaceRuntime(next, "phase_changed", {
        fromPhase: next.previousPhase,
        toPhase: next.phase,
      });
    });
  }

  function update(label, mutator) {
    return withOperationLock(() => {
      assertNonEmptyString(label, "Runtime update label", 120);
      if (typeof mutator !== "function") {
        throw new TypeError("Runtime mutator must be a function.");
      }
      const draft = deepClone(requireRuntime());
      const result = mutator(draft);
      if (result?.then && typeof result.then === "function") {
        throw new TypeError("Asynchronous runtime updates are not supported.");
      }
      draft.revision += 1;
      draft.updatedAt = nowIso(clock);
      refreshRuntimeChecksum(draft);
      replaceRuntime(draft, "runtime_updated", { label });
      return deepFreeze({
        state: getSnapshot(),
        result: deepClone(result),
      });
    });
  }

  function setOpeningScene(sceneIndex) {
    return update("opening_scene_changed", (draft) => {
      if (
        !Number.isInteger(sceneIndex) ||
        sceneIndex < 0 ||
        sceneIndex >= draft.opening.scenes.length
      ) {
        throw new RangeError("Opening scene index is invalid.");
      }
      draft.opening.sceneIndex = sceneIndex;
      draft.opening.sceneId = draft.opening.scenes[sceneIndex].sceneId;
      draft.pendingVisualId = draft.opening.sceneId;
      return deepClone(draft.opening.scenes[sceneIndex]);
    });
  }

  function completeOpening({ skipped = false } = {}) {
    return withOperationLock(() => {
      const draft = deepClone(requireRuntime());
      if (draft.phase !== "OPENING") {
        throw new TournamentPhaseTransitionError(
          "Opening can only be completed from OPENING phase.",
          draft.phase,
          "DEPLOYMENT",
        );
      }
      draft.opening.completed = true;
      draft.opening.skipped = skipped === true;
      draft.opening.sceneIndex = draft.opening.scenes.length - 1;
      draft.opening.sceneId = draft.opening.scenes.at(-1).sceneId;
      draft.pendingVisualId = "deployment";
      refreshRuntimeChecksum(draft);
      const next = transitionTournamentRuntime(draft, "DEPLOYMENT", {
        clock,
        reason: skipped
          ? "opening_skipped_to_deployment"
          : "opening_completed_to_deployment",
      });
      return replaceRuntime(next, "opening_completed", { skipped });
    });
  }

  function checkpoint(reason = "auto_checkpoint") {
    const current = requireRuntime();
    const resume = saveTournamentResumeData(validStorage, current, {
      clock,
      reason,
    });
    emit("checkpoint_saved", { reason, resume });
    return resume;
  }

  function suspend(reason = "manual_suspend") {
    return withOperationLock(() => {
      const current = requireRuntime();
      const safePhase = resolveSafeResumePhase(
        current.phase,
        current.previousPhase,
      );
      let next;
      if (current.phase === "SUSPENDED") {
        next = deepClone(current);
      } else if (canTransitionTournamentPhase(current.phase, "SUSPENDED")) {
        next = deepClone(
          transitionTournamentRuntime(current, "SUSPENDED", {
            clock,
            reason,
            patch: {
              resumeTargetPhase: safePhase,
              suspendReason: reason,
            },
          }),
        );
      } else {
        throw new TournamentPhaseTransitionError(
          `Cannot suspend from ${current.phase}.`,
          current.phase,
          "SUSPENDED",
        );
      }
      refreshRuntimeChecksum(next);
      runtime = next;
      const resume = saveTournamentResumeData(validStorage, runtime, {
        clock,
        reason,
      });
      emit("suspended", { reason, resume });
      return getSnapshot();
    });
  }

  function resume() {
    return withOperationLock(() => {
      const current = requireRuntime();
      if (current.phase !== "SUSPENDED") {
        throw new TournamentPhaseTransitionError(
          "Runtime is not suspended.",
          current.phase,
          current.resumeTargetPhase,
        );
      }
      const nextPhase = resolveSafeResumePhase(
        current.resumeTargetPhase,
        current.previousPhase,
      );
      const next = transitionTournamentRuntime(current, nextPhase, {
        clock,
        reason: "manual_resume",
        patch: { suspendReason: null },
      });
      clearTournamentResumeData(validStorage);
      return replaceRuntime(next, "resumed", { nextPhase });
    });
  }

  function resetFromEntry() {
    return withOperationLock(() => {
      if (!entry) {
        entry = readTournamentEntryFromStorage(validStorage);
      }
      if (!entry) {
        throw new TournamentRuntimeError("Tournament entry is missing.", {
          code: "MISSING_TOURNAMENT_ENTRY",
        });
      }
      clearTournamentResumeData(validStorage);
      runtime = deepClone(
        createTournamentRuntime(entry, { clock, idFactory }),
      );
      emit("reset");
      return getSnapshot();
    });
  }

  function markError(error) {
    const current = requireRuntime();
    const normalizedError = {
      code: error?.code ?? error?.name ?? "TOURNAMENT_RUNTIME_ERROR",
      message: error?.message ?? String(error),
      at: nowIso(clock),
    };
    const draft = deepClone(current);
    const sourcePhase = draft.phase;
    draft.previousPhase = sourcePhase;
    draft.phase = "ERROR";
    draft.error = normalizedError;
    draft.updatedAt = normalizedError.at;
    draft.revision += 1;
    appendPhaseHistory(
      draft,
      "ERROR",
      normalizedError.at,
      normalizedError.code,
    );
    refreshRuntimeChecksum(draft);
    return replaceRuntime(draft, "error", { error: normalizedError });
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      throw new TypeError("Runtime listener must be a function.");
    }
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return Object.freeze({
    boot,
    getSnapshot,
    getEntry,
    transition,
    update,
    setOpeningScene,
    completeOpening,
    checkpoint,
    suspend,
    resume,
    resetFromEntry,
    markError,
    subscribe,
    clearResume: () => clearTournamentResumeData(validStorage),
  });
}
