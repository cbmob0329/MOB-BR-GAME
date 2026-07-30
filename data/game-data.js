/**
 * MOB BR common game master data.
 *
 * This module contains stable, screen-independent rules only.
 * UI state, save data, and tournament runtime state must not be stored here.
 */

export const GAME_DATA_VERSION = "mobbr-game-data-1.5.0";

export const GAME_META = Object.freeze({
  id: "mob-br",
  title: "MOB BR",
  subtitle: "ALL PLAYERS ARE THE STORY",
  startYear: 1989,
  weeksPerMonth: 4,
  monthsPerYear: 12,
});

export const ROLE_IDS = Object.freeze(["IGL", "ATK", "SUP"]);
export const STAT_IDS = Object.freeze([
  "stamina",
  "mind",
  "physical",
  "aim",
  "agility",
  "technique",
  "support",
]);
export const TRAINING_POINT_IDS = Object.freeze([
  "power",
  "tech",
  "mental",
  "shoot",
]);

export const COMPANY_RANK_BANDS = Object.freeze([
  Object.freeze({ band: "F", startCoin: 10_000, coinStep: 1_000, diamond: 10, ruby: 1 }),
  Object.freeze({ band: "E", startCoin: 19_000, coinStep: 2_000, diamond: 15, ruby: 2 }),
  Object.freeze({ band: "D", startCoin: 37_000, coinStep: 3_000, diamond: 20, ruby: 3 }),
  Object.freeze({ band: "C", startCoin: 64_000, coinStep: 5_000, diamond: 25, ruby: 4 }),
  Object.freeze({ band: "B", startCoin: 109_000, coinStep: 7_000, diamond: 30, ruby: 5 }),
  Object.freeze({ band: "A", startCoin: 172_000, coinStep: 10_000, diamond: 35, ruby: 6 }),
  Object.freeze({ band: "S", startCoin: 262_000, coinStep: 30_000, diamond: 40, ruby: 7 }),
  Object.freeze({ band: "SS", startCoin: 532_000, coinStep: 50_000, diamond: 50, ruby: 10 }),
]);

export const COMPANY_RANK_UP_REWARDS = Object.freeze({
  F: Object.freeze({ coin: 10_000, diamond: 30, ruby: 3 }),
  E: Object.freeze({ coin: 20_000, diamond: 40, ruby: 5 }),
  D: Object.freeze({ coin: 30_000, diamond: 50, ruby: 5 }),
  C: Object.freeze({ coin: 50_000, diamond: 50, ruby: 5 }),
  B: Object.freeze({ coin: 75_000, diamond: 75, ruby: 10 }),
  A: Object.freeze({ coin: 100_000, diamond: 100, ruby: 20 }),
  S: Object.freeze({ coin: 500_000, diamond: 150, ruby: 30 }),
  SS: Object.freeze({ coin: 1_000_000, diamond: 300, ruby: 50 }),
});

const RANK_BAND_ORDER = Object.freeze(["F", "E", "D", "C", "B", "A", "S", "SS"]);
const LEGACY_RANK_10_MAP = Object.freeze({
  F: "E1",
  E: "D1",
  D: "C1",
  C: "B1",
  B: "A1",
  A: "S1",
  S: "SS1",
  SS: "MOB",
});

export function clamp(value, min, max) {
  if (![value, min, max].every(Number.isFinite)) {
    throw new TypeError("clamp requires finite numbers.");
  }
  if (min > max) {
    throw new RangeError("clamp min must not exceed max.");
  }
  return Math.min(max, Math.max(min, value));
}

function createStandardRankNames() {
  return RANK_BAND_ORDER.flatMap((band) =>
    Array.from({ length: 9 }, (_, index) => `${band}${index + 1}`),
  );
}

export const STANDARD_RANK_NAMES = Object.freeze(createStandardRankNames());
export const CHARACTER_RANK_NAMES = Object.freeze([...STANDARD_RANK_NAMES, "MOB"]);
export const COMPANY_RANK_NAMES = STANDARD_RANK_NAMES;

const companyBandByName = new Map(
  COMPANY_RANK_BANDS.map((entry) => [entry.band, entry]),
);

