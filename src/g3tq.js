/* ===== g3tq.js: team sports (S5, Casterton: WP.team; the pitches of OpenStreetMap in course.json 'pitches') ===== */
// Football, hockey, rugby and netball on the valley's real pitches, 5 or 7 a side, against a made-up school (no real names,
// no crests): the school's side wears its sports kit (g3td.js), the rivals their own colours. One engine for the four: the
// pitch frame (a along the pitch, b across), players with a rig each, the ball (g3fg.js physics when it is loose), the
// referee's restarts, the clock, the bots, and the room: the host runs the match and sends its state ten times a second;
// each friend runs their own player and sends where it is and what it does.
var TQ={ok:false,on:false,k:'football',n:5,dur:4,rv:0,df:1,md:'j',tab:'football',ph:'off',pt:0,F:null,E:[],B:null,me:-1,my:0,sc:[0,0],half:1,clk:0,s0:1,
  ko:0,cp:0,tk:-1,conv:null,ruck:null,host:true,g:0,net:false,hm:{},peers:[],ev:[],evN:0,evSeen:0,sT:0,iT:0,snap:null,snapT:0,view:0,chg:false,pow:0,cT:0,
  spr:false,ref:null,bm:null,ring:null,PB:{},FR:{},st:{},lobby:null,res:null,seed:1,uiT:0,exitT:0,hint:'',lastOwn:-1,hold3:0,ideal:null,won:{}};
const TQ_SP=['football','hockey','rugby','netball'];
const TQ_DEF={
  football:{n:'Fútbol',ic:'⚽',col:'#1f8a4c',pk:['football'],sz:{5:[50,32],7:[60,40]},goal:[5,2.1,1.6],box:{5:[8,16],7:[10,22]},gk:1,reach:0.8,hands:0,v:6.3,
    ball:{r:0.11,kd:0.0125,wf:0,wob:0,rollK:1},carry:[0.55,0,0],shot:[13,29],pts:1},
  hockey:{n:'Hockey',ic:'🏑',col:'#2f6bd6',pk:['hockey','astro'],sz:{5:[55,35],7:[70,46]},goal:[3.66,2.14,1.2],circ:{5:11,7:13},gk:1,reach:1.05,hands:0,v:6.0,
    ball:{r:0.036,kd:0.006,wf:0,wob:0,rollK:0.5},carry:[0.62,0.17,0],shot:[14,30],pts:1},
  rugby:{n:'Rugby',ic:'🏉',col:'#8a5a2b',pk:['rugby'],sz:{5:[60,40],7:[90,60]},ig:{5:6,7:8},posts:[5.6,3,9],gk:0,reach:1.0,hands:1,v:6.5,
    ball:{r:0.15,kd:0.016,wf:0,wob:0.55,rollK:1.35},carry:[0.3,0.2,1.0],pts:5},
  netball:{n:'Netball',ic:'🥅',col:'#c2185b',pk:['astro','netball'],sz:{5:[30.5,15.25],7:[30.5,15.25]},circ:4.9,ring:3.05,gk:0,reach:0.95,hands:1,v:6.0,
    ball:{r:0.11,kd:0.012,wf:0,wob:0,rollK:1.2},carry:[0.26,0,1.15],pts:1}};
// home places: role, fraction of the pitch from your own goal line (0) to theirs (1), and across (-1 to 1)
const TQ_FORM={
  fb5:[['P',0.03,0],['D',0.24,-0.45],['D',0.24,0.45],['A',0.55,-0.35],['A',0.58,0.3]],
  fb7:[['P',0.03,0],['D',0.2,-0.55],['D',0.18,0],['D',0.2,0.55],['M',0.4,0],['A',0.6,-0.4],['A',0.6,0.4]],
  rg5:[['F',0.4,-0.18],['F',0.4,0.18],['B',0.32,-0.5],['B',0.32,0.5],['Z',0.16,0]],
  rg7:[['F',0.42,-0.14],['F',0.42,0],['F',0.42,0.14],['B',0.34,-0.36],['B',0.3,-0.62],['B',0.34,0.4],['Z',0.16,0]],
  nb5:[['GS',0.88,0.15],['GA',0.72,-0.35],['C',0.5,0],['GD',0.28,0.35],['GK',0.12,-0.15]],
  nb7:[['GS',0.88,0.15],['GA',0.74,-0.35],['WA',0.62,0.55],['C',0.5,0],['WD',0.38,-0.55],['GD',0.26,0.35],['GK',0.12,-0.15]]};
// netball: first and last third you may stand in (0 your defending third, 2 your attacking one), attacking circle, defending circle
const TQ_NBZ={GS:[2,2,1,0],GA:[1,2,1,0],WA:[1,2,0,0],C:[0,2,0,0],WD:[0,1,0,0],GD:[0,1,0,1],GK:[0,0,0,1]};
const TQ_NBM={GS:'GK',GA:'GD',WA:'WD',C:'C',WD:'WA',GD:'GA',GK:'GS'};
const TQ_NBN={GS:'Goal Shooter (tiradora)',GA:'Goal Attack (ataque)',WA:'Wing Attack (ala de ataque)',C:'Centre (centro)',WD:'Wing Defence (ala de defensa)',GD:'Goal Defence (defensa)',GK:'Goal Keeper (portera)'};
const TQ_RIV=[{n:'Los Zorros',c:'#e0782a',p:'#ffffff'},{n:'Los Halcones',c:'#4f9ad8',p:'#1c2436'},{n:'Las Nutrias',c:'#2f8a4c',p:'#f1f0ea'}];
const TQ_DFN=['Fácil','Normal','Difícil'];
TRO.push({id:'tqfutbol',n:'Goleador',how:'Gana un partido de fútbol.',m:'s',c:30,w:'team'},
  {id:'tqhockey',n:'Stick de oro',how:'Gana un partido de hockey.',m:'s',c:30,w:'team'},
  {id:'tqrugby',n:'Ensayo ganador',how:'Gana un partido de rugby.',m:'s',c:30,w:'team'},
  {id:'tqnetball',n:'Aro certero',how:'Gana un partido de netball.',m:'s',c:30,w:'team'},
  {id:'tqpoli',n:'Polideportivo',how:'Gana un partido de cada uno de los cuatro deportes de equipo.',m:'g',c:60,w:'team'});

function tqLoad(){ try{ const o=JSON.parse(store.get('vg_tq')||'null'); if(o){ if(TQ_SP.includes(o.k)) TQ.k=TQ.tab=o.k; TQ.n=o.n===7?7:5; TQ.dur=[2,4,6].includes(o.dur)?o.dur:4; TQ.rv=clamp(o.rv|0,0,2);
  TQ.df=clamp(o.df===undefined?1:o.df|0,0,2); TQ.md=o.md==='c'?'c':'j'; if(o.st&&typeof o.st==='object') TQ.st=o.st; if(o.won&&typeof o.won==='object') TQ.won=o.won; } }catch(e){} }
function tqSave(){ store.set('vg_tq',JSON.stringify({k:TQ.k,n:TQ.n,dur:TQ.dur,rv:TQ.rv,df:TQ.df,md:TQ.md,st:TQ.st,won:TQ.won})); }
function tqStat(k){ const s=TQ.st[k]; return Array.isArray(s)&&s.length===5?s:(TQ.st[k]=[0,0,0,0,0]); }   // won, drawn, lost, scored, conceded
function tqD(){ return TQ_DEF[TQ.k]; }
function tqNow(){ return performance.now()/1000; }
function tqHome(){ return 'Casterton'; }
function tqAway(){ return TQ_RIV[TQ.rv].n; }
function tqTeamN(t){ return t===0?tqHome():tqAway(); }

/* ---------- the pitch: the OpenStreetMap rectangle, and the frame of the game inside it ---------- */
function tqPitch(k){ const D=TQ_DEF[k], P=W.PITCHES||[], s7=D.sz[7]; for(const kk of D.pk){ const c=P.filter(p=>p.k===kk); if(c.length) return c.find(p=>p.L>=s7[0]*0.9&&p.W>=s7[1]*0.9)||c[0]; } return null; }
function tqFrame(k,n){ const D=TQ_DEF[k], p=tqPitch(k); if(!p) return null; const ig=D.ig?D.ig[n]:0, sz=D.sz[n];
  const L=Math.min(sz[0],p.L-2-2*ig), Wd=Math.min(sz[1],p.W-2), ux=Math.cos(p.a), uz=Math.sin(p.a);
  return {k,n,p,cx:p.c[0],cz:p.c[1],ux,uz,vx:-uz,vz:ux,L,W:Wd,hl:L/2,hw:Wd/2,ig,y:W.terrain(p.c[0],p.c[1])}; }
function tqW(F,a,b){ return [F.cx+F.ux*a+F.vx*b,F.cz+F.uz*a+F.vz*b]; }
function tqL(F,x,z){ const dx=x-F.cx, dz=z-F.cz; return [dx*F.ux+dz*F.uz,dx*F.vx+dz*F.vz]; }
function tqFr(k){ if(!(k in TQ.FR)) TQ.FR[k]=tqFrame(k,7); return TQ.FR[k]; }
// is (x, z) on one of the pitches (the 7-a-side frame, with margin m)? Used to keep helipads off them
function tqPitchAt(x,z,m){ if(!WP.team) return null; m=m||0; for(const k of TQ_SP){ const F=tqFr(k); if(!F) continue; const q=tqL(F,x,z); if(Math.abs(q[0])<F.hl+F.ig+m&&Math.abs(q[1])<F.hw+m) return k; } return null; }
// netball is played on the school's games court, where the tennis net is: the court whose net hides during a netball match
function tqNetCourt(C){ if(!WP.team) return false; const F=tqFr('netball'); return !!F&&Math.hypot(C.c[0]-F.cx,C.c[1]-F.cz)<4; }
// the side each team attacks: +1 towards +a. Ends change at half time
function tqSgn(t){ return (t===0?1:-1)*(TQ.half===1?1:-1)*TQ.s0; }
function tqAB(e){ return tqL(TQ.F,e.x,e.z); }
function tqFrac(t,a){ const F=TQ.F; return (tqSgn(t)*a+F.hl)/F.L; }               // 0 at your own goal line, 1 at theirs
function tqAOf(t,f){ const F=TQ.F; return tqSgn(t)*(f*F.L-F.hl); }

/* ---------- building: lines, goals and posts ---------- */
function tqLinesTex(F,k,fill){ const EL=F.L+2*F.ig+4, EW=F.W+4, p2=v=>{ let q=256; while(q<v&&q<2048) q*=2; return q; };
  const cw=p2(EL*12), ch=Math.min(1024,p2(EW*12)), sx=cw/EL, sy=ch/EW, D=TQ_DEF[k], hl=F.hl, hw=F.hw, n=F.n;
  return canvasTex(cw,ch,c=>{ c.setTransform(sx,0,0,sy,EL/2*sx,EW/2*sy);
    if(fill){ c.fillStyle='rgba(44,110,143,0.93)'; c.fillRect(-hl-1,-hw-1,2*hl+2,2*hw+2); c.fillStyle='rgba(56,132,170,0.95)'; c.fillRect(-hl,-hw,2*hl,2*hw); }
    c.strokeStyle='rgba(255,255,255,0.95)'; c.lineWidth=0.13; const ln=(a0,b0,a1,b1)=>{ c.beginPath(); c.moveTo(a0,b0); c.lineTo(a1,b1); c.stroke(); };
    const dash=(a0,b0,a1,b1)=>{ c.setLineDash([1.2,1.2]); ln(a0,b0,a1,b1); c.setLineDash([]); };
    const arc=(a,b,r,t0,t1)=>{ c.beginPath(); c.arc(a,b,r,t0,t1); c.stroke(); };
    c.strokeRect(-hl,-hw,2*hl,2*hw);
    if(k==='football'){ ln(0,-hw,0,hw); arc(0,0,n===5?4:5.5,0,7); c.fillStyle='#fff'; c.fillRect(-0.15,-0.15,0.3,0.3);
      const bx=D.box[n], gw=D.goal[0]; for(const s of [-1,1]){ c.strokeRect(s>0?hl-bx[0]:-hl,-bx[1]/2,bx[0],bx[1]); c.strokeRect(s>0?hl-2.5:-hl,-(gw/2+2),2.5,gw+4); c.fillRect(s*(hl-bx[0]*0.65)-0.13,-0.13,0.26,0.26);
        for(const t of [-1,1]){ const a0=s>0?(t>0?Math.PI:Math.PI/2):(t>0?-Math.PI/2:0); arc(s*hl,t*hw,0.8,a0,a0+Math.PI/2); } } }
    else if(k==='hockey'){ ln(0,-hw,0,hw); const r=D.circ[n], gp=D.goal[0]/2; for(const s of [-1,1]){ ln(s*(hl-F.L*0.25),-hw,s*(hl-F.L*0.25),hw);
        c.beginPath(); if(s>0){ c.arc(hl,-gp,r,Math.PI,Math.PI*1.5); c.moveTo(hl-r,-gp); c.lineTo(hl-r,gp); c.moveTo(hl,gp+r); c.arc(hl,gp,r,Math.PI*0.5,Math.PI); }
        else { c.arc(-hl,-gp,r,Math.PI*1.5,Math.PI*2); c.moveTo(-hl+r,-gp); c.lineTo(-hl+r,gp); c.moveTo(-hl+r,gp); c.arc(-hl,gp,r,0,Math.PI*0.5); } c.stroke();
        c.fillStyle='#fff'; c.fillRect(s*(hl-r*0.5)-0.1,-0.1,0.2,0.2); } }
    else if(k==='rugby'){ const ig=F.ig; ln(-hl-ig,-hw,hl+ig,-hw); ln(-hl-ig,hw,hl+ig,hw); for(const s of [-1,1]){ ln(s*(hl+ig),-hw,s*(hl+ig),hw); ln(s*hl,-hw,s*hl,hw); ln(s*(hl-F.L*0.22),-hw,s*(hl-F.L*0.22),hw); dash(s*F.L*0.1,-hw,s*F.L*0.1,hw); }
      ln(0,-hw,0,hw); for(const t of [-1,1]) dash(-hl,t*(hw-5),hl,t*(hw-5)); }
    else if(k==='netball'){ for(const s of [-1,1]) ln(s*F.L/6,-hw,s*F.L/6,hw); arc(0,0,0.45,0,7); for(const s of [-1,1]){ c.beginPath(); c.arc(s*hl,0,D.circ,s>0?Math.PI*0.5:-Math.PI*0.5,s>0?Math.PI*1.5:Math.PI*0.5); c.stroke(); } } }); }
function tqLinesMesh(F,k,fill){ const EL=F.L+2*F.ig+4, EW=F.W+4, nx=Math.max(4,Math.ceil(EL/3)), ny=Math.max(3,Math.ceil(EW/3)), pos=[], uv=[], idx=[];
  for(let j=0;j<=ny;j++) for(let i=0;i<=nx;i++){ const a=-EL/2+EL*i/nx, b=-EW/2+EW*j/ny, p=tqW(F,a,b); pos.push(p[0],W.terrain(p[0],p[1])+0.045,p[1]); uv.push(i/nx,1-j/ny); }
  for(let j=0;j<ny;j++) for(let i=0;i<nx;i++){ const q=j*(nx+1)+i; idx.push(q,q+nx+1,q+1,q+1,q+nx+1,q+nx+2); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); g.setIndex(idx); g.computeVertexNormals();
  const n=g.attributes.normal; for(let i=0;i<n.count;i++){ if(n.getY(i)<0) n.setXYZ(i,-n.getX(i),-n.getY(i),-n.getZ(i)); }
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({map:tqLinesTex(F,k,fill),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,side:THREE.DoubleSide}));
  m.renderOrder=1; m.receiveShadow=true; scene.add(m); return m; }
function tqNetMat(){ if(TQ.netM) return TQ.netM; const t=canvasTex(128,128,(c,w)=>{ c.clearRect(0,0,w,w); c.strokeStyle='rgba(255,255,255,0.9)'; c.lineWidth=3; for(let i=0;i<=w;i+=16){ c.beginPath(); c.moveTo(i,0); c.lineTo(i,w); c.stroke(); c.beginPath(); c.moveTo(0,i); c.lineTo(w,i); c.stroke(); } },true);
  TQ.netM=new THREE.MeshLambertMaterial({map:t,transparent:true,side:THREE.DoubleSide,depthWrite:false,alphaTest:0.2}); return TQ.netM; }
// a goal or posts at one end (s = ±1); the group's local +x looks out of the pitch, local z runs across
function tqGoalMesh(F,k,s){ const D=TQ_DEF[k], g=new THREE.Group(), at=tqW(F,s*F.hl,0), wm=new THREE.MeshLambertMaterial({color:0xf6f6f2});
  g.position.set(at[0],W.terrain(at[0],at[1]),at[1]); g.rotation.y=-Math.atan2(s*F.uz,s*F.ux);
  const cyl=(r,h,x,y,z,mat,rx,rz)=>{ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,10),mat||wm); m.position.set(x,y,z); m.rotation.set(rx||0,0,rz||0); m.castShadow=true; g.add(m); return m; };
  const plane=(w,h,x,y,z,ry,rx,mat)=>{ const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat||tqNetMat()); m.position.set(x,y,z); m.rotation.set(rx||0,ry||0,0); g.add(m); return m; };
  if(k==='football'||k==='hockey'){ const [gw,gh,dp]=D.goal, r=k==='hockey'?0.05:0.06;
    for(const t of [-1,1]){ cyl(r,gh,0,gh/2,t*gw/2); cyl(0.025,1.1,dp*0.6,gh*0.7,t*gw/2,0,Math.PI/2-0.55); }
    cyl(r,gw+2*r,0,gh,0,null,Math.PI/2); const nm=tqNetMat(); tqQuad(g,nm,[dp,0,-gw/2],[dp,0,gw/2],[dp,gh*0.75,gw/2],[dp,gh*0.75,-gw/2]); tqQuad(g,nm,[0,gh,-gw/2],[0,gh,gw/2],[dp,gh*0.75,gw/2],[dp,gh*0.75,-gw/2]);
    for(const t of [-1,1]){ const sh=new THREE.Shape(); sh.moveTo(0,0); sh.lineTo(dp,0); sh.lineTo(dp,gh*0.75); sh.lineTo(0,gh); sh.lineTo(0,0); const sg=new THREE.ShapeGeometry(sh), uv=sg.attributes.uv; for(let i=0;i<uv.count;i++) uv.setXY(i,uv.getX(i)*1.25,uv.getY(i)*1.25); const m=new THREE.Mesh(sg,nm); m.position.set(0,0,t*gw/2); g.add(m); }
    if(k==='hockey'){ const bm=new THREE.MeshLambertMaterial({color:0x1c2436}); const bb=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.46,gw),bm); bb.position.set(dp,0.23,0); g.add(bb);
      for(const t of [-1,1]){ const sb=new THREE.Mesh(new THREE.BoxGeometry(dp,0.46,0.05),bm); sb.position.set(dp/2,0.23,t*gw/2); g.add(sb); } } }
  else if(k==='rugby'){ const [pw,cb,ph]=D.posts, pad=new THREE.MeshLambertMaterial({color:0x6b4428});
    for(const t of [-1,1]){ cyl(0.08,ph,0,ph/2,t*pw/2); cyl(0.22,1.8,0,0.9,t*pw/2,pad); } cyl(0.07,pw,0,cb,0,null,Math.PI/2); }
  else if(k==='netball'){ const pm=new THREE.MeshLambertMaterial({color:0x9aa1a8}); cyl(0.045,D.ring,0,D.ring/2,0,pm); const arm=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.03,0.04),pm); arm.position.set(-0.08,D.ring,0); g.add(arm);
    const rr=new THREE.Mesh(new THREE.TorusGeometry(0.19,0.009,6,24),new THREE.MeshLambertMaterial({color:0xd8661c})); rr.rotation.x=Math.PI/2; rr.position.set(-0.15-0.19,D.ring,0); g.add(rr);
    const net=new THREE.Mesh(new THREE.CylinderGeometry(0.19,0.13,0.38,16,1,true),tqNetMat()); net.position.set(-0.34,D.ring-0.19,0); g.add(net);
    const base=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.34,0.08,16),pm); base.position.set(0,0.04,0); g.add(base); }
  scene.add(g); return g; }
