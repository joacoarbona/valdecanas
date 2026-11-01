
/* ================= life on the course (other golfers and buggies) and, on the reservoir, a jet ski and fishing from the pier ================= */
const NPC={groups:[],carts:[],balls:[],spawnT:0,roads:null,maxG:3,maxC:3};
function npcSkin(){ const R=Math.random, b=SKINS[(R()*SKINS.length)|0], c=()=>AV_CL[(R()*AV_CL.length)|0];
  return Object.assign({},b,{shirt:c(),pants:['#f1eee6','#24324a','#c9b48a','#8e8f91','#16231b'][(R()*5)|0],cap:R()<0.6?c():null,hair:['#2d1e17','#5a3b26','#a4673a','#d9b86a','#8e8f91'][(R()*5)|0],pack:R()<0.5?c():'#3b4048'}); }
function npcFocus(){ const m=S.mode; return (m==='menu'||m==='drone'||m==='view'||m==='photo')?orbit.t:(m==='rround'&&RR.ball)?RR.ball.position:new V3(P.x,P.y,P.z); }
function npcStops(H){ const st=[{x:H.tx,z:H.tz,k:'tee'}]; const len=H.len;
  if(H.par>=4){ let s=Math.min(len-40,195+Math.random()*50); let p=W.polyAt(H.P,s); st.push({x:p.x,z:p.z,k:'fw'}); if(H.par===5&&len-s>190){ s=Math.min(len-35,s+165+Math.random()*30); p=W.polyAt(H.P,s); st.push({x:p.x,z:p.z,k:'fw'}); } }
  st.push({x:H.pin[0],z:H.pin[1],k:'green'}); return st; }
function npcSpawnGroup(F){ const busy=new Set(NPC.groups.map(g=>g.H.i)); const g=S.g; const cand=W.HOLES.filter(H=>{ if(busy.has(H.i)||H.i===g.hole||H.i===g.next) return false; const d=Math.min(Math.hypot(H.tx-F.x,H.tz-F.z),Math.hypot(H.pin[0]-F.x,H.pin[1]-F.z)); return d>70&&d<650; });
  if(!cand.length) return; const H=cand[(Math.random()*cand.length)|0], stops=npcStops(H), n=2+((Math.random()*2.2)|0);
  const G={H,stops,si:(Math.random()*(stops.length-1))|0,phase:'play',t:0,turn:0,sub:'address',mem:[]};
  for(let k=0;k<n;k++){ const R=buildRig(npcSkin()); R.root.visible=true; scene.add(R.root); G.mem.push({R,x:0,z:0,y:0,yaw:0,pose:'idle',pk:0,ph:Math.random()*5,walkT:Math.random()}); }
  npcGather(G,true); NPC.groups.push(G); }
function npcDir(G){ const a=G.stops[G.si], b=G.stops[Math.min(G.si+1,G.stops.length-1)]; return a===b?Math.atan2(G.H.pin[1]-G.H.gz,G.H.pin[0]-G.H.gx)+Math.PI:Math.atan2(b.z-a.z,b.x-a.x); }
// positions around the stop: the one who plays at the ball, the others a few metres behind
function npcSlots(G){ const st=G.stops[G.si], a=npcDir(G), c=Math.cos(a), s=Math.sin(a), out=[]; const green=st.k==='green';
  G.mem.forEach((m,k)=>{ if(k===G.turn&&G.phase==='play'){ const f=a+Math.PI/2; const bx=green?st.x-c*(2+k*1.3):st.x, bz=green?st.z-s*(2+k*1.3):st.z; out.push([bx-Math.cos(f)*0.8,bz-Math.sin(f)*0.8,f]); }
    else { const j=k-(k>G.turn?1:0), side=(j%2?1:-1)*(1.6+Math.floor(j/2)*1.6); const bx=st.x-c*(green?7:5)-s*side, bz=st.z-s*(green?7:5)+c*side; out.push([bx,bz,a]); } }); return out; }
