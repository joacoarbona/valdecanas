/* ================= S3 · the countryside (Casterton): dry stone walls, hedges and fences you can't drive through, with their gates;
   horses that jump them; the school's riding centre with a show-jumping course; real routes along the bridleways; bridges you can
   cross (the LIDAR ground has none) with the Devil's Bridge; and the places worth a visit, from Kirkby Lonsdale to Casterton Grange ================= */
// HR.seg: wall segments, 8 numbers each: x0, z0, x1, z1, height (above the ground, or the absolute top at the start), half thickness, kind, absolute top at the end (NaN = above the ground)
// kinds: 0 dry stone wall, 1 hedge, 2 fence, 4 bridge parapet, 5 stable wall, 6 the arena's rails
var HR={seg:null,n:0,A:[],Ab:[],grid:new Map(),cs:8,gates:[],gGrid:new Map(),gAct:new Set(),gIM:null,br:[],cl:null,sj:null,rt:null,ar:null,pl:[],tab:'saltos',lv:1,res:null,rres:null,st:null,eT:0,jT:0,mk:null,hud:''};
TRO.push({id:'saltos',n:'Recorrido limpio',how:'Termina la pista de saltos del centro ecuestre sin faltas, a 90 cm o más.',m:'g',c:40,w:'campo'},
  {id:'rutas',n:'Explorador del Lune',how:'Termina las cinco rutas del valle (a caballo, a pie o en bici).',m:'s',c:40,w:'campo'});
const HR_LV=[{h:0.6,n:'Pequeños',s:'60 cm'},{h:0.9,n:'Medio',s:'90 cm'},{h:1.2,n:'Alto',s:'1,20 m'}];
const HR_KN={0:'muro',1:'seto',2:'valla',4:'pretil',5:'pared',6:'valla'};
// the show-jumping course, in the arena's own metres (u along it, v across, the stables on +v); d:1 = jumped towards −u
const HR_J=[{u:-14,v:-12,d:0,t:'v'},{u:2,v:-12,d:0,t:'o'},{u:18,v:-12,d:0,t:'m'},{u:16,v:12,d:1,t:'v'},{u:0,v:12,d:1,t:'r'},{u:-16,v:12,d:1,t:'o'},{u:-8,v:0,d:0,t:'t'},{u:10,v:0,d:0,t:'v'}];
const HR_JN={v:'Vertical',o:'Oxer',m:'Muro',r:'Ría',t:'Triple barra'};
const HR_CP=[[-26,-12],[-14,-12],[2,-12],[18,-12],[26,-10],[29,-4],[29,4],[26,10],[16,12],[0,12],[-16,12],[-24,11],[-28,6],[-25,1],[-20,0],[-8,0],[10,0],[24,0]];
const HR_MODE={ride:'a caballo',walk:'a pie',bike:'en bici'};
const HR_MED={ride:[10,7.5,5],walk:[5,3.8,2.5],bike:[8,6,4]};   // average speed (m/s) for gold, silver and bronze on a route

function hrLoad(){ try{ HR.st=JSON.parse(store.get('vg_hr')||'{}')||{}; }catch(e){ HR.st={}; } HR.st.sj=HR.st.sj||{}; HR.st.rt=HR.st.rt||{}; HR.st.done=HR.st.done||{}; if(HR.st.lv!==undefined) HR.lv=HR.st.lv; }
function hrSave(){ HR.st.lv=HR.lv; store.set('vg_hr',JSON.stringify(HR.st)); }

/* ---------- walls: a grid of segments ---------- */
function hrWallsLoad(){ const J=W.X&&W.X['walls.json']; if(!J||!J.w) return;
  for(const [k,h10,p] of J.w){ if(k===3) continue; const h=h10/10, th=k===1?0.5:k===0?0.3:0.06;
    for(let i=0;i+3<p.length;i+=2){ const x0=p[i]/4, z0=p[i+1]/4, x1=p[i+2]/4, z1=p[i+3]/4; if(Math.abs(x1-x0)+Math.abs(z1-z0)<0.05) continue; HR.A.push(x0,z0,x1,z1,h,th,k,NaN); } } }
function hrGridBuild(){ const A=HR.A.concat(HR.Ab), n=A.length/8; HR.seg=new Float32Array(A); HR.n=n; HR.grid=new Map(); const cs=HR.cs;
  for(let i=0;i<n;i++){ const o=i*8, m=A[o+5]+1.5; const x0=Math.min(A[o],A[o+2])-m, x1=Math.max(A[o],A[o+2])+m, z0=Math.min(A[o+1],A[o+3])-m, z1=Math.max(A[o+1],A[o+3])+m;
    for(let a=Math.floor(x0/cs);a<=Math.floor(x1/cs);a++) for(let b=Math.floor(z0/cs);b<=Math.floor(z1/cs);b++){ const k=a*100003+b; let L=HR.grid.get(k); if(!L) HR.grid.set(k,L=[]); L.push(i); } } }
// walls don't count indoors, in kart races, circuits and timed bike runs (the tracks were drawn without them)
function hrOff(){ return !HR.seg||!!S.interior||(raceNow()&&!(HR.sj&&HR.sj.st==='run')); }
// segment i seen from (x,z): [distance to its face, t along it, normal towards (x,z) x, z, nearest point x, z]
function hrSegD(i,x,z){ const s=HR.seg, o=i*8, ax=s[o], az=s[o+1], dx=s[o+2]-ax, dz=s[o+3]-az, L2=dx*dx+dz*dz;
  let t=L2>1e-6?((x-ax)*dx+(z-az)*dz)/L2:0; t=t<0?0:t>1?1:t; const px=ax+dx*t, pz=az+dz*t, ex=x-px, ez=z-pz, d=Math.hypot(ex,ez);
  let nx, nz; if(d>1e-4){ nx=ex/d; nz=ez/d; } else { const L=Math.sqrt(L2)||1; nx=-dz/L; nz=dx/L; }
  return [d-s[o+5],t,nx,nz,px,pz]; }
function hrTop(i,t,px,pz){ const s=HR.seg, o=i*8; return isNaN(s[o+7])?W.terrain(px,pz)+s[o+4]:s[o+4]+(s[o+7]-s[o+4])*t; }
function hrBot(i,top){ return isNaN(HR.seg[i*8+7])?-1e9:top-2.4; }
function hrCell(x,z){ return HR.grid.get(Math.floor(x/HR.cs)*100003+Math.floor(z/HR.cs)); }
// the first wall, hedge or fence within r of (x,z) whose top is above y (and reaches down to it); -1 = none
function hrWallAt(x,z,y,r){ if(hrOff()) return -1; const L=hrCell(x,z); if(!L) return -1;
  for(const i of L){ const q=hrSegD(i,x,z); if(q[0]>=r) continue; const top=hrTop(i,q[1],q[4],q[5]); if(y<top&&y+1.7>hrBot(i,top)) return i; } return -1; }
// on foot (collide): out of every wall you are in; a kerb-high one (30 cm) you just step over
function hrPush(x,z,y,r){ if(hrOff()) return null; const L=hrCell(x,z); if(!L) return null; let mv=false;
  for(const i of L){ const q=hrSegD(i,x,z); if(q[0]>=r) continue; const top=hrTop(i,q[1],q[4],q[5]); if(y>=top-0.3||y+1.7<=hrBot(i,top)) continue;
    const th=HR.seg[i*8+5]; x=q[4]+q[2]*(th+r+0.01); z=q[5]+q[3]*(th+r+0.01); mv=true; } return mv?[x,z]:null; }
// how far (x,z) is inside walls, for the getting-unstuck rules of T1
function hrPen(x,z,y,r){ if(hrOff()) return 0; const L=hrCell(x,z); if(!L) return 0; let p=0;
  for(const i of L){ const q=hrSegD(i,x,z); if(q[0]>=r) continue; const top=hrTop(i,q[1],q[4],q[5]); if(y+0.3<top&&y+1.7>hrBot(i,top)) p+=r-q[0]; } return p; }

/* ---------- bridges: walkable decks of short platforms, parapets, and a stone body with arches ---------- */
function hrAlong(P,cum,s){ let i=0; while(i<cum.length-2&&cum[i+1]<s) i++; const L=cum[i+1]-cum[i]||1, u=Math.min(1,Math.max(0,(s-cum[i])/L)); const a=P[i], b=P[i+1];
  return [a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u,Math.atan2(b[1]-a[1],b[0]-a[0])]; }
function hrDeckY(x,z,y){ let best=null; for(const p of platsNear(x,z)){ if(!p.br||!insidePlat(p,x,z,0.05)) continue; if(p.top>y-2.5&&p.top<y+1.6&&(best===null||p.top>best)) best=p.top; } return best; }
// the ground for horses and bikes: a bridge deck where there is one
function hrTer(x,z,y){ if(HR.br.length){ const d=hrDeckY(x,z,y); if(d!==null) return d; } return W.terrain(x,z); }
function hrStoneMat(){ if(HR.sm) return HR.sm; const t=luStoneTex('#a39a8a',41,0); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(0.33,0.33); HR.sm=new THREE.MeshLambertMaterial({map:t}); return HR.sm; }
function hrBridges(){ for(const B of (W.BRIDGES||[])){ const P=B.p; if(!P||P.length<2) continue;
    const cum=[0]; for(let i=1;i<P.length;i++) cum.push(cum[i-1]+Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1])); const L=cum[cum.length-1]; if(L<6) continue;
    const a0=Math.atan2(P[1][1]-P[0][1],P[1][0]-P[0][0]), n=P.length, a1=Math.atan2(P[n-1][1]-P[n-2][1],P[n-1][0]-P[n-2][0]);
    const y0=Math.max(W.terrain(P[0][0],P[0][1]),W.terrain(P[0][0]-Math.cos(a0)*3,P[0][1]-Math.sin(a0)*3)), y1=Math.max(W.terrain(P[n-1][0],P[n-1][1]),W.terrain(P[n-1][0]+Math.cos(a1)*3,P[n-1][1]+Math.sin(a1)*3));
    const dv=/devil/i.test(B.n||'')&&B.k==='bridleway', hump=dv?1.3:0, yAt=s=>y0+(y1-y0)*s/L+hump*Math.sin(Math.PI*Math.min(1,Math.max(0,s/L)));
    let gmin=1e9; for(let s=0;s<=L;s+=1.5){ const q=hrAlong(P,cum,s); gmin=Math.min(gmin,W.terrain(q[0],q[1])); }
    if(Math.min(y0,y1)-gmin<1.0) continue;    // nothing under it worth a bridge: the ground carries the road
    const w=Math.max(B.w||3,dv?3.7:2.6), br={B,P,cum,L,w,yAt,dv,gmin,n:B.n||''}; HR.br.push(br);
    for(let s=0;s<L;s+=1){ const s1=Math.min(L,s+1), q=hrAlong(P,cum,(s+s1)/2); const p=addPlat(q[0],q[1],q[2],(s1-s)+0.3,w+0.3,yAt((s+s1)/2),0.6); p.br=1; }
    for(const [ex,ez,ea,ey] of [[P[0][0],P[0][1],a0+Math.PI,y0],[P[n-1][0],P[n-1][1],a1,y1]]){ const c=Math.cos(ea), s=Math.sin(ea), ta=W.terrain(ex+c*8,ez+s*8);
      for(let d=0.5;d<8;d+=1){ const x=ex+c*d, z=ez+s*d, top=ey+(ta-ey)*d/8; if(top>W.terrain(x,z)+0.04){ const p=addPlat(x,z,ea,1.3,w+0.3,top,0.6); p.br=1; } } }
    for(const sd of [-1,1]) for(let s=0;s<L-0.01;s+=2){ const s1=Math.min(L,s+2), qa=hrAlong(P,cum,s), qb=hrAlong(P,cum,s1), o=sd*(w/2+0.18);
      HR.Ab.push(qa[0]-Math.sin(qa[2])*o,qa[1]+Math.cos(qa[2])*o,qb[0]-Math.sin(qb[2])*o,qb[1]+Math.cos(qb[2])*o,yAt(s)+1.05,0.18,4,yAt(s1)+1.05); }
    try{ hrBridgeMesh(br); }catch(e){ console.warn('puente',e); } } }
