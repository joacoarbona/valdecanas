
/* ================= the Lune valley (S0, the Casterton world: WP.bstyle 'lune' and WP.walls) =================
   Stone houses with slate roofs (the height of each one comes from the LIDAR, b.t), farm barns, the school's stone
   blocks, and the dry stone walls and hedges of the fields (OpenStreetMap and the LIDAR, file walls.json), built near
   you in chunks of 250 m and dropped when you go away. Names lu*, state LU. */
var LU={scMesh:[],chunks:new Map(),cs:250,on:720,off:960,t:0,mats:null,n:0,segs:0,km:[0,0,0,0]};
function luStoneTex(base,seed,lines){ return canvasTex(512,512,(g,w,h)=>{ g.fillStyle='#4a4741'; g.fillRect(0,0,w,h); const R=rng(seed);
    const B=lin(base).map(v=>Math.pow(v,1/2.2)*255);
    let y=0; while(y<h){ const ch=10+R()*14; let x=-R()*30; while(x<w){ const cw=18+R()*34, v=0.78+R()*0.36, t=R()*0.12-0.06;
        g.fillStyle='rgb('+Math.round(B[0]*v*(1+t))+','+Math.round(B[1]*v)+','+Math.round(B[2]*v*(1-t))+')';
        g.beginPath(); const j=()=>R()*2.4-1.2; g.moveTo(x+1+j(),y+1+j()); g.lineTo(x+cw-1+j(),y+1+j()); g.lineTo(x+cw-1+j(),y+ch-1+j()); g.lineTo(x+1+j(),y+ch-1+j()); g.closePath(); g.fill(); x+=cw; }
      y+=ch; }
    if(lines){ g.fillStyle='rgba(30,28,24,0.35)'; for(let yy=0;yy<h;yy+=lines) g.fillRect(0,yy,w,2); }
    speckle(g,w,h,6000,seed+3,['rgba(255,255,240,0.10)','rgba(20,20,10,0.16)','rgba(90,110,60,0.10)']); },true); }
function luSlateTex(){ return canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#4a5058'; g.fillRect(0,0,w,h); const R=rng(41);
    for(let y=0;y<h;y+=12){ for(let x=-(y/12%2)*10;x<w;x+=20){ const v=0.8+R()*0.34; g.fillStyle='rgb('+Math.round(86*v)+','+Math.round(92*v)+','+Math.round(100*v)+')'; g.fillRect(x+1,y+1,18,10); g.fillStyle='rgba(15,18,22,0.45)'; g.fillRect(x,y+9,20,3); } }
    speckle(g,w,h,2500,9,['rgba(160,170,180,0.12)','rgba(10,10,10,0.25)','rgba(120,140,90,0.10)']); },true); }
function luHedgeTex(){ return canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#34502a'; g.fillRect(0,0,w,h); const R=rng(17);
    for(let i=0;i<5200;i++){ const v=0.7+R()*0.6; g.fillStyle='rgba('+Math.round(62*v)+','+Math.round(96*v)+','+Math.round(44*v)+',0.85)'; const s=2+R()*5; g.beginPath(); g.ellipse(R()*w,R()*h,s,s*0.6,R()*3,0,6.3); g.fill(); }
    speckle(g,w,h,3000,23,['rgba(20,30,10,0.35)','rgba(150,180,90,0.18)']); },true); }
