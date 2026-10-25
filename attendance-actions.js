import {daysBetween,validateData} from './domain.js';
export function undoAttendance(data,change){
  if(!change||JSON.stringify(data.events)!==JSON.stringify(change.after))throw new Error('출결 기록이 바뀌어 실행 취소할 수 없습니다.');
  return validateData({...structuredClone(data),events:structuredClone(change.before)});
}
export function changeSchedule(data,start,end,kind,periods,label){
  if(!['default','school','event','holiday'].includes(kind))throw new Error('일정 종류를 확인하세요.');
  const dates=daysBetween(start,end),next=structuredClone(data);
  next.calendar=(next.calendar??[]).filter(r=>!dates.includes(r.date));
  next.holidays=next.holidays.filter(r=>!dates.includes(r.date));
  if(kind!=='default')for(const date of dates){
    if(kind!=='holiday'&&[0,6].includes(new Date(date+'T12:00:00').getDay()))continue;
    next.calendar.push({date,kind,periods:kind==='holiday'?0:Number(periods),label:label.trim()});
  }
  return validateData(next);
}
