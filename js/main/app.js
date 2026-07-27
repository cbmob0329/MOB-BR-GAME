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
  SaveError,
  SaveNotFoundError,
  createGameStateManager,
} from "./state.js";
import {
  applyPlayerStatUpgradePlanToDraft,
  calculatePlayerStatUpgradePlan,
  changeWeaponSkinToDraft,
  getAbilityAcquisitionState,
  getSelectedPlayerId,
  learnSpecialAbilityToDraft,
  renameWeaponToDraft,
  renderAbilityUpSection,
  renderEquipmentSection,
  renderSpecialAbilitySection,
  renderTeamDetailsSection,
  upgradePlayerStatToDraft,
  upgradeWeaponStatToDraft,
} from "./team.js";
import {
  getSpecialAbility,
} from "../../data/ability-data.js";
import {
  createManagementController,
  getTournamentWeekStatus,
  renderManagementSection,
} from "./management.js?v=22";
import {
  createTournamentBridgeController,
  renderTournamentSchedule,
} from "./tournament-bridge.js";

export const APP_VERSION = "mobbr-main-app-1.0.2";

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

const MANAGEMENT_ROUTES = Object.freeze([
  ROUTES.train,
  ROUTES.collection,
  ROUTES.shop,
  ROUTES.room,
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
    backgroundClass: "screen--sub",
    icon: "menu/team.png",
  },
  [ROUTES.train]: {
    title: "TRAINING",
    description: "3選手の1週間トレーニング",
    backgroundClass: "screen--coh",
    icon: assetPath("menu/traning.png"),
  },
  [ROUTES.collection]: {
    title: "COLLECTION",
    description: "カード・バッジ・その他コレクション",
    backgroundClass: "screen--sub",
    icon: assetPath("menu/COL.png"),
  },
  [ROUTES.shop]: {
    title: "SHOP",
    description: "アイテム・カードパック・武器スキン",
    backgroundClass: "screen--sub",
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
  [ROUTES.coach]: {
    title: "COACH",
    description: "コーチ管理と作戦会議",
    backgroundClass: "screen--coh",
    icon: "menu/coach.png",
  },
  [ROUTES.scout]: {
    title: "SCOUT",
    description: "コーチ専用スカウト",
    backgroundClass: "screen--coh",
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
    backgroundClass: "screen--sub",
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
    title: "ABILITY UP",
    description: "7能力の強化",
    backgroundClass: "screen--sub",
    icon: "icon/ab.png",
  },
  [ROUTES.specialAbility]: {
    title: "SPECIAL ABILITY",
    description: "青・金・赤の特殊能力",
    backgroundClass: "screen--sub",
    icon: "icon/sp.png",
  },
});

const FACILITY_DEFINITIONS = Object.freeze([
  { facilityId: "team_lab", name: "TEAM LAB", japaneseName: "チームラボ", note: "チーム育成・装備・コレクション", status: "OPEN", accent: "LAB" },
  { facilityId: "mob_shop", name: "MOB SHOP", japaneseName: "MOB SHOP", note: "ショップ・パック・商品購入", status: "OPEN", accent: "SHOP" },
  { facilityId: "cooking", name: "COOKING", japaneseName: "料理", note: "食材購入とキッチン機能", status: "LOCKED", accent: "COMING SOON" },
  { facilityId: "mob_room", name: "MOB ROOM", japaneseName: "モブルーム", note: "部屋を選択してコレクションを配置", status: "OPEN", accent: "ROOM" },
]);

