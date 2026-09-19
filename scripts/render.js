import {baguaForDirection} from './bagua.js';
import {DateTime} from 'luxon';
const safe=x=>String(x??'—').replace(/[|<>\r\n]/g,' ');
const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
export function render(report,language=report.preferences?.language??'zh',depth=report.preferences?.depth??'brief'){
 const zh=language==='zh', title=zh?'科研黄历 · 投稿择日':'Research Almanac · Submission Timing',lines=['# '+title,'', '**'+(zh?'状态':'Status')+'**: '+report.status,''];
 if(report.mode==='project'){
 lines.push('**'+safe(report.project_summary.title)+'** · '+safe(report.timezone),'',
 '| # | '+(zh?'操作窗口':'Operation window')+' | '+(zh?'建议点击':'Suggested click')+' | '+(zh?'方位参考':'Direction reference')+' | '+(zh?'准备状态':'Readiness')+' |','|---|---|---|---|---|');
 for(const c of report.recommendations)lines.push('| '+c.rank+' | '+safe(c.local_start)+' → '+safe(c.local_end)+' | '+safe(c.local_click)+' | '+safe(c.direction?.name)+' | '+c.readiness_status+' |');
 lines.push('',zh?'方位来自日家喜神规则；面向建议属于现代文化类比，不是文昌位或奇门盘。':'Direction uses the daily Xi-shen convention; facing it is a modern cultural analogy, not Wenchang or Qimen.',
 '',zh?'可说：“选第一个”“比较一和二”“周三上午不行”“展开依据”。':'Ask: “Select the first”, “Compare one and two”, “Exclude Wednesday morning”, or “Show sources”.');
 if(report.readiness.conditions?.length)lines.push('',zh?'## 提交前条件':'## Before submission',...report.readiness.conditions.map(x=>'- '+safe(x)));
 if(depth==='detailed')for(const c of report.recommendations)lines.push('','## '+(zh?'候选 ':'Candidate ')+c.rank,
 '- '+c.cultural_reasons.map(x=>safe(x.text)).join('; '),'- '+(zh?'截止余量（分钟）':'Deadline margin (minutes)')+': '+safe(c.deadline_margin_minutes),
 '- ID: '+c.candidate_id);
 for(const candidate of report.recommendations){
 const b=baguaForDirection(candidate.direction);if(!b)continue;
 lines.push('', '### '+(zh?'窗口 ':'Window ')+candidate.rank+' · '+b.symbol+' '+(zh?b.name+'卦':b.id.toUpperCase())+' · '+(zh?b.direction:b.direction_en),
 '', '**'+(zh?'经典原文':'Classical text')+'** — '+b.quote_locator, '> '+b.quote,
 '> '+b.nature_quote+'（'+b.nature_locator+'）',
 '', '**'+(zh?'白话解释':'Meaning (project paraphrase)')+'**: '+(zh?b.meaning:b.meaning_en),
 '', '**'+(zh?'投稿启示 · 现代解读':'Submission reflection · Modern interpretation')+'**: '+(zh?b.application:b.application_en),
 '', '['+b.source.title+']('+b.source.url+') · '+(zh?b.convention:b.convention_en));
 }
 if(report.missing_inputs.length)lines.push('',(zh?'待补信息：':'Missing: ')+report.missing_inputs.join(', '));
 if(!report.recommendations.length)lines.push('',JSON.stringify(report.excluded_summary));
 }
 const c=report.cultural_result;
 if(c?.text)lines.push('',zh?'## 文化解读':'## Cultural reflection','', '> '+c.text,'', c[zh?'zh':'en'],'',c.locator+' · '+c.source_id);
 else if(c)lines.push('', '## Reading', '', '~~~json',JSON.stringify(c,null,2),'~~~');
 if(depth==='detailed')lines.push('','## Sources','',...report.sources.map(s=>'- '+(s.url?'['+safe(s.title)+']('+s.url+')':safe(s.title))+' — '+s.scope));
 lines.push('',zh?'文化解释不表示录用概率；以材料准备、实际截止和投稿要求为准。':report.notice);
 return lines.join('\n')+'\n';
}
const icsEscape=s=>String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
const stamp=s=>DateTime.fromISO(s,{setZone:true}).toUTC().toFormat("yyyyMMdd'T'HHmmss'Z'");
function fold(line){let out='',part='';for(const c of line){if(Buffer.byteLength(part+c)>73){out+=part+'\r\n ';part=c;}else part+=c;}return out+part;}
export function exportIcs(report){
 if(report.mode!=='project'||!report.recommendations.length)throw new Error('No project windows to export');
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Zhouyi Submit Advisor//EN','CALSCALE:GREGORIAN'];
 for(const c of report.recommendations)lines.push('BEGIN:VEVENT','UID:'+report.run_id+'-'+c.candidate_id+'@zhouyi-local',
 'DTSTAMP:'+stamp(report.generated_at),'DTSTART:'+stamp(c.start_utc),'DTEND:'+stamp(c.end_utc),
 'SUMMARY:'+icsEscape('Candidate / 候选: '+report.project_summary.title),
 'DESCRIPTION:'+icsEscape('Click: '+c.local_click+'\nDirection: '+(c.direction?.name??'unavailable')+'\nCultural reference only. Not a confirmed submission or scheduled reminder.'),
 'END:VEVENT');
 lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
}
export function directionSvg(direction){
 const dirs=[['北',160,24],['东北',252,60],['东',286,154],['东南',250,252],['南',160,285],['西南',66,252],['西',30,154],['西北',67,60]];
 const name=direction?.name??'',clean=name.replace('正','');
 return '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="340" viewBox="0 0 320 340"><rect width="320" height="340" rx="20" fill="#f7f3e8"/><circle cx="160" cy="154" r="103" fill="none" stroke="#1c665a"/><path d="M160 55V253M61 154H259" stroke="#b7c7b8"/>'+
 dirs.map(([s,x,y])=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" font-family="sans-serif" font-size="18" fill="'+(s===clean?'#ae5527':'#203b35')+'">'+s+'</text>').join('')+
 '<text x="160" y="147" text-anchor="middle" font-family="sans-serif" font-size="19">'+esc(name||'暂缺')+'</text><text x="160" y="174" text-anchor="middle" font-family="sans-serif" font-size="11">日家喜神 · 现代面向类比</text><text x="160" y="320" text-anchor="middle" font-family="sans-serif" font-size="11">固定北向示意 · Not a live compass</text></svg>';
}

