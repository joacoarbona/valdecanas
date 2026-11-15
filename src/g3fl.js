/* ================= V1 · flying: flying cars and helicopters, helipads, passengers, cockpit view and rings in the sky ================= */
const FL_T={
  car:{n:'Coche volador',art:'el coche volador',vmax:34,acc:11,up:9,dn:8,yaw:1.5,seats:3,len:4.8,r:2.6,cam:12,ch:2.0,pad:5,
    seat:[[0.55,0.42,-0.4],[0.55,0.42,0.4],[-0.5,0.42,-0.4],[-0.5,0.42,0.4]],eye:[0.75,1.28,-0.4]},
  heli:{n:'Helicóptero',art:'el helicóptero',vmax:42,acc:9,up:11,dn:9,yaw:1.25,seats:5,len:9,r:5,cam:17,ch:2.6,pad:7,
    seat:[[1.45,0.8,-0.45],[1.45,0.8,0.45],[0.3,0.8,-0.55],[0.3,0.8,0],[0.3,0.8,0.55],[-0.65,0.8,0]],eye:[1.7,1.7,-0.45]}};
const FL_COL={car:['#e8742c','#2aa7c9','#8e5bd6','#3fae5a'],heli:['#d6442a','#f2c230']};
var FL={list:[],pads:[],fp:false,dn:false,snd:null,run:null,rings:[],rg:null,best:0,ceil:320,tipT:0};
function flM(g,geo,col,x,y,z,sx,sy,sz){ const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:Cc(col)})); m.position.set(x,y,z); if(sx) m.scale.set(sx,sy,sz); g.add(m); return m; }
function flMake(type,col){ const G=new THREE.Group(), B=new THREE.Group(), dark='#2b3440', rot=[]; const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d), sph=()=>new THREE.SphereGeometry(1,18,12), cyl=(a,b,l)=>new THREE.CylinderGeometry(a,b,l,10);
  const glassM=new THREE.MeshPhongMaterial({color:0x9fd3e6,transparent:true,opacity:0.38,shininess:90,side:THREE.DoubleSide,depthWrite:false});
  const blade=(parent,x,y,z,len,wid,axis,k)=>{ const r=new THREE.Group(); r.position.set(x,y,z); const M=new THREE.MeshLambertMaterial({color:0x2a2f36});
    for(let i=0;i<2;i++){ const b=new THREE.Mesh(axis==='y'?box(len,0.05,wid):box(wid,len,0.04),M); if(axis==='y') b.rotation.y=i*Math.PI/2; else b.rotation.z=i*Math.PI/2; r.add(b); } parent.add(r); rot.push({o:r,ax:axis,k}); return r; };
  if(type==='car'){
    flM(B,sph(),col,0,0.88,0,2.35,0.6,1.02); flM(B,box(3.0,0.3,1.5),dark,-0.1,0.5,0);
    for(const s of [-1,1]){ flM(B,box(0.9,0.5,0.08),col,-2.0,1.25,s*0.55).rotation.z=0.5; flM(B,box(0.2,0.14,0.3),'#ffffff',2.22,0.86,s*0.42); flM(B,box(0.16,0.12,0.3),'#d6442a',-2.3,0.9,s*0.42);
      flM(B,cyl(0.06,0.06,3.0),'#444a52',0,0.07,s*0.72).rotation.z=Math.PI/2; for(const u of [-0.9,0.9]) flM(B,box(0.08,0.42,0.08),'#444a52',u,0.28,s*0.72); }
    flM(B,box(0.3,0.06,1.5),dark,-2.3,1.5,0);
    for(const u of [-1.45,1.45]){ flM(B,box(0.16,0.1,3.3),dark,u,0.92,0); for(const s of [-1,1]){ flM(B,new THREE.TorusGeometry(0.72,0.1,8,22),dark,u,0.95,s*1.62).rotation.x=Math.PI/2; flM(B,cyl(0.12,0.12,0.2),col,u,0.95,s*1.62); blade(G,u,0.97,s*1.62,1.3,0.16,'y',s*u>0?1:-1); } }
    const gl=new THREE.Mesh(sph(),glassM); gl.scale.set(1.25,0.62,0.82); gl.position.set(0.3,1.22,0); G.add(gl); }
  else {
    flM(B,sph(),col,0.4,1.75,0,2.5,1.2,1.2); flM(B,box(1.8,0.5,0.9),dark,-0.2,2.95,0); flM(B,box(3.6,0.14,2.42),'#ffffff',0.2,1.45,0,1,1,1);
    flM(B,cyl(0.14,0.3,4.6),col,-3.9,2.05,0).rotation.z=Math.PI/2; flM(B,box(0.9,1.3,0.1),col,-6.0,2.55,0).rotation.z=-0.3; flM(B,box(0.5,0.06,1.6),dark,-5.2,2.1,0);
    flM(B,cyl(0.09,0.09,0.55),dark,0.2,3.32,0);
    for(const s of [-1,1]){ flM(B,cyl(0.07,0.07,4.4),'#444a52',0.4,0.07,s*1.1).rotation.z=Math.PI/2; for(const u of [-0.7,1.5]) flM(B,box(0.08,0.66,0.08),'#444a52',u,0.38,s*1.05).rotation.x=-s*0.15; }
    blade(G,0.2,3.6,0,10,0.3,'y',1); blade(G,-6.0,2.6,0.2,1.6,0.14,'z',3);
    const gl=new THREE.Mesh(sph(),glassM); gl.scale.set(1.25,0.95,1.05); gl.position.set(1.75,1.8,0); G.add(gl); }
  const body=new THREE.Mesh(mergeGroup(B),new THREE.MeshLambertMaterial({vertexColors:true})); body.castShadow=true; G.add(body);
  G.userData.rot=rot; G.rotation.order='YXZ'; scene.add(G); return G; }
