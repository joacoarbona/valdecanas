
/* ================= karts: a race on the course in buggies, alone against the machine or with the friends of the room ================= */
// The circuit is built from consecutive holes of the course you play (tee → green → next tee … back to the first tee),
// chosen so that it closes on itself, measures about 1.6 km and never crosses water. Gates mark it; the next one has a yellow column.
const KART={on:false,C:null,laps:2,crash:true,nb:3,go:0,lock:true,lap:0,cp:1,s:0,idx:0,t0:0,lapT0:0,bestLap:0,item:0,boost:0,padCd:0,spin:0,spinD:1,done:false,fin:0,
  bots:[],balls:[],ents:[],gates:[],pads:[],boxes:[],puddles:[],rid:'',host:'',musPrev:null,hudT:0,beam:null,inPud:false,ids:null};
const KART_BOTS=[['Pepa',1],['Lolo',2],['Nico',3]];
function kartFmt(ms){ if(!(ms>0)) return '–'; const t=ms/1000, m=Math.floor(t/60), s=t-m*60; return m+':'+(s<10?'0':'')+s.toFixed(1); }
function kartCrosses(x0,z0,x1,z1){ const L=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.ceil(L/5)); let w=0;
  for(let k=0;k<=n;k++){ const x=x0+(x1-x0)*k/n, z=z0+(z1-z0)*k/n; if(W.terrain(x,z)<W.waterLevel(x,z)+0.15) w+=1;
    const tr=treeGrid.get(Math.floor(x/20)+','+Math.floor(z/20)); if(tr) for(const t of tr) if(Math.hypot(x-t.x,z-t.z)<t.tr+2.5){ w+=0.08; break; } } return w; }
// pick the loop of consecutive holes: closes near its start, ~1.6 km, no water on the way
function kartPickHoles(){ const hs=(W.COURSES[S.course]||W.COURSES[0]).holes; let best=null;
  for(let a=0;a<hs.length;a++) for(let n=2;n<=6;n++){ const ids=[]; for(let k=0;k<n;k++) ids.push(hs[(a+k)%hs.length]); if(ids.some(i=>!W.HOLES[i])) continue;
    const pts=kartRaw(ids); let L=0, wet=0; for(let k=0;k<pts.length-1;k++){ L+=Math.hypot(pts[k+1][0]-pts[k][0],pts[k+1][1]-pts[k][1]); wet+=kartCrosses(pts[k][0],pts[k][1],pts[k+1][0],pts[k+1][1]); }
    const H0=W.HOLES[ids[0]], Hn=W.HOLES[ids[n-1]]; const close=Math.hypot(Hn.gx-H0.P[0][0],Hn.gz-H0.P[0][1]);
    const sc=wet*400+close*2.5+Math.abs(L-1600)*0.5; if(!best||sc<best.sc) best={sc,ids}; }
  return best?best.ids:hs.slice(0,3); }
function kartRaw(ids){ const pts=[]; for(const i of ids) for(const p of W.HOLES[i].P) pts.push([p[0],p[1]]); return pts; }
// smooth the closed polyline (Chaikin) and resample it every 4 m
function kartBuild(ids){ let pts=kartRaw(ids);
  for(let it=0;it<3;it++){ const o=[]; for(let k=0;k<pts.length;k++){ const a=pts[k], b=pts[(k+1)%pts.length]; o.push([a[0]*0.75+b[0]*0.25,a[1]*0.75+b[1]*0.25],[a[0]*0.25+b[0]*0.75,a[1]*0.25+b[1]*0.75]); } pts=o; }
  const S4=[], st=4; let acc=0; S4.push([pts[0][0],pts[0][1],0]);
  for(let k=0;k<pts.length;k++){ const a=pts[k], b=pts[(k+1)%pts.length]; const L=Math.hypot(b[0]-a[0],b[1]-a[1]); let t=st-acc;
    while(t<=L){ S4.push([a[0]+(b[0]-a[0])*t/L,a[1]+(b[1]-a[1])*t/L,0]); t+=st; } acc=L-(t-st); }
  for(let k=0;k<S4.length;k++){ S4[k][2]=k*st; }
  const L=S4.length*st; const names=ids.map(i=>W.HOLES[i].n);
  return {ids,pts:S4,L,st,names,key:WP.key+'_kart_'+ids.join('-')}; }
