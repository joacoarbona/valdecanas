/* ================= J3 · bicis: aparcabicis; BMX, de montaña y de niño con ruedines; pedaleo, inclinación, derrape con freno trasero, saltos y trucos con puntos; bike park (pump track, saltos y medio tubo), sendas de bajada contra el reloj y carreras con la sala ================= */
var BK={b:null,mine:null,racks:[],pk:null,tr:null,ramps:[],run:null,pts:0,ptsK:0,best:0,t:'mtb',prevHeld:false,auto:false,popT:0,hudT:0,lpx:0,lpz:0,res:null};
{ const t=store.get('vg_bk_t'); if(t==='bmx'||t==='mtb'||t==='kid') BK.t=t; BK.best=+(store.get('vg_bk_best')||0)||0; }
// sizes in metres for a rider of scale 1 (the bike is scaled with the rider); bb bottom bracket, sad saddle, bar grips, hip of the rider
const BK_T={
  bmx:{n:'BMX',d:'Pequeña, ligera y fuerte: la de los saltos y los trucos (tailwhip). Va lenta por hierba y arena.',col:'#d6442a',r:0.26,tw:0.045,wb:0.96,bb:[-0.02,0.3],cr:0.165,sad:[-0.3,0.8],bar:[0.36,1.02],bw:0.3,hip:[-0.22,0.97],tau:0.8,vmax:9.6,acc:3.8,hop:4.6,tk:1.25,rough:0.74,sand:0.5,pump:1.25},
  mtb:{n:'De montaña',d:'Ruedas grandes y suspensión: la más rápida en sendas, hierba y bajadas.',col:'#2a6f87',r:0.36,tw:0.05,wb:1.1,bb:[-0.05,0.33],cr:0.17,sad:[-0.23,0.93],bar:[0.42,1.04],bw:0.33,hip:[-0.2,0.98],tau:0.66,vmax:11.6,acc:3.3,hop:3.7,tk:1.0,rough:0.95,sand:0.62,pump:1.0},
  kid:{n:'De niño con ruedines',d:'Con ruedines: no se cae nunca. Más lenta y con trucos sencillos (giro 360 y manos fuera).',col:'#e8559a',r:0.22,tw:0.04,wb:0.74,bb:[0,0.25],cr:0.11,sad:[-0.15,0.63],bar:[0.29,0.82],bw:0.24,hip:[-0.12,0.67],tau:0.32,vmax:5.6,acc:2.6,hop:2.4,tk:0.85,rough:0.85,sand:0.6,pump:0.8,kid:1}
};
const BK_TI=['bmx','mtb','kid'];
// tricks: points and seconds they take (faster on the BMX)
const BK_TR={spin:{n:'Giro 360',p:150,d:0.8},whip:{n:'Tailwhip',p:200,d:0.62},sup:{n:'Superman',p:120,d:0.85},nh:{n:'Manos fuera',p:80,d:0.7},flip:{n:'Mortal atrás',p:300,d:1.0}};
const BK_G=11.5;
function bkCol(t){ const it=prgItem(PRG.eq.bici); return it&&it.c?it.c:BK_T[t].col; }

/* ---- the bike model: frame, wheels, front end and cranks merged in five meshes; the geometry is shared by type and colour ---- */
const BKGEO={}; let BKMAT=null;
function bkMat(){ if(!BKMAT) BKMAT=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}); return BKMAT; }
function bkMerge(group){ group.updateMatrixWorld(true); const pos=[],nor=[],col=[]; const v=new THREE.Vector3(), n=new THREE.Vector3(), nm=new THREE.Matrix3();
  group.traverse(o=>{ if(!o.isMesh) return; const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry; const P=g.attributes.position, N=g.attributes.normal, C=g.attributes.color, mc=o.material.color; nm.getNormalMatrix(o.matrixWorld);
    for(let i=0;i<P.count;i++){ v.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld); n.fromBufferAttribute(N,i).applyMatrix3(nm).normalize(); pos.push(v.x,v.y,v.z); nor.push(n.x,n.y,n.z); if(C&&o.material.vertexColors) col.push(C.getX(i),C.getY(i),C.getZ(i)); else col.push(mc.r,mc.g,mc.b); } });
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); return g; }
function bkTube(g,mat,a,b,r){ const A=new THREE.Vector3(a[0],a[1],a[2]||0), B=new THREE.Vector3(b[0],b[1],b[2]||0); const d=B.clone().sub(A), L=d.length(); if(L<1e-4) return null;
  const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,L,6),mat); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize()); g.add(m); return m; }
function bkWheelG(r,tw,mK,mM){ const g=new THREE.Group(); g.add(new THREE.Mesh(new THREE.TorusGeometry(r-tw,tw,6,24),mK)); g.add(new THREE.Mesh(new THREE.TorusGeometry(r-tw*2.1,tw*0.35,4,24),mM));
  for(let i=0;i<6;i++){ const s=new THREE.Mesh(new THREE.BoxGeometry(0.008,(r-tw*2)*2,0.008),mM); s.rotation.z=i*Math.PI/6; g.add(s); }
  const hub=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.11,8),mM); hub.rotation.x=Math.PI/2; g.add(hub); return g; }
function bkParts(type,col){ const key=type+col; if(BKGEO[key]) return BKGEO[key]; const T=BK_T[type], L=c=>new THREE.MeshLambertMaterial({color:Cc(c)});
  const mF=L(col), mK=L(type==='mtb'?'#2b2b2b':'#1b1c1e'), mM=L('#c4c8cc'), mS=L(type==='kid'?'#ffffff':'#222222'), mG=L(type==='kid'?'#ffd84a':'#3a3a3a');
  const r=T.r, h=T.wb/2, RA=[-h,r], FA=[h,r], BB=T.bb, SC=[T.sad[0]+0.05,T.sad[1]-0.08], HT=[T.bar[0]-0.1,T.bar[1]-0.17], HB=[HT[0]+0.06,HT[1]-(type==='kid'?0.12:0.17)], tr=type==='kid'?0.022:0.026;
  const F=new THREE.Group(); bkTube(F,mF,BB,SC,tr); bkTube(F,mF,SC,HT,tr*0.9); bkTube(F,mF,BB,HB,tr*1.1); bkTube(F,mF,HB,HT,tr*1.2);
  for(const z of [-0.055,0.055]){ bkTube(F,mF,[BB[0],BB[1],z*0.6],[RA[0],RA[1],z],tr*0.6); bkTube(F,mF,[SC[0],SC[1],z*0.3],[RA[0],RA[1],z],tr*0.55); }
  bkTube(F,mM,SC,[T.sad[0],T.sad[1]-0.02],0.014);
  const sad=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.05,type==='kid'?0.14:0.12),mS); sad.position.set(T.sad[0]-0.02,T.sad[1],0); F.add(sad);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(0.085,0.012,4,14),mM); ring.position.set(BB[0],BB[1],0.07); F.add(ring);
  bkTube(F,mK,[BB[0],BB[1]+0.085,0.07],[RA[0],RA[1]+0.04,0.07],0.006); bkTube(F,mK,[BB[0],BB[1]-0.085,0.07],[RA[0],RA[1]-0.04,0.07],0.006);
  if(type==='kid'){ for(const z of [-0.27,0.27]){ bkTube(F,mM,[RA[0],RA[1],z*0.2],[RA[0]-0.04,0.1,z],0.01); const w=bkWheelG(0.1,0.03,mK,mM); w.position.set(RA[0]-0.04,0.1,z); F.add(w); } }
  if(type==='bmx'){ for(const z of [-0.12,0.12]){ const pg=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.09,8),mM); pg.rotation.x=Math.PI/2; pg.position.set(RA[0],RA[1],z); F.add(pg); } }
  const Sg=new THREE.Group(), o=p=>[p[0]-HB[0],p[1]-HB[1],p[2]||0];
  for(const z of [-0.05,0.05]) bkTube(Sg,type==='mtb'?mK:mF,o([HB[0],HB[1],z*0.5]),o([FA[0],FA[1],z]),type==='mtb'?0.016:0.013);
  if(type==='mtb') for(const z of [-0.05,0.05]) bkTube(Sg,mM,o([HB[0],HB[1],z*0.5]),o([HB[0]+(FA[0]-HB[0])*0.45,HB[1]+(FA[1]-HB[1])*0.45,z*0.8]),0.023);
  bkTube(Sg,mM,o(HT),o([T.bar[0],T.bar[1]-0.03]),0.016); bkTube(Sg,mM,o([T.bar[0],T.bar[1],-T.bw]),o([T.bar[0],T.bar[1],T.bw]),0.012);
  if(type==='bmx'){ for(const z of [-0.13,0.13]) bkTube(Sg,mM,o([T.bar[0]-0.04,T.bar[1]-0.14,z*0.4]),o([T.bar[0],T.bar[1],z]),0.011); bkTube(Sg,mM,o([T.bar[0]-0.02,T.bar[1]-0.06,-0.12]),o([T.bar[0]-0.02,T.bar[1]-0.06,0.12]),0.01); }
  for(const z of [-T.bw,T.bw]){ const gp=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.1,8),mG); gp.rotation.x=Math.PI/2; const p=o([T.bar[0],T.bar[1],z*0.86]); gp.position.set(p[0],p[1],p[2]); Sg.add(gp); }
  if(type==='kid'){ const bs=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.12,0.2),L('#f4f1ea')); const p=o([T.bar[0]+0.1,T.bar[1]-0.13]); bs.position.set(p[0],p[1],0); Sg.add(bs); }
  const Cg=new THREE.Group(); for(const s of [1,-1]){ const arm=new THREE.Mesh(new THREE.BoxGeometry(T.cr,0.02,0.015),mM); arm.position.set(s*T.cr/2,0,s*0.085); Cg.add(arm); const pd=new THREE.Mesh(new THREE.BoxGeometry(0.09,0.02,0.08),mK); pd.position.set(s*T.cr,0,s*0.13); Cg.add(pd); }
  return BKGEO[key]={fr:bkMerge(F),rw:bkMerge(bkWheelG(r,T.tw,mK,mM)),fw:bkMerge(bkWheelG(r,T.tw,mK,mM)),st:bkMerge(Sg),cr:bkMerge(Cg),HB,RA,FA,BB,ax:new THREE.Vector3(HT[0]-HB[0],HT[1]-HB[1],0).normalize()}; }
function bkMesh(type,col){ const G=bkParts(type,col), m=bkMat(), g=new THREE.Group(), mk=geo=>{ const x=new THREE.Mesh(geo,m); x.castShadow=true; return x; };
  g.add(mk(G.fr)); const rw=mk(G.rw); rw.position.set(G.RA[0],G.RA[1],0); g.add(rw); const st=new THREE.Group(); st.position.set(G.HB[0],G.HB[1],0); g.add(st); st.add(mk(G.st));
  const fw=mk(G.fw); fw.position.set(G.FA[0]-G.HB[0],G.FA[1]-G.HB[1],0); st.add(fw); const cr=mk(G.cr); cr.position.set(G.BB[0],G.BB[1],0); g.add(cr); scene.add(g); return {g,rw,fw,st,cr,ax:G.ax,t:type,col}; }

/* ---- rider on the bike: two-bone reach for legs (to the pedals) and arms (to the grips) in the side plane ---- */
function bkIK(hx,hy,tx,ty,L1,L2,kn){ let dx=tx-hx, dy=ty-hy, d=Math.hypot(dx,dy); const dm=(L1+L2)*0.998, dn=Math.abs(L1-L2)+0.02; if(d>dm){ dx*=dm/d; dy*=dm/d; d=dm; } else if(d<dn){ const k=dn/Math.max(d,1e-4); dx*=k; dy*=k; d=dn; }
  const phi=Math.atan2(dx,-dy), al=Math.acos(clamp((L1*L1+d*d-L2*L2)/(2*L1*d),-1,1)), a=phi+kn*al, kx=hx+L1*Math.sin(a), ky=hy-L1*Math.cos(a); return [a,Math.atan2(hx+dx-kx,-(hy+dy-ky))-a]; }
