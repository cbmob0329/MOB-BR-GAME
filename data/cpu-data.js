'use strict';

/**
 * MOB BR - cpu-data.js
 * CPU共通処理。チーム本体は地域別ファイルからregisterTeams()で登録する。
 */
(function initializeCpuData(global) {
  const MOBBR = global.MOBBR = global.MOBBR || {};
  MOBBR.DATA = MOBBR.DATA || {};
  MOBBR.API = MOBBR.API || {};

  if (!MOBBR.DATA.game || !MOBBR.API.game) {
    throw new Error(
      'cpu-data.jsより先にgame-data.jsを読み込んでください。'
    );
  }

  const GAME = MOBBR.DATA.game;
  const clone = MOBBR.API.game.clone;
  const ABILITY_API = MOBBR.API.ability || null;
  const TRAINING = MOBBR.DATA.training || null;

  const ROLES = [...GAME.roleOrder];
  const STATS = [...GAME.statOrder];

  const TIERS = [
    'local',
    'national',
    'world',
    'championship'
  ];

  const EXPECTED = {
    local: 23,
    national: 40,
    world: 41
  };

  const TIER_META = {
    local: {
      folder: 'Local',
      code: 'L'
    },

    national: {
      folder: 'National',
      code: 'N'
    },

    world: {
      folder: 'World',
      code: 'W'
    },

    championship: {
      folder: 'Championship',
      code: 'C'
    }
  };

  const ROLE_SUFFIX = {
    ATK: 'A',
    IGL: 'B',
    SUP: 'C'
  };

  const RANGE_ALIAS = {
    close: 'close',
    short: 'close',
    near: 'close',
    近: 'close',
    近距離: 'close',

    mid: 'mid',
    middle: 'mid',
    medium: 'mid',
    中: 'mid',
    中距離: 'mid',

    far: 'far',
    long: 'far',
    遠: 'far',
    遠距離: 'far'
  };

  const registry = {
    teams: {
      local: [],
      national: [],
      world: [],
      championship: []
    },

    teamById: Object.create(null),
    teamByCode: Object.create(null),
    playerById: Object.create(null),

    registrations: []
  };

  const text = (value) =>
    String(
      value == null
        ? ''
        : value
    ).trim();

  const idText = (value) =>
    text(value)
      .toLowerCase()
      .replace(/\s+/g, '_');

  const clamp = (
    value,
    min,
    max
  ) =>
    Math.max(
      min,
      Math.min(
        max,
        Number(value) || min
      )
    );

  const int = (
    value,
    min,
    max
  ) =>
    Math.floor(
      clamp(
        value,
        min,
        max
      )
    );

  function normalizeTier(value) {
    let tier = text(value)
      .toLowerCase();

    if (
      tier === 'champ' ||
      tier === 'final'
    ) {
      tier = 'championship';
    }

    if (!TIERS.includes(tier)) {
      throw new Error(
        `不明なCPU区分です: ${value}`
      );
    }

    return tier;
  }

  function normalizeRole(value) {
    let role = text(value)
      .toUpperCase();

    if (
      role === 'SAP' ||
      role === 'SUPPORT'
    ) {
      role = 'SUP';
    }

    if (role === 'ATTACKER') {
      role = 'ATK';
    }

    if (!ROLES.includes(role)) {
      throw new Error(
        `不明な役職です: ${value}`
      );
    }

    return role;
  }

  function normalizeRange(
    value,
    fallback = 'mid'
  ) {
    return (
      RANGE_ALIAS[
        text(value).toLowerCase()
      ] ||
      fallback
    );
  }

  /* ============================================================
     能力ランク F1～SS9＋MOB
  ============================================================ */

  const FALLBACK_RANKS = [
    ...[
      'F',
      'E',
      'D',
      'C',
      'B',
      'A',
      'S',
      'SS'
    ].flatMap((tier) =>
      Array.from(
        {
          length: 9
        },
        (_, index) =>
          `${tier}${index + 1}`
      )
    ),

    'MOB'
  ];

  const RANKS =
    TRAINING
      ?.playerAbilities
      ?.rankScale
      ?.order
      ?.length
      ? [
          ...TRAINING
            .playerAbilities
            .rankScale
            .order
        ]
      : FALLBACK_RANKS;

  function rankToOrdinal(value) {
    if (typeof value === 'number') {
      return int(
        value,
        1,
        RANKS.length
      );
    }

    const index =
      RANKS.indexOf(
        text(value).toUpperCase()
      );

    return index >= 0
      ? index + 1
      : 1;
  }

  function ordinalToRank(value) {
    return RANKS[
      int(
        value,
        1,
        RANKS.length
      ) - 1
    ];
  }

  function parseRange(value) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      const min =
        rankToOrdinal(
          value.min ??
          value.from ??
          value.rank ??
          'F1'
        );

      const max =
        rankToOrdinal(
          value.max ??
          value.to ??
          value.rank ??
          value.min ??
          'F1'
        );

      return makeRange(
        min,
        max
      );
    }

    if (typeof value === 'number') {
      return makeRange(
        value,
        value
      );
    }

    const source =
      text(value || 'F1')
        .toUpperCase()
        .replace(
          /〜|～|—|–|―/g,
          '-'
        )
        .replace(
          /\s+/g,
          ''
        );

    const [
      from,
      to = from
    ] = source.split('-');

    return makeRange(
      rankToOrdinal(from),
      rankToOrdinal(to)
    );
  }

  function makeRange(
    first,
    second
  ) {
    const minOrdinal =
      Math.min(
        first,
        second
      );

    const maxOrdinal =
      Math.max(
        first,
        second
      );

    return {
      min:
        ordinalToRank(
          minOrdinal
        ),

      max:
        ordinalToRank(
          maxOrdinal
        ),

      minOrdinal,
      maxOrdinal
    };
  }

  function normalizeRankSpec(value) {
    if (
      value &&
      typeof value === 'object' &&
      (
        value.normal != null ||
        value.hot != null
      )
    ) {
      const normal =
        parseRange(
          value.normal ??
          value.rank ??
          'F1'
        );

      return {
        normal,

        hot:
          parseRange(
            value.hot ??
            value.normal ??
            value.rank ??
            'F1'
          )
      };
    }

    const parts =
      text(value || 'F1')
        .replace(
          /　/g,
          ' '
        )
        .split('/')
        .map(
          (part) =>
            part.trim()
        )
        .filter(Boolean);

    const normal =
      parseRange(
        parts[0] || 'F1'
      );

    return {
      normal,

      hot:
        parseRange(
          parts[1] ||
          parts[0] ||
          'F1'
        )
    };
  }

  function resolveRankSpec(
    value,
    condition = 'normal',
    random = Math.random
  ) {
    const spec =
      normalizeRankSpec(
        value
      );

    const key =
      condition === 'hot' ||
      condition === 'good'
        ? 'hot'
        : 'normal';

    const range =
      spec[key];

    const ordinal =
      range.minOrdinal +
      Math.floor(
        clamp(
          random(),
          0,
          0.999999999
        ) *
        (
          range.maxOrdinal -
          range.minOrdinal +
          1
        )
      );

    return {
      condition: key,

      rank:
        ordinalToRank(
          ordinal
        ),

      ordinal,

      range:
        clone(range)
    };
  }

  const rankPercent = (ordinal) =>
    Number(
      (
        int(
          ordinal,
          1,
          RANKS.length
        ) /
        RANKS.length *
        100
      ).toFixed(2)
    );

  /* ============================================================
     地域別データ記述用
  ============================================================ */

  const definePlayer = (
    input = {}
  ) =>
    clone(input);

  const defineTeam = (
    input = {}
  ) =>
    clone(input);

  function imagePath(
    tier,
    teamNumber,
    suffix
  ) {
    const meta =
      TIER_META[
        normalizeTier(tier)
      ];

    return (
      `${meta.folder}/` +
      `${meta.code}` +
      `${teamNumber}` +
      `${suffix}.png`
    );
  }

  function defaultAssets(
    tier,
    teamNumber
  ) {
    return {
      logo:
        imagePath(
          tier,
          teamNumber,
          'D'
        ),

      IGL:
        imagePath(
          tier,
          teamNumber,
          ROLE_SUFFIX.IGL
        ),

      ATK:
        imagePath(
          tier,
          teamNumber,
          ROLE_SUFFIX.ATK
        ),

      SUP:
        imagePath(
          tier,
          teamNumber,
          ROLE_SUFFIX.SUP
        )
    };
  }

  /* ============================================================
     スキル・特殊能力
  ============================================================ */

  function representativeStats(
    stats = {}
  ) {
    return Object.fromEntries(
      STATS.map((statId) => {
        const range =
          normalizeRankSpec(
            stats[statId] ??
            'F1'
          ).normal;

        return [
          statId,

          ordinalToRank(
            Math.round(
              (
                range.minOrdinal +
                range.maxOrdinal
              ) /
              2
            )
          )
        ];
      })
    );
  }

  function getDefaultSkills(
    role,
    stats = {}
  ) {
    return ABILITY_API
      ?.getPlayerSkills
      ? ABILITY_API
          .getPlayerSkills(
            role,
            representativeStats(
              stats
            )
          )
      : [];
  }

  function findKnownSkill(
    skillId
  ) {
    for (
      const role of ROLES
    ) {
      const skill =
        getDefaultSkills(role)
          .find(
            (entry) =>
              entry.id ===
              skillId
          );

      if (skill) {
        return skill;
      }
    }

    return null;
  }

  function normalizeSkills(
    skills,
    role,
    stats = {}
  ) {
    const defaults =
      getDefaultSkills(
        role,
        stats
      );

    if (
      !Array.isArray(skills) ||
      !skills.length
    ) {
      return defaults.map(clone);
    }

    const result =
      skills.map(
        (
          skill,
          index
        ) => {
          if (
            typeof skill ===
            'string'
          ) {
            return clone(
              findKnownSkill(skill) || {
                id:
                  skill,

                name:
                  skill,

                slot:
                  index + 1,

                custom:
                  true,

                effects:
                  []
              }
            );
          }

          const known =
            findKnownSkill(
              skill?.id
            ) ||
            {};

          return {
            ...clone(known),
            ...clone(
              skill || {}
            ),

            id:
              text(
                skill?.id ||
                `skill_${index + 1}`
              ),

            slot:
              int(
                skill?.slot ??
                known.slot ??
                index + 1,
                1,
                99
              ),

            effects:
              clone(
                skill?.effects ??
                known.effects ??
                []
              )
          };
        }
      );

    defaults.forEach(
      (skill) => {
        if (
          result.length < 3 &&
          !result.some(
            (entry) =>
              entry.id ===
                skill.id ||
              entry.slot ===
                skill.slot
          )
        ) {
          result.push(
            clone(skill)
          );
        }
      }
    );

    return result
      .sort(
        (
          left,
          right
        ) =>
          left.slot -
          right.slot
      )
      .slice(
        0,
        3
      );
  }

  function normalizeSpecialAbilities(
    list,
    role
  ) {
    if (!Array.isArray(list)) {
      return [];
    }

    return list.map(
      (
        ability,
        index
      ) => {
        if (
          typeof ability ===
          'string'
        ) {
          const known =
            ABILITY_API
              ?.getAbilityById
              ? ABILITY_API
                  .getAbilityById(
                    ability
                  )
              : null;

          return known
            ? {
                id:
                  ability,

                name:
                  known.name ||
                  ability,

                role:
                  known.role ||
                  role,

                source:
                  'ability-data',

                definition:
                  clone(known)
              }
            : {
                id:
                  ability,

                name:
                  ability,

                role,

                source:
                  'cpu-data',

                effects:
                  []
              };
        }

        return {
          id:
            text(
              ability?.id ||
              `cpu_ability_${index + 1}`
            ),

          name:
            text(
              ability?.name ||
              ability?.id ||
              `特殊能力${index + 1}`
            ),

          role:
            ability?.role
              ? normalizeRole(
                  ability.role
                )
              : role,

          source:
            ability?.source ||
            'cpu-data',

          description:
            text(
              ability?.description
            ),

          effects:
            clone(
              ability?.effects ||
              []
            ),

          ...clone(
            ability || {}
          )
        };
      }
    );
  }

  /* ============================================================
     選手・チームの正規化
  ============================================================ */

  function normalizeStats(
    stats,
    fallbackRank = 'F1'
  ) {
    return Object.fromEntries(
      STATS.map(
        (statId) => [
          statId,

          normalizeRankSpec(
            stats?.[statId] ??
            fallbackRank
          )
        ]
      )
    );
  }

  function normalizeWeapon(
    weapon = {}
  ) {
    if (
      typeof weapon ===
      'string'
    ) {
      weapon = {
        name:
          weapon
      };
    }

    return {
      id:
        idText(
          weapon.id ||
          weapon.name ||
          'cpu_weapon'
        ),

      name:
        text(
          weapon.name ||
          'CPU WEAPON'
        ),

      image:
        text(
          weapon.image
        ),

      preferredRange:
        normalizeRange(
          weapon.preferredRange ??
          weapon.range
        ),

      secondaryRange:
        weapon.secondaryRange
          ? normalizeRange(
              weapon.secondaryRange
            )
          : null,

      attack:
        Number(
          weapon.attack
        ) || 0,

      accuracy:
        Number(
          weapon.accuracy
        ) || 0,

      speed:
        Number(
          weapon.speed
        ) || 0,

      magazine:
        Number(
          weapon.magazine
        ) || 8,

      ...clone(weapon)
    };
  }

  function normalizePlayer(
    raw = {},
    team,
    memberIndex
  ) {
    const role =
      normalizeRole(
        raw.role ||
        ROLES[
          memberIndex
        ]
      );

    const id =
      idText(
        raw.id ||
        `${team.id}_${role.toLowerCase()}`
      );

    const fallbackRank =
      raw.rank ??
      raw.powerRank ??
      team.playerRankSource ??
      team.teamRankSource ??
      'F1';

    const stats =
      normalizeStats(
        raw.stats,
        fallbackRank
      );

    const assets =
      defaultAssets(
        team.tier,
        team.number
      );

    return {
      id,
      teamId:
        team.id,

      tier:
        team.tier,

      teamNumber:
        team.number,

      role,

      name:
        text(
          raw.name ||
          `${role} PLAYER`
        ),

      image:
        text(
          raw.image ||
          assets[role]
        ),

      description:
        text(
          raw.description
        ),

      rank:
        normalizeRankSpec(
          fallbackRank
        ),

      stats,

      weapon:
        normalizeWeapon(
          raw.weapon || {}
        ),

      skills:
        normalizeSkills(
          raw.skills,
          role,
          stats
        ),

      specialAbilities:
        normalizeSpecialAbilities(
          raw.specialAbilities ||
          raw.abilities,
          role
        ),

      personality:
        clone(
          raw.personality || {}
        ),

      battleAI:
        clone(
          raw.battleAI || {}
        ),

      card:
        clone(
          raw.card || {}
        ),

      tags:
        Array.isArray(
          raw.tags
        )
          ? [
              ...raw.tags
            ]
          : []
    };
  }

  function normalizeTeam(
    raw = {},
    tier,
    index
  ) {
    const normalizedTier =
      normalizeTier(tier);

    const meta =
      TIER_META[
        normalizedTier
      ];

    const number =
      int(
        raw.number ??
        index + 1,
        1,
        9999
      );

    const code =
      text(
        raw.code ||
        `${meta.code}${number}`
      ).toUpperCase();

    const id =
      idText(
        raw.id ||
        `${normalizedTier}_${code}`
      );

    const assets =
      defaultAssets(
        normalizedTier,
        number
      );

    const team = {
      id,
      code,

      tier:
        normalizedTier,

      number,

      name:
        text(
          raw.name ||
          `${meta.code}${number} TEAM`
        ),

      logo:
        text(
          raw.logo ||
          assets.logo
        ),

      description:
        text(
          raw.description
        ),

      teamRankSource:
        raw.teamRank ??
        raw.rank ??
        'F1',

      playerRankSource:
        raw.playerRank ??
        raw.rank ??
        'F1',

      teamRank:
        normalizeRankSpec(
          raw.teamRank ??
          raw.rank ??
          'F1'
        ),

      playerRank:
        normalizeRankSpec(
          raw.playerRank ??
          raw.rank ??
          'F1'
        ),

      strength:
        clone(
          raw.strength || {}
        ),

      tags:
        Array.isArray(
          raw.tags
        )
          ? [
              ...raw.tags
            ]
          : [],

      card:
        clone(
          raw.card || {}
        )
    };

    const members =
      Array.isArray(
        raw.members
      )
        ? raw.members
        : [
            raw.IGL ||
            raw.igl,

            raw.ATK ||
            raw.atk,

            raw.SUP ||
            raw.sup ||
            raw.SAP ||
            raw.sap
          ].filter(Boolean);

    team.members =
      members.map(
        (
          member,
          memberIndex
        ) =>
          normalizePlayer(
            member,
            team,
            memberIndex
          )
      );

    team.memberByRole =
      Object.fromEntries(
        team.members.map(
          (member) => [
            member.role,
            member
          ]
        )
      );

    return team;
  }

  /* ============================================================
     登録・検索
  ============================================================ */

  function clearTier(tier) {
    registry
      .teams[tier]
      .forEach(
        (team) => {
          delete registry
            .teamById[
              team.id
            ];

          delete registry
            .teamByCode[
              team.code
            ];

          team.members
            .forEach(
              (player) => {
                delete registry
                  .playerById[
                    player.id
                  ];
              }
            );
        }
      );

    registry.teams[tier] = [];
  }

  function registerTeams(
    tier,
    rawTeams,
    options = {}
  ) {
    const normalizedTier =
      normalizeTier(tier);

    if (!Array.isArray(rawTeams)) {
      throw new TypeError(
        `${normalizedTier}チームは配列で登録してください。`
      );
    }

    if (
      options.replaceTier ===
      true
    ) {
      clearTier(
        normalizedTier
      );
    }

    const teams =
      rawTeams.map(
        (
          raw,
          index
        ) =>
          normalizeTeam(
            raw,
            normalizedTier,
            index
          )
      );

    const newTeamIds =
      new Set();

    const newCodes =
      new Set();

    const newPlayerIds =
      new Set();

    teams.forEach(
      (team) => {
        if (
          registry
            .teamById[
              team.id
            ] ||
          newTeamIds.has(
            team.id
          )
        ) {
          throw new Error(
            `CPUチームID重複: ${team.id}`
          );
        }

        if (
          registry
            .teamByCode[
              team.code
            ] ||
          newCodes.has(
            team.code
          )
        ) {
          throw new Error(
            `CPUチームコード重複: ${team.code}`
          );
        }

        if (
          team.members.length !==
          3
        ) {
          throw new Error(
            `${team.name}の選手数が3人ではありません。`
          );
        }

        const roles =
          new Set();

        team.members
          .forEach(
            (player) => {
              if (
                registry
                  .playerById[
                    player.id
                  ] ||
                newPlayerIds.has(
                  player.id
                )
              ) {
                throw new Error(
                  `CPU選手ID重複: ${player.id}`
                );
              }

              if (
                roles.has(
                  player.role
                )
              ) {
                throw new Error(
                  `${team.name}で${player.role}が重複しています。`
                );
              }

              roles.add(
                player.role
              );

              newPlayerIds.add(
                player.id
              );
            }
          );

        ROLES.forEach(
          (role) => {
            if (
              !roles.has(role)
            ) {
              throw new Error(
                `${team.name}に${role}がいません。`
              );
            }
          }
        );

        newTeamIds.add(
          team.id
        );

        newCodes.add(
          team.code
        );
      }
    );

    teams.forEach(
      (team) => {
        registry
          .teams[
            normalizedTier
          ]
          .push(team);

        registry
          .teamById[
            team.id
          ] =
          team;

        registry
          .teamByCode[
            team.code
          ] =
          team;

        team.members
          .forEach(
            (player) => {
              registry
                .playerById[
                  player.id
                ] =
                player;
            }
          );
      }
    );

    const result = {
      tier:
        normalizedTier,

      addedTeams:
        teams.length,

      totalTeams:
        registry
          .teams[
            normalizedTier
          ]
          .length,

      totalPlayers:
        registry
          .teams[
            normalizedTier
          ]
          .length *
        3,

      source:
        text(
          options.source
        )
    };

    registry
      .registrations
      .push(result);

    return clone(result);
  }

  function findTeam(
    value,
    tier = null
  ) {
    const key =
      text(value);

    let team =
      registry
        .teamById[
          idText(key)
        ] ||
      registry
        .teamByCode[
          key.toUpperCase()
        ] ||
      null;

    if (
      team &&
      tier &&
      team.tier !==
        normalizeTier(tier)
    ) {
      team = null;
    }

    return team
      ? clone(team)
      : null;
  }

  function findPlayer(value) {
    const player =
      registry
        .playerById[
          idText(value)
        ];

    return player
      ? clone(player)
      : null;
  }

  function getTeams(tier) {
    return registry
      .teams[
        normalizeTier(tier)
      ]
      .map(clone);
  }

  function getAllTeams(
    options = {}
  ) {
    const tiers =
      options.tiers?.length
        ? options.tiers
            .map(
              normalizeTier
            )
        : [
            'local',
            'national',
            'world'
          ];

    if (
      options
        .includeChampionship
    ) {
      tiers.push(
        'championship'
      );
    }

    return [
      ...new Set(tiers)
    ]
      .flatMap(
        (tier) =>
          registry
            .teams[tier]
      )
      .map(clone);
  }

  function getAllPlayers(
    options = {}
  ) {
    return getAllTeams(options)
      .flatMap(
        (team) =>
          team.members
      );
  }

  function findPlayersByName(
    name
  ) {
    const needle =
      text(name)
        .toLowerCase();

    return Object
      .values(
        registry.playerById
      )
      .filter(
        (player) =>
          player.name
            .toLowerCase()
            .includes(
              needle
            )
      )
      .map(clone);
  }

  /* ============================================================
     戦闘用データ
  ============================================================ */

  function resolveStatsForBattle(
    stats,
    condition = 'normal',
    random = Math.random
  ) {
    return Object.fromEntries(
      STATS.map(
        (statId) => {
          const result =
            resolveRankSpec(
              stats?.[statId] ??
              'F1',
              condition,
              random
            );

          return [
            statId,

            {
              rank:
                result.rank,

              ordinal:
                result.ordinal,

              percent:
                rankPercent(
                  result.ordinal
                )
            }
          ];
        }
      )
    );
  }

  function resolveSkillsForBattle(
    skills,
    role,
    resolvedStats
  ) {
    const runtimeStats =
      Object.fromEntries(
        STATS.map(
          (statId) => [
            statId,
            resolvedStats[
              statId
            ].rank
          ]
        )
      );

    return (
      skills || []
    ).map(
      (skill) =>
        ABILITY_API
          ?.calculateSkillRuntime
          ? ABILITY_API
              .calculateSkillRuntime(
                skill,
                role,
                runtimeStats
              )
          : clone(skill)
    );
  }

  function playerPower(
    resolvedStats
  ) {
    return Number(
      (
        STATS.reduce(
          (
            sum,
            statId
          ) =>
            sum +
            (
              resolvedStats[
                statId
              ]?.percent ||
              0
            ),
          0
        ) /
        STATS.length
      ).toFixed(2)
    );
  }

  function resolvePlayerForBattle(
    playerOrId,
    options = {}
  ) {
    const player =
      typeof playerOrId ===
      'string'
        ? registry
            .playerById[
              idText(
                playerOrId
              )
            ]
        : playerOrId;

    if (!player) {
      return null;
    }

    const condition =
      options.condition ===
        'hot' ||
      options.condition ===
        'good'
        ? 'hot'
        : 'normal';

    const stats =
      resolveStatsForBattle(
        player.stats,
        condition,
        options.random ||
        Math.random
      );

    return {
      id:
        player.id,

      teamId:
        player.teamId,

      tier:
        player.tier,

      role:
        player.role,

      name:
        player.name,

      image:
        player.image,

      description:
        player.description,

      condition,

      stats,

      power:
        playerPower(
          stats
        ),

      weapon:
        clone(
          player.weapon
        ),

      skills:
        resolveSkillsForBattle(
          player.skills,
          player.role,
          stats
        ),

      specialAbilities:
        clone(
          player
            .specialAbilities
        ),

      battleAI:
        clone(
          player.battleAI
        ),

      tags: [
        ...player.tags
      ]
    };
  }

  function createBattleTeamPayload(
    teamOrId,
    options = {}
  ) {
    const team =
      typeof teamOrId ===
      'string'
        ? (
            registry
              .teamById[
                idText(
                  teamOrId
                )
              ] ||
            registry
              .teamByCode[
                text(
                  teamOrId
                ).toUpperCase()
              ]
          )
        : teamOrId;

    if (!team) {
      return null;
    }

    const defaultCondition =
      options.condition ===
        'hot' ||
      options.condition ===
        'good'
        ? 'hot'
        : 'normal';

    const conditionByPlayer =
      options
        .conditionByPlayer ||
      {};

    const members =
      team.members.map(
        (player) =>
          resolvePlayerForBattle(
            player,
            {
              random:
                options.random ||
                Math.random,

              condition:
                conditionByPlayer[
                  player.id
                ] ||
                conditionByPlayer[
                  player.role
                ] ||
                defaultCondition
            }
          )
      );

    return {
      schema:
        'mob_br_cpu_team_v1',

      id:
        team.id,

      code:
        team.code,

      tier:
        team.tier,

      number:
        team.number,

      name:
        team.name,

      logo:
        team.logo,

      description:
        team.description,

      members,

      memberByRole:
        Object.fromEntries(
          members.map(
            (member) => [
              member.role,
              member
            ]
          )
        ),

      teamPower:
        Number(
          (
            members.reduce(
              (
                sum,
                member
              ) =>
                sum +
                member.power,
              0
            ) /
            members.length
          ).toFixed(2)
        ),

      strength:
        clone(
          team.strength
        ),

      tags: [
        ...team.tags
      ]
    };
  }

  function createTournamentCpuPayload(
    tier,
    options = {}
  ) {
    const normalizedTier =
      normalizeTier(tier);

    return {
      schema:
        'mob_br_cpu_tournament_v1',

      tier:
        normalizedTier,

      teams:
        registry
          .teams[
            normalizedTier
          ]
          .map(
            (team) =>
              createBattleTeamPayload(
                team,
                options
              )
          )
    };
  }

  function registerChampionshipTeams(
    teamIds
  ) {
    if (!Array.isArray(teamIds)) {
      throw new TypeError(
        'Championship出場チームIDは配列で指定してください。'
      );
    }

    registry
      .teams
      .championship =
      teamIds.map(
        (value) => {
          const team =
            registry
              .teamById[
                idText(value)
              ] ||
            registry
              .teamByCode[
                text(
                  value
                ).toUpperCase()
              ];

          if (!team) {
            throw new Error(
              `Championship参照チームが見つかりません: ${value}`
            );
          }

          return team;
        }
      );

    return {
      tier:
        'championship',

      totalTeams:
        registry
          .teams
          .championship
          .length
    };
  }

  /* ============================================================
     card-data.js用
  ============================================================ */

  function getPlayerCardSources(
    options = {}
  ) {
    return getAllTeams(options)
      .flatMap(
        (team) =>
          team.members.map(
            (player) => ({
              id:
                `card_${player.id}`,

              sourceType:
                'player',

              tier:
                team.tier,

              teamId:
                team.id,

              teamCode:
                team.code,

              teamName:
                team.name,

              teamLogo:
                team.logo,

              playerId:
                player.id,

              role:
                player.role,

              name:
                player.name,

              image:
                player.image,

              description:
                player.description,

              card:
                clone(
                  player.card
                ),

              player:
                clone(player)
            })
          )
      );
  }

  function getBadgeSources(
    options = {}
  ) {
    return getAllTeams(options)
      .map(
        (team) => ({
          id:
            `badge_${team.id}`,

          sourceType:
            'team',

          tier:
            team.tier,

          teamId:
            team.id,

          teamCode:
            team.code,

          name:
            team.name,

          image:
            team.logo,

          description:
            team.description,

          card:
            clone(
              team.card
            ),

          team:
            clone(team)
        })
      );
  }

  /* ============================================================
     検証
  ============================================================ */

  function validateCpuData(
    options = {}
  ) {
    const errors = [];
    const warnings = [];

    [
      'local',
      'national',
      'world'
    ].forEach(
      (tier) => {
        const message =
          `${tier}チーム数が` +
          `${EXPECTED[tier]}` +
          `ではありません: ` +
          `${registry.teams[tier].length}`;

        if (
          registry
            .teams[tier]
            .length !==
          EXPECTED[tier]
        ) {
          (
            options.strictCounts
              ? errors
              : warnings
          ).push(message);
        }
      }
    );

    Object
      .values(
        registry.teamById
      )
      .forEach(
        (team) => {
          if (
            team.members.length !==
            3
          ) {
            errors.push(
              `${team.id}の選手数が3人ではありません。`
            );
          }

          const roles =
            new Set(
              team.members.map(
                (player) =>
                  player.role
              )
            );

          ROLES.forEach(
            (role) => {
              if (
                !roles.has(role)
              ) {
                errors.push(
                  `${team.id}に${role}がいません。`
                );
              }
            }
          );

          team.members
            .forEach(
              (player) => {
                STATS.forEach(
                  (statId) => {
                    if (
                      !player
                        .stats[
                          statId
                        ]
                    ) {
                      errors.push(
                        `${player.id}.${statId}がありません。`
                      );
                    }
                  }
                );

                if (
                  player
                    .skills
                    .length !==
                  3
                ) {
                  warnings.push(
                    `${player.id}のスキル数が3ではありません: ${player.skills.length}`
                  );
                }
              }
            );
        }
      );

    return {
      valid:
        errors.length === 0,

      errors,
      warnings,

      counts: {
        localTeams:
          registry
            .teams
            .local
            .length,

        nationalTeams:
          registry
            .teams
            .national
            .length,

        worldTeams:
          registry
            .teams
            .world
            .length,

        championshipTeams:
          registry
            .teams
            .championship
            .length,

        totalTeams:
          registry
            .teams
            .local
            .length +
          registry
            .teams
            .national
            .length +
          registry
            .teams
            .world
            .length,

        totalPlayers:
          Object.keys(
            registry.playerById
          ).length,

        playerCards:
          getPlayerCardSources()
            .length,

        badges:
          getBadgeSources()
            .length
      }
    };
  }

  function getRegistrationStatus() {
    return {
      registrations:
        clone(
          registry
            .registrations
        ),

      validation:
        validateCpuData(),

      expectedTeamCounts:
        clone(EXPECTED)
    };
  }

  const CPU_DATA = {
    version:
      '1.0.0',

    tiers:
      TIERS,

    tierMeta:
      TIER_META,

    expectedTeamCounts:
      EXPECTED,

    roleOrder:
      ROLES,

    statOrder:
      STATS,

    playerRankOrder:
      RANKS,

    teams:
      registry.teams,

    teamById:
      registry.teamById,

    teamByCode:
      registry.teamByCode,

    playerById:
      registry.playerById
  };

  const CPU_API =
    Object.freeze({
      normalizeTier,
      normalizeRole,
      normalizeRange,

      rankToOrdinal,
      ordinalToRank,
      parseRange,
      normalizeRankSpec,
      resolveRankSpec,

      definePlayer,
      defineTeam,
      imagePath,
      defaultAssets,

      normalizeStats,
      normalizeWeapon,
      normalizeSkills,
      normalizeSpecialAbilities,
      normalizePlayer,
      normalizeTeam,

      registerTeams,
      registerChampionshipTeams,

      findTeam,
      findPlayer,
      findPlayersByName,
      getTeams,
      getAllTeams,
      getAllPlayers,

      resolveStatsForBattle,
      resolveSkillsForBattle,
      resolvePlayerForBattle,
      createBattleTeamPayload,
      createTournamentCpuPayload,

      getPlayerCardSources,
      getBadgeSources,

      validateCpuData,
      getRegistrationStatus
    });

  MOBBR.DATA.cpu =
    CPU_DATA;

  MOBBR.API.cpu =
    CPU_API;

  global.MOBBR_CPU_DATA =
    CPU_DATA;

  global.MOBBR_CPU_API =
    CPU_API;
})(
  typeof window !== 'undefined'
    ? window
    : globalThis
);
