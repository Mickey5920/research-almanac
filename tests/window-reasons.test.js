import test from 'node:test';
import assert from 'node:assert/strict';
import {recommend} from '../scripts/core.js';
import {windowReasons} from '../scripts/window-reasons.js';
const input={mode:'project',timezone:'Asia/Shanghai',now:'2026-09-14T00:00:00Z',range:{mode:'next_week'},project:{title:'Synthetic reasons',stage:'initial'},readiness:{status:'ready'},deadline:{status:'none'}};
const report=recommend(input),record={input,report};
function candidate(){return structuredClone(report.recommendations[0]);}
test('favorable officer and auspicious hour explain distinct recorded factors with sources',()=>{
 const c=candidate();Object.assign(c.calendar_facts,{officer:'成',hour_luck:'吉'});
 const x=windowReasons(record,c);assert.equal(x.items.filter(i=>i.kind==='favorable').length,2);
 assert.ok(x.items.find(i=>i.title.includes('日课')).text.includes('现代排序'));
 assert.ok(x.items.every(i=>report.sources.some(s=>s.id===i.source_id)));
});
test('neutral officer and inauspicious hour do not receive invented favorable labels',()=>{
 const c=candidate();Object.assign(c.calendar_facts,{officer:'破',hour_luck:'凶'});
 const x=windowReasons(record,c);assert.equal(x.items.filter(i=>i.kind==='favorable').length,0);
 assert.ok(x.items.some(i=>i.kind==='caution'&&i.text.includes('不能把本窗口描述为吉时')));
});
test('minute explanation follows saved timestamps rather than an invented auspicious minute',()=>{
 const c=candidate();c.end_utc=new Date(Date.parse(c.start_utc)+45*60000).toISOString();c.click_at_utc=new Date(Date.parse(c.start_utc)+15*60000).toISOString();
 const item=windowReasons(record,c).items.find(i=>i.title.includes('具体分钟'));assert.match(item.text,/45 分钟/);assert.match(item.text,/15 分钟/);assert.match(item.text,/30 分钟/);assert.match(item.text,/不是卦辞/);
});
test('missing calendar and input retain missing status, and buffer shortfall remains visible',()=>{
 const c=candidate();c.calendar_facts=null;c.direction=null;c.deadline_margin_minutes=90;c.buffer_met=false;
 const x=windowReasons({report,input:null},c);assert.equal(x.items.filter(i=>i.kind==='favorable').length,0);
 assert.ok(x.items.some(i=>i.text.includes('旧记录未保存输入')));assert.ok(x.items.some(i=>i.kind==='caution'&&i.text.includes('未满足期望提前量')));
});
test('canonical Zhouyi reflection is labelled stage-level and never used for minute ranking',()=>{
 const c=candidate(),original=structuredClone(record);const x=windowReasons(record,c);
 const ref=x.items.find(i=>i.kind==='reflection');assert.ok(ref.text.includes('天行健'));assert.ok(ref.text.includes('不参与这个日期或分钟'));
 assert.deepEqual(record,original);
 const bad=structuredClone(record);bad.report.cultural_result.text='invented quotation';
 assert.ok(!windowReasons(bad,c).items.some(i=>i.kind==='reflection'));
});
test('unknown historical rules do not receive current officer ranking claims',()=>{
 const c=candidate();c.calendar_facts.officer='成';const old=structuredClone(record);old.report.versions.ruleset='unknown';
 const x=windowReasons(old,c);assert.ok(x.items.find(i=>i.title.includes('日课')).kind==='neutral');
});

