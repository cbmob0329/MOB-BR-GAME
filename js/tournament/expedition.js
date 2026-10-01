const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export const EXPEDITION_ROUTES=Object.freeze([
 {id:'recovery',name:'救護ルート',tag:'立て直す',icon:'＋',text:'全員のHPを45%回復。戦闘不能の選手はHP60%で復帰。',bonus:'次の交戦：被ダメージ −8%'},
 {id:'supply',name:'補給ルート',tag:'押し切る',icon:'◇',text:'全員のHPを15%回復。戦闘不能の選手はHP35%で復帰。',bonus:'次の交戦：与ダメージ ＋12%'},
 {id:'recon',name:'偵察ルート',tag:'先手を取る',icon:'◎',text:'全員のHPを15%回復。戦闘不能の選手はHP35%で復帰。',bonus:'次の交戦：命中 ＋8%・機動力 ＋12'},
]);
const members=r=>r.teams.find(t=>t.teamId===r.playerTeamId).members;
export function recommendedRoute(r){return members(r).some(p=>{const m=r.memberRuntime[p.playerId];return m.combatState!=='alive'||m.hp/m.maxHp<.65;})?'recovery':r.round<3?'recon':'supply';}
export function selectExpeditionRouteToDraft(r,id){
 const key=r.explorationRuntime.currentExploreKey,c=r.explorationRuntime.deterministicChoices[key],route=EXPEDITION_ROUTES.find(x=>x.id===id);
 if(!c||c.completed||!route)throw new RangeError('選択できる探索ルートがありません。');
 if(c.routeId)return c.routeResult;
 const result=[];
 for(const p of members(r)){
  const m=r.memberRuntime[p.playerId],before=m.hp,revived=m.combatState!=='alive';
  if(revived){m.combatState='alive';m.hp=Math.max(1,Math.floor(m.maxHp*(id==='recovery'?.6:.35)));m.lifeSerial=(m.lifeSerial??1)+1;m.lifeId=`${p.playerId}-life-${m.lifeSerial}`;m.reviveCount=(m.reviveCount??0)+1;}
  else m.hp=Math.min(m.maxHp,m.hp+Math.round(m.maxHp*(id==='recovery'?.45:.15)));
  result.push({playerId:p.playerId,name:p.name,before,after:m.hp,revived});
 }
 const team=r.teamRuntime[r.playerTeamId];team.matchHp=members(r).map(p=>r.memberRuntime[p.playerId].hp);team.persistentHp=[...team.matchHp];team.combatState=members(r).map(()=> 'alive');
 c.routeId=id;c.routeResult=result;c.searchResolved=true;c.emergencyRespawnRequired=false;
 r.explorationRuntime.history.push({type:'expedition_route',exploreKey:key,routeId:id,result});
 r.explorationRuntime.pendingExploreItem=null;r.explorationRuntime.pendingItemUse=null;
 r.expeditionBonus={routeId:id,exploreKey:key,used:false};
 return result;
}
export function renderExpedition(r){
 const key=r.explorationRuntime.currentExploreKey,c=r.explorationRuntime.deterministicChoices[key];if(!c)throw new RangeError('探索データがありません。');
 const selected=EXPEDITION_ROUTES.find(x=>x.id===c.routeId),recommended=recommendedRoute(r);
 return `<main class="expedition"><header><span>ROUND ${r.round||1} / 補給タイム</span><h1>次の一戦へ、ルートを選ぶ</h1><p>効果は確定。1ルートを選んで、チームを整えよう。</p></header><section class="expedition-team" aria-label="チームの状態">${members(r).map(p=>{const m=r.memberRuntime[p.playerId];return `<article><img src="${esc(p.image)}" alt=""><strong>${esc(p.name)}</strong><span>${m.combatState==='alive'?`HP ${Math.ceil(m.hp)} / ${m.maxHp}`:'戦闘不能'}</span><meter min="0" max="${m.maxHp}" value="${m.hp}"></meter></article>`}).join('')}</section><div class="expedition-path" aria-hidden="true"><i></i><span>現在地</span><b>→</b><span>ルート選択</span><b>→</b><span>次の交戦</span></div><section class="expedition-routes" aria-label="探索ルート">${EXPEDITION_ROUTES.filter(x=>!selected||x.id===selected.id).map(x=>`<button type="button" data-action="expedition-route" data-route-id="${x.id}" ${selected?'disabled':''} aria-pressed="${c.routeId===x.id}" class="expedition-route ${c.routeId===x.id?'is-selected':''}"><span class="expedition-route__icon" aria-hidden="true">${x.icon}</span><small>${x.id===recommended&&!selected?'おすすめ':x.tag}</small><h2>${x.name}</h2><p>${x.text}</p><strong>${x.bonus}</strong></button>`).join('')}</section>${selected?`<section class="expedition-result" role="status"><h2>${selected.name}を通過！</h2><p>${selected.bonus}</p><div>${c.routeResult.map(x=>`<span>${esc(x.name)} ${x.revived?'復帰':'HP回復'} <b>${Math.ceil(x.before)} → ${Math.ceil(x.after)}</b></span>`).join('')}</div></section>`:'<p class="expedition-note">どのルートでも戦闘不能の仲間が復帰。ルート効果は次の交戦1回に適用します。</p>'}<footer><button type="button" data-action="suspend-return">中断保存</button><button type="button" data-action="exploration-complete" ${selected?'':'disabled'}>${selected?'準備完了・次へ':'ルートを選んでください'}</button></footer></main>`;
}
