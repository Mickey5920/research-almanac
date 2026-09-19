import {readFileSync} from 'node:fs';
import {attachActivities,activityLibrary,buildWeekFocus,validateActivities,validateWeekFocus} from './research-activities.js';

export const profileCatalog=JSON.parse(readFileSync(new URL('../data/research-profiles.json',import.meta.url),'utf8'));
const bi=(zh,en)=>({zh,en});
const fragment=s=>s[0].toLowerCase()+s.slice(1);
const clone=x=>structuredClone(x);
const concat=(...items)=>bi(items.map(x=>x.zh).join('；'),items.map(x=>x.en).join('; '));
const find=(kind,id)=>profileCatalog[kind].find(x=>x.id===id);
const groups=['humanities','social','science','engineering','agriculture','medicine'];
const phaseNames=[bi('梳理路径','Map the path'),bi('推进一处','Advance one step'),bi('核查证据','Check evidence'),bi('整理交付','Prepare a handoff'),bi('恢复留白','Make room for rest'),bi('轻读拾遗','Read lightly'),bi('接续下周','Prepare a restart'),bi('交流对齐','Align through discussion')];
const defaultCategories={'01':'humanities','02':'social','03':'social','04':'social','05':'humanities','06':'humanities','07':'science','08':'engineering','09':'agriculture','10':'medicine','11':'social','12':'social','13':'humanities','14':'science'};

export function validateResearchProfile(p){
 if(p===undefined)return true;
 for(const [key,kind] of [['specialties','specialties'],['methods','methods']]){
  for(const id of p[key]??[])if(!find(kind,id))throw Error('Unknown research '+key+': '+id);
 }
 if(p.stage&&!find('stages',p.stage))throw Error('Unknown research stage');
 if(p.degree&&!find('degrees',p.degree))throw Error('Unknown research degree');
 const labels=new Set((p.specialties??[]).map(id=>find('specialties',id).name.zh));
 for(const s of p.custom_specialties??[]){
  if(!find('categories',s.category))throw Error('Unknown research category');
  const label=s.name.trim();if(!label||labels.has(label))throw Error('Duplicate or empty research direction');labels.add(label);
 }
 if((p.specialties?.length??0)+(p.custom_specialties?.length??0)>4)throw Error('Use at most four combined research directions');
 if(!labels.size&&!p.methods?.length&&!p.stage&&!p.focus?.trim())throw Error('Research profile needs a direction, method, stage or focus');
 return true;
}

// Suggestions are saved separately from booked tasks. No suggestion is assigned
// a real time, dependency or completion status by this module.
export function enrichTask(task,phase,context={}){
 const light=phase>=4&&phase<=6;
 const prepare=context.prepare??bi('找到本项工作的最新材料，确认版本与待解决的问题','Locate the latest materials, verify versions and identify the question');
 const checkpoint=context.check??bi('检查产物是否可追溯到材料，并写清仍需核实的地方','Trace the output to its evidence and mark what still needs checking');
 const steps=light?[task.action,bi('需要记录时只留一个可接续的线索，固定任务仍按原安排进行','If useful, leave one resumable note; keep fixed commitments as planned')]:[
  prepare,task.action,bi('保存'+task.output.zh+'，标记版本、来源和下一步','Save '+fragment(task.output.en)+' with version, source and next-step notes')];
 return {...clone(task),steps,checkpoint,
  minimum:light?bi('可以留白；有余力时记一句下次从哪里接着做','Leave space if needed; optionally note where to resume'):bi('围绕“'+task.output.zh+'”，先记下一条证据或一处待核查点','For '+fragment(task.output.en)+', note just one piece of evidence or one point to check'),
  blocked:bi('暂缺输入时，先为“'+task.output.zh+'”标记已有材料与一个具体待确认问题','While waiting for inputs, identify available materials and one precise question for '+fragment(task.output.en)),
  extension:light?bi('精力充足时轻读一则相关材料，把新线索放入待办','If rested, read one related item lightly and add any lead to the backlog'):bi('为“'+task.output.zh+'”补充一个反例、边界情况或替代解释','Add one counterexample, boundary case or alternative explanation to '+fragment(task.output.en)),
  effort:light?bi('可选轻量安排','Optional light activity'):bi('选择一项推进，时长按实际安排','Choose one step; fit its duration to real availability')};
}

