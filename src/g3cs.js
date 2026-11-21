/* ================= C1 · Nuestra casa (CB26) por dentro (solo Valdecañas, WP.casa) ================= */
/* The family villa: «Centro bajo 26», the 26th house of the single row of the centre counted from the hotel end
   (Catastro 6926603TK9162N_part91, confirmed by Joaquín on 21-nov-2026). Its own style and a fixed plan drawn from the
   photos in ref/cb26: entrance gallery around a gravel patio with an ochre rock, living-dining room with the fireplace,
   the mirror between painted panels and the six-arm chandelier, oak kitchen in L, bath with the bird painting and three
   bedrooms (carved headboards, the stripes and the mustard). Paintings and posters are our own designs, not copies.
   Local frame of the house: u along the north façade (east), v towards the garden (south), origin at the patio corner. */
var CS={b:null,tried:false,out:null,wash:null};
const CS_TH={id:'casa',n:'Nuestra casa',floor:'tile',fc:'#d2cabd',wall:'#f5f3ee',acc:'#c99b33',wood:'#e6e1d7',wood2:'#9a8f83',fab:'#dcd3c2',fab2:'#f0eadf',metal:'#2c2d2f',stone:'#efebe4',rug:['plain','#e8e0d0','#d8cdb9','#c99b33'],curtain:'#efe8da',pot:'#ece8df',special:'casa'};
function csB(){ if(CS.b||CS.tried||!WP.casa) return CS.b; if(!BLD.length) return null; CS.tried=true; CS.b=BLD.find(b=>b.id===WP.casa.id&&b.kind==='villa')||null; return CS.b; }
function csIs(b){ return !!WP.casa&&!!b&&b===csB(); }
// house frame (u,v) <-> world (x,z); the bedroom wing runs 7.3° off the frame: (p across, w along)
function csW(u,v){ const C=WP.casa, U=C.u; return [C.o[0]+u*U[0]-v*U[1], C.o[1]+u*U[1]+v*U[0]]; }
function csL(x,z){ const C=WP.casa, U=C.u, dx=x-C.o[0], dz=z-C.o[1]; return [dx*U[0]+dz*U[1], -dx*U[1]+dz*U[0]]; }
const CS_WG=[0.9919,-0.1274];
function csG(p,w){ return [1.47+p*CS_WG[0]+w*-CS_WG[1], -8.33+p*CS_WG[1]+w*CS_WG[0]]; }
function csGL(u,v){ const du=u-1.47, dv=v+8.33; return [du*CS_WG[0]+dv*CS_WG[1], du*-CS_WG[1]+dv*CS_WG[0]]; }
function csGW(p,w){ const q=csG(p,w); return csW(q[0],q[1]); }
// world yaw of a piece whose front (local +z) looks along the house direction (du,dv)
function csA(du,dv){ const U=WP.casa.u; const wx=du*U[0]-dv*U[1], wz=du*U[1]+dv*U[0]; return Math.atan2(-wx,wz); }
function csAG(dp,dw){ return csA(dp*CS_WG[0]+dw*-CS_WG[1], dp*CS_WG[1]+dw*CS_WG[0]); }
function csRoomAt(u,v){ const g=csGL(u,v), p=g[0], w=g[1];
  if(u<=-4.0&&v<=-7.2) return 2; if(u<-2.16) return v>-7.9?1:0; if(u<0.6&&v>-4.87) return 1;
  if(u>=4.81&&v<=-11.3) return 3; if(w>=9.6) return 6; if(p>=1.15&&w>=-0.62) return w<4.6?4:5; if(w>=-0.62) return 7; return 0; }
const CS_ROOMS=[['living','Entrada'],['living2','Salón-comedor'],['kitchen','Cocina'],['bath','Baño'],['bed2','Dormitorio mostaza'],['bed2','Dormitorio de las rayas'],['bed','Dormitorio principal'],['hall','Pasillo']];
// facade openings of this villa (the panels of the shell, which the interior turns into real holes): [type, no curtains]
// 1 glazing to the floor, 2 window, 3 high slots, 0 plain wall
function csPanelTy(p0,p1){ const a=csL(p0[0],p0[1]), c=csL(p1[0],p1[1]); const m=[(a[0]+c[0])/2,(a[1]+c[1])/2]; const g=csGL(m[0],m[1]);
  const on=(u0,v0,u1,v1)=>segDist(m[0],m[1],[u0,v0],[u1,v1])[0]<0.2;
  if(on(1.47,-8.33,3.38,6.54)) return g[1]<9?[1,1]:g[1]<12?[2,0]:[0,0];   // gallery and corridor along the patio
  if(on(1.47,-8.33,-2.16,-8.32)||on(-2.16,-8.32,-2.14,-4.86)||on(-2.14,-4.86,-0.02,-4.89)||on(-0.02,-4.89,0,0)) return [1,1]; // the patio
  if(on(0,0,-5.77,0.03)||on(-5.96,-1.53,-9.24,-1.1)) return [1,0];          // living room to the porches and the garden
  if(on(-9.24,-1.1,-10.04,-7.23)) return [m[1]>-4.2?1:0,0];
  if(on(-10.04,-7.23,-9.27,-13.42)) return m[1]>-10.3?[1,1]:[2,1];          // kitchen: sliding door to the porch and a window
  if(on(-5.86,-11.38,1.08,-11.38)) return [m[0]>-2.6?2:0,0];
  if(on(1.08,-11.38,0.61,-15.04)) return [2,0];
  if(on(0.61,-15.04,7.61,-15.03)) return [m[0]>4.2?3:0,1];                   // front: the door, then the bath slots
  if(on(6.59,-9.61,8.76,7.15)) return (g[1]<2.3||(g[1]>4.9&&g[1]<8))?[2,0]:[0,0];
  if(on(7.67,5.48,5.18,5.8)) return [1,0];                                    // main bedroom: sliding door to the garden
  return [0,0]; }
function csDoorOut(){ const p=csW(2.4,-15.3); return p; }

/* ---- the plan: fixed partitions with their doorways ---- */
function csPlan(b){ const walls=[], pieces=[], doors=[];
  const L=(u0,v0,u1,v1,ds)=>walls.push({a:csW(u0,v0),b:csW(u1,v1),doors:ds||[]}); const G=(p0,w0,p1,w1,ds)=>walls.push({a:csGW(p0,w0),b:csGW(p1,w1),doors:ds||[]});
  L(-10.02,-7.2,-4.0,-7.2); L(-4.0,-11.36,-4.0,-7.2,[[0.16,1.01]]); L(4.81,-15.02,4.81,-11.32,[[2.62,3.42]]);
  G(1.15,-0.62,3.45,-0.62); G(1.15,-0.62,1.15,9.6,[[3.72,4.62],[5.82,6.72]]); G(1.15,4.6,5.22,4.6); G(0.03,9.6,5.22,9.6,[[0.09,0.99]]);
  for(const w of walls){ const Lw=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]); const ux=(w.b[0]-w.a[0])/Lw, uz=(w.b[1]-w.a[1])/Lw; let t=0;
    for(const d of w.doors){ if(d[0]>t+0.05) pieces.push([[w.a[0]+ux*t,w.a[1]+uz*t],[w.a[0]+ux*d[0],w.a[1]+uz*d[0]]]); doors.push([[w.a[0]+ux*d[0],w.a[1]+uz*d[0]],[w.a[0]+ux*d[1],w.a[1]+uz*d[1]]]); t=d[1]; }
    if(Lw>t+0.05) pieces.push([[w.a[0]+ux*t,w.a[1]+uz*t],[w.b[0],w.b[1]]]); }
  const U=WP.casa.u, ang=Math.atan2(U[1],U[0]);
  return {ang,toL:(x,z)=>csL(x,z),toW:(u,v)=>csW(u,v),u0:-10.1,u1:8.8,v0:-15.1,v1:7.3,runs:()=>[],walls,pieces,doors,casa:true,
    rooms:CS_ROOMS.map((r,i)=>({id:i,kind:r[0],name:r[1]})),roomAt:(x,z)=>{ const q=csL(x,z); return csRoomAt(q[0],q[1]); }}; }

/* ---- textures (own designs) ---- */
function csTx(k,w,h,fn,rep){ return txc('cs'+k,()=>canvasTex(w,h,fn,rep)); }
function csCoverTex(){ return csTx('cover',512,512,(g,w,h)=>{ g.fillStyle='#f2efe8'; g.fillRect(0,0,w,h); const R=rng(83);
  for(let k=0;k<26;k++){ const x=R()*w, y=R()*h, r=18+R()*34; for(const [dx,dy] of [[0,0],[w,0],[-w,0],[0,h],[0,-h]]){ g.strokeStyle='rgba(150,138,118,0.30)'; g.lineWidth=4; g.beginPath(); g.arc(x+dx,y+dy,r,R()*6,R()*6+3.6); g.stroke(); g.strokeStyle='rgba(255,255,255,0.7)'; g.lineWidth=2; g.beginPath(); g.arc(x+dx-1.5,y+dy-1.5,r,0.3,3.0); g.stroke(); } }
  speckle(g,w,h,9000,19,['rgba(255,255,255,0.25)','rgba(120,110,95,0.08)']); },true); }
