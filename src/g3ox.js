/* ================= diversión al aire libre (J4b, solo Valdecañas con WP.kids.aire): tirolina, tobogán y trampolín, fuegos artificiales y globos ================= */
// Nombres ox*, estado OXF. Modo «ox» con OXF.k = 'zip' (colgado de la tirolina), 'slide' (tobogán) o 'dive' (trampolín).
var OXF={ok:false,zip:null,pool:null,k:null,s:0,v:0,fw:null,bal:[],balOn:false,dark:null,fwLast:-1e9};
const OX_G=9.81;
function oxFree(x,z,m){ return !bldAt(x,z,m||1)&&!W.poolAt(x,z)&&W.terrain(x,z)>W.waterLevel(x,z)+0.3; }
function oxWood(){ if(!OXF.wood) OXF.wood=new THREE.MeshLambertMaterial({color:Cc('#9a6a3c')}); return OXF.wood; }
function oxBox(g,w,h,d,mat,x,y,z){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; g.add(m); return m; }
/* ---- the zip line: from a hilltop to the reservoir. The start is the high ground with the longest free drop to deep water ---- */
function oxZipFind(){ const deep=(x,z)=>W.waterLevel(x,z)<0.5&&W.terrain(x,z)<W.waterLevel(x,z)-3, sk=(x,z)=>{ const k=W.surfAt(x,z); return k>=3&&k<=7; }, cand=[];
  for(let z=-1000;z<=900;z+=24) for(let x=-1300;x<=780;x+=24){ const t=W.terrain(x,z); if(t<18||sk(x,z)||!oxFree(x,z,4)) continue;
    for(let k=0;k<24;k++){ const a=k/24*Math.PI*2, dx=Math.cos(a), dz=Math.sin(a); let Lw=0; for(let d=50;d<=330;d+=6){ const xx=x+dx*d, zz=z+dz*d; if(deep(xx,zz)){ Lw=d; break; } } if(!Lw) continue;
      const L=Lw+24, ex=x+dx*L, ez=z+dz*L; if(!deep(ex,ez)) continue; const wl=W.waterLevel(ex,ez), drop=t+9-(wl+4.2), sl=drop/L; if(sl<0.06||sl>0.3) continue; cand.push({x,z,t,dx,dz,L,wl,sc:Math.min(L,300)+drop*2}); } }
  cand.sort((p,q)=>q.sc-p.sc);
  const t0=performance.now(); for(const c of cand){ if(performance.now()-t0>400) break; for(const th of [9,13,17]){ const ay=c.t+th, by=c.wl+4.2, sag=0.02*c.L; let ok=true;
      for(let s=4;s<c.L-4&&ok;s+=3){ const f=s/c.L, cy=ay+(by-ay)*f-sag*4*f*(1-f), x=c.x+c.dx*s, z=c.z+c.dz*s; if(cy-2.4-Math.max(W.terrain(x,z),W.waterLevel(x,z))<3||bldAt(x,z,3)||sk(x,z)&&cy-2.4-W.terrain(x,z)<8||MG.ok&&mgGroundAt(x,z)!==null) ok=false; }
      if(ok){ OXF.zms=Math.round(performance.now()-t0); return {a:[c.x,ay,c.z],b:[c.x+c.dx*c.L,by,c.z+c.dz*c.L],dir:[c.dx,c.dz],L:c.L,g:c.t,th}; } } }
  return null; }
