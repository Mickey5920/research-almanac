import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {HistoryStore} from './history-store.js';
import {windowReasons} from './window-reasons.js';
export const defaultHistoryDir=fileURLToPath(new URL('../.local-data/history/',import.meta.url));
export async function renderHistoryHtml({records,warnings=[],current_record_id=null}){
 const [template,baseCss,js,reportCss]=await Promise.all(['report.html','style.css','report.js','report.css'].map(p=>readFile(new URL('../web/'+p,import.meta.url),'utf8')));
 const pageArt=await readFile(new URL('../assets/interface/celestial-page-v1.png',import.meta.url));
 const css=baseCss+'\n'+reportCss+'\n:root{--page-art:url("data:image/png;base64,'+pageArt.toString('base64')+'")}';
 const art=await readFile(new URL('../assets/interface/observatory-luopan-v2.png',import.meta.url));
 const reference_library=JSON.parse(await readFile(new URL('../data/reference-library.json',import.meta.url),'utf8'));
 const explanations=Object.fromEntries(records.map(r=>[r.record_id,Object.fromEntries((r.report.recommendations??[]).map(c=>[c.candidate_id,windowReasons(r,c)]))]));
 const payload=JSON.stringify({records,warnings,current_record_id,explanations,reference_library}).replace(/</g,'\\u003c');
 return template.replace('<!-- STYLE -->',()=>'<style>'+css+'</style>')
 .replace('<!-- HERO_ART -->',()=>'<img class="hero-art" alt="" aria-hidden="true" src="data:image/png;base64,'+art.toString('base64')+'">')
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
