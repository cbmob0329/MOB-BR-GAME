/**
 * MOB BR player growth and equipment feature.
 *
 * This module owns player-side upgrade transactions and feature rendering.
 * It does not execute training weeks, shop purchases, or tournament battles.
 */

import {
  STAT_IDS,
  TRAINING_POINT_IDS,
  calculateCharacterOverallRank,
  characterValueToRank,
  weaponValueToRank,
  getCompanyRankData,
} from "../../data/game-data.js?v=56";
import {
  calculateMaxHp,
  getRoleCommonSkills,
} from "../../data/battle-config.js?v=56";
import {
  effectiveCharacterRank,
  motivationDisplay,
} from "../../data/motivation-data.js?v=56";
import {
  WEAPON_SKINS,
  getWeaponSkin,
} from "../../data/shop-data.js";
import {
  PLAYER_STAT_DEFINITIONS,
  WEAPON_STAT_DEFINITIONS,
  canAffordPointCost,
  evaluateUnlockConditions,
  getPlayerStatDefinition,
  getStatUpgradeCost,
  getWeaponStatDefinition,
  getWeaponUpgradeCost,
} from "../../data/ability-data.js?v=56";

import {
  getSpecialAbilitiesForRole,
  getSpecialAbility,
  getSpecialAbilityStage,
} from "../../data/special-ability-50-data.js?v=56";

export const TEAM_FEATURE_VERSION = "mobbr-team-feature-1.5.0";

const ROLE_ICONS = Object.freeze({
  IGL: "icon/IGL.png",
  ATK: "icon/atk.png",
  SUP: "icon/supi.png",
});

const POINT_LABELS = Object.freeze({
  power: "POWER",
  tech: "TECH",
  mental: "MENTAL",
  shoot: "SHOOT",
});

export const SKILL_MAX_LEVEL = 5;
export const SKILL_UPGRADE_COSTS = Object.freeze({
  1: 120_000,
  2: 300_000,
  3: 650_000,
  4: 1_200_000,
});

