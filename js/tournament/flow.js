/**
 * MOB BR tournament presentation flow.
 *
 * Tournament presentation flow with automatic entry loading, opening,
 * deterministic battle playback, result screens, suspension, and errors.
 */

import {
  TOURNAMENT_PHASES,
  createTournamentRuntimeManager,
} from "./runtime.js";
import {
  executeCurrentBattleToDraft,
} from "./battle-core.js";
import {
  createBattlePlaybackController,
  renderBattleOutcomeScreen,
} from "./battle-ui.js";
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
} from "./exploration.js";
import {
  advanceAwardToDraft,
  finalizeCurrentMatchToDraft,
  prepareAwardsToDraft,
  prepareNextMatchToDraft,
  prepareTournamentResultToDraft,
  renderAwardScreen,
  renderMatchChampionScreen,
  renderMatchResultScreen,
  renderNextMatchWaitScreen,
  renderReturningResultScreen,
  renderTournamentResultScreen,
  writePreparedResultToStorage,
} from "./results.js";

export const TOURNAMENT_FLOW_VERSION = "mobbr-tournament-flow-1.5.0";

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
  ROUND_ADVANCE: "ROUND進行",
  MATCH_CHAMPION: "MATCH CHAMPION",
  MATCH_RESULT: "MATCH結果",
  NEXT_MATCH_WAIT: "次MATCH待機",
  TOURNAMENT_AWARDS: "個人表彰",
  TOURNAMENT_RESULT: "大会総合結果",
  RETURNING_RESULT: "結果返却",
  COMPLETE: "完了",
  SUSPENDED: "中断保存済み",
  ERROR: "エラー",
});

const MAIN_PAGE_URL = "./index.html";
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

function topStatusTemplate(runtime) {
  const activeTeams = runtime.activeTeamIds.length;
  const match = runtime.match > 0 ? runtime.match : "-";
  const round = runtime.round > 0 ? runtime.round : "-";
  return `
    <header class="tournament-status">
      <div class="tournament-status__main">
        <div class="tournament-status__title">
          <strong>${escapeHtml(runtime.entryData.tournament.tournamentName)}</strong>
          <span>${escapeHtml(runtime.entryData.tournament.stageName)}</span>
        </div>
        <div class="tournament-status__phase">
          ${escapeHtml(formatTournamentPhase(runtime.phase))}
        </div>
      </div>
      <div class="tournament-status__metrics">
        <span>MATCH <strong>${match}</strong></span>
        <span>ROUND <strong>${round}</strong></span>
        <span>ALIVE <strong>${activeTeams}</strong></span>
      </div>
      <div class="tournament-status__progress" aria-hidden="true">
        <span style="width:${getTournamentProgress(runtime).toFixed(2)}%"></span>
      </div>
    </header>
  `;
}

function commentaryTemplate(text, label = "モブマイク") {
  return `
    <aside class="commentary-panel">
      <img src="icon/mic.png" alt="${escapeAttribute(label)}">
      <div>
        <strong>${escapeHtml(label)}</strong>
        <p>${escapeHtml(text)}</p>
      </div>
    </aside>
  `;
}

