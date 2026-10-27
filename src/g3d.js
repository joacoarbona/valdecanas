
/* ================= villa interiors: built on entering, from the Catastro footprint ================= */
const THEMES=[
  {id:'rustico',n:'Rústico extremeño',floor:'#b5643f',pat:'tiles',wall:'#f3ede1',acc:'#6c7b3b',wood:'#6a4528',fab:'#8b5a39',metal:'#3a3530',rug:'#a3442c',special:'fireplace'},
  {id:'moderno',n:'Moderno',floor:'#c4c1ba',pat:'plain',wall:'#f8f8f6',acc:'#1f2328',wood:'#d8d1c4',fab:'#efede8',metal:'#202224',rug:'#9aa0a6',special:'art'},
  {id:'nordico',n:'Nórdico',floor:'#d9c4a2',pat:'planks',wall:'#ebebe8',acc:'#7b8d7a',wood:'#e3d0ae',fab:'#c8c4bc',metal:'#d6d6d6',rug:'#e9e4da',special:'plants'},
  {id:'medit',n:'Mediterráneo',floor:'#e9e3d7',pat:'terrazzo',wall:'#fcfbf7',acc:'#2f6fa8',wood:'#c8a87b',fab:'#e8eef6',metal:'#9aa3ab',rug:'#2f6fa8',special:'sea'},
  {id:'golf',n:'Club de golf',floor:'#5b3b25',pat:'planks',wall:'#3e5b44',acc:'#c9a24a',wood:'#4a2f1d',fab:'#7b3c23',metal:'#c9a24a',rug:'#8c2f2a',special:'putting'},
  {id:'familia',n:'Familiar',floor:'#cfb99c',pat:'planks',wall:'#f4f0e7',acc:'#e8742c',wood:'#dabb8c',fab:'#5aa3d6',metal:'#e8742c',rug:'#f2c230',special:'kids'},
  {id:'juegos',n:'Sala de juegos',floor:'#4b4e53',pat:'plain',wall:'#b4654a',acc:'#d6442a',wood:'#3c2b21',fab:'#202327',metal:'#151719',rug:'#2a2d31',special:'games',brick:true},
  {id:'zen',n:'Zen',floor:'#cbbb8c',pat:'tatami',wall:'#ede7d9',acc:'#8a2b20',wood:'#3b2b1d',fab:'#d9d0be',metal:'#2b2b2b',rug:'#cbbb8c',special:'zen'}
];
function themeFor(b){ let h=0; for(const ch of String(b.id)) h=(h*31+ch.charCodeAt(0))>>>0; return THEMES[h%THEMES.length]; }
const intLights=[0,1].map(()=>{ const l=new THREE.PointLight(0xffdcb0,0,18,1.4); scene.add(l); return l; });
const _texCache=new Map();
function floorTex(pat,col){ const key=pat+col; if(_texCache.has(key)) return _texCache.get(key);
  const t=canvasTex(512,512,(g,w,h)=>{ const R=rng(pat.length*97+col.length); g.fillStyle=col; g.fillRect(0,0,w,h);
    const shade=(a)=>'rgba('+(a>0?'255,250,240,':'40,25,10,')+Math.abs(a)+')';
    if(pat==='tiles'){ for(let i=0;i<4;i++) for(let j=0;j<4;j++){ g.fillStyle=shade((R()-0.5)*0.22); g.fillRect(i*128+3,j*128+3,122,122); } g.strokeStyle='rgba(235,225,205,0.9)'; g.lineWidth=5; for(let i=0;i<=4;i++){ g.beginPath(); g.moveTo(i*128,0); g.lineTo(i*128,h); g.stroke(); g.beginPath(); g.moveTo(0,i*128); g.lineTo(w,i*128); g.stroke(); } }
    else if(pat==='planks'){ for(let i=0;i<8;i++){ let y=0; while(y<h){ const L=120+R()*260; g.fillStyle=shade((R()-0.5)*0.25); g.fillRect(i*64+1,y,62,L-2); for(let k=0;k<5;k++){ g.strokeStyle=shade(-0.08); g.lineWidth=1; g.beginPath(); const xx=i*64+8+R()*48; g.moveTo(xx,y+4); g.lineTo(xx+(R()-0.5)*6,y+L-6); g.stroke(); } y+=L; } } }
    else if(pat==='terrazzo'){ speckle(g,w,h,5200,77,['rgba(120,110,95,0.5)','rgba(200,190,170,0.6)','rgba(70,90,110,0.35)','rgba(255,255,255,0.6)']); }
    else if(pat==='tatami'){ for(const [x,y,ww,hh] of [[0,0,256,512],[256,0,256,256],[256,256,256,256]]){ g.fillStyle=shade((R()-0.5)*0.12); g.fillRect(x+4,y+4,ww-8,hh-8); g.strokeStyle='rgba(60,45,25,0.85)'; g.lineWidth=8; g.strokeRect(x+4,y+4,ww-8,hh-8); for(let k=0;k<60;k++){ g.strokeStyle=shade(-0.05); g.lineWidth=1; g.beginPath(); const yy=y+8+k*(hh-16)/60; g.moveTo(x+8,yy); g.lineTo(x+ww-8,yy); g.stroke(); } } }
    else speckle(g,w,h,3000,55,['rgba(255,255,255,0.08)','rgba(0,0,0,0.06)']);
  },true); _texCache.set(key,t); return t; }
