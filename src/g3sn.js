/* ================= jugar con la nieve (D1, con la Navidad encendida): trineo, bolas de nieve, guerra con la sala, diana de muñecos y muñecos de nieve ================= */
// Nombres sn*, estado SN. Modo «sled» para el trineo.
var SN={ok:false,grp:null,racks:[],sl:null,mesh:null,balls:[],men:[],war:null,prac:null,race:null,st:{b:0,h:0,t:0},best:{},still:0,armT:-1,cd:0,hiss:null,splat:0,job:null,hudT:0,puff:null,md:'ffa'};
const SN_G=9.81, SN_TEAM=['#d62828','#2f80ed'], SN_TEAMN=['Rojos','Azules'];
function snLoad(){ try{ const o=JSON.parse(store.get('vg_nv_st')||'{}'); SN.st={b:o.b|0,h:o.h|0,t:o.t|0,pr:o.pr|0}; }catch(e){} try{ SN.best=JSON.parse(store.get('vg_nv_sl')||'{}')||{}; }catch(e){ SN.best={}; } }
function snSave(){ store.set('vg_nv_st',JSON.stringify(SN.st)); store.set('vg_nv_sl',JSON.stringify(SN.best)); }
function snStats(){ snLoad(); let best=0, bestN=''; for(const c of (BK.tr||[])){ const b=SN.best[c.id]; if(b&&(!best||b<best)){ best=b; bestN=c.n; } } return {best,bestN,built:SN.st.b,hits:SN.st.h,thrown:SN.st.t,pr:SN.st.pr}; }
/* ---- the sleds and their racks at the top of the downhill trails ---- */
function snSledMesh(){ const g=new THREE.Group(), red=new THREE.MeshLambertMaterial({color:Cc('#c0392b')}), wood=new THREE.MeshLambertMaterial({color:Cc('#b07a43')});
  for(const s of [-0.22,0.22]){ const cv=new THREE.CatmullRomCurve3([new V3(-0.62,0.03,s),new V3(0.35,0.03,s),new V3(0.62,0.1,s),new V3(0.72,0.28,s),new V3(0.6,0.4,s)]); const r=new THREE.Mesh(new THREE.TubeGeometry(cv,16,0.025,5,false),red); r.castShadow=true; g.add(r);
    for(const x of [-0.45,0.05,0.4]){ const p=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.17,0.04),red); p.position.set(x,0.11,s); g.add(p); } }
  for(let k=0;k<5;k++){ const sl=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.03,0.56),wood); sl.position.set(-0.5+k*0.22,0.21,0); sl.castShadow=true; g.add(sl); }
  const rope=new THREE.Mesh(new THREE.TorusGeometry(0.2,0.012,4,16,Math.PI),new THREE.MeshLambertMaterial({color:Cc('#e8d9a8')})); rope.position.set(0.6,0.38,0); rope.rotation.y=Math.PI/2; g.add(rope); return g; }
function snBuild(){ if(SN.ok) return; SN.ok=true; snLoad(); SN.grp=new THREE.Group(); NV.grp.add(SN.grp); SN.mesh=snSledMesh(); SN.mesh.visible=false; scene.add(SN.mesh);
  for(const c of (BK.tr||[])){ const p=c.pts, a=p[1], b=p[Math.min(p.length-1,4)], d=Math.hypot(b[0]-a[0],b[1]-a[1])||1, f=[(b[0]-a[0])/d,(b[1]-a[1])/d], r=[-f[1],f[0]];
    let pos=null; for(const s of [3.2,-3.2,4.5,-4.5,2.4,-2.4]){ const x=a[0]+r[0]*s, z=a[1]+r[1]*s; if(!bldAt(x,z,1)&&!W.poolAt(x,z)&&W.terrain(x,z)>W.waterLevel(x,z)+0.5){ pos=[x,z]; break; } } if(!pos) pos=[a[0]+r[0]*3,a[1]+r[1]*3];
    const g=new THREE.Group(), y=W.terrain(pos[0],pos[1]); g.position.set(pos[0],y,pos[1]); g.rotation.y=-Math.atan2(f[1],f[0]); SN.grp.add(g); const wood=oxWood();
    for(const z of [-0.9,0.9]){ const q=new THREE.Mesh(new THREE.BoxGeometry(0.1,1.0,0.1),wood); q.position.set(0,0.5,z); g.add(q); } const bar=new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,1.9),wood); bar.position.set(0,0.95,0); g.add(bar);
    for(const z of [-0.55,0,0.55]){ const s=snSledMesh(); s.scale.setScalar(0.85); s.rotation.z=Math.PI/2-0.25; s.rotation.y=Math.PI/2; s.position.set(-0.32,0.04,z); g.add(s); }
    bkSign(pos[0]-f[0]*1.6+r[0]*1.4,pos[1]-f[1]*1.6+r[1]*1.4,Math.atan2(f[1],f[0])+Math.PI/2,y,'Trineos',c.n,'#2f80ed');
    SN.racks.push({x:pos[0],z:pos[1],c,f,start:[a[0],a[1]],tsim:snSim(c)}); }
  const N=320, geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3).fill(-1e4),3)); const pp=new THREE.Points(geo,new THREE.PointsMaterial({size:0.12,color:Cc('#f4f8ff'),transparent:true,opacity:0.9,depthWrite:false})); pp.frustumCulled=false; SN.grp.add(pp);
  SN.puff={P:pp,pos:geo.attributes.position.array,vel:new Float32Array(N*3),life:new Float32Array(N),N,i:0}; }
// the fastest a sled can go down a trail, straight along it (the medals are measured against it)
function snSim(c){ const p=c.pts; let v=0, t=0; for(let i=1;i<p.length;i++){ const L=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1])||0.01, sl=(W.terrain(p[i][0],p[i][1])-W.terrain(p[i-1][0],p[i-1][1]))/L;
    let s=0; while(s<L){ const a=-SN_G*sl/Math.sqrt(1+sl*sl)-(v>0.05?0.55:0)-0.0045*v*v+(v<3?2.2:0); v=Math.max(0.5,v+a*0.02); s+=v*0.02; t+=0.02; if(t>900) return t; } } return t; }
function snPuff(x,y,z,n,sp){ const F=SN.puff; if(!F) return; for(let k=0;k<n;k++){ const i=F.i; F.i=(F.i+1)%F.N; const j=i*3, a=Math.random()*Math.PI*2, s=(sp||1.6)*(0.4+Math.random());
    F.pos[j]=x; F.pos[j+1]=y; F.pos[j+2]=z; F.vel[j]=Math.cos(a)*s; F.vel[j+1]=1+Math.random()*2.2; F.vel[j+2]=Math.sin(a)*s; F.life[i]=0.5+Math.random()*0.5; } }
