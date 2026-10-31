
/* ================= tennis and padel: the courts of OpenStreetMap in 3D, and a game against a friend ================= */
const CTM={};
function courtMats(){ if(CTM.lines) return CTM; const L=c=>new THREE.MeshLambertMaterial({color:Cc(c)});
  Object.assign(CTM,{turfG:L('#3f8a50'),turfB:L('#2f62a0'),clay:L('#b8663f'),hardB:L('#2e5f8e'),hardG:L('#3f7f57'),rim:L('#4f7c5c'),lines:L('#f4f4ef'),dark:L('#24292c')});
  CTM.net=new THREE.MeshLambertMaterial({color:Cc('#15191b'),transparent:true,opacity:0.62,side:THREE.DoubleSide,depthWrite:false});
  CTM.glass=new THREE.MeshLambertMaterial({color:Cc('#d9eef5'),transparent:true,opacity:0.2,side:THREE.DoubleSide,depthWrite:false});
  const mt=canvasTex(64,64,(g,w,h)=>{ g.clearRect(0,0,w,h); g.strokeStyle='rgba(36,40,42,1)'; g.lineWidth=2.4; g.beginPath(); for(let k=-64;k<=128;k+=16){ g.moveTo(k,0); g.lineTo(k+64,64); g.moveTo(k,64); g.lineTo(k+64,0); } g.stroke(); },true);
  CTM.fence=new THREE.MeshLambertMaterial({map:mt,transparent:true,alphaTest:0.3,side:THREE.DoubleSide}); return CTM; }
// court-local frame: u along the long side, v across; with flip the player always plays from the u<0 half
function cW(C,u,v,flip){ const f=flip||1; return [C.c[0]+(C.ux*u+C.vx*v)*f, C.c[1]+(C.uz*u+C.vz*v)*f]; }
function cL(C,x,z,flip){ const f=flip||1, dx=x-C.c[0], dz=z-C.c[1]; return [(dx*C.ux+dz*C.uz)*f,(dx*C.vx+dz*C.vz)*f]; }
const RKD={padel:{n:'pádel',HL:10,HW:5,net:0.88,svc:6.95,e:0.74,f:0.86,spd:4.7,reach:1.45,walls:true,drive:16,lob:7.2},
  tennis:{n:'tenis',HL:11.885,HW:4.115,net:0.94,svc:6.4,e:0.72,f:0.85,spd:5.2,reach:1.55,walls:false,drive:22,lob:8.5}};
