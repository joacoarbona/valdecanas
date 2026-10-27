(function(){
"use strict";
const V3=THREE.Vector3;
const $=id=>document.getElementById(id);
const fmt=(n,d=0)=>n.toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const store={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
const isCoarse=matchMedia('(pointer:coarse)').matches;
const QUAL=store.get('vg_q')||(isCoarse?'med':'high');
const HIGH=QUAL==='high';
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function Cc(hex){ return new THREE.Color(hex).convertSRGBToLinear(); }
function lin(hex){ const c=Cc(hex); return [c.r,c.g,c.b]; }
function mixc(a,b,t){ return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]; }
function clamp(v,a,b){ return v<a?a:v>b?b:v; }
function lerpAng(a,b,t){ let d=b-a; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; return a+d*t; }
const rng=W.rng, sstep=W.sstep;
function hsh(a,b){ let h=(Math.imul(a|0,374761393)+Math.imul(b|0,668265263))|0; h=Math.imul(h^(h>>>13),1274126177); h^=h>>>16; return (h>>>0)/4294967296; }

/* ================= renderer, scene, light ================= */
const canvas=$('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, HIGH?2:1.5));
renderer.setSize(innerWidth,innerHeight,false);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const MAXANI=renderer.capabilities.getMaxAnisotropy();
const scene=new THREE.Scene();
const HOR='#d5e2e9', ZEN='#6b9dcc', FOG_NEAR=1600, FOG_FAR=38000;
scene.fog=new THREE.Fog(Cc(HOR),FOG_NEAR,FOG_FAR);
scene.background=Cc(HOR);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.3,60000);
camera.position.set(900,600,900);
const sunDir=new V3(-0.42,0.74,0.53).normalize();
scene.add(new THREE.HemisphereLight(Cc('#e3edf5'),Cc('#7d6f4d'),0.55));
const sun=new THREE.DirectionalLight(Cc('#fff1da'),0.82); scene.add(sun); scene.add(sun.target);
sun.castShadow=true; sun.shadow.mapSize.set(HIGH?2048:1024,HIGH?2048:1024);
Object.assign(sun.shadow.camera,{left:-90,right:90,top:90,bottom:-90,near:1,far:1200});
sun.shadow.bias=-0.0004; sun.shadow.normalBias=0.35;

const sky=new THREE.Mesh(new THREE.SphereGeometry(50000,32,16),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{uHor:{value:new THREE.Color(HOR)},uZen:{value:new THREE.Color(ZEN)},uSun:{value:sunDir}},
  vertexShader:'varying vec3 vD; void main(){ vD=normalize(position); vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position=p.xyww; }',
  fragmentShader:'uniform vec3 uHor,uZen,uSun; varying vec3 vD; void main(){ float h=max(vD.y,0.0); vec3 c=mix(uHor,uZen,pow(h,0.55)); float s=max(dot(vD,uSun),0.0); c+=vec3(1.0,0.93,0.78)*(pow(s,700.0)*1.2+pow(s,10.0)*0.16); gl_FragColor=vec4(c,1.0); }'
}));
sky.renderOrder=-10; scene.add(sky);

const waterMat=new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uSun:{value:sunDir},uDeep:{value:new THREE.Color('#3a6d7a')},uHor:{value:new THREE.Color(HOR)},uZen:{value:new THREE.Color('#8fb6d8')},uFog:{value:new THREE.Color(HOR)},uNear:{value:FOG_NEAR},uFar:{value:FOG_FAR}},
  vertexShader:'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
  fragmentShader:[
   'precision highp float;',
   'uniform float uTime,uNear,uFar; uniform vec3 uSun,uDeep,uHor,uZen,uFog; varying vec3 vW;',
   'vec2 wv(vec2 p, vec2 d, float k, float s, float a){ float ph=dot(p,d)*k+uTime*s; return d*k*a*cos(ph); }',
   'void main(){',
   ' vec3 V=cameraPosition-vW; float dist=length(V); V/=dist;',
   ' vec2 p=vW.xz; float fade=1.0-smoothstep(150.0,3500.0,dist);',
   ' vec2 g=wv(p,normalize(vec2(1.0,0.3)),0.21,1.3,0.10)+wv(p,normalize(vec2(-0.4,1.0)),0.33,1.7,0.06)+wv(p,normalize(vec2(0.8,-0.7)),0.71,2.3,0.025)+wv(p,normalize(vec2(-0.9,-0.2)),1.37,3.1,0.012)+wv(p,normalize(vec2(0.2,0.95)),2.9,4.0,0.005);',
   ' g*=fade; vec3 N=normalize(vec3(-g.x,1.0,-g.y));',
   ' float fr=0.05+0.95*pow(1.0-max(dot(N,V),0.0),5.0);',
   ' vec3 R=reflect(-V,N); vec3 sk=mix(uHor,uZen,clamp(R.y*2.2,0.0,1.0));',
   ' vec3 col=mix(uDeep,sk,clamp(fr*1.1,0.0,1.0));',
   ' float sp=pow(max(dot(R,uSun),0.0),240.0); col+=vec3(1.0,0.96,0.88)*sp*1.5;',
   ' col=mix(col,uFog,smoothstep(uNear,uFar,dist));',
   ' gl_FragColor=vec4(col,1.0);',
   '}'].join('\n')
});
waterMat.side=THREE.DoubleSide;

/* ================= texture helpers ================= */
function loadTex(name){ return new Promise((res,rej)=>{ new THREE.TextureLoader().load(DATA_BASE+name,t=>{ t.encoding=THREE.sRGBEncoding; t.anisotropy=Math.min(HIGH?8:4,MAXANI); res(t); },undefined,()=>rej(new Error('No se pudo cargar '+name))); }); }
function loadImg(name){ return new Promise((res,rej)=>{ const im=new Image(); im.onload=()=>res(im); im.onerror=()=>rej(new Error('No se pudo cargar '+name)); im.src=DATA_BASE+name; }); }
function canvasTex(w,h,draw,repeat){ const c=document.createElement('canvas'); c.width=w; c.height=h; draw(c.getContext('2d'),w,h); const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=Math.min(8,MAXANI); if(repeat){ t.wrapS=t.wrapT=THREE.RepeatWrapping; } return t; }
function speckle(g,w,h,n,seed,cols){ const R=rng(seed); for(let i=0;i<n;i++){ g.fillStyle=cols[(R()*cols.length)|0]; const s=0.8+R()*2.6; g.fillRect(R()*w,R()*h,s,s); } }

/* ================= terrain from the IGN relief, dressed with the PNOA photo ================= */
const pickables=[];
const NOISE_GLSL='float hh(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }\nfloat vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hh(i),hh(i+vec2(1.0,0.0)),f.x),mix(hh(i+vec2(0.0,1.0)),hh(i+vec2(1.0,1.0)),f.x),f.y); }\n';
function injectWP(sh){ sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.0)).xyz;'); }
// surface codes from the course map: 3 fairway, 4 fringe, 5 green, 6 tee, 7 bunker
const CORE_FRAG=`
 { vec2 suv=(vWP.xz-uSurfB.xy)/uSurfB.z; float code=floor(texture2D(tSurf,suv).r*255.0+0.5);
   float dc=distance(vWP,cameraPosition); float nearF=1.0-smoothstep(15.0,220.0,dc); float midF=1.0-smoothstep(80.0,900.0,dc);
   float d1=texture2D(tDet,vWP.xz*0.16).r, d2=texture2D(tDet,vWP.xz*0.035+0.37).r;
   vec3 c=diffuseColor.rgb*0.92; float l=dot(c,vec3(0.299,0.587,0.114)); c=mix(vec3(l),c,0.86);
   float amp=0.6;
   if(code>2.5&&code<3.5){ float st=step(0.5,fract(dot(vWP.xz,vec2(0.6,0.8))/11.0)); c=mix(c,vec3(0.12,0.29,0.06),0.16)*mix(0.95,1.06,st); amp=0.32; }
   else if(code>3.5&&code<4.5){ c=mix(c,vec3(0.13,0.31,0.07),0.3); amp=0.25; }
   else if(code>4.5&&code<5.5){ c=mix(c,vec3(0.12,0.33,0.07),0.45)*(0.98+0.045*step(0.5,fract((vWP.x+vWP.z)/5.0))); amp=0.14; }
   else if(code>5.5&&code<6.5){ c=mix(c,vec3(0.13,0.32,0.07),0.32); amp=0.25; }
   else if(code>6.5&&code<7.5){ c=mix(c,vec3(0.78,0.66,0.45),0.62); amp=0.22; }
   else if(code>7.5&&code<8.5){ amp=0.3; }
   c*=mix(1.0,(1.0-amp*0.5)+amp*d1,nearF)*mix(1.0,0.9+0.2*d2,midF);
   diffuseColor.rgb=c; }`;
