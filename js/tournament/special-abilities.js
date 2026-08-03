/**
 * MOB BR special-ability battle integration.
 *
 * All learned abilities are compiled once when a battle participant is created.
 * The compiler recognizes every effect code currently present in
 * data/ability-data.js. Complex event effects are represented by explicit,
 * serializable profile fields and consumed by battle-actions.js.
 */

import {
  STAT_IDS,
  clamp,
} from "../../data/game-data.js?v=43";

export const SPECIAL_ABILITY_RUNTIME_VERSION =
  "mobbr-special-ability-runtime-1.2.0";

export const SUPPORTED_SPECIAL_EFFECT_CODES = Object.freeze([
  "opening_stats",
  "opening_composure",
  "battle_start_all_ct",
  "elapsed_stats",
  "low_hp_stats",
  "low_hp_ct_speed",
  "low_hp_damage_reduction",
  "revive_guard",
  "battle_end_recovery",
  "next_battle_if_injured",
  "range_bonus",
  "after_range_move",
  "after_miss_aim",
  "hit_streak",
  "enemy_low_hp_damage",
  "follow_ally_target",
  "debuff_resist",
  "shield_charge_boost",
  "call_buff",
  "call_duration",
  "battle_start_skill_ct",
  "call_if_ally_low",
  "during_call_stats",
  "mark_target",
  "ally_down_call_ct",
  "opening_team_guard",
  "ally_revived_team_stats",
  "ai_decision",
  "attack_skill_damage",
  "single_skill_damage",
  "area_skill_damage",
  "attack_skill_accuracy",
  "last_enemy_damage",
  "smoke_debuff",
  "high_hp_offense",
  "damage_reduction_pierce",
  "all_heal_points",
  "lowest_hp_heal",
  "skill_heal_points",
  "critical_ally_heal",
  "skill_base_ct",
  "revive_hp_points",
  "revive_guard_other",
  "revive_ai_priority",
  "after_heal_target_stats",
  "heal_debuff_time",
  "tier_max_hp",
  "tier_all_stats",
  "elapsed_offense_defense",
  "lowest_stat_bonus",
  "preferred_range_stats",
  "marked_target_team_damage",
  "tier_during_call_stats",
  "battle_start_team_longest_ct",
  "call_ct_duration",
  "always_stats",
  "on_call_team_longest_ct",
  "tier_attack_skill_damage",
  "tier_attack_skill",
  "tier_stats",
  "attack_skill_accuracy_damage",
  "skill_heal_ct",
  "tier_all_heal_points",
  "tier_revive_guard",
  "revive_hp_self_ct",
  "support_skill_base_ct",
  "tier_hp_stats",
  "world_champion",
  "always_offense_defense",
  "always_hp_all_stats",
  "call_duration_guard",
  "legend_command",
  "shorter_attack_skill_ct",
  "last_enemy_break",
  "legend_gunner",
  "revive_base_hp",
  "drone_heal_revive_guard",
  "legend_support",
]);

const SUPPORTED_CODE_SET =
  new Set(SUPPORTED_SPECIAL_EFFECT_CODES);

export const CPU_UNIQUE_SKILL_FALLBACKS = Object.freeze({
  prison_breaker: Object.freeze({
    skillId: "prison_breaker",
    name: "プリズンブレイカー",
    type: "AREA_DEBUFF",
    target: "enemy_all",
    baseCt: 7,
    source: "centralized_unique_skill_fallback",
    balanceStatus:
      "numeric_effect_not_explicitly_specified",
    accuracyModifier: -0.05,
    agilityPenalty: -1,
    durationSeconds: 2.5,
  }),
});

