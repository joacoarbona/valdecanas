/* ================= para los peques (J4a, solo Valdecañas): el modo fácil y la hoja «Para los peques» (perro, minigolf loco y modo fácil) ================= */
// Nombres ez* y kd*, estado EZ. El modo fácil se guarda en este dispositivo (vg_easy) y pone ayudas automáticas en el golf, el minigolf, los karts y las bicis.
var EZ={on:store.get('vg_easy')==='1',tab:'perro',key:'',keyT:0};
function ezOn(){ return typeof EZ!=='undefined'&&!!EZ&&EZ.on&&!!WP.kids; }
function ezSet(on){ EZ.on=!!on; store.set('vg_easy',EZ.on?'1':'0'); document.body.classList.toggle('easy',ezOn()); prevKey=''; S.g.ezPv=0; EZ.key='';
  if(S.mode==='mini'){ mgEzStart(); mgUI(); } mgHUD(); toast(EZ.on?'Modo fácil: sí':'Modo fácil: no',EZ.on?'Ayudas automáticas en el golf, el minigolf, los karts y las bicis':'Sin ayudas: todo como siempre'); }
TRO.push({id:'mghio',n:'Hoyo en uno en el minigolf',how:'Mete la bola de un solo golpe en cualquier hoyo del minigolf loco.',m:'b',c:15,w:'kids'},
  {id:'minigolf',n:'Rey del minigolf',how:'Termina los nueve hoyos del minigolf loco al par (24) o mejor.',m:'s',c:30,w:'kids'},
  {id:'perro',n:'Mejor amigo',how:'Tu perro te trae 25 pelotas.',m:'b',c:15,w:'kids'},
  {id:'tesoro',n:'Gran explorador',how:'Abre todos los cofres de la búsqueda del tesoro (medalla de oro).',m:'g',c:40,w:'kids'},
  {id:'album',n:'Álbum completo',how:'Consigue todos los cromos de sitios y animales de la isla.',m:'s',c:30,w:'kids'},
  {id:'salto',n:'Salto perfecto',how:'Da una voltereta completa desde el trampolín antes de caer al agua.',m:'b',c:10,w:'kids'});
// golf in easy mode: the right strength, found with the real physics (wind, slope, the green), and a bigger hole
function ezGolfKey(){ const g=S.g; return g.club+'|'+(g.shot||'')+'|'+g.yaw.toFixed(2)+'|'+g.ball.x.toFixed(1)+g.ball.z.toFixed(1); }
function ezGolfSim(p){ const g=S.g, cl=CLUBS[g.club], H=hole(), M=shotMods(), d=dirV(); let v, p0;
  if(cl.putt){ v=d.clone().multiplyScalar(cl.v0*p); p0=g.ball; } else { const a=(cl.loft+M.dl)*Math.PI/180, sp=cl.v0*p*lieSpeed()*M.k; v={x:d.x*Math.cos(a)*sp,y:Math.sin(a)*sp,z:d.z*Math.cos(a)*sp}; p0={x:g.ball.x,y:g.ball.y+0.05,z:g.ball.z}; }
  const s=newSim(p0,v,cl.putt,{trees:true,cup:H.pin,spin:Math.max(0,cl.loft/100+M.sp),ez:true}); for(let i=0;i<4000&&!s.done;i++) simStep(s,1/120,g.wind); return s; }
function ezGolfPower(){ const g=S.g, H=hole(); if(!H) return 1; const cl=CLUBS[g.club]; if(!cl.putt&&distToPin()>cl.c*1.08) return 1;
  let best=null; const sc=s=>s.done==='holed'?-1:(s.done==='water'?1e4:Math.hypot(s.x-H.pin[0],s.z-H.pin[1]));
  const test=p=>{ const v=sc(ezGolfSim(p)); if(!best||v<best.v) best={p,v}; };
  for(let p=0.06;p<=1.0001;p+=0.045) test(p); const p0=best.p; for(let dp=-0.04;dp<=0.0401;dp+=0.008) test(clamp(p0+dp,0.03,1)); return best.p; }
