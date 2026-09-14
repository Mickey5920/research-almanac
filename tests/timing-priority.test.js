import test from 'node:test';
import assert from 'node:assert/strict';
import {DateTime} from 'luxon';
import {recommend,validateInput} from '../scripts/core.js';
import {zodiacTimingAt} from '../scripts/astrology.js';
const base={mode:'project',now:'2026-09-15T00:00:00Z',timezone:'Asia/Shanghai',range:{mode:'custom',start_date:'2026-09-21',end_date_exclusive:'2026-09-28'},project:{title:'Synthetic priority test',target:'Synthetic journal',stage:'initial'},readiness:{status:'ready'},deadline:{status:'none'},preferences:{count:1},astrology:{personal_sign:'处女座'}};
function policy(day){return {target:'Synthetic journal',timezone:'Asia/Shanghai',preferred_weekdays:[day],evidence:{status:'verified',source_url:'https://example.org/synthetic-test-only',checked_at:'2026-09-15',conclusion:'Synthetic fixture only',applicability:'Synthetic fixture; not a real journal policy'}};}
test('verified academic preference wins over stronger cultural score and explains conflict',()=>{
 const original=recommend(base).recommendations[0],day=DateTime.fromISO(original.local_click).weekday;
 let result;
 for(let d=1;d<=7;d++)if(d!==day){
  const r=recommend({...base,academic_timing:policy(d)});
  if(r.recommendations[0].sort_factors.cultural<original.sort_factors.cultural||r.recommendations[0].sort_factors.zodiac<original.sort_factors.zodiac){result=r;break;}
 }
 assert.ok(result);assert.equal(result.recommendations[0].academic_timing.matched,true);
 assert.match(result.timing_policy.explanation,/文化择时更优/);
});
test('deadline remains a hard limit even when academic evidence favors a later day',()=>{
 const r=recommend({...base,deadline:{status:'user_supplied',at:'2026-09-22T00:00:00+08:00',source:'Synthetic'},academic_timing:policy(7)});
 assert.ok(r.recommendations.every(c=>Date.parse(c.end_utc)<Date.parse('2026-09-22T00:00:00+08:00')));
});
test('academic policy requires target-specific verified applicability and timezone',()=>{
 assert.throws(()=>validateInput({...base,academic_timing:{...policy(1),target:'Other journal'}}));
 assert.throws(()=>validateInput({...base,academic_timing:{...policy(1),timezone:'unknown'}}));
 const unverified=policy(1);unverified.evidence.status='user_supplied';assert.throws(()=>validateInput({...base,academic_timing:unverified}));
});
test('strict tradition cannot filter out the only academically preferred available day',()=>{
 const r=recommend({...base,academic_timing:policy(2),preferences:{count:1,strict_traditional:true}});
 assert.equal(r.recommendations[0].academic_timing.matched,true);assert.match(r.timing_policy.explanation,/严格择吉/);
});
test('personal zodiac analysis depends on user sign and computed time, not a sign recommendation label',()=>{
 const a=zodiacTimingAt('2026-09-21T01:10:00Z','处女座'),b=zodiacTimingAt('2026-09-21T01:10:00Z','双子座');
 assert.equal(a.personal_sign,'处女座');assert.notEqual(a.score,b.score);assert.equal(zodiacTimingAt('2026-09-21T01:10:00Z',null),null);
});
