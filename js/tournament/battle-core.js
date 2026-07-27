/**
 * MOB BR deterministic 3v3 battle engine.
 *
 * The engine advances in fixed 0.1-second ticks for a maximum of 10 seconds.
 * It produces a pure serializable battle state and then synchronizes the
 * finished result into the tournament runtime through one transaction draft.
 */

import {
  BATTLE_END_TIE_BREAKERS,
  BATTLE_TIMING,
  STATE_RULES,
} from "../../data/battle-config.js";
import {
  calculateChecksum,
} from "../main/state.js";
import {
  BATTLE_ACTIONS_VERSION,
  appendBattleEvent,
  createBattleParticipant,
  getTeamParticipants,
  nextBattleRandom,
  processParticipantTurn,
  recoverDownedAfterBattle,
  updateParticipantTimers,
} from "./battle-actions.js";

export const BATTLE_CORE_VERSION =
  "mobbr-battle-core-1.1.0";
export const BATTLE_STATE_SCHEMA_VERSION =
  "mobbr-battle-state-1.0.0";

const BATTLE_HISTORY_LIMIT = 100;

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

function assertPlainObject(value, label) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(`${label} must be an object.`);
  }
  return value;
}

function seedTextToUint32(seedText) {
  const text = String(seedText);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0 || 0x9e3779b9;
}

function battleChecksumPayload(battle) {
  const clone = deepClone(battle);
  delete clone.checksum;
  return clone;
}

export function calculateBattleChecksum(battle) {
  return calculateChecksum(
    battleChecksumPayload(battle),
  );
}

function getTeamRecord(runtime, teamId) {
  const team = runtime.teams.find(
    (candidate) => candidate.teamId === teamId,
  );
  if (!team) {
    throw new RangeError(
      `Tournament team is missing: ${teamId}`,
    );
  }
  return team;
}

function getStrategyEffect(runtime, teamId) {
  const strategyId =
    runtime.teamRuntime[teamId]?.currentStrategyId ??
    "D-01";
  return {
    strategyId,
    effect:
      runtime.strategyRuntime[strategyId]?.effect ??
      { type: "none" },
  };
}

function consumeStrategyForBattle(runtime, teamId) {
  const strategyId =
    runtime.teamRuntime[teamId]?.currentStrategyId ??
    "D-01";
  const strategy =
    runtime.strategyRuntime[strategyId];
  if (!strategy) {
    runtime.teamRuntime[teamId].currentStrategyId =
      "D-01";
    return {
      strategyId: "D-01",
      consumed: false,
      reason: "fallback_missing_strategy",
    };
  }
  if (strategy.unlimited) {
    strategy.uses += 1;
    runtime.teamRuntime[teamId].strategyConsumed = true;
    return {
      strategyId,
      consumed: false,
      unlimited: true,
    };
  }
  if (
    !Number.isInteger(strategy.tournamentRemaining) ||
    strategy.tournamentRemaining <= 0
  ) {
    runtime.teamRuntime[teamId].currentStrategyId =
      "D-01";
    runtime.teamRuntime[teamId].strategyConsumed = true;
    return {
      strategyId: "D-01",
      consumed: false,
      reason: "fallback_no_remaining",
    };
  }
  strategy.tournamentRemaining -= 1;
  strategy.uses += 1;
  runtime.teamRuntime[teamId].strategyConsumed = true;
  return {
    strategyId,
    consumed: true,
    remaining: strategy.tournamentRemaining,
  };
}

function teamBattlePower(battle, teamId) {
  return getTeamParticipants(battle, teamId).reduce(
    (sum, participant) =>
      sum +
      Object.values(participant.battleStats).reduce(
        (statSum, value) => statSum + value,
        0,
      ),
    0,
  );
}

function teamHpRate(battle, teamId) {
  const participants = getTeamParticipants(
    battle,
    teamId,
  );
  const current = participants.reduce(
    (sum, participant) =>
      sum + Math.max(0, participant.hp),
    0,
  );
  const maximum = participants.reduce(
    (sum, participant) =>
      sum + participant.maxHp,
    0,
  );
  return maximum <= 0 ? 0 : current / maximum;
}