function snPuffTick(dt){ const F=SN.puff; if(!F) return; let any=false; for(let i=0;i<F.N;i++){ if(F.life[i]<=0) continue; any=true; const j=i*3; F.life[i]-=dt; F.vel[j+1]-=6*dt; F.pos[j]+=F.vel[j]*dt; F.pos[j+1]+=F.vel[j+1]*dt; F.pos[j+2]+=F.vel[j+2]*dt; if(F.life[i]<=0) F.pos[j+1]=-1e4; } if(any) F.P.geometry.attributes.position.needsUpdate=true; }
function snSnd(k,vol){ if(!AC||!SOUND) return; const t=AC.currentTime, n=AC.createBufferSource(), f=AC.createBiquadFilter(), g=AC.createGain(); n.buffer=noiseBuf; f.type='lowpass'; f.frequency.value=k==='plaf'?1400:900;
  g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime((vol||0.5)*0.4,t+0.01); g.gain.exponentialRampToValueAtTime(0.001,t+(k==='plaf'?0.22:0.4)); n.connect(f); f.connect(g); g.connect(master); n.start(t,Math.random()); n.stop(t+0.5); }
/* ---- riding a sled ---- */
function snLeaveAll(){ if(S.interior) exitVilla(); if(S.mode==='pas') pasOff(); if(S.mode==='pow'){ pwClear(); setMode('walk'); } if(P.buggy) exitBuggy(); if(P.horse) dismountHorse(); if(P.jet) dismountJet(); if(BK.b) bkUnmount({stay:true}); cirLand(); mpEnterWorld(); }
function snGo(rack,opt){ opt=opt||{}; if(!NV.on) nvSet(true,{quiet:true}); if(!['walk','drive','ride','jet','bike','menu','drone','pow','sled'].includes(S.mode)){ toast('Trineo','Termina antes lo que estás haciendo'); return; } $('nvSheet').hidden=true; closeModal(); hideMap();
  const go=()=>{ snLeave(); snLeaveAll(); const c=rack?rack.c:null; let x=P.x, z=P.z, yaw=camS.yaw;
    if(rack){ const r=[-rack.f[1],rack.f[0]], s=(opt.slot||0)*1.5*((opt.slot||0)%2?1:-1); x=rack.start[0]+r[0]*s; z=rack.start[1]+r[1]*s; yaw=Math.atan2(rack.f[1],rack.f[0]); }
    const y=groundAt(x,z,W.terrain(x,z)+2); SN.sl={x,y,z,yaw,v:0,vy:0,vyG:0,air:false,t:0,c,k:0,rt:0,run:false,fall:0,lock:opt.go||0,rack,pitch:0,roll:0};
    P.x=x; P.z=z; P.y=y; P.yaw=yaw; P.vx=P.vy=P.vz=0; P.swim=false; camS.yaw=yaw; camS.pitch=0.25; S.snap=true; SN.mesh.visible=true; setMode('sled'); snStep(0); };
  if(opt.now) go(); else fadeTo(go); if(rack&&!opt.go) setTimeout(()=>toast('Trineo · '+rack.c.n,'Joystick a los lados: girar · atrás: frenar · Saltar: botar. El reloj empieza al salir.'),700); }
function snHere(){ if(S.mode!=='walk'){ toast('Trineo','Bájate antes de donde estás'); return; } let rk=null; for(const r of SN.racks) if(Math.hypot(P.x-r.start[0],P.z-r.start[1])<10) rk=r; snGo(rk,{}); }
function snLeave(silent){ const L=SN.sl; if(!L) return; SN.sl=null; SN.mesh.visible=false; if(SN.hiss) SN.hiss.g.gain.value=0; if(S.mode==='sled'){ const r=[-Math.sin(L.yaw),Math.cos(L.yaw)], x=L.x+r[0]*0.9, z=L.z+r[1]*0.9; P.x=x; P.z=z; P.y=groundAt(x,z,L.y+1); P.vx=P.vz=0; P.vy=0; setMode('walk'); } }
function snFall(msg){ const L=SN.sl; if(!L||L.fall>0) return; L.fall=1.3; L.air=false; snPuff(L.x,L.y+0.3,L.z,30,3); snSnd('plaf',0.8); toast(msg,'Te levantas y sigues'); }
function snStep(dt){ const L=SN.sl; if(!L){ setMode('walk'); return; } L.t+=dt; const jump=inp.jumpQ; inp.jumpQ=false;
  if(L.lock){ const w=L.lock-Date.now(); if(w>0){ snPlace(L); return; } L.lock=0; L.v=Math.max(L.v,2); L.run=true; L.rt=0; blip('gold'); }
  if(L.fall>0){ L.fall-=dt; L.v*=Math.exp(-4*dt); snPlace(L); return; }
  const n=2, h=dt/n, G=(x,z)=>groundAt(x,z,L.y+1.2); let hop=jump;
  for(let it=0;it<n&&dt>0;it++){ const steer=clamp(inp.mx,-1,1), push=inp.my;
    if(!L.air){ const e=0.5, gx=(G(L.x+e,L.z)-G(L.x-e,L.z))/(2*e), gz=(G(L.x,L.z+e)-G(L.x,L.z-e))/(2*e), cx=Math.cos(L.yaw), sz=Math.sin(L.yaw), sl=gx*cx+gz*sz;
      let a=-SN_G*sl/Math.sqrt(1+sl*sl)-(L.v>0.05?0.55:0)-0.0045*L.v*L.v; if(push>0.3&&L.v<3) a+=2.4; if(push<-0.3) a-=5.5; L.v=Math.max(0,L.v+a*h);
      L.yaw+=steer*(0.9+Math.min(L.v,14)*0.11)*h; L.pitch=Math.atan(sl); L.roll=Math.atan(-gx*sz+gz*cx)*0.8;
      if(hop){ hop=false; L.air=true; L.vy=L.vyG+4.2; blip('jump'); } }
    else L.yaw+=steer*0.6*h;
    let nx=L.x+Math.cos(L.yaw)*L.v*h, nz=L.z+Math.sin(L.yaw)*L.v*h; const res=collide(nx,nz,L.y,0.5,false);
    if(Math.hypot(res[0]-nx,res[1]-nz)>1e-3){ const imp=L.v; nx=res[0]; nz=res[1]; L.v*=0.3; if(imp>9) snFall('¡Pum! Te has chocado'); else if(imp>2){ blip('bump'); snPuff(nx,L.y+0.3,nz,8); } }
    if(!dsInWorld(nx,nz)){ nx=L.x; nz=L.z; L.v=0; }
    const g1=G(nx,nz);
    if(!L.air){ const vg=(g1-L.y)/h; if(vg<L.vyG-SN_G*h*2.2&&L.v>3){ L.air=true; L.vy=L.vyG; L.y+=L.vy*h; } else { L.y=g1; L.vyG=vg; } }
    if(L.air){ L.vy-=SN_G*h; L.y+=L.vy*h; if(L.vy<0) L.pitch=Math.atan2(L.vy,Math.max(L.v,1))*0.6; if(L.y<=g1){ const imp=-L.vy, fw=Math.max(L.v,1)*0.06; L.y=g1; L.air=false; L.vyG=(G(nx+Math.cos(L.yaw)*fw,nz+Math.sin(L.yaw)*fw)-g1)/0.06; if(imp>12) snFall('¡Al suelo!'); else if(imp>3){ blip('bump'); snPuff(nx,g1,nz,14); } } }
    L.x=nx; L.z=nz; }
  const wl=W.waterLevel(L.x,L.z); if(terrainAt(L.x,L.z)<wl-0.4&&L.y<=wl+0.1){ const x=L.x, z=L.z; snRunVoid(''); SN.sl=null; SN.mesh.visible=false; P.x=x; P.z=z; P.y=wl-1.25; P.swim=true; P.vx=P.vz=0; setMode('walk'); toast('¡Al agua!','El trineo no flota: nada hasta la orilla'); return; }
  if(L.v>4&&!L.air&&Math.random()<dt*20) snPuff(L.x-Math.cos(L.yaw)*0.6,L.y+0.05,L.z-Math.sin(L.yaw)*0.6,2,0.8);
  snRun(dt); snPlace(L); snHiss(L.air?0:L.v); }
