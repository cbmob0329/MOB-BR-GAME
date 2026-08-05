/**
 * MOB BR cooking-system master and state foundation.
 *
 * Generation 40 introduced source-backed master data and persistent state.
 * Generation 41 connects utensil placement, real-time cooking jobs, quality
 * persistence, completion collection and kitchen UI transactions.
 */

import {
  getCompanyRankData,
} from "./game-data.js?v=45";

export const COOKING_DATA_VERSION =
  "mobbr-cooking-data-1.1.0";
export const INGREDIENT_MASTER_VERSION =
  "mobbr-ingredient-master-1.0.0";
export const RECIPE_MASTER_VERSION =
  "mobbr-recipe-master-1.0.0";
export const COOKING_UTENSIL_MASTER_VERSION =
  "mobbr-cooking-utensil-master-1.0.0";
export const COOKING_STATE_SCHEMA_VERSION =
  "mobbr-cooking-state-1.1.0";

function deepFreeze(value) {
  if (
    value &&
    typeof value === "object" &&
    !Object.isFrozen(value)
  ) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
  }
  return value;
}

function deepClone(value) {
  if (
    typeof globalThis.structuredClone ===
    "function"
  ) {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(
    JSON.stringify(value),
  );
}

function assertPlainObject(value, label) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    throw new TypeError(
      `${label} must be a plain object.`,
    );
  }
  return value;
}

function assertNonNegativeInteger(
  value,
  label,
) {
  if (
    !Number.isInteger(value) ||
    value < 0
  ) {
    throw new RangeError(
      `${label} must be a non-negative integer.`,
    );
  }
  return value;
}

function dateKey(gameDate) {
  const year =
    Number(gameDate?.year);
  const month =
    Number(gameDate?.month);
  const week =
    Number(gameDate?.week);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(week)
  ) {
    throw new TypeError(
      "Game date must contain integer year, month and week.",
    );
  }
  return `${year}-${String(month).padStart(2, "0")}-W${week}`;
}

export const COOKING_SCREEN_ASSETS =
  deepFreeze({
    kitchenBackground:
      "back/kitmain.png",
    storageBoxIcon:
      "icon/kitbox.png",
    cafeteriaBackground:
      "back/kitroom.png",
  });

export const COOKING_RULES = deepFreeze({
  maximumIngredientSlots: 5,
  utensilSlotColumns: 5,
  utensilSlotRows: 3,
  utensilSlotCount: 15,
  weeklyIngredientStockCount: 20,
  storageBoxColumns: 5,
  storageBoxRows: 5,
  storageBoxPageSize: 25,
  normalQualityRate: 0.8,
  premiumQualityRate: 0.15,
  legendaryQualityRate: 0.05,
  ingredientConsumptionPerRecipeEntry: 1,
  commonMaterialsAreConsumed: false,
});

export const COMMON_COOKING_MATERIALS =
  deepFreeze([
    {
      materialId: "egg",
      name: "卵",
      consumed: false,
    },
    {
      materialId: "oil",
      name: "油",
      consumed: false,
    },
    {
      materialId: "water",
      name: "水",
      consumed: false,
    },
    {
      materialId: "stock",
      name: "だし",
      consumed: false,
    },
    {
      materialId: "carbonated_water",
      name: "炭酸水",
      consumed: false,
    },
  ]);

export const COOKING_INGREDIENT_ALIASES =
  deepFreeze({
    fish:
      "魚は鮭、マグロなどを含む。",
    meat:
      "お肉は牛肉、豚肉、鶏肉、ベーコン、ハムなどを含む。",
  });

export const FOOD_RANK_MASTER =
  deepFreeze({
    D: {
      rank: "D",
      unlockCompanyRank: "F1",
      minimumIngredients: 2,
      maximumIngredients: 3,
      guidelineMinimumSeconds: 10,
      guidelineMaximumSeconds: 30,
    },
    C: {
      rank: "C",
      unlockCompanyRank: "F3",
      minimumIngredients: 3,
      maximumIngredients: 3,
      guidelineMinimumSeconds: 35,
      guidelineMaximumSeconds: 90,
    },
    B: {
      rank: "B",
      unlockCompanyRank: "F5",
      minimumIngredients: 3,
      maximumIngredients: 4,
      guidelineMinimumSeconds: 75,
      guidelineMaximumSeconds: 180,
    },
    A: {
      rank: "A",
      unlockCompanyRank: "E1",
      minimumIngredients: 5,
      maximumIngredients: 5,
      guidelineMinimumSeconds: 210,
      guidelineMaximumSeconds: 300,
    },
    S: {
      rank: "S",
      unlockCompanyRank: null,
      baseRecipeAvailable: false,
      qualityOnly: true,
    },
    SS: {
      rank: "SS",
      unlockCompanyRank: null,
      baseRecipeAvailable: false,
      qualityOnly: true,
    },
  });

export const FOOD_QUALITY_MASTER =
  deepFreeze([
    {
      qualityId: "normal",
      namePrefix: "",
      japaneseLabel: "通常",
      probability: 0.8,
      rankMode: "base",
    },
    {
      qualityId: "premium",
      namePrefix: "高級",
      japaneseLabel: "高級",
      probability: 0.15,
      rankMode: "one_rank_up",
    },
    {
      qualityId: "legendary",
      namePrefix: "伝説の",
      japaneseLabel: "伝説",
      probability: 0.05,
      rankMode: "force_ss",
    },
  ]);

export const INGREDIENT_MASTER =
  deepFreeze([
  {
    "number": 1,
    "ingredientId": "ingredient_01",
    "name": "ホウレンソウ",
    "image": "sk/01.png",
    "priceCoin": 2500,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 2,
    "ingredientId": "ingredient_02",
    "name": "アスパラ",
    "image": "sk/02.png",
    "priceCoin": 4500,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 3,
    "ingredientId": "ingredient_03",
    "name": "たまねぎ",
    "image": "sk/03.png",
    "priceCoin": 1800,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 4,
    "ingredientId": "ingredient_04",
    "name": "ジャガイモ",
    "image": "sk/04.png",
    "priceCoin": 2000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 5,
    "ingredientId": "ingredient_05",
    "name": "にんじん",
    "image": "sk/05.png",
    "priceCoin": 1800,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 6,
    "ingredientId": "ingredient_06",
    "name": "たけのこ",
    "image": "sk/06.png",
    "priceCoin": 5500,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 7,
    "ingredientId": "ingredient_07",
    "name": "オクラ",
    "image": "sk/07.png",
    "priceCoin": 3500,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 8,
    "ingredientId": "ingredient_08",
    "name": "ニンニク",
    "image": "sk/08.png",
    "priceCoin": 3000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 9,
    "ingredientId": "ingredient_09",
    "name": "ねぎ",
    "image": "sk/09.png",
    "priceCoin": 2200,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 10,
    "ingredientId": "ingredient_10",
    "name": "バナナ",
    "image": "sk/10.png",
    "priceCoin": 3500,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 11,
    "ingredientId": "ingredient_11",
    "name": "抹茶",
    "image": "sk/11.png",
    "priceCoin": 8000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 12,
    "ingredientId": "ingredient_12",
    "name": "生姜",
    "image": "sk/12.png",
    "priceCoin": 2800,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 13,
    "ingredientId": "ingredient_13",
    "name": "お酢",
    "image": "sk/13.png",
    "priceCoin": 1500,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 14,
    "ingredientId": "ingredient_14",
    "name": "生クリーム",
    "image": "sk/14.png",
    "priceCoin": 9000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 15,
    "ingredientId": "ingredient_15",
    "name": "魚",
    "image": "sk/15.png",
    "priceCoin": 13000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 16,
    "ingredientId": "ingredient_16",
    "name": "イチゴ",
    "image": "sk/16.png",
    "priceCoin": 7000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 17,
    "ingredientId": "ingredient_17",
    "name": "ピーマン",
    "image": "sk/17.png",
    "priceCoin": 3000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 18,
    "ingredientId": "ingredient_18",
    "name": "しいたけ",
    "image": "sk/18.png",
    "priceCoin": 4500,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 19,
    "ingredientId": "ingredient_19",
    "name": "エノキ",
    "image": "sk/19.png",
    "priceCoin": 3200,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 20,
    "ingredientId": "ingredient_20",
    "name": "パプリカ",
    "image": "sk/20.png",
    "priceCoin": 4000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 21,
    "ingredientId": "ingredient_21",
    "name": "レタス",
    "image": "sk/21.png",
    "priceCoin": 2000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 22,
    "ingredientId": "ingredient_22",
    "name": "コーヒー豆",
    "image": "sk/22.png",
    "priceCoin": 7000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 23,
    "ingredientId": "ingredient_23",
    "name": "カレールー",
    "image": "sk/23.png",
    "priceCoin": 6500,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 24,
    "ingredientId": "ingredient_24",
    "name": "牛乳",
    "image": "sk/24.png",
    "priceCoin": 4000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 25,
    "ingredientId": "ingredient_25",
    "name": "お肉",
    "image": "sk/25.png",
    "priceCoin": 15000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 26,
    "ingredientId": "ingredient_26",
    "name": "キャベツ",
    "image": "sk/26.png",
    "priceCoin": 1800,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 27,
    "ingredientId": "ingredient_27",
    "name": "トマト",
    "image": "sk/27.png",
    "priceCoin": 2800,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 28,
    "ingredientId": "ingredient_28",
    "name": "小豆",
    "image": "sk/28.png",
    "priceCoin": 6500,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 29,
    "ingredientId": "ingredient_29",
    "name": "マヨネーズ",
    "image": "sk/29.png",
    "priceCoin": 2500,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 30,
    "ingredientId": "ingredient_30",
    "name": "唐辛子",
    "image": "sk/30.png",
    "priceCoin": 3800,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 31,
    "ingredientId": "ingredient_31",
    "name": "豆腐",
    "image": "sk/31.png",
    "priceCoin": 3000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 32,
    "ingredientId": "ingredient_32",
    "name": "ゴマ",
    "image": "sk/32.png",
    "priceCoin": 3000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 33,
    "ingredientId": "ingredient_33",
    "name": "バター",
    "image": "sk/33.png",
    "priceCoin": 6000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 34,
    "ingredientId": "ingredient_34",
    "name": "チョコレート",
    "image": "sk/34.png",
    "priceCoin": 10000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 35,
    "ingredientId": "ingredient_35",
    "name": "みかん",
    "image": "sk/35.png",
    "priceCoin": 5000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 36,
    "ingredientId": "ingredient_36",
    "name": "砂糖",
    "image": "sk/36.png",
    "priceCoin": 1000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 37,
    "ingredientId": "ingredient_37",
    "name": "ぶどう",
    "image": "sk/37.png",
    "priceCoin": 7000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 38,
    "ingredientId": "ingredient_38",
    "name": "塩",
    "image": "sk/38.png",
    "priceCoin": 1000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 39,
    "ingredientId": "ingredient_39",
    "name": "チーズ",
    "image": "sk/39.png",
    "priceCoin": 11000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 40,
    "ingredientId": "ingredient_40",
    "name": "お米",
    "image": "sk/40.png",
    "priceCoin": 3000,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  },
  {
    "number": 41,
    "ingredientId": "ingredient_41",
    "name": "小麦",
    "image": "sk/41.png",
    "priceCoin": 2500,
    "shopCategory": "cooking_ingredient",
    "consumedPerRecipe": 1
  }
]);

