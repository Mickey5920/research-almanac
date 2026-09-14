import {readFileSync,readdirSync,statSync,existsSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const required=['SKILL.md','README.md','README.zh-CN.md','LICENSE','package-lock.json','docs/PROJECT-GUIDE.md','docs/IMPLEMENTATION.md','docs/WORKBENCH.md','assets/interface/cosmic-luopan-v1.png','web/report.css','web/report.html','web/report.js','scripts/report-html.js','web/index.html','web/app.js','web/style.css','scripts/server.js','assets/marketing/hero.png','assets/marketing/poster.zh.png'];
for(const p of required)if(!existsSync(join(root,p)))throw new Error('Missing '+p);
const skip=new Set(['node_modules','runs','.local-data','.git','.cache','dist']);
let count=0,links=0;
function walk(dir){for(const name of readdirSync(dir)){if(skip.has(name))continue;const p=join(dir,name);if(statSync(p).isDirectory()){walk(p);continue;}count++;
 if(!/\.(md|json|js|yml|yaml)$/.test(name))continue;const text=readFileSync(p,'utf8');
 if(name.endsWith('.json'))JSON.parse(text);
 if(name.endsWith('.md'))for(const m of text.matchAll(/!?\[[^\]]*\]\(([^)]+)\)|href="([^"]+)"/g)){
  const url=(m[1]??m[2]).split('#')[0];if(!url||/^(https?:|mailto:)/.test(url))continue;
  if(!existsSync(resolve(dirname(p),decodeURIComponent(url))))throw new Error('Broken local link in '+p+': '+url);links++;
 }
 if(/(?:C:\\Users\\|D:\\ObsidianVaults\\|sk-[A-Za-z0-9]{20,})/.test(text))throw new Error('Machine-specific or secret-like content in '+p);
}}
walk(root);console.log('Package checks passed: '+count+' files, '+links+' local links.');
