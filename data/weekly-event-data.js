/**
 * MOB BR weekly random event master.
 *
 * Events are selected once per game week. Selection itself is persisted by
 * state.js so reloading the page never re-rolls the event, target, choice, or
 * weighted outcome.
 */

export const WEEKLY_EVENT_DATA_VERSION = "mobbr-weekly-event-data-1.1.0";

export const WEEKLY_EVENT_RULES = Object.freeze({
  monthlyMinimumEvents: 1,
  monthlyMaximumEvents: 2,
  twoEventMonthChance: 0.60,
  rareShareWhenEventOccurs: 0.07,
  conditionalShareWhenEligible: 0.28,
  maxDuplicatePerCycle: 2,
  historyLimit: 240,
});

const speech = (text) => ({ type: "speech", text });
const center = (text) => ({ type: "center", text });
const points = (amount, scope = "target") => ({ type: "points", amount, scope });
const motivation = (direction, scope = "target", steps = 1) => ({
  type: "motivation",
  direction,
  scope,
  steps,
});
const resource = (resourceId, amount) => ({ type: "resource", resourceId, amount });
const item = (itemId, quantity = 1) => ({ type: "item", itemId, quantity });

function normal(id, title, config = {}) {
  return { id, title, rarity: "normal", speaker: "pink", ...config };
}
function rare(id, title, config = {}) {
  return { id, title, rarity: "rare", speaker: "white", ...config };
}
function conditional(id, title, condition, config = {}) {
  return { id, title, rarity: "conditional", speaker: "pink", condition, ...config };
}