// facade modules of 3 m x 6 m (two floors): stone with white sash windows, lime render, or a barn with a slit
function luFacadeTex(kind,lit){ const W_=256, H_=512; return canvasTex(W_,H_,(g,w,h)=>{ const PX=w/3, PY=h/6, yv=y=>h-y*PY;
    if(lit){ g.fillStyle='#000'; g.fillRect(0,0,w,h); }
    else if(kind==='render'){ g.fillStyle='#e8e4da'; g.fillRect(0,0,w,h); speckle(g,w,h,8000,13,['rgba(255,255,255,0.2)','rgba(110,100,85,0.09)']); }
    else { const R=rng(kind==='barn'?71:61); const B=kind==='barn'?[152,147,135]:[172,167,153];
      g.fillStyle='#6b675f'; g.fillRect(0,0,w,h); let y=0; while(y<h){ const ch=9+R()*10; let x=-R()*24; while(x<w){ const cw=16+R()*26, v=0.8+R()*0.3; g.fillStyle='rgb('+Math.round(B[0]*v)+','+Math.round(B[1]*v)+','+Math.round(B[2]*v)+')'; g.fillRect(x+1,y+1,cw-2,ch-2); x+=cw; } y+=ch; }
      speckle(g,w,h,5000,kind==='barn'?5:7,['rgba(255,255,240,0.08)','rgba(30,30,20,0.14)']); }
    if(kind==='barn'){ if(!lit){ g.fillStyle='#2b2723'; g.fillRect(1.45*PX,yv(2.3),0.1*PX,1.0*PY); g.fillRect(1.45*PX,yv(4.6),0.1*PX,0.8*PY); } return; }
    for(let f=0;f<2;f++){ const yb=f*3+0.95, yt=yb+1.45, x0=1.0*PX, x1=2.0*PX;
      if(lit){ if(f!==1||kind==='render'){ g.fillStyle='#ffd08a'; g.fillRect(x0+3,yv(yt)+3,x1-x0-6,(yt-yb)*PY-6); } continue; }
      g.fillStyle=kind==='render'?'rgba(80,70,60,0.25)':'#d9d4c6'; g.fillRect(x0-6,yv(yt)-6,x1-x0+12,(yt-yb)*PY+12);   // stone surround
      const gr=g.createLinearGradient(0,yv(yt),0,yv(yb)); gr.addColorStop(0,'#8fa1aa'); gr.addColorStop(1,'#26303a'); g.fillStyle=gr; g.fillRect(x0,yv(yt),x1-x0,(yt-yb)*PY);
      g.fillStyle='#f4f2ec'; const fr=3; g.fillRect(x0,yv(yt),x1-x0,fr); g.fillRect(x0,yv(yb)-fr,x1-x0,fr); g.fillRect(x0,yv(yt),fr,(yt-yb)*PY); g.fillRect(x1-fr,yv(yt),fr,(yt-yb)*PY);
      g.fillRect(x0,yv((yb+yt)/2)-2,x1-x0,4); g.fillRect((x0+x1)/2-1.5,yv(yt),3,(yt-yb)*PY); }
    if(!lit){ g.fillStyle='rgba(60,55,45,0.35)'; g.fillRect(0,h-12,w,12); } },true); }
function luMats(){ if(LU.mats) return LU.mats; const M=o=>new THREE.MeshLambertMaterial(o);
  const fac=(k,tint,nk)=>{ const m=M({map:luFacadeTex(k,false),color:Cc(tint),emissiveMap:luFacadeTex(k,true),emissive:new THREE.Color(1,1,1),emissiveIntensity:0}); m.userData.nightK=nk; NIGHTMATS.push(m); return m; };
  LU.mats={stone:fac('stone','#ffffff',0.8), stoneB:fac('stone','#e6dccb',0.8), render:fac('render','#ffffff',0.9), barn:fac('barn','#ffffff',0.2),
    slate:M({map:luSlateTex()}), plain:M({color:Cc('#d9d4c8')}), dark:M({color:Cc('#4d4a45')}), gable:M({map:luStoneTex('#9b978b',29,0)}),
    wall:M({map:luStoneTex('#9a968b',31,0)}), hedge:M({map:luHedgeTex()}), wood:M({color:Cc('#6f5a42')})};
  return LU.mats; }
// minimum-area rectangle of a ring: centre, axes and half sizes (for gable roofs)
function luRect(ring){ let best=null; for(let i=0;i<ring.length;i++){ const a=ring[i], b=ring[(i+1)%ring.length]; const dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz); if(L<0.5) continue;
    const ux=dx/L, uz=dz/L; let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9; for(const p of ring){ const u=p[0]*ux+p[1]*uz, v=-p[0]*uz+p[1]*ux; u0=Math.min(u0,u); u1=Math.max(u1,u); v0=Math.min(v0,v); v1=Math.max(v1,v); }
    const A=(u1-u0)*(v1-v0); if(!best||A<best.A) best={A,ux,uz,u0,u1,v0,v1}; }
  if(!best) return null; const B=best; let ux=B.ux, uz=B.uz, hu=(B.u1-B.u0)/2, hv=(B.v1-B.v0)/2, cu=(B.u0+B.u1)/2, cv=(B.v0+B.v1)/2;
  const cx=cu*ux-cv*uz, cz=cu*uz+cv*ux; if(hv>hu){ const t=hu; hu=hv; hv=t; const ox=ux; ux=-uz; uz=ox; }
  return {cx,cz,ux,uz,hu,hv,A:B.A}; }