function fieldTask(f,stage,day){
 const phase=day.phase,runStages=['general','pilot','collection','analysis'];
 const execution=runStages.includes(stage.id)?concat(stage.action,f.action):concat(stage.action,bi('使用'+f.material.zh+'支撑这一工作点','Use '+fragment(f.material.en)+' to support this work'));
 const output=runStages.includes(stage.id)?f.output:stage.output;
 let action,product=output;
 if(phase===0){action=bi('围绕'+stage.name.zh+'，整理'+f.material.zh+'；选定一个本周可交付的小目标','For '+fragment(stage.name.en)+', organize '+fragment(f.material.en)+' and choose one small weekly deliverable');product=bi('本周工作点与资料清单','A weekly focus and materials list');}
 else if(phase===1)action=execution;
 else if(phase===2){action=concat(bi('复查已有的'+output.zh+'，优先核对一个关键环节','Revisit the existing '+output.en+' and check one critical link'),stage.check,f.check);product=bi('核查记录与修订项','A verification log and revision items');}
 else if(phase===3){action=bi('整理本周已有的'+output.zh+'，补齐版本、来源、未决问题和下一步','Organize the existing '+output.en+' with versions, sources, open questions and next steps');product=bi('阶段产物与接续说明','An intermediate output with restart notes');}
 else if(phase===4){action=bi('留出恢复时间；需要衔接时，仅记下'+f.name.zh+'下一次工作的起点','Make room for rest; if a handoff is needed, note only the next starting point for '+f.name.en);product=bi('可选的一句接续提示','An optional one-line restart note');}
 else if(phase===5){action=bi('有余力时，从'+f.material.zh+'中轻读一小段，记录一个新问题','If you have capacity, read a small part of '+f.material.en+' and note one question');product=bi('一则阅读线索','One reading lead');}
 else if(phase===6){action=bi('看看'+stage.name.zh+'还差哪些输入，为下次工作留一个清楚的入口','Check what inputs '+stage.name.en+' still needs and leave a clear entry point for next time');product=bi('下一步与所需材料','A next step and required materials');}
 else{action=bi('围绕'+stage.name.zh+'准备一个可讨论的问题，附上已有'+output.zh+'；记录需要对齐的判断','Prepare one question about '+stage.name.en+' with the existing '+output.en+' and note the decisions to align');product=bi('讨论提纲与待确认项','A discussion outline and open decisions');}
 const task=enrichTask({title:phaseNames[phase],action,output:product},phase,{prepare:bi('先定位'+f.material.zh+'的当前版本，确认本次工作的范围','Locate current versions of '+f.material.en+' and confirm the scope of this step'),check:concat(stage.check,f.check)});
 if(phase===4)task.checkpoint=bi('休息与必要值守均按实际安排，连续实验、照护和采样保持既定流程','Keep rest and essential commitments aligned with reality; maintain established continuous experiments, care and sampling');
 return {field_id:f.id,name:clone(f.name),group:f.group,...task};
}

function methodTask(method,stage,day){
 const phase=day.phase,light=phase>=4&&phase<=6,execution=['general','pilot','collection','analysis'].includes(stage.id);
 let action;
 if(light)action=bi('需要接续时，记下'+method.name.zh+'下一次要用的材料与问题','If a restart note is helpful, list the next materials and question for '+method.name.en);
 else if(!execution)action=bi('在'+stage.name.zh+'中说明'+method.name.zh+'的选择理由、处理过程与局限','For '+stage.name.en+', explain the rationale, process and limits of '+method.name.en);
 else action=phase===0?method.steps[0]:phase===1?method.steps[1]:phase===2?method.check:phase===3?method.steps[2]:bi('准备一个关于'+method.name.zh+'的具体方法问题，并附相关记录','Prepare one specific question about '+method.name.en+' with the relevant records');
 return {id:method.id,name:clone(method.name),action:clone(action),output:light?bi('可选的材料与问题便笺','An optional materials and question note'):!execution?bi('方法说明与依据标记','A methods explanation with evidence markers'):clone(method.output),checkpoint:clone(method.check)};
}

