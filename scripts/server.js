import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {recommend,validateInput} from './core.js';
import {validateReport} from './validate-report.js';
import {HistoryStore} from './history-store.js';
import {formToInput} from './web-input.js';
import {renderHistoryHtml} from './report-html.js';
const root=fileURLToPath(new URL('..',import.meta.url));
const version=JSON.parse(await readFile(join(root,'package.json'),'utf8')).version;
const assets=new Map([['/workbench',['web/index.html','text/html; charset=utf-8']],['/app.js',['web/app.js','text/javascript; charset=utf-8']],['/style.css',['web/style.css','text/css; charset=utf-8']]]);
const escapeJson=x=>JSON.stringify(x).replace(/</g,'\\u003c');
async function body(req){
 const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1024*1024)throw new Error('输入超过 1 MB 限制。');chunks.push(chunk);}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new Error('JSON 格式错误。');}
}
export async function snapshotHtml(records){
 const [html,css,js]=await Promise.all(['web/index.html','web/style.css','web/app.js'].map(p=>readFile(join(root,p),'utf8')));
 return html.replace('<link rel="stylesheet" href="/style.css">',()=>'<style>'+css+'</style>')
 .replace('<script src="/app.js" defer></script>',()=>'<script>window.__SNAPSHOT__='+escapeJson({records,warnings:[],version})+';</script><script>'+js+'</script>');
}
export function createServer({dataDir=join(root,'.local-data','history')}={}){
 const store=new HistoryStore(dataDir),token=randomUUID();
 const server=http.createServer(async(req,res)=>{
  const port=server.address()?.port,host='127.0.0.1:'+port;
  const allowedHosts=[host,'localhost:'+port],expectedOrigins=allowedHosts.map(x=>'http://'+x);
  const send=(code,value,type='application/json; charset=utf-8')=>{
   res.writeHead(code,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'});
   res.end(typeof value==='string'||Buffer.isBuffer(value)?value:JSON.stringify(value));
  };
  try{
   if(!allowedHosts.includes(req.headers.host))return send(403,{error:'仅允许本机访问。'});
   if(req.headers.origin&&!expectedOrigins.includes(req.headers.origin))return send(403,{error:'跨站请求被拒绝。'});
   const path=new URL(req.url,'http://'+host).pathname;
   if(req.method==='GET'&&path==='/'){const history=await store.list();return send(200,await renderHistoryHtml({...history,current_record_id:history.records[0]?.record_id}),'text/html; charset=utf-8');}
   if(req.method==='GET'&&assets.has(path)){const [file,type]=assets.get(path);return send(200,await readFile(join(root,file)),type);}
   if(req.method==='GET'&&path==='/api/session')return send(200,{token,version});
   if(req.method==='GET'&&path==='/api/history')return send(200,await store.list());
   if(req.method==='GET'&&path==='/api/export.html'){
    const history=await store.list();if(history.warnings.length)return send(409,{error:'存在无法读取的历史记录，原文件已保留；请先修复后再导出全部历史。'});
    res.setHeader('Content-Disposition','attachment; filename="zhouyi-history.html"');return send(200,await snapshotHtml(history.records),'text/html; charset=utf-8');
   }
   if(req.method==='POST'){
    if(req.headers['x-local-token']!==token)return send(403,{error:'页面会话已失效，请刷新后重试。'});
    if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'需要 JSON 请求。'});
    const b=await body(req);
    if(path==='/api/generate'){
     if((b.input!==undefined)===(b.form!==undefined))throw new Error('请提供表单或 JSON 输入之一。');
     const input=b.form?formToInput(b.form):structuredClone(b.input);
     validateInput(input);if(!input.now)input.now=new Date().toISOString();
     const report=recommend(input);validateReport(report);
     const parent=b.parent_record_id??null;if(parent!==null&&!/^[a-f0-9-]{36}$/.test(parent))throw new Error('历史引用格式错误。');
     const record=await store.add({input,report,source:'web',parent_record_id:parent});
     return send(201,{record});
    }
    if(path==='/api/import'){
     const record=b.report?b:{report:b,input:null};validateReport(record.report);
     if(record.input)validateInput(record.input);
     const saved=await store.add({input:record.input??null,report:record.report,source:record.input?'import':'legacy-import'});
     return send(201,{record:saved});
    }
   }
   return send(404,{error:'未找到请求内容。'});
  }catch(error){return send(400,{error:error.message});}
 });
 return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const port=Number(process.env.PORT??4318);
 if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('PORT must be between 1024 and 65535');
 const server=createServer();
 server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'端口已占用；设置 PORT 后重试。':e.message);process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>console.log('Zhouyi workspace: http://127.0.0.1:'+port));
}
