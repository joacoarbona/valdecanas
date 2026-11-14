
/* ================= horses to ride, and rabbits and deer about the courses ================= */
const HORSES=[]; const HCOL=[['#7a4a2a','#2a1d16'],['#9a5a2e','#5a3a1e'],['#2b2522','#151210'],['#b9b2a8','#6f6a63'],['#5c3a24','#1e1612']];
function legGeo(r0,r1,L){ const g=new THREE.CylinderGeometry(r1,r0,L,7); g.translate(0,-L/2,0); return g; }
// a quadruped from simple shapes: body, neck and head merged, four legs that swing from the hip (horse, deer)
function makeQuad(o){ const M=c=>new THREE.MeshLambertMaterial({color:Cc(c)}); const root=new THREE.Group(); const bodyG=new THREE.Group();
  const add=(geo,c,x,y,z,rx,ry,rz,sx,sy,sz)=>{ const m=new THREE.Mesh(geo,M(c)); m.position.set(x,y,z); m.rotation.set(rx||0,ry||0,rz||0); if(sx) m.scale.set(sx,sy,sz); bodyG.add(m); return m; };
  const L=o.len, H=o.h, Wd=o.w;
  add(new THREE.SphereGeometry(0.5,14,10),o.col,0,H,0,0,0,0,L*0.62,o.bh,Wd*0.95);
  add(new THREE.SphereGeometry(0.5,12,8),o.col,L*0.3,H+0.02,0,0,0,0,L*0.36,o.bh*0.95,Wd*0.92);
  add(new THREE.SphereGeometry(0.5,12,8),o.col,-L*0.3,H+0.03,0,0,0,0,L*0.36,o.bh*0.98,Wd*0.95);
  const nk=add(new THREE.CylinderGeometry(o.nr*0.75,o.nr,o.nl,9),o.col,L*0.45,H+o.nl*0.42,0,0,0,-0.62);
  add(new THREE.BoxGeometry(o.hl,o.hh,o.hw),o.col,L*0.45+o.nl*0.42+o.hl*0.32,H+o.nl*0.78,0,0,0,-0.95);
  add(new THREE.SphereGeometry(o.hh*0.55,8,6),o.muz,L*0.45+o.nl*0.42+o.hl*0.62,H+o.nl*0.58,0);
  for(const s of [-1,1]) add(new THREE.ConeGeometry(0.035,o.ear,5),o.col,L*0.45+o.nl*0.36,H+o.nl*1.02,s*o.hw*0.32,s*0.25,0,-0.2);
  if(o.mane){ add(new THREE.BoxGeometry(0.06,o.nl*0.95,0.07),o.mane,L*0.45-0.05,H+o.nl*0.5,0,0,0,-0.62); }
  if(o.tail) add(new THREE.CylinderGeometry(0.03,0.09,o.tail,6),o.mane||o.col,-L*0.56,H-o.tail*0.35,0,0,0,-0.35);
  if(o.rump) add(new THREE.SphereGeometry(0.16,8,6),o.rump,-L*0.52,H+0.05,0,0,0,0,0.6,1.1,1.1);
  if(o.antlers){ const ac='#d8c7a2'; for(const s of [-1,1]){ const x0=L*0.45+o.nl*0.4, y0=H+o.nl*1.05; add(new THREE.CylinderGeometry(0.018,0.025,0.55,5),ac,x0-0.05,y0+0.25,s*0.12,s*0.35,0,0.25);
      add(new THREE.CylinderGeometry(0.014,0.018,0.28,5),ac,x0+0.08,y0+0.35,s*0.2,s*0.6,0,-0.5); add(new THREE.CylinderGeometry(0.012,0.016,0.24,5),ac,x0-0.12,y0+0.48,s*0.22,s*0.5,0,0.7); } }
  if(o.saddle){ add(new THREE.BoxGeometry(0.62,0.08,Wd*1.02),'#3b2516',-0.02,H+o.bh*0.48,0); add(new THREE.BoxGeometry(0.66,0.03,Wd*1.1),'#7b2d26',-0.02,H+o.bh*0.44,0);
    for(const s of [-1,1]) add(new THREE.BoxGeometry(0.03,0.42,0.03),'#2a2420',0,H+o.bh*0.2,s*Wd*0.55); }
  const geo=mergeGroup(bodyG); const body=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true})); body.castShadow=true; root.add(body);
  const legs=[]; const lg=legGeo(o.lr,o.lr*0.62,o.ll), hoof=new THREE.CylinderGeometry(o.lr*0.75,o.lr*0.85,0.08,7); hoof.translate(0,-o.ll-0.02,0);
  const lm=new THREE.MeshLambertMaterial({color:Cc(o.legc||o.col)}), hm=new THREE.MeshLambertMaterial({color:Cc('#1e1a17')});
  for(const [fx,fz] of [[1,1],[1,-1],[-1,1],[-1,-1]]){ const g=new THREE.Group(); g.position.set(fx*L*0.34,H-o.bh*0.2,fz*Wd*0.3); const a=new THREE.Mesh(lg,lm), h=new THREE.Mesh(hoof,hm); a.castShadow=true; g.add(a); g.add(h); root.add(g); legs.push({g,front:fx>0,left:fz>0}); }
  root.userData={legs,body,o}; scene.add(root); return root; }