function createTeamStats(teamId) {
  return {
    teamId,
    damage: 0,
    damageTaken: 0,
    healing: 0,
    shots: 0,
    hits: 0,
    downsGiven: 0,
    downsTaken: 0,
    confirmedKills: 0,
    deaths: 0,
    assists: 0,
    revives: 0,
    kp: 0,
  };
}

function createInitialParticipantStates(participants) {
  return Object.fromEntries(
    participants.map((participant) => [
      participant.playerId,
      {
        playerId: participant.playerId,
        teamId: participant.teamId,
        name: participant.name,
        role: participant.role,
        image: participant.image,
        weaponName: participant.weapon.weaponName,
        maxHp: participant.maxHp,
        hp: participant.hp,
        combatState: participant.combatState,
        ammoMax: participant.weapon.ammoMax,
        ammo: participant.weapon.ammo,
        reloadRemaining: participant.reloadRemaining,
        distance: participant.currentDistance,
        preferredDistance: participant.preferredDistance,
        skillCharge: deepClone(participant.skillCharge),
      },
    ]),
  );
}

function initialCombatants(
  runtime,
  team,
  side,
  strategyEffect,
) {
  return team.members.map((member, index) => {
    const runtimeMember =
      runtime.memberRuntime[member.playerId];
    if (!runtimeMember) {
      throw new RangeError(
        `Member runtime is missing: ${member.playerId}`,
      );
    }
    return createBattleParticipant({
      member,
      runtimeMember,
      team,
      side,
      strategyEffect,
      index,
    });
  });
}

export function createBattleFromTournamentRuntime(
  runtime,
  {
    battleId =
      `${runtime.runtimeId}-M${runtime.match}-R${runtime.round}`,
    allowFinishDowned = true,
    allowOpeningDraw = false,
  } = {},
) {
  assertPlainObject(runtime, "Tournament runtime");
  const leftTeamId = runtime.playerTeamId;
  const rightTeamId =
    runtime.currentOpponentId ??
    runtime.lockedOpponentId;
  if (!rightTeamId || rightTeamId === leftTeamId) {
    throw new RangeError(
      "A valid CPU opponent must be locked before battle.",
    );
  }

  const leftTeam = getTeamRecord(
    runtime,
    leftTeamId,
  );
  const rightTeam = getTeamRecord(
    runtime,
    rightTeamId,
  );
  const leftStrategy =
    getStrategyEffect(runtime, leftTeamId);
  const rightStrategy =
    getStrategyEffect(runtime, rightTeamId);

  const participants = [
    ...initialCombatants(
      runtime,
      leftTeam,
      "left",
      leftStrategy.effect,
    ),
    ...initialCombatants(
      runtime,
      rightTeam,
      "right",
      rightStrategy.effect,
    ),
  ];

  const battle = {
    schemaVersion: BATTLE_STATE_SCHEMA_VERSION,
    coreVersion: BATTLE_CORE_VERSION,
    actionsVersion: BATTLE_ACTIONS_VERSION,
    battleId,
    runtimeId: runtime.runtimeId,
    entryId: runtime.entryId,
    tournamentId: runtime.tournamentId,
    sessionId: runtime.sessionId,
    match: runtime.match,
    round: runtime.round,
    leftTeamId,
    rightTeamId,
    teamNames: {
      [leftTeamId]: leftTeam.teamName,
      [rightTeamId]: rightTeam.teamName,
    },
    strategies: {
      [leftTeamId]: leftStrategy.strategyId,
      [rightTeamId]: rightStrategy.strategyId,
    },
    durationSeconds:
      BATTLE_TIMING.durationSeconds,
    tickSeconds:
      BATTLE_TIMING.tickSeconds,
    elapsedSeconds: 0,
    tickCount: 0,
    status: "running",
    endReason: null,
    winnerTeamId: null,
    loserTeamId: null,
    draw: false,
    rules: {
      allowFinishDowned,
      allowOpeningDraw,
    },
    participants: Object.fromEntries(
      participants.map((participant) => [
        participant.playerId,
        participant,
      ]),
    ),
    initialParticipantStates:
      createInitialParticipantStates(participants),
    teamStats: {
      [leftTeamId]: createTeamStats(leftTeamId),
      [rightTeamId]: createTeamStats(rightTeamId),
    },
    events: [],
    randomState: {
      seed: `${runtime.entryId}|${runtime.runtimeId}|${runtime.match}|${runtime.round}|${leftTeamId}|${rightTeamId}`,
      state: seedTextToUint32(
        `${runtime.entryId}|${runtime.runtimeId}|${runtime.match}|${runtime.round}|${leftTeamId}|${rightTeamId}`,
      ),
      cursor: 0,
    },
    result: null,
    checksum: null,
  };

  appendBattleEvent(battle, "battle_start", {
    leftTeamId,
    rightTeamId,
    leftTeamName: leftTeam.teamName,
    rightTeamName: rightTeam.teamName,
    durationSeconds: battle.durationSeconds,
  });

  battle.checksum =
    calculateBattleChecksum(battle);
  validateBattleState(battle);
  return deepFreeze(battle);
}

