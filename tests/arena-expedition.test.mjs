import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameState} from '../js/main/state.js?v=77';
import {advanceGameWeek,getTournamentEventsForDate} from '../data/game-data.js?v=77';
import {createTournamentEntryData} from '../js/main/tournament-bridge.js?v=77';
import {createTournamentRuntime,createTournamentResumeData,calculateTournamentRuntimeChecksum,validateTournamentResumeDataForEntry} from '../js/tournament/runtime.js?v=77';
import {beginLiveBattleToDraft,updateLiveBattleToDraft} from '../js/tournament/battle-core.js?v=77';
import {advanceArena,initializeArena,arenaShot,arenaTraits} from '../js/tournament/arena-space.js?v=77';
import {beginExplorationToDraft,completeExplorationToDraft} from '../js/tournament/exploration.js?v=77';
import {selectExpeditionRouteToDraft,recommendedRoute,renderExpedition} from '../js/tournament/expedition.js?v=77';
function fixture(){const s=structuredClone(createNewGameState({companyBaseName:'アリーナ',playerNames:{IGL:'指揮',ATK:'攻撃',SUP:'支援'}}));let e;for(let i=0;i<48&&!e;i++){e=getTournamentEventsForDate(s.gameDate).find(x=>x.tournamentType==='local');if(!e)s.gameDate=structuredClone(advanceGameWeek(s.gameDate));}const entry=createTournamentEntryData(s,e),r=structuredClone(createTournamentRuntime(entry));r.match=1;r.round=2;r.currentOpponentId=r.teams.find(t=>t.teamId!==r.playerTeamId).teamId;r.phase='BATTLE';return {r,entry};}
test('arena motion is deterministic, respects the circle, and agility changes distance travelled',()=>{
 const {r}=fixture();beginLiveBattleToDraft(r);const low=structuredClone(r.activeBattle),high=structuredClone(low),id=Object.keys(low.participants)[0];low.participants[id].battleStats.agility=1;high.participants[id].battleStats.agility=100;
 for(let i=0;i<12;i++){advanceArena(low);advanceArena(high);low.elapsedSeconds+=.1;high.elapsedSeconds+=.1;}
 assert.ok(high.participants[id].arena.distanceMoved>low.participants[id].arena.distanceMoved);
 for(const p of Object.values(high.participants))assert.ok(Math.hypot(p.arena.x-50,p.arena.y-50)<=high.arena.radius);
 const a=structuredClone(low),b=structuredClone(low);advanceArena(a);advanceArena(b);assert.deepEqual(a,b);
});
test('cover, aim, evasion and physical defense alter real shot modifiers',()=>{
 const {r}=fixture();beginLiveBattleToDraft(r);const b=r.activeBattle,[a,t]=Object.values(b.participants);a.arena={x:20,y:50,moving:false};t.arena={x:80,y:50,moving:false};const covered=arenaShot(b,a,t);b.arena.covers=[];const clear=arenaShot(b,a,t);assert.ok(covered.accuracy<clear.accuracy);assert.ok(covered.damage<clear.damage);
 a.battleStats.aim=100;assert.ok(arenaShot(b,a,t).accuracy>clear.accuracy);const base=arenaShot(b,a,t);t.battleStats.agility=100;t.battleStats.physical=100;assert.ok(arenaShot(b,a,t).accuracy<base.accuracy);assert.ok(arenaShot(b,a,t).damage<base.damage);assert.ok(arenaTraits(t).defense>0);
});
test('saved spatial battle continues with identical positions and random outcomes',()=>{
 const {r,entry}=fixture();beginLiveBattleToDraft(r);for(let i=0;i<8;i++)updateLiveBattleToDraft(r);r.runtimeChecksum=calculateTournamentRuntimeChecksum(r);const resume=createTournamentResumeData(r);validateTournamentResumeDataForEntry(resume,entry);
 const clone=structuredClone(r);for(let i=0;i<8;i++){updateLiveBattleToDraft(r);updateLiveBattleToDraft(clone);}assert.deepEqual(r,clone);
});
test('expedition restores defeated teammates, pays once, and applies a bonus for one battle',()=>{
 const {r}=fixture();r.phase='ROUND_EXPLORATION';beginExplorationToDraft(r,{exploreIndex:1,source:'round'});const team=r.teams.find(t=>t.teamId===r.playerTeamId);for(const p of team.members){r.memberRuntime[p.playerId].hp=0;r.memberRuntime[p.playerId].combatState='dead';}
 assert.equal(recommendedRoute(r),'recovery');selectExpeditionRouteToDraft(r,'recovery');const after=structuredClone(r);selectExpeditionRouteToDraft(r,'supply');assert.deepEqual(r,after);assert.ok(team.members.every(p=>r.memberRuntime[p.playerId].hp>0));assert.doesNotMatch(renderExpedition(r),/スロット|RESPAWN/);
 completeExplorationToDraft(r);r.phase='BATTLE';beginLiveBattleToDraft(r);assert.equal(r.expeditionBonus.used,true);assert.ok(Object.values(r.activeBattle.participants).filter(p=>p.teamId===r.playerTeamId).every(p=>p.effects.some(e=>e.code==='expedition_recovery')));
 r.activeBattle=null;beginLiveBattleToDraft(r);assert.ok(Object.values(r.activeBattle.participants).filter(p=>p.teamId===r.playerTeamId).every(p=>!p.effects.some(e=>e.code==='expedition_recovery')));
});
