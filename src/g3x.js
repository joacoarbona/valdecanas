/* ================= hotel y bar: Vincci Valdecañas Golf =================
   Recreated from the project description (proarquitectura, "Hotel Husa Golf Valdecañas") and the hotel's
   photo galleries: a long three-storey body with the hall, the salón-bar facing south to the reservoir and the
   dining room on the ground floor; hall in white Macael marble with corten steel, oak floor in the bar, large
   format ceramic in the dining room. Outside, a terrace of beige tiles with glass railing, parasols and lanterns.
   The interior is a rectangle inside the Catastro footprint (local axes: s along the long façade, t to the south)
   and reuses the villa interior machinery (S.interior); the terrace and the two entrances live in the world. */
const HX={F:null,ok:false,deck:null,tables:[],seats:[],npc:[],order:null,glass:null,drink:null,sip:0,lev:1,carry:false,sit:null,todPrev:null,glow:null,lan:null,t:0,doorN:null,doorT:null};
const HX_DRINKS={
  gin:{n:'Gin-tonic',art:'el gin-tonic',d:'Copa de balón con hielo, tónica, piel de limón y bayas de enebro (para mayores).',c:'#e9f2e4'},
  soda:{n:'Refresco',art:'el refresco',d:'Vaso alto de cola con hielo y una pajita.',c:'#3b1d12'},
  zumo:{n:'Zumo de naranja',art:'el zumo',d:'Naranja recién exprimida con una rodaja en el borde.',c:'#f39a1e'},
  batido:{n:'Batido de fresa',art:'el batido',d:'Batido frío con nata, una guinda y pajita de rayas.',c:'#f2a3b5'}};
// layout along s (metres from the centroid of the main body, west to east)
const HXL={S0:-30,S1:18,rest1:-16,bar1:4,doorT:-7,doorN:10,ter0:-19,ter1:1,DT:8.6};
function hxW(s,t){ const F=HX.F; return [F.c[0]+F.u[0]*s+F.v[0]*t, F.c[1]+F.u[1]*s+F.v[1]*t]; }
function hxL(x,z){ const F=HX.F, dx=x-F.c[0], dz=z-F.c[1]; return [dx*F.u[0]+dz*F.u[1], dx*F.v[0]+dz*F.v[1]]; }
function hxFrame(){ if(HX.F||HX.tried) return HX.F; HX.tried=true; const hb=W.HOT_B; if(!WP.hotel||!hb||!hb.ring) return null;
  const pre=String(hb.id).split('_')[0]; const parts=W.BUILDINGS.filter(b=>b.ring&&String(b.id).split('_')[0]===pre);
  let L=0,u=[1,0]; const r=hb.ring; for(let i=0;i<r.length;i++){ const a=r[i], c=r[(i+1)%r.length]; const l=Math.hypot(c[0]-a[0],c[1]-a[1]); if(l>L){ L=l; u=[(c[0]-a[0])/l,(c[1]-a[1])/l]; } }
  if(u[0]<0) u=[-u[0],-u[1]]; const v=[-u[1],u[0]]; HX.F={c:hb.c.slice(),u,v,a:Math.atan2(u[1],u[0]),hb,parts};
  const body=parts.filter(b=>b.f>=2), inAny=(arr,x,z)=>arr.some(b=>inBld(b,x,z));
  let tS=1e9, tN=-1e9; for(let s=HXL.S0+0.5;s<=HXL.S1-0.5;s+=1.5){ let t=0; while(t<40&&inAny(body,...hxW(s,t+0.1))) t+=0.1; tS=Math.min(tS,t); t=0; while(t>-40&&inBld(hb,...hxW(s,t-0.1))) t-=0.1; tN=Math.max(tN,t); }
  let tO=tN; while(tO>-60&&inAny(parts,...hxW(HXL.doorN,tO-0.1))) tO-=0.1; let tT=tS; while(tT<60&&inAny(parts,...hxW(HXL.doorT,tT+0.1))) tT+=0.1;
  Object.assign(HX.F,{tS,tN,tO,tT,iN:tN+0.25,iS:tS-0.25});
  // the deck sits just above the highest ground under it; the bar floor matches it so the threshold is flat
  let mx=-1e9; for(let s=HXL.ter0;s<=HXL.ter1;s+=1) for(let t=tT;t<=tT+HXL.DT;t+=1){ const p=hxW(s,t); mx=Math.max(mx,W.terrain(p[0],p[1])); }
  let mi=-1e9; for(let s=HXL.S0;s<=HXL.S1;s+=1) for(let t=tN;t<=tS;t+=1){ const p=hxW(s,t); mi=Math.max(mi,W.terrain(p[0],p[1])); } // the ground must stay under the bar floor
  HX.F.deckY=Math.max(hb.floorY,mx+0.14,mi+0.1); return HX.F; }

/* ---- textures ---- */
function hxCorten(){ return txc('hxCorten',()=>canvasTex(512,512,(g,w,h)=>{ g.fillStyle='#8a4a2a'; g.fillRect(0,0,w,h); const R=rng(91);
  for(let k=0;k<2600;k++){ const x=R()*w, y=R()*h, r=2+R()*16; g.fillStyle=['rgba(160,82,40,0.22)','rgba(105,52,30,0.25)','rgba(180,110,60,0.16)','rgba(70,40,28,0.2)'][(R()*4)|0]; g.beginPath(); g.ellipse(x,y,r,r*(0.3+R()*0.6),R()*3,0,7); g.fill(); }
  for(let x=0;x<w;x+=128){ g.fillStyle='rgba(40,22,14,0.5)'; g.fillRect(x,0,2,h); } },true)); }
function hxTiles(col,line,n){ return txc('hxT'+col+n,()=>canvasTex(512,512,(g,w,h)=>{ g.fillStyle=col; g.fillRect(0,0,w,h); const R=rng(n*7+3); const st=w/n;
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){ const k=0.94+R()*0.1; g.fillStyle='rgba('+(k>1?'255,255,255,':'0,0,0,')+Math.abs(k-1)*0.9+')'; g.fillRect(i*st,j*st,st,st); for(let q=0;q<30;q++){ g.fillStyle='rgba(120,100,80,'+(0.04+R()*0.05)+')'; g.fillRect(i*st+R()*st,j*st+R()*st,1+R()*3,1+R()*3); } }
  g.fillStyle=line; for(let i=0;i<=n;i++){ g.fillRect(i*st-1,0,2.5,h); g.fillRect(0,i*st-1,w,2.5); } },true)); }
function hxStone(col,vein){ return txc('hxM'+col,()=>canvasTex(512,512,(g,w,h)=>{ g.fillStyle=col; g.fillRect(0,0,w,h); const R=rng(col.length*31+5);
  for(let k=0;k<900;k++){ g.fillStyle='rgba(0,0,0,'+(R()*0.035)+')'; g.fillRect(R()*w,R()*h,2+R()*6,2+R()*6); }
  g.lineCap='round'; for(let k=0;k<14;k++){ let x=R()*w, y=R()*h; g.strokeStyle=vein+(0.10+R()*0.22)+')'; g.lineWidth=0.6+R()*1.8; g.beginPath(); g.moveTo(x,y); for(let q=0;q<9;q++){ x+=(R()-0.3)*70; y+=(R()-0.5)*50; g.lineTo(((x%w)+w)%w,((y%h)+h)%h); } g.stroke(); } },true)); }
function hxSign(key,lines,o){ return txc('hxS'+key,()=>canvasTex(o.w,o.h,(g,w,h)=>{ g.fillStyle=o.bg; g.fillRect(0,0,w,h); g.textAlign='center'; g.textBaseline='middle';
  lines.forEach(([txt,font,col,y])=>{ g.font=font; g.fillStyle=col; g.fillText(txt,w/2,h*y); }); })); }

/* ---- drinks ---- */
function hxDrinkMesh(kind){ const g=new THREE.Group(); const D=HX_DRINKS[kind];
  const glassM=IM({color:'#eef6f8',transparent:true,opacity:0.32,roughness:0.05}), liqM=IM({color:D.c,transparent:kind==='gin',opacity:0.78,roughness:0.15}), ice=IM({color:'#f4fbff',transparent:true,opacity:0.6,roughness:0.05});
  const add=(geo,m,x,y,z,sx,sy,sz,rx,rz)=>{ const o=new THREE.Mesh(geo,m); o.position.set(x,y,z); o.scale.set(sx,sy,sz); if(rx) o.rotation.x=rx; if(rz) o.rotation.z=rz; g.add(o); return o; };
  const cyl=new THREE.CylinderGeometry(0.5,0.5,1,18), sph=new THREE.SphereGeometry(0.5,16,12), box=new THREE.BoxGeometry(1,1,1);
  let liq;
  if(kind==='gin'){ add(cyl,glassM,0,0.003,0,0.075,0.006,0.075); add(cyl,glassM,0,0.055,0,0.008,0.1,0.008); add(sph,glassM,0,0.16,0,0.12,0.13,0.12);
    liq=add(sph,liqM,0,0.14,0,0.105,0.085,0.105); for(const [x,z] of [[0.02,0.01],[-0.018,0.02],[0,-0.025]]) add(box,ice,x,0.17,z,0.028,0.028,0.028,0.4,0.3);
    add(cyl,IM({color:'#f2cf3c',roughness:0.6}),0.035,0.19,0.01,0.05,0.004,0.016,0,0.5); for(const [x,z] of [[-0.01,-0.01],[0.012,0.022]]) add(sph,IM({color:'#3b3550',roughness:0.4}),x,0.18,z,0.012,0.012,0.012); }
  else { const tall=kind!=='batido'; add(cyl,glassM,0,0.08,0,tall?0.068:0.08,0.16,tall?0.068:0.08); liq=add(cyl,liqM,0,0.065,0,tall?0.06:0.072,0.12,tall?0.06:0.072);
    if(kind==='soda'){ for(const [x,z] of [[0.012,0.01],[-0.012,-0.01]]) add(box,ice,x,0.12,z,0.024,0.024,0.024,0.5,0.2); add(cyl,IM({color:'#d6442a',roughness:0.5}),0.012,0.17,0,0.006,0.14,0.006,0,0.25); }
    if(kind==='zumo'){ add(cyl,IM({color:'#f7b23a',roughness:0.6}),0.034,0.155,0,0.05,0.004,0.05,1.3,0); }
    if(kind==='batido'){ add(sph,IM({color:'#fbf7f0',roughness:0.8}),0,0.16,0,0.075,0.05,0.075); add(sph,IM({color:'#c0182b',roughness:0.3}),0,0.19,0,0.02,0.02,0.02); add(cyl,IM({color:'#f0f0f0',roughness:0.5}),0.015,0.2,0,0.007,0.14,0.007,0,0.3); } }
  g.userData.liq=liq; g.userData.ly=liq.position.y; g.userData.sy=liq.scale.y; g.traverse(o=>{ if(o.isMesh){ o.castShadow=false; o.layers.set(0); } }); return g; }