function tqQuad(g,mat,a,b,c,d){ const L=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]), H=Math.hypot(d[0]-a[0],d[1]-a[1],d[2]-a[2]), geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute([...a,...b,...c,...d],3)); geo.setAttribute('uv',new THREE.Float32BufferAttribute([0,0,L*1.25,0,L*1.25,H*1.25,0,H*1.25],2)); geo.setIndex([0,1,2,0,2,3]); geo.computeVertexNormals(); const m=new THREE.Mesh(geo,mat); g.add(m); return m; }
function tqPitchDrop(k){ const P=TQ.PB[k]; if(!P) return; for(const m of P.ms){ scene.remove(m); try{ mpDispose(m); }catch(e){} } delete TQ.PB[k]; }
function tqPitchBuild(k,n){ tqPitchDrop(k); const F=tqFrame(k,n); if(!F) return null; const ms=[tqLinesMesh(F,k,k==='netball')]; for(const s of [-1,1]) ms.push(tqGoalMesh(F,k,s)); TQ.PB[k]={F,ms,n}; return F; }
function tqBoot(){ if(!WP.team) return; tqLoad(); try{ for(const k of ['football','hockey','rugby']){ const F=tqFr(k); if(!F) continue; tqPitchBuild(k,7);
      const cs=[[-1,-1],[1,-1],[1,1],[-1,1]].map(q=>tqW(F,q[0]*(F.hl+F.ig+2),q[1]*(F.hw+2))); TREE_EXCL.push([Math.min(...cs.map(c=>c[0])),Math.max(...cs.map(c=>c[0])),Math.min(...cs.map(c=>c[1])),Math.max(...cs.map(c=>c[1]))]); }
    TQ.ok=TQ_SP.some(k=>tqFr(k)); }catch(e){ console.warn('deportes',e); } }

/* ---------- players: rigs in the kit of each side ---------- */
function tqRng(s){ return ()=>{ s|=0; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function tqSk(t,role,rnd){ const k=TQ.k, rv=TQ_RIV[TQ.rv], pick=a=>a[Math.floor(rnd()*a.length)], girl=rnd()<(k==='netball'?0.85:k==='hockey'?0.6:k==='rugby'?0.3:0.45);
  let sk={n:'',skin:pick(['#f1c7a5','#e0ac83','#c58c63','#8d5a3c','#f3d2b8','#e8b996']),hair:pick(['#2d1e17','#5a3b26','#a4673a','#d9b86a','#1f1a17','#7a4a2a','#c98d4a']),
    hs:girl?pick(['largo','largo','corto','rizado']):pick(['corto','corto','rapado','rizado']),shirt:'#ffffff',pants:'#ffffff',shoe:'#22272e',cap:null,pack:null,top:'polo',pt:'corto',H:0.8+rnd()*0.08,W:0.86};
  sk.long=girl&&sk.hs==='largo'&&rnd()<0.5; const gk=role==='P';
  if(t===0){ if(gk) Object.assign(sk,{shirt:'#2f9e44',pants:'#1c2436',top:'manga'}); else if(k==='football'||k==='rugby') sk=unApply(sk,4); else sk=unApply(sk,3+(girl?0:8)); }
  else if(t===1){ Object.assign(sk,gk?{shirt:'#f2c230',pants:'#1d1d1d',top:'manga'}:{shirt:rv.c,pants:rv.p}); if(k==='rugby'&&!gk) sk.top='jersey'; }
  else Object.assign(sk,{shirt:'#1d1d1d',pants:'#1d1d1d',top:'manga',H:0.95,W:0.95,hs:'corto'});
  return sk; }
function tqStickMesh(R,gk){ const g=new THREE.Group(), m=new THREE.MeshLambertMaterial({color:gk?0x1c2436:0x2c3e66}); g.position.set(0.21,0.92,0.22);
  const v=new THREE.Vector3(0.5,-0.87,-0.02), L=v.length(); v.normalize(); const sh=new THREE.Mesh(new THREE.CylinderGeometry(0.016,0.016,L,6),m); sh.position.copy(v).multiplyScalar(L/2); sh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v); g.add(sh);
  const hk=new THREE.Mesh(new THREE.TorusGeometry(0.05,0.019,6,10,Math.PI),m); hk.position.copy(v).multiplyScalar(L).add(new THREE.Vector3(0.05,0.02,0)); hk.rotation.set(0,0,Math.PI); g.add(hk);
  const gr=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.2,6),new THREE.MeshLambertMaterial({color:0x151515})); gr.position.copy(v).multiplyScalar(0.12); gr.quaternion.copy(sh.quaternion); g.add(gr);
  R.root.add(g); return g; }
function tqPads(R){ const pm=new THREE.MeshLambertMaterial({color:0xf2f2f2}); for(const L of [R.lL,R.lR]){ const p=new THREE.Mesh(new THREE.BoxGeometry(0.17,0.5,0.17),pm); p.position.set(0.04,-0.2,0); L.kn.add(p); }
  const hm=new THREE.Mesh(new THREE.SphereGeometry(0.165,12,10),new THREE.MeshLambertMaterial({color:0x1c2436})); hm.position.y=0.02; R.headG.add(hm);
  const cg=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.16,0.2),new THREE.MeshLambertMaterial({color:0xc9ccd0})); cg.position.set(0.15,-0.01,0); R.headG.add(cg);
  const bp=new THREE.Mesh(new THREE.BoxGeometry(0.34,0.22,0.5),pm); bp.position.set(0.02,-0.02,0); R.body.add(bp); }
function tqBib(R,role,t){ const key=role+t; TQ.bibT=TQ.bibT||{}; const tex=TQ.bibT[key]||(TQ.bibT[key]=canvasTex(64,64,(c,w)=>{ c.fillStyle=t===0?'#f4f1e6':'#1c2436'; c.fillRect(0,0,w,w); c.fillStyle=t===0?'#6b4428':TQ_RIV[TQ.rv].c; c.font='900 '+(role.length>1?30:40)+'px system-ui, sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(role,w/2,w/2+2); }));
  const mat=new THREE.MeshLambertMaterial({map:tex}); for(const s of [1,-1]){ const p=new THREE.Mesh(new THREE.PlaneGeometry(0.22,0.24),mat); p.position.set(s*0.168,0.3,0); p.rotation.y=s*Math.PI/2; R.torso.add(p); } }
function tqBlob(){ if(!TQ.blobG){ TQ.blobG=new THREE.CircleGeometry(0.42,16); TQ.blobG.rotateX(-Math.PI/2); TQ.blobM=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:0.26,depthWrite:false}); }
  const m=new THREE.Mesh(TQ.blobG,TQ.blobM); m.renderOrder=2; scene.add(m); return m; }
function tqMake(t,role,f,b,rnd){ const sk=tqSk(t,role,rnd), R=buildRig(sk); R.club.visible=false; R.root.traverse(o=>{ if(o.isMesh) o.castShadow=false; });
  for(const c of R.torso.children) if(c.isGroup&&Math.abs(c.position.x+0.29)<0.01) c.visible=false;   // the hockey stick carried on the back
  scene.add(R.root); const e={i:TQ.E.length,t,role,gk:role==='P',f,b,R,sk,sc:sk.H||1,x:0,y:0,z:0,yaw:0,vx:0,vz:0,tx:0,tz:0,sp:0,th:rnd()*0.3,hum:null,st:1,
    kT:9,kk:'',dn:0,tkT:9,cool:0,hold:0,dv:0,dvs:0,jT:9,cheer:0,ph:rnd()*6,an:0,code:0,stick:null,mp:0,anT:rnd()*3,sh:tqBlob(),pa:0};
  if(TQ.k==='hockey') e.stick=tqStickMesh(R,e.gk); if(TQ.k==='netball'&&t<2) tqBib(R,role,t); if(e.gk&&TQ.k==='hockey') tqPads(R);
  return e; }
function tqBallMake(k){ const D=TQ_DEF[k]; let tex=null;
  if(k==='football') tex=canvasTex(128,64,(c,w,h)=>{ c.fillStyle='#fff'; c.fillRect(0,0,w,h); c.fillStyle='#1b1b1b'; for(let i=0;i<10;i++){ const x=(i%5)*w/5+(i<5?8:w/10+8), y=i<5?h*0.3:h*0.72; c.beginPath(); for(let q=0;q<5;q++){ const a=q/5*6.283; c.lineTo(x+Math.cos(a)*7,y+Math.sin(a)*7); } c.fill(); } });
  else if(k==='netball') tex=canvasTex(128,64,(c,w,h)=>{ c.fillStyle='#f4f1e6'; c.fillRect(0,0,w,h); c.strokeStyle='#2a6fb0'; c.lineWidth=5; for(let i=0;i<3;i++){ c.beginPath(); c.moveTo(0,h*(0.25+i*0.25)); c.bezierCurveTo(w*0.3,h*(0.1+i*0.25),w*0.7,h*(0.4+i*0.25),w,h*(0.25+i*0.25)); c.stroke(); } });
  else if(k==='rugby') tex=canvasTex(128,64,(c,w,h)=>{ c.fillStyle='#f2efe6'; c.fillRect(0,0,w,h); c.fillStyle='#7a4b2a'; c.fillRect(0,h*0.42,w,h*0.16); c.fillRect(w*0.46,0,w*0.08,h); });
  const m=new THREE.Mesh(new THREE.SphereGeometry(k==='hockey'?0.06:D.ball.r,16,12),new THREE.MeshLambertMaterial(tex?{map:tex}:{color:0xffffff})); if(k==='rugby') m.scale.set(1,0.64,0.64); m.castShadow=true; scene.add(m); return m; }

/* ---------- a match ---------- */
function tqCanStart(){ return ['walk','drive','ride','jet','bike','menu','drone','fly','kick','pow','team'].includes(S.mode); }
function tqClear(){ for(const e of TQ.E){ scene.remove(e.R.root); try{ mpDispose(e.R.root); }catch(x){} scene.remove(e.sh); } TQ.E=[]; if(TQ.ref){ scene.remove(TQ.ref.R.root); scene.remove(TQ.ref.sh); TQ.ref=null; }
  if(TQ.bm){ scene.remove(TQ.bm); TQ.bm=null; } if(TQ.ring){ scene.remove(TQ.ring); TQ.ring=null; } if(TQ.mark){ scene.remove(TQ.mark); TQ.mark=null; } }
function tqHumans(){ const h=[]; for(const e of TQ.E) if(e.hum) h.push(e); return h; }
function tqMe(){ return TQ.E[TQ.me]||null; }
// set up the players, the ball and the referee; the same seed gives the same players on every device in the room
function tqBuild(o){ tqClear(); TQ.k=o.k; TQ.n=o.n; TQ.dur=o.dur; TQ.rv=o.rv; TQ.df=o.df; TQ.seed=o.seed; TQ.s0=o.s0||1;
  const F=tqPitchBuild(TQ.k,TQ.n); if(!F) return false; TQ.F=F; const rnd=tqRng(o.seed), D=tqD();
  const form=TQ_FORM[(TQ.k==='rugby'?'rg':TQ.k==='netball'?'nb':'fb')+TQ.n];
  for(const t of [0,1]) for(const q of form) TQ.E.push(tqMake(t,q[0],q[1],q[2],rnd));
  TQ.ref=tqMake(2,'R',0.5,0,rnd); TQ.bm=tqBallMake(TQ.k);
  TQ.ring=new THREE.Mesh(new THREE.RingGeometry(0.5,0.66,28).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xf2c230,transparent:true,opacity:0.95,depthWrite:false})); TQ.ring.renderOrder=3; scene.add(TQ.ring);
  TQ.mark=new THREE.Mesh(new THREE.ConeGeometry(0.22,0.4,10).rotateX(Math.PI),new THREE.MeshBasicMaterial({color:0xf2c230})); scene.add(TQ.mark);
  TQ.B={x:F.cx,y:F.y,z:F.cz,own:-1,s:null,sh:null,last:-1,lt:0,to:-1,toT:0,tp:null,kind:'',sv:-1,circ:false,pa:0,fresh:0};
  tqNetVis(TQ.k!=='netball'); TQ.hostGone=false; TQ.ko0=undefined; TQ.setK=''; TQ.goalsMine=0;
  TQ.sc=[0,0]; TQ.half=1; TQ.clk=TQ.dur*30; TQ.ev=[]; TQ.evN=0; TQ.evSeen=0; TQ.conv=null; TQ.ruck=null; TQ.tk=-1; TQ.cp=0; TQ.res=null; TQ.chg=false; TQ.exitT=0;
  for(const e of TQ.E){ const p=tqHomeXZ(e,0.5,true); e.x=p[0]; e.z=p[1]; e.y=W.terrain(e.x,e.z); e.yaw=Math.atan2(tqSgn(e.t)*F.uz,tqSgn(e.t)*F.ux); }
  return true; }
// pick a human's player: the most attacking outfield player not yet taken
function tqPickFor(t){ const c=TQ.E.filter(e=>e.t===t&&!e.hum&&!e.gk); c.sort((a,b)=>b.f-a.f); return c[0]||null; }
function tqStart(k){ if(!TQ.ok){ toast('Deportes de equipo','No hay campos en este mundo'); return; } k=k||TQ.k; if(!tqFr(k)){ toast(TQ_DEF[k].n,'No hay campo en este mundo'); return; }
  if(!tqCanStart()){ toast(TQ_DEF[k].n,'Termina antes lo que estás haciendo'); return; } TQ.k=k; tqSave(); tqHideSheets();
  fadeTo(()=>{ tqLeaveOthers(); TQ.host=true; TQ.net=false; TQ.g=Date.now()%1e9; TQ.hm={};
    if(!tqBuild({k,n:TQ.n,dur:TQ.dur,rv:TQ.rv,df:TQ.df,seed:(Math.random()*1e9)|0,s0:1})) return;
    TQ.my=0; const e=tqPickFor(0); e.hum='me'; TQ.me=e.i; tqBegin(); }); }
function tqHideSheets(){ closeModal(); hideMap(); for(const id of ['tqSheet','fgSheet','kdSheet','flSheet','bkSheet','hlSheet','cirSheet','hrSheet','tdSheet']){ const el=$(id); if(el) el.hidden=true; } }
function tqLeaveOthers(){ if(S.interior) exitVilla(); if(P.fly) flLeave(); if(P.buggy) exitBuggy(); if(P.horse) dismountHorse(); if(P.jet) dismountJet(); if(BK.b) bkUnmount({stay:true}); if(S.mode==='pow') pwExit('walk',0); if(S.mode==='kick') fgLeave(); cirLand(); mpEnterWorld(); }
function tqBegin(){ TQ.on=true; TQ.view=TQ.k==='netball'?0:TQ.view; setMode('team'); S.snap=true; if(rig) rig.root.visible=false; tqKickoff(Math.random()<0.5?0:1,true); tqUI(true);
  const D=tqD(); toast(`${D.ic} ${D.n}: ${tqHome()} contra ${tqAway()}`,`${TQ.n} por equipo · ${TQ.dur} min · ${tqGoalTxt()}`); }
function tqGoalTxt(){ return {football:'mete el balón en la portería de enfrente',hockey:'marca desde dentro del círculo',rugby:'lleva el balón más allá de su línea de marca',netball:'pasa sin moverte con la pelota y tira desde el círculo'}[TQ.k]; }
function tqEnd(quiet){ if(!TQ.on) return; if(TQ.net&&!quiet) mpSend({t:'tqx',g:TQ.g}); TQ.on=false; TQ.net=false; TQ.ph='off'; const e=tqMe(); tqClear(); TQ.F=null; TQ.me=-1;
  const n=TQ.PB.netball?'netball':null; if(n) tqPitchDrop(n); for(const k of ['football','hockey','rugby']) if(TQ.PB[k]&&TQ.PB[k].n!==7) tqPitchBuild(k,7); tqNetVis(true);
  if(S.mode==='team'){ setMode('walk'); P.vx=P.vy=P.vz=0; P.onGround=true; if(rig) rig.root.visible=true; camS.yaw=P.yaw; } $('tqHud').hidden=true; document.body.classList.remove('tqon'); }
function tqExit(){ if(S.mode!=='team') return; const t=tqNow(); if(TQ.ph!=='end'&&t-TQ.exitT>2.5){ TQ.exitT=t; toast('¿Dejar el partido?','Toca «Salir» otra vez'); return; } tqEnd(); tip('Has dejado el partido. Vuelve cuando quieras: «Deportes de equipo» en el menú',3200); }
function tqNetVis(v){ if(W.COURTNET) for(const m of W.COURTNET) m.visible=v; }

/* ---------- where everyone stands ---------- */
// home place of a player, moved up the pitch with the ball (bf: the ball's fraction for this player's side)
function tqHomeXZ(e,bf,ko){ const F=TQ.F, s=tqSgn(e.t); let f=e.f, b=e.b*F.hw*0.92;
  if(TQ.k==='netball'){ if(!ko){ f=e.f+(bf-0.5)*0.18; } }
  else if(!e.gk){ if(ko) f=Math.min(e.f*0.9,0.45); else { const att=TQ.B&&TQ.B.own>=0&&TQ.E[TQ.B.own].t===e.t; f=clamp(e.f+(bf-0.5)*0.55+(att?0.08:-0.04),0.06,0.92); } }
  if(TQ.k==='rugby'&&ko) f=Math.min(f,0.42);
  const p=tqW(F,tqAOf(e.t,f),b); if(TQ.k==='netball') return tqNbClamp(e,p[0],p[1]); return p; }
function tqNbZone(e,x,z){ const F=TQ.F, q=tqL(F,x,z), s=tqSgn(e.t), f=(s*q[0]+F.hl)/F.L, th=f<1/3?0:f<2/3?1:2, Z=TQ_NBZ[e.role]; const r=TQ_DEF.netball.circ;
  const inA=Math.hypot(s*q[0]-F.hl,q[1])<r, inD=Math.hypot(s*q[0]+F.hl,q[1])<r; return th>=Z[0]&&th<=Z[1]&&(!inA||Z[2])&&(!inD||Z[3]); }
function tqNbClamp(e,x,z){ const F=TQ.F, s=tqSgn(e.t), Z=TQ_NBZ[e.role], r=TQ_DEF.netball.circ; let q=tqL(F,x,z), A=s*q[0], b=clamp(q[1],-F.hw+0.3,F.hw-0.3);
  const lo=-F.hl+F.L*Z[0]/3+(Z[0]>0?0.15:0.3), hi=-F.hl+F.L*(Z[1]+1)/3-(Z[1]<2?0.15:0.3); A=clamp(A,lo,hi);
  for(const [cA,ok] of [[F.hl,Z[2]],[-F.hl,Z[3]]]){ if(ok) continue; const da=A-cA, d=Math.hypot(da,b); if(d<r+0.2){ const k=(r+0.2)/(d||1); A=cA+da*k; b=b*k; if(Math.abs(A)>F.hl){ A=Math.sign(A)*(F.hl-0.3); } } }
  return tqW(F,s*A,b); }