function npcGather(G,snap){ const sl=npcSlots(G); G.mem.forEach((m,k)=>{ m.tx=sl[k][0]; m.tz=sl[k][1]; m.tyaw=sl[k][2]; if(snap){ m.x=m.tx; m.z=m.tz; m.yaw=m.tyaw; } }); }
function npcBall(from,to){ let b=NPC.balls.find(o=>!o.on); if(!b){ if(NPC.balls.length>=6) return; b={m:new THREE.Mesh(new THREE.SphereGeometry(0.11,8,6),new THREE.MeshLambertMaterial({color:0xffffff,emissive:Cc('#555555')}))}; scene.add(b.m); NPC.balls.push(b); }
  const d=Math.hypot(to[0]-from[0],to[1]-from[1]); Object.assign(b,{on:true,t:0,T:Math.max(0.8,Math.min(6.5,d/38)),h:Math.min(32,d*0.14),f:from,to}); b.m.visible=true; }
function npcStepGroup(G,dt,T){ G.t+=dt; const st=G.stops[G.si], last=G.si===G.stops.length-1, green=st.k==='green';
  if(G.phase==='play'){ const m=G.mem[G.turn]; const tA=green?1.6:1.2, tS=green?0.45:0.42, tF=green?0.7:1.1;
    if(G.t<tA){ m.pose='address'; m.pk=0; } else if(G.t<tA+tS){ m.pose='swing'; m.pk=(G.t-tA)/tS*(green?0.25:1); } else if(G.t<tA+tS+tF){ if(m.pose!=='follow'){ m.pose='follow'; if(!last){ const nx=G.stops[G.si+1]; npcBall([st.x,st.z],[nx.x+(Math.random()-0.5)*14,nx.z+(Math.random()-0.5)*14]); } } m.pk=(G.t-tA-tS)/0.35; }
    else { m.pose='idle'; G.t=0; G.turn++; if(G.turn>=G.mem.length){ G.turn=0; if(last){ G.done=true; return; } G.phase='walk'; G.si++; } npcGather(G,false); } }
  else { let all=true; for(const m of G.mem){ const dx=m.tx-m.x, dz=m.tz-m.z, d=Math.hypot(dx,dz); if(d>0.4){ all=false; const v=Math.min(d,1.35*dt); m.x+=dx/d*v; m.z+=dz/d*v; m.yaw=lerpAng(m.yaw,Math.atan2(dz,dx),1-Math.exp(-dt*4)); m.pose='walk'; m.walkT+=dt*1.6; } else { m.pose='idle'; m.yaw=lerpAng(m.yaw,m.tyaw,1-Math.exp(-dt*3)); } }
    if(all){ G.phase='play'; G.t=0; npcGather(G,false); } }
  if(G.phase==='play') for(const m of G.mem){ const dx=m.tx-m.x, dz=m.tz-m.z, d=Math.hypot(dx,dz); if(d>0.05){ const v=Math.min(d,1.6*dt); m.x+=dx/d*v; m.z+=dz/d*v; } m.yaw=lerpAng(m.yaw,m.tyaw,1-Math.exp(-dt*5)); }
  for(const m of G.mem){ m.y=groundAt(m.x,m.z,W.terrain(m.x,m.z)+2); const R=m.R; R.root.position.set(m.x,m.y,m.z); R.root.rotation.set(0,-m.yaw,0);
    if(m.pose==='walk') poseRig(R,'run',m.walkT,0.2); else poseRig(R,m.pose,T+m.ph,m.pk); R.club.visible=m.pose==='address'||m.pose==='swing'||m.pose==='follow'; } }
