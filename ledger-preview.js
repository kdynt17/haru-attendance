import {download} from './ledger.js';

export function openLedgerPreview(source,name){
  const previous=document.activeElement,dialog=document.createElement('dialog');
  dialog.className='ledger-preview';dialog.setAttribute('aria-labelledby','ledger-preview-title');
  dialog.innerHTML='<header class="preview-header"><h2 id="ledger-preview-title">출석부 크게 보기</h2><button type="button" data-close autofocus aria-label="확대 보기 닫기">닫기</button></header><div class="preview-toolbar"><button type="button" data-minus aria-label="축소">−</button><output aria-live="polite"></output><button type="button" data-plus aria-label="확대">＋</button><button type="button" data-fit>화면 맞춤</button><button type="button" data-save>PNG 저장</button></div><p class="preview-help">두 손가락으로 확대 · 끌어서 이동</p><div class="preview-viewport" tabindex="0" role="region" aria-label="출석부 이미지, 방향키로 이동"><canvas></canvas></div><p class="preview-status" role="status"></p>';
  const viewport=dialog.querySelector('.preview-viewport'),canvas=dialog.querySelector('canvas'),output=dialog.querySelector('output');
  canvas.width=source.width;canvas.height=source.height;canvas.getContext('2d').drawImage(source,0,0);
  canvas.setAttribute('role','img');canvas.setAttribute('aria-label',source.getAttribute('aria-label')||'출석부');
  document.body.append(dialog);dialog.showModal();
  let scale=1,base=1;const pointers=new Map();
  function zoom(value,x=viewport.clientWidth/2,y=viewport.clientHeight/2){
    const old=scale;scale=Math.max(base,Math.min(Math.max(4,base),value));
    const left=(viewport.scrollLeft+x)*scale/old-x,top=(viewport.scrollTop+y)*scale/old-y;
    canvas.style.width=`${source.width*scale}px`;canvas.style.height=`${source.height*scale}px`;
    viewport.scrollLeft=left;viewport.scrollTop=top;output.value=`${Math.round(scale/base*100)}%`;
    dialog.querySelector('[data-minus]').disabled=scale<=base+.001;dialog.querySelector('[data-plus]').disabled=scale>=Math.max(4,base)-.001;
  }
  function fit(){base=Math.min(1,viewport.clientWidth/source.width,viewport.clientHeight/source.height);zoom(base);viewport.scrollTo(0,0);}
  dialog.querySelector('[data-plus]').onclick=()=>zoom(scale*1.5);
  dialog.querySelector('[data-minus]').onclick=()=>zoom(scale/1.5);
  dialog.querySelector('[data-fit]').onclick=fit;
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('close',()=>{window.removeEventListener('resize',fit);dialog.remove();if(previous?.isConnected)previous.focus({preventScroll:true});},{once:true});
  dialog.querySelector('[data-save]').onclick=async e=>{
    const button=e.currentTarget,status=dialog.querySelector('.preview-status');button.disabled=true;
    status.textContent='PNG를 저장하는 중입니다…';
    try{const blob=await new Promise(resolve=>source.toBlob(resolve,'image/png'));if(!blob)throw new Error('이미지를 만들지 못했습니다. 다시 시도해 주세요.');await download(blob,name);status.textContent='PNG 저장을 요청했습니다.';}catch(error){status.textContent=error.message||'저장하지 못했습니다. 다시 시도해 주세요.';}finally{button.disabled=false;}
  };
  const point=e=>{const r=viewport.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
  const distance=p=>Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);
  viewport.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;pointers.set(e.pointerId,point(e));viewport.setPointerCapture(e.pointerId);});
  viewport.addEventListener('pointermove',e=>{
    if(!pointers.has(e.pointerId))return;const before=[...pointers.values()],old=pointers.get(e.pointerId),next=point(e);pointers.set(e.pointerId,next);
    if(pointers.size===1){viewport.scrollLeft-=next.x-old.x;viewport.scrollTop-=next.y-old.y;}
    else if(pointers.size===2){const after=[...pointers.values()],d=distance(before);if(d>0)zoom(scale*distance(after)/d,(before[0].x+before[1].x)/2,(before[0].y+before[1].y)/2);}
  });
  for(const event of ['pointerup','pointercancel','lostpointercapture'])viewport.addEventListener(event,e=>pointers.delete(e.pointerId));
  viewport.addEventListener('wheel',e=>{if(e.ctrlKey){e.preventDefault();const p=point(e);zoom(scale*Math.exp(-e.deltaY*.01),p.x,p.y);}},{passive:false});
  viewport.addEventListener('dblclick',e=>{const p=point(e);zoom(scale>base*1.1?base:base*3,p.x,p.y);});
  window.addEventListener('resize',fit);fit();
}
