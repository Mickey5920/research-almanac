import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {readFileSync} from 'node:fs';
import {instant} from './core.js';
import {signAt,mercuryMotion} from './astrology.js';
const ajv=new Ajv({allErrors:true,strict:false});addFormats(ajv);
const schema=JSON.parse(readFileSync(new URL('../schemas/output.schema.json',import.meta.url),'utf8'));
const validate=ajv.compile(schema);
export function validateReport(r){
 if(!validate(r))throw new Error('Invalid report: '+ajv.errorsText(validate.errors));
 if(r.timing_policy&&r.timing_policy.target.trim().toLowerCase()!==r.project_summary?.target?.trim().toLowerCase())throw Error('Timing policy target mismatch');
 const ids=new Set(r.sources.map(s=>s.id));
 for(const c of r.recommendations){
  if(c.astrology){
   const a=c.astrology;
   if(+instant(a.at_utc)!==+instant(c.click_at_utc))throw Error('Astrology timestamp mismatch');
   if(signAt(a.moon.longitude_degrees).name!==a.moon.sign)throw Error('Moon sign mismatch');
   if(mercuryMotion(a.mercury.speed_degrees_per_day)!==a.mercury.motion)throw Error('Mercury motion mismatch');
  }
  if(c.zodiac_timing&&c.zodiac_timing.personal_sign!==c.astrology?.personal?.sign)throw Error('Personal zodiac analysis mismatch');
  if(!(instant(c.start_utc)<=instant(c.click_at_utc)&&instant(c.click_at_utc)<instant(c.end_utc)))throw new Error('Invalid candidate time order');
  for(const [local,utc] of [['local_start','start_utc'],['local_end','end_utc'],['local_click','click_at_utc']])if(+instant(c[local])!==+instant(c[utc]))throw new Error('Local/UTC mismatch');
  for(const reason of [...c.practical_reasons,...c.cultural_reasons,...(c.direction?[c.direction]:[])])if(!ids.has(reason.source_id))throw new Error('Unknown source reference');
 }
 if(r.mode==='project'&&!r.recommendations.length&&r.status==='ok')throw new Error('Empty successful recommendation');
 return true;
}