function tqKickoff(t,first){ const F=TQ.F, D=tqD(); TQ.ph='ko'; TQ.pt=first?2.2:1.5; TQ.ko=t; if(first) TQ.ko0=t; TQ.lastCP=t; TQ.conv=null; TQ.ruck=null; const B=TQ.B; B.s=null; B.sh=null; B.own=-1; B.to=-1; B.kind='';
  for(const e of TQ.E){ const p=tqHomeXZ(e,0.5,true); e.x=p[0]; e.z=p[1]; e.vx=e.vz=0; e.dn=0; e.dv=0; e.yaw=Math.atan2(tqSgn(e.t)*F.uz,tqSgn(e.t)*F.ux); e.hold=0; e.mp=0; }
  let tk=null; if(TQ.k==='netball'){ tk=TQ.E.find(e=>e.t===t&&e.role==='C'); }
  else { const c=TQ.E.filter(e=>e.t===t&&!e.gk); c.sort((a,b)=>Math.abs(a.b)-Math.abs(b.b)+(b.f-a.f)*0.5); tk=c[0]; }
  const s=tqSgn(t), p=tqW(F,-s*(TQ.k==='rugby'?0.6:0.45),0); tk.x=p[0]; tk.z=p[1]; B.x=F.cx; B.z=F.cz; B.y=W.terrain(B.x,B.z); TQ.tk=tk.i;
  if(TQ.k!=='rugby'&&TQ.k!=='netball'){ const mate=TQ.E.filter(e=>e.t===t&&e!==tk&&!e.gk).sort((a,b)=>b.f-a.f)[0]; if(mate){ const q=tqW(F,-s*1.5,(mate.b>0?1:-1)*3); mate.x=q[0]; mate.z=q[1]; } }
  tqAutoTaker(tk); tqWhistle(first?2:1); tqEv('ko',t); }
// at a restart, if the taker is on a human's side and that human is alone there, the human takes it
function tqAutoTaker(tk){ if(!tk||tk.hum) return; const hs=TQ.E.filter(e=>e.t===tk.t&&e.hum); if(hs.length===1&&!(TQ.k==='rugby'&&TQ.ph==='conv')) tqSwitchTo(hs[0].hum,tk); }

/* ---------- the ball ---------- */
function tqLaunch(x,y,z,vx,vy,vz){ return {x,y,z,vx,vy,vz,air:true,t:0,b:0,done:null,trees:0,walls:0,ap:y,land:null,rim:0,lip:0}; }
function tqFree(s,kind,from){ const B=TQ.B; B.own=-1; B.s=s; B.sh=null; B.x=s.x; B.y=s.y; B.z=s.z; B.kind=kind||''; B.sv=-1; B.fresh=0.15; B.circ=TQ.k==='hockey'&&!!from&&tqInCircle(from); if(from){ B.last=from.i; B.lt=from.t; from.cool=0.35; from.hold=0; } }
function tqBR(){ return TQ.k==='hockey'?0.06:tqD().ball.r; }
function tqCarry(e){ const D=tqD(), c=D.carry, fx=Math.cos(e.yaw), fz=Math.sin(e.yaw), rx=-fz, rz=fx, sp=Math.hypot(e.vx,e.vz);
  let f=c[0]; if(TQ.k==='football') f+=Math.sin(e.anT*2.2)*0.12*Math.min(1,sp/5); if(TQ.k==='netball'&&tqShooter(e)&&TQ.chg&&e.i===TQ.me) return [e.x+fx*0.1,e.y+2.0*e.sc+0.25,e.z+fz*0.1];
  const x=e.x+fx*f+rx*c[1], z=e.z+fz*f+rz*c[1]; return [x,c[2]?e.y+c[2]*e.sc/0.84:W.terrain(x,z)+tqBR(),z]; }
function tqGive(e,quiet){ const B=TQ.B, prev=B.last>=0?TQ.E[B.last]:null, wasTo=B.to; B.own=e.i; B.s=null; B.sh=null; B.to=-1; B.kind=''; B.sv=-1;
  const lostT=B.lt; B.last=e.i; B.lt=e.t; e.hold=0; if(TQ.k==='netball'){ e.vx=e.vz=0; }
  // control follows the ball: a pass to a bot on a human's side hands the human that player; losing it, the nearest
  e.wait=0.6+Math.random()*1.1; if(prev&&prev.t===e.t&&prev.hum&&!e.hum&&!e.gk&&wasTo===e.i) tqSwitchTo(prev.hum,e);
  else if(!e.hum&&!e.gk){ const hs=TQ.E.filter(h=>h.hum&&h.t===e.t); if(hs.length===1) tqSwitchTo(hs[0].hum,e); }
  if(lostT!==e.t&&!quiet){ for(const h of TQ.E.filter(h=>h.hum&&h.t!==e.t)){ const nb=tqNearest(h.t,e.x,e.z,h); if(nb&&!nb.hum&&Math.hypot(h.x-e.x,h.z-e.z)>Math.hypot(nb.x-e.x,nb.z-e.z)+4) tqSwitchTo(h.hum,nb); } } }
function tqNearest(t,x,z,not,gkOK){ let best=null,bd=1e9; for(const e of TQ.E){ if(e.t!==t||e===not||e.dn>0||(e.gk&&!gkOK)) continue; if(TQ.k==='netball'&&!tqNbZone(e,x,z)) continue; const d=Math.hypot(e.x-x,e.z-z); if(d<bd){ bd=d; best=e; } } return best; }
function tqSwitchTo(h,e){ if(!h||!e||e.hum===h) return; if(e.hum&&e.hum!==h) return; for(const q of TQ.E) if(q.hum===h) q.hum=null; e.hum=h; if(h==='me'){ TQ.me=e.i; TQ.chg=false; } }
function tqSwitch(h){ h=h||'me'; const cur=TQ.E.find(e=>e.hum===h); if(!cur) return; const B=TQ.B; let best=null,bd=1e9;
  for(const e of TQ.E){ if(e===cur||e.t!==cur.t||e.hum||e.gk||e.dn>0) continue; const d=Math.hypot(e.x-B.x,e.z-B.z); if(d<bd){ bd=d; best=e; } } if(best){ tqSwitchTo(h,best); if(h==='me') blip('jump'); } }
function tqShooter(e){ return TQ.k==='netball'&&(e.role==='GS'||e.role==='GA'); }
function tqInCircle(e,x,z){ const F=TQ.F, s=tqSgn(e.t), q=tqL(F,x===undefined?e.x:x,z===undefined?e.z:z), D=tqD();
  if(TQ.k==='hockey'){ const r=D.circ[TQ.n], gp=D.goal[0]/2, A=s*q[0]; return F.hl-A<r+0.2&&(Math.abs(q[1])<=gp||Math.hypot(F.hl-A,Math.abs(q[1])-gp)<r+0.2); }
  if(TQ.k==='netball') return Math.hypot(s*q[0]-F.hl,q[1])<D.circ; return false; }
function tqInBox(t,x,z){ const F=TQ.F, D=tqD(), s=tqSgn(t), q=tqL(F,x,z), A=-s*q[0];   // your own area, in front of your goal
  if(TQ.k==='football'){ const bx=D.box[TQ.n]; return A>F.hl-bx[0]-0.2&&A<F.hl+1&&Math.abs(q[1])<bx[1]/2+0.2; }
  if(TQ.k==='hockey'){ const r=D.circ[TQ.n], gp=D.goal[0]/2; return F.hl-A<r&&(Math.abs(q[1])<=gp||Math.hypot(F.hl-A,Math.abs(q[1])-gp)<r); } return false; }
function tqBallStep(dt){ const B=TQ.B, F=TQ.F, D=tqD();
  if(B.own>=0){ const e=TQ.E[B.own], c=tqCarry(e); B.x=c[0]; B.y=c[1]; B.z=c[2]; tqCarryBounds(e); return; }
  if(B.sh){ tqShotFly(dt); return; }
  if(!B.s){ B.y=W.terrain(B.x,B.z)+tqBR(); return; }
  const s=B.s; if(s.done==='stop'){ s.vx=s.vz=0; return; } s.done=null; const o={trees:false}; let acc=Math.min(dt,0.05), n=0;
  while(acc>1e-6&&n<12&&TQ.B.s===s){ const st=Math.min(1/120,acc); acc-=st; n++; const q0=tqL(F,s.x,s.z), y0=s.y; fgStep(s,st,D.ball,o); if(s.done==='water'||s.done==='out'||s.done==='roof') s.done='stop';
    B.x=s.x; B.y=s.y+(s.air?(TQ.k==='hockey'?0.024:0):tqBR()); B.z=s.z; if(tqBallEvents(q0,y0,s)) return; if(s.done==='stop'){ s.vx=s.vz=0; break; } } }
// the line rules: goals, posts, touch, the goal line and the dead-ball line
function tqBallEvents(q0,y0,s){ const F=TQ.F, D=tqD(), B=TQ.B, q=tqL(F,s.x,s.z), r=TQ.k==='hockey'?0.036:D.ball.r, gy=W.terrain(s.x,s.z), h=s.y-gy, k=TQ.k;
  if(TQ.ph!=='play'&&TQ.ph!=='conv') return false;
  if(k==='rugby'){ for(const e of [-1,1]){ if(q0[0]*e<F.hl&&q[0]*e>=F.hl&&(B.kind==='drop'||B.kind==='conv')){ const t=tqSgn(0)===e?0:1; if(t===B.lt&&Math.abs(q[1])<D.posts[0]/2&&h>D.posts[1]){ if(B.kind==='conv') tqConvEnd(true); else tqScore(t,3,'dropg',TQ.E[B.last]); return true; } if(B.kind==='conv'){ tqConvEnd(false); return true; } } }
    if(TQ.ph==='conv'){ if(s.done==='stop'||Math.abs(q[0])>F.hl+F.ig+20){ tqConvEnd(false); return true; } return false; }
    if(Math.abs(q[1])>F.hw+r&&h<2.5){ tqDead('line',1-B.lt,s.x,s.z,'touch'); return true; }
    if(Math.abs(q[0])>F.hl+F.ig){ const e=Math.sign(q[0]), t=tqSgn(0)===e?1:0; tqDead('drop',t,...tqW(F,e*(F.hl-F.L*0.22),0),'dead'); return true; }
    if(s.done==='stop'&&Math.abs(q[0])>F.hl){ const e=Math.sign(q[0]), t=tqSgn(0)===e?1:0; tqDead('drop',t,...tqW(F,e*(F.hl-F.L*0.22),0),'dead'); return true; } return false; }
  if(k==='netball'){ if(Math.abs(q[0])>F.hl+r||Math.abs(q[1])>F.hw+r){ const p=tqW(F,clamp(q[0],-F.hl,F.hl),clamp(q[1],-F.hw,F.hw)); tqDead('side',1-B.lt,p[0],p[1],'out'); return true; } return false; }
  // football and hockey
  for(const e of [-1,1]){ if(q0[0]*e<F.hl+r&&q[0]*e>=F.hl+r){ const gw=D.goal[0], gh=D.goal[1], t=tqSgn(0)===e?0:1;   // t attacks this end
      if(Math.abs(q[1])<gw/2-r&&h<gh-r*0.5){ if(k==='hockey'&&!(B.circ&&B.lt===t)){ tqDead('free',1-t,...tqW(F,e*(F.hl-14.6*F.L/91.4),q[1]*0.5),'nogoal'); return true; }
        s.vx*=0.08; s.vz*=0.08; s.vy=Math.min(s.vy,0); const p=tqW(F,e*(F.hl+D.goal[2]*0.7),q[1]); s.x=p[0]; s.z=p[1]; B.x=s.x; B.z=s.z; s.done='stop'; tqScore(t,1,'goal',TQ.E[B.last]); return true; }
      if(B.lt===t){ const p=tqW(F,e*(F.hl-(k==='football'?5:14.6*F.L/91.4)),0); tqDead(k==='football'?'gkick':'free',1-t,p[0],p[1],k==='football'?'gkick':'back'); }
      else { const p=tqW(F,e*(F.hl-(k==='hockey'?4.5:0.3)),Math.sign(q[1]||1)*(F.hw-0.3)); tqDead('corner',t,p[0],p[1],'corner'); } return true; } }
  if(Math.abs(q[1])>F.hw+r){ const p=tqW(F,clamp(q[0],-F.hl+0.5,F.hl-0.5),Math.sign(q[1])*(F.hw-0.1)); tqDead('side',1-B.lt,p[0],p[1],'out'); return true; } return false; }
// a carrier who runs over a line: touch, a try or the dead-ball line
function tqCarryBounds(e){ if(TQ.ph!=='play') return; const F=TQ.F, q=tqAB(e), s=tqSgn(e.t);
  if(TQ.k==='rugby'){ if(s*q[0]>F.hl+0.3&&Math.abs(q[1])<F.hw){ tqTry(e,q); return; } if(Math.abs(q[1])>F.hw+0.1){ tqDead('line',1-e.t,e.x,e.z,'touch'); return; } if(-s*q[0]>F.hl+F.ig){ tqDead('drop',1-e.t,...tqW(F,-s*(F.hl-F.L*0.22),0),'dead'); } return; }
  if(TQ.k==='netball') return;
  if(Math.abs(q[1])>F.hw+0.15){ const p=tqW(F,q[0],Math.sign(q[1])*(F.hw-0.1)); tqDead('side',1-e.t,p[0],p[1],'out'); return; }
  if(Math.abs(q[0])>F.hl+0.15){ const end=Math.sign(q[0]), t=tqSgn(0)===end?0:1; if(e.t===t){ const p=tqW(F,end*(F.hl-5),0); tqDead(TQ.k==='football'?'gkick':'free',1-t,p[0],p[1],TQ.k==='football'?'gkick':'back'); } else { const p=tqW(F,end*(F.hl-0.3),Math.sign(q[1]||1)*(F.hw-0.3)); tqDead('corner',t,p[0],p[1],'corner'); } } }

/* ---------- kicks, passes, shots and tackles ---------- */
function tqDec(){ const D=tqD(); return (FG_SURF[10]||[0,0,0.22])[2]*D.ball.rollK*GRAV; }
function tqPass(e,m,dir){ const D=tqD(), B=TQ.B, c=tqCarry(e); if(B.own!==e.i) return false;
  if(!m){ // into space, where the stick points
    const dx=dir?dir[0]:Math.cos(e.yaw), dz=dir?dir[1]:Math.sin(e.yaw); if(D.hands){ const v=10, tf=1.0; tqFree(tqLaunch(c[0],c[1],c[2],dx*v,(0.5*GRAV*tf),dz*v),'pass',e); }
    else { const s=fgShoot(c[0],W.terrain(c[0],c[2]),c[2],Math.atan2(dz,dx),12,0); s.air=false; tqFree(s,'pass',e); } e.kT=0; e.kk=D.hands?'throw':'kick'; tqAfterKick(); return true; }
  const lead=TQ.k==='netball'?0.15:0.4, d0=Math.hypot(m.x-c[0],m.z-c[2]), tl=Math.min(1.4,d0/12+0.15); let tx=m.x+m.vx*tl*lead*2.2, tz=m.z+m.vz*tl*lead*2.2;
  if(TQ.k==='netball'){ const p=tqNbClamp(m,tx,tz); tx=p[0]; tz=p[1]; }
  if(TQ.k==='rugby'&&!(TQ.ph==='set'&&TQ.setK==='line')){ const F=TQ.F, s=tqSgn(e.t), pq=tqAB(e), tq=tqL(F,tx,tz); if(s*(tq[0]-pq[0])>-0.3){ const p=tqW(F,pq[0]-s*0.3,tq[1]); tx=p[0]; tz=p[1]; } }
  const dx=tx-c[0], dz=tz-c[2], d=Math.hypot(dx,dz)||1;
  if(D.hands){ const vh=TQ.k==='netball'?11.5:10.5, tf=d/vh+0.05, ty=W.terrain(tx,tz)+1.15*m.sc/0.84; const vy=(ty-c[1])/tf+0.5*GRAV*tf; tqFree(tqLaunch(c[0],c[1],c[2],dx/tf,vy,dz/tf),'pass',e); e.kk='throw'; }
  else if(d>24&&TQ.k==='football'){ const lf=24*Math.PI/180, v=Math.sqrt(d*GRAV/Math.sin(2*lf))*1.06; tqFree(fgShoot(c[0],c[1],c[2],Math.atan2(dz,dx),v,24),'pass',e); e.kk='kick'; }
  else { const v=Math.min(TQ.k==='hockey'?24:21,Math.sqrt(2*tqDec()*d)+(TQ.k==='hockey'?3.5:2.5)); const s=fgShoot(c[0],W.terrain(c[0],c[2]),c[2],Math.atan2(dz,dx),v,0); s.air=false; tqFree(s,'pass',e); e.kk=TQ.k==='hockey'?'hit':'kick'; }
  B.to=m.i; B.toT=TQ.k==='netball'?2:3; B.tp=[tx,tz]; B.pa=tqAB(e)[0]; e.kT=0; tqAfterKick(); blip('jump'); return true; }
function tqAfterKick(){ if(TQ.ph==='set'){ TQ.ph='play'; TQ.tk=-1; } }
// the best pass for a bot (and for a human who points nowhere): forward, open, a clear lane, not too far
function tqLegal(e,m){ if(TQ.k!=='rugby'||(TQ.ph==='set'&&TQ.setK==='line')) return true; const s=tqSgn(e.t); return s*(tqAB(m)[0]-tqAB(e)[0])<=0.4; }
function tqOpen(m){ let d=99; for(const o of TQ.E){ if(o.t===m.t||o.dn>0) continue; d=Math.min(d,Math.hypot(o.x-m.x,o.z-m.z)); } return d; }
function tqLane(e,m){ let best=99; const ax=m.x-e.x, az=m.z-e.z, L2=ax*ax+az*az||1; for(const o of TQ.E){ if(o.t===e.t||o.dn>0) continue; const u=clamp(((o.x-e.x)*ax+(o.z-e.z)*az)/L2,0,1); best=Math.min(best,Math.hypot(e.x+ax*u-o.x,e.z+az*u-o.z)); } return best; }
function tqPassScore(e,m){ const s=tqSgn(e.t), d=Math.hypot(m.x-e.x,m.z-e.z), mx=TQ.k==='netball'?14:TQ.k==='rugby'?18:34; if(d<2.5||d>mx||m.dn>0||!tqLegal(e,m)) return -1e9;
  const prog=s*(tqAB(m)[0]-tqAB(e)[0]); let sc=0.05*prog+0.14*Math.min(tqOpen(m),7)+0.2*Math.min(tqLane(e,m),4)-0.025*d-(m.gk?1.5:0);
  if(TQ.k==='netball'&&tqShooter(m)&&tqInCircle(m)) sc+=0.9; if(TQ.k==='rugby') sc=0.2*Math.min(tqOpen(m),6)+0.1*Math.min(tqLane(e,m),4)-0.04*Math.abs(d-6); return sc; }
function tqBestPass(e){ let best=null,bs=-1e9; for(const m of TQ.E){ if(m===e||m.t!==e.t) continue; const sc=tqPassScore(e,m); if(sc>bs){ bs=sc; best=m; } } return best&&bs>-1e8?{m:best,sc:bs}:null; }
function tqPassTo(e,dir){ let best=null,bs=-1e9; if(dir){ for(const m of TQ.E){ if(m===e||m.t!==e.t||m.dn>0||!tqLegal(e,m)) continue; const dx=m.x-e.x, dz=m.z-e.z, d=Math.hypot(dx,dz); if(d<2||d>(TQ.k==='netball'?16:40)) continue;
      const c=(dx*dir[0]+dz*dir[1])/d; if(c<0.5) continue; const sc=c*3-d*0.035+Math.min(tqOpen(m),6)*0.06; if(sc>bs){ bs=sc; best=m; } } }
  if(!best){ const q=tqBestPass(e); best=q?q.m:null; } return best; }
