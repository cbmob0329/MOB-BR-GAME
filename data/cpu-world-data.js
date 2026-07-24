'use strict';

/**
 * MOB BR - cpu-world-data.js
 * World 43チーム・129選手の独立データ。
 *
 * 読み込み順:
 * game-data.js → ability-data.js → training-data.js → coach-data.js
 * → cpu-data.js → cpu-local-data.js → cpu-national-data.js
 * → cpu-world-data.js
 *
 * 画像:
 * IGL  = World/W{番号}B.png
 * ATK  = World/W{番号}A.png
 * SUP  = World/W{番号}C.png
 * LOGO = World/W{番号}D.png
 */
(function initializeWorldCpuData(global) {
  const MOBBR = global.MOBBR = global.MOBBR || {};
  MOBBR.DATA = MOBBR.DATA || {};
  MOBBR.DATA.cpu = MOBBR.DATA.cpu || {};
  MOBBR.API = MOBBR.API || {};

  const CPU = MOBBR.API.cpu;

  if (!CPU || typeof CPU.registerTeams !== 'function') {
    throw new Error(
      'cpu-world-data.jsより先にcpu-data.jsを読み込んでください。'
    );
  }

  const STATS = [
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

  const RANK_TIERS = [
    'F',
    'E',
    'D',
    'C',
    'B',
    'A',
    'S',
    'SS'
  ];

  const RANK_ORDER = [
    ...RANK_TIERS.flatMap(
      (tier) => Array.from(
        { length: 9 },
        (_, index) => `${tier}${index + 1}`
      )
    ),
    'MOB'
  ];

  const BANDS = {
    king: {
      teamNormal: ['B5', 'A3'],
      teamHot: ['A3', 'A9'],
      roleRanks: {
        IGL: {
          bad: ['B4', 'A1'],
          normal: ['B6', 'A2'],
          hot: ['A4', 'A9']
        },
        ATK: {
          bad: ['B3', 'A2'],
          normal: ['B4', 'A4'],
          hot: ['A3', 'S1']
        },
        SUP: {
          bad: ['B4', 'A1'],
          normal: ['B5', 'A2'],
          hot: ['A2', 'A8']
        }
      },
      statNormal: 'S2',
      statHot: 'S8',
      power: 6
    },

    top: {
      teamNormal: ['B8', 'A8'],
      teamHot: ['A5', 'S4'],
      roleRanks: {
        IGL: {
          bad: ['B3', 'A3'],
          normal: ['B9', 'A7'],
          hot: ['A6', 'S2']
        },
        ATK: {
          bad: ['B2', 'A4'],
          normal: ['B7', 'A9'],
          hot: ['A5', 'S3']
        },
        SUP: {
          bad: ['B3', 'A2'],
          normal: ['B8', 'A6'],
          hot: ['A4', 'S1']
        }
      },
      statNormal: 'A8',
      statHot: 'S4',
      power: 5
    },

    elite: {
      teamNormal: ['B4', 'A4'],
      teamHot: ['B9', 'A9'],
      roleRanks: {
        IGL: {
          bad: ['C8', 'B8'],
          normal: ['B5', 'A3'],
          hot: ['A2', 'A8']
        },
        ATK: {
          bad: ['C7', 'B9'],
          normal: ['B3', 'A5'],
          hot: ['A1', 'A9']
        },
        SUP: {
          bad: ['C8', 'B7'],
          normal: ['B4', 'A2'],
          hot: ['B9', 'A7']
        }
      },
      statNormal: 'A2',
      statHot: 'A8',
      power: 4
    },

    high: {
      teamNormal: ['C9', 'B9'],
      teamHot: ['B5', 'A5'],
      roleRanks: {
        IGL: {
          bad: ['D9', 'C9'],
          normal: ['C9', 'B9'],
          hot: ['B8', 'A5']
        },
        ATK: {
          bad: ['D8', 'B1'],
          normal: ['C7', 'A1'],
          hot: ['B7', 'A7']
        },
        SUP: {
          bad: ['D9', 'C8'],
          normal: ['C8', 'B8'],
          hot: ['B6', 'A4']
        }
      },
      statNormal: 'B8',
      statHot: 'A4',
      power: 3
    },

    standard: {
      teamNormal: ['C5', 'B5'],
      teamHot: ['C9', 'B9'],
      roleRanks: {
        IGL: {
          bad: ['D5', 'C5'],
          normal: ['C5', 'B5'],
          hot: ['C9', 'A1']
        },
        ATK: {
          bad: ['D4', 'C7'],
          normal: ['C3', 'B7'],
          hot: ['C8', 'A3']
        },
        SUP: {
          bad: ['D5', 'C4'],
          normal: ['C4', 'B4'],
          hot: ['C7', 'B9']
        }
      },
      statNormal: 'B3',
      statHot: 'A1',
      power: 2
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
      description: '攻守のバランスと安定した連携を武器とする。',
      mainStats: ['aim', 'mind'],
      stats: {},
      weapons: {
        IGL: 'アサルトライフル',
        ATK: 'アサルトライフル',
        SUP: 'ハンドガン'
      }
    },

    technical: {
      description: '高い技術と状況判断で戦闘を組み立てる。',
      mainStats: ['technique', 'mind'],
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
      description: '敵の流れを読み、戦闘の主導権を握る。',
      mainStats: ['mind', 'technique'],
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
      description: '強力な接近戦と一気の攻めを得意とする。',
      mainStats: ['physical', 'aim'],
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
      description: '遠距離からの高精度射撃で戦場を支配する。',
      mainStats: ['aim', 'technique'],
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
      description: '回復と味方強化を軸に長期戦を狙う。',
      mainStats: ['support', 'mind'],
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
      description: '高い機動力と素早いスキル回転で翻弄する。',
      mainStats: ['agility', 'technique'],
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
      description: '耐久と立て直し能力で終盤まで生き残る。',
      mainStats: ['stamina', 'support'],
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
      description: '高い耐久力と防衛判断を武器とする。',
      mainStats: ['stamina', 'physical'],
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
      description: '重い火力と集中攻撃で正面戦闘を押し切る。',
      mainStats: ['physical', 'aim'],
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
    [1, 'ゴールデンテンペスト', 'king', 'balanced', 'モブミリー', 'モブトール', 'モブオマー', '世界最強のチーム。'],
    [2, 'タロアートファッション', 'high', 'technical', 'モブポヨ', 'モブターロ', 'モブチャモロ', '独創的な戦術と個人技を融合する世界チーム。'],
    [3, 'シャドウキングダム', 'top', 'control', 'モブアサモブ', 'モブヴァン', 'モブテラー', '闇から主導権を奪う世界トップクラスのチーム。'],
    [4, 'アリスカンパニー', 'top', 'control', 'モブクイン', 'モブジョーカー', 'モブキング', '変則的な判断と完成度の高い連携を武器とする。'],
    [5, 'アサシンコート', 'top', 'assault', 'モブサイレント', 'モブタゲ', 'モブガンド', '静かな接近から一気に戦闘を終わらせる。'],
    [6, 'ネコクーバレット', 'elite', 'sniper', 'モブネコクー', 'モブククリ', 'モブテイル', '遠距離の精度と素早い射線変更に優れる。'],
    [7, 'シャーロックターゲット', 'elite', 'control', 'モブホームズ', 'モブワトソン', 'モブアーティー', '敵の行動を読み、最適な交戦を選び続ける。'],
    [8, 'ヨミカケノホン', 'elite', 'technical', 'モブブラック', 'モブレッド', 'モブイエロー', '多彩な特殊効果と状況対応力を持つ。'],
    [9, 'ケロノイショウ', 'elite', 'support', 'モブミトケロ', 'モブグリケロ', 'モブサポケロ', '回復と継続戦闘を得意とする安定型チーム。'],
    [10, 'ラビットスキルボム', 'elite', 'speed', 'モブビッツ', 'モブステッピン', 'モブジャンピン', '高い機動力と連続スキルで相手を翻弄する。'],
    [11, 'モブメジャーズ', 'elite', 'balanced', 'モブジャイロ', 'モブワイヤー', 'モブルタ', '世界基準の基礎性能を持つバランスチーム。'],
    [12, 'マスターオブテクニック', 'elite', 'technical', 'モブハドウ', 'モブカメハ', 'モブドドパ', '高いテクニックとスキル回転で戦闘を組み立てる。'],
    [13, 'レトロシアター', 'elite', 'technical', 'モブドワーフ', 'モブサッケ', 'モブディア', '独自のテンポと連携で主導権を握る。'],
    [14, 'コミックヒッターズ', 'high', 'technical', 'モブペン', 'モブインク', 'モブトーン', '技術と演出力を兼ね備えた攻撃的チーム。'],
    [15, 'ライフナイフクルー', 'high', 'survival', 'モブライフ', 'モブブレイド', 'モブシース', '耐久と鋭い反撃を両立する。'],
    [16, 'ウルフスノーマン', 'high', 'guard', 'モブウルフ', 'モブブリザ', 'モブスノウ', '高い耐久力と冷静な防衛判断を持つ。'],
    [17, 'スナノクニ', 'high', 'sniper', 'モブファラオ', 'モブスフィン', 'モブオアシス', '遠距離制圧と継戦能力に優れる。'],
    [18, 'グラスオリジン', 'high', 'technical', 'モブグラス', 'モブクリア', 'モブプリズム', '透明感のある連携と精密な技術を武器とする。'],
    [19, 'ワールドアトリエ', 'high', 'technical', 'モブモロシャ', 'モブアミレ', 'モブピンカ', '柔軟な戦術を試合ごとに描き替える。'],
    [20, 'ヘビィマシンガンズ', 'high', 'burst', 'モブシャボム', 'モブインバス', 'モブレージ', '圧倒的な制圧射撃で正面戦闘を押し切る。'],
    [21, 'ニューパイレーツ', 'high', 'assault', 'モブベアー', 'モブティーロ', 'モブバッサ', '大胆な侵攻と素早い奪取を得意とする。'],
    [22, 'ダークミュージック', 'high', 'control', 'モブスク', 'モブラッチ', 'モブラババ', '独特なリズムで敵の戦闘テンポを崩す。'],
    [23, 'レーザーデストロイ', 'high', 'burst', 'モブヒッツメン', 'モブタクティン', 'モブディフェル', '高精度の集中攻撃で防衛線を破壊する。'],
    [24, 'ボーンクリエイターズ', 'high', 'guard', 'モブウィッシュ', 'モブショル', 'モブハクリ', '堅牢な陣形と再構築能力で粘り強く戦う。'],
    [25, 'ストリートダッシュ', 'high', 'speed', 'モブロード', 'モブスプリント', 'モブステップ', '高速移動と素早い接敵・離脱を繰り返す。'],
    [26, 'オンミツサーカス', 'high', 'speed', 'モブセレモ', 'モブポンプ', 'モブトーク', '変則移動と奇襲で敵の視線を分散させる。'],
    [27, 'デンデンオリジナル', 'standard', 'balanced', 'モブデンブー', 'モブデンロック', 'モブデンファット', '安定した基礎性能と堅実な連携を持つ。'],
    [28, 'プニプニパーティー', 'standard', 'support', 'モブプニグリ', 'モブプニパー', 'モブプニオレ', '回復と味方強化を軸に長期戦を狙う。'],
    [29, 'マジックショータイム', 'standard', 'technical', 'モブパンド', 'モブカード', 'モブカット', '多彩なスキルで戦況を変化させる。'],
    [30, 'リスタートワールズ', 'standard', 'survival', 'モブクエ', 'モブダクピー', 'モブジャーミン', '立て直し能力が高く、終盤まで生き残る。'],
    [31, 'ゴーレムロボブラスターズ', 'standard', 'guard', 'モブターミ', 'モブシュワ', 'モブタイゴン', '高い耐久力と重火力を備える。'],
    [32, 'ユウシャノケイフ', 'standard', 'balanced', 'モブユウシャ', 'モブシソン', 'モブセンゾ', '正統派の攻守とチームワークで戦う。'],
    [33, 'テクノロジーソルジャーズ', 'standard', 'sniper', 'モブスコープ', 'モブベアブ', 'モブランボル', '精密機器と遠距離射撃を活用する。'],
    [34, 'マウスオブトップ', 'standard', 'speed', 'モブマイキー', 'モブリンキー', 'モブロッキー', '小回りの利く高速戦闘を得意とする。'],
    [35, 'ヤミネコクリティカル', 'standard', 'sniper', 'モブレール', 'モブキャリー', 'モブドリフ', '暗所から高精度の一撃を狙う。'],
    [36, 'スタイリッシュエージェント', 'standard', 'technical', 'モブカウボ', 'モブリュク', 'モブコスコ', '洗練された動きと精密な連携を持つ。'],
    [37, 'コスモキャットロード', 'standard', 'technical', 'モブムク', 'モブヴァル', 'モブスタチュ', '宇宙的な変則戦術で敵を揺さぶる。'],
    [38, 'ブラックホールズ', 'standard', 'control', 'モブサクル', 'モブエンド', 'モブサイン', '吸い込むような包囲と妨害を得意とする。'],
    [39, 'ワンミニッツスプライト', 'high', 'speed', 'モブミニット', 'モブセカンド', 'モブスプラ', '短時間で戦況を変える高速チーム。'],
    [40, 'ナチュラルエイマーズ', 'high', 'sniper', 'モブナチュラ', 'モブサイト', 'モブフォーカス', '自然な照準能力と安定した射撃精度を持つ。'],
    [41, 'クリスマススリーサンタ', 'high', 'support', 'モブアカサンタ', 'モブピンクサンタ', 'モブブルーサンタ', '回復・支援・連携を高水準で備える特別チーム。'],
    [42, 'モブアーティストレジェンド', 'top', 'technical', 'モブシュガペロ', 'モブカカオ', 'モブビスケット', '5年目から毎回Worldへ参戦する特別チーム。', { type: 'fromYear', year: 5, always: true }],
    [43, 'モブアーティストクリエイト', 'top', 'technical', 'モブバター', 'モブミルキー', 'モブマーブル', '5年目から毎回Worldへ参戦する特別チーム。', { type: 'fromYear', year: 5, always: true }]
  ];

  const PLAYER_DESCRIPTION_OVERRIDES = {
    'world_01_igl': '抜群の安定感で常に好調を保つ世界最高峰のIGL。',
    'world_01_atk': '不安定でも高い性能を誇り、調子のいい時は誰にも止められない。',
    'world_01_sup': 'サポーターでありながら世界トップクラスの火力と冷静なマインドを武器とする。'
  };

  function clone(value) {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }

    return JSON.parse(
      JSON.stringify(value)
    );
  }

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

  function makeId(prefix, value) {
    return `${prefix}_${hash(value).toString(36)}`;
  }

  function rankIndex(rank) {
    const index = RANK_ORDER.indexOf(
      String(rank || 'F1').toUpperCase()
    );

    return index >= 0
      ? index
      : 0;
  }

  function shiftRank(rank, amount = 0) {
    const nextIndex = Math.max(
      0,
      Math.min(
        RANK_ORDER.length - 1,
        rankIndex(rank) + Math.floor(Number(amount) || 0)
      )
    );

    return RANK_ORDER[nextIndex];
  }

  function rangeText(range, amount = 0) {
    return `${shiftRank(range[0], amount)}～${shiftRank(range[1], amount)}`;
  }

  function getCardPackId(teamNumber) {
    if (
      (teamNumber >= 1 && teamNumber <= 5) ||
      (teamNumber >= 11 && teamNumber <= 15)
    ) {
      return 'vol6';
    }

    if (
      (teamNumber >= 6 && teamNumber <= 10) ||
      (teamNumber >= 16 && teamNumber <= 26)
    ) {
      return 'vol7';
    }

    if (teamNumber >= 27 && teamNumber <= 41) {
      return 'vol8';
    }

    return '';
  }

  function makeStats(
    teamNumber,
    role,
    playerName,
    styleId,
    band
  ) {
    const style = STYLES[styleId];

    return Object.fromEntries(
      STATS.map(
        (statId, index) => {
          const noise = (
            hash(`${teamNumber}:${role}:${playerName}:${statId}:${index}`) % 3
          ) - 1;

          const offset =
            (ROLE_OFFSETS[role][statId] || 0) +
            (style.stats[statId] || 0) +
            noise;

          return [
            statId,
            {
              normal: shiftRank(
                band.statNormal,
                offset
              ),

              hot: shiftRank(
                band.statHot,
                offset
              )
            }
          ];
        }
      )
    );
  }

  function makeWeapon(
    teamNumber,
    role,
    playerName,
    styleId,
    band
  ) {
    const style = STYLES[styleId];
    const type = style.weapons[role];
    const preferredRange = WEAPON_RANGE[type] || 'mid';
    const base = 42 + (band.power * 8);

    return {
      id: makeId(
        'world_weapon',
        `${teamNumber}:${role}:${playerName}`
      ),

      name: `${playerName}専用${type}`,
      type,
      preferredRange,
      magazine: WORLD_RULES.weaponMagazine,

      attack:
        base +
        (role === 'ATK' ? 8 : 0) +
        (type === 'ショットガン' ? 3 : 0),

      accuracy:
        base +
        (role === 'IGL' ? 6 : 0) +
        (type === 'スナイパーライフル' ? 4 : 0),

      speed:
        base +
        (styleId === 'speed' ? 8 : 0),

      performance: {
        close: shiftRank(
          band.statNormal,
          preferredRange === 'close' ? 4 : -1
        ),

        mid: shiftRank(
          band.statNormal,
          preferredRange === 'mid' ? 4 : 0
        ),

        far: shiftRank(
          band.statNormal,
          preferredRange === 'far' ? 4 : -2
        ),

        rapid: shiftRank(
          band.statNormal,
          styleId === 'speed' || type === 'マシンガン'
            ? 4
            : 0
        ),

        reload: shiftRank(
          band.statNormal,
          role === 'SUP' ? 3 : 0
        )
      }
    };
  }

  function makeSkills(
    teamNumber,
    role,
    playerName,
    styleId,
    band
  ) {
    const style = STYLES[styleId];
    const strength = band.power;
    const primary = style.mainStats[0];
    const secondary = style.mainStats[1];

    if (role === 'IGL') {
      return [
        {
          id: makeId(
            'world_skill',
            `${teamNumber}:${role}:${playerName}:1`
          ),

          name: `${playerName}ワールドコール`,
          type: 'teamStatBuff',
          target: 'allyAll',
          ct: 6,

          effects: [
            {
              code: 'TEAM_STAT_BUFF',
              stats: {
                [primary]: strength,
                [secondary]: Math.max(
                  1,
                  strength - 1
                )
              },
              durationSeconds: 5
            }
          ]
        },

        {
          id: makeId(
            'world_skill',
            `${teamNumber}:${role}:${playerName}:2`
          ),

          name: `${playerName}タクティクス`,
          type: 'teamCtBoost',
          target: 'allyAll',
          ct: 7,

          effects: [
            {
              code: 'CPU_TEAM_CT_REDUCTION',
              rate:
                0.08 +
                (strength * 0.015)
            }
          ]
        }
      ];
    }

    if (role === 'ATK') {
      return [
        {
          id: makeId(
            'world_skill',
            `${teamNumber}:${role}:${playerName}:1`
          ),

          name: `${playerName}ワールドバースト`,
          type: 'singleDamage',
          target: 'lowestHpEnemy',
          power:
            1.8 +
            (strength * 0.30),
          hit:
            0.76 +
            (strength * 0.025),
          ct: 5.5,

          effects: [
            {
              code: 'CPU_SINGLE_DAMAGE',
              power:
                1.8 +
                (strength * 0.30)
            }
          ]
        },

        {
          id: makeId(
            'world_skill',
            `${teamNumber}:${role}:${playerName}:2`
          ),

          name: `${playerName}ラッシュ`,
          type: 'multiSingleDamage',
          target: 'randomEnemy',
          shots:
            styleId === 'speed'
              ? 4
              : 3,
          power:
            0.65 +
            (strength * 0.08),
          hit: 0.74,
          ct: 6.5,

          effects: [
            {
              code: 'CPU_MULTI_DAMAGE',
              shots:
                styleId === 'speed'
                  ? 4
                  : 3,
              power:
                0.65 +
                (strength * 0.08)
            }
          ]
        }
      ];
    }

    return [
      {
        id: makeId(
          'world_skill',
          `${teamNumber}:${role}:${playerName}:1`
        ),

        name: `${playerName}ワールドヒール`,
        type: 'teamHeal',
        target: 'allyAll',
        healRate:
          0.10 +
          (strength * 0.018),
        ct: 6,

        effects: [
          {
            code: 'TEAM_HEAL_FORMULA',
            baseRate:
              0.10 +
              (strength * 0.018),
            maximumRate:
              0.10 +
              (strength * 0.018)
          }
        ]
      },

      teamNumber % 3 === 0
        ? {
            id: makeId(
              'world_skill',
              `${teamNumber}:${role}:${playerName}:2`
            ),

            name: `${playerName}リスポーン`,
            type: 'reviveAll',
            target: 'allyDown',
            ct: 9,

            conditions: [
              {
                code: 'ALLY_DOWN_EXISTS'
              }
            ],

            effects: [
              {
                code: 'REVIVE_ALL',
                reviveHpRate:
                  0.18 +
                  (strength * 0.02)
              }
            ]
          }
        : {
            id: makeId(
              'world_skill',
              `${teamNumber}:${role}:${playerName}:2`
            ),

            name: `${playerName}リカバー`,
            type: 'teamCtBoost',
            target: 'allyAll',
            ct: 7,

            effects: [
              {
                code: 'CPU_TEAM_CT_REDUCTION',
                rate:
                  0.07 +
                  (strength * 0.015)
              }
            ]
          }
    ];
  }

  function makePassive(
    teamNumber,
    role,
    playerName,
    styleId,
    band
  ) {
    const style = STYLES[styleId];
    const strength = band.power;

    if (role === 'IGL') {
      return {
        id: makeId(
          'world_passive',
          `${teamNumber}:${role}:${playerName}`
        ),

        name: `${playerName}の世界指揮`,
        description:
          `味方全体の${styleId}性能を上げる。`,

        effects: [
          {
            code: 'TEAM_STAT_BUFF',
            stats: {
              [style.mainStats[0]]:
                Math.max(
                  1,
                  strength - 1
                )
            }
          }
        ]
      };
    }

    if (role === 'ATK') {
      return {
        id: makeId(
          'world_passive',
          `${teamNumber}:${role}:${playerName}`
        ),

        name: `${playerName}の世界決定力`,
        description:
          'HP50％以下の敵へのダメージを上げる。',

        effects: [
          {
            code: 'DAMAGE_MODIFIER',
            condition: 'targetHpLte',
            threshold: 0.50,
            rate:
              0.02 +
              (strength * 0.008)
          }
        ]
      };
    }

    return {
      id: makeId(
        'world_passive',
        `${teamNumber}:${role}:${playerName}`
      ),

      name: `${playerName}の世界支援`,
      description:
        '自身が行う回復量を上げる。',

      effects: [
        {
          code: 'HEAL_RATE_POINTS',
          target: 'allHeals',
          points: strength
        }
      ]
    };
  }

  function makeCard(
    teamNumber,
    role,
    playerName
  ) {
    return {
      id: `world_card_${String(teamNumber).padStart(2, '0')}_${role.toLowerCase()}`,
      sourceType: 'cpuPlayer',
      sourceTeamId: `world_${String(teamNumber).padStart(2, '0')}`,
      sourceRole: role,
      name: playerName,
      rarity: '',
      description: '',
      packId: getCardPackId(teamNumber),
      duplicateMaximumPlus: 9,
      duplicateOverflowReward: {
        coin: 10000,
        diamond: 1
      }
    };
  }

  function makeBadge(
    teamNumber,
    teamName
  ) {
    return {
      id: `world_badge_${String(teamNumber).padStart(2, '0')}`,
      sourceType: 'cpuTeam',
      sourceTeamId: `world_${String(teamNumber).padStart(2, '0')}`,
      name: `${teamName}バッジ`,
      rarity: '',
      description:
        `${teamName}のWorldバッジ。`,
      packId: 'wb',
      duplicateMaximumPlus: 9,
      duplicateOverflowReward: {
        coin: 10000,
        diamond: 1
      }
    };
  }

  function makePlayer(
    teamNumber,
    role,
    playerName,
    styleId,
    band
  ) {
    const teamId =
      `world_${String(teamNumber).padStart(2, '0')}`;

    const playerId =
      `${teamId}_${role.toLowerCase()}`;

    const roleRanks =
      band.roleRanks[role];

    return {
      id: playerId,
      role,
      name: playerName,

      description:
        PLAYER_DESCRIPTION_OVERRIDES[playerId] || '',

      image:
        `World/W${teamNumber}${ROLE_SUFFIX[role]}.png`,

      rank: {
        normal: rangeText(
          roleRanks.normal
        ),

        hot: rangeText(
          roleRanks.hot
        )
      },

      stats: makeStats(
        teamNumber,
        role,
        playerName,
        styleId,
        band
      ),

      weapon: makeWeapon(
        teamNumber,
        role,
        playerName,
        styleId,
        band
      ),

      skills: makeSkills(
        teamNumber,
        role,
        playerName,
        styleId,
        band
      ),

      specialAbilities: [
        makePassive(
          teamNumber,
          role,
          playerName,
          styleId,
          band
        )
      ],

      battleAI: {
        badRank: rangeText(
          roleRanks.bad
        ),

        normalRank: rangeText(
          roleRanks.normal
        ),

        hotRank: rangeText(
          roleRanks.hot
        ),

        preferredStyle: styleId,
        ultimateEnabled: false
      },

      card: makeCard(
        teamNumber,
        role,
        playerName
      ),

      tags: [
        'World',
        role,
        styleId
      ]
    };
  }

  function makeTeam(row) {
    const [
      number,
      name,
      strengthClass,
      styleId,
      iglName,
      atkName,
      supName,
      description,
      entryRule = null
    ] = row;

    const band = BANDS[strengthClass];
    const style = STYLES[styleId];
    const teamId =
      `world_${String(number).padStart(2, '0')}`;

    return {
      id: teamId,
      code: `W${number}`,
      number,
      name,

      logo:
        `World/W${number}D.png`,

      description:
        description || style.description,

      teamRank: {
        normal: rangeText(
          band.teamNormal
        ),

        hot: rangeText(
          band.teamHot
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
        class: strengthClass,
        style: styleId,
        nativeWorldTeam: true
      },

      entryRule,

      badge: makeBadge(
        number,
        name
      ),

      tags: [
        'World',
        strengthClass,
        styleId
      ]
    };
  }

  const WORLD_TEAMS =
    ROSTER_ROWS.map(makeTeam);

  function validateWorldTeams() {
    const errors = [];
    const teamIds = new Set();
    const teamCodes = new Set();
    const playerIds = new Set();
    const skillIds = new Set();
    const passiveIds = new Set();

    if (
      WORLD_TEAMS.length !==
      WORLD_RULES.registeredCpuTeams
    ) {
      errors.push(
        `Worldチーム数が${WORLD_RULES.registeredCpuTeams}ではありません: ${WORLD_TEAMS.length}`
      );
    }

    WORLD_TEAMS.forEach(
      (team) => {
        if (teamIds.has(team.id)) {
          errors.push(
            `チームID重複: ${team.id}`
          );
        }

        if (teamCodes.has(team.code)) {
          errors.push(
            `チームコード重複: ${team.code}`
          );
        }

        teamIds.add(team.id);
        teamCodes.add(team.code);

        if (team.members.length !== 3) {
          errors.push(
            `${team.name}の選手数が3人ではありません。`
          );
        }

        const roles = new Set(
          team.members.map(
            (member) => member.role
          )
        );

        [
          'IGL',
          'ATK',
          'SUP'
        ].forEach(
          (role) => {
            if (!roles.has(role)) {
              errors.push(
                `${team.name}に${role}がいません。`
              );
            }
          }
        );

        team.members.forEach(
          (member) => {
            if (playerIds.has(member.id)) {
              errors.push(
                `選手ID重複: ${member.id}`
              );
            }

            playerIds.add(member.id);

            if (
              member.skills.length !==
              WORLD_RULES.dedicatedSkillsPerPlayer
            ) {
              errors.push(
                `${team.name}/${member.name}の専用スキル数が${WORLD_RULES.dedicatedSkillsPerPlayer}ではありません。`
              );
            }

            if (
              member.specialAbilities.length !== 1
            ) {
              errors.push(
                `${team.name}/${member.name}の特殊能力数が1ではありません。`
              );
            }

            member.skills.forEach(
              (skill) => {
                if (skillIds.has(skill.id)) {
                  errors.push(
                    `スキルID重複: ${skill.id}`
                  );
                }

                skillIds.add(skill.id);
              }
            );

            member.specialAbilities.forEach(
              (ability) => {
                if (
                  passiveIds.has(ability.id)
                ) {
                  errors.push(
                    `特殊能力ID重複: ${ability.id}`
                  );
                }

                passiveIds.add(ability.id);
              }
            );

            STATS.forEach(
              (statId) => {
                if (!member.stats[statId]) {
                  errors.push(
                    `${team.name}/${member.name}/${statId}がありません。`
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
          WORLD_TEAMS.length,

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
    validateWorldTeams();

  if (!validation.valid) {
    throw new Error(
      validation.errors.join('\n')
    );
  }

  if (
    MOBBR.DATA.cpu.expectedTeamCounts
  ) {
    MOBBR.DATA.cpu
      .expectedTeamCounts
      .world =
      WORLD_RULES.registeredCpuTeams;
  }

  const registration =
    CPU.registerTeams(
      'world',
      WORLD_TEAMS,
      {
        replaceTier: true,
        source:
          'cpu-world-data.js'
      }
    );

  function getWorldTeams() {
    return WORLD_TEAMS.map(clone);
  }

  function getWorldTeam(
    teamIdOrCodeOrNumber
  ) {
    const source =
      String(
        teamIdOrCodeOrNumber ?? ''
      ).trim();

    const number =
      Number(source);

    const team =
      WORLD_TEAMS.find(
        (entry) =>
          entry.id === source ||
          entry.code === source.toUpperCase() ||
          entry.number === number
      );

    return team
      ? clone(team)
      : null;
  }

  function selectWorldField({
    year = 1,
    count = WORLD_RULES.tournamentTeams,
    excludeTeamIds = [],
    random = Math.random
  } = {}) {
    const excluded = new Set(
      excludeTeamIds
    );

    const eligible =
      WORLD_TEAMS.filter(
        (team) => {
          if (excluded.has(team.id)) {
            return false;
          }

          if (
            team.entryRule?.type ===
            'fromYear'
          ) {
            return (
              Number(year) >=
              Number(team.entryRule.year)
            );
          }

          return true;
        }
      );

    const mandatoryIds =
      Number(year) >=
      WORLD_RULES.specialEntry.fromYear
        ? new Set(
            WORLD_RULES
              .specialEntry
              .alwaysTeamIds
          )
        : new Set();

    const mandatory =
      eligible.filter(
        (team) =>
          mandatoryIds.has(team.id)
      );

    const pool =
      eligible.filter(
        (team) =>
          !mandatoryIds.has(team.id)
      );

    for (
      let index = pool.length - 1;
      index > 0;
      index -= 1
    ) {
      const randomValue = Math.max(
        0,
        Math.min(
          0.999999999,
          Number(random()) || 0
        )
      );

      const nextIndex = Math.floor(
        randomValue *
        (index + 1)
      );

      [
        pool[index],
        pool[nextIndex]
      ] = [
        pool[nextIndex],
        pool[index]
      ];
    }

    return [
      ...mandatory,
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
      .map(clone);
  }

  function getLastChanceTeams(
    preliminaryStandings
  ) {
    return [
      ...(preliminaryStandings || [])
    ]
      .sort(
        (left, right) =>
          Number(left.placement) -
          Number(right.placement)
      )
      .filter(
        (entry) =>
          Number(entry.placement) >=
            WORLD_RULES.lastChance
              .sourcePlacementMin &&
          Number(entry.placement) <=
            WORLD_RULES.lastChance
              .sourcePlacementMax
      )
      .map(clone);
  }

  function getLastChanceAdvancers(
    lastChanceStandings
  ) {
    return [
      ...(lastChanceStandings || [])
    ]
      .sort(
        (left, right) =>
          Number(left.placement) -
          Number(right.placement)
      )
      .slice(
        0,
        WORLD_RULES.lastChance.advance
      )
      .map(clone);
  }

  function createWorldFinalField({
    preliminaryStandings,
    lastChanceStandings
  } = {}) {
    const direct = [
      ...(preliminaryStandings || [])
    ]
      .sort(
        (left, right) =>
          Number(left.placement) -
          Number(right.placement)
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
    ].map(clone);
  }

  function getMatchPointEligibleIds(
    totals
  ) {
    return Object.entries(
      totals || {}
    )
      .filter(
        ([, score]) =>
          (
            Number(score?.placePt) || 0
          ) +
          (
            Number(score?.kp) || 0
          ) >=
          WORLD_RULES.final.threshold
      )
      .map(
        ([teamId]) => teamId
      );
  }

  function resolveMatchPointChampion({
    eligibleAtMatchStart,
    championTeamId
  } = {}) {
    const eligible = new Set(
      eligibleAtMatchStart || []
    );

    return (
      championTeamId &&
      eligible.has(championTeamId)
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
          Number(placement)
        ] || 0
    );
  }

  function isChampionshipYear(year) {
    const value = Math.floor(
      Number(year)
    );

    if (
      !Number.isFinite(value) ||
      value <
        WORLD_RULES.championship.firstYear
    ) {
      return false;
    }

    return (
      (
        value -
        WORLD_RULES.championship.firstYear
      ) %
      WORLD_RULES.championship.everyYears
    ) === 0;
  }

  function getChampionshipField(
    standings
  ) {
    return [
      ...(standings || [])
    ]
      .sort(
        (left, right) => {
          const pointDifference =
            (Number(right.points) || 0) -
            (Number(left.points) || 0);

          if (pointDifference !== 0) {
            return pointDifference;
          }

          return (
            (Number(right.worldWins) || 0) -
            (Number(left.worldWins) || 0)
          );
        }
      )
      .slice(
        0,
        WORLD_RULES
          .championship
          .teams
      )
      .map(clone);
  }

  const WORLD_DATA = Object.freeze({
    version: '1.1.0',
    rules: WORLD_RULES,
    rankOrder: RANK_ORDER,
    bands: BANDS,
    styles: STYLES,
    rosterRows: ROSTER_ROWS,
    teams: WORLD_TEAMS,
    validation
  });

  const WORLD_API = Object.freeze({
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

  MOBBR.DATA.cpu.worldRules =
    WORLD_RULES;

  MOBBR.DATA.cpu.worldSource =
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
