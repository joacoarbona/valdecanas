/* ================= el perro (J4a, solo Valdecañas): te sigue, marca tu bola, te la trae del hoyo y del agua, y juega a la pelota ================= */
// Nombres dg*, estado DG. Diseño propio (un perro mediano de orejas caídas), cinco capas a elegir y nombre propio. En una sala, los demás lo ven.
const DG_COATS=[{id:'canela',n:'Canela',c:'#c98a4b',b:'#f1dcc0',e:'#8a5a2e'},{id:'negro',n:'Negro con pecho blanco',c:'#2d2725',b:'#f3ede4',e:'#1c1816'},{id:'manchas',n:'Blanco con manchas',c:'#f3eee5',b:'#ffffff',e:'#3b302b',sp:'#3b302b'},{id:'dorado',n:'Dorado',c:'#e2b25e',b:'#f6e2b8',e:'#b9853c'},{id:'gris',n:'Gris',c:'#8f9399',b:'#e4e6ea',e:'#5d6167'}];
const DG_TRICKS={sienta:{n:'Siéntate',d:2.4},pata:{n:'Dame la pata',d:3},vuelta:{n:'Da una vuelta',d:1.7},rueda:{n:'Rueda por el suelo',d:2.6},salta:{n:'Salta',d:1.8},ladra:{n:'Habla',d:1.3}};
var DG={on:true,name:'Trufa',coat:0,n:0,gb:0,m:null,x:0,y:0,z:0,yaw:0,v:0,jy:0,vy:0,swim:false,job:null,sit:0,ph:0,wagA:0,happy:0,bark:0,away:true,awayT:0,idle:0,stuckT:0,stuckP:null,pm:'',tb:null,tbm:null,drop:null,dropT:0,hearts:[],btn:'',said:0};
function dgOK(){ return !!(WP.kids&&WP.kids.dog); }
function dgLoad(){ try{ const o=JSON.parse(store.get('vg_dog')||'{}')||{}; if(o.on===0) DG.on=false; if(typeof o.nm==='string'&&o.nm.trim()) DG.name=o.nm.replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,16); DG.coat=clamp(o.c|0,0,DG_COATS.length-1); DG.n=+o.n||0; DG.gb=+o.gb||0; }catch(e){} }
function dgSave(){ store.set('vg_dog',JSON.stringify({on:DG.on?1:0,nm:DG.name,c:DG.coat,n:DG.n,gb:DG.gb})); }
// the model: body, head with floppy ears and a jaw, collar, a tail that wags and four legs that swing from the hip (it faces +x, like the player)
function dgMake(ci){ const C=DG_COATS[ci]||DG_COATS[0], M=c=>new THREE.MeshLambertMaterial({color:Cc(c)}), root=new THREE.Group(), body=new THREE.Group(); root.add(body);
  const sph=(g,c,x,y,z,sx,sy,sz)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(0.5,14,10),M(c)); m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.castShadow=true; g.add(m); return m; };
  sph(body,C.c,0,0.44,0,0.62,0.3,0.28); sph(body,C.c,0.17,0.46,0,0.3,0.31,0.27); sph(body,C.c,-0.2,0.46,0,0.3,0.28,0.27); sph(body,C.b,0.05,0.37,0,0.46,0.16,0.22); sph(body,C.b,0.24,0.47,0,0.14,0.2,0.18);
  if(C.sp){ sph(body,C.sp,-0.08,0.55,0.08,0.18,0.1,0.14); sph(body,C.sp,0.1,0.52,-0.1,0.14,0.1,0.12); sph(body,C.sp,-0.24,0.5,-0.06,0.12,0.12,0.14); }
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.09,0.2,10),M(C.c)); neck.position.set(0.28,0.57,0); neck.rotation.z=-0.75; body.add(neck);
  const collar=new THREE.Mesh(new THREE.TorusGeometry(0.083,0.018,6,16),M('#d63a2f')); collar.position.set(0.28,0.57,0); collar.rotation.set(-Math.PI/2,0,-0.75,'ZYX'); body.add(collar);
  const tag=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.008,10),M('#e8c04a')); tag.position.set(0.33,0.49,0); tag.rotation.z=Math.PI/2+0.4; body.add(tag);
  const head=new THREE.Group(); head.position.set(0.34,0.64,0); body.add(head);
  sph(head,C.c,0.06,0.06,0,0.26,0.24,0.24); sph(head,C.b,0.17,0.0,0,0.17,0.1,0.12); const nose=sph(head,'#1b1716',0.255,0.03,0,0.056,0.046,0.06); nose.castShadow=false;
  for(const s of [-1,1]){ const e=sph(head,'#1b1716',0.145,0.085,s*0.058,0.044,0.05,0.04); e.castShadow=false; const hl=sph(head,'#ffffff',0.162,0.097,s*0.06,0.014,0.014,0.014); hl.castShadow=false; }
  const jaw=new THREE.Group(); jaw.position.set(0.11,-0.035,0); head.add(jaw); const jm=new THREE.Mesh(new THREE.BoxGeometry(0.13,0.028,0.075),M(C.b)); jm.position.set(0.06,-0.012,0); jaw.add(jm);
  const tongue=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.01,0.05),M('#e9707e')); tongue.position.set(0.1,-0.03,0); tongue.visible=false; jaw.add(tongue);
  const ears=[]; for(const s of [-1,1]){ const p=new THREE.Group(); p.position.set(0.02,0.13,s*0.09); head.add(p); const ear=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.17,0.03),M(C.e)); ear.position.set(0,-0.075,s*0.012); ear.castShadow=true; p.add(ear); p.rotation.x=s*0.32; ears.push(p); }
  const ball=new THREE.Mesh(new THREE.SphereGeometry(0.042,12,8),M('#d8f03c')); ball.position.set(0.2,-0.035,0); ball.visible=false; head.add(ball);
  const tb=new THREE.Group(); tb.position.set(-0.31,0.52,0); tb.rotation.z=0.7; body.add(tb); const tw=new THREE.Group(); tb.add(tw); const tail=new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.034,0.26,8),M(C.c)); tail.position.y=0.12; tail.castShadow=true; tw.add(tail);
  const tip=sph(tw,C.sp?'#ffffff':C.b,0,0.25,0,0.04,0.06,0.04); tip.castShadow=false;
  const legs=[]; for(const [fx,fz] of [[1,1],[1,-1],[-1,1],[-1,-1]]){ const g=new THREE.Group(); g.position.set(fx*0.2,0.4,fz*0.1); body.add(g); const l=new THREE.Mesh(new THREE.CylinderGeometry(0.048,0.04,0.34,8),M(C.c)); l.position.y=-0.17; l.castShadow=true; g.add(l);
    const paw=sph(g,C.b,0.02,-0.36,0,0.1,0.06,0.09); legs.push({g,front:fx>0,left:fz>0}); }
  scene.add(root); return {root,body,head,jaw,tongue,ears,tb,tw,legs,ball,ci}; }
