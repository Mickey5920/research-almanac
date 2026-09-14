(()=>{
'use strict';
const $=id=>document.getElementById(id);
const data=JSON.parse($('local-records').textContent),records=data.records;
let selected=null;
const labels={ok:'已生成',conditional:'有条件可用',degraded:'传统计算受限',no_candidates:'暂无可用窗口'};
const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
function when(s,zone){try{return new Intl.DateTimeFormat('zh-CN',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(s));}catch{return s??'未记录';}}
function title(r){return r.report.project_summary?.title??'周易文化解读';}
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
function show(r){
 selected=r;const report=r.report;
 $('record-label').textContent=r.record_id===data.current_record_id?'本次调用结果':'往期结果';
 $('record-title').textContent=title(r);$('result-badge').textContent=labels[report.status]??report.status;
 $('record-meta').textContent='保存于 '+when(r.created_at)+' · '+(report.timezone??'文化模式')+' · 引擎 '+report.versions.skill;
 $('input-note').textContent='这份输入与右侧结果来自同一条已保存记录。';
 $('record-input').textContent=r.input?JSON.stringify(r.input,null,2):'该旧记录未保存原始输入，无法准确还原。';
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
 const card=el('article',undefined,'candidate');
 card.append(el('div','0'+c.rank+' / '+(c.rank===1?'首选窗口':'备选窗口'),'candidate-rank'),el('div',when(c.start_utc,c.timezone),'candidate-date'),el('p','至 '+when(c.end_utc,c.timezone)+' · 点击 '+when(c.click_at_utc,c.timezone),'candidate-reason'));
 const meta=el('div',undefined,'candidate-meta');meta.append(el('span','方位参考 · '+(c.direction?.name??'暂缺')));if(c.calendar_facts)meta.append(el('span',c.calendar_facts.day_ganzhi+' · '+c.calendar_facts.officer+'日'));
 card.append(meta);list.append(card);
 }
 const reflection=$('reflection'),c=report.cultural_result;reflection.replaceChildren();reflection.hidden=!c;
 if(c?.text)reflection.append(el('blockquote',c.text),el('p',c.zh??c.en),el('small',c.locator+' · '+c.source_id+' · 现代项目解读'));
 else if(c)reflection.append(el('p','已保存六爻记录；详见完整结果。'));
 const select=$('compare-select');select.replaceChildren(el('option','请选择…'));select.firstChild.value='';
 for(const other of records)if(other.record_id!==r.record_id){const o=el('option',title(other)+' · '+when(other.created_at));o.value=other.record_id;select.append(o);}
 renderList();compare();
}
$('history-count').textContent=records.length;
if(data.warnings.length){$('warnings').hidden=false;$('warnings').textContent='部分本地记录无法读取，原文件已保留：\n'+data.warnings.join('\n');}
$('search').addEventListener('input',renderList);$('compare-select').addEventListener('change',compare);
if(records.length)show(records.find(r=>r.record_id===data.current_record_id)??records[0]);
else{$('empty').hidden=false;$('result-content').hidden=true;renderList();}
})();

