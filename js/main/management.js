/**
 * MOB BR company-management feature.
 *
 * Persistent changes are performed only against a state.js transaction draft.
 * Tournament runtime data is never mutated here.
 */

import {
  TRAINING_POINT_IDS,
  advanceGameWeek,
  getCompanyRankData,
  getTournamentEventsForDate,
} from "../../data/game-data.js";
import {
  TRAINING_PROGRAMS,
  calculateBadgeTrainingBonusRate,
  calculateWeeklyTraining,
} from "../../data/training-data.js";
import {
  BADGE_PACKS,
  CARD_PACKS,
  CONSUMABLE_ITEMS,
  WEAPON_SKIN_GACHA_RULES,
  WEAPON_SKINS,
  getBadgePack,
  getCardPack,
  getItem,
  getWeaponSkin,
  isCardPackUnlocked,
} from "../../data/shop-data.js";
import {
  COACH_RULES,
  STRATEGY_MEETING_RULES,
  calculateCoachTeamPoints,
  getCoachRankData,
  getStrategyMeetingProbabilities,
  nextCoachRank,
} from "../../data/coach-data.js";
import {
  STRATEGIES,
  STRATEGY_RANKS,
  getStrategiesByRank,
  getStrategy,
} from "../../data/strategy-data.js";
import {
  BADGE_COLLECTION,
  CARD_COLLECTION,
  COLLECTION_DUPLICATE_RULES,
  ROOM_MASTER,
  ROOM_PLACEMENT_RULES,
  calculateCollectionBonusRate,
  getBadgesForTier,
  getCardsForTeamIds,
  getCollectionCompletion,
  getCollectionEntry,
  getRoomMaster,
} from "../../data/collection-data.js";
import {
  advanceWeeksToDraft,
  applyResourceDeltaToDraft,
} from "./state.js";

export const MANAGEMENT_FEATURE_VERSION =
  "mobbr-management-feature-0.6.1";

const CURRENCY_IDS = Object.freeze(["coin", "diamond", "ruby"]);
const COLLECTION_HISTORY_LIMIT = 200;
const ROOM_EPSILON = 0.001;

const MANAGEMENT_VIEW_STATE = {
  shopCategory: null,
  collectionFile: null,
  selectedPackType: null,
  selectedPackId: null,
  trainingSelections: {},
};

const SHOP_CATEGORY_DEFINITIONS = Object.freeze([
  { id: "item", label: "アイテム", icon: "icon/item.png", dialogue: "大会用アイテムです。必要な数をまとめて購入できます。" },
  { id: "card", label: "カード", icon: "icon/card.png", dialogue: "カードパックです。解放済み商品を複数まとめて購入できます。" },
  { id: "skin", label: "スキン", icon: "menu/gacha.png", dialogue: "武器スキンです。未所持スキンだけが抽選対象です。" },
  { id: "good", label: "GOOD", icon: "icon/bagi.png", dialogue: "バッジパックなどの大会記念品です。大会報酬で入手できます。" },
]);

function tournamentQualificationNeeded(snapshot, event) {
  const history = snapshot.tournament?.history ?? [];
  if (history.some((entry) => entry.tournamentId === event.tournamentId)) {
    return false;
  }
  const type = event.tournamentType;
  if (type === "local") return true;
  const qualifiedTypes = new Set(
    history
      .filter((entry) => entry.qualified === true || entry.status === "qualified")
      .map((entry) => entry.nextStageId)
      .filter(Boolean),
  );
  if (qualifiedTypes.has(type)) return true;
  if (type === "national") {
    return history.some((entry) =>
      entry.tournamentType === "local" &&
      Number.isInteger(entry.finalPlace) &&
      entry.finalPlace <= 10
    );
  }
  if (type === "world_qualifier" || type === "world_last_chance") {
    return history.some((entry) =>
      entry.tournamentType === "national" && entry.qualified === true
    );
  }
  if (type === "world_final") {
    return history.some((entry) =>
      ["world_qualifier", "world_last_chance"].includes(entry.tournamentType) &&
      entry.qualified === true
    );
  }
  if (type === "championship") {
    return history.some((entry) =>
      entry.tournamentType === "world_final" &&
      Number.isInteger(entry.finalPlace) &&
      entry.finalPlace <= 20
    );
  }
  return false;
}

export function getTournamentWeekStatus(snapshot) {
  const events = getTournamentEventsForDate(snapshot.gameDate);
  const details = events.map((event) => ({
    event,
    participationRequired: tournamentQualificationNeeded(snapshot, event),
  }));
  return {
    hasTournament: details.length > 0,
    trainingBlocked: details.some((detail) => detail.participationRequired),
    details,
  };
}

function deepClone(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function assertDraft(draft) {
  if (!draft || typeof draft !== "object") {
    throw new TypeError("Draft state must be an object.");
  }
}

function assertRandom(random) {
  if (typeof random !== "function") {
    throw new TypeError("Random source must be a function.");
  }
  return random;
}

function randomIndex(length, random) {
  if (!Number.isInteger(length) || length < 1) {
    throw new RangeError("Random pool must contain at least one entry.");
  }
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    throw new RangeError("Random source must return a value from 0 to 1.");
  }
  return Math.floor(value * length);
}

function chooseUniform(entries, random) {
  return entries[randomIndex(entries.length, random)];
}

function chooseWeighted(entries, weightOf, random) {
  const weighted = entries.map((entry, index) => {
    const weight = weightOf(entry, index);
    if (!Number.isFinite(weight) || weight <= 0) {
      throw new RangeError("All random weights must be positive.");
    }
    return { entry, weight };
  });
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor < 0) {
      return item.entry;
    }
  }
  return weighted.at(-1).entry;
}

function ensureObject(parent, key) {
  if (!parent[key] || typeof parent[key] !== "object" || Array.isArray(parent[key])) {
    parent[key] = {};
  }
  return parent[key];
}

function ensureArray(parent, key) {
  if (!Array.isArray(parent[key])) {
    parent[key] = [];
  }
  return parent[key];
}

function createEmptyPointPool() {
  return Object.fromEntries(TRAINING_POINT_IDS.map((pointId) => [pointId, 0]));
}

function ensurePlayerTrainingPointsToDraft(draft) {
  draft.playerTrainingPoints ??= Object.fromEntries(
    draft.playerTeam.members.map((player) => [player.playerId, createEmptyPointPool()]),
  );
  for (const player of draft.playerTeam.members) {
    draft.playerTrainingPoints[player.playerId] ??= createEmptyPointPool();
  }
  return draft.playerTrainingPoints;
}

export function calculateBagCapacity(companyRankIndex) {
  if (!Number.isInteger(companyRankIndex) || companyRankIndex < 1 || companyRankIndex > 72) {
    throw new RangeError("Company rank index must be from 1 to 72.");
  }
  if (companyRankIndex <= 18) return 5;
  if (companyRankIndex <= 27) return 6;
  if (companyRankIndex <= 36) return 7;
  if (companyRankIndex <= 45) return 8;
  if (companyRankIndex <= 54) return 9;
  return 10;
}

export function getCardPackUnlockProgress(snapshot) {
  const bestPlacements = {
    national: null,
    world_final: null,
  };
  for (const entry of snapshot.tournament?.history ?? []) {
    const type = String(entry.tournamentType ?? "").toLowerCase();
    const place = entry.finalPlace;
    if (!Number.isInteger(place) || place < 1) {
      continue;
    }
    if (type.includes("national")) {
      bestPlacements.national =
        bestPlacements.national === null
          ? place
          : Math.min(bestPlacements.national, place);
    }
    if (type.includes("world") && type.includes("final")) {
      bestPlacements.world_final =
        bestPlacements.world_final === null
          ? place
          : Math.min(bestPlacements.world_final, place);
    }
  }
  return { bestPlacements };
}

function syncCollectionBonusesToDraft(draft) {
  draft.collectionBonuses = draft.collectionBonuses ?? {};
  draft.collectionBonuses.weeklyCoinRate =
    calculateCollectionBonusRate(draft.collections.cards);
  draft.collectionBonuses.trainingPointRate =
    calculateCollectionBonusRate(draft.collections.badges);
}

export function syncBagCapacityToDraft(draft) {
  assertDraft(draft);
  const carryBag = draft.inventory.carryBag;
  const capacity = calculateBagCapacity(draft.company.rankIndex);
  carryBag.capacity = capacity;
  while (carryBag.slots.length < capacity) {
    carryBag.slots.push(null);
  }
  if (carryBag.slots.length > capacity) {
    carryBag.slots.length = capacity;
  }
  return capacity;
}

export function ensureManagementStateToDraft(draft) {
  assertDraft(draft);
  draft.records.trainingCompleted ??= 0;
  draft.records.strategyMeetings ??= 0;
  draft.records.cardPacksOpened ??= 0;
  draft.records.badgePacksOpened ??= 0;
  draft.records.weaponSkinGachaDraws ??= 0;

  draft.collections.openHistory =
    Array.isArray(draft.collections.openHistory)
      ? draft.collections.openHistory
      : [];
  draft.collections.conversionTotals =
    draft.collections.conversionTotals ?? {
      coin: 0,
      diamond: 0,
      ruby: 0,
    };
  draft.collections.roomLayouts =
    draft.collections.roomLayouts ?? {};
  for (const roomId of draft.company.unlockedRoomIds ?? ["room01"]) {
    if (!Array.isArray(draft.collections.roomLayouts[roomId])) {
      draft.collections.roomLayouts[roomId] = [];
    }
  }

  syncBagCapacityToDraft(draft);
  syncCollectionBonusesToDraft(draft);
  return draft;
}

