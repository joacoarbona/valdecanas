/* ===== g3fg.js: footgolf, rugbygolf and the driving range (S1, Casterton: WP.kick, data in course.json 'kick' and 'range') ===== */
// Footgolf: a football kicked from a tee to a 53 cm cup with a flag, beside the fairway. Rugbygolf: a rugby ball, the first kick
// from a kicking tee, then drop kicks, and you finish by passing it into a round net on legs. Both on the club's 9 holes.
var FG={ok:false,k:'foot',cur:0,st:0,phase:'off',yaw:0,pow:0,pt:0,ball:[0,0,0],last:null,s:null,view:false,kind:'alto',acc:0,kickT:9,grp:null,card:{foot:[],rugby:[]},best:{foot:0,rugby:0},bh:{foot:[],rugby:[]},rounds:{foot:0,rugby:0},hio:0,pred:null,predK:'',predT:0,ezP:null,tab:'foot'};
var RG={ok:false,best:{},n:0,grp:null};
const FG_MAX=8;
const FG_DEF={
  foot:{n:'Footgolf',ic:'⚽',ball:'balón',r:0.11,kd:0.0125,wf:0.6,wob:0,rollK:1,cup:0.265,vin:3.0,
    kinds:{alto:{n:'Por alto',v:27,loft:30,err:2.4},raso:{n:'Raso',v:20,loft:3,err:1.4}}},
  rugby:{n:'Rugbygolf',ic:'🏉',ball:'balón de rugby',r:0.15,kd:0.016,wf:0.7,wob:0.55,rollK:1.35,gy:1.1,gIn:0.5,gRim:0.7,
    kinds:{colocada:{n:'Patada colocada',v:29,loft:36,err:2.6},drop:{n:'Drop',v:24,loft:33,err:3.4},pase:{n:'Pase',v:17.5,loft:36,err:1.6}}}};
// how the ball meets each kind of ground: bounce, grip on the bounce, rolling resistance (× g)
const FG_SURF={1:[.48,.34,.34],2:[.55,.3,.24],3:[.6,.25,.15],4:[.6,.22,.12],5:[.55,.2,.09],6:[.6,.25,.15],7:[.1,.8,1.1],8:[.7,.2,.07],9:[.15,.8,.9],10:[.55,.3,.22],0:[.4,.45,.45]};
TRO.push({id:'footgolf',n:'Footgolfista',how:'Termina una vuelta de footgolf de 9 hoyos al par o mejor.',m:'s',c:30,w:'kick'},
  {id:'rugbygolf',n:'Pateador de rugbygolf',how:'Termina una vuelta de rugbygolf de 9 hoyos al par o mejor.',m:'s',c:30,w:'kick'});

function fgH(k,i){ const L=W.KICK&&W.KICK[k||FG.k]; return L?L[i===undefined?FG.cur:i]:null; }
function fgTarget(H){ return H.cup||H.goal; }
function fgPar(k){ const L=W.KICK&&W.KICK[k]; return L?L.reduce((a,h)=>a+h.par,0):0; }
function fgTot(k){ return (FG.card[k||FG.k]||[]).reduce((a,x)=>a+(x||0),0); }
function fgDone(k){ return (FG.card[k||FG.k]||[]).filter(x=>x>0).length; }
function fgRel(k){ k=k||FG.k; const L=W.KICK[k]; return (FG.card[k]||[]).reduce((a,x,i)=>a+(x?x-L[i].par:0),0); }
function fgNext(k){ const c=FG.card[k]||[]; for(let i=0;i<9;i++) if(!c[i]) return i; return 0; }
function fgLoad(){ try{ const o=JSON.parse(store.get('vg_fg_'+WP.key)||'{}')||{}; const td=new Date().toDateString();
    for(const k of ['foot','rugby']){ FG.card[k]=(o.d===td&&o.card&&Array.isArray(o.card[k]))?o.card[k].slice(0,9):[]; FG.best[k]=(o.best&&o.best[k])||0; FG.bh[k]=(o.bh&&o.bh[k])||[]; FG.rounds[k]=(o.rounds&&o.rounds[k])||0; }
    FG.hio=o.hio||0; }catch(e){}
  try{ const r=JSON.parse(store.get('vg_rg_'+WP.key)||'{}')||{}; RG.best=r.best||{}; RG.n=r.n||0; }catch(e){} }
function fgSave(){ store.set('vg_fg_'+WP.key,JSON.stringify({d:new Date().toDateString(),card:FG.card,best:FG.best,bh:FG.bh,rounds:FG.rounds,hio:FG.hio})); }

/* ---- the course: cups, goals, tee plates, signs; the driving range: mat and distance boards ---- */
function fgMat(c,o){ return new THREE.MeshLambertMaterial(Object.assign({color:Cc(c)},o||{})); }
function fgSignTex(l1,l2,col){ return canvasTex(256,128,(c,w,h)=>{ c.fillStyle='#fffdf6'; c.fillRect(0,0,w,h); c.fillStyle=col; c.fillRect(0,0,w,30); c.fillStyle='#fff'; c.font='800 21px system-ui, sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(l1,w/2,16);
  c.fillStyle='#16231b'; c.font='800 40px system-ui, sans-serif'; c.fillText(l2,w/2,78); c.strokeStyle=col; c.lineWidth=6; c.strokeRect(3,3,w-6,h-6); }); }
function fgSign(g,x,z,a,l1,l2,col){ const y=W.terrain(x,z); const post=new THREE.Mesh(new THREE.BoxGeometry(0.1,1.3,0.1),fgMat('#6b4b2e')); post.position.set(x,y+0.65,z); g.add(post);
  const b=new THREE.Mesh(new THREE.PlaneGeometry(0.96,0.48),new THREE.MeshLambertMaterial({map:fgSignTex(l1,l2,col),side:THREE.DoubleSide})); b.position.set(x,y+1.5,z); b.rotation.y=Math.PI/2-a; g.add(b); }   // a: the direction its face looks to
function fgFlag(g,x,y,z,h,col){ const p=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,h,6),fgMat('#ffffff')); p.position.set(x,y+h/2,z); g.add(p);
  const f=new THREE.Mesh(new THREE.PlaneGeometry(0.55,0.34),new THREE.MeshLambertMaterial({color:Cc(col),side:THREE.DoubleSide})); f.position.set(x+0.28,y+h-0.2,z); g.add(f); return f; }
