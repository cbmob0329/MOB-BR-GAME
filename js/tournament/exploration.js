/**
 * MOB BR tournament exploration, bag, facilities, and strategy selection.
 *
 * Exploration candidates and facility outcomes are deterministic per
 * tournament/session/match/exploreIndex. All mutations operate on a tournament
 * runtime transaction draft; the main save is never touched directly.
 */

import { assetPath } from "../assets.js";
import {
  CONSUMABLE_ITEMS,
  ITEM_MASTER_VERSION,
  getItem,
} from "../../data/shop-data.js";
import {
  STRATEGIES,
  STRATEGY_RANKS,
  STRATEGY_RULES,
} from "../../data/strategy-data.js";
import {
  getPlayableRoundCount,
} from "./round.js?v=32";

export const EXPLORATION_VERSION =
  "mobbr-tournament-exploration-1.7.0";

export const EXPLORATION_PAGES = Object.freeze([
  "SEARCH",
  "FACILITY",
  "BAG",
  "ALIVE_TEAMS",
]);

export const EXPLORATION_RULES = Object.freeze({
  maximumPerMatch: 3,
  standardAfterRounds: Object.freeze([2, 4]),
  searchCandidateCount: 3,
  searchPointCount: 3,
  respawnTurntableAppearanceRate: 0.7,
  respawnTurntableReviveHpRate: 0.5,
  mobSlotWinRate: 0.7,
  mobSlotHealHpRate: 0.7,
  matchEffectDurationSeconds: 999_999,
  pages: EXPLORATION_PAGES,
});

export const EXPLORATION_AREAS = Object.freeze([
  "中央ネオン区画",
  "旧貨物ターミナル",
  "高架下マーケット",
  "乾燥岩盤エリア",
  "溶岩監視通路",
  "郊外住宅ブロック",
]);

export const EXPLORATION_SEARCH_POINTS = Object.freeze([
  Object.freeze({
    pointId: "tan1",
    name: "探索地点 1",
    icon: "icon/tan1.png",
  }),
  Object.freeze({
    pointId: "tan2",
    name: "探索地点 2",
    icon: "icon/tan2.png",
  }),
  Object.freeze({
    pointId: "tan3",
    name: "探索地点 3",
    icon: "icon/tan3.png",
  }),
]);

export const FACILITY_IDS = Object.freeze({
  respawnTurntable: "respawn_turntable",
  mobSlot: "mob_slot",
});

export const STRATEGY_TABS = Object.freeze(
  [...STRATEGY_RULES.rankTabs],
);

const ROLE_ORDER = Object.freeze(["IGL", "ATK", "SUP"]);

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

function assertRuntimeDraft(draft) {
  if (!draft || typeof draft !== "object") {
    throw new TypeError("Tournament runtime draft must be an object.");
  }
  if (!draft.explorationRuntime || !draft.facilityRuntime) {
    throw new TypeError("Tournament exploration runtime is missing.");
  }
  return draft;
}

function hashText(value) {
  const text = String(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0 || 0x9e3779b9;
}

function createSeededRandom(seedText) {
  let state = hashText(seedText);
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0x1_0000_0000;
  };
}

const ITEM_STAT_LABELS = Object.freeze({
  stamina: "スタミナ",
  mind: "精神",
  physical: "フィジカル",
  aim: "エイム",
  agility: "敏捷",
  technique: "技術",
  support: "サポート",
});

export function getItemEffectSummary(itemOrId) {
  const item =
    typeof itemOrId === "string"
      ? getItem(itemOrId)
      : itemOrId;
  if (item.effectType === "match_stat") {
    const stat =
      ITEM_STAT_LABELS[
        item.effectValue.stat
      ] ?? item.effectValue.stat;
    return `${stat} +${item.effectValue.amount}（このMATCH中）`;
  }
  if (item.effectType === "heal_max_hp_rate") {
    return `最大HPの${Math.round(item.effectValue.rate * 100)}%を回復`;
  }
  if (item.effectType === "revive_max_hp_rate") {
    return `確キル状態から最大HP${Math.round(item.effectValue.rate * 100)}%で復活`;
  }
  return item.description;
}

function activeItemStatBonus(
  runtimeMember,
  statId,
) {
  return (
    runtimeMember.temporaryEffects ?? []
  ).reduce(
    (sum, effect) =>
      sum +
      Number(
        effect.stats?.[statId] ?? 0,
      ),
    0,
  );
}

function createItemTargetPreview(
  runtime,
  item,
  member,
) {
  const state =
    runtime.memberRuntime[
      member.playerId
    ];
  const preview = {
    playerId: member.playerId,
    role: member.role,
    name: member.name,
    image: member.image,
    combatState: state.combatState,
    hpBefore: state.hp,
    hpAfter: state.hp,
    maxHp: state.maxHp,
    statId: null,
    statLabel: null,
    statBefore: null,
    statAfter: null,
  };

  if (
    item.effectType ===
    "heal_max_hp_rate"
  ) {
    preview.hpAfter =
      state.combatState === "alive"
        ? Math.min(
            state.maxHp,
            state.hp +
              Math.floor(
                state.maxHp *
                item.effectValue.rate,
              ),
          )
        : state.hp;
  } else if (
    item.effectType ===
    "revive_max_hp_rate"
  ) {
    preview.hpAfter =
      Math.max(
        1,
        Math.floor(
          state.maxHp *
          item.effectValue.rate,
        ),
      );
  } else if (
    item.effectType === "match_stat"
  ) {
    const statId =
      item.effectValue.stat;
    const base =
      Number(
        member.stats?.[statId] ?? 0,
      );
    const active =
      activeItemStatBonus(
        state,
        statId,
      );
    preview.statId = statId;
    preview.statLabel =
      ITEM_STAT_LABELS[statId] ??
      statId;
    preview.statBefore =
      base + active;
    preview.statAfter =
      preview.statBefore +
      item.effectValue.amount;
  }

  return preview;
}

function itemTargetPreviewTemplate(
  runtime,
  item,
  member,
) {
  const preview =
    createItemTargetPreview(
      runtime,
      item,
      member,
    );
  const dead =
    preview.combatState === "dead";
  return `
    <article
      class="bag-target-preview ${dead ? "is-dead" : ""}"
    >
      <img
        src="${escapeAttribute(assetPath(preview.image))}"
        alt=""
      >
      <div>
        <span>${escapeHtml(preview.role)}</span>
        <strong>${escapeHtml(preview.name)}</strong>
        ${
          preview.statId
            ? `
              <small>
                ${escapeHtml(preview.statLabel)}
                ${formatNumber(preview.statBefore)}
                → <b>${formatNumber(preview.statAfter)}</b>
              </small>
            `
            : `
              <small>
                ${dead ? "DEAD" : "HP"}
                ${formatNumber(preview.hpBefore)}
                → <b>${formatNumber(preview.hpAfter)}</b>
                / ${formatNumber(preview.maxHp)}
              </small>
            `
        }
      </div>
    </article>
  `;
}

function itemStrengthScore(item) {
  if (item.effectType === "match_stat") {
    return Number(item.effectValue?.amount ?? 1) * 2;
  }
  if (item.effectType === "heal_max_hp_rate") {
    return Number(item.effectValue?.rate ?? 0.3) * 10;
  }
  if (item.effectType === "revive_max_hp_rate") {
    return 8 + Number(item.effectValue?.rate ?? 0.5) * 4;
  }
  return 4;
}

