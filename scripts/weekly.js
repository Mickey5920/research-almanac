import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {DateTime,IANAZone} from 'luxon';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import lunar from 'lunar-javascript';
import {instant,recommend,validateInput} from './core.js';
import {validateReport} from './validate-report.js';
import {baguaLibrary} from './bagua.js';
import {buildResearchProfile,validateResearchProfile,validatePersonalizedReport,enrichTask,profileCatalog} from './research-profile.js';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const routines=read('../data/research-routines.json'),holidays=read('../data/holidays-cn-2026.json');
const version=read('../package.json').version;
const ajv=new Ajv({allErrors:true,strict:false});addFormats(ajv);
const inputCheck=ajv.compile(read('../schemas/weekly-input.schema.json'));
const outputCheck=ajv.compile(read('../schemas/weekly-output.schema.json'));
const bilingual=(zh,en)=>({zh,en});
const ms=x=>+instant(x);
const interval=x=>[ms(x.start),ms(x.end)];
const stamp=(x,zone)=>DateTime.fromMillis(x,{zone}).toISO();
const sameDay=(x,zone)=>DateTime.fromMillis(x,{zone}).toISODate();

export function validateWeeklyInput(input){
 if(!inputCheck(input))throw Error('Invalid weekly input: '+ajv.errorsText(inputCheck.errors));
 validateResearchProfile(input.research_profile);
 if(!IANAZone.isValidZone(input.timezone))throw Error('Unknown IANA timezone');
 if(input.week_start){const d=DateTime.fromISO(input.week_start,{zone:input.timezone});if(!d.isValid||d.weekday!==1)throw Error('week_start must be a valid Monday');}
 for(const x of [...(input.availability??[]),...(input.excluded_intervals??[]),...(input.fixed_events??[])])if(ms(x.start)>=ms(x.end))throw Error('Invalid weekly interval order');
 const tasks=input.tasks??[],map=new Map(tasks.map(t=>[t.id,t]));
 if(map.size!==tasks.length)throw Error('Duplicate weekly task id');
 const visiting=new Set(),seen=new Set();
 function visit(t){
  if(visiting.has(t.id))throw Error('Cyclic weekly task dependency');if(seen.has(t.id))return;
  visiting.add(t.id);
  for(const id of t.depends_on??[]){if(!map.has(id))throw Error('Missing task dependency: '+id);visit(map.get(id));}
  visiting.delete(t.id);seen.add(t.id);
  if(t.deadline&&t.not_before&&ms(t.deadline)<=ms(t.not_before))throw Error('Task deadline precedes its earliest start');
 }
 tasks.forEach(visit);
 for(const id of input.submission_task_ids??[])if(!map.has(id))throw Error('Unknown submission preparation task: '+id);
 if(input.submission){
  validateInput(input.submission);
  if(input.submission.mode!=='project')throw Error('Weekly submission must use project mode');
  if(input.submission.timezone!==input.timezone)throw Error('Weekly and submission timezone must match');
 }else if(input.submission_task_ids?.length)throw Error('Submission preparation ids require submission input');
 return true;
}

function merge(spans){
 const out=[];
 for(const [a,b] of spans.filter(([a,b])=>b>a).sort((x,y)=>x[0]-y[0])){
  const last=out.at(-1);if(last&&a<=last[1])last[1]=Math.max(b,last[1]);else out.push([a,b]);
 }
 return out;
}
function subtract(spans,blocks){
 let out=spans.map(s=>[...s]);
 for(const [a,b] of blocks)out=out.flatMap(([s,e])=>e<=a||s>=b?[[s,e]]:[[s,Math.min(e,a)],[Math.max(s,b),e]].filter(([x,y])=>y>x));
 return out;
}
function daySpans(spans,days,zone){
 return days.flatMap(d=>{
  const a=DateTime.fromISO(d.date,{zone}),b=a.plus({days:1});
  return spans.map(([s,e])=>[Math.max(s,+a),Math.min(e,+b)]).filter(([s,e])=>e>s);
 });
}

