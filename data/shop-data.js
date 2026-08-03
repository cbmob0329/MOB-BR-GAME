/**
 * MOB BR shop and consumable item master data.
 *
 * Purchase execution, inventory mutation, and pack opening are implemented in
 * later main-system modules. Tournament code must receive an item-master
 * snapshot instead of duplicating these definitions.
 */

export const SHOP_DATA_VERSION = "mobbr-shop-data-1.1.0";
export const ITEM_MASTER_VERSION = "mobbr-item-master-1.0.0";
export const PACK_MASTER_VERSION = "mobbr-pack-master-1.0.0";
export const WEAPON_SKIN_MASTER_VERSION = "mobbr-weapon-skin-master-1.0.0";

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

export const SHOP_CATEGORIES = deepFreeze({
  item: { id: "item", name: "ITEM", icon: "icon/item.png" },
  card: { id: "card", name: "CARD", icon: "icon/car.png" },
  cookingIngredient: {
    id: "cooking_ingredient",
    name: "食材",
    icon: "icon/kitbox.png",
    status: "data_ready_ui_pending",
  },
  cookingUtensil: {
    id: "cooking_utensil",
    name: "調理器具",
    icon: "icon/kitbox.png",
    status: "data_ready_ui_pending",
  },
});

export const SHOP_MASTER_NOTES = deepFreeze({
  authoritativePackUnlockRule:
    "Vol.1-2 initial; Vol.3-5 National top 5; Vol.6-8 World Final top 5.",
  imagePathCorrections: {
    pb2Gummy: "item/gumi1.png",
    mobCottonCandy: "item/wta.png",
  },
  itemCountDecision:
    "The explicit main item list contains 18 items. It is retained as the authoritative master.",
  explorationRarityWeights:
    "Exact rarity weights are not defined yet; rarityWeight remains null until the exploration balance pass.",
});