const HORSE_O=(i)=>({len:2.05,h:1.28,w:0.62,bh:0.72,nl:0.95,nr:0.2,hl:0.62,hh:0.27,hw:0.24,ear:0.16,ll:1.0,lr:0.075,col:HCOL[i%HCOL.length][0],mane:HCOL[i%HCOL.length][1],legc:HCOL[i%HCOL.length][0],muz:HCOL[i%HCOL.length][1],tail:0.75,saddle:true});
const DEER_O=(male)=>({len:1.5,h:0.98,w:0.42,bh:0.5,nl:0.7,nr:0.12,hl:0.42,hh:0.19,hw:0.17,ear:0.13,ll:0.86,lr:0.045,col:'#8b6a45',muz:'#3a2e24',tail:0.14,rump:'#efe6d6',antlers:male});
// gait: legs swing about the hip; phase offsets per gait (walk 4 beats, trot diagonal pairs, gallop front/back pairs)
const GAIT={idle:[0,0,0,0,0],walk:[0.32,0,0.5,0.75,0.25],trot:[0.48,0,0.5,0.5,0],canter:[0.62,0,0.12,0.6,0.7],gallop:[0.75,0,0.1,0.55,0.65]};
function animQuad(root,gait,ph,bob){ const G=GAIT[gait]||GAIT.idle, L=root.userData.legs; const amp=G[0]; for(let i=0;i<4;i++){ L[i].g.rotation.z=Math.sin((ph+G[i+1])*Math.PI*2)*amp; }
  root.userData.body.position.y=gait==='idle'?0:Math.abs(Math.sin(ph*Math.PI*2))*bob; root.userData.body.rotation.z=gait==='gallop'?Math.sin(ph*Math.PI*2)*0.06:0; }
function freeSpot(x0,z0,r,tries){ for(let k=0;k<(tries||40);k++){ const a=Math.random()*6.283, d=Math.random()*r; const x=x0+Math.cos(a)*d, z=z0+Math.sin(a)*d; const c=W.surfAt(x,z);
    if(c===0||c>=20||(c>=3&&c<=8)||c===11) continue; if(W.terrain(x,z)<W.waterLevel(x,z)+0.4) continue; if(bldAt(x,z,3)) continue;
    const tr=treeGrid.get(Math.floor(x/20)+','+Math.floor(z/20)); if(tr&&tr.some(t=>Math.hypot(t.x-x,t.z-z)<t.tr+2.2)) continue; return [x,z]; } return null; }
function placeHorses(){ let i=0; for(const [x0,z0,n] of (WP.horses||[])){ for(let k=0;k<n;k++){ const p=freeSpot(x0,z0,22); if(!p) continue; const g=makeQuad(HORSE_O(i)); const h={g,i:i++,x:p[0],z:p[1],y:W.terrain(p[0],p[1]),yaw:Math.random()*6.28,spd:0,ph:Math.random(),vy:0,air:false,home:[x0,z0],wander:0,tx:p[0],tz:p[1]}; HORSES.push(h); placeHorse(h); } } }
function placeHorse(h){ h.g.position.set(h.x,h.y,h.z); h.g.rotation.set(0,-h.yaw,0); const a=h.spd; animQuad(h.g,a<0.15?'idle':a<2.6?'walk':a<5.6?'trot':a<9.5?'canter':'gallop',h.ph,a<2.6?0.02:a<5.6?0.06:0.09); }
// horses nobody rides graze and wander near their field
function idleHorses(dt){ for(const h of HORSES){ if(h===P.horse||h.remoteBy) continue; if(Math.hypot(h.x-camera.position.x,h.z-camera.position.z)>600) continue;
    h.wander-=dt; if(h.wander<=0){ h.wander=6+Math.random()*10; const p=Math.random()<0.6?null:freeSpot(h.home[0],h.home[1],20,10); if(p){ h.tx=p[0]; h.tz=p[1]; } }
    const dx=h.tx-h.x, dz=h.tz-h.z, d=Math.hypot(dx,dz); if(d>0.6){ const ty=Math.atan2(dz,dx); h.yaw=lerpAng(h.yaw,ty,1-Math.exp(-dt*1.5)); h.spd=Math.min(1.4,h.spd+dt); } else h.spd=Math.max(0,h.spd-dt*2);
    h.x+=Math.cos(h.yaw)*h.spd*dt; h.z+=Math.sin(h.yaw)*h.spd*dt; h.y=W.terrain(h.x,h.z); h.ph=(h.ph+dt*h.spd*0.55)%1; placeHorse(h); } }