export const COMPANY_RANK_TABLE = Object.freeze(
  COMPANY_RANK_NAMES.map((rank, zeroBasedIndex) => {
    const match = /^(SS|[FEDCBAS])([1-9])$/.exec(rank);
    if (!match) {
      throw new Error(`Unexpected company rank generated: ${rank}`);
    }

    const [, band, levelText] = match;
    const level = Number(levelText);
    const index = zeroBasedIndex + 1;
    const bandData = companyBandByName.get(band);
    const isMax = index === COMPANY_RANK_NAMES.length;

    return Object.freeze({
      index,
      rank,
      band,
      level,
      weeklyBonus: Object.freeze({
        coin: bandData.startCoin + bandData.coinStep * (level - 1),
        diamond: bandData.diamond,
        ruby: bandData.ruby,
      }),
      expToNext: isMax ? null : index,
      nextRank: isMax ? null : COMPANY_RANK_NAMES[zeroBasedIndex + 1],
      isMax,
    });
  }),
);

const companyRankByName = new Map(
  COMPANY_RANK_TABLE.map((entry) => [entry.rank, entry]),
);

export const CHARACTER_RANK_TABLE = Object.freeze(
  CHARACTER_RANK_NAMES.map((rank, zeroBasedIndex) =>
    Object.freeze({
      value: zeroBasedIndex + 1,
      rank,
      isMob: rank === "MOB",
    }),
  ),
);

const characterRankByName = new Map(
  CHARACTER_RANK_TABLE.map((entry) => [entry.rank, entry]),
);

export const WEAPON_RANK_TABLE = Object.freeze(
  CHARACTER_RANK_NAMES.map((rank, zeroBasedIndex) =>
    Object.freeze({
      value: zeroBasedIndex,
      rank,
      isMob: rank === "MOB",
    }),
  ),
);

const weaponRankByName = new Map(
  WEAPON_RANK_TABLE.map((entry) => [entry.rank, entry]),
);

export function normalizeLegacyRank(rank, { allowMob = true } = {}) {
  if (typeof rank !== "string") {
    throw new TypeError("Rank must be a string.");
  }

  const normalized = rank.trim().toUpperCase();
  if (normalized === "MOB") {
    if (!allowMob) {
      throw new RangeError("MOB is not valid for this rank type.");
    }
    return "MOB";
  }

  const match = /^(SS|[FEDCBAS])([1-9]|10)$/.exec(normalized);
  if (!match) {
    throw new RangeError(`Invalid rank: ${rank}`);
  }

  const [, band, levelText] = match;
  const level = Number(levelText);

  if (level === 10) {
    const converted = LEGACY_RANK_10_MAP[band];
    if (converted === "MOB" && !allowMob) {
      throw new RangeError("SS10 converts to MOB, which is invalid for company rank.");
    }
    return converted;
  }

  return `${band}${level}`;
}

export function getCompanyRankData(rank) {
  const normalized = normalizeLegacyRank(rank, { allowMob: false });
  const entry = companyRankByName.get(normalized);
  if (!entry) {
    throw new RangeError(`Unknown company rank: ${rank}`);
  }
  return entry;
}

export function getCompanyRankByIndex(index) {
  if (!Number.isInteger(index) || index < 1 || index > COMPANY_RANK_TABLE.length) {
    throw new RangeError("Company rank index must be an integer from 1 to 72.");
  }
  return COMPANY_RANK_TABLE[index - 1];
}

export function rankToCharacterValue(rank) {
  const normalized = normalizeLegacyRank(rank, { allowMob: true });
  const entry = characterRankByName.get(normalized);
  if (!entry) {
    throw new RangeError(`Unknown character rank: ${rank}`);
  }
  return entry.value;
}

export function characterValueToRank(value) {
  if (!Number.isInteger(value) || value < 1 || value > 73) {
    throw new RangeError("Character value must be an integer from 1 to 73.");
  }
  return CHARACTER_RANK_TABLE[value - 1].rank;
}

export function rankToWeaponValue(rank) {
  const normalized = normalizeLegacyRank(rank, { allowMob: true });
  const entry = weaponRankByName.get(normalized);
  if (!entry) {
    throw new RangeError(`Unknown weapon rank: ${rank}`);
  }
  return entry.value;
}

export function weaponValueToRank(value) {
  if (!Number.isInteger(value) || value < 0 || value > 72) {
    throw new RangeError("Weapon value must be an integer from 0 to 72.");
  }
  return WEAPON_RANK_TABLE[value].rank;
}