function kartAt(C,s){ s=((s%C.L)+C.L)%C.L; const f=s/C.st, i=Math.floor(f)%C.pts.length, j=(i+1)%C.pts.length, u=f-Math.floor(f); const a=C.pts[i], b=C.pts[j];
  const x=a[0]+(b[0]-a[0])*u, z=a[1]+(b[1]-a[1])*u, yaw=Math.atan2(b[1]-a[1],b[0]-a[0]); return {x,z,yaw}; }
// track position s of (x, z), searching near the last index so the projection stays continuous
function kartProj(C,x,z,idx){ const n=C.pts.length; let bi=idx, bd=1e18; for(let k=-40;k<=40;k++){ const i=((idx+k)%n+n)%n, p=C.pts[i]; const d=(p[0]-x)*(p[0]-x)+(p[1]-z)*(p[1]-z); if(d<bd){ bd=d; bi=i; } } return bi; }

/* ---- the props on the track ---- */
function kartTex(draw,w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t; }
let KART_M=null;
function kartMats(){ if(KART_M) return KART_M;
  const checker=kartTex((g,w,h)=>{ for(let i=0;i<16;i++) for(let j=0;j<2;j++){ g.fillStyle=(i+j)%2?'#16231b':'#ffffff'; g.fillRect(i*w/16,j*h/2,w/16,h/2); } },256,32);
  const chev=kartTex((g,w,h)=>{ g.fillStyle='#f2c230'; g.fillRect(0,0,w,h); g.fillStyle='#d6442a'; for(let k=0;k<3;k++){ const y=h*0.18+k*h*0.27; g.beginPath(); g.moveTo(w*0.1,y+h*0.2); g.lineTo(w*0.5,y); g.lineTo(w*0.9,y+h*0.2); g.lineTo(w*0.9,y+h*0.3); g.lineTo(w*0.5,y+h*0.1); g.lineTo(w*0.1,y+h*0.3); g.fill(); } },64,96);
  const box=kartTex((g,w,h)=>{ g.fillStyle='#f2c230'; g.fillRect(0,0,w,h); g.strokeStyle='#fff'; g.lineWidth=6; g.strokeRect(4,4,w-8,h-8); g.fillStyle='#fff'; g.font='bold 44px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('?',w/2,h/2+2); },64,64);
  KART_M={pole:new THREE.MeshLambertMaterial({color:Cc('#d6442a')}),ban:new THREE.MeshLambertMaterial({color:Cc('#ffffff')}),next:new THREE.MeshLambertMaterial({color:Cc('#2f9e5a'),emissive:Cc('#103a20')}),
    start:new THREE.MeshLambertMaterial({map:checker}),pad:new THREE.MeshBasicMaterial({map:chev,transparent:true,opacity:0.95,polygonOffset:true,polygonOffsetFactor:-2}),
    box:new THREE.MeshLambertMaterial({map:box,transparent:true,opacity:0.92,emissive:Cc('#3a2a00')}),pud:new THREE.MeshBasicMaterial({color:Cc('#3f7fa0'),transparent:true,opacity:0.7,polygonOffset:true,polygonOffsetFactor:-2,depthWrite:false}),
    ball:new THREE.MeshLambertMaterial({color:Cc('#ffffff'),emissive:Cc('#444444')}),beam:new THREE.MeshBasicMaterial({color:Cc('#f2c230'),transparent:true,opacity:0.32,depthWrite:false}),
    poleG:new THREE.CylinderGeometry(0.16,0.16,4.2,8),banG:new THREE.BoxGeometry(0.12,0.9,15),padG:new THREE.PlaneGeometry(3.6,5.4),boxG:new THREE.BoxGeometry(1.1,1.1,1.1),pudG:new THREE.CircleGeometry(3,24),ballG:new THREE.SphereGeometry(0.4,14,10)};
  return KART_M; }
function kartAdd(o){ scene.add(o); KART.ents.push(o); return o; }
function kartProps(){ const C=KART.C, M=kartMats(); const T0=(x,z)=>terrainAt(x,z);
  const NG=Math.max(6,Math.round(C.L/110)); KART.gates=[];
  for(let k=0;k<NG;k++){ const s=k*C.L/NG, q=kartAt(C,s), g=new THREE.Group(); const c=Math.cos(q.yaw), sn=Math.sin(q.yaw);
    for(const sd of [-7.5,7.5]){ const p=new THREE.Mesh(M.poleG,M.pole); const x=q.x-sn*sd, z=q.z+c*sd; p.position.set(x,T0(x,z)+2.1,z); g.add(p); }
    const b=new THREE.Mesh(M.banG,k===0?M.start:M.ban); b.position.set(q.x,T0(q.x,q.z)+3.9,q.z); b.rotation.y=-q.yaw; g.add(b); kartAdd(g); KART.gates.push({s,x:q.x,z:q.z,b,start:k===0}); }
  KART.pads=[0.3,0.72].map(f=>{ const q=kartAt(C,f*C.L), m=new THREE.Mesh(M.padG,M.pad); m.rotation.order='YXZ'; m.rotation.set(-Math.PI/2,0,0); m.rotation.y=-q.yaw-Math.PI/2; m.position.set(q.x,T0(q.x,q.z)+0.12,q.z); kartAdd(m); return {x:q.x,z:q.z}; });
  KART.boxes=[]; for(const f of [0.16,0.5,0.84]){ const q=kartAt(C,f*C.L), c=Math.cos(q.yaw), sn=Math.sin(q.yaw); for(const sd of [-3.2,0,3.2]){ const x=q.x-sn*sd, z=q.z+c*sd; const m=new THREE.Mesh(M.boxG,M.box); m.position.set(x,T0(x,z)+1.2,z); kartAdd(m); KART.boxes.push({x,z,m,t:0}); } }
  KART.puddles=[0.4,0.62,0.92].map((f,k)=>{ const q=kartAt(C,f*C.L), c=Math.cos(q.yaw), sn=Math.sin(q.yaw), sd=(k-1)*2.5; const x=q.x-sn*sd, z=q.z+c*sd; const m=new THREE.Mesh(M.pudG,M.pud); m.rotation.x=-Math.PI/2; m.position.set(x,T0(x,z)+0.1,z); kartAdd(m); return {x,z}; });
  KART.beam=kartAdd(new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.7,45,12,1,true),M.beam)); }