export function getExplorationItemWeight(item) {
  if (Number.isFinite(item.rarityWeight) && item.rarityWeight > 0) {
    return item.rarityWeight;
  }
  const coinPrice = Number(item.price?.coin ?? 0);
  const strength = itemStrengthScore(item);
  return Math.max(
    1,
    Math.round(120 / (1 + coinPrice / 12_000 + strength * 0.7)),
  );
}

function weightedPick(random, entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let cursor = random() * total;
  for (const entry of entries) {
    cursor -= entry.weight;
    if (cursor <= 0) {
      return entry.value;
    }
  }
  return entries.at(-1).value;
}

export function createExploreKey(runtime, exploreIndex) {
  if (!Number.isInteger(exploreIndex) || exploreIndex < 1 || exploreIndex > 3) {
    throw new RangeError("Explore index must be from 1 to 3.");
  }
  return [
    runtime.tournamentId,
    runtime.sessionId,
    runtime.match,
    exploreIndex,
  ].join(":");
}

export function calculateExplorationSchedule(totalRounds) {
  if (!Number.isInteger(totalRounds) || totalRounds < 1) {
    throw new RangeError("Total rounds must be a positive integer.");
  }
  if (totalRounds === 5 || totalRounds === 6) {
    return deepFreeze({
      initial: true,
      afterRounds: [2, 4],
    });
  }

  const maximumAfterRound = Math.max(1, totalRounds - 1);
  const middle = Math.min(
    maximumAfterRound,
    Math.max(1, Math.round(totalRounds * 0.4)),
  );
  let late = Math.min(
    maximumAfterRound,
    Math.max(middle + 1, Math.round(totalRounds * 0.8)),
  );
  if (late === middle) {
    late = Math.min(maximumAfterRound, middle + 1);
  }
  return deepFreeze({
    initial: true,
    afterRounds: [...new Set([middle, late])],
  });
}

export function getDueRoundExplorationIndex(runtime) {
  const totalRounds = getPlayableRoundCount(runtime);
  const schedule = calculateExplorationSchedule(totalRounds);
  const completedRound = runtime.round - 1;
  const scheduleIndex = schedule.afterRounds.indexOf(completedRound);
  if (scheduleIndex < 0) {
    return null;
  }
  const exploreIndex = scheduleIndex + 2;
  const key = createExploreKey(runtime, exploreIndex);
  return runtime.explorationRuntime.completedKeys.includes(key)
    ? null
    : exploreIndex;
}

function createSearchCandidates(runtime, exploreKey) {
  return EXPLORATION_SEARCH_POINTS.map((point, index) => {
    const random = createSeededRandom(
      `${runtime.entryId}|${exploreKey}|search-point|${point.pointId}|${ITEM_MASTER_VERSION}`,
    );
    const item = weightedPick(
      random,
      CONSUMABLE_ITEMS.map((entry) => ({
        value: entry,
        weight: getExplorationItemWeight(entry),
      })),
    );
    return {
      candidateId: `${exploreKey}:search-point:${index + 1}`,
      pointId: point.pointId,
      pointName: point.name,
      pointIcon: point.icon,
      resultItemId: item.itemId,
      rarityWeight: getExplorationItemWeight(item),
    };
  });
}

function normalizeSearchCandidates(runtime, exploreKey, candidates) {
  if (
    Array.isArray(candidates) &&
    candidates.length === EXPLORATION_RULES.searchPointCount &&
    candidates.every(
      (candidate) =>
        candidate?.pointId &&
        candidate?.pointIcon &&
        (candidate?.resultItemId || candidate?.itemId),
    )
  ) {
    return candidates.map((candidate, index) => ({
      candidateId:
        candidate.candidateId ??
        `${exploreKey}:search-point:${index + 1}`,
      pointId:
        candidate.pointId ??
        EXPLORATION_SEARCH_POINTS[index].pointId,
      pointName:
        candidate.pointName ??
        EXPLORATION_SEARCH_POINTS[index].name,
      pointIcon:
        candidate.pointIcon ??
        EXPLORATION_SEARCH_POINTS[index].icon,
      resultItemId:
        candidate.resultItemId ??
        candidate.itemId,
      rarityWeight:
        candidate.rarityWeight ??
        getExplorationItemWeight(
          getItem(candidate.resultItemId ?? candidate.itemId),
        ),
    }));
  }

  // Compatibility with exploration saves created before Generation 21.
  if (
    Array.isArray(candidates) &&
    candidates.length > 0
  ) {
    return EXPLORATION_SEARCH_POINTS.map((point, index) => {
      const legacy =
        candidates[index % candidates.length];
      const fallback =
        createSearchCandidates(runtime, exploreKey)[index];
      return {
        candidateId:
          legacy?.candidateId ??
          `${exploreKey}:search-point:${index + 1}`,
        pointId: point.pointId,
        pointName: point.name,
        pointIcon: point.icon,
        resultItemId:
          legacy?.resultItemId ??
          legacy?.itemId ??
          fallback.resultItemId,
        rarityWeight:
          legacy?.rarityWeight ??
          fallback.rarityWeight,
      };
    });
  }

  return createSearchCandidates(runtime, exploreKey);
}

export function getSearchPointReward(
  runtime,
  candidate,
) {
  const itemId =
    candidate?.resultItemId ??
    candidate?.itemId;
  return itemId
    ? getItem(itemId)
    : null;
}

function createFacilityOutcome(runtime, exploreKey) {
  const random = createSeededRandom(
    `${runtime.entryId}|${exploreKey}|facility`,
  );
  return {
    respawnTurntableAppears:
      random() < EXPLORATION_RULES.respawnTurntableAppearanceRate,
    mobSlotSuccess:
      random() < EXPLORATION_RULES.mobSlotWinRate,
  };
}

export function beginExplorationToDraft(
  draft,
  {
    exploreIndex,
    source = "initial",
  },
) {
  assertRuntimeDraft(draft);
  const key = createExploreKey(draft, exploreIndex);
  if (draft.explorationRuntime.completedKeys.includes(key)) {
    throw new RangeError(`Exploration is already complete: ${key}`);
  }

  const existing =
    draft.explorationRuntime.deterministicChoices[key];
  const choices =
    existing ??
    {
      exploreKey: key,
      exploreIndex,
      source,
      areaName:
        EXPLORATION_AREAS[
          hashText(`${draft.entryId}|${key}|area`) %
            EXPLORATION_AREAS.length
        ],
      candidates: createSearchCandidates(draft, key),
      selectedCandidateId: null,
      selectedPointId: null,
      resultType: null,
      resultItemId: null,
      resultReplacedItemId: null,
      searchResolved: false,
      completed: false,
    };

  choices.candidates = normalizeSearchCandidates(
    draft,
    key,
    choices.candidates,
  );
  choices.selectedPointId =
    choices.selectedPointId ??
    choices.candidates.find(
      (candidate) =>
        candidate.candidateId === choices.selectedCandidateId,
    )?.pointId ??
    null;

  draft.explorationRuntime.deterministicChoices[key] =
    deepClone(choices);
  draft.facilityRuntime.deterministicOutcomes[key] =
    draft.facilityRuntime.deterministicOutcomes[key] ??
    createFacilityOutcome(draft, key);
  draft.facilityRuntime.usedByExploreKey[key] =
    draft.facilityRuntime.usedByExploreKey[key] ?? {
      [FACILITY_IDS.respawnTurntable]: false,
      [FACILITY_IDS.mobSlot]: false,
    };

  draft.explorationRuntime.currentExploreIndex = exploreIndex;
  draft.explorationRuntime.currentExploreKey = key;
  draft.explorationRuntime.currentPage = "SEARCH";
  draft.explorationRuntime.pendingExploreItem = null;
  draft.explorationRuntime.pendingItemUse = null;
  draft.explorationRuntime.currentAreaName = choices.areaName;
  draft.pendingVisualId = `exploration:${key}`;

  return deepFreeze(deepClone(choices));
}

