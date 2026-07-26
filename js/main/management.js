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
  "mobbr-management-feature-0.1.0";

const CURRENCY_IDS = Object.freeze(["coin", "diamond", "ruby"]);
const COLLECTION_HISTORY_LIMIT = 200;
const ROOM_EPSILON = 0.001;

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

  const badgeBonusRate =
    draft.collectionBonuses.trainingPointRate ??
    calculateBadgeTrainingBonusRate(
      Object.values(draft.collections.badges ?? {}),
    );
  const result = calculateWeeklyTraining(assignments, badgeBonusRate);

  for (const pointId of TRAINING_POINT_IDS) {
    draft.trainingPoints[pointId] += result.total[pointId];
  }
  draft.records.trainingCompleted += 1;

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
  const count = mode === "all" ? owned : 1;

  if (!["one", "all"].includes(mode)) {
    throw new RangeError("開封モードはoneまたはallです。");
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
  const count = mode === "all" ? owned : 1;

  if (!["one", "all"].includes(mode)) {
    throw new RangeError("開封モードはoneまたはallです。");
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

function currencyPriceTemplate(price) {
  return CURRENCY_IDS
    .filter((id) => (price[id] ?? 0) > 0)
    .map((id) => `<span>${id.toUpperCase()} ${formatNumber(price[id])}</span>`)
    .join("");
}

export function renderTrainingManagement(snapshot) {
  const bonusRate =
    snapshot.collectionBonuses?.trainingPointRate ?? 0;
  return `
    <section class="management-summary">
      <strong>バッジ補正 +${(bonusRate * 100).toFixed(1)}%</strong>
      <span>実行すると1週間進みます</span>
    </section>
    <form class="training-assignment-form" data-form="training">
      ${snapshot.playerTeam.members.map((player) => `
        <label class="training-assignment-card">
          <span>${escapeHtml(player.role)} / ${escapeHtml(player.name)}</span>
          <select data-training-player="${escapeAttribute(player.playerId)}">
            ${TRAINING_PROGRAMS.map((program) => `
              <option value="${escapeAttribute(program.id)}">
                ${escapeHtml(program.name)} — P${program.points.power}
                T${program.points.tech} M${program.points.mental}
                S${program.points.shoot}
              </option>
            `).join("")}
          </select>
        </label>
      `).join("")}
      <button
        type="button"
        class="primary-button"
        data-action="execute-training"
      >
        1週間トレーニング
      </button>
    </form>
  `;
}

export function renderShopManagement(snapshot) {
  const unlockProgress = getCardPackUnlockProgress(snapshot);
  const gachaPool = WEAPON_SKINS.filter(
    (skin) =>
      skin.source === "gacha" &&
      snapshot.inventory.weaponSkins?.[skin.skinId] !== true,
  );

  return `
    <section class="management-section">
      <h2>ITEM SHOP</h2>
      <div class="management-card-grid">
        ${CONSUMABLE_ITEMS.map((item) => `
          <article class="shop-product-card">
            <img src="${escapeAttribute(item.image)}" alt="">
            <div>
              <h3>${escapeHtml(item.name)}</h3>
              <p>${escapeHtml(item.description)}</p>
              <div class="cost-tags">${currencyPriceTemplate(item.price)}</div>
              <small>所持 ${formatNumber(snapshot.inventory.items[item.itemId] ?? 0)}</small>
            </div>
            <button
              type="button"
              class="compact-upgrade-button"
              data-action="purchase-item"
              data-item-id="${escapeAttribute(item.itemId)}"
            >
              購入
            </button>
          </article>
        `).join("")}
      </div>
    </section>

    <section class="management-section">
      <h2>CARD PACK</h2>
      <div class="management-card-grid">
        ${CARD_PACKS.map((pack) => {
          const unlocked = isCardPackUnlocked(
            pack.packId,
            unlockProgress,
          );
          return `
            <article class="shop-product-card">
              <img src="${escapeAttribute(pack.image)}" alt="">
              <div>
                <h3>${escapeHtml(pack.name)}</h3>
                <p>${unlocked ? "購入可能" : "大会条件未達"}</p>
                <div class="cost-tags">${currencyPriceTemplate(pack.price)}</div>
                <small>所持 ${formatNumber(snapshot.inventory.cardPacks[pack.packId] ?? 0)}</small>
              </div>
              <button
                type="button"
                class="compact-upgrade-button"
                data-action="purchase-card-pack"
                data-pack-id="${escapeAttribute(pack.packId)}"
                ${unlocked ? "" : "disabled"}
              >
                購入
              </button>
            </article>
          `;
        }).join("")}
      </div>
    </section>

    <section class="content-panel skin-gacha-panel">
      <h2>WEAPON SKIN GACHA</h2>
      <p>
        50 DIAMOND + 3 RUBY / 重複なし<br>
        残り ${gachaPool.length}種類
      </p>
      <button
        type="button"
        class="primary-button"
        data-action="weapon-skin-gacha"
        ${gachaPool.length > 0 ? "" : "disabled"}
      >
        ガチャを引く
      </button>
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
    return `
      <article class="pack-open-card">
        <img src="${escapeAttribute(pack.image)}" alt="">
        <div>
          <h3>${escapeHtml(pack.name)}</h3>
          <p>所持 ${formatNumber(count)}</p>
        </div>
        <button
          type="button"
          class="secondary-button"
          data-action="open-${type}-pack"
          data-pack-id="${escapeAttribute(pack.packId)}"
          data-open-mode="one"
          ${count > 0 ? "" : "disabled"}
        >
          1つ開封
        </button>
        <button
          type="button"
          class="primary-button"
          data-action="open-${type}-pack"
          data-pack-id="${escapeAttribute(pack.packId)}"
          data-open-mode="all"
          ${count > 0 ? "" : "disabled"}
        >
          全て開封
        </button>
      </article>
    `;
  }).join("");
}

function ownedCollectionCards(snapshot, category) {
  const master =
    category === "card" ? CARD_COLLECTION : BADGE_COLLECTION;
  const record =
    category === "card"
      ? snapshot.collections.cards
      : snapshot.collections.badges;
  return master
    .filter((entry) => record?.[entry.collectionId]?.owned === true)
    .map((entry) => ({ master: entry, owned: record[entry.collectionId] }));
}

export function renderCollectionManagement(snapshot) {
  const cardCompletion = getCollectionCompletion(
    snapshot.collections.cards,
    "card",
  );
  const badgeCompletion = getCollectionCompletion(
    snapshot.collections.badges,
    "badge",
  );
  const ownedCards = ownedCollectionCards(snapshot, "card");
  const ownedBadges = ownedCollectionCards(snapshot, "badge");

  return `
    <section class="collection-completion-grid">
      <article>
        <strong>CARD ${cardCompletion.ownedCount} / ${cardCompletion.totalCount}</strong>
        <span>週間COIN +${((snapshot.collectionBonuses.weeklyCoinRate ?? 0) * 100).toFixed(1)}%</span>
      </article>
      <article>
        <strong>BADGE ${badgeCompletion.ownedCount} / ${badgeCompletion.totalCount}</strong>
        <span>TRAINING +${((snapshot.collectionBonuses.trainingPointRate ?? 0) * 100).toFixed(1)}%</span>
      </article>
    </section>

    <section class="management-section">
      <h2>カードパック開封</h2>
      <div class="pack-open-grid">
        ${packOpenButtons("card", CARD_PACKS, snapshot.inventory.cardPacks)}
      </div>
    </section>

    <section class="management-section">
      <h2>バッジパック開封</h2>
      <div class="pack-open-grid">
        ${packOpenButtons("badge", BADGE_PACKS, snapshot.inventory.badgePacks)}
      </div>
    </section>

    <section class="management-section">
      <h2>OWNED CARDS</h2>
      <div class="collection-grid">
        ${
          ownedCards.length
            ? ownedCards.map(({ master, owned }) => `
                <article class="collection-card collection-card--card">
                  <img src="${escapeAttribute(master.image)}" alt="">
                  <span>No.${master.collectionNo}</span>
                  <strong>${escapeHtml(master.name)}</strong>
                  <small>+${owned.level}</small>
                </article>
              `).join("")
            : `<p class="empty-state">カードはまだありません。</p>`
        }
      </div>
    </section>

    <section class="management-section">
      <h2>OWNED BADGES</h2>
      <div class="collection-grid">
        ${
          ownedBadges.length
            ? ownedBadges.map(({ master, owned }) => `
                <article class="collection-card collection-card--badge">
                  <img src="${escapeAttribute(master.image)}" alt="">
                  <span>No.${master.collectionNo}</span>
                  <strong>${escapeHtml(master.teamName)}</strong>
                  <small>+${owned.level}</small>
                </article>
              `).join("")
            : `<p class="empty-state">バッジはまだありません。</p>`
        }
      </div>
    </section>
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
          <article class="room-list-card ${active ? "is-active" : ""}">
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
            <img src="${escapeAttribute(player.image)}" alt="">
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
                  <em>${entry.finalPlace}位</em>
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
  showToast,
  render,
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

  async function handleAction(actionElement) {
    const action = actionElement.dataset.action;

    if (action === "execute-training") {
      const assignments = [...root.querySelectorAll("[data-training-player]")]
        .map((select) => ({
          playerId: select.dataset.trainingPlayer,
          programId: select.value,
        }));
      if (!(await openConfirm({
        title: "1週間トレーニングしますか？",
        body: "<p>3選手の獲得ポイントを合算し、1週間進めます。</p>",
        confirmLabel: "実行する",
      }))) return true;
      try {
        const tx = stateManager.transact("weekly_training_completed", (draft) =>
          executeTrainingToDraft(draft, assignments),
        );
        const total = tx.result.total;
        await openAlert({
          title: "トレーニング完了",
          body: `<p>POWER ${formatNumber(total.power)} / TECH ${formatNumber(total.tech)}<br>MENTAL ${formatNumber(total.mental)} / SHOOT ${formatNumber(total.shoot)}</p>`,
        });
        render();
      } catch (error) { await showError("トレーニングできません", error); }
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
        render();
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
        render();
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
        render();
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
        render();
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
          body: `<p><strong>${escapeHtml(result.strategyName)}</strong></p><p>${escapeHtml(result.acquisitionType)} / 所持 ${result.quantity}</p><p>コーチランクアップ成功 ${result.coachResults.filter((coach) => coach.success).length}人</p>`,
        });
        render();
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
        const previews = result.results.slice(0, 12).map((opened) =>
          `<div style="display:inline-grid;width:86px;margin:4px;text-align:center"><img src="${escapeAttribute(opened.master.image)}" alt="" style="width:80px;height:80px;object-fit:contain"><small>${escapeHtml(opened.resultType)}</small></div>`,
        ).join("");
        await openAlert({
          title: `${result.packName} OPEN`,
          body: `<p>NEW ${result.summary.newCount} / POWER UP ${result.summary.powerUpCount} / CONVERT ${result.summary.convertCount}</p><div>${previews}</div>${result.results.length > 12 ? `<p>ほか ${result.results.length - 12}件</p>` : ""}`,
        });
        render();
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
        render();
      } catch (error) { await showError("ROOMを購入できません", error); }
      return true;
    }

    if (action === "activate-room") {
      try {
        stateManager.transact("room_activated", (draft) =>
          activateRoomToDraft(draft, actionElement.dataset.roomId),
        );
        render();
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
        render();
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
        render();
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