function snPlace(L){ const M=SN.mesh; M.position.set(L.x,L.y,L.z); M.rotation.set(0,0,0); M.rotation.order='YZX'; M.rotation.y=-L.yaw; M.rotation.z=L.pitch; M.rotation.x=L.roll;
  P.x=L.x; P.z=L.z; P.y=L.y-0.32; P.yaw=L.yaw; P.vx=Math.cos(L.yaw)*L.v; P.vz=Math.sin(L.yaw)*L.v; P.onGround=!L.air;
  if(L.v>2&&performance.now()-camS.lastLook>1100) camS.yaw=lerpAng(camS.yaw,L.yaw,1-Math.exp(-0.05*Math.max(L.v,1))); }
function snHiss(v){ if(!AC||!SOUND) return; if(!SN.hiss){ const n=AC.createBufferSource(); n.buffer=noiseBuf; n.loop=true; const f=AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=2400; f.Q.value=0.6; const g=AC.createGain(); g.gain.value=0; n.connect(f); f.connect(g); g.connect(master); n.start(); SN.hiss={g,f}; }
  SN.hiss.g.gain.value=Math.min(0.09,v*0.006); SN.hiss.f.frequency.value=1800+v*90; }
// timing on a trail: the clock starts when you move off the start and stops at the bottom arch
function snRun(dt){ const L=SN.sl, c=L.c; if(!c) return; const p=c.pts; let bj=-1, bd=1e9; for(let j=Math.max(0,L.k-3);j<Math.min(p.length,L.k+14);j++){ const d=Math.hypot(p[j][0]-L.x,p[j][1]-L.z); if(d<bd){ bd=d; bj=j; } }
  if(bd<16&&bj>L.k) L.k=bj; if(!L.run&&L.k>=1&&L.v>0.5&&!L.lock){ L.run=true; L.rt=0; } if(L.run){ L.rt+=dt; if(bd>32&&L.k<p.length-4) snRunVoid('Te has salido de la pista: el reloj se para'); else if(L.k>=p.length-3) snFinish(); } }
function snRunVoid(msg){ const L=SN.sl; if(!L||!L.run) return; L.run=false; L.c=null; if(msg) toast('Trineo',msg); if(SN.race&&!SN.race.fin) SN.race.fin=-1; }
function snMedal(ms,rack){ const T=rack.tsim*1000; return ms<=T*1.15?'oro':ms<=T*1.4?'plata':ms<=T*1.8?'bronce':''; }
function snFinish(){ const L=SN.sl, c=L.c, ms=Math.round(L.rt*1000); L.run=false; L.c=null; snLoad(); const old=SN.best[c.id], rec=!old||ms<old; if(rec) SN.best[c.id]=ms; snSave(); const md=snMedal(ms,L.rack);
  blip('cup'); toast((rec?'¡Récord! ':'')+'Bajada: '+kartFmt(ms),c.n+(md?' · medalla de '+md:'')+(old&&!rec?' · tu récord: '+kartFmt(old):'')); prgEarn(3+(rec&&old?5:0),'Bajada en trineo'); if(md==='oro') prgTrophy('trineo');
  if(SN.race&&!SN.race.fin){ SN.race.fin=ms; SN.race.c=c; } }
function snPose(){ return ['drive',0]; }
function snCam(){ const L=SN.sl; if(!L) return 4; const f=[Math.cos(camS.yaw),Math.sin(camS.yaw)]; camT.pos.set(P.x-f[0]*5.2,P.y+2.6+Math.max(0,camS.pitch)*3,P.z-f[1]*5.2); camT.look.set(P.x+f[0]*4,P.y+0.6,P.z+f[1]*4); return 5; }
function snAct(){ return {k:'snOff',label:'Bajarte del trineo'}; }
function snStatus(){ const L=SN.sl; if(!L) return ['Trineo','']; const t=L.lock?'Preparados…':L.run?kartFmt(L.rt*1000)+' · ':''; return ['Trineo'+(L.c?' · '+L.c.n:''),t+fmt(L.v*3.6)+' km/h · joystick: girar, atrás frena · Saltar: botar']; }
/* ---- snowballs ---- */
function snBallMesh(){ if(!SN.bg){ SN.bg=new THREE.SphereGeometry(0.1,8,6); SN.bm=new THREE.MeshLambertMaterial({color:Cc('#f7fbff')}); } const m=new THREE.Mesh(SN.bg,SN.bm); SN.grp.add(m); return m; }
function snThrow(){ if(!NV.on||S.mode!=='walk'||S.interior||SN.cd>0||SN.job) return; SN.cd=0.42; ensureAudio(); const d=new V3(); camera.getWorldDirection(d); let yaw=camS.yaw, el=Math.asin(clamp(d.y,-0.9,0.9))+0.16; const sp=19;
  // a little help aiming (the youngest players): a friend or a snowman in front, a bit to the side, gets the ball
  const tg=snAimTarget(yaw); if(tg){ yaw=tg.yaw; el=tg.el; }
  P.yaw=yaw; const r=[-Math.sin(yaw),Math.cos(yaw)], o=[P.x+Math.cos(yaw)*0.35+r[0]*0.28,P.y+1.6,P.z+Math.sin(yaw)*0.35+r[1]*0.28], v=[Math.cos(yaw)*Math.cos(el)*sp,Math.sin(el)*sp,Math.sin(yaw)*Math.cos(el)*sp];
  snBallAdd(o,v,true); SN.armT=0; SN.st.t++; snSave(); snSnd('throw',0.25); if(MP.code) mpSend({t:'snb',p:o.map(x=>+x.toFixed(2)),v:v.map(x=>+x.toFixed(2))}); }