function csOakTex(){ return csTx('oak',512,512,(g,w,h)=>{ g.fillStyle='#d9cfbf'; g.fillRect(0,0,w,h); const R=rng(57); let y=0;
  while(y<h){ const t=1+R()*3; g.fillStyle=R()<0.55?'rgba(120,98,74,'+(0.08+R()*0.16)+')':'rgba(255,250,240,'+(0.1+R()*0.2)+')'; g.fillRect(0,y,w,t); y+=t+R()*3; } },true); }
function csStripeTex(){ return csTx('stripe',512,512,(g,w,h)=>{ const n=20, s=w/n; for(let i=0;i<n;i++){ g.fillStyle='#d23c33'; g.fillRect(i*s,0,s*0.5,h); g.fillStyle='#ecbd4a'; g.fillRect(i*s+s*0.5,0,s*0.5,h); } speckle(g,w,h,6000,7,['rgba(0,0,0,0.06)','rgba(255,255,255,0.08)']); },true); }
function csRushTex(){ return csTx('rush',256,256,(g,w,h)=>{ g.fillStyle='#c09a5c'; g.fillRect(0,0,w,h); for(let k=-h;k<w;k+=10){ g.strokeStyle='rgba(90,62,28,0.45)'; g.lineWidth=2; g.beginPath(); g.moveTo(k,0); g.lineTo(k+h,h); g.stroke(); g.strokeStyle='rgba(255,230,170,0.35)'; g.beginPath(); g.moveTo(k+4,0); g.lineTo(k+4+h,h); g.stroke(); } },true); }
function csLouverTex(){ return csTx('louver',256,256,(g,w,h)=>{ g.fillStyle='#84796e'; g.fillRect(0,0,w,h); for(let y=0;y<h;y+=16){ g.fillStyle='rgba(30,22,15,0.45)'; g.fillRect(0,y,w,3); g.fillStyle='rgba(255,245,230,0.18)'; g.fillRect(0,y+4,w,3); } },true); }
function csRockTex(){ return csTx('rock',512,512,(g,w,h)=>{ g.fillStyle='#b5753a'; g.fillRect(0,0,w,h); const R=rng(77);
  for(let k=0;k<60;k++){ g.strokeStyle=R()<0.5?'rgba(70,35,15,0.35)':'rgba(240,190,120,0.35)'; g.lineWidth=2+R()*6; g.beginPath(); const y=R()*h; g.moveTo(0,y); g.bezierCurveTo(w*0.3,y+(R()-0.5)*60,w*0.6,y+(R()-0.5)*60,w,y+(R()-0.5)*40); g.stroke(); }
  speckle(g,w,h,12000,9,['rgba(40,20,10,0.18)','rgba(255,220,160,0.15)']); },true); }
// carved headboard: an openwork of leaves and scrolls (alpha cut-outs)
function csCarvedTex(){ return csTx('carved',512,512,(g,w,h)=>{ g.clearRect(0,0,w,h);
  const draw=(col,off,lw)=>{ g.save(); g.translate(off,off); g.strokeStyle=col; g.fillStyle=col; g.lineWidth=lw; g.lineCap='round';
    for(const sx of [1,-1]){ g.save(); g.translate(w/2,0); g.scale(sx,1);
      for(let k=0;k<5;k++){ const a=-1.2+k*0.55; g.save(); g.translate(0,h*0.62); g.rotate(a); g.beginPath(); g.moveTo(0,0); g.bezierCurveTo(40,-60,20,-150,0,-200); g.bezierCurveTo(-20,-150,-40,-60,0,0); g.fill(); g.restore(); }
      for(const [x,y,r] of [[150,120,46],[170,380,52],[60,430,34],[200,250,30]]){ g.beginPath(); g.arc(x,y,r,0.4,5.6); g.stroke(); g.beginPath(); g.arc(x+r*0.35,y,r*0.45,2.6,8.4); g.stroke(); }
      g.beginPath(); g.moveTo(10,470); g.bezierCurveTo(120,420,230,470,236,330); g.stroke(); g.beginPath(); g.moveTo(10,40); g.bezierCurveTo(140,80,220,20,236,150); g.stroke(); g.restore(); }
    g.beginPath(); g.arc(w/2,h*0.62,34,0,7); g.fill(); g.restore(); };
  draw('#a9a294',4,15); draw('#eeeae1',0,14); }); }
// painted panels beside the mirror: cream boards, worn teal edge, flowers in blue, pink and green
function csPanelTex(){ return csTx('panel',256,1024,(g,w,h)=>{ g.fillStyle='#e6dcc4'; g.fillRect(0,0,w,h); const R=rng(29);
  for(let k=0;k<5;k++){ g.fillStyle='rgba(120,100,70,0.12)'; g.fillRect(k*w/5,0,2,h); }
  const leaf=(x,y,a,s,c)=>{ g.save(); g.translate(x,y); g.rotate(a); g.fillStyle=c; g.beginPath(); g.ellipse(0,-s,s*0.38,s,0,0,7); g.fill(); g.restore(); };
  const flower=(x,y,r,c)=>{ for(let k=0;k<6;k++){ const a=k/6*Math.PI*2; g.fillStyle=c; g.beginPath(); g.ellipse(x+Math.cos(a)*r*0.7,y+Math.sin(a)*r*0.7,r*0.5,r*0.32,a,0,7); g.fill(); } g.fillStyle='#d9a64a'; g.beginPath(); g.arc(x,y,r*0.3,0,7); g.fill(); };
  g.strokeStyle='#5f7d5c'; g.lineWidth=7; g.beginPath(); g.moveTo(w/2,h*0.93); g.bezierCurveTo(w*0.3,h*0.7,w*0.7,h*0.45,w/2,h*0.08); g.stroke();
  g.fillStyle='#c78a5e'; g.beginPath(); g.moveTo(w*0.3,h*0.97); g.lineTo(w*0.7,h*0.97); g.lineTo(w*0.78,h*0.87); g.lineTo(w*0.22,h*0.87); g.closePath(); g.fill();
  for(let k=0;k<9;k++){ const y=h*(0.12+k*0.085), sd=k%2?1:-1; const x=w/2+sd*(30+R()*14); leaf(x,y+20,sd*0.9,26,'#6f8f6a'); leaf(w/2-sd*18,y+40,-sd*0.7,20,'#89a07b');
    if(k%3===0) flower(x+sd*30,y,22,'#c97f86'); else if(k%3===1) flower(x+sd*26,y+6,18,'#5c7fa3'); else flower(x+sd*22,y,16,'#d39a76'); }
  g.strokeStyle='#8a5b4a'; g.lineWidth=3; for(let k=0;k<6;k++){ g.beginPath(); g.arc(w/2,h*(0.15+k*0.14),40,3.6,5.8); g.stroke(); }
  speckle(g,w,h,9000,13,['rgba(255,255,255,0.22)','rgba(90,70,40,0.12)']);
  g.strokeStyle='#3d6d78'; g.lineWidth=18; g.strokeRect(9,9,w-18,h-18); for(let k=0;k<220;k++){ g.fillStyle='rgba(230,222,200,0.75)'; g.fillRect(R()*w,(R()<0.5?R()*24:h-R()*24),4+R()*14,2+R()*5); g.fillRect((R()<0.5?R()*22:w-R()*22),R()*h,2+R()*5,4+R()*14); } }); }
// bathroom: a tit on a branch, our own loose brushwork on gold-flecked linen
function csBirdTex(){ return csTx('bird',512,512,(g,w,h)=>{ g.fillStyle='#d8ceb9'; g.fillRect(0,0,w,h); speckle(g,w,h,5000,41,['rgba(201,165,74,0.55)','rgba(255,240,200,0.4)']);
  g.strokeStyle='#7a5a3a'; g.lineWidth=16; g.lineCap='round'; g.beginPath(); g.moveTo(40,400); g.bezierCurveTo(180,360,320,390,470,330); g.stroke(); g.strokeStyle='#b28a4a'; g.lineWidth=6; g.beginPath(); g.moveTo(60,404); g.bezierCurveTo(200,372,320,396,450,342); g.stroke();
  g.fillStyle='#c89a45'; g.beginPath(); g.ellipse(250,300,70,58,-0.2,0,7); g.fill(); g.fillStyle='#4f8193'; g.beginPath(); g.ellipse(210,270,78,40,-0.35,0,7); g.fill();
  g.fillStyle='#6f9aa8'; g.beginPath(); g.moveTo(150,280); g.lineTo(60,330); g.lineTo(90,300); g.closePath(); g.fill();
  g.fillStyle='#f2ede2'; g.beginPath(); g.arc(300,240,40,0,7); g.fill(); g.fillStyle='#3c6f83'; g.beginPath(); g.arc(296,222,36,3.3,6.1); g.fill(); g.fillStyle='#262626'; g.beginPath(); g.arc(314,244,5,0,7); g.fill();
  g.fillStyle='#57483a'; g.beginPath(); g.moveTo(338,246); g.lineTo(360,252); g.lineTo(338,256); g.fill(); g.strokeStyle='#57483a'; g.lineWidth=4; g.beginPath(); g.moveTo(240,352); g.lineTo(236,384); g.moveTo(266,352); g.lineTo(268,382); g.stroke();
  for(const [x,y] of [[380,80],[410,110],[360,120],[430,70]]){ g.fillStyle='#8a2f3a'; g.beginPath(); g.arc(x,y,14,0,7); g.fill(); } g.strokeStyle='#5a3a2a'; g.lineWidth=3; g.beginPath(); g.moveTo(470,40); g.lineTo(380,80); g.moveTo(420,60); g.lineTo(410,110); g.stroke(); }); }
