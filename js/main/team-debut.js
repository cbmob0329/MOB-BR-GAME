const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');

export function renderTeamDebut(snapshot,step=0) {
  const scenes=[
    {label:'TEAM FOUNDED',title:'ここから、3人の物語。',lines:['今日から、このチームで頂点を目指すであります！','まずは3人の名前を、覚えてほしいであります。']},
    {label:'GROW TOGETHER',title:'練習で、勝てるチームへ。',lines:['練習すると、チーム共通のダイヤが手に入るよ。','好きな選手の、好きな能力を伸ばしてね！']},
    {label:'READY FOR THE LEAGUE',title:'準備ができたら、大会へ。',lines:['通常攻撃は自動。光ったスキルをタップして、勝負を動かそう！','最初の目標はデンデンカップ。まずは、1週間の練習から始めるであります！']},
  ];
  const scene=scenes[Math.max(0,Math.min(2,step))];
  const bonus=snapshot.weeklyBonus?.history?.[0]?.granted ?? {};
  return `<div class="team-debut"><header><span>${scene.label}</span><h1 id="teamDebutTitle" tabindex="-1">${scene.title}</h1><strong>${esc(snapshot.playerTeam.teamName)}</strong></header><section class="team-debut__members" aria-label="チームの3人">${snapshot.playerTeam.members.map(p=>`<article><img src="${esc(p.image)}" alt=""><span>${esc(p.role)}</span><strong>${esc(p.name)}</strong></article>`).join('')}</section><section class="team-debut__speech"><img src="icon/pink.png" alt="モブピンク"><div><strong>モブピンク</strong>${scene.lines.map(line=>`<p>${line}</p>`).join('')}</div></section>${step===2?`<aside class="team-debut__bonus"><strong>活動資金を受け取りました</strong><span>コイン ${Number(bonus.coin??0).toLocaleString('ja-JP')} / ダイヤ ${bonus.diamond??0} / ルビー ${bonus.ruby??0}</span></aside>`:''}<footer><span>${step+1} / 3</span><div>${step>0?'<button type="button" data-debut="back">戻る</button>':''}<button type="button" data-debut="skip">ホームへ</button><button type="button" data-debut="next">${step===2?'最初の練習へ':'次へ'}</button></div></footer></div>`;
}

export function presentTeamDebut(snapshot) {
  const dialog=document.createElement('dialog');
  dialog.className='team-debut-dialog';
  dialog.setAttribute('aria-labelledby','teamDebutTitle');
  let step=0;
  const render=()=>{dialog.innerHTML=renderTeamDebut(snapshot,step);dialog.querySelector('h1').focus({preventScroll:true});dialog.scrollTop=0;};
  document.body.append(dialog);
  render();dialog.showModal();
  return new Promise(resolve=>{
    const finish=destination=>{dialog.close();dialog.remove();resolve(destination);};
    dialog.addEventListener('click',event=>{
      const action=event.target.closest('[data-debut]')?.dataset.debut;
      if(action==='skip') finish('home');
      if(action==='back'){step=Math.max(0,step-1);render();}
      if(action==='next'){if(step===2) finish('train');else{step++;render();}}
    });
    dialog.addEventListener('cancel',event=>{event.preventDefault();finish('home');});
  });
}
