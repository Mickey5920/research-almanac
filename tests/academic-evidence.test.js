import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateInput,recommend} from '../scripts/core.js';
import {renderHistoryHtml} from '../scripts/report-html.js';
const input={mode:'project',timezone:'Asia/Shanghai',project:{title:'Synthetic academic evidence',target:'Example journal',stage:'initial'},readiness:{status:'ready'}};
test('verified academic evidence requires source and date and matches target',()=>{
 const a=structuredClone(input);a.academic_evidence={target:'Example journal',journal_system:{status:'verified',summary:'Example'}};
 assert.throws(()=>validateInput(a));Object.assign(a.academic_evidence.journal_system,{source_title:'Synthetic official page',source_url:'https://example.org/authors',checked_at:'2026-09-14'});assert.doesNotThrow(()=>validateInput(a));
 a.project.target='Different journal';assert.throws(()=>validateInput(a),/target/);
});
test('unknown evidence is honest, unsafe URLs and fabricated timezone identifiers are rejected',()=>{
 const a=structuredClone(input);a.academic_evidence={target:'Example journal',editorial_office:{status:'unknown',summary:'Not checked'}};assert.doesNotThrow(()=>validateInput(a));
 a.academic_evidence.editorial_office.source_url='javascript:alert(1)';assert.throws(()=>validateInput(a));delete a.academic_evidence.editorial_office.source_url;
 a.academic_evidence.editorial_office.timezone='Not/AZone';assert.throws(()=>validateInput(a));
});
test('academic context does not change candidate ranking or create a personal acceptance score',()=>{
 const a={...input,now:'2026-09-14T00:00:00Z'},b={...a,academic_evidence:{target:'Example journal',editorial_office:{status:'unknown',summary:'No information'}}};
 assert.deepEqual(recommend(a).recommendations,recommend(b).recommendations);
});
test('reference snapshot preserves distinct sample denominators and disabled traditions',async()=>{
 const lib=JSON.parse(readFileSync(new URL('../data/reference-library.json',import.meta.url),'utf8'));
 assert.equal(lib.studies[0].rates.reduce((sum,x)=>sum+x.submitted,0),596);
 assert.ok(lib.studies.find(x=>x.sample===178000).limitation.includes('分母'));assert.ok(lib.studies.find(x=>x.sample===11499).limitation.includes('OR'));
 assert.equal(lib.glossary.length,7);assert.equal(lib.books.length,6);
 const html=await renderHistoryHtml({records:[]});assert.ok(html.includes('19.2 学术参考'));assert.ok(html.includes('reference_library'));
 assert.ok(!/\bfetch\s*\(|XMLHttpRequest|WebSocket/.test(html));assert.ok(html.includes('体用'));
});