// the side view of the bridge (s along, y up) with its arches, extruded across: the deck, the parapets and a darker road on top
function hrBridgeMesh(br){ const P=br.P, n=P.length, L=Math.hypot(P[n-1][0]-P[0][0],P[n-1][1]-P[0][1]), a=Math.atan2(P[n-1][1]-P[0][1],P[n-1][0]-P[0][0]), k=L/br.L, yAt=s=>br.yAt(s/k);
  const V2=(x,y)=>new THREE.Vector2(x,y), bot=br.gmin-2.5, high=Math.min(yAt(0),yAt(L))-br.gmin>2.6;
  const sh=new THREE.Shape(); sh.moveTo(0,bot); for(let s=0;s<=L+1e-6;s+=Math.min(1,L/8)) sh.lineTo(s,yAt(Math.min(L,s))); sh.lineTo(L,yAt(L)); sh.lineTo(L,bot); sh.lineTo(0,bot);
  if(high){ const spans=br.dv?[[0.10,0.43],[0.47,0.80],[0.84,0.95]]:(()=>{ const m=Math.max(1,Math.round(L/24)), r=[]; const a0=0.06, a1=0.94, pw=0.04; for(let i=0;i<m;i++){ const u0=a0+(a1-a0)*i/m+(i?pw/2:0), u1=a0+(a1-a0)*(i+1)/m-(i<m-1?pw/2:0); r.push([u0,u1]); } return r; })();
    for(const [u0,u1] of spans){ const sl=u0*L, sr=u1*L, sc=(sl+sr)/2, hs=(sr-sl)/2; let g=1e9; for(let s=sl;s<=sr;s+=1){ const q=hrAlong(P,br.cum,s/k); g=Math.min(g,W.terrain(q[0],q[1])); }
      const crown=yAt(sc)-(br.dv?1.0:1.2), b0=g-1.5; if(crown-b0<1.5) continue; const rv=Math.min(hs,crown-b0-0.3), st=crown-rv;
      const pts=[V2(sl,b0),V2(sl,st)]; for(let i=1;i<16;i++){ const th=Math.PI-Math.PI*i/16; pts.push(V2(sc+hs*Math.cos(th),st+rv*Math.sin(th))); } pts.push(V2(sr,st),V2(sr,b0)); sh.holes.push(new THREE.Path(pts)); } }
  else { sh.curves.length=0; sh.moveTo(0,yAt(0)-1.1); for(let s=0;s<=L+1e-6;s+=Math.min(1,L/8)) sh.lineTo(s,yAt(Math.min(L,s))); sh.lineTo(L,yAt(L)); sh.lineTo(L,yAt(L)-1.1); sh.lineTo(0,yAt(0)-1.1); }
  const M=hrStoneMat(), grp=new THREE.Group(); grp.position.set(P[0][0],0,P[0][1]); grp.rotation.y=-a; grp.name='puente';
  const ex=(shape,depth,z,mat)=>{ const g=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,steps:1,curveSegments:4}); g.translate(0,0,z-depth/2); const m=new THREE.Mesh(g,mat); m.castShadow=m.receiveShadow=true; grp.add(m); return m; };
  ex(sh,br.w,0,M);
  const band=(lo,hi)=>{ const s2=new THREE.Shape(); s2.moveTo(0,yAt(0)+lo); for(let s=0;s<=L+1e-6;s+=Math.min(1,L/8)) s2.lineTo(s,yAt(Math.min(L,s))+hi); s2.lineTo(L,yAt(L)+hi); s2.lineTo(L,yAt(L)+lo); for(let s=L;s>=0;s-=Math.min(1,L/8)) s2.lineTo(s,yAt(Math.max(0,s))+lo); return s2; };
  for(const sd of [-1,1]) ex(band(-0.05,1.05),0.36,sd*(br.w/2+0.18),M);
  if(!br.dv) ex(band(-0.03,0.03),br.w-0.2,0,new THREE.MeshLambertMaterial({color:Cc(/footway|path|bridleway|track/.test(br.B.k)?'#8d8676':'#55565a')}));
  scene.add(grp); br.grp=grp; }

/* ---------- gates: wooden and steel field gates, kissing gates and stiles, that open when you come near ---------- */
function hrGateGeo(k){ const g=new THREE.Group(), M=c=>new THREE.MeshLambertMaterial({color:Cc(c)});
  const box=(w,h,d,x,y,z,c,rz)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),M(c)); m.position.set(x,y,z); if(rz) m.rotation.z=rz; g.add(m); };
  const Lr=k===2?1.2:3.2;
  if(k===0){ const c='#8c7254'; for(const y of [0.22,0.45,0.68,0.91,1.12]) box(Lr,0.075,0.05,Lr/2,y,0,c); box(0.09,1.12,0.07,0.05,0.62,0,c); box(0.08,1.12,0.07,Lr-0.05,0.62,0,c);
    const dx=Lr-0.3, dy=0.85; box(Math.hypot(dx,dy),0.07,0.05,Lr/2,0.66,0.02,c,Math.atan2(dy,dx)); }
  else if(k===1){ const c='#b7bcc0'; for(const y of [0.2,0.42,0.64,0.86,1.08]) box(Lr,0.045,0.045,Lr/2,y,0,c); box(0.055,1.08,0.055,0.03,0.6,0,c); box(0.055,1.08,0.055,Lr-0.03,0.6,0,c); for(const x of [0.8,1.6,2.4]) box(0.03,0.88,0.03,x,0.64,0,c); }
  else if(k===2){ const c='#3f5a46'; for(const y of [0.3,0.65,1.0]) box(Lr,0.04,0.04,Lr/2,y,0,c); for(let x=0.12;x<Lr;x+=0.16) box(0.025,0.74,0.025,x,0.64,0,c); box(0.05,1.05,0.05,0.03,0.55,0,c); box(0.05,1.05,0.05,Lr-0.03,0.55,0,c); }
  else { const c='#7d6a52'; box(0.95,0.06,0.3,0.48,0.38,0,c); box(0.08,1.0,0.08,0.02,0.5,0,c); box(0.08,1.0,0.08,0.94,0.5,0,c); }
  const geo=mergeGroup(g); geo.userData.Lr=k===3?0.96:Lr; return geo; }
function hrGatesBuild(){ const G=(W.GATES||[]).filter(g=>!(HR.ar&&hrInArena(g[0],g[1],4))); if(!G.length) return;
  const mat=new THREE.MeshLambertMaterial({vertexColors:true}), geos=[0,1,2,3].map(hrGateGeo), cnt=[0,0,0,0];
  for(const g of G) cnt[g[4]]++;
  const IM=geos.map((geo,k)=>{ const m=new THREE.InstancedMesh(geo,mat,Math.max(1,cnt[k])); m.count=cnt[k]; m.castShadow=true; m.frustumCulled=false; scene.add(m); return m; });
  const pg=new THREE.BoxGeometry(0.2,1.35,0.2); pg.translate(0,0.6,0); const PM=new THREE.InstancedMesh(pg,new THREE.MeshLambertMaterial({color:Cc('#6e5e4c')}),G.length*2); PM.frustumCulled=false; PM.castShadow=true; scene.add(PM);
  const o=new THREE.Object3D(), ix=[0,0,0,0]; let pi=0;
  for(const g of G){ const [x,z,a,w,k]=g, c=Math.cos(a), s=Math.sin(a), gate={x,z,a,w,k,ang:0,o:0,tt:0,sd:1,i:ix[k]++,hx:x-c*(w/2-0.1),hz:z-s*(w/2-0.1)}; gate.hy=W.terrain(gate.hx,gate.hz);
    HR.gates.push(gate); const key=Math.floor(x/50)*100003+Math.floor(z/50); let L=HR.gGrid.get(key); if(!L) HR.gGrid.set(key,L=[]); L.push(gate);
    for(const sd of [-1,1]){ const px=x+c*sd*w/2, pz=z+s*sd*w/2; o.position.set(px,W.terrain(px,pz),pz); o.rotation.set(0,-a,0); o.scale.set(1,1,1); o.updateMatrix(); PM.setMatrixAt(pi++,o.matrix); }
    hrGateSet(gate,IM,geos); }
  HR.gIM=IM; HR.gGeo=geos; for(const m of IM) m.instanceMatrix.needsUpdate=true; }