function hxSetLevel(k){ const G=HX.glass; if(!G) return; const l=G.userData.liq; HX.lev=k; l.visible=k>0.03; l.scale.y=G.userData.sy*Math.max(0.05,k); l.position.y=G.userData.ly-G.userData.sy*(1-k)*0.45; }
function hxDropGlass(){ if(HX.glass&&HX.glass.parent) HX.glass.parent.remove(HX.glass); HX.glass=null; HX.drink=null; HX.carry=false; }

/* ---- world: terrace and the two entrances (built once at load, before the trees, which leave the deck clear) ---- */
function buildHotel(){ const F=hxFrame(); if(!F) return; const a=F.a, y=F.deckY, T0=F.tT, DT=HXL.DT, s0=HXL.ter0, s1=HXL.ter1; HX.deckY=y;
  const grp=new THREE.Group(); scene.add(grp); HX.grp=grp;
  const M={tile:IM({map:hxTiles('#d9cdb6','rgba(110,96,78,0.55)',4),roughness:0.62}),cope:IM({color:'#e8e0d0',roughness:0.55}),steel:IM({color:'#c9cccf',roughness:0.3,metalness:0.85}),dark:IM({color:'#2b2d2f',roughness:0.45,metalness:0.5}),
    glass:IM({color:'#dfeef2',transparent:true,opacity:0.18,roughness:0.03}),rattan:IM({map:woodTex('#4a4038'),roughness:0.8}),cush:IM({map:fabricTex('#ece4d4'),roughness:1}),top:IM({map:hxStone('#f1ece4','rgba(150,140,130,'),roughness:0.35}),
    canvas:IM({color:'#f2ead9',roughness:0.95,side:THREE.DoubleSide}),corten:IM({map:hxCorten(),roughness:0.85,metalness:0.25}),pot:IM({color:'#b9b2a6',roughness:0.85}),soil:IM({color:'#4a3a2c',roughness:1}),olive:IM({map:leafTex(),alphaTest:0.5,roughness:0.7,color:'#9fb48a'}),trunk:IM({color:'#6b5a46',roughness:0.9}),
    sign:IM({map:hxSign('ter',[['BAR · TERRAZA','700 46px Figtree, sans-serif','#f4efe6',0.5]],{w:512,h:96,bg:'#2b2d2f'}),roughness:0.5}),
    signN:IM({map:hxSign('vin',[['VINCCI VALDECAÑAS GOLF','800 64px Figtree, sans-serif','#f6f2ea',0.42],['HOTEL ★★★★ · CASA CLUB','600 30px Figtree, sans-serif','#e7c9a9',0.8]],{w:1024,h:160,bg:'#3a2418'}),roughness:0.6})};
  HX.glow=GLOW(1.6,1.2,0.7); HX.bulb=GLOW(1.8,1.5,0.9); M.glow=HX.glow; M.bulb=HX.bulb;
  const G={}; for(const k in M) G[k]=new IB(k==='tile'?0.5:1.2);
  const P=(s,t)=>hxW(s,t), L=s1-s0, cs=(s0+s1)/2, ct=T0+DT/2, pc=P(cs,ct);
  let gmin=1e9; for(let s=s0;s<=s1;s+=1) for(let t=T0;t<=T0+DT;t+=1){ const p=P(s,t); gmin=Math.min(gmin,W.terrain(p[0],p[1])); }
  // deck slab and a light stone coping; the deck is walkable (a step up from the lawn)
  G.tile.bx(pc[0],gmin-0.5,pc[1],L,y-(gmin-0.5),DT,a); HX.deck=addPlat(pc[0],pc[1],a,L,DT,y,y-gmin+0.5);
  for(const [ss,tt,sx,sz] of [[cs,T0+DT-0.12,L+0.1,0.26],[s0+0.12,ct,0.26,DT],[s1-0.12,ct,0.26,DT]]){ const p=P(ss,tt); G.cope.bx(p[0],y-0.02,p[1],sx,0.06,sz,a); }
  // steps down to the lawn in the middle of the south edge
  const st0=-9.4, st1=-4.6; { let gy=1e9; for(let s=st0;s<=st1;s+=0.5){ const p=P(s,T0+DT+0.8); gy=Math.min(gy,W.terrain(p[0],p[1])); } const n=Math.max(1,Math.round((y-gy)/0.17));
    for(let k=1;k<=n;k++){ const top=y-k*(y-gy)/(n+0.2); const p=P((st0+st1)/2,T0+DT+0.36*k-0.1); G.cope.bx(p[0],gy-0.3,p[1],st1-st0,top-gy+0.3,0.36,a); addPlat(p[0],p[1],a,st1-st0,0.36,top,top-gy+0.3); } HX.steps=P((st0+st1)/2,T0+DT+0.36*n+1.2); }
  // glass railing with steel posts (stops you at the edge, except at the steps); string lights on the south side
  const rail=(sA,tA,sB,tB)=>{ const len=Math.hypot(sB-sA,tB-tA), n=Math.max(1,Math.round(len/1.5)), aa=a+Math.atan2(tB-tA,sB-sA); const m=P((sA+sB)/2,(tA+tB)/2);
    G.glass.bx(m[0],y+0.08,m[1],len,0.9,0.02,aa); G.steel.bx(m[0],y+0.98,m[1],len,0.05,0.07,aa);
    for(let k=0;k<=n;k++){ const f=k/n, p=P(sA+(sB-sA)*f,tA+(tB-tA)*f); G.steel.bx(p[0],y,p[1],0.06,1.0,0.06,aa); }
    const pl=addPlat(m[0],m[1],aa,len,0.2,y+1.0,1.05); pl.nostep=true; HX.rails=(HX.rails||[]).concat(pl); };
  const tE=T0+DT-0.2; rail(s0+0.2,T0+0.4,s0+0.2,tE); rail(s1-0.2,T0+0.4,s1-0.2,tE); rail(s0+0.2,tE,st0,tE); rail(st1,tE,s1-0.2,tE);
  for(let s=s0+0.5;s<s1;s+=0.55){ if(s>st0-0.3&&s<st1+0.3) continue; const k=(s-s0)%3/3, sag=0.25*Math.sin(Math.PI*k); const p=P(s,tE); G.bulb.sp(p[0],y+2.15-sag,p[1],0.05,0.06,0.05); }
  for(let s=s0+0.2;s<s1;s+=3){ if(s>st0-0.3&&s<st1+0.3) continue; const p=P(s,tE); G.dark.cy(p[0],y,p[1],0.03,2.25); }
  // tables (two rows of three, the middle aisle stays free from the bar door to the steps), parasols on the row by the façade
  HX.tables=[]; HX.seats=[]; const solids=[]; const sol=(s,t,sx,sz,h,aa)=>{ const p=P(s,t); const pl=addPlat(p[0],p[1],aa===undefined?a:aa,sx,sz,y+h,h+0.05); pl.nostep=true; solids.push(pl); };
  const chair=(s,t,yaw)=>{ const p=P(s,t); const ca=Math.cos(yaw), sa=Math.sin(yaw); // yaw: the way the sitter faces (world)
    G.rattan.rb(p[0],y+0.38,p[1],0.5,0.08,0.5,0.02,yaw); G.cush.rb(p[0],y+0.45,p[1],0.44,0.06,0.44,0.02,yaw);
    const bk=[p[0]-ca*0.24,p[1]-sa*0.24]; G.rattan.rb(bk[0],y+0.42,bk[1],0.06,0.5,0.5,0.02,yaw);
    for(const [ox,oz] of [[0.2,0.2],[0.2,-0.2],[-0.2,0.2],[-0.2,-0.2]]){ G.dark.cy(p[0]+ca*ox-sa*oz,y,p[1]+sa*ox+ca*oz,0.018,0.38); }
    HX.seats.push({x:p[0],z:p[1],yaw}); };
  const sunF=dirFromElAz(TOD_PRESETS.puesta[0],TOD_PRESETS.puesta[1]);
  for(const [ts,tt,para] of [[-16.2,T0+2.7,1],[-12.2,T0+2.7,1],[-1.9,T0+2.7,1],[-16.2,T0+6.2,0],[-12.2,T0+6.2,0],[-1.9,T0+6.2,0]]){ const p=P(ts,tt);
    G.dark.cy(p[0],y,p[1],0.05,0.72); G.dark.cy(p[0],y,p[1],0.28,0.03); G.top.cy(p[0],y+0.72,p[1],0.42,0.035); sol(ts,tt,0.8,0.8,0.76);
    G.glow.cy(p[0],y+0.755,p[1],0.035,0.08); G.glass.cy(p[0],y+0.755,p[1],0.05,0.13);
    const tb={x:p[0],z:p[1],y:y+0.755,s:ts,t:tt,seats:[]};
    for(const k of [0,1,2,3]){ const ang=a+k*Math.PI/2; const cx=p[0]+Math.cos(ang)*0.72, cz=p[1]+Math.sin(ang)*0.72; const yaw=ang+Math.PI; const q=hxL(cx,cz); chair(q[0],q[1],yaw); tb.seats.push(HX.seats[HX.seats.length-1]); HX.seats[HX.seats.length-1].tb=tb; }
    HX.tables.push(tb);
    if(para){ G.steel.cy(p[0],y+0.75,p[1],0.025,1.85); const hgt=y+2.35; const r=1.35; const c4=[0,1,2,3].map(k=>{ const an=a+Math.PI/4+k*Math.PI/2; return [p[0]+Math.cos(an)*r*1.414,hgt,p[1]+Math.sin(an)*r*1.414]; }); const apex=[p[0],hgt+0.42,p[1]];
      for(let k=0;k<4;k++){ const A=c4[k], B=c4[(k+1)%4]; G.canvas.tri(A,B,apex,[0,1,0],[[0,0],[1,0],[0.5,1]]); } for(const C of c4) G.canvas.bx(C[0],hgt-0.12,C[2],0.06,0.12,0.06,0); } }
  // olive trees in square planters at the corners
  for(const [ps,pt] of [[s0+0.8,T0+0.9],[s1-0.8,T0+0.9],[s0+0.8,T0+DT-1.0],[s1-0.8,T0+DT-1.0]]){ const p=P(ps,pt); G.pot.bx(p[0],y,p[1],0.9,0.6,0.9,a); G.soil.bx(p[0],y+0.6,p[1],0.8,0.02,0.8,a); G.trunk.cy(p[0],y+0.6,p[1],0.07,1.2); for(let k=0;k<5;k++) G.olive.cards(p[0]+Math.cos(k*1.3)*0.35,y+1.8+(k%2)*0.3,p[1]+Math.sin(k*1.3)*0.35,0.55,0.4,k); sol(ps,pt,0.9,0.9,0.6); }
  // the bar door on the south façade: dark frame, glass, a corten canopy and the sign
  { for(const ox of [-1.25,1.25]){ const q=P(HXL.doorT+ox,F.tT+0.05); G.dark.bx(q[0],y,q[1],0.1,2.7,0.12,a); } const hd=P(HXL.doorT,F.tT+0.05); G.dark.bx(hd[0],y+2.6,hd[1],2.6,0.12,0.12,a); const g2=P(HXL.doorT,F.tT+0.08); G.glass.bx(g2[0],y+0.05,g2[1],2.4,2.55,0.02,a); const m=P(HXL.doorT,F.tT+0.1); G.dark.bx(m[0],y,m[1],0.06,2.6,0.05,a);
    const cn=P(HXL.doorT,F.tT+0.7); G.corten.bx(cn[0],y+2.95,cn[1],3.4,0.16,1.4,a); const sg=P(HXL.doorT,F.tT+1.41); G.sign.quad([sg[0]-F.u[0]*1.2,y+2.97,sg[1]-F.u[1]*1.2],[sg[0]+F.u[0]*1.2,y+2.97,sg[1]+F.u[1]*1.2],[sg[0]+F.u[0]*1.2,y+3.1,sg[1]+F.u[1]*1.2],[sg[0]-F.u[0]*1.2,y+3.1,sg[1]-F.u[1]*1.2],[F.v[0],0,F.v[1]]); }
  // main entrance on the north side: corten portico over glass doors, the hotel's name on its fascia
  { const tO=F.tO, dp=P(HXL.doorN,tO-0.04), gy=W.terrain(dp[0],dp[1]); const gy0=Math.max(gy,F.hb.floorY-0.2); HX.doorN={x:dp[0],z:dp[1],y:gy0};
    for(const ox of [-1.55,1.55]){ const q=P(HXL.doorN+ox,tO-0.06); G.dark.bx(q[0],gy0,q[1],0.1,2.8,0.12,a); } G.dark.bx(dp[0],gy0+2.7,dp[1],3.2,0.12,0.12,a); const gg=P(HXL.doorN,tO-0.1); G.glass.bx(gg[0],gy0+0.05,gg[1],3.0,2.65,0.02,a);
    const cp=P(HXL.doorN,tO-1.6); G.corten.bx(cp[0],gy0+3.3,cp[1],5.6,0.5,3.2,a); for(const ox of [-2.6,2.6]){ const q=P(HXL.doorN+ox,tO-3.0); G.corten.bx(q[0],W.terrain(q[0],q[1])-0.2,q[1],0.3,gy0+3.5-W.terrain(q[0],q[1]),0.3,a); const pl=addPlat(q[0],q[1],a,0.3,0.3,gy0+3.4,4); pl.nostep=true; }
    const fs=P(HXL.doorN,tO-3.21); G.signN.quad([fs[0]+F.u[0]*2.5,gy0+3.33,fs[1]+F.u[1]*2.5],[fs[0]-F.u[0]*2.5,gy0+3.33,fs[1]-F.u[1]*2.5],[fs[0]-F.u[0]*2.5,gy0+3.76,fs[1]-F.u[1]*2.5],[fs[0]+F.u[0]*2.5,gy0+3.76,fs[1]+F.u[1]*2.5],[-F.v[0],0,-F.v[1]]); }
  HX.doorT={x:P(HXL.doorT,F.tT)[0],z:P(HXL.doorT,F.tT)[1]};
  for(const k in G){ const m=G[k].mesh(M[k],grp,k!=='glass'&&k!=='glow'&&k!=='bulb'); if(m&&(k==='glass')) m.renderOrder=2; }
  // two guests chatting at the far table of the back row
  const tb=HX.tables[3]; for(const [k,sk] of [[1,{shirt:'#2f6bd6',pants:'#e9e1d0',hair:'#3a2a1c',skin:'#e8b894',shoe:'#6b4a2e',cap:null,pack:null}],[3,{shirt:'#c24d5b',pants:'#2b3a55',hair:'#8a5a2b',skin:'#f1c7a5',shoe:'#2b2d2f',cap:null,pack:null,long:true}]]){ const s=tb.seats[k]; const R=buildRig(sk); poseRig(R,'drive',0,0); R.root.position.set(s.x,y-0.1,s.z); R.root.rotation.set(0,-s.yaw,0); grp.add(R.root); HX.npc.push({R,kind:'guest',ph:k}); s.busy=true; }
  // keep the trees and the grass off the deck
  const ring=[[s0-1.2,T0-0.5],[s1+1.2,T0-0.5],[s1+1.2,T0+DT+1.8],[s0-1.2,T0+DT+1.8]], ringT=[[s0-1.2,T0-0.5],[s1+1.2,T0-0.5],[s1+1.2,T0+DT+5],[s0-1.2,T0+DT+5]].map(q=>P(q[0],q[1]));
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const q of ringT.map(q=>P(q[0],q[1]))){ x0=Math.min(x0,q[0]); x1=Math.max(x1,q[0]); z0=Math.min(z0,q[1]); z1=Math.max(z1,q[1]); } TREE_EXCL.push([x0,x1,z0,z1]); W.GRASS_CLEAR=(W.GRASS_CLEAR||[]).concat([ring]);
  HX.ring=ring; HX.ok=true; }

