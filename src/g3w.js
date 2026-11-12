
/* ================= karts: a race in buggies, alone against the machine or with the friends of the room ================= */
// Console-style driving: hop and drift (hold Jump while turning) with a three-level mini-turbo, ramps with a trick in the air,
// coins that raise the top speed, shortcuts across the corners, three laps and a podium with confetti.
// The circuit is built from consecutive holes of the course you play (tee → green → next tee … back to the first tee),
// chosen so that it closes on itself, measures about 1.6 km and never crosses water. Gates mark it; the next one has a yellow column.
const KART={on:false,mode:'race',x:{md:'race',rv:0,it:1,bs:1,cu:1},inv:0,gp:null,myB:null,shield:0,gold:0,slow:0,sandT:0,itemN:0,bal:3,hits:0,C:null,cir:'campo',laps:3,coins:0,got:0,h:0,vy:0,air:false,ramp:false,trick:0,trickT:0,tricks:0,dr:null,drifts:0,cutT:0,onCut:false,offRoad:false,pod:null,podT:0,fx:null,conf:null,coinsM:[],crash:true,nb:3,go:0,lock:true,lap:0,cp:1,s:0,idx:0,t0:0,lapT0:0,bestLap:0,item:0,boost:0,padCd:0,spin:0,spinD:1,done:false,fin:0,
  bots:[],balls:[],ents:[],gates:[],pads:[],boxes:[],puddles:[],rid:'',host:'',musPrev:null,hudT:0,beam:null,inPud:false,ids:null};
const KART_BOTS=[['Pepa',1],['Lolo',2],['Nico',3],['Maru',4],['Tito',5],['Cuca',0],['Rafa',2]];
function kartFmt(ms){ if(!(ms>0)) return '–'; const t=ms/1000, m=Math.floor(t/60), s=t-m*60; return m+':'+(s<10?'0':'')+s.toFixed(1); }
function kartCrosses(x0,z0,x1,z1){ const L=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.ceil(L/5)); let w=0;
  for(let k=0;k<=n;k++){ const x=x0+(x1-x0)*k/n, z=z0+(z1-z0)*k/n; if(W.terrain(x,z)<W.waterLevel(x,z)+0.15) w+=1;
    const tr=treeGrid.get(Math.floor(x/20)+','+Math.floor(z/20)); if(tr) for(const t of tr) if(Math.hypot(x-t.x,z-t.z)<t.tr+2.5){ w+=0.08; break; } } return w; }
// pick the loop of consecutive holes: closes near its start, ~1.6 km, no water on the way
function kartPickHoles(ci){ const cc=ci==null?S.course:ci, pk=WP.key+':'+cc; if(KART_PICK[pk]) return KART_PICK[pk]; const hs=(W.COURSES[cc]||W.COURSES[0]).holes; let best=null;
  for(let a=0;a<hs.length;a++) for(let n=2;n<=6;n++){ const ids=[]; for(let k=0;k<n;k++) ids.push(hs[(a+k)%hs.length]); if(ids.some(i=>!W.HOLES[i])) continue;
    const pts=kartRaw(ids); let L=0, wet=0; for(let k=0;k<pts.length-1;k++){ L+=Math.hypot(pts[k+1][0]-pts[k][0],pts[k+1][1]-pts[k][1]); wet+=kartCrosses(pts[k][0],pts[k][1],pts[k+1][0],pts[k+1][1]); }
    const H0=W.HOLES[ids[0]], Hn=W.HOLES[ids[n-1]]; const close=Math.hypot(Hn.gx-H0.P[0][0],Hn.gz-H0.P[0][1]);
    const sc=wet*400+close*2.5+Math.abs(L-1100)*0.5; if(!best||sc<best.sc) best={sc,ids}; }
  return KART_PICK[pk]=best?best.ids:hs.slice(0,3); }
function kartRaw(ids){ const pts=[]; for(const i of ids) for(const p of W.HOLES[i].P) pts.push([p[0],p[1]]); return pts; }
// smooth the closed polyline (Chaikin) and resample it every 4 m
var KART_CACHE={};
function kartBuild(ids,k,rev,nm){ const key=WP.key+'_kart_'+(k?k.id:ids.join('-'))+(rev?'_r':''); if(KART_CACHE[key]) return KART_CACHE[key]; let pts=k?k.pts.map(p=>[p[0],p[1]]):kartRaw(ids);
  if(rev){ pts.reverse(); pts.unshift(pts.pop()); } /* the other way round, from the same start */
  for(let it=0;it<3;it++){ const o=[]; for(let k=0;k<pts.length;k++){ const a=pts[k], b=pts[(k+1)%pts.length]; o.push([a[0]*0.75+b[0]*0.25,a[1]*0.75+b[1]*0.25],[a[0]*0.25+b[0]*0.75,a[1]*0.25+b[1]*0.75]); } pts=o; }
  const S4=[], st=4; let acc=0; S4.push([pts[0][0],pts[0][1],0]);
  for(let k=0;k<pts.length;k++){ const a=pts[k], b=pts[(k+1)%pts.length]; const L=Math.hypot(b[0]-a[0],b[1]-a[1]); let t=st-acc;
    while(t<=L){ S4.push([a[0]+(b[0]-a[0])*t/L,a[1]+(b[1]-a[1])*t/L,0]); t+=st; } acc=L-(t-st); }
  for(let k=0;k<S4.length;k++){ S4[k][2]=k*st; }
  const L=S4.length*st; const names=ids.map(i=>W.HOLES[i].n);
  const C={ids,pts:S4,L,st,names,key,rev:!!rev,id:k?k.id:'campo',n:(nm||(k?k.n:(WP.kartCampo||'Caminos del campo')))+(rev?' (inverso)':'')}; C.cuts=kartCuts(C);
  C.ramps=[0.24,0.57].map(f=>{ const q=kartAt(C,f*L); return {x:q.x,z:q.z,yaw:q.yaw}; }).concat(C.cuts.map(c=>({x:c.a[0]+(c.b[0]-c.a[0])*0.4,z:c.a[1]+(c.b[1]-c.a[1])*0.4,yaw:c.yaw,cut:true})));
  // water zones (fords): two stretches of 16 m where the track is flooded
  C.fords=[0.455,0.795].map(f=>{ const i0=Math.round(f*S4.length); return {i0,i1:i0+4}; });
  KART_CACHE[key]=C; return C; }
// the circuits of this world: the loop of holes of the course you play, plus the ones drawn by hand in the world file (WP.karts)
function kartCircuits(){ const out=[], base=WP.kartCampo||'Caminos del campo';
  if(W.COURSES.length>1) W.COURSES.forEach((c,i)=>{ out.push({id:i===S.course?'campo':'c'+i,n:base+' · '+c.name,txt:'Por las calles de los hoyos '+kartPickHoles(i).map(h=>W.HOLES[h].n).join(', ')+' de '+c.name+': de cada tee a su green y vuelta al primer tee.'}); });
  else out.push({id:'campo',n:base,txt:'Por las calles de los hoyos '+kartPickHoles().map(i=>W.HOLES[i].n).join(', ')+': de cada tee a su green y vuelta al primer tee.'});
  return out.concat((WP.karts||[]).map(k=>({id:k.id,n:k.n,txt:k.txt}))); }
function kartCirIds(id){ const m=/^c(\d)$/.exec(id); return id==='campo'?kartPickHoles():m&&W.COURSES[+m[1]]?kartPickHoles(+m[1]):[]; }
function kartCirBuild(id,ids,rev){ const k=(WP.karts||[]).find(k=>k.id===id); if(k) return kartBuild([],k,rev); const ii=ids&&ids.length?ids:kartCirIds(id).length?kartCirIds(id):kartPickHoles(); let nm=null;
  if(W.COURSES.length>1){ const ci=W.COURSES.findIndex(c=>c.holes.includes(ii[0])); if(ci>=0) nm=(WP.kartCampo||'Circuito')+' · '+W.COURSES[ci].name; } return kartBuild(ii,null,rev,nm); }
// shortcuts: straight lines of dry, open ground that cut a bend (at most two, the ones that save most)
function kartChordOK(x0,z0,x1,z1){ const L=Math.hypot(x1-x0,z1-z0), n=Math.ceil(L/3);
  for(let k=0;k<=n;k++){ const x=x0+(x1-x0)*k/n, z=z0+(z1-z0)*k/n; if(W.terrain(x,z)<W.waterLevel(x,z)+0.3||W.poolAt(x,z)||bldAt(x,z,2.2)) return false;
    for(let gx=-1;gx<=1;gx++) for(let gz=-1;gz<=1;gz++){ const tr=treeGrid.get((Math.floor(x/20)+gx)+','+(Math.floor(z/20)+gz)); if(tr) for(const t of tr) if(Math.hypot(x-t.x,z-t.z)<t.tr+1.8) return false; } } return true; }
function kartCuts(C){ const Q=C.pts, n=Q.length, cand=[];
  for(let i=10;i<n-14;i+=2) for(let len=14;len<=56&&i+len<n-4;len+=2){ const a=Q[i], b=Q[i+len], d=Math.hypot(b[0]-a[0],b[1]-a[1]), along=len*C.st; if(d<22||d>along*0.64) continue; cand.push({i,j:i+len,d,save:along-d}); }
  cand.sort((a,b)=>b.save-a.save); const out=[];
  for(const c of cand){ if(out.length>=2) break; if(out.some(o=>c.i<o.j+25&&c.j>o.i-25)) continue; const a=Q[c.i], b=Q[c.j]; if(!kartChordOK(a[0],a[1],b[0],b[1])) continue; out.push({i:c.i,j:c.j,a,b,d:c.d,save:c.save,yaw:Math.atan2(b[1]-a[1],b[0]-a[0])}); }
  return out; }
function kartSegD(x,z,a,b){ const dx=b[0]-a[0], dz=b[1]-a[1], t=clamp(((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1),0,1); return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t); }
function kartAt(C,s){ s=((s%C.L)+C.L)%C.L; const f=s/C.st, i=Math.floor(f)%C.pts.length, j=(i+1)%C.pts.length, u=f-Math.floor(f); const a=C.pts[i], b=C.pts[j];
  const x=a[0]+(b[0]-a[0])*u, z=a[1]+(b[1]-a[1])*u, yaw=Math.atan2(b[1]-a[1],b[0]-a[0]); return {x,z,yaw}; }
// track position s of (x, z), searching near the last index so the projection stays continuous
function kartProj(C,x,z,idx,fw){ const n=C.pts.length; let bi=idx, bd=1e18; for(let k=-40;k<=(fw||40);k++){ const i=((idx+k)%n+n)%n, p=C.pts[i]; const d=(p[0]-x)*(p[0]-x)+(p[1]-z)*(p[1]-z); if(d<bd){ bd=d; bi=i; } } return bi; }

