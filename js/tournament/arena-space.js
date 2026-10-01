// Deterministic spatial state lives in the battle save, never in the renderer.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const round=n=>Math.round(n*1000)/1000;
export const ARENA_COVER=[{x:42,y:29,r:5},{x:58,y:71,r:5},{x:50,y:50,r:6}];
export function arenaTraits(p){
 const s={...p.battleStats};
 for(const e of p.effects??[])if(e.remainingSeconds>0)for(const [k,v]of Object.entries(e.stats??{}))s[k]=(s[k]??0)+v;
 for(const [k,v]of Object.entries(p.strategyStatBonus??{}))s[k]=(s[k]??0)+v;
 const n=k=>clamp(Number(s[k])||1,1,120);
 return {speed:5+n('agility')*.075,accuracy:n('aim')*.0012+n('technique')*.0005,evasion:n('agility')*.00065,defense:clamp(n('physical')*.0014+n('mind')*.00045,0,.23),power:1+n('physical')*.001,discipline:n('mind')/120,support:n('support')/120};
}
export function initializeArena(b){
 if(b.arena)return;
 b.arena={version:1,radius:43,covers:ARENA_COVER.map(x=>({...x}))};
 const counts={};
 for(const p of Object.values(b.participants)){
  const index=counts[p.teamId]??0;counts[p.teamId]=index+1;
  p.arena={x:p.teamId===b.leftTeamId?22:78,y:30+index*20,facing:p.teamId===b.leftTeamId?0:180,moving:false,mode:'展開',distanceMoved:0};
 }
}
export function arenaDistance(a,b){return Math.hypot(a.arena.x-b.arena.x,a.arena.y-b.arena.y)}
export function arenaShot(b,a,t){
 if(!b.arena||!a.arena||!t.arena)return {accuracy:0,damage:1,blocked:false};
 const dx=t.arena.x-a.arena.x,dy=t.arena.y-a.arena.y,len=Math.hypot(dx,dy)||1;
 const blocked=b.arena.covers.some(c=>{const u=clamp(((c.x-a.arena.x)*dx+(c.y-a.arena.y)*dy)/(len*len),0,1);return u>.08&&u<.92&&Math.hypot(c.x-a.arena.x-u*dx,c.y-a.arena.y-u*dy)<c.r;});
 const at=arenaTraits(a),tt=arenaTraits(t);
 return {blocked,distance:len,accuracy:at.accuracy-tt.evasion-(a.arena.moving?.04:0)-(t.arena.moving?.04:0)-(blocked?.2:0)-Math.max(0,len-36)*.002,damage:at.power*(1-tt.defense)*(blocked?.68:1)};
}
export function advanceArena(b){
 if(!b.liveControls)return;
 initializeArena(b);
 const all=Object.values(b.participants),before=new Map(all.map(p=>[p.playerId,{...p.arena}]));
 b.arena.radius=43-5*clamp(b.elapsedSeconds/b.durationSeconds,0,1);
 for(const p of all){
  const pos=p.arena;
  if(p.combatState!=='alive'){pos.moving=false;pos.mode=p.combatState==='down'?'救援待ち':'戦闘不能';continue;}
  const enemies=all.filter(t=>t.teamId!==p.teamId&&t.combatState==='alive');
  const target=enemies.sort((a,c)=>Math.hypot(before.get(a.playerId).x-pos.x,before.get(a.playerId).y-pos.y)-Math.hypot(before.get(c.playerId).x-pos.x,before.get(c.playerId).y-pos.y)||a.playerId.localeCompare(c.playerId))[0];
  if(!target)continue;
  const tp=before.get(target.playerId),tr=arenaTraits(p),dx=tp.x-pos.x,dy=tp.y-pos.y,d=Math.hypot(dx,dy)||1;
  pos.targetId=target.playerId;pos.facing=round(Math.atan2(dy,dx)*180/Math.PI);
  const retreat=p.hp/p.maxHp<.32||p.reloadRemaining>0;
  const ideal=retreat?42:p.role==='ATK'?20:p.role==='SUP'?35:28;
  const approach=clamp((d-ideal)/10,-1,1);
  const sign=((Math.floor(b.elapsedSeconds/(1.1+tr.discipline))+(p.teamId===b.leftTeamId?0:1)+all.indexOf(p))%2)?1:-1;
  const blocked=arenaShot(b,p,target).blocked;
  let vx=dx/d*approach-dy/d*sign*(blocked?1.1:.65),vy=dy/d*approach+dx/d*sign*(blocked?1.1:.65);
  for(const other of all){if(other===p||other.combatState==='dead')continue;const q=before.get(other.playerId),dist=Math.hypot(pos.x-q.x,pos.y-q.y)||.1,separation=other.teamId===p.teamId?17:12;if(dist<separation){vx+=(pos.x-q.x)/dist*(separation-dist)*.5;vy+=(pos.y-q.y)/dist*(separation-dist)*.5;}}
  const norm=Math.max(1,Math.hypot(vx,vy)),step=tr.speed*b.tickSeconds;
  let x=pos.x+vx/norm*step,y=pos.y+vy/norm*step;
  for(const c of b.arena.covers){let cd=Math.hypot(x-c.x,y-c.y);if(cd<c.r+2){const ang=Math.atan2(y-c.y,x-c.x);x=c.x+Math.cos(ang)*(c.r+2);y=c.y+Math.sin(ang)*(c.r+2);}}
  const radial=Math.hypot(x-50,y-50),limit=b.arena.radius-2;if(radial>limit){x=50+(x-50)/radial*limit;y=50+(y-50)/radial*limit;}
  const moved=Math.hypot(x-pos.x,y-pos.y);pos.moving=moved>.05;pos.distanceMoved=round(pos.distanceMoved+moved);pos.x=round(x);pos.y=round(y);
  pos.mode=retreat?'退避':blocked?'射線確保':p.role==='ATK'?'接近・射撃':p.role==='SUP'?'後方支援':'側面展開';
  p.currentDistance=d<25?'close':d<48?'mid':'far';
 }
}