/* ---- inside: built when you go in, removed by exitVilla ---- */
function hxEnter(from){ const F=hxFrame(); if(!F||!HX.ok) return; if(S.interior) exitVilla(); if(S.tour) stopTour();
  const a=F.a, fl=F.deckY, ceil=fl+3.6, S0=HXL.S0, S1=HXL.S1, tN=F.iN, tS=F.iS, D=tS-tN, P=(s,t)=>hxW(s,t), Q=(s,q)=>hxW(s,tN+q);
  const grp=new THREE.Group(); scene.add(grp); const R=rng(17);
  const corners=[P(S0,tN),P(S1,tN),P(S1,tS),P(S0,tS)]; let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const q of corners){ x0=Math.min(x0,q[0]); x1=Math.max(x1,q[0]); z0=Math.min(z0,q[1]); z1=Math.max(z1,q[1]); }
  const hb={id:'hotel-vincci',ring:corners,holesO:[],x0,x1,z0,z1,area:(S1-S0)*D,c:P((S0+S1)/2,(tN+tS)/2),top:ceil+0.4,floorY:fl,kind:'hotel',solid:false};
  const FT1=floorTexs('planks','#b48a5a'), FT2=floorTexs('concrete','#d6cdbf');
  const M={marble:IM({map:hxStone('#f1eee8','rgba(120,115,110,'),roughness:0.35}),oak:IM({map:FT1.map,roughnessMap:FXQ?FT1.rough:null,roughness:1}),tile:IM({map:hxTiles('#ddd5c8','rgba(120,110,95,0.45)',2),roughness:0.4}),
    wall:IM({map:plasterTex('#f2ede4'),roughness:0.95}),ceil:IM({color:'#f6f4ef',roughness:1}),corten:IM({map:hxCorten(),roughness:0.85,metalness:0.25}),wood:IM({map:woodTex('#6a4a30'),roughness:0.45}),wood2:IM({map:woodTex('#c49a6c'),roughness:0.5}),
    sofa:IM({map:fabricTex('#7f8f86'),roughness:1}),fab2:IM({map:fabricTex('#d8c7a8'),roughness:1}),leather:IM({color:'#5a3a26',roughness:0.55}),cloth:IM({map:fabricTex('#f7f5f0'),roughness:1}),black:IM({color:'#17181a',roughness:0.3}),
    steel:IM({color:'#c9cccf',roughness:0.3,metalness:0.85}),gold:IM({color:'#d4ad5a',roughness:0.25,metalness:1}),frame:IM({color:'#2b2d2f',roughness:0.4,metalness:0.6}),stone:IM({map:hxStone('#3b3a38','rgba(200,195,185,'),roughness:0.25}),
    glass:IM({color:'#e2edf2',transparent:true,opacity:0.1,roughness:0.03,metalness:0}),mirror:IM({color:'#ffffff',roughness:0.05,metalness:1}),leaf:IM({map:leafTex(),alphaTest:0.5,roughness:0.7}),pot:IM({color:'#e9e4da',roughness:0.4}),
    b1:IM({color:'#2f6b3a',transparent:true,opacity:0.85,roughness:0.1}),b2:IM({color:'#a8641e',transparent:true,opacity:0.85,roughness:0.1}),b3:IM({color:'#dfe9ec',transparent:true,opacity:0.6,roughness:0.05}),b4:IM({color:'#2b4f9a',transparent:true,opacity:0.85,roughness:0.1}),
    glow:GLOW(1,0.82,0.6),back:GLOW(1.25,0.95,0.62),art1:IM({map:paintingTex(3),roughness:0.6}),art2:IM({map:paintingTex(7),roughness:0.6}),art3:IM({map:paintingTex(11),roughness:0.6}),
    signV:IM({map:hxSign('vinI',[['VINCCI','800 92px Figtree, sans-serif','#f6f2ea',0.36],['VALDECAÑAS GOLF','600 46px Figtree, sans-serif','#e7c9a9',0.74]],{w:512,h:256,bg:'#2b2d2f'}),roughness:0.5}),
    signR:IM({map:hxSign('rib',[['Ribereño','italic 700 96px Georgia, serif','#3a2418',0.45],['RESTAURANTE','600 30px Figtree, sans-serif','#8a4a2a',0.82]],{w:512,h:224,bg:'#efe6d6'}),roughness:0.6}),
    signB:IM({map:hxSign('barI',[['BAR · SALÓN','700 54px Figtree, sans-serif','#f4efe6',0.5]],{w:512,h:96,bg:'#3a2418'}),roughness:0.5})};
  const G={}; for(const k in M) G[k]=new IB(k==='wall'?1/2.6:k==='tile'?0.6:1.2);
  const plats=[], FP=[]; const solid=(s,q,sx,sz,top,kind)=>{ const p=Q(s,q); const pl=addPlat(p[0],p[1],a,sx,sz,fl+top,top+0.05); pl.nostep=true; plats.push(pl); if(kind) FP.push({cx:p[0],cz:p[1],a,w:sx,d:sz,kind}); };
  const qd=(s0,q0,s1,q1,y,m,uvk)=>{ const A=Q(s0,q0), B=Q(s1,q0), C=Q(s1,q1), E=Q(s0,q1); const k=uvk||1; G[m].quad([A[0],y,A[1]],[B[0],y,B[1]],[C[0],y,C[1]],[E[0],y,E[1]],[0,y>fl+1?-1:1,0],[[s0/k,q0/k],[s1/k,q0/k],[s1/k,q1/k],[s0/k,q1/k]]); };
  // floors per zone, ceiling, a dark band of skirting
  qd(S0,0,HXL.rest1,D,fl,'tile',2.4); qd(HXL.rest1,0,HXL.bar1,D,fl,'oak',3.2); qd(HXL.bar1,0,S1,D,fl,'marble',2.4); qd(S0,0,S1,D,ceil,'ceil');
  // walls: (s0,q0)->(s1,q1) with the room on the left; holes = [[u0,u1,v0,v1]] along the wall
  const wall=(sA,qA,sB,qB,holes,mat)=>{ const A=Q(sA,qA), B=Q(sB,qB), Lw=Math.hypot(B[0]-A[0],B[1]-A[1]), ux=(B[0]-A[0])/Lw, uz=(B[1]-A[1])/Lw, Cm=Q((S0+S1)/2,D/2); let n=[-uz,0,ux]; if(n[0]*(Cm[0]-(A[0]+B[0])/2)+n[2]*(Cm[1]-(A[1]+B[1])/2)<0) n=[uz,0,-ux]; const m=mat||'wall';
    const Wq=(u0,u1,v0,v1)=>{ if(u1-u0<0.01||v1-v0<0.01) return; G[m].quad([A[0]+ux*u0,fl+v0,A[1]+uz*u0],[A[0]+ux*u1,fl+v0,A[1]+uz*u1],[A[0]+ux*u1,fl+v1,A[1]+uz*u1],[A[0]+ux*u0,fl+v1,A[1]+uz*u0],n,[[u0/2.6,v0/2.6],[u1/2.6,v0/2.6],[u1/2.6,v1/2.6],[u0/2.6,v1/2.6]]); };
    let cur=0; for(const h of (holes||[]).slice().sort((p,q)=>p[0]-q[0])){ Wq(cur,h[0],0,3.6); Wq(h[0],h[1],0,h[2]); Wq(h[0],h[1],h[3],3.6); cur=h[1]; } Wq(cur,Lw,0,3.6); return {A,B,ux,uz,n,L:Lw}; };
  // glazing: floor-to-ceiling glass with dark mullions every ~2.4 m
  const wins=[], opens=[]; const glaze=(sA,sB,qq,dir,door)=>{ const A=Q(sA,qq), B=Q(sB,qq); const Lg=Math.abs(sB-sA); const n=[F.v[0]*dir,0,F.v[1]*dir];
    G.glass.quad([A[0],fl+0.05,A[1]],[B[0],fl+0.05,B[1]],[B[0],fl+3.25,B[1]],[A[0],fl+3.25,A[1]],n);
    const nm=Math.max(1,Math.round(Lg/2.4)); for(let k=0;k<=nm;k++){ const s=sA+(sB-sA)*k/nm; const p=Q(s,qq); G.frame.bx(p[0],fl,p[1],0.07,3.3,0.12,a); }
    const m=Q((sA+sB)/2,qq); G.frame.bx(m[0],fl,m[1],Lg,0.08,0.12,a); G.frame.bx(m[0],fl+3.22,m[1],Lg,0.1,0.12,a); G.wall.bx(m[0],fl+3.32,m[1],Lg,0.28,0.2,a);
    wins.push({p0:A,p1:B,u0:0,u1:Math.hypot(B[0]-A[0],B[1]-A[1]),v0:fl+0.05,v1:fl+3.25,ty:1}); };
  // north wall: solid in the restaurant and bar, glass in the hall (the corten prism, transparent to the golf course), main door at doorN
  const dn=HXL.doorN; glaze(HXL.bar1+0.3,dn-1.4,0,1); glaze(dn+1.4,S1-0.3,0,1); { const p=Q(dn,0); G.frame.bx(p[0],fl,p[1],2.9,0.14,0.16,a); G.frame.bx(p[0],fl+2.6,p[1],2.9,1.0,0.16,a); G.corten.bx(p[0],fl+2.6,p[1],2.8,1.0,0.1,a); }
  wall(HXL.bar1,0,S0,0,[],'wall');
  // south wall: glass from end to end, the bar door at doorT
  const dt=HXL.doorT; glaze(S0+0.3,HXL.rest1-0.3,D,-1); glaze(HXL.rest1+0.3,dt-1.3,D,-1); glaze(dt+1.3,HXL.bar1-0.3,D,-1); glaze(HXL.bar1+0.3,S1-0.3,D,-1);
  { const p=Q(dt,D); G.frame.bx(p[0],fl+2.6,p[1],2.6,1.0,0.16,a); for(const ox of [-1.3,1.3]){ const q=Q(dt+ox,D); G.frame.bx(q[0],fl,q[1],0.1,2.6,0.16,a); } }
  for(const s of [HXL.rest1,HXL.bar1]){ const p=Q(s,D); G.wall.bx(p[0],fl,p[1],0.6,3.6,0.3,a); }
  // end walls: Ribereño sign on the west, the hotel's name on the corten wall behind the desk on the east
  wall(S0,D,S0,0,[],'wall'); wall(S1,0,S1,D,[],'corten');
  // partitions (with wide openings) between restaurant and bar, and bar and hall (corten-clad)
  const pieces=[], pdoors=[]; const part=(s,q0,q1,o0,o1,mat)=>{ for(const [a0,a1] of [[q0,o0],[o1,q1]]){ if(a1-a0<0.1) continue; const m=Q(s,(a0+a1)/2); G[mat].bx(m[0],fl,m[1],0.24,3.6,a1-a0,a); solid(s,(a0+a1)/2,0.24,a1-a0,3.6); pieces.push([Q(s,a0),Q(s,a1)]); } pdoors.push([Q(s,o0),Q(s,o1)]); };
  part(HXL.rest1,0,D,5.2,10.2,'wall'); part(HXL.bar1,0,D,3.6,11.6,'corten');
  // ---- hall: reception desk on the east wall, sofas by the glass, golf shop corner, the sign
  { const ds=S1-2.5, dq=D/2; const p=Q(ds,dq); G.wood2.bx(p[0],fl,p[1],0.8,1.08,5.2,a); G.stone.bx(p[0],fl+1.08,p[1],0.95,0.05,5.4,a); G.corten.bx(Q(ds-0.41,dq)[0],fl+0.1,Q(ds-0.41,dq)[1],0.03,0.9,5.0,a); solid(ds,dq,0.95,5.4,1.13,'mostrador');
    for(const oq of [-1.4,1.4]){ const s2=Q(ds+0.1,dq+oq); G.black.bx(s2[0],fl+1.13,s2[1],0.3,0.22,0.4,a); G.glow.bx(s2[0],fl+1.16,s2[1],0.31,0.16,0.36,a); }
    const sg=Q(S1-0.04,dq); G.signV.quad([sg[0]-F.v[0]*1.6,fl+1.7,sg[1]-F.v[1]*1.6],[sg[0]+F.v[0]*1.6,fl+1.7,sg[1]+F.v[1]*1.6],[sg[0]+F.v[0]*1.6,fl+3.3,sg[1]+F.v[1]*1.6],[sg[0]-F.v[0]*1.6,fl+3.3,sg[1]-F.v[1]*1.6],[-F.u[0],0,-F.u[1]]);
    HX.desk={s:ds,q:dq}; }
  const sofa=(s,q,yaw,mat)=>{ const p=Q(s,q), ca=Math.cos(yaw), sa=Math.sin(yaw); G[mat].rb(p[0],fl+0.18,p[1],0.9,0.27,2.1,0.06,yaw); G[mat].rb(p[0]-ca*0.38,fl+0.18,p[1]-sa*0.38,0.2,0.62,2.1,0.06,yaw); for(const o of [-1,1]) G[mat].rb(p[0]+sa*o*0.98,fl+0.18,p[1]-ca*o*0.98,0.9,0.46,0.16,0.05,yaw); G.black.bx(p[0],fl,p[1],0.8,0.18,1.9,yaw);
    const pl=addPlat(p[0],p[1],yaw,0.95,2.2,fl+0.65,0.7); pl.nostep=true; plats.push(pl); FP.push({cx:p[0],cz:p[1],a:yaw,w:0.95,d:2.2,kind:'sofá'}); };
  const armchair=(s,q,yaw,mat)=>{ const p=Q(s,q), ca=Math.cos(yaw), sa=Math.sin(yaw); G[mat].rb(p[0],fl+0.2,p[1],0.8,0.26,0.8,0.06,yaw); G[mat].rb(p[0]-ca*0.33,fl+0.2,p[1]-sa*0.33,0.16,0.6,0.8,0.06,yaw); for(const o of [-1,1]) G[mat].rb(p[0]+sa*o*0.36,fl+0.2,p[1]-ca*o*0.36,0.74,0.42,0.12,0.04,yaw); G.wood.bx(p[0],fl,p[1],0.7,0.2,0.7,yaw);
    const pl=addPlat(p[0],p[1],yaw,0.8,0.8,fl+0.6,0.65); pl.nostep=true; plats.push(pl); FP.push({cx:p[0],cz:p[1],a:yaw,w:0.8,d:0.8,kind:'sillón'}); };
  const lowTable=(s,q,w,d)=>{ const p=Q(s,q); G.wood.bx(p[0],fl+0.36,p[1],w,0.06,d,a); for(const [ox,oz] of [[w/2-0.06,d/2-0.06],[-w/2+0.06,d/2-0.06],[w/2-0.06,-d/2+0.06],[-w/2+0.06,-d/2+0.06]]){ const c=Q(s+ox,q+oz); G.black.bx(c[0],fl,c[1],0.05,0.36,0.05,a); } solid(s,q,w,d,0.42,'mesa baja'); };
  const lamp=(s,q)=>{ const p=Q(s,q); G.black.cy(p[0],fl,p[1],0.15,0.03); G.black.cy(p[0],fl,p[1],0.015,1.45); G.fab2.cy(p[0],fl+1.42,p[1],0.2,0.3); G.glow.cy(p[0],fl+1.43,p[1],0.17,0.02); };
  const plant=(s,q,h)=>{ const p=Q(s,q); G.pot.cy(p[0],fl,p[1],0.28,0.55); for(let k=0;k<4;k++) G.leaf.cards(p[0]+Math.cos(k*1.7)*0.15,fl+0.55+h*0.5+(k%2)*0.2,p[1]+Math.sin(k*1.7)*0.15,0.45,h*0.5,k*0.8); solid(s,q,0.56,0.56,0.55); };
  const ang=(ds,dq)=>{ const wx=F.u[0]*ds+F.v[0]*dq, wz=F.u[1]*ds+F.v[1]*dq; return Math.atan2(wz,wx); }; // world yaw of a local direction
  { // two sofas face to face across a low table, by the south glass of the hall, with floor lamps (the "living room" of the photos)
    const sc=10.5, sq=D-3.6; sofa(sc-2.1,sq,ang(1,0),'sofa'); sofa(sc+2.1,sq,ang(-1,0),'sofa'); lowTable(sc,sq,1.2,0.8); lamp(sc-2.6,sq-1.5); lamp(sc+2.6,sq+1.5); }
  { // golf shop corner: shelves with polos, golf bags on a stand
    const gs=6.0, gq=1.0; const p=Q(gs,gq); G.wood2.bx(p[0],fl,p[1],2.6,2.0,0.45,a); for(const h of [0.5,1.0,1.5]){ G.wood.bx(p[0],fl+h,p[1],2.5,0.04,0.42,a); for(let k=0;k<6;k++){ const c=Q(gs-1.05+k*0.42,gq+0.02); G[['sofa','fab2','cloth','leather','sofa','fab2'][k]].bx(c[0],fl+h+0.04,c[1],0.32,0.12,0.3,a); } }
    solid(gs,gq,2.6,0.5,2.0,'tienda de golf'); for(let k=0;k<3;k++){ const c=Q(gs-1.0+k*1.0,gq+1.0); G.black.cy(c[0],fl,c[1],0.13,0.9); G.fab2.cy(c[0],fl+0.2,c[1],0.135,0.25); G.steel.cy(c[0],fl+0.9,c[1],0.08,0.25); } solid(gs,gq+1.0,2.6,0.4,1.1); }
  plant(S1-0.6,0.7,1.6); plant(S1-0.6,D-0.7,1.6); plant(HXL.bar1+0.7,D-0.8,1.4);
  // ---- bar: long counter parallel to the north wall, back bar with backlit bottles and a mirror, stools, pendant lamps, lounge by the glass
  const b0=HXL.rest1+1.5, b1=HXL.bar1-2.0, bq=3.3, bm=(b0+b1)/2, bl=b1-b0;
  { const p=Q(bm,bq); G.wood2.bx(p[0],fl,p[1],bl,1.05,0.6,a); G.corten.bx(Q(bm,bq+0.31)[0],fl+0.12,Q(bm,bq+0.31)[1],bl,0.16,0.02,a); G.marble.bx(Q(bm,bq-0.08)[0],fl+1.05,Q(bm,bq-0.08)[1],bl+0.2,0.06,0.8,a); G.gold.bx(Q(bm,bq+0.36)[0],fl+0.18,Q(bm,bq+0.36)[1],bl,0.04,0.04,a);
    G.back.bx(Q(bm,bq+0.31)[0],fl+0.95,Q(bm,bq+0.31)[1],bl,0.03,0.02,a); solid(bm,bq-0.05,bl+0.2,0.85,1.11,'barra');
    // back bar
    const bb=Q(bm,0.35); G.wood.bx(bb[0],fl,bb[1],bl,0.95,0.6,a); G.stone.bx(bb[0],fl+0.95,bb[1],bl,0.04,0.62,a); G.mirror.quad([Q(b0,0.03)[0],fl+1.3,Q(b0,0.03)[1]],[Q(b1,0.03)[0],fl+1.3,Q(b1,0.03)[1]],[Q(b1,0.03)[0],fl+2.9,Q(b1,0.03)[1]],[Q(b0,0.03)[0],fl+2.9,Q(b0,0.03)[1]],[F.v[0],0,F.v[1]]);
    solid(bm,0.35,bl,0.7,2.9,'botellero');
    for(const h of [1.35,1.85,2.35]){ const sh=Q(bm,0.2); G.glass.bx(sh[0],fl+h,sh[1],bl,0.03,0.32,a); G.back.bx(Q(bm,0.06)[0],fl+h+0.02,Q(bm,0.06)[1],bl,0.02,0.02,a);
      for(let s=b0+0.2;s<b1-0.1;s+=0.19){ const c=Q(s+R()*0.05,0.2), k=(R()*4)|0, bh=0.22+R()*0.12, br=0.035+R()*0.012; const m=['b1','b2','b3','b4'][k]; G[m].cy(c[0],fl+h+0.03,c[1],br,bh); G[m].cy(c[0],fl+h+0.03+bh,c[1],0.012,0.09); } }
    // stools and pendants
    for(let s=b0+0.6;s<=b1-0.5;s+=1.05){ const c=Q(s,bq+0.85); G.steel.cy(c[0],fl,c[1],0.2,0.03); G.steel.cy(c[0],fl,c[1],0.025,0.72); G.leather.cy(c[0],fl+0.72,c[1],0.19,0.07); solid(s,bq+0.85,0.4,0.4,0.79); }
    for(let s=b0+0.8;s<=b1-0.6;s+=1.6){ const c=Q(s,bq); G.black.cy(c[0],fl+2.95,c[1],0.006,0.65); G.gold.cone(c[0],fl+2.78,c[1],0.13,0.18); G.glow.sp(c[0],fl+2.8,c[1],0.06,0.04,0.06); }
    const sg=Q(bm,0.02); G.signB.quad([sg[0]-F.u[0]*1.3,fl+3.0,sg[1]-F.u[1]*1.3],[sg[0]+F.u[0]*1.3,fl+3.0,sg[1]+F.u[1]*1.3],[sg[0]+F.u[0]*1.3,fl+3.45,sg[1]+F.u[1]*1.3],[sg[0]-F.u[0]*1.3,fl+3.45,sg[1]-F.u[1]*1.3],[F.v[0],0,F.v[1]]);
    HX.bar={b0,b1,bq}; }
  // lounge: armchairs around low tables by the glass, leaving the door to the terrace free
  for(const ls of [HXL.rest1+2.6,dt-3.4,dt+3.4]){ const lq=D-2.4; lowTable(ls,lq,0.8,0.8); armchair(ls-1.0,lq,ang(1,0),'leather'); armchair(ls+1.0,lq,ang(-1,0),'leather'); }
  // art on the walls
  for(const [s,q,m] of [[HXL.rest1-0.14,2.0,'art1'],[HXL.bar1-0.14,1.8,'art2']]){ const c=Q(s,q); const half=0.8; G[m].quad([c[0]-F.v[0]*half,fl+1.4,c[1]-F.v[1]*half],[c[0]+F.v[0]*half,fl+1.4,c[1]+F.v[1]*half],[c[0]+F.v[0]*half,fl+2.5,c[1]+F.v[1]*half],[c[0]-F.v[0]*half,fl+2.5,c[1]-F.v[1]*half],[-F.u[0],0,-F.u[1]]); }
  // ---- Ribereño: tables with white cloths, a sideboard, the sign on the west wall, ceiling lights
  HX.rtab=[]; for(const s of [S0+3.2,S0+7.4,S0+11.6]) for(const q of [4.0,7.8,11.6]){ if(q>D-2.2) continue; const p=Q(s,q); G.cloth.bx(p[0],fl+0.5,p[1],1.05,0.27,1.05,a); G.cloth.bx(p[0],fl+0.76,p[1],1.0,0.02,1.0,a); G.black.cy(p[0],fl,p[1],0.05,0.5);
    for(const [ox,oz] of [[0.5,0.18],[0.5,-0.18],[-0.5,0.18],[-0.5,-0.18]]){ const g2=Q(s+ox*0.6,q+oz); G.glass.cy(g2[0],fl+0.78,g2[1],0.03,0.12); }
    for(const k of [0,1,2,3]){ const da=k*Math.PI/2, dx=Math.cos(da)*0.75, dz=Math.sin(da)*0.75; const c=Q(s+dx,q+dz), yaw=ang(-dx,-dz), ca=Math.cos(yaw), sa=Math.sin(yaw);
      G.wood2.rb(c[0],fl+0.42,c[1],0.44,0.05,0.44,0.02,yaw); G.wood2.rb(c[0]-ca*0.2,fl+0.45,c[1]-sa*0.2,0.04,0.5,0.42,0.02,yaw); for(const [lx,lz] of [[0.18,0.18],[0.18,-0.18],[-0.18,0.18],[-0.18,-0.18]]) G.wood.cy(c[0]+ca*lx-sa*lz,fl,c[1]+sa*lx+ca*lz,0.018,0.42);
      if(k===0) HX.rtab.push({s,q,c,yaw}); }
    solid(s,q,2.3,2.3,0.8,'mesa'); G.glow.cy(Q(s,q)[0],ceil-0.04,Q(s,q)[1],0.28,0.03); }
  { const p=Q(S0+7.4,0.35); G.wood.bx(p[0],fl,p[1],4.6,0.9,0.55,a); G.stone.bx(p[0],fl+0.9,p[1],4.7,0.04,0.6,a); solid(S0+7.4,0.35,4.7,0.6,0.94,'aparador'); for(let k=0;k<5;k++){ const c=Q(S0+5.6+k*0.9,0.35); G.steel.cy(c[0],fl+0.94,c[1],0.17,0.12); }
    const sg=Q(S0+0.04,D/2); G.signR.quad([sg[0]+F.v[0]*1.4,fl+1.5,sg[1]+F.v[1]*1.4],[sg[0]-F.v[0]*1.4,fl+1.5,sg[1]-F.v[1]*1.4],[sg[0]-F.v[0]*1.4,fl+2.75,sg[1]-F.v[1]*1.4],[sg[0]+F.v[0]*1.4,fl+2.75,sg[1]+F.v[1]*1.4],[F.u[0],0,F.u[1]]);
    plant(S0+0.6,0.7,1.5); plant(S0+0.6,D-0.7,1.5); }
  for(const k in G){ const m=G[k].mesh(M[k],grp,k!=='glass'&&k!=='glow'&&k!=='back'&&k!=='mirror'); if(m&&k==='glass') m.renderOrder=2; }
  // ---- people: the barman, the receptionist and two diners
  const npc=[]; const mk=(sk,s,q,yaw,pose,kind)=>{ const Rg=buildRig(sk); const p=Q(s,q); Rg.root.position.set(p[0],fl,p[1]); Rg.root.rotation.set(0,-yaw,0); poseRig(Rg,pose,0,0); grp.add(Rg.root); const o={R:Rg,kind,s,q,yaw,pose,ph:R()*6}; npc.push(o); return o; };
  HX.barman=mk({shirt:'#f4f2ec',pants:'#1c1d20',hair:'#2a211a',skin:'#e0ac86',shoe:'#151617',cap:null,pack:null},bm,1.75,ang(0,1),'idle','barman'); HX.barman.ts=bm;
  mk({shirt:'#2b3a55',pants:'#2b3a55',hair:'#6b4a2e',skin:'#f1c7a5',shoe:'#151617',cap:null,pack:null,long:true},S1-1.3,D/2,ang(-1,0),'idle','recep');
  if(HX.rtab.length>4){ const t1=HX.rtab[4]; for(const k of [0,2]){ const da=k*Math.PI/2, dx=Math.cos(da)*0.75, dz=Math.sin(da)*0.75; const o=mk(k?{shirt:'#e7c9a9',pants:'#3a2a1c',hair:'#d9c27a',skin:'#f1c7a5',shoe:'#6b4a2e',cap:null,pack:null,long:true}:{shirt:'#4c8a3a',pants:'#2b3a55',hair:'#2a211a',skin:'#c99673',shoe:'#151617',cap:null,pack:null},t1.s+dx,t1.q+dz,ang(-dx,-dz),'drive','diner'); o.R.root.position.y=fl-0.1; } }
  HX.inNpc=npc;
  // ---- the villa interior machinery: lights, plan, tour, collisions
  const lp=[Q(bm-2.5,bq),Q(bm+2.5,bq),Q(S1-5,D/2),Q(S0+7.4,7.8)];
  intLights.forEach((l,i)=>{ const p=lp[i]; l.userData.on=true; l.intensity=0; l.distance=18; l.position.set(p[0],ceil-0.5,p[1]); });
  const wl=[Q(dt,D-1.2),Q(S0+7,D-1.2)]; winLights.forEach((l,i)=>{ l.userData.on=FXQ>0; l.intensity=0; l.position.set(wl[i][0],fl+1.6,wl[i][1]); });
  fireLight.userData.on=false; fireLight.intensity=0; for(const l of ROOMLIGHTS) if(FXQ||!winLights.includes(l)) scene.add(l);
  const zone=s=>s<HXL.rest1?2:s<HXL.bar1?1:0;
  const rooms=[{id:0,name:'Recepción',area:(S1-HXL.bar1)*D},{id:1,name:'Bar y salón',area:(HXL.bar1-HXL.rest1)*D},{id:2,name:'Restaurante '+WP.hotel.rest,area:(HXL.rest1-S0)*D}];
  const plan={rooms,pieces,doors:pdoors,roomAt:(x,z)=>zone(hxL(x,z)[0])};
  const cs=0.4, nx=Math.ceil((x1-x0)/cs)+1, nz=Math.ceil((z1-z0)/cs)+1, walk=new Uint8Array(nx*nz);
  for(let j=0;j<nz;j++) for(let i=0;i<nx;i++){ const x=x0+i*cs, z=z0+j*cs; const l=hxL(x,z); if(l[0]<S0+0.4||l[0]>S1-0.4||l[1]<tN+0.4||l[1]>tS-0.4) continue; if(plats.some(p=>insidePlat(p,x,z,0.35))) continue; walk[j*nx+i]=1; }
  const vw=(s,q,ds,dq,room)=>{ const p=Q(s,q); return {x:p[0],z:p[1],yaw:ang(ds,dq),room}; };
  const views=[vw(12.5,6.5,1,0,'Recepción'),vw(bm,bq+2.3,0,-1,'Bar y salón'),vw(S0+9.5,D-2.0,-1,-0.4,rooms[2].name),vw(dt,D-1.0,0,1,'Bar y salón')];
  const dN=HX.doorN, dT=HX.doorT; const doors={N:{x:dN.x,z:dN.z,nx:-F.v[0],nz:-F.v[1],inS:HXL.doorN,inQ:1.3},T:{x:dT.x,z:dT.z,nx:F.v[0],nz:F.v[1],inS:HXL.doorT,inQ:D-1.3}};
  S.interior={b:hb,hotel:true,skip:F.parts,th:{n:'Vincci Valdecañas Golf',fc:'#d9cbb5'},grp,plats,floor:fl,ceil,door:doors[from==='T'?'T':'N'],doors,mats:M,plan,wins,opens,shaft:null,FP,views,grid:{nx,nz,cs,x0,z0,walk},meshes:[],env:null,envT:FXQ?3:0,envP:[...Q(bm,D*0.6),fl+1.45].map((v,i,a)=>i===1?a[2]:i===2?a[1]:v),fire:false,t:0,dGlass:true};
  for(const m of BLDMESH.concat(BLDHIDE)) if(m) m.visible=false;
  Object.assign(sun.shadow,{bias:-0.00012,normalBias:0.015}); Object.assign(sun.shadow.camera,{near:420,far:580}); sun.shadow.camera.updateProjectionMatrix();
  updateTOD();
  // the glass on the counter waits there if you left it
  if(HX.glass&&HX.order==='ready'&&!HX.carry) hxGlassOnCounter(HX.order_s||bm);
}
function hxLeft(){ for(const m of BLDMESH.concat(BLDHIDE)) if(m) m.visible=true; for(const l of intLights) l.distance=11; HX.inNpc=[]; HX.barman=null; if(HX.order==='prep'){ HX.order=null; hxDropGlass(); } if(HX.order==='ready'&&!HX.carry){ HX.order=null; hxDropGlass(); } }
function hxGo(from){ closeModal(); hideMap(); fadeTo(()=>{ if(S.mode==='menu'||S.mode==='drone'){ plane.visible=false; glider.visible=false; rig.root.visible=true; S.landedOnce=true; }
    if(P.buggy) exitBuggy(); if(S.mode==='ride') dismountHorse(); if(S.mode==='jet') dismountJet(); if(KART.on) kartEnd('Has dejado la carrera'); if(S.mode!=='walk') setMode('walk');
    hxEnter(from||'N'); hxPlaceIn(from||'N'); tip('Hotel '+(S.interior?S.interior.th.n:'')+' · recepción, bar y restaurante '+WP.hotel.rest+'. Pide algo en la barra y sal a la terraza',5200); }); }
