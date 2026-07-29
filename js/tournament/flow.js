/**
 * MOB BR tournament presentation flow.
 *
 * Tournament presentation flow with automatic entry loading, opening,
 * deterministic battle playback, result screens, suspension, and errors.
 */

import {
  assetPath,
  detectAssetPrefix,
  installAssetFallbacks,
} from "../assets.js";
import {
  TOURNAMENT_PHASES,
  createTournamentRuntimeManager,
} from "./runtime.js?v=30";
import {
  executeCurrentBattleToDraft,
} from "./battle-core.js";
import {
  createBattlePlaybackController,
  renderBattleOutcomeScreen,
} from "./battle-ui.js?v=30";
import {
  EXPLORATION_PAGES,
  beginExplorationToDraft,
  cancelItemUseToDraft,
  completeExplorationToDraft,
  confirmStrategyToDraft,
  getDueRoundExplorationIndex,
  installExplorationSwipe,
  openItemUseToDraft,
  renderExplorationScreen,
  renderStrategyCutIn,
  renderStrategySelectionScreen,
  resolveBackpackFullToDraft,
  selectSearchCandidateToDraft,
  selectStrategyToDraft,
  setExplorationPageToDraft,
  setStrategyTabToDraft,
  useInventoryItemToDraft,
  useMobSlotToDraft,
  useRespawnTurntableToDraft,
} from "./exploration.js?v=30";
import {
  advanceAwardToDraft,
  finalizeCurrentMatchToDraft,
  getQualificationDisplay,
  prepareAwardsToDraft,
  prepareNextMatchToDraft,
  prepareTournamentResultToDraft,
  renderAwardScreen,
  renderMatchChampionScreen,
  renderMatchResultScreen,
  renderMatchPointScreen,
  renderNextMatchWaitScreen,
  renderReturningResultScreen,
  renderTournamentResultScreen,
  writePreparedResultToStorage,
} from "./results.js?v=30";

import {
  applyMatchPlanToDraft,
  circuitSectionLabel,
  isPlayerMatch,
} from "./circuit.js?v=30";

import {
  fastForwardMatchToChampionToDraft,
  finalizeRoundFieldToDraft,
  getCurrentRoundRecord,
  getPlayableRoundCount,
  getRoundTarget,
  isPlayerActive,
  resolveRoundEncounterToDraft,
} from "./round.js?v=30";

export const TOURNAMENT_FLOW_VERSION = "mobbr-tournament-flow-2.7.0";

const PHASE_LABELS = Object.freeze({
  IDLE: "待機",
  ENTRY_VALIDATION: "参加データ検証",
  LOADING: "大会準備",
  OPENING: "オープニング",
  TEAM_INTRO: "出場チーム紹介",
  DEPLOYMENT: "降下",
  INITIAL_EXPLORATION: "初動探索",
  MATCH_START: "MATCH開始",
  ROUND_INTRO: "ROUND開始",
  ROUND_EXPLORATION: "ROUND探索",
  ENCOUNTER_PREVIEW: "接敵データ",
  STRATEGY_SELECT: "作戦選択",
  BATTLE_COUNTDOWN: "戦闘準備",
  BATTLE: "戦闘",
  BATTLE_OUTCOME: "戦闘決着",
  ROUND_RESULT: "ROUND結果",
  SPECTATOR_FAST_FORWARD: "高速大会進行",
  ROUND_ADVANCE: "ROUND進行",
  MATCH_CHAMPION: "MATCH CHAMPION",
  MATCH_RESULT: "MATCH結果",
  MATCH_POINT: "MATCH POINT",
  SESSION_COMPLETE: "全MATCH終了",
  NEXT_MATCH_WAIT: "次MATCH待機",
  TOURNAMENT_AWARDS: "個人表彰",
  TOURNAMENT_RESULT: "大会総合結果",
  RETURNING_RESULT: "結果返却",
  COMPLETE: "完了",
  SUSPENDED: "中断保存済み",
  ERROR: "エラー",
});

const MAIN_PAGE_URL = "./index.html#home";
const ROLE_ORDER = Object.freeze(["IGL", "ATK", "SUP"]);

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

function formatNumber(value) {
  return new Intl.NumberFormat("ja-JP").format(value);
}

export function formatTournamentPhase(phase) {
  return PHASE_LABELS[phase] ?? phase;
}

export function getTournamentProgress(runtime) {
  const index = TOURNAMENT_PHASES.indexOf(runtime.phase);
  const completeIndex = TOURNAMENT_PHASES.indexOf("COMPLETE");
  if (index < 0 || completeIndex < 1) {
    return 0;
  }
  return Math.min(100, Math.max(0, (index / completeIndex) * 100));
}

function getErrorCode(error) {
  return error?.code ?? error?.name ?? "TOURNAMENT_ERROR";
}

function playerMembers(runtime) {
  return [...runtime.entryData.playerTeam.members].sort(
    (left, right) =>
      ROLE_ORDER.indexOf(left.role) - ROLE_ORDER.indexOf(right.role),
  );
}

function tournamentThemeLogo(runtime) {
  const theme = runtime.entryData.tournament.openingThemeId;
  if (theme === "national") return assetPath("icon/national.png");
  if (theme === "world") return assetPath("icon/world.png");
  if (theme === "championship") return assetPath("icon/champ.png");
  return assetPath("icon/local.png");
}

function tournamentThemeBackground(runtime) {
  const theme = runtime.entryData.tournament.openingThemeId;
  if (theme === "national") return assetPath("back/national.png");
  if (theme === "world") return assetPath("back/world.png");
  if (theme === "championship") return assetPath("back/champ.png");
  return assetPath("back/local.png");
}

function topStatusTemplate(runtime) {
  const activeTeams = runtime.activeTeamIds.length;
  const match =
    runtime.match > 0
      ? runtime.currentSection?.circuitMatch ?? runtime.match
      : "-";
  const round = runtime.round > 0 ? runtime.round : "-";
  const qualification =
    getQualificationDisplay(runtime);
  const sectionLabel = circuitSectionLabel(runtime);
  return `
    <header class="tournament-status">
      <div class="tournament-status__main">
        <img class="tournament-status__logo" src="${escapeAttribute(tournamentThemeLogo(runtime))}" alt="">
        <div class="tournament-status__title">
          <strong>${escapeHtml(runtime.entryData.tournament.tournamentName)}</strong>
          <span>${escapeHtml(runtime.entryData.tournament.stageName)}</span>
        </div>
        <div class="tournament-status__phase">${escapeHtml(formatTournamentPhase(runtime.phase))}</div>
      </div>
      ${
        qualification.enabled
          ? `
            <div class="tournament-status__qualification">
              <span>QUALIFY</span>
              <strong>${escapeHtml(
                qualification.maximumPlace
                  ? `TOP ${qualification.maximumPlace}`
                  : qualification.lineLabel,
              )}</strong>
            </div>
          `
          : ""
      }
      ${
        sectionLabel
          ? `<div class="tournament-status__section">${escapeHtml(sectionLabel)}</div>`
          : ""
      }
      <div class="tournament-status__metrics">
        <span><img src="icon/match.png" alt="">MATCH <strong>${match}</strong></span>
        <span><img src="icon/round.png" alt="">ROUND <strong>${round}</strong></span>
        <span><img src="icon/battle.png" alt="">ALIVE <strong>${activeTeams}</strong></span>
      </div>
      <div class="tournament-status__progress" aria-hidden="true"><span style="width:${getTournamentProgress(runtime).toFixed(2)}%"></span></div>
    </header>
  `;
}

function commentaryTemplate(text, label = "モブマイク") {
  return `
    <aside class="commentary-panel commentary-panel--live">
      <div class="commentary-panel__speaker">
        <img src="icon/mic.png" alt="${escapeAttribute(label)}">
        <span>LIVE</span>
      </div>
      <div>
        <strong>${escapeHtml(label)}</strong>
        <p>${escapeHtml(text)}</p>
        <i class="commentary-wave" aria-hidden="true">
          <b></b><b></b><b></b><b></b><b></b>
        </i>
      </div>
    </aside>
  `;
}

function loadingTemplate(runtime) {
  return `
    <main class="tournament-screen tournament-screen--loading" style="--tournament-background:url('${escapeAttribute(tournamentThemeBackground(runtime))}')">
      ${topStatusTemplate(runtime)}
      <section class="tournament-loading-card">
        <p>MOB BR TOURNAMENT SYSTEM</p>
        <h1>${escapeHtml(runtime.entryData.tournament.tournamentName)}</h1>
        <div class="tournament-loading-bars" aria-hidden="true"><i></i><i></i><i></i></div>
        <strong>参加データを大会ランタイムへ複製しています</strong>
        <span>
          ENTRY ${escapeHtml(runtime.entryId)}<br>
          ${runtime.entryData.playerTeam.members.length} PLAYERS /
          ${runtime.entryData.strategyInventory.length} STRATEGIES
        </span>
      </section>
    </main>
  `;
}

