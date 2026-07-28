/**
 * MOB BR tournament rankings, awards, reward preview, and return contract.
 *
 * The tournament runtime owns temporary calculations only. Placement rewards
 * are always resolved from the immutable rewardTableSnapshot received from the
 * main system. Persistent rewards are applied by the main system after it
 * validates the signed TournamentResultData.
 */

import { assetPath } from "../assets.js";
import {
  getChampionshipPoints,
  getPlacementPoints,
} from "../../data/game-data.js?v=27";
import {
  STRATEGY_RULES,
} from "../../data/strategy-data.js";
import {
  FORMAL_CIRCUIT_RULES,
  isCasualTournamentType,
} from "../../data/circuit-data.js?v=27";
import {
  applyMatchPlanToDraft,
  getMatchParticipantIds,
} from "./circuit.js?v=27";
import {
  getPlayableRoundCount,
} from "./round.js?v=27";
import {
  finalizeTournamentResultData,
  resolvePlacementRewards,
  writeTournamentResultToStorage,
} from "../main/tournament-bridge.js?v=27";

export const RESULTS_VERSION =
  "mobbr-tournament-results-1.9.0";

export const RESULT_RULES = Object.freeze({
  defaultMatchPointThreshold: 50,
  awardCategories: Object.freeze([
    "KILL_LEADER",
    "DAMAGE_LEADER",
    "ASSIST_LEADER",
    "HEALING_LEADER",
    "ACCURACY_LEADER",
    "MVP",
    "FINAL_PODIUM",
  ]),
  rankingTieBreakers: Object.freeze([
    "sumTotal",
    "sumPlacementPoint",
    "sumKp",
    "sumAp",
    "sumDamage",
    "wins",
    "bestPlace",
    "teamId",
  ]),
  awardTieBreakers: Object.freeze([
    "primaryValue",
    "kills",
    "damage",
    "assists",
    "survivalTime",
    "teamPlace",
    "playerId",
  ]),
});

const ROLE_ORDER = Object.freeze(["IGL", "ATK", "SUP"]);

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

function formatNumber(value) {
  return new Intl.NumberFormat("ja-JP").format(value);
}

function tournamentThemeBackground(runtime) {
  const theme = runtime.entryData.tournament.openingThemeId;
  if (theme === "national") return "back/national.png";
  if (theme === "world") return "back/world.png";
  if (theme === "championship") return "back/champ.png";
  return "back/local.png";
}

function assertRuntime(draft) {
  if (!draft || typeof draft !== "object") {
    throw new TypeError("Tournament runtime must be an object.");
  }
  if (!Array.isArray(draft.teams) || draft.teams.length < 2) {
    throw new TypeError("Tournament teams are missing.");
  }
  return draft;
}