// the pose from a few numbers: speed (gait), sitting, swimming, a jump, the tricks
function dgPose(M,A,dt){ A.ph=(A.ph||0)+dt*(A.swim?9:Math.min(15,2.6+A.v*1.25)); const ph=A.ph, run=A.v>5.2, amp=A.swim?0.75:Math.min(0.85,A.v*0.13), sit=A.sit||0, lie=A.lie||0;
  M.body.position.y=-0.13*sit-0.24*lie+(A.swim?-0.05:0)+(run&&!A.swim?Math.abs(Math.sin(ph))*0.05:0); M.body.rotation.z=0.5*sit-0.06*lie+(run&&!A.swim?Math.sin(ph)*0.07:0); M.body.rotation.x=A.roll||0;
  for(const L of M.legs){ let a; if(A.swim) a=Math.sin(ph+(L.left?0:Math.PI)+(L.front?0:1.6))*amp; else if(run) a=Math.sin(ph+(L.front?0:Math.PI*0.55)+(L.left?0:0.25))*amp; else a=Math.sin(ph+((L.front===L.left)?0:Math.PI))*amp;
    if(!L.front) a=a*(1-sit)-1.35*sit; else a=a*(1-sit)-0.5*sit; if(lie>0) a=a*(1-lie)+(L.front?-1.35:1.35)*lie; if(A.paw&&L.front&&!L.left) a=0.95+Math.sin(A.t*9)*0.25; L.g.rotation.z=a; }
  const wag=A.happy>0?1:0.45; A.wt=(A.wt||0)+dt*(A.happy>0?16:9); M.tw.rotation.x=Math.sin(A.wt)*0.55*wag; M.tb.rotation.z=0.7+(A.swim?0.6:0)-0.25*sit;
  const lookUp=A.bark>0?-0.35:0; M.head.rotation.z=(A.swim?-0.35:0)+lookUp+(A.sniff?0.5:0)-0.3*sit; M.head.rotation.y=A.look||0;
  M.jaw.rotation.z=A.bark>0?-0.35*Math.abs(Math.sin(A.bark*22)):(A.v>4||A.pant?-0.18:0); M.tongue.visible=(A.v>4||A.pant)&&!A.carry&&A.bark<=0; M.ball.visible=!!A.carry; if(A.carry==='golf') M.ball.material.color.set('#ffffff'); else if(A.carry) M.ball.material.color.set('#d8f03c');
  for(const e of M.ears){ const s=e.position.z>0?1:-1; e.rotation.x=s*(0.32+(run?Math.sin(ph*2)*0.25+0.35:0)+(A.swim?0.5:0)); e.rotation.z=run?0.4:0; } }
function dgBuild(){ if(DG.m){ scene.remove(DG.m.root); } DG.m=dgMake(DG.coat); DG.A={v:0}; DG.m.root.visible=false;
  DG.tbm=new THREE.Mesh(new THREE.SphereGeometry(0.045,12,8),new THREE.MeshLambertMaterial({color:Cc('#d8f03c')})); DG.tbm.castShadow=true; DG.tbm.visible=false; scene.add(DG.tbm);
  DG.dropm=new THREE.Mesh(new THREE.SphereGeometry(0.06,12,8),new THREE.MeshLambertMaterial({color:Cc('#ffffff'),emissive:Cc('#333333')})); DG.dropm.castShadow=true; DG.dropm.visible=false; scene.add(DG.dropm);
  if(!DG.htex) DG.htex=canvasTex(64,64,(c,w,h)=>{ c.fillStyle='#ff5c8a'; c.beginPath(); c.moveTo(32,56); c.bezierCurveTo(4,36,6,10,22,10); c.bezierCurveTo(29,10,32,16,32,20); c.bezierCurveTo(32,16,35,10,42,10); c.bezierCurveTo(58,10,60,36,32,56); c.fill(); }); }
function dgSnd(n,vol){ if(!AC||!SOUND) return; const d=Math.hypot(DG.x-camera.position.x,DG.z-camera.position.z), k=(vol||1)*clamp(1-d/90,0.08,1); const t0=AC.currentTime;
  for(let i=0;i<n;i++){ const t=t0+i*0.2+Math.random()*0.03, o=AC.createOscillator(), g=AC.createGain(), f=AC.createBiquadFilter(); o.type='sawtooth'; const f0=430+Math.random()*80; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f0*0.62,t+0.11);
    f.type='bandpass'; f.frequency.value=1100; f.Q.value=1.1; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.32*k,t+0.012); g.gain.exponentialRampToValueAtTime(0.001,t+0.14); o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t+0.16);
    const nz=AC.createBufferSource(); nz.buffer=noiseBuf; const ng=AC.createGain(), nf=AC.createBiquadFilter(); nf.type='bandpass'; nf.frequency.value=1800; ng.gain.setValueAtTime(0.12*k,t); ng.gain.exponentialRampToValueAtTime(0.001,t+0.07); nz.connect(nf); nf.connect(ng); ng.connect(master); nz.start(t); nz.stop(t+0.08); } }