function hxPlaceIn(from){ const I=S.interior; if(!I||!I.hotel) return; const d=I.doors[from==='T'?'T':'N']; const p=hxW(d.inS,HX.F.iN+d.inQ); P.x=p[0]; P.z=p[1]; P.y=I.floor; P.vx=P.vy=P.vz=0; P.swim=false; P.onGround=true; P.yaw=Math.atan2(-d.nz,-d.nx); camS.yaw=P.yaw; camS.pitch=0.06; setFP(store.get('vg_fp')!=='0'); I.door=d; }
function hxEnterDoor(from){ blip('door'); fadeTo(()=>{ hxEnter(from); hxPlaceIn(from); tip(from==='T'?'Bar y salón: la barra está al fondo. Pide algo y vuelve a la terraza':'Recepción del hotel. El bar está a la derecha y el restaurante '+WP.hotel.rest+' al fondo',4200); }); }

/* ---- the order: counter, barman, glass ---- */
function hxNearCounter(){ const B=HX.bar; if(!B||!S.interior||!S.interior.hotel) return null; const l=hxL(P.x,P.z), q=l[1]-HX.F.iN; if(l[0]<B.b0-0.3||l[0]>B.b1+0.3||q<B.bq+0.3||q>B.bq+2.4) return null; return Math.max(B.b0+0.4,Math.min(B.b1-0.4,l[0])); }
function hxSheet(){ const B=$('hotelBody'); let h='<h2>Barra del bar</h2><p>Elige y el camarero te lo prepara. Luego llévatelo a la terraza para verlo con el atardecer sobre el embalse.</p><div class="drinks">';
  for(const k in HX_DRINKS){ const d=HX_DRINKS[k]; h+='<button class="btn drink" data-d="'+k+'"><b>'+d.n+'</b><span>'+d.d+'</span></button>'; } h+='</div><div class="row"><button class="btn small" id="hotelClose">Ahora no</button></div>';
  B.innerHTML=h; $('hotelSheet').hidden=false; B.querySelectorAll('button[data-d]').forEach(b=>b.onclick=()=>{ $('hotelSheet').hidden=true; hxOrder(b.dataset.d); }); $('hotelClose').onclick=()=>{ $('hotelSheet').hidden=true; }; }