function kartClearProps(){ for(const o of KART.ents) scene.remove(o); KART.ents=[]; for(const B of KART.bots){ scene.remove(B.g); scene.remove(B.R.root); } KART.bots=[]; for(const b of KART.balls) scene.remove(b.m); KART.balls=[]; KART.gates=[]; KART.pads=[]; KART.boxes=[]; KART.puddles=[]; KART.beam=null; }

/* ---- start: alone (with bots) or as host of the room, or joining a friend's race ---- */
function kartGridPos(slot){ const C=KART.C, row=Math.floor(slot/2), q=kartAt(C,10+row*7), c=Math.cos(q.yaw), sn=Math.sin(q.yaw), sd=slot%2?2.6:-2.6; return {x:q.x-sn*sd,z:q.z+c*sd,yaw:q.yaw}; }
function kartFreeBuggy(){ if(P.buggy&&!P.buggy.type) return P.buggy; let best=null, bd=1e18; for(const b of buggies){ if(b.type||b.remoteBy) continue; const d=Math.hypot(b.x-P.x,b.z-P.z); if(d<bd){ bd=d; best=b; } } return best; }
function kartCanStart(){ return ['walk','drive'].includes(S.mode)&&!S.interior; }
function kartBegin(ids,laps,crash,nb,go,rid,slot){ kartClearProps(); const b=kartFreeBuggy(); if(!b){ toast('Karts','No queda ningún buggy libre'); return false; }
  if(S.mode==='drive'&&P.buggy&&P.buggy!==b) exitBuggy();
  Object.assign(KART,{on:true,C:kartBuild(ids),ids,laps,crash,nb,go,rid,lock:true,lap:0,cp:1,idx:0,s:0,offT:0,t0:0,lapT0:0,bestLap:0,item:0,boost:0,spin:0,done:false,fin:0,inPud:false});
  kartProps(); const g=kartGridPos(slot); b.x=g.x; b.z=g.z; b.yaw=g.yaw; b.speed=0; placeBuggyMesh(b); P.x=b.x; P.z=b.z; P.y=b.y; if(P.buggy!==b){ P.x=b.x; P.z=b.z; enterBuggy(b); } camS.yaw=g.yaw; S.snap=true;
  for(let k=0;k<nb;k++){ const [n,sk]=KART_BOTS[k]; const B={n,x:0,z:0,y:0,yaw:0,s:0,lane:(k%2?2.6:-2.6),lap:0,v:0,vmax:10.9+k*0.35+Math.random()*0.4,spin:0,boost:0,fin:0,done:false,g:makeBuggy(),R:buildRig(SKINS[sk%SKINS.length]),padCd:0,inPud:false};
    const gp=kartGridPos(slot+1+k); B.s=10+Math.floor((slot+1+k)/2)*7; B.x=gp.x; B.z=gp.z; B.yaw=gp.yaw; scene.add(B.g); scene.add(B.R.root); placeBuggyMesh(B); KART.bots.push(B); }
  if(MUS.st!=='off'&&MUS.st!=='arcade'){ KART.musPrev=MUS.st; musSet('arcade'); }
  $('kartHud').hidden=false; $('kartLights').hidden=false; kartSheetClose(); closeModal();
  tip('Sigue las puertas: la siguiente tiene una columna amarilla. Turbos en las flechas amarillas; las cajas «?» dan bolas de golf para soltar con Acción',6500); return true; }
