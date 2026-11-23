/* ================= F1 · app sin conexión (fase 1 del plan iPhone; Valdecañas y Casterton, con WP.pwa) ================= */
// La copia de joaco.org lleva VG_CFG.pwa = {sw, scope}: un service worker (sw.js, que genera src/pwa/pwa.py) guarda la página, three.js r128, los datos de la isla y la
// tarjeta en directo en la Cache Storage del navegador. Desde la pantalla de inicio del iPhone o del iPad el juego abre sin internet.
// En el artefacto de claude.ai (o la copia del repo) no hay service worker: la pestaña explica cómo conseguir la app desde joaco.org.
// Estado: OF.av (versión guardada y activa) con OF.n de OF.tot ficheros; OF.nv (versión nueva que se está guardando) con OF.nn de OF.ntot; OF.wait = versión nueva lista.
var OF={cfg:(window.VG_CFG||{}).pwa||null,reg:null,av:'',n:0,tot:0,mb:0,nv:'',nn:0,ntot:0,wait:false,err:'',want:false,est:null,persist:null,clr:0,up:0,booted:false,chk:''};
function ofOK(){ return !!(OF.cfg&&window.isSecureContext&&'serviceWorker' in navigator&&window.caches); }
function ofApp(){ try{ return !!(navigator.standalone||(window.matchMedia&&(matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches))); }catch(e){ return false; } }
function ofIOS(){ const u=navigator.userAgent||''; return /iPad|iPhone|iPod/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1); }
function ofOnline(){ return navigator.onLine!==false; }
function ofReady(){ return !!OF.av&&OF.tot>0&&OF.n>=OF.tot; }
// what the copy is doing now: na (not here), off (not started), down (first download), ok, upd (a new version is ready), err
function ofSite(){ return ((WP.pwa&&WP.pwa.url)||'https://joaco.org/valdecanas/').replace(/^https?:\/\//,'').replace(/\/$/,''); }
function ofState(){ if(!WP.pwa) return ''; if(!ofOK()) return 'na'; if(OF.err&&!OF.av) return 'err'; if(OF.wait) return 'upd'; if(ofReady()) return 'ok'; if(OF.av||OF.nv||OF.reg) return 'down'; return 'off'; }
function ofAsk(w){ try{ if(w) w.postMessage({t:'status'}); }catch(e){} }
function ofBoot(){ if(OF.booted) return; OF.booted=true; document.body.classList.toggle('pwapp',ofApp());
  addEventListener('online',ofUI); addEventListener('offline',ofUI);
  if(!ofOK()){ ofUI(); return; }
  const sw=navigator.serviceWorker;
  sw.addEventListener('message',e=>{ const d=e.data||{}; if(d.t!=='of') return;
    const r=OF.reg, act=r&&r.active, mine=d.st&&e.source===act;
    if(d.st&&(mine||!OF.av)){ OF.av=d.v; OF.n=d.n; OF.tot=d.tot; OF.mb=d.mb; if(OF.nv===OF.av) OF.nv=''; }
    else if(!d.st&&d.v!==OF.av){ OF.nv=d.v; OF.nn=d.n||0; OF.ntot=d.tot||OF.ntot; if(d.done||d.active) setTimeout(ofRefresh,300); }
    ofUI(); });
  sw.startMessages&&sw.startMessages();
  sw.addEventListener('controllerchange',()=>{ if(OF.want&&!OF.rl){ OF.rl=true; location.reload(); } else setTimeout(ofRefresh,300); });
  sw.register(OF.cfg.sw,{scope:OF.cfg.scope}).then(r=>{ OF.reg=r; ofWatch(r); ofRefresh(); ofStore(); sw.ready.then(()=>ofRefresh()); }).catch(e=>{ OF.err=String((e&&e.message)||e); ofUI(); });
  setInterval(()=>{ if(OF.reg&&ofOnline()&&document.visibilityState==='visible') OF.reg.update().catch(()=>{}); },3600e3);
  setInterval(()=>{ if(!ofReady()||OF.nv) ofRefresh(); },2500); }
function ofRefresh(){ const r=OF.reg; if(!r) return; ofAsk(r.active||navigator.serviceWorker.controller); OF.wait=!!(r.waiting&&r.active); if(OF.wait&&!OF.bar) ofBar(true); ofUI(); }
function ofWatch(r){ r.addEventListener('updatefound',()=>{ const w=r.installing; if(!w) return; w.addEventListener('statechange',()=>{ if(w.state==='activated'){ OF.nv=''; } ofRefresh(); }); ofUI(); }); }
function ofStore(){ try{ const S_=navigator.storage; if(!S_) return; if(S_.estimate) S_.estimate().then(e=>{ OF.est=e; ofUI(); }).catch(()=>{});
    if(S_.persisted) S_.persisted().then(p=>{ OF.persist=p; if(!p&&ofApp()&&S_.persist) S_.persist().then(q=>{ OF.persist=q; ofUI(); }).catch(()=>{}); ofUI(); }).catch(()=>{}); }catch(e){} }
// a new version is ready: the bar at the top (also from the tab)
function ofBar(on){ const b=$('ofBar'); if(!b) return; OF.bar=on; b.hidden=!on; }
function ofUpdateNow(){ const r=OF.reg; ofBar(false); if(!r||!r.waiting){ location.reload(); return; } OF.want=true; try{ r.waiting.postMessage({t:'skip'}); }catch(e){} toast('Actualizando','Un momento: se abre la versión nueva'); setTimeout(()=>{ if(!OF.rl){ OF.rl=true; location.reload(); } },4000); }
function ofCheckNow(){ const r=OF.reg; if(!r){ ofBoot(); return; } if(!ofOnline()){ OF.chk='Sin conexión: no se puede buscar una versión nueva ahora'; ofUI(); return; }
  OF.chk='Buscando…'; ofUI(); r.update().then(()=>{ setTimeout(()=>{ OF.chk=r.installing||r.waiting?'Hay una versión nueva: se está guardando':'Ya tienes la última versión'; ofRefresh(); },900); }).catch(()=>{ OF.chk='No se pudo comprobar ahora'; ofUI(); }); }
async function ofClear(){ if(Date.now()-OF.clr>4000){ OF.clr=Date.now(); ofUI(); return; } OF.clr=0;
  try{ const r=OF.reg||(await navigator.serviceWorker.getRegistration(OF.cfg.scope)); if(r) await r.unregister(); const ks=await caches.keys(); await Promise.all(ks.filter(k=>k.startsWith(OF.cfg.pre||'vg-valdecanas-')).map(k=>caches.delete(k))); }catch(e){}
  OF.reg=null; OF.av=''; OF.n=OF.tot=0; OF.nv=''; OF.wait=false; OF.booted=false; ofBar(false); toast('Copia borrada','El juego ya no funciona sin conexión en este navegador. «Guardar para jugar sin conexión» la vuelve a descargar'); ofUI(); }
function ofSaveAgain(){ OF.err=''; OF.booted=false; ofBoot(); }
const OF_MB=n=>fmt(n/1048576,1)+' MB';
// the start screen button and the open tab follow the state
function ofUI(){ const st=ofState(), b=$('mApp');
  if(b){ b.hidden=!WP.pwa; const s=b.querySelector('span'); if(s){ const t=st==='ok'?'✓ Lista para jugar sin conexión'+(ofApp()?'':' · añádela a la pantalla de inicio'):st==='down'?'Guardando la copia: '+ofPct()+' %':st==='upd'?'Versión nueva lista: toca para actualizar':'Instálala en el iPhone o el iPad y juega sin internet (salvo las salas con amigos)';
      const tt=(ofOnline()?'':'Sin conexión ahora · ')+t; if(s.textContent!==tt) s.textContent=tt; } b.classList.toggle('ofok',st==='ok'); }
  const box=$('ofState'); if(box){ const h=ofStateHTML(); if(box.innerHTML!==h) box.innerHTML=h; ofWireState(); }
  const tg=document.querySelector('#tabs button[data-k="app"]'); if(tg) tg.textContent=st==='upd'?'Sin conexión ●':'Sin conexión'; }
function ofPct(){ if(OF.nv&&OF.ntot) return Math.round(100*OF.nn/OF.ntot); return OF.tot?Math.round(100*OF.n/OF.tot):0; }
// the status box of the tab
function ofStateHTML(){ const st=ofState(), net=ofOnline()?'<span class="ofnet on">● Con internet</span>':'<span class="ofnet off">● Sin conexión</span>', app=ofApp()?'Abierta como app desde la pantalla de inicio':'Abierta en el navegador';
  let main='', btn='';
  if(st==='na') main='<b>Aquí no se puede guardar.</b> Esta copia del juego '+(OF.cfg?'está en un navegador que no lo permite':'es la de claude.ai (o la del repositorio)')+'. La copia que se instala está en <b>'+ofSite()+'</b>: ábrela en Safari (iPhone y iPad) o en Chrome.', btn='<a class="btn primary" href="'+(WP.pwa&&WP.pwa.url||'https://joaco.org/valdecanas/')+'" target="_blank" rel="noopener">Abrir '+ofSite()+'</a>';
  else if(st==='err') main='<b>No se pudo preparar la copia.</b> '+OF.err, btn='<button class="btn primary" id="ofAgain">Probar otra vez</button>';
  else if(st==='off') main='<b>Sin copia guardada.</b> El juego aún no está guardado para jugar sin conexión en este navegador.', btn='<button class="btn primary" id="ofAgain">Guardar para jugar sin conexión</button>';
  else if(st==='down'){ const n=OF.nv?OF.nn:OF.n, t=OF.nv?OF.ntot:OF.tot; main='<b>Guardando la copia…</b> '+(t?n+' de '+t+' archivos':'empezando')+' · deja el juego abierto con internet hasta que diga «Lista».<div class="ofprog"><i style="width:'+ofPct()+'%"></i></div>'; }
  else if(st==='ok') main='<b class="ofok">✓ Lista para jugar sin conexión.</b> Guardados '+OF.n+' archivos ('+fmt(OF.mb,1)+' MB): la página, los datos del juego, three.js y la tarjeta en directo.'+(OF.nv?'<br>Guardando una versión nueva: '+ofPct()+' %':'');
  else if(st==='upd') main='<b class="ofupd">Versión nueva lista.</b> Ya está guardada; toca Actualizar para abrirla (la partida en curso se cierra).', btn='<button class="btn primary" id="ofUpd">Actualizar ahora</button>';
  const est=OF.est&&OF.est.usage?'<div class="note">Espacio que usa joaco.org en este navegador: '+OF_MB(OF.est.usage)+(OF.persist===true?' · guardado de forma permanente':OF.persist===false?' · el navegador podría borrarlo si pasan semanas sin abrirlo':'')+'</div>':'';
  const ver=OF.av?' · versión '+OF.av:'';
  return '<div class="ofbox ofst-'+st+'"><div class="ofline">'+net+'<span class="note">'+app+ver+'</span></div><p>'+main+'</p>'+(btn?'<div class="row">'+btn+'</div>':'')+est+
    (['ok','upd','down'].includes(st)?'<div class="row"><button class="btn small" id="ofChk">Buscar versión nueva</button><button class="btn small" id="ofDel">'+(Date.now()-OF.clr<4000?'¿Seguro? Toca otra vez':'Borrar la copia')+'</button></div>':'')+(OF.chk?'<div class="note">'+OF.chk+'</div>':'')+'</div>'; }
function ofWireState(){ const on=(id,f)=>{ const e=$(id); if(e&&!e.dataset.w){ e.dataset.w=1; e.onclick=f; } }; on('ofAgain',ofSaveAgain); on('ofUpd',ofUpdateNow); on('ofChk',ofCheckNow); on('ofDel',ofClear); }
// the menu tab «Sin conexión»: status, how to install it, what works without internet, how to read the status, updates and glossary
function ofHTML(){ const ios=ofIOS();
  return '<h3>Jugar sin conexión en el iPhone y el iPad</h3><p class="note">El juego se guarda entero en el móvil o la tableta (unos '+((WP.pwa&&WP.pwa.mb)||8)+' MB) y se instala como una app en la pantalla de inicio: abre al momento y funciona en modo avión. Es la fase 1 del plan para el iPhone; las salas con amigos siguen necesitando internet.</p>'+
   '<div id="ofState">'+ofStateHTML()+'</div>'+
   '<h3>Cómo instalarla</h3><ol class="ofsteps">'+
   '<li>Abre <b>'+ofSite()+'</b> con internet: en el iPhone y el iPad, en <b>Safari</b>'+(ios?'':' (en Android, en Chrome)')+'.</li>'+
   '<li>Espera a que el recuadro de arriba diga <b>«✓ Lista para jugar sin conexión»</b> (con wifi, menos de un minuto).</li>'+
   '<li>iPhone y iPad: toca <b>Compartir</b> (el cuadrado con la flecha hacia arriba) y luego <b>«Añadir a pantalla de inicio»</b> → <b>Añadir</b>. Android: menú <b>⋮</b> → <b>Instalar app</b>. Ordenador con Chrome o Edge: el icono de instalar de la barra de direcciones.</li>'+
   '<li>Abre el icono <b>'+((WP.pwa&&WP.pwa.n)||'Valdecañas')+'</b> una vez <b>con internet</b> y vuelve a esperar a «Lista»: la app de la pantalla de inicio guarda su propia copia.</li>'+
   '<li>Listo: desde ese icono se juega también sin conexión. En la app, el juego ocupa toda la pantalla.</li></ol>'+
   '<h3>Qué funciona sin internet</h3><ul><li><b>Sí:</b> todo el juego en solitario o contra la máquina: '+((WP.pwa&&WP.pwa.feat)||'golf (partida con hándicap, retos, torneo familiar), karts, bicis, volar, agua, caballos, hotel, Halloween y sus disfraces, Navidad, pilla-pilla con la máquina, los peques, monedas y trofeos')+'. También la <b>tarjeta en directo</b> con el GPS (desde «Partida real» del inicio); en Android, además, manteniendo pulsado el icono.</li>'+
   '<li><b>No:</b> las salas con amigos (verse, chat y voz), la nube del grupo de la tarjeta (se sincroniza sola al volver la conexión), el viento en directo de la tarjeta y buscar versiones nuevas.</li></ul>'+
   '<h3>Cómo se lee el recuadro</h3><ul><li><span class="ofnet on">●</span> verde: hay internet; <span class="ofnet off">●</span> naranja: sin conexión.</li><li><b class="ofok">✓ Lista</b>: la copia está entera y es la versión que estás usando.</li><li>Barra azul: se está guardando (la primera vez o una versión nueva).</li><li><b class="ofupd">Versión nueva lista</b>: ya está descargada; «Actualizar» la abre. Si no actualizas, se abrirá sola la próxima vez que cierres y abras la app.</li><li>«Aquí no se puede guardar»: estás en la copia de claude.ai o en un navegador sin esta función.</li></ul>'+
   '<h3>Actualizaciones y espacio</h3><p class="note">Cada vez que abres el juego con internet busca una versión nueva (y luego cada hora). Solo baja lo que ha cambiado: casi siempre la página, no los datos del juego. Safari puede borrar las copias de webs que llevan semanas sin abrirse: si un día la app pide internet, ábrela con conexión y espera a «Lista». «Borrar la copia» libera el espacio.</p>'+
   '<h3>Glosario</h3><dl class="gl">'+ofGlossHTML()+'</dl>'; }
function ofWire(){ ofStore(); if(ofOK()&&!OF.booted) ofBoot(); ofRefresh(); ofUI(); }
function ofGuideHTML(){ return WP.pwa?'<li><b>Sin conexión (iPhone y iPad)</b>: en '+ofSite()+' el juego se guarda entero en el navegador; con «Compartir → Añadir a pantalla de inicio» queda como una app que funciona en modo avión (todo menos las salas con amigos). Menú → pestaña <b>Sin conexión</b>: estado de la copia, cómo instalarla y actualizaciones; también el botón 📲 del inicio.</li>':''; }
function ofGlossHTML(){ return WP.pwa?'<dt>App web (sin conexión)</dt><dd>Una página que el navegador guarda entera y que se abre desde un icono de la pantalla de inicio, como una app, también sin internet.</dd><dt>Copia sin conexión</dt><dd>Los archivos del juego (la página, los datos, three.js y la tarjeta en directo) guardados en el navegador; el recuadro de la pestaña Sin conexión dice si está entera.</dd><dt>Pantalla de inicio</dt><dd>La pantalla de iconos del iPhone o del iPad; «Añadir a pantalla de inicio» (en Compartir de Safari) pone ahí el juego.</dd><dt>Service worker</dt><dd>El pequeño programa que el navegador guarda junto a la página para servirla sin internet y traer las versiones nuevas.</dd>':''; }
// the start screen button, the update bar, and the copy starts once the island has loaded (so it does not compete with the first load)
{ const b=$('mApp'); if(b){ b.hidden=!WP.pwa; b.onclick=()=>{ try{ saveName(); }catch(e){} openModal('app'); }; } }
{ const u=$('ofBarUp'), l=$('ofBarLater'); if(u) u.onclick=ofUpdateNow; if(l) l.onclick=()=>ofBar(false); }
if(WP.pwa){ const t=setInterval(()=>{ const L=$('loading'); if(L&&L.hidden){ clearInterval(t); setTimeout(ofBoot,1200); } },700); ofUI(); }
