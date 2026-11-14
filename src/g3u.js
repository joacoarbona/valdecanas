/* ================= start screen by modes, the «Jugar al golf» sheet and the gamepad ================= */

/* ---- the five ways in: golf, a real round, explore, friends, challenges ---- */
const PLAYF={fmt:store.get(WP.key+'_pfmt')||'libre'};
const PFMT_TXT={libre:'Vuelta libre: juegas tú solo, golpe a golpe, y la tarjeta suma tus golpes contra el par. Sin rivales.',
  stableford:'Stableford, contra tus amigos de la sala o contra rivales de la máquina: puntos por hoyo según tu resultado neto (golpes menos los que te da el hándicap). Gana quien más puntos suma.',
  medal:'Medal neto, contra la sala o contra la máquina: se suman los golpes de la vuelta y se resta el hándicap. Gana quien menos tiene.',
  match:'Match play: hoyo a hoyo, gana el hoyo quien hace menos golpes netos. Contra un rival de la máquina, o con la sala (con tres o más, todos contra todos).'};
function playHTML(){ const C=courseOf(); const nx=(S.g.next>=0&&C.holes.includes(S.g.next))?S.g.next:C.holes[0]; const mid=C.holes.some(i=>S.g.scores[i]); const f=PFMT_TXT[PLAYF.fmt]?PLAYF.fmt:'libre';
  const fm=[['libre','Vuelta libre']].concat(Object.keys(BFMT).map(k=>[k,BFMT[k]]));
  return '<p>Directo al tee, sin avioneta. Elige'+(W.MULTI?' recorrido,':'')+' barras y formato y empieza.</p>'+
    (W.MULTI?'<div class="lbl">Recorrido</div>'+courseChips():'')+teeChips()+
    '<div class="lbl">Formato</div><div class="row" style="margin:4px 0 8px;flex-wrap:wrap;gap:6px">'+fm.map(([k,n])=>'<button class="btn small'+(f===k?' primary':'')+'" data-pf="'+k+'">'+n+'</button>').join('')+'</div>'+
    '<p class="note" style="margin:0 0 12px">'+PFMT_TXT[f]+'</p>'+
    (f==='libre'?'<div class="row" style="flex-wrap:wrap;gap:8px"><button class="btn primary" id="pgGo">Al tee del hoyo '+W.HOLES[nx].n+(W.MULTI?' · '+C.short:'')+'</button>'+(mid?'<button class="btn small" id="pgNew">Tarjeta nueva desde el hoyo '+W.HOLES[C.holes[0]].n+'</button>':'')+'</div>'+
      (mid?'<p class="note">Tienes una tarjeta a medias en '+C.name+': sigues por el primer hoyo sin jugar.</p>':'')
     :(MP.code&&MP.peers.size?'<div class="row" style="flex-wrap:wrap;gap:8px"><button class="btn primary" id="pgRoom">Con la sala: invitar y salir al tee '+W.HOLES[C.holes[0]].n+'</button><button class="btn small" id="pgRivals">Contra la máquina</button></div><p class="note">«Con la sala» invita a '+[...MP.peers.values()].map(p=>esc(p.n||'…')).join(', ')+': cada uno pone su hándicap, salís todos del tee '+W.HOLES[C.holes[0]].n+' y la clasificación va en vivo en pantalla. Juegas con hándicap '+RM.hc+' (se cambia en la pestaña Partida).</p>'
       :'<div class="row"><button class="btn primary" id="pgRivals">Elegir rivales y empezar</button></div><p class="note">Siguiente paso: marcas hasta tres rivales'+(WP.avatars?' (tus avatares de amigos)':'')+' y el hándicap de cada uno.'+(MP.code?'':' Para jugar contra tus amigos de verdad, crea una sala (Con amigos) y elige aquí «Con la sala».')+'</p>'))+
    (RM.on?'<p class="note" style="margin-top:10px">Estás en una partida '+RMF[RM.fmt]+' con la sala. <button class="btn small" id="pgRmTab">Ver la clasificación</button></p>':''); }
