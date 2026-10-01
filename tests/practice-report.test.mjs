import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGameState, serializeSaveState, deserializeSaveState } from '../js/main/state.js?v=76';
import { executeTrainingToDraft } from '../js/main/management.js?v=76';
import { advanceGameWeek } from '../data/game-data.js?v=76';
import { practiceReportModel, renderPracticeReport } from '../js/main/practice-report.js?v=76';

function trained() {
  const state = structuredClone(createNewGameState({companyBaseName:'検証',playerNames:{IGL:'指揮',ATK:'攻撃',SUP:'支援'}}));
  for (const [index, player] of state.playerTeam.members.entries()) {
    state.playerTrainingPoints[player.playerId] = {power:10+index,tech:20+index,mental:30+index,shoot:40+index};
  }
  executeTrainingToDraft(state, state.playerTeam.members.map(player => ({playerId:player.playerId,programId:'shooting_practice'})));
  return state;
}

test('diamond report preserves the awarded amount after diamonds are spent',()=>{
 const state=trained(),record=structuredClone(state.records.lastTraining);
 assert.equal(record.diamond,45);assert.equal(record.diamondAfter-record.diamondBefore,45);
 const html=renderPracticeReport(state);assert.match(html,/獲得ダイヤ/);assert.match(html,/\+45/);
 state.resources.diamond=0;assert.equal(renderPracticeReport(state),html);
 assert.deepEqual(state.records.lastTraining,record);
});

test('saved pending report can be replayed without advancing a week or awarding again', () => {
  const state = deserializeSaveState(serializeSaveState(trained())).state;
  const before = structuredClone(state);
  assert.ok(state.ui.pendingWeekStart);
  assert.ok(practiceReportModel(state));
  const first = renderPracticeReport(state);
  assert.equal(renderPracticeReport(state),first);
  assert.deepEqual(state,before);
  assert.equal(state.records.trainingCompleted,1);
});

test('legacy records remain readable; absent and stale results are not presented', () => {
  const state = trained();
  const expected = practiceReportModel(state);
  for (const member of state.records.lastTraining.members) {
    delete member.pointsBefore;
    delete member.pointsAfter;
  }
  assert.deepEqual(practiceReportModel(state),expected);
  state.gameDate = structuredClone(advanceGameWeek(state.gameDate));
  assert.equal(practiceReportModel(state),null);
  assert.equal(renderPracticeReport(state),'');
  delete state.records.lastTraining;
  assert.equal(practiceReportModel(state),null);
});

test('player-entered names are displayed as text, never markup', () => {
  const state = trained();
  state.playerTeam.members[0].name = '<img src=x onerror="alert(1)">';
  const html = renderPracticeReport(state);
  assert.ok(html.includes('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'));
  assert.ok(!html.includes('<img src=x'));
});
