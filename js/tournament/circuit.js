/**
 * Runtime helpers for annual circuit match plans.
 */

export const TOURNAMENT_CIRCUIT_VERSION =
  "mobbr-tournament-circuit-1.0.0";

function deepClone(value) {
  if (typeof globalThis.structuredClone === "function") {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export function getMatchPlanEntry(runtime, match = runtime.match) {
  const plan = runtime?.entryData?.tournament?.matchPlan;
  if (!Array.isArray(plan) || plan.length === 0) {
    return null;
  }
  return (
    plan.find((entry) => entry.match === match) ??
    plan[Math.max(0, Math.min(plan.length - 1, match - 1))] ??
    null
  );
}

export function getMatchParticipantIds(runtime, match = runtime.match) {
  const plan = getMatchPlanEntry(runtime, match);
  if (
    plan &&
    Array.isArray(plan.participantTeamIds) &&
    plan.participantTeamIds.length > 0
  ) {
    return [...plan.participantTeamIds];
  }
  return runtime.teams.map((team) => team.teamId);
}

export function getMatchParticipantCount(runtime, match = runtime.match) {
  return getMatchParticipantIds(runtime, match).length;
}

export function isPlayerMatch(runtime, match = runtime.match) {
  return getMatchParticipantIds(runtime, match).includes(
    runtime.playerTeamId,
  );
}

export function applyMatchPlanToDraft(draft, match = draft.match) {
  const participantTeamIds = getMatchParticipantIds(draft, match);
  const knownTeamIds = new Set(
    draft.teams.map((team) => team.teamId),
  );
  for (const teamId of participantTeamIds) {
    if (!knownTeamIds.has(teamId)) {
      throw new RangeError(
        `Match plan contains unknown team: ${teamId}`,
      );
    }
  }

  const plan = getMatchPlanEntry(draft, match);
  draft.activeTeamIds = [...participantTeamIds];
  draft.currentSection = plan
    ? {
        match: plan.match,
        circuitMatch: plan.circuitMatch ?? plan.match,
        sectionId: plan.sectionId ?? "ALL",
        sectionName: plan.sectionName ?? "ALL TEAMS",
        sectionMatch: plan.sectionMatch ?? match,
        leftGroupId: plan.leftGroupId ?? null,
        rightGroupId: plan.rightGroupId ?? null,
        participantTeamIds: [...participantTeamIds],
        playerParticipates: participantTeamIds.includes(
          draft.playerTeamId,
        ),
      }
    : {
        match,
        circuitMatch: match,
        sectionId: "ALL",
        sectionName: "ALL TEAMS",
        sectionMatch: match,
        leftGroupId: null,
        rightGroupId: null,
        participantTeamIds: [...participantTeamIds],
        playerParticipates: participantTeamIds.includes(
          draft.playerTeamId,
        ),
      };

  draft.eliminated = [];
  draft.currentPairs = [];
  draft.currentOpponentId = null;
  draft.lockedOpponentId = null;
  draft.round = 0;
  return deepClone(draft.currentSection);
}

export function circuitSectionLabel(runtime) {
  const section =
    runtime.currentSection ?? getMatchPlanEntry(runtime);
  if (!section) return null;
  if (section.sectionId === "ALL") return null;
  return `${section.sectionName} / MATCH ${section.sectionMatch}`;
}