// shots: at goal (football, hockey), drop goals and kicks ahead (rugby), at the ring (netball)
function tqShoot(e,p,dir){ const D=tqD(), B=TQ.B, F=TQ.F, s=tqSgn(e.t); if(B.own!==e.i) return; p=clamp(p,0.05,1); const c=tqCarry(e), q=tqAB(e), ez=TQ.df===0||(e.hum&&ezOn());
  if(TQ.k==='netball'){ if(!(tqShooter(e)&&tqInCircle(e))) return; tqNbShoot(e,p); return; }
  if(TQ.k==='rugby'){ const dg=Math.hypot(F.hl-s*q[0],q[1]); if(TQ.ph==='conv'||(dg<32&&Math.abs(q[1])<14&&s*q[0]>0&&!(dir&&Math.abs(dir[0]*F.vx+dir[1]*F.vz)>0.7))){ const g=tqW(F,s*F.hl,clamp(q[1]*0.15+(dir?(dir[0]*F.vx+dir[1]*F.vz)*1.2:0),-1.5,1.5));
        const yaw=TQ.ph==='conv'&&TQ.conv&&Number.isFinite(TQ.conv.yaw)?TQ.conv.yaw:Math.atan2(g[1]-c[2],g[0]-c[0]), err=gauss()*(TQ.ph==='conv'&&e.hum?(ez?0.4:0.9):ez?0.6:1.4)*Math.PI/180;
        const cx=TQ.ph==='conv'?TQ.conv.p[0]:c[0], cz=TQ.ph==='conv'?TQ.conv.p[1]:c[2]; tqFree(fgShoot(cx,TQ.ph==='conv'?W.terrain(cx,cz)+0.2:c[1]-0.5,cz,yaw+err,(TQ.ph==='conv'?31:27)*p,TQ.ph==='conv'?36:33),TQ.ph==='conv'?'conv':'drop',e); }
    else { const dx=dir?dir[0]:s*F.ux, dz=dir?dir[1]:s*F.uz; tqFree(fgShoot(c[0],c[1]-0.4,c[2],Math.atan2(dz,dx)+gauss()*0.04,10+16*p,40),'kick',e); }
    e.kT=0; e.kk='kick'; tqAfterKick(); blip('hit'); return; }
  const inC=TQ.k!=='hockey'||tqInCircle(e); const gw=D.goal[0];
  if(TQ.k==='hockey'&&!inC){ const m=tqPassTo(e,dir); if(m&&Math.hypot(m.x-e.x,m.z-e.z)>8){ tqPass(e,m); e.kk='hit'; return; } const dx=dir?dir[0]:s*F.ux, dz=dir?dir[1]:s*F.uz; const sh=fgShoot(c[0],c[1],c[2],Math.atan2(dz,dx),12+12*p,0); sh.air=false; tqFree(sh,'hit',e); e.kT=0; e.kk='hit'; tqAfterKick(); blip('hit'); return; }
  const gk=TQ.E.find(o=>o.t!==e.t&&o.gk), gq=gk?tqAB(gk):[0,0]; let lat=dir?(dir[0]*F.vx+dir[1]*F.vz):0; if(Math.abs(lat)<0.25) lat=-(Math.sign(gq[1])||1)*0.7; const aimB=clamp(lat,-1,1)*(gw/2-0.4);
  const hT=TQ.k==='hockey'?0.15+0.55*p:0.3+1.1*p*p, g=tqW(F,s*F.hl,aimB), dx=g[0]-c[0], dz=g[1]-c[2], d=Math.hypot(dx,dz)||1, v=D.shot[0]+(D.shot[1]-D.shot[0])*p, t=d/v;
  const loft=Math.atan2(hT-(c[1]-W.terrain(c[0],c[2]))+0.5*GRAV*t*t*0.9,d)*180/Math.PI, press=tqOpen(e)<1.6?1.8:0;
  const err=gauss()*((ez?0.6:1)*(1.1+3.4*p*p)+press)*Math.PI/180, ev=gauss()*(ez?0.5:1)*(p>0.9?2.5:1);
  const sh=fgShoot(c[0],W.terrain(c[0],c[2])+(TQ.k==='hockey'?0.036:D.ball.r),c[2],Math.atan2(dz,dx)+err,v,Math.max(0.5,loft+ev)); tqFree(sh,'shot',e); e.kT=0; e.kk=TQ.k==='hockey'?'hit':'kick'; tqAfterKick(); blip('hit'); }
// netball shots fly on a set arc: in, or off the rim (the power you need is shown on the ring: TQ.ideal)
function tqRingPos(t){ const F=TQ.F, D=TQ_DEF.netball, s=tqSgn(t), p=tqW(F,s*(F.hl-0.34),0); return [p[0],W.terrain(p[0],p[1])+D.ring,p[1]]; }
function tqNbIdeal(e){ const R=tqRingPos(e.t); return clamp(0.36+Math.hypot(R[0]-e.x,R[2]-e.z)*0.095,0.36,0.86); }
function tqNbShoot(e,p){ const R=tqRingPos(e.t), d=Math.hypot(R[0]-e.x,R[2]-e.z), ideal=tqNbIdeal(e), ez=e.hum?(ezOn()||TQ.df===0):false; let pr;
  if(e.hum){ const er=Math.abs(p-ideal); pr=er<(ez?0.12:0.06)?0.93:er<(ez?0.2:0.12)?0.55:0.12; } else pr=0.7-0.055*d+0.05*TQ.df;
  const mk=TQ.E.find(o=>o.t!==e.t&&Math.hypot(o.x-e.x,o.z-e.z)<1.3); if(mk) pr*=0.82; const ok=Math.random()<pr; const B=TQ.B, c=[e.x+Math.cos(e.yaw)*0.1,e.y+2.0*e.sc+0.25,e.z+Math.sin(e.yaw)*0.1];
  const a=Math.random()*6.283, off=ok?0:0.2+Math.random()*0.12, T=[R[0]+Math.cos(a)*off,R[1]+(ok?0:0.05),R[2]+Math.sin(a)*off], tf=0.8+d*0.05;
  B.own=-1; B.s=null; B.sh={x0:c[0],y0:c[1],z0:c[2],vx:(T[0]-c[0])/tf,vy:(T[1]-c[1])/tf+0.5*GRAV*tf,vz:(T[2]-c[2])/tf,t:0,tf,ok,team:e.t,R,a}; B.kind='nbshot'; B.last=e.i; B.lt=e.t; e.cool=0.4; e.hold=0; e.kT=0; e.kk='throw'; tqAfterKick(); }
function tqShotFly(dt){ const B=TQ.B, h=B.sh; h.t+=dt; const t=Math.min(h.t,h.tf); B.x=h.x0+h.vx*t; B.y=h.y0+h.vy*t-0.5*GRAV*t*t; B.z=h.z0+h.vz*t; if(h.t<h.tf) return;
  B.sh=null; if(h.ok){ tqFree(tqLaunch(h.R[0],h.R[1]-0.12,h.R[2],0,-1.2,0),'in'); B.lt=h.team; tqScore(h.team,1,'netgoal',TQ.E[B.last]); }
  else { const ox=Math.cos(h.a), oz=Math.sin(h.a); tqFree(tqLaunch(B.x,B.y,B.z,ox*2.4,2.2,oz*2.4),'rim'); B.lt=h.team; blip('hit'); tqEv('rim',h.team); } }
// football and hockey tackles; rugby tackles
function tqTackle(e){ if(e.tkT<0.7||e.dn>0) return; const B=TQ.B, o=B.own>=0?TQ.E[B.own]:null; e.tkT=0;
  if(TQ.k==='netball'){ e.jT=0; return; }
  if(!o||o.t===e.t){ if(!o){ const dx=B.x-e.x, dz=B.z-e.z, d=Math.hypot(dx,dz)||1; if(d<3){ e.vx+=dx/d*4; e.vz+=dz/d*4; } } return; }
  const d=Math.hypot(o.x-e.x,o.z-e.z); if(e.hum&&d<3.5){ e.vx+=(o.x-e.x)/(d||1)*5; e.vz+=(o.z-e.z)/(d||1)*5; } if(d>(TQ.k==='rugby'?2.2:2.0)) { e.cool=0.3; return; }
  if(TQ.k==='rugby'){ e.dv=0.55; const k=(e.hum?0.88:0.5+0.13*TQ.df)*(o.hum?0.8:1)*(d<1.5?1:0.6); if(Math.random()<k){ o.dn=1.4; e.dn=1.0; tqRuck(o); } else { e.dn=0.6; } return; }
  const fx=Math.cos(o.yaw), fz=Math.sin(o.yaw), front=(fx*(e.x-o.x)+fz*(e.z-o.z))/(d||1); e.dv=0.3;
  if(front<-0.5&&Math.random()<(e.hum?0.35:0.25)){ tqDead('free',o.t,o.x,o.z,'foul'); return; }
  const k=(e.hum?0.78:0.34+0.16*TQ.df)*(front>0?1:0.6)*(d<1.4?1:0.55)*(o.hum&&ezOn()?0.6:1);
  if(Math.random()<k){ const c=tqCarry(o), ang=Math.atan2(e.z-o.z,e.x-o.x)+Math.PI+(Math.random()-0.5); const s=fgShoot(c[0],W.terrain(c[0],c[2]),c[2],e.hum?Math.atan2(c[2]-e.z,c[0]-e.x):ang,2.2,0); s.air=false; tqFree(s,'loose',o); o.cool=0.7; e.cool=0; tqEv('steal',e.t); }
  else e.cool=0.5; }
function tqRuck(o){ const B=TQ.B; B.own=-1; B.s=null; const p=[o.x-Math.cos(o.yaw)*0.6,o.z-Math.sin(o.yaw)*0.6]; B.x=p[0]; B.z=p[1]; B.y=W.terrain(p[0],p[1])+0.15; TQ.ruck={t:o.t,T:0.9,x:p[0],z:p[1]}; tqEv('tackle',1-o.t); blip('hit'); }
function tqRuckEnd(){ const R=TQ.ruck; TQ.ruck=null; const keep=Math.random()<(TQ.E.some(e=>e.hum&&e.t===R.t)?0.9:0.8-0.05*TQ.df)?R.t:1-R.t; const w=tqNearest(keep,R.x,R.z,null)||tqNearest(keep,R.x,R.z,null,true); if(!w) return;
  const s=tqSgn(keep), F=TQ.F, q=tqL(F,R.x,R.z), p=tqW(F,q[0]-s*0.8,q[1]); w.x=p[0]; w.z=p[1]; w.vx=w.vz=0; tqGive(w); w.mp=1; if(keep!==R.t) tqEv('turn',keep); }
function tqTry(e,q){ const F=TQ.F; TQ.B.own=-1; e.dv=0.6; tqScore(e.t,5,'try',e); TQ.conv={t:e.t,b:clamp(q[1],-F.hw+4,F.hw-4)}; }

/* ---------- referee: restarts, scores, half time and the final whistle ---------- */
function tqWhistle(n){ if(!AC||!master) return; const t=AC.currentTime; try{ for(let i=0;i<(n||1);i++){ const o=hlOsc('square',2850,2700,t+i*0.32,i===(n||1)-1?0.55:0.22,0.07,3800,4); const l=AC.createOscillator(), lg=AC.createGain(); l.frequency.value=32; lg.gain.value=120; l.connect(lg); lg.connect(o.frequency); l.start(t+i*0.32); l.stop(t+i*0.32+0.6); } }catch(e){} }
function tqEv(code,t,x){ TQ.evN++; TQ.ev.push([TQ.evN,code,t===undefined?-1:t,x===undefined?0:x]); if(TQ.ev.length>6) TQ.ev.shift(); tqEvShow(TQ.ev[TQ.ev.length-1]); }
function tqEvShow(v){ if(v[0]<=TQ.evSeen) return; TQ.evSeen=v[0]; const m=v[1]==='end'?null:tqEvText(v[1],v[2],v[3]); if(m) toast(m[0],m[1]); if(['goal','try','netgoal','dropg','conv'].includes(v[1])){ const mine=v[2]===TQ.my; blip(mine?'cup':'door'); if(mine) P.cheerT=2; }
  if(['out','corner','gkick','free','foul','back','nogoal','touch','dead','3s','fwd','half','end'].includes(v[1])) tqWhistle(v[1]==='end'?3:v[1]==='half'?2:1); }
function tqEvText(c,t,x){ const N=t>=0?tqTeamN(t):'', D=tqD();
  switch(c){ case 'ko': return [D.ic+' '+(TQ.k==='netball'?'Pase de centro':TQ.k==='rugby'?'Saque inicial':'Saque de centro'),`Saca ${N}`];
    case 'goal': return [`¡Gol de ${N}!`,tqScoreTxt()]; case 'netgoal': return [`¡Canasta de ${N}!`,tqScoreTxt()]; case 'try': return [`¡Ensayo de ${N}! +5`,`${tqScoreTxt()} · ahora la conversión`];
    case 'dropg': return [`¡Drop de ${N}! +3`,tqScoreTxt()]; case 'conv': return ['¡Conversión! +2',tqScoreTxt()]; case 'convno': return ['Conversión fallada',tqScoreTxt()];
    case 'out': return [TQ.k==='hockey'?'Saque lateral':TQ.k==='netball'?'Fuera: saque de banda':'Saque de banda',`Para ${N}`]; case 'corner': return [TQ.k==='hockey'?'Córner largo':'Córner',`Para ${N}`];
    case 'gkick': return ['Saque de puerta',`Para ${N}`]; case 'back': return ['Saque desde la línea de 15 m',`Para ${N}`]; case 'nogoal': return ['No vale: se tira desde dentro del círculo',`Saque para ${N}`];
    case 'free': return ['Golpe franco',`Para ${N}`]; case 'foul': return ['Falta: entrada por detrás',`Golpe franco para ${N}`]; case 'touch': return ['Touch: saque de banda',`Para ${N}`];
    case 'dead': return ['Balón muerto',`Saque desde la línea de 22 para ${N}`]; case 'fwd': return ['Pase adelantado',`Melé para ${N}`]; case '3s': return ['Tres segundos',`Has tardado mucho en pasar: pase para ${N}`];
    case 'tackle': return ['¡Placaje!',`Placaje de ${N}`]; case 'turn': return ['¡Balón robado en el ruck!',`Ahora es de ${N}`]; case 'steal': return null; case 'rim': return ['¡Al aro!','Rebote'];
    case 'half': return ['Descanso',`${tqScoreTxt()} · cambio de campo`]; case 'end': return ['Final del partido',tqScoreTxt()]; }
  return null; }
function tqScoreTxt(){ return tqHome()+' '+TQ.sc[0]+' – '+TQ.sc[1]+' '+tqAway(); }
function tqDead(kind,t,x,z,code){ if(TQ.ph!=='play'&&TQ.ph!=='set') return; const B=TQ.B; TQ.ph='dead'; TQ.pt=1.1; TQ.rs={k:kind,t,x,z}; B.own=-1; B.s=null; B.sh=null; B.to=-1; B.x=x; B.z=z; B.y=W.terrain(x,z)+tqBR(); tqEv(code,t); }
function tqRestart(){ const R=TQ.rs, B=TQ.B; TQ.rs=null; const gkOK=R.k==='gkick'||(TQ.k==='hockey'&&R.k==='free'&&tqInBox(R.t,R.x,R.z));
  const tk=R.k==='gkick'?TQ.E.find(e=>e.t===R.t&&e.gk):tqNearest(R.t,R.x,R.z,null,gkOK)||tqNearest(R.t,R.x,R.z,null,true); if(!tk){ TQ.ph='play'; return; }
  const F=TQ.F, s=tqSgn(R.t), q=tqL(F,R.x,R.z); const back=TQ.k==='netball'?0.3:0.9, p=tqW(F,q[0]-s*back*(R.k==='side'||R.k==='line'?0.2:1),q[1]-(R.k==='side'||R.k==='line'?Math.sign(q[1])*0.5:0));
  tk.x=p[0]; tk.z=p[1]; tk.vx=tk.vz=0; tk.yaw=Math.atan2(F.cz-tk.z,F.cx-tk.x)*0.5+Math.atan2(s*F.uz,s*F.ux)*0.5; if(R.k==='side'||R.k==='line') tk.yaw=Math.atan2(-Math.sign(q[1])*F.vz,-Math.sign(q[1])*F.vx);
  tqGive(tk,true); TQ.ph='set'; TQ.setK=R.k; TQ.tk=tk.i; TQ.pt=tk.hum?9:0.7+Math.random()*0.6; tqAutoTaker(tk); tqPushOff(tk); }
// opponents step back from a restart (5 m; 0.9 m in netball)
function tqPushOff(tk){ const r=TQ.k==='netball'?0.9:TQ.k==='rugby'?5:4.5; for(const e of TQ.E){ if(e.t===tk.t) continue; const dx=e.x-tk.x, dz=e.z-tk.z, d=Math.hypot(dx,dz); if(d<r){ const k=r/(d||1); e.x=tk.x+dx*k; e.z=tk.z+dz*k; if(TQ.k==='netball'){ const p=tqNbClamp(e,e.x,e.z); e.x=p[0]; e.z=p[1]; } } } }
function tqScore(t,pts,code,by){ const B=TQ.B; TQ.sc[t]+=pts; TQ.ph='goal'; TQ.pt=code==='try'?2.2:2.6; TQ.after=code==='try'?'conv':'ko'; TQ.koT=code==='netgoal'?1-TQ.lastCP:1-t; B.own=-1; B.to=-1;
  for(const e of TQ.E){ if(e.t===t) e.cheer=2.2; } tqEv(code,t); if(t===TQ.my&&!TQ.res) TQ.goalsMine=(TQ.goalsMine||0)+1; }
function tqConvStart(){ const C=TQ.conv, F=TQ.F, s=tqSgn(C.t), p=tqW(F,s*(F.hl-12),C.b), B=TQ.B; TQ.ph='conv'; TQ.pt=0;
  let kk=TQ.E.find(e=>e.t===C.t&&e.hum)||TQ.E.filter(e=>e.t===C.t).sort((a,b)=>a.f-b.f)[0]; B.x=p[0]; B.z=p[1]; B.y=W.terrain(p[0],p[1])+0.2;
  const g=tqW(F,s*F.hl,0); C.p=p; C.yaw=Math.atan2(g[1]-p[1],g[0]-p[0]); C.yaw0=C.yaw; kk.x=p[0]-Math.cos(C.yaw)*2; kk.z=p[1]-Math.sin(C.yaw)*2; kk.yaw=C.yaw; kk.vx=kk.vz=0; C.e=kk.i; C.T=kk.hum?12:1.6;
  B.own=-1; B.s=null; B.last=kk.i; B.lt=kk.t; if(!kk.hum){ const hs=TQ.E.filter(h=>h.hum&&h.t===kk.t); if(hs.length===1){ tqSwitchTo(hs[0].hum,kk); C.T=12; } } TQ.ideal=kk.hum?tqConvIdeal(p,C.yaw):null; TQ.chg=false;
  for(const e of TQ.E){ if(e===kk) continue; const h=tqHomeXZ(e,0.5,true); const q=tqL(F,h[0],h[1]); const pp=e.t===C.t?tqW(F,q[0]*0.5-s*6,q[1]):tqW(F,s*(F.hl+3),q[1]*0.6); e.x=pp[0]; e.z=pp[1]; e.vx=e.vz=0; } }
function tqConvIdeal(p,yaw){ const F=TQ.F, D=tqD(); let lo=0.3, hi=1; for(let k=0;k<14;k++){ const m=(lo+hi)/2, s=fgShoot(p[0],W.terrain(p[0],p[1])+0.2,p[1],yaw,31*m,36); let y=-1;
    for(let i=0;i<900&&!s.done;i++){ const q0=tqL(F,s.x,s.z)[0]; fgStep(s,1/120,D.ball,{}); const q1=tqL(F,s.x,s.z)[0]; if(Math.abs(q0)<F.hl&&Math.abs(q1)>=F.hl){ y=s.y-W.terrain(s.x,s.z); break; } if(!s.air) break; } if(y<5.5) lo=m; else hi=m; } return (lo+hi)/2; }
