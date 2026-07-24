'use strict';

/**
 * MOB BR - cpu-local-data.js
 * Local 23チーム登録部分。
 *
 * 読み込み順:
 * game-data.js
 * ability-data.js
 * training-data.js
 * coach-data.js
 * cpu-data.js
 * cpu-local-national-data.js
 */
(function initializeLocalCpuData(global) {
  const MOBBR = global.MOBBR = global.MOBBR || {};
  const CPU = MOBBR.API?.cpu;

  if (!CPU) {
    throw new Error(
      'cpu-local-data.jsより先にcpu-data.jsを読み込んでください。'
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

  const REQUIRED_TEAM_NUMBERS =
    new Set([
      1, 2, 3, 4, 5, 6, 8, 22, 23
    ]);

  const TEAM_CLASS_RANKS = {
    elite: {
      normal: 'A2～S4',
      hot: 'A8～S8'
    },

    high: {
      normal: 'C8～B9',
      hot: 'B9～A5'
    },

    middle: {
      normal: 'D1～C5',
      hot: 'D9～C9'
    },

    lower: {
      normal: 'E8～D9',
      hot: 'D5～C2'
    }
  };

  const WEAPON_RANGE = {
    'ショットガン': 'close',
    'ハンドガン': 'mid',
    'リボルバー': 'mid',
    'アサルトライフル': 'mid',
    'スナイパーライフル': 'far',
    'マシンガン': 'mid'
  };

  const ROLE_SUFFIX = {
    IGL: 'B',
    ATK: 'A',
    SUP: 'C'
  };

  function hashText(value) {
    let hash = 2166136261;
    const source = String(value || '');

    for (
      let index = 0;
      index < source.length;
      index += 1
    ) {
      hash ^= source.charCodeAt(index);
      hash = Math.imul(
        hash,
        16777619
      );
    }

    return hash >>> 0;
  }

  function idFromName(
    prefix,
    name
  ) {
    return (
      `${prefix}_` +
      hashText(name)
        .toString(36)
    );
  }

  function percentFromText(
    description,
    fallback
  ) {
    const match =
      String(description || '')
        .match(/(\d+(?:\.\d+)?)\s*%/);

    return match
      ? Number(match[1]) / 100
      : fallback;
  }

  function statIdsFromText(
    source
  ) {
    const text =
      String(source || '')
        .toUpperCase();

    const mapping = {
      STAMINA: 'stamina',
      MIND: 'mind',
      PHYSICAL: 'physical',
      AIM: 'aim',
      AGILITY: 'agility',
      TECHNIQUE: 'technique',
      SUPPORT: 'support'
    };

    return Object.entries(mapping)
      .filter(
        ([label]) =>
          text.includes(label)
      )
      .map(
        ([, statId]) =>
          statId
      );
  }

  function makeSkill(
    name,
    description,
    role
  ) {
    const source =
      `${name} ${description}`;

    const skill = {
      id:
        idFromName(
          'local_skill',
          `${role}:${name}`
        ),

      name,
      description,
      role,
      target: 'enemySingle',
      type: 'singleDamage',
      power: 1.8,
      hit: 0.78,
      ct: 6,
      effects: []
    };

    const statIds =
      statIdsFromText(source);

    const hasEnemy =
      source.includes('敵');

    const hasAllies =
      source.includes('味方');

    const hasSelf =
      source.includes('自身');

    if (
      source.includes('ダウンを回復') ||
      source.includes('ダウン回復') ||
      name.includes('リスタート')
    ) {
      skill.type = 'reviveAll';
      skill.target = 'allyDown';
      skill.reviveHpRate = 0.20;
      skill.hit = 1;
      skill.ct = 9;

      skill.effects = [
        {
          code: 'REVIVE_ALL',
          reviveHpRate: 0.20
        }
      ];

      return skill;
    }

    if (
      source.includes('CT') &&
      (
        hasEnemy ||
        source.includes('延長') ||
        source.includes('増加')
      )
    ) {
      const rate =
        percentFromText(
          description,
          source.includes('大きく')
            ? 0.20
            : source.includes('少し')
              ? 0.08
              : 0.12
        );

      skill.type = 'enemyCtSlow';
      skill.target = 'enemyAll';
      skill.slow = rate;
      skill.hit = 0.80;

      skill.effects = [
        {
          code: 'CPU_ENEMY_CT_ADD',
          rate
        }
      ];

      return skill;
    }

    if (
      source.includes('CT') &&
      (
        hasAllies ||
        source.includes('短縮') ||
        source.includes('加速') ||
        source.includes('チャージ')
      )
    ) {
      const rate =
        percentFromText(
          description,
          source.includes('大きく')
            ? 0.20
            : source.includes('少し')
              ? 0.08
              : 0.12
        );

      skill.type =
        hasSelf
          ? 'selfCtBoost'
          : 'teamCtBoost';

      skill.target =
        hasSelf
          ? 'self'
          : 'allyAll';

      skill.boost = rate;
      skill.hit = 1;

      skill.effects = [
        {
          code:
            hasSelf
              ? 'CPU_SELF_CT_REDUCTION'
              : 'CPU_TEAM_CT_REDUCTION',

          target:
            skill.target,

          rate
        }
      ];

      return skill;
    }

    if (
      source.includes('被ダメージ軽減')
    ) {
      skill.type =
        'teamDamageReduction';

      skill.target =
        'allyAll';

      skill.rate = 0.08;
      skill.hit = 1;

      skill.effects = [
        {
          code:
            'DAMAGE_REDUCTION',

          target:
            'team',

          rate:
            0.08,

          durationSeconds:
            5
        }
      ];

      return skill;
    }

    if (
      source.includes('攻撃') &&
      source.includes('回復') &&
      hasAllies
    ) {
      skill.type =
        'allDamageHeal';

      skill.target =
        'enemyAll';

      skill.power =
        1.15;

      skill.healRate =
        0.08;

      skill.hit =
        0.78;

      skill.effects = [
        {
          code:
            'CPU_ALL_DAMAGE',

          power:
            1.15
        },
        {
          code:
            'TEAM_HEAL_FORMULA',

          baseRate:
            0.08,

          maximumRate:
            0.08
        }
      ];

      return skill;
    }

    if (
      source.includes('回復')
    ) {
      const ratio =
        source.includes('小回復') ||
        source.includes('少し回復')
          ? 0.10
          : 0.16;

      if (
        hasSelf &&
        (
          source.includes('攻撃') ||
          source.includes('ファイア')
        )
      ) {
        skill.type =
          'singleDamageSelfHeal';

        skill.target =
          'enemySingle';

        skill.power =
          1.65;

        skill.healRate =
          0.10;

        skill.effects = [
          {
            code:
              'CPU_SINGLE_DAMAGE',

            power:
              1.65
          },
          {
            code:
              'CPU_SELF_HEAL',

            rate:
              0.10
          }
        ];

        return skill;
      }

      skill.type =
        'teamHeal';

      skill.target =
        'allyAll';

      skill.healRate =
        ratio;

      skill.hit = 1;

      skill.effects = [
        {
          code:
            'TEAM_HEAL_FORMULA',

          baseRate:
            ratio,

          maximumRate:
            ratio
        }
      ];

      return skill;
    }

    if (
      statIds.length &&
      (
        source.includes('アップ') ||
        source.includes('ブースト') ||
        source.includes('エール') ||
        source.includes('コール') ||
        source.includes('サイン') ||
        source.includes('ガード') ||
        source.includes('ダウン')
      )
    ) {
      const value =
        percentFromText(
          description,
          source.includes('大幅')
            ? 0.12
            : 0.08
        );

      const stats =
        Object.fromEntries(
          statIds.map(
            (statId) => [
              statId,
              value
            ]
          )
        );

      if (
        hasEnemy &&
        source.includes('ダウン')
      ) {
        skill.type =
          'enemyStatDebuff';

        skill.target =
          'enemyAll';

        skill.stats =
          Object.fromEntries(
            statIds.map(
              (statId) => [
                statId,
                -value
              ]
            )
          );

        skill.effects = [
          {
            code:
              'CPU_TEAM_STAT_DEBUFF',

            target:
              'enemyAll',

            stats:
              skill.stats,

            durationSeconds:
              5
          }
        ];

        return skill;
      }

      skill.type =
        hasSelf
          ? 'selfStatBuff'
          : 'teamStatBuff';

      skill.target =
        hasSelf
          ? 'self'
          : 'allyAll';

      skill.stats =
        stats;

      skill.hit = 1;

      skill.effects = [
        {
          code:
            hasSelf
              ? 'CONDITIONAL_STAT_BUFF'
              : 'TEAM_STAT_BUFF',

          target:
            skill.target,

          stats,

          durationSeconds:
            5
        }
      ];

      return skill;
    }

    const countMatch =
      source.match(
        /([2345])(?:回)?\s*連(?:続|撃)/
      );

    if (countMatch) {
      const shots =
        Number(countMatch[1]);

      skill.type =
        'multiSingleDamage';

      skill.shots =
        shots;

      skill.power =
        Number(
          (
            2.8 /
            shots
          ).toFixed(2)
        );

      skill.hit =
        source.includes('低命中')
          ? 0.48
          : 0.74;

      skill.effects = [
        {
          code:
            'CPU_MULTI_DAMAGE',

          shots,

          power:
            skill.power
        }
      ];

      return skill;
    }

    if (
      source.includes('2体へ攻撃')
    ) {
      skill.type =
        'multiTargetDamage';

      skill.targets =
        2;

      skill.power =
        1.45;

      skill.effects = [
        {
          code:
            'CPU_MULTI_TARGET_DAMAGE',

          targets:
            2,

          power:
            1.45
        }
      ];

      return skill;
    }

    if (
      source.includes('敵全体') ||
      source.includes('全体へ攻撃')
    ) {
      skill.type =
        'allDamage';

      skill.target =
        'enemyAll';

      skill.power =
        1.20;

      skill.effects = [
        {
          code:
            'CPU_ALL_DAMAGE',

          power:
            1.20
        }
      ];

      return skill;
    }

    if (
      source.includes('HPが低いほど')
    ) {
      skill.type =
        'lowHpScalingDamage';

      skill.power =
        1.60;

      skill.maximumPower =
        3.20;

      skill.effects = [
        {
          code:
            'CPU_LOW_HP_SCALING_DAMAGE',

          basePower:
            1.60,

          maximumPower:
            3.20
        }
      ];

      return skill;
    }

    skill.power =
      source.includes('超高火力')
        ? 3.60
        : source.includes('高火力')
          ? 2.40
          : 1.80;

    if (
      source.includes('必中')
    ) {
      skill.hit = 1;
    }

    if (
      source.includes('CTが非常に短い')
    ) {
      skill.ct = 3.5;
    }

    skill.effects = [
      {
        code:
          'CPU_SINGLE_DAMAGE',

        power:
          skill.power
      }
    ];

    return skill;
  }

  function makePassive(
    role,
    name
  ) {
    const odd =
      hashText(name) % 2 === 0;

    if (role === 'IGL') {
      return odd
        ? {
            id:
              idFromName(
                'local_passive',
                name
              ),

            name:
              '好戦的なIGL',

            role,

            description:
              '味方全体のエイムを3％上げる。',

            effects: [
              {
                code:
                  'TEAM_STAT_BUFF',

                stats: {
                  aim: 0.03
                }
              }
            ]
          }
        : {
            id:
              idFromName(
                'local_passive',
                name
              ),

            name:
              '確実なIGL',

            role,

            description:
              '味方全体の最大HPを3％上げる。',

            effects: [
              {
                code:
                  'MAX_HP_ADD',

                target:
                  'team',

                rate:
                  0.03
              }
            ]
          };
    }

    if (role === 'ATK') {
      return odd
        ? {
            id:
              idFromName(
                'local_passive',
                name
              ),

            name:
              'ATKの底力',

            role,

            description:
              'HP50％以下の間、エイムを5％上げる。',

            effects: [
              {
                code:
                  'CONDITIONAL_STAT_BUFF',

                condition:
                  'selfHpLte',

                threshold:
                  0.50,

                stats: {
                  aim: 0.05
                }
              }
            ]
          }
        : {
            id:
              idFromName(
                'local_passive',
                name
              ),

            name:
              'ファーストファイト',

            role,

            description:
              '各MATCH最初の戦闘でエイムを5％上げる。',

            effects: [
              {
                code:
                  'START_STAT_BUFF',

                condition:
                  'firstBattleOfMatch',

                stats: {
                  aim: 0.05
                }
              }
            ]
          };
    }

    return odd
      ? {
          id:
            idFromName(
              'local_passive',
              name
            ),

          name:
            'SUPの友情',

          role:
            'SUP',

          description:
            '味方全体のマインドを3％上げる。',

          effects: [
            {
              code:
                'TEAM_STAT_BUFF',

              stats: {
                mind: 0.03
              }
            }
          ]
        }
      : {
          id:
            idFromName(
              'local_passive',
              name
            ),

          name:
            'SUPの責任感',

          role:
            'SUP',

          description:
            '味方がダウンした時、自身のHPを10％回復する。',

          effects: [
            {
              code:
                'CPU_SELF_HEAL',

              trigger:
                'allyDowned',

              rate:
                0.10
            }
          ]
        };
  }

  function makeStats(
    ranks
  ) {
    return Object.fromEntries(
      STAT_KEYS.map(
        (
          statId,
          index
        ) => [
          statId,
          ranks[index]
        ]
      )
    );
  }

  function P(
    role,
    name,
    weaponName,
    badRank,
    normalRank,
    hotRank,
    statRanks,
    skill1Name,
    skill1Description,
    skill2Name,
    skill2Description
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
        makeStats(
          statRanks
        ),

      weapon: {
        id:
          idFromName(
            'local_weapon',
            `${name}:${weaponName}`
          ),

        name:
          `${name}専用${weaponName}`,

        type:
          weaponName,

        preferredRange:
          WEAPON_RANGE[
            weaponName
          ] ||
          'mid',

        magazine:
          8
      },

      skills: [
        makeSkill(
          skill1Name,
          skill1Description,
          role
        ),

        makeSkill(
          skill2Name,
          skill2Description,
          role
        )
      ],

      specialAbilities: [
        makePassive(
          role,
          name
        )
      ],

      battleAI: {
        badRank,
        normalRank,
        hotRank
      }
    };
  }

  function teamClass(
    number
  ) {
    if (
      number === 1 ||
      number === 22
    ) {
      return 'elite';
    }

    if (
      (
        number >= 2 &&
        number <= 8
      ) ||
      number === 23
    ) {
      return 'high';
    }

    if (
      (
        number >= 9 &&
        number <= 12
      ) ||
      number === 21
    ) {
      return 'middle';
    }

    return 'lower';
  }

  function T(
    number,
    name,
    description,
    members
  ) {
    const strengthClass =
      teamClass(number);

    const normalizedMembers =
      members.map(
        (member) => {
          const ownerKey =
            `L${number}:${member.role}:${member.name}`;

          return {
            ...member,

            id:
              idFromName(
                'local_player',
                ownerKey
              ),

            weapon: {
              ...member.weapon,

              id:
                idFromName(
                  'local_weapon',
                  `${ownerKey}:${member.weapon.type}`
                )
            },

            skills:
              member.skills.map(
                (
                  skill,
                  index
                ) => ({
                  ...skill,

                  id:
                    idFromName(
                      'local_skill',
                      `${ownerKey}:${index}:${skill.name}`
                    )
                })
              ),

            specialAbilities:
              member.specialAbilities.map(
                (
                  ability,
                  index
                ) => ({
                  ...ability,

                  id:
                    idFromName(
                      'local_passive',
                      `${ownerKey}:${index}:${ability.name}`
                    )
                })
              )
          };
        }
      );

    return {
      id:
        `local_${String(number)
          .padStart(2, '0')}`,

      number,

      code:
        `L${number}`,

      name,
      description,

      teamRank:
        TEAM_CLASS_RANKS[
          strengthClass
        ],

      members:
        normalizedMembers,

      strength: {
        class:
          strengthClass,

        requiredEntry:
          REQUIRED_TEAM_NUMBERS
            .has(number)
      },

      tags: [
        'Local',
        strengthClass
      ]
    };
  }

  const LOCAL_TEAMS = [
    T(
      1,
      'プリズンハンマーズ',
      'Local最強クラス（World FINAL常連）',
      [
        P(
          'IGL',
          'モブモッチ',
          'アサルトライフル',
          'B9～A5',
          'A2～S4',
          'A8～S8',
          [
            'A4',
            'S3',
            'A3',
            'S1',
            'A6',
            'S2',
            'S4'
          ],
          'プリズンブレイカー',
          '敵全体のCTを15%増加。',
          'クールヘッド',
          '味方全体のMIND・SUPPORTを10%アップ。'
        ),

        P(
          'ATK',
          'モブテツ',
          'アサルトライフル',
          'B9～A5',
          'A4～S4',
          'S1～S8',
          [
            'S1',
            'A7',
            'S2',
            'S4',
            'A8',
            'S3',
            'A3'
          ],
          'テツの雨',
          '敵全体へ攻撃＋味方全体HP回復。',
          'フルメタルバレット',
          '単体へ超高火力攻撃。'
        ),

        P(
          'SUP',
          'モブファトメン',
          'ショットガン',
          'B9～A5',
          'A1～S3',
          'A8～S7',
          [
            'S2',
            'A9',
            'S1',
            'A3',
            'S1',
            'A7',
            'S3'
          ],
          'ファットプリズン',
          '味方全体CT25%短縮。',
          'ヘビーガード',
          '味方全体のPHYSICALアップ。'
        )
      ]
    ),

    T(
      2,
      'フシギノハナ',
      'Local上位',
      [
        P(
          'IGL',
          'モブシンリョク',
          'アサルトライフル',
          'D9～C9',
          'C9～B8',
          'B9～A4',
          [
            'B2',
            'A1',
            'C9',
            'B6',
            'B3',
            'B8',
            'A2'
          ],
          'フラワーガード',
          '味方全体のMINDアップ。',
          'リーフサポート',
          '味方全体を小回復。'
        ),

        P(
          'ATK',
          'モブカッター',
          'アサルトライフル',
          'D9～C9',
          'C8～B8',
          'B9～A4',
          [
            'B1',
            'C9',
            'B2',
            'A2',
            'B8',
            'A1',
            'C9'
          ],
          '乱れ撃ち',
          '低命中・4連続攻撃。',
          'クロスショット',
          '2体へ攻撃。'
        ),

        P(
          'SUP',
          'モブノムチ',
          'ハンドガン',
          'D9～C9',
          'C8～B8',
          'B9～A4',
          [
            'B4',
            'A2',
            'C8',
            'B2',
            'B5',
            'B8',
            'A4'
          ],
          'グリーンヒール',
          '味方全体回復。',
          'リーフアクセル',
          '味方CT短縮。'
        )
      ]
    ),

    T(
      3,
      'レッドカラミーズ',
      'Local上位',
      [
        P(
          'IGL',
          'モブハーバ',
          'アサルトライフル',
          'D9～C9',
          'C8～B9',
          'A1～A5',
          [
            'B3',
            'B8',
            'B2',
            'A2',
            'B6',
            'A1',
            'B8'
          ],
          '辛みを一振り',
          '味方全体AIMアップ。',
          'スパイスコール',
          '味方全体TECHNIQUEアップ。'
        ),

        P(
          'ATK',
          'モブネーロ',
          'リボルバー',
          'D9～C9',
          'C8～B9',
          'A1～A5',
          [
            'B3',
            'B3',
            'B7',
            'A4',
            'A1',
            'B9',
            'C8'
          ],
          'レッドショット',
          '高火力単体攻撃。',
          'バーニングリロード',
          'CT短縮＋攻撃。'
        ),

        P(
          'SUP',
          'モブトガラ',
          'ハンドガン',
          'D9～C9',
          'C8～B9',
          'A1～A5',
          [
            'B4',
            'B9',
            'B1',
            'B3',
            'B8',
            'B7',
            'A2'
          ],
          'ホットサポート',
          '味方回復。',
          'スパイスチャージ',
          '味方CT加速。'
        )
      ]
    ),

    T(
      4,
      'ジュラッシクヤベージャンズ',
      'Local上位（近距離特化）',
      [
        P(
          'IGL',
          'モブティラ',
          'ショットガン',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          [
            'A1',
            'B1',
            'A2',
            'B3',
            'B7',
            'B1',
            'B5'
          ],
          'ティラチャージ',
          '突進して攻撃。',
          'ダイノコール',
          '味方PHYSICALアップ。'
        ),

        P(
          'ATK',
          'モブサウルス',
          'ショットガン',
          'D9～C9',
          'C9～B9',
          'A1～A5',
          [
            'A2',
            'B2',
            'A4',
            'B4',
            'A1',
            'B2',
            'C9'
          ],
          'ストロングバイト',
          'CTが非常に短い高火力攻撃。',
          'ダイノラッシュ',
          '2回連続攻撃。'
        ),

        P(
          'SUP',
          'モブラプチー',
          'ショットガン',
          'D9～C9',
          'C9～B8',
          'B9～A4',
          [
            'B9',
            'B2',
            'A1',
            'B1',
            'A2',
            'B3',
            'B7'
          ],
          'ラプトルエール',
          '味方AGILITYアップ。',
          'ワイルドガード',
          '味方PHYSICALアップ。'
        )
      ]
    ),

    T(
      5,
      'エンドゾーンズ',
      'Local上位（超耐久）',
      [
        P(
          'IGL',
          'モブクォーター',
          'アサルトライフル',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          [
            'A3',
            'A1',
            'A2',
            'B8',
            'B2',
            'B5',
            'A2'
          ],
          'ハードバレット',
          '敵単体へ高火力攻撃。',
          'エンドコール',
          '味方全体のMIND・PHYSICALアップ。'
        ),

        P(
          'ATK',
          'モブランニング',
          'アサルトライフル',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          [
            'A4',
            'B7',
            'A1',
            'B8',
            'B8',
            'B4',
            'C9'
          ],
          'ロングラン',
          '自身のAGILITY・STAMINAアップ。',
          'スタミナブースト',
          '自身のSTAMINAを大幅アップ。'
        ),

        P(
          'SUP',
          'モブライン',
          'ハンドガン',
          'D9～C9',
          'C9～B9',
          'A1～A5',
          [
            'A5',
            'A1',
            'A4',
            'B2',
            'B3',
            'B5',
            'A3'
          ],
          'ラインヒール',
          '味方全体を回復。',
          'ラストディフェンス',
          '味方全体の被ダメージ軽減。'
        )
      ]
    ),

    T(
      6,
      'カイジュウランナーズ',
      'Local上位クラス 素早い展開と機動力が武器。',
      [
        P(
          'IGL',
          'モブナマズン',
          'アサルトライフル',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          [
            'A2',
            'B5',
            'B7',
            'B5',
            'A1',
            'B6',
            'B4'
          ],
          'スタミナラン',
          '味方全体のSTAMINAをアップ。',
          'モンスターラン',
          '味方全体のAGILITYをアップ。'
        ),

        P(
          'ATK',
          'モブボウボウ',
          'ショットガン',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          [
            'B8',
            'B2',
            'A2',
            'B8',
            'A3',
            'B6',
            'C9'
          ],
          'ボウボウダッシュ',
          '敵単体へ高火力攻撃。',
          'ファイアラン',
          '自身のAGILITYを大幅アップ。'
        ),

        P(
          'SUP',
          'モブスーイ',
          'ハンドガン',
          'D9～C9',
          'C8～B8',
          'B9～A4',
          [
            'B8',
            'B9',
            'B3',
            'B2',
            'A2',
            'B8',
            'A3'
          ],
          'スプラッシュヒール',
          '味方全体を回復。',
          'スピードチャージ',
          '味方全体のCTを短縮。'
        )
      ]
    ),

    T(
      7,
      'ミステリーシャンパン',
      'Local上位候補',
      [
        P(
          'IGL',
          'モブイッパイ',
          'ハンドガン',
          'D9～C9',
          'C8～B8',
          'B9～A4',
          [
            'B3',
            'A2',
            'B1',
            'B7',
            'B8',
            'A1',
            'A2'
          ],
          'シャンパンコール',
          '味方全体のTECHNIQUEアップ。',
          'ミステリーミスト',
          '敵全体のAIMをダウン。'
        ),

        P(
          'ATK',
          'モブビール',
          'リボルバー',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          [
            'B5',
            'B2',
            'B6',
            'A1',
            'A2',
            'B9',
            'C8'
          ],
          'バブルショット',
          '3連続攻撃。',
          'ハッピーアワー',
          '自身のAIM・AGILITYアップ。'
        ),

        P(
          'SUP',
          'モブショーチュー',
          'ハンドガン',
          'D9～C9',
          'C8～B8',
          'B9～A4',
          [
            'B5',
            'A1',
            'B2',
            'B4',
            'B7',
            'A2',
            'A3'
          ],
          'ハングオーバー',
          '敵全体のCTを少し増加。',
          'シャンパンヒール',
          '味方全体を回復。'
        )
      ]
    ),

    T(
      8,
      'モブストリートクルー',
      'Local上位常連 初動の速さと連携が武器。',
      [
        P(
          'IGL',
          'モブビーボーイ',
          'ショットガン',
          'D9～C9',
          'C9～B9',
          'A1～A5',
          [
            'B9',
            'A1',
            'A1',
            'B7',
            'A4',
            'A3',
            'B9'
          ],
          'ウィンドミル',
          '敵全体へダメージ。',
          'クルーコール',
          '味方全体のAGILITY・TECHNIQUEアップ。'
        ),

        P(
          'ATK',
          'モブディージェイ',
          'アサルトライフル',
          'D9～C9',
          'C9～B9',
          'A1～A5',
          [
            'B8',
            'B8',
            'B9',
            'A3',
            'A4',
            'A2',
            'B4'
          ],
          'モブパーティー',
          '味方全体を回復。',
          'ビートラッシュ',
          '敵単体へ高速4連続攻撃。'
        ),

        P(
          'SUP',
          'モブエムシー',
          'ハンドガン',
          'D9～C9',
          'C9～B9',
          'A1～A5',
          [
            'B8',
            'A2',
            'B5',
            'B8',
            'A2',
            'A1',
            'A4'
          ],
          'モブシャウト',
          '味方全体のCTを25%短縮。',
          'マイクパフォーマンス',
          '味方全体のMIND・SUPPORTアップ。'
        )
      ]
    ),

    T(
      9,
      'ミズタマポポチ',
      'Local中堅クラス',
      [
        P(
          'IGL',
          'モブブルタマ',
          'アサルトライフル',
          'E6～D8',
          'D2～C5',
          'D9～C9',
          [
            'D9',
            'C3',
            'D8',
            'C5',
            'C4',
            'C3',
            'C5'
          ],
          'ブルーバブル',
          '味方全体のMINDアップ。',
          'バブルウォール',
          '味方全体の被ダメージ軽減。'
        ),

        P(
          'ATK',
          'モブアカタマ',
          'リボルバー',
          'E6～D8',
          'D1～C4',
          'D9～C9',
          [
            'D8',
            'D5',
            'C5',
            'C3',
            'C2',
            'C3',
            'D9'
          ],
          'レッドバースト',
          '単体へ高火力攻撃。',
          'バブルショット',
          '2連続攻撃。'
        ),

        P(
          'SUP',
          'モブウスタマ',
          'ハンドガン',
          'E6～D8',
          'D2～C5',
          'D9～C9',
          [
            'D9',
            'C2',
            'D8',
            'D9',
            'C3',
            'C4',
            'C5'
          ],
          'ウォーターヒール',
          '味方全体回復。',
          'バブルチャージ',
          '味方全体CT短縮。'
        )
      ]
    ),

    T(
      10,
      'ディグダグディグクルー',
      'Local中堅クラス',
      [
        P(
          'IGL',
          'モブディグ',
          'ショットガン',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          [
            'C4',
            'C3',
            'C2',
            'D9',
            'C4',
            'C5',
            'C3'
          ],
          'ディグってディグる',
          '味方全体のダウン回復。',
          'グランドブレイク',
          '敵全体へ攻撃。'
        ),

        P(
          'ATK',
          'モブツチ',
          'ショットガン',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          [
            'C3',
            'D9',
            'C2',
            'C5',
            'C3',
            'D9',
            'D8'
          ],
          'アースクラッシュ',
          '高火力攻撃。',
          'ダブルスマッシュ',
          '2連続攻撃。'
        ),

        P(
          'SUP',
          'モブザクザク',
          'ハンドガン',
          'E6～D8',
          'D2～C5',
          'D9～C9',
          [
            'C2',
            'C2',
            'D9',
            'D9',
            'C4',
            'C4',
            'C5'
          ],
          'サンドヒール',
          '味方全体回復。',
          'ディグサポート',
          '味方全体SUPPORTアップ。'
        )
      ]
    ),

    T(
      11,
      'テーブルスイートスワット',
      'Local中堅クラス',
      [
        P(
          'IGL',
          'モブシュガ',
          'アサルトライフル',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          [
            'D9',
            'C2',
            'D9',
            'C4',
            'C4',
            'C3',
            'C5'
          ],
          'シュガーブースト',
          '味方全体AIMアップ。',
          'スイートコール',
          '味方全体MINDアップ。'
        ),

        P(
          'ATK',
          'モブミント',
          'アサルトライフル',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          [
            'D8',
            'D8',
            'C4',
            'C2',
            'C3',
            'C3',
            'D9'
          ],
          'ミントショット',
          '高速3連撃。',
          'クールバレット',
          '自身AIMアップ。'
        ),

        P(
          'SUP',
          'モブカカオ',
          'ハンドガン',
          'E6～D8',
          'D2～C5',
          'D9～C9',
          [
            'D9',
            'C3',
            'D9',
            'D9',
            'C4',
            'C4',
            'C5'
          ],
          'カカオヒール',
          '味方全体回復。',
          'ビターチャージ',
          '味方全体CT短縮。'
        )
      ]
    ),

    T(
      12,
      'ポリスサバイバーガンズ',
      'Local中堅クラス',
      [
        P(
          'IGL',
          'モブピック',
          'ハンドガン',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          [
            'C5',
            'C2',
            'D9',
            'C4',
            'C3',
            'C4',
            'C2'
          ],
          'ポリスコール',
          '味方全体MINDアップ。',
          'タクティカルサイン',
          '味方全体CT短縮。'
        ),

        P(
          'ATK',
          'モブミナモ',
          'アサルトライフル',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          [
            'C4',
            'D9',
            'C4',
            'C2',
            'C4',
            'C3',
            'D9'
          ],
          'ラピッドショット',
          '3連撃。',
          'エイムフォーカス',
          '自身AIMアップ。'
        ),

        P(
          'SUP',
          'モブコモレ',
          'ハンドガン',
          'E6～D8',
          'D2～C5',
          'D9～C9',
          [
            'C3',
            'C2',
            'D9',
            'D9',
            'C4',
            'C5',
            'C2'
          ],
          'フォレストヒール',
          '味方全体回復。',
          'リーフガード',
          '味方全体PHYSICALアップ。'
        )
      ]
    ),

    T(
      13,
      'エリートサラリーマンズ',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブシャチョー',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D5',
            'D9',
            'E8',
            'D8',
            'D5',
            'D2',
            'C2'
          ],
          'ビジネスコール',
          '味方全体SUPPORTアップ。',
          'プレゼンテーション',
          '敵全体MINDダウン。'
        ),

        P(
          'ATK',
          'モブセンム',
          'リボルバー',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D8',
            'D5',
            'D8',
            'D3',
            'D5',
            'D5',
            'E9'
          ],
          'エリートショット',
          '敵単体へ高火力攻撃。',
          'コストカット',
          '自身のCTを短縮。'
        ),

        P(
          'SUP',
          'モブジョウム',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D5',
            'D2',
            'E9',
            'D8',
            'D5',
            'D4',
            'C3'
          ],
          'オフィスヒール',
          '味方全体を回復。',
          'サポートワーク',
          '味方全体のSUPPORTアップ。'
        )
      ]
    ),

    T(
      14,
      'ハタケノヤサイ',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブダイチ',
          'アサルトライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D5',
            'D2',
            'D4',
            'D8',
            'D8',
            'D5',
            'D3'
          ],
          'グランドサポート',
          '味方全体のPHYSICALアップ。',
          'アースコール',
          '味方全体のMINDアップ。'
        ),

        P(
          'ATK',
          'モブホウサク',
          'ショットガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D4',
            'D8',
            'C2',
            'D5',
            'D8',
            'D7',
            'E9'
          ],
          'ハーベストショット',
          '単体へ高火力攻撃。',
          'パワークロップ',
          '自身のPHYSICALアップ。'
        ),

        P(
          'SUP',
          'モブミノリ',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D5',
            'D2',
            'D8',
            'E9',
            'D8',
            'D5',
            'C2'
          ],
          'ハーベストヒール',
          '味方全体回復。',
          'グリーンエール',
          '味方全体のSTAMINAアップ。'
        )
      ]
    ),

    T(
      15,
      'スリーブルー',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブアオジ',
          'スナイパーライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D7',
            'D3',
            'E9',
            'C2',
            'D6',
            'D2',
            'D3'
          ],
          'ブルーコール',
          '味方全体のAIMアップ。',
          'クールマインド',
          '味方全体のMINDアップ。'
        ),

        P(
          'ATK',
          'モブコンジョー',
          'アサルトライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'C3',
            'D5',
            'D3',
            'D3',
            'D7',
            'D8',
            'F9'
          ],
          'ガッツショット',
          '攻撃しつつ自身のAIMアップ。',
          'ラストチャレンジ',
          'HPが低いほど威力アップ。'
        ),

        P(
          'SUP',
          'モブセイラン',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D5',
            'C2',
            'D8',
            'E9',
            'D7',
            'D2',
            'C2'
          ],
          'ブルーヒール',
          '味方全体回復。',
          'ピュアサポート',
          '味方全体のTECHNIQUEアップ。'
        )
      ]
    ),

    T(
      16,
      'ミドリラバーズ',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブミドリ',
          'アサルトライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D5',
            'D3',
            'D5',
            'D8',
            'D6',
            'D5',
            'C2'
          ],
          'グリーンコール',
          '味方全体のSUPPORTアップ。',
          'フォレストガード',
          '味方全体のPHYSICALアップ。'
        ),

        P(
          'ATK',
          'モブリョク',
          'アサルトライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D5',
            'D8',
            'D4',
            'D3',
            'C2',
            'D5',
            'E9'
          ],
          'グリーンショット',
          '3連続攻撃。',
          'ネイチャーブースト',
          '自身のAGILITYアップ。'
        ),

        P(
          'SUP',
          'モブワカバ',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D5',
            'D2',
            'D9',
            'E9',
            'D6',
            'D4',
            'C2'
          ],
          'リーフヒール',
          '味方全体回復。',
          'フレッシュエール',
          '味方全体MINDアップ。'
        )
      ]
    ),

    T(
      17,
      'ピンクサバイバー',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブモモ',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D5',
            'D2',
            'D7',
            'D9',
            'D6',
            'D6',
            'D2'
          ],
          'ピンクコール',
          '味方全体のMINDアップ。',
          'サバイバルエール',
          '味方全体のSTAMINAアップ。'
        ),

        P(
          'ATK',
          'モブサクラ',
          'リボルバー',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D7',
            'D7',
            'D5',
            'D3',
            'D4',
            'D5',
            'E9'
          ],
          'サクラショット',
          '単体高火力。',
          'スプリングラッシュ',
          '2連続攻撃。'
        ),

        P(
          'SUP',
          'モブベニ',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D5',
            'D2',
            'D8',
            'E9',
            'D5',
            'D5',
            'C2'
          ],
          'ピンクヒール',
          '味方全体回復。',
          'ラブチャージ',
          '味方全体CT短縮。'
        )
      ]
    ),

    T(
      18,
      'パレットカラーズ',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブシキサイ',
          'アサルトライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D5',
            'D2',
            'D6',
            'D5',
            'D5',
            'D3',
            'C2'
          ],
          'カラーパレット',
          '味方全体のAIM・TECHNIQUEアップ。',
          'レインボーコール',
          '味方全体のMINDアップ。'
        ),

        P(
          'ATK',
          'モブニジ',
          'アサルトライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D5',
            'D8',
            'D5',
            'D2',
            'D3',
            'D5',
            'E9'
          ],
          'レインボーバースト',
          '敵全体へ攻撃。',
          'カラーチェンジ',
          '自身のAIM・AGILITYアップ。'
        ),

        P(
          'SUP',
          'モブイロドリ',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D5',
            'D2',
            'D8',
            'E9',
            'D5',
            'D4',
            'C2'
          ],
          'パレットヒール',
          '味方全体回復。',
          'カラフルエール',
          '味方全体SUPPORTアップ。'
        )
      ]
    ),

    T(
      19,
      'エブリトツゲキパワーズ',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブゲキシン',
          'ショットガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D4',
            'D8',
            'C3',
            'D8',
            'D5',
            'D8',
            'D6'
          ],
          '突撃指令',
          '味方全体のPHYSICALアップ。',
          'フルチャージ',
          '味方全体のAGILITYアップ。'
        ),

        P(
          'ATK',
          'モブトッシン',
          'ショットガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D4',
            'D9',
            'C2',
            'D7',
            'D4',
            'D9',
            'E9'
          ],
          'パワーダッシュ',
          '敵単体へ高火力攻撃。',
          'ブレイブラッシュ',
          '2連続攻撃。'
        ),

        P(
          'SUP',
          'モブシンゲキ',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D6',
            'D4',
            'D7',
            'E9',
            'D6',
            'D5',
            'C3'
          ],
          'チャージエール',
          '味方全体のCTを加速。',
          'サポートライン',
          '味方全体のPHYSICALアップ。'
        )
      ]
    ),

    T(
      20,
      'アタックシッソウランク',
      'Local下位クラス',
      [
        P(
          'IGL',
          'モブシュンソク',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D7',
            'D6',
            'D8',
            'D5',
            'C2',
            'D6',
            'D5'
          ],
          'スピードコール',
          '味方全体のAGILITYアップ。',
          'ファストムーブ',
          '味方全体のCTを少し短縮。'
        ),

        P(
          'ATK',
          'モブライソウ',
          'アサルトライフル',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D6',
            'D8',
            'D5',
            'D2',
            'C3',
            'D5',
            'E9'
          ],
          'ライトニングショット',
          '敵単体へ高火力攻撃。',
          'クイックバースト',
          '自身のAGILITY・AIMアップ。'
        ),

        P(
          'SUP',
          'モブハヤテ',
          'ハンドガン',
          'F6～D1',
          'E8～D9',
          'D5～C2',
          [
            'D6',
            'D4',
            'D8',
            'E9',
            'D4',
            'D5',
            'C2'
          ],
          'ウィンドヒール',
          '味方全体回復。',
          'スピードエール',
          '味方全体のAGILITYアップ。'
        )
      ]
    ),

    T(
      21,
      'モブバトルクラブ',
      'Local中堅クラス',
      [
        P(
          'IGL',
          'モブリバイブ',
          'アサルトライフル',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          [
            'C5',
            'C2',
            'D8',
            'C5',
            'C4',
            'C3',
            'C2'
          ],
          'リバイブコール',
          '味方全体のMINDアップ。',
          'バトルプラン',
          '味方全体のTECHNIQUEアップ。'
        ),

        P(
          'ATK',
          'モブリカバー',
          'アサルトライフル',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          [
            'C4',
            'D8',
            'C4',
            'C2',
            'C4',
            'C4',
            'D8'
          ],
          'カウンターショット',
          '敵単体へ高火力攻撃。',
          'リカバリーファイア',
          '攻撃しつつ自身を少し回復。'
        ),

        P(
          'SUP',
          'モブリスタート',
          'ハンドガン',
          'E6～D8',
          'D1～C5',
          'D9～C9',
          [
            'C4',
            'C2',
            'D8',
            'D9',
            'C4',
            'C5',
            'C2'
          ],
          'リスタート',
          '味方全体のダウンを回復。',
          'エナジーチャージ',
          '味方全体のCTを加速。'
        )
      ]
    ),

    T(
      22,
      'ミラモブスナイパーズ',
      'Local最強クラス（World FINAL 4位）',
      [
        P(
          'IGL',
          'ミラモブ',
          'スナイパーライフル',
          'B9～A5',
          'A2～S4',
          'A8～S8',
          [
            'A5',
            'S2',
            'A3',
            'S4',
            'A8',
            'S4',
            'S2'
          ],
          'ミラージュボム',
          '敵全体へ攻撃し、CTを延長。',
          'ミラージュコール',
          '味方全体のAIM・TECHNIQUEアップ。'
        ),

        P(
          'ATK',
          'モブミラーノ',
          'スナイパーライフル',
          'B9～A5',
          'A3～S4',
          'S1～S8',
          [
            'A5',
            'A8',
            'A2',
            'S4',
            'A8',
            'S3',
            'A2'
          ],
          'ミラスナイプ',
          '必中の超高火力攻撃。',
          'ロングレンジ',
          '自身のAIMアップ。'
        ),

        P(
          'SUP',
          'モブピラミドン',
          'スナイパーライフル',
          'B9～A5',
          'A2～S3',
          'A8～S7',
          [
            'A5',
            'S1',
            'A2',
            'A8',
            'A6',
            'S2',
            'S4'
          ],
          'ミラピラミッド',
          '味方全体のCTを加速。',
          'デザートヒール',
          '味方全体回復。'
        )
      ]
    ),

    T(
      23,
      'ポータルレーシング',
      'Local上位常連',
      [
        P(
          'IGL',
          'モブリバイブ',
          'アサルトライフル',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          [
            'B5',
            'A1',
            'B5',
            'B8',
            'A3',
            'A2',
            'A2'
          ],
          'ポータルコール',
          '味方全体のCTを加速。',
          'ワープサイン',
          '味方全体のAGILITYアップ。'
        ),

        P(
          'ATK',
          'モブリカバー',
          'アサルトライフル',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          [
            'B5',
            'B5',
            'B8',
            'A2',
            'A4',
            'A1',
            'C9'
          ],
          'ポータルバースト',
          '敵単体へ高火力攻撃。',
          'ハイスピードシュート',
          '自身のAGILITY・AIMアップ。'
        ),

        P(
          'SUP',
          'モブリスタート',
          'ハンドガン',
          'D9～C9',
          'C8～B9',
          'B9～A5',
          [
            'B6',
            'A2',
            'B5',
            'B8',
            'A2',
            'A2',
            'A3'
          ],
          'ポータルゲート',
          '味方全体のCTを大きく加速。',
          'エマージェンシーリカバー',
          '味方全体を回復。'
        )
      ]
    )
  ];

  if (LOCAL_TEAMS.length !== 23) {
    throw new Error(
      `Localチーム数が23ではありません: ${LOCAL_TEAMS.length}`
    );
  }

  LOCAL_TEAMS.forEach(
    (team) => {
      if (
        team.members.length !== 3
      ) {
        throw new Error(
          `${team.name}の選手数が3人ではありません。`
        );
      }

      team.members.forEach(
        (member) => {
          if (
            !ROLE_SUFFIX[
              member.role
            ]
          ) {
            throw new Error(
              `${team.name}に不明な役職があります: ${member.role}`
            );
          }
        }
      );
    }
  );

  const registration =
    CPU.registerTeams(
      'local',
      LOCAL_TEAMS,
      {
        replaceTier: true,
        source:
          'cpu-local-data.js'
      }
    );

  global.MOBBR_LOCAL_CPU_TEAMS =
    LOCAL_TEAMS;

  global.MOBBR_LOCAL_CPU_REGISTRATION =
    registration;
})(
  typeof window !== 'undefined'
    ? window
    : globalThis
);