function buildZip(){ const Z=oxZipFind(); if(!Z) return; const A=Z.a, B=Z.b, L=Math.hypot(B[0]-A[0],B[1]-A[1],B[2]-A[2]); OXF.zip=Object.assign(Z,{len:L,t:[(B[0]-A[0])/L,(B[1]-A[1])/L,(B[2]-A[2])/L],sag:0.02*Z.L,base:[A[0]-Z.dir[0]*2.8,A[2]-Z.dir[1]*2.8]});
  const g=new THREE.Group(); scene.add(g); const wood=oxWood(), gy=Z.g, top=A[1]-2.3, yaw=Math.atan2(Z.dir[1],Z.dir[0]);
  // the tower: four posts, a platform with rails and a roof, and a ladder at the back
  const T=new THREE.Group(); T.position.set(A[0],0,A[2]); T.rotation.y=-yaw; g.add(T);
  for(const [px,pz] of [[-1.2,-1.2],[1.2,-1.2],[-1.2,1.2],[1.2,1.2]]){ const p=oxBox(T,0.2,top-gy+0.2+2.4,0.2,wood,px,(gy+top+2.4)/2,pz); }
  for(let y=gy+2.5;y<top-1;y+=3) for(const [w,d,x,z] of [[2.6,0.1,0,-1.2],[2.6,0.1,0,1.2],[0.1,2.6,-1.2,0],[0.1,2.6,1.2,0]]) oxBox(T,w,0.12,d,wood,x,y,z);
  oxBox(T,2.8,0.15,2.8,wood,0,top,0); for(const s of [-1,1]){ oxBox(T,2.8,0.08,0.08,wood,0,top+1,s*1.35); oxBox(T,0.08,0.08,2.8,wood,-1.35,top+1,0); }
  const roof=new THREE.Mesh(new THREE.ConeGeometry(2.3,1.3,4),new THREE.MeshLambertMaterial({color:Cc('#2f9e44')})); roof.position.set(0,top+3.1,0); roof.rotation.y=Math.PI/4; roof.castShadow=true; T.add(roof);
  for(const s of [-0.35,0.35]) oxBox(T,0.08,top-gy,0.08,wood,-1.6,(gy+top)/2,s); for(let y=gy+0.4;y<top;y+=0.45) oxBox(T,0.06,0.06,0.78,wood,-1.6,y,0);
  // the cable (with a little sag), the buoy at the end and the trolley
  const pts=[]; for(let k=0;k<=60;k++){ const f=k/60; pts.push(new V3(A[0]+(B[0]-A[0])*f,A[1]+(B[1]-A[1])*f-Z.sag*4*f*(1-f),A[2]+(B[2]-A[2])*f)); } pts.push(new V3(B[0]+Z.dir[0]*3,W.waterLevel(B[0],B[2])+0.5,B[2]+Z.dir[1]*3));
  const cab=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),90,0.045,5,false),new THREE.MeshLambertMaterial({color:Cc('#3a3d40')})); g.add(cab);
  const bw=W.waterLevel(B[0],B[2]); const bo=new THREE.Mesh(new THREE.SphereGeometry(0.7,12,8),new THREE.MeshLambertMaterial({color:Cc('#e74c3c')})); bo.position.set(B[0]+Z.dir[0]*3,bw+0.2,B[2]+Z.dir[1]*3); g.add(bo);
  const tr=new THREE.Group(); oxBox(tr,0.3,0.18,0.16,new THREE.MeshLambertMaterial({color:Cc('#f2c94c')}),0,0,0); const bar=oxBox(tr,0.05,1.0,0.05,new THREE.MeshLambertMaterial({color:Cc('#555')}),0,-0.55,0); oxBox(tr,0.05,0.05,0.6,new THREE.MeshLambertMaterial({color:Cc('#e74c3c')}),0,-1.05,0); scene.add(tr); OXF.zip.tr=tr; OXF.zip.trS=0;
  // a sign and no trees under the low part of the cable
  bkSign(OXF.zip.base[0]+Z.dir[1]*1.6,OXF.zip.base[1]-Z.dir[0]*1.6,yaw+Math.PI/2,W.terrain(OXF.zip.base[0],OXF.zip.base[1]),'Tirolina','Hasta el agua','#e8742c');
  for(let s=0;s<Z.L;s+=5){ const f=s/Z.L, x=A[0]+Z.dir[0]*s, z=A[2]+Z.dir[1]*s, cy=A[1]+(B[1]-A[1])*f-Z.sag*4*f*(1-f); if(cy-W.terrain(x,z)<22) TREE_EXCL.push([x-4,x+4,z-4,z+4]); }
  TREE_EXCL.push([A[0]-5,A[0]+5,A[2]-5,A[2]+5]); }
function oxZipAt(s){ const Z=OXF.zip, f=clamp(s/Z.len,0,1); return [Z.a[0]+(Z.b[0]-Z.a[0])*f,Z.a[1]+(Z.b[1]-Z.a[1])*f-Z.sag*4*f*(1-f),Z.a[2]+(Z.b[2]-Z.a[2])*f]; }
/* ---- the pool: a spiral slide at one end and a diving board at the other ---- */
function oxPoolFind(){ const H=W.HOT||[0,0]; let best=null;
  for(const p of (W.POOLS||[])){ const dH=Math.hypot(p.c[0]-H[0],p.c[1]-H[1]); if(dH>420) continue; const R=p.ring, n=R.length, E=[];
    // points every metre along the edge, with the inward normal and room for water in front (4.5 m deep into the pool, 1.8 m to each side)
    for(let i=0;i<n;i++){ const a=R[i], b=R[(i+1)%n], L=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L<0.01) continue; const t=[(b[0]-a[0])/L,(b[1]-a[1])/L];
      for(let s=0.5;s<L;s+=1){ const x=a[0]+t[0]*s, z=a[1]+t[1]*s; for(const sg of [1,-1]){ const nn=[-t[1]*sg,t[0]*sg], inn=(k,q)=>W.poolAt(x+nn[0]*k+t[0]*(q||0),z+nn[1]*k+t[1]*(q||0));
          if(inn(1.5)&&inn(3)&&inn(4.5)&&inn(2.5,1.8)&&inn(2.5,-1.8)&&!W.poolAt(x-nn[0]*1.2,z-nn[1]*1.2)){ E.push({x,z,t,n:nn}); break; } } } }
    const S=[], B=[];
    for(const e of E){ const sc=[e.x-e.n[0]*2.2+e.t[0]*1.6,e.z-e.n[1]*2.2+e.t[1]*1.6], tw=[sc[0]+e.t[0]*1.6,sc[1]+e.t[1]*1.6]; let ok=oxFree(tw[0]+e.t[0]*0.9,tw[1]+e.t[1]*0.9,0.6);
      for(let k=0;k<8&&ok;k++){ const q=k/8*Math.PI*2; if(!oxFree(sc[0]+Math.cos(q)*2.1,sc[1]+Math.sin(q)*2.1,0.6)) ok=false; } if(ok) S.push({e,sc,tw});
      const bd=[e.x-e.n[0]*1.0,e.z-e.n[1]*1.0]; if(oxFree(bd[0],bd[1],0.6)&&oxFree(bd[0]-e.n[0]*1.4,bd[1]-e.n[1]*1.4,0.6)) B.push({e,bd}); }
    for(const s1 of S) for(const b1 of B){ const d=Math.hypot(b1.e.x-s1.e.x,b1.e.z-s1.e.z); if(d<9) continue; const sc=Math.min(d,30)-dH*0.05+Math.min(E.length,80)*0.05; if(!best||sc>best.sc) best={p,sc,S:s1,B:b1}; } }
  return best; }
