
/* ================= villa interiors v2: built on entering, from the Catastro footprint ================= */
/* Real window openings (you see the island outside and the sun comes in and draws its patches), rooms split by
   partition walls with doorways, physically based materials lit by a capture of the room itself, detailed
   furniture, lamps that glow, a fireplace that flickers, a first-person visit and a floor plan with legend.
   8 decoration styles, one per villa. */
const THEMES=[
  {id:'rustico',n:'Rústico extremeño',floor:'cotto',fc:'#b27657',wall:'#f1e9da',acc:'#6c7b3b',wood:'#6a4528',wood2:'#3d2a1c',fab:'#8b5a39',fab2:'#c9a46a',metal:'#3a3530',stone:'#8e8577',rug:['kilim','#a3442c','#e2c58f','#3b4a2a'],curtain:'#e8dcc4',pot:'#b5643f',special:'fireplace',beams:true},
  {id:'moderno',n:'Moderno',floor:'concrete',fc:'#bdbab4',wall:'#f8f8f6',acc:'#1f2328',wood:'#cfc6b8',wood2:'#2a2b2d',fab:'#e6e3dd',fab2:'#3c4a57',metal:'#1f2124',stone:'#ece9e3',rug:['stripe','#9aa0a6','#e7e5e0','#3c4a57'],curtain:'#f0eee9',pot:'#e9e6df',special:'art'},
  {id:'nordico',n:'Nórdico',floor:'planks',fc:'#d9c4a2',wall:'#eeeeeb',acc:'#7b8d7a',wood:'#e3d0ae',wood2:'#b89a70',fab:'#c8c4bc',fab2:'#8aa39a',metal:'#d6d6d6',stone:'#f1efe9',rug:['geo','#e9e4da','#8a8f86','#c9b79a'],curtain:'#f4f2ec',pot:'#f2efe8',special:'plants'},
  {id:'medit',n:'Mediterráneo',floor:'terrazzo',fc:'#e9e3d7',wall:'#fcfbf7',acc:'#2f6fa8',wood:'#c8a87b',wood2:'#8a6a45',fab:'#e8eef6',fab2:'#2f6fa8',metal:'#9aa3ab',stone:'#efe8da',rug:['stripe','#2f6fa8','#f4f1ea','#d9c7a5'],curtain:'#ffffff',pot:'#2f6fa8',special:'sea'},
  {id:'golf',n:'Club de golf',floor:'herring',fc:'#6b4529',wall:'#3e5b44',acc:'#c9a24a',wood:'#4a2f1d',wood2:'#7a4a2a',fab:'#7b3c23',fab2:'#2f4a35',metal:'#c9a24a',stone:'#2d2a26',rug:['persian','#8c2f2a','#d9b37a','#23314a'],curtain:'#c9b38a',pot:'#2f4a35',special:'putting'},
  {id:'familia',n:'Familiar',floor:'planks',fc:'#cfb99c',wall:'#f4f0e7',acc:'#e8742c',wood:'#dabb8c',wood2:'#9b7a52',fab:'#5aa3d6',fab2:'#f2c230',metal:'#e8742c',stone:'#f0ece4',rug:['dots','#f2c230','#fffaf0','#5aa3d6'],curtain:'#fff7e8',pot:'#e8742c',special:'kids'},
  {id:'juegos',n:'Sala de juegos',floor:'concrete',fc:'#55585d',wall:'#b4654a',acc:'#d6442a',wood:'#3c2b21',wood2:'#6b4a33',fab:'#26292d',fab2:'#d6442a',metal:'#151719',stone:'#2a2c2f',rug:['stripe','#2a2d31','#d6442a','#f2c230'],curtain:'#3a3d42',pot:'#2a2d31',special:'games',brick:true},
  {id:'zen',n:'Zen',floor:'tatami',fc:'#cbbb8c',wall:'#ede7d9',acc:'#8a2b20',wood:'#3b2b1d',wood2:'#7a5a3a',fab:'#d9d0be',fab2:'#8a2b20',metal:'#2b2b2b',stone:'#d8d2c4',rug:['plain','#cbbb8c','#b9a978','#8a2b20'],curtain:'#efe9da',pot:'#2b2b2b',special:'zen'}
];
const SPECIAL_ROOM={fireplace:'Estudio',art:'Estudio',plants:'Invernadero',sea:'Cuarto de invitados',putting:'Estudio de golf',kids:'Cuarto de los niños',games:'Sala de juegos',zen:'Sala zen'};
function themeFor(b){ let h=0; for(const ch of String(b.id)) h=(h*31+ch.charCodeAt(0))>>>0; return THEMES[h%THEMES.length]; }
// room lights live in the scene only while you are inside (outdoors they would cost on every pixel)
const intLights=[0,1,2,3].map(()=>{ const l=new THREE.PointLight(0xffd2a0,0,11,2); l.userData.on=false; return l; });
const winLights=[0,1].map(()=>{ const l=new THREE.PointLight(0xdfeaff,0,10,2); l.userData.on=false; return l; });
const fireLight=new THREE.PointLight(0xff8a3c,0,9,2); fireLight.userData.on=false;
const ROOMLIGHTS=[...intLights,...winLights,fireLight];

/* ---- procedural textures, cached per colour ---- */
const _tx=new Map(); function txc(key,fn){ if(!_tx.has(key)) _tx.set(key,fn()); return _tx.get(key); }
function hexRGB(h){ const c=new THREE.Color(h); return [c.r*255|0,c.g*255|0,c.b*255|0]; }
function shadeHex(h,k){ const [r,g,b]=hexRGB(h); const f=v=>Math.max(0,Math.min(255,Math.round(v*k))); return 'rgb('+f(r)+','+f(g)+','+f(b)+')'; }
function linTex(t){ t.encoding=THREE.LinearEncoding; return t; }
const FLOOR_SCALE={planks:3.2,herring:4.8,cotto:1.6,terrazzo:2.4,concrete:4.0,tatami:1.8};
function softBlob(g,w,h,x,y,r,rgb,a){ for(const ox of [-w,0,w]) for(const oy of [-h,0,h]){ const cx=x+ox, cy=y+oy; if(cx+r<0||cx-r>w||cy+r<0||cy-r>h) continue; const gr=g.createRadialGradient(cx,cy,0,cx,cy,r); gr.addColorStop(0,'rgba('+rgb+','+a+')'); gr.addColorStop(1,'rgba('+rgb+',0)'); g.fillStyle=gr; g.fillRect(cx-r,cy-r,2*r,2*r); } }
function floorTexs(pat,col){ return txc('fl'+pat+col,()=>{ const R=rng(pat.length*131+col.length*7);
  const map=canvasTex(1024,1024,(g,w,h)=>{ g.fillStyle=col; g.fillRect(0,0,w,h);
    if(pat==='planks'){ for(let i=0;i<8;i++){ let y=-R()*200; while(y<h){ const L=180+R()*320; g.fillStyle=shadeHex(col,0.86+R()*0.26); g.fillRect(i*128+2,y+2,124,L-3);
        for(let k=0;k<9;k++){ g.strokeStyle=shadeHex(col,0.78+R()*0.12); g.globalAlpha=0.35; g.lineWidth=1+R()*1.5; g.beginPath(); const xx=i*128+8+R()*112; g.moveTo(xx,y+6); g.bezierCurveTo(xx+(R()-0.5)*12,y+L*0.3,xx+(R()-0.5)*12,y+L*0.7,xx+(R()-0.5)*8,y+L-6); g.stroke(); g.globalAlpha=1; } y+=L; } } }
    else if(pat==='herring'){ const s=64; for(let j=-2;j<18;j++) for(let i=-2;i<18;i++){ const x=i*s, y=j*s+((i%2)?s/2:0); g.save(); g.translate(x+s/2,y+s/2); g.rotate((i+j)%2?Math.PI/4:-Math.PI/4); g.fillStyle=shadeHex(col,0.82+R()*0.3); g.fillRect(-s*0.7,-s*0.18,s*1.4,s*0.34); g.restore(); } }
    else if(pat==='cotto'){ for(let i=0;i<4;i++) for(let j=0;j<4;j++){ g.fillStyle=shadeHex(col,0.9+R()*0.14); g.fillRect(i*256+5,j*256+5,246,246); for(let k=0;k<260;k++){ g.fillStyle='rgba(60,30,15,'+(R()*0.08)+')'; g.fillRect(i*256+5+R()*240,j*256+5+R()*240,2+R()*6,2+R()*6); } }
      g.strokeStyle='#cdbba3'; g.lineWidth=9; for(let i=0;i<=4;i++){ g.beginPath(); g.moveTo(i*256,0); g.lineTo(i*256,h); g.stroke(); g.beginPath(); g.moveTo(0,i*256); g.lineTo(w,i*256); g.stroke(); } }
    else if(pat==='terrazzo'){ speckle(g,w,h,15000,77,['rgba(120,110,95,0.55)','rgba(200,190,170,0.65)','rgba(70,90,110,0.4)','rgba(255,255,255,0.7)','rgba(180,120,90,0.4)']); }
    else if(pat==='concrete'){ for(let k=0;k<260;k++){ const x=R()*w, y=R()*h, r=30+R()*120; softBlob(g,w,h,x,y,r,R()<0.5?'255,255,255':'0,0,0',0.025+R()*0.03); }
      speckle(g,w,h,26000,31,['rgba(255,255,255,0.10)','rgba(0,0,0,0.08)','rgba(90,90,90,0.07)']); g.strokeStyle='rgba(0,0,0,0.12)'; g.lineWidth=2; for(const p of [0,512]){ g.beginPath(); g.moveTo(p,0); g.lineTo(p,h); g.stroke(); g.beginPath(); g.moveTo(0,p); g.lineTo(w,p); g.stroke(); } }
    else if(pat==='tatami'){ for(const [x,y,ww,hh] of [[0,0,512,1024],[512,0,512,512],[512,512,512,512]]){ g.fillStyle=shadeHex(col,0.9+R()*0.14); g.fillRect(x+6,y+6,ww-12,hh-12); for(let k=0;k<120;k++){ g.strokeStyle='rgba(90,70,30,0.12)'; g.lineWidth=1; g.beginPath(); const yy=y+10+k*(hh-20)/120; g.moveTo(x+10,yy); g.lineTo(x+ww-10,yy); g.stroke(); } g.strokeStyle='#3d2e1c'; g.lineWidth=14; g.strokeRect(x+7,y+7,ww-14,hh-14); } } },true);
  const rough=linTex(canvasTex(512,512,(g,w,h)=>{ const base=pat==='concrete'?85:pat==='terrazzo'?70:pat==='cotto'?170:pat==='tatami'?230:pat==='herring'?95:110; g.fillStyle='rgb(0,'+base+',0)'; g.fillRect(0,0,w,h);
    for(let k=0;k<900;k++){ g.fillStyle='rgba(0,'+(base+(R()-0.5)*90|0)+',0,0.25)'; const r=3+R()*30; g.beginPath(); g.arc(R()*w,R()*h,r,0,7); g.fill(); }
    if(pat==='cotto'){ g.strokeStyle='rgb(0,250,0)'; g.lineWidth=5; for(let i=0;i<=4;i++){ g.beginPath(); g.moveTo(i*128,0); g.lineTo(i*128,h); g.stroke(); g.beginPath(); g.moveTo(0,i*128); g.lineTo(w,i*128); g.stroke(); } } },true));
  return {map,rough}; }); }
function plasterTex(col){ return txc('pl'+col,()=>canvasTex(512,512,(g,w,h)=>{ g.fillStyle=col; g.fillRect(0,0,w,h); const R=rng(41); const lum=new THREE.Color(col).getHSL({}).l; const k0=lum>0.85?0.012:0.022; for(let k=0;k<160;k++){ softBlob(g,w,h,R()*w,R()*h,20+R()*70,R()<0.5?'255,255,255':'0,0,0',k0*1.6); } speckle(g,w,h,9000,43,['rgba(255,255,255,'+(k0*3)+')','rgba(0,0,0,'+(k0*2.5)+')']); },true)); }
function brick2Tex(){ return txc('brick2',()=>canvasTex(1024,1024,(g,w,h)=>{ g.fillStyle='#cfc2b2'; g.fillRect(0,0,w,h); const R=rng(5);
  for(let r=0;r<32;r++) for(let c=-1;c<9;c++){ const x=c*128+(r%2?64:0), y=r*32; g.fillStyle='rgb('+(140+R()*50|0)+','+(72+R()*28|0)+','+(52+R()*22|0)+')'; g.fillRect(x+4,y+4,120,25); for(let k=0;k<6;k++){ g.fillStyle='rgba(0,0,0,'+(R()*0.12)+')'; g.fillRect(x+4+R()*110,y+4+R()*20,4+R()*10,3+R()*5); } } },true)); }
function woodTex(col){ return txc('wd'+col,()=>canvasTex(512,512,(g,w,h)=>{ g.fillStyle=col; g.fillRect(0,0,w,h); const R=rng(col.length*13+3);
  for(let k=0;k<90;k++){ g.strokeStyle=shadeHex(col,0.7+R()*0.25); g.globalAlpha=0.25+R()*0.25; g.lineWidth=1+R()*3; g.beginPath(); const y=R()*h; g.moveTo(0,y); for(let x=0;x<=w;x+=32) g.lineTo(x,y+Math.sin(x*0.02+k)*6+(R()-0.5)*3); g.stroke(); } g.globalAlpha=1; },true)); }
function fabricTex(col){ return txc('fb'+col,()=>canvasTex(256,256,(g,w,h)=>{ g.fillStyle=col; g.fillRect(0,0,w,h); for(let y=0;y<h;y+=2){ g.fillStyle='rgba(0,0,0,'+(0.035+0.03*((y/2)%2))+')'; g.fillRect(0,y,w,1); } for(let x=0;x<w;x+=2){ g.fillStyle='rgba(255,255,255,0.03)'; g.fillRect(x,0,1,h); } speckle(g,w,h,1500,9,['rgba(255,255,255,0.05)','rgba(0,0,0,0.05)']); },true)); }
function stoneTex(col){ return txc('st'+col,()=>canvasTex(512,512,(g,w,h)=>{ g.fillStyle=col; g.fillRect(0,0,w,h); const R=rng(23); for(let k=0;k<40;k++){ g.strokeStyle='rgba(120,110,100,'+(0.08+R()*0.15)+')'; g.lineWidth=0.6+R()*1.6; g.beginPath(); let x=R()*w, y=R()*h; g.moveTo(x,y); for(let s=0;s<8;s++){ x+=(R()-0.3)*70; y+=(R()-0.5)*40; g.lineTo(x,y); } g.stroke(); } speckle(g,w,h,3000,4,['rgba(255,255,255,0.08)','rgba(0,0,0,0.06)']); },true)); }
function rugTex(r){ return txc('rug'+r.join(),()=>canvasTex(512,512,(g,w,h)=>{ const [kind,a,b,c]=r; g.fillStyle=a; g.fillRect(0,0,w,h); const R=rng(17);
  if(kind==='stripe'){ for(let y=0;y<h;y+=64){ g.fillStyle=b; g.fillRect(0,y+8,w,18); g.fillStyle=c; g.fillRect(0,y+34,w,6); } }
  else if(kind==='geo'){ g.strokeStyle=b; g.lineWidth=6; for(let i=-4;i<12;i++){ g.beginPath(); g.moveTo(i*64,0); g.lineTo(i*64+256,h); g.stroke(); g.beginPath(); g.moveTo(i*64+256,0); g.lineTo(i*64,h); g.stroke(); } g.fillStyle=c; for(let k=0;k<40;k++) g.fillRect(R()*w,R()*h,8,8); }
  else if(kind==='kilim'||kind==='persian'){ g.strokeStyle=b; g.lineWidth=14; g.strokeRect(24,24,w-48,h-48); g.strokeStyle=c; g.lineWidth=6; g.strokeRect(50,50,w-100,h-100); for(let j=0;j<5;j++) for(let i=0;i<5;i++){ const x=100+i*78, y=100+j*78; g.fillStyle=(i+j)%2?b:c; g.beginPath(); g.moveTo(x,y-26); g.lineTo(x+26,y); g.lineTo(x,y+26); g.lineTo(x-26,y); g.fill(); } }
  else if(kind==='dots'){ for(let k=0;k<70;k++){ g.fillStyle=k%2?b:c; g.beginPath(); g.arc(R()*w,R()*h,10+R()*22,0,7); g.fill(); } }
  else { g.strokeStyle=b; g.lineWidth=10; g.strokeRect(14,14,w-28,h-28); }
  speckle(g,w,h,9000,3,['rgba(255,255,255,0.06)','rgba(0,0,0,0.08)']); for(let x=0;x<w;x+=3){ g.fillStyle='rgba(0,0,0,0.04)'; g.fillRect(x,0,1,h); } })); }
