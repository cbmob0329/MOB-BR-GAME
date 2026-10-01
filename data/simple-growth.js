// Shared, deterministic prices and rewards for the diamond growth loop.
export const TRAINING_COURSES = Object.freeze([
  {id:'balanced_training', name:'デイリーワーク', tag:'コイン不要', description:'気軽に1週間。まずはここから。', diamond:30, coin:0, image:'icon/sou.png'},
  {id:'shooting_practice', name:'集中セッション', tag:'効率アップ', description:'コインを使って、獲得ダイヤを増やす。', diamond:45, coin:1000, image:'icon/sha.png'},
  {id:'combat_drill', name:'実戦キャンプ', tag:'成長を加速', description:'チームで実戦練習。最も多くダイヤを獲得。', diamond:65, coin:2500, image:'icon/zit.png'},
]);
export const diamondPrice = cost => Math.max(1, Math.ceil(Object.values(cost ?? {}).reduce((sum,n)=>sum+Number(n || 0),0)/4));
export function trainingReward(snapshot, id) {
  const course=TRAINING_COURSES.find(c=>c.id===id) ?? TRAINING_COURSES[0];
  const milestone=(Number(snapshot.records?.trainingCompleted ?? 0)+1)%4===0 ? 20 : 0;
  const badge=Math.floor(course.diamond*(snapshot.collectionBonuses?.trainingPointRate ?? 0));
  return {...course, milestone, badge, total:course.diamond+badge+milestone};
}
// Empty old pools after conversion, so loading and future rewards never duplicate it.
export function convertLegacyGrowthToDiamonds(draft) {
  let total=0;
  const pools=draft.playerTrainingPoints ? Object.values(draft.playerTrainingPoints) : [draft.trainingPoints ?? {}];
  for(const pool of pools) for(const key of ['power','tech','mental','shoot']) { total+=Math.max(0,Number(pool[key])||0); pool[key]=0; }
  for(const key of ['power','tech','mental','shoot']) if(draft.trainingPoints) draft.trainingPoints[key]=0;
  const awarded=total ? Math.ceil(total/4) : 0;
  draft.resources.diamond+=awarded;
  draft.growthCurrencyVersion=1;
  return awarded;
}