function tqConvKick(p){ const C=TQ.conv; if(!C||TQ.ph!=='conv'||C.kicked) return; const e=TQ.E[C.e]; C.kicked=true; e.x=C.p[0]-Math.cos(C.yaw)*0.6; e.z=C.p[1]-Math.sin(C.yaw)*0.6; e.yaw=C.yaw; TQ.B.own=e.i; tqShoot(e,p); C.T=6; TQ.chg=false; }
function tqConvEnd(ok){ const C=TQ.conv; if(!C) return; if(ok){ TQ.sc[C.t]+=2; tqEv('conv',C.t); } else tqEv('convno',C.t); TQ.conv=null; TQ.ph='goal'; TQ.pt=1.6; TQ.after='ko'; TQ.koT=C.t; TQ.ideal=null; }
function tqHalf(){ TQ.ph='half'; TQ.pt=3; tqEv('half'); }
function tqFinal(){ TQ.ph='end'; TQ.pt=0; tqEv('end'); const B=TQ.B; B.own=-1; B.s=null; B.sh=null; tqResult(); }
function tqResult(){ const my=TQ.my, a=TQ.sc[my], b=TQ.sc[1-my], r=a>b?0:a===b?1:2, st=tqStat(TQ.k); st[r]++; st[3]+=a; st[4]+=b; const ez=ezOn();
  TQ.res={r,a,b}; const D=tqD(); prgEarn(r===0?10:r===1?5:2,r===0?`${D.n}: victoria`:r===1?`${D.n}: empate`:`${D.n}: partido jugado`);
  if(r===0){ const id={football:'tqfutbol',hockey:'tqhockey',rugby:'tqrugby',netball:'tqnetball'}[TQ.k]; prgTrophy(id); TQ.won[TQ.k]=1; if(TQ_SP.every(k=>TQ.won[k])) prgTrophy('tqpoli'); }
  tqSave(); for(const e of TQ.E) if(e.t===(r===2?1-my:my)&&r!==1) e.cheer=6; tqEndCard(); }

/* ---------- each frame ---------- */
function tqStep(dt){ if(!TQ.on) return; const B=TQ.B; if(!TQ.host){ tqGuestStep(dt); return; }
  tqHumanInput(dt); for(const e of TQ.E){ e.kT+=dt; e.tkT+=dt; e.jT+=dt; if(e.dn>0) e.dn-=dt; if(e.dv>0) e.dv-=dt; if(e.cool>0) e.cool-=dt; if(e.cheer>0) e.cheer-=dt; if(B.own===e.i&&(TQ.ph==='play'||TQ.k!=='netball')) e.hold+=dt; }
  if(B.fresh>0) B.fresh-=dt; if(B.toT>0){ B.toT-=dt; if(B.toT<=0) B.to=-1; }
  const ph=TQ.ph;
  if(ph==='ko'){ TQ.pt-=dt; if(TQ.pt<=0){ const tk=TQ.E[TQ.tk]; tqGive(tk,true); TQ.ph='set'; TQ.setK='ko'; TQ.pt=tk.hum?9:0.8; } }
  else if(ph==='dead'){ TQ.pt-=dt; const R=TQ.rs; if(R){ const tk=tqNearest(R.t,R.x,R.z); if(tk&&!tk.hum){ tk.tx=R.x; tk.tz=R.z; } } if(TQ.pt<=0&&R) tqRestart(); }
  else if(ph==='set'){ const tk=TQ.E[TQ.tk]; TQ.pt-=dt; if(!tk||B.own!==tk.i){ TQ.ph='play'; } else if(TQ.pt<=0){ if(tqIsKickoff()) tqKickoffKick(tk); else { const m=tqBestPass(tk); if(m) tqPass(tk,m.m); else tqPass(tk,null); } } }
  else if(ph==='goal'){ TQ.pt-=dt; if(TQ.pt<=0){ if(TQ.after==='conv') tqConvStart(); else tqKickoff(TQ.koT); } }
  else if(ph==='conv'){ const C=TQ.conv; if(C){ C.T-=dt; const e=TQ.E[C.e]; if(e&&!C.kicked){ e.vx=e.vz=0; if(!e.hum&&C.T<=0) tqConvKick(clamp(tqConvIdeal(C.p,C.yaw)+gauss()*0.035*(2-TQ.df*0.5),0.2,1)); else if(C.T<=0) tqConvKick(TQ.ideal||tqConvIdeal(C.p,C.yaw)); } if(C.kicked&&C.T<=0) tqConvEnd(false); } }
  else if(ph==='half'){ TQ.pt-=dt; if(TQ.pt<=0){ TQ.half=2; TQ.clk=TQ.dur*30; tqKickoff(1-TQ.ko0,false); } }
  else if(ph==='end'){ }
  if(['play','set','dead'].includes(ph)){ TQ.clk-=dt; if(TQ.clk<=0&&ph==='play'){ TQ.clk=0; if(TQ.half===1) tqHalf(); else tqFinal(); } }
  if(TQ.ruck){ TQ.ruck.T-=dt; if(TQ.ruck.T<=0) tqRuckEnd(); }
  tqTeamCache(); for(const e of TQ.E){ if(e.hum) { if(e.hum!=='me') tqPeerMove(e,dt); continue; } e.th-=dt; if(e.th<=0){ e.th=0.18+Math.random()*0.16; tqThink(e); } tqBotMove(e,dt); }
  tqSeparate(); for(const e of TQ.E){ e.y=W.terrain(e.x,e.z); } tqBallStep(dt); if(TQ.ph==='play'&&B.own<0&&!B.sh&&!TQ.ruck) tqGrab();
  if(TQ.k==='netball'&&B.own>=0&&TQ.ph==='play'){ const e=TQ.E[B.own]; if(e.hold>3.05){ tqDead('free',1-e.t,e.x,e.z,'3s'); } }
  tqRefMove(dt); tqRender(dt); tqNetSend(dt); }
function tqIsKickoff(){ return TQ.ph==='set'&&TQ.k==='rugby'&&(TQ.setK==='ko'||TQ.setK==='drop'); }
function tqKickoffKick(tk){ const F=TQ.F, s=tqSgn(tk.t); tqShoot(tk,0.5,[s*F.ux+F.vx*(Math.random()-0.5)*0.6,s*F.uz+F.vz*(Math.random()-0.5)*0.6]); }
function tqTeamCache(){ const B=TQ.B; TQ.ch=[null,null]; for(const t of [0,1]){ let best=null,bd=1e9; const px=B.s?B.x+B.s.vx*0.35:B.x, pz=B.s?B.z+B.s.vz*0.35:B.z;
    for(const e of TQ.E){ if(e.t!==t||e.gk||e.dn>0) continue; if(TQ.k==='netball'&&!tqNbZone(e,px,pz)) continue; const d=Math.hypot(e.x-px,e.z-pz); if(d<bd){ bd=d; best=e; } } TQ.ch[t]=best; } }
function tqGrab(){ const B=TQ.B, D=tqD(); if(B.fresh>0&&B.kind!=='loose') return; let best=null,bd=1e9; const gy=W.terrain(B.x,B.z), h=B.y-gy, sp=B.s?Math.hypot(B.s.vx,B.s.vy,B.s.vz):0;
  for(const e of TQ.E){ if(e.dn>0||e.cool>0) continue; if(TQ.k==='netball'&&!tqNbZone(e,B.x,B.z)) continue; const box=e.gk&&tqInBox(e.t,B.x,B.z);
    const reach=D.reach*(box?1.5:1)+(B.to===e.i?0.35:0)+(e.jT<0.5?0.4:0)+(e.dv>0&&e.gk?0.6:0), maxH=D.hands?2.3+(e.jT<0.5?0.6:0):(box?2.3:0.7);
    const d=Math.hypot(B.x-e.x,B.z-e.z); if(d>reach||h>maxH) continue; if(B.sv===e.i) continue;
    if(B.kind==='shot'&&e.gk&&e.t!==B.lt){ const p=clamp(0.95-(sp-13)*0.028-Math.max(0,d-1)*0.3,0.22,0.95)*(TQ.df===0?0.75:TQ.df===2?1.1:1); if(Math.random()>p){ B.sv=e.i; if(Math.random()<0.4&&B.s){ B.s.vx*=-0.35; B.s.vz=B.s.vz*0.5+(Math.random()-0.5)*4; B.s.vy=Math.abs(B.s.vy)*0.5+1; B.kind='save'; B.lt=e.t; tqEv('steal',e.t); } continue; } }
    if(!D.hands&&sp>17&&!e.gk&&B.to!==e.i&&Math.random()<0.5){ B.sv=e.i; continue; }
    const dd=d-(B.to===e.i?0.5:0); if(dd<bd){ bd=dd; best=e; } }
  if(best) tqGive(best); }
// keep players apart, and away from a netball carrier
function tqSeparate(){ const E=TQ.E, B=TQ.B, nc=TQ.k==='netball'&&B.own>=0?TQ.E[B.own]:null;
  for(let i=0;i<E.length;i++) for(let j=i+1;j<E.length;j++){ const a=E[i], b=E[j]; if(a.dn>0||b.dn>0) continue; const dx=b.x-a.x, dz=b.z-a.z, d=Math.hypot(dx,dz), m=0.62; if(d<m&&d>1e-4){ const k=(m-d)/d*0.5; a.x-=dx*k; a.z-=dz*k; b.x+=dx*k; b.z+=dz*k; } }
  if(nc) for(const e of E){ if(e.t===nc.t) continue; const dx=e.x-nc.x, dz=e.z-nc.z, d=Math.hypot(dx,dz); if(d<0.9&&d>1e-4){ e.x=nc.x+dx/d*0.9; e.z=nc.z+dz/d*0.9; } }
  if(TQ.k==='netball') for(const e of E){ const p=tqNbClamp(e,e.x,e.z); e.x=p[0]; e.z=p[1]; } else { const F=TQ.F; for(const e of E){ const q=tqAB(e); const ma=F.hl+F.ig+3, mb=F.hw+3; if(Math.abs(q[0])>ma||Math.abs(q[1])>mb){ const p=tqW(F,clamp(q[0],-ma,ma),clamp(q[1],-mb,mb)); e.x=p[0]; e.z=p[1]; } } } }
function tqMove(e,dt,dx,dz,sp){ const acc=e.hum?22:14; const tvx=dx*sp, tvz=dz*sp; let ax=tvx-e.vx, az=tvz-e.vz; const al=Math.hypot(ax,az), mx=acc*dt; if(al>mx){ ax*=mx/al; az*=mx/al; }
  e.vx+=ax; e.vz+=az; if(e.dn>0||(TQ.k==='netball'&&TQ.B.own===e.i)||(TQ.ph==='set'&&TQ.tk===e.i)||TQ.ph==='ko'||TQ.ph==='end'||(TQ.ph==='conv'&&TQ.conv&&TQ.conv.e===e.i)){ e.vx*=0.6; e.vz*=0.6; }
  e.x+=e.vx*dt; e.z+=e.vz*dt; const v=Math.hypot(e.vx,e.vz); if(v>0.4&&!(TQ.k==='netball'&&TQ.B.own===e.i)) e.yaw=lerpAng(e.yaw,Math.atan2(e.vz,e.vx),Math.min(1,dt*9)); e.sp=v; e.anT+=dt*(1+v*1.1); }
function tqBotMove(e,dt){ if(e.dn>0){ e.vx*=0.8; e.vz*=0.8; return; } const dx=e.tx-e.x, dz=e.tz-e.z, d=Math.hypot(dx,dz); let sp=e.ts||0;
  if(d<0.4){ tqMove(e,dt,0,0,0); if(e.lk!==undefined) e.yaw=lerpAng(e.yaw,e.lk,Math.min(1,dt*6)); return; } if(d<2) sp*=Math.max(0.35,d/2); tqMove(e,dt,dx/d,dz/d,sp);
  if(TQ.B.own===e.i&&TQ.k==='netball'&&e.lk!==undefined) e.yaw=lerpAng(e.yaw,e.lk,Math.min(1,dt*6)); }
function tqSpeed(e,run){ const D=tqD(); const k=TQ.df===0?0.84:TQ.df===2?1.0:0.92; return D.v*(e.hum?1:k)*(run?1:0.62)*(TQ.B.own===e.i?0.9:1)*(e.gk&&TQ.k==='hockey'?0.85:1); }

/* ---------- the bots ---------- */
function tqThink(e){ tqThink0(e); if(TQ.ph==='set'&&TQ.tk>=0&&TQ.E[TQ.tk]&&TQ.E[TQ.tk].t!==e.t){ const tk=TQ.E[TQ.tk], r=(TQ.k==='netball'?0.9:TQ.k==='rugby'?5:4.5)+0.5, dx=e.tx-tk.x, dz=e.tz-tk.z, d=Math.hypot(dx,dz); if(d<r){ const k=r/(d||1); e.tx=tk.x+(d?dx:1)*k; e.tz=tk.z+(d?dz:0)*k; } } }
function tqThink0(e){ const B=TQ.B, F=TQ.F, s=tqSgn(e.t), own=B.own>=0?TQ.E[B.own]:null; e.lk=undefined; const ph=TQ.ph; const bq=tqL(F,B.x,B.z), bf=tqFrac(e.t,bq[0]);
  const hold=p=>{ e.tx=p[0]; e.tz=p[1]; e.ts=tqSpeed(e,false); };
  if(ph==='ko'||ph==='goal'||ph==='half'||ph==='end'){ hold(ph==='end'||ph==='goal'?[e.x,e.z]:tqHomeXZ(e,0.5,true)); if(ph==='goal'&&TQ.after!=='conv'){ hold(tqHomeXZ(e,0.5,true)); } return; }
  if(ph==='conv'){ if(!TQ.conv||TQ.conv.e!==e.i) hold([e.x,e.z]); return; }
  if(ph==='dead'){ const R=TQ.rs; if(R&&tqNearest(R.t,R.x,R.z)===e){ e.tx=R.x; e.tz=R.z; e.ts=tqSpeed(e,true); } else hold(tqHomeXZ(e,bf,false)); return; }
  if(TQ.ruck){ const R=TQ.ruck, rq=tqL(F,R.x,R.z), sd=tqSgn(e.t), fr=tqFrac(e.t,rq[0]); const p=e.t===R.t?tqW(F,rq[0]-sd*(3+Math.abs(e.b)*4),clamp(rq[1]+e.b*F.hw*0.5,-F.hw+2,F.hw-2)):tqW(F,rq[0]-sd*2.5,clamp(rq[1]+e.b*F.hw*0.6,-F.hw+2,F.hw-2)); e.tx=p[0]; e.tz=p[1]; e.ts=tqSpeed(e,true); return; }
  if(ph==='set'&&TQ.tk===e.i){ e.tx=e.x; e.tz=e.z; const m=tqBestPass(e); if(m) e.lk=Math.atan2(m.m.z-e.z,m.m.x-e.x); return; }
  if(TQ.k==='netball'){ tqThinkNB(e,own,bf); return; }
  if(TQ.k==='rugby'){ tqThinkRG(e,own,bf); return; }
  tqThinkFB(e,own,bf); }
function tqThinkFB(e,own,bf){ const B=TQ.B, F=TQ.F, D=tqD(), s=tqSgn(e.t), q=tqAB(e), bq=tqL(F,B.x,B.z);
  if(e.gk){ const gl=-s*F.hl, gw=D.goal[0]; let a=gl+s*1.1, b=clamp(bq[1]*0.35,-gw/2+0.3,gw/2-0.3); const db=Math.hypot(bq[0]-gl,bq[1]);
    if(own===e){ e.tx=e.x; e.tz=e.z; if(e.hold>1.1){ const m=tqBestPass(e); if(m) tqPass(e,m.m); else tqShoot(e,0.7,null); } return; }
    if(B.s&&(B.kind==='shot'||B.kind==='pass'||B.kind==='hit')&&s*B.s.vx*F.ux+s*B.s.vz*F.uz<-3){ const va=B.s.vx*F.ux+B.s.vz*F.uz, vb=B.s.vx*F.vx+B.s.vz*F.vz, t=(gl+s*0.6-bq[0])/(va||-1e-3); if(t>0&&t<2){ b=clamp(bq[1]+vb*t,-gw/2-0.6,gw/2+0.6); a=gl+s*0.6; if(t<0.4){ e.dv=0.35; e.dvs=Math.sign(b-tqAB(e)[1])||1; } } }
    else if(!own&&db<(TQ.k==='football'?D.box[TQ.n][0]+1:D.circ[TQ.n])&&tqInBox(e.t,B.x,B.z)&&TQ.ch[1-e.t]&&Math.hypot(TQ.ch[1-e.t].x-B.x,TQ.ch[1-e.t].z-B.z)>Math.hypot(e.x-B.x,e.z-B.z)-1){ e.tx=B.x; e.tz=B.z; e.ts=tqSpeed(e,true)*1.05; return; }
    else if(db<18) a=gl+s*clamp(db*0.12,1,2.6);
    const p=tqW(F,a,b); e.tx=p[0]; e.tz=p[1]; e.ts=tqSpeed(e,true)*1.15; e.lk=Math.atan2(B.z-e.z,B.x-e.x); return; }
  if(own===e){ // the bot with the ball
    const ga=s*F.hl, dg=Math.hypot(ga-q[0],q[1]), opp=TQ.E.filter(o=>o.t!==e.t&&o.dn<=0).map(o=>[o,Math.hypot(o.x-e.x,o.z-e.z)]).sort((a,b)=>a[1]-b[1])[0], press=opp&&opp[1]<3;
    const canShoot=TQ.k==='hockey'?tqInCircle(e):dg<(TQ.n===5?17:21);
    if(canShoot&&(dg<9||Math.random()<0.35+0.1*TQ.df)){ tqShoot(e,clamp(0.45+dg*0.025+Math.random()*0.2,0.3,0.95),null); return; }
    if((press&&Math.random()<0.55)||e.hold>2.2+Math.random()*2.5){ const m=tqBestPass(e); if(m&&m.sc>0.25){ tqPass(e,m.m); return; } }
    let tb=q[1]*0.75; if(opp&&opp[1]<6){ const oq=tqAB(opp[0]); tb+=(q[1]>oq[1]?1:-1)*3; } tb=clamp(tb,-F.hw+2.5,F.hw-2.5); const p=tqW(F,q[0]+s*8,tb); e.tx=p[0]; e.tz=p[1]; e.ts=tqSpeed(e,true)*(dg<25?1:0.92); return; }
  if(own&&own.t===e.t){ const p=tqHomeXZ(e,bf,false), pq=tqL(F,p[0],p[1]); let a=pq[0], b=pq[1]+Math.sin(tqNow()*0.7+e.ph)*2; if(e.role==='A') a=Math.max(s*a,s*bq[0]+4)*s;
    const pp=tqW(F,clamp(a,-F.hl+1,F.hl-1),clamp(b,-F.hw+1.5,F.hw-1.5)); e.tx=pp[0]; e.tz=pp[1]; e.ts=tqSpeed(e,Math.hypot(pp[0]-e.x,pp[1]-e.z)>4); return; }
  if(own){ // defending
    const ch=TQ.ch[e.t]; if(ch===e){ const px=own.x+Math.cos(own.yaw)*0.6, pz=own.z+Math.sin(own.yaw)*0.6; e.tx=px; e.tz=pz; e.ts=tqSpeed(e,true); if(Math.hypot(own.x-e.x,own.z-e.z)<1.25&&Math.random()<0.25+0.15*TQ.df) tqTackle(e); return; }
    let mark=null, md=1e9; for(const o of TQ.E){ if(o.t===e.t||o===own||o.gk) continue; const dd=Math.hypot(o.x-e.x,o.z-e.z); if(dd<md&&!TQ.E.some(m=>m!==e&&m.t===e.t&&m.mk===o.i&&Math.hypot(m.x-o.x,m.z-o.z)<dd)){ md=dd; mark=o; } }
    e.mk=mark?mark.i:-1; if(mark&&md<18){ const gx=tqW(F,-s*F.hl,0), dx=gx[0]-mark.x, dz=gx[1]-mark.z, dl=Math.hypot(dx,dz)||1; e.tx=mark.x+dx/dl*1.6; e.tz=mark.z+dz/dl*1.6; e.ts=tqSpeed(e,true)*0.95; return; }
    const p=tqHomeXZ(e,bf,false); e.tx=p[0]; e.tz=p[1]; e.ts=tqSpeed(e,true)*0.8; return; }
  // loose ball: the nearest goes for it
  if(TQ.ch[e.t]===e){ const px=B.s?B.x+B.s.vx*0.4:B.x, pz=B.s?B.z+B.s.vz*0.4:B.z; e.tx=px; e.tz=pz; e.ts=tqSpeed(e,true); return; }
  if(B.to===e.i&&B.tp){ e.tx=B.tp[0]; e.tz=B.tp[1]; e.ts=tqSpeed(e,true); return; }
  const p=tqHomeXZ(e,bf,false); e.tx=p[0]; e.tz=p[1]; e.ts=tqSpeed(e,false); }
