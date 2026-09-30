import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameState} from '../js/main/state.js?v=73';
import {advanceGameWeek,getTournamentEventsForDate} from '../data/game-data.js?v=73';
import {createTournamentEntryData,saveTournamentEntryToStorage} from '../js/main/tournament-bridge.js?v=73';
import {createTournamentRuntime,createTournamentRuntimeManager} from '../js/tournament/runtime.js?v=73';
import {createBattleFromTournamentRuntime,runBattleToCompletion,executeCurrentBattleToDraft} from '../js/tournament/battle-core.js?v=73';
import {resolveBattleOrder,renderOrderPanel,renderBattleStory,AUTO_PHASE_ACTIONS} from '../js/tournament/match-experience.js?v=73';
import {createBattleReplayModel} from '../js/tournament/battle-ui.js?v=73';
import {renderTeamDebut} from '../js/main/team-debut.js?v=73';
import {fastForwardMatchToChampionToDraft} from '../js/tournament/round.js?v=73';
import {finalizeCurrentMatchToDraft,prepareTournamentResultToDraft,renderTournamentResultScreen} from '../js/tournament/results.js?v=73';

function fixture() {
 const state=structuredClone(createNewGameState({companyBaseName:'検証',playerNames:{IGL:'指揮',ATK:'攻撃',SUP:'支援'}}));
 let event;
 for(let i=0;i<48&&!event;i++){event=getTournamentEventsForDate(state.gameDate).find(e=>e.tournamentType==='local');if(!event)state.gameDate=structuredClone(advanceGameWeek(state.gameDate));}
 const entry=createTournamentEntryData(state,event);
 const runtime=structuredClone(createTournamentRuntime(entry));
 runtime.match=1;runtime.round=2;runtime.currentOpponentId=runtime.teams.find(t=>t.teamId!==runtime.playerTeamId).teamId;
 return {state,entry,runtime};
}

test('manual orders change the real simulation and remain deterministic',()=>{
 const {runtime}=fixture();
 runtime.matchExperience={order:'rush',focus:'SUP'};
 const rush=createBattleFromTournamentRuntime(runtime);
 runtime.matchExperience={order:'guard',focus:'ATK'};
 const guard=createBattleFromTournamentRuntime(runtime);
 const own=id=>Object.values(id.participants).filter(p=>p.teamId===runtime.playerTeamId);
 assert.equal(own(rush)[0].effects.find(e=>e.code==='team_battle_order').damageMultiplier,1.18);
 assert.equal(own(guard)[0].effects.find(e=>e.code==='team_battle_order').damageReduction,.18);
 const a=runBattleToCompletion(rush),b=runBattleToCompletion(guard);
 assert.notEqual(a.checksum,b.checksum);
 assert.equal(runBattleToCompletion(rush).checksum,a.checksum);
 assert.equal(rush.command.focus,'SUP');
 assert.ok(Object.values(rush.participants).filter(p=>p.teamId!==runtime.playerTeamId).every(p=>!p.effects.some(e=>e.code==='team_battle_order')));
});

test('new tournament opening uses four chapters and keeps the lineup',()=>{
 const {runtime}=fixture();
 assert.equal(runtime.opening.scenes.length,4);
 assert.deepEqual(runtime.opening.scenes.map(s=>s.type),['TOURNAMENT_TITLE','STAGE_INTRO','PLAYER_MEMBERS','MATCH_START']);
 assert.ok(runtime.opening.scenes.every(s=>s.canSkip));
 assert.equal(runtime.opening.scenes.at(-1).nextSceneId,null);
});

test('automatic orders react to low HP and numerical advantage',()=>{
 const runtime={playerTeamId:'own'};
 const p=(teamId,hp)=>({teamId,hp,maxHp:100,combatState:'alive'});
 assert.equal(resolveBattleOrder(runtime,[p('own',30),p('other',100)]).id,'guard');
 assert.equal(resolveBattleOrder(runtime,[p('own',100),p('own',100),p('other',100)]).id,'rush');
 assert.equal(resolveBattleOrder(runtime,[p('own',100),p('other',100)]).id,'balanced');
});

test('saved tournament retains manual decisions and auto mode',()=>{
 const {entry}=fixture(), values=new Map();
 const storage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 saveTournamentEntryToStorage(storage,entry);
 const manager=createTournamentRuntimeManager({storage});manager.boot();
 manager.update('test_order',draft=>{draft.matchExperience={order:'guard',focus:'SUP',autoAdvance:true};});
 manager.checkpoint('test');
 const restored=createTournamentRuntimeManager({storage});restored.boot();
 assert.deepEqual(restored.getSnapshot().matchExperience,{order:'guard',focus:'SUP',autoAdvance:true});
});

test('battle result preserves the executed order for the spectator display',()=>{
 const {runtime}=fixture();runtime.matchExperience={order:'guard',focus:'SUP'};
 executeCurrentBattleToDraft(runtime);
 assert.equal(runtime.lastBattleCommand.id,'guard');
 assert.match(renderBattleStory(runtime,createBattleReplayModel(runtime)),/守る/);
 assert.match(renderOrderPanel(runtime),/aria-pressed="true"/);
 assert.equal(AUTO_PHASE_ACTIONS.TOURNAMENT_RESULT,undefined,'rewards require explicit confirmation');
});

test('new-team debut escapes names and separates dialogue into paragraphs',()=>{
 const {state}=fixture();state.playerTeam.members[0].name='<script>test</script>';
 const html=renderTeamDebut(state,2);
 assert.ok(html.includes('&lt;script&gt;test&lt;/script&gt;'));
 assert.match(html,/最初の練習へ/);
 assert.match(html,/活動資金を受け取りました/);
 assert.ok((html.match(/<p>/g)??[]).length>=2);
});

test('ending can render real finalized standings and never invent a zero-stat standout',()=>{
 const {runtime}=fixture();
 fastForwardMatchToChampionToDraft(runtime);
 finalizeCurrentMatchToDraft(runtime);
 prepareTournamentResultToDraft(runtime);
 const html=renderTournamentResultScreen(runtime);
 assert.match(html,/TEAM REVIEW/);
 assert.match(html,/報酬を受け取ってホームへ/);
 if(runtime.tournamentResultData.memberResults.every(p=>p.damage+p.healing===0)) assert.doesNotMatch(html,/が攻撃と回復でチームを支えました/);
});
