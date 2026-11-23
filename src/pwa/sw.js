/* Isla de Valdecañas · copia sin conexión (fase 1 del plan iPhone). Lo genera src/build_pages.py a partir de src/pwa/sw.js: no editar la copia de joaco.org a mano.
   - Al instalarse guarda en la Cache Storage la página del juego, three.js r128, los datos de la isla y la tarjeta en directo (CORE, con la huella de cada fichero).
     Los ficheros que no cambiaron desde la copia anterior se pasan de una a otra sin descargarlos.
   - El juego (y sus datos) se sirve primero de la copia: abre al momento y sin internet. Cuando hay versión nueva, el navegador instala este fichero nuevo en segundo plano
     y el juego enseña «Versión nueva lista · Actualizar» (mensaje skip).
   - La tarjeta en directo va primero por la red (para tener siempre la última) y, sin conexión o si tarda, sale de la copia.
   - Lo demás (salas por MQTT, la nube del grupo en Supabase, el viento) va por la red como siempre. */
const V='__V__', PRE='__PRE__', CACHE=PRE+V, SCOPE='__SCOPE__', CORE=__CORE__, OPT=__OPT__, FONTS=__FONTS__, MB=__MB__;
const HK='x-vg-h';
function say(m){ return self.clients.matchAll({includeUncontrolled:true,type:'window'}).then(cs=>cs.forEach(c=>c.postMessage(m))).catch(()=>{}); }
async function getOne(u,h,c,old){
  for(const k of old){ const o=await caches.open(k), r=await o.match(u); if(r&&r.headers.get(HK)===h){ await c.put(u,r); return; } }
  let err=null;
  for(let i=0;i<3;i++){ try{ const r=await fetch(u,{mode:'cors',credentials:'omit',cache:i?'reload':'default'}); if(!r.ok) throw new Error(u+' '+r.status);
      const hd=new Headers(r.headers); hd.set(HK,h); await c.put(u,new Response(await r.blob(),{status:200,statusText:'OK',headers:hd})); return; }catch(e){ err=e; } }
  throw err; }
self.addEventListener('install',e=>{ e.waitUntil((async()=>{
  const c=await caches.open(CACHE), old=(await caches.keys()).filter(k=>k.startsWith(PRE)&&k!==CACHE), tot=CORE.length; let n=0;
  say({t:'of',v:V,n:0,tot});
  const q=CORE.slice(); await Promise.all([0,1,2,3].map(async()=>{ while(q.length){ const [u,h]=q.shift(); await getOne(u,h,c,old); n++; say({t:'of',v:V,n,tot}); } }));
  for(const u of OPT){ try{ const r=await fetch(u,{mode:'cors',credentials:'omit'}); if(r.ok) await c.put(u,r); }catch(e){} }
  for(const u of FONTS){ try{ const r=await fetch(u); if(!r.ok) continue; const css=await r.clone().text(); await c.put(u,r);
      await Promise.all([...css.matchAll(/url\((https:[^)]+)\)/g)].map(m=>fetch(m[1],{mode:'cors'}).then(x=>x.ok?c.put(m[1],x):0).catch(()=>{}))); }catch(e){} }
  say({t:'of',v:V,n:tot,tot,done:1}); })()); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith(PRE)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()).then(()=>say({t:'of',v:V,active:1}))); });
self.addEventListener('message',e=>{ const d=e.data||{}; if(d.t==='skip') self.skipWaiting(); else if(d.t==='status'&&e.source){ const src=e.source; e.waitUntil(caches.open(CACHE).then(async c=>{ let n=0; for(const [u] of CORE) if(await c.match(u)) n++;
    src.postMessage({t:'of',v:V,n,tot:CORE.length,mb:MB,st:1,state:self.serviceWorker?self.serviceWorker.state:''}); })); } });
function fromCache(req,ign){ return caches.open(CACHE).then(c=>c.match(req,{ignoreSearch:!!ign})); }
function store(req,res){ if(res&&res.ok&&(res.type==='basic'||res.type==='cors')){ const cp=res.clone(); caches.open(CACHE).then(c=>c.put(req,cp)).catch(()=>{}); } return res; }
self.addEventListener('fetch',e=>{
  const q=e.request; if(q.method!=='GET') return; const u=new URL(q.url), same=u.origin===self.location.origin;
  if(same&&!u.pathname.startsWith(SCOPE)) return;
  if(q.mode==='navigate'&&same){
    if(u.pathname.startsWith(SCOPE+'tarjeta')){ const key=SCOPE+'tarjeta/';
      e.respondWith(new Promise(res=>{ let done=false; const fb=()=>fromCache(key).then(r=>{ if(!done&&r){ done=true; res(r); } });
        const t=setTimeout(fb,4000); fetch(q).then(r=>{ clearTimeout(t); if(r.ok) store(key,r.clone()); if(!done){ done=true; res(r); } }).catch(()=>{ clearTimeout(t); fromCache(key).then(r=>{ if(!done){ done=true; res(r||Response.error()); } }); }); }));
      return; }
    if(u.pathname===SCOPE||u.pathname===SCOPE+'index.html'){ e.respondWith(fromCache(SCOPE).then(r=>r||fetch(q))); return; }
    return; }
  if(same||/(^|\.)(cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|fonts\.googleapis\.com|fonts\.gstatic\.com)$/.test(u.hostname)){
    e.respondWith(fromCache(q,same&&u.pathname.startsWith(SCOPE+'data/')).then(r=>r||fetch(q).then(x=>/fonts\./.test(u.hostname)?store(q,x):x))); }
});
