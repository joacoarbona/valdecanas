
/* ================= bonus at the first tee: three cars (sports car, small car, 4x4) with drifts and an optional co-pilot ================= */
// generic body types, no real makes: each has its own handling. seat: [forward, side, height of the rig root over the car base]
const VEH={
  sport:{n:'Deportivo',col:'#c41e2a',top:52,acc:11,brake:20,rev:9,steer:1.95,fall:0.012,grip:7.5,lat:11.5,hbGrip:0.8,latHb:3.0,rough:0.55,len:4.4,wid:1.85,wr:0.34,base:1.36,track:0.82,seat:[-0.4,0.42,-0.12],cam:7.4,f0:52,fk:3.1},
  city:{n:'Utilitario',col:'#f2c230',top:40,acc:9.5,brake:17,rev:8,steer:2.35,fall:0.016,grip:8.5,lat:10,hbGrip:1.0,latHb:3.0,rough:0.72,len:3.8,wid:1.72,wr:0.3,base:1.18,track:0.76,seat:[-0.3,0.38,0.0],cam:6.8,f0:66,fk:2.8},
  suv:{n:'Todoterreno',col:'#41505c',top:36,acc:7,brake:14,rev:8,steer:1.55,fall:0.012,grip:7.2,lat:9,hbGrip:1.3,latHb:3.4,rough:1.0,len:4.9,wid:2.15,wr:0.46,base:1.55,track:0.98,seat:[-0.3,0.5,0.43],cam:8.8,f0:38,fk:2.4}
};
const COP_SKIN={n:'Copiloto',shirt:'#f6efe4',pants:'#2b3a55',hair:'#e9c870',skin:'#f1c7a5',shoe:'#c0392b',cap:null,pack:null,long:true,glasses:true};
const CARGEO={};
function carProfile(t){
  if(t==='sport') return [[-2.2,0.3],[-2.2,0.74],[-1.95,0.87],[-0.78,0.89],[-0.72,0.8],[0.55,0.8],[0.72,0.85],[1.95,0.67],[2.2,0.5],[2.2,0.3],[1.75,0.22],[-1.8,0.22]];
  if(t==='city') return [[-1.9,0.3],[-1.9,0.98],[-1.65,1.06],[-0.6,1.06],[-0.54,0.95],[0.5,0.95],[0.66,1.0],[1.7,0.88],[1.9,0.66],[1.9,0.32],[1.55,0.24],[-1.6,0.24]];
  return [[-2.45,0.58],[-2.45,1.42],[0.85,1.42],[0.92,1.52],[2.32,1.52],[2.45,1.4],[2.45,0.6],[2.0,0.5],[-2.1,0.5]]; }
