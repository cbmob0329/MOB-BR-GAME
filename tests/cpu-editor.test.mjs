import test from 'node:test';
import assert from 'node:assert/strict';
import {ALL_GENERATION_47_CPU_TEAMS as masters} from '../data/cpu-roster-47-data.js?v=78';
import {CPU_STAT_IDS,validateCpuEdits,applyCpuEdits,CPU_EDITOR_KEY} from '../data/cpu-editor-settings.js?v=1';
const master=masters[0],player=master.members[0];
const settings={version:1,teams:{[master.teamId]:{name:'編集チーム',members:{[player.id]:{name:'編集選手',stats:Object.fromEntries(CPU_STAT_IDS.map(k=>[k,35]))}}}}};
test('CPU edits change names and stats without changing identity, portraits or original master',()=>{const before=structuredClone(master),valid=validateCpuEdits(settings,masters),edited=applyCpuEdits(master,valid);assert.equal(edited.name,'編集チーム');assert.equal(edited.members[0].name,'編集選手');assert.equal(edited.members[0].editorStats.aim,35);assert.equal(edited.members[0].image,player.image);assert.equal(edited.members[0].id,player.id);assert.deepEqual(master,before);assert.equal(edited.members[1],master.members[1]);});
test('CPU settings reject out-of-range values, invalid names, and unknown members',()=>{for(const value of [0,74,1.5,'35',null]){const bad=structuredClone(settings);bad.teams[master.teamId].members[player.id].stats.aim=value;assert.throws(()=>validateCpuEdits(bad,masters));}const bad=structuredClone(settings);bad.teams[master.teamId].name=' ';assert.throws(()=>validateCpuEdits(bad,masters));bad.teams[master.teamId].name='a';bad.teams[master.teamId].members.unknown={name:'x'};assert.throws(()=>validateCpuEdits(bad,masters));});
test('name-only edits preserve standard variable strength and JSON roundtrips',()=>{const copy=structuredClone(settings);delete copy.teams[master.teamId].members[player.id].stats;const valid=validateCpuEdits(JSON.parse(JSON.stringify(copy)),masters);assert.equal(applyCpuEdits(master,valid).members[0].editorStats,undefined);assert.deepEqual(applyCpuEdits(master,{version:1,teams:{}}),master);});
test('a fresh tournament uses custom CPU names, exact ability values, and derived HP',async()=>{
 globalThis.localStorage={getItem:key=>key===CPU_EDITOR_KEY?JSON.stringify(settings):null};
 try{
  const {createNewGameState}=await import('../js/main/state.js?v=78');const {createTournamentEntryData}=await import('../js/main/tournament-bridge.js?v=78');const {createTournamentRuntime}=await import('../js/tournament/runtime.js?v=78');const {advanceGameWeek,getTournamentEventsForDate}=await import('../data/game-data.js?v=78');const {calculateMaxHp}=await import('../data/battle-config.js?v=78');
  const s=structuredClone(createNewGameState({companyBaseName:'確認',playerNames:{IGL:'指揮',ATK:'攻撃',SUP:'支援'}}));let event;for(let i=0;i<48&&!event;i++){event=getTournamentEventsForDate(s.gameDate).find(e=>e.tournamentType==='local');if(!event)s.gameDate=structuredClone(advanceGameWeek(s.gameDate));}
  const entry=createTournamentEntryData(s,event),runtime=createTournamentRuntime(entry),team=runtime.teams.find(t=>t.teamId===master.teamId);assert.ok(team);assert.equal(team.teamName,'編集チーム');const p=team.members.find(p=>p.playerId===player.id);assert.equal(p.name,'編集選手');assert.equal(p.battleStats.aim,35);assert.equal(p.maxHp,calculateMaxHp(35));assert.equal(runtime.teams.find(t=>t.isPlayer).teamName,s.playerTeam.teamName);
 }finally{delete globalThis.localStorage;}
});