function npcDrop(G){ for(const m of G.mem){ scene.remove(m.R.root); } }
// buggies driving along the cart paths, each with its driver
function npcRoads(){ if(NPC.roads) return NPC.roads; NPC.roads=(W.course.roads||[]).filter(r=>r.cart&&r.p&&r.p.length>1).map(r=>{ const cum=[0]; for(let i=1;i<r.p.length;i++) cum.push(cum[i-1]+Math.hypot(r.p[i][0]-r.p[i-1][0],r.p[i][1]-r.p[i-1][1])); return {p:r.p,cum,L:cum[cum.length-1]}; }).filter(r=>r.L>90); return NPC.roads; }
function roadAt(r,s){ const c=r.cum; let i=1; while(i<c.length-1&&c[i]<s) i++; const a=r.p[i-1], b=r.p[i], k=clamp((s-c[i-1])/Math.max(1e-6,c[i]-c[i-1]),0,1); return [a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,Math.atan2(b[1]-a[1],b[0]-a[0])]; }
function npcSpawnCart(F){ const rs=npcRoads(); if(!rs.length) return; const near=rs.filter(r=>r.p.some(q=>{ const d=Math.hypot(q[0]-F.x,q[1]-F.z); return d>60&&d<500; })&&!NPC.carts.some(c=>c.r===r)); if(!near.length) return;
  const r=near[(Math.random()*near.length)|0]; const c={r,s:Math.random()*r.L,dir:Math.random()<0.5?1:-1,v:3.8+Math.random()*1.6,g:makeBuggy(),y:0,x:0,z:0,yaw:0,R:buildRig(npcSkin()),pause:0}; scene.add(c.R.root); NPC.carts.push(c); }
function npcStepCart(c,dt,T){ if(c.pause>0){ c.pause-=dt; } else { c.s+=c.dir*c.v*dt; if(c.s<0||c.s>c.r.L){ c.s=clamp(c.s,0,c.r.L); c.dir*=-1; c.pause=2+Math.random()*4; } }
  const [x,z,a]=roadAt(c.r,c.s); const yaw=c.dir>0?a:a+Math.PI; c.yaw=c.pause>0?c.yaw:lerpAng(c.yaw||yaw,yaw,1-Math.exp(-dt*3)); c.x=x; c.z=z; if(!c.y) c.y=W.terrain(x,z); placeBuggyMesh(c);
  const sp=seatPos(c), R=c.R; poseRig(R,'drive',T,0); R.root.position.set(sp[0],sp[1],sp[2]); R.root.rotation.set(0,-c.yaw,0); R.club.visible=false; }
function npcTick(dt,T){ if(S.mode==='loading'||S.interior) return; const F=npcFocus(); NPC.spawnT-=dt;
  if(NPC.spawnT<=0){ NPC.spawnT=2.5; if(NPC.groups.length<NPC.maxG) npcSpawnGroup(F); if(NPC.carts.length<NPC.maxC) npcSpawnCart(F); }
  for(let i=NPC.groups.length-1;i>=0;i--){ const G=NPC.groups[i]; const st=G.stops[G.si]; if(G.done||Math.hypot(st.x-F.x,st.z-F.z)>1100){ npcDrop(G); NPC.groups.splice(i,1); continue; } npcStepGroup(G,dt,T); }
  for(let i=NPC.carts.length-1;i>=0;i--){ const c=NPC.carts[i]; if(Math.hypot(c.x-F.x,c.z-F.z)>950&&c.x){ scene.remove(c.g); scene.remove(c.R.root); NPC.carts.splice(i,1); continue; } npcStepCart(c,dt,T); }
  for(const b of NPC.balls){ if(!b.on) continue; b.t+=dt; const u=b.t/b.T; if(u>=1){ b.on=false; b.m.visible=false; continue; } const x=b.f[0]+(b.to[0]-b.f[0])*u, z=b.f[1]+(b.to[1]-b.f[1])*u; const y0=W.terrain(b.f[0],b.f[1]), y1=W.terrain(b.to[0],b.to[1]);
    b.m.position.set(x,y0+(y1-y0)*u+4*b.h*u*(1-u)+0.1,z); b.m.scale.setScalar(clamp(camera.position.distanceTo(b.m.position)/40,1,5)); } }

/* ---- the jet ski (moto de agua): from the pontoons of the marina, all over the reservoir ---- */
const JET={list:[],spray:null,sv:null,snd:null};
function makeJet(col){ const g=new THREE.Group(); const M=c=>new THREE.MeshLambertMaterial({color:Cc(c)}); const wht=M('#f4f3ef'), dk=M('#24282c'), cc=M(col);
  const add=(geo,mat,x,y,z,rx,ry,rz)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.rotation.set(rx||0,ry||0,rz||0); m.castShadow=true; g.add(m); return m; };
  add(new THREE.BoxGeometry(2.3,0.42,1.0),wht,-0.15,0.22,0); const nose=add(new THREE.ConeGeometry(0.55,0.95,4),wht,1.42,0.24,0,0,Math.PI/4,-Math.PI/2); nose.scale.set(1,1,0.72);
  add(new THREE.BoxGeometry(1.9,0.14,0.92),cc,0.05,0.48,0); add(new THREE.BoxGeometry(0.95,0.24,0.42),dk,-0.38,0.66,0); add(new THREE.BoxGeometry(0.12,0.42,0.12),dk,0.5,0.72,0,0,0,0.35);
  add(new THREE.CylinderGeometry(0.03,0.03,0.78,6),dk,0.42,0.94,0,Math.PI/2,0,0); add(new THREE.BoxGeometry(0.5,0.08,0.95),cc,-0.95,0.3,0);
  return g; }
