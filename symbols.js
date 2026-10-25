// Photograph: category determines outline; late adds /, early departure adds X.
const shapes={질병:'circle',미인정:'double',기타:'square',출석인정:'triangle'};
export function symbolParts(category,type){return {shape:shapes[category],slash:type==='지각',cross:type==='조퇴'};}
export function symbolSVG(category,type){
  const p=symbolParts(category,type);
  const outline=p.shape==='square'?'<rect x="5" y="5" width="22" height="22"/>':p.shape==='triangle'?'<path d="M16 3 L30 28 L2 28 Z"/>':`<circle cx="16" cy="16" r="12"/>${p.shape==='double'?'<circle cx="16" cy="16" r="8"/>':''}`;
  return `<svg class="attendance-symbol" viewBox="0 0 32 32" role="img" aria-label="${category} ${type}" fill="none" stroke="currentColor" stroke-width="1.45" stroke-linecap="round" stroke-linejoin="round">${outline}${p.slash?'<path d="M3 29 L29 3"/>':''}${p.cross?'<path d="M5 5 L27 27 M5 27 L27 5"/>':''}</svg>`;
}
export function drawSymbol(ctx,category,type,x,y,size){
  const p=symbolParts(category,type);ctx.save();ctx.translate(x-size/2,y-size/2);ctx.scale(size/32,size/32);ctx.strokeStyle='#304638';ctx.lineWidth=1.45;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();if(p.shape==='square')ctx.rect(5,5,22,22);else if(p.shape==='triangle'){ctx.moveTo(16,3);ctx.lineTo(30,28);ctx.lineTo(2,28);ctx.closePath();}else{ctx.arc(16,16,12,0,Math.PI*2);if(p.shape==='double'){ctx.moveTo(24,16);ctx.arc(16,16,8,0,Math.PI*2);}}ctx.stroke();
  ctx.beginPath();if(p.slash){ctx.moveTo(3,29);ctx.lineTo(29,3);}if(p.cross){ctx.moveTo(5,5);ctx.lineTo(27,27);ctx.moveTo(5,27);ctx.lineTo(27,5);}ctx.stroke();ctx.restore();
}