function snAimTarget(yaw){ const C=[], ox=P.x, oy=P.y+1.6, oz=P.z; if(MP.code) for(const p of MP.peers.values()){ const s=p.out; if(s&&s.m!=='menu'&&Number.isFinite(s.x)) C.push([s.x,s.y+1.1,s.z]); } for(const M of SN.men) if(M.down<=0) C.push([M.x,M.y+(M.prac?1.5:1.0),M.z]);
  let best=null; for(const c of C){ const dx=c[0]-ox, dz=c[2]-oz, d=Math.hypot(dx,dz); if(d<2||d>30) continue; let da=Math.atan2(dz,dx)-yaw; while(da>Math.PI) da-=2*Math.PI; while(da<-Math.PI) da+=2*Math.PI; if(Math.abs(da)>0.24) continue;
    const v2=19*19, dy=c[1]-oy, disc=v2*v2-SN_G*(SN_G*d*d+2*dy*v2); if(disc<0) continue; const el=Math.atan((v2-Math.sqrt(disc))/(SN_G*d)); const sc=Math.abs(da)+d*0.004; if(!best||sc<best.sc) best={sc,yaw:Math.atan2(dz,dx),el}; } return best; }
function snBallAdd(o,v,mine,who){ SN.balls.push({m:snBallMesh(),x:o[0],y:o[1],z:o[2],vx:v[0],vy:v[1],vz:v[2],t:0,mine,who}); }
function snBallsTick(dt){ for(let i=SN.balls.length-1;i>=0;i--){ const b=SN.balls[i]; let hit=null; const n=3, h=dt/n;
    for(let k=0;k<n&&!hit;k++){ b.vy-=SN_G*h; b.x+=b.vx*h; b.y+=b.vy*h; b.z+=b.vz*h; b.t+=h;
      for(const M of SN.men){ if(M.down>0) continue; if(Math.hypot(b.x-M.x,b.z-M.z)<0.5&&b.y>M.y&&b.y<M.y+1.75){ hit={k:'man',M}; break; } }
      if(!hit&&b.mine&&MP.code) for(const p of MP.peers.values()){ const s=p.out; if(!s||s.m==='menu'||!Number.isFinite(s.x)) continue; if(Math.hypot(b.x-s.x,b.z-s.z)<0.45&&b.y>s.y+0.2&&b.y<s.y+1.85){ hit={k:'peer',p}; break; } }
      if(!hit){ const g=groundAt(b.x,b.z,b.y+0.4); if(b.y<=g||bldAt(b.x,b.z,0.02)&&b.y<g+12||b.t>4) hit={k:'gnd'}; } }
    if(!hit){ b.m.position.set(b.x,b.y,b.z); continue; }
    SN.grp.remove(b.m); SN.balls.splice(i,1); snPuff(b.x,b.y,b.z,12,1.4); snSnd('plaf',Math.max(0.15,1-Math.hypot(b.x-P.x,b.z-P.z)/40));
    if(hit.k==='man') snManHit(hit.M,b.mine); else if(hit.k==='peer') snHitPeer(hit.p); } }
function snHitPeer(p){ const W0=SN.war, mate=W0&&W0.md==='eq'&&W0.tm[p.id]!==undefined&&W0.tm[p.id]===W0.tm[MP.id];
  mpSend({t:'snhit',w:W0?W0.id:0},p.id); SN.st.h++; snSave(); if(mate){ toast('¡Es de tu equipo!','A los de tu color no cuentan'); return; } if(W0&&W0.tm[p.id]!==undefined&&Date.now()<W0.end&&Date.now()>W0.go) W0.hits++; tip('¡Le has dado a '+esc(p.n||'tu amigo')+'!',1400); }
function snGotHit(p,o){ SN.splat=1.4; const e=$('snSplat'); if(e){ e.hidden=false; e.style.opacity=1; } snSnd('plaf',0.9); toast('¡Plaf!',esc(p.n||'Un amigo')+' te ha dado con una bola de nieve'); if(SN.war&&o.w===SN.war.id) SN.war.taken++; }
/* ---- snowmen: made where you stand still, targets for the snowballs ---- */
function snManMesh(seed){ const R=rng(seed|0), g=new THREE.Group(), w=new THREE.MeshLambertMaterial({color:Cc('#f4f7fb')}), blk=new THREE.MeshLambertMaterial({color:Cc('#222')});
  const sp=(r,y)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(r,14,10),w); m.position.y=y; m.scale.y=0.94; m.castShadow=true; g.add(m); return m; };
  sp(0.46,0.42); sp(0.34,1.02); const head=new THREE.Group(); head.position.y=1.5; g.add(head); const hd=new THREE.Mesh(new THREE.SphereGeometry(0.25,14,10),w); hd.castShadow=true; head.add(hd);
  const ns=new THREE.Mesh(new THREE.ConeGeometry(0.05,0.28,8),new THREE.MeshLambertMaterial({color:Cc('#f08a24')})); ns.rotation.z=-Math.PI/2; ns.position.set(0.36,0,0); head.add(ns);
  for(const z of [-0.09,0.09]){ const e=new THREE.Mesh(new THREE.SphereGeometry(0.035,6,4),blk); e.position.set(0.22,0.07,z); head.add(e); } for(let k=0;k<5;k++){ const a=(k-2)*0.28; const m=new THREE.Mesh(new THREE.SphereGeometry(0.022,5,4),blk); m.position.set(0.22*Math.cos(a)+0.01,-0.1+Math.abs(k-2)*0.025,0.22*Math.sin(a)); head.add(m); }
  for(const y of [0.88,1.05,1.2]){ const b=new THREE.Mesh(new THREE.SphereGeometry(0.035,6,4),blk); b.position.set(0.33,y-0.02,0); g.add(b); }
  const cols=['#d62828','#2f80ed','#2f9e44','#9b51e0','#f2994a'], c1=cols[(R()*5)|0], hatK=R()<0.5; const hat=new THREE.Group(); hat.position.y=0.2; head.add(hat);
  if(hatK){ const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.03,16),blk); hat.add(brim); const top=new THREE.Mesh(new THREE.CylinderGeometry(0.19,0.19,0.32,16),blk); top.position.y=0.17; hat.add(top); const band=new THREE.Mesh(new THREE.CylinderGeometry(0.195,0.195,0.06,16),new THREE.MeshLambertMaterial({color:Cc(c1)})); band.position.y=0.05; hat.add(band); }
  else { const b=new THREE.Mesh(new THREE.SphereGeometry(0.23,12,8,0,Math.PI*2,0,Math.PI/2),new THREE.MeshLambertMaterial({color:Cc(c1)})); b.position.y=-0.04; hat.add(b); const pom=new THREE.Mesh(new THREE.SphereGeometry(0.07,8,6),w); pom.position.y=0.2; hat.add(pom); }
  const sc=new THREE.Mesh(new THREE.TorusGeometry(0.22,0.06,6,16),new THREE.MeshLambertMaterial({color:Cc(cols[((R()*5)|0)])})); sc.rotation.x=Math.PI/2; sc.position.y=1.28; g.add(sc);
  const arm=new THREE.MeshLambertMaterial({color:Cc('#6b4a2b')}); for(const s of [-1,1]){ const a=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.025,0.7,5),arm); a.position.set(0,1.12,s*0.48); a.rotation.x=s*1.0; g.add(a); }
  g.userData.head=head; g.userData.hat=hat; return g; }
