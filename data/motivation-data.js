/**
 * MOB BR motivation master and pure calculation helpers.
 *
 * Motivation never rewrites permanent player development. It only produces
 * an effective rank/stat adjustment for tournament calculations.
 */

import {
  STAT_IDS,
  characterValueToRank,
  rankToCharacterValue,
} from "./game-data.js?v=53";

export const MOTIVATION_DATA_VERSION = "mobbr-motivation-data-1.0.0";

export const MOTIVATION_LEVEL_ORDER = Object.freeze([
  "terrible",
  "slump",
  "normal",
  "good",
  "excellent",
  "awakened",
]);

export const MOTIVATION_LEVELS = Object.freeze({
  terrible: Object.freeze({
    id: "terrible",
    name: "絶不調",
    mark: "▼▼",
    minimumModifier: -4,
    maximumModifier: -3,
    tone: "down-strong",
  }),
  slump: Object.freeze({
    id: "slump",
    name: "不調",
    mark: "▼",
    minimumModifier: -2,
    maximumModifier: -1,
    tone: "down",
  }),
  normal: Object.freeze({
    id: "normal",
    name: "普通",
    mark: "●",
    minimumModifier: 0,
    maximumModifier: 0,
    tone: "normal",
  }),
  good: Object.freeze({
    id: "good",
    name: "好調",
    mark: "▲",
    minimumModifier: 1,
    maximumModifier: 2,
    tone: "up",
  }),
  excellent: Object.freeze({
    id: "excellent",
    name: "絶好調",
    mark: "▲▲",
    minimumModifier: 2,
    maximumModifier: 3,
    tone: "up-strong",
  }),
  awakened: Object.freeze({
    id: "awakened",
    name: "覚醒",
    mark: "★",
    minimumModifier: 5,
    maximumModifier: 5,
    tone: "awakened",
  }),
});

export const CPU_MOTIVATION_BASE_WEIGHTS = Object.freeze({
  terrible: 10,
  slump: 15,
  normal: 45,
  good: 15,
  excellent: 10,
  awakened: 5,
});

export const MOTIVATION_RULES = Object.freeze({
  awakenedChanceOnPositiveChange: 0.02,
  playerFoodChance: Object.freeze({
    D: 0.3,
    C: 0.4,
    B: 0.5,
    A: 0.6,
    S: 0.7,
    SS: 1,
  }),
  placementUpChance: Object.freeze({
    1: 1,
    2: 0.8,
    3: 0.8,
    4: 0.8,
    // The source specification omits fifth place. Keep this provisional value
    // isolated here so it can be changed without touching tournament logic.
    5: 0.5,
    6: 0.5,
    7: 0.5,
    8: 0.5,
    9: 0.5,
    10: 0.5,
  }),
  awardUpChance: Object.freeze({
    1: 1,
    2: 0.7,
    3: 0.5,
  }),
});

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function normalizeUnit(value) {
  return clamp(Number.isFinite(value) ? value : 0.5, 0, 0.999999999);
}

export function getMotivationDefinition(level) {
  return MOTIVATION_LEVELS[level] ?? MOTIVATION_LEVELS.normal;
}

export function selectMotivationModifier(level, unit = 0.5) {
  const definition = getMotivationDefinition(level);
  const span = definition.maximumModifier - definition.minimumModifier + 1;
  return definition.minimumModifier + Math.floor(normalizeUnit(unit) * span);
}

export function createMotivationRecord(
  level = "normal",
  {
    modifier = null,
    modifierUnit = 0.5,
    changedAt = null,
    reason = "initial",
  } = {},
) {
  const definition = getMotivationDefinition(level);
  const normalizedModifier = Number.isInteger(modifier)
    ? clamp(modifier, definition.minimumModifier, definition.maximumModifier)
    : selectMotivationModifier(definition.id, modifierUnit);
  return {
    level: definition.id,
    modifier: normalizedModifier,
    changedAt,
    reason,
  };
}

export function normalizeMotivationRecord(record) {
  if (typeof record === "string") {
    return createMotivationRecord(record);
  }
  if (!record || typeof record !== "object") {
    return createMotivationRecord();
  }
  return createMotivationRecord(record.level, {
    modifier: record.modifier,
    changedAt:
      typeof record.changedAt === "string" ? record.changedAt : null,
    reason:
      typeof record.reason === "string" && record.reason.trim()
        ? record.reason.trim().slice(0, 240)
        : "normalized",
  });
}

export function motivationLevelIndex(level) {
  const index = MOTIVATION_LEVEL_ORDER.indexOf(
    getMotivationDefinition(level).id,
  );
  return Math.max(0, index);
}