function scheduleTasks(input,spans,now){
 const zone=input.timezone,free=spans.map(s=>[...s]),scheduled=[],unscheduled=[],counts=new Map();
 const tasks=input.tasks??[],resolved=new Set(tasks.filter(t=>t.status==='done').map(t=>t.id));
 const failed=new Set(),finish=new Map(),pending=tasks.filter(t=>t.status!=='done');
 while(pending.length){
  const ready=pending.filter(t=>(t.depends_on??[]).every(id=>resolved.has(id)||failed.has(id))).sort((a,b)=>(a.deadline?ms(a.deadline):Infinity)-(b.deadline?ms(b.deadline):Infinity)||(a.priority??2)-(b.priority??2));
  if(!ready.length)throw Error('Unresolved task dependency');
  const t=ready[0];pending.splice(pending.indexOf(t),1);let reason=null,fit=null;
  const deps=t.depends_on??[];
  if(deps.some(id=>failed.has(id)))reason='dependency_unavailable';
  else if(!t.minutes)reason='needs_estimate';
  else{
   const after=Math.max(+now,t.not_before?ms(t.not_before):0,...deps.map(id=>finish.get(id)??0));
   for(let i=0;i<free.length;i++){
    const [a,b]=free[i],start=Math.max(a,after),end=start+t.minutes*60000,date=sameDay(start,zone);
    if(end>b||t.deadline&&end>ms(t.deadline)||(counts.get(date)??0)>=(input.preferences?.max_tasks_per_day??3))continue;
    fit={...structuredClone(t),minutes:t.minutes,start:stamp(start,zone),end:stamp(end,zone),status:'planned'};
    free.splice(i,1,...[[a,start],[end,b]].filter(([s,e])=>e>s));finish.set(t.id,end);counts.set(date,(counts.get(date)??0)+1);break;
   }
   if(!fit)reason='no_feasible_slot';
  }
  if(fit){scheduled.push(fit);resolved.add(t.id);}else{unscheduled.push({...structuredClone(t),reason});failed.add(t.id);}
 }
 return {scheduled:scheduled.sort((a,b)=>ms(a.start)-ms(b.start)),unscheduled};
}