function buildCourts(){ if(!W.COURTS||!W.COURTS.length) return; const M=courtMats(); const up=[0,1,0];
  const G={}; for(const k of ['turfG','turfB','clay','hardB','hardG','rim','lines','dark','net','glass']) G[k]=new GB(false); G.fence=new GB(true);
  for(const C of W.COURTS){ const y=C.y+0.03; const P=(u,v,h)=>{ const p=cW(C,u,v); return [p[0],h,p[1]]; };
    const flat=(gb,u0,u1,v0,v1,h)=>gb.quad(P(u0,v0,h),P(u1,v0,h),P(u1,v1,h),P(u0,v1,h),up);
    const line=(u0,v0,u1,v1,w)=>{ const du=u1-u0, dv=v1-v0, L=Math.hypot(du,dv)||1, nu=-dv/L*w/2, nv=du/L*w/2; G.lines.quad(P(u0+nu,v0+nv,y+0.008),P(u1+nu,v1+nv,y+0.008),P(u1-nu,v1-nv,y+0.008),P(u0-nu,v0-nv,y+0.008),up); };
    const wall=(gb,u0,v0,u1,v1,h0,h1)=>{ const a=P(u0,v0,y+h0), b=P(u1,v1,y+h0), c=P(u1,v1,y+h1), d=P(u0,v0,y+h1); const dx=b[0]-a[0], dz=b[2]-a[2], L=Math.hypot(dx,dz)||1; const n=[-dz/L,0,dx/L];
      if(gb.u) gb.quad(a,b,c,d,n,[0,h0],[L,h0],[L,h1],[0,h1]); else gb.quad(a,b,c,d,n); };
    const post=(u,v,h)=>{ const p=cW(C,u,v); G.dark.box(p[0],y,p[1],0.07,h,0.07,C.a); };
    if(C.k==='padel'){ const D=RKD.padel; flat(C.s==='blue'?G.turfB:G.turfG,-D.HL,D.HL,-D.HW,D.HW,y);
      for(const s of [-1,1]){ line(s*D.svc,-D.HW,s*D.svc,D.HW,0.05); }
      line(-D.svc,0,D.svc,0,0.05);
      for(const s of [-1,1]){ wall(G.glass,s*D.HL,-D.HW,s*D.HL,D.HW,0,3); wall(G.fence,s*D.HL,-D.HW,s*D.HL,D.HW,3,4);
        for(const t of [-1,1]){ wall(G.glass,s*D.HL,t*D.HW,s*8,t*D.HW,0,3); wall(G.glass,s*8,t*D.HW,s*6,t*D.HW,0,2); wall(G.fence,s*8,t*D.HW,s*6,t*D.HW,2,3); wall(G.fence,s*6,t*D.HW,0,t*D.HW,0,3); }
        for(let v=-D.HW;v<=D.HW+0.01;v+=2) post(s*D.HL,v,4); }
      for(const t of [-1,1]) for(let u=-D.HL+2;u<D.HL-0.01;u+=2) post(u,t*D.HW,3);
      wall(G.net,0,-D.HW,0,D.HW,0.05,D.net); G.lines.box(...(()=>{ const p=cW(C,0,0); return [p[0],y+D.net-0.05,p[1]]; })(),0.04,0.06,D.HW*2,C.a);
    } else { const D=RKD.tennis, HD=5.485; const Lf=Math.max(34,Math.min(40,C.L)), Wf=Math.max(16.5,Math.min(21,C.W));
      const outer=C.s==='clay'?G.clay:G.rim, inner=C.s==='clay'?G.clay:C.s==='blue'?G.hardB:G.hardG;
      flat(outer,-Lf/2,Lf/2,-Wf/2,Wf/2,y-0.004); flat(inner,-D.HL,D.HL,-HD,HD,y);
      for(const s of [-1,1]){ line(s*D.HL,-HD,s*D.HL,HD,0.1); line(-D.HL,s*HD,D.HL,s*HD,0.05); line(-D.HL,s*D.HW,D.HL,s*D.HW,0.05); line(s*D.svc,-D.HW,s*D.svc,D.HW,0.05); line(s*D.HL,0,s*(D.HL-0.1),0,0.05); }
      line(-D.svc,0,D.svc,0,0.05);
      wall(G.net,0,-6.4,0,6.4,0.05,0.97); G.lines.box(...(()=>{ const p=cW(C,0,0); return [p[0],y+0.92,p[1]]; })(),0.04,0.06,12.8,C.a); for(const t of [-1,1]) post(0,t*6.4,1.07);
      for(const s of [-1,1]){ wall(G.fence,s*Lf/2,-Wf/2,s*Lf/2,Wf/2,0,3.5); wall(G.fence,-Lf/2,s*Wf/2,Lf/2,s*Wf/2,0,3.5); }
      for(let u=-Lf/2;u<=Lf/2+0.01;u+=3.4) for(const t of [-1,1]) post(u,t*Wf/2,3.5); for(let v=-Wf/2+3.4;v<Wf/2;v+=3.4) for(const s of [-1,1]) post(s*Lf/2,v,3.5); } }
  for(const k in G){ const m=G[k].mesh(M[k],k==='dark'||k==='fence'); if(m&&(k==='glass'||k==='net')) m.renderOrder=2; } }