export const COOKING_UTENSIL_MASTER =
  deepFreeze([
  {
    "utensilId": "frying_pan",
    "name": "フライパン",
    "image": null,
    "priceCoin": 0,
    "initialOwned": 1,
    "shopAvailable": false,
    "shopCategory": "cooking_utensil",
    "imageStatus": "not_specified_in_source"
  },
  {
    "utensilId": "pot",
    "name": "鍋",
    "image": null,
    "priceCoin": 10000,
    "initialOwned": 0,
    "shopAvailable": true,
    "shopCategory": "cooking_utensil",
    "imageStatus": "not_specified_in_source"
  },
  {
    "utensilId": "oven",
    "name": "オーブン",
    "image": null,
    "priceCoin": 50000,
    "initialOwned": 0,
    "shopAvailable": true,
    "shopCategory": "cooking_utensil",
    "imageStatus": "not_specified_in_source"
  },
  {
    "utensilId": "steamer",
    "name": "蒸し器",
    "image": null,
    "priceCoin": 100000,
    "initialOwned": 0,
    "shopAvailable": true,
    "shopCategory": "cooking_utensil",
    "imageStatus": "not_specified_in_source"
  },
  {
    "utensilId": "mixer",
    "name": "ミキサー",
    "image": null,
    "priceCoin": 300000,
    "initialOwned": 0,
    "shopAvailable": true,
    "shopCategory": "cooking_utensil",
    "imageStatus": "not_specified_in_source"
  }
]);