function dgBark(n){ DG.bark=0.18*n+0.05; ensureAudio(); dgSnd(n||1); }
// a free, dry spot near (x, z): not in a building, a tree, a pool or deep water
function dgFree(x,z){ if(bldAt(x,z,0.4)||W.poolAt(x,z)) return false; const g=terrainAt(x,z); if(W.waterLevel(x,z)>g+0.2) return false; const tr=treeGrid.get(Math.floor(x/20)+','+Math.floor(z/20)); if(tr) for(const t of tr) if(Math.hypot(x-t.x,z-t.z)<t.tr+0.4) return false; return true; }
function dgPlaceNear(x,z,yaw,back){ for(const d of [back||8,5,3,1.5]) for(const da of [0,0.6,-0.6,1.3,-1.3,2.2,-2.2,Math.PI]){ const a=yaw+Math.PI+da, px=x+Math.cos(a)*d, pz=z+Math.sin(a)*d; if(dgFree(px,pz)){ DG.x=px; DG.z=pz; DG.y=groundAt(px,pz,terrainAt(px,pz)+2); DG.yaw=Math.atan2(z-pz,x-px); return true; } }
  DG.x=x; DG.z=z; DG.y=groundAt(x,z,P.y+1); return false; }
// one step towards (tx, tz): turns, runs, swims, stops at buildings and trees; returns the distance left
function dgMove(tx,tz,vmax,dt,stop){ const dx=tx-DG.x, dz=tz-DG.z, d=Math.hypot(dx,dz); stop=stop||0.25;
  let vt=d<=stop?0:Math.min(vmax,Math.max(0.9,(d-stop)*2.4)); if(DG.swim) vt=Math.min(vt,2.5); DG.v+=clamp(vt-DG.v,-14*dt,9*dt);
  if(d>0.05&&vt>0){ const want=Math.atan2(dz,dx); let dy=want-DG.yaw; while(dy>Math.PI) dy-=2*Math.PI; while(dy<-Math.PI) dy+=2*Math.PI; const tr=(DG.v<2?9:6)*dt; DG.yaw+=clamp(dy,-tr,tr); }
  if(DG.v>0.01){ let nx=DG.x+Math.cos(DG.yaw)*DG.v*dt, nz=DG.z+Math.sin(DG.yaw)*DG.v*dt; const c=collide(nx,nz,DG.y,0.26,DG.swim); nx=c[0]; nz=c[1]; DG.x=nx; DG.z=nz; }
  dgGround(dt);
  // stuck (a wall, a fence of trees): try again from a free spot nearer the goal
  if(d>2.5&&vt>1){ DG.stuckT+=dt; if(DG.stuckT>1.6){ const p=DG.stuckP; if(p&&Math.hypot(DG.x-p[0],DG.z-p[1])<0.7) dgPlaceNear(tx,tz,Math.atan2(DG.z-tz,DG.x-tx)+Math.PI,Math.min(6,d*0.5)); DG.stuckT=0; DG.stuckP=[DG.x,DG.z]; } } else { DG.stuckT=0; DG.stuckP=[DG.x,DG.z]; }
  return d; }
function dgGround(dt){ const g=groundAt(DG.x,DG.z,DG.y+0.55), pl=W.poolAt(DG.x,DG.z), wl=pl?pl.level:W.waterLevel(DG.x,DG.z);
  if(wl>g+0.34){ DG.swim=true; DG.y+=clamp(wl-0.33-DG.y,-3*dt,3*dt); DG.jy=0; DG.vy=0; return; } DG.swim=false;
  if(DG.jy>0||DG.vy>0){ DG.vy-=13*dt; DG.jy+=DG.vy*dt; if(DG.jy<=0){ DG.jy=0; DG.vy=0; } }
  DG.y+=clamp(g-DG.y,-9*dt,12*dt); if(Math.abs(g-DG.y)>1.2) DG.y=g; }
// where the dog waits while you aim (behind you and to the side, off the line of the shot) and, in the minigolf, next to the lane
function dgSpot(){ if(S.mode==='mini'&&MG.ok){ const Q=mgQ(); if(Q){ const w=mgW(Q,Q.H.bb[0]-0.9,Math.min(MG.ball[1]+0.3,Q.H.bb[3]-0.5),0); return [w.x,w.z]; } }
  if(S.mode==='aim'||S.mode==='swing'){ const y=S.g.yaw; return [S.g.ball.x-Math.cos(y)*2.2+Math.cos(y-Math.PI/2)*1.8,S.g.ball.z-Math.sin(y)*2.2+Math.sin(y-Math.PI/2)*1.8]; }
  const y=P.yaw; return [P.x-Math.cos(y)*1.7+Math.cos(y+Math.PI/2)*0.9,P.z-Math.sin(y)*1.7+Math.sin(y+Math.PI/2)*0.9]; }