// open water: how many metres a boat can go straight from (x,z) in direction a before land or a pontoon
function freeRun(x,z,a,max){ const c=Math.cos(a), s=Math.sin(a); for(let d=2;d<=(max||70);d+=2){ const px=x+c*d, pz=z+s*d; if(W.terrain(px,pz)>W.waterLevel(px,pz)-0.8||platHitJet(px,pz)) return d; } return max||70; }
function pierFrame(){ const a=Math.atan2(PIER.B[1]-PIER.A[1],PIER.B[0]-PIER.A[0]); return {a,ux:Math.cos(a),uz:Math.sin(a),px:-Math.sin(a),pz:Math.cos(a),L:Math.hypot(PIER.B[0]-PIER.A[0],PIER.B[1]-PIER.A[1])}; }
function placeJets(){ if(!PIER.B||!PIER.plat) return; const F=pierFrame(); let side=1, best=-1;
  for(const sd of [1,-1]){ let r=0; for(const f of [0.55,0.65,0.75]){ const x=PIER.A[0]+F.ux*F.L*f+F.px*sd*4.2, z=PIER.A[1]+F.uz*F.L*f+F.pz*sd*4.2; r+=freeRun(x,z,Math.atan2(F.pz*sd,F.px*sd),60); } if(r>best){ best=r; side=sd; } }
  const yaw=Math.atan2(F.pz*side,F.px*side); let n=0;
  for(const [f,col] of [[0.58,'#d6442a'],[0.66,'#2a6f87'],[0.74,'#f2c230']]){ const x=PIER.A[0]+F.ux*F.L*f+F.px*side*4.2, z=PIER.A[1]+F.uz*F.L*f+F.pz*side*4.2;
    if(W.terrain(x,z)>W.waterLevel(x,z)-0.8) continue; const g=makeJet(col); scene.add(g); const J={g,i:n++,x,z,y:W.waterLevel(x,z)+0.1,yaw,v:0,pitch:0,roll:0}; JET.list.push(J); jetPlace(J,0); }
  // where to fish from: the side of the end platform that looks onto the most open water
  let fa=F.a, fr=-1; for(const [a,e] of [[F.a,7.2],[Math.atan2(F.pz,F.px),7.8],[Math.atan2(-F.pz,-F.px),7.8]]){ const x=PIER.plat[0]+Math.cos(a)*e, z=PIER.plat[1]+Math.sin(a)*e; const r=freeRun(x,z,a,60)+freeRun(x,z,a+0.35,60)+freeRun(x,z,a-0.35,60); if(r>fr){ fr=r; fa=a; FISH.edge=e; } } FISH.dir=fa; }
function jetPlace(J,T){ J.g.position.set(J.x,J.y,J.z); J.g.rotation.order='YXZ'; J.g.rotation.set(J.roll,-J.yaw,J.pitch); }
function jetNear(){ let best=null, bd=4.2; for(const J of JET.list){ if(J===P.jet) continue; const d=Math.hypot(P.x-J.x,P.z-J.z); if(d<bd){ bd=d; best=J; } } return best; }
function mountJet(J){ P.jet=J; P.swim=false; J.v=0; J.air=false; setMode('jet'); camS.yaw=J.yaw; const V=WCR[J.type||'jet'];
  tip(V.sail?'Joystick a los lados: girar · arriba: cazar la vela (más fuerza) · abajo: soltarla (frenar). De cara al viento no avanzas: ve de través'+(V.jump?' · Saltar: salto (con velocidad)':''):'Joystick: arriba acelera, abajo frena y da marcha atrás, a los lados gira',5200); }