export const RECIPE_MASTER =
  deepFreeze([
  {
    "number": 1,
    "recipeId": "food_001",
    "name": "おにぎり",
    "image": "food/01.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_40",
      "ingredient_38"
    ],
    "ingredientCount": 2,
    "completionSeconds": 10,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 2,
    "recipeId": "food_002",
    "name": "コッペパン",
    "image": "food/02.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_24",
      "ingredient_36"
    ],
    "ingredientCount": 3,
    "completionSeconds": 20,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 3,
    "recipeId": "food_003",
    "name": "フランスパン",
    "image": "food/03.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_38",
      "ingredient_33"
    ],
    "ingredientCount": 3,
    "completionSeconds": 25,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 4,
    "recipeId": "food_004",
    "name": "カステラ",
    "image": "food/04.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_36",
      "ingredient_24"
    ],
    "ingredientCount": 3,
    "completionSeconds": 50,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 5,
    "recipeId": "food_005",
    "name": "クロワッサン",
    "image": "food/05.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_33",
      "ingredient_24"
    ],
    "ingredientCount": 3,
    "completionSeconds": 60,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 6,
    "recipeId": "food_006",
    "name": "サンドウィッチ",
    "image": "food/06.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_21",
      "ingredient_01"
    ],
    "ingredientCount": 4,
    "completionSeconds": 120,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 7,
    "recipeId": "food_007",
    "name": "あんぱん",
    "image": "food/07.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_28",
      "ingredient_36"
    ],
    "ingredientCount": 3,
    "completionSeconds": 70,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 8,
    "recipeId": "food_008",
    "name": "ベーグル",
    "image": "food/08.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_38",
      "ingredient_36"
    ],
    "ingredientCount": 3,
    "completionSeconds": 30,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 9,
    "recipeId": "food_009",
    "name": "コーヒーベーグル",
    "image": "food/09.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_22",
      "ingredient_36"
    ],
    "ingredientCount": 3,
    "completionSeconds": 75,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 10,
    "recipeId": "food_010",
    "name": "バタートースト",
    "image": "food/10.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_33"
    ],
    "ingredientCount": 2,
    "completionSeconds": 15,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 11,
    "recipeId": "food_011",
    "name": "チーズパン",
    "image": "food/11.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_39",
      "ingredient_33"
    ],
    "ingredientCount": 3,
    "completionSeconds": 65,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 12,
    "recipeId": "food_012",
    "name": "メロンパン",
    "image": "food/12.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_36",
      "ingredient_33"
    ],
    "ingredientCount": 3,
    "completionSeconds": 70,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 13,
    "recipeId": "food_013",
    "name": "カルボナーラ",
    "image": "food/13.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_39",
      "ingredient_14",
      "ingredient_25"
    ],
    "ingredientCount": 4,
    "completionSeconds": 150,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 14,
    "recipeId": "food_014",
    "name": "ミートパスタ",
    "image": "food/14.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_27",
      "ingredient_08"
    ],
    "ingredientCount": 4,
    "completionSeconds": 160,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 15,
    "recipeId": "food_015",
    "name": "カレー",
    "image": "food/15.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_40",
      "ingredient_23",
      "ingredient_25",
      "ingredient_05",
      "ingredient_04"
    ],
    "ingredientCount": 5,
    "completionSeconds": 240,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 16,
    "recipeId": "food_016",
    "name": "オムライス",
    "image": "food/16.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_40",
      "ingredient_25",
      "ingredient_03",
      "ingredient_27"
    ],
    "ingredientCount": 4,
    "completionSeconds": 140,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 17,
    "recipeId": "food_017",
    "name": "オムレツ",
    "image": "food/17.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_24",
      "ingredient_39",
      "ingredient_01"
    ],
    "ingredientCount": 3,
    "completionSeconds": 60,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 18,
    "recipeId": "food_018",
    "name": "野菜炒め",
    "image": "food/18.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_26",
      "ingredient_05",
      "ingredient_17",
      "ingredient_20"
    ],
    "ingredientCount": 4,
    "completionSeconds": 120,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 19,
    "recipeId": "food_019",
    "name": "シチュー",
    "image": "food/19.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_25",
      "ingredient_04",
      "ingredient_05",
      "ingredient_03",
      "ingredient_24"
    ],
    "ingredientCount": 5,
    "completionSeconds": 260,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 20,
    "recipeId": "food_020",
    "name": "ポテトフライ",
    "image": "food/20.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_04",
      "ingredient_38"
    ],
    "ingredientCount": 2,
    "completionSeconds": 20,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 21,
    "recipeId": "food_021",
    "name": "肉まん",
    "image": "food/21.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_03",
      "ingredient_12"
    ],
    "ingredientCount": 4,
    "completionSeconds": 150,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 22,
    "recipeId": "food_022",
    "name": "粒あんまん",
    "image": "food/22.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_28",
      "ingredient_36"
    ],
    "ingredientCount": 3,
    "completionSeconds": 80,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 23,
    "recipeId": "food_023",
    "name": "こしあんまん",
    "image": "food/23.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_28",
      "ingredient_24"
    ],
    "ingredientCount": 3,
    "completionSeconds": 85,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 24,
    "recipeId": "food_024",
    "name": "ピザまん",
    "image": "food/24.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_39",
      "ingredient_27",
      "ingredient_25"
    ],
    "ingredientCount": 4,
    "completionSeconds": 130,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 25,
    "recipeId": "food_025",
    "name": "抹茶あんまん",
    "image": "food/25.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_28",
      "ingredient_11",
      "ingredient_36"
    ],
    "ingredientCount": 4,
    "completionSeconds": 150,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 26,
    "recipeId": "food_026",
    "name": "豚まん",
    "image": "food/26.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_26",
      "ingredient_12"
    ],
    "ingredientCount": 4,
    "completionSeconds": 160,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 27,
    "recipeId": "food_027",
    "name": "ゴマあんまん",
    "image": "food/27.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_32",
      "ingredient_28"
    ],
    "ingredientCount": 3,
    "completionSeconds": 90,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 28,
    "recipeId": "food_028",
    "name": "チョコまん",
    "image": "food/28.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_34",
      "ingredient_24"
    ],
    "ingredientCount": 3,
    "completionSeconds": 85,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 29,
    "recipeId": "food_029",
    "name": "カスタードまん",
    "image": "food/29.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_24",
      "ingredient_36"
    ],
    "ingredientCount": 3,
    "completionSeconds": 90,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 30,
    "recipeId": "food_030",
    "name": "角煮まん",
    "image": "food/30.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_03",
      "ingredient_12",
      "ingredient_36"
    ],
    "ingredientCount": 5,
    "completionSeconds": 240,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 31,
    "recipeId": "food_031",
    "name": "ピリ辛まん",
    "image": "food/31.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_30",
      "ingredient_26"
    ],
    "ingredientCount": 4,
    "completionSeconds": 155,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 32,
    "recipeId": "food_032",
    "name": "ハンバーグ",
    "image": "food/32.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_25",
      "ingredient_03",
      "ingredient_41",
      "ingredient_24"
    ],
    "ingredientCount": 4,
    "completionSeconds": 180,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 33,
    "recipeId": "food_033",
    "name": "チーズハンバーグ",
    "image": "food/33.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_25",
      "ingredient_03",
      "ingredient_41",
      "ingredient_24",
      "ingredient_39"
    ],
    "ingredientCount": 5,
    "completionSeconds": 250,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 34,
    "recipeId": "food_034",
    "name": "キノコハンバーグ",
    "image": "food/34.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_25",
      "ingredient_03",
      "ingredient_41",
      "ingredient_18",
      "ingredient_19"
    ],
    "ingredientCount": 5,
    "completionSeconds": 260,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 35,
    "recipeId": "food_035",
    "name": "アメリカンドッグ",
    "image": "food/35.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_27"
    ],
    "ingredientCount": 3,
    "completionSeconds": 80,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 36,
    "recipeId": "food_036",
    "name": "天津飯",
    "image": "food/36.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_40",
      "ingredient_09",
      "ingredient_06",
      "ingredient_13"
    ],
    "ingredientCount": 4,
    "completionSeconds": 150,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 37,
    "recipeId": "food_037",
    "name": "小籠包",
    "image": "food/37.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_06",
      "ingredient_12",
      "ingredient_13"
    ],
    "ingredientCount": 5,
    "completionSeconds": 240,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 38,
    "recipeId": "food_038",
    "name": "焼売",
    "image": "food/38.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_03",
      "ingredient_06"
    ],
    "ingredientCount": 4,
    "completionSeconds": 140,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 39,
    "recipeId": "food_039",
    "name": "餃子",
    "image": "food/39.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_26",
      "ingredient_08",
      "ingredient_13"
    ],
    "ingredientCount": 5,
    "completionSeconds": 230,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 40,
    "recipeId": "food_040",
    "name": "鮭のムニエル",
    "image": "food/40.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_15",
      "ingredient_04",
      "ingredient_03",
      "ingredient_33",
      "ingredient_38"
    ],
    "ingredientCount": 5,
    "completionSeconds": 270,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 41,
    "recipeId": "food_041",
    "name": "アスパラベーコンポテト",
    "image": "food/41.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_02",
      "ingredient_25",
      "ingredient_04",
      "ingredient_33"
    ],
    "ingredientCount": 4,
    "completionSeconds": 150,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 42,
    "recipeId": "food_042",
    "name": "チーズトマトサラダ",
    "image": "food/42.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_39",
      "ingredient_27",
      "ingredient_21"
    ],
    "ingredientCount": 3,
    "completionSeconds": 45,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 43,
    "recipeId": "food_043",
    "name": "焼きトマト",
    "image": "food/43.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_27",
      "ingredient_38",
      "ingredient_39"
    ],
    "ingredientCount": 3,
    "completionSeconds": 30,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 44,
    "recipeId": "food_044",
    "name": "リッチチーズの野菜サラダ",
    "image": "food/44.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_39",
      "ingredient_21",
      "ingredient_27",
      "ingredient_02",
      "ingredient_20"
    ],
    "ingredientCount": 5,
    "completionSeconds": 210,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 45,
    "recipeId": "food_045",
    "name": "トマトポテトスープ",
    "image": "food/45.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_27",
      "ingredient_04",
      "ingredient_07",
      "ingredient_24"
    ],
    "ingredientCount": 4,
    "completionSeconds": 130,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 46,
    "recipeId": "food_046",
    "name": "キノコ野菜炒め",
    "image": "food/46.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_18",
      "ingredient_19",
      "ingredient_31",
      "ingredient_01",
      "ingredient_07"
    ],
    "ingredientCount": 5,
    "completionSeconds": 220,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 47,
    "recipeId": "food_047",
    "name": "ハンバーガー",
    "image": "food/47.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_21",
      "ingredient_27",
      "ingredient_29"
    ],
    "ingredientCount": 5,
    "completionSeconds": 240,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 48,
    "recipeId": "food_048",
    "name": "エッグバーガー",
    "image": "food/48.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_21",
      "ingredient_03",
      "ingredient_29"
    ],
    "ingredientCount": 5,
    "completionSeconds": 240,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 49,
    "recipeId": "food_049",
    "name": "フィッシュバーガー",
    "image": "food/49.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_15",
      "ingredient_21",
      "ingredient_29",
      "ingredient_39"
    ],
    "ingredientCount": 5,
    "completionSeconds": 250,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 50,
    "recipeId": "food_050",
    "name": "チーズバーガー",
    "image": "food/50.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_39",
      "ingredient_21",
      "ingredient_27"
    ],
    "ingredientCount": 5,
    "completionSeconds": 250,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 51,
    "recipeId": "food_051",
    "name": "贅沢チーズバーガー",
    "image": "food/51.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_39",
      "ingredient_14",
      "ingredient_33"
    ],
    "ingredientCount": 5,
    "completionSeconds": 300,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 52,
    "recipeId": "food_052",
    "name": "キノコバーガー",
    "image": "food/52.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_18",
      "ingredient_19",
      "ingredient_39"
    ],
    "ingredientCount": 5,
    "completionSeconds": 270,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 53,
    "recipeId": "food_053",
    "name": "フライドポテト",
    "image": "food/53.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_04",
      "ingredient_38",
      "ingredient_29"
    ],
    "ingredientCount": 3,
    "completionSeconds": 25,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 54,
    "recipeId": "food_054",
    "name": "チキンナゲット",
    "image": "food/54.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_25",
      "ingredient_41",
      "ingredient_38"
    ],
    "ingredientCount": 3,
    "completionSeconds": 60,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 55,
    "recipeId": "food_055",
    "name": "フライドチキン",
    "image": "food/55.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_25",
      "ingredient_41",
      "ingredient_08",
      "ingredient_30"
    ],
    "ingredientCount": 4,
    "completionSeconds": 120,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 56,
    "recipeId": "food_056",
    "name": "ラーメン",
    "image": "food/56.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_25",
      "ingredient_09",
      "ingredient_08",
      "ingredient_31"
    ],
    "ingredientCount": 5,
    "completionSeconds": 300,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 57,
    "recipeId": "food_057",
    "name": "うどん",
    "image": "food/57.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_09",
      "ingredient_18",
      "ingredient_31"
    ],
    "ingredientCount": 4,
    "completionSeconds": 180,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 58,
    "recipeId": "food_058",
    "name": "マグロ寿司",
    "image": "food/58.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_40",
      "ingredient_15",
      "ingredient_13"
    ],
    "ingredientCount": 3,
    "completionSeconds": 70,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 59,
    "recipeId": "food_059",
    "name": "サーモン寿司",
    "image": "food/59.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_40",
      "ingredient_15",
      "ingredient_38"
    ],
    "ingredientCount": 3,
    "completionSeconds": 70,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 60,
    "recipeId": "food_060",
    "name": "ピーマン寿司",
    "image": "food/60.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_40",
      "ingredient_17",
      "ingredient_07"
    ],
    "ingredientCount": 3,
    "completionSeconds": 60,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 61,
    "recipeId": "food_061",
    "name": "アスパラベーコン寿司",
    "image": "food/61.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_40",
      "ingredient_02",
      "ingredient_25",
      "ingredient_29"
    ],
    "ingredientCount": 4,
    "completionSeconds": 120,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 62,
    "recipeId": "food_062",
    "name": "キノコトマト寿司",
    "image": "food/62.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_40",
      "ingredient_18",
      "ingredient_27",
      "ingredient_13"
    ],
    "ingredientCount": 4,
    "completionSeconds": 120,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 63,
    "recipeId": "food_063",
    "name": "ハンバーグ寿司",
    "image": "food/63.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_40",
      "ingredient_25",
      "ingredient_03",
      "ingredient_29"
    ],
    "ingredientCount": 4,
    "completionSeconds": 140,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 64,
    "recipeId": "food_064",
    "name": "サーモンオニオン寿司",
    "image": "food/64.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_40",
      "ingredient_15",
      "ingredient_03",
      "ingredient_29"
    ],
    "ingredientCount": 4,
    "completionSeconds": 130,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 65,
    "recipeId": "food_065",
    "name": "しいたけ寿司",
    "image": "food/65.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_40",
      "ingredient_18",
      "ingredient_13"
    ],
    "ingredientCount": 3,
    "completionSeconds": 70,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 66,
    "recipeId": "food_066",
    "name": "クリームコロッケ寿司",
    "image": "food/66.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_40",
      "ingredient_41",
      "ingredient_24",
      "ingredient_14",
      "ingredient_33"
    ],
    "ingredientCount": 5,
    "completionSeconds": 240,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 67,
    "recipeId": "food_067",
    "name": "チーズポテト寿司",
    "image": "food/67.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_40",
      "ingredient_39",
      "ingredient_04",
      "ingredient_29"
    ],
    "ingredientCount": 4,
    "completionSeconds": 130,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 68,
    "recipeId": "food_068",
    "name": "たい焼き",
    "image": "food/68.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_28",
      "ingredient_36"
    ],
    "ingredientCount": 3,
    "completionSeconds": 80,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 69,
    "recipeId": "food_069",
    "name": "抹茶たいやき",
    "image": "food/69.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_28",
      "ingredient_11",
      "ingredient_36"
    ],
    "ingredientCount": 4,
    "completionSeconds": 140,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 70,
    "recipeId": "food_070",
    "name": "ゴマたい焼き",
    "image": "food/70.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_28",
      "ingredient_32",
      "ingredient_36"
    ],
    "ingredientCount": 4,
    "completionSeconds": 140,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 71,
    "recipeId": "food_071",
    "name": "団子",
    "image": "food/71.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_40",
      "ingredient_36",
      "ingredient_28"
    ],
    "ingredientCount": 3,
    "completionSeconds": 60,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 72,
    "recipeId": "food_072",
    "name": "クッキー",
    "image": "food/72.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_33",
      "ingredient_36"
    ],
    "ingredientCount": 3,
    "completionSeconds": 30,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 73,
    "recipeId": "food_073",
    "name": "チョコクッキー",
    "image": "food/73.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_33",
      "ingredient_34"
    ],
    "ingredientCount": 3,
    "completionSeconds": 70,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 74,
    "recipeId": "food_074",
    "name": "プリン",
    "image": "food/74.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_24",
      "ingredient_36",
      "ingredient_14"
    ],
    "ingredientCount": 3,
    "completionSeconds": 90,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 75,
    "recipeId": "food_075",
    "name": "デンデンゼリー",
    "image": "food/75.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_16",
      "ingredient_37",
      "ingredient_36"
    ],
    "ingredientCount": 3,
    "completionSeconds": 25,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 76,
    "recipeId": "food_076",
    "name": "アイスクリーム",
    "image": "food/76.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_24",
      "ingredient_14",
      "ingredient_36"
    ],
    "ingredientCount": 3,
    "completionSeconds": 120,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 77,
    "recipeId": "food_077",
    "name": "アイスチョコボール",
    "image": "food/77.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_24",
      "ingredient_14",
      "ingredient_34",
      "ingredient_36"
    ],
    "ingredientCount": 4,
    "completionSeconds": 150,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 78,
    "recipeId": "food_078",
    "name": "アイスキャンディ",
    "image": "food/78.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_10",
      "ingredient_35",
      "ingredient_36"
    ],
    "ingredientCount": 3,
    "completionSeconds": 30,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 79,
    "recipeId": "food_079",
    "name": "ショートケーキ",
    "image": "food/79.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_14",
      "ingredient_16",
      "ingredient_36",
      "ingredient_24"
    ],
    "ingredientCount": 5,
    "completionSeconds": 300,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 80,
    "recipeId": "food_080",
    "name": "チーズケーキ",
    "image": "food/80.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_39",
      "ingredient_41",
      "ingredient_36",
      "ingredient_14"
    ],
    "ingredientCount": 4,
    "completionSeconds": 180,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 81,
    "recipeId": "food_081",
    "name": "なめらかチーズケーキ",
    "image": "food/81.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_39",
      "ingredient_41",
      "ingredient_36",
      "ingredient_14",
      "ingredient_24"
    ],
    "ingredientCount": 5,
    "completionSeconds": 240,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 82,
    "recipeId": "food_082",
    "name": "モンブラン",
    "image": "food/82.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_14",
      "ingredient_36",
      "ingredient_33"
    ],
    "ingredientCount": 4,
    "completionSeconds": 180,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 83,
    "recipeId": "food_083",
    "name": "デンデンモンブラン",
    "image": "food/83.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_14",
      "ingredient_36",
      "ingredient_33",
      "ingredient_34"
    ],
    "ingredientCount": 5,
    "completionSeconds": 260,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 84,
    "recipeId": "food_084",
    "name": "抹茶ケーキ",
    "image": "food/84.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_11",
      "ingredient_14",
      "ingredient_36",
      "ingredient_24"
    ],
    "ingredientCount": 5,
    "completionSeconds": 270,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 85,
    "recipeId": "food_085",
    "name": "チョコレートケーキ",
    "image": "food/85.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_34",
      "ingredient_14",
      "ingredient_36",
      "ingredient_24"
    ],
    "ingredientCount": 5,
    "completionSeconds": 280,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 86,
    "recipeId": "food_086",
    "name": "コーヒー",
    "image": "food/86.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_22",
      "ingredient_36"
    ],
    "ingredientCount": 2,
    "completionSeconds": 10,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 87,
    "recipeId": "food_087",
    "name": "ココア",
    "image": "food/87.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_34",
      "ingredient_24",
      "ingredient_36"
    ],
    "ingredientCount": 3,
    "completionSeconds": 40,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 88,
    "recipeId": "food_088",
    "name": "濃いココア",
    "image": "food/88.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_34",
      "ingredient_24",
      "ingredient_14",
      "ingredient_36"
    ],
    "ingredientCount": 4,
    "completionSeconds": 75,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 89,
    "recipeId": "food_089",
    "name": "カフェオレ",
    "image": "food/89.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_22",
      "ingredient_24",
      "ingredient_36"
    ],
    "ingredientCount": 3,
    "completionSeconds": 35,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 90,
    "recipeId": "food_090",
    "name": "コーラ",
    "image": "food/90.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_36",
      "ingredient_12"
    ],
    "ingredientCount": 2,
    "completionSeconds": 20,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 91,
    "recipeId": "food_091",
    "name": "オレンジジュース",
    "image": "food/91.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_35",
      "ingredient_36"
    ],
    "ingredientCount": 2,
    "completionSeconds": 15,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 92,
    "recipeId": "food_092",
    "name": "サイダー",
    "image": "food/92.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_36",
      "ingredient_13"
    ],
    "ingredientCount": 2,
    "completionSeconds": 15,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 93,
    "recipeId": "food_093",
    "name": "ぶどうジュース",
    "image": "food/93.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_37",
      "ingredient_36"
    ],
    "ingredientCount": 2,
    "completionSeconds": 15,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 94,
    "recipeId": "food_094",
    "name": "樽コーラ",
    "image": "food/94.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_36",
      "ingredient_12",
      "ingredient_22"
    ],
    "ingredientCount": 3,
    "completionSeconds": 90,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 95,
    "recipeId": "food_095",
    "name": "いちごオレ",
    "image": "food/95.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_16",
      "ingredient_24",
      "ingredient_36"
    ],
    "ingredientCount": 3,
    "completionSeconds": 40,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 96,
    "recipeId": "food_096",
    "name": "ジンジャーエール",
    "image": "food/96.png",
    "baseRank": "C",
    "unlockCompanyRank": "F3",
    "ingredientIds": [
      "ingredient_12",
      "ingredient_36",
      "ingredient_13"
    ],
    "ingredientCount": 3,
    "completionSeconds": 35,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 97,
    "recipeId": "food_097",
    "name": "コーラフロート",
    "image": "food/97.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_36",
      "ingredient_12",
      "ingredient_24",
      "ingredient_14"
    ],
    "ingredientCount": 4,
    "completionSeconds": 100,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 98,
    "recipeId": "food_098",
    "name": "チョコバナナシェイク",
    "image": "food/98.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_34",
      "ingredient_10",
      "ingredient_24",
      "ingredient_14"
    ],
    "ingredientCount": 4,
    "completionSeconds": 90,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 99,
    "recipeId": "food_099",
    "name": "デンデンドリンク",
    "image": "food/99.png",
    "baseRank": "B",
    "unlockCompanyRank": "F5",
    "ingredientIds": [
      "ingredient_37",
      "ingredient_35",
      "ingredient_12",
      "ingredient_30"
    ],
    "ingredientCount": 4,
    "completionSeconds": 90,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 100,
    "recipeId": "food_100",
    "name": "デンデンエナジーフロート",
    "image": "food/100.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_37",
      "ingredient_35",
      "ingredient_12",
      "ingredient_14",
      "ingredient_36"
    ],
    "ingredientCount": 5,
    "completionSeconds": 240,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 101,
    "recipeId": "food_101",
    "name": "なめらかミルク",
    "image": "food/101.png",
    "baseRank": "D",
    "unlockCompanyRank": "F1",
    "ingredientIds": [
      "ingredient_24",
      "ingredient_36"
    ],
    "ingredientCount": 2,
    "completionSeconds": 20,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 102,
    "recipeId": "food_102",
    "name": "金粉アイスクリーム",
    "image": "food/102.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_24",
      "ingredient_14",
      "ingredient_36",
      "ingredient_39",
      "ingredient_33"
    ],
    "ingredientCount": 5,
    "completionSeconds": 300,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 103,
    "recipeId": "food_103",
    "name": "ブランドたい焼き",
    "image": "food/103.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_41",
      "ingredient_28",
      "ingredient_11",
      "ingredient_32",
      "ingredient_33"
    ],
    "ingredientCount": 5,
    "completionSeconds": 300,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 104,
    "recipeId": "food_104",
    "name": "ブランドチョコレート",
    "image": "food/104.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_34",
      "ingredient_14",
      "ingredient_33",
      "ingredient_22",
      "ingredient_36"
    ],
    "ingredientCount": 5,
    "completionSeconds": 300,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  },
  {
    "number": 105,
    "recipeId": "food_105",
    "name": "ブランド小豆アイス",
    "image": "food/105.png",
    "baseRank": "A",
    "unlockCompanyRank": "E1",
    "ingredientIds": [
      "ingredient_28",
      "ingredient_24",
      "ingredient_14",
      "ingredient_36",
      "ingredient_11"
    ],
    "ingredientCount": 5,
    "completionSeconds": 300,
    "compatibleUtensilIds": null,
    "utensilCompatibilityStatus": "not_specified_in_source"
  }
]);

