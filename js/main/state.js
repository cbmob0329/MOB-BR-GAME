/**
 * MOB BR main save-state module.
 *
 * The main system is the only owner of persistent game data. Tournament code
 * receives snapshots and returns a result object; it must not mutate this save
 * directly.
 */

import {
  GAME_DATA_VERSION,
  INITIAL_GAME_DATA,
  ROLE_IDS,
  STAT_IDS,
  TRAINING_POINT_IDS,
  addCompanyExp,
  advanceGameWeek,
  calculateCharacterOverallRank,
  calculateWeeklyCompanyBonus,
  getCompanyRankData,
  rankToWeaponValue,
  validateGameDate,
} from "../../data/game-data.js?v=34";
import {
  BATTLE_CONFIG_VERSION,
  getRoleCommonSkills,
} from "../../data/battle-config.js?v=34";
import {
  TRAINING_DATA_VERSION,
} from "../../data/training-data.js";
import {
  SHOP_DATA_VERSION,
  ITEM_MASTER_VERSION,
  PACK_MASTER_VERSION,
  WEAPON_SKIN_MASTER_VERSION,
} from "../../data/shop-data.js";
import {
  COACH_DATA_VERSION,
  COACH_RULES,
} from "../../data/coach-data.js";
import {
  COLLECTION_DATA_VERSION,
  COLLECTION_MASTER_VERSION,
  ROOM_MASTER_VERSION,
} from "../../data/collection-data.js";
import {
  STRATEGY_DATA_VERSION,
  STRATEGY_MASTER_VERSION,
  STRATEGY_RULES,
  getStrategy,
} from "../../data/strategy-data.js";

export const SAVE_SCHEMA_VERSION = "mobbr-save-1.9.0";
export const SAVE_ENVELOPE_VERSION = "mobbr-save-envelope-1.0.0";

export const STORAGE_KEYS = Object.freeze({
  sharedSave: "mob_br_shared_save_v1",
  tournamentInput: "mob_br_tournament_input_v1",
  tournamentOutput: "mob_br_tournament_output_v1",
  tournamentResume: "mob_br_tournament_resume_v1",
  tournamentAck: "mob_br_tournament_ack_v1",
});

export const DEFAULT_SAVE_SLOT_ID = "slot-1";

const RESOURCE_IDS = Object.freeze(["coin", "diamond", "ruby"]);
const AUDIT_TRAIL_LIMIT = 100;
const RESULT_SIGNATURE_LIMIT = 5000;

const INITIAL_PLAYER_DEFINITIONS = Object.freeze([
  Object.freeze({
    playerId: "p1",
    role: "IGL",
    image: "Play/P1igl.png",
    stats: Object.freeze({
      stamina: 10,
      mind: 19,
      physical: 8,
      aim: 10,
      agility: 9,
      technique: 12,
      support: 11,
    }),
    weapon: Object.freeze({
      weaponId: "player_weapon_igl",
      defaultName: "エメラルドガン",
      skinId: "emerald_gun",
      image: "wepon/02.png",
      rangeRanks: Object.freeze({
        close: "F1",
        mid: "F3",
        far: "F2",
      }),
      fireRateRank: "F2",
      reloadRank: "F3",
    }),
  }),
  Object.freeze({
    playerId: "p2",
    role: "ATK",
    image: "Play/P1atk.png",
    stats: Object.freeze({
      stamina: 10,
      mind: 8,
      physical: 19,
      aim: 12,
      agility: 11,
      technique: 10,
      support: 8,
    }),
    weapon: Object.freeze({
      weaponId: "player_weapon_atk",
      defaultName: "グリーンバッシュ",
      skinId: "green_bash",
      image: "wepon/01.png",
      rangeRanks: Object.freeze({
        close: "F3",
        mid: "F2",
        far: "F1",
      }),
      fireRateRank: "F3",
      reloadRank: "F1",
    }),
  }),
  Object.freeze({
    playerId: "p3",
    role: "SUP",
    image: "Play/P1sup.png",
    stats: Object.freeze({
      stamina: 10,
      mind: 11,
      physical: 8,
      aim: 9,
      agility: 10,
      technique: 11,
      support: 19,
    }),
    weapon: Object.freeze({
      weaponId: "player_weapon_sup",
      defaultName: "パープルバレット",
      skinId: "purple_bullet",
      image: "wepon/03.png",
      rangeRanks: Object.freeze({
        close: "F1",
        mid: "F2",
        far: "F3",
      }),
      fireRateRank: "F1",
      reloadRank: "F3",
    }),
  }),
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
    throw new TypeError(`${label} must be a plain object.`);
  }
  return value;
}

function assertNonEmptyString(value, label, maximumLength = 100) {
  if (typeof value !== "string") {
    throw new TypeError(`${label} must be a string.`);
  }
  const normalized = value.trim();
  if (!normalized) {
    throw new RangeError(`${label} must not be empty.`);
  }
  if (normalized.length > maximumLength) {
    throw new RangeError(
      `${label} must not exceed ${maximumLength} characters.`,
    );
  }
  return normalized;
}

function assertNullableString(value, label, maximumLength = 100) {
  if (value === null) {
    return null;
  }
  return assertNonEmptyString(value, label, maximumLength);
}

function assertNonNegativeInteger(value, label) {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative integer.`);
  }
  return value;
}

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${label} must be a positive integer.`);
  }
  return value;
}

function nowIso(clock) {
  const value = clock();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError("Clock returned an invalid date.");
  }
  return date.toISOString();
}

