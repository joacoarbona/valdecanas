/* ===== g3dr.js: S4 · el dron (Casterton): se pilota con la vista de su cámara (FPV) mientras tú te quedas en tierra con el mando;
   alcance de 450 m, 120 m de altura como mucho y batería; carreras de dron entre puertas alrededor de sus helipuertos ===== */
var DRN={c:null,run:null,res:null,best:null,prev:null,osd:'',rec:0,tw:0,ta:0};
const DR_RANGE=450, DR_ALT=120, DR_BAT=480, DR_LAPS=2;   // metres from you, metres above the ground (the legal limit), seconds of battery, laps
TRO.push({id:'dron',n:'Piloto de dron',how:'Gana la medalla de oro en una carrera de dron.',m:'g',c:40,w:'campo'});
function drLoad(){ if(DRN.best) return; try{ DRN.best=JSON.parse(store.get('vg_dr')||'{}')||{}; }catch(e){ DRN.best={}; } }
function drIs(){ return S.mode==='fly'&&!!P.fly&&P.fly.type==='drone'; }

/* ---- piloting: you stay where you took off; the camera is the drone's ---- */
function drEnter(A){ drLoad(); A.pilot={x:P.x,y:P.y,z:P.z,yaw:P.yaw}; if(A.bat===undefined) A.bat=100; FL.fp=true; DRN.rec=0; DRN.prev=null; flBtns();
  tip('Dron: ves lo que ve su cámara. Mantén Subir para despegar; joystick adelante avanza y a los lados gira. Llega a 450 m de ti y a 120 m de altura. Cámara: verlo desde fuera. Acción: aterrizar',7000); }
function drRider(R,A){ const p=A.pilot; if(!p) return; poseRig(R,'idle',0,0); R.root.rotation.order='XYZ'; R.root.position.set(p.x,p.y,p.z); R.root.rotation.set(0,-Math.atan2(A.z-p.z,A.x-p.x),0); P.anim='idle'; P.animK=0; }
function drStep(A,dt){ const p=A.pilot; if(!p) return; const now=performance.now(); let dx=A.x-p.x, dz=A.z-p.z; const d=Math.hypot(dx,dz);
  if(d>DR_RANGE){ A.x=p.x+dx/d*DR_RANGE; A.z=p.z+dz/d*DR_RANGE; A.vf*=0.6; if(now-DRN.tw>3000){ DRN.tw=now; tip('Señal débil: el dron no se aleja más de '+DR_RANGE+' m de ti',2400); } }
  const g=W.terrain(A.x,A.z); if(A.y-g>DR_ALT){ A.y=g+DR_ALT; if(A.vy>0) A.vy=0; if(now-DRN.ta>3000){ DRN.ta=now; tip('Altura máxima: '+DR_ALT+' m sobre el suelo, el límite de los drones',2400); } }
  if(!A.gnd){ A.bat=Math.max(0,A.bat-dt*100/DR_BAT); if(A.bat<=15&&!A.lowW){ A.lowW=1; tip('Batería baja: aterriza pronto',2600); } if(A.bat<=0&&!A.empty){ A.empty=1; tip('Sin batería: el dron aterriza solo',2800); } }
  else { A.bat=Math.min(100,A.bat+dt*100/25); if(A.bat>20){ A.lowW=0; A.empty=0; } }
  if(A.bat<=0&&!A.gnd) A.auto=true;
  flPlace(A); DRN.rec+=dt; drRace(A,dt); }
