const CACHE='palestra-7f142986';
const ASSETS=["./", "index.html", "lingua.js", "en.js", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable.png", "apple-touch-icon.png", "omino-mappa.webp", "sil-m.webp", "sil-f.webp", "cl-copertina.webp", "v-abductor.mp4", "v-adductor.mp4", "v-affondi.mp4", "v-alzate-frontali.mp4", "v-alzate-laterali.mp4", "v-chest-press.mp4", "v-croci-cavi.mp4", "v-crunch.mp4", "v-crunch-cavo.mp4", "v-crunch-macchina.mp4", "v-curl-bilanciere.mp4", "v-curl-cavo.mp4", "v-curl-manubri.mp4", "v-curl-martello.mp4", "v-curl-scott.mp4", "v-cyclette.mp4", "v-dip-macchina.mp4", "v-ellittica.mp4", "v-estensioni-sopra-testa.mp4", "v-face-pull.mp4", "v-french-press.mp4", "v-goblet-squat.mp4", "v-hip-thrust.mp4", "v-iperestensioni.mp4", "v-jumping-jack.mp4", "v-lat-machine.mp4", "v-leg-curl.mp4", "v-leg-curl-asciugamano.mp4", "v-leg-extension.mp4", "v-leg-press.mp4", "v-lento-manubri.mp4", "v-mezzo-squat.mp4", "v-mountain-climber.mp4", "v-panca-inclinata-manubri.mp4", "v-panca-manubri.mp4", "v-panca-piana.mp4", "v-pectoral-machine.mp4", "v-piegamenti.mp4", "v-piegamenti-rialzati.mp4", "v-piegamenti-stretti.mp4", "v-plank.mp4", "v-polpacci.mp4", "v-ponte-glutei.mp4", "v-pulley.mp4", "v-pullover-cavo.mp4", "v-pushdown.mp4", "v-rematore-bilanciere.mp4", "v-rematore-manubrio.mp4", "v-reverse-fly.mp4", "v-shoulder-press.mp4", "v-sollevamento-gambe.mp4", "v-squat.mp4", "v-squat-bulgaro.mp4", "v-squat-libero.mp4", "v-stacco-rumeno.mp4", "v-stepper.mp4", "v-tapis-roulant.mp4", "v-tirate-mento.mp4", "v-trazioni-assistite.mp4", "v-vogatore.mp4"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE&&k!=='pf-ocr').map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const u=new URL(e.request.url); if(u.origin!==location.origin) return;
  if(u.pathname.indexOf('/ocr/')>=0){ e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{ if(res.ok){ const cp=res.clone(); caches.open('pf-ocr').then(c=>c.put(e.request,cp)); } return res;}))); return; }
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(r=>{const cp=r.clone(); caches.open(CACHE).then(c=>c.put('index.html',cp)); return r;}).catch(()=>caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const cp=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,cp)); return res;})));
});