function tqThinkRG(e,own,bf){ const B=TQ.B, F=TQ.F, s=tqSgn(e.t), q=tqAB(e), bq=tqL(F,B.x,B.z);
  if(own===e){ const defs=TQ.E.filter(o=>o.t!==e.t&&o.dn<=0).map(o=>{ const oq=tqAB(o); return [o,Math.hypot(o.x-e.x,o.z-e.z),s*(oq[0]-q[0]),oq]; }), ahead=defs.filter(d=>d[2]>-0.5).sort((a,b)=>a[1]-b[1])[0];
    if(e.mp&&e.hold>0.45+Math.random()*0.4){ e.mp=0; const m=tqBestPass(e); if(m){ tqPass(e,m.m); return; } }
    if(ahead&&ahead[1]<2.6&&Math.random()<0.45+0.1*TQ.df){ const m=tqBestPass(e); if(m&&m.sc>-0.2){ tqPass(e,m.m); return; } }
    if(-s*q[0]>F.hl*0.55&&ahead&&ahead[1]<4&&Math.random()<0.15){ tqShoot(e,0.75,null); return; }
    let tb=q[1]*0.9; if(ahead&&ahead[1]<9) tb+=(q[1]>ahead[3][1]?1:-1)*4; tb=clamp(tb,-F.hw+2,F.hw-2); const p=tqW(F,s*(F.hl+2),tb); e.tx=p[0]; e.tz=p[1]; e.ts=tqSpeed(e,true); return; }
  if(own&&own.t===e.t){ const oq=tqAB(own), mates=TQ.E.filter(m=>m.t===e.t&&m!==own).sort((a,b)=>a.b-b.b), k=mates.indexOf(e), side=e.b>=own.b?1:-1, rank=Math.abs(k-mates.findIndex(m=>m.b>=own.b))+1;
    const p=tqW(F,oq[0]-s*(2.5+rank*1.6),clamp(oq[1]+side*(3+rank*3.5),-F.hw+1.5,F.hw-1.5)); e.tx=p[0]; e.tz=p[1]; e.ts=tqSpeed(e,true); return; }
  if(own){ const oq=tqAB(own), atk=TQ.E.filter(o=>o.t!==e.t).sort((a,b)=>tqAB(a)[1]-tqAB(b)[1]), mine=TQ.E.filter(m=>m.t===e.t).sort((a,b)=>a.b-b.b), k=mine.indexOf(e), tgt=atk[Math.min(k,atk.length-1)]||own;
    if(TQ.ch[e.t]===e||Math.hypot(own.x-e.x,own.z-e.z)<4){ e.tx=own.x+Math.cos(own.yaw)*0.5; e.tz=own.z+Math.sin(own.yaw)*0.5; e.ts=tqSpeed(e,true); if(Math.hypot(own.x-e.x,own.z-e.z)<1.15&&Math.random()<0.3+0.12*TQ.df) tqTackle(e); return; }
    const tq=tqAB(tgt), p=tqW(F,oq[0]-s*(e.role==='Z'?14:2.5),clamp(e.role==='Z'?oq[1]*0.5:tq[1],-F.hw+1,F.hw-1)); e.tx=p[0]; e.tz=p[1]; e.ts=tqSpeed(e,true)*0.95; return; }
  if(TQ.ch[e.t]===e){ e.tx=B.x+(B.s?B.s.vx*0.4:0); e.tz=B.z+(B.s?B.s.vz*0.4:0); e.ts=tqSpeed(e,true); return; }
  if(B.to===e.i&&B.tp){ e.tx=B.tp[0]; e.tz=B.tp[1]; e.ts=tqSpeed(e,true); return; }
  const p=tqHomeXZ(e,bf,false); e.tx=p[0]; e.tz=p[1]; e.ts=tqSpeed(e,false); }
function tqThinkNB(e,own,bf){ const B=TQ.B, F=TQ.F, s=tqSgn(e.t);
  if(own===e){ e.tx=e.x; e.tz=e.z; const m=tqBestPass(e); if(m) e.lk=Math.atan2(m.m.z-e.z,m.m.x-e.x);
    if(e.hold>e.wait){ if(tqShooter(e)&&tqInCircle(e)&&(Math.hypot(...(()=>{ const R=tqRingPos(e.t); return [R[0]-e.x,R[2]-e.z]; })())<3.6||!m||m.sc<0.8)){ tqNbShoot(e,0); return; } if(m){ tqPass(e,m.m); return; } if(e.hold>2.4) tqPass(e,null); } return; }
  if(own&&own.t===e.t){ const R=TQ_FORM['nb'+TQ.n].find(r=>r[0]===e.role), oq=tqAB(own); let f=R[1]+0.08+(tqFrac(e.t,oq[0])-0.5)*0.25, b=R[2]+Math.sin(tqNow()*1.4+e.ph)*0.35;
    if(tqShooter(e)) f=Math.max(f,0.86); const p=tqNbClamp(e,...tqW(F,tqAOf(e.t,clamp(f,0.03,0.97)),b*F.hw*0.85)); e.tx=p[0]; e.tz=p[1]; e.ts=tqSpeed(e,true)*0.9; return; }
  if(own){ const tg=TQ.E.find(o=>o.t!==e.t&&o.role===TQ_NBM[e.role]); if(tg){ const R=tqRingPos(e.t===0?1:0), gq=tqW(F,-s*F.hl,0); let dx=gq[0]-tg.x, dz=gq[1]-tg.z, dl=Math.hypot(dx,dz)||1, k=tg===own?1.0:0.8;
      let px=tg.x+dx/dl*k, pz=tg.z+dz/dl*k; if(tg!==own){ const bx=own.x-tg.x, bz=own.z-tg.z, bl=Math.hypot(bx,bz)||1; px+=bx/bl*0.6; pz+=bz/bl*0.6; } const p=tqNbClamp(e,px,pz); e.tx=p[0]; e.tz=p[1]; e.ts=tqSpeed(e,true); e.lk=Math.atan2(own.z-e.z,own.x-e.x);
      if(B.to>=0&&Math.hypot(e.x-B.x,e.z-B.z)<2.2&&Math.random()<0.3) e.jT=0; return; } }
  if(TQ.ch[e.t]===e){ e.tx=B.x; e.tz=B.z; e.ts=tqSpeed(e,true); return; }
  if(B.to===e.i&&B.tp){ e.tx=B.tp[0]; e.tz=B.tp[1]; e.ts=tqSpeed(e,true); return; }
  const p=tqHomeXZ(e,bf,false); e.tx=p[0]; e.tz=p[1]; e.ts=tqSpeed(e,false); }

/* ---------- you: the joystick, Pase, Tiro and Esprint ---------- */
function tqCamBasis(){ const dx=camT.look.x-camT.pos.x, dz=camT.look.z-camT.pos.z, l=Math.hypot(dx,dz)||1; return [dx/l,dz/l]; }
function tqStick(){ const mx=inp.mx||0, my=inp.my||0, m=Math.min(1,Math.hypot(mx,my)); if(m<0.12) return null; const [fx,fz]=tqCamBasis(), rx=-fz, rz=fx; const dx=fx*my+rx*mx, dz=fz*my+rz*mx, l=Math.hypot(dx,dz)||1; return [dx/l,dz/l,m]; }
function tqSprinting(){ return TQ.spr||!!(inp.keys.ShiftLeft||inp.keys.ShiftRight); }
function tqHumanInput(dt){ const e=tqMe(); if(!e) return; const st=tqStick(), B=TQ.B; e.st=clamp(e.st+(tqSprinting()&&st?-0.22:0.14)*dt,0,1);
  if(TQ.chg){ TQ.cT+=dt; const up=0.95; TQ.pow=TQ.cT<up?TQ.cT/up:Math.max(0,1-(TQ.cT-up)/up); if(TQ.pow<=0&&TQ.cT>up){ TQ.chg=false; TQ.pow=0; }
    if(TQ.ideal!==null&&(ezOn()||TQ.df===0)&&TQ.pow>=TQ.ideal&&TQ.cT<up) tqShotUp(); }
  if(TQ.ph==='conv'&&TQ.conv&&TQ.conv.e===e.i&&!TQ.conv.kicked){ if(st){ const C=TQ.conv, F=TQ.F, lat=st[0]*F.vx+st[1]*F.vz; C.yaw=clamp(C.yaw+lat*dt*0.35*tqSgn(e.t)*(1),C.yaw0-0.45,C.yaw0+0.45); e.yaw=C.yaw; } e.vx=e.vz=0; return; }
  if(e.dn>0){ e.vx*=0.85; e.vz*=0.85; e.x+=e.vx*dt; e.z+=e.vz*dt; return; }
  const sp=tqSpeed(e,true)*(tqSprinting()&&e.st>0.05?1.25:1);
  if(st){ if(TQ.k==='netball'&&B.own===e.i){ e.yaw=lerpAng(e.yaw,Math.atan2(st[1],st[0]),Math.min(1,dt*8)); tqMove(e,dt,0,0,0); } else tqMove(e,dt,st[0],st[1],sp*st[2]); } else tqMove(e,dt,0,0,0);
}
function tqPassBtn(){ if(S.mode!=='team'||!TQ.on) return; ensureAudio(); const e=tqMe(); if(!e) return; const st=tqStick();
  if(!TQ.host){ tqGuestAct({a:'pass',d:st?[st[0],st[1]]:null}); return; } tqDoPass(e,st?[st[0],st[1]]:null,'me'); }
function tqDoPass(e,dir,h){ const B=TQ.B; if(TQ.ph==='conv') return;
  if(B.own===e.i){ if(tqIsKickoff()&&TQ.tk===e.i){ tqKickoffKick(e); return; } const m=tqPassTo(e,dir); if(!m&&TQ.k==='rugby'){ if(h==='me') toast('Pase','En rugby solo se pasa hacia atrás o en línea: no hay nadie detrás'); return; } tqPass(e,m,dir); return; }
  if(TQ.ph==='play'||TQ.ph==='dead') tqSwitch(h); }
function tqShotDown(){ if(S.mode!=='team'||!TQ.on) return; ensureAudio(); const e=tqMe(); if(!e) return; const B=TQ.B;
  const mine=B.own===e.i||(TQ.ph==='conv'&&TQ.conv&&TQ.conv.e===e.i&&!TQ.conv.kicked);
  if(mine){ if(TQ.k==='netball'&&!(tqShooter(e)&&tqInCircle(e))){ toast('Tiro','Solo tiran la GS y la GA, desde dentro del círculo'); return; } TQ.chg=true; TQ.cT=0; TQ.pow=0; TQ.ideal=TQ.k==='netball'?tqNbIdeal(e):TQ.ph==='conv'?(TQ.ideal||tqConvIdeal([TQ.B.x,TQ.B.z],TQ.conv.yaw)):null; return; }
  if(!TQ.host){ tqGuestAct({a:'tk'}); e.tkT=0; if(TQ.k==='netball') e.jT=0; else e.dv=0.3; return; } tqTackle(e); }
function tqShotUp(){ if(!TQ.chg) return; TQ.chg=false; const e=tqMe(); if(!e) return; const p=TQ.pow, st=tqStick(); if(p<0.05) return;
  if(!TQ.host){ tqGuestAct({a:'shot',p,d:st?[st[0],st[1]]:null,y:TQ.conv&&Number.isFinite(TQ.conv.yaw)?TQ.conv.yaw:null}); return; } tqDoShot(e,p,st?[st[0],st[1]]:null); }
function tqDoShot(e,p,dir,yaw){ if(TQ.ph==='conv'&&TQ.conv&&TQ.conv.e===e.i){ if(Number.isFinite(yaw)) TQ.conv.yaw=yaw; tqConvKick(p); return; } if(TQ.B.own===e.i) tqShoot(e,p,dir); }
function tqSprintSet(v){ TQ.spr=!!v; const b=$('tqSpr'); if(b) b.classList.toggle('on',TQ.spr); }
function tqKey(e,down){ const c=e.code; if(c==='Space'||c==='KeyJ'){ e.preventDefault(); if(down&&!e.repeat) tqPassBtn(); return true; } if(c==='KeyK'||c==='KeyL'){ if(down&&!e.repeat) tqShotDown(); if(!down) tqShotUp(); return true; }
  if(c==='KeyQ'||c==='KeyE'){ if(down&&!e.repeat){ if(!TQ.host) tqGuestAct({a:'sw'}); else tqSwitch('me'); } return true; } if(c==='KeyV'){ if(down&&!e.repeat) tqViewT(); return true; } if(c==='Escape'){ if(down) tqExit(); return true; } return false; }
function tqGamepad(g){ if(g.down(GPB.A)) tqPassBtn(); if(g.down(GPB.X)) tqShotDown(); if(g.up(GPB.X)) tqShotUp(); if(g.down(GPB.LB)){ if(!TQ.host) tqGuestAct({a:'sw'}); else tqSwitch('me'); } if(g.down(GPB.Y)) tqViewT(); if(g.down(GPB.B)) tqExit();
  TQ.gpSpr=g.held(GPB.RT)||g.held(GPB.RB); if(TQ.gpSpr!==TQ.spr&&(TQ.gpSpr||TQ.gpWas)) tqSprintSet(TQ.gpSpr); TQ.gpWas=TQ.gpSpr; }
function tqViewT(){ TQ.view=(TQ.view+1)%2; const b=$('tqView'); if(b) b.textContent=TQ.view?'Vista: lateral':'Vista: detrás'; S.snap=true; }

/* ---------- the camera, the referee and drawing ---------- */
function tqCam(){ const e=tqMe(), F=TQ.F; if(!F) return 6; const B=TQ.B, t=e?e.t:TQ.my, s=tqSgn(t), nb=TQ.k==='netball';
  let fx=e?e.x*0.62+B.x*0.38:B.x, fz=e?e.z*0.62+B.z*0.38:B.z; if(TQ.ph==='conv'&&TQ.conv){ fx=B.x; fz=B.z; }
  const gy=W.terrain(fx,fz);
  if(TQ.view===1){ const q=tqL(F,fx,fz), side=-(F.hw+(nb?9:16)), p=tqW(F,q[0]*0.85,side); camT.pos.set(p[0],gy+(nb?9:TQ.k==='rugby'?19:15),p[1]); camT.look.set(fx,gy+0.5,fz); return 3.5; }
  const ux=s*F.ux, uz=s*F.uz, d=nb?8.5:TQ.ph==='conv'?7:11.5, h=nb?6.5:TQ.ph==='conv'?3.2:8, la=nb?3:TQ.ph==='conv'?7:4.5; camT.pos.set(fx-ux*d,gy+h,fz-uz*d); camT.look.set(fx+ux*la,gy+(TQ.ph==='conv'?2.5:0.4),fz+uz*la); return 4; }
function tqRefMove(dt){ const r=TQ.ref, B=TQ.B, F=TQ.F; if(!r) return; const q=tqL(F,B.x,B.z), side=q[1]>0?-1:1, p=tqW(F,q[0]*0.85,clamp(q[1]+side*(TQ.k==='netball'?0:9),-F.hw-1,F.hw+1));
  if(TQ.k==='netball'){ const pp=tqW(F,q[0]*0.8,-(F.hw+1.2)); p[0]=pp[0]; p[1]=pp[1]; } const dx=p[0]-r.x, dz=p[1]-r.z, d=Math.hypot(dx,dz); tqMove(r,dt,d>0.5?dx/d:0,d>0.5?dz/d:0,Math.min(6,d*1.2)); r.yaw=lerpAng(r.yaw,Math.atan2(B.z-r.z,B.x-r.x),Math.min(1,dt*4)); r.y=W.terrain(r.x,r.z); }
function tqCode(e){ const B=TQ.B; let c=0; if(e.dn>0) c=5; else if(e.dv>0) c=e.gk?6:4; else if(e.cheer>0) c=7; else if(e.kT<0.45) c=e.kk==='throw'?3:2; else if(TQ.k==='netball'&&TQ.chg&&e.i===TQ.me&&B.own===e.i) c=9; else if(e.jT<0.5) c=10; else if(B.own===e.i&&TQ.k!=='football') c=8; else if(e.sp>0.4) c=1;
  return c*16+Math.min(15,Math.round(Math.min(1,e.sp/8)*15)); }
function tqPose(e){ const R=e.R, code=e.code>>4, k=(e.code&15)/15, D=tqD(), B=TQ.B; let st='idle';
  if(code===1||code===2||code===4) st=e.sp>0.4?'run':'idle'; if(code===7) st='cheer'; poseRig(R,st,st==='run'?e.anT:T,Math.max(0.2,k));
  if(code===2){ const q=Math.min(1,e.kT/0.14); if(e.kk==='hit'){ R.aR.sg.rotation.z=1.4-2.2*q; R.aL.sg.rotation.z=1.2-2*q; } else { R.lR.hg.rotation.z=-0.6+1.7*q; R.lR.kn.rotation.z=-1.4+1.3*q; R.torso.rotation.z=-0.15*q; } }
  else if(code===3||code===9){ const q=code===9?0:Math.min(1,e.kT/0.18); R.aL.sg.rotation.set(0,0,code===9?2.8:-0.5+2.6*q); R.aR.sg.rotation.set(0,0,code===9?2.8:-0.5+2.6*q); R.aL.el.rotation.z=R.aR.el.rotation.z=0.3; }
  else if(code===4){ R.body.rotation.z=-0.9; R.body.position.y=0.62; R.aL.sg.rotation.z=R.aR.sg.rotation.z=1.6; }
  else if(code===5){ R.body.rotation.z=-1.45; R.body.position.y=0.22; R.aL.sg.rotation.z=R.aR.sg.rotation.z=2.4; }
  else if(code===6){ R.body.rotation.x=(e.dvs||1)*1.1; R.body.position.y=0.55; R.aL.sg.rotation.x=-1.2; R.aR.sg.rotation.x=1.2; }
  else if(code===8){ if(TQ.k==='hockey'){ } else { R.aL.sg.rotation.set(0,0,0.9); R.aR.sg.rotation.set(0,0,0.9); R.aL.el.rotation.z=R.aR.el.rotation.z=0.55; } }
  else if(code===10){ R.aL.sg.rotation.set(0,0,2.9); R.aR.sg.rotation.set(0,0,2.9); R.body.position.y=0.95+0.35*Math.sin(Math.min(1,e.jT/0.5)*Math.PI); }
  else if(TQ.k==='netball'&&e.t!==(B.own>=0?TQ.E[B.own].t:-1)&&B.own>=0&&Math.hypot(TQ.E[B.own].x-e.x,TQ.E[B.own].z-e.z)<1.5){ R.aL.sg.rotation.set(-0.5,0,2.6); R.aR.sg.rotation.set(0.5,0,2.6); }
  if(e.stick&&code!==5){ R.aR.sg.rotation.set(0,0,code===2?R.aR.sg.rotation.z:0.4); R.aR.el.rotation.z=0.25; R.aL.sg.rotation.set(0.25,0,code===2?R.aL.sg.rotation.z:0.55); R.aL.el.rotation.z=0.5; R.torso.rotation.z=Math.min(R.torso.rotation.z,-0.12);
    e.stick.rotation.z=code===2?(e.kT<0.1?0.9:-0.6):0; e.stick.visible=true; } else if(e.stick) e.stick.visible=false; }
