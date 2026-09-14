import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {HistoryStore} from './history-store.js';
export const defaultHistoryDir=fileURLToPath(new URL('../.local-data/history/',import.meta.url));
export async function renderHistoryHtml({records,warnings=[],current_record_id=null}){
 const [template,css,js]=await Promise.all(['report.html','style.css','report.js'].map(p=>readFile(new URL('../web/'+p,import.meta.url),'utf8')));
 const payload=JSON.stringify({records,warnings,current_record_id}).replace(/</g,'\\u003c');
 return template.replace('<!-- STYLE -->',()=>'<style>'+css+'</style>')
 .replace('<!-- DATA -->',()=>'<script id="local-records" type="application/json">'+payload+'</script>')
 .replace('<!-- SCRIPT -->',()=>'<script>'+js+'</script>');
}
export async function publishAgentReport(input,report,outDir,historyDir=defaultHistoryDir){
 const store=new HistoryStore(historyDir);
 const record=await store.add({input,report,source:'agent'});
 const history=await store.list();
 const html=await renderHistoryHtml({...history,current_record_id:record.record_id});
 await writeFile(join(outDir,'input.json'),JSON.stringify(input,null,2)+'\n',{flag:'wx'});
 await writeFile(join(outDir,'record.json'),JSON.stringify(record,null,2)+'\n',{flag:'wx'});
 await writeFile(join(outDir,'report.html'),html,{flag:'wx'});
 return record;
}
export async function exportLocalHistory(out,historyDir=defaultHistoryDir){
 const history=await new HistoryStore(historyDir).list();
 await writeFile(out,await renderHistoryHtml(history),{flag:'wx'});
}