function flPlace(A){ A.g.position.set(A.x,A.y,A.z); A.g.rotation.set(A.bank||0,-A.yaw,A.pitch||0); A.g.updateMatrixWorld(true); }
// a seat (0 = the pilot) or the pilot's eyes, in the world
const flV=new THREE.Vector3();
function flSeatW(A,i){ const T=FL_T[A.type], q=T.seat[clamp(i|0,0,T.seat.length-1)]; A.g.updateMatrixWorld(true); flV.set(q[0],q[1],q[2]); A.g.localToWorld(flV); return [flV.x,flV.y,flV.z]; }
function flEyeW(A){ const q=FL_T[A.type].eye; A.g.updateMatrixWorld(true); flV.set(q[0],q[1],q[2]); A.g.localToWorld(flV); return [flV.x,flV.y,flV.z]; }

/* ---- helipads: one per aircraft, in three places ---- */
function flPadY(x,z){ if(!FL||!FL.pads.length) return null; for(const p of FL.pads){ const dx=x-p.x, dz=z-p.z; if(dx*dx+dz*dz<p.r*p.r) return p.y; } return null; }
function flSpot(x0,z0,R,rad){ const ok=(x,z)=>{ let lo=1e9, hi=-1e9; for(let k=0;k<9;k++){ const a=k/8*Math.PI*2, d=k===8?0:rad, px=x+Math.cos(a)*d, pz=z+Math.sin(a)*d, g=W.terrain(px,pz), s=W.surfAt(px,pz);
      if((s>=3&&s<=7)||g<W.waterLevel(px,pz)+0.7||W.poolAt(px,pz)||bkGroundAt(px,pz)!==null) return false; lo=Math.min(lo,g); hi=Math.max(hi,g); }
    if(hi-lo>0.7||bldAt(x,z,rad+2.5)) return false; if(W.courtAt&&W.courtAt(x,z,rad+1)) return false; for(const p of FL.pads) if(Math.hypot(p.x-x,p.z-z)<p.r+rad+3) return false; for(const r of BK.racks) if(Math.hypot(r.x-x,r.z-z)<rad+4) return false; return hi; };
  for(let r=0;r<=R;r+=3){ const n=Math.max(1,Math.round(r*1.6)); for(let k=0;k<n;k++){ const a=k/n*Math.PI*2+r*0.21, x=x0+Math.cos(a)*r, z=z0+Math.sin(a)*r, h=ok(x,z); if(h!==false) return [x,z,h]; } } return null; }
function flPadBuild(p,type){ const tex=canvasTex(512,512,(c,w)=>{ c.fillStyle='#8f9499'; c.fillRect(0,0,w,w); for(let i=0;i<900;i++){ c.fillStyle='rgba('+(Math.random()<0.5?'255,255,255':'0,0,0')+',0.05)'; c.fillRect(Math.random()*w,Math.random()*w,3,3); }
    c.strokeStyle=type==='heli'?'#f2c230':'#2aa7c9'; c.lineWidth=26; c.beginPath(); c.arc(w/2,w/2,w/2-22,0,7); c.stroke(); c.strokeStyle='#ffffff'; c.lineWidth=12; c.beginPath(); c.arc(w/2,w/2,w/2-70,0,7); c.stroke();
    c.fillStyle='#ffffff'; c.font='900 250px system-ui, sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('H',w/2,w/2+12); });
  const side=new THREE.MeshLambertMaterial({color:0x7c8186}), top=new THREE.MeshLambertMaterial({map:tex});
  const m=new THREE.Mesh(new THREE.CylinderGeometry(p.r,p.r+0.25,1.2,40),[side,top,side]); m.position.set(p.x,p.y-0.6,p.z); m.receiveShadow=true; scene.add(m); p.m=m; }
function buildFly(){ const D=WP.fly; if(!D) return; try{ const Z=(typeof D.zones==='function'?D.zones(W,WP):D.zones)||[]; const cnt={car:0,heli:0};
    for(const z of Z){ for(const type of z.c){ const T=FL_T[type], sp=flSpot(z.p[0],z.p[1],z.r||110,T.pad); if(!sp) continue;
        const p={n:z.n,x:sp[0],z:sp[1],y:sp[2]+0.07,r:T.pad,type}; FL.pads.push(p); flPadBuild(p,type); TREE_EXCL.push([p.x-T.pad-2,p.x+T.pad+2,p.z-T.pad-2,p.z+T.pad+2]);
        const ring=[]; for(let k=0;k<16;k++) ring.push([p.x+Math.cos(k/16*6.2832)*(T.pad+0.6),p.z+Math.sin(k/16*6.2832)*(T.pad+0.6)]); W.GRASS_CLEAR=(W.GRASS_CLEAR||[]).concat([ring]);
        const col=FL_COL[type][cnt[type]++%FL_COL[type].length], yaw=Math.atan2(z.p[1]-p.z,z.p[0]-p.x)+Math.PI;
        const A={i:FL.list.length,type,col,pad:p,x:p.x,y:p.y,z:p.z,yaw,vf:0,vy:0,yr:0,bank:0,pitch:0,gnd:true,rs:0,ra:0,auto:false,remoteBy:null,g:flMake(type,col),sh:null,home:[p.x,p.y,p.z,yaw],moved:false,idleT:0}; p.a=A;
        A.sh=new THREE.Mesh(new THREE.CircleGeometry(1,20),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.3,depthWrite:false})); A.sh.rotation.x=-Math.PI/2; A.sh.visible=false; scene.add(A.sh);
        FL.list.push(A); flPlace(A); } }
    FL.best=+store.get('vg_fl_'+WP.key+'_aros')||0; if(FL.list.length) flRingsBuild(); }catch(e){ console.warn('fly',e); } }