export function executeTrainingToDraft(
  draft,
  assignments,
  { clock = () => new Date() } = {},
) {
  assertDraft(draft);
  ensureManagementStateToDraft(draft);

  if (
    draft.tournament.activeEntryId !== null ||
    draft.tournament.resumeData !== null
  ) {
    throw new RangeError("未完了の大会があるためトレーニングできません。");
  }
  const tournamentWeek = getTournamentWeekStatus(draft);
  if (tournamentWeek.trainingBlocked) {
    const names = tournamentWeek.details
      .filter((detail) => detail.participationRequired)
      .map((detail) => detail.event.stageName)
      .join(" / ");
    throw new RangeError(`今週は出場予定大会（${names}）があるためトレーニングできません。`);
  }

  const badgeBonusRate =
    draft.collectionBonuses.trainingPointRate ??
    calculateBadgeTrainingBonusRate(
      Object.values(draft.collections.badges ?? {}),
    );
  const result = calculateWeeklyTraining(assignments, badgeBonusRate);

  const playerPointPools = ensurePlayerTrainingPointsToDraft(draft);
  for (const memberResult of result.memberResults) {
    const pool = playerPointPools[memberResult.playerId];
    for (const pointId of TRAINING_POINT_IDS) {
      pool[pointId] += memberResult.gain[pointId];
    }
  }
  draft.records.trainingCompleted += 1;

  for (const detail of tournamentWeek.details) {
    const event = detail.event;
    if (draft.tournament.history.some((entry) => entry.tournamentId === event.tournamentId)) {
      continue;
    }
    draft.tournament.history.push({
      tournamentId: event.tournamentId,
      tournamentType: event.tournamentType,
      stageName: event.stageName,
      finalPlace: null,
      qualified: false,
      status: "not_entered",
      summary: `今週は${event.stageName}が開催されました。出場予定はありませんでした。`,
      rewards: { coin: 0, diamond: 0, ruby: 0, companyExp: 0 },
      rankings: [],
      completedAt: clock().toISOString(),
    });
  }
  const weekAdvance = advanceWeeksToDraft(draft, 1, {
    grantWeeklyBonus: true,
    clock,
  });

  return {
    ...deepClone(result),
    weekAdvance,
    trainingCompleted: draft.records.trainingCompleted,
  };
}

function subtractPrice(draft, price) {
  for (const currencyId of CURRENCY_IDS) {
    const amount = price[currencyId] ?? 0;
    if (!Number.isInteger(amount) || amount < 0) {
      throw new RangeError(`Invalid price: ${currencyId}`);
    }
    if (draft.resources[currencyId] < amount) {
      throw new RangeError(`${currencyId.toUpperCase()}が不足しています。`);
    }
  }
  applyResourceDeltaToDraft(draft, {
    coin: -(price.coin ?? 0),
    diamond: -(price.diamond ?? 0),
    ruby: -(price.ruby ?? 0),
  });
}

function addCount(record, id, quantity) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new RangeError("Quantity must be a positive integer.");
  }
  record[id] = (record[id] ?? 0) + quantity;
}

export function purchaseConsumableToDraft(
  draft,
  itemId,
  quantity = 1,
) {
  assertDraft(draft);
  ensureManagementStateToDraft(draft);
  const item = getItem(itemId);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new RangeError("購入数は1～99にしてください。");
  }

  const totalPrice = Object.fromEntries(
    CURRENCY_IDS.map((currencyId) => [
      currencyId,
      (item.price[currencyId] ?? 0) * quantity,
    ]),
  );
  subtractPrice(draft, totalPrice);
  addCount(draft.inventory.items, itemId, quantity);

  return {
    itemId,
    name: item.name,
    quantity,
    totalPrice,
    ownedQuantity: draft.inventory.items[itemId],
  };
}

export function purchaseCardPackToDraft(
  draft,
  packId,
  quantity = 1,
) {
  assertDraft(draft);
  ensureManagementStateToDraft(draft);
  const pack = getCardPack(packId);
  if (
    !isCardPackUnlocked(packId, getCardPackUnlockProgress(draft))
  ) {
    throw new RangeError("このカードパックはまだ解放されていません。");
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw new RangeError("購入数は1～99にしてください。");
  }

  const totalPrice = Object.fromEntries(
    CURRENCY_IDS.map((currencyId) => [
      currencyId,
      (pack.price[currencyId] ?? 0) * quantity,
    ]),
  );
  subtractPrice(draft, totalPrice);
  addCount(draft.inventory.cardPacks, packId, quantity);

  return {
    packId,
    name: pack.name,
    quantity,
    totalPrice,
    ownedQuantity: draft.inventory.cardPacks[packId],
  };
}

function assignedItemCount(slots, itemId, ignoreIndex = -1) {
  return slots.reduce(
    (count, slotItemId, index) =>
      index !== ignoreIndex && slotItemId === itemId
        ? count + 1
        : count,
    0,
  );
}

export function setCarryBagSlotToDraft(
  draft,
  slotIndex,
  itemIdOrNull,
) {
  assertDraft(draft);
  ensureManagementStateToDraft(draft);
  const bag = draft.inventory.carryBag;

  if (
    !Number.isInteger(slotIndex) ||
    slotIndex < 0 ||
    slotIndex >= bag.capacity
  ) {
    throw new RangeError("バッグスロットが不正です。");
  }

  if (itemIdOrNull === null || itemIdOrNull === "") {
    bag.slots[slotIndex] = null;
    return { slotIndex, itemId: null };
  }

  getItem(itemIdOrNull);
  const owned = draft.inventory.items[itemIdOrNull] ?? 0;
  const alreadyAssigned = assignedItemCount(
    bag.slots,
    itemIdOrNull,
    slotIndex,
  );
  if (owned <= alreadyAssigned) {
    throw new RangeError("所持数を超えてバッグへ設定できません。");
  }

  bag.slots[slotIndex] = itemIdOrNull;
  return { slotIndex, itemId: itemIdOrNull };
}

function acquireCollectionEntry(
  draft,
  masterEntry,
  { clock = () => new Date() } = {},
) {
  const record =
    masterEntry.category === "card"
      ? draft.collections.cards
      : draft.collections.badges;
  const timestamp = clock().toISOString();
  const current = record[masterEntry.collectionId];

  if (!current || current.owned !== true) {
    record[masterEntry.collectionId] = {
      owned: true,
      level: 0,
      copies: 1,
      conversions: 0,
      firstAcquiredAt: timestamp,
      lastAcquiredAt: timestamp,
    };
    return {
      resultType: "NEW",
      collectionId: masterEntry.collectionId,
      level: 0,
      conversion: null,
    };
  }

  current.copies = (current.copies ?? 1) + 1;
  current.lastAcquiredAt = timestamp;
  current.level = Number.isInteger(current.level) ? current.level : 0;
  current.conversions = Number.isInteger(current.conversions)
    ? current.conversions
    : 0;

  if (current.level < COLLECTION_DUPLICATE_RULES.maximumLevel) {
    current.level += 1;
    return {
      resultType: "POWER_UP",
      collectionId: masterEntry.collectionId,
      level: current.level,
      conversion: null,
    };
  }

  current.conversions += 1;
  const conversion =
    COLLECTION_DUPLICATE_RULES.maxDuplicateConversion;
  applyResourceDeltaToDraft(draft, conversion);
  for (const currencyId of CURRENCY_IDS) {
    draft.collections.conversionTotals[currencyId] +=
      conversion[currencyId] ?? 0;
  }
  return {
    resultType: "MAX_CONVERT",
    collectionId: masterEntry.collectionId,
    level: current.level,
    conversion: deepClone(conversion),
  };
}

function appendOpenHistory(draft, entry) {
  draft.collections.openHistory.push(entry);
  if (
    draft.collections.openHistory.length >
    COLLECTION_HISTORY_LIMIT
  ) {
    draft.collections.openHistory.splice(
      0,
      draft.collections.openHistory.length -
        COLLECTION_HISTORY_LIMIT,
    );
  }
}

function summarizeOpenResults(results) {
  return {
    newCount: results.filter(
      (result) => result.resultType === "NEW",
    ).length,
    powerUpCount: results.filter(
      (result) => result.resultType === "POWER_UP",
    ).length,
    convertCount: results.filter(
      (result) => result.resultType === "MAX_CONVERT",
    ).length,
  };
}

export function openCardPacksToDraft(
  draft,
  packId,
  mode = "one",
  {
    random = Math.random,
    clock = () => new Date(),
  } = {},
) {
  assertDraft(draft);
  ensureManagementStateToDraft(draft);
  assertRandom(random);
  const pack = getCardPack(packId);
  const owned = draft.inventory.cardPacks[packId] ?? 0;
  const count = mode === "all"
    ? owned
    : mode === "leave_one"
      ? Math.max(0, owned - 1)
      : 1;

  if (!["one", "leave_one", "all"].includes(mode)) {
    throw new RangeError("開封モードが不正です。");
  }
  if (owned < count || count < 1) {
    throw new RangeError("開封できるカードパックがありません。");
  }

  const pool = getCardsForTeamIds(pack.teamIds);
  const results = [];
  for (let index = 0; index < count; index += 1) {
    const card = chooseUniform(pool, random);
    const acquisition = acquireCollectionEntry(draft, card, {
      clock,
    });
    results.push({
      ...acquisition,
      master: card,
    });
  }

  draft.inventory.cardPacks[packId] -= count;
  if (draft.inventory.cardPacks[packId] === 0) {
    delete draft.inventory.cardPacks[packId];
  }
  draft.records.cardPacksOpened += count;
  syncCollectionBonusesToDraft(draft);

  const summary = summarizeOpenResults(results);
  appendOpenHistory(draft, {
    type: "card",
    packId,
    count,
    summary,
    openedAt: clock().toISOString(),
  });

  return {
    type: "card",
    packId,
    packName: pack.name,
    count,
    results,
    summary,
    weeklyCoinRate:
      draft.collectionBonuses.weeklyCoinRate,
  };
}

export function openBadgePacksToDraft(
  draft,
  packId,
  mode = "one",
  {
    random = Math.random,
    clock = () => new Date(),
  } = {},
) {
  assertDraft(draft);
  ensureManagementStateToDraft(draft);
  assertRandom(random);
  const pack = getBadgePack(packId);
  const owned = draft.inventory.badgePacks[packId] ?? 0;
  const count = mode === "all"
    ? owned
    : mode === "leave_one"
      ? Math.max(0, owned - 1)
      : 1;

  if (!["one", "leave_one", "all"].includes(mode)) {
    throw new RangeError("開封モードが不正です。");
  }
  if (owned < count || count < 1) {
    throw new RangeError("開封できるバッジパックがありません。");
  }

  const pool = getBadgesForTier(pack.tier);
  const results = [];
  for (let index = 0; index < count; index += 1) {
    const badge = chooseUniform(pool, random);
    const acquisition = acquireCollectionEntry(draft, badge, {
      clock,
    });
    results.push({
      ...acquisition,
      master: badge,
    });
  }

  draft.inventory.badgePacks[packId] -= count;
  if (draft.inventory.badgePacks[packId] === 0) {
    delete draft.inventory.badgePacks[packId];
  }
  draft.records.badgePacksOpened += count;
  syncCollectionBonusesToDraft(draft);

  const summary = summarizeOpenResults(results);
  appendOpenHistory(draft, {
    type: "badge",
    packId,
    count,
    summary,
    openedAt: clock().toISOString(),
  });

  return {
    type: "badge",
    packId,
    packName: pack.name,
    count,
    results,
    summary,
    trainingPointRate:
      draft.collectionBonuses.trainingPointRate,
  };
}