function buildPool(){ const F=oxPoolFind(); if(!F) return; const p=F.p, lv=p.level, e1=F.S.e, e2=F.B.e, tw=F.S.tw, sc=F.S.sc, bd=F.B.bd, deck=Math.max(lv+0.12,W.terrain(tw[0],tw[1]));
  const P0=OXF.pool={p,c:p.c,lv,deck,tw,sc,bd}; const g=new THREE.Group(); scene.add(g);
  const blue=new THREE.MeshLambertMaterial({color:Cc('#2f80ed'),side:THREE.DoubleSide}), white=new THREE.MeshLambertMaterial({color:Cc('#f4f4f4')}), yel=new THREE.MeshLambertMaterial({color:Cc('#f2c94c')});
  // the slide: up the ladder to a platform at 3.3 m, a spiral round its post that ends facing the water, and a short chute into the pool
  const top=deck+3.3, R=1.6, path=[], a0=Math.atan2(e1.t[1],e1.t[0]), aN=Math.atan2(e1.n[1],e1.n[0]); let d=aN-a0; while(d>Math.PI) d-=Math.PI*2; while(d<=-Math.PI) d+=Math.PI*2; const ccw=d>0?d:d+Math.PI*2, cw=d<0?d:d-Math.PI*2, turn=Math.abs(ccw)>=Math.abs(cw)?ccw:cw;
  for(let k=0;k<=36;k++){ const f=k/36, a=a0+turn*f; path.push([sc[0]+Math.cos(a)*R,top-0.1-f*2.2,sc[1]+Math.sin(a)*R]); }
  const last=path[path.length-1], end=[sc[0]+e1.n[0]*3.9,lv+0.4,sc[1]+e1.n[1]*3.9]; for(let k=1;k<=8;k++){ const f=k/8; path.push([last[0]+(end[0]-last[0])*f,last[1]+(end[1]-last[1])*f,last[2]+(end[2]-last[2])*f]); }
  P0.path=path; let L=0; P0.cum=[0]; for(let i=1;i<path.length;i++){ L+=Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1],path[i][2]-path[i-1][2]); P0.cum.push(L); } P0.len=L;
  { const pos=[]; for(let i=0;i<path.length-1;i++){ const a=path[i], b=path[i+1], dx=b[0]-a[0], dz=b[2]-a[2], l=Math.hypot(dx,dz)||1, sx=-dz/l*0.42, sz=dx/l*0.42;
      const q=(p,s,h)=>[p[0]+sx*s,p[1]+h,p[2]+sz*s]; const A1=q(a,-1,0.35),A2=q(a,-1,-0.05),A3=q(a,1,-0.05),A4=q(a,1,0.35),B1=q(b,-1,0.35),B2=q(b,-1,-0.05),B3=q(b,1,-0.05),B4=q(b,1,0.35);
      for(const t of [[A1,A2,B2],[A1,B2,B1],[A2,A3,B3],[A2,B3,B2],[A3,A4,B4],[A3,B4,B3]]) for(const v of t) pos.push(v[0],v[1],v[2]); }
    const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); sg.computeVertexNormals(); const sm=new THREE.Mesh(sg,blue); sm.castShadow=true; g.add(sm); }
  { const post=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,top-deck+0.6,10),white); post.position.set(sc[0],(top+deck+0.6)/2,sc[1]); post.castShadow=true; g.add(post);
    const pl=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.12,1.4),yel); pl.position.set(tw[0],top-0.1,tw[1]); pl.rotation.y=-a0; g.add(pl);
    for(const [a,b] of [[-0.6,-0.6],[0.6,-0.6],[-0.6,0.6],[0.6,0.6]]){ const lg=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,top-deck,8),white); lg.position.set(tw[0]+e1.t[0]*a-e1.n[0]*b,(top+deck)/2,tw[1]+e1.t[1]*a-e1.n[1]*b); g.add(lg); }
    for(let y=deck+0.35;y<top-0.2;y+=0.35){ const r=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.05,0.9),white); r.position.set(tw[0]+e1.t[0]*0.75,y,tw[1]+e1.t[1]*0.75); r.rotation.y=-a0; g.add(r); } }
  // the diving board: a white base and a blue board 2.4 m long over the water
  { const yaw=Math.atan2(e2.n[1],e2.n[0]), bg=new THREE.Group(); bg.position.set(bd[0],deck,bd[1]); bg.rotation.y=-yaw; g.add(bg); oxBox(bg,0.8,0.6,0.7,white,0,0.3,0);
    const piv=new THREE.Group(); piv.position.set(0.2,0.66,0); bg.add(piv); oxBox(piv,2.4,0.07,0.5,new THREE.MeshLambertMaterial({color:Cc('#2f80ed')}),1.2,0,0); P0.board=piv; P0.yaw=yaw; P0.bEnd=[bd[0]+e2.n[0]*2.5,deck+0.7,bd[1]+e2.n[1]*2.5]; }
  const ch=[sc[0]-e1.n[0]*2.9,sc[1]-e1.n[1]*2.9]; P0.chest=oxFree(ch[0],ch[1],0.8)?ch:[tw[0]+e1.t[0]*1.9,tw[1]+e1.t[1]*1.9];
  for(const q of [tw,sc,bd]) TREE_EXCL.push([q[0]-4,q[0]+4,q[1]-4,q[1]+4]); }
/* ---- fireworks over the water by the hotel, and hot-air balloons that drift round the island in the evening ---- */
function buildFireworks(){ const H=W.HOT||[0,0]; let best=null; for(let r=180;r<=520&&!best;r+=20) for(let k=0;k<36&&!best;k++){ const a=k/36*Math.PI*2, x=H[0]+Math.cos(a)*r, z=H[1]+Math.sin(a)*r; if(W.waterLevel(x,z)<0.5&&W.terrain(x,z)<-3) best=[x,z]; }
  if(!best) return; const N=2600, geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N*3),3)); geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(N*3),3));
  const tex=canvasTex(64,64,(c,w,h)=>{ const gr=c.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.3,'rgba(255,255,255,0.8)'); gr.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=gr; c.fillRect(0,0,w,h); });
  const pts=new THREE.Points(geo,new THREE.PointsMaterial({size:3.2,map:tex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})); pts.frustumCulled=false; pts.visible=false; scene.add(pts);
  OXF.fw={c:best,pts,N,pos:geo.attributes.position.array,col:geo.attributes.color.array,vel:new Float32Array(N*3),life:new Float32Array(N),base:new Float32Array(N*3),rk:[],show:null,next:0,rng:null}; }