function aliveCount(battle, teamId) {
  return getTeamParticipants(
    battle,
    teamId,
    "alive",
  ).length;
}

function compareTeamMetric(
  leftValue,
  rightValue,
) {
  if (leftValue > rightValue) return 1;
  if (rightValue > leftValue) return -1;
  return 0;
}

function resolveTimeLimitWinner(battle) {
  const leftId = battle.leftTeamId;
  const rightId = battle.rightTeamId;
  const comparisons = [
    {
      id: "aliveCount",
      left: aliveCount(battle, leftId),
      right: aliveCount(battle, rightId),
    },
    {
      id: "teamHpRate",
      left: teamHpRate(battle, leftId),
      right: teamHpRate(battle, rightId),
    },
    {
      id: "damageDealt",
      left: battle.teamStats[leftId].damage,
      right: battle.teamStats[rightId].damage,
    },
    {
      id: "downsGiven",
      left: battle.teamStats[leftId].downsGiven,
      right: battle.teamStats[rightId].downsGiven,
    },
    {
      id: "confirmedKills",
      left:
        battle.teamStats[leftId].confirmedKills,
      right:
        battle.teamStats[rightId].confirmedKills,
    },
    {
      id: "battlePower",
      left: teamBattlePower(battle, leftId),
      right: teamBattlePower(battle, rightId),
    },
  ];

  for (const comparison of comparisons) {
    const result = compareTeamMetric(
      comparison.left,
      comparison.right,
    );
    if (result !== 0) {
      return {
        winnerTeamId:
          result > 0 ? leftId : rightId,
        loserTeamId:
          result > 0 ? rightId : leftId,
        draw: false,
        tieBreaker: comparison.id,
        comparisons,
      };
    }
  }

  if (battle.rules.allowOpeningDraw) {
    return {
      winnerTeamId: null,
      loserTeamId: null,
      draw: true,
      tieBreaker: "opening_draw_allowed",
      comparisons,
    };
  }

  const winnerTeamId =
    nextBattleRandom(battle) < 0.5
      ? leftId
      : rightId;
  return {
    winnerTeamId,
    loserTeamId:
      winnerTeamId === leftId
        ? rightId
        : leftId,
    draw: false,
    tieBreaker: "stableRandom",
    comparisons,
  };
}

