(()=>{
'use strict';
const $=id=>document.getElementById(id);
const data=JSON.parse($('local-records').textContent),records=data.records;
let selected=null;
const labels={ok:'已生成',conditional:'有条件可用',degraded:'传统计算受限',no_candidates:'暂无可用窗口'};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
function when(s,zone){try{return new Intl.DateTimeFormat('zh-CN',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(s));}catch{return s??'未记录';}}
function title(r){return r.report.project_summary?.title??'周易文化解读';}
function reasonPanel(record,candidate){
 const explanation=data.explanations?.[record.record_id]?.[candidate.candidate_id];if(!explanation)return null;
 const box=el('section',undefined,'window-reasons');box.setAttribute('aria-label','本窗口择时依据');
 box.append(el('h4','为什么选这个窗口','reason-heading'));
 const names={favorable:'有利因素',neutral:'如实说明',caution:'待留意',reference:'方位参考',practical:'实际安排',reflection:'周易启示'};
 for(const item of explanation.items){
 const row=el('div',undefined,'reason-item reason-'+item.kind),heading=el('div',undefined,'reason-item-head');
 heading.append(el('span',names[item.kind]??'依据','reason-kind'),el('strong',item.title));row.append(heading,el('p',item.text));
 const detail=el('details',undefined,'reason-source');detail.append(el('summary','来源 / 解释层级'));
 const source=el('span',item.source_title+' · '+item.source_id);detail.append(source);
 if(item.source_url&&/^https:\/\//.test(item.source_url)){const link=el('a','查阅原始来源 ↗');link.href=item.source_url;link.target='_blank';link.rel='noopener noreferrer';detail.append(link);}
 row.append(detail);box.append(row);
 }
 return box;
}
function clock(s,zone){return new Intl.DateTimeFormat('en-GB',{timeZone:zone,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(s));}
function day(s,zone){return new Intl.DateTimeFormat('zh-CN',{timeZone:zone,month:'2-digit',day:'2-digit',weekday:'short'}).format(new Date(s));}
function inputSummary(input){
 const box=$('input-summary');box.replaceChildren();if(!input){box.append(el('p','原始输入未保存。','muted'));return;}
 const stages={initial:'首次投稿',revision:'返修提交',resubmission:'修改后重投',unknown:'尚未确定'};
 const ready={ready:'已准备就绪',conditional:'还有待办 / 待确认',blocked:'暂不具备提交条件',unknown:'尚未核实'};
 const range=input.range?.mode==='custom'?input.range.start_date+' 至 '+input.range.end_date_exclusive+'（不含终点）':({next_week:'下周',rolling_7_days:'未来七天'}[input.range?.mode]??'未指定');
 const rows=input.mode==='cultural'?[['解读模式','周易文化解读'],['解读动作',input.cultural?.action??'默认文本解读']]:[['目标期刊 / 会议',input.project?.target||'未填写'],['稿件版本',input.project?.manuscript_version||'未填写'],['投稿阶段',stages[input.project?.stage]??'未填写'],['准备状态',ready[input.readiness?.status]??'未填写'],['推荐范围',range],['所在时区',input.timezone??'未填写'],['截止时间',input.deadline?.at?when(input.deadline.at,input.timezone):input.deadline?.status==='none'?'明确无固定截止':'尚未核实'],['提交前待办',input.readiness?.conditions?.join('；')||'未列出待办']];
 for(const [label,value] of rows){const row=el('div',undefined,'input-field');row.append(el('dt',label),el('dd',value));box.append(row);}
}
function renderList(){
 const box=$('history-list');box.replaceChildren();const q=$('search').value.trim().toLowerCase();
 for(const r of records.filter(r=>JSON.stringify([title(r),r.input?.project?.target,r.created_at]).toLowerCase().includes(q))){
  const b=el('button',undefined,'history-item'+(selected?.record_id===r.record_id?' active':''));
  b.type='button';b.append(el('strong',title(r)),el('small',when(r.created_at)),el('span',r.record_id===data.current_record_id?'本次调用':'往期记录','record-label'));
  b.addEventListener('click',()=>show(r));box.append(b);
 }
 if(!box.children.length)box.append(el('p','没有匹配的本地记录。','muted'));
}
function flatten(v,p='',o={}){if(v&&typeof v==='object'&&!Array.isArray(v))for(const k of Object.keys(v))flatten(v[k],p?p+'.'+k:k,o);else o[p]=v;return o;}
function compare(){
 const box=$('comparison');box.replaceChildren();const other=records.find(r=>r.record_id===$('compare-select').value);if(!other||!selected)return;
 if(other.input&&selected.input){const a=flatten(other.input),b=flatten(selected.input);const keys=[...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k]));
 box.append(el('p','输入差异：'+keys.length+' 项','muted'));for(const k of keys){const row=el('div',undefined,'difference');row.append(el('b',k),el('p','对比记录：'+JSON.stringify(a[k]??null)),el('p','当前记录：'+JSON.stringify(b[k]??null)));box.append(row);}}
 else box.append(el('p','一条记录缺少原始输入，仅对比结果。'));
 for(const [label,r] of [['对比记录',other],['当前记录',selected]])box.append(el('p',label+'：'+(r.report.recommendations.map(c=>c.local_click+' / '+(c.direction?.name??'方位暂缺')).join('；')||'没有候选窗口'),'difference'));
}

function sourceLink(parent,label,url){
 if(typeof url!=='string'||!/^https:\/\//.test(url))return;
 const a=el('a',label,'research-link');a.href=url;a.target='_blank';a.rel='noopener noreferrer';parent.append(a);
}
function renderAcademic(record){
 const box=$('target-evidence');box.replaceChildren();const target=record?.input?.project?.target;
 $('evidence-target').textContent=target?'目标：'+target:'尚未提供目标期刊 / 会议；不能确定其官网规则或编辑部工作时间。';
 const evidence=record?.input?.academic_evidence,matched=evidence&&target&&evidence.target.trim().toLowerCase()===target.trim().toLowerCase();
 for(const [key,title] of [['journal_system','官网投稿系统说明'],['editorial_office','编辑部时区与工作时间'],['conference_deadline','会议截止与 AoE 规则']]){
  const item=matched?evidence[key]:null,card=el('article',undefined,'evidence-card');
  card.append(el('h4',title),el('span',({verified:'Agent 已核验 · 见来源',user_supplied:'用户提供 · 未外部核验',not_found:'已检索 · 未找到',unknown:'待核实'}[item?.status]??'待核实'),'reason-kind'),el('p',item?.summary??'本次记录尚无该目标的核验信息，请由 Agent 查证后保存。'));
  if(item?.checked_at)card.append(el('small','记录核验日：'+item.checked_at));
  if(item?.timezone)card.append(el('p','记录时区：'+item.timezone));
  if(key==='conference_deadline'&&record?.input?.deadline?.at)card.append(el('p','本次已填写截止：'+record.input.deadline.at+'；本地时间：'+when(record.input.deadline.at,record.input.timezone)+'。这不自动证明官网采用 AoE。'));
  if(item?.source_url)sourceLink(card,item.source_title??'来源',item.source_url);
  if(key==='editorial_office')card.append(el('p','工作时间只用于联络与时差参考，不代表即时审稿；不从出版社地址推断编辑所在地。','research-note'));
  box.append(card);
 }
}
function renderReferences(){
 const lib=data.reference_library;if(!lib)return;
 const box=$('study-list');
 for(const study of lib.studies){
  const card=el('article',undefined,'study-card');card.append(el('div',Number(study.sample).toLocaleString('en-US'),'sample-size'),el('small',study.sample_label),el('h3',study.title),el('p',study.citation,'muted'),el('p','样本时期：'+study.period,'muted'),el('p',study.finding),el('p',study.limitation,'study-limit'));
  sourceLink(card,'研究来源 · DOI '+study.doi,study.url);
  if(study.rates){const detail=el('details',undefined,'rates-detail');detail.append(el('summary','查看历史样本的星期分布（非个人预测）'));
   const rows=el('div',undefined,'rate-chart');
   for(const rate of study.rates){const pct=rate.accepted/rate.submitted*100,row=el('div',undefined,'rate-row'),track=el('div',undefined,'rate-track'),bar=el('div',undefined,'rate-bar');bar.style.width=pct.toFixed(1)+'%';track.append(bar);
    row.append(el('span',rate.day),track,el('span',pct.toFixed(1)+'%'),el('small',rate.accepted+'/'+rate.submitted));rows.append(row);}
   detail.append(el('p','JSCS 2013–2014；接收数 ÷ 当日投稿数。观察值，不作跨期刊外推。','research-note'),rows);card.append(detail);
  }
  box.append(card);
 }
 const official=$('official-examples');official.append(el('p','公共核验范例 · 不自动适用于当前目标','research-note'));
 for(const item of lib.official_examples){const p=el('p',item.text);sourceLink(p,item.title,item.url);official.append(p);}
 official.append(el('small','文献与公共规则核验日：'+lib.checked+' · 当前 HTML 不自动刷新网络信息'));
 const books=$('book-list');
 for(const book of lib.books){const c=el('article',undefined,'book-card');c.append(el('h4',book.title),el('span',book.status,'reason-kind'),el('p',book.scope));sourceLink(c,'查阅文本 / 版本',book.url);books.append(c);}
 const body=$('glossary-body');for(const terms of lib.glossary){const tr=el('tr');for(const text of terms)tr.append(el('td',text));body.append(tr);}
}

function show(r){
 selected=r;const report=r.report;renderAcademic(r);
 $('record-label').textContent=r.record_id===data.current_record_id?'本次调用结果':'往期结果';
 $('record-title').textContent=title(r);$('result-badge').textContent=labels[report.status]??report.status;
 $('record-meta').textContent='保存于 '+when(r.created_at)+' · '+(report.timezone??'文化模式')+' · 引擎 '+report.versions.skill;
 $('input-note').textContent='这份输入与右侧结果来自同一条已保存记录。';
 $('record-input').textContent=r.input?JSON.stringify(r.input,null,2):'该旧记录未保存原始输入，无法准确还原。';
 inputSummary(r.input);
 $('record-result').textContent=JSON.stringify(report,null,2);
 const notes=[];
 if(report.status==='conditional')notes.push('准备条件或截止信息仍待确认。');
 if(report.status==='degraded')notes.push('当前时区的传统计算受限，请查看完整结果中的说明。');
 if(report.status==='no_candidates')notes.push('当前条件下没有可用窗口，请回到 Agent 调整条件。');
 if(r.source==='import')notes.push('导入记录未重新计算验证输入与结果的对应关系。');
 if(report.readiness?.conditions?.length)notes.push('待完成：'+report.readiness.conditions.join('；'));
 $('result-alert').textContent=notes.join('\n');$('result-alert').hidden=!notes.length;
 const list=$('candidate-list');list.replaceChildren();
 for(const c of report.recommendations){
 const card=el('article',undefined,'candidate'+(c.rank===1?' is-primary':''));
 const head=el('div',undefined,'window-heading');head.append(el('span',String(c.rank).padStart(2,'0'),'window-index'),el('span',c.rank===1?'首选窗口':'备选窗口','window-label'),el('span',c.readiness_status==='ready'?'已就绪':'待确认','window-state'));
 const fields=el('div',undefined,'window-fields');
 for(const [label,value,cls] of [['推荐日期',day(c.start_utc,c.timezone),'window-date'],['操作时间',clock(c.start_utc,c.timezone)+' — '+clock(c.end_utc,c.timezone),'window-clock'],['建议点击',clock(c.click_at_utc,c.timezone),'window-value'],['面向参考',c.direction?.name??'暂缺','window-value']]){const field=el('div',undefined,'window-field');field.append(el('small',label),el('div',value,cls));fields.append(field);}
 const meta=el('div',undefined,'window-footer');meta.append(el('span',new Intl.DateTimeFormat('zh-CN',{timeZone:c.timezone,year:'numeric'}).format(new Date(c.start_utc))+' · '+c.timezone));if(c.calendar_facts)meta.append(el('span',c.calendar_facts.day_ganzhi+' · '+c.calendar_facts.officer+'日'));
 card.append(head,fields,meta);const reasons=reasonPanel(r,c);if(reasons)card.append(reasons);list.append(card);
 }
 const reflection=$('reflection'),c=report.cultural_result;reflection.replaceChildren();reflection.hidden=!c;
 if(c?.text)reflection.append(el('blockquote',c.text),el('p',c.zh??c.en),el('small',c.locator+' · '+c.source_id+' · 现代项目解读'));
 else if(c)reflection.append(el('p','已保存六爻记录；详见完整结果。'));
 const select=$('compare-select');select.replaceChildren(el('option','请选择…'));select.firstChild.value='';
 for(const other of records)if(other.record_id!==r.record_id){const o=el('option',title(other)+' · '+when(other.created_at));o.value=other.record_id;select.append(o);}
 renderList();compare();
}
renderReferences();renderAcademic(null);
$('history-count').textContent=records.length;
if(data.warnings.length){$('warnings').hidden=false;$('warnings').textContent='部分本地记录无法读取，原文件已保留：\n'+data.warnings.join('\n');}
$('search').addEventListener('input',renderList);$('compare-select').addEventListener('change',compare);
if(records.length)show(records.find(r=>r.record_id===data.current_record_id)??records[0]);
else{$('empty').hidden=false;$('result-content').hidden=true;renderList();}
})();
