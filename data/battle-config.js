/**
 * MOB BR shared battle configuration and coefficient functions.
 *
 * All battle math must be routed through this module. Screens and tournament
 * flow modules must not duplicate these formulas.
 */

import {
  ROLE_IDS,
  STAT_IDS,
  clamp,
  characterValueToRank,
  normalizeLegacyRank,
  rankToCharacterValue,
  rankToWeaponValue,
} from "./game-data.js";

export const BATTLE_CONFIG_VERSION = "mobbr-battle-config-1.5.0";
export const BATTLE_BALANCE_VERSION = "mobbr-battle-balance-0.2.0";

export const COMBAT_STATES = Object.freeze(["alive", "down", "dead"]);
export const DISTANCE_IDS = Object.freeze(["close", "mid", "far"]);

export const BATTLE_TIMING = Object.freeze({
  durationSeconds: 10,
  tickSeconds: 0.1,
  pauseClockDuringCutIn: true,
  skillCtStartsAtZero: true,
  preserveSkillCtBetweenBattles: true,
  resetSkillCtAtTournamentEnd: true,
});

export const BATTLE_LIMITS = Object.freeze({
  playerStatMin: 1,
  playerStatMax: 73,
  weaponValueMin: 0,
  weaponValueMax: 72,
  hitChanceMin: 0.15,
  hitChanceMax: 0.95,
  criticalChanceMin: 0.03,
  criticalChanceMax: 0.3,
  minimumAttackIntervalSeconds: 0.32,
  maximumAttackIntervalSeconds: 0.9,
  minimumReloadSeconds: 0.65,
  maximumReloadSeconds: 1.45,
  maximumSkillCtReduction: 0.15,
  maximumShieldSupportBonus: 0.1,
});

export const WEAPON_BATTLE_RULES = Object.freeze({
  ammoMax: 12,
  resetAmmoAtBattleStart: true,
  consumeAmmoOnMiss: true,
  autoReloadAtZero: true,
  preserveAmmoBetweenBattles: false,
});

export const STATE_RULES = Object.freeze({
  downHp: 0,
  downCanAct: false,
  pauseCtWhileDown: true,
  downRecoveryHpAfterBattle: 10,
  deadHp: 0,
  deadPersistsBetweenBattles: true,
  reviveFieldBaseHpRate: 0.3,
});

export const DISTANCE_RULES = Object.freeze({
  order: DISTANCE_IDS,
  mustPassThroughMid: true,
  preventCrossingArenaCenter: true,
  updateIntervalSeconds: 0.5,
  damageMultipliers: Object.freeze({
    disadvantaged: 0.9,
    neutral: 1,
    preferred: 1.08,
  }),
});

export const STAT_BATTLE_INFLUENCE = Object.freeze({
  stamina: Object.freeze(["maxHp", "longFightResistance", "lateHpRetention"]),
  mind: Object.freeze(["skillStability", "buffPower", "debuffResistance", "triggerRate"]),
  physical: Object.freeze(["normalDamage", "closeDamage", "knockbackResistance"]),
  aim: Object.freeze(["hitChance", "criticalChance", "farAccuracy"]),
  agility: Object.freeze(["attackInterval", "movement", "skillCt", "rangeChange"]),
  technique: Object.freeze(["hitAssist", "criticalChance", "skillDamage", "rangeAdaptation"]),
  support: Object.freeze(["healing", "revive", "teamBuff", "cover"]),
});

export const CPU_ROLE_STAT_MULTIPLIERS = Object.freeze({
  IGL: Object.freeze({
    stamina: 0.98,
    mind: 1.1,
    physical: 0.9,
    aim: 1,
    agility: 0.96,
    technique: 1.06,
    support: 1.1,
  }),
  ATK: Object.freeze({
    stamina: 1,
    mind: 0.9,
    physical: 1.15,
    aim: 1.15,
    agility: 1.1,
    technique: 1.05,
    support: 0.78,
  }),
  SUP: Object.freeze({
    stamina: 0.98,
    mind: 1.1,
    physical: 0.82,
    aim: 0.9,
    agility: 0.96,
    technique: 1,
    support: 1.2,
  }),
});

