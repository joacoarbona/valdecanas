/* ================= H1 · modo Halloween (solo Valdecañas): anochecer con luna y niebla baja, calabazas en las puertas, apariciones por las casas, truco o trato, disfraces y sala ================= */
// costumes are shop items (slot 'disfraz'); buildRig dresses any rig that carries sk.cos: yours, a friend's or a neighbour's
const HL_COS={fantasma:{n:'Fantasma de sábana',c:'#f4f4f6',p:0},calabaza:{n:'Calabaza',c:'#f07f1e',p:20},bruja:{n:'Bruja',c:'#5b2d8e',p:30},pirata:{n:'Pirata',c:'#b8322a',p:30},momia:{n:'Momia',c:'#e3d6b4',p:40},esqueleto:{n:'Esqueleto',c:'#26262a',p:40},dracula:{n:'Drácula',c:'#7d1424',p:60},lobo:{n:'Hombre lobo',c:'#6f6a64',p:50},arana:{n:'Araña',c:'#5a2a7a',p:50}};
const HL_CK=Object.keys(HL_COS);
PRG_SLOTS.disfraz='Disfraces de Halloween';
for(const k of HL_CK) SHOP.push({id:'h-'+k,slot:'disfraz',n:k==='fantasma'?'Fantasma de sábana':'Disfraz de '+(k==='dracula'?'Drácula':HL_COS[k].n.toLowerCase()),p:HL_COS[k].p,c:HL_COS[k].c,cos:k});
TRO.push({id:'halloween',n:'Noche de Halloween completa',how:'En una misma noche de Halloween, llama a todas las casas con calabaza encendida.',m:'g',c:60,w:'hallo'});
TOD_PRESETS.hallo=[-7,250,{sun:1.9,hemi:1.5}];
const HL_MOON=dirFromElAz(17,150);
const HL_PRANK=[['susto','un susto'],['aranas','una lluvia de arañas de juguete'],['calabaza','convertirte en calabaza']];
const HL_MOB={ghost:'fantasma',witch:'bruja en escoba',bats:'murciélagos',skel:'esqueleto',cat:'gato negro'};
var HL={on:false,auto:false,built:false,prevTOD:null,prevMus:null,t:0,ac:-1,hudT:0,villas:[],houses:[],grp:null,night:{d:'',v:[],c:0},tot:0,best:0,mobs:[],spawnT:3,lastMob:'',visit:null,flies:[],sp:null,pk:0,pkI:-1,basket:null,doors:[],fog:null,glow:null,pool:null,moon:null,halo:null,G:null,M:null,hop:0,bub:null,n:0};

/* ---- textures, drawn once on canvases ---- */
function hlCanvas(w,h,fn,lin){ const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); fn(g,w,h); const t=new THREE.CanvasTexture(c); if(!lin) t.encoding=THREE.sRGBEncoding; return t; }
// carved face, centred on the +x side of a sphere (u = 0.5); canvas 256 x 128
function hlFaceShapes(g){ const P=pts=>{ g.beginPath(); g.moveTo(pts[0],pts[1]); for(let i=2;i<pts.length;i+=2) g.lineTo(pts[i],pts[i+1]); g.closePath(); g.fill(); };
  P([100,62,111,40,122,62]); P([134,62,145,40,156,62]); P([123,74,128,64,133,74]);
  P([94,78,104,84,110,80,117,87,124,81,132,87,139,81,146,87,152,80,162,78,154,92,140,99,128,101,116,99,102,92]); }
function hlTex(){ if(HL.T) return HL.T; const T={};
  T.pk=hlCanvas(256,128,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#e0701a'); gr.addColorStop(0.5,'#f38a24'); gr.addColorStop(1,'#c45a12'); g.fillStyle=gr; g.fillRect(0,0,w,h);
    g.strokeStyle='rgba(120,50,5,.35)'; g.lineWidth=5; for(let i=0;i<8;i++){ const x=i*32+16; g.beginPath(); g.moveTo(x,0); g.bezierCurveTo(x-5,h*0.35,x+5,h*0.65,x,h); g.stroke(); }
    g.fillStyle='#3d1d05'; hlFaceShapes(g); });
  T.pkE=hlCanvas(256,128,(g,w,h)=>{ g.fillStyle='#000'; g.fillRect(0,0,w,h); g.shadowColor='#ffb347'; g.shadowBlur=8; g.fillStyle='#ffd27a'; hlFaceShapes(g); });
  T.glow=hlCanvas(128,128,(g,w,h)=>{ const r=g.createRadialGradient(64,64,0,64,64,64); r.addColorStop(0,'rgba(255,255,255,1)'); r.addColorStop(0.25,'rgba(255,255,255,.55)'); r.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=r; g.fillRect(0,0,w,h); });
  T.fog=hlCanvas(128,64,(g,w,h)=>{ const R=rngF(17); for(let k=0;k<14;k++){ const x=24+R()*80, y=26+R()*16, rr=14+R()*16, r=g.createRadialGradient(x,y,0,x,y,rr); r.addColorStop(0,'rgba(255,255,255,.34)'); r.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=r; g.fillRect(0,0,w,h); }
    const fd=g.createLinearGradient(0,0,0,h); fd.addColorStop(0,'rgba(0,0,0,1)'); fd.addColorStop(0.3,'rgba(0,0,0,0)'); fd.addColorStop(0.75,'rgba(0,0,0,0)'); fd.addColorStop(1,'rgba(0,0,0,1)'); g.globalCompositeOperation='destination-out'; g.fillStyle=fd; g.fillRect(0,0,w,h); });
  T.moon=hlCanvas(256,256,(g,w,h)=>{ const c=128; const halo=g.createRadialGradient(c,c,40,c,c,128); halo.addColorStop(0,'rgba(255,214,150,.55)'); halo.addColorStop(1,'rgba(255,200,120,0)'); g.fillStyle=halo; g.fillRect(0,0,w,h);
    const d=g.createRadialGradient(c-14,c-14,6,c,c,46); d.addColorStop(0,'#fff8e6'); d.addColorStop(1,'#f3d39a'); g.fillStyle=d; g.beginPath(); g.arc(c,c,46,0,7); g.fill();
    g.fillStyle='rgba(170,140,95,.32)'; for(const [x,y,r] of [[-14,-10,12],[12,8,9],[-4,18,7],[18,-16,6],[-22,10,5]]){ g.beginPath(); g.arc(c+x,c+y,r,0,7); g.fill(); } });
  T.band=hlCanvas(64,64,(g,w,h)=>{ g.fillStyle='#f3ead4'; g.fillRect(0,0,w,h); const R=rngF(5); for(let y=0;y<h;y+=7){ const o=R()*6-3; g.strokeStyle='rgba(120,100,70,.55)'; g.lineWidth=1.4; g.beginPath(); g.moveTo(0,y+o); g.lineTo(w,y+o+(R()*8-4)); g.stroke(); g.strokeStyle='rgba(255,255,255,.6)'; g.lineWidth=1; g.beginPath(); g.moveTo(0,y+o+2); g.lineTo(w,y+o+2+(R()*6-3)); g.stroke(); } });
  T.band.wrapS=T.band.wrapT=THREE.RepeatWrapping; T.band.repeat.set(2,2);
  T.stripe=hlCanvas(16,32,(g,w,h)=>{ g.fillStyle='#f4f1ea'; g.fillRect(0,0,w,h); g.fillStyle='#b8322a'; g.fillRect(0,0,w,8); g.fillRect(0,16,w,8); });
  T.stripe.wrapS=T.stripe.wrapT=THREE.RepeatWrapping; T.stripe.repeat.set(1,3);
  T.web=hlCanvas(128,128,(g,w,h)=>{ g.strokeStyle='rgba(235,235,245,.85)'; g.lineWidth=1.6; for(let k=0;k<8;k++){ const a=k/8*Math.PI*0.5; g.beginPath(); g.moveTo(0,0); g.lineTo(Math.cos(a)*128,Math.sin(a)*128); g.stroke(); }
    for(let r=18;r<128;r+=18){ g.beginPath(); for(let k=0;k<=8;k++){ const a=k/8*Math.PI*0.5, rr=r-(k%2?4:0); const x=Math.cos(a)*rr, y=Math.sin(a)*rr; if(k) g.lineTo(x,y); else g.moveTo(x,y); } g.stroke(); } });
  return HL.T=T; }
// speech bubble above a neighbour
function hlBubbleTex(txt){ return hlCanvas(512,128,(g,w,h)=>{ g.fillStyle='#ffffff'; g.strokeStyle='#e8732a'; g.lineWidth=8; const r=36; g.beginPath(); g.moveTo(r,6); g.lineTo(w-r,6); g.quadraticCurveTo(w-6,6,w-6,r); g.lineTo(w-6,h-r-14); g.quadraticCurveTo(w-6,h-20,w-r,h-20); g.lineTo(w/2+16,h-20); g.lineTo(w/2,h-4); g.lineTo(w/2-16,h-20); g.lineTo(r,h-20); g.quadraticCurveTo(6,h-20,6,h-r-14); g.lineTo(6,r); g.quadraticCurveTo(6,6,r,6); g.closePath(); g.fill(); g.stroke();
  g.fillStyle='#1d1a22'; let fs=50; g.font='800 '+fs+'px system-ui, sans-serif'; while(g.measureText(txt).width>w-50&&fs>24){ fs-=2; g.font='800 '+fs+'px system-ui, sans-serif'; } g.textAlign='center'; g.textBaseline='middle'; g.fillText(txt,w/2,(h-20)/2+4); }); }

/* ---- geometry: pumpkin, ghost, witch, bat, skeleton, cat, spider, candy ---- */
function hlMat(c,o){ return new THREE.MeshLambertMaterial(Object.assign({color:Cc(c)},o||{})); }
function hlPkGeo(){ if(HL.pkG) return HL.pkG; const g=new THREE.SphereGeometry(1,28,16), P=g.attributes.position;
  for(let i=0;i<P.count;i++){ const x=P.getX(i), y=P.getY(i), z=P.getZ(i), ph=Math.atan2(z,x), s=(1-Math.cos(8*ph))/2, k=1-0.085*s*Math.sqrt(Math.max(0,1-y*y)); let yy=y*0.74; if(y>0.86) yy-=(y-0.86)*0.9; if(y<-0.9) yy+=(-0.9-y)*0.6; P.setXYZ(i,x*k,yy,z*k); }
  g.computeVertexNormals(); return HL.pkG=g; }
function hlPkMats(glow){ const T=hlTex(); return [hlMat('#ffffff',{map:T.pk,emissiveMap:T.pkE,emissive:new THREE.Color(1,0.62,0.22),emissiveIntensity:glow}),hlMat('#5d6b26')]; }
// a pumpkin as one group: body (with the carved face on +x) and stem
function hlPumpkin(r,glow){ const g=new THREE.Group(), M=hlPkMats(glow); const b=new THREE.Mesh(hlPkGeo(),M[0]); b.scale.setScalar(r); g.add(b);
  const st=new THREE.Mesh(new THREE.CylinderGeometry(0.07*r,0.12*r,0.36*r,6),M[1]); st.position.y=0.78*r; st.rotation.z=0.25; g.add(st); return g; }
