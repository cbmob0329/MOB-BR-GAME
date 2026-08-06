/**
 * MOB BR CPU league assignment registry.
 *
 * Generation 47 keeps formal-pro league counts unchanged while moving twenty
 * former teams to the Denden Cup and installing LN/NN/WN replacements.
 */

import {
  ALL_GENERATION_47_CPU_TEAMS,
  DENDEN_CPU_TEAMS as DENDEN_CPU_TEAM_MASTER,
  PRO_LOCAL_CPU_TEAMS as LOCAL_CPU_TEAM_MASTER,
  PRO_NATIONAL_CPU_TEAMS as NATIONAL_CPU_TEAM_MASTER,
  PRO_WORLD_CPU_TEAMS as WORLD_CPU_TEAM_MASTER,
} from "./cpu-roster-47-data.js?v=51";
import {
  CPU_TEAM_LEAGUE_OVERRIDES,
} from "./cpu-league-overrides.js?v=51";

export const CPU_LEAGUE_REGISTRY_VERSION =
  "mobbr-cpu-league-registry-2.0.0";

export const CPU_LEAGUE_IDS = Object.freeze([
  "local",
  "national",
  "world",
  "denden",
]);

export const CPU_TEAM_LEAGUE_ASSIGNMENTS =
  Object.freeze(
    Object.fromEntries(
      ALL_GENERATION_47_CPU_TEAMS.map(
        (team) => [
          team.teamId,
          CPU_TEAM_LEAGUE_OVERRIDES[
            team.teamId
          ] ??
          team.league ??
          team.tier,
        ],
      ),
    ),
  );

const TEAM_BY_ID = new Map(
  ALL_GENERATION_47_CPU_TEAMS.map(
    (team) => [
      team.teamId,
      team,
    ],
  ),
);

function validateLeague(leagueId) {
  if (
    !CPU_LEAGUE_IDS.includes(
      leagueId,
    )
  ) {
    throw new RangeError(
      `Unsupported CPU league: ${leagueId}`,
    );
  }
  return leagueId;
}

export function getCpuLeagueForTeamId(
  teamId,
) {
  return (
    CPU_TEAM_LEAGUE_ASSIGNMENTS[
      String(teamId ?? "")
    ] ??
    null
  );
}

export function getCpuTeamMasterById(
  teamId,
) {
  return (
    TEAM_BY_ID.get(
      String(teamId ?? ""),
    ) ??
    null
  );
}

export function getCpuTeamsForLeague(
  leagueId,
  calendarYear = 1989,
) {
  const normalizedLeague =
    validateLeague(leagueId);
  if (
    !Number.isInteger(calendarYear) ||
    calendarYear < 1989
  ) {
    throw new RangeError(
      "CPU league calendar year must be 1989 or later.",
    );
  }

  return Object.freeze(
    ALL_GENERATION_47_CPU_TEAMS.filter(
      (team) =>
        getCpuLeagueForTeamId(
          team.teamId,
        ) === normalizedLeague &&
        Number(
          team.unlockCalendarYear ??
          1989,
        ) <= calendarYear,
    ),
  );
}

export const LOCAL_CPU_TEAMS =
  getCpuTeamsForLeague(
    "local",
    9999,
  );

export const NATIONAL_CPU_TEAMS =
  getCpuTeamsForLeague(
    "national",
    9999,
  );

export const WORLD_CPU_ALL_TEAMS =
  getCpuTeamsForLeague(
    "world",
    9999,
  );

export const DENDEN_CPU_TEAMS =
  getCpuTeamsForLeague(
    "denden",
    9999,
  );

export const WORLD_CPU_TEAMS =
  Object.freeze(
    WORLD_CPU_ALL_TEAMS.filter(
      (team) =>
        team.isExpansionTeam !==
        true,
    ),
  );

export const WORLD_CPU_EXPANSION_TEAMS =
  Object.freeze(
    WORLD_CPU_ALL_TEAMS.filter(
      (team) =>
        team.isExpansionTeam ===
        true,
    ),
  );

export function getWorldCpuTeamsForYear(
  calendarYear,
) {
  return getCpuTeamsForLeague(
    "world",
    calendarYear,
  );
}

export function getDendenCpuTeamsForYear(
  calendarYear,
) {
  return getCpuTeamsForLeague(
    "denden",
    calendarYear,
  );
}

export function getCpuTeamRegistry(
  calendarYear = 9999,
) {
  return Object.freeze(
    ALL_GENERATION_47_CPU_TEAMS
      .filter(
        (team) =>
          Number(
            team.unlockCalendarYear ??
            1989,
          ) <= calendarYear,
      )
      .map(
        (team) =>
          Object.freeze({
            ...team,
            assignedLeague:
              getCpuLeagueForTeamId(
                team.teamId,
              ),
          }),
      ),
  );
}

export function validateCpuLeagueRegistry() {
  const assignedIds =
    Object.keys(
      CPU_TEAM_LEAGUE_ASSIGNMENTS,
    );
  if (
    assignedIds.length !==
    ALL_GENERATION_47_CPU_TEAMS.length
  ) {
    throw new Error(
      "Every Generation 47 CPU team must have one league assignment.",
    );
  }

  for (
    const [
      teamId,
      leagueId,
    ]
    of Object.entries(
      CPU_TEAM_LEAGUE_ASSIGNMENTS,
    )
  ) {
    validateLeague(leagueId);
    if (
      !TEAM_BY_ID.has(teamId)
    ) {
      throw new Error(
        `CPU league assignment references unknown team: ${teamId}`,
      );
    }
  }

  return Object.freeze({
    local:
      LOCAL_CPU_TEAMS.length,
    national:
      NATIONAL_CPU_TEAMS.length,
    world:
      WORLD_CPU_ALL_TEAMS.length,
    denden:
      DENDEN_CPU_TEAMS.length,
    all:
      ALL_GENERATION_47_CPU_TEAMS.length,
  });
}

validateCpuLeagueRegistry();