function detailTex(){ return canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#808080'; g.fillRect(0,0,w,h); const R=rng(123);
  for(let i=0;i<2600;i++){ const v=60+R()*150|0; g.fillStyle='rgba('+v+','+v+','+v+',0.35)'; const r=1+R()*5; g.beginPath(); g.arc(R()*w,R()*h,r,0,7); g.fill(); }
  g.lineCap='round'; for(let i=0;i<9000;i++){ const v=50+R()*170|0; g.strokeStyle='rgba('+v+','+v+','+v+',0.55)'; g.lineWidth=0.6+R()*0.9; const x=R()*w, y=R()*h, a=-1.2+R()*2.4, L=2+R()*5; g.beginPath(); g.moveTo(x,y); g.lineTo(x+Math.sin(a)*L,y-Math.cos(a)*L); g.stroke(); }
},true); }
let surfTex=null;
function makeSurfTex(){ const S=W.surf; const t=new THREE.DataTexture(S.data,S.w,S.h,THREE.LuminanceFormat,THREE.UnsignedByteType); t.magFilter=THREE.NearestFilter; t.minFilter=THREE.NearestFilter; t.generateMipmaps=false; t.needsUpdate=true; return t; }
const TP={dry:lin('#948a72'),dry2:lin('#a39a80'),oak:lin('#5c6146'),scrub:lin('#646a4e'),rock:lin('#8b8a84'),shore:lin('#968872')};
function outerColor(x,z,h){
  let c=mixc(TP.dry,TP.dry2,0.5+0.5*W.vnoise(x/900,z/900));
  c=mixc(c,TP.oak,sstep(-0.1,0.6,W.vnoise(x/260+7,z/260-3))*0.6);
  c=mixc(c,TP.scrub,sstep(260,750,h)*0.8); c=mixc(c,TP.rock,sstep(1050,1550,h)*0.7);
  if(h>-1&&h<3) c=mixc(c,TP.shore,0.5);
  return c;
}
function buildCore(tex){
  const C=W.CORE, S=C[2], N=HIGH?512:320;
  const geo=new THREE.PlaneGeometry(S,S,N,N); geo.rotateX(-Math.PI/2); geo.translate(C[0]+S/2,0,C[1]+S/2);
  const pos=geo.attributes.position; for(let i=0;i<pos.count;i++) pos.setY(i,W.terrain(pos.getX(i),pos.getZ(i)));
  geo.computeVertexNormals();
  const mat=new THREE.MeshLambertMaterial({map:tex});
  const det=detailTex(); det.encoding=THREE.LinearEncoding;
  mat.onBeforeCompile=sh=>{ injectWP(sh); sh.uniforms.tSurf={value:surfTex}; sh.uniforms.tDet={value:det}; sh.uniforms.uSurfB={value:new V3(C[0],C[1],S)};
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;\nuniform sampler2D tSurf; uniform sampler2D tDet; uniform vec3 uSurfB;\n').replace('#include <map_fragment>','#include <map_fragment>\n'+CORE_FRAG); };
  const m=new THREE.Mesh(geo,mat); m.receiveShadow=true; scene.add(m); pickables.push(m);
  // skirt hides hairline gaps against the surrounding terrain
  const sp=[]; const st=S/N; const sides=[[C[0],C[1],1,0],[C[0]+S,C[1],0,1],[C[0]+S,C[1]+S,-1,0],[C[0],C[1]+S,0,-1]];
  for(const [sx,sz,dx,dz] of sides){ for(let k=0;k<N;k++){ const ax=sx+dx*k*st, az=sz+dz*k*st, bx=ax+dx*st, bz=az+dz*st; const ha=W.terrain(ax,az), hb=W.terrain(bx,bz); sp.push(ax,ha,az,bx,hb,bz,bx,hb-6,bz, ax,ha,az,bx,hb-6,bz,ax,ha-6,az); } }
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3)); sg.computeVertexNormals();
  scene.add(new THREE.Mesh(sg,new THREE.MeshLambertMaterial({color:Cc('#857a62'),side:THREE.DoubleSide})));
}
function wideMaterial(tex){
  const m=new THREE.MeshLambertMaterial({map:tex,vertexColors:true});
  m.onBeforeCompile=sh=>{ injectWP(sh); sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;\n'+NOISE_GLSL)
    .replace('#include <map_fragment>','vec4 texelColor=texture2D(map,vUv); texelColor=mapTexelToLinear(texelColor);\nfloat ins=smoothstep(0.0,0.035,min(min(vUv.x,1.0-vUv.x),min(vUv.y,1.0-vUv.y)));\nfloat dn=vn(vWP.xz*0.035)*0.6+vn(vWP.xz*0.11)*0.4; vec3 oc=vColor*(0.86+0.22*vn(vWP.xz*0.0021)+(dn-0.5)*0.22);\ndiffuseColor.rgb=mix(oc,texelColor.rgb*0.9,ins);')
    .replace('#include <color_fragment>',''); };
  return m;
}
function buildWide(tex){
  const N=HIGH?300:220, S=5200; const geo=new THREE.PlaneGeometry(S,S,N,N); geo.rotateX(-Math.PI/2);
  const pos=geo.attributes.position, n=pos.count; const col=new Float32Array(n*3), uv=new Float32Array(n*2); const C=W.CORE;
  for(let i=0;i<n;i++){ const x=pos.getX(i), z=pos.getZ(i); let h=W.terrain(x,z);
    if(x>C[0]+30&&x<C[0]+C[2]-30&&z>C[1]+30&&z<C[1]+C[2]-30) h-=14;
    pos.setY(i,h); col.set(outerColor(x,z,h),i*3); uv[i*2]=(x+1600)/3200; uv[i*2+1]=1-(z+1600)/3200; }
  geo.setAttribute('color',new THREE.BufferAttribute(col,3)); geo.setAttribute('uv',new THREE.BufferAttribute(uv,2)); geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,wideMaterial(tex)); m.receiveShadow=true; scene.add(m); pickables.push(m);
  // skirt on the outer edge, against the regional relief
  const sp=[]; const st=S/N; const h0=S/2; const sides=[[-h0,-h0,1,0],[h0,-h0,0,1],[h0,h0,-1,0],[-h0,h0,0,-1]];
  for(const [sx,sz,dx,dz] of sides){ for(let k=0;k<N;k++){ const ax=sx+dx*k*st, az=sz+dz*k*st, bx=ax+dx*st, bz=az+dz*st; const ha=W.terrain(ax,az), hb=W.terrain(bx,bz); sp.push(ax,ha,az,bx,hb,bz,bx,hb-40,bz, ax,ha,az,bx,hb-40,bz,ax,ha-40,az); } }
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3)); sg.computeVertexNormals();
  scene.add(new THREE.Mesh(sg,new THREE.MeshLambertMaterial({color:Cc('#857a62'),side:THREE.DoubleSide})));
}
let RESMASK=null;
function resAt(x,z){ const R=W.reg; const j=Math.round((x-R.x0)/R.step), i=Math.round((z-R.z0)/R.step); if(i<0||j<0||i>=R.h||j>=R.w) return false; return !!RESMASK[i*R.w+j]; }
function regionStrip(x0,x1,z0,z1,nx,nz,mat){
  const geo=new THREE.PlaneGeometry(x1-x0,z1-z0,nx,nz); geo.rotateX(-Math.PI/2); geo.translate((x0+x1)/2,0,(z0+z1)/2);
  const pos=geo.attributes.position, n=pos.count; const col=new Float32Array(n*3);
  for(let i=0;i<n;i++){ const x=pos.getX(i), z=pos.getZ(i); let h=W.terrain(x,z), hc=h; if(h<0.9&&!resAt(x,z)){ h=0.9+Math.max(0,h)*0.2; hc=25; } pos.setY(i,h); col.set(outerColor(x,z,hc),i*3); }
  geo.setAttribute('color',new THREE.BufferAttribute(col,3)); geo.computeVertexNormals(); scene.add(new THREE.Mesh(geo,mat));
}
function outerMaterial(){ const m=new THREE.MeshLambertMaterial({vertexColors:true});
  m.onBeforeCompile=sh=>{ injectWP(sh); sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;\n'+NOISE_GLSL)
    .replace('#include <color_fragment>','#include <color_fragment>\nfloat dn=vn(vWP.xz*0.035)*0.6+vn(vWP.xz*0.11)*0.4; diffuseColor.rgb*=0.86+0.22*vn(vWP.xz*0.0021)+(dn-0.5)*0.22;'); };
  return m; }
