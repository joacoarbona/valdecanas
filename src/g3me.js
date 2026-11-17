/* ================= E1b · cuentas dentro de lo que más le gusta (solo Valdecañas con WP.cuentas) ================= */
// Nombres me*, estado ME. Dos recorridos con puertas de cuentas: «Aros de cuentas» volando (helicóptero, coche volador o escoba) y
// «Boyas de cuentas» en la moto de agua. Cada puerta tiene tres aros (o tres pasos entre boyas) con un número: hay que cruzar el del resultado.
// Fallar suma ME_C[k].pen segundos y no quita nada. Además, con un perfil de cuentas: el vecino del truco o trato pregunta una cuenta (3 caramelos más),
// los cofres del tesoro llevan candado de números (5 monedas más) y la tienda hace un 10 % de descuento si aciertas cuánto te queda.
// Esos tres usan la tarjeta de g3mt.js con modos de una cuenta (hl, ts, shop); los padres los apagan con MT.d.ing.
var ME_C={aire:{n:'Aros de cuentas',ic:'🚁',ns:8,gap:17,R:6.5,Rs:9,pen:4,v:42,med:[1.8,2.5,3.5],veh:'el helicóptero, el coche volador o la escoba de la bruja'},
  agua:{n:'Boyas de cuentas',ic:'🌊',ns:8,gap:7.5,pen:4,v:18,med:[1.35,1.8,2.4],veh:'la moto de agua'}};
var ME={on:false,k:'',st:'',p:null,rec:null,sta:[],next:0,t:0,ts:0,ok:0,bad:0,miss:0,away:0,px:0,py:0,pz:0,grp:null,texs:[],geos:[],mats:null,beam:null,med:[0,0,0],len:0,res:null,pass:null,locks:false,lockT:0,lockM:null,uiS:''};
function meKey(k){ return 'vg_me_'+WP.key+'_'+k; }
function meRec(k){ try{ return JSON.parse(store.get(meKey(k))||'null'); }catch(e){ return null; } }
// the profile that answers inside the game (truco o trato, chests, shop): only if the parents leave it on
function meIngP(){ return WP.cuentas&&MT.d&&MT.d.ing!==false?mtP():null; }
function meFlyNow(){ return (S.mode==='fly'&&!!P.fly)||(S.mode==='pow'&&PW.k==='escoba'); }
function meJetNow(){ return S.mode==='jet'&&!!P.jet&&(P.jet.type||'jet')==='jet'; }
function meRunning(){ return ME.on&&ME.st==='run'; }
function meBlocksFl(){ return ME.on&&ME.k==='aire'; }

/* ---- two wrong numbers that look right: one more or less, ten more or less, the other operation, the digits swapped ---- */
function meWrong(q){ const a=q.ans, c=[a+1,a-1,a+2,a-2,a+10,a-10,q.op==='+'?Math.abs(q.a-q.b):q.a+q.b,a+3,a-3,a+5];
  if(a>=10&&a<100){ const s=String(a); if(s[0]!==s[1]&&s[1]!=='0') c.push(+(s[1]+s[0])); }
  const pool=c.filter((v,i)=>v>=0&&v!==a&&c.indexOf(v)===i), out=[];
  while(out.length<2&&pool.length){ const i=Math.floor(Math.random()*Math.min(pool.length,5)); out.push(pool.splice(i,1)[0]); }
  while(out.length<2) out.push(a+4+out.length*3); return out; }
function meShuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); const t=a[i]; a[i]=a[j]; a[j]=t; } return a; }