function kartNewRace(){ if(!kartCanStart()){ toast('Karts','Sal antes del golpe o de la casa'); return; }
  const ids=kartPickHoles(), go=Date.now()+(MP.code?9000:4500), rid=(MP.id||'solo')+':'+go; const friends=MP.code&&MP.peers.size>0;
  if(!kartBegin(ids,KART.laps,KART.crash,friends?0:KART.nb,go,rid,0)) return;
  if(friends){ mpSend({t:'ktgo',rid,go,ids,l:KART.laps,x:KART.crash?1:0}); mpFeed('Has invitado a la sala a la carrera','sys'); } }
function kartSlotFor(id,host){ const all=[...MP.peers.keys(),MP.id].filter(i=>i!==host).sort(); return 1+Math.max(0,all.indexOf(id)); }
function kartNetIn(p,o){
  if(o.t==='ktgo'){ if(!Array.isArray(o.ids)||!o.ids.every(i=>W.HOLES[i|0])||!Number.isFinite(o.go)||typeof o.rid!=='string') return; const go=o.go+(p.off||0); if(go<Date.now()+800||KART.on) return;
    const n=esc(p.n||'Un amigo'); mpFeed('<b>'+n+'</b> empieza una carrera de karts','ev',true);
    mpPrompt(n+' empieza una carrera de karts de '+(o.l|0)+(o.l==1?' vuelta':' vueltas')+(o.x?' con choques':' sin choques')+'. ¿Te apuntas?','Me apunto',()=>{ if(Date.now()>go-300){ toast('Karts','Ya ha salido'); return; } if(!kartCanStart()){ toast('Karts','Sal antes del golpe o de la casa'); return; }
      kartBegin(o.ids.map(i=>i|0),clamp(o.l|0,1,5),!!o.x,0,go,o.rid,kartSlotFor(MP.id,p.id)); },Math.max(1000,go-Date.now()-300)); }
  else if(o.t==='ktb'){ if(KART.on&&o.rid===KART.rid&&Array.isArray(o.p)&&o.p.every(Number.isFinite)) kartDropBall(o.p[0],o.p[1],false); } }
function kartEnd(why){ if(!KART.on) return; KART.on=false; kartClearProps(); $('kartHud').hidden=true; $('kartLights').hidden=true; kartSheetClose(); if(KART.musPrev){ musSet(KART.musPrev); KART.musPrev=null; } if(why) tip(why,3200); }