const HR_O=new THREE.Object3D();
function hrGateSet(g,IM,geos){ IM=IM||HR.gIM; geos=geos||HR.gGeo; const o=HR_O; o.position.set(g.hx,g.hy+0.02,g.hz); o.rotation.set(0,-g.a+g.ang,0); o.scale.set((g.w-0.2)/geos[g.k].userData.Lr,1,1); o.updateMatrix(); IM[g.k].setMatrixAt(g.i,o.matrix); IM[g.k].instanceMatrix.needsUpdate=true; }
// who opens the gates: you, or what you ride or drive, a little further ahead the faster you go
function hrMe(){ if(P.horse) return {x:P.horse.x,z:P.horse.z,r:9}; if(P.buggy) return {x:P.buggy.x,z:P.buggy.z,r:11}; if(S.mode==='bike'&&BK.b) return {x:BK.b.x,z:BK.b.z,r:8}; return {x:P.x,z:P.z,r:5.5}; }
function hrGatesTick(dt){ if(!HR.gIM) return; const me=hrMe(), cx=Math.floor(me.x/50), cz=Math.floor(me.z/50);
  for(let i=-1;i<=1;i++) for(let j=-1;j<=1;j++){ const L=HR.gGrid.get((cx+i)*100003+(cz+j)); if(!L) continue;
    for(const g of L){ if(g.k===3) continue; const d=Math.hypot(me.x-g.x,me.z-g.z); if(d<me.r){ if(!g.o){ g.o=1; g.sd=Math.sign((me.x-g.x)*-Math.sin(g.a)+(me.z-g.z)*Math.cos(g.a))||1; hrSnd('gate',d); HR.gAct.add(g); } g.tt=2.2; } } }
  for(const g of HR.gAct){ if(g.o){ g.tt-=dt; if(g.tt<=0&&Math.hypot(me.x-g.x,me.z-g.z)>me.r) g.o=0; }
    const tgt=g.o?g.sd*1.45:0, da=tgt-g.ang; if(Math.abs(da)<1e-3){ if(!g.o){ g.ang=0; hrGateSet(g); HR.gAct.delete(g); } continue; }
    g.ang+=Math.sign(da)*Math.min(Math.abs(da),dt*2.3); hrGateSet(g); } }
function hrSnd(k,d){ if(!AC||!master) return; const t=AC.currentTime, vol=0.18/(1+(d||0)*0.12), o=AC.createOscillator(), g=AC.createGain(); o.connect(g); g.connect(master);
  if(k==='gate'){ o.type='sawtooth'; o.frequency.setValueAtTime(230,t); o.frequency.linearRampToValueAtTime(140,t+0.45); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(vol*0.35,t+0.05); g.gain.linearRampToValueAtTime(0,t+0.5); o.start(t); o.stop(t+0.55); }
  else if(k==='pole'){ o.type='triangle'; o.frequency.setValueAtTime(600,t); o.frequency.exponentialRampToValueAtTime(200,t+0.3); g.gain.setValueAtTime(vol*1.8,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.35); o.start(t); o.stop(t+0.4); }
  else { o.type='sine'; o.frequency.setValueAtTime(k==='bell'?880:660,t); g.gain.setValueAtTime(vol*1.4,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.6); o.start(t); o.stop(t+0.65); } }

/* ---------- on foot: over a wall or a fence, or through a hedge ---------- */
function hrClimbNear(){ if(S.mode!=='walk'||P.swim||HR.cl||hrOff()) return null; const fx=Math.cos(P.yaw), fz=Math.sin(P.yaw), L=hrCell(P.x,P.z); if(!L) return null; let best=-1, bd=1.25;
  for(const i of L){ const k=HR.seg[i*8+6]; if(k===4||k===5) continue; const q=hrSegD(i,P.x,P.z); if(q[0]>=bd) continue; if(-(q[2]*fx+q[3]*fz)<0.3) continue;
    const top=hrTop(i,q[1],q[4],q[5]); if(top-P.y<0.3) continue; best=i; bd=q[0]; }
  if(best<0) return null; const k=HR.seg[best*8+6]; return {k:'hrClimb',ref:best,label:k===1?'Pasar el seto':k===0?'Saltar el muro':'Saltar la valla'}; }
function hrClimb(i){ const q=hrSegD(i,P.x,P.z), th=HR.seg[i*8+5], top=hrTop(i,q[1],q[4],q[5]); const tx=q[4]-q[2]*(th+0.6), tz=q[5]-q[3]*(th+0.6), tg=W.terrain(tx,tz);
  if(bldAt(tx,tz,0.3)||W.waterLevel(tx,tz)-tg>0.6||W.poolAt(tx,tz)){ tip('Al otro lado no hay sitio para bajar'); return; }
  const k=HR.seg[i*8+6]; HR.cl={t:0,T:k===1?1.15:0.85,x0:P.x,z0:P.z,y0:P.y,x1:tx,z1:tz,y1:groundAt(tx,tz,top+1),top:top+(k===1?0.1:0.3)}; P.vx=P.vz=P.vy=0; blip('jump');
  if(k===1) tip('Te abres paso entre las ramas del seto…',1400); }
function hrClimbTick(dt){ const c=HR.cl; if(!c) return; if(S.mode!=='walk'){ HR.cl=null; return; } c.t+=dt; const u=Math.min(1,c.t/c.T), e=u*u*(3-2*u);
  P.x=c.x0+(c.x1-c.x0)*e; P.z=c.z0+(c.z1-c.z0)*e; const base=c.y0+(c.y1-c.y0)*e; P.y=base+Math.max(0,c.top-Math.max(c.y0,c.y1))*Math.sin(Math.PI*u); P.vx=P.vz=0; P.vy=0;
  if(u>=1){ HR.cl=null; P.y=c.y1; P.onGround=true; } }

/* ---------- horses: jumping walls and fences ---------- */
// the first thing to jump in front of the horse within maxd metres: [distance, height its feet must clear over where it stands now, jump of the course or null]
function hrAhead(h,maxd,auto){ const c=Math.cos(h.yaw), s=Math.sin(h.yaw); for(let d=0.8;d<=maxd;d+=0.5){ const x=h.x+c*d, z=h.z+s*d, g=W.terrain(x,z);
    const j=hrJumpAt(x,z); if(j) return [d,j.g+j.top-0.35-h.y,j]; const i=hrWallAt(x,z,g+0.05,0.35); if(i>=0){ if(auto&&HR.seg[i*8+6]>=5) return null; const q=hrSegD(i,x,z); return [d,hrTop(i,q[1],q[4],q[5])-h.y-0.35,null]; } } return null; }
// the take-off: the top of the jump 30 cm over what is ahead, which it reaches after vy/18 s (legs tucked count for 25-35 cm)
function hrJumpV(h){ if(!WP.campo) return 4.6; const v=Math.max(3,Math.abs(h.spd)), a=hrAhead(h,Math.min(9,1.5+v*0.8)); if(!a) return 5.2;
  const need=Math.max(0.35,a[1]+0.14); if(need>1.8){ tip('Demasiado alto para saltarlo: busca una cancela o un hueco',2600); return 5.2; }
  return clamp(Math.sqrt(36*(need+0.3)),4.6,8.6); }
// in the easy mode the horse takes off by itself at the right moment
function hrRide(h,dt){ if(!WP.campo||h.air) return; HR.jT-=dt; if(!ezOn()||h.spd<3.5||HR.jT>0) return; HR.jT=0.08;
  const a=hrAhead(h,Math.min(8,1.5+h.spd*0.75),1); if(!a||a[1]+0.14>1.8) return; const vy=Math.sqrt(36*(Math.max(0.35,a[1]+0.14)+0.3)); if(a[0]<=h.spd*vy/18+0.3){ inp.jumpQ=true; HR.jT=0.6; } }

/* ---------- the riding centre: arena, rails, stables and the course ---------- */
function hrArF(A,u,v){ const c=Math.cos(A.aa), s=Math.sin(A.aa); return [A.cx+c*u-s*v,A.cz+s*u+c*v]; }
function hrArL(A,x,z){ const c=Math.cos(A.aa), s=Math.sin(A.aa), dx=x-A.cx, dz=z-A.cz; return [dx*c+dz*s,-dx*s+dz*c]; }
function hrInArena(x,z,m){ const A=HR.ar; if(!A) return false; const q=hrArL(A,x,z); return Math.abs(q[0])<36+(m||0)&&q[1]>-24-(m||0)&&q[1]<36+(m||0); }
function hrArenaHit(x,z,m){ return hrInArena(x,z,m||0); }
function hrSiteOK(x,z,g){ if(W.waterLevel(x,z)>g-0.2||(W.poolAt&&W.poolAt(x,z))||W.surfAt(x,z)!==10) return false; if(bldAt(x,z,5)) return false;
  if(typeof bkPkGround==='function'&&BK.pk&&bkPkGround(x,z)!==null) return false; if(flPadY(x,z)!==null) return false; if(W.courtAt&&W.courtAt(x,z,6)) return false;
  for(const q of (W.PARKING||[])) if(Math.hypot(q.c[0]-x,q.c[1]-z)<q.L/2+15) return false; return true; }
function hrArenaFind(){ const a0=WP.campo.arena||[0,0]; let best=null;
  for(let gx=-390;gx<=390;gx+=30) for(let gz=-390;gz<=390;gz+=30){ if(gx*gx+gz*gz>390*390) continue; const cx=a0[0]+gx, cz=a0[1]+gz;
    for(let ai=0;ai<6;ai++){ const A={cx,cz,aa:ai*Math.PI/6}; let lo=1e9, hi=-1e9, bad=false, wl=0;
      for(let u=-36;u<=36&&!bad;u+=8) for(let v=-24;v<=36;v+=7.5){ const [x,z]=hrArF(A,u,v), g=W.terrain(x,z); lo=Math.min(lo,g); hi=Math.max(hi,g); if(hi-lo>2.6||!hrSiteOK(x,z,g)){ bad=true; break; } if(hrWallAt(x,z,g+0.1,3.5)>=0) wl++; }
      if(bad) continue; const sc=Math.hypot(gx,gz)+wl*9+(hi-lo)*25; if(!best||sc<best.sc) best={sc,cx,cz,aa:A.aa,wl,dh:hi-lo}; } }
  return best; }
// the walls drawn from walls.json that fall inside the arena go (before they are drawn)
function hrClearArenaWalls(){ const J=W.X&&W.X['walls.json']; if(!J||!J.w) return; const out=[];
  for(const w of J.w){ const p=w[2]; let hit=false; const runs=[]; let cur=[];
    for(let i=0;i+3<p.length;i+=2){ const x0=p[i]/4, z0=p[i+1]/4, x1=p[i+2]/4, z1=p[i+3]/4, n=Math.max(1,Math.ceil(Math.hypot(x1-x0,z1-z0)));
      for(let s=i?1:0;s<=n;s++){ const x=x0+(x1-x0)*s/n, z=z0+(z1-z0)*s/n; if(hrInArena(x,z,3)){ hit=true; if(cur.length>=4) runs.push(cur); cur=[]; } else cur.push(Math.round(x*4),Math.round(z*4)); } }
    if(cur.length>=4) runs.push(cur); if(!hit) out.push(w); else for(const r of runs) out.push([w[0],w[1],r]); }
  J.w=out; }