function hashText(value) {
  const text = String(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0 || 0x9e3779b9;
}

function stableUnit(seed) {
  return hashText(seed) / 0x1_0000_0000;
}

function teamById(runtime, teamId) {
  const team = runtime.teams.find(
    (candidate) => candidate.teamId === teamId,
  );
  if (!team) {
    throw new RangeError(`Unknown tournament team: ${teamId}`);
  }
  return team;
}

function teamBattlePower(team) {
  return team.members.reduce((sum, member) => {
    const stats = member.stats ?? member.battleStats ?? {};
    return (
      sum +
      Object.values(stats).reduce(
        (statSum, value) =>
          statSum + (Number.isFinite(value) ? value : 0),
        0,
      )
    );
  }, 0);
}

function matchBattleRecords(runtime, match) {
  return runtime.battleHistory.filter(
    (record) => record.match === match,
  );
}

function matchRoundRecords(runtime, match) {
  return runtime.roundTotals
    .filter(
      (record) =>
        record.match === match &&
        record.fieldResolved === true,
    )
    .sort(
      (left, right) =>
        left.round - right.round,
    );
}

function createFormalMatchStats(runtime, teamId, match) {
  const records = matchRoundRecords(runtime, match);
  const aggregate = {
    kp: 0,
    ap: 0,
    damage: 0,
    damageTaken: 0,
    downs: 0,
    wins: 0,
    losses: 0,
    rounds: records.length,
    lastActiveRound: 0,
    eliminatedRound: null,
    lastScore: Number.NEGATIVE_INFINITY,
    finalSurvivor: false,
  };

  for (const record of records) {
    const row = record.teamResults?.find(
      (candidate) => candidate.teamId === teamId,
    );
    if (!row) continue;
    aggregate.kp += row.kp ?? 0;
    aggregate.ap += row.ap ?? 0;
    aggregate.damage += row.damage ?? 0;
    aggregate.damageTaken += row.damageTaken ?? 0;
    aggregate.downs += row.downs ?? 0;
    aggregate.lastScore = row.score ?? aggregate.lastScore;
    if (row.survived) {
      aggregate.lastActiveRound = record.round;
      aggregate.wins += 1;
    } else if (aggregate.eliminatedRound === null) {
      aggregate.eliminatedRound = record.round;
      aggregate.losses += 1;
    }
  }

  const finalRecord = records.at(-1);
  aggregate.finalSurvivor =
    finalRecord?.activeTeamsAfter?.includes(teamId) === true;
  if (!Number.isFinite(aggregate.lastScore)) {
    aggregate.lastScore =
      stableUnit(
        `${runtime.entryId}|${match}|${teamId}|legacy-formal-score`,
      ) * teamBattlePower(teamById(runtime, teamId));
  }
  return aggregate;
}

function createLegacyMatchStats(runtime, team, match) {
  const power = teamBattlePower(team);
  const variation = stableUnit(
    `${runtime.entryId}|${team.teamId}|${match}|legacy-match-stats`,
  );
  const rounds = getPlayableRoundCount(runtime);
  const killRoll = stableUnit(
    `${runtime.entryId}|${team.teamId}|${match}|legacy-kp`,
  );
  const kp = killRoll < 0.5 ? 0 : killRoll < 0.82 ? 1 : killRoll < 0.97 ? 2 : 3;
  return {
    kp,
    ap: kp === 0 ? 0 : Math.min(kp * 2, Math.floor(variation * (kp + 2))),
    damage: Math.max(0, Math.min(2800, Math.round(power * (1.7 + variation * 1.2)))),
    damageTaken: Math.max(0, Math.round(power * (1.5 + (1 - variation) * 1.7))),
    downs: Math.max(0, Math.round(power / 170 + variation * 4)),
    wins: 0,
    losses: 0,
    rounds,
    lastActiveRound: Math.floor(variation * rounds),
    eliminatedRound: null,
    lastScore: power + variation * 100,
    finalSurvivor: false,
  };
}

function createMatchRankingRows(runtime) {
  const formalRecords = matchRoundRecords(
    runtime,
    runtime.match,
  );
  const finalRecord = formalRecords.at(-1);
  const championTeamId =
    finalRecord?.activeTeamsAfter?.length === 1
      ? finalRecord.activeTeamsAfter[0]
      : runtime.activeTeamIds.length === 1
        ? runtime.activeTeamIds[0]
        : null;

  const participantIds = new Set(
    getMatchParticipantIds(runtime, runtime.match),
  );
  const scored = runtime.teams
    .filter((team) => participantIds.has(team.teamId))
    .map((team) => {
    const stats = formalRecords.length > 0
      ? createFormalMatchStats(runtime, team.teamId, runtime.match)
      : createLegacyMatchStats(runtime, team, runtime.match);
    return {
      team,
      stats,
      champion: team.teamId === championTeamId,
    };
  });

  scored.sort((left, right) => {
    if (left.champion !== right.champion) {
      return left.champion ? -1 : 1;
    }
    if (right.stats.lastActiveRound !== left.stats.lastActiveRound) {
      return right.stats.lastActiveRound - left.stats.lastActiveRound;
    }
    const leftElimination = left.stats.eliminatedRound ?? Number.MAX_SAFE_INTEGER;
    const rightElimination = right.stats.eliminatedRound ?? Number.MAX_SAFE_INTEGER;
    if (rightElimination !== leftElimination) {
      return rightElimination - leftElimination;
    }
    if (right.stats.lastScore !== left.stats.lastScore) {
      return right.stats.lastScore - left.stats.lastScore;
    }
    if (right.stats.kp !== left.stats.kp) {
      return right.stats.kp - left.stats.kp;
    }
    if (right.stats.damage !== left.stats.damage) {
      return right.stats.damage - left.stats.damage;
    }
    return left.team.teamId.localeCompare(right.team.teamId);
  });

  const previousTotals = createTournamentTotals(runtime);
  return scored.map((entry, index) => {
    const place = index + 1;
    const placementPoint = getPlacementPoints(place);
    const total = placementPoint + entry.stats.kp;
    const previous = previousTotals[entry.team.teamId] ?? {
      sumTotal: 0,
      sumPlacementPoint: 0,
      sumKp: 0,
    };
    return {
      place,
      teamId: entry.team.teamId,
      teamName: entry.team.teamName,
      teamLogo: entry.team.teamLogo,
      isPlayer: entry.team.teamId === runtime.playerTeamId,
      champion: place === 1,
      placementPoint,
      kp: entry.stats.kp,
      ap: entry.stats.ap,
      damage: entry.stats.damage,
      damageTaken: entry.stats.damageTaken,
      downs: entry.stats.downs,
      survivedRounds: entry.stats.lastActiveRound,
      eliminatedRound: entry.stats.eliminatedRound,
      total,
      cumulativeTotal: previous.sumTotal + total,
      cumulativePlacement: previous.sumPlacementPoint + placementPoint,
      cumulativeKp: previous.sumKp + entry.stats.kp,
      status:
        place === 1
          ? "CHAMPION"
          : entry.stats.finalSurvivor
            ? "FINALIST"
            : "ELIMINATED",
    };
  });
}

export function createTournamentTotals(runtime) {
  assertRuntime(runtime);
  const initialTotals =
    runtime.entryData.tournament.initialTotals ?? {};
  const totals = Object.fromEntries(
    runtime.teams.map((team) => {
      const initial = initialTotals[team.teamId] ?? {};
      return [
        team.teamId,
        {
          teamId: team.teamId,
          teamName: team.teamName,
          teamLogo: team.teamLogo,
          isPlayer: team.teamId === runtime.playerTeamId,
          sumPlacementPoint: initial.sumPlacementPoint ?? 0,
          sumKp: initial.sumKp ?? 0,
          sumTotal: initial.sumTotal ?? 0,
          sumAp: initial.sumAp ?? 0,
          sumDamage: initial.sumDamage ?? 0,
          sumDamageTaken: initial.sumDamageTaken ?? 0,
          wins: initial.wins ?? 0,
          bestPlace: initial.bestPlace ?? null,
          matchesPlayed: initial.matchesPlayed ?? 0,
        },
      ];
    }),
  );

  for (const matchRecord of runtime.matchTotals) {
    for (const row of matchRecord.rankings ?? []) {
      const total = totals[row.teamId];
      if (!total) continue;
      total.sumPlacementPoint += row.placementPoint;
      total.sumKp += row.kp;
      total.sumTotal += row.total;
      total.sumAp += row.ap;
      total.sumDamage += row.damage;
      total.sumDamageTaken += row.damageTaken;
      total.wins += row.place === 1 ? 1 : 0;
      total.bestPlace =
        total.bestPlace === null
          ? row.place
          : Math.min(total.bestPlace, row.place);
      total.matchesPlayed += 1;
    }
  }
  return totals;
}

function compareFinalTotals(left, right) {
  if (right.sumTotal !== left.sumTotal) {
    return right.sumTotal - left.sumTotal;
  }
  if (
    right.sumPlacementPoint !== left.sumPlacementPoint
  ) {
    return (
      right.sumPlacementPoint -
      left.sumPlacementPoint
    );
  }
  if (right.sumKp !== left.sumKp) {
    return right.sumKp - left.sumKp;
  }
  if (right.sumAp !== left.sumAp) {
    return right.sumAp - left.sumAp;
  }
  if (right.sumDamage !== left.sumDamage) {
    return right.sumDamage - left.sumDamage;
  }
  if (right.wins !== left.wins) {
    return right.wins - left.wins;
  }
  const leftBest = left.bestPlace ?? Number.MAX_SAFE_INTEGER;
  const rightBest = right.bestPlace ?? Number.MAX_SAFE_INTEGER;
  if (leftBest !== rightBest) {
    return leftBest - rightBest;
  }
  return left.teamId.localeCompare(right.teamId);
}

export function createFinalRankings(runtime) {
  const totals = Object.values(createTournamentTotals(runtime));
  totals.sort(compareFinalTotals);

  const matchPointWinner =
    runtime.matchPointRuntime?.mpWinner ?? null;
  if (matchPointWinner) {
    const winnerIndex = totals.findIndex(
      (total) => total.teamId === matchPointWinner,
    );
    if (winnerIndex > 0) {
      const [winner] = totals.splice(winnerIndex, 1);
      totals.unshift(winner);
    }
  }

  return deepFreeze(
    totals.map((total, index) => ({
      place: index + 1,
      ...deepClone(total),
      matchPointWinner:
        total.teamId === matchPointWinner,
    })),
  );
}

function updateMatchPointToDraft(draft, matchRecord) {
  const rule = draft.entryData.tournament.matchPointRule;
  if (!rule?.enabled) {
    return null;
  }
  draft.matchPointRuntime ??= {
    enabled: true,
    threshold:
      Number.isFinite(rule.threshold) && rule.threshold > 0
        ? rule.threshold
        : RESULT_RULES.defaultMatchPointThreshold,
    eligibleTeamIds: [],
    newEligibleTeamIds: [],
    matchPointReachedAt: {},
    mpWinner: null,
    winnerConfirmedAtMatch: null,
    completedMatches: 0,
    maxMatches: draft.entryData.tournament.matches,
    suddenDeath: false,
    suddenDeathRule: "final_match_champion_after_max_matches",
  };

  const state = draft.matchPointRuntime;
  const eligibleBefore = new Set(state.eligibleTeamIds);
  state.newEligibleTeamIds = [];
  if (
    state.mpWinner === null &&
    eligibleBefore.has(matchRecord.championTeamId)
  ) {
    state.mpWinner = matchRecord.championTeamId;
    state.winnerConfirmedAtMatch = matchRecord.match;
  }

  state.completedMatches = draft.matchTotals.length;
  const totals = createTournamentTotals(draft);
  for (const total of Object.values(totals)) {
    if (
      total.sumTotal >= state.threshold &&
      !state.eligibleTeamIds.includes(total.teamId)
    ) {
      state.eligibleTeamIds.push(total.teamId);
      state.newEligibleTeamIds.push(total.teamId);
      state.matchPointReachedAt[total.teamId] = matchRecord.match;
    }
  }
  state.eligibleTeamIds.sort();
  state.newEligibleTeamIds.sort();

  if (
    state.mpWinner === null &&
    state.completedMatches >= state.maxMatches
  ) {
    // The final scheduled MATCH is treated as an all-team MATCH POINT round.
    // Its champion takes the MATCH POINT winner slot.
    state.mpWinner = matchRecord.championTeamId ?? null;
    state.winnerConfirmedAtMatch = matchRecord.match;
    state.suddenDeath = state.mpWinner !== null;
  }
  return deepClone(state);
}

export function finalizeCurrentMatchToDraft(draft) {
  assertRuntime(draft);
  if (
    draft.matchTotals.some(
      (record) => record.match === draft.match,
    )
  ) {
    return deepFreeze(
      deepClone(
        draft.matchTotals.find(
          (record) => record.match === draft.match,
        ),
      ),
    );
  }

  const rankings = createMatchRankingRows(draft);
  const champion = rankings[0];
  const playerRow = rankings.find(
    (row) => row.teamId === draft.playerTeamId,
  );
  const currentPlan =
    draft.entryData.tournament.matchPlan?.find(
      (entry) => entry.match === draft.match,
    ) ?? null;
  const record = {
    match: draft.match,
    circuitMatch: currentPlan?.circuitMatch ?? draft.match,
    sectionId: currentPlan?.sectionId ?? "ALL",
    sectionName: currentPlan?.sectionName ?? "ALL TEAMS",
    sectionMatch: currentPlan?.sectionMatch ?? draft.match,
    participantTeamIds: deepClone(
      currentPlan?.participantTeamIds ?? rankings.map((row) => row.teamId),
    ),
    playerParticipated: playerRow !== undefined,
    provisional: false,
    resultCalculated: true,
    championTeamId: champion.teamId,
    championTeamName: champion.teamName,
    playerPlace: playerRow?.place ?? null,
    placementPoint: playerRow?.placementPoint ?? 0,
    kp: playerRow?.kp ?? 0,
    ap: playerRow?.ap ?? 0,
    damage: playerRow?.damage ?? 0,
    damageTaken: playerRow?.damageTaken ?? 0,
    total: playerRow?.total ?? 0,
    rankings,
  };
  draft.matchTotals.push(record);

  if (playerRow) {
    draft.totals.placementPoint += playerRow.placementPoint;
    draft.totals.kp += playerRow.kp;
    draft.totals.ap += playerRow.ap;
    draft.totals.damage += playerRow.damage;
    draft.totals.damageTaken += playerRow.damageTaken;
    draft.totals.wins += playerRow.place === 1 ? 1 : 0;
    draft.totals.bestPlace =
      draft.totals.bestPlace === null
        ? playerRow.place
        : Math.min(draft.totals.bestPlace, playerRow.place);
    draft.totals.matchCount += 1;
    draft.totals.roundCount += matchRoundRecords(
      draft,
      draft.match,
    ).length;
  }

  updateMatchPointToDraft(draft, record);
  draft.pendingVisualId = `match-champion:${champion.teamId}`;
  return deepFreeze(deepClone(record));
}

function resetMemberForNextMatch(runtimeMember) {
  runtimeMember.hp = runtimeMember.maxHp;
  runtimeMember.combatState = "alive";
  runtimeMember.currentAmmo = 12;
  runtimeMember.reloadRemaining = 0;
  runtimeMember.skillCt = Object.fromEntries(
    Object.keys(runtimeMember.skillCt ?? {}).map(
      (skillId) => [skillId, 0],
    ),
  );
  runtimeMember.temporaryEffects = [];
  runtimeMember.nextBattleOpeningEffects = [];
  runtimeMember.lifeSerial =
    (runtimeMember.lifeSerial ?? 1) + 1;
  runtimeMember.lifeId =
    `${runtimeMember.playerId}-life-${runtimeMember.lifeSerial}`;
}

export function prepareNextMatchToDraft(draft) {
  assertRuntime(draft);
  const totalMatches = draft.entryData.tournament.matches;
  if (draft.match >= totalMatches) {
    throw new RangeError("All configured matches are complete.");
  }

  draft.match += 1;
  draft.round = 0;
  applyMatchPlanToDraft(draft, draft.match);
  draft.eliminated = [];
  draft.currentPairs = [];
  draft.currentOpponentId = null;
  draft.lockedOpponentId = null;
  draft.activeBattle = null;
  draft.lastBattleResult = null;
  draft.lastBattleEvents = [];
  draft.pendingVisualId = "match-start";
  draft.explorationRuntime.currentExploreIndex = 0;
  draft.explorationRuntime.currentExploreKey = null;
  draft.explorationRuntime.currentPage = "SEARCH";
  draft.explorationRuntime.pendingExploreItem = null;
  draft.explorationRuntime.pendingItemUse = null;
  draft.strategyUi.confirmedId = null;
  draft.roundIntegration.playerEliminatedAt = null;
  draft.roundIntegration.matchPlacements[draft.match] = {};

  for (const member of Object.values(draft.memberRuntime)) {
    resetMemberForNextMatch(member);
  }
  for (const team of draft.teams) {
    for (const member of team.members) {
      const runtimeMember = draft.memberRuntime[member.playerId];
      member.currentHp = runtimeMember.maxHp;
      member.maxHp = runtimeMember.maxHp;
      member.combatState = "alive";
    }
  }
  for (const member of draft.entryData.playerTeam.members) {
    const runtimeMember = draft.memberRuntime[member.playerId];
    member.currentHp = runtimeMember.maxHp;
    member.maxHp = runtimeMember.maxHp;
    member.combatState = "alive";
  }
  for (const [teamId, teamRuntime] of Object.entries(
    draft.teamRuntime,
  )) {
    const team = teamById(draft, teamId);
    teamRuntime.matchHp = team.members.map(
      (member) => draft.memberRuntime[member.playerId].hp,
    );
    teamRuntime.persistentHp = [...teamRuntime.matchHp];
    teamRuntime.combatState = team.members.map(() => "alive");
    teamRuntime.skillCt = team.members.map(
      (member) =>
        deepClone(
          draft.memberRuntime[member.playerId].skillCt,
        ),
    );
    teamRuntime.temporaryBuffs = [];
    teamRuntime.matchBuffs = [];
    teamRuntime.strategyConsumed = false;
  }

  return deepFreeze({
    match: draft.match,
    totalMatches,
  });
}

function cumulativePlayerMemberResults(runtime) {
  const playerTeam = teamById(
    runtime,
    runtime.playerTeamId,
  );
  const matches = runtime.matchTotals.length;
  const rounds = runtime.battleHistory.filter(
    (record) =>
      record.result?.participantResults?.some(
        (member) => member.teamId === runtime.playerTeamId,
      ),
  ).length;

  return [...playerTeam.members]
    .sort(
      (left, right) =>
        ROLE_ORDER.indexOf(left.role) -
        ROLE_ORDER.indexOf(right.role),
    )
    .map((member) => {
      const stats = runtime.memberRuntime[member.playerId];
      const shots = Math.max(0, Math.floor(stats.shots ?? 0));
      const hits = Math.min(
        shots,
        Math.max(0, Math.floor(stats.hits ?? 0)),
      );
      return {
        playerId: member.playerId,
        name: member.name,
        role: member.role,
        image: member.image,
        teamId: runtime.playerTeamId,
        teamName: playerTeam.teamName,
        weaponId: member.weapon.weaponId,
        weaponName: member.weapon.weaponName,
        weaponImage: member.weapon.image ?? null,
        matches,
        rounds,
        kills: Math.max(0, Math.floor(stats.kills ?? 0)),
        assists: Math.max(0, Math.floor(stats.assists ?? 0)),
        downsGiven: Math.max(
          0,
          Math.floor(stats.downsGiven ?? 0),
        ),
        deaths: Math.max(0, Math.floor(stats.deaths ?? 0)),
        revives: Math.max(0, Math.floor(stats.revives ?? 0)),
        damage: Math.max(0, Math.floor(stats.damage ?? 0)),
        damageTaken: Math.max(
          0,
          Math.floor(stats.damageTaken ?? 0),
        ),
        healing: Math.max(0, Math.floor(stats.healing ?? 0)),
        shots,
        hits,
        skillUses: Math.max(
          0,
          Math.floor(stats.skillUses ?? 0),
        ),
        survivalTime: Math.max(
          0,
          Math.floor(stats.survivalTime ?? 0),
        ),
        weaponShots: Math.max(
          0,
          Math.floor(stats.weaponShots ?? 0),
        ),
        weaponHits: Math.max(
          0,
          Math.floor(stats.weaponHits ?? 0),
        ),
        weaponDamage: Math.max(
          0,
          Math.floor(stats.weaponDamage ?? 0),
        ),
        weaponReloads: Math.max(
          0,
          Math.floor(stats.weaponReloads ?? 0),
        ),
        kp: Math.max(0, Math.floor(stats.kills ?? 0)),
        ap: Math.max(0, Math.floor(stats.assists ?? 0)),
        accuracy: shots === 0 ? 0 : hits / shots,
      };
    });
}

function createCpuMemberAwardStats(
  runtime,
  team,
  member,
  teamPlace,
) {
  const teamTotal = createTournamentTotals(runtime)[team.teamId];
  const seed = `${runtime.entryId}|${team.teamId}|${member.playerId}|awards`;
  const roleBoost =
    member.role === "ATK"
      ? 1.14
      : member.role === "SUP"
        ? 0.92
        : 1;
  const kills = Math.max(
    0,
    Math.min(
      teamTotal.sumKp,
      Math.floor(
        (teamTotal.sumKp / 3) * roleBoost +
          stableUnit(`${seed}|kills`) * 1.5,
      ),
    ),
  );
  const assists = Math.max(
    0,
    Math.round(
      (teamTotal.sumAp / 3) *
        (member.role === "SUP" ? 1.25 : 0.9) +
        stableUnit(`${seed}|assists`) * 3,
    ),
  );
  const damage = Math.max(
    0,
    Math.round(
      (teamTotal.sumDamage / 3) * roleBoost +
        stableUnit(`${seed}|damage`) * 700,
    ),
  );
  const healing =
    member.role === "SUP"
      ? Math.round(
          damage * (0.25 + stableUnit(`${seed}|heal`) * 0.4),
        )
      : Math.round(
          stableUnit(`${seed}|heal`) * 90,
        );
  const shots = 40 + Math.round(stableUnit(`${seed}|shots`) * 80);
  const accuracy =
    0.28 + stableUnit(`${seed}|accuracy`) * 0.55;
  return {
    playerId: member.playerId,
    name: member.name,
    role: member.role,
    image: member.image,
    teamId: team.teamId,
    teamName: team.teamName,
    teamPlace,
    weaponName: member.weapon.weaponName,
    weaponImage: member.weapon.image ?? null,
    kills,
    assists,
    damage,
    damageTaken: Math.max(
      0,
      Math.round(damage * (0.7 + stableUnit(`${seed}|taken`))),
    ),
    healing,
    shots,
    hits: Math.min(shots, Math.round(shots * accuracy)),
    accuracy,
    survivalTime:
      runtime.entryData.tournament.matches *
      runtime.entryData.tournament.roundTargets.length *
      7 +
      Math.round(stableUnit(`${seed}|survival`) * 40),
    weaponShots: shots,
    weaponHits: Math.min(shots, Math.round(shots * accuracy)),
    weaponDamage: Math.round(damage * 0.78),
    weaponReloads: Math.round(shots / 12),
  };
}

function createAllAwardPlayers(runtime, finalRankings) {
  const placeByTeam = new Map(
    finalRankings.map((row) => [row.teamId, row.place]),
  );
  const playerMembers = cumulativePlayerMemberResults(runtime).map(
    (member) => ({
      ...member,
      teamPlace: placeByTeam.get(runtime.playerTeamId),
    }),
  );
  const cpuMembers = runtime.teams
    .filter((team) => team.teamId !== runtime.playerTeamId)
    .flatMap((team) =>
      team.members.map((member) =>
        createCpuMemberAwardStats(
          runtime,
          team,
          member,
          placeByTeam.get(team.teamId),
        ),
      ),
    );
  return [...playerMembers, ...cpuMembers];
}

function compareAwardEntries(primaryField) {
  return (left, right) => {
    const leftValue = left[primaryField] ?? 0;
    const rightValue = right[primaryField] ?? 0;
    if (rightValue !== leftValue) {
      return rightValue - leftValue;
    }
    for (const field of [
      "kills",
      "damage",
      "assists",
      "survivalTime",
    ]) {
      if ((right[field] ?? 0) !== (left[field] ?? 0)) {
        return (right[field] ?? 0) - (left[field] ?? 0);
      }
    }
    if (left.teamPlace !== right.teamPlace) {
      return left.teamPlace - right.teamPlace;
    }
    return left.playerId.localeCompare(right.playerId);
  };
}

function mvpScore(player) {
  const accuracy = player.shots > 0
    ? player.hits / player.shots
    : 0;
  return (
    player.kills * 120 +
    player.assists * 55 +
    player.damage * 0.18 +
    player.healing * 0.2 +
    accuracy * 180 +
    player.survivalTime * 0.45 +
    Math.max(0, 21 - player.teamPlace) * 5
  );
}

function createAward(
  category,
  label,
  primaryField,
  players,
  valueFormatter = (value) => value,
) {
  const ranking = [...players]
    .sort(compareAwardEntries(primaryField))
    .slice(0, 3)
    .map((player, index) => ({
      place: index + 1,
      playerId: player.playerId,
      playerName: player.name,
      role: player.role,
      image: player.image,
      teamId: player.teamId,
      teamName: player.teamName,
      teamPlace: player.teamPlace,
      value: player[primaryField] ?? 0,
      valueLabel: valueFormatter(player[primaryField] ?? 0),
      weaponName: player.weaponName,
      weaponImage: player.weaponImage,
      weaponStats: {
        shots: player.weaponShots ?? player.shots ?? 0,
        hits: player.weaponHits ?? player.hits ?? 0,
        damage: player.weaponDamage ?? player.damage ?? 0,
        reloads: player.weaponReloads ?? 0,
      },
    }));
  return {
    awardId: category.toLowerCase(),
    category,
    label,
    primaryField,
    ranking,
    winnerPlayerId: ranking[0]?.playerId ?? null,
    commentary:
      ranking.length > 0
        ? `${label}第1位は${ranking[0].playerName}！${ranking[0].valueLabel}を記録しました！`
        : `${label}は該当者なしです。`,
  };
}

export function createTournamentAwards(runtime) {
  const finalRankings = createFinalRankings(runtime);
  const players = createAllAwardPlayers(runtime, finalRankings);
  const mvpPlayers = players.map((player) => ({
    ...player,
    mvpScore: Math.round(mvpScore(player) * 100) / 100,
  }));

  const awards = [
    createAward(
      "KILL_LEADER",
      "KILL LEADER",
      "kills",
      players,
      (value) => `${value} KILL`,
    ),
    createAward(
      "DAMAGE_LEADER",
      "DAMAGE LEADER",
      "damage",
      players,
      (value) => `${formatNumber(value)} DAMAGE`,
    ),
    createAward(
      "ASSIST_LEADER",
      "ASSIST LEADER",
      "assists",
      players,
      (value) => `${value} ASSIST`,
    ),
    createAward(
      "HEALING_LEADER",
      "HEALING LEADER",
      "healing",
      players,
      (value) => `${formatNumber(value)} HEAL`,
    ),
    createAward(
      "ACCURACY_LEADER",
      "ACCURACY LEADER",
      "accuracy",
      players.filter((player) => player.shots > 0),
      (value) => `${Math.round(value * 100)}%`,
    ),
    createAward(
      "MVP",
      "MVP",
      "mvpScore",
      mvpPlayers,
      (value) => `${formatNumber(Math.round(value))} SCORE`,
    ),
    {
      awardId: "final_podium",
      category: "FINAL_PODIUM",
      label: "FINAL PODIUM",
      primaryField: "finalPlace",
      ranking: finalRankings.slice(0, 3).map((team) => ({
        place: team.place,
        teamId: team.teamId,
        teamName: team.teamName,
        teamLogo: team.teamLogo,
        value: team.sumTotal,
        valueLabel: `${team.sumTotal} TOTAL`,
      })),
      winnerPlayerId: null,
      commentary: `大会優勝は${finalRankings[0].teamName}！`,
    },
  ];

  return deepFreeze(awards);
}

export function prepareAwardsToDraft(draft) {
  assertRuntime(draft);
  const finalRankings = createFinalRankings(draft);
  const awards = createTournamentAwards(draft);
  draft.finalRankings = deepClone(finalRankings);
  draft.awardRuntime.awards = deepClone(awards);
  draft.awardRuntime.currentIndex = 0;
  draft.awardRuntime.completed = false;
  draft.pendingVisualId = "tournament-awards:0";
  return deepFreeze({
    finalRankings,
    awards,
  });
}

export function advanceAwardToDraft(draft) {
  const awards = draft.awardRuntime.awards;
  if (!Array.isArray(awards) || awards.length === 0) {
    throw new RangeError("Tournament awards are not prepared.");
  }
  const nextIndex = draft.awardRuntime.currentIndex + 1;
  if (nextIndex >= awards.length) {
    draft.awardRuntime.completed = true;
    return deepFreeze({
      completed: true,
      currentIndex: awards.length - 1,
    });
  }
  draft.awardRuntime.currentIndex = nextIndex;
  draft.pendingVisualId = `tournament-awards:${nextIndex}`;
  return deepFreeze({
    completed: false,
    currentIndex: nextIndex,
  });
}

function rankingIds(rankings, minimumPlace, maximumPlace) {
  return rankings
    .filter(
      (row) =>
        row.place >= minimumPlace &&
        row.place <= maximumPlace,
    )
    .map((row) => row.teamId);
}

export function createCircuitAdvancement(
  runtime,
  finalRankings = createFinalRankings(runtime),
) {
  const type =
    runtime.entryData.tournament.tournamentType;
  const participantSeeds = deepClone(
    runtime.entryData.tournament.participantSeeds ??
      runtime.teams.map((team, index) => ({
        teamId: team.teamId,
        sourcePool: team.source ?? null,
        isPlayer: team.teamId === runtime.playerTeamId,
        groupId: team.groupId ?? null,
        seedIndex: index + 1,
      })),
  );
  const common = {
    circuitYear:
      runtime.entryData.tournament.circuitYear ??
      runtime.entryData.gameDate?.year ??
      runtime.entryData.gameDate.year,
    circuitStageId:
      runtime.entryData.tournament.circuitStageId ??
      runtime.entryData.tournament.stageId,
    participantSeeds,
    groupAssignments: deepClone(
      runtime.entryData.tournament.groupAssignments ?? null,
    ),
    circuitTotals: deepClone(
      createTournamentTotals(runtime),
    ),
    sourceTournamentIds: deepClone(
      runtime.entryData.tournament.sourceTournamentIds ?? [],
    ),
    directQualifierTeamIds: [],
    lastChanceTeamIds: [],
    qualifierTeamIds: [],
    eliminatedTeamIds: [],
    representativePlaces: {},
    stageInProgress: false,
  };

  if (type === "local") {
    common.directQualifierTeamIds = rankingIds(
      finalRankings,
      1,
      FORMAL_CIRCUIT_RULES.local.qualifiers,
    );
    common.qualifierTeamIds = [...common.directQualifierTeamIds];
    common.eliminatedTeamIds = rankingIds(finalRankings, 11, 20);
    return common;
  }

  if (
    type === "national_week_1" ||
    type === "world_qualifier_week_1"
  ) {
    common.stageInProgress = true;
    common.qualifierTeamIds = finalRankings.map((row) => row.teamId);
    return common;
  }

  if (type === "national_week_2" || type === "national") {
    common.directQualifierTeamIds = rankingIds(finalRankings, 1, 8);
    common.lastChanceTeamIds = rankingIds(finalRankings, 9, 28);
    common.eliminatedTeamIds = rankingIds(finalRankings, 29, 40);
    common.qualifierTeamIds = [
      ...common.directQualifierTeamIds,
      ...common.lastChanceTeamIds,
    ];
    return common;
  }

  if (type === "national_last_chance") {
    const matchPointWinner =
      runtime.matchPointRuntime?.mpWinner ??
      finalRankings[0]?.teamId ??
      null;
    const totalQualifier = finalRankings.find(
      (row) => row.teamId !== matchPointWinner,
    )?.teamId ?? null;
    common.matchPointWinnerTeamId = matchPointWinner;
    common.totalPointQualifierTeamId = totalQualifier;
    common.qualifierTeamIds = [
      matchPointWinner,
      totalQualifier,
    ].filter(Boolean);
    common.directQualifierTeamIds = [...common.qualifierTeamIds];
    common.eliminatedTeamIds = finalRankings
      .map((row) => row.teamId)
      .filter((teamId) => !common.qualifierTeamIds.includes(teamId));
    if (matchPointWinner) {
      common.representativePlaces[matchPointWinner] = 9;
    }
    if (totalQualifier) {
      common.representativePlaces[totalQualifier] = 10;
    }
    return common;
  }

  if (
    type === "world_qualifier_week_2" ||
    type === "world_qualifier"
  ) {
    common.directQualifierTeamIds = rankingIds(finalRankings, 1, 10);
    common.lastChanceTeamIds = rankingIds(finalRankings, 11, 30);
    common.eliminatedTeamIds = rankingIds(finalRankings, 31, 40);
    common.qualifierTeamIds = [
      ...common.directQualifierTeamIds,
      ...common.lastChanceTeamIds,
    ];
    return common;
  }

  if (type === "world_last_chance") {
    common.directQualifierTeamIds = rankingIds(finalRankings, 1, 10);
    common.qualifierTeamIds = [...common.directQualifierTeamIds];
    common.eliminatedTeamIds = rankingIds(finalRankings, 11, 20);
    return common;
  }

  if (
    type === "world_final" ||
    type === "championship" ||
    isCasualTournamentType(type)
  ) {
    common.winnerTeamId = finalRankings[0]?.teamId ?? null;
    common.qualifierTeamIds = common.winnerTeamId
      ? [common.winnerTeamId]
      : [];
    return common;
  }

  return common;
}

export function getQualificationDisplay(
  runtime,
  place = null,
) {
  const type =
    runtime.entryData.tournament.tournamentType;
  const playerTeamId = runtime.playerTeamId;
  const rankings =
    runtime.finalRankings ?? createFinalRankings(runtime);
  const advancement = createCircuitAdvancement(runtime, rankings);
  const isFinal =
    ["world_final", "championship"].includes(type) ||
    isCasualTournamentType(type);
  const stageInProgress = advancement.stageInProgress === true;
  const qualified =
    stageInProgress ||
    advancement.qualifierTeamIds.includes(playerTeamId);

  let maximumPlace = null;
  let lineLabel = "最終大会";
  let nextStageId = null;

  if (type === "local") {
    maximumPlace = 10;
    lineLabel = "通過ライン TOP 10";
    nextStageId = qualified ? "national_week_1" : null;
  } else if (type === "national_week_1") {
    lineLabel = "NATIONAL 2週目へ継続";
    nextStageId = "national_week_2";
  } else if (type === "national_week_2" || type === "national") {
    maximumPlace = 28;
    lineLabel = "1～8位 World確定 / 9～28位 Last Chance";
    nextStageId = advancement.directQualifierTeamIds.includes(playerTeamId)
      ? "world_qualifier_week_1"
      : advancement.lastChanceTeamIds.includes(playerTeamId)
        ? "national_last_chance"
        : null;
  } else if (type === "national_last_chance") {
    lineLabel = "MATCH POINT WINNER＋WINNERを除くTOTAL首位";
    nextStageId = qualified ? "world_qualifier_week_1" : null;
  } else if (type === "world_qualifier_week_1") {
    lineLabel = "WORLD予選2週目へ継続";
    nextStageId = "world_qualifier_week_2";
  } else if (
    type === "world_qualifier_week_2" ||
    type === "world_qualifier"
  ) {
    maximumPlace = 30;
    lineLabel = "1～10位 Final確定 / 11～30位 Last Chance";
    nextStageId = advancement.directQualifierTeamIds.includes(playerTeamId)
      ? "world_final"
      : advancement.lastChanceTeamIds.includes(playerTeamId)
        ? "world_last_chance"
        : null;
  } else if (type === "world_last_chance") {
    maximumPlace = 10;
    lineLabel = "通過ライン TOP 10";
    nextStageId = qualified ? "world_final" : null;
  }

  return {
    enabled: !isFinal,
    isFinal,
    stageInProgress,
    maximumPlace,
    qualified,
    nextStageId,
    lineLabel,
    verdictLabel:
      stageInProgress
        ? "STAGE CONTINUES"
        : isFinal
          ? "TOURNAMENT COMPLETE"
          : qualified
            ? "QUALIFIED"
            : "NOT QUALIFIED",
    advancement,
  };
}

function qualificationForResult(
  runtime,
  finalPlace,
) {
  const display = getQualificationDisplay(runtime, finalPlace);
  return {
    qualified: display.qualified,
    nextStageId: display.nextStageId,
    stageInProgress: display.stageInProgress,
    advancement: display.advancement,
  };
}

function consumedCarryItems(runtime) {
  return Object.entries(
    runtime.inventory.consumedCarryItems ?? {},
  )
    .filter(([, quantity]) => quantity > 0)
    .map(([itemId, quantity]) => ({
      itemId,
      quantity,
    }))
    .sort((left, right) =>
      left.itemId.localeCompare(right.itemId),
    );
}

function strategyUsage(runtime) {
  return Object.values(runtime.strategyRuntime)
    .filter(
      (strategy) =>
        strategy.uses > 0 ||
        strategy.strategyId === STRATEGY_RULES.fallbackStrategyId,
    )
    .map((strategy) => ({
      strategyId: strategy.strategyId,
      name: strategy.name,
      rank: strategy.rank,
      uses: strategy.uses,
      unlimited: strategy.unlimited,
      tournamentRemaining: strategy.tournamentRemaining,
    }))
    .sort((left, right) =>
      left.strategyId.localeCompare(right.strategyId),
    );
}

function createRecordsBroken(runtime, memberResults) {
  const before = runtime.entryData.recordSnapshot;
  const records = [];
  const totalKills = memberResults.reduce(
    (sum, member) => sum + member.kills,
    0,
  );
  const totalAssists = memberResults.reduce(
    (sum, member) => sum + member.assists,
    0,
  );
  const totalDamage = memberResults.reduce(
    (sum, member) => sum + member.damage,
    0,
  );

  if (totalKills > (before.totalKills ?? 0)) {
    records.push({
      recordId: "tournament_total_kills",
      label: "大会通算KILL",
      previous: before.totalKills ?? 0,
      current: totalKills,
    });
  }
  if (totalAssists > (before.totalAssists ?? 0)) {
    records.push({
      recordId: "tournament_total_assists",
      label: "大会通算ASSIST",
      previous: before.totalAssists ?? 0,
      current: totalAssists,
    });
  }
  if (totalDamage > (before.totalDamage ?? 0)) {
    records.push({
      recordId: "tournament_total_damage",
      label: "大会通算DAMAGE",
      previous: before.totalDamage ?? 0,
      current: totalDamage,
    });
  }
  return records;
}

export function createTournamentResultData(
  runtime,
  {
    completedAt = new Date().toISOString(),
    resultId =
      `result-${runtime.entryId}-${runtime.sessionId}`,
  } = {},
) {
  assertRuntime(runtime);
  if (runtime.matchTotals.length < 1) {
    throw new RangeError("At least one match result is required.");
  }

  const finalRankings =
    runtime.finalRankings ??
    createFinalRankings(runtime);
  const playerFinal = finalRankings.find(
    (row) => row.teamId === runtime.playerTeamId,
  );
  const qualification = qualificationForResult(
    runtime,
    playerFinal.place,
  );
  const rewards = resolvePlacementRewards(
    runtime.entryData.tournament.rewardTableSnapshot,
    playerFinal.place,
  );
  const memberResults = cumulativePlayerMemberResults(runtime);
  const awards =
    runtime.awardRuntime.awards?.length > 0
      ? runtime.awardRuntime.awards
      : createTournamentAwards(runtime);
  const recordsBroken = createRecordsBroken(
    runtime,
    memberResults,
  );
  const status =
    qualification.stageInProgress
      ? "stage_in_progress"
      : playerFinal.place === 1 &&
          ["world_final", "championship"].includes(
            runtime.entryData.tournament.tournamentType,
          )
        ? "champion"
        : qualification.qualified
          ? "qualified"
          : runtime.entryData.tournament.qualificationRule?.type === "final" ||
              isCasualTournamentType(
                runtime.entryData.tournament.tournamentType,
              )
            ? "completed"
            : "eliminated";

  const partial = {
    schemaVersion: "mobbr-tournament-result-1.0.0",
    entryId: runtime.entryId,
    resultId,
    resultSignature: null,
    saveSlotId: runtime.entryData.saveSlotId,
    tournamentId: runtime.tournamentId,
    tournamentType:
      runtime.entryData.tournament.tournamentType,
    sessionId: runtime.sessionId,
    seasonId: runtime.seasonId,
    startedAt: runtime.createdAt,
    completedAt,
    status,
    playerTeamId: runtime.playerTeamId,
    companyName: runtime.entryData.company.companyName,
    teamName: runtime.entryData.playerTeam.teamName,
    finalPlace: playerFinal.place,
    qualified: qualification.qualified,
    nextStageId: qualification.nextStageId,
    advancement: deepClone(qualification.advancement),
    circuitYear:
      runtime.entryData.tournament.circuitYear ??
      runtime.entryData.gameDate.year,
    circuitStageId:
      runtime.entryData.tournament.circuitStageId ??
      runtime.entryData.tournament.stageId,
    choiceGroupId:
      runtime.entryData.tournament.choiceGroupId ?? null,
    matchPointWinner:
      runtime.matchPointRuntime?.mpWinner ===
      runtime.playerTeamId,
    matchesPlayed: runtime.matchTotals.length,
    teamTotals: {
      placementPoints: playerFinal.sumPlacementPoint,
      kp: playerFinal.sumKp,
      totalPoints: playerFinal.sumTotal,
      ap: playerFinal.sumAp,
      damage: playerFinal.sumDamage,
      damageTaken: playerFinal.sumDamageTaken,
      wins: playerFinal.wins,
      bestPlace: playerFinal.bestPlace,
    },
    matchResults: deepClone(runtime.matchTotals),
    roundResults: deepClone(runtime.roundTotals),
    memberResults,
    awards: deepClone(awards),
    recordsBroken,
    rewardTableId:
      runtime.entryData.tournament.rewardTableId,
    rewardTableVersion:
      runtime.entryData.tournament.rewardTableVersion,
    rewardBreakdown: {
      placement: deepClone(rewards),
      awards: {
        coin: 0,
        diamond: 0,
        ruby: 0,
        companyExp: 0,
        trainingPoints: {
          power: 0,
          tech: 0,
          mental: 0,
          shoot: 0,
        },
        badgePacks: {},
        championshipPoints: 0,
        unlockFlags: {},
      },
    },
    rewards: deepClone(rewards),
    championshipPointDelta:
      runtime.entryData.tournament.tournamentType ===
      "world_final"
        ? getChampionshipPoints(playerFinal.place)
        : 0,
    championshipPointProjectedTotal:
      (runtime.entryData.recordSnapshot
        .championshipPoints ?? 0) +
      (
        runtime.entryData.tournament.tournamentType ===
        "world_final"
          ? getChampionshipPoints(playerFinal.place)
          : 0
      ),
    consumedCarryItems: consumedCarryItems(runtime),
    strategyUsage: strategyUsage(runtime),
    newTournamentRecords: deepClone(recordsBroken),
    historyEntry: {
      tournamentId: runtime.tournamentId,
      tournamentType:
        runtime.entryData.tournament.tournamentType,
      finalPlace: playerFinal.place,
      totalPoints: playerFinal.sumTotal,
      advancement: deepClone(qualification.advancement),
      completedAt,
    },
    summary:
      `${runtime.entryData.tournament.tournamentName} ` +
      `${playerFinal.place}位 / TOTAL ${playerFinal.sumTotal}`,
    rankings: deepClone(finalRankings),
    resumeDataCleared: true,
    checksum: null,
  };
  return finalizeTournamentResultData(partial);
}

export function prepareTournamentResultToDraft(
  draft,
  options = {},
) {
  assertRuntime(draft);
  draft.finalRankings ??= deepClone(
    createFinalRankings(draft),
  );
  if (
    !Array.isArray(draft.awardRuntime.awards) ||
    draft.awardRuntime.awards.length === 0
  ) {
    prepareAwardsToDraft(draft);
  }
  const result = createTournamentResultData(
    draft,
    options,
  );
  draft.tournamentResultData = deepClone(result);
  draft.rewardPreview = deepClone(result.rewards);
  draft.resultSignature = result.resultSignature;
  draft.returnStatus = "ready";
  draft.pendingVisualId = "tournament-result";
  return deepFreeze(deepClone(result));
}

export function writePreparedResultToStorage(
  storage,
  runtime,
) {
  if (!runtime.tournamentResultData) {
    throw new RangeError(
      "Tournament result data is not prepared.",
    );
  }
  writeTournamentResultToStorage(
    storage,
    runtime.tournamentResultData,
  );
  return runtime.tournamentResultData;
}

function commentator(text) {
  return `
    <aside class="commentary-panel result-commentary commentary-panel--live">
      <div class="commentary-panel__speaker">
        <img src="icon/mic.png" alt="モブマイク">
        <span>LIVE</span>
      </div>
      <div>
        <strong>モブマイク</strong>
        <p>${escapeHtml(text)}</p>
        <i class="commentary-wave" aria-hidden="true">
          <b></b><b></b><b></b><b></b><b></b>
        </i>
      </div>
    </aside>
  `;
}

export function renderMatchChampionScreen(runtime) {
  const matchRecord = runtime.matchTotals.find(
    (record) => record.match === runtime.match,
  );
  if (!matchRecord) {
    throw new RangeError("Current match result is missing.");
  }
  const champion = teamById(
    runtime,
    matchRecord.championTeamId,
  );
  return `
    <main class="tournament-screen tournament-screen--match-champion">
      <div class="champion-confetti" aria-hidden="true"></div>
      <section class="match-champion-stage">
        <span>${escapeHtml(matchRecord.sectionName ?? "MATCH")} / MATCH ${matchRecord.sectionMatch ?? matchRecord.match}</span>
        <h1>MATCH CHAMPION</h1>
        <img
          class="match-champion-logo"
          src="${escapeAttribute(champion.teamLogo)}"
          alt=""
        >
        <h2>${escapeHtml(champion.teamName)}</h2>
        <div class="match-champion-members">
          ${champion.members.map((member) => `
            <article>
              <img src="${escapeAttribute(member.image)}" alt="">
              <strong>${escapeHtml(member.name)}</strong>
              <span>${escapeHtml(member.role)}</span>
            </article>
          `).join("")}
        </div>
      </section>
      <div class="tournament-bottom-area">
        ${commentator(
          `${matchRecord.sectionName ?? `MATCH ${runtime.match}`}のチャンピオンは${champion.teamName}！`,
        )}
        <button
          type="button"
          class="tournament-button tournament-button--primary"
          data-action="match-champion-next"
        >
          MATCH RESULT
        </button>
      </div>
    </main>
  `;
}

export function renderMatchResultScreen(runtime) {
  const record = runtime.matchTotals.find(
    (match) => match.match === runtime.match,
  );
  if (!record) {
    throw new RangeError("Current match ranking is missing.");
  }
  const totalMatches = runtime.entryData.tournament.matches;
  const matchPointWinner = runtime.matchPointRuntime?.mpWinner ?? null;
  const newMatchPoint = (runtime.matchPointRuntime?.newEligibleTeamIds?.length ?? 0) > 0;
  const showMatchPoint = runtime.matchPointRuntime?.enabled && (newMatchPoint || matchPointWinner !== null);
  const isFinal = runtime.match >= totalMatches || matchPointWinner !== null;
  const cumulative = createFinalRankings(runtime);
  const playerRow = record.rankings.find((row) => row.isPlayer);
  const cumulativePlayer =
    cumulative.find((row) => row.isPlayer);
  const qualification =
    getQualificationDisplay(
      runtime,
      cumulativePlayer?.place ?? null,
    );
  const sectionComplete =
    record.sectionId &&
    record.sectionId !== "ALL" &&
    record.sectionMatch === 3;

  const compactRows = (rows, cumulativeMode = false) => rows.map((row) => `
    <article class="compact-result-row ${row.isPlayer ? "is-player" : ""} ${row.place === 1 ? "is-champion" : ""}">
      <strong class="compact-result-row__place">${row.place}</strong>
      <img src="${escapeAttribute(row.teamLogo)}" alt="">
      <div class="compact-result-row__team"><b>${escapeHtml(row.teamName)}</b><small>${cumulativeMode ? `MATCH ${row.matchesPlayed}` : escapeHtml(row.status)}</small></div>
      <span><img src="icon/round.png" alt="">${cumulativeMode ? row.sumPlacementPoint : row.placementPoint}</span>
      <span><img src="icon/kill.png" alt="">${cumulativeMode ? row.sumKp : row.kp}</span>
      <span><img src="icon/assist.png" alt="">${cumulativeMode ? row.sumAp : row.ap}</span>
      <em>${cumulativeMode ? row.sumTotal : row.total}</em>
    </article>
  `).join("");

  const totalPage =
    String(runtime.pendingVisualId ?? "")
      .startsWith("match-result-total:");

  return `
    <main class="tournament-screen tournament-screen--match-result ${totalPage ? "is-total-page" : "is-match-page"}" style="--result-background:url('${escapeAttribute(assetPath(runtime.map.image))}')">
      <header class="result-header result-header--compact">
        <span>
          <img src="${totalPage ? "icon/damage.png" : "icon/match.png"}" alt="">
          ${totalPage ? "TOURNAMENT TOTAL" : `${escapeHtml(record.sectionName ?? "MATCH")} / MATCH ${record.sectionMatch ?? runtime.match}`}
        </span>
        <h1>${totalPage ? "TOTAL RESULT" : "MATCH RESULT"}</h1>
        <p>
          ${
            totalPage
              ? `現在の大会総合順位 / ${cumulative.length}チーム`
              : `CHAMPION ${escapeHtml(record.championTeamName)} / ${
                  playerRow
                    ? `PLAYER ${playerRow.place} PLACE / TOTAL ${playerRow.total}`
                    : "PLAYER TEAM NOT IN THIS SECTION / CPU高速処理"
                }`
          }
        </p>
        ${
          totalPage && qualification.enabled
            ? `
              <div class="qualification-line-banner ${
                qualification.qualified
                  ? "is-inside"
                  : "is-outside"
              }">
                <b>${escapeHtml(qualification.lineLabel)}</b>
                <span>
                  現在TOTAL ${cumulativePlayer?.place ?? "-"}位 /
                  ${
                    qualification.qualified
                      ? "通過圏内"
                      : "通過圏外"
                  }
                </span>
              </div>
            `
            : ""
        }
      </header>

      <section class="match-result-vertical-scroll">
        ${
          totalPage
            ? `
              <article class="compact-result-section compact-result-section--total">
                <h2><img src="icon/damage.png" alt="">TOTAL RESULT</h2>
                <p class="result-page-explanation">
                  ここまでの全MATCHを合計した大会総合順位です。
                </p>
                <div class="compact-result-list">${compactRows(cumulative, true)}</div>
              </article>
              ${
                isFinal
                  ? `<section class="all-matches-complete"><img src="icon/champ.png" alt=""><span>ALL MATCHES COMPLETE</span><strong>全MATCHの集計が完了しました</strong></section>`
                  : ""
              }
            `
            : `
              <article class="compact-result-section">
                <h2><img src="icon/battle.png" alt="">${escapeHtml(record.sectionName ?? "MATCH")} / MATCH ${record.sectionMatch ?? runtime.match} RESULT</h2>
                <p class="result-page-explanation">
                  このMATCHだけの順位・順位ポイント・KP・APです。
                </p>
                <div class="compact-result-list">${compactRows(record.rankings)}</div>
              </article>
              <section class="total-result-callout">
                <img src="icon/damage.png" alt="">
                <div>
                  <span>NEXT VIEW</span>
                  <strong>TOTAL RESULTはこちら！</strong>
                  <p>大会全体の現在順位と通過ラインを確認します。</p>
                </div>
              </section>
            `
        }
      </section>

      <div class="tournament-bottom-area result-fixed-bottom">
        ${commentator(
          totalPage
            ? (
                isFinal
                  ? "全MATCHのTOTALが確定しました！表彰と大会総合結果へ進みましょう！"
                  : sectionComplete
                    ? `${record.sectionName}終了！40チームTOTALを確認して次の節へ進みます！`
                    : "現在の大会TOTALを確認しました。次のMATCHへ進みます！"
              )
            : `${record.sectionName ?? `MATCH ${runtime.match}`}の結果です！続いて大会TOTALを確認しましょう！`,
        )}
        <button
          type="button"
          class="tournament-button tournament-button--primary"
          data-action="${totalPage ? "match-result-next" : "match-result-total"}"
        >
          ${
            totalPage
              ? (
                  showMatchPoint
                    ? "MATCH POINT"
                    : isFinal
                      ? "AWARDS"
                      : sectionComplete
                        ? "NEXT SECTION"
                        : "NEXT MATCH"
                )
              : "TOTAL RESULTはこちら！"
          }
        </button>
      </div>
    </main>
  `;
}

