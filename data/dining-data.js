/**
 * MOB BR restaurant / weekly set-meal rules.
 *
 * Generation 53 retires player cooking. The old cooking save remains only for
 * backward compatibility; the public food feature is now a weekly cafeteria
 * meal for player characters.
 */

import {
  MOTIVATION_RULES,
} from "./motivation-data.js?v=54";

export const DINING_DATA_VERSION =
  "mobbr-dining-data-2.0.0";
export const DINING_STATE_SCHEMA_VERSION =
  "mobbr-dining-state-2.0.0";

export const DINING_TRAINING_RATE_BY_RANK = Object.freeze({
  D: 0.05,
  C: 0.10,
  B: 0.15,
  A: 0.20,
  S: 0.30,
  SS: 0.50,
});

export const DINING_RULES = Object.freeze({
  setCountPerWeek: 3,
  dishesPerSet: 4,
  playerPointGainPerType: 2,
  employeePointGainPerPlayerMeal: 1,
  minimumSetPriceCoin: 3000,
  maximumSetPriceCoin: 10000,
  oneMealPerPlayerPerWeek: true,
  // Legacy keys kept neutral so Generation 52 saves and dormant code import safely.
  dishesPerMeal: 3,
  mealDurationSeconds: 0,
  clearDelaySeconds: 0,
  oneMealPerCharacterPerWeek: true,
  maximumCoachTrainingBonusRate: 0,
  playerMotivationChanceByRank: MOTIVATION_RULES.playerFoodChance,
});

export const DINING_MASTER_WELCOME_SPEECHES = Object.freeze([
  "いらっしゃいませ！ 今週もたくさん食べて力をつけてください！",
  "お待ちしていました！ 今週の定食も元気が出る組み合わせですよ！",
  "いらっしゃいませ！ しっかり食べて、今週の練習も頑張りましょう！",
  "今週も営業中です！ A・B・C定食から好きなものを選んでください！",
  "ようこそMOB DININGへ！ 今週もお腹いっぱい食べていってください！",
  "お疲れさまです！ 試合の前こそ、しっかり食べて準備しましょう！",
  "今週のメニューもできています！ 好きな定食をゆっくり選んでください！",
  "いらっしゃいませ！ 食事も立派なコンディション作りですよ！",
  "お腹は空いていますか？ 今週も3つの定食をご用意しました！",
  "今週も来てくれてありがとうございます！ しっかり栄養をつけましょう！",
  "今日もいい香りに仕上がっています！ 好きな定食をどうぞ！",
  "練習のあとは食堂へ！ 今週もしっかり力をつけてください！",
  "いらっしゃいませ！ どの定食を選んでも能力ポイントはしっかり付きますよ！",
  "今週もモブホワイト特製メニューです！ たくさん食べてください！",
  "体づくりは毎週の積み重ねです！ 今週の一食も大切にしましょう！",
  "お待たせしました！ 今週もメイン・サブ・スイーツ・飲み物のセットです！",
  "いらっしゃいませ！ 試合で動けるように、まずはお腹を満たしましょう！",
  "今週のおすすめを3セット用意しました！ 気分で選んでください！",
  "ようこそ！ おいしく食べて、また一段強くなってください！",
  "いらっしゃいませ！ 今週のMOB DININGも元気に営業しています！",
]);

export const DINING_ALREADY_FED_SPEECHES = Object.freeze([
  "今週はもう食べていますね！ また来週お待ちしています！",
  "ごちそうさまでした！ 次の定食は来週のお楽しみです！",
  "今週分はばっちりです！ また来週、違うメニューを用意しておきます！",
  "食事済みですね！ 今週はその力で練習と大会を頑張ってください！",
  "今週の食事は完了です！ また来週お腹を空かせて来てください！",
]);

// Compatibility exports for dormant Generation 52 dining UI.
export const DINING_HUNGRY_SPEECHES = DINING_MASTER_WELCOME_SPEECHES;
export const DINING_EATING_SPEECHES = Object.freeze([
  "美味しい！", "元気が出る！", "いただきます！", "これは大当たり！",
]);