export function shiftMotivation(
  record,
  direction,
  {
    steps = 1,
    changeUnit = 0.5,
    modifierUnit = 0.5,
    awakenedUnit = 1,
    reason = "motivation_change",
    changedAt = null,
  } = {},
) {
  const current = normalizeMotivationRecord(record);
  const beforeIndex = motivationLevelIndex(current.level);
  const normalizedSteps = Math.max(1, Math.min(3, Math.floor(steps)));
  let nextIndex = beforeIndex;

  if (direction === "up") {
    if (current.level === "awakened") {
      nextIndex = MOTIVATION_LEVEL_ORDER.indexOf("awakened");
    } else if (
      normalizeUnit(awakenedUnit) <
        MOTIVATION_RULES.awakenedChanceOnPositiveChange
    ) {
      nextIndex = MOTIVATION_LEVEL_ORDER.indexOf("awakened");
    } else {
      nextIndex = Math.min(
        MOTIVATION_LEVEL_ORDER.indexOf("excellent"),
        beforeIndex + normalizedSteps,
      );
    }
  } else if (direction === "down") {
    nextIndex = Math.max(0, beforeIndex - normalizedSteps);
  } else {
    throw new RangeError("Motivation direction must be up or down.");
  }

  // At the upper/lower boundary, a failed change attempt keeps the exact
  // current record. Re-rolling the modifier inside the same level could make
  // a requested decrease look like an increase (for example -4 to -3).
  if (nextIndex === beforeIndex) {
    return {
      changed: false,
      before: current,
      after: current,
    };
  }

  const nextLevel = MOTIVATION_LEVEL_ORDER[nextIndex];
  const next = createMotivationRecord(nextLevel, {
    modifierUnit:
      Number.isFinite(changeUnit) ? (changeUnit + modifierUnit) / 2 : modifierUnit,
    changedAt,
    reason,
  });

  return {
    changed: true,
    before: current,
    after: next,
  };
}

export function effectiveCharacterValue(baseValue, motivation) {
  const normalized = normalizeMotivationRecord(motivation);
  return clamp(Math.round(baseValue) + normalized.modifier, 1, 73);
}

export function effectiveCharacterRank(baseRank, motivation) {
  return characterValueToRank(
    effectiveCharacterValue(rankToCharacterValue(baseRank), motivation),
  );
}

export function applyMotivationToStats(stats, motivation) {
  const normalized = normalizeMotivationRecord(motivation);
  return Object.fromEntries(
    STAT_IDS.map((statId) => [
      statId,
      clamp(
        Math.round(Number(stats?.[statId] ?? 1)) + normalized.modifier,
        1,
        73,
      ),
    ]),
  );
}

function normalizeWeights(weights) {
  const result = {};
  for (const level of MOTIVATION_LEVEL_ORDER) {
    result[level] = Math.max(0, Number(weights[level] ?? 0));
  }
  return result;
}

export function getCpuMotivationWeights(strengthValue = 37) {
  const weights = normalizeWeights(CPU_MOTIVATION_BASE_WEIGHTS);
  const strengthRate = clamp((Number(strengthValue) - 28) / 45, 0, 1);
  const terribleReduction = weights.terrible * strengthRate * 0.72;
  const slumpReduction = weights.slump * strengthRate * 0.58;
  const redistributed = terribleReduction + slumpReduction;

  weights.terrible -= terribleReduction;
  weights.slump -= slumpReduction;
  weights.normal += redistributed * 0.46;
  weights.good += redistributed * 0.31;
  weights.excellent += redistributed * 0.23;
  return weights;
}

export function selectCpuMotivation({
  unit = 0.5,
  modifierUnit = 0.5,
  strengthValue = 37,
} = {}) {
  const weights = getCpuMotivationWeights(strengthValue);
  const total = MOTIVATION_LEVEL_ORDER.reduce(
    (sum, level) => sum + weights[level],
    0,
  );
  let cursor = normalizeUnit(unit) * total;
  let selected = "normal";
  for (const level of MOTIVATION_LEVEL_ORDER) {
    cursor -= weights[level];
    if (cursor <= 0) {
      selected = level;
      break;
    }
  }
  return createMotivationRecord(selected, {
    modifierUnit,
    reason: "cpu_tournament_draw",
  });
}

export function motivationDisplay(record) {
  const normalized = normalizeMotivationRecord(record);
  const definition = getMotivationDefinition(normalized.level);
  return {
    ...definition,
    modifier: normalized.modifier,
    modifierLabel:
      normalized.modifier > 0
        ? `+${normalized.modifier}`
        : String(normalized.modifier),
  };
}
