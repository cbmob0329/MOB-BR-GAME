export const CPU_EDITOR_KEY='mobbr.cpu-editor.v1';
export const CPU_STAT_IDS=['stamina','mind','physical','aim','agility','technique','support'];
export function validateCpuEdits(input,masters){
 if(!input||input.version!==1||!input.teams||typeof input.teams!=='object'||Array.isArray(input.teams))throw new Error('CPU編集用の設定ファイルではありません。');
 const teams={};const name=v=>{if(typeof v!=='string'||!v.trim()||v.trim().length>40)throw new Error('名前は1〜40文字で入力してください。');return v.trim();};
 for(const [id,edit] of Object.entries(input.teams)){
  const master=masters.find(t=>t.teamId===id);if(!master)throw new Error(`存在しないチームです：${id}`);
  if(!edit||!edit.members||typeof edit.members!=='object'||Array.isArray(edit.members))throw new Error('キャラクター設定が不正です。');
  const members={};
  for(const [pid,p] of Object.entries(edit.members)){
   if(!master.members.some(m=>m.id===pid))throw new Error(`存在しない選手です：${pid}`);
   const member={name:name(p?.name)};
   if(p.stats!==undefined){const stats={};for(const key of CPU_STAT_IDS){const value=p.stats?.[key];if(!Number.isInteger(value)||value<1||value>73)throw new Error('能力値は1〜73の整数で入力してください。');stats[key]=value;}member.stats=stats;}
   members[pid]=member;
  }
  teams[id]={name:name(edit.name),members};
 }
 return {version:1,teams};
}
export function readCpuEdits(storage){const raw=storage?.getItem(CPU_EDITOR_KEY);return raw?JSON.parse(raw):{version:1,teams:{}};}
export function applyCpuEdits(master,settings){
 const edit=settings?.teams?.[master.teamId];if(!edit)return master;
 return {...master,name:edit.name,companyName:edit.name,members:master.members.map(p=>{const e=edit.members[p.id];return e?{...p,name:e.name,...(e.stats?{editorStats:{...e.stats}}:{})}:p;})};
}
export function loadEditedCpuMasters(masters){
 try{const settings=validateCpuEdits(readCpuEdits(globalThis.localStorage),masters);return masters.map(t=>applyCpuEdits(t,settings));}catch{return masters;}
}
