import {EclipticGeoMoon,Ecliptic,GeoVector,Body} from 'astronomy-engine';
import {readFileSync} from 'node:fs';
export const astronomyVersion=JSON.parse(readFileSync(new URL('../node_modules/astronomy-engine/package.json',import.meta.url),'utf8')).version;
export const signs=['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
const glyphs=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const prompts=[
 '把提交步骤列成短清单，依次完成。','先整理文件与版本，再稳妥提交。','让摘要与投稿信清楚传达核心贡献。',
 '为提交留出安静的时间，逐项确认材料。','在投稿信中清晰呈现工作的亮点。','核对格式、图表编号和作者信息。',
 '检查论点与证据的对应关系，保持表达平衡。','集中检查关键结论和支撑材料。','回看研究主线，让贡献表达完整。',
 '按计划完成检查、提交与回执归档。','突出研究的新意，同时说明适用范围。','通读全文，照顾叙述的连贯与细节。'
];
export function normalizeAngle(n){return ((n%360)+360)%360;}
export function signAt(longitude){if(!Number.isFinite(longitude))throw Error('Invalid longitude');const i=Math.floor(normalizeAngle(longitude)/30);return {name:signs[i],glyph:glyphs[i],prompt:prompts[i]};}
export function mercuryMotion(speed){return Math.abs(speed)<0.02?'stationary':speed<0?'retrograde':'direct';}
const mercuryLongitude=d=>Ecliptic(GeoVector(Body.Mercury,d,true)).elon;
export function astrologyAt(timestamp,personalSign){
 const date=new Date(timestamp);if(!Number.isFinite(+date))throw Error('Invalid astrology timestamp');
 const year=date.getUTCFullYear();if(year<1900||year>2100)return null;
 const moonLongitude=normalizeAngle(EclipticGeoMoon(date).lon),moon=signAt(moonLongitude);
 const before=mercuryLongitude(new Date(+date-21600000)),after=mercuryLongitude(new Date(+date+21600000));
 const speed=(normalizeAngle(after-before+180)-180)/0.5,motion=mercuryMotion(speed);
 const personalIndex=signs.indexOf(personalSign);
 return {
  method:'tropical-geocentric-v1',at_utc:date.toISOString(),engine:'astronomy-engine',engine_version:astronomyVersion,
  source_url:'https://github.com/cosinekitty/astronomy',
  moon:{longitude_degrees:moonLongitude,sign:moon.name,glyph:moon.glyph},
  mercury:{longitude_degrees:normalizeAngle(mercuryLongitude(date)),speed_degrees_per_day:speed,motion},
  personal:personalIndex>=0?{sign:personalSign,glyph:glyphs[personalIndex],basis:'user_supplied'}:null,
  interpretation:{kind:'cultural_reflection',moon:moon.prompt,mercury:motion==='direct'?'清晰表达贡献，按顺序完成投稿材料。':motion==='retrograde'?'把这次提交当作一次精细复核，确认版本、附件与回执。':'留出从容的核对时间，逐项确认后再提交。',personal:personalIndex>=0?prompts[personalIndex]:null},
  convention:'回归黄道十二等分；月亮采用地心当日黄道经度。水星以点击时刻前后各 6 小时的经度差估算日速度；绝对值小于 0.02°/日记为近留。'
 };
}