function dgHidden(){ const m=S.mode; return !DG.on||!rig||(!rig.root.visible&&m!=='mini')||['menu','loading','plane','fall','glide','fly','jet','ski','pas','replay','rround','view','racket','fish','ox','sled'].includes(m)||KART.on||(m==='pow'&&P.y-terrainAt(P.x,P.z)>4)||(m==='bike'&&BK.run&&BK.run.st==='run'); }
// the golf: watch the shot, run under the ball, mark it, bring it from the hole or the water
function dgGolf(){ const m=S.mode, pm=DG.pm, g=S.g; if(m===pm) return;
  if(m==='flight'&&pm!=='flight'){ if(!DG.job||['mark','chase'].includes(DG.job.k)) DG.job={k:'chase'}; dgBark(1); }
  if(m==='wait'&&pm==='flight'){ const s=g.sim; if(!s) return; if(s.done==='holed'){ const H=hole(); if(H) DG.job={k:'fetch',x:H.pin[0],z:H.pin[1],what:'golf',why:'hole',ph:0,t:0}; }
    else if(s.done==='water'){ if(Math.hypot(s.x-P.x,s.z-P.z)<160) DG.job={k:'fetch',x:s.x,z:s.z,what:'golf',why:'water',ph:0,t:0}; else dgBark(2); }
    else if(s.done==='roof'){ DG.job={k:'barkAt',x:s.x,z:s.z,t:0}; }
    else if(g.ezMove){ const e=g.ezMove; g.ezMove=null; DG.job={k:'move',x:e.from[0],z:e.from[1],tx:e.to[0],tz:e.to[1],what:'golf',ph:0,t:0}; }
    else DG.job={k:'mark',x:g.ball.x,z:g.ball.z,t:0}; }
  if((m==='aim')&&DG.job&&['mark','chase','barkAt'].includes(DG.job.k)) DG.job=null;
  if(m==='aim'&&DG.job&&DG.job.k==='move') dgFinishMove(); }
function dgFinishMove(){ const J=DG.job; if(!J||J.k!=='move') return; DG.job=null; DG.carry=null; if(Math.hypot(DG.x-J.tx,DG.z-J.tz)>3){ dgPlaceNear(J.tx,J.tz,0,1.5); } }
function dgTick(dt){ if(!dgOK()) return; if(!DG.m){ dgLoad(); dgBuild(); }
  const hide=dgHidden(); dgGolf(); DG.pm=S.mode;
  if(DG.drop){ DG.dropT-=dt; if(DG.dropT<=0){ DG.drop=null; DG.dropm.visible=false; } }
  if(hide){ if(!DG.away){ DG.away=true; DG.awayT=0; DG.job=null; DG.carry=null; } DG.awayT+=dt; DG.m.root.visible=false; DG.tbm.visible=false; dgBtn(); dgHearts(dt); return; }
  const inside=!!S.interior;
  if(DG.away){ DG.away=false; DG.job=null; DG.carry=null; DG.v=0; dgPlaceNear(P.x,P.z,P.yaw,DG.awayT>2?9:3); if(DG.awayT>3&&!inside) setTimeout(()=>{ if(!DG.away) dgBark(2); },500); }
  const A=DG.A; A.sit=A.sit||0; let sitT=0, look=0; A.lie=0; A.paw=false; A.roll=0; A.sniff=false; DG.happy=Math.max(0,DG.happy-dt); DG.bark=Math.max(0,DG.bark-dt); A.t=(A.t||0)+dt;
  const J=DG.job, pd=Math.hypot(P.x-DG.x,P.z-DG.z), fast=['drive','ride','bike'].includes(S.mode);
  if(inside){ if(!J||J.k!=='wait') DG.job={k:'wait'}; DG.v=0; sitT=1; dgGround(dt); }
  else if(J&&J.k==='wait') DG.job=null;
  if(!inside){ const J=DG.job;
    if(!J){ const sp=dgSpot(), far=pd>45; if(far&&!fast){ dgPlaceNear(P.x,P.z,P.yaw,10); }
      if(fast&&pd>55){ DG.away=true; DG.awayT=0; DG.m.root.visible=false; dgBtn(); return; }
      const d=dgMove(sp[0],sp[1],fast?15:(pd>12?11:8.5),dt,0.35); const still=Math.hypot(P.vx||0,P.vz||0)<0.3&&!fast;
      if(d<0.6&&DG.v<0.3){ DG.idle+=dt; const ly=Math.atan2(P.z-DG.z,P.x-DG.x); let dy=ly-DG.yaw; while(dy>Math.PI) dy-=2*Math.PI; while(dy<-Math.PI) dy+=2*Math.PI; DG.yaw+=clamp(dy,-3*dt,3*dt); if(still&&DG.idle>2.2) sitT=1; } else DG.idle=0; }
    else if(J.k==='chase'){ const b=S.g.ball, s=S.g.sim, bv=s?Math.hypot(s.vx,s.vz):0; dgMove(b.x,b.z,clamp(bv*0.85,11.5,24),dt,1.2); if(S.mode!=='flight') DG.job=null; }
    else if(J.k==='mark'){ const sx=J.x+0.75, sz=J.z+0.4, dd=Math.hypot(sx-DG.x,sz-DG.z); if(dd>45&&!J.jp){ J.jp=1; dgPlaceNear(sx,sz,Math.atan2(sz-P.z,sx-P.x),22); } const d=dgMove(sx,sz,dd>30?20:11,dt,0.2); if(d<0.4&&DG.v<0.3){ sitT=1; look=0; DG.happy=0.2; J.t+=dt; if(J.t>1.2&&!J.b&&Math.hypot(P.x-J.x,P.z-J.z)>25){ J.b=1; dgBark(2); } } if(Math.hypot(P.x-J.x,P.z-J.z)<3.2) DG.job=null; }
    else if(J.k==='barkAt'){ const d=dgMove(J.x,J.z,10,dt,3.5); if(d<4){ J.t+=dt; if(J.t>0.4&&!J.b){ J.b=1; dgBark(3); } if(J.t>3) DG.job=null; } }
    else if(J.k==='fetch'||J.k==='move'){ dgFetch(J,dt); }
    else if(J.k==='tennis') dgTennisDog(J,dt);
    else if(J.k==='wait4'){ J.t+=dt; const d=dgMove(P.x+Math.cos(P.yaw)*1.1,P.z+Math.sin(P.yaw)*1.1,8,dt,0.4); if(d<0.7) sitT=1; DG.happy=0.3; if(J.t>14) DG.job=null; }
    else if(J.k==='pet'){ J.t+=dt; DG.v=0; dgGround(dt); DG.happy=0.5; if(J.t<1.2&&DG.jy<=0&&(J.t%0.6)<dt*1.5){ DG.vy=3.2; DG.jy=0.001; } if(J.t>1.8) DG.job=null; }
    else if(J.k==='trick'){ dgTrickStep(J,A,dt); if(DG.job&&['sienta','pata','ladra'].includes(J.n)) sitT=1; }
  }
  // pose and place
  A.sit+=clamp(sitT-A.sit,-4*dt,3*dt); A.v=DG.v; A.swim=DG.swim; A.carry=DG.carry; A.happy=DG.happy; A.bark=DG.bark; A.look=look; A.pant=DG.v>3||DG.happy>0;
  dgPose(DG.m,A,dt); const R=DG.m.root; R.visible=true; R.position.set(DG.x,DG.y+DG.jy,DG.z); R.rotation.set(0,-DG.yaw,0);
  dgTennisBall(dt); dgHearts(dt); dgBtn();
  if(DG.job&&DG.job.k==='move'&&DG.job.ph<3) ballMesh.visible=false;
  DG.netT=(DG.netT||0)+dt; }
