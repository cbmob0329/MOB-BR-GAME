import {AUTO_ITEMS} from '../../data/auto-items.js?v=77';
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function renderAutoEquipment(snapshot){
 return `<section class="auto-equipment"><header><span>おまかせサポート</span><h2>1人に1個。あとは自動。</h2><p>装備したアイテムは大会に1個持ち込みます。<br>条件を満たした時に1回だけ消費。次の交戦へ自動補充はされません。</p></header><div class="auto-equipment__members">${snapshot.playerTeam.members.map((p,i)=>`<article><img src="${esc(p.image)}" alt=""><h3>${esc(p.name)}</h3><label>${esc(p.role)}の装備<select data-auto-slot="${i}" aria-label="${esc(p.name)}の装備"><option value="">装備しない</option>${AUTO_ITEMS.map(item=>`<option value="${item.itemId}" ${snapshot.inventory.carryBag.slots[i]===item.itemId?'selected':''} ${!(snapshot.inventory.items[item.itemId]>0)?'disabled':''}>${item.name} / 所持 ${snapshot.inventory.items[item.itemId]??0}</option>`).join('')}</select></label></article>`).join('')}</div><div class="auto-equipment__actions"><button class="primary-button" data-action="save-auto-equipment">この装備を保存</button><button class="secondary-button" data-action="navigate" data-route="shop">ショップで補充</button></div><div class="auto-item-guide">${AUTO_ITEMS.map(item=>`<article><img src="${item.image}" alt=""><div><h3>${item.name}</h3><p>${item.description}</p><strong>所持 ${snapshot.inventory.items[item.itemId]??0}個</strong></div></article>`).join('')}</div></section>`;
}
export function saveAutoEquipment(draft,ids){
 if(draft.tournament.activeEntryId||draft.tournament.resumeData)throw new RangeError('大会中は装備を変更できません。');
 if(ids.length!==3)throw new RangeError('3人分の装備を選んでください。');
 const counts={}; for(const id of ids){if(!id)continue;if(!AUTO_ITEMS.some(x=>x.itemId===id))throw new RangeError('使用できないアイテムです。');counts[id]=(counts[id]??0)+1;}
 for(const [id,n] of Object.entries(counts))if(n>(draft.inventory.items[id]??0))throw new RangeError('同じアイテムを装備する人数分の所持数が必要です。');
 draft.inventory.carryBag.slots=draft.inventory.carryBag.slots.map((_,i)=>ids[i]||null);
 return {equipped:ids.filter(Boolean).length};
}