function fgPlate(g,x,z,a,col){ const y=W.terrain(x,z); const m=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.05,0.9),fgMat(col)); m.position.set(x,y+0.02,z); m.rotation.y=-a; g.add(m); }
function fgBuild(){ if(FG.grp||!W.KICK) return; const g=new THREE.Group(); g.name='footgolf'; scene.add(g); FG.grp=g; FG.flags=[];
  for(const k of ['foot','rugby']) (W.KICK[k]||[]).forEach((H,i)=>{ const T=fgTarget(H), a=Math.atan2(T[1]-H.tee[1],T[0]-H.tee[0]), ty=W.terrain(T[0],T[1]);
    if(k==='foot'){ const cup=new THREE.Mesh(new THREE.CircleGeometry(0.265,24),new THREE.MeshBasicMaterial({color:0x111111,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4})); cup.rotation.x=-Math.PI/2; cup.position.set(T[0],ty+0.03,T[1]); g.add(cup);
      const rim=new THREE.Mesh(new THREE.RingGeometry(0.265,0.33,28),new THREE.MeshBasicMaterial({color:0xffffff,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4})); rim.rotation.x=-Math.PI/2; rim.position.set(T[0],ty+0.031,T[1]); g.add(rim);
      FG.flags.push(fgFlag(g,T[0],ty,T[1],2.1,'#f28c28')); fgPlate(g,H.tee[0],H.tee[1],a,'#2f6bd6'); fgSign(g,H.tee[0]-Math.cos(a)*1.4-Math.sin(a)*1.4,H.tee[1]-Math.sin(a)*1.4+Math.cos(a)*1.4,a+Math.PI,'FOOTGOLF','Hoyo '+H.n+' · par '+H.par,'#e07a1f'); }
    else { const R=0.62, red=fgMat('#c0392b');
      const ring=new THREE.Mesh(new THREE.TorusGeometry(R,0.035,8,28),red); ring.rotation.x=Math.PI/2; ring.position.set(T[0],ty+FG_DEF.rugby.gy,T[1]); g.add(ring);
      const net=new THREE.Mesh(new THREE.CylinderGeometry(R,0.36,0.6,16,3,true),new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:0.75})); net.position.set(T[0],ty+FG_DEF.rugby.gy-0.3,T[1]); g.add(net);
      for(let j=0;j<3;j++){ const b=j/3*Math.PI*2; const lx=T[0]+Math.cos(b)*R*0.98, lz=T[1]+Math.sin(b)*R*0.98, ly=W.terrain(lx,lz); const leg=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.035,FG_DEF.rugby.gy+ty-ly,6),fgMat('#7a7f86')); leg.position.set(lx,(ly+ty+FG_DEF.rugby.gy)/2,lz); g.add(leg); }
      FG.flags.push(fgFlag(g,T[0],ty,T[1],2.8,'#1f9d4c')); fgPlate(g,H.tee[0],H.tee[1],a,'#c0392b'); fgSign(g,H.tee[0]-Math.cos(a)*1.4+Math.sin(a)*1.4,H.tee[1]-Math.sin(a)*1.4-Math.cos(a)*1.4,a+Math.PI,'RUGBYGOLF','Hoyo '+H.n+' · par '+H.par,'#c0392b'); } });
  // the ball, the kicking tee, the arc of the kick and the ring where it lands
  const ft=canvasTex(256,128,(c,w,h)=>{ c.fillStyle='#ffffff'; c.fillRect(0,0,w,h); c.fillStyle='#1a1a1a'; for(let j=0;j<3;j++) for(let i=0;i<6;i++){ const x=(i+(j%2)*0.5)*w/6+10, y=j*h/3+21; c.beginPath(); for(let q=0;q<5;q++){ const t=q/5*Math.PI*2-Math.PI/2; c.lineTo(x+Math.cos(t)*13,y+Math.sin(t)*13); } c.fill(); } });
  FG.mFoot=new THREE.Mesh(new THREE.SphereGeometry(0.11,18,12),new THREE.MeshLambertMaterial({map:ft}));
  const rt=canvasTex(128,64,(c,w,h)=>{ c.fillStyle='#8a4b22'; c.fillRect(0,0,w,h); c.fillStyle='#fff'; c.fillRect(w*0.22,0,5,h); c.fillRect(w*0.72,0,5,h); c.fillRect(w*0.47,h*0.42,4,h*0.16); });
  FG.mRug=new THREE.Mesh(new THREE.SphereGeometry(0.1,18,12),new THREE.MeshLambertMaterial({map:rt})); FG.mRug.geometry.scale(1.5,1,1);
  for(const m of [FG.mFoot,FG.mRug]){ m.castShadow=true; m.visible=false; scene.add(m); }
  FG.tee=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.09,0.12,10),fgMat('#f28c28')); FG.tee.visible=false; scene.add(FG.tee);
  FG.dots=new THREE.InstancedMesh(new THREE.SphereGeometry(0.09,8,6),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.9}),44); FG.dots.count=0; FG.dots.frustumCulled=false; scene.add(FG.dots);
  FG.ring=new THREE.Mesh(new THREE.RingGeometry(1.1,1.45,32),new THREE.MeshBasicMaterial({color:0xf28c28,transparent:true,opacity:0.85,side:THREE.DoubleSide,depthWrite:false})); FG.ring.rotation.x=-Math.PI/2; FG.ring.visible=false; scene.add(FG.ring);
  FG.stop=new THREE.Mesh(new THREE.RingGeometry(0.35,0.55,20),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.8,side:THREE.DoubleSide,depthWrite:false})); FG.stop.rotation.x=-Math.PI/2; FG.stop.visible=false; scene.add(FG.stop);
  FG.ok=true; }
function rgBuild(){ const R=W.RANGE; if(!R||RG.grp) return; const g=new THREE.Group(); g.name='practicas'; scene.add(g); RG.grp=g; const [x0,z0,a,L]=R, c=Math.cos(a), s=Math.sin(a);
  const y0=W.terrain(x0,z0); const mat=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.05,2.6),fgMat('#2e7d32')); mat.position.set(x0,y0+0.03,z0); mat.rotation.y=-a; g.add(mat);
  for(const sd of [-1,1]){ const bx=x0-c*0.4+s*sd*1.9, bz=z0-s*0.4-c*sd*1.9; const bk=new THREE.Mesh(new THREE.CylinderGeometry(0.22,0.17,0.32,12),fgMat('#d6442a')); bk.position.set(bx,W.terrain(bx,bz)+0.16,bz); g.add(bk); }
  fgSign(g,x0-c*2.6+s*2.4,z0-s*2.6-c*2.4,a+Math.PI,'PRÁCTICAS','Tira aquí','#2f6bd6');
  const cols={50:'#d6442a',100:'#ffffff',150:'#f2c230',200:'#2f6bd6',250:'#1f9d4c'};
  for(const d of [50,100,150,200,250]){ if(d>L-8) continue; for(const sd of [-1,1]){ const off=d===150?0:14*sd; if(d===150&&sd>0) continue; const bx=x0+c*d+s*off, bz=z0+s*d-c*off; fgSign(g,bx+s*(d===150?9:0),bz-c*(d===150?9:0),a+Math.PI,'DISTANCIA',d+' m',d===100?'#5b6670':cols[d]); if(d!==150) fgFlag(g,bx,W.terrain(bx,bz),bz,2.2,cols[d]); } }
  RG.ok=true; }
function fgBoot(){ fgLoad(); try{ fgBuild(); rgBuild(); }catch(e){ console.warn('footgolf',e); } }