export const COOKING_MASTER_NOTES =
  deepFreeze({
    sourceIngredientCount: 41,
    sourceRecipeCount: 105,
    sourceRecipeRankCounts: {
      D: 17,
      C: 28,
      B: 32,
      A: 28,
    },
    utensilImages:
      "調理器具の画像パスは情報源に記載されていないためnull。",
    utensilRecipeCompatibility:
      "各料理と調理器具の対応表は情報源に記載されていないため未設定。",
    cRankTimeGuidelineException:
      "Cランク基準は最大1分30秒だが、アイスクリームは指定値2分を保持。",
    exactIngredientMatching:
      "必要食材は記載された食材を各1個消費し、共通材料は消費しない。",
    duplicateIngredientCombinations:
      "同じ食材構成で複数料理が存在するため、候補は1件に決めず一覧で返す。",
  });

const ingredientById =
  new Map(
    INGREDIENT_MASTER.map(
      (ingredient) => [
        ingredient.ingredientId,
        ingredient,
      ],
    ),
  );

const utensilById =
  new Map(
    COOKING_UTENSIL_MASTER.map(
      (utensil) => [
        utensil.utensilId,
        utensil,
      ],
    ),
  );

const recipeById =
  new Map(
    RECIPE_MASTER.map(
      (recipe) => [
        recipe.recipeId,
        recipe,
      ],
    ),
  );