// pose: 0 seated, 1 standing on the pedals, 2 crouched in the air, 3 superman, 4 no hands, 5 tailwhip (legs tucked)
function bkRiderPose(R,V){ const T=BK_T[V.t]; poseRig(R,'idle',0,0); R.body.position.set(0,0.95,0);
  const pose=V.pose|0; let hx=T.hip[0], hy=T.hip[1], tau=T.tau;
  if(pose===1){ hx+=0.1; hy+=0.1; tau+=0.25; } else if(pose===2){ hx+=0.03; hy-=0.07; tau+=0.18; } else if(pose===3){ tau=1.35; hx+=0.05; hy+=0.14; } else if(pose===4){ tau=0.12; } else if(pose===5){ hy+=0.12; tau+=0.1; }
  const by=hy+0.06; R.body.position.set(hx,by,0); R.torso.rotation.z=-tau; R.headG.rotation.z=Math.min(1.05,tau*0.75);
  const a=V.cr||0; for(const [L,s] of [[R.lR,1],[R.lL,-1]]){ let fx=T.bb[0]+s*T.cr*Math.cos(a), fy=T.bb[1]+s*T.cr*Math.sin(a);
    if(pose===3){ fx=hx-1.0; fy=hy+0.2+s*0.05; } else if(pose===5){ fx=hx+0.28; fy=hy-0.3+s*0.04; }
    const q=bkIK(0,-0.06,fx-hx,fy-by,0.42,0.43,1); L.hg.rotation.set(s*0.04,0,q[0]); L.kn.rotation.z=q[1]; }
  const sx=0.46*Math.sin(tau), sy=0.06+0.46*Math.cos(tau);
  for(const [A,s] of [[R.aR,1],[R.aL,-1]]){ if(pose===4){ A.sg.rotation.set(s*0.55,0,2.4); A.el.rotation.z=0.25; continue; } if(pose===5){ A.sg.rotation.set(s*0.7,0,1.3); A.el.rotation.z=0.5; continue; }
    const q=bkIK(sx,sy,T.bar[0]-hx,T.bar[1]-by,0.3,0.29,-1); A.sg.rotation.set(s*0.12,0,q[0]+tau); A.el.rotation.z=q[1]; } }
const BKQ=[new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion()], BKE=new THREE.Euler(0,0,0,'YZX'), BKV=[new THREE.Vector3(),new THREE.Vector3()];
// places the bike (M) and the rider (R) from a visual state V: position on the ground, yaw, lean, pitch and the trick rotations
function bkRender(M,R,V,sc){ const crash=(V.pose|0)===9;
  BKE.set(V.lean,-(V.yaw+(V.spin||0)),V.pitch+(V.flip||0),'YZX'); BKQ[1].setFromEuler(BKE);
  BKE.set(V.lean,-V.yaw,V.pitch,'YZX'); BKQ[0].setFromEuler(BKE);
  const a=BKV[0].set(-0.05*sc,0.85*sc,0).applyQuaternion(BKQ[0]), b=BKV[1].set(-0.05*sc,0.85*sc,0).applyQuaternion(BKQ[1]); const px=V.x+a.x-b.x, py=V.y+a.y-b.y, pz=V.z+a.z-b.z;
  if(M){ if(crash){ BKE.set(V.lean>=0?1.42:-1.42,-V.yaw,0,'YZX'); BKQ[2].setFromEuler(BKE); M.g.position.set(V.x,V.y+0.05*sc,V.z); }
    else { BKE.set(V.lean,-(V.yaw+(V.spin||0)+(V.whip||0)),V.pitch+(V.flip||0),'YZX'); BKQ[2].setFromEuler(BKE); M.g.position.set(px,py,pz); }
    M.g.quaternion.copy(BKQ[2]); M.g.visible=true; M.rw.rotation.z=-(V.wa||0); M.fw.rotation.z=-(V.wa||0); M.st.quaternion.setFromAxisAngle(M.ax,-(V.steer||0)*0.55); M.cr.rotation.z=V.cr||0; }
  if(R){ if(crash){ poseRig(R,'fall',0,0); const s=V.lean>=0?1:-1; R.root.position.set(V.x-Math.sin(V.yaw)*0.9*s,V.y-0.72*sc,V.z+Math.cos(V.yaw)*0.9*s); R.root.rotation.set(0,-V.yaw,0); }
    else { bkRiderPose(R,V); R.root.position.set(px,py,pz); R.root.quaternion.copy(BKQ[1]); } } }

/* ---- racks: steel hoops with a BMX, a mountain bike and a kid's bike, merged in one mesh; a sign beside ---- */
function bkRackBuild(R){ const g=new THREE.Group(), L=c=>new THREE.MeshLambertMaterial({color:Cc(c)}), mm=L('#8f979e');
  for(let i=0;i<4;i++){ const zz=(i-1.5)*0.8; const hp=new THREE.Mesh(new THREE.TorusGeometry(0.34,0.022,6,14,Math.PI),mm); hp.position.set(-0.6,0.42,zz); g.add(hp); for(const s of [-1,1]){ const lg=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.42,6),mm); lg.position.set(-0.6+s*0.34,0.21,zz); g.add(lg); } }
  BK_TI.forEach((t,i)=>{ if(!R.has[t]) return; const G=bkParts(t,bkCol(t)), m=bkMat(), b=new THREE.Group(); b.scale.setScalar(t==='kid'?0.82:1); b.rotation.y=Math.PI; b.position.set(0,0,(i-1)*0.8);
    const add=(geo,x,y,p)=>{ const q=new THREE.Mesh(geo,m); q.position.set(x,y,0); (p||b).add(q); return q; }; add(G.fr,0,0); add(G.rw,G.RA[0],G.RA[1]); const st=new THREE.Group(); st.position.set(G.HB[0],G.HB[1],0); st.quaternion.setFromAxisAngle(G.ax,0.25); b.add(st); add(G.st,0,0,st); add(G.fw,G.FA[0]-G.HB[0],G.FA[1]-G.HB[1],st); add(G.cr,G.BB[0],G.BB[1]); g.add(b); });
  if(R.mesh){ scene.remove(R.mesh); R.mesh.geometry.dispose(); } const m=new THREE.Mesh(bkMerge(g),bkMat()); m.position.set(R.x,R.y,R.z); m.rotation.y=-R.yaw; m.castShadow=true; scene.add(m); R.mesh=m; }
function bkSign(x,z,yaw,y,l1,l2,col){ const tex=canvasTex(512,256,(c,w,h)=>{ c.fillStyle=col||'#2f6bd6'; c.fillRect(0,0,w,h); c.strokeStyle='#fff'; c.lineWidth=10; c.strokeRect(12,12,w-24,h-24);
    c.lineWidth=9; c.beginPath(); c.arc(150,150,40,0,7); c.stroke(); c.beginPath(); c.arc(270,150,40,0,7); c.stroke(); c.beginPath(); c.moveTo(150,150); c.lineTo(195,95); c.lineTo(250,95); c.lineTo(270,150); c.moveTo(195,95); c.lineTo(212,150); c.lineTo(250,95); c.stroke();
    c.fillStyle='#fff'; c.textAlign='left'; c.textBaseline='middle'; c.font='800 40px Figtree, system-ui, sans-serif'; c.fillText(l1,330,100); c.font='700 30px Figtree, system-ui, sans-serif'; c.fillText(l2,330,160); });
  const g=new THREE.Group(); const post=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.05,2.1,8),new THREE.MeshLambertMaterial({color:Cc('#5d6670')})); post.position.y=1.05; g.add(post);
  const bd=new THREE.Mesh(new THREE.PlaneGeometry(1.3,0.65),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide})); bd.position.y=1.85; g.add(bd); g.position.set(x,y,z); g.rotation.y=-yaw; scene.add(g); return g; }
function bkRackAdd(n,x,z,yaw,y){ const R={n,x,z,yaw,y:y!==undefined?y:W.terrain(x,z),has:{bmx:1,mtb:1,kid:1},mesh:null}; BK.racks.push(R); TREE_EXCL.push([x-4,x+4,z-4,z+4]); bkRackBuild(R);
  const c=Math.cos(yaw), s=Math.sin(yaw); bkSign(x-c*0.9+s*1.7,z-s*0.9-c*1.7,yaw+Math.PI/2,R.y,'Aparcabicis',n); return R; }
// a dry, flat, free spot near (x0,z0) away from buildings; the rack faces the most open side
function bkSpot(x0,z0,R){ const ok=(x,z)=>{ const k=W.surfAt(x,z); if(k>=3&&k<=7) return false; const g=W.terrain(x,z); if(g<W.waterLevel(x,z)+0.6||W.poolAt(x,z)) return false; if(bldAt(x,z,2.4)) return false; if(bkPkGround(x,z)!==null) return false;
    return Math.abs(W.terrain(x+1.5,z)-W.terrain(x-1.5,z))<0.6&&Math.abs(W.terrain(x,z+1.5)-W.terrain(x,z-1.5))<0.6; };
  for(let r=0;r<=R;r+=2.5){ const n=Math.max(1,Math.round(r*2.5)); for(let k=0;k<n;k++){ const a=k/n*Math.PI*2, x=x0+Math.cos(a)*r, z=z0+Math.sin(a)*r; if(!ok(x,z)) continue;
      let by=0, bs=-1; for(let j=0;j<8;j++){ const b=j/8*Math.PI*2; let s=0; for(const d of [3,6,9]) if(ok(x+Math.cos(b)*d,z+Math.sin(b)*d)) s++; if(s>bs){ bs=s; by=b; } } return [x,z,by]; } } return null; }

/* ---- the bike park: a raised dirt pad with a pump track, a line of two tabletops, a half pipe, two wooden kickers and three mounds (local u along the pad, v across) ---- */
const BK_JUMPS=[[5,9.5,13,18,1.3],[22,26.5,30,36,1.7]], BK_KICK=[[-30,8,1,3,2.2,1.0],[-4,16,-1,3,2.2,1.1]], BK_MOUND=[[-18,13,5.5,1.4],[24,-7,5,1.2],[2,1,4.5,0.9]];
const BK_PKC=['#c9b48f','#9a6a44','#8f5f3c','#d8d3c8','#b07a46','#93864f'];
function bkSm(e0,e1,x){ const t=clamp((x-e0)/(e1-e0),0,1); return t*t*(3-2*t); }
function bkPkLH(u,v){ let h=0,k=0;
  { const cu=clamp(u,-34,-10), du=u-cu, dv=v+12, off=Math.hypot(du,dv)-7, ao=Math.abs(off);
    if(ao<2.1){ const e=1-bkSm(1.55,2.05,ao); let hh; if(du===0) hh=0.12+0.55*(0.5-0.5*Math.cos(2*Math.PI*(u+34)/6)); else hh=0.12+clamp(Math.abs(du)/2.2,0,1)*0.95*Math.pow(clamp((off+1.6)/3.2,0,1),1.4); if(hh*e>h){ h=hh*e; k=1; } } }
  if(v>-21&&v<-15){ const e=1-bkSm(2.2,2.45,Math.abs(v+18)); if(e>0) for(const J of BK_JUMPS){ const [a,l,te,le,H]=J; let hh=-1; if(u>=a&&u<=l) hh=H*Math.pow((u-a)/(l-a),2.2); else if(u>l&&u<=te) hh=H; else if(u>te&&u<=le) hh=H*(0.5+0.5*Math.cos(Math.PI*(u-te)/(le-te))); if(hh*e>h){ h=hh*e; k=2; } } }
  if(u>=14&&u<=32){ const d=Math.abs(v-12); if(d<=7.4){ let hh; if(d<=2) hh=0.02; else if(d<=5.4){ const x=d-2; hh=0.02+3.38-Math.sqrt(Math.max(0,3.38*3.38-x*x)); } else hh=3.4; if(hh>=h){ h=hh; k=3; } } }
  for(const K of BK_KICK){ const [u0,v0,dir,L,Wd,H]=K, s=dir>0?u-u0:u0-u; if(s>=0&&s<=L&&Math.abs(v-v0)<=Wd/2){ const hh=H*Math.pow(s/L,1.8); if(hh>h){ h=hh; k=4; } } }
  for(const M of BK_MOUND){ const d=Math.hypot(u-M[0],v-M[1]); if(d<M[2]){ const hh=M[3]*(0.5+0.5*Math.cos(Math.PI*d/M[2])); if(hh>h){ h=hh; k=5; } } }
  return [h,k]; }
function bkPkW(u,v){ const K=BK.pk; return [K.cx+u*K.c-v*K.s,K.cz+u*K.s+v*K.c]; }
function bkPkUV(x,z){ const K=BK.pk, dx=x-K.cx, dz=z-K.cz; return [dx*K.c+dz*K.s,-dx*K.s+dz*K.c]; }
// ground of the park: the pad and its features, and an embankment (30 %) all round so you can ride on and off
function bkPkGround(x,z){ const K=BK&&BK.pk; if(!K) return null; const dx=x-K.cx, dz=z-K.cz; if(dx>70||dx<-70||dz>70||dz<-70) return null; const u=dx*K.c+dz*K.s, v=-dx*K.s+dz*K.c;
  const du=Math.max(0,Math.abs(u)-45), dv=Math.max(0,v-26,-24-v); if(du===0&&dv===0) return K.base+bkPkLH(u,v)[0];
  const d=Math.hypot(du,dv); if(d>=10.5) return null; const e=K.base-d*0.3; return e>W.terrain(x,z)?e:null; }