function hxOrder(kind){ const s=hxNearCounter(); if(s===null||!HX.barman) return false; hxDropGlass(); HX.drink=kind; HX.order='prep'; HX.order_s=s; HX.ot=0; HX.lev=1; ensureAudio();
  const bm=HX.barman; bm.from=bm.ts; bm.to=s; tip('Un '+HX_DRINKS[kind].n.toLowerCase()+', marchando',2200); return true; }
function hxGlassOnCounter(s){ const I=S.interior; if(!I||!HX.drink) return; if(!HX.glass) HX.glass=hxDrinkMesh(HX.drink); hxSetLevel(HX.lev); const p=hxW(s,HX.F.iN+HX.bar.bq+0.18); if(HX.glass.parent) HX.glass.parent.remove(HX.glass); I.grp.add(HX.glass); HX.glass.position.set(p[0],I.floor+1.11,p[1]); HX.glass.rotation.set(0,0,0); HX.glass.scale.setScalar(1); }
function hxTake(){ if(HX.order!=='ready'||!HX.glass) return; if(HX.glass.parent) HX.glass.parent.remove(HX.glass); rig.aR.el.add(HX.glass); HX.glass.position.set(0.02,-0.36,0.04); HX.glass.rotation.set(0,0,0); HX.glass.scale.setScalar(1.35); HX.carry=true; HX.order='carry'; blip('cup');
  tip('Llévatelo a la terraza: sal por la puerta de cristal o pulsa «Sentarte en la terraza»',4200); }
