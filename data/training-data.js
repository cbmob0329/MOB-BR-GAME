'use strict';

/**
 * MOB BR - training-data.js
 * 読み込み順: game-data.js → ability-data.js → training-data.js
 *
 * 主な編集場所
 * ・トレーニング追加: TRAINING_PROGRAMS
 * ・能力の必要ポイント変更: PLAYER_ABILITIES
 * ・能力アップ費用変更: ABILITY_COST_TABLE
 */
(function initializeTrainingData(global) {
  const MOBBR = global.MOBBR = global.MOBBR || {};
  MOBBR.DATA = MOBBR.DATA || {};
  MOBBR.API = MOBBR.API || {};

  if (!MOBBR.DATA.game || !MOBBR.API.game) {
    throw new Error(
      'training-data.jsより先にgame-data.jsを読み込んでください。'
    );
  }

  if (!MOBBR.DATA.ability || !MOBBR.API.ability) {
    throw new Error(
      'training-data.jsより先にability-data.jsを読み込んでください。'
    );
  }

  const GAME = MOBBR.DATA.game;
  const GAME_API = MOBBR.API.game;
  const clone = GAME_API.clone;

  const POINT_KEYS = [
    ...GAME.trainingPointOrder
  ];

  const ROLE_KEYS = [
    ...GAME.roleOrder
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

  const clampInt = (
    value,
    min,
    max
  ) => {
    const number = Math.floor(
      Number(value)
    );

    return Number.isFinite(number)
      ? Math.max(
          min,
          Math.min(max, number)
        )
      : min;
  };

  const normalizeRole = (value) => {
    let role = String(value || '')
      .trim()
      .toUpperCase();

    if (role === 'SAP') {
      role = 'SUP';
    }

    return ROLE_KEYS.includes(role)
      ? role
      : 'IGL';
  };

  const normalizePointPool = (pool) =>
    Object.fromEntries(
      POINT_KEYS.map((key) => [
        key,
        Math.max(
          0,
          Math.floor(
            Number(pool?.[key]) || 0
          )
        )
      ])
    );

  const createEmptyPointPool = () =>
    normalizePointPool({});

  /* ============================================================
     1. 共通ルール
  ============================================================ */

  const TRAINING_RULES = {
    weekCost: 1,

    pointsAreShared: true,
    sharedWithSpecialAbilities: true,

    activeRosterOnly: true,
    eachPlayerChoosesOneProgram: true,
    sameProgramSelectionAllowed: true,

    blockedDuringUnfinishedTournamentWeek: true,

    badgeBonus: {
      percentPerUniqueBadge: 1,
      percentPerPlusLevel: 0.1,
      maximumPlusLevel: 9,
      rounding: 'floor'
    },

    records: {
      incrementEachActivePlayer: true,
      amountPerSession: 1
    }
  };

  /* ============================================================
     2. トレーニング一覧

     追加する場合はTRAINING_PROGRAMSへ1行追加する。
  ============================================================ */

  const PROGRAM = (
    id,
    name,
    shortName,
    description,
    icon,
    power,
    tech,
    mental,
    shoot,
    recommendedRoles = [
      'IGL',
      'ATK',
      'SUP'
    ],
    unlock = {
      type: 'initial'
    }
  ) => ({
    id,
    name,
    shortName,
    description,
    icon,

    gain: {
      power,
      tech,
      mental,
      shoot
    },

    recommendedRoles,
    unlock
  });

  const TRAINING_PROGRAMS = [
    PROGRAM(
      'muscle',
      '筋トレ',
      'POWER',
      'パワーを中心に、メンタルと技術も少し獲得する。',
      'icon/kin.png',
      14,
      1,
      2,
      0,
      [
        'ATK'
      ]
    ),

    PROGRAM(
      'shoot',
      '射撃練習',
      'SHOOT',
      '射撃を中心に、技術とメンタルも獲得する。',
      'icon/sha.png',
      0,
      2,
      2,
      14,
      [
        'IGL',
        'ATK'
      ]
    ),

    PROGRAM(
      'study',
      '作戦研究',
      'TECH',
      '技術を中心に、メンタルと射撃も獲得する。',
      'icon/sak.png',
      0,
      14,
      3,
      1,
      [
        'IGL',
        'SUP'
      ]
    ),

    PROGRAM(
      'mental',
      'メンタル修行',
      'MENTAL',
      'メンタルを中心に、技術とパワーも獲得する。',
      'icon/mts.png',
      1,
      2,
      14,
      0,
      [
        'IGL',
        'SUP'
      ]
    ),

    PROGRAM(
      'battle',
      '実戦演習',
      'BATTLE',
      '4種類の能力ポイントを高水準で獲得する。',
      'icon/zit.png',
      5,
      5,
      4,
      5
    ),

    PROGRAM(
      'all',
      '総合練習',
      'ALL',
      '4種類の能力ポイントを均等に獲得する。',
      'icon/sou.png',
      4,
      4,
      4,
      4
    )
  ];

  const TRAINING_BY_ID =
    Object.fromEntries(
      TRAINING_PROGRAMS.map(
        (program) => [
          program.id,
          program
        ]
      )
    );

  const DEFAULT_TRAINING_ID =
    'muscle';

  /* ============================================================
     3. 7能力
  ============================================================ */

  const ABILITY = (
    id,
    name,
    shortName,
    icon,
    mainPoint,
    subPoint,
    description
  ) => ({
    id,
    name,
    shortName,
    icon,
    mainPoint,
    subPoint,
    description
  });

  const PLAYER_ABILITIES = {
    stamina: ABILITY(
      'stamina',
      'スタミナ',
      'STA',
      'icon/sta.png',
      'power',
      'mental',
      '最大HPと長期戦での耐久力に影響する。'
    ),

    mind: ABILITY(
      'mind',
      'マインド',
      'MND',
      'icon/mind.png',
      'mental',
      'tech',
      '強化効果、精神安定、デバフ成功率や耐性に影響する。'
    ),

    physical: ABILITY(
      'physical',
      'フィジカル',
      'PHY',
      'icon/phy.png',
      'power',
      'tech',
      '攻撃威力、防御力、近距離性能に影響する。'
    ),

    aim: ABILITY(
      'aim',
      'エイム',
      'AIM',
      'icon/aim.png',
      'shoot',
      'mental',
      '通常攻撃と攻撃スキルの命中性能に影響する。'
    ),

    agility: ABILITY(
      'agility',
      'アジリティ',
      'AGI',
      'icon/agi.png',
      'tech',
      'power',
      '移動、回避、スキルCT短縮に影響する。'
    ),

    technique: ABILITY(
      'technique',
      'テクニック',
      'TEC',
      'icon/teq.png',
      'tech',
      'shoot',
      'スキル威力、特殊効果、武器操作に影響する。'
    ),

    support: ABILITY(
      'support',
      'サポート',
      'SUP',
      'icon/sup.png',
      'mental',
      'shoot',
      '回復量、味方強化、支援スキルに影響する。'
    )
  };

  const PLAYER_ABILITY_ORDER = [
    'stamina',
    'mind',
    'physical',
    'aim',
    'agility',
    'technique',
    'support'
  ];

  const INITIAL_ABILITIES_BY_ROLE = {
    IGL: {
      stamina: 31,
      mind: 34,
      physical: 28,
      aim: 30,
      agility: 27,
      technique: 36,
      support: 29
    },

    ATK: {
      stamina: 29,
      mind: 25,
      physical: 36,
      aim: 38,
      agility: 35,
      technique: 32,
      support: 20
    },

    SUP: {
      stamina: 26,
      mind: 35,
      physical: 23,
      aim: 28,
      agility: 25,
      technique: 31,
      support: 39
    }
  };

  /* ============================================================
     4. 能力ランクと費用

     1=F1
     72=SS9
     73=MOB

     SS9→MOBもSS費用の170・85を使用する。
  ============================================================ */

  const PLAYER_RANK_TIERS = [
    'F',
    'E',
    'D',
    'C',
    'B',
    'A',
    'S',
    'SS'
  ];

  const PLAYER_RANK_ORDER = [
    ...PLAYER_RANK_TIERS.flatMap(
      (tier) =>
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

  const PLAYER_RANK_SCALE = {
    minimumOrdinal: 1,
    maximumOrdinal: 73,

    minimumRank: 'F1',
    maximumNormalRank: 'SS9',
    maximumRank: 'MOB',

    order: PLAYER_RANK_ORDER
  };

  const ABILITY_COST_TABLE = [
    {
      tier: 'F',
      currentMax: 9,
      main: 5,
      sub: 3
    },

    {
      tier: 'E',
      currentMax: 18,
      main: 10,
      sub: 5
    },

    {
      tier: 'D',
      currentMax: 27,
      main: 18,
      sub: 9
    },

    {
      tier: 'C',
      currentMax: 36,
      main: 30,
      sub: 15
    },

    {
      tier: 'B',
      currentMax: 45,
      main: 48,
      sub: 24
    },

    {
      tier: 'A',
      currentMax: 54,
      main: 75,
      sub: 38
    },

    {
      tier: 'S',
      currentMax: 63,
      main: 115,
      sub: 58
    },

    {
      tier: 'SS',
      currentMax: 72,
      main: 170,
      sub: 85
    }
  ];

  /* ============================================================
     5. トレーニング参照・解放条件
  ============================================================ */

  function getTrainingProgram(
    programIdOrIndex
  ) {
    const number =
      Number(programIdOrIndex);

    if (
      Number.isInteger(number) &&
      String(programIdOrIndex).trim() !== ''
    ) {
      return TRAINING_PROGRAMS[
        clampInt(
          number,
          0,
          TRAINING_PROGRAMS.length - 1
        )
      ];
    }

    return (
      TRAINING_BY_ID[
        String(programIdOrIndex || '')
      ] ||
      TRAINING_BY_ID[
        DEFAULT_TRAINING_ID
      ]
    );
  }

  function getRecommendedTrainings(
    role
  ) {
    const normalizedRole =
      normalizeRole(role);

    return TRAINING_PROGRAMS
      .filter(
        (program) =>
          program.recommendedRoles
            .includes(normalizedRole)
      )
      .map(clone);
  }

  function evaluateTrainingUnlock(
    program,
    context = {}
  ) {
    const unlock =
      program?.unlock || {
        type: 'initial'
      };

    if (unlock.type === 'initial') {
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
        typeof context.companyRankIndex ===
        'number'
          ? context.companyRankIndex + 1
          : GAME_API.rankNumber(
              context.companyRank || 'F1'
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

    if (unlock.type === 'flag') {
      const current = Boolean(
        context.flags?.[
          unlock.flag
        ]
      );

      return {
        unlocked: current,
        current: current ? 1 : 0,
        required: 1
      };
    }

    return {
      unlocked: false,
      current: 0,
      required: 1
    };
  }

  function getUnlockedTrainings(
    context = {}
  ) {
    return TRAINING_PROGRAMS
      .filter(
        (program) =>
          evaluateTrainingUnlock(
            program,
            context
          ).unlocked
      )
      .map(clone);
  }

  /* ============================================================
     6. 獲得ポイント計算
  ============================================================ */

  function getBadgeTrainingBonusRate(
    badgeCollection
  ) {
    if (
      typeof GAME_API
        .calculateBadgeTrainingBonusRate ===
      'function'
    ) {
      return GAME_API
        .calculateBadgeTrainingBonusRate(
          badgeCollection || {}
        );
    }

    return Object.values(
      badgeCollection || {}
    ).reduce(
      (total, entry) => {
        if (!entry) {
          return total;
        }

        const plus = clampInt(
          entry.plus || 0,
          0,
          TRAINING_RULES
            .badgeBonus
            .maximumPlusLevel
        );

        return (
          total +
          TRAINING_RULES
            .badgeBonus
            .percentPerUniqueBadge +
          (
            plus *
            TRAINING_RULES
              .badgeBonus
              .percentPerPlusLevel
          )
        );
      },
      0
    );
  }

  function normalizeTrainingSelections(
    selections,
    activePlayerIds
  ) {
    return Object.fromEntries(
      (activePlayerIds || []).map(
        (playerId) => [
          playerId,

          getTrainingProgram(
            selections?.[playerId] ??
            DEFAULT_TRAINING_ID
          ).id
        ]
      )
    );
  }

  function calculateBaseTrainingGain(
    selections,
    activePlayerIds
  ) {
    const normalizedSelections =
      normalizeTrainingSelections(
        selections,
        activePlayerIds
      );

    const total =
      createEmptyPointPool();

    const perPlayer = {};

    Object.entries(
      normalizedSelections
    ).forEach(
      ([
        playerId,
        programId
      ]) => {
        const program =
          getTrainingProgram(
            programId
          );

        perPlayer[playerId] = {
          programId: program.id,
          programName: program.name,
          gain: clone(program.gain)
        };

        POINT_KEYS.forEach(
          (key) => {
            total[key] +=
              Number(
                program.gain[key]
              ) || 0;
          }
        );
      }
    );

    return {
      selections:
        normalizedSelections,

      perPlayer,
      total
    };
  }

  function applyTrainingBonus(
    baseGain,
    bonusRate
  ) {
    const base =
      normalizePointPool(
        baseGain
      );

    const rate = Math.max(
      0,
      Number(bonusRate) || 0
    );

    return Object.fromEntries(
      POINT_KEYS.map((key) => {
        const value =
          base[key] *
          (
            1 +
            (rate / 100)
          );

        const rounded =
          TRAINING_RULES
            .badgeBonus
            .rounding === 'round'
            ? Math.round(value)
            : TRAINING_RULES
                .badgeBonus
                .rounding === 'ceil'
              ? Math.ceil(value)
              : Math.floor(value);

        return [
          key,
          rounded
        ];
      })
    );
  }

  function calculateTrainingGain({
    selections,
    activePlayerIds,
    badgeCollection,
    badgeBonusRate
  } = {}) {
    const base =
      calculateBaseTrainingGain(
        selections,
        activePlayerIds
      );

    const rate =
      badgeBonusRate == null
        ? getBadgeTrainingBonusRate(
            badgeCollection
          )
        : Math.max(
            0,
            Number(
              badgeBonusRate
            ) || 0
          );

    const finalGain =
      applyTrainingBonus(
        base.total,
        rate
      );

    return {
      ...base,

      badgeBonusRate:
        rate,

      baseGain:
        clone(base.total),

      bonusGain:
        Object.fromEntries(
          POINT_KEYS.map(
            (key) => [
              key,
              finalGain[key] -
              base.total[key]
            ]
          )
        ),

      finalGain
    };
  }

  function addTrainingPoints(
    pointPool,
    gain
  ) {
    const result =
      normalizePointPool(
        pointPool
      );

    const safeGain =
      normalizePointPool(
        gain
      );

    POINT_KEYS.forEach(
      (key) => {
        result[key] +=
          safeGain[key];
      }
    );

    return result;
  }

  function isTrainingBlocked({
    currentEvent,
    completedEventKeys
  } = {}) {
    if (
      !TRAINING_RULES
        .blockedDuringUnfinishedTournamentWeek ||
      !currentEvent
    ) {
      return false;
    }

    const completed =
      new Set(
        completedEventKeys || []
      );

    const key =
      String(
        currentEvent.key || ''
      );

    return (
      !key ||
      !completed.has(key)
    );
  }

  /* ============================================================
     7. 能力ランク・能力アップ
  ============================================================ */

  function getAbilityRankLabel(
    ordinal
  ) {
    return PLAYER_RANK_ORDER[
      clampInt(
        ordinal,
        PLAYER_RANK_SCALE
          .minimumOrdinal,
        PLAYER_RANK_SCALE
          .maximumOrdinal
      ) - 1
    ];
  }

  function getAbilityRankOrdinal(
    label
  ) {
    const index =
      PLAYER_RANK_ORDER
        .indexOf(
          String(label || '')
            .trim()
            .toUpperCase()
        );

    return index >= 0
      ? index + 1
      : 1;
  }

  function getAbilityRankData(
    rankOrOrdinal
  ) {
    const ordinal =
      typeof rankOrOrdinal ===
      'number'
        ? clampInt(
            rankOrOrdinal,
            1,
            73
          )
        : getAbilityRankOrdinal(
            rankOrOrdinal
          );

    const label =
      getAbilityRankLabel(
        ordinal
      );

    const isMob =
      label === 'MOB';

    return {
      ordinal,
      label,

      tier:
        isMob
          ? 'MOB'
          : label.replace(
              /[0-9]/g,
              ''
            ),

      level:
        isMob
          ? null
          : Number(
              label.match(
                /[0-9]+/
              )?.[0] || 1
            ),

      isMob,
      isMax:
        ordinal === 73,

      nextOrdinal:
        ordinal < 73
          ? ordinal + 1
          : null,

      nextLabel:
        ordinal < 73
          ? getAbilityRankLabel(
              ordinal + 1
            )
          : null
    };
  }

  function getPlayerAbilityDefinition(
    abilityId
  ) {
    return (
      PLAYER_ABILITIES[
        String(
          abilityId || ''
        )
      ] ||
      null
    );
  }

  function getAbilityUpgradeCost(
    abilityId,
    currentRankOrOrdinal
  ) {
    const ability =
      getPlayerAbilityDefinition(
        abilityId
      );

    if (!ability) {
      return null;
    }

    const rank =
      getAbilityRankData(
        currentRankOrOrdinal
      );

    if (rank.isMax) {
      return null;
    }

    const row =
      ABILITY_COST_TABLE.find(
        (entry) =>
          rank.ordinal <=
          entry.currentMax
      );

    if (!row) {
      return null;
    }

    return {
      abilityId:
        ability.id,

      abilityName:
        ability.name,

      fromOrdinal:
        rank.ordinal,

      fromRank:
        rank.label,

      toOrdinal:
        rank.ordinal + 1,

      toRank:
        rank.nextLabel,

      mainPoint:
        ability.mainPoint,

      subPoint:
        ability.subPoint,

      main:
        row.main,

      sub:
        row.sub,

      points: {
        [ability.mainPoint]:
          row.main,

        [ability.subPoint]:
          row.sub
      }
    };
  }

  function canPayAbilityCost(
    pointPool,
    cost
  ) {
    if (!cost) {
      return false;
    }

    const points =
      normalizePointPool(
        pointPool
      );

    return Object.entries(
      cost.points
    ).every(
      ([
        key,
        amount
      ]) =>
        points[key] >= amount
    );
  }

  function previewAbilityUpgrade(
    player,
    abilityId,
    pointPool
  ) {
    const ability =
      getPlayerAbilityDefinition(
        abilityId
      );

    if (!ability) {
      return {
        valid: false,
        affordable: false,
        reason: 'unknown_ability'
      };
    }

    const currentOrdinal =
      clampInt(
        player?.abilities?.[
          abilityId
        ] || 1,
        1,
        73
      );

    const currentRank =
      getAbilityRankData(
        currentOrdinal
      );

    const cost =
      getAbilityUpgradeCost(
        abilityId,
        currentOrdinal
      );

    if (!cost) {
      return {
        valid: false,
        affordable: false,
        reason: 'max_rank',

        ability:
          clone(ability),

        currentRank,
        cost: null
      };
    }

    const points =
      normalizePointPool(
        pointPool
      );

    const shortages =
      Object.fromEntries(
        Object.entries(
          cost.points
        )
          .map(
            ([
              key,
              amount
            ]) => [
              key,
              Math.max(
                0,
                amount -
                points[key]
              )
            ]
          )
          .filter(
            ([
              ,
              shortage
            ]) =>
              shortage > 0
          )
      );

    return {
      valid: true,

      affordable:
        Object.keys(
          shortages
        ).length === 0,

      reason:
        Object.keys(
          shortages
        ).length === 0
          ? ''
          : 'insufficient_points',

      ability:
        clone(ability),

      currentRank,

      nextRank:
        getAbilityRankData(
          currentOrdinal + 1
        ),

      cost:
        clone(cost),

      points,
      shortages
    };
  }

  function applyAbilityUpgrade(
    player,
    abilityId,
    pointPool
  ) {
    const preview =
      previewAbilityUpgrade(
        player,
        abilityId,
        pointPool
      );

    if (
      !preview.valid ||
      !preview.affordable
    ) {
      return {
        success: false,
        reason:
          preview.reason,
        preview
      };
    }

    const nextPlayer =
      clone(player || {});

    nextPlayer.abilities = {
      ...(
        nextPlayer.abilities ||
        {}
      )
    };

    nextPlayer.abilities[
      abilityId
    ] =
      preview.nextRank.ordinal;

    const nextPointPool =
      normalizePointPool(
        pointPool
      );

    Object.entries(
      preview.cost.points
    ).forEach(
      ([
        key,
        amount
      ]) => {
        nextPointPool[key] -=
          amount;
      }
    );

    return {
      success: true,

      player:
        nextPlayer,

      pointPool:
        nextPointPool,

      abilityId,

      beforeRank:
        preview.currentRank,

      afterRank:
        preview.nextRank,

      spent:
        clone(
          preview.cost.points
        )
    };
  }

  function getPlayerOverallRank(
    player
  ) {
    const ordinals =
      PLAYER_ABILITY_ORDER.map(
        (abilityId) =>
          clampInt(
            player?.abilities?.[
              abilityId
            ] || 1,
            1,
            73
          )
      );

    const average =
      Math.floor(
        ordinals.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        ordinals.length
      );

    return getAbilityRankData(
      average
    );
  }

  function createInitialPlayerAbilities(
    role
  ) {
    return clone(
      INITIAL_ABILITIES_BY_ROLE[
        normalizeRole(role)
      ]
    );
  }

  /* ============================================================
     8. 状態作成・補助
  ============================================================ */

  function createTrainingState(
    activePlayerIds = [
      'p1',
      'p2',
      'p3'
    ]
  ) {
    return {
      points:
        createEmptyPointPool(),

      choice:
        Object.fromEntries(
          activePlayerIds.map(
            (playerId) => [
              playerId,
              DEFAULT_TRAINING_ID
            ]
          )
        ),

      totalWeeks: 0,
      history: []
    };
  }

  function normalizeTrainingState(
    trainingState,
    activePlayerIds
  ) {
    return {
      points:
        normalizePointPool(
          trainingState?.points
        ),

      choice:
        normalizeTrainingSelections(
          trainingState?.choice,
          activePlayerIds
        ),

      totalWeeks:
        Math.max(
          0,
          Math.floor(
            Number(
              trainingState
                ?.totalWeeks
            ) || 0
          )
        ),

      history:
        Array.isArray(
          trainingState?.history
        )
          ? clone(
              trainingState.history
            )
          : []
    };
  }

  function estimateTrainingWeeksForCost(
    cost,
    weeklyGain
  ) {
    if (
      !cost ||
      !weeklyGain
    ) {
      return null;
    }

    const gains =
      normalizePointPool(
        weeklyGain
      );

    const weeks =
      Math.max(
        ...Object.entries(
          cost.points
        ).map(
          ([
            key,
            amount
          ]) =>
            gains[key] > 0
              ? Math.ceil(
                  amount /
                  gains[key]
                )
              : Infinity
        )
      );

    return Number.isFinite(
      weeks
    )
      ? weeks
      : null;
  }

  /* ============================================================
     9. データ検証
  ============================================================ */

  function validateTrainingData() {
    const errors = [];
    const warnings = [];

    if (
      PLAYER_RANK_ORDER.length !==
      73
    ) {
      errors.push(
        `能力ランク数が73ではありません: ${
          PLAYER_RANK_ORDER.length
        }`
      );
    }

    if (
      PLAYER_RANK_ORDER[0] !==
        'F1' ||
      PLAYER_RANK_ORDER[71] !==
        'SS9' ||
      PLAYER_RANK_ORDER[72] !==
        'MOB'
    ) {
      errors.push(
        '能力ランクの先頭または末尾が不正です。'
      );
    }

    const programIds =
      new Set();

    TRAINING_PROGRAMS.forEach(
      (program) => {
        if (
          programIds.has(
            program.id
          )
        ) {
          errors.push(
            `トレーニングID重複: ${
              program.id
            }`
          );
        }

        programIds.add(
          program.id
        );

        POINT_KEYS.forEach(
          (key) => {
            if (
              !Number.isFinite(
                Number(
                  program.gain?.[
                    key
                  ]
                )
              )
            ) {
              errors.push(
                `${
                  program.id
                }.${key}の獲得値が不正です。`
              );
            }
          }
        );

        const total =
          POINT_KEYS.reduce(
            (sum, key) =>
              sum +
              (
                Number(
                  program.gain?.[
                    key
                  ]
                ) || 0
              ),
            0
          );

        if (total <= 0) {
          warnings.push(
            `${
              program.id
            }の獲得合計が0です。`
          );
        }
      }
    );

    PLAYER_ABILITY_ORDER.forEach(
      (abilityId) => {
        const ability =
          PLAYER_ABILITIES[
            abilityId
          ];

        if (
          !POINT_KEYS.includes(
            ability.mainPoint
          )
        ) {
          errors.push(
            `${
              abilityId
            }の主ポイントが不正です。`
          );
        }

        if (
          !POINT_KEYS.includes(
            ability.subPoint
          )
        ) {
          errors.push(
            `${
              abilityId
            }の副ポイントが不正です。`
          );
        }

        if (
          ability.mainPoint ===
          ability.subPoint
        ) {
          errors.push(
            `${
              abilityId
            }の主・副ポイントが同一です。`
          );
        }
      }
    );

    return {
      valid:
        errors.length === 0,

      errors,
      warnings,

      counts: {
        programs:
          TRAINING_PROGRAMS.length,

        abilities:
          PLAYER_ABILITY_ORDER.length,

        rankLabels:
          PLAYER_RANK_ORDER.length
      }
    };
  }

  const validation =
    validateTrainingData();

  if (!validation.valid) {
    throw new Error(
      validation.errors.join(
        '\n'
      )
    );
  }

  /* ============================================================
     10. 公開
  ============================================================ */

  const TRAINING_DATA =
    freeze({
      version: '1.0.0',

      rules:
        TRAINING_RULES,

      programs:
        TRAINING_PROGRAMS,

      programById:
        TRAINING_BY_ID,

      defaultTrainingId:
        DEFAULT_TRAINING_ID,

      playerAbilities: {
        definitions:
          PLAYER_ABILITIES,

        order:
          PLAYER_ABILITY_ORDER,

        initialByRole:
          INITIAL_ABILITIES_BY_ROLE,

        rankScale:
          PLAYER_RANK_SCALE,

        upgradeCostTable:
          ABILITY_COST_TABLE
      }
    });

  const TRAINING_API =
    Object.freeze({
      normalizeRole,
      normalizePointPool,
      createEmptyPointPool,

      getTrainingProgram,
      getRecommendedTrainings,
      evaluateTrainingUnlock,
      getUnlockedTrainings,

      getBadgeTrainingBonusRate,
      normalizeTrainingSelections,
      calculateBaseTrainingGain,
      applyTrainingBonus,
      calculateTrainingGain,
      addTrainingPoints,
      isTrainingBlocked,

      getAbilityRankLabel,
      getAbilityRankOrdinal,
      getAbilityRankData,
      getPlayerAbilityDefinition,
      getAbilityUpgradeCost,
      canPayAbilityCost,
      previewAbilityUpgrade,
      applyAbilityUpgrade,
      getPlayerOverallRank,
      createInitialPlayerAbilities,

      createTrainingState,
      normalizeTrainingState,
      estimateTrainingWeeksForCost,

      validateTrainingData
    });

  MOBBR.DATA.training =
    TRAINING_DATA;

  MOBBR.API.training =
    TRAINING_API;

  global.MOBBR_TRAINING_DATA =
    TRAINING_DATA;

  global.MOBBR_TRAINING_API =
    TRAINING_API;
})(
  typeof window !== 'undefined'
    ? window
    : globalThis
);