function dismountJet(){ const J=P.jet; if(!J) return; P.jet=null; J.v=0; jetSound(0);
  const F=PIER.B?pierFrame():null, dx=F?J.x-PIER.A[0]:0, dz=F?J.z-PIER.A[1]:0, along=F?dx*F.ux+dz*F.uz:0, lat=F?dx*F.px+dz*F.pz:99;
  if(PIER.plat&&Math.hypot(J.x-PIER.plat[0],J.z-PIER.plat[1])<16){ P.x=PIER.plat[0]; P.z=PIER.plat[1]; P.y=PIER.deckY; P.swim=false; }
  else if(F&&Math.abs(lat)<9&&along>F.L*0.3&&along<F.L+2){ P.x=PIER.A[0]+F.ux*along; P.z=PIER.A[1]+F.uz*along; P.y=PIER.deckY; P.swim=false; }
  else { const c=Math.cos(J.yaw), s=Math.sin(J.yaw); P.x=J.x-s*1.6; P.z=J.z+c*1.6; P.y=W.waterLevel(P.x,P.z)-0.6; P.swim=true; }
  P.vx=P.vz=P.vy=0; setMode('walk'); J.air=false; craftHome(J); }
function updateJet(dt){ const J=P.jet; if(!J) return; const V=WCR[J.type||'jet'], th=inp.my, st=inp.mx;
  if(V.sail) sailStep(J,dt);
  else { if(th>0.05) J.v+=th*V.acc*dt; else if(th<-0.05) J.v+=th*(J.v>0.2?V.brake:3)*dt; else J.v*=Math.max(0,1-0.6*dt); J.v=clamp(J.v,-3,V.max);
    const turn=st*V.turn*(1.0+0.5*Math.min(1,Math.abs(J.v)/9))*Math.min(1,Math.abs(J.v)/1.8+0.2)*(J.v<0?-1:1); J.yaw+=turn*dt; inp.jumpQ=false; }
  const c=Math.cos(J.yaw), s=Math.sin(J.yaw); let nx=J.x+c*J.v*dt, nz=J.z+s*J.v*dt; const ahead=J.v>=0?V.len:-V.len*0.8;
  if(W.terrain(nx+c*ahead,nz+s*ahead)>W.waterLevel(nx,nz)-0.3||platHitJet(nx+c*ahead,nz+s*ahead)){ J.v*=-0.25; nx=J.x; nz=J.z; if(Math.abs(J.v)>1) blip('jump'); }
  J.x=nx; J.z=nz; const sp=Math.abs(J.v); if(!J.air) J.y=W.waterLevel(J.x,J.z)+(V.sail?0.02:0.08)+Math.sin(T*2.3+J.i)*0.05*(1-Math.min(1,sp/6))+(V.sail?0:Math.min(0.12,sp*0.008));
  if(V.sail){ J.pitch+=((J.air?0.25:0.02)-J.pitch)*(1-Math.exp(-dt*3)); J.roll+=(-st*0.18-J.roll)*(1-Math.exp(-dt*3)); }
  else { J.pitch+=((J.v>0?Math.min(J.type==='boat'?0.09:0.13,J.v*0.009):0)+(th>0.3&&sp<7?0.06:0)-J.pitch)*(1-Math.exp(-dt*3)); J.roll+=(-st*(J.type==='boat'?0.12:0.28)*Math.min(1,sp/8)-J.roll)*(1-Math.exp(-dt*4)); }
  jetPlace(J,T); P.x=J.x; P.z=J.z; P.y=J.y+0.42; P.yaw=J.yaw; if(performance.now()-camS.lastLook>900) camS.yaw=lerpAng(camS.yaw,J.yaw,1-Math.exp(-dt*2.4));
  if(!J.air&&(!V.sail||sp>3.5)) jetSpray(J,dt); jetSound(V.sail?0:sp,V.eng); }