// a gable roof over the rectangle (ridge along the long axis), with stone gable ends; returns the ridge height
function luGable(gR,gG,r,top,rise){ const vx=-r.uz, vz=r.ux, o=0.35, hu=r.hu+o*0.6, hv=r.hv+o; const P=(u,v,y)=>[r.cx+r.ux*u+vx*v,y,r.cz+r.uz*u+vz*v]; const ridge=top+rise;
  const a=P(-hu,-hv,top), b=P(hu,-hv,top), c=P(hu,0,ridge), d=P(-hu,0,ridge), e=P(-hu,hv,top), f=P(hu,hv,top);
  const sl=Math.hypot(hv,rise)/2.2, ul=2*hu/2.2;
  const n1=[-vx*rise,hv,-vz*rise], l1=Math.hypot(...n1); gR.quad(a,b,c,d,[n1[0]/l1,n1[1]/l1,n1[2]/l1],[0,0],[ul,0],[ul,sl],[0,sl]);
  const n2=[vx*rise,hv,vz*rise], l2=Math.hypot(...n2); gR.quad(f,e,d,c,[n2[0]/l2,n2[1]/l2,n2[2]/l2],[0,0],[ul,0],[ul,sl],[0,sl]);
  // gable triangles at the true wall line (the walls stop at the eave)
  for(const s of [-1,1]){ const u=s*r.hu; const A_=P(u,-r.hv,top), B_=P(u,r.hv,top), C_=P(u,0,ridge-0.02); const n=[r.ux*s,0,r.uz*s];
    gG.tri(A_,B_,C_,n,[0,0],[2*r.hv/2.5,0],[r.hv/2.5,rise/2.5]); }
  return ridge; }
