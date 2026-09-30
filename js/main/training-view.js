import { TRAINING_PROGRAMS, calculateTrainingGain } from '../../data/training-data.js?v=73';
import { advanceGameWeek, getTournamentEventsForDate } from '../../data/game-data.js?v=73';

export const POINT_NAMES = Object.freeze({ power: '筋力', tech: '技術', mental: '精神', shoot: '射撃' });
const esc = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const PURPOSES = {
  strength_training: '筋力ポイントを中心に貯める',
  shooting_practice: '射撃ポイントを中心に貯める',
  strategy_research: '技術ポイントを中心に貯める',
  mental_training: '精神ポイントを中心に貯める',
  combat_drill: '4種類のポイントを幅広く貯める',
  balanced_training: '4種類のポイントを均等に貯める',
};

export function trainingGainText(programId, bonusRate = 0) {
  return Object.entries(calculateTrainingGain(programId, bonusRate))
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `${POINT_NAMES[key]} +${value}`).join(' / ');
}

export function nextTournamentText(snapshot) {
  let date = snapshot.gameDate;
  for (let weeks = 0; weeks < 48; weeks += 1) {
    const events = getTournamentEventsForDate(date);
    if (events.length) return `${weeks === 0 ? '今週開催' : `あと${weeks}週`} · ${events.map(e => e.stageName).join(' / ')}`;
    date = advanceGameWeek(date, 1);
  }
  return '大会予定を確認して、次の目標を決めよう';
}

export function lastWeekTraining(snapshot) {
  const result = snapshot.records?.lastTraining;
  if (!result?.gameDate || !Array.isArray(result.members)) return null;
  const next = advanceGameWeek(result.gameDate);
  return ['year', 'month', 'week'].every(key => next[key] === snapshot.gameDate[key]) ? result : null;
}

export function weeklyGrowthSummary(snapshot) {
  const result = lastWeekTraining(snapshot);
  if (!result) return '';
  return `<div class="weekly-growth"><span>先週の積み重ね</span>${result.members.map(member => {
    const player = snapshot.playerTeam.members.find(p => p.playerId === member.playerId);
    return `<p><strong>${esc(player?.name ?? '')}</strong><span>${Object.entries(member.gain).filter(([,v]) => v > 0).map(([k,v]) => `${POINT_NAMES[k]} +${v}`).join(' / ')}</span></p>`;
  }).join('')}<small>このポイントで、次の試合に向けて能力を伸ばそう。</small></div>`;
}

export function renderTrainingPlan(snapshot, selections, tournamentWeek) {
  const bonus = snapshot.collectionBonuses?.trainingPointRate ?? 0;
  return `<section class="training-plan">
    <header class="training-plan__intro"><span class="training-plan__eyebrow">今週の育成</span>
      <h2>練習で貯めて、能力を伸ばす。</h2>
      <ol class="pw-training-steps"><li>3人の練習を選ぶ</li><li>1週間進めてポイントを獲得</li><li>能力アップで強化する</li></ol>
      <p class="training-plan__schedule">${esc(nextTournamentText(snapshot))}</p>
    </header>
    ${tournamentWeek.trainingBlocked ? '<p class="training-plan__notice">今週は出場予定の大会があります。大会を終えてから次の練習へ進みましょう。</p><button class="secondary-button" data-action="navigate" data-route="schedule">大会予定へ</button>' : ''}
    <div class="training-plan__toolbar"><span>バッジ補正 +${(bonus * 100).toFixed(1)}%（獲得予定に反映済み）</span><button class="secondary-button" data-action="navigate" data-route="ability">貯めたポイントで能力アップ</button></div>
    <form data-form="training" class="training-plan__members">
      ${snapshot.playerTeam.members.map(player => {
        selections[player.playerId] ??= 'balanced_training';
        const program = TRAINING_PROGRAMS.find(p => p.id === selections[player.playerId]) ?? TRAINING_PROGRAMS[5];
        const pool = snapshot.playerTrainingPoints?.[player.playerId] ?? snapshot.trainingPoints;
        return `<article class="training-plan__member" data-training-station="${esc(player.playerId)}">
          <header><img src="${esc(player.image)}" alt=""><div><small>${esc(player.role)}</small><h3>${esc(player.name)}</h3></div></header>
          <div class="training-plan__pool" aria-label="所持ポイント">${Object.entries(POINT_NAMES).map(([key, label]) => `<span>${label}<b>${pool[key]}</b></span>`).join('')}</div>
          <input type="hidden" data-training-player="${esc(player.playerId)}" value="${program.id}">
          <details class="training-plan__choices"><summary><span>今週の練習</span><strong data-training-selected-preview-name>${esc(program.name)}</strong><small>変更する ▾</small></summary>
          <div class="training-plan__programs" role="group" aria-label="${esc(player.name)}の練習">${TRAINING_PROGRAMS.map(p => `<button type="button" data-action="select-training-program" data-player-id="${esc(player.playerId)}" data-program-id="${p.id}" aria-pressed="${p.id === program.id}" class="${p.id === program.id ? 'is-selected' : ''}" ${tournamentWeek.trainingBlocked ? 'disabled' : ''}><strong>${p.name}</strong><small>${PURPOSES[p.id]}</small><span>${trainingGainText(p.id, bonus)}</span></button>`).join('')}</div></details>
          <p class="training-plan__gain"><span>獲得予定</span><strong data-training-gain-preview>${trainingGainText(program.id, bonus)}</strong></p>
        </article>`;
      }).join('')}
      <div class="training-plan__footer"><p>練習で増えるのは能力ポイントです。能力値への振り分けは「能力アップ」で行います。</p><button type="button" class="primary-button" data-action="execute-training" ${tournamentWeek.trainingBlocked ? 'disabled' : ''}>${tournamentWeek.trainingBlocked ? '今週は大会へ' : 'この練習で1週間進める'}</button></div>
    </form>
  </section>`;
}