/* ---- the ground under an aircraft: terrain, water, pads, roofs, piers and tree tops ---- */
function flGround(x,z,y){ let g=groundAt(x,z,y+0.6), k=''; const wl=W.waterLevel(x,z); if(W.poolAt(x,z)){ k='agua'; g=Math.max(g,W.poolAt(x,z).level); } if(wl>g-0.05){ g=wl; k='agua'; }
  const cx=Math.floor(x/20), cz=Math.floor(z/20); for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){ const tr=treeGrid.get((cx+i)+','+(cz+j)); if(!tr) continue; for(const t of tr){ const d=Math.hypot(x-t.x,z-t.z), R=t.r*0.85; if(d>=R) continue; const top=t.cy+t.ry*Math.sqrt(1-(d/R)*(d/R))*0.9; if(top>g){ g=top; k='árbol'; } } }
  FL.gk=k; return g; }
function flCanLand(A,g){ if(FL.gk) return false; const T=FL_T[A.type], c=Math.cos(A.yaw), s=Math.sin(A.yaw), L=T.len*0.3;
  for(const [u,v] of [[L,0],[-L,0],[0,1.1],[0,-1.1]]){ const h=flGround(A.x+c*u-s*v,A.z+s*u+c*v,A.y+0.5); if(FL.gk||Math.abs(h-g)>0.6) return false; } return true; }
function flWall(A,nx,nz){ const T=FL_T[A.type]; for(const b of bldsNear(nx,nz)){ const bt=b.walkY!==undefined?b.walkY:b.top; if(!b.solid||bt===undefined||bt<=A.y+0.3||b.base>A.y+3) continue; const m=T.r*0.6; if(nx<b.x0-m||nx>b.x1+m||nz<b.z0-m||nz>b.z1+m) continue; if(inBld(b,nx,nz)||nearestEdge(b,nx,nz)[0]<m) return true; } return false; }
function flInWorld(x,z){ const R=W.reg; if(!R||!R.w) return true; const m=Math.max(80,R.step*3); return x>R.x0+m&&x<R.x0+(R.w-1)*R.step-m&&z>R.z0+m&&z<R.z0+(R.h-1)*R.step-m; }
function flTip(t){ const now=performance.now(); if(now<FL.tipT) return; FL.tipT=now+4000; tip(t,2600); }

/* ---- flight: the stick goes forward and turns, Subir climbs, Bajar descends, hands off = it hovers ---- */
function flUpHeld(){ return !!(inp.jh||inp.keys.Space||(typeof GP!=='undefined'&&GP.idx>=0&&GP.prev&&(GP.prev[0]>0.5||GP.prev[7]>0.5))); }
function flDnHeld(){ return !!(FL.dn||inp.keys.ShiftLeft||inp.keys.ShiftRight); }
function flPhys(A,dt,th,st,up){ const T=FL_T[A.type];
  if(A.gnd){ A.vf=0; A.vy=0; A.yr=0; A.bank*=Math.exp(-dt*6); A.pitch*=Math.exp(-dt*6); if(up>0){ A.gnd=false; A.vy=2.5; A.moved=true; if(A===P.fly) blip('jump'); } flPlace(A); return; }
  const tv=th>=0?th*T.vmax:th*9; A.vf+=clamp(tv-A.vf,-T.acc*1.4*dt,T.acc*dt);
  const yr=st*T.yaw*(1-0.4*Math.min(1,Math.abs(A.vf)/T.vmax)); A.yr+=(yr-A.yr)*(1-Math.exp(-dt*5)); A.yaw+=A.yr*dt;
  const ty=up>0?T.up:up<0?-T.dn:0; A.vy+=clamp(ty-A.vy,-20*dt,20*dt);
  const ceil=W.waterLevel(A.x,A.z)+FL.ceil; if(A.vy>0&&A.y>ceil-25){ A.vy*=clamp((ceil-A.y)/25,0,1); if(A===P.fly&&A.y>ceil-3) flTip('Techo de vuelo: '+FL.ceil+' m sobre el embalse'); }
  const c=Math.cos(A.yaw), s=Math.sin(A.yaw), nx=A.x+c*A.vf*dt, nz=A.z+s*A.vf*dt;
  if(!flInWorld(nx,nz)){ A.vf*=-0.3; if(A===P.fly) flTip('Límite del mapa: da la vuelta'); }
  else if(flWall(A,nx,nz)){ if(Math.abs(A.vf)>6&&A===P.fly) blip('bump'); A.vf*=-0.3; if(A===P.fly) flTip('Un edificio: sube para pasar por encima'); }
  else { A.x=nx; A.z=nz; }
  const g=flGround(A.x,A.z,A.y), gk=FL.gk, ny=A.y+A.vy*dt;
  if(ny<=g+0.02){ if(A.vy<=0.01&&flCanLand(A,g)&&Math.abs(A.vf)<9){ A.y=g; A.gnd=true; A.vy=0; A.vf=0; A.auto=false; if(A===P.fly){ blip('land'); tip('Aterrizado. Acción: salir · Subir: despegar',2600); } }
    else { A.y=Math.min(g+0.7,Math.max(A.y,ny)+16*dt); if(A.y<g) A.y=Math.min(g+0.7,A.y+Math.max(16*dt,(g-A.y)*0.25)); A.vy=Math.max(0,A.vy);
      if(up<0&&Math.abs(A.vf)<9&&A===P.fly) flTip(gk==='agua'?'Sobre el agua no se aterriza: busca tierra, el pantalán o una azotea':gk==='árbol'?'Encima de un árbol no se aterriza':'Aquí no se puede aterrizar: busca un sitio llano'); A.noLand=true; } }
  else { A.y=ny; A.noLand=false; }
  A.bank+=(clamp(A.yr*0.28*(0.4+Math.abs(A.vf)/T.vmax),-0.42,0.42)-A.bank)*(1-Math.exp(-dt*4));
  A.pitch+=(clamp(-(tv-A.vf)*0.012-A.vf*0.004,-0.22,0.16)-A.pitch)*(1-Math.exp(-dt*3)); flPlace(A); }