function hrSignTex(title,sub,bg){ return canvasTex(512,256,(g,w,h)=>{ g.fillStyle='#5b4632'; g.fillRect(0,0,w,h); g.fillStyle=bg||'#f6f1e4'; g.fillRect(12,12,w-24,h-24);
  g.fillStyle='#24402c'; g.font='bold 44px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; const T=String(title); let fs=44; while(fs>22&&g.measureText(T).width>w-50){ fs-=2; g.font='bold '+fs+'px sans-serif'; } g.fillText(T,w/2,sub?h*0.38:h/2);
  if(sub){ g.fillStyle='#4a4a44'; g.font='26px sans-serif'; let f2=26; while(f2>14&&g.measureText(sub).width>w-50){ f2-=1; g.font=f2+'px sans-serif'; } g.fillText(sub,w/2,h*0.68); } }); }
// a board on two posts, facing the angle yaw
function hrBoard(x,z,yaw,title,sub){ const g=new THREE.Group(), y=W.terrain(x,z), wood=new THREE.MeshLambertMaterial({color:Cc('#5b4632')});
  for(const sd of [-1,1]){ const p=new THREE.Mesh(new THREE.BoxGeometry(0.1,1.6,0.1),wood); p.position.set(sd*0.62,0.8,0); g.add(p); }
  const pn=new THREE.Mesh(new THREE.BoxGeometry(1.4,0.7,0.06),[wood,wood,wood,wood,new THREE.MeshLambertMaterial({map:hrSignTex(title,sub)}),new THREE.MeshLambertMaterial({map:hrSignTex(title,sub)})]); pn.position.y=1.35; g.add(pn);
  g.position.set(x,y,z); g.rotation.y=-yaw+Math.PI/2; scene.add(g); return g; }
function hrStripeTex(c1,c2){ return canvasTex(128,16,(g,w,h)=>{ for(let i=0;i<8;i++){ g.fillStyle=i%2?c2:c1; g.fillRect(i*w/8,0,w/8,h); } }); }
function hrArenaBuild(A){ const grp=new THREE.Group(); grp.name='picadero'; scene.add(grp); A.grp=grp; A.L=64; A.W=40;
  // sand, following the ground
  const nu=33, nv=21, pos=[], uv=[], idx=[]; for(let j=0;j<nv;j++) for(let i=0;i<nu;i++){ const u=-32+64*i/(nu-1), v=-20+40*j/(nv-1), [x,z]=hrArF(A,u,v); pos.push(x,W.terrain(x,z)+0.05,z); uv.push(u/6,v/6); }
  for(let j=0;j<nv-1;j++) for(let i=0;i<nu-1;i++){ const a=j*nu+i; idx.push(a,a+nu,a+1,a+1,a+nu,a+nu+1); }
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); sg.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); sg.setIndex(idx); sg.computeVertexNormals();
  const st=canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#c9ab7c'; g.fillRect(0,0,w,h); for(let i=0;i<2600;i++){ g.fillStyle=Math.random()<0.5?'rgba(120,90,55,.18)':'rgba(255,240,210,.22)'; g.fillRect(Math.random()*w,Math.random()*h,2,2); } }); st.wrapS=st.wrapT=THREE.RepeatWrapping;
  const sand=new THREE.Mesh(sg,new THREE.MeshLambertMaterial({map:st})); sand.receiveShadow=true; grp.add(sand);
  // white post-and-rail fence (the gap in front of the stables), the stables, the sign
  const white=new THREE.MeshLambertMaterial({color:Cc('#f4f2ec')}); const sides=[[[-32,-20],[32,-20]],[[32,-20],[32,20]],[[32,20],[3,20]],[[-3,20],[-32,20]],[[-32,20],[-32,-20]]];
  for(const [a,b] of sides){ const [x0,z0]=hrArF(A,a[0],a[1]), [x1,z1]=hrArF(A,b[0],b[1]), L=Math.hypot(x1-x0,z1-z0), n=Math.max(1,Math.round(L/2.5)), ang=Math.atan2(z1-z0,x1-x0);
    for(let i=0;i<=n;i++){ const x=x0+(x1-x0)*i/n, z=z0+(z1-z0)*i/n; const p=new THREE.Mesh(new THREE.BoxGeometry(0.12,1.25,0.12),white); p.position.set(x,W.terrain(x,z)+0.62,z); grp.add(p); }
    for(let i=0;i<n;i++){ const xa=x0+(x1-x0)*i/n, za=z0+(z1-z0)*i/n, xb=x0+(x1-x0)*(i+1)/n, zb=z0+(z1-z0)*(i+1)/n, ya=W.terrain(xa,za), yb=W.terrain(xb,zb), l=Math.hypot(xb-xa,zb-za);
      for(const hh of [0.55,1.08]){ const r=new THREE.Mesh(new THREE.BoxGeometry(l,0.1,0.05),white); r.position.set((xa+xb)/2,(ya+yb)/2+hh,(za+zb)/2); r.rotation.set(0,-ang,Math.atan2(yb-ya,l)); r.rotation.order='YZX'; grp.add(r); } }
    HR.A.push(x0,z0,x1,z1,1.15,0.06,6,NaN); }
  const SW=20, SD=7, sv=30, [sx,sz]=hrArF(A,0,sv), sy=Math.min(W.terrain(sx,sz),...[[-10,sv-3.5],[10,sv-3.5],[-10,sv+3.5],[10,sv+3.5]].map(q=>{ const p=hrArF(A,q[0],q[1]); return W.terrain(p[0],p[1]); }));
  const M=luMats(), sb=new THREE.Group(); sb.position.set(sx,sy,sz); sb.rotation.y=-A.aa; grp.add(sb);
  const wall=new THREE.Mesh(new THREE.BoxGeometry(SW,3.6,SD),M.wall); wall.position.y=1.8-0.4; wall.castShadow=wall.receiveShadow=true; sb.add(wall);
  for(const sd of [-1,1]){ const r=new THREE.Mesh(new THREE.BoxGeometry(SW+0.6,0.12,SD/2/Math.cos(0.5)+0.5),M.slate); r.position.set(0,3.2+SD/4*Math.tan(0.5),sd*SD/4); r.rotation.x=sd*0.5; r.castShadow=true; sb.add(r); }
  const gab=new THREE.Shape(); gab.moveTo(-SD/2,0); gab.lineTo(SD/2,0); gab.lineTo(0,SD/2*Math.tan(0.5)); gab.lineTo(-SD/2,0);
  for(const sd of [-1,1]){ const gm=new THREE.Mesh(new THREE.ShapeGeometry(gab),HR.gm||(HR.gm=new THREE.MeshLambertMaterial({map:M.gable.map,side:THREE.DoubleSide}))); gm.position.set(sd*SW/2,3.2,0); gm.rotation.y=sd*Math.PI/2; sb.add(gm); }
  const green=new THREE.MeshLambertMaterial({color:Cc('#2f5a3c')}), dark=new THREE.MeshLambertMaterial({color:Cc('#2a2622')});
  for(let i=0;i<5;i++){ const u=-8+4*i; const d1=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.15,0.08),green); d1.position.set(u,0.6,-SD/2-0.03); sb.add(d1); const d0=new THREE.Mesh(new THREE.BoxGeometry(1.4,1.0,0.05),dark); d0.position.set(u,1.75,-SD/2-0.01); sb.add(d0); }
  for(const [a,b] of [[[-SW/2,sv-SD/2],[SW/2,sv-SD/2]],[[SW/2,sv-SD/2],[SW/2,sv+SD/2]],[[SW/2,sv+SD/2],[-SW/2,sv+SD/2]],[[-SW/2,sv+SD/2],[-SW/2,sv-SD/2]]]){ const p0=hrArF(A,a[0],a[1]), p1=hrArF(A,b[0],b[1]); HR.A.push(p0[0],p0[1],p1[0],p1[1],3.4,0.2,5,NaN); }
  const sg2=hrArF(A,6,22.4); hrBoard(sg2[0],sg2[1],A.aa+Math.PI/2,'Centro ecuestre','Pista de saltos · 8 obstáculos');
  // the start (red flag on the right, white on the left) and the finish
  const flag=(u,v,col)=>{ const [x,z]=hrArF(A,u,v), y=W.terrain(x,z); const p=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,1.8,6),white); p.position.set(x,y+0.9,z); grp.add(p);
    const f=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.35),new THREE.MeshLambertMaterial({color:Cc(col),side:THREE.DoubleSide})); f.position.set(x,y+1.6,z); f.rotation.y=-A.aa; grp.add(f); };
  for(const [u,v] of [[-26,-12],[24,0]]){ flag(u,v+3,'#d23c3c'); flag(u,v-3,'#ffffff'); }
  A.len=0; for(let i=1;i<HR_CP.length;i++) A.len+=Math.hypot(HR_CP[i][0]-HR_CP[i-1][0],HR_CP[i][1]-HR_CP[i-1][1]); A.ta=Math.ceil(A.len/5.5);
  hrJumpsBuild(); }
