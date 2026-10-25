// Optional native adapter. Browser builds continue to use standard web APIs.
export const isAndroid = typeof window !== 'undefined' && !!window.HaruAndroid?.postMessage;
const pending = new Map();
if(isAndroid) Object.defineProperty(window,'HaruNative',{value:{
  complete(id,result,error){const entry=pending.get(id);if(!entry)return;pending.delete(id);clearTimeout(entry.timer);error?entry.reject(new Error(error)):entry.resolve(result);}
}});
function request(action,payload={}) {
  return new Promise((resolve,reject)=>{
    const id=crypto.randomUUID();
    const timer=setTimeout(()=>{pending.delete(id);reject(new Error('작업 시간이 지났습니다. 저장 창을 닫고 다시 시도하세요.'));},600000);
    pending.set(id,{resolve,reject,timer});
    try{window.HaruAndroid.postMessage(JSON.stringify({id,action,...payload}));}catch(e){clearTimeout(timer);pending.delete(id);reject(e);}
  });
}
function base64(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});}
export async function saveNativeFile(blob,name,share=false) {return request(share?'share':'save',{name,mime:blob.type||'application/octet-stream',base64:await base64(blob)});}
export function copyText(text){return isAndroid?request('copy',{text}):navigator.clipboard.writeText(text);}
export function printPage(){return isAndroid?request('print'):window.print();}