function hlLathe(pts,seg,wave,wy){ const g=new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),seg); if(wave){ const P=g.attributes.position; for(let i=0;i<P.count;i++){ const y=P.getY(i); if(y<wy){ const ph=Math.atan2(P.getZ(i),P.getX(i)); P.setY(i,y+wave*Math.sin(ph*7)); } } } g.computeVertexNormals(); return g; }
function hlMerge(build){ const grp=new THREE.Group(); const M=c=>new THREE.MeshLambertMaterial({color:Cc(c)}); build(grp,M,(geo,c,x,y,z,rx,ry,rz,sx,sy,sz)=>{ const m=new THREE.Mesh(geo,M(c)); m.position.set(x||0,y||0,z||0); m.rotation.set(rx||0,ry||0,rz||0); if(sx) m.scale.set(sx,sy||sx,sz||sx); grp.add(m); return m; }); return mergeGroup(grp); }
function hlGeos(){ if(HL.G) return HL.G; const G={}, S=(r,a,b)=>new THREE.SphereGeometry(r,a||12,b||8), Cy=(a,b,h,n)=>new THREE.CylinderGeometry(a,b,h,n||8), Co=(r,h,n)=>new THREE.ConeGeometry(r,h,n||8);
  G.ghost=hlMerge((g,M,A)=>{ const body=new THREE.Mesh(hlLathe([[0.001,1.0],[0.15,0.98],[0.26,0.9],[0.32,0.76],[0.34,0.58],[0.35,0.38],[0.37,0.18],[0.39,0.03]],22,0.06,0.06),M('#f6f6fb')); g.add(body);
    for(const s of [-1,1]){ A(S(0.055),'#141418',0.29,0.68,s*0.1,0,0,0,0.5,1.35,1); A(S(0.09),'#f6f6fb',0.06,0.46,s*0.33,0,0,s*0.5,1,0.62,0.7); } A(S(0.05),'#141418',0.31,0.5,0,0,0,0,0.45,1.25,1.1); });
  G.witch=hlMerge((g,M,A)=>{ A(Cy(0.025,0.025,1.7,6),'#7a5230',0,0,0,0,0,Math.PI/2); A(Co(0.17,0.55,10),'#d6b25c',-1.0,0,0,0,0,-Math.PI/2); A(Cy(0.05,0.05,0.05,8),'#b8322a',-0.72,0,0,0,0,Math.PI/2);
    A(Co(0.22,0.62,12),'#6a3ca8',0.02,0.31,0); A(Box(0.03,0.5,0.34),'#4a2a78',-0.14,0.36,0,0,0,0.32); A(S(0.12),'#a8d48a',0.1,0.73,0); A(Co(0.026,0.1,6),'#94c47a',0.25,0.71,0,0,0,-Math.PI/2);
    for(const s of [-1,1]){ A(S(0.019),'#141418',0.2,0.77,s*0.05); A(Cy(0.032,0.028,0.4,6),'#3b2160',0.26,0.36,s*0.11,0,0,-1.05); A(Cy(0.034,0.03,0.42,6),'#1d1d1f',0.2,-0.14,s*0.09,0,0,0.45); A(Box(0.12,0.05,0.06),'#1d1d1f',0.31,-0.33,s*0.09); }
    A(Box(0.1,0.24,0.26),'#e2702a',0.0,0.68,0); A(Cy(0.25,0.25,0.02,18),'#1c1426',0.08,0.82,0); A(Cy(0.07,0.13,0.26,14),'#1c1426',0.06,0.95,0,0,0,0.2); A(Co(0.07,0.2,12),'#1c1426',0.0,1.15,0,0,0,0.7); A(Cy(0.132,0.132,0.04,14),'#8e44ad',0.08,0.86,0); });
  G.skel=hlMerge((g,M,A)=>{ const W='#f1eee4', K='#121214'; A(Cy(0.022,0.022,0.6,6),W,-0.03,1.06,0); for(let k=0;k<4;k++){ const r=0.17-k*0.012; A(new THREE.TorusGeometry(r,0.014,5,16),W,0,1.34-k*0.075,0,Math.PI/2,0,0,0.8,1,1); }
    A(new THREE.TorusGeometry(0.15,0.022,5,16),W,0,0.78,0,Math.PI/2,0,0,0.8,1,1); A(S(0.135,14,10),W,0,1.62,0,0,0,0,1,1.05,0.95); for(const s of [-1,1]){ A(S(0.036),K,0.11,1.65,s*0.05); A(Cy(0.024,0.02,0.42,6),W,0,0.55,s*0.09); A(S(0.03),W,0,0.34,s*0.09); A(Cy(0.02,0.018,0.4,6),W,0,0.14,s*0.09); A(Box(0.13,0.03,0.06),W,0.04,-0.06,s*0.09); }
    A(Co(0.018,0.035,3),K,0.13,1.58,0,0,0,Math.PI); A(Box(0.06,0.035,0.12),W,0.06,1.48,0); A(Box(0.012,0.02,0.09),K,0.12,1.51,0); A(Cy(0.018,0.018,0.12,6),W,0,1.47,0); });
  G.arm=hlMerge((g,M,A)=>{ const W='#f1eee4'; A(Cy(0.02,0.018,0.28,6),W,0,-0.14,0); A(S(0.026),W,0,-0.29,0); A(Cy(0.018,0.016,0.26,6),W,0,-0.43,0); A(S(0.04),W,0,-0.6,0,0,0,0,0.8,1.2,1); });
  G.cat=hlMerge((g,M,A)=>{ const C='#19171d'; A(S(0.16),C,0,0.25,0,0,0,0,1.45,0.72,0.72); A(S(0.1),C,0.24,0.35,0); for(const s of [-1,1]){ A(Co(0.035,0.08,4),C,0.24,0.45,s*0.05); A(Cy(0.024,0.02,0.2,6),C,0.14,0.09,s*0.06); A(Cy(0.024,0.02,0.2,6),C,-0.14,0.09,s*0.06); A(S(0.022),'#f4e04a',0.32,0.37,s*0.04); }
    A(Cy(0.02,0.02,0.2,6),C,-0.25,0.33,0,0,0,0.75); A(Cy(0.02,0.018,0.18,6),C,-0.32,0.48,0,0,0,-0.1); A(Cy(0.018,0.012,0.14,6),C,-0.29,0.62,0,0,0,-0.7); });
  G.spider=hlMerge((g,M,A)=>{ const C='#ffffff'; A(S(0.05),C,0,0.04,0,0,0,0,1.2,0.7,1); A(S(0.03),C,0.06,0.035,0); for(const s of [-1,1]) for(let i=0;i<4;i++){ A(Cy(0.006,0.006,0.12,4),C,-0.04+i*0.027,0.03,s*0.07,s*1.15,0,(i-1.5)*0.35); } });
  G.candy=hlMerge((g,M,A)=>{ A(S(0.045),'#ffffff',0,0,0,0,0,0,1.25,1,1); A(Co(0.035,0.05,6),'#ffffff',0.075,0,0,0,0,Math.PI/2); A(Co(0.035,0.05,6),'#ffffff',-0.075,0,0,0,0,-Math.PI/2); });
  const wing=new THREE.Shape(); wing.moveTo(0.08,0); wing.lineTo(0.13,0.16); wing.lineTo(0.06,0.34); wing.lineTo(0.03,0.25); wing.lineTo(-0.02,0.36); wing.lineTo(-0.05,0.24); wing.lineTo(-0.11,0.3); wing.lineTo(-0.08,0); wing.closePath();
  G.wing=new THREE.ShapeGeometry(wing); G.wing.rotateX(Math.PI/2);
  G.bat=hlMerge((g,M,A)=>{ const C='#3a2e46'; A(S(0.075),C,0,0,0,0,0,0,1.35,0.8,0.8); A(S(0.05),C,0.1,0.02,0); for(const s of [-1,1]){ A(Co(0.018,0.05,4),C,0.11,0.07,s*0.025); A(S(0.012),'#ffd84a',0.145,0.03,s*0.022); } });
  return HL.G=G; }
function Box(a,b,c){ return new THREE.BoxGeometry(a,b,c); }