function snManAdd(x,z,yaw,seed,own,prac){ const y=groundAt(x,z,99), g=snManMesh(seed); g.position.set(x,y,z); g.rotation.y=-yaw; SN.grp.add(g); const M={x,y,z,yaw,g,head:g.userData.head,hat:g.userData.hat,down:0,own,prac:!!prac,t:0}; SN.men.push(M);
  const keep=SN.men.filter(m=>!m.prac); if(keep.length>30){ const o=keep[0]; SN.grp.remove(o.g); SN.men.splice(SN.men.indexOf(o),1); } return M; }
function snManHit(M,mine){ M.down=M.prac?1.0:7; M.dt=0; M.hv=[(Math.random()-0.5)*3,4,(Math.random()-0.5)*3]; if(!mine) return; SN.st.h++; snSave();
  if(SN.prac&&M.prac){ SN.prac.n++; blip('hit'); } else tip('¡Al muñeco!',900); }
function snMenTick(dt){ for(let i=SN.men.length-1;i>=0;i--){ const M=SN.men[i]; if(M.down<=0) continue; M.dt+=dt; const H=M.prac?M.head:M.hat; if(!H) continue;
    if(!M.hp){ M.hp=H.position.clone(); M.hr=H.rotation.clone(); } H.position.x+=M.hv[0]*dt; H.position.y+=M.hv[1]*dt-SN_G*M.dt*dt; H.position.z+=M.hv[2]*dt; H.rotation.z+=dt*6;
    if(H.position.y<-1.3) H.position.y=-1.3; M.down-=dt; if(M.down<=0){ if(M.prac){ SN.grp.remove(M.g); SN.men.splice(i,1); if(SN.prac) snPracSpawn(); } else { H.position.copy(M.hp); H.rotation.copy(M.hr); M.hp=null; } } } }
function snManFree(x,z){ if(bldAt(x,z,0.8)||W.poolAt(x,z)||W.surfAt(x,z)===5) return false; const g=W.terrain(x,z); if(g<W.waterLevel(x,z)+0.4||MG.ok&&mgGroundAt(x,z)!==null||typeof flPadY==='function'&&flPadY(x,z)!==null) return false; if(Math.abs(W.terrain(x+0.8,z)-g)>0.35||Math.abs(W.terrain(x,z+0.8)-g)>0.35) return false; for(const M of SN.men) if(Math.hypot(M.x-x,M.z-z)<1.4) return false; return true; }
function snManStart(){ if(SN.job) return; const x=P.x+Math.cos(P.yaw)*1.2, z=P.z+Math.sin(P.yaw)*1.2; if(!snManFree(x,z)){ toast('Muñeco de nieve','Aquí no cabe: busca un sitio llano y despejado'); return; }
  const b=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshLambertMaterial({color:Cc('#f4f7fb')})); b.scale.setScalar(0.1); b.position.set(x,groundAt(x,z,99)+0.1,z); SN.grp.add(b); SN.job={t:0,x,z,b,px:P.x,pz:P.z}; tip('Haciendo un muñeco de nieve…',1800); }
function snJobTick(dt){ const J=SN.job; if(!J) return; if(S.mode!=='walk'||Math.hypot(P.x-J.px,P.z-J.pz)>0.4){ SN.grp.remove(J.b); SN.job=null; return; } J.t+=dt; const r=0.1+Math.min(1,J.t/2.4)*0.36; J.b.scale.setScalar(r); J.b.position.y=groundAt(J.x,J.z,99)+r*0.9; J.b.rotation.z-=dt*3;
  if(J.t>=2.4){ SN.grp.remove(J.b); SN.job=null; const seed=(Math.random()*1e6)|0, yaw=Math.atan2(P.z-J.z,P.x-J.x); snManAdd(J.x,J.z,yaw,seed,'me'); snPuff(J.x,groundAt(J.x,J.z,99)+1,J.z,16); blip('cup'); SN.st.b++; snSave(); toast('¡Muñeco de nieve!','Ya llevas '+SN.st.b); if(SN.st.b>=5) prgTrophy('muneco');
    if(MP.code) mpSend({t:'snman',x:+J.x.toFixed(2),z:+J.z.toFixed(2),y:+yaw.toFixed(2),s:seed}); } }
/* ---- target practice: the snowman shooting gallery ---- */
function snPracStart(){ if(!NV.on) nvSet(true,{quiet:true}); if(S.mode!=='walk'){ toast('Diana de muñecos','Ponte de pie primero'); return; } $('nvSheet').hidden=true; SN.prac={t:60,n:0,i:0}; for(let k=0;k<5;k++) snPracSpawn(); toast('Diana de muñecos','60 segundos: tira bolas (botón ❄) y tira la cabeza de los muñecos'); }
function snPracSpawn(){ const Pr=SN.prac; if(!Pr) return; for(let tr=0;tr<40;tr++){ const a=P.yaw+(Math.random()-0.5)*1.6, d=8+Math.random()*12, x=P.x+Math.cos(a)*d, z=P.z+Math.sin(a)*d; if(snManFree(x,z)){ snManAdd(x,z,Math.atan2(P.z-z,P.x-x),(Math.random()*1e6)|0,'me',true); return; } } }
function snPracTick(dt){ const Pr=SN.prac; if(!Pr) return; Pr.t-=dt; if(Pr.t>0) return; SN.prac=null; for(let i=SN.men.length-1;i>=0;i--) if(SN.men[i].prac){ SN.grp.remove(SN.men[i].g); SN.men.splice(i,1); } snLoad(); const rec=Pr.n>SN.st.pr; if(rec) SN.st.pr=Pr.n; snSave();
  blip('cup'); toast('Diana: '+Pr.n+' aciertos',rec?'¡Nuevo récord!':'Tu récord: '+SN.st.pr); if(Pr.n>=3) prgEarn(Math.floor(Pr.n/3),'Diana de muñecos'); if(Pr.n>=15) prgTrophy('nieve'); }
