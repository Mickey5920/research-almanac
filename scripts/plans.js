import {randomUUID} from 'node:crypto';
import {DateTime} from 'luxon';
import {instant,recommend,validateInput,hash,resolveRange} from './core.js';
export function selectPlan(report,candidateId){
 const candidate=report.recommendations.find(c=>c.candidate_id===candidateId);
 if(!candidate)throw new Error('Candidate not found');
 return {plan_id:randomUUID(),revision:1,state:'selected',run_id:report.run_id,candidate,resolved_range:report.resolved_range,project:report.project_summary,versions:report.versions,history:[],reminder:{status:'not_requested'},submission:null};
}
export function amendInput(input,patch){
 const allowed=['availability','excluded_intervals','preferences','readiness','deadline','range','tradition','timezone'];
 if(Object.keys(patch).some(k=>!allowed.includes(k)))throw new Error('Unsupported patch field');
 const next=structuredClone(input);
 for(const [k,v] of Object.entries(patch))next[k]=k==='preferences'||k==='tradition'?{...next[k],...v}:v;
 validateInput(next);return {input:next,changes:Object.keys(patch).map(k=>({field:k,before:input[k]??null,after:next[k]}))};
}
export function reviewPlan(plan,input,now=DateTime.utc().toISO()){
 if(['submitted','superseded'].includes(plan.state))return structuredClone(plan);
 const next=structuredClone(plan);delete next.proposed_candidate;let state='needs_review',reason='availability_or_conditions_require_review';
 if(instant(plan.candidate.end_utc)<=instant(now)){state='invalidated';reason='window_expired';}
 else if(input){
  validateInput(input);
  const requested=input.range?.mode==='custom'||!plan.resolved_range?resolveRange(input,instant(now)):{start:instant(plan.resolved_range.start),end:instant(plan.resolved_range.end)};
  const inRange=instant(plan.candidate.start_utc)>=requested.start&&instant(plan.candidate.end_utc)<=requested.end;
  const checked=structuredClone(input);checked.now=now;
  checked.range={mode:'custom',start_date:plan.candidate.local_date,end_date_exclusive:instant(plan.candidate.local_start).plus({days:1}).toISODate()};
  checked.availability=[{start:plan.candidate.start_utc,end:plan.candidate.end_utc}].filter(x=>(input.availability??[x]).some(a=>instant(x.start)>=instant(a.start)&&instant(x.end)<=instant(a.end)));
  const report=recommend(checked),same=report.recommendations.find(c=>c.candidate_id===plan.candidate.candidate_id);
  if(same&&inRange){state=report.missing_inputs.length?'needs_review':'selected';reason='window_rechecked';
   next.candidate={...plan.candidate,readiness_status:same.readiness_status,conditions:same.conditions,buffer_met:same.buffer_met,deadline_margin_minutes:same.deadline_margin_minutes};
   if(same.click_at_utc!==plan.candidate.click_at_utc||hash(same.calendar_facts)!==hash(plan.candidate.calendar_facts)){state='needs_review';reason='calculation_changed';next.proposed_candidate=same;}
  }
  else {state='invalidated';reason='constraints_no_longer_satisfied';}
  if(input.project?.manuscript_version!==plan.project?.manuscript_version&&state==='selected'){state='needs_review';reason='manuscript_version_changed';}
 }
 next.state=state;next.last_checked_at=now;
 if(state!==plan.state||hash(next.candidate)!==hash(plan.candidate)||hash(next.proposed_candidate??null)!==hash(plan.proposed_candidate??null)){next.revision++;next.history.push({at:now,from:plan.state,to:state,reason});}
 if(['invalidated','needs_review'].includes(state)&&next.reminder.status==='scheduled')next.reminder.status='update_pending';
 return next;
}
export function recordSubmission(plan,record){
 if(record.confirmed!==true)throw new Error('Explicit boolean confirmation is required');
 const allowed=['confirmed','actual_clicked_at','server_confirmed_at','manuscript_version','receipt_ref'];
 if(Object.keys(record).some(x=>!allowed.includes(x)))throw new Error('Unsupported submission field');
 for(const k of ['actual_clicked_at','server_confirmed_at'])if(record[k])instant(record[k]);
 const signature=hash(record);if(plan.submission?.signature===signature)return structuredClone(plan);
 const next=structuredClone(plan);next.revision++;next.state='submitted';
 next.history.push({at:DateTime.utc().toISO(),action:plan.submission?'submission_corrected':'submission_confirmed',prior:plan.submission});
 next.submission={...record,signature,time_source:'user_supplied',reported_at:DateTime.utc().toISO()};
 if(next.reminder.status==='scheduled')next.reminder.status='update_pending';
 return next;
}
export function backplan(tasks,finishAt,availability,now=DateTime.utc().toISO()){
 const map=new Map(tasks.map(t=>[t.id,t]));if(map.size!==tasks.length)throw new Error('Duplicate task id');
 const visiting=new Set(),seen=new Set(),ordered=[];
 function visit(t){if(visiting.has(t.id))throw new Error('Cyclic task dependency');if(seen.has(t.id))return;visiting.add(t.id);
 for(const id of t.depends_on??[]){if(!map.has(id))throw new Error('Missing dependency');visit(map.get(id));}
 visiting.delete(t.id);seen.add(t.id);ordered.push(t);}
 tasks.forEach(visit);
 if(tasks.some(t=>t.status!=='done'&&(!Number.isInteger(t.minutes)||t.minutes<=0)))return {status:'needs_estimates',tasks};
 const spans=availability.map(x=>[instant(x.start),instant(x.end)]).sort((a,b)=>a[0]-b[0]);
 for(let i=0;i<spans.length;i++){if(spans[i][1]<=spans[i][0])throw new Error('Invalid task interval');if(i&&spans[i][0]<spans[i-1][1])throw new Error('Overlapping task intervals');}
 let cursor=instant(finishAt);const result=[];
 for(const t of ordered.reverse()){
  if(t.status==='done')continue;let fitted=null;
  for(const [a,b] of [...spans].reverse()){
   const end=b<cursor?b:cursor,start=end.minus({minutes:t.minutes});
   if(start>=a&&start>=instant(now)){fitted={id:t.id,start:start.toISO(),end:end.toISO(),status:'planned',estimate_source:t.estimate_source??'user_supplied'};cursor=start;break;}
  }
  if(!fitted)return {status:'insufficient_time',scheduled:result.reverse(),unscheduled_task:t.id};
  result.push(fitted);
 }
 return {status:'planned',schedule:result.reverse(),note:'Conservative single-person schedule; tasks are not marked completed.'};
}