function platHitJet(x,z){ for(const p of platsNear(x,z)){ if(p.bot<3&&insidePlat(p,x,z,0.6)) return true; } return false; }
function jetSpray(J,dt){ if(!JET.spray){ const N=90; const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3)); JET.sv=[]; for(let i=0;i<N;i++) JET.sv.push([0,0,0,0]);
    JET.spray=new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:0.32,transparent:true,opacity:0.8,depthWrite:false})); JET.spray.frustumCulled=false; scene.add(JET.spray); JET.k=0; }
  const a=JET.spray.geometry.attributes.position.array, sp=Math.abs(J.v); const c=Math.cos(J.yaw), s=Math.sin(J.yaw); let em=sp>2?Math.ceil(sp*dt*9):0;
  while(em-->0){ const i=JET.k++%JET.sv.length, side=Math.random()<0.5?-1:1; a[i*3]=J.x-c*1.3+(-s)*side*0.45; a[i*3+1]=J.y+0.1; a[i*3+2]=J.z-s*1.3+c*side*0.45; JET.sv[i]=[-c*sp*0.25+(-s)*side*(1.5+Math.random()*1.5),1.6+Math.random()*2.2,-s*sp*0.25+c*side*(1.5+Math.random()*1.5),0.9]; }
  for(let i=0;i<JET.sv.length;i++){ const v=JET.sv[i]; if(v[3]<=0){ a[i*3+1]=-999; continue; } v[3]-=dt; v[1]-=9.8*dt; a[i*3]+=v[0]*dt; a[i*3+1]=Math.max(W.waterLevel(a[i*3],a[i*3+2]),a[i*3+1]+v[1]*dt); a[i*3+2]+=v[2]*dt; }
  JET.spray.geometry.attributes.position.needsUpdate=true; }
function jetSound(sp,base){ if(!AC||!master) return; if(!JET.snd){ if(!sp) return; try{ const o=AC.createOscillator(); o.type='sawtooth'; const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=900; const g=AC.createGain(); g.gain.value=0; o.connect(f); f.connect(g); g.connect(master); o.start(); JET.snd={o,g}; }catch(e){ return; } }
  JET.snd.o.frequency.setTargetAtTime((base||48)+sp*7,AC.currentTime,0.15); JET.snd.g.gain.setTargetAtTime((S.mode==='jet'||S.mode==='ski')&&sp>0?0.035+Math.min(0.05,sp*0.003):0,AC.currentTime,0.2); }
function jetPost(T){ craftPost(T); if(P.jet) kiteFrame(P.jet,T); else if(NAU.kite) NAU.kite.visible=NAU.lines.visible=false; }
function idleJets(T){ idleCraft(T); skiIdle(T); for(const J of JET.list){ if(J===P.jet||(J.type&&J.type!=='jet')) continue; J.y=W.waterLevel(J.x,J.z)+0.08+Math.sin(T*1.7+J.i*2)*0.05; J.roll=Math.sin(T*1.3+J.i)*0.03; J.pitch=Math.sin(T*1.1+J.i)*0.02; jetPlace(J,T); } }