function sceneForegroundTemplate(scene) {
  const bindings = scene.teamDataBindings ?? [];
  if (bindings.length > 0) {
    return `
      <div class="opening-lineup">
        ${bindings.map((binding, index) => `
          <article class="opening-lineup__member">
            <img
              src="${escapeAttribute(scene.foregroundImages[index] ?? "")}" 
              alt="${escapeAttribute(binding.name ?? binding.weaponName ?? "")}" 
            >
            ${binding.role ? `<span>${escapeHtml(binding.role)}</span>` : ""}
            <strong>${escapeHtml(binding.name ?? binding.weaponName ?? "")}</strong>
            ${binding.rank ? `<small>RANK ${escapeHtml(binding.rank)}</small>` : ""}
          </article>
        `).join("")}
      </div>
    `;
  }

  if (!scene.foregroundImages?.length) {
    return "";
  }

  return `
    <div class="opening-foregrounds">
      ${scene.foregroundImages.map((image) => `
        <img src="${escapeAttribute(assetPath(image))}" alt="">
      `).join("")}
    </div>
  `;
}

function openingTemplate(runtime) {
  const scene = runtime.opening.scenes[runtime.opening.sceneIndex];
  const sceneNumber = runtime.opening.sceneIndex + 1;
  const isLast = sceneNumber === runtime.opening.scenes.length;
  const background = assetPath(scene.backgroundImage ?? tournamentThemeBackground(runtime));
  const logo = tournamentThemeLogo(runtime);
  const showLogo = scene.type === "TOURNAMENT_TITLE";
  return `
    <main
      class="tournament-screen tournament-screen--opening"
      style="--opening-background:url('${escapeAttribute(background)}')"
    >
      <img class="tournament-stage-background" src="${escapeAttribute(background)}" alt="">
      <section class="opening-stage opening-stage--${escapeAttribute(scene.type.toLowerCase())}">
        ${showLogo ? `<img class="opening-event-logo" src="${escapeAttribute(logo)}" alt="">` : ""}
        <div class="opening-stage__accent" aria-hidden="true"></div>
        ${sceneForegroundTemplate(scene)}
        <div class="opening-stage__copy">
          <span>${escapeHtml(runtime.entryData.tournament.stageName)} / SCENE ${sceneNumber}</span>
          <h1>${escapeHtml(scene.text)}</h1>
          <p>${escapeHtml(scene.subtext ?? "")}</p>
        </div>
      </section>
      <div class="tournament-bottom-area tournament-bottom-area--opening">
        ${commentaryTemplate(scene.commentary)}
        <div class="tournament-actions tournament-actions--opening">
          <button type="button" class="tournament-button tournament-button--ghost" data-action="opening-skip" ${scene.canSkip ? "" : "disabled"}>SKIP</button>
          <button type="button" class="tournament-button tournament-button--primary" data-action="opening-next">${isLast ? "MATCH DEPLOYMENT" : "NEXT"}</button>
        </div>
      </div>
    </main>
  `;
}

function teamRosterRow(team, index, playerTeamId) {
  if (team.teamId === playerTeamId) {
    return `
      <article class="team-roster-row team-roster-row--player">
        <span class="team-roster-row__number">${String(index + 1).padStart(2, "0")}</span>
        <img src="${escapeAttribute(team.teamLogo)}" alt="">
        <div>
          <strong>${escapeHtml(team.teamName)}</strong>
          <small>${escapeHtml(team.companyName)} / PLAYER TEAM</small>
        </div>
        <em>ENTRY</em>
      </article>
    `;
  }

  return `
    <article class="team-roster-row team-roster-row--cpu">
      <span class="team-roster-row__number">${String(index + 1).padStart(2, "0")}</span>
      <img src="${escapeAttribute(team.teamLogo)}" alt="">
      <div>
        <strong>${escapeHtml(team.teamName)}</strong>
        <small>CPU TEAM / ${escapeHtml(team.members.map((member) => member.role).join("・"))}</small>
      </div>
      <em>CPU</em>
    </article>
  `;
}

function playerIntroTemplate(runtime) {
  return playerMembers(runtime).map((member) => `
    <article class="player-intro-card">
      <img src="${escapeAttribute(member.image)}" alt="${escapeAttribute(member.name)}">
      <div>
        <span>${escapeHtml(member.role)}</span>
        <h3>${escapeHtml(member.name)}</h3>
        <p>RANK ${escapeHtml(member.characterRank)}</p>
        <strong>${escapeHtml(member.weapon.weaponName)}</strong>
      </div>
    </article>
  `).join("");
}

function teamIntroTemplate(runtime) {
  return `
    <main class="tournament-screen tournament-screen--team-intro" style="--tournament-background:url('${escapeAttribute(tournamentThemeBackground(runtime))}')">
      ${topStatusTemplate(runtime)}
      <div class="tournament-scroll-area">
        <section class="team-intro-hero">
          <img
            src="${escapeAttribute(runtime.entryData.playerTeam.teamLogo)}"
            alt=""
          >
          <div>
            <span>PLAYER ENTRY</span>
            <h1>${escapeHtml(runtime.entryData.playerTeam.teamName)}</h1>
            <p>${escapeHtml(runtime.entryData.company.companyName)}</p>
          </div>
        </section>

        <section class="player-intro-grid">
          ${playerIntroTemplate(runtime)}
        </section>

        <section class="team-roster-panel">
          <header>
            <div>
              <span>ALL PARTICIPANTS</span>
              <h2>${runtime.teams.length} TEAMS</h2>
            </div>
            <p>
              CPUランクと好不調状態は大会ランタイム生成時に一度だけ固定されます。
            </p>
          </header>
          <div class="team-roster-list">
            ${runtime.teams.map((team, index) =>
              teamRosterRow(team, index, runtime.playerTeamId),
            ).join("")}
          </div>
        </section>
      </div>
      <div class="tournament-bottom-area">
        ${commentaryTemplate(
          `${runtime.entryData.playerTeam.teamName}のエントリーを確認！MATCH DEPLOYMENTへ進みます！`,
        )}
        <div class="tournament-actions">
          <button
            type="button"
            class="tournament-button tournament-button--secondary"
            data-action="save-checkpoint"
          >
            SAVE
          </button>
          <button
            type="button"
            class="tournament-button tournament-button--primary"
            data-action="team-intro-next"
          >
            MATCH DEPLOYMENT
          </button>
        </div>
      </div>
    </main>
  `;
}

function deploymentTemplate(runtime) {
  const members = playerMembers(runtime);
  return `
    <main
      class="tournament-screen tournament-screen--deployment"
      style="--map-background:url('${escapeAttribute(assetPath(runtime.map.image))}')"
    >
      <img class="tournament-stage-background" src="${escapeAttribute(assetPath(runtime.map.image))}" alt="">
      ${topStatusTemplate(runtime)}
      <section class="deployment-stage">
        <div class="deployment-stage__ship" aria-hidden="true">
          <span>DROPSHIP</span>
        </div>
        <div class="deployment-team">
          ${members.map((member) => `
            <article>
              <img src="${escapeAttribute(member.image)}" alt="${escapeAttribute(member.name)}">
              <span>${escapeHtml(member.role)}</span>
              <strong>${escapeHtml(member.name)}</strong>
            </article>
          `).join("")}
        </div>
        <div class="deployment-copy">
          <span>${escapeHtml(runtime.map.name)}</span>
          <h1>READY TO DROP</h1>
          <p>${escapeHtml(runtime.entryData.playerTeam.teamName)}</p>
        </div>
      </section>
      <div class="tournament-bottom-area">
        ${commentaryTemplate(
          `MATCH ${Math.max(1, runtime.match || 1)}の初動配置へ進みます。`,
        )}
        <div class="tournament-actions">
          <button
            type="button"
            class="tournament-button tournament-button--secondary"
            data-action="suspend-return"
          >
            中断保存
          </button>
          <button
            type="button"
            class="tournament-button tournament-button--primary"
            data-action="deployment-next"
          >
            降下開始
          </button>
        </div>
      </div>
    </main>
  `;
}

function provisionalPhaseTemplate(runtime, {
  eyebrow,
  title,
  description,
  commentary,
  primaryAction,
  primaryLabel,
  secondaryAction = "suspend-return",
  secondaryLabel = "中断保存",
  content = "",
}) {
  return `
    <main
      class="tournament-screen tournament-screen--provisional"
      style="--map-background:url('${escapeAttribute(assetPath(runtime.map.image))}')"
    >
      <img class="tournament-stage-background" src="${escapeAttribute(assetPath(runtime.map.image))}" alt="">
      ${topStatusTemplate(runtime)}
      <section class="provisional-phase-card">
        <span>${escapeHtml(eyebrow)}</span>
        <h1>${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
        ${content}
      </section>
      <div class="tournament-bottom-area">
        ${commentaryTemplate(commentary)}
        <div class="tournament-actions">
          <button
            type="button"
            class="tournament-button tournament-button--secondary"
            data-action="${escapeAttribute(secondaryAction)}"
          >
            ${escapeHtml(secondaryLabel)}
          </button>
          <button
            type="button"
            class="tournament-button tournament-button--primary"
            data-action="${escapeAttribute(primaryAction)}"
          >
            ${escapeHtml(primaryLabel)}
          </button>
        </div>
      </div>
    </main>
  `;
}