export function setExplorationPageToDraft(draft, page) {
  assertRuntimeDraft(draft);
  if (!EXPLORATION_PAGES.includes(page)) {
    throw new RangeError(`Unknown exploration page: ${page}`);
  }
  draft.explorationRuntime.currentPage = page;
  return page;
}

function findInventorySlot(draft, slotIndex) {
  if (
    !Number.isInteger(slotIndex) ||
    slotIndex < 0 ||
    slotIndex >= draft.inventory.capacity
  ) {
    throw new RangeError("Inventory slot index is invalid.");
  }
  return draft.inventory.slots[slotIndex];
}

function createExplorationInventoryItem(item, slotIndex) {
  return {
    slotIndex,
    itemId: item.itemId,
    name: item.name,
    image: item.image,
    source: "exploration",
    quantity: 1,
    initialQuantity: 0,
    carryQuantity: 0,
    explorationQuantity: 1,
    acquiredDuringTournament: true,
  };
}

function acquireExplorationItem(draft, item) {
  const sameItemSlot = draft.inventory.slots.find(
    (slot) => slot?.itemId === item.itemId,
  );
  if (sameItemSlot) {
    sameItemSlot.quantity += 1;
    sameItemSlot.carryQuantity =
      sameItemSlot.carryQuantity ?? sameItemSlot.initialQuantity ?? 0;
    sameItemSlot.explorationQuantity =
      (sameItemSlot.explorationQuantity ?? 0) + 1;
    draft.inventory.acquiredItemIds.push(item.itemId);
    return {
      status: "stored",
      stacked: true,
      slotIndex: sameItemSlot.slotIndex,
    };
  }

  const emptyIndex = draft.inventory.slots.findIndex((slot) => slot === null);
  if (emptyIndex >= 0) {
    draft.inventory.slots[emptyIndex] =
      createExplorationInventoryItem(item, emptyIndex);
    draft.inventory.acquiredItemIds.push(item.itemId);
    return {
      status: "stored",
      stacked: false,
      slotIndex: emptyIndex,
    };
  }

  return {
    status: "backpack_full",
  };
}

function currentChoice(draft) {
  const key = draft.explorationRuntime.currentExploreKey;
  if (!key) {
    throw new RangeError("No exploration is active.");
  }
  const choice = draft.explorationRuntime.deterministicChoices[key];
  if (!choice) {
    throw new RangeError(`Exploration choice is missing: ${key}`);
  }
  return choice;
}

export function selectSearchCandidateToDraft(draft, candidateId) {
  assertRuntimeDraft(draft);
  const choice = currentChoice(draft);
  if (choice.searchResolved) {
    throw new RangeError("The search choice is already resolved.");
  }
  if (draft.explorationRuntime.pendingExploreItem) {
    throw new RangeError("A backpack-full decision is already pending.");
  }

  const candidate = choice.candidates.find(
    (entry) => entry.candidateId === candidateId,
  );
  if (!candidate) {
    throw new RangeError(`Unknown search candidate: ${candidateId}`);
  }

  const resultItemId =
    candidate.resultItemId ??
    candidate.itemId;
  if (!resultItemId) {
    throw new RangeError(
      `Search point reward is missing: ${candidateId}`,
    );
  }
  const item = getItem(resultItemId);
  choice.selectedCandidateId = candidateId;
  choice.selectedPointId =
    candidate.pointId ?? null;
  const acquisition = acquireExplorationItem(draft, item);

  if (acquisition.status === "backpack_full") {
    draft.explorationRuntime.pendingExploreItem = {
      exploreKey: choice.exploreKey,
      candidateId,
      pointId: choice.selectedPointId,
      itemId: item.itemId,
      name: item.name,
      image: item.image,
      description: item.description,
    };
    return deepFreeze({
      status: "backpack_full",
      itemId: item.itemId,
      name: item.name,
    });
  }

  choice.searchResolved = true;
  choice.resultType = acquisition.stacked ? "stacked" : "stored";
  choice.resultItemId = item.itemId;
  draft.explorationRuntime.history.push({
    type: "search_item",
    exploreKey: choice.exploreKey,
    itemId: item.itemId,
    result: choice.resultType,
  });
  return deepFreeze({
    ...acquisition,
    itemId: item.itemId,
    name: item.name,
  });
}

export function resolveBackpackFullToDraft(
  draft,
  {
    replaceSlotIndex = null,
    decline = false,
  } = {},
) {
  assertRuntimeDraft(draft);
  const pending = draft.explorationRuntime.pendingExploreItem;
  if (!pending) {
    throw new RangeError("No backpack-full decision is pending.");
  }
  const choice = currentChoice(draft);

  if (decline === true) {
    choice.searchResolved = true;
    choice.resultType = "declined";
    choice.resultItemId = pending.itemId;
    draft.explorationRuntime.history.push({
      type: "search_item",
      exploreKey: choice.exploreKey,
      itemId: pending.itemId,
      result: "declined",
    });
    draft.explorationRuntime.pendingExploreItem = null;
    return deepFreeze({
      status: "declined",
      itemId: pending.itemId,
    });
  }

  const replaced = findInventorySlot(draft, replaceSlotIndex);
  if (!replaced) {
    throw new RangeError("An occupied slot must be selected for replacement.");
  }
  const newItem = getItem(pending.itemId);
  draft.inventory.slots[replaceSlotIndex] =
    createExplorationInventoryItem(newItem, replaceSlotIndex);
  draft.inventory.acquiredItemIds.push(newItem.itemId);

  choice.searchResolved = true;
  choice.resultType = "replaced";
  choice.resultItemId = newItem.itemId;
  choice.resultReplacedItemId = replaced.itemId;
  draft.explorationRuntime.history.push({
    type: "search_item",
    exploreKey: choice.exploreKey,
    itemId: newItem.itemId,
    replacedItemId: replaced.itemId,
    result: "replaced",
  });
  draft.explorationRuntime.pendingExploreItem = null;
  return deepFreeze({
    status: "replaced",
    itemId: newItem.itemId,
    replacedItemId: replaced.itemId,
    slotIndex: replaceSlotIndex,
  });
}

function playerTeam(draft) {
  return draft.teams.find(
    (team) => team.teamId === draft.playerTeamId,
  );
}

function sortedPlayerMembers(draft) {
  return [...playerTeam(draft).members].sort(
    (left, right) =>
      ROLE_ORDER.indexOf(left.role) - ROLE_ORDER.indexOf(right.role),
  );
}

function syncPlayerTeamRuntime(draft) {
  const team = playerTeam(draft);
  const teamRuntime = draft.teamRuntime[draft.playerTeamId];
  teamRuntime.matchHp = team.members.map(
    (member) => draft.memberRuntime[member.playerId].hp,
  );
  teamRuntime.persistentHp = [...teamRuntime.matchHp];
  teamRuntime.combatState = team.members.map(
    (member) => draft.memberRuntime[member.playerId].combatState,
  );
}

function healMember(runtimeMember, rate) {
  if (
    runtimeMember.combatState !== "alive" ||
    runtimeMember.hp >= runtimeMember.maxHp
  ) {
    return 0;
  }
  const amount = Math.min(
    runtimeMember.maxHp - runtimeMember.hp,
    Math.floor(runtimeMember.maxHp * rate),
  );
  runtimeMember.hp += amount;
  return amount;
}