// fetching the golf ball (from the hole, from the water) or carrying it to the fairway (easy mode)
function dgFetch(J,dt){ const A=DG.A; J.t+=dt;
  if(J.ph===0){ if(!J.jp&&Math.hypot(J.x-DG.x,J.z-DG.z)>50){ J.jp=1; dgPlaceNear(J.x,J.z,Math.atan2(J.z-P.z,J.x-P.x),24); } const d=dgMove(J.x,J.z,13,dt,0.25); if(d<0.45||J.t>22){ J.ph=1; J.t=0; } }
  else if(J.ph===1){ DG.v=0; dgGround(dt); A.sniff=true; if(J.t>0.55){ DG.carry=J.what; J.ph=2; J.t=0; } }
  else if(J.ph===2){ const tx=J.k==='move'?J.tx:P.x+Math.cos(P.yaw)*0.9, tz=J.k==='move'?J.tz:P.z+Math.sin(P.yaw)*0.9; const d=dgMove(tx,tz,J.k==='move'?8:10,dt,J.k==='move'?0.25:0.6); if(d<(J.k==='move'?0.4:1.0)||J.t>25){ J.ph=3; J.t=0; } }
  else if(J.ph===3){ DG.v=0; dgGround(dt); A.sniff=true; if(J.t>0.4){ DG.carry=null; const hx=DG.x+Math.cos(DG.yaw)*0.45, hz=DG.z+Math.sin(DG.yaw)*0.45;
      if(J.k==='move'){ DG.job={k:'mark',x:J.tx,z:J.tz,t:0}; ballMesh.visible=true; return; }
      DG.drop=[hx,hz]; DG.dropT=3; DG.dropm.visible=true; DG.dropm.position.set(hx,groundAt(hx,hz,DG.y+1)+0.06,hz); DG.gb++; dgSave(); DG.happy=1.2; dgBark(1);
      if(!QUIET.on||DG.gb<3) toast(J.why==='water'?DG.name+' ha rescatado tu bola del agua':'¡'+DG.name+' te trae la bola!',J.why==='water'?'Ha nadado hasta ella':'La ha sacado del hoyo');
      DG.job=null; } } }
/* ---- the ball game: throw, the dog runs (it can catch it in the air), brings it back and waits for the next ---- */
function dgThrow(){ if(!dgOK()||!DG.on||DG.away||S.mode!=='walk'||S.interior) return; ensureAudio(); const y=camS.yaw, sp=12.5;
  DG.tb={x:P.x+Math.cos(y)*0.4,y:P.y+1.55,z:P.z+Math.sin(y)*0.4,vx:Math.cos(y)*sp+P.vx*0.5,vy:6.2,vz:Math.sin(y)*sp+P.vz*0.5,rest:false,t:0,held:false}; DG.job={k:'tennis',ph:0,t:0}; DG.carry=null; P.cheerT=0.35; dgBark(2); }
function dgTennisBall(dt){ const B=DG.tb; if(!B){ DG.tbm.visible=false; return; } if(B.held){ DG.tbm.visible=false; return; } B.t+=dt;
  for(let k=0;k<2;k++){ const h=dt/2; if(!B.rest){ B.vy-=9.8*h; B.x+=B.vx*h; B.y+=B.vy*h; B.z+=B.vz*h;
      const bb=bldAt(B.x,B.z,0.05); if(bb&&B.y<bb.top-0.1){ const e=nearestEdge(bb,B.x,B.z), vn=B.vx*e[3]+B.vz*e[4]; if(vn<0){ B.vx-=1.6*vn*e[3]; B.vz-=1.6*vn*e[4]; } B.x=e[1]+e[3]*0.1; B.z=e[2]+e[4]*0.1; }
      const g=groundAt(B.x,B.z,B.y+0.2), pl=W.poolAt(B.x,B.z), wl=pl?pl.level:W.waterLevel(B.x,B.z);
      if(wl>g&&B.y<wl){ B.y=wl; B.vy=0; B.vx*=Math.pow(0.4,h); B.vz*=Math.pow(0.4,h); B.water=true; if(Math.hypot(B.vx,B.vz)<0.1) B.rest=true; }
      else if(B.y<g+0.045){ B.y=g+0.045; if(B.vy<-1.2){ B.vy=-B.vy*0.5; B.vx*=0.78; B.vz*=0.78; } else { B.vy=0; const v=Math.hypot(B.vx,B.vz); if(v<0.15){ B.rest=true; B.vx=B.vz=0; } else { const f=Math.max(0,v-2.8*h)/v; B.vx*=f; B.vz*=f; } } } } }
  DG.tbm.visible=true; DG.tbm.position.set(B.x,B.y,B.z); }
