/* ================= real-world data loader, shared by every world (Valdecañas, Madrid…) ================= */
/* Relieve: IGN MDT (CC BY 4.0). Foto: IGN PNOA (CC BY 4.0). Edificios: Catastro. Caminos y campos: OpenStreetMap (ODbL).
   The world module after this one defines WP (texts, places and hooks of that world). */
const VG_CFG0=window.VG_CFG||{};
const DATA_BASE=VG_CFG0.data||'data/';
// on the artifact host the binary grids travel as base64 text (.txt), because it only serves web file types; joaco.org serves them raw
const B64=VG_CFG0.b64!==false;
function b64ToBuf(s){ const bin=atob(s.replace(/\s+/g,'')); const n=bin.length, u=new Uint8Array(n); for(let i=0;i<n;i++) u[i]=bin.charCodeAt(i); return u.buffer; }
async function getBuf(name,onProg){ const r=await fetch(DATA_BASE+name+(B64?'.txt':'')); if(!r.ok) throw new Error('No se pudo cargar '+name+' ('+r.status+')'); const b=B64?b64ToBuf(await r.text()):await r.arrayBuffer(); if(onProg) onProg(); return b; }
async function getJSON(name){ const r=await fetch(DATA_BASE+name); if(!r.ok) throw new Error('No se pudo cargar '+name+' ('+r.status+')'); return await r.json(); }
function parseH(buf){ const dv=new DataView(buf); const w=dv.getUint32(4,true), h=dv.getUint32(8,true), off=dv.getFloat32(12,true), sc=dv.getFloat32(16,true);
  const u=new Uint16Array(buf,20,w*h); const f=new Float32Array(w*h); for(let i=0;i<f.length;i++) f[i]=u[i]/sc-off; return {w,h,data:f}; }
function parseRLE(buf){ const dv=new DataView(buf); const w=dv.getUint32(4,true), h=dv.getUint32(8,true); const out=new Uint8Array(w*h); let p=12, o=0;
  while(p+2<buf.byteLength && o<out.length){ const v=dv.getUint8(p), run=dv.getUint16(p+1,true); out.fill(v,o,o+run); o+=run; p+=3; } return {w,h,data:out}; }
function sstep(a,b,x){ const t=Math.min(1,Math.max(0,(x-a)/(b-a))); return t*t*(3-2*t); }
function hash2(i,j){ let h=(Math.imul(i|0,374761393)+Math.imul(j|0,668265263))|0; h=Math.imul(h^(h>>>13),1274126177); h^=h>>>16; return (h>>>0)/4294967296; }
function vnoise(x,y){ const xi=Math.floor(x), yi=Math.floor(y); const xf=x-xi, yf=y-yi; const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf);
  const a=hash2(xi,yi), b=hash2(xi+1,yi), c=hash2(xi,yi+1), d=hash2(xi+1,yi+1); return (a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v)*2-1; }
function rngF(seed){ let a=seed>>>0; return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function polyLen(P){ let L=0; for(let i=0;i<P.length-1;i++) L+=Math.hypot(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1]); return L; }
function polyAt(P,s){ for(let i=0;i<P.length-1;i++){ const dx=P[i+1][0]-P[i][0], dz=P[i+1][1]-P[i][1]; const L=Math.hypot(dx,dz);
    if(s<=L||i===P.length-2){ const t=Math.max(0,Math.min(1,s/L)); return {x:P[i][0]+dx*t, z:P[i][1]+dz*t, ux:dx/L, uz:dz/L}; } s-=L; } }
function projPoly(P,x,z){ let best=1e9, bs=0, acc=0; for(let i=0;i<P.length-1;i++){ const ax=P[i][0],az=P[i][1],vx=P[i+1][0]-ax,vz=P[i+1][1]-az; const L=Math.hypot(vx,vz);
    const t=Math.max(0,Math.min(1,((x-ax)*vx+(z-az)*vz)/(L*L))); const d=Math.hypot(ax+vx*t-x,az+vz*t-z); if(d<best){best=d; bs=acc+t*L;} acc+=L; } return bs; }
