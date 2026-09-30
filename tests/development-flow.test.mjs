import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGameState, serializeSaveState, deserializeSaveState, validateSaveState } from '../js/main/state.js?v=70';
import { executeTrainingToDraft, performStrategyMeetingToDraft, purchaseConsumableToDraft, getTournamentWeekStatus, renderTrainingManagement } from '../js/main/management.js?v=70';
import { advanceGameWeek, getTournamentEventsForDate } from '../data/game-data.js?v=70';
import { createTournamentEntryData } from '../js/main/tournament-bridge.js?v=70';
import { createTournamentRuntime } from '../js/tournament/runtime.js?v=70';
import { beginExplorationToDraft, renderExplorationScreen, completeExplorationToDraft, useInventoryItemToDraft, selectSearchCandidateToDraft, useRespawnTurntableToDraft } from '../js/tournament/exploration.js?v=70';
import { trainingGainText, nextTournamentText, weeklyGrowthSummary, lastWeekTraining } from '../js/main/training-view.js?v=70';
import { WEEKLY_EVENTS } from '../data/weekly-event-data.js?v=70';
import { createBattleFromTournamentRuntime, runBattleToCompletion, applyBattleResultToTournamentRuntime } from '../js/tournament/battle-core.js?v=70';
import { createBattleReplayModel, applyBattleReplayEvent, renderBattleReplayScreen, battlePresentationHold } from '../js/tournament/battle-ui.js?v=70';
import { writeFileSync } from 'node:fs';

function fresh() {
  return structuredClone(createNewGameState({companyBaseName:'検証', playerNames:{IGL:'指揮',ATK:'攻撃',SUP:'支援'}}));
}

test('new and legacy saves round trip without losing retired inventory', () => {
  const state=fresh();
  assert.equal(state.coaches.length,0);
  validateSaveState(state);
  state.coaches=[{coachId:'coach_initial',name:null,image:'Play/P1sup.png',rank:'F1',source:'initial'}];
  state.inventory.items.scope=2;
  state.inventory.carryBag.slots[0]='scope';
  const restored=deserializeSaveState(serializeSaveState(state)).state;
  assert.equal(restored.inventory.items.scope,2);
  assert.equal(restored.coaches.length,1);
  assert.throws(()=>purchaseConsumableToDraft(restored,'scope'),/休止/);
});

test('one training week awards per-player points once, persists results and opens next week',()=>{
  const state=fresh();
  const date=state.gameDate;
  const result=executeTrainingToDraft(state,state.playerTeam.members.map(p=>({playerId:p.playerId,programId:'shooting_practice'})));
  assert.deepEqual(state.gameDate,advanceGameWeek(date));
  for(const p of state.playerTeam.members) assert.equal(state.playerTrainingPoints[p.playerId].shoot,14);
  assert.equal(state.records.trainingCompleted,1);
  assert.equal(state.records.lastTraining.members.length,3);
  assert.ok(state.ui.pendingWeekStart);
  assert.equal(result.total.shoot,42);
  assert.match(weeklyGrowthSummary(state),/射撃 \+14/);
  assert.deepEqual(deserializeSaveState(serializeSaveState(state)).state.records.lastTraining,state.records.lastTraining);
  state.gameDate=structuredClone(advanceGameWeek(state.gameDate));
  assert.equal(lastWeekTraining(state),null);
});

test('research depends on training, never coach ranks',()=>{
  const a=fresh(),b=fresh();
  b.coaches=[{coachId:'old',rank:'F1'}];
  a.records.trainingCompleted=20; b.records.trainingCompleted=20;
  const ra=performStrategyMeetingToDraft(a,{random:()=>0.5});
  const rb=performStrategyMeetingToDraft(b,{random:()=>0.5});
  assert.deepEqual(ra.probabilities,rb.probabilities);
  assert.equal(ra.totalCoachPoints,210);
  assert.equal(ra.strategyId,rb.strategyId);
  assert.deepEqual(rb.coachResults,[]);
  assert.equal(b.coaches[0].rank,'F1');
});

test('training preview uses actual badge-adjusted gains and full labels',()=>{
  assert.match(trainingGainText('shooting_practice',0.5),/射撃 \+21/);
  const state=fresh();
  state.collectionBonuses.trainingPointRate=0.5;
  const html=renderTrainingManagement(state);
  assert.match(html,/射撃 \+21/);
  assert.match(html,/能力アップ/);
  assert.match(nextTournamentText(state),/あと\d+週|今週開催/);
});