// kitchen: a framed exhibition-style poster of the reservoir (own design)
function csPosterTex(){ return csTx('poster',384,512,(g,w,h)=>{ g.fillStyle='#f6f3ec'; g.fillRect(0,0,w,h); const x0=40,y0=40,iw=w-80,ih=h-150;
  const gr=g.createLinearGradient(0,y0,0,y0+ih); gr.addColorStop(0,'#bcd3e6'); gr.addColorStop(0.55,'#e9e4d6'); gr.addColorStop(0.56,'#6d8fb0'); gr.addColorStop(1,'#3f6688'); g.fillStyle=gr; g.fillRect(x0,y0,iw,ih);
  g.fillStyle='#5d7590'; g.beginPath(); g.moveTo(x0,y0+ih*0.56); g.bezierCurveTo(x0+iw*0.3,y0+ih*0.38,x0+iw*0.5,y0+ih*0.5,x0+iw*0.75,y0+ih*0.4); g.lineTo(x0+iw,y0+ih*0.48); g.lineTo(x0+iw,y0+ih*0.56); g.closePath(); g.fill();
  g.fillStyle='#2f4a3a'; g.fillRect(x0+iw*0.68,y0+ih*0.5,8,ih*0.42); g.beginPath(); g.ellipse(x0+iw*0.69,y0+ih*0.45,46,40,0,0,7); g.fill();
  g.fillStyle='#e7b94e'; g.beginPath(); g.arc(x0+iw*0.25,y0+ih*0.22,22,0,7); g.fill();
  g.fillStyle='#2b2d2f'; g.font='600 22px Figtree, sans-serif'; g.textAlign='center'; g.fillText('VALDECAÑAS',w/2,h-70); g.font='14px Figtree, sans-serif'; g.fillText('El embalse · 2026',w/2,h-46); }); }
function csMustTex(k){ return csTx('must'+k,512,512,(g,w,h)=>{ g.fillStyle='#f6f4ef'; g.fillRect(0,0,w,h); speckle(g,w,h,6000,k+3,['rgba(120,110,90,0.08)','rgba(255,255,255,0.4)']); g.fillStyle='#c39a35';
  if(k===0){ g.fillRect(0,h*0.36,w,h*0.26); g.fillRect(0,h*0.88,w,h*0.07); } else g.fillRect(w*0.3,0,w*0.34,h);
  g.fillStyle='rgba(0,0,0,0.06)'; for(let y=0;y<h;y+=3) g.fillRect(0,y,w,1); g.strokeStyle='rgba(90,80,60,0.28)'; g.lineWidth=5; g.strokeRect(2,2,w-4,h-4); }); }
// back splat of the Chippendale chairs (white, pierced)
function csSplatTex(){ return csTx('splat',256,512,(g,w,h)=>{ g.clearRect(0,0,w,h); const draw=(c,o,lw)=>{ g.save(); g.translate(o,o); g.strokeStyle=c; g.fillStyle=c; g.lineWidth=lw; g.lineCap='round';
    g.beginPath(); g.moveTo(w*0.5,h*0.98); g.bezierCurveTo(w*0.15,h*0.75,w*0.25,h*0.45,w*0.42,h*0.3); g.bezierCurveTo(w*0.25,h*0.18,w*0.2,h*0.06,w*0.5,h*0.04); g.bezierCurveTo(w*0.8,h*0.06,w*0.75,h*0.18,w*0.58,h*0.3); g.bezierCurveTo(w*0.75,h*0.45,w*0.85,h*0.75,w*0.5,h*0.98); g.stroke();
    g.beginPath(); g.ellipse(w*0.5,h*0.55,w*0.14,h*0.12,0,0,7); g.stroke(); g.beginPath(); g.moveTo(w*0.5,h*0.67); g.lineTo(w*0.5,h*0.98); g.stroke(); g.beginPath(); g.moveTo(w*0.5,h*0.3); g.lineTo(w*0.5,h*0.43); g.stroke();
    g.beginPath(); g.arc(w*0.5,h*0.16,16,0,7); g.fill(); g.restore(); };
  draw('#b7b0a3',3,15); draw('#f2efe8',0,14); }); }
function csPlaqueTex(){ return csTx('plaque',512,256,(g,w,h)=>{ g.fillStyle='#efe6d2'; g.fillRect(0,0,w,h); g.strokeStyle='#2b2d2f'; g.lineWidth=10; g.strokeRect(14,14,w-28,h-28);
  g.fillStyle='#2b2d2f'; g.textAlign='center'; g.textBaseline='middle'; g.font='800 112px Figtree, sans-serif'; g.fillText('CB26',w/2,h*0.42); g.font='700 40px Figtree, sans-serif'; g.fillStyle='#8a5a2b'; g.fillText('Nuestra casa',w/2,h*0.78); }); }
function csWashTex(){ return csTx('wash',128,256,(g,w,h)=>{ const gr=g.createRadialGradient(w/2,0,4,w/2,0,h*0.95); gr.addColorStop(0,'rgba(255,236,200,1)'); gr.addColorStop(0.35,'rgba(255,226,180,0.55)'); gr.addColorStop(1,'rgba(255,220,170,0)'); g.fillStyle=gr; g.fillRect(0,0,w,h); }); }
function csMats(){ return {
  csWhite:IM({map:woodTex('#ece8e0'),roughness:0.7}), csGrayW:IM({map:woodTex('#8c8379'),roughness:0.75}), csDarkW:IM({map:woodTex('#4a3b30'),roughness:0.55}),
  csGrayF:IM({map:fabricTex('#c6c2ba'),roughness:1}), csMust:IM({map:fabricTex('#c99b33'),roughness:1}), csCream:IM({map:fabricTex('#ece4d0'),roughness:1}),
  csHead:IM({color:'#efe7cf',roughness:0.6}), csCover:IM({map:csCoverTex(),roughness:1}), csShade:IM({color:'#f5f1e8',roughness:0.9}),
  csRush:IM({map:csRushTex(),roughness:1}), csIron:IM({color:'#1e1e1f',roughness:0.45,metalness:0.6}), csOak:IM({map:csOakTex(),roughness:0.5}),
  csSile:IM({color:'#f2efe9',roughness:0.16}), csSileB:IM({color:'#ddd2bf',roughness:0.25}), csStripe:IM({map:csStripeTex(),roughness:1}), csRed:IM({map:fabricTex('#b7232d'),roughness:1}),
  csBrass:IM({color:'#e7dfc0',roughness:0.4,metalness:0.25}), csTeal:IM({color:'#46727a',roughness:0.8}), csLouver:IM({map:csLouverTex(),roughness:0.8}), csTray:IM({color:'#4a4744',roughness:0.85}) }; }