/* ---- costumes: overlay meshes on the rig and recoloured materials (all materials of a rig belong to that rig) ---- */
function hlBare(R,all){ const H=R.headG.children; H.forEach((c,i)=>{ if(i===0) return; const p=c.geometry&&c.geometry.parameters; if(!all&&p&&p.radius!==undefined&&p.radius<0.025) return; c.visible=false; }); }
function hlDress(R,id){ if(!R||!id) return; const T=hlTex(), chest=R.torso.children[0], head=R.headG.children[0], hip=R.body.children[0], kn=R.lL.kn.children;
  const mT=chest.material, mS=head.material, mP=hip.material, mF=kn[kn.length-1].material, K=(m,c)=>m.color.copy(Cc(c));
  const add=(par,geo,c,x,y,z,rx,ry,rz,sx,sy,sz,o)=>{ const m=new THREE.Mesh(geo,o&&o.mat?o.mat:hlMat(c,o)); m.position.set(x||0,y||0,z||0); m.rotation.set(rx||0,ry||0,rz||0); if(sx) m.scale.set(sx,sy||sx,sz||sx); m.castShadow=true; par.add(m); return m; };
  const S=(r,a,b,p0,pl,t0,tl)=>new THREE.SphereGeometry(r,a||12,b||8,p0||0,pl||Math.PI*2,t0||0,tl||Math.PI), Cy=(a,b,h,n,open,ts,tl)=>new THREE.CylinderGeometry(a,b,h,n||10,1,!!open,ts||0,tl||Math.PI*2), Co=(r,h,n)=>new THREE.ConeGeometry(r,h,n||10), To=(r,t,a,b,arc)=>new THREE.TorusGeometry(r,t,a||5,b||16,arc||Math.PI*2);
  const back=0.875*Math.PI, wrap=1.25*Math.PI, DS={side:THREE.DoubleSide};
  for(const c of R.torso.children) if(c.isMesh&&Math.abs(c.position.x+0.19)<1e-3&&Math.abs(c.position.y-0.3)<1e-3) c.visible=false; // the golf bag stays at home
  if(id==='fantasma'){ K(mT,'#f4f4f6'); R.headG.visible=false;
    add(R.body,hlLathe([[0.001,0.99],[0.13,0.97],[0.21,0.9],[0.245,0.79],[0.25,0.68],[0.3,0.6],[0.34,0.5],[0.37,0.1],[0.4,-0.3],[0.42,-0.64]],26,0.05,-0.58),'#f6f6f8',0,0,0,0,0,0,0,0,0,DS);
    for(const s of [-1,1]) add(R.body,S(0.038),'#141418',0.232,0.79,s*0.065,0,0,0,0.45,1.35,1); add(R.body,S(0.032),'#141418',0.245,0.66,0,0,0,0,0.4,1.1,1.2); }
  else if(id==='calabaza'||id==='calabazo'){ K(mT,'#2f7d32'); K(mP,'#2a6a2c'); K(mF,'#1f3d1f'); const big=id==='calabazo'; const pk=hlPkMats(big?1.3:0.35);
    const b=add(R.torso,hlPkGeo(),'#fff',0,0.3,0,0,0,0,big?0.42:0.36,(big?0.42:0.36)*1.12,big?0.44:0.38); b.material=pk[0];
    if(big){ hlBare(R,true); R.headG.children[0].visible=false; const h=add(R.headG,hlPkGeo(),'#fff',0,0.04,0,0,0,0,0.25,0.3,0.25); h.material=pk[0]; add(R.headG,Cy(0.025,0.04,0.12,6),'#5d6b26',0,0.25,0,0,0,0.3); }
    else { hlBare(R); add(R.headG,S(0.15,14,8,0,Math.PI*2,0,Math.PI*0.5),'#2f7d32',-0.006,0.018,0); add(R.headG,Cy(0.022,0.03,0.1,6),'#6b5a2a',0,0.19,0,0,0,0.3); add(R.headG,S(0.06,8,6),'#3f9a3c',0.02,0.16,0.07,0,0,0,1,0.18,0.6); } }
  else if(id==='bruja'){ K(mT,'#3d2263'); K(mP,'#262626'); K(mF,'#161616'); hlBare(R);
    add(R.headG,Box(0.12,0.34,0.28),'#e0702a',-0.085,-0.12,0); for(const s of [-1,1]) add(R.headG,Box(0.1,0.26,0.05),'#e0702a',0,-0.09,s*0.125);
    add(R.headG,Cy(0.3,0.3,0.018,24),'#22142f',0,0.075,0,0,0,-0.08); add(R.headG,Cy(0.075,0.15,0.3,18),'#22142f',-0.01,0.23,0,0,0,0.1); add(R.headG,Co(0.075,0.22,14),'#22142f',-0.08,0.44,0,0,0,0.65); add(R.headG,Cy(0.152,0.152,0.045,20,true),'#8e44ad',0,0.105,0,0,0,-0.08,1,1,1,DS);
    add(R.body,Cy(0.19,0.38,0.92,18,true),'#3d2263',0,-0.36,0,0,0,0,0,0,0,DS);
    const br=new THREE.Group(); br.name='hlBroom'; br.position.set(-0.22,0.28,0); br.rotation.x=0.85; R.torso.add(br); add(br,Cy(0.018,0.018,1.25,6),'#7a5230',0,0,0); add(br,Co(0.1,0.34,10),'#d6b25c',0,-0.74,0); add(br,Cy(0.035,0.035,0.04,8),'#b8322a',0,-0.56,0); }
  else if(id==='momia'){ for(const m of [mT,mP,mS,mF]){ m.color.copy(Cc('#f1e8d2')); m.map=T.band; m.needsUpdate=true; } hlBare(R);
    add(R.headG,Box(0.02,0.04,0.15),'#3a2a1a',0.124,0.028,0); for(const s of [-1,1]) add(R.headG,S(0.02),'#f6f3ea',0.136,0.03,s*0.048);
    add(R.aL.el,Box(0.012,0.2,0.04),'#e9dfc4',0.05,-0.2,0,0,0,0.2); add(R.aR.sg,Box(0.012,0.18,0.04),'#e9dfc4',0.06,-0.22,0,0,0,-0.15); add(R.body,Box(0.012,0.24,0.05),'#e9dfc4',0.12,-0.12,0.08,0,0,0.1); }
  else if(id==='esqueleto'){ K(mT,'#151517'); K(mP,'#151517'); K(mF,'#0f0f10'); K(mS,'#f3f0e6'); hlBare(R); const W='#f1eee4', Bk='#121214';
    for(const s of [-1,1]) add(R.headG,S(0.034),Bk,0.112,0.03,s*0.048); add(R.headG,Co(0.016,0.032,3),Bk,0.132,-0.012,0,0,0,Math.PI); add(R.headG,Box(0.012,0.032,0.075),Bk,0.123,-0.07,0);
    for(let k=0;k<4;k++) add(R.torso,To(0.2-k*0.01,0.013,5,16,Math.PI),W,0,0.44-k*0.072,0,Math.PI/2,0,-Math.PI/2,1,0.8,1);
    add(R.torso,Box(0.014,0.26,0.03),W,0.165,0.34,0); add(R.torso,Box(0.014,0.42,0.026),W,-0.165,0.3,0); add(R.body,To(0.18,0.02,5,16,Math.PI),W,0,0.02,0,Math.PI/2,0,-Math.PI/2,1,0.8,1);
    for(const a of [R.aL,R.aR]){ add(a.sg,Cy(0.013,0.013,0.26,5),W,0.05,-0.15,0); add(a.el,Cy(0.012,0.012,0.24,5),W,0.045,-0.135,0); add(a.el,S(0.022),W,0.045,0,0); }
    for(const l of [R.lL,R.lR]){ add(l.hg,Cy(0.015,0.015,0.38,5),W,0.072,-0.21,0); add(l.kn,Cy(0.014,0.014,0.36,5),W,0.062,-0.2,0); add(l.kn,S(0.026),W,0.066,0,0); } }
  else if(id==='pirata'){ mT.color.copy(Cc('#ffffff')); mT.map=T.stripe; mT.needsUpdate=true; K(mP,'#2a3550'); K(mF,'#141414'); hlBare(R);
    add(R.headG,S(0.152,14,8,0,Math.PI*2,0,Math.PI*0.5),'#1a1a1c',-0.006,0.03,0,0,0,0,1,0.85,1.04); add(R.headG,Cy(0.3,0.3,0.022,24),'#1a1a1c',0,0.06,0,0,0,0,0.62,1,1.22);
    add(R.headG,S(0.024),'#f1eee4',0.17,0.1,0); add(R.headG,Box(0.01,0.008,0.06),'#f1eee4',0.172,0.075,0,0.6,0,0); add(R.headG,Box(0.01,0.008,0.06),'#f1eee4',0.172,0.075,0,-0.6,0,0);
    add(R.headG,Box(0.012,0.05,0.046),'#0c0c0c',0.134,0.03,0.048); add(R.headG,To(0.139,0.006,4,24),'#0c0c0c',0,0.045,0,Math.PI/2,0.32,0); add(R.headG,To(0.014,0.004,4,10),'#d9b23a',0,-0.05,0.137,0,Math.PI/2,0);
    add(R.body,To(0.17,0.035,6,18),'#b8322a',0,0.05,0,Math.PI/2,0,0,0.8,1.05,1); add(R.body,Box(0.03,0.16,0.06),'#b8322a',0.05,-0.06,0.15,0,0,0.2);
    const sw=new THREE.Group(); sw.position.set(0,-0.02,-0.2); sw.rotation.z=0.35; R.body.add(sw); add(sw,Box(0.014,0.5,0.035),'#cfd3d6',0,-0.28,0); add(sw,S(0.035),'#d9b23a',0,0,0); add(sw,Box(0.02,0.02,0.12),'#d9b23a',0,-0.03,0);
    for(const l of [R.lL,R.lR]) add(l.kn,Cy(0.078,0.07,0.24,8),'#141414',0,-0.31,0); }
  else if(id==='dracula'){ K(mT,'#f1ede4'); K(mP,'#141414'); K(mF,'#0e0e0e'); K(mS,'#ece4de'); hlBare(R);
    add(R.headG,S(0.146,16,10,0,Math.PI*2,0,Math.PI*0.42),'#121214',-0.01,0.016,0); add(R.headG,Co(0.03,0.06,4),'#121214',0.12,0.085,0,0,0,Math.PI);
    for(const s of [-1,1]) add(R.headG,Co(0.008,0.03,4),'#ffffff',0.124,-0.072,s*0.022,0,0,Math.PI);
    const cape=Cy(0.27,0.46,1.24,18,true,back,wrap); add(R.torso,cape,'#121214',0,-0.08,0,0,0,0,0,0,0,{side:THREE.FrontSide}).name='hlCape'; add(R.torso,cape,'#9e1426',0,-0.08,0,0,0,0,0.985,1,0.985,{side:THREE.BackSide}).name='hlCape';
    const col=Cy(0.22,0.15,0.22,16,true,back,wrap); add(R.torso,col,'#121214',0,0.66,0,0,0,0,0,0,0,{side:THREE.FrontSide}); add(R.torso,col,'#9e1426',0,0.66,0,0,0,0,0.98,1,0.98,{side:THREE.BackSide});
    add(R.torso,Box(0.03,0.04,0.11),'#121214',0.155,0.56,0); add(R.torso,Cy(0.036,0.036,0.012,12),'#b3122a',0.17,0.4,0,0,0,Math.PI/2,1,1,1,{emissive:Cc('#3a0008')}); }
  else if(id==='mago'){ K(mT,'#2b3a8f'); K(mP,'#22295e'); K(mF,'#1a1a2a'); hlBare(R); const Bl='#22307a', Go='#f2c230';
    add(R.headG,Cy(0.27,0.27,0.018,24),Bl,0,0.08,0,0,0,-0.06); add(R.headG,Co(0.15,0.52,18),Bl,-0.03,0.35,0,0,0,0.14); add(R.headG,Cy(0.153,0.153,0.045,20,true),Go,-0.004,0.115,0,0,0,-0.06,0,0,0,DS);
    for(const [x,y,z,r] of [[0.11,0.24,0,0.024],[0.06,0.33,0.07,0.018],[0.07,0.3,-0.08,0.02],[0.02,0.45,0.03,0.016]]) add(R.headG,S(r,6,4),Go,x,y,z,0,0,0,1,1,0.5,{emissive:Cc('#7a5a10')});
    add(R.headG,S(0.1,10,8,0,Math.PI*2,Math.PI*0.5,Math.PI*0.5),'#e9e6df',0.07,-0.06,0,0,0,0,1,1.3,1.1);
    const cape=Cy(0.27,0.46,1.24,18,true,back,wrap); add(R.torso,cape,Bl,0,-0.08,0,0,0,0,0,0,0,{side:THREE.FrontSide}).name='hlCape'; add(R.torso,cape,'#6a4fc4',0,-0.08,0,0,0,0,0.985,1,0.985,{side:THREE.BackSide}).name='hlCape';
    for(const [y,a] of [[0.3,0.2],[0.05,-0.35],[-0.25,0.15],[-0.45,-0.25],[0.15,-0.05]]) { const rr=0.285+(0.54-y)/1.24*0.19; add(R.torso,S(0.028,6,4),Go,-rr*Math.cos(a),y,rr*Math.sin(a),0,-a,0,0.4,1,1,{emissive:Cc('#7a5a10')}); }
    const wd=add(R.aR.el,Cy(0.011,0.011,0.36,6),'#3a2414',0.25,-0.275,0,0,0,-1.2); add(R.aR.el,S(0.03,8,6),Go,0.42,-0.21,0,0,0,0,1,1,1,{emissive:Cc('#c99a1a')}); wd.name='mtWand'; }
  else if(id==='lobo'){ const F='#6f6a64', Fd='#4b4640', Fl='#aca596', Cl='#efe9dc'; K(mT,F); K(mP,'#3b4658'); K(mF,F); K(mS,F); hlBare(R);
    add(R.headG,S(0.152,14,8,0,Math.PI*2,0,Math.PI*0.56),Fd,-0.008,0.022,0); add(R.headG,S(0.07,10,8),Fl,0.128,-0.04,0,0,0,0,1.05,0.7,0.9); add(R.headG,S(0.024),'#141214',0.198,-0.024,0);
    for(const s of [-1,1]){ add(R.headG,Co(0.052,0.15,4),Fd,-0.02,0.17,s*0.085,s*0.3,0,-0.1); add(R.headG,Co(0.028,0.085,4),'#c79a8e',-0.004,0.16,s*0.088,s*0.3,0,-0.1);
      add(R.headG,S(0.022),'#f2c230',0.121,0.034,s*0.05,0,0,0,0,0,0,{emissive:Cc('#5a3f00')}); add(R.headG,S(0.009),'#111111',0.139,0.034,s*0.052); add(R.headG,Box(0.02,0.014,0.055),Fd,0.13,0.068,s*0.05,s*0.3,0,0);
      add(R.headG,Co(0.007,0.026,4),Cl,0.168,-0.078,s*0.024,0,0,Math.PI); add(R.headG,Co(0.04,0.1,5),F,0.01,-0.06,s*0.13,s*1.9,0,0); add(R.torso,Co(0.05,0.13,5),F,0,0.58,s*0.2,s*-0.7,0,0); }
    add(R.torso,S(0.13,12,8),Fl,0.1,0.33,0,0,0,0,0.45,1.15,0.9);
    for(const a of [R.aL,R.aR]) for(const k of [-1,0,1]) add(a.el,Co(0.01,0.065,4),Cl,0.05,-0.335,k*0.022,0,0,Math.PI+0.5);
    for(const l of [R.lL,R.lR]){ for(const k of [-1,0,1]) add(l.kn,Co(0.012,0.06,4),Cl,0.195,-0.44,k*0.03,0,0,-Math.PI/2); for(let k=0;k<5;k++) add(l.kn,Co(0.02,0.07,3),'#3b4658',Math.cos(k*1.26)*0.068,-0.3,Math.sin(k*1.26)*0.068,0,0,Math.PI); }
    const tl=add(R.body,S(0.07,10,8),F,-0.3,-0.2,0,0,0,2.36,1,3.6,1.1); tl.name='hlTail'; add(R.body,S(0.05,8,6),Fd,-0.45,-0.35,0,0,0,2.36,1,1.6,1); }
  else if(id==='arana'){ const Bk='#17131c', Pu='#8e44ad', Ey={emissive:Cc('#3a0a5a')}; K(mT,Bk); K(mP,Bk); K(mF,'#0d0b10'); K(mS,'#1d1823'); hlBare(R);
    add(R.headG,S(0.152,16,10),Bk,-0.004,0.012,0,0,0,0,1,1.04,1); add(R.headG,To(0.156,0.011,5,24,Math.PI),Pu,0,0.012,0,0,Math.PI/2,0);
    for(const s of [-1,1]){ add(R.headG,S(0.03,12,8),'#6a1fa8',0.138,0.028,s*0.046,0,0,0,0,0,0,Ey); add(R.headG,S(0.008),'#ffffff',0.166,0.04,s*0.04);
      add(R.headG,S(0.018,10,6),'#6a1fa8',0.133,0.078,s*0.034,0,0,0,0,0,0,Ey); add(R.headG,S(0.014,8,6),'#6a1fa8',0.112,0.104,s*0.076,0,0,0,0,0,0,Ey); add(R.headG,S(0.013,8,6),'#6a1fa8',0.122,-0.018,s*0.078,0,0,0,0,0,0,Ey); }
    for(const [y,r] of [[0.12,0.174],[0.27,0.183],[0.42,0.192]]) add(R.torso,To(r,0.014,5,24),Pu,0,y,0,Math.PI/2,0,0,0.84,1.07,1);
    add(R.torso,Co(0.05,0.09,4),Pu,-0.162,0.37,0,0,0,0,0.35,1,1); add(R.torso,Co(0.05,0.09,4),Pu,-0.162,0.27,0,0,0,Math.PI,0.35,1,1);
    for(const a of [R.aL,R.aR]){ add(a.sg,To(0.061,0.011,4,14),Pu,0,-0.16,0,Math.PI/2); add(a.el,To(0.053,0.01,4,14),Pu,0,-0.12,0,Math.PI/2); }
    for(const l of [R.lL,R.lR]){ add(l.hg,To(0.083,0.012,4,14),Pu,0,-0.2,0,Math.PI/2); add(l.kn,To(0.068,0.011,4,14),Pu,0,-0.18,0,Math.PI/2); }
    for(const s of [-1,1]) for(const [i,y] of [[0,0.42],[1,0.25]]){ const g=new THREE.Group(); g.name='hlSpLeg'; g.position.set(-0.12,y,s*0.08); g.rotation.order='YXZ'; const rx=s*1.15; g.rotation.set(rx,-s*(i?0.85:0.35),0); R.torso.add(g);
      add(g,Cy(0.022,0.017,0.34,6),Bk,0,0.17,0); const k=new THREE.Group(); k.position.y=0.34; k.rotation.x=s*1.35; g.add(k); add(k,S(0.028,8,6),Pu,0,0,0); add(k,Cy(0.017,0.008,0.44,6),Bk,0,0.22,0); g.userData={k,s,i,rx}; } }
}