function tournament() {
  const state=fresh();
  state.inventory.items.scope=2;
  state.inventory.carryBag.slots[0]='scope';
  let event;
  for(let i=0;i<48&&!event;i++) {
    event=getTournamentEventsForDate(state.gameDate).find(e=>e.tournamentType==='local');
    if(!event) state.gameDate=structuredClone(advanceGameWeek(state.gameDate));
  }
  assert.ok(event,'local event exists');
  const entry=createTournamentEntryData(state,event);
  return {state,entry,runtime:structuredClone(createTournamentRuntime(entry))};
}

test('tournament ignores legacy carry bag and facility exploration can finish without searching',()=>{
  const {entry,runtime}=tournament();
  assert.ok(entry.carryItems.every(i=>i===null));
  beginExplorationToDraft(runtime,{exploreIndex:1});
  const html=renderExplorationScreen(runtime);
  assert.doesNotMatch(html,/data-action="exploration-item-open"/);
  assert.match(html,/エリア施設/);
  assert.doesNotMatch(html,/data-action="exploration-complete"\s+disabled/);
  completeExplorationToDraft(runtime);
  assert.equal(runtime.explorationRuntime.completedKeys.length,1);
});

test('legacy pending bag dialogs cannot block resumed exploration; retired mutation APIs reject',()=>{
  const {runtime}=tournament();
  beginExplorationToDraft(runtime,{exploreIndex:1});
  runtime.explorationRuntime.pendingExploreItem={itemId:'scope'};
  runtime.explorationRuntime.pendingItemUse={slotIndex:0};
  assert.throws(()=>useInventoryItemToDraft(runtime,{slotIndex:0}),/休止/);
  assert.throws(()=>selectSearchCandidateToDraft(runtime,'old-candidate'),/休止/);
  completeExplorationToDraft(runtime);
  assert.equal(runtime.explorationRuntime.pendingExploreItem,null);
});

test('Pink event dialogue uses character voice, White retains original dialogue, consumable rewards retired',()=>{
  function walk(value,visit) { if(Array.isArray(value)) value.forEach(v=>walk(v,visit)); else if(value&&typeof value==='object') {visit(value); Object.values(value).forEach(v=>walk(v,visit));} }
  for(const event of WEEKLY_EVENTS) walk(event,part=>{
    if(event.speaker==='pink'&&part.type==='speech') assert.match(part.text,/でありま/);
    assert.notEqual(part.type,'item');
  });
  assert.ok(WEEKLY_EVENTS.filter(e=>e.speaker==='white').some(e=>e.lines.some(l=>l.type==='speech'&&!l.text.includes('であります'))));
});

test('battle presentation preserves simulated outcome, exposes damage and removes item prompts',()=>{
  const {runtime}=tournament();
  runtime.match=1;
  runtime.round=1;
  runtime.currentOpponentId=runtime.teams.find(t=>t.teamId!==runtime.playerTeamId).teamId;
  const battle=runBattleToCompletion(createBattleFromTournamentRuntime(runtime));
  applyBattleResultToTournamentRuntime(runtime,battle);
  const before=JSON.stringify(runtime);
  let model=createBattleReplayModel(runtime);
  let hitHtml;
  for(const event of model.events) {
    model=applyBattleReplayEvent(model,event);
    if(event.type==='damage'&&!hitHtml) hitHtml=renderBattleReplayScreen(runtime,model);
  }
  assert.equal(model.winnerTeamId,runtime.lastBattleResult.winnerTeamId);
  assert.equal(JSON.stringify(runtime),before);
  assert.match(hitHtml,/命中/);
  assert.doesNotMatch(hitHtml,/TAP ITEM/);
  assert.ok(battlePresentationHold({type:'down'})>battlePresentationHold({type:'damage'}));
  if(process.env.MOB_PREVIEW_PATH) writeFileSync(process.env.MOB_PREVIEW_PATH,'<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><base href="/"><link rel="stylesheet" href="css/tournament.css"><link rel="stylesheet" href="css/battle-focus.css"></head><body>'+hitHtml+'</body></html>');
});

test('all-dead team still has mandatory facility respawn without consumables',()=>{
  const {runtime}=tournament();
  runtime.match=2;
  const members=Object.values(runtime.memberRuntime).filter(m=>m.teamId===runtime.playerTeamId);
  for(const member of members) { member.hp=0; member.combatState='dead'; }
  beginExplorationToDraft(runtime,{exploreIndex:1,source:'initial'});
  assert.throws(()=>completeExplorationToDraft(runtime),/復活/);
  useRespawnTurntableToDraft(runtime,members[0].playerId);
  assert.ok(members[0].hp>0);
  completeExplorationToDraft(runtime);
  assert.equal(runtime.explorationRuntime.completedKeys.length,1);
});
