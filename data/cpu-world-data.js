'use strict';

/**
 * MOB BR - cpu-world-data.js
 * World 43チーム・129選手の短縮版。
 * 通常は役職別標準スキル2つ＋シールドチャージを使用。
 * 個別変更は各OVERRIDESへ追加する。
 */
(function initializeWorldCpuData(global) {
  const MOBBR = global.MOBBR = global.MOBBR || {};
  const CPU = MOBBR.API?.cpu;

  if (!CPU?.registerTeams) {
    throw new Error('cpu-world-data.jsより先にcpu-data.jsを読み込んでください。');
  }

  const STAT_KEYS = [
    'stamina', 'mind', 'physical', 'aim',
    'agility', 'technique', 'support'
  ];

  const ROLE_SLOT = { IGL: 'B', ATK: 'A', SUP: 'C' };

  const WEAPON_RANGE = {
    'ショットガン': 'close',
    'ハンドガン': 'mid',
    'リボルバー': 'mid',
    'アサルトライフル': 'mid',
    'スナイパーライフル': 'far',
    'マシンガン': 'mid'
  };

  const WORLD_RULES = Object.freeze({
    registeredCpuTeams: 43,
    tournamentTeams: 40,
    nationalQualifierSlots: 10,
    nativeWorldSlots: 30,

    groups: ['A', 'B', 'C', 'D'],
    teamsPerGroup: 10,
    playerGroup: 'A',

    preliminaryWeeks: 2,
    preliminaryDirectFinalists: 10,
    preliminaryEliminatedFrom: 31,

    lastChance: {
      sourcePlacementMin: 11,
      sourcePlacementMax: 30,
      teams: 20,
      matches: 3,
      advance: 10
    },

    final: {
      teams: 20,
      format: 'matchPoint',
      threshold: 50,
      championRequiresEligibilityBeforeMatch: true
    },

    specialEntry: {
      fromYear: 5,
      alwaysTeamIds: [
        'world_42',
        'world_43'
      ]
    },

    championship: {
      firstYear: 1991,
      everyYears: 3,
      worldFinalsUsed: 6,
      teams: 20,
      format: 'matchPoint',
      threshold: 50,

      pointsByWorldFinalPlacement: {
        1: 15,
        2: 8,
        3: 5,
        4: 4,
        5: 3,
        6: 1,
        7: 1,
        8: 1,
        9: 1,
        10: 1
      }
    },

    dedicatedSkillsPerPlayer: 2,
    commonSkillAddedByCpuData: 1,
    ultimateEnabled: false,
    weaponMagazine: 8
  });

  /*
   * team:
   * 通常最小、通常最大、好調最小、好調最大
   *
   * role:
   * 不調最小、不調最大、
   * 通常最小、通常最大、
   * 好調最小、好調最大
   */
  const BANDS = {
    king: {
      team: [
        'B5',
        'A3',
        'A3',
        'A9'
      ],

      stat: [
        'S2',
        'S8'
      ],

      power: 6,

      role: {
        IGL: [
          'B4',
          'A1',
          'B6',
          'A2',
          'A4',
          'A9'
        ],

        ATK: [
          'B3',
          'A2',
          'B4',
          'A4',
          'A3',
          'S1'
        ],

        SUP: [
          'B4',
          'A1',
          'B5',
          'A2',
          'A2',
          'A8'
        ]
      }
    },

    top: {
      team: [
        'B8',
        'A8',
        'A5',
        'S4'
      ],

      stat: [
        'A8',
        'S4'
      ],

      power: 5,

      role: {
        IGL: [
          'B3',
          'A3',
          'B9',
          'A7',
          'A6',
          'S2'
        ],

        ATK: [
          'B2',
          'A4',
          'B7',
          'A9',
          'A5',
          'S3'
        ],

        SUP: [
          'B3',
          'A2',
          'B8',
          'A6',
          'A4',
          'S1'
        ]
      }
    },

    elite: {
      team: [
        'B4',
        'A4',
        'B9',
        'A9'
      ],

      stat: [
        'A2',
        'A8'
      ],

      power: 4,

      role: {
        IGL: [
          'C8',
          'B8',
          'B5',
          'A3',
          'A2',
          'A8'
        ],

        ATK: [
          'C7',
          'B9',
          'B3',
          'A5',
          'A1',
          'A9'
        ],

        SUP: [
          'C8',
          'B7',
          'B4',
          'A2',
          'B9',
          'A7'
        ]
      }
    },

    high: {
      team: [
        'C9',
        'B9',
        'B5',
        'A5'
      ],

      stat: [
        'B8',
        'A4'
      ],

      power: 3,

      role: {
        IGL: [
          'D9',
          'C9',
          'C9',
          'B9',
          'B8',
          'A5'
        ],

        ATK: [
          'D8',
          'B1',
          'C7',
          'A1',
          'B7',
          'A7'
        ],

        SUP: [
          'D9',
          'C8',
          'C8',
          'B8',
          'B6',
          'A4'
        ]
      }
    },

    standard: {
      team: [
        'C5',
        'B5',
        'C9',
        'B9'
      ],

      stat: [
        'B3',
        'A1'
      ],

      power: 2,

      role: {
        IGL: [
          'D5',
          'C5',
          'C5',
          'B5',
          'C9',
          'A1'
        ],

        ATK: [
          'D4',
          'C7',
          'C3',
          'B7',
          'C8',
          'A3'
        ],

        SUP: [
          'D5',
          'C4',
          'C4',
          'B4',
          'C7',
          'B9'
        ]
      }
    }
  };

  const ROLE_OFFSETS = {
    IGL: {
      stamina: 0,
      mind: 4,
      physical: -2,
      aim: 1,
      agility: 0,
      technique: 3,
      support: 2
    },

    ATK: {
      stamina: 0,
      mind: -1,
      physical: 4,
      aim: 4,
      agility: 2,
      technique: 2,
      support: -3
    },

    SUP: {
      stamina: 1,
      mind: 3,
      physical: -3,
      aim: -1,
      agility: 0,
      technique: 2,
      support: 5
    }
  };

  const STYLES = {
    balanced: {
      description:
        '攻守のバランスと安定した連携を武器とする。',

      stats: {},

      weapons: {
        IGL: 'アサルトライフル',
        ATK: 'アサルトライフル',
        SUP: 'ハンドガン'
      }
    },

    technical: {
      description:
        '高い技術と状況判断で戦闘を組み立てる。',

      stats: {
        technique: 3,
        mind: 2
      },

      weapons: {
        IGL: 'アサルトライフル',
        ATK: 'リボルバー',
        SUP: 'ハンドガン'
      }
    },

    control: {
      description:
        '敵の流れを読み、戦闘の主導権を握る。',

      stats: {
        mind: 3,
        technique: 2
      },

      weapons: {
        IGL: 'アサルトライフル',
        ATK: 'リボルバー',
        SUP: 'ハンドガン'
      }
    },

    assault: {
      description:
        '強力な接近戦と一気の攻めを得意とする。',

      stats: {
        physical: 3,
        aim: 2
      },

      weapons: {
        IGL: 'アサルトライフル',
        ATK: 'ショットガン',
        SUP: 'ハンドガン'
      }
    },

    sniper: {
      description:
        '遠距離からの高精度射撃で戦場を支配する。',

      stats: {
        aim: 4,
        technique: 2
      },

      weapons: {
        IGL: 'スナイパーライフル',
        ATK: 'スナイパーライフル',
        SUP: 'ハンドガン'
      }
    },

    support: {
      description:
        '回復と味方強化を軸に長期戦を狙う。',

      stats: {
        support: 4,
        mind: 2
      },

      weapons: {
        IGL: 'ハンドガン',
        ATK: 'アサルトライフル',
        SUP: 'ハンドガン'
      }
    },

    speed: {
      description:
        '高い機動力と素早いスキル回転で翻弄する。',

      stats: {
        agility: 4,
        technique: 2
      },

      weapons: {
        IGL: 'ハンドガン',
        ATK: 'マシンガン',
        SUP: 'ハンドガン'
      }
    },

    survival: {
      description:
        '耐久と立て直し能力で終盤まで生き残る。',

      stats: {
        stamina: 4,
        support: 2
      },

      weapons: {
        IGL: 'アサルトライフル',
        ATK: 'アサルトライフル',
        SUP: 'ハンドガン'
      }
    },

    guard: {
      description:
        '高い耐久力と防衛判断を武器とする。',

      stats: {
        stamina: 4,
        physical: 3
      },

      weapons: {
        IGL: 'ショットガン',
        ATK: 'ショットガン',
        SUP: 'ハンドガン'
      }
    },

    burst: {
      description:
        '重い火力と集中攻撃で正面戦闘を押し切る。',

      stats: {
        physical: 4,
        aim: 3
      },

      weapons: {
        IGL: 'マシンガン',
        ATK: 'マシンガン',
        SUP: 'マシンガン'
      }
    }
  };

  const ROSTER_ROWS = [
    [
      1,
      'ゴールデンテンペスト',
      'king',
      'balanced',
      'モブミリー',
      'モブトール',
      'モブオマー',
      '世界最強のチーム。'
    ],

    [
      2,
      'タロアートファッション',
      'high',
      'technical',
      'モブポヨ',
      'モブターロ',
      'モブチャモロ',
      '独創的な戦術と個人技を融合する世界チーム。'
    ],

    [
      3,
      'シャドウキングダム',
      'top',
      'control',
      'モブアサモブ',
      'モブヴァン',
      'モブテラー',
      '闇から主導権を奪う世界トップクラスのチーム。'
    ],

    [
      4,
      'アリスカンパニー',
      'top',
      'control',
      'モブクイン',
      'モブジョーカー',
      'モブキング',
      '変則的な判断と完成度の高い連携を武器とする。'
    ],

    [
      5,
      'アサシンコート',
      'top',
      'assault',
      'モブサイレント',
      'モブタゲ',
      'モブガンド',
      '静かな接近から一気に戦闘を終わらせる。'
    ],

    [
      6,
      'ネコクーバレット',
      'elite',
      'sniper',
      'モブネコクー',
      'モブククリ',
      'モブテイル',
      '遠距離の精度と素早い射線変更に優れる。'
    ],

    [
      7,
      'シャーロックターゲット',
      'elite',
      'control',
      'モブホームズ',
      'モブワトソン',
      'モブアーティー',
      '敵の行動を読み、最適な交戦を選び続ける。'
    ],

    [
      8,
      'ヨミカケノホン',
      'elite',
      'technical',
      'モブブラック',
      'モブレッド',
      'モブイエロー',
      '多彩な特殊効果と状況対応力を持つ。'
    ],

    [
      9,
      'ケロノイショウ',
      'elite',
      'support',
      'モブミトケロ',
      'モブグリケロ',
      'モブサポケロ',
      '回復と継続戦闘を得意とする安定型チーム。'
    ],

    [
      10,
      'ラビットスキルボム',
      'elite',
      'speed',
      'モブビッツ',
      'モブステッピン',
      'モブジャンピン',
      '高い機動力と連続スキルで相手を翻弄する。'
    ],

    [
      11,
      'モブメジャーズ',
      'elite',
      'balanced',
      'モブジャイロ',
      'モブワイヤー',
      'モブルタ',
      '世界基準の基礎性能を持つバランスチーム。'
    ],

    [
      12,
      'マスターオブテクニック',
      'elite',
      'technical',
      'モブハドウ',
      'モブカメハ',
      'モブドドパ',
      '高いテクニックとスキル回転で戦闘を組み立てる。'
    ],

    [
      13,
      'レトロシアター',
      'elite',
      'technical',
      'モブドワーフ',
      'モブサッケ',
      'モブディア',
      '独自のテンポと連携で主導権を握る。'
    ],

    [
      14,
      'コミックヒッターズ',
      'high',
      'technical',
      'モブペン',
      'モブインク',
      'モブトーン',
      '技術と演出力を兼ね備えた攻撃的チーム。'
    ],

    [
      15,
      'ライフナイフクルー',
      'high',
      'survival',
      'モブライフ',
      'モブブレイド',
      'モブシース',
      '耐久と鋭い反撃を両立する。'
    ],

    [
      16,
      'ウルフスノーマン',
      'high',
      'guard',
      'モブウルフ',
      'モブブリザ',
      'モブスノウ',
      '高い耐久力と冷静な防衛判断を持つ。'
    ],

    [
      17,
      'スナノクニ',
      'high',
      'sniper',
      'モブファラオ',
      'モブスフィン',
      'モブオアシス',
      '遠距離制圧と継戦能力に優れる。'
    ],

    [
      18,
      'グラスオリジン',
      'high',
      'technical',
      'モブグラス',
      'モブクリア',
      'モブプリズム',
      '透明感のある連携と精密な技術を武器とする。'
    ],

    [
      19,
      'ワールドアトリエ',
      'high',
      'technical',
      'モブモロシャ',
      'モブアミレ',
      'モブピンカ',
      '柔軟な戦術を試合ごとに描き替える。'
    ],

    [
      20,
      'ヘビィマシンガンズ',
      'high',
      'burst',
      'モブシャボム',
      'モブインバス',
      'モブレージ',
      '圧倒的な制圧射撃で正面戦闘を押し切る。'
    ],

    [
      21,
      'ニューパイレーツ',
      'high',
      'assault',
      'モブベアー',
      'モブティーロ',
      'モブバッサ',
      '大胆な侵攻と素早い奪取を得意とする。'
    ],

    [
      22,
      'ダークミュージック',
      'high',
      'control',
      'モブスク',
      'モブラッチ',
      'モブラババ',
      '独特なリズムで敵の戦闘テンポを崩す。'
    ],

    [
      23,
      'レーザーデストロイ',
      'high',
      'burst',
      'モブヒッツメン',
      'モブタクティン',
      'モブディフェル',
      '高精度の集中攻撃で防衛線を破壊する。'
    ],

    [
      24,
      'ボーンクリエイターズ',
      'high',
      'guard',
      'モブウィッシュ',
      'モブショル',
      'モブハクリ',
      '堅牢な陣形と再構築能力で粘り強く戦う。'
    ],

    [
      25,
      'ストリートダッシュ',
      'high',
      'speed',
      'モブロード',
      'モブスプリント',
      'モブステップ',
      '高速移動と素早い接敵・離脱を繰り返す。'
    ],

    [
      26,
      'オンミツサーカス',
      'high',
      'speed',
      'モブセレモ',
      'モブポンプ',
      'モブトーク',
      '変則移動と奇襲で敵の視線を分散させる。'
    ],

    [
      27,
      'デンデンオリジナル',
      'standard',
      'balanced',
      'モブデンブー',
      'モブデンロック',
      'モブデンファット',
      '安定した基礎性能と堅実な連携を持つ。'
    ],

    [
      28,
      'プニプニパーティー',
      'standard',
      'support',
      'モブプニグリ',
      'モブプニパー',
      'モブプニオレ',
      '回復と味方強化を軸に長期戦を狙う。'
    ],

    [
      29,
      'マジックショータイム',
      'standard',
      'technical',
      'モブパンド',
      'モブカード',
      'モブカット',
      '多彩なスキルで戦況を変化させる。'
    ],

    [
      30,
      'リスタートワールズ',
      'standard',
      'survival',
      'モブクエ',
      'モブダクピー',
      'モブジャーミン',
      '立て直し能力が高く、終盤まで生き残る。'
    ],

    [
      31,
      'ゴーレムロボブラスターズ',
      'standard',
      'guard',
      'モブターミ',
      'モブシュワ',
      'モブタイゴン',
      '高い耐久力と重火力を備える。'
    ],

    [
      32,
      'ユウシャノケイフ',
      'standard',
      'balanced',
      'モブユウシャ',
      'モブシソン',
      'モブセンゾ',
      '正統派の攻守とチームワークで戦う。'
    ],

    [
      33,
      'テクノロジーソルジャーズ',
      'standard',
      'sniper',
      'モブスコープ',
      'モブベアブ',
      'モブランボル',
      '精密機器と遠距離射撃を活用する。'
    ],

    [
      34,
      'マウスオブトップ',
      'standard',
      'speed',
      'モブマイキー',
      'モブリンキー',
      'モブロッキー',
      '小回りの利く高速戦闘を得意とする。'
    ],

    [
      35,
      'ヤミネコクリティカル',
      'standard',
      'sniper',
      'モブレール',
      'モブキャリー',
      'モブドリフ',
      '暗所から高精度の一撃を狙う。'
    ],

    [
      36,
      'スタイリッシュエージェント',
      'standard',
      'technical',
      'モブカウボ',
      'モブリュク',
      'モブコスコ',
      '洗練された動きと精密な連携を持つ。'
    ],

    [
      37,
      'コスモキャットロード',
      'standard',
      'technical',
      'モブムク',
      'モブヴァル',
      'モブスタチュ',
      '宇宙的な変則戦術で敵を揺さぶる。'
    ],

    [
      38,
      'ブラックホールズ',
      'standard',
      'control',
      'モブサクル',
      'モブエンド',
      'モブサイン',
      '吸い込むような包囲と妨害を得意とする。'
    ],

    [
      39,
      'ワンミニッツスプライト',
      'high',
      'speed',
      'モブミニット',
      'モブセカンド',
      'モブスプラ',
      '短時間で戦況を変える高速チーム。'
    ],

    [
      40,
      'ナチュラルエイマーズ',
      'high',
      'sniper',
      'モブナチュラ',
      'モブサイト',
      'モブフォーカス',
      '自然な照準能力と安定した射撃精度を持つ。'
    ],

    [
      41,
      'クリスマススリーサンタ',
      'high',
      'support',
      'モブアカサンタ',
      'モブピンクサンタ',
      'モブブルーサンタ',
      '回復・支援・連携を高水準で備える特別チーム。'
    ],

    [
      42,
      'モブアーティストレジェンド',
      'top',
      'technical',
      'モブシュガペロ',
      'モブカカオ',
      'モブビスケット',
      '5年目から毎回Worldへ参戦する特別チーム。',

      {
        type: 'fromYear',
        year: 5,
        always: true
      }
    ],

    [
      43,
      'モブアーティストクリエイト',
      'top',
      'technical',
      'モブバター',
      'モブミルキー',
      'モブマーブル',
      '5年目から毎回Worldへ参戦する特別チーム。',

      {
        type: 'fromYear',
        year: 5,
        always: true
      }
    ]
  ];

  /* =========================================================
     編集エリア

     TEAM_OVERRIDES.W1:
       strengthClass
       style
       description
       teamRank
       entryRule

     PLAYER_OVERRIDES.W1B:
       description
       rank
       stats
       weapon

     W1B = IGL
     W1A = ATK
     W1C = SUP
  ========================================================= */

  const TEAM_OVERRIDES = {};

  const PLAYER_OVERRIDES = {
    W1B: {
      description:
        '抜群の安定感で常に好調を保つ世界最高峰のIGL。'
    },

    W1A: {
      description:
        '不安定でも高い性能を誇り、調子のいい時は誰にも止められない。'
    },

    W1C: {
      description:
        'サポーターでありながら世界トップクラスの火力と冷静なマインドを武器とする。'
    }
  };

  /*
   * CPU.skillで2つ指定。
   * 未指定なら役職別標準スキル。
   */
  const CUSTOM_SKILLS = {};

  /*
   * CPU.passiveで指定。
   * 未指定なら役職別標準特殊能力。
   */
  const CUSTOM_PASSIVES = {};

  /*
   * rarity
   * description
   * packId
   */
  const CARD_OVERRIDES = {};
  const BADGE_OVERRIDES = {};

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    if (
      typeof structuredClone ===
      'function'
    ) {
      return structuredClone(value);
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }

  function hash(value) {
    let result = 2166136261;

    for (
      const character of
      String(value || '')
    ) {
      result ^=
        character.charCodeAt(0);

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

  function shiftRank(
    rank,
    amount = 0
  ) {
    return CPU.ordinalToRank(
      CPU.rankToOrdinal(rank) +
      Math.floor(
        Number(amount) || 0
      )
    );
  }

  function range(
    min,
    max,
    amount = 0
  ) {
    return (
      `${shiftRank(min, amount)}～` +
      `${shiftRank(max, amount)}`
    );
  }

  function roleRank(values) {
    return {
      bad:
        range(
          values[0],
          values[1]
        ),

      normal:
        range(
          values[2],
          values[3]
        ),

      hot:
        range(
          values[4],
          values[5]
        )
    };
  }

  function cardPack(number) {
    if (
      (
        number >= 1 &&
        number <= 5
      ) ||
      (
        number >= 11 &&
        number <= 15
      )
    ) {
      return 'vol6';
    }

    if (
      (
        number >= 6 &&
        number <= 10
      ) ||
      (
        number >= 16 &&
        number <= 26
      )
    ) {
      return 'vol7';
    }

    if (
      number >= 27 &&
      number <= 41
    ) {
      return 'vol8';
    }

    return '';
  }

  function makeStats(
    number,
    role,
    name,
    styleId,
    band
  ) {
    const style =
      STYLES[styleId];

    return Object.fromEntries(
      STAT_KEYS.map(
        (
          statId,
          index
        ) => {
          const noise =
            (
              hash(
                (
                  `${number}:` +
                  `${role}:` +
                  `${name}:` +
                  `${statId}:` +
                  `${index}`
                )
              ) %
              3
            ) -
            1;

          const offset =
            (
              ROLE_OFFSETS[
                role
              ][
                statId
              ] ||
              0
            ) +
            (
              style.stats[
                statId
              ] ||
              0
            ) +
            noise;

          return [
            statId,

            {
              normal:
                shiftRank(
                  band.stat[0],
                  offset
                ),

              hot:
                shiftRank(
                  band.stat[1],
                  offset
                )
            }
          ];
        }
      )
    );
  }

  function makeWeapon(
    number,
    role,
    name,
    styleId,
    band
  ) {
    const type =
      STYLES[
        styleId
      ]
        .weapons[
          role
        ];

    const preferredRange =
      WEAPON_RANGE[
        type
      ] ||
      'mid';

    const base =
      42 +
      (
        band.power *
        8
      );

    return {
      id:
        makeId(
          'world_weapon',

          (
            `${number}:` +
            `${role}:` +
            `${name}`
          )
        ),

      name:
        `${name}専用${type}`,

      type,
      preferredRange,

      magazine:
        WORLD_RULES
          .weaponMagazine,

      attack:
        base +
        (
          role === 'ATK'
            ? 8
            : 0
        ) +
        (
          type ===
          'ショットガン'
            ? 3
            : 0
        ),

      accuracy:
        base +
        (
          role === 'IGL'
            ? 6
            : 0
        ) +
        (
          type ===
          'スナイパーライフル'
            ? 4
            : 0
        ),

      speed:
        base +
        (
          styleId === 'speed'
            ? 8
            : 0
        ),

      performance: {
        close:
          shiftRank(
            band.stat[0],

            preferredRange ===
            'close'
              ? 4
              : -1
          ),

        mid:
          shiftRank(
            band.stat[0],

            preferredRange ===
            'mid'
              ? 4
              : 0
          ),

        far:
          shiftRank(
            band.stat[0],

            preferredRange ===
            'far'
              ? 4
              : -2
          ),

        rapid:
          shiftRank(
            band.stat[0],

            (
              styleId ===
              'speed'
            ) ||
            (
              type ===
              'マシンガン'
            )
              ? 4
              : 0
          ),

        reload:
          shiftRank(
            band.stat[0],

            role === 'SUP'
              ? 3
              : 0
          )
      }
    };
  }

  function makeCard(
    number,
    role,
    name
  ) {
    return {
      id:
        (
          'world_card_' +
          String(number)
            .padStart(
              2,
              '0'
            ) +
          '_' +
          role.toLowerCase()
        ),

      sourceType:
        'cpuPlayer',

      sourceTeamId:
        (
          'world_' +
          String(number)
            .padStart(
              2,
              '0'
            )
        ),

      sourceRole:
        role,

      name,

      rarity:
        '',

      description:
        '',

      packId:
        cardPack(number),

      duplicateMaximumPlus:
        9,

      duplicateOverflowReward: {
        coin:
          10000,

        diamond:
          1
      }
    };
  }

  function makeBadge(
    number,
    name
  ) {
    return {
      id:
        (
          'world_badge_' +
          String(number)
            .padStart(
              2,
              '0'
            )
        ),

      sourceType:
        'cpuTeam',

      sourceTeamId:
        (
          'world_' +
          String(number)
            .padStart(
              2,
              '0'
            )
        ),

      name:
        `${name}バッジ`,

      rarity:
        '',

      description:
        `${name}のWorldバッジ。`,

      packId:
        'wb',

      duplicateMaximumPlus:
        9,

      duplicateOverflowReward: {
        coin:
          10000,

        diamond:
          1
      }
    };
  }

  function mergePlayer(
    base,
    override = {}
  ) {
    const stats =
      typeof override.stats ===
      'string'
        ? override.stats
            .trim()
            .split(
              /[\s,]+/
            )
        : clone(
            override.stats
          );

    return {
      ...base,
      ...clone(override),

      rank: {
        ...base.rank,
        ...clone(
          override.rank ||
          {}
        )
      },

      stats:
        override.stats ===
        undefined
          ? base.stats
          : stats,

      weapon: {
        ...base.weapon,

        ...clone(
          override.weapon ||
          {}
        ),

        performance: {
          ...base
            .weapon
            .performance,

          ...clone(
            override
              .weapon
              ?.performance ||
            {}
          )
        }
      },

      battleAI: {
        ...base.battleAI,

        ...clone(
          override.battleAI ||
          {}
        )
      }
    };
  }

  function makePlayer(
    number,
    role,
    name,
    styleId,
    band
  ) {
    const code =
      `W${number}${ROLE_SLOT[role]}`;

    const rank =
      roleRank(
        band.role[
          role
        ]
      );

    const player =
      mergePlayer(
        {
          code,
          role,
          name,

          description:
            '',

          rank,

          stats:
            makeStats(
              number,
              role,
              name,
              styleId,
              band
            ),

          weapon:
            makeWeapon(
              number,
              role,
              name,
              styleId,
              band
            ),

          battleAI: {
            badRank:
              rank.bad,

            normalRank:
              rank.normal,

            hotRank:
              rank.hot,

            preferredStyle:
              styleId,

            ultimateEnabled:
              false
          },

          card: {
            ...makeCard(
              number,
              role,
              name
            ),

            ...clone(
              CARD_OVERRIDES[
                code
              ] ||
              {}
            )
          },

          tags: [
            'World',
            role,
            styleId
          ]
        },

        PLAYER_OVERRIDES[
          code
        ]
      );

    if (
      CUSTOM_SKILLS[
        code
      ]
    ) {
      player.skills =
        clone(
          CUSTOM_SKILLS[
            code
          ]
        );
    }

    if (
      CUSTOM_PASSIVES[
        code
      ]
    ) {
      player.passive =
        clone(
          CUSTOM_PASSIVES[
            code
          ]
        );
    }

    player.battleAI = {
      ...player.battleAI,

      badRank:
        player.rank.bad,

      normalRank:
        player.rank.normal,

      hotRank:
        player.rank.hot,

      ultimateEnabled:
        false
    };

    return player;
  }

  function makeTeam(row) {
    const [
      number,
      sourceName,
      sourceClass,
      sourceStyle,
      iglName,
      atkName,
      supName,
      sourceDescription,
      sourceEntryRule = null
    ] = row;

    const code =
      `W${number}`;

    const override =
      TEAM_OVERRIDES[
        code
      ] ||
      {};

    const name =
      override.name ||
      sourceName;

    const strengthClass =
      override.strengthClass ||
      sourceClass;

    const styleId =
      override.style ||
      sourceStyle;

    const band =
      BANDS[
        strengthClass
      ];

    const style =
      STYLES[
        styleId
      ];

    if (!band) {
      throw new Error(
        (
          `${code}の` +
          'strengthClassが不正です: ' +
          strengthClass
        )
      );
    }

    if (!style) {
      throw new Error(
        (
          `${code}の` +
          'styleが不正です: ' +
          styleId
        )
      );
    }

    return {
      id:
        (
          'world_' +
          String(number)
            .padStart(
              2,
              '0'
            )
        ),

      code,
      number,
      name,

      description:
        override.description ||
        sourceDescription ||
        style.description,

      teamRank: {
        bad:
          override
            .teamRank
            ?.bad ||
          range(
            band.team[0],
            band.team[1],
            -4
          ),

        normal:
          override
            .teamRank
            ?.normal ||
          range(
            band.team[0],
            band.team[1]
          ),

        hot:
          override
            .teamRank
            ?.hot ||
          range(
            band.team[2],
            band.team[3]
          )
      },

      members: [
        makePlayer(
          number,
          'IGL',
          iglName,
          styleId,
          band
        ),

        makePlayer(
          number,
          'ATK',
          atkName,
          styleId,
          band
        ),

        makePlayer(
          number,
          'SUP',
          supName,
          styleId,
          band
        )
      ],

      strength: {
        class:
          strengthClass,

        style:
          styleId,

        nativeWorldTeam:
          true,

        ...clone(
          override.strength ||
          {}
        )
      },

      entryRule:
        override.entryRule ===
        undefined
          ? clone(
              sourceEntryRule
            )
          : clone(
              override.entryRule
            ),

      mandatory:
        Boolean(
          override.mandatory
        ),

      badge: {
        ...makeBadge(
          number,
          name
        ),

        ...clone(
          BADGE_OVERRIDES[
            code
          ] ||
          {}
        ),

        ...clone(
          override.badge ||
          {}
        )
      },

      tags: [
        'World',
        strengthClass,
        styleId,

        ...(
          override.tags ||
          []
        )
      ]
    };
  }

  const WORLD_TEAMS =
    ROSTER_ROWS.map(
      makeTeam
    );

  function validateWorldTeams() {
    const errors =
      [];

    const teamIds =
      new Set();

    const playerCodes =
      new Set();

    if (
      WORLD_TEAMS.length !==
      WORLD_RULES
        .registeredCpuTeams
    ) {
      errors.push(
        (
          'Worldチーム数が43ではありません: ' +
          WORLD_TEAMS.length
        )
      );
    }

    for (
      const team of
      WORLD_TEAMS
    ) {
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

      for (
        const role of
        [
          'IGL',
          'ATK',
          'SUP'
        ]
      ) {
        if (
          !roles.has(role)
        ) {
          errors.push(
            `${team.name}に${role}がいません。`
          );
        }
      }

      for (
        const member of
        team.members
      ) {
        if (
          playerCodes.has(
            member.code
          )
        ) {
          errors.push(
            `選手コード重複: ${member.code}`
          );
        }

        playerCodes.add(
          member.code
        );

        if (
          member.skills
            ?.length >
          2
        ) {
          errors.push(
            (
              `${team.name}/` +
              `${member.name}` +
              'の固有スキルが2つを超えています。'
            )
          );
        }
      }
    }

    return {
      valid:
        errors.length ===
        0,

      errors,

      counts: {
        teams:
          WORLD_TEAMS.length,

        players:
          playerCodes.size,

        customSkills:
          WORLD_TEAMS.reduce(
            (
              total,
              team
            ) =>
              total +
              team.members.reduce(
                (
                  sum,
                  member
                ) =>
                  sum +
                  (
                    member
                      .skills
                      ?.length ||
                    0
                  ),

                0
              ),

            0
          )
      }
    };
  }

  const sourceValidation =
    validateWorldTeams();

  if (
    !sourceValidation.valid
  ) {
    throw new Error(
      sourceValidation
        .errors
        .join('\n')
    );
  }

  if (
    MOBBR.DATA.cpu
      ?.expectedTeamCounts
  ) {
    MOBBR.DATA.cpu
      .expectedTeamCounts
      .world =
      WORLD_RULES
        .registeredCpuTeams;
  }

  const registration =
    CPU.registerTeams(
      'world',
      WORLD_TEAMS,

      {
        replaceTier:
          true,

        source:
          'cpu-world-data.js'
      }
    );

  const validation =
    CPU.validate(
      'world'
    );

  if (
    !validation.valid
  ) {
    throw new Error(
      validation
        .reports
        .flatMap(
          (report) =>
            report.errors
        )
        .join('\n')
    );
  }

  function getWorldTeams() {
    return CPU.getTeams(
      'world'
    );
  }

  function getWorldTeam(value) {
    const source =
      String(
        value ??
        ''
      ).trim();

    const number =
      Number(source);

    const team =
      WORLD_TEAMS.find(
        (entry) =>
          entry.id ===
            source ||
          entry.code ===
            source.toUpperCase() ||
          entry.number ===
            number
      );

    return team
      ? clone(team)
      : null;
  }

  function shuffle(
    source,
    random = Math.random
  ) {
    const result =
      [...source];

    for (
      let index =
        result.length -
        1;

      index > 0;

      index -= 1
    ) {
      const next =
        Math.floor(
          Math.max(
            0,

            Math.min(
              0.999999999,

              Number(
                random()
              ) ||
              0
            )
          ) *
          (
            index +
            1
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

  function selectWorldField({
    year = 1,
    count =
      WORLD_RULES
        .tournamentTeams,
    excludeTeamIds = [],
    random = Math.random
  } = {}) {
    const excluded =
      new Set(
        excludeTeamIds
      );

    const eligible =
      WORLD_TEAMS.filter(
        (team) => {
          if (
            excluded.has(
              team.id
            )
          ) {
            return false;
          }

          if (
            team.entryRule
              ?.type ===
            'fromYear'
          ) {
            return (
              Number(year) >=
              Number(
                team
                  .entryRule
                  .year
              )
            );
          }

          return true;
        }
      );

    const fixedIds =
      Number(year) >=
      WORLD_RULES
        .specialEntry
        .fromYear
        ? new Set(
            WORLD_RULES
              .specialEntry
              .alwaysTeamIds
          )
        : new Set();

    const fixed =
      eligible.filter(
        (team) =>
          team.mandatory ||
          fixedIds.has(
            team.id
          )
      );

    const fixedSet =
      new Set(
        fixed.map(
          (team) =>
            team.id
        )
      );

    const pool =
      shuffle(
        eligible.filter(
          (team) =>
            !fixedSet.has(
              team.id
            )
        ),

        random
      );

    return [
      ...fixed,
      ...pool
    ]
      .slice(
        0,

        Math.max(
          0,

          Math.min(
            count,
            eligible.length
          )
        )
      )
      .map(
        clone
      );
  }

  function getLastChanceTeams(
    standings
  ) {
    return [
      ...(
        standings ||
        []
      )
    ]
      .sort(
        (
          left,
          right
        ) =>
          Number(
            left.placement
          ) -
          Number(
            right.placement
          )
      )
      .filter(
        (entry) =>
          Number(
            entry.placement
          ) >=
            WORLD_RULES
              .lastChance
              .sourcePlacementMin &&
          Number(
            entry.placement
          ) <=
            WORLD_RULES
              .lastChance
              .sourcePlacementMax
      )
      .map(
        clone
      );
  }

  function getLastChanceAdvancers(
    standings
  ) {
    return [
      ...(
        standings ||
        []
      )
    ]
      .sort(
        (
          left,
          right
        ) =>
          Number(
            left.placement
          ) -
          Number(
            right.placement
          )
      )
      .slice(
        0,

        WORLD_RULES
          .lastChance
          .advance
      )
      .map(
        clone
      );
  }

  function createWorldFinalField({
    preliminaryStandings,
    lastChanceStandings
  } = {}) {
    const direct =
      [
        ...(
          preliminaryStandings ||
          []
        )
      ]
        .sort(
          (
            left,
            right
          ) =>
            Number(
              left.placement
            ) -
            Number(
              right.placement
            )
        )
        .slice(
          0,

          WORLD_RULES
            .preliminaryDirectFinalists
        );

    return [
      ...direct,

      ...getLastChanceAdvancers(
        lastChanceStandings
      )
    ].map(
      clone
    );
  }

  function getMatchPointEligibleIds(
    totals
  ) {
    return Object
      .entries(
        totals ||
        {}
      )
      .filter(
        ([
          ,
          score
        ]) =>
          (
            Number(
              score?.placePt
            ) ||
            0
          ) +
          (
            Number(
              score?.kp
            ) ||
            0
          ) >=
          WORLD_RULES
            .final
            .threshold
      )
      .map(
        ([
          teamId
        ]) =>
          teamId
      );
  }

  function resolveMatchPointChampion({
    eligibleAtMatchStart,
    championTeamId
  } = {}) {
    const eligible =
      new Set(
        eligibleAtMatchStart ||
        []
      );

    return (
      championTeamId &&
      eligible.has(
        championTeamId
      )
    )
      ? championTeamId
      : null;
  }

  function calculateChampionshipPoints(
    placement
  ) {
    return (
      WORLD_RULES
        .championship
        .pointsByWorldFinalPlacement[
          Number(
            placement
          )
        ] ||
      0
    );
  }

  function isChampionshipYear(year) {
    const value =
      Math.floor(
        Number(year)
      );

    return (
      Number.isFinite(
        value
      ) &&
      value >=
        WORLD_RULES
          .championship
          .firstYear &&
      (
        value -
        WORLD_RULES
          .championship
          .firstYear
      ) %
        WORLD_RULES
          .championship
          .everyYears ===
      0
    );
  }

  function getChampionshipField(
    standings
  ) {
    return [
      ...(
        standings ||
        []
      )
    ]
      .sort(
        (
          left,
          right
        ) =>
          (
            Number(
              right.points
            ) ||
            0
          ) -
          (
            Number(
              left.points
            ) ||
            0
          ) ||
          (
            Number(
              right.worldWins
            ) ||
            0
          ) -
          (
            Number(
              left.worldWins
            ) ||
            0
          )
      )
      .slice(
        0,

        WORLD_RULES
          .championship
          .teams
      )
      .map(
        clone
      );
  }

  const WORLD_DATA =
    Object.freeze({
      version:
        '2.1.0-compact-role-skills',

      rules:
        WORLD_RULES,

      bands:
        BANDS,

      roleOffsets:
        ROLE_OFFSETS,

      styles:
        STYLES,

      rosterRows:
        ROSTER_ROWS,

      teamOverrides:
        TEAM_OVERRIDES,

      playerOverrides:
        PLAYER_OVERRIDES,

      customSkills:
        CUSTOM_SKILLS,

      customPassives:
        CUSTOM_PASSIVES,

      cardOverrides:
        CARD_OVERRIDES,

      badgeOverrides:
        BADGE_OVERRIDES,

      teams:
        WORLD_TEAMS,

      validation
    });

  const WORLD_API =
    Object.freeze({
      getWorldTeams,
      getWorldTeam,
      selectWorldField,

      getLastChanceTeams,
      getLastChanceAdvancers,
      createWorldFinalField,

      getMatchPointEligibleIds,
      resolveMatchPointChampion,

      calculateChampionshipPoints,
      isChampionshipYear,
      getChampionshipField,

      validateWorldTeams
    });

  MOBBR.DATA.cpuWorld =
    WORLD_DATA;

  MOBBR.DATA.cpu
    .worldRules =
    WORLD_RULES;

  MOBBR.DATA.cpu
    .worldSource =
    WORLD_DATA;

  MOBBR.API.cpuWorld =
    WORLD_API;

  global.MOBBR_WORLD_CPU_TEAMS =
    WORLD_TEAMS;

  global.MOBBR_WORLD_CPU_RULES =
    WORLD_RULES;

  global.MOBBR_WORLD_CPU_API =
    WORLD_API;

  global.MOBBR_WORLD_CPU_REGISTRATION =
    registration;
})(
  typeof window !== 'undefined'
    ? window
    : globalThis
);