/* ---- physics: a ball with air drag, bounces and rolling, the cup (footgolf) and the net (rugbygolf) ---- */
function fgShoot(x,y,z,yaw,v,loft){ const a=loft*Math.PI/180; return {x,y,z,vx:Math.cos(yaw)*Math.cos(a)*v,vy:Math.sin(a)*v,vz:Math.sin(yaw)*Math.cos(a)*v,air:true,t:0,b:0,done:null,trees:0,walls:0,ap:y,land:null,rim:0,lip:0}; }
function fgStep(s,dt,D,o){ s.t+=dt; const T=o.T, ez=o.ez;
  if(s.air){ const w=o.wind||{x:0,z:0}; const rx=s.vx-w.x*D.wf, ry=s.vy, rz=s.vz-w.z*D.wf, sp=Math.sqrt(rx*rx+ry*ry+rz*rz);
    s.vx-=D.kd*sp*rx*dt; s.vy-=(GRAV+D.kd*sp*ry)*dt; s.vz-=D.kd*sp*rz*dt; const py=s.y; s.x+=s.vx*dt; s.y+=s.vy*dt; s.z+=s.vz*dt; if(s.y>s.ap) s.ap=s.y;
    if(Math.abs(s.x)>2900||Math.abs(s.z)>2900||s.t>30){ s.done='out'; return; }
    if(D.gy&&T){ const gy=T[2]+D.gy; if(py>=gy&&s.y<gy&&s.vy<0){ const d=Math.hypot(s.x-T[0],s.z-T[1]), gi=D.gIn*(ez?1.45:1); if(d<gi){ s.done='holed'; return; } if(d<D.gRim&&!s.rim){ s.rim=1; s.vy=-s.vy*0.3; const k=d||1; s.vx=(s.x-T[0])/k*2+s.vx*0.25; s.vz=(s.z-T[1])/k*2+s.vz*0.25; } } }
    const bb=ballBld(s); if(bb){ if(py>=bb.top-0.2){ s.done='roof'; s.roofB=bb; return; } if(bb.solid){ const e=nearestEdge(bb,s.x,s.z); const vn=s.vx*e[3]+s.vz*e[4]; if(vn<0){ s.vx-=2*vn*e[3]; s.vz-=2*vn*e[4]; } s.vx*=0.4; s.vz*=0.4; s.vy*=0.6; s.x=e[1]+e[3]*0.3; s.z=e[2]+e[4]*0.3; s.walls++; } }
    const hg=W.terrain(s.x,s.z), wl=W.waterLevel(s.x,s.z);
    if(o.trees&&s.y<hg+30&&s.trees<3&&treeHit(s)){ s.trees++; s.vx*=0.3; s.vz*=0.3; s.vy=Math.min(s.vy*0.3,0)-1; if(o.rnd){ s.vx+=(o.rnd()-.5)*3; s.vz+=(o.rnd()-.5)*3; } }
    if(s.y<=Math.max(hg,wl)){ if(hg<wl+0.02){ s.done='water'; return; }
      const n=normalAt(s.x,s.z,hg), F=FG_SURF[W.surfAt(s.x,s.z)]||FG_SURF[1]; if(!s.land) s.land=[s.x,s.z];
      const vn=s.vx*n[0]+s.vy*n[1]+s.vz*n[2];
      if(vn<0){ let tx=s.vx-vn*n[0], ty=s.vy-vn*n[1], tz=s.vz-vn*n[2]; const mu=F[1]; tx*=1-mu; ty*=1-mu; tz*=1-mu; let e=F[0];
        if(D.wob&&o.rnd){ e*=0.55+o.rnd()*0.9; const q=(o.rnd()-0.5)*2*D.wob, cq=Math.cos(q), sq=Math.sin(q); const ax=tx*cq-tz*sq, az=tx*sq+tz*cq; tx=ax; tz=az; }
        const nb=-vn*Math.min(0.85,e); s.vx=tx+nb*n[0]; s.vy=ty+nb*n[1]; s.vz=tz+nb*n[2]; s.y=hg+0.002; s.b++; if(nb<1.1||s.b>8){ s.air=false; s.vx=tx; s.vy=ty; s.vz=tz; } }
    }
    return; }
  const hg=W.terrain(s.x,s.z); if(hg<W.waterLevel(s.x,s.z)+0.02){ s.done='water'; return; }
  const n=normalAt(s.x,s.z,hg), F=FG_SURF[W.surfAt(s.x,s.z)]||FG_SURF[1];
  const vn=s.vx*n[0]+s.vy*n[1]+s.vz*n[2]; s.vx-=vn*n[0]; s.vy-=vn*n[1]; s.vz-=vn*n[2];
  const gx=GRAV*n[1]*n[0], gz=GRAV*n[1]*n[2], gt=Math.hypot(gx,gz), fr=F[2]*D.rollK*GRAV*n[1];
  let sp=Math.hypot(s.vx,s.vz);
  if(sp<0.1&&gt<fr*1.05){ s.done='stop'; s.vx=s.vz=0; return; }
  s.vx+=gx*dt; s.vz+=gz*dt; sp=Math.hypot(s.vx,s.vz); if(sp>0){ const k=Math.max(0,sp-fr*dt)/sp; s.vx*=k; s.vz*=k; }
  s.x+=s.vx*dt; s.z+=s.vz*dt; s.y=W.terrain(s.x,s.z);
  { const bb=ballBld({x:s.x,y:s.y+0.1,z:s.z}); if(bb&&bb.solid){ const e=nearestEdge(bb,s.x,s.z); const v2=s.vx*e[3]+s.vz*e[4]; if(v2<0){ s.vx-=1.6*v2*e[3]; s.vz-=1.6*v2*e[4]; } s.x=e[1]+e[3]*0.3; s.z=e[2]+e[4]*0.3; } }
  if(!D.gy&&T){ const d=Math.hypot(s.x-T[0],s.z-T[1]), cr=D.cup*(ez?1.7:1), vi=D.vin*(ez?1.6:1); sp=Math.hypot(s.vx,s.vz);
    if(d<cr){ if(sp<vi){ s.done='holed'; return; } if(!s.lip){ s.lip=1; s.vx*=0.7; s.vz*=0.7; } }
    else if(ez&&d<1.4&&sp<2.2){ const k=0.9*dt/d; s.vx+=(T[0]-s.x)*k*3; s.vz+=(T[1]-s.z)*k*3; } }
  if(s.t>40) s.done='stop'; }
function fgSim(x,y,z,yaw,v,loft,D,o,rec){ const s=fgShoot(x,y,z,yaw,v,loft), dt=1/120; const path=rec?[]:null; let k=0;
  while(!s.done&&k<5400){ fgStep(s,dt,D,o); if(rec&&s.air&&k%7===0) path.push([s.x,s.y,s.z]); k++; } s.path=path; return s; }

/* ---- the game ---- */
function fgD(){ return FG_DEF[FG.k]; }
function fgKinds(){ const H=fgH(), T=fgTarget(H), d=Math.hypot(T[0]-FG.ball[0],T[1]-FG.ball[2]); if(FG.k==='foot') return ['alto','raso'];
  if(FG.st===0&&FG.onTee) return ['colocada','drop']; return d<=26?['pase','drop']:['drop']; }
function fgAutoKind(){ const H=fgH(), T=fgTarget(H), d=Math.hypot(T[0]-FG.ball[0],T[1]-FG.ball[2]);
  if(FG.k==='foot') return d<26?'raso':'alto'; if(FG.st===0&&FG.onTee) return 'colocada'; return d<=20?'pase':'drop'; }
function fgCanStart(){ return ['walk','drive','ride','jet','bike','menu','drone','fly','kick','pow','wait'].includes(S.mode)&&!(S.mode==='wait'&&S.g.after!=='holed'); }
function fgGo(k,i){ if(!FG.ok){ toast('Footgolf y rugbygolf','No hay en este mundo'); return; } if(!fgCanStart()&&S.mode!=='aim'){ toast(FG_DEF[k||FG.k].n,'Termina antes lo que estás haciendo'); return; }
  k=k||FG.k; if(i===undefined) i=fgNext(k); if(i===0&&fgDone(k)===9){ FG.card[k]=[]; fgSave(); }
  closeModal(); hideMap(); for(const id of ['fgSheet','kdSheet','flSheet','bkSheet','hlSheet','cirSheet']){ const e=$(id); if(e) e.hidden=true; }
  fadeTo(()=>{ if(S.interior) exitVilla(); if(P.fly) flLeave(); if(P.buggy) exitBuggy(); if(P.horse) dismountHorse(); if(P.jet) dismountJet(); if(BK.b) bkUnmount({stay:true}); if(S.mode==='pow') pwExit('walk',0); cirLand(); mpEnterWorld(); FG.k=k; fgHole(i); }); }
