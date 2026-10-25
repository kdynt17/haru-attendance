export const DEFAULT_WEEK = [0,6,7,6,7,6,0];
export function schoolDay(data,date) {
  const weekday=new Date(`${date}T12:00:00`).getDay();
  if(weekday===0||weekday===6)return {periods:0,kind:'holiday',label:'주말'};
  const override=(data.calendar||[]).find(d=>d.date===date);
  if(override)return {periods:override.kind==='holiday'?0:override.periods,kind:override.kind,label:override.label};
  const holiday=data.holidays.find(h=>h.date===date);
  if(holiday)return {periods:0,kind:'holiday',label:holiday.reason||'휴업일'};
  return {periods:(data.settings.weeklyPeriods||DEFAULT_WEEK)[weekday],kind:'school',label:''};
}
export function slotsOnDate(data,date) {const d=schoolDay(data,date);return d.periods?['조회',...Array.from({length:d.periods},(_,i)=>String(i+1)),'종례']:[];}
export function visibleSlots(data,date) {
  const keep=new Set([...slotsOnDate(data,date),...data.events.filter(e=>e.date===date).flatMap(e=>e.slots)]);
  return ['조회','1','2','3','4','5','6','7','8','종례'].filter(s=>keep.has(s));
}
export function slotRanges(data,event) {
  const ordered=visibleSlots({...data,events:[event]},event.date);
  const selected=new Set(event.slots);const groups=[];let group=[];
  for(const slot of ordered){if(selected.has(slot))group.push(slot);else if(group.length){groups.push(group);group=[];}}
  if(group.length)groups.push(group);
  const label=s=>/^\d$/.test(s)?`${s}교시`:s;
  return groups.map(g=>g.length===1?label(g[0]):`${label(g[0])}~${label(g.at(-1))}`).join(', ');
}
export function ledgerNote(data,event) {const student=data.students.find(s=>s.id===event.studentId);return `${student.no}. ${event.category} ${event.type}(${event.reason||'사유 미입력'})(${slotRanges(data,event)})${event.memo?' · '+event.memo:''}`;}