/* ---- the snowball fight with the sala ---- */
function snWarStart(md){ if(!MP.code||!MP.peers.size){ toast('Guerra de bolas de nieve','Hace falta al menos un amigo en la sala. Mientras, prueba la diana de muñecos'); return; } if(!NV.on) nvSet(true,{quiet:true});
  const ids=[MP.id,...MP.peers.keys()].sort(), tm={}; ids.forEach((id,i)=>tm[id]=md==='eq'?i%2:i); const go=Date.now()+4000, id=1+((Math.random()*999999)|0);
  SN.war={id,md,go,end:go+120000,tm,host:MP.id,hits:0,taken:0}; mpSend({t:'snwar',id,md,go,end:go+120000,tm}); $('nvSheet').hidden=true; toast('¡Guerra de bolas de nieve!',(md==='eq'?'Por equipos: eres de los '+SN_TEAMN[tm[MP.id]]:'Todos contra todos')+'. Dos minutos: empieza en 4 segundos'); }
function snWarJoin(o){ if(!NV.on) nvSet(true,{quiet:true}); SN.war={id:o.id,md:o.md,go:o.go,end:o.end,tm:o.tm,host:o.host,hits:0,taken:0}; toast('¡A la guerra!',o.md==='eq'?'Eres de los '+SN_TEAMN[o.tm[MP.id]|0]:'Todos contra todos'); }
function snWarRows(){ const W0=SN.war; if(!W0) return []; const L=[{n:'Tú',h:W0.hits,tm:W0.tm[MP.id],me:1}]; for(const p of MP.peers.values()){ const s=p.out||p.cur; if(s&&s.nw&&s.nw[0]===W0.id) L.push({n:p.n||'Amigo',h:s.nw[1],tm:s.nw[2]}); } L.sort((a,b)=>b.h-a.h); return L; }
function snWarTick(){ const W0=SN.war; if(!W0) return; if(Date.now()<W0.end+8000&&!W0.done&&Date.now()>=W0.end){ W0.done=true; const L=snWarRows(); let win=false, txt='';
    if(W0.md==='eq'){ const t=[0,0]; for(const r of L) t[r.tm|0]+=r.h; const my=W0.tm[MP.id]|0; win=t[my]>t[1-my]; txt=SN_TEAMN[0]+' '+t[0]+' · '+SN_TEAMN[1]+' '+t[1]+(t[0]===t[1]?' · ¡Empate!':''); }
    else { win=L.length>1&&L[0].me&&L[0].h>(L[1]?L[1].h:-1); txt=L.slice(0,3).map((r,i)=>(i+1)+'.º '+r.n+' ('+r.h+')').join(' · '); }
    blip('cup'); toast(win?'¡Has ganado la guerra!':'Fin de la guerra',txt); prgEarn(3+(win?7:0),'Guerra de bolas de nieve'); if(win&&L.length>1) prgTrophy('nieve'); }
  if(Date.now()>W0.end+9000) SN.war=null; }
/* ---- a downhill race on a trail with the sala ---- */
function snChallenge(rack){ if(!MP.code||!MP.peers.size){ toast('Carrera en trineo','Hace falta al menos un amigo en la sala'); return; } const rid=1+((Math.random()*999999)|0), go=Date.now()+9000; mpSend({t:'snrace',rid,c:rack.c.id,go}); snRaceJoin(rid,rack,go,0); }
function snRaceJoin(rid,rack,go,slot){ SN.race={rid,c:rack.c,go,fin:0}; snGo(rack,{go,slot}); }
function snRaceRows(){ const R0=SN.race; if(!R0) return []; const L=[{n:'Tú',f:R0.fin,me:1,k:SN.sl&&SN.sl.c?SN.sl.k/R0.c.pts.length:1}]; for(const p of MP.peers.values()){ const s=p.out||p.cur; if(s&&s.nr&&s.nr[0]===R0.rid) L.push({n:p.n||'Amigo',f:s.nr[1],k:s.nr[2]/100}); }
  L.sort((a,b)=>(a.f>0?0:1)-(b.f>0?0:1)||(a.f>0&&b.f>0?a.f-b.f:b.k-a.k)); return L; }
/* ---- every frame ---- */
function snTick(dt,T){ if(!SN.ok) return; SN.cd=Math.max(0,SN.cd-dt); snBallsTick(dt); snMenTick(dt); snPuffTick(dt); snJobTick(dt); snPracTick(dt); snWarTick();
  if(S.mode==='walk'&&!P.swim&&P.onGround!==false&&!inp.mx&&!inp.my&&!SN.job) SN.still+=dt; else SN.still=0;
  if(SN.armT>=0&&rig){ SN.armT+=dt; const f=SN.armT/0.38; rig.aR.sg.rotation.z=f<0.35?-1.4*f/0.35:-1.4+3.2*Math.min(1,(f-0.35)/0.4); if(f>=1) SN.armT=-1; }
  if(SN.splat>0){ SN.splat-=dt; const e=$('snSplat'); if(e){ e.style.opacity=Math.max(0,Math.min(1,SN.splat)); if(SN.splat<=0) e.hidden=true; } }
  if(S.mode!=='sled'&&SN.sl) snLeave(true); if(SN.race&&Date.now()>SN.race.go+300000) SN.race=null;
  SN.hudT-=dt; if(SN.hudT<=0){ SN.hudT=0.25; snHud(); } snBtn(); }
