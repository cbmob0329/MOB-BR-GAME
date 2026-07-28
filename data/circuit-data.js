/**
 * MOB BR annual circuit and stage progression rules.
 *
 * The formal circuit is held once per game year. Casual cups are monthly and
 * are intentionally excluded from formal qualification and Championship Point.
 */

import {
  getChampionshipPoints,
} from "./game-data.js";
import {
  LOCAL_CPU_TEAMS,
} from "./cpu-local-data.js";
import {
  NATIONAL_CPU_TEAMS,
} from "./cpu-national-data.js";
import {
  getWorldCpuTeamsForYear,
} from "./cpu-world-data.js";

export const CIRCUIT_DATA_VERSION = "mobbr-circuit-data-1.1.0";

export const FORMAL_STAGE_TYPES = Object.freeze([
  "local",
  "national_week_1",
  "national_week_2",
  "national_last_chance",
  "world_qualifier_week_1",
  "world_qualifier_week_2",
  "world_last_chance",
  "world_final",
  "championship",
]);

export const CASUAL_STAGE_TYPES = Object.freeze([
  "casual_denden",
  "casual_mobutetsu",
]);

export const FORMAL_CIRCUIT_RULES = Object.freeze({
  local: Object.freeze({
    teams: 20,
    matches: 5,
    qualifiers: 10,
  }),
  national: Object.freeze({
    teams: 40,
    groups: Object.freeze(["A", "B", "C", "D"]),
    teamsPerGroup: 10,
    matchesPerSection: 3,
    week1Sections: Object.freeze([
      Object.freeze(["A", "B"]),
      Object.freeze(["C", "D"]),
      Object.freeze(["A", "C"]),
    ]),
    week2Sections: Object.freeze([
      Object.freeze(["B", "C"]),
      Object.freeze(["B", "D"]),
      Object.freeze(["A", "D"]),
    ]),
    directWorldPlaces: Object.freeze({ minimum: 1, maximum: 8 }),
    lastChancePlaces: Object.freeze({ minimum: 9, maximum: 28 }),
    eliminatedPlaces: Object.freeze({ minimum: 29, maximum: 40 }),
  }),
  nationalLastChance: Object.freeze({
    teams: 20,
    threshold: 35,
    maximumMatches: 8,
    matchPointQualifiers: 1,
    totalPointQualifiers: 1,
    representativePlaces: Object.freeze([9, 10]),
    secondQualifierRule: "highest_total_excluding_match_point_winner",
  }),
  worldQualifier: Object.freeze({
    teams: 40,
    nationalRepresentatives: 10,
    worldTeams: 30,
    groups: Object.freeze(["A", "B", "C", "D"]),
    teamsPerGroup: 10,
    matchesPerSection: 3,
    week1Sections: Object.freeze([
      Object.freeze(["A", "B"]),
      Object.freeze(["C", "D"]),
      Object.freeze(["A", "C"]),
    ]),
    week2Sections: Object.freeze([
      Object.freeze(["B", "C"]),
      Object.freeze(["B", "D"]),
      Object.freeze(["A", "D"]),
    ]),
    directFinalPlaces: Object.freeze({ minimum: 1, maximum: 10 }),
    lastChancePlaces: Object.freeze({ minimum: 11, maximum: 30 }),
    eliminatedPlaces: Object.freeze({ minimum: 31, maximum: 40 }),
  }),
  worldLastChance: Object.freeze({
    teams: 20,
    matches: 3,
    qualifiers: 10,
  }),
  worldFinal: Object.freeze({
    teams: 20,
    threshold: 50,
    maximumMatches: 10,
    winnerMustWinMatchAfterThreshold: true,
  }),
  championship: Object.freeze({
    teams: 20,
    yearsPerCycle: 3,
  }),
});

export const CASUAL_TOURNAMENT_RULES = Object.freeze({
  casual_denden: Object.freeze({
    cupId: "denden",
    tournamentName: "デンデンカップ",
    teams: 20,
    matches: 3,
    companyRankMinimum: "F1",
    playerSlots: 1,
    localSlots: 14,
    nationalLowerSlots: 5,
    recordOnlyWhenEntered: true,
  }),
  casual_mobutetsu: Object.freeze({
    cupId: "mobutetsu",
    tournamentName: "モブテツカップ",
    teams: 20,
    matches: 5,
    companyRankMinimum: "C1",
    playerSlots: 1,
    localNationalStrongSlots: 18,
    worldGuestSlots: 1,
    recordOnlyWhenEntered: true,
  }),
});

