import {readFileSync} from 'node:fs';
export const baguaLibrary=JSON.parse(readFileSync(new URL('../data/bagua.json',import.meta.url),'utf8'));
export function baguaForDirection(direction){
 const aliases={正北:'北',正东:'东',正南:'南',正西:'西'};
 const name=typeof direction==='string'?direction:direction?.name;
 const canonical=Object.hasOwn(aliases,name??'')?aliases[name]:name;
 const item=baguaLibrary.trigrams.find(t=>t.direction===canonical);
 return item?structuredClone({...item,source:baguaLibrary.source,convention:baguaLibrary.convention,convention_en:baguaLibrary.convention_en}):null;
}