/* ---- items, pads, puddles ---- */
function kartDropBall(x,z,send){ const m=new THREE.Mesh(kartMats().ballG,kartMats().ball); m.position.set(x,terrainAt(x,z)+0.4,z); scene.add(m); KART.balls.push({x,z,m,t:performance.now()});
  if(send&&MP.code) mpSend({t:'ktb',rid:KART.rid,p:[r2(x),r2(z)]}); }
function kartUseItem(){ if(!KART.on||!KART.item||!P.buggy) return; const b=P.buggy; KART.item--; kartDropBall(b.x-Math.cos(b.yaw)*2.8,b.z-Math.sin(b.yaw)*2.8,true); blip('jump'); }
// what happens to a kart (ours or a bot) where it is now: k = {x,z,…}, spin(sec) and boost(sec) callbacks
function kartHazards(k,hit){ for(let i=KART.balls.length-1;i>=0;i--){ const B=KART.balls[i]; if(Math.hypot(k.x-B.x,k.z-B.z)<1.4){ scene.remove(B.m); KART.balls.splice(i,1); hit('ball'); } }
  let inP=false; for(const q of KART.puddles) if(Math.hypot(k.x-q.x,k.z-q.z)<3) inP=true; if(inP&&!k.inPud) hit('puddle'); k.inPud=inP;
  if(k.padCd>0) k.padCd-=1/30; else for(const q of KART.pads) if(Math.hypot(k.x-q.x,k.z-q.z)<3){ hit('pad'); k.padCd=1.2; } }
function kartMax(){ return KART.boost>0?18:12.5; }

/* ---- each frame ---- */
function kartProg(lap,s){ return lap*KART.C.L+s; }
function kartStep(dt){ if(!KART.on) return; const C=KART.C, now=Date.now();
  KART.lock=now<KART.go; if(!KART.t0&&!KART.lock){ KART.t0=now; KART.lapT0=now; }
  // lights: three reds one per second, then green
  const L=$('kartLights'); if(!L.hidden){ const left=(KART.go-now)/1000; const n=left>3?0:left>2?1:left>1?2:left>0?3:4; const ls=L.children;
    for(let k=0;k<3;k++){ ls[k].className=n===4?'g':k<n?'r':''; } $('kartGo').textContent=n===4?'¡YA!':left>3?'Prepárate':''; if(left<-1.6) L.hidden=true; }
  const b=P.buggy;
  if(!KART.done&&(S.mode!=='drive'||!b)){ kartEnd('Has abandonado la carrera'); return; }
  if(b&&S.mode==='drive'){
    if(KART.boost>0){ KART.boost-=dt; b.speed=Math.min(18,b.speed+14*dt); }
    if(KART.spin>0){ KART.spin-=dt; b.yaw+=KART.spinD*7.5*dt*Math.min(1,KART.spin*1.5); b.speed*=Math.exp(-2.4*dt); }
    kartHazards({x:b.x,z:b.z,get inPud(){ return KART.inPud; },set inPud(v){ KART.inPud=v; },get padCd(){ return KART.padCd; },set padCd(v){ KART.padCd=v; }},w=>{
      if(w==='ball'){ KART.spin=1.1; KART.spinD=Math.random()<0.5?-1:1; tip('¡Derrape! Has pisado una bola de golf',1800); }
      else if(w==='puddle'){ KART.spin=Math.max(KART.spin,0.5); KART.spinD=Math.random()<0.5?-1:1; b.speed*=0.75; }
      else if(w==='pad'&&!KART.lock){ KART.boost=2.2; blip('gold'); } });
    for(const B of KART.boxes){ if(B.t>0){ B.t-=dt; B.m.visible=B.t<=0; continue; } if(Math.hypot(b.x-B.x,b.z-B.z)<2.2){ B.t=6; B.m.visible=false; if(!KART.item){ KART.item=1+(Math.random()*3|0); tip('Bolas de golf: '+KART.item+'. Acción para soltar una detrás de ti',2600); } } }
    // gates in order, laps
    KART.idx=kartProj(C,b.x,b.z,KART.idx); KART.s=KART.idx*C.st; { const q=C.pts[KART.idx]; KART.offT=Math.hypot(b.x-q[0],b.z-q[1]); } if(KART.cp===0&&KART.s<C.L*0.4) KART.s=C.L;
    const G=KART.gates[KART.cp]; if(!KART.done&&!KART.lock&&Math.hypot(b.x-G.x,b.z-G.z)<16){
      if(KART.cp===0){ const lt=now-KART.lapT0; KART.lapT0=now; if(!KART.bestLap||lt<KART.bestLap) KART.bestLap=lt; KART.lap++; KART.s=0;
        if(KART.lap>=KART.laps){ kartFinish(now); } else toast('Vuelta '+(KART.lap+1)+' de '+KART.laps,'Última: '+kartFmt(lt)); }
      KART.cp=(KART.cp+1)%KART.gates.length; }
    // crashes with bots and friends in the race
    if(KART.crash&&!KART.lock){ const others=KART.bots.map(B=>[B.x,B.z]); for(const p of MP.peers.values()){ const s=p.out; if(s&&s.m==='drive'&&s.kr===KART.rid) others.push([s.x,s.z]); }
      for(const [x,z] of others){ const dx=b.x-x, dz=b.z-z, d=Math.hypot(dx,dz); if(d<2.1&&d>0.01){ b.x+=dx/d*(2.1-d); b.z+=dz/d*(2.1-d); b.speed*=0.86; } } } }
  for(const g of KART.gates) g.b.material=g.start?kartMats().start:kartMats().ban; const ng=KART.gates[KART.cp]; if(ng&&!KART.done){ if(!ng.start) ng.b.material=kartMats().next; KART.beam.visible=true; KART.beam.position.set(ng.x,terrainAt(ng.x,ng.z)+22.5,ng.z); } else if(KART.beam) KART.beam.visible=false;
  for(const B of KART.boxes) B.m.rotation.y+=dt*1.6;
  kartBots(dt,now);
  for(let i=KART.balls.length-1;i>=0;i--) if(performance.now()-KART.balls[i].t>90000){ scene.remove(KART.balls[i].m); KART.balls.splice(i,1); }
  KART.hudT+=dt; if(KART.hudT>0.12){ KART.hudT=0; kartHud(now); } }