function fgHole(i){ const H=fgH(FG.k,i); if(!H) return; FG.cur=i; FG.st=0; FG.after=''; FG.onTee=true; const y=W.terrain(H.tee[0],H.tee[1]); FG.ball=[H.tee[0],y,H.tee[1]]; FG.last=null; FG.s=null; FG.view=false;
  const T=fgTarget(H); FG.yaw=Math.atan2(T[1]-H.tee[1],T[0]-H.tee[0]); FG.kind=fgAutoKind(); FG.phase='aim'; FG.kickT=9; setMode('kick'); fgPlace(); S.snap=true; fgEz(); fgUI();
  toast(fgD().n+' · hoyo '+H.n+' de 9','Par '+H.par+' · '+H.L+' m · '+(FG.k==='foot'?'mete el balón en el hoyo grande de la bandera naranja':'acaba pasando el balón a la red de la bandera verde')); }
function fgDir(){ return [Math.cos(FG.yaw),Math.sin(FG.yaw)]; }
function fgPlace(){ const [fx,fz]=fgDir(), rx=-fz, rz=fx; const b=FG.ball; P.x=b[0]-fx*0.85-rx*0.2; P.z=b[2]-fz*0.85-rz*0.2; P.y=groundAt(P.x,P.z,b[1]+1.5); P.vx=P.vy=P.vz=0; P.swim=false; P.onGround=true; P.yaw=FG.yaw; FG.predK=''; }
function fgPress(){ if(S.mode!=='kick'||FG.phase!=='aim') return; ensureAudio(); FG.phase='charge'; FG.pt=0; FG.pow=0; fgRing(0); }
function fgRelease(){ if(S.mode!=='kick'||FG.phase!=='charge') return; const p=FG.pow; fgRing(0); if(p<0.04){ FG.phase='aim'; return; } fgHit(p); }
function fgStart(K){ const b=FG.ball, [fx,fz]=fgDir(); if(FG.kind==='pase') return [b[0]-fx*0.25,b[1]+1.15,b[2]-fz*0.25]; if(FG.kind==='drop') return [b[0],b[1]+0.32,b[2]]; return [b[0],b[1]+(FG.kind==='colocada'?0.2:fgD().r),b[2]]; }
function fgHit(p){ const D=fgD(), K=D.kinds[FG.kind], ez=ezOn(); const err=(ez?0.25:1)*gauss()*K.err*Math.PI/180; const v=K.v*p*(ez?1:(0.985+Math.random()*0.03)); const st=fgStart(K);
  FG.s=fgShoot(st[0],st[1],st[2],FG.yaw+err,v,K.loft); FG.last=FG.ball.slice(); FG.st++; FG.onTee=false; FG.phase='fly'; FG.acc=0; FG.view=false; FG.kickT=0; FG.pred=null; if(FG.dots) FG.dots.count=0; blip('hit'); fgUI(); }
function fgPlay(dt){ const H=fgH(); if(!H) return;
  if(FG.kickT<9) FG.kickT+=dt;
  if(FG.phase==='charge'){ FG.pt+=dt; const up=1.15; FG.pow=FG.pt<up?FG.pt/up:1-(FG.pt-up)/up; if(FG.pow<=0){ FG.pow=0; FG.phase='aim'; fgRing(0); return; } fgRing(FG.pow);
    if(ezOn()&&FG.ezP&&FG.pow>=Math.min(0.97,FG.ezP)){ FG.pow=FG.ezP; fgRelease(); } return; }
  if(FG.phase==='fly'&&FG.s){ const s=FG.s, D=fgD(), T=fgT3(), o={T,ez:ezOn(),trees:true,wind:S.g.wind,rnd:Math.random}; FG.acc+=Math.min(dt,0.05); let n=0; const st=1/120;
    while(FG.acc>=st&&!s.done&&n<20){ fgStep(s,st,D,o); FG.acc-=st; n++; } if(s.done) fgEnd(s.done); return; }
  if(FG.phase==='pause'){ FG.pt-=dt; if(FG.pt<=0){ if(FG.after==='next'){ if(FG.cur<8){ const n=FG.cur+1; FG.phase='wait'; fadeTo(()=>{ if(FG.phase==='wait'&&S.mode==='kick') fgHole(n); }); } else fgRoundEnd(); }
    else { const far=Math.hypot(P.x-FG.ball[0],P.z-FG.ball[2])>14; const go=()=>{ if(S.mode!=='kick') return; const T=fgTarget(H); FG.yaw=Math.atan2(T[1]-FG.ball[2],T[0]-FG.ball[0]); FG.kind=fgAutoKind(); FG.phase='aim'; fgPlace(); fgEz(); fgUI(); };
      if(far){ FG.phase='wait'; fadeTo(go); } else go(); } } } }
function fgT3(){ const T=fgTarget(fgH()); return [T[0],T[1],W.terrain(T[0],T[1])]; }
function fgEnd(k){ const H=fgH(), s=FG.s, i=FG.cur, ez=ezOn(), D=fgD();
  if(k==='holed'){ const c=FG.card[FG.k]; c[i]=FG.st; if(!ez&&(!FG.bh[FG.k][i]||FG.st<FG.bh[FG.k][i])) FG.bh[FG.k][i]=FG.st; blip('cup'); const d=FG.st-H.par; const T=fgT3();
    FG.ball=D.gy?[T[0],T[2]+D.gy-0.35,T[1]]:[T[0],T[2]-0.15,T[1]];
    toast(FG.st===1?'¡Hoyo en uno!':scoreName(FG.st,H.par),FG.st+(FG.st===1?' golpe':' golpes')+' · '+(d===0?'par':(d>0?'+':'')+d)+' · total '+fgTot()); P.cheerT=2.2;
    if(FG.st===1){ FG.hio++; prgEarn(5,'Hoyo en uno en el '+D.n.toLowerCase()); } else if(d<0) prgEarn(2,'Bajo par en el '+D.n.toLowerCase());
    fgSave(); FG.phase='pause'; FG.pt=2.6; FG.after='next'; }
  else if(k==='water'||k==='out'){ if(!ez) FG.st++; if(k==='water'){ startSplash(s.x,s.z,W.waterLevel(s.x,s.z)); blip('water'); } toast(k==='water'?'¡Al agua!':'Fuera',ez?'En modo fácil no cuenta golpe: repites':'+1 golpe · repites desde donde chutaste');
    FG.ball=FG.last.slice(); FG.onTee=FG.st<=1&&k!=='out'?FG.onTee:false; FG.phase='pause'; FG.pt=1.5; FG.after='aim'; FG.s=null; }
  else if(k==='roof'){ const b=s.roofB, e=nearestEdge(b,s.x,s.z), dx=e[1]+e[3]*2.2, dz=e[2]+e[4]*2.2; FG.ball=[dx,W.terrain(dx,dz),dz]; toast('¡En el tejado!','Sigues junto a la casa sin golpe de más'); FG.phase='pause'; FG.pt=1.4; FG.after='aim'; FG.s=null; }
  else { FG.ball=[s.x,W.terrain(s.x,s.z),s.z]; FG.s=null; const T=fgTarget(H), dd=Math.hypot(T[0]-s.x,T[1]-s.z); toast(fmt(Math.hypot(s.x-FG.last[0],s.z-FG.last[2]))+' m','Quedan '+fmt(dd)+' m '+(D.gy?'a la red':'al hoyo')); FG.phase='pause'; FG.pt=1.1; FG.after='aim'; }
  if(FG.after==='aim'&&FG.st>=FG_MAX){ FG.card[FG.k][i]=FG_MAX+1; fgSave(); toast('Balón recogido','Máximo de '+FG_MAX+' golpes: te apuntas '+(FG_MAX+1)); FG.phase='pause'; FG.pt=1.6; FG.after='next'; }
  fgUI(); }