/* ---- fishing from the platform at the end of the pier: cast, wait for the bite, strike in time ---- */
const FISH={st:'',t:0,T:0,f:null,line:null,rod:null,tgt:new V3(),from:new V3(),rec:null};
// the fish of the Valdecañas reservoir (Tajo): chance, minimum and maximum weight in kg
const FISHES=[{n:'Black bass',p:0.3,a:0.35,b:2.6},{n:'Carpa común',p:0.25,a:1.2,b:14},{n:'Barbo comizo',p:0.14,a:0.5,b:6},{n:'Lucioperca',p:0.12,a:0.7,b:5},{n:'Lucio',p:0.11,a:1.2,b:9},{n:'Siluro',p:0.08,a:5,b:65}];
function fishLoad(){ try{ FISH.rec=JSON.parse(store.get(WP.key+'_pez')||'null'); }catch(e){ FISH.rec=null; } }
function fishSpot(){ return !!(PIER.plat&&S.mode==='walk'&&!P.swim&&Math.hypot(P.x-PIER.plat[0],P.z-PIER.plat[1])<9&&P.y>PIER.deckY-0.6); }
function fishDir(){ return FISH.dir!==undefined?FISH.dir:Math.atan2(PIER.B[1]-PIER.A[1],PIER.B[0]-PIER.A[0]); }
function startFish(){ const a=fishDir(), ux=Math.cos(a), uz=Math.sin(a), e=FISH.edge||7.2; P.x=PIER.plat[0]+ux*e; P.z=PIER.plat[1]+uz*e; P.y=PIER.deckY; P.yaw=a; P.vx=P.vz=P.vy=0;
  if(!FISH.rod){ const rod=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.03,1,6),new THREE.MeshLambertMaterial({color:Cc('#2b2f3a')})); scene.add(rod); FISH.rod=rod;
    const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12*3),3)); FISH.line=new THREE.Line(lg,new THREE.LineBasicMaterial({color:0xf4f4f4,transparent:true,opacity:0.85})); FISH.line.frustumCulled=false; scene.add(FISH.line);
    const fl=new THREE.Group(); const top=new THREE.Mesh(new THREE.SphereGeometry(0.07,10,8,0,Math.PI*2,0,Math.PI/2),new THREE.MeshLambertMaterial({color:Cc('#d6442a'),emissive:Cc('#3a0d05')})); const bot=new THREE.Mesh(new THREE.SphereGeometry(0.07,10,8,0,Math.PI*2,Math.PI/2,Math.PI/2),new THREE.MeshLambertMaterial({color:0xffffff}));
    fl.add(top); fl.add(bot); scene.add(fl); FISH.f=fl; }
  FISH.rod.visible=FISH.line.visible=true; FISH.f.visible=false; FISH.st='idle'; FISH.t=0; setMode('fish'); fishUI('Pulsa <b>Lanzar</b> para echar el anzuelo','Lanzar'); }
function exitFish(){ if(S.mode!=='fish') return; FISH.rod.visible=FISH.line.visible=FISH.f.visible=false; FISH.st=''; setMode('walk'); camS.yaw=P.yaw; }
function fishUI(msg,btn){ $('fishMsg').innerHTML=msg; $('fishBtn').textContent=btn; $('fishBtn').classList.toggle('hot',btn==='¡Recoger!'); const r=FISH.rec; $('fishRec').innerHTML=r?'Récord: <b>'+r.n+' de '+fmt(r.kg,r.kg<10?1:0)+' kg</b>':'Aún no has pescado nada'; }
function fishPress(){ ensureAudio(); const st=FISH.st;
  if(st==='idle'){ const a=fishDir()+(Math.random()-0.5)*0.5, d=11+Math.random()*7; FISH.tgt.set(P.x+Math.cos(a)*d,0,P.z+Math.sin(a)*d); FISH.tgt.y=W.waterLevel(FISH.tgt.x,FISH.tgt.z); FISH.st='cast'; FISH.t=0; blip('hit'); fishUI('Lanzando…','Recoger'); }
  else if(st==='wait'){ FISH.st='idle'; FISH.f.visible=false; fishUI('Demasiado pronto: no había picado. Vuelve a lanzar.','Lanzar'); }
  else if(st==='bite'){ FISH.st='reel'; FISH.t=0; FISH.from.copy(FISH.f.position); fishUI('¡Lo tienes! Recogiendo…','…'); }
  else if(st==='cast'||st==='reel'){} }
function fishCatch(){ let r=Math.random(), sp=FISHES[0]; for(const f of FISHES){ if(r<f.p){ sp=f; break; } r-=f.p; } const kg=Math.round((sp.a+(sp.b-sp.a)*Math.pow(Math.random(),2.4))*(sp.b<5?100:10))/(sp.b<5?100:10);
  const best=!FISH.rec||kg>FISH.rec.kg; if(best){ FISH.rec={n:sp.n,kg,d:Date.now(),who:(S.name||'').trim()||'Tú'}; store.set(WP.key+'_pez',JSON.stringify(FISH.rec)); }
  toast('¡'+sp.n+'!',fmt(kg,kg<10?1:0)+' kg'+(best?' · ¡récord!':'')+' · lo devuelves al agua'); blip(best?'gold':'cup'); if(best&&MP.code) mpSay('🎣 Récord de pesca: '+sp.n.toLowerCase()+' de '+fmt(kg,kg<10?1:0)+' kg'); }