/* ---- the houses that take part: one door per villa (the wall that faces away from its pool and towards open ground); k-means over the island picks a spread of them, numbered as a route from the hotel ---- */
function hlDoorOf(b){ const r=b.ring; if(!r||r.length<3) return null; let best=null;
  for(let i=0,j=r.length-1;i<r.length;j=i++){ const ax=r[j][0], az=r[j][1], bx=r[i][0], bz=r[i][1], L=Math.hypot(bx-ax,bz-az); if(L<2.2) continue;
    const mx=(ax+bx)/2, mz=(az+bz)/2; let nx=(bz-az)/L, nz=-(bx-ax)/L; if(inBld(b,mx+nx*0.3,mz+nz*0.3)){ nx=-nx; nz=-nz; } if(inBld(b,mx+nx*0.3,mz+nz*0.3)) continue;
    const cx=mx+nx*1.4, cz=mz+nz*1.4; if(bldAt(cx,cz,0.6)||bldAt(mx+nx*0.5,mz+nz*0.5,0.2)||W.poolAt(cx,cz)) continue;
    const g=W.terrain(cx,cz); if(g<W.waterLevel(cx,cz)+0.3||Math.abs(g-W.terrain(mx+nx*0.4,mz+nz*0.4))>0.5) continue;
    let pd=40; for(const p of W.POOLS||[]){ const d=Math.hypot(p.c[0]-cx,p.c[1]-cz); if(d<pd) pd=d; }
    let free=0; for(let k=1;k<=4;k++){ if(bldAt(cx+nx*k*1.5,cz+nz*k*1.5,0.3)) break; free++; }
    const sc=pd+Math.min(L,7)*0.6+free*1.5; if(!best||sc>best.sc) best={sc,b,id:b.id,mx,mz,nx,nz,x:cx,z:cz}; }
  return best; }
function hlPick(){ const vs=BLD.filter(b=>b.kind==='villa'&&b.ring); HL.villas=vs; const c=[]; for(const b of vs){ if(b.area<70) continue; const d=hlDoorOf(b); if(d) c.push(d); }
  const N=Math.min((WP.halloween&&WP.halloween.houses)||20,c.length); if(!N) return []; const H=W.HOT||[0,0], d2=(a,b)=>(a[0]-b.x)*(a[0]-b.x)+(a[1]-b.z)*(a[1]-b.z);
  let cen=[[c[0].x,c[0].z]]; const md=c.map(d=>d2(cen[0],d)); while(cen.length<N){ let bi=0; for(let i=1;i<c.length;i++) if(md[i]>md[bi]) bi=i; const q=[c[bi].x,c[bi].z]; cen.push(q); for(let i=0;i<c.length;i++) md[i]=Math.min(md[i],d2(q,c[i])); }
  for(let it=0;it<14;it++){ const sx=cen.map(()=>[0,0,0]); for(const d of c){ let bi=0,bd=1e18; cen.forEach((q,i)=>{ const v=d2(q,d); if(v<bd){ bd=v; bi=i; } }); sx[bi][0]+=d.x; sx[bi][1]+=d.z; sx[bi][2]++; } cen=cen.map((q,i)=>sx[i][2]?[sx[i][0]/sx[i][2],sx[i][1]/sx[i][2]]:q); }
  const used=new Set(), pick=[]; for(const q of cen){ let bd=1e18,bb=null; for(const d of c){ if(used.has(d)) continue; const v=d2(q,d); if(v<bd){ bd=v; bb=d; } } if(bb){ used.add(bb); pick.push(bb); } }
  const ord=[]; let px=H[0], pz=H[1]; while(pick.length){ let bi=0,bd=1e18; pick.forEach((d,i)=>{ const v=Math.hypot(d.x-px,d.z-pz); if(v<bd){ bd=v; bi=i; } }); const d=pick.splice(bi,1)[0]; ord.push(d); px=d.x; pz=d.z; }
  ord.forEach((d,i)=>d.n=i+1); return ord; }
// everything of the night hangs from one group, built the first time Halloween is switched on
function hlBuild(){ if(HL.built) return; HL.built=true; const T=hlTex(); HL.houses=hlPick(); const grp=new THREE.Group(); grp.visible=false; scene.add(grp); HL.grp=grp;
  const pk=[], gl=[], wood=hlMat('#4a2c1a'), gold=hlMat('#d9b23a',{emissive:Cc('#3a2a05')}), warm=new THREE.MeshBasicMaterial({color:Cc('#ffb45a'),side:THREE.DoubleSide}), web=new THREE.MeshBasicMaterial({map:T.web,transparent:true,depthWrite:false,side:THREE.DoubleSide});
  const dG=Box(0.07,2.15,1.04), kG=new THREE.TorusGeometry(0.06,0.012,6,14), hG=new THREE.SphereGeometry(0.03,8,6), wG=new THREE.PlaneGeometry(1,2.1), webG=new THREE.PlaneGeometry(0.85,0.85);
  for(const h of HL.houses){ const tx=-h.nz, tz=h.nx; h.yaw=-Math.atan2(h.nz,h.nx); h.y=W.terrain(h.mx+h.nx*0.3,h.mz+h.nz*0.3); h.open=0;
    const piv=new THREE.Group(); piv.position.set(h.mx+h.nx*0.05-tx*0.52,h.y,h.mz+h.nz*0.05-tz*0.52); piv.rotation.y=h.yaw; grp.add(piv); h.piv=piv;
    const d=new THREE.Mesh(dG,wood); d.position.set(0.035,1.075,0.52); d.castShadow=true; piv.add(d); const k=new THREE.Mesh(kG,gold); k.position.set(0.075,1.3,0.52); k.rotation.y=Math.PI/2; piv.add(k); const hd=new THREE.Mesh(hG,gold); hd.position.set(0.08,1.0,0.9); piv.add(hd);
    const w=new THREE.Mesh(wG,warm); w.position.set(h.mx+h.nx*0.02,h.y+1.05,h.mz+h.nz*0.02); w.rotation.y=Math.atan2(h.nx,h.nz); grp.add(w);
    const wb=new THREE.Mesh(webG,web); wb.position.set(h.mx+h.nx*0.04+tx*0.75,h.y+2.25,h.mz+h.nz*0.04+tz*0.75); wb.rotation.y=Math.atan2(h.nx,h.nz); grp.add(wb);
    for(const [a,b,s] of [[0.98,0.6,0.42],[-1.3,0.45,0.27]]){ const x=h.mx+tx*a+h.nx*b, z=h.mz+tz*a+h.nz*b, y=W.terrain(x,z)+s*0.62; pk.push([x,y,z,h.yaw+(s<0.3?0.35:-0.2),s]); gl.push([x,y+s*0.15,z,s*5.2,1]); }
    gl.push([h.mx+h.nx*0.35+tx*0.62,h.y+2.35,h.mz+h.nz*0.35+tz*0.62,1.5,0]); }
  const M=hlPkMats(1.5), dm=new THREE.Object3D(), n=pk.length;
  const body=new THREE.InstancedMesh(hlPkGeo(),M[0],n), stem=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07,0.12,0.36,6),M[1],n), pool=new THREE.InstancedMesh(new THREE.CircleGeometry(1,24).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:T.glow,color:Cc('#ff8a2a'),transparent:true,opacity:0.5,blending:THREE.AdditiveBlending,depthWrite:false}),n);
  pk.forEach((p,i)=>{ dm.position.set(p[0],p[1],p[2]); dm.rotation.set(0,p[3],0); dm.scale.setScalar(p[4]); dm.updateMatrix(); body.setMatrixAt(i,dm.matrix);
    dm.position.set(p[0],p[1]+p[4]*0.78,p[2]); dm.rotation.set(0,p[3],0.25); dm.updateMatrix(); stem.setMatrixAt(i,dm.matrix);
    dm.position.set(p[0],p[1]-p[4]*0.62+0.04,p[2]); dm.rotation.set(0,0,0); dm.scale.setScalar(p[4]*6); dm.updateMatrix(); pool.setMatrixAt(i,dm.matrix); });
  for(const m of [body,stem]){ m.castShadow=true; m.frustumCulled=false; grp.add(m); } pool.frustumCulled=false; pool.renderOrder=2; grp.add(pool); HL.pkMesh=body;
  HL.gl=gl; HL.glow=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:T.glow,color:Cc('#ff9a3c'),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}),gl.length); HL.glow.frustumCulled=false; HL.glow.renderOrder=3; grp.add(HL.glow);
  // low fog: soft banks standing on the ground that always face you
  const NF=56; HL.fogP=[]; for(let i=0;i<NF;i++) HL.fogP.push({x:0,z:0,y:0,k:0.7+Math.random()*0.7,ph:Math.random()*6,live:false});
  HL.fog=new THREE.InstancedMesh(new THREE.PlaneGeometry(16,3.4),new THREE.MeshBasicMaterial({map:T.fog,color:Cc('#a59cc8'),transparent:true,opacity:0.3,depthWrite:false}),NF); HL.fog.frustumCulled=false; HL.fog.renderOrder=4; grp.add(HL.fog);
  HL.moon=new THREE.Sprite(new THREE.SpriteMaterial({map:T.moon,fog:false,depthWrite:false,transparent:true})); HL.moon.scale.set(820,820,1); HL.moon.renderOrder=-1; grp.add(HL.moon); }

/* ---- switching the night on and off; it switches on by itself at dusk in the week of Halloween ---- */
function hlNightKey(d){ const x=new Date(d||Date.now()); if(x.getHours()<7) x.setDate(x.getDate()-1); return x.getFullYear()+'-'+(x.getMonth()+1)+'-'+x.getDate(); }
function hlLoad(){ const k=hlNightKey(); let o=null; try{ o=JSON.parse(store.get('vg_hl_'+WP.key)||'null'); }catch(e){} if(!o||o.d!==k||!Array.isArray(o.v)) o={d:k,v:[],c:0}; o.c=+o.c||0; HL.night=o;
  try{ const t=JSON.parse(store.get('vg_hl_tot')||'{}')||{}; HL.tot=+t.tot||0; HL.best=+t.best||0; }catch(e){ HL.tot=0; HL.best=0; } }
function hlSave(){ store.set('vg_hl_'+WP.key,JSON.stringify(HL.night)); HL.best=Math.max(HL.best,HL.night.c); store.set('vg_hl_tot',JSON.stringify({tot:HL.tot,best:HL.best})); }
// from dusk on 25 to 31 October (and the small hours of 1 November)
function hlWindow(d){ const m=d.getMonth(), day=d.getDate(), h=d.getHours(); if(m===9&&day>=25&&day<=31){ if(day===25&&h<7) return false; return h<7||sunNow(d).elev<-0.5; } return m===10&&day===1&&h<7; }
function hlAuto(d){ if(!WP.halloween) return; const w=hlWindow(d);
  if(w&&!HL.on&&store.get('vg_hl_off')!==hlNightKey(d)){ hlSet(true,{auto:true}); toast('¡Noche de Halloween!','Es la semana de Halloween y ya ha anochecido: calabazas, fantasmas y truco o trato por las villas'); }
  else if(!w&&HL.on&&HL.auto) hlSet(false,{auto:true});
  if(HL.on&&HL.night.d!==hlNightKey(d)) hlLoad(); }
function hlSet(on,opt){ opt=opt||{}; on=!!on; if(!WP.halloween||on===HL.on) return;
  if(on){ if(typeof NV!=='undefined'&&NV.on) nvSet(false); hlBuild(); HL.on=true; HL.auto=!!opt.auto; hlLoad(); if(TOD.mode!=='hallo') HL.prevTOD=TOD.mode; TOD.mode='hallo'; updateTOD(true); if(typeof ppSnapExposure==='function') ppSnapExposure();
    HL.prevMus=MUS.st; musSet('miedo'); store.set('vg_mus',HL.prevMus); HL.grp.visible=true; HL.spawnT=2.5; for(const f of HL.fogP) f.live=false; document.body.classList.add('hlon');
    if(MP.code&&!opt.net) mpSend({t:'hlon'}); if(!opt.auto) tip('Noche de Halloween: busca las casas con calabaza encendida y llama a la puerta',4200); }
  else { HL.on=false; HL.auto=false; hlEndVisit(); hlClearMobs(); if(HL.pk>0){ HL.pk=0; prgApply(); } if(TOD.mode==='hallo') setTOD(HL.prevTOD&&HL.prevTOD!=='hallo'?HL.prevTOD:'real');
    if(MUS.st==='miedo') musSet(HL.prevMus&&HL.prevMus!=='miedo'?HL.prevMus:'off'); if(HL.grp) HL.grp.visible=false; document.body.classList.remove('hlon'); hlAskClose(); if(!opt.auto&&hlWindow(new Date())) store.set('vg_hl_off',hlNightKey()); }
  if(rig&&rig.hlB) rig.hlB.visible=false; hlHud(); mpHello(); }