function dgTennisDog(J,dt){ const B=DG.tb, A=DG.A; J.t+=dt; if(!B){ DG.job=null; return; }
  if(J.ph===0){ const gy=groundAt(B.x,B.z,B.y+0.2), hb=B.y-gy, d=dgMove(B.x,B.z,11.5,dt,0.2);
    if(!B.rest&&d<1.3&&hb>0.3&&hb<1.7&&DG.jy<=0&&!DG.swim&&B.vy<1.5){ DG.vy=Math.min(5.5,Math.sqrt(2*13*Math.max(0.1,hb-0.45))); DG.jy=0.001; }
    const mx=DG.x+Math.cos(DG.yaw)*0.5, my=DG.y+DG.jy+0.66, mz=DG.z+Math.sin(DG.yaw)*0.5, low=hb<0.35&&!B.water?Math.hypot(B.x-DG.x,B.z-DG.z)<0.75:false, fl=B.water&&Math.hypot(B.x-DG.x,B.z-DG.z)<0.8; if(low||fl||Math.hypot(B.x-mx,B.y-my,B.z-mz)<0.42){ B.held=true; DG.carry='tennis'; J.ph=1; J.t=0; if(!B.rest){ DG.happy=0.8; J.air=1; } }
    if(J.t>14){ DG.job=null; DG.tb=null; toast(DG.name+' no encuentra la pelota','Tírala otra vez'); } }
  else if(J.ph===1){ const tx=P.x+Math.cos(P.yaw)*1.0, tz=P.z+Math.sin(P.yaw)*1.0, d=dgMove(tx,tz,10,dt,0.5); if(d<0.75||J.t>20){ J.ph=2; J.t=0; } }
  else if(J.ph===2){ DG.v=0; dgGround(dt); A.sniff=true; if(J.t>0.35){ DG.carry=null; const hx=DG.x+Math.cos(DG.yaw)*0.45, hz=DG.z+Math.sin(DG.yaw)*0.45; DG.tb={x:hx,y:groundAt(hx,hz,DG.y+1)+0.045,z:hz,vx:0,vy:0,vz:0,rest:true,t:0,held:false};
      DG.n++; dgSave(); DG.happy=1.5; dgBark(1); if(J.air) tip('¡Cazada al vuelo! '+DG.name+' lleva '+DG.n+' pelotas',2200); if(DG.n%10===0) prgEarn(5,'Juegas con '+DG.name); if(DG.n>=25) prgTrophy('perro');
      DG.job={k:'wait4',t:0}; } } }
function dgPet(){ if(!DG.on||DG.away) return; ensureAudio(); if(Math.hypot(P.x-DG.x,P.z-DG.z)>3) dgPlaceNear(P.x,P.z,P.yaw,1.4); DG.petAt=performance.now()/1000; DG.job={k:'pet',t:0}; DG.yaw=Math.atan2(P.z-DG.z,P.x-DG.x); dgBark(1); for(let k=0;k<6;k++) dgHeart(k*0.12); }
function dgCall(){ if(!DG.on||DG.away) return; ensureAudio(); if(Math.hypot(P.x-DG.x,P.z-DG.z)>14) dgPlaceNear(P.x,P.z,P.yaw,10); DG.job=null; dgBark(2); }
function dgTrick(k){ if(!DG_TRICKS[k]||!DG.on) return; if(DG.away){ toast(DG.name+' no está aquí','Anda un poco: te alcanza enseguida'); return; } ensureAudio(); if(Math.hypot(P.x-DG.x,P.z-DG.z)>6) dgPlaceNear(P.x,P.z,P.yaw,2.2);
  DG.job={k:'trick',n:k,t:0,y0:DG.yaw}; DG.carry=null; DG.yaw=Math.atan2(P.z-DG.z,P.x-DG.x); DG.job.y0=DG.yaw; if(k==='ladra') dgBark(3); }
function dgTrickStep(J,A,dt){ J.t+=dt; DG.v=0; dgGround(dt); const T=DG_TRICKS[J.n], f=J.t/T.d;
  if(J.n==='sienta'){ DG.happy=0.3; }
  else if(J.n==='pata'){ if(J.t>0.5) A.paw=true; DG.happy=0.3; }
  else if(J.n==='vuelta'){ DG.yaw=J.y0+Math.min(1,f*1.15)*4*Math.PI; DG.happy=0.5; }
  else if(J.n==='rueda'){ A.lie=f<0.25?f/0.25:(f>0.85?(1-f)/0.15:1); if(f>0.25&&f<0.8) A.roll=(f-0.25)/0.55*2*Math.PI; DG.happy=0.5; }
  else if(J.n==='salta'){ if(DG.jy<=0&&(J.t<0.2||(J.t>0.85&&J.t<1.05))){ DG.vy=4.4; DG.jy=0.001; } DG.happy=0.6; }
  if(J.t>=T.d){ DG.job=null; DG.happy=1; for(let k=0;k<3;k++) dgHeart(k*0.15); } }
