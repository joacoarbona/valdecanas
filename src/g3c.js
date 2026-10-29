
/* ================= modal: guide, map legend, glossary, the island, card ================= */
const TABS={
  guia:{t:'Cómo se juega',h:()=>`
    <p>${WP.T.guideIntro}</p>
    <h3>La caída</h3>
    <ol><li>Mira en el minimapa la línea discontinua: es la ruta de la avioneta.</li><li>Pulsa <b>SALTAR</b> cuando estés encima de donde quieras caer.</li><li>En caída libre, el joystick te dirige; empujar hacia delante te hace caer más rápido.</li><li>El planeador se abre solo a 110 m del suelo (o antes con <b>ABRIR</b>). Planeando, el joystick gira y acelera.</li></ol>
    <h3>${WP.T.onGround}</h3>
    <ul><li><b>Moverte:</b> pon el pulgar izquierdo en la parte baja izquierda y arrástralo. Si lo empujas a tope un momento, esprintas.</li><li><b>Mirar alrededor:</b> arrastra con el otro dedo en la parte derecha.</li><li><b>Saltar:</b> botón Saltar. Desde el agua te subes a pantalanes y muelles.</li><li><b>Acción:</b> el botón rojo cambia según dónde estés: Conducir, Jugar hoyo, Golpear, Ir a la bola o Ir al tee.</li><li><b>Tejados:</b> las azoteas se pueden pisar, pero solo llegas planeando.</li><li><b>Casas:</b> junto a una ${WP.T.house} aparece <b>Entrar</b>. Dentro la ves en <b>primera persona</b>, a la altura de los ojos; el botón <b>3ª</b> (o la tecla <span class="kbd">C</span>) cambia a verte desde atrás y <b>1ª</b> vuelve. Las ventanas son huecos de verdad: ves el jardín y ${WP.T.place}, y el sol entra y dibuja su mancha en el suelo. Las casas grandes tienen salón-cocina, dormitorios, baño y una estancia especial; se pasa de una a otra por puertas sin hoja. Cada casa tiene una de 8 decoraciones (rústico extremeño, moderno, nórdico, mediterráneo, club de golf, familiar, sala de juegos y zen), siempre la misma para esa casa. De noche se encienden las lámparas y, en la rústica, la chimenea. Los muebles se esquivan; para subirte a una cama o un sofá, salta. Dentro, el minimapa es el <b>plano de la casa</b>. <b>▶ Recorrido</b> (bajo el nombre de la casa, o la tecla <span class="kbd">R</span>) te lleva andando por todas las estancias, se para en cada una y mira alrededor; tocar la pantalla o moverte lo para. <b>Salir</b> te devuelve al jardín.</li><li><b>Piscinas:</b> las de las ${WP.T.houses} son de verdad: puedes nadar en ellas.</li><li><b>Coches (bonus):</b> junto al tee del hoyo 1${W.MULTI?' de cada recorrido':''} hay un deportivo, un utilitario y un todoterreno. Al subir eliges ir solo o con copiloto (el botón <b>Copiloto</b> la sube o la baja). Joystick para acelerar, frenar y girar; mantén <b>Derrape</b> (o <span class="kbd">Espacio</span>) para tirar del freno de mano y derrapar: deja marcas y humo, y los derrapes largos cuentan como récord. El deportivo corre más, el utilitario gira mejor y el todoterreno va mejor fuera de la calle.</li><li><b>Ver hoyos:</b> en el inicio o en el menú (también en la pestaña Hoyos). La cámara sale por detrás del tee, recorre la calle con las distancias al green marcadas (50, 100, 150… m) y gira sobre el green. ◀ ▶ cambian de hoyo; <b>Pausa</b> la detiene y entonces puedes girar arrastrando y acercarte pellizcando; <b>Jugar este hoyo</b> te pone en su tee.</li>${WP.T.guideExtra||''}</ul>
    <h3>Jugar con amigos</h3>
    <ol><li>En el inicio pulsa <b>Crear sala</b>: sale un código de 6 letras y números (por ejemplo K7M 2QX).</li><li>Pulsa <b>Invitar</b> y manda el enlace por WhatsApp. Quien lo abra entra en tu sala; también vale escribir el código y pulsar <b>Unirme</b>.</li><li>Cada uno salta cuando quiera, o pulsad <b>Avioneta para todos</b>: a los demás les sale un aviso para subir al mismo avión.</li><li>Ves a tus amigos con su personaje y su nombre encima (con la distancia si están lejos). En el minimapa y el mapa son puntos del color de su camiseta.</li><li>En la pestaña <b>Amigos</b>: <b>Ir</b> te lleva junto a uno y <b>Jugar el 7</b> te pone en el tee del hoyo que está jugando. Cada uno juega su bola (ves las de los demás con una estela de su color) y la <b>tarjeta de la sala</b> junta los golpes de todos.</li><li><b>Chat:</b> botón del bocadillo, o teclas <span class="kbd">Intro</span> o <span class="kbd">T</span>. <b>Voz:</b> botón del micrófono (la primera vez el navegador pide permiso). Con <b>voz por cercanía</b> oyes más fuerte a quien está cerca, como en ${WP.T.place} de verdad.</li></ol>
    <p class="note">Los mensajes de la sala pasan cifrados por servidores públicos de mensajería; la voz va directa entre navegadores. Detalles en la pestaña Amigos.</p>
    <h3>Hora del día, sonido y gráficos</h3>
    <ul><li><b>Hora:</b> en el inicio o en el menú. «Ahora» pone el sol donde está en este momento sobre ${WP.T.place}; también puedes elegir mañana, mediodía, atardecer (sol dorado, con el campo bien iluminado), puesta de sol (el sol en el horizonte, más oscuro y anaranjado) o noche (con estrellas y ventanas encendidas).</li><li><b>Sonido:</b> ${WP.T.sounds}. Se apaga con el botón Sonido.</li><li><b>Gráficos</b> (en el inicio): <b>Altos</b> activa todo: luz de alto rango (HDR) con exposición automática, sombreado de contacto (SSAO), resplandor de luces y sol, reflejos, hierba en 3D más densa y sombras más finas. <b>Medios</b> mantiene el HDR, el resplandor y la hierba, sin SSAO. <b>Auto</b> elige según tu equipo y baja la resolución si el juego va lento. En navegadores sin WebGL 2 se usa un modo sencillo sin estos efectos. Explicación de cada término en el Glosario.</li></ul>
    <h3>Jugar al golf</h3>
    <ol><li>Ve a cualquier tee (zona verde con dos bolas azules y un cartel con el número) y pulsa <b>Jugar hoyo</b>.</li><li>Apunta arrastrando en horizontal, con ◀ ▶ o tocando un punto del terreno. <b>Vista</b> sube la cámara sobre el hoyo.</li><li>Mantén pulsado <b>GOLPEAR</b>: el anillo se llena hasta el 100 % (marca negra) y vuelve a bajar. Suelta cuando quieras. Pasar del 100 % da más distancia pero la bola se tuerce.</li><li>Tras el golpe, camina o conduce hasta tu bola (la sigue una luz blanca) o pulsa <b>Ir a la bola</b>.</li><li>En el green el palo es el putter: la línea punteada enseña la primera mitad del recorrido con la caída incluida.</li><li>Árboles y paredes desvían la bola. Si se queda en un tejado, dropeas al lado sin penalidad; si cae al agua, +1 golpe.</li></ol>
    <h3>Cómo leer la pantalla</h3>
    <ul><li><b>Anillo blanco:</b> dónde caerá la bola con la potencia actual, con viento y desnivel; no incluye bote ni rodada.</li><li><b>Flecha de viento:</b> girada respecto a tu dirección de golpe; hacia arriba es viento a favor.</li><li><b>Luces:</b> blanca, tu bola; azul, el siguiente tee; dorada, una bola dorada; naranja, tu marca del mapa.</li><li><b>Minimapa:</b> es el plano del campo (colores en la pestaña Mapa). Arriba es el norte. La flecha eres tú.</li><li><b>Plano de la casa:</b> dentro de una ${WP.T.house} el minimapa y el mapa grande muestran su planta: muros exteriores en gris oscuro, tabiques en gris, ventanas en azul, puertas en dorado, muebles en beige con su nombre, alfombras en rosado y cada estancia con su nombre y superficie. La leyenda completa está junto al mapa grande.</li></ul>
    <h3>Teclado</h3>
    <p><span class="kbd">W A S D</span> moverte · arrastrar con el ratón: mirar · <span class="kbd">Espacio</span> saltar, abrir planeador o golpear (mantener) · <span class="kbd">Mayús</span> esprintar · <span class="kbd">E</span> acción (entrar y salir de las casas) · <span class="kbd">C</span> dentro de una casa, primera o tercera persona · <span class="kbd">R</span> recorrido de la casa · <span class="kbd">M</span> mapa (dentro de una casa, su plano) · en el golpe: <span class="kbd">←</span> <span class="kbd">→</span> apuntar, <span class="kbd">↑</span> <span class="kbd">↓</span> palo, <span class="kbd">V</span> vista</p>`},
  mapa:{t:'Mapa y leyenda',h:()=>`<canvas id="guideMap" width="1080" height="1008" style="width:100%;height:auto;border-radius:12px;border:1px solid var(--line)"></canvas>${legendHTML('plano')}<p class="note">${WP.T.planNote} Los números son los tees de salida: en rojo, el hoyo que juegas; en gris, los ya jugados. Las líneas discontinuas unen tee y green. En el mapa grande (botón Mapa) puedes cambiar entre este plano y la foto aérea.</p>`},
  glosario:{t:'Glosario',h:()=>`<dl class="gl">
    <dt>Par</dt><dd>Golpes que se esperan en un hoyo: 3, 4 o 5. ${W.MULTI?W.COURSES.map(C=>C.name+' suma par '+C.par).join('; ')+'.':'El campo suma par '+W.COURSES[0].par+'.'}</dd><dt>Birdie / Eagle</dt><dd>Uno o dos golpes menos que el par.</dd><dt>Bogey</dt><dd>Un golpe más que el par. Doble bogey son dos.</dd>
    <dt>Tee</dt><dd>Zona de salida de cada hoyo, con dos bolas azules y un cartel con el número.</dd><dt>Calle</dt><dd>Hierba corta entre el tee y el green, con franjas de corte.</dd><dt>Rough</dt><dd>${WP.T.rough}</dd>
    <dt>Green</dt><dd>Hierba muy corta alrededor del hoyo. Aquí se usa el putter.</dd><dt>Antegreen</dt><dd>Anillo que rodea el green.</dd><dt>Búnker</dt><dd>Trampa de arena: frena la bola y acorta el golpe.</dd>
    <dt>Vuelo</dt><dd>Distancia que recorre la bola por el aire hasta el primer bote.</dd><dt>Rodada</dt><dd>Lo que avanza la bola tras botar.</dd><dt>Caída</dt><dd>Inclinación del green que desvía el putt.</dd>
    <dt>Lie</dt><dd>Cómo y dónde reposa la bola antes del golpe.</dd><dt>Golpe de penalidad</dt><dd>Golpe que se suma por mandar la bola al agua.</dd><dt>Dropear</dt><dd>Soltar la bola en un sitio jugable cuando no se puede jugar donde quedó (por ejemplo, en un tejado).</dd>
    <dt>Planeador</dt><dd>Ala con la que bajas tras la caída libre.</dd><dt>Derrape</dt><dd>Cuando el coche se desliza de lado: las ruedas traseras pierden agarre (con el freno de mano o girando fuerte a mucha velocidad).</dd><dt>Dogleg</dt><dd>Hoyo cuya calle gira a la izquierda o a la derecha.</dd><dt>Esprint</dt><dd>Carrera rápida: joystick a tope o botón Esprint.</dd>
    <dt>MDT</dt><dd>Modelo Digital del Terreno: la altura del suelo cada ${WP.T.mdtStep}, medida con láser desde avión (LiDAR) por el IGN.</dd><dt>PNOA</dt><dd>Plan Nacional de Ortofotografía Aérea: fotos aéreas de toda España corregidas para que encajen con el mapa.</dd><dt>Catastro</dt><dd>Registro oficial de los edificios: da la planta de cada construcción y su número de pisos.</dd>${WP.T.glossary||''}
    <dt>Sala</dt><dd>Grupo privado de jugadores que comparten ${WP.T.place} a la vez. Se entra con su código de 6 caracteres o con el enlace de invitación.</dd><dt>Avioneta para todos</dt><dd>Llamada que sube a toda la sala al mismo avión; cada uno salta cuando quiere.</dd><dt>Tarjeta de la sala</dt><dd>Tabla con los golpes de cada jugador en cada hoyo, que se actualiza sola al terminar cada hoyo.</dd><dt>Voz por cercanía</dt><dd>Modo de chat de voz en el que el volumen baja con la distancia y deja de oírse a más de 140 m.</dd><dt>Cifrado</dt><dd>Los mensajes se codifican con una clave que sale del código de la sala: quien no tiene el código no puede leerlos.</dd><dt>HDR (alto rango dinámico)</dt><dd>La escena se calcula con luces mucho más intensas que lo que cabe en la pantalla (el sol, una lámpara, una ventana) y al final se comprime como haría una cámara. Así se ven a la vez el interior de una casa y el jardín soleado tras la ventana.</dd><dt>Exposición automática</dt><dd>Como el ojo o una cámara: al entrar en una casa o de noche la imagen se aclara poco a poco; al salir al sol se oscurece.</dd><dt>SSAO (sombreado de contacto)</dt><dd>Oscurece un poco las esquinas, las juntas y la parte de abajo de los muebles, donde llega menos luz rebotada. Solo con gráficos Altos.</dd><dt>Resplandor (bloom)</dt><dd>Halo suave alrededor de lo que brilla mucho: el sol en el agua, las ventanas encendidas de noche, la chimenea.</dd><dt>PBR (materiales físicos)</dt><dd>Cada material tiene rugosidad y brillo metálico reales: el cromo refleja, la tela es mate y el suelo pulido devuelve el reflejo de las ventanas.</dd><dt>Mapa de reflejos</dt><dd>Foto en todas las direcciones que se toma al entrar en una casa, desde el centro del salón. Da los reflejos de los muebles y la luz que rebota en paredes y suelo; con el cielo, lo mismo fuera.</dd><dt>Primera / tercera persona</dt><dd>En primera persona ves con los ojos de tu personaje; en tercera, la cámara va detrás y te ves entero.</dd><dt>Tabique</dt><dd>Pared interior que separa dos estancias de la casa.</dd></dl>`},
  lugar:{t:WP.about.t,h:()=>WP.about.h({BLD,W,fmt})},
  tarjeta:{t:'Tarjeta',h:()=>cardHTML(false)},
  hoyos:{t:'Hoyos',h:()=>holesHTML(),wire:holesWire},
  avatares:{t:'Avatares',h:()=>avatarsTabHTML(),wire:avatarsTabWire},
  amigos:{t:'Amigos',h:()=>mpPanelHTML()},
  bolas:{t:'Bolas doradas',h:()=>`<p>Llevas <b>${S.gold.size} de ${GOLD.length}</b>. Algunas pistas:</p><ul>${GOLD.map(o=>'<li>'+(o.taken?'✓ ':'')+o.hint+'</li>').join('')}</ul><p class="note">Las que están en azoteas o en lo alto de estructuras solo se alcanzan planeando: vuelve a saltar desde el menú.</p>`}
};
function cardHTML(final){
  let tp=0,ts=0,rows=''; const g=S.g; const C=W.COURSES[S.course]||W.COURSES[0];
  C.holes.forEach(i=>{ const H=W.HOLES[i]; const s=g.scores[i]; tp+=H.par; if(s) ts+=s; let cls=''; if(s){ const d=s-H.par; cls=d<=-2?'e':d===-1?'b':d===0?'':d===1?'o':'o2'; }
    rows+='<tr><td>Hoyo '+H.n+'</td><td>'+H.par+'</td><td>'+fmt(H.L)+'</td>'+(W.MULTI?'<td>'+(H.hcp||'')+'</td>':'')+'<td>'+(s?'<span class="sc '+cls+'">'+s+'</span>':'—')+'</td><td>'+(s?((s-H.par)>0?'+':'')+(s-H.par):'')+'</td></tr>'; });
  const played=C.holes.filter(i=>g.scores[i]).reduce((a,i)=>a+W.HOLES[i].par,0); const diff=ts-played;
  const chips=W.MULTI&&!final?'<div class="row" style="margin:0 0 10px;flex-wrap:wrap;gap:6px">'+W.COURSES.map(c=>'<button class="btn small'+(c.k===S.course?' primary':'')+'" data-course="'+c.k+'">'+c.name+'</button>').join('')+'</div>':'';
  const best=+store.get(bestKey(C));
  return chips+(W.MULTI?'<p style="margin:0 0 8px"><b>'+C.name+'</b>'+(C.club?' · '+C.club:'')+' · par '+C.par+(best?' · tu mejor vuelta: '+best:'')+'</p>':'')+(final?'<p><b style="font-family:var(--f-display);font-size:28px">'+ts+' golpes</b> · '+(diff===0?'al par':(diff>0?'+':'')+diff+' sobre par')+'</p>':'')+
   '<div class="tablewrap"><table class="card"><thead><tr><th>Hoyo</th><th>Par</th><th>Metros</th>'+(W.MULTI?'<th>Hcp</th>':'')+'<th>Golpes</th><th>±</th></tr></thead><tbody>'+rows+'</tbody><tfoot><tr><td>Total</td><td>'+tp+'</td><td>'+fmt(C.holes.reduce((a,i)=>a+W.HOLES[i].L,0))+'</td>'+(W.MULTI?'<td></td>':'')+'<td>'+(ts||'—')+'</td><td>'+(ts?(diff>0?'+':'')+diff:'')+'</td></tr></tfoot></table></div>'+
   '<p class="note" style="margin-top:10px">'+(C.note||WP.T.cardNote)+' Círculo azul: birdie. Círculo azul relleno: eagle o mejor. Cuadro dorado: bogey. Cuadro dorado relleno: doble bogey o peor.</p>'+
   (final?'<div class="row" style="margin-top:12px"><button class="btn primary" id="again">Jugar otra vuelta</button></div>':'<div class="row" style="margin-top:12px"><button class="btn small" id="resetCard">Borrar tarjeta'+(W.MULTI?' de '+C.short:'')+'</button></div>');
}
function openModal(tab,opts){ opts=opts||{}; $('modal').hidden=false; $('sheetTitle').textContent=opts.title||'Menú';
  const keys=['guia','hoyos'].concat(WP.avatars?['avatares']:[],['amigos','mapa','bolas','glosario','lugar','tarjeta'],WP.extraTabs||[]);
  $('tabs').innerHTML=keys.map(k=>'<button data-k="'+k+'" class="'+(k===tab?'on':'')+'">'+TABS[k].t+'</button>').join('');
  $('tabs').querySelectorAll('button').forEach(b=>b.onclick=()=>openModal(b.dataset.k,Object.assign({},opts,{html:null})));
  const inGame=S.mode!=='menu';
  const TODN={real:'ahora',manana:'mañana',mediodia:'mediodía',tarde:'atardecer',puesta:'puesta de sol',noche:'noche'};
  $('menuActs').innerHTML=inGame?'<button class="btn small" id="mResume">Seguir</button><button class="btn small" id="mRedrop">Volver a saltar</button><button class="btn small" id="mDrone">Vista dron</button><button class="btn small" id="mHoles">Ver hoyos</button><button class="btn small" id="mTod">Hora: '+TODN[TOD.mode]+'</button><button class="btn small" id="mSound">Sonido: '+(SOUND?'sí':'no')+'</button><button class="btn small" id="mHome">Inicio</button>':'';
  if(inGame){ $('mTod').onclick=()=>{ const order=['real','manana','mediodia','tarde','puesta','noche']; const nx=order[(order.indexOf(TOD.mode)+1)%order.length]; setTOD(nx); $('mTod').textContent='Hora: '+TODN[nx]; };
    $('mSound').onclick=()=>{ ensureAudio(); setSound(!SOUND); }; }
  if(inGame){ $('mResume').onclick=closeModal; $('mRedrop').onclick=()=>{ closeModal(); if(S.g.hole>=0){ S.g.hole=-1; S.g.ballVisible=false; } startDrop(); }; $('mDrone').onclick=()=>{ closeModal(); goDrone(); }; $('mHoles').onclick=()=>{ const g=S.g; viewHole(g.hole>=0?g.hole:(g.next>=0?g.next:W.COURSES[S.course].holes[0])); }; $('mHome').onclick=()=>{ closeModal(); goMenu(); }; }
  $('sheetBody').innerHTML=opts.html||TABS[tab].h(); $('sheetBody').scrollTop=0;
  const gm=$('guideMap'); if(gm){ const keep=mapLayer; mapLayer='plano'; drawBigMap(); gm.getContext('2d').drawImage($('bigMap'),0,0,gm.width,gm.height); mapLayer=keep; }
  const ag=$('again'); if(ag) ag.onclick=()=>{ clearCard(); closeModal(); tip('Tarjeta nueva: ve al tee '+W.HOLES[S.g.next].n,3500); };
  const rc=$('resetCard'); if(rc) rc.onclick=()=>{ clearCard(); openModal('tarjeta'); };
  $('sheetBody').querySelectorAll('[data-course]').forEach(b=>b.onclick=()=>{ setCourse(+b.dataset.course); openModal(tab,opts); });
  if(TABS[tab].wire) TABS[tab].wire();
  MP.panelOpen=tab==='amigos'&&!opts.html; if(MP.panelOpen) mpPanelWire();
}
function closeModal(){ $('modal').hidden=true; MP.panelOpen=false; }
$('closeModal').onclick=closeModal; $('modal').addEventListener('click',e=>{ if(e.target===$('modal')) closeModal(); });