export const ROLE_DEFAULT_RANGE = Object.freeze({
  IGL: "mid",
  ATK: "close",
  SUP: "far",
});

export const CPU_ROLE_LOADOUT_DEFAULTS = Object.freeze({
  IGL: Object.freeze({
    weaponName: "IGL共通武器",
    preferredRange: ROLE_DEFAULT_RANGE.IGL,
  }),
  ATK: Object.freeze({
    weaponName: "ATK共通武器",
    preferredRange: ROLE_DEFAULT_RANGE.ATK,
  }),
  SUP: Object.freeze({
    weaponName: "SUP共通武器",
    preferredRange: ROLE_DEFAULT_RANGE.SUP,
  }),
});

export const CPU_FORM_IDS = Object.freeze([
  "slump",
  "normal",
  "hot",
]);

export const SKILL_MASTER = Object.freeze({
  IGL: Object.freeze([
    Object.freeze({
      id: "igl_battle_call",
      name: "熱戦を制するコール",
      description: "味方全体のエイムとマインドを一定時間強化。攻守のテンポを整えるIGLの全体バフ。",
      type: "BUFF",
      target: "all_alive_allies",
      baseCt: 5,
      affectedStats: Object.freeze(["mind", "support"]),
      usesAmmo: false,
    }),
    Object.freeze({
      id: "igl_precise_strike",
      name: "正確無比の一撃",
      description: "回避されない強力な単体攻撃。エイムとテクニックが高いほど威力が安定。",
      type: "ATTACK",
      target: "single_enemy",
      baseCt: 8,
      unavoidable: true,
      affectedStats: Object.freeze(["aim", "technique"]),
      usesAmmo: false,
    }),
    Object.freeze({
      id: "shield_charge",
      name: "シールドチャージ",
      description: "生存者のうちHP割合が最も低い味方1人を回復。全員85%以上なら発動待機。",
      type: "HEAL",
      target: "lowest_hp_alive_ally",
      baseCt: 7,
      waitWhileAllAboveHpRate: 0.85,
      baseHealRate: 0.2,
      affectedStats: Object.freeze(["support", "agility"]),
      usesAmmo: false,
    }),
  ]),
  ATK: Object.freeze([
    Object.freeze({
      id: "atk_smoke_launcher",
      name: "降り注ぐスモークランチャー",
      description: "敵全体へダメージを与え、命中率低下も狙う範囲攻撃。",
      type: "AREA_ATTACK",
      target: "all_enemies",
      baseCt: 7,
      affectedStats: Object.freeze(["aim", "technique", "mind"]),
      usesAmmo: false,
    }),
    Object.freeze({
      id: "atk_ace_mindset",
      name: "エースの心得",
      description: "敵単体へ高威力の一撃。エイム・テクニック・フィジカルを反映。",
      type: "ATTACK",
      target: "single_enemy",
      baseCt: 5.5,
      affectedStats: Object.freeze(["aim", "technique", "physical"]),
      usesAmmo: false,
    }),
    Object.freeze({
      id: "shield_charge",
      name: "シールドチャージ",
      description: "生存者のうちHP割合が最も低い味方1人を回復。全員85%以上なら発動待機。",
      type: "HEAL",
      target: "lowest_hp_alive_ally",
      baseCt: 7.5,
      waitWhileAllAboveHpRate: 0.85,
      baseHealRate: 0.2,
      affectedStats: Object.freeze(["support", "agility"]),
      usesAmmo: false,
    }),
  ]),
  SUP: Object.freeze([
    Object.freeze({
      id: "sup_drone_heal",
      name: "冷静なドローンヒール",
      description: "HPが減った生存味方全員を回復し、チームの戦線を維持。",
      type: "TEAM_HEAL",
      target: "all_alive_allies",
      baseCt: 6.5,
      requiresDamagedAlly: true,
      affectedStats: Object.freeze(["support", "mind"]),
      usesAmmo: false,
    }),
    Object.freeze({
      id: "sup_respawn_field",
      name: "リスポーンフィールド",
      description: "ダウン中の味方全員を最大HP30%で復活。確キル状態は対象外。",
      type: "REVIVE",
      target: "all_down_allies",
      baseCt: 7.2,
      reviveHpRate: 0.3,
      excludesDead: true,
      affectedStats: Object.freeze(["support", "mind"]),
      usesAmmo: false,
    }),
    Object.freeze({
      id: "shield_charge",
      name: "シールドチャージ",
      description: "生存者のうちHP割合が最も低い味方1人を回復。全員85%以上なら発動待機。",
      type: "HEAL",
      target: "lowest_hp_alive_ally",
      baseCt: 6.5,
      waitWhileAllAboveHpRate: 0.85,
      baseHealRate: 0.2,
      affectedStats: Object.freeze(["support", "agility"]),
      usesAmmo: false,
    }),
  ]),
});

