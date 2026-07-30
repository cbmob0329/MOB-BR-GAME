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
} from "../../data/game-data.js?v=35";
import {
  calculateMaxHp,
  getRoleCommonSkills,
} from "../../data/battle-config.js?v=35";
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
  getSpecialAbilitiesForRole,
  getSpecialAbility,
  getStatUpgradeCost,
  getWeaponStatDefinition,
  getWeaponUpgradeCost,
} from "../../data/ability-data.js";

export const TEAM_FEATURE_VERSION = "mobbr-team-feature-1.1.0";

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

function getLearnedAbility(player, abilityId, color) {
  return (player.specialAbilities ?? []).find(
    (ability) =>
      ability.abilityId === abilityId &&
      ability.color === color,
  ) ?? null;
}

export function getAbilityAcquisitionState(
  snapshot,
  playerId,
  abilityKey,
) {
  const player = getPlayer(snapshot, playerId);
  const ability = getSpecialAbility(abilityKey);
  const applicable =
    ability.target === "COMMON" || ability.target === player.role;
  const learned = getLearnedAbility(
    player,
    ability.abilityId,
    ability.color,
  );

  const conditionState = evaluateUnlockConditions(
    ability.unlockConditions,
    buildAbilityProgress(snapshot, playerId),
  );

  const stagePrerequisiteMet =
    ability.color !== "blue" ||
    ability.stage === 1 ||
    (learned && learned.stage === 1);

  const alreadyLearned =
    learned &&
    (
      ability.color !== "blue" ||
      learned.stage >= ability.stage
    );

  const replaced =
    ability.color === "blue" &&
    ability.stage === 1 &&
    learned?.stage === 2;

  const affordable = canAffordPointCost(
    getPlayerTrainingPointPool(snapshot, playerId),
    ability.cost,
  );

  return {
    ability,
    applicable,
    conditionState,
    stagePrerequisiteMet,
    alreadyLearned,
    replaced,
    affordable,
    learnable:
      applicable &&
      conditionState.unlocked &&
      stagePrerequisiteMet &&
      !alreadyLearned &&
      !replaced &&
      affordable,
  };
}