// out of the drone: you are where you were, and it comes back and lands beside you
function drLeave(A){ const p=A.pilot; A.pilot=null; if(DRN.run) drRaceEnd(null,'Has dejado el dron: carrera anulada');
  const yw=p.yaw||0; let x=p.x+Math.cos(yw)*1.6, z=p.z+Math.sin(yw)*1.6; if(bldAt(x,z,0.4)){ x=p.x-Math.cos(yw)*1.6; z=p.z-Math.sin(yw)*1.6; }
  A.x=x; A.z=z; A.y=groundAt(x,z,p.y+1); A.gnd=true; A.vf=A.vy=0; A.auto=false; A.bank=A.pitch=0; flPlace(A);
  if(S.mode==='fly'){ P.x=p.x; P.z=p.z; P.y=groundAt(p.x,p.z,p.y+1); P.vx=P.vy=P.vz=0; P.yaw=yw; camS.yaw=yw; S.snap=true; setMode('walk'); tip('El dron vuelve y aterriza a tu lado',2000); }
  flPark(A); flBtns(); drOsd(); }
function drStatus(A){ const p=A.pilot, d=p?Math.hypot(A.x-p.x,A.z-p.z):0, alt=A.y-W.terrain(A.x,A.z);
  return ['Dron',A.gnd?'En tierra · Subir: despegar · Acción: salir':Math.round(alt)+' m de altura · '+fmt(Math.abs(A.vf)*3.6)+' km/h · a '+Math.round(d)+' m de ti · batería '+Math.round(A.bat)+' %'+(A.auto?' · aterrizando solo':'')]; }

/* ---- race courses: ten gates around each helipad with a drone, under and over the trees, two laps ---- */
function drCourses(){ if(DRN.c) return DRN.c; DRN.c=[]; for(const p of (FL.pads||[])){ if(!p.a||p.a.type!=='drone') continue; try{ const C=drMake(p,DRN.c.length); if(C) DRN.c.push(C); }catch(e){ console.warn('dron',e); } } return DRN.c; }
function drMake(p,ci){ const N=10, pts=[], ph=ci*1.7+0.6;
  for(let i=0;i<N;i++){ const th=i/N*Math.PI*2; let r=58+24*Math.sin(2*th+ph), x=0, z=0, ok=false;
    for(let k=0;k<12&&!ok;k++){ x=p.x+Math.cos(th)*r; z=p.z+Math.sin(th)*r; const g=W.terrain(x,z); ok=!bldAt(x,z,7)&&W.waterLevel(x,z)<g-0.3&&(!W.poolAt||!W.poolAt(x,z)); if(!ok) r+=9; }
    const g=W.terrain(x,z); let h=g+3.6+(i%3)*2.4;
    const cx=Math.floor(x/20), cz=Math.floor(z/20); for(let a=-1;a<=1;a++) for(let b=-1;b<=1;b++){ const tr=treeGrid.get((cx+a)+','+(cz+b)); if(tr) for(const t of tr) if(Math.hypot(t.x-x,t.z-z)<t.tr+2.6&&t.cy>h-2.6) h=t.cy+3; }
    for(const B of bldsNear(x,z)) if(B.solid&&nearestEdge(B,x,z)[0]<12&&B.top>h-3) h=B.top+4;
    pts.push([x,h,z]); }
  const g=[]; for(let i=0;i<N;i++){ const a=pts[(i+N-1)%N], b=pts[(i+1)%N], q=pts[i]; g.push({i,x:q[0],y:q[1],z:q[2],yaw:Math.atan2(b[2]-a[2],b[0]-a[0])}); }
  let L=0; for(let i=0;i<N;i++){ const a=pts[i], b=pts[(i+1)%N]; L+=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]); }
  const C={id:'dr'+ci,n:'Carrera de dron · '+p.n,pad:p,g,L,LT:L*DR_LAPS}; C.med=[C.LT/13,C.LT/10,C.LT/7.5]; drMeshes(C); return C; }