function pointInPoly(x,z,ring){ let c=false; for(let i=0,j=ring.length-1;i<ring.length;j=i++){ const xi=ring[i][0], zi=ring[i][1], xj=ring[j][0], zj=ring[j][1];
    if(((zi>z)!==(zj>z)) && (x<(xj-xi)*(z-zi)/(zj-zi)+xi)) c=!c; } return c; }
function distToRing(x,z,ring){ let best=1e9, bx=0, bz=0; for(let i=0,j=ring.length-1;i<ring.length;j=i++){ const ax=ring[j][0], az=ring[j][1], vx=ring[i][0]-ax, vz=ring[i][1]-az; const l2=vx*vx+vz*vz||1e-9;
    const t=Math.max(0,Math.min(1,((x-ax)*vx+(z-az)*vz)/l2)); const qx=ax+vx*t, qz=az+vz*t; const d=Math.hypot(x-qx,z-qz); if(d<best){ best=d; bx=qx; bz=qz; } } return [best,bx,bz]; }
function ringArea(r){ let a=0; for(let i=0,j=r.length-1;i<r.length;j=i++) a+=(r[j][0]*r[i][1]-r[i][0]*r[j][1]); return a/2; }
function ringCentroid(r){ let x=0,z=0; for(const p of r){ x+=p[0]; z+=p[1]; } return [x/r.length,z/r.length]; }

