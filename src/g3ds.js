/* ================= T1 · getting unstuck: cars, buggies, karts, horses, bikes and jet skis ================= */
// How far the sample points of a vehicle are inside what blocks it: solid buildings (with a margin rb) and trees (with a margin rt). 0 = free.
// Trees are looked up in the 3×3 cells around, so a tree just over a cell border counts too.
function dsPenAt(x,z,y,rb,rt){ let p=0;
  if(rb>0) for(const b of bldsNear(x,z)){ if(!b.solid||b.top<=y+0.5||b.base>=y+1.6) continue; if(S.interior&&(b===S.interior.b||(S.interior.skip&&S.interior.skip.includes(b)))) continue;
    if(x<b.x0-rb||x>b.x1+rb||z<b.z0-rb||z>b.z1+rb) continue; const e=nearestEdge(b,x,z)[0]; if(inBld(b,x,z)) p+=rb+e; else if(e<rb) p+=rb-e; }
  if(rt>0){ const cx=Math.floor(x/20), cz=Math.floor(z/20); for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){ const tr=treeGrid.get((cx+i)+','+(cz+j)); if(!tr) continue;
      for(const t of tr){ if(y>=t.cy) continue; const d=Math.hypot(x-t.x,z-t.z)-t.tr; if(d<rt) p+=rt-d; } } }
  return p; }
function dsPen(pts,y){ let p=0; for(const q of pts) p+=dsPenAt(q[0],q[1],y,q[2],q[3]); return p; }
// A move the vehicle's own test blocks is still allowed when it takes it further out of what it is already caught in:
// reversing out of a corner (or any way out) always works.
function dsOut(cur,nxt,y){ const a=dsPen(cur,y); return a>1e-4&&dsPen(nxt,y)<a-1e-4; }

const DS={h:[],T:0,o:null,cool:0,n:0,last:null};
// what you are on now
function dsVeh(){ const m=S.mode; if(S.interior) return null;
  if(m==='drive'&&P.buggy) return {k:KART.on?'kart':P.buggy.type?'car':'buggy',o:P.buggy};
  if(m==='ride'&&P.horse) return {k:'horse',o:P.horse};
  if(m==='bike'&&BK.b) return {k:'bike',o:BK.b};
  if(m==='jet'&&P.jet&&!(WCR[P.jet.type||'jet']||{}).sail) return {k:'jet',o:P.jet};
  if(m==='walk') return {k:'walk',o:P};
  return null; }
function dsYaw(v){ return v.k==='walk'?(P.yaw||camS.yaw):v.o.yaw; }
// the vehicle's footprint at (x,z) heading h, with e metres of extra margin: [x, z, building margin, tree margin]
function dsPts(v,x,z,h,e){ const c=Math.cos(h), s=Math.sin(h), P3=(f,b,rb,rt)=>[x+c*f,z+s*f,rb+e,rt+e];
  if(v.k==='car'){ const V=VEH[v.o.type], L=V.len*0.5, m=V.wid*0.45; return [P3(L,0,m,V.wid*0.5),P3(0,0,m,V.wid*0.5),P3(-L,0,m,V.wid*0.5)]; }
  if(v.k==='horse') return [P3(1.0,0,0.6,0.6),P3(0,0,0.6,0.7),P3(-1.1,0,0.6,0.6)];
  if(v.k==='bike') return [P3(0.5,0,0.3,0.35),P3(0,0,0.3,0.35),P3(-0.6,0,0.3,0.35)];
  if(v.k==='walk') return [P3(0,0,0.45,0.45)];
  return [P3(0.9,0,0.5,0.5),P3(0,0,0.9,0.9),P3(-0.9,0,0.5,0.5)]; }
function dsGround(v,x,z,y){ return v.k==='bike'?bkG(x,z):v.k==='horse'?W.terrain(x,z):groundAt(x,z,(y===undefined?v.o.y:y)+1.5); }
// a spot where the vehicle can stand: inside the world, dry (or deep enough for a jet ski), no pool, not a step or a steep bank
// inside the terrain that exists (the map drawing covers only part of it)
function dsInWorld(x,z){ const R=W.reg; if(!R||!R.w) return true; const m=Math.max(20,R.step*2); return x>R.x0+m&&x<R.x0+(R.w-1)*R.step-m&&z>R.z0+m&&z<R.z0+(R.h-1)*R.step-m; }
function dsSpot(v,x,z){ if(!dsInWorld(x,z)) return false; const wl=W.waterLevel(x,z), t=W.terrain(x,z);
  if(v.k==='jet'){ if(wl-t<1.0) return false; for(const [a,b] of [[2.4,0],[-2.4,0],[0,2.4],[0,-2.4]]) if(W.terrain(x+a,z+b)>W.waterLevel(x,z)-0.6||platHitJet(x+a,z+b)) return false; return true; }
  if(W.poolAt(x,z)) return false; const g=dsGround(v,x,z);
  if(v.k==='horse'?t<wl+0.1:(t<wl+0.25&&g<wl+0.25)) return false;
  const lim=v.k==='bike'?0.5:v.k==='walk'?0.8:0.6;
  for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){ const gx=x+a, gz=z+b; if(Math.abs(dsGround(v,gx,gz,g)-g)>lim) return false; if(v.k!=='walk'&&W.terrain(gx,gz)<W.waterLevel(gx,gz)+0.1&&dsGround(v,gx,gz,g)<W.waterLevel(gx,gz)+0.1) return false; }
  return true; }