function brickTex(){ if(_texCache.has('brick')) return _texCache.get('brick'); const t=canvasTex(512,512,(g,w,h)=>{ g.fillStyle='#d9cfc2'; g.fillRect(0,0,w,h); const R=rng(5);
  for(let r=0;r<16;r++) for(let c=-1;c<5;c++){ const x=c*128+(r%2?64:0), y=r*32; g.fillStyle='rgb('+(150+R()*40|0)+','+(80+R()*25|0)+','+(60+R()*20|0)+')'; g.fillRect(x+3,y+3,122,26); } },true); _texCache.set('brick',t); return t; }
function paintingTex(k){ const key='paint'+k; if(_texCache.has(key)) return _texCache.get(key); const t=canvasTex(256,192,(g,w,h)=>{ const R=rng(300+k*13);
    if(k%4===0){ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#f2c38f'); gr.addColorStop(0.55,'#e88a5a'); gr.addColorStop(0.56,'#3c6f8a'); gr.addColorStop(1,'#22465c'); g.fillStyle=gr; g.fillRect(0,0,w,h); g.fillStyle='#fff3c9'; g.beginPath(); g.arc(w*0.65,h*0.5,22,0,7); g.fill(); g.fillStyle='#2d3b2c'; g.beginPath(); g.moveTo(0,h*0.56); g.lineTo(w*0.3,h*0.4); g.lineTo(w*0.55,h*0.56); g.fill(); }
    else if(k%4===1){ g.fillStyle='#f4efe6'; g.fillRect(0,0,w,h); const cols=['#d6442a','#2a6f87','#f2c230','#1f2328','#7b8d7a']; for(let i=0;i<7;i++){ g.fillStyle=cols[(R()*cols.length)|0]; g.fillRect(R()*w*0.8,R()*h*0.8,30+R()*90,20+R()*70); } }
    else if(k%4===2){ g.fillStyle='#cfe3ef'; g.fillRect(0,0,w,h); g.fillStyle='#2f6fa8'; g.fillRect(0,h*0.6,w,h*0.4); g.fillStyle='#fff'; g.beginPath(); g.moveTo(w*0.45,h*0.58); g.lineTo(w*0.45,h*0.2); g.lineTo(w*0.62,h*0.56); g.fill(); g.fillStyle='#7a4a2a'; g.fillRect(w*0.36,h*0.58,w*0.3,10); }
    else { g.fillStyle='#e9e1cf'; g.fillRect(0,0,w,h); g.fillStyle='#4f7a3a'; for(let i=0;i<5;i++){ g.beginPath(); g.ellipse(40+i*45,h*0.55+(R()-0.5)*30,18+R()*12,30+R()*20,0,0,7); g.fill(); } g.fillStyle='#a37b4a'; g.fillRect(0,h*0.8,w,h*0.2); }
    g.strokeStyle='#3a2c20'; g.lineWidth=10; g.strokeRect(0,0,w,h); }); _texCache.set(key,t); return t; }
GB.prototype.geo=function(src,x,y,z,sx,sy,sz,a){ const g=src.index?src.toNonIndexed():src; const P=g.attributes.position, N=g.attributes.normal; const c=Math.cos(a||0), s=Math.sin(a||0);
  for(let i=0;i<P.count;i+=3){ const v=[], n=[]; for(let k=0;k<3;k++){ const px=P.getX(i+k)*sx, py=P.getY(i+k)*sy, pz=P.getZ(i+k)*sz; v.push([x+px*c-pz*s,y+py,z+px*s+pz*c]); }
    const nx=N.getX(i), ny=N.getY(i), nz=N.getZ(i); const wn=[nx*c-nz*s,ny,nx*s+nz*c]; this.tri(v[0],v[1],v[2],wn,[0,0],[0,0],[0,0]); } };
const _cyl=new THREE.CylinderGeometry(0.5,0.5,1,12).translate(0,0.5,0), _sph=new THREE.SphereGeometry(0.5,10,8), _ico=new THREE.IcosahedronGeometry(0.5,1), _cone=new THREE.ConeGeometry(0.5,1,8).translate(0,0.5,0);

function interiorFloor(b){ let mx=-1e9; for(let x=b.x0;x<=b.x1;x+=1.5) for(let z=b.z0;z<=b.z1;z+=1.5){ if(inBld(b,x,z)) mx=Math.max(mx,W.terrain(x,z)); } for(const p of b.ring) mx=Math.max(mx,W.terrain(p[0],p[1])-0.3); return Math.max(b.floorY,mx+0.06); }
function occGrid(b,margin){ const cs=0.25, nx=Math.ceil((b.x1-b.x0)/cs)+1, nz=Math.ceil((b.z1-b.z0)/cs)+1; const d=new Float32Array(nx*nz).fill(-1);
  for(let j=0;j<nz;j++) for(let i=0;i<nx;i++){ const x=b.x0+i*cs, z=b.z0+j*cs; if(!inBld(b,x,z)) continue; d[j*nx+i]=nearestEdge(b,x,z)[0]; }
  return {cs,nx,nz,d,occ:new Uint8Array(nx*nz),margin,at(x,z){ const i=Math.round((x-b.x0)/cs), j=Math.round((z-b.z0)/cs); if(i<0||j<0||i>=nx||j>=nz) return -1; return d[j*nx+i]; },
    free(x,z){ const i=Math.round((x-b.x0)/cs), j=Math.round((z-b.z0)/cs); if(i<0||j<0||i>=nx||j>=nz) return false; const k=j*nx+i; return d[k]>=margin&&!this.occ[k]; },
    mark(x0,z0,x1,z1){ for(let j=Math.max(0,Math.floor((z0-b.z0)/cs));j<=Math.min(nz-1,Math.ceil((z1-b.z0)/cs));j++) for(let i=Math.max(0,Math.floor((x0-b.x0)/cs));i<=Math.min(nx-1,Math.ceil((x1-b.x0)/cs));i++) this.occ[j*nx+i]=1; } }; }

function enterVilla(b,px,pz){
  const th=themeFor(b); const e=nearestEdge(b,px,pz); const door={x:e[1],z:e[2],nx:e[3],nz:e[4]};
  const floor=interiorFloor(b); let ceil=Math.min(floor+2.85,(b.walkY||b.top)-0.1); if(ceil-floor<2.25) ceil=floor+2.25;
  const grp=new THREE.Group(); scene.add(grp);
  const PH=(c,o)=>new THREE.MeshPhongMaterial(Object.assign({color:Cc(c),shininess:6},o||{}));
  const mats={wood:PH(th.wood),fab:PH(th.fab),acc:PH(th.acc),metal:PH(th.metal,{shininess:40}),white:PH('#f3f1ec'),dark:PH('#25282b'),green:PH('#3f7a3a'),felt:PH('#2f7d4a'),gold:PH('#c9a24a',{shininess:60}),
    red:PH('#d6442a'),yellow:PH('#f2c230'),blue:PH('#2f6bd6'),rug:PH(th.rug),glow:new THREE.MeshBasicMaterial({color:Cc('#ffe2a8')}),fire:new THREE.MeshBasicMaterial({color:Cc('#ff8a2a')}),
    glass:new THREE.MeshBasicMaterial({color:Cc(TOD.night>0.5?'#18253c':'#e3f0fb')})};
  const G={}; for(const k in mats) G[k]=new GB(false);
  const plats=[];
  const solid=(cx,cz,a,sx,sz,top)=>{ plats.push(addPlat(cx,cz,a,sx,sz,floor+top,top+0.05)); };
  // floor and ceiling over the footprint (courtyards left open)
  const fl=new GB(true), ce=new GB(false), wl=new GB(true);
  const extI=b.ring, holes=b.holesO; const pts=extI.concat(...holes);
  const tris=THREE.ShapeUtils.triangulateShape(extI.map(p=>new THREE.Vector2(p[0],p[1])),holes.map(h=>h.map(p=>new THREE.Vector2(p[0],p[1]))));
  for(const t of tris){ const P=t.map(k=>pts[k]); if(!P[0]||!P[1]||!P[2]) continue;
    fl.tri([P[0][0],floor,P[0][1]],[P[1][0],floor,P[1][1]],[P[2][0],floor,P[2][1]],[0,1,0],[P[0][0]/2.2,P[0][1]/2.2],[P[1][0]/2.2,P[1][1]/2.2],[P[2][0]/2.2,P[2][1]/2.2]);
    ce.tri([P[0][0],ceil,P[0][1]],[P[1][0],ceil,P[1][1]],[P[2][0],ceil,P[2][1]],[0,-1,0]); }
  // walls seen from inside, with a skirting board; windows where the facade has them
  const wallsIn=(r)=>{ for(let i=0;i<r.length;i++){ const a=r[i], c=r[(i+1)%r.length]; const dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz); if(L<0.05) continue; const n=[-dz/L,0,dx/L];
    wl.quad([a[0],floor,a[1]],[c[0],floor,c[1]],[c[0],ceil,c[1]],[a[0],ceil,a[1]],n,[0,0],[L/2.5,0],[L/2.5,(ceil-floor)/2.5],[0,(ceil-floor)/2.5]);
    const ox=n[0]*0.012, oz=n[2]*0.012; G.dark.quad([a[0]+ox,floor,a[1]+oz],[c[0]+ox,floor,c[1]+oz],[c[0]+ox,floor+0.09,c[1]+oz],[a[0]+ox,floor+0.09,a[1]+oz],n); } };
  wallsIn(extI); holes.forEach(wallsIn);
  for(const pn of (b.panels||[])){ if(!pn.ty) continue; const ax=pn.p0[0], az=pn.p0[1], dx=pn.p1[0]-ax, dz=pn.p1[1]-az, pw=Math.hypot(dx,dz); if(pw<0.5) continue; const ux=dx/pw, uz=dz/pw, k=pw/3;
    const nin=[-pn.n[0],0,-pn.n[2]];
    const rect=(u0,u1,v0,v1,gb,off)=>{ v0=Math.max(v0,floor+0.02); v1=Math.min(v1,ceil-0.05); if(v1<=v0) return; const ox=nin[0]*off, oz=nin[2]*off;
      gb.quad([ax+ux*u0+ox,v0,az+uz*u0+oz],[ax+ux*u1+ox,v0,az+uz*u1+oz],[ax+ux*u1+ox,v1,az+uz*u1+oz],[ax+ux*u0+ox,v1,az+uz*u0+oz],nin); };
    const F0=b.floorY;
    if(pn.ty===1){ rect(0.32*k,2.68*k,F0,F0+2.6,G.dark,0.015); rect(0.37*k,1.47*k,F0+0.05,F0+2.55,G.glass,0.025); rect(1.53*k,2.63*k,F0+0.05,F0+2.55,G.glass,0.025); }
    else if(pn.ty===2){ rect(0.77*k,2.23*k,F0+0.92,F0+2.28,G.dark,0.015); rect(0.82*k,2.18*k,F0+0.97,F0+2.23,G.glass,0.025); }
    else { for(let q=0;q<5;q++){ const cu=(0.62+q*0.44)*k; rect(cu-0.1,cu+0.1,F0+2.0,F0+2.2,G.glass,0.02); } } }
  // the door you came in through
  { const ux=-door.nz, uz=door.nx, ox=-door.nx*0.03, oz=-door.nz*0.03, n=[-door.nx,0,-door.nz];
    G.wood.quad([door.x-ux*0.55+ox,floor,door.z-uz*0.55+oz],[door.x+ux*0.55+ox,floor,door.z+uz*0.55+oz],[door.x+ux*0.55+ox,floor+2.15,door.z+uz*0.55+oz],[door.x-ux*0.55+ox,floor+2.15,door.z-uz*0.55+oz],n);
    G.gold.box(door.x+ux*0.4-door.nx*0.08,floor+1.0,door.z+uz*0.4-door.nz*0.08,0.04,0.04,0.14,Math.atan2(uz,ux)); }
  // furniture
  const grid=occGrid(b,0.35); const cells=[]; for(let j=0;j<grid.nz;j++) for(let i=0;i<grid.nx;i++){ const d=grid.d[j*grid.nx+i]; if(d>=1.1) cells.push([b.x0+i*grid.cs,b.z0+j*grid.cs,d]); }
  grid.mark(door.x-1.2,door.z-1.2,door.x+1.2,door.z+1.2);
  const seeds=[]; if(cells.length){ cells.sort((p,q)=>q[2]-p[2]); seeds.push(cells[0]);
    for(let s=0;s<4&&seeds.length<4;s++){ let best=null,bd=0; for(const c of cells){ let md=1e9; for(const sd of seeds) md=Math.min(md,Math.hypot(c[0]-sd[0],c[1]-sd[1])); if(md>bd){ bd=md; best=c; } } if(best&&bd>4.5) seeds.push(best); else break; } }
  const R=rng(7+b.k);
  const wallAng=(x,z)=>{ const w=nearestEdge(b,x,z); return {a:Math.atan2(w[3],-w[4]),q:[w[1],w[2]],n:[w[3],w[4]],d:w[0]}; };
  function fits(cx,cz,a,w,d){ const c=Math.cos(a), s=Math.sin(a); for(const u of [-0.5,-0.25,0,0.25,0.5]) for(const v of [-0.5,0,0.5]){ const lx=u*w, lz=v*d; if(!grid.free(cx+lx*c-lz*s,cz+lx*s+lz*c)) return false; } return true; }
  function claim(cx,cz,a,w,d){ const c=Math.abs(Math.cos(a)), s=Math.abs(Math.sin(a)); const hx=(w*c+d*s)/2+0.2, hz=(w*s+d*c)/2+0.2; grid.mark(cx-hx,cz-hz,cx+hx,cz+hz); }
  function ctx(cx,cz,a){ const c=Math.cos(a), s=Math.sin(a); return { box(g,lx,y0,lz,sx,sy,sz){ G[g].box(cx+lx*c-lz*s,floor+y0,cz+lx*s+lz*c,sx,sy,sz,a); }, geo(g,src,lx,y0,lz,sx,sy,sz){ G[g].geo(src,cx+lx*c-lz*s,floor+y0,cz+lx*s+lz*c,sx,sy,sz,a); }, at(lx,lz){ return [cx+lx*c-lz*s,cz+lx*s+lz*c]; } }; }
  // place an item against the wall nearest to (x,z), front facing the room
  function againstWall(x,z,w,d,build){ for(let t=0;t<14;t++){ const jx=x+(t?(R()-0.5)*t*0.9:0), jz=z+(t?(R()-0.5)*t*0.9:0); const wa=wallAng(jx,jz); const cx=wa.q[0]-wa.n[0]*(d/2+0.38), cz=wa.q[1]-wa.n[1]*(d/2+0.38);
      if(fits(cx,cz,wa.a,w,d)){ claim(cx,cz,wa.a,w,d); build(ctx(cx,cz,wa.a),cx,cz,wa.a); return [cx,cz,wa.a]; } } return null; }
  function centered(x,z,w,d,build){ const wa=wallAng(x,z); for(let t=0;t<14;t++){ const a=wa.a+(t%2?Math.PI/2:0); const cx=x+(t>1?(R()-0.5)*t*0.7:0), cz=z+(t>1?(R()-0.5)*t*0.7:0);
      if(fits(cx,cz,a,w,d)){ claim(cx,cz,a,w,d); build(ctx(cx,cz,a),cx,cz,a); return [cx,cz,a]; } } return null; }
  const I={
    sofa(o,w){ o.box('fab',0,0,0,w,0.42,0.95); o.box('fab',0,0.42,-0.37,w,0.45,0.22); o.box('fab',-w/2+0.09,0,0,0.18,0.62,0.95); o.box('fab',w/2-0.09,0,0,0.18,0.62,0.95); o.box('acc',-w/4,0.42,-0.15,0.42,0.32,0.14); o.box('acc',w/4,0.42,-0.15,0.42,0.32,0.14); },
    coffee(o){ o.box('wood',0,0.36,0,1.1,0.06,0.6); for(const [x,z] of [[-0.48,-0.24],[0.48,-0.24],[-0.48,0.24],[0.48,0.24]]) o.box('metal',x,0,z,0.05,0.36,0.05); },
    rug(o,w,d){ o.box('rug',0,0,0,w,0.012,d); },
    tv(o){ o.box('wood',0,0,0,1.8,0.45,0.42); o.box('dark',0,0.62,-0.05,1.45,0.82,0.05); },
    dining(o){ o.box('wood',0,0.72,0,1.9,0.05,0.95); for(const [x,z] of [[-0.85,-0.38],[0.85,-0.38],[-0.85,0.38],[0.85,0.38]]) o.box('wood',x,0,z,0.07,0.72,0.07);
      for(const x of [-0.55,0.55]) for(const sd of [-1,1]){ o.box('fab',x,0.44,sd*0.78,0.44,0.05,0.44); o.box('wood',x,0,sd*0.78,0.4,0.44,0.4); o.box('fab',x,0.49,sd*0.98,0.44,0.5,0.05); } },
    pendant(o){ o.box('dark',0,ceil-floor-0.75,0,0.015,0.75,0.015); o.geo('glow',_cyl,0,ceil-floor-0.95,0,0.42,0.2,0.42); },
    kitchen(o,w){ o.box('white',0,0,0,w,0.88,0.62); o.box('dark',0,0.88,0,w,0.04,0.64); o.box('white',0,1.5,-0.13,w,0.7,0.36); o.box('metal',w/2+0.38,0,0,0.72,1.9,0.64); o.box('metal',-w/4,0.92,0,0.5,0.02,0.4); },
    island(o){ o.box('wood',0,0,0,2.0,0.88,0.9); o.box('dark',0,0.88,0,2.1,0.04,1.0); for(const x of [-0.6,0,0.6]){ o.box('metal',x,0,0.75,0.05,0.65,0.05); o.geo('fab',_cyl,x,0.65,0.75,0.38,0.06,0.38); } },
    bed(o,w){ o.box('wood',0,0,0,w,0.32,2.0); o.box('white',0,0.32,0.02,w-0.05,0.2,1.95); o.box('acc',0,0.52,0.35,w-0.02,0.07,1.25); o.box('white',-w/4,0.52,-0.75,0.6,0.13,0.34); o.box('white',w/4,0.52,-0.75,0.6,0.13,0.34);
      o.box('wood',0,0,-1.02,w+0.1,1.05,0.08); for(const sd of [-1,1]){ o.box('wood',sd*(w/2+0.3),0,-0.75,0.45,0.5,0.4); o.geo('glow',_cyl,sd*(w/2+0.3),0.5,-0.75,0.22,0.28,0.22); } },
    wardrobe(o){ o.box('wood',0,0,0,1.8,2.1,0.6); o.box('dark',0,0.9,0.31,0.02,0.4,0.02); },
    shelf(o){ o.box('wood',0,0,0,1.2,1.9,0.35); const cols=['red','yellow','blue','acc','fab','white']; for(let r=0;r<4;r++){ let x=-0.52; while(x<0.5){ const bw=0.04+R()*0.05; o.box(cols[(R()*cols.length)|0],x+bw/2,0.15+r*0.45,0.02,bw,0.26+R()*0.1,0.24); x+=bw+0.008; } } },
    plant(o,s){ s=s||1; o.geo('wood',_cyl,0,0,0,0.36*s,0.42*s,0.36*s); o.geo('green',_ico,0,0.42*s+0.38*s,0,0.75*s,0.95*s,0.75*s); },
    lamp(o){ o.box('metal',0,0,0,0.3,0.03,0.3); o.box('metal',0,0,0,0.035,1.55,0.035); o.geo('glow',_cone,0,1.42,0,0.42,0.32,0.42); },
    fireplace(o){ o.box('white',0,0,0,1.9,1.15,0.6); o.box('dark',0,0.12,0.28,1.0,0.68,0.06); o.box('fire',0,0.14,0.2,0.7,0.25,0.12); o.box('wood',0,0.12,0.18,0.8,0.08,0.1); o.box('white',0,1.15,-0.05,1.25,ceil-floor-1.15,0.5); },
    sculpture(o){ for(let k=0;k<5;k++) o.box(k%2?'acc':'white',0,0.4+k*0.28,0,0.3-k*0.03,0.28,0.3-k*0.03); o.box('dark',0,0,0,0.5,0.4,0.5); },
    ship(o){ o.box('wood',0,0,0,1.3,0.8,0.4); o.box('white',0,0.8,0,0.7,0.12,0.16); o.box('wood',0,0.92,0,0.02,0.45,0.02); },
    putting(o){ o.box('felt',0,0,0,4.6,0.02,1.2); o.geo('dark',_cyl,1.9,0.005,0,0.12,0.02,0.12); o.box('white',1.9,0,0,0.015,0.9,0.015); o.box('red',2.02,0.78,0,0.22,0.14,0.01); o.geo('white',_sph,-1.9,0.04,0.1,0.045,0.045,0.045); },
    golfbag(o){ o.geo('acc',_cyl,0,0,0,0.3,0.9,0.3); for(const [x,z] of [[0.05,0],[-0.05,0.04],[0,-0.05]]) o.box('metal',x,0.9,z,0.015,0.35,0.015); },
    trophies(o){ o.box('wood',0,0,0,1.4,1.0,0.4); for(let k=0;k<4;k++){ o.geo('gold',_cyl,-0.5+k*0.33,1.0,0,0.12,0.22+k*0.03,0.12); o.geo('gold',_sph,-0.5+k*0.33,1.25+k*0.03,0,0.16,0.12,0.16); } },
    bunk(o){ for(const y of [0,1.3]){ o.box('wood',0,y,0,0.95,0.25,2.0); o.box('white',0,y+0.25,0,0.9,0.16,1.95); o.box(y?'blue':'red',0,y+0.41,0.3,0.92,0.05,1.2); } for(const [x,z] of [[-0.45,-0.98],[0.45,-0.98],[-0.45,0.98],[0.45,0.98]]) o.box('wood',x,0,z,0.07,2.2,0.07); o.box('wood',0.5,0.3,0.6,0.05,1.3,0.05); },
    toys(o){ const cols=['red','yellow','blue','acc']; for(let k=0;k<9;k++) o.box(cols[k%4],(R()-0.5)*1.4,0,(R()-0.5)*1.0,0.18,0.18,0.18); o.geo('blue',_sph,0.5,0.15,0.4,0.3,0.3,0.3); },
    beanbag(o,c){ o.geo(c,_sph,0,0.28,0,0.9,0.55,0.9); },
    tent(o){ o.geo('yellow',_cone,0,0,0,1.5,1.5,1.5); },
    pool(o){ o.box('wood',0,0,0,2.55,0.78,1.45); o.box('felt',0,0.78,0,2.3,0.03,1.2); for(const [x,z] of [[-1.15,-0.6],[0,-0.62],[1.15,-0.6],[-1.15,0.6],[0,0.62],[1.15,0.6]]) o.geo('dark',_cyl,x,0.79,z,0.09,0.02,0.09);
      const bc=['red','yellow','blue','dark','white','acc']; for(let k=0;k<7;k++) o.geo(bc[k%bc.length],_sph,0.3+(k%3)*0.07,0.84,(Math.floor(k/3)-1)*0.07,0.06,0.06,0.06); o.box('wood',-0.3,0.82,0.2,1.3,0.025,0.025); },
    arcade(o){ o.box('dark',0,0,0,0.7,1.8,0.75); o.box('glow',0,1.15,0.3,0.55,0.42,0.18); o.box('red',0,0.9,0.4,0.6,0.08,0.2); },
    zentable(o){ o.box('wood',0,0.28,0,1.25,0.06,0.8); for(const [x,z] of [[-0.55,-0.33],[0.55,-0.33],[-0.55,0.33],[0.55,0.33]]) o.box('wood',x,0,z,0.07,0.28,0.07); for(const [x,z] of [[0,-0.75],[0,0.75],[-0.95,0],[0.95,0]]) o.box('fab',x,0,z,0.6,0.12,0.6); },
    bonsai(o){ o.box('acc',0,0,0,0.45,0.18,0.3); o.box('wood',0,0.18,0,0.05,0.25,0.05); o.geo('green',_ico,0.08,0.45,0,0.45,0.22,0.35); },
    paperlamp(o){ o.geo('glow',_cyl,0,0,0,0.38,0.75,0.38); },
    arm(o){ o.box('fab',0,0,0,0.85,0.42,0.85); o.box('fab',0,0.42,-0.33,0.85,0.42,0.2); o.box('fab',-0.36,0,0,0.14,0.6,0.85); o.box('fab',0.36,0,0,0.14,0.6,0.85); }
  };
  const S0=seeds[0], S1=seeds[1], S2=seeds[2], S3=seeds[3];
  const lights=[];
  // living area
  if(S0){ const r=againstWall(S0[0],S0[1],2.5,0.95,(o)=>I.sofa(o,2.5));
    if(r){ const [cx,cz,a]=r; const c=Math.cos(a), s=Math.sin(a); const fx=-s, fz=c; // front of the sofa
      const rx=cx+fx*1.35, rz=cz+fz*1.35; I.rug(ctx(rx,rz,a),2.8,2.0); if(fits(rx,rz,a,1.1,0.6)){ claim(rx,rz,a,1.1,0.6); I.coffee(ctx(rx,rz,a)); solid(rx,rz,a,1.1,0.6,0.42); }
      solid(cx,cz,a,2.5,0.95,0.85);
      const tx=cx+fx*3.2, tz=cz+fz*3.2; if(th.special==='fireplace'){ if(fits(tx,tz,a+Math.PI,1.9,0.6)){ claim(tx,tz,a+Math.PI,1.9,0.6); I.fireplace(ctx(tx,tz,a+Math.PI)); solid(tx,tz,a+Math.PI,1.9,0.6,1.15); } }
      else if(fits(tx,tz,a+Math.PI,1.8,0.42)){ claim(tx,tz,a+Math.PI,1.8,0.42); I.tv(ctx(tx,tz,a+Math.PI)); solid(tx,tz,a+Math.PI,1.8,0.42,0.45); }
      for(const sd of [-1,1]){ const ax=cx+fx*1.4+c*sd*1.9, az=cz+fz*1.4+s*sd*1.9; if(R()<0.6&&fits(ax,az,a+sd*Math.PI/2,0.85,0.85)){ claim(ax,az,a+sd*Math.PI/2,0.85,0.85); I.arm(ctx(ax,az,a+sd*Math.PI/2)); solid(ax,az,a,0.85,0.85,0.85); } }
      lights.push([rx,rz]); } }
  // dining + kitchen
  if(S1){ const r=centered(S1[0],S1[1],3.0,2.3,(o)=>{ I.dining(o); I.pendant(o); }); if(r){ solid(r[0],r[1],r[2],1.9,0.95,0.77); lights.push([r[0],r[1]]); }
    const k=againstWall(S1[0],S1[1],3.3,0.66,(o)=>I.kitchen(o,3.2)); if(k) solid(k[0],k[1],k[2],4.0,0.66,0.92);
    if(b.area>200&&R()<0.6){ const isl=centered(S1[0]+2.2,S1[1]+2.2,2.2,1.6,(o)=>I.island(o)); if(isl) solid(isl[0],isl[1],isl[2],2.0,0.9,0.92); } }
  // bedroom (bunk beds in the family theme)
  if(S2){ if(th.special==='kids'){ const r=againstWall(S2[0],S2[1],1.1,2.1,(o)=>I.bunk(o)); if(r) solid(r[0],r[1],r[2],0.95,2.0,0.4); const t2=centered(S2[0]+1.6,S2[1],1.6,1.6,(o)=>I.toys(o)); }
    const r=againstWall(S2[0]+(th.special==='kids'?2.5:0),S2[1],2.6,2.15,(o)=>I.bed(o,1.6)); if(r){ solid(r[0],r[1],r[2],1.6,2.0,0.55); lights.push([r[0],r[1]]); }
    againstWall(S2[0],S2[1]+2.5,1.8,0.6,(o)=>I.wardrobe(o)); }
  // the theme's own corner
  const SP=S3||S2||S1||S0;
  if(SP){ const x=SP[0], z=SP[1];
    if(th.special==='putting'){ const r=centered(x,z,4.7,1.3,(o)=>I.putting(o)); againstWall(x,z,0.4,0.4,(o)=>I.golfbag(o)); againstWall(x+2,z,1.4,0.4,(o)=>I.trophies(o)); }
    else if(th.special==='games'){ const r=centered(x,z,2.6,1.5,(o)=>I.pool(o)); if(r) solid(r[0],r[1],r[2],2.55,1.45,0.81); const a=againstWall(x,z,0.75,0.8,(o)=>I.arcade(o)); if(a) solid(a[0],a[1],a[2],0.7,0.75,1.8); }
    else if(th.special==='zen'){ centered(x,z,2.4,2.4,(o)=>I.zentable(o)); againstWall(x,z,0.5,0.35,(o)=>I.bonsai(o)); for(let k=0;k<3;k++){ const q=centered(x+(R()-0.5)*5,z+(R()-0.5)*5,0.45,0.45,(o)=>I.paperlamp(o)); } }
    else if(th.special==='kids'){ centered(x,z,1.6,1.6,(o)=>I.tent(o)); for(const c of ['red','blue','yellow']) centered(x+(R()-0.5)*4,z+(R()-0.5)*4,1.0,1.0,(o)=>I.beanbag(o,c)); }
    else if(th.special==='sea'){ againstWall(x,z,1.3,0.4,(o)=>I.ship(o)); centered(x,z,1.0,1.0,(o)=>I.arm(o)); }
    else if(th.special==='art'){ centered(x,z,0.6,0.6,(o)=>I.sculpture(o)); againstWall(x,z,0.4,0.4,(o)=>I.lamp(o)); }
    else if(th.special==='plants'){ for(let k=0;k<6;k++) centered(x+(R()-0.5)*6,z+(R()-0.5)*6,0.6,0.6,(o)=>I.plant(o,0.9+R()*0.5)); }
    else if(th.special==='fireplace'){ againstWall(x,z,1.2,0.35,(o)=>I.shelf(o)); } }
  // bookshelves, plants and lamps along the walls, paintings on them
  const nS=2+Math.round(b.area/120), nP=3+Math.round(b.area/60), nL=1+Math.round(b.area/150);
  for(let k=0;k<nS;k++){ const c=cells[(R()*cells.length)|0]; if(c) againstWall(c[0],c[1],1.2,0.35,(o)=>I.shelf(o)); }
  for(let k=0;k<nP;k++){ const c=cells[(R()*cells.length)|0]; if(c) againstWall(c[0],c[1],0.6,0.6,(o)=>I.plant(o,0.8+R()*0.5)); }
  for(let k=0;k<nL;k++){ const c=cells[(R()*cells.length)|0]; if(c) againstWall(c[0],c[1],0.4,0.4,(o)=>I.lamp(o)); }
  for(let k=0;k<2;k++){ const c=cells[(R()*cells.length)|0]; if(c&&R()<0.7) centered(c[0],c[1],1.0,1.0,(o)=>I.arm(o)); }
  const paints=[]; const edges=[]; for(const r of [extI,...holes]) for(let i=0;i<r.length;i++){ const a=r[i], c=r[(i+1)%r.length]; const L=Math.hypot(c[0]-a[0],c[1]-a[1]); if(L>2.4) edges.push([a,c,L]); }
  for(let k=0;k<Math.min(6,edges.length);k++){ const [a,c,L]=edges[(R()*edges.length)|0]; const t=0.25+R()*0.5; const x=a[0]+(c[0]-a[0])*t, z=a[1]+(c[1]-a[1])*t; const ux=(c[0]-a[0])/L, uz=(c[1]-a[1])/L; const nx=-uz, nz=ux;
    let clash=false; for(const pn of (b.panels||[])){ if(pn.ty&&Math.hypot((pn.p0[0]+pn.p1[0])/2-x,(pn.p0[1]+pn.p1[1])/2-z)<1.8) clash=true; } if(clash||Math.hypot(x-door.x,z-door.z)<1.5) continue;
    const pw=0.9+R()*0.5, ph=pw*0.72, y=floor+1.65; const m=new THREE.Mesh(new THREE.PlaneGeometry(pw,ph),new THREE.MeshLambertMaterial({map:paintingTex((R()*8)|0)}));
    m.position.set(x+nx*0.03,y,z+nz*0.03); m.rotation.y=Math.atan2(nx,nz); grp.add(m); paints.push(m); }
  // build
  const flm=new THREE.MeshPhongMaterial({map:floorTex(th.pat,th.floor),shininess:th.pat==='plain'||th.pat==='terrazzo'?30:10});
  const wlm=th.brick?new THREE.MeshPhongMaterial({map:brickTex(),shininess:4}):new THREE.MeshPhongMaterial({color:Cc(th.wall),shininess:4});
  for(const [g,m] of [[fl,flm],[wl,wlm],[ce,new THREE.MeshPhongMaterial({color:Cc('#f6f4ef'),shininess:2})]]){ const mm=g.mesh(m,false); if(mm){ scene.remove(mm); grp.add(mm); mm.receiveShadow=false; } }
  for(const k in G){ const mm=G[k].mesh(mats[k],false); if(mm){ scene.remove(mm); grp.add(mm); mm.receiveShadow=false; } }
  // lights near the ceiling
  intLights.forEach((l,i)=>{ const p=lights[i]||seeds[i]; l.userData.on=!!p; if(!p){ l.intensity=0; return; } l.position.set(p[0],ceil-0.35,p[1]); });
  S.interior={b,th,grp,plats,floor,ceil,door,mats}; interiorLight();
}
function exitVilla(){ const I=S.interior; if(!I) return;
  scene.remove(I.grp); I.grp.traverse(o=>{ if(o.isMesh){ o.geometry.dispose(); o.material.dispose(); } });
  for(const p of I.plats) removePlat(p); intLights.forEach(l=>{ l.intensity=0; l.userData.on=false; });
  const d=I.door; S.interior=null; updateTOD(); P.x=d.x+d.nx*1.5; P.z=d.z+d.nz*1.5; P.y=groundAt(P.x,P.z,999); P.vx=P.vy=P.vz=0; P.yaw=Math.atan2(d.nz,d.nx); camS.yaw=P.yaw; camS.dist=5.4; }
