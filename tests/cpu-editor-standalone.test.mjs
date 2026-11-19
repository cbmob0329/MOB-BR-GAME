import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('standalone editor boots without module loading or a web server',()=>{
 const elements=new Map();
 const get=s=>{if(!elements.has(s))elements.set(s,{value:'',innerHTML:'',textContent:'',disabled:false,classList:{toggle(){}},addEventListener(){}});return elements.get(s);};
 const context={document:{querySelector:get,addEventListener(){}},location:{protocol:'file:'},window:{addEventListener(){}},console,structuredClone,localStorage:{getItem(){return null;}}};
 vm.runInNewContext(fs.readFileSync(new URL('../js/cpu-editor.bundle.js',import.meta.url),'utf8'),context);
 assert.match(get('#teamCount').textContent,/126/);
 assert.equal((get('#teamList').innerHTML.match(/data-team=/g)||[]).length,126);
 assert.equal((get('#editor').innerHTML.match(/class="portrait"/g)||[]).length,3);
 assert.match(get('#editor').innerHTML,/Local\/L1B.png/);
 assert.match(get('#editor').innerHTML,/モブモッチ/);
 const html=fs.readFileSync(new URL('../cpu-editor.html',import.meta.url),'utf8');
 assert.match(html,/<script defer src="js\/cpu-editor.bundle.js/);
 assert.doesNotMatch(html,/type="module"/);
});