function reviveDeadMember(runtimeMember, rate) {
  if (runtimeMember.combatState !== "dead") {
    return 0;
  }
  runtimeMember.combatState = "alive";
  runtimeMember.hp = Math.max(
    1,
    Math.floor(runtimeMember.maxHp * rate),
  );
  runtimeMember.lifeSerial =
    (runtimeMember.lifeSerial ?? 1) + 1;
  runtimeMember.lifeId =
    `${runtimeMember.playerId}-life-${runtimeMember.lifeSerial}`;
  runtimeMember.reviveCount =
    (runtimeMember.reviveCount ?? 0) + 1;
  return runtimeMember.hp;
}

function addMatchStatEffect(runtimeMember, item, sourceId) {
  runtimeMember.temporaryEffects =
    Array.isArray(runtimeMember.temporaryEffects)
      ? runtimeMember.temporaryEffects
      : [];
  runtimeMember.temporaryEffects.push({
    effectId:
      `${sourceId}:${runtimeMember.playerId}:` +
      `${runtimeMember.temporaryEffects.length + 1}`,
    code: `item_${item.effectValue.stat}`,
    sourcePlayerId: runtimeMember.playerId,
    sourceItemId: item.itemId,
    remainingSeconds:
      EXPLORATION_RULES.matchEffectDurationSeconds,
    durationMode: "current_match",
    stats: {
      [item.effectValue.stat]: item.effectValue.amount,
    },
    accuracyModifier: 0,
    damageReduction: 0,
    damageMultiplier: 1,
  });
}

export function getUsableItemTargets(runtime, itemId) {
  const item = getItem(itemId);
  const members = sortedPlayerMembers(runtime)
    .map((member) => ({
      ...member,
      runtime: runtime.memberRuntime[member.playerId],
    }));

  if (item.targetType === "single_alive_member") {
    return members
      .filter(({ runtime: member }) => {
        if (member.combatState !== "alive") return false;
        if (item.effectType === "heal_max_hp_rate") {
          return member.hp < member.maxHp;
        }
        return true;
      })
      .map(({ runtime: _runtime, ...member }) => member);
  }
  if (item.targetType === "single_dead_member") {
    return members
      .filter(({ runtime: member }) => member.combatState === "dead")
      .map(({ runtime: _runtime, ...member }) => member);
  }
  if (item.targetType === "all_alive_members") {
    const usable = members.some(({ runtime: member }) =>
      member.combatState === "alive" && member.hp < member.maxHp
    );
    return usable
      ? members
          .filter(({ runtime: member }) => member.combatState === "alive")
          .map(({ runtime: _runtime, ...member }) => member)
      : [];
  }
  return [];
}

export function openItemUseToDraft(draft, slotIndex) {
  assertRuntimeDraft(draft);
  const slot = findInventorySlot(draft, slotIndex);
  if (!slot || slot.quantity < 1) {
    throw new RangeError("The selected bag slot is empty.");
  }
  const targets = getUsableItemTargets(draft, slot.itemId);
  if (targets.length === 0) {
    throw new RangeError("このアイテムを使用できる対象がいません。");
  }
  draft.explorationRuntime.pendingItemUse = {
    slotIndex,
    itemId: slot.itemId,
  };
  return deepFreeze({
    itemId: slot.itemId,
    targets,
  });
}

export function cancelItemUseToDraft(draft) {
  assertRuntimeDraft(draft);
  draft.explorationRuntime.pendingItemUse = null;
  return true;
}

export function useInventoryItemToDraft(
  draft,
  {
    slotIndex,
    targetPlayerId = null,
  },
) {
  assertRuntimeDraft(draft);
  const slot = findInventorySlot(draft, slotIndex);
  if (!slot || slot.quantity < 1) {
    throw new RangeError("The selected bag slot is empty.");
  }
  const item = getItem(slot.itemId);
  const validTargets = getUsableItemTargets(draft, item.itemId);
  if (validTargets.length === 0) {
    throw new RangeError("このアイテムを使用できる対象がいません。");
  }

  const selectedTargets =
    item.targetType === "all_alive_members"
      ? validTargets
      : validTargets.filter(
          (member) =>
            member.playerId ===
            targetPlayerId,
        );
  const beforeTargets =
    selectedTargets.map(
      (member) =>
        createItemTargetPreview(
          draft,
          item,
          member,
        ),
    );

  let results = [];
  if (item.targetType === "all_alive_members") {
    results = validTargets.map((target) => {
      const runtimeMember = draft.memberRuntime[target.playerId];
      return {
        playerId: target.playerId,
        healing: healMember(runtimeMember, item.effectValue.rate),
      };
    });
  } else {
    const target = validTargets.find(
      (member) => member.playerId === targetPlayerId,
    );
    if (!target) {
      throw new RangeError("有効な対象選手を選択してください。");
    }
    const runtimeMember = draft.memberRuntime[target.playerId];
    if (item.effectType === "heal_max_hp_rate") {
      results = [{
        playerId: target.playerId,
        healing: healMember(runtimeMember, item.effectValue.rate),
      }];
    } else if (item.effectType === "revive_max_hp_rate") {
      results = [{
        playerId: target.playerId,
        reviveHp: reviveDeadMember(runtimeMember, item.effectValue.rate),
      }];
    } else if (item.effectType === "match_stat") {
      addMatchStatEffect(
        runtimeMember,
        item,
        `${draft.explorationRuntime.currentExploreKey}:${slotIndex}`,
      );
      draft.teamRuntime[draft.playerTeamId].matchBuffs.push({
        itemId: item.itemId,
        playerId: target.playerId,
        stat: item.effectValue.stat,
        amount: item.effectValue.amount,
        duration: "current_match",
      });
      results = [{
        playerId: target.playerId,
        stat: item.effectValue.stat,
        amount: item.effectValue.amount,
      }];
    } else {
      throw new RangeError(`Unsupported item effect: ${item.effectType}`);
    }
  }

  slot.quantity -= 1;
  slot.carryQuantity =
    slot.carryQuantity ?? slot.initialQuantity ?? 0;
  slot.explorationQuantity =
    slot.explorationQuantity ??
    Math.max(0, slot.quantity + 1 - slot.carryQuantity);
  if (slot.explorationQuantity > 0) {
    slot.explorationQuantity -= 1;
  } else if (slot.carryQuantity > 0) {
    slot.carryQuantity -= 1;
    draft.inventory.consumedCarryItems[slot.itemId] =
      (draft.inventory.consumedCarryItems[slot.itemId] ?? 0) + 1;
  }
  draft.inventory.totalUses =
    (draft.inventory.totalUses ?? 0) + 1;
  draft.inventory.useHistory =
    Array.isArray(draft.inventory.useHistory)
      ? draft.inventory.useHistory
      : [];
  draft.inventory.useHistory.push({
    exploreKey: draft.explorationRuntime.currentExploreKey,
    itemId: item.itemId,
    slotIndex,
    results: deepClone(results),
  });
  if (slot.quantity <= 0) {
    draft.inventory.slots[slotIndex] = null;
  }
  draft.explorationRuntime.pendingItemUse = null;
  syncPlayerTeamRuntime(draft);

  const afterTargets =
    beforeTargets.map((before) => {
      const state =
        draft.memberRuntime[
          before.playerId
        ];
      const result =
        results.find(
          (entry) =>
            entry.playerId ===
            before.playerId,
        ) ?? {};
      return {
        ...before,
        combatStateAfter:
          state.combatState,
        hpAfter:
          state.hp,
        statAfter:
          before.statId
            ? (
                before.statBefore +
                Number(
                  result.amount ?? 0,
                )
              )
            : before.statAfter,
      };
    });

  return deepFreeze({
    itemId: item.itemId,
    name: item.name,
    image: item.image,
    effectSummary:
      getItemEffectSummary(item),
    results,
    presentation: {
      targetType:
        item.targetType,
      targets:
        afterTargets,
    },
  });
}

