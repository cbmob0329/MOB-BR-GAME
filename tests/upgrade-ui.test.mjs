import test from 'node:test';
import assert from 'node:assert/strict';
import {createNewGameState} from '../js/main/state.js?v=72';
import {calculatePlayerStatUpgradePlan,applyPlayerStatUpgradePlanToDraft,calculateWeaponUpgradePlan,applyWeaponUpgradePlanToDraft,renderAbilityUpSection,renderEquipmentSection} from '../js/main/team.js?v=72';

function fixture(){
  const state=structuredClone(createNewGameState({companyBaseName:'UI検証',playerNames:{IGL:'指揮',ATK:'攻撃',SUP:'支援'}}));
  const id=state.playerTeam.members[0].playerId;
  state.playerTrainingPoints[id]={power:100,tech:100,mental:100,shoot:100};
  return {state,id};
}
test('ability preview leaves save untouched and matches the confirmed cost and values',()=>{
  const {state,id}=fixture();const before=structuredClone(state);
  const increments={stamina:2,aim:1};const plan=calculatePlayerStatUpgradePlan(state,id,increments);
  assert.equal(plan.affordable,true);
  const html=renderAbilityUpSection(state,id,increments);
  assert.deepEqual(state,before);
  assert.match(html,/スタミナの強化を減らす/);
  assert.doesNotMatch(html,/upgrade-radial-node/);
  applyPlayerStatUpgradePlanToDraft(state,id,increments);
  assert.deepEqual(state.playerTrainingPoints[id],plan.remainingPoints);
  for(const row of plan.rows)assert.equal(state.playerTeam.members[0].stats[row.definition.id],row.projectedValue);
});
test('unaffordable ability additions are disabled; selected additions can be removed',()=>{
  const {state,id}=fixture();state.playerTrainingPoints[id]={power:0,tech:0,mental:0,shoot:0};
  const html=renderAbilityUpSection(state,id);
  const plus=html.match(/<button[^>]*data-action="ability-plan-plus"[^>]*>/g);
  assert.equal(plus.length,7);assert.ok(plus.every(button=>button.includes('disabled')));
  const {state:rich,id:richId}=fixture();
  assert.match(renderAbilityUpSection(rich,richId,{stamina:1}),/aria-label="スタミナの強化を減らす" >−/);
});
test('weapon preview and confirmation spend exactly the displayed coin and ruby',()=>{
  const {state,id}=fixture();state.resources.coin=100000;state.resources.ruby=100;
  const initial=structuredClone(state);const stat=calculateWeaponUpgradePlan(state,id).rows[0].definition.id;
  const increments={[stat]:1};const plan=calculateWeaponUpgradePlan(state,id,increments);
  const html=renderEquipmentSection(state,id,increments);
  assert.match(html,new RegExp('data-weapon-stat-id="'+stat+'"'));
  assert.deepEqual(state,initial);
  applyWeaponUpgradePlanToDraft(state,id,increments);
  assert.equal(state.resources.coin,plan.remainingCoin);assert.equal(state.resources.ruby,plan.remainingRuby);
});
