(()=>{
'use strict';
const $=id=>document.getElementById(id),data=JSON.parse($('weekly-records').textContent);
const records=data.records;
let current=records.find(r=>r.record_id===data.current_record_id)??records.find(r=>r.record_type==='weekly')??records[0];
let lang=current?.report.language??'zh',dayIndex=0,view='day',selected=current?.report.discipline??'all',frame=null;
const e=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t=x=>typeof x==='string'?x:x?.[lang]??'';
const l=(zh,en)=>lang==='zh'?zh:en;
const date=s=>new Intl.DateTimeFormat(lang==='zh'?'zh-CN':'en-GB',{timeZone:current.report.timezone??'UTC',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(s));
const weekday=n=>(lang==='zh'?['周一','周二','周三','周四','周五','周六','周日']:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'])[n-1];
const term=s=>lang==='en'?({'秋分':'Autumn equinox','春分':'Spring equinox','夏至':'Summer solstice','冬至':'Winter solstice'}[s]??s):s;
function staticText(){
 document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.title=l('科研黄历 · 科研安排与投稿择日','Research Almanac · Research Planning & Submission Timing');
 document.querySelectorAll('[data-zh][data-en]').forEach(el=>el.textContent=el.dataset[lang]);
 for(const code of ['zh','en']){$('lang-'+code).setAttribute('aria-pressed',String(code===lang));$('lang-'+code).classList.toggle('active',code===lang);}
}
function label(r){return r.record_type==='weekly'?l('科研黄历','Almanac')+' · '+r.report.week_start+(r.report.title?' · '+r.report.title:''):l('投稿择日','Submission timing')+' · '+(r.report.project_summary?.title??l('周易文化解读','Yijing reflection'));}
function classic(c){
 return '<h3>'+e(c.symbol)+' '+l('经典选读 · ','Classical reading · ')+e(lang==='zh'?c.name+'卦':c.id.toUpperCase())+'</h3><blockquote>'+e(c.quote)+'</blockquote><p>'+e(lang==='zh'?c.meaning:c.meaning_en)+'</p><details data-key="classic-source"><summary>'+l('科研启示与原文出处','Reflection and source')+'</summary><p class="termnote">'+e(t(c.reflection))+'</p><p>'+e(c.source.title+' · '+c.quote_locator)+'</p><p>'+l('按当日工作主题编选；科研联系为现代解释。','Selected for the workflow theme; the research connection is a modern interpretation.')+'</p></details>';
}
function rhythm(plan){
 const r=plan[lang],colors={prepare:'#a17a38',focus:'#24776c',verify:'#477897',record:'#60875b',collaborate:'#af8550',rest:'#b99861',light:'#876e99',fixed:'#376b68'};
 return '<h3>'+e(r.icon)+' '+l('今日节奏 · ','Daily rhythm · ')+e(r.title)+'</h3><p class="rhythm-meta">'+e(r.flow)+'</p>'+r.blocks.map(b=>'<div class="rhythm-slot"><time>'+e(b.time)+'</time><div style="--slot-color:'+(colors[b.kind]??colors.focus)+'"><b>'+e(b.title)+'</b><span>'+e(b.detail)+'</span></div></div>').join('')+'<details class="rhythm-short" data-key="rhythm-mini"><summary>'+e(r.mini.label)+'</summary><p>'+e(r.mini.text)+'</p><p>'+e(r.pause)+'</p><p>'+e(r.note)+'</p></details>';
}
function syncFrame(){if(frame)frame.contentWindow?.postMessage({type:'select-saved-submission',record_id:current.record_id,language:lang},'*');}
function showFrame(slot){
 if(!data.submission_html)return;
 if(!frame){frame=document.createElement('iframe');frame.id='saved-submission';frame.title='Saved submission report';frame.setAttribute('sandbox','allow-scripts allow-downloads allow-popups');frame.srcdoc=data.submission_html;frame.addEventListener('load',syncFrame);}
 if(frame.parentElement!==$(slot))$(slot).append(frame);else syncFrame();
}
function submission(r){
 const s=r.report.submission;
 $('submission-count').textContent=s?' · '+l(s.report.recommendations.length+' 个窗口',s.report.recommendations.length+' windows'):'';
 $('full-submission').hidden=!s;
 if(!s){$('submission-body').innerHTML='<p>'+l('有投稿计划时，在 Agent 对话中补充目标、准备状态与截止时间，便可在同一份周计划中加入具体窗口。','When you have a submission in mind, provide the venue, readiness and deadline in the Agent conversation to add concrete windows to this weekly plan.')+'</p>';return;}
 const report=s.report;
 let html='<p><b>'+e(report.project_summary.title)+'</b> · '+l('科研任务之后，使用剩余可用时段。','Uses remaining availability after research tasks.')+'</p>';
 if(report.readiness.conditions?.length)html+='<p class="muted">'+l('提交前完成：','Before submission: ')+e(report.readiness.conditions.join('；'))+'</p>';
 if(report.timing_policy)html+='<p class="muted">'+(lang==='zh'?e(report.timing_policy.explanation):'Verified venue-specific academic preferences take priority over cultural preferences. See the full report for the recorded source and applicability.')+'</p>';
 html+='<div class="submission-cards">'+report.recommendations.map((c,i)=>{
  const b=r.window_details?.[c.candidate_id]?.bagua;
  return '<article class="submission-card"><b>'+String(i+1).padStart(2,'0')+' · '+(i?l('备选窗口','Alternative'):l('首选窗口','Preferred'))+'</b><p>'+e(date(c.start_utc))+' — '+e(date(c.end_utc).split(' ').at(-1))+'</p><p>'+l('建议点击 ','Suggested click ')+e(date(c.click_at_utc))+'</p>'+(b?'<p>'+e(b.symbol)+' '+l('提交朝向：','Facing: ')+e(lang==='zh'?b.direction:b.direction_en)+' · '+({北:0,东北:45,东:90,东南:135,南:180,西南:225,西:270,西北:315}[b.direction])+'°</p>':'')+(b?'<details data-key="window-'+i+'"><summary>'+l('原文与解释','Passage and meaning')+'</summary><blockquote>'+e(b.quote)+'</blockquote><p>'+e(lang==='zh'?b.meaning:b.meaning_en)+'</p><p>'+e(lang==='zh'?b.application:b.application_en)+'</p><small>'+e(b.source.title+' · '+b.quote_locator)+'</small></details>':'')+'</article>';
 }).join('')+'</div>';
 if(!report.recommendations.length)html+='<p>'+l('当前条件下尚未排入投稿窗口；先完成待办或在 Agent 中调整可用时段。','No submission window fits the saved conditions yet. Complete prerequisites or adjust availability in the Agent conversation.')+'</p>';
 $('submission-body').innerHTML=html;
 if($('full-submission').open)showFrame('submission-frame-slot');
}
function taskRows(items){return items.map(x=>'<div class="task-row"><time>'+e(date(x.start))+' — '+e(date(x.end).split(' ').at(-1))+'</time><div><b>'+e(x.title)+'</b>'+(x.output?'<span>'+e(x.output)+'</span>':'')+'</div><small>'+e(x.minutes?x.minutes+' min':l('已定安排','Fixed commitment'))+'</small></div>').join('');}
function render(){
 const openKeys=new Set([...document.querySelectorAll('details[data-key][open]')].map(d=>d.dataset.key));
 staticText();
 $('record').innerHTML=records.map(r=>'<option value="'+e(r.record_id)+'">'+e(label(r))+'</option>').join('');$('record').value=current.record_id;
 $('record-status').textContent=current.record_id===data.current_record_id?l('本次调用','Current invocation'):l('往期记录','Previous record');
 $('warnings').hidden=!data.warnings.length;$('warnings').textContent=data.warnings.join('\n');
 const r=current.report,weekly=current.record_type==='weekly';
 $('weekly-content').hidden=!weekly;$('legacy-content').hidden=weekly;
 $('week-range').textContent=weekly?r.week_start.slice(5).replace('-','.')+'—'+r.week_end.slice(5).replace('-','.'):l('投稿择日','Submission timing');
 $('week-meta').textContent=(weekly?r.week_start.slice(0,4)+' · ':'')+(r.timezone??l('文化模式','Cultural reading'));
 if(!weekly){showFrame('legacy-frame-slot');return;}
 const day=r.days[dayIndex],subjects=r.disciplines.filter(s=>selected==='all'||s.id===selected);
 $('discipline').innerHTML='<option value="all">'+l('全部六大学科','All six disciplines')+'</option>'+r.disciplines.map(s=>'<option value="'+e(s.id)+'">'+e(t(s.name))+'</option>').join('');$('discipline').value=selected;
 const holidays=[...new Set(r.days.filter(d=>d.holiday).map(d=>t(d.holiday)))];
 $('week-note').textContent=(r.title?r.title+' · ':'')+(holidays.length?holidays.join(' / ')+' · ':'')+l('先看一周，再做今天的一步。','See the week, then choose today’s step.');
 $('days').innerHTML=r.days.map((d,i)=>'<button type="button" class="day '+(i===dayIndex?'active':'')+'" data-day="'+i+'" aria-pressed="'+(i===dayIndex)+'"><span class="top"><strong>'+d.date.slice(-2)+'</strong><small>'+weekday(d.weekday)+'</small></span><span class="mood"><span>'+e(t(d.tag))+'</span><span class="festival">'+e(d.calendar?.term?term(d.calendar.term):d.makeup?l('调休工作日','Workday'):d.holiday?t(d.holiday):'')+'</span></span><small>'+e(d.calendar?d.calendar.ganzhi+' · '+d.calendar.lunar:l('当地日期','Local date'))+'</small></button>').join('');
 $('days').querySelectorAll('button').forEach(b=>b.onclick=()=>{dayIndex=Number(b.dataset.day);render();});
 $('daytitle').textContent=view==='day'?weekday(day.weekday)+' · '+t(day.theme):l('一周全览','The week at a glance');
 $('dayhint').textContent=view==='day'?t(day.hint):l('每日重点与对应产物，点击日期查看详细安排。','Daily focus and outputs. Choose a date for the details.');
 $('daypanel').hidden=view!=='day';$('weekpanel').hidden=view!=='week';
 for(const id of ['daily','weekly']){$(id).classList.toggle('active',(id==='daily')===(view==='day'));$(id).setAttribute('aria-pressed',String((id==='daily')===(view==='day')));}
 $('subjects').innerHTML=subjects.map(s=>{const x=s.week[dayIndex];return '<article class="subject" style="--accent:'+(/^#[a-fA-F0-9]{6}$/.test(s.color)?s.color:'#24776c')+'"><div class="subjecthead"><h3><span class="icon" aria-hidden="true">'+e(s.icon)+'</span>'+e(t(s.name))+'</h3><span class="tag">'+e(t(x.title))+'</span></div><p class="action">'+e(t(x.action))+'</p><div class="output"><b>'+l('留下什么','Output')+'</b> · '+e(t(x.output))+'</div><details data-key="subject-'+e(s.id)+'"><summary>'+l('学科目标与范围','Scope and goal')+'</summary><p>'+e(t(s.scope))+'</p><p>'+e(t(s.goal))+'</p></details></article>';}).join('');
 const plan=selected==='all'?day.rhythm:subjects[0].rhythms[dayIndex];$('rhythm').dataset.planId=plan.id;$('rhythm').innerHTML=rhythm(plan);
 $('quote').innerHTML=classic(day.classic);
 $('matrix').innerHTML='<thead><tr><th>'+l('学科','Discipline')+'</th>'+r.days.map(d=>'<th>'+weekday(d.weekday)+' '+d.date.slice(5)+'<br><span>'+e(t(d.tag))+'</span></th>').join('')+'</tr></thead><tbody>'+subjects.map(s=>'<tr><th scope="row">'+e(t(s.name))+'</th>'+s.week.map(x=>'<td><b>'+e(t(x.title))+'</b><span>'+e(t(x.output))+'</span></td>').join('')+'</tr>').join('')+'</tbody>';
 const sameDate=x=>new Intl.DateTimeFormat('en-CA',{timeZone:r.timezone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(x));
 const today=[...r.schedule.filter(x=>sameDate(x.start)===day.date),...r.fixed_events.filter(x=>sameDate(x.start)<=day.date&&sameDate(new Date(Date.parse(x.end)-1).toISOString())>=day.date)].sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
 $('project-plan').hidden=!today.length||view!=='day';
 $('project-plan').innerHTML='<details data-key="project-day"><summary>'+l('◷ 今日项目安排','◷ Today’s project plan')+' · '+today.length+'<span class="project-brief"> · '+e(today.map(x=>date(x.start)+' '+x.title).join(' / '))+'</span></summary>'+taskRows(today)+'</details>';
 $('project-week').innerHTML=r.schedule.length||r.fixed_events.length?'<details data-key="project-week"><summary>'+l('◷ 项目任务与已定安排','◷ Project tasks and fixed commitments')+'</summary>'+taskRows([...r.schedule,...r.fixed_events].sort((a,b)=>Date.parse(a.start)-Date.parse(b.start)))+'</details>':'';
 submission(current);
 $('sources').innerHTML='<p><b>'+l('历法事实','Calendar facts')+'</b> · '+l('日期、已保存的假期表及本地历法计算。','Dates, the saved holiday table and local calendar calculations.')+'</p><p><b>'+l('设计建议','Planning interpretation')+'</b> · '+l('六大学科任务与节奏按研究流程编排，经典按主题选读。','Tasks and rhythms follow research workflows; passages follow the daily theme.')+'</p><p><b>'+l('待验证','To validate')+'</b> · '+l('通用建议是否适配项目，要结合真实资料、预约和任务状态。','Fit to a specific project depends on actual materials, commitments and task status.')+'</p>'+r.assumptions.map(a=>'<p>'+e(t(a))+'</p>').join('')+'<ul>'+r.sources.filter(s=>/^https:\/\//.test(s.url)).map(s=>'<li><a href="'+e(s.url)+'" target="_blank" rel="noopener noreferrer">'+e(lang==='zh'?s.title:s.title_en??s.title)+'</a></li>').join('')+'</ul>';
 $('input-content').innerHTML='<p>'+l('仅展示本次生成时保存的资料。更新请回到 Agent 对话。','Shows the data saved for this invocation. Request changes in your Agent conversation.')+'</p><details data-key="input-json"><summary>Input JSON</summary><pre>'+e(JSON.stringify(current.input,null,2))+'</pre></details><details data-key="result-json"><summary>Result JSON</summary><pre>'+e(JSON.stringify(r,null,2))+'</pre></details>';
 $('unplanned-panel').hidden=!r.unscheduled.length;$('unplanned-title').textContent=l('◇ 待安排事项','◇ Tasks to arrange')+' · '+r.unscheduled.length;
 const reasons={needs_estimate:l('补充预计时长后安排','Add an estimated duration'),dependency_unavailable:l('前置任务安排后继续','Schedule the prerequisite first'),no_feasible_slot:l('当前时段未容纳，可调整时长或日程','Needs additional time or adjusted availability')};
 $('unplanned').innerHTML=r.unscheduled.map(x=>'<p><b>'+e(x.title)+'</b> · '+e(reasons[x.reason])+'</p>').join('');
 document.querySelectorAll('details[data-key]').forEach(d=>{if(openKeys.has(d.dataset.key))d.open=true;});
}
$('lang-zh').onclick=()=>{lang='zh';render();syncFrame();};$('lang-en').onclick=()=>{lang='en';render();syncFrame();};
$('daily').onclick=()=>{view='day';render();};$('weekly').onclick=()=>{view='week';render();};
$('discipline').onchange=ev=>{selected=ev.target.value;render();};
$('record').onchange=ev=>{current=records.find(r=>r.record_id===ev.target.value);dayIndex=0;selected=current.report.discipline??'all';render();};
$('full-submission').addEventListener('toggle',()=>{if($('full-submission').open)showFrame('submission-frame-slot');});
$('print').onclick=()=>window.print();render();
})();