function oxRng(seed){ let s=seed>>>0||1; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
function oxFwStart(seed,delay){ const F=OXF.fw; if(!F) return; F.show={t:-(delay||0),seed:seed||((Math.random()*1e9)|0),n:0}; F.rng=oxRng(F.show.seed); F.next=0; F.pts.visible=true; OXF.fwLast=performance.now(); }
function oxFwView(){ const F=OXF.fw, H=W.HOT||F.c, d=Math.hypot(H[0]-F.c[0],H[1]-F.c[1])||1, u=[(H[0]-F.c[0])/d,(H[1]-F.c[1])/d]; for(let r=120;r<=Math.max(140,d);r+=4){ const x=F.c[0]+u[0]*r, z=F.c[1]+u[1]*r; if(oxFree(x,z,2)&&W.terrain(x,z)>W.waterLevel(x,z)+1.2) return [x,z]; } return null; }
function oxFwNow(go){ if(!OXF.fw) return; const fire=()=>{ if(TOD.night<0.5) setTOD('noche'); const seed=(Math.random()*1e9)|0; oxFwStart(seed,1.5); if(MP.code) mpSend({t:'oxfw',s:seed}); toast('¡Fuegos artificiales!','Mira hacia el agua (la estrella morada del mapa)'); };
  const v=go&&oxFwView(); if(!v){ fire(); return; } fadeTo(()=>{ if(S.interior) exitVilla(); if(P.buggy) exitBuggy(); if(P.horse) dismountHorse(); if(BK.b) bkUnmount({stay:true}); cirLand(); mpEnterWorld(); P.x=v[0]; P.z=v[1]; P.y=groundAt(P.x,P.z,99); P.vx=P.vy=P.vz=0; P.swim=false; P.yaw=Math.atan2(OXF.fw.c[1]-P.z,OXF.fw.c[0]-P.x); camS.yaw=P.yaw; camS.pitch=0.22; setMode('walk'); fire(); }); }
const OX_FWC=['#ff4d4d','#ffd23f','#4dd2ff','#7cff6b','#ff7bf2','#ffffff','#ff9f1c','#b388ff'];
function oxFwSpawn(x,y,z,vx,vy,vz,life,col){ const F=OXF.fw; for(let i=0;i<F.N;i++){ if(F.life[i]>0) continue; F.life[i]=life; F.base[i]=life; const j=i*3; F.pos[j]=x; F.pos[j+1]=y; F.pos[j+2]=z; F.vel[j]=vx; F.vel[j+1]=vy; F.vel[j+2]=vz; F.col[j]=col.r; F.col[j+1]=col.g; F.col[j+2]=col.b; F.base[i]=life; return i; } return -1; }
function oxFwBoom(x,y,z){ if(!AC||!SOUND) return; const d=Math.hypot(x-camera.position.x,y-camera.position.y,z-camera.position.z), t=AC.currentTime+Math.min(2.5,d/343), k=clamp(1-d/1600,0.05,1);
  const n=AC.createBufferSource(), g=AC.createGain(), f=AC.createBiquadFilter(); n.buffer=noiseBuf; f.type='lowpass'; f.frequency.value=320; g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(0.7*k,t+0.02); g.gain.exponentialRampToValueAtTime(0.001,t+1.1); n.connect(f); f.connect(g); g.connect(master); n.start(t); n.stop(t+1.2); }
function oxFwTick(dt){ const F=OXF.fw; if(!F||!F.pts.visible) return; const S2=F.show, R=F.rng;
  if(S2){ S2.t+=dt; if(S2.t>=0&&S2.t<48&&S2.t>=F.next){ const fin=S2.t>40, n=fin?3:1; for(let q=0;q<n;q++){ const x=F.c[0]+(R()-0.5)*90, z=F.c[1]+(R()-0.5)*60; F.rk.push({x,y:W.waterLevel(x,z)+2,z,vy:27+R()*7,vx:(R()-.5)*4,vz:(R()-.5)*4,col:Cc(OX_FWC[(R()*OX_FWC.length)|0]),c2:Cc(OX_FWC[(R()*OX_FWC.length)|0]),kind:(R()*4)|0}); S2.n++; } F.next=S2.t+(fin?0.35:0.7+R()*1.1); }
    if(S2.t>54){ F.show=null; } }
  const tmp=new THREE.Color();
  for(let i=F.rk.length-1;i>=0;i--){ const r=F.rk[i]; r.vy-=OX_G*dt; r.x+=r.vx*dt; r.y+=r.vy*dt; r.z+=r.vz*dt; oxFwSpawn(r.x,r.y,r.z,(Math.random()-.5)*2,-2,(Math.random()-.5)*2,0.5,tmp.set('#ffcf7a'));
    if(r.vy<6){ F.rk.splice(i,1); const n=r.kind===3?60:120; for(let k=0;k<n;k++){ let vx,vy,vz; if(r.kind===1){ const a=k/n*Math.PI*2; vx=Math.cos(a)*22; vz=Math.sin(a)*22; vy=(Math.random()-.5)*3; } else { const u=Math.random()*2-1, a=Math.random()*Math.PI*2, s=Math.sqrt(1-u*u), sp=r.kind===3?12:18+Math.random()*6; vx=s*Math.cos(a)*sp; vy=u*sp; vz=s*Math.sin(a)*sp; }
        oxFwSpawn(r.x,r.y,r.z,vx+r.vx,vy,vz+r.vz,r.kind===3?3.2:1.7+Math.random()*0.8,k%3===0?r.c2:r.col); } oxFwBoom(r.x,r.y,r.z); } }
  let alive=F.rk.length; for(let i=0;i<F.N;i++){ if(F.life[i]<=0) continue; alive++; F.life[i]-=dt; const j=i*3; F.vel[j+1]-=3.2*dt; const dr=Math.pow(0.35,dt); F.vel[j]*=dr; F.vel[j+1]*=dr; F.vel[j+2]*=dr; F.pos[j]+=F.vel[j]*dt; F.pos[j+1]+=F.vel[j+1]*dt; F.pos[j+2]+=F.vel[j+2]*dt;
    if(F.life[i]<=0){ F.pos[j+1]=-1e4; } else { const f=Math.min(1,F.life[i]/F.base[i]*1.6); F.col[j]*=1; if(f<1){ F.col[j]*=0.985; F.col[j+1]*=0.985; F.col[j+2]*=0.985; } } }
  F.pts.geometry.attributes.position.needsUpdate=true; F.pts.geometry.attributes.color.needsUpdate=true; if(!alive&&!F.show) F.pts.visible=false; }
function buildBalloons(){ const cx=(WP.map.x0+WP.map.x1)/2, cz=(WP.map.z0+WP.map.z1)/2, cols=[['#e74c3c','#f2c94c'],['#2f80ed','#ffffff'],['#27ae60','#f2994a'],['#9b51e0','#f2c94c'],['#eb5757','#2f80ed']];
  const prof=[]; for(let k=0;k<=14;k++){ const t=k/14, y=-9+t*19; const r=t<0.12?1.2+t*6:Math.sin(Math.min(1,(t-0.05)/0.95)*Math.PI*0.62+0.25)*8.2*(t>0.9?Math.sqrt(Math.max(0,(1-t)/0.1)):1); prof.push(new THREE.Vector2(Math.max(0.05,r),y)); }
  for(let i=0;i<5;i++){ const g=new THREE.Group(), geo=new THREE.LatheGeometry(prof,24), n=geo.attributes.position.count, col=new Float32Array(n*3), c1=Cc(cols[i][0]), c2=Cc(cols[i][1]);
    for(let v=0;v<n;v++){ const x=geo.attributes.position.getX(v), z=geo.attributes.position.getZ(v), a=Math.atan2(z,x), st=Math.floor((a+Math.PI)/(Math.PI*2)*12)%2, c=st?c2:c1; col[v*3]=c.r; col[v*3+1]=c.g; col[v*3+2]=c.b; }
    geo.setAttribute('color',new THREE.BufferAttribute(col,3)); const env=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide})); env.position.y=12; env.castShadow=false; g.add(env);
    const bk=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.0,1.4),new THREE.MeshLambertMaterial({color:Cc('#8a5a2e')})); g.add(bk); for(const [a,b] of [[-0.6,-0.6],[0.6,-0.6],[-0.6,0.6],[0.6,0.6]]){ const r=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,3.2,4),new THREE.MeshLambertMaterial({color:Cc('#444')})); r.position.set(a,2.0,b); g.add(r); }
    const fl=new THREE.Mesh(new THREE.ConeGeometry(0.3,1.1,8),new THREE.MeshBasicMaterial({color:Cc('#ffb347'),transparent:true,opacity:0.9})); fl.position.y=3.2; g.add(fl);
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:OXF.fw?OXF.fw.pts.material.map:null,color:Cc('#ff9f40'),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0.8})); glow.scale.setScalar(14); glow.position.y=8; g.add(glow);
    g.scale.setScalar(1.4); g.visible=false; scene.add(g); OXF.bal.push({g,fl,glow,a:i/5*Math.PI*2,r:300+i*80,w:(i%2?1:-1)*(0.0018+i*0.0004),h:80+i*18,ph:i*1.7,cx,cz}); } }