function kartBots(dt,now){ const C=KART.C, me=kartProg(KART.lap,KART.s);
  for(const B of KART.bots){ if(KART.lock){ placeBuggyMesh(B); kartBotRig(B); continue; }
    if(B.done){ B.v*=Math.exp(-1.5*dt); }
    else { let tv=B.vmax; const d=kartProg(B.lap,B.s)-me; if(!KART.done){ if(d>70) tv*=0.9; else if(d<-70) tv*=1.07; } if(B.boost>0){ B.boost-=dt; tv=17; } if(B.spin>0){ B.spin-=dt; tv=2; }
      B.v+=(tv-B.v)*(1-Math.exp(-dt*(tv>B.v?0.9:2.5))); }
    B.s+=B.v*dt; if(B.s>=C.L){ B.s-=C.L; B.lap++; if(B.lap>=KART.laps&&!B.done){ B.done=true; B.fin=now-KART.t0; } }
    if(Math.random()<dt*0.25) B.laneT=(Math.random()-0.5)*5; B.lane+=((B.laneT||B.lane)-B.lane)*(1-Math.exp(-dt*0.8));
    const q=kartAt(C,B.s), c=Math.cos(q.yaw), sn=Math.sin(q.yaw); B.x=q.x-sn*B.lane; B.z=q.z+c*B.lane; B.yaw=q.yaw+(B.spin>0?Math.sin(B.spin*14)*0.8:0);
    kartHazards(B,w=>{ if(w==='ball') B.spin=1.1; else if(w==='puddle') B.spin=Math.max(B.spin,0.45); else if(w==='pad') B.boost=2; });
    placeBuggyMesh(B); kartBotRig(B); } }