const DR_MAT={};
function drMat(k){ if(!DR_MAT[k]){ const c={next:'#2fbf5a',then:'#f2c230',rest:'#f07f1e',done:'#c9ced6'}[k]; DR_MAT[k]=new THREE.MeshLambertMaterial({color:Cc(c),emissive:Cc(c),emissiveIntensity:k==='done'?0.05:0.55}); } return DR_MAT[k]; }
function drMeshes(C){ const grp=new THREE.Group(); grp.name='dron '+C.n; grp.visible=false; scene.add(grp); C.grp=grp; const S2=4.4, T=0.22;
  for(const G of C.g){ const o=new THREE.Group(); o.position.set(G.x,G.y,G.z); o.rotation.y=-G.yaw+Math.PI/2; const bars=[];
    for(const [w,h,x,y] of [[S2,T,0,S2/2-T/2],[S2,T,0,-S2/2+T/2],[T,S2,-S2/2+T/2,0],[T,S2,S2/2-T/2,0]]){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,T),drMat('rest')); m.position.set(x,y,0); o.add(m); bars.push(m); }
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,Math.max(0.1,G.y-S2/2-W.terrain(G.x,G.z))),new THREE.MeshLambertMaterial({color:Cc('#5b6168')})); pole.position.y=-S2/2-(G.y-S2/2-W.terrain(G.x,G.z))/2; o.add(pole);
    const nb=new THREE.Mesh(new THREE.PlaneGeometry(0.9,0.9),new THREE.MeshBasicMaterial({map:canvasTex(64,64,(g2,w,h)=>{ g2.fillStyle='#ffffff'; g2.fillRect(0,0,w,h); g2.fillStyle='#1d2a3a'; g2.font='bold 44px sans-serif'; g2.textAlign='center'; g2.textBaseline='middle'; g2.fillText(String(G.i+1),w/2,h/2+2); }),side:THREE.DoubleSide})); nb.position.y=S2/2+0.6; o.add(nb);
    G.bars=bars; grp.add(o); }
  drPaint(C); }
function drPaint(C){ const R=DRN.run&&DRN.run.C===C?DRN.run:null, n=C.g.length; const nx=R?R.k%n:0;
  for(const G of C.g){ const k=!R?(G.i===0?'next':G.i===1?'then':'rest'):G.i===nx?'next':G.i===(nx+1)%n?'then':'rest'; if(G.k===k) continue; G.k=k; for(const m of G.bars) m.material=drMat(k); } }
// the gate's plane crossed forwards, inside its square (4 m)
function drCross(G,p0,p1){ const c=Math.cos(G.yaw), s=Math.sin(G.yaw), s0=(p0[0]-G.x)*c+(p0[2]-G.z)*s, s1=(p1[0]-G.x)*c+(p1[2]-G.z)*s; if(!(s0<0&&s1>=0)) return false;
  const t=s0/(s0-s1), qx=p0[0]+(p1[0]-p0[0])*t, qy=p0[1]+(p1[1]-p0[1])*t, qz=p0[2]+(p1[2]-p0[2])*t; return Math.abs(-(qx-G.x)*s+(qz-G.z)*c)<2.0&&Math.abs(qy-G.y)<2.0; }
function drNear(A){ let best=null, bd=1e9; for(const C of drCourses()){ const d=Math.hypot(A.x-C.pad.x,A.z-C.pad.z); if(d<bd){ bd=d; best=C; } } return bd<DR_RANGE+200?best:null; }
function drRace(A,dt){ const p1=[A.x,A.y+0.15,A.z], p0=DRN.prev||p1; DRN.prev=p1; const R=DRN.run;
  if(R){ R.t+=dt; const C=R.C, n=C.g.length, G=C.g[R.k%n]; if(drCross(G,p0,p1)){ R.k++; blip('hit'); if(R.k>DR_LAPS*n){ drRaceEnd(true); return; } if((R.k-1)%n===0) toast('Vuelta '+(Math.floor((R.k-1)/n)+1)+' de '+DR_LAPS,kartFmt(R.t*1000)); drPaint(C); }
    if(R.t>300) drRaceEnd(null,'Más de 5 minutos: carrera anulada'); return; }
  const C=drNear(A); if(C&&drCross(C.g[0],p0,p1)){ DRN.run={C,k:1,t:0}; DRN.res=null; drPaint(C); hrSnd&&hrSnd('bell',0); toast('¡Salida!',C.n+' · '+DR_LAPS+' vueltas a '+C.g.length+' puertas'); } }