/* ---- the props on the track ---- */
function kartTex(draw,w,h){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; return t; }
let KART_M=null;
function kartMats(){ if(KART_M) return KART_M;
  const checker=kartTex((g,w,h)=>{ for(let i=0;i<16;i++) for(let j=0;j<2;j++){ g.fillStyle=(i+j)%2?'#16231b':'#ffffff'; g.fillRect(i*w/16,j*h/2,w/16,h/2); } },256,32);
  const chev=kartTex((g,w,h)=>{ g.fillStyle='#f2c230'; g.fillRect(0,0,w,h); g.fillStyle='#d6442a'; for(let k=0;k<3;k++){ const y=h*0.18+k*h*0.27; g.beginPath(); g.moveTo(w*0.1,y+h*0.2); g.lineTo(w*0.5,y); g.lineTo(w*0.9,y+h*0.2); g.lineTo(w*0.9,y+h*0.3); g.lineTo(w*0.5,y+h*0.1); g.lineTo(w*0.1,y+h*0.3); g.fill(); } },64,96);
  const box=kartTex((g,w,h)=>{ g.fillStyle='#f2c230'; g.fillRect(0,0,w,h); g.strokeStyle='#fff'; g.lineWidth=6; g.strokeRect(4,4,w-8,h-8); g.fillStyle='#fff'; g.font='bold 44px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('?',w/2,h/2+2); },64,64);
  KART_M={pole:new THREE.MeshLambertMaterial({color:Cc('#d6442a')}),ban:new THREE.MeshLambertMaterial({color:Cc('#ffffff')}),next:new THREE.MeshLambertMaterial({color:Cc('#2f9e5a'),emissive:Cc('#103a20')}),
    start:new THREE.MeshLambertMaterial({map:checker}),pad:new THREE.MeshBasicMaterial({map:chev,transparent:true,opacity:0.95,polygonOffset:true,polygonOffsetFactor:-2}),
    box:new THREE.MeshLambertMaterial({map:box,transparent:true,opacity:0.92,emissive:Cc('#3a2a00')}),pud:new THREE.MeshBasicMaterial({color:Cc('#3f7fa0'),transparent:true,opacity:0.7,polygonOffset:true,polygonOffsetFactor:-2,depthWrite:false}),
    ball:new THREE.MeshLambertMaterial({color:Cc('#ffffff'),emissive:Cc('#444444')}),sand:new THREE.MeshLambertMaterial({color:Cc('#d8c08a')}),ford:new THREE.MeshBasicMaterial({color:Cc('#4aa3d8'),transparent:true,opacity:0.62,polygonOffset:true,polygonOffsetFactor:-3,depthWrite:false}),coin:new THREE.MeshLambertMaterial({color:Cc('#f2c230'),emissive:Cc('#6a4a00')}),cone:new THREE.MeshLambertMaterial({color:Cc('#f08a24')}),dirt:new THREE.MeshBasicMaterial({color:Cc('#b98a4e'),transparent:true,opacity:0.6,polygonOffset:true,polygonOffsetFactor:-2,depthWrite:false}),
    ramp:new THREE.MeshLambertMaterial({map:chev,side:THREE.DoubleSide}),sign:new THREE.MeshBasicMaterial({map:kartTex((g,w,h)=>{ g.fillStyle='#2f9e5a'; g.fillRect(0,0,w,h); g.strokeStyle='#fff'; g.lineWidth=8; g.strokeRect(6,6,w-12,h-12); g.fillStyle='#fff'; g.font='bold 58px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText('ATAJO',w/2,h/2+3); },256,96),side:THREE.DoubleSide}),
    pod:[new THREE.MeshLambertMaterial({color:Cc('#e8b923')}),new THREE.MeshLambertMaterial({color:Cc('#b9c0c7')}),new THREE.MeshLambertMaterial({color:Cc('#c07a3e')})],coinG:new THREE.CylinderGeometry(0.5,0.5,0.1,14),beam:new THREE.MeshBasicMaterial({color:Cc('#f2c230'),transparent:true,opacity:0.32,depthWrite:false}),
    poleG:new THREE.CylinderGeometry(0.16,0.16,4.2,8),banG:new THREE.BoxGeometry(0.12,0.9,15),padG:new THREE.PlaneGeometry(3.6,5.4),boxG:new THREE.BoxGeometry(1.1,1.1,1.1),pudG:new THREE.CircleGeometry(3,24),ballG:new THREE.SphereGeometry(0.4,14,10)};
  return KART_M; }
function kartAdd(o){ scene.add(o); KART.ents.push(o); return o; }
function kartProps(){ if(KART.mode==='bat') return kbArenaProps(); const C=KART.C, M=kartMats(); const T0=(x,z)=>terrainAt(x,z);
  const NG=Math.max(6,Math.round(C.L/110)); KART.gates=[];
  for(let k=0;k<NG;k++){ const s=k*C.L/NG, q=kartAt(C,s), g=new THREE.Group(); const c=Math.cos(q.yaw), sn=Math.sin(q.yaw);
    for(const sd of [-7.5,7.5]){ const p=new THREE.Mesh(M.poleG,M.pole); const x=q.x-sn*sd, z=q.z+c*sd; p.position.set(x,T0(x,z)+2.1,z); g.add(p); }
    const b=new THREE.Mesh(M.banG,k===0?M.start:M.ban); b.position.set(q.x,T0(q.x,q.z)+3.9,q.z); b.rotation.y=-q.yaw; g.add(b); kartAdd(g); KART.gates.push({s,x:q.x,z:q.z,b,start:k===0}); }
  KART.pads=[0.3,0.72].map(f=>{ const q=kartAt(C,f*C.L), m=new THREE.Mesh(M.padG,M.pad); m.rotation.order='YXZ'; m.rotation.set(-Math.PI/2,0,0); m.rotation.y=-q.yaw-Math.PI/2; m.position.set(q.x,T0(q.x,q.z)+0.12,q.z); kartAdd(m); return {x:q.x,z:q.z}; });
  KART.boxes=[]; if(KART.x.it&&KART.mode!=='tt') for(const f of [0.16,0.5,0.84]){ const q=kartAt(C,f*C.L), c=Math.cos(q.yaw), sn=Math.sin(q.yaw); for(const sd of [-3.2,0,3.2]){ const x=q.x-sn*sd, z=q.z+c*sd; const m=new THREE.Mesh(M.boxG,M.box); m.position.set(x,T0(x,z)+1.2,z); kartAdd(m); KART.boxes.push({x,z,m,t:0}); } }
  KART.puddles=[0.4,0.62,0.92].map((f,k)=>{ const q=kartAt(C,f*C.L), c=Math.cos(q.yaw), sn=Math.sin(q.yaw), sd=(k-1)*2.5; const x=q.x-sn*sd, z=q.z+c*sd; const m=new THREE.Mesh(M.pudG,M.pud); m.rotation.x=-Math.PI/2; m.position.set(x,T0(x,z)+0.1,z); kartAdd(m); return {x,z}; });
  KART.beam=kartAdd(new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.7,45,12,1,true),M.beam));
  const dry=(x,z)=>W.terrain(x,z)>W.waterLevel(x,z)+0.2&&!W.poolAt(x,z)&&!bldAt(x,z,0.8);
  // cones on both edges of the track, every 20 m
  { const sp=[]; for(let i=0;i<C.pts.length;i+=5){ const q=kartAt(C,i*C.st), c=Math.cos(q.yaw), sn=Math.sin(q.yaw); for(const sd of [-9,9]){ const x=q.x-sn*sd, z=q.z+c*sd; if(dry(x,z)) sp.push([x,z]); } }
    const im=new THREE.InstancedMesh(new THREE.ConeGeometry(0.3,0.8,8),M.cone,sp.length), o=new THREE.Object3D(); sp.forEach((p,k)=>{ o.position.set(p[0],T0(p[0],p[1])+0.4,p[1]); o.updateMatrix(); im.setMatrixAt(k,o.matrix); }); im.frustumCulled=false; kartAdd(im); }
  // ramps: a wedge 6 m wide and 1.2 m high, arrows pointing up the slope
  { const g=new THREE.BufferGeometry(), A=[-2.5,0,-3],B=[-2.5,0,3],Cq=[2.5,0,-3],D=[2.5,0,3],E=[2.5,1.2,-3],F=[2.5,1.2,3];
    g.setAttribute('position',new THREE.BufferAttribute(new Float32Array([].concat(A,B,F,A,F,E,Cq,E,F,Cq,F,D,A,E,Cq,B,D,F)),3));
    g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array([0,0,1,0,1,1, 0,0,1,1,0,1, 0,0,0,0.1,1,0.1, 0,0,1,0.1,1,0, 0,0,0,0.1,0.1,0, 0,0,0.1,0,0,0.1]),2)); g.computeVertexNormals();
    for(const r of C.ramps){ const m=new THREE.Mesh(g,M.ramp); m.position.set(r.x,T0(r.x,r.z)+0.03,r.z); m.rotation.y=-r.yaw; kartAdd(m); } }
  // shortcuts: a strip of bare earth and a green sign at the way in
  for(const ct of C.cuts){ const n=Math.max(2,Math.round(ct.d/4)), im=new THREE.InstancedMesh(new THREE.PlaneGeometry(4.2,4.4),M.dirt,n+1), o=new THREE.Object3D(); o.rotation.order='YXZ';
    for(let k=0;k<=n;k++){ const x=ct.a[0]+(ct.b[0]-ct.a[0])*k/n, z=ct.a[1]+(ct.b[1]-ct.a[1])*k/n; o.position.set(x,T0(x,z)+0.14,z); o.rotation.set(-Math.PI/2,0,0); o.rotation.y=-ct.yaw; o.updateMatrix(); im.setMatrixAt(k,o.matrix); } im.frustumCulled=false; kartAdd(im);
    const c=Math.cos(ct.yaw), sn=Math.sin(ct.yaw), sx=ct.a[0]+c*7-sn*3.6, sz=ct.a[1]+sn*7+c*3.6, sg=new THREE.Group(), pl=new THREE.Mesh(M.poleG,M.pole), bd=new THREE.Mesh(new THREE.PlaneGeometry(3,1.1),M.sign);
    pl.position.y=2.1; bd.position.y=3.6; bd.rotation.y=Math.atan2(-c,-sn); sg.add(pl); sg.add(bd); sg.position.set(sx,T0(sx,sz),sz); kartAdd(sg); }
  // water zones: the track flooded from edge to edge
  for(const f of C.fords){ const n=f.i1-f.i0+1, im=new THREE.InstancedMesh(new THREE.PlaneGeometry(4.3,17.5),M.ford,n), o=new THREE.Object3D(); o.rotation.order='YXZ';
    for(let k=0;k<n;k++){ const q=kartAt(C,(f.i0+k)*C.st); o.position.set(q.x,T0(q.x,q.z)+0.17,q.z); o.rotation.set(-Math.PI/2,0,0); o.rotation.y=-q.yaw; o.updateMatrix(); im.setMatrixAt(k,o.matrix); } im.frustumCulled=false; kartAdd(im); }
  // coins: rows of three along the track, and three more on each shortcut
  KART.coinsM=[]; const coin=(x,z)=>{ if(!dry(x,z)) return; const m=new THREE.Mesh(M.coinG,M.coin); m.rotation.order='YXZ'; m.rotation.x=Math.PI/2; m.position.set(x,T0(x,z)+1,z); kartAdd(m); KART.coinsM.push({x,z,m,t:0}); };
  [0.05,0.11,0.2,0.34,0.45,0.53,0.66,0.77,0.88,0.96].forEach((f,k)=>{ const sd=[-3,0,3][k%3]; for(let j=-1;j<=1;j++){ const q=kartAt(C,f*C.L+j*3.6); coin(q.x-Math.sin(q.yaw)*sd,q.z+Math.cos(q.yaw)*sd); } });
  for(const ct of C.cuts) for(const u of [0.66,0.76,0.86]) coin(ct.a[0]+(ct.b[0]-ct.a[0])*u,ct.a[1]+(ct.b[1]-ct.a[1])*u);
  KART.fx=kartFx(120,0.24,9); KART.conf=kartFx(280,0.34,3.5); }
// small particle clouds: sparks of the drift, flame of the turbo and confetti
function kartFx(n,size,g){ const geo=new THREE.BufferGeometry(), pos=new Float32Array(n*3).fill(-9999), col=new Float32Array(n*3); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  const m=new THREE.Points(geo,new THREE.PointsMaterial({size,vertexColors:true,transparent:true,depthWrite:false})); m.frustumCulled=false; kartAdd(m); return {m,n,pos,col,v:new Float32Array(n*3),life:new Float32Array(n),k:0,g}; }
function kartFxEmit(F,x,y,z,vx,vy,vz,life,c){ if(!F) return; const k=F.k, o=k*3; F.k=(k+1)%F.n; F.pos[o]=x; F.pos[o+1]=y; F.pos[o+2]=z; F.v[o]=vx; F.v[o+1]=vy; F.v[o+2]=vz; F.life[k]=life; F.col[o]=c.r; F.col[o+1]=c.g; F.col[o+2]=c.b; }
function kartFxStep(F,dt){ if(!F) return; for(let k=0;k<F.n;k++){ if(F.life[k]<=0) continue; const o=k*3; F.life[k]-=dt; if(F.life[k]<=0){ F.pos[o+1]=-9999; continue; } F.v[o+1]-=F.g*dt; F.pos[o]+=F.v[o]*dt; F.pos[o+1]+=F.v[o+1]*dt; F.pos[o+2]+=F.v[o+2]*dt; }
  F.m.geometry.attributes.position.needsUpdate=true; F.m.geometry.attributes.color.needsUpdate=true; }
var KART_COL=null; function kartCols(){ return KART_COL||(KART_COL={dust:Cc('#e8e2d0'),l:[Cc('#e8e2d0'),Cc('#3aa0ff'),Cc('#ff9a2e'),Cc('#c04cff')],fire:Cc('#ffd23a'),water:Cc('#bfe4ff'),conf:['#e23b2e','#f2c230','#2f9e5a','#3aa0ff','#c04cff','#ffffff'].map(Cc)}); }
function kartClearProps(){ for(const o of KART.ents) scene.remove(o); KART.ents=[]; for(const B of KART.bots){ scene.remove(B.g); scene.remove(B.R.root); } KART.bots=[]; for(const b of KART.balls) scene.remove(b.m); KART.balls=[]; KART.gates=[]; KART.pads=[]; KART.boxes=[]; KART.puddles=[]; KART.coinsM=[]; KART.beam=null; KART.fx=null; KART.conf=null; KART.pod=null; kbClear(); }
/* ---- start: alone (with bots) or as host of the room, or joining a friend's race ---- */
function kartGridPos(slot){ if(KART.mode==='bat') return kbBatGrid(slot); const C=KART.C, row=Math.floor(slot/2), q=kartAt(C,10+row*7), c=Math.cos(q.yaw), sn=Math.sin(q.yaw), sd=slot%2?2.6:-2.6; return {x:q.x-sn*sd,z:q.z+c*sd,yaw:q.yaw}; }
function kartFreeBuggy(){ if(P.buggy&&!P.buggy.type) return P.buggy; let best=null, bd=1e18; for(const b of buggies){ if(b.type||b.remoteBy) continue; const d=Math.hypot(b.x-P.x,b.z-P.z); if(d<bd){ bd=d; best=b; } } return best; }
function kartCanStart(){ return ['walk','drive','bike'].includes(S.mode)&&!S.interior; }
// x: the options of this race, the same for everyone in it: md (race, gp, tt, bat), rv (reverse), it (items), bs (speed of the bots, 0 to 2), cu (help for those behind),
// ar (the arena of the balloon battle), bt (the bots, when they come from the host), gp ([round, rounds, id]) and host (the friend who started it)
function kartBegin(ids,laps,crash,nb,go,rid,slot,cir,x){ kartClearProps(); const b=kartFreeBuggy(); if(!b){ toast('Karts','No queda ningún buggy libre'); return false; }
  if(S.mode==='drive'&&P.buggy&&P.buggy!==b) exitBuggy();
  x=Object.assign({md:'race',rv:0,it:1,bs:1,cu:1},x||{}); const bat=x.md==='bat'; if(KART.myB&&KART.myB!==b) kgUndress(KART.myB.g,KART.myB);
  Object.assign(KART,{on:true,mode:x.md,x,C:bat?kbArenaC(x.ar):kartCirBuild(cir||'campo',ids,x.rv),ar:bat?{x:x.ar[0],z:x.ar[1],R:x.ar[2]}:null,cir:cir||'campo',coins:0,got:0,h:0,vy:0,air:false,ramp:false,trick:0,tricks:0,dr:null,drifts:0,cutT:0,onCut:false,offRoad:false,pod:null,podT:0,pos:0,ids,laps,crash,go,rid,lock:true,lap:0,cp:1,idx:0,s:0,offT:0,t0:0,lapT0:0,bestLap:0,item:0,itemN:0,boost:0,spin:0,done:false,fin:0,inPud:false,
    shield:0,gold:0,slow:0,sandT:0,ford:false,bal:3,hits:0,out:0,inv:0,cuB:0,seen:0,goldCd:0,guest:!!x.host,host:x.host||'',veh:KG.v,myB:b,gap:null});
  kartProps(); const g=kartGridPos(slot); b.x=g.x; b.z=g.z; b.yaw=g.yaw; b.speed=0; kgDress(b.g,KG,b); placeBuggyMesh(b); P.x=b.x; P.z=b.z; P.y=b.y; if(P.buggy!==b){ P.x=b.x; P.z=b.z; enterBuggy(b); } camS.yaw=g.yaw; S.snap=true;
  const BL=(x.bt||kbBotList(nb,false)).slice(0,7), s0=MP.code&&MP.peers.size?MP.peers.size+1:slot+1;
  BL.forEach((d,k)=>{ const B={n:d.n,d,sk:d.sk,si:d.si|0,x:0,z:0,y:0,yaw:0,s:0,lane:(k%2?2.6:-2.6),lap:0,v:0,vmax:[10.2,11.5,12.7][x.bs]+(BL.length>1?k/(BL.length-1):0.5)*1.5+Math.random()*0.3,lift:0,jt:0,spin:0,boost:0,fin:0,done:false,g:makeBuggy(),R:buildRig(d.sk),padCd:0,inPud:false,
      item:0,itemT:0,shield:0,gold:0,slow:0,sandT:0,bal:3,hits:0,out:0,net:null};
    kgDress(B.g,d,B); const gp=kartGridPos(s0+k); B.s=10+Math.floor((s0+k)/2)*7; B.x=gp.x; B.z=gp.z; B.yaw=gp.yaw; scene.add(B.g); scene.add(B.R.root); placeBuggyMesh(B); KART.bots.push(B); });
  kbGhostStart(); if(x.md==='tt'){ KART.item='turbo'; KART.itemN=3; }
  if(MUS.st!=='off'&&MUS.st!=='arcade'){ KART.musPrev=MUS.st; musSet('arcade'); }
  $('kartHud').hidden=false; $('kartLights').hidden=false; kartSheetClose(); closeModal();
  tip(bat?'Batalla de globos: tienes 3 globos. Coge cajas «?» y pulsa Acción para lanzar el objeto; cada diana pincha un globo. Gana el último con globos':x.md==='tt'?'Contrarreloj: tú solo contra el reloj'+(KB.ghost?' y contra tu fantasma (el kart blanco)':'')+'. Tienes 3 turbos: Acción para gastar uno':'Sigue las puertas y los conos. Mantén Saltar mientras giras para derrapar: al soltar, mini-turbo. Coge monedas y cajas «?» (Acción usa el objeto), y busca las rampas y el cartel ATAJO',7500); return true; }
// start what the sheet says: a race, a Grand Prix, a time trial or a balloon battle
function kartNewRace(){ const md=KOPT.md; KART.gp=null;
  if(md==='gp'){ KART.gp={k:0,R:kbGpRounds(),pts:{},gid:String(Date.now()%1e7),mine:true}; return kbGpGo(); }
  if(md==='bat') return kartLaunch({md});
  const cir=kartCircuits().some(k=>k.id===KART.cir)?KART.cir:'campo'; return kartLaunch({md,cir,ids:kartCirIds(cir),rev:KOPT.rv}); }
function kartLaunch(sp){ if(S.mode==='menu'||S.mode==='drone'){ cirLand(); refreshHUD(); } /* straight from the start screen */ if(!kartCanStart()){ toast('Karts','Sal antes del golpe o de la casa'); return false; }
  const md=sp.md, inv=MP.code&&MP.peers.size>0&&md!=='tt', go=Date.now()+(MP.code?9000:4500), rid=(MP.id||'solo')+':'+go;
  const nb=md==='tt'?0:inv?(md==='bat'?0:Math.min(KART.nb,Math.max(0,7-MP.peers.size))):KART.nb;
  const x={md,rv:sp.rev?1:0,it:md==='tt'?0:KOPT.it?1:0,bs:clamp(KOPT.bs|0,0,2),cu:md==='race'||md==='gp'?(KOPT.cu?1:0):0};
  if(md==='bat'){ const a=kbArena(); if(!a){ toast('Batalla de globos','No encuentro un sitio despejado para el recinto'); return false; } x.ar=[a.x,a.z,a.R]; }
  if(inv) x.bt=kbBotList(nb,true); if(sp.gp) x.gp=sp.gp;
  if(!kartBegin(sp.ids||[],md==='bat'?1:KART.laps,KART.crash,nb,go,rid,0,sp.cir||'campo',x)) return false;
  if(inv){ mpSend({t:'ktgo',rid,go,ids:sp.ids||[],c:/^c\d$/.test(sp.cir||'')?'campo':(sp.cir||'campo'),l:KART.laps,x:KART.crash?1:0,o:{md,rv:x.rv,it:x.it,bs:x.bs,cu:x.cu,ar:x.ar,gp:x.gp,bt:KART.bots.map(B=>[B.n,B.si,B.d.v,B.d.c,B.d.num])}});
    mpFeed(md==='bat'?'Has invitado a la sala a la batalla de globos':md==='gp'?'Has invitado a la sala al Gran Premio':'Has invitado a la sala a la carrera','sys'); }
  return true; }
function kartSlotFor(id,host){ const all=[...MP.peers.keys(),MP.id].filter(i=>i!==host).sort(); return 1+Math.max(0,all.indexOf(id)); }
function kartNetIn(p,o){
  if(o.t==='ktgo'){ if(!Array.isArray(o.ids)||!o.ids.every(i=>W.HOLES[i|0])||!Number.isFinite(o.go)||typeof o.rid!=='string') return; const go=o.go+(p.off||0); if(go<Date.now()+800) return;
    const q=o.o&&typeof o.o==='object'?o.o:{}, md=['race','gp','bat'].includes(q.md)?q.md:'race';
    const gp=md==='gp'&&Array.isArray(q.gp)&&q.gp.length===3?[clamp(q.gp[0]|0,0,7),clamp(q.gp[1]|0,1,8),String(q.gp[2]).slice(0,10)]:null;
    const auto=!!(gp&&gp[0]>0&&KART.gp&&KART.gp.gid===gp[2]&&KART.on&&KART.done&&KART.host===p.id); if(KART.on&&!auto) return;
    const cir=typeof o.c==='string'&&kartCircuits().some(k=>k.id===o.c)?o.c:'campo'; if(md!=='bat'&&cir==='campo'&&!o.ids.length) return;
    const x={md,rv:q.rv?1:0,it:q.it?1:0,bs:clamp(q.bs|0,0,2),cu:q.cu?1:0,host:p.id};
    if(md==='bat'){ if(!Array.isArray(q.ar)||q.ar.length!==3||!q.ar.every(Number.isFinite)) return; x.ar=[q.ar[0],q.ar[1],clamp(q.ar[2],20,60)]; }
    x.bt=(Array.isArray(q.bt)?q.bt:[]).slice(0,7).filter(Array.isArray).map(e=>({n:String(e[0]||'Rival').replace(/[<>&"']/g,'').slice(0,12),si:Math.abs(e[1]|0),sk:SKINS[Math.abs(e[1]|0)%SKINS.length],v:KG_VEH[e[2]]?e[2]:'kart',c:clamp(e[3]|0,0,7),s:'num',num:clamp(e[4]|0,0,99)}));
    if(gp) x.gp=gp;
    const start=()=>{ if(Date.now()>go-300){ toast('Karts','Ya ha salido'); return; } if(KART.on) kartEnd(null,true); if(!kartCanStart()){ toast('Karts','Sal antes del golpe o de la casa'); return; }
      if(gp){ if(!KART.gp||KART.gp.gid!==gp[2]) KART.gp={k:gp[0],n:gp[1],pts:{},gid:gp[2]}; KART.gp.k=gp[0]; } else KART.gp=null;
      kartBegin(o.ids.map(i=>i|0),clamp(o.l|0,1,5),!!o.x,x.bt.length,go,o.rid,kartSlotFor(MP.id,p.id),cir,x); };
    if(auto){ start(); return; }
    const n=esc(p.n||'Un amigo'), what=md==='bat'?'una batalla de globos':md==='gp'?'un Gran Premio de karts':'una carrera de karts'; mpFeed('<b>'+n+'</b> empieza '+what,'ev',true);
    mpPrompt(n+' empieza '+what+(md==='bat'?'':' de '+(o.l|0)+(o.l==1?' vuelta':' vueltas')+(x.rv?' en sentido inverso':'')+(o.x?', con choques':', sin choques'))+(x.it?', con objetos':', sin objetos')+(x.bt.length?' y '+x.bt.length+(x.bt.length===1?' rival':' rivales')+' de la máquina':'')+'. ¿Te apuntas?','Me apunto',start,Math.max(1000,go-Date.now()-300)); }
  else if(o.t==='ktb'){ if(KART.on&&o.rid===KART.rid&&Array.isArray(o.p)&&o.p.every(Number.isFinite)) kartDropBall(o.p[0],o.p[1],false); }
  else kbNetIn(p,o); }
function kartEnd(why,keepGp){ if(!KART.on) return; KART.on=false; if(KART.myB){ const b=KART.myB; kgUndress(b.g,b); b.lift=0; b.spinV=0; placeBuggyMesh(b); KART.myB=null; } kartClearProps(); $('kartHud').hidden=true; $('kartLights').hidden=true; kartSheetClose(); if(!keepGp) KART.gp=null; if(KART.musPrev){ musSet(KART.musPrev); KART.musPrev=null; } if(why) tip(why,3200); }
/* ---- items, pads, puddles ---- */
function kartDropBall(x,z,send){ const m=new THREE.Mesh(kartMats().ballG,kartMats().ball); m.position.set(x,terrainAt(x,z)+0.4,z); scene.add(m); KART.balls.push({x,z,m,t:performance.now()});
  if(send&&MP.code) mpSend({t:'ktb',rid:KART.rid,p:[r2(x),r2(z)]}); }
function kartUseItem(){ kbUse(); }
// what happens to a kart (ours or a bot) where it is now: k = {x,z,…}, spin(sec) and boost(sec) callbacks
function kartHazards(k,hit){ for(let i=KART.balls.length-1;i>=0;i--){ const B=KART.balls[i]; if(Math.hypot(k.x-B.x,k.z-B.z)<(B.k?1.7:1.4)){ scene.remove(B.m); KART.balls.splice(i,1); if(B.k&&MP.code) mpSend({t:'kti',rid:KART.rid,k:'quita',p:[r2(B.x),r2(B.z)]}); hit(B.k?'sand':'ball'); } }
  let inP=false; for(const q of KART.puddles) if(Math.hypot(k.x-q.x,k.z-q.z)<3) inP=true; if(inP&&!k.inPud) hit('puddle'); k.inPud=inP;
  if(k.padCd>0) k.padCd-=1/30; else for(const q of KART.pads) if(Math.hypot(k.x-q.x,k.z-q.z)<3){ hit('pad'); k.padCd=1.2; } }
function kartMax(){ const V=KG_VEH[KART.veh]||KG_VEH.buggy; let m=KART.gold>0?19:KART.boost>0?20.5:13+KART.coins*0.3+V.max+(KART.cuB||0);
  if(KART.slow>0) m=Math.min(m,9.5); if(KART.sandT>0) m=Math.min(m,5); if(KART.ford&&KART.boost<=0&&KART.gold<=0) m=Math.min(m,10.5); return m; }
// the accelerator: the vehicle's own push, and the help for the little ones (it accelerates by itself unless you brake)
function kartThr(my){ const V=KG_VEH[KART.veh]||KG_VEH.buggy; let t=my; if(KOPT.ag&&!KART.done&&my>-0.3) t=1; return t>0?t*V.acc:t; }
// drift: Jump held while turning. The kart keeps turning to that side (more if you steer into it, less if you steer out) and charges the mini-turbo
function kartHeld(){ return !!(inp.jh||inp.keys.Space||(typeof GP!=='undefined'&&GP.idx>=0&&GP.prev&&GP.prev[0]>0.5)); }
function kartDrLvl(t){ return t>=2.3?3:t>=1.3?2:t>=0.55?1:0; }
function kartSteer(mx){
  // steering help: the kart turns by itself towards the track ahead, and the stick only nudges it
  if(KOPT.as&&KART.C&&P.buggy&&KART.mode!=='bat'&&!KART.done){ const C=KART.C, b=P.buggy, q=C.pts[(KART.idx+6)%C.pts.length]; let d=Math.atan2(q[1]-b.z,q[0]-b.x)-b.yaw; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; mx=clamp(mx*0.55+clamp(d*2.4,-1,1)*0.8,-1,1); }
  if(KART.dr) return clamp(KART.dr.d*0.75+mx*0.6,-1.35,1.35); if(KART.air&&KART.ramp) return mx*0.3; return mx; }
function kartHit(sec){ KART.spin=Math.max(KART.spin,sec); KART.spinD=Math.random()<0.5?-1:1; KART.coins=Math.max(0,KART.coins-3); KART.dr=null; }
function kartDrive(b,dt,C){ const cs=Math.cos(b.yaw), sn=Math.sin(b.yaw), K=kartCols(); const jp=inp.jumpQ; inp.jumpQ=false;
  // ramps: climb the wedge and take off at the lip
  if(!KART.air){ let h=0; for(const r of C.ramps){ const dx=b.x-r.x, dz=b.z-r.z, c=Math.cos(r.yaw), s=Math.sin(r.yaw), u=dx*c+dz*s, v=-dx*s+dz*c; if(Math.abs(u)>2.9||Math.abs(v)>3.2||cs*c+sn*s<0.45||b.speed<6) continue;
      h=clamp((u+2.5)/5,0,1)*1.2; if(u>1.5){ KART.air=true; KART.ramp=true; KART.trick=0; KART.vy=4.4+b.speed*0.28; blip('jump'); tip('¡Rampa! Pulsa Saltar en el aire: acrobacia e impulso al caer',2600); } }
    KART.h=h; }
  if(KART.air){ if(jp&&KART.ramp&&!KART.trick){ KART.trick=1; KART.trickT=0; blip('cup'); }
    KART.vy-=22*dt; KART.h+=KART.vy*dt; if(KART.trick){ KART.trickT+=dt; b.spinV=Math.min(1,KART.trickT/0.5)*Math.PI*2; }
    if(KART.h<=0&&KART.vy<0){ KART.h=0; KART.air=false; if(KART.trick){ KART.boost=Math.max(KART.boost,1.3); KART.tricks++; blip('gold'); toast('¡Acrobacia!','Impulso al caer'); } KART.trick=0; KART.ramp=false; if(!KART.dr) b.spinV=0; } }
  else if(jp&&!KART.lock&&KART.spin<=0&&!KART.done){ KART.air=true; KART.ramp=false; KART.vy=4.2; KART.h=0.01; blip('jump'); if(Math.abs(inp.mx)>0.3&&b.speed>7) KART.dr={d:Math.sign(inp.mx),t:0}; }
  b.lift=KART.h;
  if(KART.dr){ const D=KART.dr; if(!kartHeld()||b.speed<5||KART.done){ const lv=kartDrLvl(D.t); if(lv&&b.speed>=5){ KART.boost=Math.max(KART.boost,[0,0.7,1.2,1.9][lv]); KART.drifts++; blip('gold'); } KART.dr=null; if(!KART.trick) b.spinV=0; }
    else { if(!KART.air) D.t+=dt*(1+0.4*inp.mx*D.d); if(!KART.trick) b.spinV=D.d*0.38; const lv=kartDrLvl(D.t);
      if(!KART.air) for(const sd of [-0.6,0.6]) kartFxEmit(KART.fx,b.x-cs*1.1-sn*sd,b.y+0.15,b.z-sn*1.1+cs*sd,-cs*2+(Math.random()-0.5)*3,1.5+Math.random()*(1+lv),-sn*2+(Math.random()-0.5)*3,0.3+lv*0.08,K.l[lv]); } }
  if(KART.boost>0) kartFxEmit(KART.fx,b.x-cs*1.3,b.y+0.5,b.z-sn*1.3,-cs*5+(Math.random()-0.5)*2,Math.random()*1.5,-sn*5+(Math.random()-0.5)*2,0.28,K.fire);
  // coins
  for(const c of KART.coinsM){ if(c.t>0){ c.t-=dt; c.m.visible=c.t<=0; continue; } c.m.rotation.y+=dt*3; if(Math.hypot(b.x-c.x,b.z-c.z)<1.9){ c.t=7; c.m.visible=false; KART.got++; if(KART.coins<10) KART.coins++; blip('hit'); } }
  // off the track the grass slows you down, unless you are on a shortcut or on a turbo
  KART.onCut=false; for(const ct of C.cuts) if(kartSegD(b.x,b.z,ct.a,ct.b)<5.5){ KART.onCut=true; KART.cutT=3; } if(KART.cutT>0) KART.cutT-=dt;
  KART.offRoad=KART.offT>11&&!KART.onCut&&!KART.air&&!KART.done; { const gv=(KG_VEH[KART.veh]||KG_VEH.buggy).grass; if(KART.offRoad&&KART.boost<=0&&KART.gold<=0&&b.speed>gv) b.speed=Math.max(gv,b.speed*Math.exp(-1.8*dt)); } }

/* ---- each frame ---- */
function kartProg(lap,s){ return lap*KART.C.L+s; }
function kartStep(dt){ if(!KART.on) return; const C=KART.C, now=Date.now(), bat=KART.mode==='bat';
  KART.lock=now<KART.go||!!KART.pod; if(!KART.t0&&!KART.lock){ KART.t0=now; KART.lapT0=now; }
  // lights: three reds one per second, then green
  const L=$('kartLights'); if(!L.hidden){ const left=(KART.go-now)/1000; const n=left>3?0:left>2?1:left>1?2:left>0?3:4; const ls=L.children;
    for(let k=0;k<3;k++){ ls[k].className=n===4?'g':k<n?'r':''; } $('kartGo').textContent=n===4?'¡YA!':left>3?'Prepárate':''; if(left<-1.6) L.hidden=true; }
  const b=P.buggy;
  if(!KART.done&&(S.mode!=='drive'||!b)){ kartEnd(bat?'Has dejado la batalla':'Has abandonado la carrera'); return; }
  if(b&&S.mode==='drive'){
    for(const k of ['shield','gold','slow','sandT','goldCd']) if(KART[k]>0) KART[k]-=dt;
    if(KART.boost>0){ KART.boost-=dt; b.speed=Math.min(20.5,b.speed+16*dt); }
    if(KART.gold>0&&!KART.lock) b.speed=Math.min(19,b.speed+10*dt);
    kartDrive(b,dt,C);
    if(KART.spin>0){ KART.spin-=dt; b.yaw+=KART.spinD*7.5*dt*Math.min(1,KART.spin*1.5); b.speed*=Math.exp(-2.4*dt); }
    kartHazards({x:b.x,z:b.z,get inPud(){ return KART.inPud; },set inPud(v){ KART.inPud=v; },get padCd(){ return KART.padCd; },set padCd(v){ KART.padCd=v; }},w=>{
      if(KART.air) return; if(w==='ball') kbHit({me:true,id:'me'},'bola'); else if(w==='sand') kbHit({me:true,id:'me'},'arena');
      else if(w==='puddle'){ if(KART.gold<=0){ kartHit(0.5); b.speed*=0.75; } }
      else if(w==='pad'&&!KART.lock){ KART.boost=2.2; blip('gold'); } });
    for(const B of KART.boxes){ if(B.t>0){ B.t-=dt; B.m.visible=B.t<=0; continue; } if(Math.hypot(b.x-B.x,b.z-B.z)<2.2&&!KART.lock&&!KART.done){ B.t=6; B.m.visible=false; if(!KART.item){ kbGive(kbRoll(kbFrac('me'),bat)); blip('cup'); } } }
    if(bat) kbBatMe(b,dt,now);
    else {
      // gates in order, laps
      KART.idx=kartProj(C,b.x,b.z,KART.idx,KART.cutT>0?66:40); KART.s=KART.idx*C.st; { const q=C.pts[KART.idx]; KART.offT=Math.hypot(b.x-q[0],b.z-q[1]); } if(KART.cp===0&&KART.s<C.L*0.4) KART.s=C.L;
      for(let gk=0;gk<4;gk++){ const G=KART.gates[KART.cp], n=C.pts.length, fw=((KART.idx-Math.round(G.s/C.st))%n+n)%n; if(KART.done||KART.lock||!(Math.hypot(b.x-G.x,b.z-G.z)<16||(KART.cp!==0&&KART.cutT>0&&fw<70))) break;
        if(KART.cp===0){ const lt=now-KART.lapT0; KART.lapT0=now; if(!KART.bestLap||lt<KART.bestLap) KART.bestLap=lt; KART.lap++; KART.s=0;
          if(KART.lap>=KART.laps){ kartFinish(now); } else toast('Vuelta '+(KART.lap+1)+' de '+KART.laps,'Última: '+kartFmt(lt)); }
        KART.cp=(KART.cp+1)%KART.gates.length; }
      // stuck against the water, a wall or a tree for a while: back onto the track, facing the right way
      if(!KART.lock&&!KART.done&&Math.abs(b.speed)<1.5&&KART.offT>2&&KART.spin<=0) KART.stuckT=(KART.stuckT||0)+dt; else KART.stuckT=0;
      if(KART.stuckT>1.6){ KART.stuckT=0; const q=kartAt(C,KART.idx*C.st); b.x=q.x; b.z=q.z; b.yaw=q.yaw; b.speed=5; KART.dr=null; camS.yaw=q.yaw; toast('De vuelta a la pista','El caddie te ha recolocado'); }
      // water zones: the kart ploughs through, slower, unless it flies over or goes on a turbo
      const fd=!KART.air&&KART.offT<9.5&&kbInFord(C,KART.idx); if(fd&&!KART.ford&&!KART.done) tip('Zona de agua: frena el kart. Pásala con turbo o saltando',2600); KART.ford=fd;
      if(fd&&b.speed>3){ const K=kartCols(), cs=Math.cos(b.yaw), sn=Math.sin(b.yaw); for(const sd of [-0.8,0.8]) kartFxEmit(KART.fx,b.x-cs*0.6-sn*sd,b.y+0.2,b.z-sn*0.6+cs*sd,-sn*sd*3+(Math.random()-0.5)*2,2.5+Math.random()*2.5,cs*sd*3+(Math.random()-0.5)*2,0.5,K.water); } }
    // crashes with bots and friends in the race; in golden mode, touching them spins them
    if((KART.crash||KART.gold>0)&&!KART.lock){ const others=KART.bots.filter(B=>!B.out).map((B,k)=>[B.x,B.z,{B,id:'b'+KART.bots.indexOf(B)}]); for(const p of MP.peers.values()){ const s=p.out; if(s&&s.m==='drive'&&s.kr===KART.rid) others.push([s.x,s.z,{p,id:p.id}]); }
      for(const [x,z,a] of others){ const dx=b.x-x, dz=b.z-z, d=Math.hypot(dx,dz); if(d<2.1&&d>0.01){ if(KART.crash){ b.x+=dx/d*(2.1-d); b.z+=dz/d*(2.1-d); if(KART.gold<=0) b.speed*=0.86; }
          if(KART.gold>0&&KART.goldCd<=0&&!KART.done){ KART.goldCd=1.2; if(kbHit(a,'dorado','me')&&bat) KART.hits++; } } } } }
  if(!bat){ for(const g of KART.gates) g.b.material=g.start?kartMats().start:kartMats().ban; const ng=KART.gates[KART.cp]; if(ng&&!KART.done){ if(!ng.start) ng.b.material=kartMats().next; KART.beam.visible=true; KART.beam.position.set(ng.x,terrainAt(ng.x,ng.z)+22.5,ng.z); } else if(KART.beam) KART.beam.visible=false; }
  for(const B of KART.boxes) B.m.rotation.y+=dt*1.6;
  kartBots(dt,now); kbShots(dt); kbGhost(dt); if(KART.myB) kgFx(KART.myB.g,{sh:KART.shield>0,gold:KART.gold>0,cloud:KART.slow>0,bal:bat?KART.bal:-1},dt);
  if(KART.gold>0&&b){ const K=kartCols(); kartFxEmit(KART.fx,b.x+(Math.random()-0.5)*2,b.y+0.4+Math.random()*1.4,b.z+(Math.random()-0.5)*2,0,1.5,0,0.5,K.fire); }
  if(KART.slow>0&&b){ const K=kartCols(); kartFxEmit(KART.fx,b.x+(Math.random()-0.5)*2.2,b.y+3.2,b.z+(Math.random()-0.5)*2.2,0,-6,0,0.45,K.water); }
  kartFxStep(KART.fx,dt); kartFxStep(KART.conf,dt); if(KART.pod) kartPodStep(dt,now);
  if(KART.podT>0){ KART.podT-=dt; if(KART.podT<=0){ if(typeof document!=='undefined'&&$('fade')) fadeTo(kartPodium); else kartPodium(); } }
  for(let i=KART.balls.length-1;i>=0;i--) if(performance.now()-KART.balls[i].t>(KART.balls[i].k?45000:90000)){ scene.remove(KART.balls[i].m); KART.balls.splice(i,1); }
  KART.hudT+=dt; if(KART.hudT>0.12){ KART.hudT=0; kartHud(now); } }
// the bots follow the track; with friends in the room the host drives them and tells the others where they are (message ktbt)
function kartBots(dt,now){ if(KART.mode==='bat') return kbBatBots(dt,now); const C=KART.C, me=kartProg(KART.lap,KART.s), guest=KART.guest&&performance.now()-KB.lastBt<2500;
  KART.bots.forEach((B,k)=>{ if(KART.lock){ placeBuggyMesh(B); kartBotRig(B); return; }
    if(guest&&B.net){ const e=B.net, f=e[5]|0; B.v=e[2]/10; B.laneT=e[3]/10; B.fin=e[4]; B.done=e[4]>0; B.spin=f&1?0.3:0; B.boost=f&2?0.3:0; B.gold=f&4?0.3:0; B.shield=f&8?0.3:0; B.slow=f&16?0.3:0;
      e[1]+=B.v*dt; const err=(e[0]*C.L+e[1])-(B.lap*C.L+B.s); B.s+=B.v*dt+(Math.abs(err)>60?err:err*Math.min(1,dt*3)); while(B.s>=C.L){ B.s-=C.L; B.lap++; } while(B.s<0&&B.lap>0){ B.s+=C.L; B.lap--; } }
    else { if(B.done){ B.v*=Math.exp(-1.5*dt); }
      else { let tv=B.vmax; const d=kartProg(B.lap,B.s)-me; if(KART.x.cu&&!KART.done){ if(d>70) tv*=0.9; else if(d<-70) tv*=1.07; }
        if(kbInFord(C,Math.round(B.s/C.st))&&B.boost<=0&&B.gold<=0) tv=Math.min(tv,9.6); if(B.slow>0){ B.slow-=dt; tv=Math.min(tv,8.5); } if(B.gold>0){ B.gold-=dt; tv=17; } if(B.boost>0){ B.boost-=dt; tv=19; } if(B.sandT>0){ B.sandT-=dt; tv=3; } if(B.spin>0){ B.spin-=dt; tv=2; }
        B.v+=(tv-B.v)*(1-Math.exp(-dt*(tv>B.v?0.9:2.5))); }
      if(B.shield>0) B.shield-=dt;
      B.s+=B.v*dt; if(B.s>=C.L){ B.s-=C.L; B.lap++; if(B.lap>=KART.laps&&!B.done){ B.done=true; B.fin=Math.max(1,now-KART.t0); } }
      if(Math.random()<dt*0.25) B.laneT=(Math.random()-0.5)*5; }
    B.lane+=((B.laneT||B.lane)-B.lane)*(1-Math.exp(-dt*0.8));
    const q=kartAt(C,B.s), c=Math.cos(q.yaw), sn=Math.sin(q.yaw); B.x=q.x-sn*B.lane; B.z=q.z+c*B.lane; B.yaw=q.yaw+(B.spin>0?Math.sin(B.spin*14)*0.8:0);
    if(B.jt>0){ B.jt-=dt; B.lift=Math.max(0,Math.sin((1-B.jt/0.8)*Math.PI)*1.9); } else { B.lift=0; if(!B.done) for(const r of C.ramps) if(!r.cut&&Math.hypot(B.x-r.x,B.z-r.z)<3){ B.jt=0.8; break; } }
    if(!guest){ const A={B,id:'b'+k};
      kartHazards(B,w=>{ if(B.lift>0.3) return; if(w==='ball') kbHit(A,'bola'); else if(w==='sand') kbHit(A,'arena'); else if(w==='puddle'){ if(B.gold<=0) B.spin=Math.max(B.spin,0.45); } else if(w==='pad') B.boost=2; });
      // boxes and items
      if(KART.x.it&&!B.item&&!B.done) for(const X of KART.boxes) if(X.t<=0&&Math.hypot(B.x-X.x,B.z-X.z)<2.2){ X.t=6; X.m.visible=false; B.item=kbRoll(kbFrac('b'+k),false); B.itemT=1.5+Math.random()*4; break; }
      if(B.item&&!B.done&&B.spin<=0){ B.itemT-=dt; if(B.itemT<=0){ const it=B.item; B.item=0; kbFire('b'+k,it,B.x,B.z,B.yaw); } } }
    placeBuggyMesh(B); kartBotRig(B); kgFx(B.g,{sh:B.shield>0,gold:B.gold>0,cloud:B.slow>0,bal:-1},dt); });
  if(!KART.guest&&MP.code&&KART.bots.length&&!KART.lock){ KB.netT+=dt; if(KB.netT>0.25){ KB.netT=0; mpSend({t:'ktbt',rid:KART.rid,b:KART.bots.map(B=>[B.lap,Math.round(B.s),Math.round(B.v*10),Math.round((B.laneT||B.lane)*10),B.fin|0,(B.spin>0?1:0)|(B.boost>0?2:0)|(B.gold>0?4:0)|(B.shield>0?8:0)|(B.slow>0?16:0)])}); } } }
function kartBotRig(B){ const R=B.R; poseRig(R,'drive',T,0); const sp=seatPos(B); R.root.position.set(sp[0],sp[1],sp[2]); R.root.rotation.set(0,-B.yaw,0); }
function kartFinish(now){ KART.done=true; KART.fin=now-KART.t0; const rk=kartRank(), pos=rk.findIndex(r=>r.me)+1, tt=KART.mode==='tt';
  const rec=+(store.get(KART.C.key+'_'+KART.laps)||0), rl=+(store.get(KART.C.key+'_lap')||0); let msg='';
  if(!rec||KART.fin<rec){ store.set(KART.C.key+'_'+KART.laps,String(KART.fin)); msg=' · ¡récord!'; } if(!rl||KART.bestLap<rl) store.set(KART.C.key+'_lap',String(KART.bestLap));
  if(tt){ const G=KB.ghost, win=!G||KB.gt<G.g.t; if(win){ const js=JSON.stringify({t:+KB.gt.toFixed(2),v:KART.veh,p:KB.rec}); if(js.length<120000) store.set(KART.C.key+'_g'+KART.laps,js); }
    KART.ttWin=G?win:null; toast(!G?'Contrarreloj terminada':win?'¡Has ganado a tu fantasma!':'Tu fantasma ha llegado antes',kartFmt(KART.fin)+msg+(!G?' · tu fantasma queda guardado':'')); prgEvt('ktt',{rec:!!msg||(!!G&&win)}); }
  else { toast(pos===1?'¡Has ganado!':'Has llegado '+pos+'.º',kartFmt(KART.fin)+msg); prgEvt('kart',{pos,rec:!!msg}); }
  const G=KART.gp; if(G&&KART.mode==='gp'){ const PT=[10,8,6,5,4,3,2,1]; rk.forEach((r,i)=>{ G.pts[r.n]=(G.pts[r.n]||0)+(PT[i]||0); }); G.k++; G.last=rk.map((r,i)=>[r.n,PT[i]||0]);
    if(G.k>=(G.R?G.R.length:G.n)&&!G.over){ G.over=true; const tb=kbGpTable(); G.pos=tb.findIndex(r=>r.me)+1; prgEvt('gp',{pos:G.pos}); } }
  blip('gold'); KART.podT=1.6; KART.pos=pos; }
// the podium: just after the finish line, beside the track; the first three climb on it and it rains confetti
function kartLabel(txt){ const t=kartTex((g,w,h)=>{ g.fillStyle='rgba(255,255,255,0.92)'; g.fillRect(0,0,w,h); g.fillStyle='#16231b'; g.font='bold 40px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt.slice(0,12),w/2,h/2+2); },256,64); const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,depthTest:false})); s.scale.set(2.2,0.55,1); return s; }
function kartPodium(){ const C=KART.C, M=kartMats(); let q=kartAt(C,22), c=Math.cos(q.yaw), sn=Math.sin(q.yaw), px=q.x, pz=q.z, found=false;
  // a clear spot: dry, no building, and no tree between the podium and the track
  for(const so of [22,40,60,90,120,8]){ if(found) break; const t=kartAt(C,so), tc=Math.cos(t.yaw), ts=Math.sin(t.yaw); for(const sd of [13,-13,17,-17,10,-10]){ const x=t.x-ts*sd, z=t.z+tc*sd;
      if(!bldAt(x,z,3.5)&&kartChordOK(x,z,t.x,t.z)&&kartChordOK(x+tc*4,z+ts*4,t.x+tc*4,t.z+ts*4)&&kartChordOK(x-tc*4,z-ts*4,t.x-tc*4,t.z-ts*4)){ q=t; c=tc; sn=ts; px=x; pz=z; found=true; break; } } }
  const y0=terrainAt(px,pz), face=Math.atan2(q.z-pz,q.x-px), g=new THREE.Group(), rk=kartRank().slice(0,3), rigs=[];
  [[0,1.3],[-2,0.9],[2,0.6]].forEach((st,k)=>{ const bx=new THREE.Mesh(new THREE.BoxGeometry(2,st[1]+0.6,1.8),M.pod[k]); const x=px+c*st[0], z=pz+sn*st[0]; bx.position.set(x,y0+st[1]/2-0.3,z); bx.rotation.y=-q.yaw; g.add(bx);
    const r=rk[k]; if(!r) return; const B=r.bot&&KART.bots.find(b=>b.n===r.n); const sk=r.me?curSkin():B?B.sk:SKINS[(k*2+3)%SKINS.length];
    const R=buildRig(sk); R.root.position.set(x,y0+st[1],z); R.root.rotation.set(0,-face,0); if(R.club) R.club.visible=false; g.add(R.root); rigs.push(R);
    const lb=kartLabel((k+1)+'.º '+r.n); lb.position.set(x,y0+st[1]+2.25,z); g.add(lb); });
  kartAdd(g); KART.pod={x:px,y:y0,z:pz,rigs,t:0,sheet:false};
  // our kart parks in front, looking at it
  const b=P.buggy; if(b&&S.mode==='drive'){ const d=Math.hypot(q.x-px,q.z-pz)||1, k=Math.min(7.5,d)/d; b.x=px+(q.x-px)*k; b.z=pz+(q.z-pz)*k; b.yaw=Math.atan2(pz-b.z,px-b.x); b.speed=0; b.lift=0; b.spinV=0; KART.h=0; KART.air=false; KART.dr=null; KART.boost=0; placeBuggyMesh(b); P.x=b.x; P.z=b.z; P.y=b.y; P.yaw=b.yaw; camS.yaw=b.yaw; camS.pitch=0.16; S.snap=true; } $('toast').classList.remove('show'); }
function kartPodStep(dt,now){ const Pd=KART.pod, K=kartCols(); Pd.t+=dt; for(const R of Pd.rigs) poseRig(R,'cheer',T,0);
  if(Pd.t<7) for(let k=0;k<4;k++){ const a=Math.random()*6.28, r=Math.random()*4.5; kartFxEmit(KART.conf,Pd.x+Math.cos(a)*r,Pd.y+5+Math.random()*2,Pd.z+Math.sin(a)*r,(Math.random()-0.5)*1.5,-0.5-Math.random(),(Math.random()-0.5)*1.5,2.6,K.conf[(Math.random()*K.conf.length)|0]); }
  if(!Pd.sheet&&Pd.t>2.6){ Pd.sheet=true; kartResults(); } }
// everyone in the race: us, the bots and the friends whose state carries this race id
function kartRank(){ if(KART.mode==='bat') return kbBatRank(); const C=KART.C, now=Date.now(), out=[{n:'Tú',me:true,prog:kartProg(KART.lap,KART.s),fin:KART.fin,best:KART.bestLap}];
  for(const B of KART.bots) out.push({n:B.n,prog:kartProg(B.lap,B.s),fin:B.fin,bot:true});
  for(const p of MP.peers.values()){ const s=p.out; if(s&&s.kr===KART.rid&&s.kp) out.push({n:p.n||'Amigo',prog:kartProg(s.kp[0],s.kp[1]),fin:s.kp[2]}); }
  out.sort((a,b)=>(a.fin&&b.fin)?a.fin-b.fin:a.fin?-1:b.fin?1:b.prog-a.prog); return out; }
function kartHud(now){ const rk=kartRank(), pos=rk.findIndex(r=>r.me)+1, el=KART.t0?(KART.done?KART.fin:now-KART.t0):0, bat=KART.mode==='bat', G=KART.gp;
  // help for those behind: a little more top speed in the second half of the field, far from the leader
  KART.cuB=KART.x.cu&&!bat&&rk.length>1&&!KART.done&&pos>Math.ceil(rk.length/2)&&rk[0].prog-kartProg(KART.lap,KART.s)>50?1.5:0;
  if(bat){ const left=Math.max(0,KART.go+KB_BAT_MS-now); $('kartLap').textContent=KART.done?(KART.bal>0?'Fin':'Sin globos'):'Globos: '+'●'.repeat(Math.max(0,KART.bal))+'○'.repeat(3-Math.max(0,KART.bal)); $('kartPos').textContent=pos+'.º de '+rk.length; $('kartTime').textContent='Quedan '+kartFmt(left)+' · dianas: '+KART.hits; }
  else { $('kartLap').textContent=(G&&KART.mode==='gp'?'GP '+Math.min(G.R?G.R.length:G.n,(KART.done?G.k:G.k+1))+'/'+(G.R?G.R.length:G.n)+' · ':'')+(KART.done?'Meta':'Vuelta '+Math.min(KART.laps,KART.lap+1)+' de '+KART.laps); $('kartPos').textContent=KART.mode==='tt'?'Contrarreloj':pos+'.º de '+rk.length;
    $('kartTime').textContent=kartFmt(el)+(KART.mode==='tt'&&KART.gap!=null?' · fantasma '+(KART.gap>0?'+':'−')+Math.abs(KART.gap).toFixed(1).replace('.',',')+' s':KART.bestLap?' · mejor vuelta '+kartFmt(KART.bestLap):''); }
  { const lv=KART.dr?kartDrLvl(KART.dr.t):0, I=KART.item&&KB_IT[KART.item];
    $('kartItem').textContent=((bat?'':'Monedas '+KART.coins+'/10')+(KART.gold>0?' · Modo dorado':KART.boost>0?' · Turbo':KART.dr?' · Derrape'+(lv?' nivel '+lv:''):KART.spin>0?' · Trompo…':KART.sandT>0?' · Arena…':KART.slow>0?' · Nube de lluvia':KART.ford?' · Zona de agua':KART.offRoad?' · Fuera de pista':'')+(KART.shield>0?' · Paraguas':'')+(KART.cuB?' · Ayuda':'')+(I?' · '+I.n+(KART.itemN>1?' ×'+KART.itemN:'')+' (Acción)':'')).replace(/^ · /,''); }
  if(KART.done&&!$('kartSheet').hidden&&KART.resOpen) kartResults(true); }
/* ---- the sheet: set up a race, and the results ---- */
function kartSheetClose(){ $('kartSheet').hidden=true; KART.resOpen=false; }
function kartSeg(id,vals,cur,lab){ return '<div class="qual">'+lab+' '+vals.map(v=>'<button data-k="'+id+'" data-v="'+v[0]+'" class="'+(String(cur)===String(v[0])?'on':'')+'">'+v[1]+'</button>').join('')+'</div>'; }
function kartSheet(){ if(KART.on&&KART.done){ kartResults(); return; } closeModal(); const CS=kartCircuits(); if(!CS.some(k=>k.id===KART.cir)) KART.cir='campo'; const md=KOPT.md, cur=CS.find(k=>k.id===KART.cir), friends=MP.code&&MP.peers.size>0;
  const C=md==='bat'||md==='gp'?null:kartCirBuild(KART.cir,null,KOPT.rv), rec=C?+(store.get(C.key+'_'+KART.laps)||0):0, rl=C?+(store.get(C.key+'_lap')||0):0, D=kgDesc(KG);
  let h='<h2>Karts</h2>'+kartSeg('md',[['race','Carrera'],['gp','Gran Premio'],['tt','Contrarreloj'],['bat','Batalla de globos']],md,'Modo');
  if(md==='race') h+='<p><b>Carrera:</b> un circuito, de 1 a 3 vueltas, contra los rivales de la máquina o los amigos de la sala.</p>';
  if(md==='gp'){ const R=kbGpRounds(); h+='<p><b>Gran Premio:</b> cuatro carreras seguidas con puntos (10, 8, 6, 5, 4, 3, 2 y 1 del primero al octavo). Gana quien suma más al final.</p><ol class="note">'+R.map(r=>'<li>'+esc(kbGpName(r))+'</li>').join('')+'</ol>'; }
  if(md==='tt') h+='<p><b>Contrarreloj:</b> tú solo contra el reloj, sin rivales ni cajas, con 3 turbos para gastar cuando quieras. Tu mejor carrera queda guardada y la próxima vez corres contra tu <b>fantasma</b>: un kart blanco y transparente que repite tu récord.</p>';
  if(md==='bat'){ const a=kbArena(); h+='<p><b>Batalla de globos:</b> un recinto redondo cerrado con postes, sin vueltas. Cada kart lleva <b>3 globos</b>; coge cajas «?» y lanza objetos: cada diana pincha un globo del rival. Gana el último con globos o, a los 3 minutos, quien conserve más (si hay empate, quien haya hecho más dianas).'+(a?'':' <b>En este mundo no encuentro un sitio despejado.</b>')+'</p>'; }
  if(C){ h+=(CS.length>1?kartSeg('cir',CS.map(k=>[k.id,k.n]),KART.cir,'Circuito'):'')+kartSeg('rv',[[0,'Normal'],[1,'Inverso']],KOPT.rv?1:0,'Sentido')
    +'<p><b>'+esc(C.n)+'.</b> '+cur.txt+' '+fmt(C.L)+' m por vuelta, <b>'+C.ramps.length+' rampas</b>, <b>'+(C.cuts.length===1?'1 atajo':C.cuts.length+' atajos')+'</b> y <b>'+C.fords.length+' zonas de agua</b>. Pasa por todas las puertas en orden; la siguiente tiene una <b>columna amarilla</b> y los conos naranjas marcan los bordes.</p>'; }
  if(md!=='bat') h+=kartSeg('laps',[[1,'1'],[2,'2'],[3,'3']],KART.laps,'Vueltas'+(md==='gp'?' por carrera':''));
  if(md!=='tt'){ if(friends&&md==='bat') h+='<p class="note">Hay amigos en la sala: les llega la invitación y jugáis entre vosotros, sin rivales de la máquina.</p>';
    else h+=kartSeg('nb',[[0,'0'],[1,'1'],[3,'3'],[5,'5'],[7,'7']],KART.nb,'Rivales de la máquina')+(friends?'<p class="note">Hay amigos en la sala: les llega la invitación y salís juntos. Los rivales de la máquina completan la parrilla hasta 8 karts; los lleva tu dispositivo y los demás los ven igual.</p>':'');
    h+='<details'+(KOPT.open?' open':'')+' id="kartOpt"><summary><b>Opciones de la carrera</b> (valen para todos)</summary>'+(md==='bat'?'':kartSeg('crash',[[1,'Sí'],[0,'No']],KART.crash?1:0,'Choques entre karts'))+(md==='bat'?'':kartSeg('it',[[1,'Sí'],[0,'No']],KOPT.it?1:0,'Objetos (cajas «?»)'))
      +kartSeg('bs',[[0,'Fáciles'],[1,'Normales'],[2,'Rápidos']],KOPT.bs,'Rivales de la máquina')+(md==='bat'?'':kartSeg('cu',[[1,'Sí'],[0,'No']],KOPT.cu?1:0,'Ayuda a los rezagados'))
      +'<p class="note"><b>Cómo leerlo:</b> «Fáciles» corren a unos 37–42 km/h, «Normales» a 41–47 y «Rápidos» a 46–51 (tu kart llega a 47, y a 58 con 10 monedas). Con la <b>ayuda a los rezagados</b>, quien va en la segunda mitad y lejos del primero corre un poco más y le tocan mejores objetos, y los rivales de la máquina te esperan o aprietan según vayas.</p></details>'; }
  h+='<details'+(KOPT.as||KOPT.ag?' open':'')+'><summary><b>Ayudas para los pequeños</b> (solo en este dispositivo)</summary>'+kartSeg('as',[[0,'No'],[1,'Sí']],KOPT.as?1:0,'Ayuda de dirección')+kartSeg('ag',[[0,'No'],[1,'Sí']],KOPT.ag?1:0,'Acelerador automático')
    +'<p class="note">Con la <b>ayuda de dirección</b> el kart gira solo hacia la pista y el joystick solo corrige. Con el <b>acelerador automático</b> el kart corre solo; tirar del joystick hacia atrás frena.</p></details>';
  h+='<div class="row" style="align-items:center;gap:10px;margin:8px 0"><canvas id="kgMini" width="150" height="72" style="width:150px;height:72px;border-radius:10px;background:#eef3ee" role="img" aria-label="Tu vehículo"></canvas><div style="flex:1"><b>Tu vehículo:</b> '+esc(D)+'<br><button class="btn" id="kartGar">Garaje</button></div></div>';
  if(C) h+='<p class="note">Récord del circuito a '+KART.laps+(KART.laps==1?' vuelta':' vueltas')+': <b>'+kartFmt(rec)+'</b> · mejor vuelta: <b>'+kartFmt(rl)+'</b>'+(md==='tt'?' · fantasma guardado: <b>'+(store.get(C.key+'_g'+KART.laps)?'sí':'todavía no')+'</b>':'')+'</p>';
  h+='<details><summary><b>Cómo se corre</b></summary><ul class="note"><li><b>Derrape:</b> mantén <b>Saltar</b> mientras giras. Saltan chispas azules, luego naranjas y luego moradas; al soltar, mini-turbo más largo cuanto más alto el nivel.</li><li><b>Rampas:</b> en el aire pulsa <b>Saltar</b> para hacer una acrobacia; al caer te da impulso.</li><li><b>Monedas:</b> cada una sube tu velocidad máxima, hasta 10. Un trompo te quita 3.</li><li><b>Atajos:</b> franja de tierra con el cartel verde ATAJO. Fuera de la pista la hierba te frena, salvo en el atajo o con turbo.</li><li><b>Zonas de agua:</b> tramos azules que cruzan la pista; el kart levanta agua y va más lento, salvo con turbo o saltando.</li><li><b>Semáforo:</b> tres luces rojas, una por segundo; con la verde, ¡a correr!</li><li><b>Flechas amarillas</b> en el suelo: turbo de 2 segundos.</li><li><b>Charcos azules</b> redondos: frenan y hacen derrapar.</li><li><b>Cajas «?»:</b> te dan un objeto; se usa con <b>Acción</b>. '+kbItemsHTML()+'</li></ul></details>'
    +'<div class="row"><button class="btn primary" id="kartGoBtn">'+(md==='bat'?'Al recinto':md==='gp'?'Empezar el Gran Premio':'A la parrilla')+'</button><button class="btn" id="kartClose">Cerrar</button></div>';
  $('kartBody').innerHTML=h;
  $('kartBody').querySelectorAll('button[data-k]').forEach(bt=>bt.onclick=()=>{ const k=bt.dataset.k, v=+bt.dataset.v; if(k==='cir') KART.cir=bt.dataset.v; else if(k==='md') KOPT.md=bt.dataset.v; else if(k==='laps') KART.laps=v; else if(k==='nb') KART.nb=v; else if(k==='crash') KART.crash=!!v; else { KOPT[k]=v; }
    const d=$('kartOpt'); KOPT.open=!!(d&&d.open); koptSave(); kartSheet(); });
  kgDraw2D($('kgMini'),KG); $('kartGar').onclick=kartGarage; $('kartGoBtn').onclick=kartNewRace; $('kartClose').onclick=kartSheetClose; $('kartSheet').hidden=false; }
function kartResults(){ const rk=kartRank(), bat=KART.mode==='bat', tt=KART.mode==='tt', G=KART.mode==='gp'?KART.gp:null, tot=G?(G.R?G.R.length:G.n):0; KART.resOpen=true;
  let h='<h2>'+(bat?(KART.pos===1?'¡Has ganado la batalla!':'Batalla: has quedado '+KART.pos+'.º'):tt?(KART.ttWin===true?'¡Has ganado a tu fantasma!':KART.ttWin===false?'Tu fantasma ha ganado':'Contrarreloj'):KART.pos?(KART.pos<=3?'¡Podio! ':'')+'Has quedado '+KART.pos+'.º':'Clasificación')+'</h2>';
  if(G) h+='<p class="note">Gran Premio · carrera '+Math.min(G.k,tot)+' de '+tot+' · '+esc(KART.C.n)+'</p>';
  h+='<div class="tablewrap"><table class="card mp"><thead><tr><th>Puesto</th><th class="nm">Piloto</th><th>'+(bat?'Globos':'Tiempo')+'</th>'+(bat?'<th>Dianas</th>':G?'<th>Puntos</th>':'')+'</tr></thead><tbody>'
    +rk.map((r,i)=>'<tr'+(r.me?' style="font-weight:800"':'')+'><td>'+(i+1)+'.º</td><td class="nm">'+esc(r.n)+(r.bot?' <small>máquina</small>':'')+'</td><td>'+(bat?(r.bal>0?r.bal:'sin globos'):r.fin?kartFmt(r.fin):'en carrera')+'</td>'+(bat?'<td>'+r.hits+'</td>':G?'<td>+'+((G.last&&(G.last.find(q=>q[0]===r.n)||[])[1])||0)+'</td>':'')+'</tr>').join('')+'</tbody></table></div>';
  if(G){ const tb=kbGpTable(); h+='<h3 style="margin:10px 0 4px">'+(G.over?'Clasificación final del Gran Premio':'Gran Premio: puntos tras '+G.k+(G.k===1?' carrera':' carreras'))+'</h3><div class="tablewrap"><table class="card mp"><thead><tr><th>Puesto</th><th class="nm">Piloto</th><th>Puntos</th></tr></thead><tbody>'+tb.map((r,i)=>'<tr'+(r.me?' style="font-weight:800"':'')+'><td>'+(i+1)+'.º</td><td class="nm">'+esc(r.n)+'</td><td>'+r.pts+'</td></tr>').join('')+'</tbody></table></div>'
      +(G.over?'<p><b>'+(G.pos===1?'¡Campeón del Gran Premio!':'Has terminado el Gran Premio '+G.pos+'.º')+'</b></p>':''); }
  h+='<p class="note">'+(bat?'Dianas: globos que has pinchado a los demás. Monedas de premio: 10 por jugar y 20 más si ganas.':esc(KART.C.n)+' · tu mejor vuelta: <b>'+kartFmt(KART.bestLap)+'</b> · récord del circuito: <b>'+kartFmt(+(store.get(KART.C.key+'_'+KART.laps)||0))+'</b><br>Monedas cogidas: <b>'+KART.got+'</b> · mini-turbos de derrape: <b>'+KART.drifts+'</b> · acrobacias: <b>'+KART.tricks+'</b>')+'</p>';
  const next=G&&!G.over; if(next&&!G.mine) h+='<p class="note">La siguiente carrera la lanza quien organizó el Gran Premio: empezará sola.</p>';
  h+='<div class="row">'+(next?(G.mine?'<button class="btn primary" id="kartNext">Siguiente carrera ('+(G.k+1)+' de '+tot+')</button>':''):'<button class="btn primary" id="kartAgain">'+(bat?'Otra batalla':tt?'Otro intento':G?'Otro Gran Premio':'Otra carrera')+'</button>')+'<button class="btn" id="kartClose">'+(next?'Dejar el Gran Premio':'Cerrar')+'</button></div>';
  $('kartBody').innerHTML=h;
  if($('kartNext')) $('kartNext').onclick=()=>{ kartEnd(null,true); kbGpGo(); }; if($('kartAgain')) $('kartAgain').onclick=()=>{ kartEnd(); kartNewRace(); }; $('kartClose').onclick=()=>kartEnd(); $('kartSheet').hidden=false; }
/* ---- the circuit on the maps ---- */
function kartDrawMap(g,m2c,s,big){ if(!KART.on) return; const C=KART.C; g.save();
  if(KART.mode==='bat'){ const A=KART.ar, c=m2c(A.x,A.z), e=m2c(A.x+A.R,A.z); g.strokeStyle='#d6442a'; g.lineWidth=(big?3:2)*s; g.setLineDash([6*s,4*s]); g.beginPath(); g.arc(c[0],c[1],Math.hypot(e[0]-c[0],e[1]-c[1]),0,7); g.stroke(); g.setLineDash([]); }
  else { g.strokeStyle='#d6442a'; g.lineWidth=(big?3:2)*s; g.setLineDash([6*s,4*s]); g.beginPath();
    C.pts.forEach((p,i)=>{ if(i%3) return; const [x,y]=m2c(p[0],p[1]); i?g.lineTo(x,y):g.moveTo(x,y); }); g.closePath(); g.stroke();
    g.strokeStyle='#8a5a22'; g.setLineDash([2*s,3*s]); for(const ct of C.cuts){ const a=m2c(ct.a[0],ct.a[1]), b=m2c(ct.b[0],ct.b[1]); g.beginPath(); g.moveTo(a[0],a[1]); g.lineTo(b[0],b[1]); g.stroke(); } g.setLineDash([]);
    g.strokeStyle='#2f8fd0'; g.lineWidth=(big?6:4)*s; for(const f of C.fords){ const a=C.pts[f.i0], b=C.pts[f.i1%C.pts.length], pa=m2c(a[0],a[1]), pb=m2c(b[0],b[1]); g.beginPath(); g.moveTo(pa[0],pa[1]); g.lineTo(pb[0],pb[1]); g.stroke(); }
    g.fillStyle='#f2c230'; g.strokeStyle='#16231b'; g.lineWidth=1*s; for(const r of C.ramps){ const [x,y]=m2c(r.x,r.z), k=(big?5:3.2)*s; g.beginPath(); g.moveTo(x,y-k); g.lineTo(x+k,y+k*0.8); g.lineTo(x-k,y+k*0.8); g.closePath(); g.fill(); g.stroke(); }
    const ng=KART.gates[KART.cp]; if(ng){ const [x,y]=m2c(ng.x,ng.z); g.fillStyle='#f2c230'; g.strokeStyle='#16231b'; g.lineWidth=1.2*s; g.beginPath(); g.arc(x,y,(big?5:3.4)*s,0,7); g.fill(); g.stroke(); } }
  for(const B of KART.bots){ if(B.out) continue; const [x,y]=m2c(B.x,B.z); g.fillStyle='#16231b'; g.fillRect(x-2*s,y-2*s,4*s,4*s); } g.restore(); }
function kartLegend(){ if(!KART.on) return ''; const bots=KART.bots.length?'<div><i style="background:#16231b;width:8px;height:8px;border:0"></i>Rivales de la máquina</div>':'';
  if(KART.mode==='bat') return '<div><i style="background:repeating-linear-gradient(90deg,#d6442a 0 6px,transparent 6px 10px);height:4px;border:0"></i>Recinto de la batalla de globos</div>'+bots;
  return '<div><i style="background:repeating-linear-gradient(90deg,#d6442a 0 6px,transparent 6px 10px);height:4px;border:0"></i>Circuito de karts</div><div><i class="dot" style="background:#f2c230;border:1px solid #16231b"></i>Siguiente puerta</div><div><i style="background:#f2c230;border:0;width:14px;clip-path:polygon(50% 0,100% 100%,0 100%)"></i>Rampa</div><div><i style="background:repeating-linear-gradient(90deg,#8a5a22 0 3px,transparent 3px 6px);height:4px;border:0"></i>Atajo</div><div><i style="background:#2f8fd0;height:5px;border:0"></i>Zona de agua</div>'+bots; }