/* ---- textures: a number in a white disc, the question on a board ---- */
function meTex(w,h,draw){ const t=canvasTex(w,h,draw); ME.texs.push(t); return t; }
function meNumTex(n){ return meTex(256,256,(g,w,h)=>{ g.fillStyle='#ffffff'; g.beginPath(); g.arc(w/2,h/2,116,0,7); g.fill(); g.lineWidth=16; g.strokeStyle='#16231b'; g.stroke();
  g.fillStyle='#16231b'; g.font='900 '+(String(n).length>2?104:String(n).length>1?136:150)+'px Figtree, system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(n),w/2,h/2+10); }); }
function meBoardTex(big,small,col){ return meTex(512,170,(g,w,h)=>{ const r=34; g.fillStyle='#fffdf4'; g.strokeStyle=col||'#f2c230'; g.lineWidth=14; g.beginPath(); g.moveTo(r,8); g.lineTo(w-r,8); g.quadraticCurveTo(w-8,8,w-8,r); g.lineTo(w-8,h-r); g.quadraticCurveTo(w-8,h-8,w-r,h-8); g.lineTo(r,h-8); g.quadraticCurveTo(8,h-8,8,h-r); g.lineTo(8,r); g.quadraticCurveTo(8,8,r,8); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#16231b'; g.textAlign='center'; g.textBaseline='middle'; g.font='900 '+(small?78:92)+'px Figtree, system-ui, sans-serif'; g.fillText(big,w/2,small?h/2-14:h/2+6); if(small){ g.font='700 34px Figtree, system-ui, sans-serif'; g.fillStyle='#59665d'; g.fillText(small,w/2,h-38); } }); }
function meSprite(tex,sx,sy,x,y,z){ const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,depthWrite:false,transparent:true,fog:false})); s.scale.set(sx,sy,1); s.position.set(x,y,z); ME.grp.add(s); return s; }

/* ---- the two courses ---- */
// in the air: from the hotel helipad round an ellipse over the island, 30 m above whatever is below
function meAirPts(){ const C=ME_C.aire, pad=FL.pads.find(p=>p.n==='Hotel')||FL.pads[0]; if(!pad) return null; const M=WP.map, cx=(M.x0+M.x1)/2, cz=(M.z0+M.z1)/2, rx=(M.x1-M.x0)*0.19, rz=(M.z1-M.z0)*0.19;
  const hg=(x,z)=>{ let g=Math.max(W.terrain(x,z),W.waterLevel(x,z)); for(const [u,v] of [[30,0],[-30,0],[0,30],[0,-30],[21,21],[-21,-21],[21,-21],[-21,21]]) g=Math.max(g,W.terrain(x+u,z+v)); return g; };
  const a0=Math.atan2((pad.z-cz)/rz,(pad.x-cx)/rx), N=C.ns, pts=[];
  for(let i=1;i<=N;i++){ const a=a0+i/(N+1)*Math.PI*2, x=cx+Math.cos(a)*rx, z=cz+Math.sin(a)*rz; pts.push([x,hg(x,z)+30+5*Math.sin(i*1.9),z]); }
  let dx=pts[0][0]-pad.x, dz=pts[0][2]-pad.z; const l=Math.hypot(dx,dz)||1; dx/=l; dz/=l; const sx=pad.x+dx*70, sz=pad.z+dz*70;
  return [[sx,Math.max(hg(sx,sz)+22,pad.y+22),sz]].concat(pts); }
// on the water: round the circle of the ski boat (SKI.loop), the start next to the pier
function meWaterPts(){ const L=SKI.loop, d=SKI.dir||1, N=ME_C.agua.ns; if(!L||!SKI.spot) return null; const a0=Math.atan2(SKI.spot[1]-L.cz,SKI.spot[0]-L.cx)+d*0.3, out=[];
  for(let i=0;i<=N;i++){ const th=a0+d*i*2*Math.PI/(N+1.4), x=L.cx+Math.cos(th)*L.r, z=L.cz+Math.sin(th)*L.r; out.push([x,W.waterLevel(x,z),z]); } return out; }
function meBuild(k){ const C=ME_C[k], pts=k==='aire'?meAirPts():meWaterPts(); if(!pts) return false;
  const G=new THREE.Group(); scene.add(G); ME.grp=G; ME.texs=[]; ME.geos=[]; ME.sta=[]; let len=0;
  const mat=(c,o)=>new THREE.MeshBasicMaterial(Object.assign({color:Cc(c)},o||{})), lam=c=>new THREE.MeshLambertMaterial({color:Cc(c)});
  ME.mats=k==='aire'?{off:mat('#f2a33a',{transparent:true,opacity:0.6}),on:mat('#35d06a'),s:mat('#f2c230'),ok:mat('#35d06a',{transparent:true,opacity:0.35}),done:mat('#c9cfc6',{transparent:true,opacity:0.22})}
    :{off:lam('#ff7a1a'),on:new THREE.MeshLambertMaterial({color:Cc('#2fbf5a'),emissive:Cc('#145a28')}),s:lam('#f2c230'),ok:lam('#9fd9ae'),done:lam('#c9cfc6')};
  const ring=new THREE.TorusGeometry(C.R||6.5,0.5,8,36), ringS=new THREE.TorusGeometry(C.Rs||9,0.6,8,40), buoy=new THREE.SphereGeometry(0.6,14,10); ME.geos.push(ring,ringS,buoy);
  for(let i=0;i<pts.length;i++){ const p=pts[i], a=pts[Math.max(0,i-1)], b=pts[Math.min(pts.length-1,i+1)]; let tx=b[0]-a[0], tz=b[2]-a[2]; const tl=Math.hypot(tx,tz)||1; tx/=tl; tz/=tl;
    const Z={i,start:i===0,x:p[0],y:p[1],z:p[2],tx,tz,nx:tz,nz:-tx,m:[],lab:[]}; if(i>0) len+=Math.hypot(p[0]-a[0],p[1]-a[1],p[2]-a[2]); ME.sta.push(Z); }
  // the questions: one per gate, from the child's level (with the due reviews), never the same twice
  const seen=[]; for(const Z of ME.sta){ if(Z.start) continue; const q=mtPick(ME.p,'game',seen); seen.push(q.key); Z.q=q; Z.vals=meShuffle([q.ans].concat(meWrong(q))); Z.ci=Z.vals.indexOf(q.ans); Z.pick=-1; Z.res=-1; }
  for(const Z of ME.sta){ const ry=-Math.atan2(Z.tz,Z.tx)+Math.PI/2, at=o=>[Z.x+Z.nx*o,Z.z+Z.nz*o];
    if(k==='aire'){
      if(Z.start){ const m=new THREE.Mesh(ringS,ME.mats.s); m.position.set(Z.x,Z.y,Z.z); m.rotation.y=ry; G.add(m); Z.m.push(m); Z.lab.push(meSprite(meBoardTex('SALIDA','cruza el aro y empieza','#f2c230'),20,6.6,Z.x,Z.y+C.Rs+5.5,Z.z)); continue; }
      for(let j=0;j<3;j++){ const [x,z]=at((j-1)*C.gap), m=new THREE.Mesh(ring,ME.mats.off); m.position.set(x,Z.y,z); m.rotation.y=ry; G.add(m); Z.m.push(m); Z.lab.push(meSprite(meNumTex(Z.vals[j]),7.6,7.6,x,Z.y,z)); }
      Z.board=meSprite(meBoardTex(mtOpTxt(Z.q)+' = ?','puerta '+Z.i+' de '+C.ns),20,6.6,Z.x,Z.y+C.R+6.2,Z.z); }
    else {
      if(Z.start){ for(const sd of [-1,1]){ const [x,z]=at(sd*8), m=new THREE.Mesh(buoy,ME.mats.s); m.position.set(x,W.waterLevel(x,z)+0.25,z); m.scale.setScalar(1.4); G.add(m); Z.m.push(m); }
        Z.lab.push(meSprite(meBoardTex('SALIDA','pasa entre las boyas amarillas','#f2c230'),9.5,3.2,Z.x,Z.y+4.2,Z.z)); continue; }
      for(let j=0;j<4;j++){ const [x,z]=at((j-1.5)*C.gap), m=new THREE.Mesh(buoy,ME.mats.off); m.position.set(x,W.waterLevel(x,z)+0.25,z); G.add(m); Z.m.push(m); }
      for(let j=0;j<3;j++){ const [x,z]=at((j-1)*C.gap); Z.lab.push(meSprite(meNumTex(Z.vals[j]),3.4,3.4,x,Z.y+2.4,z)); }
      Z.board=meSprite(meBoardTex(mtOpTxt(Z.q)+' = ?','puerta '+Z.i+' de '+C.ns),11,3.7,Z.x,Z.y+6.4,Z.z); } }
  const bm=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,k==='aire'?80:26,8,1,true),new THREE.MeshBasicMaterial({color:0xf2c230,transparent:true,opacity:0.35,depthWrite:false})); bm.frustumCulled=false; G.add(bm); ME.beam=bm; ME.geos.push(bm.geometry);
  ME.len=len; const base=len/C.v*1000; ME.med=C.med.map(f=>Math.round(base*f/500)*500); return true; }
function meClear(){ if(ME.grp){ ME.grp.traverse(o=>{ if(o.material){ for(const m of (Array.isArray(o.material)?o.material:[o.material])){ if(o.isSprite) m.dispose(); } } }); scene.remove(ME.grp); }
  for(const t of ME.texs) t.dispose(); for(const g of ME.geos) g.dispose(); if(ME.mats) for(const k in ME.mats) ME.mats[k].dispose();
  ME.grp=null; ME.texs=[]; ME.geos=[]; ME.mats=null; ME.beam=null; ME.sta=[]; ME.on=false; ME.st=''; $('meHud').hidden=true; document.body.classList.remove('meon'); ME.uiS=''; }
// highlight: the next gate in green with a yellow beam; answered gates fade (the right ring stays a little green)
function meMark(){ const M=ME.mats; if(!M) return; ME.sta.forEach((Z,i)=>{ for(let j=0;j<Z.m.length;j++){ let m;
    if(Z.start) m=ME.next===0?M.s:M.done; else if(i<ME.next){ const right=ME.k==='aire'?j===Z.ci:(j===Z.ci||j===Z.ci+1); m=right?M.ok:M.done; } else m=i===ME.next?M.on:M.off;
    Z.m[j].material=m; } const dim=i<ME.next; for(const s of Z.lab) s.material.opacity=dim?0.35:1; if(Z.board) Z.board.material.opacity=dim?0.35:1; });
  const Z=ME.sta[ME.next]; if(Z&&ME.beam){ ME.beam.visible=true; ME.beam.position.set(Z.x,ME.k==='aire'?Z.y-48:Z.y+13,Z.z); } else if(ME.beam) ME.beam.visible=false; }

/* ---- start, cross, finish ---- */
function meStart(k){ const C=ME_C[k]; if(!C||!WP.cuentas||!MT.d) return; const p=mtP();
  if(!p){ toast(C.n,'Primero crea tu perfil en Cuentas'); mtSheet('jugar'); return; }
  if(k==='aire'&&!FL.list.length){ toast(C.n,'En este mundo no hay aeronaves'); return; }
  if(k==='agua'&&(!SKI.loop||!JET.list.some(j=>(j.type||'jet')==='jet'&&!j.remoteBy))){ toast(C.n,'No hay ninguna moto de agua libre'); return; }
  if(raceNow()||(typeof tgPlaying==='function'&&tgPlaying())){ toast(C.n,'Termina antes la carrera o la partida'); return; }
  try{ closeModal(); }catch(e){} hideMap(); for(const id of ['mtSheet','flSheet','cirSheet']){ const e=$(id); if(e) e.hidden=true; } if(!$('mtCard').hidden&&MT.q&&MT.q.st==='res') mtClose(); ensureAudio();
  if(ME.on) meClear(); ME.k=k; ME.p=p; if(!meBuild(k)){ meClear(); toast(C.n,'No he encontrado sitio para el recorrido'); return; }
  ME.on=true; ME.st='wait'; ME.rec=meRec(k); ME.next=0; ME.t=0; ME.ts=0; ME.ok=0; ME.bad=0; ME.miss=0; ME.away=0; ME.res=null; ME.px=P.x; ME.py=P.y; ME.pz=P.z; meMark(); document.body.classList.add('meon'); $('meHud').hidden=false; meHud();
  const s0=ME.sta[0];
  if(k==='aire'){ if(!meFlyNow()){ const pad=FL.pads.find(q=>q.n==='Hotel')||FL.pads[0]; flGo(pad); setTimeout(()=>tip('Pilota la aeronave y cruza el aro amarillo de SALIDA. En cada puerta, pasa por el aro con el resultado',6000),900); }
    else tip('Ve al aro amarillo de SALIDA (la columna amarilla) y crúzalo. En cada puerta, pasa por el aro con el resultado',5000); return; }
  fadeTo(()=>{ cirLand(); if(KART.on) kartEnd('Has dejado la carrera'); if(S.interior) exitVilla(); if(P.buggy) exitBuggy(); if(HX.sit) hxStand(); if(P.horse) dismountHorse(); if(BK.b) bkUnmount({stay:true});
    const J=(P.jet&&(P.jet.type||'jet')==='jet')?P.jet:JET.list.find(j=>(j.type||'jet')==='jet'&&!j.remoteBy); if(P.jet&&P.jet!==J) dismountJet();
    const sx=s0.x-s0.tx*26, sz=s0.z-s0.tz*26, yaw=Math.atan2(s0.tz,s0.tx); J.x=sx; J.z=sz; J.yaw=yaw; J.v=0; J.air=false; J.y=W.waterLevel(sx,sz)+0.1; jetPlace(J,0); if(P.jet!==J) mountJet(J);
    P.x=sx; P.z=sz; P.yaw=yaw; camS.yaw=yaw; ME.px=sx; ME.py=P.y; ME.pz=sz; });
  setTimeout(()=>tip('Pasa entre las boyas amarillas de SALIDA. En cada puerta, cruza entre las dos boyas del número que es el resultado',6000),700); }
// where the path crosses the plane of a gate, going forwards: sideways (l) and height (dy) from its centre
function meCross(Z,x0,y0,z0,x1,y1,z1){ const s0=(x0-Z.x)*Z.tx+(z0-Z.z)*Z.tz, s1=(x1-Z.x)*Z.tx+(z1-Z.z)*Z.tz; if(!(s0<0&&s1>=0)) return null; const k=s0/(s0-s1);
  const px=x0+(x1-x0)*k, py=y0+(y1-y0)*k, pz=z0+(z1-z0)*k; return {l:(px-Z.x)*Z.nx+(pz-Z.z)*Z.nz,dy:py-Z.y}; }
function meGate(Z,c){ const k=ME.k, C=ME_C[k], air=k==='aire';
  if(Z.start){ const inside=air?Math.hypot(c.l,c.dy+1.2)<=C.Rs+1:Math.abs(c.l)<=8.6; if(!inside){ if(Math.abs(c.l)<60) tip(air?'Pasa por dentro del aro amarillo de SALIDA':'Pasa entre las dos boyas amarillas de SALIDA',2400); return; }
    ME.st='run'; ME.t=0; ME.ts=0; ME.next=1; blip('cup'); meMark(); meHud(); tip('¡Ya! Primera cuenta: '+mtOpTxt(ME.sta[1].q)+'. Busca el '+(air?'aro':'paso')+' con el resultado',3200); return; }
  const offs=[-C.gap,0,C.gap]; let j=-1, bd=1e9; for(let i=0;i<3;i++){ const d=air?Math.hypot(c.l-offs[i],c.dy+1.2):Math.abs(c.l-offs[i]); if(d<bd){ bd=d; j=i; } }
  if(bd>(air?C.R+1:C.gap/2+0.4)){ if(Math.abs(c.l)<C.gap*3.5&&(!air||Math.abs(c.dy)<35)){ ME.miss++; blip('jump'); tip(air?'Has pasado por fuera: da la vuelta y cruza uno de los tres aros':'Has pasado por fuera: da la vuelta y cruza entre dos boyas',2800); } return; }
  const ok=j===Z.ci, q=Z.q; Z.pick=j; Z.res=ok?1:0; mtRecord(ME.p,q,ok?1:0,Math.max(1,ME.t-ME.ts),{mode:'game'});
  if(ok){ ME.ok++; blip('gold'); tip('¡Bien! '+mtOpTxt(q)+' = '+q.ans,1700); } else { ME.bad++; ME.t+=C.pen; blip('hit'); tip('Era el '+q.ans+': '+mtOpTxt(q)+' = '+q.ans+' · +'+C.pen+' s',3000); }
  meFlash(ok); ME.next++; ME.ts=ME.t; meMark(); if(ME.next>=ME.sta.length) meEnd('fin'); else meHud(); }
function meEnd(why){ if(!ME.on) return; const k=ME.k, C=ME_C[k];
  if(why!=='fin'){ meClear(); if(why==='quit') toast('Has dejado '+(k==='aire'?'los aros':'las boyas')+' de cuentas','Vuelve a empezar desde «Cuentas»'); return; }
  const p=ME.p, ms=Math.round(ME.t*1000), R=meRec(k), isRec=!R||ms<R.ms, M=ME.med, md=ms<=M[0]?'g':ms<=M[1]?'s':ms<=M[2]?'b':'', n=ME.sta.length-1, ok=ME.ok;
  if(isRec) store.set(meKey(k),JSON.stringify({ms,ok,n,who:p.nm,d:Date.now(),md}));
  else if(md&&'gsb'.indexOf(md)<'gsb'.indexOf(R.md||'x')){ R.md=md; store.set(meKey(k),JSON.stringify(R)); }
  ME.res={k,ms,md,isRec,prev:R?R.ms:0,ok,n,med:M.slice(),rows:ME.sta.slice(1).map(Z=>({q:Z.q,ok:Z.res===1,v:Z.vals[Z.pick]}))};
  meClear(); MT.soon=1; blip('gold');
  ME.res.cc=mtCoins(p,ok); prgEarn(6+(md==='g'?10:md==='s'?6:md==='b'?3:0)+(isRec&&R?5:0),C.n); if(md==='g'&&ok===n) prgTrophy(k==='aire'?'mtaros':'mtboyas',p.nm);
  MT.q={mode:'res',p,st:'res',html:meResHTML()}; mtCard(); }
function meResHTML(){ const r=ME.res, C=ME_C[r.k], p=ME.p, M=r.med;
  let h=mtHead(p)+'<h2>'+C.ic+' '+C.n+'</h2><p style="font-family:var(--f-display);font-size:28px;font-weight:800;margin:0 0 4px">'+kartFmt(r.ms)+' '+(r.md?cupSVG(r.md,true).replace('<svg','<svg style="vertical-align:-6px"'):'')+'</p>';
  h+='<p><b>'+r.ok+' de '+r.n+'</b> bien'+(r.n>r.ok?' (cada fallo suma '+C.pen+' s)':'')+'. '+(r.md?'Medalla de <b>'+METAL[r.md].n+'</b>. ':'Sin medalla esta vez. ')+(r.isRec?'¡Nuevo récord!'+(r.prev?' Antes: '+kartFmt(r.prev)+'.':''):'Tu récord: '+kartFmt(r.prev)+'.')+'</p>';
  h+='<div class="tablewrap"><table class="card"><thead><tr><th>Cuenta</th><th>Pasaste por</th><th></th></tr></thead><tbody>'+r.rows.map(x=>'<tr><td class="nm">'+mtOpTxt(x.q)+' = '+x.q.ans+'</td><td class="num">'+x.v+'</td><td>'+(x.ok?'✅':'❌')+'</td></tr>').join('')+'</tbody></table></div>';
  h+='<p class="note">Medallas: oro en '+kartFmt(M[0])+' o menos · plata '+kartFmt(M[1])+' · bronce '+kartFmt(M[2])+'. '+(r.cc?'+'+r.cc+' monedas por las cuentas acertadas. ':'')+'Las falladas vuelven más tarde para repasarlas.</p>';
  return h+'<div class="row"><button class="btn primary" id="meAgain">Repetir con otras cuentas</button><button class="btn small" id="mtEndB">Seguir</button></div>'; }
function meFlash(ok){ const h=$('meHud'); h.classList.remove('ok','no'); void h.offsetWidth; h.classList.add(ok?'ok':'no'); }

/* ---- every frame: the chests' padlocks, the gate you cross, the pulse of the next one, the marker ---- */
function meTick(dt){ if(!WP.cuentas) return; ME.lockT-=dt; if(ME.lockT<=0){ ME.lockT=0.5; meLocks(); } if(!ME.on) return;
  const k=ME.k, ok=k==='aire'?meFlyNow():meJetNow(), m=S.mode;
  if(ME.st==='run'){ if(!ok&&m!=='photo'){ ME.away+=dt; if(ME.away>2.5){ meEnd('quit'); return; } } else ME.away=0; if(m!=='photo') ME.t+=dt; }
  const Z=ME.sta[ME.next]; if(Z&&ok){ const c=meCross(Z,ME.px,ME.py,ME.pz,P.x,P.y,P.z); if(c) meGate(Z,c); }
  if(!ME.on) return; ME.px=P.x; ME.py=P.y; ME.pz=P.z;
  const N=ME.sta[ME.next]; if(N&&k==='aire'){ const s=1+0.05*Math.sin(performance.now()/160); for(const r of N.m) r.scale.setScalar(s); }
  meHud(); }
function meHud(){ const C=ME_C[ME.k]; if(!C) return; const R=ME.rec, Z=ME.sta[ME.next], n=ME.sta.length-1;
  const t1=C.ic+' '+C.n+(ME.st==='run'?' · puerta '+Math.min(ME.next,n)+' de '+n:''), q=ME.st==='run'&&Z?mtOpTxt(Z.q)+' = ?':ME.k==='aire'?'Cruza el aro de SALIDA':'Pasa la SALIDA',
    t2=(ME.st==='run'?kartFmt(ME.t*1000||1)+' · ✅ '+ME.ok+' · ❌ '+ME.bad:'Medalla de oro: '+kartFmt(ME.med[0]))+(R?' · récord '+kartFmt(R.ms):''), s=t1+'|'+q+'|'+t2;
  if(s===ME.uiS) return; ME.uiS=s; $('meT1').textContent=t1; $('meQ').textContent=q; $('meT2').textContent=t2; }

/* ---- truco o trato: the neighbour asks a sum; right, 3 sweets more ---- */
function meHlAsk(V){ const p=meIngP(); if(!p||!$('mtCard').hidden) return false; const n=2+((Math.random()*4)|0); V.st='quiz'; V.t=0; hlBubble(V,'¡Trato! Pero antes, una cuenta…');
  const give=ok=>{ if(HL.visit!==V||V.st!=='quiz') return; const m=n+(ok?3:0); V.st='treat'; V.t=0; hlGive(V,m); hlBubble(V,ok?'¡Muy bien! Toma '+m+' caramelos':'¡Toma, '+m+' caramelos!'); };
  mtStart('hl',{fr:'🎃 El vecino te pregunta una cuenta antes del trato. Si aciertas, te da <b>3 caramelos más</b>; si no, el trato de siempre.',cb:ok=>give(ok),back:()=>give(false),quitTxt:'Solo el trato',endTxt:'Coger los caramelos',okTxt:'¡3 caramelos más!'}); return true; }

/* ---- the treasure chests: a number padlock whose code is the result ---- */
function meTsLabel(){ return meIngP()?'🔒 Abrir el candado':'Abrir el cofre'; }
function meTsLock(C){ const p=meIngP(); if(!p||!C||C.open||!$('mtCard').hidden) return false; P.vx=P.vz=0;
  mtStart('ts',{fr:'🔒 Este cofre tiene un <b>candado de números</b>: el código es el resultado. Si aciertas, el cofre trae <b>5 monedas más</b>.',endTxt:'Abrir el cofre',quitTxt:'Luego',okTxt:'¡Clic! El candado se abre',
    cb:(ok,q)=>{ if(C.open) return; tsOpen(C,ok?5:0); if(!ok) setTimeout(()=>tip('El código era el '+q.ans+': esta vez el candado se abre igual, sin las monedas de más',3200),400); }}); return true; }
function meLockMesh(){ if(!ME.lockM){ const gold=new THREE.MeshLambertMaterial({color:Cc('#d9a521'),emissive:Cc('#3a2a00')}), steel=new THREE.MeshLambertMaterial({color:Cc('#b9bec4')});
    const tx=canvasTex(128,48,(g,w,h)=>{ g.fillStyle='#16231b'; g.fillRect(0,0,w,h); for(let i=0;i<3;i++){ g.fillStyle='#fffdf4'; g.fillRect(8+i*40,6,32,36); g.fillStyle='#16231b'; g.font='900 30px system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('?',24+i*40,26); } });
    ME.lockM={gold,steel,body:new THREE.BoxGeometry(0.26,0.21,0.08),sh:new THREE.TorusGeometry(0.08,0.02,6,14,Math.PI),dial:new THREE.PlaneGeometry(0.21,0.08),dm:new THREE.MeshBasicMaterial({map:tx})}; }
  const L=ME.lockM, g=new THREE.Group(); g.scale.setScalar(1.35); g.add(new THREE.Mesh(L.body,L.gold)); const sh=new THREE.Mesh(L.sh,L.steel); sh.position.y=0.1; g.add(sh); const d=new THREE.Mesh(L.dial,L.dm); d.position.set(0,-0.02,0.041); g.add(d); return g; }
function meLocks(){ if(!TS.list||!TS.list.length) return; const on=!!meIngP();
  for(const C of TS.list){ let L=C.m.userData.mel; if(!L){ if(!on||C.open) continue; L=meLockMesh(); L.position.set(0,0.25,0.36); C.m.add(L); C.m.userData.mel=L; } const v=on&&!C.open; if(L.visible!==v) L.visible=v; } }

/* ---- the shop: «Tienes 45, cuesta 30, ¿cuánto te queda?»; right, 10 % off ---- */
function meShopQ(p,it){ const c=PRG.coins, pr=it.p, lv=p.lv, cap=lv<=2?10:lv<=4?20:100;
  if(c<=cap&&pr<=c) return {q:mtQ(c,'-',pr,c>20?6:c>10?4:2,false),fr:'🛍️ Tienes <b>'+c+'</b> monedas y «'+esc(it.n)+'» cuesta <b>'+pr+'</b>. ¿Cuántas te quedan? Si aciertas, te lo dejo un <b>10 % más barato</b>.'};
  const sl=lv<=2?2:lv<=4?4:6, q=mtGen(sl,lv%2?0.25:p.d);
  return {q,fr:'🛍️ Para el descuento del <b>10 %</b>: si tuvieras <b>'+q.a+'</b> monedas y algo costara <b>'+q.b+'</b>, ¿cuántas te quedarían?'}; }
// called by prgBuy before paying: >0 = discount already earned, 0 = pay the full price, -1 = the card is open and redo() buys when it is answered
function meShopDisc(it,redo){ if(ME.pass&&ME.pass.id===it.id){ const d=ME.pass.d; ME.pass=null; return d; } ME.pass=null;
  const p=meIngP(); if(!p||!redo||!(it.p>=10)||!$('mtCard').hidden) return 0; const Q=meShopQ(p,it), d=Math.max(1,Math.round(it.p*0.1));
  mtStart('shop',{q:Q.q,fr:Q.fr,endTxt:'Comprar por '+it.p,quitTxt:'Cancelar',okTxt:'Te lo dejo en '+(it.p-d)+' monedas',
    alt:['Comprar sin descuento',()=>{ ME.pass={id:it.id,d:0}; redo(); }],
    cb:ok=>{ ME.pass={id:it.id,d:ok?d:0}; redo(); if(ok) setTimeout(()=>tip('🛍️ Descuento por la cuenta: pagas '+(it.p-d)+' en vez de '+it.p,3400),300); }}); return -1; }

/* ---- texts: the sheet «Cuentas» (Jugar), the flying sheet, the map, the guide and the glossary ---- */
function mePlayHTML(){ if(!WP.cuentas) return ''; const card=k=>{ const C=ME_C[k], R=meRec(k), can=k==='aire'?FL.list.length>0:!!SKI.loop&&JET.list.some(j=>(j.type||'jet')==='jet'); if(!can) return '';
    return '<div class="cirk"><b>'+C.ic+' '+C.n+'</b><p>'+(k==='aire'?'Vuela con '+C.veh+' por '+C.ns+' puertas de tres aros. En cada una sale una cuenta: <b>cruza el aro con el resultado</b>.':'Con '+C.veh+', '+C.ns+' puertas de boyas en el embalse. En cada una sale una cuenta: <b>pasa entre las boyas del resultado</b>.')+' Cada fallo suma '+C.pen+' s; no quita nada.</p>'+
      '<p class="note">'+(R?'Récord: <b>'+kartFmt(R.ms)+'</b> ('+R.ok+' de '+R.n+' bien)'+(R.md?' · '+cupSVG(R.md,true).replace('<svg','<svg style="vertical-align:-8px"'):'')+' · '+esc(R.who):'Aún sin récord')+'</p>'+
      (ME.on&&ME.k===k?'<button class="btn small" data-meq="1">Dejarlo</button>':'<button class="btn small primary" data-mego="'+k+'">Empezar</button>')+'</div>'; };
  return '<h3>Cuentas en el juego</h3>'+card('aire')+card('agua')+'<ul class="note"><li>🎃 <b>Truco o trato</b>: al pedir trato, el vecino pregunta una cuenta; si aciertas, 3 caramelos más.</li><li>🔒 <b>Cofres del tesoro</b>: llevan un candado de números; el código es el resultado (5 monedas más).</li><li>🛍️ <b>Tienda</b>: antes de comprar, «tienes tanto, cuesta tanto: ¿cuánto te queda?»; si aciertas, un 10 % de descuento.</li></ul>'+(MT.d.ing===false?'<p class="note">Truco o trato, cofres y tienda sin cuentas: lo han apagado en «Para padres».</p>':''); }
function meFlyHTML(){ if(!WP.cuentas||!FL.list.length) return ''; const R=meRec('aire');
  return '<h3>🚁 Aros de cuentas</h3><p>Ocho puertas de tres aros con números: en cada una sale una cuenta y hay que cruzar el aro del resultado. Cada fallo suma '+ME_C.aire.pen+' s. '+(R?'Récord: <b>'+kartFmt(R.ms)+'</b>.':'')+' Hace falta un perfil de Cuentas.</p><div class="row"><button class="btn small" id="meAirGo">Aros de cuentas</button></div>'; }
function meDrawMap(g,m2c,s,big){ if(!ME.on||!ME.sta.length) return; g.save(); const r=(big?5:3.2)*s;
  g.strokeStyle=ME.k==='aire'?'#7a3fc4':'#1d5f8a'; g.lineWidth=(big?2.4:1.6)*s; g.setLineDash([5*s,4*s]); g.beginPath(); ME.sta.forEach((Z,i)=>{ const [x,y]=m2c(Z.x,Z.z); i?g.lineTo(x,y):g.moveTo(x,y); }); g.stroke(); g.setLineDash([]);
  ME.sta.forEach((Z,i)=>{ const [x,y]=m2c(Z.x,Z.z), nx=i===ME.next; g.fillStyle=Z.start?'#f2c230':nx?'#1f9d4c':i<ME.next?'#c9cfc6':'#e8912c'; g.strokeStyle='#fff'; g.lineWidth=1.3*s; g.beginPath(); g.arc(x,y,nx?r*1.15:r*0.8,0,7); g.fill(); g.stroke();
    if(big&&!Z.start){ g.fillStyle='#fff'; g.font='800 '+(6*s)+'px system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(i),x,y+0.3*s); } }); g.restore(); }
function meLegend(){ if(!ME.on) return ''; const C=ME_C[ME.k];
  return '<div><i style="background:repeating-linear-gradient(90deg,'+(ME.k==='aire'?'#7a3fc4':'#1d5f8a')+' 0 6px,transparent 6px 10px);height:4px;border:0"></i>'+C.n+'</div><div><i class="dot" style="background:#1f9d4c;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></i>Siguiente puerta de cuentas (naranja: las que faltan; gris: hechas)</div><div><i class="dot" style="background:#f2c230;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></i>Salida de '+C.n.toLowerCase()+'</div>'; }

if(WP.cuentas){
  TRO.push({id:'mtaros',n:'Piloto de cuentas',how:'Medalla de oro en los aros de cuentas sin fallar ninguna cuenta.',m:'s',c:20,w:'cuentas'},
    {id:'mtboyas',n:'Capitán de cuentas',how:'Medalla de oro en las boyas de cuentas sin fallar ninguna cuenta.',m:'s',c:20,w:'cuentas'});
  { const b=$('meX'); if(b) b.onclick=e=>{ e.stopPropagation(); meEnd('quit'); }; }
}
