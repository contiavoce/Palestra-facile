const CACHE='palestra-6b029252';
const ASSETS=["./", "index.html", "lingua.js", "en.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable.png", "apple-touch-icon.png", "omino-mappa.webp", "sil-m.webp", "sil-f.webp", "cl-copertina.webp", "v-affondi.mp4", "v-alzate-laterali.mp4", "v-chest-press.mp4", "v-croci-cavi.mp4", "v-crunch-cavo.mp4", "v-curl-bilanciere.mp4", "v-curl-manubri.mp4", "v-face-pull.mp4", "v-hip-thrust.mp4", "v-lat-machine.mp4", "v-leg-curl.mp4", "v-leg-extension.mp4", "v-leg-press.mp4", "v-lento-manubri.mp4", "v-panca-piana.mp4", "v-piegamenti.mp4", "v-plank.mp4", "v-polpacci.mp4", "v-pulley.mp4", "v-pushdown.mp4", "v-rematore-manubrio.mp4", "v-shoulder-press.mp4", "v-sollevamento-gambe.mp4", "v-squat.mp4", "v-stacco-rumeno.mp4", "v-trazioni-assistite.mp4"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url); if(u.origin!==location.origin) return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(r=>{const cp=r.clone(); caches.open(CACHE).then(c=>c.put('index.html',cp)); return r;}).catch(()=>caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const cp=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); return res;})));
});