// on the banked turns of the pump track you can turn much harder
function bkBerm(x,z){ const q=bkPkUV(x,z), u=q[0], cu=clamp(u,-34,-10); return u!==cu&&Math.abs(Math.hypot(u-cu,q[1]+12)-7)<2.2; }
function bkInHP(x,z){ if(!BK.pk) return false; const q=bkPkUV(x,z); return q[0]>=13.5&&q[0]<=32.5&&Math.abs(q[1]-12)<=7.4; }
function bkPkTest(cx,cz,a,av,fl){ const c=Math.cos(a), s=Math.sin(a); let mn=1e9,mx=-1e9;
  for(const [u,v] of [[0,1],[-45,-24],[45,-24],[-45,26],[45,26]]){ const x=cx+u*c-v*s, z=cz+u*s+v*c; if(!bkInMap(x,z,25)||W.terrain(x,z)<W.waterLevel(x,z)+0.8||bldAt(x,z,3)) return null; }
  for(let v=-24;v<=26;v+=6.25) for(let u=-45;u<=45;u+=7.5){ const x=cx+u*c-v*s, z=cz+u*s+v*c; const g=W.terrain(x,z); if(g<W.waterLevel(x,z)+0.8) return null; const k=W.surfAt(x,z); if(k>=3&&k<=7) return null;
    if(W.poolAt(x,z)||bldAt(x,z,3)) return null; if(g<mn) mn=g; if(g>mx) mx=g; if(mx-mn>fl) return null; }
  for(const p of av){ const du=p[0]-cx, dz=p[1]-cz, u=du*c+dz*s, v=-du*s+dz*c; if(Math.abs(u)<58&&v>-37&&v<39) return null; }
  return {rng:mx-mn,max:mx}; }
function bkPkFind(){ const D=WP.bikes&&WP.bikes.park; if(!D) return null; const [tx,tz,R]=D, fl=D[3]||1.8; const av=(WP.bikes.avoid||[]).slice(); for(const k of (WP.karts||[])) for(const p of k.pts) av.push(p);
  let best=null; for(let dz=-R;dz<=R;dz+=16) for(let dx=-R;dx<=R;dx+=16){ const dd=Math.hypot(dx,dz); if(dd>R) continue; for(let ai=0;ai<6;ai++){ const a=ai*Math.PI/6, r=bkPkTest(tx+dx,tz+dz,a,av,fl); if(!r) continue; const sc=-dd*0.05-r.rng*6; if(!best||sc>best.sc) best={cx:tx+dx,cz:tz+dz,a,base:r.max+0.18,sc}; } }
  return best; }
// a height field over a rectangle of the pad (triangles only where there is a feature), with walls down to the pad on the edges
function bkPkPatch(u0,u1,v0,v1,su,sv){ const K=BK.pk, nu=Math.ceil((u1-u0)/su)+1, nv=Math.ceil((v1-v0)/sv)+1, pos=[], col=[], idx=[], H=[], cc=new THREE.Color();
  for(let j=0;j<nv;j++) for(let i=0;i<nu;i++){ const u=Math.min(u1,u0+i*su), v=Math.min(v1,v0+j*sv), q=bkPkLH(u,v), w=bkPkW(u,v); H.push(q[0]); pos.push(w[0],K.base+q[0]+0.012,w[1]); cc.set(BK_PKC[q[1]]).convertSRGBToLinear(); const f=0.86+Math.min(0.18,q[0]*0.05)+((i*7+j*13)%5)*0.012; col.push(cc.r*f,cc.g*f,cc.b*f); }
  for(let j=0;j<nv-1;j++) for(let i=0;i<nu-1;i++){ const a=j*nu+i, b=a+1, c=a+nu, d=c+1; if(H[a]<0.004&&H[b]<0.004&&H[c]<0.004&&H[d]<0.004) continue; idx.push(a,c,b,b,c,d); }
  const edge=(ids)=>{ for(let k=0;k<ids.length-1;k++){ const a=ids[k], b=ids[k+1]; if(H[a]<0.004&&H[b]<0.004) continue; const n=pos.length/3; for(const q of [a,b]){ pos.push(pos[q*3],K.base,pos[q*3+2]); col.push(col[q*3]*0.75,col[q*3+1]*0.75,col[q*3+2]*0.75); } idx.push(a,b,n,b,n+1,n); } };
  const row=j=>Array.from({length:nu},(_,i)=>j*nu+i), cl=i=>Array.from({length:nv},(_,j)=>j*nu+i); edge(row(0)); edge(row(nv-1)); edge(cl(0)); edge(cl(nu-1));
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); g.setIndex(idx); g.computeVertexNormals();
  const m=new THREE.Mesh(g,bkMat()); m.receiveShadow=true; m.castShadow=true; scene.add(m); return m; }
function bkPkBuild(F){ const K=BK.pk={cx:F.cx,cz:F.cz,a:F.a,c:Math.cos(F.a),s:Math.sin(F.a),base:F.base}; const ring=[[-56,-35],[56,-35],[56,37],[-56,37]].map(p=>bkPkW(p[0],p[1]));
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const p of ring){ x0=Math.min(x0,p[0]); x1=Math.max(x1,p[0]); z0=Math.min(z0,p[1]); z1=Math.max(z1,p[1]); } TREE_EXCL.push([x0,x1,z0,z1]); W.GRASS_CLEAR=(W.GRASS_CLEAR||[]).concat([ring]);
  // pad and embankment
  { const pos=[], col=[], idx=[], st=2, nu=57, nv=37, cc=new THREE.Color(); for(let j=0;j<nv;j++) for(let i=0;i<nu;i++){ const u=-56+i*st, v=-35+j*st, du=Math.max(0,Math.abs(u)-45), dv=Math.max(0,v-26,-24-v), d=Math.hypot(du,dv), w=bkPkW(u,v);
      pos.push(w[0],K.base-Math.min(d,11)*0.3,w[1]); cc.set(d>0?'#a99470':BK_PKC[0]).convertSRGBToLinear(); const f=0.92+((i*5+j*3)%4)*0.025; col.push(cc.r*f,cc.g*f,cc.b*f); }
    for(let j=0;j<nv-1;j++) for(let i=0;i<nu-1;i++){ const a=j*nu+i, b=a+1, c=a+nu, d=c+1; idx.push(a,c,b,b,c,d); }
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); g.setIndex(idx); g.computeVertexNormals(); const m=new THREE.Mesh(g,bkMat()); m.receiveShadow=true; scene.add(m); K.pad=m; }
  K.meshes=[bkPkPatch(-43.5,-0.5,-21,-3,0.35,0.3),bkPkPatch(3,37,-21,-15,0.25,0.25),bkPkPatch(13.5,32.5,4.4,19.6,0.5,0.15),bkPkPatch(-31,-26.5,6.6,9.4,0.25,0.4),bkPkPatch(-7.5,-3,14.6,17.4,0.25,0.4),bkPkPatch(-24,-12,7,19,0.4,0.4),bkPkPatch(18.5,29.5,-12.5,-1.5,0.4,0.4),bkPkPatch(-3,7,-4,6,0.4,0.4)];
  { const pm=new THREE.MeshLambertMaterial({color:Cc('#9aa3ab')}); for(const s of [-1,1]){ const L=19, w=bkPkW(23,12+s*5.4); const cp=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,L,8),pm); cp.position.set(w[0],K.base+3.43,w[1]); cp.rotation.set(0,-K.a,Math.PI/2); scene.add(cp); } }
  // the pump track as a course (three laps against the clock)
  const pts=[]; const push=(u,v)=>pts.push(bkPkW(u,v)); for(let u=-22;u<-10;u+=1) push(u,-5); for(let k=0;k<22;k++){ const f=k/22*Math.PI; push(-10+7*Math.sin(f),-12+7*Math.cos(f)); } for(let u=-10;u>-34;u-=1) push(u,-19); for(let k=0;k<22;k++){ const f=k/22*Math.PI; push(-34-7*Math.sin(f),-12-7*Math.cos(f)); } for(let u=-34;u<-22;u+=1) push(u,-5);
  K.pump={id:'pump',n:'Pump track',kind:'pump',pts,closed:true,laps:3,len:bkLen(pts,true),txt:'Tres vueltas al circuito de lomas y curvas peraltadas del bike park. Sin pedalear también se avanza: empuja (adelante) al bajar cada loma.'}; K.pump.gates=bkGates(K.pump,12,4.6);
  const sg=bkPkW(-6,22.5); bkSign(sg[0],sg[1],K.a+Math.PI/2,K.base,'Bike park','Pump track · saltos · medio tubo','#e8742c');
  W.POIS=W.POIS||[]; const cw=bkPkW(0,0); W.POIS.push({n:'Bike park',p:[cw[0],K.base+9,cw[1]]}); }

/* ---- downhill trails: found from the relief (the longest clean descents away from greens, tees, buildings and trees), with two wooden kickers each ---- */
function bkTreeNear(x,z,m){ for(let i=Math.floor((x-m-3)/20);i<=Math.floor((x+m+3)/20);i++) for(let j=Math.floor((z-m-3)/20);j<=Math.floor((z+m+3)/20);j++){ const a=treeGrid.get(i+','+j); if(a) for(const t of a) if(Math.hypot(x-t.x,z-t.z)<t.tr+m) return true; } return false; }
function bkInMap(x,z,m){ const M=WP.map; return x>M.x0+m&&x<M.x1-m&&z>M.z0+m&&z<M.z1-m; }
function bkTrailOK(x,z){ const C=W.CORE; if(x<C[0]+30||z<C[1]+30||x>C[0]+C[2]-30||z>C[1]+C[2]-30||!bkInMap(x,z,30)) return false; const g=W.terrain(x,z); if(g<W.waterLevel(x,z)+0.5||W.poolAt(x,z)) return false;
  const k=W.surfAt(x,z); if(k>=4&&k<=7) return false; if(bldAt(x,z,4)) return false; if(BK.pk&&bkPkGround(x,z)!==null) return false; for(const R of BK.racks) if(Math.hypot(R.x-x,R.z-z)<6) return false; return !bkTreeNear(x,z,1.5); }
function bkTrailWalk(x,z,ok){ const H=W.terrain, step=6; let hd=0, bd=-1e9; const h0=H(x,z);
  for(let k=0;k<16;k++){ const a=k/16*Math.PI*2, d=h0-H(x+Math.cos(a)*15,z+Math.sin(a)*15); if(d>bd){ bd=d; hd=a; } }
  const pts=[[x,z]]; let cx=x, cz=z, ch=h0, fair=0, flat=0, lastGood=1;
  for(let n=0;n<170;n++){ let best=null;
    for(let t=-3;t<=3;t++){ const a=hd+t*0.2, nx=cx+Math.cos(a)*step, nz=cz+Math.sin(a)*step; if(!ok(nx,nz)||!ok(cx+Math.cos(a)*step*0.5,cz+Math.sin(a)*step*0.5)) continue;
      let self=false; for(let i=0;i<pts.length-3;i++) if(Math.abs(pts[i][0]-nx)<9&&Math.abs(pts[i][1]-nz)<9&&Math.hypot(pts[i][0]-nx,pts[i][1]-nz)<9){ self=true; break; } if(self) continue;
      const nh=H(nx,nz), drop=ch-nh; if(drop<-0.4||drop>2.2) continue; const sf=W.surfAt(nx,nz), sc=drop*3-Math.abs(t)*0.35-(sf===3?2.5:0)+(sf===8?0.3:0); if(!best||sc>best.sc) best={sc,a,nx,nz,nh,sf,drop}; }
    if(!best) break; hd=best.a; cx=best.nx; cz=best.nz; ch=best.nh; pts.push([cx,cz]); if(best.sf===3) fair++; if(best.drop<0.1) flat++; else { flat=0; lastGood=pts.length; } if(flat>=8) break;
    if(W.terrain(cx,cz)<W.waterLevel(cx,cz)+1.6) { lastGood=pts.length; break; } }
  pts.length=lastGood; if(pts.length<2) return null; const len=(pts.length-1)*step, drop=h0-H(pts[pts.length-1][0],pts[pts.length-1][1]); if(len<220||drop<8) return null; return {pts,sc:drop+Math.min(len,800)*0.025-fair*0.6}; }
function bkTrailFind(sp,used){ const C=W.CORE, st=24, near=sp.near, R=sp.r||1e9;
  const far=(x,z,m)=>{ for(const t of used) for(let i=0;i<t.length;i+=2) if(Math.abs(t[i][0]-x)<m&&Math.abs(t[i][1]-z)<m) return false; return true; }, ok=(x,z)=>bkTrailOK(x,z)&&far(x,z,26);
  const x0=near?near[0]-R:C[0], x1=near?near[0]+R:C[0]+C[2], z0=near?near[1]-R:C[1], z1=near?near[1]+R:C[1]+C[2]; const S0=[];
  for(let z=z0;z<=z1;z+=st) for(let x=x0;x<=x1;x+=st){ if(near&&Math.hypot(x-near[0],z-near[1])>R) continue; if(!ok(x,z)) continue; S0.push([x,z,W.terrain(x,z)]); }
  S0.sort((a,b)=>b[2]-a[2]); const tried=[]; let best=null; for(const t of used) tried.push([t[0][0],t[0][1]]);
  for(const s of S0){ if(tried.length>=70) break; if(tried.some((t,i)=>{ const m=i<used.length?170:70; return Math.abs(t[0]-s[0])<m&&Math.abs(t[1]-s[1])<m; })) continue; tried.push(s); const p=bkTrailWalk(s[0],s[1],ok); if(p&&(!best||p.sc>best.sc)) best=p; }
  return best?best.pts:null; }
