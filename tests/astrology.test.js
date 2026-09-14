import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Ecliptic,GeoVector,Body} from 'astronomy-engine';
import {astrologyAt,signAt,mercuryMotion,normalizeAngle} from '../scripts/astrology.js';
import {recommend,validateInput} from '../scripts/core.js';
import {validateReport} from '../scripts/validate-report.js';
import {renderHistoryHtml} from '../scripts/report-html.js';
const input=JSON.parse(readFileSync(new URL('../examples/project.json',import.meta.url),'utf8'));
test('zodiac boundaries and Mercury motion threshold are explicit',()=>{
 assert.equal(signAt(0).name,'白羊座');assert.equal(signAt(29.999).name,'白羊座');assert.equal(signAt(30).name,'金牛座');
 assert.equal(signAt(360).name,'白羊座');assert.equal(signAt(-1).name,'双鱼座');
 assert.equal(mercuryMotion(-0.1),'retrograde');assert.equal(mercuryMotion(0.1),'direct');assert.equal(mercuryMotion(0.001),'stationary');
 assert.throws(()=>signAt(NaN));
});
test('NASA April 8 2024 solar eclipse provides a coarse geocentric conjunction anchor',()=>{
 // NASA documents the April 8 eclipse: https://science.nasa.gov/eclipses/future-eclipses/eclipse-2024/
 const date=new Date('2024-04-08T18:00:00Z'),a=astrologyAt(date),sun=Ecliptic(GeoVector(Body.Sun,date,true)).elon;
 const difference=Math.abs(normalizeAngle(a.moon.longitude_degrees-sun+180)-180);
 assert.ok(difference<1);assert.equal(a.moon.sign,'白羊座');
});
test('same instant in different offsets yields identical stored ephemeris, with no inferred personal sign',()=>{
 assert.deepEqual(astrologyAt('2026-09-21T09:10:00+08:00'),astrologyAt('2026-09-21T01:10:00Z'));
 assert.equal(astrologyAt('2026-09-21T01:10:00Z').personal,null);
 assert.equal(astrologyAt('1800-01-01T00:00:00Z'),null);
 assert.throws(()=>astrologyAt('invalid'));
});
test('personalization preserves practical priority while opt-out preserves base selection',()=>{
 const a=recommend(input),b=recommend({...input,astrology:{personal_sign:'处女座'}}),c=recommend({...input,astrology:{enabled:false}});
 const ids=r=>r.recommendations.map(x=>[x.candidate_id,x.rank,x.sort_factors]);
 assert.deepEqual(a.recommendations.map(x=>[x.sort_factors.buffer,x.sort_factors.academic,x.sort_factors.preference,x.sort_factors.cultural]),b.recommendations.map(x=>[x.sort_factors.buffer,x.sort_factors.academic,x.sort_factors.preference,x.sort_factors.cultural]));assert.deepEqual(ids(a),ids(c));assert.ok(b.recommendations.every(x=>x.zodiac_timing.personal_sign==='处女座'));
 assert.equal(b.recommendations[0].astrology.personal.sign,'处女座');assert.ok(c.recommendations.every(x=>!x.astrology));
 assert.throws(()=>validateInput({...input,astrology:{personal_sign:'猜测'}}));
 assert.throws(()=>validateInput({...input,astrology:{birth_date:'2000-01-01'}}));
});
test('saved astrology validates timestamps, zodiac consistency and motion',()=>{
 const r=recommend(input);assert.equal(validateReport(r),true);
 for(const mutate of [
  a=>{a.at_utc='2020-01-01T00:00:00Z';},
  a=>{a.moon.sign='白羊座';a.moon.longitude_degrees=100;},
  a=>{a.mercury.speed_degrees_per_day=1;a.mercury.motion='retrograde';}
 ]){const bad=structuredClone(r);mutate(bad.recommendations[0].astrology);assert.throws(()=>validateReport(bad));}
});
test('old history remains untouched and HTML only embeds saved astrology data',async()=>{
 const r=recommend({...input,astrology:{enabled:false}}),old=structuredClone(r);
 const record={record_id:'legacy',created_at:'2026-09-15T00:00:00Z',input,report:r};
 const html=await renderHistoryHtml({records:[record]});
 assert.deepEqual(r,old);assert.ok(!html.includes('function astrologyAt'));
 const payload=JSON.parse(html.match(/<script id="local-records" type="application\/json">([\s\S]*?)<\/script>/)[1]);
 assert.ok(payload.records[0].report.recommendations.every(c=>!c.astrology));
});
