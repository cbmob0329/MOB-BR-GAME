/**
 * MOB BR deterministic battle actions.
 *
 * This module owns individual combat actions: target selection, attacks,
 * ammunition, reloads, distance changes, skill effects, damage state,
 * confirmed kills, assists, healing, and revives.
 */

import {
  BATTLE_LIMITS,
  BATTLE_TIMING,
  DISTANCE_IDS,
  DISTANCE_RULES,
  ROLE_DEFAULT_RANGE,
  STATE_RULES,
  WEAPON_BATTLE_RULES,
  applyBattleStatBonuses,
  calculateAttackInterval,
  calculateBaseDamage,
  calculateCriticalChance,
  calculateHitChance,
  calculateReloadTime,
  calculateReviveHp,
  calculateShieldHealRate,
  calculateSkillCt,
  isAssistEligible,
  resolveWeaponBattleValue,
} from "../../data/battle-config.js";
import {
  STAT_IDS,
  clamp,
  rankToCharacterValue,
} from "../../data/game-data.js";

export const BATTLE_ACTIONS_VERSION =
  "mobbr-battle-actions-1.1.0";

export const BATTLE_ACTION_BALANCE = Object.freeze({
  criticalDamageMultiplier: 1.5,
  finishDownedTargetChance: 0.24,
  lowHpTargetWeight: 1.5,
  roleTargetWeight: 0.45,
  callBuff: Object.freeze({
    durationSeconds: 3,
    aim: 2,
    mind: 2,
  }),
  smokeLauncher: Object.freeze({
    damageMultiplier: 0.72,
    accuracyDebuffChance: 0.35,
    accuracyDebuff: -0.08,
    debuffDurationSeconds: 2.5,
  }),
  preciseStrikeDamageMultiplier: 1.7,
  aceMindsetDamageMultiplier: 1.55,
  droneHeal: Object.freeze({
    minimumHpRate: 0.08,
    maximumHpRate: 0.16,
  }),
  distanceRangeModifier: Object.freeze({
    preferred: 0.04,
    neutral: 0,
    disadvantaged: -0.05,
  }),
  cpuWeaponValueFloor: 0,
  cpuWeaponValueCeiling: 72,
});

const DISTANCE_INDEX = Object.freeze({
  close: 0,
  mid: 1,
  far: 2,
});

