'use strict';

/**
 * MOB BR - shop-data.js
 * アイテム／カードパック購入／武器スキンガチャ／ルーム購入。
 * 読み込み順: card-data.js → shop-data.js → app.js
 */
(function initializeShopData(global) {
  const MOBBR = global.MOBBR = global.MOBBR || {};
  MOBBR.DATA = MOBBR.DATA || {};
  MOBBR.API = MOBBR.API || {};

  const CARD = MOBBR.API.card;

  if (
    !CARD?.getPacks ||
    !CARD?.isPackUnlocked ||
    !CARD?.grantPackResults
  ) {
    throw new Error(
      'shop-data.jsより先にcard-data.jsを読み込んでください。'
    );
  }

  const CURRENCIES = [
    'coin',
    'diamond',
    'ruby'
  ];

  const CATEGORIES = [
    'items',
    'packs',
    'skins',
    'rooms'
  ];

  const INITIAL_SKINS = [
    'グリーンバッシュ',
    'エメラルドガン',
    'パープルバレット'
  ];

  const SKIN_GACHA_COST = Object.freeze({
    diamond: 50,
    ruby: 3
  });

  const BAG_STEPS = Object.freeze([
    {
      minimumRankIndex: 54,
      capacity: 10
    },

    {
      minimumRankIndex: 45,
      capacity: 9
    },

    {
      minimumRankIndex: 36,
      capacity: 8
    },

    {
      minimumRankIndex: 27,
      capacity: 7
    },

    {
      minimumRankIndex: 18,
      capacity: 6
    },

    {
      minimumRankIndex: 0,
      capacity: 5
    }
  ]);

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }

    return typeof structuredClone ===
      'function'
      ? structuredClone(value)
      : JSON.parse(
          JSON.stringify(value)
        );
  }

  function text(value) {
    return value == null
      ? ''
      : String(value).trim();
  }

  function int(
    value,
    fallback = 0
  ) {
    const number =
      Number(value);

    return Number.isFinite(number)
      ? Math.floor(number)
      : fallback;
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

  /* =========================================================
     ITEM
  ========================================================= */

  const ITEM_ROWS = [
    [
      'spinKnit',
      'スピンニット',
      'item/nit.png',
      '選択した選手のエイムを1アップ（マッチ中のみ）',
      500,
      'boost',
      {
        ability: 'aim',
        amount: 1
      }
    ],

    [
      'highSpinKnit',
      'ハイスピンニット',
      'item/hinit.png',
      '選択した選手のエイムを2アップ（マッチ中のみ）',
      3000,
      'boost',
      {
        ability: 'aim',
        amount: 2
      }
    ],

    [
      'masterHeads',
      'マスターヘッズ',
      'item/master.png',
      '選択した選手のエイムを3アップ（マッチ中のみ）',
      10000,
      'boost',
      {
        ability: 'aim',
        amount: 3
      }
    ],

    [
      'scope',
      'スコープ',
      'item/sc.png',
      '選択した選手のテクニックを1アップ（マッチ中のみ）',
      500,
      'boost',
      {
        ability: 'technique',
        amount: 1
      }
    ],

    [
      'rareScope',
      'レアスコープ',
      'item/sc2.png',
      '選択した選手のテクニックを2アップ（マッチ中のみ）',
      3000,
      'boost',
      {
        ability: 'technique',
        amount: 2
      }
    ],

    [
      'ultraScope',
      'ウルスコープ',
      'item/sc3.png',
      '選択した選手のテクニックを3アップ（マッチ中のみ）',
      10000,
      'boost',
      {
        ability: 'technique',
        amount: 3
      }
    ],

    [
      'book1',
      '読みかけの本',
      'item/y1.png',
      '選択した選手のマインドを1アップ（マッチ中のみ）',
      500,
      'boost',
      {
        ability: 'mind',
        amount: 1
      }
    ],

    [
      'book2',
      '続・読みかけの本',
      'item/y2.png',
      '選択した選手のマインドを2アップ（マッチ中のみ）',
      3000,
      'boost',
      {
        ability: 'mind',
        amount: 2
      }
    ],

    [
      'book3',
      '極・読みかけの本',
      'item/y3.png',
      '選択した選手のマインドを3アップ（マッチ中のみ）',
      10000,
      'boost',
      {
        ability: 'mind',
        amount: 3
      }
    ],

    [
      'trip1',
      'ガラガラの旅',
      'item/g1.png',
      '選択した選手のアジリティを1アップ（マッチ中のみ）',
      500,
      'boost',
      {
        ability: 'agility',
        amount: 1
      }
    ],

    [
      'trip2',
      '国内ガラガラの旅',
      'item/g2.png',
      '選択した選手のアジリティを2アップ（マッチ中のみ）',
      3000,
      'boost',
      {
        ability: 'agility',
        amount: 2
      }
    ],

    [
      'trip3',
      '海外ガラガラの旅',
      'item/g3.png',
      '選択した選手のアジリティを3アップ（マッチ中のみ）',
      10000,
      'boost',
      {
        ability: 'agility',
        amount: 3
      }
    ],

    [
      'gumi1',
      'PB2グミ',
      'item/gumi1.png',
      '選択した選手のHPを最大HPの30%回復',
      500,
      'heal',
      {
        ratio: 0.30
      }
    ],

    [
      'gumi2',
      'PB2 おもちゃ付きグミ',
      'item/gumi2.png',
      '選択した選手のHPを最大HPの50%回復',
      3000,
      'heal',
      {
        ratio: 0.50
      }
    ],

    [
      'gumi3',
      'PB2 優勝特典グミ',
      'item/gumi3.png',
      '選択した選手のHPを最大HPの70%回復',
      10000,
      'heal',
      {
        ratio: 0.70
      }
    ],

    [
      'cotton',
      'MOB わたあめ',
      'item/wta.png',
      'チーム全員のHPを最大HPの30%回復',
      5000,
      'teamHeal',
      {
        ratio: 0.30
      }
    ],

    [
      'energy',
      'MOB エナジードリンク',
      'item/ena.png',
      'チーム全員のHPを最大HPの50%回復',
      10000,
      'teamHeal',
      {
        ratio: 0.50
      }
    ],

    [
      'respawn',
      'リスポーンレコード',
      'item/re.png',
      '確キルの入った味方1人をHP50%で復活',
      10000,
      'respawn',
      {
        ratio: 0.50
      }
    ]
  ];

  const ITEMS = ITEM_ROWS.map(
    ([
      id,
      name,
      image,
      description,
      price,
      type,
      effect
    ]) => ({
      id,
      name,
      image,
      img: image,
      description,
      desc: description,
      price,

      purchase: {
        coin: price
      },

      type,

      effect:
        clone(effect),

      ...clone(effect),

      stackable:
        true,

      usableInBattle:
        true
    })
  );

  const ITEM_BY_ID =
    Object.fromEntries(
      ITEMS.map(
        (item) => [
          item.id,
          item
        ]
      )
    );

  /* =========================================================
     WEAPON SKIN
  ========================================================= */

  const SKIN_ROWS = [
    [
      'グリーンバッシュ',
      'wepon/01.png',
      true,
      false
    ],

    [
      'エメラルドガン',
      'wepon/02.png',
      true,
      false
    ],

    [
      'パープルバレット',
      'wepon/03.png',
      true,
      false
    ],

    [
      'ネオンストライプ',
      'wepon/skin01.png',
      false,
      true
    ],

    [
      'アイアンブラック',
      'wepon/skin02.png',
      false,
      true
    ],

    [
      'ゴールドレコード',
      'wepon/skin03.png',
      false,
      true
    ],

    [
      'リリスブルー',
      'wepon/skin04.png',
      false,
      true
    ],

    [
      'サンダーグラフィティ',
      'wepon/skin05.png',
      false,
      true
    ],

    [
      'MOBクローム',
      'wepon/skin06.png',
      false,
      true
    ]
  ];

  const WEAPON_SKINS =
    SKIN_ROWS.map(
      ([
        name,
        image,
        initial,
        gacha
      ], index) => ({
        id:
          `weapon_skin_${String(
            index + 1
          ).padStart(
            2,
            '0'
          )}`,

        name,
        image,
        img: image,
        initial,
        gacha,
        rarity: '',
        weight: 1,
        description: ''
      })
    );

  const SKIN_BY_NAME =
    Object.fromEntries(
      WEAPON_SKINS.map(
        (skin) => [
          skin.name,
          skin
        ]
      )
    );

  const SKIN_BY_ID =
    Object.fromEntries(
      WEAPON_SKINS.map(
        (skin) => [
          skin.id,
          skin
        ]
      )
    );

  const SKIN_GACHA_POOL =
    WEAPON_SKINS.filter(
      (skin) =>
        skin.gacha
    );

  /* =========================================================
     ROOM
  ========================================================= */

  const ROOM_ROWS = [
    [
      'room01',
      1,
      'room/01.png',
      'MOB BR',
      0
    ],

    [
      'room02',
      2,
      'room/02.png',
      'MOB BR ピンクカラーモデル',
      100000
    ],

    [
      'room03',
      3,
      'room/03.png',
      'MOB BR ブルーカラーモデル',
      100000
    ],

    [
      'room04',
      5,
      'room/04.png',
      'モブイルカエルモデル',
      500000
    ],

    [
      'room05',
      10,
      'room/05.png',
      'モブメイルモデル',
      500000
    ],

    [
      'room06',
      15,
      'room/06.png',
      'モブデンデンモデル',
      1000000
    ],

    [
      'room07',
      15,
      'room/07.png',
      'モブマニーモデル',
      1000000
    ],

    [
      'room08',
      15,
      'room/08.png',
      'モブドラゴンモデル',
      1000000
    ],

    [
      'room09',
      15,
      'room/09.png',
      'ミラモブモデル',
      1000000
    ],

    [
      'room10',
      20,
      'room/10.png',
      'モブテツモデル',
      1000000
    ],

    [
      'room11',
      20,
      'room/11.png',
      'モブリリスモデル',
      3000000
    ],

    [
      'room12',
      20,
      'room/12.png',
      'あのヒーローモデル',
      5000000
    ],

    [
      'room13',
      30,
      'room/13.png',
      'アサモブモデル',
      10000000
    ],

    [
      'room14',
      30,
      'room/14.png',
      'ネコクーモデル',
      10000000
    ],

    [
      'room15',
      30,
      'room/15.png',
      'PB2 Vol.62 モデル',
      10000000
    ],

    [
      'room16',
      30,
      'room/16.png',
      'MOB PARTY モデル',
      10000000
    ]
  ];

  const ROOMS =
    ROOM_ROWS.map(
      ([
        id,
        rank,
        image,
        name,
        price
      ]) => ({
        id,
        rank,

        minimumCompanyRankNumber:
          rank,

        image,
        img: image,
        name,
        price,

        purchase: {
          coin: price
        },

        initial:
          id === 'room01',

        description:
          ''
      })
    );

  const ROOM_BY_ID =
    Object.fromEntries(
      ROOMS.map(
        (room) => [
          room.id,
          room
        ]
      )
    );

  /* =========================================================
     STATE
  ========================================================= */

  function ensureObject(
    parent,
    key
  ) {
    if (
      !parent[key] ||
      typeof parent[key] !==
        'object' ||
      Array.isArray(
        parent[key]
      )
    ) {
      parent[key] = {};
    }

    return parent[key];
  }

  function ensureArray(
    parent,
    key
  ) {
    if (
      !Array.isArray(
        parent[key]
      )
    ) {
      parent[key] = [];
    }

    return parent[key];
  }

  function getCompanyRankIndex(
    state
  ) {
    return Math.max(
      0,

      int(
        state
          ?.company
          ?.rankIndex,

        0
      )
    );
  }

  function getCompanyRankNumber(
    state
  ) {
    return (
      getCompanyRankIndex(
        state
      ) +
      1
    );
  }

  function getBagCapacity(
    stateOrRankIndex
  ) {
    const rankIndex =
      typeof stateOrRankIndex ===
      'number'
        ? Math.max(
            0,

            int(
              stateOrRankIndex
            )
          )
        : getCompanyRankIndex(
            stateOrRankIndex
          );

    return (
      BAG_STEPS.find(
        (step) =>
          rankIndex >=
          step.minimumRankIndex
      )
        ?.capacity ||
      5
    );
  }

  function normalizeState(
    state
  ) {
    if (
      !state ||
      typeof state !==
        'object'
    ) {
      throw new TypeError(
        'ショップ処理にはstateオブジェクトが必要です。'
      );
    }

    const currencies =
      ensureObject(
        state,
        'currencies'
      );

    CURRENCIES.forEach(
      (key) => {
        currencies[key] =
          Math.max(
            0,

            int(
              currencies[key],
              0
            )
          );
      }
    );

    ensureObject(
      state,
      'company'
    );

    const inventory =
      ensureObject(
        state,
        'inventory'
      );

    const items =
      ensureObject(
        inventory,
        'items'
      );

    ensureObject(
      inventory,
      'cardPacks'
    );

    ensureObject(
      inventory,
      'badgePacks'
    );

    ensureObject(
      inventory,
      'weaponSkinDuplicates'
    );

    const ownedSkins =
      ensureArray(
        inventory,
        'weaponSkins'
      );

    INITIAL_SKINS.forEach(
      (name) => {
        if (
          !ownedSkins.includes(
            name
          )
        ) {
          ownedSkins.push(
            name
          );
        }
      }
    );

    inventory.weaponSkins =
      [
        ...new Set(
          ownedSkins.filter(
            (name) =>
              SKIN_BY_NAME[name]
          )
        )
      ];

    inventory.teamBag =
      ensureArray(
        inventory,
        'teamBag'
      )
        .filter(
          (id) =>
            ITEM_BY_ID[id]
        )
        .slice(
          0,
          getBagCapacity(state)
        );

    Object.keys(
      items
    ).forEach(
      (id) => {
        if (
          !ITEM_BY_ID[id]
        ) {
          delete items[id];
        } else {
          items[id] =
            Math.max(
              0,

              int(
                items[id],
                0
              )
            );
        }
      }
    );

    const collection =
      ensureObject(
        state,
        'collection'
      );

    ensureObject(
      collection,
      'cards'
    );

    ensureObject(
      collection,
      'badges'
    );

    const rooms =
      ensureObject(
        state,
        'rooms'
      );

    const ownedRooms =
      ensureArray(
        rooms,
        'owned'
      );

    if (
      !ownedRooms.includes(
        'room01'
      )
    ) {
      ownedRooms.unshift(
        'room01'
      );
    }

    rooms.owned = [
      ...new Set(
        ownedRooms.filter(
          (id) =>
            ROOM_BY_ID[id]
        )
      )
    ];

    rooms.selected =
      ROOM_BY_ID[
        rooms.selected
      ]
        ? rooms.selected
        : 'room01';

    const layouts =
      ensureObject(
        rooms,
        'layouts'
      );

    rooms.owned.forEach(
      (id) => {
        if (
          !Array.isArray(
            layouts[id]
          )
        ) {
          layouts[id] = [];
        }
      }
    );

    rooms.nextOrder =
      Math.max(
        1,

        int(
          rooms.nextOrder,
          1
        )
      );

    ensureObject(
      state,
      'flags'
    );

    ensureObject(
      state,
      'records'
    );

    return state;
  }

  /* =========================================================
     CURRENCY
  ========================================================= */

  function normalizeCost(
    cost
  ) {
    const source =
      cost &&
      typeof cost ===
        'object'
        ? cost
        : {};

    return Object.fromEntries(
      CURRENCIES.map(
        (key) => [
          key,

          Math.max(
            0,

            int(
              source[key],
              0
            )
          )
        ]
      )
    );
  }

  function canAfford(
    currencies,
    cost
  ) {
    const normalized =
      normalizeCost(
        cost
      );

    return CURRENCIES.every(
      (key) =>
        (
          Number(
            currencies?.[key]
          ) ||
          0
        ) >=
        normalized[key]
    );
  }

  function missingCurrencies(
    currencies,
    cost
  ) {
    const normalized =
      normalizeCost(
        cost
      );

    return Object.fromEntries(
      CURRENCIES
        .map(
          (key) => [
            key,

            Math.max(
              0,

              normalized[key] -
              (
                Number(
                  currencies?.[key]
                ) ||
                0
              )
            )
          ]
        )
        .filter(
          ([
            ,
            amount
          ]) =>
            amount > 0
        )
    );
  }

  function deductCost(
    currencies,
    cost
  ) {
    const normalized =
      normalizeCost(
        cost
      );

    if (
      !canAfford(
        currencies,
        normalized
      )
    ) {
      return {
        ok: false,

        reason:
          'INSUFFICIENT_CURRENCY',

        cost:
          normalized,

        missing:
          missingCurrencies(
            currencies,
            normalized
          )
      };
    }

    CURRENCIES.forEach(
      (key) => {
        currencies[key] =
          (
            Number(
              currencies[key]
            ) ||
            0
          ) -
          normalized[key];
      }
    );

    return {
      ok: true,
      cost: normalized
    };
  }

  function addCurrencies(
    currencies,
    reward
  ) {
    const normalized =
      normalizeCost(
        reward
      );

    CURRENCIES.forEach(
      (key) => {
        currencies[key] =
          (
            Number(
              currencies[key]
            ) ||
            0
          ) +
          normalized[key];
      }
    );

    return clone(
      normalized
    );
  }

  /* =========================================================
     GET
  ========================================================= */

  function getItem(
    id
  ) {
    return ITEM_BY_ID[
      text(id)
    ]
      ? clone(
          ITEM_BY_ID[
            text(id)
          ]
        )
      : null;
  }

  function getWeaponSkin(
    nameOrId
  ) {
    const key =
      text(
        nameOrId
      );

    const skin =
      SKIN_BY_NAME[key] ||
      SKIN_BY_ID[key];

    return skin
      ? clone(skin)
      : null;
  }

  function getRoom(
    id
  ) {
    return ROOM_BY_ID[
      text(id)
    ]
      ? clone(
          ROOM_BY_ID[
            text(id)
          ]
        )
      : null;
  }

  function packProgressFromState(
    state
  ) {
    normalizeState(
      state
    );

    const records =
      Array.isArray(
        state.records
          .tournaments
      )
        ? state.records
            .tournaments
        : [];

    const placements =
      (tier) =>
        records
          .filter(
            (row) =>
              text(
                row.tier
              )
                .toLowerCase() ===
              tier
          )
          .map(
            (row) =>
              int(
                row.placement,
                999
              )
          );

    const national =
      placements(
        'national'
      );

    const world =
      placements(
        'world'
      );

    return {
      nationalTop5:
        state.flags
          .nationalTop5 ===
        true,

      worldTop5:
        state.flags
          .worldTop5 ===
        true,

      nationalBestPlacement:
        national.length
          ? Math.min(
              ...national
            )
          : 0,

      worldBestPlacement:
        world.length
          ? Math.min(
              ...world
            )
          : 0,

      tournamentUnlocked:
        records.length >
        0,

      tournamentEntries:
        records.length,

      tournamentCompletions:
        records.length,

      unlockedPackIds:
        Array.isArray(
          state.flags
            .unlockedPackIds
        )
          ? state.flags
              .unlockedPackIds
          : []
    };
  }

  function isPackUnlocked(
    packOrId,
    state
  ) {
    const pack =
      typeof packOrId ===
      'object'
        ? packOrId
        : CARD.getPack(
            packOrId
          );

    return Boolean(
      pack &&
      CARD.isPackUnlocked(
        pack,

        packProgressFromState(
          state
        )
      )
    );
  }

  function getPackProducts(
    state,
    {
      kind = 'card',
      includeLocked = true,
      includeUnpurchasable = false
    } = {}
  ) {
    normalizeState(
      state
    );

    return CARD
      .getPacks(
        kind
      )
      .filter(
        (pack) =>
          includeUnpurchasable ||
          pack.purchase
      )
      .map(
        (pack) => ({
          ...pack,

          unlocked:
            isPackUnlocked(
              pack,
              state
            ),

          purchasable:
            Boolean(
              pack.purchase
            ),

          owned:
            (
              pack.kind ===
              'badge'
                ? state
                    .inventory
                    .badgePacks
                : state
                    .inventory
                    .cardPacks
            )[
              pack.id
            ] ||
            0
        })
      )
      .filter(
        (pack) =>
          includeLocked ||
          pack.unlocked
      );
  }

  function getShopProducts(
    category,
    state
  ) {
    normalizeState(
      state
    );

    const raw =
      text(category)
        .toLowerCase();

    const target =
      CATEGORIES.includes(
        raw
      )
        ? raw
        : 'items';

    if (
      target ===
      'packs'
    ) {
      return getPackProducts(
        state
      );
    }

    if (
      target ===
      'skins'
    ) {
      return WEAPON_SKINS.map(
        (skin) => ({
          ...clone(skin),

          owned:
            state.inventory
              .weaponSkins
              .includes(
                skin.name
              ),

          duplicates:
            state.inventory
              .weaponSkinDuplicates[
                skin.name
              ] ||
            0
        })
      );
    }

    if (
      target ===
      'rooms'
    ) {
      return ROOMS.map(
        (room) => ({
          ...clone(room),

          owned:
            state.rooms
              .owned
              .includes(
                room.id
              ),

          unlocked:
            getCompanyRankNumber(
              state
            ) >=
            room.rank
        })
      );
    }

    return ITEMS.map(
      (item) => ({
        ...clone(item),

        owned:
          state.inventory
            .items[
              item.id
            ] ||
          0
      })
    );
  }

  /* =========================================================
     PURCHASE
  ========================================================= */

  function purchaseItem({
    state,
    itemId,
    quantity = 1
  }) {
    normalizeState(
      state
    );

    const item =
      ITEM_BY_ID[
        text(itemId)
      ];

    if (!item) {
      return {
        ok: false,

        reason:
          'ITEM_NOT_FOUND',

        itemId
      };
    }

    const count =
      Math.max(
        1,

        int(
          quantity,
          1
        )
      );

    const payment =
      deductCost(
        state.currencies,

        {
          coin:
            item.price *
            count
        }
      );

    if (!payment.ok) {
      return {
        ...payment,
        item:
          clone(item),
        quantity:
          count
      };
    }

    state.inventory
      .items[
        item.id
      ] =
      (
        state.inventory
          .items[
            item.id
          ] ||
        0
      ) +
      count;

    return {
      ok: true,
      type: 'item',
      item: clone(item),
      quantity: count,
      cost: payment.cost,

      owned:
        state.inventory
          .items[
            item.id
          ]
    };
  }

  function packInventory(
    state,
    pack
  ) {
    return pack.kind ===
      'badge'
      ? state.inventory
          .badgePacks
      : state.inventory
          .cardPacks;
  }

  function purchasePack({
    state,
    packId,
    quantity = 1
  }) {
    normalizeState(
      state
    );

    const pack =
      CARD.getPack(
        packId
      );

    if (!pack) {
      return {
        ok: false,

        reason:
          'PACK_NOT_FOUND',

        packId
      };
    }

    if (
      !pack.purchase
    ) {
      return {
        ok: false,

        reason:
          'PACK_NOT_FOR_SALE',

        pack
      };
    }

    if (
      !isPackUnlocked(
        pack,
        state
      )
    ) {
      return {
        ok: false,

        reason:
          'PACK_LOCKED',

        pack
      };
    }

    const count =
      Math.max(
        1,

        int(
          quantity,
          1
        )
      );

    const unit =
      normalizeCost(
        pack.purchase
      );

    const cost =
      Object.fromEntries(
        CURRENCIES.map(
          (key) => [
            key,

            unit[key] *
            count
          ]
        )
      );

    const payment =
      deductCost(
        state.currencies,
        cost
      );

    if (!payment.ok) {
      return {
        ...payment,
        pack,
        quantity:
          count
      };
    }

    const inventory =
      packInventory(
        state,
        pack
      );

    inventory[
      pack.id
    ] =
      (
        inventory[
          pack.id
        ] ||
        0
      ) +
      count;

    return {
      ok: true,
      type: 'pack',
      pack,
      quantity: count,
      cost: payment.cost,

      owned:
        inventory[
          pack.id
        ]
    };
  }

  function grantPack({
    state,
    packId,
    quantity = 1
  }) {
    normalizeState(
      state
    );

    const pack =
      CARD.getPack(
        packId
      );

    if (!pack) {
      return {
        ok: false,

        reason:
          'PACK_NOT_FOUND',

        packId
      };
    }

    const count =
      Math.max(
        1,

        int(
          quantity,
          1
        )
      );

    const inventory =
      packInventory(
        state,
        pack
      );

    inventory[
      pack.id
    ] =
      (
        inventory[
          pack.id
        ] ||
        0
      ) +
      count;

    return {
      ok: true,

      type:
        'packReward',

      pack,
      quantity:
        count,

      owned:
        inventory[
          pack.id
        ]
    };
  }

  /* =========================================================
     PACK OPEN
  ========================================================= */

  function openPack({
    state,
    packId,
    quantity = 1,
    random = Math.random,
    obtainedAt = Date.now()
  }) {
    normalizeState(
      state
    );

    const pack =
      CARD.getPack(
        packId
      );

    if (!pack) {
      return {
        ok: false,

        reason:
          'PACK_NOT_FOUND',

        packId
      };
    }

    const inventory =
      packInventory(
        state,
        pack
      );

    const owned =
      Math.max(
        0,

        int(
          inventory[
            pack.id
          ],

          0
        )
      );

    const count =
      Math.min(
        owned,

        Math.max(
          1,

          int(
            quantity,
            1
          )
        )
      );

    if (!count) {
      return {
        ok: false,

        reason:
          'PACK_NOT_OWNED',

        pack,
        owned
      };
    }

    const results = [];

    for (
      let index = 0;
      index < count;
      index += 1
    ) {
      inventory[
        pack.id
      ] -= 1;

      results.push(
        ...CARD
          .grantPackResults({
            packId:
              pack.id,

            collection:
              state.collection,

            currencies:
              state.currencies,

            random,
            obtainedAt
          })
      );
    }

    return {
      ok: true,

      type:
        'packOpen',

      pack,
      quantity:
        count,
      results,

      remaining:
        inventory[
          pack.id
        ]
    };
  }

  function openAllPacks({
    state,
    kind = '',
    random = Math.random,
    obtainedAt = Date.now()
  }) {
    normalizeState(
      state
    );

    const opened = [];
    const results = [];

    CARD
      .getPacks(
        text(kind)
          .toLowerCase()
      )
      .forEach(
        (pack) => {
          const inventory =
            packInventory(
              state,
              pack
            );

          const quantity =
            Math.max(
              0,

              int(
                inventory[
                  pack.id
                ],

                0
              )
            );

          if (!quantity) {
            return;
          }

          const result =
            openPack({
              state,

              packId:
                pack.id,

              quantity,
              random,
              obtainedAt
            });

          if (!result.ok) {
            return;
          }

          opened.push({
            packId:
              pack.id,

            quantity:
              result.quantity
          });

          results.push(
            ...result.results
          );
        }
      );

    return {
      ok: true,

      type:
        'allPackOpen',

      kind:
        text(kind)
          .toLowerCase(),

      opened,
      results
    };
  }

  /* =========================================================
     SKIN GACHA
  ========================================================= */

  function weightedSkinDraw(
    random = Math.random
  ) {
    const pool =
      SKIN_GACHA_POOL.filter(
        (skin) =>
          Number(
            skin.weight
          ) >
          0
      );

    if (
      !pool.length
    ) {
      throw new Error(
        '武器スキンガチャの抽選対象がありません。'
      );
    }

    const total =
      pool.reduce(
        (
          sum,
          skin
        ) =>
          sum +
          Number(
            skin.weight
          ),

        0
      );

    let roll =
      clamp(
        random(),
        0,
        0.999999999
      ) *
      total;

    for (
      const skin of
      pool
    ) {
      roll -=
        Number(
          skin.weight
        );

      if (
        roll < 0
      ) {
        return skin;
      }
    }

    return pool[
      pool.length -
      1
    ];
  }

  function drawWeaponSkin({
    state,
    random = Math.random
  }) {
    normalizeState(
      state
    );

    const payment =
      deductCost(
        state.currencies,
        SKIN_GACHA_COST
      );

    if (!payment.ok) {
      return {
        ...payment,

        type:
          'weaponSkinGacha'
      };
    }

    const skin =
      weightedSkinDraw(
        random
      );

    const isNew =
      !state.inventory
        .weaponSkins
        .includes(
          skin.name
        );

    if (isNew) {
      state.inventory
        .weaponSkins
        .push(
          skin.name
        );
    } else {
      state.inventory
        .weaponSkinDuplicates[
          skin.name
        ] =
        (
          state.inventory
            .weaponSkinDuplicates[
              skin.name
            ] ||
          0
        ) +
        1;
    }

    return {
      ok: true,

      type:
        'weaponSkinGacha',

      skin:
        clone(skin),

      isNew,

      duplicateCount:
        state.inventory
          .weaponSkinDuplicates[
            skin.name
          ] ||
        0,

      duplicateReward:
        null,

      cost:
        payment.cost
    };
  }

  function applyWeaponSkin({
    state,
    playerOrId,
    skinName
  }) {
    normalizeState(
      state
    );

    const player =
      typeof playerOrId ===
      'object'
        ? playerOrId
        : state.players?.[
            text(
              playerOrId
            )
          ];

    if (
      !player?.weapon
    ) {
      return {
        ok: false,

        reason:
          'PLAYER_OR_WEAPON_NOT_FOUND'
      };
    }

    const skin =
      SKIN_BY_NAME[
        text(
          skinName
        )
      ];

    if (!skin) {
      return {
        ok: false,

        reason:
          'SKIN_NOT_FOUND',

        skinName
      };
    }

    if (
      !state.inventory
        .weaponSkins
        .includes(
          skin.name
        )
    ) {
      return {
        ok: false,

        reason:
          'SKIN_NOT_OWNED',

        skin:
          clone(skin)
      };
    }

    player.weapon.skin =
      skin.name;

    player.weapon.image =
      skin.image;

    return {
      ok: true,

      type:
        'weaponSkinApply',

      playerId:
        player.id ||
        '',

      skin:
        clone(skin)
    };
  }

  /* =========================================================
     ROOM
  ========================================================= */

  function purchaseRoom({
    state,
    roomId
  }) {
    normalizeState(
      state
    );

    const room =
      ROOM_BY_ID[
        text(roomId)
      ];

    if (!room) {
      return {
        ok: false,

        reason:
          'ROOM_NOT_FOUND',

        roomId
      };
    }

    if (
      state.rooms
        .owned
        .includes(
          room.id
        )
    ) {
      return {
        ok: true,

        alreadyOwned:
          true,

        room:
          clone(room),

        cost:
          normalizeCost({})
      };
    }

    if (
      getCompanyRankNumber(
        state
      ) <
      room.rank
    ) {
      return {
        ok: false,

        reason:
          'ROOM_RANK_LOCKED',

        room:
          clone(room),

        currentCompanyRankNumber:
          getCompanyRankNumber(
            state
          ),

        requiredCompanyRankNumber:
          room.rank
      };
    }

    const payment =
      deductCost(
        state.currencies,
        room.purchase
      );

    if (!payment.ok) {
      return {
        ...payment,

        room:
          clone(room)
      };
    }

    state.rooms
      .owned
      .push(
        room.id
      );

    state.rooms
      .layouts[
        room.id
      ] =
      state.rooms
        .layouts[
          room.id
        ] ||
      [];

    return {
      ok: true,
      type: 'room',
      room:
        clone(room),
      cost:
        payment.cost
    };
  }

  function selectRoom({
    state,
    roomId
  }) {
    normalizeState(
      state
    );

    const room =
      ROOM_BY_ID[
        text(roomId)
      ];

    if (!room) {
      return {
        ok: false,

        reason:
          'ROOM_NOT_FOUND',

        roomId
      };
    }

    if (
      !state.rooms
        .owned
        .includes(
          room.id
        )
    ) {
      return {
        ok: false,

        reason:
          'ROOM_NOT_OWNED',

        room:
          clone(room)
      };
    }

    state.rooms.selected =
      room.id;

    state.rooms
      .layouts[
        room.id
      ] =
      state.rooms
        .layouts[
          room.id
        ] ||
      [];

    return {
      ok: true,

      type:
        'roomSelect',

      room:
        clone(room)
    };
  }

  /* =========================================================
     BAG
  ========================================================= */

  function equippedItemCount(
    state,
    itemId
  ) {
    normalizeState(
      state
    );

    return state.inventory
      .teamBag
      .filter(
        (id) =>
          id ===
          itemId
      )
      .length;
  }

  function addBagItem({
    state,
    itemId
  }) {
    normalizeState(
      state
    );

    const item =
      ITEM_BY_ID[
        text(itemId)
      ];

    if (!item) {
      return {
        ok: false,

        reason:
          'ITEM_NOT_FOUND',

        itemId
      };
    }

    const capacity =
      getBagCapacity(
        state
      );

    if (
      state.inventory
        .teamBag
        .length >=
      capacity
    ) {
      return {
        ok: false,

        reason:
          'BAG_FULL',

        capacity
      };
    }

    const owned =
      state.inventory
        .items[
          item.id
        ] ||
      0;

    const equipped =
      equippedItemCount(
        state,
        item.id
      );

    if (
      owned <=
      equipped
    ) {
      return {
        ok: false,

        reason:
          'ITEM_STOCK_SHORTAGE',

        item:
          clone(item),

        owned,
        equipped
      };
    }

    state.inventory
      .teamBag
      .push(
        item.id
      );

    return {
      ok: true,
      type: 'bagAdd',

      item:
        clone(item),

      capacity,

      bagCount:
        state.inventory
          .teamBag
          .length
    };
  }

  function removeBagItem({
    state,
    index
  }) {
    normalizeState(
      state
    );

    const target =
      int(
        index,
        -1
      );

    if (
      target < 0 ||
      target >=
      state.inventory
        .teamBag
        .length
    ) {
      return {
        ok: false,

        reason:
          'BAG_INDEX_INVALID',

        index:
          target
      };
    }

    const [
      itemId
    ] =
      state.inventory
        .teamBag
        .splice(
          target,
          1
        );

    return {
      ok: true,

      type:
        'bagRemove',

      item:
        getItem(
          itemId
        ),

      index:
        target,

      bagCount:
        state.inventory
          .teamBag
          .length
    };
  }

  function consumeInventoryItem({
    state,
    itemId,
    quantity = 1
  }) {
    normalizeState(
      state
    );

    const item =
      ITEM_BY_ID[
        text(itemId)
      ];

    if (!item) {
      return {
        ok: false,

        reason:
          'ITEM_NOT_FOUND',

        itemId
      };
    }

    const count =
      Math.max(
        1,

        int(
          quantity,
          1
        )
      );

    const owned =
      state.inventory
        .items[
          item.id
        ] ||
      0;

    if (
      owned <
      count
    ) {
      return {
        ok: false,

        reason:
          'ITEM_STOCK_SHORTAGE',

        item:
          clone(item),

        requested:
          count,

        owned
      };
    }

    state.inventory
      .items[
        item.id
      ] =
      owned -
      count;

    let removedFromBag =
      0;

    for (
      let index =
        state.inventory
          .teamBag
          .length -
        1;

      index >= 0 &&
      removedFromBag <
        count;

      index -= 1
    ) {
      if (
        state.inventory
          .teamBag[
            index
          ] !==
        item.id
      ) {
        continue;
      }

      state.inventory
        .teamBag
        .splice(
          index,
          1
        );

      removedFromBag +=
        1;
    }

    return {
      ok: true,

      type:
        'itemConsume',

      item:
        clone(item),

      quantity:
        count,

      remaining:
        state.inventory
          .items[
            item.id
          ],

      removedFromBag
    };
  }

  /* =========================================================
     VALIDATE
  ========================================================= */

  function validateShopData() {
    const errors = [];

    const duplicates =
      (
        rows,
        key,
        label
      ) => {
        const used =
          new Set();

        rows.forEach(
          (row) => {
            const value =
              row[key];

            if (
              used.has(
                value
              )
            ) {
              errors.push(
                `${label}重複: ${value}`
              );
            }

            used.add(
              value
            );
          }
        );
      };

    duplicates(
      ITEMS,
      'id',
      'アイテムID'
    );

    duplicates(
      WEAPON_SKINS,
      'id',
      'スキンID'
    );

    duplicates(
      WEAPON_SKINS,
      'name',
      'スキン名'
    );

    duplicates(
      ROOMS,
      'id',
      'ルームID'
    );

    ITEMS.forEach(
      (item) => {
        if (
          !item.name ||
          !item.image
        ) {
          errors.push(
            `アイテム設定不足: ${item.id}`
          );
        }

        if (
          item.price <
          0
        ) {
          errors.push(
            `アイテム価格不正: ${item.id}`
          );
        }
      }
    );

    WEAPON_SKINS.forEach(
      (skin) => {
        if (
          !skin.image
        ) {
          errors.push(
            `スキン画像未設定: ${skin.name}`
          );
        }
      }
    );

    ROOMS.forEach(
      (room) => {
        if (
          !room.image
        ) {
          errors.push(
            `ルーム画像未設定: ${room.id}`
          );
        }

        if (
          room.rank <
          1
        ) {
          errors.push(
            `ルーム解放ランク不正: ${room.id}`
          );
        }
      }
    );

    const cardPacks =
      CARD.getPacks(
        'card'
      ).length;

    const badgePacks =
      CARD.getPacks(
        'badge'
      ).length;

    if (
      cardPacks !==
      8
    ) {
      errors.push(
        `カードパック数が8ではありません: ${cardPacks}`
      );
    }

    if (
      badgePacks !==
      3
    ) {
      errors.push(
        `バッジパック数が3ではありません: ${badgePacks}`
      );
    }

    if (
      SKIN_GACHA_POOL
        .length !==
      6
    ) {
      errors.push(
        `スキンガチャ対象が6種ではありません: ${SKIN_GACHA_POOL.length}`
      );
    }

    return {
      valid:
        errors.length ===
        0,

      errors,

      counts: {
        items:
          ITEMS.length,

        weaponSkins:
          WEAPON_SKINS.length,

        initialWeaponSkins:
          WEAPON_SKINS.filter(
            (skin) =>
              skin.initial
          ).length,

        gachaWeaponSkins:
          SKIN_GACHA_POOL.length,

        rooms:
          ROOMS.length,

        cardPacks,

        badgePacks
      }
    };
  }

  const validation =
    validateShopData();

  if (
    !validation.valid
  ) {
    throw new Error(
      validation.errors.join(
        '\n'
      )
    );
  }

  const SHOP_DATA =
    Object.freeze({
      version:
        '1.0.0',

      categories:
        CATEGORIES,

      currencies:
        CURRENCIES,

      items:
        ITEMS,

      itemById:
        ITEM_BY_ID,

      weaponSkins:
        WEAPON_SKINS,

      weaponSkinByName:
        SKIN_BY_NAME,

      weaponSkinById:
        SKIN_BY_ID,

      initialWeaponSkins:
        INITIAL_SKINS,

      skinGachaPool:
        SKIN_GACHA_POOL,

      skinGachaCost:
        SKIN_GACHA_COST,

      rooms:
        ROOMS,

      roomById:
        ROOM_BY_ID,

      bagCapacitySteps:
        BAG_STEPS,

      validation
    });

  const SHOP_API =
    Object.freeze({
      clone,

      normalizeState,

      getCompanyRankIndex,
      getCompanyRankNumber,
      getBagCapacity,

      getItem,

      getItems:
        () =>
          ITEMS.map(
            clone
          ),

      getWeaponSkin,

      getWeaponSkins:
        () =>
          WEAPON_SKINS.map(
            clone
          ),

      getRoom,

      getRooms:
        () =>
          ROOMS.map(
            clone
          ),

      normalizeCost,
      canAfford,
      missingCurrencies,
      deductCost,
      addCurrencies,

      packProgressFromState,
      isPackUnlocked,
      getPackProducts,
      getShopProducts,

      purchaseItem,
      purchasePack,
      grantPack,

      openPack,
      openAllPacks,

      drawWeaponSkin,
      applyWeaponSkin,

      purchaseRoom,
      selectRoom,

      equippedItemCount,
      addBagItem,
      removeBagItem,
      consumeInventoryItem,

      validate:
        validateShopData
    });

  MOBBR.DATA.shop =
    SHOP_DATA;

  MOBBR.API.shop =
    SHOP_API;

  global.MOBBR_SHOP_DATA =
    SHOP_DATA;

  global.MOBBR_SHOP_API =
    SHOP_API;

  /* 旧HTML互換 */
  global.ITEMS =
    ITEMS;

  global.ITEM_BY_ID =
    ITEM_BY_ID;

  global.ROOMS =
    ROOMS;

  global.V8_SKINS =
    Object.fromEntries(
      WEAPON_SKINS.map(
        (skin) => [
          skin.name,
          clone(skin)
        ]
      )
    );

  global.V8_SKIN_GACHA_POOL =
    SKIN_GACHA_POOL.map(
      (skin) =>
        skin.name
    );
})(
  typeof window !==
  'undefined'
    ? window
    : globalThis
);
