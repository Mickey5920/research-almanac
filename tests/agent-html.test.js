import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,readdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {renderHistoryHtml} from '../scripts/report-html.js';
const cli=fileURLToPath(new URL('../scripts/cli.js',import.meta.url));
test('Agent CLI saves paired local records and default HTML across two invocations',async()=>{
 const root=await mkdtemp(join(tmpdir(),'zhouyi-agent-')),history=join(root,'history'),path=join(root,'input.json');
 const input={mode:'cultural',cultural:{action:'interpret_text'}};
 await writeFile(path,JSON.stringify(input));
 for(const n of [1,2])execFileSync(process.execPath,[cli,'recommend',path,'--out',join(root,'run'+n),'--history-dir',history]);
 const a=JSON.parse(await readFile(join(root,'run1/record.json'),'utf8')),b=JSON.parse(await readFile(join(root,'run2/record.json'),'utf8'));
 assert.ok(a.input.now);assert.equal(a.report.generated_at,a.input.now);assert.equal(b.source,'agent');
 assert.equal((await readdir(history)).length,2);
 const html=await readFile(join(root,'run2/report.html'),'utf8');
 const payload=JSON.parse(html.match(/<script id="local-records" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 assert.equal(payload.records.length,2);assert.equal(payload.current_record_id,b.record_id);
 assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|api\/generate|api\/session/.test(html));
 assert.ok(html.includes("connect-src 'none'"));assert.ok(!/<script[^>]+src=|<link[^>]+href=/.test(html));
 assert.throws(()=>execFileSync(process.execPath,[cli,'recommend',path,'--out',join(root,'run2'),'--history-dir',history],{stdio:'pipe'}));
 assert.equal((await readdir(history)).length,2);
 execFileSync(process.execPath,[cli,'history-html','--out',join(root,'all.html'),'--history-dir',history]);
 assert.equal((await readdir(history)).length,2);assert.ok((await readFile(join(root,'all.html'),'utf8')).includes(a.record_id));
});
test('read-only renderer preserves literals, marks incomplete history and escapes executable text',async()=>{
 const html=await renderHistoryHtml({records:[{record_id:'test',input:{title:'</script><img src=x onerror=alert(1)> $&'},report:{}}],warnings:['damaged record'],current_record_id:'test'});
 assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('\\u003c/script>'));assert.ok(html.includes('$&'));
 assert.ok(html.includes('damaged record'));assert.ok(html.includes('"current_record_id":"test"'));
});