export function renderMatchPointScreen(runtime) {
  const state = runtime.matchPointRuntime;
  if (!state?.enabled) {
    throw new RangeError("MATCH POINT runtime is not active.");
  }
  const winner = state.mpWinner
    ? teamById(runtime, state.mpWinner)
    : null;
  const newlyEligible = state.newEligibleTeamIds.map(
    (teamId) => teamById(runtime, teamId),
  );
  const isWinner = winner !== null;
  return `
    <main class="tournament-screen tournament-screen--match-point ${isWinner ? "is-winner" : "is-eligible"}" style="--tournament-background:url('${escapeAttribute(assetPath(tournamentThemeBackground(runtime)))}')">
      <div class="match-point-rays" aria-hidden="true"></div>
      <section class="match-point-stage">
        <span>${isWinner ? "MATCH POINT WINNER" : "MATCH POINT REACHED"}</span>
        <h1>${isWinner ? "CHAMPION" : state.threshold}</h1>
        ${
          isWinner
            ? `
              <img src="${escapeAttribute(winner.teamLogo)}" alt="">
              <h2>${escapeHtml(winner.teamName)}</h2>
              <p>${state.suddenDeath ? "最終MATCHは全チームMATCH POINTとして行われ、そのMATCH CHAMPIONが勝者となりました。" : `MATCH ${state.winnerConfirmedAtMatch}でMATCH POINT勝利を確定しました。`}</p>
            `
            : `
              <p>累計${state.threshold}ポイントへ到達。次のMATCHで優勝すると大会王者です。</p>
              <div class="match-point-team-list">
                ${newlyEligible.map((team) => `
                  <article>
                    <img src="${escapeAttribute(team.teamLogo)}" alt="">
                    <strong>${escapeHtml(team.teamName)}</strong>
                  </article>
                `).join("")}
              </div>
            `
        }
      </section>
      <div class="tournament-bottom-area result-fixed-bottom">
        ${commentator(
          isWinner
            ? `${winner.teamName}がMATCH POINTを制し、大会王者に決定しました！`
            : `${newlyEligible.map((team) => team.teamName).join("、")}がMATCH POINTへ到達しました！`,
        )}
        <button
          type="button"
          class="tournament-button tournament-button--primary"
          data-action="match-point-next"
        >
          ${isWinner ? "AWARDS" : "NEXT MATCH"}
        </button>
      </div>
    </main>
  `;
}