export const BATTLE_END_TIE_BREAKERS = Object.freeze([
  "aliveCount",
  "teamHpRate",
  "damageDealt",
  "downsGiven",
  "confirmedKills",
  "battlePower",
  "stableRandom",
]);

function assertRole(role) {
  if (!ROLE_IDS.includes(role)) {
    throw new RangeError(`Role must be one of: ${ROLE_IDS.join(", ")}.`);
  }
  return role;
}

function normalizePlayerStat(value, statId) {
  if (!Number.isFinite(value)) {
    throw new TypeError(`${statId} must be a finite number.`);
  }
  return clamp(
    Math.round(value),
    BATTLE_LIMITS.playerStatMin,
    BATTLE_LIMITS.playerStatMax,
  );
}

function normalizedPlayerStat(value) {
  const clamped = clamp(
    value,
    BATTLE_LIMITS.playerStatMin,
    BATTLE_LIMITS.playerStatMax,
  );
  return (
    (clamped - BATTLE_LIMITS.playerStatMin) /
    (BATTLE_LIMITS.playerStatMax - BATTLE_LIMITS.playerStatMin)
  );
}

function normalizedWeaponValue(value) {
  const clamped = clamp(
    value,
    BATTLE_LIMITS.weaponValueMin,
    BATTLE_LIMITS.weaponValueMax,
  );
  return (
    (clamped - BATTLE_LIMITS.weaponValueMin) /
    (BATTLE_LIMITS.weaponValueMax - BATTLE_LIMITS.weaponValueMin)
  );
}

export function normalizeBattleStats(stats) {
  if (!stats || typeof stats !== "object") {
    throw new TypeError("Battle stats must be an object.");
  }

  return Object.freeze(
    Object.fromEntries(
      STAT_IDS.map((statId) => [
        statId,
        normalizePlayerStat(stats[statId], statId),
      ]),
    ),
  );
}

export function applyBattleStatBonuses(baseStats, ...bonusSources) {
  const normalizedBase = normalizeBattleStats(baseStats);
  const result = { ...normalizedBase };

  for (const source of bonusSources) {
    if (source == null) {
      continue;
    }
    if (typeof source !== "object") {
      throw new TypeError("Stat bonus source must be an object.");
    }

    for (const statId of STAT_IDS) {
      const bonus = source[statId] ?? 0;
      if (!Number.isFinite(bonus)) {
        throw new TypeError(`${statId} bonus must be a finite number.`);
      }
      result[statId] += bonus;
    }
  }

  return normalizeBattleStats(result);
}

export function resolveCpuRankFromRange(
  rankRange,
  roll = 0.5,
) {
  if (!Array.isArray(rankRange) || rankRange.length !== 2) {
    throw new TypeError("CPU rank range must contain two ranks.");
  }
  if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
    throw new RangeError("CPU rank roll must be from 0 inclusive to 1 exclusive.");
  }

  const minimumRank = normalizeLegacyRank(rankRange[0]);
  const maximumRank = normalizeLegacyRank(rankRange[1]);
  const minimumValue = rankToCharacterValue(minimumRank);
  const maximumValue = rankToCharacterValue(maximumRank);
  if (minimumValue > maximumValue) {
    throw new RangeError("CPU rank range is reversed.");
  }

  const span = maximumValue - minimumValue + 1;
  const value = minimumValue + Math.floor(roll * span);
  return characterValueToRank(Math.min(maximumValue, value));
}

