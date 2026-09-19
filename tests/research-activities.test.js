import test from 'node:test';
import assert from 'node:assert/strict';
import {weekly,validateWeeklyReport} from '../scripts/weekly.js';
import {activityCatalog,activityLibrary,attachActivities,buildWeekFocus,validateActivities,validateWeekFocus} from '../scripts/research-activities.js';
import {renderWeeklyMarkdown,renderWeeklyHistoryHtml} from '../scripts/weekly-html.js';

const base={timezone:'Asia/Shanghai',now:'2026-09-19T08:00:00+08:00'};
const run=profile=>weekly({...base,research_profile:profile});
const ids=operations=>operations.map(a=>a.id);

test('six disciplines have nine complete and distinct bilingual activity guides',()=>{
 assert.equal(Object.keys(activityCatalog.groups).length,6);
 const expected=['read','visualize','synthesize','think','reproduce','experiment','code','write','discuss'];
 for(const [group,items] of Object.entries(activityCatalog.groups)){
  assert.deepEqual(ids(items),expected,group);validateActivities(activityLibrary(group),{library:true});
  for(const item of items)for(const lang of ['zh','en']){
   assert.ok(item.title[lang].trim()&&item.output[lang].trim()&&item.check[lang].trim());
   assert.equal(item.steps.length,3);assert.ok(item.steps.every(s=>s[lang].trim()));
  }
 }
 for(const id of expected)assert.equal(new Set(Object.values(activityCatalog.groups).map(items=>items.find(a=>a.id===id).output.zh)).size,6,id);
});

test('daily activities reflect stage and methods, with outputs and review checks',()=>{
 const computing=run({specialties:['ai'],methods:['computation'],stage:'analysis'}).personalization;
 assert.deepEqual(ids(computing.week[0].tracks[0].operations),['read','think']);
 assert.deepEqual(ids(computing.week[1].tracks[0].operations),['code','visualize']);
 assert.deepEqual(ids(computing.week[2].tracks[0].operations),['reproduce','think']);
 assert.deepEqual(ids(computing.week[3].tracks[0].operations),['visualize','synthesize']);
 const lab=run({specialties:['basic_medicine'],methods:['wet_lab'],stage:'collection'}).personalization;
 assert.deepEqual(ids(lab.week[1].tracks[0].operations),['experiment','synthesize']);
 const writing=run({specialties:['arts'],methods:['practice'],stage:'writing'}).personalization;
 assert.deepEqual(ids(writing.week[1].tracks[0].operations),['visualize','write']);
});

test('non-execution stages review existing experiments and code in optional activity menus',()=>{
 const original=structuredClone(activityCatalog);
 for(const stage of ['exploration','proposal','writing','revision','defense','archiving']){
  for(const a of activityLibrary('medicine',{stage}).filter(a=>['reproduce','experiment','code'].includes(a.id))){
   assert.match(a.title.en,/^Review:/);assert.match(a.steps[0].en,/completed work/);assert.match(a.output.en,/existing work/);
  }
 }
 assert.deepEqual(activityCatalog,original);
});

test('rest days have no mandatory activity and optional days keep a small reading or thinking step',()=>{
 const r=run({specialties:['clinical'],methods:['clinical'],stage:'collection'});
 const tasks=r.personalization.week.map(d=>d.tracks[0]);
 assert.equal(tasks[4].operations.length,0);
 assert.deepEqual(ids(tasks[5].operations),['read']);assert.deepEqual(ids(tasks[6].operations),['think']);
 for(const task of tasks.slice(5))for(const a of task.operations){assert.equal(a.optional,true);assert.equal(a.steps.length,2);assert.match(a.title.en,/^Optional/);}
 for(const task of tasks.slice(0,4))assert.ok(task.operations.every(a=>!a.optional));
});

test('weekly focus is tied to stored activity dates and tolerates a full week of rest',()=>{
 const r=run({specialties:['ai','clinical'],methods:['computation','clinical'],stage:'analysis'}),p=r.personalization;
 for(const a of p.week_focus.action_map){
  assert.deepEqual(a.dates,p.week.filter(d=>d.tracks.some(t=>t.operations.some(op=>op.id===a.id))).map(d=>d.date));
 }
 assert.equal(p.week_focus.priorities.length,2);assert.equal(p.week_focus.questions.length,3);assert.ok(p.week_focus.deliverables.length>=2);
 const bi={zh:'恢复后接续',en:'Resume after resting'},days=r.days.map(d=>({...d,phase:4,working:false}));
 const week=days.map(day=>attachActivities({action:bi,output:bi},{day,group:'science'}));
 const focus=buildWeekFocus({days,tracks:[{name:bi,week}],goal:bi,question:bi});
 validateWeekFocus(focus,days);assert.deepEqual(focus.action_map,[]);assert.deepEqual(focus.deliverables,[bi]);
});

test('activity guidance never books extra tasks and old records need no enrichment',async()=>{
 const input={...base,tasks:[{id:'draft',title:'Draft results',minutes:45}]};
 const r=weekly(input),old=structuredClone(r);delete old.week_focus;old.version='0.12.0';
 for(const s of old.disciplines){delete s.activity_library;delete s.week_focus;for(const t of s.week)delete t.operations;}
 const snapshot=structuredClone(old);validateWeeklyReport(old);
 const html=await renderWeeklyHistoryHtml({records:[{record_id:'old',record_type:'weekly',input,report:old}]});
 assert.ok(html.includes('weekly-records'));assert.deepEqual(old,snapshot);assert.equal(r.schedule.length,1);assert.deepEqual(r.schedule,old.schedule);
 assert.deepEqual(weekly({...input,tasks:[]}).schedule,[]);
});

test('saved reports reject malformed activity steps and out-of-week focus dates',()=>{
 const r=run({specialties:['ai'],stage:'analysis'});
 for(const edit of [x=>x.disciplines[0].week[0].operations[0].steps=['bad'],x=>x.personalization.week[0].tracks[0].operations[0].optional=true,x=>x.week_focus.action_map[0].dates.push('2026-10-01'),x=>x.personalization.activity_libraries.ai[0].id='unknown']){
  const bad=structuredClone(r);edit(bad);assert.throws(()=>validateWeeklyReport(bad));
 }
});

test('offline HTML escapes supplied focus and bilingual Markdown retains detailed guidance',async()=>{
 const r=run({specialties:['ai'],methods:['computation'],stage:'analysis',focus:'</script><img src=x onerror=alert(1)>'}),snapshot=structuredClone(r);
 const html=await renderWeeklyHistoryHtml({records:[{record_id:'demo',record_type:'weekly',input:base,report:r}]});
 assert.ok(html.includes('\\u003c/script>'));assert.ok(!html.includes('<img src=x'));
 assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|<script[^>]+src=/.test(html));
 for(const lang of ['zh','en']){
  const md=renderWeeklyMarkdown(r,lang),op=r.personalization.week[1].tracks[0].operations[0];
  assert.ok(md.includes(op.title[lang]));assert.ok(md.includes(op.check[lang]));assert.ok(md.includes(r.personalization.week_focus.questions[0][lang]));
 }
 assert.deepEqual(r,snapshot);
});