export function renderNextMatchWaitScreen(runtime) {
  const nextMatch = runtime.match + 1;
  const nextPlan = runtime.entryData.tournament.matchPlan?.find(
    (entry) => entry.match === nextMatch,
  ) ?? null;
  return `
    <main class="tournament-screen tournament-screen--next-match" style="--map-background:url('${escapeAttribute(assetPath(runtime.map.image))}')">
      <img
        class="tournament-stage-background"
        src="${escapeAttribute(assetPath(runtime.map.image))}"
        alt=""
      >
      <section class="next-match-stage">
        <img class="next-match-stage__tournament-logo" src="${escapeAttribute(
          runtime.entryData.tournament.openingThemeId === "national"
            ? "icon/national.png"
            : runtime.entryData.tournament.openingThemeId === "world"
              ? "icon/world.png"
              : runtime.entryData.tournament.openingThemeId === "championship"
                ? "icon/champ.png"
                : "icon/local.png"
        )}" alt="">
        <span>SESSION CONTINUES</span>
        <h1>MATCH ${nextPlan?.circuitMatch ?? nextMatch}</h1>
        <p>${escapeHtml(runtime.map.name)} / ${nextPlan?.participantTeamIds?.length ?? runtime.teams.length} TEAMS</p>
        ${nextPlan?.sectionName && nextPlan.sectionId !== "ALL" ? `<strong class="next-match-stage__section">${escapeHtml(nextPlan.sectionName)} / SECTION MATCH ${nextPlan.sectionMatch}</strong>` : ""}
        <div class="next-match-stage__rules">
          <strong>HP・CT・MATCH効果を初期化</strong>
          <small>大会バッグ・作戦残回数・累計ポイントは保持します</small>
        </div>
        <button type="button" class="tournament-button tournament-button--primary" data-action="next-match-start">
          MATCH ${nextPlan?.circuitMatch ?? nextMatch} START
        </button>
      </section>
    </main>
  `;
}