function snHud(){ const e=$('snHud'); if(!e) return; let h=''; const L=SN.sl;
  if(SN.race&&(L||SN.race.fin)){ const w=SN.race.go-Date.now(); if(w>0) h+='<b>Carrera: '+(w>3000?'preparados…':Math.ceil(w/1000))+'</b>'; else { h+='<b>Carrera · '+esc(SN.race.c.n)+'</b>'+snRaceRows().map((r,i)=>'<div'+(r.me?' class="me"':'')+'>'+(i+1)+'.º '+esc(r.n)+' <span>'+(r.f>0?kartFmt(r.f):r.f<0?'fuera':Math.round(r.k*100)+' %')+'</span></div>').join(''); } }
  else if(L&&L.c&&L.run){ const b=SN.best[L.c.id]; h+='<b>'+esc(L.c.n)+'</b><div>'+kartFmt(L.rt*1000)+(b?' <span>récord '+kartFmt(b)+'</span>':'')+'</div>'; }
  if(SN.war){ const W0=SN.war, w=W0.go-Date.now(), left=Math.max(0,W0.end-Date.now()); h+='<b>Guerra de bolas de nieve · '+(w>0?'empieza en '+Math.ceil(w/1000):W0.done?'final':kartFmt(left).replace(/\.\d$/,''))+'</b>';
    const R=snWarRows(); if(W0.md==='eq'){ const t=[0,0]; for(const r of R) t[r.tm|0]+=r.h; h+='<div><i style="background:'+SN_TEAM[0]+'"></i>'+SN_TEAMN[0]+' <span>'+t[0]+'</span> · <i style="background:'+SN_TEAM[1]+'"></i>'+SN_TEAMN[1]+' <span>'+t[1]+'</span></div>'; }
    h+=R.map((r,i)=>'<div'+(r.me?' class="me"':'')+'>'+(W0.md==='eq'?'<i style="background:'+SN_TEAM[r.tm|0]+'"></i>':(i+1)+'.º ')+esc(r.n)+' <span>'+r.h+'</span></div>').join(''); }
  if(SN.prac) h+='<b>Diana de muñecos · '+Math.ceil(SN.prac.t)+' s</b><div>Aciertos <span>'+SN.prac.n+'</span>'+(SN.st.pr?' · récord '+SN.st.pr:'')+'</div>';
  e.innerHTML=h; e.hidden=!h||S.mode==='menu'; if(!e.hidden){ const a=!$('mpBar').hidden?$('mpBar'):$('mapBox'), r=a&&a.getBoundingClientRect(); if(r&&r.height>0) e.style.top=Math.round(r.bottom+8)+'px'; } }
function snBtn(){ const b=$('bSnow'); if(!b) return; const on=!!(NV.on&&S.mode==='walk'&&!S.interior); if(b.hidden===on) b.hidden=!on; }
// actions near you: a sled rack, or making a snowman where you have stood still on flat snow
function snNear(){ if(!NV.on||!SN.ok||S.mode!=='walk'||P.swim) return null; for(const r of SN.racks) if(Math.hypot(P.x-r.x,P.z-r.z)<3) return {k:'snSled',ref:r,label:'Coger un trineo'};
  if(SN.still>1.2&&!SN.job&&!SN.prac&&snManFree(P.x+Math.cos(P.yaw)*1.2,P.z+Math.sin(P.yaw)*1.2)) return {k:'snMan',label:'Hacer un muñeco de nieve'}; return null; }
function snDo(k,ref){ ensureAudio(); if(k==='snSled') snGo(ref,{}); else if(k==='snMan') snManStart(); else if(k==='snOff'){ snRunVoid(''); snLeave(); } }
function snEndAll(){ snLeave(); SN.prac=null; SN.war=null; SN.race=null; if(SN.job){ SN.grp.remove(SN.job.b); SN.job=null; } for(let i=SN.men.length-1;i>=0;i--) if(SN.men[i].prac){ SN.grp.remove(SN.men[i].g); SN.men.splice(i,1); } const e=$('snHud'); if(e) e.hidden=true; }
/* ---- the sala ---- */
function snNetState(o){ const L=SN.sl; if(S.mode==='sled'&&L) o.nv=[1,Math.round(L.yaw*100),Math.round(L.pitch*100),Math.round(L.roll*100)]; if(SN.war) o.nw=[SN.war.id,SN.war.hits,SN.war.tm[MP.id]|0];
  if(SN.race) o.nr=[SN.race.rid,SN.race.fin|0,Math.round((L&&L.c?L.k/SN.race.c.pts.length:1)*100)]; }
function snOK(a,n){ return Array.isArray(a)&&a.length===n&&a.every(v=>Number.isFinite(v)&&Math.abs(v)<1e7)?a:null; }
function snNetIn(p,o){ if(!WP.navidad) return; nvBuild();
  if(o.t==='snb'&&snOK(o.p,3)&&snOK(o.v,3)) snBallAdd(o.p,o.v,false,p.id);
  else if(o.t==='snhit') snGotHit(p,o);
  else if(o.t==='snman'&&[o.x,o.z,o.y,o.s].every(Number.isFinite)){ if(!NV.on) return; snManAdd(o.x,o.z,o.y,o.s,p.id); }
  else if(o.t==='snwar'&&o.tm&&Number.isFinite(o.id)&&o.tm[MP.id]!==undefined) mpPrompt('<b>'+esc(p.n)+'</b> empieza una <b>guerra de bolas de nieve</b> ('+(o.md==='eq'?'por equipos':'todos contra todos')+', 2 minutos). ¿Juegas?','Jugar',()=>snWarJoin(Object.assign({},o,{host:p.id})),Math.max(3000,o.go-Date.now()+20000));
  else if(o.t==='snrace'&&Number.isFinite(o.rid)){ const rk=SN.racks.find(r=>r.c.id===o.c); if(!rk) return; const slot=1+([...MP.peers.keys()].indexOf(p.id)+1)%3; mpPrompt('<b>'+esc(p.n)+'</b> te reta a una <b>bajada en trineo</b> por la '+esc(rk.c.n)+'. ¿Corres?','Correr',()=>snRaceJoin(o.rid,rk,Math.max(o.go,Date.now()+3500),slot),Math.max(3000,o.go-Date.now())); } }
function snPeer(p,s,R,inWorld,showRig,dt){ const on=inWorld&&showRig&&s.m==='sled'&&s.nv; if(!on){ if(p.snM) p.snM.visible=false; return; } if(!p.snM){ p.snM=snSledMesh(); scene.add(p.snM); }
  const M=p.snM; M.visible=true; M.position.set(s.x,s.y+0.32,s.z); M.rotation.order='YZX'; M.rotation.set(s.nv[3]/100,-s.nv[1]/100,s.nv[2]/100); }