function bkLen(p,closed){ let L=0; for(let i=1;i<p.length;i++) L+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]); if(closed) L+=Math.hypot(p[0][0]-p[p.length-1][0],p[0][1]-p[p.length-1][1]); return L; }
function bkResample(p,d){ const out=[p[0].slice()]; let acc=0; for(let i=1;i<p.length;i++){ const a=p[i-1], b=p[i], L=Math.hypot(b[0]-a[0],b[1]-a[1]); let s=d-acc; while(s<=L){ out.push([a[0]+(b[0]-a[0])*s/L,a[1]+(b[1]-a[1])*s/L]); s+=d; } acc=L-(s-d); }
  const l=p[p.length-1]; if(Math.hypot(l[0]-out[out.length-1][0],l[1]-out[out.length-1][1])>0.5) out.push(l.slice()); return out; }
function bkTan(p,i,closed){ const n=p.length, a=p[closed?(i-2+n)%n:Math.max(0,i-2)], b=p[closed?(i+2)%n:Math.min(n-1,i+2)]; let tx=b[0]-a[0], tz=b[1]-a[1]; const l=Math.hypot(tx,tz)||1; return [tx/l,tz/l]; }
// gates every so many metres along a course (the first is the start; on a trail the last is the finish)
function bkGates(c,sp,w){ const p=c.pts, G=[], end=c.closed?p.length:Math.max(2,p.length-4); let acc=0, next=0; for(let i=0;i<end;i++){ if(i>0) acc+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]);
    const last=!c.closed&&i===end-1; if(acc>=next-1e-6||last){ if(last&&G.length&&acc-G[G.length-1].s<sp*0.4) G.pop(); const t=bkTan(p,i,c.closed); G.push({x:p[i][0],z:p[i][1],tx:t[0],tz:t[1],nx:-t[1],nz:t[0],w,s:acc,i}); next=acc+sp; } }
  if(c.closed&&G.length>1&&c.len-G[G.length-1].s<sp*0.5) G.pop(); return G; }
function bkTrails(){ if(BK.tr) return BK.tr; BK.tr=[]; const spec=(WP.bikes&&WP.bikes.trails)||[], used=[];
  try{ spec.forEach((sp,i)=>{ const P0=bkTrailFind(sp,used); if(!P0) return; used.push(P0); BK.tr.push(bkTrailMake(P0,sp,BK.tr.length)); }); }catch(e){ console.warn('sendas',e); }
  return BK.tr; }
function bkTrailMake(P0,sp,i){ let p=P0; for(let it=0;it<3;it++){ const q=[p[0]]; for(let k=0;k<p.length-1;k++){ const a=p[k], b=p[k+1]; q.push([a[0]*0.75+b[0]*0.25,a[1]*0.75+b[1]*0.25],[a[0]*0.25+b[0]*0.75,a[1]*0.25+b[1]*0.75]); } q.push(p[p.length-1]); p=q; }
  const pts=bkResample(p,2), s=pts[0], e=pts[pts.length-1]; const c={id:'t'+i,n:sp.n,kind:'trail',pts,closed:false,laps:1,len:bkLen(pts),drop:W.terrain(s[0],s[1])-W.terrain(e[0],e[1])};
  c.txt=fmt(c.len)+' m de senda y '+fmt(c.drop)+' m de desnivel, con dos rampas de madera. Sales del arco verde y llegas al arco de cuadros.'; c.gates=bkGates(c,45,7);
  c.ramps=[]; for(const f of [0.33,0.68]){ const k=bkStraight(pts,Math.floor(pts.length*f)); if(k<0) continue; const t=bkTan(pts,k,false), R={x:pts[k][0],z:pts[k][1],c:t[0],s:t[1],len:2.4,hw:0.85,h:0.75}; BK.ramps.push(R); c.ramps.push(R); }
  { const w=1.9, L=c.pts, rings=[]; for(let k=0;k<L.length-1;k+=8){ const e=Math.min(L.length-1,k+8), a=bkTan(L,k,false), b=bkTan(L,e,false); rings.push([[L[k][0]-a[1]*w,L[k][1]+a[0]*w],[L[e][0]-b[1]*w,L[e][1]+b[0]*w],[L[e][0]+b[1]*w,L[e][1]-b[0]*w],[L[k][0]+a[1]*w,L[k][1]-a[0]*w]]); } W.GRASS_CLEAR=(W.GRASS_CLEAR||[]).concat(rings); }
  bkTrailMeshes(c); return c; }
function bkStraight(p,k0){ for(let d=0;d<40;d++) for(const k of [k0+d,k0-d]){ if(k<6||k>p.length-8) continue; const a=bkTan(p,k-4,false), b=bkTan(p,k+5,false); if(a[0]*b[0]+a[1]*b[1]>0.99) return k; } return -1; }
function bkRibbon(pts,w,col,dy){ const pos=[], cl=[], idx=[], cc=new THREE.Color(col).convertSRGBToLinear();
  for(let i=0;i<pts.length;i++){ const t=bkTan(pts,i,false); for(const s of [-1,1]){ const x=pts[i][0]-t[1]*s*w/2, z=pts[i][1]+t[0]*s*w/2; pos.push(x,W.terrain(x,z)+dy,z); const j=0.88+0.12*Math.abs(Math.sin(i*1.7+s)); cl.push(cc.r*j,cc.g*j,cc.b*j); } }
  for(let i=0;i<pts.length-1;i++){ const a=i*2; idx.push(a,a+2,a+1,a+1,a+2,a+3); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(cl,3)); g.setIndex(idx); g.computeVertexNormals();
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2})); m.receiveShadow=true; scene.add(m); return m; }
function bkArch(G,txt,fin){ const g=new THREE.Group(), L=c=>new THREE.MeshLambertMaterial({color:Cc(c)}), yaw=Math.atan2(G.tz,G.tx), hw=G.w/2; let ym=-1e9;
  for(const s of [-1,1]){ const x=G.x+G.nx*s*hw, z=G.z+G.nz*s*hw, y=W.terrain(x,z); ym=Math.max(ym,y); const p=new THREE.Mesh(new THREE.CylinderGeometry(0.09,0.11,3.4,8),L(fin?'#16231b':'#2a7d46')); p.position.set(x,y+1.7,z); g.add(p); }
  const tex=canvasTex(512,80,(c,w,h)=>{ if(fin){ for(let i=0;i<32;i++) for(let j=0;j<5;j++){ c.fillStyle=(i+j)%2?'#16231b':'#ffffff'; c.fillRect(i*16,j*16,16,16); } c.fillStyle='rgba(22,35,27,.8)'; c.fillRect(110,10,292,60); } else { c.fillStyle='#2a7d46'; c.fillRect(0,0,w,h); }
    c.fillStyle='#fff'; c.font='800 40px Figtree, system-ui, sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(txt,w/2,h/2+2); });
  const ban=new THREE.Mesh(new THREE.PlaneGeometry(G.w+0.3,0.8),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide})); ban.position.set(G.x,ym+3.1,G.z); ban.rotation.y=Math.atan2(-Math.cos(yaw),-Math.sin(yaw)); g.add(ban); scene.add(g); return g; }
function bkTrailMeshes(c){ c.rib=bkRibbon(c.pts,3,'#8a6a46',0.09); const G0=c.gates[0], G1=c.gates[c.gates.length-1]; bkArch(G0,'SALIDA · '+c.n.toUpperCase(),false); bkArch(G1,'META',true);
  const g=new THREE.Group(), L=x=>new THREE.MeshLambertMaterial({color:Cc(x)}), wd=L('#7a5534'), or=L('#ff7a1a');
  for(const G of c.gates.slice(1,-1)) for(const s of [-1,1]){ const x=G.x+G.nx*s*G.w/2, z=G.z+G.nz*s*G.w/2, y=W.terrain(x,z); const p=new THREE.Mesh(new THREE.BoxGeometry(0.12,1.1,0.12),wd); p.position.set(x,y+0.55,z); g.add(p); const t=new THREE.Mesh(new THREE.BoxGeometry(0.14,0.22,0.14),or); t.position.set(x,y+1.15,z); g.add(t); }
  for(const R of c.ramps){ const yaw=Math.atan2(R.s,R.c); for(let k=0;k<6;k++){ const s=(k+0.5)/6*R.len, x=R.x+R.c*s, z=R.z+R.s*s, h=R.h*Math.pow(s/R.len,1.8)+0.02; const b=new THREE.Mesh(new THREE.BoxGeometry(R.len/6+0.02,0.06,R.hw*2),L(k%2?'#b07a46':'#a26f3e')); const y0=W.terrain(x,z);
      b.position.set(x,y0+h,z); b.rotation.set(0,-yaw,Math.atan(R.h*1.8*Math.pow(s/R.len,0.8)/R.len)); g.add(b); const sd=new THREE.Mesh(new THREE.BoxGeometry(R.len/6,h+0.4,R.hw*2-0.1),wd); sd.position.set(x,y0+h/2-0.2,z); sd.rotation.y=-yaw; g.add(sd); } }
  const m=new THREE.Mesh(bkMerge(g),bkMat()); m.castShadow=true; scene.add(m); c.posts=m; }
function bkRampH(x,z){ let best=null; for(const R of BK.ramps){ const dx=x-R.x, dz=z-R.z; if(dx*dx+dz*dz>9) continue; const s=dx*R.c+dz*R.s, l=-dx*R.s+dz*R.c; if(s<0||s>R.len||Math.abs(l)>R.hw) continue; const h=R.h*Math.pow(s/R.len,1.8); if(best===null||h>best) best=h; } return best; }
// ground for the bike and for walking (also read by terrainAt): the park, the trail kickers, or null
function bkGroundAt(x,z){ if(typeof BK==='undefined'||!BK) return null; const p=bkPkGround(x,z); if(p!==null) return p; if(BK.ramps.length){ const r=bkRampH(x,z); if(r!==null) return W.terrain(x,z)+r; } return null; }
function bkG(x,z){ const g=bkGroundAt(x,z); return g!==null?g:W.terrain(x,z); }

/* ---- built while loading, before the trees: the park and the racks; the trails a moment later, once the trees are in ---- */
function buildBikes(){ const D=WP.bikes; if(!D) return; const t0=performance.now();
  try{ const F=bkPkFind(); BK.pkMs=Math.round(performance.now()-t0); if(F) bkPkBuild(F); }catch(e){ console.warn('bike park',e); }
  try{ for(const r of ((typeof D.racks==='function'?D.racks(W):D.racks)||[])){ const sp=bkSpot(r.p[0],r.p[1],r.r||45); if(sp) bkRackAdd(r.n,sp[0],sp[1],sp[2]); }
    if(BK.pk){ const w=bkPkW(4,23.5), K=BK.pk; bkRackAdd('Bike park',w[0],w[1],Math.atan2(-K.c,K.s),K.base); } }catch(e){ console.warn('aparcabicis',e); }
}
// the trails need the trees (to go round them) and go before the grass (which is cleared along them)
function bkTrailsBoot(){ if(!WP.bikes) return; const t0=performance.now(); try{ bkTrails(); }catch(e){ console.warn('sendas',e); } BK.trMs=Math.round(performance.now()-t0); }

/* ---- taking, riding and leaving a bike ---- */
function bkCanStart(){ return ['walk','drive','ride','jet','bike','menu','drone'].includes(S.mode); }
function bkLeaveAll(){ if(S.mode==='menu'||S.mode==='drone') cirLand(); if(S.interior) exitVilla(); if(P.buggy) exitBuggy(); if(S.mode==='ride') dismountHorse(); if(S.mode==='jet') dismountJet(); if(KART.on) kartEnd('Has dejado la carrera'); if(CIR.on) cirClear(); }
function bkReturn(){ const m=BK.mine; if(!m) return; if(BK.b) bkUnmount({stay:true}); if(m.M) scene.remove(m.M.g); if(m.rack){ m.rack.has[m.t]=1; bkRackBuild(m.rack); } BK.mine=null; }
function bkSpawn(type,x,z,yaw,rack){ bkReturn(); const sc=rig?rig.root.scale.y:1, M=bkMesh(type,bkCol(type)); M.g.scale.setScalar(sc);
  if(rack){ rack.has[type]=0; bkRackBuild(rack); } BK.mine={t:type,rack:rack||null,M,sc,x,z,yaw}; BK.t=type; store.set('vg_bk_t',type); bkMount(); }
function bkTake(type,rack){ const c=Math.cos(rack.yaw), s=Math.sin(rack.yaw), off=(BK_TI.indexOf(type)-1)*0.8; bkSpawn(type,rack.x+c*1.3-s*off,rack.z+s*1.3+c*off,rack.yaw,rack); }
function bkMount(){ const m=BK.mine; if(!m) return; if(P.buggy) exitBuggy(); if(S.mode==='ride') dismountHorse(); if(S.mode==='jet') dismountJet();
  BK.b={t:m.t,M:m.M,sc:m.sc,x:m.x,z:m.z,y:bkG(m.x,m.z),yaw:m.yaw,vd:m.yaw,v:0,vy:0,vh:0,air:false,lean:0,pitch:0,spin:0,flip:0,whip:0,cr:0,wa:0,steer:0,pose:0,trk:null,done:[],airT:0,crash:0,drift:0,dT:0,press:false,ped:0};
  BK.pts=0; BK.ptsK=0; BK.lpx=m.x; BK.lpz=m.z; P.x=m.x; P.z=m.z; P.y=BK.b.y; P.yaw=m.yaw; setMode('bike'); camS.yaw=m.yaw; S.snap=true; bkHud(true);
  tip('Adelante: pedalear · Esprint: a tope · Saltar: salto (mantenlo girando para derrapar) · en el aire, Saltar + joystick: trucos',5200); }