export function buildResearchProfile(input,days){
 const p=input.research_profile;if(!p)return null;
 const stage=find('stages',p.stage??'general');
 const fields=(p.specialties??[]).map(id=>({...clone(find('specialties',id)),origin:'catalog'}));
 for(const [i,s] of (p.custom_specialties??[]).entries())fields.push({id:'custom-'+i,name:bi(s.name,s.name),category:s.category,group:defaultCategories[s.category],origin:'user',
  material:bi(s.name+'相关的已有资料、方法记录与问题清单','Existing evidence, method records and questions for '+s.name),
  action:bi('将已有材料与当前研究问题逐项对齐，选择一处可验证的工作点','Align available evidence with the current question and choose one verifiable step'),
  output:bi('带来源的研究工作记录','A research work record with sources'),
  check:bi('结合本专业实际方案确认建议的适用范围','Check applicability against the actual project plan')});
 // A method-only request has a clearly labelled general track, not an invented specialty.
 const workingFields=fields.length?fields:[{id:'general',name:bi('当前研究','Current research'),group:input.discipline&&input.discipline!=='all'?input.discipline:'science',
  material:bi('已提供的研究资料与任务','Supplied research materials and tasks'),action:stage.action,output:stage.output,check:stage.check}];
 const methods=(p.methods??[]).map(id=>find('methods',id));
 const week=days.map(day=>{
  const tracks=workingFields.map(f=>attachActivities(fieldTask(f,stage,day),{day,group:f.group,stage:stage.id,methods:methods.map(m=>m.id),context:f.material})),methodCards=methods.map(m=>methodTask(m,stage,day));
  const light=day.phase>=4&&day.phase<=6;
  const steps=[tracks[0].steps[0],methodCards[0]?.action??tracks[0].action,tracks[0].output];
  const rhythm={id:'profile-'+day.date,date:day.date};
  for(const lang of ['zh','en'])rhythm[lang]={title:phaseNames[day.phase][lang],flow:light?(lang==='zh'?'留白 → 轻触 → 接续':'Rest → Light touch → Restart'):(lang==='zh'?'定位 → 推进 → 留痕':'Orient → Advance → Record'),icon:light?'◌':'◈',
   blocks:steps.map((s,i)=>({time:(lang==='zh'?['起手','专注','收束']:['Opening','Focus','Closing'])[i],title:(lang==='zh'?['从哪里开始','做一件具体的事','留下可继续的记录']:['Choose a starting point','Take one concrete step','Leave a resumable record'])[i],detail:s[lang],kind:light?'light':i===0?'prepare':i===1?'focus':'record'})),
   pause:lang==='zh'?'在自主工作段之间适当休息；已定预约与连续流程优先。':'Pause between self-directed blocks; fixed appointments and continuous protocols take priority.',
   mini:{label:lang==='zh'?'轻量版本':'Smallest useful step',text:tracks[0].minimum[lang]},note:lang==='zh'?'这是工作顺序建议，具体时间以项目安排为准。':'This is a workflow suggestion; use the project plan for actual times.'};
  return {date:day.date,phase:day.phase,light,title:phaseNames[day.phase],tracks,methods:methodCards,rhythm,
   stage_focus:light?bi('给恢复和后续衔接留出空间','Leave room for recovery and a later restart'):clone(stage.action),
   stage_checkpoint:clone(stage.check),
   integration:fields.length>1?bi('先对齐共同问题，再核对'+fields.map(f=>f.name.zh).join('与')+'之间的概念、样本、单位和时间尺度','Align the shared question, then check concepts, samples, units and time scales across '+fields.map(f=>f.name.en).join(' and ')):null};
 });
 return {catalog_version:profileCatalog.version,fields:fields.map(({id,name,category,group,origin})=>({id,name,category,group,origin})),
  methods:methods.map(({id,name})=>({id,name:clone(name)})),stage:{id:stage.id,name:clone(stage.name),origin:p.stage?'user':'general'},
  degree:p.degree?clone(find('degrees',p.degree)):null,focus:p.focus??'',week,
  activity_libraries:Object.fromEntries(workingFields.map(f=>[f.id,activityLibrary(f.group,{stage:stage.id})])),
  week_focus:buildWeekFocus({days,tracks:workingFields.map((f,i)=>({name:f.name,week:week.map(d=>d.tracks[i])})),goal:stage.action,question:stage.check,userFocus:p.focus??''})};
}

