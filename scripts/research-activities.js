import {readFileSync} from 'node:fs';
export const activityCatalog=JSON.parse(readFileSync(new URL('../data/research-activities.json',import.meta.url),'utf8'));
const bi=(zh,en)=>({zh,en});
const clone=x=>structuredClone(x);
const executionStages=new Set(['general','pilot','collection','analysis']);
const category=id=>activityCatalog.categories.find(c=>c.id===id);

export function activityLibrary(group,{stage='general'}={}){
 return activityCatalog.groups[group].map(item=>{
  const a=clone(item);
  // A menu in a writing/defense report reviews existing work; it does not
  // quietly request a new experiment, code run or participant interaction.
  if(!executionStages.has(stage)&&['reproduce','experiment','code'].includes(a.id)){
   a.title=bi('回看：'+a.title.zh,'Review: '+a.title.en);
   a.steps=[bi('定位已完成工作的原始记录、版本与对应论文位置','Locate records, versions and manuscript locations for completed work'),
    bi('对照已有记录说明方法、结果和仍未解决的差异','Use existing records to explain methods, results and unresolved differences'),
    bi('把需要补充的证据写入待确认清单，按项目安排决定是否执行','List evidence to confirm and use the project plan to decide whether additional work is needed')];
   a.output=bi('已有工作与论文表达对应表','A map from existing work to the manuscript');
  }
  return a;
 });
}

function selections(phase,stage,methods,group){
 if(phase===4)return [];
 if(phase===5)return ['read'];
 if(phase===6)return ['think'];
 if(phase===0)return ['read','think'];
 if(phase===3)return ['visualize','synthesize'];
 if(phase===7)return ['discuss','synthesize'];
 if(['exploration','proposal'].includes(stage))return phase===1?['read','think']:['visualize','write'];
 if(['writing','revision'].includes(stage))return phase===1?['visualize','write']:['read','synthesize'];
 if(stage==='defense')return phase===1?['visualize','discuss']:['think','synthesize'];
 if(stage==='archiving')return ['synthesize','write'];
 const computing=methods.some(m=>['computation','secondary_data'].includes(m))||(!methods.length&&group==='engineering');
 const empirical=methods.some(m=>['wet_lab','field','clinical','survey','practice'].includes(m));
 if(phase===1){
  if(stage==='collection'||stage==='pilot')return [empirical?'experiment':computing?'code':'read','synthesize'];
  return [computing?'code':empirical&&stage==='general'?'experiment':'reproduce','visualize'];
 }
 return [computing?'reproduce':empirical&&stage==='collection'?'experiment':'reproduce','think'];
}

export function attachActivities(task,{day,group,stage='general',methods=[],context=null}){
 const library=activityLibrary(group,{stage});
 const operations=selections(day.phase,stage,methods,group).map(id=>{
  const a=clone(library.find(x=>x.id===id));
  a.optional=!day.working;a.context=context?clone(context):null;
  if(!day.working){
   a.title=id==='read'?bi('可选轻读：留一个线索','Optional light reading: keep one lead'):bi('可选接续：想清下一小步','Optional restart: clarify one next step');
   a.steps=id==='read'?[bi('有余力时浏览一段相关材料，记录出处','If you have capacity, browse a short related passage and note its source'),bi('只留一个问题或可继续阅读的位置','Keep just one question or a place to resume')]:[bi('看看下一次工作的输入是否齐全','Check whether the inputs for next time are ready'),bi('写一句从哪里接着做，其余时间可以留白','Write one line about where to resume and leave room for rest')];
   a.output=id==='read'?bi('一条阅读线索','One reading lead'):bi('一句接续提示','A one-line restart note');
   a.check=bi('下次能从这条记录接着做即可','The note is enough if it helps you resume next time');
  }
  return a;
 });
 return {...task,operations};
}

export function buildWeekFocus({days,tracks,goal,question,userFocus=''}){
 const all=tracks.flatMap(s=>s.week.flatMap(t=>t.operations??[]));
 const kinds=[...new Set(all.map(a=>a.id))];
 const selected=tracks.map(s=>s.week.find((t,i)=>days[i].phase===1&&t.operations?.length)??s.week.find(t=>t.operations?.length)??s.week[0]);
 const featured=selected.flatMap(task=>task.operations?.length?task.operations.map(a=>a.output):[task.output]);
 const distinctOutputs=[...new Map(featured.map(o=>[o.zh,o])).values()];
 const priorities=tracks.map((s,i)=>{const action=selected[i].action;return bi(s.name.zh+'：'+action.zh,s.name.en+': '+action.en);});
 return {kind:'workflow_suggestion',user_focus:userFocus,goal:clone(goal),priorities,deliverables:clone(distinctOutputs),
  questions:[clone(question),bi('哪些结论已经有直接证据，哪些还需要核查？','Which claims have direct evidence, and which still need checking?'),bi('若关键材料或反馈暂未到位，哪一步能独立推进？','If key inputs or feedback are delayed, which step can proceed independently?')],
  action_map:kinds.map(id=>({id,name:clone(category(id).name),dates:days.filter((d,i)=>tracks.some(s=>s.week[i].operations?.some(a=>a.id===id))).map(d=>d.date)}))};
}

export function validateActivities(items,{library=false}={}){
 const isBi=x=>x&&typeof x.zh==='string'&&typeof x.en==='string';
 const bad=()=>{throw Error('Invalid saved research activity');};
 if(!Array.isArray(items)||items.length>(library?9:2)||new Set(items.map(x=>x.id)).size!==items.length)bad();
 for(const a of items){
  if(!category(a.id)||!['title','category','output','check'].every(k=>isBi(a[k]))||typeof a.icon!=='string'||!Array.isArray(a.steps)||a.steps.length<2||!a.steps.every(isBi))bad();
  if(!library&&(typeof a.optional!=='boolean'||a.context!==null&&!isBi(a.context)))bad();
 }
 return true;
}

export function validateWeekFocus(f,days){
 if(f===undefined)return true;
 const bi=x=>x&&typeof x.zh==='string'&&typeof x.en==='string';
 const valid=f&&f.kind==='workflow_suggestion'&&typeof f.user_focus==='string'&&bi(f.goal)&&['priorities','deliverables','questions'].every(k=>Array.isArray(f[k])&&f[k].every(bi));
 if(!valid||!Array.isArray(f.action_map)||new Set(f.action_map.map(x=>x.id)).size!==f.action_map.length)throw Error('Invalid saved weekly focus');
 const dates=new Set(days.map(d=>d.date));
 for(const a of f.action_map)if(!category(a.id)||!bi(a.name)||!Array.isArray(a.dates)||a.dates.some(d=>!dates.has(d))||new Set(a.dates).size!==a.dates.length)throw Error('Invalid saved weekly focus dates');
 return true;
}
