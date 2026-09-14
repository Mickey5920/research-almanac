import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {renderHistoryHtml} from '../scripts/report-html.js';
const source=readFileSync(new URL('../web/i18n.js',import.meta.url),'utf8');
test('offline English covers directions, exact bearings and timing without changing numbers',()=>{
 const context={};vm.runInNewContext(source,context);const t=context.ReportI18n.translate;
 assert.equal(t('首选窗口'),'Preferred window');assert.equal(t('备选窗口'),'Alternative window');
 assert.equal(t('正南'),'South');
 assert.equal(t('提交朝向：正南，180度'),'Submission facing: South, 180 degrees');
 assert.equal(t('转动身体，使面向读数接近 180°（正南）。'),'Turn to face 180° (South).');
 assert.equal(t('窗口共 30 分钟，前 10 分钟核对材料，再点击提交，余下 20 分钟检查回执。'),'A 30-minute window: check materials for 10 minutes, submit, then use the remaining 20 minutes to verify the receipt.');
 assert.equal(t('09:10 — 09:30'),'09:10 — 09:30');
});
test('language round trip preserves raw text and handles newly rendered nodes',()=>{
 const nodes=[],buttons=[],attributes=[];let callback;const preferences={};
 const parent=(protectedText=false,dial=false)=>({closest:()=>protectedText,matches:()=>dial,getAttribute:()=>null});
 const add=(text,raw=false)=>{const n={nodeValue:text,parentElement:parent(raw)};nodes.push(n);return n;};
 const heading=add('备选窗口'),raw=add('首选窗口',true),json=add('{"name":"正南"}',true);
 for(const language of ['zh-CN','en'])buttons.push({dataset:{language},attrs:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(_,fn){this.click=fn;}});
 const document={body:{},documentElement:{lang:'zh-CN'},createTreeWalker(){let i=0;return {nextNode:()=>nodes[i++]};},querySelectorAll(selector){return selector==='[data-language]'?buttons:attributes;}};
 const context={document,NodeFilter:{SHOW_TEXT:4},localStorage:{getItem:k=>preferences[k],setItem:(k,v)=>preferences[k]=v},MutationObserver:class{constructor(fn){callback=fn;}disconnect(){}observe(){}}};
 vm.runInNewContext(source,context);
 buttons[1].click();assert.equal(heading.nodeValue,'Alternative window');assert.equal(raw.nodeValue,'首选窗口');assert.equal(json.nodeValue,'{"name":"正南"}');
 assert.equal(document.documentElement.lang,'en');assert.equal(buttons[1].attrs['aria-pressed'],'true');
 const newDirection=add('正南');callback();assert.equal(newDirection.nodeValue,'South');
 buttons[0].click();assert.equal(heading.nodeValue,'备选窗口');assert.equal(newDirection.nodeValue,'正南');
 buttons[1].click();assert.equal(heading.nodeValue,'Alternative window');assert.equal(preferences['zhouyi-report-language'],'en');
});
test('export embeds the toggle and translator without external resources or changing raw JSON',async()=>{
 const html=await renderHistoryHtml({records:[],warnings:[]});
 assert.match(html,/data-language="en"/);assert.match(html,/globalThis.ReportI18n/);
 assert.match(html,/connect-src 'none'/);assert.doesNotMatch(html,/<script[^>]+src=/);
 assert.deepEqual(JSON.parse(html.match(/<script id="local-records" type="application\/json">([\s\S]*?)<\/script>/)[1]).records,[]);
});
