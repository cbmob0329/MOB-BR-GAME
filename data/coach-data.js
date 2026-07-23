'use strict';

/**
 * MOB BR - coach-data.js
 * 読み込み順:
 * game-data.js → ability-data.js → training-data.js → coach-data.js
 *
 * 主な編集場所
 * ・コーチ追加: COACH_DEFINITIONS
 * ・作戦追加/修正: STRATEGY_ROWS
 * ・作戦会議確率: STRATEGY_PROBABILITY_ANCHORS
 */
(function initializeCoachData(global) {
  const MOBBR = global.MOBBR = global.MOBBR || {};
  MOBBR.DATA = MOBBR.DATA || {};
  MOBBR.API = MOBBR.API || {};

  if (!MOBBR.DATA.game || !MOBBR.API.game) {
    throw new Error(
      'coach-data.jsより先にgame-data.jsを読み込んでください。'
    );
  }

  const GAME = MOBBR.DATA.game;
  const GAME_API = MOBBR.API.game;
  const clone = GAME_API.clone;

  const COACH_RANK_ORDER = [
    ...GAME.companyRank.order
  ];

  const freeze = (value) => {
    if (
      !value ||
      typeof value !== 'object' ||
      Object.isFrozen(value)
    ) {
      return value;
    }

    Object.freeze(value);
    Object.values(value).forEach(freeze);

    return value;
  };

  const clamp = (
    value,
    min,
    max
  ) => {
    const number = Number(value);

    return Number.isFinite(number)
      ? Math.max(
          min,
          Math.min(max, number)
        )
      : min;
  };

  const clampInt = (
    value,
    min,
    max
  ) =>
    Math.floor(
      clamp(value, min, max)
    );

  const randomIndex = (
    length,
    random = Math.random
  ) =>
    Math.min(
      length - 1,
      Math.floor(
        clamp(
          random(),
          0,
          0.999999999
        ) * length
      )
    );

  /* ============================================================
     1. コーチ共通ルール
  ============================================================ */

  const COACH_RULES = {
    maximumOwned: 4,

    scoutUnlockCompanyRankNumber: 5,

    minimumRank: 'F1',
    maximumRank: 'SS9',

    minimumRankLevel: 1,
    maximumRankLevel: 72,

    basePoints: 10,
    pointsPerRank: 5,

    minimumPoints: 10,
    maximumPoints: 365,

    maximumTeamPoints: 1460,

    rankUp: {
      initialRate: 0.30,
      decreasePerRank: 0.0035,
      minimumRate: 0.05,
      maximumRankRate: 0
    }
  };

  /* ============================================================
     2. コーチ一覧

     新しいコーチはCOACH_DEFINITIONSへ追加する。
     starter:trueは初期コーチ1人だけに設定する。
  ============================================================ */

  const COACH_DEFINITIONS = [
    {
      id: 'coach0',
      name: '初期コーチ',
      image: 'Play/P1sup.png',

      starter: true,
      initialRank: 'F1',

      unlock: {
        type: 'initial'
      },

      scoutCost: null,

      dialogue: [
        '作戦会議を始めよう！',
        '在籍コーチ全員の知恵を集めよう。',
        'D作戦は何度でも使えるぞ！',
        '作戦の装備は不要。全部大会へ持っていこう！'
      ]
    }
  ];

  const COACH_BY_ID =
    Object.fromEntries(
      COACH_DEFINITIONS.map(
        (coach) => [
          coach.id,
          coach
        ]
      )
    );

  const STARTER_COACH =
    COACH_DEFINITIONS.find(
      (coach) => coach.starter
    ) ||
    COACH_DEFINITIONS[0];

  /* ============================================================
     3. 作戦会議
  ============================================================ */

  const STRATEGY_MEETING = {
    generatedRanks: [
      'C',
      'B',
      'A',
      'S',
      'SS'
    ],

    cost: {
      coin: 10000,
      diamond: 10,
      ruby: 1
    },

    rankUpCheckForEveryOwnedCoach:
      true,

    rankUpAfterStrategyGeneration:
      true,

    duplicateAddsStock: 1
  };

  const STRATEGY_PROBABILITY_ANCHORS = [
    {
      points: 10,
      C: 95,
      B: 5,
      A: 0,
      S: 0,
      SS: 0
    },

    {
      points: 40,
      C: 90,
      B: 8,
      A: 2,
      S: 0,
      SS: 0
    },

    {
      points: 100,
      C: 82,
      B: 12,
      A: 5,
      S: 1,
      SS: 0
    },

    {
      points: 200,
      C: 70,
      B: 17,
      A: 9,
      S: 4,
      SS: 0
    },

    {
      points: 350,
      C: 58,
      B: 20,
      A: 14,
      S: 7,
      SS: 1
    },

    {
      points: 500,
      C: 47,
      B: 21,
      A: 18,
      S: 11,
      SS: 3
    },

    {
      points: 700,
      C: 36,
      B: 21,
      A: 21,
      S: 16,
      SS: 6
    },

    {
      points: 900,
      C: 27,
      B: 19,
      A: 23,
      S: 21,
      SS: 10
    },

    {
      points: 1100,
      C: 20,
      B: 17,
      A: 23,
      S: 25,
      SS: 15
    },

    {
      points: 1300,
      C: 14,
      B: 14,
      A: 22,
      S: 28,
      SS: 22
    },

    {
      points: 1460,
      C: 10,
      B: 11,
      A: 20,
      S: 29,
      SS: 30
    }
  ];

  /* ============================================================
     4. 作戦50種類

     行形式:
     [ID, コード, ランク, 名前, 説明, 効果]
  ============================================================ */

  const STRATEGY_ROWS = [
    [
      'd01',
      'D-01',
      'D',
      'バランスを大事に',
      '能力・距離性能への影響なし。',
      {
        type: 'none'
      }
    ],

    [
      'd02',
      'D-02',
      'D',
      '遠距離で削ろう',
      '遠距離で与えるダメージ＋5%。',
      {
        type: 'rangeDamage',
        range: 'far',
        value: 0.05
      }
    ],

    [
      'd03',
      'D-03',
      'D',
      '中距離で勝負しよう',
      '中距離で与えるダメージ＋5%。',
      {
        type: 'rangeDamage',
        range: 'mid',
        value: 0.05
      }
    ],

    [
      'd04',
      'D-04',
      'D',
      '近距離で勝負しよう',
      '近距離で与えるダメージ＋5%。',
      {
        type: 'rangeDamage',
        range: 'close',
        value: 0.05
      }
    ],

    [
      'd05',
      'D-05',
      'D',
      '足並みをそろえよう',
      'メンバー全員のサポート＋1。',
      {
        type: 'stats',
        stats: {
          support: 1
        }
      }
    ],

    [
      'c01',
      'C-01',
      'C',
      'インファイトで勝負だ',
      '近距離で与えるダメージ＋8%。',
      {
        type: 'rangeDamage',
        range: 'close',
        value: 0.08
      }
    ],

    [
      'c02',
      'C-02',
      'C',
      '射線を広く使おう',
      '遠距離で与えるダメージ＋8%。',
      {
        type: 'rangeDamage',
        range: 'far',
        value: 0.08
      }
    ],

    [
      'c03',
      'C-03',
      'C',
      '中距離を保とう',
      '中距離で与えるダメージ＋8%。',
      {
        type: 'rangeDamage',
        range: 'mid',
        value: 0.08
      }
    ],

    [
      'c04',
      'C-04',
      'C',
      'エイムに自信を持て',
      'メンバー全員のエイム＋2。',
      {
        type: 'stats',
        stats: {
          aim: 2
        }
      }
    ],

    [
      'c05',
      'C-05',
      'C',
      '冷静さを忘れるな',
      'メンバー全員のマインド＋2。',
      {
        type: 'stats',
        stats: {
          mind: 2
        }
      }
    ],

    [
      'c06',
      'C-06',
      'C',
      '足を止めるな',
      'メンバー全員のアジリティ＋2。',
      {
        type: 'stats',
        stats: {
          agility: 2
        }
      }
    ],

    [
      'c07',
      'C-07',
      'C',
      '基本を丁寧に',
      'メンバー全員のテクニック＋2。',
      {
        type: 'stats',
        stats: {
          technique: 2
        }
      }
    ],

    [
      'c08',
      'C-08',
      'C',
      '当たり負けするな',
      'メンバー全員のフィジカル＋2。',
      {
        type: 'stats',
        stats: {
          physical: 2
        }
      }
    ],

    [
      'c09',
      'C-09',
      'C',
      '最後まで走り切れ',
      'メンバー全員のスタミナ＋2。',
      {
        type: 'stats',
        stats: {
          stamina: 2
        }
      }
    ],

    [
      'c10',
      'C-10',
      'C',
      '仲間の動きを見よう',
      'メンバー全員のサポート＋2。',
      {
        type: 'stats',
        stats: {
          support: 2
        }
      }
    ],

    [
      'c11',
      'C-11',
      'C',
      '先手を取ろう',
      '味方の最初の攻撃が命中するまで全距離ダメージ＋6%。命中した最初の攻撃にも適用。',
      {
        type: 'firstHitDamage',
        value: 0.06
      }
    ],

    [
      'c12',
      'C-12',
      'C',
      '一度落ち着こう',
      'メンバー全員のマインド＋1、サポート＋1。',
      {
        type: 'stats',
        stats: {
          mind: 1,
          support: 1
        }
      }
    ],

    [
      'c13',
      'C-13',
      'C',
      '体勢を整えよう',
      'メンバー全員のスタミナ＋1、フィジカル＋1。',
      {
        type: 'stats',
        stats: {
          stamina: 1,
          physical: 1
        }
      }
    ],

    [
      'b01',
      'B-01',
      'B',
      '遠距離で仕留めよう',
      '遠距離で与えるダメージ＋10%。',
      {
        type: 'rangeDamage',
        range: 'far',
        value: 0.10
      }
    ],

    [
      'b02',
      'B-02',
      'B',
      'スピードで翻弄しよう',
      'メンバー全員のアジリティ＋3。',
      {
        type: 'stats',
        stats: {
          agility: 3
        }
      }
    ],

    [
      'b03',
      'B-03',
      'B',
      '一気に距離を詰めろ',
      '近距離で与えるダメージ＋10%。',
      {
        type: 'rangeDamage',
        range: 'close',
        value: 0.10
      }
    ],

    [
      'b04',
      'B-04',
      'B',
      '中距離を支配しよう',
      '中距離で与えるダメージ＋10%。',
      {
        type: 'rangeDamage',
        range: 'mid',
        value: 0.10
      }
    ],

    [
      'b05',
      'B-05',
      'B',
      '一発一発を正確に',
      'メンバー全員のエイム＋3。',
      {
        type: 'stats',
        stats: {
          aim: 3
        }
      }
    ],

    [
      'b06',
      'B-06',
      'B',
      'プレッシャーに負けるな',
      'メンバー全員のマインド＋3。',
      {
        type: 'stats',
        stats: {
          mind: 3
        }
      }
    ],

    [
      'b07',
      'B-07',
      'B',
      '相手の動きを読み切れ',
      'メンバー全員のテクニック＋3。',
      {
        type: 'stats',
        stats: {
          technique: 3
        }
      }
    ],

    [
      'b08',
      'B-08',
      'B',
      '力で押し切ろう',
      'メンバー全員のフィジカル＋3。',
      {
        type: 'stats',
        stats: {
          physical: 3
        }
      }
    ],

    [
      'b09',
      'B-09',
      'B',
      '三人で一つだ',
      'メンバー全員のサポート＋3。',
      {
        type: 'stats',
        stats: {
          support: 3
        }
      }
    ],

    [
      'b10',
      'B-10',
      'B',
      '攻守を素早く切り替えろ',
      'メンバー全員のアジリティ＋2、サポート＋2。',
      {
        type: 'stats',
        stats: {
          agility: 2,
          support: 2
        }
      }
    ],

    [
      'b11',
      'B-11',
      'B',
      '相手の射線を切れ',
      'メンバー全員のマインド＋2、アジリティ＋2。',
      {
        type: 'stats',
        stats: {
          mind: 2,
          agility: 2
        }
      }
    ],

    [
      'a01',
      'A-01',
      'A',
      '中距離こそ至高の距離',
      '中距離で与えるダメージ＋12%。',
      {
        type: 'rangeDamage',
        range: 'mid',
        value: 0.12
      }
    ],

    [
      'a02',
      'A-02',
      'A',
      'お前たちは強い',
      'メンバー全員のマインド＋4。',
      {
        type: 'stats',
        stats: {
          mind: 4
        }
      }
    ],

    [
      'a03',
      'A-03',
      'A',
      '懐まで潜り込め',
      '近距離で与えるダメージ＋12%。',
      {
        type: 'rangeDamage',
        range: 'close',
        value: 0.12
      }
    ],

    [
      'a04',
      'A-04',
      'A',
      '射程外から制圧しろ',
      '遠距離で与えるダメージ＋12%。',
      {
        type: 'rangeDamage',
        range: 'far',
        value: 0.12
      }
    ],

    [
      'a05',
      'A-05',
      'A',
      '狙った敵は逃がすな',
      'メンバー全員のエイム＋4。',
      {
        type: 'stats',
        stats: {
          aim: 4
        }
      }
    ],

    [
      'a06',
      'A-06',
      'A',
      '完璧な連携を見せろ',
      'メンバー全員のサポート＋4。',
      {
        type: 'stats',
        stats: {
          support: 4
        }
      }
    ],

    [
      'a07',
      'A-07',
      'A',
      '戦場のすべてを見抜け',
      'メンバー全員のテクニック＋4。',
      {
        type: 'stats',
        stats: {
          technique: 4
        }
      }
    ],

    [
      'a08',
      'A-08',
      'A',
      '攻撃の主導権を握れ',
      'エイム＋2、アジリティ＋2、テクニック＋2。',
      {
        type: 'stats',
        stats: {
          aim: 2,
          agility: 2,
          technique: 2
        }
      }
    ],

    [
      'a09',
      'A-09',
      'A',
      '守りから流れを作れ',
      'スタミナ＋2、フィジカル＋2、サポート＋2。',
      {
        type: 'stats',
        stats: {
          stamina: 2,
          physical: 2,
          support: 2
        }
      }
    ],

    [
      's01',
      'S-01',
      'S',
      'スナイパーの心得',
      '遠距離で与えるダメージ＋15%。',
      {
        type: 'rangeDamage',
        range: 'far',
        value: 0.15
      }
    ],

    [
      's02',
      'S-02',
      'S',
      'ヘッドショットマスターズ',
      'メンバー全員のエイム＋3、テクニック＋3。',
      {
        type: 'stats',
        stats: {
          aim: 3,
          technique: 3
        }
      }
    ],

    [
      's03',
      'S-03',
      'S',
      '至近距離を制圧せよ',
      '近距離で与えるダメージ＋15%。',
      {
        type: 'rangeDamage',
        range: 'close',
        value: 0.15
      }
    ],

    [
      's04',
      'S-04',
      'S',
      '中距離の王者たち',
      '中距離で与えるダメージ＋15%。',
      {
        type: 'rangeDamage',
        range: 'mid',
        value: 0.15
      }
    ],

    [
      's05',
      'S-05',
      'S',
      '攻撃の手を緩めるな',
      'スタミナ＋3、エイム＋3、アジリティ＋3。',
      {
        type: 'stats',
        stats: {
          stamina: 3,
          aim: 3,
          agility: 3
        }
      }
    ],

    [
      's06',
      'S-06',
      'S',
      '最後まで心を折るな',
      'マインド＋3、フィジカル＋3、サポート＋3。',
      {
        type: 'stats',
        stats: {
          mind: 3,
          physical: 3,
          support: 3
        }
      }
    ],

    [
      's07',
      'S-07',
      'S',
      '三人で戦場を制圧しろ',
      'エイム＋3、テクニック＋3、サポート＋3。',
      {
        type: 'stats',
        stats: {
          aim: 3,
          technique: 3,
          support: 3
        }
      }
    ],

    [
      'ss01',
      'SS-01',
      'SS',
      'チャンピオンムーブ',
      'メンバー全員の全7能力＋5。',
      {
        type: 'allStats',
        value: 5
      }
    ],

    [
      'ss02',
      'SS-02',
      'SS',
      'すべての距離を支配しろ',
      '近・中・遠距離で与えるダメージ＋10%。',
      {
        type: 'allRangeDamage',
        value: 0.10
      }
    ],

    [
      'ss03',
      'SS-03',
      'SS',
      '世界に実力を見せつけろ',
      'エイム＋6、アジリティ＋6、テクニック＋6。',
      {
        type: 'stats',
        stats: {
          aim: 6,
          agility: 6,
          technique: 6
        }
      }
    ],

    [
      'ss04',
      'SS-04',
      'SS',
      '最後に立つのは俺たちだ',
      'スタミナ＋6、マインド＋6、フィジカル＋6、サポート＋6。',
      {
        type: 'stats',
        stats: {
          stamina: 6,
          mind: 6,
          physical: 6,
          support: 6
        }
      }
    ],

    [
      'ss05',
      'SS-05',
      'SS',
      '完全無欠のフォーメーション',
      'マインド＋5、テクニック＋5、サポート＋5。',
      {
        type: 'stats',
        stats: {
          mind: 5,
          technique: 5,
          support: 5
        }
      }
    ]
  ];

  const STRATEGY_ICONS = {
    D: 'icon/takd.png',
    C: 'icon/takc.png',
    B: 'icon/takb.png',
    A: 'icon/taka.png',
    S: 'icon/taks.png',
    SS: 'icon/takss.png'
  };

  const STRATEGIES =
    Object.fromEntries(
      STRATEGY_ROWS.map(
        ([
          id,
          code,
          rank,
          name,
          description,
          effect
        ]) => [
          id,
          {
            id,
            code,
            rank,
            name,
            description,

            /*
              旧コードとの互換用。
            */
            text: description,

            icon:
              STRATEGY_ICONS[rank],

            effect,

            unlimited:
              rank === 'D'
          }
        ]
      )
    );

  const STRATEGY_ORDER =
    STRATEGY_ROWS.map(
      (row) => row[0]
    );

  const STRATEGY_RANK_ORDER = [
    'D',
    'C',
    'B',
    'A',
    'S',
    'SS'
  ];

  const DEFAULT_STRATEGY_ID =
    'd01';

  const DEFAULT_STRATEGY_IDS =
    STRATEGY_ORDER.filter(
      (id) =>
        STRATEGIES[id].rank === 'D'
    );

  const STRATEGY_RULES = {
    equipmentRequired: false,

    allOwnedCarriedToTournament:
      true,

    defaultStrategyId:
      DEFAULT_STRATEGY_ID,

    fallbackStrategyId:
      DEFAULT_STRATEGY_ID,

    dUnlimited: true,

    higherRankUsesEqualStock:
      true,

    consumeOnBattleStart:
      true,

    iglStateIgnored:
      true
  };

  /* ============================================================
     5. コーチランク
  ============================================================ */

  function getCoachRankLevel(value) {
    if (
      value &&
      typeof value === 'object'
    ) {
      value =
        value.rankLevel ??
        value.rank;
    }

    const numeric =
      Number(value);

    if (
      Number.isFinite(numeric) &&
      numeric >= 1
    ) {
      return clampInt(
        numeric,
        1,
        COACH_RULES.maximumRankLevel
      );
    }

    const label =
      String(value || 'F1')
        .trim()
        .toUpperCase();

    const index =
      COACH_RANK_ORDER
        .indexOf(label);

    return index >= 0
      ? index + 1
      : 1;
  }

  function getCoachRank(value) {
    return (
      COACH_RANK_ORDER[
        getCoachRankLevel(value) - 1
      ] ||
      'F1'
    );
  }

  function getCoachPoints(value) {
    return (
      COACH_RULES.basePoints +
      (
        (
          getCoachRankLevel(value) - 1
        ) *
        COACH_RULES.pointsPerRank
      )
    );
  }

  function getCoachRankUpRate(value) {
    const level =
      getCoachRankLevel(value);

    if (
      level >=
      COACH_RULES.maximumRankLevel
    ) {
      return (
        COACH_RULES
          .rankUp
          .maximumRankRate
      );
    }

    return Math.max(
      COACH_RULES
        .rankUp
        .minimumRate,

      COACH_RULES
        .rankUp
        .initialRate -
      (
        (level - 1) *
        COACH_RULES
          .rankUp
          .decreasePerRank
      )
    );
  }

  function getCoachRankUpRatePercent(
    value
  ) {
    return Number(
      (
        getCoachRankUpRate(value) *
        100
      ).toFixed(1)
    );
  }

  function createOwnedCoach(
    coachId,
    overrides = {}
  ) {
    const definition =
      COACH_BY_ID[coachId] ||
      STARTER_COACH;

    const rankLevel =
      getCoachRankLevel(
        overrides.rankLevel ??
        overrides.rank ??
        definition.initialRank
      );

    return {
      id:
        definition.id,

      name:
        overrides.name ||
        definition.name,

      image:
        overrides.image ||
        definition.image,

      rankLevel,

      meetings:
        Math.max(
          0,
          Math.floor(
            Number(
              overrides.meetings
            ) || 0
          )
        )
    };
  }

  function getCoachDefinition(
    coachId
  ) {
    return (
      COACH_BY_ID[
        String(coachId || '')
      ] ||
      null
    );
  }

  function getCoachDialogue(
    coachId,
    random = Math.random
  ) {
    const coach =
      getCoachDefinition(coachId) ||
      STARTER_COACH;

    const lines =
      Array.isArray(coach.dialogue)
        ? coach.dialogue
        : [];

    return lines.length
      ? lines[
          randomIndex(
            lines.length,
            random
          )
        ]
      : '';
  }

  function evaluateCoachUnlock(
    coachId,
    context = {}
  ) {
    const coach =
      getCoachDefinition(coachId);

    if (!coach) {
      return {
        unlocked: false,
        reason: 'unknown_coach'
      };
    }

    const unlock =
      coach.unlock || {
        type: 'initial'
      };

    if (
      unlock.type === 'initial'
    ) {
      return {
        unlocked: true,
        current: 1,
        required: 1
      };
    }

    if (
      unlock.type ===
      'companyRank'
    ) {
      const current =
        typeof context
          .companyRankIndex ===
        'number'
          ? context.companyRankIndex + 1
          : GAME_API.rankNumber(
              context.companyRank ||
              'F1'
            );

      const required =
        Number(
          unlock.rankNumber || 1
        );

      return {
        unlocked:
          current >= required,

        current,
        required
      };
    }

    if (
      unlock.type === 'flag'
    ) {
      const current =
        Boolean(
          context.flags?.[
            unlock.flag
          ]
        );

      return {
        unlocked: current,
        current:
          current ? 1 : 0,
        required: 1
      };
    }

    return {
      unlocked: false,
      current: 0,
      required: 1
    };
  }

  /* ============================================================
     6. 作戦確率・抽選
  ============================================================ */

  function getStrategyProbability(
    totalCoachPoints
  ) {
    const points =
      clamp(
        totalCoachPoints,
        COACH_RULES.minimumPoints,
        COACH_RULES.maximumTeamPoints
      );

    let lower =
      STRATEGY_PROBABILITY_ANCHORS[0];

    let upper =
      STRATEGY_PROBABILITY_ANCHORS.at(-1);

    for (
      let index = 0;
      index <
      STRATEGY_PROBABILITY_ANCHORS
        .length - 1;
      index += 1
    ) {
      const current =
        STRATEGY_PROBABILITY_ANCHORS[
          index
        ];

      const next =
        STRATEGY_PROBABILITY_ANCHORS[
          index + 1
        ];

      if (
        points >= current.points &&
        points <= next.points
      ) {
        lower = current;
        upper = next;
        break;
      }
    }

    const ratio =
      lower.points === upper.points
        ? 0
        : (
            points - lower.points
          ) /
          (
            upper.points -
            lower.points
          );

    const probability = {};

    STRATEGY_MEETING
      .generatedRanks
      .forEach((rank) => {
        probability[rank] =
          Number(
            (
              lower[rank] +
              (
                (
                  upper[rank] -
                  lower[rank]
                ) *
                ratio
              )
            ).toFixed(1)
          );
      });

    const total =
      Object.values(
        probability
      ).reduce(
        (sum, value) =>
          sum + value,
        0
      );

    probability.C =
      Number(
        (
          probability.C +
          (100 - total)
        ).toFixed(1)
      );

    return probability;
  }

  function drawWeightedRank(
    probability,
    random = Math.random
  ) {
    const rows =
      STRATEGY_MEETING
        .generatedRanks
        .map((rank) => [
          rank,
          Math.max(
            0,
            Number(
              probability?.[rank]
            ) || 0
          )
        ])
        .filter(
          (row) =>
            row[1] > 0
        );

    const total =
      rows.reduce(
        (sum, row) =>
          sum + row[1],
        0
      );

    let cursor =
      clamp(
        random(),
        0,
        0.999999999
      ) *
      total;

    for (
      const [
        rank,
        weight
      ] of rows
    ) {
      cursor -= weight;

      if (cursor <= 0) {
        return rank;
      }
    }

    return (
      rows.at(-1)?.[0] ||
      'C'
    );
  }

  function drawStrategyId(
    rank,
    random = Math.random
  ) {
    const pool =
      STRATEGY_ORDER.filter(
        (id) =>
          STRATEGIES[id].rank ===
          rank
      );

    return pool.length
      ? pool[
          randomIndex(
            pool.length,
            random
          )
        ]
      : null;
  }

  /* ============================================================
     7. セーブ状態
  ============================================================ */

  function createCoachState() {
    const starter =
      createOwnedCoach(
        STARTER_COACH.id
      );

    return {
      activeId:
        starter.id,

      maxOwned:
        COACH_RULES.maximumOwned,

      owned: [
        starter
      ]
    };
  }

  function normalizeCoachState(
    coachState
  ) {
    const source =
      Array.isArray(
        coachState?.owned
      )
        ? coachState.owned
        : [];

    let owned =
      source.map(
        (entry, index) => {
          if (
            typeof entry ===
            'string'
          ) {
            const definition =
              COACH_BY_ID[entry];

            return definition
              ? createOwnedCoach(
                  entry
                )
              : {
                  id:
                    entry,

                  name:
                    entry === 'coach0'
                      ? STARTER_COACH.name
                      : `COACH ${index + 1}`,

                  image:
                    'Play/P1sup.png',

                  rankLevel: 1,
                  meetings: 0
                };
          }

          const id =
            entry?.id ||
            `coach${index}`;

          const definition =
            COACH_BY_ID[id];

          return definition
            ? createOwnedCoach(
                id,
                entry
              )
            : {
                id,

                name:
                  entry?.name ||
                  `COACH ${index + 1}`,

                image:
                  entry?.image ||
                  'Play/P1sup.png',

                rankLevel:
                  getCoachRankLevel(
                    entry?.rankLevel ??
                    entry?.rank
                  ),

                meetings:
                  Math.max(
                    0,
                    Math.floor(
                      Number(
                        entry?.meetings
                      ) || 0
                    )
                  )
              };
        }
      );

    if (!owned.length) {
      owned = [
        createOwnedCoach(
          STARTER_COACH.id
        )
      ];
    }

    owned =
      owned.slice(
        0,
        COACH_RULES.maximumOwned
      );

    const requestedActiveId =
      coachState?.activeId ||
      coachState?.active?.id;

    const activeId =
      owned.some(
        (coach) =>
          coach.id ===
          requestedActiveId
      )
        ? requestedActiveId
        : owned[0].id;

    return {
      activeId,

      maxOwned:
        COACH_RULES.maximumOwned,

      owned
    };
  }

  function getTotalCoachPoints(
    coachState
  ) {
    const normalized =
      normalizeCoachState(
        coachState
      );

    return normalized
      .owned
      .reduce(
        (sum, coach) =>
          sum +
          getCoachPoints(coach),
        0
      );
  }

  function createStrategyState() {
    return {
      owned: [
        ...DEFAULT_STRATEGY_IDS
      ],

      equipped: [],

      stock:
        Object.fromEntries(
          DEFAULT_STRATEGY_IDS.map(
            (id) => [
              id,
              null
            ]
          )
        ),

      meetingCount: 0,
      lastGeneratedId: ''
    };
  }

  function normalizeStrategyState(
    strategyState
  ) {
    const sourceOwned =
      Array.isArray(
        strategyState?.owned
      )
        ? strategyState
            .owned
            .filter(
              (id) =>
                STRATEGIES[id]
            )
        : [];

    const owned = [
      ...new Set([
        ...DEFAULT_STRATEGY_IDS,
        ...sourceOwned
      ])
    ];

    const oldStock =
      strategyState?.stock &&
      typeof strategyState.stock ===
        'object'
        ? strategyState.stock
        : {};

    const stock = {};

    owned.forEach((id) => {
      stock[id] =
        STRATEGIES[id].rank === 'D'
          ? null
          : Math.max(
              1,
              Math.floor(
                Number(
                  oldStock[id]
                ) || 1
              )
            );
    });

    return {
      owned,
      equipped: [],
      stock,

      meetingCount:
        Math.max(
          0,
          Math.floor(
            Number(
              strategyState
                ?.meetingCount
            ) || 0
          )
        ),

      lastGeneratedId:
        STRATEGIES[
          strategyState
            ?.lastGeneratedId
        ]
          ? strategyState
              .lastGeneratedId
          : ''
    };
  }

  function getStrategyStock(
    strategyState,
    strategyId
  ) {
    const strategy =
      STRATEGIES[strategyId];

    if (!strategy) {
      return 0;
    }

    if (
      strategy.rank === 'D'
    ) {
      return Infinity;
    }

    const normalized =
      normalizeStrategyState(
        strategyState
      );

    return Math.max(
      0,
      Math.floor(
        Number(
          normalized
            .stock[
              strategyId
            ]
        ) || 0
      )
    );
  }

  function canPayMeeting(
    currencies
  ) {
    return Object.entries(
      STRATEGY_MEETING.cost
    ).every(
      ([
        key,
        amount
      ]) =>
        (
          Number(
            currencies?.[key]
          ) || 0
        ) >= amount
    );
  }

  /* ============================================================
     8. 作戦会議実行
  ============================================================ */

  function executeStrategyMeeting({
    coachState,
    strategyState,
    currencies,
    random = Math.random
  } = {}) {
    const normalizedCoaches =
      normalizeCoachState(
        coachState
      );

    const normalizedStrategies =
      normalizeStrategyState(
        strategyState
      );

    const nextCurrencies = {
      coin:
        Math.max(
          0,
          Math.floor(
            Number(
              currencies?.coin
            ) || 0
          )
        ),

      diamond:
        Math.max(
          0,
          Math.floor(
            Number(
              currencies?.diamond
            ) || 0
          )
        ),

      ruby:
        Math.max(
          0,
          Math.floor(
            Number(
              currencies?.ruby
            ) || 0
          )
        )
    };

    if (
      !canPayMeeting(
        nextCurrencies
      )
    ) {
      return {
        success: false,

        reason:
          'insufficient_currency',

        coachState:
          normalizedCoaches,

        strategyState:
          normalizedStrategies,

        currencies:
          nextCurrencies
      };
    }

    Object.entries(
      STRATEGY_MEETING.cost
    ).forEach(
      ([
        key,
        amount
      ]) => {
        nextCurrencies[key] -=
          amount;
      }
    );

    const totalCoachPoints =
      getTotalCoachPoints(
        normalizedCoaches
      );

    const probability =
      getStrategyProbability(
        totalCoachPoints
      );

    const generatedRank =
      drawWeightedRank(
        probability,
        random
      );

    const strategyId =
      drawStrategyId(
        generatedRank,
        random
      );

    if (!strategyId) {
      return {
        success: false,

        reason:
          'strategy_pool_empty',

        coachState:
          normalizedCoaches,

        strategyState:
          normalizedStrategies,

        currencies:
          clone(
            currencies || {}
          )
      };
    }

    const isNew =
      !normalizedStrategies
        .owned
        .includes(strategyId);

    const previousStock =
      isNew
        ? 0
        : getStrategyStock(
            normalizedStrategies,
            strategyId
          );

    if (isNew) {
      normalizedStrategies
        .owned
        .push(strategyId);
    }

    normalizedStrategies
      .stock[
        strategyId
      ] =
      previousStock + 1;

    normalizedStrategies
      .meetingCount += 1;

    normalizedStrategies
      .lastGeneratedId =
      strategyId;

    const rankUps = [];

    normalizedCoaches
      .owned
      .forEach((coach) => {
        coach.meetings += 1;

        const beforeLevel =
          getCoachRankLevel(coach);

        const beforeRank =
          getCoachRank(coach);

        const rate =
          getCoachRankUpRate(coach);

        if (
          beforeLevel <
            COACH_RULES
              .maximumRankLevel &&
          clamp(
            random(),
            0,
            0.999999999
          ) < rate
        ) {
          coach.rankLevel =
            beforeLevel + 1;

          rankUps.push({
            id:
              coach.id,

            name:
              coach.name,

            image:
              coach.image,

            beforeRank,

            afterRank:
              getCoachRank(coach),

            afterPoints:
              getCoachPoints(coach),

            rate
          });
        }
      });

    return {
      success: true,

      coachState:
        normalizedCoaches,

      strategyState:
        normalizedStrategies,

      currencies:
        nextCurrencies,

      meeting: {
        totalCoachPoints,
        probability,
        generatedRank,
        strategyId,

        strategy:
          clone(
            STRATEGIES[
              strategyId
            ]
          ),

        isNew,
        previousStock,

        currentStock:
          normalizedStrategies
            .stock[
              strategyId
            ],

        cost:
          clone(
            STRATEGY_MEETING.cost
          ),

        rankUps
      }
    };
  }

  /* ============================================================
     9. 大会中の作戦在庫
  ============================================================ */

  function createTournamentStrategyStock(
    strategyState
  ) {
    const normalized =
      normalizeStrategyState(
        strategyState
      );

    return Object.fromEntries(
      normalized.owned.map(
        (id) => [
          id,

          STRATEGIES[id].rank ===
          'D'
            ? null
            : normalized.stock[id]
        ]
      )
    );
  }

  function canUseStrategy(
    tournamentStock,
    strategyId
  ) {
    const strategy =
      STRATEGIES[strategyId];

    if (!strategy) {
      return false;
    }

    return (
      strategy.rank === 'D' ||
      (
        Number(
          tournamentStock?.[
            strategyId
          ]
        ) || 0
      ) > 0
    );
  }

  function consumeStrategy(
    tournamentStock,
    strategyId
  ) {
    const strategy =
      STRATEGIES[strategyId];

    if (
      !strategy ||
      !canUseStrategy(
        tournamentStock,
        strategyId
      )
    ) {
      return {
        success: false,

        reason:
          'strategy_unavailable',

        stock:
          clone(
            tournamentStock ||
            {}
          )
      };
    }

    const nextStock =
      clone(
        tournamentStock ||
        {}
      );

    if (
      strategy.rank !== 'D'
    ) {
      nextStock[
        strategyId
      ] =
        Math.max(
          0,
          (
            Number(
              nextStock[
                strategyId
              ]
            ) || 0
          ) - 1
        );
    }

    return {
      success: true,
      strategyId,

      strategy:
        clone(strategy),

      stock:
        nextStock,

      remaining:
        strategy.rank === 'D'
          ? null
          : nextStock[
              strategyId
            ]
    };
  }

  function createTournamentCoachPayload(
    coachState,
    strategyState
  ) {
    const normalizedCoaches =
      normalizeCoachState(
        coachState
      );

    const normalizedStrategies =
      normalizeStrategyState(
        strategyState
      );

    return {
      coaches:
        normalizedCoaches
          .owned
          .map((coach) => ({
            ...clone(coach),

            rank:
              getCoachRank(coach),

            points:
              getCoachPoints(coach),

            rankUpRate:
              getCoachRankUpRate(
                coach
              )
          })),

      strategies: {
        owned: [
          ...normalizedStrategies
            .owned
        ],

        /*
          旧戦闘HTMLとの互換用。
          実際には装備不要で全所持作戦を持ち込む。
        */
        equipped: [
          ...normalizedStrategies
            .owned
        ],

        allCarried: true,

        defaultId:
          DEFAULT_STRATEGY_ID,

        definitions:
          clone(STRATEGIES),

        stock:
          createTournamentStrategyStock(
            normalizedStrategies
          ),

        rules:
          clone(
            STRATEGY_RULES
          )
      }
    };
  }

  /* ============================================================
     10. コーチ追加
  ============================================================ */

  function canAddCoach(
    coachState,
    coachId,
    context = {}
  ) {
    const normalized =
      normalizeCoachState(
        coachState
      );

    const definition =
      getCoachDefinition(
        coachId
      );

    if (!definition) {
      return {
        allowed: false,
        reason: 'unknown_coach'
      };
    }

    if (
      normalized
        .owned
        .some(
          (coach) =>
            coach.id === coachId
        )
    ) {
      return {
        allowed: false,
        reason: 'already_owned'
      };
    }

    if (
      normalized.owned.length >=
      COACH_RULES.maximumOwned
    ) {
      return {
        allowed: false,
        reason: 'coach_limit'
      };
    }

    const unlock =
      evaluateCoachUnlock(
        coachId,
        context
      );

    if (!unlock.unlocked) {
      return {
        allowed: false,
        reason: 'locked',
        unlock
      };
    }

    return {
      allowed: true,

      definition:
        clone(definition),

      unlock
    };
  }

  function addCoach(
    coachState,
    coachId,
    context = {}
  ) {
    const normalized =
      normalizeCoachState(
        coachState
      );

    const check =
      canAddCoach(
        normalized,
        coachId,
        context
      );

    if (!check.allowed) {
      return {
        success: false,
        reason: check.reason,
        coachState: normalized,
        unlock: check.unlock
      };
    }

    normalized
      .owned
      .push(
        createOwnedCoach(
          coachId
        )
      );

    return {
      success: true,

      coachState:
        normalized,

      addedCoach:
        clone(
          normalized
            .owned
            .at(-1)
        )
    };
  }

  /* ============================================================
     11. 検証
  ============================================================ */

  function validateCoachData() {
    const errors = [];
    const warnings = [];

    if (
      COACH_RANK_ORDER.length !==
      72
    ) {
      errors.push(
        `コーチランク数が72ではありません: ${
          COACH_RANK_ORDER.length
        }`
      );
    }

    if (
      getCoachPoints(1) !== 10 ||
      getCoachPoints(72) !== 365
    ) {
      errors.push(
        'コーチポイント範囲が10～365ではありません。'
      );
    }

    if (
      STRATEGY_ORDER.length !==
      50
    ) {
      errors.push(
        `作戦数が50ではありません: ${
          STRATEGY_ORDER.length
        }`
      );
    }

    const expectedCounts = {
      D: 5,
      C: 13,
      B: 11,
      A: 9,
      S: 7,
      SS: 5
    };

    Object.entries(
      expectedCounts
    ).forEach(
      ([
        rank,
        expected
      ]) => {
        const actual =
          STRATEGY_ORDER.filter(
            (id) =>
              STRATEGIES[id].rank ===
              rank
          ).length;

        if (
          actual !== expected
        ) {
          errors.push(
            `${rank}作戦数が${expected}ではありません: ${actual}`
          );
        }
      }
    );

    if (
      new Set(
        STRATEGY_ORDER
      ).size !==
      STRATEGY_ORDER.length
    ) {
      errors.push(
        '作戦IDが重複しています。'
      );
    }

    STRATEGY_PROBABILITY_ANCHORS
      .forEach((anchor) => {
        const total =
          STRATEGY_MEETING
            .generatedRanks
            .reduce(
              (sum, rank) =>
                sum +
                anchor[rank],
              0
            );

        if (total !== 100) {
          errors.push(
            `${anchor.points}PTの作戦確率合計が100ではありません: ${total}`
          );
        }
      });

    if (!STARTER_COACH) {
      errors.push(
        '初期コーチが設定されていません。'
      );
    }

    if (
      COACH_DEFINITIONS.filter(
        (coach) =>
          coach.starter
      ).length > 1
    ) {
      warnings.push(
        'starter:trueのコーチが複数います。最初の1人を使用します。'
      );
    }

    return {
      valid:
        errors.length === 0,

      errors,
      warnings,

      counts: {
        coaches:
          COACH_DEFINITIONS.length,

        coachRanks:
          COACH_RANK_ORDER.length,

        strategies:
          STRATEGY_ORDER.length
      }
    };
  }

  const validation =
    validateCoachData();

  if (!validation.valid) {
    throw new Error(
      validation.errors.join(
        '\n'
      )
    );
  }

  /* ============================================================
     12. 公開
  ============================================================ */

  const COACH_DATA =
    freeze({
      version: '1.0.0',

      rules:
        COACH_RULES,

      definitions:
        COACH_DEFINITIONS,

      coachById:
        COACH_BY_ID,

      starterCoachId:
        STARTER_COACH.id,

      rankOrder:
        COACH_RANK_ORDER,

      meeting:
        STRATEGY_MEETING,

      strategyProbabilityAnchors:
        STRATEGY_PROBABILITY_ANCHORS,

      strategies:
        STRATEGIES,

      strategyOrder:
        STRATEGY_ORDER,

      strategyRankOrder:
        STRATEGY_RANK_ORDER,

      strategyIcons:
        STRATEGY_ICONS,

      defaultStrategyIds:
        DEFAULT_STRATEGY_IDS,

      strategyRules:
        STRATEGY_RULES
    });

  const COACH_API =
    Object.freeze({
      getCoachRankLevel,
      getCoachRank,
      getCoachPoints,

      getCoachRankUpRate,
      getCoachRankUpRatePercent,

      createOwnedCoach,
      getCoachDefinition,
      getCoachDialogue,
      evaluateCoachUnlock,

      getStrategyProbability,
      drawWeightedRank,
      drawStrategyId,

      createCoachState,
      normalizeCoachState,
      getTotalCoachPoints,

      createStrategyState,
      normalizeStrategyState,
      getStrategyStock,

      canPayMeeting,
      executeStrategyMeeting,

      createTournamentStrategyStock,
      canUseStrategy,
      consumeStrategy,

      createTournamentCoachPayload,

      canAddCoach,
      addCoach,

      validateCoachData
    });

  MOBBR.DATA.coach =
    COACH_DATA;

  MOBBR.API.coach =
    COACH_API;

  global.MOBBR_COACH_DATA =
    COACH_DATA;

  global.MOBBR_COACH_API =
    COACH_API;
})(
  typeof window !== 'undefined'
    ? window
    : globalThis
);