function playWire(){ const b=$('sheetBody');
  b.querySelectorAll('[data-pf]').forEach(x=>x.onclick=()=>{ PLAYF.fmt=x.dataset.pf; store.set(WP.key+'_pfmt',PLAYF.fmt); openModal('jugar'); });
  const go=$('pgGo'); if(go) go.onclick=()=>playTee(false);
  const nw=$('pgNew'); if(nw) nw.onclick=()=>playTee(true);
  const rv=$('pgRivals'); if(rv) rv.onclick=()=>{ BOT.fmt=PLAYF.fmt; botSave(); openModal('partida'); };
  const rr=$('pgRoom'); if(rr) rr.onclick=()=>rmStart(PLAYF.fmt);
  const rt=$('pgRmTab'); if(rt) rt.onclick=()=>openModal('partida'); }
// straight onto the tee of the next hole to play (or the first one, with a fresh card)
function playTee(fresh){ const C=courseOf(); if(fresh) clearCard(); const nx=(!fresh&&S.g.next>=0&&C.holes.includes(S.g.next))?S.g.next:C.holes[0];
  closeModal(); hideMap(); ensureAudio();
  if(S.mode==='menu'){ VW.i=nx; VW.ret={mode:'menu'}; playFromView(); }
  else fadeTo(()=>{ if(S.interior) exitVilla(); if(P.buggy) exitBuggy(); if(P.horse) dismountHorse(); if(P.jet) dismountJet(); mpEnterWorld(); startHole(nx); });
  setTimeout(()=>toast('Tee del hoyo '+W.HOLES[nx].n,(W.MULTI?C.name+' · ':'')+'par '+W.HOLES[nx].par),700); }
function saveName(){ S.name=$('pname').value.trim(); store.set('vg_name',S.name); mpHello(); }
$('mGolf').onclick=()=>{ saveName(); openModal('jugar',{title:'Jugar al golf'}); };
$('mReal').onclick=()=>{ saveName(); openModal('rondas',{title:'Partida real'}); };
$('mFriends').onclick=()=>{ saveName(); ensureAudio(); openModal('amigos',{title:'Con amigos'}); };
$('mRetos').onclick=()=>openModal('retos',{title:'Retos'});