const qualityById =
  new Map(
    FOOD_QUALITY_MASTER.map(
      (quality) => [
        quality.qualityId,
        quality,
      ],
    ),
  );

const premiumRankMap =
  Object.freeze({
    D: "C",
    C: "B",
    B: "A",
    A: "S",
  });

function normalizeIngredientIds(
  ingredientIds,
  {
    allowEmpty = false,
  } = {},
) {
  if (!Array.isArray(ingredientIds)) {
    throw new TypeError(
      "Ingredient IDs must be an array.",
    );
  }
  if (
    (!allowEmpty &&
      ingredientIds.length < 1) ||
    ingredientIds.length >
      COOKING_RULES.maximumIngredientSlots
  ) {
    throw new RangeError(
      `Ingredient count must be from ${allowEmpty ? 0 : 1} to ${COOKING_RULES.maximumIngredientSlots}.`,
    );
  }
  return ingredientIds.map(
    (ingredientId) => {
      getIngredient(ingredientId);
      return ingredientId;
    },
  );
}

function ingredientSignature(
  ingredientIds,
) {
  return normalizeIngredientIds(
    ingredientIds,
  )
    .slice()
    .sort()
    .join("|");
}

function createHash(text) {
  let hash = 2166136261;
  for (
    let index = 0;
    index < text.length;
    index += 1
  ) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(
      hash,
      16777619,
    );
  }
  return hash >>> 0;
}

function createSeededRandom(seed) {
  let value =
    createHash(String(seed));
  return () => {
    value += 0x6d2b79f5;
    let current = value;
    current = Math.imul(
      current ^ (current >>> 15),
      current | 1,
    );
    current ^=
      current +
      Math.imul(
        current ^ (current >>> 7),
        current | 61,
      );
    return (
      (
        current ^
        (current >>> 14)
      ) >>>
      0
    ) /
    4294967296;
  };
}

function normalizeIsoTimestamp(
  value,
  fallback,
) {
  const date =
    new Date(value ?? fallback);
  if (
    Number.isNaN(date.getTime())
  ) {
    throw new RangeError(
      "Timestamp must be a valid date value.",
    );
  }
  return date.toISOString();
}

export function getIngredient(
  ingredientId,
) {
  const ingredient =
    ingredientById.get(
      ingredientId,
    );
  if (!ingredient) {
    throw new RangeError(
      `Unknown ingredient: ${ingredientId}`,
    );
  }
  return ingredient;
}

export function getCookingUtensil(
  utensilId,
) {
  const utensil =
    utensilById.get(
      utensilId,
    );
  if (!utensil) {
    throw new RangeError(
      `Unknown cooking utensil: ${utensilId}`,
    );
  }
  return utensil;
}

export function getRecipe(
  recipeId,
) {
  const recipe =
    recipeById.get(
      recipeId,
    );
  if (!recipe) {
    throw new RangeError(
      `Unknown recipe: ${recipeId}`,
    );
  }
  return recipe;
}

export function getFoodQuality(
  qualityId,
) {
  const quality =
    qualityById.get(
      qualityId,
    );
  if (!quality) {
    throw new RangeError(
      `Unknown food quality: ${qualityId}`,
    );
  }
  return quality;
}

export function getFoodRankData(
  rank,
) {
  const data =
    FOOD_RANK_MASTER[
      String(rank ?? "")
        .trim()
        .toUpperCase()
    ];
  if (!data) {
    throw new RangeError(
      `Unknown food rank: ${rank}`,
    );
  }
  return data;
}

export function isRecipeUnlockedAtCompanyRank(
  recipeOrId,
  companyRank,
) {
  const recipe =
    typeof recipeOrId === "string"
      ? getRecipe(recipeOrId)
      : recipeOrId;
  const current =
    getCompanyRankData(
      companyRank,
    );
  const required =
    getCompanyRankData(
      recipe.unlockCompanyRank,
    );
  return current.index >=
    required.index;
}

export function getRecipeUnlockState(
  recipeOrId,
  companyRank,
) {
  const recipe =
    typeof recipeOrId === "string"
      ? getRecipe(recipeOrId)
      : recipeOrId;
  const required =
    getCompanyRankData(
      recipe.unlockCompanyRank,
    );
  const current =
    getCompanyRankData(
      companyRank,
    );
  return deepFreeze({
    recipeId:
      recipe.recipeId,
    unlocked:
      current.index >=
      required.index,
    requiredCompanyRank:
      required.rank,
    currentCompanyRank:
      current.rank,
  });
}

export function getRecipeCandidates(
  ingredientIds,
  {
    companyRank = "F1",
    includeLocked = true,
    utensilId = null,
  } = {},
) {
  const signature =
    ingredientSignature(
      ingredientIds,
    );
  if (utensilId !== null) {
    getCookingUtensil(
      utensilId,
    );
  }

  return deepFreeze(
    RECIPE_MASTER
      .filter(
        (recipe) =>
          ingredientSignature(
            recipe.ingredientIds,
          ) ===
          signature,
      )
      .map(
        (recipe) => {
          const unlock =
            getRecipeUnlockState(
              recipe,
              companyRank,
            );
          return {
            ...deepClone(recipe),
            unlocked:
              unlock.unlocked,
            requiredCompanyRank:
              unlock.requiredCompanyRank,
            utensilCompatible:
              null,
            utensilCompatibilityStatus:
              recipe.utensilCompatibilityStatus,
          };
        },
      )
      .filter(
        (recipe) =>
          includeLocked ||
          recipe.unlocked,
      ),
  );
}

export function resolveFoodRank(
  baseRank,
  qualityId,
) {
  const normalizedBaseRank =
    String(baseRank ?? "")
      .trim()
      .toUpperCase();
  if (
    !["D", "C", "B", "A"].includes(
      normalizedBaseRank,
    )
  ) {
    throw new RangeError(
      `Base food rank must be D, C, B or A: ${baseRank}`,
    );
  }
  const quality =
    getFoodQuality(
      qualityId,
    );
  if (
    quality.rankMode === "base"
  ) {
    return normalizedBaseRank;
  }
  if (
    quality.rankMode ===
    "one_rank_up"
  ) {
    return premiumRankMap[
      normalizedBaseRank
    ];
  }
  return "SS";
}

export function createFoodVariant(
  recipeOrId,
  qualityId,
) {
  const recipe =
    typeof recipeOrId === "string"
      ? getRecipe(recipeOrId)
      : recipeOrId;
  const quality =
    getFoodQuality(
      qualityId,
    );
  const rank =
    resolveFoodRank(
      recipe.baseRank,
      quality.qualityId,
    );
  return deepFreeze({
    variantKey:
      `${recipe.recipeId}:${quality.qualityId}`,
    recipeId:
      recipe.recipeId,
    qualityId:
      quality.qualityId,
    qualityLabel:
      quality.japaneseLabel,
    name:
      `${quality.namePrefix}${recipe.name}`,
    image:
      recipe.image,
    rank,
    baseRank:
      recipe.baseRank,
  });
}