function matchStartTemplate(runtime) {
  return provisionalPhaseTemplate(runtime, {
    eyebrow: "MATCH START",
    title: `MATCH ${runtime.match}`,
    description:
      "初動探索結果、バッグ、MATCH限定能力補正、正式CPUロスターを確認しました。",
    commentary: `${runtime.entryData.playerTeam.teamName}、MATCH ${runtime.match}へ入ります！`,
    primaryAction: "match-start-next",
    primaryLabel: "ROUND 1",
    content: `
      <div class="runtime-ready-grid">
        <article><span>ACTIVE</span><strong>${runtime.activeTeamIds.length}</strong></article>
        <article><span>ROUNDS</span><strong>${getPlayableRoundCount(runtime)}</strong></article>
        <article><span>HP STATE</span><strong>READY</strong></article>
        <article><span>SKILL CT</span><strong>0 START</strong></article>
      </div>
    `,
  });
}

function spectatorFastForwardTemplate(runtime) {
  return `
    <main class="tournament-screen tournament-screen--spectator-fast" style="--map-background:url('${escapeAttribute(assetPath(runtime.map.image))}')">
      <section class="spectator-fast-card">
        <div class="spectator-fast-loader" aria-hidden="true"><i></i><i></i><i></i></div>
        <span>MATCH ${runtime.match}</span>
        <h1>CHAMPION CALCULATION</h1>
        <p>プレイヤーチームは脱落しました。残り${runtime.activeTeamIds.length}チームのROUNDを高速処理しています。</p>
        <strong>チャンピオン決定まで進行中</strong>
      </section>
    </main>`;
}

function sessionCompleteTemplate(runtime) {
  const type = runtime.entryData.tournament.tournamentType;
  const continuation = [
    "national_week_1",
    "world_qualifier_week_1",
  ].includes(type);
  const message = continuation
    ? `${runtime.entryData.tournament.tournamentName}の前半日程が終了しました。現在の40チームTOTALとグループを保存して次週へ引き継ぎます。`
    : `${runtime.entryData.tournament.tournamentName}の全${runtime.matchTotals.length}MATCHが終了しました。`;
  return `
    <main class="tournament-screen tournament-screen--session-complete" style="--map-background:url('${escapeAttribute(assetPath(runtime.map.image))}')">
      <section class="session-complete-stage">
        <img src="icon/mic.png" alt="モブマイク">
        <span>${continuation ? "FIRST WEEK COMPLETE" : "ALL MATCHES COMPLETE"}</span>
        <h1>${continuation ? "前半日程終了" : "全MATCH終了"}</h1>
        <p>${escapeHtml(message)}</p>
        <blockquote>「${escapeHtml(runtime.entryData.playerTeam.teamName)}のみなさん、お疲れさまでした！${continuation ? "順位は次週へそのまま続きます。準備を整えて後半戦へ向かいましょう！" : "激戦を最後まで戦い抜きました。最終結果を確認しましょう！"}」</blockquote>
        <button type="button" class="tournament-button tournament-button--primary" data-action="session-complete-next">${continuation ? "1週目結果へ" : "個人表彰へ"}</button>
      </section>
    </main>`;
}

function roundIntroTemplate(runtime) {
  return provisionalPhaseTemplate(runtime, {
    eyebrow: "ROUND INTRO",
    title: `ROUND ${runtime.round}`,
    description: "",
    commentary: `ROUND ${runtime.round}開始！`,
    primaryAction: "round-intro-next",
    primaryLabel: "ENCOUNTER CHECK",
    content: `
      <div class="round-intro-symbol">
        <img src="icon/round.png" alt="">
        <strong>ROUND ${runtime.round}</strong>
      </div>
    `,
  });
}

function getCurrentCpuOpponent(runtime) {
  return runtime.teams.find(
    (team) => team.teamId === runtime.currentOpponentId,
  ) ?? runtime.teams.find((team) => !team.isPlayer) ?? null;
}

function encounterPreviewTemplate(runtime) {
  const members = playerMembers(runtime);
  const opponent = getCurrentCpuOpponent(runtime);
  const enemyMembers = opponent?.members ?? [];
  return `
    <main class="tournament-screen tournament-screen--encounter" style="--map-background:url('${escapeAttribute(assetPath(runtime.map.image))}')">
      <img class="tournament-stage-background" src="${escapeAttribute(assetPath(runtime.map.image))}" alt="">
      <header class="encounter-versus-header">
        <span>ENCOUNTER</span>
        <h1>${escapeHtml(runtime.entryData.playerTeam.teamName)} <b>VS</b> ${escapeHtml(opponent?.teamName ?? "CPU TEAM")}</h1>
      </header>
      <section class="encounter-compact-stage">
        <div class="encounter-compact-team encounter-compact-team--player">
          <strong>${escapeHtml(runtime.entryData.playerTeam.teamName)}</strong>
          ${members.map((member) => `
            <article>
              <img src="${escapeAttribute(member.image)}" alt="">
              <div><span>${escapeHtml(member.role)}</span><b>${escapeHtml(member.name)}</b><small>HP ${member.currentHp}/${member.maxHp}</small></div>
            </article>
          `).join("")}
        </div>
        <div class="encounter-vs-mark">VS</div>
        <div class="encounter-compact-team encounter-compact-team--cpu">
          <strong>${escapeHtml(opponent?.teamName ?? "CPU TEAM")}</strong>
          ${enemyMembers.map((member) => `
            <article>
              <img src="${escapeAttribute(member.image)}" alt="">
              <div><span>${escapeHtml(member.role)}</span><b>${escapeHtml(member.name)}</b><small>RANK ${escapeHtml(member.characterRank)}</small></div>
            </article>
          `).join("")}
        </div>
      </section>
      <div class="tournament-bottom-area encounter-bottom-area">
        ${commentaryTemplate(opponent ? `${runtime.entryData.playerTeam.teamName}と${opponent.teamName}が接敵！両チームの役割配置を確認して作戦を決めましょう！` : "対戦相手を確認できません。")}
        <div class="tournament-actions">
          <button type="button" class="tournament-button tournament-button--secondary" data-action="suspend-return">中断保存</button>
          <button type="button" class="tournament-button tournament-button--primary" data-action="encounter-next">作戦選択</button>
        </div>
      </div>
    </main>
  `;
}

function battleCountdownTemplate(runtime) {
  const strategy = runtime.strategyRuntime[
    runtime.teamRuntime[runtime.playerTeamId].currentStrategyId
  ];
  return `
    <main class="tournament-screen tournament-screen--countdown-lock" style="--map-background:url('${escapeAttribute(assetPath(runtime.map.image))}')">
      <img class="tournament-stage-background" src="${escapeAttribute(assetPath(runtime.map.image))}" alt="">
      <section class="countdown-lock-stage">
        ${renderStrategyCutIn(runtime)}
        <span>COMBAT SEQUENCE LOCKED</span>
        <h1>BATTLE START</h1>
        <div class="countdown-sequence" aria-label="3 2 1">
          <strong>3</strong><strong>2</strong><strong>1</strong><span>BATTLE!</span>
        </div>
        <small>カウントダウン中はスキップできません</small>
      </section>
      <div class="tournament-bottom-area countdown-lock-commentary">
        ${commentaryTemplate(`${strategy?.name ?? "バランスを大事に"}で戦闘を開始します！3、2、1！`)}
      </div>
    </main>
  `;
}

function battleOutcomeTemplate(runtime) {
  return renderBattleOutcomeScreen(runtime);
}