export function resolveCpuWeaponProfile(player) {
  if (!player || typeof player !== "object") {
    throw new TypeError("CPU player must be an object.");
  }
  const role = assertRole(player.role);
  const fallback = CPU_ROLE_LOADOUT_DEFAULTS[role];
  const preferredRange =
    player.preferredRange ?? fallback.preferredRange;
  if (!DISTANCE_IDS.includes(preferredRange)) {
    throw new RangeError(`Invalid CPU preferred range: ${preferredRange}`);
  }

  return Object.freeze({
    weaponName:
      typeof player.weaponName === "string" && player.weaponName.trim()
        ? player.weaponName.trim()
        : fallback.weaponName,
    preferredRange,
    source:
      player.weaponSource ??
      (
        player.weaponName && player.preferredRange
          ? "cpu_master"
          : "role_template_fallback"
      ),
  });
}

export function buildCpuBattleStats(characterRank, role) {
  const validRole = assertRole(role);
  const rankValue = rankToCharacterValue(characterRank);
  const multipliers = CPU_ROLE_STAT_MULTIPLIERS[validRole];

  return Object.freeze(
    Object.fromEntries(
      STAT_IDS.map((statId) => [
        statId,
        normalizePlayerStat(rankValue * multipliers[statId], statId),
      ]),
    ),
  );
}

export function resolveWeaponBattleValue(rankOrValue) {
  if (typeof rankOrValue === "string") {
    return rankToWeaponValue(rankOrValue);
  }
  if (
    !Number.isInteger(rankOrValue) ||
    rankOrValue < BATTLE_LIMITS.weaponValueMin ||
    rankOrValue > BATTLE_LIMITS.weaponValueMax
  ) {
    throw new RangeError("Weapon battle value must be an integer from 0 to 72.");
  }
  return rankOrValue;
}

export function calculateMaxHp(stamina, receivedMaxHp = null) {
  if (receivedMaxHp !== null && receivedMaxHp !== undefined) {
    if (!Number.isFinite(receivedMaxHp) || receivedMaxHp <= 0) {
      throw new RangeError("Received max HP must be a positive finite number.");
    }
    return Math.round(receivedMaxHp);
  }

  const validStamina = normalizePlayerStat(stamina, "stamina");
  // Generation 28: longer firefights. Stamina 10 starts at 650 HP,
  // then gains 10 HP for every stamina point.
  const fallbackHp = 550 + validStamina * 10;
  return Math.round(fallbackHp / 10) * 10;
}

export function calculateHitChance({
  actorStats,
  targetStats,
  weaponRangeValue,
  rangeModifier = 0,
  strategyModifier = 0,
  temporaryModifier = 0,
}) {
  const actor = normalizeBattleStats(actorStats);
  const target = normalizeBattleStats(targetStats);
  const weaponValue = resolveWeaponBattleValue(weaponRangeValue);

  for (const [name, value] of Object.entries({
    rangeModifier,
    strategyModifier,
    temporaryModifier,
  })) {
    if (!Number.isFinite(value)) {
      throw new TypeError(`${name} must be a finite number.`);
    }
  }

  const rawChance =
    0.55 +
    normalizedPlayerStat(actor.aim) * 0.22 +
    normalizedPlayerStat(actor.technique) * 0.1 +
    normalizedWeaponValue(weaponValue) * 0.12 -
    normalizedPlayerStat(target.agility) * 0.16 +
    rangeModifier +
    strategyModifier +
    temporaryModifier;

  return clamp(
    rawChance,
    BATTLE_LIMITS.hitChanceMin,
    BATTLE_LIMITS.hitChanceMax,
  );
}

export function calculateCriticalChance(stats, temporaryModifier = 0) {
  const validStats = normalizeBattleStats(stats);
  if (!Number.isFinite(temporaryModifier)) {
    throw new TypeError("Critical temporary modifier must be finite.");
  }

  const rawChance =
    0.03 +
    normalizedPlayerStat(validStats.aim) * 0.08 +
    normalizedPlayerStat(validStats.technique) * 0.12 +
    temporaryModifier;

  return clamp(
    rawChance,
    BATTLE_LIMITS.criticalChanceMin,
    BATTLE_LIMITS.criticalChanceMax,
  );
}