function buildRegion(){
  RESMASK=reservoirMask(W.reg);
  const mat=outerMaterial(); const E=40000, B=2600, k=HIGH?1:1.4;
  const nl=Math.round(2*E/400/k), nb=Math.round((E-B)/400/k), ns=Math.max(4,Math.round(2*B/400/k));
  regionStrip(-E,E,-E,-B,nl,nb,mat); regionStrip(-E,E,B,E,nl,nb,mat); regionStrip(-E,-B,-B,B,nb,ns,mat); regionStrip(B,E,-B,B,nb,ns,mat);
}
// water: the reservoir only (the lowlands around Navalmoral sit below its level but are dry land)
function reservoirMask(R){
  const n=R.w*R.h, m=new Uint8Array(n), d=R.data; const isRes=k=>Math.abs(d[k]+10.25)<0.06;
  const q=[]; const ci=Math.round((0-R.z0)/R.step), cj=Math.round((0-R.x0)/R.step);
  for(let i=ci-15;i<=ci+15;i++) for(let j=cj-15;j<=cj+15;j++){ if(i<0||j<0||i>=R.h||j>=R.w) continue; const k=i*R.w+j; if(isRes(k)&&!m[k]){ m[k]=1; q.push(k); } }
  while(q.length){ const k=q.pop(); const i=(k/R.w)|0, j=k%R.w; const nb=[[i+1,j],[i-1,j],[i,j+1],[i,j-1]]; for(const [ii,jj] of nb){ if(ii<0||jj<0||ii>=R.h||jj>=R.w) continue; const kk=ii*R.w+jj; if(!m[kk]&&isRes(kk)){ m[kk]=1; q.push(kk); } } }
  for(let it=0;it<2;it++){ const add=[]; for(let k=0;k<n;k++){ if(m[k]||d[k]>0.3) continue; const i=(k/R.w)|0, j=k%R.w; if((i>0&&m[k-R.w])||(i<R.h-1&&m[k+R.w])||(j>0&&m[k-1])||(j<R.w-1&&m[k+1])) add.push(k); } for(const k of add) m[k]=1; }
  return m;
}
function buildWater(){
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(90000,90000,96,96).rotateX(-Math.PI/2),waterMat));
  const pp=[]; for(const p of W.PONDS){ const pts=p.poly.map(q=>new THREE.Vector2(q[0],q[1])); const tris=THREE.ShapeUtils.triangulateShape(pts,[]);
    for(const t of tris) for(const k of t) pp.push(pts[k].x,p.level,pts[k].y); }
  if(pp.length){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pp,3)); scene.add(new THREE.Mesh(g,waterMat)); }
}

/* ================= golf: tees, flags and cups (fairways, greens and bunkers come from the photo) ================= */
const FLAGS={geo:null,base:null,anchors:[]};
function numberAtlas(){ const c=document.createElement('canvas'); c.width=384; c.height=192; const g=c.getContext('2d'); g.fillStyle='#255d3c'; g.fillRect(0,0,384,192);
  g.fillStyle='#ffffff'; g.font='800 40px Figtree, system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  for(let n=1;n<=18;n++){ const i=(n-1)%6, j=Math.floor((n-1)/6); g.fillText(String(n),i*64+32,j*64+35); }
  const t=new THREE.CanvasTexture(c); t.encoding=THREE.sRGBEncoding; t.anisotropy=Math.min(4,MAXANI); return t; }
function buildGolf(){
  const teeMat=new THREE.MeshLambertMaterial({color:Cc('#74b552'),side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,transparent:true,opacity:0.45});
  const gTee=new GB(false), gWood=new GB(false), gNum=new GB(true), gCup=new GB(false);
  const marks=new THREE.InstancedMesh(new THREE.SphereGeometry(0.22,10,8),new THREE.MeshLambertMaterial({color:Cc('#2f6bd6')}),W.HOLES.length*2);
  const poles=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035,0.035,2.6,6),new THREE.MeshLambertMaterial({color:Cc('#ffffff')}),W.HOLES.length);
  const dm=new THREE.Object3D(); const fpos=[], fbase=[];
  for(const H of W.HOLES){
    const L=12, Wd=8, nx=6, nz=4, gp=[];
    for(let j=0;j<=nz;j++){ const row=[]; for(let i=0;i<=nx;i++){ const lx=-L/2+L*i/nx, ly=-Wd/2+Wd*j/nz; const wx=H.tx+lx*H.tc-ly*H.ts, wz=H.tz+lx*H.ts+ly*H.tc; row.push([wx,W.terrain(wx,wz)+0.05,wz]); } gp.push(row); }
    for(let j=0;j<nz;j++) for(let i=0;i<nx;i++) gTee.quad(gp[j][i],gp[j][i+1],gp[j+1][i+1],gp[j+1][i],[0,1,0]);
    for(const s of [-1,1]){ const wx=H.tx+3*H.tc-s*4*H.ts, wz=H.tz+3*H.ts+s*4*H.tc; dm.position.set(wx,W.terrain(wx,wz)+0.2,wz); dm.rotation.set(0,0,0); dm.scale.set(1,1,1); dm.updateMatrix(); marks.setMatrixAt(H.i*2+(s>0?1:0),dm.matrix); }
    // tee sign: post and a board with the hole number on both faces
    const sx=H.tx-7*H.tc+6*H.ts, sz=H.tz-7*H.ts-6*H.tc, sy=W.terrain(sx,sz); const a=H.ta;
    gWood.box(sx,sy,sz,0.12,1.35,0.12,0); gWood.box(sx,sy+1.32,sz,0.75,0.75,0.07,a);
    const n=H.n, ui=(n-1)%6, uj=Math.floor((n-1)/6); const u0=ui/6, u1=(ui+1)/6, v1=1-uj/3, v0=1-(uj+1)/3; const c=Math.cos(a), s2=Math.sin(a);
    for(const side of [-1,1]){ const ox=-s2*0.04*side, oz=c*0.04*side; const P=(lx,y)=>[sx+lx*c+ox,sy+y,sz+lx*s2+oz]; const nn=[-s2*side,0,c*side];
      const A=P(-0.36,1.33),B=P(0.36,1.33),C=P(0.36,2.05),D=P(-0.36,2.05); if(side>0) gNum.quad(A,B,C,D,nn,[u0,v0],[u1,v0],[u1,v1],[u0,v1]); else gNum.quad(B,A,D,C,nn,[u0,v0],[u1,v0],[u1,v1],[u0,v1]); }
    const [px,pz]=H.pin; const py=W.terrain(px,pz);
    for(let k=0;k<20;k++){ const a0=k/20*Math.PI*2, a1=(k+1)/20*Math.PI*2; gCup.tri([px,py+0.04,pz],[px+Math.cos(a0)*0.22,py+0.04,pz+Math.sin(a0)*0.22],[px+Math.cos(a1)*0.22,py+0.04,pz+Math.sin(a1)*0.22],[0,1,0]); }
    dm.position.set(px,py+1.3,pz); dm.updateMatrix(); poles.setMatrixAt(H.i,dm.matrix);
    // flag cloth: 8x2 quads, animated on the CPU
    for(let j=0;j<2;j++) for(let i=0;i<8;i++){ const q=[[i,j],[i+1,j],[i+1,j+1],[i,j],[i+1,j+1],[i,j+1]]; for(const [ii,jj] of q){ const lx=ii/8*0.95, ly=-0.31+jj/2*0.62; fbase.push(lx,H.i); fpos.push(px+lx,py+2.28+ly,pz); } }
    FLAGS.anchors.push([px,pz]);
  }
  gTee.mesh(teeMat,false).receiveShadow=true; gWood.mesh(new THREE.MeshLambertMaterial({color:Cc('#6b4b2e')})); gNum.mesh(new THREE.MeshLambertMaterial({map:numberAtlas()}));
  gCup.mesh(new THREE.MeshBasicMaterial({color:0x1a1a1a,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}),false);
  marks.castShadow=true; scene.add(marks); poles.castShadow=true; scene.add(poles);
  const fg=new THREE.BufferGeometry(); fg.setAttribute('position',new THREE.Float32BufferAttribute(fpos,3)); fg.computeVertexNormals();
  const fm=new THREE.Mesh(fg,new THREE.MeshLambertMaterial({color:Cc('#e3412b'),side:THREE.DoubleSide})); fm.castShadow=true; fm.frustumCulled=false; scene.add(fm);
  FLAGS.geo=fg; FLAGS.base=Float32Array.from(fbase); FLAGS.z0=Float32Array.from(fpos.filter((v,i)=>i%3===2));
  buildRange();
}
// driving range south of the clubhouse: covered tee line on the west side, targets every 50 m to the east
function buildRange(){
  const gP=new GB(false), gR=new GB(false); const sx=-788, sz=455, g0=W.terrain(sx,sz);
  gR.box(sx,g0+2.6,sz,4.2,0.18,24,0); for(const dz of [-11.5,-5.75,0,5.75,11.5]) for(const dx of [-1.8,1.8]) gP.box(sx+dx,g0-0.2,sz+dz,0.16,2.85,0.16,0);
  gP.box(sx-2.2,g0-0.2,sz,0.15,2.9,24,0);
  gP.mesh(new THREE.MeshLambertMaterial({color:Cc('#d4b884')})); gR.mesh(new THREE.MeshLambertMaterial({color:Cc('#5b4733')}));
  const cols=['#e3412b','#f2c230','#2f6bd6','#ffffff']; const gF=[new GB(false),new GB(false),new GB(false),new GB(false)], gPole=new GB(false);
  [50,100,150,200].forEach((d,k)=>{ const x=sx+d, z=sz+18+(k%2)*10, y=W.terrain(x,z); gPole.box(x,y,z,0.06,2.4,0.06,0); gF[k].box(x+0.45,y+1.75,z,0.9,0.6,0.03,0); });
  gPole.mesh(new THREE.MeshLambertMaterial({color:Cc('#f4f2ec')})); gF.forEach((g,k)=>g.mesh(new THREE.MeshLambertMaterial({color:Cc(cols[k]),side:THREE.DoubleSide})));
}
function animateFlags(T){ const p=FLAGS.geo.attributes.position.array, b=FLAGS.base, z0=FLAGS.z0; for(let i=0,n=b.length/2;i<n;i++){ const x=b[i*2], h=b[i*2+1]; p[i*3+2]=z0[i]+Math.sin(x*6-T*7+h)*0.09*x; } FLAGS.geo.attributes.position.needsUpdate=true; }

