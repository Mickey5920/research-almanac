import {DateTime,IANAZone} from 'luxon';
import {createHash,randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import lunar from 'lunar-javascript';
import {astrologyAt,zodiacTimingAt} from './astrology.js';
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const softwareVersion=json('../package.json').version;
export const defaults=json('../config/defaults.json'),sources=json('../data/sources.json'),excerpts=json('../data/excerpts.json');
const ajv=new Ajv({allErrors:true,strict:false});addFormats(ajv);
const validate=ajv.compile(json('../schemas/input.schema.json'));
export const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0,20);
export function instant(s){const d=DateTime.fromISO(s,{setZone:true});if(!d.isValid)throw new Error('Invalid ISO timestamp');return d;}
const iso=d=>d.toUTC().toISO();
export function validateInput(input){
 if(!validate(input))throw new Error('Invalid input: '+ajv.errorsText(validate.errors));
 if(input.mode==='project'&&!IANAZone.isValidZone(input.timezone))throw new Error('Unknown IANA timezone');
 if(input.academic_timing){
  if(input.academic_timing.target.trim().toLowerCase()!==input.project?.target?.trim().toLowerCase())throw Error('Academic timing target must match project.target');
  if(!IANAZone.isValidZone(input.academic_timing.timezone))throw Error('Unknown academic timing timezone');
 }
 if(input.academic_evidence&&input.academic_evidence.target.trim().toLowerCase()!==input.project?.target?.trim().toLowerCase())throw new Error('Academic evidence target must match project.target');
 for(const item of Object.values(input.academic_evidence??{}))if(item?.timezone&&!IANAZone.isValidZone(item.timezone))throw new Error('Unknown editorial IANA timezone');
 const p={...defaults,...input.preferences};
 if(p.click_offset_minutes>=p.operation_minutes)throw new Error('Click offset must be inside operation window');
 for(const r of [...(input.availability??[]),...(input.excluded_intervals??[])])if(instant(r.start)>=instant(r.end))throw new Error('Invalid interval order');
 if(['verified','user_supplied'].includes(input.deadline?.status)&&(!input.deadline.at||!input.deadline.source))throw new Error('Deadline requires time and source');
 if(['none','unknown'].includes(input.deadline?.status)&&input.deadline.at)throw new Error('Contradictory deadline status');
 return p;
}
export function resolveRange(input,now){
 const zone=input.timezone,r=input.range??{mode:'next_week'};let start,end;
 if(r.mode==='next_week'){start=now.setZone(zone).startOf('day').plus({days:8-now.setZone(zone).weekday});end=start.plus({days:7});}
 else if(r.mode==='rolling_7_days'){start=now.setZone(zone);end=start.plus({days:7});}
 else {if(!r.start_date||!r.end_date_exclusive)throw new Error('Custom range requires both dates');start=DateTime.fromISO(r.start_date,{zone});end=DateTime.fromISO(r.end_date_exclusive,{zone});}
 if(!start.isValid||!end.isValid||end<=start||end.diff(start,'days').days>31)throw new Error('Range must be positive and at most 31 local days');
 return {start,end};
}
export function calendarAt(d){
 const l=lunar.Solar.fromYmdHms(d.year,d.month,d.day,d.hour,d.minute,d.second).getLunar();
 return {day_ganzhi:l.getDayInGanZhi(),officer:l.getZhiXing(),day_spirit:l.getDayTianShen(),hour_ganzhi:l.getTimeInGanZhi(),
 hour_spirit:l.getTimeTianShen(),hour_luck:l.getTimeTianShenLuck(),xi_direction:l.getDayPositionXiDesc(),source_id:'lunar-1.7.7'};
}
const periodKey=d=>d.toISODate()+':'+Math.floor((d.hour+1)/2);
export function culturalResult(input){
 const c=input.cultural??{},action=c.action??'interpret_text';
 if(action==='continue_reading'){
  const r=c.reading;if(!r||r.method!=='supplied-six-lines-v1'||!Array.isArray(r.input_lines))throw new Error('A supported saved reading is required');
  return culturalResult({mode:'cultural',cultural:{action:'cast',lines:r.input_lines}});
 }
 if(action==='cast'){
  if(!c.lines||c.lines.length!==6||c.lines.some(v=>![6,7,8,9].includes(v)))throw new Error('Supply six line values 6/7/8/9, bottom to top');
  const original=c.lines.map(v=>v%2),moving=c.lines.flatMap((v,i)=>v===6||v===9?[i+1]:[]);
  return {reading_id:'reading-'+hash(c.lines),method:'supplied-six-lines-v1',input_lines:c.lines,original_bottom_to_top:original,
   changed_bottom_to_top:original.map((v,i)=>moving.includes(i+1)?1-v:v),moving_lines:moving,
   note:'User-supplied line recording and mechanical transformation only; no random casting or full 64-hexagram interpretation.'};
 }
 const e=excerpts.find(x=>x.id===c.excerpt_id)??(!c.excerpt_id?excerpts.find(x=>x.stage===(input.project?.stage??'unknown')):null);
 if(!e)throw new Error('Excerpt is not in the verified local collection');
 return {reading_id:'reading-'+hash(e.id),action:'interpret_text',...e};
}
export function recommend(input){
 const p=validateInput(input),now=input.now?instant(input.now):DateTime.utc();
 const base={schema_version:'1.1',mode:input.mode,run_id:randomUUID(),generated_at:iso(now),status:'ok',recommendations:[],
 assumptions:[],missing_inputs:[],excluded_summary:[],sources,versions:{skill:softwareVersion,lunar:'1.7.7',ruleset:'local-cultural-v1'},
 notice:'Traditional timing and direction are cultural references, not acceptance probabilities.'};
 if(input.mode==='cultural')return {...base,cultural_result:culturalResult(input)};
 const {start,end}=resolveRange(input,now),deadline=input.deadline?.at?instant(input.deadline.at):null;
 const r={...base,timezone:input.timezone,project_summary:input.project,resolved_range:{start:iso(start),end:iso(end)},
 readiness:input.readiness,preferences:p,cultural_result:culturalResult({mode:'cultural',project:input.project}),capabilities:{}};
 const cultural=input.tradition?.enabled!==false&&input.timezone==='Asia/Shanghai';
 const academic=input.academic_timing;
 if(academic)r.timing_policy={explanation:'先检查准备、截止与可用时间，再按适用学术依据和文化偏好排序。',principle:'玄学提供仪式感，科学提供优先级',...academic,order:'准备与截止 → 截止余量 → 已核验学术偏好 → 用户时段偏好 → 周易与星座文化参考'};
 r.capabilities={calendar:cultural?'available':input.tradition?.enabled===false?'disabled':'unavailable_for_timezone',qimen:'unavailable',bazi:'unavailable',true_solar_time:'unavailable',reminders:'host_only'};
 if(!input.availability)r.assumptions.push('Default local availability: 09:00–18:00, including weekends.');
 r.assumptions.push('Final-operation duration and click offset are editable scheduling preferences.');
 if(!input.deadline||input.deadline.status==='unknown')r.missing_inputs.push('deadline');
 if(input.readiness.status!=='ready')r.missing_inputs.push('readiness');
 if(!cultural&&input.tradition?.enabled!==false)r.missing_inputs.push('calendar');
 const fail=reason=>{r.status='no_candidates';r.excluded_summary=[{reason,count:1}];return r;};
 if(input.readiness.status==='blocked')return fail('readiness_blocked');
 if(p.strict_traditional&&!cultural&&!academic)return fail('strict_traditional_engine_unavailable');
 if(end<=now)return fail('range_expired');
 const ready=input.readiness.ready_after?instant(input.readiness.ready_after):null;
 const available=(input.availability??[]).map(x=>[instant(x.start),instant(x.end)]);
 const excluded=(input.excluded_intervals??[]).map(x=>[instant(x.start),instant(x.end)]);
 const all=[],counts={};const reject=code=>counts[code]=(counts[code]??0)+1;
 for(let day=start.startOf('day');day<end;day=day.plus({days:1})){
  for(let minute=0;minute<1440;minute+=5){
   const hh=Math.floor(minute/60),mm=minute%60,wall=day.set({hour:hh,minute:mm,second:0,millisecond:0});
   if(wall.hour!==hh||wall.minute!==mm)continue;
   for(const s of wall.getPossibleOffsets()){
    const e=s.plus({minutes:p.operation_minutes}),click=s.plus({minutes:p.click_offset_minutes});
    if(s<start||e>end||s<now)continue;
    if(ready&&s<ready){reject('not_ready_yet');continue;}
    if(deadline&&e>=deadline){reject('deadline');continue;}
    const margin=deadline?deadline.diff(e,'minutes').minutes:null,bufferMet=deadline?margin>=p.buffer_hours*60:null;
    if(deadline&&p.buffer_mode==='hard'&&!bufferMet){reject('hard_buffer');continue;}
    const fits=input.availability!==undefined?available.some(([a,b])=>s>=a&&e<=b):(s.hour>=9&&e<=day.set({hour:18,minute:0,second:0,millisecond:0}));
    if(!fits){reject('availability');continue;}
    if(excluded.some(([a,b])=>s<b&&e>a)){reject('excluded_interval');continue;}
    let cal=null,rank=0;
    if(cultural){
     if(periodKey(s)!==periodKey(e.minus({milliseconds:1}))){reject('traditional_period_boundary');continue;}
     cal=calendarAt(click);rank=({'成':3,'开':2,'收':1}[cal.officer]??0)*2+(cal.hour_luck==='吉'?1:0);
     if(p.strict_traditional&&!academic&&!(rank>=3&&cal.hour_luck==='吉')){reject('strict_traditional');continue;}
    }
    const key=hash([iso(s),iso(e),input.timezone]);
    const zodiac=input.astrology?.enabled===false?null:zodiacTimingAt(iso(click),input.astrology?.personal_sign);
    const academicMatch=academic?academic.preferred_weekdays.includes(click.setZone(academic.timezone).weekday):false;
    all.push({candidate_id:key,local_date:s.toISODate(),start_utc:iso(s),end_utc:iso(e),click_at_utc:iso(click),local_start:s.toISO(),local_end:e.toISO(),local_click:click.toISO(),timezone:input.timezone,
     readiness_status:input.readiness.status==='ready'?'ready':'conditional',conditions:input.readiness.conditions??[],
     deadline_margin_minutes:margin,buffer_met:bufferMet,calendar_facts:cal,
     direction:cal?{name:cal.xi_direction,system:'日家喜神方位',usage:'facing',mapping_kind:'modern_analogy',source_id:'lunar-1.7.7',note:'Facing is a modern optional ritual, not Wenchang or Qimen.'}:null,
     practical_reasons:[{source_id:'config-v1',text:'Fits availability, operation duration and known deadlines.'}],
     cultural_reasons:cal?[{source_id:'local-cultural-v1',text:'Local cultural mapping: officer '+cal.officer+'; hour '+cal.hour_spirit+' '+cal.hour_luck}]:[],
     ...(zodiac?{zodiac_timing:zodiac}:{}),
     ...(academic?{academic_timing:{matched:academicMatch,reason:academicMatch?'符合目标期刊的已核验投稿时段偏好。':'当前可用范围内保留的备选时段，未命中学术偏好。',source_url:academic.evidence.source_url}}:{}),
     sort_factors:{buffer:bufferMet===false?0:1,academic:academicMatch?1:0,preference:p.preferred_hours?.includes(click.hour)?1:0,cultural:rank,zodiac:zodiac?.score??0}});
   }
  }
 }
 all.sort((a,b)=>b.sort_factors.buffer-a.sort_factors.buffer||b.sort_factors.academic-a.sort_factors.academic||b.sort_factors.preference-a.sort_factors.preference||b.sort_factors.cultural-a.sort_factors.cultural||b.sort_factors.zodiac-a.sort_factors.zodiac||a.start_utc.localeCompare(b.start_utc));
 const selected=[],dates=new Set();
 for(const c of all)if(!dates.has(c.local_date)&&selected.length<p.count){selected.push(c);dates.add(c.local_date);}
 for(const c of all)if(selected.length<p.count&&!selected.some(x=>x.candidate_id===c.candidate_id||c.start_utc<x.end_utc&&c.end_utc>x.start_utc))selected.push(c);
 r.recommendations=selected.map((c,i)=>({...c,rank:i+1,...(input.astrology?.enabled===false?{}:{astrology:astrologyAt(c.click_at_utc,input.astrology?.personal_sign)})}));r.excluded_summary=Object.entries(counts).map(([reason,count])=>({reason,count}));
 r.status=!selected.length?'no_candidates':!cultural&&input.tradition?.enabled!==false?'degraded':r.missing_inputs.length?'conditional':'ok';
 if(academic){
  const overridden=selected.some(c=>c.academic_timing.matched&&all.some(other=>!other.academic_timing.matched&&other.sort_factors.buffer===c.sort_factors.buffer&&(other.sort_factors.cultural>c.sort_factors.cultural||other.sort_factors.zodiac>c.sort_factors.zodiac)));
  r.timing_policy.explanation=overridden?'本次存在文化择时更优、但未命中学术偏好的时段，已优先选择符合目标期刊学术依据的窗口。':'本次已将目标期刊的已核验学术偏好排在文化择时之前。';
  if(p.strict_traditional)r.timing_policy.explanation+=' 严格择吉本轮作为偏好处理，避免排除符合学术依据的可用时间。';
 }
 return r;
}
export function compare(report,a,b){
 const x=report.recommendations.find(c=>c.candidate_id===a),y=report.recommendations.find(c=>c.candidate_id===b);
 if(!x||!y)throw new Error('Unknown candidate');
 return {candidate_ids:[a,b],factors:['buffer','academic','preference','cultural','zodiac'].map(key=>({key,a:x.sort_factors[key],b:y.sort_factors[key],equal:x.sort_factors[key]===y.sort_factors[key]})),deadline_margin_minutes:[x.deadline_margin_minutes,y.deadline_margin_minutes],note:'Ordered factors; cultural rank is not a probability.'};
}