function fgRoundEnd(){ const k=FG.k, D=FG_DEF[k], t=fgTot(k), d=t-fgPar(k), ez=ezOn(); FG.rounds[k]++; if(!ez&&(!FG.best[k]||t<FG.best[k])) FG.best[k]=t; fgSave();
  prgEarn(10,D.n+' terminado'); if(d<=0){ prgEarn(10,D.n+' al par o mejor'); prgTrophy(k==='foot'?'footgolf':'rugbygolf'); }
  fgLeave(); toast('¡'+D.n+' terminado!',t+' golpes · '+(d===0?'al par':(d>0?'+':'')+d+' sobre el par')+(ez?' · en modo fácil no cuenta como récord':(FG.best[k]===t?' · tu mejor vuelta':'')));
  setTimeout(()=>{ if(S.mode==='walk') fgSheet(k); },1800); }
function fgLeave(){ FG.phase='off'; FG.s=null; FG.view=false; setMode('walk'); camS.yaw=P.yaw; fgVis(); }
function fgExit(){ if(S.mode!=='kick') return; fgLeave(); tip('Has dejado el '+fgD().n.toLowerCase()+'. Sigue cuando quieras: «Footgolf y más» en el menú',3600); }
function fgAim(d){ if(S.mode!=='kick'||FG.phase!=='aim') return; FG.yaw+=d; fgPlace(); }
function fgView(){ if(S.mode!=='kick') return; FG.view=!FG.view; fgUI(); }
function fgType(){ if(S.mode!=='kick'||FG.phase!=='aim') return; const L=fgKinds(); FG.kind=L[(L.indexOf(FG.kind)+1)%L.length]; FG.predK=''; fgEz(); fgUI(); tip(fgD().kinds[FG.kind].n+': '+fgKindTxt(FG.kind),2600); }
function fgKindTxt(k){ return {alto:'el balón sale alto y vuela por encima de la hierba alta',raso:'rueda por el suelo, como un putt: para acercarte al hoyo',colocada:'desde el soporte del tee: la patada más larga',drop:'sueltas el balón y lo chutas al botar',pase:'lo lanzas con las manos a la red, a poca distancia'}[k]||''; }
function fgTap(pt){ if(S.mode!=='kick'||FG.phase!=='aim') return; if(Math.hypot(pt.x-FG.ball[0],pt.z-FG.ball[2])<0.8) return; FG.yaw=Math.atan2(pt.z-FG.ball[2],pt.x-FG.ball[0]); fgPlace(); fgEz(); }
function fgKey(e,down){ if(down){ if(e.code==='Space'){ e.preventDefault(); if(!e.repeat) fgPress(); } else if(e.key==='ArrowLeft') fgAim(-0.01); else if(e.key==='ArrowRight') fgAim(0.01); else if(e.key==='v'||e.key==='V') fgView(); else if(e.key==='t'||e.key==='T') fgType(); else if(e.key==='Escape') fgExit(); }
  else if(e.code==='Space') fgRelease(); }
function fgGamepad(g){ if(g.lx&&FG.phase==='aim') fgAim(g.lx*g.dt*0.6); if(g.down(GPB.LEFT)) fgAim(-0.015); if(g.down(GPB.RIGHT)) fgAim(0.015);
  if(g.down(GPB.RT)||g.down(GPB.A)) fgPress(); if(g.up(GPB.RT)||g.up(GPB.A)) fgRelease(); if(g.down(GPB.Y)) fgView(); if(g.down(GPB.UP)||g.down(GPB.DOWN)) fgType(); if(g.down(GPB.X)) fgSheet(FG.k); if(g.down(GPB.B)) fgExit(); }
// easy mode: the power that leaves the ball nearest the target, found with the same physics (no wobble)
function fgEz(){ FG.ezP=null; if(!ezOn()||S.mode!=='kick') return; const D=fgD(), K=D.kinds[FG.kind], st=fgStart(K), T=fgT3(), o={T,ez:true,trees:true};
  let best=null; for(let p=0.12;p<=1.001;p+=0.022){ const s=fgSim(st[0],st[1],st[2],FG.yaw,K.v*p,K.loft,D,o); let d=s.done==='holed'?-1:s.done==='water'||s.done==='out'?999:Math.hypot(s.x-T[0],s.z-T[1]); if(D.gy&&s.done!=='holed'&&s.land) d=Math.hypot(s.land[0]-T[0],s.land[1]-T[1]); if(!best||d<best[0]) best=[d,p]; if(d<0) break; }
  FG.ezP=best?best[1]:null; }
// the arc: at full power while you aim, at the power you are charging while you hold the button
function fgPredict(){ const D=fgD(), K=D.kinds[FG.kind], p=FG.phase==='charge'?Math.max(0.05,FG.pow):(ezOn()&&FG.ezP?FG.ezP:1), key=FG.kind+'|'+FG.yaw.toFixed(4)+'|'+p.toFixed(2)+'|'+FG.ball.join(',');
  if(key===FG.predK) return FG.pred; FG.predK=key; const st=fgStart(K); FG.pred=fgSim(st[0],st[1],st[2],FG.yaw,K.v*p,K.loft,D,{T:fgT3(),ez:ezOn(),trees:true},true); return FG.pred; }
function fgVis(){ const on=S.mode==='kick'||(S.mode==='photo'&&FG.phase!=='off'); if(!FG.ok) return; FG.mFoot.visible=on&&FG.k==='foot'; FG.mRug.visible=on&&FG.k==='rugby'; FG.tee.visible=on&&FG.k==='rugby'&&FG.onTee; if(!on){ FG.dots.count=0; FG.ring.visible=FG.stop.visible=false; } }
const _fgM=new THREE.Object3D();
function fgTick(dt){ if(!FG.ok) return; fgVis(); if(S.mode!=='kick') return; const M=FG.k==='foot'?FG.mFoot:FG.mRug, s=FG.s, D=fgD();
  let x,y,z; if(FG.phase==='fly'&&s){ x=s.x; y=s.y+(s.air?0:D.r*0.7); z=s.z; const sp=Math.hypot(s.vx,s.vy,s.vz); if(FG.k==='foot'){ M.rotation.z-=sp*dt/D.r*0.6; M.rotation.y=-FG.yaw; } else { M.rotation.y=-Math.atan2(s.vz,s.vx); M.rotation.z+=(s.air?11:sp/D.r*0.4)*dt; } }
  else { const st=fgStart(D.kinds[FG.kind]); const held=FG.k==='rugby'&&(FG.kind==='drop'||FG.kind==='pase')&&FG.phase!=='fly';
    if(held){ const [fx,fz]=fgDir(); x=P.x+fx*0.42; y=P.y+(FG.kind==='pase'&&FG.phase==='charge'?1.25+FG.pow*0.1:1.0); z=P.z+fz*0.42; M.rotation.set(0,-FG.yaw+Math.PI/2,0); }
    else { x=st[0]; y=FG.k==='rugby'&&FG.onTee?FG.ball[1]+0.27:FG.ball[1]+D.r; z=st[2]; if(FG.k==='rugby'&&FG.onTee) M.rotation.set(0,-FG.yaw,Math.PI/2); } }
  M.position.set(x,y,z); if(FG.tee.visible) FG.tee.position.set(FG.ball[0],FG.ball[1]+0.06,FG.ball[2]);
  for(const f of FG.flags){ f.rotation.y=Math.sin(performance.now()/600+f.position.x)*0.25; }
  const show=(FG.phase==='aim'||FG.phase==='charge')&&!FG.view; if(!show){ FG.dots.count=0; FG.ring.visible=FG.stop.visible=false; return; }
  FG.predT-=dt; if(FG.predT>0&&FG.phase!=='charge') return; FG.predT=0.12; const pr=fgPredict(); if(!pr) return; const pts=pr.path||[]; const n=Math.min(pts.length,44);
  for(let i=0;i<n;i++){ _fgM.position.set(pts[i][0],pts[i][1],pts[i][2]); _fgM.scale.setScalar(FG.k==='rugby'?1.2:1); _fgM.updateMatrix(); FG.dots.setMatrixAt(i,_fgM.matrix); } FG.dots.count=n; FG.dots.instanceMatrix.needsUpdate=true;
  FG.dots.material.color.set(FG.phase==='charge'?0xf28c28:0xffffff);
  if(pr.land){ FG.ring.visible=true; FG.ring.position.set(pr.land[0],W.terrain(pr.land[0],pr.land[1])+0.08,pr.land[1]); } else FG.ring.visible=false;
  if(pr.done==='stop'||pr.done==='holed'){ FG.stop.visible=true; FG.stop.position.set(pr.x,W.terrain(pr.x,pr.z)+0.07,pr.z); } else FG.stop.visible=false; }