function createGeneratedId(prefix = "id") {
  if (
    globalThis.crypto &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }

  const random = Math.random().toString(36).slice(2);
  return `${prefix}-${Date.now().toString(36)}-${random}`;
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function canonicalStringify(value) {
  return JSON.stringify(canonicalize(value));
}

export function calculateChecksum(payload) {
  const text = canonicalStringify(payload);
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `fnv1a32-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function createSaveEnvelope(payload) {
  return {
    envelopeVersion: SAVE_ENVELOPE_VERSION,
    schemaVersion: payload.schemaVersion,
    checksum: calculateChecksum(payload),
    payload,
  };
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new SaveCorruptionError(`${label} is not valid JSON.`, {
      cause: error,
      code: "INVALID_JSON",
    });
  }
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

function dateKey(gameDate) {
  const { year, month, week } = validateGameDate(gameDate);
  return `${year}-${String(month).padStart(2, "0")}-W${week}`;
}

function createEmptyTrainingPoints() {
  return Object.fromEntries(
    TRAINING_POINT_IDS.map((pointId) => [pointId, 0]),
  );
}

function calculateCarryBagCapacity(rankIndex) {
  if (!Number.isInteger(rankIndex) || rankIndex < 1 || rankIndex > 72) {
    throw new RangeError("Company rank index must be from 1 to 72.");
  }
  if (rankIndex <= 18) return 5;
  if (rankIndex <= 27) return 6;
  if (rankIndex <= 36) return 7;
  if (rankIndex <= 45) return 8;
  if (rankIndex <= 54) return 9;
  return 10;
}

function syncCarryBagCapacity(draft) {
  const bag = draft.inventory?.carryBag;
  if (!bag) return;
  const capacity = calculateCarryBagCapacity(draft.company.rankIndex);
  bag.capacity = capacity;
  while (bag.slots.length < capacity) bag.slots.push(null);
  if (bag.slots.length > capacity) bag.slots.length = capacity;
}

function createEmptyCareerRecord() {
  return {
    matches: 0,
    rounds: 0,
    kills: 0,
    assists: 0,
    downsGiven: 0,
    deaths: 0,
    revives: 0,
    damage: 0,
    damageTaken: 0,
    healing: 0,
    shots: 0,
    hits: 0,
    skillUses: 0,
    survivalTime: 0,
    weaponShots: 0,
    weaponHits: 0,
    weaponDamage: 0,
    weaponReloads: 0,
    mvpAwards: 0,
    awardPlacements: {},
  };
}

function createInitialWeapon(definition, customName) {
  const weaponName = customName
    ? assertNonEmptyString(customName, `${definition.role} weapon name`, 60)
    : definition.weapon.defaultName;

  const internalValues = {
    close: rankToWeaponValue(definition.weapon.rangeRanks.close),
    mid: rankToWeaponValue(definition.weapon.rangeRanks.mid),
    far: rankToWeaponValue(definition.weapon.rangeRanks.far),
    fireRate: rankToWeaponValue(definition.weapon.fireRateRank),
    reload: rankToWeaponValue(definition.weapon.reloadRank),
  };

  return {
    weaponId: definition.weapon.weaponId,
    weaponName,
    skinId: definition.weapon.skinId,
    image: definition.weapon.image,
    ammoMax: 12,
    rangeRanks: deepClone(definition.weapon.rangeRanks),
    fireRateRank: definition.weapon.fireRateRank,
    reloadRank: definition.weapon.reloadRank,
    internalValues,
  };
}

function createInitialPlayer(definition, playerName, weaponName) {
  const stats = deepClone(definition.stats);
  const overall = calculateCharacterOverallRank(stats);

  return {
    playerId: definition.playerId,
    name: assertNonEmptyString(
      playerName,
      `${definition.role} player name`,
      50,
    ),
    role: definition.role,
    image: definition.image,
    stats,
    characterRank: overall.rank,
    characterRankValue: overall.internalAverage,
    maxHp: INITIAL_GAME_DATA.team.initialHp,
    currentHp: INITIAL_GAME_DATA.team.initialHp,
    weapon: createInitialWeapon(definition, weaponName),
    skills: getRoleCommonSkills(definition.role).map((skill) => ({
      skillId: skill.id,
      name: skill.name,
      customName: null,
      level: 1,
      type: skill.type,
      target: skill.target,
      baseCt: skill.baseCt,
    })),
    specialAbilities: [],
    temporaryBonuses: {},
    careerRecord: createEmptyCareerRecord(),
  };
}

function createInitialWeeklyBonusRecord(timestamp) {
  return {
    dateKey: dateKey(INITIAL_GAME_DATA.gameDate),
    gameDate: deepClone(INITIAL_GAME_DATA.gameDate),
    rank: INITIAL_GAME_DATA.company.rank,
    baseCoin: INITIAL_GAME_DATA.resources.coin,
    cardBonusRate: 0,
    granted: deepClone(INITIAL_GAME_DATA.resources),
    source: "new_game_initial_weekly_bonus",
    grantedAt: timestamp,
  };
}

function createMasterVersions() {
  return {
    gameData: GAME_DATA_VERSION,
    battleConfig: BATTLE_CONFIG_VERSION,
    trainingData: TRAINING_DATA_VERSION,
    shopData: SHOP_DATA_VERSION,
    itemMaster: ITEM_MASTER_VERSION,
    packMaster: PACK_MASTER_VERSION,
    weaponSkinMaster: WEAPON_SKIN_MASTER_VERSION,
    coachData: COACH_DATA_VERSION,
    collectionData: COLLECTION_DATA_VERSION,
    collectionMaster: COLLECTION_MASTER_VERSION,
    roomMaster: ROOM_MASTER_VERSION,
    strategyData: STRATEGY_DATA_VERSION,
    strategyMaster: STRATEGY_MASTER_VERSION,
  };
}

export class SaveError extends Error {
  constructor(message, { code = "SAVE_ERROR", cause } = {}) {
    super(message, { cause });
    this.name = "SaveError";
    this.code = code;
  }
}

export class SaveNotFoundError extends SaveError {
  constructor(message = "Save data was not found.") {
    super(message, { code: "SAVE_NOT_FOUND" });
    this.name = "SaveNotFoundError";
  }
}

export class SaveCorruptionError extends SaveError {
  constructor(message, { code = "SAVE_CORRUPTED", cause } = {}) {
    super(message, { code, cause });
    this.name = "SaveCorruptionError";
  }
}

export class DuplicateTournamentResultError extends SaveError {
  constructor(resultSignature) {
    super(`Tournament result was already applied: ${resultSignature}`, {
      code: "DUPLICATE_TOURNAMENT_RESULT",
    });
    this.name = "DuplicateTournamentResultError";
    this.resultSignature = resultSignature;
  }
}

export class SaveTransactionError extends SaveError {
  constructor(label, cause) {
    super(`Save transaction failed: ${label}`, {
      code: "TRANSACTION_FAILED",
      cause,
    });
    this.name = "SaveTransactionError";
    this.transactionLabel = label;
  }
}

export function createMemoryStorage(initialEntries = {}) {
  assertPlainObject(initialEntries, "Initial storage entries");
  const map = new Map(
    Object.entries(initialEntries).map(([key, value]) => [
      String(key),
      String(value),
    ]),
  );

  return {
    get length() {
      return map.size;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
    getItem(key) {
      const normalized = String(key);
      return map.has(normalized) ? map.get(normalized) : null;
    },
    setItem(key, value) {
      map.set(String(key), String(value));
    },
    removeItem(key) {
      map.delete(String(key));
    },
    clear() {
      map.clear();
    },
    dump() {
      return Object.fromEntries(map.entries());
    },
  };
}

export function createNewGameState(
  setup,
  {
    saveSlotId = DEFAULT_SAVE_SLOT_ID,
    clock = () => new Date(),
    idFactory = createGeneratedId,
  } = {},
) {
  assertPlainObject(setup, "New game setup");

  const companyBaseName = assertNonEmptyString(
    setup.companyBaseName,
    "Company base name",
    50,
  );
  assertPlainObject(setup.playerNames, "Player names");

  const weaponNames = setup.weaponNames ?? {};
  assertPlainObject(weaponNames, "Weapon names");

  const companyName = `MOB BR ${companyBaseName}`;
  const timestamp = nowIso(clock);

  const players = INITIAL_PLAYER_DEFINITIONS.map((definition) =>
    createInitialPlayer(
      definition,
      setup.playerNames[definition.role],
      weaponNames[definition.role] ?? null,
    ),
  );

  const initialWeeklyBonus = createInitialWeeklyBonusRecord(timestamp);

  const state = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    saveSlotId: assertNonEmptyString(saveSlotId, "Save slot ID", 100),
    revision: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
    setupCompleted: true,
    masterVersions: createMasterVersions(),

    gameDate: deepClone(INITIAL_GAME_DATA.gameDate),

    company: {
      companyId: idFactory("company"),
      baseName: companyBaseName,
      companyName,
      rank: INITIAL_GAME_DATA.company.rank,
      rankIndex: getCompanyRankData(INITIAL_GAME_DATA.company.rank).index,
      exp: INITIAL_GAME_DATA.company.exp,
      badgeId: INITIAL_GAME_DATA.company.badgeId,
      badgeImage: INITIAL_GAME_DATA.company.badgeImage,
      activeRoomId: INITIAL_GAME_DATA.company.roomId,
      unlockedRoomIds: [INITIAL_GAME_DATA.company.roomId],
    },

    playerTeam: {
      teamId: idFactory("team"),
      teamName: companyName,
      teamLogo: INITIAL_GAME_DATA.company.badgeImage,
      companyName,
      members: players,
      currentForm: "normal",
      tournamentSeed: null,
    },

    resources: deepClone(INITIAL_GAME_DATA.resources),
    trainingPoints: createEmptyTrainingPoints(),
    playerTrainingPoints: Object.fromEntries(
      players.map((player) => [player.playerId, createEmptyTrainingPoints()]),
    ),

    collectionBonuses: {
      weeklyCoinRate: 0,
      trainingPointRate: 0,
    },

    inventory: {
      items: {},
      carryBag: {
        capacity: INITIAL_GAME_DATA.bagCapacity,
        slots: Array.from(
          { length: INITIAL_GAME_DATA.bagCapacity },
          () => null,
        ),
      },
      cardPacks: {},
      badgePacks: {},
      weaponSkins: Object.fromEntries(
        INITIAL_GAME_DATA.weaponSkinIds.map((skinId) => [skinId, true]),
      ),
      strategies: Object.fromEntries(
        STRATEGY_RULES.initialStrategyIds.map((strategyId) => [
          strategyId,
          1,
        ]),
      ),
    },

    coaches: [
      {
        coachId: COACH_RULES.initialCoach.coachId,
        name: COACH_RULES.initialCoach.name,
        image: COACH_RULES.initialCoach.image,
        rank: COACH_RULES.initialCoach.rank,
        source: COACH_RULES.initialCoach.source,
      },
    ],

    collections: {
      cards: {},
      badges: {},
      trophies: [],
      other: {},
      openHistory: [],
      conversionTotals: { coin: 0, diamond: 0, ruby: 0 },
      roomLayouts: {
        [INITIAL_GAME_DATA.company.roomId]: [],
      },
    },

    weeklyBonus: {
      lastGrantedDateKey: initialWeeklyBonus.dateKey,
      history: [initialWeeklyBonus],
    },

    tournament: {
      activeEntryId: null,
      resumeData: null,
      history: [],
      processedResultSignatures: [],
      processedResultIds: [],
      processedEntryIds: [],
      championshipPoints: 0,
      championshipPointHistory: [],
      awards: [],
    },

    records: {
      tournamentsEntered: 0,
      tournamentWins: 0,
      trainingCompleted: 0,
      strategyMeetings: 0,
      cardPacksOpened: 0,
      badgePacksOpened: 0,
      weaponSkinGachaDraws: 0,
      totalKills: 0,
      totalAssists: 0,
      totalDamage: 0,
      totalDamageTaken: 0,
      memberCareer: Object.fromEntries(
        players.map((player) => [
          player.playerId,
          deepClone(player.careerRecord),
        ]),
      ),
    },

    unlockFlags: {
      coachScout: false,
      nationalCardPacks: false,
      worldCardPacks: false,
    },

    settings: {
      soundEnabled: true,
      bgmVolume: 1,
      seVolume: 1,
      commentarySpeed: 1,
      reducedMotion: false,
      autoAdvanceOpening: false,
      textLanguage: "ja",
      testMode: false,
    },

    ui: {
      lastScreen: "home",
      lastSubScreen: null,
      guideFlags: {},
      pendingWeekStart: null,
    },

    system: {
      auditTrail: [
        {
          revision: 0,
          label: "new_game_created",
          at: timestamp,
        },
      ],
      migrationHistory: [],
    },
  };

  validateSaveState(state);
  return state;
}

function validatePlayer(player, index) {
  assertPlainObject(player, `Player ${index}`);
  assertNonEmptyString(player.playerId, `Player ${index} ID`, 100);
  assertNonEmptyString(player.name, `Player ${index} name`, 50);

  if (!ROLE_IDS.includes(player.role)) {
    throw new SaveCorruptionError(
      `Player ${player.playerId} has an invalid role.`,
      { code: "INVALID_PLAYER_ROLE" },
    );
  }

  assertPlainObject(player.stats, `Player ${player.playerId} stats`);
  for (const statId of STAT_IDS) {
    const value = player.stats[statId];
    if (!Number.isInteger(value) || value < 1 || value > 73) {
      throw new SaveCorruptionError(
        `Player ${player.playerId} has an invalid ${statId} value.`,
        { code: "INVALID_PLAYER_STAT" },
      );
    }
  }

  const overall = calculateCharacterOverallRank(player.stats);
  if (
    player.characterRank !== overall.rank ||
    player.characterRankValue !== overall.internalAverage
  ) {
    throw new SaveCorruptionError(
      `Player ${player.playerId} derived rank is inconsistent.`,
      { code: "PLAYER_RANK_MISMATCH" },
    );
  }

  assertPositiveInteger(player.maxHp, `Player ${player.playerId} max HP`);
  assertNonNegativeInteger(
    player.currentHp,
    `Player ${player.playerId} current HP`,
  );
  if (player.currentHp > player.maxHp) {
    throw new SaveCorruptionError(
      `Player ${player.playerId} current HP exceeds max HP.`,
      { code: "INVALID_PLAYER_HP" },
    );
  }

  assertPlainObject(player.weapon, `Player ${player.playerId} weapon`);
  assertNonEmptyString(
    player.weapon.weaponId,
    `Player ${player.playerId} weapon ID`,
    100,
  );
  assertNonEmptyString(
    player.weapon.weaponName,
    `Player ${player.playerId} weapon name`,
    60,
  );
  if (player.weapon.ammoMax !== 12) {
    throw new SaveCorruptionError(
      `Player ${player.playerId} weapon ammoMax must equal 12.`,
      { code: "INVALID_WEAPON_AMMO" },
    );
  }

  assertPlainObject(
    player.weapon.internalValues,
    `Player ${player.playerId} weapon values`,
  );
  for (const key of ["close", "mid", "far", "fireRate", "reload"]) {
    const value = player.weapon.internalValues[key];
    if (!Number.isInteger(value) || value < 0 || value > 72) {
      throw new SaveCorruptionError(
        `Player ${player.playerId} has invalid weapon value: ${key}.`,
        { code: "INVALID_WEAPON_VALUE" },
      );
    }
  }
}

function validateResourceObject(resources, label) {
  assertPlainObject(resources, label);
  for (const resourceId of RESOURCE_IDS) {
    assertNonNegativeInteger(
      resources[resourceId],
      `${label}.${resourceId}`,
    );
  }
}

function validateTrainingPoints(trainingPoints) {
  assertPlainObject(trainingPoints, "Training points");
  for (const pointId of TRAINING_POINT_IDS) {
    assertNonNegativeInteger(
      trainingPoints[pointId],
      `Training points.${pointId}`,
    );
  }
}

function validateInventoryCounts(record, label) {
  assertPlainObject(record, label);
  for (const [id, quantity] of Object.entries(record)) {
    assertNonEmptyString(id, `${label} ID`, 150);
    assertNonNegativeInteger(quantity, `${label}.${id}`);
  }
}

export function validateSaveState(state) {
  assertPlainObject(state, "Save state");

  if (state.schemaVersion !== SAVE_SCHEMA_VERSION) {
    throw new SaveCorruptionError(
      `Unsupported save schema: ${state.schemaVersion}`,
      { code: "UNSUPPORTED_SAVE_SCHEMA" },
    );
  }

  assertNonEmptyString(state.saveSlotId, "Save slot ID", 100);
  assertNonNegativeInteger(state.revision, "Save revision");
  assertNonEmptyString(state.createdAt, "Created timestamp", 100);
  assertNonEmptyString(state.updatedAt, "Updated timestamp", 100);
  validateGameDate(state.gameDate);

  assertPlainObject(state.company, "Company");
  const rankData = getCompanyRankData(state.company.rank);
  if (state.company.rankIndex !== rankData.index) {
    throw new SaveCorruptionError(
      "Company rank and rank index are inconsistent.",
      { code: "COMPANY_RANK_MISMATCH" },
    );
  }
  assertNonNegativeInteger(state.company.exp, "Company EXP");
  if (
    rankData.expToNext !== null &&
    state.company.exp >= rankData.expToNext
  ) {
    throw new SaveCorruptionError(
      "Company EXP exceeds the current-rank requirement.",
      { code: "INVALID_COMPANY_EXP" },
    );
  }

  validateResourceObject(state.resources, "Resources");
  validateTrainingPoints(state.trainingPoints);
  if (state.playerTrainingPoints !== undefined) {
    assertPlainObject(state.playerTrainingPoints, "Player training points");
    for (const player of state.playerTeam.members) {
      if (!state.playerTrainingPoints[player.playerId]) {
        throw new SaveCorruptionError(
          `Training points are missing for ${player.playerId}.`,
          { code: "MISSING_PLAYER_TRAINING_POINTS" },
        );
      }
      validateTrainingPoints(state.playerTrainingPoints[player.playerId]);
    }
  }

  assertPlainObject(state.playerTeam, "Player team");
  if (
    !Array.isArray(state.playerTeam.members) ||
    state.playerTeam.members.length !== 3
  ) {
    throw new SaveCorruptionError(
      "Player team must contain exactly three members.",
      { code: "INVALID_TEAM_SIZE" },
    );
  }

  state.playerTeam.members.forEach(validatePlayer);
  const roles = state.playerTeam.members.map((player) => player.role);
  if (
    new Set(roles).size !== 3 ||
    ROLE_IDS.some((role) => !roles.includes(role))
  ) {
    throw new SaveCorruptionError(
      "Player team must contain one IGL, one ATK, and one SUP.",
      { code: "INVALID_TEAM_ROLES" },
    );
  }

  const playerIds = state.playerTeam.members.map(
    (player) => player.playerId,
  );
  if (new Set(playerIds).size !== playerIds.length) {
    throw new SaveCorruptionError("Player IDs must be unique.", {
      code: "DUPLICATE_PLAYER_ID",
    });
  }

  assertPlainObject(state.inventory, "Inventory");
  validateInventoryCounts(state.inventory.items, "Item inventory");
  validateInventoryCounts(
    state.inventory.cardPacks,
    "Card pack inventory",
  );
  validateInventoryCounts(
    state.inventory.badgePacks,
    "Badge pack inventory",
  );
  validateInventoryCounts(
    state.inventory.strategies,
    "Strategy inventory",
  );

  assertPlainObject(state.inventory.carryBag, "Carry bag");
  assertPositiveInteger(
    state.inventory.carryBag.capacity,
    "Carry bag capacity",
  );
  if (
    !Array.isArray(state.inventory.carryBag.slots) ||
    state.inventory.carryBag.slots.length !==
      state.inventory.carryBag.capacity
  ) {
    throw new SaveCorruptionError(
      "Carry bag slot count does not match capacity.",
      { code: "INVALID_BAG_CAPACITY" },
    );
  }

  if (
    !Array.isArray(state.coaches) ||
    state.coaches.length < 1 ||
    state.coaches.length > COACH_RULES.maximumCoachCount
  ) {
    throw new SaveCorruptionError("Coach count must be from 1 to 4.", {
      code: "INVALID_COACH_COUNT",
    });
  }

  assertPlainObject(state.weeklyBonus, "Weekly bonus state");
  if (!Array.isArray(state.weeklyBonus.history)) {
    throw new SaveCorruptionError(
      "Weekly bonus history must be an array.",
      { code: "INVALID_WEEKLY_HISTORY" },
    );
  }

  assertPlainObject(state.tournament, "Tournament state");
  if (
    !Array.isArray(state.tournament.processedResultSignatures) ||
    !Array.isArray(state.tournament.processedResultIds) ||
    (state.tournament.processedEntryIds !== undefined &&
      !Array.isArray(state.tournament.processedEntryIds)) ||
    !Array.isArray(state.tournament.history)
  ) {
    throw new SaveCorruptionError(
      "Tournament history fields must be arrays.",
      { code: "INVALID_TOURNAMENT_HISTORY" },
    );
  }

  if (
    new Set(state.tournament.processedResultSignatures).size !==
    state.tournament.processedResultSignatures.length
  ) {
    throw new SaveCorruptionError(
      "Processed tournament signatures contain duplicates.",
      { code: "DUPLICATE_RESULT_SIGNATURE_RECORD" },
    );
  }

  if (
    state.tournament.processedResultSignatures.length >
    RESULT_SIGNATURE_LIMIT
  ) {
    throw new SaveCorruptionError(
      "Processed tournament signature history is too large.",
      { code: "RESULT_SIGNATURE_LIMIT_EXCEEDED" },
    );
  }

  assertPlainObject(state.records, "Records");
  assertPlainObject(state.settings, "Settings");
  assertPlainObject(state.system, "System state");
  if (!Array.isArray(state.system.auditTrail)) {
    throw new SaveCorruptionError("Audit trail must be an array.", {
      code: "INVALID_AUDIT_TRAIL",
    });
  }

  return true;
}

function normalizeLegacyRole(role) {
  return role === "SAP" ? "SUP" : role;
}

function migrateLegacyPlayer(player) {
  const migrated = deepClone(player);
  migrated.role = normalizeLegacyRole(migrated.role);
  if (migrated.weapon) {
    migrated.weapon.ammoMax = 12;
  }

  const previousMaxHp =
    Number.isFinite(migrated.maxHp) && migrated.maxHp > 0
      ? migrated.maxHp
      : 500;
  const previousCurrentHp =
    Number.isFinite(migrated.currentHp)
      ? Math.max(0, Math.min(previousMaxHp, migrated.currentHp))
      : previousMaxHp;
  const hpRate =
    previousMaxHp > 0
      ? previousCurrentHp / previousMaxHp
      : 1;
  const stamina =
    Number.isFinite(migrated.stats?.stamina)
      ? migrated.stats.stamina
      : 10;
  const newBaseline =
    Math.round((550 + stamina * 10) / 10) * 10;
  migrated.maxHp =
    Math.max(newBaseline, Math.round(previousMaxHp * 1.3));
  migrated.currentHp =
    Math.max(
      previousCurrentHp > 0 ? 1 : 0,
      Math.round(migrated.maxHp * hpRate),
    );

  if (migrated.stats?.sap !== undefined) {
    migrated.stats.support = migrated.stats.support ?? migrated.stats.sap;
    delete migrated.stats.sap;
  }

  const skillMasters = getRoleCommonSkills(migrated.role);
  const existingSkills = new Map(
    (Array.isArray(migrated.skills) ? migrated.skills : []).map(
      (skill) => [skill.skillId, skill],
    ),
  );
  migrated.skills = skillMasters.map((master) => {
    const existing = existingSkills.get(master.id) ?? {};
    return {
      skillId: master.id,
      name: master.name,
      customName:
        typeof existing.customName === "string" && existing.customName.trim()
          ? existing.customName.trim().slice(0, 24)
          : null,
      level:
        Number.isInteger(existing.level)
          ? Math.max(1, Math.min(5, existing.level))
          : 1,
      type: master.type,
      target: master.target,
      baseCt: master.baseCt,
    };
  });

  delete migrated.secondaryWeapon;
  delete migrated.ult;

  return migrated;
}

function migrateUnversionedSave(rawState, timestamp) {
  const migrated = deepClone(rawState);

  migrated.schemaVersion = SAVE_SCHEMA_VERSION;
  migrated.settings = migrated.settings ?? {};
  migrated.settings.testMode = migrated.settings.testMode === true;
  migrated.ui = migrated.ui ?? {};
  migrated.ui.lastScreen = migrated.ui.lastScreen ?? "home";
  migrated.ui.lastSubScreen = null;
  migrated.ui.pendingWeekStart =
    migrated.ui.pendingWeekStart ?? null;
  migrated.playerTrainingPoints = migrated.playerTrainingPoints ?? Object.fromEntries(
    (migrated.playerTeam?.members ?? []).map((player) => [
      player.playerId,
      deepClone(migrated.trainingPoints ?? createEmptyTrainingPoints()),
    ]),
  );
  migrated.collections =
    migrated.collections ?? {
      cards: {},
      badges: {},
      other: {},
    };
  migrated.collections.trophies =
    Array.isArray(
      migrated.collections.trophies,
    )
      ? migrated.collections.trophies
      : [];
  migrated.ui.guideFlags =
    migrated.ui.guideFlags ?? {};

  migrated.saveSlotId =
    migrated.saveSlotId ??
    migrated.slotId ??
    DEFAULT_SAVE_SLOT_ID;
  migrated.revision = Number.isInteger(migrated.revision)
    ? migrated.revision
    : 0;
  migrated.createdAt = migrated.createdAt ?? timestamp;
  migrated.updatedAt = timestamp;
  migrated.setupCompleted = migrated.setupCompleted ?? true;
  migrated.masterVersions = {
    ...createMasterVersions(),
    ...(migrated.masterVersions ?? {}),
  };

  if (migrated.playerSap && !migrated.playerSup) {
    migrated.playerSup = migrated.playerSap;
  }
  delete migrated.playerSap;

  if (Array.isArray(migrated.playerTeam?.members)) {
    migrated.playerTeam.members =
      migrated.playerTeam.members.map(migrateLegacyPlayer);
  }

  migrated.system = migrated.system ?? {};
  migrated.system.auditTrail = migrated.system.auditTrail ?? [];
  migrated.system.migrationHistory =
    migrated.system.migrationHistory ?? [];
  migrated.system.migrationHistory.push({
    from: rawState.schemaVersion ?? "unversioned",
    to: SAVE_SCHEMA_VERSION,
    at: timestamp,
  });

  return migrated;
}

export function migrateSaveState(
  rawState,
  { clock = () => new Date() } = {},
) {
  assertPlainObject(rawState, "Raw save state");

  if (rawState.schemaVersion === SAVE_SCHEMA_VERSION) {
    return {
      state: deepClone(rawState),
      migrated: false,
      fromVersion: SAVE_SCHEMA_VERSION,
    };
  }

  const timestamp = nowIso(clock);

  if (
    rawState.schemaVersion === undefined ||
    rawState.schemaVersion === null ||
    rawState.schemaVersion === "mobbr-save-0.9.0" ||
    rawState.schemaVersion === "mobbr-save-1.0.0" ||
    rawState.schemaVersion === "mobbr-save-1.1.0" ||
    rawState.schemaVersion === "mobbr-save-1.2.0" ||
    rawState.schemaVersion === "mobbr-save-1.3.0" ||
    rawState.schemaVersion === "mobbr-save-1.4.0" ||
    rawState.schemaVersion === "mobbr-save-1.5.0" ||
    rawState.schemaVersion === "mobbr-save-1.6.0" ||
    rawState.schemaVersion === "mobbr-save-1.7.0" ||
    rawState.schemaVersion === "mobbr-save-1.8.0"
  ) {
    const migrated = migrateUnversionedSave(rawState, timestamp);
    validateSaveState(migrated);
    return {
      state: migrated,
      migrated: true,
      fromVersion: rawState.schemaVersion ?? "unversioned",
    };
  }

  throw new SaveCorruptionError(
    `No migration path for save schema: ${rawState.schemaVersion}`,
    { code: "UNSUPPORTED_SAVE_MIGRATION" },
  );
}

export function serializeSaveState(state) {
  validateSaveState(state);
  return JSON.stringify(createSaveEnvelope(deepClone(state)));
}

export function deserializeSaveState(
  serialized,
  { clock = () => new Date() } = {},
) {
  if (typeof serialized !== "string" || !serialized) {
    throw new SaveCorruptionError("Serialized save data is empty.", {
      code: "EMPTY_SAVE_DATA",
    });
  }

  const parsed = parseJson(serialized, "Save data");

  if (
    parsed.envelopeVersion === SAVE_ENVELOPE_VERSION &&
    parsed.payload
  ) {
    const actualChecksum = calculateChecksum(parsed.payload);
    if (actualChecksum !== parsed.checksum) {
      throw new SaveCorruptionError("Save checksum does not match.", {
        code: "CHECKSUM_MISMATCH",
      });
    }

    const migration = migrateSaveState(parsed.payload, { clock });
    validateSaveState(migration.state);
    return migration;
  }

  const migration = migrateSaveState(parsed, { clock });
  validateSaveState(migration.state);
  return migration;
}

export function applyResourceDeltaToDraft(draft, delta) {
  assertPlainObject(draft, "Draft state");
  assertPlainObject(delta, "Resource delta");

  const nextResources = { ...draft.resources };
  for (const resourceId of RESOURCE_IDS) {
    const change = delta[resourceId] ?? 0;
    if (!Number.isInteger(change)) {
      throw new RangeError(
        `Resource delta ${resourceId} must be an integer.`,
      );
    }
    const nextValue = nextResources[resourceId] + change;
    if (!Number.isSafeInteger(nextValue) || nextValue < 0) {
      throw new RangeError(
        `Resource ${resourceId} would become invalid.`,
      );
    }
    nextResources[resourceId] = nextValue;
  }

  draft.resources = nextResources;
  return deepFreeze(deepClone(nextResources));
}

export function grantWeeklyBonusToDraft(
  draft,
  {
    cardBonusRate = draft.collectionBonuses?.weeklyCoinRate ?? 0,
    source = "weekly_start",
    grantedAt = new Date().toISOString(),
  } = {},
) {
  assertPlainObject(draft, "Draft state");
  const currentDateKey = dateKey(draft.gameDate);

  if (draft.weeklyBonus.lastGrantedDateKey === currentDateKey) {
    return deepFreeze({
      granted: false,
      reason: "already_granted",
      dateKey: currentDateKey,
    });
  }

  const bonus = calculateWeeklyCompanyBonus(
    draft.company.rank,
    cardBonusRate,
  );
  applyResourceDeltaToDraft(draft, {
    coin: bonus.coin,
    diamond: bonus.diamond,
    ruby: bonus.ruby,
  });

  const record = {
    dateKey: currentDateKey,
    gameDate: deepClone(draft.gameDate),
    rank: draft.company.rank,
    baseCoin: bonus.baseCoin,
    cardBonusRate: bonus.cardBonusRate,
    granted: {
      coin: bonus.coin,
      diamond: bonus.diamond,
      ruby: bonus.ruby,
    },
    source,
    grantedAt,
  };

  draft.weeklyBonus.lastGrantedDateKey = currentDateKey;
  draft.weeklyBonus.history.push(record);

  return deepFreeze({
    granted: true,
    record: deepClone(record),
  });
}

export function advanceWeeksToDraft(
  draft,
  amount = 1,
  {
    grantWeeklyBonus = true,
    cardBonusRate = draft.collectionBonuses?.weeklyCoinRate ?? 0,
    clock = () => new Date(),
  } = {},
) {
  assertPlainObject(draft, "Draft state");
  assertNonNegativeInteger(amount, "Week amount");

  const weeks = [];
  for (let index = 0; index < amount; index += 1) {
    const previousGameDate =
      deepClone(draft.gameDate);
    draft.gameDate =
      deepClone(
        advanceGameWeek(draft.gameDate, 1),
      );
    const monthChanged =
      previousGameDate.year !== draft.gameDate.year ||
      previousGameDate.month !== draft.gameDate.month;
    const messageIndex =
      (
        draft.gameDate.year * 48 +
        draft.gameDate.month * 4 +
        draft.gameDate.week
      ) % 50;
    const entry = {
      previousGameDate,
      gameDate: deepClone(draft.gameDate),
      monthChanged,
      messageIndex,
      weeklyBonus: null,
    };

    if (grantWeeklyBonus) {
      entry.weeklyBonus = grantWeeklyBonusToDraft(draft, {
        cardBonusRate,
        source: "week_advanced",
        grantedAt: nowIso(clock),
      });
    }

    draft.ui ??= {
      lastScreen: "home",
      lastSubScreen: null,
      pendingWeekStart: null,
    };
    draft.ui.lastScreen = "home";
    draft.ui.lastSubScreen = null;
    draft.ui.pendingWeekStart = {
      gameDate:
        deepClone(draft.gameDate),
      previousGameDate,
      monthChanged,
      monthImage:
        `back/month${String(draft.gameDate.month).padStart(2, "0")}.png`,
      messageIndex,
      createdAt:
        nowIso(clock),
    };

    weeks.push(entry);
  }

  return deepFreeze({
    advancedWeeks: amount,
    weeks: deepClone(weeks),
  });
}

export function addCompanyExpToDraft(
  draft,
  gainedExp,
  { grantRankUpRewards = true } = {},
) {
  assertPlainObject(draft, "Draft state");
  assertNonNegativeInteger(gainedExp, "Gained company EXP");

  const result = addCompanyExp(
    draft.company.rank,
    draft.company.exp,
    gainedExp,
  );

  draft.company.rank = result.rank;
  draft.company.rankIndex = result.rankIndex;
  draft.company.exp = result.currentExp;

  const rankUpRewardTotal = {
    coin: 0,
    diamond: 0,
    ruby: 0,
  };

  if (grantRankUpRewards) {
    for (const rankUp of result.rankUps) {
      for (const resourceId of RESOURCE_IDS) {
        rankUpRewardTotal[resourceId] +=
          rankUp.reward[resourceId] ?? 0;
      }
    }
    applyResourceDeltaToDraft(draft, rankUpRewardTotal);
  }

  draft.unlockFlags.coachScout =
    draft.company.rankIndex >=
    COACH_RULES.scoutUnlockCompanyRankIndex;
  syncCarryBagCapacity(draft);

  return deepFreeze({
    ...deepClone(result),
    gainedExp,
    rankUpRewardTotal,
  });
}

function addCountToRecord(record, id, amount, label) {
  assertPlainObject(record, label);
  assertNonEmptyString(id, `${label} ID`, 150);
  assertNonNegativeInteger(amount, `${label} amount`);

  const current = record[id] ?? 0;
  assertNonNegativeInteger(current, `${label} current amount`);
  record[id] = current + amount;
}

function subtractCountFromRecord(record, id, amount, label) {
  assertPlainObject(record, label);
  assertNonEmptyString(id, `${label} ID`, 150);
  assertNonNegativeInteger(amount, `${label} amount`);

  const current = record[id] ?? 0;
  if (current < amount) {
    throw new RangeError(
      `${label} quantity is insufficient for ${id}.`,
    );
  }

  const next = current - amount;
  if (next === 0) {
    delete record[id];
  } else {
    record[id] = next;
  }
}

function normalizeTournamentRewards(rewards) {
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
      `Tournament reward ${resourceId}`,
    );
  }
  assertNonNegativeInteger(
    normalized.companyExp,
    "Tournament company EXP",
  );
  validateTrainingPoints(normalized.trainingPoints);
  validateInventoryCounts(
    normalized.badgePacks,
    "Tournament badge packs",
  );
  assertNonNegativeInteger(
    normalized.championshipPoints,
    "Tournament championship points",
  );
  assertPlainObject(
    normalized.unlockFlags,
    "Tournament unlock flags",
  );

  return normalized;
}

function validateTournamentResultForState(draft, result) {
  assertPlainObject(result, "Tournament result");

  const resultSignature = assertNonEmptyString(
    result.resultSignature,
    "Tournament result signature",
    300,
  );
  const resultId = assertNonEmptyString(
    result.resultId,
    "Tournament result ID",
    300,
  );
  const entryId = assertNonEmptyString(
    result.entryId,
    "Tournament entry ID",
    300,
  );
  const saveSlotId = assertNonEmptyString(
    result.saveSlotId,
    "Tournament save slot ID",
    100,
  );

  if (saveSlotId !== draft.saveSlotId) {
    throw new SaveError(
      "Tournament result belongs to a different save slot.",
      { code: "TOURNAMENT_SAVE_SLOT_MISMATCH" },
    );
  }

  if (
    draft.tournament.processedResultSignatures.includes(
      resultSignature,
    )
  ) {
    throw new DuplicateTournamentResultError(resultSignature);
  }

  if (draft.tournament.processedResultIds.includes(resultId)) {
    throw new SaveError(
      `Tournament result ID was already applied: ${resultId}`,
      { code: "DUPLICATE_TOURNAMENT_RESULT_ID" },
    );
  }

  if (
    (draft.tournament.processedEntryIds ?? []).includes(entryId) ||
    draft.tournament.history.some(
      (historyEntry) => historyEntry.entryId === entryId,
    )
  ) {
    throw new SaveError(
      `Tournament entry was already applied: ${entryId}`,
      { code: "DUPLICATE_TOURNAMENT_ENTRY_ID" },
    );
  }

  const allowedStatuses = [
    "completed",
    "eliminated",
    "qualified",
    "champion",
    "stage_in_progress",
    "suspended",
  ];
  if (!allowedStatuses.includes(result.status)) {
    throw new SaveError(
      `Unsupported tournament result status: ${result.status}`,
      { code: "INVALID_TOURNAMENT_STATUS" },
    );
  }

  if (result.status === "suspended") {
    throw new SaveError(
      "Suspended tournament data cannot be applied as a final result.",
      { code: "TOURNAMENT_NOT_FINAL" },
    );
  }

  assertNonEmptyString(
    result.tournamentId,
    "Tournament ID",
    300,
  );
  assertNonEmptyString(
    result.tournamentType,
    "Tournament type",
    100,
  );
  assertPositiveInteger(
    result.finalPlace,
    "Tournament final place",
  );

  return {
    resultSignature,
    resultId,
    entryId,
    rewards: normalizeTournamentRewards(result.rewards ?? {}),
  };
}

function applyMemberTournamentResults(draft, memberResults) {
  if (memberResults === undefined) {
    return;
  }
  if (!Array.isArray(memberResults)) {
    throw new TypeError("Member tournament results must be an array.");
  }

  const additiveFields = [
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
  ];

  for (const memberResult of memberResults) {
    assertPlainObject(memberResult, "Member tournament result");
    const playerId = assertNonEmptyString(
      memberResult.playerId,
      "Member result player ID",
      100,
    );
    const record = draft.records.memberCareer[playerId];
    if (!record) {
      throw new SaveError(
        `Tournament result references an unknown player: ${playerId}`,
        { code: "UNKNOWN_RESULT_PLAYER" },
      );
    }

    for (const field of additiveFields) {
      const amount = memberResult[field] ?? 0;
      assertNonNegativeInteger(
        amount,
        `Member result ${playerId}.${field}`,
      );
      record[field] += amount;
    }

    draft.records.totalKills += memberResult.kills ?? 0;
    draft.records.totalAssists += memberResult.assists ?? 0;
    draft.records.totalDamage += memberResult.damage ?? 0;
    draft.records.totalDamageTaken +=
      memberResult.damageTaken ?? 0;
  }
}

function applyConsumedCarryItems(draft, consumedCarryItems) {
  if (consumedCarryItems === undefined) {
    return;
  }
  if (!Array.isArray(consumedCarryItems)) {
    throw new TypeError("Consumed carry items must be an array.");
  }

  for (const consumed of consumedCarryItems) {
    assertPlainObject(consumed, "Consumed carry item");
    const itemId = assertNonEmptyString(
      consumed.itemId,
      "Consumed item ID",
      150,
    );
    const quantity = assertNonNegativeInteger(
      consumed.quantity,
      `Consumed item ${itemId} quantity`,
    );
    subtractCountFromRecord(
      draft.inventory.items,
      itemId,
      quantity,
      "Item inventory",
    );
  }
}

function applyConsumedStrategies(
  draft,
  strategyUsage,
) {
  if (strategyUsage === undefined) {
    return [];
  }
  if (!Array.isArray(strategyUsage)) {
    throw new TypeError(
      "Strategy usage must be an array.",
    );
  }

  const applied = [];
  draft.inventory.strategies ??= {};
  for (const usage of strategyUsage) {
    assertPlainObject(
      usage,
      "Strategy usage",
    );
    const strategyId =
      assertNonEmptyString(
        usage.strategyId,
        "Strategy ID",
        100,
      );
    const uses =
      assertNonNegativeInteger(
        usage.uses ?? 0,
        `Strategy ${strategyId} uses`,
      );
    const master =
      getStrategy(strategyId);
    if (
      master.rank === "D" ||
      usage.unlimited === true ||
      uses === 0
    ) {
      continue;
    }
    const before =
      draft.inventory.strategies[
        strategyId
      ] ?? 0;
    const consumed =
      Math.min(before, uses);
    draft.inventory.strategies[
      strategyId
    ] = Math.max(
      0,
      before - consumed,
    );
    applied.push({
      strategyId,
      before,
      consumed,
      remaining:
        draft.inventory.strategies[
          strategyId
        ],
    });
  }
  return applied;
}

export function applyTournamentResultToDraft(
  draft,
  result,
  {
    advanceWeekAfterCompletion = true,
    clock = () => new Date(),
  } = {},
) {
  assertPlainObject(draft, "Draft state");
  const validation = validateTournamentResultForState(draft, result);
  const { rewards } = validation;

  applyResourceDeltaToDraft(draft, {
    coin: rewards.coin,
    diamond: rewards.diamond,
    ruby: rewards.ruby,
  });

  const companyExpResult = addCompanyExpToDraft(
    draft,
    rewards.companyExp,
    { grantRankUpRewards: true },
  );

  for (const pointId of TRAINING_POINT_IDS) {
    draft.trainingPoints[pointId] +=
      rewards.trainingPoints[pointId];
  }
  draft.playerTrainingPoints = draft.playerTrainingPoints ?? Object.fromEntries(
    draft.playerTeam.members.map((player) => [player.playerId, createEmptyTrainingPoints()]),
  );
  for (const player of draft.playerTeam.members) {
    draft.playerTrainingPoints[player.playerId] ??= createEmptyTrainingPoints();
    for (const pointId of TRAINING_POINT_IDS) {
      draft.playerTrainingPoints[player.playerId][pointId] += rewards.trainingPoints[pointId];
    }
  }

  for (const [packId, quantity] of Object.entries(
    rewards.badgePacks,
  )) {
    addCountToRecord(
      draft.inventory.badgePacks,
      packId,
      quantity,
      "Badge pack inventory",
    );
  }

  draft.collections.trophies =
    Array.isArray(
      draft.collections.trophies,
    )
      ? draft.collections.trophies
      : [];
  const existingTrophyIds =
    new Set(
      draft.collections.trophies.map(
        (trophy) =>
          trophy.trophyId,
      ),
    );
  const importedTrophies = [];
  for (
    const trophy
    of Array.isArray(
      result.trophies,
    )
      ? result.trophies
      : []
  ) {
    if (
      !trophy?.trophyId ||
      existingTrophyIds.has(
        trophy.trophyId,
      )
    ) {
      continue;
    }
    const normalizedTrophy = {
      trophyId:
        String(trophy.trophyId),
      trophyTypeId:
        String(
          trophy.trophyTypeId ??
          "",
        ),
      tournamentType:
        String(
          trophy.tournamentType ??
          result.tournamentType,
        ),
      tournamentId:
        String(
          trophy.tournamentId ??
          result.tournamentId,
        ),
      resultId:
        String(
          trophy.resultId ??
          result.resultId,
        ),
      cupId:
        String(trophy.cupId ?? ""),
      cupName:
        String(
          trophy.cupName ??
          "カジュアルカップ",
        ),
      name:
        String(
          trophy.name ??
          "カジュアルトロフィー",
        ),
      place:
        Math.max(
          1,
          Math.min(
            3,
            Number(
              trophy.place ?? 3,
            ),
          ),
        ),
      image:
        String(
          trophy.image ??
          "prize/01.png",
        ),
      acquiredAt:
        deepClone(
          trophy.acquiredAt ?? {
            year:
              result.circuitYear ??
              draft.gameDate.year,
            month:
              draft.gameDate.month,
            week:
              draft.gameDate.week,
          },
        ),
    };
    draft.collections.trophies.push(
      normalizedTrophy,
    );
    importedTrophies.push(
      normalizedTrophy,
    );
    existingTrophyIds.add(
      normalizedTrophy.trophyId,
    );
  }

  draft.tournament.championshipPoints +=
    rewards.championshipPoints;
  if (rewards.championshipPoints > 0) {
    draft.tournament.championshipPointHistory.push({
      tournamentId: result.tournamentId,
      resultId: validation.resultId,
      points: rewards.championshipPoints,
      at: nowIso(clock),
    });
  }

  for (const [flag, enabled] of Object.entries(
    rewards.unlockFlags,
  )) {
    if (enabled === true) {
      draft.unlockFlags[flag] = true;
    }
  }

  applyConsumedCarryItems(draft, result.consumedCarryItems);
  const consumedStrategies =
    applyConsumedStrategies(
      draft,
      result.strategyUsage,
    );
  applyMemberTournamentResults(draft, result.memberResults);

  const countsAsCompletedTournament =
    result.status !== "stage_in_progress";
  if (countsAsCompletedTournament) {
    draft.records.tournamentsEntered += 1;
    if (result.finalPlace === 1) {
      draft.records.tournamentWins += 1;
    }
  }

  if (Array.isArray(result.awards)) {
    draft.tournament.awards.push(
      ...deepClone(result.awards),
    );
  }

  const historyEntry = {
    resultId: validation.resultId,
    resultSignature: validation.resultSignature,
    entryId: validation.entryId,
    tournamentId: result.tournamentId,
    tournamentType: result.tournamentType,
    sessionId: result.sessionId ?? null,
    seasonId: result.seasonId ?? null,
    status: result.status,
    finalPlace: result.finalPlace,
    qualified: result.qualified === true,
    nextStageId: result.nextStageId ?? null,
    matchPointWinner: result.matchPointWinner === true,
    matchesPlayed: result.matchesPlayed ?? 0,
    teamTotals: deepClone(result.teamTotals ?? null),
    matchResults: deepClone(result.matchResults ?? []),
    roundResults: deepClone(result.roundResults ?? []),
    memberResults: deepClone(result.memberResults ?? []),
    awards: deepClone(result.awards ?? []),
    trophies: deepClone(result.trophies ?? []),
    recordsBroken: deepClone(result.recordsBroken ?? []),
    rewardTableId: result.rewardTableId ?? null,
    rewardTableVersion: result.rewardTableVersion ?? null,
    championshipPointDelta:
      result.championshipPointDelta ?? rewards.championshipPoints ?? 0,
    strategyUsage: deepClone(result.strategyUsage ?? []),
    newTournamentRecords: deepClone(
      result.newTournamentRecords ?? [],
    ),
    rankings: deepClone(result.rankings ?? []),
    completedAt: result.completedAt ?? nowIso(clock),
    rewards: deepClone(rewards),
    summary: result.summary ?? null,
    circuitYear: result.circuitYear ?? null,
    circuitStageId: result.circuitStageId ?? null,
    choiceGroupId: result.choiceGroupId ?? null,
    advancement: deepClone(result.advancement ?? null),
  };

  draft.tournament.history.push(historyEntry);
  draft.tournament.processedResultSignatures.push(
    validation.resultSignature,
  );
  draft.tournament.processedResultIds.push(
    validation.resultId,
  );
  draft.tournament.processedEntryIds ??= [];
  draft.tournament.processedEntryIds.push(validation.entryId);
  draft.tournament.activeEntryId = null;
  draft.tournament.resumeData = null;

  let weekAdvance = null;
  if (advanceWeekAfterCompletion) {
    weekAdvance = advanceWeeksToDraft(draft, 1, {
      grantWeeklyBonus: true,
      clock,
    });
  }

  return deepFreeze({
    applied: true,
    historyEntry: deepClone(historyEntry),
    companyExpResult,
    importedTrophies:
      deepClone(importedTrophies),
    consumedStrategies:
      deepClone(consumedStrategies),
    weekAdvance,
  });
}

function appendAuditEntry(draft, label, timestamp) {
  draft.system.auditTrail.push({
    revision: draft.revision,
    label,
    at: timestamp,
  });

  if (draft.system.auditTrail.length > AUDIT_TRAIL_LIMIT) {
    draft.system.auditTrail.splice(
      0,
      draft.system.auditTrail.length - AUDIT_TRAIL_LIMIT,
    );
  }
}

export function createGameStateManager({
  storage = globalThis.localStorage,
  storageKey = STORAGE_KEYS.sharedSave,
  clock = () => new Date(),
  idFactory = createGeneratedId,
} = {}) {
  const validStorage = normalizeStorage(storage);
  const listeners = new Set();
  let currentState = null;

  function emit(event) {
    const snapshot = currentState
      ? deepFreeze(deepClone(currentState))
      : null;
    for (const listener of listeners) {
      listener(snapshot, event);
    }
  }

  function persist(state) {
    const serialized = serializeSaveState(state);
    validStorage.setItem(storageKey, serialized);
  }

  function hasSave() {
    return validStorage.getItem(storageKey) !== null;
  }

  function createNewGame(
    setup,
    {
      saveSlotId = DEFAULT_SAVE_SLOT_ID,
      overwrite = false,
    } = {},
  ) {
    if (hasSave() && !overwrite) {
      throw new SaveError(
        "A save already exists. Explicit overwrite is required.",
        { code: "SAVE_ALREADY_EXISTS" },
      );
    }

    const nextState = createNewGameState(setup, {
      saveSlotId,
      clock,
      idFactory,
    });
    persist(nextState);
    currentState = nextState;
    emit({ type: "created" });
    return deepFreeze(deepClone(currentState));
  }

  function load() {
    const serialized = validStorage.getItem(storageKey);
    if (serialized === null) {
      throw new SaveNotFoundError();
    }

    const migration = deserializeSaveState(serialized, { clock });
    currentState = migration.state;

    if (migration.migrated) {
      currentState.revision += 1;
      currentState.updatedAt = nowIso(clock);
      appendAuditEntry(
        currentState,
        `migrated_from_${migration.fromVersion}`,
        currentState.updatedAt,
      );
      validateSaveState(currentState);
      persist(currentState);
    }

    emit({
      type: "loaded",
      migrated: migration.migrated,
      fromVersion: migration.fromVersion,
    });

    return deepFreeze(deepClone(currentState));
  }

  function getSnapshot() {
    if (!currentState) {
      return null;
    }
    return deepFreeze(deepClone(currentState));
  }

  function save() {
    if (!currentState) {
      throw new SaveNotFoundError(
        "No state is loaded in the manager.",
      );
    }
    validateSaveState(currentState);
    persist(currentState);
    emit({ type: "saved" });
    return getSnapshot();
  }

  function deleteSave() {
    validStorage.removeItem(storageKey);
    currentState = null;
    emit({ type: "deleted" });
  }

  function transact(label, mutator) {
    if (!currentState) {
      throw new SaveNotFoundError(
        "Load or create a save before starting a transaction.",
      );
    }
    assertNonEmptyString(label, "Transaction label", 120);
    if (typeof mutator !== "function") {
      throw new TypeError("Transaction mutator must be a function.");
    }

    const draft = deepClone(currentState);

    try {
      const result = mutator(draft);
      if (
        result &&
        typeof result === "object" &&
        typeof result.then === "function"
      ) {
        throw new TypeError(
          "Asynchronous save transactions are not supported.",
        );
      }

      draft.revision = currentState.revision + 1;
      draft.updatedAt = nowIso(clock);
      appendAuditEntry(draft, label, draft.updatedAt);
      validateSaveState(draft);
      persist(draft);

      currentState = draft;
      emit({
        type: "transaction_committed",
        label,
        revision: draft.revision,
      });

      return deepFreeze({
        state: deepClone(currentState),
        result: deepClone(result),
      });
    } catch (error) {
      emit({
        type: "transaction_rolled_back",
        label,
        error,
      });
      if (error instanceof SaveError) {
        throw error;
      }
      throw new SaveTransactionError(label, error);
    }
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      throw new TypeError("Listener must be a function.");
    }
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  return Object.freeze({
    hasSave,
    createNewGame,
    load,
    save,
    deleteSave,
    getSnapshot,
    transact,
    subscribe,

    addResources(delta) {
      return transact("resources_changed", (draft) =>
        applyResourceDeltaToDraft(draft, delta),
      );
    },

    addCompanyExp(gainedExp, options) {
      return transact("company_exp_added", (draft) =>
        addCompanyExpToDraft(draft, gainedExp, options),
      );
    },

    advanceWeeks(amount = 1, options = {}) {
      return transact("game_week_advanced", (draft) =>
        advanceWeeksToDraft(draft, amount, {
          ...options,
          clock,
        }),
      );
    },

    grantWeeklyBonus(options = {}) {
      return transact("weekly_bonus_granted", (draft) =>
        grantWeeklyBonusToDraft(draft, {
          ...options,
          grantedAt: nowIso(clock),
        }),
      );
    },

    applyTournamentResult(result, options = {}) {
      return transact("tournament_result_applied", (draft) =>
        applyTournamentResultToDraft(draft, result, {
          ...options,
          clock,
        }),
      );
    },
  });
}