function facilityUsedState(draft) {
  const key = draft.explorationRuntime.currentExploreKey;
  return draft.facilityRuntime.usedByExploreKey[key];
}

export function useRespawnTurntableToDraft(draft, targetPlayerId) {
  assertRuntimeDraft(draft);
  const key = draft.explorationRuntime.currentExploreKey;
  const outcome = draft.facilityRuntime.deterministicOutcomes[key];
  const used = facilityUsedState(draft);
  if (!outcome?.respawnTurntableAppears) {
    throw new RangeError("RESPAWN TURNTABLEはこの探索に出現していません。");
  }
  if (used[FACILITY_IDS.respawnTurntable]) {
    throw new RangeError("RESPAWN TURNTABLEは使用済みです。");
  }
  const member = draft.memberRuntime[targetPlayerId];
  if (!member || member.teamId !== draft.playerTeamId) {
    throw new RangeError("復活対象が不正です。");
  }
  const hp = reviveDeadMember(
    member,
    EXPLORATION_RULES.respawnTurntableReviveHpRate,
  );
  if (hp <= 0) {
    throw new RangeError("確キル状態の味方だけを復活できます。");
  }
  used[FACILITY_IDS.respawnTurntable] = true;
  syncPlayerTeamRuntime(draft);
  draft.explorationRuntime.history.push({
    type: "facility_respawn",
    exploreKey: key,
    playerId: targetPlayerId,
    hp,
  });
  return deepFreeze({
    facilityId: FACILITY_IDS.respawnTurntable,
    playerId: targetPlayerId,
    hp,
  });
}

export function useMobSlotToDraft(draft) {
  assertRuntimeDraft(draft);
  const key = draft.explorationRuntime.currentExploreKey;
  const outcome = draft.facilityRuntime.deterministicOutcomes[key];
  const used = facilityUsedState(draft);
  if (used[FACILITY_IDS.mobSlot]) {
    throw new RangeError("MOBスロットは使用済みです。");
  }
  used[FACILITY_IDS.mobSlot] = true;

  const results = [];
  if (outcome.mobSlotSuccess) {
    for (const member of sortedPlayerMembers(draft)) {
      const runtimeMember = draft.memberRuntime[member.playerId];
      if (runtimeMember.combatState !== "alive") continue;
      results.push({
        playerId: member.playerId,
        healing: healMember(
          runtimeMember,
          EXPLORATION_RULES.mobSlotHealHpRate,
        ),
      });
    }
    syncPlayerTeamRuntime(draft);
  }

  draft.explorationRuntime.history.push({
    type: "facility_mob_slot",
    exploreKey: key,
    success: outcome.mobSlotSuccess,
    results: deepClone(results),
  });
  return deepFreeze({
    facilityId: FACILITY_IDS.mobSlot,
    success: outcome.mobSlotSuccess,
    results,
  });
}

export function completeExplorationToDraft(draft) {
  assertRuntimeDraft(draft);
  const key = draft.explorationRuntime.currentExploreKey;
  const choice = currentChoice(draft);
  if (!choice.searchResolved) {
    throw new RangeError("SEARCHで探索地点を1つ選択してください。");
  }
  if (draft.explorationRuntime.pendingExploreItem) {
    throw new RangeError("バッグ満杯時の処理を完了してください。");
  }
  if (draft.explorationRuntime.pendingItemUse) {
    throw new RangeError("アイテム使用対象の選択を完了してください。");
  }

  choice.completed = true;
  if (!draft.explorationRuntime.completedKeys.includes(key)) {
    draft.explorationRuntime.completedKeys.push(key);
  }
  draft.explorationRuntime.currentPage = "SEARCH";
  draft.explorationRuntime.currentExploreKey = null;
  draft.explorationRuntime.pendingExploreItem = null;
  draft.explorationRuntime.pendingItemUse = null;
  draft.pendingVisualId = "exploration-complete";
  return deepFreeze({
    exploreKey: key,
    resultType: choice.resultType,
    resultItemId: choice.resultItemId,
  });
}

export function setStrategyTabToDraft(draft, tab) {
  if (!STRATEGY_TABS.includes(tab)) {
    throw new RangeError(`Unknown strategy tab: ${tab}`);
  }
  draft.strategyUi.tab = tab;
  return tab;
}

export function selectStrategyToDraft(draft, strategyId) {
  const strategy = draft.strategyRuntime[strategyId];
  if (!strategy) {
    throw new RangeError(`Unknown strategy: ${strategyId}`);
  }
  if (!strategy.unlimited && strategy.tournamentRemaining <= 0) {
    throw new RangeError("残り0回の作戦は選択できません。");
  }
  draft.strategyUi.selectedId = strategyId;
  draft.strategyUi.confirmedId = null;
  return deepFreeze(deepClone(strategy));
}

export function confirmStrategyToDraft(draft) {
  let strategyId = draft.strategyUi.selectedId;
  const selected = draft.strategyRuntime[strategyId];
  if (
    !selected ||
    (!selected.unlimited && selected.tournamentRemaining <= 0)
  ) {
    strategyId = STRATEGY_RULES.fallbackStrategyId;
  }
  draft.teamRuntime[draft.playerTeamId].currentStrategyId = strategyId;
  draft.teamRuntime[draft.playerTeamId].strategyConsumed = false;
  draft.strategyUi.selectedId = strategyId;
  draft.strategyUi.confirmedId = strategyId;
  draft.strategyUi.confirmedAtRound = draft.round;
  draft.pendingVisualId = `strategy-cutin:${strategyId}`;
  return deepFreeze(deepClone(draft.strategyRuntime[strategyId]));
}

function topStatusTemplate(runtime, title) {
  const members = sortedPlayerMembers(runtime);
  return `
    <header class="tournament-status exploration-status">
      <div class="tournament-status__main">
        <div class="tournament-status__title">
          <strong>${escapeHtml(runtime.entryData.tournament.tournamentName)}</strong>
          <span>${escapeHtml(title)}</span>
        </div>
        <div class="tournament-status__phase">
          ${escapeHtml(runtime.phase === "STRATEGY_SELECT" ? "作戦選択" : "探索")}
        </div>
      </div>
      <div class="tournament-status__metrics exploration-status__metrics">
        <span>MATCH <strong>${runtime.match}</strong></span>
        <span>EXPLORE <strong>${runtime.explorationRuntime.currentExploreIndex}/3</strong></span>
        <span>ALIVE <strong>${runtime.activeTeamIds.length}</strong></span>
      </div>
      <div class="exploration-member-hp">
        ${members.map((member) => {
          const state = runtime.memberRuntime[member.playerId];
          const rate = state.maxHp > 0 ? state.hp / state.maxHp : 0;
          return `
            <span data-state="${escapeAttribute(state.combatState)}">
              ${escapeHtml(member.role)}
              <i><b style="width:${Math.max(0, Math.min(100, rate * 100)).toFixed(2)}%"></b></i>
              ${state.hp}
            </span>
          `;
        }).join("")}
      </div>
    </header>
  `;
}

function commentaryTemplate(text) {
  return `
    <aside class="commentary-panel exploration-commentary commentary-panel--live">
      <div class="commentary-panel__speaker">
        <img src="icon/mic.png" alt="モブマイク">
        <span>LIVE</span>
      </div>
      <div>
        <strong>モブマイク</strong>
        <p>${escapeHtml(text)}</p>
        <i class="commentary-wave" aria-hidden="true">
          <b></b><b></b><b></b><b></b><b></b>
        </i>
      </div>
    </aside>
  `;
}