/* ---- furnishing: everything placed by hand where the photos put it ---- */
function csFurnish(E){ const {G,I,floor,ceil,grp,lights,downs}=E; const fl=floor;
  const place=(cx,cz,a)=>{ const o=E.ctx(cx,cz,a); o.cx=cx; o.cz=cz; return o; };
  const free=(u,v,du,dv)=>{ const p=csW(u,v); return place(p[0],p[1],csA(du,dv)); };
  const freeG=(p,w,dp,dw)=>{ const q=csGW(p,w); return place(q[0],q[1],csAG(dp,dw)); };
  const wall=(u,v,d)=>{ const p=csW(u,v); const wa=E.nearestWall(p[0],p[1]); return place(wa.qx-wa.nx*(d/2+0.03),wa.qz-wa.nz*(d/2+0.03),wa.a); };
  const wallG=(p,w,d)=>{ const q=csG(p,w); return wall(q[0],q[1],d); };
  const reg=(o,w,d,kind,top,tall)=>{ E.claim(o.cx,o.cz,o.a,w,d,kind,tall); if(top) E.solid(o.cx,o.cz,o.a,w,d,top); };
  const roll=(m,o,lx,yc,lz,sx,sy,sz,rl,la)=>{ const p=o.at(lx,lz); G[m].add(rboxGeo(sx,sy,sz,0).clone().rotateZ(rl),p[0],fl+yc,p[1],o.a+(la||0)); };
  let np=0; const plane=(o,tex,lx,yc,lz,w,h,op)=>{ op=op||{}; const p=o.at(lx,lz); const mat=IM(Object.assign({map:tex,roughness:op.r===undefined?0.85:op.r},op.alpha?{alphaTest:0.5,side:THREE.DoubleSide}:{})); E.M['csPlane'+(np++)]=mat; // so the room's reflection map lights it too
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat); m.position.set(p[0],fl+yc,p[1]); m.rotation.y=-o.a; m.receiveShadow=true; grp.add(m); return m; };
  const down=(u,v)=>downs.push(csW(u,v)), downG=(p,w)=>downs.push(csGW(p,w));
  const legsC=(o,m,w,d,h,r)=>{ for(const [x,z] of [[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]]){ o.cy(m,x,0.03,z,r,h-0.03); o.sp(m,x,0.03,z,r*1.5,0.03,r*1.5); o.sp(m,x*0.92,h*0.75,z*0.92,r*1.2,0.05,r*1.2); } };
  const P={
    wingChair(o){ legsC(o,'csWhite',0.6,0.56,0.2,0.022); o.rb('csWhite',0,0.18,0.02,0.72,0.1,0.66,0.02); o.rb('csMust',0,0.28,0.05,0.6,0.17,0.56,0.06);
      o.rb('csMust',0,0.42,-0.27,0.6,0.74,0.12,0.06); o.rb('csWhite',0,1.12,-0.3,0.62,0.07,0.07,0.03); o.sp('csWhite',0,1.2,-0.29,0.09,0.06,0.035); o.sp('csWhite',-0.17,1.15,-0.29,0.06,0.04,0.03); o.sp('csWhite',0.17,1.15,-0.29,0.06,0.04,0.03);
      for(const sd of [-1,1]){ o.rb('csMust',sd*0.31,0.62,-0.14,0.09,0.46,0.3,0.04,sd*0.12); o.rb('csMust',sd*0.31,0.42,0.06,0.09,0.22,0.48,0.04); o.rb('csWhite',sd*0.32,0.64,0.22,0.08,0.05,0.16,0.02); o.rb('csWhite',sd*0.355,0.2,0.1,0.03,0.42,0.36,0.01); } },
    table(o){ o.rb('csWhite',0,0.72,0,1.7,0.05,1.7,0.01); o.rb('csWhite',0,0.62,0,1.5,0.1,1.5,0.01);
      for(const sz of [-0.58,0.58]){ for(const sg of [-1,1]) roll('csWhite',o,0,0.36,sz,0.92,0.07,0.07,sg*0.72); o.bx('csWhite',0,0.02,sz,1.3,0.06,0.09); }
      o.bx('csWhite',0,0.36,0,0.07,0.06,1.2); o.rb('csTray',0.1,0.77,0,0.62,0.05,0.36,0.01,0.25); o.rb('cream',-0.45,0.77,0.4,0.48,0.02,0.32,0.003,-0.2); o.rb('red',-0.45,0.79,0.4,0.2,0.004,0.14,0.001,-0.2); },
    bench(o){ o.rb('csWhite',0,0.4,0,1.8,0.05,0.36,0.01); for(const x of [-0.72,0.72]){ for(const sg of [-1,1]) roll('csWhite',o,x,0.2,0,0.5,0.06,0.06,sg*0.82,Math.PI/2); o.bx('csWhite',x,0,0,0.08,0.05,0.34); } o.bx('csWhite',0,0.18,0,1.44,0.05,0.05); },
    chair(o){ o.rb('csGrayF',0,0.3,0,0.47,0.17,0.47,0.03); o.rb('csGrayF',0,0.47,-0.2,0.47,0.5,0.08,0.03); for(const [x,z] of [[-0.19,-0.19],[0.19,-0.19],[-0.19,0.19],[0.19,0.19]]) o.bx('csDarkW',x,0,z,0.04,0.3,0.04); },
    chippendale(o){ for(const x of [-0.2,0.2]){ o.cy('csWhite',x,0.04,0.17,0.024,0.4); o.sp('csWhite',x,0.04,0.2,0.04,0.035,0.045); o.sp('csWhite',x,0.34,0.17,0.035,0.06,0.035); o.bx('csWhite',x,0,-0.18,0.035,0.44,0.035); roll('csWhite',o,x,0.75,-0.21,0.04,0.62,0.04,0,0); }
      o.rb('csWhite',0,0.4,0,0.5,0.06,0.44,0.01); o.rb('csRush',0,0.45,0.01,0.42,0.03,0.38,0.01); o.rb('csWhite',0,1.04,-0.21,0.52,0.06,0.05,0.02); o.sp('csWhite',0,1.08,-0.21,0.06,0.04,0.03);
      plane(o,csSplatTex(),0,0.75,-0.21,0.3,0.56,{alpha:true}); },
    fireplace(o){ const h=ceil-fl; o.bx('wall',0,0,0,1.05,h,0.55); o.bx('black',0,0.34,0.24,0.8,0.5,0.06); o.bx('black',-0.5,0.34,0.06,0.06,0.5,0.36); o.bx('csTray',0,0.34,0.2,0.84,0.02,0.16);
      o.rb('stone',0,0,0.34,1.25,0.12,0.3,0.01); o.rb('csRed',0,1.45,0.29,0.6,0.85,0.035,0.004); },
    stool(o){ o.bx('csDarkW',0,0.38,0,0.42,0.04,0.36); o.rb('csRush',0,0.42,0,0.38,0.02,0.32,0.005); for(const [x,z] of [[-0.18,-0.15],[0.18,-0.15],[-0.18,0.15],[0.18,0.15]]) o.bx('csDarkW',x,0,z,0.05,0.38,0.05); o.bx('csDarkW',0,0.12,0,0.36,0.03,0.03); },
    floorLamp(o){ o.cy('csDarkW',0,0,0,0.15,0.04); o.cy('csDarkW',0,0.04,0,0.025,1.3); o.sp('csDarkW',0,0.5,0,0.045,0.08,0.045); o.cy('csShade',0,1.28,0,0.22,0.3); o.cy('glow',0,1.3,0,0.08,0.1); E.lamps.push([o.cx,fl+1.5,o.cz]); },
    console(o,w){ o.rb('csDarkW',0,0.76,0,w,0.04,0.34,0.005); for(const [x,z] of [[-w/2+0.04,-0.13],[w/2-0.04,-0.13],[-w/2+0.04,0.13],[w/2-0.04,0.13]]) o.bx('csIron',x,0,z,0.03,0.76,0.03); o.bx('csIron',0,0.12,0,w-0.08,0.03,0.28);
      const bc=['cream','red','csGrayF','cream','csMust']; for(let k=0;k<5;k++) o.rb(bc[k],-w/2+0.22,0.8+k*0.035,0.02,0.26-k*0.02,0.03,0.2,0.004,k*0.12); o.rb('csDarkW',w/2-0.25,0.8,0,0.12,0.1,0.12,0.01); },
    sideLamp(o,carved,s){ s=s||1; o.rb('csWhite',0,0,0,0.15*s,0.04,0.15*s,0.01); if(carved){ for(let k=0;k<5;k++) o.blob('csWhite',0,0.08+k*0.07,0,(0.05+0.025*Math.sin(k*1.7))*s,0.045,0.03*s); } else o.cy('csWhite',0,0.04,0,0.025,0.32);
      o.cy('csShade',0,0.36,0,0.2*s,0.2); o.cy('glow',0,0.38,0,0.05,0.06); },
    sofaCornerTable(o){ o.bx('csIron',0,0.55,0,0.5,0.03,0.5); for(const [x,z] of [[-0.23,-0.23],[0.23,-0.23],[-0.23,0.23],[0.23,0.23]]) o.bx('csIron',x,0,z,0.03,0.55,0.03); o.bx('csWhite',0,0.5,0,0.48,0.02,0.48);
      o.rb('cream',0.1,0.58,0.1,0.22,0.05,0.16,0.004); o.rb('csGrayF',0.1,0.63,0.1,0.2,0.04,0.15,0.004); o.rb('cream',0.12,0.67,0.09,0.18,0.03,0.14,0.004); P.sideLamp(ctx2(o,-0.1,-0.08,0.58),true,1.1); },
    kitchenRun(o,w){ const n=Math.round(w/0.6), uw=w/n; for(let k=0;k<n;k++){ const x=-w/2+uw*(k+0.5); o.bx('csOak',x,0.1,0,uw-0.006,0.78,0.6); o.bx('black',x,0.5,0.301,uw-0.02,0.012,0.004); }
      o.bx('steel',0,0,0.03,w,0.1,0.54); o.rb('csSile',0,0.88,0.01,w+0.02,0.04,0.64,0.006); o.bx('csSile',0,0.92,-0.31,w,0.6,0.015); },
    kitchen(o){ const w=2.9; P.kitchenRun(o,w); const xs=-0.95, xh=0.3;
      o.bx('steel',xs,0.905,0.0,0.6,0.017,0.42); o.bx('chrome',xs,0.9055,0.0,0.52,0.017,0.34); o.cy('chrome',xs,0.92,-0.24,0.022,0.06); roll('chrome',o,xs,1.13,-0.24,0.03,0.38,0.03,0,0); roll('chrome',o,xs,1.3,-0.14,0.03,0.03,0.22,0,0); o.cy('chrome',xs+0.35,0.92,-0.2,0.03,0.05);
      o.bx('black',xh,0.92,0.0,0.62,0.008,0.5); o.bx('steel',xh,1.62,-0.08,0.62,0.05,0.48); o.bx('steel',xh,1.67,-0.2,0.3,ceil-fl-1.67,0.24);
      o.bx('csOak',-0.8,1.5,-0.13,1.3,0.75,0.36); o.bx('csOak',1.05,1.5,-0.13,0.8,0.75,0.36); o.rb('csSile',xh-0.75,0.92,0.06,0.34,0.02,0.3,0.004);
      o.cy('ceramic',1.2,0.92,-0.15,0.06,0.16); o.cy('ceramic',-0.3,0.92,-0.2,0.05,0.12); },
    kitchenL(o,w){ P.kitchenRun(o,w); o.bx('steel',w/2-0.01,0.1,0,0.02,0.78,0.6); o.rb('csSile',w/2-0.15,0.92,0.08,0.22,0.02,0.22,0.004); o.cy('ceramic',-0.3,0.92,-0.15,0.09,0.12); o.blob('leaf',-0.3,1.12,-0.15,0.12,0.1,0.12); },
    tallUnit(o,w){ o.bx('csOak',0,0,0,w,2.2,0.62); o.bx('black',0,0.9,0.312,0.008,1.2,0.004); o.bx('black',-w/4,1.05,0.312,0.012,0.4,0.006); o.bx('black',w/4,1.05,0.312,0.012,0.4,0.006); },
    ktable(o){ o.rb('csSile',0,0.74,0,1.2,0.04,0.8,0.01); for(const x of [-0.56,0.56]){ o.bx('steel',x,0,0,0.05,0.74,0.7); o.bx('steel',x,0.68,0,0.06,0.06,0.74); } },
    ironChair(o){ for(const [x,z] of [[-0.2,-0.2],[0.2,-0.2],[-0.2,0.2],[0.2,0.2]]) o.bx('csIron',x,0,z,0.025,0.45,0.025); o.rb('csRush',0,0.43,0,0.42,0.04,0.42,0.01); o.bx('csIron',0,0.42,0.2,0.42,0.03,0.025);
      for(const x of [-0.2,0.2]) o.bx('csIron',x,0.45,-0.2,0.025,0.5,0.025); o.bx('csIron',0,0.93,-0.2,0.42,0.025,0.025); for(const sg of [-1,1]) roll('csIron',o,0,0.69,-0.2,0.52,0.02,0.02,sg*0.85); },
    vanity(o){ o.bx('white',0,0.1,0.02,1.0,0.72,0.46); o.rb('csSileB',0,0.82,0.0,1.04,0.04,0.5,0.006); o.rb('porc',0,0.86,0.04,0.48,0.12,0.36,0.04); o.bx('porc',0,0.86,-0.2,0.98,0.1,0.015);
      o.cy('chrome',0,0.86,-0.15,0.022,0.14); roll('chrome',o,0,1.0,-0.1,0.03,0.03,0.12,0,0); o.cy('chrome',0.3,0.86,-0.12,0.035,0.16); o.cy('chrome',0.3,1.02,-0.12,0.008,0.05); o.bx('mirror',0,1.05,-0.235,1.0,0.88,0.012); },
    bed(o,w){ o.rb('csCover',0,0.04,0,w+0.04,0.5,2.02,0.04); o.rb('csCover',0,0.48,-0.72,w-0.08,0.12,0.42,0.06); o.rb('csCover',0,0.5,-0.5,w,0.05,0.1,0.02); for(const x of [-w/2+0.06,w/2-0.06]) o.cy('csDarkW',x,0,0.95,0.025,0.05); },
    headCarved(o,w){ o.bx('csWhite',0,0.5,-0.01,w,1.0,0.04); o.bx('csWhite',0,0.5,0.015,w,0.07,0.03); o.bx('csWhite',0,1.43,0.015,w,0.07,0.03); for(const x of [-w/2+0.035,w/2-0.035]) o.bx('csWhite',x,0.5,0.015,0.07,1.0,0.03);
      plane(o,csCarvedTex(),0,1.0,0.035,w-0.13,0.86,{alpha:true,r:0.7}); },
    headPanel(o,w){ o.bx('csHead',0,0.42,0,w,0.78,0.05); o.bx('csHead',0,0.52,0.03,w-0.2,0.56,0.02); o.bx('csHead',0,1.18,0.02,w+0.08,0.07,0.09); o.bx('csHead',0,1.25,0.03,w+0.14,0.04,0.11); },
    headFriso(o,w){ o.bx('csHead',0,0.42,0,w,0.72,0.04); const n=7; for(let k=1;k<n;k++) o.bx('csWhite',-w/2+k*w/n,0.5,0.022,0.008,0.56,0.004); o.bx('csHead',0,1.12,0.02,w+0.06,0.06,0.08); o.bx('csHead',0,1.18,0.025,w+0.1,0.03,0.09); },
    nightLouver(o){ for(const [x,z] of [[-0.18,-0.14],[0.18,-0.14],[-0.18,0.14],[0.18,0.14]]) o.bx('csWhite',x,0,z,0.04,0.66,0.04); o.bx('csWhite',0,0.06,0,0.42,0.58,0.34); o.rb('csGrayW',0,0.64,0,0.46,0.03,0.38,0.005);
      for(const y of [0.12,0.38]){ o.bx('csLouver',0,y,0.172,0.34,0.22,0.01); o.sp('csIron',0,y+0.11,0.185,0.018,0.018,0.01); } },
    nightCurve(o){ legsC(o,'csWhite',0.4,0.3,0.5,0.018); o.bx('csWhite',0,0.42,0,0.44,0.1,0.34); o.rb('csGrayW',0,0.52,0,0.5,0.03,0.38,0.005); },
    comoda(o){ legsC(o,'csWhite',1.02,0.36,0.16,0.02); o.bx('csWhite',0,0.14,0,1.1,0.5,0.44); o.rb('csWhite',0,0.64,0,1.16,0.04,0.48,0.006);
      for(let r=0;r<2;r++) for(let c=0;c<3;c++){ const x=(c-1)*0.35, y=0.18+r*0.23, wd=c===1?0.34:0.3; o.bx('csDarkW',x,y,0.222,wd,0.2,0.012); for(const sg of [-1,1]) o.sp('chrome',x+sg*0.018,y+0.1,0.232,0.018,0.012,0.006); } },
    butaca(o){ o.rb('csCream',0,0.05,0,0.72,0.42,0.7,0.12); o.rb('csCream',0,0.4,-0.27,0.72,0.36,0.18,0.08); for(const sd of [-1,1]) o.rb('csCream',sd*0.29,0.4,0,0.16,0.24,0.62,0.07); o.rb('csCream',0,0.44,0.05,0.44,0.08,0.5,0.04); },
    canvas(o,tex,w,h,y){ o.bx('csHead',0,y,0,w,h,0.04); plane(o,tex,0,y+h/2,0.0215,w,h,{r:0.95}); },
    framed(o,tex,w,h,y,frame,mat){ o.bx(frame,0,y-0.03,0,w+0.06,h+0.06,0.03); plane(o,tex,0,y+h/2,0.017,w,h,{r:mat===undefined?0.8:mat}); },
    radiator(o,w){ for(let k=0;k<Math.round(w/0.08);k++) o.rb('white',-w/2+0.04+k*0.08,0.15,0,0.065,0.6,0.08,0.02); o.cy('chrome',w/2+0.02,0.22,0,0.015,0.08); },
    grille(o,w){ o.bx('white',0,0,0,w,0.16,0.02); for(let k=0;k<4;k++) o.bx('frame',0,0.03+k*0.033,0.011,w-0.06,0.012,0.004); },
    // o sits 4 cm off the wall (local z = -0.04 is the wall face): a recess framed by two jambs and a soffit with two spots
    mirrorNiche(o){ const h=ceil-fl, jw=0.08, half=1.08, sy=2.45; for(const sd of [-1,1]) o.bx('wall',sd*half,0,0.04,jw,h,0.16); o.bx('wall',0,sy,0.04,half*2+jw,h-sy,0.16);
      for(const sd of [-1,1]){ const p=o.at(sd*0.86,0.05); G.glow.cy(p[0],fl+sy-0.012,p[1],0.05,0.012); }
      o.bx('csTeal',0,0.72,-0.025,1.46,1.6,0.03); o.bx('csTeal',0,2.32,0.0,1.56,0.07,0.07); o.bx('csTeal',0,0.66,0.0,1.52,0.06,0.07);
      o.bx('mirror',0,0.78,-0.002,0.5,1.48,0.015); for(const sd of [-1,1]) plane(o,csPanelTex(),sd*0.47,1.52,0.0,0.4,1.48,{r:0.85});
      const wm=new THREE.MeshBasicMaterial({map:csWashTex(),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,color:new THREE.Color(1,1,1)}); CS.wash=wm;
      for(const sd of [-1,1]){ const p=o.at(sd*0.86,-0.035), m=new THREE.Mesh(new THREE.PlaneGeometry(0.36,1.6),wm); m.position.set(p[0],fl+sy-0.8,p[1]); m.rotation.y=-o.a; m.renderOrder=2; grp.add(m); } },
    chandelier(o){ const h=ceil-fl, y0=h-0.95; o.cy('csBrass',0,y0+0.3,0,0.008,h-y0-0.3); o.cy('csBrass',0,h-0.04,0,0.06,0.04);
      for(let k=0;k<26;k++){ const t=k/26*Math.PI*2, ph=(k%3-1)*0.5; o.sp('csBrass',Math.cos(t)*0.12*Math.cos(ph),y0+0.12+Math.sin(ph)*0.1,Math.sin(t)*0.12*Math.cos(ph),0.035,0.035,0.035); } o.sp('csBrass',0,y0+0.12,0,0.1,0.13,0.1); o.sp('csBrass',0,y0-0.06,0,0.03,0.05,0.03);
      for(let k=0;k<6;k++){ const t=k/6*Math.PI*2+0.3, c=Math.cos(t), s=Math.sin(t); for(let q=1;q<=7;q++){ const r=0.06+q*0.062, y=y0+0.05-Math.sin(q/7*Math.PI)*0.12+(q>5?(q-5)*0.06:0); o.sp('csBrass',c*r,y,s*r,0.016,0.016,0.016); }
        const r=0.5; o.cy('csBrass',c*r,y0+0.12,s*r,0.03,0.05); o.cy('csBrass',c*r,y0+0.17,s*r,0.012,0.07); o.cy('csShade',c*r,y0+0.2,s*r,0.075,0.13); o.cy('glow',c*r,y0+0.21,s*r,0.03,0.08); } }
  };
  const ctx2=(o,lx,lz,dy)=>{ const p=o.at(lx,lz); const q=E.ctx(p[0],p[1],o.a); const f=q.rb, b2=q.bx, c=q.cy, s=q.sp, bl=q.blob; // lifted by dy
    q.rb=(m,x,y,z,...r)=>f(m,x,y+dy,z,...r); q.bx=(m,x,y,z,...r)=>b2(m,x,y+dy,z,...r); q.cy=(m,x,y,z,...r)=>c(m,x,y+dy,z,...r); q.sp=(m,x,y,z,...r)=>s(m,x,y+dy,z,...r); q.blob=(m,x,y,z,...r)=>bl(m,x,y+dy,z,...r); return q; };

  /* Entrada: vestíbulo and the gallery that looks into the patio */
  { const o=wall(0.9,-8.6,0.78); P.wingChair(o); reg(o,0.78,0.72,'sillón orejero',0.45); }
  { const o=wall(4.5,-13.9,0.36); P.console(o,1.1); reg(o,1.1,0.36,'consola',0.8); P.sideLamp(ctx2(o,0.32,0,0.78),true); }
  { const o=free(1.25,-14.55,1,1); I.plant(o,1.05); reg(o,0.5,0.5,'planta',0.4); }
  { const o=wall(-1.6,-11.2,0.02); P.grille(ctx2(o,0,0,2.55),0.6); }
  down(2.6,-13.3); down(-0.6,-9.9); down(-3.0,-9.9); downG(0.58,1.0); downG(0.58,4.6); downG(0.58,8.2);
  /* Salón-comedor */
  { const o=wall(-9.6,-5.0,0.55); P.fireplace(o); reg(o,1.05,0.55,'chimenea',2.5,true); }
  { const o=wall(-9.45,-3.95,0.36); P.stool(o); reg(o,0.42,0.36,'taburete',0.42); }
  { const o=free(-9.3,-5.85,1,0); P.floorLamp(o); reg(o,0.34,0.34,'lámpara',1.4); }
  { const o=wall(-9.5,-6.62,0.34); P.console(o,0.8); reg(o,0.8,0.34,'consola',0.8); }
  { const o=wall(-6.9,-7.0,0.02); P.mirrorNiche(o); E.claim(o.cx,o.cz,o.a,2.3,0.2,'espejo'); }
  for(const u of [-8.32,-5.48]){ const o=wall(u,-6.95,0.46); P.chippendale(o); reg(o,0.5,0.46,'silla',0.46); }
  { const o=free(-6.9,-4.5,0,1); P.table(o); reg(o,1.7,1.7,'mesa',0.77); P.chandelier(o); lights.push([o.cx,ceil-0.95,o.cz]); }
  for(const [u,v,du,dv] of [[-7.35,-5.82,0,1],[-6.45,-5.82,0,1],[-8.12,-4.95,1,0],[-8.12,-4.05,1,0],[-5.68,-4.95,-1,0],[-5.68,-4.05,-1,0]]){ const o=free(u,v,du,dv); P.chair(o); E.claim(o.cx,o.cz,o.a,0.47,0.5,'silla'); E.solid(o.cx,o.cz,o.a,0.47,0.47,0.47); }
  { const o=free(-6.9,-3.3,0,-1); P.bench(o); reg(o,1.8,0.36,'banco',0.45); }
  { const o=wall(-8.6,-7.0,0.02); P.grille(ctx2(o,0,0,2.58),0.55); }
  { const o=wall(-0.5,-2.3,0.96); I.sofa(o,2.4); reg(o,2.4,0.96,'sofá',0.5); }
  { const o=wall(-2.65,-0.5,0.96); I.sofa(o,2.1); reg(o,2.1,0.96,'sofá',0.5); }
  { const o=free(-0.5,-0.5,-1,-1); P.sofaCornerTable(o); reg(o,0.5,0.5,'mesita',0.6); }
  { const o=free(-2.45,-2.3,1,0); I.rug(o,2.6,2.0); E.FP.push({cx:o.cx,cz:o.cz,a:o.a,w:2.6,d:2.0,kind:'alfombra'}); I.coffee(o); reg(o,1.15,0.62,'mesa baja',0.39); }
  { const o=free(-4.35,-2.4,1,0); I.arm(o); reg(o,0.84,0.84,'sillón',0.46); }
  lights.push([...csW(-2.3,-2.2).slice(0,1),ceil-0.6,csW(-2.3,-2.2)[1]]); down(-1.7,-1.7); down(-3.4,-3.6); down(-8.4,-2.6);
  /* Cocina */
  { const o=free(-4.37,-8.73,-1,0); P.kitchen(o); E.claim(o.cx,o.cz,o.a,2.9,0.62,'cocina'); E.solid(o.cx,o.cz,o.a,2.9,0.64,0.92); }
  { const o=free(-5.48,-7.57,0,-1); P.kitchenL(o,1.6); E.claim(o.cx,o.cz,o.a,1.6,0.62,'península'); E.solid(o.cx,o.cz,o.a,1.6,0.64,0.92); }
  { const o=wall(-8.3,-13.1,0.62); P.tallUnit(o,1.2); reg(o,1.2,0.62,'frigorífico',2.2,true); }
  { const o=wall(-5.0,-11.2,0.03); P.framed(ctx2(o,0,0,0),csPosterTex(),0.56,0.75,1.3,'white'); }
  { const o=free(-8.1,-8.75,0,1); P.ktable(o); reg(o,1.2,0.8,'mesa',0.76);
    for(const [lx,lz,a] of [[-0.3,-0.62,0],[0.3,-0.62,0],[-0.3,0.62,Math.PI],[0.3,0.62,Math.PI]]){ const p=o.at(lx,lz); const c=place(p[0],p[1],o.a+a); P.ironChair(c); E.claim(c.cx,c.cz,c.a,0.44,0.44,'silla'); } }
  lights.push([...csW(-6.3,-9.4).slice(0,1),ceil-0.5,csW(-6.3,-9.4)[1]]); down(-5.4,-9.0); down(-7.6,-9.4); down(-8.3,-12.0);
  /* Baño */
  { const o=wall(5.75,-14.75,0.5); P.vanity(o); reg(o,1.04,0.5,'lavabo',0.86); }
  { const o=wall(4.95,-13.72,0.03); P.framed(o,csBirdTex(),0.62,0.62,1.28,'gold',0.7); }
  { const o=free(7.08,-14.52,-1,0); I.shower(o); E.claim(o.cx,o.cz,o.a,0.95,0.95,'ducha'); }
  { const o=wall(7.25,-13.35,0.6); I.toilet(o); reg(o,0.44,0.6,'inodoro',0.42); }
  { const o=wall(4.95,-12.95,0.12); I.towel(o); }
  down(6.0,-13.3);
  /* Dormitorio mostaza */
  for(const p of [2.6,3.52]){ const o=wallG(p,4.3,2.04); P.bed(o,0.9); reg(o,0.94,2.02,'cama',0.55); const h=wallG(p,4.5,0.04); P.headFriso(h,0.9); }
  for(const p of [1.72,4.42]){ const o=wallG(p,4.35,0.34); P.nightCurve(o); reg(o,0.5,0.38,'mesilla',0.55); P.sideLamp(ctx2(o,0,-0.02,0.55),true,0.95); }
  { const o=wallG(2.62,4.5,0.035); P.canvas(o,csMustTex(0),0.82,0.82,1.48); const o2=wallG(3.56,4.5,0.035); P.canvas(o2,csMustTex(1),0.78,0.82,1.48); }
  { const o=wallG(5.0,1.2,0.1); P.radiator(o,0.64); } downG(3.1,1.6);
  /* Dormitorio de las rayas */
  for(const p of [2.55,4.05]){ const o=wallG(p,9.3,2.04); P.bed(o,0.92); reg(o,0.96,2.02,'cama',0.55); P.headPanel(wallG(p,9.5,0.05),0.95);
    const c=ctx2(o,0,-0.55,0.55); c.rb('csStripe',0,0,0,0.42,0.1,0.3,0.03,0.18); }
  { const o=wallG(3.3,9.3,0.36); P.nightLouver(o); reg(o,0.46,0.38,'mesilla',0.66); const l=ctx2(o,0,-0.02,0.67); l.cy('csShade',0,0,0,0.17,0.17); l.cy('csStripe',0,0.04,0,0.175,0.07); l.cy('glow',0,0.03,0,0.05,0.06); }
  { const o=wallG(3.3,9.5,0.035); P.canvas(o,csStripeTex(),0.95,0.95,1.42); }
  downG(3.1,6.6);
  /* Dormitorio principal */
  for(const w of [11.42,12.4]){ const o=wallG(5.0,w,2.04); P.bed(o,0.95); reg(o,0.99,2.02,'cama',0.55); P.headCarved(wallG(5.2,w,0.04),0.96); }
  for(const w of [10.55,13.28]){ const o=wallG(5.0,w,0.36); P.nightLouver(o); reg(o,0.46,0.38,'mesilla',0.66); P.sideLamp(ctx2(o,0,-0.02,0.67),true,1.05); }
  { const o=wallG(0.95,14.8,0.45); P.comoda(o); reg(o,1.16,0.48,'cómoda',0.66); const pn=wallG(0.95,14.95,0.02); pn.bx('white',0,1.05,0,0.62,0.9,0.02); }
  { const o=freeG(4.2,13.85,-1,-0.8); P.butaca(o); reg(o,0.74,0.72,'butaca',0.45); }
  { const o=freeG(2.7,11.9,1,0); I.rug(o,1.7,2.4); E.FP.push({cx:o.cx,cz:o.cz,a:o.a,w:1.7,d:2.4,kind:'alfombra'}); }
  { const q=csGW(3.0,12.0); lights.push([q[0],ceil-0.6,q[1]]); } downG(2.4,12.6); downG(3.0,10.4);
}
// where the visit stops: the patio from the gallery first, then every room
function csViews(){ const V=(u,v,tu,tv,room)=>{ const p=csW(u,v), t=csW(tu,tv); return {x:p[0],z:p[1],yaw:Math.atan2(t[1]-p[1],t[0]-p[0]),room}; };
  const VG=(p,w,tp,tw,room)=>{ const a=csG(p,w), b=csG(tp,tw); return V(a[0],a[1],b[0],b[1],room); };
  return [V(-0.4,-9.9,-0.2,-5.0,'Entrada'),V(-1.6,-3.7,-9.0,-5.4,'Salón-comedor'),V(-5.6,-10.3,-4.3,-7.8,'Cocina'),V(5.45,-12.0,6.0,-14.9,'Baño'),
    VG(2.5,0.7,3.0,4.6,'Dormitorio mostaza'),VG(2.6,5.4,3.3,9.6,'Dormitorio de las rayas'),VG(1.7,11.4,5.2,11.9,'Dormitorio principal')]; }
