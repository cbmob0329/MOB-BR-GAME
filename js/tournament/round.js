/**
 * MOB BR full-round integration.
 *
 * This module resolves encounter rolls, CPU-only fast simulation, round target
 * reduction, final-three/final-two/final-one announcements, and spectator
 * progression after the player team is eliminated.
 */

import {
  clamp,
} from "../../data/game-data.js?v=50";
import {
  getMatchParticipantCount,
} from "./circuit.js?v=50";

export const ROUND_INTEGRATION_VERSION =
  "mobbr-tournament-round-2.0.0";

export const ROUND_INTEGRATION_RULES = Object.freeze({
  encounterRate: 0.75,
  announcementCounts: Object.freeze([3, 2, 1]),
  cpuFastDamageScale: 2.8,
  maximumCpuKpPerRound: 3,
  playerBattleWinBonus: 520,
  playerBattleLossPenalty: 420,
  consecutiveOpponentWearChance: 0.42,
  consecutiveOpponentDeathBoxChance: 0.065,
});

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

function hashText(value) {
  const text = String(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0 || 0x9e3779b9;
}

function stableUnit(seed) {
  return hashText(seed) / 0x1_0000_0000;
}

function assertRuntime(draft) {
  if (!draft || typeof draft !== "object") {
    throw new TypeError(
      "Tournament runtime draft must be an object.",
    );
  }
  if (!Array.isArray(draft.activeTeamIds)) {
    throw new TypeError(
      "Tournament active teams are missing.",
    );
  }
  draft.roundIntegration ??= {
    encounterRate,
    encounters: {},
    cpuFastHistory: [],
    remainingAnnouncements: [],
    playerEliminatedAt: null,
    matchPlacements: {},
  };
  return draft;
}

export function getPlayableRoundCount(runtime) {
  const targets =
    runtime.entryData.tournament.roundTargets;
  if (!Array.isArray(targets) || targets.length === 0) {
    return 0;
  }
  const participantCount = getMatchParticipantCount(
    runtime,
    Math.max(1, runtime.match || 1),
  );
  return targets[0] === participantCount
    ? Math.max(1, targets.length - 1)
    : targets.length;
}

export function getRoundTarget(runtime, round) {
  const targets =
    runtime.entryData.tournament.roundTargets;
  if (
    !Number.isInteger(round) ||
    round < 1
  ) {
    throw new RangeError(
      "Round must be a positive integer.",
    );
  }
  const includesStartCount =
    targets[0] === getMatchParticipantCount(
      runtime,
      Math.max(1, runtime.match || 1),
    );
  const index =
    includesStartCount
      ? round
      : round - 1;
  return targets[
    Math.min(index, targets.length - 1)
  ];
}

function teamRecord(runtime, teamId) {
  const team = runtime.teams.find(
    (candidate) =>
      candidate.teamId === teamId,
  );
  if (!team) {
    throw new RangeError(
      `Unknown tournament team: ${teamId}`,
    );
  }
  return team;
}

function teamMembers(runtime, teamId) {
  return teamRecord(runtime, teamId)
    .members.map(
      (member) =>
        runtime.memberRuntime[member.playerId],
    );
}

function teamPower(runtime, teamId) {
  const source = teamRecord(runtime, teamId);
  return source.members.reduce(
    (sum, member) => {
      const stats =
        member.stats ??
        member.battleStats ??
        {};
      const base = Object.values(stats).reduce(
        (statSum, value) =>
          statSum +
          (Number.isFinite(value) ? value : 0),
        0,
      );
      const runtimeMember =
        runtime.memberRuntime[member.playerId];
      const hpRate =
        runtimeMember.maxHp > 0
          ? runtimeMember.hp /
            runtimeMember.maxHp
          : 0;
      const stateRate =
        runtimeMember.combatState === "alive"
          ? 1
          : runtimeMember.combatState === "down"
            ? 0.25
            : 0;
      return (
        sum +
        base *
          (0.55 + hpRate * 0.35 + stateRate * 0.1)
      );
    },
    0,
  );
}

function encounterRateForRound(
  runtime,
) {
  const rates =
    runtime.entryData
      ?.tournament
      ?.roundEncounterRates;
  const configured =
    Array.isArray(rates)
      ? Number(
          rates[
            Math.max(
              0,
              runtime.round - 1,
            )
          ],
        )
      : Number.NaN;

  if (
    Number.isFinite(
      configured,
    )
  ) {
    return Math.max(
      0,
      Math.min(
        1,
        configured,
      ),
    );
  }

  return Math.max(
    0,
    Math.min(
      1,
      Number(
        runtime.roundIntegration
          ?.encounterRate ??
        ROUND_INTEGRATION_RULES
          .encounterRate,
      ),
    ),
  );
}

function explorationAfterRounds(
  totalRounds,
) {
  if (
    totalRounds === 5 ||
    totalRounds === 6
  ) {
    return [2, 4];
  }
  const maximumAfterRound =
    Math.max(
      1,
      totalRounds - 1,
    );
  const middle =
    Math.min(
      maximumAfterRound,
      Math.max(
        1,
        Math.round(
          totalRounds * 0.4,
        ),
      ),
    );
  const late =
    Math.min(
      maximumAfterRound,
      Math.max(
        middle + 1,
        Math.round(
          totalRounds * 0.8,
        ),
      ),
    );
  return [
    ...new Set([
      middle,
      late,
    ]),
  ];
}

function isConsecutiveCombatRound(
  runtime,
) {
  if (runtime.round <= 1) {
    return false;
  }
  const previousRound =
    runtime.round - 1;
  return !explorationAfterRounds(
    getPlayableRoundCount(runtime),
  ).includes(previousRound);
}

function syncTeamMemberState(
  runtime,
  teamId,
) {
  const team =
    teamRecord(
      runtime,
      teamId,
    );
  const members =
    teamMembers(
      runtime,
      teamId,
    );
  for (
    let index = 0;
    index < members.length;
    index += 1
  ) {
    const runtimeMember =
      members[index];
    const sourceMember =
      team.members[index];
    sourceMember.currentHp =
      runtimeMember.hp;
    sourceMember.combatState =
      runtimeMember.combatState;
  }
  const teamState =
    runtime.teamRuntime[teamId];
  if (teamState) {
    teamState.matchHp =
      members.map(
        (member) =>
          member.hp,
      );
    teamState.persistentHp =
      [...teamState.matchHp];
    teamState.combatState =
      members.map(
        (member) =>
          member.combatState,
      );
  }
}

function applyConsecutiveOpponentWear(
  runtime,
  opponentTeamId,
) {
  if (
    !opponentTeamId ||
    !isConsecutiveCombatRound(
      runtime,
    )
  ) {
    return null;
  }

  const members =
    teamMembers(
      runtime,
      opponentTeamId,
    );
  const existing =
    members.filter(
      (member) =>
        member.combatState ===
          "dead" ||
        member.hp <
          member.maxHp * 0.96,
    );
  if (existing.length > 0) {
    return {
      source:
        "carried_cpu_battle_damage",
      applied:
        false,
      damagedCount:
        existing.filter(
          (member) =>
            member.combatState !==
            "dead",
        ).length,
      deathBoxCount:
        existing.filter(
          (member) =>
            member.combatState ===
            "dead",
        ).length,
    };
  }

  const seed =
    `${runtime.entryId}:${runtime.match}:${runtime.round}:${opponentTeamId}:consecutive-wear`;
  if (
    stableUnit(
      `${seed}:trigger`,
    ) >=
    ROUND_INTEGRATION_RULES
      .consecutiveOpponentWearChance
  ) {
    return null;
  }

  const deathBoxIndex =
    runtime.round >= 3 &&
    stableUnit(
      `${seed}:death-box`,
    ) <
      ROUND_INTEGRATION_RULES
        .consecutiveOpponentDeathBoxChance
      ? Math.floor(
          stableUnit(
            `${seed}:death-index`,
          ) *
          members.length,
        )
      : -1;
  let damagedCount = 0;
  let deathBoxCount = 0;

  for (
    let index = 0;
    index < members.length;
    index += 1
  ) {
    const member =
      members[index];
    if (
      index === deathBoxIndex &&
      members.length - deathBoxCount > 1
    ) {
      member.hp = 0;
      member.combatState =
        "dead";
      deathBoxCount += 1;
      continue;
    }

    const hitRoll =
      stableUnit(
        `${seed}:${member.playerId}:hit`,
      );
    if (hitRoll < 0.24) {
      continue;
    }
    const lossRate =
      0.07 +
      stableUnit(
        `${seed}:${member.playerId}:loss`,
      ) *
      0.19;
    member.hp =
      Math.max(
        12,
        Math.round(
          member.maxHp *
          (1 - lossRate),
        ),
      );
    member.combatState =
      "alive";
    damagedCount += 1;
  }

  if (
    damagedCount === 0 &&
    deathBoxCount === 0
  ) {
    const member =
      members[
        Math.floor(
          stableUnit(
            `${seed}:fallback`,
          ) *
          members.length,
        )
      ];
    member.hp =
      Math.max(
        12,
        Math.round(
          member.maxHp *
          0.86,
        ),
      );
    member.combatState =
      "alive";
    damagedCount = 1;
  }

  syncTeamMemberState(
    runtime,
    opponentTeamId,
  );
  return {
    source:
      "simulated_previous_cpu_battle",
    applied:
      true,
    damagedCount,
    deathBoxCount,
  };
}

function recentOpponentIds(runtime) {
  return runtime.battleHistory
    .filter(
      (record) =>
        record.match === runtime.match,
    )
    .slice(-2)
    .map((record) => record.opponentTeamId);
}

export function resolveRoundEncounterToDraft(
  draft,
  {
    force = null,
  } = {},
) {
  assertRuntime(draft);
  const key =
    `${draft.entryId}:${draft.match}:${draft.round}`;
  const existing =
    draft.roundIntegration.encounters[key];
  if (existing) {
    draft.currentOpponentId =
      existing.opponentTeamId;
    draft.lockedOpponentId =
      existing.opponentTeamId;
    draft.currentPairs =
      existing.opponentTeamId
        ? [[draft.playerTeamId, existing.opponentTeamId]]
        : [];
    return deepFreeze(deepClone(existing));
  }

  const playerActive =
    draft.activeTeamIds.includes(
      draft.playerTeamId,
    ) &&
    teamMembers(
      draft,
      draft.playerTeamId,
    ).some(
      (member) =>
        member.combatState !== "dead",
    );
  const roll =
    stableUnit(
      `${key}:encounter`,
    );
  const encounterRate =
    encounterRateForRound(
      draft,
    );
  const encountered =
    playerActive &&
    (
      force === true ||
      (
        force !== false &&
        roll <
          encounterRate
      )
    );

  let opponentTeamId = null;
  if (encountered) {
    const recent =
      new Set(recentOpponentIds(draft));
    const candidates =
      draft.activeTeamIds.filter(
        (teamId) =>
          teamId !== draft.playerTeamId,
      );
    const preferred =
      candidates.filter(
        (teamId) => !recent.has(teamId),
      );
    const source =
      preferred.length > 0
        ? preferred
        : candidates;
    if (source.length > 0) {
      const index = Math.floor(
        stableUnit(`${key}:opponent`) *
          source.length,
      );
      opponentTeamId =
        source[
          Math.min(
            source.length - 1,
            index,
          )
        ];
    }
  }

  const opponentWear =
    encountered &&
    opponentTeamId !== null
      ? applyConsecutiveOpponentWear(
          draft,
          opponentTeamId,
        )
      : null;

  const result = {
    encounterKey: key,
    match: draft.match,
    round: draft.round,
    playerActive,
    roll,
    encounterRate,
    encountered:
      encountered &&
      opponentTeamId !== null,
    opponentTeamId,
    opponentWear:
      deepClone(opponentWear),
    reason:
      !playerActive
        ? "player_eliminated_spectator"
        : opponentTeamId === null
          ? "no_cpu_opponent"
          : encountered
            ? "encounter_success"
            : "encounter_roll_failed",
  };
  draft.roundIntegration.encounters[key] =
    deepClone(result);
  draft.currentOpponentId = opponentTeamId;
  draft.lockedOpponentId = opponentTeamId;
  draft.currentPairs =
    opponentTeamId
      ? [[draft.playerTeamId, opponentTeamId]]
      : [];
  return deepFreeze(result);
}

function actualBattleSummary(
  runtime,
  teamId,
) {
  return runtime.lastBattleResult
    ?.teamSummaries?.[teamId] ??
    null;
}

function createFastStats(
  runtime,
  teamId,
) {
  const power = teamPower(runtime, teamId);
  const seed = `${runtime.entryId}:${runtime.match}:${runtime.round}:${teamId}:fast`;
  const variation = stableUnit(seed);
  const hpRate = teamMembers(runtime, teamId).reduce(
    (sum, member) => sum + (member.maxHp > 0 ? member.hp / member.maxHp : 0),
    0,
  ) / 3;
  const killRoll = stableUnit(`${seed}:kp`);
  const kp = killRoll < 0.48
    ? 0
    : killRoll < 0.80
      ? 1
      : killRoll < 0.96
        ? 2
        : ROUND_INTEGRATION_RULES.maximumCpuKpPerRound;
  const ap = kp === 0
    ? 0
    : Math.min(kp * 2, Math.floor(stableUnit(`${seed}:ap`) * (kp + 2)));
  const damage = Math.max(
    0,
    Math.round(
      Math.min(
        2800,
        power * (ROUND_INTEGRATION_RULES.cpuFastDamageScale + variation * 1.2),
      ),
    ),
  );
  const damageTaken = Math.max(
    0,
    Math.round(
      Math.min(
        3000,
        damage * (0.55 + stableUnit(`${seed}:taken`) * 0.9),
      ),
    ),
  );
  return {
    kp,
    ap,
    damage,
    damageTaken,
    downs: Math.min(5, kp + (stableUnit(`${seed}:downs`) > 0.65 ? 1 : 0)),
    confirmedKills: kp,
    hpRate,
    aliveCount: teamMembers(runtime, teamId).filter(
      (member) => member.combatState === "alive",
    ).length,
    battlePower: power,
    source: "cpu_fast_round",
  };
}

function recentPlacementAdjustment(runtime, teamId) {
  const recent = runtime.matchTotals
    .slice(-2)
    .map((match) => match.rankings?.find((row) => row.teamId === teamId)?.place)
    .filter(Number.isInteger);
  if (recent.length === 0) return 0;
  const consecutiveTopTwo = recent.every((place) => place <= 2);
  const consecutiveChampion =
    recent.length >= 2 &&
    recent.every((place) => place === 1);
  if (consecutiveChampion) return -900;
  if (consecutiveTopTwo && recent.length >= 2) return -760;
  const last = recent.at(-1);
  if (last === 1) return -390;
  if (last === 2) return -250;
  if (last >= Math.ceil(runtime.teams.length * 0.7)) return 210;
  return 0;
}

function scoreTeam(
  runtime,
  teamId,
  stats,
) {
  const actual =
    actualBattleSummary(runtime, teamId);
  const battleBonus =
    actual
      ? runtime.lastBattleResult.winnerTeamId ===
        teamId
        ? ROUND_INTEGRATION_RULES
            .playerBattleWinBonus
        : runtime.lastBattleResult.loserTeamId ===
            teamId
          ? -ROUND_INTEGRATION_RULES
              .playerBattleLossPenalty
          : 0
      : 0;
  const matchForm =
    (stableUnit(`${runtime.entryId}:${runtime.match}:${teamId}:match-form`) - 0.5) * 1240;
  const roundSwing =
    (stableUnit(`${runtime.entryId}:${runtime.match}:${runtime.round}:${teamId}:score`) - 0.5) * 820;
  const surpriseRoll = stableUnit(
    `${runtime.entryId}:${runtime.match}:${runtime.round}:${teamId}:surprise`,
  );
  const controlledSurprise =
    surpriseRoll < 0.10
      ? 720
      : surpriseRoll > 0.96
        ? -560
        : 0;
  return (
    stats.battlePower * 5.05 +
    stats.hpRate * 460 +
    stats.aliveCount * 150 +
    stats.kp * 120 +
    stats.damage / 30 -
    stats.damageTaken / 44 +
    battleBonus +
    matchForm +
    roundSwing +
    recentPlacementAdjustment(runtime, teamId) +
    controlledSurprise
  );
}

function applyCpuRoundState(
  runtime,
  teamId,
  {
    eliminated,
    score,
  },
) {
  const members = teamMembers(runtime, teamId);
  if (eliminated) {
    for (const member of members) {
      member.hp = 0;
      member.combatState = "dead";
      member.currentAmmo = 12;
      member.reloadRemaining = 0;
    }
  } else if (
    teamId !== runtime.playerTeamId &&
    teamId !== runtime.currentOpponentId
  ) {
    const seed =
      `${runtime.entryId}:${runtime.match}:${runtime.round}:${teamId}:wear`;
    const severity = stableUnit(`${seed}:severity`);
    const deathBoxIndex =
      runtime.round >= 2 &&
      stableUnit(`${seed}:death-box`) < 0.055
        ? Math.floor(
            stableUnit(`${seed}:death-member`) * members.length,
          )
        : -1;

    for (const [index, member] of members.entries()) {
      if (index === deathBoxIndex) {
        member.hp = 0;
        member.combatState = "dead";
        member.currentAmmo = 12;
        member.reloadRemaining = 0;
        continue;
      }

      const unit = stableUnit(
        `${seed}:${member.playerId}:hp`,
      );
      let minimumRate = 0.68;
      let maximumRate = 0.98;

      if (runtime.round >= 2 && severity < 0.16) {
        minimumRate = 0.28;
        maximumRate = 0.62;
      } else if (runtime.round >= 2 && severity < 0.42) {
        minimumRate = 0.52;
        maximumRate = 0.82;
      }

      const hpRate = clamp(
        minimumRate +
          unit * (maximumRate - minimumRate) +
          Math.max(-0.05, Math.min(0.05, score / 50000)),
        0.12,
        1,
      );
      member.hp = Math.max(
        10,
        Math.round(member.maxHp * hpRate),
      );
      member.combatState = "alive";
      member.currentAmmo = 12;
      member.reloadRemaining = 0;
    }

    if (members.every((member) => member.combatState === "dead")) {
      members[0].combatState = "alive";
      members[0].hp = Math.max(
        10,
        Math.round(members[0].maxHp * 0.22),
      );
    }
  }

  const teamRuntime = runtime.teamRuntime[teamId];
  teamRuntime.matchHp =
    members.map((member) => member.hp);
  teamRuntime.persistentHp =
    [...teamRuntime.matchHp];
  teamRuntime.combatState =
    members.map((member) => member.combatState);
}

function baseRoundRecord(runtime) {
  const existing =
    runtime.roundTotals.find(
      (record) =>
        record.match === runtime.match &&
        record.round === runtime.round,
    );
  return existing
    ? deepClone(existing)
    : {
        match: runtime.match,
        round: runtime.round,
        provisional: false,
        resultCalculated: true,
        battleId: null,
        opponentTeamId:
          runtime.currentOpponentId,
        winnerTeamId: null,
        loserTeamId: null,
        draw: false,
        endReason: "field_round",
        elapsedSeconds: 0,
        damage: 0,
        damageTaken: 0,
        kills: 0,
        assists: 0,
        downs: 0,
        kp: 0,
        memberResults: [],
      };
}

export function finalizeRoundFieldToDraft(
  draft,
  {
    source = "round_flow",
  } = {},
) {
  assertRuntime(draft);
  const existing = draft.roundTotals.find(
    (record) =>
      record.match === draft.match &&
      record.round === draft.round &&
      record.fieldResolved === true,
  );
  if (existing) {
    return deepFreeze(deepClone(existing));
  }

  const activeBefore =
    [...draft.activeTeamIds];
  const encounterKey =
    `${draft.entryId}:${draft.match}:${draft.round}`;
  const encounterRecord =
    draft.roundIntegration.encounters[encounterKey] ?? null;
  const playerHadNoEncounter =
    activeBefore.includes(draft.playerTeamId) &&
    encounterRecord?.playerActive === true &&
    encounterRecord.encountered === false;
  const targetCount = Math.max(
    1,
    Math.min(
      activeBefore.length,
      getRoundTarget(draft, draft.round),
    ),
  );

  const teamResults = activeBefore.map(
    (teamId) => {
      const actual =
        actualBattleSummary(draft, teamId);
      const stats =
        actual
          ? {
              kp: actual.kp ?? 0,
              ap: actual.assists ?? 0,
              damage: actual.damage ?? 0,
              damageTaken:
                actual.damageTaken ?? 0,
              downs:
                actual.downsGiven ?? 0,
              confirmedKills:
                actual.confirmedKills ?? 0,
              hpRate:
                actual.hpRate ?? 0,
              aliveCount:
                actual.aliveCount ?? 0,
              battlePower:
                actual.battlePower ??
                teamPower(draft, teamId),
              source: "player_visible_battle",
            }
          : (
              teamId === draft.playerTeamId &&
              playerHadNoEncounter
                ? {
                    kp: 0,
                    ap: 0,
                    damage: 0,
                    damageTaken: 0,
                    downs: 0,
                    confirmedKills: 0,
                    hpRate:
                      teamMembers(draft, teamId).reduce(
                        (sum, member) =>
                          sum +
                          (
                            member.maxHp > 0
                              ? member.hp / member.maxHp
                              : 0
                          ),
                        0,
                      ) /
                      Math.max(
                        1,
                        teamMembers(draft, teamId).length,
                      ),
                    aliveCount:
                      teamMembers(draft, teamId).filter(
                        (member) =>
                          member.combatState !== "dead" &&
                          member.hp > 0,
                      ).length,
                    battlePower:
                      teamPower(draft, teamId),
                    source:
                      "player_no_encounter",
                  }
                : createFastStats(draft, teamId)
            );
      const forcedEliminated =
        teamMembers(draft, teamId).every(
          (member) =>
            member.combatState === "dead",
        );
      return {
        teamId,
        forcedEliminated,
        teamName:
          teamRecord(draft, teamId)
            .teamName,
        teamLogo:
          teamRecord(draft, teamId)
            .teamLogo,
        isPlayer:
          teamId === draft.playerTeamId,
        ...stats,
        score:
          scoreTeam(draft, teamId, stats),
      };
    },
  );

  teamResults.sort((left, right) => {
    if (left.forcedEliminated !== right.forcedEliminated) {
      return left.forcedEliminated ? 1 : -1;
    }
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    if (right.aliveCount !== left.aliveCount) {
      return right.aliveCount - left.aliveCount;
    }
    if (right.hpRate !== left.hpRate) {
      return right.hpRate - left.hpRate;
    }
    if (right.kp !== left.kp) {
      return right.kp - left.kp;
    }
    return left.teamId.localeCompare(
      right.teamId,
    );
  });

  // CPU teams may win twice in succession, but a third consecutive
  // championship receives a final-round cooldown. This prevents one
  // simulated powerhouse from monopolizing every MATCH while leaving
  // normal power-based ordering and player-earned streaks intact.
  if (
    targetCount === 1 &&
    teamResults.length > 1 &&
    teamResults[0].isPlayer !== true
  ) {
    const recentChampionIds =
      draft.matchTotals
        .slice(-2)
        .map(
          (match) =>
            match.championTeamId ??
            match.rankings?.[0]?.teamId ??
            null,
        );
    const repeatedChampion =
      recentChampionIds.length === 2 &&
      recentChampionIds[0] !== null &&
      recentChampionIds.every(
        (teamId) =>
          teamId === recentChampionIds[0],
      ) &&
      teamResults[0].teamId ===
        recentChampionIds[0];
    if (repeatedChampion) {
      const [leader, challenger] =
        teamResults;
      challenger.cpuThreepeatCooldownWin =
        true;
      leader.cpuThreepeatCooldown =
        true;
      teamResults[0] = challenger;
      teamResults[1] = leader;
    }
  }

  const drawProtectedTeamIds =
    new Set(
      draft.lastBattleResult?.draw === true
        ? [
            draft.lastBattleResult.leftTeamId,
            draft.lastBattleResult.rightTeamId,
          ].filter((teamId) =>
            activeBefore.includes(teamId),
          )
        : [],
    );

  if (
    drawProtectedTeamIds.size > 0 &&
    targetCount >= drawProtectedTeamIds.size
  ) {
    const protectedRows =
      teamResults.filter((row) =>
        drawProtectedTeamIds.has(row.teamId),
      );
    const normalRows =
      teamResults.filter((row) =>
        !drawProtectedTeamIds.has(row.teamId),
      );
    const safeNormalCount =
      Math.max(
        0,
        targetCount - protectedRows.length,
      );
    for (const row of protectedRows) {
      row.drawProtection = true;
    }
    teamResults.splice(
      0,
      teamResults.length,
      ...normalRows.slice(0, safeNormalCount),
      ...protectedRows,
      ...normalRows.slice(safeNormalCount),
    );
  }

  const visibleBattleWinnerId =
    draft.lastBattleResult?.draw === false &&
    activeBefore.includes(
      draft.lastBattleResult?.winnerTeamId,
    )
      ? draft.lastBattleResult.winnerTeamId
      : null;

  // A team that won the visible 3v3 battle must remain in the field. Before
  // this guard, the independent field score could place the winner below the
  // survival line and applyCpuRoundState would then convert all three members
  // to dead, producing "VICTORY" followed by an all-eliminated state.
  if (visibleBattleWinnerId !== null && targetCount > 0) {
    const winnerIndex = teamResults.findIndex(
      (row) => row.teamId === visibleBattleWinnerId,
    );
    if (winnerIndex >= targetCount) {
      const [winnerRow] = teamResults.splice(winnerIndex, 1);
      winnerRow.visibleBattleWinProtection = true;
      teamResults.splice(targetCount - 1, 0, winnerRow);
    } else if (winnerIndex >= 0) {
      teamResults[winnerIndex].visibleBattleWinProtection = true;
    }
  }

  if (playerHadNoEncounter) {
    const playerIndex =
      teamResults.findIndex(
        (row) =>
          row.teamId === draft.playerTeamId,
      );
    if (
      playerIndex >= targetCount &&
      targetCount > 0
    ) {
      const [playerRow] =
        teamResults.splice(playerIndex, 1);
      playerRow.noEncounterProtection = true;
      teamResults.splice(
        targetCount - 1,
        0,
        playerRow,
      );
    } else if (playerIndex >= 0) {
      teamResults[playerIndex]
        .noEncounterProtection = true;
    }
  }

  const survivors =
    teamResults
      .slice(0, targetCount)
      .map((row) => row.teamId);
  const eliminatedRows =
    teamResults.slice(targetCount).filter(
      (row) => row.teamId !== visibleBattleWinnerId,
    );
  const eliminatedIds =
    eliminatedRows.map((row) => row.teamId);

  for (const row of teamResults) {
    const eliminated =
      eliminatedIds.includes(row.teamId);
    row.roundPlace =
      teamResults.findIndex(
        (candidate) =>
          candidate.teamId === row.teamId,
      ) + 1;
    row.survived = !eliminated;
    applyCpuRoundState(
      draft,
      row.teamId,
      {
        eliminated,
        score: row.score,
      },
    );
  }

  const previousCount =
    activeBefore.length;
  draft.activeTeamIds = survivors;
  for (const row of eliminatedRows) {
    if (
      !draft.eliminated.some(
        (record) =>
          record.teamId === row.teamId &&
          record.match === draft.match,
      )
    ) {
      draft.eliminated.push({
        teamId: row.teamId,
        teamName: row.teamName,
        match: draft.match,
        round: draft.round,
        score: row.score,
        fieldPlace: row.roundPlace,
        source,
      });
    }
  }

  const playerSurvived =
    survivors.includes(draft.playerTeamId);
  if (
    !playerSurvived &&
    draft.roundIntegration
      .playerEliminatedAt === null
  ) {
    draft.roundIntegration.playerEliminatedAt = {
      match: draft.match,
      round: draft.round,
    };
  }

  const newAnnouncements =
    ROUND_INTEGRATION_RULES
      .announcementCounts
      .filter(
        (count) =>
          survivors.length === count &&
          previousCount > count &&
          !draft.roundIntegration
            .remainingAnnouncements
            .includes(
              `${draft.match}:${count}`,
            ),
      );
  for (const count of newAnnouncements) {
    draft.roundIntegration
      .remainingAnnouncements.push(
        `${draft.match}:${count}`,
      );
  }

  const record = {
    ...baseRoundRecord(draft),
    fieldResolved: true,
    source,
    activeTeamsBefore: activeBefore,
    activeTeamsAfter: survivors,
    activeTeams:
      survivors.length,
    targetCount,
    eliminatedTeamIds: eliminatedIds,
    remainingCount:
      survivors.length,
    remainingAnnouncements:
      newAnnouncements,
    playerSurvived,
    playerHadEncounter:
      encounterRecord?.encountered === true,
    playerBattleDraw:
      draft.lastBattleResult?.draw === true,
    drawProtectedTeamIds:
      [...drawProtectedTeamIds],
    playerHadNoEncounter,
    encounterReason:
      encounterRecord?.reason ?? null,
    playerEliminatedThisRound:
      !playerSurvived &&
      activeBefore.includes(
        draft.playerTeamId,
      ),
    teamResults:
      teamResults.map((row) => ({
        ...row,
        score:
          Math.round(row.score * 100) / 100,
      })),
    cpuFastCount:
      teamResults.filter(
        (row) =>
          row.source === "cpu_fast_round",
      ).length,
  };

  draft.roundTotals =
    draft.roundTotals.filter(
      (candidate) =>
        !(
          candidate.match ===
            draft.match &&
          candidate.round ===
            draft.round
        ),
    );
  draft.roundTotals.push(record);
  draft.roundTotals.sort(
    (left, right) =>
      left.match - right.match ||
      left.round - right.round,
  );
  draft.roundIntegration
    .cpuFastHistory.push({
      match: draft.match,
      round: draft.round,
      activeBefore: previousCount,
      activeAfter: survivors.length,
      cpuFastCount:
        record.cpuFastCount,
      checksumSeed:
        hashText(
          JSON.stringify(
            record.teamResults.map(
              (row) => [
                row.teamId,
                row.score,
                row.survived,
              ],
            ),
          ),
        ).toString(16),
    });
  draft.pendingVisualId =
    `round-result:${draft.match}:${draft.round}`;

  return deepFreeze(deepClone(record));
}

export function getCurrentRoundRecord(runtime) {
  return runtime.roundTotals.find(
    (record) =>
      record.match === runtime.match &&
      record.round === runtime.round,
  ) ?? null;
}

export function isPlayerActive(runtime) {
  if (!runtime.activeTeamIds.includes(runtime.playerTeamId)) {
    return false;
  }
  return teamMembers(runtime, runtime.playerTeamId).some(
    (member) => member.combatState !== "dead" && member.hp > 0,
  );
}

export function fastForwardMatchToChampionToDraft(draft) {
  assertRuntime(draft);
  const records = [];
  const current = getCurrentRoundRecord(draft);
  if (!current?.fieldResolved) {
    records.push(finalizeRoundFieldToDraft(draft, {
      source: "spectator_fast_forward_current_round",
    }));
  }
  const totalRounds = getPlayableRoundCount(draft);
  while (draft.activeTeamIds.length > 1 && draft.round < totalRounds) {
    draft.round += 1;
    draft.activeBattle = null;
    draft.lastBattleResult = null;
    draft.lastBattleEvents = [];
    draft.currentOpponentId = null;
    draft.lockedOpponentId = null;
    draft.currentPairs = [];
    records.push(finalizeRoundFieldToDraft(draft, {
      source: "spectator_fast_forward",
    }));
  }
  draft.pendingVisualId = `spectator-fast-forward:${draft.match}`;
  return deepFreeze({
    match: draft.match,
    completedRounds: records.map((record) => record.round),
    championTeamId: draft.activeTeamIds[0] ?? null,
    remainingTeams: draft.activeTeamIds.length,
  });
}

export function validateRoundIntegration(runtime) {
  assertRuntime(runtime);
  const playable =
    getPlayableRoundCount(runtime);
  if (playable < 1) {
    throw new Error(
      "Tournament playable round count is invalid.",
    );
  }
  for (const record of runtime.roundTotals) {
    if (
      record.fieldResolved === true &&
      record.activeTeamsAfter.length !==
        record.targetCount
    ) {
      throw new Error(
        "Resolved round survivor count does not match the round target.",
      );
    }
  }
  return true;
}