function explorationPageLabel(page) {
  if (page === "ALIVE_TEAMS") return "ALIVE TEAMS";
  return page;
}

function explorationPageIcon(page) {
  if (page === "SEARCH") return "icon/ex.png";
  if (page === "FACILITY") return "icon/juke.png";
  if (page === "BAG") return "icon/back.png";
  return "icon/match.png";
}

function pageTabsTemplate(currentPage) {
  return `
    <nav class="exploration-page-tabs" aria-label="探索ページ">
      ${EXPLORATION_PAGES.map((page) => `
        <button
          type="button"
          class="${page === currentPage ? "is-active" : ""}"
          data-action="exploration-page"
          data-page="${escapeAttribute(page)}"
        >
          <img src="${escapeAttribute(explorationPageIcon(page))}" alt="">
          <span>${escapeHtml(explorationPageLabel(page))}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

function searchPageTemplate(runtime, choice) {
  const pending =
    runtime.explorationRuntime.pendingExploreItem;
  const resultItem =
    choice.resultItemId
      ? getItem(choice.resultItemId)
      : pending?.itemId
        ? getItem(pending.itemId)
        : null;
  const normalizedCandidates =
    normalizeSearchCandidates(
      runtime,
      choice.exploreKey,
      choice.candidates,
    );

  return `
    <section class="exploration-page exploration-page--search">
      <p class="exploration-page-note exploration-page-note--search">
        3つの探索地点から1つ選択してください。アイテムは探索後に抽選されます。
      </p>
      <div class="exploration-search-grid">
        ${normalizedCandidates.map((candidate, index) => `
          <button
            type="button"
            class="exploration-search-point ${
              choice.selectedCandidateId === candidate.candidateId
                ? "is-selected"
                : ""
            }"
            data-action="exploration-search-select"
            data-candidate-id="${escapeAttribute(candidate.candidateId)}"
            ${choice.searchResolved || pending ? "disabled" : ""}
          >
            <span class="exploration-search-point__number">
              POINT ${index + 1}
            </span>
            <img
              src="${escapeAttribute(assetPath(candidate.pointIcon))}"
              alt="${escapeAttribute(candidate.pointName)}"
            >
            <strong>${escapeHtml(candidate.pointName)}</strong>
            <small>タップして探索</small>
          </button>
        `).join("")}
      </div>
      ${
        choice.searchResolved && resultItem
          ? `
            <article class="exploration-random-result">
              <span>SEARCH COMPLETE</span>
              <div>
                <img src="${escapeAttribute(assetPath(resultItem.image))}" alt="">
                <section>
                  <small>ランダムアイテムを発見</small>
                  <strong>${escapeHtml(resultItem.name)}</strong>
                  <p>${escapeHtml(resultItem.description)}</p>
                </section>
              </div>
              <em>
                ${
                  choice.resultType === "declined"
                    ? "取得しませんでした"
                    : choice.resultType === "replaced"
                      ? "バッグ内アイテムと交換しました"
                      : choice.resultType === "stacked"
                        ? "同一アイテムへ追加しました"
                        : "バッグへ収納しました"
                }
              </em>
            </article>
          `
          : pending && resultItem
            ? `
              <article class="exploration-random-result is-pending">
                <span>ITEM FOUND</span>
                <div>
                  <img src="${escapeAttribute(assetPath(resultItem.image))}" alt="">
                  <section>
                    <small>ランダムアイテムを発見</small>
                    <strong>${escapeHtml(resultItem.name)}</strong>
                    <p>バッグが満杯です。交換するアイテムを選んでください。</p>
                  </section>
                </div>
              </article>
            `
            : ""
      }
    </section>
  `;
}

function facilityPageTemplate(runtime) {
  const key = runtime.explorationRuntime.currentExploreKey;
  const outcome = runtime.facilityRuntime.deterministicOutcomes[key];
  const used = runtime.facilityRuntime.usedByExploreKey[key];
  const deadMembers = sortedPlayerMembers(runtime).filter(
    (member) =>
      runtime.memberRuntime[member.playerId].combatState === "dead",
  );
  return `
    <section class="exploration-page exploration-page--facility">
      <div class="facility-grid">
        <article class="${outcome.respawnTurntableAppears ? "" : "is-absent"}">
          <div class="facility-machine facility-machine--turntable">RESPAWN</div>
          <h2>RESPAWN TURNTABLE</h2>
          <p>確キル状態の味方1人を最大HP50%で復活。</p>
          ${
            !outcome.respawnTurntableAppears
              ? `<strong>このエリアには出現しませんでした</strong>`
              : used[FACILITY_IDS.respawnTurntable]
                ? `<strong>USED</strong>`
                : deadMembers.length === 0
                  ? `<strong>確キル状態の味方がいません</strong>`
                  : deadMembers.map((member) => `
                    <button
                      type="button"
                      class="tournament-button tournament-button--secondary"
                      data-action="facility-respawn"
                      data-player-id="${escapeAttribute(member.playerId)}"
                    >
                      ${escapeHtml(member.role)} ${escapeHtml(member.name)}を復活
                    </button>
                  `).join("")
          }
        </article>
        <article>
          <div class="facility-machine facility-machine--slot">
            <img src="icon/juke.png" alt="">
            <strong>MOB SLOT</strong>
          </div>
          <h2>MOBスロット</h2>
          <p>70%で揃い、生存味方全員を最大HP70%回復。</p>
          ${
            used[FACILITY_IDS.mobSlot]
              ? `<strong>${outcome.mobSlotSuccess ? "JACKPOT / USED" : "MISS / USED"}</strong>`
              : `
                <button
                  type="button"
                  class="tournament-button tournament-button--primary"
                  data-action="facility-mob-slot"
                >
                  スロットを回す
                </button>
              `
          }
        </article>
      </div>
    </section>
  `;
}

function bagPageTemplate(runtime) {
  const pendingUse =
    runtime.explorationRuntime
      .pendingItemUse;
  return `
    <section class="exploration-page exploration-page--bag">
      <div class="tournament-bag-grid">
        ${runtime.inventory.slots.map((slot, slotIndex) => {
          if (!slot) {
            return `
              <article class="tournament-bag-slot is-empty">
                <span>SLOT ${slotIndex + 1}</span>
                <strong>EMPTY</strong>
              </article>
            `;
          }

          const item = getItem(slot.itemId);
          const targets =
            getUsableItemTargets(
              runtime,
              slot.itemId,
            );
          const isPending =
            pendingUse?.slotIndex ===
            slotIndex;
          const effectSummary =
            getItemEffectSummary(item);

          return `
            <article class="tournament-bag-slot ${isPending ? "is-pending" : ""}">
              <span>SLOT ${slotIndex + 1}</span>
              <img
                src="${escapeAttribute(assetPath(item.image))}"
                alt=""
              >
              <strong>${escapeHtml(item.name)} ×${slot.quantity}</strong>
              <div class="bag-item-effect">
                <small>EFFECT</small>
                <b>${escapeHtml(effectSummary)}</b>
              </div>

              ${
                isPending
                  ? `
                    <div class="bag-target-list">
                      <header>
                        <img
                          src="${escapeAttribute(assetPath(item.image))}"
                          alt=""
                        >
                        <div>
                          <span>USE ITEM</span>
                          <strong>${escapeHtml(item.name)}</strong>
                          <small>${escapeHtml(effectSummary)}</small>
                        </div>
                      </header>

                      <div class="bag-target-preview-list">
                        ${targets.map(
                          (target) =>
                            itemTargetPreviewTemplate(
                              runtime,
                              item,
                              target,
                            ),
                        ).join("")}
                      </div>

                      ${
                        item.targetType === "all_alive_members"
                          ? `
                            <button
                              type="button"
                              class="bag-target-confirm"
                              data-action="exploration-item-use"
                              data-slot-index="${slotIndex}"
                            >
                              生存メンバー全員に使用
                            </button>
                          `
                          : targets.map((target) => `
                              <button
                                type="button"
                                class="bag-target-confirm"
                                data-action="exploration-item-use"
                                data-slot-index="${slotIndex}"
                                data-player-id="${escapeAttribute(target.playerId)}"
                              >
                                ${escapeHtml(target.role)}
                                ${escapeHtml(target.name)}に使用
                              </button>
                            `).join("")
                      }

                      <button
                        type="button"
                        class="bag-target-cancel"
                        data-action="exploration-item-cancel"
                      >
                        キャンセル
                      </button>
                    </div>
                  `
                  : `
                    <button
                      type="button"
                      class="tournament-button tournament-button--secondary"
                      data-action="exploration-item-open"
                      data-slot-index="${slotIndex}"
                      ${targets.length === 0 ? "disabled" : ""}
                    >
                      効果を確認して使用
                    </button>
                  `
              }
            </article>
          `;
        }).join("")}
      </div>

      <p class="exploration-page-note">
        使用回数
        ${runtime.inventory.totalUses ?? 0}
        /
        持ち込み消費
        ${Object.values(
          runtime.inventory
            .consumedCarryItems,
        ).reduce(
          (sum, value) =>
            sum + value,
          0,
        )}
      </p>
    </section>
  `;
}