export function renderAwardScreen(runtime) {
  const awards = runtime.awardRuntime.awards;
  const index = runtime.awardRuntime.currentIndex ?? 0;
  const award = awards[index];
  if (!award) {
    throw new RangeError("Current award is missing.");
  }
  const isPodium = award.category === "FINAL_PODIUM";
  return `
    <main class="tournament-screen tournament-screen--award">
      <div class="award-confetti" aria-hidden="true"></div>
      <header class="award-header">
        <span>AWARD ${index + 1} / ${awards.length}</span>
        <h1>${escapeHtml(award.label)}</h1>
      </header>
      <section class="award-podium ${isPodium ? "award-podium--teams" : ""}">
        ${award.ranking.map((entry) => `
          <article class="award-place award-place--${entry.place}">
            <span>${entry.place}</span>
            <img
              src="${escapeAttribute(
                entry.image ?? entry.teamLogo ?? "",
              )}"
              alt=""
            >
            <strong>${escapeHtml(
              entry.playerName ?? entry.teamName,
            )}</strong>
            <small>
              ${escapeHtml(
                entry.role
                  ? `${entry.role} / ${entry.teamName}`
                  : entry.teamName,
              )}
            </small>
            <b>${escapeHtml(entry.valueLabel)}</b>
            ${
              entry.weaponName
                ? `<em>${escapeHtml(entry.weaponName)}</em>`
                : ""
            }
          </article>
        `).join("")}
      </section>
      <div class="tournament-bottom-area result-fixed-bottom">
        ${commentator(award.commentary)}
        <button
          type="button"
          class="tournament-button tournament-button--primary"
          data-action="award-next"
        >
          ${index + 1 >= awards.length ? "TOTAL RESULT" : "NEXT"}
        </button>
      </div>
    </main>
  `;
}