/* ---- gamepad: the standard mapping, polled every frame ---- */
const GP={dead:0.15,known:new Set(),prev:[],idx:-1,moving:false,look:false,sh:false,hb:false,rt:false,sel:0,navT:0,navD:'',last:0};
const GPB={A:0,B:1,X:2,Y:3,LB:4,RB:5,LT:6,RT:7,BACK:8,START:9,LS:10,RS:11,UP:12,DOWN:13,LEFT:14,RIGHT:15};
function gpAxis(v){ v=+v||0; const a=Math.abs(v); return a<GP.dead?0:Math.sign(v)*(a-GP.dead)/(1-GP.dead); }
function gpVal(pad,i){ const b=pad.buttons[i]; return b?(typeof b==='object'?(b.value||(b.pressed?1:0)):+b):0; }
function gpKey(code,key,up){ dispatchEvent(new KeyboardEvent(up?'keyup':'keydown',{code,key:key||code,bubbles:true,cancelable:true})); }
function gpPads(){ try{ return navigator.getGamepads?Array.from(navigator.getGamepads()||[]).filter(p=>p&&p.connected!==false):[]; }catch(e){ return []; } }
addEventListener('gamepadconnected',()=>gpPoll(0));
addEventListener('gamepaddisconnected',e=>{ if(e.gamepad&&GP.known.has(e.gamepad.id)){ GP.known.delete(e.gamepad.id); toast('Mando desconectado','Puedes seguir con la pantalla o el teclado'); } });
function gpName(id){ const s=String(id||'').toLowerCase(); return s.includes('luna')?'Luna':(s.includes('xbox')||s.includes('xinput'))?'Xbox':(s.includes('dualsense')||s.includes('dualshock')||s.includes('playstation')||s.includes('054c'))?'PlayStation':'mando'; }
function gpPoll(dt){
  const pads=gpPads(); if(!pads.length){ if(GP.moving){ GP.moving=false; keyMove(); } if(GPN.bar) gpBarSet(null); return; }
  // the pad that was used last wins when there are several
  let pad=pads.find(p=>p.index===GP.idx)||pads[0];
  for(const p of pads){ if(!GP.known.has(p.id)){ GP.known.add(p.id); GPN.pad=performance.now(); const k=gpKind(p.id); toast('Mando conectado',(gpName(p.id)==='mando'?'':gpName(p.id)+' · ')+gpSym('START',k)+' abre el menú · '+gpSym('BACK',k)+' desatasca · la guía explica cada botón'); }
    if(p!==pad&&p.buttons.some(b=>b&&(b.pressed||b.value>0.5))) pad=p; }
  if(pad.index!==GP.idx){ GP.idx=pad.index; GP.prev=[]; } GPN.kind=gpKind(pad.id);
  const N=Math.max(16,pad.buttons.length), cur=[]; for(let i=0;i<N;i++) cur.push(gpVal(pad,i));
  const down=i=>cur[i]>0.5&&!(GP.prev[i]>0.5), up=i=>!(cur[i]>0.5)&&GP.prev[i]>0.5, held=i=>cur[i]>0.5;
  const ax=pad.axes||[]; const lx=gpAxis(ax[0]), ly=gpAxis(ax[1]), rx=gpAxis(ax[2]), ry=gpAxis(ax[3]);
  if(lx||ly||rx||ry||cur.some((v,i)=>v>0.5&&!(GP.prev[i]>0.5))) GPN.pad=performance.now();
  try{ gpApply({cur,down,up,held,lx,ly,rx,ry,dt:dt||1/60}); } finally { GP.prev=cur; }
}
// moving the focus with the d-pad or the stick (only the d-pad when a notice is answered on the move), with key-repeat
function gpNavDir(g,padOnly){ const st=!padOnly; const d=g.held(GPB.UP)||(st&&g.ly<-0.6)?'u':g.held(GPB.DOWN)||(st&&g.ly>0.6)?'d':g.held(GPB.LEFT)||(st&&g.lx<-0.6)?'l':g.held(GPB.RIGHT)||(st&&g.lx>0.6)?'r':'';
  const now=performance.now(); if(!d){ GP.navD=''; return ''; } if(d!==GP.navD){ GP.navD=d; GP.navT=now+380; return d; } if(now>=GP.navT){ GP.navT=now+150; return d; } return ''; }