function deepClone(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function assertBattle(battle) {
  if (!battle || typeof battle !== "object") {
    throw new TypeError("Battle state must be an object.");
  }
}

function assertParticipant(participant) {
  if (!participant || typeof participant !== "object") {
    throw new TypeError("Battle participant must be an object.");
  }
}

function roundTime(value) {
  return Math.round(value * 1000) / 1000;
}

export function nextBattleRandom(battle) {
  assertBattle(battle);
  let state = battle.randomState.state >>> 0;
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  state >>>= 0;
  battle.randomState.state = state || 0x9e3779b9;
  battle.randomState.cursor += 1;
  return battle.randomState.state / 0x1_0000_0000;
}

export function appendBattleEvent(
  battle,
  type,
  detail = {},
) {
  assertBattle(battle);
  const event = {
    eventId: `${battle.battleId}-event-${battle.events.length + 1}`,
    type,
    time: roundTime(battle.elapsedSeconds),
    tick: battle.tickCount,
    ...deepClone(detail),
  };
  battle.events.push(event);
  return event;
}

export function getTeamParticipants(
  battle,
  teamId,
  states = null,
) {
  assertBattle(battle);
  const allowedStates =
    states === null
      ? null
      : new Set(Array.isArray(states) ? states : [states]);
  return Object.values(battle.participants).filter(
    (participant) =>
      participant.teamId === teamId &&
      (
        allowedStates === null ||
        allowedStates.has(participant.combatState)
      ),
  );
}

export function getEnemyTeamId(battle, teamId) {
  if (teamId === battle.leftTeamId) {
    return battle.rightTeamId;
  }
  if (teamId === battle.rightTeamId) {
    return battle.leftTeamId;
  }
  throw new RangeError(`Unknown battle team: ${teamId}`);
}

function activeEffects(participant, code = null) {
  return participant.effects.filter(
    (effect) =>
      effect.remainingSeconds > 0 &&
      (code === null || effect.code === code),
  );
}

export function getEffectiveBattleStats(participant) {
  assertParticipant(participant);
  const bonus = Object.fromEntries(
    STAT_IDS.map((statId) => [
      statId,
      activeEffects(participant).reduce(
        (sum, effect) =>
          sum + (effect.stats?.[statId] ?? 0),
        0,
      ),
    ]),
  );
  return applyBattleStatBonuses(
    participant.battleStats,
    participant.strategyStatBonus,
    bonus,
  );
}

function getTemporaryAccuracyModifier(participant) {
  return activeEffects(participant).reduce(
    (sum, effect) =>
      sum + (effect.accuracyModifier ?? 0),
    0,
  );
}

function getDamageTakenMultiplier(participant) {
  return activeEffects(participant).reduce(
    (multiplier, effect) =>
      multiplier *
      (1 - clamp(effect.damageReduction ?? 0, 0, 0.9)),
    1,
  );
}

function getDamageDealtMultiplier(participant) {
  return activeEffects(participant).reduce(
    (multiplier, effect) =>
      multiplier * (effect.damageMultiplier ?? 1),
    1,
  );
}

function addOrRefreshEffect(participant, effect) {
  const existing = participant.effects.find(
    (candidate) =>
      candidate.code === effect.code &&
      candidate.sourcePlayerId === effect.sourcePlayerId,
  );
  if (existing) {
    existing.remainingSeconds = Math.max(
      existing.remainingSeconds,
      effect.remainingSeconds,
    );
    existing.stats = deepClone(effect.stats ?? existing.stats ?? {});
    existing.accuracyModifier =
      effect.accuracyModifier ??
      existing.accuracyModifier ??
      0;
    existing.damageReduction =
      effect.damageReduction ??
      existing.damageReduction ??
      0;
    existing.damageMultiplier =
      effect.damageMultiplier ??
      existing.damageMultiplier ??
      1;
    return existing;
  }
  const next = {
    effectId: `${participant.playerId}-effect-${participant.effectSerial++}`,
    code: effect.code,
    sourcePlayerId: effect.sourcePlayerId ?? null,
    remainingSeconds: effect.remainingSeconds,
    stats: deepClone(effect.stats ?? {}),
    accuracyModifier: effect.accuracyModifier ?? 0,
    damageReduction: effect.damageReduction ?? 0,
    damageMultiplier: effect.damageMultiplier ?? 1,
  };
  participant.effects.push(next);
  return next;
}

function removeExpiredEffects(participant, tickSeconds) {
  for (const effect of participant.effects) {
    effect.remainingSeconds = roundTime(
      Math.max(0, effect.remainingSeconds - tickSeconds),
    );
  }
  participant.effects = participant.effects.filter(
    (effect) => effect.remainingSeconds > 0,
  );
}

export function resolvePreferredDistance(member) {
  if (
    member.weapon?.preferredRange &&
    DISTANCE_IDS.includes(member.weapon.preferredRange)
  ) {
    return member.weapon.preferredRange;
  }

  const values = member.weapon?.internalValues;
  if (values) {
    const ranked = ["close", "mid", "far"]
      .map((distance) => ({
        distance,
        value: values[distance] ?? 0,
      }))
      .sort((left, right) => {
        if (right.value !== left.value) {
          return right.value - left.value;
        }
        const roleDefault = ROLE_DEFAULT_RANGE[member.role];
        if (left.distance === roleDefault) return -1;
        if (right.distance === roleDefault) return 1;
        return DISTANCE_INDEX[left.distance] - DISTANCE_INDEX[right.distance];
      });
    return ranked[0].distance;
  }

  return ROLE_DEFAULT_RANGE[member.role];
}

export function resolveWeaponValues(member) {
  const values = member.weapon?.internalValues;
  if (values) {
    return {
      close: resolveWeaponBattleValue(values.close ?? 0),
      mid: resolveWeaponBattleValue(values.mid ?? 0),
      far: resolveWeaponBattleValue(values.far ?? 0),
      fireRate: resolveWeaponBattleValue(values.fireRate ?? 0),
      reload: resolveWeaponBattleValue(values.reload ?? 0),
      source: "player_weapon_values",
    };
  }

  const characterValue = rankToCharacterValue(
    member.characterRank,
  );
  const fallbackValue = clamp(
    characterValue - 1,
    BATTLE_ACTION_BALANCE.cpuWeaponValueFloor,
    BATTLE_ACTION_BALANCE.cpuWeaponValueCeiling,
  );
  return {
    close: fallbackValue,
    mid: fallbackValue,
    far: fallbackValue,
    fireRate: fallbackValue,
    reload: fallbackValue,
    source: "cpu_character_rank_fallback",
  };
}

function strategyModifiers(strategyEffect) {
  const result = {
    statBonus: {},
    rangeDamage: {},
    allRangeDamage: 0,
    firstHitDamage: 0,
  };
  if (!strategyEffect || typeof strategyEffect !== "object") {
    return result;
  }
  if (strategyEffect.type === "stats") {
    result.statBonus = deepClone(strategyEffect.stats ?? {});
  } else if (strategyEffect.type === "allStats") {
    result.statBonus = Object.fromEntries(
      STAT_IDS.map((statId) => [
        statId,
        strategyEffect.value ?? 0,
      ]),
    );
  } else if (strategyEffect.type === "rangeDamage") {
    result.rangeDamage[strategyEffect.range] =
      strategyEffect.value ?? 0;
  } else if (strategyEffect.type === "allRangeDamage") {
    result.allRangeDamage = strategyEffect.value ?? 0;
  } else if (strategyEffect.type === "firstHitDamage") {
    result.firstHitDamage = strategyEffect.value ?? 0;
  }
  return result;
}

export function createBattleParticipant({
  member,
  runtimeMember,
  team,
  side,
  strategyEffect,
  index,
}) {
  const weaponValues = resolveWeaponValues(member);
  const modifiers = strategyModifiers(strategyEffect);
  const battleStats =
    member.stats ??
    member.battleStats;
  if (!battleStats) {
    throw new TypeError(
      `Battle stats are missing for ${member.playerId}.`,
    );
  }

  const skills = member.skills.map((skill) => ({
    skillId: skill.skillId,
    name: skill.name,
    type: skill.type,
    target: skill.target,
    baseCt: skill.baseCt,
    unavoidable: skill.unavoidable === true,
    usesAmmo: skill.usesAmmo === true,
    source: skill.source ?? "entry",
  }));

  const currentHp = clamp(
    runtimeMember.hp ?? member.currentHp ?? member.maxHp,
    0,
    runtimeMember.maxHp ?? member.maxHp,
  );
  const combatState =
    runtimeMember.combatState === "dead"
      ? "dead"
      : currentHp > 0
        ? "alive"
        : "down";

  return {
    playerId: member.playerId,
    teamId: team.teamId,
    teamName: team.teamName,
    side,
    orderIndex: index,
    name: member.name,
    role: member.role,
    image: member.image,
    characterRank: member.characterRank,
    battleStats: deepClone(battleStats),
    strategyStatBonus: modifiers.statBonus,
    strategyRangeDamage: modifiers.rangeDamage,
    strategyAllRangeDamage: modifiers.allRangeDamage,
    firstHitDamageRate: modifiers.firstHitDamage,
    firstHitDamageAvailable: modifiers.firstHitDamage > 0,
    maxHp: runtimeMember.maxHp ?? member.maxHp,
    hp: currentHp,
    combatState,
    preferredDistance: resolvePreferredDistance(member),
    currentDistance: "mid",
    distanceCooldown: roundTime(0.1 + index * 0.08),
    weapon: {
      weaponId: member.weapon.weaponId,
      weaponName: member.weapon.weaponName,
      image: member.weapon.image ?? null,
      ammoMax:
        member.weapon.ammoMax ??
        WEAPON_BATTLE_RULES.ammoMax,
      ammo: WEAPON_BATTLE_RULES.ammoMax,
      values: weaponValues,
    },
    reloadRemaining: 0,
    attackCooldown: roundTime(index * 0.04),
    skills,
    skillCharge: Object.fromEntries(
      skills.map((skill) => [
        skill.skillId,
        runtimeMember.skillCt?.[skill.skillId] ?? 0,
      ]),
    ),
    effects: deepClone(runtimeMember.temporaryEffects ?? []),
    effectSerial:
      (runtimeMember.temporaryEffects?.length ?? 0) + 1,
    lifeId:
      runtimeMember.lifeId ??
      `${member.playerId}-life-1`,
    lifeSerial: runtimeMember.lifeSerial ?? 1,
    damageContributors: {},
    specialAbilities: deepClone(member.specialAbilities ?? []),
    unappliedSpecialAbilityKeys: (member.specialAbilities ?? []).map(
      (ability) => ability.abilityKey ?? ability.abilityId,
    ),
    stats: {
      rounds: 1,
      kills: 0,
      assists: 0,
      downsGiven: 0,
      downsTaken: 0,
      deaths: 0,
      revives: 0,
      timesRevived: 0,
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
      criticalHits: 0,
      misses: 0,
    },
  };
}

function distanceRelation(participant) {
  if (participant.currentDistance === participant.preferredDistance) {
    return "preferred";
  }
  const distanceDifference = Math.abs(
    DISTANCE_INDEX[participant.currentDistance] -
      DISTANCE_INDEX[participant.preferredDistance],
  );
  return distanceDifference <= 1
    ? "neutral"
    : "disadvantaged";
}

function distanceDamageMultiplier(participant) {
  const relation = distanceRelation(participant);
  return DISTANCE_RULES.damageMultipliers[relation];
}

function distanceAccuracyModifier(participant) {
  const relation = distanceRelation(participant);
  return BATTLE_ACTION_BALANCE.distanceRangeModifier[relation];
}

function strategyDamageMultiplier(participant) {
  return (
    1 +
    participant.strategyAllRangeDamage +
    (participant.strategyRangeDamage[
      participant.currentDistance
    ] ?? 0)
  );
}

function chooseRoleTargetWeight(actor, target) {
  if (actor.role === "IGL" && target.role === "ATK") {
    return BATTLE_ACTION_BALANCE.roleTargetWeight;
  }
  if (actor.role === "ATK" && target.role === "SUP") {
    return BATTLE_ACTION_BALANCE.roleTargetWeight * 0.8;
  }
  if (actor.role === "SUP" && target.role === "ATK") {
    return BATTLE_ACTION_BALANCE.roleTargetWeight * 0.5;
  }
  return 0;
}

function weightedChoice(battle, entries) {
  const total = entries.reduce(
    (sum, entry) => sum + entry.weight,
    0,
  );
  let cursor = nextBattleRandom(battle) * total;
  for (const entry of entries) {
    cursor -= entry.weight;
    if (cursor <= 0) {
      return entry.value;
    }
  }
  return entries.at(-1).value;
}

export function selectAttackTarget(
  battle,
  actor,
  {
    allowDowned = battle.rules.allowFinishDowned,
    forceAlive = false,
  } = {},
) {
  assertBattle(battle);
  assertParticipant(actor);
  const enemyTeamId = getEnemyTeamId(battle, actor.teamId);
  const alive = getTeamParticipants(
    battle,
    enemyTeamId,
    "alive",
  );
  const downed = getTeamParticipants(
    battle,
    enemyTeamId,
    "down",
  );

  if (
    !forceAlive &&
    allowDowned &&
    downed.length > 0 &&
    alive.length > 0 &&
    nextBattleRandom(battle) <
      BATTLE_ACTION_BALANCE.finishDownedTargetChance
  ) {
    return weightedChoice(
      battle,
      downed.map((target) => ({
        value: target,
        weight: 1 + (1 - target.hp / target.maxHp),
      })),
    );
  }

  const candidates = alive.length > 0
    ? alive
    : !forceAlive && allowDowned
      ? downed
      : [];
  if (candidates.length === 0) {
    return null;
  }

  return weightedChoice(
    battle,
    candidates.map((target) => {
      const hpRate = target.maxHp > 0
        ? target.hp / target.maxHp
        : 0;
      return {
        value: target,
        weight:
          1 +
          (1 - hpRate) *
            BATTLE_ACTION_BALANCE.lowHpTargetWeight +
          chooseRoleTargetWeight(actor, target),
      };
    }),
  );
}

function registerDamageContribution(
  target,
  actor,
  actualDamage,
) {
  if (actualDamage <= 0) {
    return;
  }
  const key = `${target.lifeId}:${actor.playerId}`;
  target.damageContributors[key] =
    (target.damageContributors[key] ?? 0) +
    actualDamage;
}

function recordAssistAwards(
  battle,
  killer,
  target,
) {
  const assists = [];
  for (const ally of getTeamParticipants(
    battle,
    killer.teamId,
  )) {
    if (
      ally.playerId === killer.playerId ||
      ally.combatState === "dead"
    ) {
      continue;
    }
    const contribution =
      target.damageContributors[
        `${target.lifeId}:${ally.playerId}`
      ] ?? 0;
    if (isAssistEligible(contribution, target.maxHp)) {
      ally.stats.assists += 1;
      battle.teamStats[ally.teamId].assists += 1;
      assists.push({
        playerId: ally.playerId,
        damage: contribution,
      });
      appendBattleEvent(battle, "assist", {
        actorPlayerId: ally.playerId,
        actorTeamId: ally.teamId,
        targetPlayerId: target.playerId,
        killerPlayerId: killer.playerId,
        contributedDamage: contribution,
      });
    }
  }
  return assists;
}

export function confirmDownedTarget(
  battle,
  actor,
  target,
  {
    sourceType = "normal_attack",
    sourceId = actor.weapon.weaponId,
    sourceName = actor.weapon.weaponName,
  } = {},
) {
  assertBattle(battle);
  assertParticipant(actor);
  assertParticipant(target);
  if (target.combatState !== "down") {
    return {
      confirmed: false,
      reason: "target_not_down",
    };
  }

  target.combatState = "dead";
  target.hp = STATE_RULES.deadHp;
  target.stats.deaths += 1;
  actor.stats.kills += 1;
  battle.teamStats[actor.teamId].confirmedKills += 1;
  battle.teamStats[actor.teamId].kp += 1;
  battle.teamStats[target.teamId].deaths += 1;
  const assists = recordAssistAwards(
    battle,
    actor,
    target,
  );

  appendBattleEvent(battle, "confirmed_kill", {
    actorPlayerId: actor.playerId,
    actorTeamId: actor.teamId,
    targetPlayerId: target.playerId,
    targetTeamId: target.teamId,
    sourceType,
    sourceId,
    sourceName,
    kp: 1,
    assists,
  });

  return {
    confirmed: true,
    kp: 1,
    assists,
  };
}

export function applyBattleDamage(
  battle,
  actor,
  target,
  damage,
  {
    sourceType = "normal_attack",
    sourceId = actor.weapon.weaponId,
    sourceName = actor.weapon.weaponName,
    critical = false,
  } = {},
) {
  assertBattle(battle);
  assertParticipant(actor);
  assertParticipant(target);
  if (!Number.isFinite(damage) || damage < 0) {
    throw new RangeError(
      "Battle damage must be non-negative.",
    );
  }
  if (target.combatState === "dead") {
    return {
      applied: false,
      reason: "target_dead",
      actualDamage: 0,
    };
  }
  if (target.combatState === "down") {
    const confirmation = confirmDownedTarget(
      battle,
      actor,
      target,
      {
        sourceType,
        sourceId,
        sourceName,
      },
    );
    return {
      applied: confirmation.confirmed,
      confirmedKill: confirmation.confirmed,
      actualDamage: 0,
      targetState: target.combatState,
    };
  }

  const reducedDamage = Math.max(
    1,
    Math.round(
      damage *
        getDamageTakenMultiplier(target),
    ),
  );
  const actualDamage = Math.min(target.hp, reducedDamage);
  target.hp = Math.max(0, target.hp - actualDamage);
  actor.stats.damage += actualDamage;
  target.stats.damageTaken += actualDamage;
  battle.teamStats[actor.teamId].damage += actualDamage;
  battle.teamStats[target.teamId].damageTaken += actualDamage;
  registerDamageContribution(
    target,
    actor,
    actualDamage,
  );

  appendBattleEvent(battle, "damage", {
    actorPlayerId: actor.playerId,
    actorTeamId: actor.teamId,
    targetPlayerId: target.playerId,
    targetTeamId: target.teamId,
    sourceType,
    sourceId,
    sourceName,
    damage: actualDamage,
    requestedDamage: damage,
    critical,
    remainingHp: target.hp,
  });

  let downed = false;
  if (target.hp <= 0) {
    target.combatState = "down";
    target.hp = STATE_RULES.downHp;
    target.stats.downsTaken += 1;
    actor.stats.downsGiven += 1;
    battle.teamStats[actor.teamId].downsGiven += 1;
    battle.teamStats[target.teamId].downsTaken += 1;
    downed = true;
    appendBattleEvent(battle, "down", {
      actorPlayerId: actor.playerId,
      actorTeamId: actor.teamId,
      targetPlayerId: target.playerId,
      targetTeamId: target.teamId,
      sourceType,
      sourceId,
      sourceName,
    });
  }

  return {
    applied: true,
    actualDamage,
    downed,
    confirmedKill: false,
    targetState: target.combatState,
  };
}

function maybeStartReload(battle, participant) {
  if (
    participant.weapon.ammo > 0 ||
    participant.reloadRemaining > 0 ||
    !WEAPON_BATTLE_RULES.autoReloadAtZero
  ) {
    return false;
  }
  participant.reloadRemaining = roundTime(
    calculateReloadTime(
      participant.weapon.values.reload,
    ),
  );
  appendBattleEvent(battle, "reload_start", {
    actorPlayerId: participant.playerId,
    actorTeamId: participant.teamId,
    duration: participant.reloadRemaining,
    weaponName: participant.weapon.weaponName,
  });
  return true;
}

function completeReloadIfReady(
  battle,
  participant,
  tickSeconds,
) {
  if (participant.reloadRemaining <= 0) {
    return;
  }
  participant.reloadRemaining = roundTime(
    Math.max(
      0,
      participant.reloadRemaining - tickSeconds,
    ),
  );
  if (participant.reloadRemaining === 0) {
    participant.weapon.ammo =
      participant.weapon.ammoMax;
    participant.stats.weaponReloads += 1;
    appendBattleEvent(battle, "reload_complete", {
      actorPlayerId: participant.playerId,
      actorTeamId: participant.teamId,
      ammo: participant.weapon.ammo,
      weaponName: participant.weapon.weaponName,
    });
  }
}

function attackWeaponRangeValue(participant) {
  return participant.weapon.values[
    participant.currentDistance
  ];
}

function calculateAttackDamage(
  actor,
  {
    multiplier = 1,
    critical = false,
  } = {},
) {
  const effectiveStats = getEffectiveBattleStats(actor);
  let temporaryMultiplier =
    getDamageDealtMultiplier(actor);
  if (actor.firstHitDamageAvailable) {
    temporaryMultiplier *=
      1 + actor.firstHitDamageRate;
  }
  return calculateBaseDamage({
    stats: effectiveStats,
    weaponRangeValue:
      attackWeaponRangeValue(actor),
    distanceMultiplier:
      distanceDamageMultiplier(actor),
    strategyMultiplier:
      strategyDamageMultiplier(actor),
    temporaryMultiplier:
      temporaryMultiplier * multiplier,
    criticalMultiplier:
      critical
        ? BATTLE_ACTION_BALANCE
            .criticalDamageMultiplier
        : 1,
  });
}

function consumeFirstHitEffect(
  battle,
  actor,
) {
  if (!actor.firstHitDamageAvailable) {
    return;
  }
  actor.firstHitDamageAvailable = false;
  appendBattleEvent(battle, "strategy_first_hit_consumed", {
    actorPlayerId: actor.playerId,
    actorTeamId: actor.teamId,
    rate: actor.firstHitDamageRate,
  });
}

export function performNormalAttack(
  battle,
  actor,
) {
  assertBattle(battle);
  assertParticipant(actor);
  if (
    actor.combatState !== "alive" ||
    actor.reloadRemaining > 0 ||
    actor.attackCooldown > 0
  ) {
    return {
      performed: false,
      reason: "actor_not_ready",
    };
  }
  if (actor.weapon.ammo <= 0) {
    maybeStartReload(battle, actor);
    return {
      performed: false,
      reason: "ammo_empty",
    };
  }

  const target = selectAttackTarget(
    battle,
    actor,
  );
  if (!target) {
    return {
      performed: false,
      reason: "no_target",
    };
  }

  actor.weapon.ammo -= 1;
  actor.stats.shots += 1;
  actor.stats.weaponShots += 1;
  battle.teamStats[actor.teamId].shots += 1;

  const effectiveStats = getEffectiveBattleStats(actor);
  const targetStats = getEffectiveBattleStats(target);
  const hitChance =
    target.combatState === "down"
      ? 1
      : calculateHitChance({
          actorStats: effectiveStats,
          targetStats,
          weaponRangeValue:
            attackWeaponRangeValue(actor),
          rangeModifier:
            distanceAccuracyModifier(actor),
          temporaryModifier:
            getTemporaryAccuracyModifier(actor),
        });
  const hit = nextBattleRandom(battle) < hitChance;
  let result;

  if (hit) {
    actor.stats.hits += 1;
    actor.stats.weaponHits += 1;
    battle.teamStats[actor.teamId].hits += 1;

    const critical =
      target.combatState === "alive" &&
      nextBattleRandom(battle) <
        calculateCriticalChance(effectiveStats);
    if (critical) {
      actor.stats.criticalHits += 1;
    }

    const damage = calculateAttackDamage(actor, {
      critical,
    });
    result = applyBattleDamage(
      battle,
      actor,
      target,
      damage,
      {
        sourceType: "normal_attack",
        sourceId: actor.weapon.weaponId,
        sourceName: actor.weapon.weaponName,
        critical,
      },
    );
    actor.stats.weaponDamage +=
      result.actualDamage ?? 0;
    if (result.applied) {
      consumeFirstHitEffect(battle, actor);
    }

    appendBattleEvent(battle, "normal_attack_hit", {
      actorPlayerId: actor.playerId,
      actorTeamId: actor.teamId,
      targetPlayerId: target.playerId,
      targetTeamId: target.teamId,
      hitChance,
      critical,
      ammo: actor.weapon.ammo,
      damage: result.actualDamage ?? 0,
    });
  } else {
    actor.stats.misses += 1;
    appendBattleEvent(battle, "normal_attack_miss", {
      actorPlayerId: actor.playerId,
      actorTeamId: actor.teamId,
      targetPlayerId: target.playerId,
      targetTeamId: target.teamId,
      hitChance,
      ammo: actor.weapon.ammo,
    });
    result = {
      applied: false,
      missed: true,
      actualDamage: 0,
    };
  }

  actor.attackCooldown = roundTime(
    calculateAttackInterval(
      actor.weapon.values.fireRate,
      effectiveStats.agility,
    ),
  );
  maybeStartReload(battle, actor);

  return {
    performed: true,
    hit,
    targetPlayerId: target.playerId,
    hitChance,
    ammo: actor.weapon.ammo,
    ...result,
  };
}

function lowestHpAliveAlly(battle, actor) {
  return getTeamParticipants(
    battle,
    actor.teamId,
    "alive",
  )
    .filter((ally) => ally.hp < ally.maxHp)
    .sort((left, right) => {
      const leftRate = left.hp / left.maxHp;
      const rightRate = right.hp / right.maxHp;
      if (leftRate !== rightRate) {
        return leftRate - rightRate;
      }
      return left.playerId.localeCompare(right.playerId);
    })[0] ?? null;
}

function skillEffectiveCt(actor, skill) {
  if (
    !Number.isFinite(skill.baseCt) ||
    skill.baseCt <= 0
  ) {
    return null;
  }
  return calculateSkillCt(
    skill.baseCt,
    getEffectiveBattleStats(actor).agility,
  );
}

function isSkillReady(actor, skill) {
  const effectiveCt = skillEffectiveCt(
    actor,
    skill,
  );
  return (
    effectiveCt !== null &&
    (actor.skillCharge[skill.skillId] ?? 0) >=
      effectiveCt
  );
}

function healParticipant(
  battle,
  actor,
  target,
  amount,
  sourceId,
  sourceName,
) {
  if (
    target.combatState !== "alive" ||
    target.hp >= target.maxHp
  ) {
    return 0;
  }
  const actual = Math.min(
    target.maxHp - target.hp,
    Math.max(0, Math.round(amount)),
  );
  if (actual <= 0) {
    return 0;
  }
  target.hp += actual;
  actor.stats.healing += actual;
  battle.teamStats[actor.teamId].healing += actual;
  appendBattleEvent(battle, "heal", {
    actorPlayerId: actor.playerId,
    actorTeamId: actor.teamId,
    targetPlayerId: target.playerId,
    targetTeamId: target.teamId,
    sourceId,
    sourceName,
    amount: actual,
    currentHp: target.hp,
  });
  return actual;
}

function reviveParticipant(
  battle,
  actor,
  target,
  reviveRate,
  sourceId,
  sourceName,
) {
  if (target.combatState !== "down") {
    return null;
  }
  target.combatState = "alive";
  target.hp = calculateReviveHp(
    target.maxHp,
    reviveRate,
  );
  target.lifeSerial += 1;
  target.lifeId =
    `${target.playerId}-life-${target.lifeSerial}`;
  target.damageContributors = {};
  target.stats.timesRevived += 1;
  actor.stats.revives += 1;
  battle.teamStats[actor.teamId].revives += 1;
  appendBattleEvent(battle, "revive", {
    actorPlayerId: actor.playerId,
    actorTeamId: actor.teamId,
    targetPlayerId: target.playerId,
    targetTeamId: target.teamId,
    sourceId,
    sourceName,
    hp: target.hp,
    hpRate: reviveRate,
  });
  return {
    targetPlayerId: target.playerId,
    hp: target.hp,
  };
}

function useSkillCharge(
  actor,
  skill,
) {
  actor.skillCharge[skill.skillId] = 0;
  actor.stats.skillUses += 1;
}

function executeBattleCall(
  battle,
  actor,
  skill,
) {
  const targets = getTeamParticipants(
    battle,
    actor.teamId,
    "alive",
  );
  if (targets.length === 0) {
    return null;
  }
  useSkillCharge(actor, skill);
  for (const target of targets) {
    addOrRefreshEffect(target, {
      code: "igl_battle_call",
      sourcePlayerId: actor.playerId,
      remainingSeconds:
        BATTLE_ACTION_BALANCE.callBuff
          .durationSeconds,
      stats: {
        aim: BATTLE_ACTION_BALANCE.callBuff.aim,
        mind: BATTLE_ACTION_BALANCE.callBuff.mind,
      },
    });
  }
  appendBattleEvent(battle, "skill_buff", {
    actorPlayerId: actor.playerId,
    actorTeamId: actor.teamId,
    skillId: skill.skillId,
    skillName: skill.name,
    targetPlayerIds: targets.map(
      (target) => target.playerId,
    ),
    duration:
      BATTLE_ACTION_BALANCE.callBuff
        .durationSeconds,
  });
  return {
    performed: true,
    skillId: skill.skillId,
    targetPlayerIds: targets.map(
      (target) => target.playerId,
    ),
  };
}

function executeSingleAttackSkill(
  battle,
  actor,
  skill,
  {
    multiplier,
    unavoidable = false,
  },
) {
  const target = selectAttackTarget(
    battle,
    actor,
    {
      allowDowned: false,
      forceAlive: true,
    },
  );
  if (!target) {
    return null;
  }

  const effectiveStats = getEffectiveBattleStats(actor);
  const hitChance = unavoidable
    ? 1
    : calculateHitChance({
        actorStats: effectiveStats,
        targetStats: getEffectiveBattleStats(target),
        weaponRangeValue:
          attackWeaponRangeValue(actor),
        rangeModifier:
          distanceAccuracyModifier(actor),
        temporaryModifier:
          getTemporaryAccuracyModifier(actor) + 0.03,
      });
  const hit = unavoidable ||
    nextBattleRandom(battle) < hitChance;

  useSkillCharge(actor, skill);
  let result = {
    applied: false,
    actualDamage: 0,
  };
  if (hit) {
    const critical =
      nextBattleRandom(battle) <
      calculateCriticalChance(effectiveStats);
    result = applyBattleDamage(
      battle,
      actor,
      target,
      calculateAttackDamage(actor, {
        multiplier,
        critical,
      }),
      {
        sourceType: "skill",
        sourceId: skill.skillId,
        sourceName: skill.name,
        critical,
      },
    );
    consumeFirstHitEffect(battle, actor);
  }

  appendBattleEvent(
    battle,
    hit ? "skill_attack_hit" : "skill_attack_miss",
    {
      actorPlayerId: actor.playerId,
      actorTeamId: actor.teamId,
      targetPlayerId: target.playerId,
      targetTeamId: target.teamId,
      skillId: skill.skillId,
      skillName: skill.name,
      hitChance,
      damage: result.actualDamage ?? 0,
    },
  );

  return {
    performed: true,
    skillId: skill.skillId,
    hit,
    targetPlayerId: target.playerId,
    ...result,
  };
}

function executeSmokeLauncher(
  battle,
  actor,
  skill,
) {
  const targets = getTeamParticipants(
    battle,
    getEnemyTeamId(battle, actor.teamId),
    "alive",
  );
  if (targets.length === 0) {
    return null;
  }
  useSkillCharge(actor, skill);
  const results = [];

  for (const target of targets) {
    const hitChance = calculateHitChance({
      actorStats: getEffectiveBattleStats(actor),
      targetStats: getEffectiveBattleStats(target),
      weaponRangeValue:
        attackWeaponRangeValue(actor),
      rangeModifier:
        distanceAccuracyModifier(actor),
      temporaryModifier:
        getTemporaryAccuracyModifier(actor),
    });
    const hit = nextBattleRandom(battle) < hitChance;
    if (!hit) {
      results.push({
        targetPlayerId: target.playerId,
        hit: false,
        damage: 0,
      });
      continue;
    }

    const damageResult = applyBattleDamage(
      battle,
      actor,
      target,
      calculateAttackDamage(actor, {
        multiplier:
          BATTLE_ACTION_BALANCE
            .smokeLauncher
            .damageMultiplier,
      }),
      {
        sourceType: "skill",
        sourceId: skill.skillId,
        sourceName: skill.name,
      },
    );
    if (
      nextBattleRandom(battle) <
      BATTLE_ACTION_BALANCE
        .smokeLauncher
        .accuracyDebuffChance
    ) {
      addOrRefreshEffect(target, {
        code: "smoke_accuracy_down",
        sourcePlayerId: actor.playerId,
        remainingSeconds:
          BATTLE_ACTION_BALANCE
            .smokeLauncher
            .debuffDurationSeconds,
        accuracyModifier:
          BATTLE_ACTION_BALANCE
            .smokeLauncher
            .accuracyDebuff,
      });
    }
    consumeFirstHitEffect(battle, actor);
    results.push({
      targetPlayerId: target.playerId,
      hit: true,
      damage: damageResult.actualDamage ?? 0,
    });
  }

  appendBattleEvent(battle, "skill_area_attack", {
    actorPlayerId: actor.playerId,
    actorTeamId: actor.teamId,
    skillId: skill.skillId,
    skillName: skill.name,
    results,
  });

  return {
    performed: true,
    skillId: skill.skillId,
    results,
  };
}

function executeShieldCharge(
  battle,
  actor,
  skill,
) {
  const target = lowestHpAliveAlly(
    battle,
    actor,
  );
  if (
    !target ||
    target.hp / target.maxHp >
      (skill.waitWhileAllAboveHpRate ?? 0.85)
  ) {
    return null;
  }

  useSkillCharge(actor, skill);
  const rate = calculateShieldHealRate(
    getEffectiveBattleStats(actor).support,
  );
  const amount = healParticipant(
    battle,
    actor,
    target,
    target.maxHp * rate,
    skill.skillId,
    skill.name,
  );
  appendBattleEvent(battle, "skill_heal", {
    actorPlayerId: actor.playerId,
    actorTeamId: actor.teamId,
    skillId: skill.skillId,
    skillName: skill.name,
    targetPlayerIds: [target.playerId],
    totalHealing: amount,
  });
  return {
    performed: true,
    skillId: skill.skillId,
    targetPlayerIds: [target.playerId],
    totalHealing: amount,
  };
}

function executeDroneHeal(
  battle,
  actor,
  skill,
) {
  const targets = getTeamParticipants(
    battle,
    actor.teamId,
    "alive",
  ).filter((target) => target.hp < target.maxHp);
  if (targets.length === 0) {
    return null;
  }
  useSkillCharge(actor, skill);
  const support =
    getEffectiveBattleStats(actor).support;
  const normalized =
    (support - BATTLE_LIMITS.playerStatMin) /
    (
      BATTLE_LIMITS.playerStatMax -
      BATTLE_LIMITS.playerStatMin
    );
  const rate =
    BATTLE_ACTION_BALANCE.droneHeal
      .minimumHpRate +
    clamp(normalized, 0, 1) *
      (
        BATTLE_ACTION_BALANCE.droneHeal
          .maximumHpRate -
        BATTLE_ACTION_BALANCE.droneHeal
          .minimumHpRate
      );
  const results = targets.map((target) => ({
    targetPlayerId: target.playerId,
    healing: healParticipant(
      battle,
      actor,
      target,
      target.maxHp * rate,
      skill.skillId,
      skill.name,
    ),
  }));
  appendBattleEvent(battle, "skill_team_heal", {
    actorPlayerId: actor.playerId,
    actorTeamId: actor.teamId,
    skillId: skill.skillId,
    skillName: skill.name,
    results,
  });
  return {
    performed: true,
    skillId: skill.skillId,
    results,
    totalHealing: results.reduce(
      (sum, result) => sum + result.healing,
      0,
    ),
  };
}

function executeRespawnField(
  battle,
  actor,
  skill,
) {
  const targets = getTeamParticipants(
    battle,
    actor.teamId,
    "down",
  );
  if (targets.length === 0) {
    return null;
  }
  useSkillCharge(actor, skill);
  const reviveRate =
    skill.reviveHpRate ??
    STATE_RULES.reviveFieldBaseHpRate;
  const results = targets
    .map((target) =>
      reviveParticipant(
        battle,
        actor,
        target,
        reviveRate,
        skill.skillId,
        skill.name,
      ),
    )
    .filter(Boolean);
  appendBattleEvent(battle, "skill_revive", {
    actorPlayerId: actor.playerId,
    actorTeamId: actor.teamId,
    skillId: skill.skillId,
    skillName: skill.name,
    results,
  });
  return {
    performed: true,
    skillId: skill.skillId,
    results,
  };
}

export function getUsableReadySkills(
  battle,
  actor,
) {
  if (actor.combatState !== "alive") {
    return [];
  }
  const ready = actor.skills.filter(
    (skill) => isSkillReady(actor, skill),
  );
  const scored = ready
    .map((skill) => {
      let priority = 0;
      if (skill.skillId === "sup_respawn_field") {
        priority = getTeamParticipants(
          battle,
          actor.teamId,
          "down",
        ).length > 0
          ? 100
          : -1;
      } else if (
        skill.skillId === "sup_drone_heal"
      ) {
        priority = getTeamParticipants(
          battle,
          actor.teamId,
          "alive",
        ).some((ally) => ally.hp < ally.maxHp)
          ? 80
          : -1;
      } else if (skill.skillId === "shield_charge") {
        const target = lowestHpAliveAlly(
          battle,
          actor,
        );
        priority =
          target &&
          target.hp / target.maxHp <=
            (skill.waitWhileAllAboveHpRate ?? 0.85)
            ? 70
            : -1;
      } else if (
        skill.skillId === "atk_smoke_launcher"
      ) {
        priority = 60;
      } else if (
        skill.skillId === "atk_ace_mindset" ||
        skill.skillId === "igl_precise_strike"
      ) {
        priority = 55;
      } else if (skill.skillId === "igl_battle_call") {
        const callActive = getTeamParticipants(
          battle,
          actor.teamId,
          "alive",
        ).some(
          (ally) =>
            activeEffects(
              ally,
              "igl_battle_call",
            ).length > 0,
        );
        priority = callActive ? -1 : 50;
      } else {
        priority = -1;
      }
      return { skill, priority };
    })
    .filter((entry) => entry.priority >= 0)
    .sort((left, right) => {
      if (right.priority !== left.priority) {
        return right.priority - left.priority;
      }
      return left.skill.skillId.localeCompare(
        right.skill.skillId,
      );
    });
  return scored.map((entry) => entry.skill);
}

export function performSkillAction(
  battle,
  actor,
) {
  const skill =
    getUsableReadySkills(battle, actor)[0];
  if (!skill) {
    return {
      performed: false,
      reason: "no_usable_ready_skill",
    };
  }

  switch (skill.skillId) {
    case "igl_battle_call":
      return executeBattleCall(
        battle,
        actor,
        skill,
      );
    case "igl_precise_strike":
      return executeSingleAttackSkill(
        battle,
        actor,
        skill,
        {
          multiplier:
            BATTLE_ACTION_BALANCE
              .preciseStrikeDamageMultiplier,
          unavoidable: true,
        },
      );
    case "atk_smoke_launcher":
      return executeSmokeLauncher(
        battle,
        actor,
        skill,
      );
    case "atk_ace_mindset":
      return executeSingleAttackSkill(
        battle,
        actor,
        skill,
        {
          multiplier:
            BATTLE_ACTION_BALANCE
              .aceMindsetDamageMultiplier,
          unavoidable: false,
        },
      );
    case "shield_charge":
      return executeShieldCharge(
        battle,
        actor,
        skill,
      );
    case "sup_drone_heal":
      return executeDroneHeal(
        battle,
        actor,
        skill,
      );
    case "sup_respawn_field":
      return executeRespawnField(
        battle,
        actor,
        skill,
      );
    default:
      appendBattleEvent(battle, "unresolved_skill_skipped", {
        actorPlayerId: actor.playerId,
        actorTeamId: actor.teamId,
        skillId: skill.skillId,
        skillName: skill.name,
        source: skill.source,
      });
      return {
        performed: false,
        reason: "unresolved_skill",
        skillId: skill.skillId,
      };
  }
}

function moveOneDistanceStep(
  current,
  preferred,
) {
  if (current === preferred) {
    return current;
  }
  const currentIndex = DISTANCE_INDEX[current];
  const preferredIndex = DISTANCE_INDEX[preferred];
  return DISTANCE_IDS[
    currentIndex + Math.sign(preferredIndex - currentIndex)
  ];
}

function maybeUpdateDistance(
  battle,
  participant,
) {
  if (
    participant.combatState !== "alive" ||
    participant.distanceCooldown > 0 ||
    participant.currentDistance ===
      participant.preferredDistance
  ) {
    return false;
  }

  const effectiveStats =
    getEffectiveBattleStats(participant);
  const agilityRate =
    (effectiveStats.agility -
      BATTLE_LIMITS.playerStatMin) /
    (
      BATTLE_LIMITS.playerStatMax -
      BATTLE_LIMITS.playerStatMin
    );
  const changeChance =
    0.35 + clamp(agilityRate, 0, 1) * 0.5;
  participant.distanceCooldown =
    DISTANCE_RULES.updateIntervalSeconds;

  if (nextBattleRandom(battle) >= changeChance) {
    return false;
  }

  const previousDistance =
    participant.currentDistance;
  participant.currentDistance =
    moveOneDistanceStep(
      participant.currentDistance,
      participant.preferredDistance,
    );
  appendBattleEvent(battle, "distance_changed", {
    actorPlayerId: participant.playerId,
    actorTeamId: participant.teamId,
    previousDistance,
    currentDistance: participant.currentDistance,
    preferredDistance:
      participant.preferredDistance,
  });
  return true;
}

export function updateParticipantTimers(
  battle,
  participant,
  tickSeconds = BATTLE_TIMING.tickSeconds,
) {
  assertBattle(battle);
  assertParticipant(participant);
  removeExpiredEffects(
    participant,
    tickSeconds,
  );

  participant.attackCooldown = roundTime(
    Math.max(
      0,
      participant.attackCooldown - tickSeconds,
    ),
  );
  participant.distanceCooldown = roundTime(
    Math.max(
      0,
      participant.distanceCooldown - tickSeconds,
    ),
  );
  completeReloadIfReady(
    battle,
    participant,
    tickSeconds,
  );

  if (participant.combatState === "alive") {
    for (const skill of participant.skills) {
      if (
        Number.isFinite(skill.baseCt) &&
        skill.baseCt > 0
      ) {
        participant.skillCharge[skill.skillId] =
          roundTime(
            (participant.skillCharge[skill.skillId] ?? 0) +
              tickSeconds,
          );
      }
    }
    participant.stats.survivalTime =
      roundTime(
        participant.stats.survivalTime +
          tickSeconds,
      );
    maybeUpdateDistance(
      battle,
      participant,
    );
  }
}

export function processParticipantTurn(
  battle,
  participant,
) {
  if (participant.combatState !== "alive") {
    return {
      performed: false,
      reason: "actor_inactive",
    };
  }

  const skillResult = performSkillAction(
    battle,
    participant,
  );
  if (skillResult.performed) {
    return {
      actionType: "skill",
      ...skillResult,
    };
  }

  const attackResult = performNormalAttack(
    battle,
    participant,
  );
  return {
    actionType: attackResult.performed
      ? "normal_attack"
      : "wait",
    ...attackResult,
  };
}

export function recoverDownedAfterBattle(
  participant,
) {
  assertParticipant(participant);
  if (participant.combatState !== "down") {
    return false;
  }
  participant.combatState = "alive";
  participant.hp =
    STATE_RULES.downRecoveryHpAfterBattle;
  participant.lifeSerial += 1;
  participant.lifeId =
    `${participant.playerId}-life-${participant.lifeSerial}`;
  participant.damageContributors = {};
  return true;
}
