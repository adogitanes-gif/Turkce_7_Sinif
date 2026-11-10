/* Türkçe 7 offline helper. Version 6198514520 changes whenever any file changes, so devices pick up updates. */
const V='t7-6198514520',FILES=["./", "icons/apple-touch-icon.png", "icons/favicon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "img/logo.png", "index.html", "js/01-core.js", "js/02-questions.js", "js/03-curriculum.js", "js/04-engine.js", "js/05-lessons.js", "js/06-app.js", "js/07-fen.js", "js/08-classlink.js", "js/09-maps.js", "js/10-sos.js", "js/11-trk.js", "js/units/u1.js", "js/units/u2.js", "js/units/u3.js", "js/units/u4.js", "js/units/u5.js", "js/units/u6.js", "manifest.webmanifest"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('t7-')&&k!==V&&k!=='t7-fonts').map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.origin===location.origin){
    /* the game's own files: answer from the saved copy at once (works offline) */
    e.respondWith(caches.open(V).then(c=>c.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>r.mode==='navigate'?c.match('./'):Response.error()))));return}
  if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    /* the letter styles: kept after the first online visit */
    e.respondWith(caches.open('t7-fonts').then(c=>c.match(r).then(hit=>hit||fetch(r).then(res=>{c.put(r,res.clone());return res}))))}
});