// night: lampshades glow and the two spots wash the wall above the mirror
function csLight(I,n){ const M=I.mats; if(M.csShade&&M.csShade.emissive) M.csShade.emissive.copy(Cc('#ffcf8a')).multiplyScalar(0.05+1.1*n); if(CS.wash) CS.wash.opacity=0.08+0.62*n; }

/* ---- outside: the patio (gravel, the rock and the glass), the porch furniture, the plaque by the door ---- */
function csBuildOut(){ const b=csB(); if(!b||CS.out) return; const g=new THREE.Group(); CS.out=g; scene.add(g); const fl=interiorFloor(b);
  const M=(o)=>IM(o); const gravel=M({map:gravelTex('#6c5650',11),roughness:1}), rock=M({map:csRockTex(),roughness:0.85}), dark=M({color:'#2b2d2f',roughness:0.4,metalness:0.6}),
    glass=M({color:'#dfe9ee',transparent:true,opacity:0.16,roughness:0.03}), cushion=M({color:'#b9b6ae',roughness:1}), iron=M({color:'#2c3a33',roughness:0.5,metalness:0.4}), leaf=M({color:'#4f6f3a',roughness:0.9});
  const W2=(u,v)=>csW(u,v); const box=(mat,u,v,y0,sx,sy,sz,a)=>{ const p=W2(u,v); const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat); m.position.set(p[0],y0+sy/2,p[1]); m.rotation.y=-(a===undefined?Math.atan2(WP.casa.u[1],WP.casa.u[0]):a); m.castShadow=m.receiveShadow=true; g.add(m); return m; };
  // gravel of the patio, a little below the floor
  { const pts=[[-2.12,-8.29],[1.45,-8.3],[1.87,-4.93],[-2.11,-4.9]].map(q=>W2(q[0],q[1]));
    const tris=THREE.ShapeUtils.triangulateShape(pts.map(p=>new THREE.Vector2(p[0],p[1])),[]); const pos=[], uv=[]; for(const t of tris) for(const k of t){ pos.push(pts[k][0],fl-0.1,pts[k][1]); uv.push(pts[k][0]/1.6,pts[k][1]/1.6); }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geo.computeVertexNormals(); if(geo.attributes.normal.getY(0)<0){ for(let i=0;i<pos.length;i+=9){ const t=pos.slice(i+3,i+6); for(let k=0;k<3;k++){ pos[i+3+k]=pos[i+6+k]; pos[i+6+k]=t[k]; } } geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); geo.computeVertexNormals(); }
    const m=new THREE.Mesh(geo,gravel); m.receiveShadow=true; g.add(m); 
    // no grass blades or trees through the gravel, the porch sofa or the kitchen table
    const clr=[pts,[[-5.7,0.05],[-0.1,0.05],[-0.1,2.2],[-5.7,2.2]].map(q=>W2(q[0],q[1])),[[-12.3,-10.0],[-10.2,-10.0],[-10.2,-7.4],[-12.3,-7.4]].map(q=>W2(q[0],q[1]))];
    W.GRASS_CLEAR=(W.GRASS_CLEAR||[]).concat(clr); for(const r of clr){ let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const q of r){ x0=Math.min(x0,q[0]); x1=Math.max(x1,q[0]); z0=Math.min(z0,q[1]); z1=Math.max(z1,q[1]); } TREE_EXCL.push([x0,x1,z0,z1]); } }
  { const p=W2(-0.85,-6.55); const geo=new THREE.IcosahedronGeometry(0.5,1); const a=geo.attributes.position, R=rng(5); for(let i=0;i<a.count;i++){ const k=0.85+R()*0.3; a.setXYZ(i,a.getX(i)*k,a.getY(i)*k,a.getZ(i)*k); } geo.computeVertexNormals();
    const m=new THREE.Mesh(geo,rock); m.scale.set(1.05,0.58,0.72); m.rotation.y=0.5; m.position.set(p[0],fl-0.1+0.22,p[1]); m.castShadow=m.receiveShadow=true; g.add(m); }
  for(const [u,v,s] of [[1.35,-5.45,0.36],[0.95,-5.3,0.26],[-1.75,-5.35,0.28]]){ const p=W2(u,v); const m=new THREE.Mesh(new THREE.IcosahedronGeometry(s,1),leaf); m.scale.y=0.8; m.position.set(p[0],fl-0.1+s*0.7,p[1]); m.castShadow=true; g.add(m); }
  // the glass that closes the patio to the garden (with its dark frame) and a wall for collisions
  { const a=W2(-0.02,-4.89), c=W2(1.9,-4.89), L=Math.hypot(c[0]-a[0],c[1]-a[1]), an=Math.atan2(c[1]-a[1],c[0]-a[0]), mx=(a[0]+c[0])/2, mz=(a[1]+c[1])/2, H=2.6;
    for(const t of [0,0.5,1]) box(dark,-0.02+1.92*t,-4.89,fl-0.12,0.06,H+0.12,0.08); box(dark,0.94,-4.89,fl+H-0.06,L,0.08,0.08); box(dark,0.94,-4.89,fl-0.12,L,0.06,0.08);
    const gm=new THREE.Mesh(new THREE.PlaneGeometry(L,H),glass); gm.position.set(mx,fl+H/2-0.06,mz); gm.rotation.y=-an; g.add(gm); const p=addPlat(mx,mz,an,L,0.14,fl+H,H+0.3); p.wall=true; }
  // under the porch by the living room: the outdoor sofa and its table
  { const o=W2(-3.0,0.62), a=-Math.atan2(WP.casa.u[1],WP.casa.u[0]); const t=W.terrain(o[0],o[1]);
    box(cushion,-3.0,0.62,t,2.0,0.42,0.8); box(cushion,-3.0,0.28,t+0.42,2.0,0.42,0.16); for(const sd of [-1,1]) box(cushion,-3.0+sd*0.92,0.62,t+0.42,0.16,0.22,0.8);
    box(dark,-3.0,1.6,t,0.9,0.38,0.55); }
  // the kitchen porch: table and four iron chairs, and a lantern on the wall
  { const t=W.terrain(...W2(-11.3,-8.75)); box(iron,-11.3,-8.75,t+0.72,0.8,0.04,1.2); for(const [du,dv] of [[-0.35,-0.55],[0.35,-0.55],[-0.35,0.55],[0.35,0.55]]) box(iron,-11.3+du,-8.75+dv,t,0.04,0.72,0.04);
    for(const [du,dv] of [[-0.75,-0.3],[-0.75,0.3],[0.72,-0.3],[0.72,0.3]]){ box(iron,-11.3+du,-8.75+dv,t+0.42,0.42,0.04,0.42); box(iron,-11.3+du+(du<0?-0.19:0.19),-8.75+dv,t+0.42,0.03,0.5,0.42); for(const sx of [-0.18,0.18]) for(const sz of [-0.18,0.18]) box(iron,-11.3+du+sx,-8.75+dv+sz,t,0.025,0.44,0.025); }
    box(dark,-10.12,-7.6,fl+1.9,0.12,0.36,0.14); }
  // plaque and number by the front door
  { const p=W2(3.45,-15.07); const m=new THREE.Mesh(new THREE.PlaneGeometry(0.46,0.23),M({map:csPlaqueTex(),roughness:0.6})); m.position.set(p[0],fl+1.5,p[1]); m.rotation.y=-csA(0,-1); g.add(m); CS.plaque=m; }
}
function csDrawMap(g,m2c,s,big){ const b=csB(); if(!b||!b.ring) return; g.save(); g.beginPath(); b.ring.forEach((p,i)=>{ const [x,y]=m2c(p[0],p[1]); i?g.lineTo(x,y):g.moveTo(x,y); }); g.closePath(); g.fillStyle='rgba(224,99,58,0.85)'; g.fill(); g.strokeStyle='#fff'; g.lineWidth=1.4*s; g.stroke();
  const [x,y]=m2c(b.c[0],b.c[1]); const r=(big?6:4)*s; g.fillStyle='#e0633a'; g.strokeStyle='#fff'; g.lineWidth=1.4*s; g.beginPath(); g.moveTo(x,y-r*1.25); g.lineTo(x+r,y-r*0.2); g.lineTo(x+r*0.7,y-r*0.2); g.lineTo(x+r*0.7,y+r); g.lineTo(x-r*0.7,y+r); g.lineTo(x-r*0.7,y-r*0.2); g.lineTo(x-r,y-r*0.2); g.closePath(); g.fill(); g.stroke();
  if(big){ g.font='800 '+(8*s)+'px Figtree, sans-serif'; g.textAlign='left'; g.lineWidth=3*s; g.strokeStyle='rgba(255,255,255,0.9)'; g.strokeText('Nuestra casa (CB26)',x+r+3*s,y+3*s); g.fillStyle='#7a2c12'; g.fillText('Nuestra casa (CB26)',x+r+3*s,y+3*s); } g.restore(); }
