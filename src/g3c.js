
/* ================= modal: guide, map legend, glossary, the island, card ================= */
const TABS={
  guia:{t:'Cómo se juega',h:()=>`
    <p>Es la Isla de Valdecañas, en el embalse del mismo nombre (río Tajo, Cáceres), construida con datos reales: el relieve del Instituto Geográfico Nacional, su foto aérea como suelo y cada edificio del Catastro. Empiezas en una avioneta: saltas, planeas y aterrizas donde quieras. Desde ahí puedes explorar, conducir un buggy, nadar, jugar los 18 hoyos y buscar 12 bolas doradas.</p>
    <h3>La caída</h3>
    <ol><li>Mira en el minimapa la línea discontinua: es la ruta de la avioneta.</li><li>Pulsa <b>SALTAR</b> cuando estés encima de donde quieras caer.</li><li>En caída libre, el joystick te dirige; empujar hacia delante te hace caer más rápido.</li><li>El planeador se abre solo a 110 m del suelo (o antes con <b>ABRIR</b>). Planeando, el joystick gira y acelera.</li></ol>
    <h3>En la isla</h3>
    <ul><li><b>Moverte:</b> pon el pulgar izquierdo en la parte baja izquierda y arrástralo. Si lo empujas a tope un momento, esprintas.</li><li><b>Mirar alrededor:</b> arrastra con el otro dedo en la parte derecha.</li><li><b>Saltar:</b> botón Saltar. Desde el agua te subes a pantalanes y muelles.</li><li><b>Acción:</b> el botón rojo cambia según dónde estés: Conducir, Jugar hoyo, Golpear, Ir a la bola o Ir al tee.</li><li><b>Tejados:</b> las azoteas se pueden pisar, pero solo llegas planeando.</li></ul>
    <h3>Jugar al golf</h3>
    <ol><li>Ve a cualquier tee (zona verde con dos bolas azules y un cartel con el número) y pulsa <b>Jugar hoyo</b>.</li><li>Apunta arrastrando en horizontal, con ◀ ▶ o tocando un punto del terreno. <b>Vista</b> sube la cámara sobre el hoyo.</li><li>Mantén pulsado <b>GOLPEAR</b>: el anillo se llena hasta el 100 % (marca negra) y vuelve a bajar. Suelta cuando quieras. Pasar del 100 % da más distancia pero la bola se tuerce.</li><li>Tras el golpe, camina o conduce hasta tu bola (la sigue una luz blanca) o pulsa <b>Ir a la bola</b>.</li><li>En el green el palo es el putter: la línea punteada enseña la primera mitad del recorrido con la caída incluida.</li><li>Árboles y paredes desvían la bola. Si se queda en un tejado, dropeas al lado sin penalidad; si cae al agua, +1 golpe.</li></ol>
    <h3>Cómo leer la pantalla</h3>
    <ul><li><b>Anillo blanco:</b> dónde caerá la bola con la potencia actual, con viento y desnivel; no incluye bote ni rodada.</li><li><b>Flecha de viento:</b> girada respecto a tu dirección de golpe; hacia arriba es viento a favor.</li><li><b>Luces:</b> blanca, tu bola; azul, el siguiente tee; dorada, una bola dorada; naranja, tu marca del mapa.</li><li><b>Minimapa:</b> es el plano del campo (colores en la pestaña Mapa). Arriba es el norte. La flecha eres tú.</li></ul>
    <h3>Teclado</h3>
    <p><span class="kbd">W A S D</span> moverte · arrastrar con el ratón: mirar · <span class="kbd">Espacio</span> saltar, abrir planeador o golpear (mantener) · <span class="kbd">Mayús</span> esprintar · <span class="kbd">E</span> acción · <span class="kbd">M</span> mapa · en el golpe: <span class="kbd">←</span> <span class="kbd">→</span> apuntar, <span class="kbd">↑</span> <span class="kbd">↓</span> palo, <span class="kbd">V</span> vista</p>`},
  mapa:{t:'Mapa y leyenda',h:()=>`<canvas id="guideMap" width="1080" height="1008" style="width:100%;height:auto;border-radius:12px;border:1px solid var(--line)"></canvas>${legendHTML('plano')}<p class="note">Plano del campo dibujado a partir de la foto aérea. Los números son los tees de salida: en rojo, el hoyo que juegas; en gris, los ya jugados. Las líneas discontinuas unen tee y green. En el mapa grande (botón Mapa) puedes cambiar entre este plano y la foto aérea.</p>`},
  glosario:{t:'Glosario',h:()=>`<dl class="gl">
    <dt>Par</dt><dd>Golpes que se esperan en un hoyo: 3, 4 o 5. El campo suma par 72.</dd><dt>Birdie / Eagle</dt><dd>Uno o dos golpes menos que el par.</dd><dt>Bogey</dt><dd>Un golpe más que el par. Doble bogey son dos.</dd>
    <dt>Tee</dt><dd>Zona de salida de cada hoyo, con dos bolas azules y un cartel con el número.</dd><dt>Calle</dt><dd>Hierba corta entre el tee y el green, con franjas de corte.</dd><dt>Rough</dt><dd>Hierba alta y dehesa con encinas.</dd>
    <dt>Green</dt><dd>Hierba muy corta alrededor del hoyo. Aquí se usa el putter.</dd><dt>Antegreen</dt><dd>Anillo que rodea el green.</dd><dt>Búnker</dt><dd>Trampa de arena: frena la bola y acorta el golpe.</dd>
    <dt>Vuelo</dt><dd>Distancia que recorre la bola por el aire hasta el primer bote.</dd><dt>Rodada</dt><dd>Lo que avanza la bola tras botar.</dd><dt>Caída</dt><dd>Inclinación del green que desvía el putt.</dd>
    <dt>Lie</dt><dd>Cómo y dónde reposa la bola antes del golpe.</dd><dt>Golpe de penalidad</dt><dd>Golpe que se suma por mandar la bola al agua.</dd><dt>Dropear</dt><dd>Soltar la bola en un sitio jugable cuando no se puede jugar donde quedó (por ejemplo, en un tejado).</dd>
    <dt>Planeador</dt><dd>Ala con la que bajas tras la caída libre.</dd><dt>Esprint</dt><dd>Carrera rápida: joystick a tope o botón Esprint.</dd><dt>Dehesa</dt><dd>Pastizal con encinas dispersas, típico de Extremadura.</dd>
    <dt>MDT</dt><dd>Modelo Digital del Terreno: la altura del suelo cada 5 m, medida con láser desde avión (LiDAR) por el IGN.</dd><dt>PNOA</dt><dd>Plan Nacional de Ortofotografía Aérea: fotos aéreas de toda España corregidas para que encajen con el mapa.</dd><dt>Catastro</dt><dd>Registro oficial de los edificios: da la planta de cada construcción y su número de pisos.</dd></dl>`},
  isla:{t:'La isla',h:()=>`
    <p>La Isla de Valdecañas ocupa unas 133 hectáreas en la cola del embalse de Valdecañas, entre El Gordo y Berrocalejo (Cáceres), y se une a tierra por un dique con carretera.</p>
    <h3>Lo que hay en la isla real</h3>
    <ul><li>Campo de 18 hoyos, par 72 y 6.319 m desde blancas (5.924 m desde amarillas), diseñado por Álvaro Arana y abierto en 2010.</li><li>Hotel de cuatro estrellas en la parte oeste, con la casa club.</li><li>Unas 185 villas de una planta, de color albero, con cubiertas planas de grava y chimeneas de acero corten.</li><li>Pantalán con marina al este, playa con laguna al oeste, campo de prácticas al sur de la casa club y zona deportiva al norte, junto al dique de acceso.</li><li>En la punta oeste, estructuras de hormigón que se quedaron sin terminar; en el centro, terrazas de parcelas que nunca se urbanizaron.</li></ul>
    <h3>Qué sale de datos reales</h3>
    <ul><li><b>Relieve:</b> Modelo Digital del Terreno de 5 m del IGN (LiDAR). Las sierras del horizonte, del modelo de 200 m.</li><li><b>Suelo:</b> la foto aérea del PNOA, a 0,5 m por píxel en la isla.</li><li><b>Edificios:</b> ${BLD.length} volúmenes con la planta exacta del Catastro; la altura sale de su número de plantas.</li><li><b>Árboles:</b> ${W.TREES.length.toLocaleString('es-ES')} copas detectadas en la foto, con su posición y tamaño.</li><li><b>Agua:</b> el embalse a 313 m sobre el mar; la laguna de la playa y los lagos del campo, a su propio nivel.</li><li><b>Golf:</b> calles, greens y búnkeres son los de la foto; el orden de los hoyos, del plano oficial del campo; par, metros y hándicap, de la tarjeta.</li></ul>
    <h3>Qué es aproximado</h3>
    <ul><li>La posición exacta de cada tee y de la bandera dentro del green: el plano oficial es un dibujo, no un mapa a escala.</li><li>Fachadas, ventanas, porches y chimeneas siguen el estilo de las fotos de las villas, pero no son las de cada casa.</li><li>La especie de cada árbol (encina, pino, ciprés, chopo) se elige por la zona.</li><li>Las estructuras sin terminar están modeladas a mano sobre la foto.</li></ul>
    <p class="src">Datos: relieve y foto aérea © Instituto Geográfico Nacional (CC BY 4.0, <a href="https://centrodedescargas.cnig.es" target="_blank" rel="noopener">CNIG</a>) · edificios: <a href="https://www.catastro.hacienda.gob.es/webinspire/index.html" target="_blank" rel="noopener">Dirección General del Catastro</a> · caminos: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">colaboradores de OpenStreetMap</a> · campo: <a href="https://www.golfpass.com/courses/35938-vincci-valdecanas-golf/scorecard-and-layout" target="_blank" rel="noopener">tarjeta del campo</a>, <a href="https://blog.mobgolf.com/isla-de-valdecanas-fantastico-diseno/" target="_blank" rel="noopener">mobgolf</a>, <a href="https://wantesgolf.wordpress.com/2016/12/29/golf-isla-valdecanas-caceres/" target="_blank" rel="noopener">Wantes Golf</a>, <a href="https://reunido.uniovi.es/index.php/RCG/article/download/11021/10384/20012" target="_blank" rel="noopener">Universidad de Oviedo</a></p>`},
  tarjeta:{t:'Tarjeta',h:()=>cardHTML(false)},
  bolas:{t:'Bolas doradas',h:()=>`<p>Llevas <b>${S.gold.size} de ${GOLD.length}</b>. Algunas pistas:</p><ul>${GOLD.map(o=>'<li>'+(o.taken?'✓ ':'')+o.hint+'</li>').join('')}</ul><p class="note">Las que están en azoteas o en lo alto de estructuras solo se alcanzan planeando: vuelve a saltar desde el menú.</p>`}
};
function cardHTML(final){
  let tp=0,ts=0,rows=''; const g=S.g;
  W.HOLES.forEach((H,i)=>{ const s=g.scores[i]; tp+=H.par; if(s) ts+=s; let cls=''; if(s){ const d=s-H.par; cls=d<=-2?'e':d===-1?'b':d===0?'':d===1?'o':'o2'; }
    rows+='<tr><td>Hoyo '+(i+1)+'</td><td>'+H.par+'</td><td>'+fmt(H.L)+'</td><td>'+(s?'<span class="sc '+cls+'">'+s+'</span>':'—')+'</td><td>'+(s?((s-H.par)>0?'+':'')+(s-H.par):'')+'</td></tr>'; });
  const played=W.HOLES.filter((H,i)=>g.scores[i]).reduce((a,H)=>a+H.par,0); const diff=ts-played;
  return (final?'<p><b style="font-family:var(--f-display);font-size:28px">'+ts+' golpes</b> · '+(diff===0?'al par':(diff>0?'+':'')+diff+' sobre par')+'</p>':'')+
   '<div class="tablewrap"><table class="card"><thead><tr><th>Hoyo</th><th>Par</th><th>Metros</th><th>Golpes</th><th>±</th></tr></thead><tbody>'+rows+'</tbody><tfoot><tr><td>Total</td><td>'+tp+'</td><td>'+fmt(W.HOLES.reduce((a,H)=>a+H.L,0))+'</td><td>'+(ts||'—')+'</td><td>'+(ts?(diff>0?'+':'')+diff:'')+'</td></tr></tfoot></table></div>'+
   '<p class="note" style="margin-top:10px">Metros desde barras amarillas, de la tarjeta oficial. Círculo azul: birdie. Círculo azul relleno: eagle o mejor. Cuadro dorado: bogey. Cuadro dorado relleno: doble bogey o peor.</p>'+
   (final?'<div class="row" style="margin-top:12px"><button class="btn primary" id="again">Jugar otra vuelta</button></div>':'<div class="row" style="margin-top:12px"><button class="btn small" id="resetCard">Borrar tarjeta</button></div>');
}
function openModal(tab,opts){ opts=opts||{}; $('modal').hidden=false; $('sheetTitle').textContent=opts.title||'Menú';
  const keys=['guia','mapa','bolas','glosario','isla','tarjeta'];
  $('tabs').innerHTML=keys.map(k=>'<button data-k="'+k+'" class="'+(k===tab?'on':'')+'">'+TABS[k].t+'</button>').join('');
  $('tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>openModal(b.dataset.k,Object.assign({},opts,{html:null})));
  const inGame=S.mode!=='menu';
  $('menuActs').innerHTML=inGame?'<button class="btn small" id="mResume">Seguir</button><button class="btn small" id="mRedrop">Volver a saltar</button><button class="btn small" id="mDrone">Vista dron</button><button class="btn small" id="mHome">Inicio</button>':'';
  if(inGame){ $('mResume').onclick=closeModal; $('mRedrop').onclick=()=>{ closeModal(); if(S.g.hole>=0){ S.g.hole=-1; S.g.ballVisible=false; } startDrop(); }; $('mDrone').onclick=()=>{ closeModal(); goDrone(); }; $('mHome').onclick=()=>{ closeModal(); goMenu(); }; }
  $('sheetBody').innerHTML=opts.html||TABS[tab].h(); $('sheetBody').scrollTop=0;
  const gm=$('guideMap'); if(gm){ const keep=mapLayer; mapLayer='plano'; drawBigMap(); gm.getContext('2d').drawImage($('bigMap'),0,0,gm.width,gm.height); mapLayer=keep; }
  const ag=$('again'); if(ag) ag.onclick=()=>{ S.g.scores=[]; saveScores(); closeModal(); S.g.next=0; tip('Tarjeta nueva: ve al tee 1',3500); };
  const rc=$('resetCard'); if(rc) rc.onclick=()=>{ S.g.scores=[]; saveScores(); openModal('tarjeta'); };
}
function closeModal(){ $('modal').hidden=true; }
$('closeModal').onclick=closeModal; $('modal').addEventListener('click',e=>{ if(e.target===$('modal')) closeModal(); });

/* ================= menu / drone ================= */
function goMenu(){ S.mode='menu'; orbit.t.set(ISLE[0],10,ISLE[1]); orbit.r=1700; orbit.ph=1.08; orbit.auto=true; orbit.tT=null; plane.visible=false; if(rig) rig.root.visible=false; setWind(0); refreshHUD(); renderSkins(); }
function goDrone(){ S.mode='drone'; orbit.t.set(P.x||ISLE[0],10,P.z||ISLE[1]); orbit.r=900; orbit.auto=true; refreshHUD(); }
function renderSkins(){ const box=$('skins'); box.innerHTML=SKINS.map((s,i)=>`<button class="skin ${i===S.skin?'on':''}" data-i="${i}" aria-label="${s.n}"><svg viewBox="0 0 34 42" aria-hidden="true"><circle cx="17" cy="9" r="7" fill="${s.skin}"/><path d="M10 7a7 7 0 0 1 14 0z" fill="${s.cap||s.hair}"/><rect x="9" y="16" width="16" height="13" rx="4" fill="${s.shirt}"/><rect x="11" y="29" width="5" height="11" rx="2" fill="${s.pants}"/><rect x="18" y="29" width="5" height="11" rx="2" fill="${s.pants}"/></svg>${s.n}</button>`).join('');
  box.querySelectorAll('.skin').forEach(b=>b.onclick=()=>{ setSkin(+b.dataset.i); renderSkins(); }); }

/* ================= input ================= */
const ptrs=new Map(); let stickId=null, lookId=null, stick0=[0,0], pinch0=0, pinchR0=0;
function inStickZone(x,y){ return x<innerWidth*0.45 && y>innerHeight*0.32; }
canvas.addEventListener('pointerdown',e=>{ ensureAudio(); try{canvas.setPointerCapture(e.pointerId);}catch(_){}
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now(),moved:0});
  const m=S.mode;
  if(['walk','drive','fall','glide'].includes(m) && e.pointerType!=='mouse' && stickId===null && inStickZone(e.clientX,e.clientY)){ stickId=e.pointerId; stick0=[e.clientX,e.clientY]; const st=$('stick'); st.hidden=false; st.style.left=e.clientX+'px'; st.style.top=e.clientY+'px'; st.firstElementChild.style.transform=''; if(!S.movedOnce){ S.movedOnce=true; $('stickHint').hidden=true; } return; }
  if(lookId===null) lookId=e.pointerId;
  if(m==='drone'||m==='menu'){ if(ptrs.size===2){ const [a,b]=[...ptrs.values()]; pinch0=Math.hypot(a.x-b.x,a.y-b.y); pinchR0=orbit.r; } orbit.auto=false; orbit.tT=null; }
});
canvas.addEventListener('pointermove',e=>{ const p=ptrs.get(e.pointerId); if(!p) return; const dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY; p.moved+=Math.abs(dx)+Math.abs(dy);
  if(e.pointerId===stickId){ let ox=e.clientX-stick0[0], oy=e.clientY-stick0[1]; const l=Math.hypot(ox,oy), R=55; if(l>R){ ox*=R/l; oy*=R/l; } inp.mx=ox/R; inp.my=-oy/R; $('stick').firstElementChild.style.transform='translate('+ox+'px,'+oy+'px)'; return; }
  const m=S.mode;
  if((m==='drone'||m==='menu')&&ptrs.size===2){ const [a,b]=[...ptrs.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y); if(pinch0>0) orbit.r=clamp(pinchR0*pinch0/d,60,7000); return; }
  if(e.pointerId!==lookId) return;
  if(m==='aim'&&!S.g.overview){ if(p.moved>6){ S.g.yaw+=dx*(CLUBS[S.g.club].putt?0.0025:0.0045); placeAtAddress(); updateGolfHUD(); } return; }
  if(m==='drone'||m==='menu'){ orbit.th+=dx*0.005; orbit.ph=clamp(orbit.ph-dy*0.004,0.12,1.48); return; }
  if(['walk','drive','fall','glide','plane','wait'].includes(m)){ camS.yaw+=dx*0.0058; camS.pitch=clamp(camS.pitch+dy*0.004,-0.35,1.25); camS.lastLook=performance.now(); }
});
function endPtr(e){ const p=ptrs.get(e.pointerId); if(!p) return; ptrs.delete(e.pointerId);
  if(e.pointerId===stickId){ stickId=null; inp.mx=inp.my=0; $('stick').hidden=true; }
  if(e.pointerId===lookId){ lookId=null; if(p.moved<8 && performance.now()-p.t<400) tapAt(e.clientX,e.clientY); }
  if(ptrs.size===0) pinch0=0; }
