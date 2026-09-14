import {DateTime,IANAZone} from 'luxon';
import {resolveRange,validateInput} from './core.js';
function wall(text,zone){
 const d=DateTime.fromISO(text,{zone});
 if(!d.isValid||d.toFormat("yyyy-MM-dd'T'HH:mm")!==text)throw new Error('日期时间无效，或处于夏令时不存在的时刻。');
 if(d.getPossibleOffsets().length!==1)throw new Error('该时间因夏令时重复，请在 JSON 输入中明确时区偏移。');
 return d;
}
export function formToInput(f,now=DateTime.utc()){
 if(!f||typeof f!=='object')throw new Error('需要输入表单。');
 const zone=f.timezone??'Asia/Shanghai';if(!IANAZone.isValidZone(zone))throw new Error('无效的 IANA 时区。');
 const input={schema_version:'1.1',mode:'project',now:now.toUTC().toISO(),timezone:zone,
 project:{title:String(f.title??'').trim(),stage:f.stage??'initial',target:String(f.target??'').trim(),manuscript_version:String(f.manuscript_version??'').trim()},
 readiness:{status:f.readiness??'unknown',conditions:String(f.conditions??'').split('\n').map(s=>s.trim()).filter(Boolean)},
 range:f.range_mode==='custom'?{mode:'custom',start_date:f.start_date,end_date_exclusive:f.end_date?DateTime.fromISO(f.end_date,{zone}).plus({days:1}).toISODate():undefined}:{mode:f.range_mode??'next_week'},
 preferences:{count:Number(f.count??3),operation_minutes:Number(f.operation_minutes??30),click_offset_minutes:Number(f.click_offset_minutes??10),buffer_hours:Number(f.buffer_hours??24),buffer_mode:f.buffer_mode??'soft',strict_traditional:Boolean(f.strict_traditional),language:'zh'},
 deadline:{status:f.deadline_status??'unknown'}};
 if(f.deadline_status==='set'){input.deadline={status:'user_supplied',at:wall(f.deadline_at,zone).toISO(),source:'用户在本地工作台填写，未经外部核验'};}
 if(f.ready_after)input.readiness.ready_after=wall(f.ready_after,zone).toISO();
 const range=resolveRange(input,now);
 const from=f.day_start??'09:00',until=f.day_end??'18:00';
 if(!/^\d{2}:\d{2}$/.test(from)||!/^\d{2}:\d{2}$/.test(until)||from>=until)throw new Error('每日结束时间必须晚于开始时间；跨夜时段请使用 JSON。');
 if(!Array.isArray(f.weekdays)||!f.weekdays.length||f.weekdays.some(x=>!Number.isInteger(x)||x<1||x>7))throw new Error('请选择至少一个可用星期。');
 input.availability=[];
 for(let d=range.start.startOf('day');d<range.end;d=d.plus({days:1})){
  if(!f.weekdays.includes(d.weekday))continue;
  input.availability.push({start:wall(d.toISODate()+'T'+from,zone).toISO(),end:wall(d.toISODate()+'T'+until,zone).toISO()});
 }
 validateInput(input);return input;
}

