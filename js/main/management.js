/**
 * MOB BR company-management feature.
 *
 * Persistent changes are performed only against a state.js transaction draft.
 * Tournament runtime data is never mutated here.
 */

import {
  assetPath,
} from "../assets.js";
import {
  TRAINING_POINT_IDS,
  advanceGameWeek,
  getCompanyRankData,
  getTournamentEventsForDate,
} from "../../data/game-data.js?v=45";
import {
  isCasualTournamentType,
  resolveCpuTeamMaster,
  simulateObserverCircuitEvent,
} from "../../data/circuit-data.js?v=45";
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
  purchaseCookingIngredientToDraft,
  purchaseCookingUtensilToDraft,
  serveDiningMealToDraft,
  settleDiningMealsToDraft,
} from "./state.js?v=45";
import {
  COOKING_RULES,
  COOKING_SCREEN_ASSETS,
  COOKING_UTENSIL_MASTER,
  FOOD_QUALITY_MASTER,
  INGREDIENT_MASTER,
  RECIPE_MASTER,
  collectCookingJobToDraft,
  createFoodVariant,
  getCookingJobRemainingSeconds,
  getCookingUtensil,
  getIngredient,
  getRecipe,
  getRecipeCandidates,
  isCookingJobReady,
  placeCookingUtensilToDraft,
  removeCookingUtensilFromSlotToDraft,
  startCookingJobToDraft,
} from "../../data/cooking-data.js?v=45";
import {
  createChampionshipStandings,
} from "./tournament-bridge.js?v=45";
import {
  DINING_EATING_SPEECHES,
  DINING_HUNGRY_SPEECHES,
  DINING_RULES,
  diningWeekKey,
} from "../../data/dining-data.js?v=45";

export const MANAGEMENT_FEATURE_VERSION =
  "mobbr-management-feature-2.3.0";

const CURRENCY_IDS = Object.freeze(["coin", "diamond", "ruby"]);
const COLLECTION_HISTORY_LIMIT = 200;
const ROOM_EPSILON = 0.001;

const MANAGEMENT_VIEW_STATE = {
  shopCategory: null,
  collectionFile: null,
  selectedPackType: null,
  selectedPackId: null,
  trainingSelections: {},
  strategyRank: null,
  roomCategory: null,
  roomSelectedItem: null,
  roomSelectedPlacementId: null,
  cookingSelectedSlot: 0,
  cookingIngredientSlots: Array.from(
    { length: 5 },
    () => null,
  ),
  cookingIngredientPickerSlot: null,
  cookingPopupOpen: false,
  cookingView: "kitchen",
  cookingCookbookQuality: "normal",
  cookingCookbookPage: 1,
  collectionFoodQuality: "normal",
  collectionFoodPage: 1,
  diningSelectedCharacterId: null,
  diningSelectedCharacterType: null,
  diningSelectedFoods: [],
};

const ROOM_CATEGORY_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "Card",
    label: "CARD",
    icon: "icon/card.png",
  }),
  Object.freeze({
    id: "Badge",
    label: "BADGE",
    icon: "icon/bagi.png",
  }),
  Object.freeze({
    id: "Card Pack",
    label: "CARD PACK",
    icon: "icon/back.png",
  }),
  Object.freeze({
    id: "Badge Pack",
    label: "BADGE PACK",
    icon: "item/bagilocal.png",
  }),
  Object.freeze({
    id: "Trophy",
    label: "TROPHY",
    icon: "prize/01.png",
  }),
]);

const COOKING_UTENSIL_SYMBOLS = Object.freeze({
  frying_pan: "PAN",
  pot: "POT",
  oven: "OVEN",
  steamer: "STEAM",
  mixer: "MIX",
});

function cookingUtensilSymbol(
  utensilId,
) {
  return (
    COOKING_UTENSIL_SYMBOLS[
      utensilId
    ] ??
    "TOOL"
  );
}