function bkUnmount(o){ o=o||{}; const B=BK.b; if(!B) return; BK.b=null; const m=BK.mine; if(m){ m.x=B.x; m.z=B.z; m.yaw=B.yaw; bkParked(); }
  if(!o.stay){ const c=Math.cos(B.yaw), s=Math.sin(B.yaw); let x=B.x-s*1.0, z=B.z+c*1.0; if(bldAt(x,z,0.4)){ x=B.x+s*1.0; z=B.z-c*1.0; } P.x=x; P.z=z; P.y=groundAt(x,z,B.y+2); P.vx=P.vz=P.vy=0; P.yaw=B.yaw; if(S.mode==='bike') setMode('walk'); }
  if(BK.run&&BK.run.st!=='done'){ bkRunClear(); toast('Has dejado la carrera','Vuelve a empezarla desde «Bicis»'); }
  $('bkHud').hidden=true; document.body.classList.remove('bkon'); $('bkTrick').classList.remove('show'); }
function bkParked(){ const m=BK.mine; if(!m||BK.b) return; const y=bkG(m.x,m.z), c=Math.cos(m.yaw), s=Math.sin(m.yaw); bkRender(m.M,null,{t:m.t,x:m.x,y,z:m.z,yaw:m.yaw,lean:0.16,pitch:Math.atan((bkG(m.x+c*0.5,m.z+s*0.5)-bkG(m.x-c*0.5,m.z-s*0.5))),spin:0,flip:0,whip:0,cr:0.6,wa:0,steer:0.4,pose:0},m.sc); }
// what the action button offers on foot near a bike or a rack
function bkNear(){ const m=BK.mine; if(m&&!BK.b){ const d=Math.hypot(P.x-m.x,P.z-m.z); if(d<2.6) return {k:'bkMount',label:'Montar en la bici',ref:m,d}; }
  let best=null, bd=3.4; for(const R of BK.racks){ const d=Math.hypot(P.x-R.x,P.z-R.z); if(d<bd){ bd=d; best=R; } } return best?{k:'bkRack',label:'Coger una bici',ref:best,d:bd}:null; }
function bkDo(k,ref){ if(k==='bkOff') bkUnmount(); else if(k==='bkMount') bkMount(); else if(k==='bkRack') bkSheet(ref); }

/* ---- riding: pedals, slope, surface, steering and lean, rear-brake drift, hops, take-offs from crests and ramps, tricks and landings ---- */
function bkSurf(x,z,T){ if(BK.pk&&bkPkGround(x,z)!==null) return {f:1,roll:0.12,pump:1}; const g=W.terrain(x,z), wl=W.waterLevel(x,z); if(wl>g+0.05) return {f:0.45,roll:1.6,wet:1};
  const k=W.surfAt(x,z); if(k===7||k===9) return {f:T.sand,roll:1.6}; if(k===1||k===0) return {f:T.rough,roll:0.42}; if(k===2||k===10) return {f:(1+T.rough)/2,roll:0.3}; return {f:1,roll:0.16}; }
function bkBlocked(B,nx,nz,dt,hv){ const g=W.terrain(nx,nz); if(W.waterLevel(nx,nz)-g>0.75&&!(BK.pk&&bkPkGround(nx,nz)!==null)) return 'agua'; if(W.poolAt(nx,nz)) return 'piscina';
  const c=Math.cos(B.vd), s=Math.sin(B.vd), bb=bldAt(nx+c*0.5,nz+s*0.5,0.3); if(bb&&bb.top>B.y+0.5&&bb.base<B.y+1.6) return 'muro';
  if(B.y<bkG(nx,nz)+3){ const tr=treeGrid.get(Math.floor(nx/20)+','+Math.floor(nz/20)); if(tr) for(const t of tr) if(Math.hypot(nx-t.x,nz-t.z)<t.tr+0.35&&B.y<t.cy) return 'árbol'; }
  if(!B.air&&bkG(nx,nz)-B.y>0.35+Math.abs(hv)*dt*1.2) return 'muro'; return null; }
function bkAutoIn(B){ const r=BK.run, c=r?r.c:(BK.autoC||null); if(!c) return [0,1]; const p=c.pts; let bi=0, bd=1e9; for(let i=0;i<p.length;i+=2){ const d=Math.hypot(p[i][0]-B.x,p[i][1]-B.z); if(d<bd){ bd=d; bi=i; } }
  const look=Math.round(clamp(Math.abs(B.v)*0.9,4,9)/((c.len/p.length)||2)); const ix=k=>c.closed?(bi+k)%p.length:Math.min(p.length-1,bi+k), t=p[ix(look)]; const want=Math.atan2(t[1]-B.z,t[0]-B.x); let d=want-B.yaw; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI;
  // slow down before the bends: the speed that the turn ahead allows
  const sp=(c.len/p.length)||2, k6=Math.max(1,Math.round(6/sp)); let vt=99; for(let k=0;k<Math.round(18/sp);k+=k6){ const a=bkTan(p,ix(k),c.closed), b=bkTan(p,ix(k+k6),c.closed), an=Math.acos(clamp(a[0]*b[0]+a[1]*b[1],-1,1)); if(an>0.02) vt=Math.min(vt,Math.sqrt((c.kind==='pump'?11:6.5)*k6*sp/an)); }
  return [clamp(d*2.2,-1,1),B.v>vt+0.6?-0.6:B.v>vt?0:1]; }
function bkStep(dt){ const B=BK.b; if(!B){ setMode('walk'); return; } const held=kartHeld(); B.press=held&&!BK.prevHeld; BK.prevHeld=held; B.held=held; inp.jumpQ=false;
  let st=inp.mx, th=inp.my; if(BK.auto){ const a=bkAutoIn(B); st=a[0]; th=a[1]; } B.inSt=st; B.inTh=th;
  const n=dt>0.02?2:1; for(let i=0;i<n;i++){ bkPhys(B,dt/n,st,th); B.press=false; } bkAfter(B,dt); }
function bkPhys(B,dt,st,th){ const T=BK_T[B.t], g=BK_G;
  if(B.crash>0){ B.crash-=dt; B.v=0; B.pose=9; if(B.crash<=0){ B.crash=0; B.pose=0; B.lean=0; B.y=bkG(B.x,B.z); } return; }
  const sprint=P.sprintLock||inp.keys.ShiftLeft||inp.keys.ShiftRight||(BK.auto&&true);
  if(!B.air){ const c=Math.cos(B.yaw), s=Math.sin(B.yaw), sl=(bkG(B.x+c*0.45,B.z+s*0.45)-bkG(B.x-c*0.45,B.z-s*0.45))/0.9, a0=Math.atan(sl), sin=Math.sin(a0), cos=Math.cos(a0), S0=bkSurf(B.x,B.z,T);
    let a=0; B.ped=0;
    if(th>0.05){ const vc=T.vmax*S0.f*(sprint?1.22:1)*Math.min(1,th*1.15); if(B.v<vc){ a+=T.acc*(sprint?1.15:1)*(1-Math.max(0,B.v)/vc)+0.5; B.ped=1; } if(S0.pump&&sin<-0.06) a+=2.6*(-sin)*T.pump*th; }
    else if(th<-0.05){ if(B.v>0.2) a-=7.5*(-th); else a-=(1.5*(-th)+B.v)*2; }
    a-=g*sin*0.92; if(Math.abs(B.v)>0.02) a-=Math.sign(B.v)*(S0.roll+0.004*B.v*B.v);
    if(B.drift){ a-=2.2; }
    B.v+=a*dt; if(Math.abs(B.v)<0.05&&Math.abs(th)<0.05&&Math.abs(sin)<0.05) B.v=0; B.v=clamp(B.v,-2,22);
    const vv=Math.abs(B.v), dm=0.62-0.4*Math.min(1,vv/12); let w=B.v*Math.tan(st*dm)/T.wb; const wl=(S0.pump&&bkBerm(B.x,B.z)?13:7.5)/Math.max(1.5,vv); w=clamp(w,-wl,wl);
    // rear-brake drift: keep Saltar held while turning after a hop
    if(!B.drift&&B.held&&Math.abs(st)>0.35&&B.v>4.5&&B.hopT>0){ B.drift=st>0?1:-1; B.dT=0; }
    if(B.drift){ B.dT+=dt; w=B.drift*(1.15+0.7*Math.abs(st))+st*0.4; if(!B.held||B.v<3){ if(B.dT>0.6){ B.v+=1.3; bkAddPts(Math.round(B.dT*2)*25,'Derrape · '+fmt(B.dT,1)+' s'); } B.drift=0; } }
    B.hopT=Math.max(0,(B.hopT||0)-dt); B.steer=st*dm*(B.drift?-0.6:1); B.yaw+=w*dt; B.vd=B.drift?lerpAng(B.vd,B.yaw,1-Math.exp(-dt*2.4)):B.yaw; B.w=w;
    if(B.press){ B.air=true; B.vy=T.hop*(1+0.08*Math.min(1,B.v/8)); B.vh=B.v*cos; B.vd=B.yaw; B.airT=0; B.done=[]; B.hop=1; blip('jump'); if(B.drift) B.drift=0; return; }
    const hv=B.v*cos, nx=B.x+Math.cos(B.vd)*hv*dt, nz=B.z+Math.sin(B.vd)*hv*dt, hit=bkBlocked(B,nx,nz,dt,hv);
    if(hit){ B.vyG=0; if(Math.abs(B.v)>7&&!T.kid) bkCrash(B,hit==='agua'?'¡Al agua no!':'¡Choque contra '+(hit==='árbol'?'un árbol':'un muro')+'!'); else { B.v*=-0.25; if(hit==='agua') tip('El agua es demasiado honda para la bici',1800); } return; }
    const gy=bkG(nx,nz), vyP=B.vyG||0, vyg=(gy-B.y)/dt;
    if(vyP>1.4&&vyP-vyg>g*dt*1.25){ B.air=true; B.vy=vyP; B.vh=hv; B.airT=0; B.done=[]; B.hop=0; B.x=nx; B.z=nz; B.y+=vyP*dt; B.vyG=0; if(B.drift){ B.drift=0; } bkHPLaunch(B,Math.max(a0,Math.atan2(vyP,Math.max(0.1,Math.abs(hv))))); blip('jump'); }
    else { B.x=nx; B.z=nz; B.y=gy; B.vyG=clamp(vyg,-30,30); }
    B.pitch+=(a0-B.pitch)*(1-Math.exp(-dt*14)); const lt=clamp(Math.atan(B.v*w/g),-0.7,0.7)+(B.drift?B.drift*0.25:0); B.lean+=(lt-B.lean)*(1-Math.exp(-dt*7));
    if(B.v<-0.3&&a0>0.25&&!B.drift){ B.yaw+=Math.PI; B.vd=B.yaw; B.v=-B.v*0.9; B.pitch=-B.pitch; } }
  else { B.airT+=dt; B.vy-=g*dt; let nx=B.x+Math.cos(B.vd)*B.vh*dt, nz=B.z+Math.sin(B.vd)*B.vh*dt;
    if(B.hp){ const q=bkPkUV(nx,nz); if(Math.abs(q[1]-12)>5.25){ const v=12+Math.sign(q[1]-12)*5.25, w=bkPkW(q[0],v); nx=w[0]; nz=w[1]; } B.yaw+=B.hp.rate*dt; }
    else if(!B.trk||B.trk.k!=='spin') B.yaw+=st*0.9*dt;
    if(bkBlocked(B,nx,nz,dt,B.vh)) B.vh*=-0.2; else { B.x=nx; B.z=nz; } B.y+=B.vy*dt;
    if(B.press) bkTrick(B,st,th); bkTrickTick(B,dt);
    B.pitch+=(clamp(Math.atan2(B.vy,Math.max(2,B.vh))*0.4,-0.5,0.5)-B.pitch)*(1-Math.exp(-dt*3)); B.lean*=Math.exp(-dt*2);
    const gy=bkG(B.x,B.z); if(B.y<=gy&&B.vy<=0) bkLand(B,gy); } }
// leaving the top of a wall of the half pipe: straight up, turning round in the air to come back down the same wall
function bkHPLaunch(B,a0){ if(a0<0.8||!bkInHP(B.x,B.z)) return; const K=BK.pk, ax=[K.c,K.s], dx=Math.cos(B.vd)*B.vh, dz=Math.sin(B.vd)*B.vh, al=dx*ax[0]+dz*ax[1];
  B.vh=Math.abs(al); B.vd=al>=0?Math.atan2(ax[1],ax[0]):Math.atan2(-ax[1],-ax[0]); const tAir=2*B.vy/BK_G; B.hp={rate:Math.PI/Math.max(0.35,tAir)*(B.inSt<0?-1:1)}; }