// little hearts that float up when you pet it
function dgHeart(delay){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:DG.htex,transparent:true,depthWrite:false})); sp.scale.setScalar(0.22); sp.visible=false; scene.add(sp); DG.hearts.push({sp,t:-delay,ox:(Math.random()-.5)*0.4,oz:(Math.random()-.5)*0.4}); }
function dgHearts(dt){ for(let i=DG.hearts.length-1;i>=0;i--){ const h=DG.hearts[i]; h.t+=dt; if(h.t<0) continue; const f=h.t/1.3; if(f>=1){ scene.remove(h.sp); h.sp.material.dispose(); DG.hearts.splice(i,1); continue; } h.sp.visible=!DG.away; h.sp.position.set(DG.x+h.ox,DG.y+0.85+f*1.1,DG.z+h.oz); h.sp.material.opacity=1-f*f; } }
// the dog button (next to Action): throw the ball, or pet it when it is sitting by you, or call it when it is far
function dgBtnState(){ if(!dgOK()||!DG.on||DG.away||S.mode!=='walk'||S.interior||(HX&&HX.sit)) return ''; const d=Math.hypot(P.x-DG.x,P.z-DG.z), J=DG.job;
  if(J&&J.k==='tennis') return ''; if(d>26) return 'ven'; const pt=performance.now()/1000-(DG.petAt||0);
  if(J&&J.k==='wait4') return J.t<0.3?'':(J.t<3&&pt>4?'acaricia':'tira'); if(d<2.6&&(!J||J.k==='mark')&&DG.v<0.5&&pt>6) return 'acaricia'; return 'tira'; }
function dgBtn(){ const b=$('bDog'); if(!b) return; const st=DG.away?'':dgBtnState(); if(st===DG.btn) return; DG.btn=st; b.hidden=!st; if(!st) return;
  $('bDogI').textContent=st==='acaricia'?'❤️':st==='ven'?'🐕':'🎾'; $('bDogT').textContent=st==='acaricia'?'Acariciar':st==='ven'?'Llamar':'Pelota'; b.setAttribute('aria-label',st==='acaricia'?'Acariciar a '+DG.name:st==='ven'?'Llamar a '+DG.name:'Tirarle la pelota a '+DG.name); }
function dgPress(){ const st=dgBtnState(); if(st==='acaricia') dgPet(); else if(st==='ven') dgCall(); else if(st==='tira') dgThrow(); }
/* ---- with the room: the dog travels in the state (dg) and the others draw it ---- */
const DG_NET_ST={stand:0,run:1,sit:2,swim:3,trick:4};
function dgNetState(o){ if(!dgOK()||!DG.on||DG.away||!DG.m) return; const A=DG.A, J=DG.job; const st=DG.swim?3:(A.sit>0.5?2:(DG.v>5?1:0)); o.dg=[Math.round(DG.x*10),Math.round(DG.z*10),Math.round(DG.yaw*100),st,DG.coat,(DG.carry?1:0)|(DG.happy>0?2:0)|(J&&J.k==='trick'&&J.n==='rueda'?4:0)]; }
function dgOKNet(a){ return Array.isArray(a)&&a.length===6&&a.every(v=>Number.isFinite(v)&&Math.abs(v)<60000)?a:null; }
function dgPeer(p,s,inWorld,dt){ const q=inWorld&&s&&s.dg; if(!q||!dgOK()){ if(p.dgM) p.dgM.root.visible=false; return; }
  const ci=clamp(q[4]|0,0,DG_COATS.length-1); if(!p.dgM||p.dgM.ci!==ci){ if(p.dgM) scene.remove(p.dgM.root); p.dgM=dgMake(ci); p.dgA={v:0}; p.dgP=null; }
  const tx=q[0]/10, tz=q[1]/10, M=p.dgM, A=p.dgA; if(!p.dgP||Math.hypot(tx-p.dgP[0],tz-p.dgP[1])>30) p.dgP=[tx,tz];
  const k=1-Math.exp(-dt*8), ox=p.dgP[0], oz=p.dgP[1]; p.dgP[0]+=(tx-ox)*k; p.dgP[1]+=(tz-oz)*k; const v=Math.hypot(p.dgP[0]-ox,p.dgP[1]-oz)/Math.max(dt,1e-3);
  A.v+=(v-A.v)*Math.min(1,dt*6); A.sit+=((q[3]===2?1:0)-(A.sit||0))*Math.min(1,dt*4); A.swim=q[3]===3; A.carry=q[5]&1?'tennis':null; A.happy=q[5]&2?1:0; A.bark=0; A.t=(A.t||0)+dt; A.roll=q[5]&4?(A.t*3)%(2*Math.PI):0; A.lie=q[5]&4?1:0;
  dgPose(M,A,dt); const pl=W.poolAt(p.dgP[0],p.dgP[1]), wl=pl?pl.level:W.waterLevel(p.dgP[0],p.dgP[1]), g=groundAt(p.dgP[0],p.dgP[1],(s.y||0)+1); M.root.visible=true; M.root.position.set(p.dgP[0],A.swim?wl-0.33:g,p.dgP[1]); M.root.rotation.set(0,-q[2]/100,0); }
