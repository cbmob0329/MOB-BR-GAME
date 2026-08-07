/**
 * MOB BR main-screen application shell.
 *
 * Generation 5 scope:
 * - TITLE / NEW GAME / CONTINUE / SETTINGS
 * - HOME / TEAM hub / bottom navigation
 * - common modal, toast, and loading overlay
 * - connection to state.js
 *
 * Training, equipment, shop, collection, room, coach, scout, records, news,
 * ability, and tournament execution remain placeholders for later generations.
 */

import {
  assetPath,
  detectAssetPrefix,
  installAssetFallbacks,
} from "../assets.js";
import {
  fitPortraits,
} from "../portrait-fit.js?v=56";
import {
  SaveError,
  SaveNotFoundError,
  clearPendingEmployeeRankUpsToDraft,
  createGameStateManager,
  grantEmployeeCookingPointsToDraft,
} from "./state.js?v=56";
import {
  applyPlayerStatUpgradePlanToDraft,
  applyTestMaxPlayerBuildToDraft,
  applyWeaponUpgradePlanToDraft,
  calculatePlayerStatUpgradePlan,
  calculateWeaponUpgradePlan,
  changeWeaponSkinToDraft,
  getAbilityAcquisitionState,
  getSelectedPlayerId,
  learnSpecialAbilityToDraft,
  renameWeaponToDraft,
  renderAbilityUpSection,
  renderAbilityUpgradeNodeModal,
  renderEquipmentSection,
  renderPlayerSelector,
  renderWeaponUpgradeNodeModal,
  renderSkillUpgradeSection,
  renderSpecialAbilitySection,
  renderTeamDetailsSection,
  renamePlayerSkillToDraft,
  upgradePlayerSkillToDraft,
  upgradePlayerStatToDraft,
  upgradeWeaponStatToDraft,
} from "./team.js?v=56";
import {
  getSpecialAbility,
} from "../../data/special-ability-50-data.js?v=56";
import {
  getCompanyRankData,
} from "../../data/game-data.js";
import {
  effectiveCharacterRank,
  motivationDisplay,
} from "../../data/motivation-data.js?v=56";
import {
  getRoomMaster,
} from "../../data/collection-data.js?v=56";
import {
  EMPLOYEE_RULES,
  getEmployeeRankData,
  getTotalEmployeeHpBonus,
} from "../../data/employee-data.js?v=56";
import {
  createManagementController,
  getTournamentWeekStatus,
  renderManagementSection,
} from "./management.js?v=57";
import {
  createTournamentBridgeController,
  renderTournamentSchedule,
} from "./tournament-bridge.js?v=56";

export const APP_VERSION = "mobbr-main-app-4.0.4";

export const ROUTES = Object.freeze({
  title: "title",
  home: "home",
  facility: "facility",
  team: "team",
  train: "train",
  collection: "collection",
  shop: "shop",
  settings: "settings",
  room: "room",
  cooking: "cooking",
  coach: "coach",
  scout: "scout",
  schedule: "schedule",
  equipment: "equipment",
  record: "record",
  news: "news",
  items: "items",
  ability: "ability",
  specialAbility: "specialAbility",
});

const GROWTH_STAT_LABELS = Object.freeze({
  stamina: "スタミナ",
  mind: "精神",
  physical: "フィジカル",
  aim: "エイム",
  agility: "敏捷",
  technique: "技術",
  support: "サポート",
  close: "近距離武器",
  mid: "中距離武器",
  far: "遠距離武器",
  fireRate: "連射性能",
  reload: "リロード",
});

const WEEKLY_EMPLOYEE_MESSAGES = Object.freeze([
  '今週も頑張りましょう！',
  'ショップも見に来てください🎵',
  'エイム、バッチリですか？応援しています！',
  '今週の目標をひとつ決めて進みましょう！',
  'トレーニングの積み重ねが勝利につながります！',
  'バッグのアイテム確認も忘れずに！',
  '武器の調整、今週も丁寧に進めましょう！',
  '選手のみなさん、今日もいい表情です！',
  '焦らず一週間ずつ強くなりましょう！',
  '大会予定を確認して準備しておきましょう！',
  '作戦会議で新しい戦い方を試してみませんか？',
  '今週も企業をしっかり支えていきます！',
  '休むところは休んで、勝負どころで集中です！',
  'コインの使い道は計画的にいきましょう！',
  '特殊能力の解放条件も確認してみてください！',
  'チームの成長、こちらでも実感しています！',
  '今週はどの選手を伸ばしますか？',
  'ショップに新しい発見があるかもしれません！',
  '遠距離・中距離・近距離、全部確認しましょう！',
  '大会では通過ラインの確認を忘れずに！',
  '今週も一緒に会社を大きくしましょう！',
  'パックがあれば開封して戦力を確認しましょう！',
  'モブルームの模様替えも気分転換になりますよ！',
  '今日の一歩がWorldにつながっています！',
  '選手のHPと武器を忘れずに確認してください！',
  'カジュアル大会で調子を見るのもおすすめです！',
  '今週のチームもいい雰囲気です！',
  '能力ポイント、たまっていませんか？',
  '新しい作戦を試す絶好の週かもしれません！',
  '大会前はバッグ編成を見直しましょう！',
  '一戦一戦、経験を積み上げていきましょう！',
  '今週も全力でサポートします！',
  '選手の得意距離を伸ばしてみましょう！',
  '武器強化はCOIN残高と相談してくださいね！',
  'コーチの成長もチーム力につながります！',
  'スカウト情報も時々確認してみてください！',
  'ニュースにライバルの結果が出ているかもしれません！',
  '今週は安定重視でいきますか？攻めますか？',
  '小さな強化でも大会では大きな差になります！',
  'チームラボをいつでも利用してください！',
  '今週の大会も最後まで応援しています！',
  '勝っても負けても、次へつながる一週間です！',
  'アイテムは使うタイミングが大切です！',
  '選手の特殊能力、少し強くなっていますよ！',
  '今週の企業ボーナスを受け取りました！',
  '月間予定も確認しておきましょう！',
  'いい準備が、いい試合を作ります！',
  '今週もモブマイクが大会を盛り上げます！',
  'チームのみなさんへ、今週もよろしくお願いします！',
  '準備完了です。新しい一週間を始めましょう！',
]);

const PINK_GUIDES = Object.freeze({
  home: Object.freeze({
    title: "MOB BRへようこそ",
    text:
      "こちらが企業のHOMEです。育成、ショップ、コレクション、大会予定をここから確認できます。少しずつチームを強くしていきましょう。",
  }),
  facility: Object.freeze({
    title: "施設メニュー",
    text:
      "施設ごとに使える機能がまとまっています。迷った時はTEAM LABから選手育成を確認してみてください。",
  }),
  team: Object.freeze({
    title: "チーム管理",
    text:
      "IGL・ATK・SUPの3選手を確認できます。選手をタップすると、能力や武器の状態を詳しく見られます。",
  }),
  train: Object.freeze({
    title: "トレーニング",
    text:
      "3選手それぞれに練習内容を設定します。大会週は練習できませんので、スケジュールも一緒にご確認ください。",
  }),
  ability: Object.freeze({
    title: "プレイヤー強化",
    text:
      "能力・武器・スキル・特殊能力を選手ごとに強化できます。必要ポイントや次の効果も表示されます。",
  }),
  collection: Object.freeze({
    title: "コレクション",
    text:
      "カード、バッジ、獲得したトロフィーを確認できます。パックを所持している時は、こちらから開封できます。",
  }),
  shop: Object.freeze({
    title: "MOB SHOP",
    text:
      "いらっしゃいませ。アイテム、カードパック、武器スキンをご用意しています。必要なものをゆっくりお選びください。",
  }),
  coach: Object.freeze({
    title: "コーチ",
    text:
      "コーチの成長と作戦会議を管理できます。作戦は大会前に増やしておくと選択肢が広がります。",
  }),
  scout: Object.freeze({
    title: "スカウト",
    text:
      "こちらではコーチをスカウトできます。企業ランクが上がると、候補や利用できる機能が増えていきます。",
  }),
  schedule: Object.freeze({
    title: "大会スケジュール",
    text:
      "MOB BRのプロリーグとデンデンカップを確認できます。現在、カジュアル大会はデンデンカップだけを表示しています。",
  }),
  room: Object.freeze({
    title: "MOB ROOM",
    text:
      "集めたカードやバッジを飾れる企業ルームです。企業ランクが上がると新しい部屋も解放できます。",
  }),
  cooking: Object.freeze({
    title: "MOB DINING",
    text:
      "モブホワイトが毎週3種類の定食をご用意します。選手は1人につき週1回食事でき、能力ポイントを獲得できます。",
  }),
  news: Object.freeze({
    title: "NEWS",
    text:
      "終了した大会の結果を新聞形式で確認できます。出場できなかった大会の結果もこちらへ掲載されます。",
  }),
});

const MANAGEMENT_ROUTES = Object.freeze([
  ROUTES.train,
  ROUTES.collection,
  ROUTES.shop,
  ROUTES.room,
  ROUTES.cooking,
  ROUTES.coach,
  ROUTES.scout,
  ROUTES.record,
  ROUTES.news,
  ROUTES.items,
]);

const ROUTE_META = Object.freeze({
  [ROUTES.home]: {
    title: "HOME",
    description: "企業とチームの現在状況",
    backgroundClass: "screen--home",
    icon: assetPath("menu/home.png"),
  },
  [ROUTES.facility]: {
    title: "FACILITY",
    description: "施設を選択して機能を利用",
    backgroundClass: "screen--sub",
    icon: assetPath("menu/team.png"),
  },
  [ROUTES.team]: {
    title: "TEAM",
    description: "チーム管理ハブ",
    backgroundClass: "screen--team",
    icon: "menu/team.png",
  },
  [ROUTES.train]: {
    title: "TRAINING",
    description: "3選手の1週間トレーニング",
    backgroundClass: "screen--team",
    icon: assetPath("menu/traning.png"),
  },
  [ROUTES.collection]: {
    title: "COLLECTION",
    description: "カード・バッジ・その他コレクション",
    backgroundClass: "screen--collection",
    icon: assetPath("menu/COL.png"),
  },
  [ROUTES.shop]: {
    title: "SHOP",
    description: "アイテム・カードパック・武器スキン",
    backgroundClass: "screen--shop",
    icon: "menu/mobshopt.png",
  },
  [ROUTES.settings]: {
    title: "SETTING",
    description: "音量・演出・表示設定",
    backgroundClass: "screen--coh",
    icon: "menu/setting.png",
  },
  [ROUTES.room]: {
    title: "ROOM",
    description: "コレクションを飾る企業ルーム",
    backgroundClass: "screen--sub",
    icon: "menu/room.png",
  },
  [ROUTES.cooking]: {
    title: "MOB DINING",
    description: "週替わり定食で選手のコンディションを整える",
    backgroundClass: "screen--cooking",
    icon: "icon/white.png",
  },
  [ROUTES.coach]: {
    title: "COACH",
    description: "コーチ管理と作戦会議",
    backgroundClass: "screen--team",
    icon: "menu/coach.png",
  },
  [ROUTES.scout]: {
    title: "SCOUT",
    description: "コーチ専用スカウト",
    backgroundClass: "screen--team",
    icon: "menu/scout.png",
  },
  [ROUTES.schedule]: {
    title: "SCHEDULE",
    description: "年間大会スケジュール",
    backgroundClass: "screen--sub",
    icon: "menu/sc.png",
  },
  [ROUTES.equipment]: {
    title: "EQUIPMENT",
    description: "武器・スキン・持ち込みバッグ",
    backgroundClass: "screen--team",
    icon: "menu/eq.png",
  },
  [ROUTES.record]: {
    title: "RECORD",
    description: "大会・個人・企業の通算記録",
    backgroundClass: "screen--sub",
    icon: "menu/record.png",
  },
  [ROUTES.news]: {
    title: "NEWS",
    description: "大会結果と企業ニュース",
    backgroundClass: "screen--sub",
    icon: "icon/news.png",
  },
  [ROUTES.items]: {
    title: "ITEMS",
    description: "所持アイテムとバッグ編成",
    backgroundClass: "screen--sub",
    icon: "menu/item.png",
  },
  [ROUTES.ability]: {
    title: "PLAYER DEVELOPMENT",
    description: "選手能力と武器をひとつの画面で強化",
    backgroundClass: "screen--team",
    icon: "icon/ab.png",
  },
  [ROUTES.specialAbility]: {
    title: "SPECIAL ABILITY",
    description: "青・金・赤の特殊能力",
    backgroundClass: "screen--team",
    icon: "icon/sp.png",
  },
});

const FACILITY_DEFINITIONS = Object.freeze([
  { facilityId: "team_lab", name: "TEAM LAB", japaneseName: "チームラボ", note: "チーム育成・装備・コレクション", status: "OPEN", accent: "LAB", homeImage: "back/homelabo.png" },
  { facilityId: "mob_shop", name: "MOB SHOP", japaneseName: "MOB SHOP", note: "ショップ・パック・商品購入", status: "OPEN", accent: "SHOP", homeImage: "back/homeshop.png" },
  { facilityId: "cooking", name: "MOB DINING", japaneseName: "食堂", note: "モブホワイトの週替わりセットメニュー", status: "OPEN", accent: "DINING", homeImage: "back/homekit.png" },
  { facilityId: "mob_room", name: "MOB ROOM", japaneseName: "モブルーム", note: "部屋を選択してコレクションを配置", status: "OPEN", accent: "ROOM", homeImage: "back/homeroom.png" },
  { facilityId: "collection", name: "COLLECTION", japaneseName: "コレクション", note: "カード・バッジ・パックファイル", status: "OPEN", accent: "ARCHIVE", homeImage: "back/homecol.png" },
]);

const FACILITY_MENUS = Object.freeze({
  team_lab: Object.freeze([
    { route: ROUTES.team, name: "TEAM", note: "選手ステータス", icon: "menu/team.png" },
    { route: ROUTES.train, name: "TRAINING", note: "週間育成", icon: "menu/traning.png" },
    { route: ROUTES.ability, name: "ABILITY", note: "選手能力を強化", icon: "icon/ab.png" },
    { route: ROUTES.equipment, name: "WEAPON", note: "武器能力を強化", icon: "icon/weponup.png" },
    { route: ROUTES.ability, name: "SKILL", note: "スキルを強化", icon: "icon/skillup.png" },
    { route: ROUTES.specialAbility, name: "SPECIAL", note: "特殊能力", icon: "icon/sp.png" },
    { route: ROUTES.collection, name: "COLLECTION", note: "カード・バッジ", icon: "menu/COL.png" },
    { route: ROUTES.coach, name: "COACH", note: "作戦会議", icon: "menu/coach.png" },
    { route: ROUTES.scout, name: "SCOUT", note: "コーチ獲得", icon: "menu/scout.png" },
    { route: ROUTES.items, name: "ITEMS", note: "所持品", icon: "menu/item.png" },
    { route: ROUTES.record, name: "RECORD", note: "通算記録", icon: "menu/record.png" },
    { route: ROUTES.news, name: "NEWS", note: "大会新聞", icon: "icon/news.png" },
    { route: ROUTES.schedule, name: "SCHEDULE", note: "大会予定", icon: "menu/sc.png" },
  ]),
  mob_shop: Object.freeze([
    { route: ROUTES.shop, name: "MOB SHOP", note: "商品カテゴリを開く", icon: "menu/mobshopt.png" },
  ]),
  cooking: Object.freeze([
    { route: ROUTES.cooking, name: "MOB DINING", note: "週替わり定食", icon: "icon/white.png" },
  ]),
  mob_room: Object.freeze([
    { route: ROUTES.room, name: "ROOM SELECT", note: "部屋を選択・編集", icon: "menu/room.png" },
  ]),
});

const TEAM_MENU = Object.freeze([
  {
    route: ROUTES.schedule,
    name: "Schedule",
    note: "大会予定",
    icon: "menu/sc.png",
  },
  {
    route: ROUTES.train,
    name: "Training",
    note: "週間育成",
    icon: "menu/traning.png",
  },
  {
    route: ROUTES.record,
    name: "Record",
    note: "通算記録",
    icon: "menu/record.png",
  },
  {
    route: ROUTES.news,
    name: "News",
    note: "大会ニュース",
    icon: "icon/news.png",
  },
  {
    route: ROUTES.items,
    name: "Items",
    note: "所持アイテム",
    icon: "menu/item.png",
  },
  {
    route: ROUTES.ability,
    name: "Development",
    note: "能力・武器強化",
    icon: "icon/ab.png",
  },
  {
    route: ROUTES.specialAbility,
    name: "Special Ability",
    note: "特殊能力",
    icon: "icon/sp.png",
  },
]);

const BOTTOM_NAV = Object.freeze([
  { route: ROUTES.home, name: "HOME", icon: "menu/home.png" },
  { route: ROUTES.train, name: "TRAINING", icon: "menu/traning.png" },
  { route: ROUTES.schedule, name: "SCHEDULE", icon: "menu/sc.png" },
  { route: ROUTES.team, name: "TEAM", icon: "menu/team.png" },
  { route: ROUTES.settings, name: "SET", icon: "menu/setting.png" },
]);