/* ---- the game ---- */
const RK={C:null,D:null,flip:1,me:null,ai:null,ball:null,score:null,phase:'',server:0,hitter:-1,bounces:0,wallBefore:false,serve:false,netHit:false,queue:null,press:0,level:1,msgT:0,toGames:4,mesh:null,shadow:null,rackets:[]};
const RK_LEVEL=[{n:'Fácil',spd:0.7,err:1.6,reach:1.45,miss:0.2,react:0.5},{n:'Normal',spd:0.85,err:1.05,reach:1.15,miss:0.1,react:0.34},{n:'Difícil',spd:1.0,err:0.6,reach:1.05,miss:0.045,react:0.2}];
function rkRacket(R){ const g=new THREE.Group(); const M=c=>new THREE.MeshLambertMaterial({color:Cc(c)});
  const h=new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.018,0.2,6),M('#1d1f22')); h.position.y=-0.08; g.add(h);
  const head=new THREE.Mesh(RK.C&&RK.C.k==='padel'?new THREE.CylinderGeometry(0.13,0.13,0.035,14):new THREE.TorusGeometry(0.13,0.012,6,18),M(RK.C&&RK.C.k==='padel'?'#d6442a':'#2a6f87'));
  head.scale.set(1,1,1.25); if(RK.C&&RK.C.k==='padel') head.rotation.x=Math.PI/2; head.position.y=-0.32; g.add(head); g.position.y=-0.28; R.aR.el.add(g); RK.rackets.push(g); return g; }
function startRacket(C){ if(P.buggy) exitBuggy(); if(S.interior) exitVilla(); const D=Object.assign({},RKD[C.k]); if(C.s==='clay'){ D.f=0.78; D.e=0.7; }
  RK.C=C; RK.D=D; const [u0]=cL(C,P.x,P.z); RK.flip=u0>0?-1:1; RK.score={pts:[0,0],games:[0,0]}; RK.server=0; RK.queue=null; RK.over=false;
  RK.me={u:-D.HL+1.2,v:0.5,anim:'idle',sw:0,mv:0}; const L=RK_LEVEL[RK.level];
  // the rival: a friend's avatar when there are some, otherwise one of the characters
  let skin=null, name='Rival'; const pool=(typeof AVS!=='undefined'?AVS:[]).filter(a=>a.id!==S.av); if(pool.length){ const a=pool[(Math.random()*pool.length)|0]; skin=avSkin(a); name=a.n; } else { const i=(S.skin+1+((Math.random()*4)|0))%SKINS.length; skin=SKINS[i]; name=SKINS[i].n; }
  const R=buildRig(Object.assign({},skin,{pack:null})); scene.add(R.root); RK.ai={u:D.HL-1.2,v:-0.5,rig:R,name,anim:'idle',sw:0,react:0,mv:0};
  RK.rackets=[]; rkRacket(rig); rkRacket(R); if(rig.club) rig.club.visible=false;
  if(!RK.mesh){ RK.mesh=new THREE.Mesh(new THREE.SphereGeometry(0.075,12,8),new THREE.MeshLambertMaterial({color:Cc('#e9f24a'),emissive:Cc('#3a3d00')})); RK.mesh.castShadow=true; scene.add(RK.mesh);
    RK.shadow=new THREE.Mesh(new THREE.CircleGeometry(0.09,12),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.3,depthWrite:false})); RK.shadow.rotation.x=-Math.PI/2; scene.add(RK.shadow); }
  RK.mesh.visible=RK.shadow.visible=true; RK.ball={u:0,y:1,v:0,vu:0,vy:0,vv:0,live:false};
  rkNewPoint(); setMode('racket'); S.snap=true; rkHUD(); tip('Joystick o WASD para moverte (sin tocarlo, corres solo hacia la bola) · GOLPEAR cuando llegue la bola; mantén para un globo · inclina el joystick a un lado para dirigir',6500); }
function exitRacket(){ const C=RK.C, D=RK.D; if(!C) return; for(const g of RK.rackets) if(g.parent) g.parent.remove(g); RK.rackets=[]; if(RK.ai){ scene.remove(RK.ai.rig.root); RK.ai=null; }
  RK.mesh.visible=RK.shadow.visible=false; const p=cW(C,0,(C.k==='padel'?D.HW:Math.max(8.5,C.W/2))+1.6,RK.flip); P.x=p[0]; P.z=p[1]; P.y=groundAt(P.x,P.z,999); P.vx=P.vz=P.vy=0; RK.C=null; setMode('walk'); S.snap=true; }
