import {mkdirSync,cpSync,existsSync,readdirSync,writeFileSync,readFileSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('..',import.meta.url));
const version=JSON.parse(readFileSync(join(root,'package.json'),'utf8')).version;
const target=resolve(root,'dist',version,'zhouyi-paper-submit-advisor');
if(existsSync(target))throw new Error('Release folder exists; preserve it and choose a new version before exporting again.');
const allowed=['SKILL.md','README.md','README.en.md','README.zh-CN.md','LICENSE','THIRD_PARTY_NOTICES.md','package.json','package-lock.json','.gitignore','.gitattributes','.github','agents','assets','config','data','docs','examples','references','schemas','scripts','tests','web'];
mkdirSync(target,{recursive:true});
for(const p of allowed)cpSync(join(root,p),join(target,p),{recursive:true,errorOnExist:true});
const sums=[];
function walk(dir,rel=''){for(const name of readdirSync(dir)){const p=join(dir,name),r=(rel?rel+'/':'')+name;if(statSync(p).isDirectory())walk(p,r);else sums.push(createHash('sha256').update(readFileSync(p)).digest('hex')+'  '+r);}}
walk(target);writeFileSync(join(target,'SHA256SUMS.txt'),sums.sort().join('\n')+'\n');console.log(target);