function fishStep(dt,T){ if(S.mode!=='fish') return; const a=P.yaw, ux=Math.cos(a), uz=Math.sin(a), rx=-uz, rz=ux; FISH.t+=dt;
  const hand=new V3(P.x+ux*0.35+rx*0.22,P.y+1.15,P.z+uz*0.35+rz*0.22); const lift=FISH.st==='reel'?0.6+0.3*Math.sin(FISH.t*9):FISH.st==='bite'?0.2:0; const tip=new V3(P.x+ux*2.5+rx*0.4,P.y+2.2+lift,P.z+uz*2.5+rz*0.4);
  const d=tip.clone().sub(hand); FISH.rod.position.copy(hand).addScaledVector(d,0.5); FISH.rod.scale.set(1,d.length(),1); FISH.rod.quaternion.setFromUnitVectors(new V3(0,1,0),d.normalize());
  const f=FISH.f; let show=true;
  if(FISH.st==='idle'){ show=false; }
  else if(FISH.st==='cast'){ const u=Math.min(1,FISH.t/0.9); f.position.set(tip.x+(FISH.tgt.x-tip.x)*u,tip.y+(FISH.tgt.y-tip.y)*u+3.5*u*(1-u),tip.z+(FISH.tgt.z-tip.z)*u); if(u>=1){ FISH.st='wait'; FISH.t=0; FISH.T=3+Math.random()*8; fishUI('Espera a que el flotador se hunda…','Recoger'); } }
  else if(FISH.st==='wait'){ const nib=FISH.t>1.5&&Math.sin(FISH.t*1.7)>0.97?0.03:0; f.position.set(FISH.tgt.x,FISH.tgt.y+0.02+Math.sin(T*2.2)*0.015-nib,FISH.tgt.z); if(FISH.t>FISH.T){ FISH.st='bite'; FISH.t=0; blip('water'); fishUI('<b>¡Pica!</b> Recoge ya','¡Recoger!'); } }
  else if(FISH.st==='bite'){ f.position.set(FISH.tgt.x+Math.sin(FISH.t*23)*0.05,FISH.tgt.y-0.06-0.05*Math.sin(FISH.t*17),FISH.tgt.z); if(FISH.t>1.35){ FISH.st='idle'; fishUI('Se ha soltado. Hay que recoger en cuanto se hunde el flotador.','Lanzar'); } }
  else if(FISH.st==='reel'){ const u=Math.min(1,FISH.t/2.2); f.position.set(FISH.from.x+(tip.x-FISH.from.x)*u*0.85+Math.sin(FISH.t*7)*0.3*(1-u),FISH.from.y+Math.max(0,u-0.8)*4,FISH.from.z+(tip.z-FISH.from.z)*u*0.85+Math.cos(FISH.t*6)*0.3*(1-u)); if(u>=1){ FISH.st='idle'; fishCatch(); fishUI('Pulsa <b>Lanzar</b> para volver a probar','Lanzar'); } }
  f.visible=show; const arr=FISH.line.geometry.attributes.position.array; const end=show?f.position:tip; const sag=show?Math.min(1.2,tip.distanceTo(end)*0.06):0;
  for(let i=0;i<12;i++){ const u=i/11; arr[i*3]=tip.x+(end.x-tip.x)*u; arr[i*3+1]=tip.y+(end.y-tip.y)*u-Math.sin(Math.PI*u)*sag*(FISH.st==='reel'?0.2:1); arr[i*3+2]=tip.z+(end.z-tip.z)*u; } FISH.line.geometry.attributes.position.needsUpdate=true; FISH.line.visible=show;
  camT.pos.set(P.x-ux*3.6+rx*2.8,P.y+2.6,P.z-uz*3.6+rz*2.8); const lk=show?f.position:new V3(P.x+ux*12,P.y-0.5,P.z+uz*12); camT.look.set((P.x+lk.x)/2,(P.y+1+lk.y)/2,(P.z+lk.z)/2); }
function fishPost(T){ if(S.mode!=='fish'||!rig) return; poseRig(rig,'address',T,0); rig.root.position.set(P.x,P.y,P.z); rig.root.rotation.set(0,-(P.yaw-0.25),0); rig.club.visible=false; }
fishLoad();