function rkNewPoint(){ const D=RK.D, b=RK.ball; const tot=RK.score.pts[0]+RK.score.pts[1]; const sv=(tot%2===0?1:-1)*D.HW*0.42; const su=-(D.walls?D.svc+0.6:D.HL+0.4);
  RK.phase='serve'; RK.hitter=-1; RK.bounces=0; RK.wallBefore=false; RK.serve=true; RK.netHit=false; RK.faults=RK.faults||0; RK.serveT=0;
  if(RK.server===0){ RK.me.u=su; RK.me.v=sv; RK.ai.u=D.walls?D.HL-1.5:D.HL+0.5; RK.ai.v=-sv*0.9; } else { RK.ai.u=-su; RK.ai.v=-sv; RK.me.u=D.walls?-D.HL+1.5:-D.HL-0.5; RK.me.v=sv*0.9; }
  const s=RK.server===0?RK.me:RK.ai; b.u=s.u+(RK.server===0?0.35:-0.35); b.v=s.v+0.25; b.y=1.0; b.vu=b.vv=b.vy=0; b.live=false; rkHUD(); }
// ballistic shot from the ball to a target on the floor: flat (horizontal speed) or lob (apex height); keeps the net cleared
function rkLaunch(tu,tv,mode,val){ const b=RK.ball, D=RK.D, g=9.81; const du=tu-b.u, dv=tv-b.v, dist=Math.hypot(du,dv);
  for(let k=0;k<14;k++){ let vy,T;
    if(mode==='lob'){ const H=Math.max(val,b.y+0.4); const t1=Math.sqrt(2*(H-b.y)/g), t2=Math.sqrt(2*H/g); T=t1+t2; vy=g*t1; }
    else { T=dist/val; vy=(0.035-b.y+0.5*g*T*T)/T; }
    const vu=du/T, vv=dv/T; const tn=(0-b.u)/vu; const yn=b.y+vy*tn-0.5*g*tn*tn;
    if(!(tn>0&&tn<T)||yn>D.net+0.22){ b.vu=vu; b.vv=vv; b.vy=vy; return; }
    if(mode==='lob') val+=0.8; else val*=0.9; }
  b.vu=du*0.7; b.vv=dv*0.7; b.vy=6; }
function rkHit(who,type,q){ const D=RK.D, b=RK.ball, L=RK_LEVEL[RK.level]; const s=who===0?1:-1; // the side the ball goes to
  // tu: depth into the other half; tv: lateral position in court coordinates (+v is the right of the player at u<0)
  const opp=who===0?RK.ai:RK.me; let tv, tu, err;
  if(who===0){ const dir=Math.abs(inp.mx)>0.15?inp.mx:null; tv=dir!==null?dir*D.HW*0.82:clamp(-opp.v*0.75+(Math.random()-0.5)*2.2,-D.HW*0.8,D.HW*0.8);
    tu=type==='lob'?D.HL*0.8:D.HL*(0.5+Math.random()*0.3); err=0.3+(1-q)*1.5; }
  else { tv=clamp(-opp.v*0.8+gauss()*1.4,-D.HW*0.85,D.HW*0.85); tu=(type==='lob'?D.HL*0.82:D.HL*(0.48+Math.random()*0.34)); err=L.err*(1.5-q*0.7); if(q<0.7&&Math.random()<0.12*(1-q)/0.3) tu=-0.6; }
  if(RK.serve){ const sv=who===0?RK.me.v:RK.ai.v; tu=D.svc*(0.55+Math.random()*0.25); tv=-Math.sign(sv||1)*D.HW*0.48; err=0.25; }
  tu+=gauss()*err*0.7; tv+=gauss()*err;
  if(D.walls&&!RK.serve) tu=Math.min(tu,D.HL-1.2);
  const T=[s*tu,tv];
  if(RK.serve&&!D.walls) rkLaunch(T[0],T[1],'flat',D.drive*(0.9+q*0.15)); else if(RK.serve) rkLaunch(T[0],T[1],'lob',2.1);
  else if(type==='lob') rkLaunch(T[0],T[1],'lob',D.lob); else rkLaunch(T[0],T[1],'flat',D.drive*(0.82+q*0.3));
  if(who===0) RK.ai.react=L.react+Math.random()*0.18;
  RK.hitter=who; RK.bounces=0; RK.wallBefore=false; RK.netHit=false; b.live=true; RK.phase='rally'; RK.shot=(RK.shot||0)+1; (who===0?RK.me:RK.ai).sw=0.32; pok(0.9); }