function hxBarmanTick(dt,T){ const bm=HX.barman; if(!bm) return; const R=bm.R, F=HX.F, I=S.interior; const yawN=Math.atan2(-F.v[1],-F.v[0]), yawS=Math.atan2(F.v[1],F.v[0]);
  let pose='idle', yaw=yawS, k=0, arm=0; if(HX.order==='prep'){ HX.ot+=dt; const d=Math.abs(bm.to-bm.from), tw=d/1.5; const t=HX.ot;
    if(t<tw){ const f=t/tw; bm.ts=bm.from+(bm.to-bm.from)*f; pose='run'; k=0.25; yaw=bm.to>bm.from?F.a:F.a+Math.PI; }
    else if(t<tw+1.1){ bm.ts=bm.to; yaw=yawN; arm=Math.sin(Math.min(1,(t-tw)/0.5)*Math.PI/2); }
    else if(t<tw+3.0){ bm.ts=bm.to; yaw=yawS; arm=0.6; if(!HX.glass){ HX.glass=hxDrinkMesh(HX.drink); } hxGlassOnCounter(bm.to); hxSetLevel(Math.min(1,(t-tw-1.1)/1.6)); }
    else { HX.order='ready'; hxSetLevel(1); blip('cup'); tip('Aquí tiene '+HX_DRINKS[HX.drink].art+'. ¡Que aproveche! (pulsa «Coger la bebida»)',4200); } }
  else if(HX.order!=='ready'&&Math.abs(bm.ts-(HX.bar.b0+HX.bar.b1)/2)>0.2){ const mid=(HX.bar.b0+HX.bar.b1)/2; const st=Math.sign(mid-bm.ts)*Math.min(Math.abs(mid-bm.ts),dt*1.2); bm.ts+=st; pose='run'; k=0.2; yaw=st>0?F.a:F.a+Math.PI; }
  const p=hxW(bm.ts,F.iN+1.75); R.root.position.set(p[0],I.floor,p[1]); R.root.rotation.set(0,-yaw,0); poseRig(R,pose,pose==='run'?T*7:T+bm.ph,k);
  if(arm>0){ R.aR.sg.rotation.z=1.1*arm; R.aR.el.rotation.z=0.6*arm; } else if(pose==='idle'){ R.aR.sg.rotation.z=0.35+Math.sin(T*1.6)*0.08; R.aR.el.rotation.z=1.0; } }

