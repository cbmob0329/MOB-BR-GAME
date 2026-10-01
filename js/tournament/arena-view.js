import {assetPath} from '../assets.js?v=77';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function arenaMarkup(b){
 return `<section class="arena-stage" aria-label="円形3対3アリーナ"><div class="arena-stage__labels"><strong>${esc(b.teamNames[b.leftTeamId])}</strong><span>3 ON 3</span><strong>${esc(b.teamNames[b.rightTeamId])}</strong></div><div class="arena-field"><svg class="arena-map" viewBox="0 0 100 100" aria-hidden="true"><defs><radialGradient id="arenaFloor"><stop stop-color="#244b60"/><stop offset="1" stop-color="#071c30"/></radialGradient><pattern id="arenaGrid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="#5bc8e8" stroke-opacity=".12" stroke-width=".3"/></pattern></defs><circle cx="50" cy="50" r="47" fill="url(#arenaFloor)" stroke="#65dcff" stroke-width=".6"/><circle cx="50" cy="50" r="46" fill="url(#arenaGrid)"/><circle cx="50" cy="50" r="43" class="arena-boundary"/><circle cx="50" cy="50" r="26" fill="none" stroke="#81cce3" stroke-opacity=".15" stroke-dasharray="2 2" stroke-width=".4"/><path d="M7 50H93M50 7V93" stroke="#81cce3" stroke-opacity=".15" stroke-width=".4"/><g>${(b.arena?.covers??[]).map(c=>`<circle cx="${c.x}" cy="${c.y}" r="${c.r}" fill="#304a60" stroke="#7ea4b9" stroke-width=".8"/><path d="M${c.x-c.r*.5} ${c.y}h${c.r}" stroke="#a8d8e7" stroke-width=".6"/>`).join('')}</g><g data-arena-projectiles></g></svg>${Object.values(b.participants).map(p=>`<article class="arena-actor ${p.teamId===b.leftTeamId?'is-ally':'is-enemy'}" data-live-player="${esc(p.playerId)}"><span class="arena-actor__aura"></span><div class="arena-actor__sprite"><img src="${esc(assetPath(p.image))}" alt=""><i class="arena-gun"></i></div><h3>${esc(p.name)}</h3><div class="live-hp"><i></i></div><strong data-hp></strong><small data-state></small><b data-hit aria-hidden="true"></b></article>`).join('')}</div><div class="arena-legend"><span>● 味方</span><span>● 相手</span><span>遮蔽物で被弾を軽減</span></div></section>`;
}
export function createArenaPainter(root,reducedMotion){
 let cursor=null;
 const layer=root.querySelector('[data-arena-projectiles]');
 return b=>{
  const field=root.querySelector('.arena-field');if(!field||!b.arena)return;
  root.querySelector('.arena-boundary').setAttribute('r',String(b.arena.radius));
  for(const el of root.querySelectorAll('[data-live-player]')){
   const p=b.participants[el.dataset.livePlayer],s=p.arena;if(!s)continue;
   el.style.left=s.x+'%';el.style.top=s.y+'%';el.style.setProperty('--facing',s.facing+'deg');el.style.setProperty('--flip',Math.abs(s.facing)>90?'-1':'1');
   el.classList.toggle('is-moving',s.moving&&p.combatState==='alive');
   el.classList.toggle('is-guarded',(p.effects??[]).some(e=>e.remainingSeconds>0&&e.damageReduction>0));
   el.title=`${p.name}：${s.mode} / HP ${Math.ceil(p.hp)}`;
   el.querySelector('[data-state]').textContent=p.combatState==='alive'?s.mode:p.combatState==='down'?'救援待ち':'戦闘不能';
  }
  const events=cursor===null?[]:b.events.slice(cursor);cursor=b.events.length;
  for(const e of events.slice(-35)){
   const a=b.participants[e.actorPlayerId],t=b.participants[e.targetPlayerId];
   if(!a?.arena)continue;
   const actor=[...root.querySelectorAll('[data-live-player]')].find(el=>el.dataset.livePlayer===a.playerId);
   if(e.type==='skill_cutin'&&!reducedMotion)actor?.animate([{filter:'brightness(2)',scale:'1.18'},{filter:'brightness(1)',scale:'1'}],{duration:500});
   if(!t?.arena||!['normal_attack_hit','normal_attack_miss','damage'].includes(e.type)||e.type==='damage'&&e.sourceType==='normal_attack')continue;
   const from=e.arenaFrom??a.arena,to=e.arenaTo??t.arena,line=document.createElementNS('http://www.w3.org/2000/svg','line');
   const miss=e.type==='normal_attack_miss',offset=miss?(e.burstIndex%2?4:-4):0;
   for(const [k,v]of Object.entries({x1:from.x,y1:from.y,x2:to.x+offset,y2:to.y+offset,stroke:a.teamId===b.leftTeamId?'#7affed':'#ff956e','stroke-width':e.type==='damage'?'1':'.5','stroke-linecap':'round'}))line.setAttribute(k,String(v));
   layer.append(line);const length=Math.hypot(to.x-from.x,to.y-from.y);line.style.strokeDasharray=String(length);line.style.filter='drop-shadow(0 0 1px currentColor)';
   const animation=line.animate(reducedMotion?[{opacity:.8},{opacity:0}]:[{strokeDashoffset:length,opacity:1},{strokeDashoffset:0,opacity:1,offset:.5},{strokeDashoffset:-length,opacity:0}],{duration:reducedMotion?100:350});animation.onfinish=()=>line.remove();
   if(miss&&!reducedMotion){const target=[...root.querySelectorAll('[data-live-player]')].find(el=>el.dataset.livePlayer===t.playerId);target?.querySelector('.arena-actor__sprite').animate([{translate:'0 0'},{translate:'5px -4px'},{translate:'0 0'}],{duration:230});}
  }
 };
}