function removePlat(p){ const i=PLAT.indexOf(p); if(i>=0) PLAT.splice(i,1); for(const [k,arr] of platGrid){ const j=arr.indexOf(p); if(j>=0) arr.splice(j,1); } }
function villaNear(x,z){ let best=null,bd=2.2; for(const b of bldsNear(x,z)){ if(b.kind!=='villa'||!b.ring) continue; if(inBld(b,x,z)) continue; const e=nearestEdge(b,x,z); if(e[0]<bd){ bd=e[0]; best=b; } } return best; }
function goInside(b){ blip('door'); fadeTo(()=>{ enterVilla(b,P.x,P.z); const I=S.interior, d=I.door; P.x=d.x-d.nx*1.3; P.z=d.z-d.nz*1.3; P.y=I.floor; P.vx=P.vy=P.vz=0; P.yaw=Math.atan2(-d.nz,-d.nx); camS.yaw=P.yaw; camS.pitch=0.22;
  tip('Villa de estilo '+I.th.n.toLowerCase()+' · pulsa Salir para volver al jardín',4200); }); }
function goOutside(){ blip('door'); fadeTo(()=>exitVilla()); }
// a golden ball waits in the living room of one villa in the south (its beam shows through the roof)
function insideGoldSpot(){ let best=null; for(const b of BLD){ if(b.kind!=='villa'||b.area<180) continue; if(b.c[1]<560) continue; if(!best||b.c[0]>best.c[0]) best=b; } if(!best) return null;
  const fl=interiorFloor(best); let bc=null; for(let x=best.x0;x<=best.x1;x+=0.5) for(let z=best.z0;z<=best.z1;z+=0.5){ if(!inBld(best,x,z)) continue; const d=nearestEdge(best,x,z)[0]; if(!bc||d>bc[2]) bc=[x,z,d]; }
  return bc?{x:bc[0],y:fl+0.9,z:bc[1],b:best}:null; }