/* ================= menu / drone ================= */
function goMenu(){ if(S.interior) exitVilla(); S.mode='menu'; orbit.t.set(ISLE[0],WP.centerY||10,ISLE[1]); orbit.r=WP.orbitR||1700; orbit.ph=1.08; orbit.auto=true; orbit.tT=null; plane.visible=false; if(rig) rig.root.visible=false; setWind(0); refreshHUD(); renderSkins(); }
function goDrone(){ if(S.interior) exitVilla(); S.mode='drone'; orbit.t.set(P.x||ISLE[0],(P.x?P.y:WP.centerY)||10,P.z||ISLE[1]); orbit.r=WP.droneR||900; orbit.auto=true; refreshHUD(); }
function renderSkins(){ const box=$('skins'); box.innerHTML=SKINS.map((s,i)=>`<button class="skin ${i===S.skin&&!S.av?'on':''}" data-i="${i}" aria-label="${s.n}"><svg viewBox="0 0 34 42" aria-hidden="true"><circle cx="17" cy="9" r="7" fill="${s.skin}"/><path d="M10 7a7 7 0 0 1 14 0z" fill="${s.cap||s.hair}"/><rect x="9" y="16" width="16" height="13" rx="4" fill="${s.shirt}"/><rect x="11" y="29" width="5" height="11" rx="2" fill="${s.pants}"/><rect x="18" y="29" width="5" height="11" rx="2" fill="${s.pants}"/></svg>${s.n}</button>`).join('');
  box.querySelectorAll('.skin').forEach(b=>b.onclick=()=>{ setSkin(+b.dataset.i); renderSkins(); renderFriends(); }); }