/* ================= geometry builder ================= */
class GB{
  constructor(uv){ this.p=[]; this.n=[]; this.u=uv?[]:null; }
  tri(a,b,c,n,ua,ub,uc){
    const abx=b[0]-a[0], aby=b[1]-a[1], abz=b[2]-a[2], acx=c[0]-a[0], acy=c[1]-a[1], acz=c[2]-a[2];
    const cx=aby*acz-abz*acy, cy=abz*acx-abx*acz, cz=abx*acy-aby*acx;
    if(cx*n[0]+cy*n[1]+cz*n[2]<0){ let t=b; b=c; c=t; t=ub; ub=uc; uc=t; }
    this.p.push(a[0],a[1],a[2],b[0],b[1],b[2],c[0],c[1],c[2]); for(let k=0;k<3;k++) this.n.push(n[0],n[1],n[2]);
    if(this.u) this.u.push(ua[0],ua[1],ub[0],ub[1],uc[0],uc[1]);
  }
  quad(a,b,c,d,n,ua,ub,uc,ud){ this.tri(a,b,c,n,ua,ub,uc); this.tri(a,c,d,n,ua,uc,ud); }
  box(cx,y0,cz,sx,sy,sz,a){ const c=Math.cos(a||0), s=Math.sin(a||0); const P=(lx,y,lz)=>[cx+lx*c-lz*s,y,cz+lx*s+lz*c]; const hx=sx/2, hz=sz/2, y1=y0+sy; const Z=[0,0];
    const v=[P(-hx,y0,-hz),P(hx,y0,-hz),P(hx,y0,hz),P(-hx,y0,hz),P(-hx,y1,-hz),P(hx,y1,-hz),P(hx,y1,hz),P(-hx,y1,hz)];
    const ex=[c,0,s], ez=[-s,0,c];
    this.quad(v[4],v[5],v[6],v[7],[0,1,0],Z,Z,Z,Z); this.quad(v[0],v[1],v[2],v[3],[0,-1,0],Z,Z,Z,Z);
    this.quad(v[1],v[2],v[6],v[5],ex,Z,Z,Z,Z); this.quad(v[0],v[3],v[7],v[4],[-ex[0],0,-ex[2]],Z,Z,Z,Z);
    this.quad(v[2],v[3],v[7],v[6],ez,Z,Z,Z,Z); this.quad(v[0],v[1],v[5],v[4],[-ez[0],0,-ez[2]],Z,Z,Z,Z); }
  mesh(mat,shadow){ if(!this.p.length) return null; const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3)); if(this.u) g.setAttribute('uv',new THREE.Float32BufferAttribute(this.u,2));
    const m=new THREE.Mesh(g,mat); m.castShadow=shadow!==false; m.receiveShadow=true; scene.add(m); return m; }
}

/* ================= buildings from the Catastro, styled after the villas' photos ================= */
function ringSA(r){ let a=0; for(let i=0,j=r.length-1;i<r.length;j=i++) a+=r[j][0]*r[i][1]-r[i][0]*r[j][1]; return a/2; }
function orient(r,cw){ const a=ringSA(r); return (cw?a<0:a>0)?r.slice().reverse():r.slice(); }
function insetRing(r,d){ const n=r.length, out=[]; for(let i=0;i<n;i++){ const p=r[(i-1+n)%n], c=r[i], q=r[(i+1)%n];
  let e1x=c[0]-p[0], e1z=c[1]-p[1]; const l1=Math.hypot(e1x,e1z)||1; e1x/=l1; e1z/=l1;
  let e2x=q[0]-c[0], e2z=q[1]-c[1]; const l2=Math.hypot(e2x,e2z)||1; e2x/=l2; e2z/=l2;
  const n1x=e1z, n1z=-e1x, n2x=e2z, n2z=-e2x; let mx=n1x+n2x, mz=n1z+n2z; const dd=1+n1x*n2x+n1z*n2z;
  if(dd<0.15){ mx=n1x; mz=n1z; } else { mx/=dd; mz/=dd; } const ml=Math.hypot(mx,mz); if(ml>3){ mx*=3/ml; mz*=3/ml; }
  out.push([c[0]-mx*d,c[1]-mz*d]); } return out; }