export function calculateCharacterOverallRank(stats) {
  if (!stats || typeof stats !== "object") {
    throw new TypeError("Stats must be an object.");
  }

  const values = STAT_IDS.map((statId) => {
    const value = stats[statId];
    if (!Number.isInteger(value) || value < 1 || value > 73) {
      throw new RangeError(`${statId} must be an integer from 1 to 73.`);
    }
    return value;
  });

  const average = Math.floor(
    values.reduce((total, value) => total + value, 0) / values.length,
  );

  return Object.freeze({
    internalAverage: average,
    rank: characterValueToRank(average),
  });
}

export function calculateWeeklyCompanyBonus(rank, cardBonusRate = 0) {
  if (!Number.isFinite(cardBonusRate) || cardBonusRate < 0) {
    throw new RangeError("Card bonus rate must be a non-negative finite number.");
  }

  const rankData = getCompanyRankData(rank);
  return Object.freeze({
    coin: Math.floor(rankData.weeklyBonus.coin * (1 + cardBonusRate)),
    diamond: rankData.weeklyBonus.diamond,
    ruby: rankData.weeklyBonus.ruby,
    baseCoin: rankData.weeklyBonus.coin,
    cardBonusRate,
  });
}

export function addCompanyExp(rank, currentExp, gainedExp) {
  if (!Number.isInteger(currentExp) || currentExp < 0) {
    throw new RangeError("Current EXP must be a non-negative integer.");
  }
  if (!Number.isInteger(gainedExp) || gainedExp < 0) {
    throw new RangeError("Gained EXP must be a non-negative integer.");
  }

  let rankData = getCompanyRankData(rank);
  let exp = currentExp + gainedExp;
  const rankUps = [];

  if (rankData.expToNext !== null && currentExp >= rankData.expToNext) {
    throw new RangeError("Current EXP must be below the current rank requirement.");
  }

  while (rankData.expToNext !== null && exp >= rankData.expToNext) {
    exp -= rankData.expToNext;
    const previousRank = rankData.rank;
    rankData = getCompanyRankData(rankData.nextRank);
    rankUps.push(
      Object.freeze({
        from: previousRank,
        to: rankData.rank,
        rewardBand: rankData.band,
        reward: COMPANY_RANK_UP_REWARDS[rankData.band],
      }),
    );
  }

  if (rankData.isMax) {
    exp = 0;
  }

  return Object.freeze({
    rank: rankData.rank,
    rankIndex: rankData.index,
    currentExp: exp,
    expToNext: rankData.expToNext,
    rankUps: Object.freeze(rankUps),
  });
}

export const INITIAL_GAME_DATA = Object.freeze({
  gameDate: Object.freeze({
    year: 1989,
    month: 1,
    week: 1,
  }),
  resources: Object.freeze({
    coin: 10_000,
    diamond: 10,
    ruby: 1,
  }),
  company: Object.freeze({
    rank: "F1",
    exp: 0,
    badgeId: "b1",
    badgeImage: "Play/b1.png",
    roomId: "room01",
  }),
  team: Object.freeze({
    size: 3,
    roles: ROLE_IDS,
    initialHp: 650,
  }),
  bagCapacity: 5,
  coachCount: 1,
  strategyIds: Object.freeze(["D-01", "D-02", "D-03", "D-04", "D-05"]),
  weaponSkinIds: Object.freeze([
    "green_bash",
    "emerald_gun",
    "purple_bullet",
  ]),
});

export function validateGameDate(gameDate) {
  if (!gameDate || typeof gameDate !== "object") {
    throw new TypeError("Game date must be an object.");
  }

  const { year, month, week } = gameDate;
  if (!Number.isInteger(year) || year < 1) {
    throw new RangeError("Year must be a positive integer.");
  }
  if (!Number.isInteger(month) || month < 1 || month > GAME_META.monthsPerYear) {
    throw new RangeError("Month must be an integer from 1 to 12.");
  }
  if (!Number.isInteger(week) || week < 1 || week > GAME_META.weeksPerMonth) {
    throw new RangeError("Week must be an integer from 1 to 4.");
  }

  return Object.freeze({ year, month, week });
}