function rkCanHit(who){ const b=RK.ball, p=who===0?RK.me:RK.ai, L=RK_LEVEL[RK.level]; if(RK.phase!=='rally'||!b.live||RK.hitter===who) return 0;
  if(RK.serve&&RK.bounces===0) return 0; if((who===0)!==(b.u<0)) return 0; const reach=RK.D.reach*(who===0?L.reach:1);
  const d=Math.hypot(b.u-p.u,b.v-p.v); if(d>reach||b.y>2.7||b.y<0.04) return 0; return 1-0.55*clamp((d-0.45)/(reach-0.45),0,1); }
// where can a player reach the ball: run a copy of the ball forward
function rkPredict(who){ const b=RK.ball, D=RK.D; if(!b.live) return null; const s={...b}; let bn=RK.bounces, prevU=s.u;
  for(let i=0;i<300;i++){ const dt=1/60; s.vy-=9.81*dt; s.u+=s.vu*dt; s.v+=s.vv*dt; s.y+=s.vy*dt;
    if(s.y<=0.035&&s.vy<0){ s.y=0.035; s.vy=-s.vy*D.e; s.vu*=D.f; s.vv*=D.f; if((s.u<0)===(who===0)) bn++; }
    if(D.walls){ if(Math.abs(s.u)>D.HL-0.04&&s.y<3){ s.u=Math.sign(s.u)*(D.HL-0.04); s.vu*=-0.72; } if(Math.abs(s.v)>D.HW-0.04&&s.y<3){ s.v=Math.sign(s.v)*(D.HW-0.04); s.vv*=-0.6; } }
    const mine=(s.u<0)===(who===0); if(mine&&bn>=1&&s.y<1.3&&s.y>0.25&&s.vy<1) return {u:s.u,v:s.v,t:i*dt}; if(bn>=2) break; }
  return null; }