function flStep(dt){ const A=P.fly; if(!A){ setMode('walk'); return; } inp.jumpQ=false; if(P.sprintLock){ P.sprintLock=false; $('bSprint').classList.remove('on'); }
  let th=inp.my, st=inp.mx, up=(flUpHeld()?1:0)-(flDnHeld()?1:0);
  if(A.auto){ if(Math.abs(th)>0.25||Math.abs(st)>0.25||up>0) A.auto=false; else { th=0; st=0; up=Math.abs(A.vf)<4?-1:0; if(A.noLand&&Math.abs(A.vf)<1){ A.auto=false; } } }
  const x0=A.x, y0=A.y, z0=A.z; flPhys(A,dt,th,st,up); P.x=A.x; P.y=A.y; P.z=A.z; P.yaw=A.yaw; P.vx=P.vy=P.vz=0; P.onGround=A.gnd; P.swim=false;
  if(performance.now()-camS.lastLook>900) camS.yaw=lerpAng(camS.yaw,A.yaw,1-Math.exp(-dt*(FL.fp?8:2.4)));
  flRunStep(A,x0,y0,z0,dt); }
function flCam(){ const A=P.fly; if(!A) return 6; const T=FL_T[A.type];
  if(FL.fp){ const e=flEyeW(A); camT.pos.set(e[0],e[1],e[2]); const pt=camS.pitch-0.32; camT.look.set(e[0]+Math.cos(camS.yaw)*Math.cos(pt)*10,e[1]-Math.sin(pt)*10,e[2]+Math.sin(camS.yaw)*Math.cos(pt)*10); return 40; }
  thirdPerson(T.cam,Math.max(0.1,camS.pitch),T.ch,0); return 6; }
function flView(){ if(!P.fly) return; FL.fp=!FL.fp; S.snap=true; flBtns(); tip(FL.fp?'Vista de cabina: arrastra para mirar':'Vista exterior',1800); }
function flRider(R){ const A=P.fly; if(!A) return; poseRig(R,'drive',0,0); const sp=flSeatW(A,0); R.root.position.set(sp[0],sp[1],sp[2]); R.root.rotation.order='YXZ'; R.root.rotation.set(A.bank||0,-A.yaw,A.pitch||0); P.anim='drive'; P.animK=0; }
function flStatus(){ const A=P.fly; if(!A) return ['','']; const T=FL_T[A.type], r=FL.run; let s=A.gnd?'En tierra · Subir: despegar · Acción: salir':fmt(Math.abs(A.vf)*3.6)+' km/h'+(A.auto?' · aterrizando solo':' · joystick: avanzar y girar · Subir y Bajar · suelta y se queda quieto');
  if(r) s=fmt(Math.abs(A.vf)*3.6)+' km/h · Aro '+Math.min(r.n+1,FL.rings.length)+' de '+FL.rings.length+' · '+kartFmt(r.t*1000)+(FL.best?' · récord '+kartFmt(FL.best):'');
  return [T.n,s]; }
function flBtns(){ const fly=S.mode==='fly'; const bs=$('bSprint'), bj=$('bJump'), bv=$('bView'); if(fly){ bj.textContent='Subir'; bs.textContent='Bajar'; bv.textContent=FL.fp?'Fuera':'Cabina'; bv.classList.toggle('on',FL.fp); }
  else if(bs.textContent==='Bajar'){ bs.textContent='Esprint'; } document.body.classList.toggle('flon',fly); }
{ const bs=$('bSprint'); bs.addEventListener('pointerdown',()=>{ if(S.mode==='fly'||(S.mode==='pow'&&(PW.k==='escoba'||PW.k==='bat'))) FL.dn=true; }); ['pointerup','pointercancel','pointerleave'].forEach(t=>bs.addEventListener(t,()=>{ FL.dn=false; })); }

/* ---- getting in and out ---- */
function flNear(){ if(S.mode!=='walk'||S.interior||P.swim) return null; let best=null, bd=1e9; for(const A of FL.list){ if(A.remoteBy||!A.gnd) continue; const d=Math.hypot(P.x-A.x,P.z-A.z); if(d<FL_T[A.type].r+2.2&&Math.abs(P.y-A.y)<3&&d<bd){ bd=d; best=A; } }
  return best?{k:'flIn',ref:best,label:'Pilotar '+FL_T[best.type].art,d:bd}:null; }
function flAct(){ const A=P.fly; if(!A) return null; return A.gnd?{k:'flOut',label:'Salir'}:{k:'flLand',label:A.auto?'Seguir volando':'Aterrizar'}; }
function flDo(k,ref){ if(k==='flIn') flEnter(ref); else if(k==='flOut') flExit(); else if(k==='flLand'){ const A=P.fly; if(!A) return; A.auto=!A.auto; if(A.auto) tip('Aterrizaje automático: frena y baja en vertical. Mueve el joystick para cancelarlo',3200); } }
function flEnter(A){ if(!A||A.remoteBy) return; if(P.buggy) exitBuggy(); if(P.horse) dismountHorse(); if(P.jet) dismountJet(); if(BK.b) bkUnmount({stay:true});
  P.fly=A; A.auto=false; A.idleT=0; FL.fp=false; setMode('fly'); camS.yaw=A.yaw; S.snap=true; ensureAudio();
  tip('Mantén Subir para despegar. Joystick: adelante avanza, a los lados gira. Bajar desciende; si sueltas todo se queda quieto en el aire. Acción: aterrizar solo',6500); }
