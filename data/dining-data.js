/**
 * MOB BR dining-room rules and persistent weekly state.
 */

import {
  MOTIVATION_RULES,
} from "./motivation-data.js?v=45";

export const DINING_DATA_VERSION =
  "mobbr-dining-data-1.0.0";
export const DINING_STATE_SCHEMA_VERSION =
  "mobbr-dining-state-1.0.0";

export const DINING_TRAINING_RATE_BY_RANK =
  Object.freeze({
    D: 0.05,
    C: 0.10,
    B: 0.15,
    A: 0.20,
    S: 0.30,
    SS: 0.50,
  });

export const DINING_RULES =
  Object.freeze({
    dishesPerMeal: 3,
    mealDurationSeconds: 10,
    clearDelaySeconds: 2,
    oneMealPerCharacterPerWeek: true,
    maximumCoachTrainingBonusRate: 1,
    playerMotivationChanceByRank:
      MOTIVATION_RULES.playerFoodChance,
  });

export const DINING_HUNGRY_SPEECHES =
  Object.freeze([
    "お腹すいた…",
    "ご飯なにかな？",
    "楽しみだな！",
    "早く～！",
    "ご飯、ご飯♪",
    "いい匂いがする！",
    "今日は何を食べよう？",
    "お腹が鳴りそう…",
    "できたてがいいな！",
    "甘いものも食べたい！",
    "しっかり食べよう！",
    "料理、楽しみ！",
    "三品選んでね！",
    "今日のおすすめは？",
    "温かい料理がいいな！",
    "ごはんの時間だ！",
    "何が出るかな？",
    "たくさん動いたよ！",
    "おいしい料理待ってます！",
    "いただく準備できました！",
  ]);

export const DINING_EATING_SPEECHES =
  Object.freeze([
    "美味しい！",
    "これ好き！",
    "いいねー！",
    "味付け最高！",
    "できたてだ！",
    "もう一口！",
    "元気が出る！",
    "いい香り！",
    "これは大当たり！",
    "料理上手ですね！",
    "最高の三品！",
    "食感もいい！",
  ]);

export function diningWeekKey(gameDate) {
  return [
    Number(gameDate?.year) || 0,
    Number(gameDate?.month) || 0,
    Number(gameDate?.week) || 0,
  ].join("-");
}

export function createInitialDiningState(
  gameDate,
  {
    createdAt = new Date().toISOString(),
  } = {},
) {
  return {
    schemaVersion:
      DINING_STATE_SCHEMA_VERSION,
    weekKey:
      diningWeekKey(gameDate),
    completedCharacterIds: [],
    activeMeals: {},
    coachMealBonuses: {},
    coachTrainingBonusRate: 0,
    history: [],
    createdAt,
    updatedAt: createdAt,
  };
}

export function normalizeDiningState(
  value,
  {
    gameDate,
    timestamp = new Date().toISOString(),
  } = {},
) {
  const base =
    createInitialDiningState(
      gameDate,
      { createdAt: timestamp },
    );
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }

  const currentWeek = diningWeekKey(gameDate);
  const sameWeek = value.weekKey === currentWeek;
  return {
    schemaVersion: DINING_STATE_SCHEMA_VERSION,
    weekKey: currentWeek,
    completedCharacterIds:
      sameWeek && Array.isArray(value.completedCharacterIds)
        ? [...new Set(
            value.completedCharacterIds.filter(
              (entry) => typeof entry === "string" && entry,
            ),
          )]
        : [],
    activeMeals:
      sameWeek &&
      value.activeMeals &&
      typeof value.activeMeals === "object" &&
      !Array.isArray(value.activeMeals)
        ? structuredClone(value.activeMeals)
        : {},
    coachMealBonuses:
      sameWeek &&
      value.coachMealBonuses &&
      typeof value.coachMealBonuses === "object" &&
      !Array.isArray(value.coachMealBonuses)
        ? structuredClone(value.coachMealBonuses)
        : {},
    coachTrainingBonusRate:
      sameWeek
        ? Math.max(
            0,
            Math.min(
              DINING_RULES.maximumCoachTrainingBonusRate,
              Number(value.coachTrainingBonusRate) || 0,
            ),
          )
        : 0,
    history:
      Array.isArray(value.history)
        ? structuredClone(value.history).slice(-500)
        : [],
    createdAt:
      typeof value.createdAt === "string"
        ? value.createdAt
        : timestamp,
    updatedAt:
      typeof value.updatedAt === "string"
        ? value.updatedAt
        : timestamp,
  };
}

export function refreshDiningWeekToDraft(
  diningState,
  gameDate,
  {
    timestamp = new Date().toISOString(),
  } = {},
) {
  const normalized =
    normalizeDiningState(
      diningState,
      { gameDate, timestamp },
    );
  for (const key of Object.keys(diningState)) {
    delete diningState[key];
  }
  Object.assign(diningState, normalized);
  return diningState;
}

export function trainingRateForFoodRank(rank) {
  const normalized = String(rank ?? "").trim().toUpperCase();
  const rate = DINING_TRAINING_RATE_BY_RANK[normalized];
  if (!Number.isFinite(rate)) {
    throw new RangeError(`Unsupported dining food rank: ${rank}`);
  }
  return rate;
}

export function mealCoachTrainingRate(ranks) {
  if (
    !Array.isArray(ranks) ||
    ranks.length !== DINING_RULES.dishesPerMeal
  ) {
    throw new RangeError("Coach meal requires exactly three food ranks.");
  }
  return (
    ranks.reduce(
      (sum, rank) => sum + trainingRateForFoodRank(rank),
      0,
    ) / ranks.length
  );
}

export function validateDiningState(
  diningState,
  { gameDate } = {},
) {
  if (!diningState || typeof diningState !== "object" || Array.isArray(diningState)) {
    throw new TypeError("Dining state must be an object.");
  }
  if (diningState.schemaVersion !== DINING_STATE_SCHEMA_VERSION) {
    throw new RangeError(
      `Unsupported dining schema: ${diningState.schemaVersion}`,
    );
  }
  if (gameDate && diningState.weekKey !== diningWeekKey(gameDate)) {
    throw new RangeError("Dining week does not match game date.");
  }
  if (
    !Array.isArray(diningState.completedCharacterIds) ||
    new Set(diningState.completedCharacterIds).size !==
      diningState.completedCharacterIds.length
  ) {
    throw new RangeError(
      "Dining completed character IDs must be a unique array.",
    );
  }
  if (
    !diningState.activeMeals ||
    typeof diningState.activeMeals !== "object" ||
    Array.isArray(diningState.activeMeals)
  ) {
    throw new RangeError("Dining active meals must be an object.");
  }
  if (
    !Number.isFinite(diningState.coachTrainingBonusRate) ||
    diningState.coachTrainingBonusRate < 0 ||
    diningState.coachTrainingBonusRate >
      DINING_RULES.maximumCoachTrainingBonusRate
  ) {
    throw new RangeError("Dining coach training bonus is invalid.");
  }
  if (!Array.isArray(diningState.history)) {
    throw new RangeError("Dining history must be an array.");
  }
  return true;
}