function finishBattle(
  battle,
  {
    endReason,
    winnerTeamId,
    loserTeamId,
    draw = false,
    tieBreaker = null,
    comparisons = null,
  },
) {
  if (battle.status !== "running") {
    return battle.result;
  }

  battle.status = "complete";
  battle.endReason = endReason;
  battle.winnerTeamId = winnerTeamId;
  battle.loserTeamId = loserTeamId;
  battle.draw = draw;

  appendBattleEvent(
    battle,
    draw ? "battle_draw" : "battle_complete",
    {
      endReason,
      winnerTeamId,
      loserTeamId,
      tieBreaker,
    },
  );

  const participantResults = Object.values(
    battle.participants,
  ).map((participant) => ({
    playerId: participant.playerId,
    teamId: participant.teamId,
    name: participant.name,
    role: participant.role,
    hp: participant.hp,
    maxHp: participant.maxHp,
    combatState: participant.combatState,
    distance: participant.currentDistance,
    ammo: participant.weapon.ammo,
    reloadRemaining:
      participant.reloadRemaining,
    skillCharge: deepClone(
      participant.skillCharge,
    ),
    stats: {
      ...deepClone(participant.stats),
      accuracy:
        participant.stats.shots === 0
          ? 0
          : Math.min(
              1,
              participant.stats.hits /
                participant.stats.shots,
            ),
    },
    lifeId: participant.lifeId,
    lifeSerial: participant.lifeSerial,
    unappliedSpecialAbilityKeys:
      deepClone(
        participant
          .unappliedSpecialAbilityKeys,
      ),
  }));

  const teamSummaries = Object.fromEntries(
    [battle.leftTeamId, battle.rightTeamId].map(
      (teamId) => [
        teamId,
        {
          teamId,
          teamName: battle.teamNames[teamId],
          aliveCount: aliveCount(battle, teamId),
          hpRate: teamHpRate(battle, teamId),
          battlePower:
            teamBattlePower(battle, teamId),
          ...deepClone(battle.teamStats[teamId]),
        },
      ],
    ),
  );

  battle.result = {
    battleId: battle.battleId,
    status: "complete",
    leftTeamId: battle.leftTeamId,
    rightTeamId: battle.rightTeamId,
    endReason,
    elapsedSeconds: battle.elapsedSeconds,
    tickCount: battle.tickCount,
    winnerTeamId,
    loserTeamId,
    draw,
    tieBreaker,
    comparisons,
    teamSummaries,
    initialParticipantStates:
      deepClone(battle.initialParticipantStates),
    participantResults,
    eventCount: battle.events.length,
  };
  battle.checksum =
    calculateBattleChecksum(battle);
  return battle.result;
}

export function evaluateBattleEnd(
  battle,
  {
    forceTimeLimit = false,
  } = {},
) {
  const leftAlive = aliveCount(
    battle,
    battle.leftTeamId,
  );
  const rightAlive = aliveCount(
    battle,
    battle.rightTeamId,
  );

  if (leftAlive === 0 || rightAlive === 0) {
    if (leftAlive === 0 && rightAlive === 0) {
      const resolved =
        resolveTimeLimitWinner(battle);
      return finishBattle(battle, {
        endReason: "both_sides_no_alive",
        ...resolved,
      });
    }
    return finishBattle(battle, {
      endReason: "all_alive_members_down",
      winnerTeamId:
        leftAlive > 0
          ? battle.leftTeamId
          : battle.rightTeamId,
      loserTeamId:
        leftAlive > 0
          ? battle.rightTeamId
          : battle.leftTeamId,
      draw: false,
      tieBreaker: "aliveCount",
    });
  }

  if (
    forceTimeLimit ||
    battle.elapsedSeconds >=
      battle.durationSeconds
  ) {
    const resolved =
      resolveTimeLimitWinner(battle);
    return finishBattle(battle, {
      endReason: "time_limit",
      ...resolved,
    });
  }

  return null;
}

function participantInitiative(participant) {
  return (
    participant.battleStats.agility * 10 +
    participant.battleStats.technique +
    (participant.role === "ATK"
      ? 2
      : participant.role === "IGL"
        ? 1
        : 0)
  );
}

export function tickBattle(battle) {
  validateBattleState(battle);
  if (battle.status !== "running") {
    return deepFreeze(deepClone(battle));
  }

  const draft = deepClone(battle);
  draft.tickCount += 1;

  const participants = Object.values(
    draft.participants,
  );
  for (const participant of participants) {
    updateParticipantTimers(
      draft,
      participant,
      draft.tickSeconds,
    );
  }

  const turnOrder = participants
    .filter(
      (participant) =>
        participant.combatState === "alive",
    )
    .sort((left, right) => {
      const initiativeDifference =
        participantInitiative(right) -
        participantInitiative(left);
      if (initiativeDifference !== 0) {
        return initiativeDifference;
      }
      return left.playerId.localeCompare(
        right.playerId,
      );
    });

  for (const participant of turnOrder) {
    if (draft.status !== "running") {
      break;
    }
    processParticipantTurn(
      draft,
      participant,
    );
    evaluateBattleEnd(draft);
  }

  draft.elapsedSeconds =
    Math.min(
      draft.durationSeconds,
      Math.round(
        (
          draft.elapsedSeconds +
          draft.tickSeconds
        ) * 1000,
      ) / 1000,
    );

  if (draft.status === "running") {
    evaluateBattleEnd(draft, {
      forceTimeLimit:
        draft.elapsedSeconds >=
        draft.durationSeconds,
    });
  }

  draft.checksum =
    calculateBattleChecksum(draft);
  validateBattleState(draft);
  return deepFreeze(draft);
}

