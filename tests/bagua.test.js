import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {baguaLibrary,baguaForDirection} from '../scripts/bagua.js';
import {recommend} from '../scripts/core.js';
import {render} from '../scripts/render.js';
import {renderHistoryHtml} from '../scripts/report-html.js';
test('all eight Later Heaven directions and cardinal aliases resolve to distinct trigrams',()=>{
 const expected={北:'kan',东北:'gen',东:'zhen',东南:'xun',南:'li',西南:'kun',西:'dui',西北:'qian'};
 for(const [name,id] of Object.entries(expected))assert.equal(baguaForDirection({name}).id,id);
 for(const [name,id] of [['正北','kan'],['正南','li'],['正东','zhen'],['正西','dui']])assert.equal(baguaForDirection(name).id,id);
 assert.equal(new Set(baguaLibrary.trigrams.map(t=>t.lines_top_down)).size,8);
 for(const t of baguaLibrary.trigrams){assert.match(t.lines_top_down,/^[01]{3}$/);assert.ok(t.quote&&t.meaning&&t.meaning_en&&t.application&&t.application_en);}
});
test('missing or arbitrary directions have no inferred trigram and returned data is isolated',()=>{
 for(const value of [null,undefined,'','未知','__proto__',{name:'toString'}])assert.equal(baguaForDirection(value),null);
 const b=baguaForDirection('南');b.quote='altered';assert.equal(baguaForDirection('正南').quote,'離，麗也。');
});
test('HTML carries original text and source metadata without modifying saved records',async()=>{
 const input=JSON.parse(readFileSync(new URL('../examples/project.json',import.meta.url)));const report=recommend(input);
 const record={record_id:'bagua-test',created_at:input.now,input,report};const before=structuredClone(record);
 const html=await renderHistoryHtml({records:[record]});const payload=JSON.parse(html.match(/<script id="local-records" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 assert.deepEqual(record,before);assert.deepEqual(payload.records,[before]);
 assert.equal(payload.bagua_library.trigrams.length,8);
 for(const c of report.recommendations){const b=payload.explanations[record.record_id][c.candidate_id].bagua;assert.equal(b.id,baguaForDirection(c.direction).id);assert.ok(b.source.url.startsWith('https://'));}
});
test('bilingual Markdown keeps classical originals and separates explanations from modern applications',()=>{
 const input=JSON.parse(readFileSync(new URL('../examples/project.json',import.meta.url)));const report=recommend(input),before=structuredClone(report);
 for(const lang of ['zh','en']){const text=render(report,lang);for(const c of report.recommendations){const b=baguaForDirection(c.direction);assert.ok(text.includes(b.quote));assert.ok(text.includes(lang==='zh'?b.meaning:b.meaning_en));assert.ok(text.includes(lang==='zh'?b.application:b.application_en));}}
 assert.deepEqual(report,before);
});