export function weekly(input){
 validateWeeklyInput(input);
 const zone=input.timezone,now=input.now?instant(input.now):DateTime.utc();
 const today=now.setZone(zone).startOf('day');
 const start=input.week_start?DateTime.fromISO(input.week_start,{zone}):today.plus({days:8-today.weekday});
 const end=start.plus({days:7});
 const calendar=zone==='Asia/Shanghai';
 const region=input.region??(calendar?'CN-mainland':'none');
 const days=Array.from({length:7},(_,i)=>{
  const d=start.plus({days:i}),date=d.toISODate();
  const h=region==='CN-mainland'&&d.year===2026?holidays.breaks.find(h=>date>=h.start&&date<=h.end):null;
  const makeup=region==='CN-mainland'&&holidays.working_weekends.includes(date);
  const facts=calendar?lunar.Solar.fromYmd(d.year,d.month,d.day).getLunar():null;
  return {date,weekday:d.weekday,working:makeup||(!h&&d.weekday<6),holiday:h?.name??null,makeup,
   calendar:facts?{ganzhi:facts.getDayInGanZhi(),lunar:facts.getMonthInChinese()+'月'+facts.getDayInChinese(),officer:facts.getZhiXing(),term:facts.getJieQi(),festivals:facts.getFestivals(),source_id:'lunar-1.7.7'}:null};
 });
 const count=days.filter(d=>d.working).length;let workIndex=0;
 const phases=count===1?[3]:count===2?[0,3]:count===3?[0,1,3]:count===4?[0,1,2,3]:[0,1,2,7,3,1,3];
 for(let i=0;i<7;i++){
  const d=days[i],phase=d.working?phases[workIndex++]:i===6||days[i+1]?.working?6:days[i-1]&&!days[i-1].working?5:4;
  const p=routines.phases[phase],trigram=baguaLibrary.trigrams.find(t=>t.name===p.trigram);
  Object.assign(d,{phase,theme:p.theme,tag:p.tag,hint:p.hint,deliverable:p.deliverable,
   rhythm:{id:'general-'+d.date,date:d.date,...structuredClone(p.rhythm)},
   classic:{...structuredClone(trigram),source:baguaLibrary.source,reflection:p.hint,selection:'workflow-theme'}});
 }
 const disciplines=routines.disciplines.map(s=>({id:s.id,name:s.name,icon:s.icon,color:s.color,scope:s.scope,goal:s.goal,
  week:days.map(d=>enrichTask(s.tasks[d.phase],d.phase)),
  rhythms:days.map(d=>({id:s.id+'-'+d.date,date:d.date,...structuredClone(s.rhythms[d.phase])}))}));
 const availability=input.availability!==undefined?input.availability.map(interval):days.filter(d=>d.working).flatMap(d=>{
  const x=DateTime.fromISO(d.date,{zone});return [[+x.set({hour:9}),+x.set({hour:12})],[+x.set({hour:14}),+x.set({hour:17})]];
 });
 const fixed=(input.fixed_events??[]).filter(e=>ms(e.start)<+end&&ms(e.end)>+start);
 const blocked=[...(input.excluded_intervals??[]),...fixed].map(interval);
 const available=daySpans(subtract(merge(availability),blocked).map(([a,b])=>[Math.max(a,+start,+now),Math.min(b,+end)]).filter(([a,b])=>b>a),days,zone);
 // Preserve a daily planning buffer; it is not an unavailable appointment.
 const buffer=input.preferences?.buffer_ratio??0.2;
 const taskSpans=days.flatMap(d=>{
  const spans=available.filter(([a])=>sameDay(a,zone)===d.date);let budget=Math.floor(spans.reduce((n,[a,b])=>n+b-a,0)*(1-buffer)/60000)*60000;
  return spans.map(([a,b])=>{const used=Math.min(b-a,budget);budget-=used;return [a,a+used];}).filter(([a,b])=>b>a);
 });
 const plan=scheduleTasks(input,taskSpans,now);
 let submission=null;
 if(input.submission){
  const supplied=structuredClone(input.submission),effective={...supplied,now:now.toUTC().toISO(),range:{mode:'custom',start_date:start.toISODate(),end_date_exclusive:end.toISODate()}};
  let free=subtract(available,plan.scheduled.map(interval));
  if(supplied.availability!==undefined)free=merge(free.flatMap(([a,b])=>supplied.availability.map(interval).map(([s,e])=>[Math.max(a,s),Math.min(b,e)]).filter(([s,e])=>e>s)));
  effective.availability=free.map(([a,b])=>({start:stamp(a,zone),end:stamp(b,zone)}));
  const required=(input.submission_task_ids??[]).filter(id=>input.tasks.find(t=>t.id===id).status!=='done');
  if(required.length){
   effective.readiness=structuredClone(supplied.readiness);
   if(required.some(id=>plan.unscheduled.some(t=>t.id===id)))effective.readiness.status='blocked';
   else{
    const after=Math.max(...required.map(id=>ms(plan.scheduled.find(t=>t.id===id).end)),supplied.readiness.ready_after?ms(supplied.readiness.ready_after):0);
    effective.readiness.ready_after=stamp(after,zone);
    if(effective.readiness.status!=='blocked')effective.readiness.status='conditional';
   }
   effective.readiness.conditions=[...(effective.readiness.conditions??[]),...required.map(id=>'完成准备任务 / Complete preparation: '+input.tasks.find(t=>t.id===id).title)];
  }
  const report=recommend(effective);validateReport(report);
  submission={input:effective,report};
 }
 const assumptions=[bilingual('各学科行动与今日节奏是工作流程建议；经典按主题选读。','Discipline actions and daily rhythms are workflow suggestions; classical passages are selected by theme.'),
  bilingual('任务采用单人顺序排程，不拆分跨日；预留 '+Math.round(buffer*100)+'% 日程缓冲，每日最多 '+(input.preferences?.max_tasks_per_day??3)+' 项。','Tasks use a sequential, single-person schedule without overnight splits; '+Math.round(buffer*100)+'% daily buffer and at most '+(input.preferences?.max_tasks_per_day??3)+' tasks per day.')];
 if(input.availability===undefined)assumptions.push(bilingual('默认可用时间：当地工作日 09:00–12:00、14:00–17:00；可在 Agent 中调整。','Default availability: local workdays 09:00–12:00 and 14:00–17:00; adjust in the Agent conversation.'));
 if(region==='CN-mainland'&&days.some(d=>!d.date.startsWith('2026-')))assumptions.push(bilingual('当前只保存了 2026 年中国大陆假期表；其他年份先按周一至周五安排，可提供真实可用时段。','Only the 2026 mainland China holiday table is saved; other years use Monday–Friday until you supply actual availability.'));
 const sources=[{title:'lunar-javascript 1.7.7',title_en:'lunar-javascript 1.7.7',url:'https://github.com/6tail/lunar-javascript',kind:'calendar'},
  {...baguaLibrary.source,title_en:'Zhouyi · Shuogua',kind:'classical'}];
 if(region==='CN-mainland'&&days.some(d=>d.date.startsWith('2026-')))sources.unshift(holidays.source);
 const personalization=buildResearchProfile(input,days);
 if(personalization){
  sources.push(structuredClone(profileCatalog.source));
  assumptions.push(bilingual('研究方向、方法与阶段建议来自本地工作库；14 门类用于检索，自填专业保留原文。建议未自动写入项目日程。','Direction, method and stage suggestions come from the local workflow library; 14 categories support lookup and custom field names retain their original text. Suggestions are not automatically booked as project tasks.'));
 }
 const report={schema_version:'weekly-1.0',mode:'weekly',run_id:randomUUID(),generated_at:now.toUTC().toISO(),version,timezone:zone,
  week_start:start.toISODate(),week_end:end.minus({days:1}).toISODate(),title:input.title??'',discipline:input.discipline??'all',language:input.preferences?.language??'zh',
  calendar_status:calendar?'available':'unavailable_for_timezone',days,disciplines,schedule:plan.scheduled,unscheduled:plan.unscheduled,fixed_events:structuredClone(fixed),sources,assumptions,submission,
  ...(personalization?{personalization}:{})};
 validateWeeklyReport(report);return report;
}