function flExit(){ const A=P.fly; if(!A) return; if(!A.gnd){ tip('Aterriza antes de salir: pulsa Aterrizar',2400); return; } flLeave(); }
function flLeave(){ const A=P.fly; if(!A) return; P.fly=null; FL.fp=false; if(rig) rig.root.visible=true; if(rig){ rig.root.rotation.order='XYZ'; }
  const T=FL_T[A.type], c=Math.cos(A.yaw), s=Math.sin(A.yaw); let x=A.x+s*(T.r*0.55+1.2), z=A.z-c*(T.r*0.55+1.2); if(bldAt(x,z,0.4)||Math.abs(groundAt(x,z,A.y+1)-A.y)>1.2){ x=A.x-s*(T.r*0.55+1.2); z=A.z+c*(T.r*0.55+1.2); }
  if(Math.abs(groundAt(x,z,A.y+1)-A.y)>1.2){ x=A.x; z=A.z; }
  if(S.mode==='fly'){ P.x=x; P.z=z; P.y=groundAt(x,z,A.y+1); P.vx=P.vy=P.vz=0; P.yaw=A.yaw; setMode('walk'); }
  if(FL.run) flRunEnd(''); flPark(A); flBtns(); }
function flPark(A){ if(MP.code) mpSend({t:'flp',a:[A.i,Math.round(A.x*100)/100,Math.round(A.y*100)/100,Math.round(A.z*100)/100,Math.round(A.yaw*1000)/1000,A.gnd?1:0]}); }

/* ---- every frame: rotors, shadows, sound, aircraft left in the air, and you being taken out of yours ---- */
function flTick(dt,T){ if(!FL.list.length) return; const m=S.mode;
  if(P.fly&&m!=='fly'&&m!=='photo') flLeave();
  if(P.fly&&rig){ const vis=!(FL.fp&&m==='fly'); if(rig.root.visible!==vis) rig.root.visible=vis; }
  if(document.body.classList.contains('flon')!==(m==='fly')) flBtns();
  for(const A of FL.list){ const mine=A===P.fly, used=mine||!!A.remoteBy;
    if(A.remoteBy){ const p=MP.peers.get(A.remoteBy); if(!p||!p.out||p.out.m!=='fly'||!p.out.fl||p.out.fl[0]!==A.i){ A.remoteBy=null; } }
    // left in the air with nobody at the controls: it comes down by itself; if there is nowhere to land, back to its pad
    if(!used&&!A.gnd){ A.idleT+=dt; flPhys(A,dt,0,0,Math.abs(A.vf)<4?-1:0); if(A.idleT>12&&!A.gnd){ A.x=A.home[0]; A.y=A.home[1]; A.z=A.home[2]; A.yaw=A.home[3]; A.gnd=true; A.vf=A.vy=0; A.bank=A.pitch=0; flPlace(A); } } else if(A.gnd) A.idleT=0;
    const want=used||!A.gnd?1:0; A.rs+=clamp(want-A.rs,-dt*0.45,dt*0.9); if(A.rs>0.002){ A.ra+=dt*A.rs*30; for(const r of A.g.userData.rot){ if(r.ax==='y') r.o.rotation.y=A.ra*r.k; else r.o.rotation.z=A.ra*r.k; } }
    const far=Math.hypot(A.x-camera.position.x,A.z-camera.position.z)>900; A.g.visible=!far;
    const gy=A.gnd?A.y:Math.max(terrainAt(A.x,A.z),W.waterLevel(A.x,A.z)), h=A.y-gy; A.sh.visible=!far&&!A.gnd&&h<160; if(A.sh.visible){ const R=FL_T[A.type].r*(1+h*0.004); A.sh.position.set(A.x,gy+0.12,A.z); A.sh.scale.set(R,R,1); A.sh.material.opacity=0.34*clamp(1-h/160,0.15,1); } }
  if(FL.rg){ const on=!!P.fly&&(m==='fly'||m==='photo'); if(FL.rg.visible!==on) FL.rg.visible=on; if(on){ const nx=FL.run?FL.run.n%FL.rings.length:0; FL.rings.forEach((r,i)=>{ const k=i===nx?1:0; if(r.k!==k){ r.k=k; r.m.material=k?FL.matOn:FL.matOff; } if(k) r.m.scale.setScalar(1+0.05*Math.sin(T*5)); }); } }
  flSound(); }
function flSound(){ if(!AC||!master) return; let A=m_flHeard(); if(!FL.snd){ if(!A) return; try{ const o=AC.createOscillator(); o.type='sawtooth'; const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=420; const g=AC.createGain(); g.gain.value=0; const l=AC.createOscillator(); l.type='square'; const lg=AC.createGain(); lg.gain.value=0;
      o.connect(f); f.connect(g); g.connect(master); l.connect(lg); lg.connect(g.gain); o.start(); l.start(); FL.snd={o,g,l,lg,f}; }catch(e){ return; } }
  const S0=FL.snd, t=AC.currentTime; if(!A){ S0.g.gain.setTargetAtTime(0,t,0.2); S0.lg.gain.setTargetAtTime(0,t,0.2); return; }
  const heli=A.type==='heli', sp=Math.abs(A.vf), lvl=A.rs*(heli?0.05:0.03)*(FL.fp?1.2:1);
  S0.o.frequency.setTargetAtTime(heli?46+sp*0.5+A.vy*1.2:120+sp*2.2+A.vy*3,t,0.15); S0.f.frequency.setTargetAtTime(heli?380:900,t,0.2); S0.l.frequency.setTargetAtTime(heli?11*Math.max(0.2,A.rs):38,t,0.1);
  S0.g.gain.setTargetAtTime(lvl,t,0.2); S0.lg.gain.setTargetAtTime(heli?lvl*0.7:lvl*0.15,t,0.2); }
// the aircraft we hear: ours, or the one we ride in
function m_flHeard(){ if(S.mode==='fly'&&P.fly) return P.fly; if(S.mode==='pas'&&PAS.kind==='fly'&&PAS.q) return PAS.q.v; return null; }