function hrJumpsBuild(){ const A=HR.ar; if(!A) return; if(A.jg){ A.grp.remove(A.jg); A.jg.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); }
  const jg=new THREE.Group(); A.grp.add(jg); A.jg=jg; const H=HR_LV[HR.lv].h, white=new THREE.MeshLambertMaterial({color:Cc('#f7f5ef')});
  const cols=[['#d23c3c','#ffffff'],['#2f6fd6','#ffffff'],['#2e9a52','#ffffff'],['#f0b429','#2a2a2a']];
  A.jumps=HR_J.map((J,n)=>{ const a=A.aa+(J.d?Math.PI:0), [x,z]=hrArF(A,J.u,J.v), g=W.terrain(x,z), c=Math.cos(a), s=Math.sin(a), grp=new THREE.Group(); grp.position.set(x,g,z); grp.rotation.y=-a; jg.add(grp);
    const pm=new THREE.MeshLambertMaterial({map:hrStripeTex(...cols[n%4])}), poles=[];
    const pole=(y,dx,rz)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(0.055,0.055,3.6,8),pm); m.rotation.x=Math.PI/2; m.position.set(dx||0,y,0); if(rz) m.rotation.y=rz; grp.add(m); poles.push(m); return m; };
    const stands=dx=>{ for(const sd of [-1,1]){ const st=new THREE.Mesh(new THREE.BoxGeometry(0.14,1.75,0.14),white); st.position.set(dx,0.87,sd*1.9); grp.add(st); const wg=new THREE.Mesh(new THREE.BoxGeometry(0.08,1.1,0.9),white); wg.position.set(dx,0.55,sd*2.35); grp.add(wg); } };
    let top=H;
    if(J.t==='v'){ stands(0); pole(H*0.35); pole(H*0.68); pole(H); }
    else if(J.t==='o'){ stands(-0.6); stands(0.6); pole(H-0.1,-0.6); pole(H*0.5,-0.6); pole(H,0.6); pole(H*0.5,0.6); }
    else if(J.t==='t'){ stands(-0.8); stands(0); stands(0.8); pole(H*0.6,-0.8); pole(H*0.8,0); pole(H,0.8); }
    else if(J.t==='m'){ stands(0); const wt=canvasTex(128,64,(g2,w,h)=>{ g2.fillStyle='#b3472f'; g2.fillRect(0,0,w,h); g2.strokeStyle='#eadfcf'; g2.lineWidth=2; for(let r=0;r<4;r++){ g2.beginPath(); g2.moveTo(0,r*16); g2.lineTo(w,r*16); g2.stroke(); for(let k=0;k<5;k++){ const xx=(k*32+(r%2)*16)%w; g2.beginPath(); g2.moveTo(xx,r*16); g2.lineTo(xx,r*16+16); g2.stroke(); } } });
      const wb=new THREE.Mesh(new THREE.BoxGeometry(0.5,H-0.16,3.5),new THREE.MeshLambertMaterial({map:wt})); wb.position.y=(H-0.16)/2; grp.add(wb); const cap=new THREE.Mesh(new THREE.BoxGeometry(0.55,0.16,3.5),white); cap.position.y=H-0.08; grp.add(cap); poles.push(cap); }
    else if(J.t==='r'){ stands(0); const tray=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.06,3.3),new THREE.MeshLambertMaterial({color:Cc('#3d7fc4')})); tray.position.set(0.4,0.04,0); grp.add(tray); top=Math.max(0.5,H*0.8); pole(top); }
    const nb=new THREE.Mesh(new THREE.PlaneGeometry(0.42,0.42),new THREE.MeshLambertMaterial({map:canvasTex(64,64,(g2,w,h)=>{ g2.fillStyle='#fff'; g2.fillRect(0,0,w,h); g2.fillStyle='#1d2a3a'; g2.font='bold 46px sans-serif'; g2.textAlign='center'; g2.textBaseline='middle'; g2.fillText(String(n+1),w/2,h/2+2); }),side:THREE.DoubleSide}));
    nb.position.set(-0.1,1.5,1.9); nb.rotation.y=-Math.PI/2; grp.add(nb);
    const topP=poles[poles.length-1]; return {n,J,x,z,g,c,s,a,top,need:top-0.35+0.14,grp,poles,topP,p0:topP.position.clone(),r0:topP.rotation.clone(),kn:0,ps:-1,fall:0}; });
  if(!A.arrow){ const ar=new THREE.Mesh(new THREE.ConeGeometry(0.45,0.9,12),new THREE.MeshBasicMaterial({color:0x2fbf5a})); ar.rotation.x=Math.PI; ar.visible=false; A.grp.add(ar); A.arrow=ar; } }
function hrJumpAt(x,z){ const A=HR.ar; if(!A||!A.jumps) return null; for(const j of A.jumps){ const dx=x-j.x, dz=z-j.z; if(Math.abs(dx*j.c+dz*j.s)<0.7&&Math.abs(-dx*j.s+dz*j.c)<1.95) return j; } return null; }
function hrSjReset(){ const A=HR.ar; if(!A||!A.jumps) return; for(const j of A.jumps){ j.kn=0; j.fall=0; j.topP.position.copy(j.p0); j.topP.rotation.copy(j.r0); j.ps=-1; } }
function hrKnock(j){ j.kn=1; j.fall=0.001; hrSnd('pole',0); }
function hrSjTick(dt){ const A=HR.ar; if(!A) return; for(const j of A.jumps) if(j.fall>0&&j.fall<1){ j.fall=Math.min(1,j.fall+dt*2.2); const e=j.fall*j.fall; j.topP.position.y=j.p0.y+(0.07-j.p0.y)*e; j.topP.position.x=j.p0.x+0.9*e; }
  const h=P.horse, R=HR.sj; if(A.arrow) A.arrow.visible=false;
  if(!h||S.mode!=='ride'){ if(R&&R.st==='run') hrSjEnd(null,'Te has bajado del caballo: recorrido anulado'); else if(R&&R.st!=='done') HR.sj=null; return; }
  const q=hrArL(A,h.x,h.z), inside=Math.abs(q[0])<33&&Math.abs(q[1])<21;
  if(!R){ if(inside){ HR.sj={st:'ready',t:0,f:0,next:0,kn:0}; hrSjReset(); hrUIsoon(); tip('Pista de saltos ('+HR_LV[HR.lv].s+'): cruza la salida entre las banderas roja y blanca para empezar · Saltar = saltar',4200); } return; }
  if(R.st==='done'){ R.t+=dt; if(R.t>4||!inside){ HR.sj=null; } return; }
  if(R.st==='ready'){ if(!inside){ HR.sj=null; return; } const su=q[0]+26, prev=R.su; R.su=su; if(prev!==undefined&&prev<0&&su>=0&&Math.abs(q[1]+12)<3.2&&Math.cos(h.yaw-A.aa)>0.3){ R.st='run'; R.t=0; R.next=0; R.f=0; R.kn=0; hrSjReset(); hrSnd('bell',0); toast('¡Salida!','Tiempo concedido: '+A.ta+' s'); } }
  else if(R.st==='run'){ R.t+=dt; const j=A.jumps[R.next];
    if(j){ const dx=h.x-j.x, dz=h.z-j.z, s=dx*j.c+dz*j.s, lat=-dx*j.s+dz*j.c, ps=j.ps; j.ps=s;
      if(A.arrow){ A.arrow.visible=true; A.arrow.position.set(j.x-A.grp.position.x,j.g+2.6+Math.sin(R.t*4)*0.15,j.z-A.grp.position.z); }
      if(ps<0&&s>=0&&Math.abs(lat)<2.3){ const feet=h.y-j.g; if(!h.air||feet<j.top-0.35){ R.f+=4; R.kn++; hrKnock(j); toast('Derribo en el '+(j.n+1),'+4 faltas'); } else { blip('hit'); }
        R.next++; if(R.next===A.jumps.length) tip('¡Ahora a la meta, entre las banderas del centro!',2200); } }
    else { const fu=q[0]-24, pf=R.fu; R.fu=fu; if(pf!==undefined&&pf<0&&fu>=0&&Math.abs(q[1])<3.4) hrSjEnd(true); }
    if(R.t>120) hrSjEnd(null,'Eliminado: más de 2 minutos'); } }
function hrSjEnd(ok,why){ const R=HR.sj, A=HR.ar; if(!R) return; if(!ok){ HR.sj={st:'done',t:0}; toast(why||'Recorrido anulado',''); hrUI(); return; }
  const T=R.t, tf=Math.max(0,Math.ceil(T-A.ta)), tot=R.f+tf, med=tot===0?'oro':tot<=4?'plata':tot<=8?'bronce':''; const key='l'+HR.lv, old=HR.st.sj[key];
  const rec=!old||tot<old.f||(tot===old.f&&T<old.t); if(rec) HR.st.sj[key]={f:tot,t:Math.round(T*10)/10,d:Date.now()}; hrSave();
  HR.res={T,tf,kn:R.kn,tot,med,rec,lv:HR.lv,ta:A.ta}; HR.sj={st:'done',t:0};
  prgEarn(8,'Recorrido de saltos terminado'); if(tot===0) prgEarn(10,'Recorrido limpio'); if(rec) prgEarn(5,'Récord en la pista de saltos'); if(tot===0&&HR.lv>=1) prgTrophy('saltos');
  hrSnd('bell',0); toast(tot===0?'¡Recorrido limpio!':tot+' faltas',fmtS(T)+' · '+(med?'medalla de '+med:'sin medalla')+(rec?' · récord':''));
  hrUI(); setTimeout(()=>{ if(S.mode==='ride') hrSheet('saltos'); },1600); }
function fmtS(t){ const m=Math.floor(t/60), s=t-m*60; return (m?m+':'+(s<10?'0':''):'')+s.toFixed(1).replace('.',',')+(m?'':' s'); }
// take a horse of the centre to the start of the course
function hrSjGo(){ const A=HR.ar; if(!A) return; closeModal(); $('hrSheet').hidden=true; hideMap();
  fadeTo(()=>{ hrLeaveAll(); let h=null, bd=1e9; for(const o of HORSES){ if(o.remoteBy) continue; const d=Math.hypot(o.x-A.cx,o.z-A.cz); if(d<bd){ bd=d; h=o; } } if(!h) return;
    const [x,z]=hrArF(A,-30,-12); h.x=x; h.z=z; h.yaw=A.aa; h.y=W.terrain(x,z); h.spd=0; h.air=false; placeHorse(h); P.x=x; P.z=z; mountHorse(h); camS.yaw=A.aa; HR.sj=null; }); }
function hrLeaveAll(){ if(S.mode==='menu'||S.mode==='drone'){ plane.visible=false; glider.visible=false; rig.root.visible=true; S.landedOnce=true; }
  if(P.buggy) exitBuggy(); if(S.mode==='ride') dismountHorse(); if(P.fly) flLeave(); if(KART.on) kartEnd('Has dejado la carrera'); if(S.mode==='bike') bkUnmount(); if(S.interior) exitVilla(); if(S.mode!=='walk') setMode('walk'); }

/* ---------- places: boards, the market cross and stalls, Ruskin's bench, the stone circle, the milestone ---------- */
function hrSpot(x,z,r){ for(let k=0;k<60;k++){ const a=k*2.399, d=k?Math.min(r,0.7+k*0.35):0, px=x+Math.cos(a)*d, pz=z+Math.sin(a)*d, g=W.terrain(px,pz);
    if(bldAt(px,pz,1.2)||W.waterLevel(px,pz)>g-0.2||hrWallAt(px,pz,g+0.1,1.0)>=0) continue; return [px,pz]; } return [x,z]; }
