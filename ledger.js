import {weekBlocks,dayStatus,marks,note,countTypes,TYPES,CATEGORIES,ALL_SLOTS} from './domain.js';
import {isAndroid,saveNativeFile} from './platform.js';
import {schoolDay,slotsOnDate,ledgerNote} from './schedule.js';
import {drawSymbol} from './symbols.js';
export const missingReason=e=>e.category!=='미인정'&&!String(e.reason||'').trim();
export function makeLedger(data,month,weekIndex) {
  const dates=weekBlocks(month)[weekIndex];
  const students=[...data.students].sort((a,b)=>a.no-b.no);
  const used=data.events.filter(e=>dates.includes(e.date)&&!dayStatus(data,e.date));
  const rows=Math.max(1,students.length), W=1780, rowH=28, top=187;
  const canvas=document.createElement('canvas');canvas.width=W;
  const ctx=canvas.getContext('2d');
  const dailyLines=dates.map(date=>{
    const lines=[];
    ctx.font='17px "Malgun Gothic", sans-serif';
    const events=used.filter(e=>e.date===date).sort((a,b)=>students.find(s=>s.id===a.studentId).no-students.find(s=>s.id===b.studentId).no);
    for(const e of events){let line='';for(const char of ledgerNote(data,e)){if(ctx.measureText(line+char).width>232){lines.push({text:line,warning:missingReason(e)});line=char;}else line+=char;}if(line)lines.push({text:line,warning:missingReason(e)});lines.push({text:'',warning:false});}
    if(lines.at(-1)?.text==='')lines.pop();return lines;
  });
  const notesH=Math.max(70,...dailyLines.map(lines=>lines.length*25+24));
  canvas.height=top+rows*rowH+notesH+135;
  ctx.fillStyle='#fffefa';ctx.fillRect(0,0,W,canvas.height);
  const text=(s,x,y,size=17,color='#304638',align='left')=>{ctx.fillStyle=color;ctx.font=`${size}px "Malgun Gothic", sans-serif`;ctx.textAlign=align;ctx.fillText(s,x,y);};
  text(`${data.settings.school}  ${data.settings.grade}학년 ${data.settings.classNo}반`,34,39,18);
  text(`${month.replace('-','년 ')}월 출석부 · ${weekIndex+1}주`,34,82,30);
  text('빨강 배경: 사유 미입력 (미인정 제외) · 파랑: 조회 · 통계: 유형 건수',W-34,43,16,'#829080','right');
  const x0=34,nameW=140,cellW=32,dayW=cellW*8,statsX=x0+nameW+dayW*5,statW=76;
  ctx.strokeStyle='#b7c4ac';ctx.lineWidth=1;
  const box=(x,y,w,h,fill)=>{if(fill){ctx.fillStyle=fill;ctx.fillRect(x,y,w,h);}ctx.strokeRect(x,y,w,h);};
  box(x0,top-90,nameW,90,'#e9edda');text('번호 / 이름',x0+nameW/2,top-38,17,undefined,'center');
  dates.forEach((date,i)=>{
    const x=x0+nameW+i*dayW,status=date?dayStatus(data,date):'월 밖';
    const day=date?schoolDay(data,date):null;
    box(x,top-90,dayW,30,'#e9edda');text(date?`${date.slice(5)} (${'월화수목금'[i]})${status?' · 휴일':` · ${day.periods}교시`}`:'—',x+dayW/2,top-69,16,undefined,'center');
    box(x,top-60,dayW,30,'#f4f5e8');text(day?.label?.slice(0,17)||'',x+dayW/2,top-39,14,undefined,'center');
    for(let n=1;n<=8;n++){box(x+(n-1)*cellW,top-30,cellW,30,n===1?'#b9d8ee':'#f5f3d9');text(n===1?'조회':String(n-1),x+(n-.5)*cellW,top-9,15,undefined,'center');}
  });
  TYPES.forEach((t,i)=>{box(statsX+i*statW,top-90,statW,90,'#e9edda');text(t,statsX+(i+.5)*statW,top-38,17,undefined,'center');});
  for(let row=0;row<rows;row++){
    const y=top+row*rowH,st=students[row],fill=row%10<5?'#fbfbed':'#fffefa';
    box(x0,y,nameW,rowH,fill);text(st?`${st.no}  ${st.name}`:'',x0+9,y+20,16);
    dates.forEach((date,i)=>{for(let n=1;n<=8;n++){const x=x0+nameW+i*dayW+(n-1)*cellW;const active=date&&slotsOnDate(data,date).includes(n===1?'조회':String(n-1));const warning=st&&used.some(e=>e.date===date&&e.studentId===st.id&&e.slots.includes(n===1?'조회':String(n-1))&&missingReason(e));box(x,y,cellW,rowH,warning?'#ffd3d3':!active?'#e9eae6':n===1?'#dfedf8':fill);if(st&&date&&!dayStatus(data,date)){if(data.settings.symbolStyle==='custom')text([...new Set(used.filter(e=>e.date===date&&e.studentId===st.id&&e.slots.includes(n===1?'조회':String(n-1))).map(e=>data.settings.symbols[`${e.category}:${e.type}`]))].join(''),x+cellW/2,y+21,19,'#344b35','center');else{const matching=used.filter(e=>e.date===date&&e.studentId===st.id&&e.slots.includes(n===1?'조회':String(n-1)));const unique=[...new Map(matching.map(e=>[`${e.category}:${e.type}`,e])).values()];unique.forEach((e,j)=>drawSymbol(ctx,e.category,e.type,x+cellW*(j+.5)/unique.length,y+rowH/2,Math.min(23,cellW/unique.length-2)));}}}});
    const counts=st?countTypes(used.filter(e=>e.studentId===st.id)):[0,0,0,0];
    counts.forEach((v,i)=>{box(statsX+i*statW,y,statW,rowH,fill);text(v||'·',statsX+(i+.5)*statW,y+20,16,undefined,'center');});
  }
  const notesTop=top+rows*rowH,tableWidth=nameW+dayW*5+statW*4;
  box(x0,notesTop,nameW,notesH,'#f4f5e8');text('특기사항',x0+nameW/2,notesTop+30,18,undefined,'center');
  dates.forEach((date,i)=>{
    const x=x0+nameW+i*dayW;
    box(x,notesTop,dayW,notesH,'#fffefa');
    (dailyLines[i].length?dailyLines[i]:[{text:'—'}]).forEach((line,n)=>{if(line.warning){ctx.fillStyle='#ffd3d3';ctx.fillRect(x+3,notesTop+6+n*25,dayW-6,25);}text(line.text,x+12,notesTop+25+n*25,17);});
  });
  box(statsX,notesTop,statW*4,notesH,'#f4f5e8');
  // Date boundaries span the header, every student, and daily notes.
  ctx.save();ctx.strokeStyle='#718568';ctx.lineWidth=3;
  for(let i=0;i<=5;i++){const x=x0+nameW+i*dayW;ctx.beginPath();ctx.moveTo(x,top-90);ctx.lineTo(x,notesTop+notesH);ctx.stroke();}
  ctx.restore();
  let y=notesTop+notesH-25;
  TYPES.forEach((type,t)=>{const gx=x0+t*425;text(type,gx,y+65,16);CATEGORIES.forEach((category,c)=>{const cx=gx+70+c*86;text(category,cx,y+62,13,undefined,'center');if(data.settings.symbolStyle==='custom')text(data.settings.symbols[`${category}:${type}`],cx,y+93,20,undefined,'center');else drawSymbol(ctx,category,type,cx,y+86,23);});});
  canvas.className='ledger-canvas';canvas.setAttribute('aria-label',`${month} ${weekIndex+1}주 출석부 미리보기`);return canvas;
}
export function download(blob,name) {if(isAndroid)return saveNativeFile(blob,name);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
export function downloadCanvas(canvas,name) {canvas.toBlob(blob=>{if(blob)Promise.resolve(download(blob,name)).catch(e=>alert(e.message));else alert('이미지를 만들 수 없습니다. 기록 수를 확인하세요.');},'image/png');}