function deepClone(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function numeric(value, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function mergeStats(target, source, multiplier = 1) {
  for (const statId of STAT_IDS) {
    const amount = numeric(source?.[statId], 0) * multiplier;
    if (amount !== 0) {
      target[statId] = (target[statId] ?? 0) + amount;
    }
  }
  return target;
}

function allStats(amount) {
  return Object.fromEntries(
    STAT_IDS.map((statId) => [statId, amount]),
  );
}


export const SPECIAL_ABILITY_POWER_SCALE = 1.1;

function boostPositiveNumber(
  value,
  {
    integer = false,
    maximum = null,
  } = {},
) {
  if (!Number.isFinite(value) || value <= 0) {
    return value;
  }
  const scaled =
    value * SPECIAL_ABILITY_POWER_SCALE;
  const adjusted =
    integer
      ? Math.max(value + 1, Math.ceil(scaled))
      : scaled;
  return Number.isFinite(maximum)
    ? Math.min(maximum, adjusted)
    : adjusted;
}

function boostStatsObject(stats) {
  for (const statId of STAT_IDS) {
    if (
      Number.isFinite(stats?.[statId]) &&
      stats[statId] > 0
    ) {
      stats[statId] =
        boostPositiveNumber(
          stats[statId],
          { integer: true },
        );
    }
  }
}

function boostSpecialAbilityProfile(profile) {
  boostStatsObject(profile.staticStats);
  boostStatsObject(profile.callBuffStats);
  boostStatsObject(profile.duringCallStats);

  for (const key of [
    "maxHpBonus",
    "allHealPoints",
    "lowestHpHealPoints",
    "reviveHpPoints",
    "attackSkillAccuracyPoints",
  ]) {
    profile[key] =
      boostPositiveNumber(
        profile[key],
        { integer: true },
      );
  }

  for (const key of [
    "permanentDamageRate",
    "permanentDamageReduction",
    "attackSkillDamageRate",
    "singleSkillDamageRate",
    "areaSkillDamageRate",
    "lastEnemyDamageRate",
    "lastEnemyPierceRate",
    "damageReductionPierce",
    "battleEndRecoveryRate",
  ]) {
    profile[key] =
      boostPositiveNumber(
        profile[key],
        { maximum: 0.9 },
      );
  }

  for (const collection of [
    profile.openingEffects,
    profile.dynamicEffects,
    profile.reviveGuard,
    profile.nextBattleIfInjured,
    profile.afterRangeMove,
    profile.afterMissAim,
    profile.hitStreak,
    profile.enemyLowHpDamage,
    profile.followAllyTarget,
    profile.callLowAlly,
    profile.markTarget,
    profile.markedTargetTeamDamage,
    profile.allyDownCallCt,
    profile.allyRevivedTeamStats,
    profile.highHpOffense,
    profile.criticalAllyHeal,
    profile.afterHealTargetStats,
  ]) {
    for (const entry of collection ?? []) {
      boostStatsObject(entry.stats);
      boostStatsObject(entry.teamStats);
      boostStatsObject(entry.selfStats);
      for (const key of [
        "rate",
        "damageRate",
        "damageReduction",
        "teamDamageRate",
        "teamDamageReduction",
        "pierceRate",
      ]) {
        if (
          Number.isFinite(entry[key]) &&
          entry[key] > 0
        ) {
          entry[key] =
            boostPositiveNumber(
              entry[key],
              { maximum: 0.9 },
            );
        }
      }
      for (const key of [
        "points",
        "aim",
        "successPoints",
      ]) {
        if (
          Number.isFinite(entry[key]) &&
          entry[key] > 0
        ) {
          entry[key] =
            boostPositiveNumber(
              entry[key],
              { integer: true },
            );
        }
      }
    }
  }

  for (const map of [
    profile.skillHealPoints,
    profile.battleStartSkillCt,
    profile.skillBaseCtReduction,
  ]) {
    for (const key of Object.keys(map ?? {})) {
      map[key] =
        boostPositiveNumber(map[key]);
    }
  }

  return profile;
}

export function normalizeTournamentTier(tournamentType) {
  const value = String(tournamentType ?? "").toLowerCase();
  if (value === "local" || value === "casual_denden") return "local";
  if (value.startsWith("national") || value === "casual_mobutetsu") return "national";
  if (value.startsWith("world")) return "world";
  if (value === "championship") return "championship";
  return value;
}

function tierApplies(effect, tier) {
  return !effect.tier || effect.tier === tier;
}

function createEmptyProfile() {
  return {
    version: SPECIAL_ABILITY_RUNTIME_VERSION,
    abilityKeys: [],
    supportedAbilityKeys: [],
    unsupportedAbilityKeys: [],
    supportedEffectCodes: [],
    staticStats: {},
    maxHpBonus: 0,
    openingEffects: [],
    dynamicEffects: [],
    permanentDamageRate: 0,
    permanentDamageReduction: 0,
    battleStartAllCt: 0,
    battleStartSkillCt: {},
    skillBaseCtReduction: {},
    allSkillCtReduction: 0,
    shorterAttackSkillCtReduction: 0,
    callBuffStats: {},
    callDurationBonus: 0,
    callDamageReduction: 0,
    callLongestCtReduction: 0,
    teamLongestCtAtStart: 0,
    callLowAlly: [],
    duringCallStats: {},
    attackSkillDamageRate: 0,
    singleSkillDamageRate: 0,
    areaSkillDamageRate: 0,
    attackSkillAccuracyPoints: 0,
    smokeSuccessPoints: 0,
    smokeDurationBonus: 0,
    lastEnemyDamageRate: 0,
    lastEnemyPierceRate: 0,
    highHpOffense: [],
    enemyLowHpDamage: [],
    followAllyTarget: [],
    damageReductionPierce: 0,
    allHealPoints: 0,
    skillHealPoints: {},
    lowestHpHealPoints: 0,
    criticalAllyHeal: [],
    reviveRateOverride: null,
    reviveHpPoints: 0,
    reviveSelfLongestCtReduction: 0,
    reviveGuard: [],
    afterHealTargetStats: [],
    healDebuffSeconds: 0,
    debuffDurationReduction: 0,
    debuffValueReduction: 0,
    afterRangeMove: [],
    afterMissAim: [],
    hitStreak: [],
    markTarget: [],
    markedTargetTeamDamage: [],
    allyDownCallCt: [],
    allyRevivedTeamStats: [],
    aiDecision: {
      reactionReduction: 0,
      lowHpTargetPriority: 0,
      revivePriority: false,
    },
    battleEndRecoveryRate: 0,
    nextBattleIfInjured: [],
    eventsTriggered: {},
  };
}

export function compileSpecialAbilityProfile(
  member,
  {
    tournamentType,
    preferredRange,
  } = {},
) {
  const tier = normalizeTournamentTier(tournamentType);
  const profile = createEmptyProfile();
  const abilities = Array.isArray(member?.specialAbilities)
    ? member.specialAbilities
    : [];

  for (const ability of abilities) {
    const abilityKey =
      ability.abilityKey ??
      `${ability.color ?? "unknown"}:${ability.abilityId ?? "unknown"}`;
    const effect =
      ability.effectValue ??
      ability.effect ??
      {};
    const code =
      effect.code ??
      ability.effectType ??
      "unknown";

    profile.abilityKeys.push(abilityKey);
    if (!SUPPORTED_CODE_SET.has(code)) {
      profile.unsupportedAbilityKeys.push(abilityKey);
      continue;
    }
    profile.supportedAbilityKeys.push(abilityKey);
    if (!profile.supportedEffectCodes.includes(code)) {
      profile.supportedEffectCodes.push(code);
    }

    switch (code) {
      case "opening_stats":
      case "opening_composure":
        profile.openingEffects.push({
          code,
          duration: numeric(effect.duration, 3),
          stats: deepClone(effect.stats ?? {}),
          debuffDurationReduction:
            numeric(effect.debuffDurationReduction, 0),
        });
        profile.debuffDurationReduction +=
          numeric(effect.debuffDurationReduction, 0);
        break;
      case "battle_start_all_ct":
        profile.battleStartAllCt +=
          numeric(effect.seconds, 0);
        break;
      case "elapsed_stats":
        profile.dynamicEffects.push({
          code,
          after: numeric(effect.after, 10),
          stats: deepClone(effect.stats ?? {}),
        });
        break;
      case "elapsed_offense_defense":
        profile.dynamicEffects.push({
          code,
          after: numeric(effect.after, 10),
          damageRate: numeric(effect.damageRate, 0),
          damageReduction:
            numeric(effect.damageReduction, 0),
        });
        break;
      case "low_hp_stats":
      case "low_hp_ct_speed":
        profile.dynamicEffects.push({
          code,
          hpRate: numeric(effect.hpRate, 0.35),
          stats: deepClone(effect.stats ?? {}),
          ctSpeed: numeric(effect.ctSpeed, 0),
        });
        break;
      case "low_hp_damage_reduction":
        profile.dynamicEffects.push({
          code,
          hpRate: numeric(effect.hpRate, 0.3),
          damageReduction: numeric(effect.rate, 0),
        });
        break;
      case "revive_guard":
      case "revive_guard_other":
      case "tier_revive_guard":
        if (tierApplies(effect, tier)) {
          profile.reviveGuard.push({
            duration: numeric(effect.duration, 3),
            rate: numeric(effect.rate, 0),
            otherOnly: code === "revive_guard_other",
          });
        }
        break;
      case "battle_end_recovery":
        profile.battleEndRecoveryRate +=
          numeric(effect.healRate, 0);
        break;
      case "next_battle_if_injured":
        profile.nextBattleIfInjured.push({
          threshold: numeric(effect.threshold, 0.5),
          duration: numeric(effect.duration, 4),
          stats: deepClone(effect.stats ?? {}),
        });
        break;
      case "range_bonus":
        profile.dynamicEffects.push({
          code,
          range: effect.range,
          stats: deepClone(effect.stats ?? {}),
        });
        break;
      case "preferred_range_stats":
        profile.dynamicEffects.push({
          code,
          range: preferredRange,
          stats: deepClone(effect.stats ?? {}),
        });
        break;
      case "after_range_move":
        profile.afterRangeMove.push({
          duration: numeric(effect.duration, 2),
          stats: deepClone(effect.stats ?? {}),
        });
        break;
      case "after_miss_aim":
        profile.afterMissAim.push({
          aim: numeric(effect.aim, 0),
          appliesTo: effect.appliesTo ?? "normal",
        });
        break;
      case "hit_streak":
        profile.hitStreak.push({
          hits: Math.max(1, Math.floor(numeric(effect.hits, 3))),
          duration: numeric(effect.duration, 3),
          stats: deepClone(effect.stats ?? {}),
        });
        break;
      case "enemy_low_hp_damage":
        profile.enemyLowHpDamage.push(
          ...(effect.thresholds ?? []).map((threshold) => ({
            hpRate: numeric(threshold.hpRate, 0),
            rate: numeric(threshold.rate, 0),
          })),
        );
        break;
      case "follow_ally_target":
        profile.followAllyTarget.push({
          window: numeric(effect.window, 2),
          damageRate: numeric(effect.damageRate, 0),
          targetPriority: numeric(effect.targetPriority, 0),
        });
        break;
      case "debuff_resist":
        profile.debuffDurationReduction +=
          numeric(effect.durationReduction, 0);
        profile.debuffValueReduction +=
          numeric(effect.valueReduction, 0);
        break;
      case "shield_charge_boost":
        profile.skillHealPoints.shield_charge =
          (profile.skillHealPoints.shield_charge ?? 0) +
          numeric(effect.healPoint, 0);
        profile.skillBaseCtReduction.shield_charge =
          (profile.skillBaseCtReduction.shield_charge ?? 0) +
          numeric(effect.baseCtReduction, 0);
        break;
      case "call_buff":
        mergeStats(profile.callBuffStats, effect.stats);
        break;
      case "call_duration":
        profile.callDurationBonus += numeric(effect.seconds, 0);
        break;
      case "battle_start_skill_ct":
        profile.battleStartSkillCt[effect.skillId] =
          (profile.battleStartSkillCt[effect.skillId] ?? 0) +
          numeric(effect.seconds, 0);
        break;
      case "call_if_ally_low":
        profile.callLowAlly.push({
          hpRate: numeric(effect.hpRate, 0.4),
          stats: deepClone(effect.stats ?? {}),
          damageReduction:
            numeric(effect.damageReduction, 0),
        });
        break;
      case "during_call_stats":
        mergeStats(profile.duringCallStats, effect.stats);
        break;
      case "tier_during_call_stats":
        if (tierApplies(effect, tier)) {
          mergeStats(profile.duringCallStats, effect.stats);
        }
        break;
      case "mark_target":
        profile.markTarget.push({
          duration: numeric(effect.duration, 3),
          targetPriority: numeric(effect.targetPriority, 0),
          teamDamageRate: numeric(effect.teamDamageRate, 0),
        });
        break;
      case "marked_target_team_damage":
        profile.markedTargetTeamDamage.push({
          duration: numeric(effect.duration, 3),
          rate: numeric(effect.rate, 0),
        });
        break;
      case "ally_down_call_ct":
        profile.allyDownCallCt.push({
          seconds: numeric(effect.seconds, 0),
          limitPerBattle:
            Math.max(1, Math.floor(numeric(effect.limitPerBattle, 1))),
          selfStats: deepClone(effect.selfStats ?? {}),
          duration: numeric(effect.duration, 3),
        });
        break;
      case "opening_team_guard":
        profile.openingEffects.push({
          code,
          duration: numeric(effect.duration, 3),
          teamDamageReduction: numeric(effect.rate, 0),
        });
        break;
      case "ally_revived_team_stats":
        profile.allyRevivedTeamStats.push({
          duration: numeric(effect.duration, 3),
          stats: deepClone(effect.stats ?? {}),
        });
        break;
      case "ai_decision":
        profile.aiDecision.reactionReduction +=
          numeric(effect.reactionReduction, 0);
        profile.aiDecision.lowHpTargetPriority +=
          numeric(effect.lowHpTargetPriority, 0);
        break;
      case "revive_ai_priority":
        profile.aiDecision.revivePriority = true;
        profile.aiDecision.reactionReduction +=
          numeric(effect.reactionReduction, 0);
        break;
      case "attack_skill_damage":
        profile.attackSkillDamageRate += numeric(effect.rate, 0);
        break;
      case "single_skill_damage":
        profile.singleSkillDamageRate += numeric(effect.rate, 0);
        break;
      case "area_skill_damage":
        profile.areaSkillDamageRate += numeric(effect.rate, 0);
        break;
      case "attack_skill_accuracy":
        profile.attackSkillAccuracyPoints +=
          numeric(effect.points, 0);
        break;
      case "last_enemy_damage":
        profile.lastEnemyDamageRate += numeric(effect.rate, 0);
        break;
      case "smoke_debuff":
        profile.smokeSuccessPoints +=
          numeric(effect.successPoints, 0);
        profile.smokeDurationBonus +=
          numeric(effect.duration, 0);
        break;
      case "high_hp_offense":
        profile.highHpOffense.push({
          hpRate: numeric(effect.hpRate, 0.7),
          damageRate: numeric(effect.damageRate, 0),
        });
        break;
      case "damage_reduction_pierce":
        profile.damageReductionPierce += numeric(effect.rate, 0);
        break;
      case "all_heal_points":
        profile.allHealPoints += numeric(effect.points, 0);
        break;
      case "lowest_hp_heal":
        profile.lowestHpHealPoints += numeric(effect.points, 0);
        break;
      case "skill_heal_points":
        profile.skillHealPoints[effect.skillId] =
          (profile.skillHealPoints[effect.skillId] ?? 0) +
          numeric(effect.points, 0);
        break;
      case "critical_ally_heal":
        profile.criticalAllyHeal.push({
          hpRate: numeric(effect.hpRate, 0.3),
          points: numeric(effect.points, 0),
        });
        break;
      case "skill_base_ct":
        profile.skillBaseCtReduction[effect.skillId] =
          (profile.skillBaseCtReduction[effect.skillId] ?? 0) +
          numeric(effect.seconds, 0);
        break;
      case "revive_hp_points":
        profile.reviveHpPoints += numeric(effect.points, 0);
        break;
      case "after_heal_target_stats":
        profile.afterHealTargetStats.push({
          duration: numeric(effect.duration, 2),
          stats: deepClone(effect.stats ?? {}),
        });
        break;
      case "heal_debuff_time":
        profile.healDebuffSeconds += numeric(effect.seconds, 0);
        break;
      case "tier_max_hp":
        if (tierApplies(effect, tier)) {
          profile.maxHpBonus += numeric(effect.amount, 0);
        }
        break;
      case "tier_all_stats":
        if (tierApplies(effect, tier)) {
          mergeStats(profile.staticStats, allStats(numeric(effect.amount, 0)));
        }
        break;
      case "lowest_stat_bonus": {
        const stats = member.stats ?? member.battleStats ?? {};
        const minimum = Math.min(
          ...STAT_IDS.map((statId) => numeric(stats[statId], 1)),
        );
        const candidates = STAT_IDS.filter(
          (statId) => numeric(stats[statId], 1) === minimum,
        );
        const rolePreferred =
          member.role === "IGL"
            ? ["mind", "support", "technique", "aim"]
            : member.role === "ATK"
              ? ["physical", "aim", "technique", "agility"]
              : ["support", "mind", "stamina", "technique"];
        const selected =
          rolePreferred.find((statId) => candidates.includes(statId)) ??
          candidates[0];
        if (selected) {
          profile.staticStats[selected] =
            (profile.staticStats[selected] ?? 0) +
            numeric(effect.amount, 0);
        }
        break;
      }
      case "battle_start_team_longest_ct":
        profile.teamLongestCtAtStart += numeric(effect.seconds, 0);
        break;
      case "call_ct_duration":
        profile.skillBaseCtReduction.igl_battle_call =
          (profile.skillBaseCtReduction.igl_battle_call ?? 0) +
          numeric(effect.baseCtReduction, 0);
        profile.callDurationBonus += numeric(effect.duration, 0);
        break;
      case "always_stats":
        mergeStats(profile.staticStats, effect.stats);
        break;
      case "on_call_team_longest_ct":
        profile.callLongestCtReduction += numeric(effect.seconds, 0);
        break;
      case "tier_attack_skill_damage":
        if (tierApplies(effect, tier)) {
          profile.attackSkillDamageRate += numeric(effect.rate, 0);
        }
        break;
      case "tier_attack_skill":
        if (tierApplies(effect, tier)) {
          profile.attackSkillDamageRate += numeric(effect.damageRate, 0);
          profile.attackSkillAccuracyPoints += numeric(effect.accuracyPoints, 0);
        }
        break;
      case "tier_stats":
        if (tierApplies(effect, tier)) {
          mergeStats(profile.staticStats, effect.stats);
        }
        break;
      case "attack_skill_accuracy_damage":
        profile.attackSkillAccuracyPoints += numeric(effect.accuracyPoints, 0);
        profile.attackSkillDamageRate += numeric(effect.damageRate, 0);
        break;
      case "skill_heal_ct":
        profile.skillBaseCtReduction[effect.skillId] =
          (profile.skillBaseCtReduction[effect.skillId] ?? 0) +
          numeric(effect.baseCtReduction, 0);
        profile.skillHealPoints[effect.skillId] =
          (profile.skillHealPoints[effect.skillId] ?? 0) +
          numeric(effect.healPoints, 0);
        break;
      case "tier_all_heal_points":
        if (tierApplies(effect, tier)) {
          profile.allHealPoints += numeric(effect.points, 0);
        }
        break;
      case "revive_hp_self_ct":
        profile.reviveHpPoints += numeric(effect.points, 0);
        profile.reviveSelfLongestCtReduction +=
          numeric(effect.longestCtReduction, 0);
        break;
      case "support_skill_base_ct":
        profile.skillBaseCtReduction.sup_drone_heal =
          (profile.skillBaseCtReduction.sup_drone_heal ?? 0) +
          numeric(effect.seconds, 0);
        profile.skillBaseCtReduction.sup_respawn_field =
          (profile.skillBaseCtReduction.sup_respawn_field ?? 0) +
          numeric(effect.seconds, 0);
        profile.skillBaseCtReduction.shield_charge =
          (profile.skillBaseCtReduction.shield_charge ?? 0) +
          numeric(effect.seconds, 0);
        break;
      case "tier_hp_stats":
        if (tierApplies(effect, tier)) {
          profile.maxHpBonus += numeric(effect.maxHp, 0);
          mergeStats(profile.staticStats, effect.stats);
        }
        break;
      case "world_champion":
        if (tier === "world") {
          profile.maxHpBonus += numeric(effect.maxHp, 0);
          profile.openingEffects.push({
            code,
            duration: numeric(effect.openingDuration, 5),
            stats: deepClone(effect.openingStats ?? {}),
          });
        }
        break;
      case "always_offense_defense":
        profile.permanentDamageRate += numeric(effect.damageRate, 0);
        profile.permanentDamageReduction +=
          numeric(effect.damageReduction, 0);
        break;
      case "always_hp_all_stats":
        profile.maxHpBonus += numeric(effect.maxHp, 0);
        mergeStats(profile.staticStats, allStats(numeric(effect.allStats, 0)));
        break;
      case "call_duration_guard":
        profile.callDurationBonus += numeric(effect.duration, 0);
        profile.callDamageReduction +=
          numeric(effect.damageReduction, 0);
        break;
      case "legend_command":
        profile.battleStartAllCt +=
          numeric(effect.allSkillCtReduction, 0);
        profile.openingEffects.push({
          code,
          duration: numeric(effect.duration, 4),
          teamStats: deepClone(effect.teamStats ?? {}),
        });
        break;
      case "shorter_attack_skill_ct":
        profile.shorterAttackSkillCtReduction += numeric(effect.seconds, 0);
        break;
      case "last_enemy_break":
        profile.lastEnemyDamageRate += numeric(effect.damageRate, 0);
        profile.lastEnemyPierceRate += numeric(effect.pierceRate, 0);
        break;
      case "legend_gunner":
        profile.attackSkillDamageRate += numeric(effect.damageRate, 0);
        profile.damageReductionPierce += numeric(effect.pierceRate, 0);
        break;
      case "revive_base_hp":
        profile.reviveRateOverride = Math.max(
          profile.reviveRateOverride ?? 0,
          numeric(effect.rate, 0),
        );
        break;
      case "drone_heal_revive_guard":
        profile.skillHealPoints.sup_drone_heal =
          (profile.skillHealPoints.sup_drone_heal ?? 0) +
          numeric(effect.healPoints, 0);
        profile.reviveGuard.push({
          duration: numeric(effect.duration, 4),
          rate: numeric(effect.rate, 0),
          otherOnly: false,
        });
        break;
      case "legend_support":
        profile.reviveRateOverride = Math.max(
          profile.reviveRateOverride ?? 0,
          numeric(effect.reviveRate, 0),
        );
        profile.skillBaseCtReduction.sup_drone_heal =
          (profile.skillBaseCtReduction.sup_drone_heal ?? 0) +
          numeric(effect.supportSkillCtReduction, 0);
        profile.skillBaseCtReduction.sup_respawn_field =
          (profile.skillBaseCtReduction.sup_respawn_field ?? 0) +
          numeric(effect.supportSkillCtReduction, 0);
        profile.skillBaseCtReduction.shield_charge =
          (profile.skillBaseCtReduction.shield_charge ?? 0) +
          numeric(effect.supportSkillCtReduction, 0);
        break;
      default:
        profile.unsupportedAbilityKeys.push(abilityKey);
        profile.supportedAbilityKeys =
          profile.supportedAbilityKeys.filter((key) => key !== abilityKey);
        break;
    }
  }

  profile.abilityKeys.sort();
  profile.supportedAbilityKeys.sort();
  profile.unsupportedAbilityKeys.sort();
  profile.supportedEffectCodes.sort();
  return boostSpecialAbilityProfile(profile);
}

export function normalizeUniqueSkill(skill) {
  if (
    skill?.skillId &&
    CPU_UNIQUE_SKILL_FALLBACKS[skill.skillId]
  ) {
    return {
      ...deepClone(CPU_UNIQUE_SKILL_FALLBACKS[skill.skillId]),
      source:
        skill.source ??
        CPU_UNIQUE_SKILL_FALLBACKS[skill.skillId].source,
    };
  }
  return deepClone(skill);
}

export function applySpecialProfileAtBattleStart(
  participant,
  profile,
  {
    addEffect,
    teamParticipants = [],
  } = {},
) {
  participant.specialProfile = deepClone(profile);
  participant.unappliedSpecialAbilityKeys =
    deepClone(profile.unsupportedAbilityKeys);
  participant.battleStats = {
    ...participant.battleStats,
    ...Object.fromEntries(
      STAT_IDS.map((statId) => [
        statId,
        clamp(
          numeric(participant.battleStats[statId], 1) +
            numeric(profile.staticStats[statId], 0),
          1,
          99,
        ),
      ]),
    ),
  };

  if (profile.maxHpBonus !== 0) {
    participant.maxHp += profile.maxHpBonus;
    participant.hp = Math.min(
      participant.maxHp,
      participant.hp + profile.maxHpBonus,
    );
  }

  const attackSkills = participant.skills
    .filter((skill) =>
      ["ATTACK", "AREA_ATTACK", "AREA_DEBUFF"].includes(skill.type),
    )
    .sort((left, right) => left.baseCt - right.baseCt);
  if (attackSkills[0] && profile.shorterAttackSkillCtReduction > 0) {
    attackSkills[0].baseCt = Math.max(
      0.1,
      attackSkills[0].baseCt -
        profile.shorterAttackSkillCtReduction,
    );
  }

  for (const skill of participant.skills) {
    const reduction =
      numeric(profile.allSkillCtReduction, 0) +
      numeric(profile.skillBaseCtReduction[skill.skillId], 0);
    if (Number.isFinite(skill.baseCt)) {
      skill.baseCt = Math.max(0.1, skill.baseCt - reduction);
    }
    participant.skillCharge[skill.skillId] =
      numeric(participant.skillCharge[skill.skillId], 0) +
      numeric(profile.battleStartAllCt, 0) +
      numeric(profile.battleStartSkillCt[skill.skillId], 0);
  }

  if (typeof addEffect === "function") {
    for (const opening of profile.openingEffects) {
      const targets =
        opening.teamStats || opening.teamDamageReduction
          ? teamParticipants
          : [participant];
      for (const target of targets) {
        addEffect(target, {
          code: `special_${opening.code}_${participant.playerId}`,
          sourcePlayerId: participant.playerId,
          remainingSeconds: opening.duration,
          stats: deepClone(
            opening.teamStats ??
            opening.stats ??
            {},
          ),
          damageReduction:
            numeric(opening.teamDamageReduction, 0),
        });
      }
    }
  }
  return participant;
}

export function refreshSpecialDynamicEffects(
  battle,
  participant,
  addEffect,
) {
  const profile = participant.specialProfile;
  if (!profile || typeof addEffect !== "function") {
    return;
  }
  for (const effect of profile.dynamicEffects) {
    let active = false;
    if (
      effect.code === "elapsed_stats" ||
      effect.code === "elapsed_offense_defense"
    ) {
      active = battle.elapsedSeconds >= effect.after;
    } else if (
      effect.code === "low_hp_stats" ||
      effect.code === "low_hp_ct_speed" ||
      effect.code === "low_hp_damage_reduction"
    ) {
      active =
        participant.maxHp > 0 &&
        participant.hp / participant.maxHp <= effect.hpRate;
    } else if (
      effect.code === "range_bonus" ||
      effect.code === "preferred_range_stats"
    ) {
      active =
        participant.currentDistance === effect.range;
    }
    if (!active) continue;
    addEffect(participant, {
      code: `special_dynamic_${effect.code}`,
      sourcePlayerId: participant.playerId,
      remainingSeconds: 0.25,
      stats: deepClone(effect.stats ?? {}),
      damageMultiplier:
        1 + numeric(effect.damageRate, 0),
      damageReduction:
        numeric(effect.damageReduction, 0),
      ctSpeed: numeric(effect.ctSpeed, 0),
    });
  }
}

export function getSpecialAttackModifiers(
  battle,
  actor,
  target,
  {
    skillId = null,
    area = false,
    normal = false,
  } = {},
) {
  const profile = actor.specialProfile ?? createEmptyProfile();
  let damageRate = profile.permanentDamageRate;
  let accuracyPoints = 0;
  let pierceRate = profile.damageReductionPierce;

  if (skillId) {
    damageRate += profile.attackSkillDamageRate;
    damageRate += area
      ? profile.areaSkillDamageRate
      : profile.singleSkillDamageRate;
    accuracyPoints += profile.attackSkillAccuracyPoints;
  }

  if (
    actor.maxHp > 0 &&
    profile.highHpOffense.some(
      (entry) =>
        actor.hp / actor.maxHp >= entry.hpRate,
    )
  ) {
    damageRate += Math.max(
      ...profile.highHpOffense
        .filter((entry) =>
          actor.hp / actor.maxHp >= entry.hpRate,
        )
        .map((entry) => entry.damageRate),
    );
  }

  if (target?.maxHp > 0) {
    const targetRate = target.hp / target.maxHp;
    const thresholdRates =
      profile.enemyLowHpDamage
        .filter((entry) => targetRate <= entry.hpRate)
        .map((entry) => entry.rate);
    if (thresholdRates.length > 0) {
      damageRate += Math.max(...thresholdRates);
    }
  }

  const enemyTeamId =
    actor.teamId === battle.leftTeamId
      ? battle.rightTeamId
      : battle.leftTeamId;
  const aliveEnemies = Object.values(battle.participants).filter(
    (participant) =>
      participant.teamId === enemyTeamId &&
      participant.combatState === "alive",
  );
  if (aliveEnemies.length === 1) {
    damageRate += profile.lastEnemyDamageRate;
    pierceRate += profile.lastEnemyPierceRate;
  }

  const memory =
    battle.teamTargetMemory?.[actor.teamId];
  if (
    memory &&
    memory.targetPlayerId === target?.playerId &&
    memory.actorPlayerId !== actor.playerId
  ) {
    const elapsed = battle.elapsedSeconds - memory.time;
    const applicable = profile.followAllyTarget.filter(
      (entry) => elapsed >= 0 && elapsed <= entry.window,
    );
    if (applicable.length > 0) {
      damageRate += Math.max(
        ...applicable.map((entry) => entry.damageRate),
      );
    }
  }

  const marked =
    battle.markedTargets?.[target?.playerId];
  if (
    marked &&
    marked.teamId === actor.teamId &&
    marked.expiresAt >= battle.elapsedSeconds
  ) {
    damageRate += marked.damageRate;
  }

  if (
    normal &&
    actor.specialTransient?.nextNormalAim
  ) {
    accuracyPoints += actor.specialTransient.nextNormalAim;
  }

  return {
    damageMultiplier: 1 + Math.max(-0.9, damageRate),
    accuracyModifier: accuracyPoints / 100,
    pierceRate: clamp(pierceRate, 0, 0.9),
  };
}

export function recordSpecialAttackOutcome(
  battle,
  actor,
  target,
  {
    hit,
    normal = false,
    skillId = null,
  } = {},
) {
  const profile = actor.specialProfile;
  if (!profile) return;

  actor.specialTransient ??= {
    hitStreak: 0,
    nextNormalAim: 0,
  };
  if (hit) {
    actor.specialTransient.hitStreak += 1;
    if (normal) {
      actor.specialTransient.nextNormalAim = 0;
    }
    for (const streak of profile.hitStreak) {
      if (
        actor.specialTransient.hitStreak > 0 &&
        actor.specialTransient.hitStreak % streak.hits === 0
      ) {
        actor.effects.push({
          effectId:
            `${actor.playerId}-special-hit-streak-${battle.tickCount}`,
          code: "special_hit_streak",
          sourcePlayerId: actor.playerId,
          remainingSeconds: streak.duration,
          stats: deepClone(streak.stats),
          accuracyModifier: 0,
          damageReduction: 0,
          damageMultiplier: 1,
        });
      }
    }
  } else {
    actor.specialTransient.hitStreak = 0;
    if (normal && profile.afterMissAim.length > 0) {
      actor.specialTransient.nextNormalAim = Math.max(
        ...profile.afterMissAim.map((entry) => entry.aim),
      );
    }
  }

  battle.teamTargetMemory ??= {};
  if (target) {
    battle.teamTargetMemory[actor.teamId] = {
      actorPlayerId: actor.playerId,
      targetPlayerId: target.playerId,
      time: battle.elapsedSeconds,
      skillId,
    };

    if (hit && skillId === "igl_precise_strike") {
      const markDurations = profile.markTarget.map(
        (entry) => entry.duration,
      );
      const teamDurations =
        profile.markedTargetTeamDamage.map(
          (entry) => entry.duration,
        );
      const damageRates = [
        ...profile.markedTargetTeamDamage.map(
          (entry) => entry.rate,
        ),
        ...profile.markTarget.map(
          (entry) => entry.teamDamageRate ?? 0,
        ),
      ];
      const duration = Math.max(
        0,
        ...markDurations,
        ...teamDurations,
      );
      if (duration > 0) {
        battle.markedTargets ??= {};
        battle.markedTargets[target.playerId] = {
          teamId: actor.teamId,
          actorPlayerId: actor.playerId,
          expiresAt: battle.elapsedSeconds + duration,
          damageRate: damageRates.length > 0
            ? Math.max(...damageRates)
            : 0,
          targetPriority: profile.markTarget.length > 0
            ? Math.max(
                ...profile.markTarget.map(
                  (entry) => entry.targetPriority,
                ),
              )
            : 0,
        };
      }
    }
  }
}

export function getSpecialSkillModifiers(
  actor,
  skillId,
) {
  const profile = actor.specialProfile ?? createEmptyProfile();
  return {
    callBuffStats: deepClone(profile.callBuffStats),
    callDurationBonus: profile.callDurationBonus,
    callDamageReduction: profile.callDamageReduction,
    callLongestCtReduction: profile.callLongestCtReduction,
    healPoints:
      profile.allHealPoints +
      numeric(profile.skillHealPoints[skillId], 0),
    lowestHpHealPoints:
      profile.lowestHpHealPoints,
    criticalAllyHeal:
      deepClone(profile.criticalAllyHeal),
    reviveRateOverride:
      profile.reviveRateOverride,
    reviveHpPoints:
      profile.reviveHpPoints,
    smokeSuccessPoints:
      profile.smokeSuccessPoints,
    smokeDurationBonus:
      profile.smokeDurationBonus,
  };
}

export function getSpecialDamageTakenMultiplier(
  target,
  {
    attackerPierceRate = 0,
  } = {},
) {
  const profile = target.specialProfile ?? createEmptyProfile();
  const reduction = clamp(
    profile.permanentDamageReduction -
      attackerPierceRate,
    0,
    0.9,
  );
  return 1 - reduction;
}

export function adjustDebuffForSpecialAbility(
  target,
  {
    duration,
    accuracyModifier,
  },
) {
  const profile = target.specialProfile ?? createEmptyProfile();
  return {
    duration:
      duration *
      (1 - clamp(profile.debuffDurationReduction, 0, 0.9)),
    accuracyModifier:
      accuracyModifier *
      (1 - clamp(profile.debuffValueReduction, 0, 0.9)),
  };
}

export function applySpecialAfterRangeMove(
  participant,
  addEffect,
) {
  const profile = participant.specialProfile;
  if (!profile || typeof addEffect !== "function") return;
  for (const entry of profile.afterRangeMove) {
    addEffect(participant, {
      code: "special_after_range_move",
      sourcePlayerId: participant.playerId,
      remainingSeconds: entry.duration,
      stats: deepClone(entry.stats),
    });
  }
}

export function applySpecialAfterHeal(
  actor,
  target,
  addEffect,
) {
  const profile = actor.specialProfile;
  if (!profile) return;
  if (typeof addEffect === "function") {
    for (const entry of profile.afterHealTargetStats) {
      addEffect(target, {
        code: "special_after_heal",
        sourcePlayerId: actor.playerId,
        remainingSeconds: entry.duration,
        stats: deepClone(entry.stats),
      });
    }
  }
  if (profile.healDebuffSeconds > 0) {
    for (const effect of target.effects) {
      if (
        (effect.accuracyModifier ?? 0) < 0 ||
        (effect.damageMultiplier ?? 1) < 1
      ) {
        effect.remainingSeconds = Math.max(
          0,
          effect.remainingSeconds -
            profile.healDebuffSeconds,
        );
      }
    }
  }
}

export function applySpecialAfterRevive(
  battle,
  actor,
  target,
  addEffect,
) {
  const actorProfile = actor.specialProfile ?? createEmptyProfile();
  const targetProfile = target.specialProfile ?? createEmptyProfile();
  if (actorProfile.reviveSelfLongestCtReduction > 0) {
    const longest = [...actor.skills]
      .sort((left, right) =>
        numeric(right.baseCt, 0) - numeric(left.baseCt, 0),
      )[0];
    if (longest) {
      actor.skillCharge[longest.skillId] =
        numeric(actor.skillCharge[longest.skillId], 0) +
        actorProfile.reviveSelfLongestCtReduction;
    }
  }
  const guards = [
    ...actorProfile.reviveGuard,
    ...targetProfile.reviveGuard.filter((guard) => !guard.otherOnly),
  ];
  for (const guard of guards) {
    addEffect(target, {
      code: "special_revive_guard",
      sourcePlayerId: actor.playerId,
      remainingSeconds: guard.duration,
      damageReduction: guard.rate,
    });
  }
  const team = Object.values(battle.participants).filter(
    (participant) =>
      participant.teamId === actor.teamId &&
      participant.combatState === "alive",
  );
  for (const entry of actorProfile.allyRevivedTeamStats) {
    for (const ally of team) {
      addEffect(ally, {
        code: "special_ally_revived_team",
        sourcePlayerId: actor.playerId,
        remainingSeconds: entry.duration,
        stats: deepClone(entry.stats),
      });
    }
  }
}

export function applySpecialOnAllyDown(
  battle,
  downedTarget,
) {
  const allies = Object.values(battle.participants).filter(
    (participant) =>
      participant.teamId === downedTarget.teamId &&
      participant.role === "IGL" &&
      participant.combatState === "alive",
  );
  for (const ally of allies) {
    const entries =
      ally.specialProfile?.allyDownCallCt ?? [];
    for (const entry of entries) {
      ally.specialTransient ??= {};
      const used =
        ally.specialTransient.allyDownCallUses ?? 0;
      if (used >= entry.limitPerBattle) continue;
      const skillId = "igl_battle_call";
      ally.skillCharge[skillId] =
        numeric(ally.skillCharge[skillId], 0) +
        entry.seconds;
      if (Object.keys(entry.selfStats ?? {}).length > 0) {
        ally.effects.push({
          effectId: `${ally.playerId}-special-ally-down-${battle.tickCount}`,
          code: "special_ally_down_self",
          sourcePlayerId: ally.playerId,
          remainingSeconds: entry.duration,
          stats: deepClone(entry.selfStats),
          accuracyModifier: 0,
          damageReduction: 0,
          damageMultiplier: 1,
          ctSpeed: 0,
        });
      }
      ally.specialTransient.allyDownCallUses = used + 1;
    }
  }
}

export function applySpecialOnCall(
  battle,
  actor,
  addEffect,
) {
  const profile = actor.specialProfile ?? createEmptyProfile();
  const allies = Object.values(battle.participants).filter(
    (participant) =>
      participant.teamId === actor.teamId &&
      participant.combatState === "alive",
  );
  for (const ally of allies) {
    if (Object.keys(profile.duringCallStats).length > 0) {
      addEffect(ally, {
        code: "special_during_call",
        sourcePlayerId: actor.playerId,
        remainingSeconds:
          3 + profile.callDurationBonus,
        stats: deepClone(profile.duringCallStats),
        damageReduction:
          profile.callDamageReduction,
      });
    }
  }
  if (profile.callLongestCtReduction > 0) {
    for (const ally of allies) {
      const skillIds = Object.keys(ally.skillCharge);
      const longest = skillIds.sort(
        (left, right) =>
          (ally.skills.find((skill) => skill.skillId === right)?.baseCt ?? 0) -
          (ally.skills.find((skill) => skill.skillId === left)?.baseCt ?? 0),
      )[0];
      if (longest) {
        ally.skillCharge[longest] +=
          profile.callLongestCtReduction;
      }
    }
  }
}

export function applySpecialTeamLongestCtAtStart(
  participants,
) {
  for (const actor of participants) {
    const seconds =
      actor.specialProfile?.teamLongestCtAtStart ?? 0;
    if (seconds <= 0) continue;
    for (const ally of participants.filter(
      (candidate) =>
        candidate.teamId === actor.teamId,
    )) {
      const longest = [...ally.skills]
        .sort((left, right) =>
          numeric(right.baseCt, 0) -
          numeric(left.baseCt, 0),
        )[0];
      if (longest) {
        ally.skillCharge[longest.skillId] =
          numeric(
            ally.skillCharge[longest.skillId],
            0,
          ) + seconds;
      }
    }
  }
}

export function applySpecialBattleEndRecovery(
  participant,
) {
  const profile = participant.specialProfile;
  if (!profile) return 0;
  let healing = 0;
  if (
    participant.combatState === "alive" &&
    profile.battleEndRecoveryRate > 0
  ) {
    healing = Math.min(
      participant.maxHp - participant.hp,
      Math.floor(
        participant.maxHp *
          profile.battleEndRecoveryRate,
      ),
    );
    participant.hp += healing;
  }
  participant.nextBattleOpeningEffects =
    profile.nextBattleIfInjured
      .filter(
        (entry) =>
          participant.maxHp > 0 &&
          participant.hp / participant.maxHp <
            entry.threshold,
      )
      .map((entry) => ({
        duration: entry.duration,
        stats: deepClone(entry.stats),
      }));
  return healing;
}

export function applyNextBattleSpecialEffects(
  participant,
  addEffect,
) {
  for (const entry of participant.nextBattleOpeningEffects ?? []) {
    addEffect(participant, {
      code: "special_next_battle_injured",
      sourcePlayerId: participant.playerId,
      remainingSeconds: entry.duration,
      stats: deepClone(entry.stats),
    });
  }
  participant.nextBattleOpeningEffects = [];
}

export function validateSpecialAbilityCoverage(abilities) {
  const unsupported = [];
  for (const ability of abilities ?? []) {
    const effect =
      ability.effectValue ??
      ability.effect ??
      {};
    const code =
      effect.code ??
      ability.effectType;
    if (!SUPPORTED_CODE_SET.has(code)) {
      unsupported.push({
        abilityKey:
          ability.abilityKey ??
          ability.abilityId,
        code,
      });
    }
  }
  return {
    valid: unsupported.length === 0,
    supportedCodeCount:
      SUPPORTED_SPECIAL_EFFECT_CODES.length,
    unsupported,
  };
}
