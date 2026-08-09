/**
 * MOB BR weekly random event master.
 *
 * Events are selected once per game week. Selection itself is persisted by
 * state.js so reloading the page never re-rolls the event, target, choice, or
 * weighted outcome.
 */

export const WEEKLY_EVENT_DATA_VERSION = "mobbr-weekly-event-data-1.0.0";

export const WEEKLY_EVENT_RULES = Object.freeze({
  eventChance: 0.82,
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
    lines: [speech("{player}さん！今日は調子が良さそうですね♪")],
    effects: [motivation("up")],
  }),
  normal("slump_day", "今日は不調かも", {
    target: "random",
    lines: [speech("{player}さん、体調が悪そうですね、、")],
    effects: [motivation("down")],
  }),
  normal("training_weather", "トレーニング日和", {
    target: "random",
    lines: [speech("{player}さん、今日はなんだか体を動かしたくなりますね♪")],
    effects: [points(2)],
  }),
  normal("finger_injury", "まさか怪我・・？", {
    target: "random",
    lines: [
      speech("{player}さん大丈夫ですか！？"),
      speech("ありゃ～これは突き指ですね"),
    ],
    effects: [motivation("down"), points(-1)],
  }),
  normal("check_goal", "目標を確認", {
    target: "all",
    lines: [speech("みなさん！これからも目標に向かって頑張りましょう！")],
    effects: [points(2, "all")],
  }),
  normal("world_video", "世界大会の映像", {
    target: "all",
    lines: [
      speech("みなさん！モブチューブで世界大会を見ましょう！"),
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
      speech("{player}さん！やはり勝つためにはポジティブ精神です！"),
      speech("今週も頑張りましょう！"),
    ],
    effects: [motivation("up")],
  }),
  normal("sponsor_gift", "スポンサー", {
    target: "all",
    lines: [
      speech("みなさん！スポンサーさんから差し入れをいただきました！"),
      speech("ありがたいですね♪"),
    ],
    effects: [points(2, "all"), resource("diamond", 50), resource("coin", 10000)],
  }),
  normal("strange_food", "見慣れない食べ物", {
    target: "random",
    lines: [
      speech("{player}さん！食堂に見慣れない食べ物が置いてありました！"),
      speech("食べてみますか？"),
    ],
    choices: [
      {
        id: "eat",
        label: "はい",
        outcomes: [
          { weight: 40, lines: [speech("え！？美味しいんですか！？")], effects: [points(10)] },
          { weight: 60, lines: [speech("やっぱり美味しくないのですね・・")], effects: [points(-5)] },
        ],
      },
      {
        id: "discard",
        label: "いいえ",
        lines: [speech("そうですね！捨てておきます！")],
        effects: [],
      },
    ],
  }),
  normal("morning_stretch", "朝のストレッチ", {
    target: "random",
    lines: [speech("{player}さん！朝のストレッチ、いい感じですね♪")],
    effects: [points(1), motivation("up")],
  }),
  normal("extra_practice", "居残り練習", {
    target: "random",
    lines: [speech("{player}さん、まだ練習するんですか！？すごい集中力です！")],
    effects: [points(3)],
  }),
  normal("igl_notebook", "作戦ノート", {
    target: "IGL",
    lines: [speech("{player}さん！その作戦ノート、かなり書き込んでありますね！")],
    effects: [points(3)],
  }),
  normal("atk_focus", "エースの集中", {
    target: "ATK",
    lines: [speech("{player}さん！今日の集中力、すごいですね！")],
    effects: [points(3)],
  }),
  normal("sup_research", "サポート研究", {
    target: "SUP",
    lines: [speech("{player}さん！味方を助ける動きをずっと研究していたんですね♪")],
    effects: [points(3)],
  }),
  normal("team_meeting", "チームミーティング", {
    target: "all",
    lines: [speech("みなさん！短い時間でも、話し合うと見えてくるものがありますね！")],
    effects: [points(1, "all")],
  }),
  normal("early_finish", "今日は早上がり", {
    target: "random",
    lines: [speech("{player}さん！今日は早めに休んで、また明日頑張りましょう♪")],
    effects: [motivation("up")],
  }),
  normal("lack_of_sleep", "寝不足", {
    target: "random",
    lines: [speech("{player}さん、目の下にクマが・・今日は無理しないでくださいね")],
    effects: [motivation("down")],
  }),
  normal("forgotten_gear", "忘れ物", {
    target: "random",
    lines: [speech("{player}さん！練習道具を忘れていますよ～！")],
    effects: [points(-1)],
  }),
  normal("new_training_menu", "新しい練習メニュー", {
    target: "all",
    lines: [speech("みなさん！新しい練習メニューを考えてみました！")],
    outcomes: [
      { weight: 75, lines: [speech("かなり手応えがあったみたいですね♪")], effects: [points(2, "all")] },
      { weight: 25, lines: [speech("ちょっと難しすぎましたか・・？")], effects: [points(-1, "all")] },
    ],
  }),
  normal("pink_cheer", "モブピンクの応援", {
    target: "random",
    lines: [speech("{player}さん！わたし、ずっと応援していますからね！")],
    effects: [motivation("up")],
  }),
  normal("small_success", "小さな成功", {
    target: "random",
    lines: [speech("{player}さん！今の動き、昨日よりずっと良くなっていますよ♪")],
    effects: [points(2), motivation("up")],
  }),
  normal("rainy_day", "雨の日", {
    target: "random",
    lines: [speech("{player}さん、外は雨ですね。今日は室内でじっくりやりましょう！")],
    effects: [points(2)],
  }),
  normal("muscle_pain", "筋肉痛", {
    target: "random",
    lines: [speech("{player}さん、昨日頑張りすぎましたね・・筋肉痛みたいです")],
    effects: [points(-1), motivation("down")],
  }),
  normal("great_atmosphere", "いい雰囲気", {
    target: "all",
    lines: [speech("みなさん！今日はチームの雰囲気がとっても良いですね♪")],
    effects: [motivation("up", "all")],
  }),
  normal("little_argument", "ちょっとした口げんか", {
    target: "random",
    lines: [speech("{player}さん・・ちょっと言いすぎちゃいましたね")],
    effects: [motivation("down")],
  }),
  normal("make_up", "仲直り", {
    target: "all",
    lines: [speech("よかった～！みなさん、やっぱり仲良しが一番です♪")],
    effects: [motivation("up", "all")],
  }),
  normal("fan_letter", "ファンレター", {
    target: "random",
    lines: [speech("{player}さん宛てにファンレターが届いていますよ！")],
    effects: [motivation("up")],
  }),
  normal("energy_drink", "差し入れドリンク", {
    target: "random",
    lines: [speech("{player}さん！冷蔵庫に差し入れのドリンクがありましたよ♪")],
    effects: [points(2)],
  }),
  normal("cleanup", "片付けの時間", {
    target: "all",
    lines: [speech("みなさん！練習場をきれいにすると気持ちもスッキリしますね！")],
    effects: [points(1, "all")],
  }),
  normal("new_poster", "新しいポスター", {
    target: "all",
    lines: [speech("世界大会のポスターを貼ってみました！目標が近く感じますね♪")],
    effects: [motivation("up", "all")],
  }),
  normal("rest_or_train", "休養のすすめ", {
    target: "random",
    lines: [speech("{player}さん、今日は休みますか？それとも少し練習しますか？")],
    choices: [
      { id: "rest", label: "しっかり休む", lines: [speech("はい！休むのも大事なトレーニングです♪")], effects: [motivation("up")] },
      {
        id: "train",
        label: "少し練習する",
        outcomes: [
          { weight: 80, lines: [speech("良い練習になりましたね！")], effects: [points(3)] },
          { weight: 20, lines: [speech("ちょっと無理しすぎたみたいです・・")], effects: [points(1), motivation("down")] },
        ],
      },
    ],
  }),
  normal("secret_training", "秘密の特訓", {
    target: "random",
    lines: [speech("{player}さん！誰にも言わずに秘密の特訓、やってみますか？")],
    choices: [
      {
        id: "do",
        label: "やってみる",
        outcomes: [
          { weight: 70, lines: [speech("大成功です！これは伸びましたよ！")], effects: [points(5)] },
          { weight: 30, lines: [speech("む、難しすぎました・・")], effects: [points(-2)] },
        ],
      },
      { id: "skip", label: "今回はやめる", lines: [speech("了解です！また良さそうな時にやりましょう♪")], effects: [] },
    ],
  }),
  normal("early_run", "早朝ランニング", {
    target: "random",
    lines: [speech("{player}さん！こんな朝早くから走っていたんですか！？")],
    effects: [points(3)],
  }),
  normal("igl_judgement", "IGLの判断力", {
    target: "IGL",
    lines: [speech("{player}さん！今の判断、すごく速かったです！")],
    effects: [points(4)],
  }),
  normal("atk_one_shot", "ATKの一発", {
    target: "ATK",
    lines: [speech("{player}さん！今の一発、見ていて気持ちよかったです！")],
    effects: [points(4)],
  }),
  normal("sup_care", "SUPの気配り", {
    target: "SUP",
    lines: [speech("{player}さん！細かいところまで見ているんですね♪")],
    effects: [points(4)],
  }),
  normal("stream_comments", "配信コメント", {
    target: "random",
    lines: [speech("{player}さん！配信のコメント欄、応援でいっぱいですよ！")],
    effects: [motivation("up")],
  }),
  normal("bad_rumor", "気になる噂", {
    target: "random",
    lines: [speech("{player}さん・・ネットの噂は気にしないほうがいいですよ")],
    effects: [motivation("down")],
  }),
  normal("interview_offer", "取材依頼", {
    target: "random",
    lines: [speech("{player}さん！雑誌から取材の依頼が来ています！")],
    choices: [
      {
        id: "accept",
        label: "取材を受ける",
        outcomes: [
          { weight: 70, lines: [speech("すごく良い記事になったみたいです♪")], effects: [motivation("up"), resource("coin", 5000)] },
          { weight: 30, lines: [speech("ちょっと緊張しすぎちゃいましたね・・")], effects: [motivation("down")] },
        ],
      },
      { id: "decline", label: "今回は断る", lines: [speech("わかりました！練習を優先しましょう！")], effects: [points(1)] },
    ],
  }),
  normal("equipment_check", "整備の日", {
    target: "random",
    lines: [speech("{player}さん！道具を丁寧に整備すると集中できますね♪")],
    effects: [points(2)],
  }),
  normal("senior_advice", "先輩のアドバイス", {
    target: "random",
    lines: [speech("{player}さん！先輩から良いアドバイスをもらえたみたいですね！")],
    effects: [points(3)],
  }),
  normal("mock_battle", "模擬戦", {
    target: "all",
    lines: [speech("みなさん！今日は本番を想定して模擬戦をやってみましょう！")],
    effects: [points(2, "all")],
  }),
  normal("evening_walk", "夕方の散歩", {
    target: "random",
    lines: [speech("{player}さん、少し散歩すると頭がスッキリしますよ♪")],
    effects: [motivation("up")],
  }),
  normal("weekly_review", "週末の反省会", {
    target: "all",
    lines: [speech("みなさん！良かったところも、反省点も次につなげましょう！")],
    effects: [points(1, "all")],
  }),
  normal("overslept", "うっかり寝坊", {
    target: "random",
    lines: [speech("{player}さん！もうみんな練習を始めていますよ～！")],
    effects: [motivation("down")],
  }),
  normal("big_cleaning", "大掃除", {
    target: "all",
    lines: [speech("みなさん！今日は会社をピカピカにしましょう！")],
    effects: [points(1, "all"), resource("coin", 1000)],
  }),
  normal("video_1000", "祝！動画1000再生", {
    target: "all",
    lines: [speech("みなさん！チームの動画が1000再生を超えました！")],
    effects: [motivation("up", "all"), resource("coin", 5000)],
  }),
  normal("unexpected_expense", "予想外の出費", {
    target: "none",
    lines: [speech("うぅ・・備品が壊れてしまいました。修理代が必要みたいです・・")],
    effects: [resource("coin", -3000)],
  }),
  normal("small_income", "小さな臨時収入", {
    target: "none",
    lines: [speech("ちょっとした臨時収入が入りました！うれしいですね♪")],
    effects: [resource("coin", 5000)],
  }),
  normal("found_diamonds", "ダイヤの贈り物", {
    target: "none",
    lines: [speech("取引先からダイヤをいただきました！大切に使いましょう♪")],
    effects: [resource("diamond", 5)],
  }),
  normal("book_present", "読みかけの本", {
    target: "random",
    lines: [speech("{player}さん！本棚に面白そうな本がありましたよ！")],
    effects: [item("unfinished_book", 1)],
  }),
  normal("scope_present", "倉庫のスコープ", {
    target: "random",
    lines: [speech("{player}さん！倉庫から使えそうなスコープが見つかりました！")],
    effects: [item("scope", 1)],
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
      speech("ファンの方からランクアップをお祝いしていただきました！"),
      speech("一緒に戦っているようで嬉しいですね♪"),
    ],
    effects: [motivation("up", "all"), points(3, "all"), resource("coin", 10000)],
  }),
  conditional("cond_tournament_win", "優勝のお祝い", "tournament_win_next_week", {
    target: "all",
    lines: [
      speech("みなさん！先週の優勝をお祝いして、たくさんのメッセージが届いています！"),
      speech("この勢いで次も頑張りましょう♪"),
    ],
    effects: [motivation("up", "all"), points(3, "all"), resource("coin", 20000)],
  }),
  conditional("cond_low_motivation", "苦しい時こそ", "low_motivation", {
    target: "lowest_motivation",
    lines: [speech("{player}さん。うまくいかない時こそ、少しずつ前へ進みましょう！")],
    effects: [motivation("up"), points(2)],
  }),
  conditional("cond_all_positive", "3人とも好調！", "all_positive_motivation", {
    target: "all",
    lines: [speech("みなさん！今日は3人ともすごく良い雰囲気です！")],
    effects: [points(3, "all")],
  }),
  conditional("cond_local_week", "LOCAL直前", "local_tournament_week", {
    target: "all",
    lines: [speech("みなさん！今週はいよいよLOCALです！準備はできていますか！？")],
    effects: [motivation("up", "all")],
  }),
  conditional("cond_world_week", "WORLDの舞台", "world_tournament_week", {
    target: "all",
    lines: [speech("ついに世界の舞台です！ここまで積み重ねてきたものを出し切りましょう！")],
    effects: [motivation("up", "all"), points(2, "all")],
  }),
  conditional("cond_championship_week", "CHAMPIONSHIP", "championship_week", {
    target: "all",
    lines: [speech("みなさん！最高峰の舞台です！胸を張って行きましょう！")],
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