export function learnSpecialAbilityToDraft(
  draft,
  playerId,
  abilityKey,
  learnedAt = new Date().toISOString(),
) {
  assertDraft(draft);
  const state = getAbilityAcquisitionState(
    draft,
    playerId,
    abilityKey,
  );
  const { ability } = state;

  if (!state.applicable) {
    throw new RangeError("この選手の役職では習得できません。");
  }
  if (!state.conditionState.unlocked) {
    throw new RangeError("解放条件を満たしていません。");
  }
  if (!state.stagePrerequisiteMet) {
    throw new RangeError("青特殊能力の第1段階を先に習得してください。");
  }
  if (state.alreadyLearned || state.replaced) {
    throw new RangeError("すでに習得済みです。");
  }
  if (!state.affordable) {
    throw new RangeError("トレーニングポイントが不足しています。");
  }

  const player = getPlayer(draft, playerId);
  subtractPointCost(ensurePlayerTrainingPointPoolToDraft(draft, playerId), ability.cost);

  const entry = {
    abilityKey: ability.abilityKey,
    abilityId: ability.abilityId,
    color: ability.color,
    stage: ability.stage,
    name: ability.name,
    description: ability.description,
    effectType: ability.effect.code ?? "unknown",
    effectValue: ability.effect,
    trigger: ability.effect.trigger ?? null,
    target: ability.target,
    cooldownModifier:
      ability.effect.baseCtReduction ??
      ability.effect.seconds ??
      null,
    stackRule: ability.stackRule,
    priority: ability.priority,
    visualEffectId: ability.visualEffectId,
    commentaryTags: ability.commentaryTags,
    learnedAt,
  };

  player.specialAbilities = Array.isArray(player.specialAbilities)
    ? player.specialAbilities
    : [];

  if (ability.color === "blue") {
    player.specialAbilities = player.specialAbilities.filter(
      (learned) =>
        !(
          learned.color === "blue" &&
          learned.abilityId === ability.abilityId
        ),
    );
  }
  player.specialAbilities.push(entry);
  ensurePlayerSkillsToDraft(draft);

  return {
    playerId,
    abilityKey,
    abilityId: ability.abilityId,
    color: ability.color,
    stage: ability.stage,
    name: ability.name,
    cost: ability.cost,
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
              <p>総合RANK ${escapeHtml(player.characterRank)}</p>
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

export function renderAbilityUpSection(
  snapshot,
  selectedPlayerId,
  pendingIncrements = {},
  {
    includeSelector = true,
  } = {},
) {
  const playerId = getSelectedPlayerId(snapshot, selectedPlayerId);
  const player = getPlayer(snapshot, playerId);
  const plan = calculatePlayerStatUpgradePlan(snapshot, playerId, pendingIncrements);

  return `
    <div class="team-feature-live-section" data-live-section="ability">
    ${includeSelector ? renderPlayerSelector(snapshot, playerId) : ""}
    <section class="ability-plan-points">
      ${TRAINING_POINT_IDS.map((pointId) => `
        <span class="${plan.remainingPoints[pointId] < 0 ? "is-negative" : ""}">
          ${POINT_LABELS[pointId]}
          <strong>${formatNumber(getPlayerTrainingPointPool(snapshot, playerId)[pointId])}</strong>
          <em>→ ${formatNumber(plan.remainingPoints[pointId])}</em>
        </span>
      `).join("")}
    </section>
    <section class="growth-grid growth-grid--planned">
      ${plan.rows.map((row) => {
        const projectedRank = characterValueToRank(row.projectedValue);
        const nextAffordable = !row.atMaximum && canAffordPointCost(plan.remainingPoints, row.nextCost);
        return `
          <article class="growth-card growth-card--planned">
            <img class="growth-card__icon" src="${escapeAttribute(row.definition.icon)}" alt="">
            <div class="growth-card__main">
              <h3>${escapeHtml(row.definition.displayName)}</h3>
              <p>${escapeHtml(characterValueToRank(row.currentValue))}${row.increment > 0 ? ` → <strong>${escapeHtml(projectedRank)}</strong>` : ""}<span>内部値 ${row.currentValue}${row.increment > 0 ? ` + ${row.increment}` : ""}</span></p>
              ${row.atMaximum ? `<div class="cost-tags"><span>MAX</span></div>` : `<div class="cost-tags">${abilityCostTemplate(row.nextCost)}</div>`}
            </div>
            <div class="growth-stepper">
              <button type="button" data-repeat-action data-action="ability-plan-minus" data-player-id="${escapeAttribute(playerId)}" data-stat-id="${escapeAttribute(row.definition.id)}" ${row.increment > 0 ? "" : "disabled"}>−</button>
              <strong>${row.increment}</strong>
              <button type="button" data-repeat-action data-action="ability-plan-plus" data-player-id="${escapeAttribute(playerId)}" data-stat-id="${escapeAttribute(row.definition.id)}" ${nextAffordable ? "" : "disabled"}>＋</button>
            </div>
          </article>
        `;
      }).join("")}
    </section>
    <section class="ability-plan-footer">
      <div><span>予定強化</span><strong>${plan.rows.reduce((sum, row) => sum + row.increment, 0)}段階</strong></div>
      <button type="button" class="primary-button" data-action="ability-plan-confirm" data-player-id="${escapeAttribute(playerId)}" ${plan.hasChanges && plan.affordable ? "" : "disabled"}>能力アップを確定</button>
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
    getSelectedPlayerId(snapshot, selectedPlayerId);
  const player = getPlayer(snapshot, playerId);
  const ownedSkins = WEAPON_SKINS.filter(
    (skin) =>
      snapshot.inventory.weaponSkins?.[skin.skinId] === true,
  );
  const plan = calculateWeaponUpgradePlan(
    snapshot,
    playerId,
    pendingIncrements,
  );

  return `
    <div class="team-feature-live-section" data-live-section="equipment">
      ${includeSelector ? renderPlayerSelector(snapshot, playerId) : ""}
      <section class="weapon-overview">
        <img
          class="weapon-overview__image"
          src="${escapeAttribute(player.weapon.image)}"
          alt="${escapeAttribute(player.weapon.weaponName)}"
        >
        <div class="weapon-overview__main">
          <span>${escapeHtml(player.role)} WEAPON</span>
          <h2>${escapeHtml(player.weapon.weaponName)}</h2>
          <p>装弾数 ${player.weapon.ammoMax} / スキン ${escapeHtml(player.weapon.skinId)}</p>
        </div>
        <button
          type="button"
          class="secondary-button"
          data-action="rename-weapon"
          data-player-id="${escapeAttribute(playerId)}"
        >
          武器名変更
        </button>
      </section>

      <section class="content-panel weapon-skin-panel">
        <label for="weaponSkinSelect">武器スキン</label>
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
        <button
          type="button"
          class="primary-button"
          data-action="change-weapon-skin"
          data-player-id="${escapeAttribute(playerId)}"
        >
          スキンを変更
        </button>
      </section>

      <section class="weapon-plan-resources weapon-plan-resources--coin-only">
        <span>
          COIN ONLY
          <strong>${formatNumber(snapshot.resources.coin)}</strong>
          <em>→ ${formatNumber(plan.remainingCoin)}</em>
        </span>
      </section>

      <section class="growth-grid growth-grid--planned">
        ${plan.rows.map((row) => {
          const nextAffordable =
            row.nextCost &&
            plan.remainingCoin >= row.nextCost.coin;
          return `
            <article class="growth-card growth-card--weapon growth-card--planned">
              <div class="growth-card__main">
                <h3>${escapeHtml(row.definition.name)}</h3>
                <p>
                  ${escapeHtml(row.currentRank)}
                  ${
                    row.increment > 0
                      ? ` → <strong>${escapeHtml(row.projectedRank)}</strong>`
                      : ""
                  }
                  <span>
                    内部値 ${row.currentValue}
                    ${row.increment > 0 ? ` + ${row.increment}` : ""}
                  </span>
                </p>
                ${
                  row.nextCost
                    ? `
                      <div class="cost-tags">
                        <span>COIN ${formatNumber(row.nextCost.coin)}</span>
                      </div>
                    `
                    : `<div class="cost-tags"><span>MAX</span></div>`
                }
              </div>
              <div class="growth-stepper">
                <button
                  type="button"
                  data-repeat-action
                  data-action="weapon-plan-minus"
                  data-player-id="${escapeAttribute(playerId)}"
                  data-weapon-stat-id="${escapeAttribute(row.definition.id)}"
                  ${row.increment > 0 ? "" : "disabled"}
                >
                  −
                </button>
                <strong>${row.increment}</strong>
                <button
                  type="button"
                  data-repeat-action
                  data-action="weapon-plan-plus"
                  data-player-id="${escapeAttribute(playerId)}"
                  data-weapon-stat-id="${escapeAttribute(row.definition.id)}"
                  ${nextAffordable ? "" : "disabled"}
                >
                  ＋
                </button>
              </div>
            </article>
          `;
        }).join("")}
      </section>

      <section class="ability-plan-footer weapon-plan-footer">
        <div>
          <span>予定強化</span>
          <strong>${plan.rows.reduce((sum, row) => sum + row.increment, 0)}段階</strong>
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
  { includeSelector = true } = {},
) {
  const playerId = getSelectedPlayerId(snapshot, selectedPlayerId);
  const player = getPlayer(snapshot, playerId);
  const normalizedColor = ["blue", "gold", "red"].includes(color)
    ? color
    : "blue";
  const abilities = getSpecialAbilitiesForRole(
    player.role,
    normalizedColor,
  );

  return `
    <div class="team-feature-live-section" data-live-section="special">
    ${includeSelector ? renderPlayerSelector(snapshot, playerId) : ""}
    ${pointPoolTemplate(snapshot, playerId)}

    <div class="special-color-tabs" role="tablist">
      ${["blue", "gold", "red"].map((tabColor) => `
        <button
          type="button"
          class="special-color-tab special-color-tab--${tabColor}"
          data-action="select-ability-color"
          data-ability-color="${tabColor}"
          aria-selected="${tabColor === normalizedColor}"
        >
          ${tabColor.toUpperCase()}
        </button>
      `).join("")}
    </div>

    <p class="special-ability-guide">
      能力アイコンをタップすると、効果・必要ポイント・解放条件を確認できます。
    </p>

    <section class="special-ability-list special-ability-list--powerpro">
      ${abilities.map((ability) => {
        const state = getAbilityAcquisitionState(
          snapshot,
          playerId,
          ability.abilityKey,
        );
        let statusText = "詳細";
        if (state.replaced) {
          statusText = "置換済";
        } else if (state.alreadyLearned) {
          statusText = "習得済";
        } else if (!state.stagePrerequisiteMet) {
          statusText = "前段階";
        } else if (!state.conditionState.unlocked) {
          statusText = "未解放";
        } else if (!state.affordable) {
          statusText = "PT不足";
        } else {
          statusText = "習得可";
        }

        const visualState =
          state.replaced
            ? "replaced"
            : state.alreadyLearned
              ? "learned"
              : state.learnable
                ? "learnable"
                : !state.conditionState.unlocked ||
                    !state.stagePrerequisiteMet
                  ? "locked"
                  : "insufficient";
        return `
          <button
            type="button"
            class="special-ability-card special-ability-card--tile special-ability-card--${ability.color} is-${visualState}"
            data-ability-state="${visualState}"
            data-action="inspect-special-ability"
            data-player-id="${escapeAttribute(playerId)}"
            data-ability-key="${escapeAttribute(ability.abilityKey)}"
            aria-label="${escapeAttribute(ability.name)}の詳細"
          >
            <span class="special-ability-orb" aria-hidden="true">
              ${escapeHtml(ability.name.slice(0, 1))}
            </span>
            <span class="special-ability-card__id">
              ${escapeHtml(ability.abilityId.toUpperCase())}
              ${ability.color === "blue" ? `-${ability.stage}` : ""}
            </span>
            <strong>${escapeHtml(ability.name)}</strong>
            <em>${escapeHtml(ability.description)}</em>
            <small><i></i>${escapeHtml(statusText)}</small>
          </button>
        `;
      }).join("")}
    </section>
    </div>
  `;
}