function hrPlacesBuild(){ for(const C of (WP.campo.places||[])){ const pl={C,go:null,look:C.look||C.p,board:null}; HR.pl.push(pl);
    if(C.id==='devil'){ const br=HR.br.find(b=>b.dv); if(br){ const P=br.P, e=P[0][0]<P[P.length-1][0]?0:P.length-1, o=e?P.length-2:1, ex=P[e][0], ez=P[e][1], ax=ex-P[o][0], az=ez-P[o][1], al=Math.hypot(ax,az)||1;
        pl.go=hrSpot(ex+ax/al*7,ez+az/al*7,6); pl.look=[ex-ax/al*20,ez-az/al*20]; const bs=hrSpot(ex+ax/al*5-az/al*3.5,ez+az/al*5+ax/al*3.5,5); pl.b=bs; } }
    if(C.id==='market'){ const [x,z]=C.p, y=W.terrain(x,z), st=new THREE.MeshLambertMaterial({color:Cc('#9d978c')}), g=new THREE.Group(); g.position.set(x,y,z);
      for(let i=0;i<3;i++){ const s=new THREE.Mesh(new THREE.BoxGeometry(2.6-i*0.7,0.3,2.6-i*0.7),st); s.position.y=0.15+i*0.3; g.add(s); }
      const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.26,3.2,10),st); sh.position.y=2.5; g.add(sh); const cap=new THREE.Mesh(new THREE.BoxGeometry(0.7,0.25,0.7),st); cap.position.y=4.2; g.add(cap);
      const cr=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.8,0.12),st); cr.position.y=4.7; g.add(cr); const cb=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.12,0.12),st); cb.position.y=4.8; g.add(cb); scene.add(g); HR.A.push(x-1.3,z,x+1.3,z,0.9,1.3,5,NaN);
      if(new Date().getDay()===4){ const cols=[['#c0392b','#fff'],['#2e86c1','#fff'],['#27ae60','#fff'],['#f39c12','#fff']]; let n=0;
        for(let k=0;k<10&&n<4;k++){ const a=k*1.7, sx=x+Math.cos(a)*7.5, sz=z+Math.sin(a)*7.5; if(bldAt(sx,sz,2.2)) continue; const sy=W.terrain(sx,sz), s=new THREE.Group(); s.position.set(sx,sy,sz); s.rotation.y=-a;
          const tb=new THREE.Mesh(new THREE.BoxGeometry(1.2,0.8,2.2),new THREE.MeshLambertMaterial({color:Cc('#8a6f4e')})); tb.position.y=0.4; s.add(tb);
          const aw=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.06,2.6),new THREE.MeshLambertMaterial({map:hrStripeTex(...cols[n%4])})); aw.position.y=2.1; aw.rotation.z=0.18; s.add(aw);
          for(const [px,pz] of [[-0.6,-1.1],[-0.6,1.1],[0.6,-1.1],[0.6,1.1]]){ const p=new THREE.Mesh(new THREE.BoxGeometry(0.05,2.1,0.05),new THREE.MeshLambertMaterial({color:Cc('#555')})); p.position.set(px,1.05,pz); s.add(p); }
          scene.add(s); n++; } HR.market=n; } }
    if(C.id==='circle'){ const [x,z]=C.p; const st=new THREE.MeshLambertMaterial({color:Cc('#8e8b82')}); let r=12345;
      for(let i=0;i<20;i++){ r=(r*16807)%2147483647; const a=i/20*6.283+(r%100)/900, d=9+(r%7-3)*0.12, sx=x+Math.cos(a)*d, sz=z+Math.sin(a)*d, hh=0.3+(r%5)*0.1;
        const m=new THREE.Mesh(new THREE.DodecahedronGeometry(0.42,0),st); m.scale.set(1+(r%3)*0.2,hh/0.42,0.8); m.position.set(sx,W.terrain(sx,sz)+hh*0.35,sz); m.rotation.y=a; m.castShadow=true; scene.add(m); } }
    if(C.id==='ruskin'){ const [x,z]=C.p, a=Math.atan2(pl.look[1]-z,pl.look[0]-x), wood=new THREE.MeshLambertMaterial({color:Cc('#7a5f43')}), g=new THREE.Group(); const bx=x-Math.cos(a)*1.5, bz=z-Math.sin(a)*1.5; g.position.set(bx,W.terrain(bx,bz),bz); g.rotation.y=-a+Math.PI/2;
      const seat=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.07,0.45),wood); seat.position.y=0.45; g.add(seat); const back=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.4,0.06),wood); back.position.set(0,0.75,-0.22); g.add(back);
      for(const sx of [-0.8,0.8]){ const l=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.45,0.45),wood); l.position.set(sx,0.22,0); g.add(l); } scene.add(g); }
    if(C.id==='grange'&&C.mile){ const [x,z]=C.mile, m=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.75,0.3),new THREE.MeshLambertMaterial({color:Cc('#b8b2a4')})); m.position.set(x,W.terrain(x,z)+0.37,z); m.rotation.y=0.3; m.castShadow=true; scene.add(m); }
    if(!pl.go) pl.go=hrSpot(...(C.go||C.p),12);
    const b=pl.b||hrSpot(pl.go[0]+2,pl.go[1]+1.5,6), ya=Math.atan2(pl.look[1]-b[1],pl.look[0]-b[0]); pl.b=b; pl.board=hrBoard(b[0],b[1],ya+Math.PI,C.n,C.sub||'Acción: Leer el cartel'); } }
function hrPlaceNear(){ if(S.mode!=='walk'||P.swim) return null; for(const pl of HR.pl){ if(Math.hypot(P.x-pl.b[0],P.z-pl.b[1])<3) return {k:'hrRead',ref:pl,label:'Leer el cartel'}; } return null; }
function hrPlaceGo(id){ const pl=HR.pl.find(p=>p.C.id===id); if(!pl) return; closeModal(); $('hrSheet').hidden=true; hideMap();
  fadeTo(()=>{ hrLeaveAll(); const [x,z]=pl.go, yw=Math.atan2(pl.look[1]-z,pl.look[0]-x); P.x=x; P.z=z; P.y=groundAt(x,z,W.terrain(x,z)+3); P.vx=P.vz=P.vy=0; P.yaw=yw; camS.yaw=yw; camS.lastLook=0; tip(pl.C.n+' · el cartel tiene más',2400); }); }

/* ---------- routes: along the bridleways, tracks and lanes, with checkpoints, a line on the ground and a time ---------- */
function hrRtPts(R){ if(!R._p){ const p=R.p, a=[]; for(let i=0;i<p.length;i+=2) a.push([p[i],p[i+1]]); R._p=a; const cum=[0]; for(let i=1;i<a.length;i++) cum.push(cum[i-1]+Math.hypot(a[i][0]-a[i-1][0],a[i][1]-a[i-1][1])); R._c=cum; } return R._p; }
function hrRtCps(R){ const p=hrRtPts(R), cps=new Set(R.st); for(let i=25;i<p.length-8;i+=25) cps.add(i); cps.add(p.length-1); return [...cps].sort((a,b)=>a-b).filter(i=>i>2); }
function hrRtY(x,z){ let y=W.terrain(x,z); for(const p of platsNear(x,z)) if(p.br&&insidePlat(p,x,z,0.05)&&p.top>y) y=p.top; return y; }
function hrRtGo(id,how){ const R=(W.ROUTES||[]).find(r=>r.id===id); if(!R) return; const p=hrRtPts(R); closeModal(); $('hrSheet').hidden=true; hideMap();
  if(how==='bike'&&!(S.mode==='bike'&&BK.b)){ tip('Para ir en bici, monta primero en una (Bicis) y vuelve a esta hoja',3200); return; }
  fadeTo(()=>{ const yw=Math.atan2(p[2][1]-p[0][1],p[2][0]-p[0][0]), [x,z]=p[0];
    if(how==='bike'){ dsPlace({k:'bike',o:BK.b},{x,z,h:yw}); }
    else { hrLeaveAll(); if(how==='ride'){ let h=null, bd=1e9; for(const o of HORSES){ if(o.remoteBy) continue; const d=Math.hypot(o.x-x,o.z-z); if(d<bd){ bd=d; h=o; } }
        if(h){ h.x=x; h.z=z; h.yaw=yw; h.y=hrTer(x,z,W.terrain(x,z)+3); h.spd=0; h.air=false; placeHorse(h); P.x=x; P.z=z; mountHorse(h); } else how='walk'; }
      if(how==='walk'){ P.x=x; P.z=z; P.y=groundAt(x,z,W.terrain(x,z)+3); P.vx=P.vz=P.vy=0; P.yaw=yw; } }
    camS.yaw=yw; camS.lastLook=0; HR.rt={R,how,st:'ready',t:0,cps:hrRtCps(R),k:0,x0:x,z0:z,off:0,stop:0}; hrRtDraw(); hrUIsoon(); tip(R.n+': sigue la línea amarilla y pasa por los aros · el reloj empieza al moverte',3800); }); }
function hrRtDraw(){ hrRtClear(); const r=HR.rt; if(!r) return; const p=hrRtPts(r.R), pos=[], idx=[];
  for(let i=0;i<p.length;i++){ const a=p[Math.max(0,i-1)], b=p[Math.min(p.length-1,i+1)], dx=b[0]-a[0], dz=b[1]-a[1], l=Math.hypot(dx,dz)||1, nx=-dz/l*0.55, nz=dx/l*0.55;
    for(const sd of [-1,1]){ const x=p[i][0]+nx*sd, z=p[i][1]+nz*sd; pos.push(x,hrRtY(x,z)+0.16,z); } if(i) idx.push(2*i-2,2*i,2*i-1,2*i-1,2*i,2*i+1); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setIndex(idx);
  const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0xffcf33,transparent:true,opacity:0.62,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2})); m.renderOrder=2; scene.add(m); r.line=m;
  const hoop=new THREE.Mesh(new THREE.TorusGeometry(2.3,0.14,8,32),new THREE.MeshBasicMaterial({color:0xffb703})); scene.add(hoop); r.hoop=hoop; hrRtHoop(); }
function hrRtClear(){ const r=HR.rt; if(!r) return; for(const k of ['line','hoop']) if(r[k]){ scene.remove(r[k]); r[k].geometry.dispose(); r[k]=null; } }
function hrRtHoop(){ const r=HR.rt; if(!r||!r.hoop) return; const p=hrRtPts(r.R), i=r.cps[r.k]; if(i===undefined){ r.hoop.visible=false; return; } const a=p[Math.max(0,i-1)], b=p[Math.min(p.length-1,i+1)];
  r.hoop.position.set(p[i][0],hrRtY(p[i][0],p[i][1])+2.5,p[i][1]); r.hoop.rotation.set(0,-Math.atan2(b[1]-a[1],b[0]-a[0])+Math.PI/2,0); r.hoop.material.color.set(r.k===r.cps.length-1?0x2fbf5a:0xffb703); r.hoop.visible=true; }
function hrRtMode(){ return S.mode==='ride'?'ride':S.mode==='bike'?'bike':S.mode==='walk'?'walk':null; }
function hrRtTick(dt){ const r=HR.rt; if(!r) return; const me=hrMe(), mode=hrRtMode();
  if(r.st==='ready'){ if(Math.hypot(me.x-r.x0,me.z-r.z0)>1.5){ r.st='run'; r.t=0; r.mode=mode; hrSnd('bell',0); } else return; }
  if(r.st!=='run') return; r.t+=dt;
  if(mode!==r.mode){ if(S.mode==='menu'||S.mode==='photo'||S.mode==='map') return; hrRtEnd(false,'Has cambiado de forma de ir: ruta anulada'); return; }
  const p=hrRtPts(r.R), i=r.cps[r.k]; if(i===undefined) return; if(Math.hypot(me.x-p[i][0],me.z-p[i][1])<8.5){ const si=r.R.st.indexOf(i); r.k++; blip('hit');
    if(si>=0){ const pl=hrStopPlace(p[i]); if(pl) toast(pl.C.n,'Parada de la ruta · lee su cartel'); }
    if(r.k>=r.cps.length){ hrRtEnd(true); return; } hrRtHoop(); } }