function bkTrick(B,st,th){ if(B.trk) return; const T=BK_T[B.t]; let k=Math.abs(st)>0.5?'spin':th>0.5?'sup':th<-0.5?'flip':B.t==='bmx'?'whip':'nh'; if(T.kid&&k!=='spin') k='nh'; if(B.hp&&k==='spin') k='nh';
  B.trk={k,p:0,dir:st<0?-1:1,d:BK_TR[k].d/T.tk}; }
function bkTrickTick(B,dt){ const tk=B.trk; if(!tk) return; tk.p+=dt/tk.d; const e=Math.min(1,tk.p);
  if(tk.k==='spin') B.spin=tk.dir*2*Math.PI*e; else if(tk.k==='flip') B.flip=2*Math.PI*e; else if(tk.k==='whip') B.whip=tk.dir*2*Math.PI*e;
  B.pose=tk.k==='sup'?3:tk.k==='nh'?4:tk.k==='whip'?5:2; if(tk.p>=1){ B.done.push(tk.k); B.spin=B.flip=B.whip=0; B.trk=null; B.pose=2; blip('hit'); } }
function bkLand(B,gy){ const T=BK_T[B.t], c=Math.cos(B.yaw), s=Math.sin(B.yaw), a0=Math.atan((bkG(B.x+c*0.45,B.z+s*0.45)-bkG(B.x-c*0.45,B.z-s*0.45))/0.9);
  const al=B.vh*Math.cos(B.vd-B.yaw), v=al*Math.cos(a0)+B.vy*Math.sin(a0), imp=-B.vy*Math.cos(a0)+al*Math.sin(a0), tk=B.trk; B.air=false; B.y=gy; B.vd=B.yaw; B.hp=null; B.pitch=a0; B.vyG=0;
  if(tk&&tk.p<0.82){ B.trk=null; B.spin=B.flip=B.whip=0; if(!T.kid){ bkCrash(B,'¡Caída! '+BK_TR[tk.k].n+' sin terminar'); return; } bkPop('¡Casi!','Termina el truco antes de tocar el suelo'); }
  else if(tk){ B.done.push(tk.k); B.trk=null; B.spin=B.flip=B.whip=0; }
  if(imp>10.5&&!T.kid){ bkCrash(B,'¡Aterrizaje demasiado fuerte!'); return; }
  B.v=Math.max(v,al*0.3,0); B.pose=0; B.hopT=B.hop?0.35:0; if(B.hop&&B.held) B.hopT=0.6;
  const n=B.done.length; let pts=0; const nm=[]; for(const k of B.done){ pts+=BK_TR[k].p; nm.push(BK_TR[k].n); }
  if(B.airT>0.55){ pts+=Math.round((B.airT-0.4)*10)*10; if(!n) nm.push('Salto de '+fmt(B.airT,1)+' s'); }
  if(pts>0){ pts*=Math.max(1,n); bkAddPts(pts,nm.join(' + ')+(n>1?' · combo ×'+n:'')); blip(n?'gold':'hit'); } B.done=[]; B.airT=0; }
function bkCrash(B,why){ B.vyG=0; B.crash=1.5; B.v=0; B.vy=0; B.air=false; B.y=bkG(B.x,B.z); B.trk=null; B.done=[]; B.spin=B.flip=B.whip=0; B.drift=0; B.hp=null; B.pose=9; B.lean=B.lean>=0?1:-1; blip('jump'); bkPop(why,'Te levantas en un momento'); }
function bkAddPts(p,txt){ if(!(p>0)) return; BK.pts+=p; if(BK.pts>BK.best){ BK.best=BK.pts; store.set('vg_bk_best',String(BK.best)); } bkPop(txt,'+'+fmt(p)+' puntos');
  while(BK.pts>=(BK.ptsK+1)*1000){ BK.ptsK++; prgEvt('bkpts',{pts:BK.pts}); } }
function bkPop(b,s){ const el=$('bkTrick'); if(!el) return; el.innerHTML='<b>'+esc(b)+'</b>'+(s?'<span>'+esc(s)+'</span>':''); el.classList.add('show'); BK.popT=1.7; }
function bkAfter(B,dt){ const T=BK_T[B.t]; P.x=B.x; P.y=B.y; P.z=B.z; P.yaw=B.yaw; P.vx=P.vz=P.vy=0;
  if(performance.now()-camS.lastLook>900) camS.yaw=lerpAng(camS.yaw,B.vd,1-Math.exp(-dt*2.4));
  if(B.ped&&!B.air) B.cr-=dt*(Math.max(0,B.v)/(T.r*B.sc)*0.5+1.2); B.wa+=B.v*dt/(T.r*B.sc);
  if(!B.air&&!B.crash) B.pose=B.drift?2:(B.ped&&(B.t==='bmx'||P.sprintLock||inp.keys.ShiftLeft||inp.keys.ShiftRight))?1:0; else if(B.air&&!B.trk&&!B.crash) B.pose=2;
  if(BK.popT>0){ BK.popT-=dt; if(BK.popT<=0) $('bkTrick').classList.remove('show'); }
  bkRunTick(dt); BK.lpx=B.x; BK.lpz=B.z; BK.hudT-=dt; if(BK.hudT<=0){ BK.hudT=0.2; bkHud(); } }
// every frame: the parked bike stays put; if something else took you off the bike (a hole, a kart, the menu), it is parked where you were
function bkRecolor(){ if(!BK.racks) return; for(const R of BK.racks) bkRackBuild(R); const m=BK.mine; if(m&&m.M&&m.M.col!==bkCol(m.t)){ const M=bkMesh(m.t,bkCol(m.t)); M.g.scale.setScalar(m.sc); scene.remove(m.M.g); m.M=M; if(BK.b) BK.b.M=M; else bkParked(); } }
function bkTick(dt){ if(BK.b&&S.mode!=='bike'&&S.mode!=='photo') bkUnmount({stay:true}); }
function bkRider(R){ const B=BK.b; if(!B) return; bkRender(B.M,R,B,B.sc); P.anim='idle'; P.animK=0; }
function bkStatus(){ const B=BK.b, T=B?BK_T[B.t]:BK_T.mtb, v=B?Math.abs(B.v):0; return ['En bici · '+T.n,fmt(v*3.6)+' km/h · '+(B&&B.air?'¡en el aire!':B&&B.drift?'¡derrapando!':'Saltar: salto · en el aire, Saltar + joystick: trucos')+(BK.pts?' · '+fmt(BK.pts)+' puntos':'')]; }
function bkHud(force){ const el=$('bkHud'); if(!el) return; const B=BK.b, on=!!B&&S.mode==='bike'; document.body.classList.toggle('bkon',on); if(!on){ if(!el.hidden) el.hidden=true; return; } el.hidden=false; const T=BK_T[B.t], r=BK.run;
  $('bkT1').textContent=T.n+' · '+fmt(Math.abs(B.v)*3.6)+' km/h';
  if(r){ const c=r.c, n=c.gates.length; $('bkT2').textContent=r.st==='count'?'Preparados…':kartFmt(Math.round(r.t*1000))+(r.rec?' · récord '+kartFmt(r.rec.ms):''); $('bkT3').textContent=c.n+' · '+(c.closed?'vuelta '+Math.min(c.laps,r.lap+1)+' de '+c.laps:'puerta '+Math.min(n,r.next+1)+' de '+n)+(r.rid?' · '+(bkRaceRank().findIndex(e=>e.me)+1)+'º':''); $('bkT4').textContent=r.dT>0?r.dTxt:''; $('bkT4').style.color=r.dGood?'#2a7d46':'#b8322a'; }
  else { $('bkT2').textContent=fmt(BK.pts)+' puntos'+(BK.best?' · récord '+fmt(BK.best):''); $('bkT3').textContent=B.air?'En el aire: Saltar + joystick para un truco':B.crash?'¡Al suelo!':'Rampas, lomas y el bike park: salta y haz trucos'; $('bkT4').textContent=''; } }

/* ---- against the clock: trails (open) and the pump track (three laps); with the room, a race ---- */
function bkCourses(){ const L=bkTrails().slice(); if(BK.pk) L.push(BK.pk.pump); return L; }
function bkRecKey(id){ return 'vg_bk_'+WP.key+'_'+id; }
function bkRec(id){ try{ return JSON.parse(store.get(bkRecKey(id))||'null'); }catch(e){ return null; } }
// medal times from a quick ride along the course with the mountain bike at full pedal (one dimension: slope, rolling, air and the turns)
function bkMedals(c){ if(c.M) return c.M; const T=BK_T.mtb, p=c.pts, n=p.length; let v=2, t=0; const laps=c.closed?c.laps:1;
  for(let L=0;L<laps;L++) for(let i=1;i<(c.closed?n+1:n);i++){ const a=p[(i-1)%n], b=p[i%n], ds=Math.hypot(b[0]-a[0],b[1]-a[1]); if(ds<1e-3) continue; const dh=bkG(b[0],b[1])-bkG(a[0],a[1]), sin=dh/Math.hypot(ds,dh);
    const t0=bkTan(p,(i-2+n)%n,c.closed), t1=bkTan(p,(i+2)%n,c.closed), cu=Math.acos(clamp(t0[0]*t1[0]+t0[1]*t1[1],-1,1))/(4*ds/1), vt=cu>0.002?Math.sqrt((c.kind==='pump'?11:6.5)/cu):99;
    const vc=T.vmax*1.22; let ac=(v<vc?T.acc*1.15*(1-v/vc)+0.5:0)-BK_G*sin*0.92-0.3-0.004*v*v; if(c.kind==='pump'&&sin<-0.06) ac+=2.6*(-sin); const dt=ds/Math.max(0.8,v); v=clamp(v+ac*dt,0.8,Math.min(22,vt)); t+=dt; }
  const r=x=>Math.round(t*x*10)*100; return c.M=[r(1.12),r(1.35),r(1.7)]; }
function bkMedal(ms,M){ return ms<=M[0]?'g':ms<=M[1]?'s':ms<=M[2]?'b':''; }
function bkRunPrepare(c,race){ if(!bkCanStart()){ toast('Bicis','Termina antes el golpe o sal de donde estás'); return; } $('bkSheet').hidden=true; closeModal(); hideMap();
  fadeTo(()=>{ bkLeaveAll(); const G=c.gates[0], off=race?bkSlot():0, x=G.x-G.tx*7+G.nx*off, z=G.z-G.tz*7+G.nz*off, yaw=Math.atan2(G.tz,G.tx);
    if(!BK.b) bkSpawn(BK.t,x,z,yaw); const B=BK.b; Object.assign(B,{x,z,y:bkG(x,z),yaw,vd:yaw,v:0,vyG:0,air:false,crash:0,trk:null,spin:0,flip:0,whip:0,drift:0,lean:0,pose:0});
    camS.yaw=yaw; bkRunBegin(c,race,false); }); }
function bkSlot(){ let h=0; for(const ch of String(MP.id||'')) h=(h*31+ch.charCodeAt(0))>>>0; return ((h%5)-2)*1.2; }
function bkRunBegin(c,race,started){ bkRunClear(); const B=BK.b; const r=BK.run={c,st:started?'run':'count',cd:3,t:0,next:started?1:0,lap:0,path:[],sT:0,splits:[],rec:bkRec(c.id),M:bkMedals(c),rid:race?race.rid:'',go:race?race.go:0,host:race?race.host:'',fin:0,px:P.x,pz:P.z,sx:B?B.x:P.x,sz:B?B.z:P.z,sy:B?B.yaw:0,started,dT:0,miss:0};
  if(race) r.cd=(race.go-Date.now())/1000;
  const g=r.grp=new THREE.Group(); const beam=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,7,12,1,true),new THREE.MeshBasicMaterial({color:0xf2c230,transparent:true,opacity:0.35,depthWrite:false,side:THREE.DoubleSide})); g.add(beam); r.beam=beam;
  if(c.kind==='pump'){ const L=x=>new THREE.MeshLambertMaterial({color:Cc(x)}); for(const G of c.gates) for(const s of [-1,1]){ const x=G.x+G.nx*s*G.w/2, z=G.z+G.nz*s*G.w/2; const p=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,1.2,6),L(G===c.gates[0]?'#16231b':'#ff7a1a')); p.position.set(x,bkG(x,z)+0.6,z); g.add(p); } }
  scene.add(g); if(r.rec&&r.rec.path&&r.rec.path.length>8){ r.ghost=cirGhostMesh(); scene.add(r.ghost); }
  bkGateHi(); bkHud(true); if(started){ blip('gold'); toast(c.kind==='pump'?'¡Vueltas en marcha!':'¡Bajada en marcha!',c.n+' · pasa las puertas hasta la meta'); } }
