import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {weekly,validateWeeklyInput,validateWeeklyReport} from '../scripts/weekly.js';
import {HistoryStore} from '../scripts/history-store.js';
import {recommend} from '../scripts/core.js';
import {renderHistoryHtml} from '../scripts/report-html.js';
import {createServer} from '../scripts/server.js';
import {Script} from 'node:vm';
const base=()=>({timezone:'Asia/Shanghai',now:'2026-09-19T08:00:00+08:00'});
const span=(start,end)=>({start:'2026-09-21T'+start+':00+08:00',end:'2026-09-21T'+end+':00+08:00'});
const project=()=>({mode:'project',timezone:'Asia/Shanghai',project:{title:'Synthetic',stage:'initial'},readiness:{status:'ready'},deadline:{status:'none'}});

test('weekly resolves the next local Monday, holiday break and calendar independently of the preview',()=>{
 const r=weekly(base());assert.equal(r.week_start,'2026-09-21');assert.equal(r.week_end,'2026-09-27');
 assert.equal(r.days[2].calendar.term,'秋分');assert.equal(r.days[0].calendar.ganzhi,'戊戌');
 assert.deepEqual(r.days.map(d=>d.working),[true,true,true,true,false,false,false]);
 assert.equal(r.disciplines.length,6);assert.equal(new Set(r.days.map(d=>d.rhythm.id)).size,7);
 const other=weekly({...base(),week_start:'2026-09-07'});assert.equal(other.days[4].working,true);assert.equal(other.days[4].holiday,null);
 assert.equal(weekly({...base(),week_start:'2026-09-14'}).days[6].makeup,true);
});
test('local timezone decides next week, without fabricating non-Shanghai calendar facts',()=>{
 const r=weekly({timezone:'America/Los_Angeles',now:'2026-09-21T01:00:00Z'});
 assert.equal(r.week_start,'2026-09-21');assert.ok(r.days.every(d=>d.calendar===null));
 const monday=weekly({...base(),now:'2026-09-21T08:00:00+08:00'});assert.equal(monday.week_start,'2026-09-28');
 assert.throws(()=>weekly({...base(),week_start:'2026-09-22'}),/Monday/);
 assert.throws(()=>weekly({...base(),timezone:'Invalid/Zone'}),/timezone/);
});
test('unknown holiday years use a labelled weekday fallback',()=>{
 const r=weekly({...base(),week_start:'2027-09-20'});assert.ok(r.days.every(d=>!d.holiday));
 assert.ok(r.assumptions.some(a=>a.en.includes('other years')));
 assert.ok(!r.sources.some(s=>s.kind==='official'));
});
test('field and clinical rhythms preserve essential work, including holidays',()=>{
 const r=weekly(base());
 for(const id of ['agriculture','medicine']){
  const s=r.disciplines.find(s=>s.id===id);assert.equal(s.week.length,7);
  assert.match(s.week[4].action.en,/essential|clinical|necessary/);
  for(let i=0;i<7;i++){assert.equal(s.rhythms[i].date,r.days[i].date);assert.equal(s.rhythms[i].zh.blocks.length,3);assert.equal(s.rhythms[i].en.blocks.length,3);}
 }
});
test('tasks respect fixed events, exclusions, dependencies, deadlines and explicit empty availability',()=>{
 const i={...base(),availability:[span('09:00','12:00'),span('14:00','17:00')],fixed_events:[{title:'Meeting',...span('10:00','11:00')}],excluded_intervals:[span('14:00','15:00')],preferences:{buffer_ratio:0},tasks:[
  {id:'a',title:'A',minutes:60},{id:'b',title:'B',minutes:60,depends_on:['a'],deadline:'2026-09-21T12:00:00+08:00'},
  {id:'c',title:'C',minutes:60,depends_on:['b'],not_before:'2026-09-21T14:00:00+08:00'}]};
 const r=weekly(i);assert.deepEqual(r.schedule.map(t=>t.start.slice(11,16)),['09:00','11:00','15:00']);assert.equal(r.unscheduled.length,0);
 const empty=weekly({...i,availability:[]});assert.equal(empty.schedule.length,0);assert.equal(empty.unscheduled.length,3);
 assert.equal(empty.unscheduled.find(t=>t.id==='b').reason,'dependency_unavailable');
});
test('missing estimates remain unscheduled, completed dependencies need no new slot, and no plan changes the input',()=>{
 const i={...base(),tasks:[{id:'a',title:'A'},{id:'b',title:'B',minutes:15,depends_on:['a']},{id:'done',title:'Done',status:'done'},{id:'c',title:'C',minutes:30,depends_on:['done']}]};
 const prior=structuredClone(i),r=weekly(i);assert.deepEqual(i,prior);
 assert.equal(r.unscheduled.find(t=>t.id==='a').reason,'needs_estimate');assert.equal(r.schedule.length,1);assert.equal(r.schedule[0].id,'c');
});
test('daily buffer, maximum count and overnight boundaries are enforced',()=>{
 const i={...base(),availability:[span('09:00','10:00')],tasks:[{id:'a',title:'A',minutes:50}]};
 assert.equal(weekly(i).schedule.length,0);assert.equal(weekly({...i,preferences:{buffer_ratio:0}}).schedule.length,1);
 const r=weekly({...base(),preferences:{max_tasks_per_day:1},tasks:[{id:'a',title:'A',minutes:15},{id:'b',title:'B',minutes:15}]});assert.notEqual(r.schedule[0].start.slice(0,10),r.schedule[1].start.slice(0,10));
 const overnight=weekly({...base(),availability:[{start:'2026-09-21T23:30:00+08:00',end:'2026-09-22T00:30:00+08:00'}],preferences:{buffer_ratio:0},tasks:[{id:'a',title:'A',minutes:45}]});assert.equal(overnight.schedule.length,0);
});
test('task graph rejects cycles, duplicate ids and unknown preparation ids',()=>{
 assert.throws(()=>validateWeeklyInput({...base(),tasks:[{id:'a',title:'A',depends_on:['a']}]}),/Cyclic/);
 assert.throws(()=>validateWeeklyInput({...base(),tasks:[{id:'a',title:'A'},{id:'a',title:'B'}]}),/Duplicate/);
 assert.throws(()=>validateWeeklyInput({...base(),tasks:[{id:'a',title:'A',depends_on:['missing']}]}),/Missing/);
 assert.throws(()=>validateWeeklyInput({...base(),submission:project(),submission_task_ids:['missing']}),/Unknown/);
});
test('submission reuses the old engine after required preparation, without clashes or false completion',()=>{
 const r=weekly({...base(),tasks:[{id:'prepare',title:'Preparation',minutes:60,not_before:'2026-09-23T09:00:00+08:00'}],submission_task_ids:['prepare'],submission:project()});
 assert.ok(r.submission.report.recommendations.length>0);assert.equal(r.submission.report.readiness.status,'conditional');
 assert.ok(r.submission.report.recommendations.every(c=>Date.parse(c.start_utc)>=Date.parse(r.schedule[0].end)));
 const old=recommend(r.submission.input);assert.deepEqual(old.recommendations,r.submission.report.recommendations);
 const blocked=weekly({...base(),tasks:[{id:'prepare',title:'Preparation'}],submission_task_ids:['prepare'],submission:project()});assert.equal(blocked.submission.report.recommendations.length,0);
});
test('submission keeps its own exclusions, availability and hard deadline within the weekly range',()=>{
 const r=weekly({...base(),submission:{...project(),availability:[span('10:00','12:00')],excluded_intervals:[span('10:00','11:00')],deadline:{status:'user_supplied',at:'2026-09-21T12:00:00+08:00',source:'Test'}}});
 assert.ok(r.submission.report.recommendations.length>0);
 for(const c of r.submission.report.recommendations){assert.ok(Date.parse(c.start_utc)>=Date.parse(span('11:00','12:00').start));assert.ok(Date.parse(c.end_utc)<Date.parse(span('11:00','12:00').end));}
 assert.throws(()=>weekly({...base(),submission:{...project(),timezone:'UTC'}}),/timezone/);
});
test('stored output validation rejects bad ranges, task overlap and submission conflicts',()=>{
 const r=weekly({...base(),tasks:[{id:'a',title:'A',minutes:30},{id:'b',title:'B',minutes:30}],submission:project()});
 const corrupt=structuredClone(r);corrupt.days[0].date='2026-09-22';assert.throws(()=>validateWeeklyReport(corrupt),/day mismatch/);
 const overlap=structuredClone(r);overlap.schedule[1].start=overlap.schedule[0].start;overlap.schedule[1].end=overlap.schedule[0].end;assert.throws(()=>validateWeeklyReport(overlap),/Overlapping/);
 const clash=structuredClone(r);const c=clash.submission.report.recommendations[0];clash.fixed_events.push({title:'Clash',start:c.start_utc,end:c.end_utc});assert.throws(()=>validateWeeklyReport(clash),/conflicts/);
 const brokenRhythm=structuredClone(r);delete brokenRhythm.disciplines[0].rhythms[0].en;assert.throws(()=>validateWeeklyReport(brokenRhythm),/rhythm/);
});
test('mixed history preserves legacy records and paired weekly inputs with offline escaped rendering',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'weekly-history-')),store=new HistoryStore(dir);
 const old=await store.add({input:{mode:'cultural'},report:recommend({mode:'cultural'})});delete old.record_type;
 await writeFile(join(dir,old.record_id+'.json'),JSON.stringify(old));
 const i={...base(),title:'</script><img src=x onerror=alert(1)> $&'},current=await store.add({input:i,report:weekly(i)});
 const snapshot=await readFile(join(dir,old.record_id+'.json'),'utf8');
 const history=await store.list();assert.equal(history.records.length,2);assert.equal(history.warnings.length,0);
 const html=await renderHistoryHtml({...history,current_record_id:current.record_id});
 assert.ok(html.includes('weekly-records'));assert.ok(html.includes(old.record_id));assert.ok(html.includes('\\u003c/script>'));assert.ok(!html.includes('<img src=x'));
 assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|<script[^>]+src=/.test(html));
 assert.equal(await readFile(join(dir,old.record_id+'.json'),'utf8'),snapshot);
});
test('weekly CLI exports standalone paired reports, nested submission and read-only history without overwriting',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'weekly-cli-')),path=join(dir,'input.json'),history=join(dir,'history'),out=join(dir,'run');
 await writeFile(path,JSON.stringify({...base(),submission:project()}));
 const cli=fileURLToPath(new URL('../scripts/cli.js',import.meta.url));
 execFileSync(process.execPath,[cli,'weekly',path,'--out',out,'--history-dir',history]);
 const files=await readdir(out);for(const f of ['input.json','weekly.json','record.json','manifest.json','report.html','report.md','report.en.md','submission.json','submission.html','submission-windows.ics'])assert.ok(files.includes(f),f);
 const before=await readdir(history);assert.throws(()=>execFileSync(process.execPath,[cli,'weekly',path,'--out',out,'--history-dir',history],{stdio:'pipe'}));
 execFileSync(process.execPath,[cli,'history-html','--out',join(dir,'history.html'),'--history-dir',history]);assert.deepEqual(await readdir(history),before);
});
test('weekly display script parses and mixed history works through the optional server',async t=>{
 new Script(await readFile(new URL('../web/weekly.js',import.meta.url),'utf8'));
 const dir=await mkdtemp(join(tmpdir(),'weekly-server-')),store=new HistoryStore(dir);
 const old=await store.add({input:{mode:'cultural'},report:recommend({mode:'cultural'})});
 const i=base(),record=await store.add({input:i,report:weekly(i)});
 const server=createServer({dataDir:dir});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));t.after(()=>new Promise(resolve=>server.close(resolve)));
 const url='http://127.0.0.1:'+server.address().port;
 for(const path of ['/','/api/export.html']){
  const response=await fetch(url+path);assert.equal(response.status,200);const html=await response.text();
  assert.ok(html.includes('weekly-records'));assert.ok(html.includes(old.record_id));assert.ok(html.includes(record.record_id));
 }
 const session=await (await fetch(url+'/api/session')).json();
 const imported=await fetch(url+'/api/import',{method:'POST',headers:{'content-type':'application/json','x-local-token':session.token},body:JSON.stringify(record)});
 assert.equal(imported.status,201);assert.equal((await imported.json()).record.record_type,'weekly');
 assert.equal((await store.list()).records.length,3);
});