function leafTex(){ return txc('leaf',()=>canvasTex(256,256,(g,w,h)=>{ g.clearRect(0,0,w,h); const R=rng(61);
  for(let k=0;k<46;k++){ const x=34+R()*188, y=34+R()*188, a=R()*Math.PI*2, L=24+R()*30; g.save(); g.translate(x,y); g.rotate(a); const gr=g.createLinearGradient(-L,0,L,0); gr.addColorStop(0,'#2e5a22'); gr.addColorStop(1,'#64983e'); g.fillStyle=gr; g.beginPath(); g.ellipse(0,0,L,L*0.34,0,0,7); g.fill(); g.strokeStyle='rgba(20,40,10,0.5)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(-L,0); g.lineTo(L,0); g.stroke(); g.restore(); } })); }
function screenTex(){ return txc('screen',()=>canvasTex(512,288,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#9fc7e8'); gr.addColorStop(0.45,'#d8ecf7'); gr.addColorStop(0.46,'#5b8f3a'); gr.addColorStop(1,'#3f7a2e'); g.fillStyle=gr; g.fillRect(0,0,w,h);
  g.fillStyle='#6fae4a'; g.beginPath(); g.ellipse(w*0.62,h*0.62,110,34,0,0,7); g.fill(); g.fillStyle='#e6d6a8'; g.beginPath(); g.ellipse(w*0.4,h*0.72,46,14,0,0,7); g.fill(); g.fillStyle='#ffffff'; g.fillRect(w*0.66,h*0.4,3,56); g.fillStyle='#d6442a'; g.fillRect(w*0.66+3,h*0.4,26,16);
  g.fillStyle='rgba(0,0,0,0.55)'; g.fillRect(0,h-40,w,40); g.fillStyle='#fff'; g.font='700 22px Figtree, sans-serif'; g.fillText(WP.T.poster||'Valdecañas Open · Hoyo 17 · Par 3',16,h-13); })); }
function paintingTex(k){ return txc('paint'+k,()=>canvasTex(256,192,(g,w,h)=>{ const R=rng(300+k*13);
    if(k%4===0){ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#f2c38f'); gr.addColorStop(0.55,'#e88a5a'); gr.addColorStop(0.56,'#3c6f8a'); gr.addColorStop(1,'#22465c'); g.fillStyle=gr; g.fillRect(0,0,w,h); g.fillStyle='#fff3c9'; g.beginPath(); g.arc(w*0.65,h*0.5,22,0,7); g.fill(); g.fillStyle='#2d3b2c'; g.beginPath(); g.moveTo(0,h*0.56); g.lineTo(w*0.3,h*0.4); g.lineTo(w*0.55,h*0.56); g.fill(); }
    else if(k%4===1){ g.fillStyle='#f4efe6'; g.fillRect(0,0,w,h); const cols=['#d6442a','#2a6f87','#f2c230','#1f2328','#7b8d7a']; for(let i=0;i<7;i++){ g.fillStyle=cols[(R()*cols.length)|0]; g.fillRect(R()*w*0.8,R()*h*0.8,30+R()*90,20+R()*70); } }
    else if(k%4===2){ g.fillStyle='#cfe3ef'; g.fillRect(0,0,w,h); g.fillStyle='#2f6fa8'; g.fillRect(0,h*0.6,w,h*0.4); g.fillStyle='#fff'; g.beginPath(); g.moveTo(w*0.45,h*0.58); g.lineTo(w*0.45,h*0.2); g.lineTo(w*0.62,h*0.56); g.fill(); g.fillStyle='#7a4a2a'; g.fillRect(w*0.36,h*0.58,w*0.3,10); }
    else { g.fillStyle='#e9e1cf'; g.fillRect(0,0,w,h); g.fillStyle='#4f7a3a'; for(let i=0;i<5;i++){ g.beginPath(); g.ellipse(40+i*45,h*0.55+(R()-0.5)*30,18+R()*12,30+R()*20,0,0,7); g.fill(); } g.fillStyle='#a37b4a'; g.fillRect(0,h*0.8,w,h*0.2); } })); }

/* ---- geometry: rounded boxes and primitives merged per material, box-projected UVs ---- */
const _geo=new Map();
function rboxGeo(sx,sy,sz,r){ r=Math.max(0,Math.min(r,sx/2-0.002,sy/2-0.002,sz/2-0.002)); const key=[sx,sy,sz,r].map(v=>v.toFixed(3)).join(','); if(_geo.has(key)) return _geo.get(key);
  const hs=[sx/2,sy/2,sz/2]; const ax=h=>{ if(r<0.004) return [-h,h]; const a=[-h]; for(let k=1;k<=3;k++) a.push(-h+r-r*Math.cos(k/3*Math.PI/2)); if(h-r>-h+r+0.001) a.push(h-r); for(let k=2;k>=0;k--) a.push(h-r+r*Math.cos(k/3*Math.PI/2)); return a.filter((v,i,arr)=>i===0||v>arr[i-1]+1e-5); };
  const L=[ax(hs[0]),ax(hs[1]),ax(hs[2])]; const pos=[], nor=[];
  const P=(p)=>{ const q=[0,0,0], d=[0,0,0]; for(let k=0;k<3;k++){ const lim=hs[k]-r; q[k]=Math.max(-lim,Math.min(lim,p[k])); d[k]=p[k]-q[k]; } const l=Math.hypot(d[0],d[1],d[2])||1; return {p:[q[0]+d[0]/l*r,q[1]+d[1]/l*r,q[2]+d[2]/l*r],n:[d[0]/l,d[1]/l,d[2]/l]}; };
  const face=(axis,sign)=>{ const a1=(axis+1)%3, a2=(axis+2)%3; const A=L[a1], B=L[a2];
    for(let i=0;i<A.length-1;i++) for(let j=0;j<B.length-1;j++){ const cs=[[A[i],B[j]],[A[i+1],B[j]],[A[i+1],B[j+1]],[A[i],B[j+1]]].map(([u,v])=>{ const p=[0,0,0]; p[axis]=sign*hs[axis]; p[a1]=u; p[a2]=v; if(r<0.004){ const n=[0,0,0]; n[axis]=sign; return {p,n}; } return P(p); });
      const tri=(x,y,z)=>{ for(const c of [x,y,z]){ pos.push(...c.p); nor.push(...c.n); } };
      if(sign>0){ tri(cs[0],cs[1],cs[2]); tri(cs[0],cs[2],cs[3]); } else { tri(cs[0],cs[2],cs[1]); tri(cs[0],cs[3],cs[2]); } } };
  for(let k=0;k<3;k++){ face(k,1); face(k,-1); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); _geo.set(key,g); return g; }
function flipGeo(src){ const g=src.clone(); const p=g.attributes.position.array, n=g.attributes.normal.array;
  for(let i=0;i<p.length;i+=9) for(let k=0;k<3;k++){ let t=p[i+3+k]; p[i+3+k]=p[i+6+k]; p[i+6+k]=t; t=n[i+3+k]; n[i+3+k]=n[i+6+k]; n[i+6+k]=t; }
  for(let i=0;i<n.length;i++) n[i]=-n[i]; return g; }
const _ucyl=new THREE.CylinderGeometry(0.5,0.5,1,20,1).translate(0,0.5,0).toNonIndexed(), _usph=new THREE.SphereGeometry(0.5,18,12).toNonIndexed(), _uoct=new THREE.IcosahedronGeometry(0.5,1);
const _ucone=new THREE.ConeGeometry(0.5,1,20,1,true).translate(0,0.5,0).toNonIndexed(), _uconeIn=flipGeo(_ucone);
class IB{ constructor(uvs){ this.p=[]; this.n=[]; this.u=[]; this.uvs=uvs||1.2; }
  add(src,x,y,z,a,sx,sy,sz){ const P=src.attributes.position, N=src.attributes.normal; const c=Math.cos(a||0), s=Math.sin(a||0); sx=sx||1; sy=sy||1; sz=sz||1; const uvs=this.uvs;
    for(let i=0;i<P.count;i++){ const px=P.getX(i)*sx, py=P.getY(i)*sy, pz=P.getZ(i)*sz; const wx=x+px*c-pz*s, wy=y+py, wz=z+px*s+pz*c; this.p.push(wx,wy,wz);
      let nx=N.getX(i)/sx, ny=N.getY(i)/sy, nz=N.getZ(i)/sz; const l=Math.hypot(nx,ny,nz)||1; nx/=l; ny/=l; nz/=l; const wnx=nx*c-nz*s, wnz=nx*s+nz*c; this.n.push(wnx,ny,wnz);
      const ax=Math.abs(wnx), ay=Math.abs(ny), az=Math.abs(wnz); if(ay>=ax&&ay>=az) this.u.push(wx*uvs,wz*uvs); else if(ax>=az) this.u.push(wz*uvs,wy*uvs); else this.u.push(wx*uvs,wy*uvs); } }
  rb(x,y0,z,sx,sy,sz,r,a){ this.add(rboxGeo(sx,sy,sz,r),x,y0+sy/2,z,a); }
  bx(x,y0,z,sx,sy,sz,a){ this.add(rboxGeo(sx,sy,sz,0),x,y0+sy/2,z,a); }
  cy(x,y0,z,rad,h,a,rz){ this.add(_ucyl,x,y0,z,a,rad*2,h,(rz||rad)*2); }
  sp(x,y,z,rx,ry,rz){ this.add(_usph,x,y,z,0,rx*2,ry*2,rz*2); }
  cone(x,y0,z,rad,h){ this.add(_ucone,x,y0,z,0,rad*2,h,rad*2); this.add(_uconeIn,x,y0,z,0,rad*2,h,rad*2); }
  blob(x,y,z,rx,ry,rz,a){ this.add(_uoct,x,y,z,a||0,rx*2,ry*2,rz*2); }
  // three crossed leaf cards, both windings, normals bent outwards so the clump shades like a volume
  cards(x,y,z,rx,ry,a){ const V=(px,py,pz,u,v)=>{ let nx=(px-x)/rx, ny=(py-y)/ry*0.7+0.5, nz=(pz-z)/rx; const l=Math.hypot(nx,ny,nz)||1; this.p.push(px,py,pz); this.n.push(nx/l,ny/l,nz/l); this.u.push(u,v); };
    for(let k=0;k<3;k++){ const t=a+k*Math.PI/3, c=Math.cos(t)*rx, s=Math.sin(t)*rx; const A=[x-c,y-ry,z-s,0,0], B=[x+c,y-ry,z+s,1,0], C=[x+c,y+ry,z+s,1,1], D=[x-c,y+ry,z-s,0,1];
      for(const tri of [[A,B,C],[A,C,D],[A,C,B],[A,D,C]]) for(const q of tri) V(...q); } }
  quad(a,b,c,d,n,uv){ const U=uv||[[0,0],[1,0],[1,1],[0,1]]; const push=(p,t)=>{ this.p.push(...p); this.n.push(...n); this.u.push(...t); };
    const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]], ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]]; const cr=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
    if(cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]>=0){ push(a,U[0]); push(b,U[1]); push(c,U[2]); push(a,U[0]); push(c,U[2]); push(d,U[3]); } else { push(a,U[0]); push(c,U[2]); push(b,U[1]); push(a,U[0]); push(d,U[3]); push(c,U[2]); } }
  tri(a,b,c,n,uv){ const push=(p,t)=>{ this.p.push(...p); this.n.push(...n); this.u.push(...t); }; const ab=[b[0]-a[0],b[1]-a[1],b[2]-a[2]], ac=[c[0]-a[0],c[1]-a[1],c[2]-a[2]]; const cr=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
    if(cr[0]*n[0]+cr[1]*n[1]+cr[2]*n[2]>=0){ push(a,uv[0]); push(b,uv[1]); push(c,uv[2]); } else { push(a,uv[0]); push(c,uv[2]); push(b,uv[1]); } }
  mesh(mat,grp,cast){ if(!this.p.length) return null; const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3)); g.setAttribute('uv',new THREE.Float32BufferAttribute(this.u,2));
    const m=new THREE.Mesh(g,mat); m.castShadow=cast!==false; m.receiveShadow=true; grp.add(m); return m; } }
function IM(o){ o=Object.assign({},o); if(o.color!==undefined&&!(o.color instanceof THREE.Color)) o.color=Cc(o.color);
  if(FXQ) return new THREE.MeshStandardMaterial(Object.assign({roughness:0.85,metalness:0},o));
  const p={color:o.color||new THREE.Color(1,1,1),map:o.map||null,shininess:Math.max(3,(1-(o.roughness===undefined?0.85:o.roughness))*90),side:o.side||THREE.FrontSide}; if(o.transparent){ p.transparent=true; p.opacity=o.opacity; p.depthWrite=false; } if(o.alphaTest) p.alphaTest=o.alphaTest; return new THREE.MeshPhongMaterial(p); }
function GLOW(r,g,b){ return new THREE.MeshBasicMaterial({color:new THREE.Color(r,g,b)}); }
// soft contact shadows on the floor: a dark band along every wall and a blob under the big furniture
function aoTexs(){ return txc('ao',()=>({band:canvasTex(8,64,(g,w,h)=>{ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'rgba(0,0,0,1)'); gr.addColorStop(0.35,'rgba(0,0,0,0.45)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,w,h); }),
  blob:canvasTex(64,64,(g,w,h)=>{ const gr=g.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2); gr.addColorStop(0,'rgba(0,0,0,0.9)'); gr.addColorStop(0.55,'rgba(0,0,0,0.55)'); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,w,h); })})); }

function interiorFloor(b){ let mx=-1e9; for(let x=b.x0;x<=b.x1;x+=1.5) for(let z=b.z0;z<=b.z1;z+=1.5){ if(inBld(b,x,z)) mx=Math.max(mx,W.terrain(x,z)); } for(const p of b.ring) mx=Math.max(mx,W.terrain(p[0],p[1])-0.3); return Math.max(b.floorY,mx+0.06); }
function segDist(x,z,a,b){ const vx=b[0]-a[0], vz=b[1]-a[1]; const l2=vx*vx+vz*vz||1e-9; const t=Math.max(0,Math.min(1,((x-a[0])*vx+(z-a[1])*vz)/l2)); const qx=a[0]+vx*t, qz=a[1]+vz*t; return [Math.hypot(x-qx,z-qz),qx,qz]; }
function segX(ax,az,bx,bz,c,d){ const o=(px,pz,qx,qz,rx,rz)=>(qx-px)*(rz-pz)-(qz-pz)*(rx-px); const d1=o(c[0],c[1],d[0],d[1],ax,az), d2=o(c[0],c[1],d[0],d[1],bx,bz), d3=o(ax,az,bx,bz,c[0],c[1]), d4=o(ax,az,bx,bz,d[0],d[1]); return d1*d2<0&&d3*d4<0; }

/* ---- rooms: one partition across the long axis (the living side holds the door you came in by), the private side split in 1-3 rooms ---- */
function planRooms(b,door){
  let best=0,ang=0; const r=b.ring; for(let i=0;i<r.length;i++){ const a=r[i], c=r[(i+1)%r.length]; const L=Math.hypot(c[0]-a[0],c[1]-a[1]); if(L>best){ best=L; ang=Math.atan2(c[1]-a[1],c[0]-a[0]); } }
  const ca=Math.cos(ang), sa=Math.sin(ang), ox=b.c[0], oz=b.c[1];
  const toL=(x,z)=>[(x-ox)*ca+(z-oz)*sa,-(x-ox)*sa+(z-oz)*ca], toW=(u,v)=>[ox+u*ca-v*sa,oz+u*sa+v*ca];
  let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9; for(const p of r){ const [u,v]=toL(p[0],p[1]); u0=Math.min(u0,u); u1=Math.max(u1,u); v0=Math.min(v0,v); v1=Math.max(v1,v); }
  const inside=(u,v)=>{ const [x,z]=toW(u,v); return inBld(b,x,z)&&nearestEdge(b,x,z)[0]>0.1; };
  const runs=(fix,a0,a1,alongV)=>{ const out=[]; let cur=null; for(let t=a0;t<=a1+1e-6;t+=0.2){ const ok=alongV?inside(fix,t):inside(t,fix); if(ok&&!cur) cur=[t,t]; else if(ok) cur[1]=t; else if(cur){ out.push(cur); cur=null; } } if(cur) out.push(cur); return out.filter(q=>q[1]-q[0]>0.8); };
  const plan={ang,toL,toW,u0,u1,v0,v1,runs,walls:[],pieces:[],doors:[],rooms:[{id:0,kind:'living',name:'Salón-cocina'}],roomAt:()=>0};
  const du=u1-u0, dv=v1-v0; if(b.area<72||du<7||dv<4.8) return plan;
  const [dU]=toL(door.x,door.z); const doorLow=dU<(u0+u1)/2;
  let us=doorLow?u0+du*0.6:u0+du*0.4; { const cols=[]; for(let u=u0+0.25;u<u1;u+=0.5){ let c=0; for(let v=v0+0.25;v<v1;v+=0.5){ const [x,z]=toW(u,v); if(inBld(b,x,z)) c++; } cols.push([u,c]); }
    const tot=cols.reduce((a,c)=>a+c[1],0); let acc=0; for(const [u,c] of (doorLow?cols:cols.slice().reverse())){ acc+=c; if(acc>=tot*0.56){ us=u; break; } } if(doorLow) us=Math.max(us,dU+2.5); else us=Math.min(us,dU-2.5); us=Math.max(u0+3,Math.min(u1-3,us)); }
  if(doorLow?dU>=us-0.5:dU<=us+0.5) return plan; const main=runs(us,v0,v1,true); if(!main.length) return plan;
  const pa=doorLow?us:u0, pb=doorLow?u1:us; const privW=pb-pa; const va=main[0][0]-0.1, vb=main[main.length-1][1]+0.1; const privA=privW*(vb-va);
  let n=privA>=58?3:privA>=24?2:1; const FR={3:[0.4,0.22,0.38],2:[0.55,0.45],1:[1]}; while(n>1&&(vb-va)*Math.min(...FR[n])<1.9) n--; let fr=FR[n]; if(n===3){ const bf=Math.min(0.22,3.3/(vb-va)); fr=[(1-bf)*0.52,bf,(1-bf)*0.48]; }
  const ranges=[]; let acc=va; for(const f of fr){ const nv=acc+(vb-va)*f; ranges.push([acc,nv]); acc=nv; }
  const kinds=n===3?['bed','bath','bed2']:n===2?['bed','bed2']:['bed'];
  const living=(u)=>doorLow?u<us:u>us;
  plan.roomAt=(x,z)=>{ const [u,v]=toL(x,z); if(living(u)) return 0; for(let k=0;k<ranges.length;k++) if(v>=ranges[k][0]&&v<ranges[k][1]) return k+1; return v<va?1:ranges.length; };
  kinds.forEach((kd,k)=>plan.rooms.push({id:k+1,kind:kd,name:kd==='bed'?'Dormitorio principal':kd==='bath'?'Baño':'Dormitorio 2'}));
  for(const [sa0,sa1] of main){ const doors=[]; ranges.forEach((rg)=>{ let lo=Math.max(rg[0],sa0)+0.35, hi=Math.min(rg[1],sa1)-0.35; if(hi-lo<0.95){ lo-=0.25; hi+=0.25; } if(hi-lo<0.85) return; const c=(lo+hi)/2, hw=Math.min(0.45,(hi-lo)/2); doors.push([c-hw,c+hw]); });
    plan.walls.push({a:toW(us,sa0),b:toW(us,sa1),doors:doors.map(d=>[d[0]-sa0,d[1]-sa0])}); }
  for(let k=1;k<ranges.length;k++){ const vs=ranges[k][0]; for(const [ua0,ua1] of runs(vs,pa,pb,false)) plan.walls.push({a:toW(ua0,vs),b:toW(ua1,vs),doors:[]}); }
  for(const w of plan.walls){ const L=Math.hypot(w.b[0]-w.a[0],w.b[1]-w.a[1]); const ux=(w.b[0]-w.a[0])/L, uz=(w.b[1]-w.a[1])/L; let t=0; const ds=w.doors.slice().sort((p,q)=>p[0]-q[0]);
    for(const d of ds){ if(d[0]>t+0.05) plan.pieces.push([[w.a[0]+ux*t,w.a[1]+uz*t],[w.a[0]+ux*d[0],w.a[1]+uz*d[0]]]); plan.doors.push([[w.a[0]+ux*d[0],w.a[1]+uz*d[0]],[w.a[0]+ux*d[1],w.a[1]+uz*d[1]]]); t=d[1]; }
    if(L>t+0.05) plan.pieces.push([[w.a[0]+ux*t,w.a[1]+uz*t],[w.b[0],w.b[1]]]); }
  return plan;
}

