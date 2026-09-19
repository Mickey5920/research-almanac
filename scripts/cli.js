#!/usr/bin/env node
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {recommend,compare,validateInput,hash} from './core.js';
import {render,exportIcs,directionSvg} from './render.js';
import {selectPlan,amendInput,reviewPlan,recordSubmission,backplan} from './plans.js';
import {validateReport} from './validate-report.js';
import {publishAgentReport,exportLocalHistory,defaultHistoryDir} from './report-html.js';
import {weekly,validateWeeklyInput,validateWeeklyReport} from './weekly.js';
import {publishWeeklyReport,renderWeeklyMarkdown} from './weekly-html.js';
import {profileCatalog} from './research-profile.js';
const args=process.argv.slice(2),cmd=args.shift(),outIndex=args.indexOf('--out');
const out=outIndex>=0?args.splice(outIndex,2)[1]:null;
const historyIndex=args.indexOf('--history-dir');
const historyDir=historyIndex>=0?resolve(args.splice(historyIndex,2)[1]):defaultHistoryDir;
const load=p=>JSON.parse(readFileSync(resolve(p),'utf8').replace(/^\uFEFF/,''));
function save(value){
 if(!out){console.log(JSON.stringify(value,null,2));return;}
 const p=resolve(out);mkdirSync(dirname(p),{recursive:true});
 writeFileSync(p,JSON.stringify(value,null,2)+'\n',{flag:'wx'});console.log(p);
}
try{
 if(cmd==='profile-catalog'){
  save({categories:profileCatalog.categories,specialties:profileCatalog.specialties.map(({id,name,category,group,suggested_method})=>({id,name,category,group,suggested_method})),methods:profileCatalog.methods.map(({id,name})=>({id,name})),stages:profileCatalog.stages.map(({id,name})=>({id,name})),degrees:profileCatalog.degrees,note:profileCatalog.note});
 }else if(cmd==='weekly'){
  if(!args[0])throw new Error('Weekly input JSON required');const input=load(args[0]);validateWeeklyInput(input);
  if(!input.now)input.now=new Date().toISOString();const report=weekly(input);
  if(!out)save(report);else{
   const dir=resolve(out);if(existsSync(dir))throw new Error('Output directory already exists. Use a new run directory.');
   mkdirSync(dir,{recursive:true});
   await publishWeeklyReport(input,report,dir,historyDir);
   writeFileSync(join(dir,'manifest.json'),JSON.stringify({run_id:report.run_id,mode:'weekly',generated_at:report.generated_at,version:report.version,input_hash:hash(input),notice:'Read-only local weekly snapshot with submission timing; no AI connection.'},null,2)+'\n',{flag:'wx'});
   console.log(join(dir,'report.html'));
  }
 }else if(cmd==='recommend'){
  if(!args[0])throw new Error('Input JSON required');const input=load(args[0]);validateInput(input);
  if(!input.now)input.now=new Date().toISOString();const r=recommend(input);validateReport(r);
  if(!out)save(r);else{
   const dir=resolve(out);if(existsSync(dir))throw new Error('Output directory already exists. Use a new run directory.');
   mkdirSync(dir,{recursive:true});writeFileSync(join(dir,'recommendations.json'),JSON.stringify(r,null,2)+'\n');
   writeFileSync(join(dir,'report.md'),render(r));writeFileSync(join(dir,'report.en.md'),render(r,'en'));
   writeFileSync(join(dir,'manifest.json'),JSON.stringify({run_id:r.run_id,generated_at:r.generated_at,versions:r.versions,
    input_hash:hash(input),notice:'Full input and result saved privately in input.json, record.json and local history; report.html is a read-only local snapshot.'},null,2));
   if(r.recommendations.length){writeFileSync(join(dir,'submission-windows.ics'),exportIcs(r));writeFileSync(join(dir,'direction.svg'),directionSvg(r.recommendations[0].direction));}
   await publishAgentReport(input,r,dir,historyDir);
   console.log(join(dir,'report.html'));
  }
 }else if(cmd==='history-html'){
  if(!out)throw new Error('--out HTML path required');mkdirSync(dirname(resolve(out)),{recursive:true});await exportLocalHistory(resolve(out),historyDir);console.log(resolve(out));
 }else if(cmd==='render'){
  const r=load(args[0]);if(r.mode==='weekly')validateWeeklyReport(r);else validateReport(r);
  const text=r.mode==='weekly'?renderWeeklyMarkdown(r,args[1]??'zh'):render(r,args[1]??'zh',args[2]??'brief');
  if(out)writeFileSync(resolve(out),text,{flag:'wx'});else console.log(text);
 }else if(cmd==='compare'){
  const r=load(args[0]),a=r.recommendations[Number(args[1])-1],b=r.recommendations[Number(args[2])-1];
  if(!a||!b)throw new Error('Use two candidate ranks');save(compare(r,a.candidate_id,b.candidate_id));
 }else if(cmd==='select'){
  const r=load(args[0]);validateReport(r);const c=r.recommendations[Number(args[1])-1];if(!c)throw new Error('Candidate rank missing');
  save(selectPlan(r,c.candidate_id));
 }else if(cmd==='patch'){save(amendInput(load(args[0]),load(args[1])).input);
 }else if(cmd==='review'){save(reviewPlan(load(args[0]),args[1]?load(args[1]):null));
 }else if(cmd==='submitted'){save(recordSubmission(load(args[0]),load(args[1])));
 }else if(cmd==='backplan'){const x=load(args[0]);save(backplan(x.tasks,x.finish_at,x.availability,x.now));
 }else if(cmd==='reminder-status'){save({status:'unavailable',reason:'Use an available host reminder tool with explicit authorization. No reminder was created.'});
 }else if(cmd==='validate-weekly'){validateWeeklyInput(load(args[0]));console.log('Valid weekly input');
 }else if(cmd==='validate'){validateInput(load(args[0]));console.log('Valid input');
 }else{
 console.log('Research Almanac 0.13.0\nCommands:\n profile-catalog\n weekly weekly-input.json --out runs/new-week\n validate-weekly weekly-input.json\n history-html --out runs/history-new.html [--history-dir PRIVATE-DIR]\n recommend input.json --out runs/new-run\n render report.json [zh|en] [brief|detailed]\n compare report.json 1 2\n select report.json 1 --out runs/plan.json\n patch input.json patch.json --out runs/updated-input.json\n review plan.json [updated-input.json] --out runs/reviewed-plan.json\n submitted plan.json confirmation.json --out runs/submitted-plan.json\n backplan tasks.json\n validate input.json\n reminder-status\nAll --out destinations must be new. Calendar export does not create reminders.');
 if(cmd&&cmd!=='help'&&cmd!=='--help')process.exitCode=1;
 }
}catch(error){console.error('Error: '+error.message);process.exitCode=1;}