const NEW_GAME_STEPS = Object.freeze([
  {
    key: "companyBaseName",
    title: "企業名を決める",
    description:
      "入力した名前の前に「MOB BR」が付き、正式企業名になります。",
    label: "企業名のベース名",
    placeholder: "例：STORY",
    maximumLength: 50,
  },
  {
    key: "IGL",
    group: "playerNames",
    title: "IGL名を決める",
    description: "チームを指揮するIGL選手の名前を入力してください。",
    label: "IGL選手名",
    placeholder: "IGL選手名",
    maximumLength: 50,
  },
  {
    key: "ATK",
    group: "playerNames",
    title: "ATK名を決める",
    description: "攻撃を担うATK選手の名前を入力してください。",
    label: "ATK選手名",
    placeholder: "ATK選手名",
    maximumLength: 50,
  },
  {
    key: "SUP",
    group: "playerNames",
    title: "SUP名を決める",
    description: "回復と復活を担うSUP選手の名前を入力してください。",
    label: "SUP選手名",
    placeholder: "SUP選手名",
    maximumLength: 50,
  },
  {
    key: "IGL",
    group: "weaponNames",
    title: "IGL武器名を決める",
    description: "初期スキンはエメラルドガンです。",
    label: "IGL武器名",
    placeholder: "エメラルドガン",
    maximumLength: 60,
  },
  {
    key: "ATK",
    group: "weaponNames",
    title: "ATK武器名を決める",
    description: "初期スキンはグリーンバッシュです。",
    label: "ATK武器名",
    placeholder: "グリーンバッシュ",
    maximumLength: 60,
  },
  {
    key: "SUP",
    group: "weaponNames",
    title: "SUP武器名を決める",
    description: "初期スキンはパープルバレットです。",
    label: "SUP武器名",
    placeholder: "パープルバレット",
    maximumLength: 60,
  },
  {
    key: "complete",
    title: "セットアップ完了",
    description:
      "キャラクターを育ててチャンピオンシップを目指しましょう！",
  },
]);

function formatNumber(value) {
  return new Intl.NumberFormat("ja-JP").format(value);
}

export function formatGameDate(gameDate) {
  return `${gameDate.year}年 ${gameDate.month}月 第${gameDate.week}週`;
}