/* ---- building the interior ---- */
function enterVilla(b,px,pz){
  const th=themeFor(b); const e=nearestEdge(b,px,pz); const door={x:e[1],z:e[2],nx:e[3],nz:e[4]};
  const floor=interiorFloor(b); let ceil=Math.min(floor+2.85,(b.walkY||b.top)-0.1); if(ceil-floor<2.4) ceil=floor+2.4;
  const grp=new THREE.Group(); scene.add(grp); const R=rng(7+b.k);
  const plan=planRooms(b,door);
  // materials (the reflection map of the room itself is added a few frames later)
  const FT=floorTexs(th.floor,th.fc);
  const M={floor:IM({map:FT.map,roughnessMap:FXQ?FT.rough:null,roughness:1}),wall:IM(th.brick?{map:brick2Tex(),roughness:0.95}:{map:plasterTex(th.wall),roughness:0.95}),ceil:IM({color:'#f6f4ef',roughness:1}),
    wood:IM({map:woodTex(th.wood),roughness:0.55}),wood2:IM({map:woodTex(th.wood2),roughness:0.5}),fab:IM({map:fabricTex(th.fab),roughness:1}),fab2:IM({map:fabricTex(th.fab2),roughness:1}),
    acc:IM({color:th.acc,roughness:0.55}),metal:IM({color:th.metal,roughness:0.32,metalness:0.9}),steel:IM({color:'#c9cccf',roughness:0.3,metalness:0.85}),chrome:IM({color:'#e9e9e6',roughness:0.1,metalness:1}),stone:IM({map:stoneTex(th.stone),roughness:0.16}),
    white:IM({color:'#f3f1ec',roughness:0.38}),black:IM({color:'#151617',roughness:0.22}),ceramic:IM({color:th.pot,roughness:0.28}),porc:IM({color:'#f7f7f5',roughness:0.12}),
    rug:IM({map:rugTex(th.rug),roughness:1}),leaf:IM({map:leafTex(),alphaTest:0.5,roughness:0.7}),curtain:IM({color:th.curtain,roughness:1,side:THREE.DoubleSide,transparent:true,opacity:0.92}),
    felt:IM({color:'#2f7d4a',roughness:1}),gold:IM({color:'#d9b04a',roughness:0.18,metalness:1}),red:IM({color:'#d6442a',roughness:0.5}),blue:IM({color:'#2f6bd6',roughness:0.5}),yellow:IM({color:'#f2c230',roughness:0.5}),green:IM({color:'#4c8a3a',roughness:0.6}),cream:IM({color:'#efe3c8',roughness:0.7}),
    frame:IM({color:'#2b2d2f',roughness:0.4,metalness:0.6}),trunk:IM({color:'#6b5a46',roughness:0.9}),
    glass:IM({color:'#e2edf2',transparent:true,opacity:0.1,roughness:0.03,metalness:0}),mirror:IM({color:'#ffffff',roughness:0.03,metalness:1}),
    glow:GLOW(1,0.82,0.6),screen:new THREE.MeshBasicMaterial({map:screenTex(),color:new THREE.Color(1.2,1.2,1.2)}),fire:GLOW(4.2,1.6,0.35),led:GLOW(0.9,1.4,2.2)};
  const G={}; for(const k in M) G[k]=new IB(k==='wall'?1/2.6:1.2);
  const plats=[]; const solid=(cx,cz,a,sx,sz,top)=>{ const p=addPlat(cx,cz,a,sx,sz,floor+top,top+0.05); p.nostep=true; plats.push(p); };
  // floor and ceiling (courtyards stay open to the sky)
  const extI=b.ring, holes=b.holesO; const pts=extI.concat(...holes); const fs=FLOOR_SCALE[th.floor]||3.2;
  const tris=THREE.ShapeUtils.triangulateShape(extI.map(p=>new THREE.Vector2(p[0],p[1])),holes.map(h=>h.map(p=>new THREE.Vector2(p[0],p[1]))));
  for(const t of tris){ const Q=t.map(k=>pts[k]); if(!Q[0]||!Q[1]||!Q[2]) continue;
    G.floor.tri([Q[0][0],floor,Q[0][1]],[Q[1][0],floor,Q[1][1]],[Q[2][0],floor,Q[2][1]],[0,1,0],Q.map(q=>[q[0]/fs,q[1]/fs]));
    G.ceil.tri([Q[0][0],ceil,Q[0][1]],[Q[1][0],ceil,Q[1][1]],[Q[2][0],ceil,Q[2][1]],[0,-1,0],[[0,0],[0,0],[0,0]]); }
  // window openings taken from the facade panels: real holes with the wall's thickness, a dark frame and glass
  const F0=b.floorY; let wins=[];
  for(const pn of (b.panels||[])){ if(!pn.ty) continue; const dx=pn.p1[0]-pn.p0[0], dz=pn.p1[1]-pn.p0[1], pw=Math.hypot(dx,dz); if(pw<0.5) continue; const k=pw/3;
    const rect=pn.ty===1?[0.34*k,2.66*k,F0+0.04,F0+2.56]:pn.ty===2?[0.8*k,2.2*k,F0+0.95,F0+2.25]:null;
    if(rect){ const v0=Math.max(rect[2],floor+0.02), v1=Math.min(rect[3],ceil-0.12); if(v1-v0>0.3) wins.push({p0:pn.p0,p1:pn.p1,u0:rect[0],u1:rect[1],v0,v1,ty:pn.ty}); }
    else for(let q=0;q<5;q++){ const cu=(0.62+q*0.44)*k; const v0=Math.min(F0+2.0,ceil-0.36), v1=Math.min(F0+2.2,ceil-0.14); wins.push({p0:pn.p0,p1:pn.p1,u0:cu-0.1,u1:cu+0.1,v0,v1,ty:3}); } }
  const winAt=(w,t)=>{ const ex=w.p1[0]-w.p0[0], ez=w.p1[1]-w.p0[1], L=Math.hypot(ex,ez); return [w.p0[0]+ex/L*t,w.p0[1]+ez/L*t]; };
  // the door you came in by: a sliding glass door when it falls on a large glazing, otherwise a wooden door (and no small window there)
  const dGlass=wins.some(w=>{ if(w.ty!==1) return false; const a=winAt(w,w.u0), c=winAt(w,w.u1); return segDist(door.x,door.z,a,c)[0]<0.08; });
  if(!dGlass) wins=wins.filter(w=>{ const a=winAt(w,w.u0), c=winAt(w,w.u1); return segDist(door.x,door.z,a,c)[0]>0.75; });
  const D=0.24; const opens=[];
  const wallsIn=(r)=>{ for(let i=0;i<r.length;i++){ const a=r[i], c=r[(i+1)%r.length]; const dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz); if(L<0.05) continue; const ux=dx/L, uz=dz/L; const n=[-uz,0,ux];
      const hs=[]; for(const w of wins){ const t0=(w.p0[0]-a[0])*ux+(w.p0[1]-a[1])*uz, t1=(w.p1[0]-a[0])*ux+(w.p1[1]-a[1])*uz; const off=Math.abs((w.p0[0]-a[0])*uz-(w.p0[1]-a[1])*ux); if(off>0.06||t0<-0.05||t1>L+0.05||t1<t0) continue; hs.push([t0+w.u0,t0+w.u1,w.v0,w.v1,w]); }
      hs.sort((p,q)=>p[0]-q[0]); const Wq=(u0,u1,v0,v1)=>{ if(u1-u0<0.005||v1-v0<0.005) return; G.wall.quad([a[0]+ux*u0,v0,a[1]+uz*u0],[a[0]+ux*u1,v0,a[1]+uz*u1],[a[0]+ux*u1,v1,a[1]+uz*u1],[a[0]+ux*u0,v1,a[1]+uz*u0],n,[[u0/2.6,v0/2.6],[u1/2.6,v0/2.6],[u1/2.6,v1/2.6],[u0/2.6,v1/2.6]]); };
      let cur=0; for(const h of hs){ const h0=Math.max(h[0],cur), h1=Math.min(h[1],L); if(h1<=h0+0.05) continue; Wq(cur,h0,floor,ceil); Wq(h0,h1,floor,h[2]); Wq(h0,h1,h[3],ceil); cur=h1;
        const P=(u,y,d)=>[a[0]+ux*u+n[0]*d,y,a[1]+uz*u+n[2]*d]; const y0=h[2], y1=h[3], wdt=h1-h0, cx0=(h0+h1)/2, fa=Math.atan2(uz,ux), dg=-D*0.5, fw=0.05;
        // the reveal: the thickness of the wall around the opening
        G.wall.quad(P(h0,y0,-D),P(h1,y0,-D),P(h1,y0,0),P(h0,y0,0),[0,1,0]); G.wall.quad(P(h0,y1,-D),P(h1,y1,-D),P(h1,y1,0),P(h0,y1,0),[0,-1,0]);
        G.wall.quad(P(h0,y0,-D),P(h0,y1,-D),P(h0,y1,0),P(h0,y0,0),[ux,0,uz]); G.wall.quad(P(h1,y0,-D),P(h1,y1,-D),P(h1,y1,0),P(h1,y0,0),[-ux,0,-uz]);
        const fb=(u,yb,yt,ww)=>{ const q=P(u,0,dg); G.frame.bx(q[0],yb,q[2],ww,yt-yb,0.06,fa); };
        if(h[4].ty!==3){ fb(h0+fw/2,y0,y1,fw); fb(h1-fw/2,y0,y1,fw); const q=P(cx0,0,dg); G.frame.bx(q[0],y0,q[2],wdt,fw,0.06,fa); G.frame.bx(q[0],y1-fw,q[2],wdt,fw,0.06,fa); }
        if(h[4].ty===1&&wdt>1.6) fb(cx0,y0,y1,0.05);
        G.glass.quad(P(h0,y0,dg),P(h1,y0,dg),P(h1,y1,dg),P(h0,y1,dg),n); if(h[4].ty!==3) opens.push({a,ux,uz,n,h0:h0+0.05,h1:h1-0.05,y0:y0+0.05,y1:y1-0.05});
        if(h[4].ty===2){ const q=P(cx0,0,(0.05-D)/2); G.stone.bx(q[0],y0-0.03,q[2],wdt+0.1,0.035,D+0.05,fa); }
        // curtains beside the large openings
        if(h[4].ty!==3&&wdt>1.0){ for(const side of [-1,1]){ const uc=side<0?h0-0.2:h1+0.2; if(uc<0.25||uc>L-0.25) continue; const top=Math.min(ceil-0.06,y1+0.22); const cw=0.44, nseg=9;
          for(let s2=0;s2<nseg;s2++){ const t0=uc-cw/2+cw*s2/nseg, t1=uc-cw/2+cw*(s2+1)/nseg; const d0=0.08+0.035*Math.sin(s2*1.9), d1=0.08+0.035*Math.sin((s2+1)*1.9);
            G.curtain.quad(P(t0,floor+0.02,d0),P(t1,floor+0.02,d1),P(t1,top,d1),P(t0,top,d0),n); }
          const rod=P(uc,0,0.08); G.metal.bx(rod[0],top,rod[2],cw+0.12,0.025,0.025,fa); } } }
      Wq(cur,L,floor,ceil);
      const o=0.012; G.wood2.quad([a[0]+n[0]*o,floor,a[1]+n[2]*o],[c[0]+n[0]*o,floor,c[1]+n[2]*o],[c[0]+n[0]*o,floor+0.08,c[1]+n[2]*o],[a[0]+n[0]*o,floor+0.08,a[1]+n[2]*o],n); } };
  wallsIn(extI); holes.forEach(wallsIn);
  // partition walls with doorways and wooden frames
  const PT=0.12;
  for(const [a,c] of plan.pieces){ const L=Math.hypot(c[0]-a[0],c[1]-a[1]); if(L<0.05) continue; const mx=(a[0]+c[0])/2, mz=(a[1]+c[1])/2, an=Math.atan2(c[1]-a[1],c[0]-a[0]);
    G.wall.bx(mx,floor,mz,L,ceil-floor,PT,an); const p=addPlat(mx,mz,an,L,PT+0.02,ceil,ceil-floor); p.wall=true; plats.push(p);
    for(const sd of [-1,1]){ const ox=-Math.sin(an)*sd*(PT/2+0.006), oz=Math.cos(an)*sd*(PT/2+0.006); G.wood2.bx(mx+ox,floor,mz+oz,L,0.08,0.012,an); } }
  for(const [a,c] of plan.doors){ const mx=(a[0]+c[0])/2, mz=(a[1]+c[1])/2, an=Math.atan2(c[1]-a[1],c[0]-a[0]); const L=Math.hypot(c[0]-a[0],c[1]-a[1]); const dh=Math.min(2.1,ceil-floor-0.1);
    G.wall.bx(mx,floor+dh,mz,L,ceil-floor-dh,PT,an); const ux=Math.cos(an), uz=Math.sin(an);
    for(const sd of [-1,1]) G.wood.bx(mx+ux*sd*(L/2-0.03),floor,mz+uz*sd*(L/2-0.03),0.06,dh,PT+0.04,an); G.wood.bx(mx,floor+dh-0.06,mz,L,0.06,PT+0.04,an); }
  if(!dGlass){ const ux=-door.nz, uz=door.nx, an=Math.atan2(uz,ux); const cx=door.x-door.nx*0.04, cz=door.z-door.nz*0.04;
    G.wood2.bx(cx,floor,cz,1.1,2.18,0.06,an); G.chrome.bx(door.x+ux*0.4-door.nx*0.1,floor+1.0,door.z+uz*0.4-door.nz*0.1,0.03,0.03,0.16,an); G.frame.bx(cx,floor+2.18,cz,1.22,0.06,0.08,an); }
  // rustic beams across the ceiling
  if(th.beams){ for(let u=plan.u0+0.9;u<plan.u1-0.5;u+=1.3) for(const [r0,r1] of plan.runs(u,plan.v0,plan.v1,true)){ const pa=plan.toW(u,r0-0.1), pb=plan.toW(u,r1+0.1); const L=Math.hypot(pb[0]-pa[0],pb[1]-pa[1]); G.wood2.bx((pa[0]+pb[0])/2,ceil-0.2,(pa[1]+pb[1])/2,0.16,0.2,L,plan.ang); } }

  /* --- free-space grid: distance to the nearest wall and room of each 25 cm cell --- */
  const cs=0.25, nx=Math.ceil((b.x1-b.x0)/cs)+1, nz=Math.ceil((b.z1-b.z0)/cs)+1; const dist=new Float32Array(nx*nz).fill(-1), room=new Int8Array(nx*nz).fill(-1), occ=new Uint8Array(nx*nz);
  for(let j=0;j<nz;j++) for(let i=0;i<nx;i++){ const x=b.x0+i*cs, z=b.z0+j*cs; if(!inBld(b,x,z)) continue; let d=nearestEdge(b,x,z)[0]; for(const pc of plan.pieces) d=Math.min(d,segDist(x,z,pc[0],pc[1])[0]-PT/2); dist[j*nx+i]=d; room[j*nx+i]=plan.roomAt(x,z); }
  const cellK=(x,z)=>{ const i=Math.round((x-b.x0)/cs), j=Math.round((z-b.z0)/cs); return (i<0||j<0||i>=nx||j>=nz)?-1:j*nx+i; };
  const mark=(x0,z0,x1,z1)=>{ for(let j=Math.max(0,Math.floor((z0-b.z0)/cs));j<=Math.min(nz-1,Math.ceil((z1-b.z0)/cs));j++) for(let i=Math.max(0,Math.floor((x0-b.x0)/cs));i<=Math.min(nx-1,Math.ceil((x1-b.x0)/cs));i++) occ[j*nx+i]=1; };
  const markOBB=(cx,cz,a,hw,hd)=>{ const c=Math.cos(a), s=Math.sin(a); const ex=Math.abs(c)*hw+Math.abs(s)*hd, ez=Math.abs(s)*hw+Math.abs(c)*hd;
    for(let j=Math.max(0,Math.floor((cz-ez-b.z0)/cs));j<=Math.min(nz-1,Math.ceil((cz+ez-b.z0)/cs));j++) for(let i=Math.max(0,Math.floor((cx-ex-b.x0)/cs));i<=Math.min(nx-1,Math.ceil((cx+ex-b.x0)/cs));i++){ const x=b.x0+i*cs-cx, z=b.z0+j*cs-cz; const lx=x*c+z*s, lz=-x*s+z*c; if(Math.abs(lx)<=hw&&Math.abs(lz)<=hd) occ[j*nx+i]=1; } };
  mark(door.x-1.3,door.z-1.3,door.x+1.3,door.z+1.3); markOBB(door.x-door.nx*1.6,door.z-door.nz*1.6,Math.atan2(door.nx,-door.nz),1.0,1.6); for(const d of plan.doors){ const mx=(d[0][0]+d[1][0])/2, mz=(d[0][1]+d[1][1])/2; mark(mx-0.75,mz-0.75,mx+0.75,mz+0.75); }
  const roomCells=plan.rooms.map(()=>[]), roomAll=plan.rooms.map(()=>[]); for(let j=0;j<nz;j++) for(let i=0;i<nx;i++){ const k=j*nx+i; if(room[k]<0) continue; if(dist[k]>=0.9) roomCells[room[k]].push([b.x0+i*cs,b.z0+j*cs,dist[k]]); if(dist[k]>=0.25) roomAll[room[k]].push([b.x0+i*cs,b.z0+j*cs,dist[k]]); }
  plan.rooms.forEach(rm=>{ let n=0; for(let k=0;k<room.length;k++) if(room[k]===rm.id&&dist[k]>0) n++; rm.area=n*cs*cs; });
  const seedsOf=(rid,nmax,sep)=>{ const cells=roomCells[rid].slice().sort((p,q)=>q[2]-p[2]); const out=[]; if(cells.length) out.push(cells[0]);
    while(out.length<nmax){ let bst=null,bd=0; for(const c of cells){ let md=1e9; for(const sd of out) md=Math.min(md,Math.hypot(c[0]-sd[0],c[1]-sd[1])); if(md>bd){ bd=md; bst=c; } } if(bst&&bd>sep) out.push(bst); else break; } return out; };
  const nearestWall=(x,z)=>{ const e2=nearestEdge(b,x,z); let w={d:e2[0],qx:e2[1],qz:e2[2],nx:e2[3],nz:e2[4],ext:true};
    for(const pc of plan.pieces){ const s=segDist(x,z,pc[0],pc[1]); const d=s[0]-PT/2; if(d<w.d){ const ex=pc[1][0]-pc[0][0], ez=pc[1][1]-pc[0][1], L=Math.hypot(ex,ez)||1; let ny=-ez/L, nw=ex/L; if((s[1]-x)*ny+(s[2]-z)*nw<0){ ny=-ny; nw=-nw; } w={d,qx:s[1]-ny*PT/2,qz:s[2]-nw*PT/2,nx:ny,nz:nw,ext:false}; } }
    w.a=Math.atan2(w.nx,-w.nz); return w; };
  const nearWindow=(x,z,half,top)=>{ for(const w of wins){ if(w.ty===3) continue; if(top!==undefined&&w.v0-floor>top) continue; const ex=w.p1[0]-w.p0[0], ez=w.p1[1]-w.p0[1], L=Math.hypot(ex,ez); const ux=ex/L, uz=ez/L; const t=(x-w.p0[0])*ux+(z-w.p0[1])*uz; const off=Math.abs((x-w.p0[0])*uz-(z-w.p0[1])*ux); if(off<1.0&&t>w.u0-half-0.15&&t<w.u1+half+0.15) return true; } return false; };
  const exactD=(x,z)=>{ if(!inBld(b,x,z)) return -1; let d=nearestEdge(b,x,z)[0]; for(const pc of plan.pieces) d=Math.min(d,segDist(x,z,pc[0],pc[1])[0]-PT/2); return d; };
  const fits=(cx,cz,a,w,d,rm,m)=>{ const c=Math.cos(a), s=Math.sin(a); const nu=Math.max(2,Math.ceil(w/0.3)), nv=Math.max(2,Math.ceil(d/0.3));
    for(let i=0;i<=nu;i++) for(let j=0;j<=nv;j++){ const lx=(i/nu-0.5)*(w-0.06), lz=(j/nv-0.5)*(d-0.06); const px=cx+lx*c-lz*s, pz=cz+lx*s+lz*c; const k=cellK(px,pz); if(k<0||occ[k]) return false;
      let dd=dist[k]; if(dd<m+0.3) dd=exactD(px,pz); if(dd<m) return false; if(rm!==undefined&&(dd<0.6?plan.roomAt(px,pz):room[k])!==rm) return false; } return true; };
  const front=(cx,cz,a,d)=>{ const c=Math.cos(a), s=Math.sin(a); const k=cellK(cx-s*(d/2+0.5),cz+c*(d/2+0.5)); return k>=0&&dist[k]>=0.25&&!occ[k]; };
  const FP=[];
  const hard=new Uint8Array(nx*nz);
  const talls=[]; const claim=(cx,cz,a,w,d,kind,tall)=>{ const mg=w*d>0.8?0.36:0.14; const before=occ.slice(); occ.fill(0); markOBB(cx,cz,a,w/2,d/2); for(let k=0;k<occ.length;k++) if(occ[k]) hard[k]=1; occ.set(before); markOBB(cx,cz,a,w/2+mg,d/2+mg); FP.push({cx,cz,a,w,d,kind}); if(tall) talls.push([cx,cz,Math.max(w,d)/2]); };
  // a stretch of flat wall at least 2*half long around the point (no corner, doorway or window in between)
  const wallSpan=(wa,half)=>{ const tx=-wa.nz, tz=wa.nx; for(const sg of [-1,1]){ const px=wa.qx+tx*half*sg-wa.nx*0.06, pz=wa.qz+tz*half*sg-wa.nz*0.06; const k=cellK(px,pz); if(k<0||dist[k]<0) return false; const w2=nearestWall(px,pz); if(w2.d>0.15||w2.nx*wa.nx+w2.nz*wa.nz<0.95) return false; } return true; };
  const ctx=(cx,cz,a)=>{ const c=Math.cos(a), s=Math.sin(a); const T=(lx,lz)=>[cx+lx*c-lz*s,cz+lx*s+lz*c];
    return { a, at:T, rb(m,lx,y0,lz,sx,sy,sz,r,la){ const p=T(lx,lz); G[m].rb(p[0],floor+y0,p[1],sx,sy,sz,r,a+(la||0)); }, bx(m,lx,y0,lz,sx,sy,sz,la){ const p=T(lx,lz); G[m].bx(p[0],floor+y0,p[1],sx,sy,sz,a+(la||0)); },
      cy(m,lx,y0,lz,rad,h,rz){ const p=T(lx,lz); G[m].cy(p[0],floor+y0,p[1],rad,h,a,rz); }, sp(m,lx,y,lz,rx,ry,rz){ const p=T(lx,lz); G[m].sp(p[0],floor+y,p[1],rx,ry,rz); }, cone(m,lx,y0,lz,rad,h){ const p=T(lx,lz); G[m].cone(p[0],floor+y0,p[1],rad,h); },
      blob(m,lx,y,lz,rx,ry,rz){ const p=T(lx,lz); if(m==='leaf') G.leaf.cards(p[0],floor+y,p[1],rx,ry,a+lx*3.1+lz*1.7+y); else G[m].blob(p[0],floor+y,p[1],rx,ry,rz,a); },
      flat(m,w,d,y){ const q=[T(-w/2,-d/2),T(w/2,-d/2),T(w/2,d/2),T(-w/2,d/2)]; G[m].quad([q[0][0],floor+y,q[0][1]],[q[1][0],floor+y,q[1][1]],[q[2][0],floor+y,q[2][1]],[q[3][0],floor+y,q[3][1]],[0,1,0]); } }; };
  const wallCells=plan.rooms.map(()=>[]); for(let j=0;j<nz;j++) for(let i=0;i<nx;i++){ const k=j*nx+i; if(room[k]>=0&&dist[k]>=0.2&&dist[k]<=1.1) wallCells[room[k]].push([b.x0+i*cs,b.z0+j*cs]); }
  const near=(list,x,z,n)=>list.map(c=>[c,Math.hypot(c[0]-x,c[1]-z)]).sort((p,q)=>p[1]-q[1]).slice(0,n).map(q=>q[0]);
  const againstWall=(x,z,w,d,rm,build,opt)=>{ opt=opt||{}; const why={fit:0,win:0,front:0}; const cand=near(wallCells[rm]||[],x,z,100000); let t=0;
    for(const c of cand){ t++; if(t>40&&t%3) continue; if(t>700) break; const wa=nearestWall(c[0],c[1]); if((opt.tall||opt.low)&&wa.ext&&nearWindow(wa.qx,wa.qz,w/2,opt.tall?undefined:opt.low)){ why.win++; continue; }
      const cx=wa.qx-wa.nx*(d/2+0.03), cz=wa.qz-wa.nz*(d/2+0.03);
      if(!fits(cx,cz,wa.a,w,d,rm,0.0)){ why.fit++; continue; } if(!front(cx,cz,wa.a,d)){ why.front++; continue; }
      claim(cx,cz,wa.a,w,d,opt.kind||'mueble',opt.tall); build(ctx(cx,cz,wa.a),cx,cz,wa.a); return [cx,cz,wa.a]; }
    if(typeof DBG!=='undefined') DBG.log.push(['w',opt.kind,JSON.stringify(why)]); return null; };
  const centered=(x,z,w,d,rm,build,opt)=>{ opt=opt||{}; const m=opt.m===undefined?0.35:opt.m; const need=Math.min(w,d)/2+m-0.15; const wa=nearestWall(x,z);
    const cand=near((roomAll[rm]||[]).filter(c=>c[2]>=need),x,z,220); if(!cand.length) cand.push([x,z]);
    for(const c of cand){ for(const a of [wa.a,wa.a+Math.PI/2]){ if(fits(c[0],c[1],a,w,d,rm,m)){ claim(c[0],c[1],a,w,d,opt.kind||'mueble'); build(ctx(c[0],c[1],a),c[0],c[1],a); return [c[0],c[1],a]; } } }
    if(typeof DBG!=='undefined') DBG.log.push(['c',opt.kind,'fail']); return null; };
  const freeSpot=(rid)=>{ const cells=roomCells[rid]; if(!cells||!cells.length) return null; let sx=0,sz=0; for(const c of cells){ sx+=c[0]; sz+=c[1]; } sx/=cells.length; sz/=cells.length; let bst=null,bd=1e9; for(const c of cells){ const k=cellK(c[0],c[1]); if(occ[k]) continue; const d=Math.hypot(c[0]-sx,c[1]-sz); if(d<bd){ bd=d; bst=c; } } return bst; };
  const lamps=[]; let fireAt=null; const lights=[]; const downs=[];

  /* --- furniture library (local frame: x across, +z towards the room, -z against the wall) --- */
  const I={
    sofa(o,w){ o.rb('fab',0,0.1,0,w,0.34,0.94,0.06); o.rb('fab',0,0.38,-0.36,w-0.1,0.5,0.22,0.08); for(const sd of [-1,1]) o.rb('fab',sd*(w/2-0.11),0.1,0.02,0.22,0.56,0.9,0.08);
      const n=Math.max(2,Math.round((w-0.44)/0.8)), cw=(w-0.44)/n; for(let k=0;k<n;k++){ const x=-w/2+0.22+cw*(k+0.5); o.rb('fab',x,0.42,0.06,cw-0.02,0.15,0.7,0.07); o.rb('fab',x,0.55,-0.22,cw-0.04,0.42,0.18,0.08,0.06); }
      o.rb('fab2',-w/2+0.5,0.56,-0.05,0.42,0.38,0.13,0.09,0.25); o.rb('fab2',w/2-0.5,0.56,-0.05,0.42,0.38,0.13,0.09,-0.25); for(const [x,z] of [[-w/2+0.1,-0.38],[w/2-0.1,-0.38],[-w/2+0.1,0.4],[w/2-0.1,0.4]]) o.cy('wood2',x,0,z,0.025,0.1); },
    arm(o){ o.rb('fab',0,0.1,0,0.82,0.32,0.82,0.06); o.rb('fab',0,0.36,-0.31,0.78,0.44,0.2,0.08); for(const sd of [-1,1]) o.rb('fab',sd*0.33,0.1,0,0.16,0.5,0.8,0.07); o.rb('fab',0,0.42,0.06,0.5,0.13,0.6,0.06); o.rb('fab2',0,0.55,-0.18,0.38,0.32,0.12,0.08,0.1); for(const [x,z] of [[-0.33,-0.33],[0.33,-0.33],[-0.33,0.33],[0.33,0.33]]) o.cy('wood2',x,0,z,0.022,0.1); },
    coffee(o){ o.rb('wood',0,0.34,0,1.15,0.05,0.62,0.02); for(const [x,z] of [[-0.5,-0.24],[0.5,-0.24],[-0.5,0.24],[0.5,0.24]]) o.cy('metal',x,0,z,0.018,0.34);
      o.rb('red',-0.25,0.39,0.05,0.26,0.035,0.19,0.005); o.rb('cream',-0.24,0.425,0.05,0.24,0.03,0.17,0.005,0.2); o.cy('ceramic',0.3,0.39,-0.05,0.07,0.2); o.blob('leaf',0.3,0.68,-0.05,0.16,0.13,0.16); },
    rug(o,w,d){ o.flat('rug',w,d,0.008); },
    tv(o){ o.rb('wood',0,0.08,0,1.9,0.38,0.42,0.02); for(const x of [-0.85,0.85]) o.cy('metal',x,0,0,0.02,0.08); o.bx('frame',0,0.6,-0.1,1.5,0.86,0.045); o.bx('frame',0,0.46,-0.1,0.3,0.14,0.12); const p=o.at(0,-0.07), c=Math.cos(o.a), s=Math.sin(o.a);
      G.screen.quad([p[0]-c*0.72,floor+0.63,p[1]-s*0.72],[p[0]+c*0.72,floor+0.63,p[1]+s*0.72],[p[0]+c*0.72,floor+1.43,p[1]+s*0.72],[p[0]-c*0.72,floor+1.43,p[1]-s*0.72],[-s,0,c]);
      o.cy('ceramic',-0.7,0.46,0.05,0.06,0.3); o.blob('leaf',0.72,0.66,0.05,0.15,0.17,0.15); o.cy('ceramic',0.72,0.46,0.05,0.07,0.12); },
    dining(o){ o.rb('wood',0,0.72,0,2.0,0.05,1.0,0.02); for(const [x,z] of [[-0.88,-0.4],[0.88,-0.4],[-0.88,0.4],[0.88,0.4]]) o.bx('wood',x,0,z,0.07,0.72,0.07);
      const chair=(x,z,la)=>{ const an=o.a+la, c=Math.cos(an), s=Math.sin(an); const q=o.at(x,z); const T=(lx,lz)=>[q[0]+lx*c-lz*s,q[1]+lx*s+lz*c];
        let p=T(0,0); G.fab.rb(p[0],floor+0.44,p[1],0.44,0.06,0.44,0.025,an); for(const [lx,lz] of [[-0.18,-0.18],[0.18,-0.18],[-0.18,0.18],[0.18,0.18]]){ const r2=T(lx,lz); G.wood.bx(r2[0],floor,r2[1],0.035,0.44,0.035,an); } p=T(0,0.2); G.wood.rb(p[0],floor+0.5,p[1],0.42,0.42,0.04,0.015,an); };
      for(const x of [-0.55,0.55]){ chair(x,-0.72,0); chair(x,0.72,Math.PI); } chair(-1.2,0,Math.PI/2); chair(1.2,0,-Math.PI/2);
      o.cy('ceramic',0,0.77,0,0.11,0.06); for(let k=0;k<5;k++) o.sp(['red','yellow','green','red','yellow'][k],Math.cos(k*1.3)*0.05,0.86,Math.sin(k*1.3)*0.05,0.045,0.045,0.045); },
    pendant(o){ const h=ceil-floor; o.bx('frame',0,h-0.8,0,0.012,0.8,0.012); o.cone('metal',0,h-1.02,0,0.26,0.22); o.sp('glow',0,h-0.98,0,0.07,0.07,0.07); },
    kitchen(o,w){ const W2=w+0.74, xr=-W2/2+w/2, xf=-W2/2+w+0.37, xh=xr+w/4; const n=Math.max(3,Math.floor(w/0.6)), uw=w/n;
      for(let k=0;k<n;k++){ const x=xr-w/2+uw*(k+0.5); o.bx('white',x,0.1,0,uw-0.01,0.78,0.6); o.bx('chrome',x,0.72,0.305,uw*0.5,0.015,0.015); if(Math.abs(x-xh)>0.45){ o.bx('white',x,1.45,-0.12,uw-0.01,0.72,0.36); o.bx('chrome',x,1.5,0.065,0.015,0.12,0.015); } }
      o.bx('black',xr,0,0.02,w,0.1,0.56); o.rb('stone',xr,0.88,0.01,w+0.02,0.04,0.64,0.008); o.bx('stone',xr,0.92,-0.31,w,0.5,0.02);
      o.bx('chrome',xr-w/4,0.905,0.03,0.55,0.012,0.38); o.cy('chrome',xr-w/4,0.92,-0.2,0.012,0.3); o.bx('black',xh,0.925,0.02,0.6,0.008,0.5); o.bx('black',xh,0.25,0.302,0.58,0.5,0.01);
      o.bx('steel',xh,1.42,-0.1,0.6,0.5,0.42); o.bx('steel',xh,1.92,-0.22,0.24,0.9,0.2); o.bx('steel',xf,0,0,0.72,1.95,0.64); o.bx('chrome',xf-0.31,0.6,0.33,0.015,0.9,0.015);
      o.cy('ceramic',xr-w/2+0.25,0.92,-0.1,0.09,0.14); o.blob('leaf',xr-w/2+0.25,1.17,-0.1,0.14,0.11,0.14); o.cy('ceramic',xr+0.1,0.92,-0.12,0.05,0.18); },
    island(o){ o.bx('wood',0,0,0,2.0,0.88,0.9); o.rb('stone',0,0.88,0.12,2.1,0.04,1.15,0.01); for(const x of [-0.6,0,0.6]){ o.cy('metal',x,0,0.85,0.02,0.66); o.cy('fab',x,0.66,0.85,0.19,0.07); o.cy('metal',x,0.3,0.85,0.17,0.012); } o.cy('ceramic',-0.5,0.92,0,0.13,0.08); for(let k=0;k<3;k++) o.sp(['green','yellow','red'][k],-0.5+(k-1)*0.06,0.98,0.02,0.04,0.04,0.04); },
    bed(o,w,ns){ o.rb('wood',0,0.12,0,w+0.08,0.25,2.08,0.03); o.rb('white',0,0.37,0.02,w-0.04,0.22,1.98,0.07); o.rb('fab2',0,0.55,0.32,w+0.06,0.1,1.35,0.06); o.rb('fab2',0,0.48,1.02,w+0.06,0.17,0.05,0.025);
      o.rb('white',-w/4,0.6,-0.72,w/2-0.12,0.16,0.42,0.08); o.rb('white',w/4,0.6,-0.72,w/2-0.12,0.16,0.42,0.08); o.rb('fab2',0,0.62,-0.5,w*0.6,0.14,0.3,0.07);
      o.rb('fab',0,0.12,-1.06,w+0.3,1.12,0.1,0.04); for(const [x,z] of [[-w/2,-0.95],[w/2,-0.95],[-w/2,0.95],[w/2,0.95]]) o.cy('wood2',x,0,z,0.03,0.12);
      if(ns!==false) for(const sd of [-1,1]){ const x=sd*(w/2+0.36); o.rb('wood',x,0,-0.8,0.48,0.52,0.42,0.02); o.bx('wood2',x,0.25,-0.585,0.42,0.012,0.012); o.cy('ceramic',x,0.52,-0.85,0.07,0.22); o.cy('glow',x,0.74,-0.85,0.14,0.22); } },
    wardrobe(o){ o.rb('wood',0,0,0,1.8,2.15,0.62,0.01); for(const x of [-0.6,0,0.6]) o.bx('black',x,0.05,0.312,0.008,2.05,0.004); for(const x of [-0.08,0.08,-0.68,0.52]) o.bx('chrome',x,1.0,0.33,0.015,0.32,0.02); },
    shelf(o){ const Wd=1.25,H=1.95,Dp=0.36,t=0.03; o.bx('wood',0,0,-Dp/2+0.01,Wd,H,0.02); for(const sd of [-1,1]) o.bx('wood',sd*(Wd/2-t/2),0,0,t,H,Dp); o.bx('wood',0,H-t,0,Wd,t,Dp); o.bx('wood',0,0,0,Wd,0.08,Dp);
      const bc=['red','blue','cream','green','yellow','acc','fab2']; for(let r=0;r<4;r++){ const y=0.08+r*0.46; if(r) o.bx('wood2',0,y-0.022,0.005,Wd-2*t,0.022,Dp-0.03); let x=-0.55; while(x<0.48){ const bw=0.03+R()*0.05, bh=0.22+R()*0.14; if(R()<0.12){ o.cy('ceramic',x+0.06,y,0.04,0.05,0.16+R()*0.1); x+=0.14; continue; } o.bx(bc[(R()*bc.length)|0],x+bw/2,y,0.05,bw,bh,0.22); x+=bw+0.006; } } },
    console(o){ o.rb('wood',0,0.12,0,1.6,0.66,0.42,0.015); for(const [x,z] of [[-0.72,-0.15],[0.72,-0.15],[-0.72,0.15],[0.72,0.15]]) o.cy('metal',x,0,z,0.018,0.12); o.cy('ceramic',-0.5,0.78,0,0.09,0.32); o.blob('leaf',-0.5,1.2,0,0.16,0.18,0.16); o.rb('cream',0.2,0.78,0.02,0.3,0.06,0.22,0.005); o.rb('acc',0.2,0.84,0.02,0.26,0.04,0.2,0.005); o.sp('gold',0.55,0.86,0,0.07,0.07,0.07); },
    plant(o,s){ s=s||1; o.cy('ceramic',0,0,0,0.2*s,0.38*s); o.cy('trunk',0,0.38*s,0,0.02*s,0.45*s); for(let k=0;k<6;k++){ const a=k/6*Math.PI*2+R(); const r=0.16*s; o.blob('leaf',Math.cos(a)*r,(0.72+R()*0.35)*s,Math.sin(a)*r,0.26*s,0.22*s,0.26*s); } o.blob('leaf',0,1.08*s,0,0.28*s,0.25*s,0.28*s); },
    olive(o){ o.cy('ceramic',0,0,0,0.26,0.45); o.cy('trunk',0,0.45,0,0.04,0.95); for(let k=0;k<8;k++){ const a=k/8*Math.PI*2; o.blob('leaf',Math.cos(a)*0.3,1.4+R()*0.35,Math.sin(a)*0.3,0.34,0.26,0.34); } o.blob('leaf',0,1.75,0,0.34,0.26,0.34); },
    lamp(o){ o.cy('metal',0,0,0,0.16,0.025); o.cy('metal',0,0,0,0.015,1.5); o.cy('glow',0,1.38,0,0.21,0.3); const p=o.at(0,0); lamps.push([p[0],floor+1.5,p[1]]); },
    fireplace(o){ const h=ceil-floor; o.rb('stone',0,0,0,2.0,1.12,0.62,0.02); o.bx('black',0,0.1,0.2,1.1,0.72,0.24); o.bx('fire',0,0.13,0.22,0.78,0.22,0.06); for(const x of [-0.2,0.15]) o.cy('trunk',x,0.12,0.24,0.06,0.65,0.06); o.rb('wood2',0,1.12,0.02,2.1,0.07,0.7,0.01); o.bx('stone',0,1.19,-0.08,1.35,h-1.19,0.46);
      o.cy('gold',-0.7,1.19,0.08,0.05,0.28); o.cy('ceramic',0.7,1.19,0.08,0.08,0.18); const p=o.at(0,0.35); fireAt=[p[0],floor+0.45,p[1]]; },
    sculpture(o){ o.rb('white',0,0,0,0.5,0.95,0.5,0.01); o.blob('acc',0,1.2,0,0.2,0.28,0.2); o.sp('gold',0,1.52,0,0.1,0.1,0.1); },
    art(o,k,w){ w=w||1.1; const h=w*0.72; o.bx('frame',0,1.25,0,w+0.08,h+0.08,0.04); const p=o.at(0,0.025); const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),IM({map:paintingTex(k),roughness:0.6})); m.position.set(p[0],floor+1.25+h/2+0.04,p[1]); m.rotation.y=-o.a; m.receiveShadow=true; grp.add(m); },
    ship(o){ o.rb('wood',0,0,0,1.3,0.8,0.42,0.02); o.rb('white',0,0.8,0,0.72,0.14,0.18,0.05); o.bx('wood2',0,0.94,0,0.02,0.5,0.02); o.bx('cream',0.05,1.0,0,0.01,0.38,0.3); },
    putting(o){ o.bx('felt',0,0,0,4.6,0.025,1.2); o.cy('black',1.9,0.006,0,0.06,0.022); o.cy('white',1.9,0,0,0.008,0.95); o.bx('red',2.02,0.8,0,0.22,0.14,0.006); o.sp('white',-1.9,0.045,0.1,0.022,0.022,0.022); },
    golfbag(o){ o.cy('acc',0,0,0,0.15,0.88); for(const [x,z] of [[0.05,0],[-0.05,0.04],[0,-0.05],[0.03,0.06]]){ o.cy('chrome',x,0.88,z,0.008,0.38); o.rb('black',x,1.24,z,0.08,0.04,0.05,0.01); } },
    trophies(o){ o.rb('wood',0,0,0,1.4,1.0,0.42,0.01); for(let k=0;k<4;k++){ const x=-0.5+k*0.33; o.cy('gold',x,1.0,0,0.06,0.2+k*0.03); o.sp('gold',x,1.27+k*0.03,0,0.08,0.07,0.08); } },
    bunk(o){ for(const y of [0.05,1.35]){ o.rb('wood',0,y,0,1.0,0.22,2.02,0.02); o.rb('white',0,y+0.22,0,0.92,0.16,1.95,0.06); o.rb(y>1?'blue':'red',0,y+0.36,0.25,0.95,0.07,1.3,0.04); o.rb('white',0,y+0.4,-0.72,0.6,0.12,0.32,0.06); }
      for(const [x,z] of [[-0.48,-0.98],[0.48,-0.98],[-0.48,0.98],[0.48,0.98]]) o.bx('wood',x,0,z,0.07,2.25,0.07); for(let k=0;k<5;k++) o.bx('wood2',0.52,0.35+k*0.25,0.65,0.04,0.03,0.4); },
    toys(o){ const c=['red','yellow','blue','green']; for(let k=0;k<10;k++) o.rb(c[k%4],(R()-0.5)*1.2,0,(R()-0.5)*0.9,0.18,0.18,0.18,0.03,R()); o.sp('blue',0.5,0.16,0.35,0.16,0.16,0.16); o.rb('yellow',-0.4,0,0.3,0.5,0.3,0.32,0.06); },
    beanbag(o,c){ o.blob(c,0,0.28,0,0.48,0.3,0.48); },
    tent(o){ o.cone('yellow',0,0,0,0.8,1.5); o.cone('red',0,1.2,0,0.12,0.4); },
    pool(o){ o.rb('wood',0,0,0,2.55,0.78,1.45,0.03); o.bx('felt',0,0.78,0,2.3,0.025,1.2); for(const [x,z] of [[-1.15,-0.6],[0,-0.62],[1.15,-0.6],[-1.15,0.6],[0,0.62],[1.15,0.6]]) o.cy('black',x,0.79,z,0.05,0.02);
      const bc=['red','yellow','blue','black','white','acc']; for(let k=0;k<7;k++) o.sp(bc[k%bc.length],0.3+(k%3)*0.06,0.83,(Math.floor(k/3)-1)*0.06,0.03,0.03,0.03); o.bx('wood2',-0.3,0.82,0.25,1.4,0.02,0.02); },
    arcade(o){ o.rb('black',0,0,0,0.72,1.82,0.76,0.02); o.bx('led',0,1.12,0.31,0.56,0.44,0.02); o.bx('red',0,0.92,0.38,0.62,0.08,0.2); o.sp('red',-0.12,1.0,0.4,0.03,0.03,0.03); o.sp('yellow',0.1,0.98,0.42,0.025,0.025,0.025); },
    zentable(o){ o.rb('wood',0,0.28,0,1.3,0.06,0.82,0.01); for(const [x,z] of [[-0.56,-0.34],[0.56,-0.34],[-0.56,0.34],[0.56,0.34]]) o.bx('wood',x,0,z,0.07,0.28,0.07); for(const [x,z] of [[0,-0.78],[0,0.78],[-0.98,0],[0.98,0]]) o.rb('fab',x,0,z,0.6,0.12,0.6,0.05); o.cy('ceramic',0,0.34,0,0.06,0.09); },
    bonsai(o){ o.rb('acc',0,0,0,0.45,0.18,0.3,0.02); o.cy('trunk',0,0.18,0,0.025,0.25); o.blob('leaf',0.08,0.5,0,0.24,0.13,0.18); o.blob('leaf',-0.1,0.44,0.04,0.17,0.1,0.14); },
    paperlamp(o){ o.cy('glow',0,0,0,0.2,0.75); },
    desk(o){ const z0=-0.4; o.rb('wood',0,0.72,z0,1.4,0.04,0.7,0.01); for(const [x,z] of [[-0.64,-0.28],[0.64,-0.28],[-0.64,0.28],[0.64,0.28]]) o.bx('metal',x,0,z0+z,0.04,0.72,0.04);
      o.bx('black',0.15,0.76,z0+0.06,0.34,0.012,0.24); o.bx('black',0.15,0.772,z0-0.07,0.34,0.22,0.012); o.bx('led',0.15,0.785,z0-0.062,0.3,0.19,0.004); o.cy('metal',-0.5,0.76,z0-0.15,0.06,0.02); o.cy('metal',-0.5,0.78,z0-0.15,0.008,0.36); o.cy('glow',-0.5,1.1,z0-0.12,0.07,0.08);
      o.rb('cream',-0.15,0.76,z0+0.12,0.22,0.03,0.3,0.004); o.cy('black',0,0,0.3,0.28,0.04); o.cy('metal',0,0.04,0.3,0.025,0.4); o.rb('fab2',0,0.44,0.3,0.48,0.07,0.46,0.03); o.rb('fab2',0,0.5,0.52,0.46,0.5,0.06,0.03); },
    piano(o){ const z0=-0.21; o.rb('black',0,0,z0,1.5,1.25,0.58,0.01); o.bx('black',0,0.62,z0+0.2,1.5,0.1,0.42); o.bx('white',0,0.72,z0+0.33,1.36,0.025,0.15); for(let k=0;k<36;k++){ if([1,3,6,8,10].includes(k%12)) o.bx('black',-0.66+k*0.0378,0.745,z0+0.3,0.02,0.02,0.09); }
      o.rb('black',0,0,0.45,0.8,0.48,0.36,0.02); o.cy('gold',-0.5,1.25,z0,0.05,0.22); o.rb('cream',0.3,1.25,z0-0.05,0.3,0.02,0.22,0.004); },
    sofa2(o){ o.flat('rug',3.0,2.4,0.008); for(const sd of [-1,1]){ const p=o.at(0,sd*1.25); I.sofa(ctx(p[0],p[1],o.a+(sd>0?Math.PI:0)),2.2); } o.rb('wood',0,0.34,0,1.0,0.05,0.6,0.02); for(const [x,z] of [[-0.44,-0.24],[0.44,-0.24],[-0.44,0.24],[0.44,0.24]]) o.cy('metal',x,0,z,0.018,0.34); o.cy('ceramic',0.2,0.39,0,0.07,0.16); o.blob('leaf',0.2,0.62,0,0.14,0.12,0.14); o.rb('acc',-0.2,0.39,0.05,0.28,0.04,0.2,0.005); },
    bar(o){ o.rb('wood2',0,0,-0.1,2.0,1.05,0.5,0.01); o.rb('stone',0,1.05,-0.05,2.1,0.05,0.62,0.01); for(const x of [-0.65,0,0.65]){ o.cy('metal',x,0,0.45,0.02,0.72); o.cy('fab2',x,0.72,0.45,0.18,0.06); o.cy('metal',x,0.3,0.45,0.16,0.012); }
      for(let k=0;k<5;k++){ o.cy(['green','acc','cream','red','gold'][k],-0.7+k*0.32,1.1,-0.15,0.035,0.26); } },
    plantgroup(o){ I.olive(ctx(...o.at(-0.35,0),o.a)); I.plant(ctx(...o.at(0.4,0.25),o.a),1.25); I.plant(ctx(...o.at(0.25,-0.4),o.a),0.8); },
    lounge(o){ o.flat('rug',2.6,1.8,0.008); for(const sd of [-1,1]){ const p=o.at(sd*0.78,0); I.arm(ctx(p[0],p[1],o.a+sd*Math.PI/2)); } o.cy('metal',0,0,0,0.17,0.02); o.cy('metal',0,0,0,0.025,0.5); o.cy('wood',0,0.5,0,0.3,0.03); o.cy('ceramic',0.05,0.53,0.05,0.06,0.18); o.rb('acc',-0.1,0.53,-0.06,0.2,0.03,0.15,0.004); },
    toilet(o){ o.rb('porc',0,0,0.05,0.4,0.42,0.55,0.12); o.rb('porc',0,0.38,-0.2,0.44,0.38,0.2,0.04); o.rb('porc',0,0.42,0.05,0.42,0.04,0.48,0.12); },
    vanity(o){ o.rb('wood',0,0.15,0,1.0,0.55,0.5,0.01); o.rb('porc',0,0.7,0.02,0.6,0.14,0.42,0.08); o.cy('chrome',0,0.84,-0.15,0.015,0.2); o.bx('mirror',0,1.05,-0.23,0.9,0.75,0.02); o.bx('frame',0,1.8,-0.2,0.9,0.03,0.06); o.bx('glow',0,1.83,-0.2,0.7,0.02,0.04); },
    shower(o){ o.bx('porc',0,0,0,0.95,0.05,0.95); o.bx('glass',-0.47,0.05,0,0.012,1.95,0.95); o.cy('chrome',0.3,1.95,-0.3,0.012,0.25); o.cy('chrome',0.3,2.0,-0.2,0.1,0.015); },
    towel(o){ o.bx('chrome',0,1.1,0,0.6,0.02,0.04); o.rb('fab2',0,0.6,0.02,0.5,0.55,0.04,0.015); }
  };

  /* --- furnish the rooms --- */
  const living=plan.rooms[0]; const LS=seedsOf(0,4,3.6); const DBG={LS:LS.map(c=>c.slice()),log:[]};
  const L0=LS[0], L1=LS[1]||LS[0], L2=LS[2]||LS[1]||LS[0];
  let k=null; if(L1){ for(const kw of [2.66,2.06,1.46]){ k=againstWall(L1[0],L1[1],kw+0.74,0.66,0,(o)=>I.kitchen(o,kw),{low:0.9,kind:'cocina'}); if(k){ solid(k[0],k[1],k[2],kw+0.74,0.66,0.92); downs.push([k[0]-Math.sin(k[2])*0.9,k[1]+Math.cos(k[2])*0.9]); break; } }
  }
  if(L0){ const r=againstWall(L0[0],L0[1],2.6,0.96,0,(o)=>I.sofa(o,2.6),{kind:'sofá'});
    if(r){ const [cx,cz,a]=r; const c=Math.cos(a), s=Math.sin(a); const fx=-s, fz=c; solid(cx,cz,a,2.6,0.96,0.5);
      const rx=cx+fx*1.45, rz=cz+fz*1.45; I.rug(ctx(rx,rz,a),3.0,2.2); FP.push({cx:rx,cz:rz,a,w:3.0,d:2.2,kind:'alfombra'});
      if(fits(rx,rz,a,1.15,0.62,0,0.0)){ claim(rx,rz,a,1.15,0.62,'mesa'); I.coffee(ctx(rx,rz,a)); solid(rx,rz,a,1.15,0.62,0.39); }
      // facing the sofa: the fireplace or the television, against the opposite wall when there is one
      const tx=cx+fx*3.4, tz=cz+fz*3.4; const wa=nearestWall(tx,tz); const fire=th.special==='fireplace';
      let done=false; if(wa.d<1.2&&(wa.nx*fx+wa.nz*fz)>0.8){ const w2=fire?2.0:1.9, d2=fire?0.62:0.44; const qx=wa.qx-wa.nx*(d2/2+0.03), qz=wa.qz-wa.nz*(d2/2+0.03);
        if(fits(qx,qz,wa.a,w2,d2,0,0.0)){ claim(qx,qz,wa.a,w2,d2,fire?'chimenea':'tele'); if(fire){ I.fireplace(ctx(qx,qz,wa.a)); solid(qx,qz,wa.a,2.0,0.62,1.15); } else { I.tv(ctx(qx,qz,wa.a)); solid(qx,qz,wa.a,1.9,0.44,0.46); } done=true; } }
      if(!done&&fits(tx,tz,a+Math.PI,1.9,0.44,0,0.3)){ claim(tx,tz,a+Math.PI,1.9,0.44,'tele'); I.tv(ctx(tx,tz,a+Math.PI)); solid(tx,tz,a+Math.PI,1.9,0.44,0.46); }
      for(const sd of [-1,1]){ const ax=cx+fx*1.5+c*sd*2.0, az=cz+fz*1.5+s*sd*2.0; if(R()<0.75&&fits(ax,az,a+sd*Math.PI/2,0.84,0.84,0,0.2)){ claim(ax,az,a+sd*Math.PI/2,0.84,0.84,'sillón'); I.arm(ctx(ax,az,a+sd*Math.PI/2)); solid(ax,az,a,0.84,0.84,0.46); } }
      againstWall(cx+c*1.9,cz+s*1.9,0.4,0.4,0,(o)=>I.lamp(o),{kind:'lámpara'});
      lights.push([rx,ceil-0.75,rz]); downs.push([rx,rz]); } }
  if(L1){
    const kx=k?k[0]-Math.sin(k[2])*2.2:L1[0], kz=k?k[1]+Math.cos(k[2])*2.2:L1[1];
    const r=centered(kx,kz,3.0,2.4,0,(o)=>{ I.dining(o); I.pendant(o); },{kind:'comedor'}); if(r){ solid(r[0],r[1],r[2],2.0,1.0,0.77); lights.push([r[0],ceil-1.1,r[1]]); }
    if(living.area>34&&R()<0.8){ const isl=centered((L1[0]+L2[0])/2,(L1[1]+L2[1])/2,2.2,1.9,0,(o)=>I.island(o),{kind:'isla'}); if(isl) solid(isl[0],isl[1],isl[2],2.0,0.9,0.92); } }
  { const s3=LS[3]||LS[2]; if(s3) againstWall(s3[0],s3[1],1.6,0.42,0,(o)=>I.console(o),{kind:'aparador'}); }
  { const extra=Math.max(0,Math.min(8,Math.floor((living.area-60)/28))); if(extra){ const XS=seedsOf(0,4+extra,2.8).slice(4); const kinds=['lounge','sofa2','desk','plants','piano','bar','lounge','plants'];
    XS.forEach((sd,i)=>{ const kd=kinds[i%kinds.length];
      if(kd==='lounge'){ const r=centered(sd[0],sd[1],2.5,1.0,0,(o)=>I.lounge(o),{kind:'rincón de lectura',m:0.3}); if(r){ const c=Math.cos(r[2]), s=Math.sin(r[2]); for(const sg of [-1,1]) solid(r[0]+c*sg*0.78,r[1]+s*sg*0.78,r[2],0.82,0.82,0.46); againstWall(r[0]+c*1.6,r[1]+s*1.6,0.4,0.4,0,(o)=>I.lamp(o),{kind:'lámpara'}); } }
      else if(kd==='sofa2'){ const r=centered(sd[0],sd[1],2.7,3.5,0,(o)=>I.sofa2(o),{kind:'sofás',m:0.3}); if(r){ const c=Math.cos(r[2]), s=Math.sin(r[2]); for(const sg of [-1,1]) solid(r[0]-s*sg*1.25,r[1]+c*sg*1.25,r[2],2.2,0.96,0.5); solid(r[0],r[1],r[2],1.0,0.6,0.39); lights.push([r[0],ceil-0.75,r[1]]); downs.push([r[0],r[1]]); } }
      else if(kd==='bar'){ const r=centered(sd[0],sd[1],2.2,1.6,0,(o)=>I.bar(o),{kind:'barra',m:0.3}); if(r){ const s2=Math.sin(r[2]), c2=Math.cos(r[2]); solid(r[0]+0.08*s2,r[1]-0.08*c2,r[2],2.1,0.62,1.1); } }
      else if(kd==='plants'){ centered(sd[0],sd[1],1.4,1.4,0,(o)=>I.plantgroup(o),{kind:'plantas',m:0.2}); }
      else if(kd==='desk'){ const r=againstWall(sd[0],sd[1],1.45,1.5,0,(o)=>I.desk(o),{kind:'escritorio'}); if(r){ const s2=Math.sin(r[2]), c2=Math.cos(r[2]); solid(r[0]+0.4*s2,r[1]-0.4*c2,r[2],1.4,0.7,0.76); } }
      else { const r=againstWall(sd[0],sd[1],1.55,1.3,0,(o)=>I.piano(o),{tall:true,kind:'piano'}); if(r){ const s2=Math.sin(r[2]), c2=Math.cos(r[2]); solid(r[0]+0.21*s2,r[1]-0.21*c2,r[2],1.5,0.6,1.25); } } }); } }
  const privRooms=plan.rooms.slice(1);
  const bedIn=(rid,seed,kids)=>{ if(kids){ const r=againstWall(seed[0],seed[1],1.12,2.12,rid,(o)=>I.bunk(o),{tall:true,kind:'litera'}); if(r) solid(r[0],r[1],r[2],1.0,2.0,0.43); centered(seed[0]+1.4,seed[1],1.5,1.2,rid,(o)=>I.toys(o),{kind:'juguetes',m:0.1}); }
    let r=null, bw=1.6; for(const [fw,w2,ns] of [[2.4,1.6,true],[2.15,1.4,true],[1.5,1.4,false],[1.05,0.9,false]]){ r=againstWall(seed[0],seed[1],fw,2.2,rid,(o)=>I.bed(o,w2,ns),{kind:'cama'}); if(r){ bw=w2; break; } } if(r){ solid(r[0],r[1],r[2],bw+0.08,2.06,0.6); lights.push([r[0]-Math.sin(r[2])*0.4,ceil-0.75,r[1]+Math.cos(r[2])*0.4]); downs.push([r[0]-Math.sin(r[2])*1.4,r[1]+Math.cos(r[2])*1.4]); I.rug(ctx(r[0]-Math.sin(r[2])*0.9,r[1]+Math.cos(r[2])*0.9,r[2]),2.4,1.6); }
    if(!againstWall(seed[0]+1.5,seed[1]+1.5,1.8,0.62,rid,(o)=>I.wardrobe(o),{tall:true,kind:'armario'})) againstWall(seed[0],seed[1],1.25,0.36,rid,(o)=>I.shelf(o),{tall:true,kind:'cómoda'});
    const ra=(plan.rooms[rid]&&plan.rooms[rid].area)||0; if(ra>26){ const r2=againstWall(seed[0]-2,seed[1]+1,0.9,0.9,rid,(o)=>I.arm(o),{kind:'sillón'}); if(r2){ solid(r2[0],r2[1],r2[2],0.84,0.84,0.46); againstWall(r2[0]+0.9,r2[1]+0.9,0.4,0.4,rid,(o)=>I.lamp(o),{kind:'lámpara'}); } }
    if(ra>40){ const r3=againstWall(seed[0]+2,seed[1]-1.5,1.45,1.5,rid,(o)=>I.desk(o),{kind:'escritorio'}); if(r3){ const s2=Math.sin(r3[2]), c2=Math.cos(r3[2]); solid(r3[0]+0.4*s2,r3[1]-0.4*c2,r3[2],1.4,0.7,0.76); } }
    if(ra>65){ const sd2=seedsOf(rid,3,3.0); const q=sd2[2]||sd2[1]; if(q){ const r4=centered(q[0],q[1],2.5,1.0,rid,(o)=>I.lounge(o),{kind:'rincón de lectura',m:0.3}); if(r4){ const c=Math.cos(r4[2]), s=Math.sin(r4[2]); for(const sg of [-1,1]) solid(r4[0]+c*sg*0.78,r4[1]+s*sg*0.78,r4[2],0.82,0.82,0.46); } centered(q[0]+2,q[1]-1,1.4,1.4,rid,(o)=>I.plantgroup(o),{kind:'plantas',m:0.2}); } } againstWall(seed[0]-1.2,seed[1]-1.2,0.6,0.6,rid,(o)=>I.plant(o,1),{kind:'planta'}); };
  const specialIn=(rid,x,z)=>{ const sp=th.special;
    if(sp==='putting'){ centered(x,z,4.7,1.3,rid,(o)=>I.putting(o),{kind:'green de prácticas',m:0.25}); againstWall(x,z,0.4,0.4,rid,(o)=>I.golfbag(o),{kind:'bolsa'}); againstWall(x+2,z,1.4,0.44,rid,(o)=>I.trophies(o),{kind:'trofeos'}); }
    else if(sp==='games'){ const r=centered(x,z,2.6,1.5,rid,(o)=>I.pool(o),{kind:'billar'}); if(r) solid(r[0],r[1],r[2],2.55,1.45,0.81); const a=againstWall(x,z,0.76,0.8,rid,(o)=>I.arcade(o),{tall:true,kind:'recreativa'}); if(a) solid(a[0],a[1],a[2],0.72,0.76,1.8); }
    else if(sp==='zen'){ centered(x,z,2.4,2.4,rid,(o)=>I.zentable(o),{kind:'mesa baja',m:0.2}); againstWall(x,z,0.5,0.35,rid,(o)=>I.bonsai(o),{kind:'bonsái'}); for(let k=0;k<3;k++) centered(x+(R()-0.5)*4,z+(R()-0.5)*4,0.45,0.45,rid,(o)=>I.paperlamp(o),{kind:'farol',m:0.2}); }
    else if(sp==='kids'){ centered(x,z,1.7,1.7,rid,(o)=>I.tent(o),{kind:'tienda',m:0.2}); for(const c of ['red','blue','yellow']) centered(x+(R()-0.5)*3.5,z+(R()-0.5)*3.5,1.0,1.0,rid,(o)=>I.beanbag(o,c),{kind:'puf',m:0.15}); }
    else if(sp==='sea'){ againstWall(x,z,1.3,0.42,rid,(o)=>I.ship(o),{kind:'barco'}); centered(x,z,0.9,0.9,rid,(o)=>I.arm(o),{kind:'sillón',m:0.2}); const r=againstWall(x+1,z+1,2.2,2.2,rid,(o)=>I.bed(o,1.4),{kind:'cama'}); if(r) solid(r[0],r[1],r[2],1.48,2.06,0.6); }
    else if(sp==='art'){ centered(x,z,0.6,0.6,rid,(o)=>I.sculpture(o),{kind:'escultura',m:0.3}); againstWall(x,z,0.4,0.4,rid,(o)=>I.lamp(o),{kind:'lámpara'}); centered(x+1.2,z,0.84,0.84,rid,(o)=>I.arm(o),{kind:'sillón',m:0.2}); }
    else if(sp==='plants'){ for(let k=0;k<6;k++) centered(x+(R()-0.5)*5,z+(R()-0.5)*5,0.7,0.7,rid,(o)=>(k%2?I.olive(o):I.plant(o,1.0+R()*0.5)),{kind:'planta',m:0.1}); centered(x,z,0.84,0.84,rid,(o)=>I.arm(o),{kind:'sillón',m:0.2}); }
    else if(sp==='fireplace'){ againstWall(x,z,1.25,0.36,rid,(o)=>I.shelf(o),{tall:true,kind:'librería'}); centered(x,z,0.9,0.9,rid,(o)=>I.arm(o),{kind:'sillón',m:0.2}); againstWall(x+1,z,0.4,0.4,rid,(o)=>I.lamp(o),{kind:'lámpara'}); } };
  if(privRooms.length){ for(const rm of privRooms){ const sd=seedsOf(rm.id,2,2.5); if(!sd.length) continue; const s0=sd[0];
      if(rm.kind==='bed') bedIn(rm.id,s0,false);
      else if(rm.kind==='bath'){ againstWall(s0[0]-0.8,s0[1]-0.8,0.96,0.96,rm.id,(o)=>I.shower(o),{kind:'ducha'}); againstWall(s0[0]+0.9,s0[1]+0.9,1.0,0.5,rm.id,(o)=>I.vanity(o),{tall:true,kind:'lavabo'}); againstWall(s0[0],s0[1],0.5,0.6,rm.id,(o)=>I.toilet(o),{kind:'inodoro'}); againstWall(s0[0]-0.6,s0[1]+0.6,0.6,0.12,rm.id,(o)=>I.towel(o),{kind:'toallero'}); lights.push([s0[0],ceil-0.7,s0[1]]); downs.push([s0[0],s0[1]]); }
      else if(th.special==='kids'){ bedIn(rm.id,s0,true); rm.name=SPECIAL_ROOM.kids; }
      else { specialIn(rm.id,s0[0],s0[1]); rm.name=SPECIAL_ROOM[th.special]||'Estudio'; if(sd[1]) againstWall(sd[1][0],sd[1][1],1.25,0.36,rm.id,(o)=>I.shelf(o),{tall:true,kind:'librería'}); } } }
  else { const SP=seedsOf(0,6,3.0); const s2=SP[4]||SP[3], s3=SP[5]||SP[2]; if(s2) bedIn(0,s2,th.special==='kids'); if(s3) specialIn(0,s3[0],s3[1]); }
  // shelves, plants, lamps and paintings spread over every room
  const arts=[];
  plan.rooms.forEach(rm=>{ const cells=roomCells[rm.id]; if(!cells.length||rm.kind==='bath') return; const ar=rm.area||10; const nS=1+Math.round(ar/90), nP=1+Math.round(ar/38), nL=Math.round(ar/55);
    for(let k=0;k<nS;k++){ const c=cells[(R()*cells.length)|0]; againstWall(c[0],c[1],1.25,0.36,rm.id,(o)=>I.shelf(o),{tall:true,kind:'librería'}); }
    for(let k=0;k<nP;k++){ const c=cells[(R()*cells.length)|0]; againstWall(c[0],c[1],0.6,0.6,rm.id,(o)=>(R()<0.3?I.olive(o):I.plant(o,0.9+R()*0.5)),{kind:'planta'}); }
    for(let k=0;k<nL;k++){ const c=cells[(R()*cells.length)|0]; againstWall(c[0],c[1],0.4,0.4,rm.id,(o)=>I.lamp(o),{kind:'lámpara'}); }
    for(let k=0;k<2+Math.round(ar/26);k++){ const c=cells[(R()*cells.length)|0]; const wa=nearestWall(c[0],c[1]); if(wa.d>2.5||(wa.ext&&nearWindow(wa.qx,wa.qz,0.7))) continue; const cx=wa.qx-wa.nx*0.03, cz=wa.qz-wa.nz*0.03; if(Math.hypot(cx-door.x,cz-door.z)<1.5) continue;
      const aw=0.8+R()*0.6; if(talls.some(t=>Math.hypot(t[0]-cx,t[1]-cz)<t[2]+aw/2+0.3)||arts.some(q=>Math.hypot(q[0]-cx,q[1]-cz)<(q[2]+aw)/2+0.35)||!wallSpan(wa,aw/2+0.12)) continue; arts.push([cx,cz,aw]); I.art(ctx(cx,cz,wa.a),(R()*8)|0,aw); } });
  // contact shadows (lighter when the screen-space ambient occlusion is on)
  { const AT=aoTexs(); const op=FXQ===2?0.32:0.55; const band=new IB(), blob=new IB(); const y=floor+0.004, Wb=0.45;
    const bandRing=(r)=>{ for(let i=0;i<r.length;i++){ const a=r[i], c=r[(i+1)%r.length]; const dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz); if(L<0.1) continue; const nx=-dz/L, nz=dx/L;
      band.quad([a[0],y,a[1]],[c[0],y,c[1]],[c[0]+nx*Wb,y,c[1]+nz*Wb],[a[0]+nx*Wb,y,a[1]+nz*Wb],[0,1,0],[[0,1],[1,1],[1,0],[0,0]]); } };
    bandRing(extI); holes.forEach(bandRing);
    for(const [a,c] of plan.pieces){ const dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz); if(L<0.1) continue; const nx=-dz/L, nz=dx/L; for(const sg of [-1,1]){ const o=PT/2*sg, w2=(PT/2+Wb)*sg;
      band.quad([a[0]+nx*o,y,a[1]+nz*o],[c[0]+nx*o,y,c[1]+nz*o],[c[0]+nx*w2,y,c[1]+nz*w2],[a[0]+nx*w2,y,a[1]+nz*w2],[0,1,0],[[0,1],[1,1],[1,0],[0,0]]); } }
    for(const f of FP){ if(f.kind==='alfombra'||f.w*f.d<0.25) continue; const o=ctx(f.cx,f.cz,f.a); const q=[o.at(-f.w/2-0.25,-f.d/2-0.25),o.at(f.w/2+0.25,-f.d/2-0.25),o.at(f.w/2+0.25,f.d/2+0.25),o.at(-f.w/2-0.25,f.d/2+0.25)];
      blob.quad([q[0][0],y+0.002,q[0][1]],[q[1][0],y+0.002,q[1][1]],[q[2][0],y+0.002,q[2][1]],[q[3][0],y+0.002,q[3][1]],[0,1,0]); }
    const mk=(ib,tex)=>{ const m=ib.mesh(new THREE.MeshBasicMaterial({map:tex,color:0x000000,transparent:true,opacity:op,depthWrite:false}),grp,false); if(m){ m.receiveShadow=false; m.layers.set(1); m.renderOrder=1; } };
    mk(band,AT.band); mk(blob,AT.blob); }
  // recessed lights in the ceiling
  for(const [x,z] of downs) G.glow.cy(x,ceil-0.012,z,0.085,0.01);
  // build the meshes: one per material
  const meshes={}; for(const k in G){ const cast=!['glass','glow','fire','screen','led','curtain','rug','floor'].includes(k); const m=G[k].mesh(M[k],grp,cast); if(m){ meshes[k]=m; if(k==='leaf'||k==='glass') m.layers.set(1); } }
  // lights: warm lamps over the sofa, the table, the bed and the bath; daylight fills at the two largest openings; the fire
  const lp=lights.concat(lamps.map(p=>[p[0],p[1]+0.2,p[2]])).slice(0,4);
  intLights.forEach((l,i)=>{ const p=lp[i]; l.userData.on=!!p; l.intensity=0; if(p) l.position.set(p[0],p[1],p[2]); });
  const big=wins.filter(w=>w.ty!==3).map(w=>{ const ex=w.p1[0]-w.p0[0], ez=w.p1[1]-w.p0[1], L=Math.hypot(ex,ez); const t=(w.u0+w.u1)/2; return {x:w.p0[0]+ex/L*t+(-ez/L)*1.1,z:w.p0[1]+ez/L*t+(ex/L)*1.1,y:(w.v0+w.v1)/2,a:(w.u1-w.u0)*(w.v1-w.v0)}; }).filter(q=>inBld(b,q.x,q.z)).sort((p,q)=>q.a-p.a);
  const picks=[]; for(const q of big){ if(picks.every(p=>Math.hypot(p.x-q.x,p.z-q.z)>5)) picks.push(q); if(picks.length===2) break; }
  winLights.forEach((l,i)=>{ const p=picks[i]; l.userData.on=!!p&&FXQ>0; l.intensity=0; if(p) l.position.set(p.x,p.y,p.z); });
  fireLight.userData.on=!!fireAt; fireLight.intensity=0; if(fireAt) fireLight.position.set(fireAt[0],fireAt[1],fireAt[2]);
  for(const l of ROOMLIGHTS) if(FXQ||!winLights.includes(l)) scene.add(l);
  // the golden ball of this villa waits in a free spot of the living room
  for(const o of GOLD){ if(o.vb!==b||o.taken) continue; const c=freeSpot(0); if(c){ o.x=c[0]; o.z=c[1]; o.y=floor+0.9; } }
  // the building's shell stops casting shadows while inside: the sun comes in through the real openings
  for(const m of BLDMESH){ m.userData.cs=m.castShadow; m.castShadow=false; }
  const walk=new Uint8Array(nx*nz); for(let j=1;j<nz-1;j++) for(let i=1;i<nx-1;i++){ const k=j*nx+i; if(dist[k]<0.2) continue; let ok=1; for(let dj=-1;dj<=1&&ok;dj++) for(let di=-1;di<=1;di++) if(hard[k+dj*nx+di]){ ok=0; break; } walk[k]=ok; }
  const ep=freeSpot(0)||[(b.x0+b.x1)/2,(b.z0+b.z1)/2];
  // good places to stand: the far end of the living room looking back to the door, and the middle of every other room looking at its doorway
  const views=[]; { let bst=null,bd=0; for(const c of roomCells[0]){ if(occ[cellK(c[0],c[1])]) continue; const d=Math.hypot(c[0]-door.x,c[1]-door.z); if(d>bd){ bd=d; bst=c; } } if(bst) views.push({x:bst[0],z:bst[1],yaw:Math.atan2(door.z-bst[1],door.x-bst[0]),room:plan.rooms[0].name}); }
  for(const rm of plan.rooms.slice(1)){ let best=null; for(const [a,e2] of plan.doors){ const mx=(a[0]+e2[0])/2, mz=(a[1]+e2[1])/2, L=Math.hypot(e2[0]-a[0],e2[1]-a[1])||1, nx2=-(e2[1]-a[1])/L, nz2=(e2[0]-a[0])/L;
      for(const sg of [-1,1]){ const px=mx+nx2*0.8*sg, pz=mz+nz2*0.8*sg; if(plan.roomAt(px,pz)===rm.id&&inBld(b,px,pz)){ best={x:px,z:pz,dx:nx2*sg,dz:nz2*sg}; } } }
    if(!best) continue; const c=freeSpot(rm.id); const yaw=c?Math.atan2(c[1]-best.z,c[0]-best.x):Math.atan2(best.dz,best.dx); views.push({x:best.x,z:best.z,yaw,room:rm.name}); }
  S.interior={_dbg:{dist,occ,room,hard,nx,nz,cs,DBG},b,th,grp,plats,floor,ceil,door,mats:M,plan,wins,opens,shaft:null,FP,views,grid:{nx,nz,cs,x0:b.x0,z0:b.z0,walk},meshes,env:null,envT:FXQ?3:0,envP:[ep[0],floor+1.45,ep[1]],fire:!!fireAt,t:0,dGlass};
  Object.assign(sun.shadow,{bias:-0.00012,normalBias:0.015}); Object.assign(sun.shadow.camera,{near:420,far:580}); sun.shadow.camera.updateProjectionMatrix();
  updateTOD();
}
/* a reflection and bounce-light map of the room itself, captured from the middle of the living room once the
   shadows of the new walls are in place (rendered into a cube, mirrored for the PMREM convention, then filtered) */