export const DINING_SEASONAL_SPEECHES = Object.freeze({
  1: Object.freeze(["寒い1月は温かい料理を多めにしています！", "新しい年も、まずは温かい定食でスタートしましょう！"]),
  2: Object.freeze(["2月はチョコやココアを使った甘いメニューもおすすめです！", "寒さに負けないよう、温かい料理をしっかり食べてください！"]),
  3: Object.freeze(["春が近づいてきました！ 軽やかな春メニューも入っています！", "3月は甘いものとさっぱりした飲み物を合わせています！"]),
  4: Object.freeze(["新しい季節ですね！ 春らしい明るい定食を用意しました！", "4月はサンドやお寿司を入れた軽やかなセットもおすすめです！"]),
  5: Object.freeze(["過ごしやすい5月はバランス重視のメニューです！", "しっかり動けるよう、食べ応えのあるセットも用意しています！"]),
  6: Object.freeze(["雨の多い6月は温かい麺やカレーで元気を出しましょう！", "じめじめする季節こそ、しっかり食べてコンディションを整えましょう！"]),
  7: Object.freeze(["7月は夏メニューです！ 冷たいスイーツと炭酸もありますよ！", "暑い時期なので、食べやすい料理とさっぱりした飲み物を揃えました！"]),
  8: Object.freeze(["真夏の8月です！ アイスやサイダーでひと休みしてください！", "夏バテしないよう、メインもしっかり食べてくださいね！"]),
  9: Object.freeze(["9月は秋を先取りして、キノコやモンブランを多めにしています！", "少しずつ涼しくなってきました。秋らしい定食をどうぞ！"]),
  10: Object.freeze(["10月はチョコや濃い味のメニューを楽しんでください！", "秋本番です！ キノコ系メニューもおすすめですよ！"]),
  11: Object.freeze(["11月は温かい麺や肉まんがよく合う季節です！", "寒くなってきましたね。温かい定食でしっかり回復してください！"]),
  12: Object.freeze(["12月はクリスマス風メニューです！ チキンとケーキもありますよ！", "今年もお疲れさまです！ 12月は少し豪華な定食を楽しんでください！"]),
});

const MONTHLY_MENU_POOLS = Object.freeze({
  1: Object.freeze({ main: [19, 56, 57, 32, 30], side: [21, 38, 39, 18, 45], sweet: [74, 68, 22, 82, 85], drink: [87, 86, 89, 101, 88] }),
  2: Object.freeze({ main: [32, 47, 15, 16, 56], side: [53, 54, 42, 39, 18], sweet: [85, 73, 28, 77, 74], drink: [87, 88, 89, 95, 101] }),
  3: Object.freeze({ main: [6, 16, 40, 47, 58], side: [42, 18, 53, 54, 41], sweet: [79, 71, 74, 68, 80], drink: [91, 93, 95, 92, 101] }),
  4: Object.freeze({ main: [6, 5, 58, 59, 16], side: [42, 41, 18, 54, 53], sweet: [71, 79, 74, 80, 68], drink: [91, 93, 92, 95, 101] }),
  5: Object.freeze({ main: [47, 13, 14, 16, 40], side: [53, 54, 42, 41, 18], sweet: [80, 74, 79, 72, 68], drink: [91, 93, 96, 92, 89] }),
  6: Object.freeze({ main: [57, 56, 15, 19, 14], side: [39, 38, 45, 18, 42], sweet: [84, 69, 71, 74, 80], drink: [96, 89, 93, 91, 101] }),
  7: Object.freeze({ main: [47, 49, 58, 59, 57], side: [53, 54, 42, 43, 18], sweet: [76, 78, 75, 77, 68], drink: [90, 92, 91, 93, 97] }),
  8: Object.freeze({ main: [50, 47, 49, 56, 57], side: [53, 54, 55, 42, 18], sweet: [76, 78, 77, 102, 75], drink: [92, 90, 97, 91, 93] }),
  9: Object.freeze({ main: [52, 34, 46, 40, 15], side: [41, 42, 18, 53, 45], sweet: [82, 83, 71, 68, 80], drink: [93, 86, 89, 96, 101] }),
  10: Object.freeze({ main: [52, 50, 15, 34, 14], side: [46, 41, 53, 54, 42], sweet: [85, 83, 73, 77, 82], drink: [87, 88, 86, 93, 96] }),
  11: Object.freeze({ main: [19, 56, 57, 21, 30], side: [39, 38, 18, 45, 41], sweet: [68, 22, 23, 82, 84], drink: [86, 87, 88, 89, 101] }),
  12: Object.freeze({ main: [55, 33, 47], side: [53, 54, 42], sweet: [79, 85, 80], drink: [90, 96, 87] }),
});

function deterministicIndex(value, length) {
  let hash = 2166136261;
  for (const character of String(value ?? "")) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % Math.max(1, length);
}

export function diningWeekKey(gameDate) {
  return [
    Number(gameDate?.year) || 0,
    Number(gameDate?.month) || 0,
    Number(gameDate?.week) || 0,
  ].join("-");
}

function foodId(number) {
  return `food_${String(number).padStart(3, "0")}`;
}

export function getWeeklyDiningSets(gameDate) {
  const year = Number(gameDate?.year) || 0;
  const month = Math.max(1, Math.min(12, Number(gameDate?.month) || 1));
  const week = Math.max(1, Math.min(4, Number(gameDate?.week) || 1));
  const pool = MONTHLY_MENU_POOLS[month];
  const seed = deterministicIndex(`${year}-${month}-${week}`, 997);
  const labels = ["A定食", "B定食", "C定食"];
  return Object.freeze(labels.map((label, setIndex) => {
    const offset = seed + week * 2 + setIndex;
    const recipeIds = [
      foodId(pool.main[offset % pool.main.length]),
      foodId(pool.side[(offset + setIndex + 1) % pool.side.length]),
      foodId(pool.sweet[(offset + week + 2) % pool.sweet.length]),
      foodId(pool.drink[(offset + setIndex * 2 + 3) % pool.drink.length]),
    ];
    const rawPrice = 4000 + setIndex * 2000 + ((seed + week + setIndex) % 3) * 500;
    const priceCoin = Math.max(
      DINING_RULES.minimumSetPriceCoin,
      Math.min(DINING_RULES.maximumSetPriceCoin, rawPrice),
    );
    return Object.freeze({
      setId: `weekly_set_${String.fromCharCode(97 + setIndex)}`,
      label,
      recipeIds: Object.freeze(recipeIds),
      priceCoin,
      month,
      week,
      seasonalTheme: true,
    });
  }));
}

