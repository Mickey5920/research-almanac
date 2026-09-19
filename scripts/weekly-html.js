import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {HistoryStore} from './history-store.js';
import {renderSubmissionHistoryHtml,defaultHistoryDir} from './report-html.js';
import {baguaForDirection} from './bagua.js';
import {render as renderSubmission,exportIcs} from './render.js';
const safe=x=>String(x??'').replace(/[|<>\r\n]/g,' ');

export async function renderWeeklyHistoryHtml({records,warnings=[],current_record_id=null}){
 const [html,css,js,art]=await Promise.all([
  readFile(new URL('../web/weekly.html',import.meta.url),'utf8'),readFile(new URL('../web/weekly.css',import.meta.url),'utf8'),
  readFile(new URL('../web/weekly.js',import.meta.url),'utf8'),readFile(new URL('../assets/interface/celestial-page-v1.png',import.meta.url))]);
 const submissions=records.flatMap(r=>r.record_type==='weekly'?(r.report.submission?[{...r,record_type:'submission',input:r.report.submission.input,report:r.report.submission.report}]:[]):[r]);
 const decorated=records.map(r=>r.record_type==='weekly'?{...r,window_details:Object.fromEntries((r.report.submission?.report.recommendations??[]).map(c=>[c.candidate_id,{bagua:baguaForDirection(c.direction)}]))}:r);
 const submission_html=submissions.length?await renderSubmissionHistoryHtml({records:submissions,current_record_id}):null;
 const data=JSON.stringify({records:decorated,warnings,current_record_id,submission_html}).replace(/</g,'\\u003c');
 return html.replace('<!-- STYLE -->',()=>'<style>'+css+'</style>')
 .replace('<!-- ART -->',()=>'<img class="page-art" alt="" aria-hidden="true" src="data:image/png;base64,'+art.toString('base64')+'">')
 .replace('<!-- DATA -->',()=>'<script id="weekly-records" type="application/json">'+data+'</script>')
 .replace('<!-- SCRIPT -->',()=>'<script>'+js+'</script>');
}

