import {readFileSync} from 'node:fs';
const excerpts=JSON.parse(readFileSync(new URL('../data/excerpts.json',import.meta.url),'utf8'));
const dayMeanings={成:'取完成、成就之意，适合将准备好的稿件落实提交。',开:'取开启、开展之意，寓意开启新一轮投稿。',收:'取收束、收拢之意，适合材料归档、检查与收尾。'};
const reflections={
 'qian-image':'持续打磨，核对主张、材料和版本后完成提交。',
 'qian-line3':'逐条核对回复与稿件，提前完成最后检查。',
 'modesty':'清楚表述证据边界，做好重投前的收尾。',
 'modesty-line3':'梳理已完成的工作，稳妥完成提交。'
};
const fmt=n=>Number.isInteger(n)?String(n):n.toFixed(1);
export function windowReasons(record,c){
 const report=record.report,items=[];
 const source=id=>{const s=report.sources?.find(s=>s.id===id);return s?{source_id:id,source_title:s.title,source_url:typeof s.url==='string'&&/^https:\/\//.test(s.url)?s.url:null}:{source_id:id};};
 const add=(kind,title,text,id)=>items.push({kind,title,text,...source(id)});
 const cal=c.calendar_facts,known=report.versions?.ruleset==='local-cultural-v1';
 if(cal){
  if(known&&Object.hasOwn(dayMeanings,cal.officer))add('favorable',cal.officer+'日 · 日课寓意',dayMeanings[cal.officer],'local-cultural-v1');
  if(cal.hour_luck==='吉')add('favorable',[cal.hour_ganzhi?cal.hour_ganzhi+'时':null,cal.hour_spirit?cal.hour_spirit+'吉时':'吉时'].filter(Boolean).join(' · '),(cal.hour_spirit?cal.hour_spirit+'值时，':'')+'历法标记为吉时。','lunar-1.7.7');
  if(c.direction?.name)add('reference','喜神方位 · '+c.direction.name,'提交时可面向'+c.direction.name+'，增添仪式感。','lunar-1.7.7');
 }
 const start=Date.parse(c.start_utc),end=Date.parse(c.end_utc),click=Date.parse(c.click_at_utc),duration=(end-start)/60000,offset=(click-start)/60000;
 if(Number.isFinite(duration)&&duration>0&&Number.isFinite(offset)&&offset>=0&&offset<duration){
  add('practical','具体分钟安排','窗口共 '+fmt(duration)+' 分钟，'+(offset>0?'前 '+fmt(offset)+' 分钟核对材料，再点击提交':'窗口开始时点击提交')+'，余下 '+fmt(duration-offset)+' 分钟检查回执。','config-v1');
 }
 if(c.buffer_met===true&&Number.isFinite(c.deadline_margin_minutes)&&c.deadline_margin_minutes>=0){
  const hours=fmt(c.deadline_margin_minutes/60);
  add('practical','截止余量 · '+hours+' 小时','窗口结束后距设定截止还有 '+hours+' 小时，满足本次提前量。','config-v1');
 }
 const reflected=excerpts.find(e=>e.id===report.cultural_result?.id&&e.text===report.cultural_result?.text);
 if(reflected&&Object.hasOwn(reflections,reflected.id))add('reflection','周易启示 · '+(reflected.source_id==='zhouyi-qian'?'乾':'謙')+'·'+reflected.locator,'「'+reflected.text+'」 '+reflections[reflected.id],reflected.source_id);
 return {version:'window-explanation-v2',items};
}
