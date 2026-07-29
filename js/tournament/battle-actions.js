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
} from "../../data/battle-config.js?v=32";
import {
  STAT_IDS,
  clamp,
  rankToCharacterValue,
} from "../../data/game-data.js?v=32";
import {
  adjustDebuffForSpecialAbility,
  applyNextBattleSpecialEffects,
  applySpecialAfterHeal,
  applySpecialAfterRangeMove,
  applySpecialAfterRevive,
  applySpecialBattleEndRecovery,
  applySpecialOnAllyDown,
  applySpecialOnCall,
  applySpecialProfileAtBattleStart,
  applySpecialTeamLongestCtAtStart,
  compileSpecialAbilityProfile,
  getSpecialAttackModifiers,
  getSpecialDamageTakenMultiplier,
  getSpecialSkillModifiers,
  normalizeUniqueSkill,
  recordSpecialAttackOutcome,
  refreshSpecialDynamicEffects,
} from "./special-abilities.js";

export const BATTLE_ACTIONS_VERSION =
  "mobbr-battle-actions-1.7.0";

export const BATTLE_ACTION_BALANCE = Object.freeze({
  criticalDamageMultiplier: 1.5,
  finishDownedTargetChance: 0.13,
  finishDownedGraceSeconds: 2.1,
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

function getDamageTakenMultiplier(
  participant,
  {
    attackerPierceRate = 0,
  } = {},
) {
  const temporary = activeEffects(participant).reduce(
    (multiplier, effect) =>
      multiplier *
      (1 - clamp(effect.damageReduction ?? 0, 0, 0.9)),
    1,
  );
  return (
    temporary *
    (1 - clamp(participant.playerMasteryDamageReduction ?? 0, 0, 0.2)) *
    getSpecialDamageTakenMultiplier(
      participant,
      { attackerPierceRate },
    )
  );
}

function getDamageDealtMultiplier(participant) {
  return activeEffects(participant).reduce(
    (multiplier, effect) =>
      multiplier * (effect.damageMultiplier ?? 1),
    1,
  );
}

export function addOrRefreshEffect(participant, effect) {
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
    existing.ctSpeed =
      effect.ctSpeed ??
      existing.ctSpeed ??
      0;
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
    ctSpeed: effect.ctSpeed ?? 0,
  };
  participant.effects.push(next);
  return next;
}

export function initializeBattleSpecialAbilities(battle) {
  assertBattle(battle);
  const participants = Object.values(
    battle.participants,
  );
  for (const participant of participants) {
    applySpecialProfileAtBattleStart(
      participant,
      participant.specialProfile,
      {
        addEffect: addOrRefreshEffect,
        teamParticipants:
          participants.filter(
            (candidate) =>
              candidate.teamId ===
              participant.teamId,
          ),
      },
    );
    applyNextBattleSpecialEffects(
      participant,
      addOrRefreshEffect,
    );
  }
  applySpecialTeamLongestCtAtStart(
    participants,
  );
  battle.specialAbilityRuntime = {
    initialized: true,
    supportedAbilityCount:
      participants.reduce(
        (sum, participant) =>
          sum +
          (
            participant.specialProfile
              ?.supportedAbilityKeys
              ?.length ?? 0
          ),
        0,
      ),
    unsupportedAbilityKeys:
      participants.flatMap(
        (participant) =>
          participant
            .unappliedSpecialAbilityKeys ??
          [],
      ),
  };
  appendBattleEvent(
    battle,
    "special_abilities_initialized",
    {
      supportedAbilityCount:
        battle.specialAbilityRuntime
          .supportedAbilityCount,
      unsupportedAbilityKeys:
        battle.specialAbilityRuntime
          .unsupportedAbilityKeys,
    },
  );
  return battle.specialAbilityRuntime;
}

export function prepareParticipantSpecialAfterBattle(
  participant,
) {
  return applySpecialBattleEndRecovery(
    participant,
  );
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
  tournamentType = null,
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

  const skills = member.skills.map((rawSkill) => {
    const skill = normalizeUniqueSkill(rawSkill);
    const level = Math.max(1, Math.min(5, Number(skill.level) || 1));
    const levelSteps = level - 1;
    const skillCooldownRate = 1 - levelSteps * 0.025;
    return {
      skillId: skill.skillId,
      name:
        typeof skill.customName === "string" && skill.customName.trim()
          ? skill.customName.trim()
          : skill.name,
      defaultName: skill.name,
      customName: skill.customName ?? null,
      level,
      powerMultiplier: 1 + levelSteps * 0.035,
      type: skill.type,
      target: skill.target,
      baseCt: Math.max(
        2.8,
        Math.round(
          skill.baseCt *
            skillCooldownRate *
            (1 - clamp(((battleStats.agility ?? 1) + (battleStats.mind ?? 1) - 2) / 520, 0, 0.16)) *
            (0.96 + ((String(member.playerId).charCodeAt(String(member.playerId).length - 1) || 0) % 9) * 0.01) *
            100,
        ) / 100,
      ),
      originalBaseCt: skill.baseCt,
      unavoidable: skill.unavoidable === true,
      usesAmmo: skill.usesAmmo === true,
      source: skill.source ?? "entry",
      accuracyModifier: skill.accuracyModifier ?? 0,
      agilityPenalty: skill.agilityPenalty ?? 0,
      durationSeconds: skill.durationSeconds ?? 0,
      balanceStatus: skill.balanceStatus ?? null,
    };
  });

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
  const preferredDistance =
    resolvePreferredDistance(member);
  const specialProfile =
    compileSpecialAbilityProfile(member, {
      tournamentType,
      preferredRange: preferredDistance,
    });
  const previouslyAppliedMaxHpBonus =
    runtimeMember.specialMaxHpBonusApplied ?? 0;
  const newlyAppliedMaxHpBonus = Math.max(
    0,
    specialProfile.maxHpBonus -
      previouslyAppliedMaxHpBonus,
  );
  specialProfile.maxHpBonus =
    newlyAppliedMaxHpBonus;
  const averagePlayerStat =
    STAT_IDS.reduce(
      (sum, statId) => sum + Number(battleStats[statId] ?? 1),
      0,
    ) / STAT_IDS.length;
  const playerDevelopmentMastery =
    team.isPlayer === true
      ? clamp((averagePlayerStat - 18) / 55, 0, 1)
      : 0;

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
    isPlayerTeam: team.isPlayer === true,
    playerDevelopmentMastery,
    playerMasteryDamageMultiplier:
      1 + playerDevelopmentMastery * 0.12,
    playerMasteryAccuracy:
      playerDevelopmentMastery * 0.05,
    playerMasteryDamageReduction:
      playerDevelopmentMastery * 0.08,
    battleStats: deepClone(battleStats),
    strategyStatBonus: modifiers.statBonus,
    strategyRangeDamage: modifiers.rangeDamage,
    strategyAllRangeDamage: modifiers.allRangeDamage,
    firstHitDamageRate: modifiers.firstHitDamage,
    firstHitDamageAvailable: modifiers.firstHitDamage > 0,
    maxHp: runtimeMember.maxHp ?? member.maxHp,
    hp: currentHp,
    specialMaxHpBonusApplied:
      previouslyAppliedMaxHpBonus +
      newlyAppliedMaxHpBonus,
    combatState,
    downedAt: combatState === "down" ? 0 : null,
    preferredDistance,
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
    specialProfile,
    nextBattleOpeningEffects:
      deepClone(runtimeMember.nextBattleOpeningEffects ?? []),
    specialTransient: {
      hitStreak: 0,
      nextNormalAim: 0,
      allyDownCallUses: 0,
    },
    reviveSkillUses: 0,
    unappliedSpecialAbilityKeys:
      deepClone(specialProfile.unsupportedAbilityKeys),
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
  ).filter((target) =>
    target.downedAt === null ||
    battle.elapsedSeconds - target.downedAt >=
      BATTLE_ACTION_BALANCE.finishDownedGraceSeconds
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
      const profile = actor.specialProfile;
      const marked = battle.markedTargets?.[target.playerId];
      const markedPriority =
        marked &&
        marked.teamId === actor.teamId &&
        marked.expiresAt >= battle.elapsedSeconds
          ? marked.targetPriority ?? 0
          : 0;
      const memory = battle.teamTargetMemory?.[actor.teamId];
      const followPriority =
        memory &&
        memory.targetPlayerId === target.playerId &&
        memory.actorPlayerId !== actor.playerId
          ? Math.max(
              0,
              ...(profile?.followAllyTarget ?? [])
                .filter((entry) =>
                  battle.elapsedSeconds - memory.time <= entry.window,
                )
                .map((entry) => entry.targetPriority ?? 0),
            )
          : 0;
      const lowHpPriority =
        profile?.aiDecision?.lowHpTargetPriority ?? 0;
      return {
        value: target,
        weight:
          1 +
          (1 - hpRate) *
            (
              BATTLE_ACTION_BALANCE.lowHpTargetWeight +
              lowHpPriority
            ) +
          chooseRoleTargetWeight(actor, target) +
          markedPriority +
          followPriority,
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
  target.downedAt = null;
  target.downedByPlayerId = null;
  target.downedByTeamId = null;
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

function tryEmergencySupportRevive(battle, downedTarget) {
  const support = getTeamParticipants(battle, downedTarget.teamId, "alive")
    .find((member) =>
      member.role === "SUP" &&
      (member.reviveSkillUses ?? 0) < 1 &&
      member.skills.some((skill) => skill.skillId === "sup_respawn_field"),
    );
  if (!support) return null;
  const skill = support.skills.find((entry) => entry.skillId === "sup_respawn_field");
  support.reviveSkillUses = (support.reviveSkillUses ?? 0) + 1;
  support.stats.skillUses += 1;
  support.skillCharge[skill.skillId] = 0;
  appendBattleEvent(battle, "skill_cutin", {
    actorPlayerId: support.playerId,
    actorTeamId: support.teamId,
    targetPlayerId: downedTarget.playerId,
    targetTeamId: downedTarget.teamId,
    skillId: skill.skillId,
    skillName: skill.name,
    emergency: true,
  });
  const result = reviveParticipant(
    battle,
    support,
    downedTarget,
    skill.reviveHpRate ?? STATE_RULES.reviveFieldBaseHpRate,
    skill.skillId,
    skill.name,
  );
  appendBattleEvent(battle, "skill_revive", {
    actorPlayerId: support.playerId,
    actorTeamId: support.teamId,
    skillId: skill.skillId,
    skillName: skill.name,
    results: result ? [result] : [],
    emergency: true,
  });
  return result;
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
    attackerPierceRate = 0,
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
        getDamageTakenMultiplier(
          target,
          { attackerPierceRate },
        ),
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
    target.downedAt = battle.elapsedSeconds;
    target.downedByPlayerId = actor.playerId;
    target.downedByTeamId = actor.teamId;
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
    applySpecialOnAllyDown(
      battle,
      target,
    );
    tryEmergencySupportRevive(
      battle,
      target,
    );
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
  battle,
  actor,
  target,
  {
    multiplier = 1,
    critical = false,
    skillId = null,
    area = false,
    normal = false,
  } = {},
) {
  const effectiveStats =
    getEffectiveBattleStats(actor);
  const special =
    getSpecialAttackModifiers(
      battle,
      actor,
      target,
      {
        skillId,
        area,
        normal,
      },
    );
  let temporaryMultiplier =
    getDamageDealtMultiplier(actor) *
    (actor.playerMasteryDamageMultiplier ?? 1) *
    special.damageMultiplier;
  if (actor.firstHitDamageAvailable) {
    temporaryMultiplier *=
      1 + actor.firstHitDamageRate;
  }
  return {
    damage: calculateBaseDamage({
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
    }),
    special,
  };
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

  const effectiveStats =
    getEffectiveBattleStats(actor);
  const fireRateValue =
    Number(actor.weapon.values.fireRate) || 1;
  const requestedBurst =
    2 + Math.floor(fireRateValue / 38);
  const burstCount = Math.max(
    1,
    Math.min(
      4,
      actor.weapon.ammo,
      requestedBurst,
    ),
  );
  const damageScaleByBurst = {
    1: 1,
    2: 0.48,
    3: 0.32,
    4: 0.24,
  };
  const bulletDamageScale =
    damageScaleByBurst[burstCount] ??
    1 / burstCount;

  if (nextBattleRandom(battle) < 0.58) {
    appendBattleEvent(
      battle,
      "combat_strafe",
      {
        actorPlayerId: actor.playerId,
        actorTeamId: actor.teamId,
        targetPlayerId: target.playerId,
        targetTeamId: target.teamId,
        direction:
          nextBattleRandom(battle) < 0.5
            ? "up"
            : "down",
      },
    );
  }

  appendBattleEvent(
    battle,
    "burst_fire_start",
    {
      actorPlayerId: actor.playerId,
      actorTeamId: actor.teamId,
      targetPlayerId: target.playerId,
      targetTeamId: target.teamId,
      weaponId: actor.weapon.weaponId,
      weaponName: actor.weapon.weaponName,
      burstCount,
      ammoBefore: actor.weapon.ammo,
    },
  );

  let hitCount = 0;
  let totalDamage = 0;
  let firstAppliedDamage = false;
  let lastResult = {
    applied: false,
    actualDamage: 0,
  };

  for (
    let bulletIndex = 0;
    bulletIndex < burstCount;
    bulletIndex += 1
  ) {
    if (
      actor.weapon.ammo <= 0 ||
      target.combatState === "dead"
    ) {
      break;
    }

    actor.weapon.ammo -= 1;
    actor.stats.shots += 1;
    actor.stats.weaponShots += 1;
    battle.teamStats[actor.teamId].shots += 1;

    const currentTargetStats =
      getEffectiveBattleStats(target);
    const special =
      getSpecialAttackModifiers(
        battle,
        actor,
        target,
        {
          normal: true,
        },
      );
    const recoilPenalty =
      bulletIndex * 0.012;
    const hitChance = Math.max(
      0.05,
      Math.min(
        0.995,
        (
          target.combatState === "down"
            ? 1
            : calculateHitChance({
                actorStats: effectiveStats,
                targetStats:
                  currentTargetStats,
                weaponRangeValue:
                  attackWeaponRangeValue(actor),
                rangeModifier:
                  distanceAccuracyModifier(actor),
                temporaryModifier:
                  getTemporaryAccuracyModifier(actor) +
                  (actor.playerMasteryAccuracy ?? 0) +
                  special.accuracyModifier -
                  recoilPenalty,
              })
        ),
      ),
    );
    const hit =
      nextBattleRandom(battle) < hitChance;

    if (hit) {
      hitCount += 1;
      actor.stats.hits += 1;
      actor.stats.weaponHits += 1;
      battle.teamStats[actor.teamId].hits += 1;

      const critical =
        target.combatState === "alive" &&
        nextBattleRandom(battle) <
          calculateCriticalChance(
            effectiveStats,
          );
      if (critical) {
        actor.stats.criticalHits += 1;
      }

      const attack =
        calculateAttackDamage(
          battle,
          actor,
          target,
          {
            critical,
            normal: true,
          },
        );
      const bulletDamage = Math.max(
        1,
        Math.round(
          attack.damage *
          bulletDamageScale,
        ),
      );
      lastResult = applyBattleDamage(
        battle,
        actor,
        target,
        bulletDamage,
        {
          sourceType: "normal_attack",
          sourceId:
            actor.weapon.weaponId,
          sourceName:
            actor.weapon.weaponName,
          critical,
          attackerPierceRate:
            attack.special.pierceRate,
        },
      );
      const actualDamage =
        lastResult.actualDamage ?? 0;
      totalDamage += actualDamage;
      actor.stats.weaponDamage +=
        actualDamage;
      if (
        lastResult.applied &&
        !firstAppliedDamage
      ) {
        consumeFirstHitEffect(
          battle,
          actor,
        );
        firstAppliedDamage = true;
      }

      appendBattleEvent(
        battle,
        "normal_attack_hit",
        {
          actorPlayerId: actor.playerId,
          actorTeamId: actor.teamId,
          targetPlayerId: target.playerId,
          targetTeamId: target.teamId,
          hitChance,
          critical,
          ammo: actor.weapon.ammo,
          damage: actualDamage,
          burstIndex: bulletIndex + 1,
          burstCount,
          specialDamageMultiplier:
            attack.special
              .damageMultiplier,
        },
      );
    } else {
      actor.stats.misses += 1;
      appendBattleEvent(
        battle,
        "normal_attack_miss",
        {
          actorPlayerId: actor.playerId,
          actorTeamId: actor.teamId,
          targetPlayerId: target.playerId,
          targetTeamId: target.teamId,
          hitChance,
          ammo: actor.weapon.ammo,
          burstIndex: bulletIndex + 1,
          burstCount,
        },
      );
      if (
        bulletIndex === 0 &&
        target.combatState === "alive"
      ) {
        appendBattleEvent(
          battle,
          "evasive_dodge",
          {
            actorPlayerId:
              target.playerId,
            actorTeamId:
              target.teamId,
            targetPlayerId:
              actor.playerId,
            targetTeamId:
              actor.teamId,
            direction:
              nextBattleRandom(battle) < 0.5
                ? "up"
                : "down",
          },
        );
      }
    }

    recordSpecialAttackOutcome(
      battle,
      actor,
      target,
      {
        hit,
        normal: true,
      },
    );
  }

  appendBattleEvent(
    battle,
    "burst_fire_end",
    {
      actorPlayerId: actor.playerId,
      actorTeamId: actor.teamId,
      targetPlayerId: target.playerId,
      targetTeamId: target.teamId,
      weaponId: actor.weapon.weaponId,
      weaponName: actor.weapon.weaponName,
      burstCount,
      hitCount,
      totalDamage,
      ammo: actor.weapon.ammo,
    },
  );

  actor.attackCooldown =
    roundTime(
      calculateAttackInterval(
        actor.weapon.values.fireRate,
        effectiveStats.agility,
      ),
    );
  maybeStartReload(
    battle,
    actor,
  );

  return {
    performed: true,
    hit: hitCount > 0,
    targetPlayerId:
      target.playerId,
    burstCount,
    hitCount,
    totalDamage,
    ammo: actor.weapon.ammo,
    ...lastResult,
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
  applySpecialAfterHeal(
    actor,
    target,
    addOrRefreshEffect,
  );
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
  target.downedAt = null;
  target.downedByPlayerId = null;
  target.downedByTeamId = null;
  target.hp = calculateReviveHp(
    target.maxHp,
    reviveRate,
  );
  target.lifeSerial += 1;
  target.lifeId =
    `${target.playerId}-life-${target.lifeSerial}`;
  target.damageContributors = {};
  target.stats.timesRevived += 1;
  target.postReviveRecoveryPending =
    target.skills.length >= 3;
  target.postReviveRecoverySkillId =
    target.skills[2]?.skillId ?? null;
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
  applySpecialAfterRevive(
    battle,
    actor,
    target,
    addOrRefreshEffect,
  );
  return {
    targetPlayerId: target.playerId,
    hp: target.hp,
  };
}

function executePostReviveRecovery(
  battle,
  actor,
) {
  if (
    actor.combatState !== "alive" ||
    actor.postReviveRecoveryPending !== true
  ) {
    return null;
  }

  const skill =
    actor.skills[2] ??
    actor.skills.at(-1) ??
    null;
  actor.postReviveRecoveryPending = false;
  actor.postReviveRecoverySkillId = null;
  if (!skill) {
    return null;
  }

  appendBattleEvent(
    battle,
    "skill_cutin",
    {
      actorPlayerId: actor.playerId,
      actorTeamId: actor.teamId,
      targetPlayerId: actor.playerId,
      targetTeamId: actor.teamId,
      skillId: skill.skillId,
      skillName:
        `${skill.name}・復帰リカバリー`,
      postReviveRecovery: true,
    },
  );

  useSkillCharge(actor, skill);
  const recoveryAmount =
    Math.max(
      1,
      Math.round(
        actor.maxHp *
        Math.min(
          0.34,
          0.28 * (skill.powerMultiplier ?? 1),
        ),
      ),
    );
  const healing =
    healParticipant(
      battle,
      actor,
      actor,
      recoveryAmount,
      skill.skillId,
      `${skill.name}・復帰リカバリー`,
    );

  addOrRefreshEffect(actor, {
    code: "post_revive_guard",
    sourcePlayerId: actor.playerId,
    remainingSeconds: 3,
    damageReduction: 0.18,
  });

  appendBattleEvent(
    battle,
    "post_revive_recovery",
    {
      actorPlayerId: actor.playerId,
      actorTeamId: actor.teamId,
      targetPlayerId: actor.playerId,
      targetTeamId: actor.teamId,
      skillId: skill.skillId,
      skillName:
        `${skill.name}・復帰リカバリー`,
      healing,
      guardSeconds: 3,
    },
  );

  return {
    performed: true,
    skillId: skill.skillId,
    healing,
    postReviveRecovery: true,
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
  const modifiers =
    getSpecialSkillModifiers(
      actor,
      skill.skillId,
    );
  const lowAlly =
    targets.some(
      (target) =>
        target.maxHp > 0 &&
        target.hp / target.maxHp <=
          0.4,
    );
  const lowEntries =
    lowAlly
      ? actor.specialProfile
          ?.callLowAlly ?? []
      : [];
  const lowStats = {};
  let lowReduction = 0;
  for (const entry of lowEntries) {
    for (const [statId, amount] of Object.entries(
      entry.stats ?? {},
    )) {
      lowStats[statId] =
        (lowStats[statId] ?? 0) +
        amount;
    }
    lowReduction = Math.max(
      lowReduction,
      entry.damageReduction ?? 0,
    );
  }

  useSkillCharge(actor, skill);
  const duration =
    (
      BATTLE_ACTION_BALANCE.callBuff
        .durationSeconds +
      modifiers.callDurationBonus
    ) * (skill.powerMultiplier ?? 1);
  for (const target of targets) {
    addOrRefreshEffect(target, {
      code: "igl_battle_call",
      sourcePlayerId: actor.playerId,
      remainingSeconds: duration,
      stats: {
        aim:
          BATTLE_ACTION_BALANCE
            .callBuff.aim +
          (
            modifiers.callBuffStats
              .aim ?? 0
          ) +
          (lowStats.aim ?? 0),
        mind:
          BATTLE_ACTION_BALANCE
            .callBuff.mind +
          (
            modifiers.callBuffStats
              .mind ?? 0
          ) +
          (lowStats.mind ?? 0),
        ...Object.fromEntries(
          Object.entries({
            ...modifiers.callBuffStats,
            ...lowStats,
          }).filter(
            ([statId]) =>
              !["aim", "mind"].includes(statId),
          ),
        ),
      },
      damageReduction:
        modifiers.callDamageReduction +
        lowReduction,
    });
  }
  applySpecialOnCall(
    battle,
    actor,
    addOrRefreshEffect,
  );
  appendBattleEvent(battle, "skill_buff", {
    actorPlayerId: actor.playerId,
    actorTeamId: actor.teamId,
    skillId: skill.skillId,
    skillName: skill.name,
    targetPlayerIds: targets.map(
      (target) => target.playerId,
    ),
    duration,
    specialAbilityApplied:
      modifiers.callDurationBonus > 0 ||
      Object.keys(
        modifiers.callBuffStats,
      ).length > 0 ||
      lowEntries.length > 0,
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

  const effectiveStats =
    getEffectiveBattleStats(actor);
  const special =
    getSpecialAttackModifiers(
      battle,
      actor,
      target,
      {
        skillId: skill.skillId,
      },
    );
  const hitChance = unavoidable
    ? 1
    : calculateHitChance({
        actorStats: effectiveStats,
        targetStats:
          getEffectiveBattleStats(target),
        weaponRangeValue:
          attackWeaponRangeValue(actor),
        rangeModifier:
          distanceAccuracyModifier(actor),
        temporaryModifier:
          getTemporaryAccuracyModifier(actor) +
          (actor.playerMasteryAccuracy ?? 0) +
          0.03 +
          special.accuracyModifier,
      });
  const hit =
    unavoidable ||
    nextBattleRandom(battle) <
      hitChance;

  useSkillCharge(actor, skill);
  let result = {
    applied: false,
    actualDamage: 0,
  };
  if (hit) {
    const critical =
      nextBattleRandom(battle) <
      calculateCriticalChance(
        effectiveStats,
      );
    const attack =
      calculateAttackDamage(
        battle,
        actor,
        target,
        {
          multiplier:
            multiplier * (skill.powerMultiplier ?? 1),
          critical,
          skillId: skill.skillId,
        },
      );
    result = applyBattleDamage(
      battle,
      actor,
      target,
      attack.damage,
      {
        sourceType: "skill",
        sourceId: skill.skillId,
        sourceName: skill.name,
        critical,
        attackerPierceRate:
          attack.special.pierceRate,
      },
    );
    consumeFirstHitEffect(
      battle,
      actor,
    );
  }
  recordSpecialAttackOutcome(
    battle,
    actor,
    target,
    {
      hit,
      skillId: skill.skillId,
    },
  );

  appendBattleEvent(
    battle,
    hit
      ? "skill_attack_hit"
      : "skill_attack_miss",
    {
      actorPlayerId: actor.playerId,
      actorTeamId: actor.teamId,
      targetPlayerId: target.playerId,
      targetTeamId: target.teamId,
      skillId: skill.skillId,
      skillName: skill.name,
      hitChance,
      damage:
        result.actualDamage ?? 0,
    },
  );

  return {
    performed: true,
    skillId: skill.skillId,
    hit,
    targetPlayerId:
      target.playerId,
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
    getEnemyTeamId(
      battle,
      actor.teamId,
    ),
    "alive",
  );
  if (targets.length === 0) {
    return null;
  }
  useSkillCharge(actor, skill);
  const results = [];
  const skillModifiers =
    getSpecialSkillModifiers(
      actor,
      skill.skillId,
    );

  for (const target of targets) {
    const special =
      getSpecialAttackModifiers(
        battle,
        actor,
        target,
        {
          skillId: skill.skillId,
          area: true,
        },
      );
    const hitChance =
      calculateHitChance({
        actorStats:
          getEffectiveBattleStats(actor),
        targetStats:
          getEffectiveBattleStats(target),
        weaponRangeValue:
          attackWeaponRangeValue(actor),
        rangeModifier:
          distanceAccuracyModifier(actor),
        temporaryModifier:
          getTemporaryAccuracyModifier(actor) +
          (actor.playerMasteryAccuracy ?? 0) +
          special.accuracyModifier,
      });
    const hit =
      nextBattleRandom(battle) <
      hitChance;
    if (!hit) {
      recordSpecialAttackOutcome(
        battle,
        actor,
        target,
        {
          hit: false,
          skillId: skill.skillId,
        },
      );
      results.push({
        targetPlayerId:
          target.playerId,
        hit: false,
        damage: 0,
      });
      continue;
    }

    const attack =
      calculateAttackDamage(
        battle,
        actor,
        target,
        {
          multiplier:
            BATTLE_ACTION_BALANCE
              .smokeLauncher
              .damageMultiplier *
            (skill.powerMultiplier ?? 1),
          skillId: skill.skillId,
          area: true,
        },
      );
    const damageResult =
      applyBattleDamage(
        battle,
        actor,
        target,
        attack.damage,
        {
          sourceType: "skill",
          sourceId: skill.skillId,
          sourceName: skill.name,
          attackerPierceRate:
            attack.special.pierceRate,
        },
      );
    const debuffChance = clamp(
      BATTLE_ACTION_BALANCE
        .smokeLauncher
        .accuracyDebuffChance +
      skillModifiers
        .smokeSuccessPoints /
        100,
      0,
      1,
    );
    if (
      nextBattleRandom(battle) <
      debuffChance
    ) {
      const adjusted =
        adjustDebuffForSpecialAbility(
          target,
          {
            duration:
              BATTLE_ACTION_BALANCE
                .smokeLauncher
                .debuffDurationSeconds +
              skillModifiers
                .smokeDurationBonus,
            accuracyModifier:
              BATTLE_ACTION_BALANCE
                .smokeLauncher
                .accuracyDebuff,
          },
        );
      addOrRefreshEffect(target, {
        code:
          "smoke_accuracy_down",
        sourcePlayerId:
          actor.playerId,
        remainingSeconds:
          adjusted.duration,
        accuracyModifier:
          adjusted.accuracyModifier,
      });
    }
    consumeFirstHitEffect(
      battle,
      actor,
    );
    recordSpecialAttackOutcome(
      battle,
      actor,
      target,
      {
        hit: true,
        skillId: skill.skillId,
      },
    );
    results.push({
      targetPlayerId:
        target.playerId,
      hit: true,
      damage:
        damageResult.actualDamage ?? 0,
    });
  }

  appendBattleEvent(
    battle,
    "skill_area_attack",
    {
      actorPlayerId: actor.playerId,
      actorTeamId: actor.teamId,
      skillId: skill.skillId,
      skillName: skill.name,
      results,
    },
  );

  return {
    performed: true,
    skillId: skill.skillId,
    results,
  };
}

function executePrisonBreaker(
  battle,
  actor,
  skill,
) {
  const targets = getTeamParticipants(
    battle,
    getEnemyTeamId(
      battle,
      actor.teamId,
    ),
    "alive",
  );
  if (targets.length === 0) {
    return null;
  }
  useSkillCharge(actor, skill);
  for (const target of targets) {
    const adjusted =
      adjustDebuffForSpecialAbility(
        target,
        {
          duration:
            skill.durationSeconds,
          accuracyModifier:
            skill.accuracyModifier,
        },
      );
    addOrRefreshEffect(target, {
      code:
        "prison_breaker_debuff",
      sourcePlayerId:
        actor.playerId,
      remainingSeconds:
        adjusted.duration,
      stats: {
        agility:
          skill.agilityPenalty,
      },
      accuracyModifier:
        adjusted.accuracyModifier,
    });
  }
  appendBattleEvent(
    battle,
    "skill_area_debuff",
    {
      actorPlayerId:
        actor.playerId,
      actorTeamId:
        actor.teamId,
      skillId:
        skill.skillId,
      skillName:
        skill.name,
      targetPlayerIds:
        targets.map(
          (target) =>
            target.playerId,
        ),
      duration:
        skill.durationSeconds,
      balanceStatus:
        skill.balanceStatus,
    },
  );
  return {
    performed: true,
    skillId: skill.skillId,
    targetPlayerIds:
      targets.map(
        (target) =>
          target.playerId,
      ),
  };
}

function executeShieldCharge(
  battle,
  actor,
  skill,
) {
  const target =
    lowestHpAliveAlly(
      battle,
      actor,
    );
  if (
    !target ||
    target.hp / target.maxHp >
      (
        skill
          .waitWhileAllAboveHpRate ??
        0.85
      )
  ) {
    return null;
  }

  useSkillCharge(actor, skill);
  const modifiers =
    getSpecialSkillModifiers(
      actor,
      skill.skillId,
    );
  const rate =
    calculateShieldHealRate(
      getEffectiveBattleStats(actor)
        .support,
    );
  const amount =
    healParticipant(
      battle,
      actor,
      target,
      (
        target.maxHp * rate +
        modifiers.healPoints
      ) * (skill.powerMultiplier ?? 1),
      skill.skillId,
      skill.name,
    );
  appendBattleEvent(
    battle,
    "skill_heal",
    {
      actorPlayerId:
        actor.playerId,
      actorTeamId:
        actor.teamId,
      skillId:
        skill.skillId,
      skillName:
        skill.name,
      targetPlayerIds: [
        target.playerId,
      ],
      totalHealing: amount,
    },
  );
  return {
    performed: true,
    skillId: skill.skillId,
    targetPlayerIds: [
      target.playerId,
    ],
    totalHealing: amount,
  };
}

function executeDroneHeal(
  battle,
  actor,
  skill,
) {
  const targets =
    getTeamParticipants(
      battle,
      actor.teamId,
      "alive",
    ).filter(
      (target) =>
        target.hp < target.maxHp,
    );
  if (targets.length === 0) {
    return null;
  }
  useSkillCharge(actor, skill);
  const modifiers =
    getSpecialSkillModifiers(
      actor,
      skill.skillId,
    );
  const support =
    getEffectiveBattleStats(actor)
      .support;
  const normalized =
    (
      support -
      BATTLE_LIMITS.playerStatMin
    ) /
    (
      BATTLE_LIMITS.playerStatMax -
      BATTLE_LIMITS.playerStatMin
    );
  const rate =
    BATTLE_ACTION_BALANCE
      .droneHeal.minimumHpRate +
    clamp(normalized, 0, 1) *
      (
        BATTLE_ACTION_BALANCE
          .droneHeal
          .maximumHpRate -
        BATTLE_ACTION_BALANCE
          .droneHeal
          .minimumHpRate
      );
  const lowest = [...targets]
    .sort(
      (left, right) =>
        left.hp / left.maxHp -
        right.hp / right.maxHp,
    )[0];
  const results =
    targets.map((target) => {
      let points =
        modifiers.healPoints;
      if (
        target.playerId ===
        lowest.playerId
      ) {
        points +=
          modifiers
            .lowestHpHealPoints;
      }
      for (
        const critical
        of modifiers
          .criticalAllyHeal
      ) {
        if (
          target.hp /
            target.maxHp <=
          critical.hpRate
        ) {
          points +=
            critical.points;
        }
      }
      return {
        targetPlayerId:
          target.playerId,
        healing:
          healParticipant(
            battle,
            actor,
            target,
            (
              target.maxHp *
                rate +
              points
            ) * (skill.powerMultiplier ?? 1),
            skill.skillId,
            skill.name,
          ),
      };
    });
  appendBattleEvent(
    battle,
    "skill_team_heal",
    {
      actorPlayerId:
        actor.playerId,
      actorTeamId:
        actor.teamId,
      skillId:
        skill.skillId,
      skillName:
        skill.name,
      results,
    },
  );
  return {
    performed: true,
    skillId: skill.skillId,
    results,
    totalHealing:
      results.reduce(
        (sum, result) =>
          sum +
          result.healing,
        0,
      ),
  };
}

function executeRespawnField(
  battle,
  actor,
  skill,
) {
  if ((actor.reviveSkillUses ?? 0) >= 1) {
    return null;
  }
  const targets =
    getTeamParticipants(
      battle,
      actor.teamId,
      "down",
    );
  if (targets.length === 0) {
    return null;
  }
  useSkillCharge(actor, skill);
  actor.reviveSkillUses = (actor.reviveSkillUses ?? 0) + 1;
  const modifiers =
    getSpecialSkillModifiers(
      actor,
      skill.skillId,
    );
  const reviveRate =
    Math.min(
      0.6,
      (
        modifiers.reviveRateOverride ??
        skill.reviveHpRate ??
        STATE_RULES
          .reviveFieldBaseHpRate
      ) +
      ((skill.powerMultiplier ?? 1) - 1) * 0.2,
    );
  const results =
    targets
      .map((target) => {
        const result =
          reviveParticipant(
            battle,
            actor,
            target,
            reviveRate,
            skill.skillId,
            skill.name,
          );
        if (
          result &&
          modifiers
            .reviveHpPoints > 0
        ) {
          const extra =
            Math.min(
              target.maxHp -
                target.hp,
              modifiers
                .reviveHpPoints,
            );
          target.hp += extra;
          result.hp =
            target.hp;
          result.extraHealing =
            extra;
        }
        return result;
      })
      .filter(Boolean);
  appendBattleEvent(
    battle,
    "skill_revive",
    {
      actorPlayerId:
        actor.playerId,
      actorTeamId:
        actor.teamId,
      skillId:
        skill.skillId,
      skillName:
        skill.name,
      results,
    },
  );
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
          ? 100 +
            (actor.specialProfile?.aiDecision?.revivePriority ? 25 : 0)
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
        skill.skillId === "prison_breaker"
      ) {
        priority = getTeamParticipants(
          battle,
          getEnemyTeamId(
            battle,
            actor.teamId,
          ),
          "alive",
        ).length > 0
          ? 65
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
    case "prison_breaker":
      return executePrisonBreaker(
        battle,
        actor,
        skill,
      );
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
  applySpecialAfterRangeMove(
    participant,
    addOrRefreshEffect,
  );
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
  refreshSpecialDynamicEffects(
    battle,
    participant,
    addOrRefreshEffect,
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
        const ctSpeedBonus =
          activeEffects(participant).reduce(
            (sum, effect) =>
              sum + (effect.ctSpeed ?? 0),
            0,
          );
        participant.skillCharge[skill.skillId] =
          roundTime(
            (participant.skillCharge[skill.skillId] ?? 0) +
              tickSeconds *
                (1 + Math.max(-0.9, ctSpeedBonus)),
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

  const recoveryResult =
    executePostReviveRecovery(
      battle,
      participant,
    );
  if (recoveryResult?.performed) {
    return {
      actionType: "post_revive_recovery",
      ...recoveryResult,
    };
  }

  const skillResult = performSkillAction(
    battle,
    participant,
  );
  if (skillResult?.performed) {
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
  participant.downedAt = null;
  participant.hp =
    STATE_RULES.downRecoveryHpAfterBattle;
  participant.lifeSerial += 1;
  participant.lifeId =
    `${participant.playerId}-life-${participant.lifeSerial}`;
  participant.damageContributors = {};
  return true;
}