/* ================= input ================= */
const ptrs=new Map(); let stickId=null, lookId=null, stick0=[0,0], pinch0=0, pinchR0=0;
function inStickZone(x,y){ return x<innerWidth*0.45 && y>innerHeight*0.32; }
canvas.addEventListener('pointerdown',e=>{ ensureAudio(); if(S.tour) stopTour(); try{canvas.setPointerCapture(e.pointerId);}catch(_){}
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,t:performance.now(),moved:0});
  const m=S.mode;
  if(['walk','drive','fall','glide'].includes(m) && e.pointerType!=='mouse' && stickId===null && inStickZone(e.clientX,e.clientY)){ stickId=e.pointerId; stick0=[e.clientX,e.clientY]; const st=$('stick'); st.hidden=false; st.style.left=e.clientX+'px'; st.style.top=e.clientY+'px'; st.firstElementChild.style.transform=''; if(!S.movedOnce){ S.movedOnce=true; $('stickHint').hidden=true; } return; }
  if(lookId===null) lookId=e.pointerId;
  if(m==='view'&&!VW.paused) viewPause(true);
  if(m==='drone'||m==='menu'||m==='view'){ if(ptrs.size===2){ const [a,b]=[...ptrs.values()]; pinch0=Math.hypot(a.x-b.x,a.y-b.y); pinchR0=orbit.r; } orbit.auto=false; orbit.tT=null; }
});
canvas.addEventListener('pointermove',e=>{ const p=ptrs.get(e.pointerId); if(!p) return; const dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY; p.moved+=Math.abs(dx)+Math.abs(dy);
  if(e.pointerId===stickId){ let ox=e.clientX-stick0[0], oy=e.clientY-stick0[1]; const l=Math.hypot(ox,oy), R=55; if(l>R){ ox*=R/l; oy*=R/l; } inp.mx=ox/R; inp.my=-oy/R; $('stick').firstElementChild.style.transform='translate('+ox+'px,'+oy+'px)'; return; }
  const m=S.mode;
  if((m==='drone'||m==='menu'||m==='view')&&ptrs.size===2){ const [a,b]=[...ptrs.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y); if(pinch0>0) orbit.r=clamp(pinchR0*pinch0/d,60,7000); return; }
  if(e.pointerId!==lookId) return;
  if(m==='aim'&&!S.g.overview){ if(p.moved>6){ S.g.yaw+=dx*(CLUBS[S.g.club].putt?0.0025:0.0045); placeAtAddress(); updateGolfHUD(); } return; }
  if(m==='drone'||m==='menu'||m==='view'){ orbit.th+=dx*0.005; orbit.ph=clamp(orbit.ph-dy*0.004,0.12,1.48); return; }
  if(['walk','drive','fall','glide','plane','wait'].includes(m)){ camS.yaw+=dx*0.0058; const fp=camS.fp&&S.interior; camS.pitch=clamp(camS.pitch+dy*0.004,fp?-1.05:-0.35,fp?1.15:1.25); camS.lastLook=performance.now(); }
});
function endPtr(e){ const p=ptrs.get(e.pointerId); if(!p) return; ptrs.delete(e.pointerId);
  if(e.pointerId===stickId){ stickId=null; inp.mx=inp.my=0; $('stick').hidden=true; }
  if(e.pointerId===lookId){ lookId=null; if(p.moved<8 && performance.now()-p.t<400) tapAt(e.clientX,e.clientY); }
  if(ptrs.size===0) pinch0=0; }