export function runBattleToCompletion(
  battle,
  {
    maximumTicks = Math.ceil(
      BATTLE_TIMING.durationSeconds /
        BATTLE_TIMING.tickSeconds,
    ) + 2,
  } = {},
) {
  let current = deepClone(battle);
  let ticks = 0;
  while (
    current.status === "running" &&
    ticks < maximumTicks
  ) {
    current = deepClone(tickBattle(current));
    ticks += 1;
  }
  if (current.status === "running") {
    throw new Error(
      "Battle did not finish within the maximum tick count.",
    );
  }
  return deepFreeze(current);
}

export function prepareBattleForNextRound(
  battle,
) {
  const next = deepClone(battle);
  for (const participant of Object.values(
    next.participants,
  )) {
    recoverDownedAfterBattle(participant);
    participant.weapon.ammo =
      participant.weapon.ammoMax;
    participant.reloadRemaining = 0;
    participant.attackCooldown = 0;
    participant.effects = [];
  }
  next.checksum =
    calculateBattleChecksum(next);
  return deepFreeze(next);
}

function addMemberStats(
  runtimeMember,
  battleMember,
) {
  const fields = [
    "kills",
    "assists",
    "downsGiven",
    "deaths",
    "revives",
    "damage",
    "damageTaken",
    "healing",
    "shots",
    "hits",
    "skillUses",
    "survivalTime",
    "weaponShots",
    "weaponHits",
    "weaponDamage",
    "weaponReloads",
  ];
  for (const field of fields) {
    runtimeMember[field] =
      (runtimeMember[field] ?? 0) +
      (battleMember.stats[field] ?? 0);
  }
  runtimeMember.downCount =
    (runtimeMember.downCount ?? 0) +
    (battleMember.stats.downsTaken ?? 0);
  runtimeMember.deathCount =
    (runtimeMember.deathCount ?? 0) +
    (battleMember.stats.deaths ?? 0);
  runtimeMember.reviveCount =
    (runtimeMember.reviveCount ?? 0) +
    (battleMember.stats.timesRevived ?? 0);
}

function syncTeamRuntime(
  draft,
  battle,
  teamId,
) {
  const team = draft.teams.find(
    (candidate) => candidate.teamId === teamId,
  );
  const teamRuntime =
    draft.teamRuntime[teamId];
  const participants = team.members.map(
    (member) =>
      battle.participants[member.playerId],
  );
  teamRuntime.matchHp = participants.map(
    (participant) => participant.hp,
  );
  teamRuntime.persistentHp =
    participants.map(
      (participant) => participant.hp,
    );
  teamRuntime.combatState =
    participants.map(
      (participant) =>
        participant.combatState,
    );
  teamRuntime.skillCt =
    participants.map(
      (participant) =>
        deepClone(participant.skillCharge),
    );
  const summary =
    battle.result.teamSummaries[teamId];
  teamRuntime.kills +=
    summary.confirmedKills;
  teamRuntime.assists += summary.assists;
  teamRuntime.damage += summary.damage;
  teamRuntime.damageTaken +=
    summary.damageTaken;
}