function kartBotRig(B){ const R=B.R; poseRig(R,'drive',T,0); const sp=seatPos(B); R.root.position.set(sp[0],sp[1],sp[2]); R.root.rotation.set(0,-B.yaw,0); }
function kartFinish(now){ KART.done=true; KART.fin=now-KART.t0; const rk=kartRank(), pos=rk.findIndex(r=>r.me)+1;
  const rec=+(store.get(KART.C.key+'_'+KART.laps)||0), rl=+(store.get(KART.C.key+'_lap')||0); let msg='';
  if(!rec||KART.fin<rec){ store.set(KART.C.key+'_'+KART.laps,String(KART.fin)); msg=' · ¡récord!'; } if(!rl||KART.bestLap<rl) store.set(KART.C.key+'_lap',String(KART.bestLap));
  toast(pos===1?'¡Has ganado!':'Has llegado '+pos+'.º',kartFmt(KART.fin)+msg); blip('gold'); kartResults(); }
// everyone in the race: us, the bots and the friends whose state carries this race id
function kartRank(){ const C=KART.C, now=Date.now(), out=[{n:'Tú',me:true,prog:kartProg(KART.lap,KART.s),fin:KART.fin,best:KART.bestLap}];
  for(const B of KART.bots) out.push({n:B.n,prog:kartProg(B.lap,B.s),fin:B.fin,bot:true});
  for(const p of MP.peers.values()){ const s=p.out; if(s&&s.kr===KART.rid&&s.kp) out.push({n:p.n||'Amigo',prog:kartProg(s.kp[0],s.kp[1]),fin:s.kp[2]}); }
  out.sort((a,b)=>(a.fin&&b.fin)?a.fin-b.fin:a.fin?-1:b.fin?1:b.prog-a.prog); return out; }
function kartHud(now){ const rk=kartRank(), pos=rk.findIndex(r=>r.me)+1, el=KART.t0?(KART.done?KART.fin:now-KART.t0):0;
  $('kartLap').textContent=KART.done?'Meta':'Vuelta '+Math.min(KART.laps,KART.lap+1)+' de '+KART.laps; $('kartPos').textContent=pos+'.º de '+rk.length;
  $('kartTime').textContent=kartFmt(el)+(KART.bestLap?' · mejor vuelta '+kartFmt(KART.bestLap):''); $('kartItem').textContent=KART.boost>0?'Turbo':KART.item?'Bolas de golf: '+KART.item+' (Acción)':KART.spin>0?'Derrapando…':'Sin objeto';
  if(KART.done&&!$('kartSheet').hidden&&KART.resOpen) kartResults(); }

/* ---- the sheet: set up a race, and the results ---- */
function kartSheetClose(){ $('kartSheet').hidden=true; KART.resOpen=false; }
function kartSeg(id,vals,cur,lab){ return '<div class="qual">'+lab+' '+vals.map(v=>'<button data-k="'+id+'" data-v="'+v[0]+'" class="'+(String(cur)===String(v[0])?'on':'')+'">'+v[1]+'</button>').join('')+'</div>'; }
function kartSheet(){ if(KART.on&&KART.done){ kartResults(); return; } closeModal(); const ids=kartPickHoles(), C=kartBuild(ids), friends=MP.code&&MP.peers.size>0;
  const rec=+(store.get(C.key+'_'+KART.laps)||0), rl=+(store.get(C.key+'_lap')||0);
  $('kartBody').innerHTML='<h2>Carrera de karts</h2><p>En buggy por el circuito del campo: <b>hoyos '+C.names.join(', ')+'</b> y vuelta al tee del '+C.names[0]+' ('+fmt(C.L)+' m por vuelta). Pasa por todas las puertas en orden; la siguiente tiene una <b>columna amarilla</b>.</p>'
    +kartSeg('laps',[[1,'1'],[2,'2'],[3,'3']],KART.laps,'Vueltas')+(friends?'<p class="note">Hay amigos en la sala: les llega la invitación y salís juntos, sin rivales de la máquina.</p>':kartSeg('nb',[[0,'Ninguno'],[1,'1'],[2,'2'],[3,'3']],KART.nb,'Rivales de la máquina'))
    +kartSeg('crash',[[1,'Sí'],[0,'No']],KART.crash?1:0,'Choques entre karts')
    +'<p class="note">Récord del circuito a '+KART.laps+(KART.laps==1?' vuelta':' vueltas')+': <b>'+kartFmt(rec)+'</b> · mejor vuelta: <b>'+kartFmt(rl)+'</b></p>'
    +'<ul class="note"><li><b>Semáforo:</b> tres luces rojas, una por segundo; con la verde, ¡a correr!</li><li><b>Flechas amarillas</b> en el suelo: turbo de 2 segundos.</li><li><b>Cajas «?»:</b> te dan bolas de golf; con Acción sueltas una detrás y quien la pisa derrapa.</li><li><b>Charcos azules:</b> frenan y hacen derrapar.</li></ul>'
    +'<div class="row"><button class="btn primary" id="kartGoBtn">A la parrilla</button><button class="btn" id="kartClose">Cerrar</button></div>';
  $('kartBody').querySelectorAll('button[data-k]').forEach(bt=>bt.onclick=()=>{ const k=bt.dataset.k, v=+bt.dataset.v; if(k==='laps') KART.laps=v; else if(k==='nb') KART.nb=v; else KART.crash=!!v; kartSheet(); });
  $('kartGoBtn').onclick=kartNewRace; $('kartClose').onclick=kartSheetClose; $('kartSheet').hidden=false; }