function loadingTemplate(runtime) {
  return `
    <main class="tournament-screen tournament-screen--loading">
      ${topStatusTemplate(runtime)}
      <section class="tournament-loading-card">
        <p>MOB BR TOURNAMENT SYSTEM</p>
        <h1>${escapeHtml(runtime.entryData.tournament.tournamentName)}</h1>
        <div class="tournament-spinner" aria-hidden="true"></div>
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
        <img src="${escapeAttribute(image)}" alt="">
      `).join("")}
    </div>
  `;
}

function openingTemplate(runtime) {
  const scene = runtime.opening.scenes[runtime.opening.sceneIndex];
  const sceneNumber = runtime.opening.sceneIndex + 1;
  const isLast = sceneNumber === runtime.opening.scenes.length;
  return `
    <main
      class="tournament-screen tournament-screen--opening"
      style="--opening-background:url('${escapeAttribute(scene.backgroundImage)}')"
    >
      ${topStatusTemplate(runtime)}
      <section class="opening-stage opening-stage--${escapeAttribute(scene.type.toLowerCase())}">
        <div class="opening-stage__scan" aria-hidden="true"></div>
        ${sceneForegroundTemplate(scene)}
        <div class="opening-stage__copy">
          <span>SCENE ${sceneNumber} / ${runtime.opening.scenes.length}</span>
          <h1>${escapeHtml(scene.text)}</h1>
          <p>${escapeHtml(scene.subtext ?? "")}</p>
        </div>
      </section>
      <div class="tournament-bottom-area">
        ${commentaryTemplate(scene.commentary)}
        <div class="tournament-actions tournament-actions--opening">
          <button
            type="button"
            class="tournament-button tournament-button--ghost"
            data-action="opening-skip"
            ${scene.canSkip ? "" : "disabled"}
          >
            SKIP OPENING
          </button>
          <button
            type="button"
            class="tournament-button tournament-button--primary"
            data-action="opening-next"
          >
            ${isLast ? "TEAM INTRO" : "NEXT"}
          </button>
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
        <small>
          ${escapeHtml(team.source)} /
          ${escapeHtml(team.form.toUpperCase())} /
          ${escapeHtml(team.description || "CPU TEAM")}
        </small>
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
    <main class="tournament-screen tournament-screen--team-intro">
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
          `${runtime.entryData.playerTeam.teamName}を含む全${runtime.teams.length}チームを紹介します！`,
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
            DEPLOYMENT
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
      style="--map-background:url('${escapeAttribute(runtime.map.image)}')"
    >
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
          `全${runtime.activeTeamIds.length}チーム、降下開始です！`,
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
      style="--map-background:url('${escapeAttribute(runtime.map.image)}')"
    >
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
        <article><span>ROUND TARGETS</span><strong>${runtime.entryData.tournament.roundTargets.length}</strong></article>
        <article><span>HP STATE</span><strong>READY</strong></article>
        <article><span>SKILL CT</span><strong>0 START</strong></article>
      </div>
    `,
  });
}

function roundIntroTemplate(runtime) {
  return provisionalPhaseTemplate(runtime, {
    eyebrow: "ROUND INTRO",
    title: `ROUND ${runtime.round}`,
    description:
      "生存チーム・探索済みキー・接敵状態を確認するフェーズです。",
    commentary: `ROUND ${runtime.round}、接敵データを確認します！`,
    primaryAction: "round-intro-next",
    primaryLabel: "ENCOUNTER",
    content: `
      <div class="round-target-line">
        ${runtime.entryData.tournament.roundTargets.map((target, index) => `
          <span class="${index === runtime.round - 1 ? "is-current" : ""}">
            ${target}
          </span>
        `).join("")}
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
  return provisionalPhaseTemplate(runtime, {
    eyebrow: "ENCOUNTER PREVIEW",
    title: opponent?.teamName ?? "CPU TEAM",
    description:
      opponent?.description ||
      "正式CPUロスターを大会ランタイムから読み込みました。",
    commentary: opponent
      ? `${opponent.teamName}との接敵を確認！作戦準備へ移ります。`
      : "CPU対戦相手を確認できません。",
    primaryAction: "encounter-next",
    primaryLabel: "作戦確認",
    content: `
      <div class="encounter-preview-grid">
        <section class="encounter-team encounter-team--player">
          <span>PLAYER TEAM</span>
          <h2>${escapeHtml(runtime.entryData.playerTeam.teamName)}</h2>
          ${members.map((member) => `
            <div>
              <img src="${escapeAttribute(member.image)}" alt="">
              <strong>${escapeHtml(member.role)} ${escapeHtml(member.name)}</strong>
              <small>HP ${member.currentHp} / ${member.maxHp} — ${escapeHtml(member.weapon.weaponName)}</small>
            </div>
          `).join("")}
        </section>
        <section class="encounter-team encounter-team--cpu">
          <span>CPU TEAM / ${escapeHtml(opponent?.form?.toUpperCase() ?? "NORMAL")}</span>
          <h2>${escapeHtml(opponent?.teamName ?? "CPU TEAM")}</h2>
          ${
            opponent
              ? opponent.members.map((member) => `
                  <div>
                    <img src="${escapeAttribute(member.image)}" alt="">
                    <strong>${escapeHtml(member.role)} ${escapeHtml(member.name)}</strong>
                    <small>
                      RANK ${escapeHtml(member.characterRank)} —
                      ${escapeHtml(member.weapon.weaponName)} /
                      ${escapeHtml(member.weapon.preferredRange)}
                    </small>
                  </div>
                `).join("")
              : `<div class="pending-opponent-mark">!</div>`
          }
        </section>
      </div>
    `,
  });
}