/* ---- sitting on the terrace at sunset ---- */
function hxOnDeck(){ if(!HX.deck||S.interior) return false; return insidePlat(HX.deck,P.x,P.z,0.2)&&Math.abs(P.y-HX.deck.top)<0.6; }
function hxSeatNear(r){ let best=null, bd=r||1.6; for(const s of HX.seats){ if(s.busy) continue; const d=Math.hypot(P.x-s.x,P.z-s.z); if(d<bd){ bd=d; best=s; } } return best; }
function hxBestSeat(){ // the free chair that looks most into the sunset, and nearest to the bar door
  const sd=dirFromElAz(TOD_PRESETS.puesta[0],TOD_PRESETS.puesta[1]); let best=null, bs=-1e9; for(const s of HX.seats){ if(s.busy) continue; const f=Math.cos(s.yaw)*sd.x+Math.sin(s.yaw)*sd.z; const sc=f*3-Math.hypot(s.x-HX.doorT.x,s.z-HX.doorT.z)*0.05; if(sc>bs){ bs=sc; best=s; } } return best; }
function hxSit(seat){ if(!seat) return; HX.sit=seat; P.x=seat.x; P.z=seat.z; P.y=HX.deckY; P.vx=P.vy=P.vz=0; P.yaw=seat.yaw; camS.yaw=seat.yaw; camS.pitch=0.16; camS.dist=4.2; S.snap=true;
  if(TOD.mode!=='puesta'){ HX.todPrev=TOD.mode; setTOD('puesta'); } $('hotelSeat').hidden=false; hxSeatUI();
  tip(HX.glass?'Atardecer sobre el embalse desde la terraza del '+WP.hotel.name+'. Pulsa Beber de vez en cuando':'Atardecer en la terraza. Pide algo en la barra del bar y tráetelo',4600); }