function ezTick(dt){ if(!ezOn()) return; const m=S.mode; if(m!=='aim'){ EZ.key=''; return; } const k=ezGolfKey(); if(k!==EZ.key){ EZ.key=k; EZ.keyT=0.25; return; } if(EZ.keyT>0){ EZ.keyT-=dt; if(EZ.keyT<=0){ S.g.ezPv=ezGolfPower(); S.g.ezK=k; prevKey=''; } } }
// pressing GOLPEAR in easy mode: the ring fills up to the right strength and the shot goes by itself
function ezSwingStart(){ const g=S.g; g.ezP=0; if(!ezOn()) return; if(g.ezK!==ezGolfKey()||!g.ezPv){ g.ezPv=ezGolfPower(); g.ezK=ezGolfKey(); } g.ezP=g.ezPv; }
function ezSwingTick(){ const g=S.g; if(!ezOn()||!g.ezP||S.mode!=='swing') return false; if(g.swingT<1.05&&g.power>=g.ezP){ g.power=g.ezP; g.ezP=0; setPowerRing(0); hit(g.power); return true; } return false; }
// a ball that stops in a bad place (bunker, rough, beach, under a tree) is carried to the nearest good grass without penalty; the dog does it if it is with you
function ezRescue(s){ if(!ezOn()) return false; const g=S.g, H=hole(); if(!H) return false; let lie=W.surfAt(s.x,s.z); if(lie>=20) lie=1;
  const under=(x,z)=>{ const tr=treeGrid.get(Math.floor(x/20)+','+Math.floor(z/20)); if(tr) for(const t of tr) if(Math.hypot(x-t.x,z-t.z)<t.tr*0.9) return true; return false; };
  if(![7,1,9,0].includes(lie)&&!under(s.x,s.z)) return false; const dp0=Math.hypot(s.x-H.pin[0],s.z-H.pin[1]); let best=null;
  for(let r=3;r<=48;r+=3) for(let k=0;k<20;k++){ const a=k/20*Math.PI*2, x=s.x+Math.cos(a)*r, z=s.z+Math.sin(a)*r, c=W.surfAt(x,z); if(![2,3,4,5,6].includes(c)) continue; if(W.terrain(x,z)<W.waterLevel(x,z)+0.1||under(x,z)||bldAt(x,z,1)) continue;
    const dp=Math.hypot(x-H.pin[0],z-H.pin[1]); const sc=r+0.6*Math.max(0,dp-dp0)+(c===2?6:0); if(!best||sc<best.sc) best={x,z,sc}; }
  if(!best) return false; g.ezMove={from:[s.x,s.z],to:[best.x,best.z]}; g.ball.set(best.x,W.terrain(best.x,best.z)+0.03,best.z); s.x=best.x; s.z=best.z;
  const dog=typeof DG!=='undefined'&&DG.on&&!DG.away&&dgOK(); toast(dog?DG.name+' te saca la bola a la calle':'Bola a la calle','Modo fácil: sin golpe de castigo'); return true; }

/* ---- the sheet «Para los peques»: three tabs (dog, minigolf, easy mode) ---- */
function ezTabHTML(){ let h='<p>El <b>modo fácil</b> pone ayudas automáticas para los más pequeños. Se guarda en este dispositivo y se quita con el mismo botón. '+(ezOn()?'<b>Ahora está puesto.</b>':'Ahora está quitado.')+'</p>';
  h+='<div class="row"><button class="btn small primary" id="ezTog">'+(ezOn()?'Quitar el modo fácil':'Poner el modo fácil')+'</button></div>';
  h+='<h3>Qué ayudas pone</h3><ul><li><b>Golf:</b> apunta solo, y al pulsar GOLPEAR la fuerza se para sola en la justa (calculada con la cuesta, el green y el viento). La línea de putt se ve entera. El hoyo es más grande y atrae la bola. El agua no cuenta golpe. Si la bola se queda en el búnker, el rough, la playa o debajo de un árbol, tu perro te la lleva a la calle sin castigo, y después vas solo hasta la bola.</li>';
  h+='<li><b>Minigolf loco:</b> busca el mejor golpe y apunta solo; los puntos amarillos enseñan todo el recorrido de la bola y la fuerza se para sola. El hoyo es más grande y atrae la bola, el molino para las aspas para dejarte pasar y el agua no cuenta golpe.</li>';
  h+='<li><b>Búsqueda del tesoro:</b> la zona del mapa es más pequeña, una flecha arriba te guía hasta el cofre y la columna de luz sale antes.</li><li><b>Karts:</b> ayuda de dirección (el kart gira solo hacia la pista) y acelerador automático.</li><li><b>Bicis:</b> no te caes al aterrizar mal ni al chocar.</li><li><b>Pantalla:</b> botones más grandes y una etiqueta «Modo fácil» arriba.</li></ul>';
  h+='<p class="note">Las ayudas valen para el que juega en este dispositivo; en una sala, cada uno tiene las suyas. En modo fácil se ganan monedas y trofeos, pero no se guardan los récords de los Retos ni los del minigolf.</p>'; return h; }