function oxBalTick(dt,T){ if(!OXF.bal.length) return; const on=TOD.elev<20&&S.mode!=='loading'; for(const B of OXF.bal){ B.g.visible=on; if(!on) continue; B.a+=B.w*dt; const x=B.cx+Math.cos(B.a)*B.r, z=B.cz+Math.sin(B.a)*B.r;
    B.g.position.set(x,Math.max(W.terrain(x,z),W.waterLevel(x,z))+B.h+Math.sin(T*0.15+B.ph)*6,z); const night=TOD.night>0.3, fire=night||Math.sin(T*0.9+B.ph)>0.6; B.fl.visible=fire; B.glow.visible=night; if(night) B.glow.material.opacity=0.5+0.35*Math.sin(T*9+B.ph)*Math.sin(T*3.1); B.fl.scale.y=0.8+Math.random()*0.5; } }
// built while loading, after the minigolf and before the treasure and the trees
function buildOutdoor(){ if(!WP.kids||!WP.kids.aire) return; buildZip(); buildPool(); buildFireworks(); buildBalloons(); OXF.ok=!!(OXF.zip||OXF.pool||OXF.fw); }
/* ---- riding: the zip line, the slide and the board ---- */
function oxNear(){ if(!OXF.ok||S.mode!=='walk'||P.swim) return null; const Z=OXF.zip, Q=OXF.pool;
  if(Z&&Math.hypot(P.x-Z.base[0],P.z-Z.base[1])<3.2) return {k:'oxZip',label:'Tirarte en tirolina'};
  if(Q){ if(Math.hypot(P.x-Q.tw[0],P.z-Q.tw[1])<2.8) return {k:'oxSlide',label:'Tirarte por el tobogán'}; if(Math.hypot(P.x-Q.bd[0],P.z-Q.bd[1])<2.6) return {k:'oxDive',label:'Saltar del trampolín'}; }
  return null; }