function csLegend(){ if(!csB()) return ''; return '<div><i class="dot" style="background:#e0633a;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></i>Nuestra casa (CB26): la villa de la familia, con su interior de verdad</div>'; }
function csGuideHTML(){ if(!WP.casa) return ''; return '<li><b>Nuestra casa (CB26)</b>: la villa de la familia, la 26 de la fila del centro contando desde el hotel, está marcada en naranja en el mapa. Entra con «🏠 Ir a nuestra casa» del menú (o con Entrar junto a ella: siempre pasas por la puerta principal). Por dentro es como la de verdad: la entrada que da al patio de grava con la roca, el salón-comedor con la chimenea, el espejo entre paneles pintados y la lámpara de seis brazos, la cocina en L, el baño del pájaro y los tres dormitorios (el principal, el de las rayas y el mostaza). ▶ Recorrido la enseña entera empezando por el patio; de noche se encienden la lámpara, los focos del espejo y las de las mesillas.</li>'; }
function csGlossHTML(){ if(!WP.casa) return ''; return '<dt>CB26</dt><dd>«Centro bajo 26»: nuestra casa en la isla, la 26 de la fila de una sola altura del centro, contando desde el lado del hotel.</dd><dt>Patio interior</dt><dd>Patio descubierto dentro de la casa, rodeado de cristaleras: el de nuestra casa, entre la galería de la entrada, el salón y el pasillo, tiene grava y una roca ocre.</dd><dt>Sillón orejero</dt><dd>Butaca de respaldo alto con «orejas» a los lados; el de la entrada es mostaza.</dd><dt>Península</dt><dd>Tramo de encimera que sale de la pared y queda abierto por un extremo.</dd>'; }
function csLegendPlanHTML(){ const it=(c,t,line)=>'<div><i style="background:'+c+';'+(line?'height:4px;border:0;border-radius:2px':'')+'"></i>'+t+'</div>';
  return '<p class="note" style="margin:6px 0">Plano de nuestra casa, la CB26 (222 m² según el Catastro). Arriba es el norte y la calle; abajo, el jardín y el embalse. La flecha eres tú. Se entra por el vestíbulo, que da a la galería con el patio de grava; a la izquierda, el salón-comedor y la cocina; a la derecha, el pasillo de cristal con el baño, el dormitorio mostaza, el de las rayas y, al fondo, el principal.</p><div class="legend">'+it(PLAN_COL.wall,'Fachada (muro exterior)',true)+it(PLAN_COL.part,'Tabique interior',true)+it(PLAN_COL.win,'Ventana o cristalera (las del patio van del suelo al techo)',true)+it(PLAN_COL.door,'Puerta principal o paso entre estancias',true)+it(PLAN_COL.furn,'Mueble (con su nombre si cabe)')+it(PLAN_COL.rug,'Alfombra')+it(PLAN_COL.floor,'Suelo interior')+it(PLAN_COL.out,'Exterior: el patio de grava es el cuadrado entre la galería, el salón y el pasillo')+'</div><p class="note">Barra de escala: 2 m. Salir te deja en la puerta principal.</p>'; }