const FACILITY_MENUS = Object.freeze({
  team_lab: Object.freeze([
    { route: ROUTES.team, name: "TEAM", note: "選手ステータス", icon: "menu/team.png" },
    { route: ROUTES.train, name: "TRAINING", note: "週間育成", icon: "menu/traning.png" },
    { route: ROUTES.equipment, name: "EQUIPMENT", note: "武器・バッグ", icon: "menu/eq.png" },
    { route: ROUTES.ability, name: "ABILITY UP", note: "7能力強化", icon: "icon/ab.png" },
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
  cooking: Object.freeze([]),
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
    route: ROUTES.equipment,
    name: "Equipment",
    note: "武器とバッグ",
    icon: "menu/eq.png",
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
    name: "Ability Up",
    note: "7能力強化",
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
  { route: ROUTES.facility, name: "FACILITY", icon: "menu/team.png" },
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

function playerRowTemplate(player) {
  return `
    <button type="button" class="player-row player-row--tap" data-action="inspect-team-player" data-player-id="${escapeAttribute(player.playerId)}">
      <img
        class="player-row__image"
        src="${escapeAttribute(player.image)}"
        alt="${escapeAttribute(player.name)}"
      >
      <div class="player-row__main">
        <div class="player-row__name">${escapeHtml(player.name)}</div>
        <div class="player-row__weapon">
          ${escapeHtml(player.weapon.weaponName)} / ${escapeHtml(player.characterRank)}
        </div>
      </div>
      <span class="role-badge">${escapeHtml(player.role)}</span>
      <span class="player-row__tap">TAP</span>
    </button>
  `;
}

function topStatusTemplate(snapshot) {
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
            <span>${escapeHtml(snapshot.company.companyName)}</span>
          </div>
          <div class="top-status__date">
            ${escapeHtml(formatGameDate(snapshot.gameDate))}
          </div>
        </div>
        <div class="resource-list" aria-label="所持通貨">
          <div class="resource-chip">
            <img src=assetPath("icon/coin.png") alt="">
            <span class="resource-chip__value">
              ${formatNumber(snapshot.resources.coin)}
            </span>
          </div>
          <div class="resource-chip">
            <img src=assetPath("icon/daia.png") alt="">
            <span class="resource-chip__value">
              ${formatNumber(snapshot.resources.diamond)}
            </span>
          </div>
          <div class="resource-chip">
            <img src=assetPath("icon/rubi.png") alt="">
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

function homeTemplate(snapshot, currentRoute) {
  const tournamentWeek = getTournamentWeekStatus(snapshot);
  const tournamentNotice = tournamentWeek.hasTournament
    ? `<section class="home-tournament-notice ${tournamentWeek.trainingBlocked ? "is-entry" : "is-observer"}">
        <img src="${escapeAttribute((() => {
          const type = tournamentWeek.details[0]?.event.tournamentType ?? "local";
          if (type === "national") return "icon/national.png";
          if (type.startsWith("world")) return "icon/world.png";
          if (type === "championship") return "icon/champ.png";
          return "icon/local.png";
        })())}" alt="">
        <div>
          <span>${tournamentWeek.trainingBlocked ? "TOURNAMENT WEEK" : "TOURNAMENT NOTICE"}</span>
          <strong>${escapeHtml(tournamentWeek.details.map((detail) => detail.event.stageName).join(" / "))}</strong>
          <p>${tournamentWeek.trainingBlocked ? "今週は出場予定大会があります。トレーニングは行えません。" : "今週は大会が開催されますが、出場予定はありません。トレーニング可能です。"}</p>
        </div>
        <button type="button" data-action="navigate" data-route="${ROUTES.schedule}">大会予定</button>
      </section>`
    : "";
  return `
    <main class="screen screen--home app-layout">
      ${topStatusTemplate(snapshot)}
      <div class="page-content">
        ${tournamentNotice}
        <section class="hero-panel">
          <p class="hero-panel__label">COMPANY STATUS</p>
          <div class="hero-panel__company-title">
            <img
              class="hero-panel__company-logo"
              src="${escapeAttribute(snapshot.company.badgeImage)}"
              alt=""
            >
            <h1 class="hero-panel__title">
              ${escapeHtml(snapshot.company.companyName)}
            </h1>
          </div>
          <div class="hero-panel__meta">
            <span class="meta-chip">
              企業RANK ${escapeHtml(snapshot.company.rank)}
            </span>
            <span class="meta-chip">
              EXP ${formatNumber(snapshot.company.exp)}
            </span>
            <span class="meta-chip">
              ROOM ${escapeHtml(snapshot.company.activeRoomId)}
            </span>
          </div>
        </section>

        <div class="section-heading">
          <h2>FACILITIES</h2>
          <p>左右へスワイプして施設を選択</p>
        </div>
        <section class="facility-carousel" aria-label="施設一覧">
          ${FACILITY_DEFINITIONS.map((facility) => `
            <button type="button" class="facility-square ${facility.status === "LOCKED" ? "is-locked" : ""}" data-action="open-facility" data-facility-id="${escapeAttribute(facility.facilityId)}" ${facility.status === "LOCKED" ? "disabled" : ""}>
              <span>${escapeHtml(facility.accent)}</span>
              <div class="facility-square__building" aria-hidden="true"><i></i><i></i><i></i></div>
              <strong>${escapeHtml(facility.japaneseName)}</strong>
              <small>${escapeHtml(facility.note)}</small>
              <em>${escapeHtml(facility.status)}</em>
            </button>
          `).join("")}
        </section>

        <div class="section-heading">
          <h2>TEAM MEMBERS</h2>
          <p>IGL / ATK / SUP</p>
        </div>
        ${renderTeamDetailsSection(snapshot)}
      </div>
      ${bottomNavTemplate(currentRoute)}
    </main>
  `;
}

function facilityTemplate(snapshot, currentRoute, selectedFacilityId) {
  const selected = FACILITY_DEFINITIONS.find((facility) => facility.facilityId === selectedFacilityId) ?? FACILITY_DEFINITIONS[0];
  const menu = FACILITY_MENUS[selected.facilityId] ?? [];
  return `
    <main class="screen screen--sub app-layout">
      ${topStatusTemplate(snapshot)}
      <div class="page-content">
        <div class="back-row"><button type="button" class="back-button" data-action="navigate" data-route="${ROUTES.home}">← HOME</button></div>
        <section class="facility-hub-hero"><span>FACILITY SELECT</span><h1>${escapeHtml(selected.japaneseName)}</h1><p>${escapeHtml(selected.note)}</p></section>
        <section class="facility-carousel facility-carousel--hub" aria-label="施設選択">
          ${FACILITY_DEFINITIONS.map((facility) => `
            <button type="button" class="facility-square facility-square--small ${facility.facilityId === selected.facilityId ? "is-selected" : ""} ${facility.status === "LOCKED" ? "is-locked" : ""}" data-action="select-facility" data-facility-id="${escapeAttribute(facility.facilityId)}" ${facility.status === "LOCKED" ? "disabled" : ""}>
              <span>${escapeHtml(facility.accent)}</span><div class="facility-square__building" aria-hidden="true"><i></i><i></i><i></i></div><strong>${escapeHtml(facility.japaneseName)}</strong><em>${escapeHtml(facility.status)}</em>
            </button>`).join("")}
        </section>
        ${selected.status === "LOCKED" ? `<section class="facility-locked-panel"><strong>LOCKED</strong><p>料理機能は今後のアップデートで追加予定です。</p></section>` : `<div class="section-heading"><h2>${escapeHtml(selected.name)} MENU</h2><p>利用する機能を選択</p></div><section class="facility-menu-grid">${menu.map((item) => menuCardTemplate(item)).join("")}</section>`}
      </div>
      ${bottomNavTemplate(currentRoute)}
    </main>`;
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

        <section class="hero-panel">
          <p class="hero-panel__label">TEAM MANAGEMENT</p>
          <h1 class="hero-panel__title">
            ${escapeHtml(snapshot.playerTeam.teamName)}
          </h1>
          <div class="hero-panel__meta">
            <span class="meta-chip">3 MEMBERS</span>
            <span class="meta-chip">
              企業RANK ${escapeHtml(snapshot.company.rank)}
            </span>
          </div>
        </section>

        <section class="content-panel team-summary">
          ${snapshot.playerTeam.members.map(playerRowTemplate).join("")}
        </section>

        <div class="section-heading">
          <h2>TEAM MENU</h2>
          <p>管理項目</p>
        </div>
        <section class="menu-grid">
          ${TEAM_MENU.map((item) => menuCardTemplate(item)).join("")}
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

function teamFeatureTemplate(
  snapshot,
  route,
  currentRoute,
  {
    selectedPlayerId = null,
    abilityColor = "blue",
    abilityPlan = {},
  } = {},
) {
  const meta = ROUTE_META[route];
  const playerId = getSelectedPlayerId(snapshot, selectedPlayerId);
  let content = "";

  if (route === ROUTES.ability) {
    content = renderAbilityUpSection(snapshot, playerId, abilityPlan);
  } else if (route === ROUTES.equipment) {
    content = renderEquipmentSection(snapshot, playerId);
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

        <section class="hero-panel">
          <p class="hero-panel__label">PLAYER DEVELOPMENT</p>
          <h1 class="hero-panel__title">${escapeHtml(meta.title)}</h1>
          <p class="placeholder-panel__text">
            ${escapeHtml(meta.description)}
          </p>
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
      : "team_lab";
  return `
    <main class="screen ${escapeAttribute(meta.backgroundClass)} app-layout">
      ${topStatusTemplate(snapshot)}
      <div class="page-content">
        <div class="back-row">
          <button type="button" class="back-button" data-action="open-facility" data-facility-id="${parentFacility}">
            ← FACILITY
          </button>
        </div>
        <section class="hero-panel">
          <p class="hero-panel__label">COMPANY MANAGEMENT</p>
          <h1 class="hero-panel__title">${escapeHtml(meta.title)}</h1>
          <p class="placeholder-panel__text">${escapeHtml(meta.description)}</p>
        </section>
        ${renderManagementSection(snapshot, route)}
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
  return Object.values(ROUTES).includes(route) ? route : ROUTES.home;
}

function preloadImages(paths, timeoutMs = 1400) {
  if (typeof Image === "undefined") return Promise.resolve();
  const unique = [...new Set(paths.filter(Boolean))];
  const tasks = unique.map((path) => new Promise((resolve) => {
    const image = new Image();
    image.onload = resolve;
    image.onerror = resolve;
    image.src = path;
  }));
  return Promise.race([
    Promise.all(tasks),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
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
  let wizardStep = 0;
  let wizardData = createInitialWizardData();
  let wizardError = "";
  let selectedTeamPlayerId = null;
  let selectedFacilityId = "team_lab";
  let selectedAbilityColor = "blue";
  let abilityUpgradePlan = {};
  let abilityPlanPlayerId = null;
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

  function closeModal(value = false) {
    modalRoot.classList.remove("is-open");
    modalRoot.innerHTML = "";
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

    if (route === ROUTES.home) {
      root.innerHTML = homeTemplate(snapshot, route);
      return;
    }
    if (route === ROUTES.facility) {
      root.innerHTML = facilityTemplate(snapshot, route, selectedFacilityId);
      return;
    }
    if (route === ROUTES.team) {
      root.innerHTML = teamTemplate(snapshot, route);
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
      return;
    }
    if (
      route === ROUTES.ability ||
      route === ROUTES.equipment ||
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
      root.innerHTML = teamFeatureTemplate(snapshot, route, route, {
        selectedPlayerId: selectedTeamPlayerId,
        abilityColor: selectedAbilityColor,
        abilityPlan: abilityUpgradePlan,
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
    const normalized = normaliseRoute(nextRoute);
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

    route = normalized;
    render();
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
    if (action === "navigate") {
      navigate(actionElement.dataset.route);
      return;
    }
    if (action === "open-facility") {
      selectedFacilityId = actionElement.dataset.facilityId ?? "team_lab";
      navigate(ROUTES.facility);
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
      await openAlert({
        title: `${player.role} ${player.name}`,
        body: `
          <section class="player-status-modal">
            <img class="player-status-modal__portrait player-portrait" data-role="${escapeAttribute(player.role)}" src="${escapeAttribute(player.image)}" alt="">
            <div class="player-status-modal__head">
              <span>総合RANK ${escapeHtml(player.characterRank)}</span>
              <strong>${escapeHtml(player.weapon.weaponName)}</strong>
              <small>HP ${formatNumber(player.currentHp)} / ${formatNumber(player.maxHp)}</small>
            </div>
            <div class="player-status-modal__stats">
              ${Object.entries(player.stats).map(([statId, value]) => `<div><span>${escapeHtml(labels[statId] ?? statId)}</span><strong>${value}</strong></div>`).join("")}
            </div>
            <div class="player-status-modal__points">
              <span>POWER ${formatNumber(pointPool.power)}</span><span>TECH ${formatNumber(pointPool.tech)}</span><span>MENTAL ${formatNumber(pointPool.mental)}</span><span>SHOOT ${formatNumber(pointPool.shoot)}</span>
            </div>
            <button type="button" class="primary-button player-status-modal__ability" data-action="modal-open-player-ability" data-player-id="${escapeAttribute(player.playerId)}">この選手を能力アップ</button>
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
      abilityUpgradePlan = {};
      render();
      return;
    }
    if (action === "select-ability-color") {
      selectedAbilityColor = actionElement.dataset.abilityColor;
      render();
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
        renderPreservingPageScroll();
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
        showToast(`${transaction.result.totalUpgrades}段階を強化しました`);
        renderPreservingPageScroll();
      } catch (error) {
        await openAlert({
          title: "能力を強化できません",
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
        body: "<p>COINとRUBYを消費します。</p>",
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
    if (action === "inspect-special-ability") {
      const playerId = actionElement.dataset.playerId;
      const abilityKey = actionElement.dataset.abilityKey;
      const snapshot = stateManager.getSnapshot();
      const ability = getSpecialAbility(abilityKey);
      const acquisition = getAbilityAcquisitionState(
        snapshot,
        playerId,
        abilityKey,
      );
      const costRows = Object.entries(ability.cost)
        .filter(([, amount]) => amount > 0)
        .map(([pointId, amount]) =>
          `<span>${escapeHtml(pointId.toUpperCase())} ${formatNumber(amount)}</span>`,
        )
        .join("") || "<span>PT 0</span>";
      const conditionRows = acquisition.conditionState.details
        .map((detail) => `
          <li class="${detail.met ? "is-met" : ""}">
            ${escapeHtml(detail.condition.type)}
            ${detail.condition.tier ? ` ${escapeHtml(detail.condition.tier.toUpperCase())}` : ""}
            ${formatNumber(detail.current)} / ${formatNumber(detail.required)}
          </li>
        `)
        .join("");
      const status = acquisition.replaced
        ? "上位段階へ置換済みです"
        : acquisition.alreadyLearned
          ? "習得済みです"
          : !acquisition.stagePrerequisiteMet
            ? "第1段階の習得が必要です"
            : !acquisition.conditionState.unlocked
              ? "解放条件を満たしていません"
              : !acquisition.affordable
                ? "トレーニングポイントが不足しています"
                : "習得できます";
      const body = `
        <section class="ability-detail-modal ability-detail-modal--${escapeAttribute(ability.color)}">
          <div class="ability-detail-modal__orb">${escapeHtml(ability.name.slice(0, 1))}</div>
          <span>${escapeHtml(ability.color.toUpperCase())} / ${escapeHtml(ability.abilityId.toUpperCase())}${ability.color === "blue" ? ` STAGE ${ability.stage}` : ""}</span>
          <h3>${escapeHtml(ability.name)}</h3>
          <p>${escapeHtml(ability.description)}</p>
          <div class="ability-detail-modal__cost">${costRows}</div>
          ${conditionRows ? `<ul class="ability-detail-modal__conditions">${conditionRows}</ul>` : ""}
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
      const confirmed = await openConfirm({
        title: "特殊能力を習得しますか？",
        body,
        confirmLabel: "習得する",
      });
      if (!confirmed) return;
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
        showToast(`${transaction.result.name}を習得しました`);
        render();
      } catch (error) {
        await openAlert({
          title: "特殊能力を習得できません",
          body: `<p>${escapeHtml(error.message)}</p>`,
          code: getErrorCode(error),
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
        showToast(`${transaction.result.name}を習得しました`);
        render();
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

    if (actionElement.dataset.action === "modal-open-player-ability") {
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

  async function start() {
    showLoading("画像を読み込んでいます");
    await detectAssetPrefix("back/local.png");
    installAssetFallbacks(document);
    await preloadImages([
      assetPath("back/Load.png"), assetPath("back/main1.png"), assetPath("back/sub.png"), assetPath("back/coh.png"),
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