function carBodyGeo(t){ if(CARGEO[t]) return CARGEO[t]; const V=VEH[t]; const g=new THREE.Group(); const M=c=>new THREE.MeshLambertMaterial({color:Cc(c)});
  const add=(geo,c,x,y,z,rx,ry,rz)=>{ const m=new THREE.Mesh(geo,M(c)); m.position.set(x,y,z); m.rotation.set(rx||0,ry||0,rz||0); g.add(m); return m; };
  const sh=new THREE.Shape(carProfile(t).map(p=>new THREE.Vector2(p[0],p[1]))); const body=new THREE.ExtrudeGeometry(sh,{depth:V.wid,bevelEnabled:false}); body.translate(0,0,-V.wid/2); add(body,V.col,0,0,0);
  const dark='#1e2124', glass='#27384a', seatC=t==='sport'?'#2b2b2b':t==='city'?'#3b4652':'#5a4632';
  const sy=t==='suv'?1.0:t==='city'?0.62:0.5, su=V.seat[0];
  for(const s of [-1,1]){ add(new THREE.BoxGeometry(0.55,0.16,0.5),seatC,su-0.05,sy,s*V.seat[1]); add(new THREE.BoxGeometry(0.14,0.62,0.5),seatC,su-0.33,sy+0.3,s*V.seat[1],0,0,0.12); }
  if(t==='suv'){ add(new THREE.BoxGeometry(0.55,0.16,1.5),seatC,-1.35,sy,0); add(new THREE.BoxGeometry(0.14,0.55,1.5),seatC,-1.62,sy+0.28,0); }
  add(new THREE.TorusGeometry(0.17,0.028,6,16),dark,su+0.48,sy+0.42,-V.seat[1],0,Math.PI/2,0).rotation.set(0,Math.PI/2,0.35);
  // windscreen (tinted glass) with its frame
  const ws=t==='sport'?{x:0.535,y:1.01,h:0.5,a:0.83}:t==='city'?{x:0.475,y:1.19,h:0.52,a:0.74}:{x:0.88,y:1.83,h:0.63,a:0.12};
  add(new THREE.BoxGeometry(0.035,ws.h,V.wid*0.9),glass,ws.x,ws.y,0,0,0,ws.a); add(new THREE.BoxGeometry(0.05,ws.h+0.04,0.05),dark,ws.x,ws.y,V.wid*0.45,0,0,ws.a); add(new THREE.BoxGeometry(0.05,ws.h+0.04,0.05),dark,ws.x,ws.y,-V.wid*0.45,0,0,ws.a);
  const fx=V.len/2, ly=t==='suv'?1.15:t==='city'?0.72:0.56;
  for(const s of [-1,1]){ add(new THREE.BoxGeometry(0.06,0.13,0.3),'#fff3cf',fx+0.005,ly,s*(V.wid/2-0.28)); add(new THREE.BoxGeometry(0.06,0.12,0.32),'#b3121e',-fx-0.005,ly+0.08,s*(V.wid/2-0.26)); }
  if(t==='sport'){ add(new THREE.BoxGeometry(0.32,0.05,1.6),dark,-2.02,1.04,0); for(const s of [-0.55,0.55]) add(new THREE.BoxGeometry(0.06,0.17,0.06),dark,-2.0,0.95,s);
    for(const s of [-0.35,0.35]) add(new THREE.CylinderGeometry(0.05,0.05,0.18,8),'#9aa3ab',-2.25,0.3,s,0,0,Math.PI/2);
    add(new THREE.BoxGeometry(1.2,0.08,0.06),dark,0.2,0.48,V.wid/2+0.005); add(new THREE.BoxGeometry(1.2,0.08,0.06),dark,0.2,0.48,-V.wid/2-0.005); }
  if(t==='city'){ for(const s of [-1,1]){ add(new THREE.BoxGeometry(0.16,0.2,0.3),dark,fx+0.04,0.38,s*0.55); add(new THREE.BoxGeometry(0.16,0.2,0.3),dark,-fx-0.04,0.4,s*0.55); add(new THREE.BoxGeometry(0.16,0.1,0.14),V.col,0.62,1.03,s*(V.wid/2+0.06)); }
    add(new THREE.BoxGeometry(0.1,0.12,V.wid*0.7),dark,fx+0.02,0.5,0); }
  if(t==='suv'){ for(const s of [-1,1]){ add(new THREE.BoxGeometry(0.08,0.72,0.08),dark,-0.95,1.78,s*0.98); add(new THREE.BoxGeometry(1.85,0.08,0.08),dark,-0.05,2.16,s*0.98,0,0,-0.03);
      for(const x of [-V.base,V.base]) add(new THREE.BoxGeometry(1.15,0.12,0.26),dark,x,0.98,s*(V.wid/2+0.06)); }
    add(new THREE.BoxGeometry(0.08,0.08,2.0),dark,-0.95,2.14,0); add(new THREE.BoxGeometry(0.28,0.3,V.wid*0.96),dark,fx+0.1,0.62,0);
    add(new THREE.CylinderGeometry(0.42,0.42,0.28,14),'#1b1d1f',-fx-0.16,1.05,0,0,0,Math.PI/2); for(let k=0;k<5;k++) add(new THREE.BoxGeometry(0.04,0.42,0.06),'#2b2f33',fx+0.03,1.1,-0.55+k*0.27); }
  CARGEO[t]=mergeGroup(g); return CARGEO[t]; }