function aliveTeamsPageTemplate(runtime) {
  const activeTeams = runtime.activeTeamIds
    .map((teamId) =>
      runtime.teams.find((team) => team.teamId === teamId),
    )
    .filter(Boolean);
  return `
    <section class="exploration-page exploration-page--alive">
      <div class="alive-team-list">
        ${activeTeams.map((team, index) => `
          <article class="${team.isPlayer ? "is-player" : ""}">
            <span>${String(index + 1).padStart(2, "0")}</span>
            <img src="${escapeAttribute(team.teamLogo)}" alt="">
            <div>
              <strong>${escapeHtml(team.teamName)}</strong>
              <small>${team.isPlayer ? "PLAYER TEAM" : `${escapeHtml(team.form?.toUpperCase() ?? "CPU")}`}</small>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function passiveIntelPageTemplate(runtime) {
  const opponent = runtime.teams.find(
    (team) => team.teamId === runtime.currentOpponentId,
  );
  const buffs = runtime.teamRuntime[runtime.playerTeamId].matchBuffs;
  return `
    <section class="exploration-page exploration-page--intel">
      <div class="intel-grid">
        <article>
          <span>AREA</span>
          <strong>${escapeHtml(runtime.explorationRuntime.currentAreaName)}</strong>
          <small>${escapeHtml(runtime.map.name)} / ${escapeHtml(runtime.map.mapId)}</small>
        </article>
        <article>
          <span>LOCKED OPPONENT</span>
          <strong>${escapeHtml(opponent?.teamName ?? "未確定")}</strong>
          <small>${escapeHtml(opponent?.description ?? "探索後に接敵判定")}</small>
        </article>
        <article>
          <span>MATCH BUFF</span>
          <strong>${buffs.length}</strong>
          <small>
            ${buffs.length === 0
              ? "アイテム能力補正なし"
              : buffs.map((buff) => `${buff.stat}+${buff.amount}`).join(" / ")}
          </small>
        </article>
        <article>
          <span>SPECIAL ABILITY</span>
          <strong>
            ${runtime.entryData.playerTeam.members.reduce(
              (sum, member) => sum + member.specialAbilities.length,
              0,
            )}
          </strong>
          <small>戦闘用の習得済み能力</small>
        </article>
      </div>
    </section>
  `;
}

function backpackFullTemplate(runtime) {
  const pending = runtime.explorationRuntime.pendingExploreItem;
  if (!pending) return "";
  return `
    <div class="backpack-full-overlay">
      <section class="backpack-full-card">
        <span>BACKPACK FULL</span>
        <h2>${escapeHtml(pending.name)}</h2>
        <img src="${escapeAttribute(pending.image)}" alt="">
        <p>${escapeHtml(pending.description)}</p>
        <div class="backpack-replace-list">
          ${runtime.inventory.slots.map((slot, slotIndex) => `
            <button
              type="button"
              data-action="exploration-replace-slot"
              data-slot-index="${slotIndex}"
            >
              <span>SLOT ${slotIndex + 1}</span>
              <strong>${escapeHtml(slot?.name ?? "EMPTY")}</strong>
              <small>このアイテムを破棄して交換</small>
            </button>
          `).join("")}
        </div>
        <button
          type="button"
          class="tournament-button tournament-button--ghost"
          data-action="exploration-decline-item"
        >
          取得しない
        </button>
      </section>
    </div>
  `;
}

export function renderExplorationScreen(runtime) {
  const key =
    runtime.explorationRuntime.currentExploreKey;
  const choice =
    runtime.explorationRuntime
      .deterministicChoices[key];
  if (!key || !choice) {
    throw new RangeError(
      "Active exploration data is missing.",
    );
  }

  const canComplete =
    choice.searchResolved &&
    !runtime.explorationRuntime
      .pendingExploreItem &&
    !runtime.explorationRuntime
      .pendingItemUse;

  return `
    <main
      class="tournament-screen tournament-screen--exploration tournament-screen--exploration-unified"
      style="--map-background:url('${escapeAttribute(assetPath(runtime.map.image))}')"
    >
      <img
        class="tournament-stage-background"
        src="${escapeAttribute(assetPath(runtime.map.image))}"
        alt=""
      >

      <header class="exploration-mini-header">
        <img src="icon/ex.png" alt="">
        <div>
          <span>EXPLORE ${runtime.explorationRuntime.currentExploreIndex}/3</span>
          <strong>${escapeHtml(choice.areaName)}</strong>
        </div>
        <em>ALIVE ${runtime.activeTeamIds.length}</em>
      </header>

      <section class="exploration-unified-scroll">
        <section class="exploration-unified-block exploration-unified-block--search">
          <header>
            <img src="icon/ex.png" alt="">
            <div>
              <span>SEARCH</span>
              <strong>探索地点を1つ選択</strong>
            </div>
          </header>
          ${searchPageTemplate(runtime, choice)}
        </section>

        <section class="exploration-unified-block exploration-unified-block--bag">
          <header>
            <img src="${escapeAttribute(assetPath("icon/back.png"))}" alt="">
            <div>
              <span>BACKPACK</span>
              <strong>アイテムを使用</strong>
            </div>
          </header>
          ${bagPageTemplate(runtime)}
        </section>

        <section class="exploration-unified-block exploration-unified-block--facility">
          <header>
            <img src="icon/juke.png" alt="">
            <div>
              <span>AREA FACILITY</span>
              <strong>施設専用アイコン</strong>
            </div>
          </header>
          ${facilityPageTemplate(runtime)}
        </section>
      </section>

      <div class="tournament-bottom-area exploration-bottom-area">
        ${commentaryTemplate(
          choice.searchResolved
            ? `${choice.resultItemId ? getItem(choice.resultItemId).name : "アイテム"}を確保！同じ画面でバッグと施設も確認できます！`
            : `${choice.areaName}を探索中！3地点から選び、バッグと施設も確認しましょう！`,
        )}
        <div class="tournament-actions">
          <button
            type="button"
            class="tournament-button tournament-button--secondary"
            data-action="suspend-return"
          >
            中断保存
          </button>
          <button
            type="button"
            class="tournament-button tournament-button--primary"
            data-action="exploration-complete"
            ${canComplete ? "" : "disabled"}
          >
            NEXT
          </button>
        </div>
      </div>
      ${backpackFullTemplate(runtime)}
    </main>
  `;
}

function strategyCountLabel(strategy) {
  return strategy.unlimited
    ? "∞"
    : String(strategy.tournamentRemaining);
}

function strategyMaster(strategyId) {
  return STRATEGIES.find((strategy) => strategy.id === strategyId);
}

export function renderStrategySelectionScreen(runtime) {
  const tab = runtime.strategyUi.tab;
  const selectedId =
    runtime.strategyUi.selectedId ??
    STRATEGY_RULES.fallbackStrategyId;
  const selectedRuntime =
    runtime.strategyRuntime[selectedId] ??
    runtime.strategyRuntime[STRATEGY_RULES.fallbackStrategyId];
  const selectedMaster = strategyMaster(selectedRuntime.strategyId);
  const filtered = Object.values(runtime.strategyRuntime).filter(
    (strategy) => tab === "ALL" || strategy.rank === tab,
  );

  return `
    <main class="tournament-screen tournament-screen--strategy-select" style="--map-background:url('${escapeAttribute(assetPath(runtime.map.image))}')">
      <img class="tournament-stage-background" src="${escapeAttribute(assetPath(runtime.map.image))}" alt="">
      <header class="strategy-select-header">
        <img src="icon/battle.png" alt=""><div><span>STRATEGY SELECT</span><strong>${escapeHtml(selectedRuntime.name)}</strong></div>
      </header>
      <section class="strategy-select-shell strategy-select-shell--no-status">
        <nav class="strategy-rank-tabs">
          ${STRATEGY_TABS.map((rankTab) => `
            <button
              type="button"
              class="${rankTab === tab ? "is-active" : ""}"
              data-action="strategy-tab"
              data-strategy-tab="${escapeAttribute(rankTab)}"
            >
              ${escapeHtml(rankTab)}
            </button>
          `).join("")}
        </nav>
        <div class="strategy-selection-layout">
          <div class="strategy-list">
            ${filtered.map((strategy) => {
              const master = strategyMaster(strategy.strategyId);
              const disabled =
                !strategy.unlimited &&
                strategy.tournamentRemaining <= 0;
              return `
                <button
                  type="button"
                  class="strategy-list-card ${
                    strategy.strategyId === selectedRuntime.strategyId
                      ? "is-selected"
                      : ""
                  }"
                  data-action="strategy-select"
                  data-strategy-id="${escapeAttribute(strategy.strategyId)}"
                  ${disabled ? "disabled" : ""}
                >
                  <span class="strategy-list-card__rank">${escapeHtml(strategy.rank)}</span>
                  <div>
                    <strong>${escapeHtml(strategy.name)}</strong>
                    <small>${escapeHtml(master.description)}</small>
                  </div>
                  <em>${strategyCountLabel(strategy)}</em>
                </button>
              `;
            }).join("")}
          </div>
          <article class="strategy-detail-card">
            <span>${escapeHtml(selectedRuntime.rank)} / ${escapeHtml(selectedRuntime.strategyId)}</span>
            <h2>${escapeHtml(selectedRuntime.name)}</h2>
            <p>${escapeHtml(selectedMaster.description)}</p>
            <div>
              <strong>残り ${strategyCountLabel(selectedRuntime)}</strong>
              <small>選択時点では消費しません。戦闘開始時に1回消費します。</small>
            </div>
          </article>
        </div>
      </section>
      <div class="tournament-bottom-area">
        ${commentaryTemplate(
          `${selectedRuntime.name}を確認中！作戦は戦闘開始時に確定消費されます。`,
        )}
        <div class="tournament-actions">
          <button
            type="button"
            class="tournament-button tournament-button--secondary"
            data-action="suspend-return"
          >
            中断保存
          </button>
          <button
            type="button"
            class="tournament-button tournament-button--primary"
            data-action="strategy-confirm"
          >
            この作戦で開始
          </button>
        </div>
      </div>
    </main>
  `;
}