function battleCountdownTemplate(runtime) {
  const strategy =
    runtime.strategyRuntime[
      runtime.teamRuntime[runtime.playerTeamId].currentStrategyId
    ];
  return provisionalPhaseTemplate(runtime, {
    eyebrow: "BATTLE COUNTDOWN",
    title: "3 · 2 · 1",
    description:
      "作戦は選択時点では未消費です。戦闘ランタイム生成時に確定消費します。",
    commentary: `${strategy?.name ?? "バランスを大事に"}で戦闘を開始します！`,
    primaryAction: "battle-countdown-now",
    primaryLabel: "START",
    content: `
      ${renderStrategyCutIn(runtime)}
      <div class="countdown-pulse">BATTLE</div>
    `,
  });
}

function battleOutcomeTemplate(runtime) {
  return renderBattleOutcomeScreen(runtime);
}

function roundResultTemplate(runtime) {
  const result = runtime.lastBattleResult;
  const members = result?.participantResults.filter(
    (member) => member.teamId === runtime.playerTeamId,
  ) ?? [];
  const sourceById = new Map(
    runtime.entryData.playerTeam.members.map(
      (member) => [member.playerId, member],
    ),
  );

  return provisionalPhaseTemplate(runtime, {
    eyebrow: "ROUND RESULT",
    title: `MATCH ${runtime.match} / ROUND ${runtime.round}`,
    description:
      result
        ? `勝者 ${escapeHtml(runtime.teams.find((team) => team.teamId === result.winnerTeamId)?.teamName ?? (result.draw ? "DRAW" : "未確定"))}`
        : "戦闘結果なし",
    commentary: "選手別の戦闘成績と次戦へ持ち越す状態を確認します。",
    primaryAction: "round-result-next",
    primaryLabel: "MATCH判定",
    content: `
      <div class="provisional-result-list actual-round-result-list">
        ${members.map((member) => {
          const source = sourceById.get(member.playerId);
          const postBattle =
            runtime.memberRuntime[member.playerId];
          return `
            <article data-combat-state="${escapeAttribute(member.combatState)}">
              <img src="${escapeAttribute(source?.image ?? "")}" alt="">
              <div>
                <strong>${escapeHtml(member.role)} ${escapeHtml(source?.name ?? member.name)}</strong>
                <small>
                  戦闘終了 ${member.combatState.toUpperCase()} /
                  次戦HP ${postBattle.hp} / ${postBattle.maxHp}
                </small>
              </div>
              <span>
                DMG ${formatNumber(member.stats.damage)} /
                TAKEN ${formatNumber(member.stats.damageTaken)} /
                HEAL ${formatNumber(member.stats.healing)}<br>
                K ${member.stats.kills} /
                A ${member.stats.assists} /
                DOWN ${member.stats.downsGiven}<br>
                SHOT ${member.stats.shots} /
                HIT ${member.stats.hits} /
                ${Math.round(member.stats.accuracy * 100)}% /
                RELOAD ${member.stats.weaponReloads}
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

function lockRoundOpponentToDraft(draft) {
  const cpuTeamIds = draft.activeTeamIds.filter(
    (teamId) => teamId !== draft.playerTeamId,
  );
  if (cpuTeamIds.length === 0) {
    throw new Error("対戦可能なCPUチームがありません。");
  }
  const recentOpponents = draft.battleHistory
    .slice(-2)
    .map((record) => record.opponentTeamId);
  const preferred = cpuTeamIds.filter(
    (teamId) => !recentOpponents.includes(teamId),
  );
  const source = preferred.length > 0 ? preferred : cpuTeamIds;
  const opponentId = source[(draft.round - 1) % source.length];
  draft.currentOpponentId = opponentId;
  draft.lockedOpponentId = opponentId;
  draft.currentPairs = [[draft.playerTeamId, opponentId]];
  return opponentId;
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
        root.innerHTML = teamIntroTemplate(runtime);
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
        }, runtime.entryData.settings.reducedMotion ? 0 : 1100);
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
        root.innerHTML = roundResultTemplate(runtime);
        break;
      case "ROUND_ADVANCE": {
        const totalRounds =
          runtime.entryData.tournament.roundTargets.length;
        const hasNextRound = runtime.round < totalRounds;
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
      runtimeManager.checkpoint("team_intro_start");
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
          runtimeManager.checkpoint("opening_skipped_to_team_intro");
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
          runtimeManager.update(
            "initial_exploration_created",
            (draft) => {
              draft.match = 1;
              draft.round = 0;
              return beginExplorationToDraft(draft, {
                exploreIndex: 1,
                source: "initial",
              });
            },
          );
          runtimeManager.transition("INITIAL_EXPLORATION", {
            reason: "deployment_completed",
            patch: {
              match: 1,
              round: 0,
              pendingVisualId: "initial-exploration",
            },
          });
          runtimeManager.checkpoint("initial_exploration_ready");
          render();
          return;
        }
        if (action === "match-start-next") {
          runtimeManager.transition("ROUND_INTRO", {
            reason: "formal_match_initialized",
            patch: { round: 1, pendingVisualId: "round-intro" },
          });
          render();
          return;
        }
        if (action === "round-intro-next") {
          const snapshot = runtimeManager.getSnapshot();
          const dueExploreIndex =
            getDueRoundExplorationIndex(snapshot);
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
            runtimeManager.update(
              "cpu_opponent_locked",
              lockRoundOpponentToDraft,
            );
            runtimeManager.transition("ENCOUNTER_PREVIEW", {
              reason: "formal_cpu_opponent_locked",
              patch: { pendingVisualId: "encounter-preview" },
            });
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
            "exploration_candidate_selected",
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
          render();
          return;
        }
        if (action === "exploration-item-cancel") {
          runtimeManager.update(
            "exploration_item_target_cancelled",
            cancelItemUseToDraft,
          );
          render();
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
          showToast(`${transaction.result.name}を使用しました`);
          render();
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
                match: 1,
                round: 0,
                pendingVisualId: "match-start",
              },
            });
            runtimeManager.checkpoint(
              "initial_exploration_completed",
            );
          } else {
            runtimeManager.update(
              "post_exploration_opponent_locked",
              lockRoundOpponentToDraft,
            );
            runtimeManager.transition("ENCOUNTER_PREVIEW", {
              reason: "round_exploration_completed",
              patch: {
                pendingVisualId: "encounter-preview",
              },
            });
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
        if (action === "battle-countdown-now") {
          runtimeManager.transition("BATTLE", {
            reason: "strategy_countdown_skipped",
          });
          render();
          return;
        }
        if (action === "battle-outcome-next") {
          runtimeManager.transition("ROUND_RESULT", {
            reason: "battle_round_result_ready",
            patch: { pendingVisualId: "round-result" },
          });
          runtimeManager.checkpoint("battle_round_result");
          render();
          return;
        }
        if (action === "round-result-next") {
          runtimeManager.transition("ROUND_ADVANCE", {
            reason: "provisional_round_result_confirmed",
            patch: { pendingVisualId: "round-advance" },
          });
          render();
          return;
        }
        if (action === "round-advance-next") {
          const snapshot = runtimeManager.getSnapshot();
          const totalRounds =
            snapshot.entryData.tournament.roundTargets.length;
          if (snapshot.round < totalRounds) {
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
        if (action === "match-result-next") {
          const snapshot = runtimeManager.getSnapshot();
          const matchPointWinner =
            snapshot.matchPointRuntime?.mpWinner ?? null;
          const allMatchesComplete =
            snapshot.match >=
            snapshot.entryData.tournament.matches;
          if (matchPointWinner !== null || allMatchesComplete) {
            runtimeManager.update(
              "tournament_awards_prepared",
              prepareAwardsToDraft,
            );
            runtimeManager.transition("TOURNAMENT_AWARDS", {
              reason:
                matchPointWinner !== null
                  ? "match_point_winner_confirmed"
                  : "all_matches_completed",
              patch: {
                pendingVisualId: "tournament-awards:0",
              },
            });
            runtimeManager.checkpoint(
              "tournament_awards_ready",
            );
          } else {
            runtimeManager.transition("NEXT_MATCH_WAIT", {
              reason: "next_match_wait",
              patch: {
                pendingVisualId: "next-match-wait",
              },
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
          runtimeManager.transition("MATCH_START", {
            reason: "next_match_started",
            patch: {
              pendingVisualId: "match-start",
            },
          });
          runtimeManager.checkpoint("next_match_started");
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

function bootstrap() {
  const root = document.querySelector("#tournamentApp");
  const modalRoot = document.querySelector("#tournamentModalRoot");
  const toastRoot = document.querySelector("#tournamentToastRoot");
  const loadingOverlay = document.querySelector("#tournamentLoadingOverlay");
  const loadingMessage = document.querySelector("#tournamentLoadingMessage");

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