function villaAtlas(){ return canvasTex(1024,512,(g,w,h)=>{
  g.fillStyle='#d6ba86'; g.fillRect(0,0,w,h); speckle(g,w,h,14000,31,['rgba(255,246,222,0.12)','rgba(125,92,52,0.09)','rgba(190,150,96,0.10)']);
  const PX=256/3, PY=512/6, yv=y=>h-y*PY;
  g.fillStyle='#a08a64'; g.fillRect(0,h-7,w,7);
  const glass=(x0,x1,yb,yt)=>{ g.fillStyle='rgba(95,68,36,0.33)'; g.fillRect(x0-9,yt-9,x1-x0+18,yb-yt+9); g.fillStyle='#2a2e30'; g.fillRect(x0,yt,x1-x0,yb-yt);
    const gr=g.createLinearGradient(0,yt,0,yb); gr.addColorStop(0,'#86a0ad'); gr.addColorStop(0.5,'#43596a'); gr.addColorStop(1,'#25323a'); g.fillStyle=gr; g.fillRect(x0+6,yt+6,x1-x0-12,yb-yt-12); };
  g.save(); g.translate(256,0); glass(0.35*PX,2.65*PX,yv(0),yv(2.55)); g.fillStyle='#2a2e30'; g.fillRect(1.5*PX-3,yv(2.55),6,2.55*PY); g.restore();
  g.save(); g.translate(512,0); glass(0.8*PX,2.2*PX,yv(0.95),yv(2.25)); g.fillStyle='#b9a173'; g.fillRect(0.75*PX,yv(0.95),1.5*PX,7); g.restore();
  g.save(); g.translate(768,0); for(let i=0;i<5;i++){ const cx=(0.62+i*0.44)*PX; g.fillStyle='rgba(95,68,36,0.35)'; g.fillRect(cx-10,yv(2.12)-2,20,20); g.fillStyle='#2b2723'; g.fillRect(cx-8,yv(2.1),16,16); } g.restore();
}); }
function hotelFacade(){ return canvasTex(512,512,(g,w,h)=>{
  g.fillStyle='#d9c08f'; g.fillRect(0,0,w,h); speckle(g,w,h,6000,41,['rgba(255,246,222,0.12)','rgba(125,92,52,0.08)']);
  const PX=512/3.2, PY=512/3.4, yv=y=>h-y*PY;
  g.fillStyle='#c4a875'; g.fillRect(0,yv(0.32),w,0.32*PY);
  const x0=0.3*PX, x1=2.9*PX, yb=yv(0.9), yt=yv(2.75);
  g.fillStyle='rgba(95,68,36,0.3)'; g.fillRect(x0-8,yt-8,x1-x0+16,yb-yt+8); g.fillStyle='#2b3033'; g.fillRect(x0,yt,x1-x0,yb-yt);
  const gr=g.createLinearGradient(0,yt,0,yb); gr.addColorStop(0,'#8aa4b1'); gr.addColorStop(1,'#2c3b45'); g.fillStyle=gr; g.fillRect(x0+5,yt+5,x1-x0-10,yb-yt-10);
  g.fillStyle='#2b3033'; g.fillRect((x0+x1)/2-3,yt,6,yb-yt); g.fillStyle='rgba(240,236,228,0.85)'; g.fillRect(x0,yv(1.0),x1-x0,4);
},true); }
function gravelTex(base,seed){ return canvasTex(256,256,(g,w,h)=>{ g.fillStyle=base; g.fillRect(0,0,w,h); speckle(g,w,h,9000,seed,['rgba(255,235,210,0.18)','rgba(60,30,20,0.22)','rgba(150,90,60,0.2)']); },true); }
const BLD=[];
function buildBuildings(){
  const M=(o)=>new THREE.MeshLambertMaterial(o);
  const gWall=new GB(true), gHotel=new GB(true), gRoof=new GB(true), gRoof2=new GB(true), gPlain=new GB(false), gCorten=new GB(false), gGlass=new GB(false), gDark=new GB(false);
  for(const b of W.BUILDINGS){
    b.solid=false; b.walkY=undefined;
    if(b.f<1||b.ext.length<3) continue;
    const ext=orient(b.ext,true), holes=(b.holes||[]).filter(h=>h.length>=3).map(h=>orient(h,false));
    let gmin=1e9,gmax=-1e9; for(const p of ext){ const g=W.terrain(p[0],p[1]); gmin=Math.min(gmin,g); gmax=Math.max(gmax,g); }
    const cg=W.terrain(b.c[0],b.c[1]); gmin=Math.min(gmin,cg); gmax=Math.max(gmax,cg);
    const R=rng(1000+b.k*7);
    let kind='villa'; if(b.f>=2) kind='hotel'; else if(b.area<8) kind='shed'; else if(b.area<40) kind=R()<0.62?'porch':'pergola';
    const floorY=gmin+0.15+Math.max(0,(gmax-gmin)*0.35);
    let H=kind==='hotel'?b.f*3.4+0.9:kind==='villa'?3.45+R()*0.9+Math.min(1.6,b.area/500):kind==='porch'?3.3:kind==='pergola'?2.7:2.6;
    const top=floorY+H, y0=gmin-1.2;
    b.kind=kind; b.ring=ext; b.holesO=holes; b.floorY=floorY; b.top=top; b.base=y0;
    if(kind==='porch'||kind==='pergola'){
      const th=kind==='porch'?0.55:0.1, gb=kind==='porch'?gPlain:gDark;
      const tris=THREE.ShapeUtils.triangulateShape(ext.map(p=>new THREE.Vector2(p[0],p[1])),[]);
      for(const t of tris){ const P=t.map(k=>ext[k]); (kind==='porch'?gRoof:gDark).tri([P[0][0],top,P[0][1]],[P[1][0],top,P[1][1]],[P[2][0],top,P[2][1]],[0,1,0],[P[0][0]/3,P[0][1]/3],[P[1][0]/3,P[1][1]/3],[P[2][0]/3,P[2][1]/3]);
        gb.tri([P[0][0],top-th,P[0][1]],[P[1][0],top-th,P[1][1]],[P[2][0],top-th,P[2][1]],[0,-1,0]); }
      for(let i=0;i<ext.length;i++){ const a=ext[i], c=ext[(i+1)%ext.length]; const dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz); if(L<0.05) continue; const n=[dz/L,0,-dx/L];
        gb.quad([a[0],top-th,a[1]],[c[0],top-th,c[1]],[c[0],top,c[1]],[a[0],top,a[1]],n); }
      const inset=insetRing(ext,kind==='porch'?0.25:0.12), ps=kind==='porch'?0.42:0.12;
      for(const p of inset){ gb.box(p[0],gmin-0.3,p[1],ps,top-th-gmin+0.3,ps,0); }
      b.walkY=top; continue;
    }
    // walls
    const wallsFor=(ring)=>{ for(let i=0;i<ring.length;i++){ const a=ring[i], c=ring[(i+1)%ring.length]; const dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz); if(L<0.05) continue; const n=[dz/L,0,-dx/L];
      if(kind==='hotel'){ const v0=(y0-floorY)/3.4, v1=(top-floorY)/3.4; gHotel.quad([a[0],y0,a[1]],[c[0],y0,c[1]],[c[0],top,c[1]],[a[0],top,a[1]],n,[0,v0],[L/3.2,v0],[L/3.2,v1],[0,v1]); continue; }
      const np=Math.max(1,Math.round(L/3)); for(let k=0;k<np;k++){ const t0=k/np, t1=(k+1)/np; const p0=[a[0]+dx*t0,a[1]+dz*t0], p1=[a[0]+dx*t1,a[1]+dz*t1];
        let ty=0; if(kind==='villa'&&L/np>1.8){ const r=R(); ty=r<0.42?0:r<0.66?1:r<0.86?2:3; }
        const u0=(ty+0.04)/4, u1=(ty+0.96)/4, v0=(y0-floorY)/6, v1=(top-floorY)/6;
        gWall.quad([p0[0],y0,p0[1]],[p1[0],y0,p1[1]],[p1[0],top,p1[1]],[p0[0],top,p0[1]],n,[u0,v0],[u1,v0],[u1,v1],[u0,v1]); } } };
    wallsFor(ext); holes.forEach(wallsFor);
    // parapet, inner parapet faces and the gravel roof
    const pd=kind==='hotel'?0.35:0.28, drop=kind==='hotel'?0.9:0.38, roofY=top-drop;
    const extI=insetRing(ext,pd), holesI=holes.map(h=>insetRing(h,pd));
    const cap=(o,i)=>{ for(let k=0;k<o.length;k++){ const k2=(k+1)%o.length; gPlain.quad([o[k][0],top,o[k][1]],[o[k2][0],top,o[k2][1]],[i[k2][0],top,i[k2][1]],[i[k][0],top,i[k][1]],[0,1,0]); } };
    const inner=(r)=>{ for(let k=0;k<r.length;k++){ const a=r[k], c=r[(k+1)%r.length]; const dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz); if(L<0.05) continue; gPlain.quad([a[0],roofY,a[1]],[c[0],roofY,c[1]],[c[0],top,c[1]],[a[0],top,a[1]],[-dz/L,0,dx/L]); } };
    cap(ext,extI); holes.forEach((h,i)=>cap(h,holesI[i])); inner(extI); holesI.forEach(inner);
    const pts=extI.concat(...holesI); const tris=THREE.ShapeUtils.triangulateShape(extI.map(p=>new THREE.Vector2(p[0],p[1])),holesI.map(h=>h.map(p=>new THREE.Vector2(p[0],p[1]))));
    const gr=kind==='hotel'?gRoof2:gRoof;
    for(const t of tris){ const P=t.map(k=>pts[k]); if(!P[0]||!P[1]||!P[2]) continue; gr.tri([P[0][0],roofY,P[0][1]],[P[1][0],roofY,P[1][1]],[P[2][0],roofY,P[2][1]],[0,1,0],[P[0][0]/3,P[0][1]/3],[P[1][0]/3,P[1][1]/3],[P[2][0]/3,P[2][1]/3]); }
    // roof details: corten chimneys, skylight boxes, hotel plant
    const I2=insetRing(ext,1.0);
    if(kind==='villa'&&R()<0.45){ const p=I2[(R()*I2.length)|0]; if(W.pointInPoly(p[0],p[1],ext)) gCorten.box(p[0],roofY,p[1],0.32,drop+1.5+R()*1.2,0.32,0); }
    if(kind==='villa'&&b.area>80&&R()<0.25){ const p=I2[(R()*I2.length)|0], q=b.c; const sx=(p[0]+q[0])/2, sz=(p[1]+q[1])/2; if(W.pointInPoly(sx,sz,extI)){ gPlain.box(sx,roofY,sz,1.5,drop+0.45,1.3,0.3); gGlass.box(sx,top+0.07,sz,1.3,0.06,1.1,0.3); } }
    if(kind==='hotel'){ for(let k=0;k<4;k++){ const p=I2[(R()*I2.length)|0], q=b.c; const t=0.3+R()*0.5; const sx=p[0]+(q[0]-p[0])*t, sz=p[1]+(q[1]-p[1])*t; if(W.pointInPoly(sx,sz,extI)) gPlain.box(sx,roofY,sz,2.2+R()*2,1.4,1.6+R(),R()*3); } }
    b.solid=true; b.walkY=roofY; BLD.push(b);
  }
  const atlas=villaAtlas();
  gWall.mesh(M({map:atlas})); gHotel.mesh(M({map:hotelFacade()}));
  gRoof.mesh(M({map:gravelTex('#8a5a44',51)}),false); gRoof2.mesh(M({map:gravelTex('#9a958c',52)}),false);
  gPlain.mesh(M({color:Cc('#d4b884')})); gCorten.mesh(M({color:Cc('#7a3f22')})); gGlass.mesh(M({color:Cc('#22303a'),emissive:Cc('#0c151b')}),false); gDark.mesh(M({color:Cc('#5b4733')}));
}