canvas.addEventListener('pointerup',endPtr); canvas.addEventListener('pointercancel',endPtr);
canvas.addEventListener('wheel',e=>{ e.preventDefault(); if(S.mode==='drone'||S.mode==='menu'||S.mode==='view'){ if(S.mode==='view'&&!VW.paused) viewPause(true); orbit.r=clamp(orbit.r*Math.exp(e.deltaY*0.0012),20,7000); orbit.auto=false; } else if(S.mode==='walk'){ camS.dist=clamp(camS.dist*Math.exp(e.deltaY*0.001),2.5,12); } },{passive:false});
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
$('bJump').addEventListener('pointerdown',e=>{ e.preventDefault(); if(S.mode==='drive'&&P.buggy&&P.buggy.type) inp.hb=true; else inp.jumpQ=true; });
['pointerup','pointercancel','pointerleave'].forEach(t=>$('bJump').addEventListener(t,()=>{ inp.hb=false; }));
$('bAct').addEventListener('click',()=>doAction());
$('bSprint').addEventListener('click',()=>{ P.sprintLock=!P.sprintLock; $('bSprint').classList.toggle('on',P.sprintLock); });
$('bView').addEventListener('click',()=>{ if(S.mode==='drive'&&P.buggy&&P.buggy.type) toggleCopilot(); else toggleView(); });
$('carYes').onclick=()=>toggleCopilot(true); $('carNo').onclick=()=>toggleCopilot(false);
$('btnHoles').onclick=()=>viewHole(W.COURSES[S.course].holes[0]);
$('bTour').addEventListener('click',()=>{ if(S.tour) stopTour(); else startTour(); });
$('bBig').addEventListener('pointerdown',e=>{ e.preventDefault(); ensureAudio(); if(S.mode==='plane') jumpFromPlane(); else if(S.mode==='fall') openGlider(); });
$('btnMap').onclick=showMap; $('btnMenu').onclick=()=>openModal('guia'); $('mini').onclick=showMap;
$('btnPlay').onclick=()=>{ S.name=$('pname').value.trim(); store.set('vg_name',S.name); mpHello(); startDrop(); };
$('btnHelp').onclick=()=>openModal('guia'); $('btnDrone').onclick=()=>goDrone();
$('dBack').onclick=()=>{ if(S.landedOnce){ setMode('walk'); } else goMenu(); };
function setQ(q){ store.set('vg_q',q); location.reload(); }
$('qAuto').onclick=()=>{ if(QUAL!=='auto') setQ('auto'); }; $('qMed').onclick=()=>{ if(QUAL!=='med') setQ('med'); }; $('qHigh').onclick=()=>{ if(QUAL!=='high') setQ('high'); };
$(QUAL==='auto'?'qAuto':QUAL==='high'?'qHigh':'qMed').classList.add('on');
document.querySelectorAll('#todRow button').forEach(b=>b.onclick=()=>setTOD(b.dataset.tod));
$('sndOn').onclick=()=>{ ensureAudio(); setSound(true); }; $('sndOff').onclick=()=>setSound(false);
const KEYDIR={KeyW:[0,1],ArrowUp:[0,1],KeyS:[0,-1],ArrowDown:[0,-1],KeyA:[-1,0],ArrowLeft:[-1,0],KeyD:[1,0],ArrowRight:[1,0]};
function keyMove(){ if(stickId!==null) return; let x=0,y=0; for(const k in KEYDIR) if(inp.keys[k]){ x+=KEYDIR[k][0]; y+=KEYDIR[k][1]; } const l=Math.hypot(x,y)||1; inp.mx=x/l*(x||y?1:0); inp.my=y/l*(x||y?1:0); }
addEventListener('keydown',e=>{ if(!$('avEd').hidden){ if(e.key==='Escape'){ $('avEd').hidden=true; S.overlay=false; } return; } if(!$('modal').hidden){ if(e.key==='Escape') closeModal(); return; } if(!$('mapOv').hidden){ if(e.key==='Escape'||e.key==='m'||e.key==='M') hideMap(); return; }
  if(e.target&&e.target.tagName==='INPUT') return;
  const m=S.mode;
  if(m==='aim'||m==='swing'){ if(e.code==='Space'){ e.preventDefault(); if(!e.repeat) swingDown(); }
    else if(e.key==='ArrowLeft'&&m==='aim'){ S.g.yaw-=CLUBS[S.g.club].putt?0.004:0.0087; placeAtAddress(); updateGolfHUD(); } else if(e.key==='ArrowRight'&&m==='aim'){ S.g.yaw+=CLUBS[S.g.club].putt?0.004:0.0087; placeAtAddress(); updateGolfHUD(); }
    else if(e.key==='ArrowUp') stepClub(-1); else if(e.key==='ArrowDown') stepClub(1); else if(e.key==='v'||e.key==='V') $('btnView').click(); else if(e.key==='Escape') exitAim(); return; }
  if(m==='view'){ if(e.key==='ArrowLeft') viewNav(-1); else if(e.key==='ArrowRight') viewNav(1); else if(e.code==='Space'){ e.preventDefault(); viewPause(!VW.paused); } else if(e.key==='Escape') exitView(); return; }
  if(m==='drive'&&e.code==='Space'&&P.buggy&&P.buggy.type){ e.preventDefault(); inp.hb=true; return; }
  inp.keys[e.code]=true; keyMove();
  if(e.code==='Space'){ e.preventDefault(); if(m==='plane') jumpFromPlane(); else if(m==='fall') openGlider(); else inp.jumpQ=true; }
  if(e.code==='KeyE') doAction(); if(e.code==='KeyM') showMap(); if(e.code==='KeyC'&&S.interior&&m==='walk') toggleView(); if(e.code==='KeyR'&&S.interior&&m==='walk'){ if(S.tour) stopTour(); else startTour(); } if(e.key==='Escape') openModal('guia'); });