export function rollCookingQuality(
  random = Math.random,
) {
  if (
    typeof random !== "function"
  ) {
    throw new TypeError(
      "Cooking quality random source must be a function.",
    );
  }
  const value =
    Math.min(
      0.999999999999,
      Math.max(
        0,
        Number(random()) || 0,
      ),
    );
  if (
    value <
    COOKING_RULES
      .normalQualityRate
  ) {
    return getFoodQuality(
      "normal",
    );
  }
  if (
    value <
    1 -
      COOKING_RULES
        .legendaryQualityRate
  ) {
    return getFoodQuality(
      "premium",
    );
  }
  return getFoodQuality(
    "legendary",
  );
}

export function createCompletedFoodRecord(
  recipeId,
  {
    qualityId = null,
    random = Math.random,
    completedAt =
      new Date().toISOString(),
    sequence = 1,
  } = {},
) {
  const recipe =
    getRecipe(recipeId);
  const quality =
    qualityId === null
      ? rollCookingQuality(random)
      : getFoodQuality(qualityId);
  assertNonNegativeInteger(
    sequence,
    "Cooking sequence",
  );
  if (sequence < 1) {
    throw new RangeError(
      "Cooking sequence must be at least 1.",
    );
  }
  const variant =
    createFoodVariant(
      recipe,
      quality.qualityId,
    );
  return deepFreeze({
    ...deepClone(variant),
    completedAt:
      normalizeIsoTimestamp(
        completedAt,
        completedAt,
      ),
    sequence,
  });
}

export function createWeeklyIngredientStock(
  gameDate,
  {
    seed = "mob-br-cooking",
    generatedAt =
      new Date().toISOString(),
  } = {},
) {
  const key =
    dateKey(gameDate);
  const random =
    createSeededRandom(
      `${seed}:${key}`,
    );
  const pool =
    INGREDIENT_MASTER
      .map(
        (ingredient) =>
          ingredient.ingredientId,
      );

  for (
    let index =
      pool.length - 1;
    index > 0;
    index -= 1
  ) {
    const swapIndex =
      Math.floor(
        random() *
        (index + 1),
      );
    [
      pool[index],
      pool[swapIndex],
    ] = [
      pool[swapIndex],
      pool[index],
    ];
  }

  return deepFreeze({
    stockId:
      `ingredient-stock:${key}`,
    dateKey:
      key,
    ingredientIds:
      pool.slice(
        0,
        COOKING_RULES
          .weeklyIngredientStockCount,
      ),
    generatedAt:
      normalizeIsoTimestamp(
        generatedAt,
        generatedAt,
      ),
    message:
      "今回仕入れた食材はこちらです！",
  });
}

export function createInitialCookingState(
  gameDate,
  {
    seed = "mob-br-cooking",
    createdAt =
      new Date().toISOString(),
  } = {},
) {
  const timestamp =
    normalizeIsoTimestamp(
      createdAt,
      createdAt,
    );
  return {
    schemaVersion:
      COOKING_STATE_SCHEMA_VERSION,
    ingredientInventory:
      {},
    utensilInventory:
      Object.fromEntries(
        COOKING_UTENSIL_MASTER
          .filter(
            (utensil) =>
              utensil.initialOwned > 0,
          )
          .map(
            (utensil) => [
              utensil.utensilId,
              utensil.initialOwned,
            ],
          ),
      ),
    utensilSlots:
      Array.from(
        {
          length:
            COOKING_RULES
              .utensilSlotCount,
        },
        () => null,
      ),
    activeJobs:
      Array.from(
        {
          length:
            COOKING_RULES
              .utensilSlotCount,
        },
        () => null,
      ),
    foodInventory:
      {},
    recipeDiscovery:
      {},
    cookHistory:
      [],
    weeklyIngredientStock:
      createWeeklyIngredientStock(
        gameDate,
        {
          seed,
          generatedAt:
            timestamp,
        },
      ),
    storageBox: {
      sortMode:
        "cookedAt",
      sortDirection:
        "desc",
      page:
        1,
      pageSize:
        COOKING_RULES
          .storageBoxPageSize,
    },
    nextCookingSequence:
      1,
    createdAt:
      timestamp,
    updatedAt:
      timestamp,
  };
}

export function normalizeCookingState(
  value,
  {
    gameDate,
    seed =
      "mob-br-cooking",
    timestamp =
      new Date().toISOString(),
  } = {},
) {
  const base =
    createInitialCookingState(
      gameDate,
      {
        seed,
        createdAt:
          timestamp,
      },
    );
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return base;
  }

  const normalized =
    deepClone(base);
  normalized.ingredientInventory =
    value.ingredientInventory &&
    typeof value.ingredientInventory ===
      "object" &&
    !Array.isArray(
      value.ingredientInventory,
    )
      ? deepClone(
          value.ingredientInventory,
        )
      : {};
  normalized.utensilInventory =
    value.utensilInventory &&
    typeof value.utensilInventory ===
      "object" &&
    !Array.isArray(
      value.utensilInventory,
    )
      ? deepClone(
          value.utensilInventory,
        )
      : deepClone(
          base.utensilInventory,
        );
  normalized.utensilSlots =
    Array.isArray(
      value.utensilSlots,
    )
      ? value.utensilSlots
          .slice(
            0,
            COOKING_RULES
              .utensilSlotCount,
          )
      : deepClone(
          base.utensilSlots,
        );
  while (
    normalized.utensilSlots.length <
    COOKING_RULES.utensilSlotCount
  ) {
    normalized.utensilSlots.push(
      null,
    );
  }
  normalized.activeJobs =
    Array.isArray(
      value.activeJobs,
    )
      ? value.activeJobs
          .slice(
            0,
            COOKING_RULES
              .utensilSlotCount,
          )
      : deepClone(
          base.activeJobs,
        );
  while (
    normalized.activeJobs.length <
    COOKING_RULES.utensilSlotCount
  ) {
    normalized.activeJobs.push(
      null,
    );
  }
  normalized.foodInventory =
    value.foodInventory &&
    typeof value.foodInventory ===
      "object" &&
    !Array.isArray(
      value.foodInventory,
    )
      ? deepClone(
          value.foodInventory,
        )
      : {};
  normalized.recipeDiscovery =
    value.recipeDiscovery &&
    typeof value.recipeDiscovery ===
      "object" &&
    !Array.isArray(
      value.recipeDiscovery,
    )
      ? deepClone(
          value.recipeDiscovery,
        )
      : {};
  normalized.cookHistory =
    Array.isArray(
      value.cookHistory,
    )
      ? deepClone(
          value.cookHistory,
        )
      : [];
  normalized.weeklyIngredientStock =
    value.weeklyIngredientStock &&
    value.weeklyIngredientStock.dateKey ===
      dateKey(gameDate)
      ? deepClone(
          value.weeklyIngredientStock,
        )
      : deepClone(
          base.weeklyIngredientStock,
        );
  normalized.storageBox = {
    ...base.storageBox,
    ...(
      value.storageBox &&
      typeof value.storageBox ===
        "object" &&
      !Array.isArray(
        value.storageBox,
      )
        ? deepClone(
            value.storageBox,
          )
        : {}
    ),
  };
  normalized.nextCookingSequence =
    Number.isInteger(
      value.nextCookingSequence,
    ) &&
    value.nextCookingSequence > 0
      ? value.nextCookingSequence
      : 1;
  normalized.createdAt =
    typeof value.createdAt ===
      "string"
      ? value.createdAt
      : base.createdAt;
  normalized.updatedAt =
    typeof value.updatedAt ===
      "string"
      ? value.updatedAt
      : timestamp;
  normalized.schemaVersion =
    COOKING_STATE_SCHEMA_VERSION;

  return normalized;
}

export function refreshWeeklyIngredientStockToDraft(
  cookingState,
  gameDate,
  {
    seed = "mob-br-cooking",
    generatedAt =
      new Date().toISOString(),
  } = {},
) {
  assertPlainObject(
    cookingState,
    "Cooking state",
  );
  cookingState.weeklyIngredientStock =
    deepClone(
      createWeeklyIngredientStock(
        gameDate,
        {
          seed,
          generatedAt,
        },
      ),
    );
  cookingState.updatedAt =
    normalizeIsoTimestamp(
      generatedAt,
      generatedAt,
    );
  return deepFreeze(
    deepClone(
      cookingState
        .weeklyIngredientStock,
    ),
  );
}

export function addIngredientToCookingStateToDraft(
  cookingState,
  ingredientId,
  quantity = 1,
) {
  assertPlainObject(
    cookingState,
    "Cooking state",
  );
  getIngredient(
    ingredientId,
  );
  if (
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    throw new RangeError(
      "Ingredient quantity must be a positive integer.",
    );
  }
  cookingState.ingredientInventory ??=
    {};
  cookingState.ingredientInventory[
    ingredientId
  ] =
    (
      cookingState
        .ingredientInventory[
          ingredientId
        ] ??
      0
    ) +
    quantity;
  return cookingState
    .ingredientInventory[
      ingredientId
    ];
}

export function addCookingUtensilToStateToDraft(
  cookingState,
  utensilId,
  quantity = 1,
) {
  assertPlainObject(
    cookingState,
    "Cooking state",
  );
  getCookingUtensil(
    utensilId,
  );
  if (
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    throw new RangeError(
      "Utensil quantity must be a positive integer.",
    );
  }
  cookingState.utensilInventory ??=
    {};
  cookingState.utensilInventory[
    utensilId
  ] =
    (
      cookingState
        .utensilInventory[
          utensilId
        ] ??
      0
    ) +
    quantity;
  return cookingState
    .utensilInventory[
      utensilId
    ];
}