function drRaceEnd(ok,why){ const R=DRN.run; if(!R) return; DRN.run=null; const C=R.C; for(const G of C.g) G.k=null; drPaint(C); if(!ok){ if(why) toast(why,''); return; }
  drLoad(); const T=R.t, M=C.med, med=T<=M[0]?'oro':T<=M[1]?'plata':T<=M[2]?'bronce':'', old=DRN.best[C.id], rec=!old||T<old; if(rec){ DRN.best[C.id]=Math.round(T*100)/100; store.set('vg_dr',JSON.stringify(DRN.best)); }
  DRN.res={C,T,med,rec}; prgEarn(5+(med==='oro'?10:med==='plata'?6:med==='bronce'?3:0)+(rec?5:0),C.n); if(med==='oro') prgTrophy('dron');
  toast('¡Carrera terminada!',kartFmt(T*1000)+(med?' · medalla de '+medName(med):'')+(rec?' · récord':'')); }

/* ---- the camera's on-screen display, the gates shown while you fly a drone ---- */
function drOsd(){ const el=$('drOsd'); if(!el) return; const on=drIs()&&FL.fp; if(!on){ if(!el.hidden){ el.hidden=true; DRN.osd=''; } return; } const A=P.fly, p=A.pilot||A;
  const alt=Math.max(0,A.y-W.terrain(A.x,A.z)), d=Math.hypot(A.x-p.x,A.z-p.z), R=DRN.run, n=R?R.C.g.length:0, rs=Math.floor(DRN.rec), bat=Math.round(A.bat);
  const h='<div class="tl"><b class="rec">●</b> REC '+Math.floor(rs/60)+':'+String(rs%60).padStart(2,'0')+'</div><div class="tr'+(bat<=15?' low':'')+'">Batería '+bat+' %</div><div class="cx">＋</div>'+
    (R?'<div class="rc">Puerta '+((R.k%n)+1)+' de '+n+' · vuelta '+Math.min(DR_LAPS,Math.floor((R.k-1)/n)+1)+' de '+DR_LAPS+' · '+kartFmt(R.t*1000)+'<i id="drArrow">➤</i></div>':'')+
    '<div class="bt">ALT '+Math.round(alt)+' m · '+fmt(Math.abs(A.vf)*3.6)+' km/h · a '+Math.round(d)+' m de ti</div>';
  if(h!==DRN.osd){ DRN.osd=h; el.innerHTML=h; } el.hidden=false;
  if(R){ const G=R.C.g[R.k%n], ar=$('drArrow'); if(ar){ const a=Math.atan2(G.z-A.z,G.x-A.x)-camS.yaw; ar.style.transform='rotate('+(a*180/Math.PI-90)+'deg)'; } } }
function drTick(dt){ if(!FL.list||!FL.list.some(A=>A.type==='drone')) return; const on=drIs(); if(on||DRN.c) for(const C of drCourses()) C.grp.visible=on; drOsd(); }

