'use strict';

/**
 * MOB BR - game-data.js
 * ------------------------------------------------------------
 * ゲーム全体で共有する基礎データと計算関数。
 *
 * 読み込み順:
 *   1. data/game-data.js
 *   2. data/ability-data.js
 *   3. data/training-data.js
 *   4. data/coach-data.js
 *   5. data/cpu-data.js
 *   6. data/card-data.js
 *   7. data/shop-data.js
 *   8. app.js
 *
 * app.js からは以下を使用する。
 *   MOBBR.DATA.game
 *   MOBBR.API.game
 */
(function initializeGameData(global) {
  const MOBBR = global.MOBBR = global.MOBBR || {};
  MOBBR.DATA = MOBBR.DATA || {};
  MOBBR.API = MOBBR.API || {};

  /* ============================================================
     1. 内部共通関数
  ============================================================ */

  function clone(value) {
    if (typeof structuredClone === 'function') {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
      return value;
    }

    Object.freeze(value);
    Object.values(value).forEach(deepFreeze);

    return value;
  }

  function clampInteger(value, min, max) {
    const number = Math.floor(Number(value));

    if (!Number.isFinite(number)) {
      return min;
    }

    return Math.max(min, Math.min(max, number));
  }

  function normalizeTier(tier) {
    const value = String(tier || '')
      .trim()
      .toLowerCase();

    if (value === 'champ' || value === 'championship') {
      return 'championship';
    }

    if (
      value === 'local' ||
      value === 'national' ||
      value === 'world'
    ) {
      return value;
    }

    return '';
  }

  /* ============================================================
     2. アプリ・保存キー
  ============================================================ */

  const APP = {
    id: 'mob-br',
    title: 'MOB BR',
    version: '9.1-github.1',
    dataVersion: '1.0.0',
    saveSchemaVersion: 2,
    locale: 'ja-JP',
    firstYear: 1989
  };

  const STORAGE_KEYS = {
    sharedSave: 'mob_br_shared_save_v1',
    legacyMainSave: 'mob_br_main_ui_prototype_v2',
    tournamentInput: 'mob_br_tournament_input_v1',
    tournamentOutput: 'mob_br_tournament_output_v1',
    settings: 'mob_br_settings_v1'
  };

  const TOURNAMENT_BRIDGE = {
    inputSchema: 'mob_br_tournament_input_v1',
    outputSchema: 'mob_br_tournament_output_v1',
    battlePage: './battle/index.html',
    mainPage: '../index.html'
  };

  /* ============================================================
     3. 役職・能力・育成ポイントの共通名称
  ============================================================ */

  const ROLES = {
    IGL: {
      id: 'IGL',
      label: 'IGL',
      playerId: 'p1',
      icon: 'icon/IGL.png',
      defaultImage: 'Play/P1igl.png'
    },

    ATK: {
      id: 'ATK',
      label: 'ATK',
      playerId: 'p2',
      icon: 'icon/atk.png',
      defaultImage: 'Play/P1atk.png'
    },

    SUP: {
      id: 'SUP',
      label: 'SUP',
      playerId: 'p3',
      icon: 'icon/supi.png',
      defaultImage: 'Play/P1sup.png'
    }
  };

  const ROLE_ORDER = [
    'IGL',
    'ATK',
    'SUP'
  ];

  const STATS = {
    stamina: {
      id: 'stamina',
      name: 'スタミナ',
      icon: 'icon/sta.png'
    },

    mind: {
      id: 'mind',
      name: 'マインド',
      icon: 'icon/mind.png'
    },

    physical: {
      id: 'physical',
      name: 'フィジカル',
      icon: 'icon/phy.png'
    },

    aim: {
      id: 'aim',
      name: 'エイム',
      icon: 'icon/aim.png'
    },

    agility: {
      id: 'agility',
      name: 'アジリティ',
      icon: 'icon/agi.png'
    },

    technique: {
      id: 'technique',
      name: 'テクニック',
      icon: 'icon/teq.png'
    },

    support: {
      id: 'support',
      name: 'サポート',
      icon: 'icon/sup.png'
    }
  };

  const STAT_ORDER = [
    'stamina',
    'mind',
    'physical',
    'aim',
    'agility',
    'technique',
    'support'
  ];

  const TRAINING_POINTS = {
    power: {
      id: 'power',
      name: 'パワー',
      shortName: 'パ'
    },

    tech: {
      id: 'tech',
      name: '技術',
      shortName: '技'
    },

    mental: {
      id: 'mental',
      name: 'メンタル',
      shortName: 'メ'
    },

    shoot: {
      id: 'shoot',
      name: '射撃',
      shortName: '射'
    }
  };

  const TRAINING_POINT_ORDER = [
    'power',
    'tech',
    'mental',
    'shoot'
  ];

  /* ============================================================
     4. 通貨
  ============================================================ */

  const CURRENCIES = {
    coin: {
      id: 'coin',
      name: 'コイン',
      icon: 'icon/coin.png',
      initial: 120000,
      integer: true,
      minimum: 0
    },

    diamond: {
      id: 'diamond',
      name: 'ダイヤ',
      icon: 'icon/daia.png',
      initial: 300,
      integer: true,
      minimum: 0
    },

    ruby: {
      id: 'ruby',
      name: 'ルビー',
      icon: 'icon/rubi.png',
      initial: 50,
      integer: true,
      minimum: 0
    }
  };

  const CURRENCY_ORDER = [
    'coin',
    'diamond',
    'ruby'
  ];

  /* ============================================================
     5. 企業ランク F1～SS9
  ============================================================ */

  const COMPANY_TIERS = [
    'F',
    'E',
    'D',
    'C',
    'B',
    'A',
    'S',
    'SS'
  ];

  const LEVELS_PER_TIER = 9;

  const COMPANY_RANK_ORDER = COMPANY_TIERS.flatMap((tier) =>
    Array.from(
      { length: LEVELS_PER_TIER },
      (_, index) => `${tier}${index + 1}`
    )
  );

  const COMPANY_RANK = {
    tiers: COMPANY_TIERS,
    levelsPerTier: LEVELS_PER_TIER,
    order: COMPANY_RANK_ORDER,

    minimumIndex: 0,
    maximumIndex: COMPANY_RANK_ORDER.length - 1,

    minimumRank: COMPANY_RANK_ORDER[0],
    maximumRank: COMPANY_RANK_ORDER[
      COMPANY_RANK_ORDER.length - 1
    ],

    /*
      F1→F2は1EXP
      F2→F3は2EXP
      SS8→SS9は71EXP
    */
    expRule: 'CURRENT_RANK_INDEX_PLUS_1',

    weeklyRewardByTier: {
      F: {
        baseCoin: 10000,
        coinStep: 1000,
        diamond: 10,
        ruby: 1
      },

      E: {
        baseCoin: 19000,
        coinStep: 2000,
        diamond: 15,
        ruby: 2
      },

      D: {
        baseCoin: 37000,
        coinStep: 3000,
        diamond: 20,
        ruby: 3
      },

      C: {
        baseCoin: 64000,
        coinStep: 5000,
        diamond: 25,
        ruby: 4
      },

      B: {
        baseCoin: 109000,
        coinStep: 7000,
        diamond: 30,
        ruby: 5
      },

      A: {
        baseCoin: 172000,
        coinStep: 10000,
        diamond: 35,
        ruby: 6
      },

      S: {
        baseCoin: 262000,
        coinStep: 30000,
        diamond: 40,
        ruby: 7
      },

      SS: {
        baseCoin: 532000,
        coinStep: 50000,
        diamond: 50,
        ruby: 10
      }
    },

    /*
      到達したランクのティアに応じた報酬。
    */
    rankUpRewardByReachedTier: {
      F: {
        coin: 10000,
        diamond: 30,
        ruby: 3
      },

      E: {
        coin: 20000,
        diamond: 40,
        ruby: 5
      },

      D: {
        coin: 30000,
        diamond: 50,
        ruby: 5
      },

      C: {
        coin: 50000,
        diamond: 50,
        ruby: 5
      },

      B: {
        coin: 75000,
        diamond: 75,
        ruby: 10
      },

      A: {
        coin: 100000,
        diamond: 100,
        ruby: 20
      },

      S: {
        coin: 500000,
        diamond: 150,
        ruby: 30
      },

      SS: {
        coin: 1000000,
        diamond: 300,
        ruby: 50
      }
    }
  };

  /* ============================================================
     6. 週間ボーナス
  ============================================================ */

  const WEEKLY_BONUS = {
    claimLimitPerCalendarWeek: 1,
    claimAfterNewGameOnboarding: true,

    cardCollectionCoinBonus: {
      /*
        新規カード1種類につき週間コイン+1%。
      */
      percentPerUniqueCard: 1,

      /*
        同一カードの+値1につき週間コイン+0.1%。
      */
      percentPerPlusLevel: 0.1,
      maximumPlusLevel: 9
    },

    badgeTrainingBonus: {
      /*
        バッジ1種類につきトレーニング獲得ポイント+1%。
      */
      percentPerUniqueBadge: 1,
      percentPerPlusLevel: 0.1,
      maximumPlusLevel: 9
    }
  };

  /* ============================================================
     7. カレンダー・大会日程
  ============================================================ */

  const CALENDAR = {
    initial: {
      year: 1989,
      month: 1,
      week: 1
    },

    monthsPerYear: 12,
    weeksPerMonth: 4,

    championship: {
      firstYear: 1991,
      intervalYears: 3,
      month: 12,
      week: 4,

      cycleStartYear: 1989,
      qualifyingTeamCount: 20,
      worldFinalsPerCycle: 6
    }
  };

  const TOURNAMENT_TIER_META = {
    local: {
      id: 'local',
      name: 'LOCAL',
      label: 'Local',
      icon: 'icon/local.png',
      background: 'back/local.png',
      badgePackId: 'lb'
    },

    national: {
      id: 'national',
      name: 'NATIONAL',
      label: 'National',
      icon: 'icon/national.png',
      background: 'back/national.png',
      badgePackId: 'nb'
    },

    world: {
      id: 'world',
      name: 'WORLD',
      label: 'World',
      icon: 'icon/world.png',
      background: 'back/world.png',
      badgePackId: 'wb'
    },

    championship: {
      id: 'championship',
      name: 'CHAMPIONSHIP',
      label: 'Championship',
      icon: 'icon/champ.png',
      background: 'back/champ.png',
      badgePackId: null
    }
  };

  const BASE_TOURNAMENT_SCHEDULE = [
    {
      id: 'sp1_local',
      month: 4,
      week: 1,
      tier: 'local',
      split: 1,
      stage: 1,
      finalStage: true,
      name: 'SP1 LOCAL'
    },

    {
      id: 'sp1_national_week1',
      month: 5,
      week: 1,
      tier: 'national',
      split: 1,
      stage: 1,
      finalStage: false,
      name: 'SP1 NATIONAL 1週目'
    },

    {
      id: 'sp1_national_week2',
      month: 5,
      week: 2,
      tier: 'national',
      split: 1,
      stage: 2,
      finalStage: true,
      name: 'SP1 NATIONAL 2週目'
    },

    {
      id: 'sp1_world_week1',
      month: 6,
      week: 1,
      tier: 'world',
      split: 1,
      stage: 1,
      finalStage: false,
      name: 'SP1 WORLD 予選1週目'
    },

    {
      id: 'sp1_world_week2',
      month: 6,
      week: 2,
      tier: 'world',
      split: 1,
      stage: 2,
      finalStage: false,
      name: 'SP1 WORLD 予選2週目・LAST CHANCE'
    },

    {
      id: 'sp1_world_final',
      month: 6,
      week: 3,
      tier: 'world',
      split: 1,
      stage: 3,
      finalStage: true,
      name: 'SP1 WORLD FINAL'
    },

    {
      id: 'sp2_local',
      month: 8,
      week: 1,
      tier: 'local',
      split: 2,
      stage: 1,
      finalStage: true,
      name: 'SP2 LOCAL'
    },

    {
      id: 'sp2_national_week1',
      month: 9,
      week: 1,
      tier: 'national',
      split: 2,
      stage: 1,
      finalStage: false,
      name: 'SP2 NATIONAL 1週目'
    },

    {
      id: 'sp2_national_week2',
      month: 9,
      week: 2,
      tier: 'national',
      split: 2,
      stage: 2,
      finalStage: true,
      name: 'SP2 NATIONAL 2週目'
    },

    {
      id: 'sp2_world_week1',
      month: 12,
      week: 1,
      tier: 'world',
      split: 2,
      stage: 1,
      finalStage: false,
      name: 'SP2 WORLD 予選1週目'
    },

    {
      id: 'sp2_world_week2',
      month: 12,
      week: 2,
      tier: 'world',
      split: 2,
      stage: 2,
      finalStage: false,
      name: 'SP2 WORLD 予選2週目・LAST CHANCE'
    },

    {
      id: 'sp2_world_final',
      month: 12,
      week: 3,
      tier: 'world',
      split: 2,
      stage: 3,
      finalStage: true,
      name: 'SP2 WORLD FINAL'
    }
  ];

  /* ============================================================
     8. 大会共通形式・順位ポイント
  ============================================================ */

  const TOURNAMENT_FORMAT = {
    teamSize: 3,
    requiredRoles: ROLE_ORDER,

    matchesPerTournament: 5,
    battleTimeLimitSeconds: 10,

    distanceLanes: [
      'close',
      'mid',
      'far'
    ],

    rounds: [
      {
        round: 1,
        startTeams: 20,
        endTeams: 15,
        encounterRate: 1.00
      },

      {
        round: 2,
        startTeams: 15,
        endTeams: 10,
        encounterRate: 0.70
      },

      {
        round: 3,
        startTeams: 10,
        endTeams: 6,
        encounterRate: 0.75
      },

      {
        round: 4,
        startTeams: 6,
        endTeams: 4,
        encounterRate: 1.00
      },

      {
        round: 5,
        startTeams: 4,
        endTeams: 2,
        encounterRate: 1.00
      },

      {
        round: 6,
        startTeams: 2,
        endTeams: 1,
        encounterRate: 1.00
      }
    ],

    scoring: {
      placementPoints: {
        1: 15,
        2: 12,
        3: 10,
        4: 8,
        5: 7,
        6: 6,
        7: 5,
        8: 4,
        9: 3,
        10: 2,
        11: 1,
        12: 1
      },

      pointPerKill: 1
    },

    downRules: {
      downHpRate: 0.10,
      onlySupportCanRevive: true,

      afterBattleRecovery: {
        downed: 0.30,
        notDowned: 0.40
      }
    },

    skillRules: {
      ultimateEnabled: false,
      skillCountPerPlayer: 3,
      automaticActivationByCt: true,

      /*
        大会開始時のみCTを初期化。
        大会中は戦闘終了後もCTを保持する。
      */
      ctCarriesAcrossBattlesInTournament: true,
      ctResetsOnlyAtTournamentStart: true,
      ctPausesWhileDown: true
    }
  };

  /* ============================================================
     9. 大会順位報酬

     abilityPoints.mode = "each"
     パワー・技術・メンタル・射撃へ
     同じ値をそれぞれ付与する。
  ============================================================ */

  function eachAbilityPoints(amount) {
    return {
      mode: 'each',
      amount
    };
  }

  const EMPTY_REWARD = {
    coin: 0,
    diamond: 0,
    ruby: 0,
    companyExp: 0,
    abilityPoints: eachAbilityPoints(0),
    badgePacks: {}
  };

  const TOURNAMENT_REWARD_TABLE = {
    local: [
      {
        minPlacement: 1,
        maxPlacement: 1,

        reward: {
          coin: 100000,
          diamond: 50,
          ruby: 30,

          companyExp: 30,
          abilityPoints: eachAbilityPoints(100),

          badgePacks: {
            lb: 10
          }
        }
      },

      {
        minPlacement: 2,
        maxPlacement: 2,

        reward: {
          coin: 50000,
          diamond: 25,
          ruby: 15,

          companyExp: 15,
          abilityPoints: eachAbilityPoints(50),

          badgePacks: {
            lb: 7
          }
        }
      },

      {
        minPlacement: 3,
        maxPlacement: 3,

        reward: {
          coin: 30000,
          diamond: 15,
          ruby: 10,

          companyExp: 12,
          abilityPoints: eachAbilityPoints(30),

          badgePacks: {
            lb: 5
          }
        }
      },

      {
        minPlacement: 4,
        maxPlacement: 6,

        reward: {
          coin: 10000,
          diamond: 10,
          ruby: 5,

          companyExp: 8,
          abilityPoints: eachAbilityPoints(20),

          badgePacks: {
            lb: 3
          }
        }
      },

      {
        minPlacement: 7,
        maxPlacement: 10,

        reward: {
          coin: 5000,
          diamond: 5,
          ruby: 3,

          companyExp: 5,
          abilityPoints: eachAbilityPoints(10),

          badgePacks: {
            lb: 2
          }
        }
      },

      {
        minPlacement: 11,
        maxPlacement: null,

        reward: {
          coin: 3000,
          diamond: 3,
          ruby: 1,

          companyExp: 1,
          abilityPoints: eachAbilityPoints(5),

          badgePacks: {
            lb: 1
          }
        }
      }
    ],

    national: [
      {
        minPlacement: 1,
        maxPlacement: 1,

        reward: {
          coin: 1000000,
          diamond: 500,
          ruby: 300,

          companyExp: 100,
          abilityPoints: eachAbilityPoints(150),

          badgePacks: {
            nb: 10
          }
        }
      },

      {
        minPlacement: 2,
        maxPlacement: 2,

        reward: {
          coin: 500000,
          diamond: 250,
          ruby: 150,

          companyExp: 75,
          abilityPoints: eachAbilityPoints(100),

          badgePacks: {
            nb: 7
          }
        }
      },

      {
        minPlacement: 3,
        maxPlacement: 3,

        reward: {
          coin: 300000,
          diamond: 150,
          ruby: 100,

          companyExp: 50,
          abilityPoints: eachAbilityPoints(75),

          badgePacks: {
            nb: 5
          }
        }
      },

      {
        minPlacement: 4,
        maxPlacement: 6,

        reward: {
          coin: 100000,
          diamond: 100,
          ruby: 50,

          companyExp: 30,
          abilityPoints: eachAbilityPoints(50),

          badgePacks: {
            nb: 3
          }
        }
      },

      {
        minPlacement: 7,
        maxPlacement: 10,

        reward: {
          coin: 50000,
          diamond: 50,
          ruby: 30,

          companyExp: 20,
          abilityPoints: eachAbilityPoints(30),

          badgePacks: {
            nb: 2
          }
        }
      },

      {
        minPlacement: 11,
        maxPlacement: 20,

        reward: {
          coin: 30000,
          diamond: 30,
          ruby: 10,

          companyExp: 15,
          abilityPoints: eachAbilityPoints(20),

          badgePacks: {
            nb: 1
          }
        }
      },

      {
        minPlacement: 21,
        maxPlacement: null,

        reward: {
          coin: 3000,
          diamond: 3,
          ruby: 1,

          companyExp: 10,
          abilityPoints: eachAbilityPoints(10),

          badgePacks: {
            nb: 1
          }
        }
      }
    ],

    world: [
      {
        minPlacement: 1,
        maxPlacement: 1,

        reward: {
          coin: 10000000,
          diamond: 5000,
          ruby: 1000,

          companyExp: 1000,
          abilityPoints: eachAbilityPoints(300),

          badgePacks: {
            wb: 10
          }
        }
      },

      {
        minPlacement: 2,
        maxPlacement: 2,

        reward: {
          coin: 5000000,
          diamond: 800,
          ruby: 500,

          companyExp: 500,
          abilityPoints: eachAbilityPoints(150),

          badgePacks: {
            wb: 7
          }
        }
      },

      {
        minPlacement: 3,
        maxPlacement: 3,

        reward: {
          coin: 3000000,
          diamond: 500,
          ruby: 250,

          companyExp: 250,
          abilityPoints: eachAbilityPoints(100),

          badgePacks: {
            wb: 5
          }
        }
      },

      {
        minPlacement: 4,
        maxPlacement: 6,

        reward: {
          coin: 500000,
          diamond: 300,
          ruby: 150,

          companyExp: 100,
          abilityPoints: eachAbilityPoints(50),

          badgePacks: {
            wb: 3
          }
        }
      },

      {
        minPlacement: 7,
        maxPlacement: 10,

        reward: {
          coin: 250000,
          diamond: 100,
          ruby: 100,

          companyExp: 50,
          abilityPoints: eachAbilityPoints(30),

          badgePacks: {
            wb: 2
          }
        }
      },

      {
        minPlacement: 11,
        maxPlacement: 20,

        reward: {
          coin: 100000,
          diamond: 50,
          ruby: 50,

          companyExp: 25,
          abilityPoints: eachAbilityPoints(15),

          badgePacks: {
            wb: 1
          }
        }
      },

      {
        minPlacement: 21,
        maxPlacement: null,

        reward: {
          coin: 10000,
          diamond: 5,
          ruby: 5,

          companyExp: 10,
          abilityPoints: eachAbilityPoints(10),

          badgePacks: {
            wb: 1
          }
        }
      }
    ],

    championship: [
      {
        minPlacement: 1,
        maxPlacement: 1,

        reward: {
          coin: 100000000,
          diamond: 10000,
          ruby: 10000,

          companyExp: 10000,
          abilityPoints: eachAbilityPoints(0),

          badgePacks: {
            lb: 30,
            nb: 30,
            wb: 30
          }
        }
      }
    ]
  };

  /* ============================================================
     10. Championshipポイント

     World Finalの順位から、
     3年間6大会分を加算する。
  ============================================================ */

  const CHAMPIONSHIP_POINTS = {
    byWorldFinalPlacement: {
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
    },

    defaultOutsideTop10: 0
  };

  /* ============================================================
     11. ルーム解放
  ============================================================ */

  const ROOMS = [
    {
      id: 'room01',
      unlockRankNumber: 1,
      image: 'room/01.png',
      name: 'MOB BR',
      price: 0
    },

    {
      id: 'room02',
      unlockRankNumber: 2,
      image: 'room/02.png',
      name: 'MOB BR ピンクカラーモデル',
      price: 100000
    },

    {
      id: 'room03',
      unlockRankNumber: 3,
      image: 'room/03.png',
      name: 'MOB BR ブルーカラーモデル',
      price: 100000
    },

    {
      id: 'room04',
      unlockRankNumber: 5,
      image: 'room/04.png',
      name: 'モブイルカエルモデル',
      price: 500000
    },

    {
      id: 'room05',
      unlockRankNumber: 10,
      image: 'room/05.png',
      name: 'モブメイルモデル',
      price: 500000
    },

    {
      id: 'room06',
      unlockRankNumber: 15,
      image: 'room/06.png',
      name: 'モブデンデンモデル',
      price: 1000000
    },

    {
      id: 'room07',
      unlockRankNumber: 15,
      image: 'room/07.png',
      name: 'モブマニーモデル',
      price: 1000000
    },

    {
      id: 'room08',
      unlockRankNumber: 15,
      image: 'room/08.png',
      name: 'モブドラゴンモデル',
      price: 1000000
    },

    {
      id: 'room09',
      unlockRankNumber: 15,
      image: 'room/09.png',
      name: 'ミラモブモデル',
      price: 1000000
    },

    {
      id: 'room10',
      unlockRankNumber: 20,
      image: 'room/10.png',
      name: 'モブテツモデル',
      price: 1000000
    },

    {
      id: 'room11',
      unlockRankNumber: 20,
      image: 'room/11.png',
      name: 'モブリリスモデル',
      price: 3000000
    },

    {
      id: 'room12',
      unlockRankNumber: 20,
      image: 'room/12.png',
      name: 'あのヒーローモデル',
      price: 5000000
    },

    {
      id: 'room13',
      unlockRankNumber: 30,
      image: 'room/13.png',
      name: 'アサモブモデル',
      price: 10000000
    },

    {
      id: 'room14',
      unlockRankNumber: 30,
      image: 'room/14.png',
      name: 'ネコクーモデル',
      price: 10000000
    },

    {
      id: 'room15',
      unlockRankNumber: 30,
      image: 'room/15.png',
      name: 'PB2 Vol.62 モデル',
      price: 10000000
    },

    {
      id: 'room16',
      unlockRankNumber: 30,
      image: 'room/16.png',
      name: 'MOB PARTY モデル',
      price: 10000000
    }
  ];

  /* ============================================================
     12. 初期セーブの共通部分

     players
     training
     coach
     collection
     inventory

     上記の詳細は後続データとapp.jsが追加する。
  ============================================================ */

  const BASE_STATE_TEMPLATE = {
    schemaVersion: APP.saveSchemaVersion,
    appVersion: APP.version,

    calendar: clone(CALENDAR.initial),

    onboarding: {
      completed: false,
      introSeen: false
    },

    company: {
      baseName: 'CB MEMORY',
      name: 'CB MEMORY',

      rankIndex: 0,
      exp: 0,

      badgeId: 'b1',
      badgeChangeHistory: [],

      lastWeeklyKey: '',
      weeklyHistory: [],
      rankHistory: []
    },

    currencies: Object.fromEntries(
      CURRENCY_ORDER.map((id) => [
        id,
        CURRENCIES[id].initial
      ])
    ),

    flags: {
      nationalTop5: false,
      worldTop5: false
    },

    records: {
      tournaments: [],

      companyTournamentStats: {
        local: {
          top5: 0,
          wins: 0
        },

        national: {
          top5: 0,
          wins: 0
        },

        world: {
          top5: 0,
          wins: 0
        },

        championship: {
          wins: 0
        }
      },

      playerCareer: {},

      championship: {
        cycleStartYear:
          CALENDAR.championship.cycleStartYear,

        teams: {},
        worldFinals: []
      }
    },

    shared: {
      pendingTournament: null,
      lastTournamentImportId: '',
      completedEventKeys: []
    },

    ui: {
      currentScreen: 'title',
      selectedPlayerId: 'p1'
    },

    admin: false
  };

  /* ============================================================
     13. 公開API - 企業ランク
  ============================================================ */

  function rankFromIndex(index) {
    const safeIndex = clampInteger(
      index,
      COMPANY_RANK.minimumIndex,
      COMPANY_RANK.maximumIndex
    );

    return COMPANY_RANK.order[safeIndex];
  }

  function rankToIndex(rank) {
    const normalizedRank = String(rank || '')
      .toUpperCase();

    const index = COMPANY_RANK.order.indexOf(
      normalizedRank
    );

    return index >= 0 ? index : 0;
  }

  function rankTier(rankOrIndex) {
    const rank = typeof rankOrIndex === 'number'
      ? rankFromIndex(rankOrIndex)
      : rankFromIndex(rankToIndex(rankOrIndex));

    return rank.replace(/[0-9]/g, '');
  }

  function rankLevel(rankOrIndex) {
    const rank = typeof rankOrIndex === 'number'
      ? rankFromIndex(rankOrIndex)
      : rankFromIndex(rankToIndex(rankOrIndex));

    const match = rank.match(/[0-9]+/);

    return match
      ? Number(match[0])
      : 1;
  }

  function rankNumber(rankOrIndex) {
    const index = typeof rankOrIndex === 'number'
      ? clampInteger(
          rankOrIndex,
          0,
          COMPANY_RANK.maximumIndex
        )
      : rankToIndex(rankOrIndex);

    return index + 1;
  }

  function expNeededForNextRank(rankOrIndex) {
    const index = typeof rankOrIndex === 'number'
      ? clampInteger(
          rankOrIndex,
          0,
          COMPANY_RANK.maximumIndex
        )
      : rankToIndex(rankOrIndex);

    if (index >= COMPANY_RANK.maximumIndex) {
      return 0;
    }

    return index + 1;
  }

  function getRankUpReward(reachedRankOrIndex) {
    const tier = rankTier(reachedRankOrIndex);

    return clone(
      COMPANY_RANK.rankUpRewardByReachedTier[tier]
    );
  }

  function getWeeklyBaseReward(rankOrIndex) {
    const tier = rankTier(rankOrIndex);
    const level = rankLevel(rankOrIndex);
    const rule = COMPANY_RANK.weeklyRewardByTier[tier];

    return {
      coin:
        rule.baseCoin +
        ((level - 1) * rule.coinStep),

      diamond: rule.diamond,
      ruby: rule.ruby
    };
  }

  /* ============================================================
     14. 公開API - コレクション補正・週間報酬
  ============================================================ */

  function collectionBonusRate(collection, rule) {
    if (
      !collection ||
      typeof collection !== 'object'
    ) {
      return 0;
    }

    return Object.values(collection).reduce(
      (total, entry) => {
        if (!entry) {
          return total;
        }

        const plus = clampInteger(
          entry.plus || 0,
          0,
          rule.maximumPlusLevel
        );

        return (
          total +
          rule.percentPerUniqueCard +
          (plus * rule.percentPerPlusLevel)
        );
      },
      0
    );
  }

  function calculateCardWeeklyBonusRate(cards) {
    const rule =
      WEEKLY_BONUS.cardCollectionCoinBonus;

    return collectionBonusRate(cards, rule);
  }

  function calculateBadgeTrainingBonusRate(badges) {
    const sourceRule =
      WEEKLY_BONUS.badgeTrainingBonus;

    const normalizedRule = {
      ...sourceRule,

      percentPerUniqueCard:
        sourceRule.percentPerUniqueBadge
    };

    return collectionBonusRate(
      badges,
      normalizedRule
    );
  }

  function getWeeklyReward(rankOrIndex, cards) {
    const base = getWeeklyBaseReward(rankOrIndex);

    const cardBonusPercent =
      calculateCardWeeklyBonusRate(cards);

    return {
      baseCoin: base.coin,
      cardBonusPercent,

      coin: Math.floor(
        base.coin *
        (1 + (cardBonusPercent / 100))
      ),

      diamond: base.diamond,
      ruby: base.ruby
    };
  }

  /* ============================================================
     15. 公開API - カレンダー・大会日程
  ============================================================ */

  function normalizeCalendar(calendar) {
    return {
      year: Math.max(
        APP.firstYear,

        clampInteger(
          calendar?.year,
          APP.firstYear,
          9999
        )
      ),

      month: clampInteger(
        calendar?.month,
        1,
        CALENDAR.monthsPerYear
      ),

      week: clampInteger(
        calendar?.week,
        1,
        CALENDAR.weeksPerMonth
      )
    };
  }

  function calendarKey(calendar) {
    const value = normalizeCalendar(calendar);

    return [
      value.year,
      value.month,
      value.week
    ].join('-');
  }

  function calendarSerial(calendar) {
    const value = normalizeCalendar(calendar);

    return (
      (
        value.year *
        CALENDAR.monthsPerYear *
        CALENDAR.weeksPerMonth
      ) +
      (
        (value.month - 1) *
        CALENDAR.weeksPerMonth
      ) +
      (value.week - 1)
    );
  }

  function advanceCalendar(calendar, amount = 1) {
    const result = normalizeCalendar(calendar);

    const steps = Math.max(
      0,
      clampInteger(amount, 0, 999999)
    );

    for (
      let index = 0;
      index < steps;
      index += 1
    ) {
      result.week += 1;

      if (
        result.week >
        CALENDAR.weeksPerMonth
      ) {
        result.week = 1;
        result.month += 1;
      }

      if (
        result.month >
        CALENDAR.monthsPerYear
      ) {
        result.month = 1;
        result.year += 1;
      }
    }

    return result;
  }

  function isChampionshipYear(year) {
    const targetYear = clampInteger(
      year,
      APP.firstYear,
      9999
    );

    if (
      targetYear <
      CALENDAR.championship.firstYear
    ) {
      return false;
    }

    return (
      (
        targetYear -
        CALENDAR.championship.firstYear
      ) %
      CALENDAR.championship.intervalYears
    ) === 0;
  }

  function eventKey(event) {
    return [
      event.year,
      event.month,
      event.week,
      event.id
    ].join('-');
  }

  function decorateEvent(event, year) {
    const tierMeta =
      TOURNAMENT_TIER_META[event.tier];

    const result = {
      ...clone(event),
      year,

      icon:
        event.icon ||
        tierMeta.icon,

      background:
        event.background ||
        tierMeta.background
    };

    result.key = eventKey(result);

    return result;
  }

  function getScheduleForYear(year) {
    const targetYear = clampInteger(
      year,
      APP.firstYear,
      9999
    );

    const events =
      BASE_TOURNAMENT_SCHEDULE.map(
        (event) =>
          decorateEvent(event, targetYear)
      );

    if (isChampionshipYear(targetYear)) {
      events.push(
        decorateEvent(
          {
            id: 'championship',

            month:
              CALENDAR.championship.month,

            week:
              CALENDAR.championship.week,

            tier: 'championship',
            split: 0,
            stage: 1,
            finalStage: true,

            name: 'MOB BR CHAMPIONSHIP'
          },

          targetYear
        )
      );
    }

    return events.sort(
      (left, right) =>
        calendarSerial(left) -
        calendarSerial(right)
    );
  }

  function findCurrentEvent(calendar) {
    const target = normalizeCalendar(calendar);

    return (
      getScheduleForYear(target.year).find(
        (event) =>
          event.month === target.month &&
          event.week === target.week
      ) ||
      null
    );
  }

  function findNextEvent(
    calendar,
    maximumLookAheadYears = 12
  ) {
    const target = normalizeCalendar(calendar);
    const targetSerial = calendarSerial(target);

    const events = [];

    for (
      let year = target.year;
      year <=
      target.year + maximumLookAheadYears;
      year += 1
    ) {
      events.push(
        ...getScheduleForYear(year)
      );
    }

    return (
      events.find(
        (event) =>
          calendarSerial(event) >
          targetSerial
      ) ||
      null
    );
  }

  function getChampionshipCycle(year) {
    const targetYear = clampInteger(
      year,
      APP.firstYear,
      9999
    );

    const first =
      CALENDAR.championship.firstYear;

    const interval =
      CALENDAR.championship.intervalYears;

    if (targetYear <= first) {
      return {
        startYear:
          CALENDAR.championship
            .cycleStartYear,

        championshipYear: first
      };
    }

    const championshipYear =
      first +
      (
        Math.ceil(
          (targetYear - first) /
          interval
        ) *
        interval
      );

    return {
      startYear:
        championshipYear -
        (interval - 1),

      championshipYear
    };
  }

  /* ============================================================
     16. 公開API - 大会報酬・順位ポイント
  ============================================================ */

  function getTournamentReward(
    tier,
    placement
  ) {
    const normalizedTier =
      normalizeTier(tier);

    const table =
      TOURNAMENT_REWARD_TABLE[
        normalizedTier
      ];

    if (!table) {
      return clone(EMPTY_REWARD);
    }

    const safePlacement = Math.max(
      1,
      clampInteger(
        placement,
        1,
        9999
      )
    );

    const bucket = table.find(
      (entry) =>
        safePlacement >=
          entry.minPlacement &&
        (
          entry.maxPlacement == null ||
          safePlacement <=
            entry.maxPlacement
        )
    );

    return bucket
      ? clone(bucket.reward)
      : clone(EMPTY_REWARD);
  }

  function getMatchPlacementPoints(
    placement
  ) {
    const safePlacement = clampInteger(
      placement,
      1,
      9999
    );

    return (
      TOURNAMENT_FORMAT
        .scoring
        .placementPoints[safePlacement] ||
      0
    );
  }

  function getChampionshipPoints(
    placement
  ) {
    const safePlacement = clampInteger(
      placement,
      1,
      9999
    );

    return (
      CHAMPIONSHIP_POINTS
        .byWorldFinalPlacement[
          safePlacement
        ] ||
      CHAMPIONSHIP_POINTS
        .defaultOutsideTop10
    );
  }

  /* ============================================================
     17. 公開API - ルーム・初期状態
  ============================================================ */

  function getUnlockedRooms(rankOrIndex) {
    const currentRankNumber =
      rankNumber(rankOrIndex);

    return ROOMS
      .filter(
        (room) =>
          room.unlockRankNumber <=
          currentRankNumber
      )
      .map(clone);
  }

  function createBaseState() {
    return clone(BASE_STATE_TEMPLATE);
  }

  /* ============================================================
     18. データ検証
  ============================================================ */

  function validateGameData() {
    if (
      COMPANY_RANK.order.length !== 72
    ) {
      throw new Error(
        `企業ランク数が72ではありません: ${
          COMPANY_RANK.order.length
        }`
      );
    }

    if (
      COMPANY_RANK.minimumRank !== 'F1' ||
      COMPANY_RANK.maximumRank !== 'SS9'
    ) {
      throw new Error(
        '企業ランク範囲がF1～SS9ではありません。'
      );
    }

    const scheduleKeys = new Set();

    BASE_TOURNAMENT_SCHEDULE.forEach(
      (event) => {
        const key =
          `${event.month}-${event.week}`;

        if (scheduleKeys.has(key)) {
          throw new Error(
            `同じ週に大会が重複しています: ${key}`
          );
        }

        scheduleKeys.add(key);
      }
    );

    Object.entries(
      TOURNAMENT_REWARD_TABLE
    ).forEach(([tier, rows]) => {
      rows.forEach((row) => {
        if (row.minPlacement < 1) {
          throw new Error(
            `${tier}報酬の順位範囲が不正です。`
          );
        }

        if (
          row.maxPlacement != null &&
          row.maxPlacement <
            row.minPlacement
        ) {
          throw new Error(
            `${tier}報酬の最大順位が最小順位未満です。`
          );
        }
      });
    });

    return true;
  }

  validateGameData();

  /* ============================================================
     19. 公開
  ============================================================ */

  const GAME_DATA = deepFreeze({
    app: APP,

    storageKeys: STORAGE_KEYS,
    tournamentBridge: TOURNAMENT_BRIDGE,

    roles: ROLES,
    roleOrder: ROLE_ORDER,

    stats: STATS,
    statOrder: STAT_ORDER,

    trainingPoints: TRAINING_POINTS,
    trainingPointOrder:
      TRAINING_POINT_ORDER,

    currencies: CURRENCIES,
    currencyOrder: CURRENCY_ORDER,

    companyRank: COMPANY_RANK,
    weeklyBonus: WEEKLY_BONUS,

    calendar: CALENDAR,

    tournamentTierMeta:
      TOURNAMENT_TIER_META,

    tournamentSchedule:
      BASE_TOURNAMENT_SCHEDULE,

    tournamentFormat:
      TOURNAMENT_FORMAT,

    tournamentRewards:
      TOURNAMENT_REWARD_TABLE,

    championshipPoints:
      CHAMPIONSHIP_POINTS,

    rooms: ROOMS,

    baseStateTemplate:
      BASE_STATE_TEMPLATE
  });

  const GAME_API = Object.freeze({
    clone,

    rankFromIndex,
    rankToIndex,
    rankTier,
    rankLevel,
    rankNumber,

    expNeededForNextRank,
    getRankUpReward,
    getWeeklyBaseReward,

    calculateCardWeeklyBonusRate,
    calculateBadgeTrainingBonusRate,
    getWeeklyReward,

    normalizeCalendar,
    calendarKey,
    calendarSerial,
    advanceCalendar,

    isChampionshipYear,
    eventKey,
    getScheduleForYear,
    findCurrentEvent,
    findNextEvent,
    getChampionshipCycle,

    getTournamentReward,
    getMatchPlacementPoints,
    getChampionshipPoints,

    getUnlockedRooms,
    createBaseState,

    validateGameData
  });

  MOBBR.DATA.game = GAME_DATA;
  MOBBR.API.game = GAME_API;

  /*
    コンソール確認・単体テスト用。
  */
  global.MOBBR_GAME_DATA = GAME_DATA;
  global.MOBBR_GAME_API = GAME_API;
})(
  typeof window !== 'undefined'
    ? window
    : globalThis
);