export function advanceGameWeek(gameDate, amount = 1) {
  const validDate = validateGameDate(gameDate);
  if (!Number.isInteger(amount) || amount < 0) {
    throw new RangeError("Week amount must be a non-negative integer.");
  }

  const weeksPerYear = GAME_META.monthsPerYear * GAME_META.weeksPerMonth;
  const absoluteWeek =
    (validDate.year - 1) * weeksPerYear +
    (validDate.month - 1) * GAME_META.weeksPerMonth +
    (validDate.week - 1) +
    amount;

  const year = Math.floor(absoluteWeek / weeksPerYear) + 1;
  const weekOfYear = absoluteWeek % weeksPerYear;
  const month = Math.floor(weekOfYear / GAME_META.weeksPerMonth) + 1;
  const week = (weekOfYear % GAME_META.weeksPerMonth) + 1;

  return Object.freeze({ year, month, week });
}

export function isChampionshipYear(year) {
  if (!Number.isInteger(year)) {
    throw new TypeError("Year must be an integer.");
  }
  return year >= 1991 && (year - 1991) % 3 === 0;
}

export const CASUAL_WEEK_BY_MONTH = Object.freeze({
  1: 3,
  2: 3,
  3: 3,
  4: 3,
  5: 3,
  6: 4,
  7: 4,
  8: 3,
  9: 4,
  10: 3,
  11: 3,
  12: 2,
});

export const FORMAL_TOURNAMENT_SCHEDULE_TEMPLATE = Object.freeze([
  Object.freeze({
    month: 4,
    week: 1,
    circuitYearStage: 1,
    tournamentType: "local",
    stageId: "annual_local",
    stageName: "MOB BR LOCAL",
  }),
  Object.freeze({
    month: 6,
    week: 1,
    circuitYearStage: 2,
    tournamentType: "national_week_1",
    stageId: "annual_national_week_1",
    stageName: "MOB BR NATIONAL 1週目",
    circuitStageId: "national",
    stagePart: 1,
  }),
  Object.freeze({
    month: 6,
    week: 2,
    circuitYearStage: 3,
    tournamentType: "national_week_2",
    stageId: "annual_national_week_2",
    stageName: "MOB BR NATIONAL 2週目",
    circuitStageId: "national",
    stagePart: 2,
  }),
  Object.freeze({
    month: 7,
    week: 2,
    circuitYearStage: 4,
    tournamentType: "national_last_chance",
    stageId: "annual_national_last_chance",
    stageName: "NATIONAL LAST CHANCE",
    circuitStageId: "national_last_chance",
  }),
  Object.freeze({
    month: 9,
    week: 1,
    circuitYearStage: 5,
    tournamentType: "world_qualifier_week_1",
    stageId: "annual_world_qualifier_week_1",
    stageName: "MOB BR WORLD 予選1週目",
    circuitStageId: "world_qualifier",
    stagePart: 1,
  }),
  Object.freeze({
    month: 9,
    week: 2,
    circuitYearStage: 6,
    tournamentType: "world_qualifier_week_2",
    stageId: "annual_world_qualifier_week_2",
    stageName: "MOB BR WORLD 予選2週目",
    circuitStageId: "world_qualifier",
    stagePart: 2,
  }),
  Object.freeze({
    month: 10,
    week: 1,
    circuitYearStage: 7,
    tournamentType: "world_last_chance",
    stageId: "annual_world_last_chance",
    stageName: "WORLD LAST CHANCE",
    circuitStageId: "world_last_chance",
  }),
  Object.freeze({
    month: 11,
    week: 1,
    circuitYearStage: 8,
    tournamentType: "world_final",
    stageId: "annual_world_final",
    stageName: "MOB BR WORLD FINAL",
    circuitStageId: "world_final",
  }),
]);

export const TOURNAMENT_SCHEDULE_TEMPLATE = FORMAL_TOURNAMENT_SCHEDULE_TEMPLATE;