let CARMAT=null, WHEELMAT=null, HUBMAT=null;
function makeCarMesh(t){ const V=VEH[t]; const root=new THREE.Group();
  if(!CARMAT){ CARMAT=FXQ?envMat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.32,metalness:0.25}),1.1):new THREE.MeshLambertMaterial({vertexColors:true}); WHEELMAT=new THREE.MeshLambertMaterial({color:Cc('#1b1d1f')}); HUBMAT=new THREE.MeshLambertMaterial({color:Cc('#c9ccd0')}); }
  const body=new THREE.Mesh(carBodyGeo(t),CARMAT); body.castShadow=true; body.receiveShadow=true; root.add(body);
  const tire=new THREE.CylinderGeometry(V.wr,V.wr,t==='suv'?0.36:0.25,16); tire.rotateX(Math.PI/2); const hub=new THREE.CylinderGeometry(V.wr*0.58,V.wr*0.58,(t==='suv'?0.36:0.25)+0.02,10); hub.rotateX(Math.PI/2);
  root.userData.wheels=[]; for(const [x,z] of [[V.base,V.track],[V.base,-V.track],[-V.base,V.track],[-V.base,-V.track]]){ const piv=new THREE.Group(); piv.position.set(x,V.wr,z); const sp=new THREE.Group(); piv.add(sp);
    const a=new THREE.Mesh(tire,WHEELMAT), b=new THREE.Mesh(hub,HUBMAT); a.castShadow=true; sp.add(a); sp.add(b); root.add(piv); root.userData.wheels.push({piv,sp,front:x>0}); }
  root.userData.type=t; scene.add(root); return root; }

/* ---- parking at the first tee of every course ---- */
function placeCars(){
  const T3=['sport','city','suv'];
  const free=(x,z)=>{ if(bldAt(x,z,2.6)) return false; const g=W.terrain(x,z); if(g<W.waterLevel(x,z)+0.3) return false; const c=W.surfAt(x,z); if(c===5||c===6||c===7||c>=20) return false;
    const tr=treeGrid.get(Math.floor(x/20)+','+Math.floor(z/20)); if(tr) for(const t of tr) if(Math.hypot(t.x-x,t.z-z)<t.tr+2.6) return false;
    for(const [dx,dz] of [[2.4,0],[-2.4,0],[0,1.2],[0,-1.2]]) if(Math.abs(W.terrain(x+dx,z+dz)-g)>1.1) return false; return true; };
  for(const C of W.COURSES){ const H=W.HOLES[C.holes[0]]; if(!H) continue; const f=[H.tc,H.ts], r=[-H.ts,H.tc]; let spots=null;
    for(const side of [1,-1]){ for(const off of [14,19,24,10,29]){ for(const back of [4,-4,10,-10,16]){ const p=[0,1,2].map(k=>[H.tx+r[0]*side*(off+k*3.6)-f[0]*back,H.tz+r[1]*side*(off+k*3.6)-f[1]*back]); if(p.every(q=>free(q[0],q[1]))){ spots=p; break; } } if(spots) break; } if(spots) break; }
    if(!spots) continue;
    spots.forEach((q,k)=>{ const t=T3[k]; const b={g:makeCarMesh(t),x:q[0],z:q[1],yaw:H.ta,speed:0,y:W.terrain(q[0],q[1]),type:t,vx:0,vz:0,vy:0,yr:0,air:false,cop:false,pitch:0,roll:0,course:C.k}; buggies.push(b); placeCarMesh(b); }); }
}
function carGround(b,x,z){ return groundAt(x,z,b.y+1.6); }
function placeCarMesh(b){ const V=VEH[b.type]; const c=Math.cos(b.yaw), s=Math.sin(b.yaw);
  const hF=carGround(b,b.x+c*V.base,b.z+s*V.base), hB=carGround(b,b.x-c*V.base,b.z-s*V.base), hL=carGround(b,b.x-s*V.track,b.z+c*V.track), hR=carGround(b,b.x+s*V.track,b.z-c*V.track);
  if(!b.air){ b.y=Math.max((hF+hB+hL+hR)/4,Math.min(hF,hB,hL,hR)); b.pitch=Math.atan2(hF-hB,2*V.base); b.roll=Math.atan2(hL-hR,2*V.track); }
  b.g.position.set(b.x,b.y,b.z); b.g.rotation.order='YXZ'; b.g.rotation.set(0,-b.yaw,0); b.g.rotateZ(b.pitch); b.g.rotateX(-b.roll*0.9); }