/* ================= unfinished concrete structures at the west tip (seen in the photo, not in the Catastro) ================= */
const PLAT=[]; const platGrid=new Map(); const PCELL=16;
function addPlat(cx,cz,a,sx,sz,top,thick){ const p={x:cx,z:cz,c:Math.cos(a),s:Math.sin(a),sx,sz,top,bot:top-(thick||0.3)}; PLAT.push(p); const r=Math.hypot(sx,sz)/2+1;
  for(let i=Math.floor((cx-r)/PCELL);i<=Math.floor((cx+r)/PCELL);i++) for(let j=Math.floor((cz-r)/PCELL);j<=Math.floor((cz+r)/PCELL);j++){ const k=i+','+j; if(!platGrid.has(k)) platGrid.set(k,[]); platGrid.get(k).push(p); } return p; }
function platsNear(x,z){ return platGrid.get(Math.floor(x/PCELL)+','+Math.floor(z/PCELL))||[]; }
function insidePlat(p,x,z,m){ const dx=x-p.x, dz=z-p.z; const lx=dx*p.c+dz*p.s, lz=-dx*p.s+dz*p.c; return Math.abs(lx)<p.sx/2+m && Math.abs(lz)<p.sz/2+m; }
const RUINS=[[-1237.5,437.5,-0.36],[-1222.5,427.5,-0.36],[-1207.5,420,-0.36],[-1192.5,412.5,-0.36],[-1177.5,407.5,-0.36],[-1165,415,-0.36],[-1225,446,-0.36],[-1210,438,-0.36],[-1195,430,-0.36],[-1180,422.5,-0.36],
  [-1289,383,1.57],[-1289,402,1.57],[-1289,421,1.57],[-1288,440,1.4],[-1277.5,452.5,0.6],[-1262.5,460,0.35],[-1247.5,465,0.2],[-1150,395,-0.47],[-1137.5,387.5,-0.47],[-1125,380,-0.47]];
let ruinTop=null;
function buildRuins(){
  const gC=new GB(false), gB=new GB(false); const R=rng(77);
  for(const [x,z,a] of RUINS){ const g0=Math.min(W.terrain(x,z),W.terrain(x+4,z),W.terrain(x-4,z),W.terrain(x,z+4),W.terrain(x,z-4)); const fl=R()<0.55?2:1; const sx=12, sz=10;
    gC.box(x,g0-0.6,z,sx,0.85,sz,a); addPlat(x,z,a,sx,sz,g0+0.25,0.85);
    for(let k=1;k<=fl;k++){ const y=g0+0.25+k*3.1; gC.box(x,y-0.3,z,sx,0.3,sz,a); addPlat(x,z,a,sx,sz,y,0.3); if(!ruinTop||y>ruinTop.y) ruinTop={x,z,y}; }
    const c=Math.cos(a), s=Math.sin(a);
    for(const lx of [-5.6,0,5.6]) for(const lz of [-4.6,4.6]){ gC.box(x+lx*c-lz*s,g0+0.25,z+lx*s+lz*c,0.35,fl*3.1-0.3,0.35,a); }
    if(R()<0.6){ const lz=R()<0.5?-4.7:4.7; gB.box(x-lz*s,g0+0.25,z+lz*c,sx*0.8,2.4,0.25,a); } }
  gC.mesh(new THREE.MeshLambertMaterial({color:Cc('#a8a6a0')})); gB.mesh(new THREE.MeshLambertMaterial({color:Cc('#b0775c')}));
}