export function validatePersonalizedReport(p,days){
 if(p===undefined||p===null)return true; // Previous snapshots remain valid and are never enriched on read.
 const isBi=x=>x&&typeof x.zh==='string'&&typeof x.en==='string';
 const assert=(ok)=>{if(!ok)throw Error('Invalid saved research profile');};
 assert(p.week?.length===7&&Array.isArray(p.fields)&&p.fields.length<=4&&Array.isArray(p.methods)&&p.methods.length<=4);
 assert(isBi(p.stage?.name)&&typeof p.stage.id==='string'&&typeof p.focus==='string');
 assert(p.degree===null||isBi(p.degree?.name));
 assert(new Set(p.fields.map(f=>f.id)).size===p.fields.length&&new Set(p.methods.map(m=>m.id)).size===p.methods.length);
 p.fields.forEach(f=>assert(isBi(f.name)&&groups.includes(f.group)&&find('categories',f.category)));
 p.methods.forEach(m=>assert(isBi(m.name)&&typeof m.id==='string'));
 validateWeekFocus(p.week_focus,days);
 if(p.activity_libraries){
  assert(typeof p.activity_libraries==='object'&&!Array.isArray(p.activity_libraries));
  assert(JSON.stringify(Object.keys(p.activity_libraries).sort())===JSON.stringify((p.fields.length?p.fields.map(f=>f.id):['general']).sort()));
  Object.values(p.activity_libraries).forEach(items=>validateActivities(items,{library:true}));
 }
 p.week.forEach((d,i)=>{
  assert(d.date===days[i].date&&d.phase===days[i].phase&&d.light===(d.phase>=4&&d.phase<=6)&&isBi(d.title)&&isBi(d.stage_focus)&&isBi(d.stage_checkpoint));
  assert(d.tracks?.length===(p.fields.length||1)&&d.methods?.length===p.methods.length);
  assert(d.integration===null||isBi(d.integration));
  d.tracks.forEach((t,j)=>{
   assert(t.field_id===(p.fields[j]?.id??'general')&&groups.includes(t.group));
   assert(['name','title','action','output','checkpoint','minimum','blocked','extension','effort'].every(k=>isBi(t[k]))&&t.steps?.length>=2&&t.steps.every(isBi));
   if(t.operations){validateActivities(t.operations);assert(t.operations.every(a=>a.optional===d.light));}
  });
  d.methods.forEach((m,j)=>assert(m.id===p.methods[j].id&&['name','action','output','checkpoint'].every(k=>isBi(m[k]))));
  assert(d.rhythm?.date===d.date&&d.rhythm.id==='profile-'+d.date);
  for(const lang of ['zh','en']){const v=d.rhythm?.[lang];assert(v&&['title','flow','icon','pause','note'].every(k=>typeof v[k]==='string')&&typeof v.mini?.text==='string'&&typeof v.mini?.label==='string'&&v.blocks?.length===3&&v.blocks.every(b=>['time','title','detail','kind'].every(k=>typeof b[k]==='string')));}
 });
 return true;
}