export function placeCookingUtensilToDraft(
  cookingState,
  slotIndex,
  utensilId,
) {
  assertPlainObject(
    cookingState,
    "Cooking state",
  );
  getCookingUtensil(
    utensilId,
  );
  if (
    !Number.isInteger(slotIndex) ||
    slotIndex < 0 ||
    slotIndex >=
      COOKING_RULES.utensilSlotCount
  ) {
    throw new RangeError(
      "Cooking utensil slot index is invalid.",
    );
  }
  const placedCount =
    cookingState.utensilSlots
      .filter(
        (entry) =>
          entry === utensilId,
      )
      .length;
  const alreadyInTarget =
    cookingState.utensilSlots[
      slotIndex
    ] === utensilId;
  const owned =
    cookingState.utensilInventory[
      utensilId
    ] ??
    0;
  if (
    !alreadyInTarget &&
    placedCount >= owned
  ) {
    throw new RangeError(
      `Not enough owned utensils: ${utensilId}`,
    );
  }
  if (
    cookingState.activeJobs[
      slotIndex
    ] !== null
  ) {
    throw new RangeError(
      "A cooking job is active in this slot.",
    );
  }
  cookingState.utensilSlots[
    slotIndex
  ] =
    utensilId;
  return utensilId;
}

export function removeCookingUtensilFromSlotToDraft(
  cookingState,
  slotIndex,
) {
  assertPlainObject(
    cookingState,
    "Cooking state",
  );
  if (
    !Number.isInteger(slotIndex) ||
    slotIndex < 0 ||
    slotIndex >=
      COOKING_RULES.utensilSlotCount
  ) {
    throw new RangeError(
      "Cooking utensil slot index is invalid.",
    );
  }
  if (
    cookingState.activeJobs[
      slotIndex
    ] !== null
  ) {
    throw new RangeError(
      "A cooking job is active in this slot.",
    );
  }
  const removed =
    cookingState.utensilSlots[
      slotIndex
    ];
  cookingState.utensilSlots[
    slotIndex
  ] =
    null;
  return removed;
}

function ingredientCountMap(
  ingredientIds,
) {
  return ingredientIds.reduce(
    (counts, ingredientId) => {
      getIngredient(
        ingredientId,
      );
      counts[ingredientId] =
        (
          counts[ingredientId] ??
          0
        ) +
        1;
      return counts;
    },
    {},
  );
}

export function getCookingJobRemainingSeconds(
  job,
  now = new Date(),
) {
  assertPlainObject(
    job,
    "Cooking job",
  );
  const readyAt =
    new Date(
      job.readyAt,
    ).getTime();
  const nowTime =
    new Date(now).getTime();
  if (
    !Number.isFinite(readyAt) ||
    !Number.isFinite(nowTime)
  ) {
    throw new RangeError(
      "Cooking job timestamps are invalid.",
    );
  }
  return Math.max(
    0,
    Math.ceil(
      (
        readyAt -
        nowTime
      ) /
      1000,
    ),
  );
}

export function isCookingJobReady(
  job,
  now = new Date(),
) {
  return (
    getCookingJobRemainingSeconds(
      job,
      now,
    ) === 0
  );
}

export function startCookingJobToDraft(
  cookingState,
  slotIndex,
  recipeId,
  ingredientIds,
  {
    companyRank = "F1",
    startedAt =
      new Date().toISOString(),
    random = Math.random,
    qualityId = null,
    jobId = null,
  } = {},
) {
  assertPlainObject(
    cookingState,
    "Cooking state",
  );
  if (
    !Number.isInteger(slotIndex) ||
    slotIndex < 0 ||
    slotIndex >=
      COOKING_RULES.utensilSlotCount
  ) {
    throw new RangeError(
      "Cooking slot index is invalid.",
    );
  }
  const utensilId =
    cookingState.utensilSlots?.[
      slotIndex
    ];
  if (!utensilId) {
    throw new RangeError(
      "調理器具が配置されていません。",
    );
  }
  getCookingUtensil(
    utensilId,
  );
  if (
    cookingState.activeJobs?.[
      slotIndex
    ]
  ) {
    throw new RangeError(
      "この調理器具は使用中です。",
    );
  }

  const recipe =
    getRecipe(recipeId);
  if (
    !isRecipeUnlockedAtCompanyRank(
      recipe,
      companyRank,
    )
  ) {
    throw new RangeError(
      `${recipe.name}は企業ランク${recipe.unlockCompanyRank}で解放されます。`,
    );
  }

  const normalizedIngredients =
    normalizeIngredientIds(
      ingredientIds,
    );
  if (
    ingredientSignature(
      normalizedIngredients,
    ) !==
    ingredientSignature(
      recipe.ingredientIds,
    )
  ) {
    throw new RangeError(
      "選択した食材とレシピが一致しません。",
    );
  }

  const requiredCounts =
    ingredientCountMap(
      recipe.ingredientIds,
    );
  for (
    const [
      ingredientId,
      required,
    ] of Object.entries(
      requiredCounts,
    )
  ) {
    const owned =
      cookingState
        .ingredientInventory?.[
          ingredientId
        ] ??
      0;
    if (owned < required) {
      throw new RangeError(
        `${getIngredient(ingredientId).name}が不足しています。`,
      );
    }
  }

  const quality =
    qualityId === null
      ? rollCookingQuality(
          random,
        )
      : getFoodQuality(
          qualityId,
        );
  const startIso =
    normalizeIsoTimestamp(
      startedAt,
      startedAt,
    );
  const startTime =
    new Date(
      startIso,
    ).getTime();
  const readyIso =
    new Date(
      startTime +
      recipe.completionSeconds *
        1000,
    ).toISOString();

  for (
    const [
      ingredientId,
      required,
    ] of Object.entries(
      requiredCounts,
    )
  ) {
    cookingState.ingredientInventory[
      ingredientId
    ] -= required;
  }

  const resolvedJobId =
    jobId ??
    `cook:${slotIndex}:${startTime}:${recipe.recipeId}`;
  const job = {
    jobId:
      resolvedJobId,
    slotIndex,
    utensilId,
    recipeId:
      recipe.recipeId,
    ingredientIds:
      deepClone(
        recipe.ingredientIds,
      ),
    qualityId:
      quality.qualityId,
    startedAt:
      startIso,
    readyAt:
      readyIso,
    completionSeconds:
      recipe.completionSeconds,
    status:
      "cooking",
  };
  cookingState.activeJobs[
    slotIndex
  ] = job;
  cookingState.updatedAt =
    startIso;

  return deepFreeze({
    ...deepClone(job),
    recipe:
      deepClone(recipe),
    qualityHidden:
      true,
  });
}

export function collectCookingJobToDraft(
  cookingState,
  slotIndex,
  {
    collectedAt =
      new Date().toISOString(),
  } = {},
) {
  assertPlainObject(
    cookingState,
    "Cooking state",
  );
  if (
    !Number.isInteger(slotIndex) ||
    slotIndex < 0 ||
    slotIndex >=
      COOKING_RULES.utensilSlotCount
  ) {
    throw new RangeError(
      "Cooking slot index is invalid.",
    );
  }
  const job =
    cookingState.activeJobs?.[
      slotIndex
    ];
  if (!job) {
    throw new RangeError(
      "回収できる料理がありません。",
    );
  }
  const collectIso =
    normalizeIsoTimestamp(
      collectedAt,
      collectedAt,
    );
  if (
    !isCookingJobReady(
      job,
      collectIso,
    )
  ) {
    throw new RangeError(
      "料理はまだ完成していません。",
    );
  }

  const sequence =
    cookingState.nextCookingSequence;
  const completed =
    createCompletedFoodRecord(
      job.recipeId,
      {
        qualityId:
          job.qualityId,
        completedAt:
          collectIso,
        sequence,
      },
    );
  const previous =
    cookingState.foodInventory[
      completed.variantKey
    ];
  cookingState.foodInventory[
    completed.variantKey
  ] = {
    variantKey:
      completed.variantKey,
    recipeId:
      completed.recipeId,
    qualityId:
      completed.qualityId,
    quantity:
      (
        previous?.quantity ??
        0
      ) +
      1,
    firstCookedAt:
      previous?.firstCookedAt ??
      collectIso,
    lastCookedAt:
      collectIso,
    firstSequence:
      previous?.firstSequence ??
      sequence,
    lastSequence:
      sequence,
  };
  cookingState.recipeDiscovery[
    completed.recipeId
  ] = {
    recipeId:
      completed.recipeId,
    discoveredAt:
      cookingState
        .recipeDiscovery[
          completed.recipeId
        ]?.discoveredAt ??
      collectIso,
    cookCount:
      (
        cookingState
          .recipeDiscovery[
            completed.recipeId
          ]?.cookCount ??
        0
      ) +
      1,
    qualityIds: [
      ...new Set([
        ...(
          cookingState
            .recipeDiscovery[
              completed.recipeId
            ]?.qualityIds ??
          []
        ),
        completed.qualityId,
      ]),
    ],
  };
  cookingState.cookHistory.push({
    ...deepClone(completed),
    jobId:
      job.jobId,
    utensilId:
      job.utensilId,
    slotIndex,
    startedAt:
      job.startedAt,
    readyAt:
      job.readyAt,
    collectedAt:
      collectIso,
  });
  if (
    cookingState.cookHistory.length >
    500
  ) {
    cookingState.cookHistory =
      cookingState.cookHistory.slice(
        -500,
      );
  }
  cookingState.nextCookingSequence +=
    1;
  cookingState.activeJobs[
    slotIndex
  ] = null;
  cookingState.updatedAt =
    collectIso;

  return deepFreeze({
    ...deepClone(completed),
    quantity:
      cookingState
        .foodInventory[
          completed.variantKey
        ].quantity,
    recipe:
      deepClone(
        getRecipe(
          completed.recipeId,
        ),
      ),
  });
}

