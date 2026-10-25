import {validateJournal} from './journal.js';
import {DEFAULT_WEEK,schoolDay} from './schedule.js';
export const CATEGORIES = ['질병', '미인정', '기타', '출석인정'];
export const TYPES = ['결석', '지각', '조퇴', '결과'];
export const ALL_SLOTS = ['조회', '1', '2', '3', '4', '5', '6', '7', '8', '종례'];
export const slotLabel = s => /^\d$/.test(s) ? `${s}교시` : s;
export function sortedStudents(students){return students.filter(s=>s.active).sort((a,b)=>Number(!!b.favorite)-Number(!!a.favorite)||a.no-b.no);}
export const today = () => localDate(new Date());
export function localDate(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function validDate(s) { return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && localDate(new Date(`${s}T12:00:00`)) === s; }
export function slotsFor(settings) { return ALL_SLOTS.filter(s => s !== '8' || settings.periods === 8); }
export function defaults() {
  const symbols = {};
  TYPES.forEach((t,i) => CATEGORIES.forEach((c,j) => { symbols[`${c}:${t}`] = [['○','⊗','/','△'],['◇','◁','□','△'],['×','▷','/','△'],['○','×','/','△']][i][j]; }));
  return { format:'neisatt', version:1, scope:'backup', settings:{year:new Date().getFullYear(),grade:2,classNo:5,periods:7,weeklyPeriods:[...DEFAULT_WEEK],symbolStyle:'school',school:'',symbols,mapping:{조회:1,'1':2,'2':3,'3':4,'4':5,'5':6,'6':7,'7':8,'8':0,종례:0}}, students:[], events:[], holidays:[],calendar:[], revision:0 };
}
export function upgradeData(original){const d=structuredClone(original);d.settings.weeklyPeriods??=[...DEFAULT_WEEK];d.settings.symbolStyle??='school';d.calendar??=[];return validateData(d);}
function assert(ok,msg) { if (!ok) throw new Error(msg); }
const str = (x,n=2000) => typeof x === 'string' && x.length <= n;
export function validateData(d) {
  assert(d && d.format === 'neisatt' && d.version === 1,'지원하지 않는 파일 형식입니다.');
  assert(['backup','range'].includes(d.scope),'백업/기간 정보가 없습니다.');
  const s = d.settings;
  assert(s && Number.isInteger(s.year) && s.year>=2000 && s.year<=2100 && Number.isInteger(s.grade) && s.grade>=1 && s.grade<=12 && Number.isInteger(s.classNo) && s.classNo>=1 && s.classNo<=99 && [7,8].includes(s.periods) && str(s.school,100),'학급 설정을 확인하세요.');
  if(s.weeklyPeriods!==undefined)assert(Array.isArray(s.weeklyPeriods)&&s.weeklyPeriods.length===7&&s.weeklyPeriods[0]===0&&s.weeklyPeriods[6]===0&&s.weeklyPeriods.slice(1,6).every(n=>Number.isInteger(n)&&n>=1&&n<=8),'요일별 수업은 1~8교시로 설정하세요.');
  if(s.symbolStyle!==undefined)assert(['school','custom'].includes(s.symbolStyle),'기호 방식을 확인하세요.');
  if(d.calendar!==undefined){assert(Array.isArray(d.calendar)&&d.calendar.length<=1000,'날짜별 일정을 확인하세요.');const seen=new Set();for(const row of d.calendar){assert(validDate(row.date)&&!seen.has(row.date)&&['school','event','holiday'].includes(row.kind)&&str(row.label,100)&&Number.isInteger(row.periods)&&(row.kind==='holiday'?row.periods===0:row.periods>=1&&row.periods<=8),'날짜별 일정의 날짜·종류·교시를 확인하세요. 중복 날짜는 사용할 수 없습니다.');assert(row.kind==='holiday'||![0,6].includes(new Date(row.date+'T12:00:00').getDay()),'주말은 수업 일정으로 지정할 수 없습니다.');seen.add(row.date);}}
  for (const t of TYPES) for (const c of CATEGORIES) assert(str(s.symbols?.[`${c}:${t}`],4) && s.symbols[`${c}:${t}`].length,'출석부 기호를 확인하세요.');
  for (const p of ALL_SLOTS) assert(Number.isInteger(s.mapping?.[p]) && s.mapping[p]>=0 && s.mapping[p]<=8,'출석부 칸 매핑을 확인하세요.');
  assert(Array.isArray(d.students) && d.students.length<=100,'학생 명단은 100명까지 가능합니다.');
  const ids=new Set(), nos=new Set();
  for (const st of d.students) {
    assert(st.favorite===undefined||typeof st.favorite==='boolean','즐겨찾기 설정을 확인하세요.');
    assert(str(st.id,100) && st.id && !ids.has(st.id) && Number.isInteger(st.no) && st.no>=1 && st.no<=999 && !nos.has(st.no) && str(st.name,60) && st.name.trim() && typeof st.active==='boolean','학생 번호·이름·ID가 잘못되었거나 중복되었습니다.');
    ids.add(st.id); nos.add(st.no);
  }
  assert(Array.isArray(d.holidays) && d.holidays.length<=1000,'휴일 목록을 확인하세요.');
  const holidayDates=new Set();
  for(const h of d.holidays) { assert(validDate(h.date) && str(h.reason,200) && !holidayDates.has(h.date),'휴일 날짜가 잘못되었거나 중복되었습니다.'); holidayDates.add(h.date); }
  assert(Array.isArray(d.events) && d.events.length<=50000,'기록 목록을 확인하세요.');
  const eids=new Set(), occupied=new Set();
  for(const e of d.events) {
    assert(str(e.id,100) && e.id && !eids.has(e.id) && ids.has(e.studentId) && validDate(e.date) && Number(e.date.slice(0,4))===s.year && CATEGORIES.includes(e.category) && TYPES.includes(e.type) && str(e.reason) && str(e.memo) && str(e.updatedAt,40) && Number.isFinite(Date.parse(e.updatedAt)),'잘못된 출결 기록이 있습니다.');
    assert(Array.isArray(e.slots) && e.slots.length>0 && e.slots.every(p => ALL_SLOTS.includes(p)) && new Set(e.slots).size===e.slots.length,'부재 시간을 확인하세요.');
    eids.add(e.id);
    for(const p of e.slots) { const k=`${e.studentId}|${e.date}|${p}`; assert(!occupied.has(k),`${e.date}: 한 학생의 부재 시간이 겹칩니다.`); occupied.add(k); }
  }
  if(d.scope==='range') assert(validDate(d.range?.start) && validDate(d.range?.end) && d.range.start<=d.range.end && d.events.every(e=>e.date>=d.range.start && e.date<=d.range.end),'내보낸 날짜 범위가 잘못되었습니다.');
  validateJournal(d);return d;
}
export function parseData(text) { assert(text.length<=8_000_000,'파일이 너무 큽니다 (최대 8MB).'); return upgradeData(validateData(JSON.parse(text))); }
export function daysBetween(start,end) {
  assert(validDate(start)&&validDate(end)&&start<=end,'날짜 범위를 확인하세요.');
  assert((new Date(end)-new Date(start))/86400000<=366,'한 번에 최대 1년까지 선택하세요.');
  const dates=[]; const d=new Date(`${start}T12:00:00`);
  while(localDate(d)<=end) {dates.push(localDate(d)); d.setDate(d.getDate()+1);} return dates;
}
export function dayStatus(data,date) {
  const d=schoolDay(data,date);return d.kind==='holiday'?(d.label==='주말'?'주말':`휴일: ${d.label||'휴업일'}`):'';
}
export function plan(data,start,end) {
  return daysBetween(start,end).map(date=>{const events=data.events.filter(e=>e.date===date); return {date,events,skip:dayStatus(data,date)||(events.length?'':'기록 없음')};});
}
export function exportData(data,start,end) {
  daysBetween(start,end);
  return validateData({...structuredClone(data),scope:'range',journal:[],range:{start,end},exportedAt:new Date().toISOString(),events:data.events.filter(e=>e.date>=start && e.date<=end)});
}
export function mergeData(current,incoming) {
  validateData(incoming);
  if(current.students.length===0 && current.events.length===0 && !(current.journal?.length)) return {...structuredClone(incoming),scope:'backup'};
  assert(['year','grade','classNo','school'].every(k=>current.settings[k]===incoming.settings[k]),'학급이 다릅니다. 전체 백업 복원으로만 학급을 바꿀 수 있습니다.');
  const d=structuredClone(current);
  for(const st of incoming.students) {
    const old=d.students.find(s=>s.id===st.id);
    if(old) assert(old.no===st.no && old.name===st.name,'같은 ID의 학생 이름/번호가 다릅니다. 먼저 명단을 확인하세요.');
    else {assert(!d.students.some(s=>s.no===st.no),'같은 번호에 다른 학생 ID가 있습니다. 같은 원본 백업으로 명단을 맞추세요.'); d.students.push(st);}
  }
  for(const e of incoming.events) {
    const i=d.events.findIndex(x=>x.id===e.id);
    if(i<0) d.events.push(e);
    else if(!['id','studentId','date','category','type','reason','memo','updatedAt'].every(k=>d.events[i][k]===e[k]) || [...d.events[i].slots].sort().join('|')!==[...e.slots].sort().join('|')) throw new Error(`${e.date}의 수정된 기록이 충돌합니다. 원본 기기의 전체 백업으로 복원하세요.`);
  }
  d.journal??=[];
  for(const r of incoming.journal||[]){const old=d.journal.find(x=>x.studentId===r.studentId&&x.date===r.date);if(old)assert(old.text===r.text,`${r.date} 누가 기록이 충돌합니다. 전체 백업으로 복원하세요.`);else d.journal.push(structuredClone(r));}
  for(const h of incoming.holidays) if(!d.holidays.some(x=>x.date===h.date)) d.holidays.push(h);
  d.calendar??=[];
  for(const row of incoming.calendar||[]){const old=d.calendar.find(x=>x.date===row.date);if(old)assert(old.kind===row.kind&&old.periods===row.periods&&old.label===row.label,`${row.date}의 날짜별 일정이 충돌합니다.`);else d.calendar.push(structuredClone(row));}
  return validateData(d);
}
export function note(data,e) {const s=data.students.find(s=>s.id===e.studentId); return `${s?.no}번 ${s?.name} · ${e.category}${e.type} (${e.slots.map(slotLabel).join(', ')})${e.reason ? ' · '+e.reason : ''}${e.memo ? ' / '+e.memo : ''}`;}
export function countTypes(events) {return TYPES.map(t=>new Set(events.filter(e=>e.type===t).map(e=>`${e.date}|${e.studentId}`)).size);}
export function monthRange(month) {
  assert(/^\d{4}-\d{2}$/.test(month)&&validDate(`${month}-01`),'월을 선택하세요.');
  const [y,m]=month.split('-').map(Number); return {start:`${month}-01`,end:localDate(new Date(y,m,0,12))};
}
export function weekBlocks(month) {
  const {start,end}=monthRange(month); const groups=new Map();
  for(const date of daysBetween(start,end)) {
    const d=new Date(`${date}T12:00:00`), wd=d.getDay(); if(wd===0||wd===6) continue;
    d.setDate(d.getDate()-wd+1); const key=localDate(d);
    if(!groups.has(key)) groups.set(key,Array(5).fill(null)); groups.get(key)[wd-1]=date;
  }
  return [...groups.values()];
}
export function marks(data,studentId,date,cell) {
  if(!date||dayStatus(data,date)) return '';
  return [...new Set(data.events.filter(e=>e.studentId===studentId&&e.date===date&&e.slots.some(s=>data.settings.mapping[s]===cell)).map(e=>data.settings.symbols[`${e.category}:${e.type}`]))].join('');
}
