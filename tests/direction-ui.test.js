import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../web/report.js',import.meta.url),'utf8');
class Element{
 constructor(tag){this.tag=tag;this.attrs={};this.children=[];}
 setAttribute(k,v){this.attrs[k]=String(v);}
 append(...nodes){this.children.push(...nodes);}
 prepend(...nodes){this.children.unshift(...nodes);}
}
function panel(name){
 const document={
  getElementById:()=>({textContent:'{"records":[]}'}),
  createElement:tag=>new Element(tag),
  createElementNS:(_,tag)=>new Element(tag)
 };
 const context={document,result:null,name};
 vm.runInNewContext(source.split('function reasonPanel')[0]+'result=directionPanel(name===null?null:{name});})();',context);
 return context.result;
}
function all(n){return [n,...n.children.flatMap(all)];}
test('fixed-north compass maps all eight saved directions to clockwise bearings',()=>{
 for(const [name,angle] of [['北',0],['东北',45],['东',90],['东南',135],['南',180],['西南',225],['西',270],['西北',315]]){
  const p=panel(name),nodes=all(p);
  assert.ok(nodes.some(n=>n.tag==='g'&&n.attrs.transform==='rotate('+angle+' 90 90)'));
  assert.ok(nodes.some(n=>n.tag==='text'&&n.textContent===name&&n.attrs.class.includes('selected')));
  assert.ok(p.attrs['aria-label'].includes(angle+'度'));
  assert.equal(nodes.filter(n=>n.tag==='li').length,3);
 }
});
test('unknown and missing directions never produce a compass or an invented bearing',()=>{
 for(const name of [null,'','暂缺','__proto__','未知'])assert.equal(panel(name),null);
});
test('cardinal aliases from the calendar render their bearing and highlight canonical labels',()=>{
 for(const [name,key,angle] of [['正北','北',0],['正东','东',90],['正南','南',180],['正西','西',270]]){
  const p=panel(name),nodes=all(p);
  assert.ok(p.attrs['aria-label'].includes(name+'，'+angle+'度'));
  assert.ok(nodes.some(n=>n.tag==='g'&&n.attrs.transform==='rotate('+angle+' 90 90)'));
  assert.ok(nodes.some(n=>n.tag==='text'&&n.textContent===key&&n.attrs.class.includes('selected')));
 }
});