function dsFits(v,x,z,h,e){ if(v.k==='jet'){ const c=Math.cos(h), s=Math.sin(h), L=(WCR[v.o.type||'jet']||WCR.jet).len+0.6; for(const d of [L,-L]){ const px=x+c*d, pz=z+s*d; if(W.terrain(px,pz)>W.waterLevel(x,z)-0.5||platHitJet(px,pz)) return false; } return true; }
  return dsPen(dsPts(v,x,z,h,e),dsGround(v,x,z))<1e-4; }
// how far you can go straight ahead from there (up to 7.5 m)
function dsRun(v,x,z,h){ const c=Math.cos(h), s=Math.sin(h); for(let d=1.5;d<=7.5;d+=1.5){ const px=x+c*d, pz=z+s*d; if(!dsSpot(v,px,pz)||!dsFits(v,px,pz,h,0.1)) return d-1.5; } return 7.5; }
function dsAng(a,b){ let d=a-b; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; return Math.abs(d); }
// the nearest free spot, facing away from what you were stuck in (pd: where you were pushing, as a unit vector)
function dsFind(v,pd){ const x0=v.o.x, z0=v.o.z, h0=dsYaw(v); let fall=null;
  for(let r=0;r<=40;r+=r<3?0.5:r<20?1:2){ const n=r===0?1:Math.min(120,Math.max(10,Math.round(r*5))); let ring=null;
    for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+r*0.37, x=x0+Math.cos(a)*r, z=z0+Math.sin(a)*r; if(!dsSpot(v,x,z)) continue;
      let ax=(r>0?Math.cos(a)*Math.min(1,r/1.5):0)-(pd?pd[0]*0.9:0), az=(r>0?Math.sin(a)*Math.min(1,r/1.5):0)-(pd?pd[1]*0.9:0);
      const ha=Math.hypot(ax,az)>0.05?Math.atan2(az,ax):h0;
      for(let j=0;j<16;j++){ const h=ha+(j%2?1:-1)*Math.ceil(j/2)*Math.PI/8; if(!dsFits(v,x,z,h,0.3)) continue; const run=dsRun(v,x,z,h);
        const sc=(run>=6?60:run*8)-dsAng(h,ha)*6-r*2; if(!ring||sc>ring.sc) ring={x,z,h,sc,run,r}; if(run>=6&&j<3) break; } }
    // the nearest ring with a way out, unless one a little further lets you face straight out
    if(ring&&(!fall||ring.sc>fall.sc)) fall=ring;
    if(fall&&r>=fall.r+(fall.run>=3?2:5)) break; }
  return fall; }
// put the vehicle (or you) there
function dsPlace(v,s){ const o=v.o, h=s.h;
  if(v.k==='car'){ o.x=s.x; o.z=s.z; o.yaw=h; o.vx=o.vz=o.vy=0; o.yr=0; o.air=false; o.y=carGround(o,s.x,s.z); placeCarMesh(o); }
  else if(v.k==='buggy'||v.k==='kart'){ o.x=s.x; o.z=s.z; o.yaw=h; o.speed=0; o.spinV=0; o.y=groundAt(s.x,s.z,o.y+3); placeBuggyMesh(o); if(v.k==='kart'){ KART.dr=null; KART.air=false; KART.h=0; o.lift=0; } }
  else if(v.k==='horse'){ o.x=s.x; o.z=s.z; o.yaw=h; o.spd=0; o.air=false; o.vy=0; o.y=W.terrain(s.x,s.z); placeHorse(o); }
  else if(v.k==='bike'){ Object.assign(o,{x:s.x,z:s.z,yaw:h,vd:h,v:0,vh:0,vy:0,vyG:0,air:false,drift:0,crash:0,pose:0,lean:0,pitch:0,trk:null,hp:null,y:bkG(s.x,s.z)}); }
  else if(v.k==='jet'){ o.x=s.x; o.z=s.z; o.yaw=h; o.v=0; }
  if(v.k==='walk'){ P.x=s.x; P.z=s.z; P.y=groundAt(s.x,s.z,P.y+3); P.vx=P.vz=P.vy=0; P.yaw=h; }
  else { P.x=o.x; P.z=o.z; P.yaw=h; }
  camS.yaw=h; camS.lastLook=0; }
