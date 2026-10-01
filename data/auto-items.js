export const AUTO_ITEMS = Object.freeze([
  {itemId:'pb2_gummy',name:'レスキューグミ',image:'item/gumi1.png',price:{coin:600,diamond:0,ruby:0},description:'HPが40%以下になると自動使用。装備者の最大HPの35%を回復。',autoEffect:'heal',rate:0.35},
  {itemId:'spin_knit',name:'ガードニット',image:'item/nit.png',price:{coin:800,diamond:0,ruby:0},description:'交戦開始時に自動使用。この交戦中、装備者の被ダメージを15%軽減。',autoEffect:'guard',rate:0.15},
  {itemId:'scope',name:'ブーストスコープ',image:'item/sc.png',price:{coin:800,diamond:0,ruby:0},description:'交戦開始時に自動使用。この交戦中、装備者の与ダメージを15%アップ。',autoEffect:'attack',rate:0.15},
]);
export const autoItem = id => AUTO_ITEMS.find(item=>item.itemId===id) ?? null;