function tqRender(dt){ const B=TQ.B, all=TQ.ref?TQ.E.concat([TQ.ref]):TQ.E, cp=camera.position;
  for(const e of all){ if(TQ.host||e===tqMe()) e.code=tqCode(e); const R=e.R, far=Math.hypot(e.x-cp.x,e.z-cp.z)>140; R.root.visible=true; R.root.position.set(e.x,e.y,e.z); R.root.rotation.set(0,-e.yaw,0); if(!far) tqPose(e);
    e.sh.position.set(e.x,e.y+0.04,e.z); }
  if(TQ.bm){ TQ.bm.position.set(B.x,B.y,B.z); const v=B.s?Math.hypot(B.s.vx,B.s.vz):Math.hypot(...(B.own>=0?[TQ.E[B.own].vx,TQ.E[B.own].vz]:[0,0])); TQ.bm.rotation.z-=v*dt/(tqD().ball.r||0.1)*0.5;
    if(TQ.k==='rugby'){ const own=B.own>=0?TQ.E[B.own]:null; TQ.bm.rotation.y=own?-own.yaw:B.s?-Math.atan2(B.s.vz,B.s.vx):TQ.bm.rotation.y; } TQ.bm.visible=TQ.ph!=='end'||true; }
  const me=tqMe(); if(TQ.ring){ TQ.ring.visible=!!me; if(me){ TQ.ring.position.set(me.x,me.y+0.06,me.z); TQ.ring.material.color.set(TQ.B.own===me.i?0xf2c230:0xffffff); } }
  if(TQ.mark){ const pt=B.to>=0&&TQ.E[B.to]&&TQ.E[B.to].t===TQ.my?TQ.E[B.to]:null; TQ.mark.visible=!!pt; if(pt) TQ.mark.position.set(pt.x,pt.y+2.3*pt.sc+Math.sin(T*6)*0.08,pt.z); }
  if(me){ P.x=me.x; P.y=me.y; P.z=me.z; P.vx=me.vx; P.vz=me.vz; P.vy=0; P.yaw=me.yaw; P.onGround=true; P.swim=false; } }
function tqTick(dt){ tqLobbyTick(); if(!TQ.on) return; if(S.mode!=='team'){ if(S.mode!=='photo') tqEnd(); return; } if(rig&&rig.root.visible) rig.root.visible=false; TQ.uiT-=dt; if(TQ.uiT<=0){ TQ.uiT=0.1; tqUI(); } tqRingUI(); }

/* ---------- the room: invitation, host state, friends' players ---------- */
function tqInvite(){ if(!MP.code||!MP.peers.size){ toast('Con la sala','Entra antes en una sala con amigos (menú → Amigos)'); return; } if(!tqCanStart()){ toast('Deportes de equipo','Termina antes lo que estás haciendo'); return; }
  const go=Date.now()+12000; TQ.lobby={g:Date.now()%1e9,host:MP.id,go,ids:[MP.id],o:{k:TQ.k,n:TQ.n,dur:TQ.dur,rv:TQ.rv,df:TQ.df,md:TQ.md}}; tqSave();
  mpSend(Object.assign({t:'tqo',g:TQ.lobby.g,go},TQ.lobby.o)); tqHideSheets(); const D=tqD(); toast(`${D.ic} ${D.n} con la sala`,'Invitación enviada: empieza en 12 s con los que se apunten'); }
function tqLobbyTick(){ const L=TQ.lobby; if(!L) return; if(L.host!==MP.id) return; if(Date.now()<L.go) return; TQ.lobby=null; const ids=L.ids.filter(id=>id===MP.id||MP.peers.has(id)), o=L.o;
  if(!tqCanStart()){ toast('Deportes de equipo','No has podido empezar: termina antes lo que estás haciendo'); return; } TQ.k=o.k; TQ.n=o.n; TQ.dur=o.dur; TQ.rv=o.rv; TQ.df=o.df;
  const seed=(Math.random()*1e9)|0; tqLeaveOthers(); if(!tqBuild({k:o.k,n:o.n,dur:o.dur,rv:o.rv,df:o.df,seed,s0:1})) return; TQ.host=true; TQ.net=ids.length>1; TQ.g=L.g; TQ.hm={};
  const hm=[]; ids.forEach((id,k)=>{ const t=o.md==='c'?k%2:0, e=tqPickFor(t)||tqPickFor(1-t); if(!e) return; e.hum=id===MP.id?'me':id; if(id===MP.id){ TQ.me=e.i; TQ.my=t; } hm.push([id,e.i]); });
  mpSend({t:'tqb',g:L.g,seed,k:o.k,n:o.n,dur:o.dur,rv:o.rv,df:o.df,md:o.md,hm}); tqBegin(); }
function tqNetIn(p,o){ if(!WP.team) return; const off=Number.isFinite(o.ts)&&Math.abs(Date.now()-o.ts)<3600000?Date.now()-o.ts:0;
  if(o.t==='tqo'&&TQ_SP.includes(o.k)&&Number.isFinite(o.go)&&Number.isFinite(o.g)){ if(TQ.on) return; const D=TQ_DEF[o.k];
    const nn=o.n===7?7:5, dd=o.dur|0, who=esc(p.n), sp=D.n.toLowerCase(); mpPrompt(o.md==='c'?`<b>${who}</b> te invita a un partido de <b>${sp}</b> (${nn} por equipo, ${dd} min, unos contra otros). ¿Juegas?`:`<b>${who}</b> te invita a un partido de <b>${sp}</b> (${nn} por equipo, ${dd} min, todos juntos contra la máquina). ¿Juegas?`,'Jugar',()=>{ if(!tqCanStart()){ toast(D.n,'Termina antes lo que estás haciendo'); return; } TQ.lobby={g:o.g,host:p.id,go:o.go+off}; mpSend({t:'tqj',g:o.g}); toast('Te has apuntado',`Empieza en ${Math.max(1,Math.round((o.go+off-Date.now())/1000))} s`); },Math.max(2000,o.go+off-Date.now())); return; }
  if(o.t==='tqj'&&TQ.lobby&&TQ.lobby.host===MP.id&&o.g===TQ.lobby.g){ if(!TQ.lobby.ids.includes(p.id)){ TQ.lobby.ids.push(p.id); const who=p.n||'Un amigo'; toast(`${who} se apunta`,`Empieza en ${Math.max(1,Math.round((TQ.lobby.go-Date.now())/1000))} s`); } return; }
  if(o.t==='tqb'&&TQ.lobby&&TQ.lobby.g===o.g&&TQ.lobby.host===p.id&&Array.isArray(o.hm)&&TQ_SP.includes(o.k)){ const mine=o.hm.find(h=>h[0]===MP.id); if(!mine) return; TQ.lobby=null;
    if(!tqCanStart()) return; tqLeaveOthers(); if(!tqBuild({k:o.k,n:o.n===7?7:5,dur:[2,4,6].includes(o.dur)?o.dur:4,rv:clamp(o.rv|0,0,2),df:clamp(o.df|0,0,2),seed:o.seed|0,s0:1})) return;
    TQ.host=false; TQ.net=true; TQ.g=o.g; TQ.hp=p.id; TQ.snapT=tqNow(); for(const h of o.hm){ const e=TQ.E[h[1]|0]; if(!e) continue; e.hum=h[0]===MP.id?'me':h[0]; if(h[0]===MP.id){ TQ.me=e.i; TQ.my=e.t; } } tqBegin(); return; }
  if(!TQ.on||o.g!==TQ.g) return;
  if(o.t==='tqs'&&!TQ.host&&p.id===TQ.hp) tqSnapIn(o);
  else if(o.t==='tqi'&&TQ.host){ const e=TQ.E[o.n|0]; if(e&&e.hum===p.id&&Number.isFinite(o.x)&&Number.isFinite(o.z)){ e.nx=o.x; e.nz=o.z; e.nyaw=Number.isFinite(o.y)?o.y:e.yaw; e.nvx=+o.vx||0; e.nvz=+o.vz||0; e.nT=tqNow(); } }
  else if(o.t==='tqa'&&TQ.host){ const e=TQ.E.find(q=>q.hum===p.id); if(!e) return; const d=Array.isArray(o.d)&&o.d.length===2&&o.d.every(Number.isFinite)?o.d:null;
    if(o.a==='pass') tqDoPass(e,d,p.id); else if(o.a==='shot'&&Number.isFinite(o.p)) tqDoShot(e,clamp(o.p,0,1),d,Number.isFinite(o.y)?o.y:undefined); else if(o.a==='tk') tqTackle(e); else if(o.a==='sw') tqSwitch(p.id); }
  else if(o.t==='tqx'){ if(TQ.host){ for(const e of TQ.E) if(e.hum===p.id) e.hum=null; toast(p.n||'Tu amigo','Ha dejado el partido: juega la máquina por él'); } else if(p.id===TQ.hp){ if(TQ.ph==='end'){ TQ.net=false; TQ.hostGone=true; return; } tqEnd(true); toast('Partido terminado','El anfitrión ha dejado el partido'); } } }
// the host's state, ten times a second
function tqNetSend(dt){ if(!TQ.net||!TQ.host) return; TQ.sT-=dt; if(TQ.sT>0) return; TQ.sT=0.1; const B=TQ.B, r=v=>Math.round(v*100)/100, e=[];
  for(const q of TQ.E){ e.push(r(q.x),r(q.z),Math.round(q.yaw*100)/100,q.code); } const hm=[]; for(const q of TQ.E) if(q.hum) hm.push([q.hum==='me'?MP.id:q.hum,q.i]);
  mpSend({t:'tqs',g:TQ.g,ph:TQ.ph,c:Math.round(TQ.clk*10)/10,h:TQ.half,s:TQ.sc,b:[r(B.x),r(B.y),r(B.z),B.own,B.to],e,hm,ev:TQ.ev.slice(-3),cv:TQ.conv?[TQ.conv.e,r(TQ.conv.yaw||0),TQ.conv.kicked?1:0]:null,rf:TQ.ref?[r(TQ.ref.x),r(TQ.ref.z),r(TQ.ref.yaw)]:null,ru:TQ.ruck?1:0,tk:TQ.tk}); }
function tqSnapIn(o){ if(!Array.isArray(o.e)||o.e.length!==TQ.E.length*4||!Array.isArray(o.b)||o.b.length!==5) return; TQ.snap=o; TQ.snapT=tqNow();
  if(typeof o.ph==='string') TQ.ph=o.ph; if(Number.isFinite(o.c)) TQ.clk=o.c; if(o.h===1||o.h===2) TQ.half=o.h; if(Array.isArray(o.s)&&o.s.length===2) TQ.sc=[o.s[0]|0,o.s[1]|0]; TQ.tk=o.tk|0;
  const B=TQ.B; B.nx=+o.b[0]; B.ny=+o.b[1]; B.nz=+o.b[2]; B.own=o.b[3]|0; B.to=o.b[4]|0;
  if(Array.isArray(o.hm)){ const mine=o.hm.find(h=>h[0]===MP.id); for(const q of TQ.E) q.hum=null; for(const h of o.hm){ const q=TQ.E[h[1]|0]; if(q) q.hum=h[0]===MP.id?'me':h[0]; } if(mine&&(mine[1]|0)!==TQ.me){ TQ.me=mine[1]|0; const q=TQ.E[TQ.me]; if(q){ q.x=+o.e[TQ.me*4]; q.z=+o.e[TQ.me*4+1]; } } }
  for(let i=0;i<TQ.E.length;i++){ const q=TQ.E[i]; q.nx=+o.e[i*4]; q.nz=+o.e[i*4+1]; q.nyaw=+o.e[i*4+2]; q.ncode=o.e[i*4+3]|0; if(i===TQ.me){ const d=Math.hypot(q.nx-q.x,q.nz-q.z); if(d>4||TQ.ph==='ko'||TQ.ph==='conv'||(TQ.ph==='set'&&TQ.tk===i)){ q.x=q.nx; q.z=q.nz; if(TQ.ph!=='play') q.yaw=q.nyaw; } } }
  TQ.conv=Array.isArray(o.cv)?{e:o.cv[0]|0,yaw:TQ.conv&&TQ.conv.e===(o.cv[0]|0)&&TQ.me===(o.cv[0]|0)?TQ.conv.yaw:+o.cv[1],yaw0:+o.cv[1],kicked:!!o.cv[2]}:null; if(Array.isArray(o.rf)&&TQ.ref){ TQ.ref.nx=+o.rf[0]; TQ.ref.nz=+o.rf[1]; TQ.ref.nyaw=+o.rf[2]; }
  if(Array.isArray(o.ev)) for(const v of o.ev) if(Array.isArray(v)&&v.length===4&&v[0]>TQ.evSeen){ tqEvShow(v); if(v[1]==='end'&&!TQ.res){ tqResult(); } } }
function tqGuestStep(dt){ const B=TQ.B, me=tqMe(), k=Math.min(1,dt*10); if(tqNow()-TQ.snapT>5&&TQ.ph!=='end'&&!TQ.hostGone){ tqEnd(true); toast('Partido terminado','Se ha perdido la conexión con el anfitrión'); return; }
  if(me){ me.kT+=dt; me.tkT+=dt; me.jT+=dt; if(me.dv>0) me.dv-=dt; tqHumanInput(dt); me.y=W.terrain(me.x,me.z); me.code=tqCode(me); }
  for(const q of TQ.E){ if(q===me||!Number.isFinite(q.nx)) continue; const ox=q.x, oz=q.z; q.x+=(q.nx-q.x)*k; q.z+=(q.nz-q.z)*k; q.yaw=lerpAng(q.yaw,q.nyaw,k); q.code=q.ncode|0; q.sp=Math.hypot(q.x-ox,q.z-oz)/Math.max(dt,1e-3); q.anT+=dt*(1+q.sp*1.1); q.y=W.terrain(q.x,q.z); if((q.code>>4)===2&&q.kT>0.5) q.kT=0; else q.kT+=dt; }
  if(TQ.ref&&Number.isFinite(TQ.ref.nx)){ const r=TQ.ref; r.x+=(r.nx-r.x)*k; r.z+=(r.nz-r.z)*k; r.yaw=lerpAng(r.yaw,r.nyaw,k); r.sp=1; r.y=W.terrain(r.x,r.z); r.code=16; }
  if(me&&B.own===me.i&&TQ.ph!=='conv'){ const c=tqCarry(me); B.x=c[0]; B.y=c[1]; B.z=c[2]; } else if(Number.isFinite(B.nx)){ const kk=Math.hypot(B.nx-B.x,B.nz-B.z)>6?1:Math.min(1,dt*14); B.x+=(B.nx-B.x)*kk; B.y+=(B.ny-B.y)*kk; B.z+=(B.nz-B.z)*kk; }
  tqRender(dt); TQ.iT-=dt; if(TQ.iT<=0&&me){ TQ.iT=0.1; mpSend({t:'tqi',g:TQ.g,n:me.i,x:Math.round(me.x*100)/100,z:Math.round(me.z*100)/100,y:Math.round(me.yaw*100)/100,vx:Math.round(me.vx*10)/10,vz:Math.round(me.vz*10)/10}); } }
function tqGuestAct(o){ o.t='tqa'; o.g=TQ.g; mpSend(o); }
function tqPeerMove(e,dt){ if(!Number.isFinite(e.nx)){ tqMove(e,dt,0,0,0); return; } const age=tqNow()-(e.nT||0); const px=e.nx+(e.nvx||0)*Math.min(0.2,age), pz=e.nz+(e.nvz||0)*Math.min(0.2,age), k=Math.min(1,dt*12);
  const ox=e.x, oz=e.z; e.x+=(px-e.x)*k; e.z+=(pz-e.z)*k; e.vx=(e.x-ox)/Math.max(dt,1e-3); e.vz=(e.z-oz)/Math.max(dt,1e-3); e.sp=Math.hypot(e.vx,e.vz); e.yaw=lerpAng(e.yaw,e.nyaw,k); e.anT+=dt*(1+e.sp*1.1);
  if(TQ.k==='netball'&&TQ.B.own===e.i){ e.x=ox; e.z=oz; e.vx=e.vz=0; } }
// friends playing a match are drawn as their player in it, not as themselves
function tqPeerHidden(s){ return TQ.on&&s&&s.m==='team'; }

/* ---------- on screen ---------- */
function tqUI(full){ const h=$('tqHud'); if(!h) return; const on=S.mode==='team'&&TQ.on; h.hidden=!on; document.body.classList.toggle('tqon',on); if(!on) return; const D=tqD(), e=tqMe(), B=TQ.B;
  const mm=Math.floor(Math.max(0,TQ.clk)/60), ss=Math.floor(Math.max(0,TQ.clk)%60);
  $('tqHomeN').textContent=tqHome(); $('tqAwayN').textContent=tqAway(); $('tqScore').textContent=TQ.sc[0]+' – '+TQ.sc[1]; $('tqClock').textContent=D.ic+' '+mm+':'+String(ss).padStart(2,'0')+' · '+(TQ.half===1?'1.ª parte':'2.ª parte');
  $('tqAwayC').style.background=TQ_RIV[TQ.rv].c; $('tqBtns').style.visibility=TQ.ph==='end'?'hidden':'';
  const has=e&&B.own===e.i, conv=TQ.ph==='conv'&&TQ.conv&&e&&TQ.conv.e===e.i&&!TQ.conv.kicked;
  $('tqPass').textContent=conv||TQ.ph==='conv'?'—':has?(TQ.ph==='set'?(tqIsKickoff()?'Patada':'Saque'):'Pase'):'Cambiar';
  let st=has||conv?(TQ.k==='netball'?'Tiro':TQ.k==='rugby'?(conv?'Patada':tqDropOK(e)?'Drop':'Patada'):TQ.k==='hockey'?(tqInCircle(e)?'Tiro':'Golpe'):'Tiro'):(TQ.k==='rugby'?'Placar':TQ.k==='netball'?'Saltar':'Robar');
  $('tqShot').firstChild.textContent=st; $('tqShot').classList.toggle('off',has&&TQ.k==='netball'&&!(tqShooter(e)&&tqInCircle(e)));
  $('tqShotS').textContent=has||conv?'mantén y suelta':'toca'; let hint='';
  if(TQ.ph==='conv'&&conv) hint='Conversión: apunta con el joystick a los palos y mantén Patada; la raya blanca del anillo es la fuerza buena';
  else if(TQ.ph==='conv') hint='Conversión del otro equipo';
  else if(has&&TQ.ph==='set') hint=tqIsKickoff()?'Saque: pulsa Patada para chutar hacia su campo':'Saque para tu equipo: pulsa Saque para pasar';
  else if(has&&TQ.k==='netball'){ const sl=Math.max(0,3-e.hold).toFixed(1); hint=tqShooter(e)&&tqInCircle(e)?`Con la pelota no puedes moverte: pasa antes de 3 s (${sl}) o mantén Tiro`:`Con la pelota no puedes moverte: pasa antes de 3 s (${sl})`; }
  else if(has&&TQ.k==='rugby') hint=tqDropOK(e)?'Corre hasta su línea de marca; pase solo hacia atrás; Drop: a palos (3 puntos)':'Corre hasta su línea de marca; pase solo hacia atrás';
  else if(has&&TQ.k==='hockey') hint=tqInCircle(e)?'¡Dentro del círculo: mantén Tiro!':'Lleva la bola al círculo de enfrente: solo desde dentro vale el gol';
  else if(has) hint='Tienes el balón: Pase, o mantén Tiro para chutar a puerta';
  else if(B.own>=0&&TQ.E[B.own].t!==TQ.my) hint=TQ.k==='rugby'?'Defiende: corre hacia el que lleva el balón y pulsa Placar':TQ.k==='netball'?'Defiende a tu par; Saltar para cortar el pase':'Defiende: acércate de frente y pulsa Robar; Cambiar te da el más cercano';
  else if(B.own>=0) hint='Muévete al hueco para recibir';
  else if(TQ.ph==='play') hint='Balón suelto: ¡a por él!';
  else if(e&&TQ.k==='netball') hint=`Tu puesto: ${TQ_NBN[e.role]} · solo puedes estar en tu zona`;
  if(hint!==TQ.hint){ TQ.hint=hint; $('tqHint').textContent=hint; } }