canvas.addEventListener('pointerup',endPtr); canvas.addEventListener('pointercancel',endPtr);
canvas.addEventListener('wheel',e=>{ e.preventDefault(); if(S.mode==='drone'||S.mode==='menu'){ orbit.r=clamp(orbit.r*Math.exp(e.deltaY*0.0012),60,7000); orbit.auto=false; } else if(S.mode==='walk'){ camS.dist=clamp(camS.dist*Math.exp(e.deltaY*0.001),2.5,12); } },{passive:false});
const ray=new THREE.Raycaster(), ndc=new THREE.Vector2();
function tapAt(x,y){ ndc.set(x/innerWidth*2-1,-(y/innerHeight)*2+1); ray.setFromCamera(ndc,camera); const hit=ray.intersectObjects(pickables,false)[0]; if(!hit) return;
  if(S.mode==='aim'){ const p=hit.point; if(Math.hypot(p.x-S.g.ball.x,p.z-S.g.ball.z)<1) return; S.g.yaw=Math.atan2(p.z-S.g.ball.z,p.x-S.g.ball.x); placeAtAddress(); updateGolfHUD(); }
  else if(S.mode==='drone'){ orbit.tT=hit.point.clone(); orbit.tR=Math.max(140,orbit.r*0.45); orbit.auto=false; } }