function rkStep(dt){ const D=RK.D, b=RK.ball, L=RK_LEVEL[RK.level];
  // me: the stick moves me; with the stick free I run to where the ball will be
  const me=RK.me; let mu=0, mv=0; const manual=Math.hypot(inp.mx,inp.my)>0.12;
  if(manual){ mu=inp.my; mv=inp.mx; } else if(RK.phase==='rally'&&RK.hitter===1){ const pr=rkPredict(0); if(pr){ const du=pr.u-me.u-0.35, dv=pr.v-0.45-me.v; const l=Math.hypot(du,dv); if(l>0.25){ mu=du/l*Math.min(1,l); mv=dv/l*Math.min(1,l); } } }
  else if(RK.phase==='rally'&&RK.hitter===0){ const du=-(D.walls?D.HL-2.5:D.HL-0.5)-me.u, dv=-me.v*0.6; const l=Math.hypot(du,dv); if(l>0.4){ mu=du/l*0.6; mv=dv/l*0.6; } }
  const sp=D.spd; me.mv=Math.hypot(mu,mv); me.u=clamp(me.u+mu*sp*dt,-(D.walls?D.HL-0.3:D.HL+5),-0.4); me.v=clamp(me.v+mv*sp*dt,-(D.walls?D.HW-0.3:D.HW+3),D.walls?D.HW-0.3:D.HW+3);
  // rival
  const ai=RK.ai; let au=0, av=0; ai.react-=dt;
  if(RK.phase==='rally'&&RK.hitter===0&&ai.react<=0){ const pr=rkPredict(1); if(pr){ const du=pr.u+0.35-ai.u, dv=pr.v+0.45-ai.v; const l=Math.hypot(du,dv); if(l>0.2){ au=du/l*Math.min(1,l); av=dv/l*Math.min(1,l); } } }
  else if(RK.phase==='rally'&&RK.hitter===1){ const du=(D.walls?D.HL-2.5:D.HL-0.5)-ai.u, dv=-ai.v*0.6; const l=Math.hypot(du,dv); if(l>0.4){ au=du/l*0.6; av=dv/l*0.6; } }
  ai.mv=Math.hypot(au,av); ai.u=clamp(ai.u+au*D.spd*L.spd*dt,0.4,D.walls?D.HL-0.3:D.HL+5); ai.v=clamp(ai.v+av*D.spd*L.spd*dt,-(D.walls?D.HW-0.3:D.HW+3),D.walls?D.HW-0.3:D.HW+3);
  // serve
  if(RK.phase==='serve'){ RK.serveT+=dt; const s=RK.server===0?me:ai; b.u=s.u+(RK.server===0?0.35:-0.35); b.v=s.v+0.25; b.y=1.0+Math.abs(Math.sin(RK.serveT*3))*0.25;
    if(RK.server===1&&RK.serveT>1.3) rkHit(1,'drive',1); if(RK.server===0&&RK.queue){ RK.queue=null; rkHit(0,'drive',1); } }
  // the ball
  if(b.live){ let acc=dt; while(acc>1e-6){ const h=Math.min(acc,1/120); acc-=h; rkBall(h); if(RK.phase!=='rally') break; } }
  // hits
  if(RK.queue&&performance.now()-RK.queue.t>460) RK.queue=null;
  if(RK.queue){ const q=rkCanHit(0); if(q>0){ rkHit(0,RK.queue.type,q); RK.queue=null; } }
  { const q=rkCanHit(1); if(q>0&&b.y<2.4&&RK.ai.missShot!==RK.shot){ if(RK.ai.rolled!==RK.shot){ RK.ai.rolled=RK.shot; const pace=Math.hypot(RK.ball.vu,RK.ball.vv)/RK.D.drive; if(Math.random()<L.miss*(1.7-q)*(0.7+pace)) RK.ai.missShot=RK.shot; } if(RK.ai.missShot!==RK.shot) rkHit(1,(me.u>-4&&Math.random()<0.35)?'lob':'drive',q); } }
  if(RK.phase==='dead'){ RK.deadT-=dt; if(RK.deadT<=0){ if(RK.over) { rkHUD(); return; } rkNewPoint(); } }
  rkPose(dt); }
function rkBall(dt){ const b=RK.ball, D=RK.D; const pu=b.u; b.vy-=9.81*dt; b.u+=b.vu*dt; b.v+=b.vv*dt; b.y+=b.vy*dt;
  if((pu<0)!==(b.u<0)&&b.y<D.net&&Math.abs(b.v)<D.HW+(D.walls?0:2.3)){ b.u=pu<0?-0.05:0.05; b.vu*=-0.1; b.vv*=0.3; b.vy=Math.min(b.vy,0)*0.3; RK.netHit=true; }
  if(b.y<=0.035&&b.vy<0){ b.y=0.035; b.vy=-b.vy*D.e; b.vu*=D.f; b.vv*=D.f; rkEvent('bounce'); if(b.vy<0.9&&RK.phase==='rally') rkEvent('bounce'); if(RK.phase==='rally') pok(0.35); }
  if(D.walls){ const au=Math.abs(b.u);
    if(au>D.HL-0.035){ const s=Math.sign(b.u); if(b.y<3){ b.u=s*(D.HL-0.035); b.vu*=-0.72; rkEvent('wall'); pok(0.5); } else if(b.y<4){ b.u=s*(D.HL-0.035); b.vu*=-0.25; b.vy*=0.6; rkEvent('wall'); } else rkEvent('out'); }
    if(Math.abs(b.v)>D.HW-0.035){ const s=Math.sign(b.v), hg=au>8?3:au>6?2:0; if(b.y<hg){ b.v=s*(D.HW-0.035); b.vv*=-0.7; rkEvent('wall'); pok(0.5); } else if(b.y<3){ b.v=s*(D.HW-0.035); b.vv*=-0.28; b.vu*=0.8; rkEvent('wall'); } else rkEvent('out'); } }
  else if(Math.abs(b.u)>D.HL+9||Math.abs(b.v)>D.HW+8) rkEvent('out'); }