function oxDo(k){ ensureAudio(); if(k==='oxZip') oxGo('zip'); else if(k==='oxSlide') oxGo('slide'); else if(k==='oxDive') oxGo('dive'); else if(k==='oxDrop') oxZipDrop(); else if(k==='oxFlip') oxFlip(); }
function oxGo(k,tp){ const Z=OXF.zip, Q=OXF.pool; if(k==='zip'&&!Z||k!=='zip'&&!Q) return; const go=()=>{ if(S.interior) exitVilla(); if(P.buggy) exitBuggy(); if(P.horse) dismountHorse(); if(BK.b) bkUnmount({stay:true}); cirLand(); mpEnterWorld();
    OXF.k=k; OXF.s=0; OXF.v=k==='zip'?2:1.5; OXF.t=0; OXF.flip=0; OXF.flipT=-1; P.vx=P.vy=P.vz=0; P.swim=false;
    if(k==='zip'){ P.yaw=Math.atan2(Z.dir[1],Z.dir[0]); } else if(k==='dive'){ const b=Q.bEnd; P.x=b[0]; P.z=b[2]; P.y=b[1]; P.yaw=Q.yaw; OXF.ph='bounce'; } camS.yaw=P.yaw; setMode('ox'); oxStep(0); S.snap=true; };
  if(tp===false) go(); else fadeTo(go); }
function oxStep(dt){ const k=OXF.k; OXF.t+=dt; const jump=inp.jumpQ; inp.jumpQ=false;
  if(k==='zip'){ const Z=OXF.zip; OXF.v+=(OX_G*(-Z.t[1])-0.006*OXF.v*OXF.v-0.25)*dt; OXF.v=Math.max(OXF.v,1.2); OXF.s+=OXF.v*dt; const p=oxZipAt(OXF.s); P.x=p[0]; P.y=p[1]-2.3; P.z=p[2]; Z.tr.position.set(p[0],p[1]-0.1,p[2]); Z.tr.rotation.y=-P.yaw;
    oxWhoosh(OXF.v); if(jump){ if(W.waterLevel(P.x,P.z)>W.terrain(P.x,P.z)+1) oxZipDrop(); else tip('Espera a estar encima del agua para soltarte',1800); } if(OXF.s>=Z.len-0.5) oxZipDrop(); }
  else if(k==='slide'){ const Q=OXF.pool, a=oxPathAt(OXF.s), b=oxPathAt(OXF.s+0.3), sl=(b[1]-a[1])/0.3; OXF.v+=(-OX_G*sl-0.1*OXF.v-0.2)*dt; OXF.v=Math.max(OXF.v,1.2); OXF.s+=OXF.v*dt; const p=oxPathAt(OXF.s); P.x=p[0]; P.y=p[1]; P.z=p[2]; P.yaw=Math.atan2(b[2]-a[2],b[0]-a[0]);
    if(OXF.s>=Q.len-0.05){ const t=[b[0]-a[0],b[1]-a[1],b[2]-a[2]], l=Math.hypot(...t)||1; oxRelease(t[0]/l*OXF.v,t[1]/l*OXF.v+1.2,t[2]/l*OXF.v); blip('jump'); } }
  else if(k==='dive'){ const Q=OXF.pool; if(OXF.ph==='bounce'){ const f=OXF.t; Q.board.rotation.z=-Math.abs(Math.sin(f*Math.PI*2.2))*0.12*(f<1?1:0); P.y=Q.bEnd[1]+Math.abs(Math.sin(f*Math.PI*2.2))*0.35-(Math.sin(f*Math.PI*2.2)<0?0.1:0);
      if(f>=0.95){ OXF.ph='air'; P.vy=6.6; P.vx=Math.cos(Q.yaw)*1.8; P.vz=Math.sin(Q.yaw)*1.8; Q.board.rotation.z=0; blip('jump'); } }
    else { P.vy-=OX_G*dt; P.x+=P.vx*dt; P.y+=P.vy*dt; P.z+=P.vz*dt; if(jump) oxFlip(); if(OXF.flipT>=0) OXF.flipT+=dt;
      const lv=W.poolAt(P.x,P.z)?W.poolAt(P.x,P.z).level:W.waterLevel(P.x,P.z); if(P.y<=lv+0.2){ const done=OXF.flipT>=0.62, mid=OXF.flipT>0&&!done; startSplash(P.x,P.z,lv); blip('water');
        if(done){ toast('¡Salto perfecto!','Voltereta completa'); prgEarn(3,'Salto perfecto del trampolín'); prgTrophy('salto'); } else if(mid) toast('¡Planchazo!','Te ha pillado a media voltereta'); else toast('¡Al agua!','Pulsa Saltar en el aire para dar una voltereta');
        OXF.k=null; P.y=lv-0.6; P.vy=-1; setMode('walk'); P.swim=true; } } } }
