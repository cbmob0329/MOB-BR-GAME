/**
 * MOB BR employee-system master.
 *
 * Generation 39 introduces only the employee foundation. Cooking calls the
 * point APIs later; permanent player HP values remain owned by the main save
 * and the employee bonus is applied as a derived value.
 */

export const EMPLOYEE_DATA_VERSION = "mobbr-employee-data-1.0.0";

const RANK_BANDS = Object.freeze([
  "F",
  "E",
  "D",
  "C",
  "B",
  "A",
  "S",
  "SS",
]);

export const EMPLOYEE_RANKS = Object.freeze(
  RANK_BANDS.flatMap((band) =>
    Array.from({ length: 9 }, (_value, index) => `${band}${index + 1}`),
  ),
);

export const EMPLOYEE_MASTER = Object.freeze([
  Object.freeze({
    employeeId: "mob_pink",
    name: "モブピンク",
    image: "icon/pink.png",
    initialRank: "F1",
    homeMotion: "forward",
  }),
  Object.freeze({
    employeeId: "mob_white",
    name: "モブホワイト",
    image: "icon/white.png",
    initialRank: "F1",
    homeMotion: "reverse",
  }),
]);

export const EMPLOYEE_COOKING_POINT_VALUES = Object.freeze({
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  S: 5,
  SS: 10,
});

export const EMPLOYEE_RULES = Object.freeze({
  initialEmployeeIds: Object.freeze(EMPLOYEE_MASTER.map((employee) => employee.employeeId)),
  maximumEmployeeCount: 5,
  maximumRank: "SS9",
  // The source says employee ranks increase weekly coin, but no amount or
  // formula is specified. Keep the hook explicit and neutral until defined.
  weeklyCoinBonusFormula: null,
});

function assertEmployeeRank(rank) {
  if (!EMPLOYEE_RANKS.includes(rank)) {
    throw new RangeError(`Invalid employee rank: ${rank}`);
  }
  return rank;
}

export function getEmployeeMaster(employeeId) {
  const employee = EMPLOYEE_MASTER.find((entry) => entry.employeeId === employeeId);
  if (!employee) {
    throw new RangeError(`Unknown employee: ${employeeId}`);
  }
  return employee;
}

export function getEmployeeRankIndex(rank) {
  return EMPLOYEE_RANKS.indexOf(assertEmployeeRank(rank)) + 1;
}

export function getEmployeeRankByIndex(index) {
  if (!Number.isInteger(index) || index < 1 || index > EMPLOYEE_RANKS.length) {
    throw new RangeError("Employee rank index must be from 1 to 72.");
  }
  return EMPLOYEE_RANKS[index - 1];
}

export function getEmployeePointsToNext(rank) {
  const index = getEmployeeRankIndex(rank);
  if (index >= EMPLOYEE_RANKS.length) {
    return null;
  }
  if (index === 1) return 5;
  if (index === 2) return 8;
  if (index === 3) return 12;
  if (index === 4) return 15;
  return 15 + index;
}

export function getEmployeeHpBonus(rank) {
  return getEmployeeRankIndex(rank);
}

export function getEmployeeRankData(rank) {
  const validRank = assertEmployeeRank(rank);
  const index = getEmployeeRankIndex(validRank);
  return Object.freeze({
    rank: validRank,
    index,
    hpBonus: index,
    pointsToNext: getEmployeePointsToNext(validRank),
    nextRank: index >= EMPLOYEE_RANKS.length
      ? null
      : getEmployeeRankByIndex(index + 1),
  });
}

export function createInitialEmployeeRecords(joinedAt = new Date().toISOString()) {
  return EMPLOYEE_MASTER.map((master) => ({
    employeeId: master.employeeId,
    name: master.name,
    image: master.image,
    rank: master.initialRank,
    rankIndex: getEmployeeRankIndex(master.initialRank),
    cookingPoints: 0,
    hpBonus: getEmployeeHpBonus(master.initialRank),
    joinedAt,
    source: "initial_employee",
  }));
}

export function normalizeEmployeeRecord(record, fallbackEmployeeId = null) {
  const employeeId =
    typeof record?.employeeId === "string" && record.employeeId.trim()
      ? record.employeeId.trim()
      : fallbackEmployeeId;
  const master = getEmployeeMaster(employeeId);
  const rank = EMPLOYEE_RANKS.includes(record?.rank)
    ? record.rank
    : master.initialRank;
  const rankData = getEmployeeRankData(rank);
  const pointsToNext = rankData.pointsToNext;
  const cookingPoints = Math.max(
    0,
    Math.floor(Number(record?.cookingPoints) || 0),
  );
  return {
    employeeId: master.employeeId,
    name:
      typeof record?.name === "string" && record.name.trim()
        ? record.name.trim().slice(0, 40)
        : master.name,
    image:
      typeof record?.image === "string" && record.image.trim()
        ? record.image.trim()
        : master.image,
    rank,
    rankIndex: rankData.index,
    cookingPoints:
      pointsToNext === null
        ? 0
        : Math.min(cookingPoints, Math.max(0, pointsToNext - 1)),
    hpBonus: rankData.hpBonus,
    joinedAt:
      typeof record?.joinedAt === "string"
        ? record.joinedAt
        : new Date().toISOString(),
    source:
      typeof record?.source === "string"
        ? record.source
        : "migration",
  };
}

export function getCookingPointsForFoodRank(foodRank) {
  const normalized = String(foodRank ?? "").trim().toUpperCase();
  const value = EMPLOYEE_COOKING_POINT_VALUES[normalized];
  if (!Number.isInteger(value)) {
    throw new RangeError(`Unsupported food rank for employee points: ${foodRank}`);
  }
  return value;
}

export function applyEmployeeCookingPoints(employee, amount) {
  if (!Number.isInteger(amount) || amount < 0) {
    throw new RangeError("Employee cooking points must be a non-negative integer.");
  }
  const normalized = normalizeEmployeeRecord(employee, employee?.employeeId);
  let cookingPoints = normalized.cookingPoints + amount;
  let rankIndex = normalized.rankIndex;
  const rankUps = [];

  while (rankIndex < EMPLOYEE_RANKS.length) {
    const currentRank = getEmployeeRankByIndex(rankIndex);
    const required = getEmployeePointsToNext(currentRank);
    if (required === null || cookingPoints < required) {
      break;
    }
    cookingPoints -= required;
    const nextIndex = rankIndex + 1;
    const nextRank = getEmployeeRankByIndex(nextIndex);
    rankUps.push({
      from: currentRank,
      to: nextRank,
      spentPoints: required,
      beforeHpBonus: rankIndex,
      afterHpBonus: nextIndex,
    });
    rankIndex = nextIndex;
  }

  const rank = getEmployeeRankByIndex(rankIndex);
  if (rankIndex >= EMPLOYEE_RANKS.length) {
    cookingPoints = 0;
  }

  return {
    employee: {
      ...normalized,
      rank,
      rankIndex,
      cookingPoints,
      hpBonus: getEmployeeHpBonus(rank),
    },
    addedPoints: amount,
    rankUps,
  };
}

export function getTotalEmployeeHpBonus(employees) {
  if (!Array.isArray(employees)) {
    return 0;
  }
  return employees.reduce(
    (total, employee) =>
      total + getEmployeeHpBonus(normalizeEmployeeRecord(employee, employee?.employeeId).rank),
    0,
  );
}

export function getEmployeeWeeklyCoinBonusRate(_employees) {
  // Intentionally zero until the source defines the numerical formula.
  return 0;
}