function kdSheet(tab){ if(!WP.kids) return; closeModal(); EZ.tab=tab||EZ.tab||'perro'; const T=EZ.tab, B=$('kdBody');
  let h='<h2>Para los peques</h2><div class="tabs">'+[['perro','🐶 Perro'],['minigolf','⛳ Minigolf'],['tesoro','🗺️ Tesoro'],['cromos','🃏 Cromos'],['animales','🐴 Animales'],['aire','🎢 Aire libre'],['facil','🧸 Modo fácil']].map(t=>'<button data-kdt="'+t[0]+'" class="'+(T===t[0]?'on':'')+'">'+t[1]+'</button>').join('')+'</div>';
  h+=T==='perro'?dgTabHTML():T==='minigolf'?mgTabHTML():T==='tesoro'?tsTabHTML():T==='cromos'?tsAlbumHTML():T==='animales'?anTabHTML():T==='aire'?oxTabHTML():ezTabHTML();
  h+='<div class="row" style="margin-top:12px"><button class="btn small" id="kdClose">Cerrar</button></div>'; B.innerHTML=h; $('kdSheet').hidden=false; $('kdSheet').scrollTop=0;
  B.querySelectorAll('[data-kdt]').forEach(b=>b.onclick=()=>kdSheet(b.dataset.kdt)); $('kdClose').onclick=()=>{ $('kdSheet').hidden=true; };
  if(T==='perro') dgTabWire(); else if(T==='minigolf') mgTabWire(); else if(T==='tesoro'||T==='cromos') tsTabWire(); else if(T==='animales') anTabWire(); else if(T==='aire') oxTabWire(); else { $('ezTog').onclick=()=>{ ezSet(!EZ.on); kdSheet('facil'); }; } }
function kdGuideHTML(){ if(!WP.kids) return ''; return dgGuideHTML()+mgGuideHTML()+tsGuideHTML()+anGuideHTML()+oxGuideHTML()+'<li><b>Modo fácil</b> (botón <b>Modo fácil</b> del menú o pestaña del mismo nombre en <b>Para los peques</b>; se guarda en este dispositivo): en el golf apunta solo, la fuerza se para sola en la justa, el hoyo es más grande y atrae la bola, el agua no cuenta golpe y la bola que se queda en un mal sitio vuelve a la calle; en el minigolf, además, enseña en amarillo todo el recorrido y el molino se para; en los karts, ayuda de dirección y acelerador; en bici no te caes. Arriba sale la etiqueta «Modo fácil».</li>'; }
function kdGlossHTML(){ if(!WP.kids) return ''; return dgGlossHTML()+mgGlossHTML()+tsGlossHTML()+oxGlossHTML()+'<dt>Modo fácil</dt><dd>Ayudas automáticas para los pequeños: apuntar, la fuerza justa, un hoyo más grande con imán y sin castigos por agua o malos sitios.</dd><dt>Imán del hoyo</dt><dd>En modo fácil, una bola que pasa cerca del hoyo y despacio se desvía hacia él.</dd>'; }
{ const mk=$('mKids'); if(mk){ mk.hidden=!WP.kids; mk.onclick=()=>{ saveName(); ensureAudio(); kdSheet(); }; } }
document.body.classList.toggle('easy',ezOn());