export function renderStrategyCutIn(runtime) {
  const strategyId =
    runtime.teamRuntime[runtime.playerTeamId].currentStrategyId ??
    STRATEGY_RULES.fallbackStrategyId;
  const strategy = runtime.strategyRuntime[strategyId];
  const master = strategyMaster(strategyId);
  return `
    <section class="strategy-start-cutin strategy-start-cutin--text">
      <span>STRATEGY LOCKED / ${escapeHtml(strategy.rank)}</span>
      <h1>${escapeHtml(strategy.name)}</h1>
      <p>${escapeHtml(master.description)}</p>
      <small>
        ${
          strategy.unlimited
            ? "UNLIMITED"
            : `戦闘開始前残り ${strategy.tournamentRemaining}`
        }
      </small>
    </section>
  `;
}

export function installExplorationSwipe(
  root,
  {
    onPageChange,
    threshold = 42,
  } = {},
) {
  const surface = root.querySelector?.("[data-exploration-swipe]");
  if (!surface || typeof onPageChange !== "function") {
    return () => {};
  }
  let startX = null;
  let startY = null;
  let pointerId = null;

  const pointerDown = (event) => {
    if (event.target.closest("button")) return;
    startX = event.clientX;
    startY = event.clientY;
    pointerId = event.pointerId;
    surface.setPointerCapture?.(pointerId);
  };

  const pointerUp = (event) => {
    if (startX === null || pointerId !== event.pointerId) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    startX = null;
    startY = null;
    pointerId = null;
    if (Math.abs(deltaX) < threshold || Math.abs(deltaX) <= Math.abs(deltaY)) {
      return;
    }
    onPageChange(deltaX < 0 ? 1 : -1);
  };

  const pointerCancel = () => {
    startX = null;
    startY = null;
    pointerId = null;
  };

  surface.addEventListener("pointerdown", pointerDown);
  surface.addEventListener("pointerup", pointerUp);
  surface.addEventListener("pointercancel", pointerCancel);

  return () => {
    surface.removeEventListener("pointerdown", pointerDown);
    surface.removeEventListener("pointerup", pointerUp);
    surface.removeEventListener("pointercancel", pointerCancel);
  };
}

export function validateExplorationRuntime(runtime) {
  if (runtime.entryData.masterVersions.itemMaster !== ITEM_MASTER_VERSION) {
    throw new Error("Tournament item master version is incompatible.");
  }
  if (Object.keys(runtime.strategyRuntime).length !== STRATEGY_RULES.totalCount) {
    throw new Error("Tournament strategy runtime must contain all 50 strategies.");
  }
  if (!STRATEGY_TABS.includes(runtime.strategyUi.tab)) {
    throw new Error("Strategy UI tab is invalid.");
  }
  if (
    !runtime.strategyRuntime[runtime.strategyUi.selectedId] ||
    !runtime.strategyRuntime[STRATEGY_RULES.fallbackStrategyId]
  ) {
    throw new Error("Strategy UI selection is invalid.");
  }
  if (runtime.explorationRuntime.currentPage === "PASSIVE_INTEL") {
    runtime.explorationRuntime.currentPage = "SEARCH";
  }
  if (!EXPLORATION_PAGES.includes(runtime.explorationRuntime.currentPage)) {
    throw new Error("Exploration page is invalid.");
  }
  if (
    runtime.explorationRuntime.completedKeys.length >
    runtime.match * EXPLORATION_RULES.maximumPerMatch
  ) {
    throw new Error("Too many exploration keys are completed.");
  }
  return true;
}