function bkGateHi(){ const r=BK.run; if(!r||!r.beam) return; const G=r.c.gates[r.next]; if(!G){ r.beam.visible=false; return; } r.beam.position.set(G.x,bkG(G.x,G.z)+3.5,G.z); r.beam.visible=true; }
function bkRunClear(){ const r=BK.run; if(!r) return; if(r.grp) scene.remove(r.grp); if(r.ghost) scene.remove(r.ghost); BK.run=null; const el=$('kartLights'); if(el&&!KART.on&&!CIR.on) el.hidden=true; }
function bkProg(r){ return r.c.closed?r.lap*r.c.gates.length+r.next:r.next; }
function bkRunTick(dt){ const r=BK.run, B=BK.b;
  if(!r){ if(B&&!B.crash) for(const c of (BK.tr||[])){ const G=c.gates[0]; if(cirCross(G,BK.lpx,BK.lpz,B.x,B.z)>0){ bkRunBegin(c,null,true); break; } } return; }
  if(r.dT>0) r.dT-=dt;
  if(r.st==='count'){ r.cd=r.go?(r.go-Date.now())/1000:r.cd-dt; if(B){ B.x=r.sx; B.z=r.sz; B.yaw=B.vd=r.sy; B.v=0; B.vyG=0; B.y=bkG(B.x,B.z); } if(r.cd<=0){ r.st='run'; r.t=r.go?Math.max(0,(Date.now()-r.go)/1000):0; blip('gold'); } r.px=P.x; r.pz=P.z; bkLights(); return; }
  if(r.st!=='run'){ bkLights(); return; }
  r.t=r.go?(Date.now()-r.go)/1000:r.t+dt; r.sT+=dt; while(r.sT>=0.1){ r.sT-=0.1; r.path.push(Math.round(P.x*2)/2,Math.round(P.z*2)/2); }
  const G=r.c.gates[r.next], cr=G?cirCross(G,r.px,r.pz,P.x,P.z):0; if(cr>0) bkGate(); else if(cr<0){ r.miss++; tip('Te has saltado la puerta: vuelve y pasa por la columna amarilla',2600); }
  r.px=P.x; r.pz=P.z; bkLights();
  if(r.ghost){ const R=r.rec, n=R.path.length/2, f=r.t/0.1, i=Math.min(n-1,Math.floor(f)), j=Math.min(n-1,i+1), k=f-Math.floor(f); const x=R.path[i*2]+(R.path[j*2]-R.path[i*2])*k, z=R.path[i*2+1]+(R.path[j*2+1]-R.path[i*2+1])*k; r.ghost.position.set(x,bkG(x,z),z); r.ghost.visible=f<n+20; } }
function bkLights(){ const el=$('kartLights'), r=BK.run; if(!el||KART.on||CIR.on) return; if(r&&r.st==='count'){ el.hidden=false; const n=r.cd>2.2?1:r.cd>1.1?2:3; el.querySelectorAll('i').forEach((x,i)=>{ x.className=i<n?'r':''; }); $('kartGo').textContent=''; }
  else if(r&&r.st==='run'&&r.t<1&&!r.started){ el.hidden=false; el.querySelectorAll('i').forEach(x=>x.className='g'); $('kartGo').textContent='¡Ya!'; } else if(!el.hidden) el.hidden=true; }
function bkGate(){ const r=BK.run, c=r.c, n=c.gates.length, ms=Math.round(r.t*1000); r.splits.push(ms); blip('hit');
  const R=r.rec, ix=r.splits.length-1; if(R&&R.splits&&R.splits[ix]!==undefined){ const d=(ms-R.splits[ix])/1000; r.dTxt=(d<=0?'−':'+')+fmt(Math.abs(d),1)+' s respecto a tu récord'; r.dGood=d<=0; r.dT=3; }
  if(c.closed){ if(r.next===0){ if(!r.started) r.started=true; else { r.lap++; if(r.lap>=c.laps){ bkFinish(); return; } } } r.next=(r.next+1)%n; }
  else { if(!r.started) r.started=true; if(r.next>=n-1){ bkFinish(); return; } r.next++; } bkGateHi(); }
function bkFinish(){ const r=BK.run, c=r.c, ms=Math.round(r.t*1000), md=bkMedal(ms,r.M), R=r.rec, isRec=!R||ms<R.ms; r.st='done'; r.fin=ms; if(r.beam) r.beam.visible=false; if(r.ghost) r.ghost.visible=false;
  if(isRec) store.set(bkRecKey(c.id),JSON.stringify({ms,path:r.path,splits:r.splits,d:Date.now(),who:(S.name||'').trim()||'Tú',md,t:BK.b?BK.b.t:BK.t}));
  else if(md&&'gsb'.indexOf(md)<'gsb'.indexOf(R.md||'x')){ R.md=md; store.set(bkRecKey(c.id),JSON.stringify(R)); }
  BK.res={c,ms,md,isRec,prev:R?R.ms:0,rid:r.rid,at:Date.now()}; blip('gold'); toast(md?'Medalla de '+METAL[md].n:'¡Meta!',kartFmt(ms)+(isRec?' · ¡récord!':''));
  prgEvt('bkrun',{md,rec:isRec&&!!R,trail:c.kind==='trail',n:c.n});
  if(r.rid){ const rk=bkRaceRank(), pos=rk.filter(e=>e.fin&&e.fin<ms).length+1, n=rk.length; BK.res.pos=pos; prgEvt('bkrace',{pos,n}); }
  bkResults(); }
function bkRaceRank(){ const r=BK.run||{}, rid=r.rid||(BK.res&&BK.res.rid); const out=[{n:'Tú',me:true,prog:r.c?bkProg(r):1e6,fin:r.fin||(BK.res&&BK.res.rid===rid?BK.res.ms:0)}];
  if(rid&&MP.code) for(const p of MP.peers.values()){ const s=p.cur; if(!s||s.br!==rid) continue; out.push({n:p.n||'Amigo',prog:s.bp?s.bp[0]:0,fin:s.bp?s.bp[1]:0}); }
  return out.sort((a,b)=>(a.fin&&b.fin)?a.fin-b.fin:a.fin?-1:b.fin?1:b.prog-a.prog); }
function bkResults(){ const r=BK.res; if(!r) return; const B=$('bkBody'), M=r.c.M||bkMedals(r.c); let h='<h2>'+esc(r.c.n)+'</h2><p style="font-family:var(--f-display);font-size:28px;font-weight:800;margin:0 0 4px">'+kartFmt(r.ms)+' '+(r.md?cupSVG(r.md,true).replace('<svg','<svg style="vertical-align:-6px"'):'')+'</p>';
  h+='<p>'+(r.md?'Medalla de <b>'+METAL[r.md].n+'</b>. ':'Sin medalla esta vez. ')+(r.isRec?'¡Nuevo récord!'+(r.prev?' Has mejorado en '+fmt((r.prev-r.ms)/1000,1)+' s.':''):'A '+fmt((r.ms-r.prev)/1000,1)+' s de tu récord ('+kartFmt(r.prev)+').')+'</p><p class="note">Oro '+kartFmt(M[0])+' · plata '+kartFmt(M[1])+' · bronce '+kartFmt(M[2])+'</p>';
  if(r.rid){ const rk=bkRaceRank(); h+='<h3>Carrera con la sala</h3><div class="tablewrap"><table class="card"><thead><tr><th>Puesto</th><th>Quién</th><th>Tiempo</th></tr></thead><tbody>'+rk.map((e,i)=>'<tr'+(e.me?' style="font-weight:800"':'')+'><td>'+(e.fin?(i+1)+'º':'—')+'</td><td>'+esc(e.n)+'</td><td class="num">'+(e.fin?kartFmt(e.fin):'en carrera')+'</td></tr>').join('')+'</tbody></table></div><p class="note">La tabla se actualiza sola mientras llegan los demás.</p>'; }
  h+='<div class="row"><button class="btn small primary" id="bkAgain">Repetir</button><button class="btn small" id="bkOk">Seguir en bici</button><button class="btn small" id="bkMore">Bicis</button></div>';
  B.innerHTML=h; $('bkSheet').hidden=false; $('bkAgain').onclick=()=>bkRunPrepare(r.c,null); $('bkOk').onclick=()=>{ $('bkSheet').hidden=true; bkRunClear(); }; $('bkMore').onclick=()=>{ bkRunClear(); bkSheet(); };
  if(r.rid){ clearTimeout(BK.resT); BK.resT=setTimeout(()=>{ if(!$('bkSheet').hidden&&BK.res===r&&$('bkAgain')) bkResults(); },1500); } }

/* ---- races with the room: the organiser sends the course and the start time; each one rides their own bike, the others are seen live ---- */
function bkRaceInvite(c){ if(!MP.code) return; const rid=String(MP.id||'x').slice(0,6)+Date.now().toString(36), go=Date.now()+10000; mpSend({t:'bkgo',rid,c:c.id,go}); mpFeed('Has retado a la sala a una carrera de bici: '+esc(c.n),'sys',true); bkRunPrepare(c,{rid,go,host:MP.id}); }
function bkNetIn(p,o){ if(o.t!=='bkgo'||typeof o.rid!=='string'||!Number.isFinite(o.go)) return; const c=bkCourses().find(k=>k.id===o.c); if(!c) return; const go=o.go+(p.off||0); if(go<Date.now()+1500) return;
  mpFeed('<b>'+esc(p.n)+'</b> reta a la sala a una carrera de bici: '+esc(c.n),'ev',true);
  mpPrompt(esc(p.n)+' reta a la sala a una carrera de bici en <b>'+esc(c.n)+'</b>. ¿Corres?','Correr',()=>{ if(Date.now()>go-1200){ toast('Bicis','Ya ha salido'); return; } bkRunPrepare(c,{rid:o.rid.slice(0,48),go,host:p.id}); },Math.max(3000,go-Date.now()-1500)); }
function bkNetState(o){ const B=BK.b; if(S.mode==='bike'&&B){ const r2=x=>Math.round(x*100)/100; o.bk=[BK_TI.indexOf(B.t),r2(B.lean),r2(B.pitch),r2(B.spin),r2(B.flip),r2(B.cr),B.pose|0,r2(B.whip),r2(B.steer)]; if(PRG.eq.bici) o.bkc=String(PRG.eq.bici).slice(0,16); }
  const r=BK.run; if(r&&r.rid) { o.br=r.rid; o.bp=[bkProg(r),r.fin|0]; } else if(BK.res&&BK.res.rid&&Date.now()-BK.res.at<180000){ o.br=BK.res.rid; o.bp=[1e6,BK.res.ms]; } }
// a friend on a bike: their own bike and their avatar on it, posed like ours
function bkPeer(p,s,R,inWorld,showRig,dt){ const on=inWorld&&s.m==='bike'&&Array.isArray(s.bk)&&s.bk.length>=9;
  if(!on){ if(p.bkm) p.bkm.g.visible=false; return; } const ti=BK_TI[s.bk[0]|0]||'mtb', it=s.bkc?prgItem(s.bkc):null, col=it&&it.slot==='bici'?it.c:BK_T[ti].col, sc=R?R.root.scale.y:1, key=ti+'|'+col+'|'+sc.toFixed(2);
  if(!p.bkm||p.bkmK!==key){ if(p.bkm) scene.remove(p.bkm.g); p.bkm=bkMesh(ti,col); p.bkm.g.scale.setScalar(sc); p.bkmK=key; } p.bkWa=(p.bkWa||0)+((p.out&&p.out.spd)||0)*(dt||1/30)/(BK_T[ti].r*sc);
  const V={t:ti,x:s.x,y:s.y,z:s.z,yaw:s.yaw,lean:s.bk[1],pitch:s.bk[2],spin:s.bk[3],flip:s.bk[4],cr:s.bk[5],pose:s.bk[6]|0,whip:s.bk[7],steer:s.bk[8],wa:p.bkWa}; bkRender(p.bkm,showRig?R:null,V,sc); }