function fgCam(){ const H=fgH(); if(!H) return 6; const T=fgT3(), [fx,fz]=fgDir();
  if(FG.view){ const b=FG.ball, mx=(b[0]+T[0])/2, mz=(b[2]+T[1])/2, L=Math.hypot(T[0]-b[0],T[1]-b[2]); camT.pos.set(b[0]-fx*(10+L*0.25),Math.max(b[1],T[2])+12+L*0.45,b[2]-fz*(10+L*0.25)); camT.look.set(mx,(b[1]+T[2])/2,mz); return 3; }
  if(FG.phase==='fly'&&FG.s){ const s=FG.s; let vx=s.vx, vz=s.vz; const l=Math.hypot(vx,vz); if(l<0.5){ vx=fx; vz=fz; } else { vx/=l; vz/=l; } const y=Math.max(s.y,W.terrain(s.x,s.z));
    camT.pos.set(s.x-vx*7,y+3.2,s.z-vz*7); if(camT.pos.y<W.terrain(camT.pos.x,camT.pos.z)+1) camT.pos.y=W.terrain(camT.pos.x,camT.pos.z)+1; camT.look.set(s.x,s.y,s.z); return 3.2; }
  const b=FG.ball; camT.pos.set(b[0]-fx*4.4-fz*1.5,b[1]+2.4,b[2]-fz*4.4+fx*1.5); const gy=W.terrain(camT.pos.x,camT.pos.z)+0.8; if(camT.pos.y<gy) camT.pos.y=gy; camT.look.set(b[0]+fx*9,b[1]+0.8,b[2]+fz*9); return 6; }
function fgPose0(){ return ['idle',0]; }
function fgPose(R){ if(P.cheerT>0) return; const p=FG.phase==='charge'?FG.pow:0, t=FG.kickT, D=fgD(), throwK=FG.kind==='pase';
  R.aL.sg.rotation.x=0.3; R.aR.sg.rotation.x=-0.25;
  if(throwK&&FG.k==='rugby'){ if(FG.phase==='charge'){ R.aL.sg.rotation.set(0,0,-0.4-0.9*p); R.aR.sg.rotation.set(0,0,-0.4-0.9*p); } else if(t<0.5){ const q=Math.min(1,t/0.16); R.aL.sg.rotation.set(0,0,-1.3+3.2*q); R.aR.sg.rotation.set(0,0,-1.3+3.2*q); } else if(FG.phase==='aim'){ R.aL.sg.rotation.set(0,0,0.9); R.aR.sg.rotation.set(0,0,0.9); R.aL.el.rotation.z=R.aR.el.rotation.z=0.5; } return; }
  if(FG.k==='rugby'&&FG.kind==='drop'&&(FG.phase==='aim'||FG.phase==='charge')){ R.aL.sg.rotation.set(0,0,0.9); R.aR.sg.rotation.set(0,0,0.9); R.aL.el.rotation.z=R.aR.el.rotation.z=0.5; }
  if(FG.phase==='charge'){ R.lR.hg.rotation.z=-0.6*p; R.lR.kn.rotation.z=-1.6*p; R.torso.rotation.z=-0.12*p; }
  else if(t<0.55){ const q=Math.min(1,t/0.14); R.lR.hg.rotation.z=-0.6+(D.kinds[FG.kind].loft>10?1.95:1.25)*q; R.lR.kn.rotation.z=-1.6+1.5*q; R.torso.rotation.z=-0.2*q; } }

/* ---- on screen ---- */
function fgHUD(){ const h=$('fgHud'); if(h) h.hidden=S.mode!=='kick'; document.body.classList.toggle('fgon',S.mode==='kick'); }
function fgRing(p){ const f=Math.max(0,Math.min(1,p)), c=2*Math.PI*48; $('fgRingFill').setAttribute('stroke-dasharray',(c*f)+' '+c); $('fgRingFill').setAttribute('stroke',f>0.85?'#d6442a':'#255d3c'); }
function fgUI(){ if(!FG.ok||S.mode!=='kick') return; const H=fgH(); if(!H) return; const D=fgD(), K=D.kinds[FG.kind], T=fgTarget(H), d=Math.hypot(T[0]-FG.ball[0],T[1]-FG.ball[2]);
  $('fgTitle').innerHTML=D.ic+' '+D.n+' · hoyo '+H.n+'<small>Par '+H.par+' · '+H.L+' m</small>'; $('fgStroke').textContent=FG.after==='next'&&FG.phase!=='aim'&&FG.phase!=='charge'?'Hecho en '+FG.st:'Golpe '+(FG.st+(FG.phase==='fly'?0:1)); const t=fgTot(), dn=fgDone(), r=fgRel();
  $('fgTot').textContent=dn?'Total '+t+' ('+(r>0?'+':'')+(r===0?'par':r)+')':'Total 0'; $('fgName').textContent='A '+fmt(d)+' m '+(D.gy?'de la red':'del hoyo');
  $('fgTxt').textContent=K.n+': '+fgKindTxt(FG.kind)+'.'; $('fgTypeB').textContent=K.n; $('fgTypeB').disabled=fgKinds().length<2;
  $('fgSwing').innerHTML=(FG.kind==='pase'?'LANZAR':'CHUTAR')+'<small>mantén y suelta</small>'; $('fgView').classList.toggle('on',FG.view); $('fgEz').hidden=!ezOn(); if(ezOn()) $('fgEz').textContent='🧸 Modo fácil: la fuerza se para sola en el punto bueno y el hoyo es más grande'; }
{ const q=id=>$(id), sw=q('fgSwing'); if(sw){ sw.addEventListener('pointerdown',e=>{ e.preventDefault(); fgPress(); }); for(const t of ['pointerup','pointercancel','pointerleave']) sw.addEventListener(t,()=>fgRelease()); sw.addEventListener('contextmenu',e=>e.preventDefault());
  let hold=null; for(const [id,k] of [['fgL',-1],['fgR',1]]){ const b=q(id); b.addEventListener('pointerdown',e=>{ e.preventDefault(); fgAim(k*0.01); clearInterval(hold); hold=setInterval(()=>fgAim(k*0.01),60); }); for(const t of ['pointerup','pointercancel','pointerleave']) b.addEventListener(t,()=>{ clearInterval(hold); hold=null; if(S.mode==='kick') fgEz(); }); }
  q('fgView').onclick=fgView; q('fgCardB').onclick=()=>fgSheet(FG.k); q('fgExit').onclick=fgExit; q('fgTypeB').onclick=fgType; } }