const DS_NAME={car:'el coche',buggy:'el buggy',kart:'el kart',horse:'el caballo',bike:'la bici',jet:'la moto de agua',walk:''};
// auto: true when the game noticed you were stuck; false from the button, the gamepad or the U key
function dsUnstick(auto){ const v=dsVeh(); DS.h.length=0; DS.T=0; DS.cool=1.2;
  if(!v){ if(!auto){ if(S.interior) toast('Dentro de una casa','Sal por la puerta con Acción'); else toast('Desatascar','Sirve a pie, en coche, buggy, kart, caballo, bici o moto de agua'); } return false; }
  // in a kart race, back onto the track at the point you are level with
  if(v.k==='kart'&&KART.on&&KART.C&&KART.mode!=='bat'&&!KART.done){ const C=KART.C, q=kartAt(C,KART.idx*C.st), b=v.o; b.x=q.x; b.z=q.z; b.yaw=q.yaw; b.speed=auto?5:0; b.spinV=0; KART.dr=null; KART.stuckT=0; placeBuggyMesh(b); P.x=b.x; P.z=b.z; P.yaw=b.yaw; camS.yaw=q.yaw; DS.n++; DS.last={k:'kart',auto,x:b.x,z:b.z};
    toast('De vuelta a la pista','El caddie te ha recolocado'); blip('cup'); return true; }
  const th=dsThr(v), y0=dsYaw(v), sg=Math.abs(th)>0.05?Math.sign(th):1, pd=v.k==='walk'?null:[Math.cos(y0)*sg,Math.sin(y0)*sg];
  const s=dsFind(v,auto||Math.abs(th)>0.05?pd:null);
  if(!s){ if(!auto) toast('No hay un sitio libre cerca',v.k==='walk'?'Prueba a saltar o a ir hacia otro lado':'Bájate y vuelve a subir un poco más allá'); return false; }
  dsPlace(v,s); DS.n++; DS.last={k:v.k,auto,x:s.x,z:s.z,h:s.h,run:s.run,r:s.r}; blip('cup');
  if(auto) toast('Desatascado',(DS_NAME[v.k]?'Hemos sacado '+DS_NAME[v.k]:'Te hemos sacado')+' a un sitio libre, mirando hacia fuera');
  else toast('Recolocado',v.k==='walk'?'Estás en el sitio libre más cercano':'Sitio libre más cercano, mirando hacia fuera');
  return true; }
// what the stick (or the helps) ask for: forward > 0, backwards < 0
function dsThr(v){ if(v.k==='bike') return v.o.inTh||0; if(v.k==='kart') return (KART.lock||KART.done)?0:clamp(kartThr(inp.my),-1,1); return inp.my||0; }
// every frame: accelerating (or reversing) for 1.5 s and ending up where you were 1.5 s ago means you are stuck.
// It compares with where you were, not with the whole path, so bouncing back and forth against a wall counts too; a turn does not.
function dsTick(dt){ const v=dsVeh(); if(DS.cool>0) DS.cool-=dt;
  if(!v||v.k==='walk'){ DS.h.length=0; DS.o=null; return; } const o=v.o;
  if(DS.o!==o){ DS.o=o; DS.h.length=0; }
  const th=dsThr(v), busy=o.air||(v.k==='kart'&&(KART.air||KART.spin>0||KART.lock||KART.done||KART.pod))||(v.k==='bike'&&(o.crash>0||(BK.run&&BK.run.st==='count')));
  if(Math.abs(th)<0.4||busy||DS.cool>0){ DS.h.length=0; DS.T=0; return; }
  DS.T+=dt; DS.h.push([DS.T,o.x,o.z]); while(DS.h.length>2&&DS.h[1][0]<=DS.T-1.5) DS.h.shift();
  const a=DS.h[0]; if(DS.T-a[0]<1.5-1e-6) return;
  // less than 1 m at full throttle (less with a light push)
  if(Math.hypot(o.x-a[1],o.z-a[2])<0.4+0.6*Math.min(1,Math.abs(th))){ DS.h.length=0; DS.T=0; dsUnstick(true); } }