function hxSitFromInside(){ const seat=hxBestSeat(); if(!seat) return; blip('door'); fadeTo(()=>{ const I=S.interior; if(I){ I.door=I.doors.T; exitVilla(); } hxSit(seat); }); }
function hxStand(){ const s=HX.sit; if(!s) return; HX.sit=null; $('hotelSeat').hidden=true; P.x=s.x-Math.cos(s.yaw)*0.55; P.z=s.z-Math.sin(s.yaw)*0.55; P.y=HX.deckY; P.vx=P.vz=0;
  if(HX.todPrev){ setTOD(HX.todPrev); HX.todPrev=null; } if(HX.glass&&HX.lev<=0.03){ hxDropGlass(); HX.order=null; } }
function hxSip(){ if(!HX.sit||!HX.glass||HX.sip>0||HX.lev<=0.03) return; HX.sip=1.8; }
function hxSeatUI(){ const b=$('hotelSip'); if(!b) return; b.hidden=!(HX.glass&&HX.lev>0.03); $('hotelSeatTxt').textContent=HX.glass?(HX.lev>0.03?HX_DRINKS[HX.drink].n+' · queda '+Math.round(HX.lev*100)+' %':'Vaso vacío: pide otro en la barra'):'Sin bebida: pídela en la barra del bar'; }

/* ---- actions (called from computeAction / doAction) ---- */
function hxActIn(){ const I=S.interior; if(!I||!I.hotel) return null; const l=hxL(P.x,P.z), q=l[1]-HX.F.iN, D=HX.F.iS-HX.F.iN;
  if(Math.abs(l[0]-HXL.doorT)<1.6&&q>D-2.2){ I.door=I.doors.T; return {k:'exitHouse',label:'Salir a la terraza'}; }
  if(Math.abs(l[0]-HXL.doorN)<1.6&&q<2.2){ I.door=I.doors.N; return {k:'exitHouse',label:'Salir'}; }
  if(HX.order==='ready'&&hxNearCounter()!==null) return {k:'hxTake',label:'Coger la bebida'};
  if(HX.carry) return {k:'hxSitIn',label:'Sentarte en la terraza'};
  if(hxNearCounter()!==null) return HX.order==='prep'?{k:'hxWait',label:'Esperando la bebida…'}:{k:'hxBar',label:'Pedir en la barra'};
  if(HX.desk&&Math.hypot(l[0]-(HX.desk.s-0.9),q-HX.desk.q)<2.6) return {k:'hxDesk',label:'Preguntar en recepción'};
  const dn=Math.hypot(l[0]-HXL.doorN,q), dtt=Math.hypot(l[0]-HXL.doorT,q-D); I.door=dn<dtt?I.doors.N:I.doors.T; return {k:'exitHouse',label:'Salir'}; }
function hxActOut(){ if(!HX.ok) return null; if(HX.sit) return {k:'hxStand',label:'Levantarte'};
  if(Math.hypot(P.x-HX.doorT.x,P.z-HX.doorT.z)<2.4) return {k:'hxEnterT',label:'Entrar al bar'};
  if(HX.doorN&&Math.hypot(P.x-HX.doorN.x,P.z-HX.doorN.z)<3.2) return {k:'hxEnterN',label:'Entrar en el hotel'};
  if(hxOnDeck()){ const s=hxSeatNear(1.7); if(s) return {k:'hxSit',label:'Sentarte',ref:s}; } return null; }
function hxDo(k,ref){ if(k==='hxBar') hxSheet(); else if(k==='hxTake') hxTake(); else if(k==='hxSitIn') hxSitFromInside(); else if(k==='hxStand') hxStand(); else if(k==='hxEnterT') hxEnterDoor('T'); else if(k==='hxEnterN') hxEnterDoor('N'); else if(k==='hxSit') hxSit(ref);
  else if(k==='hxDesk'){ blip('cup'); toast('Bienvenido al '+WP.hotel.name,'Hotel de cuatro estrellas con 80 habitaciones, restaurante '+WP.hotel.rest+' y bar con terraza al embalse. La casa club del golf está aquí mismo.'); } }

/* ---- every frame ---- */
function hxTick(dt,T){ if(!HX.ok) return; HX.t+=dt; const n=TOD.night, ev=Math.max(n,TOD.mode==='puesta'?0.6:0); if(HX.glow){ const k=0.35+2.8*ev; HX.glow.color.setRGB(1.6*k/2,1.2*k/2,0.7*k/2); HX.bulb.color.setRGB(0.5+2.2*ev,0.45+1.8*ev,0.3+1.1*ev); }
  for(const o of HX.npc){ const R=o.R; poseRig(R,'drive',T+o.ph,0); R.aR.sg.rotation.z=1.0+Math.sin(T*0.9+o.ph)*0.25; R.headG.rotation.y=Math.sin(T*0.5+o.ph)*0.35; }
  const I=S.interior; if(I&&I.hotel){ for(const l of intLights) if(l.userData.on) l.intensity=FXQ?1.9:1.1; hxBarmanTick(dt,T); for(const o of HX.inNpc){ if(o.kind==='barman') continue; if(o.kind==='recep'){ poseRig(o.R,'idle',T+o.ph,0); o.R.headG.rotation.y=Math.sin(T*0.4+o.ph)*0.4; } else { poseRig(o.R,'drive',T+o.ph,0); o.R.aL.sg.rotation.z=0.9+Math.sin(T*1.3+o.ph)*0.2; } } }
  if(HX.carry&&!(S.mode==='walk')){ hxDropGlass(); HX.order=null; }
  if(!rig) return; const R=rig;
  if(HX.sit){ const s=HX.sit; if(S.mode!=='walk'||S.interior){ HX.sit=null; $('hotelSeat').hidden=true; return; }
    if(Math.hypot(inp.mx,inp.my)>0.35||inp.jumpQ){ inp.jumpQ=false; hxStand(); return; }
    P.x=s.x; P.z=s.z; P.y=HX.deckY; P.vx=P.vy=P.vz=0; P.onGround=true; P.yaw=s.yaw; P.anim='drive'; P.animK=0;
    poseRig(R,'drive',T,0); R.root.position.set(s.x,HX.deckY-0.1,s.z); R.root.rotation.set(0,-s.yaw,0); R.aL.sg.rotation.z=0.75; R.aL.el.rotation.z=0.9;
    let up=0; if(HX.sip>0){ HX.sip-=dt; const ph=1-HX.sip/1.8; up=Math.sin(Math.min(1,ph*1.6)*Math.PI); if(HX.sip<=0){ hxSetLevel(Math.max(0,HX.lev-0.25)); hxSeatUI(); if(HX.lev<=0.03) tip('Te has terminado '+HX_DRINKS[HX.drink].art+'. Puedes pedir otro en la barra',3500); } }
    R.aR.sg.rotation.z=0.75+1.1*up; R.aR.el.rotation.z=0.9+1.0*up; R.aR.sg.rotation.x=-0.25*up; R.headG.rotation.z=0.25*up;
    if(HX.glass){ if(HX.glass.parent!==R.aR.el){ if(HX.glass.parent) HX.glass.parent.remove(HX.glass); R.aR.el.add(HX.glass); HX.glass.position.set(0.02,-0.36,0.04); HX.glass.scale.setScalar(1.35); } HX.glass.rotation.set(0,0,-(R.aR.sg.rotation.z+R.aR.el.rotation.z)); }
    return; }
  if(HX.carry&&HX.glass&&S.mode==='walk'){ R.aR.sg.rotation.z=0.35; R.aR.el.rotation.z=1.15; R.aR.sg.rotation.x=0; HX.glass.rotation.set(0,0,-(0.35+1.15)); } }

/* ---- map ---- */
function hxDrawMap(g,m2c,s,big){ if(!HX.ok||!HX.ring) return; g.save(); g.beginPath(); HX.ring.forEach((p,i)=>{ const [x,y]=m2c(p[0],p[1]); i?g.lineTo(x,y):g.moveTo(x,y); }); g.closePath(); g.fillStyle='rgba(217,205,182,0.85)'; g.fill();
  const r=(big?5:3.2)*s; for(const d of [HX.doorT,HX.doorN]){ if(!d) continue; const [x,y]=m2c(d.x,d.z); g.fillStyle='#7b3f9e'; g.strokeStyle='#fff'; g.lineWidth=1.3*s; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); g.stroke(); }
  if(big){ const [x,y]=m2c(HX.doorT.x,HX.doorT.z); g.font='800 '+(7.5*s)+'px Figtree, sans-serif'; g.fillStyle='#3a1f4d'; g.textAlign='left'; g.fillText('Bar y terraza',x+r+3*s,y+3*s); } g.restore(); }
function hxLegend(){ if(!HX.ok) return ''; return '<div><i class="dot" style="background:#7b3f9e;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></i>Hotel: puerta principal (norte) y del bar a la terraza (sur)</div><div><i style="background:#d9cdb6"></i>Terraza del bar, con mesas y sombrillas</div>'; }
$('hotelSip').onclick=()=>{ hxSip(); }; $('hotelUp').onclick=()=>{ hxStand(); };