function gpApply(g){
  const m=S.mode, L=['walk','drive','fall','glide','plane','wait','ride','jet','ski','bike'];
  // windows first (g3gp.js): the start screen, the menu, the sheets and the notices take the d-pad, ✕, ○, L1/R1 and Options
  const ui=gpUI(g);
  if(ui==='heavy'){ if(GP.moving){ GP.moving=false; keyMove(); } return; }
  if(ui==='light'){ const g0=g, mk=[GPB.A,GPB.B,GPB.UP,GPB.DOWN,GPB.LEFT,GPB.RIGHT]; g=Object.assign({},g0,{down:i=>!mk.includes(i)&&g0.down(i),up:i=>!mk.includes(i)&&g0.up(i),held:i=>!mk.includes(i)&&g0.held(i)}); }
  if(m==='menu'){ if(g.down(GPB.START)) openModal('guia'); return; }
  if(g.down(GPB.START)){ openModal('guia'); return; }
  // Create (PlayStation) or View (Xbox): get unstuck
  if(g.down(GPB.BACK)&&L.includes(m)){ dsUnstick(false); return; }
  // left stick: walk, drive, sail, ride (in the same sense as the on-screen joystick: up is forward)
  if(L.includes(m)||m==='racket'){ if(g.lx||g.ly){ inp.mx=clamp(g.lx,-1,1); inp.my=clamp(-g.ly,-1,1); GP.moving=true; } else if(GP.moving){ GP.moving=false; keyMove(); } }
  else if(GP.moving){ GP.moving=false; keyMove(); }
  // right stick: the camera (orbit in the drone, view and photo modes)
  if(g.rx||g.ry){ if(m==='drone'||m==='view'||m==='photo'){ orbit.auto=false; orbit.th+=g.rx*g.dt*1.4; orbit.ph=clamp(orbit.ph-g.ry*g.dt*0.9,0.12,m==='photo'?1.72:1.48); }
    else if(L.includes(m)){ camS.yaw+=g.rx*g.dt*2.6; const fp=camS.fp&&S.interior; camS.pitch=clamp(camS.pitch+g.ry*g.dt*1.6,fp?-1.05:-0.35,fp?1.15:1.25); camS.lastLook=performance.now(); } }
  // left trigger: sprint while held
  const sh=g.held(GPB.LT); if(sh!==GP.sh){ GP.sh=sh; inp.keys.ShiftLeft=sh; }
  // golf: the stick and the d-pad aim, the bumpers change club, up and down on the d-pad the kind of shot, the right trigger swings
  if(m==='aim'||m==='swing'){
    if(m==='aim'&&g.lx){ const pt=CLUBS[S.g.club].putt; S.g.yaw+=g.lx*g.dt*(pt?0.22:0.5); placeAtAddress(); updateGolfHUD(); }
    if(g.down(GPB.LEFT)) gpKey('ArrowLeft'); if(g.down(GPB.RIGHT)) gpKey('ArrowRight');
    if(g.down(GPB.LB)&&m==='aim') stepClub(-1); if(g.down(GPB.RB)&&m==='aim') stepClub(1);
    if((g.down(GPB.UP)||g.down(GPB.DOWN))&&m==='aim') cycleShot();
    if(g.down(GPB.RT)) swingDown(); if(g.up(GPB.RT)) swingUp();
    if(g.down(GPB.Y)) $('btnView').click(); if(g.down(GPB.B)) exitAim(); return; }
  if(m==='racket'){ if(g.down(GPB.RT)||g.down(GPB.A)) rkPress(); if(g.up(GPB.RT)||g.up(GPB.A)) rkRelease(); if(g.down(GPB.B)) exitRacket(); return; }
  if(m==='fish'){ if(g.down(GPB.A)||g.down(GPB.RT)||g.down(GPB.X)) fishPress(); if(g.down(GPB.B)) exitFish(); return; }
  if(m==='photo'){ if(g.down(GPB.A)||g.down(GPB.RT)) takePhoto(); if(g.down(GPB.B)) exitPhoto(); return; }
  if(m==='replay'){ if(g.down(GPB.A)||g.down(GPB.B)) exitReplay(); return; }
  if(m==='view'&&g.down(GPB.X)){ const vp=$('vPlay'); if(vp&&!vp.hidden) vp.click(); return; }
  if(m==='view'||m==='rround'){ if(g.down(GPB.LEFT)||g.down(GPB.LB)) gpKey('ArrowLeft'); if(g.down(GPB.RIGHT)||g.down(GPB.RB)) gpKey('ArrowRight'); if(g.down(GPB.A)) gpKey('Space',' '); if(g.down(GPB.B)) gpKey('Escape'); return; }
  if(m==='drone'){ if(g.down(GPB.B)||g.down(GPB.A)) gpKey('Escape'); if(g.down(GPB.Y)) showMap(); return; }
  // A: jump, jump out of the plane, open the glider; in a car, the handbrake while held
  const car=m==='drive'&&P.buggy&&P.buggy.type; if(car){ const hb=g.held(GPB.A); if(hb!==GP.hb){ GP.hb=hb; inp.hb=hb; } } else if(GP.hb){ GP.hb=false; inp.hb=false; }
  if(g.down(GPB.A)&&!car){ ensureAudio(); if(m==='plane') jumpFromPlane(); else if(m==='fall') openGlider(); else inp.jumpQ=true; }
  if(g.down(GPB.X)){ ensureAudio(); doAction(); }
  if(g.down(GPB.Y)) showMap();
  if(g.down(GPB.B)&&S.interior&&m==='walk') doAction();
  if(g.down(GPB.RT)&&m==='walk'){ const b=$('bAct'); if(b&&!b.hidden&&/Jugar|tee/i.test(b.textContent)) doAction(); }
}
function gpLegendHTML(){ const r=(k,a,ps,xb)=>'<tr><td>'+(ps||gpChip(k,'ps'))+'</td><td>'+(xb||gpChip(k,'xbox'))+'</td><td>'+a+'</td></tr>', t=s=>'<span class="kbd">'+s+'</span>';
  return '<table class="gpleg"><thead><tr><th>PlayStation</th><th>Xbox y Luna</th><th>Qué hace en el juego</th></tr></thead><tbody>'+
    r('','Andar, conducir, llevar el barco, la tabla o el caballo; al golpear, afinar la dirección',t('Stick izq.'),t('Stick izq.'))+
    r('','Mover la cámara (en la vista dron, girar alrededor)',t('Stick der.'),t('Stick der.'))+
    r('A','Saltar, saltar de la avioneta y abrir el planeador; en coche, freno de mano')+
    r('X','Acción: el botón grande de la pantalla (jugar hoyo, subir al buggy, montar, entrar en una casa); en Ver hoyos, jugar ese hoyo')+
    r('B','Atrás: salir del golpe, la foto o la vista dron')+
    r('Y','Mapa (al golpear, cambia la vista)')+
    r('RT','Golpe de golf: mantén para cargar la potencia y suelta para golpear; en pádel y tenis, golpear; junto a un tee, jugar el hoyo')+
    r('LT','Esprintar mientras lo aprietas')+
    r('LB','Palo anterior y siguiente; en Ver hoyos y en la vuelta real, hoyo anterior y siguiente',gpChip('LB','ps')+' '+gpChip('RB','ps'),gpChip('LB','xbox')+' '+gpChip('RB','xbox'))+
    r('','Arriba o abajo: tipo de golpe; izquierda o derecha: afinar la dirección',t('Cruceta'),t('Cruceta'))+
    r('BACK','<b>Desatascar</b>: saca el coche, el kart, el caballo o la bici (o a ti) al sitio libre más cercano, mirando hacia fuera')+
    r('START','Abrir el menú')+
    '</tbody></table>'+
    '<table class="gpleg"><thead><tr><th>PlayStation</th><th>Xbox y Luna</th><th>Qué hace en los menús</th></tr></thead><tbody>'+
    r('','Mover el foco (el recuadro naranja) de botón en botón',t('Cruceta')+' '+t('Stick izq.'),t('Cruceta')+' '+t('Stick izq.'))+
    r('A','Elegir el botón del foco; en un recuadro de texto, escribir con el teclado')+
    r('B','Volver o cerrar: el menú, una hoja (karts, bicis, circuitos, barra del hotel), el mapa o un aviso («Ahora no»)')+
    r('LB','Pestaña anterior y siguiente del menú',gpChip('LB','ps')+' '+gpChip('RB','ps'),gpChip('LB','xbox')+' '+gpChip('RB','xbox'))+
    r('','Subir y bajar el texto (la guía, el glosario, las tablas)',t('Stick der.'),t('Stick der.'))+
    r('','En un número (hándicap) o el volumen: izquierda y derecha lo cambian',t('◀ ▶'),t('◀ ▶'))+
    r('START','Abrir y cerrar el menú; en el inicio, la guía')+
    '</tbody></table><p class="note">Cada stick tiene una zona muerta del 15 %: un toque muy leve no mueve nada. Con el mando conectado sale abajo una <b>barra de ayuda</b> con los botones que valen en esa pantalla y los símbolos de tu mando; desaparece al tocar la pantalla o usar el ratón y vuelve al pulsar el mando. Los avisos (una invitación, la pregunta del copiloto) se contestan con la cruceta, '+gpChip('A','ps')+'/'+gpChip('A','xbox')+' y '+gpChip('B','ps')+'/'+gpChip('B','xbox')+' sin dejar de moverte con el stick.</p>'; }