export const WEEKLY_EVENTS = Object.freeze([
  // -----------------------------------------------------------------------
  // NORMAL EVENTS — user supplied examples are kept verbatim in spirit.
  // -----------------------------------------------------------------------
  normal("good_day", "調子が良い日", {
    target: "random",
    lines: [speech("{player}さん！今日は絶好調の予感であります！")],
    effects: [motivation("up")],
  }),
  normal("slump_day", "今日は不調かも", {
    target: "random",
    lines: [speech("{player}さん、今日は体調が心配であります……。")],
    effects: [motivation("down")],
  }),
  normal("training_weather", "トレーニング日和", {
    target: "random",
    lines: [speech("{player}さん！体を動かすには絶好の日和であります！")],
    effects: [points(2)],
  }),
  normal("finger_injury", "まさか怪我・・？", {
    target: "random",
    lines: [
      speech("{player}さん！大丈夫でありますか！？"),
      speech("むむっ、突き指のようであります。無理は禁物であります！"),
    ],
    effects: [motivation("down"), points(-1)],
  }),
  normal("check_goal", "目標を確認", {
    target: "all",
    lines: [speech("みなさん！目標に向かって前進であります！")],
    effects: [points(2, "all")],
  }),
  normal("world_video", "世界大会の映像", {
    target: "all",
    lines: [
      speech("みなさん！モブチューブで世界大会の研究であります！"),
      center("・・・・・・"),
    ],
    outcomes: [
      { weight: 70, lines: [center("全員のやる気が上がった！")], effects: [motivation("up", "all")] },
      { weight: 30, lines: [center("全員のやる気が下がった")], effects: [motivation("down", "all")] },
    ],
  }),
  normal("only_forward", "前進あるのみ！", {
    target: "random",
    lines: [
      speech("{player}さん！前向きな気持ちも勝利への力であります！"),
      speech("今週も気合十分であります！"),
    ],
    effects: [motivation("up")],
  }),
  normal("sponsor_gift", "スポンサー", {
    target: "all",
    lines: [
      speech("みなさん！スポンサーさんから差し入れであります！"),
      speech("ありがたい応援であります♪"),
    ],
    effects: [points(2, "all"), resource("diamond", 50), resource("coin", 10000)],
  }),
  normal("strange_food", "見慣れない食べ物", {
    target: "random",
    lines: [
      speech("{player}さん！食堂に見慣れない食べ物があるであります！"),
      speech("ひと口、挑戦してみるでありますか？"),
    ],
    choices: [
      {
        id: "eat",
        label: "はい",
        outcomes: [
          { weight: 40, lines: [speech("なんと！おいしかったのでありますか！？")], effects: [points(10)] },
          { weight: 60, lines: [speech("むむっ、お口に合わなかったようであります……。")], effects: [points(-5)] },
        ],
      },
      {
        id: "discard",
        label: "いいえ",
        lines: [speech("了解であります！こちらで片付けるであります！")],
        effects: [],
      },
    ],
  }),
  normal("morning_stretch", "朝のストレッチ", {
    target: "random",
    lines: [speech("{player}さん！朝のストレッチ、お見事であります！")],
    effects: [points(1), motivation("up")],
  }),
  normal("extra_practice", "居残り練習", {
    target: "random",
    lines: [speech("{player}さん！まだ練習とは、すごい集中力であります！")],
    effects: [points(3)],
  }),
  normal("igl_notebook", "作戦ノート", {
    target: "IGL",
    lines: [speech("{player}さん！その作戦ノートは努力の結晶であります！")],
    effects: [points(3)],
  }),
  normal("atk_focus", "エースの集中", {
    target: "ATK",
    lines: [speech("{player}さん！今日の集中力は抜群であります！")],
    effects: [points(3)],
  }),
  normal("sup_research", "サポート研究", {
    target: "SUP",
    lines: [speech("{player}さん！味方を助ける動きの研究、感心であります！")],
    effects: [points(3)],
  }),
  normal("team_meeting", "チームミーティング", {
    target: "all",
    lines: [speech("みなさん！短い話し合いにも発見があるであります！")],
    effects: [points(1, "all")],
  }),
  normal("early_finish", "今日は早上がり", {
    target: "random",
    lines: [speech("{player}さん！今日は早めの休息も大切であります！")],
    effects: [motivation("up")],
  }),
  normal("lack_of_sleep", "寝不足", {
    target: "random",
    lines: [speech("{player}さん、目の下にクマが……。休息が必要であります！")],
    effects: [motivation("down")],
  }),
  normal("forgotten_gear", "忘れ物", {
    target: "random",
    lines: [speech("{player}さん！練習道具のお忘れ物であります！")],
    effects: [points(-1)],
  }),
  normal("new_training_menu", "新しい練習メニュー", {
    target: "all",
    lines: [speech("みなさん！新しい練習メニューの提案であります！")],
    outcomes: [
      { weight: 75, lines: [speech("かなり手応えがあったようであります♪")], effects: [points(2, "all")] },
      { weight: 25, lines: [speech("少し難しかったでありますか……？")], effects: [points(-1, "all")] },
    ],
  }),
  normal("pink_cheer", "モブピンクの応援", {
    target: "random",
    lines: [speech("{player}さん！わたしはいつでも応援団であります！")],
    effects: [motivation("up")],
  }),
  normal("small_success", "小さな成功", {
    target: "random",
    lines: [speech("{player}さん！昨日より確実に良い動きであります！")],
    effects: [points(2), motivation("up")],
  }),
  normal("rainy_day", "雨の日", {
    target: "random",
    lines: [speech("{player}さん、外は雨であります。今日は室内練習であります！")],
    effects: [points(2)],
  }),
  normal("muscle_pain", "筋肉痛", {
    target: "random",
    lines: [speech("{player}さん、筋肉痛のようであります。頑張りすぎに注意であります！")],
    effects: [points(-1), motivation("down")],
  }),
  normal("great_atmosphere", "いい雰囲気", {
    target: "all",
    lines: [speech("みなさん！今日のチームは良い雰囲気であります♪")],
    effects: [motivation("up", "all")],
  }),
  normal("little_argument", "ちょっとした口げんか", {
    target: "random",
    lines: [speech("{player}さん……今の言葉は少し厳しかったであります。")],
    effects: [motivation("down")],
  }),
  normal("make_up", "仲直り", {
    target: "all",
    lines: [speech("仲直りできて安心であります！やっぱり仲良しが一番であります♪")],
    effects: [motivation("up", "all")],
  }),
  normal("fan_letter", "ファンレター", {
    target: "random",
    lines: [speech("{player}さん宛てにファンレターであります！")],
    effects: [motivation("up")],
  }),
  normal("energy_drink", "差し入れドリンク", {
    target: "random",
    lines: [speech("{player}さん！差し入れのドリンクでひと息であります♪")],
    effects: [points(2)],
  }),
  normal("cleanup", "片付けの時間", {
    target: "all",
    lines: [speech("みなさん！練習場の片付けで気分も一新であります！")],
    effects: [points(1, "all")],
  }),
  normal("new_poster", "新しいポスター", {
    target: "all",
    lines: [speech("世界大会のポスターを貼ったであります！目指すはこの舞台であります！")],
    effects: [motivation("up", "all")],
  }),
  normal("rest_or_train", "休養のすすめ", {
    target: "random",
    lines: [speech("{player}さん、今日は休息と軽い練習、どちらにするでありますか？")],
    choices: [
      { id: "rest", label: "しっかり休む", lines: [speech("了解であります！休むのも大切なトレーニングであります♪")], effects: [motivation("up")] },
      {
        id: "train",
        label: "少し練習する",
        outcomes: [
          { weight: 80, lines: [speech("良い練習になったであります！")], effects: [points(3)] },
          { weight: 20, lines: [speech("少し無理をしすぎたようであります……。")], effects: [points(1), motivation("down")] },
        ],
      },
    ],
  }),
  normal("secret_training", "秘密の特訓", {
    target: "random",
    lines: [speech("{player}さん！秘密の特訓に挑戦してみるでありますか？")],
    choices: [
      {
        id: "do",
        label: "やってみる",
        outcomes: [
          { weight: 70, lines: [speech("大成功であります！成長の手応えありであります！")], effects: [points(5)] },
          { weight: 30, lines: [speech("むむっ、難しい特訓でありました……。")], effects: [points(-2)] },
        ],
      },
      { id: "skip", label: "今回はやめる", lines: [speech("了解であります！またの機会に挑戦であります♪")], effects: [] },
    ],
  }),
  normal("early_run", "早朝ランニング", {
    target: "random",
    lines: [speech("{player}さん！こんな朝早くから、感心であります！")],
    effects: [points(3)],
  }),
  normal("igl_judgement", "IGLの判断力", {
    target: "IGL",
    lines: [speech("{player}さん！今の判断は実に素早かったであります！")],
    effects: [points(4)],
  }),
  normal("atk_one_shot", "ATKの一発", {
    target: "ATK",
    lines: [speech("{player}さん！今の一発はお見事であります！")],
    effects: [points(4)],
  }),
  normal("sup_care", "SUPの気配り", {
    target: "SUP",
    lines: [speech("{player}さん！細かな観察が上達への一歩であります！")],
    effects: [points(4)],
  }),
  normal("stream_comments", "配信コメント", {
    target: "random",
    lines: [speech("{player}さん！配信に応援の声がいっぱいであります！")],
    effects: [motivation("up")],
  }),
  normal("bad_rumor", "気になる噂", {
    target: "random",
    lines: [speech("{player}さん……噂に振り回されず、自分のペースであります！")],
    effects: [motivation("down")],
  }),
  normal("interview_offer", "取材依頼", {
    target: "random",
    lines: [speech("{player}さん！雑誌から取材の依頼であります！")],
    choices: [
      {
        id: "accept",
        label: "取材を受ける",
        outcomes: [
          { weight: 70, lines: [speech("素敵な記事になったであります♪")], effects: [motivation("up"), resource("coin", 5000)] },
          { weight: 30, lines: [speech("少し緊張したようであります……。次の機会があるであります！")], effects: [motivation("down")] },
        ],
      },
      { id: "decline", label: "今回は断る", lines: [speech("了解であります！今日は練習優先であります！")], effects: [points(1)] },
    ],
  }),
  normal("equipment_check", "整備の日", {
    target: "random",
    lines: [speech("{player}さん！丁寧な道具の整備も大切であります！")],
    effects: [points(2)],
  }),
  normal("senior_advice", "先輩のアドバイス", {
    target: "random",
    lines: [speech("{player}さん！先輩の助言は大きな収穫であります！")],
    effects: [points(3)],
  }),
  normal("mock_battle", "模擬戦", {
    target: "all",
    lines: [speech("みなさん！今日は本番を想定した模擬戦であります！")],
    effects: [points(2, "all")],
  }),
  normal("evening_walk", "夕方の散歩", {
    target: "random",
    lines: [speech("{player}さん、散歩で気分転換もおすすめであります♪")],
    effects: [motivation("up")],
  }),
  normal("weekly_review", "週末の反省会", {
    target: "all",
    lines: [speech("みなさん！今週の成果と反省を次につなげるであります！")],
    effects: [points(1, "all")],
  }),
  normal("overslept", "うっかり寝坊", {
    target: "random",
    lines: [speech("{player}さん！もう練習が始まっているであります！")],
    effects: [motivation("down")],
  }),
  normal("big_cleaning", "大掃除", {
    target: "all",
    lines: [speech("みなさん！今日は会社の大掃除であります！")],
    effects: [points(1, "all"), resource("coin", 1000)],
  }),
  normal("video_1000", "祝！動画1000再生", {
    target: "all",
    lines: [speech("みなさん！チームの動画が1000再生突破であります！")],
    effects: [motivation("up", "all"), resource("coin", 5000)],
  }),
  normal("unexpected_expense", "予想外の出費", {
    target: "none",
    lines: [speech("うぅ……備品が故障であります。修理代が必要であります……。")],
    effects: [resource("coin", -3000)],
  }),
  normal("small_income", "小さな臨時収入", {
    target: "none",
    lines: [speech("臨時収入であります！うれしい知らせであります♪")],
    effects: [resource("coin", 5000)],
  }),
  normal("found_diamonds", "ダイヤの贈り物", {
    target: "none",
    lines: [speech("取引先からダイヤの贈り物であります！大切に使うであります♪")],
    effects: [resource("diamond", 5)],
  }),
  normal("book_present", "読みかけの本", {
    target: "random",
    lines: [speech("{player}さん！練習の参考になる本を発見であります！一緒に研究であります！")],
    effects: [points(3)],
  }),
  normal("scope_present", "倉庫のスコープ", {
    target: "random",
    lines: [speech("{player}さん！倉庫の道具で射撃の研究であります！")],
    effects: [points(3)],
  }),

  // -----------------------------------------------------------------------
  // RARE EVENTS — MOB WHITE appears large.
  // -----------------------------------------------------------------------
  rare("rare_great_chef", "絶好調なシェフ", {
    target: "random",
    lines: [
      speech("見てください！こんなにコクのあるスープが出来ました"),
      center("{player}は一気に飲み干した"),
    ],
    effects: [points(5), motivation("up")],
  }),
  rare("rare_baked_potato", "こんがりポテト", {
    target: "random",
    lines: [speech("{player}さん！ポテトはお好きですか！？")],
    choices: [
      { id: "yes", label: "はい", lines: [speech("これをどうぞ！")], effects: [points(5)] },
      { id: "no", label: "いいえ", lines: [speech("そうですか・・")], effects: [] },
    ],
  }),
  rare("rare_overseas_fan", "海外のファン", {
    target: "random",
    lines: [speech("{player}さん！海外のファンから珍しい食材が届きました！")],
    choices: [
      { id: "eat", label: "食べてみる", lines: [speech("おおっ！気に入ったみたいですね！")], effects: [motivation("up"), points(7)] },
      { id: "discard", label: "怖いから捨てて", lines: [speech("えー・・わかりました・・")], effects: [] },
    ],
  }),
  rare("rare_training_note", "謎の特訓ノート", {
    target: "random",
    lines: [speech("{player}さん！このノート、すごい練習方法が書いてあります！")],
    effects: [points(10)],
  }),
  rare("rare_vip_sponsor", "VIPスポンサー", {
    target: "all",
    lines: [speech("大変です！特別スポンサーから豪華な支援が届きました！")],
    effects: [points(5, "all"), resource("coin", 50000), resource("diamond", 100)],
  }),
  rare("rare_miracle_morning", "奇跡の朝", {
    target: "all",
    lines: [speech("今日は空気が違います！みなさん、すごく良い顔をしています！")],
    effects: [motivation("up", "all"), points(3, "all")],
  }),
  rare("rare_champion_video", "世界王者の練習映像", {
    target: "random",
    lines: [speech("{player}さん！世界王者の非公開練習映像が届きました！")],
    effects: [points(8), motivation("up")],
  }),
  rare("rare_golden_gift", "黄金の差し入れ", {
    target: "random",
    lines: [speech("{player}さん！見たことのない豪華な差し入れです！")],
    effects: [points(7), motivation("up")],
  }),
  rare("rare_secret_recipe", "ホワイトモブの秘密レシピ", {
    target: "random",
    lines: [speech("{player}さん！秘密のレシピで作った料理、試してみませんか？")],
    choices: [
      {
        id: "try",
        label: "食べてみる",
        outcomes: [
          { weight: 85, lines: [speech("やりました！大成功です！")], effects: [points(10), motivation("up")] },
          { weight: 15, lines: [speech("あれ・・今日は少し味が濃かったみたいです")], effects: [points(2)] },
        ],
      },
      { id: "skip", label: "今回は遠慮する", lines: [speech("わかりました。また作りますね！")], effects: [] },
    ],
  }),
  rare("rare_hidden_gym", "幻の練習場", {
    target: "all",
    lines: [speech("今日だけ使える特別な練習場を見つけました！")],
    effects: [points(5, "all")],
  }),
  rare("rare_world_message", "世界王者からのメッセージ", {
    target: "all",
    lines: [speech("みなさん！世界王者から応援メッセージが届いています！")],
    effects: [motivation("up", "all"), points(5, "all")],
  }),
  rare("rare_treasure_box", "謎の宝箱", {
    target: "none",
    lines: [speech("倉庫の奥から古い宝箱が見つかりました！開けてみましょう！"), center("カチッ・・")],
    effects: [resource("coin", 100000), resource("diamond", 50), resource("ruby", 3)],
  }),

  // -----------------------------------------------------------------------
  // CONDITIONAL EVENTS
  // -----------------------------------------------------------------------
  conditional("cond_rank_up_fans", "ランクアップのお祝い", "company_rank_up_next_week", {
    target: "all",
    lines: [
      speech("ファンの方からランクアップのお祝いであります！"),
      speech("一緒に戦う仲間のようで、うれしいであります♪"),
    ],
    effects: [motivation("up", "all"), points(3, "all"), resource("coin", 10000)],
  }),
  conditional("cond_tournament_win", "優勝のお祝い", "tournament_win_next_week", {
    target: "all",
    lines: [
      speech("みなさん！先週の優勝にお祝いのメッセージであります！"),
      speech("この勢いで次の大会も挑戦であります！"),
    ],
    effects: [motivation("up", "all"), points(3, "all"), resource("coin", 20000)],
  }),
  conditional("cond_low_motivation", "苦しい時こそ", "low_motivation", {
    target: "lowest_motivation",
    lines: [speech("{player}さん。うまくいかない時こそ、一歩ずつであります！")],
    effects: [motivation("up"), points(2)],
  }),
  conditional("cond_all_positive", "3人とも好調！", "all_positive_motivation", {
    target: "all",
    lines: [speech("みなさん！今日は3人とも良い雰囲気であります！")],
    effects: [points(3, "all")],
  }),
  conditional("cond_local_week", "LOCAL直前", "local_tournament_week", {
    target: "all",
    lines: [speech("みなさん！今週はいよいよLOCALであります！準備万端でありますか！？")],
    effects: [motivation("up", "all")],
  }),
  conditional("cond_world_week", "WORLDの舞台", "world_tournament_week", {
    target: "all",
    lines: [speech("ついに世界の舞台であります！積み重ねた力を発揮するであります！")],
    effects: [motivation("up", "all"), points(2, "all")],
  }),
  conditional("cond_championship_week", "CHAMPIONSHIP", "championship_week", {
    target: "all",
    lines: [speech("みなさん！最高峰の舞台であります！胸を張って挑むであります！")],
    effects: [motivation("up", "all"), points(5, "all")],
  }),
]);