function oxPathAt(s){ const Q=OXF.pool, c=Q.cum, p=Q.path; s=clamp(s,0,Q.len); let i=1; while(i<c.length-1&&c[i]<s) i++; const f=(s-c[i-1])/Math.max(1e-6,c[i]-c[i-1]); return [p[i-1][0]+(p[i][0]-p[i-1][0])*f,p[i-1][1]+(p[i][1]-p[i-1][1])*f,p[i-1][2]+(p[i][2]-p[i-1][2])*f]; }
function oxZipDrop(){ const Z=OXF.zip, v=OXF.v; oxRelease(Z.t[0]*v*0.7,Z.t[1]*v,Z.t[2]*v*0.7); Z.trS=OXF.s; toast('¡Al agua!',W.waterLevel(P.x,P.z)>W.terrain(P.x,P.z)+1?'Nada hasta la orilla':''); }
function oxRelease(vx,vy,vz){ OXF.k=null; P.vx=vx; P.vy=vy; P.vz=vz; P.onGround=false; P.cheerT=0; setMode('walk'); camS.yaw=P.yaw; }
function oxFlip(){ if(OXF.k!=='dive'||OXF.ph!=='air'||OXF.flipT>=0) return; OXF.flipT=0; }
function oxWhoosh(v){ if(!AC||!SOUND) return; if(!OXF.wh){ const n=AC.createBufferSource(); n.buffer=noiseBuf; n.loop=true; const f=AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=900; const g=AC.createGain(); g.gain.value=0; n.connect(f); f.connect(g); g.connect(master); n.start(); OXF.wh={g,f}; } OXF.wh.g.gain.value=Math.min(0.12,v*0.006); OXF.wh.f.frequency.value=600+v*40; }
function oxPose(){ if(OXF.k==='zip') return ['glide',0]; if(OXF.k==='slide') return ['drive',0]; return ['air',0]; }
function oxCam(){ const k=OXF.k, f=[Math.cos(P.yaw),Math.sin(P.yaw)]; if(k==='zip'){ camT.pos.set(P.x-f[0]*7,P.y+3.6,P.z-f[1]*7); camT.look.set(P.x+f[0]*6,P.y,P.z+f[1]*6); return 4; }
  if(k==='slide'){ camT.pos.set(P.x-f[0]*3.5,P.y+2.2,P.z-f[1]*3.5); camT.look.set(P.x+f[0]*2,P.y+0.4,P.z+f[1]*2); return 5; }
  const Q=OXF.pool, r=[-f[1],f[0]]; camT.pos.set(Q.bEnd[0]+r[0]*6-f[0]*1.5,Q.bEnd[1]+1.8,Q.bEnd[2]+r[1]*6-f[1]*1.5); camT.look.set(P.x+f[0]*1.2,P.y,P.z+f[1]*1.2); return 4; }
function oxAct(){ if(OXF.k==='zip') return {k:'oxDrop',label:'Soltarte'}; if(OXF.k==='dive'&&OXF.ph==='air'&&OXF.flipT<0) return {k:'oxFlip',label:'Voltereta'}; return null; }
function oxStatus(){ if(OXF.k==='zip') return ['Tirolina',fmt(OXF.v*3.6)+' km/h · Saltar o Soltarte sobre el agua para caer antes']; if(OXF.k==='slide') return ['Tobogán',fmt(OXF.v*3.6)+' km/h']; return ['Trampolín','En el aire, Saltar = voltereta']; }
// every frame: the flip, the trolley back to the tower, the fireworks (they start at dusk) and the balloons
function oxTick(dt,T){ if(!OXF.ok) return; const R=rig;
  if(S.mode==='ox'&&OXF.k==='dive'&&OXF.flipT>=0&&R){ const a=-Math.min(1,OXF.flipT/0.62)*Math.PI*2, c=Math.cos(P.yaw), s=Math.sin(P.yaw), ox=0.95*Math.sin(a), oy=-0.95*Math.cos(a); R.root.position.set(P.x+c*ox,P.y+0.95+oy,P.z+s*ox); R.root.rotation.set(0,-P.yaw,a); }
  const Z=OXF.zip; if(Z&&!(S.mode==='ox'&&OXF.k==='zip')){ if(Z.trS>0){ Z.trS=Math.max(0,Z.trS-dt*9); } const p=oxZipAt(Z.trS); Z.tr.position.set(p[0],p[1]-0.1,p[2]); if(OXF.wh) OXF.wh.g.gain.value=0; }
  if(OXF.fw){ const dark=TOD.night>0.6; if(OXF.dark===null) OXF.dark=dark; else if(dark&&!OXF.dark&&S.mode!=='menu'&&performance.now()-OXF.fwLast>8*60000){ oxFwStart(0,3); toast('Anochece en la isla','¡Fuegos artificiales sobre el agua!'); } OXF.dark=dark; oxFwTick(dt); }
  oxBalTick(dt,T); }