const FLIP={scene:null,mat:null};
function interiorEnv(){ const I=S.interior; if(!I||!FXQ) return; try{
    const gen=ENV.gen||(ENV.gen=new THREE.PMREMGenerator(renderer));
    const opt={type:THREE.HalfFloatType,format:THREE.RGBAFormat,generateMipmaps:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter};
    const crt=new THREE.WebGLCubeRenderTarget(192,opt); const cc=new THREE.CubeCamera(0.05,700,crt); cc.children.forEach(c=>c.layers.enable(1)); cc.position.set(I.envP[0],I.envP[1],I.envP[2]); cc.updateMatrixWorld(true);
    const au=renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate=false; const rv=rig?rig.root.visible:false; if(rig) rig.root.visible=false;
    if(I.shaft) I.shaft.visible=false;
    const keep=[]; for(const k in I.mats){ const m=I.mats[k]; if(m.isMeshStandardMaterial&&m.envMap){ keep.push([m,m.envMapIntensity]); m.envMapIntensity=0; } }
    cc.update(renderer,scene);
    for(const [m,v] of keep) m.envMapIntensity=v; if(rig) rig.root.visible=rv; renderer.shadowMap.autoUpdate=au; if(I.shaft) I.shaft.visible=true;
    if(!FLIP.scene){ FLIP.mat=new THREE.ShaderMaterial({uniforms:{tC:{value:null}},vertexShader:'varying vec3 vD; void main(){ vD=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader:'uniform samplerCube tC; varying vec3 vD; void main(){ vec3 d=normalize(vD); vec3 c=textureCube(tC,vec3(-d.x,d.y,d.z)).rgb; float l=dot(c,vec3(0.2126,0.7152,0.0722)); c=mix(vec3(l),c,0.4)*vec3(0.985,1.0,1.03); gl_FragColor=vec4(c,1.0); }',side:THREE.BackSide,depthTest:false,depthWrite:false});
      FLIP.scene=new THREE.Scene(); FLIP.scene.add(new THREE.Mesh(new THREE.BoxGeometry(10,10,10),FLIP.mat)); }
    FLIP.mat.uniforms.tC.value=crt.texture; const frt=new THREE.WebGLCubeRenderTarget(192,opt); new THREE.CubeCamera(0.1,100,frt).update(renderer,FLIP.scene);
    const rt=gen.fromCubemap(frt.texture); crt.dispose(); frt.dispose();
    if(I.env) I.env.dispose(); I.env=rt; I.envEl=TOD.elev;
    for(const k in I.mats){ const m=I.mats[k]; if(m.isMeshStandardMaterial){ const had=!!m.envMap; m.envMap=rt.texture; m.envMapIntensity=(k==='mirror'||k==='chrome'||k==='glass'||k==='steel')?1.0:0.9; if(!had) m.needsUpdate=true; } }
  }catch(e){ console.warn('interior env',e); } }
/* sunbeams: a soft shaft of light from every opening the sun shines into, down to where it meets the floor. Each shaft is a
   pair of cards that turn around their own axis to face the camera, brighter when you look towards the sun, with drifting dust */
const SHAFT={mat:null};
function interiorShafts(){ const I=S.interior; if(!I) return; if(I.shaft){ I.grp.remove(I.shaft); I.shaft.geometry.dispose(); I.shaft=null; }
  if(TOD.night>0.4||sunDir.y<0.05) return; const Lx=-sunDir.x, Ly=-sunDir.y, Lz=-sunDir.z; const st=[], en=[], su=[], aw=[], ak=[]; const fl=I.floor+0.02;
  for(const o of I.opens){ const dn=Lx*o.n[0]+Lz*o.n[2]; if(dn<0.08) continue;
    const um=(o.h0+o.h1)/2, ym=(o.y0+o.y1)/2; const c=[o.a[0]+o.ux*um,ym,o.a[1]+o.uz*um]; const t0=Math.min(12,(ym-fl)/(-Ly)); let k=1;
    for(let it=0;it<6;it++){ const q=[c[0]+Lx*t0*k,c[2]+Lz*t0*k]; if(inBld(I.b,q[0],q[1])) break; k*=0.72; }
    const e=[c[0]+Lx*t0*k,ym+Ly*t0*k,c[2]+Lz*t0*k]; const hw=Math.max((o.h1-o.h0)/2,(o.y1-o.y0)*0.3);
    for(const [wk,kk] of [[1,1],[0.5,0.7]]) for(const [sx,ty] of [[-1,0],[1,0],[1,1],[-1,0],[1,1],[-1,1]]){ st.push(...c); en.push(...e); su.push(sx,ty); aw.push(hw*wk); ak.push(kk*Math.min(1,dn*1.6)); } }
  if(!st.length) return;
  if(!SHAFT.mat) SHAFT.mat=new THREE.ShaderMaterial({uniforms:{uCol:{value:new THREE.Color()},uK:{value:0.05},uTime:GLOBU.uTime,uSun:{value:new THREE.Vector3()}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    vertexShader:`attribute vec3 aEnd; attribute vec2 aSU; attribute float aW; attribute float aK; varying vec2 vU; varying vec3 vW; varying float vK;
      void main(){ vec3 A=aEnd-position; vec3 p=position+A*aSU.y; vec3 V=normalize(cameraPosition-p); vec3 S=cross(A,V); float sl=length(S); S=sl>1e-5?S/sl:vec3(1.0,0.0,0.0); vec3 wp=p+S*aSU.x*aW; vU=vec2(aSU.x*0.5+0.5,aSU.y); vW=wp; vK=aK; gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.0); }`,
    fragmentShader:`uniform vec3 uCol; uniform float uK; uniform float uTime; uniform vec3 uSun; varying vec2 vU; varying vec3 vW; varying float vK;
      float h3(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
      float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(mix(h3(i),h3(i+vec3(1.,0.,0.)),f.x),mix(h3(i+vec3(0.,1.,0.)),h3(i+vec3(1.,1.,0.)),f.x),f.y),mix(mix(h3(i+vec3(0.,0.,1.)),h3(i+vec3(1.,0.,1.)),f.x),mix(h3(i+vec3(0.,1.,1.)),h3(i+vec3(1.,1.,1.)),f.x),f.y),f.z); }
      void main(){ float edge=smoothstep(0.0,0.4,vU.x)*smoothstep(1.0,0.6,vU.x); float fade=smoothstep(0.0,0.1,vU.y)*pow(max(0.0,1.0-vU.y),1.1);
        vec3 vd=vW-cameraPosition; float dc=length(vd); vd/=max(dc,1e-4); float fwd=0.35+1.1*pow(max(0.0,dot(vd,uSun)),3.0); float nearF=smoothstep(0.5,1.8,dc);
        float dust=0.6+0.4*n3(vW*2.6+vec3(0.0,uTime*0.06,uTime*0.035)); float mote=smoothstep(0.93,0.99,n3(vW*24.0+vec3(uTime*0.1,-uTime*0.04,0.0)))*2.0;
        gl_FragColor=vec4(uCol*uK*vK*edge*fade*fwd*nearF*(dust+mote),1.0);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`});
  SHAFT.mat.uniforms.uCol.value.copy(sun.color); SHAFT.mat.uniforms.uSun.value.copy(sunDir); SHAFT.mat.uniforms.uK.value=(FXQ?0.11:0.06)*sun.intensity*Math.min(1,Math.max(0,(TOD.elev-2)/8));
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(st,3)); g.setAttribute('aEnd',new THREE.Float32BufferAttribute(en,3)); g.setAttribute('aSU',new THREE.Float32BufferAttribute(su,2)); g.setAttribute('aW',new THREE.Float32BufferAttribute(aw,1)); g.setAttribute('aK',new THREE.Float32BufferAttribute(ak,1));
  const m=new THREE.Mesh(g,SHAFT.mat); m.layers.set(1); m.renderOrder=5; m.frustumCulled=false; I.grp.add(m); I.shaft=m; }
function interiorFrame(){ const I=S.interior; if(I&&I.envT>0&&--I.envT===0) interiorEnv(); }
function interiorTick(dt){ const I=S.interior; if(!I) return; I.t+=dt; if(I.fire){ const f=0.8+0.25*Math.sin(I.t*13.7)+0.18*Math.sin(I.t*23.1+1.3)+0.1*Math.sin(I.t*41.0); fireLight.intensity=(1.2+1.6*TOD.night)*f; if(I.mats.fire) I.mats.fire.color.setRGB(4.2*f,1.6*f,0.35*f); } }
function exitVilla(){ const I=S.interior; if(!I) return; if(S.tour) stopTour();
  scene.remove(I.grp); I.grp.traverse(o=>{ if(o.isMesh){ o.geometry.dispose(); if(o.material!==SHAFT.mat) o.material.dispose(); } }); if(I.env) I.env.dispose();
  for(const p of I.plats) removePlat(p); for(const l of ROOMLIGHTS){ l.intensity=0; l.userData.on=false; scene.remove(l); }
  for(const m of BLDMESH) m.castShadow=m.userData.cs!==false;
  Object.assign(sun.shadow,{bias:-0.0004,normalBias:0.35}); Object.assign(sun.shadow.camera,{near:1,far:1200}); sun.shadow.camera.updateProjectionMatrix();
  const d=I.door; S.interior=null; setFP(false); updateTOD(); P.x=d.x+d.nx*1.5; P.z=d.z+d.nz*1.5; P.y=groundAt(P.x,P.z,999); P.vx=P.vy=P.vz=0; P.yaw=Math.atan2(d.nz,d.nx); camS.yaw=P.yaw; camS.dist=5.4; camS.pitch=0.3; }
function removePlat(p){ const i=PLAT.indexOf(p); if(i>=0) PLAT.splice(i,1); for(const [k,arr] of platGrid){ const j=arr.indexOf(p); if(j>=0) arr.splice(j,1); } }
function villaNear(x,z){ let best=null,bd=2.2; for(const b of bldsNear(x,z)){ if(b.kind!=='villa'||!b.ring) continue; if(inBld(b,x,z)) continue; const e=nearestEdge(b,x,z); if(e[0]<bd){ bd=e[0]; best=b; } } return best; }
// first-person visit: the camera sits at eye height and your own body moves to a layer the camera does not draw (friends still see you)
function setFP(on){ camS.fp=!!on; if(rig) rig.root.traverse(o=>o.layers.set(on?2:0)); camera.fov=on?72:60; camera.updateProjectionMatrix(); const b=$('bView'); if(b){ b.textContent=on?'3ª':'1ª'; b.setAttribute('aria-label',on?'Ver en tercera persona':'Ver en primera persona'); } }
function toggleView(){ if(!S.interior) return; setFP(!camS.fp); store.set('vg_fp',camS.fp?'1':'0'); S.snap=true; tip(camS.fp?'Vista en primera persona: arrastra para mirar alrededor':'Vista en tercera persona',1800); }
/* ---- guided tour: the camera walks through every room by the free floor, stops in each one and looks around ---- */
function gridPath(G,ax,az,bx,bz){ const id=(x,z)=>{ const i=Math.round((x-G.x0)/G.cs), j=Math.round((z-G.z0)/G.cs); return (i<0||j<0||i>=G.nx||j>=G.nz)?-1:j*G.nx+i; };
  const snap=(k)=>{ if(k>=0&&G.walk[k]) return k; if(k<0) return -1; const i0=k%G.nx, j0=(k/G.nx)|0; for(let r=1;r<10;r++) for(let dj=-r;dj<=r;dj++) for(let di=-r;di<=r;di++){ const i=i0+di, j=j0+dj; if(i<0||j<0||i>=G.nx||j>=G.nz) continue; const kk=j*G.nx+i; if(G.walk[kk]) return kk; } return -1; };
  const s=snap(id(ax,az)), t=snap(id(bx,bz)); if(s<0||t<0) return null; const N=G.nx*G.nz, gS=new Float32Array(N).fill(1e9), came=new Int32Array(N).fill(-1), closed=new Uint8Array(N); gS[s]=0; const open=[s]; const ti=t%G.nx, tj=(t/G.nx)|0;
  while(open.length){ let bi=0, bf=1e9; for(let q=0;q<open.length;q++){ const k=open[q]; const f=gS[k]+Math.hypot(k%G.nx-ti,((k/G.nx)|0)-tj); if(f<bf){ bf=f; bi=q; } } const k=open[bi]; open[bi]=open[open.length-1]; open.pop(); if(k===t) break; if(closed[k]) continue; closed[k]=1; const i=k%G.nx, j=(k/G.nx)|0;
    for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){ if(!di&&!dj) continue; const ni=i+di, nj=j+dj; if(ni<0||nj<0||ni>=G.nx||nj>=G.nz) continue; const kk=nj*G.nx+ni; if(!G.walk[kk]||closed[kk]) continue; if(di&&dj&&(!G.walk[j*G.nx+ni]||!G.walk[nj*G.nx+i])) continue; const ng=gS[k]+(di&&dj?1.4142:1); if(ng<gS[kk]){ gS[kk]=ng; came[kk]=k; open.push(kk); } } }
  if(s!==t&&came[t]<0) return null; const pts=[]; for(let k=t;k>=0;k=came[k]){ pts.push([G.x0+(k%G.nx)*G.cs,G.z0+((k/G.nx)|0)*G.cs]); if(k===s) break; } pts.reverse();
  const clear=(a,b)=>{ const L=Math.hypot(b[0]-a[0],b[1]-a[1]); for(let t2=0;t2<=L;t2+=0.1){ const k=id(a[0]+(b[0]-a[0])*t2/L,a[1]+(b[1]-a[1])*t2/L); if(k<0||!G.walk[k]) return false; } return true; };
  const out=[pts[0]]; let i=0; while(i<pts.length-1){ let j=pts.length-1; while(j>i+1&&!clear(pts[i],pts[j])) j--; out.push(pts[j]); i=j; } return out; }
function startTour(){ const I=S.interior; if(!I||S.tour) return; const G=I.grid; const stops=[{x:P.x,z:P.z,yaw:camS.yaw,room:''}].concat(I.views); const path=[], marks=[];
  for(let k=1;k<stops.length;k++){ const a=path.length?path[path.length-1]:[stops[0].x,stops[0].z]; const seg=gridPath(G,a[0],a[1],stops[k].x,stops[k].z); if(!seg) continue; if(!path.length) path.push(seg[0]); for(let q=1;q<seg.length;q++) path.push(seg[q]); marks.push({i:path.length-1,yaw:stops[k].yaw,room:stops[k].room}); }
  if(path.length<2){ tip('Esta casa es pequeña: mírala girando la cámara',2500); return; }
  const cum=[0]; for(let k=1;k<path.length;k++) cum.push(cum[k-1]+Math.hypot(path[k][0]-path[k-1][0],path[k][1]-path[k-1][1]));
  S.tour={path,cum,marks,d:0,m:0,pause:0,t0:performance.now(),yaw:camS.yaw,wasFP:!!camS.fp}; setFP(true); P.sprintLock=false; refreshTourBtn(); tip('Recorrido de la casa: toca la pantalla o muévete para pararlo',3000); }
function stopTour(){ if(!S.tour) return; const T=S.tour; S.tour=null; P.vx=P.vz=0; if(!T.wasFP) setFP(false); refreshTourBtn(); }
function refreshTourBtn(){ const b=$('bTour'); if(!b) return; b.hidden=!(S.mode==='walk'&&S.interior); b.textContent=S.tour?'■ Parar recorrido':'▶ Recorrido'; }
function tourStep(dt){ const T=S.tour, I=S.interior; if(!T||!I){ S.tour=null; return; }
  if(Math.hypot(inp.mx,inp.my)>0.15||inp.jumpQ||camS.lastLook>T.t0+80){ stopTour(); return; }
  const at=(d)=>{ let k=1; while(k<T.cum.length-1&&T.cum[k]<d) k++; const a=T.path[k-1], b=T.path[k], L=(T.cum[k]-T.cum[k-1])||1, f=Math.max(0,Math.min(1,(d-T.cum[k-1])/L)); return [a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f]; };
  const mk=T.marks[T.m]; const end=T.cum[T.cum.length-1];
  if(T.pause>0){ T.pause-=dt; const ph=1-T.pause/3.2; const yaw=mk.yaw+Math.sin(ph*Math.PI*2)*0.55; camS.yaw=lerpAng(camS.yaw,yaw,1-Math.exp(-dt*2.2)); P.vx=P.vz=0;
    if(T.pause<=0){ T.m++; if(T.m>=T.marks.length){ stopTour(); tip('Fin del recorrido',2000); } } }
  else { const target=mk?T.cum[mk.i]:end; const v=1.15; const d0=T.d; T.d=Math.min(target,T.d+v*dt); const p=at(T.d), ah=at(Math.min(end,T.d+1.4));
    P.vx=(p[0]-P.x)/Math.max(dt,1e-3); P.vz=(p[1]-P.z)/Math.max(dt,1e-3); P.x=p[0]; P.z=p[1];
    const dx=ah[0]-p[0], dz=ah[1]-p[1]; if(Math.hypot(dx,dz)>0.05){ const want=Math.atan2(dz,dx); camS.yaw=lerpAng(camS.yaw,want,1-Math.exp(-dt*2.6)); P.yaw=camS.yaw; }
    if(mk&&T.d>=target-1e-4){ T.pause=3.2; if(mk.room){ const rm=I.plan.rooms.find(r=>r.name===mk.room); tip(mk.room+(rm&&rm.area?' · '+Math.round(rm.area)+' m²':''),2600); } } }
  camS.pitch+=(0.1-camS.pitch)*(1-Math.exp(-dt*2)); P.y=groundAt(P.x,P.z,P.y+0.5); P.vy=0; P.onGround=true; }
function interiorCamBlocked(px,pz){ const I=S.interior; if(!I||!I.plan) return false; for(const pc of I.plan.pieces){ if(segDist(px,pz,pc[0],pc[1])[0]<0.22) return true; if(segX(P.x,P.z,px,pz,pc[0],pc[1])) return true; } return false; }
function interiorRoomName(){ const I=S.interior; if(!I) return ''; const rm=I.plan.rooms[I.plan.roomAt(P.x,P.z)]; return rm?rm.name:''; }
function goInside(b){ blip('door'); fadeTo(()=>{ enterVilla(b,P.x,P.z); const I=S.interior, d=I.door; P.x=d.x-d.nx*1.3; P.z=d.z-d.nz*1.3; P.y=I.floor; P.vx=P.vy=P.vz=0; P.yaw=Math.atan2(-d.nz,-d.nx); camS.yaw=P.yaw; camS.pitch=0.06; setFP(store.get('vg_fp')!=='0');
  const rooms=I.plan.rooms.slice(1).map(r=>r.name.toLowerCase()); tip('Villa de estilo '+I.th.n.toLowerCase()+' · '+Math.round(I.b.area)+' m² · '+(rooms.length?'salón-cocina, '+rooms.join(', '):'salón-cocina abierto')+' · el minimapa es ahora el plano de la casa',5200); }); }
function goOutside(){ blip('door'); fadeTo(()=>exitVilla()); }
// a golden ball waits in the living room of one villa in the south (its beam shows through the roof)
function insideGoldSpot(near){ let best=null; for(const b of BLD){ if(b.kind!=='villa'||b.area<180) continue;
    if(near){ if(!best||Math.hypot(b.c[0]-near[0],b.c[1]-near[1])<Math.hypot(best.c[0]-near[0],best.c[1]-near[1])) best=b; continue; }
    if(b.c[1]<560) continue; if(!best||b.c[0]>best.c[0]) best=b; } if(!best) return null;
  const fl=interiorFloor(best); let bc=null; for(let x=best.x0;x<=best.x1;x+=0.5) for(let z=best.z0;z<=best.z1;z+=0.5){ if(!inBld(best,x,z)) continue; const d=nearestEdge(best,x,z)[0]; if(!bc||d>bc[2]) bc=[x,z,d]; }
  return bc?{x:bc[0],y:fl+0.9,z:bc[1],b:best}:null; }

/* ---- the floor plan: minimap and big map while inside ---- */
const PLAN_COL={floor:'#f3ede2',wall:'#2b2f33',part:'#5b6168',win:'#3d8fd1',door:'#c9a24a',furn:'#d8cdbb',rug:'#e7c9a9',out:'#dfe5dc'};
function drawPlan(g,W_,H_,big){ const I=S.interior; if(!I) return; const b=I.b; const k=W_/360; const pad=(big?22:10)*k; const s=Math.min((W_-pad*2)/(b.x1-b.x0),(H_-pad*2)/(b.z1-b.z0)); const ox=(W_-(b.x1-b.x0)*s)/2, oz=(H_-(b.z1-b.z0)*s)/2;
  const T=(x,z)=>[ox+(x-b.x0)*s,oz+(z-b.z0)*s];
  g.fillStyle=PLAN_COL.out; g.fillRect(0,0,W_,H_);
  const path=(r)=>{ g.beginPath(); r.forEach((p,i)=>{ const [x,y]=T(p[0],p[1]); i?g.lineTo(x,y):g.moveTo(x,y); }); g.closePath(); };
  path(b.ring); g.fillStyle=PLAN_COL.floor; g.fill(); for(const h of b.holesO){ path(h); g.fillStyle=PLAN_COL.out; g.fill(); }
  const fps=I.FP.slice().sort((p,q)=>(q.kind==='alfombra')-(p.kind==='alfombra'));
  for(const f of fps){ g.save(); const [x,y]=T(f.cx,f.cz); g.translate(x,y); g.rotate(f.a); g.fillStyle=f.kind==='alfombra'?PLAN_COL.rug:PLAN_COL.furn; g.strokeStyle='rgba(0,0,0,0.28)'; g.lineWidth=Math.max(1,k*0.6); g.fillRect(-f.w*s/2,-f.d*s/2,f.w*s,f.d*s); g.strokeRect(-f.w*s/2,-f.d*s/2,f.w*s,f.d*s);
    if(big&&f.w*s>30*k&&f.kind!=='alfombra'){ g.rotate(-f.a); g.fillStyle='#4f5b53'; g.font='600 '+(6.5*k)+'px Figtree, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(f.kind,0,0); } g.restore(); }
  g.lineCap='round'; g.lineJoin='round'; g.strokeStyle=PLAN_COL.wall; g.lineWidth=Math.max(3,s*0.24); path(b.ring); g.stroke(); for(const h of b.holesO){ path(h); g.stroke(); }
  g.strokeStyle=PLAN_COL.part; g.lineWidth=Math.max(2,s*0.12); for(const [a,c] of I.plan.pieces){ const [x1,y1]=T(a[0],a[1]), [x2,y2]=T(c[0],c[1]); g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); }
  g.strokeStyle=PLAN_COL.win; g.lineWidth=Math.max(3,s*0.16); for(const w of I.wins){ const ex=w.p1[0]-w.p0[0], ez=w.p1[1]-w.p0[1], L=Math.hypot(ex,ez); const ux=ex/L, uz=ez/L; const [x1,y1]=T(w.p0[0]+ux*w.u0,w.p0[1]+uz*w.u0), [x2,y2]=T(w.p0[0]+ux*w.u1,w.p0[1]+uz*w.u1); g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); }
  g.strokeStyle=PLAN_COL.door; const d=I.door; { const ux=-d.nz, uz=d.nx; const [x1,y1]=T(d.x-ux*0.55,d.z-uz*0.55), [x2,y2]=T(d.x+ux*0.55,d.z+uz*0.55); g.lineWidth=Math.max(4,s*0.2); g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); }
  for(const [a,c] of I.plan.doors){ const [x1,y1]=T(a[0],a[1]), [x2,y2]=T(c[0],c[1]); g.lineWidth=Math.max(2,s*0.1); g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); }
  if(big){ g.font='800 '+(8*k)+'px Figtree, sans-serif'; g.textAlign='center'; g.textBaseline='middle';
    for(const rm of I.plan.rooms){ let sx2=0,sz2=0,n=0; for(let x=b.x0;x<=b.x1;x+=0.5) for(let z=b.z0;z<=b.z1;z+=0.5){ if(inBld(b,x,z)&&I.plan.roomAt(x,z)===rm.id){ sx2+=x; sz2+=z; n++; } } if(!n) continue; const [x,y]=T(sx2/n,sz2/n); const lbl=rm.name+(rm.area?' · '+Math.round(rm.area)+' m²':''); const tw=g.measureText(lbl).width+10*k; g.fillStyle='rgba(255,255,255,0.86)'; g.fillRect(x-tw/2,y-7*k,tw,14*k); g.fillStyle='#16231b'; g.fillText(lbl,x,y); }
    g.fillStyle='#16231b'; g.fillRect(8*k,H_-10*k,2*s,2*k); g.font='700 '+(7.5*k)+'px Figtree, sans-serif'; g.textAlign='left'; g.fillText('2 m',8*k,H_-16*k); g.font='800 '+(10*k)+'px Figtree, sans-serif'; g.fillText('N ↑',8*k,10*k); }
  const [px,py]=T(P.x,P.z); drawArrow(g,px,py,camS.fp?camS.yaw:P.yaw,big?9*k:8);
}
function planLegendHTML(){ const I=S.interior; const it=(c,t,line)=>'<div><i style="background:'+c+';'+(line?'height:4px;border:0;border-radius:2px':'')+'"></i>'+t+'</div>';
  return '<p class="note" style="margin:6px 0">Plano de esta villa de estilo '+(I?I.th.n.toLowerCase():'')+' ('+(I?Math.round(I.b.area):0)+' m² según el Catastro). Arriba es el norte; la flecha eres tú y apunta hacia donde miras. Cada estancia lleva su nombre y su superficie aproximada.</p><div class="legend">'+it(PLAN_COL.wall,'Fachada (muro exterior)',true)+it(PLAN_COL.part,'Tabique interior',true)+it(PLAN_COL.win,'Ventana o cristalera (hueco real)',true)+it(PLAN_COL.door,'Puerta o paso entre estancias',true)+it(PLAN_COL.furn,'Mueble (con su nombre si cabe)')+it(PLAN_COL.rug,'Alfombra')+it(PLAN_COL.floor,'Suelo interior')+it(PLAN_COL.out,'Exterior y patios')+'</div><p class="note">Barra de escala: 2 m. Pulsa Salir para volver al jardín.</p>'; }
