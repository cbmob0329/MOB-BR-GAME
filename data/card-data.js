'use strict';

/**
 * MOB BR - card-data.js
 * CPU選手カード・企業バッジ・パックの共通データ。
 *
 * 読み込み順:
 * cpu-data.js → cpu-local-data.js → cpu-national-data.js
 * → cpu-world-data.js → card-data.js → shop-data.js
 */
(function initializeCardData(global) {
  const MOBBR = global.MOBBR = global.MOBBR || {};
  MOBBR.DATA = MOBBR.DATA || {};
  MOBBR.API = MOBBR.API || {};

  const CPU = MOBBR.API.cpu;

  if (!CPU?.getTeams || !CPU?.getPlayer || !CPU?.getTeam) {
    throw new Error(
      'card-data.jsより先にcpu-data.jsと各CPU地域データを読み込んでください。'
    );
  }

  const TIERS = [
    'local',
    'national',
    'world'
  ];

  const TIER_LABEL = {
    local: 'Local',
    national: 'National',
    world: 'World'
  };

  const ROLE_ORDER = {
    ATK: 0,
    IGL: 1,
    SUP: 2
  };

  const ROLE_SUFFIX = {
    ATK: 'A',
    IGL: 'B',
    SUP: 'C'
  };

  const RARITIES = [
    'R',
    'SR',
    'SSR',
    'UR'
  ];

  const PLUS_MAXIMUM = 9;

  const OVERFLOW_REWARD = Object.freeze({
    coin: 10000,
    diamond: 1
  });

  const COLLECTION_BONUS = Object.freeze({
    card: {
      effect: 'weeklyCoin',
      baseRatePerOwned: 0.01,
      plusRatePerLevel: 0.001
    },

    badge: {
      effect: 'trainingPoint',
      baseRatePerOwned: 0.01,
      plusRatePerLevel: 0.001
    }
  });

  /* =========================================================
     編集エリア

     カード:
       L1A = Local Team1 ATK
       L1B = Local Team1 IGL
       L1C = Local Team1 SUP

     バッジ:
       L1D = Local Team1

     NationalはN、WorldはW。
  ========================================================= */

  const CARD_OVERRIDES = {
    /*
    L1B: {
      rarity: 'SSR',
      description: 'プリズンハンマーズを率いるIGL。'
    },

    N1A: {
      rarity: 'UR',
      description: 'ジョーダンロケッツの主力ATK。'
    },

    W1C: {
      rarity: 'UR',
      description: '世界トップクラスの火力を持つSUP。'
    }
    */
  };

  const BADGE_OVERRIDES = {
    /*
    L1D: {
      rarity: 'SSR',
      description: 'プリズンハンマーズの企業バッジ。'
    },

    W1D: {
      rarity: 'UR',
      description: 'ゴールデンテンペストの企業バッジ。'
    }
    */
  };

  const PACK_OVERRIDES = {
    /*
    vol1: {
      rarityRates: {
        R: 68,
        SR: 24,
        SSR: 7,
        UR: 1
      }
    }
    */
  };

  /*
   * [ID, 種類, 名前, 画像, 解放条件, 地域, チーム範囲, 購入価格]
   * rarityRates:null = 収録対象から均等抽選。
   */
  const PACK_ROWS = [
    [
      'vol1',
      'card',
      'CARD PACK Vol.1',
      'item/vol1.png',
      'initial',
      'local',
      [
        [1, 5],
        [11, 16]
      ],
      {
        coin: 5000,
        diamond: 10
      }
    ],

    [
      'vol2',
      'card',
      'CARD PACK Vol.2',
      'item/vol2.png',
      'initial',
      'local',
      [
        [6, 10],
        [17, 23]
      ],
      {
        coin: 5000,
        diamond: 10
      }
    ],

    [
      'vol3',
      'card',
      'CARD PACK Vol.3',
      'item/vol3.png',
      'nationalTop5',
      'national',
      [
        [1, 13]
      ],
      {
        coin: 5000,
        diamond: 10
      }
    ],

    [
      'vol4',
      'card',
      'CARD PACK Vol.4',
      'item/vol4.png',
      'nationalTop5',
      'national',
      [
        [14, 28]
      ],
      {
        coin: 5000,
        diamond: 10
      }
    ],

    [
      'vol5',
      'card',
      'CARD PACK Vol.5',
      'item/vol5.png',
      'nationalTop5',
      'national',
      [
        [29, 40]
      ],
      {
        coin: 5000,
        diamond: 10
      }
    ],

    [
      'vol6',
      'card',
      'CARD PACK Vol.6',
      'item/vol6.png',
      'worldTop5',
      'world',
      [
        [1, 5],
        [11, 15]
      ],
      {
        coin: 5000,
        diamond: 10
      }
    ],

    [
      'vol7',
      'card',
      'CARD PACK Vol.7',
      'item/vol7.png',
      'worldTop5',
      'world',
      [
        [6, 10],
        [16, 26]
      ],
      {
        coin: 5000,
        diamond: 10
      }
    ],

    [
      'vol8',
      'card',
      'CARD PACK Vol.8',
      'item/vol8.png',
      'worldTop5',
      'world',
      [
        [27, 41]
      ],
      {
        coin: 5000,
        diamond: 10
      }
    ],

    [
      'lb',
      'badge',
      'LOCAL BADGE PACK',
      'item/lb.png',
      'tournament',
      'local',
      [
        [1, 23]
      ],
      null
    ],

    [
      'nb',
      'badge',
      'NATIONAL BADGE PACK',
      'item/nb.png',
      'tournament',
      'national',
      [
        [1, 40]
      ],
      null
    ],

    [
      'wb',
      'badge',
      'WORLD BADGE PACK',
      'item/wb.png',
      'tournament',
      'world',
      [
        [1, 41]
      ],
      null
    ]
  ];

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    if (typeof structuredClone === 'function') {
      return structuredClone(value);
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
    minimum,
    maximum
  ) {
    return Math.max(
      minimum,
      Math.min(
        maximum,
        Number(value) || 0
      )
    );
  }

  function normalizeTier(value) {
    const tier = text(value).toLowerCase();

    return TIERS.includes(tier)
      ? tier
      : '';
  }

  function normalizeRarity(value) {
    const rarity = text(value).toUpperCase();

    return RARITIES.includes(rarity)
      ? rarity
      : '';
  }

  function inRanges(
    number,
    ranges
  ) {
    return (ranges || []).some(
      ([
        minimum,
        maximum
      ]) =>
        number >= minimum &&
        number <= maximum
    );
  }

  function playerCode(
    team,
    player
  ) {
    return (
      text(player.code).toUpperCase() ||
      `${team.code}${ROLE_SUFFIX[player.role] || player.slot}`
    );
  }

  function badgeCode(team) {
    return `${team.code}D`;
  }

  function makePackDefinition(row) {
    const [
      id,
      kind,
      name,
      image,
      unlock,
      tier,
      ranges,
      purchase
    ] = row;

    return {
      id,
      kind,
      name,
      image,
      img: image,
      unlock,
      tier,
      ranges,
      purchase,
      contents: 1,
      rarityRates: null
    };
  }

  const PACK_DEFINITIONS =
    PACK_ROWS.map(
      makePackDefinition
    );

  function derivedPackId(
    kind,
    tier,
    teamNumber
  ) {
    return (
      PACK_DEFINITIONS.find(
        (pack) =>
          pack.kind === kind &&
          pack.tier === tier &&
          inRanges(
            teamNumber,
            pack.ranges
          )
      )?.id || ''
    );
  }

  function validSourcePackId(
    kind,
    tier,
    teamNumber,
    packId
  ) {
    return PACK_DEFINITIONS.some(
      (pack) =>
        pack.id === packId &&
        pack.kind === kind &&
        pack.tier === tier &&
        inRanges(
          teamNumber,
          pack.ranges
        )
    );
  }

  function resolvePackId(
    kind,
    tier,
    teamNumber,
    sourcePackId,
    overridePackId
  ) {
    if (overridePackId !== undefined) {
      return text(
        overridePackId
      );
    }

    const sourceId =
      text(sourcePackId);

    if (
      sourceId &&
      validSourcePackId(
        kind,
        tier,
        teamNumber,
        sourceId
      )
    ) {
      return sourceId;
    }

    return derivedPackId(
      kind,
      tier,
      teamNumber
    );
  }

  function makeCardCatalog() {
    const cards = [];
    let no = 1;

    for (const tier of TIERS) {
      const teams =
        CPU.getTeams(tier)
          .sort(
            (
              left,
              right
            ) =>
              left.number -
              right.number
          );

      for (const team of teams) {
        const members =
          [...team.members]
            .sort(
              (
                left,
                right
              ) =>
                (
                  ROLE_ORDER[
                    left.role
                  ] ??
                  99
                ) -
                (
                  ROLE_ORDER[
                    right.role
                  ] ??
                  99
                )
            );

        for (const player of members) {
          const id =
            playerCode(
              team,
              player
            );

          const source =
            clone(
              player.card ||
              {}
            );

          const override =
            clone(
              CARD_OVERRIDES[id] ||
              {}
            );

          const packId =
            resolvePackId(
              'card',
              tier,
              team.number,
              source.packId,
              override.packId
            );

          cards.push({
            ...source,
            ...override,

            id,
            no: no++,
            type: 'card',
            kind: 'card',

            sourceType:
              'cpuPlayer',

            sourceTier:
              tier,

            sourceTeamId:
              team.id,

            sourcePlayerId:
              player.id,

            region:
              TIER_LABEL[
                tier
              ],

            tier,

            team:
              team.number,

            teamId:
              team.id,

            teamCode:
              team.code,

            teamName:
              team.name,

            role:
              player.role,

            slot:
              player.slot,

            name:
              player.name,

            image:
              player.image,

            img:
              player.image,

            rarity:
              normalizeRarity(
                override.rarity ??
                source.rarity
              ),

            description:
              text(
                override.description ??
                source.description ??
                player.description
              ),

            packId,

            obtainable:
              Boolean(packId),

            specialOnly:
              !packId,

            plusMaximum:
              PLUS_MAXIMUM,

            duplicateOverflowReward:
              clone(
                OVERFLOW_REWARD
              ),

            collectionBonus:
              clone(
                COLLECTION_BONUS.card
              )
          });
        }
      }
    }

    return cards;
  }

  function makeBadgeCatalog() {
    const badges = [];
    let no = 1;

    for (const tier of TIERS) {
      const teams =
        CPU.getTeams(tier)
          .sort(
            (
              left,
              right
            ) =>
              left.number -
              right.number
          );

      for (const team of teams) {
        const id =
          badgeCode(team);

        const source =
          clone(
            team.badge ||
            {}
          );

        const override =
          clone(
            BADGE_OVERRIDES[id] ||
            {}
          );

        const packId =
          resolvePackId(
            'badge',
            tier,
            team.number,
            source.packId,
            override.packId
          );

        badges.push({
          ...source,
          ...override,

          id,
          no: no++,
          type: 'badge',
          kind: 'badge',

          sourceType:
            'cpuTeam',

          sourceTier:
            tier,

          sourceTeamId:
            team.id,

          region:
            TIER_LABEL[
              tier
            ],

          tier,

          team:
            team.number,

          teamId:
            team.id,

          teamCode:
            team.code,

          teamName:
            team.name,

          name:
            text(
              override.name ??
              source.name
            ) ||
            `${team.name}バッジ`,

          image:
            team.logo,

          img:
            team.logo,

          rarity:
            normalizeRarity(
              override.rarity ??
              source.rarity
            ),

          description:
            text(
              override.description ??
              source.description ??
              team.description
            ),

          packId,

          obtainable:
            Boolean(packId),

          specialOnly:
            !packId,

          plusMaximum:
            PLUS_MAXIMUM,

          duplicateOverflowReward:
            clone(
              OVERFLOW_REWARD
            ),

          collectionBonus:
            clone(
              COLLECTION_BONUS.badge
            )
        });
      }
    }

    return badges;
  }

  const CARD_CATALOG =
    makeCardCatalog();

  const BADGE_CATALOG =
    makeBadgeCatalog();

  const CARD_BY_ID =
    Object.fromEntries(
      CARD_CATALOG.map(
        (card) => [
          card.id,
          card
        ]
      )
    );

  const BADGE_BY_ID =
    Object.fromEntries(
      BADGE_CATALOG.map(
        (badge) => [
          badge.id,
          badge
        ]
      )
    );

  function makePack(
    definition
  ) {
    const override =
      clone(
        PACK_OVERRIDES[
          definition.id
        ] ||
        {}
      );

    const pack = {
      ...clone(
        definition
      ),

      ...override,

      purchase:
        override.purchase ===
        undefined
          ? clone(
              definition.purchase
            )
          : clone(
              override.purchase
            ),

      rarityRates:
        override.rarityRates ===
        undefined
          ? clone(
              definition.rarityRates
            )
          : clone(
              override.rarityRates
            )
    };

    const source =
      pack.kind === 'card'
        ? CARD_CATALOG
        : BADGE_CATALOG;

    pack.pool =
      source
        .filter(
          (item) =>
            item.tier ===
              pack.tier &&
            inRanges(
              item.team,
              pack.ranges
            )
        )
        .map(
          (item) =>
            item.id
        );

    return pack;
  }

  const PACK_LIST =
    PACK_DEFINITIONS.map(
      makePack
    );

  const PACKS =
    Object.fromEntries(
      PACK_LIST.map(
        (pack) => [
          pack.id,
          pack
        ]
      )
    );

  function getCards(
    tierValue = ''
  ) {
    const tier =
      normalizeTier(
        tierValue
      );

    return CARD_CATALOG
      .filter(
        (card) =>
          !tier ||
          card.tier === tier
      )
      .map(clone);
  }

  function getBadges(
    tierValue = ''
  ) {
    const tier =
      normalizeTier(
        tierValue
      );

    return BADGE_CATALOG
      .filter(
        (badge) =>
          !tier ||
          badge.tier === tier
      )
      .map(clone);
  }

  function getCard(id) {
    const item =
      CARD_BY_ID[
        text(id)
          .toUpperCase()
      ];

    return item
      ? clone(item)
      : null;
  }

  function getBadge(id) {
    const item =
      BADGE_BY_ID[
        text(id)
          .toUpperCase()
      ];

    return item
      ? clone(item)
      : null;
  }

  function getPack(id) {
    const item =
      PACKS[
        text(id)
          .toLowerCase()
      ];

    return item
      ? clone(item)
      : null;
  }

  function getPacks(
    kind = ''
  ) {
    const target =
      text(kind)
        .toLowerCase();

    return PACK_LIST
      .filter(
        (pack) =>
          !target ||
          pack.kind ===
            target
      )
      .map(clone);
  }

  function getPackItems(
    packOrId
  ) {
    const pack =
      typeof packOrId ===
      'object'
        ? packOrId
        : PACKS[
            text(packOrId)
              .toLowerCase()
          ];

    if (!pack) {
      return [];
    }

    const index =
      pack.kind === 'card'
        ? CARD_BY_ID
        : BADGE_BY_ID;

    return pack.pool
      .map(
        (id) =>
          index[id]
      )
      .filter(Boolean)
      .map(clone);
  }

  function isPackUnlocked(
    packOrId,
    progress = {}
  ) {
    const pack =
      typeof packOrId ===
      'object'
        ? packOrId
        : PACKS[
            text(packOrId)
              .toLowerCase()
          ];

    if (!pack) {
      return false;
    }

    if (
      progress
        .unlockedPackIds
        ?.includes(
          pack.id
        )
    ) {
      return true;
    }

    if (
      pack.unlock ===
      'initial'
    ) {
      return true;
    }

    if (
      pack.unlock ===
      'nationalTop5'
    ) {
      return (
        progress.nationalTop5 ===
          true ||
        (
          Number(
            progress
              .nationalBestPlacement
          ) >= 1 &&
          Number(
            progress
              .nationalBestPlacement
          ) <= 5
        )
      );
    }

    if (
      pack.unlock ===
      'worldTop5'
    ) {
      return (
        progress.worldTop5 ===
          true ||
        (
          Number(
            progress
              .worldBestPlacement
          ) >= 1 &&
          Number(
            progress
              .worldBestPlacement
          ) <= 5
        )
      );
    }

    if (
      pack.unlock ===
      'tournament'
    ) {
      return (
        progress
          .tournamentUnlocked ===
          true ||
        Number(
          progress
            .tournamentEntries
        ) > 0 ||
        Number(
          progress
            .tournamentCompletions
        ) > 0
      );
    }

    return false;
  }

  function randomIndex(
    length,
    random
  ) {
    if (length <= 0) {
      return -1;
    }

    return Math.floor(
      clamp(
        random(),
        0,
        0.999999999
      ) *
      length
    );
  }

  function pickUniform(
    items,
    random
  ) {
    const index =
      randomIndex(
        items.length,
        random
      );

    return index >= 0
      ? items[index]
      : null;
  }

  function rarityWeights(
    rates
  ) {
    if (
      !rates ||
      typeof rates !==
      'object'
    ) {
      return [];
    }

    return RARITIES
      .map(
        (rarity) => ({
          rarity,

          weight:
            Math.max(
              0,
              Number(
                rates[
                  rarity
                ]
              ) ||
              0
            )
        })
      )
      .filter(
        (entry) =>
          entry.weight > 0
      );
  }

  function pickByRarity(
    items,
    rates,
    random
  ) {
    const groups =
      Object.fromEntries(
        RARITIES.map(
          (rarity) => [
            rarity,

            items.filter(
              (item) =>
                item.rarity ===
                rarity
            )
          ]
        )
      );

    const weighted =
      rarityWeights(rates)
        .filter(
          (entry) =>
            groups[
              entry.rarity
            ].length
        );

    if (!weighted.length) {
      return pickUniform(
        items,
        random
      );
    }

    const total =
      weighted.reduce(
        (
          sum,
          entry
        ) =>
          sum +
          entry.weight,

        0
      );

    let roll =
      clamp(
        random(),
        0,
        0.999999999
      ) *
      total;

    let selected =
      weighted[
        weighted.length -
        1
      ];

    for (
      const entry of
      weighted
    ) {
      roll -=
        entry.weight;

      if (roll < 0) {
        selected =
          entry;

        break;
      }
    }

    return pickUniform(
      groups[
        selected.rarity
      ],

      random
    );
  }

  function drawOne(
    packOrId,
    random = Math.random
  ) {
    const pack =
      typeof packOrId ===
      'object'
        ? packOrId
        : PACKS[
            text(packOrId)
              .toLowerCase()
          ];

    if (!pack) {
      throw new Error(
        `存在しないパックです: ${packOrId}`
      );
    }

    const items =
      getPackItems(pack);

    if (!items.length) {
      throw new Error(
        `${pack.name}の収録対象がありません。`
      );
    }

    const selected =
      pack.rarityRates
        ? pickByRarity(
            items,
            pack.rarityRates,
            random
          )
        : pickUniform(
            items,
            random
          );

    return selected
      ? clone(selected)
      : null;
  }

  function drawPack(
    packOrId,
    random = Math.random
  ) {
    const pack =
      typeof packOrId ===
      'object'
        ? packOrId
        : PACKS[
            text(packOrId)
              .toLowerCase()
          ];

    if (!pack) {
      throw new Error(
        `存在しないパックです: ${packOrId}`
      );
    }

    const count =
      Math.max(
        1,

        Math.floor(
          Number(
            pack.contents
          ) ||
          1
        )
      );

    return Array.from(
      {
        length: count
      },

      () =>
        drawOne(
          pack,
          random
        )
    );
  }

  function catalogItem(
    kind,
    id
  ) {
    const key =
      text(id)
        .toUpperCase();

    if (
      kind ===
      'card'
    ) {
      return (
        CARD_BY_ID[
          key
        ] ||
        null
      );
    }

    if (
      kind ===
      'badge'
    ) {
      return (
        BADGE_BY_ID[
          key
        ] ||
        null
      );
    }

    return (
      CARD_BY_ID[
        key
      ] ||
      BADGE_BY_ID[
        key
      ] ||
      null
    );
  }

  function grantItem({
    kind,
    id,
    collection,
    currencies,
    obtainedAt =
      Date.now()
  }) {
    if (
      !collection ||
      typeof collection !==
      'object'
    ) {
      throw new TypeError(
        'collectionオブジェクトが必要です。'
      );
    }

    const item =
      catalogItem(
        kind,
        id
      );

    if (!item) {
      throw new Error(
        `存在しないカードまたはバッジです: ${id}`
      );
    }

    const owned =
      collection[
        item.id
      ];

    if (!owned) {
      collection[
        item.id
      ] = {
        plus: 0,
        obtainedAt
      };

      return {
        ...clone(item),

        status:
          'NEW',

        plus:
          0,

        convert:
          false,

        reward: {
          coin: 0,
          diamond: 0
        }
      };
    }

    const currentPlus =
      Math.max(
        0,

        Math.floor(
          Number(
            owned.plus
          ) ||
          0
        )
      );

    if (
      currentPlus <
      PLUS_MAXIMUM
    ) {
      owned.plus =
        currentPlus +
        1;

      return {
        ...clone(item),

        status:
          'PLUS',

        plus:
          owned.plus,

        convert:
          false,

        reward: {
          coin: 0,
          diamond: 0
        }
      };
    }

    if (
      currencies &&
      typeof currencies ===
      'object'
    ) {
      currencies.coin =
        (
          Number(
            currencies.coin
          ) ||
          0
        ) +
        OVERFLOW_REWARD.coin;

      currencies.diamond =
        (
          Number(
            currencies.diamond
          ) ||
          0
        ) +
        OVERFLOW_REWARD.diamond;
    }

    return {
      ...clone(item),

      status:
        'MAX CONVERT',

      plus:
        PLUS_MAXIMUM,

      convert:
        true,

      reward:
        clone(
          OVERFLOW_REWARD
        )
    };
  }

  function grantPackResults({
    packId,
    collection,
    currencies,
    random =
      Math.random,
    obtainedAt =
      Date.now()
  }) {
    const pack =
      PACKS[
        text(packId)
          .toLowerCase()
      ];

    if (!pack) {
      throw new Error(
        `存在しないパックです: ${packId}`
      );
    }

    const target =
      pack.kind ===
      'card'
        ? collection?.cards
        : collection?.badges;

    if (!target) {
      throw new TypeError(
        (
          'collection.' +
          (
            pack.kind ===
            'card'
              ? 'cards'
              : 'badges'
          ) +
          'が必要です。'
        )
      );
    }

    return drawPack(
      pack,
      random
    ).map(
      (item) =>
        grantItem({
          kind:
            pack.kind,

          id:
            item.id,

          collection:
            target,

          currencies,
          obtainedAt
        })
    );
  }

  function calculateCollectionBonus(
    kind,
    ownedMap = {}
  ) {
    const isBadge =
      kind ===
      'badge';

    const catalog =
      isBadge
        ? BADGE_CATALOG
        : CARD_CATALOG;

    const setting =
      isBadge
        ? COLLECTION_BONUS.badge
        : COLLECTION_BONUS.card;

    let owned = 0;
    let plusTotal = 0;
    let rate = 0;

    for (
      const item of
      catalog
    ) {
      const entry =
        ownedMap[
          item.id
        ];

      if (!entry) {
        continue;
      }

      const plus =
        Math.max(
          0,

          Math.min(
            PLUS_MAXIMUM,

            Math.floor(
              Number(
                entry.plus
              ) ||
              0
            )
          )
        );

      owned += 1;
      plusTotal += plus;

      rate +=
        setting
          .baseRatePerOwned +
        plus *
        setting
          .plusRatePerLevel;
    }

    return {
      kind:
        isBadge
          ? 'badge'
          : 'card',

      effect:
        setting.effect,

      owned,
      plusTotal,
      rate,

      percent:
        rate *
        100
    };
  }

  function validateCardData() {
    const errors = [];

    const cardIds =
      new Set();

    const badgeIds =
      new Set();

    const packIds =
      new Set();

    for (
      const card of
      CARD_CATALOG
    ) {
      if (
        cardIds.has(
          card.id
        )
      ) {
        errors.push(
          `カードID重複: ${card.id}`
        );
      }

      cardIds.add(
        card.id
      );

      if (!card.name) {
        errors.push(
          `カード名未設定: ${card.id}`
        );
      }

      if (!card.image) {
        errors.push(
          `カード画像未設定: ${card.id}`
        );
      }
    }

    for (
      const badge of
      BADGE_CATALOG
    ) {
      if (
        badgeIds.has(
          badge.id
        )
      ) {
        errors.push(
          `バッジID重複: ${badge.id}`
        );
      }

      badgeIds.add(
        badge.id
      );

      if (!badge.name) {
        errors.push(
          `バッジ名未設定: ${badge.id}`
        );
      }

      if (!badge.image) {
        errors.push(
          `バッジ画像未設定: ${badge.id}`
        );
      }
    }

    for (
      const pack of
      PACK_LIST
    ) {
      if (
        packIds.has(
          pack.id
        )
      ) {
        errors.push(
          `パックID重複: ${pack.id}`
        );
      }

      packIds.add(
        pack.id
      );

      if (!pack.pool.length) {
        errors.push(
          `パック収録対象なし: ${pack.id}`
        );
      }

      const index =
        pack.kind ===
        'card'
          ? CARD_BY_ID
          : BADGE_BY_ID;

      for (
        const id of
        pack.pool
      ) {
        if (!index[id]) {
          errors.push(
            `パック参照先なし: ${pack.id}/${id}`
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
        cards:
          CARD_CATALOG.length,

        badges:
          BADGE_CATALOG.length,

        packs:
          PACK_LIST.length,

        obtainableCards:
          CARD_CATALOG.filter(
            (card) =>
              card.obtainable
          ).length,

        obtainableBadges:
          BADGE_CATALOG.filter(
            (badge) =>
              badge.obtainable
          ).length,

        byTier:
          Object.fromEntries(
            TIERS.map(
              (tier) => [
                tier,

                {
                  cards:
                    CARD_CATALOG.filter(
                      (card) =>
                        card.tier ===
                        tier
                    ).length,

                  badges:
                    BADGE_CATALOG.filter(
                      (badge) =>
                        badge.tier ===
                        tier
                    ).length
                }
              ]
            )
          )
      }
    };
  }

  const validation =
    validateCardData();

  if (!validation.valid) {
    throw new Error(
      validation
        .errors
        .join('\n')
    );
  }

  const CARD_DATA =
    Object.freeze({
      version:
        '1.0.0',

      rarities:
        RARITIES,

      plusMaximum:
        PLUS_MAXIMUM,

      overflowReward:
        OVERFLOW_REWARD,

      collectionBonus:
        COLLECTION_BONUS,

      cards:
        CARD_CATALOG,

      badges:
        BADGE_CATALOG,

      packs:
        PACKS,

      packList:
        PACK_LIST,

      cardById:
        CARD_BY_ID,

      badgeById:
        BADGE_BY_ID,

      cardOverrides:
        CARD_OVERRIDES,

      badgeOverrides:
        BADGE_OVERRIDES,

      packOverrides:
        PACK_OVERRIDES,

      validation
    });

  const CARD_API =
    Object.freeze({
      clone,
      normalizeRarity,

      getCards,
      getBadges,
      getCard,
      getBadge,

      getPack,
      getPacks,
      getPackItems,
      isPackUnlocked,

      drawOne,
      drawPack,

      grantItem,
      grantPackResults,

      calculateCollectionBonus,

      validate:
        validateCardData
    });

  MOBBR.DATA.card =
    CARD_DATA;

  MOBBR.API.card =
    CARD_API;

  global.MOBBR_CARD_DATA =
    CARD_DATA;

  global.MOBBR_CARD_API =
    CARD_API;

  /* 旧HTML互換 */
  global.CARD_CATALOG =
    CARD_CATALOG;

  global.BADGE_CATALOG =
    BADGE_CATALOG;

  global.CARD_BY_ID =
    CARD_BY_ID;

  global.BADGE_BY_ID =
    BADGE_BY_ID;

  global.PACKS =
    PACKS;
})(
  typeof window !==
  'undefined'
    ? window
    : globalThis
);