export function calculateBaseDamage({
  stats,
  weaponRangeValue,
  distanceMultiplier = 1,
  strategyMultiplier = 1,
  temporaryMultiplier = 1,
  criticalMultiplier = 1,
}) {
  const validStats = normalizeBattleStats(stats);
  const weaponValue = resolveWeaponBattleValue(weaponRangeValue);

  for (const [name, value] of Object.entries({
    distanceMultiplier,
    strategyMultiplier,
    temporaryMultiplier,
    criticalMultiplier,
  })) {
    if (!Number.isFinite(value) || value < 0) {
      throw new RangeError(`${name} must be a non-negative finite number.`);
    }
  }

  const rawDamage =
    35 +
    normalizedPlayerStat(validStats.physical) * 35 +
    normalizedPlayerStat(validStats.technique) * 10 +
    normalizedWeaponValue(weaponValue) * 30;

  return Math.max(
    1,
    Math.round(
      rawDamage *
        0.84 *
        distanceMultiplier *
        strategyMultiplier *
        temporaryMultiplier *
        criticalMultiplier,
    ),
  );
}

export function calculateAttackInterval(fireRateRankOrValue, agility) {
  const weaponValue = resolveWeaponBattleValue(fireRateRankOrValue);
  const validAgility = normalizePlayerStat(agility, "agility");

  const rawInterval =
    BATTLE_LIMITS.maximumAttackIntervalSeconds -
    normalizedWeaponValue(weaponValue) * 0.55 -
    normalizedPlayerStat(validAgility) * 0.3;

  return clamp(
    rawInterval,
    BATTLE_LIMITS.minimumAttackIntervalSeconds,
    BATTLE_LIMITS.maximumAttackIntervalSeconds,
  );
}

export function calculateReloadTime(reloadRankOrValue) {
  const weaponValue = resolveWeaponBattleValue(reloadRankOrValue);
  const rawReload =
    BATTLE_LIMITS.maximumReloadSeconds -
    normalizedWeaponValue(weaponValue) * 1.4;

  return clamp(
    rawReload,
    BATTLE_LIMITS.minimumReloadSeconds,
    BATTLE_LIMITS.maximumReloadSeconds,
  );
}

export function calculateSkillCt(baseCt, agility, extraReductionRate = 0) {
  if (!Number.isFinite(baseCt) || baseCt <= 0) {
    throw new RangeError("Base CT must be a positive finite number.");
  }
  if (!Number.isFinite(extraReductionRate) || extraReductionRate < 0) {
    throw new RangeError("Extra CT reduction must be non-negative.");
  }

  const validAgility = normalizePlayerStat(agility, "agility");
  const agilityReduction =
    normalizedPlayerStat(validAgility) *
    BATTLE_LIMITS.maximumSkillCtReduction;
  const totalReduction = clamp(
    agilityReduction + extraReductionRate,
    0,
    BATTLE_LIMITS.maximumSkillCtReduction,
  );

  return baseCt * (1 - totalReduction);
}

export function calculateShieldHealRate(support) {
  const validSupport = normalizePlayerStat(support, "support");
  return (
    0.2 +
    normalizedPlayerStat(validSupport) *
      BATTLE_LIMITS.maximumShieldSupportBonus
  );
}

export function calculateReviveHp(maxHp, reviveRate = STATE_RULES.reviveFieldBaseHpRate) {
  if (!Number.isFinite(maxHp) || maxHp <= 0) {
    throw new RangeError("Max HP must be a positive finite number.");
  }
  if (!Number.isFinite(reviveRate) || reviveRate < 0 || reviveRate > 1) {
    throw new RangeError("Revive rate must be from 0 to 1.");
  }
  return Math.max(1, Math.floor(maxHp * reviveRate));
}

export function isAssistEligible(contributedDamage, targetMaxHp) {
  if (!Number.isFinite(contributedDamage) || contributedDamage < 0) {
    throw new RangeError("Contributed damage must be non-negative.");
  }
  if (!Number.isFinite(targetMaxHp) || targetMaxHp <= 0) {
    throw new RangeError("Target max HP must be positive.");
  }
  return contributedDamage >= targetMaxHp * 0.4;
}

export function getRoleCommonSkills(role) {
  const validRole = assertRole(role);
  return SKILL_MASTER[validRole];
}