/* ================= pier and marina ================= */
const PIER={A:[420,-222],B:[690,-131]};
function buildMarina(){
  const gW=new GB(false), gD=new GB(false), gHull=new GB(false), gBlue=new GB(false);
  const a=Math.atan2(PIER.B[1]-PIER.A[1],PIER.B[0]-PIER.A[0]), ux=Math.cos(a), uz=Math.sin(a), px=-uz, pz=ux;
  // find where the walkway leaves the shore
  let s0=0; const L=Math.hypot(PIER.B[0]-PIER.A[0],PIER.B[1]-PIER.A[1]); for(let s=0;s<L;s+=2){ if(W.terrain(PIER.A[0]+ux*s,PIER.A[1]+uz*s)<0.8){ s0=Math.max(0,s-6); break; } }
  const deckY=1.3, sx=PIER.A[0]+ux*s0, sz=PIER.A[1]+uz*s0, len=L-s0, cx=sx+ux*len/2, cz=sz+uz*len/2;
  gW.box(cx,deckY-0.25,cz,len,0.25,2.6,a); addPlat(cx,cz,a,len,2.6,deckY,0.4);
  for(let s=4;s<len;s+=8){ const x=sx+ux*s, z=sz+uz*s; for(const k of [-1.1,1.1]) gD.box(x+px*k,-3,z+pz*k,0.25,deckY-0.25+3,0.25,a); }
  for(let s=0;s<len;s+=3){ const x=sx+ux*s, z=sz+uz*s; for(const k of [-1.25,1.25]) gD.box(x+px*k,deckY,z+pz*k,0.08,1.0,0.08,a); }
  for(const k of [-1.25,1.25]) gD.box(cx+px*k,deckY+0.95,cz+pz*k,len,0.07,0.09,a);
  // platform at the end, then floating pontoons
  const Pc=[PIER.B[0]+ux*8,PIER.B[1]+uz*8]; gW.box(Pc[0],deckY-0.25,Pc[1],16,0.25,17,a); addPlat(Pc[0],Pc[1],a,16,17,deckY,0.4); PIER.plat=Pc; PIER.deckY=deckY;
  const fy=0.45; const pont=(x0,z0,x1,z1,w,fingers)=>{ const dx=x1-x0, dz=z1-z0, l=Math.hypot(dx,dz), aa=Math.atan2(dz,dx); const mx=(x0+x1)/2, mz=(z0+z1)/2;
    gW.box(mx,fy-0.3,mz,l,0.3,w,aa); addPlat(mx,mz,aa,l,w,fy,0.3);
    if(fingers){ const ex=Math.cos(aa), ez=Math.sin(aa), qx=-ez, qz=ex; const R=rng(Math.round(x0*7+z0));
      for(let s=5;s<l-3;s+=7){ for(const side of [-1,1]){ const fx=x0+ex*s+qx*side*(w/2+3.5), fz=z0+ez*s+qz*side*(w/2+3.5); gW.box(fx,fy-0.25,fz,0.9,0.25,7,aa); addPlat(fx,fz,aa,0.9,7,fy,0.25);
        if(R()<0.7){ const bx=x0+ex*(s+3.4)+qx*side*(w/2+3.6), bz=z0+ez*(s+3.4)+qz*side*(w/2+3.6); const bl=4.8+R()*2.2, bw=1.9+R()*0.5;
          gHull.box(bx,-0.25,bz,bw,1.05,bl,aa); if(R()<0.55){ gHull.box(bx,0.8,bz-0,bw*0.75,0.7,bl*0.35,aa); } else { gD.box(bx,0.8,bz,0.09,8+R()*3,0.09,aa); gBlue.box(bx,0.8,bz,bw*0.55,0.12,bl*0.4,aa); } } } } } };
  const e=[PIER.B[0]+ux*16,PIER.B[1]+uz*16]; pont(e[0],e[1],e[0]+ux*50,e[1]+uz*50,2.4,false);
  pont(726,-147,711,-99,2.2,true); pont(758,-147,735,-76,2.2,true);
  gW.mesh(new THREE.MeshLambertMaterial({color:Cc('#b49a74')})); gD.mesh(new THREE.MeshLambertMaterial({color:Cc('#6e5a43')}));
  gHull.mesh(new THREE.MeshLambertMaterial({color:Cc('#f4f3ef')})); gBlue.mesh(new THREE.MeshLambertMaterial({color:Cc('#2a5f86')}));
}

/* ================= trees detected in the photo ================= */
const treeGrid=new Map(); const treeChunks=[];
function addTreeGrid(x,z,cy,r,ry,tr){ const k=Math.floor(x/20)+','+Math.floor(z/20); let a=treeGrid.get(k); if(!a){ a=[]; treeGrid.set(k,a); } a.push({x,z,cy,r,ry,tr}); }
function lumpy(geo,amp,seed){ const p=geo.attributes.position; const R=rng(seed); const cache=new Map();
  for(let i=0;i<p.count;i++){ const key=p.getX(i).toFixed(3)+','+p.getY(i).toFixed(3)+','+p.getZ(i).toFixed(3); let s=cache.get(key); if(s===undefined){ s=1+(R()*2-1)*amp; cache.set(key,s); } p.setXYZ(i,p.getX(i)*s,p.getY(i)*s,p.getZ(i)*s); }
  geo.computeVertexNormals(); const nr=geo.attributes.normal; const v=new V3();
  for(let i=0;i<p.count;i++){ v.set(p.getX(i),p.getY(i)*1.15,p.getZ(i)).normalize(); nr.setXYZ(i,v.x,v.y,v.z); }
  nr.needsUpdate=true; return geo; }
function shade(geo,lo){ const p=geo.attributes.position; const c=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){ const t=clamp((p.getY(i)+1)/2,0,1); const k=hsh(Math.round(p.getX(i)*97),Math.round(p.getY(i)*89+p.getZ(i)*61)); const v=(lo+(1-lo)*Math.sqrt(t))*(0.86+0.24*k); c[i*3]=v*(0.97+0.06*k); c[i*3+1]=v; c[i*3+2]=v*(1.02-0.05*k); }
  geo.setAttribute('color',new THREE.BufferAttribute(c,3)); return geo; }
function bldDist(x,z,maxd){ let best=maxd; const c=W.BCELL; const i0=Math.floor((x-maxd)/c), i1=Math.floor((x+maxd)/c), j0=Math.floor((z-maxd)/c), j1=Math.floor((z+maxd)/c); const seen=new Set();
  for(let i=i0;i<=i1;i++) for(let j=j0;j<=j1;j++){ const arr=W.bgrid.get(i+','+j); if(!arr) continue; for(const b of arr){ if(seen.has(b)||b.f<1) continue; seen.add(b);
    if(x<b.x0-best||x>b.x1+best||z<b.z0-best||z>b.z1+best) continue; if(W.pointInPoly(x,z,b.ext)) return 0;
    for(let k=0,l=b.ext.length-1;k<b.ext.length;l=k++){ const ax=b.ext[l][0], az=b.ext[l][1], vx=b.ext[k][0]-ax, vz=b.ext[k][1]-az; const l2=vx*vx+vz*vz||1e-9; const t=clamp(((x-ax)*vx+(z-az)*vz)/l2,0,1); const d=Math.hypot(ax+vx*t-x,az+vz*t-z); if(d<best) best=d; } } }
  return best; }