function luBuildings(){
  const CELL=400, groups=new Map(); const V=['stone','stoneB','render','barn','slate','plain','dark','gable'];
  const grpK=k=>{ let g=groups.get(k); if(!g){ g={}; for(const n of V) g[n]=new GB(!['plain','dark'].includes(n)); groups.set(k,g); } return g; };
  const grp=(x,z)=>{ const k=Math.floor(x/CELL)+','+Math.floor(z/CELL); let g=groups.get(k); if(!g){ g={}; for(const n of V) g[n]=new GB(!['plain','dark'].includes(n)); groups.set(k,g); } return g; };
  for(const b of W.BUILDINGS){
    b.solid=false; b.walkY=undefined;
    if(b.f<1||b.ext.length<3) continue;
    const ext=orient(b.ext,true), holes=(b.holes||[]).filter(h=>h.length>=3).map(h=>orient(h,false));
    let gmin=1e9,gmax=-1e9; for(const p of ext){ const g=W.terrain(p[0],p[1]); gmin=Math.min(gmin,g); gmax=Math.max(gmax,g); }
    const R=rng(1000+b.k*7); const G_=WP.school&&b.id===WP.school.id?grpK('school'):grp(b.c[0],b.c[1]); const kd=b.kd||'house';
    const floorY=gmin+0.15+Math.max(0,(gmax-gmin)*0.35), y0=gmin-1.2;
    const rect=!holes.length?luRect(ext):null; const rectFit=rect&&rect.A<=b.area*1.22&&rect.hv>=1.6&&rect.hv<=11;
    const T_=Math.max(2.6,(b.t||((b.f||1)*3.2+1.2))-(floorY-gmin)*0.5);
    const rise=rectFit?Math.min(rect.hv*0.78,T_*0.48):0;
    let eave=rectFit?Math.max(2.3,T_-rise):Math.max(2.6,T_-(kd==='school'?0:0.4)); if(kd==='shed') eave=Math.min(eave,2.6);
    const top=floorY+eave;
    const wallG=kd==='farm'?G_.barn:kd==='shed'?G_.barn:(kd==='school'||kd==='church')?G_.stone:(b.k%5===0?G_.render:b.k%3===0?G_.stoneB:G_.stone);
    b.kind=kd==='shed'?'shed':kd==='school'?'hotel':'house'; b.ring=ext; b.holesO=holes; b.floorY=floorY; b.top=top; b.base=y0; b.hgt=top-y0;
    const wallsFor=(ring)=>{ for(let i=0;i<ring.length;i++){ const a=ring[i], c=ring[(i+1)%ring.length]; const dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz); if(L<0.05) continue; const n=[dz/L,0,-dx/L];
      const u1=Math.max(1,Math.round(L/3)); wallG.quad([a[0],y0,a[1]],[c[0],y0,c[1]],[c[0],top,c[1]],[a[0],top,a[1]],n,[0,(y0-floorY)/6],[u1,(y0-floorY)/6],[u1,(top-floorY)/6],[0,(top-floorY)/6]); } };
    wallsFor(ext); holes.forEach(wallsFor);
    if(rectFit&&rise>0.8){ const ridge=luGable(G_.slate,G_.gable,rect,top,rise); b.walkY=top+0.05; b.roofTop=ridge;
      // chimneys on houses
      if(kd==='house'&&b.area>40&&R()<0.8){ for(const s of [-1,1]){ if(R()<0.4) continue; const u=s*(rect.hu-0.5); G_.dark.box(rect.cx+rect.ux*u,ridge-0.6,rect.cz+rect.uz*u,0.7,1.6,0.9,Math.atan2(rect.uz,rect.ux)); } } }
    else if(!holes.length&&ext.length<=14&&b.area<1800){ const ridge=hipRoof(G_.slate,ext,top,G_.plain); b.walkY=top+0.05; b.roofTop=ridge; }
    else { const pd=0.3, roofY=top-0.5; const extI=insetRing(ext,pd), holesI=holes.map(h=>insetRing(h,pd));
      const cap=(o,i_)=>{ for(let k=0;k<o.length;k++){ const k2=(k+1)%o.length; G_.plain.quad([o[k][0],top,o[k][1]],[o[k2][0],top,o[k2][1]],[i_[k2][0],top,i_[k2][1]],[i_[k][0],top,i_[k][1]],[0,1,0]); } };
      const inner=(r)=>{ for(let k=0;k<r.length;k++){ const a=r[k], c=r[(k+1)%r.length]; const dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz); if(L<0.05) continue; G_.plain.quad([a[0],roofY,a[1]],[c[0],roofY,c[1]],[c[0],top,c[1]],[a[0],top,a[1]],[-dz/L,0,dx/L]); } };
      cap(ext,extI); holes.forEach((h,i_)=>cap(h,holesI[i_])); inner(extI); holesI.forEach(inner);
      const pts=extI.concat(...holesI); const tris=THREE.ShapeUtils.triangulateShape(extI.map(p=>new THREE.Vector2(p[0],p[1])),holesI.map(h=>h.map(p=>new THREE.Vector2(p[0],p[1]))));
      for(const t of tris){ const P=t.map(k=>pts[k]); if(!P[0]||!P[1]||!P[2]) continue; G_.slate.tri([P[0][0],roofY,P[0][1]],[P[1][0],roofY,P[1][1]],[P[2][0],roofY,P[2][1]],[0,1,0],[P[0][0]/3,P[0][1]/3],[P[1][0]/3,P[1][1]/3],[P[2][0]/3,P[2][1]/3]); }
      b.walkY=roofY; }
    b.solid=true; BLD.push(b);
  }
  const mats=luMats();
  for(const [key,g] of groups) for(const n of V){ const m=g[n].mesh(mats[n],true); if(m&&n!=='slate') BLDMESH.push(m); if(m&&key==='school') LU.scMesh.push(m); }
}
/* ---- dry stone walls, hedges and fences: segments sorted into chunks; each chunk's mesh is made when you come near */
function luWallsInit(){ const J=W.X&&W.X['walls.json']; if(!J||!J.w) return; const cs=LU.cs;
  for(const [k,h10,pts] of J.w){ if(k===3) continue; const h=h10/10;
    for(let i=0;i+3<pts.length;i+=2){ const x0=pts[i]/4, z0=pts[i+1]/4, x1=pts[i+2]/4, z1=pts[i+3]/4; const L=Math.hypot(x1-x0,z1-z0); if(L<0.2) continue;
      const n=Math.max(1,Math.ceil(L/40)); for(let s=0;s<n;s++){ const a=s/n, b=(s+1)/n; const ax=x0+(x1-x0)*a, az=z0+(z1-z0)*a, bx=x0+(x1-x0)*b, bz=z0+(z1-z0)*b;
        const key=Math.floor((ax+bx)/2/cs)+','+Math.floor((az+bz)/2/cs); let C=LU.chunks.get(key); if(!C){ const [ci,cj]=key.split(',').map(Number); C={segs:[],cx:(ci+0.5)*cs,cz:(cj+0.5)*cs,meshes:null}; LU.chunks.set(key,C); }
        C.segs.push([ax,az,bx,bz,k,h]); LU.segs++; LU.km[k]+=L/n/1000; } } }
}
function luChunkBuild(C){ const M=luMats(); const gW=new GB(true), gH=new GB(true), gF=new GB(false);
  for(const [ax,az,bx,bz,k,h] of C.segs){ const L=Math.hypot(bx-ax,bz-az), ux=(bx-ax)/L, uz=(bz-az)/L, px=-uz, pz=ux;
    if(k===2){ // fence: posts every 2.6 m and two rails
      for(let s=0;s<=L;s+=2.6){ const x=ax+ux*s, z=az+uz*s, g=W.terrain(x,z); gF.box(x,g-0.1,z,0.1,1.2,0.1,Math.atan2(uz,ux)); }
      const n=Math.max(1,Math.ceil(L/3)); for(let q=0;q<n;q++){ const s0=q/n*L, s1=(q+1)/n*L; const x0=ax+ux*s0, z0=az+uz*s0, x1=ax+ux*s1, z1=az+uz*s1; const g0=W.terrain(x0,z0), g1=W.terrain(x1,z1);
        for(const yy of [0.55,1.0]) gF.quad([x0+px*0.03,g0+yy,z0+pz*0.03],[x1+px*0.03,g1+yy,z1+pz*0.03],[x1+px*0.03,g1+yy+0.09,z1+pz*0.03],[x0+px*0.03,g0+yy+0.09,z0+pz*0.03],[px,0,pz]); }
      continue; }
    const hedge=k===1, wb=hedge?1.25:0.72, wt=hedge?0.95:0.42, gb=hedge?gH:gW, uS=hedge?2.2:1.6;
    const n=Math.max(1,Math.ceil(L/(hedge?3:2.5)));
    for(let q=0;q<n;q++){ const s0=q/n*L, s1=(q+1)/n*L; const x0=ax+ux*s0, z0=az+uz*s0, x1=ax+ux*s1, z1=az+uz*s1;
      const g0=W.terrain(x0,z0)-0.25, g1=W.terrain(x1,z1)-0.25; const hh0=h+0.25+(hedge?0.25*Math.sin(x0*0.9+z0*1.3):0.06*Math.sin(x0*3.1+z0*2.3)), hh1=h+0.25+(hedge?0.25*Math.sin(x1*0.9+z1*1.3):0.06*Math.sin(x1*3.1+z1*2.3));
      const u0=s0/uS, u1=s1/uS;
      for(const sd of [-1,1]){ const nx=px*sd, nz=pz*sd; const A=[x0+nx*wb/2,g0,z0+nz*wb/2], B=[x1+nx*wb/2,g1,z1+nz*wb/2], Cq=[x1+nx*wt/2,g1+hh1,z1+nz*wt/2], Dq=[x0+nx*wt/2,g0+hh0,z0+nz*wt/2];
        const tl=(wb-wt)/2, nn=Math.hypot(hh0,tl)||1; gb.quad(A,B,Cq,Dq,[nx*hh0/nn,tl/nn,nz*hh0/nn],[u0,0],[u1,0],[u1,hh1/uS],[u0,hh0/uS]); }
      if(hedge){ const r0=[x0,g0+hh0+0.22,z0], r1=[x1,g1+hh1+0.22,z1];
        for(const sd of [-1,1]){ const nx=px*sd, nz=pz*sd; gb.quad([x0+nx*wt/2,g0+hh0,z0+nz*wt/2],[x1+nx*wt/2,g1+hh1,z1+nz*wt/2],r1,r0,[nx*0.5,0.86,nz*0.5],[u0,hh0/uS],[u1,hh1/uS],[u1,hh1/uS+0.3],[u0,hh0/uS+0.3]); } }
      else gb.quad([x0+px*wt/2,g0+hh0,z0+pz*wt/2],[x1+px*wt/2,g1+hh1,z1+pz*wt/2],[x1-px*wt/2,g1+hh1,z1-pz*wt/2],[x0-px*wt/2,g0+hh0,z0-pz*wt/2],[0,1,0],[u0,0.9],[u1,0.9],[u1,1.15],[u0,1.15]);
      if(q===0||q===n-1){ const e=q===0?[x0,z0,g0,hh0,-1]:[x1,z1,g1,hh1,1]; const ex=ux*e[4], ez=uz*e[4];   // end caps
        gb.quad([e[0]-px*wb/2,e[2],e[1]-pz*wb/2],[e[0]+px*wb/2,e[2],e[1]+pz*wb/2],[e[0]+px*wt/2,e[2]+e[3],e[1]+pz*wt/2],[e[0]-px*wt/2,e[2]+e[3],e[1]-pz*wt/2],[ex,0,ez],[0,0],[wb/uS,0],[wb/uS,e[3]/uS],[0,e[3]/uS]); } } }
  C.meshes=[gW.mesh(M.wall,true),gH.mesh(M.hedge,true),gF.mesh(M.wood,false)].filter(Boolean); LU.n++;
  for(const m of C.meshes) m.receiveShadow=true; }