export const CONSUMABLE_ITEMS = deepFreeze([
  {
    "itemId": "spin_knit",
    "name": "スピンニット",
    "image": "item/nit.png",
    "category": "single_stat_up",
    "price": {
      "coin": 5000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "選択選手のエイム+1（現在マッチ中のみ）。",
    "targetType": "single_alive_member",
    "effectType": "match_stat",
    "effectValue": {
      "stat": "aim",
      "amount": 1
    },
    "duration": "current_match",
    "usableCondition": "alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_stat_aim",
    "commentaryTags": [
      "item",
      "aim_up"
    ]
  },
  {
    "itemId": "high_spin_knit",
    "name": "ハイスピンニット",
    "image": "item/hinit.png",
    "category": "single_stat_up",
    "price": {
      "coin": 15000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "選択選手のエイム+2（現在マッチ中のみ）。",
    "targetType": "single_alive_member",
    "effectType": "match_stat",
    "effectValue": {
      "stat": "aim",
      "amount": 2
    },
    "duration": "current_match",
    "usableCondition": "alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_stat_aim",
    "commentaryTags": [
      "item",
      "aim_up"
    ]
  },
  {
    "itemId": "master_heads",
    "name": "マスターヘッズ",
    "image": "item/master.png",
    "category": "single_stat_up",
    "price": {
      "coin": 30000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "選択選手のエイム+3（現在マッチ中のみ）。",
    "targetType": "single_alive_member",
    "effectType": "match_stat",
    "effectValue": {
      "stat": "aim",
      "amount": 3
    },
    "duration": "current_match",
    "usableCondition": "alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_stat_aim",
    "commentaryTags": [
      "item",
      "aim_up"
    ]
  },
  {
    "itemId": "scope",
    "name": "スコープ",
    "image": "item/sc.png",
    "category": "single_stat_up",
    "price": {
      "coin": 5000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "選択選手のテクニック+1（現在マッチ中のみ）。",
    "targetType": "single_alive_member",
    "effectType": "match_stat",
    "effectValue": {
      "stat": "technique",
      "amount": 1
    },
    "duration": "current_match",
    "usableCondition": "alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_stat_technique",
    "commentaryTags": [
      "item",
      "technique_up"
    ]
  },
  {
    "itemId": "rare_scope",
    "name": "レアスコープ",
    "image": "item/sc2.png",
    "category": "single_stat_up",
    "price": {
      "coin": 15000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "選択選手のテクニック+2（現在マッチ中のみ）。",
    "targetType": "single_alive_member",
    "effectType": "match_stat",
    "effectValue": {
      "stat": "technique",
      "amount": 2
    },
    "duration": "current_match",
    "usableCondition": "alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_stat_technique",
    "commentaryTags": [
      "item",
      "technique_up"
    ]
  },
  {
    "itemId": "ultra_scope",
    "name": "ウルスコープ",
    "image": "item/sc3.png",
    "category": "single_stat_up",
    "price": {
      "coin": 30000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "選択選手のテクニック+3（現在マッチ中のみ）。",
    "targetType": "single_alive_member",
    "effectType": "match_stat",
    "effectValue": {
      "stat": "technique",
      "amount": 3
    },
    "duration": "current_match",
    "usableCondition": "alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_stat_technique",
    "commentaryTags": [
      "item",
      "technique_up"
    ]
  },
  {
    "itemId": "unfinished_book",
    "name": "読みかけの本",
    "image": "item/y1.png",
    "category": "single_stat_up",
    "price": {
      "coin": 5000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "選択選手のマインド+1（現在マッチ中のみ）。",
    "targetType": "single_alive_member",
    "effectType": "match_stat",
    "effectValue": {
      "stat": "mind",
      "amount": 1
    },
    "duration": "current_match",
    "usableCondition": "alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_stat_mind",
    "commentaryTags": [
      "item",
      "mind_up"
    ]
  },
  {
    "itemId": "unfinished_book_sequel",
    "name": "続・読みかけの本",
    "image": "item/y2.png",
    "category": "single_stat_up",
    "price": {
      "coin": 15000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "選択選手のマインド+2（現在マッチ中のみ）。",
    "targetType": "single_alive_member",
    "effectType": "match_stat",
    "effectValue": {
      "stat": "mind",
      "amount": 2
    },
    "duration": "current_match",
    "usableCondition": "alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_stat_mind",
    "commentaryTags": [
      "item",
      "mind_up"
    ]
  },
  {
    "itemId": "unfinished_book_extreme",
    "name": "極・読みかけの本",
    "image": "item/y3.png",
    "category": "single_stat_up",
    "price": {
      "coin": 30000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "選択選手のマインド+3（現在マッチ中のみ）。",
    "targetType": "single_alive_member",
    "effectType": "match_stat",
    "effectValue": {
      "stat": "mind",
      "amount": 3
    },
    "duration": "current_match",
    "usableCondition": "alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_stat_mind",
    "commentaryTags": [
      "item",
      "mind_up"
    ]
  },
  {
    "itemId": "rattle_trip",
    "name": "ガラガラの旅",
    "image": "item/g1.png",
    "category": "single_stat_up",
    "price": {
      "coin": 5000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "選択選手のアジリティ+1（現在マッチ中のみ）。",
    "targetType": "single_alive_member",
    "effectType": "match_stat",
    "effectValue": {
      "stat": "agility",
      "amount": 1
    },
    "duration": "current_match",
    "usableCondition": "alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_stat_agility",
    "commentaryTags": [
      "item",
      "agility_up"
    ]
  },
  {
    "itemId": "domestic_rattle_trip",
    "name": "国内ガラガラの旅",
    "image": "item/g2.png",
    "category": "single_stat_up",
    "price": {
      "coin": 15000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "選択選手のアジリティ+2（現在マッチ中のみ）。",
    "targetType": "single_alive_member",
    "effectType": "match_stat",
    "effectValue": {
      "stat": "agility",
      "amount": 2
    },
    "duration": "current_match",
    "usableCondition": "alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_stat_agility",
    "commentaryTags": [
      "item",
      "agility_up"
    ]
  },
  {
    "itemId": "overseas_rattle_trip",
    "name": "海外ガラガラの旅",
    "image": "item/g3.png",
    "category": "single_stat_up",
    "price": {
      "coin": 30000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "選択選手のアジリティ+3（現在マッチ中のみ）。",
    "targetType": "single_alive_member",
    "effectType": "match_stat",
    "effectValue": {
      "stat": "agility",
      "amount": 3
    },
    "duration": "current_match",
    "usableCondition": "alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_stat_agility",
    "commentaryTags": [
      "item",
      "agility_up"
    ]
  },
  {
    "itemId": "pb2_gummy",
    "name": "PB2グミ",
    "image": "item/gumi1.png",
    "legacyImages": [
      "item/gumi.png"
    ],
    "category": "single_hp_heal",
    "price": {
      "coin": 3000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "選択選手を最大HPの30%回復。",
    "targetType": "single_alive_member",
    "effectType": "heal_max_hp_rate",
    "effectValue": {
      "rate": 0.3
    },
    "duration": "instant",
    "usableCondition": "damaged_alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_heal_single",
    "commentaryTags": [
      "item",
      "heal"
    ]
  },
  {
    "itemId": "pb2_toy_gummy",
    "name": "PB2 おもちゃ付きグミ",
    "image": "item/gumi2.png",
    "category": "single_hp_heal",
    "price": {
      "coin": 13000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "選択選手を最大HPの50%回復。",
    "targetType": "single_alive_member",
    "effectType": "heal_max_hp_rate",
    "effectValue": {
      "rate": 0.5
    },
    "duration": "instant",
    "usableCondition": "damaged_alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_heal_single",
    "commentaryTags": [
      "item",
      "heal"
    ]
  },
  {
    "itemId": "pb2_champion_gummy",
    "name": "PB2 優勝特典グミ",
    "image": "item/gumi3.png",
    "category": "single_hp_heal",
    "price": {
      "coin": 50000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "選択選手を最大HPの70%回復。",
    "targetType": "single_alive_member",
    "effectType": "heal_max_hp_rate",
    "effectValue": {
      "rate": 0.7
    },
    "duration": "instant",
    "usableCondition": "damaged_alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_heal_single",
    "commentaryTags": [
      "item",
      "heal"
    ]
  },
  {
    "itemId": "mob_cotton_candy",
    "name": "MOB わたあめ",
    "image": "item/wta.png",
    "legacyImages": [
      "item/wata.png"
    ],
    "category": "team_hp_heal",
    "price": {
      "coin": 100000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "生存しているチーム全員を最大HPの30%回復。",
    "targetType": "all_alive_members",
    "effectType": "heal_max_hp_rate",
    "effectValue": {
      "rate": 0.3
    },
    "duration": "instant",
    "usableCondition": "damaged_alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_heal_team",
    "commentaryTags": [
      "item",
      "team_heal"
    ]
  },
  {
    "itemId": "mob_energy_drink",
    "name": "MOB エナジードリンク",
    "image": "item/ena.png",
    "category": "team_hp_heal",
    "price": {
      "coin": 500000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "生存しているチーム全員を最大HPの50%回復。",
    "targetType": "all_alive_members",
    "effectType": "heal_max_hp_rate",
    "effectValue": {
      "rate": 0.5
    },
    "duration": "instant",
    "usableCondition": "damaged_alive_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_heal_team",
    "commentaryTags": [
      "item",
      "team_heal"
    ]
  },
  {
    "itemId": "respawn_record",
    "name": "リスポーンレコード",
    "image": "item/re.png",
    "category": "confirmed_kill_revive",
    "price": {
      "coin": 30000,
      "diamond": 0,
      "ruby": 0
    },
    "description": "確キルされた味方1人を最大HPの50%で復活。",
    "targetType": "single_dead_member",
    "effectType": "revive_max_hp_rate",
    "effectValue": {
      "rate": 0.5
    },
    "duration": "instant",
    "usableCondition": "dead_target_exists",
    "rarityWeight": null,
    "visualEffectId": "item_respawn",
    "commentaryTags": [
      "item",
      "respawn",
      "confirmed_kill_revive"
    ]
  }
]);
export const CARD_PACKS = deepFreeze([
  {
    "packId": "card_pack_vol_1",
    "name": "Vol.1",
    "image": "item/vol1.png",
    "price": {
      "coin": 0,
      "diamond": 10,
      "ruby": 0
    },
    "cardsPerPack": 1,
    "unlock": {
      "type": "initial"
    },
    "teamIds": [
      "L1",
      "L2",
      "L3",
      "L4",
      "L5",
      "L11",
      "L12",
      "L13",
      "L14",
      "L15",
      "L16"
    ]
  },
  {
    "packId": "card_pack_vol_2",
    "name": "Vol.2",
    "image": "item/vol2.png",
    "price": {
      "coin": 0,
      "diamond": 10,
      "ruby": 0
    },
    "cardsPerPack": 1,
    "unlock": {
      "type": "initial"
    },
    "teamIds": [
      "L6",
      "L7",
      "L8",
      "L9",
      "L10",
      "L17",
      "L18",
      "L19",
      "L20",
      "L21",
      "L22",
      "L23"
    ]
  },
  {
    "packId": "card_pack_vol_3",
    "name": "Vol.3",
    "image": "item/vol3.png",
    "price": {
      "coin": 0,
      "diamond": 10,
      "ruby": 0
    },
    "cardsPerPack": 1,
    "unlock": {
      "type": "tournament_top",
      "tier": "national",
      "maxPlace": 5
    },
    "teamIds": [
      "N1",
      "N2",
      "N3",
      "N4",
      "N5",
      "N6",
      "N7",
      "N8",
      "N9",
      "N10",
      "N11",
      "N12",
      "N13"
    ]
  },
  {
    "packId": "card_pack_vol_4",
    "name": "Vol.4",
    "image": "item/vol4.png",
    "price": {
      "coin": 0,
      "diamond": 10,
      "ruby": 0
    },
    "cardsPerPack": 1,
    "unlock": {
      "type": "tournament_top",
      "tier": "national",
      "maxPlace": 5
    },
    "teamIds": [
      "N14",
      "N15",
      "N16",
      "N17",
      "N18",
      "N19",
      "N20",
      "N21",
      "N22",
      "N23",
      "N24",
      "N25",
      "N26",
      "N27",
      "N28"
    ]
  },
  {
    "packId": "card_pack_vol_5",
    "name": "Vol.5",
    "image": "item/vol5.png",
    "price": {
      "coin": 0,
      "diamond": 10,
      "ruby": 0
    },
    "cardsPerPack": 1,
    "unlock": {
      "type": "tournament_top",
      "tier": "national",
      "maxPlace": 5
    },
    "teamIds": [
      "N29",
      "N30",
      "N31",
      "N32",
      "N33",
      "N34",
      "N35",
      "N36",
      "N37",
      "N38",
      "N39",
      "N40"
    ]
  },
  {
    "packId": "card_pack_vol_6",
    "name": "Vol.6",
    "image": "item/vol6.png",
    "price": {
      "coin": 0,
      "diamond": 10,
      "ruby": 0
    },
    "cardsPerPack": 1,
    "unlock": {
      "type": "tournament_top",
      "tier": "world_final",
      "maxPlace": 5
    },
    "teamIds": [
      "W1",
      "W2",
      "W3",
      "W4",
      "W5",
      "W11",
      "W12",
      "W13",
      "W14",
      "W15"
    ]
  },
  {
    "packId": "card_pack_vol_7",
    "name": "Vol.7",
    "image": "item/vol7.png",
    "price": {
      "coin": 0,
      "diamond": 10,
      "ruby": 0
    },
    "cardsPerPack": 1,
    "unlock": {
      "type": "tournament_top",
      "tier": "world_final",
      "maxPlace": 5
    },
    "teamIds": [
      "W6",
      "W7",
      "W8",
      "W9",
      "W10",
      "W16",
      "W17",
      "W18",
      "W19",
      "W20",
      "W21",
      "W22",
      "W23",
      "W24",
      "W25",
      "W26"
    ]
  },
  {
    "packId": "card_pack_vol_8",
    "name": "Vol.8",
    "image": "item/vol8.png",
    "price": {
      "coin": 0,
      "diamond": 10,
      "ruby": 0
    },
    "cardsPerPack": 1,
    "unlock": {
      "type": "tournament_top",
      "tier": "world_final",
      "maxPlace": 5
    },
    "teamIds": [
      "W27",
      "W28",
      "W29",
      "W30",
      "W31",
      "W32",
      "W33",
      "W34",
      "W35",
      "W36",
      "W37",
      "W38",
      "W39",
      "W40",
      "W41"
    ]
  }
]);
export const BADGE_PACKS = deepFreeze([
  {
    "packId": "local_badge_pack",
    "name": "LOCAL BADGE PACK",
    "image": "item/lb.png",
    "source": "tournament_reward_only",
    "badgesPerPack": 1,
    "tier": "local"
  },
  {
    "packId": "national_badge_pack",
    "name": "NATIONAL BADGE PACK",
    "image": "item/nb.png",
    "source": "tournament_reward_only",
    "badgesPerPack": 1,
    "tier": "national"
  },
  {
    "packId": "world_badge_pack",
    "name": "WORLD BADGE PACK",
    "image": "item/wb.png",
    "source": "tournament_reward_only",
    "badgesPerPack": 1,
    "tier": "world"
  }
]);
export const WEAPON_SKINS = deepFreeze([
  {
    "skinId": "green_bash",
    "name": "グリーンバッシュ",
    "image": "wepon/01.png",
    "source": "initial",
    "order": 1
  },
  {
    "skinId": "emerald_gun",
    "name": "エメラルドガン",
    "image": "wepon/02.png",
    "source": "initial",
    "order": 2
  },
  {
    "skinId": "purple_bullet",
    "name": "パープルバレット",
    "image": "wepon/03.png",
    "source": "initial",
    "order": 3
  },
  {
    "skinId": "slime_revolver",
    "name": "スライムリボルバー",
    "image": "wepon/04.png",
    "source": "gacha",
    "order": 4
  },
  {
    "skinId": "golem_machine_gun",
    "name": "ゴーレムマシンガン",
    "image": "wepon/05.png",
    "source": "gacha",
    "order": 5
  },
  {
    "skinId": "antique_irukaeru",
    "name": "アンティークイルカエル",
    "image": "wepon/06.png",
    "source": "gacha",
    "order": 6
  },
  {
    "skinId": "moon_pink",
    "name": "ムーンピンク",
    "image": "wepon/07.png",
    "source": "gacha",
    "order": 7
  },
  {
    "skinId": "thunder_graffiti",
    "name": "サンダーグラフィティ",
    "image": "wepon/08.png",
    "source": "gacha",
    "order": 8
  },
  {
    "skinId": "mob_sniper",
    "name": "MOBスナイパー",
    "image": "wepon/09.png",
    "source": "gacha",
    "order": 9
  },
  {
    "skinId": "guardian_shotgun",
    "name": "ガーディアンショットガン",
    "image": "wepon/10.png",
    "source": "gacha",
    "order": 10
  },
  {
    "skinId": "miramob_sniper",
    "name": "ミラモブスナイパー",
    "image": "wepon/11.png",
    "source": "gacha",
    "order": 11
  },
  {
    "skinId": "neon_nyaan",
    "name": "ネオンニャーン",
    "image": "wepon/12.png",
    "source": "gacha",
    "order": 12
  }
]);

export const WEAPON_SKIN_GACHA_RULES = deepFreeze({
  confirmationRequired: true,
  price: { coin: 0, diamond: 50, ruby: 3 },
  duplicatesAllowed: false,
  ownedSkinsRemovedFromPool: true,
  probabilityModel: "lower_number_preferred_pending_exact_weights",
});

const itemById = new Map(CONSUMABLE_ITEMS.map((item) => [item.itemId, item]));
const cardPackById = new Map(CARD_PACKS.map((pack) => [pack.packId, pack]));
const badgePackById = new Map(BADGE_PACKS.map((pack) => [pack.packId, pack]));
const skinById = new Map(WEAPON_SKINS.map((skin) => [skin.skinId, skin]));

export function getItem(itemId) {
  const item = itemById.get(itemId);
  if (!item) {
    throw new RangeError(`Unknown item: ${itemId}`);
  }
  return item;
}

export function getCardPack(packId) {
  const pack = cardPackById.get(packId);
  if (!pack) {
    throw new RangeError(`Unknown card pack: ${packId}`);
  }
  return pack;
}

export function getBadgePack(packId) {
  const pack = badgePackById.get(packId);
  if (!pack) {
    throw new RangeError(`Unknown badge pack: ${packId}`);
  }
  return pack;
}

export function getWeaponSkin(skinId) {
  const skin = skinById.get(skinId);
  if (!skin) {
    throw new RangeError(`Unknown weapon skin: ${skinId}`);
  }
  return skin;
}

export function isCardPackUnlocked(packId, progress) {
  const pack = getCardPack(packId);
  if (pack.unlock.type === "initial") {
    return true;
  }
  if (!progress || typeof progress !== "object") {
    return false;
  }

  const bestPlace = progress.bestPlacements?.[pack.unlock.tier];
  return (
    Number.isInteger(bestPlace) &&
    bestPlace >= 1 &&
    bestPlace <= pack.unlock.maxPlace
  );
}

export function getAvailableWeaponSkinGachaPool(ownedSkinIds) {
  if (!Array.isArray(ownedSkinIds)) {
    throw new TypeError("Owned skin IDs must be an array.");
  }
  const owned = new Set(ownedSkinIds);
  return Object.freeze(
    WEAPON_SKINS
      .filter((skin) => skin.source === "gacha" && !owned.has(skin.skinId))
      .sort((left, right) => left.order - right.order),
  );
}

export function validateShopMaster() {
  const allIds = [
    ...CONSUMABLE_ITEMS.map((item) => item.itemId),
    ...CARD_PACKS.map((pack) => pack.packId),
    ...BADGE_PACKS.map((pack) => pack.packId),
    ...WEAPON_SKINS.map((skin) => skin.skinId),
  ];
  if (new Set(allIds).size !== allIds.length) {
    throw new Error("Duplicate shop master ID detected.");
  }

  for (const item of CONSUMABLE_ITEMS) {
    if (!item.image || !item.name || !item.category) {
      throw new Error(`Missing required item field: ${item.itemId}`);
    }
    for (const currency of ["coin", "diamond", "ruby"]) {
      const amount = item.price[currency];
      if (!Number.isInteger(amount) || amount < 0) {
        throw new Error(`Invalid item price: ${item.itemId}/${currency}`);
      }
    }
  }

  for (const pack of CARD_PACKS) {
    if (pack.cardsPerPack !== 1 || pack.teamIds.length === 0) {
      throw new Error(`Invalid card pack: ${pack.packId}`);
    }
  }

  return Object.freeze({
    consumableItemCount: CONSUMABLE_ITEMS.length,
    cardPackCount: CARD_PACKS.length,
    badgePackCount: BADGE_PACKS.length,
    weaponSkinCount: WEAPON_SKINS.length,
    valid: true,
  });
}