function tqDropOK(e){ if(!e||TQ.k!=='rugby') return false; const F=TQ.F, s=tqSgn(e.t), q=tqAB(e); return Math.hypot(F.hl-s*q[0],q[1])<32&&Math.abs(q[1])<14&&s*q[0]>0; }
function tqRingUI(){ const f=$('tqRingFill'); if(!f) return; const c=2*Math.PI*48, p=TQ.chg?TQ.pow:0; f.setAttribute('stroke-dasharray',(c*p)+' '+c); f.setAttribute('stroke',p>0.88?'#d6442a':'#255d3c');
  const mk=$('tqRingMark'); if(mk){ const id=TQ.ideal; mk.style.display=id!==null&&id!==undefined&&(TQ.chg||(TQ.ph==='conv'))?'':'none'; if(id) mk.setAttribute('stroke-dasharray','3 '+c+''); if(id) mk.setAttribute('stroke-dashoffset',String(-c*id+1.5)); } }
function tqEndCard(){ const el=$('tqEnd'); if(!el||!TQ.res) return; const R=TQ.res, D=tqD(); const t=R.r===0?'¡Victoria!':R.r===1?'Empate':'Derrota';
  const st=tqStat(TQ.k), dn=D.n.toLowerCase(), prize=R.r===0?`+10 monedas y el trofeo de ${dn}`:R.r===1?'+5 monedas':'+2 monedas por jugar';
  el.innerHTML='<h3>'+D.ic+' '+t+'</h3><p class="big">'+esc(tqHome())+' '+TQ.sc[0]+' – '+TQ.sc[1]+' '+esc(tqAway())+'</p><p class="note">'+prize+'. '+`Tus partidos de ${dn}: ${st[0]} ganados, ${st[1]} empatados y ${st[2]} perdidos.`+'</p><div class="row"><button class="btn primary" id="tqAgain">'+(TQ.net?'Salir':'Revancha')+'</button><button class="btn small" id="tqEndSheet">'+'Deportes'+'</button><button class="btn small" id="tqEndOut">'+'Salir'+'</button></div>';
  el.hidden=false; $('tqAgain').onclick=()=>{ el.hidden=true; if(TQ.net){ tqEnd(); return; } const k=TQ.k; tqEnd(); tqStart(k); }; $('tqEndSheet').onclick=()=>{ el.hidden=true; const k=TQ.k; tqEnd(); tqSheet(k); }; $('tqEndOut').onclick=()=>{ el.hidden=true; tqEnd(); }; }
function tqStatus(){ const D=tqD(); return [D.ic+' '+D.n+' · '+tqScoreTxt(),TQ.hint||'']; }

/* ---------- the sheet: one tab per sport and how to play ---------- */
function tqRulesHTML(k){ return {football:'<ul><li><b>Gol</b>: el balón entero pasa la línea de gol entre los palos y por debajo del larguero.</li><li><b>Saque de banda</b> si sale por un lado; <b>córner</b> si lo saca por su línea de gol el que defiende, y <b>saque de puerta</b> si es el que ataca.</li><li>Las <b>entradas por detrás</b> son falta: golpe franco para el otro equipo.</li><li>El <b>portero</b> (verde o amarillo) coge el balón con las manos dentro de su área.</li></ul>',
  hockey:'<ul><li>La bola va por el suelo y se juega con el <b>stick</b>. <b>Pase</b> empuja la bola; <b>Golpe</b> la manda lejos.</li><li>Solo vale el gol si se tira <b>desde dentro del círculo</b> (el semicírculo delante de la portería). Desde fuera, Tiro hace un golpe largo.</li><li>Robar por detrás es falta. El portero lleva protecciones blancas y casco.</li><li>Si sale por la línea de fondo: <b>saque desde 15 m</b> o <b>córner largo</b>.</li></ul>',
  rugby:'<ul><li><b>Ensayo</b> (5 puntos): llevar el balón más allá de la línea de marca del otro equipo. Después, la <b>conversión</b> (2): patada a palos desde enfrente del sitio del ensayo.</li><li>El balón se lleva en las manos y el <b>pase solo puede ir hacia atrás</b> o en línea; hacia delante se juega con el pie.</li><li><b>Placaje</b>: tirar al que lleva el balón. Se forma un <b>ruck</b> y casi siempre sigue con el balón su equipo.</li><li><b>Drop</b> (3): patada a palos con el balón botando, en juego.</li></ul>',
  netball:'<ul><li>No se puede <b>correr con la pelota</b>: al cogerla te paras y pasas en menos de <b>3 segundos</b>. Tampoco se bota.</li><li>Cada jugadora tiene un <b>puesto</b> con su letra (GS, GA, C, GD, GK…) y solo puede estar en sus <b>zonas</b> de la pista.</li><li>Solo tiran la <b>GS</b> y la <b>GA</b>, desde dentro del <b>círculo</b>. El aro no tiene tablero.</li><li>Quien defiende a la que tiene la pelota se queda a <b>0,9 m</b> (3 pies).</li><li>Tras cada canasta hay <b>pase de centro</b>, por turnos.</li></ul>'}[k]; }
function tqPlayHTML(k){ const D=TQ_DEF[k], F=tqFr(k), st=tqStat(k), inRoom=!!(MP.code&&MP.peers&&MP.peers.size);
  if(!F) return '<p>'+`No hay campo de ${D.n.toLowerCase()} en este mundo.`+'</p>';
  const opt=(id,lab,vals,cur)=>'<div class="tqopt"><span>'+lab+'</span>'+vals.map(v=>'<button class="btn small'+(v[0]===cur?' on':'')+'" data-tq'+id+'="'+v[0]+'">'+v[1]+'</button>').join('')+'</div>';
  const where={football:'el campo de fútbol del valle, al oeste del colegio',hockey:'el campo de hockey del colegio',rugby:'el campo de rugby, junto a Kirkby Lonsdale',netball:'la pista multideporte del colegio (la de tenis, con las líneas de netball)'}[k];
  let h='<p>'+`<b>${D.ic} ${D.n}</b> en ${where} (${Math.round(F.p.L)} × ${Math.round(F.p.W)} m en OpenStreetMap). El colegio juega con su ropa de deporte contra un colegio inventado.`+'</p>';
  h+=opt('n','Por equipo',[[5,'5'],[7,'7']],TQ.n)+opt('d','Partido',[[2,'2 min'],[4,'4 min'],[6,'6 min']],TQ.dur)+opt('r','Rival',TQ_RIV.map((r,i)=>[i,r.n]),TQ.rv)+opt('f','Nivel',TQ_DFN.map((n,i)=>[i,n]),TQ.df);
  if(inRoom) h+=opt('m','Con la sala',[['j','Todos juntos'],['c','Unos contra otros']],TQ.md);
  if(TQ.lobby&&TQ.lobby.host===MP.id) h+='<p class="note">'+`Invitación enviada: ${TQ.lobby.ids.length} apuntados.`+' <button class="btn small" id="tqNowB">'+'Empezar ya'+'</button></p>';
  h+='<div class="row" style="margin-top:8px"><button class="btn primary" id="tqPlayB">'+'Jugar contra la máquina'+'</button>'+(inRoom?'<button class="btn" id="tqRoomB">'+'Invitar a la sala'+'</button>':'')+'<button class="btn small" id="tqGoB">'+'Ir al campo'+'</button></div>';
  h+='<h3>'+'Reglas'+'</h3>'+tqRulesHTML(k)+'<p class="note">'+`Tus partidos de ${D.n.toLowerCase()}: ${st[0]} ganados, ${st[1]} empatados y ${st[2]} perdidos; ${st[3]} a favor y ${st[4]} en contra.`+'</p>'; return h; }
function tqHowHTML(){ return '<h3>Cómo se juega</h3><ul><li><b>Moverte</b>: el joystick (arrastra abajo a la izquierda), las flechas o WASD, o el stick izquierdo. Arriba es hacia la portería (o la línea de marca) a la que atacas.</li><li><b>Pase</b>: al compañero hacia el que apuntas con el joystick (si no apuntas, al mejor colocado). Sin balón, <b>Cambiar</b> te da el compañero más cercano al balón. El balón también te cambia solo al compañero que lo recibe.</li>'+
  '<li><b>Tiro</b>: mantén y suelta; el anillo es la fuerza. Apunta a un lado de la portería con el joystick. En la conversión y en el netball, la raya blanca del anillo marca la fuerza buena. Sin balón, el mismo botón es <b>Robar</b> (de frente), <b>Placar</b> o <b>Saltar</b>.</li><li><b>Esprint</b>: mantenlo (o Mayús, o R2); gasta resistencia y se recupera andando.</li><li><b>Vista</b>: desde detrás de tu jugador o lateral, como en la tele. <b>Salir</b>: dos toques.</li>'+
  '<li><b>Teclado</b>: Espacio o J pase, K tiro (mantén), Mayús esprint, Q cambiar, V vista. <b>Mando</b>: ✕ pase o cambiar, □ tiro (mantén), R2 o R1 esprint, L1 cambiar, △ vista, ○ salir.</li></ul>'+
  '<h3>Cómo se lee la pantalla</h3><ul><li><b>Arriba</b>: el marcador (tu colegio a la izquierda, con su color), el reloj de cada parte y la parte que se juega.</li><li><b>Tu jugador</b> lleva un aro en el suelo: blanco sin balón, amarillo con él. Un cono amarillo encima de un compañero: ahí va tu pase. Los nombres son los de tus amigos de la sala.</li>'+
  '<li><b>Abajo</b>: lo que toca hacer ahora. En el mapa, los campos con su color (verde fútbol, azul hockey, marrón rugby, rosa netball) y, durante el partido, los jugadores: marrón el colegio, el color del rival el otro equipo, blanco el balón.</li><li><b>Con la sala</b>: quien invita lleva el partido y los demás ven lo mismo; cada amigo juega con su jugador. «Todos juntos» os pone en el mismo equipo contra la máquina; «unos contra otros», en equipos distintos.</li></ul>'+
  '<h3>Glosario</h3><dl class="gloss">'+tqGlossHTML()+'</dl>'; }
function tqSheet(tab){ if(!WP.team) return; closeModal(); TQ.tab=tab||TQ.tab||TQ.k; const T=TQ.tab, B=$('tqBody'); if(TQ_SP.includes(T)) TQ.k=T;
  let h='<h2>'+'Deportes de equipo'+'</h2><div class="tabs">'+TQ_SP.map(k=>'<button data-tqt="'+k+'" class="'+(T===k?'on':'')+'">'+TQ_DEF[k].ic+' '+TQ_DEF[k].n+'</button>').join('')+'<button data-tqt="como" class="'+(T==='como'?'on':'')+'">'+'❓ Cómo se juega'+'</button></div>';
  h+=T==='como'?tqHowHTML():tqPlayHTML(T); h+='<div class="row" style="margin-top:12px"><button class="btn small" id="tqClose">'+'Cerrar'+'</button></div>'; B.innerHTML=h; $('tqSheet').hidden=false; $('tqSheet').scrollTop=0;
  B.querySelectorAll('[data-tqt]').forEach(b=>b.onclick=()=>tqSheet(b.dataset.tqt)); $('tqClose').onclick=()=>{ $('tqSheet').hidden=true; };
  const set=(a,f)=>B.querySelectorAll('[data-tq'+a+']').forEach(b=>b.onclick=()=>{ f(b.getAttribute('data-tq'+a)); tqSave(); tqSheet(T); });
  set('n',v=>TQ.n=+v); set('d',v=>TQ.dur=+v); set('r',v=>TQ.rv=+v); set('f',v=>TQ.df=+v); set('m',v=>TQ.md=v);
  const pb=$('tqPlayB'); if(pb) pb.onclick=()=>tqStart(T); const rb=$('tqRoomB'); if(rb) rb.onclick=()=>{ TQ.k=T; tqInvite(); }; const gb=$('tqGoB'); if(gb) gb.onclick=()=>tqGoPitch(T); const nb=$('tqNowB'); if(nb) nb.onclick=()=>{ if(TQ.lobby) TQ.lobby.go=Date.now(); $('tqSheet').hidden=true; }; }
function tqGoPitch(k){ const F=tqFr(k); if(!F) return; if(!tqCanStart()){ toast(TQ_DEF[k].n,'Termina antes lo que estás haciendo'); return; } tqHideSheets();
  fadeTo(()=>{ tqLeaveOthers(); const p=tqW(F,0,-(F.hw+3)); P.x=p[0]; P.z=p[1]; P.y=W.terrain(p[0],p[1])+0.1; P.vx=P.vy=P.vz=0; P.onGround=true; P.yaw=Math.atan2(F.cz-p[1],F.cx-p[0]); camS.yaw=P.yaw; setMode('walk'); if(rig) rig.root.visible=true; toast(`${TQ_DEF[k].ic} ${TQ_DEF[k].n}`,'Junto al campo: «Jugar» en el botón de acción'); }); }
// walking on a pitch, the action button offers its game
function tqActNear(){ if(!WP.team||TQ.on||S.mode!=='walk') return null; const k=tqPitchAt(P.x,P.z,1); if(!k||k==='netball') return null; const D=TQ_DEF[k]; return {k:'tqgo',label:`${D.ic} Jugar al ${D.n.toLowerCase()}`,ref:k}; }
function tqDo(k,ref){ if(k==='tqgo') tqSheet(ref); }

/* ---------- map, legend, guide and glossary ---------- */
function tqDrawMap(g,m2c,s,big){ if(!WP.team) return; g.save();
  for(const k of TQ_SP){ const F=TQ.on&&TQ.k===k?TQ.F:tqFr(k); if(!F) continue; const D=TQ_DEF[k], cs=[[-1,-1],[1,-1],[1,1],[-1,1]].map(q=>m2c(...tqW(F,q[0]*(F.hl+F.ig),q[1]*F.hw)));
    g.strokeStyle=D.col; g.lineWidth=(big?1.8:1.2)*s; g.fillStyle=D.col+'33'; g.beginPath(); cs.forEach((c,i)=>i?g.lineTo(c[0],c[1]):g.moveTo(c[0],c[1])); g.closePath(); g.fill(); g.stroke();
    if(big){ const c=m2c(F.cx,F.cz); g.fillStyle='#16231b'; g.font='800 '+(6*s)+'px system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(D.ic+' '+D.n,c[0],c[1]); } }
  if(TQ.on&&TQ.F){ const r=(big?1.9:1.3)*s; for(const e of TQ.E){ const [x,y]=m2c(e.x,e.z); g.fillStyle=e.t===0?'#6b4428':TQ_RIV[TQ.rv].c; g.strokeStyle=e.i===TQ.me?'#f2c230':'#fff'; g.lineWidth=(e.i===TQ.me?1.6:0.8)*s; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); g.stroke(); }
    const [bx,by]=m2c(TQ.B.x,TQ.B.z); g.fillStyle='#fff'; g.strokeStyle='#16231b'; g.lineWidth=0.8*s; g.beginPath(); g.arc(bx,by,r*0.75,0,7); g.fill(); g.stroke(); }
  g.restore(); }
function tqLegend(){ if(!WP.team) return ''; let h='<div><i style="background:#1f8a4c55;border:2px solid #1f8a4c"></i>Campos de los deportes de equipo: verde fútbol, azul hockey, marrón rugby, rosa netball</div>';
  if(TQ.on) h+='<div><i style="background:#6b4428;border-radius:50%;border:2px solid #fff"></i>'+`${esc(tqHome())} (aro amarillo: tú), ${esc(tqAway())} (su color) y el balón (blanco)`+'</div>'; return h; }
function tqGuideHTML(){ if(!WP.team) return ''; return '<li><b>Deportes de equipo</b> (botón <b>Deportes de equipo</b> del inicio o del menú, o «Jugar» en un campo): fútbol, hockey, rugby y netball en los campos de verdad del valle, de 5 o de 7 por equipo, contra un colegio inventado y con árbitro, o con tus amigos de la sala; pases, tiros, placajes, saques, partes y marcador, con monedas y trofeos.</li>'; }
function tqGlossHTML(){ return '<dt>Saque de banda</dt><dd>Se repone el balón desde la línea de un lado cuando sale por ella; lo saca el equipo que no lo tocó el último.</dd><dt>Córner</dt><dd>Saque desde la esquina cuando el equipo que defiende saca el balón por su propia línea de gol.</dd><dt>Saque de puerta</dt><dd>Lo hace el portero cuando el que ataca saca el balón por la línea de gol.</dd><dt>Golpe franco</dt><dd>Saque tras una falta, desde donde se hizo.</dd>'+
  '<dt>Círculo (hockey)</dt><dd>El área en forma de D delante de cada portería: solo vale el gol tirado desde dentro.</dd><dt>Stick</dt><dd>El palo de hockey, con la cabeza curva; la bola se juega solo con su cara plana.</dd>'+
  '<dt>Ensayo</dt><dd>En rugby, apoyar el balón más allá de la línea de marca del rival: 5 puntos.</dd><dt>Conversión</dt><dd>Patada a palos tras el ensayo, desde enfrente de donde se marcó: 2 puntos si pasa entre los palos y por encima del travesaño.</dd><dt>Drop</dt><dd>Patada a palos en juego, soltando el balón y chutándolo al botar: 3 puntos.</dd><dt>Placaje</dt><dd>Agarrar y tirar al suelo al que lleva el balón (solo a él).</dd><dt>Ruck</dt><dd>Tras un placaje, los dos equipos empujan sobre el balón en el suelo; casi siempre lo gana el equipo que lo llevaba.</dd><dt>Pase adelantado</dt><dd>Pase con la mano hacia la línea de marca rival: no se puede, y el otro equipo saca.</dd><dt>Línea de marca</dt><dd>La línea de cada fondo del campo de rugby; detrás está la zona de marca, donde se hacen los ensayos.</dd>'+
  '<dt>Netball</dt><dd>Deporte de equipo muy jugado en los colegios británicos, parecido al baloncesto pero sin botar ni correr con la pelota y con un aro sin tablero.</dd><dt>Puestos del netball</dt><dd>GS (Goal Shooter), GA (Goal Attack), WA (Wing Attack), C (Centre), WD (Wing Defence), GD (Goal Defence) y GK (Goal Keeper). Con 5 por equipo no hay WA ni WD. La letra va en el peto.</dd><dt>Tres segundos</dt><dd>En netball, el tiempo máximo con la pelota en las manos.</dd><dt>Pase de centro</dt><dd>El saque del netball, desde el círculo del centro, por turnos tras cada canasta.</dd><dt>Anfitrión</dt><dd>En un partido con la sala, el que invita: su juego lleva el balón, el reloj y los jugadores de la máquina.</dd>'; }
{ const m=$('mTeam'); if(m){ m.hidden=!WP.team; m.onclick=()=>{ saveName(); ensureAudio(); tqSheet(TQ.k); }; } }
{ const b=$('tqPass'); if(b){ b.addEventListener('pointerdown',e=>{ e.preventDefault(); tqPassBtn(); }); const sh=$('tqShot'); sh.addEventListener('pointerdown',e=>{ e.preventDefault(); try{ sh.setPointerCapture(e.pointerId); }catch(x){} tqShotDown(); });
    sh.addEventListener('pointerup',e=>{ e.preventDefault(); tqShotUp(); }); sh.addEventListener('pointercancel',()=>tqShotUp()); const sp=$('tqSpr'); sp.addEventListener('pointerdown',e=>{ e.preventDefault(); tqSprintSet(true); }); sp.addEventListener('pointerup',()=>tqSprintSet(false)); sp.addEventListener('pointerleave',()=>tqSprintSet(false));
    $('tqView').onclick=tqViewT; $('tqExit').onclick=tqExit; } }