const GROUP_SECTION_NAMES = Object.freeze({
  AB: "A vs B",
  CD: "C vs D",
  AC: "A vs C",
  BC: "B vs C",
  BD: "B vs D",
  AD: "A vs D",
});

function hashText(value) {
  const text = String(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0 || 0x9e3779b9;
}

function createSeededRandom(seed) {
  let state = hashText(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
  };
}

export function deterministicShuffle(entries, seed) {
  const result = [...entries];
  const random = createSeededRandom(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function isCasualTournamentType(tournamentType) {
  return CASUAL_STAGE_TYPES.includes(String(tournamentType));
}

export function isFormalTournamentType(tournamentType) {
  return FORMAL_STAGE_TYPES.includes(String(tournamentType));
}

export function normalizeCircuitTier(tournamentType) {
  const value = String(tournamentType ?? "").toLowerCase();
  if (value === "local" || value === "casual_denden") return "local";
  if (value.startsWith("national") || value === "casual_mobutetsu") {
    return "national";
  }
  if (value.startsWith("world")) return "world";
  if (value === "championship") return "championship";
  return value;
}

export function sourcePoolForTeamId(teamId) {
  const value = String(teamId ?? "");
  if (/^L\d+$/i.test(value)) return "local";
  if (/^N\d+$/i.test(value)) return "national";
  if (/^W\d+$/i.test(value)) return "world";
  return "player";
}

export function teamSeed(teamId, extra = {}) {
  return Object.freeze({
    teamId,
    sourcePool: sourcePoolForTeamId(teamId),
    ...extra,
  });
}

export function getCpuPool(sourcePool, year) {
  if (sourcePool === "local") return LOCAL_CPU_TEAMS;
  if (sourcePool === "national") return NATIONAL_CPU_TEAMS;
  if (sourcePool === "world") return getWorldCpuTeamsForYear(year);
  return [];
}

export function resolveCpuTeamMaster(teamId, year) {
  const pool = getCpuPool(sourcePoolForTeamId(teamId), year);
  return pool.find((team) => team.teamId === teamId) ?? null;
}

export function createGroupAssignments(
  participantTeamIds,
  {
    playerTeamId,
    seed,
  },
) {
  if (!Array.isArray(participantTeamIds) || participantTeamIds.length !== 40) {
    throw new RangeError("Group stages require exactly 40 teams.");
  }
  const unique = [...new Set(participantTeamIds)];
  if (unique.length !== 40) {
    throw new RangeError("Group stage team IDs must be unique.");
  }

  const groups = { A: [], B: [], C: [], D: [] };
  const cpuIds = deterministicShuffle(
    unique.filter((teamId) => teamId !== playerTeamId),
    `${seed}:group-draw`,
  );

  if (unique.includes(playerTeamId)) {
    groups.A.push(playerTeamId);
  }

  const groupOrder = ["A", "B", "C", "D"];
  for (const teamId of cpuIds) {
    const available = groupOrder
      .filter((groupId) => groups[groupId].length < 10)
      .sort((left, right) => {
        if (groups[left].length !== groups[right].length) {
          return groups[left].length - groups[right].length;
        }
        return groupOrder.indexOf(left) - groupOrder.indexOf(right);
      });
    groups[available[0]].push(teamId);
  }

  for (const groupId of groupOrder) {
    if (groups[groupId].length !== 10) {
      throw new RangeError(`Group ${groupId} must contain 10 teams.`);
    }
  }
  return Object.freeze(
    Object.fromEntries(
      groupOrder.map((groupId) => [groupId, Object.freeze(groups[groupId])]),
    ),
  );
}

export function createGroupMatchPlan(
  groupAssignments,
  sections,
  {
    matchNumberOffset = 0,
  } = {},
) {
  const plan = [];
  let localMatch = 0;
  sections.forEach((pair, sectionIndex) => {
    const [leftGroupId, rightGroupId] = pair;
    const sectionId = `${leftGroupId}${rightGroupId}`;
    const participantTeamIds = [
      ...groupAssignments[leftGroupId],
      ...groupAssignments[rightGroupId],
    ];
    for (
      let sectionMatch = 1;
      sectionMatch <= 3;
      sectionMatch += 1
    ) {
      localMatch += 1;
      plan.push(Object.freeze({
        match: localMatch,
        circuitMatch: matchNumberOffset + localMatch,
        sectionIndex: sectionIndex + 1,
        sectionMatch,
        sectionId,
        sectionName: GROUP_SECTION_NAMES[sectionId] ?? sectionId,
        leftGroupId,
        rightGroupId,
        participantTeamIds: Object.freeze([...participantTeamIds]),
        playerSection: null,
      }));
    }
  });
  return Object.freeze(plan);
}

export function createSimpleMatchPlan(participantTeamIds, matches) {
  return Object.freeze(
    Array.from({ length: matches }, (_, index) => Object.freeze({
      match: index + 1,
      circuitMatch: index + 1,
      sectionIndex: 1,
      sectionMatch: index + 1,
      sectionId: "ALL",
      sectionName: "ALL TEAMS",
      leftGroupId: null,
      rightGroupId: null,
      participantTeamIds: Object.freeze([...participantTeamIds]),
      playerSection: true,
    })),
  );
}

export function selectTeamIds(pool, count, seed, exclusions = []) {
  const excluded = new Set(exclusions);
  const candidates = pool
    .map((team) => team.teamId)
    .filter((teamId) => !excluded.has(teamId));
  if (candidates.length < count) {
    throw new RangeError(`Only ${candidates.length} teams are available for ${count} slots.`);
  }
  return deterministicShuffle(candidates, seed).slice(0, count);
}

export function createObserverRankings(teamIds, seed) {
  return Object.freeze(
    deterministicShuffle(teamIds, `${seed}:observer-rankings`)
      .map((teamId, index) => Object.freeze({
        place: index + 1,
        teamId,
        teamName: resolveCpuTeamMaster(teamId, 9999)?.name ?? teamId,
        teamLogo: resolveCpuTeamMaster(teamId, 9999)?.logo ?? null,
        isPlayer: false,
        sumPlacementPoint: Math.max(0, 15 - Math.floor(index / 2)),
        sumKp: Math.max(0, 12 - Math.floor(index / 3)),
        sumTotal:
          Math.max(0, 15 - Math.floor(index / 2)) +
          Math.max(0, 12 - Math.floor(index / 3)),
        sumAp: Math.max(0, 8 - Math.floor(index / 4)),
        sumDamage: Math.max(0, 25000 - index * 430),
        wins: index < 5 ? 1 : 0,
        bestPlace: Math.min(20, index + 1),
        matchesPlayed: 3,
      })),
  );
}

function latestCircuitHistory(snapshot, types, year) {
  const typeSet = new Set(Array.isArray(types) ? types : [types]);
  return [...(snapshot.tournament?.history ?? [])]
    .reverse()
    .find((entry) => {
      if (!typeSet.has(entry.tournamentType)) return false;
      const entryYear =
        Number(entry.circuitYear) ||
        Number(/^\d{4}/.exec(String(entry.tournamentId ?? ""))?.[0]);
      return !entryYear || entryYear === year;
    }) ?? null;
}

function advancementIds(history, key) {
  const value = history?.advancement?.[key];
  return Array.isArray(value) ? [...value] : [];
}

function observerSeeds(teamIds, groupAssignments = null) {
  const groupByTeam = new Map();
  if (groupAssignments) {
    for (const [groupId, ids] of Object.entries(groupAssignments)) {
      for (const teamId of ids) groupByTeam.set(teamId, groupId);
    }
  }
  return teamIds.map((teamId, index) => ({
    teamId,
    sourcePool: sourcePoolForTeamId(teamId),
    isPlayer: false,
    groupId: groupByTeam.get(teamId) ?? null,
    seedIndex: index + 1,
  }));
}

function observerTotals(rankings) {
  return Object.fromEntries(
    rankings.map((row) => [row.teamId, { ...row }]),
  );
}

function observerRecord({
  event,
  year,
  rankings,
  advancement,
  status = "cpu_simulated",
  nextStageId = null,
  summary,
  completedAt,
}) {
  return {
    tournamentId: event.tournamentId,
    tournamentType: event.tournamentType,
    stageName: event.stageName,
    circuitYear: year,
    circuitStageId: event.circuitStageId ?? event.stageId,
    finalPlace: null,
    qualified: false,
    status,
    nextStageId,
    rankings,
    advancement,
    rewards: { coin: 0, diamond: 0, ruby: 0, companyExp: 0 },
    summary,
    completedAt,
  };
}

export function simulateObserverCircuitEvent(
  snapshot,
  event,
  {
    completedAt = new Date().toISOString(),
  } = {},
) {
  const type = event.tournamentType;
  const year = event.year ?? snapshot.gameDate.year;

  if (type === "national_week_1") {
    const local = latestCircuitHistory(snapshot, "local", year);
    const localQualifiers = advancementIds(local, "directQualifierTeamIds");
    if (localQualifiers.length !== 10) return null;
    const nationalIds = selectTeamIds(
      NATIONAL_CPU_TEAMS,
      30,
      `${year}:observer-national-participants`,
      localQualifiers,
    );
    const teamIds = [...localQualifiers, ...nationalIds];
    const groups = createGroupAssignments(teamIds, {
      playerTeamId: snapshot.playerTeam.teamId,
      seed: `${year}:observer-national-groups`,
    });
    const rankings = createObserverRankings(
      teamIds,
      `${year}:national-week-1`,
    );
    const advancement = {
      circuitYear: year,
      circuitStageId: "national_week_1",
      participantSeeds: observerSeeds(teamIds, groups),
      groupAssignments: groups,
      circuitTotals: observerTotals(rankings),
      directQualifierTeamIds: [],
      lastChanceTeamIds: [],
      qualifierTeamIds: [...teamIds],
      eliminatedTeamIds: [],
      representativePlaces: {},
      stageInProgress: true,
    };
    return observerRecord({
      event,
      year,
      rankings,
      advancement,
      status: "stage_in_progress",
      nextStageId: "national_week_2",
      summary: "NATIONAL 1週目の3節・9MATCHをCPU高速処理しました。40チームTOTALは2週目へ引き継がれます。",
      completedAt,
    });
  }

  if (type === "national_week_2") {
    const week1 = latestCircuitHistory(snapshot, "national_week_1", year);
    const seeds = week1?.advancement?.participantSeeds ?? [];
    const teamIds = seeds.map((seed) => seed.teamId);
    if (teamIds.length !== 40) return null;
    const rankings = createObserverRankings(
      teamIds,
      `${year}:national-week-2`,
    );
    const direct = rankings.slice(0, 8).map((row) => row.teamId);
    const lastChance = rankings.slice(8, 28).map((row) => row.teamId);
    const advancement = {
      circuitYear: year,
      circuitStageId: "national_week_2",
      participantSeeds: seeds.map((seed) => ({ ...seed })),
      groupAssignments: week1.advancement.groupAssignments,
      circuitTotals: observerTotals(rankings),
      directQualifierTeamIds: direct,
      lastChanceTeamIds: lastChance,
      qualifierTeamIds: [...direct, ...lastChance],
      eliminatedTeamIds: rankings.slice(28).map((row) => row.teamId),
      representativePlaces: {},
      stageInProgress: false,
    };
    return observerRecord({
      event,
      year,
      rankings,
      advancement,
      nextStageId: "national_last_chance",
      summary: "NATIONAL全6節・18MATCHが終了しました。1～8位はWorld確定、9～28位はNational Last Chanceへ進みます。",
      completedAt,
    });
  }

  if (type === "national_last_chance") {
    const national = latestCircuitHistory(
      snapshot,
      ["national_week_2", "national"],
      year,
    );
    const participantTeamIds = advancementIds(national, "lastChanceTeamIds");
    if (participantTeamIds.length !== 20) return null;
    const rankings = createObserverRankings(
      participantTeamIds,
      `${year}:national-last-chance`,
    );
    const matchPointWinner = rankings[0].teamId;
    const totalQualifier = rankings[1].teamId;
    const advancement = {
      circuitYear: year,
      circuitStageId: "national_last_chance",
      participantSeeds: observerSeeds(participantTeamIds),
      groupAssignments: null,
      circuitTotals: observerTotals(rankings),
      directQualifierTeamIds: [matchPointWinner, totalQualifier],
      lastChanceTeamIds: [],
      qualifierTeamIds: [matchPointWinner, totalQualifier],
      eliminatedTeamIds: rankings.slice(2).map((row) => row.teamId),
      representativePlaces: {
        [matchPointWinner]: 9,
        [totalQualifier]: 10,
      },
      matchPointWinnerTeamId: matchPointWinner,
      totalPointQualifierTeamId: totalQualifier,
      stageInProgress: false,
    };
    return observerRecord({
      event,
      year,
      rankings,
      advancement,
      nextStageId: "world_qualifier_week_1",
      summary:
        `NATIONAL LAST CHANCEは${rankings[0].teamName}がMATCH POINT WINNER、` +
        `${rankings[1].teamName}がTOTAL枠を獲得しました。`,
      completedAt,
    });
  }

  if (type === "world_qualifier_week_1") {
    const national = latestCircuitHistory(
      snapshot,
      ["national_week_2", "national"],
      year,
    );
    const nationalLastChance = latestCircuitHistory(
      snapshot,
      "national_last_chance",
      year,
    );
    const representatives = [
      ...advancementIds(national, "directQualifierTeamIds"),
      ...advancementIds(nationalLastChance, "qualifierTeamIds"),
    ];
    if (representatives.length !== 10) return null;
    const worldIds = selectTeamIds(
      getWorldCpuTeamsForYear(year),
      30,
      `${year}:observer-world-participants`,
      representatives,
    );
    const teamIds = [...representatives, ...worldIds];
    const groups = createGroupAssignments(teamIds, {
      playerTeamId: snapshot.playerTeam.teamId,
      seed: `${year}:observer-world-groups`,
    });
    const rankings = createObserverRankings(
      teamIds,
      `${year}:world-week-1`,
    );
    const advancement = {
      circuitYear: year,
      circuitStageId: "world_qualifier_week_1",
      participantSeeds: observerSeeds(teamIds, groups),
      groupAssignments: groups,
      circuitTotals: observerTotals(rankings),
      directQualifierTeamIds: [],
      lastChanceTeamIds: [],
      qualifierTeamIds: [...teamIds],
      eliminatedTeamIds: [],
      representativePlaces: {},
      stageInProgress: true,
    };
    return observerRecord({
      event,
      year,
      rankings,
      advancement,
      status: "stage_in_progress",
      nextStageId: "world_qualifier_week_2",
      summary: "WORLD予選1週目の3節・9MATCHをCPU高速処理しました。40チームTOTALは2週目へ引き継がれます。",
      completedAt,
    });
  }

  if (type === "world_qualifier_week_2") {
    const week1 = latestCircuitHistory(
      snapshot,
      "world_qualifier_week_1",
      year,
    );
    const seeds = week1?.advancement?.participantSeeds ?? [];
    const teamIds = seeds.map((seed) => seed.teamId);
    if (teamIds.length !== 40) return null;
    const rankings = createObserverRankings(
      teamIds,
      `${year}:world-week-2`,
    );
    const direct = rankings.slice(0, 10).map((row) => row.teamId);
    const lastChance = rankings.slice(10, 30).map((row) => row.teamId);
    const advancement = {
      circuitYear: year,
      circuitStageId: "world_qualifier_week_2",
      participantSeeds: seeds.map((seed) => ({ ...seed })),
      groupAssignments: week1.advancement.groupAssignments,
      circuitTotals: observerTotals(rankings),
      directQualifierTeamIds: direct,
      lastChanceTeamIds: lastChance,
      qualifierTeamIds: [...direct, ...lastChance],
      eliminatedTeamIds: rankings.slice(30).map((row) => row.teamId),
      representativePlaces: {},
      stageInProgress: false,
    };
    return observerRecord({
      event,
      year,
      rankings,
      advancement,
      nextStageId: "world_last_chance",
      summary: "WORLD予選全6節・18MATCHが終了しました。上位10チームはFinalへ、11～30位はWorld Last Chanceへ進みます。",
      completedAt,
    });
  }

  if (type === "world_last_chance") {
    const qualifier = latestCircuitHistory(
      snapshot,
      ["world_qualifier_week_2", "world_qualifier"],
      year,
    );
    const participantTeamIds = advancementIds(qualifier, "lastChanceTeamIds");
    if (participantTeamIds.length !== 20) return null;
    const rankings = createObserverRankings(
      participantTeamIds,
      `${year}:world-last-chance`,
    );
    const qualifiers = rankings.slice(0, 10).map((row) => row.teamId);
    const advancement = {
      circuitYear: year,
      circuitStageId: "world_last_chance",
      participantSeeds: observerSeeds(participantTeamIds),
      groupAssignments: null,
      circuitTotals: observerTotals(rankings),
      directQualifierTeamIds: qualifiers,
      lastChanceTeamIds: [],
      qualifierTeamIds: qualifiers,
      eliminatedTeamIds: rankings.slice(10).map((row) => row.teamId),
      representativePlaces: {},
      stageInProgress: false,
    };
    return observerRecord({
      event,
      year,
      rankings,
      advancement,
      nextStageId: "world_final",
      summary: "WORLD LAST CHANCEが終了し、上位10チームがWorld Finalへ進出しました。",
      completedAt,
    });
  }

  if (type === "world_final") {
    const qualifier = latestCircuitHistory(
      snapshot,
      ["world_qualifier_week_2", "world_qualifier"],
      year,
    );
    const lastChance = latestCircuitHistory(snapshot, "world_last_chance", year);
    const participantTeamIds = [
      ...advancementIds(qualifier, "directQualifierTeamIds"),
      ...advancementIds(lastChance, "qualifierTeamIds"),
    ];
    if (participantTeamIds.length !== 20) return null;
    const rankings = createObserverRankings(
      participantTeamIds,
      `${year}:world-final`,
    );
    const winner = rankings[0].teamId;
    const advancement = {
      circuitYear: year,
      circuitStageId: "world_final",
      participantSeeds: observerSeeds(participantTeamIds),
      groupAssignments: null,
      circuitTotals: observerTotals(rankings),
      directQualifierTeamIds: [],
      lastChanceTeamIds: [],
      qualifierTeamIds: [winner],
      eliminatedTeamIds: rankings.slice(1).map((row) => row.teamId),
      representativePlaces: {},
      winnerTeamId: winner,
      stageInProgress: false,
    };
    return observerRecord({
      event,
      year,
      rankings,
      advancement,
      nextStageId: null,
      summary: `WORLD FINALは${rankings[0].teamName}がMATCH POINTを成立させ、世界王者に輝きました。`,
      completedAt,
    });
  }

  if (type === "championship") {
    const totals = new Map();
    for (
      let sourceYear = year - 2;
      sourceYear <= year;
      sourceYear += 1
    ) {
      const final = latestCircuitHistory(
        snapshot,
        "world_final",
        sourceYear,
      );
      for (const row of final?.rankings ?? []) {
        const current = totals.get(row.teamId) ?? {
          teamId: row.teamId,
          points: 0,
          wins: 0,
          recentPlace: 999,
          recentYear: 0,
        };
        current.points += getChampionshipPoints(row.place);
        current.wins += row.place === 1 ? 1 : 0;
        if (sourceYear >= current.recentYear) {
          current.recentYear = sourceYear;
          current.recentPlace = row.place;
        }
        totals.set(row.teamId, current);
      }
    }
    const participantTeamIds = [...totals.values()]
      .sort((left, right) =>
        right.points - left.points ||
        right.wins - left.wins ||
        left.recentPlace - right.recentPlace ||
        left.teamId.localeCompare(right.teamId),
      )
      .slice(0, FORMAL_CIRCUIT_RULES.championship.teams)
      .map((row) => row.teamId);
    if (participantTeamIds.length !== 20) return null;
    const rankings = createObserverRankings(
      participantTeamIds,
      `${year}:championship`,
    );
    const winner = rankings[0].teamId;
    const advancement = {
      circuitYear: year,
      circuitStageId: "championship",
      participantSeeds: observerSeeds(participantTeamIds),
      groupAssignments: null,
      circuitTotals: observerTotals(rankings),
      directQualifierTeamIds: [],
      lastChanceTeamIds: [],
      qualifierTeamIds: [winner],
      eliminatedTeamIds: rankings.slice(1).map((row) => row.teamId),
      representativePlaces: {},
      winnerTeamId: winner,
      stageInProgress: false,
    };
    return observerRecord({
      event,
      year,
      rankings,
      advancement,
      nextStageId: null,
      summary: `CHAMPIONSHIPは${rankings[0].teamName}が制しました。`,
      completedAt,
    });
  }

  return null;
}
