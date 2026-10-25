import {validDate,daysBetween} from './domain.js';
export function sortedJournalStudents(data,date){
  const written=new Set((data.journal??[]).filter(r=>r.date===date).map(r=>r.studentId));
  const group=s=>written.has(s.id)?0:s.journalFavorite?1:2;
  return data.students.filter(s=>s.active).sort((a,b)=>group(a)-group(b)||a.no-b.no);
}
export function validateJournal(data){
  const rows=data.journal??[], seen=new Set();
  if(!Array.isArray(rows)||rows.length>50000)throw new Error('누가 기록 목록을 확인하세요.');
  for(const r of rows){const key=r.studentId+'|'+r.date;
    if(!data.students.some(s=>s.id===r.studentId)||!validDate(r.date)||typeof r.text!=='string'||!r.text.trim()||r.text.length>10000||seen.has(key))throw new Error('누가 기록의 학생·날짜·내용을 확인하세요.');
    seen.add(key);
  }
}
export function setJournal(data,studentId,date,text){
  const next=structuredClone(data);next.journal??=[];
  next.journal=next.journal.filter(r=>r.studentId!==studentId||r.date!==date);
  if(text.trim())next.journal.push({studentId,date,text:text.trim(),updatedAt:new Date().toISOString()});
  validateJournal(next);return next;
}
export function exportJournal(data,start,end){
  daysBetween(start,end);validateJournal(data);
  return {format:'haru-journal',version:1,school:data.settings.school,year:data.settings.year,grade:data.settings.grade,classNo:data.settings.classNo,range:{start,end},records:(data.journal??[]).filter(r=>r.date>=start&&r.date<=end).map(r=>{const s=data.students.find(s=>s.id===r.studentId);return {...r,no:s.no,name:s.name};}).sort((a,b)=>a.date.localeCompare(b.date)||a.no-b.no)};
}
