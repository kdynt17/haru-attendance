const CACHE='haru-attendance-v21';
const FILES=['./','./index.html','./iphone-guide.html','./style.css','./app.js','./records.js','./journal.js','./attendance-actions.js','./appearance.js','./domain.js','./storage.js','./ledger.js','./ledger-preview.js','./platform.js','./schedule.js','./symbols.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png','./fonts/SUIT-Variable.woff2'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('haru-attendance-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return; event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request)));});