/* ---- the «Bicis» sheet: pick a bike, go to a rack or the park, trails and the pump track against the clock, races with the room; how to play and how to read it ---- */
function bkSheet(rack){ closeModal(); const B=$('bkBody'), fd=t=>new Date(t).toLocaleDateString('es-ES',{day:'numeric',month:'short'}); const CS=bkCourses(), friends=!!(MP.code&&MP.peers&&MP.peers.size);
  let h='<h2>'+(rack?'Aparcabicis · '+esc(rack.n):'Bicis')+'</h2><p>'+(rack?'Elige bici y sal pedaleando.':'Elige bici y dónde empezar. También las encuentras en los <b>aparcabicis</b> (cartel azul): acércate y pulsa <b>Coger una bici</b>.')+'</p>';
  h+='<div class="shop">'+BK_TI.map(k=>{ const T=BK_T[k]; return '<button class="it'+(BK.t===k?' on':'')+'" data-bkt="'+k+'"><span class="sw" style="background:'+bkCol(k)+'"></span><span>'+T.n+'<small>'+T.d+'</small></span></button>'; }).join('')+'</div>';
  if(!rack){ h+='<h3>Dónde</h3><div class="tablewrap"><table class="card"><tbody>'+BK.racks.map((R,i)=>'<tr><td>'+esc(R.n)+(R.n==='Bike park'?' <small class="note">pump track, saltos y medio tubo</small>':'')+'</td><td class="num">'+fmt(Math.hypot(R.x-P.x,R.z-P.z))+' m</td><td><button class="btn small" data-bkr="'+i+'">Ir en bici</button></td></tr>').join('')+'</tbody></table></div>';
    if(!BK.racks.length) h+='<p class="note">En este mundo no hay aparcabicis.</p>';
    h+='<h3>Contra el reloj</h3><p class="note">Cuando ya tienes un récord, una columna dorada semitransparente («Tu récord») repite tu mejor bajada. Las sendas también empiezan solas al cruzar en bici el arco verde de salida.</p>';
    for(const c of CS){ const R=bkRec(c.id), M=bkMedals(c); h+='<div class="cirk"><b>'+esc(c.n)+'</b><p>'+c.txt+'</p><p class="note">Medallas: oro en '+kartFmt(M[0])+' o menos · plata '+kartFmt(M[1])+' · bronce '+kartFmt(M[2])+'</p><p class="note">'+(R?'Récord: <b>'+kartFmt(R.ms)+'</b>'+(R.md?' · '+cupSVG(R.md,true).replace('<svg','<svg style="vertical-align:-8px"'):'')+' · '+esc(R.who)+' · '+fd(R.d):'Aún sin récord')+'</p><button class="btn small primary" data-bkc="'+c.id+'">Empezar</button>'+(friends?' <button class="btn small" data-bkrace="'+c.id+'">Retar a la sala</button>':'')+'</div>'; }
    if(!CS.length) h+='<p class="note">Buscando sendas…</p>';
    if(BK.run) h+='<div class="row"><button class="btn small" id="bkQuit">Dejar la carrera</button></div>';
    h+='<h3>Cómo se juega</h3><ul><li><b>Pedalear:</b> joystick adelante (W o flecha arriba); atrás frena y, parado, va marcha atrás. <b>Esprint</b> pedalea a tope de pie.</li><li><b>Girar:</b> joystick a los lados; la bici se inclina más cuanto más rápido vas.</li><li><b>Saltar</b> (espacio, botón Saltar o A del mando): un salto (bunny hop). Si al caer lo mantienes pulsado girando, <b>derrapas</b> con el freno trasero: al soltar ganas un impulso y puntos.</li><li><b>Trucos:</b> en el aire pulsa Saltar y elige con el joystick: a un lado <b>Giro 360</b> (150), adelante <b>Superman</b> (120), atrás <b>Mortal atrás</b> (300), suelto <b>Tailwhip</b> en la BMX (200) o <b>Manos fuera</b> (80). Varios en el mismo salto multiplican (combo ×2, ×3…). Si tocas el suelo con el truco a medias, te caes (con ruedines no).</li><li><b>Saltos:</b> salen solos al pasar rápido por una loma o una rampa. Cuanto más tiempo en el aire, más puntos.</li><li><b>Bike park:</b> en el <b>pump track</b> se gana velocidad empujando (adelante) al bajar cada loma; en el <b>medio tubo</b> sube por una pared y vuelves solo por la misma.</li><li><b>Premios:</b> 10 monedas por cada 1.000 puntos sin bajarte de la bici; trofeos «Rey del bike park», «Oro en la bajada» y «Ganador en bici».</li></ul>';
    h+='<h3>Cómo se lee</h3><ul><li><b>Arriba:</b> bici y velocidad, tus puntos y tu récord; en una bajada, tiempo, puerta y diferencia con tu récord (− en verde si vas por delante).</li><li><b>Columna amarilla:</b> la siguiente puerta. <b>Arco verde:</b> salida; <b>arco de cuadros:</b> meta.</li><li><b>Mapa:</b> aparcabicis (cuadrado azul), bike park (naranja) y sendas (línea marrón, salida en verde y meta en blanco y negro).</li></ul>'; }
  h+='<div class="row">'+(BK.b&&!rack?'<button class="btn small" id="bkOff">Bajar de la bici</button>':'')+'<button class="btn small" id="bkClose">Cerrar</button></div>';
  B.innerHTML=h; $('bkSheet').hidden=false;
  B.querySelectorAll('[data-bkt]').forEach(b=>b.onclick=()=>{ const t=b.dataset.bkt; BK.t=t; store.set('vg_bk_t',t); if(rack){ $('bkSheet').hidden=true; bkTake(t,rack); } else bkSheet(); });
  B.querySelectorAll('[data-bkr]').forEach(b=>b.onclick=()=>bkGoRack(BK.racks[+b.dataset.bkr]));
  B.querySelectorAll('[data-bkc]').forEach(b=>b.onclick=()=>{ const c=CS.find(k=>k.id===b.dataset.bkc); if(c) bkRunPrepare(c,null); });
  B.querySelectorAll('[data-bkrace]').forEach(b=>b.onclick=()=>{ const c=CS.find(k=>k.id===b.dataset.bkrace); if(c) bkRaceInvite(c); });
  const q=$('bkQuit'); if(q) q.onclick=()=>{ bkRunClear(); bkSheet(); }; const off=$('bkOff'); if(off) off.onclick=()=>{ $('bkSheet').hidden=true; bkUnmount(); }; $('bkClose').onclick=()=>{ $('bkSheet').hidden=true; }; }
$('bkOpt').onclick=()=>bkSheet();
function bkGoRack(R){ if(!R) return; if(!bkCanStart()){ toast('Bicis','Termina antes el golpe o sal de donde estás'); return; } $('bkSheet').hidden=true; closeModal(); hideMap(); fadeTo(()=>{ bkLeaveAll(); if(BK.run) bkRunClear(); bkTake(BK.t,R); }); }

/* ---- map, legend, guide and glossary ---- */
function bkDrawMap(g,m2c,s,big){ g.save(); const K=BK.pk;
  if(K){ g.fillStyle='rgba(232,116,44,.32)'; g.strokeStyle='#e8742c'; g.lineWidth=1.6*s; g.beginPath(); [[-45,-24],[45,-24],[45,26],[-45,26]].forEach((q,i)=>{ const w=bkPkW(q[0],q[1]), [x,y]=m2c(w[0],w[1]); i?g.lineTo(x,y):g.moveTo(x,y); }); g.closePath(); g.fill(); g.stroke();
    if(big){ const w=bkPkW(0,0), [x,y]=m2c(w[0],w[1]); g.fillStyle='#16231b'; g.font='800 '+(7*s)+'px Figtree, system-ui, sans-serif'; g.textAlign='center'; g.fillText('Bike park',x,y); } }
  for(const c of (BK.tr||[])){ const line=()=>{ g.beginPath(); c.pts.forEach((p,i)=>{ if(i%3&&i!==c.pts.length-1) return; const [x,y]=m2c(p[0],p[1]); i?g.lineTo(x,y):g.moveTo(x,y); }); g.stroke(); };
    g.lineCap='round'; g.strokeStyle='rgba(255,255,255,.85)'; g.lineWidth=(big?3.6:2.6)*s; line(); g.strokeStyle='#a3561b'; g.lineWidth=(big?2:1.5)*s; g.setLineDash([4*s,2.5*s]); line(); g.setLineDash([]);
    const a=m2c(c.pts[0][0],c.pts[0][1]), e=m2c(c.pts[c.pts.length-1][0],c.pts[c.pts.length-1][1]), r=(big?3.4:2.4)*s; g.fillStyle='#2a7d46'; g.strokeStyle='#fff'; g.lineWidth=1*s; g.beginPath(); g.arc(a[0],a[1],r,0,7); g.fill(); g.stroke();
    g.fillStyle='#16231b'; g.fillRect(e[0]-r,e[1]-r,r*2,r*2); g.fillStyle='#fff'; g.fillRect(e[0]-r,e[1]-r,r,r); g.fillRect(e[0],e[1],r,r);
    if(big){ g.fillStyle='#16231b'; g.font='700 '+(6*s)+'px Figtree, system-ui, sans-serif'; g.textAlign='left'; g.fillText(c.n,a[0]+r+2*s,a[1]); } }
  const r=(big?3.2:2.2)*s; for(const R of BK.racks){ const [x,y]=m2c(R.x,R.z); g.fillStyle='#2f6bd6'; g.strokeStyle='#fff'; g.lineWidth=1*s; g.fillRect(x-r,y-r,r*2,r*2); g.strokeRect(x-r,y-r,r*2,r*2); }
  const m=BK.mine; if(m&&!BK.b){ const [x,y]=m2c(m.x,m.z); g.fillStyle='#ffffff'; g.strokeStyle='#2f6bd6'; g.lineWidth=1.6*s; g.beginPath(); g.arc(x,y,r*0.9,0,7); g.fill(); g.stroke(); }
  const ru=BK.run; if(ru&&ru.st!=='done'){ const G=ru.c.gates[ru.next]; if(G){ const [x,y]=m2c(G.x,G.z); g.fillStyle='#f2c230'; g.strokeStyle='#16231b'; g.lineWidth=1*s; g.beginPath(); g.arc(x,y,r*1.1,0,7); g.fill(); g.stroke(); } }
  g.restore(); }
function bkLegend(){ let h=''; if(BK.racks.length) h+='<div><i style="background:#2f6bd6;border:2px solid #fff;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></i>Aparcabicis: BMX, de montaña y de niño con ruedines</div>';
  if(BK.mine&&!BK.b) h+='<div><i class="dot" style="background:#fff;border:2px solid #2f6bd6"></i>Tu bici aparcada</div>'; if(BK.pk) h+='<div><i style="background:rgba(232,116,44,.35);border:2px solid #e8742c"></i>Bike park: pump track, saltos y medio tubo</div>';
  if(BK.tr&&BK.tr.length) h+='<div><i style="background:#8a4f1d;height:3px;border:0"></i>Sendas de bajada (salida en verde, meta en cuadros blancos y negros)</div>'; if(BK.run) h+='<div><i class="dot" style="background:#f2c230;border:1px solid #16231b"></i>Siguiente puerta de la bajada</div>'; return h; }
function bkGuideHTML(){ if(!WP.bikes) return ''; return '<li><b>Bicis</b> (botón <b>Bicis</b> del menú o del inicio, o en un <b>aparcabicis</b>, el cartel azul'+(BK.racks.length?': '+BK.racks.map(r=>r.n).join(', '):'')+'). Tres bicis: <b>BMX</b> (saltos y trucos), <b>de montaña</b> (la más rápida en sendas y hierba) y <b>de niño con ruedines</b> (no se cae nunca). Adelante pedaleas, Esprint va a tope y la bici se inclina en las curvas. <b>Saltar</b> da un salto; mantenlo girando al caer para <b>derrapar</b> con el freno trasero. Las lomas y rampas te lanzan solas. En el aire, <b>Saltar + joystick</b> hace un truco: a un lado Giro 360, adelante Superman, atrás Mortal atrás, suelto Tailwhip (BMX) o Manos fuera; varios en un salto hacen combo. Con el truco a medias al tocar el suelo te caes. El <b>bike park</b> tiene pump track (empuja adelante al bajar cada loma para ganar velocidad), dos mesas de saltos y un medio tubo. Las <b>sendas de bajada</b> se cronometran solas al cruzar el arco verde, con medallas y tu récord como columna dorada; con la sala, <b>Retar a la sala</b> organiza una carrera. Cada 1.000 puntos de trucos sin bajarte dan 10 monedas.</li>'; }
function bkGlossHTML(){ if(!WP.bikes) return ''; return '<dt>BMX</dt><dd>Bici pequeña de ruedas de 20 pulgadas para saltos y trucos (bicycle motocross).</dd><dt>Bike park</dt><dd>Recinto con obstáculos de tierra y madera para saltar y hacer trucos en bici.</dd><dt>Pump track</dt><dd>Circuito cerrado de lomas y curvas peraltadas en el que se avanza «bombeando»: empujando la bici al bajar cada loma, casi sin pedalear.</dd><dt>Medio tubo</dt><dd>Rampa en forma de U (half pipe): subes por una pared, sales por arriba y vuelves a entrar por la misma.</dd><dt>Mesa</dt><dd>Salto de tierra con rampa de subida, una parte plana arriba y rampa de caída: si te quedas corto, caes en la mesa.</dd><dt>Bunny hop</dt><dd>Salto con la bici sin rampa, tirando del manillar y de los pedales (botón Saltar).</dd><dt>Derrape con freno trasero</dt><dd>La rueda de atrás se bloquea y resbala de lado en la curva; al soltar, la bici sale con un pequeño impulso.</dd><dt>Tailwhip</dt><dd>Truco de BMX: el cuadro da una vuelta entera alrededor del manillar mientras el ciclista sigue en el aire.</dd><dt>Superman</dt><dd>Truco en el que el ciclista estira las piernas hacia atrás, en horizontal, agarrado al manillar.</dd><dt>Combo</dt><dd>Varios trucos en el mismo salto: los puntos se multiplican por cuántos haces (×2, ×3…).</dd><dt>Ruedines</dt><dd>Ruedas pequeñas a los lados de la rueda trasera para que la bici de los niños no se caiga.</dd><dt>Senda de bajada</dt><dd>Camino de tierra cuesta abajo por el monte, cronometrado de la salida a la meta pasando por todas las puertas.</dd>'; }
