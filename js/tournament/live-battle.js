import {beginLiveBattleToDraft,updateLiveBattleToDraft} from './battle-core.js?v=75';
import {getUsableReadySkills,skillEffectiveCt} from './battle-actions.js?v=75';
import {assetPath} from '../assets.js?v=75';
import {autoItem} from '../../data/auto-items.js?v=75';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function liveBattleMarkup(runtime){
 const battle=runtime.activeBattle, players=Object.values(battle.participants),own=players.filter(p=>p.teamId===battle.leftTeamId),enemy=players.filter(p=>p.teamId!==battle.leftTeamId);
 const card=p=>`<article class="live-fighter" data-live-player="${esc(p.playerId)}"><img src="${esc(assetPath(p.image))}" alt=""><div><span>${esc(p.role)}</span><h3>${esc(p.name)}</h3><div class="live-hp"><i></i></div><strong data-hp></strong><small data-state></small></div><b data-hit aria-hidden="true"></b></article>`;
 return `<main class="live-battle" style="--arena-image:url('${esc(new URL(assetPath(runtime.map.image),globalThis.location?.href ?? 'http://localhost/').href)}')"><header class="live-battle__header"><div><span>${esc(runtime.entryData.tournament.stageName??'MOB BR')}</span><h1>第${runtime.match}試合 <small>ROUND ${runtime.round}</small></h1></div><strong data-live-clock></strong><button type="button" data-live-pause>一時停止</button></header><section class="live-score"><strong data-live-allies></strong><span>VS</span><strong data-live-enemies></strong></section><div class="live-arena"><section class="live-squad"><h2>${esc(battle.teamNames[battle.leftTeamId])}</h2>${own.map(card).join('')}</section><section class="live-squad live-squad--enemy"><h2>${esc(battle.teamNames[battle.rightTeamId])}</h2>${enemy.map(card).join('')}</section></div><div class="live-callout" role="status" aria-live="polite"><span data-live-event>交戦開始。通常攻撃は自動です。</span></div><section class="live-controls"><header><div><h2>スキルをタップして発動</h2><p>光ったら準備完了。回復・蘇生は対象がいる時に使えます。</p></div><button type="button" data-live-auto aria-pressed="false">スキル AUTO OFF</button></header><div class="live-skill-grid">${own.map(p=>`<article><h3>${esc(p.name)}</h3>${p.skills.map(s=>`<button type="button" data-live-skill="${esc(s.skillId)}" data-live-actor="${esc(p.playerId)}"><span>${esc(s.name)}</span><strong>準備中</strong><i></i></button>`).join('')}<p class="live-equipment" data-live-item="${esc(p.playerId)}"></p></article>`).join('')}</div><footer><span>通常攻撃・アイテムは自動</span><button type="button" data-live-speed>速度 1倍</button><button type="button" data-live-finish>オートで最後まで</button></footer></section></main>`;
}
export function createLiveBattleController({root,runtimeManager,onComplete,onError}) {
 let timer=null,paused=false,destroyed=false,speed=1,lastEvent='',previousHp=new Map();
 const snapshot=()=>runtimeManager.getSnapshot();
 function checkpoint(){if(!destroyed)runtimeManager.checkpoint('live_battle_progress');}
 function draw(){
  const runtime=snapshot(),b=runtime.activeBattle;if(!b)return;
  const all=Object.values(b.participants),own=all.filter(p=>p.teamId===b.leftTeamId),enemy=all.filter(p=>p.teamId!==b.leftTeamId);
  root.querySelector('[data-live-clock]').textContent=`残り ${Math.max(0,(b.durationSeconds-b.elapsedSeconds)*2).toFixed(1)}秒`;
  root.querySelector('[data-live-allies]').textContent=`味方 ${own.filter(p=>p.combatState==='alive').length}人`;
  root.querySelector('[data-live-enemies]').textContent=`相手 ${enemy.filter(p=>p.combatState==='alive').length}人`;
  root.querySelector('[data-live-pause]').textContent=paused?'再開する':'一時停止';
  const auto=root.querySelector('[data-live-auto]');auto.textContent=`スキル AUTO ${b.liveControls.autoSkills?'ON':'OFF'}`;auto.setAttribute('aria-pressed',String(b.liveControls.autoSkills));
  for(const el of root.querySelectorAll('[data-live-player]')) {
   const p=b.participants[el.dataset.livePlayer],old=previousHp.get(p.playerId);
   el.querySelector('[data-hp]').textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;
   el.querySelector('.live-hp i').style.width=`${Math.max(0,p.hp/p.maxHp*100)}%`;
   el.dataset.state=p.combatState;el.querySelector('[data-state]').textContent=p.combatState==='alive'?'戦闘中':p.combatState==='down'?'ダウン':'戦闘不能';
   if(old!==undefined&&old!==p.hp){const hit=el.querySelector('[data-hit]');hit.textContent=(p.hp>old?'+':'−')+Math.ceil(Math.abs(p.hp-old));hit.dataset.kind=p.hp>old?'heal':'damage';hit.getAnimations().forEach(a=>a.cancel());if(!runtime.entryData.settings.reducedMotion)hit.animate([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(-20px)'}],{duration:700,fill:'forwards'});}
   previousHp.set(p.playerId,p.hp);
  }
  for(const p of own) {
   const ready=new Set(getUsableReadySkills(b,p).map(s=>s.skillId));
   for(const button of root.querySelectorAll('[data-live-skill]')) {if(button.dataset.liveActor!==p.playerId)continue;const s=p.skills.find(s=>s.skillId===button.dataset.liveSkill),ct=skillEffectiveCt(p,s)??s.baseCt,left=Math.max(0,ct-(p.skillCharge[s.skillId]??0)),available=ready.has(s.skillId);
    button.disabled=paused||b.liveControls.autoSkills||!available||Boolean(b.liveControls.requests[p.playerId]);button.classList.toggle('is-ready',available);button.querySelector('strong').textContent=p.combatState!=='alive'?'行動不能':left>0?`CT ${(left*2).toFixed(1)}`:available?'発動できる':'対象待ち';button.querySelector('i').style.width=`${Math.min(100,(p.skillCharge[s.skillId]??0)/ct*100)}%`;
   }
   const item=b.liveControls.items.find(i=>i.playerId===p.playerId),el=[...root.querySelectorAll('[data-live-item]')].find(e=>e.dataset.liveItem===p.playerId);
   el.textContent=item?`${autoItem(item.itemId).name} · ${item.used?'使用済み':'自動待機'}`:'アイテム未装備';
  }
  const event=[...b.events].reverse().find(e=>['skill_cutin','auto_item','down','confirmed_kill','heal'].includes(e.type));
  if(event&&event.eventId!==lastEvent){lastEvent=event.eventId;const actor=b.participants[event.actorPlayerId]?.name??'',target=b.participants[event.targetPlayerId]?.name??'';root.querySelector('[data-live-event]').textContent=event.type==='auto_item'?`${actor}：${event.itemName}を自動使用！`:event.type==='skill_cutin'?`${actor}：${event.skillName}！`:event.type==='heal'?`${target} HP +${event.amount}`:`${target||actor}が${event.type==='down'?'ダウン':'戦闘不能'}！`;}
 }
 function advance(input={}){try{const result=runtimeManager.update('live_battle_tick',d=>updateLiveBattleToDraft(d,input)).result;if(result.completed){checkpoint();onComplete();return;}if(snapshot().activeBattle.tickCount%5===0||input.skillId)checkpoint();draw();}catch(e){destroy();onError(e);}}
 function schedule(){clearInterval(timer);timer=setInterval(()=>{if(!paused&&!destroyed)advance();},200/speed);}
 function click(event){const b=event.target.closest('button');if(!b||!root.contains(b)||b.disabled)return;
  if(![...b.attributes].some(a=>a.name.startsWith('data-live-')))return;event.stopPropagation();
  if(b.hasAttribute('data-live-pause')){paused=!paused;draw();return;}
  if(b.hasAttribute('data-live-auto')){advance({autoSkills:!snapshot().activeBattle.liveControls.autoSkills,tick:false});checkpoint();return;}
  if(b.hasAttribute('data-live-speed')){speed=speed===1?2:1;b.textContent=`速度 ${speed}倍`;schedule();return;}
  if(b.hasAttribute('data-live-finish')){paused=false;advance({autoSkills:true,tick:false});speed=2;schedule();root.querySelector('[data-live-speed]').textContent='速度 2倍';return;}
  if(b.dataset.liveSkill){advance({playerId:b.dataset.liveActor,skillId:b.dataset.liveSkill,tick:false});}
 }
 function visibility(){if(document.hidden){paused=true;checkpoint();draw();}}
 function destroy(){destroyed=true;clearInterval(timer);root.removeEventListener('click',click);globalThis.removeEventListener('pagehide',checkpoint);document.removeEventListener('visibilitychange',visibility);}
 return {start(){try{paused=Boolean(snapshot().activeBattle);runtimeManager.update('live_battle_started',beginLiveBattleToDraft);root.innerHTML=liveBattleMarkup(snapshot());root.addEventListener('click',click);globalThis.addEventListener('pagehide',checkpoint);document.addEventListener('visibilitychange',visibility);checkpoint();draw();schedule();}catch(e){destroy();onError(e);}},destroy};
}