function rewardRows(rewards) {
  return [
    ["COIN", rewards.coin],
    ["DIAMOND", rewards.diamond],
    ["RUBY", rewards.ruby],
    ["COMPANY EXP", rewards.companyExp],
    ["POWER PT", rewards.trainingPoints.power],
    ["TECH PT", rewards.trainingPoints.tech],
    ["MENTAL PT", rewards.trainingPoints.mental],
    ["SHOOT PT", rewards.trainingPoints.shoot],
    [
      "BADGE PACK",
      Object.values(rewards.badgePacks).reduce(
        (sum, value) => sum + value,
        0,
      ),
    ],
    ["CHAMPIONSHIP PT", rewards.championshipPoints],
  ];
}

function advancementTeamTemplate(runtime, teamId, label, note) {
  const team = teamById(runtime, teamId);
  return `
    <article class="advancement-team-card">
      <img src="${escapeAttribute(team.teamLogo)}" alt="">
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(team.teamName)}</strong>
        <small>${escapeHtml(note)}</small>
      </div>
    </article>
  `;
}

function circuitAdvancementTemplate(runtime, result) {
  const type = runtime.entryData.tournament.tournamentType;
  const advancement = result.advancement ?? {};

  if (type === "national_last_chance") {
    const matchPointWinner = advancement.matchPointWinnerTeamId;
    const totalQualifier = advancement.totalPointQualifierTeamId;
    if (!matchPointWinner || !totalQualifier) return "";
    return `
      <section class="circuit-advancement-panel national-lc-qualifiers">
        <span>NATIONAL REPRESENTATIVES COMPLETE</span>
        <h2>World進出 最後の2枠</h2>
        <div>
          ${advancementTeamTemplate(
            runtime,
            matchPointWinner,
            "NATIONAL代表 9位",
            "MATCH POINT WINNER",
          )}
          ${advancementTeamTemplate(
            runtime,
            totalQualifier,
            "NATIONAL代表 10位",
            "WINNERを除くTOTALポイント1位",
          )}
        </div>
      </section>
    `;
  }

  if (type === "national_week_2" || type === "national") {
    return `
      <section class="circuit-advancement-panel">
        <span>NATIONAL STAGE COMPLETE</span>
        <h2>1～8位 World確定 / 9～28位 Last Chance</h2>
        <div class="advancement-logo-grid">
          ${(advancement.directQualifierTeamIds ?? []).map((teamId, index) =>
            advancementTeamTemplate(runtime, teamId, `${index + 1}位`, "WORLD進出確定")
          ).join("")}
        </div>
        <p>Last Chance進出 ${(advancement.lastChanceTeamIds ?? []).length}チーム / 敗退 ${(advancement.eliminatedTeamIds ?? []).length}チーム</p>
      </section>
    `;
  }

  if (type === "world_qualifier_week_2" || type === "world_qualifier") {
    return `
      <section class="circuit-advancement-panel">
        <span>WORLD QUALIFIER COMPLETE</span>
        <h2>上位10チーム World Final進出</h2>
        <div class="advancement-logo-grid">
          ${(advancement.directQualifierTeamIds ?? []).map((teamId, index) =>
            advancementTeamTemplate(runtime, teamId, `${index + 1}位`, "WORLD FINAL直接進出")
          ).join("")}
        </div>
        <p>World Last Chance進出 ${(advancement.lastChanceTeamIds ?? []).length}チーム / 敗退 ${(advancement.eliminatedTeamIds ?? []).length}チーム</p>
      </section>
    `;
  }

  if (type === "world_last_chance") {
    return `
      <section class="circuit-advancement-panel">
        <span>WORLD LAST CHANCE COMPLETE</span>
        <h2>World Final進出10チームが決定</h2>
        <div class="advancement-logo-grid">
          ${(advancement.qualifierTeamIds ?? []).map((teamId, index) =>
            advancementTeamTemplate(runtime, teamId, `${index + 1}位`, "WORLD FINAL進出")
          ).join("")}
        </div>
      </section>
    `;
  }

  if (type === "local") {
    return `
      <section class="circuit-advancement-panel">
        <span>LOCAL QUALIFIERS</span>
        <h2>NATIONAL進出10チーム</h2>
        <div class="advancement-logo-grid">
          ${(advancement.qualifierTeamIds ?? []).map((teamId, index) =>
            advancementTeamTemplate(runtime, teamId, `${index + 1}位`, "NATIONAL進出")
          ).join("")}
        </div>
      </section>
    `;
  }

  if (advancement.stageInProgress === true) {
    return `
      <section class="circuit-advancement-panel is-continuation">
        <span>WEEK 1 COMPLETE</span>
        <h2>40チームTOTALを次週へ保存しました</h2>
        <p>グループ、獲得ポイント、個人戦績を維持したまま第4～6節へ進みます。</p>
      </section>
    `;
  }

  return "";
}