export function getRouteBackgroundClass(route) {
  return ROUTE_META[route]?.backgroundClass ?? "screen--sub";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function getErrorCode(error) {
  return error?.code ?? error?.name ?? "UNKNOWN_ERROR";
}

function createInitialWizardData() {
  return {
    companyBaseName: "",
    playerNames: {
      IGL: "",
      ATK: "",
      SUP: "",
    },
    weaponNames: {
      IGL: "エメラルドガン",
      ATK: "グリーンバッシュ",
      SUP: "パープルバレット",
    },
  };
}

function menuCardTemplate(item, wide = false) {
  return `
    <button
      type="button"
      class="menu-card${wide ? " menu-card--wide" : ""}"
      data-action="navigate"
      data-route="${escapeAttribute(item.route)}"
    >
      <img
        class="menu-card__icon"
        src="${escapeAttribute(item.icon)}"
        alt=""
        aria-hidden="true"
      >
      <span class="menu-card__name">${escapeHtml(item.name)}</span>
      <span class="menu-card__note">${escapeHtml(item.note)}</span>
    </button>
  `;
}

function motivationBadgeTemplate(record, className = "") {
  const display = motivationDisplay(record);
  return `
    <span class="motivation-badge motivation-badge--${escapeAttribute(display.id)} ${escapeAttribute(className)}">
      <b>${escapeHtml(display.mark)}</b>
      <em>${escapeHtml(display.name)}</em>
      <small>${escapeHtml(display.modifierLabel)}</small>
    </span>
  `;
}

function playerEffectiveRank(player) {
  return effectiveCharacterRank(
    player.characterRank,
    player.motivation,
  );
}

function employeeHpBonus(snapshot) {
  return getTotalEmployeeHpBonus(
    snapshot?.employees ?? [],
  );
}

function playerEffectiveHp(snapshot, player) {
  const baseMaxHp =
    Math.max(
      1,
      Number(player.maxHp) || 1,
    );
  const baseCurrentHp =
    Math.max(
      0,
      Math.min(
        baseMaxHp,
        Number(player.currentHp) || 0,
      ),
    );
  const bonus =
    employeeHpBonus(snapshot);
  const maxHp =
    baseMaxHp + bonus;
  const hpRate =
    baseCurrentHp / baseMaxHp;
  return {
    bonus,
    maxHp,
    currentHp:
      baseCurrentHp <= 0
        ? 0
        : Math.max(
            1,
            Math.round(
              maxHp * hpRate,
            ),
          ),
  };
}

function playerRowTemplate(player) {
  return `
    <button type="button" class="player-row player-row--tap" data-action="inspect-team-player" data-player-id="${escapeAttribute(player.playerId)}">
      <img
        class="player-row__image"
        data-role="${escapeAttribute(player.role)}"
        src="${escapeAttribute(player.image)}"
        alt="${escapeAttribute(player.name)}"
      >
      <div class="player-row__main">
        <div class="player-row__name">${escapeHtml(player.name)}</div>
        <div class="player-row__weapon">
          ${escapeHtml(player.weapon.weaponName)} /
          ${escapeHtml(player.characterRank)} → ${escapeHtml(playerEffectiveRank(player))}
        </div>
        ${motivationBadgeTemplate(player.motivation, "motivation-badge--row")}
      </div>
      <span class="role-badge">${escapeHtml(player.role)}</span>
      <span class="player-row__tap">TAP</span>
    </button>
  `;
}

function individualWeaponProfileTemplate(
  player,
) {
  const stats = [
    ["CLOSE", player.weapon.rangeRanks.close],
    ["MID", player.weapon.rangeRanks.mid],
    ["FAR", player.weapon.rangeRanks.far],
    ["FIRE", player.weapon.fireRateRank],
    ["RELOAD", player.weapon.reloadRank],
  ];
  return `
    <article class="individual-weapon-profile">
      <header>
        <img src="${escapeAttribute(player.weapon.image)}" alt="">
        <div>
          <span>${escapeHtml(player.role)} / PERSONAL WEAPON</span>
          <strong>${escapeHtml(player.weapon.weaponName)}</strong>
          <small>${escapeHtml(player.name)}専用能力</small>
        </div>
      </header>
      <div class="individual-weapon-profile__stats">
        ${stats.map(([label, rank]) => `
          <span><small>${label}</small><strong>${escapeHtml(rank)}</strong></span>
        `).join("")}
      </div>
      <button
        type="button"
        data-action="open-player-weapon"
        data-player-id="${escapeAttribute(player.playerId)}"
      >
        この選手の武器を強化
      </button>
    </article>
  `;
}

function topStatusTemplate(snapshot) {
  const rankData =
    getCompanyRankData(
      snapshot.company.rank,
    );
  const expToNext =
    rankData.expToNext;
  const remaining =
    expToNext === null
      ? 0
      : Math.max(
          0,
          expToNext -
          snapshot.company.exp,
        );
  const progress =
    expToNext === null
      ? 100
      : Math.max(
          0,
          Math.min(
            100,
            snapshot.company.exp /
              expToNext *
              100,
          ),
        );

  return `
    <header class="top-status">
      <div class="top-status__panel">
        <div class="top-status__line">
          <div class="top-status__company">
            <img
              class="top-status__company-logo"
              src="${escapeAttribute(snapshot.company.badgeImage)}"
              alt=""
            >
            <div class="top-status__company-main">
              <div>
                <span>${escapeHtml(snapshot.company.companyName)}</span>
                <b>
                  <img src="icon/kigyo.png" alt="">
                  ${escapeHtml(snapshot.company.rank)}
                </b>
              </div>
              <div class="company-rank-mini-progress">
                <i>
                  <span style="width:${progress.toFixed(2)}%"></span>
                </i>
                <small>
                  ${
                    expToNext === null
                      ? "MAX RANK"
                      : `NEXT ${escapeHtml(rankData.nextRank)} / あと${formatNumber(remaining)} PT`
                  }
                </small>
              </div>
            </div>
          </div>
          <div class="top-status__date">
            ${escapeHtml(formatGameDate(snapshot.gameDate))}
          </div>
        </div>
        <div class="resource-list" aria-label="所持通貨">
          <div class="resource-chip">
            <img src="${escapeAttribute(assetPath("icon/coin.png"))}" alt="">
            <span class="resource-chip__value">
              ${formatNumber(snapshot.resources.coin)}
            </span>
          </div>
          <div class="resource-chip">
            <img src="${escapeAttribute(assetPath("icon/daia.png"))}" alt="">
            <span class="resource-chip__value">
              ${formatNumber(snapshot.resources.diamond)}
            </span>
          </div>
          <div class="resource-chip">
            <img src="${escapeAttribute(assetPath("icon/rubi.png"))}" alt="">
            <span class="resource-chip__value">
              ${formatNumber(snapshot.resources.ruby)}
            </span>
          </div>
        </div>
      </div>
    </header>
  `;
}

function bottomNavTemplate(currentRoute) {
  return `
    <nav class="bottom-nav" aria-label="メインナビゲーション">
      <div class="bottom-nav__inner">
        ${BOTTOM_NAV.map(
          (item) => `
            <button
              type="button"
              class="nav-button"
              data-action="navigate"
              data-route="${escapeAttribute(item.route)}"
              ${
                currentRoute === item.route
                  ? 'aria-current="page"'
                  : ""
              }
            >
              <img src="${escapeAttribute(item.icon)}" alt="">
              <span>${escapeHtml(item.name)}</span>
            </button>
          `,
        ).join("")}
      </div>
    </nav>
  `;
}

function titleTemplate(hasSave, saveSummary = null) {
  const saveStatus = hasSave && saveSummary
    ? `${saveSummary.company.companyName} / ${formatGameDate(saveSummary.gameDate)}`
    : "セーブデータはありません";

  return `
    <main class="screen screen--title title-screen">
      <section class="title-card" aria-labelledby="gameTitle">
        <p class="title-card__eyebrow">MOB BR PROJECT</p>
        <h1 id="gameTitle" class="title-card__title">MOB BR</h1>
        <p class="title-card__subtitle">ALL PLAYERS ARE THE STORY</p>

        <div class="title-actions">
          <button
            type="button"
            class="primary-button"
            data-action="new-game"
          >
            NEW GAME
          </button>
          <button
            type="button"
            class="secondary-button"
            data-action="continue"
            ${hasSave ? "" : "disabled"}
          >
            CONTINUE
          </button>
          <button
            type="button"
            class="secondary-button"
            data-action="open-settings"
          >
            SETTINGS
          </button>
        </div>

        <p class="title-card__save-status">${escapeHtml(saveStatus)}</p>
      </section>
    </main>
  `;
}

function homeRoomStageTemplate(
  snapshot,
  {
    preview = false,
  } = {},
) {
  const homeRoomId =
    snapshot.company.homeRoomId ??
    snapshot.company.activeRoomId;
  const homeRoom =
    getRoomMaster(homeRoomId);
  const homeLayout =
    snapshot.collections.roomLayouts?.[
      homeRoomId
    ] ?? [];

  return `
    <div
      class="home-room-stage ${preview ? "is-preview" : ""}"
      aria-hidden="${preview ? "false" : "true"}"
    >
      <img
        class="home-room-stage__background"
        src="${escapeAttribute(homeRoom.image)}"
        alt=""
      >
      <div class="home-room-stage__placements">
        ${homeLayout
          .slice()
          .sort(
            (left, right) =>
              (left.z ?? 0) -
              (right.z ?? 0),
          )
          .map(
            (placement) => `
              <img
                src="${escapeAttribute(placement.image)}"
                alt=""
                style="
                  left:${placement.x}%;
                  top:${placement.y}%;
                  z-index:${placement.z};
                  --home-placement-scale:${placement.scale};
                  --home-placement-flip:${placement.flipped ? -1 : 1};
                "
              >
            `,
          )
          .join("")}
      </div>
      ${
        preview
          ? ""
          : `<div class="home-room-stage__shade"></div>`
      }
    </div>
  `;
}

function homeRoomPreviewTemplate(
  snapshot,
) {
  return `
    <main class="screen home-room-preview-screen">
      ${homeRoomStageTemplate(
        snapshot,
        {
          preview: true,
        },
      )}
      <button
        type="button"
        class="home-room-preview-dismiss"
        data-action="close-home-room-preview"
        aria-label="HOMEへ戻る"
      ></button>
    </main>
  `;
}

function homeTemplate(snapshot, currentRoute) {
  const tournamentWeek = getTournamentWeekStatus(snapshot);
  const tournamentNotice = "";

  return `
    <main
      class="screen screen--home app-layout has-home-room"
    >
      ${homeRoomStageTemplate(snapshot)}
      ${topStatusTemplate(snapshot)}
      <div class="page-content home-facility-only ${tournamentWeek.hasTournament ? "has-tournament-notice" : ""}">
        <nav class="home-quick-actions" aria-label="HOMEショートカット">
          <button
            type="button"
            data-action="navigate"
            data-route="${ROUTES.news}"
          >
            <img src="icon/news.png" alt="">
            <span>新聞</span>
          </button>
          <button
            type="button"
            data-action="open-home-room-preview"
          >
            <img src="menu/room.png" alt="">
            <span>部屋を見る</span>
          </button>
          ${tournamentWeek.hasTournament ? `
            <button type="button" data-action="navigate" data-route="${ROUTES.schedule}">
              <img src="menu/sc.png" alt="">
              <span>大会日</span>
            </button>
          ` : ""}
        </nav>
        ${tournamentNotice}
        <section class="home-facility-grid" aria-label="施設一覧">
          ${FACILITY_DEFINITIONS.map((facility) => `
            <button
              type="button"
              class="home-facility-image ${facility.status === "LOCKED" ? "is-locked" : ""}"
              data-action="open-facility"
              data-facility-id="${escapeAttribute(facility.facilityId)}"
              ${facility.status === "LOCKED" ? "disabled" : ""}
            >
              <img src="${escapeAttribute(facility.homeImage)}" alt="">
              <span>${escapeHtml(facility.japaneseName)}</span>
              ${facility.status === "LOCKED" ? "<em>LOCKED</em>" : ""}
            </button>
          `).join("")}
        </section>

        <section class="home-employee-zone" aria-label="従業員">
          <header>
            <span>MOB STAFF</span>
            <strong>TEAM HP +${formatNumber(employeeHpBonus(snapshot))}</strong>
          </header>
          <div class="home-employee-zone__stage">
            ${(snapshot.employees ?? []).map((employee, index) => `
              <button
                type="button"
                class="home-employee home-employee--${index % 2 === 0 ? "forward" : "reverse"}"
                style="--employee-delay:${index * -2.7}s"
                data-action="inspect-employee"
                data-employee-id="${escapeAttribute(employee.employeeId)}"
                aria-label="${escapeAttribute(employee.name)} ${escapeAttribute(employee.rank)}"
              >
                <img src="${escapeAttribute(employee.image)}" alt="">
                <span>${escapeHtml(employee.rank)}</span>
              </button>
            `).join("")}
          </div>
          <small>従業員をタップするとランクと従業員ポイントを確認できます</small>
        </section>
      </div>
      ${bottomNavTemplate(currentRoute)}
    </main>
  `;
}

function facilityTemplate(
  snapshot,
  currentRoute,
  selectedFacilityId,
) {
  const selected =
    FACILITY_DEFINITIONS.find(
      (facility) =>
        facility.facilityId === selectedFacilityId,
    ) ?? FACILITY_DEFINITIONS[0];
  const menu =
    FACILITY_MENUS[selected.facilityId] ?? [];

  return `
    <main class="screen screen--sub app-layout">
      ${topStatusTemplate(snapshot)}
      <div class="page-content facility-menu-page facility-menu-page--${escapeAttribute(selected.facilityId)}">
        <section class="facility-entrance-stage">
          <div class="facility-entrance-stage__lights" aria-hidden="true">
            <i></i><i></i><i></i>
          </div>
          <span>${escapeHtml(selected.accent)} FACILITY</span>
          <h1>${escapeHtml(selected.japaneseName)}</h1>
          <p>${escapeHtml(selected.note)}</p>
          <div class="facility-entrance-stage__status">
            <b>${selected.status === "LOCKED" ? "OFFLINE" : "SYSTEM ONLINE"}</b>
            <em>${escapeHtml(selected.name)}</em>
          </div>
        </section>
        ${
          selected.status === "LOCKED"
            ? `<section class="facility-locked-panel"><strong>LOCKED</strong><p>食材・料理・調理器具の基盤を準備しました。調理場の操作機能は次の更新で解放します。</p></section>`
            : selected.facilityId === "team_lab"
              ? `
                <section class="team-lab-orbit" aria-label="チームラボ機能">
                  <div class="team-lab-orbit__rings" aria-hidden="true"><i></i><i></i><i></i></div>
                  <div class="team-lab-orbit__core">
                    <img src="menu/team.png" alt="">
                    <span>TEAM LAB</span>
                    <strong>SELECT APP</strong>
                  </div>
                  <div class="team-lab-orbit__apps" style="--app-count:${menu.length}">
                    ${menu.map((item, index) => `
                      <button
                        type="button"
                        class="team-lab-orbit__app"
                        style="--app-index:${index}"
                        data-action="navigate"
                        data-route="${escapeAttribute(item.route)}"
                      >
                        <img src="${escapeAttribute(item.icon)}" alt="">
                        <span>${escapeHtml(item.name)}</span>
                      </button>
                    `).join("")}
                  </div>
                </section>
              `
              : `<section class="facility-menu-grid">${menu.map((item) => menuCardTemplate(item)).join("")}</section>`
        }
      </div>
      ${bottomNavTemplate(currentRoute)}
    </main>
  `;
}

function teamTemplate(snapshot, currentRoute) {
  return `
    <main class="screen screen--sub app-layout">
      ${topStatusTemplate(snapshot)}
      <div class="page-content">
        <div class="back-row">
          <button
            type="button"
            class="back-button"
            data-action="navigate"
            data-route="${ROUTES.home}"
          >
            ← HOME
          </button>
        </div>

        <section class="team-compact-heading">
          <span>TEAM MEMBERS</span>
          <strong>${escapeHtml(snapshot.playerTeam.teamName)}</strong>
          <small>選手をタップすると詳細を表示します / 従業員効果 TEAM HP +${formatNumber(employeeHpBonus(snapshot))}</small>
        </section>

        <section class="team-menu-deck" aria-label="TEAM MENU">
          <header>
            <span>TEAM MENU</span>
            <small>左右へスワイプ</small>
          </header>
          <nav class="team-menu-deck__track">
            ${TEAM_MENU.map((item, index) => `
              <button
                type="button"
                class="team-menu-deck__item"
                style="--team-menu-index:${index}"
                data-action="navigate"
                data-route="${escapeAttribute(item.route)}"
                aria-label="${escapeAttribute(item.name)}"
                title="${escapeAttribute(item.name)}"
              >
                <i aria-hidden="true"></i>
                <img src="${escapeAttribute(item.icon)}" alt="">
              </button>
            `).join("")}
          </nav>
        </section>

        <section class="team-portrait-grid">
          ${snapshot.playerTeam.members.map((player) => `
            <button
              type="button"
              class="team-portrait-button"
              data-action="inspect-team-player"
              data-player-id="${escapeAttribute(player.playerId)}"
            >
              <img
                src="${escapeAttribute(player.image)}"
                data-role="${escapeAttribute(player.role)}"
                alt=""
              >
              <span>${escapeHtml(player.role)}</span>
              <strong>${escapeHtml(player.name)}</strong>
              ${motivationBadgeTemplate(player.motivation, "motivation-badge--team")}
              <small>${escapeHtml(player.characterRank)} → ${escapeHtml(playerEffectiveRank(player))}</small>
              <em>TAP</em>
            </button>
          `).join("")}
        </section>

        <section class="team-personal-weapons">
          <header>
            <span>PERSONAL WEAPON STATUS</span>
            <strong>3人の武器能力は個別管理</strong>
          </header>
          <div>
            ${snapshot.playerTeam.members.map((player) =>
              individualWeaponProfileTemplate(player)
            ).join("")}
          </div>
        </section>
      </div>
      ${bottomNavTemplate(currentRoute)}
    </main>
  `;
}

function settingsTemplate(snapshot, currentRoute, fromTitle = false) {
  const settings = snapshot?.settings ?? {
    soundEnabled: true,
    reducedMotion: false,
    autoAdvanceOpening: false,
    commentarySpeed: 1,
    testMode: false,
  };

  return `
    <main class="screen screen--coh ${fromTitle ? "" : "app-layout"}">
      ${fromTitle ? "" : topStatusTemplate(snapshot)}
      <div class="page-content">
        <div class="back-row">
          <button
            type="button"
            class="back-button"
            data-action="${fromTitle ? "return-title" : "navigate"}"
            ${fromTitle ? "" : `data-route="${ROUTES.home}"`}
          >
            ← ${fromTitle ? "TITLE" : "HOME"}
          </button>
        </div>

        <section class="hero-panel">
          <p class="hero-panel__label">SYSTEM SETTINGS</p>
          <h1 class="hero-panel__title">SETTING</h1>
          <p class="placeholder-panel__text">
            設定はセーブデータがある場合だけ保存されます。
          </p>
        </section>

        <form class="content-panel settings-list" data-form="settings">
          <div class="setting-row">
            <div>
              <div class="setting-row__label">サウンド</div>
              <div class="setting-row__note">BGMとSEの有効・無効</div>
            </div>
            <label class="toggle">
              <input
                type="checkbox"
                name="soundEnabled"
                ${settings.soundEnabled ? "checked" : ""}
              >
              <span aria-hidden="true"></span>
            </label>
          </div>

          <div class="setting-row">
            <div>
              <div class="setting-row__label">動きを減らす</div>
              <div class="setting-row__note">大きな演出を簡略化</div>
            </div>
            <label class="toggle">
              <input
                type="checkbox"
                name="reducedMotion"
                ${settings.reducedMotion ? "checked" : ""}
              >
              <span aria-hidden="true"></span>
            </label>
          </div>

          <div class="setting-row">
            <div>
              <div class="setting-row__label">オープニング自動進行</div>
              <div class="setting-row__note">大会オープニングの進行設定</div>
            </div>
            <label class="toggle">
              <input
                type="checkbox"
                name="autoAdvanceOpening"
                ${settings.autoAdvanceOpening ? "checked" : ""}
              >
              <span aria-hidden="true"></span>
            </label>
          </div>

          <div class="form-field">
            <label for="commentarySpeed">実況速度</label>
            <select id="commentarySpeed" name="commentarySpeed">
              <option value="0.75" ${settings.commentarySpeed === 0.75 ? "selected" : ""}>
                ゆっくり
              </option>
              <option value="1" ${settings.commentarySpeed === 1 ? "selected" : ""}>
                標準
              </option>
              <option value="1.25" ${settings.commentarySpeed === 1.25 ? "selected" : ""}>
                速い
              </option>
            </select>
          </div>

          <section class="test-mode-setting ${settings.testMode ? "is-active" : ""}">
            <div>
              <strong>TEST MODE</strong>
              <span>${settings.testMode ? "有効：通貨・ポイント・週送りを自由に操作できます" : "認証コードを入力すると有効になります"}</span>
            </div>
            <input type="password" inputmode="numeric" name="testModeCode" maxlength="4" placeholder="認証コード">
            ${settings.testMode ? `
              <div class="test-mode-actions">
                <button type="button" data-action="test-grant-resources">通貨を補充</button>
                <button type="button" data-action="test-grant-points">全選手PT補充</button>
                <button type="button" data-action="test-max-player-build">選手・武器・スキルMAX</button>
                <button type="button" data-action="test-employee-points">従業員 従業員PT+25</button>
                <button type="button" data-action="test-advance-week" data-weeks="1">+1週</button>
                <button type="button" data-action="test-advance-week" data-weeks="4">+4週</button>
                <button type="button" data-action="test-advance-week" data-weeks="12">+12週</button>
              </div>
            ` : ""}
          </section>

          <button type="submit" class="primary-button">
            設定を保存
          </button>
        </form>
      </div>
      ${fromTitle ? "" : bottomNavTemplate(currentRoute)}
    </main>
  `;
}

function renderPlayerSelectorForDevelopment(
  snapshot,
  selectedPlayerId,
) {
  return renderPlayerSelector(
    snapshot,
    selectedPlayerId,
  );
}


function teamFeatureTemplate(
  snapshot,
  route,
  currentRoute,
  {
    selectedPlayerId = null,
    abilityColor = "blue",
    abilityPlan = {},
    weaponPlan = {},
    developmentMode = "ability",
  } = {},
) {
  const meta = ROUTE_META[route];
  const playerId = getSelectedPlayerId(snapshot, selectedPlayerId);
  let content = "";

  if (route === ROUTES.ability) {
    const activeDevelopmentMode =
      ["ability", "weapon", "skill", "special"].includes(developmentMode)
        ? developmentMode
        : "ability";
    content = `
      <section class="development-workspace" data-live-section="development">
        ${renderPlayerSelectorForDevelopment(snapshot, playerId)}
        <nav class="development-tabs" aria-label="育成カテゴリ">
          <button
            type="button"
            class="${activeDevelopmentMode === "ability" ? "is-active" : ""}"
            data-action="select-development-tab"
            data-development-tab="ability"
          >
            <img src="icon/ab.png" alt="">
            <span>PLAYER</span>
            <strong>能力アップ</strong>
          </button>
          <button
            type="button"
            class="${activeDevelopmentMode === "weapon" ? "is-active" : ""}"
            data-action="select-development-tab"
            data-development-tab="weapon"
          >
            <img src="menu/eq.png" alt="">
            <span>WEAPON</span>
            <strong>武器強化</strong>
          </button>
          <button
            type="button"
            class="${activeDevelopmentMode === "skill" ? "is-active" : ""}"
            data-action="select-development-tab"
            data-development-tab="skill"
          >
            <img src="icon/sp.png" alt="">
            <span>SKILL</span>
            <strong>スキル強化</strong>
          </button>
          <button
            type="button"
            class="${activeDevelopmentMode === "special" ? "is-active" : ""}"
            data-action="select-development-tab"
            data-development-tab="special"
          >
            <img src="icon/sp.png" alt="">
            <span>SPECIAL</span>
            <strong>特殊能力</strong>
          </button>
        </nav>
        <div class="development-body" data-development-body>
          ${
            activeDevelopmentMode === "ability"
              ? renderAbilityUpSection(
                  snapshot,
                  playerId,
                  abilityPlan,
                  { includeSelector: false },
                )
              : activeDevelopmentMode === "weapon"
                ? renderEquipmentSection(
                    snapshot,
                    playerId,
                    weaponPlan,
                    { includeSelector: false },
                  )
                : activeDevelopmentMode === "skill"
                  ? renderSkillUpgradeSection(
                      snapshot,
                      playerId,
                      { includeSelector: false },
                    )
                  : renderSpecialAbilitySection(
                      snapshot,
                      playerId,
                      abilityColor,
                      { includeSelector: false },
                    )
          }
        </div>
      </section>
    `;
  } else if (route === ROUTES.specialAbility) {
    content = renderSpecialAbilitySection(
      snapshot,
      playerId,
      abilityColor,
    );
  }

  return `
    <main class="screen ${escapeAttribute(meta.backgroundClass)} app-layout">
      ${topStatusTemplate(snapshot)}
      <div class="page-content">
        <div class="back-row">
          <button
            type="button"
            class="back-button"
            data-action="navigate"
            data-route="${ROUTES.team}"
          >
            ← TEAM
          </button>
        </div>

        <section class="feature-command-header">
          <img src="${escapeAttribute(meta.icon)}" alt="">
          <div>
            <span>TEAM LAB / PLAYER SYSTEM</span>
            <h1>${escapeHtml(meta.title)}</h1>
            <p>${escapeHtml(meta.description)}</p>
          </div>
          <em>ONLINE</em>
        </section>

        ${content}
      </div>
      ${bottomNavTemplate(currentRoute)}
    </main>
  `;
}

function managementFeatureTemplate(snapshot, route, currentRoute) {
  const meta = ROUTE_META[route];
  const parentFacility = route === ROUTES.shop
    ? "mob_shop"
    : route === ROUTES.room
      ? "mob_room"
      : route === ROUTES.cooking
        ? "cooking"
        : "team_lab";
  return `
    <main class="screen ${escapeAttribute(meta.backgroundClass)} app-layout">
      ${topStatusTemplate(snapshot)}
      <div class="page-content">
        <div class="back-row">
          ${route === ROUTES.cooking
            ? `<button type="button" class="back-button" data-action="navigate" data-route="${ROUTES.home}">← HOME</button>`
            : `<button type="button" class="back-button" data-action="show-facility-menu" data-facility-id="${parentFacility}">← FACILITY</button>`}
        </div>
        ${
          route === ROUTES.shop ||
          route === ROUTES.cooking
            ? ""
            : `
              <section class="management-command-bar management-command-bar--${escapeAttribute(route)}">
                <img src="${escapeAttribute(meta.icon)}" alt="">
                <div>
                  <span>COMPANY APPLICATION</span>
                  <h1>${escapeHtml(meta.title)}</h1>
                  <p>${escapeHtml(meta.description)}</p>
                </div>
                <em>READY</em>
              </section>
            `
        }
        <section class="management-app-content management-app-content--${escapeAttribute(route)}">
          ${renderManagementSection(snapshot, route)}
        </section>
      </div>
      ${bottomNavTemplate(currentRoute)}
    </main>
  `;
}

function tournamentScheduleTemplate(
  snapshot,
  currentRoute,
  storage,
) {
  const meta = ROUTE_META[ROUTES.schedule];
  return `
    <main class="screen ${escapeAttribute(meta.backgroundClass)} app-layout">
      ${topStatusTemplate(snapshot)}
      <div class="page-content">
        <div class="back-row">
          <button
            type="button"
            class="back-button"
            data-action="navigate"
            data-route="${ROUTES.team}"
          >
            ← TEAM
          </button>
        </div>
        <section class="hero-panel">
          <p class="hero-panel__label">TOURNAMENT ENTRY</p>
          <h1 class="hero-panel__title">${escapeHtml(meta.title)}</h1>
          <p class="placeholder-panel__text">
            ${escapeHtml(meta.description)}
          </p>
        </section>
        ${renderTournamentSchedule(snapshot, storage)}
      </div>
      ${bottomNavTemplate(currentRoute)}
    </main>
  `;
}

function placeholderTemplate(snapshot, route, currentRoute) {
  const meta = ROUTE_META[route] ?? {
    title: route.toUpperCase(),
    description: "今後の工程で実装します。",
    icon: "icon/back.png",
    backgroundClass: "screen--sub",
  };

  const parentRoute = [
    ROUTES.schedule,
    ROUTES.equipment,
    ROUTES.record,
    ROUTES.news,
    ROUTES.items,
    ROUTES.ability,
    ROUTES.specialAbility,
  ].includes(route)
    ? ROUTES.team
    : ROUTES.home;

  return `
    <main class="screen ${escapeAttribute(meta.backgroundClass)} app-layout">
      ${topStatusTemplate(snapshot)}
      <div class="page-content">
        <div class="back-row">
          <button
            type="button"
            class="back-button"
            data-action="navigate"
            data-route="${escapeAttribute(parentRoute)}"
          >
            ← ${parentRoute === ROUTES.team ? "TEAM" : "HOME"}
          </button>
        </div>

        <section class="content-panel placeholder-panel">
          <img
            class="placeholder-panel__icon"
            src="${escapeAttribute(meta.icon)}"
            alt=""
          >
          <h1 class="placeholder-panel__title">
            ${escapeHtml(meta.title)}
          </h1>
          <p class="placeholder-panel__text">
            ${escapeHtml(meta.description)}
          </p>
          <p class="placeholder-panel__text">
            この入口は生成5で接続済みです。本機能は制作進行表の対応工程で実装します。
          </p>
        </section>
      </div>
      ${bottomNavTemplate(currentRoute)}
    </main>
  `;
}

function wizardTemplate(stepIndex, data, errorMessage = "") {
  const step = NEW_GAME_STEPS[stepIndex];
  const isComplete = step.key === "complete";
  const currentValue = step.group
    ? data[step.group][step.key]
    : data[step.key] ?? "";

  return `
    <main class="screen screen--coh wizard-shell">
      <section class="wizard-card">
        <div class="wizard-progress" aria-label="セットアップ進行">
          ${NEW_GAME_STEPS.map(
            (_, index) =>
              `<span class="${index <= stepIndex ? "is-active" : ""}"></span>`,
          ).join("")}
        </div>

        <p class="wizard-card__step">
          STEP ${stepIndex + 1} / ${NEW_GAME_STEPS.length}
        </p>
        <h1 class="wizard-card__title">${escapeHtml(step.title)}</h1>
        <p class="wizard-card__description">
          ${escapeHtml(step.description)}
        </p>

        ${
          isComplete
            ? `
              <section class="content-panel">
                <p>
                  正式企業名：
                  <strong>MOB BR ${escapeHtml(data.companyBaseName)}</strong>
                </p>
                <p>
                  IGL：${escapeHtml(data.playerNames.IGL)}<br>
                  ATK：${escapeHtml(data.playerNames.ATK)}<br>
                  SUP：${escapeHtml(data.playerNames.SUP)}
                </p>
              </section>
            `
            : `
              <form data-form="wizard-step">
                <div class="form-field">
                  <label for="wizardInput">${escapeHtml(step.label)}</label>
                  <input
                    id="wizardInput"
                    name="wizardInput"
                    type="text"
                    maxlength="${step.maximumLength}"
                    value="${escapeAttribute(currentValue)}"
                    placeholder="${escapeAttribute(step.placeholder)}"
                    autocomplete="off"
                    required
                  >
                </div>
                <p class="form-error">${escapeHtml(errorMessage)}</p>
              </form>
            `
        }

        <div class="wizard-actions">
          <button
            type="button"
            class="secondary-button"
            data-action="${stepIndex === 0 ? "cancel-new-game" : "wizard-back"}"
          >
            ${stepIndex === 0 ? "CANCEL" : "BACK"}
          </button>
          <button
            type="button"
            class="primary-button"
            data-action="${isComplete ? "finish-new-game" : "wizard-next"}"
          >
            ${isComplete ? "START" : "NEXT"}
          </button>
        </div>
      </section>
    </main>
  `;
}

function normaliseRoute(route) {
  if (route === ROUTES.equipment) {
    return ROUTES.ability;
  }
  return Object.values(ROUTES).includes(route)
    ? route
    : ROUTES.home;
}

function preloadImages(paths, timeoutMs = 10000) {
  if (typeof Image === "undefined") return Promise.resolve();
  const unique = [...new Set(paths.filter(Boolean))];
  const tasks = unique.map((path) => new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    image.onload = async () => {
      try { await image.decode?.(); } catch (_error) {}
      finish();
    };
    image.onerror = finish;
    image.src = path;
    setTimeout(finish, Math.min(timeoutMs, 7000));
  }));
  return Promise.race([
    Promise.allSettled(tasks),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

function snapshotCriticalImagePaths(snapshot) {
  if (!snapshot) return [];
  const roomId = snapshot.company.homeRoomId ?? snapshot.company.activeRoomId;
  const room = getRoomMaster(roomId);
  return [
    room?.image,
    ...(snapshot.collections.roomLayouts?.[roomId] ?? []).map((entry) => entry.image),
    ...snapshot.playerTeam.members.map((member) => member.image),
    ...(snapshot.employees ?? []).map((employee) => employee.image),
    ...FACILITY_DEFINITIONS.map((facility) => facility.homeImage),
  ].filter(Boolean).map(assetPath);
}

export function createMainApp({
  root,
  modalRoot,
  toastRoot,
  loadingOverlay,
  loadingMessage,
  storage = globalThis.localStorage,
} = {}) {
  if (!root || !modalRoot || !toastRoot || !loadingOverlay || !loadingMessage) {
    throw new Error("Main application DOM roots are missing.");
  }

  const stateManager = createGameStateManager({ storage });
  let route = ROUTES.title;
  let titleSettingsOpen = false;
  let homeRoomPreviewOpen = false;
  let wizardStep = 0;
  let wizardData = createInitialWizardData();
  let wizardError = "";
  let selectedTeamPlayerId = null;
  let selectedFacilityId = "team_lab";
  let selectedAbilityColor = "blue";
  let developmentMode = "ability";
  let abilityUpgradePlan = {};
  let abilityPlanPlayerId = null;
  let weaponUpgradePlan = {};
  let weaponPlanPlayerId = null;
  let modalQuantityValue = 1;
  let activeUpgradeNode = null;
  let weekStartPresentationOpen = false;
  let employeeRankPresentationOpen = false;
  let progressionQueue =
    Promise.resolve();
  let toastTimer = null;
  let modalResolver = null;

  function showLoading(message = "LOADING...") {
    loadingMessage.textContent = message;
    loadingOverlay.setAttribute("aria-hidden", "false");
  }

  function hideLoading() {
    loadingOverlay.setAttribute("aria-hidden", "true");
  }

  function showToast(message) {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastRoot.innerHTML = `<div class="toast">${escapeHtml(message)}</div>`;
    toastTimer = setTimeout(() => {
      toastRoot.innerHTML = "";
    }, 2200);
  }

  function renderPreservingPageScroll() {
    const currentRoute = route;
    const positions = new Map();
    for (const element of root.querySelectorAll(".page-content, [data-scroll-memory]")) {
      const key = element.dataset.scrollMemory ?? (element.classList.contains("page-content") ? "page-content" : null);
      if (key) positions.set(key, { top: element.scrollTop, left: element.scrollLeft });
    }
    render();
    if (route !== currentRoute) return;
    for (const element of root.querySelectorAll(".page-content, [data-scroll-memory]")) {
      const key = element.dataset.scrollMemory ?? (element.classList.contains("page-content") ? "page-content" : null);
      const position = key ? positions.get(key) : null;
      if (position) { element.scrollTop = position.top; element.scrollLeft = position.left; }
    }
  }


  function updateTeamFeatureLiveSection(sectionType) {
    const page = root.querySelector(".page-content");
    const oldSection = root.querySelector(
      `[data-live-section="${sectionType}"]`,
    );
    if (!oldSection) {
      renderPreservingPageScroll();
      return;
    }

    const snapshot = stateManager.getSnapshot();
    const playerId = getSelectedPlayerId(
      snapshot,
      selectedTeamPlayerId,
    );
    const markup =
      sectionType === "ability"
        ? renderAbilityUpSection(
            snapshot,
            playerId,
            abilityUpgradePlan,
            { includeSelector: false },
          )
        : sectionType === "equipment"
          ? renderEquipmentSection(
              snapshot,
              playerId,
              weaponUpgradePlan,
              { includeSelector: false },
            )
          : sectionType === "skill"
            ? renderSkillUpgradeSection(
                snapshot,
                playerId,
                { includeSelector: false },
              )
            : renderSpecialAbilitySection(
                snapshot,
                playerId,
                selectedAbilityColor,
                {
                  includeSelector:
                    route !==
                    ROUTES.ability,
                },
              );
    const nestedScrolls =
      new Map(
        [
          ...oldSection.querySelectorAll(
            "[data-scroll-memory]",
          ),
        ].map(
          (element) => [
            element.dataset.scrollMemory,
            {
              top: element.scrollTop,
              left: element.scrollLeft,
            },
          ],
        ),
      );
    const template =
      document.createElement(
        "template",
      );
    template.innerHTML =
      markup.trim();
    const replacement =
      template.content
        .firstElementChild;
    const top =
      page?.scrollTop ?? 0;
    oldSection.replaceWith(
      replacement,
    );
    if (page) {
      page.scrollTop = top;
    }
    for (
      const element
      of replacement.querySelectorAll(
        "[data-scroll-memory]",
      )
    ) {
      const saved =
        nestedScrolls.get(
          element.dataset
            .scrollMemory,
        );
      if (!saved) {
        continue;
      }
      element.scrollTop =
        saved.top;
      element.scrollLeft =
        saved.left;
    }
  }


  function specialConditionText(detail) {
    const labels = {
      wins: "大会優勝",
      top5: "大会TOP5",
      mvp: "MVP獲得",
      damage: "累計ダメージ",
      kp: "累計KP",
      ap: "累計AP",
      training: "トレーニング回数",
      cardTypes: "カード獲得種類",
      badgeTypes: "バッジ獲得種類",
      championshipWins: "Championship優勝",
    };
    const tierLabels = {
      local: "LOCAL",
      national: "NATIONAL",
      world: "WORLD",
      championship: "CHAMPIONSHIP",
    };
    const tier =
      detail.condition.tier
        ? `（${tierLabels[detail.condition.tier] ?? detail.condition.tier.toUpperCase()}）`
        : "";
    return `${labels[detail.condition.type] ?? detail.condition.type}${tier}`;
  }

  function closeModal(value = false) {
    modalRoot.classList.remove("is-open");
    modalRoot.innerHTML = "";
    activeUpgradeNode = null;
    if (modalResolver) {
      const resolver = modalResolver;
      modalResolver = null;
      resolver(value);
    }
  }

  function openAlert({ title, body, code = null, buttonLabel = "OK" }) {
    if (modalResolver) {
      closeModal(false);
    }

    return new Promise((resolve) => {
      modalResolver = resolve;
      modalRoot.classList.add("is-open");
      modalRoot.innerHTML = `
        <div class="modal-backdrop" data-action="dismiss-alert">
          <section
            class="modal-card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="modalTitle"
          >
            <p class="modal-card__eyebrow">MOB BR</p>
            <h2 id="modalTitle" class="modal-card__title">
              ${escapeHtml(title)}
            </h2>
            <div class="modal-card__body">
              ${body}
              ${code ? `<span class="error-code">${escapeHtml(code)}</span>` : ""}
            </div>
            <div class="modal-card__actions modal-card__actions--single">
              <button
                type="button"
                class="primary-button"
                data-action="modal-confirm"
              >
                ${escapeHtml(buttonLabel)}
              </button>
            </div>
          </section>
        </div>
      `;
    });
  }

  function openConfirm({
    title,
    body,
    confirmLabel = "はい",
    cancelLabel = "いいえ",
    danger = false,
  }) {
    if (modalResolver) {
      closeModal(false);
    }

    return new Promise((resolve) => {
      modalResolver = resolve;
      modalRoot.classList.add("is-open");
      modalRoot.innerHTML = `
        <div class="modal-backdrop">
          <section
            class="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalTitle"
          >
            <p class="modal-card__eyebrow">CONFIRM</p>
            <h2 id="modalTitle" class="modal-card__title">
              ${escapeHtml(title)}
            </h2>
            <div class="modal-card__body">${body}</div>
            <div class="modal-card__actions">
              <button
                type="button"
                class="secondary-button"
                data-action="modal-cancel"
              >
                ${escapeHtml(cancelLabel)}
              </button>
              <button
                type="button"
                class="${danger ? "danger-button" : "primary-button"}"
                data-action="modal-confirm"
              >
                ${escapeHtml(confirmLabel)}
              </button>
            </div>
          </section>
        </div>
      `;
    });
  }

  function openTextPrompt({
    title,
    body,
    initialValue = "",
    maximumLength = 60,
    confirmLabel = "変更",
    cancelLabel = "戻る",
  }) {
    if (modalResolver) {
      closeModal(false);
    }

    return new Promise((resolve) => {
      modalResolver = resolve;
      modalRoot.classList.add("is-open");
      modalRoot.innerHTML = `
        <div class="modal-backdrop">
          <section
            class="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalTitle"
          >
            <p class="modal-card__eyebrow">INPUT</p>
            <h2 id="modalTitle" class="modal-card__title">
              ${escapeHtml(title)}
            </h2>
            <div class="modal-card__body">
              ${body}
              <div class="form-field">
                <input
                  id="modalTextInput"
                  type="text"
                  maxlength="${maximumLength}"
                  value="${escapeAttribute(initialValue)}"
                >
              </div>
            </div>
            <div class="modal-card__actions">
              <button
                type="button"
                class="secondary-button"
                data-action="modal-cancel"
              >
                ${escapeHtml(cancelLabel)}
              </button>
              <button
                type="button"
                class="primary-button"
                data-action="modal-text-confirm"
              >
                ${escapeHtml(confirmLabel)}
              </button>
            </div>
          </section>
        </div>
      `;
      queueMicrotask(() => {
        const input = modalRoot.querySelector("#modalTextInput");
        input?.focus();
        input?.select();
      });
    });
  }


  function openQuantityPrompt({
    title,
    body,
    initialValue = 1,
    minimum = 1,
    maximum = 99,
    confirmLabel = "購入する",
    cancelLabel = "戻る",
  }) {
    if (modalResolver) {
      closeModal(false);
    }
    modalQuantityValue = Math.max(
      minimum,
      Math.min(maximum, Math.floor(initialValue)),
    );

    return new Promise((resolve) => {
      modalResolver = resolve;
      modalRoot.classList.add("is-open");
      modalRoot.innerHTML = `
        <div class="modal-backdrop">
          <section class="modal-card" role="dialog" aria-modal="true">
            <p class="modal-card__eyebrow">QUANTITY</p>
            <h2 class="modal-card__title">${escapeHtml(title)}</h2>
            <div class="modal-card__body">
              ${body}
              <div class="quantity-stepper-modal">
                <button type="button" data-repeat-action data-action="modal-quantity-minus">−</button>
                <strong data-quantity-value>${modalQuantityValue}</strong>
                <button type="button" data-repeat-action data-action="modal-quantity-plus">＋</button>
              </div>
              <small>＋／−は長押しで加速します</small>
            </div>
            <div class="modal-card__actions">
              <button type="button" class="secondary-button" data-action="modal-cancel">${escapeHtml(cancelLabel)}</button>
              <button type="button" class="primary-button" data-action="modal-quantity-confirm">${escapeHtml(confirmLabel)}</button>
            </div>
          </section>
        </div>
      `;
    });
  }


  function renderActiveUpgradeNodeBody() {
    if (!activeUpgradeNode) {
      return "";
    }
    const snapshot =
      stateManager.getSnapshot();
    if (
      activeUpgradeNode.kind ===
      "ability"
    ) {
      return renderAbilityUpgradeNodeModal(
        snapshot,
        activeUpgradeNode.playerId,
        activeUpgradeNode.statId,
        abilityUpgradePlan,
      );
    }
    return renderWeaponUpgradeNodeModal(
      snapshot,
      activeUpgradeNode.playerId,
      activeUpgradeNode.statId,
      weaponUpgradePlan,
    );
  }

  function refreshUpgradeNodePopup() {
    const body =
      modalRoot.querySelector(
        "[data-upgrade-node-body]",
      );
    if (!body) {
      return;
    }
    body.innerHTML =
      renderActiveUpgradeNodeBody();
  }

  function openUpgradeNodePopup({
    kind,
    playerId,
    statId,
  }) {
    if (modalResolver) {
      closeModal(false);
    }
    activeUpgradeNode = {
      kind:
        kind === "weapon"
          ? "weapon"
          : "ability",
      playerId,
      statId,
    };
    modalRoot.classList.add(
      "is-open",
    );
    modalRoot.innerHTML = `
      <div class="modal-backdrop modal-backdrop--upgrade-node">
        <section
          class="modal-card modal-card--upgrade-node"
          role="dialog"
          aria-modal="true"
          aria-label="強化詳細"
        >
          <button
            type="button"
            class="upgrade-node-modal__close"
            data-action="modal-upgrade-close"
            aria-label="閉じる"
          >
            ×
          </button>
          <div data-upgrade-node-body>
            ${renderActiveUpgradeNodeBody()}
          </div>
          <footer class="modal-card__actions modal-card__actions--single">
            <button
              type="button"
              class="primary-button"
              data-action="modal-upgrade-close"
            >
              閉じる
            </button>
          </footer>
        </section>
      </div>
    `;
  }

  function adjustUpgradeNodePlan(
    direction,
  ) {
    if (!activeUpgradeNode) {
      return;
    }
    const {
      kind,
      playerId,
      statId,
    } =
      activeUpgradeNode;
    const amount =
      direction === "plus"
        ? 1
        : -1;

    if (kind === "ability") {
      if (
        abilityPlanPlayerId !==
        playerId
      ) {
        abilityPlanPlayerId =
          playerId;
        abilityUpgradePlan = {};
      }
      const current =
        Math.max(
          0,
          abilityUpgradePlan[
            statId
          ] ??
          0,
        );
      const candidate = {
        ...abilityUpgradePlan,
        [statId]:
          Math.max(
            0,
            current +
            amount,
          ),
      };
      const plan =
        calculatePlayerStatUpgradePlan(
          stateManager.getSnapshot(),
          playerId,
          candidate,
        );
      if (
        direction === "minus" ||
        plan.affordable
      ) {
        abilityUpgradePlan =
          plan.increments;
        updateTeamFeatureLiveSection(
          "ability",
        );
        refreshUpgradeNodePopup();
      }
      return;
    }

    if (
      weaponPlanPlayerId !==
      playerId
    ) {
      weaponPlanPlayerId =
        playerId;
      weaponUpgradePlan = {};
    }
    const current =
      Math.max(
        0,
        weaponUpgradePlan[
          statId
        ] ??
        0,
      );
    const candidate = {
      ...weaponUpgradePlan,
      [statId]:
        Math.max(
          0,
          current +
          amount,
        ),
    };
    const plan =
      calculateWeaponUpgradePlan(
        stateManager.getSnapshot(),
        playerId,
        candidate,
      );
    if (
      direction === "minus" ||
      plan.affordable
    ) {
      weaponUpgradePlan =
        plan.increments;
      updateTeamFeatureLiveSection(
        "equipment",
      );
      refreshUpgradeNodePopup();
    }
  }

  function waitForUi(milliseconds) {
    return new Promise((resolve) =>
      setTimeout(resolve, milliseconds),
    );
  }

  function progressionEntryTemplate(entry) {
    return `
      <article>
        ${
          entry.icon
            ? `<img src="${escapeAttribute(assetPath(entry.icon))}" alt="">`
            : `<i>${escapeHtml(String(entry.label ?? "UP").slice(0, 1))}</i>`
        }
        <div>
          <span>${escapeHtml(entry.label ?? "VALUE")}</span>
          <strong>
            ${escapeHtml(entry.before ?? "")}
            <b>→</b>
            ${escapeHtml(entry.after ?? "")}
          </strong>
          ${
            entry.note
              ? `<small>${escapeHtml(entry.note)}</small>`
              : ""
          }
        </div>
      </article>
    `;
  }

  async function runProgressionPresentation({
    kind = "growth",
    label = "POWER UP",
    title = "成長しました",
    subject = "",
    entries = [],
    company = null,
    rankUp = false,
  } = {}) {
    const overlay =
      document.createElement(
        "section",
      );
    overlay.className =
      `progression-presentation progression-presentation--${kind} ${rankUp ? "is-rank-up" : ""}`;
    overlay.innerHTML = `
      ${
        rankUp
          ? `
            <img
              class="progression-presentation__rank-icon"
              src="icon/rankup.png"
              alt=""
            >
          `
          : `<div class="progression-presentation__glow" aria-hidden="true"></div>`
      }
      <span>${escapeHtml(label)}</span>
      <h2>${escapeHtml(title)}</h2>
      ${
        subject
          ? `<strong class="progression-presentation__subject">${escapeHtml(subject)}</strong>`
          : ""
      }
      ${
        company
          ? `
            <section class="company-rank-growth">
              <div class="company-rank-growth__rank">
                <small>COMPANY RANK</small>
                <strong>${escapeHtml(company.beforeRank)}</strong>
                <b>→</b>
                <strong>${escapeHtml(company.afterRank)}</strong>
              </div>
              <div class="company-rank-growth__gauge">
                <span>
                  <i style="--company-start:${company.startPercent}%;--company-end:${company.endPercent}%"></i>
                </span>
                <small>
                  +${formatNumber(company.gained)} PT
                  ${
                    company.afterRequirement === null
                      ? "/ MAX RANK"
                      : `/ ${formatNumber(company.afterExp)} / ${formatNumber(company.afterRequirement)}`
                  }
                </small>
              </div>
            </section>
          `
          : ""
      }
      <div class="progression-presentation__entries">
        ${entries.map(progressionEntryTemplate).join("")}
      </div>
      ${
        rankUp
          ? `
            <div class="progression-rank-up-call">
              <span>RANK UP!</span>
              <strong>${escapeHtml(company?.afterRank ?? title)}</strong>
            </div>
            <button
              type="button"
              class="progression-presentation__next"
              data-progression-next
            >
              NEXT
            </button>
          `
          : ""
      }
    `;
    root.append(overlay);
    requestAnimationFrame(() =>
      overlay.classList.add(
        "is-active",
      ),
    );
    if (rankUp) {
      await waitForUi(720);
      const nextButton =
        overlay.querySelector(
          "[data-progression-next]",
        );
      await new Promise(
        (resolve) => {
          nextButton?.addEventListener(
            "click",
            resolve,
            {
              once: true,
            },
          );
        },
      );
    } else {
      await waitForUi(1250);
    }
    overlay.classList.add(
      "is-exit",
    );
    await waitForUi(260);
    overlay.remove();
  }

  function playProgressionPresentation(
    payload,
  ) {
    progressionQueue =
      progressionQueue
        .catch(() => undefined)
        .then(() =>
          runProgressionPresentation(
            payload,
          ),
        );
    return progressionQueue;
  }

  function companyProgressionPayload({
    beforeCompany,
    afterCompany,
    companyExpResult,
  }) {
    const beforeRankData =
      getCompanyRankData(
        beforeCompany.rank,
      );
    const afterRankData =
      getCompanyRankData(
        afterCompany.rank,
      );
    const beforePercent =
      beforeRankData.expToNext === null
        ? 100
        : Math.min(
            100,
            beforeCompany.exp /
              beforeRankData.expToNext *
              100,
          );
    const afterPercent =
      afterRankData.expToNext === null
        ? 100
        : Math.min(
            100,
            afterCompany.exp /
              afterRankData.expToNext *
              100,
          );
    const rankUps =
      companyExpResult?.rankUps ?? [];
    return {
      kind: "company",
      label:
        rankUps.length > 0
          ? "COMPANY RANK UP"
          : "COMPANY POINT",
      title:
        rankUps.length > 0
          ? `${beforeCompany.rank} → ${afterCompany.rank}`
          : "企業ランクポイント獲得",
      subject:
        afterCompany.companyName ??
        "",
      company: {
        beforeRank:
          beforeCompany.rank,
        afterRank:
          afterCompany.rank,
        startPercent:
          beforeCompany.rank ===
          afterCompany.rank
            ? beforePercent
            : 0,
        endPercent:
          afterPercent,
        gained:
          companyExpResult?.gainedExp ??
          companyExpResult?.addedExp ??
          0,
        afterExp:
          afterCompany.exp,
        afterRequirement:
          afterRankData.expToNext,
      },
      rankUp:
        rankUps.length > 0,
      entries:
        rankUps.length > 0
          ? rankUps.map((rankUp) => ({
              label:
                `${rankUp.from} → ${rankUp.to}`,
              before:
                rankUp.from,
              after:
                rankUp.to,
              note:
                `COIN +${formatNumber(rankUp.reward.coin ?? 0)} / DIAMOND +${formatNumber(rankUp.reward.diamond ?? 0)} / RUBY +${formatNumber(rankUp.reward.ruby ?? 0)}`,
              icon:
                "icon/com.png",
            }))
          : [],
    };
  }

  async function showPinkGuide(
    guideKey,
    guide,
  ) {
    const snapshot =
      stateManager.getSnapshot();
    if (
      !snapshot ||
      !guide ||
      modalResolver ||
      weekStartPresentationOpen ||
      snapshot.ui?.guideFlags?.[
        guideKey
      ] === true
    ) {
      return false;
    }

    stateManager.transact(
      "mob_pink_guide_viewed",
      (draft) => {
        draft.ui.guideFlags =
          draft.ui.guideFlags ?? {};
        draft.ui.guideFlags[
          guideKey
        ] = true;
      },
    );

    await openAlert({
      title: guide.title,
      body: `
        <section class="mob-pink-guide">
          <div class="mob-pink-guide__character">
            <img src="icon/pink.png" alt="モブピンク">
            <span>MOB PINK</span>
          </div>
          <div class="mob-pink-guide__speech">
            <strong>モブピンク</strong>
            <p>${escapeHtml(guide.text)}</p>
          </div>
        </section>
      `,
      buttonLabel: "OK",
    });
    return true;
  }

  function showPinkGuideForRoute(
    targetRoute,
  ) {
    const guide =
      PINK_GUIDES[targetRoute];
    if (!guide) {
      return Promise.resolve(
        false,
      );
    }
    return showPinkGuide(
      `route:${targetRoute}`,
      guide,
    );
  }

  async function showPendingEmployeeRankUpPresentation() {
    if (
      employeeRankPresentationOpen ||
      modalResolver
    ) {
      return false;
    }
    const snapshot =
      stateManager.getSnapshot();
    const pending =
      snapshot?.ui?.pendingEmployeeRankUps;
    if (
      !Array.isArray(pending) ||
      pending.length === 0
    ) {
      return false;
    }

    employeeRankPresentationOpen = true;
    try {
      for (const event of pending) {
        await playProgressionPresentation({
          kind: "employee",
          label: "EMPLOYEE RANK UP",
          title: "従業員ランクアップ",
          subject: event.employeeName,
          rankUp: true,
          entries: [{
            label: `${event.beforeRank} → ${event.afterRank}`,
            before: event.beforeRank,
            after: event.afterRank,
            note:
              `プレイヤー全員 HP +${event.beforeHpBonus} → +${event.afterHpBonus}`,
            icon:
              event.image ??
              "icon/rankup.png",
          }],
        });
      }
      stateManager.transact(
        "employee_rank_up_presentations_completed",
        (draft) => {
          clearPendingEmployeeRankUpsToDraft(
            draft,
          );
        },
      );
    } finally {
      employeeRankPresentationOpen = false;
    }
    return true;
  }

  async function showPendingWeekStartPresentation() {
    if (
      weekStartPresentationOpen ||
      modalResolver
    ) {
      return false;
    }
    const snapshot =
      stateManager.getSnapshot();
    const pending =
      snapshot?.ui?.pendingWeekStart;
    if (!pending) {
      return false;
    }

    weekStartPresentationOpen = true;
    const message =
      WEEKLY_EMPLOYEE_MESSAGES[
        pending.messageIndex %
        WEEKLY_EMPLOYEE_MESSAGES.length
      ];
    const monthImage =
      pending.monthImage ??
      `back/month${String(pending.gameDate.month).padStart(2, "0")}.png`;
    const bonus =
      snapshot.weeklyBonus.history.at(-1);

    try {
      await openAlert({
        title: pending.monthChanged
          ? "NEW MONTH / NEW WEEK"
          : "NEW WEEK START",
        body: `
          <section class="employee-week-greeting">
            ${
              pending.monthChanged
                ? `
                  <div class="month-opening-visual">
                    <img
                      src="${escapeAttribute(assetPath(monthImage))}"
                      alt="${pending.gameDate.month}月"
                    >
                    <span>MONTH ${String(pending.gameDate.month).padStart(2, "0")}</span>
                    <strong>${pending.gameDate.year}年 ${pending.gameDate.month}月</strong>
                    <small>月初画像は後から同名ファイルへ差し替えできます</small>
                  </div>
                `
                : ""
            }
            <div class="employee-week-greeting__staff">
              <div class="employee-pink">
                <img src="icon/pink.png" alt="モブピンク">
                <span>MOB PINK</span>
              </div>
              <div class="employee-week-greeting__speech">
                <span>モブピンク</span>
                <h3>${pending.gameDate.year}年 ${pending.gameDate.month}月 第${pending.gameDate.week}週</h3>
                <p>${escapeHtml(message)}</p>
              </div>
            </div>
            ${
              Array.isArray(snapshot.ui?.pendingMotivationEvents) &&
              snapshot.ui.pendingMotivationEvents.length > 0
                ? `
                  <section class="motivation-change-presentation">
                    <header>
                      <span>MOTIVATION UPDATE</span>
                      <strong>大会後のやる気変動</strong>
                    </header>
                    <div>
                      ${snapshot.ui.pendingMotivationEvents.map((event) => {
                        const before = motivationDisplay(event.before);
                        const after = motivationDisplay(event.after);
                        return `
                          <article data-direction="${escapeAttribute(event.direction)}">
                            <span>${escapeHtml(event.role)}</span>
                            <strong>${escapeHtml(event.playerName)}</strong>
                            <div>
                              <i class="motivation-badge motivation-badge--${escapeAttribute(before.id)}">${escapeHtml(before.mark)} ${escapeHtml(before.name)}</i>
                              <b>→</b>
                              <i class="motivation-badge motivation-badge--${escapeAttribute(after.id)}">${escapeHtml(after.mark)} ${escapeHtml(after.name)} ${escapeHtml(after.modifierLabel)}</i>
                            </div>
                            <small>${escapeHtml(event.reason)}</small>
                          </article>
                        `;
                      }).join("")}
                    </div>
                  </section>
                `
                : ""
            }
            ${
              bonus?.gameDate?.year === pending.gameDate.year &&
              bonus?.gameDate?.month === pending.gameDate.month &&
              bonus?.gameDate?.week === pending.gameDate.week
                ? `
                  <div class="weekly-bonus-inline">
                    <span>WEEK START BONUS</span>
                    <strong><img src="icon/coin.png" alt="">${formatNumber(bonus.granted.coin)}</strong>
                    <strong><img src="icon/daia.png" alt="">${formatNumber(bonus.granted.diamond)}</strong>
                    <strong><img src="icon/rubi.png" alt="">${formatNumber(bonus.granted.ruby)}</strong>
                  </div>
                `
                : ""
            }
          </section>
        `,
        buttonLabel: "今週を始める",
      });

      stateManager.transact(
        "week_start_presentation_completed",
        (draft) => {
          draft.ui.pendingWeekStart = null;
          draft.ui.pendingMotivationEvents = [];
          draft.ui.lastScreen = ROUTES.home;
          draft.ui.lastSubScreen = null;
        },
      );
    } finally {
      weekStartPresentationOpen = false;
    }
    queueMicrotask(
      showPendingEmployeeRankUpPresentation,
    );
    return true;
  }

  function getSafeSnapshot() {
    return stateManager.getSnapshot();
  }

  function inspectSaveSummary() {
    if (!stateManager.hasSave()) {
      return null;
    }

    try {
      return stateManager.load();
    } catch (error) {
      return {
        corrupted: true,
        error,
      };
    }
  }

  function initializeTeamMenuDeck() {
    const track =
      root.querySelector(
        ".team-menu-deck__track",
      );
    if (!track) {
      return;
    }

    const items = [
      ...track.querySelectorAll(
        ".team-menu-deck__item",
      ),
    ];
    let frameId = null;

    const update = () => {
      frameId = null;
      const trackRect =
        track.getBoundingClientRect();
      const center =
        trackRect.left +
        trackRect.width / 2;
      const influence =
        Math.max(
          90,
          trackRect.width * 0.42,
        );

      for (const item of items) {
        const rect =
          item.getBoundingClientRect();
        const itemCenter =
          rect.left +
          rect.width / 2;
        const distance =
          Math.max(
            -1,
            Math.min(
              1,
              (
                itemCenter -
                center
              ) /
              influence,
            ),
          );
        const focus =
          1 -
          Math.abs(distance);
        item.style.transform =
          `rotateY(${(-distance * 34).toFixed(2)}deg) translateZ(${(focus * 34).toFixed(2)}px) scale(${(0.82 + focus * 0.18).toFixed(3)})`;
        item.style.opacity =
          String(
            0.58 +
            focus *
            0.42,
          );
        item.style.filter =
          `brightness(${(0.76 + focus * 0.3).toFixed(3)})`;
      }
    };

    const scheduleUpdate = () => {
      if (frameId !== null) {
        return;
      }
      frameId =
        requestAnimationFrame(
          update,
        );
    };

    track.addEventListener(
      "scroll",
      scheduleUpdate,
      {
        passive: true,
      },
    );
    globalThis.addEventListener?.(
      "resize",
      scheduleUpdate,
      {
        passive: true,
        once: true,
      },
    );
    scheduleUpdate();
  }

  let mainPortraitFrameId =
    null;

  function balanceMainPortraits() {
    mainPortraitFrameId =
      null;
    const selectors = [
      "img[data-character-portrait]",
      "img.player-portrait",
      ".team-portrait-button img[data-role]",
      ".training-cinematic__portrait img",
      ".training-result-member__player",
      ".player-row__image",
      ".dining-seat > img",
    ];
    const options = {
      scaleProperty:
        "--main-portrait-scale",
      translateProperty:
        "--main-portrait-y",
      targetWidthRate:
        1.24,
      targetHeightRate:
        0.80,
      minimumScale:
        0.46,
      maximumScale:
        1.70,
    };
    fitPortraits(
      root,
      selectors,
      options,
    );
    fitPortraits(
      modalRoot,
      selectors,
      options,
    );
  }

  function scheduleMainPortraitBalance() {
    if (
      mainPortraitFrameId !==
      null
    ) {
      return;
    }
    mainPortraitFrameId =
      requestAnimationFrame(
        () => {
          balanceMainPortraits();
          requestAnimationFrame(
            balanceMainPortraits,
          );
        },
      );
  }

  function render() {
    const snapshot = getSafeSnapshot();

    if (route === ROUTES.title) {
      if (titleSettingsOpen) {
        root.innerHTML = settingsTemplate(snapshot, ROUTES.settings, true);
        return;
      }

      if (wizardStep >= 0 && root.dataset.mode === "new-game") {
        root.innerHTML = wizardTemplate(
          wizardStep,
          wizardData,
          wizardError,
        );
        queueMicrotask(() => {
          root.querySelector("#wizardInput")?.focus();
        });
        return;
      }

      const summary = inspectSaveSummary();
      root.innerHTML = titleTemplate(
        Boolean(summary && !summary.corrupted),
        summary && !summary.corrupted ? summary : null,
      );

      if (summary?.corrupted) {
        queueMicrotask(() => {
          openAlert({
            title: "セーブデータを読み込めません",
            body:
              "<p>セーブデータが破損しているか、対応していない形式です。</p>",
            code: getErrorCode(summary.error),
          });
        });
      }
      return;
    }

    if (!snapshot) {
      route = ROUTES.title;
      render();
      return;
    }

    if (
      snapshot.ui?.pendingWeekStart &&
      route !== ROUTES.title
    ) {
      route = ROUTES.home;
    }

    if (route === ROUTES.home) {
      root.innerHTML =
        homeRoomPreviewOpen
          ? homeRoomPreviewTemplate(
              snapshot,
            )
          : homeTemplate(
              snapshot,
              route,
            );
      scheduleMainPortraitBalance();
      if (
        !homeRoomPreviewOpen &&
        snapshot.ui?.pendingWeekStart
      ) {
        queueMicrotask(
          showPendingWeekStartPresentation,
        );
      } else if (
        Array.isArray(
          snapshot.ui
            ?.pendingEmployeeRankUps,
        ) &&
        snapshot.ui
          .pendingEmployeeRankUps
          .length > 0
      ) {
        queueMicrotask(
          showPendingEmployeeRankUpPresentation,
        );
      }
      return;
    }
    if (route === ROUTES.facility) {
      root.innerHTML = facilityTemplate(snapshot, route, selectedFacilityId);
      return;
    }
    if (route === ROUTES.team) {
      root.innerHTML =
        teamTemplate(
          snapshot,
          route,
        );
      queueMicrotask(
        initializeTeamMenuDeck,
      );
      scheduleMainPortraitBalance();
      return;
    }
    if (route === ROUTES.settings) {
      root.innerHTML = settingsTemplate(snapshot, route, false);
      return;
    }
    if (route === ROUTES.schedule) {
      root.innerHTML = tournamentScheduleTemplate(
        snapshot,
        route,
        storage,
      );
      return;
    }
    if (MANAGEMENT_ROUTES.includes(route)) {
      root.innerHTML = managementFeatureTemplate(snapshot, route, route);
      queueMicrotask(() => managementController.afterRender(route));
      scheduleMainPortraitBalance();
      return;
    }
    if (
      route === ROUTES.ability ||
      route === ROUTES.specialAbility
    ) {
      selectedTeamPlayerId = getSelectedPlayerId(
        snapshot,
        selectedTeamPlayerId,
      );
      if (abilityPlanPlayerId !== selectedTeamPlayerId) {
        abilityUpgradePlan = {};
        abilityPlanPlayerId = selectedTeamPlayerId;
      }
      if (weaponPlanPlayerId !== selectedTeamPlayerId) {
        weaponUpgradePlan = {};
        weaponPlanPlayerId = selectedTeamPlayerId;
      }
      root.innerHTML = teamFeatureTemplate(snapshot, route, route, {
        selectedPlayerId: selectedTeamPlayerId,
        abilityColor: selectedAbilityColor,
        abilityPlan: abilityUpgradePlan,
        weaponPlan: weaponUpgradePlan,
        developmentMode,
      });
      return;
    }

    root.innerHTML = placeholderTemplate(snapshot, route, route);
  }

  async function beginNewGame() {
    if (stateManager.hasSave()) {
      const overwrite = await openConfirm({
        title: "現在のセーブを上書きしますか？",
        body:
          "<p>現在の進行状況は削除され、元に戻せません。</p>",
        confirmLabel: "上書きする",
        cancelLabel: "戻る",
        danger: true,
      });
      if (!overwrite) {
        return;
      }
    }

    wizardStep = 0;
    wizardData = createInitialWizardData();
    wizardError = "";
    root.dataset.mode = "new-game";
    render();
  }

  function readWizardInput() {
    const input = root.querySelector("#wizardInput");
    return input?.value.trim() ?? "";
  }

  function storeWizardValue(value) {
    const step = NEW_GAME_STEPS[wizardStep];
    if (step.group) {
      wizardData[step.group][step.key] = value;
    } else {
      wizardData[step.key] = value;
    }
  }

  function moveWizardNext() {
    const step = NEW_GAME_STEPS[wizardStep];
    if (step.key === "complete") {
      return;
    }

    const value = readWizardInput();
    if (!value) {
      wizardError = "入力してください。";
      render();
      return;
    }

    storeWizardValue(value);
    wizardError = "";
    wizardStep += 1;
    render();
  }

  async function finishNewGame() {
    showLoading("NEW GAMEを作成しています");

    try {
      stateManager.createNewGame(wizardData, {
        overwrite: stateManager.hasSave(),
      });
      root.dataset.mode = "";
      wizardStep = 0;
      wizardData = createInitialWizardData();
      route = ROUTES.home;
      render();
      hideLoading();

      const snapshot = stateManager.getSnapshot();
      const firstBonus = snapshot.weeklyBonus.history[0];

      await openAlert({
        title: "週間企業ボーナス",
        body: `
          <section class="weekly-bonus-show">
            <div class="weekly-bonus-show__burst" aria-hidden="true"></div>
            <img src="${escapeAttribute(snapshot.company.badgeImage)}" alt="">
            <span>WEEK START BONUS</span>
            <h3>${escapeHtml(formatGameDate(firstBonus.gameDate))}</h3>
            <div class="weekly-bonus-show__rewards">
              <strong><img src="icon/coin.png" alt="">${formatNumber(firstBonus.granted.coin)}</strong>
              <strong><img src="icon/daia.png" alt="">${formatNumber(firstBonus.granted.diamond)}</strong>
              <strong><img src="icon/rubi.png" alt="">${formatNumber(firstBonus.granted.ruby)}</strong>
            </div>
          </section>
        `,
        buttonLabel: "HOMEへ",
      });
      await showPinkGuide(
        "new-game:pro-league-entry",
        {
          title:
            "プロリーグ参戦",
          text:
            `${snapshot.playerTeam.teamName}として本日からプロリーグ参戦です！最初はたくさん負けてもいいので、経験を積みましょう！`,
        },
      );
      await showPinkGuide(
        "new-game:denden-cup",
        {
          title:
            "デンデンカップ",
          text:
            "デンデンカップはプロではないチームがたくさん出場します。腕試しをしてレベルアップしていきましょう！",
        },
      );
      await showPinkGuideForRoute(
        ROUTES.home,
      );
    } catch (error) {
      hideLoading();
      await openAlert({
        title: "NEW GAMEを作成できません",
        body: `<p>${escapeHtml(error.message)}</p>`,
        code: getErrorCode(error),
      });
    }
  }

  async function continueGame() {
    showLoading("セーブデータを読み込んでいます");
    try {
      stateManager.load();
      route = normaliseRoute(
        stateManager.getSnapshot().ui?.lastScreen ?? ROUTES.home,
      );
      if (route === ROUTES.title) {
        route = ROUTES.home;
      }
      hideLoading();
      render();
      queueMicrotask(() =>
        tournamentBridgeController.importPendingResultIfAvailable(),
      );
    } catch (error) {
      hideLoading();
      await openAlert({
        title: "CONTINUEできません",
        body: `<p>${escapeHtml(error.message)}</p>`,
        code: getErrorCode(error),
      });
    }
  }

  function navigate(nextRoute) {
    homeRoomPreviewOpen =
      false;
    const requestedRoute = nextRoute;
    const normalized =
      normaliseRoute(nextRoute);
    const snapshot = stateManager.getSnapshot();

    if (!snapshot) {
      route = ROUTES.title;
      render();
      return;
    }

    try {
      stateManager.transact("ui_route_changed", (draft) => {
        draft.ui.lastScreen = normalized;
        draft.ui.lastSubScreen = null;
      });
    } catch (error) {
      showToast("画面位置を保存できませんでした");
    }

    if (requestedRoute === ROUTES.equipment) {
      developmentMode = "weapon";
    } else if (
      requestedRoute === ROUTES.ability
    ) {
      developmentMode = "ability";
    }
    route = normalized;
    render();
    queueMicrotask(() =>
      showPinkGuideForRoute(
        normalized,
      ),
    );
  }

  async function saveSettings(form) {
    const formData = new FormData(form);
    const settings = {
      soundEnabled: formData.get("soundEnabled") === "on",
      reducedMotion: formData.get("reducedMotion") === "on",
      autoAdvanceOpening:
        formData.get("autoAdvanceOpening") === "on",
      commentarySpeed: Number(formData.get("commentarySpeed")),
      testModeCode: String(formData.get("testModeCode") ?? "").trim(),
    };

    if (!stateManager.getSnapshot()) {
      showToast("セーブ開始後に設定を保存できます");
      titleSettingsOpen = false;
      render();
      return;
    }

    try {
      stateManager.transact("settings_updated", (draft) => {
        draft.settings.soundEnabled = settings.soundEnabled;
        draft.settings.reducedMotion = settings.reducedMotion;
        draft.settings.autoAdvanceOpening =
          settings.autoAdvanceOpening;
        draft.settings.commentarySpeed = settings.commentarySpeed;
        if (settings.testModeCode === "0321") {
          draft.settings.testMode = true;
        }
      });
      document.documentElement.dataset.reducedMotion =
        settings.reducedMotion ? "true" : "false";
      showToast("設定を保存しました");
      render();
    } catch (error) {
      await openAlert({
        title: "設定を保存できません",
        body: `<p>${escapeHtml(error.message)}</p>`,
        code: getErrorCode(error),
      });
    }
  }

  const managementController = createManagementController({
    stateManager,
    root,
    openConfirm,
    openAlert,
    openTextPrompt,
    openQuantityPrompt,
    showToast,
    render,
    renderPreservingScroll: renderPreservingPageScroll,
  });

  const tournamentBridgeController = createTournamentBridgeController({
    stateManager,
    storage,
    root,
    openConfirm,
    openAlert,
    showToast,
    render,
    playProgression:
      playProgressionPresentation,
    companyProgressionPayload,
    navigateToTournament: (url) => window.location.assign(url),
  });

  root.addEventListener("error", (event) => {
    if (event.target instanceof HTMLImageElement) {
      event.target.hidden = true;
    }
  }, true);

  root.addEventListener("submit", (event) => {
    event.preventDefault();

    if (event.target.matches('[data-form="wizard-step"]')) {
      moveWizardNext();
      return;
    }

    if (event.target.matches('[data-form="settings"]')) {
      saveSettings(event.target);
    }
  });

  root.addEventListener("click", async (event) => {
    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) {
      return;
    }

    const action = actionElement.dataset.action;

    if (action === "new-game") {
      await beginNewGame();
      return;
    }
    if (action === "continue") {
      await continueGame();
      return;
    }
    if (action === "open-settings") {
      titleSettingsOpen = true;
      render();
      return;
    }
    if (action === "return-title") {
      titleSettingsOpen = false;
      route = ROUTES.title;
      render();
      return;
    }
    if (action === "open-home-room-preview") {
      homeRoomPreviewOpen =
        true;
      render();
      return;
    }
    if (action === "close-home-room-preview") {
      homeRoomPreviewOpen =
        false;
      render();
      return;
    }
    if (action === "open-player-weapon") {
      selectedTeamPlayerId =
        actionElement.dataset.playerId;
      developmentMode = "weapon";
      navigate(ROUTES.ability);
      return;
    }
    if (action === "navigate") {
      navigate(actionElement.dataset.route);
      return;
    }
    if (action === "open-facility") {
      selectedFacilityId = actionElement.dataset.facilityId ?? "team_lab";
      if (selectedFacilityId === "collection") {
        navigate(ROUTES.collection);
        return;
      }
      if (selectedFacilityId === "cooking") {
        navigate(ROUTES.cooking);
        return;
      }
      navigate(ROUTES.facility);
      return;
    }
    if (action === "show-facility-menu") {
      selectedFacilityId =
        actionElement.dataset.facilityId ??
        "team_lab";
      navigate(
        ROUTES.facility,
      );
      return;
    }
    if (action === "select-facility") {
      selectedFacilityId = actionElement.dataset.facilityId ?? "team_lab";
      renderPreservingPageScroll();
      return;
    }
    if (action === "cancel-new-game") {
      root.dataset.mode = "";
      wizardStep = 0;
      wizardData = createInitialWizardData();
      wizardError = "";
      render();
      return;
    }
    if (action === "wizard-back") {
      wizardStep = Math.max(0, wizardStep - 1);
      wizardError = "";
      render();
      return;
    }
    if (action === "wizard-next") {
      moveWizardNext();
      return;
    }
    if (action === "finish-new-game") {
      await finishNewGame();
      return;
    }
    if (action === "inspect-employee") {
      const snapshot =
        stateManager.getSnapshot();
      const employee =
        snapshot.employees?.find(
          (entry) =>
            entry.employeeId ===
            actionElement.dataset.employeeId,
        );
      if (!employee) {
        return;
      }
      const rankData =
        getEmployeeRankData(
          employee.rank,
        );
      const totalBonus =
        employeeHpBonus(snapshot);
      const percentage =
        rankData.pointsToNext === null
          ? 100
          : Math.max(
              0,
              Math.min(
                100,
                employee.cookingPoints /
                  rankData.pointsToNext *
                  100,
              ),
            );
      await openAlert({
        title:
          employee.name,
        body: `
          <section class="employee-status-modal">
            <div class="employee-status-modal__portrait">
              <img src="${escapeAttribute(employee.image)}" alt="">
              <span>EMPLOYEE</span>
            </div>
            <div class="employee-status-modal__main">
              <span>RANK</span>
              <strong>${escapeHtml(employee.rank)}</strong>
              <p>この従業員の効果：プレイヤー全員 HP +${formatNumber(rankData.hpBonus)}</p>
            </div>
            <div class="employee-status-modal__gauge">
              <span><i style="--employee-progress:${percentage}%"></i></span>
              <strong>
                ${
                  rankData.pointsToNext === null
                    ? "MAX RANK"
                    : `${formatNumber(employee.cookingPoints)} / ${formatNumber(rankData.pointsToNext)} 従業員PT`
                }
              </strong>
            </div>
            <dl class="employee-status-modal__summary">
              <div><dt>NEXT RANK</dt><dd>${escapeHtml(rankData.nextRank ?? "MAX")}</dd></div>
              <div><dt>TEAM HP</dt><dd>+${formatNumber(totalBonus)}</dd></div>
              <div><dt>STAFF</dt><dd>${formatNumber(snapshot.employees.length)} / ${formatNumber(EMPLOYEE_RULES.maximumEmployeeCount)}</dd></div>
            </dl>
            <p class="employee-status-modal__note">
              食堂でプレイヤーが食事をするたびに従業員PTを獲得して成長します。
            </p>
          </section>
        `,
        buttonLabel:
          "OK",
      });
      return;
    }
    if (action === "inspect-team-player") {
      const snapshot = stateManager.getSnapshot();
      const player = snapshot.playerTeam.members.find(
        (member) => member.playerId === actionElement.dataset.playerId,
      );
      if (!player) return;
      const labels = {
        stamina: "スタミナ",
        mind: "マインド",
        physical: "フィジカル",
        aim: "エイム",
        agility: "アジリティ",
        technique: "テクニック",
        support: "サポート",
      };
      const pointPool = snapshot.playerTrainingPoints?.[player.playerId] ?? snapshot.trainingPoints;
      const effectiveHp =
        playerEffectiveHp(
          snapshot,
          player,
        );
      await openAlert({
        title: `${player.role} ${player.name}`,
        body: `
          <section class="player-status-modal">
            <img class="player-status-modal__portrait player-portrait" data-role="${escapeAttribute(player.role)}" src="${escapeAttribute(player.image)}" alt="">
            <div class="player-status-modal__head">
              <span>総合RANK ${escapeHtml(player.characterRank)} → ${escapeHtml(playerEffectiveRank(player))}</span>
              ${motivationBadgeTemplate(player.motivation, "motivation-badge--modal")}
              <strong>${escapeHtml(player.weapon.weaponName)}</strong>
              <small>HP ${formatNumber(effectiveHp.currentHp)} / ${formatNumber(effectiveHp.maxHp)} <b>STAFF +${formatNumber(effectiveHp.bonus)}</b></small>
            </div>
            <div class="player-status-modal__weapon-stats">
              <span>CLOSE <strong>${escapeHtml(player.weapon.rangeRanks.close)}</strong></span>
              <span>MID <strong>${escapeHtml(player.weapon.rangeRanks.mid)}</strong></span>
              <span>FAR <strong>${escapeHtml(player.weapon.rangeRanks.far)}</strong></span>
              <span>FIRE <strong>${escapeHtml(player.weapon.fireRateRank)}</strong></span>
              <span>RELOAD <strong>${escapeHtml(player.weapon.reloadRank)}</strong></span>
            </div>
            <div class="player-status-modal__stats">
              ${Object.entries(player.stats).map(([statId, value]) => `<div><span>${escapeHtml(labels[statId] ?? statId)}</span><strong>${value}</strong></div>`).join("")}
            </div>
            <div class="player-status-modal__points">
              <span>POWER ${formatNumber(pointPool.power)}</span><span>TECH ${formatNumber(pointPool.tech)}</span><span>MENTAL ${formatNumber(pointPool.mental)}</span><span>SHOOT ${formatNumber(pointPool.shoot)}</span>
            </div>
            <section class="player-status-modal__specials">
              <header>
                <span>LEARNED SPECIAL</span>
                <strong>${(player.specialAbilities ?? []).length}</strong>
              </header>
              ${
                (player.specialAbilities ?? []).length > 0
                  ? `
                    <div>
                      ${(player.specialAbilities ?? []).map((entry) => {
                        const ability = getSpecialAbility(entry.abilityKey);
                        return `
                          <button
                            type="button"
                            class="player-special-chip player-special-chip--${escapeAttribute(ability.color)} ${Number(entry.stage ?? ability.stage ?? 1) >= 2 ? "is-rainbow" : ""}"
                            data-action="modal-inspect-special"
                            data-ability-key="${escapeAttribute(ability.abilityKey)}"
                          >
                            <i>
                              <img src="${escapeAttribute(ability.image)}" alt="">
                            </i>
                            <span>${escapeHtml(ability.name)}</span>
                            <small>LV.${Number(entry.stage ?? ability.stage ?? 1)}</small>
                          </button>
                        `;
                      }).join("")}
                    </div>
                  `
                  : `<p>習得済みの特殊能力はありません。</p>`
              }
            </section>
            <button type="button" class="primary-button player-status-modal__ability" data-action="modal-open-player-ability" data-player-id="${escapeAttribute(player.playerId)}">能力アップ</button>
          </section>
        `,
        buttonLabel: "閉じる",
      });
      return;
    }
    if (action === "test-grant-resources") {
      const snapshot = stateManager.getSnapshot();
      if (!snapshot?.settings?.testMode) return;
      stateManager.transact("test_mode_resources_granted", (draft) => {
        draft.resources.coin = Math.max(draft.resources.coin, 999_999_999);
        draft.resources.diamond = Math.max(draft.resources.diamond, 99_999);
        draft.resources.ruby = Math.max(draft.resources.ruby, 99_999);
      });
      showToast("TEST MODE：通貨を補充しました");
      renderPreservingPageScroll();
      return;
    }
    if (action === "test-grant-points") {
      const snapshot = stateManager.getSnapshot();
      if (!snapshot?.settings?.testMode) return;
      stateManager.transact("test_mode_points_granted", (draft) => {
        draft.playerTrainingPoints ??= {};
        for (const player of draft.playerTeam.members) {
          draft.playerTrainingPoints[player.playerId] ??= { power: 0, tech: 0, mental: 0, shoot: 0 };
          for (const pointId of ["power", "tech", "mental", "shoot"]) {
            draft.playerTrainingPoints[player.playerId][pointId] = 9999;
          }
        }
      });
      showToast("TEST MODE：全選手の能力PTを補充しました");
      renderPreservingPageScroll();
      return;
    }
    if (action === "test-employee-points") {
      const snapshot =
        stateManager.getSnapshot();
      if (!snapshot?.settings?.testMode) {
        return;
      }
      stateManager.transact(
        "test_employee_cooking_points_granted",
        (draft) => {
          for (const employee of draft.employees) {
            grantEmployeeCookingPointsToDraft(
              draft,
              employee.employeeId,
              25,
              {
                source:
                  "test_mode",
                reason:
                  "TEST MODE 従業員ポイント",
                occurredAt:
                  new Date().toISOString(),
                queuePresentation:
                  true,
              },
            );
          }
        },
      );
      showToast(
        "TEST MODE：全従業員へ従業員PT+25",
      );
      await showPendingEmployeeRankUpPresentation();
      renderPreservingPageScroll();
      return;
    }
    if (action === "test-cooking-supplies") {
      const snapshot =
        stateManager.getSnapshot();
      if (!snapshot?.settings?.testMode) {
        return;
      }
      stateManager.transact(
        "test_cooking_supplies_granted",
        (draft) => {
          for (
            let index = 1;
            index <= 41;
            index += 1
          ) {
            const ingredientId =
              `ingredient_${String(index).padStart(2, "0")}`;
            draft.cooking.ingredientInventory[
              ingredientId
            ] = Math.max(
              20,
              draft.cooking.ingredientInventory[
                ingredientId
              ] ??
              0,
            );
          }
          draft.cooking.unlockedUtensilIds =
            [
              "frying_pan",
              "pot",
              "oven",
              "steamer",
              "mixer",
            ];
          draft.cooking.utensilInventory =
            Object.fromEntries(
              draft.cooking
                .unlockedUtensilIds
                .map(
                  (utensilId) => [
                    utensilId,
                    1,
                  ],
                ),
            );
        },
      );
      showToast(
        "TEST MODE：食材41種と調理器具5種を解放しました",
      );
      renderPreservingPageScroll();
      return;
    }
    if (action === "test-max-player-build") {
      const snapshot = stateManager.getSnapshot();
      if (!snapshot?.settings?.testMode) return;
      const transaction = stateManager.transact(
        "test_mode_player_build_maxed",
        (draft) => applyTestMaxPlayerBuildToDraft(draft),
      );
      showToast(
        `TEST MODE：${transaction.result.playerCount}選手を完全MAXへ設定しました`,
      );
      renderPreservingPageScroll();
      return;
    }
    if (action === "test-advance-week") {
      const snapshot = stateManager.getSnapshot();
      if (!snapshot?.settings?.testMode) return;
      const weeks = Math.max(1, Math.min(52, Number(actionElement.dataset.weeks) || 1));
      stateManager.advanceWeeks(weeks, { grantWeeklyBonus: true });
      showToast(`TEST MODE：${weeks}週進めました`);
      render();
      return;
    }
    if (action === "select-team-player") {
      selectedTeamPlayerId = actionElement.dataset.playerId;
      abilityPlanPlayerId = selectedTeamPlayerId;
      weaponPlanPlayerId = selectedTeamPlayerId;
      abilityUpgradePlan = {};
      weaponUpgradePlan = {};
      if (route === ROUTES.specialAbility) {
        updateTeamFeatureLiveSection("special");
      } else if (
        route === ROUTES.ability
      ) {
        renderPreservingPageScroll();
      } else {
        render();
      }
      return;
    }
    if (action === "select-development-tab") {
      developmentMode =
        ["ability", "weapon", "skill", "special"].includes(
          actionElement.dataset.developmentTab,
        )
          ? actionElement.dataset.developmentTab
          : "ability";
      renderPreservingPageScroll();
      return;
    }
    if (action === "open-upgrade-node") {
      const kind =
        actionElement.dataset
          .upgradeKind ===
        "weapon"
          ? "weapon"
          : "ability";
      const playerId =
        actionElement.dataset
          .playerId;
      const statId =
        actionElement.dataset
          .statId;
      if (
        !playerId ||
        !statId
      ) {
        return;
      }
      openUpgradeNodePopup({
        kind,
        playerId,
        statId,
      });
      return;
    }
    if (action === "select-ability-color") {
      selectedAbilityColor =
        actionElement.dataset.abilityColor;
      if (
        route === ROUTES.ability &&
        developmentMode === "special"
      ) {
        renderPreservingPageScroll();
      } else {
        updateTeamFeatureLiveSection("special");
      }
      return;
    }
    if (action === "ability-plan-plus" || action === "ability-plan-minus") {
      const playerId = actionElement.dataset.playerId;
      const statId = actionElement.dataset.statId;
      if (abilityPlanPlayerId !== playerId) {
        abilityPlanPlayerId = playerId;
        abilityUpgradePlan = {};
      }
      const current = Math.max(0, abilityUpgradePlan[statId] ?? 0);
      const next = action === "ability-plan-plus" ? current + 1 : Math.max(0, current - 1);
      const candidate = { ...abilityUpgradePlan, [statId]: next };
      const plan = calculatePlayerStatUpgradePlan(stateManager.getSnapshot(), playerId, candidate);
      if (plan.affordable) {
        abilityUpgradePlan = plan.increments;
        updateTeamFeatureLiveSection("ability");
      }
      return;
    }
    if (action === "ability-plan-confirm") {
      const playerId = actionElement.dataset.playerId;
      const plan = calculatePlayerStatUpgradePlan(stateManager.getSnapshot(), playerId, abilityUpgradePlan);
      if (!plan.hasChanges || !plan.affordable) return;
      const confirmed = await openConfirm({
        title: "能力アップを確定しますか？",
        body: `<p>${plan.rows.reduce((sum, row) => sum + row.increment, 0)}段階をまとめて強化します。</p>`,
        confirmLabel: "確定する",
      });
      if (!confirmed) return;
      try {
        const transaction = stateManager.transact(
          "player_stats_upgraded_batch",
          (draft) => applyPlayerStatUpgradePlanToDraft(draft, playerId, abilityUpgradePlan),
        );
        abilityUpgradePlan = {};
        const latest =
          stateManager.getSnapshot();
        const player =
          latest.playerTeam.members.find(
            (member) =>
              member.playerId ===
              playerId,
          );
        await playProgressionPresentation({
          kind: "ability",
          label: "ABILITY UP",
          rankUp: true,
          title: "選手能力アップ",
          subject: player?.name ?? "",
          entries:
            transaction.result.results.map(
              (result) => ({
                label:
                  GROWTH_STAT_LABELS[
                    result.statId
                  ] ?? result.statId,
                before:
                  `${result.previousRank} / ${result.previousValue}`,
                after:
                  `${result.currentRank} / ${result.currentValue}`,
                icon:
                  "icon/ab.png",
              }),
            ),
        });
        showToast(`${transaction.result.totalUpgrades}段階を強化しました`);
        updateTeamFeatureLiveSection("ability");
      } catch (error) {
        await openAlert({
          title: "能力を強化できません",
          body: `<p>${escapeHtml(error.message)}</p>`,
          code: getErrorCode(error),
        });
      }
      return;
    }
    if (
      action === "weapon-plan-plus" ||
      action === "weapon-plan-minus"
    ) {
      const playerId = actionElement.dataset.playerId;
      const statId =
        actionElement.dataset.weaponStatId;
      if (weaponPlanPlayerId !== playerId) {
        weaponPlanPlayerId = playerId;
        weaponUpgradePlan = {};
      }
      const current = Math.max(
        0,
        weaponUpgradePlan[statId] ?? 0,
      );
      const next =
        action === "weapon-plan-plus"
          ? current + 1
          : Math.max(0, current - 1);
      const candidate = {
        ...weaponUpgradePlan,
        [statId]: next,
      };
      const plan = calculateWeaponUpgradePlan(
        stateManager.getSnapshot(),
        playerId,
        candidate,
      );
      if (plan.affordable) {
        weaponUpgradePlan = plan.increments;
        updateTeamFeatureLiveSection("equipment");
      }
      return;
    }

    if (action === "weapon-plan-confirm") {
      const playerId = actionElement.dataset.playerId;
      const plan = calculateWeaponUpgradePlan(
        stateManager.getSnapshot(),
        playerId,
        weaponUpgradePlan,
      );
      if (!plan.hasChanges || !plan.affordable) return;
      const confirmed = await openConfirm({
        title: "武器強化を確定しますか？",
        body: `<p>${plan.rows.reduce((sum, row) => sum + row.increment, 0)}段階をまとめて強化します。</p><p>必要COIN ${formatNumber(plan.totalCoin)}</p>${plan.totalRuby > 0 ? `<p>必要RUBY ${formatNumber(plan.totalRuby)}</p>` : ""}`,
        confirmLabel: "確定する",
      });
      if (!confirmed) return;
      try {
        const transaction = stateManager.transact(
          "weapon_stats_upgraded_batch",
          (draft) =>
            applyWeaponUpgradePlanToDraft(
              draft,
              playerId,
              weaponUpgradePlan,
            ),
        );
        weaponUpgradePlan = {};
        const latest =
          stateManager.getSnapshot();
        const player =
          latest.playerTeam.members.find(
            (member) =>
              member.playerId ===
              playerId,
          );
        await playProgressionPresentation({
          kind: "weapon",
          label: "WEAPON UP",
          rankUp: true,
          title: "武器能力アップ",
          subject:
            `${player?.name ?? ""} / ${player?.weapon.weaponName ?? ""}`,
          entries:
            transaction.result.results.map(
              (result) => ({
                label:
                  GROWTH_STAT_LABELS[
                    result.weaponStatId
                  ] ??
                  result.weaponStatId,
                before:
                  result.previousRank,
                after:
                  result.currentRank,
                icon:
                  "menu/eq.png",
              }),
            ),
        });
        showToast(
          `${transaction.result.totalUpgrades}段階を強化しました`,
        );
        updateTeamFeatureLiveSection("equipment");
      } catch (error) {
        await openAlert({
          title: "武器を強化できません",
          body: `<p>${escapeHtml(error.message)}</p>`,
          code: getErrorCode(error),
        });
      }
      return;
    }

    if (action === "upgrade-weapon-stat") {
      const playerId = actionElement.dataset.playerId;
      const weaponStatId = actionElement.dataset.weaponStatId;
      const confirmed = await openConfirm({
        title: "武器能力を強化しますか？",
        body: "<p>COINを消費します。</p>",
        confirmLabel: "強化する",
      });
      if (!confirmed) {
        return;
      }
      try {
        const transaction = stateManager.transact(
          "weapon_stat_upgraded",
          (draft) =>
            upgradeWeaponStatToDraft(
              draft,
              playerId,
              weaponStatId,
            ),
        );
        const latest =
          stateManager.getSnapshot();
        const player =
          latest.playerTeam.members.find(
            (member) =>
              member.playerId ===
              playerId,
          );
        await playProgressionPresentation({
          kind: "weapon",
          label: "WEAPON UP",
          rankUp: true,
          title: "武器能力アップ",
          subject:
            `${player?.name ?? ""} / ${player?.weapon.weaponName ?? ""}`,
          entries: [{
            label:
              GROWTH_STAT_LABELS[
                transaction.result.weaponStatId
              ] ??
              transaction.result.weaponStatId,
            before:
              transaction.result.previousRank,
            after:
              transaction.result.currentRank,
            icon:
              "menu/eq.png",
          }],
        });
        showToast(
          `${transaction.result.previousRank} → ${transaction.result.currentRank}`,
        );
        render();
      } catch (error) {
        await openAlert({
          title: "武器を強化できません",
          body: `<p>${escapeHtml(error.message)}</p>`,
          code: getErrorCode(error),
        });
      }
      return;
    }
    if (action === "rename-weapon") {
      const playerId = actionElement.dataset.playerId;
      const snapshot = stateManager.getSnapshot();
      const player = snapshot.playerTeam.members.find(
        (member) => member.playerId === playerId,
      );
      const weaponName = await openTextPrompt({
        title: "武器名を変更",
        body: "<p>大会・実況・記録でもこの名称を使用します。</p>",
        initialValue: player.weapon.weaponName,
        maximumLength: 60,
      });
      if (weaponName === false) {
        return;
      }
      try {
        stateManager.transact("weapon_renamed", (draft) =>
          renameWeaponToDraft(draft, playerId, weaponName),
        );
        showToast("武器名を変更しました");
        render();
      } catch (error) {
        await openAlert({
          title: "武器名を変更できません",
          body: `<p>${escapeHtml(error.message)}</p>`,
          code: getErrorCode(error),
        });
      }
      return;
    }
    if (action === "change-weapon-skin") {
      const playerId = actionElement.dataset.playerId;
      const select = root.querySelector("#weaponSkinSelect");
      const skinId = select?.value;
      try {
        stateManager.transact("weapon_skin_changed", (draft) =>
          changeWeaponSkinToDraft(draft, playerId, skinId),
        );
        showToast("武器スキンを変更しました");
        render();
      } catch (error) {
        await openAlert({
          title: "スキンを変更できません",
          body: `<p>${escapeHtml(error.message)}</p>`,
          code: getErrorCode(error),
        });
      }
      return;
    }
    if (action === "upgrade-player-skill") {
      const playerId = actionElement.dataset.playerId;
      const skillId = actionElement.dataset.skillId;
      const snapshot = stateManager.getSnapshot();
      const player = snapshot.playerTeam.members.find(
        (member) => member.playerId === playerId,
      );
      const skill = player?.skills?.find(
        (entry) => entry.skillId === skillId,
      );
      if (!skill) return;
      const confirmed = await openConfirm({
        title: `${skill.customName ?? skill.name}を強化しますか？`,
        body: `<p>通常攻撃と武器の価値を残すため、CTと効果を段階的に強化します。</p><p>現在LV ${skill.level ?? 1}</p>`,
        confirmLabel: "スキル強化",
      });
      if (!confirmed) return;
      try {
        const transaction = stateManager.transact(
          "player_skill_upgraded",
          (draft) => upgradePlayerSkillToDraft(draft, playerId, skillId),
        );
        const latest =
          stateManager.getSnapshot();
        const player =
          latest.playerTeam.members.find(
            (member) =>
              member.playerId ===
              playerId,
          );
        await playProgressionPresentation({
          kind: "skill",
          label: "SKILL LEVEL UP",
          rankUp: true,
          title:
            transaction.result.name,
          subject:
            player?.name ?? "",
          entries: [{
            label: "SKILL LEVEL",
            before:
              `LV ${transaction.result.previousLevel}`,
            after:
              `LV ${transaction.result.currentLevel}`,
            note:
              `CT ${transaction.result.profile.cooldownReductionPercent.toFixed(1)}%短縮 / 効果 +${transaction.result.profile.powerIncreasePercent.toFixed(1)}%`,
            icon:
              "icon/sp.png",
          }],
        });
        showToast(
          `${transaction.result.name} LV${transaction.result.currentLevel}へ強化`,
        );
        updateTeamFeatureLiveSection("skill");
      } catch (error) {
        await openAlert({
          title: "スキルを強化できません",
          body: `<p>${escapeHtml(error.message)}</p>`,
          code: getErrorCode(error),
        });
      }
      return;
    }
    if (action === "rename-player-skill") {
      const playerId = actionElement.dataset.playerId;
      const skillId = actionElement.dataset.skillId;
      const snapshot = stateManager.getSnapshot();
      const player = snapshot.playerTeam.members.find(
        (member) => member.playerId === playerId,
      );
      const skill = player?.skills?.find(
        (entry) => entry.skillId === skillId,
      );
      if (!skill) return;
      const nextName = await openTextPrompt({
        title: "スキル名を変更",
        body: `<p>大会実況とスキルカットインにも反映されます。空欄で初期名へ戻します。</p>`,
        initialValue: skill.customName ?? skill.name,
        maximumLength: 24,
      });
      if (nextName === false) return;
      try {
        const transaction = stateManager.transact(
          "player_skill_renamed",
          (draft) => renamePlayerSkillToDraft(draft, playerId, skillId, nextName),
        );
        showToast(`${transaction.result.name}へ変更しました`);
        updateTeamFeatureLiveSection("skill");
      } catch (error) {
        await openAlert({
          title: "スキル名を変更できません",
          body: `<p>${escapeHtml(error.message)}</p>`,
          code: getErrorCode(error),
        });
      }
      return;
    }
    if (action === "inspect-special-ability") {
      const playerId =
        actionElement.dataset.playerId;
      const abilityKey =
        actionElement.dataset.abilityKey;
      const snapshot =
        stateManager.getSnapshot();
      const acquisition =
        getAbilityAcquisitionState(
          snapshot,
          playerId,
          abilityKey,
        );
      const ability =
        acquisition.ability;
      const family =
        acquisition.family ??
        getSpecialAbility(
          abilityKey,
        );
      const costRows =
        Object.entries(
          ability.cost,
        )
          .filter(
            ([, amount]) =>
              amount > 0,
          )
          .map(
            ([pointId, amount]) =>
              `<span>${escapeHtml(pointId.toUpperCase())} ${formatNumber(amount)}</span>`,
          )
          .join("") ||
        "<span>PT 0</span>";
      const conditionRows =
        acquisition
          .conditionState
          .details
          .map(
            (detail) => `
              <li class="${detail.met ? "is-met" : ""}">
                <span>${escapeHtml(specialConditionText(detail))}</span>
                <strong>${formatNumber(detail.current)} / ${formatNumber(detail.required)}</strong>
              </li>
            `,
          )
          .join("");
      const status =
        acquisition.maxed
          ? "LEVEL 2・最大強化済みです"
          : acquisition.currentLevel === 1
            ? "LEVEL 2へ強化できます"
            : !acquisition.conditionState.unlocked
              ? "解放条件を満たしていません"
              : !acquisition.affordable
                ? "トレーニングポイントが不足しています"
                : "LEVEL 1を習得できます";
      const body = `
        <section
          class="ability-detail-modal ability-detail-modal--generation50 ability-detail-modal--${escapeAttribute(family.color)} ${acquisition.rainbow ? "is-rainbow" : ""}"
        >
          <div class="ability-detail-modal__visual">
            <img
              src="${escapeAttribute(family.image)}"
              alt=""
            >
          </div>
          <span>
            ${family.color === "gold" ? "GOLD" : "NORMAL"}
            / No.${escapeHtml(family.abilityId)}
          </span>
          <h3>${escapeHtml(family.name)}</h3>
          <b>現在 LEVEL ${acquisition.currentLevel} / 最大 LEVEL 2</b>
          <p>${escapeHtml(ability.description)}</p>
          <div class="ability-detail-modal__cost">
            ${costRows}
          </div>
          <section class="ability-unlock-detail">
            <h4>獲得可能役職</h4>
            <p>${escapeHtml(family.roles.join(" / "))}</p>
            ${
              conditionRows
                ? `<ul class="ability-detail-modal__conditions">${conditionRows}</ul>`
                : `<p>大会実績による追加条件はありません。</p>`
            }
          </section>
          <strong>${escapeHtml(status)}</strong>
        </section>
      `;
      if (!acquisition.learnable) {
        await openAlert({
          title: "特殊能力詳細",
          body,
          buttonLabel: "閉じる",
        });
        return;
      }
      const confirmed =
        await openConfirm({
          title:
            acquisition.currentLevel === 1
              ? "特殊能力をLEVEL 2へ強化しますか？"
              : "特殊能力を習得しますか？",
          body,
          confirmLabel:
            acquisition.currentLevel === 1
              ? "強化する"
              : "習得する",
        });
      if (!confirmed) {
        return;
      }
      try {
        const transaction =
          stateManager.transact(
            acquisition.currentLevel === 1
              ? "special_ability_upgraded"
              : "special_ability_learned",
            (draft) =>
              learnSpecialAbilityToDraft(
                draft,
                playerId,
                abilityKey,
              ),
          );
        const latest =
          stateManager.getSnapshot();
        const player =
          latest.playerTeam.members.find(
            (member) =>
              member.playerId ===
              playerId,
          );
        await playProgressionPresentation({
          kind: "special",
          label:
            transaction.result.stage === 2
              ? "SPECIAL ABILITY LEVEL 2"
              : "SPECIAL ABILITY ACQUIRED",
          rankUp: false,
          title:
            transaction.result.stage === 2
              ? "特殊能力強化"
              : "特殊能力習得",
          subject:
            player?.name ?? "",
          entries: [{
            label:
              transaction.result.name,
            before:
              transaction.result.stage === 2
                ? "LEVEL 1"
                : "LOCKED",
            after:
              `LEVEL ${transaction.result.stage}`,
            note:
              transaction.result.stage === 2
                ? "虹色の強化枠へ更新"
                : "大会中は装備不要で常時有効",
            icon:
              transaction.result.image ??
              "icon/sp.png",
          }],
        });
        showToast(
          transaction.result.stage === 2
            ? `${transaction.result.name}をLEVEL 2へ強化しました`
            : `${transaction.result.name}を習得しました`,
        );
        updateTeamFeatureLiveSection(
          "special",
        );
      } catch (error) {
        await openAlert({
          title:
            "特殊能力を習得できません",
          body:
            `<p>${escapeHtml(error.message)}</p>`,
          code:
            getErrorCode(error),
        });
      }
      return;
    }
    if (action === "learn-special-ability") {
      const playerId = actionElement.dataset.playerId;
      const abilityKey = actionElement.dataset.abilityKey;
      const confirmed = await openConfirm({
        title: "特殊能力を習得しますか？",
        body:
          "<p>4種類のトレーニングポイントを消費します。習得後は装備不要で常時有効です。</p>",
        confirmLabel: "習得する",
      });
      if (!confirmed) {
        return;
      }
      try {
        const transaction = stateManager.transact(
          "special_ability_learned",
          (draft) =>
            learnSpecialAbilityToDraft(
              draft,
              playerId,
              abilityKey,
            ),
        );
        const latest =
          stateManager.getSnapshot();
        const player =
          latest.playerTeam.members.find(
            (member) =>
              member.playerId ===
              playerId,
          );
        await playProgressionPresentation({
          kind: "special",
          label: "SPECIAL ABILITY ACQUIRED",
          rankUp: false,
          title: "特殊能力習得",
          subject:
            player?.name ?? "",
          entries: [{
            label:
              transaction.result.name,
            before: "LOCKED",
            after: "ACTIVE",
            note:
              "大会中は装備不要で常時有効",
            icon:
              "icon/sp.png",
          }],
        });
        showToast(`${transaction.result.name}を習得しました`);
        updateTeamFeatureLiveSection("special");
      } catch (error) {
        await openAlert({
          title: "特殊能力を習得できません",
          body: `<p>${escapeHtml(error.message)}</p>`,
          code: getErrorCode(error),
        });
      }
      return;
    }

    if (await tournamentBridgeController.handleAction(actionElement)) {
      return;
    }

    if (await managementController.handleAction(actionElement)) {
      return;
    }
  });

  modalRoot.addEventListener("click", (event) => {
    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) {
      return;
    }

    if (
      actionElement.dataset.action ===
      "modal-upgrade-plus"
    ) {
      adjustUpgradeNodePlan(
        "plus",
      );
    } else if (
      actionElement.dataset.action ===
      "modal-upgrade-minus"
    ) {
      adjustUpgradeNodePlan(
        "minus",
      );
    } else if (
      actionElement.dataset.action ===
      "modal-upgrade-close"
    ) {
      closeModal(false);
    } else if (actionElement.dataset.action === "modal-inspect-special") {
      const ability =
        getSpecialAbility(
          actionElement.dataset.abilityKey,
        );
      closeModal("special-detail");
      queueMicrotask(() =>
        openAlert({
          title: ability.name,
          body: `
            <section class="player-special-detail player-special-detail--${escapeAttribute(ability.color)} ${Number(ability.stage ?? 1) >= 2 ? "is-rainbow" : ""}">
              <i><img src="${escapeAttribute(ability.image)}" alt=""></i>
              <span>${escapeHtml(ability.rarity?.toUpperCase?.() ?? ability.color.toUpperCase())} / No.${escapeHtml(ability.abilityId)} / LEVEL ${Number(ability.stage ?? 1)}</span>
              <h3>${escapeHtml(ability.name)}</h3>
              <p>${escapeHtml(ability.description)}</p>
              <small>習得済み・大会中は装備不要で常時有効です。</small>
            </section>
          `,
          buttonLabel: "閉じる",
        }),
      );
    } else if (actionElement.dataset.action === "modal-open-player-ability") {
      const playerId = actionElement.dataset.playerId;
      closeModal("ability");
      selectedTeamPlayerId = playerId;
      abilityPlanPlayerId = playerId;
      abilityUpgradePlan = {};
      route = ROUTES.ability;
      try {
        stateManager.transact("ui_route_changed", (draft) => {
          draft.ui.lastScreen = ROUTES.ability;
          draft.ui.lastSubScreen = null;
        });
      } catch (_error) {}
      render();
    } else if (actionElement.dataset.action === "modal-quantity-minus") {
      modalQuantityValue = Math.max(
        1,
        modalQuantityValue - 1,
      );
      const value =
        modalRoot.querySelector("[data-quantity-value]");
      if (value) {
        value.textContent = String(modalQuantityValue);
      }
    } else if (actionElement.dataset.action === "modal-quantity-plus") {
      modalQuantityValue = Math.min(
        99,
        modalQuantityValue + 1,
      );
      const value =
        modalRoot.querySelector("[data-quantity-value]");
      if (value) {
        value.textContent = String(modalQuantityValue);
      }
    } else if (actionElement.dataset.action === "modal-quantity-confirm") {
      closeModal(modalQuantityValue);
    } else if (actionElement.dataset.action === "modal-confirm") {
      closeModal(true);
    } else if (
      actionElement.dataset.action === "modal-text-confirm"
    ) {
      const value =
        modalRoot.querySelector("#modalTextInput")?.value.trim() ?? "";
      closeModal(value);
    } else if (actionElement.dataset.action === "modal-cancel") {
      closeModal(false);
    } else if (
      actionElement.dataset.action === "dismiss-alert" &&
      event.target === actionElement
    ) {
      closeModal(true);
    }
  });


  function installAcceleratedRepeat(container) {
    let delayTimer = null;
    let repeatTimer = null;
    let activeIdentity = null;
    let startedAt = 0;
    let repeated = false;
    let suppressTrustedClickUntil = 0;

    function datasetAttributeName(key) {
      return `data-${key.replace(
        /[A-Z]/g,
        (letter) => `-${letter.toLowerCase()}`,
      )}`;
    }

    function captureIdentity(button) {
      const attributes = Object.entries(button.dataset)
        .filter(
          ([key, value]) =>
            key !== "repeatAction" &&
            value !== undefined &&
            value !== "",
        )
        .map(([key, value]) => [
          datasetAttributeName(key),
          value,
        ]);
      return {
        attributes,
        action: button.dataset.action,
      };
    }

    function resolveButton(identity) {
      if (!identity) return null;
      const buttons = container.querySelectorAll(
        `button[data-action="${CSS.escape(identity.action)}"]`,
      );
      return [...buttons].find((button) =>
        identity.attributes.every(
          ([name, value]) =>
            button.getAttribute(name) === value,
        ),
      ) ?? null;
    }

    const stop = () => {
      if (delayTimer !== null) {
        clearTimeout(delayTimer);
      }
      if (repeatTimer !== null) {
        clearTimeout(repeatTimer);
      }
      delayTimer = null;
      repeatTimer = null;
      activeIdentity = null;
    };

    const schedule = () => {
      const button = resolveButton(activeIdentity);
      if (!button || button.disabled) {
        stop();
        return;
      }

      repeated = true;
      suppressTrustedClickUntil =
        performance.now() + 500;
      button.click();

      const held =
        performance.now() - startedAt;
      const delay =
        held > 2600
          ? 42
          : held > 1800
            ? 64
            : held > 1050
              ? 92
              : 132;
      repeatTimer =
        setTimeout(schedule, delay);
    };

    container.addEventListener(
      "pointerdown",
      (event) => {
        const button =
          event.target.closest(
            "button[data-repeat-action]",
          );
        if (!button || button.disabled) return;

        stop();
        repeated = false;
        activeIdentity =
          captureIdentity(button);
        startedAt = performance.now();

        try {
          button.setPointerCapture?.(
            event.pointerId,
          );
        } catch (_error) {
          // Pointer capture is an enhancement only.
        }

        delayTimer = setTimeout(
          schedule,
          340,
        );
      },
    );

    const finishPointer = () => {
      stop();
    };
    document.addEventListener(
      "pointerup",
      finishPointer,
      true,
    );
    document.addEventListener(
      "pointercancel",
      finishPointer,
      true,
    );
    globalThis.addEventListener?.(
      "blur",
      finishPointer,
    );

    container.addEventListener(
      "click",
      (event) => {
        if (
          repeated &&
          event.isTrusted &&
          performance.now() <
            suppressTrustedClickUntil &&
          event.target.closest(
            "button[data-repeat-action]",
          )
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
          repeated = false;
        }
      },
      true,
    );

    container.addEventListener(
      "contextmenu",
      (event) => {
        if (
          event.target.closest(
            "button[data-repeat-action]",
          )
        ) {
          event.preventDefault();
        }
      },
    );
  }

  async function start() {
    const portraitObserver =
      new MutationObserver(
        scheduleMainPortraitBalance,
      );
    portraitObserver.observe(
      root,
      {
        childList: true,
        subtree: true,
      },
    );
    portraitObserver.observe(
      modalRoot,
      {
        childList: true,
        subtree: true,
      },
    );
    installAcceleratedRepeat(root);
    installAcceleratedRepeat(modalRoot);
    showLoading("画像を読み込んでいます");
    await detectAssetPrefix("back/local.png");
    installAssetFallbacks(document);
    await preloadImages([
      assetPath("back/Load.png"), assetPath("back/main1.png"), assetPath("back/sub.png"), assetPath("back/coh.png"),
      assetPath("back/homecol.png"), assetPath("back/backcol.png"), assetPath("back/backcoh.png"), assetPath("back/backshop.png"),
      assetPath("back/kitmain.png"), assetPath("back/kitroom.png"), assetPath("icon/kitbox.png"),
      ...Array.from({ length: 54 }, (_, index) =>
        assetPath(`ability/${String(index + 1).padStart(2, "0")}.png`)
      ),
      ...Array.from({ length: 5 }, (_, index) =>
        assetPath(`icon/${String(index + 1).padStart(2, "0")}.png`)
      ),
      ...Array.from({ length: 41 }, (_, index) =>
        assetPath(`sk/${String(index + 1).padStart(2, "0")}.png`)
      ),
      ...Array.from({ length: 16 }, (_, index) =>
        assetPath(`home/${String(index + 1).padStart(2, "0")}.png`)
      ),
      "icon/pink.png", "icon/white.png", "icon/rankup.png", "icon/kigyo.png", "icon/weponup.png", "icon/skillup.png", "icon/brtetsu.png",
      "menu/home.png", "menu/team.png", "menu/traning.png", "menu/COL.png",
      "icon/coin.png", "icon/daia.png", "icon/rubi.png",
    ]);
    loadingMessage.textContent = "セーブデータを確認しています";

    try {
      const summary = inspectSaveSummary();
      if (summary && !summary.corrupted) {
        stateManager.load();
      }
    } catch (error) {
      if (!(error instanceof SaveNotFoundError)) {
        console.error(error);
      }
    } finally {
      const returnHome = globalThis.location?.hash === "#home" && Boolean(stateManager.getSnapshot());
      route = returnHome ? ROUTES.home : ROUTES.title;
      await preloadImages(snapshotCriticalImagePaths(stateManager.getSnapshot()), 10000);
      if (returnHome && globalThis.history?.replaceState) {
        globalThis.history.replaceState(null, "", globalThis.location.pathname + globalThis.location.search);
      }
      titleSettingsOpen = false;
      root.dataset.mode = "";
      render();
      hideLoading();
      queueMicrotask(() =>
        tournamentBridgeController.importPendingResultIfAvailable(),
      );
    }
  }

  return Object.freeze({
    start,
    render,
    navigate,
    showToast,
    openAlert,
    openConfirm,
    getSnapshot: () => stateManager.getSnapshot(),
  });
}

function bootstrap() {
  const root = document.querySelector("#app");
  const modalRoot = document.querySelector("#modalRoot");
  const toastRoot = document.querySelector("#toastRoot");
  const loadingOverlay = document.querySelector("#loadingOverlay");
  const loadingMessage = document.querySelector("#loadingMessage");

  const app = createMainApp({
    root,
    modalRoot,
    toastRoot,
    loadingOverlay,
    loadingMessage,
    storage: window.localStorage,
  });

  app.start();
  globalThis.mobBrApp = app;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, {
      once: true,
    });
  } else {
    bootstrap();
  }
}