function kartResults(){ const rk=kartRank(); KART.resOpen=true;
  $('kartBody').innerHTML='<h2>Clasificación</h2><div class="tablewrap"><table class="card mp"><thead><tr><th>Puesto</th><th class="nm">Piloto</th><th>Tiempo</th></tr></thead><tbody>'
    +rk.map((r,i)=>'<tr'+(r.me?' style="font-weight:800"':'')+'><td>'+(i+1)+'.º</td><td class="nm">'+esc(r.n)+(r.bot?' <small>máquina</small>':'')+'</td><td>'+(r.fin?kartFmt(r.fin):'en carrera')+'</td></tr>').join('')+'</tbody></table></div>'
    +'<p class="note">Tu mejor vuelta: <b>'+kartFmt(KART.bestLap)+'</b> · récord del circuito: <b>'+kartFmt(+(store.get(KART.C.key+'_'+KART.laps)||0))+'</b></p>'
    +'<div class="row"><button class="btn primary" id="kartAgain">Otra carrera</button><button class="btn" id="kartClose">Cerrar</button></div>';
  $('kartAgain').onclick=()=>{ kartEnd(); kartNewRace(); }; $('kartClose').onclick=()=>kartEnd(); $('kartSheet').hidden=false; }

/* ---- the circuit on the maps ---- */
function kartDrawMap(g,m2c,s,big){ if(!KART.on) return; const C=KART.C; g.save(); g.strokeStyle='#d6442a'; g.lineWidth=(big?3:2)*s; g.setLineDash([6*s,4*s]); g.beginPath();
  C.pts.forEach((p,i)=>{ if(i%3) return; const [x,y]=m2c(p[0],p[1]); i?g.lineTo(x,y):g.moveTo(x,y); }); g.closePath(); g.stroke(); g.setLineDash([]);
  const ng=KART.gates[KART.cp]; if(ng){ const [x,y]=m2c(ng.x,ng.z); g.fillStyle='#f2c230'; g.strokeStyle='#16231b'; g.lineWidth=1.2*s; g.beginPath(); g.arc(x,y,(big?5:3.4)*s,0,7); g.fill(); g.stroke(); }
  for(const B of KART.bots){ const [x,y]=m2c(B.x,B.z); g.fillStyle='#16231b'; g.fillRect(x-2*s,y-2*s,4*s,4*s); } g.restore(); }
function kartLegend(){ return KART.on?'<div><i style="background:repeating-linear-gradient(90deg,#d6442a 0 6px,transparent 6px 10px);height:4px;border:0"></i>Circuito de karts</div><div><i class="dot" style="background:#f2c230;border:1px solid #16231b"></i>Siguiente puerta</div>'+(KART.bots.length?'<div><i style="background:#16231b;width:8px;height:8px;border:0"></i>Rivales de la máquina</div>':''):''; }