/* ---- the sheet, the map and the texts ---- */
function drSheetHTML(){ const D=FL.list.filter(A=>A.type==='drone'); if(!D.length) return ''; drLoad(); const CC=drCourses();
  let h='<h3>Dron y carreras de dron</h3><p>El <b>dron</b> se pilota desde el suelo: tú te quedas donde despega, con el mando, y ves lo que ve su <b>cámara</b> (el botón Cámara cambia a verlo desde fuera). Llega a '+DR_RANGE+' m de ti y a '+DR_ALT+' m sobre el suelo, y la batería dura unos '+Math.round(DR_BAT/60)+' minutos de vuelo (en tierra se recarga). Al salir, vuelve y aterriza a tu lado.</p>';
  h+='<p><b>Carreras</b>: diez puertas de colores alrededor de su helipuerto, que solo se ven pilotando el dron. La <b style="color:#1f9d4c">verde</b> es la siguiente y la <b style="color:#b8860b">amarilla</b>, la de después. El reloj empieza al cruzar la 1 y para al volver a ella tras '+DR_LAPS+' vueltas. La flecha de la cámara apunta a la siguiente.</p><div class="tablewrap"><table class="card"><thead><tr><th>Carrera</th><th>Largo</th><th>Récord</th><th></th></tr></thead><tbody>'+
    CC.map((C,i)=>'<tr><td>'+esc(C.n)+'</td><td>'+Math.round(C.LT)+' m</td><td>'+(DRN.best[C.id]?kartFmt(DRN.best[C.id]*1000):'—')+'<br><small>oro '+kartFmt(C.med[0]*1000)+'</small></td><td><button class="btn small'+(i===0?' primary':'')+'" data-drgo="'+i+'">Ir con el dron</button></td></tr>').join('')+'</tbody></table></div>';
  if(DRN.res) h+='<p><b>Última carrera</b>: '+esc(DRN.res.C.n)+' en '+kartFmt(DRN.res.T*1000)+(DRN.res.med?' · medalla de '+medName(DRN.res.med):'')+(DRN.res.rec?' · ¡récord!':'')+'</p>';
  h+='<p><small>Cómo leer la cámara: arriba, el tiempo de grabación (REC) y la batería; en el centro, la cruz; abajo, la altura sobre el suelo, la velocidad y lo lejos que está de ti; en carrera, la puerta, la vuelta, el tiempo y la flecha.</small></p>'; return h; }
function drWire(B){ B.querySelectorAll('[data-drgo]').forEach(b=>b.onclick=()=>{ const C=drCourses()[+b.dataset.drgo]; if(!C) return; flGo(C.pad); setTimeout(()=>{ if(S.mode==='walk'&&!C.pad.a.remoteBy) flEnter(C.pad.a); },900); }); }
function drDrawMap(g,m2c,s,big){ if(!DRN.c||!big) return; g.save(); for(const C of DRN.c){ const R=DRN.run&&DRN.run.C===C?DRN.run:null; for(const G of C.g){ const [x,y]=m2c(G.x,G.z), nx=R?G.i===R.k%C.g.length:G.i===0; g.fillStyle=nx?'#2fbf5a':'#f07f1e'; g.strokeStyle='#fff'; g.lineWidth=1*s; g.fillRect(x-2.2*s,y-2.2*s,4.4*s,4.4*s); g.strokeRect(x-2.2*s,y-2.2*s,4.4*s,4.4*s); } } g.restore(); }
function drLegend(){ return FL.list&&FL.list.some(A=>A.type==='drone')?'<div><i style="background:#f07f1e;border:2px solid #fff;border-radius:2px"></i>Puerta de una carrera de dron (verde: la siguiente; en el mapa grande)</div>':''; }
function drGuideHTML(){ return FL.list&&FL.list.some(A=>A.type==='drone')?'<li><b>Dron</b> (en los helipuertos del colegio y del club de golf, o «Volar» del menú): lo pilotas desde el suelo viendo su <b>cámara</b>; llega a 450 m de ti y a 120 m de altura, con batería. <b>Carreras de dron</b>: diez puertas de colores alrededor de su helipuerto, dos vueltas, récord y medallas.</li>':''; }
function drGlossHTML(){ return FL.list&&FL.list.some(A=>A.type==='drone')?'<dt>Dron</dt><dd>Aeronave pequeña sin nadie dentro que se pilota a distancia.</dd><dt>FPV</dt><dd>«Vista en primera persona»: la imagen de la cámara del dron, en directo.</dd><dt>Alcance</dt><dd>Lo lejos que puede ir el dron del mando antes de perder la señal.</dd>':''; }