addEventListener('keyup',e=>{ inp.keys[e.code]=false; keyMove(); if(e.code==='Space') inp.hb=false; if(e.code==='Space'&&(S.mode==='swing')) swingUp(); });
addEventListener('resize',()=>{ renderer.setSize(innerWidth,innerHeight,false); camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); });
canvas.addEventListener('contextmenu',e=>e.preventDefault());

/* ================= main loop ================= */
let last=performance.now(), T=0, hudT=0, lodT=0, todT=0; let NORENDER=/[?&]norender=1/.test(location.search);
// adaptive resolution: keep the frame rate up on slower devices (Auto quality only)
const AQ={acc:0,n:0,t:0,pr:renderer.getPixelRatio(),max:renderer.getPixelRatio()};
function adaptQuality(rawDt){ if(QUAL!=='auto'||document.hidden) return; AQ.acc+=rawDt; AQ.n++; AQ.t+=rawDt; if(AQ.t<2.5) return;
  const avg=AQ.acc/AQ.n; AQ.acc=0; AQ.n=0; AQ.t=0; let pr=AQ.pr;
  if(avg>0.03&&pr>0.7) pr=Math.max(0.7,pr-0.15); else if(avg<0.0145&&pr<AQ.max) pr=Math.min(AQ.max,pr+0.1);
  if(pr!==AQ.pr){ AQ.pr=pr; renderer.setPixelRatio(pr); renderer.setSize(innerWidth,innerHeight,false); } }