export function renderWeeklyMarkdown(report,language='zh'){
 const zh=language==='zh',t=x=>typeof x==='string'?x:x?.[language]??'';
 const lines=['# '+(zh?'科研黄历 · 一周安排':'Research Almanac · Weekly Plan'),'',report.week_start+' — '+report.week_end+' · '+report.timezone,'',safe(report.title)];
 const p=report.personalization;
 if(p)lines.push('',(zh?'研究方向：':'Research areas: ')+p.fields.map(f=>safe(t(f.name))).join(' + '),(zh?'阶段：':'Stage: ')+t(p.stage.name),(zh?'方法：':'Methods: ')+p.methods.map(m=>t(m.name)).join(' / '),safe(p.focus));
 const focus=p?.week_focus??report.week_focus;
 if(focus){
  lines.push('','## '+(zh?'本周关注':'This week’s focus'),'',safe(t(focus.goal)));
  for(const [key,label] of [['priorities',zh?'重点目标':'Priorities'],['deliverables',zh?'建议产物':'Suggested outputs'],['questions',zh?'值得想清楚':'Questions to explore']])lines.push('','### '+label,...focus[key].map(x=>'- '+safe(t(x))));
  if(focus.action_map.length)lines.push('','### '+(zh?'本周操作分布':'Activities across the week'),...focus.action_map.map(a=>'- '+safe(t(a.name))+' · '+a.dates.join(' / ')));
 }
 for(const [i,d] of report.days.entries()){
  lines.push('','## '+d.date+' · '+t(d.theme),'',t(d.hint),'');
  const tasks=p?p.week[i].tracks:report.disciplines.map(s=>({name:s.name,...s.week[i]}));
  if(p)lines.push('**'+(zh?'本阶段主线':'Stage focus')+'** · '+t(p.week[i].stage_focus),'');
  for(const task of tasks){
   lines.push('### '+safe(t(task.name))+' · '+t(task.title),'',safe(t(task.action)),'',(zh?'产物：':'Output: ')+safe(t(task.output)));
   for(const activity of task.operations??[])lines.push('','#### '+safe(t(activity.title)),...activity.steps.map((step,i)=>(i+1)+'. '+safe(t(step))),(zh?'产物：':'Output: ')+safe(t(activity.output)),(zh?'核查：':'Check: ')+safe(t(activity.check)));
   if(task.steps)lines.push('',...task.steps.map((s,i)=>(i+1)+'. '+safe(t(s))),'',(zh?'核查：':'Check: ')+safe(t(task.checkpoint)),(zh?'轻量版本：':'Smallest step: ')+safe(t(task.minimum)),(zh?'卡住时：':'When blocked: ')+safe(t(task.blocked)),(zh?'有余力时：':'If capacity remains: ')+safe(t(task.extension)),'');
  }
  if(p){
   for(const m of p.week[i].methods)lines.push('- **'+t(m.name)+'**: '+t(m.action)+' → '+t(m.output));
   if(p.week[i].integration)lines.push('',(zh?'交叉衔接：':'Integration: ')+safe(t(p.week[i].integration)));
  }
  const rhythm=(p?p.week[i].rhythm:d.rhythm)[language];lines.push('','**'+(zh?'今日节奏':'Daily rhythm')+' · '+rhythm.title+'**',...rhythm.blocks.map(b=>'- '+b.time+' · '+b.title+' · '+b.detail));
  for(const task of report.schedule.filter(x=>x.start.startsWith(d.date)))lines.push('- '+(zh?'项目任务':'Project task')+': '+safe(task.title)+' · '+task.start+' → '+task.end);
  lines.push('','> '+d.classic.quote,'',zh?d.classic.meaning:d.classic.meaning_en,'',t(d.classic.reflection),'','['+d.classic.source.title+']('+d.classic.source.url+') · '+d.classic.quote_locator);
 }
 if(report.unscheduled.length)lines.push('','## '+(zh?'待安排事项':'Tasks to arrange'),...report.unscheduled.map(t=>'- '+safe(t.title)+' · '+t.reason));
 if(report.submission)lines.push('','---','',renderSubmission(report.submission.report,language));
 lines.push('','## '+(zh?'安排依据':'Planning basis'),...report.assumptions.map(a=>'- '+t(a)),...report.sources.map(s=>'- ['+(zh?s.title:s.title_en??s.title)+']('+s.url+')'),'',zh?'玄学提供仪式感，科学提供优先级。':'Tradition offers ritual; science sets priorities.');
 return lines.join('\n')+'\n';
}

export async function publishWeeklyReport(input,report,outDir,historyDir=defaultHistoryDir){
 const store=new HistoryStore(historyDir),record=await store.add({input,report,source:'agent',record_type:'weekly'});
 const history=await store.list();
 for(const [name,value] of [['input.json',input],['weekly.json',report],['record.json',record]])await writeFile(join(outDir,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
 await writeFile(join(outDir,'report.html'),await renderWeeklyHistoryHtml({...history,current_record_id:record.record_id}),{flag:'wx'});
 for(const [name,lang] of [['report.md','zh'],['report.en.md','en']])await writeFile(join(outDir,name),renderWeeklyMarkdown(report,lang),{flag:'wx'});
 if(report.submission){
  await writeFile(join(outDir,'submission.json'),JSON.stringify(report.submission.report,null,2)+'\n',{flag:'wx'});
  await writeFile(join(outDir,'submission.html'),await renderSubmissionHistoryHtml({records:[{...record,input:report.submission.input,report:report.submission.report}],current_record_id:record.record_id}),{flag:'wx'});
  if(report.submission.report.recommendations.length)await writeFile(join(outDir,'submission-windows.ics'),exportIcs(report.submission.report),{flag:'wx'});
 }
 return record;
}