// the sky of the night: purple mist, a big low moon, fog that closes in (called from applyTOD)
function hlLight(){ if(typeof HL==='undefined'||!HL||!HL.on||TOD.mode!=='hallo') return; const fc=scene.fog.color; fc.lerp(Cc('#3b3157'),0.7); scene.background.copy(fc);
  const su=sky.material.uniforms; su.uHor.value.lerp(Cc('#4d3d6e'),0.6); su.uZen.value.lerp(Cc('#0c0a22'),0.45); su.uMoon.value.copy(HL_MOON); hemi.color.lerp(Cc('#8a80c0'),0.3); hemi.groundColor.lerp(Cc('#2a2438'),0.5); sun.color.copy(Cc('#aab4ff'));
  scene.fog.near=45; scene.fog.far=1400; for(const m of WATERMATS){ const u=m.uniforms; u.uFog.value.copy(fc); u.uHor.value.copy(fc); if(u.uNear) u.uNear.value=scene.fog.near; if(u.uFar) u.uFar.value=scene.fog.far; } }

/* ---- sounds, all synthesised (nothing loud: the youngest player is six) ---- */
function hlOsc(type,f0,f1,t0,dur,vol,filt,q){ const o=AC.createOscillator(); o.type=type; o.frequency.setValueAtTime(f0,t0); if(f1!==f0) o.frequency.exponentialRampToValueAtTime(f1,t0+dur); const g=AC.createGain(); g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(Math.max(0.0002,vol),t0+Math.min(0.04,dur*0.3)); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  let n=o; if(filt){ const f=AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=filt; f.Q.value=q||2; o.connect(f); n=f; } n.connect(g); g.connect(master); o.start(t0); o.stop(t0+dur+0.05); return o; }
function hlNoise(t0,dur,vol,freq,type,q){ if(!noiseBuf) return; const s=AC.createBufferSource(); s.buffer=noiseBuf; const f=AC.createBiquadFilter(); f.type=type||'lowpass'; f.frequency.value=freq; f.Q.value=q||1; const g=AC.createGain(); g.gain.setValueAtTime(Math.max(0.0002,vol),t0); g.gain.exponentialRampToValueAtTime(0.0001,t0+dur); s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0+dur+0.05); }
function hlSnd(k,vol){ if(!AC||!master) return; HL.n++; const t=AC.currentTime; vol=vol===undefined?1:vol; try{
  if(k==='knock') for(let i=0;i<3;i++){ hlNoise(t+i*0.24,0.12,0.5*vol,380); hlOsc('sine',140,80,t+i*0.24,0.12,0.4*vol); }
  else if(k==='door'){ hlOsc('sawtooth',220,330,t,0.5,0.05*vol,700,6); hlOsc('sawtooth',300,180,t+0.35,0.45,0.04*vol,900,6); }
  else if(k==='boo'){ const o=hlOsc('sawtooth',196,150,t,1.3,0.16*vol,520,3), l=AC.createOscillator(), lg=AC.createGain(); l.frequency.value=5.5; lg.gain.value=9; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t+1.4); hlOsc('sine',392,300,t,1.2,0.05*vol); }
  else if(k==='cackle') for(let i=0;i<7;i++){ const f=1100-i*55; hlOsc('sawtooth',f,f*0.75,t+i*0.12,0.09,0.09*vol,1600,4); }
  else if(k==='squeak') for(let i=0;i<5;i++) hlOsc('sine',4200+Math.random()*1800,3600,t+i*0.09+Math.random()*0.05,0.05,0.05*vol);
  else if(k==='rattle') for(let i=0;i<14;i++) hlNoise(t+i*0.055+Math.random()*0.02,0.03,0.25*vol,2600,'bandpass',4);
  else if(k==='meow'){ const o=AC.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(520,t); o.frequency.linearRampToValueAtTime(880,t+0.22); o.frequency.linearRampToValueAtTime(600,t+0.6); const f=AC.createBiquadFilter(); f.type='bandpass'; f.Q.value=5; f.frequency.setValueAtTime(900,t); f.frequency.linearRampToValueAtTime(1900,t+0.25); f.frequency.linearRampToValueAtTime(1100,t+0.6);
    const g=AC.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002,0.12*vol),t+0.08); g.gain.exponentialRampToValueAtTime(0.0001,t+0.65); o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t+0.7); }
  else if(k==='candy') [1047,1319,1568,2093].forEach((f,i)=>hlOsc('sine',f,f,t+i*0.07,0.22,0.07*vol));
  else if(k==='poof'){ hlNoise(t,0.5,0.35*vol,900,'bandpass',0.8); hlOsc('sine',600,180,t,0.4,0.06*vol); }
  else if(k==='scare'){ hlOsc('sawtooth',150,110,t,0.9,0.22*vol,450,2); hlNoise(t,0.5,0.22*vol,1200,'bandpass',0.7); }
  else if(k==='spiders') for(let i=0;i<24;i++) hlNoise(t+Math.random()*1.4,0.025,0.12*vol,4200,'highpass');
  else if(k==='win') [523,659,784,1047,1319].forEach((f,i)=>hlOsc('triangle',f,f,t+i*0.11,0.35,0.08*vol));
}catch(e){} }
function hlVol(x,z){ return clamp(1-Math.hypot(x-P.x,z-P.z)/70,0.12,1); }

/* ---- every frame: the moon follows the camera, the fog banks stay around you, the glows face you, the doors swing ---- */
const _hlM=new THREE.Matrix4(), _hlQ=new THREE.Quaternion(), _hlV=new V3(), _hlS=new V3(), _hlE=new THREE.Euler();
function hlAmb(dt){ const cam=camera.position;
  if(HL.moon) HL.moon.position.copy(cam).addScaledVector(HL_MOON,4000);
  if(HL.fog){ let i=0; for(const f of HL.fogP){ if(!f.live||Math.hypot(f.x-P.x,f.z-P.z)>95){ const a=Math.random()*Math.PI*2, r=(f.live?55:20)+Math.random()*(f.live?38:72); f.x=P.x+Math.cos(a)*r; f.z=P.z+Math.sin(a)*r; f.live=true; }
      f.x+=0.35*dt; f.y=Math.max(W.terrain(f.x,f.z),W.waterLevel(f.x,f.z))+0.9*f.k; const dc=Math.hypot(cam.x-f.x,cam.z-f.z), fk=f.k*clamp((dc-9)/12,0.001,1); _hlE.set(0,Math.atan2(cam.x-f.x,cam.z-f.z),0); _hlQ.setFromEuler(_hlE); _hlV.set(f.x,f.y,f.z); _hlS.set(fk,fk,1); _hlM.compose(_hlV,_hlQ,_hlS); HL.fog.setMatrixAt(i++,_hlM); }
    HL.fog.instanceMatrix.needsUpdate=true; }
  if(HL.glow){ HL.gl.forEach((g,i)=>{ const s=g[3]*(g[4]?1+0.07*Math.sin(HL.t*9+i*1.7)+0.04*Math.sin(HL.t*23+i):1); _hlV.set(g[0],g[1],g[2]); _hlS.set(s,s,s); _hlM.compose(_hlV,camera.quaternion,_hlS); HL.glow.setMatrixAt(i,_hlM); }); HL.glow.instanceMatrix.needsUpdate=true; }
  for(const h of HL.houses) if(h.piv) h.piv.rotation.y=h.yaw+h.open*1.25; }

/* ---- creatures around the houses: a ghost comes out of a wall, a witch flies over the roof, bats leave the roof, a skeleton rises in the garden, a black cat crosses ---- */
function hlVillaNear(x,z,maxd){ let best=null,bd=maxd; for(const b of HL.villas){ const d=Math.hypot(b.c[0]-x,b.c[1]-z)-Math.sqrt(b.area)*0.5; if(d<bd){ bd=d; best=b; } } return best; }
function hlGround(x,z){ return Math.max(terrainAt(x,z),W.waterLevel(x,z)); }
function hlFree(x,z){ return !bldAt(x,z,0.5)&&!W.poolAt(x,z)&&W.terrain(x,z)>W.waterLevel(x,z)+0.2; }
function hlSpawn(force){ const v=hlVillaNear(P.x,P.z,75); if(!v) return null; const e=nearestEdge(v,P.x,P.z), ex=e[1], ez=e[2], nx=e[3], nz=e[4], d=Math.hypot(P.x-ex,P.z-ez), G=hlGeos();
  let k=force; if(!k){ let o=Object.keys(HL_MOB).filter(q=>q!==HL.lastMob); if(d<5) o=o.filter(q=>q!=='skel'&&q!=='cat'); k=o[(Math.random()*o.length)|0]; }
  const m={k,t:0,v,ex,ez,nx,nz};
  if(k==='skel'||k==='cat'){ const sx=ex+nx*2.6, sz=ez+nz*2.6; if(!hlFree(sx,sz)) k=m.k='ghost'; }
  if(k==='ghost'){ m.mat=new THREE.MeshLambertMaterial({vertexColors:true,transparent:true,opacity:0,emissive:Cc('#6f80ff'),emissiveIntensity:0.45,side:THREE.DoubleSide}); m.o=new THREE.Mesh(G.ghost,m.mat); m.x=ex+nx*0.2; m.z=ez+nz*0.2; m.y=hlGround(m.x,m.z)+0.4; m.life=6.5; }
  else if(k==='witch'){ const cx=v.c[0], cz=v.c[1]; let dx=-(P.z-cz), dz=P.x-cx; const L=Math.hypot(dx,dz)||1; dx/=L; dz/=L; if(Math.random()<0.5){ dx=-dx; dz=-dz; } const ox=(P.x-cx)*0.3, oz=(P.z-cz)*0.3;
    m.a=[cx+ox-dx*50,cz+oz-dz*50]; m.dir=[dx,dz]; m.h=Math.max(v.top||0,hlGround(cx,cz))+7.5; m.life=100/12; m.o=new THREE.Group(); m.o.add(new THREE.Mesh(G.witch,new THREE.MeshLambertMaterial({vertexColors:true,emissive:Cc('#4a3a70'),emissiveIntensity:0.9}))); m.o.scale.setScalar(1.6);
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:hlTex().glow,color:Cc('#c49bff'),blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,fog:false})); sp.position.set(-1.1,0,0); sp.scale.set(2.6,2.6,1); m.o.add(sp); }
  else if(k==='bats'){ m.o=new THREE.Group(); m.b=[]; const mat=new THREE.MeshBasicMaterial({vertexColors:true}), wm=new THREE.MeshBasicMaterial({color:Cc('#2c2236'),side:THREE.DoubleSide}); const y0=Math.max(v.top||0,hlGround(v.c[0],v.c[1])+3)+0.4;
    for(let i=0;i<7;i++){ const g=new THREE.Group(); g.add(new THREE.Mesh(G.bat,mat)); const wl=new THREE.Mesh(G.wing,wm), wr=new THREE.Mesh(G.wing,wm); wr.scale.z=-1; g.add(wl,wr); const a=Math.random()*Math.PI*2, sp=5+Math.random()*3;
      g.position.set(v.c[0]+Math.random()*2-1,y0,v.c[1]+Math.random()*2-1); m.o.add(g); m.b.push({g,wl,wr,vx:Math.cos(a)*sp,vz:Math.sin(a)*sp,vy:1.5+Math.random()*1.5,ph:Math.random()*6}); } m.life=4.8; }
  else if(k==='skel'){ m.o=new THREE.Group(); const mat=new THREE.MeshLambertMaterial({vertexColors:true,emissive:Cc('#3a3a48'),emissiveIntensity:0.6}); m.o.add(new THREE.Mesh(G.skel,mat)); m.arms=[]; for(const s of [-1,1]){ const a=new THREE.Group(); a.position.set(0,1.38,s*0.2); a.add(new THREE.Mesh(G.arm,mat)); m.o.add(a); m.arms.push(a); }
    m.x=ex+nx*2.6; m.z=ez+nz*2.6; m.g=hlGround(m.x,m.z); m.life=5.6; }
  else if(k==='cat'){ m.o=new THREE.Mesh(G.cat,new THREE.MeshBasicMaterial({vertexColors:true})); const tx=-nz, tz=nx, bx=ex+nx*2.4, bz=ez+nz*2.4; let L=7; while(L>2&&(!hlFree(bx-tx*L,bz-tz*L)||!hlFree(bx+tx*L,bz+tz*L))) L-=1;
    m.a=[bx-tx*L,bz-tz*L]; m.b2=[bx+tx*L,bz+tz*L]; m.L=L; m.life=L*2/5+1.8; m.o.scale.setScalar(1.5); }
  else if(k==='boo'){ m.mat=new THREE.MeshLambertMaterial({vertexColors:true,transparent:true,opacity:0.95,emissive:Cc('#8f9cff'),emissiveIntensity:0.55,side:THREE.DoubleSide}); m.o=new THREE.Mesh(G.ghost,m.mat); m.life=2.6; }
  HL.lastMob=k; HL.mobs.push(m); HL.grp.add(m.o); return m; }