function hrStopPlace(q){ let best=null, bd=160; for(const pl of HR.pl){ const d=Math.hypot(pl.C.p[0]-q[0],pl.C.p[1]-q[1]); if(d<bd){ bd=d; best=pl; } } return best; }
function hrRtEnd(ok,why){ const r=HR.rt; if(!r) return; hrRtClear(); HR.rt=null; if(!ok){ if(why) toast(why,''); hrUI(); return; }
  const L=r.R.L, v=L/Math.max(1,r.t), th=HR_MED[r.mode]||HR_MED.walk, med=v>=th[0]?'oro':v>=th[1]?'plata':v>=th[2]?'bronce':'', key=r.R.id+'_'+r.mode, old=HR.st.rt[key], rec=!old||r.t<old;
  if(rec) HR.st.rt[key]=Math.round(r.t*10)/10; HR.st.done[r.R.id]=1; hrSave(); HR.rres={R:r.R,mode:r.mode,t:r.t,v,med,rec};
  prgEarn(5+(med==='oro'?10:med==='plata'?6:med==='bronce'?3:0)+(rec?5:0),'Ruta: '+r.R.n); if((W.ROUTES||[]).every(R=>HR.st.done[R.id])) prgTrophy('rutas');
  hrSnd('bell',0); toast('¡Ruta terminada!',fmtS(r.t)+' '+HR_MODE[r.mode]+(med?' · medalla de '+med:'')+(rec?' · récord':'')); setTimeout(()=>{ if(!HR.rt) hrSheet('rutas'); },1500); hrUI(); }

/* ---------- the frame, the marker at the top and the action ---------- */
function hrTick(dt){ if(!HR.ok) return; hrClimbTick(dt); hrGatesTick(dt); hrSjTick(dt); hrRtTick(dt); HR.eT-=dt; if(HR.eT<=0){ HR.eT=0.25; hrUI(); } }
function hrUI(){ const el=$('hrHud'); if(!el) return; let h='';
  const R=HR.sj; if(R&&HR.ar&&(R.st==='run'||R.st==='ready')){ const A=HR.ar; h=R.st==='ready'?'<b>Pista de saltos · '+HR_LV[HR.lv].n+' ('+HR_LV[HR.lv].s+')</b><span>Cruza la salida para empezar · tiempo concedido '+A.ta+' s</span>':
      '<b>Salto '+Math.min(R.next+1,8)+' de 8'+(R.next>=8?' · ¡a la meta!':'')+'</b><span>'+fmtS(R.t)+' / '+A.ta+' s · '+R.f+' faltas'+(R.t>A.ta?' (+'+Math.ceil(R.t-A.ta)+' de tiempo)':'')+'</span>'; }
  const r=HR.rt; if(r){ const p=hrRtPts(r.R), i=r.cps[r.k], left=i!==undefined?r.R._c[r.R._c.length-1]-r.R._c[i]+Math.hypot(hrMe().x-p[i][0],hrMe().z-p[i][1]):0;
    h='<b>'+r.R.n+'</b><span>'+(r.st==='ready'?'Muévete para empezar':'Control '+(r.k+1)+' de '+r.cps.length+' · '+fmtS(r.t)+' · faltan '+(left>=1000?(left/1000).toFixed(1).replace('.',',')+' km':Math.round(left)+' m'))+'</span>'; }
  if(h!==HR.hud){ HR.hud=h; el.innerHTML=h; el.hidden=!h; } }
function hrUIsoon(){ HR.eT=0; }
function hrNear(){ return hrPlaceNear()||hrClimbNear(); }
function hrDo(k,ref){ if(k==='hrClimb') hrClimb(ref); else if(k==='hrRead') hrSheet('lugares',ref.C.id); }

/* ---------- build everything (before the trees, so none grow in the arena) ---------- */
function hrBuild(){ if(!WP.campo) return; hrLoad(); HR.A=[]; hrWallsLoad(); hrGridBuild();
  try{ hrBridges(); }catch(e){ console.warn('puentes',e); }
  try{ const s=hrArenaFind(); if(s){ HR.ar={cx:s.cx,cz:s.cz,aa:s.aa,wl:s.wl}; hrClearArenaWalls(); HR.A=[]; hrWallsLoad();
      const c=[[-36,-24],[36,-24],[36,36],[-36,36]].map(q=>hrArF(HR.ar,q[0],q[1])); TREE_EXCL.push([Math.min(...c.map(q=>q[0])),Math.max(...c.map(q=>q[0])),Math.min(...c.map(q=>q[1])),Math.max(...c.map(q=>q[1]))]);
      W.GRASS_CLEAR=(W.GRASS_CLEAR||[]).concat([[[-33,-21],[33,-21],[33,21],[-33,21]].map(q=>hrArF(HR.ar,q[0],q[1]))]);
      hrArenaBuild(HR.ar); const hp=hrArF(HR.ar,0,24); WP.horses=[[hp[0],hp[1],3]].concat(WP.horses||[]); } }catch(e){ console.warn('picadero',e); HR.ar=null; }
  hrGridBuild();
  try{ hrGatesBuild(); }catch(e){ console.warn('cancelas',e); }
  try{ hrPlacesBuild(); }catch(e){ console.warn('lugares',e); }
  hrGridBuild(); HR.ok=true; }

/* ---------- the sheet: jumping, routes, places and how it works ---------- */
function hrSheet(tab,arg){ if(!WP.campo) return; closeModal(); HR.tab=tab||HR.tab||'saltos'; const T=HR.tab, B=$('hrBody');
  let h='<h2>Caballos, rutas y lugares</h2><div class="tabs">'+[['saltos','🐴 Saltos'],['rutas','🧭 Rutas'],['lugares','📍 Lugares'],['como','❓ Cómo se juega']].map(t=>'<button data-hrt="'+t[0]+'" class="'+(T===t[0]?'on':'')+'">'+t[1]+'</button>').join('')+'</div>';
  h+=T==='saltos'?hrSjHTML():T==='rutas'?hrRtHTML():T==='lugares'?hrPlHTML(arg):hrHowHTML();
  h+='<div class="row" style="margin-top:12px"><button class="btn small" id="hrClose">Cerrar</button></div>'; B.innerHTML=h; $('hrSheet').hidden=false; $('hrSheet').scrollTop=0;
  B.querySelectorAll('[data-hrt]').forEach(b=>b.onclick=()=>hrSheet(b.dataset.hrt)); $('hrClose').onclick=()=>{ $('hrSheet').hidden=true; };
  B.querySelectorAll('[data-hrlv]').forEach(b=>b.onclick=()=>{ HR.lv=+b.dataset.hrlv; hrSave(); hrJumpsBuild(); if(HR.sj&&HR.sj.st!=='run') HR.sj=null; hrSheet('saltos'); });
  const sg=$('hrSjGo'); if(sg) sg.onclick=hrSjGo;
  B.querySelectorAll('[data-hrr]').forEach(b=>b.onclick=()=>hrRtGo(b.dataset.hrr,b.dataset.how)); const rq=$('hrRtQuit'); if(rq) rq.onclick=()=>{ hrRtEnd(false,'Has dejado la ruta'); hrSheet('rutas'); };
  B.querySelectorAll('[data-hrp]').forEach(b=>b.onclick=()=>hrPlaceGo(b.dataset.hrp)); }
function hrSjHTML(){ const A=HR.ar; if(!A) return '<p>En este mundo no hay sitio para la pista de saltos.</p>'; let h='<p>La pista de saltos del centro ecuestre está junto a las cuadras del colegio: arena de 64 × 40 m con valla blanca y <b>8 obstáculos numerados</b> (verticales, oxers, un muro, una ría y una triple barra). Recorrido de '+Math.round(A.len)+' m; tiempo concedido '+A.ta+' s.</p>';
  if(HR.res){ const r=HR.res; h+='<div class="card" style="margin:8px 0;padding:10px;border:2px solid '+(r.tot===0?'#2e9a52':'#d9a400')+';border-radius:12px"><b>Último recorrido · '+HR_LV[r.lv].n+' ('+HR_LV[r.lv].s+')</b><br>Tiempo '+fmtS(r.T)+' (concedido '+r.ta+' s) · derribos '+r.kn+' ('+r.kn*4+' faltas) · tiempo '+r.tf+' faltas<br><b>Total: '+r.tot+' faltas</b>'+(r.med?' · medalla de '+r.med:'')+(r.rec?' · ¡récord!':'')+'</div>'; }
  h+='<h3>Altura</h3><div class="row">'+HR_LV.map((L,i)=>'<button class="btn small'+(HR.lv===i?' primary':'')+'" data-hrlv="'+i+'">'+L.n+' · '+L.s+'</button>').join('')+'</div>';
  h+='<div class="row" style="margin-top:10px"><button class="btn primary" id="hrSjGo">Ir a la pista con un caballo</button></div>';
  h+='<h3>Récords</h3><ul>'+HR_LV.map((L,i)=>{ const r=HR.st.sj['l'+i]; return '<li>'+L.n+' ('+L.s+'): '+(r?r.f+' faltas en '+fmtS(r.t):'todavía nada')+'</li>'; }).join('')+'</ul>';
  h+='<h3>Cómo se puntúa</h3><ul><li>Pasa los obstáculos <b>en orden</b>: una flecha verde marca el siguiente y el marcador de arriba dice cuál toca.</li><li><b>Derribo</b> = 4 faltas: si cruzas sin saltar o demasiado bajo, cae la barra de arriba.</li><li>Pasarte del <b>tiempo concedido</b> = 1 falta por cada segundo empezado. Más de 2 minutos = eliminado.</li><li>Medalla: oro con 0 faltas (<b>recorrido limpio</b>), plata hasta 4, bronce hasta 8.</li><li>Pulsa <b>Saltar</b> unos 2-4 m antes del obstáculo; el caballo salta lo alto que haga falta. En el <b>modo fácil</b> salta solo.</li></ul>'; return h; }