/* ---- the co-pilot: a rig sitting in the passenger seat, child of the car ---- */
const COPS=[];
function setCarCopilot(g,on){ let R=g.userData.cop; if(on&&!R){ const V=VEH[g.userData.type]; R=buildRig(COP_SKIN); R.root.position.set(V.seat[0],V.seat[2],V.seat[1]); g.add(R.root); g.userData.cop=R; COPS.push({R,g}); } if(R) R.root.visible=!!on; }
function poseCopilot(R,T,cheer){ poseRig(R,'drive',T,0);
  if(cheer>0){ R.aL.sg.rotation.z=2.75+Math.sin(T*9)*0.25; R.aR.sg.rotation.z=2.75-Math.sin(T*9)*0.25; R.aL.sg.rotation.x=0.3; R.aR.sg.rotation.x=-0.3; R.aL.el.rotation.z=0.2; R.aR.el.rotation.z=0.2; R.headG.rotation.y=Math.sin(T*3)*0.15; }
  else { R.aL.sg.rotation.z=0.42; R.aR.sg.rotation.z=0.42; R.aL.el.rotation.z=1.15; R.aR.el.rotation.z=1.15; R.aL.sg.rotation.x=0.05; R.aR.sg.rotation.x=-0.05; R.headG.rotation.y=Math.sin(T*0.45)*0.35-0.1; } }

/* ---- skid marks and tyre smoke ---- */
const SKID={mesh:null,n:0,max:900}, SMOKE={sp:[],k:0}; const _sm=new THREE.Object3D();
function initDriftFX(){ if(SKID.mesh) return; const g=new THREE.PlaneGeometry(0.26,0.95); g.rotateX(-Math.PI/2);
  SKID.mesh=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:0x141414,transparent:true,opacity:0.5,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),SKID.max);
  _sm.scale.set(0,0,0); _sm.updateMatrix(); for(let i=0;i<SKID.max;i++) SKID.mesh.setMatrixAt(i,_sm.matrix); SKID.mesh.frustumCulled=false; scene.add(SKID.mesh);
  const tex=canvasTex(64,64,(g2,w,h)=>{ const gr=g2.createRadialGradient(32,32,2,32,32,31); gr.addColorStop(0,'rgba(255,255,255,0.9)'); gr.addColorStop(1,'rgba(255,255,255,0)'); g2.fillStyle=gr; g2.fillRect(0,0,w,h); });
  for(let i=0;i<46;i++){ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:0xe2e2e2,transparent:true,opacity:0,depthWrite:false})); m.visible=false; scene.add(m); SMOKE.sp.push({m,life:0}); } }