function hlMobTick(dt){ for(let i=HL.mobs.length-1;i>=0;i--){ const m=HL.mobs[i]; m.t+=dt; const t=m.t, o=m.o; let dead=t>m.life||Math.hypot(P.x-(m.x||m.ex),P.z-(m.z||m.ez))>160;
    if(m.k==='ghost'){ const dx=P.x-m.x, dz=P.z-m.z, d=Math.hypot(dx,dz)||1; if(t>0.7&&t<m.life-1.4&&d>3.4){ m.x+=dx/d*2.3*dt; m.z+=dz/d*2.3*dt; } const g=hlGround(m.x,m.z); let y=g+0.55+Math.sin(t*2.2)*0.15, op=0.9, s=1.25;
      if(t<0.7){ s=0.2+1.05*t/0.7; op=0.9*t/0.7; } if(t>m.life-1.4){ const q=(t-m.life+1.4)/1.4; y+=q*q*5; op=0.9*(1-q); } m.mat.opacity=op; o.scale.setScalar(s); o.position.set(m.x,y,m.z); o.rotation.set(0,-Math.atan2(dz,dx),Math.sin(t*3)*0.08);
      if(!m.snd&&t>0.6){ m.snd=1; hlSnd('boo',hlVol(m.x,m.z)); } if(!m.sc&&d<4.6) hlScared(m); }
    else if(m.k==='witch'){ const s=t*12; m.x=m.a[0]+m.dir[0]*s; m.z=m.a[1]+m.dir[1]*s; o.position.set(m.x,m.h+Math.sin(t*1.7)*0.8,m.z); o.rotation.set(Math.sin(t*1.3)*0.12,-Math.atan2(m.dir[1],m.dir[0]),0.06+Math.sin(t*2.1)*0.05);
      const d=Math.hypot(P.x-m.x,P.z-m.z); if(!m.snd&&s>40){ m.snd=1; hlSnd('cackle',hlVol(m.x,m.z)); } if(!m.sc&&d<12) hlScared(m); }
    else if(m.k==='bats'){ const q=t>m.life-0.7?Math.max(0,(m.life-t)/0.7):Math.min(1,t/0.3); for(const b of m.b){ const turn=Math.sin(t*3+b.ph)*1.3*dt, c=Math.cos(turn), sn=Math.sin(turn), vx=b.vx*c-b.vz*sn; b.vz=b.vx*sn+b.vz*c; b.vx=vx; b.g.position.x+=b.vx*dt; b.g.position.z+=b.vz*dt; b.g.position.y+=(b.vy+Math.sin(t*6+b.ph)*1.2)*dt;
        b.g.rotation.y=-Math.atan2(b.vz,b.vx); const fl=0.25+0.95*Math.sin(t*24+b.ph); b.wl.rotation.x=-fl; b.wr.rotation.x=fl; b.g.scale.setScalar(1.6*q); }
      m.x=m.b[0].g.position.x; m.z=m.b[0].g.position.z; if(!m.snd){ m.snd=1; hlSnd('squeak',hlVol(m.x,m.z)); } }
    else if(m.k==='skel'){ const up=Math.min(1,t/0.9), dn=t>m.life-0.9?(t-m.life+0.9)/0.9:0, e=up*up*(3-2*up)*(1-dn*dn); const dance=t>0.9&&!dn, w=t*7; o.position.set(m.x,m.g-1.9*(1-e)+(dance?Math.abs(Math.sin(w))*0.12:0),m.z);
      o.rotation.set(0,-Math.atan2(P.z-m.z,P.x-m.x),dance?Math.sin(t*3.5)*0.12:0); m.arms.forEach((a,j)=>{ const sg=j?1:-1; a.rotation.set(sg*(dance?0.5+0.7*Math.sin(w+j*Math.PI):0.15),0,dance?0.9+0.6*Math.sin(w*0.5+j):0); });
      if(!m.snd&&t>0.9){ m.snd=1; hlSnd('rattle',hlVol(m.x,m.z)); } if(!m.sc&&dance&&Math.hypot(P.x-m.x,P.z-m.z)<5) hlScared(m); }
    else if(m.k==='cat'){ const run=m.L/5, stop=1.6; let f, mv=true; if(t<run){ f=t/run*0.5; } else if(t<run+stop){ f=0.5; mv=false; } else f=0.5+Math.min(1,(t-run-stop)/run)*0.5;
      m.x=m.a[0]+(m.b2[0]-m.a[0])*f; m.z=m.a[1]+(m.b2[1]-m.a[1])*f; const arch=!mv&&t>run+0.2&&t<run+stop-0.2; o.position.set(m.x,terrainAt(m.x,m.z)+(mv?Math.abs(Math.sin(t*14))*0.05:0),m.z);
      o.rotation.set(0,mv?-Math.atan2(m.b2[1]-m.a[1],m.b2[0]-m.a[0]):-Math.atan2(P.z-m.z,P.x-m.x),0); o.scale.set(1.5,arch?1.95:1.5,1.5); if(!m.snd&&!mv){ m.snd=1; hlSnd('meow',hlVol(m.x,m.z)); } if(t>m.life-0.4) o.scale.multiplyScalar(Math.max(0.01,(m.life-t)/0.4)); }
    else if(m.k==='boo'){ const cam=camera.position; let dx=cam.x-P.x, dz=cam.z-P.z; const L=Math.hypot(dx,dz)||1; dx/=L; dz/=L; const q=Math.min(1,t/0.25), up=t>1.2?(t-1.2)/1.4:0;
      o.position.set(P.x+dx*1.5,P.y+0.7+up*up*6,P.z+dz*1.5); o.scale.setScalar(1.6*q*q*(3-2*q)); o.rotation.set(0,-Math.atan2(dz,dx)+Math.sin(t*14)*0.08*(1-up),0); m.mat.opacity=0.95*(1-Math.min(1,up)); m.x=P.x; m.z=P.z; }
    else if(m.k==='poof'){ const q=Math.min(1,t/m.life); o.scale.setScalar(0.4+q*1.7); m.mat.opacity=0.7*(1-q); }
    if(dead){ HL.grp.remove(o); o.traverse(c=>{ if(c.material&&c.material.dispose) c.material.dispose(); }); HL.mobs.splice(i,1); } } }
// a little start: you hop and a tip says what it was (only on foot and not while playing a shot)
function hlScared(m){ m.sc=1; if(hlMyCos()==='fantasma') return; if(S.mode!=='walk'||S.interior||!P.onGround||HL.hop>0) return; HL.hop=4; P.vy=3.4; P.onGround=false; tip('¡Uy! Un'+(m.k==='witch'?'a bruja':m.k==='skel'?' esqueleto':m.k==='cat'?' gato negro':' fantasma')+'…',1600); }
function hlClearMobs(){ for(const m of HL.mobs){ HL.grp.remove(m.o); } HL.mobs.length=0; for(const f of HL.flies) HL.grp.remove(f.o); HL.flies.length=0; if(HL.sp){ HL.sp.mesh.visible=false; HL.sp.on=false; } }

/* ---- trick or treat: knock, a neighbour in costume opens, «¿Truco o trato?»; the treat is candy, the trick is a joke (and candy for being brave) ---- */
function hlNear(){ if(!HL.on||S.interior||P.swim) return null; const V=HL.visit; if(V){ if(Math.hypot(P.x-V.h.x,P.z-V.h.z)<=6) return V.st==='ask'?{k:'hlTrato',ref:V.h,label:'🍬 Trato'}:{k:'hlWait',ref:V.h,label:'Truco o trato…'}; if(V.st==='ask'||V.st==='knock'||V.st==='open') return null; } let best=null,bd=2.7; for(const h of HL.houses){ const d=Math.hypot(P.x-h.x,P.z-h.z); if(d<bd&&Math.abs(P.y-h.y)<2.5){ bd=d; best=h; } }
  if(!best||HL.night.v.includes(best.id)) return null; return {k:'hlKnock',ref:best,label:'Llamar a la puerta'}; }
function hlDo(k,ref){ if(k==='hlKnock') hlKnock(ref); else if(k==='hlTrato') hlChoose('trato'); }
function hlKnock(h){ if(!h||!HL.on) return; if(HL.visit){ if(['treat','trick','bye'].includes(HL.visit.st)&&HL.visit.h!==h) hlEndVisit(); else return; } ensureAudio(); hlSnd('knock'); P.vx=P.vz=0; P.yaw=Math.atan2(h.mz-P.z,h.mx-P.x); HL.visit={h,st:'knock',t:0}; }
function hlNpcAt(V,k){ const h=V.h, x=h.mx+h.nx*(0.25+0.8*k), z=h.mz+h.nz*(0.25+0.8*k); V.R.root.position.set(x,W.terrain(x,z),z); V.R.root.rotation.set(0,-Math.atan2(P.z-z,P.x-x),0); V.x=x; V.z=z; }
function hlBubble(V,txt){ if(V.bub){ HL.grp.remove(V.bub); V.bub.material.map.dispose(); V.bub.material.dispose(); V.bub=null; } if(!txt) return; const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:hlBubbleTex(txt),depthTest:false,depthWrite:false,fog:false,transparent:true})); sp.scale.set(1.9,0.475,1); sp.renderOrder=20; HL.grp.add(sp); V.bub=sp; V.say=txt; }
function hlVisitTick(dt){ const V=HL.visit; if(!V) return; V.t+=dt; const h=V.h;
  if(V.st==='knock'&&V.t>1.0){ V.st='open'; V.t=0; hlSnd('door',0.8); V.cos=HL_CK[(h.n*3+HL.night.v.length)%HL_CK.length]; V.R=buildRig(Object.assign({},SKINS[(h.n*5)%SKINS.length],{cos:V.cos,pack:null}));
    if(V.R.club) V.R.club.visible=false; const bowl=new THREE.Mesh(new THREE.SphereGeometry(0.13,14,8,0,Math.PI*2,Math.PI*0.5,Math.PI*0.5),hlMat('#e8742c',{side:THREE.DoubleSide})); bowl.position.set(0.05,-0.36,0); V.R.aR.el.add(bowl); HL.grp.add(V.R.root); hlNpcAt(V,0); }
  if(V.R){ const st=V.st==='treat'||(V.st==='trick'&&V.gave)?'cheer':'idle'; poseRig(V.R,st,HL.t,1); }
  if(V.st==='open'){ h.open=Math.min(1,V.t/0.6); hlNpcAt(V,clamp((V.t-0.3)/0.6,0,1)); if(V.t>0.95){ V.st='ask'; V.t=0; hlBubble(V,'¿Truco o trato?'); hlAskOpen(V); } }
  else if(V.st==='ask'){ hlNpcAt(V,1); if(Math.hypot(P.x-h.x,P.z-h.z)>7||V.t>40){ hlAskClose(); hlBubble(V,'¡Hasta luego!'); V.st='bye'; V.t=0; } }
  else if(V.st==='treat'){ hlNpcAt(V,1); if(V.t>2.8){ V.st='bye'; V.t=0; hlBubble(V,'¡Feliz Halloween!'); } }
  else if(V.st==='trick'){ hlNpcAt(V,1); if(!V.gave&&V.t>2.6){ V.gave=1; const n=1+((Math.random()*3)|0); hlGive(V,n); hlBubble(V,'¡Ja, ja! Toma '+n+' por valiente'); } if(V.t>4.8){ V.st='bye'; V.t=0; hlBubble(V,'¡Feliz Halloween!'); } }
  else if(V.st==='bye'){ hlNpcAt(V,1-clamp((V.t-0.6)/0.6,0,1)); h.open=1-clamp((V.t-1.1)/0.6,0,1); if(V.t>1.8) hlEndVisit(); }
  if(V.bub&&V.R) V.bub.position.set(V.x,V.R.root.position.y+2.35,V.z); }
function hlEndVisit(){ const V=HL.visit; if(!V) return; if(V.st==='trick'&&!V.gave){ V.gave=1; hlGive(V,1+((Math.random()*3)|0)); } hlBubble(V,null); if(V.R){ HL.grp.remove(V.R.root); } V.h.open=0; HL.visit=null; hlAskClose(); }
function hlAskOpen(V){ const c=V.cos==='dracula'?'Drácula':HL_COS[V.cos].n.toLowerCase(); $('hlAskTxt').innerHTML='Te abre un vecino disfrazado de <b>'+c+'</b> con un cuenco de caramelos: «¿Truco o trato?»'; $('hlAsk').hidden=false; }
function hlAskClose(){ const a=$('hlAsk'); if(a) a.hidden=true; }
function hlChoose(c){ const V=HL.visit; if(!V||V.st!=='ask') return false; hlAskClose(); hlMark(V.h); V.t=0;
  if(c==='trato'){ const n=2+((Math.random()*4)|0); V.st='treat'; hlGive(V,n); hlBubble(V,'¡Toma, '+n+' caramelos!'); }
  else { V.st='trick'; HL.pkI=(HL.pkI+1+((Math.random()*2)|0))%HL_PRANK.length; hlBubble(V,'¡Truco!'); hlPrank(HL_PRANK[HL.pkI][0]); }
  return true; }