function oxNetIn(p,o){ if(o.t==='oxfw'&&OXF.fw&&!OXF.fw.show&&Number.isFinite(o.s)){ if(TOD.night<0.5) setTOD('noche'); oxFwStart(o.s|0,1); toast('Fuegos artificiales',esc(p.n||'Un amigo')+' los ha encendido'); } }
/* ---- map, legend, guide, glossary and the tab ---- */
function oxDrawMap(g,m2c,s,big){ if(!OXF.ok) return; g.save(); const Z=OXF.zip; if(Z){ const [x1,y1]=m2c(Z.a[0],Z.a[2]), [x2,y2]=m2c(Z.b[0],Z.b[2]); g.strokeStyle='#e8742c'; g.lineWidth=(big?2.2:1.6)*s; g.setLineDash([4*s,3*s]); g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); g.setLineDash([]); g.fillStyle='#e8742c'; g.beginPath(); g.arc(x1,y1,(big?3.4:2.4)*s,0,7); g.fill(); }
  const Q=OXF.pool; if(Q){ const [x,y]=m2c(Q.tw[0],Q.tw[1]); g.fillStyle='#2f80ed'; g.strokeStyle='#fff'; g.lineWidth=1.2*s; g.fillRect(x-2.6*s,y-2.6*s,5.2*s,5.2*s); g.strokeRect(x-2.6*s,y-2.6*s,5.2*s,5.2*s); }
  if(big&&OXF.fw){ const [x,y]=m2c(OXF.fw.c[0],OXF.fw.c[1]); g.fillStyle='#9b51e0'; g.font='900 '+(10*s)+'px system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('✦',x,y); } g.restore(); }
function oxLegend(){ let h=''; if(OXF.zip) h+='<div><i style="background:#e8742c;height:3px;border:0"></i>Tirolina: de la torre (punto naranja) al agua</div>'; if(OXF.pool) h+='<div><i style="background:#2f80ed;border:2px solid #fff;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></i>Piscina con tobogán y trampolín</div>'; if(OXF.fw) h+='<div><i style="background:transparent;border:0;color:#9b51e0;font-style:normal;text-align:center;line-height:12px">✦</i>Donde salen los fuegos artificiales</div>'; return h; }
function oxGuideHTML(){ if(!OXF.ok) return ''; return '<li><b>Aire libre</b> (pestaña de «Para los peques»): <b>tirolina</b> desde lo alto de una loma hasta el embalse (al pie de la torre, <b>Tirarte en tirolina</b>; al final caes al agua, o antes con Saltar si ya estás encima del agua); <b>tobogán</b> en espiral y <b>trampolín</b> en una piscina cerca del hotel (en el aire, Saltar = voltereta; si entras a media vuelta, planchazo); <b>fuegos artificiales</b> sobre el agua al anochecer (y cuando quieras con el botón; en la sala los veis todos a la vez) y <b>globos aerostáticos</b> que dan vueltas a la isla por la tarde, de noche (con el quemador encendido) y al amanecer.</li>'; }
function oxGlossHTML(){ return '<dt>Tirolina</dt><dd>Un cable tendido en cuesta: te cuelgas de una polea y bajas rodando por él.</dd><dt>Trampolín</dt><dd>La tabla que rebota sobre la piscina. Una voltereta completa antes de tocar el agua es un salto perfecto.</dd><dt>Globo aerostático</dt><dd>Un globo enorme que vuela porque el aire de dentro, calentado con un quemador, pesa menos que el de fuera.</dd>'; }
function oxTabHTML(){ if(!OXF.ok) return '<p>No hay nada de esto en este mundo.</p>'; let h='<p>Cosas para hacer al aire libre. Tus amigos de la sala te ven tirarte.</p><div class="tablewrap"><table class="card"><tbody>';
  if(OXF.zip) h+='<tr><td>🪂 <b>Tirolina</b>: '+fmt(OXF.zip.L)+' m de cable desde lo alto de la loma hasta el embalse; caes al agua al final.</td><td><button class="btn small primary" data-oxg="zip">Ir</button></td></tr>';
  if(OXF.pool) h+='<tr><td>🛝 <b>Tobogán</b> en espiral, de 3,3 m, hasta la piscina.</td><td><button class="btn small" data-oxg="slide">Tirarme</button></td></tr><tr><td>🤸 <b>Trampolín</b>: rebota, salta y pulsa Saltar en el aire para dar una voltereta.</td><td><button class="btn small" data-oxg="dive">Saltar</button></td></tr>';
  if(OXF.fw) h+='<tr><td>🎆 <b>Fuegos artificiales</b> sobre el agua: salen solos al anochecer; con el botón, ahora: te lleva a la orilla para verlos y se hace de noche.</td><td><button class="btn small" id="oxFw">Encender</button></td></tr>';
  if(OXF.bal.length) h+='<tr><td>🎈 <b>Globos aerostáticos</b>: cinco globos dan vueltas a la isla por la tarde, de noche y al amanecer.</td><td>'+(TOD.elev<20?'Ahora se ven':'Se ven al atardecer')+'</td></tr>';
  h+='</tbody></table></div><h3>Cómo se juega</h3><ul><li><b>Tirolina</b>: anda hasta la torre (punto naranja en el mapa) y pulsa <b>Tirarte en tirolina</b>. Bajas solo; con Saltar o <b>Soltarte</b> caes antes, pero solo encima del agua. Luego nadas hasta la orilla.</li><li><b>Tobogán</b>: junto a su escalera, <b>Tirarte por el tobogán</b>. <b>Trampolín</b>: junto a su base, <b>Saltar del trampolín</b>; en el aire, Saltar (o <b>Voltereta</b>) da la vuelta.</li><li><b>Fuegos</b>: míralos hacia el agua, al otro lado del hotel; la estrella morada del mapa marca el sitio.</li></ul>'; return h; }
function oxTabWire(){ document.querySelectorAll('[data-oxg]').forEach(b=>b.onclick=()=>{ $('kdSheet').hidden=true; const k=b.dataset.oxg; if(k==='zip') oxGoTo('zip'); else oxGo(k); }); const f=$('oxFw'); if(f) f.onclick=()=>{ $('kdSheet').hidden=true; oxFwNow(true); }; }
function oxGoTo(k){ const Z=OXF.zip; if(k!=='zip'||!Z) return; fadeTo(()=>{ if(S.interior) exitVilla(); if(P.buggy) exitBuggy(); if(P.horse) dismountHorse(); if(BK.b) bkUnmount({stay:true}); cirLand(); mpEnterWorld(); P.x=Z.base[0]-Z.dir[0]*1.5; P.z=Z.base[1]-Z.dir[1]*1.5; P.y=groundAt(P.x,P.z,99); P.vx=P.vy=P.vz=0; P.swim=false; P.yaw=Math.atan2(Z.dir[1],Z.dir[0]); camS.yaw=P.yaw; setMode('walk'); }); setTimeout(()=>toast('Tirolina','Pulsa «Tirarte en tirolina»'),700); }