const W={rng:rngF,sstep,vnoise,polyAt,projPoly,polyLen,pointInPoly,ringCentroid,distToRing,ringArea};
async function loadWorld(progress){
  const files=['course.json','buildings.json','pools.json','h_core.bin','h_wide.bin','h_region.bin','surface_core.rle','trees.bin'];
  let done=0; const tick=()=>{ done++; progress(0.05+0.4*done/files.length,WP.T.loadData+' '+done+'/'+files.length); };
  const [course,blds,pools,hc,hw,hr,sc,tr]=await Promise.all([getJSON('course.json').then(v=>(tick(),v)),getJSON('buildings.json').then(v=>(tick(),v)),getJSON('pools.json').then(v=>(tick(),v)).catch(()=>(tick(),[])),
    getBuf('h_core.bin',tick),getBuf('h_wide.bin',tick),getBuf('h_region.bin',tick),getBuf('surface_core.rle',tick),getBuf('trees.bin',tick)]);
  const F=course.frames;
  const core=Object.assign(parseH(hc),{x0:F.h_core.x0,z0:F.h_core.z0,step:F.h_core.step});
  const wide=Object.assign(parseH(hw),{x0:F.h_wide.x0,z0:F.h_wide.z0,step:F.h_wide.step});
  const reg=Object.assign(parseH(hr),{x0:F.h_region.x0+F.h_region.step/2,z0:F.h_region.z0+F.h_region.step/2,step:F.h_region.step});
  const surf0=parseRLE(sc), surf=Object.assign(surf0,{x0:F.core[0],z0:F.core[1],step:F.core[2]/surf0.w});
  W.core=core; W.wide=wide; W.reg=reg; W.surf=surf; W.CORE=F.core; W.ORTHO=F.ortho; W.MAPPH=F.mapPhoto||F.ortho;
  const PONDS=course.ponds.map((p,i)=>({i,name:p.name,poly:p.poly,level:p.level,hole:p.hole,c:ringCentroid(p.poly)}));
  W.PONDS=PONDS; W.SEA=!!WP.sea;
  // ---- heights
  function cell(G,i,j){ i=i<0?0:i>=G.h?G.h-1:i; j=j<0?0:j>=G.w?G.w-1:j; return G.data[i*G.w+j]; }
  function bilinear(G,x,z){ const fx=(x-G.x0)/G.step, fz=(z-G.z0)/G.step; const j=Math.floor(fx), i=Math.floor(fz); const tx=fx-j, tz=fz-i;
    const a=cell(G,i,j), b=cell(G,i,j+1), c=cell(G,i+1,j), d=cell(G,i+1,j+1); return a+(b-a)*tx+(c-a)*tz+(a-b-c+d)*tx*tz; }
  function cr(p0,p1,p2,p3,t){ return p1+0.5*t*(p2-p0+t*(2*p0-5*p1+4*p2-p3+t*(3*(p1-p2)+p3-p0))); }
  function bicubic(G,x,z){ const fx=(x-G.x0)/G.step, fz=(z-G.z0)/G.step; const j=Math.floor(fx), i=Math.floor(fz); const tx=fx-j, tz=fz-i;
    const r=[0,0,0,0]; for(let k=-1;k<=2;k++) r[k+1]=cr(cell(G,i+k,j-1),cell(G,i+k,j),cell(G,i+k,j+1),cell(G,i+k,j+2),tx); return cr(r[0],r[1],r[2],r[3],tz); }
  const cx1=core.x0+core.step*(core.w-1), cz1=core.z0+core.step*(core.h-1);
  const wx1=wide.x0+wide.step*(wide.w-1), wz1=wide.z0+wide.step*(wide.h-1);
  // greens: the 5 m relief cannot hold a real green, so each one becomes a plane of at most 2 % slope, blended into the ground around it
  let GREENS=null; const GC=16, gkey=(i,j)=>i*100003+j;
  function terrain(x,z){ const h=terrain0(x,z); if(!GREENS) return h; const a=GREENS.get(gkey(Math.floor(x/GC),Math.floor(z/GC))); if(!a) return h;
    for(const g of a){ if(x<g.x0||x>g.x1||z<g.z0||z>g.z1) continue; const p=g.h0+g.bx*(x-g.cx)+g.bz*(z-g.cz);
      if(pointInPoly(x,z,g.poly)) return p; const d=distToRing(x,z,g.poly)[0]; if(d<g.m){ const t=sstep(0,g.m,d); return p+(h-p)*t; } }
    return h; }
  function terrain0(x,z){
    if(x>core.x0&&x<cx1&&z>core.z0&&z<cz1){ const h=bicubic(core,x,z); const e=Math.min(x-core.x0,cx1-x,z-core.z0,cz1-z); if(e>60) return h; const hw2=bilinear(wide,x,z); const t=e/60; return hw2+(h-hw2)*t; }
    if(x>wide.x0&&x<wx1&&z>wide.z0&&z<wz1){ const h=bilinear(wide,x,z); const e=Math.min(x-wide.x0,wx1-x,z-wide.z0,wz1-z); if(e>300) return h; const hr2=bilinear(reg,x,z); return hr2+(h-hr2)*(e/300); }
    return bilinear(reg,x,z);
  }
  function surfAt(x,z){ const j=Math.floor((x-surf.x0)/surf.step), i=Math.floor((z-surf.z0)/surf.step);
    if(i<0||j<0||i>=surf.h||j>=surf.w) return W.SEA&&terrain(x,z)<0?0:1; return surf.data[i*surf.w+j]; }
  // ---- swimming pools seen in the photo (rectangles, or an outline for the big resort pool)
  const PCELL=10, pgrid=new Map();
  const POOLS=pools.map((p,k)=>{ let ring;
    if(p.poly) ring=p.poly; else { const c=Math.cos(p.a), s=Math.sin(p.a), hl=p.l/2, hw=p.w/2; ring=[[-hl,-hw],[hl,-hw],[hl,hw],[-hl,hw]].map(([u,v])=>[p.x+u*c-v*s,p.z+u*s+v*c]); }
    let lv=-1e9, x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const q of ring){ lv=Math.max(lv,terrain(q[0],q[1])); x0=Math.min(x0,q[0]); x1=Math.max(x1,q[0]); z0=Math.min(z0,q[1]); z1=Math.max(z1,q[1]); }
    const o={k,ring,level:lv+0.07,x0,x1,z0,z1,c:[p.x,p.z]};
    for(let i=Math.floor(x0/PCELL);i<=Math.floor(x1/PCELL);i++) for(let j=Math.floor(z0/PCELL);j<=Math.floor(z1/PCELL);j++){ const key=i+','+j; if(!pgrid.has(key)) pgrid.set(key,[]); pgrid.get(key).push(o); }
    return o; }).filter(o=>o.level>0.5);
  function poolAt(x,z){ const a=pgrid.get(Math.floor(x/PCELL)+','+Math.floor(z/PCELL)); if(!a) return null; for(const o of a){ if(x>o.x0&&x<o.x1&&z>o.z0&&z<o.z1&&pointInPoly(x,z,o.ring)) return o; } return null; }
  // the sea level (the reservoir) is y = 0 when the world has one; inland worlds only have ponds, rivers and pools
  function waterLevel(x,z){ const p=poolAt(x,z); if(p) return p.level; const c=surfAt(x,z); return c>=20&&PONDS[c-20]?PONDS[c-20].level:(W.SEA?0:-1e4); }
  W.POOLS=POOLS; W.poolAt=poolAt;
  W.terrain=terrain; W.hIsland=terrain; W.surfAt=surfAt; W.waterLevel=waterLevel; W.bilinear=bilinear;
  // ---- holes
  W.HOLES=course.holes.map((h,i)=>{
    const P=[h.tee].concat(h.bends||[],[h.green]).map(p=>[p[0],p[1]]);
    const gp=h.green_poly; const gc=ringCentroid(gp);
    const len=polyLen(P); const app=polyAt(P,len-1); const ga=Math.atan2(app.uz,app.ux); const t0=polyAt(P,1); const ta=Math.atan2(t0.uz,t0.ux);
    // pin: inside the green, at least 3.5 m from its edge, offset from the centre
    const R=rngF(100+i); let pin=[gc[0],gc[1]];
    for(let k=0;k<60;k++){ const a=R()*Math.PI*2, r=2+R()*7; const x=gc[0]+Math.cos(a)*r, z=gc[1]+Math.sin(a)*r;
      if(pointInPoly(x,z,gp)&&distToRing(x,z,gp)[0]>3.5){ pin=[x,z]; break; } }
    let ra=0; for(const p of gp) ra=Math.max(ra,Math.hypot(p[0]-gc[0],p[1]-gc[1]));
    return {i,n:h.n,par:h.par,L:h.L,hcp:h.hcp,info:h.info,tees:h.tees||null,course:0,tx:h.tee[0],tz:h.tee[1],gx:gc[0],gz:gc[1],P,len,ga,gc:Math.cos(ga),gs:Math.sin(ga),ta,tc:Math.cos(ta),ts:Math.sin(ta),pin,greenPoly:gp,ra,tH:0,gH:terrain(gc[0],gc[1])};
  });
  { // fit the planes of the greens on the original relief
    GREENS=new Map(); const M=6;
    for(const H of W.HOLES){ const gp=H.greenPoly; if(!gp||gp.length<3) continue; let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const p of gp){ x0=Math.min(x0,p[0]); x1=Math.max(x1,p[0]); z0=Math.min(z0,p[1]); z1=Math.max(z1,p[1]); }
      const cx=(x0+x1)/2, cz=(z0+z1)/2; let n=0,sh=0,sx=0,sz=0,sxx=0,szz=0,sxz=0,sxh=0,szh=0;
      for(let x=x0;x<=x1;x+=1.5) for(let z=z0;z<=z1;z+=1.5){ if(!pointInPoly(x,z,gp)) continue; const h=terrain0(x,z), u=x-cx, v=z-cz; n++; sh+=h; sx+=u; sz+=v; sxx+=u*u; szz+=v*v; sxz+=u*v; sxh+=u*h; szh+=v*h; }
      if(n<6) continue; const mx=sx/n, mz=sz/n, mh=sh/n; const cxx=sxx/n-mx*mx, czz=szz/n-mz*mz, cxz=sxz/n-mx*mz, cxh=sxh/n-mx*mh, czh=szh/n-mz*mh; const det=cxx*czz-cxz*cxz;
      let bx=0,bz=0; if(Math.abs(det)>1e-6){ bx=(cxh*czz-czh*cxz)/det; bz=(czh*cxx-cxh*cxz)/det; } const gm=Math.hypot(bx,bz), cap=0.02; if(gm>cap){ bx*=cap/gm; bz*=cap/gm; }
      const g={poly:gp,cx,cz,h0:mh-bx*mx-bz*mz,bx,bz,m:M,x0:x0-M,x1:x1+M,z0:z0-M,z1:z1+M};
      for(let i=Math.floor(g.x0/GC);i<=Math.floor(g.x1/GC);i++) for(let j=Math.floor(g.z0/GC);j<=Math.floor(g.z1/GC);j++){ const k=gkey(i,j); if(!GREENS.has(k)) GREENS.set(k,[]); GREENS.get(k).push(g); } }
  }
  for(const H of W.HOLES){ H.tH=terrain(H.tx,H.tz); H.gH=terrain(H.gx,H.gz); }
  // courses: several 18-hole layouts can share one world (Madrid: four); a world with none listed has a single course
  const CS=(course.courses&&course.courses.length)?course.courses:[{id:'campo',name:'El campo',short:'',holes:W.HOLES.map((H,i)=>i)}];
  W.COURSES=CS.map((c,k)=>({k,id:c.id,name:c.name,short:c.short||'',club:c.club||'',tee:c.tee||'',note:c.note||'',color:c.color||'#255d3c',holes:c.holes.slice(),par:0,L:0}));
  for(const C of W.COURSES){ for(const i of C.holes){ const H=W.HOLES[i]; if(!H) continue; H.course=C.k; C.par+=H.par; C.L+=H.L; } }
  W.MULTI=W.COURSES.length>1;
  // ---- buildings
  const BCELL=12, bgrid=new Map();
  // drop Catastro 'parts' that are whole plots (sports grounds, parks): a one-storey footprint of hectares is not a building
  const blds2=blds.filter(b=>{ const a=Math.abs(ringArea(b.e)); return !(a>25000||(b.f<=1&&a>9000)); });
  const BLDS=blds2.map((b,k)=>{
    const f=b.f; const hgt=f>=3?f*3.4+0.4:f===2?6.9:f===1?3.6:2.7;
    let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const p of b.e){ x0=Math.min(x0,p[0]); x1=Math.max(x1,p[0]); z0=Math.min(z0,p[1]); z1=Math.max(z1,p[1]); }
    const o={k,id:b.id,f,ext:b.e,holes:b.h||[],base:b.b,top:b.b+hgt,hgt,x0,x1,z0,z1,area:Math.abs(ringArea(b.e)),c:ringCentroid(b.e),solid:f>=1};
    for(let i=Math.floor(x0/BCELL);i<=Math.floor(x1/BCELL);i++) for(let j=Math.floor(z0/BCELL);j<=Math.floor(z1/BCELL);j++){ const key=i+','+j; if(!bgrid.has(key)) bgrid.set(key,[]); bgrid.get(key).push(o); }
    return o; });
  W.BUILDINGS=BLDS; W.bgrid=bgrid; W.BCELL=BCELL;
  // ---- trees
  const tv=new Int16Array(tr); const TREES=[]; for(let i=0;i<tv.length;i+=3) TREES.push({x:tv[i]/4,z:tv[i+1]/4,r:tv[i+2]/10});
  W.TREES=TREES;
  W.course=course;
  if(WP.afterLoad) WP.afterLoad(W);
  return W;
}