export function performWeaponSkinGachaToDraft(
  draft,
  { random = Math.random } = {},
) {
  assertDraft(draft);
  ensureManagementStateToDraft(draft);
  assertRandom(random);
  const pool = WEAPON_SKINS.filter(
    (skin) =>
      skin.source === "gacha" &&
      draft.inventory.weaponSkins?.[skin.skinId] !== true,
  );
  if (pool.length === 0) {
    throw new RangeError("武器スキンをすべて所持しています。");
  }

  subtractPrice(draft, WEAPON_SKIN_GACHA_RULES.price);

  // Exact weights are not fixed in the source specification.
  // This provisional model gives lower-numbered skins a larger weight.
  const selected = chooseWeighted(
    pool,
    (_skin, index) => pool.length - index,
    random,
  );
  draft.inventory.weaponSkins[selected.skinId] = true;
  draft.records.weaponSkinGachaDraws += 1;

  return {
    skinId: selected.skinId,
    name: selected.name,
    image: selected.image,
    remainingPoolCount: pool.length - 1,
    probabilityModel:
      "lower_number_linear_weight_provisional",
  };
}

function chooseStrategyRank(probabilities, random) {
  const roll = random() * 100;
  let cumulative = 0;
  for (const rank of ["C", "B", "A", "S", "SS"]) {
    cumulative += probabilities[rank];
    if (roll < cumulative) {
      return rank;
    }
  }
  return "SS";
}

export function performStrategyMeetingToDraft(
  draft,
  { random = Math.random } = {},
) {
  assertDraft(draft);
  ensureManagementStateToDraft(draft);
  assertRandom(random);
  subtractPrice(draft, STRATEGY_MEETING_RULES.cost);

  const totalCoachPoints = calculateCoachTeamPoints(draft.coaches);
  const probabilities =
    getStrategyMeetingProbabilities(totalCoachPoints);
  const selectedRank = chooseStrategyRank(
    probabilities,
    random,
  );
  const candidates = getStrategiesByRank(selectedRank);
  const strategy = chooseUniform(candidates, random);
  const previousQuantity =
    draft.inventory.strategies[strategy.id] ?? 0;
  draft.inventory.strategies[strategy.id] =
    previousQuantity + 1;

  const coachResults = draft.coaches.map((coach) => {
    const rankData = getCoachRankData(coach.rank);
    const success =
      !rankData.isMax &&
      random() < rankData.rankUpChance;
    const previousRank = coach.rank;
    if (success) {
      coach.rank = nextCoachRank(coach.rank).rank;
    }
    return {
      coachId: coach.coachId,
      previousRank,
      currentRank: coach.rank,
      success,
      chance: rankData.rankUpChance,
    };
  });
  draft.records.strategyMeetings += 1;

  return {
    totalCoachPoints,
    probabilities,
    selectedRank,
    strategyId: strategy.id,
    strategyName: strategy.name,
    acquisitionType:
      previousQuantity === 0 ? "NEW" : "DUPLICATE",
    quantity: draft.inventory.strategies[strategy.id],
    coachResults,
  };
}

export function hireCoachToDraft(draft, candidate) {
  assertDraft(draft);
  ensureManagementStateToDraft(draft);
  if (
    draft.company.rankIndex <
    COACH_RULES.scoutUnlockCompanyRankIndex
  ) {
    throw new RangeError("コーチスカウトは企業ランクF5で解放されます。");
  }
  if (draft.coaches.length >= COACH_RULES.maximumCoachCount) {
    throw new RangeError("コーチ在籍数が上限に達しています。");
  }
  if (!candidate || typeof candidate !== "object") {
    throw new TypeError("コーチ候補データが必要です。");
  }
  for (const field of ["coachId", "name", "image", "rank", "price"]) {
    if (candidate[field] === undefined || candidate[field] === null) {
      throw new RangeError(`コーチ候補の${field}が未設定です。`);
    }
  }
  if (
    draft.coaches.some(
      (coach) => coach.coachId === candidate.coachId,
    )
  ) {
    throw new RangeError("このコーチはすでに在籍しています。");
  }
  getCoachRankData(candidate.rank);
  subtractPrice(draft, candidate.price);
  draft.coaches.push({
    coachId: candidate.coachId,
    name: candidate.name,
    image: candidate.image,
    rank: candidate.rank,
    source: "scout",
  });
  return deepClone(draft.coaches.at(-1));
}

function getRoomDisplayItem(snapshot, itemRef) {
  if (itemRef.kind === "collection") {
    const master = getCollectionEntry(itemRef.id);
    if (!master) return null;
    const record =
      master.category === "card"
        ? snapshot.collections.cards
        : snapshot.collections.badges;
    if (record?.[master.collectionId]?.owned !== true) {
      return null;
    }
    return {
      itemRef,
      name: master.name,
      image: master.image,
      roomType: master.roomType,
    };
  }

  if (itemRef.kind === "cardPack") {
    const pack = CARD_PACKS.find((entry) => entry.packId === itemRef.id);
    if (!pack || (snapshot.inventory.cardPacks[itemRef.id] ?? 0) < 1) {
      return null;
    }
    return {
      itemRef,
      name: pack.name,
      image: pack.image,
      roomType: "Card Pack",
    };
  }

  if (itemRef.kind === "badgePack") {
    const pack = BADGE_PACKS.find((entry) => entry.packId === itemRef.id);
    if (!pack || (snapshot.inventory.badgePacks[itemRef.id] ?? 0) < 1) {
      return null;
    }
    return {
      itemRef,
      name: pack.name,
      image: pack.image,
      roomType: "Badge Pack",
    };
  }

  return null;
}

export function getRoomAvailableItems(snapshot) {
  const entries = [];
  for (const master of [...CARD_COLLECTION, ...BADGE_COLLECTION]) {
    const record =
      master.category === "card"
        ? snapshot.collections.cards
        : snapshot.collections.badges;
    if (record?.[master.collectionId]?.owned === true) {
      entries.push({
        itemRef: {
          kind: "collection",
          id: master.collectionId,
        },
        name: master.name,
        image: master.image,
        roomType: master.roomType,
      });
    }
  }
  for (const pack of CARD_PACKS) {
    if ((snapshot.inventory.cardPacks[pack.packId] ?? 0) > 0) {
      entries.push({
        itemRef: { kind: "cardPack", id: pack.packId },
        name: pack.name,
        image: pack.image,
        roomType: "Card Pack",
      });
    }
  }
  for (const pack of BADGE_PACKS) {
    if ((snapshot.inventory.badgePacks[pack.packId] ?? 0) > 0) {
      entries.push({
        itemRef: { kind: "badgePack", id: pack.packId },
        name: pack.name,
        image: pack.image,
        roomType: "Badge Pack",
      });
    }
  }
  return entries;
}

export function purchaseRoomToDraft(draft, roomId) {
  assertDraft(draft);
  ensureManagementStateToDraft(draft);
  const room = getRoomMaster(roomId);
  if (
    draft.company.unlockedRoomIds.includes(roomId)
  ) {
    throw new RangeError("この部屋は購入済みです。");
  }
  if (draft.company.rankIndex < room.unlockRankIndex) {
    throw new RangeError("企業ランクが解放条件に達していません。");
  }
  subtractPrice(draft, {
    coin: room.priceCoin,
    diamond: 0,
    ruby: 0,
  });
  draft.company.unlockedRoomIds.push(roomId);
  draft.collections.roomLayouts[roomId] = [];
  return deepClone(room);
}

export function activateRoomToDraft(draft, roomId) {
  assertDraft(draft);
  ensureManagementStateToDraft(draft);
  getRoomMaster(roomId);
  if (!draft.company.unlockedRoomIds.includes(roomId)) {
    throw new RangeError("未購入の部屋には入室できません。");
  }
  draft.company.activeRoomId = roomId;
  draft.collections.roomLayouts[roomId] ??= [];
  return { roomId };
}