function swingDown(e){ if(e) e.preventDefault(); ensureAudio(); if(S.mode!=='aim') return; setMode('swing'); S.g.swingT=0; S.g.power=0; setPowerRing(0); }
function swingUp(e){ if(e) e.preventDefault(); if(S.mode!=='swing') return; const p=S.g.power; setPowerRing(0); if(p<0.03){ setMode('aim'); return; } hit(p); }
$('swing').addEventListener('pointerdown',swingDown); $('swing').addEventListener('pointerup',swingUp); $('swing').addEventListener('pointercancel',swingUp); $('swing').addEventListener('pointerleave',swingUp); $('swing').addEventListener('contextmenu',e=>e.preventDefault());
function stepClub(k){ if(S.mode!=='aim') return; S.g.club=(S.g.club+k+CLUBS.length)%CLUBS.length; prevKey=''; updateGolfHUD(); }
$('clubPrev').onclick=()=>stepClub(-1); $('clubNext').onclick=()=>stepClub(1);
let aimHold=null;
function aimStart(k){ if(S.mode!=='aim') return; const fine=CLUBS[S.g.club].putt?0.004:0.0087; S.g.yaw+=k*fine; placeAtAddress(); updateGolfHUD(); clearInterval(aimHold); aimHold=setInterval(()=>{ if(S.mode==='aim'){ S.g.yaw+=k*fine; placeAtAddress(); updateGolfHUD(); } },70); }
function aimStop(){ clearInterval(aimHold); aimHold=null; }
for(const [id,k] of [['aimL',-1],['aimR',1]]){ const b=$(id); b.addEventListener('pointerdown',e=>{ e.preventDefault(); aimStart(k); }); ['pointerup','pointercancel','pointerleave'].forEach(t=>b.addEventListener(t,aimStop)); }
$('btnView').onclick=()=>{ if(S.mode!=='aim') return; S.g.overview=!S.g.overview; updateGolfHUD(); };
$('gExit').onclick=()=>{ if(S.mode==='aim') exitAim(); };
$('bJump').addEventListener('pointerdown',e=>{ e.preventDefault(); inp.jumpQ=true; });
$('bAct').addEventListener('click',()=>doAction());
$('bSprint').addEventListener('click',()=>{ P.sprintLock=!P.sprintLock; $('bSprint').classList.toggle('on',P.sprintLock); });
$('bBig').addEventListener('pointerdown',e=>{ e.preventDefault(); ensureAudio(); if(S.mode==='plane') jumpFromPlane(); else if(S.mode==='fall') openGlider(); });
$('btnMap').onclick=showMap; $('btnMenu').onclick=()=>openModal('guia'); $('mini').onclick=showMap;
$('btnPlay').onclick=()=>{ S.name=$('pname').value.trim(); store.set('vg_name',S.name); startDrop(); };
$('btnHelp').onclick=()=>openModal('guia'); $('btnDrone').onclick=()=>goDrone();
$('dBack').onclick=()=>{ if(S.landedOnce){ setMode('walk'); } else goMenu(); };
function setQ(q){ store.set('vg_q',q); location.reload(); }
$('qMed').onclick=()=>{ if(QUAL!=='med') setQ('med'); }; $('qHigh').onclick=()=>{ if(QUAL!=='high') setQ('high'); }; $(HIGH?'qHigh':'qMed').classList.add('on');
const KEYDIR={KeyW:[0,1],ArrowUp:[0,1],KeyS:[0,-1],ArrowDown:[0,-1],KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0]};
function keyMove(){ if(stickId!==null) return; let x=0,y=0; for(const k in KEYDIR) if(inp.keys[k]){ x+=KEYDIR[k][0]; y+=KEYDIR[k][1]; } const l=Math.hypot(x,y)||1; inp.mx=x/l*(x||y?1:0); inp.my=y/l*(x||y?1:0); }
addEventListener('keydown',e=>{ if(!$('modal').hidden){ if(e.key==='Escape') closeModal(); return; } if(!$('mapOv').hidden){ if(e.key==='Escape'||e.key==='m'||e.key==='M') hideMap(); return; }
  if(e.target&&e.target.tagName==='INPUT') return;
  const m=S.mode;
  if(m==='aim'||m==='swing'){ if(e.code==='Space'){ e.preventDefault(); if(!e.repeat) swingDown(); }
    else if(e.key==='ArrowLeft'&&m==='aim'){ S.g.yaw-=CLUBS[S.g.club].putt?0.004:0.0087; placeAtAddress(); updateGolfHUD(); } else if(e.key==='ArrowRight'&&m==='aim'){ S.g.yaw+=CLUBS[S.g.club].putt?0.004:0.0087; placeAtAddress(); updateGolfHUD(); }
    else if(e.key==='ArrowUp') stepClub(-1); else if(e.key==='ArrowDown') stepClub(1); else if(e.key==='v'||e.key==='V') $('btnView').click(); else if(e.key==='Escape') exitAim(); return; }
  inp.keys[e.code]=true; keyMove();
  if(e.code==='Space'){ e.preventDefault(); if(m==='plane') jumpFromPlane(); else if(m==='fall') openGlider(); else inp.jumpQ=true; }
  if(e.code==='KeyE') doAction(); if(e.code==='KeyM') showMap(); if(e.key==='Escape') openModal('guia'); });