function roundResultTemplate(runtime) {
  const record = getCurrentRoundRecord(runtime);
  if (!record) {
    throw new RangeError("Formal round result is missing.");
  }
  const playerRow = record.teamResults.find(
    (row) => row.teamId === runtime.playerTeamId,
  );
  const playerMembers = runtime.entryData.playerTeam.members;
  const battleMembers = new Map(
    (runtime.lastBattleResult?.participantResults ?? [])
      .filter((member) => member.teamId === runtime.playerTeamId)
      .map((member) => [member.playerId, member]),
  );
  const announcement = record.remainingAnnouncements.at(-1);
  const topRows = record.teamResults.slice(0, Math.min(10, record.teamResults.length));
  const roundVerdict =
    record.playerHadNoEncounter
      ? {
          state: "no-encounter",
          label: "NO ENCOUNTER",
          title: "このラウンドは接敵しませんでした",
          message:
            "敵チームとの戦闘は発生しませんでした。HPとアイテムを温存したまま次のROUNDへ進みます！",
        }
      : record.playerBattleDraw
        ? {
            state: "draw",
            label: "DRAW / SAFE",
            title: "お互い引く判断",
            message:
              "両チームに生存者が残ったため、DRAWとして双方がROUND生存枠へ進みます。",
          }
        : playerRow?.survived
        ? {
            state: "clear",
            label: "ROUND CLEAR",
            title: `ROUND ${runtime.round} 突破`,
            message:
              playerRow.roundPlace <= record.targetCount
                ? `${record.targetCount}チームの生存枠へ入りました。次のROUNDも集中していきましょう！`
                : "次のROUNDへ進みます！",
          }
        : {
            state: "out",
            label: "ELIMINATED",
            title: `ROUND ${runtime.round} 敗退`,
            message:
              "このMATCHでは脱落となりました。チャンピオン決定まで大会を見届けます！",
          };

  return provisionalPhaseTemplate(runtime, {
    eyebrow: "ROUND RESULT",
    title: announcement
      ? `残り ${announcement} チーム`
      : `MATCH ${runtime.match} / ROUND ${runtime.round}`,
    description:
      `${record.activeTeamsBefore.length} → ${record.activeTeamsAfter.length}チーム / ` +
      `${record.cpuFastCount}チームを高速処理 / ` +
      `${playerRow?.survived ? "PLAYER SURVIVED" : "PLAYER ELIMINATED"}`,
    commentary: announcement
      ? `残り${announcement}チーム！決着が近づいてきました！`
      : record.playerHadNoEncounter
        ? "このROUNDは接敵なし！消耗を抑えて次の局面へ進めます！"
        : record.playerBattleDraw
          ? "DRAW！両チームとも全滅を避け、お互い引く判断でROUNDを生存します！"
          : record.playerSurvived
          ? `ROUND ${runtime.round}を突破！次の生存目標へ進みます！`
          : "プレイヤーチームは脱落しました。大会結果は最後まで進行します。",
    primaryAction: "round-result-next",
    primaryLabel:
      record.activeTeamsAfter.length <= 1 ||
      runtime.round >= getPlayableRoundCount(runtime)
        ? "MATCH CHAMPION"
        : "NEXT ROUND",
    content: `
      <section class="round-result-verdict is-${roundVerdict.state}">
        <img src="icon/mic.png" alt="モブマイク">
        <span>${escapeHtml(roundVerdict.label)}</span>
        <h2>${escapeHtml(roundVerdict.title)}</h2>
        <strong>
          FIELD ${playerRow?.roundPlace ?? "-"}位 /
          生存ライン ${record.targetCount}位以内
        </strong>
        <p>${escapeHtml(roundVerdict.message)}</p>
      </section>
      <div class="round-field-summary">
        <div class="remaining-team-cut ${announcement ? "is-announcement" : ""}">
          <span>ALIVE TEAMS</span>
          <strong>${record.remainingCount}</strong>
        </div>
        <div class="round-field-ranking">
          ${topRows.map((row, index) => `
            <article class="${row.isPlayer ? "is-player" : ""} ${row.survived ? "is-survivor" : "is-eliminated"}">
              <span>${index + 1}</span>
              <img src="${escapeAttribute(row.teamLogo)}" alt="">
              <div>
                <strong>${escapeHtml(row.teamName)}</strong>
                <small>KP ${row.kp} / DMG ${formatNumber(row.damage)} / SCORE ${formatNumber(Math.round(row.score))}</small>
              </div>
              <em>${row.survived ? "ALIVE" : "OUT"}</em>
            </article>
          `).join("")}
        </div>
      </div>
      <div class="provisional-result-list actual-round-result-list">
        ${playerMembers.map((source) => {
          const battle = battleMembers.get(source.playerId);
          const state = runtime.memberRuntime[source.playerId];
          return `
            <article data-combat-state="${escapeAttribute(state.combatState)}">
              <img src="${escapeAttribute(source.image)}" alt="">
              <div>
                <strong>${escapeHtml(source.role)} ${escapeHtml(source.name)}</strong>
                <small>${battle ? "VISIBLE BATTLE" : "FIELD / SPECTATOR"} / HP ${state.hp} / ${state.maxHp}</small>
              </div>
              <span>
                ${battle
                  ? `DMG ${formatNumber(battle.stats.damage)} / K ${battle.stats.kills} / A ${battle.stats.assists}`
                  : `ROUND FIELD ${playerRow?.survived ? "SURVIVED" : "ELIMINATED"}`}
              </span>
            </article>
          `;
        }).join("")}
      </div>
    `,
  });
}

function suspendedTemplate(runtime) {
  return `
    <main class="tournament-screen tournament-screen--suspended">
      ${topStatusTemplate(runtime)}
      <section class="suspended-card">
        <span>SUSPENDED</span>
        <h1>大会進行を保存しました</h1>
        <p>
          ENTRY ${escapeHtml(runtime.entryId)}<br>
          再開地点：${escapeHtml(formatTournamentPhase(runtime.resumeTargetPhase))}
        </p>
        <div class="tournament-actions tournament-actions--stack">
          <button
            type="button"
            class="tournament-button tournament-button--primary"
            data-action="resume-runtime"
          >
            大会を再開
          </button>
          <button
            type="button"
            class="tournament-button tournament-button--secondary"
            data-action="return-main"
          >
            メイン画面へ戻る
          </button>
        </div>
      </section>
    </main>
  `;
}

function genericFuturePhaseTemplate(runtime) {
  return `
    <main class="tournament-screen tournament-screen--future">
      ${topStatusTemplate(runtime)}
      <section class="suspended-card">
        <span>${escapeHtml(runtime.phase)}</span>
        <h1>${escapeHtml(formatTournamentPhase(runtime.phase))}</h1>
        <p>このフェーズの本処理は後続工程で接続します。</p>
        <button
          type="button"
          class="tournament-button tournament-button--primary"
          data-action="suspend-return"
        >
          中断保存してメインへ
        </button>
      </section>
    </main>
  `;
}

function errorTemplate(error, runtime = null) {
  const message = error?.message ?? "大会システムでエラーが発生しました。";
  const code = getErrorCode(error);
  return `
    <main class="tournament-screen tournament-screen--error">
      ${runtime ? topStatusTemplate(runtime) : ""}
      <section class="tournament-error-card" role="alert">
        <span>TOURNAMENT ERROR</span>
        <h1>大会を開始できません</h1>
        <p>${escapeHtml(message)}</p>
        <code>${escapeHtml(code)}</code>
        <p class="tournament-error-card__note">
          大会参加データは削除していません。再試行またはメイン画面へ戻れます。
        </p>
        <div class="tournament-actions tournament-actions--stack">
          <button
            type="button"
            class="tournament-button tournament-button--primary"
            data-action="retry-boot"
          >
            再試行
          </button>
          <button
            type="button"
            class="tournament-button tournament-button--secondary"
            data-action="return-main"
          >
            メイン画面へ戻る
          </button>
        </div>
      </section>
    </main>
  `;
}