function rkEvent(kind){ if(RK.phase!=='rally') return; const b=RK.ball, D=RK.D; const recv=1-RK.hitter, recvNeg=recv===0; const onRecv=(b.u<0)===recvNeg;
  if(kind==='bounce'){ if(!onRecv) return RK.bounces>=1?rkPoint(RK.hitter,'Vuelve sola a su campo'):rkPoint(recv,RK.netHit?'A la red':'No pasa la red');
    if(RK.bounces===0){ const u=Math.abs(b.u), v=b.v*(recvNeg?-1:1);
      if(RK.serve){ const ok=u<=D.svc+0.04&&Math.abs(b.v)<=D.HW+0.04&&Math.sign(b.v)!==Math.sign(RK.hitter===0?RK.me.v:RK.ai.v);
        if(!ok){ RK.faults=(RK.faults||0)+1; if(RK.faults>=2){ RK.faults=0; return rkPoint(recv,'Doble falta'); } RK.phase='dead'; RK.deadT=1.0; rkMsg('Falta'); return; } RK.faults=0; }
      else if(!D.walls&&(u>D.HL+0.04||Math.abs(b.v)>D.HW+0.04)) return rkPoint(recv,'Fuera');
      if(RK.wallBefore) return rkPoint(recv,'Pared sin botar');
      RK.bounces=1; RK.serve=false; return; }
    return rkPoint(RK.hitter,'Doble bote'); }
  if(kind==='wall'){ if(RK.bounces===0&&onRecv) RK.wallBefore=true; if(RK.bounces===0&&RK.wallBefore) return rkPoint(recv,'Pared sin botar'); return; }
  if(kind==='out'){ if(RK.bounces===0) return rkPoint(recv,'Fuera'); return rkPoint(RK.hitter,D.walls?'¡Sale de la pista!':'No llega'); } }
function rkPoint(w,why){ const S_=RK.score, l=1-w; RK.phase='dead'; RK.deadT=1.6; RK.faults=0; S_.pts[w]++;
  let big=w===0?'¡Punto!':'Punto de '+RK.ai.name;
  if(S_.pts[w]>=4&&S_.pts[w]-S_.pts[l]>=2){ S_.games[w]++; S_.pts=[0,0]; RK.server=1-RK.server; big=w===0?'¡Juego tuyo!':'Juego de '+RK.ai.name;
    if(S_.games[w]>=RK.toGames){ RK.over=true; RK.deadT=2.2; big=w===0?'¡Has ganado '+S_.games[0]+'-'+S_.games[1]+'!':'Gana '+RK.ai.name+' '+S_.games[1]+'-'+S_.games[0]; if(w===0){ const k=WP.key+'_rk_'+RK.C.k; store.set(k,String((+(store.get(k)||0))+1)); } } }
  rkMsg(big+' · '+why); rkHUD(); }
function rkMsg(t){ $('rkMsg').textContent=t; RK.msgT=2.4; }
function rkPts(){ const p=RK.score.pts; if(p[0]>=3&&p[1]>=3){ if(p[0]===p[1]) return 'Iguales'; return 'Ventaja '+(p[0]>p[1]?'tuya':RK.ai.name); } const N=['0','15','30','40']; return N[Math.min(3,p[0])]+' – '+N[Math.min(3,p[1])]; }
function rkHUD(){ if(!RK.C) return; const D=RK.D; $('rkTitle').innerHTML=(RK.C.k==='padel'?'Pádel':'Tenis')+'<small>tú contra '+esc(RK.ai.name)+'</small>';
  $('rkScore').textContent=rkPts(); $('rkGames').textContent='Juegos '+RK.score.games[0]+' – '+RK.score.games[1]+' · a '+RK.toGames+(RK.phase==='serve'?(RK.server===0?' · sacas tú: pulsa GOLPEAR':' · saca '+RK.ai.name):'');
  $('rkLevel').textContent='Nivel: '+RK_LEVEL[RK.level].n; $('rkAgain').hidden=!RK.over; }