export function validateWeeklyReport(r){
 if(!outputCheck(r))throw Error('Invalid weekly report: '+ajv.errorsText(outputCheck.errors));
 if(!IANAZone.isValidZone(r.timezone))throw Error('Unknown weekly report timezone');
 const start=DateTime.fromISO(r.week_start,{zone:r.timezone});
 if(start.weekday!==1||start.plus({days:6}).toISODate()!==r.week_end)throw Error('Invalid weekly report range');
 const text=x=>typeof x==='string';
 const bi=x=>x&&text(x.zh)&&text(x.en);
 const rhythm=(x,date,id)=>{
  if(!x||x.date!==date||x.id!==id)throw Error('Invalid saved rhythm identity');
  for(const lang of ['zh','en']){
   const v=x[lang];
   if(!v||!['title','flow','icon','pause','note'].every(k=>text(v[k]))||!text(v.mini?.label)||!text(v.mini?.text)||!Array.isArray(v.blocks)||v.blocks.length!==3||v.blocks.some(b=>!['time','title','detail','kind'].every(k=>text(b?.[k]))))throw Error('Invalid saved rhythm');
  }
 };
 r.days.forEach((d,i)=>{
  if(d.date!==start.plus({days:i}).toISODate()||d.weekday!==i+1)throw Error('Weekly day mismatch');
  if(!['theme','tag','hint','deliverable'].every(k=>bi(d[k])))throw Error('Incomplete daily content');
  rhythm(d.rhythm,d.date,'general-'+d.date);
  const c=d.classic;
  if(!['id','name','symbol','quote','meaning','meaning_en','quote_locator'].every(k=>text(c[k]))||!text(c.source?.title)||!text(c.source?.url)||!bi(c.reflection))throw Error('Invalid classical reading');
 });
 const ids=routines.disciplines.map(s=>s.id);
 if(new Set(r.disciplines.map(s=>s.id)).size!==6||r.disciplines.some(s=>!ids.includes(s.id)))throw Error('Invalid discipline set');
 if(r.discipline!=='all'&&!ids.includes(r.discipline))throw Error('Unknown selected discipline');
 for(const s of r.disciplines){
  if(!bi(s.scope)||!bi(s.goal)||!text(s.color)||!text(s.icon))throw Error('Invalid discipline content');
  s.week.forEach((task,i)=>{
   if(!['title','action','output'].every(k=>bi(task?.[k])))throw Error('Invalid discipline task');
   if(task.steps&&(!Array.isArray(task.steps)||task.steps.length<2||!task.steps.every(bi)||!['checkpoint','minimum','blocked','extension','effort'].every(k=>bi(task[k]))))throw Error('Invalid detailed discipline task');
   rhythm(s.rhythms[i],r.days[i].date,s.id+'-'+r.days[i].date);
  });
 }
 validatePersonalizedReport(r.personalization,r.days);
 const scheduled=[...r.schedule].sort((a,b)=>ms(a.start)-ms(b.start));
 if(new Set(scheduled.map(t=>t.id)).size!==scheduled.length)throw Error('Duplicate scheduled task');
 for(const [i,t] of scheduled.entries()){
  if(ms(t.start)<+start||ms(t.end)>+start.plus({days:7})||ms(t.end)-ms(t.start)!==t.minutes*60000||sameDay(ms(t.start),r.timezone)!==sameDay(ms(t.end)-1,r.timezone))throw Error('Invalid task slot');
  if(i&&ms(t.start)<ms(scheduled[i-1].end))throw Error('Overlapping tasks');
  if(r.fixed_events.some(e=>ms(t.start)<ms(e.end)&&ms(t.end)>ms(e.start)))throw Error('Task overlaps fixed event');
 }
 for(const e of r.fixed_events)if(ms(e.start)>=ms(e.end))throw Error('Invalid fixed event');
 if(r.submission){
  validateInput(r.submission.input);validateReport(r.submission.report);
  if(r.submission.report.timezone!==r.timezone)throw Error('Submission timezone mismatch');
  for(const c of r.submission.report.recommendations){
   if(ms(c.start_utc)<+start||ms(c.end_utc)>+start.plus({days:7}))throw Error('Submission outside week');
   if([...scheduled,...r.fixed_events].some(e=>ms(c.start_utc)<ms(e.end)&&ms(c.end_utc)>ms(e.start)))throw Error('Submission conflicts with research');
  }
 }
 return true;
}