/* ---- rings in the sky against the clock ---- */
function flRingsBuild(){ const pad=FL.pads.find(p=>p.n==='Hotel')||FL.pads[0], M=WP.map, cx=(M.x0+M.x1)/2, cz=(M.z0+M.z1)/2, rx=(M.x1-M.x0)*0.3, rz=(M.z1-M.z0)*0.3, N=10;
  const a0=Math.atan2((pad.z-cz)/rz,(pad.x-cx)/rx), G=new THREE.Group(); FL.matOff=new THREE.MeshBasicMaterial({color:0xf2a33a,transparent:true,opacity:0.55}); FL.matOn=new THREE.MeshBasicMaterial({color:0x35d06a}); const geo=new THREE.TorusGeometry(9,0.55,8,36);
  const pts=[]; for(let i=0;i<N;i++){ const a=a0+i/N*Math.PI*2, k=i===0?0.82:1+0.12*Math.sin(i*2.3), x=cx+Math.cos(a)*rx*k, z=cz+Math.sin(a)*rz*k; let g=Math.max(W.terrain(x,z),W.waterLevel(x,z)); for(const [u,v] of [[25,0],[-25,0],[0,25],[0,-25]]) g=Math.max(g,W.terrain(x+u,z+v)); pts.push([x,g+(i===0?26:30+14*Math.sin(i*1.7)),z]); }
  let len=0; for(let i=0;i<N;i++){ const p=pts[i], a=pts[(i+N-1)%N], b=pts[(i+1)%N]; let tx=b[0]-a[0], tz=b[2]-a[2]; const l=Math.hypot(tx,tz)||1; tx/=l; tz/=l; const m=new THREE.Mesh(geo,FL.matOff); m.position.set(p[0],p[1],p[2]); m.rotation.y=-Math.atan2(tz,tx)+Math.PI/2; G.add(m); FL.rings.push({x:p[0],y:p[1],z:p[2],tx,tz,m,k:0}); len+=Math.hypot(b[0]-p[0],b[1]-p[1],b[2]-p[2]); }
  G.visible=false; scene.add(G); FL.rg=G; FL.len=len; const base=len/FL_T.heli.vmax*1000; FL.medals=[Math.round(base*1.45/100)*100,Math.round(base*1.9/100)*100,Math.round(base*2.6/100)*100]; }
function flRunStep(A,x0,y0,z0,dt){ if(!FL.rings.length) return; const r=FL.run; if(r) r.t+=dt; const N=FL.rings.length, i=r?r.n%N:0, R=FL.rings[i];
  const s0=(x0-R.x)*R.tx+(z0-R.z)*R.tz, s1=(A.x-R.x)*R.tx+(A.z-R.z)*R.tz; if(!(s0<0&&s1>=0)) return; const k=s0/(s0-s1), px=x0+(A.x-x0)*k, py=y0+(A.y-y0)*k, pz=z0+(A.z-z0)*k;
  if(Math.hypot(px-R.x,py+1.2-R.y,pz-R.z)>9.6) return;
  if(!r){ FL.run={n:1,t:0}; blip('cup'); toast('¡Aros en el cielo!','Pasa los '+N+' aros en orden y vuelve al primero · el verde es el siguiente'); return; }
  r.n++; blip(r.n>N?'gold':'hit'); if(r.n>N) flRunEnd('fin'); }
function flRunEnd(why){ const r=FL.run; FL.run=null; if(!r||why!=='fin') return; const ms=Math.round(r.t*1000), rec=!FL.best||ms<FL.best, M=FL.medals, md=ms<=M[0]?'oro':ms<=M[1]?'plata':ms<=M[2]?'bronce':'';
  if(rec){ FL.best=ms; store.set('vg_fl_'+WP.key+'_aros',String(ms)); } FL.last={ms,rec,md};
  toast((md?'Medalla de '+md+' · ':'')+kartFmt(ms),rec?'¡Nuevo récord en los aros!':'Tu récord: '+kartFmt(FL.best)); prgEarn(8+(md==='oro'?12:md==='plata'?8:md==='bronce'?4:0)+(rec?5:0),'Aros en el cielo'); }

/* ---- with the room: friends see the aircraft and ride in it ---- */
function flNetState(o){ const A=P.fly; if(S.mode==='fly'&&A){ const r2=x=>Math.round(x*100)/100; o.fl=[A.i,r2(A.bank),r2(A.pitch),A.gnd?1:0]; } }
function flPeer(p,s,R,inWorld,showRig){ const on=inWorld&&s.m==='fly'&&Array.isArray(s.fl)&&FL.list[s.fl[0]]; if(!on){ if(p.flI!==undefined&&p.flI!==null){ const A=FL.list[p.flI]; if(A&&A.remoteBy===p.id) A.remoteBy=null; p.flI=null; if(R&&R.root.rotation.order!=='XYZ') R.root.rotation.order='XYZ'; } return; }
  const A=FL.list[s.fl[0]]; if(A===P.fly) return; if(p.flI!==A.i&&p.flI!==undefined&&p.flI!==null){ const B=FL.list[p.flI]; if(B&&B.remoteBy===p.id) B.remoteBy=null; }
  p.flI=A.i; A.remoteBy=p.id; A.moved=false; A.x=s.x; A.y=s.y; A.z=s.z; A.yaw=s.yaw; A.bank=+s.fl[1]||0; A.pitch=+s.fl[2]||0; A.gnd=!!s.fl[3]; A.vf=s.spd||0; A.vy=0; flPlace(A);
  if(showRig){ poseRig(R,'drive',0,0); const sp=flSeatW(A,0); R.root.position.set(sp[0],sp[1],sp[2]); R.root.rotation.order='YXZ'; R.root.rotation.set(A.bank,-A.yaw,A.pitch); } }
function flNetIn(p,o){ if(o.t!=='flp'||!Array.isArray(o.a)) return; const a=o.a.map(Number), A=FL.list[a[0]]; if(!A||A===P.fly||(A.remoteBy&&A.remoteBy!==p.id)||!a.slice(1,5).every(Number.isFinite)) return; if(A.remoteBy===p.id) A.remoteBy=null;
  A.x=a[1]; A.y=a[2]; A.z=a[3]; A.yaw=a[4]; A.gnd=!!a[5]; A.vf=A.vy=0; A.bank=A.pitch=0; A.moved=false; flPlace(A); }