function hlMark(h){ const N=HL.night; if(!N.v.includes(h.id)) N.v.push(h.id); hlSave();
  if(N.v.length>=HL.houses.length&&!N.done){ N.done=1; hlSave(); hlSnd('win'); toast('¡Ronda de Halloween completa!','Has llamado a las '+HL.houses.length+' casas con calabaza esta noche'); prgTrophy('halloween'); } }
function hlGive(V,n){ const N=HL.night, b0=Math.floor(N.c/10); N.c+=n; HL.tot+=n; hlSave(); const b1=Math.floor(N.c/10); if(b1>b0) prgEarn(5*(b1-b0),'Caramelos de Halloween');
  const G=hlGeos(), cols=['#e8412c','#f2c230','#3d9be9','#6fd63a','#c25bd8','#ff8ac0'];
  for(let i=0;i<n;i++){ const o=new THREE.Mesh(G.candy,hlMat(cols[(i+N.c)%cols.length],{emissive:Cc('#2a2a2a')})); o.visible=false; HL.grp.add(o); HL.flies.push({o,t:-i*0.14,x0:V.x,z0:V.z,y0:(V.R?V.R.root.position.y:P.y)+0.75}); } hlHud(); }
function hlFlyTick(dt){ for(let i=HL.flies.length-1;i>=0;i--){ const f=HL.flies[i]; f.t+=dt; if(f.t<0) continue; const q=Math.min(1,f.t/0.7); f.o.visible=true;
    f.o.position.set(f.x0+(P.x-f.x0)*q,f.y0+(P.y+0.6-f.y0)*q+Math.sin(q*Math.PI)*1.4,f.z0+(P.z-f.z0)*q); f.o.rotation.set(f.t*9,f.t*7,0);
    if(q>=1){ HL.grp.remove(f.o); f.o.material.dispose(); HL.flies.splice(i,1); hlSnd('candy',0.8); const c=$('hlHud'); if(c){ c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } } } }
// the three jokes of «truco»
function hlPrank(k){ ensureAudio();
  if(k==='susto'){ hlSpawn('boo'); hlSnd('scare'); const f=$('hlFlash'); if(f){ f.classList.add('on'); setTimeout(()=>f.classList.remove('on'),260); } tip('¡BUUU! Un fantasma te ha dado un susto',2600); }
  else if(k==='aranas'){ hlSpiders(); hlSnd('spiders'); tip('¡Lluvia de arañas de juguete!',2600); }
  else if(k==='calabaza'){ HL.pk=20; hlSnd('poof'); hlPoof(); prgApply(); tip('¡Te ha convertido en calabaza durante 20 segundos!',3200); } }
function hlPoof(){ const m=new THREE.Mesh(new THREE.SphereGeometry(1,16,10),new THREE.MeshBasicMaterial({color:Cc('#ff9a3c'),transparent:true,opacity:0.7,depthWrite:false})); m.position.set(P.x,P.y+1,P.z); HL.grp.add(m); HL.mobs.push({k:'poof',o:m,t:0,life:0.7,x:P.x,z:P.z,mat:m.material}); }
function hlSpiders(){ const n=32; if(!HL.sp){ const mesh=new THREE.InstancedMesh(hlGeos().spider,new THREE.MeshLambertMaterial({color:0xffffff}),n); mesh.frustumCulled=false; HL.grp.add(mesh); HL.sp={mesh,s:[],on:false,t:0};
    const cols=['#141416','#141416','#ff7a1a','#7b3fd1']; for(let i=0;i<n;i++){ mesh.setColorAt(i,Cc(cols[i%cols.length])); HL.sp.s.push({}); } mesh.instanceColor.needsUpdate=true; }
  const S_=HL.sp; S_.on=true; S_.t=0; S_.mesh.visible=true; for(const s of S_.s){ const a=Math.random()*Math.PI*2, r=Math.random()*2.6; s.x=P.x+Math.cos(a)*r; s.z=P.z+Math.sin(a)*r; s.y=P.y+3+Math.random()*2.5; s.vy=-Math.random()*1.5; s.land=false; s.h=Math.random()*6; s.v=0.8+Math.random()*0.7; s.d=Math.random()*0.5; } }
function hlSpTick(dt){ const S_=HL.sp; if(!S_||!S_.on) return; S_.t+=dt; let i=0; for(const s of S_.s){ if(S_.t<s.d){ _hlS.set(0.001,0.001,0.001); } else { const g=terrainAt(s.x,s.z);
      if(!s.land){ s.vy-=9.8*dt; s.y+=s.vy*dt; if(s.y<=g){ s.y=g; s.vy=-s.vy*0.32; if(Math.abs(s.vy)<0.7) s.land=true; } } else { s.h+=Math.sin(S_.t*3+s.v*9)*2*dt; s.x+=Math.cos(s.h)*s.v*dt; s.z+=Math.sin(s.h)*s.v*dt; s.y=g; }
      const k=S_.t>3.6?Math.max(0.001,(4.3-S_.t)/0.7):1; _hlS.set(1.6*k,1.6*k,1.6*k); }
    _hlE.set(0,-s.h,0); _hlQ.setFromEuler(_hlE); _hlV.set(s.x,s.y,s.z); _hlM.compose(_hlV,_hlQ,_hlS); S_.mesh.setMatrixAt(i++,_hlM); }
  S_.mesh.instanceMatrix.needsUpdate=true; if(S_.t>4.3){ S_.on=false; S_.mesh.visible=false; } }

/* ---- the candy bucket: a little carved pumpkin in your left hand (and in your friends') ---- */
function hlBucket(){ const g=new THREE.Group(), p=hlPumpkin(0.11,0.7); p.position.y=-0.2; g.add(p); const hd=new THREE.Mesh(new THREE.TorusGeometry(0.1,0.008,4,14,Math.PI),hlMat('#1d1d1f')); hd.position.y=-0.15; g.add(hd);
  const top=new THREE.Mesh(hlMerge((gg,M,A)=>{ const c=['#e8412c','#f2c230','#3d9be9','#6fd63a','#c25bd8']; for(let i=0;i<7;i++){ const a=i/7*Math.PI*2; A(new THREE.SphereGeometry(0.028,8,6),c[i%5],Math.cos(a)*0.05,0,Math.sin(a)*0.05); } }),new THREE.MeshLambertMaterial({vertexColors:true})); top.position.y=-0.13; top.visible=false; g.add(top); g.userData.top=top;
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); return g; }
function hlBucketSet(R,show,full){ if(!R) return; if(show&&!R.hlB){ R.hlB=hlBucket(); R.aL.el.add(R.hlB); } if(R.hlB){ R.hlB.visible=show; R.hlB.userData.top.visible=!!full; } }

/* ---- the frame ---- */
function hlTick(dt){ if(!WP.halloween) return; HL.t+=dt; HL.ac-=dt; if(HL.ac<=0){ HL.ac=20; hlAuto(new Date()); }
  if(!HL.on){ if(HL.pk>0){ HL.pk=0; prgApply(); } return; } HL.grp.visible=!S.interior; if(HL.hop>0) HL.hop-=dt;
  hlAmb(dt); hlVisitTick(dt); hlFlyTick(dt); hlSpTick(dt); hlMobTick(dt);
  if(HL.pk>0){ HL.pk-=dt; if(HL.pk<=0){ HL.pk=0; hlSnd('poof'); hlPoof(); prgApply(); tip('Vuelves a ser tú',2000); } }
  HL.spawnT-=dt; if(HL.spawnT<=0){ HL.spawnT=3.5+Math.random()*4.5; if(!S.interior&&!HL.visit&&!raceNow()&&['walk','drive','ride','bike','pas'].includes(S.mode)&&HL.mobs.filter(m=>m.k!=='boo'&&m.k!=='poof').length<2) hlSpawn(); }
  hlBucketSet(rig,['walk','pas'].includes(S.mode)&&!P.swim,HL.night.c>0);
  HL.hudT-=dt; if(HL.hudT<=0){ HL.hudT=0.25; hlHud(); } }

/* ---- with the room: costumes and candy travel in the state (hc, hn); «hlon» invites the others to the night ---- */
function hlCosOK(c){ return typeof c==='string'&&(c==='calabazo'||Object.prototype.hasOwnProperty.call(HL_COS,c))?c:''; }
function hlMyCos(){ const it=prgItem(PRG.eq.disfraz); return HL.pk>0?'calabazo':(it&&it.cos)||''; }
function hlNetState(o){ const c=hlMyCos(); if(c) o.hc=c; if(HL.on) o.hn=HL.night.c|0; }
function hlPeerSkin(sk,s){ const c=s&&s.hc; return c?Object.assign({},sk,{cos:c}):sk; }
function hlPeer(p,s,R,show){ p.hlN=Number.isFinite(s.hn)&&s.hn>=0?s.hn:-1; if(R) hlBucketSet(R,p.hlN>=0&&show&&s.m==='walk',p.hlN>0); }
function hlNetIn(p,o){ if(o.t==='hlon'&&WP.halloween&&!HL.on) mpPrompt('<b>'+esc(p.n)+'</b> ha empezado la noche de Halloween: calabazas, fantasmas y truco o trato por las villas. ¿Te unes?','Sí, Halloween',()=>hlSet(true,{net:true}),15000); }
function hlRank(){ const L=[{n:'Tú',c:HL.night.c,me:1}]; if(MP.code) for(const p of MP.peers.values()) if(p.hlN>=0) L.push({n:p.n||'Amigo',c:p.hlN}); L.sort((a,b)=>b.c-a.c||(b.me|0)-(a.me|0)); return L; }

/* ---- on screen: the counter, the sheet (tonight, costumes, how it works), the map and the guide ---- */
function hlHud(){ const el=$('hlHud'); if(!el) return; const show=HL.on&&!['menu','loading','photo'].includes(S.mode); el.hidden=!show; if(!show) return; const N=HL.houses.length, v=HL.night.v.length;
  $('hlT2').innerHTML='🍬 <b>'+HL.night.c+'</b> '+(HL.night.c===1?'caramelo':'caramelos')+' · 🏠 <b>'+v+'</b> de '+N+' casas'; const R=hlRank(), t3=$('hlT3');
  if(R.length>1){ t3.hidden=false; t3.textContent=R.slice(0,4).map((r,i)=>(i+1)+'. '+r.n+' '+r.c).join(' · '); } else t3.hidden=true;
  const st=$('status'); let top=8; if(st&&st.offsetParent!==null&&getComputedStyle(st).display!=='none'){ const r=st.getBoundingClientRect(); if(r.height) top=r.bottom+6; } el.style.top=top+'px'; }
function hlNext(){ let best=null,bd=1e18; for(const h of HL.houses){ if(HL.night.v.includes(h.id)) continue; const d=Math.hypot(h.x-P.x,h.z-P.z); if(d<bd){ bd=d; best=h; } } return best; }
function hlGo(h){ if(!h) return; if(!['walk','drive','ride','jet','bike','menu','drone','fly','pas','pow'].includes(S.mode)){ toast('Halloween','Termina antes el golpe o sal de donde estás'); return; } $('hlSheet').hidden=true; closeModal(); hideMap(); if(!HL.on) hlSet(true);
  fadeTo(()=>{ if(S.interior) exitVilla(); if(S.mode==='pas') pasOff(); if(S.mode==='pow'){ pwClear(); setMode('walk'); } if(P.fly){ if(!P.fly.gnd){ const A=P.fly; A.x=A.home[0]; A.y=A.home[1]; A.z=A.home[2]; A.yaw=A.home[3]; A.gnd=true; A.vf=A.vy=0; flPlace(A); } flLeave(); }
    if(P.buggy) exitBuggy(); if(P.horse) dismountHorse(); if(P.jet) dismountJet(); if(BK.b) bkUnmount({stay:true}); cirLand(); mpEnterWorld();
    const x=h.x+h.nx*1.8, z=h.z+h.nz*1.8; P.x=x; P.z=z; P.y=groundAt(x,z,h.y+3); P.vx=P.vy=P.vz=0; P.swim=false; P.onGround=true; P.yaw=Math.atan2(h.mz-z,h.mx-x); camS.yaw=P.yaw; S.snap=true; setMode('walk'); });
  setTimeout(()=>toast('Casa '+h.n+' de '+HL.houses.length,'Acércate a la puerta y pulsa «Llamar a la puerta»'),700); }