addEventListener('keyup',e=>{ inp.keys[e.code]=false; keyMove(); if(e.code==='Space'&&(S.mode==='swing')) swingUp(); });
addEventListener('resize',()=>{ renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); });
canvas.addEventListener('contextmenu',e=>e.preventDefault());

/* ================= main loop ================= */
let last=performance.now(), T=0, hudT=0, lodT=0;
function frame(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now; step(dt);
  renderer.render(scene,camera);
  requestAnimationFrame(frame);
}
function step(dt){
  T+=dt;
  waterMat.uniforms.uTime.value=T%10000;
  const m=S.mode, g=S.g;
  if(!S.overlay){
    if(m==='plane'){ S.plane.t+=dt; const d=S.plane.t*S.plane.speed; if(d>S.plane.len){ jumpFromPlane(); } }
    else if(m==='fall') updateFall(dt);
    else if(m==='glide') updateGlide(dt);
    else if(m==='walk') updateWalk(dt);
    else if(m==='drive') updateDrive(dt);
    else if(m==='swing'){ g.swingT+=dt; const up=1.05; g.power=g.swingT<up?g.swingT/up*1.1:1.1-(g.swingT-up)/up*1.1; if(g.power<=0){ g.power=0; setMode('aim'); } setPowerRing(Math.max(0,g.power)); }
    else if(m==='flight') updateFlight(dt);
    else if(m==='wait'){ g.waitT-=dt; if(g.waitT<=0) afterWait(); }
    if(m==='aim'||m==='swing') updatePreview();
  }
  if(plane.visible){ if(m==='plane'){ const [x,y,z]=planePos(); plane.position.set(x,y,z); plane.rotation.y=-Math.atan2(S.plane.dz,S.plane.dx); }
    else { S.plane.t+=dt; const [x,y,z]=planePos(); plane.position.set(x,y,z); if(S.plane.t*S.plane.speed>S.plane.len+800) plane.visible=false; }
    plane.userData.prop.rotation.x+=dt*40; }
  if(rig&&rig.root.visible){ const R=rig; let st='idle', k=0; P.animT+=dt;
    if(m==='fall') st='fall'; else if(m==='glide') st='glide'; else if(m==='drive') st='drive';
    else if(m==='aim') st='address'; else if(m==='swing'){ st='swing'; k=Math.min(1,g.power)*(CLUBS[g.club].putt?0.25:1); }
    else if(m==='flight'||(m==='wait'&&g.after!=='holed')){ st='follow'; P.followT+=dt; k=P.followT/0.35; }
    else if(P.cheerT>0){ st='cheer'; P.cheerT-=dt; }
    else if(P.swim){ const hs=Math.hypot(P.vx,P.vz); st=hs>0.5?'swim':'tread'; }
    else if(!P.onGround) st='air';
    else { const hs=Math.hypot(P.vx,P.vz); if(hs>0.4){ st='run'; k=clamp(hs/10.5,0.2,1); P.animT+=dt*hs*1.15; } }
    poseRig(R,st,(st==='run'||st==='swim')?P.animT:T,k);
    R.root.position.set(P.x,P.y,P.z); R.root.rotation.set(0,-P.yaw,0);
    if(m==='drive'&&P.buggy){ const b=P.buggy; const c=Math.cos(b.yaw), s=Math.sin(b.yaw); R.root.position.set(b.x-c*0.25+s*0.28,b.y+0.18,b.z-s*0.25-c*0.28); }
  }
  if(g.ballVisible&&(['aim','swing','flight','wait','walk','drive'].includes(m))){ ballMesh.visible=true; ballMesh.position.set(g.ball.x,g.ball.y+0.2,g.ball.z); } else ballMesh.visible=false;
  ballBeam.visible=(m==='walk'||m==='drive')&&g.hole>=0&&g.ballVisible; if(ballBeam.visible) ballBeam.position.set(g.ball.x,g.ball.y+22.5,g.ball.z);
  teeBeam.visible=(m==='walk'||m==='drive')&&g.hole<0&&g.next>=0&&g.scores.filter(Boolean).length>0; if(teeBeam.visible){ const H=W.HOLES[g.next]; teeBeam.position.set(H.tx,W.terrain(H.tx,H.tz)+22.5,H.tz); }
  markBeam.visible=!!S.marker&&m!=='menu'; if(markBeam.visible) markBeam.position.set(S.marker[0],Math.max(0,terrainAt(S.marker[0],S.marker[1]))+22.5,S.marker[1]);
  for(const o of GOLD){ if(o.taken) continue;
    if(rig&&rig.root.visible&&Math.abs(P.x-o.x)<2.2&&Math.abs(P.z-o.z)<2.2&&Math.abs(P.y+0.9-o.y)<2.4){ o.taken=true; S.gold.add(o.i); store.set('vg_gold3',JSON.stringify([...S.gold])); blip('gold');
      toast(S.gold.size===GOLD.length?'¡Las '+GOLD.length+' bolas doradas!':'¡Bola dorada!',S.gold.size+' de '+GOLD.length); } }
  updateGoldMeshes(T); animateFlags(T);
  for(const b of boats){ b.a+=b.sp*dt*4; b.g.position.set(b.cx+Math.cos(b.a)*b.r,0.1+Math.sin(T*1.3+b.a*5)*0.15,b.cz+Math.sin(b.a)*b.r); b.g.rotation.y=-b.a+(b.sp>0?-Math.PI/2:Math.PI/2); }
  animateBirds(T,dt);
  if(splashT>0){ splashT-=dt; const a=splashGeo.attributes.position.array; const y0=splash.userData.y0||0; for(let i=0;i<60;i++){ const v=splashV[i]; v[1]-=9.8*dt; a[i*3]+=v[0]*dt; a[i*3+1]=Math.max(y0,a[i*3+1]+v[1]*dt); a[i*3+2]+=v[2]*dt; } splashGeo.attributes.position.needsUpdate=true; splash.material.opacity=Math.max(0,splashT/1.3); }
  updateCamera(dt);
  { const hgt=camera.position.y-Math.max(terrainAt(camera.position.x,camera.position.z),0); const nn=clamp(hgt*0.03,0.25,30); if(Math.abs(nn-camera.near)>camera.near*0.15){ camera.near=nn; camera.updateProjectionMatrix(); } }
  sky.position.copy(camera.position);
  lodT+=dt; if(lodT>0.25){ lodT=0; updateTreeLOD(); }
  const focus=(m==='menu'||m==='drone')?orbit.t:(m==='plane'?new V3(...planePos()):(['flight','wait'].includes(m)?g.ball:new V3(P.x,P.y,P.z)));
  sun.target.position.copy(focus); sun.position.set(focus.x+sunDir.x*500,focus.y+sunDir.y*500,focus.z+sunDir.z*500);
  const sc=(m==='menu'||m==='drone')?Math.min(600,Math.max(120,orbit.r*0.35)):(g.overview?220:(m==='glide'||m==='fall'||m==='plane'?160:90));
  if(sun.shadow.camera.right!==sc){ Object.assign(sun.shadow.camera,{left:-sc,right:sc,top:sc,bottom:-sc}); sun.shadow.camera.updateProjectionMatrix(); }
  hudT+=dt; if(hudT>0.1){ hudT=0; if(m!=='menu'&&m!=='drone'){ statusText(); computeAction(); drawMini(); if(m==='plane'||m==='fall'||m==='glide'){ const gnd=Math.max(W.waterLevel(P.x,P.z),groundAt(P.x,P.z,9999)); $('altV').textContent=fmt(Math.max(0,(m==='plane'?planePos()[1]:P.y)-gnd)); } if(m==='flight') $('hcDist').innerHTML='<b>'+fmt(distToPin())+'</b> m a bandera'; } }
  updateTags(); updateLabels();
}