// arrive in the vestíbulo looking at the patio
function csPlaceIn(){ const I=S.interior; if(!I||!I.casa) return; const d=I.door; P.x=d.x-d.nx*1.3; P.z=d.z-d.nz*1.3; P.y=I.floor; P.vx=P.vy=P.vz=0; P.swim=false; P.onGround=true;
  const t=csW(-0.4,-6.2); P.yaw=Math.atan2(t[1]-P.z,t[0]-P.x); camS.yaw=P.yaw; camS.pitch=0.04; setFP(store.get('vg_fp')!=='0'); }
function csTip(){ tip('Nuestra casa (CB26) · '+Math.round(S.interior.b.area)+' m² · entrada con patio, salón-comedor, cocina, baño y tres dormitorios · ▶ Recorrido para verla entera',5600); }
function csGo(){ const b=csB(); if(!b) return; closeModal(); hideMap(); fadeTo(()=>{ if(S.mode==='menu'||S.mode==='drone'){ plane.visible=false; glider.visible=false; rig.root.visible=true; S.landedOnce=true; }
    if(P.buggy) exitBuggy(); if(S.mode==='ride') dismountHorse(); if(S.mode==='jet') dismountJet(); if(KART.on) kartEnd('Has dejado la carrera'); if(S.mode!=='walk') setMode('walk');
    if(S.interior) exitVilla(); enterVilla(b,0,0); csPlaceIn(); csTip(); }); }