function hrRtHTML(){ const RR=W.ROUTES||[]; if(!RR.length) return '<p>No hay rutas en este mundo.</p>'; let h='<p>Rutas de verdad por los caminos de herradura (<i>bridleways</i>), pistas y caminos del valle, sacadas de OpenStreetMap. Sigue la <b>línea amarilla</b> y pasa por los <b>aros</b> en orden; el reloj empieza al moverte.</p>';
  if(HR.rt) h+='<div class="row"><button class="btn small" id="hrRtQuit">Dejar la ruta: '+HR.rt.R.n+'</button></div>';
  if(HR.rres){ const r=HR.rres; h+='<div class="card" style="margin:8px 0;padding:10px;border:2px solid #2e9a52;border-radius:12px"><b>'+r.R.n+'</b> '+HR_MODE[r.mode]+': '+fmtS(r.t)+' · media '+(r.v*3.6).toFixed(1).replace('.',',')+' km/h'+(r.med?' · medalla de '+r.med:'')+(r.rec?' · ¡récord!':'')+'</div>'; }
  for(const R of RR){ const stops=R.st.map(i=>hrStopPlace(hrRtPts(R)[i])).filter(Boolean).map(p=>p.C.n); const recs=['ride','walk','bike'].map(m=>HR.st.rt[R.id+'_'+m]!==undefined?HR_MODE[m]+' '+fmtS(HR.st.rt[R.id+'_'+m]):null).filter(Boolean);
    h+='<div style="margin:10px 0;padding:8px 10px;border:1px solid #d6dbe1;border-radius:12px"><b>'+(HR.st.done[R.id]?'✓ ':'')+R.n+'</b> · '+(R.L/1000).toFixed(1).replace('.',',')+' km'+(stops.length?'<br><small>Paradas: '+[...new Set(stops)].join(', ')+'</small>':'')+(recs.length?'<br><small>Récords: '+recs.join(' · ')+'</small>':'')+
      '<div class="row" style="margin-top:6px"><button class="btn small primary" data-hrr="'+R.id+'" data-how="ride">Empezar a caballo</button><button class="btn small" data-hrr="'+R.id+'" data-how="walk">A pie</button>'+(S.mode==='bike'&&BK.b?'<button class="btn small" data-hrr="'+R.id+'" data-how="bike">En bici</button>':'')+'</div></div>'; }
  h+='<p><small>Medallas por velocidad media: a caballo 36, 27 y 18 km/h; en bici 29, 22 y 14; a pie 18, 14 y 9.</small></p>'; return h; }
function hrPlHTML(id){ let L=HR.pl.slice(); if(id){ const i=L.findIndex(p=>p.C.id===id); if(i>0) L.unshift(L.splice(i,1)[0]); }
  return '<p>Sitios con nombre del valle, cada uno con su cartel. «Ir» te lleva a pie al cartel.</p>'+L.map(pl=>{ const C=pl.C, d=typeof C.d==='function'?C.d():C.d;
    return '<div style="margin:10px 0;padding:8px 10px;border:'+(C.id===id?'2px solid #2e86c1':'1px solid #d6dbe1')+';border-radius:12px"><b>'+C.n+'</b><br><span>'+d+(C.id==='market'?(HR.market?' <b>Hoy es jueves: hay puestos en la plaza.</b>':' Los puestos salen los jueves.'):'')+'</span><div class="row" style="margin-top:6px"><button class="btn small" data-hrp="'+C.id+'">Ir</button></div></div>'; }).join(''); }
function hrHowHTML(){ return '<h3>Muros, setos y cancelas</h3><ul><li>Los muros de piedra seca, los setos y las vallas del valle ya no se atraviesan: ni a pie, ni a caballo, ni en coche, buggy o bici.</li><li>Donde un camino cruza un muro hay un <b>hueco</b>, y donde OpenStreetMap tiene una puerta hay una <b>cancela</b> que se abre sola al acercarte (de madera, de acero, un <i>kissing gate</i> o una escalera de muro).</li><li>A pie, de cara a un muro o una valla sale <b>Saltar el muro</b> o <b>Saltar la valla</b>; con un seto, <b>Pasar el seto</b>.</li><li>A caballo, pulsa <b>Saltar</b> antes de llegar: salta muros y vallas de hasta 1,6 m; los setos altos no.</li><li>En las carreras de karts, los circuitos y las bajadas en bici no cuentan.</li></ul>'+
  '<h3>Pista de saltos</h3><ul><li>Entra a caballo en la pista, cruza la salida (bandera roja a la derecha) y salta los 8 obstáculos en orden. Termina entre las banderas del centro.</li><li>Arriba: el salto que toca, el tiempo, el tiempo concedido y las faltas.</li></ul>'+
  '<h3>Rutas</h3><ul><li>Cinco rutas de verdad: al Devil\'s Bridge, Kirkby Lonsdale y Ruskin\'s View, Holy Trinity y Casterton Grange, Barbon y el círculo de piedras. A caballo, a pie o en bici.</li><li>La línea amarilla marca el camino; el aro amarillo es el siguiente control (verde: la meta). Arriba: control, tiempo y lo que falta.</li></ul>'+
  '<h3>Puentes</h3><ul><li>El relieve del láser no tiene puentes: el juego los pone donde OpenStreetMap los tiene, con su pretil, y se cruzan a pie, a caballo, en coche y en bici. El Devil\'s Bridge es de tres arcos.</li></ul>'+
  '<h3>Glosario</h3><dl>'+hrGlossHTML()+'</dl>'; }
function hrGuideHTML(){ return WP.campo?'<li><b>Caballos, rutas y lugares</b> (botón del inicio y del menú): los muros, setos y vallas ya no se atraviesan y las <b>cancelas</b> se abren solas; a pie, «Saltar el muro»; a caballo, <b>Saltar</b> antes de un muro. <b>Pista de saltos</b> del centro ecuestre con 8 obstáculos, faltas y tiempo; cinco <b>rutas</b> reales con aros y reloj; <b>puentes</b> que se cruzan (el Devil\'s Bridge) y <b>lugares</b> con cartel: Kirkby Lonsdale, Ruskin\'s View, St Mary\'s, Holy Trinity, Casterton Grange y el círculo de piedras.</li>':''; }
function hrGlossHTML(){ return WP.campo?'<dt>Muro de piedra seca</dt><dd>Muro de piedras encajadas sin argamasa, típico de los prados de Cumbria.</dd><dt>Cancela</dt><dd>Puerta de un prado, de madera (cinco barras) o de acero galvanizado.</dd><dt>Kissing gate</dt><dd>Portillo estrecho para personas que se abre dentro de un hueco en forma de U.</dd><dt>Escalera de muro (stile)</dt><dd>Peldaños para pasar un muro a pie.</dd><dt>Bridleway</dt><dd>Camino de herradura: se puede ir a pie, a caballo y en bici.</dd><dt>Vertical</dt><dd>Obstáculo de barras una encima de otra.</dd><dt>Oxer</dt><dd>Dos verticales juntos: hay que saltar alto y largo.</dd><dt>Ría</dt><dd>Bandeja de agua con una barra encima.</dd><dt>Triple barra</dt><dd>Tres barras en escalera, de menos a más altura.</dd><dt>Derribo</dt><dd>Barra que se cae: 4 faltas.</dd><dt>Tiempo concedido</dt><dd>Tiempo máximo sin faltas de tiempo.</dd><dt>Recorrido limpio</dt><dd>Recorrido sin ninguna falta.</dd><dt>Pretil</dt><dd>Muro bajo a los lados de un puente.</dd><dt>Hito</dt><dd>Piedra junto al camino que marca las millas.</dd>':''; }
function hrDrawMap(g,m2c,s,big){ if(!HR.ok) return; g.save();
  if(big) for(const R of (W.ROUTES||[])){ if(HR.rt&&HR.rt.R===R) continue; const p=hrRtPts(R); g.strokeStyle='#8e44ad'; g.globalAlpha=0.55; g.lineWidth=1.6*s; g.setLineDash([4*s,3*s]); g.beginPath(); p.forEach((q,i)=>{ const [x,y]=m2c(q[0],q[1]); if(i) g.lineTo(x,y); else g.moveTo(x,y); }); g.stroke(); g.setLineDash([]); g.globalAlpha=1; }
  if(HR.rt){ const r=HR.rt, p=hrRtPts(r.R); g.strokeStyle='#f0a500'; g.lineWidth=3*s; g.beginPath(); p.forEach((q,i)=>{ const [x,y]=m2c(q[0],q[1]); if(i) g.lineTo(x,y); else g.moveTo(x,y); }); g.stroke(); const i=r.cps[r.k]; if(i!==undefined){ const [x,y]=m2c(p[i][0],p[i][1]); g.fillStyle='#ffb703'; g.strokeStyle='#fff'; g.lineWidth=1.5*s; g.beginPath(); g.arc(x,y,4*s,0,7); g.fill(); g.stroke(); } }
  const A=HR.ar; if(A){ g.fillStyle='rgba(201,171,124,.85)'; g.strokeStyle='#fff'; g.lineWidth=1.2*s; g.beginPath(); [[-32,-20],[32,-20],[32,20],[-32,20]].forEach((q,i)=>{ const w=hrArF(A,q[0],q[1]), [x,y]=m2c(w[0],w[1]); if(i) g.lineTo(x,y); else g.moveTo(x,y); }); g.closePath(); g.fill(); g.stroke();
    if(big&&A.jumps) for(const j of A.jumps){ const [x,y]=m2c(j.x,j.z); g.fillStyle=j.kn?'#d23c3c':'#2e86c1'; g.beginPath(); g.arc(x,y,1.6*s,0,7); g.fill(); } }
  const r=(big?4:2.6)*s; for(const pl of HR.pl){ const [x,y]=m2c(pl.C.p[0],pl.C.p[1]); g.fillStyle='#8e44ad'; g.strokeStyle='#fff'; g.lineWidth=1.2*s; g.beginPath(); g.moveTo(x,y-r); g.lineTo(x+r,y); g.lineTo(x,y+r); g.lineTo(x-r,y); g.closePath(); g.fill(); g.stroke();
    if(big){ g.font=(10*s)+'px sans-serif'; g.fillStyle='#3b1f4a'; g.textAlign='left'; g.fillText(pl.C.n,x+r+2*s,y+3*s); } }
  g.restore(); }
function hrLegend(){ if(!HR.ok) return ''; let h='<div><i style="background:#8e44ad;transform:rotate(45deg);border:2px solid #fff"></i>Lugar con cartel (Kirkby Lonsdale, Devil\'s Bridge…)</div><div><i style="background:none;border:0;border-top:2px dashed #8e44ad;height:0;margin-top:7px"></i>Ruta (en el mapa grande)</div>';
  if(HR.rt) h+='<div><i style="background:#f0a500;border:0;height:4px;margin-top:5px"></i>Tu ruta, con el siguiente control en amarillo</div>'; if(HR.ar) h+='<div><i style="background:#c9ab7c;border:2px solid #fff"></i>Pista de saltos del centro ecuestre (puntos: obstáculos; rojo = derribado)</div>'; return h; }
{ const m=$('mCampo'); if(m){ m.hidden=!WP.campo; m.onclick=()=>{ saveName(); ensureAudio(); hrSheet(); }; } }
