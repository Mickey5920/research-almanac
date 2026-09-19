import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {weekly,validateWeeklyReport} from '../scripts/weekly.js';
import {profileCatalog} from '../scripts/research-profile.js';
import {renderWeeklyMarkdown,renderWeeklyHistoryHtml} from '../scripts/weekly-html.js';
import {HistoryStore} from '../scripts/history-store.js';

const base=()=>({timezone:'Asia/Shanghai',now:'2026-09-19T08:00:00+08:00'});
const run=p=>weekly({...base(),research_profile:p});

test('every category has a runnable bilingual direction and every method and stage composes',()=>{
 const categories=new Set(profileCatalog.categories.map(c=>c.id));
 assert.equal(categories.size,14);
 assert.deepEqual(new Set(profileCatalog.specialties.map(s=>s.category)),categories);
 for(const f of profileCatalog.specialties){
  assert.ok(profileCatalog.methods.some(m=>m.id===f.suggested_method));
  const r=run({specialties:[f.id],methods:[f.suggested_method],stage:'analysis'});
  assert.equal(r.personalization.fields[0].name.en,f.name.en);assert.equal(r.personalization.week.length,7);validateWeeklyReport(r);
 }
 for(const method of profileCatalog.methods)for(const stage of profileCatalog.stages){
  const r=run({methods:[method.id],stage:stage.id});validateWeeklyReport(r);
  assert.equal(r.personalization.week[1].methods[0].id,method.id);
 }
});
test('clinical data and basic lab research produce distinct actions and outputs within medicine',()=>{
 const a=run({specialties:['clinical'],methods:['clinical'],stage:'analysis'}).personalization;
 const b=run({specialties:['basic_medicine'],methods:['wet_lab'],stage:'analysis'}).personalization;
 assert.equal(a.fields[0].group,b.fields[0].group);
 assert.notDeepEqual(a.week[1].tracks[0].action,b.week[1].tracks[0].action);
 assert.notDeepEqual(a.week[1].tracks[0].output,b.week[1].tracks[0].output);
 assert.notDeepEqual(a.week[1].methods,b.week[1].methods);
});
test('writing and defense focus on existing evidence instead of scheduling new lab activity',()=>{
 const input={specialties:['basic_medicine'],methods:['wet_lab']};
 const analysis=run({...input,stage:'analysis'}).personalization;
 for(const stage of ['writing','defense','revision']){
  const r=run({...input,stage}).personalization;
  assert.notDeepEqual(r.week[1].tracks[0].action,analysis.week[1].tracks[0].action);
  assert.notDeepEqual(r.week[1].tracks[0].output,analysis.week[1].tracks[0].output);
  assert.notDeepEqual(r.week[1].methods[0].action,analysis.week[1].methods[0].action);
  assert.equal(r.week[1].tracks[0].output.en,profileCatalog.stages.find(s=>s.id===stage).output.en);
 }
});
test('multiple specialties and methods are retained throughout seven days without being merged into one field',()=>{
 const r=run({specialties:['clinical','ai'],methods:['clinical','computation'],stage:'analysis'}).personalization;
 assert.deepEqual(r.fields.map(f=>f.id),['clinical','ai']);
 for(const d of r.week){assert.deepEqual(d.tracks.map(t=>t.field_id),['clinical','ai']);assert.deepEqual(d.methods.map(m=>m.id),['clinical','computation']);assert.ok(d.integration.zh&&d.integration.en);}
});
test('custom directions preserve supplied text and do not invent a specialist workflow or English translation',()=>{
 const name='数字人文 / user-defined <field>';
 const r=run({custom_specialties:[{name,category:'14'}],methods:['text'],stage:'proposal'}).personalization;
 assert.deepEqual(r.fields[0].name,{zh:name,en:name});assert.equal(r.fields[0].origin,'user');
 assert.equal(r.fields[0].category,'14');assert.equal(r.week[1].tracks[0].name.zh,name);
});
test('missing method and stage remain explicit, and method-only profiles do not invent a specialty',()=>{
 const a=run({specialties:['law']}).personalization;assert.deepEqual(a.methods,[]);assert.equal(a.stage.origin,'general');assert.equal(a.degree,null);
 const b=run({methods:['theory']}).personalization;assert.deepEqual(b.fields,[]);assert.equal(b.week[0].tracks[0].field_id,'general');
});
test('invalid ids, duplicate directions and excessive combinations are rejected before generation',()=>{
 for(const p of [{specialties:['unknown']},{specialties:['law','law']},{methods:['unknown']},{stage:'unknown'},
  {custom_specialties:[{name:'a',category:'99'}]},{custom_specialties:[{name:' ',category:'01'}]},
  {custom_specialties:[{name:'a',category:'01'},{name:'a',category:'02'}]},
  {specialties:['law','clinical','design','ai'],custom_specialties:[{name:'Extra',category:'14'}]},
  {specialties:[],methods:[]},{}])assert.throws(()=>run(p));
});
test('nonworking days keep light suggestions and essentials while workday suggestions have concrete checks',()=>{
 const r=run({specialties:['clinical','crop'],methods:['clinical','field'],stage:'collection'});
 for(const [i,d] of r.personalization.week.entries()){
  assert.equal(d.light,!r.days[i].working);
  for(const t of d.tracks){assert.ok(t.steps.length>=2);assert.ok(t.checkpoint.en);assert.ok(t.minimum.en);assert.ok(t.blocked.en);}
  if(d.light)assert.ok(d.methods.every(m=>m.output.en.startsWith('An optional')));
 }
 assert.notDeepEqual(r.personalization.week[1].tracks[0].action,r.personalization.week[4].tracks[0].action);
});
test('personalization never books suggested tasks, changes explicit constraints or mutates input',()=>{
 const input={...base(),tasks:[{id:'draft',title:'Draft',minutes:45}],fixed_events:[{title:'Meeting',start:'2026-09-21T09:00:00+08:00',end:'2026-09-21T10:00:00+08:00'}]};
 const a=weekly(input);input.research_profile={specialties:['arts'],methods:['practice'],stage:'writing'};const original=structuredClone(input);const b=weekly(input);
 assert.deepEqual(input,original);assert.deepEqual(a.schedule,b.schedule);assert.deepEqual(a.fixed_events,b.fixed_events);assert.equal(b.schedule.length,1);
 const empty=weekly({...input,availability:[]});assert.equal(empty.schedule.length,0);assert.equal(empty.unscheduled.length,1);
});
test('saved-profile validation rejects shifted dates, mismatched field order and malformed steps',()=>{
 const r=run({specialties:['clinical','ai'],methods:['clinical']});
 for(const edit of [p=>p.week[0].date='2026-09-22',p=>p.week[0].tracks.reverse(),p=>p.week[0].tracks[0].steps=['bad'],p=>p.week[0].methods=[],p=>delete p.week[0].rhythm.en]){
  const bad=structuredClone(r);edit(bad.personalization);assert.throws(()=>validateWeeklyReport(bad),/profile/);
 }
});
test('older weekly records stay readable and are not enriched when history is exported',async()=>{
 const old=weekly(base());delete old.personalization;
 for(const s of old.disciplines)for(const x of s.week)for(const k of ['steps','checkpoint','minimum','blocked','extension','effort'])delete x[k];
 old.version='0.11.0';validateWeeklyReport(old);
 const dir=await mkdtemp(join(tmpdir(),'almanac-profile-')),store=new HistoryStore(dir);
 const prior=await store.add({input:base(),report:old,record_type:'weekly'});
 const before=await readFile(join(dir,prior.record_id+'.json'),'utf8');
 const input={...base(),research_profile:{specialties:['law'],stage:'writing'}},record=await store.add({input,report:weekly(input),record_type:'weekly'});
 const history=await store.list();assert.equal(history.warnings.length,0);assert.equal(history.records.length,2);
 const html=await renderWeeklyHistoryHtml({...history,current_record_id:record.record_id});assert.ok(html.includes(prior.record_id));
 assert.equal(await readFile(join(dir,prior.record_id+'.json'),'utf8'),before);
});
test('HTML embeds complete profile detail safely and Markdown uses the saved personal plan',async()=>{
 const p={custom_specialties:[{name:'</script><img src=x onerror=alert(1)>',category:'14'}],methods:['text'],stage:'writing',focus:'<focus>'};
 const r=run(p),before=structuredClone(r),input={...base(),research_profile:p};
 const html=await renderWeeklyHistoryHtml({records:[{record_id:'demo',record_type:'weekly',input,report:r}],current_record_id:'demo'});
 assert.ok(html.includes('\\u003c/script>'));assert.ok(!html.includes('<img src=x'));assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|<script[^>]+src=/.test(html));
 for(const lang of ['zh','en']){
  const md=renderWeeklyMarkdown(r,lang);assert.ok(md.includes(r.personalization.week[1].tracks[0].output[lang]));assert.ok(md.includes(r.personalization.week[1].tracks[0].checkpoint[lang]));
 }
 assert.deepEqual(r,before);
});