export function applyBattleResultToTournamentRuntime(
  draft,
  battle,
) {
  assertPlainObject(draft, "Tournament runtime draft");
  validateBattleState(battle);
  if (
    battle.status !== "complete" ||
    !battle.result
  ) {
    throw new RangeError(
      "Only a completed battle can be synchronized.",
    );
  }

  draft.battleHistory =
    Array.isArray(draft.battleHistory)
      ? draft.battleHistory
      : [];
  if (
    draft.battleHistory.some(
      (record) =>
        record.battleId === battle.battleId,
    )
  ) {
    throw new RangeError(
      `Battle result was already applied: ${battle.battleId}`,
    );
  }

  const prepared =
    prepareBattleForNextRound(battle);
  for (const participantResult of battle.result.participantResults) {
    const runtimeMember =
      draft.memberRuntime[
        participantResult.playerId
      ];
    const preparedParticipant =
      prepared.participants[
        participantResult.playerId
      ];
    runtimeMember.hp =
      preparedParticipant.hp;
    runtimeMember.maxHp =
      preparedParticipant.maxHp;
    runtimeMember.combatState =
      preparedParticipant.combatState;
    runtimeMember.currentAmmo =
      preparedParticipant.weapon.ammo;
    runtimeMember.reloadRemaining = 0;
    runtimeMember.skillCt =
      deepClone(
        preparedParticipant.skillCharge,
      );
    runtimeMember.lifeId =
      preparedParticipant.lifeId;
    runtimeMember.lifeSerial =
      preparedParticipant.lifeSerial;
    addMemberStats(
      runtimeMember,
      participantResult,
    );
  }

  syncTeamRuntime(
    draft,
    prepared,
    battle.leftTeamId,
  );
  syncTeamRuntime(
    draft,
    prepared,
    battle.rightTeamId,
  );

  const playerSummary =
    battle.result.teamSummaries[
      draft.playerTeamId
    ];
  draft.battleHistory.push({
    battleId: battle.battleId,
    match: battle.match,
    round: battle.round,
    opponentTeamId:
      battle.rightTeamId ===
      draft.playerTeamId
        ? battle.leftTeamId
        : battle.rightTeamId,
    winnerTeamId:
      battle.result.winnerTeamId,
    loserTeamId:
      battle.result.loserTeamId,
    draw: battle.result.draw,
    endReason:
      battle.result.endReason,
    elapsedSeconds:
      battle.result.elapsedSeconds,
    playerTeam: deepClone(playerSummary),
    result: deepClone(battle.result),
    events: deepClone(battle.events),
  });
  if (
    draft.battleHistory.length >
    BATTLE_HISTORY_LIMIT
  ) {
    draft.battleHistory.splice(
      0,
      draft.battleHistory.length -
        BATTLE_HISTORY_LIMIT,
    );
  }

  const roundRecord = {
    match: draft.match,
    round: draft.round,
    provisional: false,
    resultCalculated: true,
    battleId: battle.battleId,
    opponentTeamId:
      battle.rightTeamId === draft.playerTeamId
        ? battle.leftTeamId
        : battle.rightTeamId,
    winnerTeamId:
      battle.result.winnerTeamId,
    loserTeamId:
      battle.result.loserTeamId,
    draw: battle.result.draw,
    endReason:
      battle.result.endReason,
    elapsedSeconds:
      battle.result.elapsedSeconds,
    damage: playerSummary.damage,
    damageTaken:
      playerSummary.damageTaken,
    kills:
      playerSummary.confirmedKills,
    assists:
      playerSummary.assists,
    downs:
      playerSummary.downsGiven,
    kp: playerSummary.kp,
    activeTeams:
      draft.activeTeamIds.length,
    memberResults:
      battle.result.participantResults
        .filter(
          (member) =>
            member.teamId ===
            draft.playerTeamId,
        )
        .map(deepClone),
  };

  draft.roundTotals =
    draft.roundTotals.filter(
      (record) =>
        !(
          record.match === draft.match &&
          record.round === draft.round
        ),
    );
  draft.roundTotals.push(roundRecord);
  draft.lastBattleResult =
    deepClone(battle.result);
  draft.lastBattleEvents =
    deepClone(battle.events);
  draft.activeBattle = null;
  draft.pendingVisualId =
    "battle-outcome";
  draft.resultSignature = null;
  draft.returnStatus = "pending";

  return {
    battleId: battle.battleId,
    result: deepClone(battle.result),
    roundRecord,
  };
}

export function executeCurrentBattleToDraft(
  draft,
  options = {},
) {
  const strategyConsumption = {
    left: consumeStrategyForBattle(
      draft,
      draft.playerTeamId,
    ),
    right: consumeStrategyForBattle(
      draft,
      draft.currentOpponentId,
    ),
  };
  const created = createBattleFromTournamentRuntime(
    draft,
    options,
  );
  draft.activeBattle =
    deepClone(created);
  const completed =
    runBattleToCompletion(created);
  const application =
    applyBattleResultToTournamentRuntime(
      draft,
      completed,
    );
  return {
    ...application,
    strategyConsumption,
    eventCount: completed.events.length,
    battleChecksum: completed.checksum,
  };
}