function rkPose(dt){ const C=RK.C, f=RK.flip, y=C.y+0.03, T=performance.now()/1000;
  const place=(R,p,face)=>{ const w=cW(C,p.u,p.v,f); R.root.position.set(w[0],y,w[1]); const yaw=Math.atan2(C.uz*f*face,C.ux*f*face); R.root.rotation.set(0,-yaw,0); return yaw; };
  const yaw=place(rig,RK.me,1); P.x=rig.root.position.x; P.z=rig.root.position.z; P.y=y; P.yaw=yaw; place(RK.ai.rig,RK.ai,-1);
  for(const [R,p] of [[rig,RK.me],[RK.ai.rig,RK.ai]]){ const run=p.mv>0.12; poseRig(R,run?'run':'idle',T*(run?9:1),run?0.6:0); p.sw=Math.max(0,p.sw-dt);
    if(p.sw>0){ const k=1-p.sw/0.32; R.aR.sg.rotation.z=0.4+Math.sin(k*Math.PI)*1.4; R.aR.sg.rotation.x=-1.2+k*2.4; R.torso.rotation.y=-0.6+k*1.2; } else { R.aR.sg.rotation.z=0.9; R.aR.sg.rotation.x=-0.35; R.torso.rotation.y=0; } }
  const b=RK.ball, w=cW(C,b.u,b.v,f); RK.mesh.position.set(w[0],y+b.y,w[1]); RK.shadow.position.set(w[0],y+0.012,w[1]);
  if(RK.msgT>0){ RK.msgT-=dt; if(RK.msgT<=0) $('rkMsg').textContent=''; } }
// padel: like television, high behind the back glass; tennis: behind the player, inside the fence
function racketCam(){ const C=RK.C, D=RK.D, f=RK.flip, y=C.y; let p,l,up;
  if(D.walls){ p=cW(C,-D.HL-1.2,RK.me.v*0.3,f); l=cW(C,RK.me.u+5,RK.me.v*0.15,f); up=6.8; }
  else { const Lf=Math.max(34,Math.min(40,C.L)); p=cW(C,Math.max(-Lf/2+0.8,RK.me.u-6.5),RK.me.v*0.5,f); l=cW(C,RK.me.u+12,RK.me.v*0.3,f); up=5.4; }
  camT.pos.set(p[0],y+up,p[1]); camT.look.set(l[0],y+0.3,l[1]); }
function rkPress(){ if(S.mode!=='racket') return; RK.press=performance.now(); }
function rkRelease(){ if(S.mode!=='racket'||!RK.press) return; const held=performance.now()-RK.press; RK.press=0; RK.queue={t:performance.now(),type:held>320?'lob':'drive'}; }
function pok(v){ if(!AC||!SOUND) return; const t=AC.currentTime, o=AC.createOscillator(), g=AC.createGain(); o.type='triangle'; o.frequency.setValueAtTime(520,t); o.frequency.exponentialRampToValueAtTime(240,t+0.06); g.gain.setValueAtTime(0.13*v,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.09); o.connect(g); g.connect(master); o.start(t); o.stop(t+0.1); }
$('rkHit').addEventListener('pointerdown',e=>{ e.preventDefault(); ensureAudio(); rkPress(); }); ['pointerup','pointercancel'].forEach(t=>$('rkHit').addEventListener(t,e=>{ e.preventDefault(); rkRelease(); }));
$('rkExit').onclick=()=>exitRacket(); $('rkLevel').onclick=()=>{ RK.level=(RK.level+1)%RK_LEVEL.length; store.set(WP.key+'_rkl',String(RK.level)); rkHUD(); };
$('rkAgain').onclick=()=>{ RK.score={pts:[0,0],games:[0,0]}; RK.over=false; RK.server=0; rkNewPoint(); };
RK.level=Math.min(2,Math.max(0,+(store.get(WP.key+'_rkl')||1)|0));