export function addRoomPlacementToDraft(
  draft,
  roomId,
  itemRef,
  {
    placementId = `placement-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  } = {},
) {
  assertDraft(draft);
  ensureManagementStateToDraft(draft);
  if (!draft.company.unlockedRoomIds.includes(roomId)) {
    throw new RangeError("未購入の部屋です。");
  }
  const displayItem = getRoomDisplayItem(draft, itemRef);
  if (!displayItem) {
    throw new RangeError("ROOMへ配置できる所持品ではありません。");
  }

  const layout = draft.collections.roomLayouts[roomId] ??= [];
  if (layout.length >= ROOM_PLACEMENT_RULES.maximumPlacementsPerRoom) {
    throw new RangeError("この部屋の配置上限に達しています。");
  }

  const placement = {
    placementId,
    itemRef: deepClone(itemRef),
    name: displayItem.name,
    image: displayItem.image,
    roomType: displayItem.roomType,
    x: ROOM_PLACEMENT_RULES.defaultX,
    y: ROOM_PLACEMENT_RULES.defaultY,
    scale: ROOM_PLACEMENT_RULES.defaultScale,
    flipped: false,
    z: layout.length + 1,
  };
  layout.push(placement);
  return deepClone(placement);
}

function getRoomPlacement(draft, roomId, placementId) {
  const layout = draft.collections.roomLayouts?.[roomId];
  if (!Array.isArray(layout)) {
    throw new RangeError("ROOM配置データがありません。");
  }
  const placement = layout.find(
    (entry) => entry.placementId === placementId,
  );
  if (!placement) {
    throw new RangeError("ROOM配置アイテムが見つかりません。");
  }
  return { layout, placement };
}

export function updateRoomPlacementToDraft(
  draft,
  roomId,
  placementId,
  patch,
) {
  assertDraft(draft);
  ensureManagementStateToDraft(draft);
  const { placement } = getRoomPlacement(
    draft,
    roomId,
    placementId,
  );
  if (patch.x !== undefined) {
    placement.x = Math.min(100, Math.max(0, Number(patch.x)));
  }
  if (patch.y !== undefined) {
    placement.y = Math.min(100, Math.max(0, Number(patch.y)));
  }
  if (patch.scale !== undefined) {
    placement.scale = Math.min(
      ROOM_PLACEMENT_RULES.maximumScale,
      Math.max(
        ROOM_PLACEMENT_RULES.minimumScale,
        Number(patch.scale),
      ),
    );
  }
  if (patch.flipped !== undefined) {
    placement.flipped = patch.flipped === true;
  }
  if (patch.z !== undefined) {
    placement.z = Math.max(1, Math.round(Number(patch.z)));
  }

  for (const key of ["x", "y", "scale", "z"]) {
    if (!Number.isFinite(placement[key])) {
      throw new RangeError(`ROOM配置の${key}が不正です。`);
    }
  }
  return deepClone(placement);
}

export function bringRoomPlacementToFrontToDraft(
  draft,
  roomId,
  placementId,
) {
  const { layout, placement } = getRoomPlacement(
    draft,
    roomId,
    placementId,
  );
  placement.z =
    Math.max(0, ...layout.map((entry) => entry.z ?? 0)) + 1;
  return deepClone(placement);
}

export function removeRoomPlacementToDraft(
  draft,
  roomId,
  placementId,
) {
  const { layout } = getRoomPlacement(
    draft,
    roomId,
    placementId,
  );
  const index = layout.findIndex(
    (entry) => entry.placementId === placementId,
  );
  const [removed] = layout.splice(index, 1);
  return deepClone(removed);
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

export function formatManagementGameDate(gameDate) {
  if (
    !gameDate ||
    !Number.isInteger(gameDate.year) ||
    !Number.isInteger(gameDate.month) ||
    !Number.isInteger(gameDate.week)
  ) {
    throw new TypeError("Game date is invalid.");
  }
  return `${gameDate.year}年 ${gameDate.month}月 第${gameDate.week}週`;
}

function currencyPriceTemplate(price) {
  return CURRENCY_IDS
    .filter((id) => (price[id] ?? 0) > 0)
    .map((id) => `<span>${id.toUpperCase()} ${formatNumber(price[id])}</span>`)
    .join("");
}


function shopItemTile(item, snapshot) {
  const price = currencyPriceTemplate(item.price);
  return `
    <button
      type="button"
      class="shop-item-tile"
      data-action="inspect-shop-item"
      data-item-id="${escapeAttribute(item.itemId)}"
      aria-label="${escapeAttribute(item.name)}の詳細"
    >
      <span class="shop-item-tile__image">
        <img src="${escapeAttribute(item.image)}" alt="">
      </span>
      <strong>${escapeHtml(item.name)}</strong>
      <small>${price || "FREE"}</small>
      <em>所持 ${formatNumber(snapshot.inventory.items[item.itemId] ?? 0)}</em>
    </button>
  `;
}

function collectionLogoPath(master) {
  if (master.category === "badge") {
    return master.image;
  }
  return master.image.replace(/[ABC]\.png$/i, "D.png");
}

function collectionFilePages(entries, category) {
  const pageCount = Math.max(1, Math.ceil(entries.length / 9));
  return `
    <div class="collection-file collection-file--${category}" role="region" aria-label="${category === "card" ? "カード" : "バッジ"}ファイル">
      ${Array.from({ length: pageCount }, (_, pageIndex) => {
        const pageEntries = entries.slice(pageIndex * 9, pageIndex * 9 + 9);
        return `
          <section class="collection-file__page">
            <header><strong>${category === "card" ? "CARD FILE" : "BADGE FILE"}</strong><span>${pageIndex + 1} / ${pageCount}</span></header>
            <div class="collection-file__grid">
              ${Array.from({ length: 9 }, (_, slotIndex) => {
                const entry = pageEntries[slotIndex];
                if (!entry) return `<div class="collection-file__empty"><span>EMPTY</span></div>`;
                const { master, owned } = entry;
                const isOwned = owned?.owned === true;
                const logo = collectionLogoPath(master);
                if (category === "card") {
                  return `
                    <button type="button" class="collection-file-card collection-file-card--${escapeAttribute(master.tier)} ${isOwned ? "is-owned" : "is-locked"}" data-action="inspect-collection-entry" data-collection-id="${escapeAttribute(master.collectionId)}">
                      <span class="collection-file-card__number">No.${String(master.collectionNo).padStart(3, "0")}</span>
                      <div class="collection-file-card__shine" aria-hidden="true"></div>
                      <img class="collection-file-card__character" src="${escapeAttribute(master.image)}" alt="">
                      <img class="collection-file-card__logo" src="${escapeAttribute(logo)}" alt="">
                      <strong>${escapeHtml(isOwned ? master.name : "未獲得")}</strong>
                      <small>${isOwned ? `${escapeHtml(master.role)} / +${owned.level}` : "LOCKED"}</small>
                    </button>
                  `;
                }
                return `
                  <button type="button" class="collection-file-badge ${isOwned ? "is-owned" : "is-locked"}" data-action="inspect-collection-entry" data-collection-id="${escapeAttribute(master.collectionId)}">
                    <span class="collection-file-card__number">No.${String(master.collectionNo).padStart(3, "0")}</span>
                    <div class="collection-file-badge__ring" aria-hidden="true"></div>
                    <img src="${escapeAttribute(master.image)}" alt="">
                    <strong>${escapeHtml(isOwned ? master.teamName : "未獲得")}</strong>
                    <small>${isOwned ? `${escapeHtml(master.tier.toUpperCase())} / +${owned.level}` : "LOCKED"}</small>
                  </button>
                `;
              }).join("")}
            </div>
          </section>
        `;
      }).join("")}
    </div>
    <p class="collection-file__hint">左右へスワイプしてページをめくれます。カード／バッジをタップすると詳細を表示します。</p>
  `;
}

function packOpeningPresentation(result) {
  const previews = result.results.slice(0, 18).map((opened, index) => {
    const master = opened.master;
    const logo = master.category === "card"
      ? collectionLogoPath(master)
      : master.image;
    return `
      <article
        class="pack-reveal-card pack-reveal-card--${escapeAttribute(opened.resultType.toLowerCase())}"
        style="--reveal-index:${index}"
      >
        <div class="pack-reveal-card__flare" aria-hidden="true"></div>
        <img class="pack-reveal-card__main" src="${escapeAttribute(master.image)}" alt="">
        ${master.category === "card" ? `<img class="pack-reveal-card__logo" src="${escapeAttribute(logo)}" alt="">` : ""}
        <strong>${escapeHtml(master.name ?? master.teamName)}</strong>
        <span>${escapeHtml(opened.resultType)}</span>
      </article>
    `;
  }).join("");
  return `
    <section class="pack-opening-show">
      <div class="pack-opening-show__burst" aria-hidden="true"></div>
      <span>PACK OPEN!</span>
      <h3>${escapeHtml(result.packName)}</h3>
      <p>NEW ${result.summary.newCount} / POWER UP ${result.summary.powerUpCount} / CONVERT ${result.summary.convertCount}</p>
      <div class="pack-reveal-grid">${previews}</div>
      ${result.results.length > 18 ? `<small>ほか ${result.results.length - 18}件</small>` : ""}
    </section>
  `;
}

export function renderTrainingManagement(snapshot) {
  const bonusRate = snapshot.collectionBonuses?.trainingPointRate ?? 0;
  const tournamentWeek = getTournamentWeekStatus(snapshot);
  const notice = tournamentWeek.hasTournament
    ? `<section class="training-tournament-notice ${tournamentWeek.trainingBlocked ? "is-blocked" : "is-observer"}">
        <strong>${tournamentWeek.trainingBlocked ? "TOURNAMENT WEEK" : "TOURNAMENT NOTICE"}</strong>
        <p>${tournamentWeek.details.map((detail) => detail.participationRequired
          ? `${detail.event.stageName}へ出場予定です。この週はトレーニングできません。`
          : `${detail.event.stageName}が開催されます。出場予定はないためトレーニング可能です。`).join(" ")}</p>
      </section>`
    : "";

  for (const player of snapshot.playerTeam.members) {
    MANAGEMENT_VIEW_STATE.trainingSelections[player.playerId] ??=
      TRAINING_PROGRAMS[0].id;
  }

  return `
    ${notice}
    <section class="management-summary training-summary">
      <strong>バッジ補正 +${(bonusRate * 100).toFixed(1)}%</strong>
      <span>各選手のアイコンから練習を選択。獲得ポイントは選手ごとに保存されます。</span>
    </section>
    <form class="training-assignment-form training-stage training-stage--icons" data-form="training">
      ${snapshot.playerTeam.members.map((player, playerIndex) => {
        const selectedId = MANAGEMENT_VIEW_STATE.trainingSelections[player.playerId];
        const selected = TRAINING_PROGRAMS.find((program) => program.id === selectedId) ?? TRAINING_PROGRAMS[0];
        const pointPool = snapshot.playerTrainingPoints?.[player.playerId] ?? snapshot.trainingPoints;
        return `
          <section
            class="training-player-station"
            style="--training-index:${playerIndex}"
            data-training-station="${escapeAttribute(player.playerId)}"
          >
            <header>
              <img class="player-portrait" data-role="${escapeAttribute(player.role)}" src="${escapeAttribute(player.image)}" alt="">
              <div>
                <span>${escapeHtml(player.role)}</span>
                <strong>${escapeHtml(player.name)}</strong>
                <small>P ${pointPool.power} / T ${pointPool.tech} / M ${pointPool.mental} / S ${pointPool.shoot}</small>
              </div>
              <img
                class="training-player-station__selected"
                data-training-selected-preview
                src="${escapeAttribute(selected.image)}"
                alt="${escapeAttribute(selected.name)}"
              >
            </header>
            <input type="hidden" data-training-player="${escapeAttribute(player.playerId)}" value="${escapeAttribute(selected.id)}">
            <div class="training-program-icon-grid" role="radiogroup" aria-label="${escapeAttribute(player.name)}のトレーニング">
              ${TRAINING_PROGRAMS.map((program) => `
                <button
                  type="button"
                  class="training-program-icon ${program.id === selected.id ? "is-selected" : ""}"
                  data-action="select-training-program"
                  data-player-id="${escapeAttribute(player.playerId)}"
                  data-program-id="${escapeAttribute(program.id)}"
                  aria-pressed="${program.id === selected.id ? "true" : "false"}"
                  ${tournamentWeek.trainingBlocked ? "disabled" : ""}
                >
                  <img src="${escapeAttribute(program.image)}" alt="">
                  <strong>${escapeHtml(program.name)}</strong>
                  <small>P${program.points.power} T${program.points.tech} M${program.points.mental} S${program.points.shoot}</small>
                </button>
              `).join("")}
            </div>
          </section>
        `;
      }).join("")}
      <button type="button" class="primary-button training-start-button" data-action="execute-training" ${tournamentWeek.trainingBlocked ? "disabled" : ""}>
        <span>${tournamentWeek.trainingBlocked ? "TOURNAMENT WEEK" : "TRAINING START"}</span>
        <small>${tournamentWeek.trainingBlocked ? "大会終了後に実行できます" : "選択した内容で1週間進める"}</small>
      </button>
    </form>
  `;
}

export function renderShopManagement(snapshot) {
  const unlockProgress = getCardPackUnlockProgress(snapshot);
  const category = MANAGEMENT_VIEW_STATE.shopCategory;
  const categoryDefinition = SHOP_CATEGORY_DEFINITIONS.find(
    (entry) => entry.id === category,
  );
  let categoryContent = `
    <section class="mobshop-welcome">
      <p>ロボ店員「いらっしゃいませ。商品カテゴリを選択してください。」</p>
    </section>
  `;

  if (category === "item") {
    categoryContent = `
      <section class="management-section">
        <div class="management-section__heading">
          <h2>ITEM</h2><span>アイコンをタップして数量を入力</span>
        </div>
        <div class="shop-item-grid">
          ${CONSUMABLE_ITEMS.map((item) => shopItemTile(item, snapshot)).join("")}
        </div>
      </section>
    `;
  } else if (category === "card") {
    categoryContent = `
      <section class="management-section">
        <div class="management-section__heading"><h2>CARD PACK</h2><span>複数購入対応</span></div>
        <div class="shop-category-product-grid">
          ${CARD_PACKS.map((pack) => {
            const unlocked = isCardPackUnlocked(pack.packId, unlockProgress);
            return `
              <button type="button" class="shop-category-product" data-action="inspect-shop-pack" data-pack-type="card" data-pack-id="${escapeAttribute(pack.packId)}" ${unlocked ? "" : "disabled"}>
                <img src="${escapeAttribute(pack.image)}" alt="">
                <strong>${escapeHtml(pack.name)}</strong>
                <small>${unlocked ? currencyPriceTemplate(pack.price) : "大会条件未達"}</small>
                <em>所持 ${formatNumber(snapshot.inventory.cardPacks[pack.packId] ?? 0)}</em>
              </button>
            `;
          }).join("")}
        </div>
      </section>
    `;
  } else if (category === "skin") {
    const remaining = WEAPON_SKINS.filter(
      (skin) => skin.source === "gacha" && snapshot.inventory.weaponSkins?.[skin.skinId] !== true,
    );
    categoryContent = `
      <section class="management-section">
        <div class="management-section__heading"><h2>WEAPON SKIN</h2><span>未所持 ${remaining.length}</span></div>
        <div class="shop-category-product-grid">
          ${WEAPON_SKINS.map((skin) => `
            <article class="shop-category-product ${snapshot.inventory.weaponSkins?.[skin.skinId] ? "is-owned" : "is-locked"}">
              <img src="${escapeAttribute(skin.image)}" alt="">
              <strong>${escapeHtml(skin.name)}</strong>
              <small>${snapshot.inventory.weaponSkins?.[skin.skinId] ? "OWNED" : skin.source === "initial" ? "INITIAL" : "GACHA"}</small>
            </article>
          `).join("")}
        </div>
        <button type="button" class="primary-button mobshop-gacha-button" data-action="weapon-skin-gacha" ${remaining.length ? "" : "disabled"}>50 DIAMOND / 3 RUBYで抽選</button>
      </section>
    `;
  } else if (category === "good") {
    categoryContent = `
      <section class="management-section">
        <div class="management-section__heading"><h2>GOOD</h2><span>大会記念品</span></div>
        <div class="shop-category-product-grid">
          ${BADGE_PACKS.map((pack) => `
            <article class="shop-category-product">
              <img src="${escapeAttribute(pack.image)}" alt="">
              <strong>${escapeHtml(pack.name)}</strong>
              <small>大会報酬限定</small>
              <em>所持 ${formatNumber(snapshot.inventory.badgePacks[pack.packId] ?? 0)}</em>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  return `
    <section class="mobshop-popup" style="--mobshop-bg:url('back/mobshop.png')">
      <div class="mobshop-clerk" aria-label="ロボ店員">
        <div class="mobshop-clerk__head"><i></i><i></i><b></b></div>
        <p>${escapeHtml(categoryDefinition?.dialogue ?? "いらっしゃいませ。4つのカテゴリから選んでください。")}</p>
      </div>
      <nav class="mobshop-category-grid" aria-label="ショップカテゴリ">
        ${SHOP_CATEGORY_DEFINITIONS.map((entry) => `
          <button type="button" class="${category === entry.id ? "is-active" : ""}" data-action="select-shop-category" data-shop-category="${escapeAttribute(entry.id)}">
            <img src="${escapeAttribute(entry.icon)}" alt="">
            <span>${escapeHtml(entry.label)}</span>
          </button>
        `).join("")}
      </nav>
      <div class="mobshop-content">${categoryContent}</div>
    </section>
  `;
}

export function renderItemBagManagement(snapshot) {
  const capacity = calculateBagCapacity(snapshot.company.rankIndex);
  const ownedItems = CONSUMABLE_ITEMS.filter(
    (item) => (snapshot.inventory.items[item.itemId] ?? 0) > 0,
  );

  return `
    <section class="management-summary">
      <strong>バッグ ${capacity}枠</strong>
      <span>バッグ内のアイテムだけ大会へ持ち込みます</span>
    </section>
    <section class="content-panel bag-editor">
      ${Array.from({ length: capacity }, (_, index) => `
        <label class="bag-slot">
          <span>SLOT ${index + 1}</span>
          <select data-bag-slot="${index}">
            <option value="">空き</option>
            ${ownedItems.map((item) => `
              <option
                value="${escapeAttribute(item.itemId)}"
                ${snapshot.inventory.carryBag.slots[index] === item.itemId ? "selected" : ""}
              >
                ${escapeHtml(item.name)} ×${snapshot.inventory.items[item.itemId]}
              </option>
            `).join("")}
          </select>
        </label>
      `).join("")}
      <button type="button" class="primary-button" data-action="save-bag">
        バッグ編成を保存
      </button>
    </section>
    <section class="management-card-grid">
      ${
        ownedItems.length
          ? ownedItems.map((item) => `
              <article class="inventory-card">
                <img src="${escapeAttribute(item.image)}" alt="">
                <div>
                  <h3>${escapeHtml(item.name)}</h3>
                  <p>${escapeHtml(item.description)}</p>
                </div>
                <strong>×${snapshot.inventory.items[item.itemId]}</strong>
              </article>
            `).join("")
          : `<p class="empty-state">所持アイテムはありません。</p>`
      }
    </section>
  `;
}

export function renderCoachManagement(snapshot) {
  const totalPoints = calculateCoachTeamPoints(snapshot.coaches);
  const probabilities =
    getStrategyMeetingProbabilities(totalPoints);
  return `
    <section class="management-summary">
      <strong>COACH PT ${formatNumber(totalPoints)}</strong>
      <span>在籍 ${snapshot.coaches.length} / ${COACH_RULES.maximumCoachCount}</span>
    </section>
    <section class="management-card-grid">
      ${snapshot.coaches.map((coach) => {
        const rankData = getCoachRankData(coach.rank);
        return `
          <article class="coach-card">
            <img src="${escapeAttribute(coach.image)}" alt="">
            <div>
              <h3>${escapeHtml(coach.name ?? "初期コーチ")}</h3>
              <p>RANK ${escapeHtml(coach.rank)} / ${rankData.points} PT</p>
              <small>
                ランクアップ率 ${(rankData.rankUpChance * 100).toFixed(2)}%
              </small>
            </div>
          </article>
        `;
      }).join("")}
    </section>
    <section class="content-panel strategy-meeting-panel">
      <h2>作戦会議</h2>
      <div class="strategy-probabilities">
        ${["C", "B", "A", "S", "SS"].map((rank) => `
          <span>${rank} ${probabilities[rank].toFixed(1)}%</span>
        `).join("")}
      </div>
      <div class="cost-tags">
        ${currencyPriceTemplate(STRATEGY_MEETING_RULES.cost)}
      </div>
      <button
        type="button"
        class="primary-button"
        data-action="strategy-meeting"
      >
        作戦会議を行う
      </button>
    </section>
    <section class="content-panel">
      <h2>所持作戦</h2>
      <div class="strategy-inventory">
        ${STRATEGIES.map((strategy) => `
          <div>
            <img src="${escapeAttribute(strategy.icon)}" alt="">
            <span>${escapeHtml(strategy.id)} ${escapeHtml(strategy.name)}</span>
            <strong>
              ${strategy.rank === "D"
                ? "∞"
                : snapshot.inventory.strategies[strategy.id] ?? 0}
            </strong>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

export function renderScoutManagement(snapshot) {
  const unlocked =
    snapshot.company.rankIndex >=
    COACH_RULES.scoutUnlockCompanyRankIndex;
  return `
    <section class="content-panel placeholder-panel">
      <img class="placeholder-panel__icon" src="menu/scout.png" alt="">
      <h1 class="placeholder-panel__title">COACH SCOUT</h1>
      <p class="placeholder-panel__text">
        ${
          unlocked
            ? "企業ランク条件は達成済みです。"
            : `企業ランクF5で解放されます。現在 ${escapeHtml(snapshot.company.rank)}`
        }
      </p>
      <p class="placeholder-panel__text">
        追加コーチの名前・画像・雇用価格・初期ランクは仕様未確定のため、
        候補データを捏造せず未登録としています。
      </p>
      <p class="placeholder-panel__text">
        スカウト対象はコーチのみで、選手スカウトはありません。
      </p>
    </section>
  `;
}

function packOpenButtons(type, packs, inventory) {
  return packs.map((pack) => {
    const count = inventory[pack.packId] ?? 0;
    const selected = MANAGEMENT_VIEW_STATE.selectedPackType === type && MANAGEMENT_VIEW_STATE.selectedPackId === pack.packId;
    return `
      <button type="button" class="pack-icon-tile ${selected ? "is-selected" : ""}" data-action="select-collection-pack" data-pack-type="${type}" data-pack-id="${escapeAttribute(pack.packId)}">
        <img src="${escapeAttribute(pack.image)}" alt="">
        <strong>${escapeHtml(pack.name)}</strong>
        <span>×${formatNumber(count)}</span>
      </button>
    `;
  }).join("");
}

function allCollectionEntries(snapshot, category) {
  const master = category === "card" ? CARD_COLLECTION : BADGE_COLLECTION;
  const record = category === "card" ? snapshot.collections.cards : snapshot.collections.badges;
  return master.map((entry) => ({ master: entry, owned: record?.[entry.collectionId] ?? null }));
}

function selectedPackPanel(snapshot) {
  const type = MANAGEMENT_VIEW_STATE.selectedPackType;
  const packId = MANAGEMENT_VIEW_STATE.selectedPackId;
  if (!type || !packId) return "";
  const pack = type === "card" ? getCardPack(packId) : getBadgePack(packId);
  const inventory = type === "card" ? snapshot.inventory.cardPacks : snapshot.inventory.badgePacks;
  const count = inventory[packId] ?? 0;
  return `
    <section class="selected-pack-panel">
      <img src="${escapeAttribute(pack.image)}" alt="">
      <div><span>${type.toUpperCase()} PACK</span><h3>${escapeHtml(pack.name)}</h3><p>所持 ${formatNumber(count)}</p></div>
      <div class="selected-pack-panel__actions">
        <button type="button" data-action="open-${type}-pack" data-pack-id="${escapeAttribute(packId)}" data-open-mode="one" ${count >= 1 ? "" : "disabled"}>1つ開封</button>
        <button type="button" data-action="open-${type}-pack" data-pack-id="${escapeAttribute(packId)}" data-open-mode="leave_one" ${count >= 2 ? "" : "disabled"}>1つ残して全て</button>
        <button type="button" data-action="open-${type}-pack" data-pack-id="${escapeAttribute(packId)}" data-open-mode="all" ${count >= 1 ? "" : "disabled"}>全て開封</button>
      </div>
    </section>
  `;
}

export function renderCollectionManagement(snapshot) {
  const cardCompletion = getCollectionCompletion(snapshot.collections.cards, "card");
  const badgeCompletion = getCollectionCompletion(snapshot.collections.badges, "badge");
  const fileType = MANAGEMENT_VIEW_STATE.collectionFile;
  const allCards = allCollectionEntries(snapshot, "card");
  const allBadges = allCollectionEntries(snapshot, "badge");

  if (fileType === "card" || fileType === "badge") {
    return `
      <section class="collection-file-view">
        <header>
          <button type="button" class="back-button" data-action="close-collection-file">← COLLECTION</button>
          <div><img src="${fileType === "card" ? "icon/cardf.png" : "icon/bagif.png"}" alt=""><strong>${fileType === "card" ? "CARD FILE" : "BADGE FILE"}</strong></div>
        </header>
        ${collectionFilePages(fileType === "card" ? allCards : allBadges, fileType)}
      </section>
    `;
  }

  return `
    <section class="collection-file-launchers">
      <button type="button" data-action="open-collection-file" data-file-type="card">
        <img src="icon/cardf.png" alt=""><strong>CARD FILE</strong><span>${cardCompletion.ownedCount}/${cardCompletion.totalCount}</span>
      </button>
      <button type="button" data-action="open-collection-file" data-file-type="badge">
        <img src="icon/bagif.png" alt=""><strong>BADGE FILE</strong><span>${badgeCompletion.ownedCount}/${badgeCompletion.totalCount}</span>
      </button>
    </section>
    <section class="collection-completion-grid">
      <article><img src="icon/card.png" alt=""><strong>CARD ${cardCompletion.ownedCount} / ${cardCompletion.totalCount}</strong><span>週間COIN +${((snapshot.collectionBonuses.weeklyCoinRate ?? 0) * 100).toFixed(1)}%</span></article>
      <article><img src="icon/bagi.png" alt=""><strong>BADGE ${badgeCompletion.ownedCount} / ${badgeCompletion.totalCount}</strong><span>TRAINING +${((snapshot.collectionBonuses.trainingPointRate ?? 0) * 100).toFixed(1)}%</span></article>
    </section>
    <section class="management-section"><h2>カードパック</h2><div class="pack-icon-strip">${packOpenButtons("card", CARD_PACKS, snapshot.inventory.cardPacks)}</div></section>
    <section class="management-section"><h2>バッジパック</h2><div class="pack-icon-strip">${packOpenButtons("badge", BADGE_PACKS, snapshot.inventory.badgePacks)}</div></section>
    ${selectedPackPanel(snapshot)}
  `;
}

export function renderRoomManagement(snapshot) {
  const activeRoom = getRoomMaster(snapshot.company.activeRoomId);
  const layout =
    snapshot.collections.roomLayouts?.[activeRoom.roomId] ?? [];
  const availableItems = getRoomAvailableItems(snapshot);

  return `
    <section class="room-list">
      ${ROOM_MASTER.map((room) => {
        const owned = snapshot.company.unlockedRoomIds.includes(room.roomId);
        const unlocked =
          snapshot.company.rankIndex >= room.unlockRankIndex;
        const active =
          snapshot.company.activeRoomId === room.roomId;
        return `
          <article class="room-list-card ${active ? "is-active" : ""} ${owned ? "is-owned" : "is-locked"}">
            <div>
              <span>${escapeHtml(room.roomId)}</span>
              <h3>${escapeHtml(room.name)}</h3>
              <p>解放RANK INDEX ${room.unlockRankIndex}</p>
            </div>
            ${
              owned
                ? `
                  <button
                    type="button"
                    class="secondary-button"
                    data-action="activate-room"
                    data-room-id="${escapeAttribute(room.roomId)}"
                    ${active ? "disabled" : ""}
                  >
                    ${active ? "使用中" : "入室"}
                  </button>
                `
                : `
                  <button
                    type="button"
                    class="compact-upgrade-button"
                    data-action="purchase-room"
                    data-room-id="${escapeAttribute(room.roomId)}"
                    ${unlocked ? "" : "disabled"}
                  >
                    ${formatNumber(room.priceCoin)} COIN
                  </button>
                `
            }
          </article>
        `;
      }).join("")}
    </section>

    <section class="content-panel room-editor-controls">
      <h2>${escapeHtml(activeRoom.name)}</h2>
      <select id="roomItemSelect">
        <option value="">配置する所持品を選択</option>
        ${availableItems.map((item) => `
          <option
            value="${escapeAttribute(JSON.stringify(item.itemRef))}"
          >
            [${escapeHtml(item.roomType)}] ${escapeHtml(item.name)}
          </option>
        `).join("")}
      </select>
      <button
        type="button"
        class="primary-button"
        data-action="add-room-item"
        data-room-id="${escapeAttribute(activeRoom.roomId)}"
        ${availableItems.length ? "" : "disabled"}
      >
        ROOMへ配置
      </button>
    </section>

    <section
      class="room-canvas"
      data-room-canvas
      data-room-id="${escapeAttribute(activeRoom.roomId)}"
      aria-label="${escapeAttribute(activeRoom.name)}の配置画面"
    >
      ${layout
        .slice()
        .sort((left, right) => (left.z ?? 0) - (right.z ?? 0))
        .map((placement) => `
          <article
            class="room-placement"
            data-room-placement
            data-placement-id="${escapeAttribute(placement.placementId)}"
            style="
              left:${placement.x}%;
              top:${placement.y}%;
              z-index:${placement.z};
              --placement-scale:${placement.scale};
              --placement-flip:${placement.flipped ? -1 : 1};
            "
          >
            <img
              src="${escapeAttribute(placement.image)}"
              alt="${escapeAttribute(placement.name)}"
              draggable="false"
            >
            <div class="room-placement__controls">
              <button
                type="button"
                data-action="room-scale-down"
                data-room-id="${escapeAttribute(activeRoom.roomId)}"
                data-placement-id="${escapeAttribute(placement.placementId)}"
              >－</button>
              <button
                type="button"
                data-action="room-scale-up"
                data-room-id="${escapeAttribute(activeRoom.roomId)}"
                data-placement-id="${escapeAttribute(placement.placementId)}"
              >＋</button>
              <button
                type="button"
                data-action="room-flip"
                data-room-id="${escapeAttribute(activeRoom.roomId)}"
                data-placement-id="${escapeAttribute(placement.placementId)}"
              >反転</button>
              <button
                type="button"
                data-action="room-front"
                data-room-id="${escapeAttribute(activeRoom.roomId)}"
                data-placement-id="${escapeAttribute(placement.placementId)}"
              >前へ</button>
              <button
                type="button"
                data-action="room-remove"
                data-room-id="${escapeAttribute(activeRoom.roomId)}"
                data-placement-id="${escapeAttribute(placement.placementId)}"
              >収納</button>
            </div>
          </article>
        `).join("")}
      ${
        layout.length === 0
          ? `<p class="room-canvas__empty">コレクションを配置してください。</p>`
          : ""
      }
    </section>
    <p class="room-drag-note">
      配置物をドラッグして移動できます。サイズ変更・反転・前後関係も保存されます。
    </p>
  `;
}

export function renderRecordManagement(snapshot) {
  return `
    <section class="record-summary-grid">
      <article><span>大会出場</span><strong>${formatNumber(snapshot.records.tournamentsEntered)}</strong></article>
      <article><span>大会優勝</span><strong>${formatNumber(snapshot.records.tournamentWins)}</strong></article>
      <article><span>TRAINING</span><strong>${formatNumber(snapshot.records.trainingCompleted ?? 0)}</strong></article>
      <article><span>作戦会議</span><strong>${formatNumber(snapshot.records.strategyMeetings ?? 0)}</strong></article>
      <article><span>総KILL</span><strong>${formatNumber(snapshot.records.totalKills)}</strong></article>
      <article><span>総DAMAGE</span><strong>${formatNumber(snapshot.records.totalDamage)}</strong></article>
    </section>
    <section class="content-panel record-player-list">
      ${snapshot.playerTeam.members.map((player) => {
        const record = snapshot.records.memberCareer[player.playerId];
        return `
          <article>
            <img
              class="player-portrait"
              data-role="${escapeAttribute(player.role)}"
              src="${escapeAttribute(player.image)}"
              alt=""
            >
            <div>
              <h3>${escapeHtml(player.name)} / ${escapeHtml(player.role)}</h3>
              <p>
                K ${formatNumber(record.kills)} /
                A ${formatNumber(record.assists)} /
                DMG ${formatNumber(record.damage)}
              </p>
              <p>
                MATCH ${formatNumber(record.matches)} /
                ROUND ${formatNumber(record.rounds)}
              </p>
            </div>
          </article>
        `;
      }).join("")}
    </section>
  `;
}

export function renderNewsManagement(snapshot) {
  const history = [...(snapshot.tournament.history ?? [])].reverse();
  return `
    <section class="news-list">
      ${
        history.length
          ? history.map((entry) => `
              <details class="news-entry">
                <summary>
                  <span>${escapeHtml(entry.tournamentType)}</span>
                  <strong>${escapeHtml(entry.tournamentId)}</strong>
                  <em>${Number.isInteger(entry.finalPlace) ? `${entry.finalPlace}位` : "不参加"}</em>
                </summary>
                <div>
                  <p>${escapeHtml(entry.summary ?? "大会結果")}</p>
                  <p>
                    COIN ${formatNumber(entry.rewards?.coin ?? 0)} /
                    EXP ${formatNumber(entry.rewards?.companyExp ?? 0)}
                  </p>
                  ${
                    Array.isArray(entry.rankings)
                      ? `
                        <ol>
                          ${entry.rankings.slice(0, 20).map((ranking) => `
                            <li>${escapeHtml(ranking.teamName ?? ranking.teamId)} — ${ranking.place}位</li>
                          `).join("")}
                        </ol>
                      `
                      : ""
                  }
                </div>
              </details>
            `).join("")
          : `
            <section class="content-panel placeholder-panel">
              <img class="placeholder-panel__icon" src="icon/news.png" alt="">
              <h2>大会新聞はまだありません</h2>
              <p class="placeholder-panel__text">
                大会が行われるたびに結果が追加されます。
              </p>
            </section>
          `
      }
    </section>
  `;
}

export function renderManagementSection(snapshot, route) {
  switch (route) {
    case "train":
      return renderTrainingManagement(snapshot);
    case "shop":
      return renderShopManagement(snapshot);
    case "items":
      return renderItemBagManagement(snapshot);
    case "coach":
      return renderCoachManagement(snapshot);
    case "scout":
      return renderScoutManagement(snapshot);
    case "collection":
      return renderCollectionManagement(snapshot);
    case "room":
      return renderRoomManagement(snapshot);
    case "record":
      return renderRecordManagement(snapshot);
    case "news":
      return renderNewsManagement(snapshot);
    default:
      throw new RangeError(`Unsupported management route: ${route}`);
  }
}


export function createManagementController({
  stateManager,
  root,
  openConfirm,
  openAlert,
  openTextPrompt,
  showToast,
  render,
  renderPreservingScroll = render,
}) {
  if (!stateManager || !root) {
    throw new TypeError("Management controller dependencies are missing.");
  }

  async function showError(title, error) {
    await openAlert({
      title,
      body: `<p>${escapeHtml(error.message)}</p>`,
      code: error?.code ?? error?.name ?? "MANAGEMENT_ERROR",
    });
  }

  function updateTrainingSelectionInPlace({
    playerId,
    programId,
  }) {
    const station = root.querySelector(
      `[data-training-station="${CSS.escape(playerId)}"]`,
    );
    const program = TRAINING_PROGRAMS.find(
      (entry) => entry.id === programId,
    );
    if (!station || !program) {
      return false;
    }

    const input = station.querySelector(
      `[data-training-player="${CSS.escape(playerId)}"]`,
    );
    if (input) {
      input.value = programId;
    }

    const preview = station.querySelector(
      "[data-training-selected-preview]",
    );
    if (preview) {
      preview.src = program.image;
      preview.alt = program.name;
    }

    for (const button of station.querySelectorAll(
      '[data-action="select-training-program"]',
    )) {
      const selected =
        button.dataset.programId === programId;
      button.classList.toggle("is-selected", selected);
      button.setAttribute(
        "aria-pressed",
        selected ? "true" : "false",
      );
    }
    return true;
  }

  async function handleAction(actionElement) {
    const action = actionElement.dataset.action;

    if (action === "select-training-program") {
      const playerId = actionElement.dataset.playerId;
      const programId = actionElement.dataset.programId;
      MANAGEMENT_VIEW_STATE.trainingSelections[playerId] =
        programId;

      // iOS Safariで一瞬scrollTop=0が描画されるため、
      // 画面全体を再描画せず、この選手欄だけを更新します。
      updateTrainingSelectionInPlace({
        playerId,
        programId,
      });
      actionElement.blur();
      return true;
    }

    if (action === "select-shop-category") {
      MANAGEMENT_VIEW_STATE.shopCategory = actionElement.dataset.shopCategory;
      renderPreservingScroll();
      return true;
    }
    if (action === "open-collection-file") {
      MANAGEMENT_VIEW_STATE.collectionFile = actionElement.dataset.fileType;
      render();
      return true;
    }
    if (action === "close-collection-file") {
      MANAGEMENT_VIEW_STATE.collectionFile = null;
      render();
      return true;
    }
    if (action === "select-collection-pack") {
      MANAGEMENT_VIEW_STATE.selectedPackType = actionElement.dataset.packType;
      MANAGEMENT_VIEW_STATE.selectedPackId = actionElement.dataset.packId;
      renderPreservingScroll();
      return true;
    }
    if (action === "inspect-collection-entry") {
      const master = getCollectionEntry(actionElement.dataset.collectionId);
      const snapshot = stateManager.getSnapshot();
      const record = master.category === "card" ? snapshot.collections.cards : snapshot.collections.badges;
      const owned = record?.[master.collectionId];
      if (!owned?.owned) {
        await openAlert({ title: `No.${String(master.collectionNo).padStart(3, "0")}`, body: "<p>未獲得のコレクションです。</p>" });
        return true;
      }
      const body = master.category === "card"
        ? `<section class="collection-detail-card"><img class="collection-detail-card__main" src="${escapeAttribute(master.image)}" alt=""><img class="collection-detail-card__logo" src="${escapeAttribute(collectionLogoPath(master))}" alt=""><span>No.${String(master.collectionNo).padStart(3, "0")}</span><h3>${escapeHtml(master.name)}</h3><p>所属 ${escapeHtml(master.teamName)}</p><p>役職 ${escapeHtml(master.role)}</p><strong>LEVEL +${owned.level}</strong></section>`
        : `<section class="collection-detail-card collection-detail-card--badge"><img class="collection-detail-card__main" src="${escapeAttribute(master.image)}" alt=""><span>No.${String(master.collectionNo).padStart(3, "0")}</span><h3>${escapeHtml(master.teamName)}</h3><p>地域 ${escapeHtml(master.tier[0].toUpperCase() + master.tier.slice(1))}</p><strong>LEVEL +${owned.level}</strong></section>`;
      await openAlert({ title: master.category === "card" ? "CARD DETAIL" : "BADGE DETAIL", body, buttonLabel: "閉じる" });
      return true;
    }

    if (action === "execute-training") {
      const beforeTrainingDate = deepClone(
        stateManager.getSnapshot().gameDate,
      );
      const assignments = [...root.querySelectorAll("[data-training-player]")]
        .map((select) => ({
          playerId: select.dataset.trainingPlayer,
          programId: select.value,
        }));
      if (!(await openConfirm({
        title: "1週間トレーニングしますか？",
        body: "<p>各選手が選んだ練習を実行し、個別の能力ポイントを獲得して1週間進めます。</p>",
        confirmLabel: "実行する",
      }))) return true;
      try {
        const tx = stateManager.transact("weekly_training_completed", (draft) =>
          executeTrainingToDraft(draft, assignments),
        );
        const total = tx.result.total;
        const latest = stateManager.getSnapshot();
        const bonusRecord = tx.result.weekAdvance.weeks[0]?.weeklyBonus?.record;
        const memberRows = tx.result.memberResults.map((memberResult, index) => {
          const player = latest.playerTeam.members.find((entry) => entry.playerId === memberResult.playerId);
          const program = TRAINING_PROGRAMS.find((entry) => entry.id === memberResult.programId);
          return `
            <article class="training-result-member" style="--result-index:${index}">
              <img class="training-result-member__player player-portrait" data-role="${escapeAttribute(player.role)}" src="${escapeAttribute(player.image)}" alt="">
              <img class="training-result-member__program" src="${escapeAttribute(program.image)}" alt="">
              <strong>${escapeHtml(player.name)}</strong>
              <span>${escapeHtml(program.name)}</span>
              <small>P+${memberResult.gain.power} T+${memberResult.gain.tech} M+${memberResult.gain.mental} S+${memberResult.gain.shoot}</small>
            </article>`;
        }).join("");

        await openAlert({
          title: "TRAINING COMPLETE",
          body: `<section class="training-result-show training-result-show--complete"><span>TRAINING FINISHED</span><h3>${escapeHtml(formatManagementGameDate(beforeTrainingDate))}</h3><div class="training-result-members">${memberRows}</div></section>`,
          buttonLabel: "能力ポイント確認",
        });

        await openAlert({
          title: "ABILITY POINT GET",
          body: `<section class="ability-point-notice"><span>各選手へ個別に加算されました</span><div class="training-result-total"><span>POWER <strong>+${formatNumber(total.power)}</strong></span><span>TECH <strong>+${formatNumber(total.tech)}</strong></span><span>MENTAL <strong>+${formatNumber(total.mental)}</strong></span><span>SHOOT <strong>+${formatNumber(total.shoot)}</strong></span></div><p>TEAM画面の選手TAP、またはチームラボのABILITY UPから強化できます。</p></section>`,
          buttonLabel: "新しい週へ",
        });

        await openAlert({
          title: "NEW WEEK START",
          body: `<section class="week-start-screen"><span>WEEK START</span><h3>${latest.gameDate.year}年 ${latest.gameDate.month}月 第${latest.gameDate.week}週</h3><p>${escapeHtml(formatManagementGameDate(beforeTrainingDate))}のトレーニングを終え、新しい週が始まりました。</p>${bonusRecord ? `<div class="weekly-bonus-inline"><span>WEEK START BONUS</span><strong><img src="icon/coin.png" alt="">${formatNumber(bonusRecord.granted.coin)}</strong><strong><img src="icon/daia.png" alt="">${formatNumber(bonusRecord.granted.diamond)}</strong><strong><img src="icon/rubi.png" alt="">${formatNumber(bonusRecord.granted.ruby)}</strong></div>` : ""}</section>`,
          buttonLabel: "今週を始める",
        });
        renderPreservingScroll();
      } catch (error) { await showError("トレーニングできません", error); }
      return true;
    }

    if (action === "inspect-shop-item") {
      const item = getItem(actionElement.dataset.itemId);
      const snapshot = stateManager.getSnapshot();
      const quantityText = await openTextPrompt({
        title: item.name,
        body: `<section class="shop-item-detail-modal"><div class="shop-item-detail-modal__image"><img src="${escapeAttribute(item.image)}" alt=""></div><p>${escapeHtml(item.description)}</p><div class="cost-tags">${currencyPriceTemplate(item.price)}</div><strong>所持 ${formatNumber(snapshot.inventory.items[item.itemId] ?? 0)}</strong><small>購入数量を1～99で入力してください</small></section>`,
        initialValue: "1",
        maximumLength: 2,
        confirmLabel: "購入する",
      });
      if (quantityText === false) return true;
      const quantity = Number(quantityText);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        await showError("購入できません", new RangeError("購入数量は1～99にしてください。"));
        return true;
      }
      try {
        const tx = stateManager.transact("item_purchased", (draft) => purchaseConsumableToDraft(draft, item.itemId, quantity));
        showToast(`${tx.result.name}を${quantity}個購入しました`);
        renderPreservingScroll();
      } catch (error) { await showError("購入できません", error); }
      return true;
    }

    if (action === "inspect-shop-pack") {
      const pack = getCardPack(actionElement.dataset.packId);
      const snapshot = stateManager.getSnapshot();
      const quantityText = await openTextPrompt({
        title: pack.name,
        body: `<section class="shop-item-detail-modal"><div class="shop-item-detail-modal__image"><img src="${escapeAttribute(pack.image)}" alt=""></div><p>カードパックをまとめて購入できます。</p><div class="cost-tags">${currencyPriceTemplate(pack.price)}</div><strong>所持 ${formatNumber(snapshot.inventory.cardPacks[pack.packId] ?? 0)}</strong><small>購入数量を1～99で入力してください</small></section>`,
        initialValue: "1",
        maximumLength: 2,
        confirmLabel: "購入する",
      });
      if (quantityText === false) return true;
      const quantity = Number(quantityText);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        await showError("購入できません", new RangeError("購入数量は1～99にしてください。"));
        return true;
      }
      try {
        const tx = stateManager.transact("card_pack_purchased", (draft) => purchaseCardPackToDraft(draft, pack.packId, quantity));
        showToast(`${tx.result.name}を${quantity}個購入しました`);
        renderPreservingScroll();
      } catch (error) { await showError("購入できません", error); }
      return true;
    }

    if (action === "purchase-item") {
      if (!(await openConfirm({
        title: "アイテムを購入しますか？",
        body: "<p>1個購入します。</p>",
        confirmLabel: "購入する",
      }))) return true;
      try {
        const tx = stateManager.transact("item_purchased", (draft) =>
          purchaseConsumableToDraft(draft, actionElement.dataset.itemId, 1),
        );
        showToast(`${tx.result.name}を購入しました`);
        renderPreservingScroll();
      } catch (error) { await showError("購入できません", error); }
      return true;
    }

    if (action === "purchase-card-pack") {
      if (!(await openConfirm({
        title: "カードパックを購入しますか？",
        body: "<p>5,000 COINと10 DIAMONDを消費します。</p>",
        confirmLabel: "購入する",
      }))) return true;
      try {
        const tx = stateManager.transact("card_pack_purchased", (draft) =>
          purchaseCardPackToDraft(draft, actionElement.dataset.packId, 1),
        );
        showToast(`${tx.result.name}を購入しました`);
        renderPreservingScroll();
      } catch (error) { await showError("購入できません", error); }
      return true;
    }

    if (action === "save-bag") {
      const selections = [...root.querySelectorAll("[data-bag-slot]")];
      try {
        stateManager.transact("carry_bag_updated", (draft) => {
          for (const select of selections) {
            setCarryBagSlotToDraft(
              draft,
              Number(select.dataset.bagSlot),
              select.value || null,
            );
          }
        });
        showToast("バッグ編成を保存しました");
        renderPreservingScroll();
      } catch (error) { await showError("バッグを保存できません", error); }
      return true;
    }

    if (action === "weapon-skin-gacha") {
      if (!(await openConfirm({
        title: "武器スキンガチャを引きますか？",
        body: "<p>50 DIAMONDと3 RUBYを消費します。</p>",
        confirmLabel: "ガチャを引く",
      }))) return true;
      try {
        const tx = stateManager.transact("weapon_skin_gacha_drawn", (draft) =>
          performWeaponSkinGachaToDraft(draft),
        );
        await openAlert({
          title: "NEW WEAPON SKIN",
          body: `<p><strong>${escapeHtml(tx.result.name)}</strong></p><img src="${escapeAttribute(tx.result.image)}" alt="" style="width:140px;margin:12px auto;object-fit:contain">`,
        });
        renderPreservingScroll();
      } catch (error) { await showError("ガチャを実行できません", error); }
      return true;
    }

    if (action === "strategy-meeting") {
      if (!(await openConfirm({
        title: "作戦会議を行いますか？",
        body: "<p>10,000 COIN・10 DIAMOND・1 RUBYを消費します。</p>",
        confirmLabel: "会議を行う",
      }))) return true;
      try {
        const tx = stateManager.transact("strategy_meeting_completed", (draft) =>
          performStrategyMeetingToDraft(draft),
        );
        const result = tx.result;
        await openAlert({
          title: `${result.selectedRank} RANK STRATEGY`,
          body: `<section class="strategy-meeting-show"><div class="strategy-meeting-show__board"><span>TACTICAL BRIEFING</span><strong>${escapeHtml(result.strategyName)}</strong><small>${escapeHtml(result.selectedRank)} RANK / ${escapeHtml(result.acquisitionType)} / 所持 ${result.quantity}</small></div><div class="strategy-meeting-show__board"><span>COACH REVIEW</span><strong>${result.coachResults.filter((coach) => coach.success).length} / ${result.coachResults.length} RANK UP</strong><small>会議内容を各コーチの成長判定へ反映しました</small></div></section>`,
        });
        renderPreservingScroll();
      } catch (error) { await showError("作戦会議を実行できません", error); }
      return true;
    }

    if (action === "open-card-pack" || action === "open-badge-pack") {
      try {
        const isCard = action === "open-card-pack";
        const tx = stateManager.transact(
          isCard ? "card_pack_opened" : "badge_pack_opened",
          (draft) => isCard
            ? openCardPacksToDraft(draft, actionElement.dataset.packId, actionElement.dataset.openMode)
            : openBadgePacksToDraft(draft, actionElement.dataset.packId, actionElement.dataset.openMode),
        );
        const result = tx.result;
        await openAlert({
          title: `${result.packName} OPEN`,
          body: packOpeningPresentation(result),
          buttonLabel: "コレクションへ",
        });
        renderPreservingScroll();
      } catch (error) { await showError("パックを開封できません", error); }
      return true;
    }

    if (action === "purchase-room") {
      if (!(await openConfirm({
        title: "ROOMを購入しますか？",
        body: "<p>購入後はいつでも入室できます。</p>",
        confirmLabel: "購入する",
      }))) return true;
      try {
        const tx = stateManager.transact("room_purchased", (draft) =>
          purchaseRoomToDraft(draft, actionElement.dataset.roomId),
        );
        showToast(`${tx.result.name}を購入しました`);
        renderPreservingScroll();
      } catch (error) { await showError("ROOMを購入できません", error); }
      return true;
    }

    if (action === "activate-room") {
      try {
        stateManager.transact("room_activated", (draft) =>
          activateRoomToDraft(draft, actionElement.dataset.roomId),
        );
        renderPreservingScroll();
      } catch (error) { await showError("ROOMへ入室できません", error); }
      return true;
    }

    if (action === "add-room-item") {
      const value = root.querySelector("#roomItemSelect")?.value;
      if (!value) return true;
      try {
        stateManager.transact("room_item_added", (draft) =>
          addRoomPlacementToDraft(
            draft,
            actionElement.dataset.roomId,
            JSON.parse(value),
          ),
        );
        renderPreservingScroll();
      } catch (error) { await showError("ROOMへ配置できません", error); }
      return true;
    }

    if (["room-scale-down", "room-scale-up", "room-flip", "room-front", "room-remove"].includes(action)) {
      const roomId = actionElement.dataset.roomId;
      const placementId = actionElement.dataset.placementId;
      try {
        stateManager.transact(`room_${action}`, (draft) => {
          const placement = draft.collections.roomLayouts[roomId].find(
            (entry) => entry.placementId === placementId,
          );
          if (action === "room-scale-down" || action === "room-scale-up") {
            return updateRoomPlacementToDraft(draft, roomId, placementId, {
              scale: placement.scale + (action === "room-scale-up" ? 0.1 : -0.1),
            });
          }
          if (action === "room-flip") {
            return updateRoomPlacementToDraft(draft, roomId, placementId, {
              flipped: !placement.flipped,
            });
          }
          if (action === "room-front") {
            return bringRoomPlacementToFrontToDraft(draft, roomId, placementId);
          }
          return removeRoomPlacementToDraft(draft, roomId, placementId);
        });
        renderPreservingScroll();
      } catch (error) { await showError("ROOM配置を変更できません", error); }
      return true;
    }

    return false;
  }

  function afterRender(route) {
    if (route !== "room") return;
    const canvas = root.querySelector("[data-room-canvas]");
    if (!canvas) return;
    const roomId = canvas.dataset.roomId;
    for (const placement of canvas.querySelectorAll("[data-room-placement]")) {
      placement.addEventListener("pointerdown", (event) => {
        if (event.target.closest("button")) return;
        event.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const placementId = placement.dataset.placementId;
        placement.setPointerCapture?.(event.pointerId);
        const move = (moveEvent) => {
          const x = Math.min(100, Math.max(0, ((moveEvent.clientX - rect.left) / rect.width) * 100));
          const y = Math.min(100, Math.max(0, ((moveEvent.clientY - rect.top) / rect.height) * 100));
          placement.style.left = `${x}%`;
          placement.style.top = `${y}%`;
          placement.dataset.pendingX = String(x);
          placement.dataset.pendingY = String(y);
        };
        const finish = () => {
          placement.removeEventListener("pointermove", move);
          placement.removeEventListener("pointerup", finish);
          placement.removeEventListener("pointercancel", finish);
          const x = Number(placement.dataset.pendingX);
          const y = Number(placement.dataset.pendingY);
          delete placement.dataset.pendingX;
          delete placement.dataset.pendingY;
          if (!Number.isFinite(x) || !Number.isFinite(y)) return;
          try {
            stateManager.transact("room_placement_moved", (draft) =>
              updateRoomPlacementToDraft(draft, roomId, placementId, { x, y }),
            );
          } catch (_error) {
            showToast("ROOM配置を保存できませんでした");
          }
        };
        placement.addEventListener("pointermove", move);
        placement.addEventListener("pointerup", finish);
        placement.addEventListener("pointercancel", finish);
      });
    }
  }

  return Object.freeze({ handleAction, afterRender });
}
