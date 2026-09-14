import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {validateInput} from './core.js';
import {validateReport} from './validate-report.js';

export class HistoryStore {
 constructor(directory){this.directory=directory;}
 async list(){
  await mkdir(this.directory,{recursive:true});
  const names=(await readdir(this.directory)).filter(n=>/^[a-f0-9-]{36}\.json$/.test(n));
  const records=[],warnings=[];
  for(const name of names){try{
   const item=JSON.parse(await readFile(join(this.directory,name),'utf8'));
   validateReport(item.report);if(item.input)validateInput(item.input);
   if(item.record_id+'.json'!==name||item.history_version!==1||typeof item.created_at!=='string'||!Number.isFinite(Date.parse(item.created_at)))throw new Error('Invalid record metadata');
   records.push(item);
  }catch{warnings.push('一条历史记录无法读取，原文件已保留：'+name);}}
  records.sort((a,b)=>b.created_at.localeCompare(a.created_at)||b.record_id.localeCompare(a.record_id));
  return {records,warnings};
 }
 async add({input=null,report,source='web',parent_record_id=null}){
  validateReport(report);if(input)validateInput(input);
  const record={history_version:1,record_id:randomUUID(),created_at:new Date().toISOString(),
   source,parent_record_id,input:input?structuredClone(input):null,report:structuredClone(report)};
  await mkdir(this.directory,{recursive:true});
  await writeFile(join(this.directory,record.record_id+'.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
  return record;
 }
}