export function getSkillLevelProfile(level) {
  const validLevel = Math.max(1, Math.min(SKILL_MAX_LEVEL, Number(level) || 1));
  const steps = validLevel - 1;
  return Object.freeze({
    level: validLevel,
    cooldownRate: 1 - steps * 0.025,
    powerMultiplier: 1 + steps * 0.035,
    cooldownReductionPercent: steps * 2.5,
    powerIncreasePercent: steps * 3.5,
  });
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

function motivationBadgeTemplate(record, className = "") {
  const display = motivationDisplay(record);
  return `
    <span class="motivation-badge motivation-badge--${escapeAttribute(display.id)} ${escapeAttribute(className)}">
      <b>${escapeHtml(display.mark)}</b>
      <em>${escapeHtml(display.name)}</em>
      <small>${escapeHtml(display.modifierLabel)}</small>
    </span>
  `;
}

function effectiveRankForPlayer(player) {
  return effectiveCharacterRank(player.characterRank, player.motivation);
}

function formatNumber(value) {
  return new Intl.NumberFormat("ja-JP").format(value);
}

function assertDraft(draft) {
  if (!draft || typeof draft !== "object") {
    throw new TypeError("Draft state must be an object.");
  }
}

function getPlayer(collection, playerId) {
  const player = collection.playerTeam?.members?.find(
    (member) => member.playerId === playerId,
  );
  if (!player) {
    throw new RangeError(`Unknown player: ${playerId}`);
  }
  return player;
}

function getWeaponRank(player, weaponStatId) {
  if (["close", "mid", "far"].includes(weaponStatId)) {
    return player.weapon.rangeRanks[weaponStatId];
  }
  if (weaponStatId === "fireRate") {
    return player.weapon.fireRateRank;
  }
  if (weaponStatId === "reload") {
    return player.weapon.reloadRank;
  }
  throw new RangeError(`Unknown weapon stat: ${weaponStatId}`);
}

function setWeaponRank(player, weaponStatId, nextRank, nextValue) {
  if (["close", "mid", "far"].includes(weaponStatId)) {
    player.weapon.rangeRanks[weaponStatId] = nextRank;
  } else if (weaponStatId === "fireRate") {
    player.weapon.fireRateRank = nextRank;
  } else if (weaponStatId === "reload") {
    player.weapon.reloadRank = nextRank;
  } else {
    throw new RangeError(`Unknown weapon stat: ${weaponStatId}`);
  }
  player.weapon.internalValues[weaponStatId] = nextValue;
}


function createEmptyPointPool() {
  return Object.fromEntries(TRAINING_POINT_IDS.map((pointId) => [pointId, 0]));
}

export function getPlayerTrainingPointPool(snapshot, playerId) {
  const pool = snapshot.playerTrainingPoints?.[playerId];
  return pool ?? snapshot.trainingPoints ?? createEmptyPointPool();
}

function ensurePlayerTrainingPointPoolToDraft(draft, playerId) {
  draft.playerTrainingPoints ??= Object.fromEntries(
    draft.playerTeam.members.map((player) => [player.playerId, createEmptyPointPool()]),
  );
  draft.playerTrainingPoints[playerId] ??= createEmptyPointPool();
  return draft.playerTrainingPoints[playerId];
}

function subtractPointCost(pointPool, cost) {
  if (!canAffordPointCost(pointPool, cost)) {
    throw new RangeError("トレーニングポイントが不足しています。");
  }
  for (const pointId of TRAINING_POINT_IDS) {
    pointPool[pointId] -= cost[pointId] ?? 0;
  }
}

export function ensurePlayerSkillsToDraft(draft) {
  assertDraft(draft);
  for (const player of draft.playerTeam.members) {
    const existingById = new Map(
      (Array.isArray(player.skills) ? player.skills : []).map(
        (skill) => [skill.skillId, skill],
      ),
    );
    player.skills = getRoleCommonSkills(player.role).map((master) => {
      const existing = existingById.get(master.id) ?? {};
      return {
        skillId: master.id,
        name: master.name,
        customName:
          typeof existing.customName === "string" && existing.customName.trim()
            ? existing.customName.trim().slice(0, 24)
            : null,
        level:
          Number.isInteger(existing.level)
            ? Math.max(1, Math.min(SKILL_MAX_LEVEL, existing.level))
            : 1,
        type: master.type,
        target: master.target,
        baseCt: master.baseCt,
      };
    });
  }
}

export function upgradePlayerSkillToDraft(draft, playerId, skillId) {
  assertDraft(draft);
  ensurePlayerSkillsToDraft(draft);
  const player = getPlayer(draft, playerId);
  const skill = player.skills.find((entry) => entry.skillId === skillId);
  if (!skill) throw new RangeError(`Unknown player skill: ${skillId}`);
  const currentLevel = Math.max(1, Math.min(SKILL_MAX_LEVEL, skill.level ?? 1));
  if (currentLevel >= SKILL_MAX_LEVEL) {
    throw new RangeError("このスキルは最大レベルです。");
  }
  const coinCost = SKILL_UPGRADE_COSTS[currentLevel];
  if (draft.resources.coin < coinCost) {
    throw new RangeError("スキル強化に必要なCOINが不足しています。");
  }
  draft.resources.coin -= coinCost;
  skill.level = currentLevel + 1;
  return {
    playerId,
    skillId,
    name: skill.customName ?? skill.name,
    previousLevel: currentLevel,
    currentLevel: skill.level,
    coinCost,
    profile: getSkillLevelProfile(skill.level),
  };
}

export function renamePlayerSkillToDraft(draft, playerId, skillId, requestedName) {
  assertDraft(draft);
  ensurePlayerSkillsToDraft(draft);
  const player = getPlayer(draft, playerId);
  const skill = player.skills.find((entry) => entry.skillId === skillId);
  if (!skill) throw new RangeError(`Unknown player skill: ${skillId}`);
  const customName = String(requestedName ?? "").trim();
  if (!customName) {
    skill.customName = null;
  } else if (customName.length > 24) {
    throw new RangeError("スキル名は24文字以内にしてください。");
  } else {
    skill.customName = customName;
  }
  return {
    playerId,
    skillId,
    name: skill.customName ?? skill.name,
    defaultName: skill.name,
    reset: skill.customName === null,
  };
}

export function applyTestMaxPlayerBuildToDraft(draft) {
  assertDraft(draft);
  ensurePlayerSkillsToDraft(draft);
  const maximumCompany =
    getCompanyRankData(
      "SS9",
    );
  draft.company.rank =
    maximumCompany.rank;
  draft.company.rankIndex =
    maximumCompany.index;
  draft.company.exp = 0;
  draft.unlockFlags.coachScout =
    true;
  draft.unlockFlags.nationalCardPacks =
    true;
  draft.unlockFlags.worldCardPacks =
    true;

  const maximumWeaponValue = 72;
  const maximumWeaponRank = weaponValueToRank(maximumWeaponValue);
  for (const player of draft.playerTeam.members) {
    for (const statId of STAT_IDS) {
      player.stats[statId] = 73;
    }
    const overall = calculateCharacterOverallRank(player.stats);
    player.characterRank = overall.rank;
    player.characterRankValue = overall.internalAverage;
    player.maxHp = calculateMaxHp(player.stats.stamina);
    player.currentHp = player.maxHp;
    for (const statId of ["close", "mid", "far"]) {
      player.weapon.internalValues[statId] = maximumWeaponValue;
      player.weapon.rangeRanks[statId] = maximumWeaponRank;
    }
    for (const statId of ["fireRate", "reload"]) {
      player.weapon.internalValues[statId] = maximumWeaponValue;
    }
    player.weapon.fireRateRank = maximumWeaponRank;
    player.weapon.reloadRank = maximumWeaponRank;
    for (const skill of player.skills) {
      skill.level = SKILL_MAX_LEVEL;
    }
  }
  return {
    playerCount: draft.playerTeam.members.length,
    statValue: 73,
    weaponValue: maximumWeaponValue,
    skillLevel: SKILL_MAX_LEVEL,
    companyRank:
      maximumCompany.rank,
  };
}

export function getSelectedPlayerId(snapshot, requestedPlayerId = null) {
  const members = snapshot?.playerTeam?.members ?? [];
  if (requestedPlayerId && members.some(
    (player) => player.playerId === requestedPlayerId,
  )) {
    return requestedPlayerId;
  }
  return members[0]?.playerId ?? null;
}

export function upgradePlayerStatToDraft(draft, playerId, statId) {
  assertDraft(draft);
  const player = getPlayer(draft, playerId);
  const definition = getPlayerStatDefinition(statId);
  const currentValue = player.stats[statId];
  const upgradeCost = getStatUpgradeCost(currentValue);

  if (!upgradeCost) {
    throw new RangeError(`${definition.displayName}はMOBに到達しています。`);
  }

  const pointCost = Object.fromEntries(
    TRAINING_POINT_IDS.map((pointId) => [pointId, 0]),
  );
  pointCost[definition.primaryPoint] = upgradeCost.primary;
  pointCost[definition.secondaryPoint] = upgradeCost.secondary;
  subtractPointCost(ensurePlayerTrainingPointPoolToDraft(draft, playerId), pointCost);

  const previousMaxHp = player.maxHp;
  player.stats[statId] += 1;
  const overall = calculateCharacterOverallRank(player.stats);
  player.characterRank = overall.rank;
  player.characterRankValue = overall.internalAverage;

  if (statId === "stamina") {
    const nextMaxHp = calculateMaxHp(player.stats.stamina);
    player.maxHp = nextMaxHp;
    player.currentHp = Math.min(
      nextMaxHp,
      player.currentHp + Math.max(0, nextMaxHp - previousMaxHp),
    );
  }

  ensurePlayerSkillsToDraft(draft);

  return {
    playerId,
    statId,
    previousValue: currentValue,
    currentValue: player.stats[statId],
    previousRank: upgradeCost.currentRank,
    currentRank: characterValueToRank(player.stats[statId]),
    pointCost,
    overallRank: player.characterRank,
  };
}

export function upgradeWeaponStatToDraft(
  draft,
  playerId,
  weaponStatId,
) {
  assertDraft(draft);
  getWeaponStatDefinition(weaponStatId);
  const player = getPlayer(draft, playerId);
  const currentRank = getWeaponRank(player, weaponStatId);
  const cost = getWeaponUpgradeCost(currentRank);

  if (!cost) {
    throw new RangeError("この武器能力はMOBに到達しています。");
  }
  if (draft.resources.coin < cost.coin) {
    throw new RangeError("COINが不足しています。");
  }
  if (draft.resources.ruby < cost.ruby) {
    throw new RangeError("RUBYが不足しています。");
  }

  draft.resources.coin -= cost.coin;
  draft.resources.ruby -= cost.ruby;

  const currentValue = player.weapon.internalValues[weaponStatId];
  const nextValue = currentValue + 1;
  setWeaponRank(player, weaponStatId, cost.nextRank, nextValue);
  ensurePlayerSkillsToDraft(draft);

  return {
    playerId,
    weaponStatId,
    previousRank: currentRank,
    currentRank: cost.nextRank,
    coin: cost.coin,
    ruby: cost.ruby,
  };
}


export function calculateWeaponUpgradePlan(
  snapshot,
  playerId,
  increments = {},
) {
  const player = getPlayer(snapshot, playerId);
  const normalized = Object.fromEntries(
    WEAPON_STAT_DEFINITIONS.map((definition) => [
      definition.id,
      Math.max(0, Math.floor(increments[definition.id] ?? 0)),
    ]),
  );
  let totalCoin = 0;
  let totalRuby = 0;
  const rows = WEAPON_STAT_DEFINITIONS.map((definition) => {
    let projectedValue =
      player.weapon.internalValues[definition.id];
    let projectedRank =
      getWeaponRank(player, definition.id);
    let applied = 0;
    for (
      let index = 0;
      index < normalized[definition.id];
      index += 1
    ) {
      const cost = getWeaponUpgradeCost(projectedRank);
      if (!cost) break;
      totalCoin += cost.coin;
      totalRuby += cost.ruby;
      projectedValue += 1;
      projectedRank = cost.nextRank;
      applied += 1;
    }
    normalized[definition.id] = applied;
    return {
      definition,
      currentRank: getWeaponRank(player, definition.id),
      projectedRank,
      currentValue:
        player.weapon.internalValues[definition.id],
      projectedValue,
      increment: applied,
      nextCost: getWeaponUpgradeCost(projectedRank),
    };
  });
  return {
    playerId,
    increments: normalized,
    rows,
    totalCoin,
    totalRuby,
    remainingCoin:
      snapshot.resources.coin - totalCoin,
    remainingRuby:
      snapshot.resources.ruby - totalRuby,
    affordable:
      snapshot.resources.coin >= totalCoin &&
      snapshot.resources.ruby >= totalRuby,
    hasChanges:
      Object.values(normalized).some(
        (value) => value > 0,
      ),
  };
}

export function applyWeaponUpgradePlanToDraft(
  draft,
  playerId,
  increments,
) {
  const results = [];
  for (const definition of WEAPON_STAT_DEFINITIONS) {
    const count = Math.max(
      0,
      Math.floor(
        increments?.[definition.id] ?? 0,
      ),
    );
    for (let index = 0; index < count; index += 1) {
      results.push(
        upgradeWeaponStatToDraft(
          draft,
          playerId,
          definition.id,
        ),
      );
    }
  }
  if (results.length === 0) {
    throw new RangeError(
      "確定する武器強化がありません。",
    );
  }
  return {
    playerId,
    results,
    totalUpgrades: results.length,
  };
}

export function renameWeaponToDraft(draft, playerId, weaponName) {
  assertDraft(draft);
  const player = getPlayer(draft, playerId);
  if (typeof weaponName !== "string") {
    throw new TypeError("武器名は文字列で入力してください。");
  }
  const normalized = weaponName.trim();
  if (!normalized) {
    throw new RangeError("武器名を入力してください。");
  }
  if (normalized.length > 60) {
    throw new RangeError("武器名は60文字以内にしてください。");
  }

  const previousName = player.weapon.weaponName;
  player.weapon.weaponName = normalized;
  return {
    playerId,
    previousName,
    weaponName: normalized,
  };
}

export function changeWeaponSkinToDraft(draft, playerId, skinId) {
  assertDraft(draft);
  const player = getPlayer(draft, playerId);
  if (draft.inventory.weaponSkins?.[skinId] !== true) {
    throw new RangeError("未所持の武器スキンです。");
  }
  const skin = getWeaponSkin(skinId);
  const previousSkinId = player.weapon.skinId;
  player.weapon.skinId = skin.skinId;
  player.weapon.image = skin.image;

  return {
    playerId,
    previousSkinId,
    skinId: skin.skinId,
    image: skin.image,
  };
}

function countOwnedCollectionTypes(record) {
  if (!record || typeof record !== "object") {
    return 0;
  }
  return Object.values(record).filter((entry) => {
    if (entry === true) {
      return true;
    }
    if (Number.isInteger(entry)) {
      return entry > 0;
    }
    if (entry && typeof entry === "object") {
      return (
        entry.owned === true ||
        (Number.isInteger(entry.level) && entry.level >= 0) ||
        (Number.isInteger(entry.quantity) && entry.quantity > 0)
      );
    }
    return false;
  }).length;
}

function tierFromHistoryEntry(entry) {
  if (
    [
      "stage_in_progress",
      "cpu_simulated",
      "not_entered",
    ].includes(entry.status)
  ) {
    return "unknown";
  }
  const type = String(entry.tournamentType ?? "").toLowerCase();
  if (type === "championship") return "championship";
  if (type === "world_final") return "world";
  if (type === "national" || type === "national_week_2") {
    return "national";
  }
  if (type === "local") return "local";
  return "unknown";
}

export function buildAbilityProgress(snapshot, playerId) {
  const playerRecord =
    snapshot.records?.memberCareer?.[playerId] ?? {};
  const history = snapshot.tournament?.history ?? [];
  const awards = snapshot.tournament?.awards ?? [];

  const wins = { local: 0, national: 0, world: 0, championship: 0 };
  const top5 = { local: 0, national: 0, world: 0, championship: 0 };

  for (const entry of history) {
    const tier = tierFromHistoryEntry(entry);
    if (!(tier in wins)) {
      continue;
    }
    if (entry.finalPlace === 1) {
      wins[tier] += 1;
    }
    if (
      Number.isInteger(entry.finalPlace) &&
      entry.finalPlace >= 1 &&
      entry.finalPlace <= 5
    ) {
      top5[tier] += 1;
    }
  }

  const mvp = { local: 0, national: 0, world: 0, championship: 0 };
  for (const award of awards) {
    if (award.playerId !== playerId) {
      continue;
    }
    const isMvp =
      award.awardId?.toLowerCase().includes("mvp") ||
      award.type?.toLowerCase() === "mvp";
    if (!isMvp) {
      continue;
    }
    const tier = award.tier ?? tierFromHistoryEntry(award);
    if (tier in mvp) {
      mvp[tier] += 1;
    }
  }

  return {
    wins,
    top5,
    mvp,
    championshipWins: wins.championship,
    damage: playerRecord.damage ?? 0,
    kp: playerRecord.kp ?? playerRecord.kills ?? 0,
    ap: playerRecord.ap ?? playerRecord.assists ?? 0,
    training: snapshot.records?.trainingCompleted ?? 0,
    cardTypes: countOwnedCollectionTypes(snapshot.collections?.cards),
    badgeTypes: countOwnedCollectionTypes(snapshot.collections?.badges),
  };
}

function getLearnedAbility(player, abilityId) {
  return (
    player.specialAbilities ?? []
  ).find(
    (ability) =>
      ability.abilityId ===
      abilityId,
  ) ?? null;
}

function abilityAppliesToPlayer(
  ability,
  player,
) {
  return (
    ability.roles?.includes(
      player.role,
    ) === true
  );
}

export function getAbilityAcquisitionState(
  snapshot,
  playerId,
  abilityKey,
) {
  const player =
    getPlayer(
      snapshot,
      playerId,
    );
  const family =
    getSpecialAbility(
      abilityKey,
    );
  const learned =
    getLearnedAbility(
      player,
      family.abilityId,
    );
  const currentLevel =
    Math.max(
      0,
      Math.min(
        2,
        Number(
          learned?.stage ??
          0,
        ),
      ),
    );
  const nextLevel =
    Math.min(
      2,
      currentLevel + 1,
    );
  const ability =
    currentLevel >= 2
      ? getSpecialAbilityStage(
          family.abilityId,
          2,
        )
      : getSpecialAbilityStage(
          family.abilityId,
          nextLevel,
        );
  const applicable =
    abilityAppliesToPlayer(
      family,
      player,
    );
  const conditionState =
    evaluateUnlockConditions(
      ability.unlockConditions,
      buildAbilityProgress(
        snapshot,
        playerId,
      ),
    );
  const affordable =
    canAffordPointCost(
      getPlayerTrainingPointPool(
        snapshot,
        playerId,
      ),
      ability.cost,
    );
  const maxed =
    currentLevel >= 2;

  return {
    family,
    ability,
    applicable,
    conditionState,
    stagePrerequisiteMet:
      currentLevel === 0 ||
      currentLevel === 1,
    alreadyLearned:
      maxed,
    replaced:
      false,
    affordable,
    currentLevel,
    nextLevel,
    maxed,
    rainbow:
      currentLevel >= 2,
    learnable:
      applicable &&
      conditionState.unlocked &&
      !maxed &&
      affordable,
  };
}

export function learnSpecialAbilityToDraft(
  draft,
  playerId,
  abilityKey,
  learnedAt =
    new Date().toISOString(),
) {
  assertDraft(draft);
  const state =
    getAbilityAcquisitionState(
      draft,
      playerId,
      abilityKey,
    );
  const {
    ability,
  } = state;

  if (!state.applicable) {
    throw new RangeError(
      "この選手の役職では習得できません。",
    );
  }
  if (
    !state.conditionState.unlocked
  ) {
    throw new RangeError(
      "解放条件を満たしていません。",
    );
  }
  if (state.maxed) {
    throw new RangeError(
      "この特殊能力は最大まで強化済みです。",
    );
  }
  if (!state.affordable) {
    throw new RangeError(
      "トレーニングポイントが不足しています。",
    );
  }

  const player =
    getPlayer(
      draft,
      playerId,
    );
  subtractPointCost(
    ensurePlayerTrainingPointPoolToDraft(
      draft,
      playerId,
    ),
    ability.cost,
  );

  const entry = {
    abilityKey:
      ability.abilityKey,
    abilityId:
      ability.abilityId,
    color:
      ability.color,
    rarity:
      ability.rarity,
    stage:
      ability.stage,
    name:
      ability.name,
    image:
      ability.image,
    description:
      ability.description,
    effectType:
      ability.effect.code ??
      "unknown",
    effectValue:
      ability.effect,
    trigger:
      ability.effect.trigger ??
      null,
    target:
      ability.target,
    roles:
      ability.roles,
    cooldownModifier:
      ability.effect
        .baseCtReduction ??
      ability.effect.seconds ??
      null,
    stackRule:
      ability.stackRule,
    priority:
      ability.priority,
    visualEffectId:
      ability.visualEffectId,
    commentaryTags:
      ability.commentaryTags,
    learnedAt,
  };

  player.specialAbilities =
    Array.isArray(
      player.specialAbilities,
    )
      ? player.specialAbilities.filter(
          (learnedEntry) =>
            learnedEntry.abilityId !==
            ability.abilityId,
        )
      : [];
  player.specialAbilities.push(
    entry,
  );
  ensurePlayerSkillsToDraft(draft);

  return {
    playerId,
    abilityKey:
      ability.abilityKey,
    abilityId:
      ability.abilityId,
    color:
      ability.color,
    stage:
      ability.stage,
    previousStage:
      state.currentLevel,
    name:
      ability.name,
    image:
      ability.image,
    cost:
      ability.cost,
    rainbow:
      ability.stage === 2,
  };
}

function pointPoolTemplate(snapshot, playerId) {
  return `
    <section class="team-point-grid" aria-label="トレーニングポイント">
      ${TRAINING_POINT_IDS.map((pointId) => `
        <div class="team-point-chip team-point-chip--${pointId}">
          <span>${POINT_LABELS[pointId]}</span>
          <strong>${formatNumber(getPlayerTrainingPointPool(snapshot, playerId)[pointId])}</strong>
        </div>
      `).join("")}
    </section>
  `;
}

export function calculatePlayerStatUpgradePlan(
  snapshot,
  playerId,
  increments = {},
) {
  const player = getPlayer(snapshot, playerId);
  const normalized = Object.fromEntries(
    PLAYER_STAT_DEFINITIONS.map((definition) => [
      definition.id,
      Math.max(0, Math.floor(increments[definition.id] ?? 0)),
    ]),
  );
  const totalCost = Object.fromEntries(
    TRAINING_POINT_IDS.map((pointId) => [pointId, 0]),
  );
  const rows = PLAYER_STAT_DEFINITIONS.map((definition) => {
    const currentValue = player.stats[definition.id];
    let projectedValue = currentValue;
    const steps = [];
    for (let index = 0; index < normalized[definition.id]; index += 1) {
      const cost = getStatUpgradeCost(projectedValue);
      if (!cost) break;
      const pointCost = Object.fromEntries(
        TRAINING_POINT_IDS.map((pointId) => [pointId, 0]),
      );
      pointCost[definition.primaryPoint] = cost.primary;
      pointCost[definition.secondaryPoint] = cost.secondary;
      for (const pointId of TRAINING_POINT_IDS) {
        totalCost[pointId] += pointCost[pointId];
      }
      steps.push(pointCost);
      projectedValue += 1;
    }
    normalized[definition.id] = steps.length;
    const nextCostMaster = getStatUpgradeCost(projectedValue);
    const nextCost = Object.fromEntries(
      TRAINING_POINT_IDS.map((pointId) => [pointId, 0]),
    );
    if (nextCostMaster) {
      nextCost[definition.primaryPoint] = nextCostMaster.primary;
      nextCost[definition.secondaryPoint] = nextCostMaster.secondary;
    }
    return {
      definition,
      currentValue,
      projectedValue,
      increment: steps.length,
      nextCost,
      atMaximum: nextCostMaster === null,
    };
  });
  const remainingPoints = Object.fromEntries(
    TRAINING_POINT_IDS.map((pointId) => [
      pointId,
      getPlayerTrainingPointPool(snapshot, playerId)[pointId] - totalCost[pointId],
    ]),
  );
  return {
    playerId,
    increments: normalized,
    totalCost,
    remainingPoints,
    affordable: TRAINING_POINT_IDS.every((pointId) => remainingPoints[pointId] >= 0),
    hasChanges: Object.values(normalized).some((value) => value > 0),
    rows,
  };
}

export function applyPlayerStatUpgradePlanToDraft(
  draft,
  playerId,
  increments,
) {
  assertDraft(draft);
  const results = [];
  for (const definition of PLAYER_STAT_DEFINITIONS) {
    const count = Math.max(0, Math.floor(increments?.[definition.id] ?? 0));
    for (let index = 0; index < count; index += 1) {
      results.push(upgradePlayerStatToDraft(draft, playerId, definition.id));
    }
  }
  if (results.length === 0) {
    throw new RangeError("確定する能力アップがありません。");
  }
  return {
    playerId,
    results,
    totalUpgrades: results.length,
    characterRank: getPlayer(draft, playerId).characterRank,
  };
}

export function renderPlayerSelector(snapshot, selectedPlayerId) {
  return `
    <div class="team-player-selector" role="tablist" aria-label="選手選択">
      ${snapshot.playerTeam.members.map((player) => `
        <button
          type="button"
          class="team-player-tab"
          data-action="select-team-player"
          data-player-id="${escapeAttribute(player.playerId)}"
          aria-selected="${player.playerId === selectedPlayerId}"
        >
          <img
            class="player-portrait player-portrait--selector"
            data-role="${escapeAttribute(player.role)}"
            src="${escapeAttribute(player.image)}"
            alt=""
          >
          <span>${escapeHtml(player.role)}</span>
          <strong>${escapeHtml(player.name)}</strong>
          ${motivationBadgeTemplate(player.motivation, "motivation-badge--selector")}
        </button>
      `).join("")}
    </div>
  `;
}

function statMiniTemplate(player, definition) {
  const value = player.stats[definition.id];
  return `
    <div class="player-stat-mini">
      <img src="${escapeAttribute(definition.icon)}" alt="">
      <span>${escapeHtml(definition.name)}</span>
      <strong>${escapeHtml(characterValueToRank(value))}</strong>
      <small>${value}</small>
    </div>
  `;
}

export function renderTeamDetailsSection(snapshot) {
  return `
    <section class="team-detail-grid">
      ${snapshot.playerTeam.members.map((player) => `
        <button type="button" class="team-detail-card team-detail-card--tap" data-action="inspect-team-player" data-player-id="${escapeAttribute(player.playerId)}">
          <header class="team-detail-card__header">
            <img
              class="team-detail-card__portrait player-portrait"
              data-role="${escapeAttribute(player.role)}"
              src="${escapeAttribute(player.image)}"
              alt="${escapeAttribute(player.name)}"
            >
            <div>
              <span class="role-badge">
                <img src="${escapeAttribute(ROLE_ICONS[player.role])}" alt="">
                ${escapeHtml(player.role)}
              </span>
              <h3>${escapeHtml(player.name)}</h3>
              <p>総合RANK ${escapeHtml(player.characterRank)} → ${escapeHtml(effectiveRankForPlayer(player))}</p>
              ${motivationBadgeTemplate(player.motivation, "motivation-badge--detail")}
            </div>
          </header>
          <div class="player-stat-mini-grid">
            ${PLAYER_STAT_DEFINITIONS.map(
              (definition) => statMiniTemplate(player, definition),
            ).join("")}
          </div>
          <span class="team-detail-card__tap">TAP</span>
          <footer class="team-detail-card__weapon">
            <img src="${escapeAttribute(player.weapon.image)}" alt="">
            <div>
              <span>WEAPON</span>
              <strong>${escapeHtml(player.weapon.weaponName)}</strong>
            </div>
          </footer>
        </button>
      `).join("")}
    </section>
  `;
}

function abilityCostTemplate(cost) {
  return TRAINING_POINT_IDS
    .filter((pointId) => cost[pointId] > 0)
    .map(
      (pointId) =>
        `<span>${POINT_LABELS[pointId]} ${formatNumber(cost[pointId])}</span>`,
    )
    .join("");
}


const PLAYER_STAT_DESCRIPTIONS = Object.freeze({
  stamina:
    "最大HPと粘り強さを伸ばします。長い戦闘や連戦で倒れにくくなります。",
  mind:
    "精神面の安定性を高め、プレッシャー下の戦闘性能を支えます。",
  physical:
    "近距離の押し合いと被弾時の耐久力を伸ばします。",
  aim:
    "射撃精度と有効弾の出やすさを高めます。",
  agility:
    "移動・回避・間合い調整の性能を高めます。",
  technique:
    "武器操作、戦術対応、スキル運用の安定性を高めます。",
  support:
    "回復・蘇生・味方支援の効果を高めます。",
});

const WEAPON_STAT_DESCRIPTIONS = Object.freeze({
  close:
    "近距離での武器ダメージと押し込み性能を高めます。",
  mid:
    "中距離での安定火力と命中期待値を高めます。",
  far:
    "遠距離での武器ダメージと射線維持力を高めます。",
  fireRate:
    "連射間隔を改善し、短時間に与えるダメージを増やします。",
  reload:
    "リロード時間を短縮し、攻撃が止まる時間を減らします。",
});

const WEAPON_STAT_ICONS = Object.freeze({
  close: "icon/phy.png",
  mid: "icon/aim.png",
  far: "icon/teq.png",
  fireRate: "icon/agi.png",
  reload: "icon/mind.png",
});

function radialNodePositions(
  count,
  {
    radius = 41,
    startAngle = -90,
  } = {},
) {
  return Array.from(
    { length: count },
    (_value, index) => {
      const angle =
        (
          startAngle +
          (
            360 /
            Math.max(
              1,
              count,
            )
          ) *
          index
        ) *
        (
          Math.PI /
          180
        );
      return {
        x:
          50 +
          Math.cos(angle) *
          radius,
        y:
          50 +
          Math.sin(angle) *
          radius,
      };
    },
  );
}

function radialUpgradeMapTemplate({
  kind,
  playerId,
  centerImage,
  centerLabel,
  centerSubLabel,
  rows,
}) {
  const positions =
    radialNodePositions(
      rows.length,
      {
        radius:
          rows.length >=
          7
            ? 42
            : 40,
      },
    );

  return `
    <section
      class="upgrade-radial-map upgrade-radial-map--${escapeAttribute(kind)}"
      aria-label="${escapeAttribute(centerLabel)}の強化項目"
    >
      <svg
        class="upgrade-radial-map__lines"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        ${positions.map(
          (position) => `
            <line
              x1="50"
              y1="50"
              x2="${position.x.toFixed(3)}"
              y2="${position.y.toFixed(3)}"
            ></line>
          `,
        ).join("")}
      </svg>

      <div class="upgrade-radial-map__center">
        <div>
          <img
            src="${escapeAttribute(centerImage)}"
            alt=""
            ${
              kind === "ability"
                ? 'class="player-portrait"'
                : ""
            }
          >
        </div>
        <strong>${escapeHtml(centerLabel)}</strong>
        <small>${escapeHtml(centerSubLabel)}</small>
      </div>

      ${rows.map((row, index) => {
        const position =
          positions[index];
        const statId =
          row.definition.id;
        const rank =
          kind ===
          "ability"
            ? characterValueToRank(
                row.projectedValue,
              )
            : row.projectedRank;
        const icon =
          kind ===
          "ability"
            ? row.definition.icon
            : WEAPON_STAT_ICONS[
                statId
              ] ??
              "menu/eq.png";
        return `
          <button
            type="button"
            class="upgrade-radial-node ${row.increment > 0 ? "is-planned" : ""}"
            style="
              --node-x:${position.x.toFixed(3)}%;
              --node-y:${position.y.toFixed(3)}%;
            "
            data-action="open-upgrade-node"
            data-upgrade-kind="${escapeAttribute(kind)}"
            data-player-id="${escapeAttribute(playerId)}"
            data-stat-id="${escapeAttribute(statId)}"
            aria-label="${escapeAttribute(row.definition.displayName ?? row.definition.name)}の強化詳細"
          >
            <img
              src="${escapeAttribute(icon)}"
              alt=""
            >
            <span>${escapeHtml(row.definition.displayName ?? row.definition.name)}</span>
            <strong>${escapeHtml(rank)}</strong>
            ${
              row.increment > 0
                ? `<b>+${row.increment}</b>`
                : ""
            }
          </button>
        `;
      }).join("")}
    </section>
  `;
}

function upgradeModalStepperTemplate({
  kind,
  playerId,
  statId,
  increment,
  minusDisabled,
  plusDisabled,
}) {
  return `
    <div class="upgrade-node-modal__stepper">
      <button
        type="button"
        data-repeat-action
        data-action="modal-upgrade-minus"
        data-upgrade-kind="${escapeAttribute(kind)}"
        data-player-id="${escapeAttribute(playerId)}"
        data-stat-id="${escapeAttribute(statId)}"
        ${minusDisabled ? "disabled" : ""}
      >
        −
      </button>
      <strong>${increment}</strong>
      <button
        type="button"
        data-repeat-action
        data-action="modal-upgrade-plus"
        data-upgrade-kind="${escapeAttribute(kind)}"
        data-player-id="${escapeAttribute(playerId)}"
        data-stat-id="${escapeAttribute(statId)}"
        ${plusDisabled ? "disabled" : ""}
      >
        ＋
      </button>
    </div>
  `;
}

export function renderAbilityUpgradeNodeModal(
  snapshot,
  playerId,
  statId,
  pendingIncrements = {},
) {
  const player =
    getPlayer(
      snapshot,
      playerId,
    );
  const plan =
    calculatePlayerStatUpgradePlan(
      snapshot,
      playerId,
      pendingIncrements,
    );
  const row =
    plan.rows.find(
      (entry) =>
        entry.definition.id ===
        statId,
    );
  if (!row) {
    throw new RangeError(
      `Unknown ability stat: ${statId}`,
    );
  }
  const projectedRank =
    characterValueToRank(
      row.projectedValue,
    );
  const nextAffordable =
    !row.atMaximum &&
    canAffordPointCost(
      plan.remainingPoints,
      row.nextCost,
    );

  return `
    <section class="upgrade-node-modal upgrade-node-modal--ability">
      <header>
        <img
          src="${escapeAttribute(row.definition.icon)}"
          alt=""
        >
        <div>
          <span>${escapeHtml(row.definition.name)}</span>
          <strong>${escapeHtml(row.definition.displayName)}</strong>
          <small>${escapeHtml(player.name)} / ${escapeHtml(player.role)}</small>
        </div>
      </header>

      <p>${escapeHtml(PLAYER_STAT_DESCRIPTIONS[statId] ?? "")}</p>

      <div class="upgrade-node-modal__rank">
        <span>
          現在
          <strong>${escapeHtml(characterValueToRank(row.currentValue))}</strong>
          <small>内部値 ${row.currentValue}</small>
        </span>
        <b>→</b>
        <span>
          強化後
          <strong>${escapeHtml(projectedRank)}</strong>
          <small>内部値 ${row.projectedValue}</small>
        </span>
      </div>

      <section class="upgrade-node-modal__cost">
        <span>NEXT COST</span>
        ${
          row.atMaximum
            ? `<strong>MAX</strong>`
            : `
              <div class="cost-tags">
                ${abilityCostTemplate(row.nextCost)}
              </div>
            `
        }
      </section>

      ${upgradeModalStepperTemplate({
        kind: "ability",
        playerId,
        statId,
        increment: row.increment,
        minusDisabled:
          row.increment <=
          0,
        plusDisabled:
          !nextAffordable,
      })}

      <small class="upgrade-node-modal__note">
        ＋／−は長押し対応。選択内容は閉じても保持されます。
      </small>
    </section>
  `;
}

export function renderWeaponUpgradeNodeModal(
  snapshot,
  playerId,
  statId,
  pendingIncrements = {},
) {
  const player =
    getPlayer(
      snapshot,
      playerId,
    );
  const plan =
    calculateWeaponUpgradePlan(
      snapshot,
      playerId,
      pendingIncrements,
    );
  const row =
    plan.rows.find(
      (entry) =>
        entry.definition.id ===
        statId,
    );
  if (!row) {
    throw new RangeError(
      `Unknown weapon stat: ${statId}`,
    );
  }
  const nextAffordable =
    row.nextCost &&
    plan.remainingCoin >=
      row.nextCost.coin &&
    plan.remainingRuby >=
      row.nextCost.ruby;

  return `
    <section class="upgrade-node-modal upgrade-node-modal--weapon">
      <header>
        <img
          src="${escapeAttribute(WEAPON_STAT_ICONS[statId] ?? "menu/eq.png")}"
          alt=""
        >
        <div>
          <span>WEAPON PARAMETER</span>
          <strong>${escapeHtml(row.definition.name)}</strong>
          <small>${escapeHtml(player.weapon.weaponName)}</small>
        </div>
      </header>

      <p>${escapeHtml(WEAPON_STAT_DESCRIPTIONS[statId] ?? "")}</p>

      <div class="upgrade-node-modal__rank">
        <span>
          現在
          <strong>${escapeHtml(row.currentRank)}</strong>
          <small>内部値 ${row.currentValue}</small>
        </span>
        <b>→</b>
        <span>
          強化後
          <strong>${escapeHtml(row.projectedRank)}</strong>
          <small>内部値 ${row.projectedValue}</small>
        </span>
      </div>

      <section class="upgrade-node-modal__cost">
        <span>NEXT COST</span>
        ${
          row.nextCost
            ? `
              <div class="cost-tags">
                <span>COIN ${formatNumber(row.nextCost.coin)}</span>
                ${
                  row.nextCost.ruby > 0
                    ? `<span>RUBY ${formatNumber(row.nextCost.ruby)}</span>`
                    : ""
                }
              </div>
            `
            : `<strong>MAX</strong>`
        }
      </section>

      ${upgradeModalStepperTemplate({
        kind: "weapon",
        playerId,
        statId,
        increment: row.increment,
        minusDisabled:
          row.increment <=
          0,
        plusDisabled:
          !nextAffordable,
      })}

      <small class="upgrade-node-modal__note">
        ＋／−は長押し対応。選択内容は閉じても保持されます。
      </small>
    </section>
  `;
}

function upgradeResourceStripTemplate(entries) {
  return `
    <section class="upgrade-console__resources">
      ${entries.map((entry) => `
        <span class="${entry.negative ? "is-negative" : ""}">
          ${escapeHtml(entry.label)}
          <strong>${escapeHtml(entry.before)}</strong>
          <em>→ ${escapeHtml(entry.after)}</em>
        </span>
      `).join("")}
    </section>
  `;
}

export function renderAbilityUpSection(
  snapshot,
  selectedPlayerId,
  pendingIncrements = {},
  {
    includeSelector = true,
  } = {},
) {
  const playerId =
    getSelectedPlayerId(
      snapshot,
      selectedPlayerId,
    );
  const player =
    getPlayer(
      snapshot,
      playerId,
    );
  const plan =
    calculatePlayerStatUpgradePlan(
      snapshot,
      playerId,
      pendingIncrements,
    );
  const totalUpgrades =
    plan.rows.reduce(
      (sum, row) =>
        sum + row.increment,
      0,
    );

  return `
    <div
      class="team-feature-live-section"
      data-live-section="ability"
    >
      ${
        includeSelector
          ? renderPlayerSelector(
              snapshot,
              playerId,
            )
          : ""
      }

      ${upgradeResourceStripTemplate(
        TRAINING_POINT_IDS.map(
          (pointId) => ({
            label:
              POINT_LABELS[
                pointId
              ],
            before:
              formatNumber(
                getPlayerTrainingPointPool(
                  snapshot,
                  playerId,
                )[pointId],
              ),
            after:
              formatNumber(
                plan.remainingPoints[
                  pointId
                ],
              ),
            negative:
              plan.remainingPoints[
                pointId
              ] < 0,
          }),
        ),
      )}

      <section class="radial-upgrade-console radial-upgrade-console--ability">
        <header class="radial-upgrade-console__header">
          <div>
            <span>PLAYER ABILITY</span>
            <strong>能力ノードをタップして強化</strong>
          </div>
          <small>
            選択時に画面位置は動きません
          </small>
        </header>

        ${radialUpgradeMapTemplate({
          kind: "ability",
          playerId,
          centerImage:
            player.image,
          centerLabel:
            player.name,
          centerSubLabel:
            `${player.role} / RANK ${player.characterRank}`,
          rows:
            plan.rows,
        })}

        <footer class="radial-upgrade-console__footer">
          <div>
            <span>予定強化</span>
            <strong>${totalUpgrades}段階</strong>
          </div>
          <button
            type="button"
            class="primary-button"
            data-action="ability-plan-confirm"
            data-player-id="${escapeAttribute(playerId)}"
            ${plan.hasChanges && plan.affordable ? "" : "disabled"}
          >
            能力アップを確定
          </button>
        </footer>
      </section>
    </div>
  `;
}

export function renderEquipmentSection(
  snapshot,
  selectedPlayerId,
  pendingIncrements = {},
  {
    includeSelector = true,
  } = {},
) {
  const playerId =
    getSelectedPlayerId(
      snapshot,
      selectedPlayerId,
    );
  const player =
    getPlayer(
      snapshot,
      playerId,
    );
  const ownedSkins =
    WEAPON_SKINS.filter(
      (skin) =>
        snapshot.inventory
          .weaponSkins?.[
            skin.skinId
          ] === true,
    );
  const plan =
    calculateWeaponUpgradePlan(
      snapshot,
      playerId,
      pendingIncrements,
    );
  const totalUpgrades =
    plan.rows.reduce(
      (sum, row) =>
        sum + row.increment,
      0,
    );

  return `
    <div
      class="team-feature-live-section"
      data-live-section="equipment"
    >
      ${
        includeSelector
          ? renderPlayerSelector(
              snapshot,
              playerId,
            )
          : ""
      }

      ${upgradeResourceStripTemplate([
        {
          label: "COIN",
          before:
            formatNumber(
              snapshot.resources.coin,
            ),
          after:
            formatNumber(
              plan.remainingCoin,
            ),
          negative:
            plan.remainingCoin < 0,
        },
        {
          label: "RUBY",
          before:
            formatNumber(
              snapshot.resources.ruby,
            ),
          after:
            formatNumber(
              plan.remainingRuby,
            ),
          negative:
            plan.remainingRuby < 0,
        },
      ])}

      <section class="radial-upgrade-console radial-upgrade-console--weapon">
        <header class="radial-upgrade-console__header">
          <div>
            <span>PERSONAL WEAPON</span>
            <strong>武器能力ノードをタップして強化</strong>
          </div>
          <small>
            選択時に画面位置は動きません
          </small>
        </header>

        ${radialUpgradeMapTemplate({
          kind: "weapon",
          playerId,
          centerImage:
            player.weapon.image,
          centerLabel:
            player.weapon.weaponName,
          centerSubLabel:
            `${player.name} / ${player.role}`,
          rows:
            plan.rows,
        })}

        <section class="radial-upgrade-console__weapon-tools">
          <button
            type="button"
            class="secondary-button"
            data-action="rename-weapon"
            data-player-id="${escapeAttribute(playerId)}"
          >
            武器名変更
          </button>
          <label>
            <span>武器スキン</span>
            <select
              id="weaponSkinSelect"
              data-player-id="${escapeAttribute(playerId)}"
            >
              ${ownedSkins.map((skin) => `
                <option
                  value="${escapeAttribute(skin.skinId)}"
                  ${skin.skinId === player.weapon.skinId ? "selected" : ""}
                >
                  ${escapeHtml(skin.name)}
                </option>
              `).join("")}
            </select>
          </label>
          <button
            type="button"
            class="secondary-button"
            data-action="change-weapon-skin"
            data-player-id="${escapeAttribute(playerId)}"
          >
            スキン変更
          </button>
        </section>

        <footer class="radial-upgrade-console__footer">
          <div>
            <span>予定強化</span>
            <strong>${totalUpgrades}段階</strong>
          </div>
          <button
            type="button"
            class="primary-button"
            data-action="weapon-plan-confirm"
            data-player-id="${escapeAttribute(playerId)}"
            ${plan.hasChanges && plan.affordable ? "" : "disabled"}
          >
            武器強化を確定
          </button>
        </footer>
      </section>
    </div>
  `;
}

function conditionLabel(detail) {
  const { condition, current, required } = detail;
  const labels = {
    wins: "優勝",
    top5: "TOP5",
    mvp: "MVP",
    damage: "累計ダメージ",
    kp: "累計KP",
    ap: "累計AP",
    training: "トレーニング",
    cardTypes: "カード種類",
    badgeTypes: "バッジ種類",
    championshipWins: "Championship優勝",
  };
  const tier = condition.tier
    ? ` ${condition.tier.toUpperCase()}`
    : "";
  return `${labels[condition.type] ?? condition.type}${tier} ${formatNumber(current)} / ${formatNumber(required)}`;
}

export function renderSkillUpgradeSection(
  snapshot,
  selectedPlayerId,
  { includeSelector = true } = {},
) {
  const playerId = getSelectedPlayerId(snapshot, selectedPlayerId);
  const player = getPlayer(snapshot, playerId);
  const masterById = new Map(
    getRoleCommonSkills(player.role).map((skill) => [skill.id, skill]),
  );
  const skills = (player.skills ?? []).map((skill) => {
    const master = masterById.get(skill.skillId) ?? skill;
    const level = Math.max(1, Math.min(SKILL_MAX_LEVEL, skill.level ?? 1));
    return {
      ...skill,
      master,
      level,
      profile: getSkillLevelProfile(level),
      nextProfile: getSkillLevelProfile(Math.min(SKILL_MAX_LEVEL, level + 1)),
      displayName: skill.customName ?? skill.name ?? master.name,
      nextCost: level < SKILL_MAX_LEVEL ? SKILL_UPGRADE_COSTS[level] : null,
    };
  });

  return `
    <div class="team-feature-live-section" data-live-section="skill">
      ${includeSelector ? renderPlayerSelector(snapshot, playerId) : ""}
      <section class="skill-lab-overview">
        <div>
          <span>PLAYER SKILL LAB</span>
          <h2>${escapeHtml(player.role)} SKILL CUSTOMIZE</h2>
          <p>最大LV5。通常攻撃と武器の価値を残しながら、CTと効果を少しずつ強化します。</p>
        </div>
        <strong>COIN ${formatNumber(snapshot.resources.coin)}</strong>
      </section>
      <section class="skill-upgrade-grid">
        ${skills.map((skill, index) => `
          <article class="skill-upgrade-card ${skill.level >= SKILL_MAX_LEVEL ? "is-max" : ""}">
            <header><span>SKILL ${index + 1}</span><strong>LV ${skill.level}</strong></header>
            <div class="skill-upgrade-card__name">
              <img src="icon/sp.png" alt="">
              <div><h3>${escapeHtml(skill.displayName)}</h3><small>DEFAULT ${escapeHtml(skill.name ?? skill.master.name)}</small></div>
            </div>
            <p class="skill-upgrade-card__description">${escapeHtml(skill.master.description ?? "戦闘中に条件を満たすと自動発動します。")}</p>
            <div class="skill-upgrade-card__base-effect">
              <span>${escapeHtml(skill.master.type ?? "SKILL")}</span>
              <strong>基本CT ${Number(skill.master.baseCt ?? 0).toFixed(1)}秒</strong>
              <small>現在CT ${(Number(skill.master.baseCt ?? 0) * (1 - skill.profile.cooldownReductionPercent / 100)).toFixed(2)}秒</small>
            </div>
            <div class="skill-upgrade-card__metrics">
              <span>CT <strong>${skill.profile.cooldownReductionPercent.toFixed(1)}%短縮</strong></span>
              <span>効果 <strong>+${skill.profile.powerIncreasePercent.toFixed(1)}%</strong></span>
            </div>
            ${skill.nextCost !== null ? `
              <div class="skill-upgrade-card__next">
                <span>NEXT LV ${skill.level + 1}</span>
                <small>
                  実CT ${(Number(skill.master.baseCt ?? 0) * (1 - skill.profile.cooldownReductionPercent / 100)).toFixed(2)}秒
                  → ${(Number(skill.master.baseCt ?? 0) * (1 - skill.nextProfile.cooldownReductionPercent / 100)).toFixed(2)}秒<br>
                  効果 +${skill.profile.powerIncreasePercent.toFixed(1)}%
                  → +${skill.nextProfile.powerIncreasePercent.toFixed(1)}%
                </small>
                <strong>COIN ${formatNumber(skill.nextCost)}</strong>
              </div>
            ` : `<div class="skill-upgrade-card__next is-max"><strong>MAX LEVEL</strong></div>`}
            <div class="skill-upgrade-card__actions">
              <button type="button" class="secondary-button" data-action="rename-player-skill" data-player-id="${escapeAttribute(playerId)}" data-skill-id="${escapeAttribute(skill.skillId)}">名称変更</button>
              <button type="button" class="primary-button" data-action="upgrade-player-skill" data-player-id="${escapeAttribute(playerId)}" data-skill-id="${escapeAttribute(skill.skillId)}" ${skill.nextCost !== null && snapshot.resources.coin >= skill.nextCost ? "" : "disabled"}>${skill.nextCost === null ? "MAX" : "スキル強化"}</button>
            </div>
          </article>
        `).join("")}
      </section>
    </div>
  `;
}

export function renderSpecialAbilitySection(
  snapshot,
  selectedPlayerId,
  color = "blue",
  {
    includeSelector = true,
  } = {},
) {
  const playerId =
    getSelectedPlayerId(
      snapshot,
      selectedPlayerId,
    );
  const player =
    getPlayer(
      snapshot,
      playerId,
    );
  const normalizedColor =
    color === "gold"
      ? "gold"
      : "blue";
  const abilities =
    getSpecialAbilitiesForRole(
      player.role,
      normalizedColor,
    );

  return `
    <div
      class="team-feature-live-section"
      data-live-section="special"
    >
      ${
        includeSelector
          ? renderPlayerSelector(
              snapshot,
              playerId,
            )
          : ""
      }
      ${pointPoolTemplate(snapshot, playerId)}

      <div
        class="special-color-tabs special-color-tabs--generation50"
        role="tablist"
      >
        <button
          type="button"
          class="special-color-tab special-color-tab--blue"
          data-action="select-ability-color"
          data-ability-color="blue"
          aria-selected="${normalizedColor === "blue"}"
        >
          NORMAL
        </button>
        <button
          type="button"
          class="special-color-tab special-color-tab--gold"
          data-action="select-ability-color"
          data-ability-color="gold"
          aria-selected="${normalizedColor === "gold"}"
        >
          GOLD
        </button>
      </div>

      <p class="special-ability-guide">
        1回目で習得、2回目で効果強化。LEVEL 2は枠が虹色に発光します。
      </p>

      <section
        class="special-ability-list special-ability-list--generation50"
      >
        ${abilities.map(
          (family) => {
            const state =
              getAbilityAcquisitionState(
                snapshot,
                playerId,
                family.abilityKey,
              );
            const visualState =
              state.rainbow
                ? "rainbow"
                : state.currentLevel === 1
                  ? "learned"
                  : state.learnable
                    ? "learnable"
                    : !state.conditionState.unlocked
                      ? "locked"
                      : "insufficient";
            const statusText =
              state.rainbow
                ? "LEVEL 2"
                : state.currentLevel === 1
                  ? "LEVEL 1 / 強化可"
                  : state.learnable
                    ? "習得可"
                    : !state.affordable
                      ? "PT不足"
                      : "詳細";
            return `
              <button
                type="button"
                class="special-ability-card special-ability-card--generation50 special-ability-card--${family.color} is-${visualState}"
                data-ability-state="${visualState}"
                data-action="inspect-special-ability"
                data-player-id="${escapeAttribute(playerId)}"
                data-ability-key="${escapeAttribute(family.abilityKey)}"
                aria-label="${escapeAttribute(family.name)}の詳細"
              >
                <span class="special-ability-card__image">
                  <img
                    src="${escapeAttribute(family.image)}"
                    alt=""
                  >
                </span>
                <span class="special-ability-card__id">
                  ${escapeHtml(family.abilityId)}
                </span>
                <strong>${escapeHtml(family.name)}</strong>
                <em>${escapeHtml(family.roles.join(" / "))}</em>
                <small>
                  <i></i>
                  ${escapeHtml(statusText)}
                </small>
              </button>
            `;
          },
        ).join("")}
      </section>
    </div>
  `;
}
