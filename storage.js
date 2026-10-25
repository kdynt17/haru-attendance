import {defaults,validateData,upgradeData} from './domain.js';
let db;
export async function openStore() {
  db=await new Promise((resolve,reject)=>{const r=indexedDB.open('class-attendance-v1',1); r.onupgradeneeded=()=>r.result.createObjectStore('state'); r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);});
  return await new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get('main');r.onsuccess=()=>{try{resolve(r.result?upgradeData(validateData(r.result)):defaults());}catch(e){reject(e);}};r.onerror=()=>reject(r.error);});
}
export function saveStore(data,expectedRevision) {
  validateData(data);
  return new Promise((resolve,reject)=>{
    const tx=db.transaction('state','readwrite'), store=tx.objectStore('state'), read=store.get('main'); let error;
    read.onsuccess=()=>{ if((read.result?.revision||0)!==expectedRevision){error=new Error('다른 탭에서 데이터가 바뀌었습니다. 새로고침 후 다시 입력하세요.'); tx.abort(); return; } data.revision=expectedRevision+1;store.put(data,'main');};
    tx.oncomplete=()=>resolve(data); tx.onabort=()=>reject(error||tx.error||new Error('저장을 취소했습니다.')); tx.onerror=()=>reject(tx.error);
  });
}
// Appearance is independent of attendance revisions and backups.
export function loadCover(){return new Promise((resolve,reject)=>{const r=db.transaction('state').objectStore('state').get('cover');r.onsuccess=()=>resolve(r.result||null);r.onerror=()=>reject(r.error);});}
export function saveCover(value){return new Promise((resolve,reject)=>{const tx=db.transaction('state','readwrite');const store=tx.objectStore('state');value?store.put(value,'cover'):store.delete('cover');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}