export function renderTournamentResultScreen(runtime) {
  const result = runtime.tournamentResultData;
  if (!result) {
    throw new RangeError("Tournament result is not prepared.");
  }
  const playerRanking = result.rankings.find(
    (row) => row.teamId === runtime.playerTeamId,
  );
  const qualification =
    getQualificationDisplay(
      runtime,
      result.finalPlace,
    );
  const verdictMessage =
    qualification.stageInProgress
      ? `${qualification.lineLabel}。ここまでの40チームTOTALとグループ状態を保存しました！`
      : qualification.isFinal
        ? `全日程を戦い抜きました。${result.teamName}のみなさん、お疲れさまでした！`
        : qualification.qualified
          ? `${qualification.lineLabel}を突破！次の大会段階へ進出です！`
          : `${qualification.lineLabel}には届きませんでした。ここまでの戦いを次へつなげましょう！`;

  return `
    <main class="tournament-screen tournament-screen--total-result">
      <header class="total-result-hero">
        <span>${escapeHtml(result.status.toUpperCase())}</span>
        <h1>${escapeHtml(runtime.entryData.tournament.tournamentName)}</h1>
        <strong>${result.finalPlace} PLACE</strong>
        <p>
          TOTAL ${playerRanking.sumTotal} /
          PP ${playerRanking.sumPlacementPoint} /
          KP ${playerRanking.sumKp}
        </p>
      </header>
      <section class="tournament-qualification-verdict ${
        qualification.qualified
          ? "is-qualified"
          : qualification.isFinal
            ? "is-complete"
            : "is-not-qualified"
      }">
        <img src="icon/mic.png" alt="モブマイク">
        <span>${escapeHtml(qualification.verdictLabel)}</span>
        <h2>
          ${
            qualification.stageInProgress
              ? "前半日程終了"
              : qualification.isFinal
                ? "大会全日程終了"
                : qualification.qualified
                  ? "次大会段階へ進出決定"
                  : "今大会で敗退"
          }
        </h2>
        ${
          qualification.enabled
            ? `<strong>${escapeHtml(qualification.lineLabel)} / 最終 ${result.finalPlace}位</strong>`
            : `<strong>最終 ${result.finalPlace}位</strong>`
        }
        <p>${escapeHtml(verdictMessage)}</p>
      </section>
      ${circuitAdvancementTemplate(runtime, result)}
      <section class="total-result-scroll">
        <article class="total-result-section">
          <h2>FINAL RANKING</h2>
          <div class="final-ranking-list">
            ${result.rankings.map((row) => `
              <div class="${row.isPlayer ? "is-player" : ""}">
                <span>${row.place}</span>
                <img src="${escapeAttribute(row.teamLogo)}" alt="">
                <strong>${escapeHtml(row.teamName)}</strong>
                <em>${row.sumTotal}</em>
              </div>
            `).join("")}
          </div>
        </article>
        <article class="total-result-section">
          <h2>REWARD PREVIEW</h2>
          <div class="reward-preview-grid">
            ${rewardRows(result.rewards).map(([label, value]) => `
              <div>
                <span>${escapeHtml(label)}</span>
                <strong>${formatNumber(value)}</strong>
              </div>
            `).join("")}
          </div>
          <p>
            報酬はメインシステムが結果署名を検証した後、
            一度だけ付与します。
          </p>
        </article>
        <article class="total-result-section">
          <h2>PLAYER TOTAL</h2>
          <div class="member-total-list">
            ${result.memberResults.map((member) => `
              <div>
                <img src="${escapeAttribute(member.image)}" alt="">
                <strong>${escapeHtml(member.role)} ${escapeHtml(member.name)}</strong>
                <small>
                  K ${member.kills} / A ${member.assists} /
                  DMG ${formatNumber(member.damage)} /
                  HEAL ${formatNumber(member.healing)}
                </small>
              </div>
            `).join("")}
          </div>
        </article>
        <article class="total-result-section result-contract-panel">
          <h2>RETURN CONTRACT</h2>
          <code>${escapeHtml(result.resultSignature)}</code>
          <small>
            ${escapeHtml(result.rewardTableId)} /
            ${escapeHtml(result.rewardTableVersion)}
          </small>
        </article>
      </section>
      <div class="tournament-bottom-area result-fixed-bottom">
        ${commentator(
          verdictMessage,
        )}
        <button
          type="button"
          class="tournament-button tournament-button--primary"
          data-action="return-result"
        >
          メインへ結果を返す
        </button>
      </div>
    </main>
  `;
}

