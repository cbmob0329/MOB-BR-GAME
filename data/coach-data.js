/**
 * MOB BR coach and strategy-meeting master data.
 *
 * Additional coach names, images, hiring prices, and initial ranks remain
 * intentionally undefined because the source specification has not fixed them.
 */

import {
  COMPANY_RANK_TABLE,
  getCompanyRankByIndex,
  getCompanyRankData,
} from "./game-data.js";

export const COACH_DATA_VERSION = "mobbr-coach-data-1.0.0";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

export const COACH_RULES = deepFreeze({
  initialCoachCount: 1,
  maximumCoachCount: 4,
  scoutUnlockCompanyRankIndex: 5,
  scoutUnlockCompanyRank: "F5",
  scoutTarget: "coach_only",
  playerScoutEnabled: false,
  initialCoach: {
    coachId: "coach_initial",
    name: null,
    image: "Play/P1sup.png",
    rank: "F1",
    hirePrice: null,
    source: "initial",
  },
  pendingAdditionalCoachFields: [
    "name",
    "image",
    "hirePrice",
    "initialRank",
  ],
});

export const STRATEGY_MEETING_RULES = deepFreeze({
  cost: { coin: 10_000, diamond: 10, ruby: 1 },
  generatedRanks: ["C", "B", "A", "S", "SS"],
  duplicateResult: "increase_persistent_inventory_by_1",
  allCollectedMeetingAllowed: true,
  coachRankUpIndependentFromStrategyDraw: true,
  probabilityRoundingDecimals: 1,
  probabilityResidualTarget: "C",
});

export const STRATEGY_MEETING_PROBABILITY_ANCHORS = deepFreeze(
  [
  {
    "points": 10,
    "C": 95,
    "B": 5,
    "A": 0,
    "S": 0,
    "SS": 0
  },
  {
    "points": 40,
    "C": 90,
    "B": 8,
    "A": 2,
    "S": 0,
    "SS": 0
  },
  {
    "points": 100,
    "C": 82,
    "B": 12,
    "A": 5,
    "S": 1,
    "SS": 0
  },
  {
    "points": 200,
    "C": 70,
    "B": 17,
    "A": 9,
    "S": 4,
    "SS": 0
  },
  {
    "points": 350,
    "C": 58,
    "B": 20,
    "A": 14,
    "S": 7,
    "SS": 1
  },
  {
    "points": 500,
    "C": 47,
    "B": 21,
    "A": 18,
    "S": 11,
    "SS": 3
  },
  {
    "points": 700,
    "C": 36,
    "B": 21,
    "A": 21,
    "S": 16,
    "SS": 6
  },
  {
    "points": 900,
    "C": 27,
    "B": 19,
    "A": 23,
    "S": 21,
    "SS": 10
  },
  {
    "points": 1100,
    "C": 20,
    "B": 17,
    "A": 23,
    "S": 25,
    "SS": 15
  },
  {
    "points": 1300,
    "C": 14,
    "B": 14,
    "A": 22,
    "S": 28,
    "SS": 22
  },
  {
    "points": 1460,
    "C": 10,
    "B": 11,
    "A": 20,
    "S": 29,
    "SS": 30
  }
]
);

export const COACH_RANK_TABLE = deepFreeze(
  COMPANY_RANK_TABLE.map((rankData) => ({
    index: rankData.index,
    rank: rankData.rank,
    points: 10 + (rankData.index - 1) * 5,
    rankUpChance:
      rankData.isMax
        ? 0
        : Math.max(5, 30 - (rankData.index - 1) * 0.35) / 100,
    isMax: rankData.isMax,
  })),
);

const coachRankByName = new Map(
  COACH_RANK_TABLE.map((entry) => [entry.rank, entry]),
);

export function getCoachRankData(rank) {
  const companyRank = getCompanyRankData(rank);
  return coachRankByName.get(companyRank.rank);
}

export function getCoachRankByIndex(index) {
  getCompanyRankByIndex(index);
  return COACH_RANK_TABLE[index - 1];
}

export function calculateCoachTeamPoints(coaches) {
  if (!Array.isArray(coaches)) {
    throw new TypeError("Coaches must be an array.");
  }
  if (coaches.length < 1 || coaches.length > COACH_RULES.maximumCoachCount) {
    throw new RangeError("Coach count must be from 1 to 4.");
  }

  return coaches.reduce((total, coach) => {
    const rank = typeof coach === "string" ? coach : coach?.rank;
    return total + getCoachRankData(rank).points;
  }, 0);
}

function roundOneDecimal(value) {
  return Math.round((value + Number.EPSILON) * 10) / 10;
}

export function getStrategyMeetingProbabilities(totalCoachPoints) {
  if (!Number.isFinite(totalCoachPoints)) {
    throw new TypeError("Total coach points must be finite.");
  }

  const first = STRATEGY_MEETING_PROBABILITY_ANCHORS[0];
  const last =
    STRATEGY_MEETING_PROBABILITY_ANCHORS[
      STRATEGY_MEETING_PROBABILITY_ANCHORS.length - 1
    ];
  const points = Math.min(last.points, Math.max(first.points, totalCoachPoints));

  let lower = first;
  let upper = last;

  for (
    let index = 0;
    index < STRATEGY_MEETING_PROBABILITY_ANCHORS.length - 1;
    index += 1
  ) {
    const current = STRATEGY_MEETING_PROBABILITY_ANCHORS[index];
    const next = STRATEGY_MEETING_PROBABILITY_ANCHORS[index + 1];
    if (points >= current.points && points <= next.points) {
      lower = current;
      upper = next;
      break;
    }
  }

  const span = upper.points - lower.points;
  const ratio = span === 0 ? 0 : (points - lower.points) / span;
  const result = {};

  for (const rank of STRATEGY_MEETING_RULES.generatedRanks) {
    result[rank] = roundOneDecimal(
      lower[rank] + (upper[rank] - lower[rank]) * ratio,
    );
  }

  const nonC = STRATEGY_MEETING_RULES.generatedRanks
    .filter((rank) => rank !== "C")
    .reduce((total, rank) => total + result[rank], 0);
  result.C = roundOneDecimal(100 - nonC);

  return Object.freeze(result);
}

export function nextCoachRank(rank) {
  const current = getCoachRankData(rank);
  if (current.isMax) {
    return current;
  }
  return COACH_RANK_TABLE[current.index];
}

export function validateCoachMaster() {
  if (COACH_RANK_TABLE.length !== 72) {
    throw new Error("Coach rank table must contain 72 ranks.");
  }
  if (COACH_RANK_TABLE[0].points !== 10) {
    throw new Error("F1 coach points must equal 10.");
  }
  if (COACH_RANK_TABLE.at(-1).points !== 365) {
    throw new Error("SS9 coach points must equal 365.");
  }
  if (COACH_RANK_TABLE.at(-1).rankUpChance !== 0) {
    throw new Error("SS9 coach rank-up chance must equal zero.");
  }

  for (const anchor of STRATEGY_MEETING_PROBABILITY_ANCHORS) {
    const sum = STRATEGY_MEETING_RULES.generatedRanks.reduce(
      (total, rank) => total + anchor[rank],
      0,
    );
    if (sum !== 100) {
      throw new Error(`Strategy probability anchor does not total 100: ${anchor.points}`);
    }
  }

  return Object.freeze({
    rankCount: COACH_RANK_TABLE.length,
    maximumSingleCoachPoints: COACH_RANK_TABLE.at(-1).points,
    maximumTeamPoints:
      COACH_RANK_TABLE.at(-1).points * COACH_RULES.maximumCoachCount,
    valid: true,
  });
}