/* ---- the sheet tabs, map, legend, guide and glossary ---- */
function snTabSled(){ const st=snStats(); let h='<p>Siéntate en un <b>trineo</b> y baja por las lomas nevadas. Hay trineos en lo alto de las sendas de bajada (las de las bicis), con reloj y medallas; también puedes sentarte donde estés con <b>Trineo aquí</b>.</p>';
  h+='<div class="tablewrap"><table class="card"><thead><tr><th>Pista</th><th>Récord</th><th>Medalla</th><th></th></tr></thead><tbody>'+SN.racks.map((r,i)=>{ const b=SN.best[r.c.id], md=b?snMedal(b,r):''; return '<tr><td><b>'+esc(r.c.n)+'</b><br><small>'+fmt(r.c.len)+' m · '+fmt(r.c.drop)+' m de bajada</small></td><td class="num">'+(b?kartFmt(b):'–')+'</td><td>'+(md?{oro:'🥇 oro',plata:'🥈 plata',bronce:'🥉 bronce'}[md]:'–')+'</td><td><button class="btn small primary" data-sng="'+i+'">Bajar</button>'+(MP.code&&MP.peers.size?' <button class="btn small" data-snc="'+i+'">Retar a la sala</button>':'')+'</td></tr>'; }).join('')+'</tbody></table></div>';
  h+='<div class="row"><button class="btn small" id="snHere">Trineo aquí</button></div><h3>Cómo se lleva</h3><ul><li><b>Joystick a los lados</b>: girar. <b>Atrás</b>: frenar con los pies. <b>Adelante</b> en llano: empujar con las manos.</li><li><b>Saltar</b>: un bote. En las rampas de madera y en los cambios de pendiente sales volando; si caes muy fuerte o chocas deprisa, te caes un momento.</li><li>El reloj empieza al salir y para en el arco de cuadros. Medallas: oro, plata y bronce según lo cerca que estés de la bajada perfecta. El oro da el trofeo «Oro en trineo».</li><li><b>Retar a la sala</b>: todos salís a la vez, uno al lado del otro, y arriba se ve la clasificación.</li></ul>'; return h; }
function snTabSnow(){ const st=snStats(), inSala=MP.code&&MP.peers.size; let h='<h3>Bolas de nieve</h3><p>Con la Navidad encendida y a pie, el botón <b>❄ Bola</b> (tecla G, L1 en el mando) lanza una bola hacia donde miras. Los amigos de la sala ven tus bolas y notan cuando les das.</p>';
  h+='<h3>Guerra de bolas de nieve</h3><p>Con la sala, 2 minutos. <b>Todos contra todos</b>: gana quien más da. <b>Por equipos</b>: Rojos contra Azules; a los de tu equipo no cuenta.</p><div class="row"><button class="btn small'+(SN.md==='ffa'?' primary':'')+'" data-snm="ffa">Todos contra todos</button><button class="btn small'+(SN.md==='eq'?' primary':'')+'" data-snm="eq">Por equipos</button></div><div class="row"><button class="btn small primary" id="snWar"'+(inSala?'':' disabled')+'>Empezar la guerra</button></div>'+(inSala?'':'<p class="note">Hace falta al menos un amigo en la sala (botón Con amigos del inicio).</p>');
  h+='<h3>Diana de muñecos</h3><p>Solo o con amigos: salen 5 muñecos delante de ti; tírales la cabeza en 60 segundos. Cada 3 aciertos, 1 moneda; 15 dan el trofeo «Rey de la nieve».</p><div class="row"><button class="btn small primary" id="snPrac">Empezar la diana</button></div><p class="note">Tu récord: '+st.pr+' aciertos.</p>';
  h+='<h3>Muñecos de nieve</h3><p>Quédate quieto un momento en un sitio llano y despejado y pulsa <b>Hacer un muñeco de nieve</b>: ruedas una bola y sale un muñeco con bufanda y gorro. Tus amigos lo ven. Has hecho <b>'+st.built+'</b>; con 5, trofeo «Escultor de nieve». Si le das con una bola, se le cae el gorro.</p>'; return h; }
function snTabWire(){ const B=$('nvBody'); B.querySelectorAll('[data-sng]').forEach(b=>b.onclick=()=>snGo(SN.racks[+b.dataset.sng],{})); B.querySelectorAll('[data-snc]').forEach(b=>b.onclick=()=>snChallenge(SN.racks[+b.dataset.snc]));
  const h=$('snHere'); if(h) h.onclick=()=>{ $('nvSheet').hidden=true; snHere(); }; B.querySelectorAll('[data-snm]').forEach(b=>b.onclick=()=>{ SN.md=b.dataset.snm; nvSheet('nieve'); });
  const w=$('snWar'); if(w) w.onclick=()=>snWarStart(SN.md); const pr=$('snPrac'); if(pr) pr.onclick=snPracStart; }
function snDrawMap(g,m2c,s,big){ for(const r of SN.racks){ const [x,y]=m2c(r.x,r.z), R=(big?4.5:3)*s; g.fillStyle='#2f80ed'; g.strokeStyle='#fff'; g.lineWidth=1.3*s; g.beginPath(); g.arc(x,y,R,0,7); g.fill(); g.stroke(); if(big){ g.fillStyle='#fff'; g.font='900 '+(7*s)+'px system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('❄',x,y+0.5*s); } } }
function snLegend(){ return SN.racks.length?'<div><i style="background:#2f80ed;border:2px solid #fff;border-radius:50%"></i>Trineos: salida de las pistas de bajada</div>':''; }
function snGuideHTML(){ return '<li><b>Trineo</b>: en lo alto de las sendas de bajada hay trineos (<b>Coger un trineo</b>); joystick para girar, atrás frena, Saltar bota. Reloj, récord y medallas, y carreras con la sala (pestaña Trineo de la hoja Navidad).</li><li><b>Bolas de nieve</b>: botón <b>❄ Bola</b> (tecla G, L1). <b>Guerra</b> con la sala, todos contra todos o por equipos, 2 minutos; <b>diana de muñecos</b> de 60 s; y <b>muñecos de nieve</b>: quieto en un sitio llano, <b>Hacer un muñeco de nieve</b>.</li>'; }
function snGlossHTML(){ return '<dt>Trineo</dt><dd>Asiento con patines para deslizarse por la nieve cuesta abajo.</dd><dt>Guerra de bolas de nieve</dt><dd>Juego de lanzarse bolas de nieve; aquí cuenta cuántas veces das a los demás.</dd><dt>Muñeco de nieve</dt><dd>Figura de dos o tres bolas de nieve, con nariz de zanahoria, botones y gorro.</dd><dt>Diana</dt><dd>Blanco al que se apunta: aquí, las cabezas de los muñecos.</dd>'; }
TRO.push({id:'trineo',n:'Oro en trineo',how:'Baja una pista en trineo con medalla de oro (Navidad).',m:'g',c:20,w:'xmas'},
  {id:'nieve',n:'Rey de la nieve',how:'Gana una guerra de bolas de nieve con la sala o acierta 15 en la diana de muñecos.',m:'s',c:15,w:'xmas'},
  {id:'muneco',n:'Escultor de nieve',how:'Haz 5 muñecos de nieve.',m:'b',c:10,w:'xmas'},
  {id:'reyes',n:'Noche de Reyes',how:'Abre todos los regalos de Reyes de las villas.',m:'g',c:25,w:'xmas'});
