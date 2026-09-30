import { TRAINING_PROGRAMS } from '../../data/training-data.js?v=72';
import { POINT_NAMES, lastWeekTraining, nextTournamentText } from './training-view.js?v=72';

const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const dateText = date => `${date.year}年 ${date.month}月 第${date.week}週`;

/** Read the saved result; opening or replaying this screen never grants rewards. */
export function practiceReportModel(snapshot) {
  const record = lastWeekTraining(snapshot);
  if (!record) return null;
  const bonus = snapshot.weeklyBonus?.history?.findLast(entry =>
    ['year', 'month', 'week'].every(key => entry.gameDate?.[key] === snapshot.gameDate[key]));
  return {
    trainedDate: dateText(record.gameDate),
    nextDate: dateText(snapshot.gameDate),
    nextGoal: nextTournamentText(snapshot),
    bonus: bonus?.granted ?? {},
    members: record.members.map(member => {
      const player = snapshot.playerTeam.members.find(p => p.playerId === member.playerId);
      const program = TRAINING_PROGRAMS.find(p => p.id === member.programId);
      const after = member.pointsAfter ?? snapshot.playerTrainingPoints?.[member.playerId] ?? {};
      return {
        name: player?.name ?? '選手', role: player?.role ?? '', image: player?.image ?? '',
        program: program?.name ?? '練習',
        points: Object.entries(POINT_NAMES).map(([id, label]) => ({
          id, label, gain: member.gain[id] ?? 0,
          before: member.pointsBefore?.[id] ?? Math.max(0, (after[id] ?? 0) - (member.gain[id] ?? 0)),
          after: after[id] ?? 0,
        })),
      };
    }),
  };
}

export function renderPracticeReport(snapshot) {
  const model = practiceReportModel(snapshot);
  if (!model) return '';
  return `<div class="practice-report">
    <header class="practice-report__header">
      <div><p class="practice-report__eyebrow">${escape(model.trainedDate)}の練習結果</p>
        <h1 id="practiceReportTitle" tabindex="-1" autofocus>今週の練習、完了！</h1>
        <p id="practiceReportDescription">3人それぞれの能力ポイントが増えました。</p></div>
      <span class="practice-report__stamp" aria-hidden="true">練習<br>完了</span>
    </header>
    <div class="practice-report__content">
      <section class="practice-report__members" aria-label="選手ごとの練習成果">
        ${model.members.map((member,index) => `<article class="practice-player" style="--reveal-order:${index}">
          <header><img src="${escape(member.image)}" alt="" class="practice-player__portrait"><div><span class="practice-player__role">${escape(member.role)}</span><h2>${escape(member.name)}</h2><p>${escape(member.program)}</p></div></header>
          <div class="practice-player__columns"><span>能力ポイント</span><span>獲得</span><span>所持数の変化</span></div>
          <dl>${member.points.map(point => `<div class="practice-point" data-point="${point.id}">
            <dt><i aria-hidden="true"></i>${point.label}</dt><dd class="practice-point__gain ${point.gain ? '' : 'is-zero'}">+${point.gain}</dd>
            <dd class="practice-point__balance"><span>${point.before}</span><span aria-hidden="true">→</span><strong>${point.after}</strong></dd>
          </div>`).join('')}</dl>
        </article>`).join('')}
      </section>
      <section class="practice-report__next" aria-label="次の週の情報">
        <div><span>次の1週間</span><h2>${escape(model.nextDate)}</h2><p>${escape(model.nextGoal)}</p></div>
        <dl aria-label="受取済みの週ボーナス">${[['coin','コイン'],['diamond','ダイヤ'],['ruby','ルビー']].filter(([key])=>model.bonus[key]>0).map(([key,label])=>`<div><dt>${label}</dt><dd>+${Number(model.bonus[key]).toLocaleString('ja-JP')}</dd></div>`).join('')}</dl>
      </section>
    </div>
    <footer class="practice-report__footer"><p>獲得したポイントは「能力アップ」で使えます。<br>能力値の強化は、そこで決めましょう。</p><div>
      <button type="button" class="practice-button practice-button--secondary" data-practice-destination="home">ホームへ</button>
      <button type="button" class="practice-button practice-button--primary" data-practice-destination="ability">能力アップへ <span aria-hidden="true">→</span></button>
    </div></footer>
  </div>`;
}

/** Native dialog provides focus trapping and an inert background, without timers. */
export function presentPracticeReport(snapshot) {
  const markup = renderPracticeReport(snapshot);
  if (!markup) return Promise.resolve('home');
  const previouslyFocused = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.className = 'practice-dialog';
  dialog.setAttribute('aria-labelledby', 'practiceReportTitle');
  dialog.setAttribute('aria-describedby', 'practiceReportDescription');
  dialog.innerHTML = markup;
  document.body.append(dialog);
  return new Promise(resolve => {
    const finish = destination => {
      dialog.close();
      dialog.remove();
      if (previouslyFocused?.isConnected) previouslyFocused.focus({preventScroll:true});
      resolve(destination);
    };
    dialog.addEventListener('click', event => {
      const button = event.target.closest('[data-practice-destination]');
      if (button) finish(button.dataset.practiceDestination);
    });
    dialog.addEventListener('cancel', event => { event.preventDefault(); finish('home'); });
    dialog.showModal();
    dialog.querySelector('h1').focus({preventScroll:true});
    dialog.scrollTop = 0;
  });
}
