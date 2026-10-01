import {TRAINING_COURSES,trainingReward} from "../../data/simple-growth.js?v=76";
import { TRAINING_PROGRAMS, calculateTrainingGain } from '../../data/training-data.js?v=76';
import { advanceGameWeek, getTournamentEventsForDate } from '../../data/game-data.js?v=76';

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
    if (events.length) return `${weeks === 0 ? '今週開催' : `あと${weeks}週`}：${events.map(e => e.stageName).join(' / ')}`;
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
  if(result.currencyVersion===1)return `<div class="weekly-growth"><span>先週のトレーニング</span><p><strong>${esc(result.courseName)}</strong><span>ダイヤ +${result.diamond}</span></p><small>好きな選手の強化に使えます。</small></div>`;
  return `<div class="weekly-growth"><span>先週の積み重ね</span>${result.members.map(member => {
    const player = snapshot.playerTeam.members.find(p => p.playerId === member.playerId);
    return `<p><strong>${esc(player?.name ?? '')}</strong><span>${Object.entries(member.gain).filter(([,v]) => v > 0).map(([k,v]) => `${POINT_NAMES[k]} +${v}`).join(' / ')}</span></p>`;
  }).join('')}<small>このポイントで、次の試合に向けて能力を伸ばそう。</small></div>`;
}

export function renderTrainingPlan(snapshot,selections,tournamentWeek) {
  const selected=TRAINING_COURSES.find(c=>c.id===selections[snapshot.playerTeam.members[0].playerId]) ?? TRAINING_COURSES[0];
  const reward=trainingReward(snapshot,selected.id), done=snapshot.records.trainingCompleted ?? 0;
  const blocked=tournamentWeek.trainingBlocked || snapshot.tournament.activeEntryId !== null;
  return `<section class="training-plan simple-training">
    <header class="training-plan__intro"><span class="training-plan__eyebrow">チームトレーニング</span><h2>ダイヤを使って選手を強化！</h2><p>コースを選ぶ → 1週間練習 → ダイヤで能力アップ</p><p class="training-plan__schedule">${esc(nextTournamentText(snapshot))}</p></header>
    <div class="growth-wallet"><span>所持ダイヤ <strong>${snapshot.resources.diamond.toLocaleString('ja-JP')}</strong></span><button class="secondary-button" data-action="navigate" data-route="ability">能力アップ</button></div>
    <div class="training-milestone"><strong>あと${4-done%4}回の練習で ダイヤ +20</strong><div>${Array.from({length:4},(_,i)=>'<i class="'+(i<done%4?'is-done':'')+'"></i>').join('')}</div><p>途中で大会に出ても、進み具合はリセットされません。</p></div>
    ${blocked?'<p class="training-plan__notice">出場予定の大会を終えると、次の週へ進めます。</p><button class="secondary-button" data-action="navigate" data-route="schedule">大会へ</button>':''}
    <div class="simple-course-grid">${TRAINING_COURSES.map(c=>{const r=trainingReward(snapshot,c.id);return `<button type="button" class="simple-course ${c.id===selected.id?'is-selected':''}" data-action="select-team-course" data-program-id="${c.id}" aria-pressed="${c.id===selected.id}" ${blocked?'disabled':''}><img src="${c.image}" alt=""><h3>${c.name}</h3><strong>ダイヤ +${r.total}</strong><small>${c.coin?'コイン '+c.coin.toLocaleString('ja-JP'):'無料'}</small></button>`}).join('')}</div>
    <form data-form="training">${snapshot.playerTeam.members.map(p=>`<input type="hidden" data-training-player="${esc(p.playerId)}" value="${selected.id}">`).join('')}
    <div class="training-plan__footer"><p>${reward.name}：ダイヤ +${reward.total}${reward.milestone?'（4回達成ボーナス込み）':''}<br>${reward.badge?'バッジ補正 +'+reward.badge+'を含みます。':'3人のうち、誰に使うかはあなた次第。'}</p><button type="button" class="primary-button" data-action="execute-training" ${blocked||snapshot.resources.coin<reward.coin?'disabled':''}>${blocked?'大会を終えてから練習':snapshot.resources.coin<reward.coin?'コインが不足しています':'このコースで1週間練習'}</button></div></form></section>`;
}