export function renderReturningResultScreen(runtime) {
  const result = runtime.tournamentResultData;
  return `
    <main class="tournament-screen tournament-screen--returning-result">
      <section class="returning-result-card">
        <span>RESULT READY</span>
        <h1>大会結果を送信しました</h1>
        <p>
          ${escapeHtml(result.tournamentId)}<br>
          ${result.finalPlace}位 /
          ${escapeHtml(result.resultSignature)}
        </p>
        <div class="returning-result-rewards">
          <strong>COIN ${formatNumber(result.rewards.coin)}</strong>
          <strong>DIAMOND ${formatNumber(result.rewards.diamond)}</strong>
          <strong>RUBY ${formatNumber(result.rewards.ruby)}</strong>
        </div>
        <p>
          メイン画面で署名・報酬表・重複状態を検証後、
          報酬と記録を一括反映します。
        </p>
        <button
          type="button"
          class="tournament-button tournament-button--primary"
          data-action="return-main-with-result"
        >
          メイン画面へ
        </button>
      </section>
    </main>
  `;
}

export function validateResultsRuntime(runtime) {
  assertRuntime(runtime);
  if (
    runtime.matchTotals.length >
    runtime.entryData.tournament.matches
  ) {
    throw new Error("Too many match results were recorded.");
  }
  if (
    runtime.finalRankings &&
    runtime.finalRankings.length !== runtime.teams.length
  ) {
    throw new Error("Final ranking team count is invalid.");
  }
  if (
    runtime.tournamentResultData &&
    runtime.tournamentResultData.resultSignature !==
      runtime.resultSignature
  ) {
    throw new Error("Runtime result signature is inconsistent.");
  }
  return true;
}