function hlCosHTML(){ const cur=PRG.eq.disfraz, its=SHOP.filter(s=>s.slot==='disfraz');
  return '<p class="note">Tienes <b>'+PRG.coins+' monedas</b>. Toca un disfraz para comprarlo o ponértelo; en una sala tus amigos te ven disfrazado. Los disfraces también están en la tienda (menú, pestaña Premios).</p><div class="shop"><button class="it'+(cur?'':' on')+'" data-hlbase="1"><span class="sw" style="background:repeating-linear-gradient(45deg,#e9e4da 0 4px,#fff 4px 8px)"></span><span>Sin disfraz<small>'+(cur?'Quitártelo':'Puesto')+'</small></span></button>'+
    its.map(it=>{ const own=prgOwned(it), on=cur===it.id, sub=on?'Puesto':own?(it.p===0?'Gratis · ponértelo':'Tuyo · ponértelo'):it.p+' monedas'+(PRG.coins<it.p?' (te faltan '+(it.p-PRG.coins)+')':''); return '<button class="it'+(on?' on':'')+(own||on?'':' lock')+'" data-hlbuy="'+it.id+'"><span class="sw" style="background:'+it.c+'"></span><span>'+it.n+'<small>'+sub+'</small></span></button>'; }).join('')+'</div>'+
    '<ul><li><b>Fantasma de sábana:</b> sábana blanca con dos agujeros; gratis.</li><li><b>Calabaza:</b> cuerpo de calabaza tallada y gorro verde con rabito.</li><li><b>Bruja:</b> sombrero de pico, melena naranja, vestido morado y escoba a la espalda.</li><li><b>Pirata:</b> sombrero con calavera, parche, camiseta de rayas, fajín y sable.</li><li><b>Momia:</b> vendas de pies a cabeza.</li><li><b>Esqueleto:</b> mono negro con huesos blancos y calavera.</li><li><b>Drácula:</b> capa negra con forro rojo, cuello alto, pelo engominado y colmillos.</li></ul>'+pwCosHTML(); }
function hlSheet(tab){ if(!WP.halloween) return; closeModal(); hlBuild(); if(!HL.on) hlLoad(); HL.tab=tab||HL.tab||'noche'; const T=HL.tab, B=$('hlBody'), N=HL.houses.length, v=HL.night.v.length;
  let h='<h2>🎃 Halloween</h2><div class="tabs">'+[['noche','Esta noche'],['disfraces','Disfraces'],['ayuda','Cómo se juega']].map(t=>'<button data-hlt="'+t[0]+'" class="'+(T===t[0]?'on':'')+'">'+t[1]+'</button>').join('')+'</div>';
  if(T==='noche'){ h+='<p>'+(HL.on?'<b>La noche de Halloween está encendida.</b> ':'')+'Es una noche de miedo suave, apta para los pequeños: anochece, sale una luna grande, hay niebla baja y '+N+' villas tienen <b>calabazas encendidas</b> en la puerta. Llama y un vecino disfrazado te dirá «¿Truco o trato?».</p>';
    h+='<p class="note">Se enciende sola al anochecer del 25 al 31 de octubre; cualquier otro día, con este botón. Al apagarla vuelven tu hora y tu música.</p><div class="row"><button class="btn small primary" id="hlOn">'+(HL.on?'Apagar Halloween':'Encender la noche de Halloween')+'</button>'+(HL.on&&v<N?'<button class="btn small" id="hlNext">Ir a la casa más cercana sin visitar</button>':'')+'</div>';
    h+='<div class="tablewrap"><table class="card"><tbody><tr><td>Caramelos esta noche</td><td class="num"><b>'+HL.night.c+'</b></td></tr><tr><td>Casas visitadas esta noche</td><td class="num">'+v+' de '+N+'</td></tr><tr><td>Caramelos en total (todas las noches)</td><td class="num">'+HL.tot+'</td></tr><tr><td>Mejor noche</td><td class="num">'+HL.best+'</td></tr><tr><td>Trofeo «Noche de Halloween completa»</td><td class="num">'+(PRG.tro.halloween?'Conseguido':'Llama a las '+N+' casas en una noche')+'</td></tr></tbody></table></div>';
    const R=hlRank(); if(R.length>1) h+='<h3>Caramelos de la sala</h3><div class="tablewrap"><table class="card"><thead><tr><th>Puesto</th><th>Jugador</th><th>Caramelos</th></tr></thead><tbody>'+R.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.n)+'</td><td class="num">'+r.c+'</td></tr>').join('')+'</tbody></table></div>';
    h+='<h3>Las casas con calabaza</h3><p class="note">Numeradas como una ruta desde el hotel. En el mapa, naranjas las que te faltan y grises las visitadas esta noche.</p><div class="tablewrap"><table class="card"><thead><tr><th>Casa</th><th>Esta noche</th><th>Distancia</th><th></th></tr></thead><tbody>'+
      HL.houses.map((q,i)=>{ const ok=HL.night.v.includes(q.id); return '<tr><td>'+q.n+'</td><td>'+(ok?'✓ visitada':'por visitar')+'</td><td class="num">'+fmt(Math.hypot(q.x-P.x,q.z-P.z))+' m</td><td><button class="btn small" data-hlgo="'+i+'">Ir</button></td></tr>'; }).join('')+'</tbody></table></div>'; }
  else if(T==='disfraces') h+=hlCosHTML();
  else { h+='<h3>Cómo se juega</h3><ul><li><b>Encender:</b> botón <b>Halloween</b> del menú o del inicio (en la semana de Halloween, solo, al anochecer). La hora pasa a anochecer y suena la emisora Halloween.</li><li><b>Truco o trato:</b> acércate andando a la puerta de una casa con calabazas y pulsa <b>Llamar a la puerta</b>. Sale un vecino disfrazado: <b>Trato</b> te da de 2 a 5 caramelos; <b>Truco</b> es una broma y después te da de 1 a 3 caramelos por valiente.</li><li><b>Las bromas:</b> un susto (un fantasma te dice «¡BUUU!»), una lluvia de arañas de juguete, o te convierte en calabaza 20 segundos.</li><li><b>Cada casa, una vez por noche.</b> Si llamas a todas en la misma noche ganas el trofeo «Noche de Halloween completa». Cada 10 caramelos de una noche dan 5 monedas.</li><li><b>Disfraces:</b> pestaña Disfraces o tienda. El fantasma es gratis.</li><li><b>Poderes:</b> cada disfraz tiene un poder (botón <b>Poder</b>, △ / Y o tecla Q): la momia se columpia con vendas, la bruja vuela en escoba, Drácula se hace murciélago, el fantasma atraviesa paredes, el esqueleto se desmonta, la calabaza rueda y el pirata sale disparado de un cañón. Están explicados en la pestaña Disfraces.</li></ul>';
    h+='<h3>Qué aparece por las casas</h3><ul><li><b>Fantasma:</b> sale de una pared, se te acerca flotando, dice «buuu» y se va hacia arriba.</li><li><b>Bruja en escoba:</b> pasa volando por encima de los tejados riéndose.</li><li><b>Murciélagos:</b> salen en bandada de un tejado.</li><li><b>Esqueleto:</b> sale del jardín, baila un poco y se vuelve a meter.</li><li><b>Gato negro:</b> cruza delante de la casa, se para, arquea el lomo, maúlla y se va.</li></ul><p class="note">Asustan un poco (das un saltito) y se van solos; no hacen nada más.</p>';
    h+='<h3>Cómo se lee</h3><ul><li><b>Contador</b> (arriba a la izquierda, bajo el título): caramelos de esta noche y casas visitadas de las '+N+'. En una sala, la línea de abajo es la clasificación de caramelos.</li><li><b>Calabazas encendidas</b> y un farol sobre la puerta: esa casa reparte caramelos. Su brillo se ve de lejos a través de la niebla.</li><li><b>Mapa:</b> círculo naranja = casa por visitar (con su número en el mapa grande); gris = visitada esta noche.</li><li><b>Cesta:</b> la calabacita de tu mano izquierda; se llena de caramelos de colores cuando tienes alguno.</li></ul>';
    h+='<h3>Con amigos</h3><p>Al encender Halloween en una sala, a tus amigos les sale «¿Te unes?». Os veis disfrazados, cada uno con su cesta, y el contador compara los caramelos de la noche.</p>'; }
  h+='<div class="row"><button class="btn small" id="hlClose">Cerrar</button></div>'; B.innerHTML=h; $('hlSheet').hidden=false; $('hlSheet').scrollTop=0;
  B.querySelectorAll('[data-hlt]').forEach(b=>b.onclick=()=>hlSheet(b.dataset.hlt)); $('hlClose').onclick=()=>{ $('hlSheet').hidden=true; };
  const on=$('hlOn'); if(on) on.onclick=()=>{ ensureAudio(); hlSet(!HL.on); if(HL.on&&S.mode==='menu'){ hlGo(hlNext()||HL.houses[0]); return; } hlSheet('noche'); };
  const nx=$('hlNext'); if(nx) nx.onclick=()=>hlGo(hlNext());
  B.querySelectorAll('[data-hlgo]').forEach(b=>b.onclick=()=>hlGo(HL.houses[+b.dataset.hlgo]));
  B.querySelectorAll('[data-hlbuy]').forEach(b=>b.onclick=()=>{ const r=prgBuy(b.dataset.hlbuy), it=prgItem(b.dataset.hlbuy); if(r==='poor') toast('Te faltan '+(it.p-PRG.coins)+' monedas','Gana monedas con birdies, circuitos, retos… y caramelos'); else if(r==='buy') toast('¡'+it.n+'!','Comprado y puesto'); hlSheet('disfraces'); });
  const bb=B.querySelector('[data-hlbase]'); if(bb) bb.onclick=()=>{ prgBase('disfraz'); hlSheet('disfraces'); }; }
function hlDrawMap(g,m2c,s,big){ if(!HL.on||!HL.houses.length) return; g.save(); const r=(big?5.2:3)*s;
  for(const h of HL.houses){ const ok=HL.night.v.includes(h.id), [x,y]=m2c(h.x,h.z); g.fillStyle=ok?'#9aa0a6':'#f07f1e'; g.strokeStyle='#fff'; g.lineWidth=1.3*s; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); g.stroke();
    if(!ok){ g.fillStyle='#4e7a1e'; g.fillRect(x-0.6*s,y-r-1.6*s,1.2*s,2*s); } if(big){ g.fillStyle=ok?'#fff':'#2b1405'; g.font='800 '+(5.6*s)+'px system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(ok?'✓':String(h.n),x,y+0.4*s); } }
  g.restore(); }
function hlLegend(){ if(!HL.on) return ''; return '<div><i class="dot" style="background:#f07f1e;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></i>Casa con calabaza: llama a la puerta (truco o trato)</div><div><i class="dot" style="background:#9aa0a6;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></i>Casa ya visitada esta noche</div>'; }
function hlGuideHTML(){ if(!WP.halloween) return ''; return '<li><b>Halloween</b> (botón <b>Halloween</b> del menú o del inicio; en la semana del 25 al 31 de octubre se enciende solo al anochecer). Noche de miedo suave: luna grande, niebla baja, música propia y '+((WP.halloween.houses)||20)+' villas con <b>calabazas encendidas</b> en la puerta. Junto a una, <b>Llamar a la puerta</b>: un vecino disfrazado pregunta «¿Truco o trato?». <b>Trato</b> da caramelos; <b>Truco</b> es una broma (un susto, lluvia de arañas de juguete o convertirte en calabaza) y luego caramelos por valiente. Cada casa una vez por noche; si las visitas todas, trofeo. Por las casas aparecen fantasmas, brujas en escoba, murciélagos, esqueletos y gatos negros, que asustan un poco y se van. El contador de arriba a la izquierda lleva caramelos y casas; en el mapa, naranja = por visitar y gris = visitada. <b>Disfraces</b> (Drácula, bruja, momia, esqueleto, fantasma, calabaza, pirata, hombre lobo y araña) en la pestaña Disfraces o en la tienda; en una sala os veis disfrazados y competís por caramelos.</li>'; }
function hlGlossHTML(){ return '<dt>Disfraz</dt><dd>Ropa de Halloween que se pone encima de tu personaje: Drácula, bruja, momia, esqueleto, fantasma de sábana, calabaza, pirata, hombre lobo o araña. En una sala la ven tus amigos.</dd>'+(WP.halloween?'<dt>Truco o trato</dt><dd>Costumbre de Halloween: llamas a una puerta y te preguntan si quieres trato (caramelos) o truco (una broma).</dd><dt>Calabaza encendida</dt><dd>Calabaza tallada con una cara y una luz dentro; aquí marca las casas que reparten caramelos.</dd><dt>Noche de Halloween</dt><dd>La noche del 31 de octubre; en el juego, la semana del 25 al 31 al anochecer, o cuando enciendes el modo.</dd>':''); }
{ const mh=$('mHallo'); if(mh){ mh.hidden=!WP.halloween; mh.onclick=()=>{ saveName(); ensureAudio(); hlSheet('noche'); }; } }
{ const a=$('hlTrato'), b=$('hlTruco'), c=$('hlHud'); if(a) a.onclick=()=>hlChoose('trato'); if(b) b.onclick=()=>hlChoose('truco'); if(c) c.onclick=()=>hlSheet('noche'); }