// someone has just come in: tell them where the aircraft we moved are
function flHello(){ if(!MP.code) return; for(const A of FL.list) if(A.moved&&A!==P.fly&&!A.remoteBy) flPark(A); }
function flFreeSeat(p){ const s=p&&p.out; if(!s||!s.fl||!FL.list[s.fl[0]]) return -1; const n=FL_T[FL.list[s.fl[0]].type].seats, used=new Set(); for(const o of MP.peers.values()) if(o!==p&&o.out&&o.out.m==='pas'&&o.out.rd===p.id) used.add(o.out.rs|0); if(S.mode==='pas'&&PAS.pid===p.id) used.add(PAS.seat|0);
  for(let i=0;i<n;i++) if(!used.has(i)) return i; return -1; }
// a passenger who jumps out in the air falls with the glider
function flPasBail(){ const q=PAS.q; if(!q||q.kind!=='fly') return false; const A=q.v, g=Math.max(terrainAt(A.x,A.z),W.waterLevel(A.x,A.z)); if(A.gnd||A.y-g<4) return false;
  PAS.pid=null; PAS.q=null; P.y-=1.5; P.vx=Math.cos(A.yaw)*A.vf*0.5; P.vz=Math.sin(A.yaw)*A.vf*0.5; P.vy=-3; P.onGround=false; rig.root.visible=true; setMode('fall'); blip('jump'); tip('¡Has saltado! El planeador se abre solo',2600); return true; }

/* ---- the sheet, the map, the legend, the guide and the glossary ---- */
function flGo(p){ if(!p) return; if(!['walk','drive','ride','jet','bike','menu','drone','fly'].includes(S.mode)){ toast('Volar','Termina antes el golpe o sal de donde estás'); return; } $('flSheet').hidden=true; closeModal(); hideMap();
  fadeTo(()=>{ if(S.interior) exitVilla(); if(P.fly){ if(!P.fly.gnd){ const A=P.fly; A.x=A.home[0]; A.y=A.home[1]; A.z=A.home[2]; A.yaw=A.home[3]; A.gnd=true; A.vf=A.vy=0; flPlace(A); } flLeave(); } if(P.buggy) exitBuggy(); if(P.horse) dismountHorse(); if(P.jet) dismountJet(); if(BK.b) bkUnmount({stay:true}); cirLand(); mpEnterWorld();
    const A=p.a, a=A.yaw+Math.PI/2, d=p.r+1.6; let x=p.x+Math.cos(a)*d, z=p.z+Math.sin(a)*d; if(bldAt(x,z,0.5)||W.terrain(x,z)<W.waterLevel(x,z)+0.3){ x=p.x-Math.cos(a)*d; z=p.z-Math.sin(a)*d; }
    P.x=x; P.z=z; P.y=groundAt(x,z,p.y+3); P.vx=P.vy=P.vz=0; P.swim=false; P.onGround=true; P.yaw=Math.atan2(p.z-z,p.x-x); camS.yaw=P.yaw; S.snap=true; setMode('walk'); });
  setTimeout(()=>toast('Helipuerto · '+p.n,'Acércate a la aeronave y pulsa Pilotar'),700); }
function flSheet(){ closeModal(); const B=$('flBody'); if(!FL.list.length){ return; } const M=FL.medals||[0,0,0];
  let h='<h2>Volar</h2><p>Cuatro <b>coches voladores</b> y dos <b>helicópteros</b> esperan en sus helipuertos (el círculo gris con una H). Despegan y aterrizan en vertical, y si sueltas los mandos se quedan quietos en el aire.</p><div class="lbl">¿Dónde están?</div>';
  h+='<div class="tablewrap"><table class="card"><thead><tr><th>Helipuerto</th><th>Aeronave</th><th>Plazas</th><th></th></tr></thead><tbody>'+FL.pads.map((p,i)=>{ const A=p.a, T=FL_T[A.type], away=Math.hypot(A.x-p.x,A.z-p.z)>p.r; return '<tr><td>'+esc(p.n)+'</td><td><i class="dot" style="background:'+A.col+'"></i> '+T.n+(A.remoteBy?' · la lleva un amigo':away?' · fuera de su sitio':'')+'</td><td>piloto + '+T.seats+'</td><td><button class="btn small'+(i===0?' primary':'')+'" data-flp="'+i+'">Ir</button></td></tr>'; }).join('')+'</tbody></table></div>';
  h+='<h3>Aros en el cielo, contra el reloj</h3><p>Al pilotar aparecen '+FL.rings.length+' aros naranjas alrededor de la isla; el <b style="color:#1f9d4c">verde</b> es el siguiente. El reloj empieza al cruzar el primero (sobre el helipuerto del hotel) y para al volver a él tras pasar todos en orden. '+(FL.best?'Tu récord: <b>'+kartFmt(FL.best)+'</b>.':'Aún no tienes récord.')+' Medallas: oro '+kartFmt(M[0])+', plata '+kartFmt(M[1])+', bronce '+kartFmt(M[2])+'.</p>';
  h+='<h3>Cómo se vuela</h3><ul><li><b>Despegar:</b> mantén <b>Subir</b> (Espacio; ✕ o R2 en el mando).</li><li><b>Avanzar y girar:</b> joystick adelante y a los lados; hacia atrás frena y retrocede despacio.</li><li><b>Bajar:</b> mantén <b>Bajar</b> (Mayús; L2 en el mando).</li><li><b>Aterrizar:</b> baja sobre un sitio llano (suelo, azoteas planas o el pantalán), o pulsa <b>Aterrizar</b> y lo hace sola. Sobre el agua o encima de un árbol no se posa.</li><li><b>Cabina:</b> el botón <b>Cabina</b> te sienta dentro; <b>Fuera</b> vuelve a la vista exterior.</li><li><b>Con amigos:</b> con la aeronave de un amigo en tierra, acércate y pulsa <b>Subir con…</b>: caben 3 pasajeros en el coche y 5 en el helicóptero. Si saltas en pleno vuelo, bajas en planeador.</li></ul>';
  h+='<h3>Cómo se lee la pantalla</h3><ul><li><b>Altura</b> (recuadro de la derecha): metros sobre lo que tienes debajo.</li><li><b>Sombra redonda:</b> el punto del suelo que tienes justo debajo; al bajar se hace más oscura.</li><li><b>Arriba a la izquierda:</b> velocidad y, en los aros, cuál toca y el tiempo.</li><li><b>Techo de vuelo:</b> '+FL.ceil+' m sobre el embalse; el borde del mapa te hace dar la vuelta.</li></ul>';
  h+='<div class="row"><button class="btn small" id="flClose">Cerrar</button></div>'; B.innerHTML=h; $('flSheet').hidden=false; $('flSheet').scrollTop=0;
  B.querySelectorAll('[data-flp]').forEach(b=>b.onclick=()=>flGo(FL.pads[+b.dataset.flp])); $('flClose').onclick=()=>{ $('flSheet').hidden=true; }; }