const EVENT_MAP = new Map(WEEKLY_EVENTS.map((event) => [event.id, Object.freeze(event)]));

export function getWeeklyEvent(eventId) {
  return EVENT_MAP.get(eventId) ?? null;
}

export function getWeeklyEventsByRarity(rarity) {
  return WEEKLY_EVENTS.filter((event) => event.rarity === rarity);
}

export function weightedOutcome(outcomes, unit = 0.5) {
  if (!Array.isArray(outcomes) || outcomes.length === 0) return null;
  const total = outcomes.reduce((sum, outcome) => sum + Math.max(0, Number(outcome.weight) || 0), 0);
  if (total <= 0) return outcomes[0];
  let cursor = Math.min(0.999999999, Math.max(0, Number(unit) || 0)) * total;
  for (const outcome of outcomes) {
    cursor -= Math.max(0, Number(outcome.weight) || 0);
    if (cursor < 0) return outcome;
  }
  return outcomes.at(-1);
}

export function deterministicEventUnit(seed) {
  const source = String(seed ?? "mobbr-weekly-event");
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

export function formatWeeklyEventText(text, context = {}) {
  return String(text ?? "")
    .replaceAll("{player}", context.playerName ?? "選手")
    .replaceAll("{role}", context.role ?? "")
    .replaceAll("{companyRank}", context.companyRank ?? "")
    .replaceAll("{companyName}", context.companyName ?? "MOB BR");
}
