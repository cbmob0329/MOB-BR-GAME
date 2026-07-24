'use strict';

/**
 * MOB BR - cpu-data.js
 * CPU共通登録・役職別標準スキル・標準特殊能力・戦闘変換。
 *
 * 読み込み順:
 * game-data.js
 * → ability-data.js
 * → training-data.js
 * → coach-data.js
 * → cpu-data.js
 * → cpu-local-data.js
 * → cpu-national-data.js
 * → cpu-world-data.js
 * → card-data.js
 * → shop-data.js
 *
 * 地域ファイルの選手データ:
 *
 * skills未指定
 * → 役職別標準スキル2つ
 *
 * skills指定
 * → 指定した2つへ完全置換
 *
 * skillOverrides:{1,2}
 * → 指定した枠だけ上書き
 *
 * passive未指定
 * → 役職別標準特殊能力
 *
 * passive指定
 * → 指定内容へ置換
 *
 * シールドチャージ
 * → 常に3枠目へ追加
 */
(function initializeCpuData(global) {
  const MOBBR =
    global.MOBBR =
    global.MOBBR || {};

  MOBBR.DATA =
    MOBBR.DATA || {};

  MOBBR.API =
    MOBBR.API || {};

  const GAME =
    MOBBR.DATA.game || {};

  const ABILITY_DATA =
    MOBBR.DATA.ability ||
    global.MOB_BR_ABILITY_DATA ||
    {};

  const ABILITY_UTILS =
    MOBBR.DATA.abilityUtils ||
    global.MOB_BR_ABILITY_UTILS ||
    MOBBR.API.ability ||
    {};

  const TIERS = [
    'local',
    'national',
    'world'
  ];

  const ROLES = [
    'IGL',
    'ATK',
    'SUP'
  ];

  const STAT_KEYS =
    GAME.statOrder || [
      'stamina',
      'mind',
      'physical',
      'aim',
      'agility',
      'technique',
      'support'
    ];

  const ROLE_ALIASES = {
    IGL: 'IGL',
    ATK: 'ATK',
    SUP: 'SUP',
    SAP: 'SUP',

    LEADER: 'IGL',
    ATTACKER: 'ATK',
    SUPPORTER: 'SUP'
  };

  const ROLE_SLOT = {
    ATK: 'A',
    IGL: 'B',
    SUP: 'C'
  };

  const TIER_FOLDER = {
    local: 'Local',
    national: 'National',
    world: 'World'
  };

  const RANK_ORDER = [
    ...[
      'F',
      'E',
      'D',
      'C',
      'B',
      'A',
      'S',
      'SS'
    ].flatMap(
      (tier) =>
        Array.from(
          {
            length: 9
          },
          (
            _,
            index
          ) =>
            `${tier}${index + 1}`
        )
    ),

    'MOB'
  ];

  const registry = {
    teams: {
      local: [],
      national: [],
      world: []
    },

    teamById:
      Object.create(null),

    playerById:
      Object.create(null),

    teamByCode:
      Object.create(null),

    registrations: []
  };

  /* ============================================================
     1. 共通関数
  ============================================================ */

  function clone(value) {
    if (
      value ===
      undefined
    ) {
      return undefined;
    }

    if (
      typeof structuredClone ===
      'function'
    ) {
      return structuredClone(
        value
      );
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function text(value) {
    return value == null
      ? ''
      : String(value).trim();
  }

  function clamp(
    value,
    min,
    max
  ) {
    return Math.max(
      min,

      Math.min(
        max,
        Number(value) || 0
      )
    );
  }

  function hash(value) {
    let result =
      2166136261;

    const source =
      String(value || '');

    for (
      let index = 0;
      index < source.length;
      index += 1
    ) {
      result ^=
        source.charCodeAt(
          index
        );

      result =
        Math.imul(
          result,
          16777619
        );
    }

    return result >>> 0;
  }

  function makeId(
    prefix,
    value
  ) {
    return (
      `${prefix}_` +
      hash(value)
        .toString(36)
    );
  }

  /* ============================================================
     2. 区分・役職
  ============================================================ */

  function normalizeTier(tier) {
    const value =
      text(tier)
        .toLowerCase();

    if (
      value === 'champ' ||
      value === 'championship'
    ) {
      return 'championship';
    }

    return TIERS.includes(value)
      ? value
      : '';
  }

  function normalizeRole(role) {
    return (
      ROLE_ALIASES[
        text(role)
          .toUpperCase()
      ] ||
      'IGL'
    );
  }

  function normalizeCondition(
    condition
  ) {
    const value =
      text(condition)
        .toLowerCase();

    if (
      [
        'hot',
        'good',
        '好調'
      ].includes(value)
    ) {
      return 'hot';
    }

    if (
      [
        'bad',
        'poor',
        '不調'
      ].includes(value)
    ) {
      return 'bad';
    }

    return 'normal';
  }

  /* ============================================================
     3. ランク
  ============================================================ */

  function rankToOrdinal(rank) {
    if (
      Number.isFinite(
        Number(rank)
      )
    ) {
      return Math.round(
        clamp(
          Number(rank),
          1,
          RANK_ORDER.length
        )
      );
    }

    const normalized =
      text(rank)
        .toUpperCase();

    const index =
      RANK_ORDER.indexOf(
        normalized
      );

    return index >= 0
      ? index + 1
      : 1;
  }

  function ordinalToRank(
    ordinal
  ) {
    const index =
      Math.round(
        clamp(
          ordinal,
          1,
          RANK_ORDER.length
        )
      ) - 1;

    return RANK_ORDER[index];
  }

  function normalizeRankRange(
    value,
    fallback = 'F1'
  ) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      const rawMin =
        text(
          value.min ||
          value.from ||
          value.start ||
          fallback
        ).toUpperCase();

      const rawMax =
        text(
          value.max ||
          value.to ||
          value.end ||
          rawMin
        ).toUpperCase();

      const min =
        RANK_ORDER.includes(rawMin)
          ? rawMin
          : fallback;

      const max =
        RANK_ORDER.includes(rawMax)
          ? rawMax
          : min;

      return {
        min,
        max,
        text:
          `${min}～${max}`
      };
    }

    const source =
      text(
        value ||
        fallback
      )
        .toUpperCase()
        .replace(
          /[〜~―—－]/g,
          '～'
        );

    const [
      rawMin,
      rawMax = rawMin
    ] =
      source
        .split('～')
        .map(
          (entry) =>
            entry.trim()
        );

    const min =
      RANK_ORDER.includes(rawMin)
        ? rawMin
        : fallback;

    const max =
      RANK_ORDER.includes(rawMax)
        ? rawMax
        : min;

    return {
      min,
      max,
      text:
        `${min}～${max}`
    };
  }

  function pickRankFromRange(
    value,
    random = Math.random
  ) {
    const range =
      normalizeRankRange(value);

    const first =
      rankToOrdinal(
        range.min
      );

    const last =
      rankToOrdinal(
        range.max
      );

    const low =
      Math.min(
        first,
        last
      );

    const high =
      Math.max(
        first,
        last
      );

    const roll =
      clamp(
        random(),
        0,
        0.999999999
      );

    return ordinalToRank(
      low +
      Math.floor(
        roll *
        (
          high -
          low +
          1
        )
      )
    );
  }

  /* ============================================================
     4. 7能力
  ============================================================ */

  function normalizeStatValue(
    value,
    fallback = 'F1'
  ) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      const rawNormal =
        text(
          value.normal ||
          value.base ||
          value.value ||
          fallback
        ).toUpperCase();

      const rawHot =
        text(
          value.hot ||
          value.good ||
          rawNormal
        ).toUpperCase();

      const rawBad =
        text(
          value.bad ||
          value.poor ||
          rawNormal
        ).toUpperCase();

      const normal =
        RANK_ORDER.includes(
          rawNormal
        )
          ? rawNormal
          : fallback;

      const hot =
        RANK_ORDER.includes(
          rawHot
        )
          ? rawHot
          : normal;

      const bad =
        RANK_ORDER.includes(
          rawBad
        )
          ? rawBad
          : normal;

      return {
        normal,
        hot,
        bad
      };
    }

    const parts =
      text(
        value ||
        fallback
      )
        .toUpperCase()
        .split('/')
        .map(
          (entry) =>
            entry.trim()
        );

    const normal =
      RANK_ORDER.includes(
        parts[0]
      )
        ? parts[0]
        : fallback;

    const hot =
      RANK_ORDER.includes(
        parts[1]
      )
        ? parts[1]
        : normal;

    const bad =
      RANK_ORDER.includes(
        parts[2]
      )
        ? parts[2]
        : normal;

    return {
      normal,
      hot,
      bad
    };
  }

  function normalizeStats(
    stats
  ) {
    if (
      Array.isArray(stats)
    ) {
      return Object.fromEntries(
        STAT_KEYS.map(
          (
            key,
            index
          ) => [
            key,

            normalizeStatValue(
              stats[index]
            )
          ]
        )
      );
    }

    return Object.fromEntries(
      STAT_KEYS.map(
        (key) => [
          key,

          normalizeStatValue(
            stats?.[key]
          )
        ]
      )
    );
  }

  function resolveStats(
    stats,
    condition = 'normal'
  ) {
    const state =
      normalizeCondition(
        condition
      );

    const normalized =
      normalizeStats(stats);

    const labels =
      Object.fromEntries(
        STAT_KEYS.map(
          (key) => [
            key,

            normalized[key][state] ||
            normalized[key].normal
          ]
        )
      );

    const ordinals =
      Object.fromEntries(
        STAT_KEYS.map(
          (key) => [
            key,

            rankToOrdinal(
              labels[key]
            )
          ]
        )
      );

    return {
      labels,
      ordinals
    };
  }

  /* ============================================================
     5. スキル正規化
  ============================================================ */

  function normalizeSkill(
    skillData,
    context = {}
  ) {
    if (
      !skillData ||
      typeof skillData !==
        'object'
    ) {
      return null;
    }

    const normalized =
      clone(skillData);

    normalized.id =
      text(normalized.id) ||
      makeId(
        'cpu_skill',

        (
          `${context.playerId || ''}:` +
          `${context.slot || 0}:` +
          `${normalized.name || normalized.type || 'skill'}`
        )
      );

    normalized.slot =
      Number(
        normalized.slot
      ) ||
      Number(
        context.slot
      ) ||
      1;

    normalized.name =
      text(
        normalized.name
      ) ||
      `CPUスキル${normalized.slot}`;

    return normalized;
  }

  function normalizePassive(
    passiveData,
    context = {}
  ) {
    if (
      !passiveData ||
      typeof passiveData !==
        'object'
    ) {
      return null;
    }

    const normalized =
      clone(passiveData);

    normalized.id =
      text(normalized.id) ||
      makeId(
        'cpu_passive',

        (
          `${context.playerId || ''}:` +
          `${normalized.name || 'passive'}`
        )
      );

    normalized.name =
      text(
        normalized.name
      ) ||
      'CPU特殊能力';

    normalized.description =
      text(
        normalized.description
      );

    return normalized;
  }

  /* ============================================================
     6. ability-data.jsが無い時の標準スキル
  ============================================================ */

  function fallbackRoleSkills(
    role
  ) {
    const normalizedRole =
      normalizeRole(role);

    if (
      normalizedRole ===
      'ATK'
    ) {
      return [
        {
          id:
            'cpu_default_atk_power_shot',

          slot: 1,

          name:
            'パワーショット',

          type:
            'DAMAGE',

          target:
            '敵単体',

          ct: 5.5,

          description:
            '敵単体へ高火力攻撃を行う。',

          effect: {
            code:
              'single_damage',

            power:
              2.4
          }
        },

        {
          id:
            'cpu_default_atk_rush',

          slot: 2,

          name:
            'ラッシュショット',

          type:
            'DAMAGE',

          target:
            '敵単体',

          ct: 6.5,

          description:
            '敵単体へ3回連続攻撃を行う。',

          effect: {
            code:
              'multi_damage',

            shots:
              3,

            power:
              0.9
          }
        }
      ];
    }

    if (
      normalizedRole ===
      'SUP'
    ) {
      return [
        {
          id:
            'cpu_default_sup_team_heal',

          slot: 1,

          name:
            'チームヒール',

          type:
            'HEAL',

          target:
            '味方全体',

          ct: 6,

          description:
            '味方全体のHPを回復する。',

          effect: {
            code:
              'team_heal',

            healRate:
              0.14
          }
        },

        {
          id:
            'cpu_default_sup_recovery_call',

          slot: 2,

          name:
            'リカバリーコール',

          type:
            'BUFF',

          target:
            '味方全体',

          ct: 7,

          description:
            '味方全体のCTを短縮する。',

          effect: {
            code:
              'team_ct_reduction',

            rate:
              0.10
          }
        }
      ];
    }

    return [
      {
        id:
          'cpu_default_igl_team_call',

        slot: 1,

        name:
          'チームコール',

        type:
          'BUFF',

        target:
          '味方全体',

        ct: 6,

        description:
          '味方全体のエイムとマインドをアップする。',

        effect: {
          code:
            'team_stat_buff',

          baseStats: {
            aim: 2,
            mind: 2
          }
        }
      },

      {
        id:
          'cpu_default_igl_tactics',

        slot: 2,

        name:
          'チームタクティクス',

        type:
          'BUFF',

        target:
          '味方全体',

        ct: 7,

        description:
          '味方全体のCTを短縮する。',

        effect: {
          code:
            'team_ct_reduction',

          rate:
            0.10
        }
      }
    ];
  }

  /* ============================================================
     7. シールドチャージ
  ============================================================ */

  function fallbackShieldCharge(
    role,
    abilities = {}
  ) {
    const normalizedRole =
      normalizeRole(role);

    const baseCooldowns = {
      IGL: 7,
      ATK: 7.5,
      SUP: 6.5
    };

    const agilityProgress =
      (
        clamp(
          abilities.agility,
          1,
          RANK_ORDER.length
        ) -
        1
      ) /
      (
        RANK_ORDER.length -
        1
      );

    const supportProgress =
      (
        clamp(
          abilities.support,
          1,
          RANK_ORDER.length
        ) -
        1
      ) /
      (
        RANK_ORDER.length -
        1
      );

    const cooldownReduction =
      agilityProgress *
      0.15;

    const healRate =
      Math.min(
        0.30,

        0.20 +
        (
          supportProgress *
          0.10
        )
      );

    const baseCt =
      baseCooldowns[
        normalizedRole
      ];

    return {
      id:
        'shield_charge',

      slot:
        3,

      name:
        'シールドチャージ',

      type:
        'HEAL',

      target:
        '自分を含む味方1人',

      common:
        true,

      role:
        normalizedRole,

      description:
        '自分を含む味方1人のHPを回復する。',

      condition:
        'HPが減っている味方がいる時に発動',

      ct:
        Number(
          (
            baseCt *
            (
              1 -
              cooldownReduction
            )
          ).toFixed(2)
        ),

      baseCt,

      cooldownReduction:
        Number(
          cooldownReduction
            .toFixed(4)
        ),

      baseHealRate:
        0.20,

      healRate:
        Number(
          healRate
            .toFixed(4)
        ),

      maxHealRate:
        0.30,

      effect: {
        code:
          'single_ally_heal',

        baseHealRate:
          0.20,

        actualHealRate:
          Number(
            healRate
              .toFixed(4)
          ),

        maxHealRate:
          0.30,

        canTargetSelf:
          true,

        targetPriority:
          'lowest_hp_rate'
      }
    };
  }

  function getAbilityRoleSkills(
    role,
    abilities = {}
  ) {
    if (
      typeof ABILITY_UTILS
        .createPlayerSkills ===
      'function'
    ) {
      const generated =
        ABILITY_UTILS
          .createPlayerSkills({
            role:
              normalizeRole(role),

            abilities
          });

      if (
        Array.isArray(
          generated
        ) &&
        generated.length >= 2
      ) {
        return generated
          .slice(0, 2)
          .map(clone);
      }
    }

    const configured =
      ABILITY_DATA
        .playerSkills
        ?.byRole
        ?.[
          normalizeRole(role)
        ];

    if (
      Array.isArray(
        configured
      ) &&
      configured.length >= 2
    ) {
      return configured
        .slice(0, 2)
        .map(clone);
    }

    return fallbackRoleSkills(
      role
    );
  }

  function getShieldCharge(
    role,
    abilities = {}
  ) {
    if (
      typeof ABILITY_UTILS
        .createPlayerSkills ===
      'function'
    ) {
      const generated =
        ABILITY_UTILS
          .createPlayerSkills({
            role:
              normalizeRole(role),

            abilities
          });

      const shield =
        Array.isArray(
          generated
        )
          ? generated.find(
              (skillData) =>
                skillData?.id ===
                  'shield_charge' ||
                skillData?.common
            )
          : null;

      if (shield) {
        return clone(shield);
      }
    }

    return fallbackShieldCharge(
      role,
      abilities
    );
  }

  /* ============================================================
     8. 役職別標準特殊能力
  ============================================================ */

  function defaultPassive(
    role
  ) {
    const normalizedRole =
      normalizeRole(role);

    if (
      normalizedRole ===
      'ATK'
    ) {
      return {
        id:
          'cpu_default_atk_finisher',

        name:
          'ATKの決定力',

        description:
          'HP50％以下の敵へのダメージを4％上げる。',

        effects: [
          {
            code:
              'DAMAGE_MODIFIER',

            condition:
              'targetHpLte',

            threshold:
              0.50,

            rate:
              0.04
          }
        ]
      };
    }

    if (
      normalizedRole ===
      'SUP'
    ) {
      return {
        id:
          'cpu_default_sup_healing',

        name:
          'SUPの支援力',

        description:
          '自身が行う回復量を3ポイント上げる。',

        effects: [
          {
            code:
              'HEAL_RATE_POINTS',

            target:
              'allHeals',

            points:
              3
          }
        ]
      };
    }

    return {
      id:
        'cpu_default_igl_command',

      name:
        'IGLの指揮力',

      description:
        '味方全体のエイムとマインドを2ポイント上げる。',

      effects: [
        {
          code:
            'TEAM_STAT_BUFF',

          stats: {
            aim: 2,
            mind: 2
          }
        }
      ]
    };
  }

  /* ============================================================
     9. 選手スキル解決
  ============================================================ */

  function resolveDedicatedSkills(
    player,
    resolvedAbilities = {}
  ) {
    const defaults =
      getAbilityRoleSkills(
        player.role,
        resolvedAbilities
      )
        .slice(0, 2)
        .map(
          (
            skillData,
            index
          ) =>
            normalizeSkill(
              skillData,

              {
                playerId:
                  player.id,

                slot:
                  index + 1
              }
            )
        );

    let result =
      defaults;

    /*
     * skillsが指定されている場合は、
     * 指定済みの枠を優先する。
     *
     * 1つしか指定されていない場合、
     * 2枠目は役職標準を維持する。
     */
    if (
      Array.isArray(
        player.skills
      ) &&
      player.skills.length
    ) {
      result =
        [
          0,
          1
        ].map(
          (index) =>
            normalizeSkill(
              player.skills[index] ||
              defaults[index],

              {
                playerId:
                  player.id,

                slot:
                  index + 1
              }
            )
        );
    }

    /*
     * skillOverrides:
     *
     * {
     *   1: 独自スキル,
     *   2: 独自スキル
     * }
     *
     * または配列指定にも対応。
     */
    const overrides =
      player.skillOverrides ||
      {};

    [
      1,
      2
    ].forEach(
      (slot) => {
        const override =
          Array.isArray(
            overrides
          )
            ? overrides[
                slot - 1
              ]
            : (
                overrides[slot] ??
                overrides[
                  String(slot)
                ]
              );

        if (override) {
          result[
            slot - 1
          ] =
            normalizeSkill(
              override,

              {
                playerId:
                  player.id,

                slot
              }
            );
        }
      }
    );

    return result.map(
      (
        skillData,
        index
      ) => {
        const override =
          Array.isArray(
            overrides
          )
            ? overrides[index]
            : (
                overrides[
                  index + 1
                ] ||
                overrides[
                  String(
                    index + 1
                  )
                ]
              );

        const custom =
          Array.isArray(
            player.skills
          ) &&
          player.skills[index];

        return {
          ...skillData,

          slot:
            index + 1,

          source:
            custom
              ? 'custom'
              : override
                ? 'override'
                : 'roleDefault'
        };
      }
    );
  }

  function resolvePlayerSkills(
    player,
    options = {}
  ) {
    const includeCommon =
      options.includeCommon !==
      false;

    const condition =
      normalizeCondition(
        options.condition
      );

    const resolved =
      resolveStats(
        player.stats,
        condition
      );

    const dedicated =
      resolveDedicatedSkills(
        player,
        resolved.ordinals
      );

    if (!includeCommon) {
      return dedicated;
    }

    const shield =
      getShieldCharge(
        player.role,
        resolved.ordinals
      );

    shield.slot =
      3;

    shield.source =
      'common';

    return [
      ...dedicated,
      shield
    ];
  }

  function resolvePlayerPassives(
    player
  ) {
    if (
      Array.isArray(
        player.specialAbilities
      ) &&
      player
        .specialAbilities
        .length
    ) {
      return player
        .specialAbilities
        .map(
          (passiveData) =>
            normalizePassive(
              passiveData,

              {
                playerId:
                  player.id
              }
            )
        )
        .filter(Boolean);
    }

    if (
      player.passive
    ) {
      const passiveData =
        normalizePassive(
          player.passive,

          {
            playerId:
              player.id
          }
        );

      return passiveData
        ? [passiveData]
        : [];
    }

    return [
      clone(
        defaultPassive(
          player.role
        )
      )
    ];
  }

  /* ============================================================
     10. 武器
  ============================================================ */

  function normalizeWeapon(
    weapon,
    context = {}
  ) {
    const source =
      weapon &&
      typeof weapon ===
        'object'
        ? clone(weapon)
        : {
            type:
              text(weapon) ||
              'ハンドガン'
          };

    source.id =
      text(source.id) ||
      makeId(
        'cpu_weapon',

        (
          `${context.playerId || ''}:` +
          `${source.name || source.type || 'weapon'}`
        )
      );

    source.type =
      text(source.type) ||
      'ハンドガン';

    source.name =
      text(source.name) ||
      (
        `${context.playerName || 'CPU'}` +
        `専用${source.type}`
      );

    source.preferredRange =
      text(
        source.preferredRange ||
        context.preferredDistance
      ) ||
      'mid';

    source.magazine =
      Math.max(
        1,

        Math.floor(
          Number(
            source.magazine
          ) ||
          8
        )
      );

    return source;
  }

  /* ============================================================
     11. 画像パス
  ============================================================ */

  function defaultAssetPath(
    tier,
    teamNumber,
    slot
  ) {
    const folder =
      TIER_FOLDER[tier] ||
      'Local';

    const prefix =
      tier === 'local'
        ? 'L'
        : tier === 'national'
          ? 'N'
          : 'W';

    return (
      `${folder}/` +
      `${prefix}${teamNumber}${slot}.png`
    );
  }

  /* ============================================================
     12. 選手正規化
  ============================================================ */

  function normalizePlayer(
    rawPlayer,
    context
  ) {
    const role =
      normalizeRole(
        rawPlayer?.role
      );

    const slot =
      text(
        rawPlayer?.slot
      ).toUpperCase() ||
      ROLE_SLOT[role];

    const id =
      text(
        rawPlayer?.id
      ) ||
      (
        `${context.teamId}_` +
        `${role.toLowerCase()}`
      );

    const name =
      text(
        rawPlayer?.name
      ) ||
      (
        `${context.teamName} ` +
        `${role}`
      );

    const rank =
      rawPlayer?.rank ||
      {};

    const battleAI =
      rawPlayer?.battleAI ||
      {};

    return {
      ...clone(
        rawPlayer ||
        {}
      ),

      id,
      slot,
      role,
      name,

      image:
        text(
          rawPlayer?.image
        ) ||
        defaultAssetPath(
          context.tier,
          context.number,
          slot
        ),

      description:
        text(
          rawPlayer?.description
        ),

      rank: {
        normal:
          normalizeRankRange(
            rank.normal ||
            battleAI.normalRank ||
            'F1'
          ).text,

        hot:
          normalizeRankRange(
            rank.hot ||
            battleAI.hotRank ||
            rank.normal ||
            'F1'
          ).text,

        bad:
          normalizeRankRange(
            rank.bad ||
            battleAI.badRank ||
            rank.normal ||
            'F1'
          ).text
      },

      stats:
        normalizeStats(
          rawPlayer?.stats ||
          rawPlayer?.abilities
        ),

      weapon:
        normalizeWeapon(
          rawPlayer?.weapon,

          {
            playerId:
              id,

            playerName:
              name,

            preferredDistance:
              rawPlayer
                ?.preferredDistance
          }
        ),

      preferredDistance:
        text(
          rawPlayer
            ?.preferredDistance ||
          rawPlayer
            ?.weapon
            ?.preferredRange
        ) ||
        'mid',

      /*
       * 未指定なら空配列のまま保存。
       * 戦闘時に役職標準スキルが補われる。
       */
      skills:
        Array.isArray(
          rawPlayer?.skills
        )
          ? rawPlayer
              .skills
              .slice(0, 2)
              .map(
                (
                  skillData,
                  index
                ) =>
                  normalizeSkill(
                    skillData,

                    {
                      playerId:
                        id,

                      slot:
                        index + 1
                    }
                  )
              )
          : [],

      skillOverrides:
        clone(
          rawPlayer
            ?.skillOverrides ||
          {}
        ),

      passive:
        rawPlayer?.passive
          ? normalizePassive(
              rawPlayer.passive,

              {
                playerId:
                  id
              }
            )
          : null,

      specialAbilities:
        Array.isArray(
          rawPlayer
            ?.specialAbilities
        )
          ? rawPlayer
              .specialAbilities
              .map(
                (passiveData) =>
                  normalizePassive(
                    passiveData,

                    {
                      playerId:
                        id
                    }
                  )
              )
              .filter(Boolean)
          : [],

      battleAI: {
        ...clone(
          battleAI
        ),

        badRank:
          normalizeRankRange(
            battleAI.badRank ||
            rank.bad ||
            rank.normal ||
            'F1'
          ).text,

        normalRank:
          normalizeRankRange(
            battleAI.normalRank ||
            rank.normal ||
            'F1'
          ).text,

        hotRank:
          normalizeRankRange(
            battleAI.hotRank ||
            rank.hot ||
            rank.normal ||
            'F1'
          ).text,

        ultimateEnabled:
          false
      },

      card:
        clone(
          rawPlayer?.card ||
          {}
        ),

      tags:
        [
          ...new Set([
            ...(
              rawPlayer?.tags ||
              []
            ),

            context.tier,
            role
          ])
        ]
    };
  }

  /* ============================================================
     13. チーム正規化
  ============================================================ */

  function normalizeTeam(
    rawTeam,
    tier,
    index
  ) {
    const number =
      Math.max(
        1,

        Math.floor(
          Number(
            rawTeam?.number
          ) ||
          index + 1
        )
      );

    const prefix =
      tier === 'local'
        ? 'L'
        : tier === 'national'
          ? 'N'
          : 'W';

    const id =
      text(
        rawTeam?.id
      ) ||
      (
        `${tier}_` +
        String(number)
          .padStart(
            2,
            '0'
          )
      );

    const code =
      text(
        rawTeam?.code
      ).toUpperCase() ||
      `${prefix}${number}`;

    const name =
      text(
        rawTeam?.name
      ) ||
      (
        `${tier.toUpperCase()} ` +
        `TEAM ${number}`
      );

    const members =
      (
        rawTeam?.members ||
        rawTeam?.players ||
        []
      ).map(
        (player) =>
          normalizePlayer(
            player,

            {
              tier,
              number,
              teamId:
                id,
              teamName:
                name
            }
          )
      );

    return {
      ...clone(
        rawTeam ||
        {}
      ),

      id,
      code,
      tier,

      region:
        tier,

      number,
      name,

      logo:
        text(
          rawTeam?.logo
        ) ||
        defaultAssetPath(
          tier,
          number,
          'D'
        ),

      description:
        text(
          rawTeam?.description
        ),

      mandatory:
        Boolean(
          rawTeam?.mandatory
        ),

      entryRule:
        clone(
          rawTeam
            ?.entryRule ||
          null
        ),

      teamRank: {
        normal:
          normalizeRankRange(
            rawTeam
              ?.teamRank
              ?.normal ||
            rawTeam
              ?.rank
              ?.normal ||
            'F1'
          ).text,

        hot:
          normalizeRankRange(
            rawTeam
              ?.teamRank
              ?.hot ||
            rawTeam
              ?.rank
              ?.hot ||
            rawTeam
              ?.teamRank
              ?.normal ||
            'F1'
          ).text,

        bad:
          normalizeRankRange(
            rawTeam
              ?.teamRank
              ?.bad ||
            rawTeam
              ?.rank
              ?.bad ||
            rawTeam
              ?.teamRank
              ?.normal ||
            'F1'
          ).text
      },

      members,

      badge:
        clone(
          rawTeam?.badge ||
          rawTeam?.card ||
          {}
        ),

      tags:
        [
          ...new Set([
            ...(
              rawTeam?.tags ||
              []
            ),

            tier
          ])
        ]
    };
  }

  /* ============================================================
     14. 検証
  ============================================================ */

  function validateNormalizedTeams(
    tier,
    teams
  ) {
    const errors = [];

    const teamIds =
      new Set();

    const teamCodes =
      new Set();

    const playerIds =
      new Set();

    teams.forEach(
      (team) => {
        if (
          teamIds.has(
            team.id
          )
        ) {
          errors.push(
            `チームID重複: ${team.id}`
          );
        }

        if (
          teamCodes.has(
            team.code
          )
        ) {
          errors.push(
            `チームコード重複: ${team.code}`
          );
        }

        teamIds.add(
          team.id
        );

        teamCodes.add(
          team.code
        );

        if (
          team.members.length !==
          3
        ) {
          errors.push(
            `${team.name}の選手数が3人ではありません。`
          );
        }

        const roles =
          new Set(
            team.members.map(
              (member) =>
                member.role
            )
          );

        ROLES.forEach(
          (role) => {
            if (
              !roles.has(role)
            ) {
              errors.push(
                `${team.name}に${role}がいません。`
              );
            }
          }
        );

        team.members.forEach(
          (member) => {
            if (
              playerIds.has(
                member.id
              )
            ) {
              errors.push(
                `選手ID重複: ${member.id}`
              );
            }

            playerIds.add(
              member.id
            );

            STAT_KEYS.forEach(
              (statId) => {
                if (
                  !member
                    .stats[
                      statId
                    ]
                ) {
                  errors.push(
                    (
                      `${team.name}/` +
                      `${member.name}/` +
                      `${statId}がありません。`
                    )
                  );
                }
              }
            );

            if (
              member.skills.length >
              2
            ) {
              errors.push(
                (
                  `${team.name}/` +
                  `${member.name}` +
                  'の専用スキル指定が2つを超えています。'
                )
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

      counts: {
        tier,

        teams:
          teams.length,

        players:
          playerIds.size,

        customSkills:
          teams.reduce(
            (
              total,
              team
            ) =>
              total +
              team.members.reduce(
                (
                  memberTotal,
                  member
                ) =>
                  memberTotal +
                  member.skills.length,

                0
              ),

            0
          )
      }
    };
  }

  /* ============================================================
     15. インデックス
  ============================================================ */

  function rebuildIndexes() {
    [
      registry.teamById,
      registry.playerById,
      registry.teamByCode
    ].forEach(
      (index) => {
        Object.keys(index)
          .forEach(
            (key) =>
              delete index[key]
          );
      }
    );

    TIERS.forEach(
      (tier) => {
        registry
          .teams[tier]
          .forEach(
            (team) => {
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

              team.members.forEach(
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
      }
    );
  }

  /* ============================================================
     16. チーム登録
  ============================================================ */

  function registerTeams(
    tierValue,
    rawTeams,
    options = {}
  ) {
    const tier =
      normalizeTier(
        tierValue
      );

    if (
      !tier ||
      tier ===
        'championship'
    ) {
      throw new Error(
        `登録できないCPU区分です: ${tierValue}`
      );
    }

    if (
      !Array.isArray(
        rawTeams
      )
    ) {
      throw new TypeError(
        `${tier}チームデータは配列で指定してください。`
      );
    }

    /*
     * 先に全件を正規化・検証してから、
     * 既存登録を置き換える。
     *
     * 不正データで既存データが消えることを防ぐ。
     */
    const normalized =
      rawTeams.map(
        (
          team,
          index
        ) =>
          normalizeTeam(
            team,
            tier,
            index
          )
      );

    const validation =
      validateNormalizedTeams(
        tier,
        normalized
      );

    if (
      !validation.valid
    ) {
      throw new Error(
        validation
          .errors
          .join('\n')
      );
    }

    const nextTier =
      options.replaceTier ===
      false
        ? [
            ...registry
              .teams[tier],

            ...normalized
          ]
        : normalized;

    const combinedValidation =
      validateNormalizedTeams(
        tier,
        nextTier
      );

    if (
      !combinedValidation.valid
    ) {
      throw new Error(
        combinedValidation
          .errors
          .join('\n')
      );
    }

    const otherIds =
      new Set(
        TIERS
          .filter(
            (entry) =>
              entry !== tier
          )
          .flatMap(
            (entry) =>
              registry
                .teams[entry]
                .map(
                  (team) =>
                    team.id
                )
          )
      );

    const conflict =
      nextTier.find(
        (team) =>
          otherIds.has(
            team.id
          )
      );

    if (conflict) {
      throw new Error(
        (
          '他区分とチームIDが重複しています: ' +
          conflict.id
        )
      );
    }

    registry
      .teams[tier]
      .splice(
        0,
        registry
          .teams[tier]
          .length,

        ...nextTier
      );

    rebuildIndexes();

    const result = {
      tier,

      source:
        text(
          options.source
        ),

      replaced:
        options.replaceTier !==
        false,

      counts:
        combinedValidation
          .counts,

      registeredAt:
        new Date()
          .toISOString()
    };

    registry
      .registrations
      .push(result);

    return clone(result);
  }

  /* ============================================================
     17. 取得
  ============================================================ */

  function getTeams(
    tierValue
  ) {
    const tier =
      normalizeTier(
        tierValue
      );

    return (
      tier &&
      registry
        .teams[tier]
    )
      ? registry
          .teams[tier]
          .map(clone)
      : [];
  }

  function getAllTeams() {
    return TIERS
      .flatMap(
        (tier) =>
          registry
            .teams[tier]
      )
      .map(clone);
  }

  function getTeam(
    teamOrId
  ) {
    if (
      teamOrId &&
      typeof teamOrId ===
        'object'
    ) {
      const id =
        text(
          teamOrId.id
        );

      if (
        id &&
        registry
          .teamById[id]
      ) {
        return clone(
          registry
            .teamById[id]
        );
      }

      const code =
        text(
          teamOrId.code
        ).toUpperCase();

      if (
        code &&
        registry
          .teamByCode[code]
      ) {
        return clone(
          registry
            .teamByCode[code]
        );
      }

      return null;
    }

    const key =
      text(teamOrId);

    if (
      registry
        .teamById[key]
    ) {
      return clone(
        registry
          .teamById[key]
      );
    }

    const code =
      key.toUpperCase();

    return registry
      .teamByCode[code]
      ? clone(
          registry
            .teamByCode[code]
        )
      : null;
  }

  function getPlayer(
    playerOrId
  ) {
    if (
      playerOrId &&
      typeof playerOrId ===
        'object'
    ) {
      const id =
        text(
          playerOrId.id
        );

      return (
        id &&
        registry
          .playerById[id]
      )
        ? clone(
            registry
              .playerById[id]
          )
        : null;
    }

    const key =
      text(playerOrId);

    return registry
      .playerById[key]
      ? clone(
          registry
            .playerById[key]
        )
      : null;
  }

  function getAllPlayers() {
    return Object
      .values(
        registry
          .playerById
      )
      .map(clone);
  }

  function findTeams(
    query,
    tierValue = ''
  ) {
    const keyword =
      text(query)
        .toLowerCase();

    const source =
      tierValue
        ? getTeams(
            tierValue
          )
        : getAllTeams();

    if (!keyword) {
      return source;
    }

    return source.filter(
      (team) =>
        [
          team.id,
          team.code,
          team.name,
          team.description,

          ...team.members.map(
            (member) =>
              member.name
          )
        ].some(
          (value) =>
            text(value)
              .toLowerCase()
              .includes(
                keyword
              )
        )
    );
  }

  /* ============================================================
     18. 抽選
  ============================================================ */

  function shuffle(
    source,
    random = Math.random
  ) {
    const result =
      [...source];

    for (
      let index =
        result.length - 1;

      index > 0;

      index -= 1
    ) {
      const next =
        Math.floor(
          clamp(
            random(),
            0,
            0.999999999
          ) *
          (
            index + 1
          )
        );

      [
        result[index],
        result[next]
      ] = [
        result[next],
        result[index]
      ];
    }

    return result;
  }

  function isEntryEligible(
    team,
    context = {}
  ) {
    const rule =
      team.entryRule;

    if (!rule) {
      return true;
    }

    if (
      rule.type ===
      'fromYear'
    ) {
      return (
        Number(
          context.year ||
          1
        ) >=
        Number(
          rule.year ||
          1
        )
      );
    }

    if (
      rule.type ===
      'untilYear'
    ) {
      return (
        Number(
          context.year ||
          1
        ) <=
        Number(
          rule.year ||
          1
        )
      );
    }

    return true;
  }

  function selectTeams(
    tierValue,
    options = {}
  ) {
    const tier =
      normalizeTier(
        tierValue
      );

    const count =
      Math.max(
        0,

        Math.floor(
          Number(
            options.count
          ) ||
          0
        )
      );

    const excluded =
      new Set(
        options
          .excludeTeamIds ||
        []
      );

    const pool =
      registry
        .teams[tier]
        .filter(
          (team) =>
            !excluded.has(
              team.id
            )
        )
        .filter(
          (team) =>
            isEntryEligible(
              team,
              options
            )
        );

    const mandatory =
      pool.filter(
        (team) =>
          team.mandatory ||
          team.entryRule?.always
      );

    const mandatoryIds =
      new Set(
        mandatory.map(
          (team) =>
            team.id
        )
      );

    const randomPool =
      shuffle(
        pool.filter(
          (team) =>
            !mandatoryIds.has(
              team.id
            )
        ),

        options.random ||
        Math.random
      );

    const selected =
      [
        ...mandatory,
        ...randomPool
      ].slice(
        0,

        count ||
        pool.length
      );

    return selected.map(
      clone
    );
  }

  /* ============================================================
     19. 戦闘用データ
  ============================================================ */

  function resolvePlayerRank(
    player,
    condition = 'normal',
    random = Math.random
  ) {
    const state =
      normalizeCondition(
        condition
      );

    return pickRankFromRange(
      player.rank?.[state] ||
      player.rank?.normal ||
      'F1',

      random
    );
  }

  function toBattlePlayer(
    playerOrId,
    options = {}
  ) {
    const player =
      (
        playerOrId &&
        typeof playerOrId ===
          'object'
      )
        ? clone(
            playerOrId
          )
        : getPlayer(
            playerOrId
          );

    if (!player) {
      return null;
    }

    const condition =
      normalizeCondition(
        options.condition
      );

    const stats =
      resolveStats(
        player.stats,
        condition
      );

    const skills =
      resolvePlayerSkills(
        player,

        {
          condition,
          includeCommon:
            true
        }
      );

    const passives =
      resolvePlayerPassives(
        player
      );

    return {
      ...player,

      condition,

      currentRank:
        resolvePlayerRank(
          player,
          condition,

          options.random ||
          Math.random
        ),

      abilityLabels:
        stats.labels,

      abilities:
        stats.ordinals,

      skills,

      specialAbilities:
        passives,

      ultimate:
        null,

      ultimateEnabled:
        false
    };
  }

  function toBattleTeam(
    teamOrId,
    options = {}
  ) {
    const team =
      (
        teamOrId &&
        typeof teamOrId ===
          'object'
      )
        ? clone(
            teamOrId
          )
        : getTeam(
            teamOrId
          );

    if (!team) {
      return null;
    }

    const conditionByPlayerId =
      options
        .conditionByPlayerId ||
      {};

    const defaultCondition =
      options.condition ||
      'normal';

    return {
      ...team,

      members:
        team.members.map(
          (player) =>
            toBattlePlayer(
              player,

              {
                ...options,

                condition:
                  conditionByPlayerId[
                    player.id
                  ] ||
                  defaultCondition
              }
            )
        )
    };
  }

  /* ============================================================
     20. カード参照
  ============================================================ */

  function getPlayerCardSources(
    tierValue = ''
  ) {
    const players =
      tierValue
        ? getTeams(
            tierValue
          ).flatMap(
            (team) =>
              team.members.map(
                (player) => ({
                  team,
                  player
                })
              )
          )
        : getAllTeams()
            .flatMap(
              (team) =>
                team.members.map(
                  (player) => ({
                    team,
                    player
                  })
                )
            );

    return players.map(
      ({
        team,
        player
      }) => ({
        id:
          text(
            player
              .card
              ?.id
          ) ||
          `card_${player.id}`,

        sourceType:
          'cpuPlayer',

        sourceTier:
          team.tier,

        sourceTeamId:
          team.id,

        sourcePlayerId:
          player.id,

        teamName:
          team.name,

        role:
          player.role,

        name:
          player.name,

        image:
          player.image,

        rarity:
          text(
            player
              .card
              ?.rarity
          ),

        description:
          text(
            player
              .card
              ?.description ||
            player.description
          ),

        packId:
          text(
            player
              .card
              ?.packId
          ),

        ...clone(
          player.card ||
          {}
        )
      })
    );
  }

  function getBadgeSources(
    tierValue = ''
  ) {
    const teams =
      tierValue
        ? getTeams(
            tierValue
          )
        : getAllTeams();

    return teams.map(
      (team) => ({
        id:
          text(
            team
              .badge
              ?.id
          ) ||
          `badge_${team.id}`,

        sourceType:
          'cpuTeam',

        sourceTier:
          team.tier,

        sourceTeamId:
          team.id,

        name:
          text(
            team
              .badge
              ?.name
          ) ||
          `${team.name}バッジ`,

        image:
          team.logo,

        rarity:
          text(
            team
              .badge
              ?.rarity
          ),

        description:
          text(
            team
              .badge
              ?.description ||
            team.description
          ),

        packId:
          text(
            team
              .badge
              ?.packId
          ),

        ...clone(
          team.badge ||
          {}
        )
      })
    );
  }

  /* ============================================================
     21. 全体検証
  ============================================================ */

  function validate(
    tierValue = ''
  ) {
    const tiers =
      tierValue
        ? [
            normalizeTier(
              tierValue
            )
          ]
        : TIERS;

    const reports =
      tiers
        .filter(Boolean)
        .map(
          (tier) =>
            validateNormalizedTeams(
              tier,
              registry
                .teams[tier]
            )
        );

    return {
      valid:
        reports.every(
          (report) =>
            report.valid
        ),

      reports,

      counts: {
        teams:
          getAllTeams()
            .length,

        players:
          getAllPlayers()
            .length
      }
    };
  }

  /* ============================================================
     22. 地域ファイル用スキル作成ヘルパー
  ============================================================ */

  const skill =
    Object.freeze({
      buff(
        name,
        stats,
        ct = 6
      ) {
        return {
          name,

          type:
            'BUFF',

          target:
            '味方全体',

          ct,

          description:
            '味方全体の能力をアップする。',

          effect: {
            code:
              'team_stat_buff',

            baseStats:
              clone(stats)
          }
        };
      },

      ct(
        name,
        rate,
        cooldown = 7
      ) {
        return {
          name,

          type:
            'BUFF',

          target:
            '味方全体',

          ct:
            cooldown,

          description:
            '味方全体のCTを短縮する。',

          effect: {
            code:
              'team_ct_reduction',

            rate:
              Number(rate) ||
              0
          }
        };
      },

      damage(
        name,
        power,
        hit = 0.8,
        ct = 5.5
      ) {
        return {
          name,

          type:
            'DAMAGE',

          target:
            '敵単体',

          ct,

          hit:
            Number(hit) ||
            0.8,

          description:
            '敵単体へ攻撃する。',

          effect: {
            code:
              'single_damage',

            power:
              Number(power) ||
              1
          }
        };
      },

      multi(
        name,
        shots,
        power,
        hit = 0.72,
        ct = 6.5
      ) {
        const shotCount =
          Math.max(
            1,

            Math.floor(
              Number(shots) ||
              1
            )
          );

        return {
          name,

          type:
            'DAMAGE',

          target:
            '敵単体',

          ct,

          hit:
            Number(hit) ||
            0.72,

          description:
            `敵単体へ${shotCount}回連続攻撃する。`,

          effect: {
            code:
              'multi_damage',

            shots:
              shotCount,

            power:
              Number(power) ||
              1
          }
        };
      },

      heal(
        name,
        healRate,
        ct = 6
      ) {
        return {
          name,

          type:
            'HEAL',

          target:
            '味方全体',

          ct,

          description:
            '味方全体のHPを回復する。',

          effect: {
            code:
              'team_heal',

            healRate:
              Number(healRate) ||
              0
          }
        };
      },

      revive(
        name,
        reviveHpRate,
        ct = 9
      ) {
        return {
          name,

          type:
            'HEAL',

          target:
            'ダウン中の味方',

          ct,

          description:
            'ダウン中の味方を蘇生する。',

          condition:
            'ダウン中の味方がいる時に発動',

          effect: {
            code:
              'revive_all',

            reviveHpRate:
              Number(
                reviveHpRate
              ) ||
              0.20
          }
        };
      }
    });

  /* ============================================================
     23. 地域ファイル用特殊能力ヘルパー
  ============================================================ */

  const passive =
    Object.freeze({
      team(
        name,
        description,
        stats
      ) {
        return {
          name,
          description,

          effects: [
            {
              code:
                'TEAM_STAT_BUFF',

              stats:
                clone(stats)
            }
          ]
        };
      },

      finisher(
        name,
        description,
        rate = 0.04
      ) {
        return {
          name,
          description,

          effects: [
            {
              code:
                'DAMAGE_MODIFIER',

              condition:
                'targetHpLte',

              threshold:
                0.50,

              rate:
                Number(rate) ||
                0.04
            }
          ]
        };
      },

      healing(
        name,
        description,
        points = 3
      ) {
        return {
          name,
          description,

          effects: [
            {
              code:
                'HEAL_RATE_POINTS',

              target:
                'allHeals',

              points:
                Number(points) ||
                3
            }
          ]
        };
      }
    });

  /* ============================================================
     24. 公開データ
  ============================================================ */

  const CPU_DATA = {
    version:
      '2.0.0-role-default-skills',

    tiers:
      TIERS,

    roles:
      ROLES,

    statKeys:
      STAT_KEYS,

    rankOrder:
      RANK_ORDER,

    roleSlots:
      ROLE_SLOT,

    /*
     * 表示・確認用。
     * 実際の戦闘では各選手の能力を渡して再生成する。
     */
    defaultSkillsByRole:
      Object.fromEntries(
        ROLES.map(
          (role) => [
            role,

            getAbilityRoleSkills(
              role
            )
          ]
        )
      ),

    defaultPassivesByRole:
      Object.fromEntries(
        ROLES.map(
          (role) => [
            role,

            defaultPassive(
              role
            )
          ]
        )
      ),

    teams:
      registry.teams,

    teamById:
      registry.teamById,

    playerById:
      registry.playerById,

    expectedTeamCounts: {
      local: null,
      national: null,
      world: null
    },

    registrations:
      registry.registrations
  };

  /* ============================================================
     25. 公開API
  ============================================================ */

  const CPU_API = {
    clone,
    makeId,

    normalizeTier,
    normalizeRole,
    normalizeCondition,

    rankToOrdinal,
    ordinalToRank,
    normalizeRankRange,
    pickRankFromRange,

    normalizeStats,
    resolveStats,

    defaultAssetPath,

    getDefaultSkills:
      getAbilityRoleSkills,

    getDefaultPassive:
      (role) =>
        clone(
          defaultPassive(
            role
          )
        ),

    resolveDedicatedSkills,
    resolvePlayerSkills,
    resolvePlayerPassives,

    registerTeams,

    getTeams,
    getAllTeams,
    getTeam,
    getPlayer,
    getAllPlayers,
    findTeams,

    selectTeams,

    resolvePlayerRank,

    toBattlePlayer,
    toBattleTeam,

    getPlayerCardSources,
    getBadgeSources,

    validate,

    skill,
    passive
  };

  MOBBR.DATA.cpu =
    CPU_DATA;

  MOBBR.API.cpu =
    CPU_API;

  global.MOBBR_CPU_DATA =
    CPU_DATA;

  global.MOBBR_CPU_API =
    CPU_API;
})(
  typeof window !==
  'undefined'
    ? window
    : globalThis
);