function luChunkDrop(C){ if(!C.meshes) return; for(const m of C.meshes){ scene.remove(m); m.geometry.dispose(); } C.meshes=null; LU.n--; }
function luTick(dt,force){ if(!LU.chunks.size) return; LU.t+=dt; if(!force&&LU.t<0.4) return; LU.t=0;
  const p=camera.position, hgt=Math.max(0,p.y-W.terrain(p.x,p.z)); const on=hgt>420?0:LU.on, off=LU.off; let budget=force?1e9:2;
  const order=[]; for(const C of LU.chunks.values()){ const d=Math.hypot(C.cx-p.x,C.cz-p.z,hgt*0.8); order.push([d,C]); }
  order.sort((a,b)=>a[0]-b[0]);
  for(const [d,C] of order){ if(d<on&&!C.meshes&&budget>0){ luChunkBuild(C); budget--; } else if(d>off&&C.meshes) luChunkDrop(C); } }
function luBoot(){ if(!WP.walls) return; luWallsInit(); luTick(0,true); }
function luGuideHTML(){ if(!WP.walls) return ''; return '<li><b>Muros de piedra y setos</b>: los muros de piedra seca y los setos que separan los prados salen del LIDAR (el láser que mide el terreno desde un avión) y de OpenStreetMap. Se dibujan a tu alrededor; de lejos se ven en el suelo como líneas.</li>'; }
function luGlossHTML(){ if(!WP.walls) return ''; return '<dt>Muro de piedra seca</dt><dd><i>Dry stone wall</i>: muro de piedras encajadas sin mortero, el que separa los prados de Cumbria.</dd><dt>Seto</dt><dd><i>Hedge</i>: hilera de arbustos (espino, avellano) que hace de linde entre prados.</dd><dt>LIDAR</dt><dd>Medida del terreno con un láser desde un avión: da la altura del suelo y de lo que hay encima (árboles, tejados, muros).</dd>'; }
