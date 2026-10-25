import {loadCover,saveCover} from './storage.js';
let coverUrl;
export async function initAppearance(){const blob=await loadCover();if(blob instanceof Blob)coverUrl=URL.createObjectURL(blob);}
export function showCover(){const target=document.querySelector('#daily-cover');if(target&&coverUrl){const image=new Image();image.src=coverUrl;image.alt='우리 반 표지';target.append(image);target.hidden=false;}}
export function appearancePanel(){return `<div class="card"><h2>화면 꾸미기</h2><p class="muted">Higgsfield 작업실에서 생성해 휴대폰에 저장한 이미지를 표지로 사용할 수 있어요. 출결 기록은 그대로 유지됩니다.</p><label class="cover-picker">표지 이미지 선택<input id="cover-file" type="file" accept="image/png,image/jpeg,image/webp"></label><button type="button" id="remove-cover">기본 화면으로</button><p id="cover-status" class="muted" role="status">${coverUrl?'표지 이미지가 설정되어 있습니다.':'현재는 기본 화면입니다.'}</p><p class="muted">PC의 Higgsfield-실행.cmd에서 생성 → 이미지 저장 → 휴대폰으로 전송 → 여기서 선택하세요. 표지는 이 기기에 저장되며 출결 백업 파일에는 포함되지 않습니다.</p></div>`;}
export function bindAppearance(){
  const status=document.querySelector('#cover-status');
  document.querySelector('#cover-file').onchange=async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      if(file.size>15*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('15MB 이하의 PNG, JPG 또는 WebP 이미지를 선택하세요.');
      const url=URL.createObjectURL(file),image=new Image();
      try{image.src=url;await image.decode();const scale=Math.min(1,1400/image.naturalWidth,1400/image.naturalHeight);const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.88));if(!blob)throw new Error('이미지를 저장하지 못했습니다.');await saveCover(blob);if(coverUrl)URL.revokeObjectURL(coverUrl);coverUrl=URL.createObjectURL(blob);status.textContent='적용했습니다. 오늘 출결 화면에서 확인하세요.';}finally{URL.revokeObjectURL(url);}
    }catch(error){status.textContent=error.message||'이미지를 열지 못했습니다.';}finally{event.target.value='';}
  };
  document.querySelector('#remove-cover').onclick=async()=>{try{await saveCover(null);if(coverUrl)URL.revokeObjectURL(coverUrl);coverUrl=null;status.textContent='기본 화면으로 변경했습니다.';}catch{status.textContent='변경을 저장하지 못했습니다.';}};
}
