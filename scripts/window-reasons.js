import {readFileSync} from 'node:fs';
const excerpts=JSON.parse(readFileSync(new URL('../data/excerpts.json',import.meta.url),'utf8'));
const dayMeanings={成:'取“完成、成就”的项目寓意，适合把已准备好的稿件完成提交。',开:'取“开启、开展”的项目寓意，可联系到开启新一轮投稿流程。',收:'取“收束、收拢”的项目寓意，可联系到材料归档、检查与收尾。'};
const fmt=n=>Number.isInteger(n)?String(n):n.toFixed(1);
export function windowReasons(record,c){
 const report=record.report,input=record.input,items=[];
 const source=id=>{const s=report.sources?.find(s=>s.id===id);return s?{source_id:id,source_title:s.title,source_url:typeof s.url==='string'&&/^https:\/\//.test(s.url)?s.url:null}:{source_id:id,source_title:'来源未随旧记录保存',source_url:null};};
 const add=(kind,title,text,id)=>items.push({kind,title,text,...source(id)});
 const cal=c.calendar_facts,known=report.versions?.ruleset==='local-cultural-v1';
 if(cal){
  if(known&&dayMeanings[cal.officer])add('favorable',cal.officer+'日 · 日课偏好',dayMeanings[cal.officer]+' 本工具的现代排序偏好为成、开、收；这不是《周易》对论文投稿的原文规定。','local-cultural-v1');
  else add('neutral',(cal.officer??'未记录')+'日 · 日课记录',known?'本规则没有给这个建除日额外优先分；窗口仍可能因可用时间、时辰及日期分散而被选中。':'旧记录的排序规则不在当前解释范围内，不补写有利评价。','local-cultural-v1');
  if(cal.hour_luck==='吉')add('favorable',(cal.hour_ganzhi??'')+'时 · '+(cal.hour_spirit??'')+'吉时','保存的历法记录将此时辰标为“吉”'+(known?'，在满足现实约束后为文化排序提供一项有利因素。':'。旧版排序是否使用该因素，需查看原规则。')+' 这是历法择时标签，不是《周易》卦辞。','lunar-1.7.7');
  else add('caution',(cal.hour_ganzhi??'')+'时 · 时辰记录','保存的时辰标签为“'+(cal.hour_luck??'未记录')+'”'+(cal.hour_spirit?'（'+cal.hour_spirit+'）':'')+'，因此不能把本窗口描述为吉时。','lunar-1.7.7');
  if(c.direction?.name)add('reference','喜神方位 · '+c.direction.name,'记录采用日家喜神方位。将其作为面向的仪式感参考属于现代延伸；方位不参与时间排序，也不指向期刊或审稿人。','lunar-1.7.7');
 }else add('neutral','传统因素未启用','这条记录没有可用的日时历法数据，不补写吉日、吉时或喜神方位。','local-cultural-v1');
 const start=Date.parse(c.start_utc),end=Date.parse(c.end_utc),click=Date.parse(c.click_at_utc),duration=(end-start)/60000,offset=(click-start)/60000;
 if(Number.isFinite(duration)&&duration>0&&Number.isFinite(offset)&&offset>=0&&offset<duration){
  add('practical','为什么是这个具体分钟','本窗口共 '+fmt(duration)+' 分钟，建议在开始后 '+fmt(offset)+' 分钟点击提交，之后仍留 '+fmt(duration-offset)+' 分钟在本窗口内核对反馈。具体分钟来自操作预算'+(input?'与本次安排':'；旧记录未保存输入，以上按已保存时间还原')+'，不是卦辞给出的分钟级吉凶。','config-v1');
 }
 if(c.deadline_margin_minutes!==null&&Number.isFinite(c.deadline_margin_minutes)){
  const m=c.deadline_margin_minutes;
  add(c.buffer_met===true?'practical':'caution','截止余量 · '+fmt(m/60)+' 小时','按记录中的截止，窗口结束后还有 '+fmt(m/60)+' 小时。'+(c.buffer_met===true?'符合本次设定的提前量。':'未满足期望提前量，请优先核查准备和截止。')+(input?.deadline?.status==='verified'?'':' 截止真实性仍以原始投稿要求为准。'),'config-v1');
 }
 if(c.readiness_status!=='ready')add('caution','仍有准备条件','本窗口是有条件推荐；'+(c.conditions?.length?'请先完成：'+c.conditions.join('；')+'。':'准备情况尚待确认。'),'config-v1');
 const reflected=excerpts.find(e=>e.id===report.cultural_result?.id&&e.text===report.cultural_result?.text);
 if(reflected)add('reflection','周易启示 · '+(reflected.source_id==='zhouyi-qian'?'乾':'謙')+'·'+reflected.locator,'「'+reflected.text+'」 '+reflected.zh+' 这条启示对应投稿阶段，不参与这个日期或分钟的排序。',reflected.source_id);
 return {version:'window-explanation-v1',items};
}

