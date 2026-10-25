import {validateData,ALL_SLOTS} from './domain.js';
// The tapped slot is included at either end of an absence range.
export function selectAbsenceSlots(type,available,current,slot,checked){
  const index=available.indexOf(slot);
  if(index<0)return [...current];
  if(type==='지각')return available.slice(0,index+1);
  if(type==='조퇴')return available.slice(index);
  return available.filter(s=>s===slot?checked:current.includes(s));
}
export function studentRecords(data,studentId,date){
  return data.events.filter(e=>e.studentId===studentId&&e.date===date).sort((a,b)=>b.slots.length-a.slots.length||b.updatedAt.localeCompare(a.updatedAt)||a.id.localeCompare(b.id));
}
export function overlappingRecords(data,row){return data.events.filter(e=>e.id!==row.id&&e.studentId===row.studentId&&e.date===row.date&&e.slots.some(s=>row.slots.includes(s)));}
export function saveRecord(data,row,replaceOverlap=false){
  if(!row.category)throw new Error('질병·미인정·기타·출석인정 중 하나를 선택하세요.');
  if(!row.type)throw new Error('출결 종류를 선택하세요.');
  if(!row.slots.length)throw new Error('부재한 시간을 한 칸 이상 선택하세요.');
  const conflicts=overlappingRecords(data,row);
  if(conflicts.length&&!replaceOverlap)throw new Error('선택한 시간에 다른 기록이 있습니다. 아래 변경 확인을 선택하거나 시간을 조정하세요.');
  const next=structuredClone(data);
  next.events=next.events.filter(e=>e.id!==row.id).flatMap(e=>{
    if(!conflicts.some(c=>c.id===e.id))return [e];
    const slots=e.slots.filter(s=>!row.slots.includes(s));
    return slots.length?[{...e,slots,updatedAt:row.updatedAt}]:[];
  });
  next.events.push({...row,slots:ALL_SLOTS.filter(s=>row.slots.includes(s))});
  return validateData(next);
}