export function createTournamentFlowController({
  root,
  modalRoot,
  toastRoot,
  loadingOverlay,
  loadingMessage,
  storage = globalThis.localStorage,
  navigate = (url) => globalThis.location.assign(url),
} = {}) {
  if (!root || !modalRoot || !toastRoot || !loadingOverlay || !loadingMessage) {
    throw new Error("Tournament application DOM roots are missing.");
  }
  if (typeof navigate !== "function") {
    throw new TypeError("Tournament navigation callback must be a function.");
  }

  const runtimeManager = createTournamentRuntimeManager({ storage });
  let bootError = null;
  let uiLocked = false;
  let timerEpoch = 0;
  let scheduledTimer = null;
  let activeBattlePlayback = null;
  let explorationSwipeCleanup = null;
  let toastTimer = null;
  let modalResolver = null;

  function cancelScheduledAction() {
    timerEpoch += 1;
    if (scheduledTimer !== null) {
      clearTimeout(scheduledTimer);
      scheduledTimer = null;
    }
  }

  function destroyBattlePlayback() {
    if (activeBattlePlayback) {
      activeBattlePlayback.destroy();
      activeBattlePlayback = null;
    }
  }

  function destroyExplorationSwipe() {
    if (explorationSwipeCleanup) {
      explorationSwipeCleanup();
      explorationSwipeCleanup = null;
    }
  }

  function scheduleAction(callback, delay) {
    cancelScheduledAction();
    const epoch = timerEpoch;
    scheduledTimer = setTimeout(() => {
      scheduledTimer = null;
      if (epoch !== timerEpoch) {
        return;
      }
      callback();
    }, delay);
  }

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
    toastRoot.innerHTML = `<div class="tournament-toast">${escapeHtml(message)}</div>`;
    toastTimer = setTimeout(() => {
      toastRoot.innerHTML = "";
    }, 2200);
  }

  function closeModal(value = false) {
    modalRoot.classList.remove("is-open");
    modalRoot.innerHTML = "";
    if (modalResolver) {
      const resolve = modalResolver;
      modalResolver = null;
      resolve(value);
    }
  }

  function openConfirm({
    title,
    body,
    confirmLabel = "はい",
    cancelLabel = "いいえ",
  }) {
    if (modalResolver) {
      closeModal(false);
    }
    return new Promise((resolve) => {
      modalResolver = resolve;
      modalRoot.classList.add("is-open");
      modalRoot.innerHTML = `
        <div class="tournament-modal-backdrop">
          <section
            class="tournament-modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tournamentModalTitle"
          >
            <span>CONFIRM</span>
            <h2 id="tournamentModalTitle">${escapeHtml(title)}</h2>
            <div>${body}</div>
            <div class="tournament-actions">
              <button
                type="button"
                class="tournament-button tournament-button--secondary"
                data-modal-action="cancel"
              >
                ${escapeHtml(cancelLabel)}
              </button>
              <button
                type="button"
                class="tournament-button tournament-button--primary"
                data-modal-action="confirm"
              >
                ${escapeHtml(confirmLabel)}
              </button>
            </div>
          </section>
        </div>
      `;
    });
  }

  function explorationScrollTop() {
    return (
      root.querySelector(
        ".exploration-unified-scroll",
      )?.scrollTop ?? 0
    );
  }

  function renderPreservingExplorationScroll(
    requestedTop =
      explorationScrollTop(),
  ) {
    render();
    requestAnimationFrame(() => {
      const scroller =
        root.querySelector(
          ".exploration-unified-scroll",
        );
      if (scroller) {
        scroller.scrollTop =
          requestedTop;
      }
    });
  }

  function playExplorationItemUsePresentation(
    result,
  ) {
    const presentation =
      result?.presentation;
    if (!presentation) {
      return;
    }

    const overlay =
      document.createElement("section");
    overlay.className =
      "exploration-item-use-show";
    overlay.innerHTML = `
      <div
        class="exploration-item-use-show__burst"
        aria-hidden="true"
      ></div>
      <span>ITEM ACTIVATED</span>
      <img
        src="${escapeAttribute(assetPath(result.image))}"
        alt=""
      >
      <h2>${escapeHtml(result.name)}</h2>
      <strong>${escapeHtml(result.effectSummary)}</strong>

      <div class="exploration-item-use-show__targets">
        ${presentation.targets.map((target) => `
          <article>
            <img
              src="${escapeAttribute(assetPath(target.image))}"
              alt=""
            >
            <div>
              <span>${escapeHtml(target.role)}</span>
              <b>${escapeHtml(target.name)}</b>
              ${
                target.statId
                  ? `
                    <small>
                      ${escapeHtml(target.statLabel)}
                      ${formatNumber(target.statBefore)}
                      → <strong>${formatNumber(target.statAfter)}</strong>
                    </small>
                  `
                  : `
                    <small>
                      HP
                      ${formatNumber(target.hpBefore)}
                      → <strong>${formatNumber(target.hpAfter)}</strong>
                      / ${formatNumber(target.maxHp)}
                    </small>
                  `
              }
            </div>
          </article>
        `).join("")}
      </div>

      <aside>
        <img src="icon/mic.png" alt="">
        <div>
          <span>モブマイク / LIVE</span>
          <p>
            ${escapeHtml(result.name)}を使用！
            ${escapeHtml(result.effectSummary)}の効果が反映されました！
          </p>
        </div>
      </aside>
    `;

    root.append(overlay);
    requestAnimationFrame(() =>
      overlay.classList.add(
        "is-active",
      ),
    );
    setTimeout(
      () =>
        overlay.classList.add(
          "is-exit",
        ),
      1500,
    );
    setTimeout(
      () => overlay.remove(),
      1810,
    );
  }

  function render() {
    cancelScheduledAction();
    destroyBattlePlayback();
    destroyExplorationSwipe();
    const runtime = runtimeManager.getSnapshot();
    if (bootError && !runtime) {
      root.innerHTML = errorTemplate(bootError);
      return;
    }
    if (!runtime) {
      root.innerHTML = errorTemplate(
        new Error("大会ランタイムが読み込まれていません。"),
      );
      return;
    }

    switch (runtime.phase) {
      case "LOADING":
        root.innerHTML = loadingTemplate(runtime);
        scheduleAction(() => {
          try {
            runtimeManager.transition("OPENING", {
              reason: "loading_completed",
            });
            runtimeManager.checkpoint("opening_start");
            render();
          } catch (error) {
            handleRuntimeError(error);
          }
        }, runtime.entryData.settings.reducedMotion ? 0 : 420);
        break;
      case "OPENING":
        root.innerHTML = openingTemplate(runtime);
        if (runtime.entryData.settings.autoAdvanceOpening) {
          const scene = runtime.opening.scenes[runtime.opening.sceneIndex];
          const speed = Number(runtime.entryData.settings.commentarySpeed) || 1;
          const delay = runtime.entryData.settings.reducedMotion
            ? 100
            : Math.max(650, scene.duration / speed);
          scheduleAction(() => advanceOpening(), delay);
        }
        break;
      case "TEAM_INTRO":
        // Generation 29: old resumes may still point at TEAM_INTRO.
        // Skip the redundant all-team list and continue to deployment.
        root.innerHTML = deploymentTemplate(runtime);
        scheduleAction(() => {
          try {
            runtimeManager.transition("DEPLOYMENT", {
              reason: "legacy_team_intro_skipped",
            });
            runtimeManager.checkpoint(
              "legacy_team_intro_to_deployment",
            );
            render();
          } catch (error) {
            handleRuntimeError(error);
          }
        }, 0);
        break;
      case "DEPLOYMENT":
        root.innerHTML = deploymentTemplate(runtime);
        break;
      case "INITIAL_EXPLORATION":
      case "ROUND_EXPLORATION":
        root.innerHTML = renderExplorationScreen(runtime);
        explorationSwipeCleanup = installExplorationSwipe(root, {
          onPageChange: (direction) => {
            try {
              const snapshot = runtimeManager.getSnapshot();
              const currentIndex = EXPLORATION_PAGES.indexOf(
                snapshot.explorationRuntime.currentPage,
              );
              const nextIndex = Math.max(
                0,
                Math.min(
                  EXPLORATION_PAGES.length - 1,
                  currentIndex + direction,
                ),
              );
              if (nextIndex !== currentIndex) {
                runtimeManager.update(
                  "exploration_page_swiped",
                  (draft) =>
                    setExplorationPageToDraft(
                      draft,
                      EXPLORATION_PAGES[nextIndex],
                    ),
                );
                render();
              }
            } catch (error) {
              handleRuntimeError(error);
            }
          },
        });
        break;
      case "MATCH_START":
        root.innerHTML = matchStartTemplate(runtime);
        break;
      case "ROUND_INTRO":
        root.innerHTML = roundIntroTemplate(runtime);
        if (!isPlayerActive(runtime)) {
          scheduleAction(() => {
            root.querySelector('[data-action="round-intro-next"]')?.click();
          }, runtime.entryData.settings.reducedMotion ? 30 : 180);
        }
        break;
      case "ENCOUNTER_PREVIEW":
        root.innerHTML = encounterPreviewTemplate(runtime);
        break;
      case "STRATEGY_SELECT":
        root.innerHTML = renderStrategySelectionScreen(runtime);
        break;
      case "BATTLE_COUNTDOWN":
        root.innerHTML = battleCountdownTemplate(runtime);
        scheduleAction(() => {
          try {
            runtimeManager.transition("BATTLE", {
              reason: "strategy_countdown_completed",
            });
            render();
          } catch (error) {
            handleRuntimeError(error);
          }
        }, runtime.entryData.settings.reducedMotion ? 600 : 3200);
        break;
      case "BATTLE":
        if (!runtime.lastBattleResult) {
          runtimeManager.update(
            "deterministic_battle_completed_for_playback",
            (draft) => executeCurrentBattleToDraft(draft),
          );
          render();
          return;
        }
        activeBattlePlayback =
          createBattlePlaybackController({
            root,
            runtime,
            onComplete: ({ skipped }) => {
              try {
                runtimeManager.transition("BATTLE_OUTCOME", {
                  reason: skipped
                    ? "battle_playback_skipped"
                    : "battle_playback_completed",
                  patch: {
                    pendingVisualId: "battle-outcome",
                  },
                });
                render();
              } catch (error) {
                handleRuntimeError(error);
              }
            },
            onError: handleRuntimeError,
          });
        activeBattlePlayback.start();
        break;
      case "BATTLE_OUTCOME":
        root.innerHTML = battleOutcomeTemplate(runtime);
        break;
      case "ROUND_RESULT":
        if (!isPlayerActive(runtime) && runtime.activeTeamIds.length > 1) {
          runtimeManager.transition("SPECTATOR_FAST_FORWARD", {
            reason: "player_eliminated_fast_forward",
            patch: { pendingVisualId: "spectator-fast-forward" },
          });
          render();
          return;
        }
        root.innerHTML = roundResultTemplate(runtime);
        break;
      case "SPECTATOR_FAST_FORWARD":
        root.innerHTML = spectatorFastForwardTemplate(runtime);
        scheduleAction(() => {
          try {
            runtimeManager.update(
              "spectator_match_fast_forwarded",
              fastForwardMatchToChampionToDraft,
            );
            runtimeManager.transition("MATCH_CHAMPION", {
              reason: "spectator_fast_forward_completed",
              patch: { pendingVisualId: "match-champion-check" },
            });
            runtimeManager.checkpoint("spectator_fast_forward_completed");
            render();
          } catch (error) {
            handleRuntimeError(error);
          }
        }, runtime.entryData.settings.reducedMotion ? 120 : 1050);
        break;
      case "ROUND_ADVANCE": {
        const totalRounds = getPlayableRoundCount(runtime);
        const hasNextRound =
          runtime.round < totalRounds &&
          runtime.activeTeamIds.length > 1;
        root.innerHTML = provisionalPhaseTemplate(runtime, {
          eyebrow: "ROUND ADVANCE",
          title: hasNextRound
            ? `ROUND ${runtime.round + 1}へ`
            : "MATCH終了判定",
          description: hasNextRound
            ? "HP・スキルCT・MATCH能力補正を保持して次ROUNDへ進みます。"
            : "全ROUNDを完了し、MATCH CHAMPION判定へ移ります。",
          commentary: hasNextRound
            ? `次はROUND ${runtime.round + 1}です！探索タイミングも確認します。`
            : "全ROUND終了！MATCH CHAMPION判定へ進みます。",
          primaryAction: "round-advance-next",
          primaryLabel: hasNextRound ? "NEXT ROUND" : "CHAMPION CHECK",
        });
        if (!isPlayerActive(runtime)) {
          scheduleAction(() => {
            root.querySelector('[data-action="round-advance-next"]')?.click();
          }, runtime.entryData.settings.reducedMotion ? 80 : 420);
        }
        break;
      }
      case "MATCH_CHAMPION":
        if (
          !runtime.matchTotals.some(
            (record) => record.match === runtime.match,
          )
        ) {
          runtimeManager.update(
            "match_result_finalized",
            finalizeCurrentMatchToDraft,
          );
          render();
          return;
        }
        root.innerHTML = renderMatchChampionScreen(runtime);
        break;
      case "MATCH_RESULT":
        root.innerHTML = renderMatchResultScreen(runtime);
        break;
      case "MATCH_POINT":
        root.innerHTML = renderMatchPointScreen(runtime);
        break;
      case "SESSION_COMPLETE":
        root.innerHTML = sessionCompleteTemplate(runtime);
        break;
      case "NEXT_MATCH_WAIT":
        root.innerHTML = renderNextMatchWaitScreen(runtime);
        break;
      case "TOURNAMENT_AWARDS":
        root.innerHTML = renderAwardScreen(runtime);
        break;
      case "TOURNAMENT_RESULT":
        if (!runtime.tournamentResultData) {
          runtimeManager.update(
            "tournament_result_prepared",
            prepareTournamentResultToDraft,
          );
          render();
          return;
        }
        root.innerHTML = renderTournamentResultScreen(runtime);
        break;
      case "RETURNING_RESULT":
        root.innerHTML = renderReturningResultScreen(runtime);
        break;
      case "COMPLETE":
        root.innerHTML = renderReturningResultScreen(runtime);
        break;
      case "SUSPENDED":
        root.innerHTML = suspendedTemplate(runtime);
        break;
      case "ERROR":
        root.innerHTML = errorTemplate(runtime.error, runtime);
        break;
      default:
        root.innerHTML = genericFuturePhaseTemplate(runtime);
        break;
    }
  }

  function handleRuntimeError(error) {
    cancelScheduledAction();
    bootError = error;
    try {
      if (runtimeManager.getSnapshot()) {
        runtimeManager.markError(error);
      }
    } catch (markErrorFailure) {
      console.error(markErrorFailure);
    }
    hideLoading();
    render();
  }

  function advanceOpening() {
    const runtime = runtimeManager.getSnapshot();
    if (!runtime || runtime.phase !== "OPENING") {
      return;
    }
    const nextIndex = runtime.opening.sceneIndex + 1;
    if (nextIndex < runtime.opening.scenes.length) {
      runtimeManager.setOpeningScene(nextIndex);
      if (nextIndex % 3 === 0) {
        runtimeManager.checkpoint(`opening_scene_${nextIndex}`);
      }
    } else {
      runtimeManager.completeOpening({ skipped: false });
      runtimeManager.checkpoint("deployment_start_after_opening");
    }
    render();
  }

  function withUiLock(operation) {
    if (uiLocked) {
      return;
    }
    uiLocked = true;
    try {
      return operation();
    } finally {
      uiLocked = false;
    }
  }

  async function suspendAndReturn() {
    const confirmed = await openConfirm({
      title: "大会を中断保存しますか？",
      body:
        "<p>現在の安全なフェーズを保存し、メイン画面へ戻ります。報酬はまだ付与されません。</p>",
      confirmLabel: "保存して戻る",
      cancelLabel: "大会を続ける",
    });
    if (!confirmed) {
      return;
    }
    showLoading("大会進行を保存しています");
    try {
      runtimeManager.suspend("return_to_main");
      navigate(MAIN_PAGE_URL);
    } catch (error) {
      hideLoading();
      handleRuntimeError(error);
    }
  }

  function boot({ preferResume = true } = {}) {
    showLoading("大会参加データを確認しています");
    cancelScheduledAction();
    bootError = null;
    try {
      runtimeManager.boot({ preferResume });
      hideLoading();
      render();
    } catch (error) {
      bootError = error;
      hideLoading();
      render();
    }
  }

  root.addEventListener(
    "error",
    (event) => {
      if (event.target instanceof HTMLImageElement) {
        event.target.hidden = true;
      }
    },
    true,
  );

  root.addEventListener("click", (event) => {
    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) {
      return;
    }
    const action = actionElement.dataset.action;

    withUiLock(() => {
      try {
        if (action === "opening-next") {
          advanceOpening();
          return;
        }
        if (action === "opening-skip") {
          runtimeManager.completeOpening({ skipped: true });
          runtimeManager.checkpoint("opening_skipped_to_deployment");
          render();
          return;
        }
        if (action === "team-intro-next") {
          runtimeManager.transition("DEPLOYMENT", {
            reason: "team_intro_completed",
          });
          runtimeManager.checkpoint("deployment_start");
          render();
          return;
        }
        if (action === "deployment-next") {
          const currentMatch = Math.max(
            1,
            runtimeManager.getSnapshot().match || 1,
          );
          const planned = runtimeManager.update(
            "match_plan_applied",
            (draft) => {
              draft.match = currentMatch;
              const section = applyMatchPlanToDraft(
                draft,
                currentMatch,
              );
              if (section.playerParticipates) {
                beginExplorationToDraft(draft, {
                  exploreIndex: 1,
                  source: `match_${currentMatch}_initial`,
                });
              }
              return section;
            },
          );
          if (planned.result.playerParticipates) {
            runtimeManager.transition("INITIAL_EXPLORATION", {
              reason: "deployment_completed",
              patch: {
                match: currentMatch,
                round: 0,
                pendingVisualId: "initial-exploration",
              },
            });
            runtimeManager.checkpoint("initial_exploration_ready");
          } else {
            runtimeManager.transition("MATCH_START", {
              reason: "cpu_only_section_ready",
              patch: {
                match: currentMatch,
                round: 0,
                pendingVisualId: "cpu-section-fast-result",
              },
            });
            runtimeManager.checkpoint("cpu_section_ready");
          }
          render();
          return;
        }
        if (action === "match-start-next") {
          const snapshot = runtimeManager.getSnapshot();
          if (!isPlayerMatch(snapshot, snapshot.match)) {
            runtimeManager.update(
              "cpu_only_section_fast_forwarded",
              fastForwardMatchToChampionToDraft,
            );
            runtimeManager.transition("MATCH_CHAMPION", {
              reason: "cpu_only_section_completed",
              patch: {
                pendingVisualId: "cpu-section-champion",
              },
            });
            runtimeManager.checkpoint("cpu_only_section_complete");
          } else {
            runtimeManager.transition("ROUND_INTRO", {
              reason: "formal_match_initialized",
              patch: { round: 1, pendingVisualId: "round-intro" },
            });
          }
          render();
          return;
        }
        if (action === "round-intro-next") {
          const snapshot = runtimeManager.getSnapshot();
          const dueExploreIndex =
            snapshot.activeTeamIds.includes(snapshot.playerTeamId)
              ? getDueRoundExplorationIndex(snapshot)
              : null;
          if (dueExploreIndex !== null) {
            runtimeManager.update(
              "round_exploration_created",
              (draft) =>
                beginExplorationToDraft(draft, {
                  exploreIndex: dueExploreIndex,
                  source: `after_round_${draft.round - 1}`,
                }),
            );
            runtimeManager.transition("ROUND_EXPLORATION", {
              reason: "scheduled_round_exploration",
              patch: {
                pendingVisualId: "round-exploration",
              },
            });
            runtimeManager.checkpoint(
              `round_exploration_${dueExploreIndex}`,
            );
          } else {
            const encounter = runtimeManager.update(
              "round_encounter_resolved",
              resolveRoundEncounterToDraft,
            ).result;
            if (encounter.encountered) {
              runtimeManager.transition("ENCOUNTER_PREVIEW", {
                reason: "encounter_roll_success",
                patch: { pendingVisualId: "encounter-preview" },
              });
            } else {
              runtimeManager.update(
                "round_field_fast_resolved",
                finalizeRoundFieldToDraft,
              );
              runtimeManager.transition("ROUND_RESULT", {
                reason: encounter.reason,
                patch: { pendingVisualId: "round-result" },
              });
              runtimeManager.checkpoint("round_without_visible_battle");
            }
          }
          render();
          return;
        }
        if (action === "encounter-next") {
          runtimeManager.update(
            "strategy_selection_opened",
            (draft) => {
              const currentId =
                draft.teamRuntime[draft.playerTeamId].currentStrategyId;
              const current = draft.strategyRuntime[currentId];
              draft.strategyUi.tab = "ALL";
              draft.strategyUi.selectedId =
                current &&
                (current.unlimited || current.tournamentRemaining > 0)
                  ? currentId
                  : "D-01";
              draft.strategyUi.confirmedId = null;
            },
          );
          runtimeManager.transition("STRATEGY_SELECT", {
            reason: "encounter_confirmed",
            patch: { pendingVisualId: "strategy-select" },
          });
          render();
          return;
        }
        if (action === "exploration-page") {
          runtimeManager.update(
            "exploration_page_changed",
            (draft) =>
              setExplorationPageToDraft(
                draft,
                actionElement.dataset.page,
              ),
          );
          render();
          return;
        }
        if (action === "exploration-search-select") {
          const transaction = runtimeManager.update(
            "exploration_search_point_selected",
            (draft) =>
              selectSearchCandidateToDraft(
                draft,
                actionElement.dataset.candidateId,
              ),
          );
          if (transaction.result.status === "backpack_full") {
            showToast("バッグが満杯です。交換または取得しないを選択してください");
          } else {
            showToast(`${transaction.result.name}をバッグへ収納しました`);
          }
          render();
          return;
        }
        if (action === "exploration-replace-slot") {
          const transaction = runtimeManager.update(
            "exploration_backpack_replaced",
            (draft) =>
              resolveBackpackFullToDraft(draft, {
                replaceSlotIndex: Number(
                  actionElement.dataset.slotIndex,
                ),
              }),
          );
          showToast(
            `${transaction.result.replacedItemId}と交換しました`,
          );
          render();
          return;
        }
        if (action === "exploration-decline-item") {
          runtimeManager.update(
            "exploration_item_declined",
            (draft) =>
              resolveBackpackFullToDraft(draft, {
                decline: true,
              }),
          );
          showToast("探索アイテムを取得しませんでした");
          render();
          return;
        }
        if (action === "exploration-item-open") {
          runtimeManager.update(
            "exploration_item_target_opened",
            (draft) =>
              openItemUseToDraft(
                draft,
                Number(actionElement.dataset.slotIndex),
              ),
          );
          renderPreservingExplorationScroll();
          return;
        }
        if (action === "exploration-item-cancel") {
          runtimeManager.update(
            "exploration_item_target_cancelled",
            cancelItemUseToDraft,
          );
          renderPreservingExplorationScroll();
          return;
        }
        if (action === "exploration-item-use") {
          const transaction = runtimeManager.update(
            "exploration_item_used",
            (draft) =>
              useInventoryItemToDraft(draft, {
                slotIndex: Number(
                  actionElement.dataset.slotIndex,
                ),
                targetPlayerId:
                  actionElement.dataset.playerId ?? null,
              }),
          );
          const scrollTop =
            explorationScrollTop();
          showToast(
            `${transaction.result.name}を使用しました`,
          );
          renderPreservingExplorationScroll(
            scrollTop,
          );
          requestAnimationFrame(() =>
            playExplorationItemUsePresentation(
              transaction.result,
            ),
          );
          return;
        }
        if (action === "facility-respawn") {
          const transaction = runtimeManager.update(
            "respawn_turntable_used",
            (draft) =>
              useRespawnTurntableToDraft(
                draft,
                actionElement.dataset.playerId,
              ),
          );
          showToast(`HP ${transaction.result.hp}で復活しました`);
          render();
          return;
        }
        if (action === "facility-mob-slot") {
          const transaction = runtimeManager.update(
            "mob_slot_used",
            useMobSlotToDraft,
          );
          showToast(
            transaction.result.success
              ? "JACKPOT！生存味方全員を回復しました"
              : "MISS！今回は揃いませんでした",
          );
          render();
          return;
        }
        if (action === "exploration-complete") {
          const phase = runtimeManager.getSnapshot().phase;
          runtimeManager.update(
            "exploration_completed",
            completeExplorationToDraft,
          );
          if (phase === "INITIAL_EXPLORATION") {
            runtimeManager.transition("MATCH_START", {
              reason: "initial_exploration_completed",
              patch: {
                match: runtimeManager.getSnapshot().match,
                round: 0,
                pendingVisualId: "match-start",
              },
            });
            runtimeManager.checkpoint(
              "initial_exploration_completed",
            );
          } else {
            const encounter = runtimeManager.update(
              "post_exploration_encounter_resolved",
              resolveRoundEncounterToDraft,
            ).result;
            if (encounter.encountered) {
              runtimeManager.transition("ENCOUNTER_PREVIEW", {
                reason: "round_exploration_encounter_success",
                patch: {
                  pendingVisualId: "encounter-preview",
                },
              });
            } else {
              runtimeManager.update(
                "post_exploration_field_resolved",
                finalizeRoundFieldToDraft,
              );
              runtimeManager.transition("ROUND_RESULT", {
                reason: encounter.reason,
                patch: { pendingVisualId: "round-result" },
              });
            }
            runtimeManager.checkpoint(
              "round_exploration_completed",
            );
          }
          render();
          return;
        }
        if (action === "strategy-tab") {
          runtimeManager.update(
            "strategy_tab_changed",
            (draft) =>
              setStrategyTabToDraft(
                draft,
                actionElement.dataset.strategyTab,
              ),
          );
          render();
          return;
        }
        if (action === "strategy-select") {
          runtimeManager.update(
            "strategy_selected",
            (draft) =>
              selectStrategyToDraft(
                draft,
                actionElement.dataset.strategyId,
              ),
          );
          render();
          return;
        }
        if (action === "strategy-confirm") {
          const transaction = runtimeManager.update(
            "strategy_confirmed",
            confirmStrategyToDraft,
          );
          runtimeManager.transition("BATTLE_COUNTDOWN", {
            reason: "strategy_confirmed",
            patch: {
              pendingVisualId:
                `strategy-cutin:${transaction.result.strategyId}`,
            },
          });
          runtimeManager.checkpoint(
            "strategy_confirmed_battle_countdown",
          );
          render();
          return;
        }
        if (action === "battle-outcome-next") {
          runtimeManager.update(
            "visible_battle_field_resolved",
            finalizeRoundFieldToDraft,
          );
          const afterBattle = runtimeManager.getSnapshot();
          runtimeManager.transition(
            !isPlayerActive(afterBattle) && afterBattle.activeTeamIds.length > 1
              ? "SPECTATOR_FAST_FORWARD"
              : "ROUND_RESULT",
            {
              reason: !isPlayerActive(afterBattle)
                ? "player_eliminated_after_battle"
                : "battle_round_result_ready",
              patch: { pendingVisualId: !isPlayerActive(afterBattle) ? "spectator-fast-forward" : "round-result" },
            },
          );
          runtimeManager.checkpoint("battle_round_result");
          render();
          return;
        }
        if (action === "round-result-next") {
          runtimeManager.transition("ROUND_ADVANCE", {
            reason: "formal_round_result_confirmed",
            patch: { pendingVisualId: "round-advance" },
          });
          render();
          return;
        }
        if (action === "round-advance-next") {
          const snapshot = runtimeManager.getSnapshot();
          const totalRounds = getPlayableRoundCount(snapshot);
          if (
            snapshot.round < totalRounds &&
            snapshot.activeTeamIds.length > 1
          ) {
            runtimeManager.update(
              "next_round_initialized",
              (draft) => {
                draft.round += 1;
                draft.activeBattle = null;
                draft.lastBattleResult = null;
                draft.lastBattleEvents = [];
                draft.currentOpponentId = null;
                draft.lockedOpponentId = null;
                draft.currentPairs = [];
                draft.teamRuntime[
                  draft.playerTeamId
                ].strategyConsumed = false;
                draft.strategyUi.confirmedId = null;
                draft.pendingVisualId = "round-intro";
              },
            );
            runtimeManager.transition("ROUND_INTRO", {
              reason: "next_round_ready",
            });
          } else {
            runtimeManager.transition("MATCH_CHAMPION", {
              reason: "all_rounds_completed",
              patch: {
                pendingVisualId: "match-champion-check",
              },
            });
          }
          render();
          return;
        }
        if (action === "match-champion-next") {
          runtimeManager.transition("MATCH_RESULT", {
            reason: "formal_match_result_ready",
            patch: { pendingVisualId: "match-result" },
          });
          runtimeManager.checkpoint("formal_match_result");
          render();
          return;
        }
        if (action === "match-result-total") {
          runtimeManager.update(
            "match_total_result_opened",
            (draft) => {
              draft.pendingVisualId =
                `match-result-total:${draft.match}`;
            },
          );
          render();
          return;
        }
        if (action === "match-result-next") {
          const snapshot = runtimeManager.getSnapshot();
          const matchPoint = snapshot.matchPointRuntime;
          const showMatchPoint =
            matchPoint?.enabled &&
            (
              matchPoint.mpWinner !== null ||
              (matchPoint.newEligibleTeamIds?.length ?? 0) > 0
            );
          const allMatchesComplete =
            snapshot.match >=
            snapshot.entryData.tournament.matches;
          if (showMatchPoint) {
            runtimeManager.transition("MATCH_POINT", {
              reason: matchPoint.mpWinner
                ? "match_point_winner_confirmed"
                : "match_point_threshold_reached",
              patch: { pendingVisualId: "match-point" },
            });
          } else if (allMatchesComplete) {
            runtimeManager.transition("SESSION_COMPLETE", {
              reason: "all_matches_completed",
              patch: { pendingVisualId: "session-complete" },
            });
            runtimeManager.checkpoint("session_complete");
          } else {
            runtimeManager.transition("NEXT_MATCH_WAIT", {
              reason: "next_match_wait",
              patch: { pendingVisualId: "next-match-wait" },
            });
            runtimeManager.checkpoint("next_match_wait");
          }
          render();
          return;
        }
        if (action === "match-point-next") {
          const snapshot = runtimeManager.getSnapshot();
          const winner = snapshot.matchPointRuntime?.mpWinner ?? null;
          const allMatchesComplete =
            snapshot.match >= snapshot.entryData.tournament.matches;
          if (winner !== null || allMatchesComplete) {
            runtimeManager.transition("SESSION_COMPLETE", {
              reason: winner !== null
                ? "match_point_tournament_winner"
                : "all_matches_completed",
              patch: { pendingVisualId: "session-complete" },
            });
            runtimeManager.checkpoint("session_complete");
          } else {
            runtimeManager.transition("NEXT_MATCH_WAIT", {
              reason: "match_point_next_match",
              patch: { pendingVisualId: "next-match-wait" },
            });
            runtimeManager.checkpoint("next_match_wait");
          }
          render();
          return;
        }
        if (action === "next-match-start") {
          runtimeManager.update(
            "next_match_prepared",
            prepareNextMatchToDraft,
          );
          runtimeManager.transition("DEPLOYMENT", {
            reason: "next_match_deployment_started",
            patch: {
              pendingVisualId: "deployment",
            },
          });
          runtimeManager.checkpoint("next_match_started");
          render();
          return;
        }
        if (action === "session-complete-next") {
          const snapshot = runtimeManager.getSnapshot();
          if (snapshot.entryData.tournament.suppressAwards === true) {
            runtimeManager.update(
              "stage_result_prepared",
              prepareTournamentResultToDraft,
            );
            runtimeManager.transition("TOURNAMENT_RESULT", {
              reason: "stage_continuation_result_ready",
              patch: { pendingVisualId: "tournament-result" },
            });
            runtimeManager.checkpoint("stage_result_ready");
          } else {
            runtimeManager.update(
              "tournament_awards_prepared",
              prepareAwardsToDraft,
            );
            runtimeManager.transition("TOURNAMENT_AWARDS", {
              reason: "session_complete_confirmed",
              patch: { pendingVisualId: "tournament-awards:0" },
            });
            runtimeManager.checkpoint("tournament_awards_ready");
          }
          render();
          return;
        }
        if (action === "award-next") {
          const transaction = runtimeManager.update(
            "award_advanced",
            advanceAwardToDraft,
          );
          if (transaction.result.completed) {
            runtimeManager.update(
              "tournament_result_prepared",
              prepareTournamentResultToDraft,
            );
            runtimeManager.transition("TOURNAMENT_RESULT", {
              reason: "all_awards_completed",
              patch: {
                pendingVisualId: "tournament-result",
              },
            });
            runtimeManager.checkpoint(
              "tournament_result_ready",
            );
          }
          render();
          return;
        }
        if (action === "return-result") {
          const snapshot = runtimeManager.getSnapshot();
          writePreparedResultToStorage(storage, snapshot);
          runtimeManager.update(
            "tournament_result_written",
            (draft) => {
              draft.returnStatus = "written";
              draft.pendingVisualId = "returning-result";
            },
          );
          storage.removeItem(
            "mob_br_tournament_resume_v1",
          );
          runtimeManager.transition("RETURNING_RESULT", {
            reason: "result_written_to_main_bridge",
          });
          render();
          return;
        }
        if (action === "return-main-with-result") {
          runtimeManager.transition("COMPLETE", {
            reason: "returning_to_main_after_result",
          });
          navigate(MAIN_PAGE_URL);
          return;
        }
        if (action === "save-checkpoint") {
          runtimeManager.checkpoint("manual_checkpoint");
          showToast("大会チェックポイントを保存しました");
          return;
        }
        if (action === "resume-runtime") {
          runtimeManager.resume();
          render();
          return;
        }
        if (action === "retry-boot") {
          boot({ preferResume: true });
          return;
        }
        if (action === "return-main") {
          navigate(MAIN_PAGE_URL);
          return;
        }
        if (action === "suspend-return") {
          suspendAndReturn();
        }
      } catch (error) {
        handleRuntimeError(error);
      }
    });
  });

  modalRoot.addEventListener("click", (event) => {
    const actionElement = event.target.closest("[data-modal-action]");
    if (!actionElement) {
      return;
    }
    closeModal(actionElement.dataset.modalAction === "confirm");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") {
      return;
    }
    try {
      const runtime = runtimeManager.getSnapshot();
      if (
        runtime &&
        !["COMPLETE", "ERROR"].includes(runtime.phase)
      ) {
        runtimeManager.checkpoint("visibility_hidden");
      }
    } catch (error) {
      console.error(error);
    }
  });

  globalThis.addEventListener?.("pagehide", () => {
    try {
      const runtime = runtimeManager.getSnapshot();
      if (
        runtime &&
        !["COMPLETE", "ERROR"].includes(runtime.phase)
      ) {
        runtimeManager.checkpoint("pagehide");
      }
    } catch (error) {
      console.error(error);
    }
  });

  return Object.freeze({
    boot,
    render,
    advanceOpening,
    suspendAndReturn,
    getSnapshot: () => runtimeManager.getSnapshot(),
    getEntry: () => runtimeManager.getEntry(),
    runtimeManager,
  });
}