function frame(now){
  const raw=(now-last)/1000; const dt=Math.min(0.05,raw); last=now; step(dt); if(raw<0.5) adaptQuality(raw);
  if(!NORENDER){ ppRender(dt); interiorFrame(); }
  requestAnimationFrame(frame);
}
function step(dt){
  T+=dt;
  for(const wm of WATERMATS) wm.uniforms.uTime.value=T%10000; GLOBU.uTime.value=T%10000; sky.material.uniforms.uTime.value=T%100000;
  todT+=dt; if(todT>20){ todT=0; if(TOD.mode==='real') updateTOD(); }
  if(S.interior) interiorTick(dt);
  const m=S.mode, g=S.g;
  if(!S.overlay){
    if(m==='plane'){ S.plane.t+=dt; const d=S.plane.t*S.plane.speed; if(d>S.plane.len){ jumpFromPlane(); } }
    else if(m==='fall') updateFall(dt);
    else if(m==='glide') updateGlide(dt);
    else if(m==='walk'){ if(S.tour) tourStep(dt); else updateWalk(dt); }
    else if(m==='drive') updateDrive(dt);
    else if(m==='view') viewStep(dt);
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
    poseRig(R,st,(st==='run'||st==='swim')?P.animT:T,k); P.anim=st; P.animK=k;
    R.root.position.set(P.x,P.y,P.z); R.root.rotation.set(0,-P.yaw,0);
    if(m==='drive'&&P.buggy){ const sp=seatPos(P.buggy); R.root.position.set(sp[0],sp[1],sp[2]); }
  }
  if(g.ballVisible&&(['aim','swing','flight','wait','walk','drive'].includes(m))){ ballMesh.visible=true; ballMesh.position.set(g.ball.x,g.ball.y+0.2,g.ball.z); } else ballMesh.visible=false;
  ballBeam.visible=(m==='walk'||m==='drive')&&g.hole>=0&&g.ballVisible; if(ballBeam.visible) ballBeam.position.set(g.ball.x,g.ball.y+22.5,g.ball.z);
  teeBeam.visible=(m==='walk'||m==='drive')&&g.hole<0&&g.next>=0&&playedIn()>0; if(teeBeam.visible){ const H=W.HOLES[g.next]; teeBeam.position.set(H.tx,W.terrain(H.tx,H.tz)+22.5,H.tz); }
  markBeam.visible=!!S.marker&&m!=='menu'; if(markBeam.visible) markBeam.position.set(S.marker[0],Math.max(0,terrainAt(S.marker[0],S.marker[1]))+22.5,S.marker[1]);
  for(const o of GOLD){ if(o.taken) continue;
    if(rig&&rig.root.visible&&Math.abs(P.x-o.x)<2.2&&Math.abs(P.z-o.z)<2.2&&Math.abs(P.y+0.9-o.y)<2.4){ o.taken=true; S.gold.add(o.i); store.set('vg_gold4',JSON.stringify([...S.gold])); blip('gold');
      toast(S.gold.size===GOLD.length?'¡Las '+GOLD.length+' bolas doradas!':'¡Bola dorada!',S.gold.size+' de '+GOLD.length); mpGold(); } }
  updateGoldMeshes(T); animateFlags(T); mpFrame(dt); carFrame(T,dt);
  animateBoats(T,dt); updateAmbient(dt);
  animateBirds(T,dt);
  if(splashT>0){ splashT-=dt; const a=splashGeo.attributes.position.array; const y0=splash.userData.y0||0; for(let i=0;i<60;i++){ const v=splashV[i]; v[1]-=9.8*dt; a[i*3]+=v[0]*dt; a[i*3+1]=Math.max(y0,a[i*3+1]+v[1]*dt); a[i*3+2]+=v[2]*dt; } splashGeo.attributes.position.needsUpdate=true; splash.material.opacity=Math.max(0,splashT/1.3); }
  updateCamera(dt);
  { const hgt=camera.position.y-Math.max(terrainAt(camera.position.x,camera.position.z),0); const nn=S.interior?0.1:clamp(hgt*0.03,0.25,30), ff=S.interior?9000:60000; if(Math.abs(nn-camera.near)>camera.near*0.15||camera.far!==ff){ camera.near=nn; camera.far=ff; camera.updateProjectionMatrix(); } }
  sky.position.copy(camera.position);
  lodT+=dt; if(lodT>0.25){ lodT=0; updateTreeLOD(); } updateGrass(); tickCore(dt);
  const focus=(m==='menu'||m==='drone'||m==='view')?orbit.t:(m==='plane'?new V3(...planePos()):(['flight','wait'].includes(m)?g.ball:new V3(P.x,P.y,P.z)));
  sun.target.position.copy(focus); sun.position.set(focus.x+sunDir.x*500,focus.y+sunDir.y*500,focus.z+sunDir.z*500);
  const sc=(m==='menu'||m==='drone'||m==='view')?Math.min(600,Math.max(120,orbit.r*0.35)):(S.interior?16:(g.overview?220:(m==='glide'||m==='fall'||m==='plane'?160:90)));
  if(sun.shadow.camera.right!==sc){ Object.assign(sun.shadow.camera,{left:-sc,right:sc,top:sc,bottom:-sc}); sun.shadow.camera.updateProjectionMatrix(); }
  hudT+=dt; if(hudT>0.1){ hudT=0; if(m!=='menu'&&m!=='drone'&&m!=='view'){ statusText(); computeAction(); drawMini(); if(m==='plane'||m==='fall'||m==='glide'){ const gnd=Math.max(W.waterLevel(P.x,P.z),groundAt(P.x,P.z,9999)); $('altV').textContent=fmt(Math.max(0,(m==='plane'?planePos()[1]:P.y)-gnd)); } if(m==='flight') $('hcDist').innerHTML='<b>'+fmt(distToPin())+'</b> m a bandera'; } }
  updateTags(); updateLabels(); updateViewLabels();
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
    const FN=Object.assign({core:'ortho_core_4096.jpg',coreLow:'ortho_core_2048.jpg',wide:'ortho_wide_2048.jpg',mapPhoto:'ortho_map_1024.jpg',mapPlan:'map_surface_1024.png'},WP.files||{});
    const [tCore,tWide,imPhoto,imPlan]=await Promise.all([loadTex(HIGH?FN.core:FN.coreLow),loadTex(FN.wide),loadImg(FN.mapPhoto),loadImg(FN.mapPlan)]);
    surfTex=makeSurfTex();
    progress(0.58,WP.T.loadRelief); await nextFrame();
    buildCore(tCore); buildWide(tWide); progress(0.66,WP.T.loadRegion); await nextFrame();
    buildRegion(); buildWater(); buildPools(); buildGolf(); progress(0.74,WP.T.loadBuildings); await nextFrame();
    buildBuildings(); buildRuins(); buildMarina(); progress(0.84,'Plantando los árboles de la foto…'); await nextFrame();
    buildTrees(); buildGrass(tCore); buildLife(); setTOD(TOD.mode); setSound(SOUND); progress(0.92,'Aparcando buggies y escondiendo bolas doradas…'); await nextFrame();
    placeBuggies(); buildGold(); plane=makePlane(); avLoad(); S.av=store.get(WP.key+'_av')||null; if(S.av&&avById(S.av)) setSkin(S.skin,avById(S.av)); else setSkin(S.skin);
    if(!W.COURSES[S.course]) S.course=0; try{ S.g.scores=JSON.parse(store.get(WP.key+'_scores3')||'[]'); }catch(e){ S.g.scores=[]; } S.g.next=nextUnplayed(-1);
    progress(0.97,'Trazando el mapa…'); await nextFrame();
    buildMaps(imPhoto,imPlan); buildPOIs(); $('pname').value=S.name;
    const b=store.get(bestKey(W.COURSES[S.course])); $('bestTxt').textContent=b?' · Mejor vuelta: '+b+' golpes':''; renderCourseRow(); renderFriends(); avFromURL(); if(WP.introWire) WP.introWire();
    progress(1,'Listo'); await nextFrame();
    $('loading').hidden=true; goMenu(); requestAnimationFrame(frame); mpInit();
  }catch(err){ console.error(err); loadTxt.textContent='No se pudo cargar '+WP.T.place+': '+err.message; }
}
boot();
window.__vg={openAvEditor,setAvatar,AVS:()=>AVS,viewHole,VW,exitView,playFromView,enterCar,toggleCopilot,DR,VEH,S,P,W,CLUBS,newSim,simStep,startDrop,jumpFromPlane,openGlider,startHole,enterAim,doAction,inp,camS,camera,camLook,camT,get rig(){return rig;},get glider(){return glider;},tick(n,dt){ for(let i=0;i<n;i++) step(dt||1/30); },buggies,GOLD,hit,landNow,setMode,orbit,goDrone,BLD,PLAT,groundAt,bldAt,showMap,setLayer,openModal,renderer,scene,treeChunks,enterVilla,exitVilla,themeFor,THEMES,setTOD,TOD,villaNear,computeAction,get actKind(){return actKind;},MP,mpJoin,mpLeave,mpSay,mpCallPlane,mpGoTo,mpPlayHole,vcSetMic,mpState,setSkin,planePos,drawMini,drawBigMap,setRender(on){ NORENDER=!on; },exitBuggy,enterBuggy,saveScores,closeModal,FXQ,PPK,PP,ENV,GRASS,LIGHTK,sun,hemi,sky,envUpdate,interiorEnv,interiorFrame,ppRender,toggleView,setFP,BLDMESH,intLights,winLights,fireLight,updateTOD,goInside,snapExpo(){ ppSnapExposure(); },startTour,stopTour};
})();