/* ================= boot ================= */
const loadBar=$('loadBar').firstElementChild, loadTxt=$('loadTxt');
function progress(p,t){ loadBar.style.width=(p*100)+'%'; loadTxt.textContent=t; }
const nextFrame=()=>new Promise(r=>setTimeout(r,30));
async function boot(){
  try{
    progress(0.03,'Descargando el relieve, la foto aérea y el Catastro…');
    await loadWorld(progress);
    progress(0.47,'Cargando la foto aérea…');
    const [tCore,tWide,imPhoto,imPlan]=await Promise.all([loadTex(HIGH?'ortho_core_4096.jpg':'ortho_core_2048.jpg'),loadTex('ortho_wide_2048.jpg'),loadImg('ortho_map_1024.jpg'),loadImg('map_surface_1024.png')]);
    surfTex=makeSurfTex();
    progress(0.58,'Modelando el relieve real (IGN, 5 m)…'); await nextFrame();
    buildCore(tCore); buildWide(tWide); progress(0.66,'Sierras, embalse y lagos…'); await nextFrame();
    buildRegion(); buildWater(); buildGolf(); progress(0.74,'Levantando villas y hotel con las plantas del Catastro…'); await nextFrame();
    buildBuildings(); buildRuins(); buildMarina(); progress(0.84,'Plantando los árboles de la foto…'); await nextFrame();
    buildTrees(); buildLife(); progress(0.92,'Aparcando buggies y escondiendo bolas doradas…'); await nextFrame();
    placeBuggies(); buildGold(); plane=makePlane(); setSkin(S.skin);
    try{ S.g.scores=JSON.parse(store.get('vg_scores3')||'[]'); }catch(e){ S.g.scores=[]; } S.g.next=nextUnplayed(0);
    progress(0.97,'Trazando el mapa…'); await nextFrame();
    buildMaps(imPhoto,imPlan); buildPOIs(); $('pname').value=S.name;
    const b=store.get('vg_best18'); $('bestTxt').textContent=b?' · Mejor vuelta: '+b+' golpes':'';
    progress(1,'Listo'); await nextFrame();
    $('loading').hidden=true; goMenu(); requestAnimationFrame(frame);
  }catch(err){ console.error(err); loadTxt.textContent='No se pudo cargar la isla: '+err.message; }
}
boot();
window.__vg={S,P,W,CLUBS,newSim,simStep,startDrop,jumpFromPlane,openGlider,startHole,enterAim,doAction,inp,camS,camera,camLook,camT,get rig(){return rig;},get glider(){return glider;},tick(n,dt){ for(let i=0;i<n;i++) step(dt||1/30); },buggies,GOLD,hit,landNow,setMode,orbit,goDrone,BLD,PLAT,groundAt,bldAt,showMap,setLayer,openModal,renderer,scene,treeChunks};
})();