/* ---- the driving range (a golf "course" of one hole: every ball comes back to the mat) ---- */
function rgOn(){ const H=hole(); return !!(H&&W.RANGE&&courseOf(H).id==='practicas'); }
function rgGo(){ const k=W.COURSES.findIndex(c=>c.id==='practicas'); if(k<0) return; if(S.mode==='kick') fgLeave(); for(const id of ['fgSheet']){ const e=$(id); if(e) e.hidden=true; } setCourse(k); playTee(true); }
function rgDone(s,carry){ if(!rgOn()) return false; const g=S.g, H=hole(), cl=CLUBS[g.club], tot=Math.hypot(s.x-g.flightStart.x,s.z-g.flightStart.z), pin=Math.hypot(s.x-H.pin[0],s.z-H.pin[1]);
  let sub; if(s.done==='water') sub='Al agua'; else if(s.done==='roof') sub='En un tejado'; else sub='Total '+fmt(tot)+' m · a '+fmt(pin)+' m de la bandera de '+H.L+' m';
  const c=Math.round(carry), b=RG.best[cl.n]||0, rec=!cl.putt&&s.done!=='water'&&c>b; if(rec) RG.best[cl.n]=c; RG.n++; store.set('vg_rg_'+WP.key,JSON.stringify({best:RG.best,n:RG.n}));
  if(s.done==='holed'){ blip('cup'); prgEarn(5,'¡Dentro en las prácticas!'); }
  toast((s.done==='holed'?'¡Dentro! · ':'')+cl.n+': '+c+' m de vuelo',sub+(rec?' · ¡tu mejor vuelo con este palo!':b?' · tu mejor: '+b+' m':''));
  const tp=teePos(H); g.ball.set(tp[0],W.terrain(tp[0],tp[1])+0.03,tp[1]); g.cur=0; g.waitT=1.7; g.after='rg'; g.ballVisible=true; return true; }
function rgTabHTML(){ if(!W.RANGE) return '<p>No hay campo de prácticas en este mundo.</p>'; const L=CLUBS.filter(c=>!c.putt).map(c=>'<tr><td>'+c.n+'</td><td class="num">'+(RG.best[c.n]?RG.best[c.n]+' m':'—')+'</td><td class="num">'+c.c+' m</td></tr>').join('');
  return '<p>El <b>campo de prácticas</b> del club: una alfombrilla con bolas y banderas a 50, 100, 150, 200 y 250 m (la de 150 tiene green y hoyo). Tiras con cualquier palo y cada bola vuelve a la alfombrilla: no se apuntan golpes.</p>'+
    '<div class="row"><button class="btn primary" id="rgPlay">Ir a las prácticas</button></div>'+
    '<h3>Tus mejores vuelos</h3><div class="tablewrap"><table class="card mp"><tr><th>Palo</th><th>Tu mejor vuelo</th><th>Vuelo tipo</th></tr>'+L+'</table></div><p class="note">El «vuelo» es lo que recorre la bola por el aire hasta el primer bote; el «vuelo tipo» es el de un golpe bueno sin viento. '+RG.n+' bolas tiradas.</p>'; }

/* ---- the sheet: Footgolf, Rugbygolf, Prácticas, Cómo se juega ---- */
function fgCardHTML(k){ const L=W.KICK[k], c=FG.card[k]||[]; let h='<div class="tablewrap"><table class="card mp"><tr><th>Hoyo</th>'+L.map(H=>'<th>'+H.n+'</th>').join('')+'<th>Total</th></tr><tr><td>Par</td>'+L.map(H=>'<td>'+H.par+'</td>').join('')+'<td>'+fgPar(k)+'</td></tr>';
  h+='<tr><td>Metros</td>'+L.map(H=>'<td>'+H.L+'</td>').join('')+'<td>'+L.reduce((a,H)=>a+H.L,0)+'</td></tr><tr><td><b>Hoy</b></td>'+L.map((H,i)=>'<td'+(c[i]&&c[i]!==H.par?' style="font-weight:800;color:'+(c[i]<H.par?'#1f8a43':'#c0392b')+'"':'')+'>'+(c[i]||'·')+'</td>').join('')+'<td><b>'+(fgDone(k)?fgTot(k):'·')+'</b></td></tr>';
  h+='<tr><td>Mejor</td>'+L.map((H,i)=>'<td>'+(FG.bh[k][i]||'·')+'</td>').join('')+'<td>'+(FG.best[k]||'·')+'</td></tr></table></div>'; return h; }
function fgPlayHTML(k){ const D=FG_DEF[k], dn=fgDone(k), nx=fgNext(k);
  let h='<p>'+(k==='foot'?'<b>Footgolf</b>: golf con un balón de fútbol y el pie. Sales de la placa azul y metes el balón en un hoyo grande (53 cm) con bandera naranja, a un lado de la calle de cada hoyo del club. Cuantas menos patadas, mejor.'
    :'<b>Rugbygolf</b>: golf con un balón de rugby. La primera patada es colocada, desde el soporte naranja de la placa roja; después, drops (sueltas el balón y lo chutas al botar). Acabas con un <b>pase</b> con las manos dentro de la red redonda de la bandera verde. Rodando no entra: tiene que caer desde arriba.')+'</p>';
  h+='<div class="row"><button class="btn primary" id="fgPlayB">'+(dn&&dn<9?'Seguir: hoyo '+(nx+1):'Empezar en el hoyo 1')+'</button>'+(dn?'<button class="btn small" id="fgNew">Tarjeta nueva</button>':'')+'</div>';
  h+='<h3>Tarjeta de hoy</h3>'+fgCardHTML(k)+'<p class="note">Vueltas terminadas: '+FG.rounds[k]+'. Verde, bajo par; rojo, por encima. Máximo '+FG_MAX+' golpes por hoyo (si no, te apuntas '+(FG_MAX+1)+').</p>';
  h+='<h3>Ir a un hoyo</h3><div class="row" style="flex-wrap:wrap">'+W.KICK[k].map((H,i)=>'<button class="btn small" data-fgh="'+i+'">'+H.n+'</button>').join('')+'</div>'; return h; }
function fgHowHTML(){ return '<h3>Cómo se juega</h3><ul><li><b>Apuntar</b>: ◀ ▶, arrastra el dedo por la pantalla o toca el suelo hacia donde quieras chutar. Los puntos blancos son el vuelo con toda la fuerza; el anillo naranja, donde bota; el círculo blanco, donde se para.</li>'+
  '<li><b>Fuerza</b>: mantén <b>CHUTAR</b> y suelta. El anillo se llena y se vacía; mientras lo mantienes, los puntos se ponen naranjas y enseñan esa fuerza.</li><li><b>Tipo de golpe</b> (botón de la izquierda): en el footgolf, <b>Por alto</b> o <b>Raso</b>; en el rugbygolf, <b>Patada colocada</b> (solo desde el tee), <b>Drop</b> y, a menos de 26 m de la red, <b>Pase</b>.</li>'+
  '<li><b>Vista</b>: el hoyo desde arriba. <b>Tarjeta</b>: esta hoja. <b>Salir</b>: lo dejas y sigues andando; la tarjeta de hoy se guarda.</li><li>El viento del juego también empuja el balón. Al agua: +1 golpe y repites. En un tejado: sigues junto a la casa sin golpe de más.</li><li><b>Modo fácil</b> (botón del menú): la fuerza se para sola en el punto bueno y el hoyo y la red son más grandes.</li><li><b>Mando</b>: stick o cruceta ◀ ▶ apuntan, ▲ ▼ cambian el tipo de golpe, R2 o ✕ cargan y chutan, △ vista, □ tarjeta, ○ sale.</li></ul>'+
  '<h3>Cómo se lee la pantalla</h3><ul><li><b>Arriba a la izquierda</b>: el juego, el hoyo, su par y sus metros; el golpe que toca, el total de hoy (y respecto al par) y lo que te falta.</li><li><b>En el campo</b>: placa azul y bandera naranja, footgolf; placa roja, soporte naranja y red con bandera verde, rugbygolf. En el mapa: círculos naranjas (hoyos de footgolf) y cuadrados rojos (redes de rugbygolf).</li></ul>'+
  '<h3>Glosario</h3><dl class="gloss">'+fgGlossHTML()+'</dl>'; }