/* ---- the map, the legend, the guide, the glossary and the tab of the sheet ---- */
function dgDrawMap(g,m2c,s,big){ if(!dgOK()||!DG.on||DG.away||!DG.m) return; const [x,y]=m2c(DG.x,DG.z); g.save(); g.fillStyle=DG_COATS[DG.coat].c; g.strokeStyle='#fff'; g.lineWidth=1.3*s; g.beginPath(); g.arc(x,y,(big?3.6:2.6)*s,0,7); g.fill(); g.stroke(); g.restore(); }
function dgLegend(){ return dgOK()&&DG.on?'<div><i class="dot" style="background:'+DG_COATS[DG.coat].c+';border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></i>Tu perro, '+esc(DG.name)+'</div>':''; }
function dgGuideHTML(){ if(!dgOK()) return ''; return '<li><b>Tu perro</b> ('+esc(DG.name)+'; se elige en <b>Para los peques</b>): te sigue a todas partes, también nadando, y te espera en la puerta de las casas. Al jugar al golf sale corriendo detrás de la bola, se sienta junto a ella para que la veas de lejos, te la trae del hoyo y nada a por ella si cae al agua. El botón <b>🎾 Pelota</b> (tecla T; R1 en el mando) le tira una pelota: va a por ella, a veces la caza al vuelo, y te la trae; cuando está sentado a tu lado, el botón cambia a <b>❤️ Acariciar</b>, y si está lejos, a <b>Llamar</b>. En la hoja del perro puedes pedirle trucos y cambiarle el nombre y el color.</li>'; }
function dgGlossHTML(){ return '<dt>Traer la bola</dt><dd>Lo que hace el perro al terminar un hoyo (la saca del hoyo), cuando la bola cae al agua (nada a por ella) y, en modo fácil, cuando se queda en un mal sitio: la lleva a la calle sin golpe de castigo.</dd>'; }
function dgTabHTML(){ if(!dgOK()) return '<p>El perro no está en este mundo.</p>'; const C=DG_COATS[DG.coat];
  let h='<p>'+(DG.on?'<b>'+esc(DG.name)+'</b> te acompaña por la isla.':'Ahora vas sin perro.')+' Te sigue, marca tu bola de golf sentándose a su lado, te la trae del hoyo y del agua, y juega a la pelota contigo.</p>';
  h+='<div class="row"><button class="btn small'+(DG.on?'':' primary')+'" id="dgOn">'+(DG.on?'Ir sin perro':'Llevar perro')+'</button>'+(DG.on?'<button class="btn small primary" id="dgThrow">🎾 Tirarle la pelota</button><button class="btn small" id="dgPetB">❤️ Acariciar</button><button class="btn small" id="dgCallB">Llamar</button>':'')+'</div>';
  h+='<div class="lbl">Nombre</div><div class="row"><input id="dgName" maxlength="16" value="'+esc(DG.name)+'" aria-label="Nombre del perro" style="font-size:16px;padding:6px 10px;border:1px solid var(--line);border-radius:10px;width:12em"><button class="btn small" id="dgNameOk">Guardar nombre</button></div>';
  h+='<div class="lbl" style="margin-top:8px">Color</div><div class="shop">'+DG_COATS.map((c,k)=>'<button class="it'+(k===DG.coat?' on':'')+'" data-dgc="'+k+'"><span class="sw" style="background:linear-gradient(135deg,'+c.c+' 0 60%,'+c.b+' 60%)"></span><span>'+c.n+'<small>'+(k===DG.coat?'Elegido':'Elegir')+'</small></span></button>').join('')+'</div>';
  if(DG.on) h+='<h3>Trucos</h3><div class="row">'+Object.keys(DG_TRICKS).map(k=>'<button class="btn small" data-dgt="'+k+'">'+DG_TRICKS[k].n+'</button>').join('')+'</div>';
  h+='<div class="tablewrap"><table class="card"><tbody><tr><td>Pelotas que te ha traído</td><td class="num"><b>'+DG.n+'</b></td></tr><tr><td>Bolas de golf que te ha traído (del hoyo y del agua)</td><td class="num">'+DG.gb+'</td></tr><tr><td>Trofeo «Mejor amigo»</td><td class="num">'+(PRG.tro.perro?'Conseguido':'Te trae 25 pelotas')+'</td></tr></tbody></table></div>';
  h+='<h3>Cómo se juega</h3><ul><li><b>Pelota:</b> el botón 🎾 junto a Acción (tecla T; R1 en el mando) la tira hacia donde mira la cámara. Si la pelota cae cerca y a buena altura, salta y la caza al vuelo.</li><li><b>Acariciar:</b> cuando se sienta a tu lado, el botón cambia a ❤️.</li><li><b>Golf:</b> corre detrás de la bola y se sienta junto a ella; al acabar el hoyo te la trae, y si cae al agua nada a por ella. En modo fácil, si la bola se queda en el búnker, entre los árboles o en el rough, te la lleva a la calle sin golpe de castigo.</li><li><b>Si vas en buggy, caballo o bici</b> corre a tu lado; si vuelas o te alejas mucho, te espera y vuelve en cuanto bajas. En las casas te espera en la puerta.</li><li><b>Con la sala</b>, tus amigos ven a tu perro (y tú al suyo).</li></ul>';
  return h; }
function dgTabWire(){ const q=id=>$(id); const on=q('dgOn'); if(on) on.onclick=()=>{ DG.on=!DG.on; dgSave(); if(DG.on) DG.away=true; kdSheet('perro'); };
  const t=q('dgThrow'); if(t) t.onclick=()=>{ $('kdSheet').hidden=true; if(S.mode!=='walk'){ toast('Pelota','Para tirarla tienes que ir andando'); return; } dgThrow(); };
  const pb=q('dgPetB'); if(pb) pb.onclick=()=>{ $('kdSheet').hidden=true; dgPet(); }; const cb=q('dgCallB'); if(cb) cb.onclick=()=>{ $('kdSheet').hidden=true; dgCall(); };
  const nk=q('dgNameOk'); if(nk) nk.onclick=()=>{ const v=q('dgName').value.replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,16); if(v){ DG.name=v; dgSave(); toast('Tu perro se llama '+v,''); kdSheet('perro'); } };
  document.querySelectorAll('[data-dgc]').forEach(b=>b.onclick=()=>{ DG.coat=+b.dataset.dgc; dgSave(); const was=DG.m; if(was){ const pos=[DG.x,DG.y,DG.z,DG.yaw]; scene.remove(was.root); DG.m=dgMake(DG.coat); DG.m.root.visible=false; } kdSheet('perro'); });
  document.querySelectorAll('[data-dgt]').forEach(b=>b.onclick=()=>{ $('kdSheet').hidden=true; dgTrick(b.dataset.dgt); }); }
{ const b=$('bDog'); if(b) b.addEventListener('click',()=>dgPress()); }