function mountHorse(h){ if(P.buggy) exitBuggy(); P.horse=h; h.spd=0; setMode('ride'); camS.yaw=h.yaw; tip('Joystick: adelante para avanzar (al paso, al trote, al galope), a los lados para girar · Esprint: galope tendido · Saltar: el caballo salta',4500); }
function dismountHorse(){ const h=P.horse; if(!h) return; P.horse=null; h.spd=0; h.wander=8; h.tx=h.x; h.tz=h.z; const c=Math.cos(h.yaw), s=Math.sin(h.yaw); let x=h.x+s*1.4, z=h.z-c*1.4; if(bldAt(x,z,0.4)){ x=h.x-s*1.4; z=h.z+c*1.4; }
  P.x=x; P.z=z; P.y=groundAt(x,z,h.y+2); P.vx=P.vz=P.vy=0; P.yaw=h.yaw; placeHorse(h); setMode('walk'); }
function updateRide(dt){ const h=P.horse; const th=inp.my, st=inp.mx; const sprint=P.sprintLock||inp.keys.ShiftLeft||inp.keys.ShiftRight||P.stickHold>0.35;
  if(Math.hypot(inp.mx,inp.my)>0.93) P.stickHold+=dt; else P.stickHold=0;
  const target=th>0.05?(sprint?13:th*8.5):th<-0.05?th*1.6:0; h.spd+=clamp(target-h.spd,-6*dt,(target>h.spd?3.2:6)*dt);
  h.yaw+=st*dt*(1.6-Math.min(0.9,Math.abs(h.spd)*0.06));
  if(inp.jumpQ){ inp.jumpQ=false; if(!h.air&&h.spd>1.5){ h.vy=4.6; h.air=true; blip('jump'); } }
  const nx=h.x+Math.cos(h.yaw)*h.spd*dt, nz=h.z+Math.sin(h.yaw)*h.spd*dt; let ok=true;
  // the wall test looks where the horse is going: at its nose going forwards, at its tail backing up (T1: backing up always works)
  const hc=Math.cos(h.yaw), hs=Math.sin(h.yaw), pr=h.spd<0?-1.1:1.0;
  const g2=W.terrain(nx,nz), wl=W.waterLevel(nx,nz), wet=wl-g2>0.9; if(wet) ok=false;
  if(ok){ const bb=bldAt(nx+hc*pr,nz+hs*pr,0.6); if(bb&&bb.top>h.y+0.8&&bb.base<h.y+1.8) ok=false; }
  if(ok&&!h.air){ const tr=treeGrid.get(Math.floor(nx/20)+','+Math.floor(nz/20)); if(tr) for(const t of tr){ if(Math.hypot(nx-t.x,nz-t.z)<t.tr+0.7&&h.y<t.cy) { ok=false; break; } } }
  if(!ok&&!wet&&dsOut([[h.x+hc*pr,h.z+hs*pr,0.6,0],[h.x,h.z,0,0.7]],[[nx+hc*pr,nz+hs*pr,0.6,0],[nx,nz,0,0.7]],h.y)) ok=true;
  if(ok){ h.x=nx; h.z=nz; } else h.spd*=-0.2;
  const gy=W.terrain(h.x,h.z); if(h.air){ h.vy-=18*dt; h.y+=h.vy*dt; if(h.y<=gy){ h.y=gy; h.air=false; h.vy=0; } } else h.y=gy;
  h.ph=(h.ph+dt*(Math.abs(h.spd)<2.6?Math.abs(h.spd)*0.55:Math.abs(h.spd)<5.6?1.6+Math.abs(h.spd)*0.1:1.7+Math.abs(h.spd)*0.07))%1;
  placeHorse(h); if(h.air) h.g.rotation.z+=(h.vy>0?0.12:-0.08);
  P.x=h.x; P.z=h.z; P.y=h.y; P.yaw=h.yaw; if(performance.now()-camS.lastLook>900) camS.yaw=lerpAng(camS.yaw,h.yaw,1-Math.exp(-dt*2.2)); }