function preloadTournamentImages(paths, timeoutMs = 1800) {
  if (typeof Image === "undefined") {
    return Promise.resolve();
  }
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

async function bootstrap() {
  const root = document.querySelector("#tournamentApp");
  const modalRoot = document.querySelector("#tournamentModalRoot");
  const toastRoot = document.querySelector("#tournamentToastRoot");
  const loadingOverlay = document.querySelector("#tournamentLoadingOverlay");
  const loadingMessage = document.querySelector("#tournamentLoadingMessage");

  loadingOverlay.setAttribute("aria-hidden", "false");
  loadingMessage.textContent = "大会画像を読み込んでいます";
  await detectAssetPrefix("back/local.png");
  installAssetFallbacks(document);
  await preloadTournamentImages([
    assetPath("back/Load.png"),
    assetPath("back/local.png"),
    assetPath("back/national.png"),
    assetPath("back/world.png"),
    assetPath("back/champ.png"),
    assetPath("back/neon.png"),
    assetPath("back/sabak.png"),
    assetPath("back/magma.png"),
    assetPath("back/inaka.png"),
    assetPath("icon/local.png"),
    assetPath("icon/national.png"),
    assetPath("icon/world.png"),
    assetPath("icon/champ.png"),
    assetPath("icon/mic.png"),
    assetPath("icon/battle.png"),
    assetPath("icon/round.png"),
    assetPath("icon/match.png"),
  ]);
  const controller = createTournamentFlowController({
    root,
    modalRoot,
    toastRoot,
    loadingOverlay,
    loadingMessage,
    storage: window.localStorage,
  });
  controller.boot({ preferResume: true });
  globalThis.mobBrTournament = controller;
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bootstrap, { once: true });
  } else {
    bootstrap();
  }
}