function addSkid(x,z,yaw){ const y=terrainAt(x,z)+0.035; _sm.position.set(x,y,z); _sm.rotation.set(0,-yaw+Math.PI/2,0); _sm.scale.set(1,1,1); _sm.updateMatrix(); SKID.mesh.setMatrixAt(SKID.n%SKID.max,_sm.matrix); SKID.n++; SKID.mesh.instanceMatrix.needsUpdate=true; }
function addSmoke(x,y,z){ const s=SMOKE.sp[SMOKE.k++%SMOKE.sp.length]; s.life=1.5; s.m.position.set(x,y+0.3,z); s.m.scale.set(0.7,0.7,0.7); s.m.visible=true; s.v=[(Math.random()-0.5)*0.8,0.7+Math.random()*0.5,(Math.random()-0.5)*0.8]; }
function tickSmoke(dt){ for(const s of SMOKE.sp){ if(s.life<=0) continue; s.life-=dt; const k=1-s.life/1.5; s.m.position.x+=s.v[0]*dt; s.m.position.y+=s.v[1]*dt; s.m.position.z+=s.v[2]*dt; const sc=0.7+k*3.2; s.m.scale.set(sc,sc,sc); s.m.material.opacity=Math.max(0,0.42*(1-k)); if(s.life<=0) s.m.visible=false; } }

/* ---- engine and tyre sounds ---- */
const CA={eng:null,engG:null,scrG:null};
function carAudio(on,speed,drift,t){ if(!AC) return; const now=AC.currentTime;
  if(!CA.eng){ try{ const o=AC.createOscillator(); o.type='sawtooth'; const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=900; const g=AC.createGain(); g.gain.value=0; o.connect(lp); lp.connect(g); g.connect(master); o.start(); CA.eng=o; CA.engG=g;
      const nb=AC.createBuffer(1,AC.sampleRate,AC.sampleRate), d=nb.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; const ns=AC.createBufferSource(); ns.buffer=nb; ns.loop=true; const bp=AC.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=1900; bp.Q.value=4; const g2=AC.createGain(); g2.gain.value=0; ns.connect(bp); bp.connect(g2); g2.connect(master); ns.start(); CA.scrG=g2; }catch(e){ return; } }
  const V=VEH[t]||VEH.sport; const gear=speed%11/11; CA.eng.frequency.setTargetAtTime(V.f0+speed*V.fk*(0.75+0.5*gear),now,0.06);
  CA.engG.gain.setTargetAtTime(on&&SOUND?0.035+0.035*Math.min(1,speed/30):0,now,0.12); CA.scrG.gain.setTargetAtTime(on&&SOUND&&drift?0.07:0,now,0.05); }

/* ---- driving with drifts: the car keeps its velocity in the world; the tyres pull it towards where it points ---- */
const DR={t:0,best:+(store.get(WP.key+'_drift')||0),acc:0,cheer:0};
function enterCar(b){ P.buggy=b; b.vx=b.vz=b.vy=0; b.yr=0; b.air=false; setMode('drive'); camS.yaw=b.yaw; inp.hb=false; initDriftFX();
  const V=VEH[b.type]; $('carPromptTxt').textContent=V.n+': ¿con copiloto o solo?'; $('carPrompt').hidden=false; clearTimeout(DR.pt); DR.pt=setTimeout(()=>{ $('carPrompt').hidden=true; },9000);
  tip('Joystick: arriba acelera, abajo frena y marcha atrás, a los lados gira · Derrape (o Espacio): freno de mano',4200); }
function toggleCopilot(on){ const b=P.buggy; if(!b||!b.type) return; b.cop=on===undefined?!b.cop:!!on; setCarCopilot(b.g,b.cop); $('carPrompt').hidden=true; refreshCarBtns(); if(b.cop) toast('¡Copiloto a bordo!','Derrapa y verás cómo lo celebra'); }
function refreshCarBtns(){ const car=S.mode==='drive'&&P.buggy&&P.buggy.type; $('bJump').textContent=car?'Derrape':'Saltar'; $('bView').textContent=car?'Copiloto':(camS.fp?'3ª':'1ª');
  $('bView').classList.toggle('on',!!(car&&P.buggy.cop)); }