let LOD_D=HIGH?650:420;
function buildTrees(){
  const TYPES={
    oak:{hi:shade(lumpy(new THREE.IcosahedronGeometry(1,1),0.13,3),0.5),lo:shade(lumpy(new THREE.IcosahedronGeometry(1,0),0.05,4),0.55),cols:['#4a5931','#56653a','#43522c','#5b6a3c','#4e5d34']},
    pine:{hi:shade(lumpy(new THREE.SphereGeometry(1,12,6),0.1,5),0.48),lo:shade(lumpy(new THREE.IcosahedronGeometry(1,0),0.05,6),0.5),cols:['#3e5a2d','#486636','#36512a']},
    cypress:{hi:shade(new THREE.ConeGeometry(1,2,8,1),0.55),lo:shade(new THREE.ConeGeometry(1,2,5,1),0.55),cols:['#2f4a2a','#37512f','#2c4528']},
    poplar:{hi:shade(lumpy(new THREE.SphereGeometry(1,9,7),0.08,9),0.6),lo:shade(new THREE.SphereGeometry(1,6,4),0.6),cols:['#b5a148','#c4b05a','#a39a3f','#8d9e49','#b9a04a']}
  };
  const trunkHi=new THREE.CylinderGeometry(0.7,1,1,6,1,true).translate(0,0.5,0);
  const sphere=new THREE.Sphere(new V3(0,30,0),375);
  for(const k in TYPES){ TYPES[k].hi.boundingSphere=sphere; TYPES[k].lo.boundingSphere=sphere; } trunkHi.boundingSphere=sphere;
  const canMat=new THREE.MeshLambertMaterial({vertexColors:true}), trunkMat=new THREE.MeshLambertMaterial({color:Cc('#5a4532')});
  const CH=512, chunks=new Map();
  for(const t of W.TREES){
    const x=t.x, z=t.z; const g=W.terrain(x,z); if(g<0.3) continue; const code=W.surfAt(x,z); if(code===0||code>=20||(code>=3&&code<=7)||code===9) continue;
    if(W.waterLevel(x,z)>g) continue; if(x>400&&x<790&&z>-245&&z<-60) continue;
    const bd=bldDist(x,z,16); if(bd<0.8) continue;
    let near=false; if(g<4){ for(const [ox,oz] of [[22,0],[-22,0],[0,22],[0,-22]]) if(W.terrain(x+ox,z+oz)<0){ near=true; break; } }
    const r=hsh(Math.round(x*4),Math.round(z*4)), r2=hsh(Math.round(z*4)+7,Math.round(x*4)-3);
    let type='oak'; if(bd<16) type=r<0.42?'pine':r<0.62?'cypress':r<0.76?'poplar':'oak'; else if(near) type=r<0.45?'pine':'oak'; else { const patch=W.vnoise(x/180+3,z/180-7); type=((patch>0.35&&r<0.7)||r<0.07)?'pine':'oak'; }
    let R,Ry,th,tr;
    if(type==='oak'){ R=t.r*(0.95+r2*0.2); Ry=R*0.62; th=1.3+0.35*R; tr=0.12+0.045*R; }
    else if(type==='pine'){ R=t.r*(1.0+r2*0.25); Ry=Math.max(1.1,R*0.36); th=4.5+R*0.9; tr=0.16+0.035*R; }
    else if(type==='cypress'){ R=0.95+r2*0.4; Ry=4.2+r2*1.8; th=0.5; tr=0.15; }
    else { R=1.5+r2*0.6; Ry=5.8+r2*2.2; th=2.2; tr=0.2; }
    const cy=g+th+Ry*(type==='pine'?0.55:type==='oak'?0.78:0.92);
    const ck=Math.floor((x+1300)/CH)+','+Math.floor((z+1050)/CH); let C=chunks.get(ck); if(!C){ C={cx:-1300+(Math.floor((x+1300)/CH)+0.5)*CH,cz:-1050+(Math.floor((z+1050)/CH)+0.5)*CH,types:{}}; chunks.set(ck,C); }
    (C.types[type]||(C.types[type]=[])).push({x,z,g,R,Ry,th,tr,cy,ci:(r2*TYPES[type].cols.length)|0,k:0.88+r*0.24});
    addTreeGrid(x,z,cy,R,Ry,tr+0.15);
  }
  const dm=new THREE.Object3D(), col=new THREE.Color();
  for(const C of chunks.values()){ for(const type in C.types){ const arr=C.types[type], T=TYPES[type];
    const can=new THREE.InstancedMesh(T.hi,canMat,arr.length), trk=new THREE.InstancedMesh(trunkHi,trunkMat,arr.length);
    can.position.set(C.cx,0,C.cz); trk.position.set(C.cx,0,C.cz);
    arr.forEach((t,i)=>{ dm.position.set(t.x-C.cx,t.cy,t.z-C.cz); dm.scale.set(t.R,t.Ry,t.R); dm.rotation.set(0,(t.x*13.1+t.z*7.7)%6.28,0); dm.updateMatrix(); can.setMatrixAt(i,dm.matrix);
      col.copy(Cc(T.cols[t.ci])).multiplyScalar(t.k); can.setColorAt(i,col);
      dm.position.set(t.x-C.cx,t.g-0.2,t.z-C.cz); dm.scale.set(t.tr,t.cy-t.g,t.tr); dm.rotation.set(0,0,0); dm.updateMatrix(); trk.setMatrixAt(i,dm.matrix); });
    can.instanceColor.needsUpdate=true; can.receiveShadow=HIGH; trk.receiveShadow=false; scene.add(can); scene.add(trk);
    treeChunks.push({can,trk,hi:T.hi,lo:T.lo,cx:C.cx,cz:C.cz}); } }
}
function updateTreeLOD(){ const cp=camera.position; for(const c of treeChunks){ const d=Math.hypot(cp.x-c.cx,cp.z-c.cz,cp.y*0.5); const near=d<LOD_D; if(c.can.geometry!==(near?c.hi:c.lo)) c.can.geometry=near?c.hi:c.lo; c.trk.visible=d<LOD_D*1.25; } }

/* ================= ambient life ================= */
const boats=[], birds=[]; const BIRDGEO={g:null};
function animateBirds(T,dt){ if(!BIRDGEO.g) return; const a=BIRDGEO.g.attributes.position.array; let o=0; const put=(x,y,z)=>{ a[o++]=x; a[o++]=y; a[o++]=z; };
  for(const fl of birds){ fl.a+=fl.sp*dt; const hx=Math.cos(fl.a), hz=Math.sin(fl.a); const cx=fl.c[0]+hx*fl.r, cz=fl.c[2]+hz*fl.r; const fx=-hz*(fl.sp>0?1:-1), fz=hx*(fl.sp>0?1:-1); const rx=-fz, rz=fx;
    for(const b of fl.birds){ const lx=b.off[0], lz=b.off[2]; const x=cx+lx*fx-lz*fz, y=fl.c[1]+Math.sin(T*0.7+b.ph)*1.2, z=cz+lx*fz+lz*fx; const s=2.2, fa=Math.sin(T*5+b.ph)*0.9;
      const tipY=Math.sin(fa)*s*1.1, tipR=Math.cos(fa)*s*1.1;
      for(const side of [-1,1]){ put(x+fx*0.5*s,y,z+fz*0.5*s); put(x-fx*0.45*s,y,z-fz*0.45*s); put(x+rx*side*tipR-fx*0.2*s,y+tipY,z+rz*side*tipR-fz*0.2*s); }
      put(x+fx*0.8*s,y,z+fz*0.8*s); put(x-fx*0.7*s,y+0.05,z-fz*0.7*s); put(x,y-0.18*s,z);
      put(x-fx*0.7*s,y,z-fz*0.7*s); put(x-fx*1.0*s+rx*0.25*s,y,z-fz*1.0*s+rz*0.25*s); put(x-fx*1.0*s-rx*0.25*s,y,z-fz*1.0*s-rz*0.25*s); } }
  BIRDGEO.g.attributes.position.needsUpdate=true; }
function buildLife(){
  const sailGeo=new THREE.BufferGeometry(); sailGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,1.2,0, 0,10,0, 4.2,1.2,0],3)); sailGeo.computeVertexNormals();
  const hullM=new THREE.MeshLambertMaterial({color:Cc('#ffffff')}), sailM=new THREE.MeshLambertMaterial({color:Cc('#fbfaf6'),side:THREE.DoubleSide});
  const cand=[[1150,-300,300],[-1700,-400,260],[300,500,260],[-300,1250,320],[1200,600,280],[-2000,600,220],[900,-800,180]];
  let i=0;
  for(const rt of cand){ let ok=true; for(let k=0;k<24;k++){ const a=k/24*Math.PI*2; if(W.terrain(rt[0]+Math.cos(a)*rt[2],rt[1]+Math.sin(a)*rt[2])>-1.5){ ok=false; break; } } if(!ok) continue;
    const g=new THREE.Group(); const hb=new THREE.Mesh(new THREE.BoxGeometry(6.5,1.1,2.1),hullM); hb.position.y=0.4; g.add(hb);
    const s=new THREE.Mesh(sailGeo,sailM); s.position.set(-1.6,0.2,0); g.add(s); scene.add(g); boats.push({g,cx:rt[0],cz:rt[1],r:rt[2],a:i*1.7,sp:(0.012+i*0.002)*(i%2?1:-1)}); i++; }
  for(let f=0;f<3;f++){ const flock={c:[-300+(f-1)*700,95+f*35,-60+(f%2?-300:250)],r:500+f*220,a:f*2,sp:0.035+f*0.01,birds:[]};
    for(let b=0;b<7;b++){ const side=b%2?1:-1, k=Math.ceil(b/2); flock.birds.push({off:[-k*3.2,0,side*k*3.0],ph:b*0.7}); } birds.push(flock); }
  const nb=birds.reduce((a,f)=>a+f.birds.length,0); const bg=new THREE.BufferGeometry(); bg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(nb*12*3),3));
  const bmesh=new THREE.Mesh(bg,new THREE.MeshBasicMaterial({color:Cc('#5d6264'),side:THREE.DoubleSide})); bmesh.frustumCulled=false; scene.add(bmesh); BIRDGEO.g=bg;
  const cc=document.createElement('canvas'); cc.width=cc.height=128; const cx2=cc.getContext('2d'); const R=rng(9);
  for(let k=0;k<14;k++){ const x=30+R()*68, y=48+R()*30, r=18+R()*22; const gr=cx2.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(255,255,255,.9)'); gr.addColorStop(1,'rgba(255,255,255,0)'); cx2.fillStyle=gr; cx2.beginPath(); cx2.arc(x,y,r,0,Math.PI*2); cx2.fill(); }
  const ctex=new THREE.CanvasTexture(cc);
  for(let k=0;k<16;k++){ const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:ctex,fog:false,transparent:true,opacity:0.75,depthWrite:false}));
    const a=R()*Math.PI*2, r=5000+R()*11000; sp.position.set(Math.cos(a)*r,1600+R()*1400,Math.sin(a)*r); const s=2600+R()*2600; sp.scale.set(s,s*0.45,1); scene.add(sp); }
}
