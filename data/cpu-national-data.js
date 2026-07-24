'use strict';

/**
 * MOB BR - cpu-national-data.js
 * National 40チーム・120選手の完全編集版。
 * 能力・武器・スキル・特殊能力を選手ごとの固定値で保持する。
 *
 * 読み込み順:
 * cpu-data.js → cpu-local-data.js → cpu-national-data.js
 *
 * 編集ポイント:
 * ・チーム調整: NATIONAL_TEAMS内のT(...)
 * ・選手調整: 各P(...)のランク、7能力、武器、スキル、特殊能力
 * ・カード設定: 各P(...)末尾のC()
 * ・バッジ設定: 各T(...)末尾のB()
 */
(function initializeNationalCpuData(global) {
  const MOBBR = global.MOBBR = global.MOBBR || {};
  const CPU = MOBBR.API?.cpu;

  if (!CPU) {
    throw new Error(
      'cpu-national-data.jsより先にcpu-data.jsを読み込んでください。'
    );
  }

  const STAT_KEYS = [
    'stamina',
    'mind',
    'physical',
    'aim',
    'agility',
    'technique',
    'support'
  ];

  const ROLE_SUFFIX = {
    IGL: 'B',
    ATK: 'A',
    SUP: 'C'
  };

  const WEAPON_RANGE = {
    'ショットガン': 'close',
    'ハンドガン': 'mid',
    'リボルバー': 'mid',
    'アサルトライフル': 'mid',
    'スナイパーライフル': 'far',
    'マシンガン': 'mid'
  };

  const NATIONAL_RULES = Object.freeze({
    registeredCpuTeams: 40,
    tournamentTeams: 40,
    localQualifierSlots: 10,
    nativeNationalSlots: 30,

    groups: [
      'A',
      'B',
      'C',
      'D'
    ],

    teamsPerGroup: 10,
    playerGroup: 'A',

    dedicatedSkillsPerPlayer: 2,
    commonSkillAddedByCpuData: 1,

    ultimateEnabled: false,
    weaponMagazine: 8
  });

  function hash(value) {
    let result = 2166136261;
    const source = String(value || '');

    for (
      let index = 0;
      index < source.length;
      index += 1
    ) {
      result ^= source.charCodeAt(index);
      result = Math.imul(
        result,
        16777619
      );
    }

    return result >>> 0;
  }

  const makeId = (
    prefix,
    value
  ) =>
    `${prefix}_${hash(value).toString(36)}`;

  function splitStat(value) {
    const [
      normal,
      hot = normal
    ] = String(
      value || 'F1/F1'
    ).split('/');

    return {
      normal,
      hot
    };
  }

  function makeStats(values) {
    return Object.fromEntries(
      STAT_KEYS.map(
        (key, index) => [
          key,
          splitStat(
            values[index]
          )
        ]
      )
    );
  }

  function C(
    rarity = '',
    description = '',
    packId = ''
  ) {
    return {
      rarity,
      description,
      packId
    };
  }

  function B(
    rarity = '',
    description = '',
    packId = 'nb'
  ) {
    return {
      rarity,
      description,
      packId
    };
  }

  function W(
    type,
    attack,
    accuracy,
    speed,
    performance
  ) {
    return {
      type,

      preferredRange:
        WEAPON_RANGE[type] ||
        'mid',

      magazine:
        NATIONAL_RULES
          .weaponMagazine,

      attack,
      accuracy,
      speed,

      performance: {
        close:
          performance[0],

        mid:
          performance[1],

        far:
          performance[2],

        rapid:
          performance[3],

        reload:
          performance[4]
      }
    };
  }

  function BUFF(
    name,
    stats,
    ct = 6
  ) {
    return {
      name,

      type:
        'teamStatBuff',

      target:
        'allyAll',

      ct,

      effects: [
        {
          code:
            'TEAM_STAT_BUFF',

          stats,

          durationSeconds:
            5
        }
      ]
    };
  }

  function CT(
    name,
    rate,
    ct = 7
  ) {
    return {
      name,

      type:
        'teamCtBoost',

      target:
        'allyAll',

      ct,

      effects: [
        {
          code:
            'CPU_TEAM_CT_REDUCTION',

          rate
        }
      ]
    };
  }

  function DMG(
    name,
    power,
    hit = 0.8,
    ct = 5.5
  ) {
    return {
      name,

      type:
        'singleDamage',

      target:
        'lowestHpEnemy',

      power,
      hit,
      ct,

      effects: [
        {
          code:
            'CPU_SINGLE_DAMAGE',

          power
        }
      ]
    };
  }

  function MULTI(
    name,
    shots,
    power,
    hit = 0.72,
    ct = 6.5
  ) {
    return {
      name,

      type:
        'multiSingleDamage',

      target:
        'randomEnemy',

      shots,
      power,
      hit,
      ct,

      effects: [
        {
          code:
            'CPU_MULTI_DAMAGE',

          shots,
          power
        }
      ]
    };
  }

  function HEAL(
    name,
    healRate,
    ct = 6
  ) {
    return {
      name,

      type:
        'teamHeal',

      target:
        'allyAll',

      healRate,
      ct,

      effects: [
        {
          code:
            'TEAM_HEAL_FORMULA',

          baseRate:
            healRate,

          maximumRate:
            healRate
        }
      ]
    };
  }

  function REVIVE(
    name,
    reviveHpRate,
    ct = 9
  ) {
    return {
      name,

      type:
        'reviveAll',

      target:
        'allyDown',

      ct,

      effects: [
        {
          code:
            'REVIVE_ALL',

          reviveHpRate
        }
      ]
    };
  }

  function SKILL(
    name,
    data
  ) {
    return {
      name,
      ...data
    };
  }

  function P_TEAM(
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

          stats
        }
      ]
    };
  }

  function P_FINISH(
    name,
    description,
    rate
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
            0.5,

          rate
        }
      ]
    };
  }

  function P_HEAL(
    name,
    description,
    points
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

          points
        }
      ]
    };
  }

  function PASSIVE(
    name,
    description,
    data
  ) {
    return {
      name,
      description,
      ...data
    };
  }

  function P(
    role,
    name,
    badRank,
    normalRank,
    hotRank,
    stats,
    weapon,
    skills,
    passive,
    card = C()
  ) {
    return {
      role,
      name,

      rank: {
        normal:
          normalRank,

        hot:
          hotRank
      },

      stats:
        makeStats(stats),

      weapon: {
        ...weapon,

        name:
          `${name}専用${weapon.type}`
      },

      skills:
        skills.map(
          (skill, index) => ({
            id:
              makeId(
                'national_skill',
                `${name}:${role}:${index}:${skill.name}`
              ),

            ...skill
          })
        ),

      specialAbilities: [
        {
          id:
            makeId(
              'national_passive',
              `${name}:${role}:${passive.name}`
            ),

          ...passive
        }
      ],

      battleAI: {
        badRank,
        normalRank,
        hotRank,

        ultimateEnabled:
          false
      },

      card,

      tags: [
        'National',
        role
      ]
    };
  }

  function T(
    number,
    name,
    description,
    teamNormal,
    teamHot,
    group,
    strengthClass,
    style,
    members,
    badge = B()
  ) {
    const teamId =
      `national_${String(number)
        .padStart(2, '0')}`;

    members.forEach(
      (member) => {
        member.id =
          `${teamId}_${member.role.toLowerCase()}`;

        member.image =
          `National/N${number}${ROLE_SUFFIX[member.role]}.png`;

        member.skills =
          member.skills.map(
            (skill, index) => ({
              ...skill,

              id:
                makeId(
                  'national_skill',
                  `${teamId}:${member.role}:${index}:${skill.name}`
                )
            })
          );

        member.specialAbilities =
          member.specialAbilities.map(
            (ability, index) => ({
              ...ability,

              id:
                makeId(
                  'national_passive',
                  `${teamId}:${member.role}:${index}:${ability.name}`
                )
            })
          );
      }
    );

    return {
      id:
        teamId,

      code:
        `N${number}`,

      number,
      name,

      logo:
        `National/N${number}D.png`,

      description,

      teamRank: {
        normal:
          teamNormal,

        hot:
          teamHot
      },

      members,

      strength: {
        class:
          strengthClass,

        style,

        groupSeed:
          group,

        nativeNationalTeam:
          true
      },

      card:
        badge,

      tags: [
        'National',
        `GROUP_${group}`,
        strengthClass,
        style
      ]
    };
  }

  /*
   * カード設定例:
   * C(
   *   'SSR',
   *   'ナショナル最強チームを率いるIGL。',
   *   'vol3'
   * )
   *
   * バッジ設定例:
   * B(
   *   'UR',
   *   'ジョーダンロケッツの企業バッジ。',
   *   'nb'
   * )
   */

  const NATIONAL_TEAMS = [
    T(
      1,
      'ジョーダンロケッツ',
      'ナショナル最強のチーム。世界大会で優勝を狙えるほどの実力を持つ。',
      'A8～S5',
      'S3～S9',
      'A',
      'legend',
      'balanced',
      [
        P(
          'IGL',
          'モブマックス',
          'A2～S1',
          'A9～S6',
          'S4～SS1',
          [
            'S2/S7',
            'S7/SS3',
            'S1/S6',
            'S2/S7',
            'S1/S6',
            'S5/SS1',
            'S5/SS1'
          ],
          W(
            'アサルトライフル',
            75,
            81,
            75,
            [
              'S1',
              'S6',
              'A9',
              'S2',
              'S2'
            ]
          ),
          [
            BUFF(
              'モブマックスコール',
              {
                aim: 5,
                mind: 4
              },
              6
            ),

            CT(
              'モブマックスタクティクス',
              0.155,
              7
            )
          ],
          P_TEAM(
            'モブマックスの指揮',
            '味方全体のバランス性能を上げる。',
            {
              aim: 4
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブトラックス',
          'A2～S1',
          'A9～S6',
          'S4～SS1',
          [
            'S3/S8',
            'S2/S7',
            'S5/SS1',
            'S7/SS3',
            'S4/S9',
            'S4/S9',
            'A8/S4'
          ],
          W(
            'アサルトライフル',
            83,
            75,
            75,
            [
              'S1',
              'S6',
              'A9',
              'S2',
              'S2'
            ]
          ),
          [
            DMG(
              'モブトラックスバースト',
              3.3,
              0.885,
              5.5
            ),

            MULTI(
              'モブトラックスラッシュ',
              3,
              1.05,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブトラックスの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.06
          ),
          C()
        ),

        P(
          'SUP',
          'モブスワイプ',
          'A1～A9',
          'A8～S5',
          'S3～S9',
          [
            'S3/S8',
            'S4/S9',
            'A8/S4',
            'A9/S5',
            'S3/S8',
            'S5/SS1',
            'S6/SS2'
          ],
          W(
            'ハンドガン',
            75,
            75,
            75,
            [
              'S1',
              'S6',
              'A9',
              'S2',
              'S5'
            ]
          ),
          [
            HEAL(
              'モブスワイプヒール',
              0.19,
              6
            ),

            CT(
              'モブスワイプリカバー',
              0.145,
              7
            )
          ],
          P_HEAL(
            'モブスワイプの支援',
            '自身が行う回復量を上げる。',
            5
          ),
          C()
        )
      ],
      B()
    ),

    T(
      2,
      'ブラックオーダーズ',
      '妨害と状況判断で戦闘を支配する。',
      'A2～S1',
      'A8～S7',
      'A',
      'elite',
      'control',
      [
        P(
          'IGL',
          'モブエンピン',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A6/S2',
            'S6/SS2',
            'A5/S1',
            'A9/S5',
            'A8/S4',
            'S4/S9',
            'S2/S7'
          ],
          W(
            'アサルトライフル',
            69,
            75,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            BUFF(
              'モブエンピンコール',
              {
                mind: 4,
                technique: 3
              },
              6
            ),

            CT(
              'モブエンピンタクティクス',
              0.14,
              7
            )
          ],
          P_TEAM(
            'モブエンピンの指揮',
            '味方全体のコントロール性能を上げる。',
            {
              mind: 3
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブミッドナイト',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A6/S2',
            'A8/S4',
            'S2/S7',
            'S3/S8',
            'A9/S5',
            'S4/S9',
            'A5/S1'
          ],
          W(
            'リボルバー',
            77,
            69,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            DMG(
              'モブミッドナイトバースト',
              3,
              0.86,
              5.5
            ),

            MULTI(
              'モブミッドナイトラッシュ',
              3,
              0.97,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブミッドナイトの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.052
          ),
          C()
        ),

        P(
          'SUP',
          'モブマウマウ',
          'B5～A5',
          'A2～S1',
          'A8～S7',
          [
            'A8/S4',
            'S4/S9',
            'A5/S1',
            'A6/S2',
            'A6/S2',
            'S4/S9',
            'S4/S9'
          ],
          W(
            'ハンドガン',
            69,
            69,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'S1'
            ]
          ),
          [
            HEAL(
              'モブマウマウヒール',
              0.172,
              6
            ),

            CT(
              'モブマウマウリカバー',
              0.13,
              7
            )
          ],
          P_HEAL(
            'モブマウマウの支援',
            '自身が行う回復量を上げる。',
            4
          ),
          C()
        )
      ],
      B()
    ),

    T(
      3,
      'ハイスピードヨーヨー',
      '高い機動力とCT回転で先手を取る。',
      'A2～S1',
      'A8～S7',
      'A',
      'elite',
      'speed',
      [
        P(
          'IGL',
          'モブファイン',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A6/S2',
            'S1/S6',
            'A6/S2',
            'A8/S4',
            'S1/S6',
            'S4/S9',
            'S1/S6'
          ],
          W(
            'ハンドガン',
            69,
            75,
            77,
            [
              'A6',
              'S2',
              'A5',
              'S2',
              'A7'
            ]
          ),
          [
            BUFF(
              'モブファインコール',
              {
                agility: 4,
                technique: 3
              },
              6
            ),

            CT(
              'モブファインタクティクス',
              0.14,
              7
            )
          ],
          P_TEAM(
            'モブファインの指揮',
            '味方全体のスピード性能を上げる。',
            {
              agility: 3
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブループ',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A7/S3',
            'A5/S1',
            'S1/S6',
            'S3/S8',
            'S5/SS1',
            'S1/S6',
            'A3/A8'
          ],
          W(
            'マシンガン',
            77,
            69,
            77,
            [
              'A6',
              'S2',
              'A5',
              'S2',
              'A7'
            ]
          ),
          [
            DMG(
              'モブループバースト',
              3,
              0.86,
              5.5
            ),

            MULTI(
              'モブループラッシュ',
              4,
              0.97,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブループの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.052
          ),
          C()
        ),

        P(
          'SUP',
          'モブロンス',
          'B5～A5',
          'A2～S1',
          'A8～S7',
          [
            'A6/S2',
            'A9/S5',
            'A4/A9',
            'A7/S3',
            'S2/S7',
            'S2/S7',
            'S2/S7'
          ],
          W(
            'ハンドガン',
            69,
            69,
            77,
            [
              'A6',
              'S2',
              'A5',
              'S2',
              'S1'
            ]
          ),
          [
            HEAL(
              'モブロンスヒール',
              0.172,
              6
            ),

            REVIVE(
              'モブロンスリスポーン',
              0.26,
              9
            )
          ],
          P_HEAL(
            'モブロンスの支援',
            '自身が行う回復量を上げる。',
            4
          ),
          C()
        )
      ],
      B()
    ),

    T(
      4,
      'パティシエグルーブ',
      '回復と味方強化を軸に安定して戦う。',
      'A2～S1',
      'A8～S7',
      'A',
      'elite',
      'support',
      [
        P(
          'IGL',
          'モブサラダ',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A6/S2',
            'S3/S8',
            'A5/S1',
            'A7/S3',
            'A7/S3',
            'S2/S7',
            'S5/SS1'
          ],
          W(
            'ハンドガン',
            69,
            75,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            BUFF(
              'モブサラダコール',
              {
                support: 4,
                mind: 3
              },
              6
            ),

            CT(
              'モブサラダタクティクス',
              0.14,
              7
            )
          ],
          P_TEAM(
            'モブサラダの指揮',
            '味方全体のサポート性能を上げる。',
            {
              support: 3
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブホイコー',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A7/S3',
            'A8/S4',
            'S2/S7',
            'S3/S8',
            'S1/S6',
            'S1/S6',
            'A7/S3'
          ],
          W(
            'アサルトライフル',
            77,
            69,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            DMG(
              'モブホイコーバースト',
              3,
              0.86,
              5.5
            ),

            MULTI(
              'モブホイコーラッシュ',
              3,
              0.97,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブホイコーの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.052
          ),
          C()
        ),

        P(
          'SUP',
          'モブスイッツ',
          'B5～A5',
          'A2～S1',
          'A8～S7',
          [
            'A9/S5',
            'S3/S8',
            'A2/A7',
            'A6/S2',
            'A8/S4',
            'S1/S6',
            'S6/SS2'
          ],
          W(
            'ハンドガン',
            69,
            69,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'S1'
            ]
          ),
          [
            HEAL(
              'モブスイッツヒール',
              0.172,
              6
            ),

            CT(
              'モブスイッツリカバー',
              0.13,
              7
            )
          ],
          P_HEAL(
            'モブスイッツの支援',
            '自身が行う回復量を上げる。',
            4
          ),
          C()
        )
      ],
      B()
    ),

    T(
      5,
      'ニンジャライト',
      '高い機動力とCT回転で先手を取る。',
      'A2～S1',
      'A8～S7',
      'A',
      'elite',
      'speed',
      [
        P(
          'IGL',
          'モブノミツ',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A6/S2',
            'S2/S7',
            'A6/S2',
            'A9/S5',
            'S2/S7',
            'S2/S7',
            'S1/S6'
          ],
          W(
            'ハンドガン',
            69,
            75,
            77,
            [
              'A6',
              'S2',
              'A5',
              'S2',
              'A7'
            ]
          ),
          [
            BUFF(
              'モブノミツコール',
              {
                agility: 4,
                technique: 3
              },
              6
            ),

            CT(
              'モブノミツタクティクス',
              0.14,
              7
            )
          ],
          P_TEAM(
            'モブノミツの指揮',
            '味方全体のスピード性能を上げる。',
            {
              agility: 3
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブクナイ',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A6/S2',
            'A6/S2',
            'S1/S6',
            'S2/S7',
            'S4/S9',
            'S3/S8',
            'A5/S1'
          ],
          W(
            'マシンガン',
            77,
            69,
            77,
            [
              'A6',
              'S2',
              'A5',
              'S2',
              'A7'
            ]
          ),
          [
            DMG(
              'モブクナイバースト',
              3,
              0.86,
              5.5
            ),

            MULTI(
              'モブクナイラッシュ',
              4,
              0.97,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブクナイの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.052
          ),
          C()
        ),

        P(
          'SUP',
          'モブノイチ',
          'B5～A5',
          'A2～S1',
          'A8～S7',
          [
            'A7/S3',
            'S1/S6',
            'A4/A9',
            'A7/S3',
            'S1/S6',
            'S1/S6',
            'S2/S7'
          ],
          W(
            'ハンドガン',
            69,
            69,
            77,
            [
              'A6',
              'S2',
              'A5',
              'S2',
              'S1'
            ]
          ),
          [
            HEAL(
              'モブノイチヒール',
              0.172,
              6
            ),

            REVIVE(
              'モブノイチリスポーン',
              0.26,
              9
            )
          ],
          P_HEAL(
            'モブノイチの支援',
            '自身が行う回復量を上げる。',
            4
          ),
          C()
        )
      ],
      B()
    ),

    T(
      6,
      'ボムボムブラザーズ',
      '高火力スキルで短時間に決着を狙う。',
      'A2～S1',
      'A8～S7',
      'A',
      'elite',
      'burst',
      [
        P(
          'IGL',
          'モブボンバー',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A7/S3',
            'S1/S6',
            'A9/S5',
            'S1/S6',
            'A9/S5',
            'S1/S6',
            'A8/S4'
          ],
          W(
            'アサルトライフル',
            69,
            75,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            BUFF(
              'モブボンバーコール',
              {
                physical: 4,
                aim: 3
              },
              6
            ),

            CT(
              'モブボンバータクティクス',
              0.14,
              7
            )
          ],
          P_TEAM(
            'モブボンバーの指揮',
            '味方全体のバースト性能を上げる。',
            {
              physical: 3
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブスローボム',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A8/S4',
            'A5/S1',
            'S5/SS1',
            'S3/S8',
            'A9/S5',
            'S1/S6',
            'A4/A9'
          ],
          W(
            'ショットガン',
            77,
            69,
            69,
            [
              'S2',
              'A7',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            DMG(
              'モブスローボムバースト',
              3,
              0.86,
              5.5
            ),

            MULTI(
              'モブスローボムラッシュ',
              3,
              0.97,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブスローボムの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.052
          ),
          C()
        ),

        P(
          'SUP',
          'モブボマー',
          'B5～A5',
          'A2～S1',
          'A8～S7',
          [
            'A9/S5',
            'S1/S6',
            'A9/S5',
            'A7/S3',
            'A7/S3',
            'A9/S5',
            'S3/S8'
          ],
          W(
            'ハンドガン',
            69,
            69,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'S1'
            ]
          ),
          [
            HEAL(
              'モブボマーヒール',
              0.172,
              6
            ),

            CT(
              'モブボマーリカバー',
              0.13,
              7
            )
          ],
          P_HEAL(
            'モブボマーの支援',
            '自身が行う回復量を上げる。',
            4
          ),
          C()
        )
      ],
      B()
    ),

    T(
      7,
      'キンミライセカイ',
      '高い技術と特殊効果で相手を崩す。',
      'A2～S1',
      'A8～S7',
      'A',
      'elite',
      'technical',
      [
        P(
          'IGL',
          'モブサーティーン',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A6/S2',
            'S5/SS1',
            'A6/S2',
            'A8/S4',
            'A8/S4',
            'S4/S9',
            'A8/S4'
          ],
          W(
            'アサルトライフル',
            69,
            75,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            BUFF(
              'モブサーティーンコール',
              {
                technique: 4,
                mind: 3
              },
              6
            ),

            CT(
              'モブサーティーンタクティクス',
              0.14,
              7
            )
          ],
          P_TEAM(
            'モブサーティーンの指揮',
            '味方全体のテクニカル性能を上げる。',
            {
              technique: 3
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブアキンボ',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A8/S4',
            'A9/S5',
            'S2/S7',
            'S2/S7',
            'S1/S6',
            'S4/S9',
            'A4/A9'
          ],
          W(
            'リボルバー',
            77,
            69,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            DMG(
              'モブアキンボバースト',
              3,
              0.86,
              5.5
            ),

            MULTI(
              'モブアキンボラッシュ',
              3,
              0.97,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブアキンボの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.052
          ),
          C()
        ),

        P(
          'SUP',
          'モブゴウ',
          'B5～A5',
          'A2～S1',
          'A8～S7',
          [
            'A9/S5',
            'S4/S9',
            'A5/S1',
            'A8/S4',
            'A6/S2',
            'S3/S8',
            'S4/S9'
          ],
          W(
            'ハンドガン',
            69,
            69,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'S1'
            ]
          ),
          [
            HEAL(
              'モブゴウヒール',
              0.172,
              6
            ),

            CT(
              'モブゴウリカバー',
              0.13,
              7
            )
          ],
          P_HEAL(
            'モブゴウの支援',
            '自身が行う回復量を上げる。',
            4
          ),
          C()
        )
      ],
      B()
    ),

    T(
      8,
      'ナショナルトレーニングファイヤーズ',
      '近・中距離から一気に攻める。',
      'A2～S1',
      'A8～S7',
      'A',
      'elite',
      'assault',
      [
        P(
          'IGL',
          'モブアッチー',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A6/S2',
            'S2/S7',
            'A8/S4',
            'S2/S7',
            'A9/S5',
            'A9/S5',
            'A9/S5'
          ],
          W(
            'アサルトライフル',
            69,
            75,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            BUFF(
              'モブアッチーコール',
              {
                physical: 4,
                aim: 3
              },
              6
            ),

            CT(
              'モブアッチータクティクス',
              0.14,
              7
            )
          ],
          P_TEAM(
            'モブアッチーの指揮',
            '味方全体のアサルト性能を上げる。',
            {
              physical: 3
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブネップウ',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A7/S3',
            'A7/S3',
            'S5/SS1',
            'S3/S8',
            'S1/S6',
            'A8/S4',
            'A4/A9'
          ],
          W(
            'ショットガン',
            77,
            69,
            69,
            [
              'S2',
              'A7',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            DMG(
              'モブネップウバースト',
              3,
              0.86,
              5.5
            ),

            MULTI(
              'モブネップウラッシュ',
              3,
              0.97,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブネップウの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.052
          ),
          C()
        ),

        P(
          'SUP',
          'モブアツ',
          'B5～A5',
          'A2～S1',
          'A8～S7',
          [
            'A9/S5',
            'S1/S6',
            'A6/S2',
            'A9/S5',
            'A8/S4',
            'A8/S4',
            'S3/S8'
          ],
          W(
            'ハンドガン',
            69,
            69,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'S1'
            ]
          ),
          [
            HEAL(
              'モブアツヒール',
              0.172,
              6
            ),

            CT(
              'モブアツリカバー',
              0.13,
              7
            )
          ],
          P_HEAL(
            'モブアツの支援',
            '自身が行う回復量を上げる。',
            4
          ),
          C()
        )
      ],
      B()
    ),

    T(
      9,
      'ナショナルトレーニングブリザード',
      '妨害と状況判断で戦闘を支配する。',
      'A2～S1',
      'A8～S7',
      'A',
      'elite',
      'control',
      [
        P(
          'IGL',
          'モブサッミー',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A7/S3',
            'S5/SS1',
            'A6/S2',
            'A8/S4',
            'A8/S4',
            'S5/SS1',
            'S2/S7'
          ],
          W(
            'アサルトライフル',
            69,
            75,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            BUFF(
              'モブサッミーコール',
              {
                mind: 4,
                technique: 3
              },
              6
            ),

            CT(
              'モブサッミータクティクス',
              0.14,
              7
            )
          ],
          P_TEAM(
            'モブサッミーの指揮',
            '味方全体のコントロール性能を上げる。',
            {
              mind: 3
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブレイフウ',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A8/S4',
            'S1/S6',
            'S2/S7',
            'S1/S6',
            'A9/S5',
            'S3/S8',
            'A4/A9'
          ],
          W(
            'リボルバー',
            77,
            69,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            DMG(
              'モブレイフウバースト',
              3,
              0.86,
              5.5
            ),

            MULTI(
              'モブレイフウラッシュ',
              3,
              0.97,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブレイフウの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.052
          ),
          C()
        ),

        P(
          'SUP',
          'モブヒエ',
          'B5～A5',
          'A2～S1',
          'A8～S7',
          [
            'A8/S4',
            'S5/SS1',
            'A4/A9',
            'A7/S3',
            'A7/S3',
            'S2/S7',
            'S4/S9'
          ],
          W(
            'ハンドガン',
            69,
            69,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'S1'
            ]
          ),
          [
            HEAL(
              'モブヒエヒール',
              0.172,
              6
            ),

            REVIVE(
              'モブヒエリスポーン',
              0.26,
              9
            )
          ],
          P_HEAL(
            'モブヒエの支援',
            '自身が行う回復量を上げる。',
            4
          ),
          C()
        )
      ],
      B()
    ),

    T(
      10,
      'トマトケチャップテイルズ',
      '攻守と連携のバランスに優れる。',
      'A2～S1',
      'A8～S7',
      'A',
      'elite',
      'balanced',
      [
        P(
          'IGL',
          'モブトマティー',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A8/S4',
            'S3/S8',
            'A5/S1',
            'A8/S4',
            'A7/S3',
            'S2/S7',
            'A9/S5'
          ],
          W(
            'アサルトライフル',
            69,
            75,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            BUFF(
              'モブトマティーコール',
              {
                aim: 4,
                mind: 3
              },
              6
            ),

            CT(
              'モブトマティータクティクス',
              0.14,
              7
            )
          ],
          P_TEAM(
            'モブトマティーの指揮',
            '味方全体のバランス性能を上げる。',
            {
              aim: 3
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブオムレツ',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A6/S2',
            'A6/S2',
            'S3/S8',
            'S2/S7',
            'S1/S6',
            'A9/S5',
            'A3/A8'
          ],
          W(
            'アサルトライフル',
            77,
            69,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            DMG(
              'モブオムレツバースト',
              3,
              0.86,
              5.5
            ),

            MULTI(
              'モブオムレツラッシュ',
              3,
              0.97,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブオムレツの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.052
          ),
          C()
        ),

        P(
          'SUP',
          'モブトマジュー',
          'B5～A5',
          'A2～S1',
          'A8～S7',
          [
            'A7/S3',
            'S2/S7',
            'A5/S1',
            'A7/S3',
            'A8/S4',
            'A8/S4',
            'S2/S7'
          ],
          W(
            'ハンドガン',
            69,
            69,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'S1'
            ]
          ),
          [
            HEAL(
              'モブトマジューヒール',
              0.172,
              6
            ),

            CT(
              'モブトマジューリカバー',
              0.13,
              7
            )
          ],
          P_HEAL(
            'モブトマジューの支援',
            '自身が行う回復量を上げる。',
            4
          ),
          C()
        )
      ],
      B()
    ),

    T(
      11,
      'ホワイトピンク',
      '回復と味方強化を軸に安定して戦う。',
      'A2～S1',
      'A8～S7',
      'B',
      'elite',
      'support',
      [
        P(
          'IGL',
          'モブアルバ',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A7/S3',
            'S5/SS1',
            'A5/S1',
            'A9/S5',
            'A7/S3',
            'S1/S6',
            'S3/S8'
          ],
          W(
            'ハンドガン',
            69,
            75,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            BUFF(
              'モブアルバコール',
              {
                support: 4,
                mind: 3
              },
              6
            ),

            CT(
              'モブアルバタクティクス',
              0.14,
              7
            )
          ],
          P_TEAM(
            'モブアルバの指揮',
            '味方全体のサポート性能を上げる。',
            {
              support: 3
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブロゼッタ',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A7/S3',
            'A7/S3',
            'S2/S7',
            'S2/S7',
            'A8/S4',
            'A9/S5',
            'A9/S5'
          ],
          W(
            'アサルトライフル',
            77,
            69,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'A7'
            ]
          ),
          [
            DMG(
              'モブロゼッタバースト',
              3,
              0.86,
              5.5
            ),

            MULTI(
              'モブロゼッタラッシュ',
              3,
              0.97,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブロゼッタの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.052
          ),
          C()
        ),

        P(
          'SUP',
          'モブパール',
          'B5～A5',
          'A2～S1',
          'A8～S7',
          [
            'A9/S5',
            'S3/S8',
            'A3/A8',
            'A5/S1',
            'A6/S2',
            'S2/S7',
            'S7/SS3'
          ],
          W(
            'ハンドガン',
            69,
            69,
            69,
            [
              'A6',
              'S2',
              'A5',
              'A7',
              'S1'
            ]
          ),
          [
            HEAL(
              'モブパールヒール',
              0.172,
              6
            ),

            REVIVE(
              'モブパールリスポーン',
              0.26,
              9
            )
          ],
          P_HEAL(
            'モブパールの支援',
            '自身が行う回復量を上げる。',
            4
          ),
          C()
        )
      ],
      B()
    ),

    T(
      12,
      'パルクールクルー',
      '高い機動力とCT回転で先手を取る。',
      'A2～S1',
      'A8～S7',
      'B',
      'elite',
      'speed',
      [
        P(
          'IGL',
          'モブヴォルト',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A7/S3',
            'S2/S7',
            'A5/S1',
            'A8/S4',
            'S3/S8',
            'S2/S7',
            'A9/S5'
          ],
          W(
            'ハンドガン',
            69,
            75,
            77,
            [
              'A6',
              'S2',
              'A5',
              'S2',
              'A7'
            ]
          ),
          [
            BUFF(
              'モブヴォルトコール',
              {
                agility: 4,
                technique: 3
              },
              6
            ),

            CT(
              'モブヴォルトタクティクス',
              0.14,
              7
            )
          ],
          P_TEAM(
            'モブヴォルトの指揮',
            '味方全体のスピード性能を上げる。',
            {
              agility: 3
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブランダー',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A7/S3',
            'A7/S3',
            'S1/S6',
            'S3/S8',
            'S4/S9',
            'S1/S6',
            'A5/S1'
          ],
          W(
            'マシンガン',
            77,
            69,
            77,
            [
              'A6',
              'S2',
              'A5',
              'S2',
              'A7'
            ]
          ),
          [
            DMG(
              'モブランダーバースト',
              3,
              0.86,
              5.5
            ),

            MULTI(
              'モブランダーラッシュ',
              4,
              0.97,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブランダーの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.052
          ),
          C()
        ),

        P(
          'SUP',
          'モブフリーラン',
          'B5～A5',
          'A2～S1',
          'A8～S7',
          [
            'A8/S4',
            'A9/S5',
            'A3/A8',
            'A5/S1',
            'S1/S6',
            'S2/S7',
            'S3/S8'
          ],
          W(
            'ハンドガン',
            69,
            69,
            77,
            [
              'A6',
              'S2',
              'A5',
              'S2',
              'S1'
            ]
          ),
          [
            HEAL(
              'モブフリーランヒール',
              0.172,
              6
            ),

            CT(
              'モブフリーランリカバー',
              0.13,
              7
            )
          ],
          P_HEAL(
            'モブフリーランの支援',
            '自身が行う回復量を上げる。',
            4
          ),
          C()
        )
      ],
      B()
    ),

    T(
      13,
      'スピーディートライアングル',
      '高い機動力とCT回転で先手を取る。',
      'A2～S1',
      'A8～S7',
      'B',
      'elite',
      'speed',
      [
        P(
          'IGL',
          'モブデルタ',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A5/S1',
            'S1/S6',
            'A4/A9',
            'A7/S3',
            'S2/S7',
            'S3/S8',
            'A8/S4'
          ],
          W(
            'ハンドガン',
            69,
            75,
            77,
            [
              'A6',
              'S2',
              'A5',
              'S2',
              'A7'
            ]
          ),
          [
            BUFF(
              'モブデルタコール',
              {
                agility: 4,
                technique: 3
              },
              6
            ),

            CT(
              'モブデルタタクティクス',
              0.14,
              7
            )
          ],
          P_TEAM(
            'モブデルタの指揮',
            '味方全体のスピード性能を上げる。',
            {
              agility: 3
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブベクトル',
          'B6～A6',
          'A3～S2',
          'A9～S8',
          [
            'A6/S2',
            'A7/S3',
            'S2/S7',
            'S1/S6',
            'S4/S9',
            'S1/S6',
            'A4/A9'
          ],
          W(
            'マシンガン',
            77,
            69,
            77,
            [
              'A6',
              'S2',
              'A5',
              'S2',
              'A7'
            ]
          ),
          [
            DMG(
              'モブベクトルバースト',
              3,
              0.86,
              5.5
            ),

            MULTI(
              'モブベクトルラッシュ',
              4,
              0.97,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブベクトルの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.052
          ),
          C()
        ),

        P(
          'SUP',
          'モブトライ',
          'B5～A5',
          'A2～S1',
          'A8～S7',
          [
            'A7/S3',
            'S1/S6',
            'A4/A9',
            'A6/S2',
            'S1/S6',
            'S2/S7',
            'S4/S9'
          ],
          W(
            'ハンドガン',
            69,
            69,
            77,
            [
              'A6',
              'S2',
              'A5',
              'S2',
              'S1'
            ]
          ),
          [
            HEAL(
              'モブトライヒール',
              0.172,
              6
            ),

            CT(
              'モブトライリカバー',
              0.13,
              7
            )
          ],
          P_HEAL(
            'モブトライの支援',
            '自身が行う回復量を上げる。',
            4
          ),
          C()
        )
      ],
      B()
    ),

    T(
      14,
      'セカイノイルカエル',
      '攻守と連携のバランスに優れる。',
      'B6～A7',
      'A3～S2',
      'B',
      'high',
      'balanced',
      [
        P(
          'IGL',
          'モブイルカエル',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A3/A9',
            'A5/S2',
            'B8/A5',
            'A3/A9',
            'A3/A9',
            'A6/S3',
            'A3/A9'
          ],
          W(
            'アサルトライフル',
            63,
            69,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            BUFF(
              'モブイルカエルコール',
              {
                aim: 3,
                mind: 2
              },
              6
            ),

            CT(
              'モブイルカエルタクティクス',
              0.125,
              7
            )
          ],
          P_TEAM(
            'モブイルカエルの指揮',
            '味方全体のバランス性能を上げる。',
            {
              aim: 2
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブレッドイル',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A2/A8',
            'B9/A6',
            'A5/S2',
            'A6/S3',
            'A4/S1',
            'A5/S2',
            'B8/A5'
          ],
          W(
            'アサルトライフル',
            71,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            DMG(
              'モブレッドイルバースト',
              2.7,
              0.835,
              5.5
            ),

            MULTI(
              'モブレッドイルラッシュ',
              3,
              0.89,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブレッドイルの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.044
          ),
          C()
        ),

        P(
          'SUP',
          'モブグリゲコ',
          'C9～B9',
          'B6～A7',
          'A3～S2',
          [
            'A4/S1',
            'A4/S1',
            'B8/A5',
            'B9/A6',
            'A3/A9',
            'A3/A9',
            'A7/S4'
          ],
          W(
            'ハンドガン',
            63,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A5'
            ]
          ),
          [
            HEAL(
              'モブグリゲコヒール',
              0.154,
              6
            ),

            REVIVE(
              'モブグリゲコリスポーン',
              0.24,
              9
            )
          ],
          P_HEAL(
            'モブグリゲコの支援',
            '自身が行う回復量を上げる。',
            3
          ),
          C()
        )
      ],
      B()
    ),

    T(
      15,
      'ネオンストリートクラブ',
      '高い技術と特殊効果で相手を崩す。',
      'B6～A7',
      'A3～S2',
      'B',
      'high',
      'technical',
      [
        P(
          'IGL',
          'モブゴールド',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A2/A8',
            'A9/S6',
            'B9/A6',
            'A3/A9',
            'A1/A7',
            'A8/S5',
            'A3/A9'
          ],
          W(
            'アサルトライフル',
            63,
            69,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            BUFF(
              'モブゴールドコール',
              {
                technique: 3,
                mind: 2
              },
              6
            ),

            CT(
              'モブゴールドタクティクス',
              0.125,
              7
            )
          ],
          P_TEAM(
            'モブゴールドの指揮',
            '味方全体のテクニカル性能を上げる。',
            {
              technique: 2
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブネオン',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A3/A9',
            'A3/A9',
            'A7/S4',
            'A8/S5',
            'A5/S2',
            'A7/S4',
            'B7/A4'
          ],
          W(
            'リボルバー',
            71,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            DMG(
              'モブネオンバースト',
              2.7,
              0.835,
              5.5
            ),

            MULTI(
              'モブネオンラッシュ',
              3,
              0.89,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブネオンの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.044
          ),
          C()
        ),

        P(
          'SUP',
          'モブシルバー',
          'C9～B9',
          'B6～A7',
          'A3～S2',
          [
            'A3/A9',
            'A8/S5',
            'B8/A5',
            'A1/A7',
            'A1/A7',
            'A7/S4',
            'A7/S4'
          ],
          W(
            'ハンドガン',
            63,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A5'
            ]
          ),
          [
            HEAL(
              'モブシルバーヒール',
              0.154,
              6
            ),

            CT(
              'モブシルバーリカバー',
              0.115,
              7
            )
          ],
          P_HEAL(
            'モブシルバーの支援',
            '自身が行う回復量を上げる。',
            3
          ),
          C()
        )
      ],
      B()
    ),

    T(
      16,
      'ヨルノサクセンカイギ',
      '妨害と状況判断で戦闘を支配する。',
      'B6～A7',
      'A3～S2',
      'B',
      'high',
      'control',
      [
        P(
          'IGL',
          'モブナイト',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A1/A7',
            'A9/S6',
            'A1/A7',
            'A4/S1',
            'A2/A8',
            'A8/S5',
            'A4/S1'
          ],
          W(
            'アサルトライフル',
            63,
            69,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            BUFF(
              'モブナイトコール',
              {
                mind: 3,
                technique: 2
              },
              6
            ),

            CT(
              'モブナイトタクティクス',
              0.125,
              7
            )
          ],
          P_TEAM(
            'モブナイトの指揮',
            '味方全体のコントロール性能を上げる。',
            {
              mind: 2
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブシャドウ',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A2/A8',
            'A3/A9',
            'A5/S2',
            'A6/S3',
            'A3/A9',
            'A6/S3',
            'A1/A7'
          ],
          W(
            'リボルバー',
            71,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            DMG(
              'モブシャドウバースト',
              2.7,
              0.835,
              5.5
            ),

            MULTI(
              'モブシャドウラッシュ',
              3,
              0.89,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブシャドウの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.044
          ),
          C()
        ),

        P(
          'SUP',
          'モブシーク',
          'C9～B9',
          'B6～A7',
          'A3～S2',
          [
            'A3/A9',
            'A7/S4',
            'B9/A6',
            'A2/A8',
            'A3/A9',
            'A7/S4',
            'A9/S6'
          ],
          W(
            'ハンドガン',
            63,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A5'
            ]
          ),
          [
            HEAL(
              'モブシークヒール',
              0.154,
              6
            ),

            REVIVE(
              'モブシークリスポーン',
              0.24,
              9
            )
          ],
          P_HEAL(
            'モブシークの支援',
            '自身が行う回復量を上げる。',
            3
          ),
          C()
        )
      ],
      B()
    ),

    T(
      17,
      'イロノハジマリ',
      '高い技術と特殊効果で相手を崩す。',
      'B6～A7',
      'A3～S2',
      'B',
      'high',
      'technical',
      [
        P(
          'IGL',
          'モブオリジン',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A3/A9',
            'A8/S5',
            'B8/A5',
            'A5/S2',
            'A1/A7',
            'A9/S6',
            'A3/A9'
          ],
          W(
            'アサルトライフル',
            63,
            69,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            BUFF(
              'モブオリジンコール',
              {
                technique: 3,
                mind: 2
              },
              6
            ),

            CT(
              'モブオリジンタクティクス',
              0.125,
              7
            )
          ],
          P_TEAM(
            'モブオリジンの指揮',
            '味方全体のテクニカル性能を上げる。',
            {
              technique: 2
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブクロマ',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A2/A8',
            'A3/A9',
            'A5/S2',
            'A6/S3',
            'A5/S2',
            'A8/S5',
            'B7/A4'
          ],
          W(
            'リボルバー',
            71,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            DMG(
              'モブクロマバースト',
              2.7,
              0.835,
              5.5
            ),

            MULTI(
              'モブクロマラッシュ',
              3,
              0.89,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブクロマの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.044
          ),
          C()
        ),

        P(
          'SUP',
          'モブルーツ',
          'C9～B9',
          'B6～A7',
          'A3～S2',
          [
            'A4/S1',
            'A7/S4',
            'B7/A4',
            'A2/A8',
            'A3/A9',
            'A8/S5',
            'A7/S4'
          ],
          W(
            'ハンドガン',
            63,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A5'
            ]
          ),
          [
            HEAL(
              'モブルーツヒール',
              0.154,
              6
            ),

            CT(
              'モブルーツリカバー',
              0.115,
              7
            )
          ],
          P_HEAL(
            'モブルーツの支援',
            '自身が行う回復量を上げる。',
            3
          ),
          C()
        )
      ],
      B()
    ),

    T(
      18,
      'ヨロイルカエル',
      '高い耐久力と防護能力で長期戦を制する。',
      'B6～A7',
      'A3～S2',
      'B',
      'high',
      'guard',
      [
        P(
          'IGL',
          'モブアーマ',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A6/S3',
            'A7/S4',
            'A2/A8',
            'A4/S1',
            'A1/A7',
            'A5/S2',
            'A6/S3'
          ],
          W(
            'ショットガン',
            63,
            69,
            63,
            [
              'A6',
              'A2',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            BUFF(
              'モブアーマコール',
              {
                stamina: 3,
                physical: 2
              },
              6
            ),

            CT(
              'モブアーマタクティクス',
              0.125,
              7
            )
          ],
          P_TEAM(
            'モブアーマの指揮',
            '味方全体のガード性能を上げる。',
            {
              stamina: 2
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブシールド',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A6/S3',
            'A1/A7',
            'S1/S7',
            'A5/S2',
            'A3/A9',
            'A5/S2',
            'B8/A5'
          ],
          W(
            'ショットガン',
            71,
            63,
            63,
            [
              'A6',
              'A2',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            DMG(
              'モブシールドバースト',
              2.7,
              0.835,
              5.5
            ),

            MULTI(
              'モブシールドラッシュ',
              3,
              0.89,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブシールドの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.044
          ),
          C()
        ),

        P(
          'SUP',
          'モブガード',
          'C9～B9',
          'B6～A7',
          'A3～S2',
          [
            'A7/S4',
            'A5/S2',
            'A1/A7',
            'B9/A6',
            'B8/A5',
            'A3/A9',
            'A7/S4'
          ],
          W(
            'ハンドガン',
            63,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A5'
            ]
          ),
          [
            HEAL(
              'モブガードヒール',
              0.154,
              6
            ),

            CT(
              'モブガードリカバー',
              0.115,
              7
            )
          ],
          P_HEAL(
            'モブガードの支援',
            '自身が行う回復量を上げる。',
            3
          ),
          C()
        )
      ],
      B()
    ),

    T(
      19,
      'フリーズマスターズ',
      '妨害と状況判断で戦闘を支配する。',
      'B6～A7',
      'A3～S2',
      'B',
      'high',
      'control',
      [
        P(
          'IGL',
          'モブフロスト',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A3/A9',
            'S1/S7',
            'B8/A5',
            'A4/S1',
            'A3/A9',
            'A8/S5',
            'A6/S3'
          ],
          W(
            'アサルトライフル',
            63,
            69,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            BUFF(
              'モブフロストコール',
              {
                mind: 3,
                technique: 2
              },
              6
            ),

            CT(
              'モブフロストタクティクス',
              0.125,
              7
            )
          ],
          P_TEAM(
            'モブフロストの指揮',
            '味方全体のコントロール性能を上げる。',
            {
              mind: 2
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブアイサー',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A2/A8',
            'A4/S1',
            'A5/S2',
            'A5/S2',
            'A3/A9',
            'A7/S4',
            'B9/A6'
          ],
          W(
            'リボルバー',
            71,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            DMG(
              'モブアイサーバースト',
              2.7,
              0.835,
              5.5
            ),

            MULTI(
              'モブアイサーラッシュ',
              3,
              0.89,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブアイサーの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.044
          ),
          C()
        ),

        P(
          'SUP',
          'モブグレイシ',
          'C9～B9',
          'B6～A7',
          'A3～S2',
          [
            'A2/A8',
            'A8/S5',
            'B8/A5',
            'B9/A6',
            'A3/A9',
            'A6/S3',
            'A9/S6'
          ],
          W(
            'ハンドガン',
            63,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A5'
            ]
          ),
          [
            HEAL(
              'モブグレイシヒール',
              0.154,
              6
            ),

            CT(
              'モブグレイシリカバー',
              0.115,
              7
            )
          ],
          P_HEAL(
            'モブグレイシの支援',
            '自身が行う回復量を上げる。',
            3
          ),
          C()
        )
      ],
      B()
    ),

    T(
      20,
      'アサルトゴサンケ',
      '近・中距離から一気に攻める。',
      'B6～A7',
      'A3～S2',
      'B',
      'high',
      'assault',
      [
        P(
          'IGL',
          'モブレンジ',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A3/A9',
            'A6/S3',
            'A3/A9',
            'A6/S3',
            'A4/S1',
            'A5/S2',
            'A4/S1'
          ],
          W(
            'アサルトライフル',
            63,
            69,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            BUFF(
              'モブレンジコール',
              {
                physical: 3,
                aim: 2
              },
              6
            ),

            CT(
              'モブレンジタクティクス',
              0.125,
              7
            )
          ],
          P_TEAM(
            'モブレンジの指揮',
            '味方全体のアサルト性能を上げる。',
            {
              physical: 2
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブラッシュ',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A3/A9',
            'A1/A7',
            'S1/S7',
            'A9/S6',
            'A6/S3',
            'A4/S1',
            'B8/A5'
          ],
          W(
            'ショットガン',
            71,
            63,
            63,
            [
              'A6',
              'A2',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            DMG(
              'モブラッシュバースト',
              2.7,
              0.835,
              5.5
            ),

            MULTI(
              'モブラッシュラッシュ',
              3,
              0.89,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブラッシュの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.044
          ),
          C()
        ),

        P(
          'SUP',
          'モブカバー',
          'C9～B9',
          'B6～A7',
          'A3～S2',
          [
            'A3/A9',
            'A6/S3',
            'A3/A9',
            'A4/S1',
            'A4/S1',
            'A4/S1',
            'A7/S4'
          ],
          W(
            'ハンドガン',
            63,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A5'
            ]
          ),
          [
            HEAL(
              'モブカバーヒール',
              0.154,
              6
            ),

            CT(
              'モブカバーリカバー',
              0.115,
              7
            )
          ],
          P_HEAL(
            'モブカバーの支援',
            '自身が行う回復量を上げる。',
            3
          ),
          C()
        )
      ],
      B()
    ),

    T(
      21,
      'ティーチャーズ',
      '回復と味方強化を軸に安定して戦う。',
      'B6～A7',
      'A3～S2',
      'C',
      'high',
      'support',
      [
        P(
          'IGL',
          'モブホーム',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A1/A7',
            'A8/S5',
            'B8/A5',
            'A3/A9',
            'A1/A7',
            'A5/S2',
            'A8/S5'
          ],
          W(
            'ハンドガン',
            63,
            69,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            BUFF(
              'モブホームコール',
              {
                support: 3,
                mind: 2
              },
              6
            ),

            CT(
              'モブホームタクティクス',
              0.125,
              7
            )
          ],
          P_TEAM(
            'モブホームの指揮',
            '味方全体のサポート性能を上げる。',
            {
              support: 2
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブチャイム',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A3/A9',
            'A2/A8',
            'A6/S3',
            'A7/S4',
            'A4/S1',
            'A4/S1',
            'A2/A8'
          ],
          W(
            'アサルトライフル',
            71,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            DMG(
              'モブチャイムバースト',
              2.7,
              0.835,
              5.5
            ),

            MULTI(
              'モブチャイムラッシュ',
              3,
              0.89,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブチャイムの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.044
          ),
          C()
        ),

        P(
          'SUP',
          'モブノート',
          'C9～B9',
          'B6～A7',
          'A3～S2',
          [
            'A2/A8',
            'A7/S4',
            'B6/A3',
            'A2/A8',
            'A1/A7',
            'A6/S3',
            'S3/S9'
          ],
          W(
            'ハンドガン',
            63,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A5'
            ]
          ),
          [
            HEAL(
              'モブノートヒール',
              0.154,
              6
            ),

            REVIVE(
              'モブノートリスポーン',
              0.24,
              9
            )
          ],
          P_HEAL(
            'モブノートの支援',
            '自身が行う回復量を上げる。',
            3
          ),
          C()
        )
      ],
      B()
    ),

    T(
      22,
      'トザンポイント',
      'スタミナと回復力を活かして粘り強く戦う。',
      'B6～A7',
      'A3～S2',
      'C',
      'high',
      'survival',
      [
        P(
          'IGL',
          'モブピーク',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A4/S1',
            'A8/S5',
            'B9/A6',
            'A2/A8',
            'A2/A8',
            'A4/S1',
            'A6/S3'
          ],
          W(
            'アサルトライフル',
            63,
            69,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            BUFF(
              'モブピークコール',
              {
                stamina: 3,
                support: 2
              },
              6
            ),

            CT(
              'モブピークタクティクス',
              0.125,
              7
            )
          ],
          P_TEAM(
            'モブピークの指揮',
            '味方全体のサバイバル性能を上げる。',
            {
              stamina: 2
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブリッジ',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A4/S1',
            'A3/A9',
            'A7/S4',
            'A7/S4',
            'A3/A9',
            'A4/S1',
            'A2/A8'
          ],
          W(
            'アサルトライフル',
            71,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            DMG(
              'モブリッジバースト',
              2.7,
              0.835,
              5.5
            ),

            MULTI(
              'モブリッジラッシュ',
              3,
              0.89,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブリッジの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.044
          ),
          C()
        ),

        P(
          'SUP',
          'モブルート',
          'C9～B9',
          'B6～A7',
          'A3～S2',
          [
            'A6/S3',
            'A8/S5',
            'B7/A4',
            'B9/A6',
            'A3/A9',
            'A5/S2',
            'S1/S7'
          ],
          W(
            'ハンドガン',
            63,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A5'
            ]
          ),
          [
            HEAL(
              'モブルートヒール',
              0.154,
              6
            ),

            CT(
              'モブルートリカバー',
              0.115,
              7
            )
          ],
          P_HEAL(
            'モブルートの支援',
            '自身が行う回復量を上げる。',
            3
          ),
          C()
        )
      ],
      B()
    ),

    T(
      23,
      'ダイビングクリーチャーズ',
      'スタミナと回復力を活かして粘り強く戦う。',
      'B6～A7',
      'A3～S2',
      'C',
      'high',
      'survival',
      [
        P(
          'IGL',
          'モブダイブ',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A5/S2',
            'A7/S4',
            'A1/A7',
            'A3/A9',
            'A1/A7',
            'A4/S1',
            'A7/S4'
          ],
          W(
            'アサルトライフル',
            63,
            69,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            BUFF(
              'モブダイブコール',
              {
                stamina: 3,
                support: 2
              },
              6
            ),

            CT(
              'モブダイブタクティクス',
              0.125,
              7
            )
          ],
          P_TEAM(
            'モブダイブの指揮',
            '味方全体のサバイバル性能を上げる。',
            {
              stamina: 2
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブマリン',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A6/S3',
            'A4/S1',
            'A6/S3',
            'A5/S2',
            'A4/S1',
            'A3/A9',
            'A2/A8'
          ],
          W(
            'アサルトライフル',
            71,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            DMG(
              'モブマリンバースト',
              2.7,
              0.835,
              5.5
            ),

            MULTI(
              'モブマリンラッシュ',
              3,
              0.89,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブマリンの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.044
          ),
          C()
        ),

        P(
          'SUP',
          'モブコーラル',
          'C9～B9',
          'B6～A7',
          'A3～S2',
          [
            'A6/S3',
            'A8/S5',
            'B9/A6',
            'A2/A8',
            'A1/A7',
            'A4/S1',
            'A8/S5'
          ],
          W(
            'ハンドガン',
            63,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A5'
            ]
          ),
          [
            HEAL(
              'モブコーラルヒール',
              0.154,
              6
            ),

            CT(
              'モブコーラルリカバー',
              0.115,
              7
            )
          ],
          P_HEAL(
            'モブコーラルの支援',
            '自身が行う回復量を上げる。',
            3
          ),
          C()
        )
      ],
      B()
    ),

    T(
      24,
      'ドクターモブオール',
      '回復と味方強化を軸に安定して戦う。',
      'B6～A7',
      'A3～S2',
      'C',
      'high',
      'support',
      [
        P(
          'IGL',
          'モブカルテ',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A3/A9',
            'A8/S5',
            'B8/A5',
            'A2/A8',
            'A2/A8',
            'A7/S4',
            'A7/S4'
          ],
          W(
            'ハンドガン',
            63,
            69,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            BUFF(
              'モブカルテコール',
              {
                support: 3,
                mind: 2
              },
              6
            ),

            CT(
              'モブカルテタクティクス',
              0.125,
              7
            )
          ],
          P_TEAM(
            'モブカルテの指揮',
            '味方全体のサポート性能を上げる。',
            {
              support: 2
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブメディク',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A1/A7',
            'A4/S1',
            'A4/S1',
            'A6/S3',
            'A5/S2',
            'A6/S3',
            'A3/A9'
          ],
          W(
            'アサルトライフル',
            71,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            DMG(
              'モブメディクバースト',
              2.7,
              0.835,
              5.5
            ),

            MULTI(
              'モブメディクラッシュ',
              3,
              0.89,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブメディクの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.044
          ),
          C()
        ),

        P(
          'SUP',
          'モブオペラ',
          'C9～B9',
          'B6～A7',
          'A3～S2',
          [
            'A2/A8',
            'A8/S5',
            'B8/A5',
            'B9/A6',
            'A3/A9',
            'A6/S3',
            'S1/S7'
          ],
          W(
            'ハンドガン',
            63,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A5'
            ]
          ),
          [
            HEAL(
              'モブオペラヒール',
              0.154,
              6
            ),

            CT(
              'モブオペラリカバー',
              0.115,
              7
            )
          ],
          P_HEAL(
            'モブオペラの支援',
            '自身が行う回復量を上げる。',
            3
          ),
          C()
        )
      ],
      B()
    ),

    T(
      25,
      'ワノココロ',
      '攻守と連携のバランスに優れる。',
      'B6～A7',
      'A3～S2',
      'C',
      'high',
      'balanced',
      [
        P(
          'IGL',
          'モブミカド',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A2/A8',
            'A7/S4',
            'B8/A5',
            'A3/A9',
            'A3/A9',
            'A4/S1',
            'A5/S2'
          ],
          W(
            'アサルトライフル',
            63,
            69,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            BUFF(
              'モブミカドコール',
              {
                aim: 3,
                mind: 2
              },
              6
            ),

            CT(
              'モブミカドタクティクス',
              0.125,
              7
            )
          ],
          P_TEAM(
            'モブミカドの指揮',
            '味方全体のバランス性能を上げる。',
            {
              aim: 2
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブカゲロウ',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A2/A8',
            'A1/A7',
            'A7/S4',
            'A5/S2',
            'A4/S1',
            'A3/A9',
            'B9/A6'
          ],
          W(
            'アサルトライフル',
            71,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            DMG(
              'モブカゲロウバースト',
              2.7,
              0.835,
              5.5
            ),

            MULTI(
              'モブカゲロウラッシュ',
              3,
              0.89,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブカゲロウの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.044
          ),
          C()
        ),

        P(
          'SUP',
          'モブナギ',
          'C9～B9',
          'B6～A7',
          'A3～S2',
          [
            'A4/S1',
            'A4/S1',
            'B8/A5',
            'A1/A7',
            'A3/A9',
            'A4/S1',
            'A8/S5'
          ],
          W(
            'ハンドガン',
            63,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A5'
            ]
          ),
          [
            HEAL(
              'モブナギヒール',
              0.154,
              6
            ),

            CT(
              'モブナギリカバー',
              0.115,
              7
            )
          ],
          P_HEAL(
            'モブナギの支援',
            '自身が行う回復量を上げる。',
            3
          ),
          C()
        )
      ],
      B()
    ),

    T(
      26,
      'ダンゴサンニンシュウ',
      '攻守と連携のバランスに優れる。',
      'B6～A7',
      'A3～S2',
      'C',
      'high',
      'balanced',
      [
        P(
          'IGL',
          'モブミタラ',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A2/A8',
            'A5/S2',
            'A1/A7',
            'A3/A9',
            'A3/A9',
            'A6/S3',
            'A3/A9'
          ],
          W(
            'アサルトライフル',
            63,
            69,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            BUFF(
              'モブミタラコール',
              {
                aim: 3,
                mind: 2
              },
              6
            ),

            CT(
              'モブミタラタクティクス',
              0.125,
              7
            )
          ],
          P_TEAM(
            'モブミタラの指揮',
            '味方全体のバランス性能を上げる。',
            {
              aim: 2
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブゴマ',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A1/A7',
            'A2/A8',
            'A6/S3',
            'A7/S4',
            'A5/S2',
            'A3/A9',
            'B7/A4'
          ],
          W(
            'アサルトライフル',
            71,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            DMG(
              'モブゴマバースト',
              2.7,
              0.835,
              5.5
            ),

            MULTI(
              'モブゴマラッシュ',
              3,
              0.89,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブゴマの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.044
          ),
          C()
        ),

        P(
          'SUP',
          'モブキナコ',
          'C9～B9',
          'B6～A7',
          'A3～S2',
          [
            'A2/A8',
            'A6/S3',
            'B9/A6',
            'B9/A6',
            'A3/A9',
            'A4/S1',
            'A8/S5'
          ],
          W(
            'ハンドガン',
            63,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A5'
            ]
          ),
          [
            HEAL(
              'モブキナコヒール',
              0.154,
              6
            ),

            REVIVE(
              'モブキナコリスポーン',
              0.24,
              9
            )
          ],
          P_HEAL(
            'モブキナコの支援',
            '自身が行う回復量を上げる。',
            3
          ),
          C()
        )
      ],
      B()
    ),

    T(
      27,
      'モリノハンドガン',
      '高いエイムと技術で遠距離を制圧する。',
      'B6～A7',
      'A3～S2',
      'C',
      'high',
      'sniper',
      [
        P(
          'IGL',
          'モブフォレス',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'B9/A6',
            'A7/S4',
            'B8/A5',
            'A7/S4',
            'A3/A9',
            'A7/S4',
            'A3/A9'
          ],
          W(
            'スナイパーライフル',
            63,
            69,
            63,
            [
              'A1',
              'A2',
              'A6',
              'A2',
              'A2'
            ]
          ),
          [
            BUFF(
              'モブフォレスコール',
              {
                aim: 3,
                technique: 2
              },
              6
            ),

            CT(
              'モブフォレスタクティクス',
              0.125,
              7
            )
          ],
          P_TEAM(
            'モブフォレスの指揮',
            '味方全体のスナイパー性能を上げる。',
            {
              aim: 2
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブリーフ',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'B9/A6',
            'A2/A8',
            'A3/A9',
            'A9/S6',
            'A4/S1',
            'A6/S3',
            'B9/A6'
          ],
          W(
            'スナイパーライフル',
            71,
            63,
            63,
            [
              'A1',
              'A2',
              'A6',
              'A2',
              'A2'
            ]
          ),
          [
            DMG(
              'モブリーフバースト',
              2.7,
              0.835,
              5.5
            ),

            MULTI(
              'モブリーフラッシュ',
              3,
              0.89,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブリーフの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.044
          ),
          C()
        ),

        P(
          'SUP',
          'モブウッド',
          'C9～B9',
          'B6～A7',
          'A3～S2',
          [
            'A2/A8',
            'A6/S3',
            'B6/A3',
            'A5/S2',
            'A1/A7',
            'A6/S3',
            'A8/S5'
          ],
          W(
            'ハンドガン',
            63,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A5'
            ]
          ),
          [
            HEAL(
              'モブウッドヒール',
              0.154,
              6
            ),

            REVIVE(
              'モブウッドリスポーン',
              0.24,
              9
            )
          ],
          P_HEAL(
            'モブウッドの支援',
            '自身が行う回復量を上げる。',
            3
          ),
          C()
        )
      ],
      B()
    ),

    T(
      28,
      'コードケーブル',
      '高い技術と特殊効果で相手を崩す。',
      'B6～A7',
      'A3～S2',
      'C',
      'high',
      'technical',
      [
        P(
          'IGL',
          'モブリンク',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A1/A7',
            'A8/S5',
            'A1/A7',
            'A5/S2',
            'A3/A9',
            'A8/S5',
            'A4/S1'
          ],
          W(
            'アサルトライフル',
            63,
            69,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            BUFF(
              'モブリンクコール',
              {
                technique: 3,
                mind: 2
              },
              6
            ),

            CT(
              'モブリンクタクティクス',
              0.125,
              7
            )
          ],
          P_TEAM(
            'モブリンクの指揮',
            '味方全体のテクニカル性能を上げる。',
            {
              technique: 2
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブワイヤ',
          'B1～A1',
          'B7～A8',
          'A4～S3',
          [
            'A3/A9',
            'A3/A9',
            'A5/S2',
            'A6/S3',
            'A3/A9',
            'A9/S6',
            'B9/A6'
          ],
          W(
            'リボルバー',
            71,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A2'
            ]
          ),
          [
            DMG(
              'モブワイヤバースト',
              2.7,
              0.835,
              5.5
            ),

            MULTI(
              'モブワイヤラッシュ',
              3,
              0.89,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブワイヤの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.044
          ),
          C()
        ),

        P(
          'SUP',
          'モブコネクト',
          'C9～B9',
          'B6～A7',
          'A3～S2',
          [
            'A4/S1',
            'A7/S4',
            'B9/A6',
            'A1/A7',
            'A2/A8',
            'A7/S4',
            'A7/S4'
          ],
          W(
            'ハンドガン',
            63,
            63,
            63,
            [
              'A1',
              'A6',
              'B9',
              'A2',
              'A5'
            ]
          ),
          [
            HEAL(
              'モブコネクトヒール',
              0.154,
              6
            ),

            CT(
              'モブコネクトリカバー',
              0.115,
              7
            )
          ],
          P_HEAL(
            'モブコネクトの支援',
            '自身が行う回復量を上げる。',
            3
          ),
          C()
        )
      ],
      B()
    ),

    T(
      29,
      'ウラノヒットクルー',
      '近・中距離から一気に攻める。',
      'B1～A2',
      'B8～A8',
      'C',
      'standard',
      'assault',
      [
        P(
          'IGL',
          'モブバック',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B6/A3',
            'A1/A7',
            'B7/A4',
            'A2/A8',
            'B9/A6',
            'A2/A8',
            'B8/A5'
          ],
          W(
            'アサルトライフル',
            57,
            63,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            BUFF(
              'モブバックコール',
              {
                physical: 2,
                aim: 1
              },
              6
            ),

            CT(
              'モブバックタクティクス',
              0.11,
              7
            )
          ],
          P_TEAM(
            'モブバックの指揮',
            '味方全体のアサルト性能を上げる。',
            {
              physical: 1
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブヒッター',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B7/A4',
            'B6/A3',
            'A5/S2',
            'A3/A9',
            'A1/A7',
            'A1/A7',
            'B2/B8'
          ],
          W(
            'ショットガン',
            65,
            57,
            57,
            [
              'A2',
              'B7',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            DMG(
              'モブヒッターバースト',
              2.4,
              0.81,
              5.5
            ),

            MULTI(
              'モブヒッターラッシュ',
              3,
              0.81,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブヒッターの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.036
          ),
          C()
        ),

        P(
          'SUP',
          'モブトレース',
          'C5～B5',
          'B1～A2',
          'B8～A8',
          [
            'B8/A5',
            'A2/A8',
            'B6/A3',
            'B8/A5',
            'B7/A4',
            'B8/A5',
            'A3/A9'
          ],
          W(
            'ハンドガン',
            57,
            57,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'A1'
            ]
          ),
          [
            HEAL(
              'モブトレースヒール',
              0.136,
              6
            ),

            CT(
              'モブトレースリカバー',
              0.1,
              7
            )
          ],
          P_HEAL(
            'モブトレースの支援',
            '自身が行う回復量を上げる。',
            2
          ),
          C()
        )
      ],
      B()
    ),

    T(
      30,
      'フラワーゼロカエル',
      '回復と味方強化を軸に安定して戦う。',
      'B1～A2',
      'B8～A8',
      'C',
      'standard',
      'support',
      [
        P(
          'IGL',
          'モブブルーム',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B7/A4',
            'A4/S1',
            'B5/A2',
            'B8/A5',
            'B6/A3',
            'A2/A8',
            'A5/S2'
          ],
          W(
            'ハンドガン',
            57,
            63,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            BUFF(
              'モブブルームコール',
              {
                support: 2,
                mind: 1
              },
              6
            ),

            CT(
              'モブブルームタクティクス',
              0.11,
              7
            )
          ],
          P_TEAM(
            'モブブルームの指揮',
            '味方全体のサポート性能を上げる。',
            {
              support: 1
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブペタル',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B7/A4',
            'B8/A5',
            'B9/A6',
            'A1/A7',
            'B8/A5',
            'B9/A6',
            'B8/A5'
          ],
          W(
            'アサルトライフル',
            65,
            57,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            DMG(
              'モブペタルバースト',
              2.4,
              0.81,
              5.5
            ),

            MULTI(
              'モブペタルラッシュ',
              3,
              0.81,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブペタルの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.036
          ),
          C()
        ),

        P(
          'SUP',
          'モブリリィ',
          'C5～B5',
          'B1～A2',
          'B8～A8',
          [
            'B7/A4',
            'A4/S1',
            'B2/B8',
            'B5/A2',
            'B8/A5',
            'B9/A6',
            'A8/S5'
          ],
          W(
            'ハンドガン',
            57,
            57,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'A1'
            ]
          ),
          [
            HEAL(
              'モブリリィヒール',
              0.136,
              6
            ),

            CT(
              'モブリリィリカバー',
              0.1,
              7
            )
          ],
          P_HEAL(
            'モブリリィの支援',
            '自身が行う回復量を上げる。',
            2
          ),
          C()
        )
      ],
      B()
    ),

    T(
      31,
      'パーティーオブオマツリ',
      '高火力スキルで短時間に決着を狙う。',
      'B1～A2',
      'B8～A8',
      'D',
      'standard',
      'burst',
      [
        P(
          'IGL',
          'モブタイコ',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B6/A3',
            'A1/A7',
            'B8/A5',
            'A1/A7',
            'B7/A4',
            'A1/A7',
            'B8/A5'
          ],
          W(
            'アサルトライフル',
            57,
            63,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            BUFF(
              'モブタイココール',
              {
                physical: 2,
                aim: 1
              },
              6
            ),

            CT(
              'モブタイコタクティクス',
              0.11,
              7
            )
          ],
          P_TEAM(
            'モブタイコの指揮',
            '味方全体のバースト性能を上げる。',
            {
              physical: 1
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブハッピ',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B8/A5',
            'B6/A3',
            'A5/S2',
            'A3/A9',
            'A2/A8',
            'A1/A7',
            'B4/A1'
          ],
          W(
            'ショットガン',
            65,
            57,
            57,
            [
              'A2',
              'B7',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            DMG(
              'モブハッピバースト',
              2.4,
              0.81,
              5.5
            ),

            MULTI(
              'モブハッピラッシュ',
              3,
              0.81,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブハッピの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.036
          ),
          C()
        ),

        P(
          'SUP',
          'モブヨイサ',
          'C5～B5',
          'B1～A2',
          'B8～A8',
          [
            'B8/A5',
            'B9/A6',
            'B7/A4',
            'B7/A4',
            'B9/A6',
            'B8/A5',
            'A4/S1'
          ],
          W(
            'ハンドガン',
            57,
            57,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'A1'
            ]
          ),
          [
            HEAL(
              'モブヨイサヒール',
              0.136,
              6
            ),

            CT(
              'モブヨイサリカバー',
              0.1,
              7
            )
          ],
          P_HEAL(
            'モブヨイサの支援',
            '自身が行う回復量を上げる。',
            2
          ),
          C()
        )
      ],
      B()
    ),

    T(
      32,
      'ウミヲカケルワタリアシ',
      '高い機動力とCT回転で先手を取る。',
      'B1～A2',
      'B8～A8',
      'D',
      'standard',
      'speed',
      [
        P(
          'IGL',
          'モブシーラン',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B5/A2',
            'A3/A9',
            'B6/A3',
            'B9/A6',
            'A2/A8',
            'A4/S1',
            'B9/A6'
          ],
          W(
            'ハンドガン',
            57,
            63,
            65,
            [
              'B6',
              'A2',
              'B5',
              'A2',
              'B7'
            ]
          ),
          [
            BUFF(
              'モブシーランコール',
              {
                agility: 2,
                technique: 1
              },
              6
            ),

            CT(
              'モブシーランタクティクス',
              0.11,
              7
            )
          ],
          P_TEAM(
            'モブシーランの指揮',
            '味方全体のスピード性能を上げる。',
            {
              agility: 1
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブウェーブ',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B6/A3',
            'B7/A4',
            'A2/A8',
            'A2/A8',
            'A3/A9',
            'A1/A7',
            'B4/A1'
          ],
          W(
            'マシンガン',
            65,
            57,
            65,
            [
              'B6',
              'A2',
              'B5',
              'A2',
              'B7'
            ]
          ),
          [
            DMG(
              'モブウェーブバースト',
              2.4,
              0.81,
              5.5
            ),

            MULTI(
              'モブウェーブラッシュ',
              4,
              0.81,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブウェーブの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.036
          ),
          C()
        ),

        P(
          'SUP',
          'モブタイド',
          'C5～B5',
          'B1～A2',
          'B8～A8',
          [
            'B7/A4',
            'A2/A8',
            'B5/A2',
            'B5/A2',
            'A3/A9',
            'A1/A7',
            'A4/S1'
          ],
          W(
            'ハンドガン',
            57,
            57,
            65,
            [
              'B6',
              'A2',
              'B5',
              'A2',
              'A1'
            ]
          ),
          [
            HEAL(
              'モブタイドヒール',
              0.136,
              6
            ),

            CT(
              'モブタイドリカバー',
              0.1,
              7
            )
          ],
          P_HEAL(
            'モブタイドの支援',
            '自身が行う回復量を上げる。',
            2
          ),
          C()
        )
      ],
      B()
    ),

    T(
      33,
      'フレイムタイタンズ',
      '高火力スキルで短時間に決着を狙う。',
      'B1～A2',
      'B8～A8',
      'D',
      'standard',
      'burst',
      [
        P(
          'IGL',
          'モブブレイズ',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B7/A4',
            'B9/A6',
            'A1/A7',
            'B9/A6',
            'B7/A4',
            'B9/A6',
            'B9/A6'
          ],
          W(
            'アサルトライフル',
            57,
            63,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            BUFF(
              'モブブレイズコール',
              {
                physical: 2,
                aim: 1
              },
              6
            ),

            CT(
              'モブブレイズタクティクス',
              0.11,
              7
            )
          ],
          P_TEAM(
            'モブブレイズの指揮',
            '味方全体のバースト性能を上げる。',
            {
              physical: 1
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブヴァルガ',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B8/A5',
            'B5/A2',
            'A5/S2',
            'A5/S2',
            'B9/A6',
            'B8/A5',
            'B5/A2'
          ],
          W(
            'ショットガン',
            65,
            57,
            57,
            [
              'A2',
              'B7',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            DMG(
              'モブヴァルガバースト',
              2.4,
              0.81,
              5.5
            ),

            MULTI(
              'モブヴァルガラッシュ',
              3,
              0.81,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブヴァルガの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.036
          ),
          C()
        ),

        P(
          'SUP',
          'モブレグナ',
          'C5～B5',
          'B1～A2',
          'B8～A8',
          [
            'B9/A6',
            'A1/A7',
            'B7/A4',
            'B7/A4',
            'B8/A5',
            'B9/A6',
            'A3/A9'
          ],
          W(
            'ハンドガン',
            57,
            57,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'A1'
            ]
          ),
          [
            HEAL(
              'モブレグナヒール',
              0.136,
              6
            ),

            CT(
              'モブレグナリカバー',
              0.1,
              7
            )
          ],
          P_HEAL(
            'モブレグナの支援',
            '自身が行う回復量を上げる。',
            2
          ),
          C()
        )
      ],
      B()
    ),

    T(
      34,
      'サイエンスジャムズ',
      '高い技術と特殊効果で相手を崩す。',
      'B1～A2',
      'B8～A8',
      'D',
      'standard',
      'technical',
      [
        P(
          'IGL',
          'モブラボ',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B8/A5',
            'A3/A9',
            'B5/A2',
            'B9/A6',
            'B8/A5',
            'A6/S3',
            'B9/A6'
          ],
          W(
            'アサルトライフル',
            57,
            63,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            BUFF(
              'モブラボコール',
              {
                technique: 2,
                mind: 1
              },
              6
            ),

            CT(
              'モブラボタクティクス',
              0.11,
              7
            )
          ],
          P_TEAM(
            'モブラボの指揮',
            '味方全体のテクニカル性能を上げる。',
            {
              technique: 1
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブリアクト',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B7/A4',
            'B8/A5',
            'A1/A7',
            'A2/A8',
            'A1/A7',
            'A3/A9',
            'B4/A1'
          ],
          W(
            'リボルバー',
            65,
            57,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            DMG(
              'モブリアクトバースト',
              2.4,
              0.81,
              5.5
            ),

            MULTI(
              'モブリアクトラッシュ',
              3,
              0.81,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブリアクトの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.036
          ),
          C()
        ),

        P(
          'SUP',
          'モブアトム',
          'C5～B5',
          'B1～A2',
          'B8～A8',
          [
            'B7/A4',
            'A4/S1',
            'B4/A1',
            'B7/A4',
            'B8/A5',
            'A4/S1',
            'A2/A8'
          ],
          W(
            'ハンドガン',
            57,
            57,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'A1'
            ]
          ),
          [
            HEAL(
              'モブアトムヒール',
              0.136,
              6
            ),

            CT(
              'モブアトムリカバー',
              0.1,
              7
            )
          ],
          P_HEAL(
            'モブアトムの支援',
            '自身が行う回復量を上げる。',
            2
          ),
          C()
        )
      ],
      B()
    ),

    T(
      35,
      'サバクノトロッコ',
      'スタミナと回復力を活かして粘り強く戦う。',
      'B1～A2',
      'B8～A8',
      'D',
      'standard',
      'survival',
      [
        P(
          'IGL',
          'モブレール',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B9/A6',
            'A4/S1',
            'B6/A3',
            'B7/A4',
            'B8/A5',
            'B9/A6',
            'A2/A8'
          ],
          W(
            'アサルトライフル',
            57,
            63,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            BUFF(
              'モブレールコール',
              {
                stamina: 2,
                support: 1
              },
              6
            ),

            CT(
              'モブレールタクティクス',
              0.11,
              7
            )
          ],
          P_TEAM(
            'モブレールの指揮',
            '味方全体のサバイバル性能を上げる。',
            {
              stamina: 1
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブキャリー',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B9/A6',
            'B9/A6',
            'A2/A8',
            'A2/A8',
            'A1/A7',
            'B8/A5',
            'B5/A2'
          ],
          W(
            'アサルトライフル',
            65,
            57,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            DMG(
              'モブキャリーバースト',
              2.4,
              0.81,
              5.5
            ),

            MULTI(
              'モブキャリーラッシュ',
              3,
              0.81,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブキャリーの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.036
          ),
          C()
        ),

        P(
          'SUP',
          'モブドリフ',
          'C5～B5',
          'B1～A2',
          'B8～A8',
          [
            'A2/A8',
            'A2/A8',
            'B3/B9',
            'B5/A2',
            'B8/A5',
            'B9/A6',
            'A6/S3'
          ],
          W(
            'ハンドガン',
            57,
            57,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'A1'
            ]
          ),
          [
            HEAL(
              'モブドリフヒール',
              0.136,
              6
            ),

            CT(
              'モブドリフリカバー',
              0.1,
              7
            )
          ],
          P_HEAL(
            'モブドリフの支援',
            '自身が行う回復量を上げる。',
            2
          ),
          C()
        )
      ],
      B()
    ),

    T(
      36,
      'アングラボマーズ',
      '高火力スキルで短時間に決着を狙う。',
      'B1～A2',
      'B8～A8',
      'D',
      'standard',
      'burst',
      [
        P(
          'IGL',
          'モブボンバー',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B8/A5',
            'A1/A7',
            'B8/A5',
            'A2/A8',
            'B7/A4',
            'A2/A8',
            'B8/A5'
          ],
          W(
            'アサルトライフル',
            57,
            63,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            BUFF(
              'モブボンバーコール',
              {
                physical: 2,
                aim: 1
              },
              6
            ),

            CT(
              'モブボンバータクティクス',
              0.11,
              7
            )
          ],
          P_TEAM(
            'モブボンバーの指揮',
            '味方全体のバースト性能を上げる。',
            {
              physical: 1
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブタック',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B6/A3',
            'B4/A1',
            'A7/S4',
            'A4/S1',
            'A1/A7',
            'B9/A6',
            'B3/B9'
          ],
          W(
            'ショットガン',
            65,
            57,
            57,
            [
              'A2',
              'B7',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            DMG(
              'モブタックバースト',
              2.4,
              0.81,
              5.5
            ),

            MULTI(
              'モブタックラッシュ',
              3,
              0.81,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブタックの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.036
          ),
          C()
        ),

        P(
          'SUP',
          'モブバズーカ',
          'C5～B5',
          'B1～A2',
          'B8～A8',
          [
            'B8/A5',
            'B8/A5',
            'B9/A6',
            'B9/A6',
            'B9/A6',
            'B8/A5',
            'A3/A9'
          ],
          W(
            'ハンドガン',
            57,
            57,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'A1'
            ]
          ),
          [
            HEAL(
              'モブバズーカヒール',
              0.136,
              6
            ),

            REVIVE(
              'モブバズーカリスポーン',
              0.22,
              9
            )
          ],
          P_HEAL(
            'モブバズーカの支援',
            '自身が行う回復量を上げる。',
            2
          ),
          C()
        )
      ],
      B()
    ),

    T(
      37,
      'タイムストーン',
      '妨害と状況判断で戦闘を支配する。',
      'B1～A2',
      'B8～A8',
      'D',
      'standard',
      'control',
      [
        P(
          'IGL',
          'モブクロノ',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B6/A3',
            'A5/S2',
            'B4/A1',
            'B7/A4',
            'B7/A4',
            'A3/A9',
            'A1/A7'
          ],
          W(
            'アサルトライフル',
            57,
            63,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            BUFF(
              'モブクロノコール',
              {
                mind: 2,
                technique: 1
              },
              6
            ),

            CT(
              'モブクロノタクティクス',
              0.11,
              7
            )
          ],
          P_TEAM(
            'モブクロノの指揮',
            '味方全体のコントロール性能を上げる。',
            {
              mind: 1
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブエポック',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B8/A5',
            'A1/A7',
            'A2/A8',
            'A3/A9',
            'A1/A7',
            'A4/S1',
            'B5/A2'
          ],
          W(
            'リボルバー',
            65,
            57,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            DMG(
              'モブエポックバースト',
              2.4,
              0.81,
              5.5
            ),

            MULTI(
              'モブエポックラッシュ',
              3,
              0.81,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブエポックの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.036
          ),
          C()
        ),

        P(
          'SUP',
          'モブクォーツ',
          'C5～B5',
          'B1～A2',
          'B8～A8',
          [
            'B7/A4',
            'A4/S1',
            'B3/B9',
            'B6/A3',
            'B6/A3',
            'A3/A9',
            'A3/A9'
          ],
          W(
            'ハンドガン',
            57,
            57,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'A1'
            ]
          ),
          [
            HEAL(
              'モブクォーツヒール',
              0.136,
              6
            ),

            CT(
              'モブクォーツリカバー',
              0.1,
              7
            )
          ],
          P_HEAL(
            'モブクォーツの支援',
            '自身が行う回復量を上げる。',
            2
          ),
          C()
        )
      ],
      B()
    ),

    T(
      38,
      'マジックフュージョンズ',
      '高い技術と特殊効果で相手を崩す。',
      'B1～A2',
      'B8～A8',
      'D',
      'standard',
      'technical',
      [
        P(
          'IGL',
          'モブルーン',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B7/A4',
            'A4/S1',
            'B5/A2',
            'B8/A5',
            'B6/A3',
            'A5/S2',
            'B9/A6'
          ],
          W(
            'アサルトライフル',
            57,
            63,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            BUFF(
              'モブルーンコール',
              {
                technique: 2,
                mind: 1
              },
              6
            ),

            CT(
              'モブルーンタクティクス',
              0.11,
              7
            )
          ],
          P_TEAM(
            'モブルーンの指揮',
            '味方全体のテクニカル性能を上げる。',
            {
              technique: 1
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブアルカナ',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B8/A5',
            'B8/A5',
            'A2/A8',
            'A2/A8',
            'A1/A7',
            'A4/S1',
            'B3/B9'
          ],
          W(
            'リボルバー',
            65,
            57,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            DMG(
              'モブアルカナバースト',
              2.4,
              0.81,
              5.5
            ),

            MULTI(
              'モブアルカナラッシュ',
              3,
              0.81,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブアルカナの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.036
          ),
          C()
        ),

        P(
          'SUP',
          'モブミスティ',
          'C5～B5',
          'B1～A2',
          'B8～A8',
          [
            'B8/A5',
            'A2/A8',
            'B5/A2',
            'B6/A3',
            'B7/A4',
            'A5/S2',
            'A2/A8'
          ],
          W(
            'ハンドガン',
            57,
            57,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'A1'
            ]
          ),
          [
            HEAL(
              'モブミスティヒール',
              0.136,
              6
            ),

            CT(
              'モブミスティリカバー',
              0.1,
              7
            )
          ],
          P_HEAL(
            'モブミスティの支援',
            '自身が行う回復量を上げる。',
            2
          ),
          C()
        )
      ],
      B()
    ),

    T(
      39,
      'カゼノナクソラ',
      '高い機動力とCT回転で先手を取る。',
      'B1～A2',
      'B8～A8',
      'D',
      'standard',
      'speed',
      [
        P(
          'IGL',
          'モブスカイ',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B7/A4',
            'A3/A9',
            'B6/A3',
            'B9/A6',
            'A1/A7',
            'A3/A9',
            'B9/A6'
          ],
          W(
            'ハンドガン',
            57,
            63,
            65,
            [
              'B6',
              'A2',
              'B5',
              'A2',
              'B7'
            ]
          ),
          [
            BUFF(
              'モブスカイコール',
              {
                agility: 2,
                technique: 1
              },
              6
            ),

            CT(
              'モブスカイタクティクス',
              0.11,
              7
            )
          ],
          P_TEAM(
            'モブスカイの指揮',
            '味方全体のスピード性能を上げる。',
            {
              agility: 1
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブゲイル',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B7/A4',
            'B5/A2',
            'A3/A9',
            'A2/A8',
            'A4/S1',
            'A3/A9',
            'B4/A1'
          ],
          W(
            'マシンガン',
            65,
            57,
            65,
            [
              'B6',
              'A2',
              'B5',
              'A2',
              'B7'
            ]
          ),
          [
            DMG(
              'モブゲイルバースト',
              2.4,
              0.81,
              5.5
            ),

            MULTI(
              'モブゲイルラッシュ',
              4,
              0.81,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブゲイルの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.036
          ),
          C()
        ),

        P(
          'SUP',
          'モブブリーズ',
          'C5～B5',
          'B1～A2',
          'B8～A8',
          [
            'B8/A5',
            'A2/A8',
            'B4/A1',
            'B5/A2',
            'A1/A7',
            'A1/A7',
            'A3/A9'
          ],
          W(
            'ハンドガン',
            57,
            57,
            65,
            [
              'B6',
              'A2',
              'B5',
              'A2',
              'A1'
            ]
          ),
          [
            HEAL(
              'モブブリーズヒール',
              0.136,
              6
            ),

            REVIVE(
              'モブブリーズリスポーン',
              0.22,
              9
            )
          ],
          P_HEAL(
            'モブブリーズの支援',
            '自身が行う回復量を上げる。',
            2
          ),
          C()
        )
      ],
      B()
    ),

    T(
      40,
      'ライデンカンパニー',
      '近・中距離から一気に攻める。',
      'B1～A2',
      'B8～A8',
      'D',
      'standard',
      'assault',
      [
        P(
          'IGL',
          'モブカオセン',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B7/A4',
            'A1/A7',
            'B8/A5',
            'B9/A6',
            'B8/A5',
            'A2/A8',
            'B7/A4'
          ],
          W(
            'アサルトライフル',
            57,
            63,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            BUFF(
              'モブカオセンコール',
              {
                physical: 2,
                aim: 1
              },
              6
            ),

            CT(
              'モブカオセンタクティクス',
              0.11,
              7
            )
          ],
          P_TEAM(
            'モブカオセンの指揮',
            '味方全体のアサルト性能を上げる。',
            {
              physical: 1
            }
          ),
          C()
        ),

        P(
          'ATK',
          'モブライデン',
          'C6～B6',
          'B2～A3',
          'B9～A9',
          [
            'B7/A4',
            'B5/A2',
            'A4/S1',
            'A4/S1',
            'A1/A7',
            'B8/A5',
            'B3/B9'
          ],
          W(
            'ショットガン',
            65,
            57,
            57,
            [
              'A2',
              'B7',
              'B5',
              'B7',
              'B7'
            ]
          ),
          [
            DMG(
              'モブライデンバースト',
              2.4,
              0.81,
              5.5
            ),

            MULTI(
              'モブライデンラッシュ',
              3,
              0.81,
              0.72,
              6.5
            )
          ],
          P_FINISH(
            'モブライデンの決定力',
            'HP50％以下の敵へのダメージを上げる。',
            0.036
          ),
          C()
        ),

        P(
          'SUP',
          'モブフリグー',
          'C5～B5',
          'B1～A2',
          'B8～A8',
          [
            'B8/A5',
            'A1/A7',
            'B7/A4',
            'B7/A4',
            'B9/A6',
            'B8/A5',
            'A1/A7'
          ],
          W(
            'ハンドガン',
            57,
            57,
            57,
            [
              'B6',
              'A2',
              'B5',
              'B7',
              'A1'
            ]
          ),
          [
            HEAL(
              'モブフリグーヒール',
              0.136,
              6
            ),

            CT(
              'モブフリグーリカバー',
              0.1,
              7
            )
          ],
          P_HEAL(
            'モブフリグーの支援',
            '自身が行う回復量を上げる。',
            2
          ),
          C()
        )
      ],
      B()
    )
  ];

  function validateNationalTeams() {
    const errors = [];

    const teamIds =
      new Set();

    const playerIds =
      new Set();

    const skillIds =
      new Set();

    const passiveIds =
      new Set();

    if (
      NATIONAL_TEAMS.length !==
      40
    ) {
      errors.push(
        `Nationalチーム数が40ではありません: ${NATIONAL_TEAMS.length}`
      );
    }

    NATIONAL_TEAMS.forEach(
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

        teamIds.add(
          team.id
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

        [
          'IGL',
          'ATK',
          'SUP'
        ].forEach(
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

            if (
              member.skills.length !==
              2
            ) {
              errors.push(
                `${member.name}の専用スキル数が2ではありません。`
              );
            }

            if (
              member
                .specialAbilities
                .length !==
              1
            ) {
              errors.push(
                `${member.name}の特殊能力数が1ではありません。`
              );
            }

            member.skills.forEach(
              (skill) => {
                if (
                  skillIds.has(
                    skill.id
                  )
                ) {
                  errors.push(
                    `スキルID重複: ${skill.id}`
                  );
                }

                skillIds.add(
                  skill.id
                );
              }
            );

            member
              .specialAbilities
              .forEach(
                (ability) => {
                  if (
                    passiveIds.has(
                      ability.id
                    )
                  ) {
                    errors.push(
                      `特殊能力ID重複: ${ability.id}`
                    );
                  }

                  passiveIds.add(
                    ability.id
                  );
                }
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
                    `${member.name}.${statId}がありません。`
                  );
                }
              }
            );
          }
        );
      }
    );

    return {
      valid:
        errors.length === 0,

      errors,

      counts: {
        teams:
          NATIONAL_TEAMS.length,

        players:
          playerIds.size,

        dedicatedSkills:
          skillIds.size,

        specialAbilities:
          passiveIds.size
      }
    };
  }

  const validation =
    validateNationalTeams();

  if (!validation.valid) {
    throw new Error(
      validation.errors.join(
        '\n'
      )
    );
  }

  const registration =
    CPU.registerTeams(
      'national',
      NATIONAL_TEAMS,
      {
        replaceTier:
          true,

        source:
          'cpu-national-data.js'
      }
    );

  function getNativeTeams() {
    return NATIONAL_TEAMS.map(
      (team) =>
        JSON.parse(
          JSON.stringify(team)
        )
    );
  }

  function selectNativeTeams({
    count = 30,
    excludeTeamIds = [],
    random = Math.random
  } = {}) {
    const excluded =
      new Set(
        excludeTeamIds
      );

    const pool =
      getNativeTeams()
        .filter(
          (team) =>
            !excluded.has(
              team.id
            )
        );

    for (
      let index =
        pool.length - 1;

      index > 0;

      index -= 1
    ) {
      const nextIndex =
        Math.floor(
          Math.max(
            0,
            Math.min(
              0.999999999,
              random()
            )
          ) *
          (
            index + 1
          )
        );

      [
        pool[index],
        pool[nextIndex]
      ] = [
        pool[nextIndex],
        pool[index]
      ];
    }

    return pool.slice(
      0,
      Math.max(
        0,
        Math.min(
          count,
          pool.length
        )
      )
    );
  }

  const NATIONAL_API =
    Object.freeze({
      getNativeTeams,
      selectNativeTeams,
      validateNationalTeams
    });

  MOBBR.DATA.cpu
    .nationalRules =
    NATIONAL_RULES;

  MOBBR.DATA.cpu
    .nationalSource =
    Object.freeze({
      version:
        '2.0.0-explicit',

      teams:
        NATIONAL_TEAMS,

      validation
    });

  global.MOBBR_NATIONAL_CPU_TEAMS =
    NATIONAL_TEAMS;

  global.MOBBR_NATIONAL_CPU_RULES =
    NATIONAL_RULES;

  global.MOBBR_NATIONAL_CPU_API =
    NATIONAL_API;

  global.MOBBR_NATIONAL_CPU_REGISTRATION =
    registration;
})(
  typeof window !== 'undefined'
    ? window
    : globalThis
);
