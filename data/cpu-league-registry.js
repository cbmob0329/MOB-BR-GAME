/**
 * MOB BR CPU league assignment registry.
 *
 * Move a CPU team between the formal pools by changing only the value in
 * CPU_TEAM_LEAGUE_ASSIGNMENTS. Team/player master objects and image paths do
 * not need to be moved.
 *
 * Reserved future value: "denden".
 * Denden participation is intentionally not connected in Generation 46.
 */

import {
  LOCAL_CPU_TEAMS as LOCAL_CPU_TEAM_MASTER,
} from "./cpu-local-data.js";
import {
  NATIONAL_CPU_TEAMS as NATIONAL_CPU_TEAM_MASTER,
} from "./cpu-national-data.js";
import {
  WORLD_CPU_ALL_TEAMS as WORLD_CPU_TEAM_MASTER,
} from "./cpu-world-data.js";

export const CPU_LEAGUE_REGISTRY_VERSION =
  "mobbr-cpu-league-registry-1.0.0";

export const CPU_LEAGUE_IDS = Object.freeze([
  "local",
  "national",
  "world",
  "denden",
]);

export const CPU_TEAM_LEAGUE_ASSIGNMENTS =
  Object.freeze({
    // CPU_ASSIGNMENTS_START
    "L1": "local",
    "L2": "local",
    "L3": "local",
    "L4": "local",
    "L5": "local",
    "L6": "local",
    "L7": "local",
    "L8": "local",
    "L9": "local",
    "L10": "local",
    "L11": "local",
    "L12": "local",
    "L13": "local",
    "L14": "local",
    "L15": "local",
    "L16": "local",
    "L17": "local",
    "L18": "local",
    "L19": "local",
    "L20": "local",
    "L21": "local",
    "L22": "local",
    "L23": "local",
    "N1": "national",
    "N2": "national",
    "N3": "national",
    "N4": "national",
    "N5": "national",
    "N6": "national",
    "N7": "national",
    "N8": "national",
    "N9": "national",
    "N10": "national",
    "N11": "national",
    "N12": "national",
    "N13": "national",
    "N14": "national",
    "N15": "national",
    "N16": "national",
    "N17": "national",
    "N18": "national",
    "N19": "national",
    "N20": "national",
    "N21": "national",
    "N22": "national",
    "N23": "national",
    "N24": "national",
    "N25": "national",
    "N26": "national",
    "N27": "national",
    "N28": "national",
    "N29": "national",
    "N30": "national",
    "N31": "national",
    "N32": "national",
    "N33": "national",
    "N34": "national",
    "N35": "national",
    "N36": "national",
    "N37": "national",
    "N38": "national",
    "N39": "national",
    "N40": "national",
    "W1": "world",
    "W2": "world",
    "W3": "world",
    "W4": "world",
    "W5": "world",
    "W6": "world",
    "W7": "world",
    "W8": "world",
    "W9": "world",
    "W10": "world",
    "W11": "world",
    "W12": "world",
    "W13": "world",
    "W14": "world",
    "W15": "world",
    "W16": "world",
    "W17": "world",
    "W18": "world",
    "W19": "world",
    "W20": "world",
    "W21": "world",
    "W22": "world",
    "W23": "world",
    "W24": "world",
    "W25": "world",
    "W26": "world",
    "W27": "world",
    "W28": "world",
    "W29": "world",
    "W30": "world",
    "W31": "world",
    "W32": "world",
    "W33": "world",
    "W34": "world",
    "W35": "world",
    "W36": "world",
    "W37": "world",
    "W38": "world",
    "W39": "world",
    "W40": "world",
    "W41": "world",
    "W42": "world",
    "W43": "world",
    // CPU_ASSIGNMENTS_END
  });

const ALL_CPU_TEAM_MASTER = Object.freeze([
  ...LOCAL_CPU_TEAM_MASTER,
  ...NATIONAL_CPU_TEAM_MASTER,
  ...WORLD_CPU_TEAM_MASTER,
]);

const TEAM_BY_ID = new Map(
  ALL_CPU_TEAM_MASTER.map(
    (team) => [team.teamId, team],
  ),
);

function validateLeague(leagueId) {
  if (!CPU_LEAGUE_IDS.includes(leagueId)) {
    throw new RangeError(
      `Unsupported CPU league: ${leagueId}`,
    );
  }
  return leagueId;
}

export function getCpuLeagueForTeamId(teamId) {
  return (
    CPU_TEAM_LEAGUE_ASSIGNMENTS[
      String(teamId ?? "")
    ] ??
    null
  );
}

export function getCpuTeamMasterById(teamId) {
  return (
    TEAM_BY_ID.get(String(teamId ?? "")) ??
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
    ALL_CPU_TEAM_MASTER.filter(
      (team) =>
        getCpuLeagueForTeamId(team.teamId) ===
          normalizedLeague &&
        Number(
          team.unlockCalendarYear ??
          1989,
        ) <= calendarYear,
    ),
  );
}

export const LOCAL_CPU_TEAMS =
  getCpuTeamsForLeague("local", 9999);

export const NATIONAL_CPU_TEAMS =
  getCpuTeamsForLeague(
    "national",
    9999,
  );

export const WORLD_CPU_ALL_TEAMS =
  getCpuTeamsForLeague("world", 9999);

export const WORLD_CPU_TEAMS =
  Object.freeze(
    WORLD_CPU_ALL_TEAMS.filter(
      (team) =>
        team.isExpansionTeam !== true,
    ),
  );

export const WORLD_CPU_EXPANSION_TEAMS =
  Object.freeze(
    WORLD_CPU_ALL_TEAMS.filter(
      (team) =>
        team.isExpansionTeam === true,
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

export function getCpuTeamRegistry(
  calendarYear = 9999,
) {
  return Object.freeze(
    ALL_CPU_TEAM_MASTER
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
            originalLeague:
              /^L/i.test(team.teamId)
                ? "local"
                : /^N/i.test(team.teamId)
                  ? "national"
                  : "world",
          }),
      ),
  );
}

export function validateCpuLeagueRegistry() {
  const ids =
    ALL_CPU_TEAM_MASTER.map(
      (team) => team.teamId,
    );
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    throw new Error(
      "CPU team IDs must be unique.",
    );
  }

  for (const teamId of ids) {
    const league =
      getCpuLeagueForTeamId(teamId);
    if (!league) {
      throw new Error(
        `CPU league assignment is missing: ${teamId}`,
      );
    }
    validateLeague(league);
  }

  for (
    const teamId
    of Object.keys(
      CPU_TEAM_LEAGUE_ASSIGNMENTS,
    )
  ) {
    if (!TEAM_BY_ID.has(teamId)) {
      throw new Error(
        `Unknown CPU team in league assignment: ${teamId}`,
      );
    }
  }

  return Object.freeze({
    teamCount: ids.length,
    localCount:
      getCpuTeamsForLeague(
        "local",
        9999,
      ).length,
    nationalCount:
      getCpuTeamsForLeague(
        "national",
        9999,
      ).length,
    worldCount:
      getCpuTeamsForLeague(
        "world",
        9999,
      ).length,
    dendenCount:
      getCpuTeamsForLeague(
        "denden",
        9999,
      ).length,
    valid: true,
  });
}

validateCpuLeagueRegistry();