export function validateCookingState(
  cookingState,
  {
    gameDate = null,
  } = {},
) {
  assertPlainObject(
    cookingState,
    "Cooking state",
  );
  if (
    cookingState.schemaVersion !==
    COOKING_STATE_SCHEMA_VERSION
  ) {
    throw new RangeError(
      `Unsupported cooking state schema: ${cookingState.schemaVersion}`,
    );
  }

  for (
    const [
      ingredientId,
      quantity,
    ]
    of Object.entries(
      cookingState
        .ingredientInventory,
    )
  ) {
    getIngredient(
      ingredientId,
    );
    assertNonNegativeInteger(
      quantity,
      `Ingredient inventory ${ingredientId}`,
    );
  }

  for (
    const [
      utensilId,
      quantity,
    ]
    of Object.entries(
      cookingState
        .utensilInventory,
    )
  ) {
    getCookingUtensil(
      utensilId,
    );
    assertNonNegativeInteger(
      quantity,
      `Utensil inventory ${utensilId}`,
    );
  }

  if (
    !Array.isArray(
      cookingState.utensilSlots,
    ) ||
    cookingState.utensilSlots.length !==
      COOKING_RULES.utensilSlotCount
  ) {
    throw new RangeError(
      "Cooking utensil slot count must equal 15.",
    );
  }

  const placedCounts = {};
  cookingState.utensilSlots.forEach(
    (utensilId, slotIndex) => {
      if (utensilId === null) {
        return;
      }
      getCookingUtensil(
        utensilId,
      );
      placedCounts[
        utensilId
      ] =
        (
          placedCounts[
            utensilId
          ] ??
          0
        ) +
        1;
      if (
        placedCounts[
          utensilId
        ] >
        (
          cookingState
            .utensilInventory[
              utensilId
            ] ??
          0
        )
      ) {
        throw new RangeError(
          `Placed utensil count exceeds inventory: ${utensilId}`,
        );
      }
      if (
        cookingState.activeJobs?.[
          slotIndex
        ] !== null &&
        cookingState.activeJobs?.[
          slotIndex
        ] !== undefined
      ) {
        const job =
          cookingState.activeJobs[
            slotIndex
          ];
        assertPlainObject(
          job,
          `Cooking job ${slotIndex}`,
        );
        const recipe =
          getRecipe(
            job.recipeId,
          );
        getFoodQuality(
          job.qualityId,
        );
        if (
          job.utensilId !==
          utensilId
        ) {
          throw new RangeError(
            `Cooking job utensil mismatch in slot ${slotIndex}.`,
          );
        }
        if (
          job.slotIndex !==
          slotIndex
        ) {
          throw new RangeError(
            `Cooking job slot mismatch in slot ${slotIndex}.`,
          );
        }
        if (
          ingredientSignature(
            job.ingredientIds ??
            [],
          ) !==
          ingredientSignature(
            recipe.ingredientIds,
          )
        ) {
          throw new RangeError(
            `Cooking job ingredients mismatch in slot ${slotIndex}.`,
          );
        }
        if (
          typeof job.startedAt !==
            "string" ||
          typeof job.readyAt !==
            "string" ||
          !Number.isInteger(
            job.completionSeconds,
          ) ||
          job.completionSeconds < 1
        ) {
          throw new RangeError(
            `Cooking job timing is invalid in slot ${slotIndex}.`,
          );
        }
      }
    },
  );

  if (
    !Array.isArray(
      cookingState.activeJobs,
    ) ||
    cookingState.activeJobs.length !==
      COOKING_RULES.utensilSlotCount
  ) {
    throw new RangeError(
      "Cooking active job slot count must equal 15.",
    );
  }

  assertPlainObject(
    cookingState.foodInventory,
    "Food inventory",
  );
  for (
    const [
      variantKey,
      record,
    ]
    of Object.entries(
      cookingState.foodInventory,
    )
  ) {
    assertPlainObject(
      record,
      `Food inventory ${variantKey}`,
    );
    const variant =
      createFoodVariant(
        record.recipeId,
        record.qualityId,
      );
    if (
      variant.variantKey !==
      variantKey
    ) {
      throw new RangeError(
        `Food inventory key mismatch: ${variantKey}`,
      );
    }
    assertNonNegativeInteger(
      record.quantity,
      `Food inventory quantity ${variantKey}`,
    );
  }

  assertPlainObject(
    cookingState.recipeDiscovery,
    "Recipe discovery",
  );
  for (
    const recipeId
    of Object.keys(
      cookingState.recipeDiscovery,
    )
  ) {
    getRecipe(
      recipeId,
    );
  }

  if (
    !Array.isArray(
      cookingState.cookHistory,
    )
  ) {
    throw new TypeError(
      "Cooking history must be an array.",
    );
  }

  const stock =
    cookingState
      .weeklyIngredientStock;
  assertPlainObject(
    stock,
    "Weekly ingredient stock",
  );
  if (
    !Array.isArray(
      stock.ingredientIds,
    ) ||
    stock.ingredientIds.length !==
      COOKING_RULES
        .weeklyIngredientStockCount
  ) {
    throw new RangeError(
      "Weekly ingredient stock must contain 20 ingredients.",
    );
  }
  if (
    new Set(
      stock.ingredientIds,
    ).size !==
    stock.ingredientIds.length
  ) {
    throw new RangeError(
      "Weekly ingredient stock must not contain duplicates.",
    );
  }
  stock.ingredientIds.forEach(
    getIngredient,
  );
  if (
    gameDate !== null &&
    stock.dateKey !==
      dateKey(gameDate)
  ) {
    throw new RangeError(
      "Weekly ingredient stock date does not match the game date.",
    );
  }

  assertPlainObject(
    cookingState.storageBox,
    "Cooking storage box",
  );
  if (
    ![
      "cookedAt",
      "number",
      "rarity",
      "quantity",
    ].includes(
      cookingState.storageBox
        .sortMode,
    )
  ) {
    throw new RangeError(
      "Cooking storage box sort mode is invalid.",
    );
  }
  if (
    cookingState.storageBox
      .pageSize !==
    COOKING_RULES
      .storageBoxPageSize
  ) {
    throw new RangeError(
      "Cooking storage box page size must equal 25.",
    );
  }
  assertNonNegativeInteger(
    cookingState
      .nextCookingSequence,
    "Next cooking sequence",
  );
  if (
    cookingState
      .nextCookingSequence < 1
  ) {
    throw new RangeError(
      "Next cooking sequence must be at least 1.",
    );
  }

  return true;
}

export function validateCookingMasters() {
  const ingredientIds =
    new Set(
      INGREDIENT_MASTER.map(
        (ingredient) =>
          ingredient.ingredientId,
      ),
    );
  const recipeIds =
    new Set(
      RECIPE_MASTER.map(
        (recipe) =>
          recipe.recipeId,
      ),
    );
  const utensilIds =
    new Set(
      COOKING_UTENSIL_MASTER.map(
        (utensil) =>
          utensil.utensilId,
      ),
    );

  if (
    ingredientIds.size !== 41 ||
    recipeIds.size !== 105 ||
    utensilIds.size !== 5
  ) {
    throw new Error(
      "Cooking master counts do not match the source.",
    );
  }

  const rankCounts =
    RECIPE_MASTER.reduce(
      (record, recipe) => {
        record[
          recipe.baseRank
        ] =
          (
            record[
              recipe.baseRank
            ] ??
            0
          ) +
          1;
        return record;
      },
      {},
    );

  for (
    const [
      rank,
      expected,
    ]
    of Object.entries({
      D: 17,
      C: 28,
      B: 32,
      A: 28,
    })
  ) {
    if (
      rankCounts[rank] !==
      expected
    ) {
      throw new Error(
        `Recipe rank count mismatch: ${rank}`,
      );
    }
  }

  for (
    const recipe
    of RECIPE_MASTER
  ) {
    const rank =
      getFoodRankData(
        recipe.baseRank,
      );
    if (
      recipe.ingredientIds.length <
        rank.minimumIngredients ||
      recipe.ingredientIds.length >
        rank.maximumIngredients
    ) {
      throw new Error(
        `Ingredient count mismatch: ${recipe.recipeId}`,
      );
    }
    for (
      const ingredientId
      of recipe.ingredientIds
    ) {
      if (
        !ingredientIds.has(
          ingredientId,
        )
      ) {
        throw new Error(
          `Unknown recipe ingredient: ${ingredientId}`,
        );
      }
    }
  }

  const probabilityTotal =
    FOOD_QUALITY_MASTER.reduce(
      (sum, quality) =>
        sum +
        quality.probability,
      0,
    );
  if (
    Math.abs(
      probabilityTotal - 1,
    ) >
    Number.EPSILON * 10
  ) {
    throw new Error(
      "Cooking quality probabilities must total 1.",
    );
  }

  return deepFreeze({
    ingredientCount:
      ingredientIds.size,
    utensilCount:
      utensilIds.size,
    recipeCount:
      recipeIds.size,
    rankCounts,
    probabilityTotal,
  });
}

export const COOKING_MASTER_VALIDATION =
  validateCookingMasters();
