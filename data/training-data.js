/**
 * MOB BR training master data.
 *
 * Training advances the game by one week only when the execution layer commits
 * the result. This file does not mutate save data.
 */

import { TRAINING_POINT_IDS } from "./game-data.js";

export const TRAINING_DATA_VERSION = "mobbr-training-data-1.0.0";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

export const TRAINING_RULES = deepFreeze({
  teamMemberCount: 3,
  advancesWeeks: 1,
  blockedDuringIncompleteTournament: true,
  collectionBonus: {
    newBadgeRate: 0.01,
    duplicateLevelRate: 0.001,
    maximumDuplicateLevel: 9,
    rounding: "floor_each_point",
  },
});

export const TRAINING_PROGRAMS = deepFreeze([
  {
    "id": "strength_training",
    "name": "筋トレ",
    "feature": "パワー特化",
    "image": "icon/kin.png",
    "points": {
      "power": 14,
      "tech": 1,
      "mental": 2,
      "shoot": 0
    }
  },
  {
    "id": "shooting_practice",
    "name": "射撃練習",
    "feature": "射撃特化",
    "image": "icon/sha.png",
    "points": {
      "power": 0,
      "tech": 2,
      "mental": 2,
      "shoot": 14
    }
  },
  {
    "id": "strategy_research",
    "name": "作戦研究",
    "feature": "技術特化",
    "image": "icon/sak.png",
    "points": {
      "power": 0,
      "tech": 14,
      "mental": 3,
      "shoot": 1
    }
  },
  {
    "id": "mental_training",
    "name": "メンタル修行",
    "feature": "メンタル特化",
    "image": "icon/mts.png",
    "points": {
      "power": 1,
      "tech": 2,
      "mental": 14,
      "shoot": 0
    }
  },
  {
    "id": "combat_drill",
    "name": "実戦演習",
    "feature": "総合実戦",
    "image": "icon/zit.png",
    "points": {
      "power": 5,
      "tech": 5,
      "mental": 4,
      "shoot": 5
    }
  },
  {
    "id": "balanced_training",
    "name": "総合練習",
    "feature": "均等育成",
    "image": "icon/sou.png",
    "points": {
      "power": 4,
      "tech": 4,
      "mental": 4,
      "shoot": 4
    }
  }
]);

const trainingById = new Map(
  TRAINING_PROGRAMS.map((program) => [program.id, program]),
);

export function getTrainingProgram(programId) {
  const program = trainingById.get(programId);
  if (!program) {
    throw new RangeError(`Unknown training program: ${programId}`);
  }
  return program;
}

export function calculateBadgeTrainingBonusRate(badges) {
  if (!Array.isArray(badges)) {
    throw new TypeError("Badges must be an array.");
  }

  return badges.reduce((total, badge) => {
    if (!badge || typeof badge !== "object") {
      throw new TypeError("Each badge must be an object.");
    }
    const owned = badge.owned === true || Number.isInteger(badge.level);
    if (!owned) {
      return total;
    }

    const level = badge.level ?? 0;
    if (!Number.isInteger(level) || level < 0 || level > 9) {
      throw new RangeError("Badge level must be an integer from 0 to 9.");
    }

    return (
      total +
      TRAINING_RULES.collectionBonus.newBadgeRate +
      level * TRAINING_RULES.collectionBonus.duplicateLevelRate
    );
  }, 0);
}

export function calculateTrainingGain(programId, badgeBonusRate = 0) {
  if (!Number.isFinite(badgeBonusRate) || badgeBonusRate < 0) {
    throw new RangeError("Badge bonus rate must be non-negative.");
  }

  const program = getTrainingProgram(programId);
  return Object.freeze(
    Object.fromEntries(
      TRAINING_POINT_IDS.map((pointId) => [
        pointId,
        Math.floor(program.points[pointId] * (1 + badgeBonusRate)),
      ]),
    ),
  );
}

export function calculateWeeklyTraining(assignments, badgeBonusRate = 0) {
  if (!Array.isArray(assignments)) {
    throw new TypeError("Assignments must be an array.");
  }
  if (assignments.length !== TRAINING_RULES.teamMemberCount) {
    throw new RangeError("Exactly three player assignments are required.");
  }

  const playerIds = assignments.map((assignment) => assignment?.playerId);
  if (
    playerIds.some((playerId) => typeof playerId !== "string" || !playerId) ||
    new Set(playerIds).size !== playerIds.length
  ) {
    throw new RangeError("Assignments require three unique player IDs.");
  }

  const memberResults = assignments.map((assignment) =>
    Object.freeze({
      playerId: assignment.playerId,
      programId: assignment.programId,
      gain: calculateTrainingGain(assignment.programId, badgeBonusRate),
    }),
  );

  const total = Object.fromEntries(
    TRAINING_POINT_IDS.map((pointId) => [pointId, 0]),
  );

  for (const result of memberResults) {
    for (const pointId of TRAINING_POINT_IDS) {
      total[pointId] += result.gain[pointId];
    }
  }

  return Object.freeze({
    advancesWeeks: TRAINING_RULES.advancesWeeks,
    badgeBonusRate,
    memberResults: Object.freeze(memberResults),
    total: Object.freeze(total),
  });
}

export function validateTrainingMaster() {
  const ids = new Set();
  for (const program of TRAINING_PROGRAMS) {
    if (ids.has(program.id)) {
      throw new Error(`Duplicate training ID: ${program.id}`);
    }
    ids.add(program.id);

    for (const pointId of TRAINING_POINT_IDS) {
      const value = program.points[pointId];
      if (!Number.isInteger(value) || value < 0) {
        throw new Error(`Invalid ${pointId} value in ${program.id}.`);
      }
    }
  }

  return Object.freeze({
    programCount: TRAINING_PROGRAMS.length,
    valid: true,
  });
}
