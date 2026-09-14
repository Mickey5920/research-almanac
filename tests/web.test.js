import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import http from 'node:http';
import {DateTime} from 'luxon';
import {formToInput} from '../scripts/web-input.js';
import {HistoryStore} from '../scripts/history-store.js';
import {createServer,snapshotHtml} from '../scripts/server.js';
import {recommend} from '../scripts/core.js';
const now=DateTime.fromISO('2026-09-14T00:00:00Z');
const form={title:'Synthetic history example',timezone:'Asia/Shanghai',readiness:'ready',deadline_status:'none',weekdays:[1,2,3,4,5],range_mode:'next_week'};
const input=()=>formToInput(form,now);
const temp=()=>mkdtemp(join(tmpdir(),'zhouyi-history-test-'));
test('form stores exact run time and weekday availability',()=>{
 const i=input();assert.equal(i.now,now.toUTC().toISO());assert.equal(i.availability.length,5);
 assert.ok(i.availability.every(a=>a.start.endsWith('+08:00')));assert.equal(recommend(i).recommendations.length,3);
});
test('custom date form includes final day and converts user deadline',()=>{
 const i=formToInput({...form,range_mode:'custom',start_date:'2026-09-21',end_date:'2026-09-23',deadline_status:'set',deadline_at:'2026-09-24T18:00'},now);
 assert.equal(i.range.end_date_exclusive,'2026-09-24');assert.equal(i.availability.length,3);assert.equal(i.deadline.status,'user_supplied');assert.equal(DateTime.fromISO(i.deadline.at).toUTC().hour,10);
});
test('form rejects missing weekdays and inverted daily window',()=>{
 assert.throws(()=>formToInput({...form,weekdays:[]},now));assert.throws(()=>formToInput({...form,day_start:'18:00',day_end:'09:00'},now));
});
test('form rejects DST gap and repeated deadline wall times',()=>{
 for(const deadline_at of ['2026-03-08T02:30','2026-11-01T01:30'])assert.throws(()=>formToInput({...form,timezone:'America/New_York',deadline_status:'set',deadline_at},now),/夏令时/);
});
test('history survives reopening and retains immutable input/result pairs',async()=>{
 const dir=await temp(),store=new HistoryStore(dir),i=input(),report=recommend(i);
 const first=await store.add({input:i,report});i.project.title='changed';
 const second=await store.add({input:i,report:recommend(i),parent_record_id:first.record_id});
 const {records}=await new HistoryStore(dir).list();assert.equal(records.length,2);
 assert.equal(records.find(r=>r.record_id===first.record_id).input.project.title,form.title);
 assert.equal(second.parent_record_id,first.record_id);assert.notEqual(first.record_id,second.record_id);
});
test('legacy input absence and corrupt history metadata are explicit',async()=>{
 const dir=await temp(),store=new HistoryStore(dir),record=await store.add({report:recommend(input()),source:'legacy-import'});
 assert.equal(record.input,null);record.created_at=null;
 await writeFile(join(dir,record.record_id+'.json'),JSON.stringify(record));
 const listed=await store.list();assert.equal(listed.records.length,0);assert.equal(listed.warnings.length,1);
 assert.ok(await readFile(join(dir,record.record_id+'.json'),'utf8'));
});
test('snapshot embeds all records and escapes script-closing user text',async()=>{
 const i=input();i.project.title='</script><script>alert(1)</script> $&';
 const store=new HistoryStore(await temp()),a=await store.add({input:i,report:recommend(i)}),b=await store.add({report:recommend(input())});
 const html=await snapshotHtml([a,b]);assert.ok(html.includes(a.record_id)&&html.includes(b.record_id));
 assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(html.includes('\\u003c/script>'));
 assert.ok(!html.includes('src="/app.js"'));assert.ok(!html.includes('href="/style.css"'));assert.ok(html.includes('window.__SNAPSHOT__='));
});
test('HTTP generation, reopening history, import, export and request boundaries',async t=>{
 const server=createServer({dataDir:await temp()});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(()=>new Promise(resolve=>server.close(resolve)));
 const url='http://127.0.0.1:'+server.address().port;
 const session=await (await fetch(url+'/api/session')).json();
 const post=(path,data,headers={})=>fetch(url+path,{method:'POST',headers:{'content-type':'application/json','x-local-token':session.token,...headers},body:JSON.stringify(data)});
 const generated=await post('/api/generate',{input:input()});assert.equal(generated.status,201);
 const {record}=await generated.json();assert.deepEqual(record.input,input());assert.equal(record.report.recommendations.length,3);
 assert.equal((await post('/api/generate',{input:input()},{'x-local-token':'wrong'})).status,403);
 assert.equal((await post('/api/generate',{input:input()},{Origin:'https://example.com'})).status,403);
 const invalidHostStatus=await new Promise((resolve,reject)=>{http.get(url+'/api/history',{headers:{Host:'untrusted.example'}},r=>{r.resume();resolve(r.statusCode);}).on('error',reject);});
 assert.equal(invalidHostStatus,403);
 assert.equal((await fetch(url+'/.local-data/history')).status,404);
 assert.equal((await post('/api/generate',{input:{}})).status,400);
 assert.equal((await post('/api/generate',{input:input(),form})).status,400);
 assert.equal((await post('/api/import',{input:input(),report:record.report})).status,201);
 const legacy=await (await post('/api/import',record.report)).json();assert.equal(legacy.record.input,null);
 const list=await (await fetch(url+'/api/history')).json();assert.equal(list.records.length,3);
 const landing=await (await fetch(url+'/')).text();assert.ok(landing.includes('local-records'));assert.ok(!landing.includes('api/generate'));assert.ok(landing.includes("connect-src 'none'"));
 const exported=await fetch(url+'/api/export.html');assert.equal(exported.status,200);
 const html=await exported.text();for(const item of list.records)assert.ok(html.includes(item.record_id));
});