function riderPose(R,h){ poseRig(R,'drive',0,0); R.body.position.y=0.62; for(const [L,s] of [[R.lL,1],[R.lR,-1]]){ L.hg.rotation.x=s*0.55; L.hg.rotation.z=0.95; L.kn.rotation.z=-1.25; }
  R.aL.sg.rotation.z=0.75; R.aR.sg.rotation.z=0.75; R.aL.el.rotation.z=0.9; R.aR.el.rotation.z=0.9; R.torso.rotation.z=-0.08-Math.min(0.25,Math.abs(h.spd)*0.02); }
function horseSeat(h){ const c=Math.cos(h.yaw), s=Math.sin(h.yaw), o=h.g.userData.o; const u=-0.05; return [h.x+c*u,h.y+o.h+o.bh*0.52-0.62+h.g.userData.body.position.y,h.z+s*u]; }

/* ---- wildlife: rabbits and deer that keep near the camera, graze, move on and run away from you ---- */
const WILD=[]; let RABGEO=null;
function rabbitMesh(){ if(!RABGEO){ const g=new THREE.Group(); const M=c=>new THREE.MeshLambertMaterial({color:Cc(c)}); const add=(geo,c,x,y,z,sx,sy,sz,rz)=>{ const m=new THREE.Mesh(geo,M(c)); m.position.set(x,y,z); if(sx) m.scale.set(sx,sy,sz); if(rz) m.rotation.z=rz; g.add(m); };
    add(new THREE.SphereGeometry(0.5,10,8),'#8a7a66',0,0.16,0,0.34,0.24,0.2); add(new THREE.SphereGeometry(0.5,9,7),'#8f806b',0.17,0.27,0,0.15,0.14,0.13);
    for(const s of [-1,1]) add(new THREE.BoxGeometry(0.03,0.13,0.035),'#7a6a57',0.15,0.39,s*0.03,0,0,0,0.25); add(new THREE.SphereGeometry(0.045,7,5),'#f4f1ea',-0.17,0.18,0);
    add(new THREE.SphereGeometry(0.012,5,4),'#111111',0.235,0.29,0.04); add(new THREE.SphereGeometry(0.012,5,4),'#111111',0.235,0.29,-0.04); RABGEO=mergeGroup(g); }
  const m=new THREE.Mesh(RABGEO,new THREE.MeshLambertMaterial({vertexColors:true})); m.castShadow=true; scene.add(m); return m; }
function wildOK(x,z,kind){ const c=W.surfAt(x,z); if(c===0||c>=20||c===8||c===11||c===7) return false; if(W.terrain(x,z)<W.waterLevel(x,z)+0.3) return false; if(bldAt(x,z,kind==='deer'?6:2)) return false; return true; }
function spawnWild(kind,x,z,yaw){ let o; if(kind==='deer'){ const g=makeQuad(DEER_O(Math.random()<0.45)); o={kind,g,ph:Math.random()}; } else o={kind,g:rabbitMesh(),hop:0};
  Object.assign(o,{x,z,yaw:yaw===undefined?Math.random()*6.28:yaw,spd:0,state:'graze',t:2+Math.random()*4,flee:false}); WILD.push(o); placeWild(o); return o; }
function placeWild(o){ const y=W.terrain(o.x,o.z); if(o.kind==='deer'){ o.g.position.set(o.x,y,o.z); o.g.rotation.set(0,-o.yaw,0); animQuad(o.g,o.spd<0.2?'idle':o.spd<2?'walk':'gallop',o.ph,o.spd<2?0.02:0.12); }
  else { const hy=o.hop>0?Math.sin(Math.min(1,o.hopT)*Math.PI)*0.22:0; o.g.position.set(o.x,y+hy,o.z); o.g.rotation.set(0,-o.yaw,o.hop>0?Math.sin(o.hopT*Math.PI*2)*0.25:0); } }