function exitCar(b){ const V=VEH[b.type]; const c=Math.cos(b.yaw), s=Math.sin(b.yaw); b.vx=b.vz=0; $('carPrompt').hidden=true; inp.hb=false; carAudio(false,0,false,b.type);
  let x=b.x+s*(V.wid/2+0.9), z=b.z-c*(V.wid/2+0.9); if(bldAt(x,z,0.4)){ x=b.x-s*(V.wid/2+0.9); z=b.z+c*(V.wid/2+0.9); } return [x,z]; }
function updateCar(dt){
  const b=P.buggy, V=VEH[b.type]; const th=inp.my, st=inp.mx, hb=!!inp.hb;
  const f=[Math.cos(b.yaw),Math.sin(b.yaw)], r=[-f[1],f[0]];
  let vl=b.vx*f[0]+b.vz*f[1], vt=b.vx*r[0]+b.vz*r[1];
  const code=W.surfAt(b.x,b.z); const rough=(code===1||code===2||code===9||code===7||code===10)?(code===7?V.rough*0.6:V.rough+(1-V.rough)*0.45):1;
  if(!b.air){
    if(th>0.05){ if(vl<-0.5) vl+=th*V.brake*dt; else vl+=th*V.acc*Math.max(0,1-vl/(V.top*(0.55+0.45*rough)))*dt; }
    else if(th<-0.05){ if(vl>0.5) vl+=th*V.brake*dt; else vl=Math.max(-V.rev,vl+th*V.acc*0.6*dt); }
    else vl*=Math.max(0,1-0.3*dt);
    if(hb) vl*=Math.max(0,1-0.9*dt);
    vl*=Math.max(0,1-(1-rough)*0.9*dt);
    // slope: gravity along the car
    const hF=carGround(b,b.x+f[0]*V.base,b.z+f[1]*V.base), hB=carGround(b,b.x-f[0]*V.base,b.z-f[1]*V.base); vl-=9.8*clamp((hF-hB)/(2*V.base),-0.6,0.6)*0.7*dt;
    // tyres: sideways speed fades with grip, up to what the tyres can hold; the handbrake lets the tail slide
    const grip=(hb?V.hbGrip:V.grip)*(rough<1?0.8:1), lat=(hb?V.latHb:V.lat)*(rough<1?0.75:1);
    const dv=Math.min(Math.abs(vt)*(1-Math.exp(-grip*dt)),lat*dt); vt-=Math.sign(vt)*dv;
    b.vx=f[0]*vl+r[0]*vt; b.vz=f[1]*vl+r[1]*vt;
    const sp=Math.abs(vl); let yr=st*V.steer*clamp(sp/6,0,1)/(1+sp*V.fall)*(vl<-0.3?-1:1);
    if(hb&&sp>5) yr*=1.9; if(Math.abs(vt)>2&&!hb) yr+=clamp(vt*0.035,-0.6,0.6)*Math.sign(vl);
    b.yr+=(yr-b.yr)*(1-Math.exp(-dt*7)); b.yaw+=b.yr*dt;
  } else { b.yaw+=b.yr*dt*0.5; }
  // move, with the same obstacles as on foot
  const free=(nx,nz)=>{ const gh=W.terrain(nx,nz), wl=W.waterLevel(nx,nz); if(gh<wl+0.25&&carGround(b,nx,nz)<wl+0.25) return false;
    for(const k of [0.5,0,-0.5]){ const px=nx+f[0]*V.len*k, pz=nz+f[1]*V.len*k; const bb=bldAt(px,pz,V.wid*0.45); if(bb&&bb.top>b.y+0.6&&bb.base<b.y+1.4) return false; }
    const trees=treeGrid.get(Math.floor(nx/20)+','+Math.floor(nz/20)); if(trees) for(const t of trees){ if(Math.hypot(nx-t.x,nz-t.z)<t.tr+V.wid*0.5 && b.y<t.cy) return false; } return true; };
  const nx=b.x+b.vx*dt, nz=b.z+b.vz*dt;
  if(free(nx,nz)){ b.x=nx; b.z=nz; }
  else { const sp=Math.hypot(b.vx,b.vz); if(sp>7) blip('bump');
    if(Math.abs(b.vx)>0.3&&free(nx,b.z)){ b.x=nx; b.vz*=-0.2; b.vx*=0.8; } else if(Math.abs(b.vz)>0.3&&free(b.x,nz)){ b.z=nz; b.vx*=-0.2; b.vz*=0.8; } else { b.vx*=-0.35; b.vz*=-0.35; } }
  // height: follow the ground, or fly off crests
  const c=Math.cos(b.yaw), s=Math.sin(b.yaw); const gF=carGround(b,b.x+c*V.base,b.z+s*V.base), gB=carGround(b,b.x-c*V.base,b.z-s*V.base); const gnd=(gF+gB+carGround(b,b.x,b.z)*2)/4;
  const yPred=b.y+b.vy*dt-10*dt*dt;
  if(b.air||yPred>gnd+0.08){ b.vy-=21*dt; b.y+=b.vy*dt; if(b.y<=gnd){ if(b.vy<-7) blip('land'); b.y=gnd; b.vy=0; b.air=false; } else b.air=true; }
  else { b.vy=clamp((gnd-b.y)/Math.max(dt,1e-3),-12,12); b.y=gnd; b.air=false; }
  placeCarMesh(b);
  // wheels: spin with the speed, front ones steer
  const sp=Math.hypot(b.vx,b.vz); for(const w of b.g.userData.wheels){ w.sp.rotation.z-=vl*dt/V.wr; if(w.front) w.piv.rotation.y=-st*0.45; }
  // drifting: sideways speed while moving
  const drift=!b.air&&sp>7&&Math.abs(vt)>2.6;
  if(drift){ DR.t+=dt; DR.acc+=sp*dt; if(DR.acc>0.45){ DR.acc=0; for(const k of [-1,1]){ const wx=b.x-c*V.base+(-s)*V.track*k, wz=b.z-s*V.base+c*V.track*k; addSkid(wx,wz,Math.atan2(b.vz,b.vx)); }
      if(Math.random()<0.55) addSmoke(b.x-c*V.base,b.y,b.z-s*V.base); } if(b.cop) DR.cheer=1.2; }
  else if(DR.t>0){ if(DR.t>1.3){ const sec=DR.t.toFixed(1).replace('.',','); const rec=DR.t>DR.best; if(rec){ DR.best=DR.t; store.set(WP.key+'_drift',DR.best.toFixed(2)); }
      toast('¡Derrape de '+sec+' s!',rec?'Nuevo récord'+(b.cop?' · tu copiloto lo celebra':''):'Récord: '+DR.best.toFixed(1).replace('.',',')+' s'); } DR.t=0; }
  carAudio(true,sp,drift,b.type);
  P.x=b.x; P.z=b.z; P.y=b.y; P.yaw=b.yaw; b.speed=vl;
  if(performance.now()-camS.lastLook>900) camS.yaw=lerpAng(camS.yaw,b.yaw,1-Math.exp(-dt*2.6));
}
function carFrame(T,dt){ if(DR.cheer>0) DR.cheer-=dt; tickSmoke(dt);
  for(const c of COPS){ if(!c.R.root.visible||!c.g.visible) continue; const mine=P.buggy&&P.buggy.g===c.g; poseCopilot(c.R,T,mine?DR.cheer:0); }
  if(!(S.mode==='drive'&&P.buggy&&P.buggy.type)&&CA.engG) carAudio(false,0,false,'sport'); }
// where the driver sits, in world coordinates
function seatPos(b){ const c=Math.cos(b.yaw), s=Math.sin(b.yaw); if(!b.type) return [b.x-c*0.25+s*0.28,b.y+0.18,b.z-s*0.25-c*0.28];
  const V=VEH[b.type]; const u=V.seat[0], v=-V.seat[1]; return [b.x+c*u-s*v,b.y+V.seat[2]+Math.sin(b.pitch||0)*u,b.z+s*u+c*v]; }
