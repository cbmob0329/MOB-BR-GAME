const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

export const BATTLE_ORDERS = Object.freeze({
  balanced: {name:'バランス',description:'持ち味を生かす。\n能力補正なし。',damage:1,accuracy:0,reduction:0},
  rush: {name:'攻める',description:'与ダメージ +18%\n命中率 −8ポイント',damage:1.18,accuracy:-0.08,reduction:0},
  guard: {name:'守る',description:'被ダメージ −18%\n与ダメージ −15%',damage:0.85,accuracy:0,reduction:0.18},
});

export function resolveBattleOrder(runtime, participants) {
  const own = participants.filter(p => p.teamId === runtime.playerTeamId && p.combatState === 'alive');
  const enemy = participants.filter(p => p.teamId !== runtime.playerTeamId && p.combatState === 'alive');
  const hpRate = own.reduce((sum,p)=>sum+p.hp,0) / Math.max(1,own.reduce((sum,p)=>sum+p.maxHp,0));
  const requested = runtime.matchExperience?.order ?? 'auto';
  const recommended = hpRate < 0.45 || own.length < enemy.length ? 'guard' : own.length > enemy.length ? 'rush' : 'balanced';
  const id = BATTLE_ORDERS[requested] ? requested : recommended;
  const focus = ['IGL','ATK','SUP'].includes(runtime.matchExperience?.focus) ? runtime.matchExperience.focus : null;
  return {id,...BATTLE_ORDERS[id],focus,automatic:!BATTLE_ORDERS[requested],reason:hpRate < 0.45 ? '残りHPが少ないため、防御を優先。' : own.length < enemy.length ? '人数不利のため、被害を抑える。' : own.length > enemy.length ? '人数有利を生かして攻める。' : '人数は互角。選手の持ち味を生かす。'};
}

export function renderOrderPanel(runtime) {
  const order = runtime.matchExperience?.order ?? 'auto';
  const focus = runtime.matchExperience?.focus ?? 'auto';
  return `<section class="match-orders" aria-label="交戦指示"><header><span>あなたの判断が、3人の戦い方を変える</span><h2>この交戦の指示</h2><p>作戦に加えて、攻守の方針と狙う役職を選べます。</p></header><div class="match-orders__grid">${[['auto',{name:'おまかせ',description:'残りHPと生存人数から方針を選ぶ。'}],...Object.entries(BATTLE_ORDERS)].map(([id,item])=>`<button type="button" data-action="battle-order" data-order="${id}" aria-pressed="${order===id}"><strong>${item.name}</strong><span>${item.description}</span></button>`).join('')}</div><div class="match-orders__targets"><strong>優先して狙う相手</strong>${[['auto','選手に任せる'],['IGL','IGL'],['ATK','ATK'],['SUP','SUP']].map(([id,name])=>`<button type="button" data-action="battle-focus-role" data-focus="${id}" aria-pressed="${focus===id}">${name}</button>`).join('')}</div><p>役職指定は狙いやすさを上げます。指定相手が倒れたら、ほかの相手を狙います。</p></section>`;
}

export const AUTO_PHASE_ACTIONS = Object.freeze({
  DEPLOYMENT:'deployment-next',INITIAL_EXPLORATION:'exploration-complete',ROUND_EXPLORATION:'exploration-complete',
  MATCH_START:'match-start-next',ROUND_INTRO:'round-intro-next',ENCOUNTER_PREVIEW:'encounter-next',STRATEGY_SELECT:'strategy-confirm',
  BATTLE_OUTCOME:'battle-outcome-next',ROUND_RESULT:'round-result-next',ROUND_ADVANCE:'round-advance-next',
  MATCH_CHAMPION:'match-champion-next',MATCH_RESULT:'match-result-next',MATCH_POINT:'match-point-next',NEXT_MATCH_WAIT:'next-match-start',
});

export function renderTournamentDirector(runtime) {
  const auto = runtime.matchExperience?.autoAdvance === true;
  return `<aside class="tournament-director" aria-label="大会の進め方"><div><strong>${auto?'オート観戦':'手動で指揮'}</strong><span>${esc(runtime.entryData.tournament.tournamentName)} · 第${Math.max(1,runtime.match)}試合 · ROUND ${Math.max(1,runtime.round)}</span></div><p>${auto?'画面を順番に進めます。作戦は回数無制限の基本作戦を使用。':'交戦前に指示を選び、好きなタイミングで進めます。'}</p><button type="button" data-action="toggle-match-auto" aria-pressed="${auto}">${auto?'手動に切り替える':'オート観戦にする'}</button></aside>`;
}

export function renderBattleStory(runtime,model) {
  const members=Object.values(model.participants);
  const own=members.filter(p=>p.teamId===model.playerTeamId),enemy=members.filter(p=>p.teamId!==model.playerTeamId);
  const alive = team => team.filter(p=>p.combatState==='alive').length;
  const hp = team => Math.round(team.reduce((s,p)=>s+Math.max(0,p.hp),0)/Math.max(1,team.reduce((s,p)=>s+p.maxHp,0))*100);
  const command=runtime.lastBattleCommand;
  const message=alive(own)>alive(enemy)?'人数有利。連携で押し切ろう。':alive(own)<alive(enemy)?'人数不利。回復と蘇生が逆転の鍵。':hp(own)<35?'残りHPに注意。支援の動きに注目。':alive(own)<3?'人数は互角。残る選手の連携に注目。':'人数は互角。最初のダウンが勝負を動かす。';
  return `<aside class="battle-story"><div><span>味方 ${alive(own)}人</span><strong>HP ${hp(own)}%</strong></div><p>${message}</p><div><span>相手 ${alive(enemy)}人</span><strong>HP ${hp(enemy)}%</strong></div><small>交戦指示：${esc(command?.name??'バランス')}${command?.automatic?'（おまかせ）':''} / 優先：${esc(command?.focus??'選手に任せる')}</small></aside>`;
}

export function renderTournamentEpilogue(runtime,result) {
  const best=[...result.memberResults].filter(p => p.damage + p.healing > 0).sort((a,b)=>(b.damage+b.healing)-(a.damage+a.healing))[0];
  return `<section class="tournament-epilogue"><span>TEAM REVIEW</span><h2>${result.status==='stage_in_progress'?'挑戦は、まだ続く。':result.finalPlace===1?'3人でつかんだ、1位。':'この経験を、次の勝利へ。'}</h2><div class="tournament-epilogue__roster">${result.memberResults.map(p=>`<article><img src="${esc(p.image)}" alt=""><strong>${esc(p.name)}</strong><span>${p.kills}撃破 · ${Math.round(p.damage).toLocaleString('ja-JP')}ダメージ</span></article>`).join('')}</div><p>${best?`${esc(best.name)}が攻撃と回復でチームを支えました。`:''}</p><p>${result.finalPlace===1?'育てた力が、ここで実を結びました。':'結果を振り返り、伸ばしたい能力を決めましょう。'}<br>ホームに戻ると、大会の報酬を受け取れます。</p></section>`;
}