function wildTick(dt){ if(!WP.wildlife) return; const m=S.mode, onP=m==='walk'||m==='replay'||m==='jet'||m==='fish'||m==='aim'||m==='swing'||m==='flight'||m==='wait'||m==='drive'||m==='ride'||m==='racket', orb=m==='view'||m==='drone'||m==='menu'||m==='photo';
  const fx=onP?P.x:orb?orbit.t.x:camera.position.x, fz=onP?P.z:orb?orbit.t.z:camera.position.z; const nR=WP.wildlife.rabbits||12, nD=WP.wildlife.deer||4;
  const camH=m==='view'?40:orb?orbit.r*0.5:camera.position.y-W.terrain(camera.position.x,camera.position.z);
  // keep the population near where you look from; animals far behind are recycled
  for(let i=WILD.length-1;i>=0;i--){ const o=WILD[i]; if(Math.hypot(o.x-fx,o.z-fz)>(camH>120?900:330)){ scene.remove(o.g); WILD.splice(i,1); } }
  const count=k=>WILD.filter(o=>o.kind===k).length;
  if(S.mode!=='menu'&&camH<400){ for(const [k,n] of [['rabbit',nR],['deer',nD]]) if(count(k)<n){ for(let t=0;t<6;t++){ const a=Math.random()*6.283, d=k==='deer'?90+Math.random()*190:35+Math.random()*130; const x=fx+Math.cos(a)*d, z=fz+Math.sin(a)*d; if(!wildOK(x,z,k)) continue;
      if(k==='rabbit'){ const grp=1+((Math.random()*3)|0); for(let j=0;j<grp;j++) spawnWild('rabbit',x+(Math.random()-0.5)*4,z+(Math.random()-0.5)*4); } else { const grp=1+((Math.random()*3)|0); for(let j=0;j<grp;j++) spawnWild('deer',x+(Math.random()-0.5)*8,z+(Math.random()-0.5)*8); } break; } } }
  for(const o of WILD){ const dP=Math.hypot(o.x-P.x,o.z-P.z); const scare=(S.mode==='walk'||S.mode==='drive'||S.mode==='ride'||S.mode==='aim')&&dP<(o.kind==='deer'?(S.mode==='drive'||S.mode==='ride'?45:30):12);
    if(scare&&!o.flee){ o.flee=true; o.state='flee'; o.t=6+Math.random()*3; o.yaw=Math.atan2(o.z-P.z,o.x-P.x)+(Math.random()-0.5)*0.8; }
    o.t-=dt; if(o.t<=0){ o.flee=false; if(o.state==='graze'){ o.state='move'; o.t=2+Math.random()*5; o.yaw+=(Math.random()-0.5)*2; } else { o.state='graze'; o.t=3+Math.random()*7; } }
    const want=o.kind==='deer'?(o.state==='flee'?11:o.state==='move'||o.state==='cross'?1.3:0):(o.state==='flee'?6:o.state==='move'||o.state==='cross'?1.6:0);
    o.spd+=clamp(want-o.spd,-8*dt,6*dt);
    if(o.kind==='rabbit'){ if(o.spd>0.2){ o.hopT=(o.hopT||0)+dt*(o.state==='flee'?3.2:2.2); o.hop=1; if(o.hopT>1) o.hopT-=1; if(o.state==='flee'&&Math.random()<dt*1.5) o.yaw+=(Math.random()-0.5)*1.4; } else { o.hop=0; o.hopT=0; } }
    else o.ph=(o.ph+dt*(o.spd<2?o.spd*0.6:1.8+o.spd*0.05))%1;
    if(o.spd>0.05){ const nx=o.x+Math.cos(o.yaw)*o.spd*dt, nz=o.z+Math.sin(o.yaw)*o.spd*dt; if(wildOK(nx,nz,o.kind)||o.state==='cross'){ o.x=nx; o.z=nz; } else o.yaw+=Math.PI*(0.5+Math.random()*0.5); }
    placeWild(o); } }
// a crossing in front of the camera when a hole is shown from the air, or ahead of you on the tee
function wildCrossing(H,s0){ if(!WP.wildlife) return; const L=H.len; const s=Math.min(L-20,Math.max(40,(s0||0.5)*L)); const p=W.polyAt(H.P,s); const side=Math.random()<0.5?1:-1;
  const nx=-p.uz*side, nz=p.ux*side; const deer=Math.random()<0.38; const n=deer?1+((Math.random()*3)|0):2+((Math.random()*3)|0);
  for(let j=0;j<n;j++){ const x=p.x-nx*(deer?26:14)+(Math.random()-0.5)*(deer?10:5)-p.ux*j*(deer?3:1.2), z=p.z-nz*(deer?26:14)+(Math.random()-0.5)*(deer?10:5)-p.uz*j*(deer?3:1.2);
    const o=spawnWild(deer?'deer':'rabbit',x,z,Math.atan2(nz,nx)); o.state='cross'; o.t=deer?28:16; o.spd=deer?1.2:1.4; } }