function fgSheet(tab){ if(!FG.ok&&!W.RANGE) return; closeModal(); FG.tab=tab||FG.tab||'foot'; const T=FG.tab, B=$('fgBody');
  let h='<h2>Footgolf, rugbygolf y prácticas</h2><div class="tabs">'+[['foot','⚽ Footgolf'],['rugby','🏉 Rugbygolf'],['range','🏌️ Prácticas'],['como','❓ Cómo se juega']].map(t=>'<button data-fgt="'+t[0]+'" class="'+(T===t[0]?'on':'')+'">'+t[1]+'</button>').join('')+'</div>';
  h+=T==='foot'||T==='rugby'?(FG.ok?fgPlayHTML(T):'<p>No hay en este mundo.</p>'):T==='range'?rgTabHTML():fgHowHTML();
  h+='<div class="row" style="margin-top:12px"><button class="btn small" id="fgClose">Cerrar</button></div>'; B.innerHTML=h; $('fgSheet').hidden=false; $('fgSheet').scrollTop=0;
  B.querySelectorAll('[data-fgt]').forEach(b=>b.onclick=()=>fgSheet(b.dataset.fgt)); $('fgClose').onclick=()=>{ $('fgSheet').hidden=true; };
  const pb=$('fgPlayB'); if(pb) pb.onclick=()=>fgGo(T); const nw=$('fgNew'); if(nw) nw.onclick=()=>{ FG.card[T]=[]; fgSave(); fgSheet(T); };
  B.querySelectorAll('[data-fgh]').forEach(b=>b.onclick=()=>fgGo(T,+b.dataset.fgh)); const rp=$('rgPlay'); if(rp) rp.onclick=()=>{ $('fgSheet').hidden=true; rgGo(); }; }

/* ---- map, legend, guide and glossary ---- */
function fgDrawMap(g,m2c,s,big){ if(!FG.ok&&!W.RANGE) return; g.save(); const r=(big?4.2:2.6)*s;
  if(FG.ok) for(const k of ['foot','rugby']) for(const H of W.KICK[k]){ const T=fgTarget(H), [x,y]=m2c(T[0],T[1]), [tx,ty]=m2c(H.tee[0],H.tee[1]); const col=k==='foot'?'#f28c28':'#c0392b';
    if(big){ g.strokeStyle=col; g.globalAlpha=0.55; g.setLineDash([3*s,3*s]); g.lineWidth=1.2*s; g.beginPath(); g.moveTo(tx,ty); g.lineTo(x,y); g.stroke(); g.setLineDash([]); g.globalAlpha=1; }
    g.fillStyle=col; g.strokeStyle='#fff'; g.lineWidth=1.2*s; g.beginPath(); if(k==='foot') g.arc(x,y,r,0,7); else g.rect(x-r,y-r,2*r,2*r); g.fill(); g.stroke();
    if(big){ g.fillStyle='#fff'; g.font='800 '+(5.6*s)+'px system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(H.n),x,y+0.3*s); } }
  if(W.RANGE){ const [x0,z0,a,L]=W.RANGE, [x,y]=m2c(x0,z0); g.fillStyle='#2f6bd6'; g.strokeStyle='#fff'; g.lineWidth=1.3*s; g.beginPath(); g.arc(x,y,r*1.1,0,7); g.fill(); g.stroke();
    if(big){ for(const d of [50,100,150,200,250]){ if(d>L-8) continue; const [px,py]=m2c(x0+Math.cos(a)*d,z0+Math.sin(a)*d); g.fillStyle='#2f6bd6'; g.beginPath(); g.arc(px,py,1.6*s,0,7); g.fill(); } g.fillStyle='#16231b'; g.font='800 '+(6*s)+'px system-ui, sans-serif'; g.textAlign='left'; g.textBaseline='middle'; g.fillText('Prácticas',x+r*1.6,y); } }
  if(S.mode==='kick'){ const [x,y]=m2c(FG.ball[0],FG.ball[2]); g.fillStyle='#fff'; g.strokeStyle='#16231b'; g.lineWidth=1.4*s; g.beginPath(); g.arc(x,y,r*0.8,0,7); g.fill(); g.stroke(); }
  g.restore(); }
function fgLegend(){ let h=''; if(FG.ok) h+='<div><i style="background:#f28c28;border-radius:50%;border:2px solid #fff"></i>Hoyo de footgolf (número), con línea discontinua desde su placa de salida</div><div><i style="background:#c0392b;border:2px solid #fff"></i>Red de rugbygolf (número)</div>';
  if(W.RANGE) h+='<div><i style="background:#2f6bd6;border-radius:50%;border:2px solid #fff"></i>Campo de prácticas: alfombrilla y banderas cada 50 m</div>'; return h; }
function fgGuideHTML(){ if(!FG.ok&&!W.RANGE) return ''; return '<li><b>Footgolf, rugbygolf y prácticas</b> (botón <b>Footgolf y más</b> del inicio o del menú): footgolf (un balón de fútbol a un hoyo de 53 cm) y rugbygolf (patadas con un balón de rugby y un pase final a una red) en los 9 hoyos del club, con su tarjeta, récords y monedas; y el campo de prácticas, donde cada bola vuelve a la alfombrilla y se apunta tu mejor vuelo con cada palo.</li>'; }
function fgGlossHTML(){ return '<dt>Footgolf</dt><dd>Golf con un balón de fútbol del número 5 que se chuta con el pie hasta un hoyo de 53 cm de ancho. Tiene su propio par por hoyo.</dd><dt>Rugbygolf</dt><dd>Golf con un balón de rugby: patadas hasta una red redonda en la que se acaba con un pase con las manos.</dd>'+
  '<dt>Patada colocada</dt><dd>La primera del rugbygolf: el balón de pie sobre un soporte (tee de rugby). Es la más larga.</dd><dt>Drop</dt><dd>Patada en la que sueltas el balón y lo golpeas justo al botar en el suelo.</dd><dt>Pase</dt><dd>Lanzar el balón con las manos; en el rugbygolf, solo cerca de la red.</dd>'+
  '<dt>Par 3</dt><dd>Campo corto en el que todos los hoyos son de par 3: se llega al green de un golpe y se mete con dos putts.</dd><dt>Segunda vuelta</dt><dd>En un club de 9 hoyos, los hoyos 10 a 18 son los mismos 9 jugados otra vez, a veces desde otras barras.</dd><dt>Campo de prácticas</dt><dd>Zona para tirar bolas sin jugar un hoyo, con banderas a distancias conocidas para saber cuánto vuela cada palo.</dd><dt>Vuelo</dt><dd>Lo que recorre la bola por el aire hasta su primer bote (en inglés, carry).</dd>'; }
{ const mk=$('mKick'); if(mk){ mk.hidden=!WP.kick; mk.onclick=()=>{ saveName(); ensureAudio(); fgSheet(); }; } }