export function getDiningMasterSpeech(gameDate, {
  completed = false,
  characterId = "",
} = {}) {
  const key = `${diningWeekKey(gameDate)}:${characterId}:${completed ? "done" : "open"}`;
  if (completed) {
    return DINING_ALREADY_FED_SPEECHES[
      deterministicIndex(key, DINING_ALREADY_FED_SPEECHES.length)
    ];
  }
  const welcome = DINING_MASTER_WELCOME_SPEECHES[
    deterministicIndex(key, DINING_MASTER_WELCOME_SPEECHES.length)
  ];
  const month = Math.max(1, Math.min(12, Number(gameDate?.month) || 1));
  const seasonal = DINING_SEASONAL_SPEECHES[month];
  const seasonLine = seasonal[
    deterministicIndex(`${key}:season`, seasonal.length)
  ];
  return `${welcome}\n${seasonLine}`;
}

export function createInitialDiningState(gameDate, {
  createdAt = new Date().toISOString(),
} = {}) {
  return {
    schemaVersion: DINING_STATE_SCHEMA_VERSION,
    weekKey: diningWeekKey(gameDate),
    completedCharacterIds: [],
    activeMeals: {},
    coachMealBonuses: {},
    coachTrainingBonusRate: 0,
    history: [],
    createdAt,
    updatedAt: createdAt,
  };
}

export function normalizeDiningState(value, {
  gameDate,
  timestamp = new Date().toISOString(),
} = {}) {
  const base = createInitialDiningState(gameDate, { createdAt: timestamp });
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return base;
  }
  const currentWeek = diningWeekKey(gameDate);
  const sameWeek = value.weekKey === currentWeek;
  return {
    schemaVersion: DINING_STATE_SCHEMA_VERSION,
    weekKey: currentWeek,
    completedCharacterIds:
      sameWeek && Array.isArray(value.completedCharacterIds)
        ? [...new Set(value.completedCharacterIds.filter((entry) => typeof entry === "string" && entry))]
        : [],
    // Generation 53 has no timed meals and no coach/employee dining effects.
    activeMeals: {},
    coachMealBonuses: {},
    coachTrainingBonusRate: 0,
    history: Array.isArray(value.history)
      ? structuredClone(value.history).slice(-500)
      : [],
    createdAt: typeof value.createdAt === "string" ? value.createdAt : timestamp,
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : timestamp,
  };
}

export function refreshDiningWeekToDraft(diningState, gameDate, {
  timestamp = new Date().toISOString(),
} = {}) {
  const normalized = normalizeDiningState(diningState, { gameDate, timestamp });
  for (const key of Object.keys(diningState)) delete diningState[key];
  Object.assign(diningState, normalized);
  return diningState;
}

export function trainingRateForFoodRank(rank) {
  const normalized = String(rank ?? "").trim().toUpperCase();
  const rate = DINING_TRAINING_RATE_BY_RANK[normalized];
  if (!Number.isFinite(rate)) {
    throw new RangeError(`Unsupported dining food rank: ${rank}`);
  }
  return rate;
}

export function mealCoachTrainingRate(ranks) {
  if (!Array.isArray(ranks) || ranks.length === 0) return 0;
  return ranks.reduce((sum, rank) => sum + trainingRateForFoodRank(rank), 0) / ranks.length;
}

export function validateDiningState(diningState, { gameDate } = {}) {
  if (!diningState || typeof diningState !== "object" || Array.isArray(diningState)) {
    throw new TypeError("Dining state must be an object.");
  }
  if (diningState.schemaVersion !== DINING_STATE_SCHEMA_VERSION) {
    throw new RangeError(`Unsupported dining schema: ${diningState.schemaVersion}`);
  }
  if (gameDate && diningState.weekKey !== diningWeekKey(gameDate)) {
    throw new RangeError("Dining week does not match game date.");
  }
  if (!Array.isArray(diningState.completedCharacterIds) ||
      new Set(diningState.completedCharacterIds).size !== diningState.completedCharacterIds.length) {
    throw new RangeError("Dining completed character IDs must be a unique array.");
  }
  if (!Array.isArray(diningState.history)) {
    throw new RangeError("Dining history must be an array.");
  }
  if (Number(diningState.coachTrainingBonusRate ?? 0) !== 0) {
    throw new RangeError("Generation 53 dining must not grant coach training bonuses.");
  }
  return true;
}