export function validateBattleState(battle) {
  assertPlainObject(battle, "Battle state");
  if (
    battle.schemaVersion !==
    BATTLE_STATE_SCHEMA_VERSION
  ) {
    throw new Error(
      `Unsupported battle schema: ${battle.schemaVersion}`,
    );
  }
  if (
    battle.coreVersion !==
    BATTLE_CORE_VERSION ||
    battle.actionsVersion !==
    BATTLE_ACTIONS_VERSION
  ) {
    throw new Error(
      "Battle module version mismatch.",
    );
  }
  if (
    !Number.isFinite(battle.elapsedSeconds) ||
    battle.elapsedSeconds < 0 ||
    battle.elapsedSeconds >
      battle.durationSeconds
  ) {
    throw new Error(
      "Battle elapsed time is invalid.",
    );
  }
  if (
    !Number.isInteger(battle.tickCount) ||
    battle.tickCount < 0
  ) {
    throw new Error(
      "Battle tick count is invalid.",
    );
  }
  if (
    !["running", "complete"].includes(
      battle.status,
    )
  ) {
    throw new Error(
      `Invalid battle status: ${battle.status}`,
    );
  }

  const participants = Object.values(
    battle.participants,
  );
  const initialParticipants = Object.values(
    battle.initialParticipantStates ?? {},
  );
  if (
    initialParticipants.length !== 6 ||
    new Set(
      initialParticipants.map(
        (participant) => participant.playerId,
      ),
    ).size !== 6
  ) {
    throw new Error(
      "Battle initial participant states must contain six unique players.",
    );
  }
  if (participants.length !== 6) {
    throw new Error(
      "Battle must contain exactly six participants.",
    );
  }
  const teams = [
    battle.leftTeamId,
    battle.rightTeamId,
  ];
  if (new Set(teams).size !== 2) {
    throw new Error(
      "Battle teams must be distinct.",
    );
  }
  for (const teamId of teams) {
    if (
      participants.filter(
        (participant) =>
          participant.teamId === teamId,
      ).length !== 3
    ) {
      throw new Error(
        `Battle team must contain three participants: ${teamId}`,
      );
    }
  }

  for (const participant of participants) {
    if (
      !["alive", "down", "dead"].includes(
        participant.combatState,
      )
    ) {
      throw new Error(
        `Invalid combat state: ${participant.playerId}`,
      );
    }
    if (
      !Number.isFinite(participant.hp) ||
      participant.hp < 0 ||
      participant.hp > participant.maxHp
    ) {
      throw new Error(
        `Invalid HP: ${participant.playerId}`,
      );
    }
    if (
      participant.combatState === "alive" &&
      participant.hp < 1
    ) {
      throw new Error(
        `Alive participant has zero HP: ${participant.playerId}`,
      );
    }
    if (
      participant.combatState !== "alive" &&
      participant.hp !== 0
    ) {
      throw new Error(
        `Inactive participant must have zero HP: ${participant.playerId}`,
      );
    }
    if (
      !Number.isInteger(participant.weapon.ammo) ||
      participant.weapon.ammo < 0 ||
      participant.weapon.ammo >
        participant.weapon.ammoMax
    ) {
      throw new Error(
        `Invalid ammunition: ${participant.playerId}`,
      );
    }
    if (
      !["close", "mid", "far"].includes(
        participant.currentDistance,
      )
    ) {
      throw new Error(
        `Invalid distance: ${participant.playerId}`,
      );
    }
  }

  const expectedChecksum =
    calculateBattleChecksum(battle);
  if (
    battle.checksum !== null &&
    battle.checksum !== expectedChecksum
  ) {
    throw new Error(
      "Battle checksum does not match.",
    );
  }
  if (
    battle.status === "complete" &&
    !battle.result
  ) {
    throw new Error(
      "Completed battle must contain a result.",
    );
  }
  return true;
}
