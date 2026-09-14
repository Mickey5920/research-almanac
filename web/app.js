(()=>{
'use strict';
const $=id=>document.getElementById(id),form=$('input-form'),offline=Boolean(window.__SNAPSHOT__);
let records=[],selected=null,token=null,mode='form',parent=null,busy=false;
const labels={ok:'已生成',conditional:'有条件可用',degraded:'传统计算受限',no_candidates:'暂无可用窗口',ready:'已就绪',unknown:'待核实',blocked:'暂不可提交'};
function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function notice(text,error=false){$('notice').hidden=!text;$('notice').textContent=text;$('notice').className='notice'+(error?' error':'');}
function localTime(s,zone,opts){try{return new Intl.DateTimeFormat('zh-CN',{timeZone:zone,...opts}).format(new Date(s));}catch{return s??'未知';}}
const short=s=>localTime(s,undefined,{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const sourceName=s=>({web:'工作台生成',import:'导入记录','legacy-import':'旧版报告导入',cli:'命令行生成'}[s]??s);
async function api(path,options={}){
 const r=await fetch(path,{...options,headers:{'Content-Type':'application/json','X-Local-Token':token??'',...options.headers}});
 const data=await r.json();if(!r.ok)throw new Error(data.error??'操作失败');return data;
}
function formData(){
 const f={};for(const el of $('simple-fields').querySelectorAll('[name]')){if(el.name==='weekday')continue;f[el.name]=el.type==='checkbox'?el.checked:el.value;}
 f.weekdays=[...form.querySelectorAll('[name="weekday"]:checked')].map(el=>Number(el.value));return f;
}
function saveDraft(){
 if(offline)return;try{
 localStorage.setItem('zhouyi-draft-v1',JSON.stringify({mode,form:formData(),json:$('json-input').value,parent}));
 $('draft-state').textContent='草稿已保存于当前浏览器 · '+new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
 }catch{$('draft-state').textContent='浏览器未允许保存草稿；已生成记录仍保存在本机。';}
}
function setMode(next){
 mode=next;$('simple-fields').hidden=mode!=='form';$('json-fields').hidden=mode!=='json';
 $('form-mode').classList.toggle('active',mode==='form');$('json-mode').classList.toggle('active',mode==='json');
 for(const field of $('simple-fields').querySelectorAll('input,select,textarea'))field.disabled=offline||mode!=='form';
 $('json-input').disabled=offline;
}
function showConditional(){
 $('custom-range').hidden=form.elements.range_mode.value!=='custom';$('deadline-field').hidden=form.elements.deadline_status.value!=='set';
}
function restoreDraft(){
 try{
 const d=JSON.parse(localStorage.getItem('zhouyi-draft-v1')??'null');if(!d)return;
 for(const [k,v] of Object.entries(d.form??{})){
  if(k==='weekdays'){for(const el of form.querySelectorAll('[name="weekday"]'))el.checked=v.includes(Number(el.value));continue;}
  const el=form.elements[k];if(!el)continue;if(el.type==='checkbox')el.checked=Boolean(v);else el.value=v;
 }
 $('json-input').value=d.json??'';parent=d.parent??null;setMode(d.mode==='json'?'json':'form');
 $('draft-state').textContent='已恢复上次未完成的草稿';if(parent){$('parent-label').textContent='基于历史记录继续调整';$('parent-label').hidden=false;}
 }catch{try{localStorage.removeItem('zhouyi-draft-v1');}catch{}}
}
function renderHistory(){
 $('history-count').textContent=records.length;
 const search=$('search').value.trim().toLowerCase(),list=$('history-list');list.replaceChildren();
 const shown=records.filter(r=>JSON.stringify([r.report.project_summary?.title,r.report.project_summary?.target,r.created_at,r.input?.project?.title]).toLowerCase().includes(search));
 if(!shown.length){list.append(node('div',records.length?'没有找到匹配的记录':'尚无历史记录。\\n生成一次安排，从这里开始。'.replace('\\n','\n'),'history-empty'));return;}
 for(const r of shown){
  const b=node('button',undefined,'history-item'+(selected?.record_id===r.record_id?' active':''));b.type='button';
  b.append(node('strong',r.report.project_summary?.title??'周易文化解读'),node('small',short(r.created_at)+' · '+sourceName(r.source)),node('span',labels[r.report.status]??r.report.status,'history-tag'));
  b.addEventListener('click',()=>showRecord(r));list.append(b);
 }
}
function populateComparison(){
 const select=$('compare-select'),previous=select.value;select.replaceChildren(node('option','选择另一条记录…'));
 select.firstChild.value='';
 for(const r of records)if(r.record_id!==selected?.record_id){const o=node('option',(r.report.project_summary?.title??'文化解读')+' · '+short(r.created_at));o.value=r.record_id;select.append(o);}
 if(records.some(r=>r.record_id===previous&&r.record_id!==selected?.record_id))select.value=previous;
 renderComparison();
}
function flatten(value,prefix='',out={}){
 if(value&&typeof value==='object'&&!Array.isArray(value)){for(const key of Object.keys(value))flatten(value[key],prefix?prefix+'.'+key:key,out);}
 else out[prefix]=value;
 return out;
}
function renderComparison(){
 const box=$('comparison');box.replaceChildren();if(!selected||!$('compare-select').value)return;
 const other=records.find(r=>r.record_id===$('compare-select').value);if(!other)return;
 if(!selected.input||!other.input)box.append(node('p','有一条记录未保存原始输入，只能对比结果。','muted'));
 else{
  const a=flatten(other.input),b=flatten(selected.input),keys=[...new Set([...Object.keys(a),...Object.keys(b)])].filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k]));
  box.append(node('p',keys.length?'输入变化：'+keys.length+' 项':'两条记录的完整输入相同。','muted'));
  for(const key of keys){const row=node('div',undefined,'difference');row.append(node('b',key),node('p','对比记录：'+JSON.stringify(a[key]??null)),node('p','当前记录：'+JSON.stringify(b[key]??null)));box.append(row);}
 }
 const row=node('div',undefined,'difference');row.append(node('b','推荐结果'));
 for(const [title,r] of [['对比记录',other],['当前记录',selected]])row.append(node('p',title+'：'+(r.report.recommendations.length?r.report.recommendations.map(c=>c.local_click+' / '+(c.direction?.name??'方位暂缺')).join('；'):'无候选')));
 box.append(row,node('p','这里只展示实际差异，不把文化排序差异解释为录用优势。','muted'));
}
function showRecord(r){
 selected=r;const report=r.report;$('result-empty').hidden=true;$('result-content').hidden=false;
 if(offline)$('json-input').value=r.input?JSON.stringify(r.input,null,2):'此记录未保存原始输入';
 $('record-title').textContent=report.project_summary?.title??'周易文化解读';
 $('record-meta').textContent=short(r.created_at)+' · '+sourceName(r.source)+' · '+(report.timezone??'纯文化模式')+' · '+r.record_id.slice(0,8);
 $('result-badge').hidden=false;$('result-badge').textContent=labels[report.status]??report.status;
 $('record-input').textContent=r.input?JSON.stringify(r.input,null,2):'这份旧版报告没有保存原始输入，无法准确还原。';
 $('record-result').textContent=JSON.stringify(report,null,2);$('restore').disabled=offline||!r.input;
 const notes=[];
 if(r.source==='legacy-import')notes.push('旧版报告仅保留结果，没有原始输入。');
 if(r.source==='import')notes.push('外部导入的输入与结果按原样保存，未重新计算验证两者对应关系。');
 if(report.status==='conditional')notes.push('以下窗口依赖准备条件或截止信息确认后才可采用。');
 if(report.status==='degraded')notes.push('当前时区暂未启用传统计算；显示的是实际时间安排。');
 if(report.status==='no_candidates')notes.push('当前条件下没有合适窗口。可调整日期或准备条件后再次生成。');
 if(report.readiness?.conditions?.length)notes.push('待完成：'+report.readiness.conditions.join('；'));
 if(report.missing_inputs?.includes('deadline'))notes.push('截止时间尚未核实。');
 const alert=$('result-alert');alert.hidden=!notes.length;alert.textContent=notes.join('\n');
 const list=$('candidate-list');list.replaceChildren();
 for(const c of report.recommendations){
  const card=node('article',undefined,'candidate'),head=node('div',undefined,'candidate-head');
  head.append(node('span','0'+c.rank+' / '+(c.rank===1?'首选窗口':'备选窗口'),'candidate-rank'),node('span',labels[c.readiness_status]??c.readiness_status));
  const date=localTime(c.start_utc,c.timezone,{month:'long',day:'numeric',weekday:'long'}),tm=s=>localTime(s,c.timezone,{hour:'2-digit',minute:'2-digit',hour12:false});
  const meta=node('div',undefined,'candidate-meta');
  meta.append(node('span','点击 '+tm(c.click_at_utc)),node('span',c.direction?'面向参考 · '+c.direction.name:'方位暂缺'));
  if(c.calendar_facts)meta.append(node('span',c.calendar_facts.day_ganzhi+' · '+c.calendar_facts.officer+'日'));
  card.append(head,node('div',date,'candidate-date'),node('div',tm(c.start_utc)+' — '+tm(c.end_utc),'candidate-time'),meta);
  if(c.deadline_margin_minutes!==null)card.append(node('p','距离已填写的截止约 '+(c.deadline_margin_minutes/60).toFixed(1)+' 小时'+(c.buffer_met===false?' · 未满足期望提前量':''),'candidate-reason'));
  list.append(card);
 }
 const reflection=$('reflection'),c=report.cultural_result;reflection.replaceChildren();reflection.hidden=!c;
 if(c?.text)reflection.append(node('blockquote',c.text),node('p',c.zh??c.en),node('small',c.locator+' · '+c.source_id+' · 现代项目解读'));
 else if(c)reflection.append(node('p','六爻记录已保存在完整结果中。'));
 renderHistory();populateComparison();
}
function download(name,content,type){const url=URL.createObjectURL(new Blob([content],{type})),a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
async function refreshHistory(){const data=offline?window.__SNAPSHOT__:await api('/api/history');records=data.records;if(data.warnings?.length)notice(data.warnings.join('\n'),true);renderHistory();return data;}
$('search').addEventListener('input',renderHistory);
$('form-mode').addEventListener('click',()=>{setMode('form');saveDraft();});
$('json-mode').addEventListener('click',()=>{setMode('json');saveDraft();});
form.addEventListener('input',()=>{showConditional();saveDraft();});
form.addEventListener('change',()=>{showConditional();saveDraft();});
$('json-input').addEventListener('input',saveDraft);
$('new-draft').addEventListener('click',()=>{
 form.reset();$('json-input').value='';parent=null;$('parent-label').hidden=true;setMode('form');showConditional();saveDraft();
 notice('已开始新输入，历史记录仍然保留。');
});
form.addEventListener('submit',async event=>{
 event.preventDefault();if(offline||busy)return;busy=true;$('generate').disabled=true;$('generate').textContent='正在计算并保存…';notice('');
 try{
  const payload=mode==='json'?{input:JSON.parse($('json-input').value)}:{form:formData()};payload.parent_record_id=parent;
  const data=await api('/api/generate',{method:'POST',body:JSON.stringify(payload)});
  await refreshHistory();showRecord(data.record);notice('本次输入与结果已一同保存。');saveDraft();
 }catch(error){notice('未能生成或保存：'+error.message,true);}
 finally{busy=false;$('generate').disabled=false;$('generate').textContent='生成并保存本次结果 ↗';}
});
$('restore').addEventListener('click',()=>{
 if(!selected?.input||offline)return;const input=structuredClone(selected.input);delete input.now;
 $('json-input').value=JSON.stringify(input,null,2);parent=selected.record_id;
 $('parent-label').hidden=false;$('parent-label').textContent='基于 '+short(selected.created_at)+' 的记录调整 · 旧记录保留';
 setMode('json');saveDraft();notice('已载入完整输入并移除固定运行时间。请检查历史日期和截止，再生成新的记录。');$('json-input').focus();
});
$('download-record').addEventListener('click',()=>{if(selected)download('zhouyi-record-'+selected.record_id.slice(0,8)+'.json',JSON.stringify(selected,null,2),'application/json');});
$('compare-select').addEventListener('change',renderComparison);
$('import-button').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async()=>{
 const file=$('import-file').files[0];if(!file)return;
 try{if(file.size>1024*1024)throw new Error('文件超过 1 MB。');
 const data=await api('/api/import',{method:'POST',body:await file.text()});await refreshHistory();showRecord(data.record);notice('记录已导入，原文件未更改。');
 }catch(error){notice('导入失败：'+error.message,true);}finally{$('import-file').value='';}
});
$('export-html').addEventListener('click',async()=>{
 try{const r=await fetch('/api/export.html');if(!r.ok)throw new Error((await r.json()).error);download('zhouyi-history-'+new Date().toISOString().slice(0,10)+'.html',await r.text(),'text/html');notice('已导出包含全部历史输入与结果的 HTML；它包含你的项目资料，请妥善保存。');}
 catch(error){notice('导出失败：'+error.message,true);}
});
async function init(){
 try{
  if(offline){document.body.classList.add('read-only');$('mode-label').textContent='离线历史快照';$('version').textContent=window.__SNAPSHOT__.version;
   setMode('json');notice('这是只读历史快照，可浏览、对比和导出单条记录；生成新结果需启动本地工作台。');$('draft-state').textContent='离线快照，不会修改原始历史';}
  else{const session=await api('/api/session');token=session.token;$('version').textContent=session.version;restoreDraft();}
  showConditional();await refreshHistory();if(records.length){showRecord(records[0]);if(offline)$('json-input').value=records[0].input?JSON.stringify(records[0].input,null,2):'此记录未保存原始输入';}
 }catch(error){notice('无法连接本地工作台：'+error.message+'。请运行 npm start 后通过本地地址打开。',true);}
}
init();
})();