function formatCookingTime(
  seconds,
) {
  const safe =
    Math.max(
      0,
      Math.floor(
        Number(seconds) ||
        0,
      ),
    );
  const minutes =
    Math.floor(
      safe / 60,
    );
  const remaining =
    safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function selectedCookingIngredients() {
  return MANAGEMENT_VIEW_STATE
    .cookingIngredientSlots
    .filter(Boolean);
}

function ingredientCountMap(ids) {
  return ids.reduce((record, id) => {
    record[id] = (record[id] ?? 0) + 1;
    return record;
  }, {});
}

function cookingRecipeGuideEntries(snapshot, selectedIngredientIds) {
  if (selectedIngredientIds.length === 0) return [];
  const selectedCounts = ingredientCountMap(selectedIngredientIds);
  return RECIPE_MASTER
    .map((recipe) => {
      const recipeCounts = ingredientCountMap(recipe.ingredientIds);
      for (const [id, count] of Object.entries(selectedCounts)) {
        if ((recipeCounts[id] ?? 0) < count) return null;
      }
      const remaining = [];
      for (const ingredientId of recipe.ingredientIds) {
        const used = selectedCounts[ingredientId] ?? 0;
        if (used > 0) {
          selectedCounts[ingredientId] = used - 1;
        } else {
          remaining.push(ingredientId);
        }
      }
      // restore because selectedCounts is shared across recipes
      Object.assign(selectedCounts, ingredientCountMap(selectedIngredientIds));
      if (remaining.length === 0 || remaining.length > 3) return null;
      return {
        recipe,
        remaining,
        discovered: Boolean(snapshot.cooking.recipeDiscovery?.[recipe.recipeId]),
      };
    })
    .filter(Boolean)
    .sort((left, right) =>
      left.remaining.length - right.remaining.length ||
      left.recipe.number - right.recipe.number
    )
    .slice(0, 12);
}

function resetCookingSelection({
  keepSlot = true,
} = {}) {
  MANAGEMENT_VIEW_STATE.cookingIngredientSlots =
    Array.from(
      {
        length:
          COOKING_RULES
            .maximumIngredientSlots,
      },
      () => null,
    );
  MANAGEMENT_VIEW_STATE.cookingIngredientPickerSlot =
    null;
  if (!keepSlot) {
    MANAGEMENT_VIEW_STATE.cookingSelectedSlot =
      0;
  }
}

function foodInventoryCount(
  cookingState,
) {
  return Object.values(
    cookingState.foodInventory ??
    {},
  ).reduce(
    (sum, record) =>
      sum +
      Number(
        record.quantity ??
        0,
      ),
    0,
  );
}

const SHOP_CATEGORY_DEFINITIONS = Object.freeze([
  { id: "item", label: "アイテム", icon: "icon/item.png", dialogue: "大会用アイテムです。必要な数をまとめて購入できます。" },
  { id: "card", label: "カード", icon: "icon/card.png", dialogue: "カードパックです。解放済み商品を複数まとめて購入できます。" },
  { id: "skin", label: "スキン", icon: "menu/gacha.png", dialogue: "武器スキンです。未所持スキンだけが抽選対象です。" },
  { id: "good", label: "GOOD", icon: "icon/bagi.png", dialogue: "バッジパックなどの大会記念品です。大会報酬で入手できます。" },
  { id: "ingredient", label: "食材", icon: "sk/01.png", dialogue: "今週仕入れた20種類の食材です。料理に使う数を購入してください。" },
  { id: "utensil", label: "調理器具", icon: "icon/kitbox.png", dialogue: "キッチンへ配置する調理器具です。同じ器具を複数購入できます。" },
]);

function latestHistory(snapshot, types, year = snapshot.gameDate.year) {
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

function tournamentHistoryIncludesTeam(history, teamId) {
  if (!history || !teamId) return false;
  if (
    (history.advancement?.participantSeeds ?? []).some(
      (seed) => seed.teamId === teamId || seed.isPlayer === true,
    )
  ) {
    return true;
  }
  return (history.rankings ?? []).some(
    (row) => row.teamId === teamId || row.isPlayer === true,
  );
}

function tournamentQualificationNeeded(snapshot, event) {
  const history = snapshot.tournament?.history ?? [];
  if (history.some((entry) => entry.tournamentId === event.tournamentId)) {
    return false;
  }
  const type = event.tournamentType;
  if (isCasualTournamentType(type)) return false;
  if (type === "local") return true;

  const year = event.year ?? snapshot.gameDate.year;
  const playerTeamId = snapshot.playerTeam.teamId;
  const local = latestHistory(snapshot, "local", year);
  const nationalWeek1 = latestHistory(snapshot, "national_week_1", year);
  const nationalWeek2 = latestHistory(snapshot, ["national_week_2", "national"], year);
  const nationalLastChance = latestHistory(snapshot, "national_last_chance", year);
  const worldWeek1 = latestHistory(snapshot, "world_qualifier_week_1", year);
  const worldWeek2 = latestHistory(snapshot, ["world_qualifier_week_2", "world_qualifier"], year);
  const worldLastChance = latestHistory(snapshot, "world_last_chance", year);

  if (type === "national_week_1") {
    return local?.qualified === true || local?.finalPlace <= 10;
  }
  if (type === "national_week_2") {
    const stageReady =
      nationalWeek1?.status === "stage_in_progress" ||
      nationalWeek1?.nextStageId === "national_week_2";
    return stageReady &&
      tournamentHistoryIncludesTeam(nationalWeek1, playerTeamId);
  }
  if (type === "national_last_chance") {
    return (nationalWeek2?.advancement?.lastChanceTeamIds ?? [])
      .includes(playerTeamId);
  }
  if (type === "world_qualifier_week_1") {
    const representatives = [
      ...(nationalWeek2?.advancement?.directQualifierTeamIds ?? []),
      ...(nationalLastChance?.advancement?.qualifierTeamIds ?? []),
    ];
    return representatives.includes(playerTeamId);
  }
  if (type === "world_qualifier_week_2") {
    const stageReady =
      worldWeek1?.status === "stage_in_progress" ||
      worldWeek1?.nextStageId === "world_qualifier_week_2";
    return stageReady &&
      tournamentHistoryIncludesTeam(worldWeek1, playerTeamId);
  }
  if (type === "world_last_chance") {
    return (worldWeek2?.advancement?.lastChanceTeamIds ?? [])
      .includes(playerTeamId);
  }
  if (type === "world_final") {
    return [
      ...(worldWeek2?.advancement?.directQualifierTeamIds ?? []),
      ...(worldLastChance?.advancement?.qualifierTeamIds ?? []),
    ].includes(playerTeamId);
  }
  if (type === "championship") {
    return createChampionshipStandings(snapshot, year)
      .some(
        (row) =>
          row.teamId === playerTeamId &&
          row.place <= 20,
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
    if (
      (type === "national" || type === "national_week_2") &&
      entry.status !== "stage_in_progress" &&
      entry.status !== "cpu_simulated"
    ) {
      bestPlacements.national =
        bestPlacements.national === null
          ? place
          : Math.min(bestPlacements.national, place);
    }
    if (type === "world_final") {
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
  const diningCoachBonusRate =
    Math.max(
      0,
      Math.min(
        DINING_RULES.maximumCoachTrainingBonusRate,
        Number(
          draft.dining?.coachTrainingBonusRate ??
          0,
        ),
      ),
    );
  const totalTrainingBonusRate =
    badgeBonusRate +
    diningCoachBonusRate;
  const result = calculateWeeklyTraining(
    assignments,
    totalTrainingBonusRate,
  );

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
    if (
      event.recordOnlyWhenEntered === true ||
      isCasualTournamentType(event.tournamentType)
    ) {
      continue;
    }
    if (
      draft.tournament.history.some(
        (entry) => entry.tournamentId === event.tournamentId,
      )
    ) {
      continue;
    }

    const observerRecord = simulateObserverCircuitEvent(
      draft,
      event,
      { completedAt: clock().toISOString() },
    );
    if (observerRecord) {
      draft.tournament.history.push(observerRecord);
      continue;
    }

    draft.tournament.history.push({
      tournamentId: event.tournamentId,
      tournamentType: event.tournamentType,
      stageName: event.stageName,
      circuitYear: event.year ?? draft.gameDate.year,
      circuitStageId: event.circuitStageId ?? event.stageId,
      finalPlace: null,
      qualified: false,
      status: "not_entered",
      summary: `今週は${event.stageName}が開催されました。出場予定はありませんでした。`,
      rewards: { coin: 0, diamond: 0, ruby: 0, companyExp: 0 },
      rankings: [],
      advancement: null,
      completedAt: clock().toISOString(),
    });
  }
  const weekAdvance = advanceWeeksToDraft(draft, 1, {
    grantWeeklyBonus: true,
    clock,
  });

  return {
    ...deepClone(result),
    badgeBonusRate,
    diningCoachBonusRate,
    totalTrainingBonusRate,
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
    packImage: pack.image,
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
    packImage: pack.image,
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

  if (itemRef.kind === "trophy") {
    const trophy =
      (snapshot.collections.trophies ?? [])
        .find(
          (entry) =>
            entry.trophyId === itemRef.id,
        );
    if (!trophy) {
      return null;
    }
    return {
      itemRef,
      name: trophy.name,
      image: trophy.image,
      roomType: "Trophy",
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
  for (const trophy of snapshot.collections.trophies ?? []) {
    entries.push({
      itemRef: {
        kind: "trophy",
        id: trophy.trophyId,
      },
      name: trophy.name,
      image: trophy.image,
      roomType: "Trophy",
    });
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

export function setHomeRoomToDraft(
  draft,
  roomId,
) {
  assertDraft(draft);
  ensureManagementStateToDraft(draft);
  getRoomMaster(roomId);
  if (
    !draft.company.unlockedRoomIds
      .includes(roomId)
  ) {
    throw new RangeError(
      "未購入の部屋はHOMEに設定できません。",
    );
  }
  draft.company.homeRoomId =
    roomId;
  return {
    roomId,
  };
}

export function sendRoomPlacementToBackToDraft(
  draft,
  roomId,
  placementId,
) {
  const {
    layout,
    placement,
  } = getRoomPlacement(
    draft,
    roomId,
    placementId,
  );
  for (const entry of layout) {
    if (
      entry.placementId !==
      placementId
    ) {
      entry.z =
        Math.max(
          2,
          Number(entry.z ?? 1) + 1,
        );
    }
  }
  placement.z = 1;
  return deepClone(placement);
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
  const cards =
    result.results.slice(0, 18);
  const hero =
    cards.find(
      (opened) =>
        opened.resultType === "NEW",
    ) ?? cards[0] ?? null;

  const previews = cards.map(
    (opened, index) => {
      const master = opened.master;
      const logo =
        master.category === "card"
          ? collectionLogoPath(master)
          : master.image;
      return `
        <article
          class="pack-reveal-card pack-reveal-card--${escapeAttribute(opened.resultType.toLowerCase())} ${master.category === "badge" ? "pack-reveal-card--badge" : "pack-reveal-card--card"}"
          style="--reveal-index:${index}"
        >
          <div
            class="pack-reveal-card__flare"
            aria-hidden="true"
          ></div>
          ${
            opened.resultType === "POWER_UP"
              ? `<img class="pack-reveal-card__rank-up-icon" src="icon/rankup.png" alt="">`
              : ""
          }
          <img
            class="pack-reveal-card__main"
            src="${escapeAttribute(master.image)}"
            alt=""
          >
          ${
            master.category === "card"
              ? `<img class="pack-reveal-card__logo" src="${escapeAttribute(logo)}" alt="">`
              : ""
          }
          <strong>${escapeHtml(master.category === "badge" ? master.teamName : (master.name ?? master.teamName))}</strong>
          <span>${escapeHtml(opened.resultType)}</span>
        </article>
      `;
    },
  ).join("");

  return `
    <section class="pack-opening-show pack-opening-show--stage">
      <div
        class="pack-opening-show__burst"
        aria-hidden="true"
      ></div>
      <section class="pack-opening-sequence ${result.type === "badge" ? "is-badge" : "is-card"}">
        <div class="pack-opening-sequence__spotlight" aria-hidden="true"></div>
        <div class="pack-opening-sequence__shockwave" aria-hidden="true"></div>
        <div class="pack-opening-sequence__pack">
          <img src="${escapeAttribute(result.packImage ?? "icon/back.png")}" alt="">
          <i class="pack-opening-sequence__seal"></i>
          <i class="pack-opening-sequence__tear pack-opening-sequence__tear--left"></i>
          <i class="pack-opening-sequence__tear pack-opening-sequence__tear--right"></i>
        </div>
        <div class="pack-opening-sequence__particles" aria-hidden="true">
          ${Array.from({ length: 12 }, (_, index) => `<i style="--particle-index:${index}"></i>`).join("")}
        </div>
        <span>PACK OPEN!</span>
        <h3>${escapeHtml(result.packName)}</h3>
        <small>${result.count === 1 ? "1 ITEM REVEAL" : `${formatNumber(result.count)} ITEMS REVEAL`}</small>
      </section>

      ${
        hero
          ? `
            <article class="pack-opening-hero ${hero.master.category === "badge" ? "pack-opening-hero--badge" : "pack-opening-hero--card"}">
              <div class="pack-opening-hero__rings" aria-hidden="true"></div>
              ${
                hero.resultType === "POWER_UP"
                  ? `<img class="pack-opening-hero__rank-up-icon" src="icon/rankup.png" alt="">`
                  : ""
              }
              <img src="${escapeAttribute(hero.master.image)}" alt="">
              <div>
                <span>${escapeHtml(hero.resultType)}</span>
                <strong>${escapeHtml(hero.master.category === "badge" ? hero.master.teamName : (hero.master.name ?? hero.master.teamName))}</strong>
                <small>OPENING HIGHLIGHT</small>
              </div>
            </article>
          `
          : ""
      }

      <div class="pack-opening-summary">
        <span>NEW <strong>${result.summary.newCount}</strong></span>
        <span>POWER UP <strong>${result.summary.powerUpCount}</strong></span>
        <span>CONVERT <strong>${result.summary.convertCount}</strong></span>
      </div>

      <div class="pack-reveal-grid pack-reveal-grid--square">
        ${previews}
      </div>

      ${
        result.results.length > 18
          ? `<small>ほか ${result.results.length - 18}件</small>`
          : ""
      }
    </section>
  `;
}

export function renderTrainingManagement(snapshot) {
  const badgeBonusRate =
    snapshot.collectionBonuses?.trainingPointRate ??
    0;
  const diningCoachBonusRate =
    snapshot.dining?.coachTrainingBonusRate ??
    0;
  const totalBonusRate =
    badgeBonusRate +
    diningCoachBonusRate;
  const tournamentWeek = getTournamentWeekStatus(snapshot);
  const notice = tournamentWeek.hasTournament
    ? `<section class="training-tournament-notice ${tournamentWeek.trainingBlocked ? "is-blocked" : "is-observer"}">
        <strong>${tournamentWeek.trainingBlocked ? "TOURNAMENT WEEK" : "TOURNAMENT NOTICE"}</strong>
        <p>${tournamentWeek.details.map((detail) =>
          detail.participationRequired
            ? `${detail.event.stageName}へ出場予定です。この週はトレーニングできません。`
            : String(detail.event.tournamentType).startsWith("casual_")
              ? `${detail.event.stageName}が開催されます。参加は任意です。`
              : `${detail.event.stageName}が開催されます。`
        ).join(" ")}</p>
      </section>`
    : "";

  for (const player of snapshot.playerTeam.members) {
    MANAGEMENT_VIEW_STATE.trainingSelections[player.playerId] ??=
      TRAINING_PROGRAMS[0].id;
  }

  return `
    ${notice}
    <section class="management-summary training-summary">
      <div class="training-bonus-ledger">
        <span>バッジ <strong>+${(badgeBonusRate * 100).toFixed(1)}%</strong></span>
        <span>コーチ食事 <strong>+${(diningCoachBonusRate * 100).toFixed(1)}%</strong></span>
        <span class="is-total">合計 <strong>+${(totalBonusRate * 100).toFixed(1)}%</strong></span>
      </div>
      <span>各選手のアイコンから練習を選択。コーチへ料理を提供した週は獲得ポイントが上昇します。</span>
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
      <div class="mobshop-welcome-sign"><span>WELCOME TO</span><strong>MOB SHOP</strong><small>商品カテゴリを選択してください</small></div>
    </section>
  `;

  if (category === "item") {
    categoryContent = `
      <section class="management-section">
        <div class="management-section__heading">
          <h2>ITEM</h2><span>タップ後、＋／−で購入数を選択</span>
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
              <button type="button" class="shop-category-product ${unlocked ? "" : "is-silhouette-locked"}" data-action="inspect-shop-pack" data-pack-type="card" data-pack-id="${escapeAttribute(pack.packId)}" ${unlocked ? "" : "disabled"}>
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
  } else if (category === "ingredient") {
    const weeklyIngredients =
      snapshot.cooking
        .weeklyIngredientStock
        .ingredientIds
        .map(getIngredient);
    categoryContent = `
      <section class="management-section cooking-shop-section">
        <div class="management-section__heading">
          <h2>今週の食材</h2>
          <span>${escapeHtml(snapshot.cooking.weeklyIngredientStock.message)}</span>
        </div>
        <div class="cooking-shop-grid">
          ${weeklyIngredients.map((ingredient) => `
            <button
              type="button"
              class="cooking-shop-product"
              data-action="inspect-cooking-ingredient"
              data-ingredient-id="${escapeAttribute(ingredient.ingredientId)}"
            >
              <img src="${escapeAttribute(ingredient.image)}" alt="">
              <strong>${escapeHtml(ingredient.name)}</strong>
              <small>${formatNumber(ingredient.priceCoin)} COIN</small>
              <em>所持 ×${formatNumber(snapshot.cooking.ingredientInventory[ingredient.ingredientId] ?? 0)}</em>
            </button>
          `).join("")}
        </div>
      </section>
    `;
  } else if (category === "utensil") {
    categoryContent = `
      <section class="management-section cooking-shop-section">
        <div class="management-section__heading">
          <h2>調理器具</h2>
          <span>同じ器具を複数所持できます</span>
        </div>
        <div class="cooking-shop-grid cooking-shop-grid--utensil">
          ${COOKING_UTENSIL_MASTER.map((utensil) => `
            <button
              type="button"
              class="cooking-shop-product cooking-shop-product--utensil"
              data-action="inspect-cooking-utensil"
              data-utensil-id="${escapeAttribute(utensil.utensilId)}"
              ${utensil.shopAvailable ? "" : "disabled"}
            >
              <i>${escapeHtml(cookingUtensilSymbol(utensil.utensilId))}</i>
              <strong>${escapeHtml(utensil.name)}</strong>
              <small>${utensil.shopAvailable ? `${formatNumber(utensil.priceCoin)} COIN` : "初期配布"}</small>
              <em>所持 ×${formatNumber(snapshot.cooking.utensilInventory[utensil.utensilId] ?? 0)}</em>
            </button>
          `).join("")}
        </div>
      </section>
    `;
  }

  return `
    <section class="mobshop-popup" style="--mobshop-bg:url('back/backshop.png')">
      <header class="mobshop-neon-header">
        <div class="mobshop-neon-header__title">
          <span>MOB RETAIL NETWORK</span>
          <strong>MOB SHOP</strong>
          <em>OPEN</em>
        </div>
        <section class="mobshop-header-clerk" aria-label="MOB SHOP店員">
          <img src="icon/pink.png" alt="モブピンク">
          <div>
            <span>モブピンク</span>
            <p>${escapeHtml(categoryDefinition?.dialogue ?? "いらっしゃいませ。商品棚をご案内します。")}</p>
          </div>
        </section>
      </header>
      <div class="mobshop-counter-light" aria-hidden="true"><i></i><i></i><i></i></div>
      <nav class="mobshop-category-grid" data-scroll-memory="mobshop-category-strip" aria-label="ショップカテゴリ">
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
  const totalPoints =
    calculateCoachTeamPoints(snapshot.coaches);
  const probabilities =
    getStrategyMeetingProbabilities(totalPoints);
  const rankIcon = (rank) =>
    `icon/tak${rank.toLowerCase()}.png`;

  return `
    <section class="coach-command-center">
      <div class="coach-command-center__core">
        <span>TACTICAL STAFF</span>
        <strong>COACH PT ${formatNumber(totalPoints)}</strong>
        <small>在籍 ${snapshot.coaches.length} / ${COACH_RULES.maximumCoachCount}</small>
      </div>
      <div class="coach-orbit">
        ${snapshot.coaches.map((coach, index) => {
          const rankData =
            getCoachRankData(coach.rank);
          return `
            <article class="coach-orbit__member" style="--coach-index:${index}">
              <img src="${escapeAttribute(coach.image)}" alt="">
              <span>${escapeHtml(coach.rank)}</span>
              <strong>${escapeHtml(coach.name ?? "初期コーチ")}</strong>
              <small>${rankData.points} PT</small>
            </article>
          `;
        }).join("")}
      </div>
    </section>

    <section class="content-panel strategy-meeting-panel strategy-meeting-panel--console">
      <header>
        <img src="menu/coach.png" alt="">
        <div>
          <span>TACTICAL BRIEFING</span>
          <h2>作戦会議</h2>
          <p>コーチPTで高ランク作戦の抽選率が上昇します。</p>
        </div>
      </header>
      <div class="strategy-probabilities">
        ${["C", "B", "A", "S", "SS"].map((rank) => `
          <span>
            <img src="${escapeAttribute(rankIcon(rank))}" alt="">
            <b>${rank}</b>
            <strong>${probabilities[rank].toFixed(1)}%</strong>
          </span>
        `).join("")}
      </div>
      <div class="strategy-meeting-panel__footer">
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
      </div>
    </section>

    <section class="content-panel owned-strategy-console">
      <header>
        <div>
          <span>OWNED STRATEGY</span>
          <h2>所持作戦</h2>
          <p>ランクアイコンをタップすると、そのランクの作戦一覧を表示します。</p>
        </div>
      </header>
      <div class="strategy-rank-launchers">
        ${STRATEGY_RANKS.map((rank) => {
          const strategies =
            getStrategiesByRank(rank);
          const ownedCount =
            rank === "D"
              ? strategies.length
              : strategies.reduce(
                  (sum, strategy) =>
                    sum +
                    (
                      snapshot.inventory
                        .strategies[strategy.id] ?? 0
                    ),
                  0,
                );
          return `
            <button
              type="button"
              data-action="inspect-strategy-rank"
              data-strategy-rank="${escapeAttribute(rank)}"
            >
              <img src="${escapeAttribute(rankIcon(rank))}" alt="${escapeAttribute(rank)}">
              <strong>${escapeHtml(rank)}</strong>
              <span>${rank === "D" ? "∞" : formatNumber(ownedCount)}</span>
            </button>
          `;
        }).join("")}
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

export function getCardPackCollectionStats(
  snapshot,
  packOrId,
) {
  const pack =
    typeof packOrId === "string"
      ? getCardPack(packOrId)
      : packOrId;
  const cards =
    getCardsForTeamIds(pack.teamIds);
  const ownedTypes =
    cards.filter((card) => {
      const record =
        snapshot.collections.cards?.[
          card.collectionId
        ];
      return (
        record === true ||
        record?.owned === true ||
        Number(record?.copies ?? 0) > 0
      );
    }).length;
  return {
    totalTypes: cards.length,
    ownedTypes,
    missingTypes:
      Math.max(0, cards.length - ownedTypes),
    completionRate:
      cards.length > 0
        ? ownedTypes / cards.length
        : 0,
  };
}

function cardPackCollectionStatsTemplate(
  snapshot,
  pack,
) {
  const stats =
    getCardPackCollectionStats(
      snapshot,
      pack,
    );
  return `
    <section class="card-pack-collection-stats">
      <div>
        <span>全収録種類</span>
        <strong>${formatNumber(stats.totalTypes)}種</strong>
      </div>
      <div>
        <span>所持種類</span>
        <strong>${formatNumber(stats.ownedTypes)}種</strong>
      </div>
      <div class="is-missing">
        <span>未所持種類</span>
        <strong>${formatNumber(stats.missingTypes)}種</strong>
      </div>
      <i><b style="width:${(stats.completionRate * 100).toFixed(2)}%"></b></i>
      <small>収録カードのコレクション進行度 ${Math.round(stats.completionRate * 100)}%</small>
    </section>
  `;
}

function packOpenButtons(type, packs, inventory) {
  return packs
    .filter((pack) => (inventory[pack.packId] ?? 0) > 0)
    .map((pack) => {
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
      <div><span>${type.toUpperCase()} PACK</span><h3>${escapeHtml(pack.name)}</h3><p>所持 ${formatNumber(count)}</p>${type === "card" ? cardPackCollectionStatsTemplate(snapshot, pack) : ""}</div>
      <div class="selected-pack-panel__actions">
        <button type="button" data-action="open-${type}-pack" data-pack-id="${escapeAttribute(packId)}" data-open-mode="one" ${count >= 1 ? "" : "disabled"}>1つ開封</button>
        <button type="button" data-action="open-${type}-pack" data-pack-id="${escapeAttribute(packId)}" data-open-mode="leave_one" ${count >= 2 ? "" : "disabled"}>1つ残して全て</button>
        <button type="button" data-action="open-${type}-pack" data-pack-id="${escapeAttribute(packId)}" data-open-mode="all" ${count >= 1 ? "" : "disabled"}>全て開封</button>
      </div>
    </section>
  `;
}

export function collectionFoodBookTemplate(snapshot) {
  const cooking =
    snapshot.cooking;
  const qualityId =
    FOOD_QUALITY_MASTER.some(
      (quality) =>
        quality.qualityId ===
        MANAGEMENT_VIEW_STATE
          .collectionFoodQuality,
    )
      ? MANAGEMENT_VIEW_STATE
          .collectionFoodQuality
      : "normal";
  MANAGEMENT_VIEW_STATE.collectionFoodQuality =
    qualityId;

  const pageSize =
    COOKING_RULES.storageBoxPageSize;
  const pageCount =
    Math.max(
      1,
      Math.ceil(
        RECIPE_MASTER.length /
        pageSize,
      ),
    );
  const page =
    Math.min(
      pageCount,
      Math.max(
        1,
        Math.floor(
          Number(
            MANAGEMENT_VIEW_STATE
              .collectionFoodPage,
          ) ||
          1,
        ),
      ),
    );
  MANAGEMENT_VIEW_STATE.collectionFoodPage =
    page;
  const quality =
    FOOD_QUALITY_MASTER.find(
      (entry) =>
        entry.qualityId ===
        qualityId,
    );
  const discoveredCount =
    RECIPE_MASTER.filter(
      (recipe) =>
        cooking.recipeDiscovery?.[
          recipe.recipeId
        ]?.qualityIds?.includes(
          qualityId,
        ),
    ).length;
  const visible =
    RECIPE_MASTER.slice(
      (page - 1) * pageSize,
      page * pageSize,
    );

  return `
    <section class="collection-food-file">
      <header class="collection-food-file__header">
        <button
          type="button"
          class="back-button"
          data-action="close-collection-file"
        >
          ← COLLECTION
        </button>
        <div>
          <img src="icon/kitbox.png" alt="">
          <span>COOKING COLLECTION</span>
          <strong>料理図鑑</strong>
        </div>
        <b>${discoveredCount} / ${RECIPE_MASTER.length}</b>
      </header>

      <nav class="cooking-quality-tabs" aria-label="料理品質">
        ${FOOD_QUALITY_MASTER.map((entry) => `
          <button
            type="button"
            class="is-${escapeAttribute(entry.qualityId)} ${qualityId === entry.qualityId ? "is-active" : ""}"
            data-action="select-collection-food-quality"
            data-quality-id="${escapeAttribute(entry.qualityId)}"
          >
            <span>${escapeHtml(entry.japaneseLabel)}</span>
            <small>${entry.qualityId === "normal" ? "NORMAL" : entry.qualityId.toUpperCase()}</small>
          </button>
        `).join("")}
      </nav>

      <section class="cooking-cookbook-grid collection-food-file__grid">
        ${Array.from(
          { length: pageSize },
          (_value, index) => {
            const recipe =
              visible[index];
            if (!recipe) {
              return `<div class="cooking-cookbook-card is-empty"></div>`;
            }
            const discovered =
              cooking.recipeDiscovery?.[
                recipe.recipeId
              ]?.qualityIds?.includes(
                qualityId,
              ) === true;
            const variant =
              createFoodVariant(
                recipe,
                qualityId,
              );
            return `
              <button
                type="button"
                class="cooking-cookbook-card is-${escapeAttribute(qualityId)} ${discovered ? "is-discovered" : "is-undiscovered"}"
                data-action="inspect-cookbook-food"
                data-recipe-id="${escapeAttribute(recipe.recipeId)}"
                data-quality-id="${escapeAttribute(qualityId)}"
              >
                <b>No.${String(recipe.number).padStart(3, "0")}</b>
                <div>
                  <img src="${escapeAttribute(recipe.image)}" alt="">
                  ${discovered ? "" : "<i>?</i>"}
                </div>
                <span>${escapeHtml(variant.rank)} / ${escapeHtml(quality.japaneseLabel)}</span>
                <strong>${discovered ? escapeHtml(variant.name) : "？？？？"}</strong>
              </button>
            `;
          },
        ).join("")}
      </section>

      <footer class="cooking-page-controls">
        <button
          type="button"
          data-action="change-collection-food-page"
          data-page="${page - 1}"
          ${page <= 1 ? "disabled" : ""}
        >
          ←
        </button>
        <strong>${page} / ${pageCount}</strong>
        <button
          type="button"
          data-action="change-collection-food-page"
          data-page="${page + 1}"
          ${page >= pageCount ? "disabled" : ""}
        >
          →
        </button>
      </footer>
    </section>
  `;
}

export function renderCollectionManagement(snapshot) {
  const cardCompletion = getCollectionCompletion(snapshot.collections.cards, "card");
  const badgeCompletion = getCollectionCompletion(snapshot.collections.badges, "badge");
  const fileType = MANAGEMENT_VIEW_STATE.collectionFile;
  const allCards = allCollectionEntries(snapshot, "card");
  const allBadges = allCollectionEntries(snapshot, "badge");

  if (fileType === "food") {
    return `
      <div class="management-live-section" data-live-section="collection">
        ${collectionFoodBookTemplate(snapshot)}
      </div>
    `;
  }

  if (fileType === "card" || fileType === "badge") {
    return `
      <div class="management-live-section" data-live-section="collection">
      <section class="collection-file-view">
        <header>
          <button type="button" class="back-button" data-action="close-collection-file">← COLLECTION</button>
          <div><img src="${fileType === "card" ? "icon/cardf.png" : "icon/bagif.png"}" alt=""><strong>${fileType === "card" ? "CARD FILE" : "BADGE FILE"}</strong></div>
        </header>
        ${collectionFilePages(fileType === "card" ? allCards : allBadges, fileType)}
      </section>
      </div>
    `;
  }

  const trophies =
    Array.isArray(
      snapshot.collections.trophies,
    )
      ? snapshot.collections.trophies
      : [];

  return `
    <div class="management-live-section" data-live-section="collection">
    <section class="collection-file-launchers">
      <button type="button" data-action="open-collection-file" data-file-type="card">
        <img src="icon/cardf.png" alt=""><strong>CARD FILE</strong><span>${cardCompletion.ownedCount}/${cardCompletion.totalCount}</span>
      </button>
      <button type="button" data-action="open-collection-file" data-file-type="badge">
        <img src="icon/bagif.png" alt=""><strong>BADGE FILE</strong><span>${badgeCompletion.ownedCount}/${badgeCompletion.totalCount}</span>
      </button>
      <button type="button" data-action="open-collection-file" data-file-type="food">
        <img src="icon/kitbox.png" alt=""><strong>FOOD BOOK</strong><span>${Object.values(snapshot.cooking.recipeDiscovery ?? {}).filter((entry) => (entry.qualityIds ?? []).length > 0).length}/${RECIPE_MASTER.length}</span>
      </button>
    </section>
    <section class="collection-completion-grid">
      <article><img src="icon/card.png" alt=""><strong>CARD ${cardCompletion.ownedCount} / ${cardCompletion.totalCount}</strong><span>週間COIN +${((snapshot.collectionBonuses.weeklyCoinRate ?? 0) * 100).toFixed(1)}%</span></article>
      <article><img src="icon/bagi.png" alt=""><strong>BADGE ${badgeCompletion.ownedCount} / ${badgeCompletion.totalCount}</strong><span>TRAINING +${((snapshot.collectionBonuses.trainingPointRate ?? 0) * 100).toFixed(1)}%</span></article>
    </section>
    <section class="collection-trophy-case">
      <header>
        <img src="prize/01.png" alt="">
        <div>
          <span>CASUAL CUP COLLECTION</span>
          <strong>TROPHY CASE</strong>
          <small>Top 3入賞で獲得した大会トロフィー</small>
        </div>
        <b>${trophies.length}</b>
      </header>
      ${
        trophies.length > 0
          ? `
            <div class="collection-trophy-strip">
              ${trophies
                .slice()
                .reverse()
                .map(
                  (trophy) => `
                    <article>
                      <div class="collection-trophy-spotlight" aria-hidden="true"></div>
                      <img src="${escapeAttribute(trophy.image)}" alt="">
                      <span>${trophy.place} PLACE</span>
                      <strong>${escapeHtml(trophy.cupName)}</strong>
                      <small>
                        ${trophy.acquiredAt?.year ?? "-"}年
                        ${trophy.acquiredAt?.month ?? "-"}月
                        第${trophy.acquiredAt?.week ?? "-"}週
                      </small>
                    </article>
                  `,
                )
                .join("")}
            </div>
          `
          : `
            <div class="collection-trophy-empty">
              <img src="prize/01.png" alt="">
              <strong>トロフィーはまだありません</strong>
              <span>カジュアルカップでTop 3を目指しましょう</span>
            </div>
          `
      }
    </section>
    <section class="management-section"><h2>カードパック</h2><div class="pack-icon-strip">${packOpenButtons("card", CARD_PACKS, snapshot.inventory.cardPacks)}</div></section>
    <section class="management-section"><h2>バッジパック</h2><div class="pack-icon-strip">${packOpenButtons("badge", BADGE_PACKS, snapshot.inventory.badgePacks)}</div></section>
    ${selectedPackPanel(snapshot)}
    </div>
  `;
}

const FOOD_RANK_ORDER = Object.freeze({
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  S: 5,
  SS: 6,
});

function deterministicTextIndex(
  value,
  length,
) {
  let hash = 2166136261;
  for (
    const character
    of String(value ?? "")
  ) {
    hash ^=
      character.codePointAt(0);
    hash =
      Math.imul(
        hash,
        16777619,
      );
  }
  return (
    Math.abs(hash) %
    Math.max(
      1,
      length,
    )
  );
}

function cookingNavigationTemplate(
  activeView,
) {
  const items = [
    {
      view: "kitchen",
      label: "調理場",
      icon: "icon/kitbox.png",
    },
    {
      view: "storage",
      label: "保存ボックス",
      icon:
        COOKING_SCREEN_ASSETS
          .storageBoxIcon,
    },
    {
      view: "cookbook",
      label: "料理図鑑",
      icon: "menu/COL.png",
    },
    {
      view: "dining",
      label: "食堂",
      icon: "icon/pink.png",
    },
  ];
  return `
    <nav
      class="cooking-subnav"
      aria-label="料理施設"
    >
      ${items.map((item) => `
        <button
          type="button"
          class="${activeView === item.view ? "is-active" : ""}"
          data-action="switch-cooking-view"
          data-cooking-view="${escapeAttribute(item.view)}"
        >
          <img
            src="${escapeAttribute(item.icon)}"
            alt=""
          >
          <span>${escapeHtml(item.label)}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function cookingStorageEntries(
  cooking,
) {
  const records =
    Object.values(
      cooking.foodInventory ??
      {},
    )
      .filter(
        (record) =>
          Number(
            record.quantity ??
            0,
          ) > 0,
      )
      .map(
        (record) => {
          const recipe =
            getRecipe(
              record.recipeId,
            );
          const variant =
            createFoodVariant(
              recipe,
              record.qualityId,
            );
          return {
            ...record,
            recipe,
            variant,
          };
        },
      );

  const mode =
    cooking.storageBox
      ?.sortMode ??
    "cookedAt";
  records.sort(
    (left, right) => {
      if (
        mode ===
        "number"
      ) {
        return (
          left.recipe.number -
            right.recipe.number ||
          FOOD_QUALITY_MASTER.findIndex(
            (quality) =>
              quality.qualityId ===
              left.qualityId,
          ) -
            FOOD_QUALITY_MASTER.findIndex(
              (quality) =>
                quality.qualityId ===
                right.qualityId,
            )
        );
      }
      if (
        mode ===
        "rarity"
      ) {
        return (
          (
            FOOD_RANK_ORDER[
              right.variant.rank
            ] ??
            0
          ) -
            (
              FOOD_RANK_ORDER[
                left.variant.rank
              ] ??
              0
            ) ||
          right.recipe.number -
            left.recipe.number
        );
      }
      if (
        mode ===
        "quantity"
      ) {
        return (
          Number(
            right.quantity ??
            0,
          ) -
            Number(
              left.quantity ??
              0,
            ) ||
          right.lastSequence -
            left.lastSequence
        );
      }
      return (
        Number(
          right.lastSequence ??
          0,
        ) -
          Number(
            left.lastSequence ??
            0,
          ) ||
        right.recipe.number -
          left.recipe.number
      );
    },
  );
  return records;
}

export function renderCookingStorage(
  snapshot,
) {
  const cooking =
    snapshot.cooking;
  const entries =
    cookingStorageEntries(
      cooking,
    );
  const pageSize =
    COOKING_RULES
      .storageBoxPageSize;
  const pageCount =
    Math.max(
      1,
      Math.ceil(
        entries.length /
        pageSize,
      ),
    );
  const requestedPage =
    Math.max(
      1,
      Math.floor(
        Number(
          cooking.storageBox?.page,
        ) ||
        1,
      ),
    );
  const page =
    Math.min(
      pageCount,
      requestedPage,
    );
  const visible =
    entries.slice(
      (
        page -
        1
      ) *
        pageSize,
      page *
        pageSize,
    );
  const modes = [
    [
      "number",
      "No.",
    ],
    [
      "rarity",
      "レア度",
    ],
    [
      "quantity",
      "所持数",
    ],
    [
      "cookedAt",
      "調理順",
    ],
  ];

  return `
    <section
      class="cooking-storage-screen"
      style="--storage-background:url('${escapeAttribute(COOKING_SCREEN_ASSETS.kitchenBackground)}')"
    >
      <header class="cooking-screen-heading">
        <img
          src="${escapeAttribute(COOKING_SCREEN_ASSETS.storageBoxIcon)}"
          alt=""
        >
        <div>
          <span>FOOD STORAGE BOX</span>
          <h1>保存ボックス</h1>
          <p>通常・高級・伝説を別々の料理として保管します。</p>
        </div>
        <strong>${formatNumber(foodInventoryCount(cooking))} FOOD</strong>
      </header>

      ${cookingNavigationTemplate("storage")}

      <section class="cooking-storage-sort">
        <span>SORT</span>
        <div>
          ${modes.map(([mode, label]) => `
            <button
              type="button"
              class="${cooking.storageBox?.sortMode === mode ? "is-active" : ""}"
              data-action="set-cooking-storage-sort"
              data-sort-mode="${mode}"
            >
              ${label}
            </button>
          `).join("")}
        </div>
      </section>

      <section
        class="cooking-storage-grid"
        aria-label="保存ボックス ${page}ページ"
      >
        ${Array.from(
          {
            length:
              pageSize,
          },
          (_value, index) => {
            const entry =
              visible[index];
            const absoluteIndex =
              (
                page -
                1
              ) *
                pageSize +
              index +
              1;
            if (!entry) {
              return `
                <div class="cooking-storage-slot is-empty">
                  <b>${String(absoluteIndex).padStart(3, "0")}</b>
                </div>
              `;
            }
            return `
              <button
                type="button"
                class="cooking-storage-slot is-${escapeAttribute(entry.qualityId)}"
                data-action="inspect-stored-food"
                data-variant-key="${escapeAttribute(entry.variantKey)}"
              >
                <b>No.${String(entry.recipe.number).padStart(3, "0")}</b>
                <img
                  src="${escapeAttribute(entry.variant.image)}"
                  alt=""
                >
                <span>${escapeHtml(entry.variant.rank)} / ${escapeHtml(entry.variant.qualityLabel)}</span>
                <strong>${escapeHtml(entry.variant.name)}</strong>
                <em>×${formatNumber(entry.quantity)}</em>
                <small>調理順 ${formatNumber(entry.lastSequence)}</small>
              </button>
            `;
          },
        ).join("")}
      </section>

      <footer class="cooking-page-controls">
        <button
          type="button"
          data-action="change-cooking-storage-page"
          data-page="${page - 1}"
          ${page <= 1 ? "disabled" : ""}
        >
          ←
        </button>
        <strong>${page} / ${pageCount}</strong>
        <button
          type="button"
          data-action="change-cooking-storage-page"
          data-page="${page + 1}"
          ${page >= pageCount ? "disabled" : ""}
        >
          →
        </button>
      </footer>
    </section>
  `;
}

export function renderCookingCookbook(
  snapshot,
) {
  const cooking =
    snapshot.cooking;
  const qualityId =
    FOOD_QUALITY_MASTER.some(
      (quality) =>
        quality.qualityId ===
        MANAGEMENT_VIEW_STATE
          .cookingCookbookQuality,
    )
      ? MANAGEMENT_VIEW_STATE
          .cookingCookbookQuality
      : "normal";
  MANAGEMENT_VIEW_STATE.cookingCookbookQuality =
    qualityId;
  const pageSize =
    COOKING_RULES
      .storageBoxPageSize;
  const pageCount =
    Math.max(
      1,
      Math.ceil(
        RECIPE_MASTER.length /
        pageSize,
      ),
    );
  const page =
    Math.min(
      pageCount,
      Math.max(
        1,
        Math.floor(
          Number(
            MANAGEMENT_VIEW_STATE
              .cookingCookbookPage,
          ) ||
          1,
        ),
      ),
    );
  MANAGEMENT_VIEW_STATE.cookingCookbookPage =
    page;
  const visible =
    RECIPE_MASTER.slice(
      (
        page -
        1
      ) *
        pageSize,
      page *
        pageSize,
    );
  const quality =
    FOOD_QUALITY_MASTER.find(
      (entry) =>
        entry.qualityId ===
        qualityId,
    );
  const discoveredCount =
    RECIPE_MASTER.filter(
      (recipe) =>
        cooking.recipeDiscovery?.[
          recipe.recipeId
        ]?.qualityIds?.includes(
          qualityId,
        ),
    ).length;

  return `
    <section
      class="cooking-cookbook-screen"
      style="--cookbook-background:url('${escapeAttribute(COOKING_SCREEN_ASSETS.kitchenBackground)}')"
    >
      <header class="cooking-screen-heading">
        <img src="menu/COL.png" alt="">
        <div>
          <span>COOKING COLLECTION</span>
          <h1>料理図鑑</h1>
          <p>作った料理だけが図鑑へ登録されます。</p>
        </div>
        <strong>${discoveredCount} / ${RECIPE_MASTER.length}</strong>
      </header>

      ${cookingNavigationTemplate("cookbook")}

      <nav class="cooking-quality-tabs" aria-label="料理品質">
        ${FOOD_QUALITY_MASTER.map((entry) => `
          <button
            type="button"
            class="is-${escapeAttribute(entry.qualityId)} ${qualityId === entry.qualityId ? "is-active" : ""}"
            data-action="select-cooking-cookbook-quality"
            data-quality-id="${escapeAttribute(entry.qualityId)}"
          >
            <span>${escapeHtml(entry.japaneseLabel)}</span>
            <small>${entry.qualityId === "normal" ? "NORMAL" : entry.qualityId.toUpperCase()}</small>
          </button>
        `).join("")}
      </nav>

      <section class="cooking-cookbook-grid">
        ${Array.from(
          {
            length:
              pageSize,
          },
          (_value, index) => {
            const recipe =
              visible[index];
            if (!recipe) {
              return `<div class="cooking-cookbook-card is-empty"></div>`;
            }
            const discovered =
              cooking.recipeDiscovery?.[
                recipe.recipeId
              ]?.qualityIds?.includes(
                qualityId,
              ) === true;
            const variant =
              createFoodVariant(
                recipe,
                qualityId,
              );
            return `
              <button
                type="button"
                class="cooking-cookbook-card is-${escapeAttribute(qualityId)} ${discovered ? "is-discovered" : "is-undiscovered"}"
                data-action="inspect-cookbook-food"
                data-recipe-id="${escapeAttribute(recipe.recipeId)}"
                data-quality-id="${escapeAttribute(qualityId)}"
              >
                <b>No.${String(recipe.number).padStart(3, "0")}</b>
                <div>
                  <img
                    src="${escapeAttribute(recipe.image)}"
                    alt=""
                  >
                  ${discovered ? "" : "<i>?</i>"}
                </div>
                <span>${escapeHtml(variant.rank)} / ${escapeHtml(quality.japaneseLabel)}</span>
                <strong>${discovered ? escapeHtml(variant.name) : "？？？？"}</strong>
              </button>
            `;
          },
        ).join("")}
      </section>

      <footer class="cooking-page-controls">
        <button
          type="button"
          data-action="change-cooking-cookbook-page"
          data-page="${page - 1}"
          ${page <= 1 ? "disabled" : ""}
        >
          ←
        </button>
        <strong>${page} / ${pageCount}</strong>
        <button
          type="button"
          data-action="change-cooking-cookbook-page"
          data-page="${page + 1}"
          ${page >= pageCount ? "disabled" : ""}
        >
          →
        </button>
      </footer>
    </section>
  `;
}

function diningCharacterRecord(
  entry,
  type,
  index,
) {
  if (!entry) {
    return null;
  }
  return {
    characterId:
      entry.playerId ??
      entry.coachId ??
      entry.employeeId ??
      `${type}-${index}`,
    name:
      entry.name ??
      `${type} ${index + 1}`,
    image:
      entry.image ??
      "",
    role:
      entry.role ??
      (
        type ===
        "coach"
          ? "COACH"
          : "STAFF"
      ),
    type,
  };
}

function diningCharacterSource(
  snapshot,
  type,
  characterId,
) {
  const source =
    type === "player"
      ? snapshot.playerTeam.members.find(
          (entry) =>
            entry.playerId === characterId,
        )
      : type === "coach"
        ? (snapshot.coaches ?? []).find(
            (entry) =>
              entry.coachId === characterId,
          )
        : (snapshot.employees ?? []).find(
            (entry) =>
              entry.employeeId === characterId,
          );
  return source
    ? diningCharacterRecord(
        source,
        type,
        0,
      )
    : null;
}

function diningAvailableFoodEntries(
  snapshot,
) {
  return Object.values(
    snapshot.cooking.foodInventory ?? {},
  )
    .filter(
      (record) =>
        Number(record.quantity ?? 0) > 0,
    )
    .map(
      (record) => {
        const variant =
          createFoodVariant(
            record.recipeId,
            record.qualityId,
          );
        return {
          ...record,
          ...variant,
          number:
            getRecipe(record.recipeId).number,
        };
      },
    )
    .sort(
      (left, right) =>
        (FOOD_RANK_ORDER[right.rank] ?? 0) -
          (FOOD_RANK_ORDER[left.rank] ?? 0) ||
        left.number - right.number ||
        left.name.localeCompare(right.name),
    );
}

function diningMealPhase(
  meal,
  now = Date.now(),
) {
  if (!meal) {
    return "hungry";
  }
  if (
    now >=
    new Date(meal.readyAt).getTime()
  ) {
    return "finished";
  }
  return "eating";
}

function diningEffectDescription(
  characterType,
  foods,
) {
  if (characterType === "player") {
    return "料理ランクごとにやる気上昇を3回判定します。";
  }
  if (characterType === "coach") {
    const rate =
      foods.reduce(
        (sum, food) => {
          const value = {
            D: 0.05,
            C: 0.10,
            B: 0.15,
            A: 0.20,
            S: 0.30,
            SS: 0.50,
          }[food.rank] ?? 0;
          return sum + value;
        },
        0,
      ) /
      Math.max(1, foods.length);
    return `今週のトレーニング獲得量 +${(rate * 100).toFixed(1)}%。複数コーチ分は加算されます。`;
  }
  return "料理ランクに応じた料理ポイントを3品分獲得します。";
}

function renderDiningSeat(
  character,
  seatIndex,
  snapshot,
) {
  if (!character) {
    return `
      <div class="dining-seat is-empty">
        <i></i>
      </div>
    `;
  }

  const meal =
    snapshot.dining?.activeMeals?.[
      character.characterId
    ] ?? null;
  const completed =
    snapshot.dining?.completedCharacterIds?.includes(
      character.characterId,
    ) === true;
  if (completed && !meal) {
    return `
      <div class="dining-seat is-finished">
        <i></i>
      </div>
    `;
  }

  const phase =
    diningMealPhase(meal);
  const speechMaster =
    phase === "eating"
      ? DINING_EATING_SPEECHES
      : DINING_HUNGRY_SPEECHES;
  const speech =
    phase === "finished"
      ? "ごちそうさまでした！"
      : speechMaster[
          deterministicTextIndex(
            `${snapshot.dining?.weekKey}-${character.characterId}-${seatIndex}-${phase}`,
            speechMaster.length,
          )
        ];
  const tagName =
    meal
      ? "div"
      : "button";
  const actionAttributes =
    meal
      ? ""
      : `data-action="inspect-dining-character" data-character-id="${escapeAttribute(character.characterId)}" data-character-type="${escapeAttribute(character.type)}"`;
  const remaining =
    meal
      ? Math.max(
          0,
          Math.ceil(
            (
              new Date(meal.readyAt).getTime() -
              Date.now()
            ) /
            1000,
          ),
        )
      : 0;

  return `
    <${tagName}
      ${tagName === "button" ? 'type="button"' : ""}
      class="dining-seat has-character is-${escapeAttribute(phase)}"
      style="--bubble-delay:${(-0.7 * deterministicTextIndex(`${snapshot.dining?.weekKey}-${character.characterId}-bubble`, 9)).toFixed(1)}s;--bubble-duration:${(4.2 + deterministicTextIndex(`${character.characterId}-duration`, 5) * 0.55).toFixed(2)}s"
      ${actionAttributes}
    >
      <div class="dining-seat__character">
        <span class="dining-hungry-bubble">${escapeHtml(speech)}</span>
        <img
          src="${escapeAttribute(character.image)}"
          data-character-portrait
          data-role="${escapeAttribute(character.role)}"
          alt=""
        >
        <strong>${escapeHtml(character.name)}</strong>
        <small>${escapeHtml(character.role)}</small>
      </div>
      <div class="dining-round-chair"></div>
      ${
        meal
          ? `
            <div class="dining-seat__meal">
              ${meal.foods.map((food) => `
                <img
                  src="${escapeAttribute(food.image)}"
                  alt="${escapeAttribute(food.name)}"
                >
              `).join("")}
              <b
                data-dining-countdown
                data-phase="${escapeAttribute(phase)}"
                data-ready-at="${escapeAttribute(meal.readyAt)}"
                data-clear-at="${escapeAttribute(meal.clearAt)}"
              >${phase === "finished" ? "FINISH" : `${remaining}s`}</b>
            </div>
          `
          : ""
      }
    </${tagName}>
  `;
}

function renderDiningSelectionPanel(
  snapshot,
  character,
) {
  if (!character) {
    return `
      <aside class="dining-selection-panel is-empty">
        <strong>キャラクターをタップ</strong>
        <span>今週まだ食事をしていないキャラクターへ、異なる料理を3品選んでください。</span>
      </aside>
    `;
  }

  const foods =
    diningAvailableFoodEntries(snapshot);
  const selectedKeys =
    MANAGEMENT_VIEW_STATE
      .diningSelectedFoods;
  const selectedFoods =
    selectedKeys
      .map(
        (key) =>
          foods.find(
            (food) =>
              food.variantKey === key,
          ),
      )
      .filter(Boolean);

  return `
    <aside class="dining-selection-panel">
      <header>
        <img
          src="${escapeAttribute(character.image)}"
          data-character-portrait
          data-role="${escapeAttribute(character.role)}"
          alt=""
        >
        <div>
          <span>${escapeHtml(character.type.toUpperCase())}</span>
          <strong>${escapeHtml(character.name)}</strong>
          <small>異なる料理を3品選択</small>
        </div>
        <button
          type="button"
          data-action="cancel-dining-selection"
        >閉じる</button>
      </header>

      <div class="dining-selected-dishes">
        ${Array.from(
          { length: DINING_RULES.dishesPerMeal },
          (_value, index) => {
            const food =
              selectedFoods[index];
            return food
              ? `
                <button
                  type="button"
                  data-action="toggle-dining-food"
                  data-variant-key="${escapeAttribute(food.variantKey)}"
                >
                  <img src="${escapeAttribute(food.image)}" alt="">
                  <strong>${escapeHtml(food.name)}</strong>
                  <small>${escapeHtml(food.rank)} RANK</small>
                </button>
              `
              : `
                <div class="is-empty">
                  <b>${index + 1}</b>
                  <span>料理</span>
                </div>
              `;
          },
        ).join("")}
      </div>

      <div
        class="dining-food-shelf"
        data-scroll-memory="dining-food-shelf"
      >
        ${
          foods.length > 0
            ? foods.map((food) => {
                const selected =
                  selectedKeys.includes(
                    food.variantKey,
                  );
                const duplicateRecipe =
                  selectedFoods.some(
                    (selectedFood) =>
                      selectedFood.recipeId ===
                        food.recipeId &&
                      selectedFood.variantKey !==
                        food.variantKey,
                  );
                return `
                  <button
                    type="button"
                    class="${selected ? "is-selected" : ""}"
                    data-action="toggle-dining-food"
                    data-variant-key="${escapeAttribute(food.variantKey)}"
                    ${duplicateRecipe && !selected ? "disabled" : ""}
                  >
                    <img src="${escapeAttribute(food.image)}" alt="">
                    <span>${escapeHtml(food.qualityLabel)}</span>
                    <strong>${escapeHtml(food.name)}</strong>
                    <small>${escapeHtml(food.rank)} / ×${formatNumber(food.quantity)}</small>
                  </button>
                `;
              }).join("")
            : `
              <p>保存ボックスに料理がありません。キッチンで料理を作ってください。</p>
            `
        }
      </div>

      <div class="dining-selection-panel__effect">
        ${escapeHtml(diningEffectDescription(character.type, selectedFoods))}
      </div>
      <button
        type="button"
        class="primary-button dining-serve-button"
        data-action="serve-dining-meal"
        ${selectedFoods.length === DINING_RULES.dishesPerMeal ? "" : "disabled"}
      >
        3品を提供する
      </button>
    </aside>
  `;
}

export function renderCookingDining(
  snapshot,
) {
  const players =
    snapshot.playerTeam.members.map(
      (entry, index) =>
        diningCharacterRecord(
          entry,
          "player",
          index,
        ),
    );
  const coaches =
    (snapshot.coaches ?? []).map(
      (entry, index) =>
        diningCharacterRecord(
          entry,
          "coach",
          index,
        ),
    );
  const employees =
    (snapshot.employees ?? []).map(
      (entry, index) =>
        diningCharacterRecord(
          entry,
          "employee",
          index,
        ),
    );
  const tables = [
    {
      tableId: "player",
      label: "PLAYER TABLE",
      seats: [
        players[0],
        players[1],
        players[2],
      ],
    },
    {
      tableId: "coach-a",
      label: "COACH TABLE 1",
      seats: [
        coaches[0],
        coaches[1],
      ],
    },
    {
      tableId: "coach-b",
      label: "COACH TABLE 2",
      seats: [
        coaches[2],
        coaches[3],
      ],
    },
    {
      tableId: "staff-a",
      label: "STAFF TABLE 1",
      seats: [
        employees[0],
        employees[1],
      ],
    },
    {
      tableId: "staff-b",
      label: "STAFF TABLE 2",
      seats: [
        employees[2],
        employees[3],
        employees[4],
      ],
    },
  ];
  const selectedCharacter =
    diningCharacterSource(
      snapshot,
      MANAGEMENT_VIEW_STATE
        .diningSelectedCharacterType,
      MANAGEMENT_VIEW_STATE
        .diningSelectedCharacterId,
    );
  const completedCount =
    snapshot.dining
      ?.completedCharacterIds
      ?.length ?? 0;

  return `
    <section
      class="cooking-dining-screen ${selectedCharacter ? "has-modal-open" : ""}"
      style="--dining-background:url('${escapeAttribute(assetPath(COOKING_SCREEN_ASSETS.cafeteriaBackground))}')"
    >
      <img class="cooking-screen-background" src="${escapeAttribute(assetPath(COOKING_SCREEN_ASSETS.cafeteriaBackground))}" alt="">
      <header class="cooking-screen-heading cooking-screen-heading--dining">
        <img src="icon/pink.png" alt="">
        <div>
          <span>MOB DINING ROOM</span>
          <h1>食堂</h1>
          <p>1人につき週1回、異なる料理を3品提供できます。</p>
        </div>
        <strong>${formatNumber(completedCount)} FED</strong>
      </header>

      ${cookingNavigationTemplate("dining")}

      <div class="dining-modal-host">
        ${
          selectedCharacter
            ? `
              <button type="button" class="dining-modal-backdrop" data-action="cancel-dining-selection" aria-label="閉じる"></button>
              ${renderDiningSelectionPanel(snapshot, selectedCharacter)}
            `
            : ""
        }
      </div>

      <section class="dining-room-stage">
        <div class="dining-table-list">
          ${tables.map((table) => `
            <article class="dining-long-table dining-long-table--${escapeAttribute(table.tableId)}">
              <span>${escapeHtml(table.label)}</span>
              <div class="dining-table-seats">
                ${table.seats.map((seat, index) =>
                  renderDiningSeat(
                    seat,
                    index,
                    snapshot,
                  )
                ).join("")}
              </div>
              <div class="dining-table-surface"></div>
            </article>
          `).join("")}
        </div>
      </section>
    </section>
  `;
}

export function renderCookingManagement(
  snapshot,
) {
  const activeView =
    MANAGEMENT_VIEW_STATE
      .cookingView ??
    "kitchen";
  if (
    activeView ===
    "storage"
  ) {
    return renderCookingStorage(
      snapshot,
    );
  }
  if (
    activeView ===
    "cookbook"
  ) {
    return renderCookingCookbook(
      snapshot,
    );
  }
  if (
    activeView ===
    "dining"
  ) {
    return renderCookingDining(
      snapshot,
    );
  }

  const cooking =
    snapshot.cooking;
  const now =
    new Date();
  const selectedSlot =
    Number.isInteger(
      MANAGEMENT_VIEW_STATE
        .cookingSelectedSlot,
    ) &&
    MANAGEMENT_VIEW_STATE
      .cookingSelectedSlot >= 0 &&
    MANAGEMENT_VIEW_STATE
      .cookingSelectedSlot <
      COOKING_RULES.utensilSlotCount
      ? MANAGEMENT_VIEW_STATE
          .cookingSelectedSlot
      : 0;
  MANAGEMENT_VIEW_STATE.cookingSelectedSlot =
    selectedSlot;

  const selectedUtensilId =
    cooking.utensilSlots[
      selectedSlot
    ];
  const selectedJob =
    cooking.activeJobs[
      selectedSlot
    ];
  const selectedIngredientIds =
    selectedCookingIngredients();
  const recipeGuides =
    cookingRecipeGuideEntries(
      snapshot,
      selectedIngredientIds,
    );
  const recipeCandidates =
    selectedIngredientIds.length > 0 &&
    selectedUtensilId &&
    !selectedJob
      ? getRecipeCandidates(
          selectedIngredientIds,
          {
            companyRank:
              snapshot.company.rank,
            includeLocked:
              true,
            utensilId:
              selectedUtensilId,
          },
        )
      : [];
  const pickerSlot =
    MANAGEMENT_VIEW_STATE
      .cookingIngredientPickerSlot;
  const selectedCounts =
    MANAGEMENT_VIEW_STATE
      .cookingIngredientSlots
      .reduce(
        (record, ingredientId) => {
          if (ingredientId) {
            record[ingredientId] =
              (
                record[ingredientId] ??
                0
              ) +
              1;
          }
          return record;
        },
        {},
      );
  const ownedIngredients =
    INGREDIENT_MASTER.filter(
      (ingredient) =>
        (
          cooking
            .ingredientInventory[
              ingredient.ingredientId
            ] ??
          0
        ) > 0,
    );
  const placedCounts =
    cooking.utensilSlots.reduce(
      (record, utensilId) => {
        if (utensilId) {
          record[utensilId] =
            (
              record[utensilId] ??
              0
            ) +
            1;
        }
        return record;
      },
      {},
    );
  const activeCount =
    cooking.activeJobs.filter(
      Boolean,
    ).length;
  const readyCount =
    cooking.activeJobs.filter(
      (job) =>
        job &&
        isCookingJobReady(
          job,
          now,
        ),
    ).length;

  return `
    <section
      class="cooking-kitchen ${MANAGEMENT_VIEW_STATE.cookingPopupOpen ? "has-modal-open" : ""}"
      style="--kitchen-background:url('${escapeAttribute(assetPath(COOKING_SCREEN_ASSETS.kitchenBackground))}')"
      data-cooking-kitchen
    >
      <img class="cooking-screen-background" src="${escapeAttribute(assetPath(COOKING_SCREEN_ASSETS.kitchenBackground))}" alt="">
      <header class="cooking-kitchen__header">
        <div>
          <span>MOB KITCHEN SYSTEM</span>
          <h1>調理場</h1>
          <p>調理器具を配置し、最大5つの食材から料理を作ります。</p>
        </div>
        <div class="cooking-kitchen__status">
          <strong>${activeCount} COOKING</strong>
          <em>${readyCount} READY</em>
        </div>
      </header>

      ${cookingNavigationTemplate("kitchen")}

      <section class="cooking-utensil-board">
        <header>
          <span>COOKING UTENSIL GRID</span>
          <strong>調理器具 5 × 3</strong>
          <small>空き枠をタップして器具を配置</small>
        </header>
        <div class="cooking-utensil-grid">
          ${cooking.utensilSlots.map((utensilId, slotIndex) => {
            const job =
              cooking.activeJobs[
                slotIndex
              ];
            const selected =
              selectedSlot ===
              slotIndex;
            const ready =
              job &&
              isCookingJobReady(
                job,
                now,
              );
            const recipe =
              job
                ? getRecipe(
                    job.recipeId,
                  )
                : null;
            const remaining =
              job &&
              !ready
                ? getCookingJobRemainingSeconds(
                    job,
                    now,
                  )
                : 0;
            return `
              <button
                type="button"
                class="cooking-utensil-slot ${selected ? "is-selected" : ""} ${job ? "is-working" : ""} ${ready ? "is-ready" : ""} ${utensilId ? "has-utensil" : "is-empty"}"
                data-action="${ready ? "collect-cooking-job" : "select-cooking-slot"}"
                data-slot-index="${slotIndex}"
              >
                <b>${String(slotIndex + 1).padStart(2, "0")}</b>
                ${
                  utensilId
                    ? `
                      <div class="cooking-utensil-visual">
                        <i>${escapeHtml(cookingUtensilSymbol(utensilId))}</i>
                        ${job && !ready ? `<span class="cooking-steam"><em></em><em></em><em></em></span>` : ""}
                      </div>
                      <strong>${escapeHtml(getCookingUtensil(utensilId).name)}</strong>
                      ${
                        ready
                          ? `
                            <img class="cooking-ready-food" src="${escapeAttribute(recipe.image)}" alt="">
                            <span class="cooking-slot-state">完成！</span>
                          `
                          : job
                            ? `
                              <span
                                class="cooking-countdown"
                                data-cooking-countdown
                                data-ready-at="${escapeAttribute(job.readyAt)}"
                              >${formatCookingTime(remaining)}</span>
                              <small>調理中</small>
                            `
                            : `<small>READY TO COOK</small>`
                      }
                    `
                    : `
                      <div class="cooking-utensil-empty-mark">＋</div>
                      <strong>EMPTY SLOT</strong>
                      <small>器具を配置</small>
                    `
                }
              </button>
            `;
          }).join("")}
        </div>
      </section>

      <section class="cooking-workbench cooking-station-modal ${MANAGEMENT_VIEW_STATE.cookingPopupOpen ? "is-open" : ""}" data-cooking-anchor="workbench">
        <button type="button" class="cooking-station-modal__backdrop" data-action="close-cooking-popup" aria-label="調理画面を閉じる"></button>
        <div class="cooking-station-modal__panel">
        <header>
          <div>
            <span>ACTIVE STATION ${String(selectedSlot + 1).padStart(2, "0")}</span>
            <strong>${selectedUtensilId ? escapeHtml(getCookingUtensil(selectedUtensilId).name) : "調理器具を選択"}</strong>
          </div>
          ${
            selectedUtensilId &&
            !selectedJob
              ? `
                <button
                  type="button"
                  class="cooking-remove-utensil"
                  data-action="remove-cooking-utensil"
                  data-slot-index="${selectedSlot}"
                >器具を収納</button>
              `
              : ""
          }
        </header>

        ${
          !selectedUtensilId
            ? `
              <section class="cooking-utensil-picker">
                <h2>所持している調理器具</h2>
                <p>配置する器具を選択してください。配置前に確認が入ります。</p>
                <div>
                  ${COOKING_UTENSIL_MASTER.map((utensil) => {
                    const owned =
                      cooking.utensilInventory[
                        utensil.utensilId
                      ] ??
                      0;
                    const placed =
                      placedCounts[
                        utensil.utensilId
                      ] ??
                      0;
                    const available =
                      Math.max(
                        0,
                        owned -
                        placed,
                      );
                    return `
                      <button
                        type="button"
                        data-action="place-cooking-utensil"
                        data-slot-index="${selectedSlot}"
                        data-utensil-id="${escapeAttribute(utensil.utensilId)}"
                        ${available > 0 ? "" : "disabled"}
                      >
                        <i>${escapeHtml(cookingUtensilSymbol(utensil.utensilId))}</i>
                        <strong>${escapeHtml(utensil.name)}</strong>
                        <span>所持 ×${formatNumber(owned)}</span>
                        <small>配置可能 ×${formatNumber(available)}</small>
                      </button>
                    `;
                  }).join("")}
                </div>
              </section>
            `
            : selectedJob
              ? (() => {
                  const recipe =
                    getRecipe(
                      selectedJob.recipeId,
                    );
                  const ready =
                    isCookingJobReady(
                      selectedJob,
                      now,
                    );
                  const remaining =
                    ready
                      ? 0
                      : getCookingJobRemainingSeconds(
                          selectedJob,
                          now,
                        );
                  return `
                    <section class="cooking-job-detail ${ready ? "is-ready" : "is-cooking"}">
                      <div class="cooking-job-detail__visual">
                        <div class="cooking-utensil-visual cooking-utensil-visual--large">
                          <i>${escapeHtml(cookingUtensilSymbol(selectedUtensilId))}</i>
                          ${ready ? "" : `<span class="cooking-steam"><em></em><em></em><em></em></span>`}
                        </div>
                        <img src="${escapeAttribute(recipe.image)}" alt="">
                      </div>
                      <span>${ready ? "COOKING COMPLETE" : "NOW COOKING"}</span>
                      <h2>${ready ? escapeHtml(recipe.name) : "料理を調理しています"}</h2>
                      <strong
                        ${ready ? "" : `data-cooking-countdown data-ready-at="${escapeAttribute(selectedJob.readyAt)}"`}
                      >${ready ? "READY" : formatCookingTime(remaining)}</strong>
                      <p>${ready ? "料理画像をタップして回収できます。" : `${formatNumber(recipe.completionSeconds)}秒で完成します。調理中の器具は移動できません。`}</p>
                      ${
                        ready
                          ? `
                            <button
                              type="button"
                              class="primary-button cooking-collect-button"
                              data-action="collect-cooking-job"
                              data-slot-index="${selectedSlot}"
                            >
                              <img src="${escapeAttribute(recipe.image)}" alt="">
                              <span>料理を回収</span>
                            </button>
                          `
                          : ""
                      }
                    </section>
                  `;
                })()
              : `
                <section class="cooking-ingredient-builder">
                  <header>
                    <div>
                      <span>INGREDIENT SELECT</span>
                      <h2>食材を最大5つ選択</h2>
                    </div>
                    <button
                      type="button"
                      data-action="clear-cooking-ingredients"
                    >すべて外す</button>
                  </header>

                  <div class="cooking-ingredient-slots">
                    ${MANAGEMENT_VIEW_STATE.cookingIngredientSlots.map((ingredientId, ingredientSlot) => {
                      const ingredient =
                        ingredientId
                          ? getIngredient(
                              ingredientId,
                            )
                          : null;
                      return `
                        <button
                          type="button"
                          class="${pickerSlot === ingredientSlot ? "is-picker-open" : ""} ${ingredient ? "has-ingredient" : "is-empty"}"
                          data-action="select-cooking-ingredient-slot"
                          data-ingredient-slot="${ingredientSlot}"
                        >
                          <b>${ingredientSlot + 1}</b>
                          ${
                            ingredient
                              ? `
                                <img src="${escapeAttribute(ingredient.image)}" alt="">
                                <strong>${escapeHtml(ingredient.name)}</strong>
                                <small>変更・取消</small>
                              `
                              : `
                                <i>＋</i>
                                <strong>食材</strong>
                                <small>タップして選択</small>
                              `
                          }
                        </button>
                      `;
                    }).join("")}
                  </div>

                  ${
                    Number.isInteger(
                      pickerSlot,
                    )
                      ? `
                        <section class="cooking-ingredient-picker" data-scroll-memory="cooking-ingredient-picker">
                          <header>
                            <strong>食材枠${pickerSlot + 1}を選択</strong>
                            <button
                              type="button"
                              data-action="remove-cooking-ingredient"
                              data-ingredient-slot="${pickerSlot}"
                            >この枠を空にする</button>
                          </header>
                          <div data-scroll-memory="cooking-ingredient-shelf">
                            ${
                              ownedIngredients.length > 0
                                ? ownedIngredients.map((ingredient) => {
                                    const owned =
                                      cooking.ingredientInventory[
                                        ingredient.ingredientId
                                      ] ??
                                      0;
                                    const targetCurrent =
                                      MANAGEMENT_VIEW_STATE
                                        .cookingIngredientSlots[
                                          pickerSlot
                                        ] ===
                                      ingredient.ingredientId
                                        ? 1
                                        : 0;
                                    const usedElsewhere =
                                      (
                                        selectedCounts[
                                          ingredient.ingredientId
                                        ] ??
                                        0
                                      ) -
                                      targetCurrent;
                                    const available =
                                      owned -
                                      usedElsewhere;
                                    return `
                                      <button
                                        type="button"
                                        data-action="choose-cooking-ingredient"
                                        data-ingredient-slot="${pickerSlot}"
                                        data-ingredient-id="${escapeAttribute(ingredient.ingredientId)}"
                                        ${available > 0 ? "" : "disabled"}
                                      >
                                        <img src="${escapeAttribute(ingredient.image)}" alt="">
                                        <strong>${escapeHtml(ingredient.name)}</strong>
                                        <span>×${formatNumber(owned)}</span>
                                      </button>
                                    `;
                                  }).join("")
                                : `<p>食材を所持していません。MOB SHOPで購入してください。</p>`
                            }
                          </div>
                        </section>
                      `
                      : ""
                  }

                  ${
                    recipeGuides.length > 0
                      ? `
                        <section class="cooking-recipe-guide">
                          <header>
                            <span>あと何を入れる？</span>
                            <small>近いレシピを最大12件表示</small>
                          </header>
                          <div>
                            ${recipeGuides.map(({ recipe, remaining, discovered }) => `
                              <article class="${discovered ? "is-known" : "is-unknown"}">
                                <div>
                                  <img src="${escapeAttribute(assetPath(recipe.image))}" alt="">
                                  ${discovered ? "" : "<i>??</i>"}
                                </div>
                                <strong>${discovered ? escapeHtml(recipe.name) : "？？？"}</strong>
                                <small>あと ${remaining.map((id) => escapeHtml(getIngredient(id).name)).join("・")}</small>
                              </article>
                            `).join("")}
                          </div>
                        </section>
                      `
                      : ""
                  }

                  <section class="cooking-recipe-candidates" data-scroll-memory="cooking-recipe-candidates">
                    <header>
                      <span>RECIPE CANDIDATES</span>
                      <strong>作れる料理</strong>
                      <small>未調理の料理はシルエットで表示</small>
                    </header>
                    <div>
                      ${
                        selectedIngredientIds.length === 0
                          ? `<p class="cooking-recipe-empty">食材を選ぶと料理候補が表示されます。</p>`
                          : recipeCandidates.length === 0
                            ? `<p class="cooking-recipe-empty">この食材の組み合わせで作れる料理はありません。</p>`
                            : recipeCandidates.map((recipe) => {
                                const discovered =
                                  Boolean(
                                    cooking.recipeDiscovery[
                                      recipe.recipeId
                                    ],
                                  );
                                return `
                                  <button
                                    type="button"
                                    class="cooking-recipe-card ${discovered ? "is-discovered" : "is-undiscovered"} ${recipe.unlocked ? "" : "is-locked"}"
                                    data-action="start-cooking"
                                    data-recipe-id="${escapeAttribute(recipe.recipeId)}"
                                    data-slot-index="${selectedSlot}"
                                    ${recipe.unlocked ? "" : "disabled"}
                                  >
                                    <div>
                                      <img src="${escapeAttribute(recipe.image)}" alt="">
                                      ${discovered ? "" : `<i>?</i>`}
                                    </div>
                                    <span>${escapeHtml(recipe.baseRank)} RANK</span>
                                    <strong>${discovered ? escapeHtml(recipe.name) : "？？？"}</strong>
                                    <small>${recipe.unlocked ? `${formatNumber(recipe.completionSeconds)}秒` : `企業${escapeHtml(recipe.requiredCompanyRank)}で解放`}</small>
                                  </button>
                                `;
                              }).join("")
                      }
                    </div>
                  </section>

                  <p class="cooking-utensil-compatibility-note">
                    調理器具ごとのレシピ指定は情報源にないため、現在はすべての器具で共通レシピを調理できます。
                  </p>
                </section>
              `
        }
        <button type="button" class="secondary-button cooking-station-modal__close" data-action="close-cooking-popup">閉じる</button>
        </div>
      </section>
    </section>
  `;
}

function roomPlacementControlsTemplate(roomId, placementId) {
  return `
    <div class="room-placement__controls">
      <button type="button" data-repeat-action data-action="room-scale-down" data-room-id="${escapeAttribute(roomId)}" data-placement-id="${escapeAttribute(placementId)}">－</button>
      <button type="button" data-repeat-action data-action="room-scale-up" data-room-id="${escapeAttribute(roomId)}" data-placement-id="${escapeAttribute(placementId)}">＋</button>
      <button type="button" data-action="room-flip" data-room-id="${escapeAttribute(roomId)}" data-placement-id="${escapeAttribute(placementId)}">反転</button>
      <button type="button" data-action="room-front" data-room-id="${escapeAttribute(roomId)}" data-placement-id="${escapeAttribute(placementId)}">前へ</button>
      <button type="button" data-action="room-back" data-room-id="${escapeAttribute(roomId)}" data-placement-id="${escapeAttribute(placementId)}">後ろへ</button>
      <button type="button" data-action="room-center" data-room-id="${escapeAttribute(roomId)}" data-placement-id="${escapeAttribute(placementId)}">中央</button>
      <button type="button" class="is-danger" data-action="room-remove" data-room-id="${escapeAttribute(roomId)}" data-placement-id="${escapeAttribute(placementId)}">収納</button>
    </div>
  `;
}

export function renderRoomManagement(snapshot) {
  const activeRoom =
    getRoomMaster(
      snapshot.company.activeRoomId,
    );
  const layout =
    snapshot.collections.roomLayouts?.[
      activeRoom.roomId
    ] ?? [];
  const availableItems =
    getRoomAvailableItems(snapshot);
  const availableCategories =
    ROOM_CATEGORY_DEFINITIONS.filter(
      (category) =>
        availableItems.some(
          (item) =>
            item.roomType ===
            category.id,
        ),
    );
  const activeCategory =
    availableCategories.some(
      (category) =>
        category.id ===
        MANAGEMENT_VIEW_STATE.roomCategory,
    )
      ? MANAGEMENT_VIEW_STATE.roomCategory
      : availableCategories[0]?.id ??
        "Card";
  MANAGEMENT_VIEW_STATE.roomCategory =
    activeCategory;

  const categoryItems =
    availableItems.filter(
      (item) =>
        item.roomType ===
        activeCategory,
    );
  const selectedItemJson =
    MANAGEMENT_VIEW_STATE.roomSelectedItem;
  const selectedItem =
    categoryItems.find(
      (item) =>
        JSON.stringify(
          item.itemRef,
        ) ===
        selectedItemJson,
    ) ??
    categoryItems[0] ??
    null;
  MANAGEMENT_VIEW_STATE.roomSelectedItem =
    selectedItem
      ? JSON.stringify(
          selectedItem.itemRef,
        )
      : null;

  const homeRoomId =
    snapshot.company.homeRoomId ??
    snapshot.company.activeRoomId;

  return `
    <section class="room-list room-list--compact">
      ${ROOM_MASTER.map((room) => {
        const owned =
          snapshot.company.unlockedRoomIds
            .includes(room.roomId);
        const unlocked =
          snapshot.company.rankIndex >=
          room.unlockRankIndex;
        const active =
          snapshot.company.activeRoomId ===
          room.roomId;
        const isHome =
          homeRoomId ===
          room.roomId;
        return `
          <article
            class="room-list-card ${active ? "is-active" : ""} ${owned ? "is-owned" : "is-locked"} ${isHome ? "is-home" : ""}"
          >
            <img
              src="${escapeAttribute(assetPath(room.image))}"
              alt=""
            >
            <div>
              <span>${isHome ? "HOME" : escapeHtml(room.roomId.toUpperCase())}</span>
              <h3>${escapeHtml(room.name)}</h3>
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
                    ${active ? "EDITING" : "入室"}
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
                    ${unlocked ? `${formatNumber(room.priceCoin)} C` : "LOCK"}
                  </button>
                `
            }
          </article>
        `;
      }).join("")}
    </section>

    <section class="room-inventory-console">
      <header>
        <div>
          <span>DISPLAY INVENTORY</span>
          <strong>配置する所持品</strong>
        </div>
        <small>${availableItems.length} ITEMS</small>
      </header>

      ${
        availableCategories.length > 0
          ? `
            <nav
              class="room-category-strip"
              aria-label="配置カテゴリ"
            >
              ${availableCategories.map((category) => `
                <button
                  type="button"
                  class="${activeCategory === category.id ? "is-active" : ""}"
                  data-action="select-room-category"
                  data-room-category="${escapeAttribute(category.id)}"
                  aria-label="${escapeAttribute(category.label)}"
                >
                  <img src="${escapeAttribute(category.icon)}" alt="">
                  <span>${escapeHtml(category.label)}</span>
                </button>
              `).join("")}
            </nav>

            <div class="room-item-strip">
              ${categoryItems.map((item) => {
                const itemJson =
                  JSON.stringify(
                    item.itemRef,
                  );
                const selected =
                  selectedItemJson ===
                    itemJson ||
                  (
                    !selectedItemJson &&
                    selectedItem ===
                      item
                  );
                return `
                  <button
                    type="button"
                    class="${selected ? "is-selected" : ""}"
                    data-action="select-room-item"
                    data-room-item="${escapeAttribute(itemJson)}"
                  >
                    <img src="${escapeAttribute(item.image)}" alt="">
                    <strong>${escapeHtml(item.name)}</strong>
                  </button>
                `;
              }).join("")}
            </div>
          `
          : `
            <div class="room-inventory-empty">
              <strong>配置できる所持品がありません</strong>
              <span>カード、バッジ、パック、トロフィーを集めましょう。</span>
            </div>
          `
      }

      <div class="room-inventory-actions">
        <button
          type="button"
          class="primary-button"
          data-action="add-room-item"
          data-room-id="${escapeAttribute(activeRoom.roomId)}"
          ${selectedItem ? "" : "disabled"}
        >
          ROOMへ配置
        </button>
        <button
          type="button"
          class="secondary-button ${homeRoomId === activeRoom.roomId ? "is-active" : ""}"
          data-action="set-home-room"
          data-room-id="${escapeAttribute(activeRoom.roomId)}"
          ${homeRoomId === activeRoom.roomId ? "disabled" : ""}
        >
          ${
            homeRoomId ===
            activeRoom.roomId
              ? "HOME背景に設定中"
              : "この部屋をHOME画面に設定"
          }
        </button>
      </div>
    </section>

    <section
      class="room-canvas"
      style="--room-background:url('${escapeAttribute(assetPath(activeRoom.image))}')"
      data-room-canvas
      data-room-id="${escapeAttribute(activeRoom.roomId)}"
      aria-label="${escapeAttribute(activeRoom.name)}の配置画面"
    >
      <img class="room-canvas__background" src="${escapeAttribute(assetPath(activeRoom.image))}" alt="">
      ${layout
        .slice()
        .sort(
          (left, right) =>
            (left.z ?? 0) -
            (right.z ?? 0),
        )
        .map((placement) => {
          const selected =
            MANAGEMENT_VIEW_STATE
              .roomSelectedPlacementId ===
            placement.placementId;
          return `
            <article
              class="room-placement ${selected ? "is-selected" : ""}"
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
              ${selected ? roomPlacementControlsTemplate(activeRoom.roomId, placement.placementId) : ""}
            </article>
          `;
        })
        .join("")}
      ${
        layout.length === 0
          ? `
            <p class="room-canvas__empty">
              所持品を選び「ROOMへ配置」を押してください。
            </p>
          `
          : ""
      }
    </section>
    <p class="room-drag-note">
      配置物はドラッグで移動、タップで編集メニューを表示します。
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
              data-character-portrait
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

function japaneseTournamentNewsName(entry) {
  const type =
    String(entry.tournamentType ?? "")
      .toLowerCase();
  const names = {
    local: "Local大会",
    national: "National大会",
    national_week_1: "National大会 1週目",
    national_week_2: "National大会 2週目",
    national_last_chance: "National Last Chance",
    world_qualifier: "World予選",
    world_qualifier_week_1: "World予選 1週目",
    world_qualifier_week_2: "World予選 2週目",
    world_last_chance: "World Last Chance",
    world_final: "World Final",
    championship: "MOB BR Championship",
    casual_denden: "カジュアル大会 デンデンカップ",
    casual_mobutetsu: "カジュアル大会 モブテツカップ",
    casual_rockets: "カジュアル大会 ジョーダンロケッツカップ",
    casual_tempest: "カジュアル大会 ゴールデンテンペストカップ",
  };
  return names[type] ??
    String(entry.stageName ?? "MOB BR 大会");
}

function japaneseTournamentNewsSubtitle(entry) {
  const type =
    String(entry.tournamentType ?? "")
      .toLowerCase();
  if (type.startsWith("casual_")) {
    return "CASUAL CUP / MOB BR NEWS";
  }
  if (type === "championship") {
    return "MOB BR CHAMPIONSHIP";
  }
  if (type.includes("world")) {
    return "MOB BR WORLD STAGE";
  }
  if (type.includes("national")) {
    return "MOB BR NATIONAL STAGE";
  }
  if (type === "local") {
    return "MOB BR LOCAL STAGE";
  }
  return "MOB BR 大会速報";
}

function newsMobPinkComment(
  entry,
) {
  if (
    entry.status ===
      "cpu_simulated" ||
    !Number.isInteger(
      entry.finalPlace,
    )
  ) {
    const champion =
      entry.rankings?.[0]
        ?.teamName ??
      "優勝チーム";
    return `今回は観戦結果をまとめました。${champion}が最上位です。CPU順位は通常ランクを中心に、少しだけ当日の調子と運を加えて計算しています。`;
  }
  if (entry.finalPlace === 1) {
    return "優勝おめでとうございます！順位ポイントとKPの両方を積み上げた、とても素晴らしい大会でした。";
  }
  if (entry.finalPlace <= 3) {
    return `表彰台入りおめでとうございます！${entry.finalPlace}位という結果は、次の大会にもつながる大きな成果です。`;
  }
  if (entry.finalPlace <= 10) {
    return `TOP10入りです。良かった個人成績や獲得ポイントを確認して、次の育成へ活かしていきましょう。`;
  }
  return "大会お疲れさまでした。個人成績とMATCHごとの結果を見ると、次に伸ばしたい部分が見つけやすいですよ。";
}

function newsTrainingPoints(
  rewards,
) {
  const points =
    rewards?.trainingPoints ??
    {};
  return `
    <div class="news-reward-points">
      <span>POWER <strong>+${formatNumber(points.power ?? 0)}</strong></span>
      <span>TECH <strong>+${formatNumber(points.tech ?? 0)}</strong></span>
      <span>MENTAL <strong>+${formatNumber(points.mental ?? 0)}</strong></span>
      <span>SHOOT <strong>+${formatNumber(points.shoot ?? 0)}</strong></span>
    </div>
  `;
}

function newsBadgePackText(
  rewards,
) {
  const packs =
    rewards?.badgePacks ??
    {};
  const entries =
    Object.entries(packs)
      .filter(
        ([, count]) =>
          Number(count) > 0,
      );
  if (entries.length === 0) {
    return "BADGE PACK なし";
  }
  return entries
    .map(
      ([packId, count]) =>
        `${packId} ×${formatNumber(count)}`,
    )
    .join(" / ");
}

function newsMemberRows(
  entry,
) {
  const members =
    Array.isArray(
      entry.memberResults,
    )
      ? entry.memberResults
      : [];
  if (members.length === 0) {
    return "";
  }
  return `
    <section class="news-player-performance">
      <h3>PLAYER PERFORMANCE</h3>
      <div>
        ${members.map((member) => {
          const accuracy =
            Number(member.shots ?? 0) > 0
              ? Math.round(
                  Number(member.hits ?? 0) /
                  Number(member.shots) *
                  100,
                )
              : 0;
          return `
            <article>
              <span>${escapeHtml(member.role ?? "PLAYER")}</span>
              <strong>${escapeHtml(member.name ?? member.playerName ?? member.playerId)}</strong>
              <small>
                K ${formatNumber(member.kills ?? 0)} /
                A ${formatNumber(member.assists ?? 0)} /
                DMG ${formatNumber(member.damage ?? 0)} /
                HEAL ${formatNumber(member.healing ?? 0)} /
                ACC ${accuracy}%
              </small>
            </article>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

function newsAwardRows(
  entry,
) {
  const awards =
    Array.isArray(
      entry.awards,
    )
      ? entry.awards.filter(
          (award) =>
            award.category !==
            "FINAL_PODIUM",
        )
      : [];
  if (awards.length === 0) {
    return "";
  }
  return `
    <section class="news-individual-awards">
      <h3>INDIVIDUAL RANKINGS</h3>
      <div>
        ${awards.map((award) => `
          <article>
            <strong>${escapeHtml(award.label ?? award.category)}</strong>
            <ol>
              ${(award.ranking ?? []).slice(0, 3).map((row) => `
                <li>
                  <b>${row.place}</b>
                  <span>${escapeHtml(row.playerName ?? row.teamName ?? "-")}</span>
                  <small>${escapeHtml(row.valueLabel ?? "")}</small>
                </li>
              `).join("")}
            </ol>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function cpuNewsIndividuals(
  entry,
) {
  if (
    entry.status !==
      "cpu_simulated" ||
    !Array.isArray(
      entry.rankings,
    )
  ) {
    return "";
  }

  const candidates =
    entry.rankings
      .slice(0, 5)
      .flatMap(
        (ranking) => {
          const team =
            resolveCpuTeamMaster(
              ranking.teamId,
              entry.circuitYear ??
              9999,
            );
          return (
            team?.members ??
            []
          ).map(
            (member) => {
              const range =
                member.normalRankRange ??
                ["F1", "F1"];
              return {
                teamPlace:
                  ranking.place,
                teamName:
                  ranking.teamName,
                playerName:
                  member.name,
                role:
                  member.role,
                rankLabel:
                  `${range[0]}～${range[1]}`,
              };
            },
          );
        },
      )
      .sort(
        (left, right) =>
          left.teamPlace -
            right.teamPlace ||
          left.role.localeCompare(
            right.role,
          ),
      )
      .slice(0, 10);

  return `
    <section class="news-individual-awards news-individual-awards--cpu">
      <h3>CPU注目選手</h3>
      <p>上位チーム所属選手を、チーム順位と通常ランク帯から掲載しています。</p>
      <ol>
        ${candidates.map((row, index) => `
          <li>
            <b>${index + 1}</b>
            <span>${escapeHtml(row.playerName)} / ${escapeHtml(row.role)}</span>
            <small>${escapeHtml(row.teamName)}・${escapeHtml(row.rankLabel)}</small>
          </li>
        `).join("")}
      </ol>
    </section>
  `;
}

function newsMatchSummary(
  entry,
) {
  const matches =
    Array.isArray(
      entry.matchResults,
    )
      ? entry.matchResults
      : [];
  if (matches.length === 0) {
    return "";
  }
  return `
    <section class="news-match-digest">
      <h3>MATCH DIGEST</h3>
      <div>
        ${matches.slice(0, 10).map((match, index) => {
          const champion =
            match.rankings?.[0] ??
            match.champion ??
            null;
          return `
            <span>
              MATCH ${match.match ?? index + 1}
              <strong>${escapeHtml(champion?.teamName ?? champion?.teamId ?? "RESULT")}</strong>
            </span>
          `;
        }).join("")}
      </div>
    </section>
  `;
}

export function renderNewsManagement(snapshot) {
  const history = [...(snapshot.tournament.history ?? [])].reverse();
  return `
    <section class="news-newspaper-grid">
      ${history.length ? history.map((entry, index) => {
        const year = entry.year ?? entry.gameDate?.year ?? String(entry.tournamentId ?? "").match(/\d{4}/)?.[0] ?? snapshot.gameDate.year;
        const month = entry.month ?? entry.gameDate?.month ?? "--";
        const week = entry.week ?? entry.gameDate?.week ?? "--";
        return `
          <details class="news-newspaper" style="--news-index:${index}">
            <summary>
              <div class="news-newspaper__masthead"><span>MOB BR TIMES</span><b>${year}.${month}.W${week}</b></div>
              <img src="icon/news.png" alt="">
              <div><strong>${escapeHtml(japaneseTournamentNewsName(entry))}</strong><small>${escapeHtml(japaneseTournamentNewsSubtitle(entry))}</small></div>
              <em>${Number.isInteger(entry.finalPlace) ? `${entry.finalPlace}位` : entry.status === "stage_in_progress" ? "継続中" : entry.status === "cpu_simulated" ? "CPU結果" : "速報"}</em>
            </summary>
            <article>
              <h2>${escapeHtml(entry.summary ?? "大会結果速報")}</h2>

              <section class="news-mob-pink-comment">
                <img src="icon/pink.png" alt="モブピンク">
                <div>
                  <span>モブピンクの大会メモ</span>
                  <p>${escapeHtml(newsMobPinkComment(entry))}</p>
                </div>
              </section>

              <section class="news-reward-ledger">
                <h3>獲得報酬・ポイント</h3>
                <div class="news-currency-ledger">
                  <span>COIN <strong>+${formatNumber(entry.rewards?.coin ?? 0)}</strong></span>
                  <span>DIAMOND <strong>+${formatNumber(entry.rewards?.diamond ?? 0)}</strong></span>
                  <span>RUBY <strong>+${formatNumber(entry.rewards?.ruby ?? 0)}</strong></span>
                  <span>企業PT <strong>+${formatNumber(entry.rewards?.companyExp ?? 0)}</strong></span>
                </div>
                ${newsTrainingPoints(entry.rewards)}
                <p>${escapeHtml(newsBadgePackText(entry.rewards))}</p>
                <p>Championship Point +${formatNumber(entry.championshipPointDelta ?? entry.rewards?.championshipPoints ?? 0)}</p>
              </section>

              ${entry.teamTotals ? `
                <section class="news-player-team-total">
                  <h3>PLAYER TEAM TOTAL</h3>
                  <div>
                    <span>順位PT <strong>${formatNumber(entry.teamTotals.placementPoints ?? entry.teamTotals.sumPlacementPoint ?? 0)}</strong></span>
                    <span>KP <strong>${formatNumber(entry.teamTotals.kp ?? entry.teamTotals.sumKp ?? 0)}</strong></span>
                    <span>TOTAL <strong>${formatNumber(entry.teamTotals.totalPoints ?? entry.teamTotals.sumTotal ?? 0)}</strong></span>
                    <span>DMG <strong>${formatNumber(entry.teamTotals.damage ?? entry.teamTotals.sumDamage ?? 0)}</strong></span>
                  </div>
                </section>
              ` : ""}

              ${newsMatchSummary(entry)}
              ${newsMemberRows(entry)}
              ${newsAwardRows(entry)}
              ${cpuNewsIndividuals(entry)}

              ${
                Array.isArray(entry.rankings)
                  ? `
                    <section class="news-full-ranking">
                      <h3>FINAL TEAM RANKING</h3>
                      ${
                        entry.status === "cpu_simulated"
                          ? `<p>通常ランク帯を主軸に、小さな調子・運補正を加えたCPU大会シミュレーションです。</p>`
                          : ""
                      }
                      <ol>
                        ${entry.rankings.slice(0, 40).map((row) => `
                          <li class="${row.isPlayer ? "is-player" : ""}">
                            <b>${row.place}</b>
                            <span>${escapeHtml(row.teamName ?? row.teamId)}</span>
                            <small>
                              TOTAL ${formatNumber(row.sumTotal ?? row.total ?? 0)}
                              / KP ${formatNumber(row.sumKp ?? row.kp ?? 0)}
                              / DMG ${formatNumber(row.sumDamage ?? row.damage ?? 0)}
                            </small>
                          </li>
                        `).join("")}
                      </ol>
                    </section>
                  `
                  : ""
              }
            </article>
          </details>`;
      }).join("") : `<section class="content-panel placeholder-panel"><img class="placeholder-panel__icon" src="icon/news.png" alt=""><h2>大会新聞はまだありません</h2><p class="placeholder-panel__text">大会結果が年月週付きの新聞として追加されます。</p></section>`}
    </section>`;
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
    case "cooking":
      return renderCookingManagement(snapshot);
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
  openQuantityPrompt,
  showToast,
  render,
  renderPreservingScroll = render,
}) {
  if (!stateManager || !root) {
    throw new TypeError("Management controller dependencies are missing.");
  }

  let cookingTimerId = null;
  let cookingReadyRefreshScheduled = false;

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

  function updateCollectionInPlace() {
    const current =
      root.querySelector(
        '[data-live-section="collection"]',
      );
    if (!current) {
      renderPreservingScroll();
      return false;
    }
    const page =
      root.querySelector(".page-content");
    const top = page?.scrollTop ?? 0;
    const template =
      document.createElement("template");
    template.innerHTML =
      renderCollectionManagement(
        stateManager.getSnapshot(),
      ).trim();
    current.replaceWith(
      template.content.firstElementChild,
    );
    if (page) {
      page.scrollTop = top;
    }
    return true;
  }

  function updateRoomInPlace() {
    const current = root.querySelector(".management-app-content--room");
    if (!current) {
      renderPreservingScroll();
      return false;
    }
    const page = root.querySelector(".page-content");
    const top = page?.scrollTop ?? 0;
    const template = document.createElement("template");
    template.innerHTML = `<section class="management-app-content management-app-content--room">${renderRoomManagement(stateManager.getSnapshot())}</section>`;
    current.replaceWith(template.content.firstElementChild);
    if (page) page.scrollTop = top;
    afterRender("room");
    return true;
  }

  function updateShopInPlace() {
    const currentPopup =
      root.querySelector(
        ".mobshop-popup",
      );
    if (!currentPopup) {
      renderPreservingScroll();
      return false;
    }

    const categoryStrip =
      currentPopup.querySelector(
        ".mobshop-category-grid",
      );
    const categoryScroll =
      categoryStrip?.scrollLeft ?? 0;
    const shelfSelectors = [
      ".shop-item-grid",
      ".shop-category-product-grid",
      ".cooking-shop-grid",
    ];
    const shelfScrolls =
      shelfSelectors.flatMap(
        (selector) =>
          [...currentPopup.querySelectorAll(selector)]
            .map((element, index) => ({
              selector,
              index,
              scrollLeft: element.scrollLeft,
            })),
      );

    const template =
      document.createElement(
        "template",
      );
    template.innerHTML =
      renderShopManagement(
        stateManager.getSnapshot(),
      ).trim();
    const nextPopup =
      template.content
        .firstElementChild;
    const nextContent =
      nextPopup.querySelector(
        ".mobshop-content",
      );
    const currentContent =
      currentPopup.querySelector(
        ".mobshop-content",
      );

    if (
      !nextContent ||
      !currentContent
    ) {
      renderPreservingScroll();
      return false;
    }

    currentContent.replaceWith(
      nextContent,
    );

    const nextDialogue =
      nextPopup.querySelector(
        ".mobshop-header-clerk p",
      )?.textContent ?? "";
    const currentDialogue =
      currentPopup.querySelector(
        ".mobshop-header-clerk p",
      );
    if (currentDialogue) {
      currentDialogue.textContent =
        nextDialogue;
    }

    for (
      const button
      of currentPopup.querySelectorAll(
        "[data-shop-category]",
      )
    ) {
      button.classList.toggle(
        "is-active",
        button.dataset.shopCategory ===
          MANAGEMENT_VIEW_STATE.shopCategory,
      );
    }

    if (categoryStrip) {
      categoryStrip.scrollLeft =
        categoryScroll;
    }
    for (const saved of shelfScrolls) {
      const nextShelf =
        currentPopup.querySelectorAll(
          saved.selector,
        )[saved.index];
      if (nextShelf) {
        nextShelf.scrollLeft =
          saved.scrollLeft;
      }
    }
    return true;
  }

  function updateCookingInPlace({
    anchorSelector =
      ".cooking-workbench",
  } = {}) {
    const current =
      root.querySelector(
        ".management-app-content--cooking",
      );
    if (!current) {
      renderPreservingScroll();
      return false;
    }

    const page =
      root.querySelector(
        ".page-content",
      );
    const oldPageTop =
      page?.scrollTop ?? 0;
    const template =
      document.createElement(
        "template",
      );
    template.innerHTML =
      `<div class="management-app-content management-app-content--cooking">${renderCookingManagement(
        stateManager.getSnapshot(),
      )}</div>`;
    const replacement =
      template.content
        .firstElementChild;

    const fragmentSelectors =
      anchorSelector ===
        ".dining-room-stage"
        ? [
            ".dining-modal-host",
            ".dining-room-stage",
          ]
        : [
            anchorSelector,
          ];
    const fragmentMode =
      anchorSelector !==
        ".cooking-subnav" &&
      fragmentSelectors.every(
        (selector) =>
          current.querySelector(
            selector,
          ) &&
          replacement.querySelector(
            selector,
          ),
      );

    if (fragmentMode) {
      for (
        const selector
        of fragmentSelectors
      ) {
        const currentFragment =
          current.querySelector(
            selector,
          );
        const nextFragment =
          replacement.querySelector(
            selector,
          );
        const memories =
          new Map(
            [...currentFragment.querySelectorAll(
              "[data-scroll-memory]",
            )].map(
              (element) => [
                element.dataset.scrollMemory,
                {
                  left:
                    element.scrollLeft,
                  top:
                    element.scrollTop,
                },
              ],
            ),
          );

        currentFragment.replaceWith(
          nextFragment,
        );

        for (
          const element
          of nextFragment.querySelectorAll(
            "[data-scroll-memory]",
          )
        ) {
          const memory =
            memories.get(
              element.dataset.scrollMemory,
            );
          if (!memory) {
            continue;
          }
          element.scrollLeft =
            memory.left;
          element.scrollTop =
            memory.top;
        }
      }

      if (page) {
        page.scrollTop =
          oldPageTop;
      }
      return true;
    }

    const oldAnchor =
      current.querySelector(
        anchorSelector,
      ) ?? current;
    const oldTop =
      oldAnchor
        .getBoundingClientRect()
        .top;
    const memories =
      new Map(
        [...current.querySelectorAll(
          "[data-scroll-memory]",
        )].map(
          (element) => [
            element.dataset.scrollMemory,
            {
              left:
                element.scrollLeft,
              top:
                element.scrollTop,
            },
          ],
        ),
      );

    current.replaceWith(
      replacement,
    );

    for (
      const element
      of replacement.querySelectorAll(
        "[data-scroll-memory]",
      )
    ) {
      const memory =
        memories.get(
          element.dataset.scrollMemory,
        );
      if (!memory) {
        continue;
      }
      element.scrollLeft =
        memory.left;
      element.scrollTop =
        memory.top;
    }

    requestAnimationFrame(
      () => {
        const nextAnchor =
          replacement.querySelector(
            anchorSelector,
          ) ?? replacement;
        if (page) {
          const nextTop =
            nextAnchor
              .getBoundingClientRect()
              .top;
          page.scrollTop =
            Math.max(
              0,
              oldPageTop +
              nextTop -
              oldTop,
            );
        }
        afterRender(
          "cooking",
        );
      },
    );
    return true;
  }

  function wait(milliseconds) {
    return new Promise((resolve) =>
      setTimeout(resolve, milliseconds),
    );
  }

  async function playCookingCompletionCinematic(
    result,
  ) {
    const overlay =
      document.createElement(
        "section",
      );
    overlay.className =
      `cooking-completion-cinematic is-${result.qualityId}`;
    overlay.innerHTML = `
      <div class="cooking-completion-cinematic__glow" aria-hidden="true"></div>
      <div class="cooking-completion-cinematic__sparkles" aria-hidden="true">
        ${Array.from({ length: 18 }, (_, index) => `
          <i style="--spark-index:${index};--spark-x:${7 + (index % 9) * 11}%;--spark-y:${14 + (index % 6) * 12}%;--spark-delay:${index * 45}ms"></i>
        `).join("")}
      </div>
      <span>COOKING COMPLETE</span>
      <img src="${escapeAttribute(result.image)}" alt="">
      <small>${escapeHtml(result.qualityLabel)} / ${escapeHtml(result.rank)} RANK</small>
      <h2>${escapeHtml(result.name)}が完成した！</h2>
      <strong>保存ボックスへ ×${formatNumber(result.quantity)}</strong>
    `;
    root.append(
      overlay,
    );
    requestAnimationFrame(
      () =>
        overlay.classList.add(
          "is-show",
        ),
    );
    await wait(1550);
    overlay.classList.add(
      "is-exit",
    );
    await wait(300);
    overlay.remove();
  }

  async function playTrainingCinematic(
    snapshot,
    assignments,
    memberResults,
  ) {
    const overlay =
      document.createElement("section");
    overlay.className =
      "training-cinematic";
    overlay.innerHTML = `
      <div class="training-cinematic__scan" aria-hidden="true"></div>
      <span>TRAINING START</span>
      <h2>WEEKLY PROGRAM</h2>
      <div class="training-cinematic__members">
        ${assignments.map((assignment, index) => {
          const player =
            snapshot.playerTeam.members.find(
              (member) =>
                member.playerId ===
                assignment.playerId,
            );
          const program =
            TRAINING_PROGRAMS.find(
              (entry) =>
                entry.id ===
                assignment.programId,
            );
          const result =
            memberResults.find(
              (entry) =>
                entry.playerId ===
                assignment.playerId,
            );
          return `
            <article style="--cinematic-index:${index}">
              <div class="training-cinematic__portrait">
                <img
                  class="player-portrait"
                  data-character-portrait
                  data-role="${escapeAttribute(player.role)}"
                  src="${escapeAttribute(player.image)}"
                  alt=""
                >
                <i aria-hidden="true"></i>
              </div>
              <img
                class="training-cinematic__program"
                src="${escapeAttribute(program.image)}"
                alt=""
              >
              <strong>${escapeHtml(player.name)}</strong>
              <span>${escapeHtml(program.name)}</span>
              <small>
                P+${result.gain.power}
                T+${result.gain.tech}
                M+${result.gain.mental}
                S+${result.gain.shoot}
              </small>
            </article>
          `;
        }).join("")}
      </div>
      <div class="training-cinematic__phase">
        <b>READY</b>
        <strong>POINT UP!</strong>
      </div>
    `;
    root.append(overlay);
    requestAnimationFrame(() =>
      overlay.classList.add("is-running"),
    );
    await wait(720);
    overlay.classList.add("is-point-up");
    await wait(920);
    overlay.classList.add("is-exit");
    await wait(280);
    overlay.remove();
  }

  async function playSkinGachaCinematic(result) {
    const overlay =
      document.createElement("section");
    overlay.className =
      "skin-gacha-cinematic";
    overlay.innerHTML = `
      <div class="skin-gacha-cinematic__tunnel" aria-hidden="true"></div>
      <span>WEAPON SKIN GACHA</span>
      <h2>SCANNING...</h2>
      <div class="skin-gacha-cinematic__capsule">
        <img src="menu/gacha.png" alt="">
        <i></i><i></i><i></i>
      </div>
      <article class="skin-gacha-cinematic__result">
        <div class="skin-gacha-cinematic__flare" aria-hidden="true"></div>
        <img src="${escapeAttribute(result.image)}" alt="">
        <span>NEW WEAPON SKIN</span>
        <strong>${escapeHtml(result.name)}</strong>
        <small>未所持プール 残り${formatNumber(result.remainingPoolCount)}</small>
      </article>
    `;
    root.append(overlay);
    requestAnimationFrame(() =>
      overlay.classList.add("is-scanning"),
    );
    await wait(880);
    overlay.classList.add("is-reveal");
    await wait(1250);
    overlay.classList.add("is-exit");
    await wait(300);
    overlay.remove();
  }

  async function playStrategyMeetingCinematic(
    result,
    snapshot,
  ) {
    const strategy =
      getStrategy(result.strategyId);
    const successfulCoaches =
      new Set(
        result.coachResults
          .filter((coach) => coach.success)
          .map((coach) => coach.coachId),
      );
    const overlay =
      document.createElement("section");
    overlay.className =
      "strategy-meeting-cinematic";
    overlay.innerHTML = `
      <div
        class="strategy-meeting-cinematic__grid"
        aria-hidden="true"
      ></div>
      <span>TACTICAL BRIEFING</span>
      <h2>STRATEGY MEETING</h2>

      <section class="strategy-meeting-cinematic__table">
        <div class="strategy-meeting-cinematic__rank-ring">
          ${STRATEGY_RANKS.map((rank, index) => `
            <i
              style="--rank-index:${index}"
              data-rank="${escapeAttribute(rank)}"
            >
              <img
                src="${escapeAttribute(`icon/tak${rank.toLowerCase()}.png`)}"
                alt=""
              >
            </i>
          `).join("")}
        </div>
        <div class="strategy-meeting-cinematic__center">
          <img src="menu/coach.png" alt="">
          <strong>ANALYZING</strong>
        </div>
        <div class="strategy-meeting-cinematic__coaches">
          ${snapshot.coaches.map((coach, index) => `
            <article
              class="${successfulCoaches.has(coach.coachId) ? "is-rank-up" : ""}"
              style="--coach-index:${index}"
            >
              <img src="${escapeAttribute(coach.image)}" alt="">
              <span>${escapeHtml(coach.rank)}</span>
              <strong>${escapeHtml(coach.name ?? "COACH")}</strong>
            </article>
          `).join("")}
        </div>
      </section>

      <article class="strategy-meeting-cinematic__result">
        ${
          result.coachResults.some(
            (coach) =>
              coach.success,
          )
            ? `
              <img
                class="strategy-meeting-cinematic__rank-up-icon"
                src="icon/rankup.png"
                alt=""
              >
            `
            : ""
        }
        <div
          class="strategy-meeting-cinematic__flare"
          aria-hidden="true"
        ></div>
        <img
          class="strategy-meeting-cinematic__rank"
          src="${escapeAttribute(`icon/tak${result.selectedRank.toLowerCase()}.png`)}"
          alt=""
        >
        <img
          class="strategy-meeting-cinematic__strategy"
          src="${escapeAttribute(strategy.icon)}"
          alt=""
        >
        <span>${escapeHtml(result.selectedRank)} RANK / ${escapeHtml(result.acquisitionType)}</span>
        <strong>${escapeHtml(result.strategyName)}</strong>
        <small>
          COACH RANK UP
          ${result.coachResults.filter((coach) => coach.success).length}
          / ${result.coachResults.length}
        </small>
      </article>
      ${
        result.coachResults.some(
          (coach) =>
            coach.success,
        )
          ? `
            <button
              type="button"
              class="strategy-meeting-cinematic__next"
              data-coach-rank-next
            >
              NEXT
            </button>
          `
          : ""
      }
    `;

    root.append(overlay);
    requestAnimationFrame(() =>
      overlay.classList.add(
        "is-briefing",
      ),
    );
    await wait(950);
    overlay.classList.add(
      "is-reveal",
    );
    if (
      result.coachResults.some(
        (coach) =>
          coach.success,
      )
    ) {
      await new Promise(
        (resolve) => {
          overlay
            .querySelector(
              "[data-coach-rank-next]",
            )
            ?.addEventListener(
              "click",
              resolve,
              {
                once: true,
              },
            );
        },
      );
    } else {
      await wait(1300);
    }
    overlay.classList.add(
      "is-exit",
    );
    await wait(300);
    overlay.remove();
  }

  async function handleAction(actionElement) {
    const action = actionElement.dataset.action;

    if (action === "switch-cooking-view") {
      MANAGEMENT_VIEW_STATE.cookingView =
        actionElement.dataset.cookingView ??
        "kitchen";
      MANAGEMENT_VIEW_STATE.cookingIngredientPickerSlot =
        null;
      MANAGEMENT_VIEW_STATE.diningSelectedCharacterId =
        null;
      MANAGEMENT_VIEW_STATE.diningSelectedCharacterType =
        null;
      MANAGEMENT_VIEW_STATE.diningSelectedFoods = [];
      updateCookingInPlace({
        anchorSelector:
          ".cooking-subnav",
      });
      return true;
    }

    if (action === "set-cooking-storage-sort") {
      const sortMode =
        actionElement.dataset.sortMode;
      if (
        ![
          "number",
          "rarity",
          "quantity",
          "cookedAt",
        ].includes(sortMode)
      ) {
        return true;
      }
      try {
        stateManager.transact(
          "cooking_storage_sort_changed",
          (draft) => {
            draft.cooking.storageBox.sortMode =
              sortMode;
            draft.cooking.storageBox.page =
              1;
          },
        );
        renderPreservingScroll();
      } catch (error) {
        await showError(
          "保存ボックスを並び替えできません",
          error,
        );
      }
      return true;
    }

    if (action === "change-cooking-storage-page") {
      const page =
        Math.max(
          1,
          Math.floor(
            Number(
              actionElement.dataset.page,
            ) ||
            1,
          ),
        );
      try {
        stateManager.transact(
          "cooking_storage_page_changed",
          (draft) => {
            draft.cooking.storageBox.page =
              page;
          },
        );
        renderPreservingScroll();
      } catch (error) {
        await showError(
          "保存ボックスのページを変更できません",
          error,
        );
      }
      return true;
    }

    if (action === "select-cooking-cookbook-quality") {
      MANAGEMENT_VIEW_STATE.cookingCookbookQuality =
        actionElement.dataset.qualityId ??
        "normal";
      MANAGEMENT_VIEW_STATE.cookingCookbookPage =
        1;
      renderPreservingScroll();
      return true;
    }

    if (action === "change-cooking-cookbook-page") {
      MANAGEMENT_VIEW_STATE.cookingCookbookPage =
        Math.max(
          1,
          Math.floor(
            Number(
              actionElement.dataset.page,
            ) ||
            1,
          ),
        );
      renderPreservingScroll();
      return true;
    }

    if (action === "inspect-stored-food") {
      const snapshot =
        stateManager.getSnapshot();
      const variantKey =
        actionElement.dataset.variantKey;
      const record =
        snapshot.cooking
          .foodInventory?.[
            variantKey
          ];
      if (!record) {
        return true;
      }
      const recipe =
        getRecipe(
          record.recipeId,
        );
      const variant =
        createFoodVariant(
          recipe,
          record.qualityId,
        );
      await openAlert({
        title:
          variant.name,
        body: `
          <section class="cooking-food-detail is-${escapeAttribute(record.qualityId)}">
            <img src="${escapeAttribute(variant.image)}" alt="">
            <span>No.${String(recipe.number).padStart(3, "0")} / ${escapeHtml(variant.qualityLabel)}</span>
            <h3>${escapeHtml(variant.name)}</h3>
            <strong>RANK ${escapeHtml(variant.rank)} / 所持 ×${formatNumber(record.quantity)}</strong>
            <p>初回調理 ${escapeHtml(record.firstCookedAt ?? "-")}</p>
            <p>最終調理 ${escapeHtml(record.lastCookedAt ?? "-")}</p>
            <small>初回順 ${formatNumber(record.firstSequence ?? 0)} / 最新順 ${formatNumber(record.lastSequence ?? 0)}</small>
          </section>
        `,
        buttonLabel:
          "OK",
      });
      return true;
    }

    if (action === "inspect-cookbook-food") {
      const snapshot =
        stateManager.getSnapshot();
      const recipeId =
        actionElement.dataset.recipeId;
      const qualityId =
        actionElement.dataset.qualityId;
      const recipe =
        getRecipe(
          recipeId,
        );
      const discovered =
        snapshot.cooking
          .recipeDiscovery?.[
            recipeId
          ]?.qualityIds?.includes(
            qualityId,
          ) === true;
      if (!discovered) {
        await openAlert({
          title:
            `No.${String(recipe.number).padStart(3, "0")}`,
          body:
            "<p>この品質の料理はまだ作ったことがありません。</p>",
          buttonLabel:
            "OK",
        });
        return true;
      }
      const variant =
        createFoodVariant(
          recipe,
          qualityId,
        );
      const owned =
        snapshot.cooking
          .foodInventory?.[
            variant.variantKey
          ]?.quantity ??
        0;
      await openAlert({
        title:
          variant.name,
        body: `
          <section class="cooking-food-detail is-${escapeAttribute(qualityId)}">
            <img src="${escapeAttribute(variant.image)}" alt="">
            <span>No.${String(recipe.number).padStart(3, "0")} / ${escapeHtml(variant.qualityLabel)}</span>
            <h3>${escapeHtml(variant.name)}</h3>
            <strong>RANK ${escapeHtml(variant.rank)} / 所持 ×${formatNumber(owned)}</strong>
            <p>基本ランク ${escapeHtml(recipe.baseRank)} / 完成時間 ${formatCookingTime(recipe.completionSeconds)}</p>
            <small>必要食材 ${recipe.ingredientIds.map((ingredientId) => escapeHtml(getIngredient(ingredientId).name)).join("・")}</small>
          </section>
        `,
        buttonLabel:
          "OK",
      });
      return true;
    }

    if (action === "inspect-dining-character") {
      MANAGEMENT_VIEW_STATE.diningSelectedCharacterId =
        actionElement.dataset.characterId;
      MANAGEMENT_VIEW_STATE.diningSelectedCharacterType =
        actionElement.dataset.characterType;
      MANAGEMENT_VIEW_STATE.diningSelectedFoods = [];
      updateCookingInPlace({
        anchorSelector:
          ".dining-modal-host",
      });
      return true;
    }

    if (action === "cancel-dining-selection") {
      MANAGEMENT_VIEW_STATE.diningSelectedCharacterId =
        null;
      MANAGEMENT_VIEW_STATE.diningSelectedCharacterType =
        null;
      MANAGEMENT_VIEW_STATE.diningSelectedFoods = [];
      updateCookingInPlace({
        anchorSelector:
          ".dining-modal-host",
      });
      return true;
    }

    if (action === "toggle-dining-food") {
      const variantKey =
        actionElement.dataset.variantKey;
      const snapshot =
        stateManager.getSnapshot();
      const record =
        snapshot.cooking.foodInventory?.[
          variantKey
        ];
      if (!record || record.quantity < 1) {
        showToast(
          "この料理は所持していません",
        );
        return true;
      }
      const selected =
        MANAGEMENT_VIEW_STATE
          .diningSelectedFoods;
      const index =
        selected.indexOf(
          variantKey,
        );
      if (index >= 0) {
        selected.splice(index, 1);
      } else {
        const recipeDuplicate =
          selected.some(
            (key) =>
              snapshot.cooking.foodInventory?.[
                key
              ]?.recipeId ===
              record.recipeId,
          );
        if (recipeDuplicate) {
          showToast(
            "同じ料理は重複して選べません",
          );
          return true;
        }
        if (
          selected.length >=
          DINING_RULES.dishesPerMeal
        ) {
          showToast(
            "料理は3品までです",
          );
          return true;
        }
        selected.push(
          variantKey,
        );
      }
      updateCookingInPlace({
        anchorSelector:
          ".dining-modal-host",
      });
      return true;
    }

    if (action === "serve-dining-meal") {
      const snapshot =
        stateManager.getSnapshot();
      const character =
        diningCharacterSource(
          snapshot,
          MANAGEMENT_VIEW_STATE
            .diningSelectedCharacterType,
          MANAGEMENT_VIEW_STATE
            .diningSelectedCharacterId,
        );
      const selected =
        [...MANAGEMENT_VIEW_STATE
          .diningSelectedFoods];
      if (
        !character ||
        selected.length !==
          DINING_RULES.dishesPerMeal
      ) {
        return true;
      }
      const foods =
        selected.map(
          (variantKey) => {
            const record =
              snapshot.cooking
                .foodInventory[
                  variantKey
                ];
            return {
              ...createFoodVariant(
                record.recipeId,
                record.qualityId,
              ),
              quantity:
                record.quantity,
            };
          },
        );
      const confirmed =
        await openConfirm({
          title:
            "これで提供しますか？",
          body: `
            <section class="dining-serve-confirm">
              <header>
                <img src="${escapeAttribute(character.image)}" alt="">
                <strong>${escapeHtml(character.name)}</strong>
              </header>
              <div>
                ${foods.map((food) => `
                  <article>
                    <img src="${escapeAttribute(food.image)}" alt="">
                    <span>${escapeHtml(food.qualityLabel)}</span>
                    <strong>${escapeHtml(food.name)}</strong>
                    <small>${escapeHtml(food.rank)} RANK</small>
                  </article>
                `).join("")}
              </div>
              <p>${escapeHtml(diningEffectDescription(character.type, foods))}</p>
            </section>
          `,
          confirmLabel:
            "はい",
          cancelLabel:
            "考え直す",
        });
      if (!confirmed) {
        return true;
      }
      try {
        const transaction =
          stateManager.transact(
            "dining_meal_served",
            (draft) =>
              serveDiningMealToDraft(
                draft,
                {
                  characterType:
                    character.type,
                  characterId:
                    character.characterId,
                  variantKeys:
                    selected,
                  startedAt:
                    new Date().toISOString(),
                },
              ),
          );
        MANAGEMENT_VIEW_STATE.diningSelectedCharacterId =
          null;
        MANAGEMENT_VIEW_STATE.diningSelectedCharacterType =
          null;
        MANAGEMENT_VIEW_STATE.diningSelectedFoods = [];
        showToast(
          `${transaction.result.characterName}へ料理を提供しました`,
        );
        updateCookingInPlace({
          anchorSelector:
            ".dining-room-stage",
        });
      } catch (error) {
        await showError(
          "料理を提供できません",
          error,
        );
      }
      return true;
    }

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
      MANAGEMENT_VIEW_STATE.shopCategory =
        actionElement.dataset.shopCategory;
      updateShopInPlace();
      actionElement.blur();
      return true;
    }
    if (action === "select-room-category") {
      MANAGEMENT_VIEW_STATE.roomCategory =
        actionElement.dataset.roomCategory;
      MANAGEMENT_VIEW_STATE.roomSelectedItem =
        null;
      updateRoomInPlace();
      return true;
    }
    if (action === "select-room-item") {
      MANAGEMENT_VIEW_STATE.roomSelectedItem =
        actionElement.dataset.roomItem;
      updateRoomInPlace();
      return true;
    }
    if (action === "open-collection-file") {
      MANAGEMENT_VIEW_STATE.collectionFile =
        actionElement.dataset.fileType;
      updateCollectionInPlace();
      return true;
    }
    if (action === "close-collection-file") {
      MANAGEMENT_VIEW_STATE.collectionFile = null;
      updateCollectionInPlace();
      return true;
    }
    if (action === "select-collection-food-quality") {
      MANAGEMENT_VIEW_STATE.collectionFoodQuality =
        actionElement.dataset.qualityId;
      MANAGEMENT_VIEW_STATE.collectionFoodPage = 1;
      updateCollectionInPlace();
      return true;
    }
    if (action === "change-collection-food-page") {
      MANAGEMENT_VIEW_STATE.collectionFoodPage =
        Number(actionElement.dataset.page) || 1;
      updateCollectionInPlace();
      return true;
    }
    if (action === "select-collection-pack") {
      MANAGEMENT_VIEW_STATE.selectedPackType = actionElement.dataset.packType;
      MANAGEMENT_VIEW_STATE.selectedPackId =
        actionElement.dataset.packId;
      updateCollectionInPlace();
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
        await playTrainingCinematic(
          latest,
          assignments,
          tx.result.memberResults,
        );
        const bonusRecord = tx.result.weekAdvance.weeks[0]?.weeklyBonus?.record;
        const memberRows = tx.result.memberResults.map((memberResult, index) => {
          const player = latest.playerTeam.members.find((entry) => entry.playerId === memberResult.playerId);
          const program = TRAINING_PROGRAMS.find((entry) => entry.id === memberResult.programId);
          return `
            <article class="training-result-member" style="--result-index:${index}">
              <img class="training-result-member__player player-portrait" data-character-portrait data-role="${escapeAttribute(player.role)}" src="${escapeAttribute(player.image)}" alt="">
              <img class="training-result-member__program" src="${escapeAttribute(program.image)}" alt="">
              <strong>${escapeHtml(player.name)}</strong>
              <span>${escapeHtml(program.name)}</span>
              <small>P+${memberResult.gain.power} T+${memberResult.gain.tech} M+${memberResult.gain.mental} S+${memberResult.gain.shoot}</small>
            </article>`;
        }).join("");

        await openAlert({
          title: "TRAINING COMPLETE",
          body: `
            <section class="training-result-show training-result-show--complete">
              <span>ABILITY POINT GET</span>
              <h3>${escapeHtml(formatManagementGameDate(beforeTrainingDate))}</h3>
              <div class="training-result-members">${memberRows}</div>
              <div class="training-result-total">
                <span>POWER <strong>+${formatNumber(total.power)}</strong></span>
                <span>TECH <strong>+${formatNumber(total.tech)}</strong></span>
                <span>MENTAL <strong>+${formatNumber(total.mental)}</strong></span>
                <span>SHOOT <strong>+${formatNumber(total.shoot)}</strong></span>
              </div>
              <small>バッジ +${(tx.result.badgeBonusRate * 100).toFixed(1)}% / コーチ食事 +${(tx.result.diningCoachBonusRate * 100).toFixed(1)}% / 合計 +${(tx.result.totalTrainingBonusRate * 100).toFixed(1)}%</small>
            </section>
          `,
          buttonLabel: "新しい週へ",
        });

        // 共通の従業員週開始画面をHOMEで表示します。
        renderPreservingScroll();
      } catch (error) { await showError("トレーニングできません", error); }
      return true;
    }

    if (action === "inspect-cooking-ingredient") {
      const ingredient =
        getIngredient(
          actionElement.dataset.ingredientId,
        );
      const snapshot =
        stateManager.getSnapshot();
      const maximum =
        Math.max(
          1,
          Math.min(
            99,
            Math.floor(
              snapshot.resources.coin /
              ingredient.priceCoin,
            ),
          ),
        );
      const quantity =
        await openQuantityPrompt({
          title:
            ingredient.name,
          body: `
            <section class="shop-item-detail-modal cooking-shop-detail">
              <div class="shop-item-detail-modal__image">
                <img src="${escapeAttribute(ingredient.image)}" alt="">
              </div>
              <p>料理を始める時に1個消費します。</p>
              <div class="cost-tags"><span>${formatNumber(ingredient.priceCoin)} COIN</span></div>
              <strong>所持 ${formatNumber(snapshot.cooking.ingredientInventory[ingredient.ingredientId] ?? 0)}</strong>
            </section>
          `,
          initialValue: 1,
          minimum: 1,
          maximum,
          confirmLabel:
            "購入する",
        });
      if (quantity === false) {
        return true;
      }
      try {
        const transaction =
          stateManager.transact(
            "cooking_ingredient_purchased",
            (draft) =>
              purchaseCookingIngredientToDraft(
                draft,
                ingredient.ingredientId,
                quantity,
              ),
          );
        showToast(
          `${transaction.result.name}を${formatNumber(quantity)}個購入しました`,
        );
        updateShopInPlace();
      } catch (error) {
        await showError(
          "食材を購入できません",
          error,
        );
      }
      return true;
    }

    if (action === "inspect-cooking-utensil") {
      const utensil =
        getCookingUtensil(
          actionElement.dataset.utensilId,
        );
      if (!utensil.shopAvailable) {
        return true;
      }
      const snapshot =
        stateManager.getSnapshot();
      const maximum =
        Math.max(
          1,
          Math.min(
            15,
            Math.floor(
              snapshot.resources.coin /
              utensil.priceCoin,
            ),
          ),
        );
      const quantity =
        await openQuantityPrompt({
          title:
            utensil.name,
          body: `
            <section class="shop-item-detail-modal cooking-shop-detail cooking-shop-detail--utensil">
              <i>${escapeHtml(cookingUtensilSymbol(utensil.utensilId))}</i>
              <p>キッチンの15枠へ配置できます。同じ器具を複数所持できます。</p>
              <div class="cost-tags"><span>${formatNumber(utensil.priceCoin)} COIN</span></div>
              <strong>所持 ${formatNumber(snapshot.cooking.utensilInventory[utensil.utensilId] ?? 0)}</strong>
            </section>
          `,
          initialValue: 1,
          minimum: 1,
          maximum,
          confirmLabel:
            "購入する",
        });
      if (quantity === false) {
        return true;
      }
      try {
        const transaction =
          stateManager.transact(
            "cooking_utensil_purchased",
            (draft) =>
              purchaseCookingUtensilToDraft(
                draft,
                utensil.utensilId,
                quantity,
              ),
          );
        showToast(
          `${transaction.result.name}を${formatNumber(quantity)}個購入しました`,
        );
        updateShopInPlace();
      } catch (error) {
        await showError(
          "調理器具を購入できません",
          error,
        );
      }
      return true;
    }

    if (action === "inspect-shop-item") {
      const item = getItem(actionElement.dataset.itemId);
      const snapshot = stateManager.getSnapshot();
      const quantity = await openQuantityPrompt({
        title: item.name,
        body: `<section class="shop-item-detail-modal"><div class="shop-item-detail-modal__image"><img src="${escapeAttribute(item.image)}" alt=""></div><p>${escapeHtml(item.description)}</p><div class="cost-tags">${currencyPriceTemplate(item.price)}</div><strong>所持 ${formatNumber(snapshot.inventory.items[item.itemId] ?? 0)}</strong></section>`,
        initialValue: 1,
        minimum: 1,
        maximum: 99,
        confirmLabel: "購入する",
      });
      if (quantity === false) return true;
      try {
        const tx = stateManager.transact(
          "item_purchased",
          (draft) =>
            purchaseConsumableToDraft(
              draft,
              item.itemId,
              quantity,
            ),
        );
        showToast(
          `${tx.result.name}を${quantity}個購入しました`,
        );
        updateShopInPlace();
      } catch (error) {
        await showError("購入できません", error);
      }
      return true;
    }

    if (action === "inspect-shop-pack") {
      const pack = getCardPack(actionElement.dataset.packId);
      const snapshot = stateManager.getSnapshot();
      const quantity = await openQuantityPrompt({
        title: pack.name,
        body: `<section class="shop-item-detail-modal shop-item-detail-modal--card-pack"><div class="shop-item-detail-modal__image"><img src="${escapeAttribute(pack.image)}" alt=""></div><p>カードパックをまとめて購入できます。1パックから${formatNumber(pack.cardsPerPack)}枚獲得します。</p>${cardPackCollectionStatsTemplate(snapshot, pack)}<div class="cost-tags">${currencyPriceTemplate(pack.price)}</div><strong>パック所持 ${formatNumber(snapshot.inventory.cardPacks[pack.packId] ?? 0)}</strong></section>`,
        initialValue: 1,
        minimum: 1,
        maximum: 99,
        confirmLabel: "購入する",
      });
      if (quantity === false) return true;
      try {
        const tx = stateManager.transact(
          "card_pack_purchased",
          (draft) =>
            purchaseCardPackToDraft(
              draft,
              pack.packId,
              quantity,
            ),
        );
        showToast(
          `${tx.result.name}を${quantity}個購入しました`,
        );
        updateShopInPlace();
      } catch (error) {
        await showError("購入できません", error);
      }
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
        updateShopInPlace();
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
        updateShopInPlace();
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
        await playSkinGachaCinematic(
          tx.result,
        );
        await openAlert({
          title: "NEW WEAPON SKIN",
          body: `
            <section class="skin-gacha-result-card">
              <div class="skin-gacha-result-card__light" aria-hidden="true"></div>
              <img src="${escapeAttribute(tx.result.image)}" alt="">
              <span>ACQUIRED</span>
              <strong>${escapeHtml(tx.result.name)}</strong>
              <small>未所持プール 残り${formatNumber(tx.result.remainingPoolCount)}</small>
            </section>
          `,
          buttonLabel: "受け取る",
        });
        renderPreservingScroll();
      } catch (error) { await showError("ガチャを実行できません", error); }
      return true;
    }

    if (action === "inspect-strategy-rank") {
      const rank =
        actionElement.dataset.strategyRank;
      const snapshot =
        stateManager.getSnapshot();
      const strategies =
        getStrategiesByRank(rank);
      await openAlert({
        title: `${rank} RANK STRATEGY`,
        body: `
          <section class="strategy-rank-modal">
            <header>
              <img src="${escapeAttribute(`icon/tak${rank.toLowerCase()}.png`)}" alt="">
              <div>
                <span>OWNED STRATEGY LIST</span>
                <strong>${escapeHtml(rank)} RANK</strong>
              </div>
            </header>
            <div class="strategy-rank-modal__list">
              ${strategies.map((strategy) => {
                const quantity =
                  rank === "D"
                    ? "∞"
                    : snapshot.inventory
                        .strategies[strategy.id] ?? 0;
                return `
                  <article class="${quantity === 0 ? "is-unowned" : ""}">
                    <img src="${escapeAttribute(strategy.icon)}" alt="">
                    <div>
                      <span>${escapeHtml(strategy.id)}</span>
                      <strong>${escapeHtml(strategy.name)}</strong>
                      <p>${escapeHtml(strategy.description ?? "大会中に使用する作戦です。")}</p>
                    </div>
                    <em>${quantity}</em>
                  </article>
                `;
              }).join("")}
            </div>
          </section>
        `,
        buttonLabel: "閉じる",
      });
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
        await playStrategyMeetingCinematic(
          result,
          stateManager.getSnapshot(),
        );
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
        updateCollectionInPlace();
      } catch (error) { await showError("パックを開封できません", error); }
      return true;
    }

    if (action === "select-cooking-slot") {
      const slotIndex =
        Number(
          actionElement.dataset.slotIndex,
        );
      if (
        Number.isInteger(slotIndex)
      ) {
        if (
          MANAGEMENT_VIEW_STATE.cookingSelectedSlot !==
          slotIndex
        ) {
          resetCookingSelection();
        }
        MANAGEMENT_VIEW_STATE.cookingSelectedSlot =
          slotIndex;
        MANAGEMENT_VIEW_STATE.cookingPopupOpen = true;
        updateCookingInPlace({
          anchorSelector:
            ".cooking-workbench",
        });
      }
      return true;
    }

    if (action === "close-cooking-popup") {
      MANAGEMENT_VIEW_STATE.cookingPopupOpen = false;
      updateCookingInPlace({ anchorSelector: ".cooking-workbench" });
      return true;
    }

    if (action === "place-cooking-utensil") {
      const slotIndex =
        Number(
          actionElement.dataset.slotIndex,
        );
      const utensilId =
        actionElement.dataset.utensilId;
      const utensil =
        getCookingUtensil(
          utensilId,
        );
      const confirmed =
        await openConfirm({
          title: `${utensil.name}を配置しますか？`,
          body: `
            <section class="cooking-confirm-card">
              <i>${escapeHtml(cookingUtensilSymbol(utensilId))}</i>
              <strong>${escapeHtml(utensil.name)}</strong>
              <p>調理枠${slotIndex + 1}へ配置します。</p>
            </section>
          `,
          confirmLabel:
            "配置する",
          cancelLabel:
            "やめる",
        });
      if (!confirmed) {
        return true;
      }
      try {
        stateManager.transact(
          "cooking_utensil_placed",
          (draft) =>
            placeCookingUtensilToDraft(
              draft.cooking,
              slotIndex,
              utensilId,
            ),
        );
        MANAGEMENT_VIEW_STATE.cookingSelectedSlot =
          slotIndex;
        resetCookingSelection();
        showToast(
          `${utensil.name}を配置しました`,
        );
        updateCookingInPlace({
          anchorSelector:
            ".cooking-workbench",
        });
      } catch (error) {
        await showError(
          "調理器具を配置できません",
          error,
        );
      }
      return true;
    }

    if (action === "remove-cooking-utensil") {
      const slotIndex =
        Number(
          actionElement.dataset.slotIndex,
        );
      const snapshot =
        stateManager.getSnapshot();
      const utensilId =
        snapshot.cooking.utensilSlots[
          slotIndex
        ];
      const utensil =
        getCookingUtensil(
          utensilId,
        );
      const confirmed =
        await openConfirm({
          title: `${utensil.name}を収納しますか？`,
          body: "<p>器具は所持品へ戻ります。調理中の器具は収納できません。</p>",
          confirmLabel:
            "収納する",
          cancelLabel:
            "戻る",
        });
      if (!confirmed) {
        return true;
      }
      try {
        stateManager.transact(
          "cooking_utensil_removed",
          (draft) =>
            removeCookingUtensilFromSlotToDraft(
              draft.cooking,
              slotIndex,
            ),
        );
        resetCookingSelection();
        updateCookingInPlace({
          anchorSelector:
            ".cooking-workbench",
        });
      } catch (error) {
        await showError(
          "調理器具を収納できません",
          error,
        );
      }
      return true;
    }

    if (action === "select-cooking-ingredient-slot") {
      const ingredientSlot =
        Number(
          actionElement.dataset.ingredientSlot,
        );
      MANAGEMENT_VIEW_STATE.cookingIngredientPickerSlot =
        MANAGEMENT_VIEW_STATE.cookingIngredientPickerSlot ===
        ingredientSlot
          ? null
          : ingredientSlot;
      updateCookingInPlace({
        anchorSelector:
          ".cooking-ingredient-builder",
      });
      return true;
    }

    if (action === "choose-cooking-ingredient") {
      const ingredientSlot =
        Number(
          actionElement.dataset.ingredientSlot,
        );
      const ingredientId =
        actionElement.dataset.ingredientId;
      const snapshot =
        stateManager.getSnapshot();
      const owned =
        snapshot.cooking
          .ingredientInventory[
            ingredientId
          ] ??
        0;
      const selectedElsewhere =
        MANAGEMENT_VIEW_STATE
          .cookingIngredientSlots
          .filter(
            (entry, index) =>
              index !==
                ingredientSlot &&
              entry ===
                ingredientId,
          )
          .length;
      if (
        owned <=
        selectedElsewhere
      ) {
        showToast(
          "この食材の所持数が不足しています",
        );
        return true;
      }
      MANAGEMENT_VIEW_STATE.cookingIngredientSlots[
        ingredientSlot
      ] = ingredientId;
      const nextEmptySlot =
        MANAGEMENT_VIEW_STATE
          .cookingIngredientSlots
          .findIndex(
            (entry, index) =>
              index > ingredientSlot &&
              entry === null,
          );
      const firstEmptySlot =
        MANAGEMENT_VIEW_STATE
          .cookingIngredientSlots
          .findIndex(
            (entry) =>
              entry === null,
          );
      MANAGEMENT_VIEW_STATE.cookingIngredientPickerSlot =
        nextEmptySlot >= 0
          ? nextEmptySlot
          : firstEmptySlot >= 0
            ? firstEmptySlot
            : ingredientSlot;
      updateCookingInPlace({
        anchorSelector:
          ".cooking-ingredient-builder",
      });
      return true;
    }

    if (action === "remove-cooking-ingredient") {
      const ingredientSlot =
        Number(
          actionElement.dataset.ingredientSlot,
        );
      MANAGEMENT_VIEW_STATE.cookingIngredientSlots[
        ingredientSlot
      ] = null;
      MANAGEMENT_VIEW_STATE.cookingIngredientPickerSlot =
        ingredientSlot;
      updateCookingInPlace({
        anchorSelector:
          ".cooking-ingredient-builder",
      });
      return true;
    }

    if (action === "clear-cooking-ingredients") {
      resetCookingSelection();
      updateCookingInPlace({
        anchorSelector:
          ".cooking-ingredient-builder",
      });
      return true;
    }

    if (action === "start-cooking") {
      const slotIndex =
        Number(
          actionElement.dataset.slotIndex,
        );
      const recipeId =
        actionElement.dataset.recipeId;
      const recipe =
        getRecipe(
          recipeId,
        );
      const snapshot =
        stateManager.getSnapshot();
      const discovered =
        Boolean(
          snapshot.cooking
            .recipeDiscovery[
              recipeId
            ],
        );
      const ingredients =
        selectedCookingIngredients();
      const confirmed =
        await openConfirm({
          title:
            "調理を開始しますか？",
          body: `
            <section class="cooking-start-confirm">
              <div class="${discovered ? "is-known" : "is-unknown"}">
                <img src="${escapeAttribute(recipe.image)}" alt="">
                ${discovered ? "" : "<i>?</i>"}
              </div>
              <strong>${discovered ? escapeHtml(recipe.name) : "未発見の料理"}</strong>
              <span>完成まで ${formatCookingTime(recipe.completionSeconds)}</span>
              <p>選択した食材を各1個消費します。品質は通常80％・高級15％・伝説5％です。</p>
            </section>
          `,
          confirmLabel:
            "はい",
          cancelLabel:
            "いいえ",
        });
      if (!confirmed) {
        return true;
      }
      try {
        stateManager.transact(
          "cooking_started",
          (draft) =>
            startCookingJobToDraft(
              draft.cooking,
              slotIndex,
              recipeId,
              ingredients,
              {
                companyRank:
                  draft.company.rank,
                startedAt:
                  new Date().toISOString(),
              },
            ),
        );
        resetCookingSelection();
        MANAGEMENT_VIEW_STATE.cookingSelectedSlot =
          slotIndex;
        MANAGEMENT_VIEW_STATE.cookingPopupOpen = false;
        showToast(
          "調理を開始しました",
        );
        updateCookingInPlace({
          anchorSelector:
            ".cooking-workbench",
        });
      } catch (error) {
        await showError(
          "調理を開始できません",
          error,
        );
      }
      return true;
    }

    if (action === "collect-cooking-job") {
      const slotIndex =
        Number(
          actionElement.dataset.slotIndex,
        );
      try {
        const transaction =
          stateManager.transact(
            "cooking_collected",
            (draft) =>
              collectCookingJobToDraft(
                draft.cooking,
                slotIndex,
                {
                  collectedAt:
                    new Date().toISOString(),
                },
              ),
          );
        await playCookingCompletionCinematic(
          transaction.result,
        );
        resetCookingSelection();
        MANAGEMENT_VIEW_STATE.cookingSelectedSlot =
          slotIndex;
        updateCookingInPlace({
          anchorSelector:
            ".cooking-workbench",
        });
      } catch (error) {
        await showError(
          "料理を回収できません",
          error,
        );
      }
      return true;
    }

    if (action === "open-cooking-storage") {
      MANAGEMENT_VIEW_STATE.cookingView =
        "storage";
      updateCookingInPlace({
        anchorSelector:
          ".cooking-subnav",
      });
      return true;
    }

    if (action === "open-cooking-cafeteria") {
      MANAGEMENT_VIEW_STATE.cookingView =
        "dining";
      updateCookingInPlace({
        anchorSelector:
          ".cooking-subnav",
      });
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
        updateRoomInPlace();
      } catch (error) { await showError("ROOMを購入できません", error); }
      return true;
    }

    if (action === "activate-room") {
      try {
        stateManager.transact("room_activated", (draft) =>
          activateRoomToDraft(draft, actionElement.dataset.roomId),
        );
        MANAGEMENT_VIEW_STATE.roomSelectedPlacementId = null;
        MANAGEMENT_VIEW_STATE.roomSelectedItem = null;
        updateRoomInPlace();
      } catch (error) { await showError("ROOMへ入室できません", error); }
      return true;
    }

    if (action === "add-room-item") {
      const value =
        MANAGEMENT_VIEW_STATE.roomSelectedItem;
      if (!value) {
        return true;
      }
      try {
        const tx =
          stateManager.transact(
            "room_item_added",
            (draft) =>
              addRoomPlacementToDraft(
                draft,
                actionElement.dataset.roomId,
                JSON.parse(value),
              ),
          );
        MANAGEMENT_VIEW_STATE.roomSelectedPlacementId =
          tx.result.placementId;
        updateRoomInPlace();
      } catch (error) { await showError("ROOMへ配置できません", error); }
      return true;
    }

    if (action === "set-home-room") {
      try {
        stateManager.transact(
          "home_room_selected",
          (draft) =>
            setHomeRoomToDraft(
              draft,
              actionElement.dataset.roomId,
            ),
        );
        showToast("HOME背景へ設定しました");
        updateRoomInPlace();
      } catch (error) {
        await showError("HOME背景を変更できません", error);
      }
      return true;
    }

    if (["room-scale-down", "room-scale-up", "room-flip", "room-front", "room-back", "room-center", "room-remove"].includes(action)) {
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
          if (action === "room-back") {
            return sendRoomPlacementToBackToDraft(draft, roomId, placementId);
          }
          if (action === "room-center") {
            return updateRoomPlacementToDraft(
              draft,
              roomId,
              placementId,
              {
                x: 50,
                y: 50,
              },
            );
          }
          return removeRoomPlacementToDraft(draft, roomId, placementId);
        });
        if (action === "room-remove") {
          MANAGEMENT_VIEW_STATE.roomSelectedPlacementId = null;
        }
        updateRoomInPlace();
      } catch (error) { await showError("ROOM配置を変更できません", error); }
      return true;
    }

    return false;
  }

  function afterRender(route) {
    if (cookingTimerId !== null) {
      clearInterval(
        cookingTimerId,
      );
      cookingTimerId = null;
    }
    cookingReadyRefreshScheduled =
      false;

    if (route === "cooking") {
      const updateCountdowns = () => {
        let refreshRequired =
          false;
        const now =
          Date.now();

        for (
          const element
          of root.querySelectorAll(
            "[data-cooking-countdown]",
          )
        ) {
          const readyAt =
            new Date(
              element.dataset.readyAt,
            ).getTime();
          const remaining =
            Math.max(
              0,
              Math.ceil(
                (
                  readyAt - now
                ) /
                1000,
              ),
            );
          element.textContent =
            remaining === 0
              ? "READY"
              : formatCookingTime(
                  remaining,
                );
          if (remaining === 0) {
            refreshRequired =
              true;
          }
        }

        let diningNeedsSettle =
          false;
        for (
          const element
          of root.querySelectorAll(
            "[data-dining-countdown]",
          )
        ) {
          const readyAt =
            new Date(
              element.dataset.readyAt,
            ).getTime();
          const clearAt =
            new Date(
              element.dataset.clearAt,
            ).getTime();
          if (now >= clearAt) {
            diningNeedsSettle =
              true;
            continue;
          }
          if (now >= readyAt) {
            element.textContent =
              "FINISH";
            if (
              element.dataset.phase !==
              "finished"
            ) {
              element.dataset.phase =
                "finished";
              refreshRequired =
                true;
            }
          } else {
            element.textContent =
              `${Math.max(0, Math.ceil((readyAt - now) / 1000))}s`;
          }
        }

        if (diningNeedsSettle) {
          try {
            const transaction =
              stateManager.transact(
                "dining_meals_settled",
                (draft) =>
                  settleDiningMealsToDraft(
                    draft,
                    {
                      settledAt:
                        new Date().toISOString(),
                    },
                  ),
              );
            if (
              transaction.result.length > 0
            ) {
              updateCookingInPlace({
                anchorSelector:
                  ".dining-room-stage",
              });
              return;
            }
          } catch (_error) {
            // A later timer pass can safely retry settlement.
          }
        }

        if (
          refreshRequired &&
          !cookingReadyRefreshScheduled
        ) {
          cookingReadyRefreshScheduled =
            true;
          queueMicrotask(
            () =>
              updateCookingInPlace({
                anchorSelector:
                  MANAGEMENT_VIEW_STATE.cookingView === "dining"
                    ? ".dining-room-stage"
                    : ".cooking-workbench",
              }),
          );
        }
      };
      updateCountdowns();
      cookingTimerId =
        setInterval(
          updateCountdowns,
          250,
        );
      return;
    }

    if (route !== "room") return;
    const canvas =
      root.querySelector(
        "[data-room-canvas]",
      );
    if (!canvas) return;
    const roomId =
      canvas.dataset.roomId;

    for (
      const placement
      of canvas.querySelectorAll(
        "[data-room-placement]",
      )
    ) {
      placement.addEventListener(
        "pointerdown",
        (event) => {
          if (
            event.target.closest(
              "button",
            )
          ) {
            return;
          }
          event.preventDefault();

          const rect =
            canvas.getBoundingClientRect();
          const placementId =
            placement.dataset.placementId;
          const startX =
            event.clientX;
          const startY =
            event.clientY;
          let dragged = false;

          placement.setPointerCapture?.(
            event.pointerId,
          );

          const move = (
            moveEvent,
          ) => {
            if (
              Math.hypot(
                moveEvent.clientX -
                  startX,
                moveEvent.clientY -
                  startY,
              ) > 5
            ) {
              dragged = true;
            }
            if (!dragged) {
              return;
            }
            const x =
              Math.min(
                100,
                Math.max(
                  0,
                  (
                    (
                      moveEvent.clientX -
                      rect.left
                    ) /
                    rect.width
                  ) *
                  100,
                ),
              );
            const y =
              Math.min(
                100,
                Math.max(
                  0,
                  (
                    (
                      moveEvent.clientY -
                      rect.top
                    ) /
                    rect.height
                  ) *
                  100,
                ),
              );
            placement.style.left =
              `${x}%`;
            placement.style.top =
              `${y}%`;
            placement.dataset.pendingX =
              String(x);
            placement.dataset.pendingY =
              String(y);
          };

          const finish = () => {
            placement.removeEventListener(
              "pointermove",
              move,
            );
            placement.removeEventListener(
              "pointerup",
              finish,
            );
            placement.removeEventListener(
              "pointercancel",
              finish,
            );

            if (!dragged) {
              const wasSelected =
                MANAGEMENT_VIEW_STATE.roomSelectedPlacementId === placementId;
              MANAGEMENT_VIEW_STATE.roomSelectedPlacementId =
                wasSelected ? null : placementId;
              for (const entry of canvas.querySelectorAll("[data-room-placement]")) {
                entry.classList.remove("is-selected");
                entry.querySelector(".room-placement__controls")?.remove();
              }
              if (!wasSelected) {
                placement.classList.add("is-selected");
                placement.insertAdjacentHTML(
                  "beforeend",
                  roomPlacementControlsTemplate(roomId, placementId),
                );
              }
              return;
            }

            const x =
              Number(
                placement.dataset.pendingX,
              );
            const y =
              Number(
                placement.dataset.pendingY,
              );
            delete placement.dataset.pendingX;
            delete placement.dataset.pendingY;

            if (
              !Number.isFinite(x) ||
              !Number.isFinite(y)
            ) {
              return;
            }
            try {
              stateManager.transact(
                "room_placement_moved",
                (draft) =>
                  updateRoomPlacementToDraft(
                    draft,
                    roomId,
                    placementId,
                    {
                      x,
                      y,
                    },
                  ),
              );
            } catch (_error) {
              showToast(
                "ROOM配置を保存できませんでした",
              );
            }
          };

          placement.addEventListener(
            "pointermove",
            move,
          );
          placement.addEventListener(
            "pointerup",
            finish,
          );
          placement.addEventListener(
            "pointercancel",
            finish,
          );
        },
      );
    }
  }

  return Object.freeze({ handleAction, afterRender });
}