function flDrawMap(g,m2c,s,big){ if(!FL.list.length) return; g.save(); const r=(big?5:3)*s;
  for(const p of FL.pads){ const [x,y]=m2c(p.x,p.z); g.fillStyle='#8f9499'; g.strokeStyle='#fff'; g.lineWidth=1.3*s; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); g.stroke(); if(big){ g.fillStyle='#fff'; g.font='900 '+(6.5*s)+'px system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('H',x,y+0.4*s); } }
  for(const A of FL.list){ if(A.gnd&&Math.hypot(A.x-A.pad.x,A.z-A.pad.z)<1&&!A.remoteBy&&A!==P.fly) continue; const [x,y]=m2c(A.x,A.z), q=r*0.95; g.fillStyle=A.type==='heli'?'#7a3fc4':'#12a3b8'; g.strokeStyle='#fff'; g.lineWidth=1.2*s; g.beginPath(); g.moveTo(x,y-q); g.lineTo(x+q,y); g.lineTo(x,y+q); g.lineTo(x-q,y); g.closePath(); g.fill(); g.stroke(); }
  if(P.fly&&FL.rings.length){ const nx=FL.run?FL.run.n%FL.rings.length:0; FL.rings.forEach((R,i)=>{ const [x,y]=m2c(R.x,R.z); g.strokeStyle=i===nx?'#1f9d4c':'#e8912c'; g.lineWidth=(i===nx?2.4:1.6)*s; g.beginPath(); g.arc(x,y,r*0.8,0,7); g.stroke(); if(big){ g.fillStyle='#16231b'; g.font='800 '+(6*s)+'px system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(i+1),x,y+0.3*s); } }); }
  g.restore(); }
function flLegend(){ if(!FL.list.length) return ''; const dia=c=>'<i style="background:'+c+';border:0;width:13px;height:13px;transform:rotate(45deg) scale(.8)"></i>';
  return '<div><i class="dot" style="background:#8f9499;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></i>Helipuerto (H): ahí espera cada aeronave</div><div>'+dia('#7a3fc4')+'Helicóptero fuera de su helipuerto</div><div>'+dia('#12a3b8')+'Coche volador fuera de su helipuerto</div>'+(P.fly?'<div><i class="dot" style="background:transparent;border:2px solid #e8912c"></i>Aros en el cielo (el verde es el siguiente)</div>':''); }
function flGuideHTML(){ if(!WP.fly||!FL.list.length) return ''; const z=[...new Set(FL.pads.map(p=>p.n))].join(', ');
  return '<li><b>Volar</b> (botón <b>Volar</b> del menú o del inicio, o andando hasta un <b>helipuerto</b>: '+z+'). Hay cuatro <b>coches voladores</b> y dos <b>helicópteros</b>. Junto a uno, <b>Pilotar</b>. Mantén <b>Subir</b> para despegar en vertical; el joystick avanza y gira, <b>Bajar</b> desciende, y si lo sueltas todo la aeronave <b>se queda quieta en el aire</b>. Se aterriza bajando sobre cualquier sitio llano (suelo, azoteas planas, el pantalán) o con el botón <b>Aterrizar</b>, que lo hace solo; sobre el agua o encima de un árbol no se posa. El recuadro <b>Altura</b> es el altímetro y la <b>sombra redonda</b> marca el suelo que tienes debajo. <b>Cabina</b> cambia a la vista del piloto y el modo foto vale en pleno vuelo. Al pilotar aparecen los <b>aros en el cielo</b>: cruza el primero y pasa los diez en orden contra el reloj (el verde es el siguiente; hay medallas y monedas). En una sala, tus amigos ven la aeronave y pueden <b>subirse de pasajeros</b> cuando está en tierra (3 en el coche, 5 en el helicóptero); quien salta en el aire baja en planeador.</li>'; }
function flGlossHTML(){ if(!WP.fly) return ''; return '<dt>Helipuerto</dt><dd>Plataforma redonda con una H pintada donde despega y aterriza una aeronave.</dd><dt>Vuelo estacionario</dt><dd>Quedarse quieto en el aire sin avanzar ni caer; es lo que hacen el helicóptero y el coche volador cuando sueltas los mandos.</dd><dt>Despegue vertical</dt><dd>Subir recto hacia arriba sin pista.</dd><dt>Altímetro</dt><dd>Instrumento que dice a qué altura vuelas; aquí, el recuadro Altura, en metros sobre lo que tienes debajo.</dd><dt>Techo de vuelo</dt><dd>La altura máxima a la que sube la aeronave.</dd><dt>Rotor</dt><dd>Las palas que giran: el grande sostiene al helicóptero y el pequeño de la cola evita que dé vueltas sobre sí mismo.</dd>'; }
{ const mf=$('mFly'); if(mf){ mf.hidden=!WP.fly; mf.onclick=()=>{ saveName(); ensureAudio(); flSheet(); }; } }