function createCasualEvents(year, month, week) {
  const casualWeek = CASUAL_WEEK_BY_MONTH[month];
  if (week !== casualWeek) return [];
  const choiceGroupId = `${year}-${String(month).padStart(2, "0")}-casual`;
  return [
    Object.freeze({
      year,
      month,
      week,
      split: null,
      tournamentType: "casual_denden",
      stageId: `casual_denden_${String(month).padStart(2, "0")}`,
      stageName: "デンデンカップ",
      seasonId: `${year}-annual-circuit`,
      tournamentId: `${choiceGroupId}-denden`,
      choiceGroupId,
      optional: true,
      recordOnlyWhenEntered: true,
    }),
    Object.freeze({
      year,
      month,
      week,
      split: null,
      tournamentType: "casual_mobutetsu",
      stageId: `casual_mobutetsu_${String(month).padStart(2, "0")}`,
      stageName: "モブテツカップ",
      seasonId: `${year}-annual-circuit`,
      tournamentId: `${choiceGroupId}-mobutetsu`,
      choiceGroupId,
      optional: true,
      recordOnlyWhenEntered: true,
    }),
    Object.freeze({
      year,
      month,
      week,
      split: null,
      tournamentType: "casual_rockets",
      stageId: `casual_rockets_${String(month).padStart(2, "0")}`,
      stageName: "ジョーダンロケッツカップ",
      seasonId: `${year}-annual-circuit`,
      tournamentId: `${choiceGroupId}-rockets`,
      choiceGroupId,
      optional: true,
      recordOnlyWhenEntered: true,
    }),
    Object.freeze({
      year,
      month,
      week,
      split: null,
      tournamentType: "casual_tempest",
      stageId: `casual_tempest_${String(month).padStart(2, "0")}`,
      stageName: "ゴールデンテンペストカップ",
      seasonId: `${year}-annual-circuit`,
      tournamentId: `${choiceGroupId}-tempest`,
      choiceGroupId,
      optional: true,
      recordOnlyWhenEntered: true,
    }),
  ];
}

export function getTournamentEventsForDate(gameDate) {
  const { year, month, week } = validateGameDate(gameDate);
  const events = FORMAL_TOURNAMENT_SCHEDULE_TEMPLATE
    .filter((event) => event.month === month && event.week === week)
    .map((event) =>
      Object.freeze({
        ...event,
        year,
        split: null,
        seasonId: `${year}-annual-circuit`,
        tournamentId: `${year}-${event.stageId}`,
      }),
    );

  events.push(...createCasualEvents(year, month, week));

  if (month === 12 && week === 4 && isChampionshipYear(year)) {
    events.push(
      Object.freeze({
        year,
        month,
        week,
        split: null,
        tournamentType: "championship",
        stageId: "championship",
        stageName: "CHAMPIONSHIP",
        seasonId: `${year}-championship`,
        tournamentId: `${year}-championship`,
        circuitStageId: "championship",
      }),
    );
  }

  return Object.freeze(events);
}

export const TOURNAMENT_SESSION_RULES = Object.freeze({
  matchesPerSession: 5,
  simulationRoundTargets: Object.freeze([20, 15, 10, 6, 4, 2, 1]),
  displayRoundLimit: 5,
  mergeFinalDuelIntoFinale: true,
  roundEncounterRates: Object.freeze([1, 0.75, 1, 0.75, 1, 1]),
  resultLayers: Object.freeze(["ROUND", "MATCH", "TOURNAMENT_TOTAL"]),
});

export const PLACEMENT_POINTS = Object.freeze([
  0,
  15,
  12,
  10,
  8,
  7,
  6,
  5,
  4,
  3,
  2,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
]);

export function getPlacementPoints(place) {
  if (!Number.isInteger(place) || place < 1) {
    throw new RangeError("Placement must be a positive integer.");
  }

  // NATIONAL tournaments contain 40 teams. Places below the
  // published top-20 point table are valid placements and receive 0 PP.
  return PLACEMENT_POINTS[place] ?? 0;
}

export const TEAM_POINT_RULES = Object.freeze({
  killPointPerConfirmedKill: 1,
  assistDamageThreshold: 0.4,
  assistAddsToTeamTotal: false,
  matchTotalFormula: "placementPoint + kp",
});

export const CHAMPIONSHIP_POINTS = Object.freeze([
  0,
  15,
  8,
  5,
  4,
  3,
  1,
  1,
  1,
  1,
  1,
]);

export function getChampionshipPoints(place) {
  if (!Number.isInteger(place) || place < 1) {
    throw new RangeError("Placement must be a positive integer.");
  }
  return place <= 10 ? CHAMPIONSHIP_POINTS[place] : 0;
}

export const MATCH_RANKING_TIE_BREAKERS = Object.freeze([
  "survivalState",
  "eliminationOrder",
  "eliminationRound",
  "matchKp",
  "damage",
  "assists",
  "battlePower",
  "teamId",
]);

export const TOURNAMENT_TOTAL_TIE_BREAKERS = Object.freeze([
  "sumTotal",
  "sumPlacementPoint",
  "sumKp",
  "sumAp",
  "sumDamage",
  "wins",
  "bestPlace",
  "teamId",
]);
