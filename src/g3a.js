(function(){
"use strict";
const V3=THREE.Vector3;
const $=id=>document.getElementById(id);
const fmt=(n,d=0)=>n.toLocaleString('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const store={get(k){try{return localStorage.getItem(k);}catch(e){return null;}},set(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
const isCoarse=matchMedia('(pointer:coarse)').matches;
const QUAL=store.get('vg_q')||'auto';
const AUTO_HIGH=!isCoarse&&(navigator.deviceMemory||8)>=8&&(navigator.hardwareConcurrency||8)>=8;
const HIGH=QUAL==='high'||(QUAL==='auto'&&AUTO_HIGH);
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
// FXQ: 2 = full HDR pipeline (MSAA, ambient occlusion, bloom), 1 = HDR + bloom, 0 = direct rendering with ACES tone mapping
const FXQ=(()=>{ if(/[?&]nofx=1/.test(location.search)) return 0; try{ const gl=document.createElement('canvas').getContext('webgl2'); if(!gl||!gl.getExtension('EXT_color_buffer_float')) return 0; const lc=gl.getExtension('WEBGL_lose_context'); if(lc) lc.loseContext(); return HIGH?2:1; }catch(e){ return 0; } })();
const renderer=new THREE.WebGLRenderer({canvas,antialias:!FXQ,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, FXQ?(HIGH?1.75:1.25):(HIGH?2:1.5)));
renderer.setSize(innerWidth,innerHeight,false);
renderer.outputEncoding=THREE.sRGBEncoding;
renderer.toneMapping=FXQ?THREE.NoToneMapping:THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const MAXANI=renderer.capabilities.getMaxAnisotropy();
const scene=new THREE.Scene();
const HOR='#d5e2e9', ZEN='#6b9dcc', FOG_NEAR=1600, FOG_FAR=38000;
scene.fog=new THREE.Fog(Cc(HOR),FOG_NEAR,FOG_FAR);
scene.background=Cc(HOR);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,0.3,60000); camera.layers.enable(1);
camera.position.set(900,600,900);
const sunDir=new V3(-0.42,0.74,0.53).normalize();
const hemi=new THREE.HemisphereLight(Cc('#e3edf5'),Cc('#7d6f4d'),0.55); scene.add(hemi);
const sun=new THREE.DirectionalLight(Cc('#fff1da'),0.82); scene.add(sun); scene.add(sun.target);
sun.castShadow=true; sun.shadow.mapSize.set(FXQ===2?4096:HIGH?2048:1024,FXQ===2?4096:HIGH?2048:1024);
Object.assign(sun.shadow.camera,{left:-90,right:90,top:90,bottom:-90,near:1,far:1200});
sun.shadow.bias=-0.0004; sun.shadow.normalBias=0.35;

const SKY_GLSL=`
float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h2(i),h2(i+vec2(1.0,0.0)),f.x),mix(h2(i+vec2(0.0,1.0)),h2(i+vec2(1.0,1.0)),f.x),f.y); }
vec3 skyBase(vec3 d){ float h=max(d.y,0.0); vec3 c=mix(uHor,uZen,pow(h,0.5)); float mu=max(dot(d,uSun),0.0); float day=1.0-uNight;
  c+=uSunCol*(0.07*pow(mu,4.0)+0.32*pow(mu,32.0)+1.1*pow(mu,420.0))*day;
  vec2 hz=normalize(vec2(d.x,d.z)+1e-5), hs=normalize(vec2(uSun.x,uSun.z)+1e-5); c+=uSunCol*0.18*pow(1.0-h,10.0)*pow(max(dot(hz,hs),0.0),2.0)*day;
  return c; }`;
const sky=new THREE.Mesh(new THREE.SphereGeometry(50000,32,16),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,fog:false,
  uniforms:{uHor:{value:new THREE.Color()},uZen:{value:new THREE.Color()},uSun:{value:sunDir},uSunCol:{value:new THREE.Color(1.0,0.93,0.78)},uNight:{value:0},uTime:{value:0},uCloud:{value:0.16},uMoon:{value:new V3(0.3,0.6,-0.74).normalize()}},
  vertexShader:'varying vec3 vD; void main(){ vD=normalize(position); vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.0); gl_Position=p.xyww; }',
  fragmentShader:'uniform vec3 uHor,uZen,uSun,uSunCol,uMoon; uniform float uNight,uTime,uCloud; varying vec3 vD;\n'+SKY_GLSL+`
float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<${FXQ===2?6:FXQ?5:4};i++){ s+=a*n2(p); p=p*2.03+vec2(17.1,9.3); a*=0.5; } return s; }
float h3(vec3 p){ return fract(sin(dot(p,vec3(12.9898,78.233,45.164)))*43758.5453); }
void main(){ vec3 d=normalize(vD); vec3 c=skyBase(d); float day=1.0-uNight; float mu=dot(d,uSun);
  c+=uSunCol*smoothstep(0.99966,0.99986,mu)*42.0*day;
  if(d.y>0.0){ vec2 p=d.xz/(d.y+0.07)*1.35+vec2(uTime*0.0055,uTime*0.0021);
    float n=fbm(p); float cov=smoothstep(0.62-uCloud,0.92-uCloud*0.5,n)*smoothstep(0.0,0.14,d.y); float th=smoothstep(0.58,1.02,n);
    vec3 lit=uSunCol*1.05*day+uZen*0.55+uHor*0.3; vec3 shd=mix(uHor,uZen,0.4)*0.72+uSunCol*0.1*day;
    vec3 cc=mix(lit,shd,th*0.8); cc+=uSunCol*pow(max(mu,0.0),10.0)*(1.0-th)*1.4*day;
    cc=mix(cc,cc*vec3(0.22,0.26,0.36),uNight*0.9);
    c=mix(c,cc,cov*0.9); }
  if(uNight>0.01){ vec3 q=floor(d*420.0); float st=step(0.9972,h3(q))*smoothstep(0.03,0.3,d.y)*(0.5+0.5*h3(q+7.0)); c+=vec3(st*uNight*1.6);
    float mm=dot(d,uMoon); c+=vec3(0.86,0.9,1.0)*(smoothstep(0.99955,0.99972,mm)*2.6+pow(max(mm,0.0),48.0)*0.06)*uNight; }
  gl_FragColor=vec4(c,1.0);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}`
}));
sky.layers.set(1);
sky.renderOrder=-10; scene.add(sky);

const waterMat=new THREE.ShaderMaterial({
  uniforms:{uTime:{value:0},uSun:{value:sunDir},uSunCol:{value:new THREE.Color(1,0.95,0.85)},uDeep:{value:new THREE.Color()},uShallow:{value:Cc('#638f7c')},uHor:{value:new THREE.Color()},uZen:{value:new THREE.Color()},uFog:{value:new THREE.Color()},uNear:{value:FOG_NEAR},uFar:{value:FOG_FAR},uNight:{value:0},uPool:{value:0},
    tH:{value:null},uHB:{value:new THREE.Vector4(0,0,1,1)},tHW:{value:null},uHBW:{value:new THREE.Vector4(0,0,1,1)},uHasH:{value:0}},
  vertexShader:'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
  fragmentShader:`precision highp float;
uniform float uTime,uNear,uFar,uNight,uPool,uHasH; uniform vec3 uSun,uSunCol,uDeep,uShallow,uHor,uZen,uFog; uniform sampler2D tH,tHW; uniform vec4 uHB,uHBW; varying vec3 vW;
float h2(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h2(i),h2(i+vec2(1.0,0.0)),f.x),mix(h2(i+vec2(0.0,1.0)),h2(i+vec2(1.0,1.0)),f.x),f.y); }
vec2 wv(vec2 p, vec2 d, float k, float s, float a){ float ph=dot(p,d)*k+uTime*s; return d*k*a*cos(ph); }
float groundH(vec2 p){ vec2 a=(p-uHB.xy)/uHB.z; if(a.x>0.002&&a.y>0.002&&a.x<0.998&&a.y<0.998) return texture2D(tH,a).r*60.0-20.0; vec2 b=(p-uHBW.xy)/uHBW.z; if(b.x>0.0&&b.y>0.0&&b.x<1.0&&b.y<1.0) return texture2D(tHW,b).r*60.0-20.0; return -30.0; }
void main(){
  vec3 V=cameraPosition-vW; float dist=length(V); V/=dist; vec2 p=vW.xz; float fade=(1.0-smoothstep(120.0,1400.0,dist))*(0.75+0.5*n2(p*0.004+uTime*0.002));
  float fs=1.0-smoothstep(40.0,420.0,dist);
  vec2 g=wv(p,normalize(vec2(1.0,0.3)),0.21,1.3,0.10)+wv(p,normalize(vec2(-0.4,1.0)),0.33,1.7,0.06)+(wv(p,normalize(vec2(0.8,-0.7)),0.71,2.3,0.025)+wv(p,normalize(vec2(-0.9,-0.2)),1.37,3.1,0.012)+wv(p,normalize(vec2(0.2,0.95)),2.9,4.0,0.005))*fs;
  float nf=1.0-smoothstep(12.0,200.0,dist);
  if(nf>0.0){ float e=0.12; vec2 q=p*1.6+vec2(uTime*0.33,uTime*0.2); float n0=n2(q); g+=vec2(n2(q+vec2(e,0.0))-n0,n2(q+vec2(0.0,e))-n0)/e*0.04*nf; vec2 q2=p*4.3-vec2(uTime*0.62,uTime*0.41); n0=n2(q2); g+=vec2(n2(q2+vec2(e,0.0))-n0,n2(q2+vec2(0.0,e))-n0)/e*0.014*nf; }
  g*=fade; if(uPool>0.5) g*=0.3;
  vec3 N=normalize(vec3(-g.x,1.0,-g.y)); float day=1.0-uNight;
  float fr=0.02+0.98*pow(1.0-max(dot(N,V),0.0),5.0);
  vec3 R=reflect(-V,N); R.y=abs(R.y); float mu=max(dot(R,uSun),0.0);
  vec3 skyc=mix(uHor,uZen,pow(clamp(R.y,0.0,1.0),0.5))+uSunCol*(0.07*pow(mu,4.0)+0.32*pow(mu,32.0))*day;
  float depth=uHasH>0.5?max(vW.y-groundH(p),0.0):8.0;
  vec3 body=mix(uShallow,uDeep,1.0-exp(-depth/2.4))*(0.35+0.65*clamp(uSun.y*1.6,0.0,1.0))*(1.0-0.88*uNight);
  vec3 col=mix(body,skyc,clamp(fr,0.0,1.0));
  col+=uSunCol*(pow(mu,900.0)*9.0+pow(mu,110.0)*0.35)*day*(uPool>0.5?0.5:1.0);
  if(uPool<0.5&&uHasH>0.5){ float f=smoothstep(0.5,0.0,depth)*(0.4+0.6*n2(p*0.85+vec2(uTime*0.22,-uTime*0.17)))*(1.0-smoothstep(250.0,1600.0,dist)); col=mix(col,vec3(0.8,0.84,0.82)*(0.25+0.75*day),f*0.65); }
  if(uPool>0.5){ float cs=abs(sin(p.x*2.7+uTime*1.3)+sin(p.y*3.1-uTime*1.1)+sin((p.x+p.y)*2.2+uTime*0.7))/3.0; col+=uShallow*cs*cs*0.35*day; col+=vec3(0.05,0.55,0.75)*uNight*1.6; }
  col=mix(col,uFog,smoothstep(uNear,uFar,dist));
  gl_FragColor=vec4(col,1.0);
  #include <tonemapping_fragment>
  #include <encodings_fragment>
}`
});
waterMat.side=THREE.DoubleSide;

/* ================= light by time of day (real sun position over the island, or a preset) ================= */
const WATERMATS=[waterMat], NIGHTMATS=[];
const ISLE_LAT=WP.lat, ISLE_LON=WP.lon;
const TOD={mode:store.get('vg_tod')||'real',elev:40,night:0,label:''};
function dirFromElAz(elDeg,azDeg){ const e=elDeg*Math.PI/180, a=azDeg*Math.PI/180; return new V3(Math.sin(a)*Math.cos(e),Math.sin(e),-Math.cos(a)*Math.cos(e)); }
function sunNow(date){ // low-precision solar ephemeris (good to a fraction of a degree)
  const rad=Math.PI/180, d=date.getTime()/86400000-10957.5;
  const g=(357.529+0.98560028*d)*rad, q=280.459+0.98564736*d, L=(q+1.915*Math.sin(g)+0.020*Math.sin(2*g))*rad, e=(23.439-0.00000036*d)*rad;
  const ra=Math.atan2(Math.cos(e)*Math.sin(L),Math.cos(L)), dec=Math.asin(Math.sin(e)*Math.sin(L));
  const gmst=((18.697374558+24.06570982441908*d)%24+24)%24; const H=(gmst*15+ISLE_LON)*rad-ra; const la=ISLE_LAT*rad;
  const E=-Math.cos(dec)*Math.sin(H), N=Math.cos(la)*Math.sin(dec)-Math.sin(la)*Math.cos(dec)*Math.cos(H), U=Math.sin(la)*Math.sin(dec)+Math.cos(la)*Math.cos(dec)*Math.cos(H);
  return {elev:Math.asin(Math.max(-1,Math.min(1,U)))/rad, dir:new V3(E,U,-N).normalize()};
}
const TOD_PRESETS={manana:[22,112],mediodia:[41,190],tarde:[11,252],puesta:[3.5,250,{sun:0.79,hemi:0.75}],noche:[-26,300]};
const TODK=[-18,-8,-2,3,10,25,60];
const TODC={
  zen:['#050b18','#0d1931','#2a3e66','#4c76ab','#5d90c4','#6b9dcc','#6b9dcc'],
  hor:['#0c1627','#1a2741','#a8786a','#e6b38e','#e4c3a6','#d5e2e9','#d5e2e9'],
  sunc:['#8fa6cf','#8fa6cf','#ff8d4d','#ffb070','#ffcc94','#fff4e4','#fffaf2'],
  hsky:['#1d2a45','#2b3b5e','#8e8297','#e2cbb8','#e3e5e5','#e3edf5','#e8f0f6'],
  hgnd:['#14161c','#1d1e24','#4d4136','#6e5f45','#7a6c4b','#7d6f4d','#83754f'],
  deep:['#07121a','#0b1b24','#1f3a45','#284e59','#2d5a66','#2e5c68','#2e5c68']};
const TODI={sun:[0.42,0.38,0.24,0.54,0.78,0.84,0.86],hemi:[0.3,0.3,0.36,0.56,0.63,0.6,0.6]};
const LIGHTK=FXQ?{sun:1.18,hemi:0.74}:{sun:1.12,hemi:0.85};
const _tc=new THREE.Color(), _tc2=new THREE.Color();
function keyAt(el){ let i=0; while(i<TODK.length-2&&el>TODK[i+1]) i++; const t=Math.max(0,Math.min(1,(el-TODK[i])/(TODK[i+1]-TODK[i]))); return [i,t]; }
function colAt(arr,el,out){ const [i,t]=keyAt(el); out.copy(Cc(arr[i])).lerp(_tc2.copy(Cc(arr[i+1])),t); return out; }
function numAt(arr,el){ const [i,t]=keyAt(el); return arr[i]+(arr[i+1]-arr[i])*t; }
function applyTOD(el,dir,mul){
  TOD.elev=el; const night=1-sstep(-10,-1,el); TOD.night=night;
  const moon=dirFromElAz(38,150); const k=sstep(-7,-1,el); sunDir.copy(moon).lerp(dir,k).normalize(); if(sunDir.y<0.08&&el>-1){ sunDir.y=Math.max(sunDir.y,0.08); sunDir.normalize(); }
  colAt(TODC.sunc,el,sun.color); sun.intensity=numAt(TODI.sun,el)*LIGHTK.sun*(mul&&mul.sun||1);
  colAt(TODC.hsky,el,hemi.color); colAt(TODC.hgnd,el,hemi.groundColor); hemi.intensity=numAt(TODI.hemi,el)*LIGHTK.hemi*(mul&&mul.hemi||1);
  const hor=colAt(TODC.hor,el,new THREE.Color()), zen=colAt(TODC.zen,el,new THREE.Color());
  scene.fog.color.copy(hor); scene.background.copy(hor);
  const su=sky.material.uniforms; su.uHor.value.copy(hor); su.uZen.value.copy(zen);
  su.uSunCol.value.copy(sun.color).multiplyScalar(night>0.5?0.9:1.0); su.uNight.value=night; su.uMoon.value.copy(dirFromElAz(38,150));
  for(const m of WATERMATS){ const u=m.uniforms; u.uHor.value.copy(hor); u.uFog.value.copy(hor); u.uZen.value.copy(zen).lerp(_tc.copy(Cc('#8fb6d8')),0.3*(1-night)); u.uSunCol.value.copy(sun.color).multiplyScalar(1.4); u.uNight.value=night;
    if(!m.userData.pool) colAt(TODC.deep,el,u.uDeep.value); }
  for(const m of NIGHTMATS) m.emissiveIntensity=night*(m.userData.nightK||1)*(FXQ?2.2:1);
  if(typeof FOLIAGE_FILL!=='undefined') FOLIAGE_FILL.value.copy(hemi.color).lerp(_tc.copy(sun.color),0.4).multiplyScalar((hemi.intensity*0.55+sun.intensity*0.16)*(1-0.6*night));
  if(typeof envUpdate==='function') envUpdate(true);
  if(BIRDGEO.mat) BIRDGEO.mat.color.copy(Cc('#5c6265')).multiplyScalar(1-0.7*night);
  if(typeof S!=='undefined'&&S.interior) interiorLight();
}
// indoors: the sun keeps its strength (it enters through the real openings and draws its patches), the sky fill drops
// to what the windows let in, lamps and daylight fills take over, and the room's own reflection map adds the bounce
function interiorLight(){ const I=S.interior; if(!I) return; const n=TOD.night, day=1-n;
  hemi.intensity*=FXQ?0.42:0.7; hemi.groundColor.copy(Cc('#8f867a')).lerp(_tc.copy(Cc(I.th.fc)),0.25).multiplyScalar(0.6+0.3*day);
  const lampK=FXQ?(0.07+1.45*n):(0.25+0.9*n);
  for(const l of intLights) l.intensity=l.userData.on?lampK:0;
  for(const l of winLights){ l.intensity=l.userData.on?0.85*day*Math.min(1,Math.max(0,(TOD.elev+2)/10)):0; if(l.userData.on) l.color.copy(hemi.color).lerp(_tc.copy(sun.color),0.35); }
  const M=I.mats; if(M){ M.glass.color.copy(Cc(n>0.5?'#0d1626':'#e2edf2')); M.glass.opacity=0.1+0.26*n;
    const gk=FXQ?(0.55+4.1*n):(0.7+0.3*n); M.glow.color.setRGB(1.0*gk,0.8*gk,0.56*gk); }
  if(FXQ&&I.env&&Math.abs((I.envEl===undefined?-99:I.envEl)-TOD.elev)>1.5&&!(I.envT>0)) I.envT=2;
  interiorShafts(); }
function updateTOD(force){
  let el,dir,mul;
  if(TOD.mode==='real'){ const s=sunNow(new Date()); el=s.elev; dir=s.dir; }
  else { const p=TOD_PRESETS[TOD.mode]||TOD_PRESETS.mediodia; el=p[0]; dir=dirFromElAz(p[0],p[1]); mul=p[2]; }
  applyTOD(el,dir,mul);
}
function setTOD(m){ TOD.mode=m; store.set('vg_tod',m); updateTOD(true); if(typeof ppSnapExposure==='function') ppSnapExposure(); document.querySelectorAll('#todRow button').forEach(b=>b.classList.toggle('on',b.dataset.tod===m)); }

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
 { vec2 jit=(vec2(vn(vWP.xz*0.8),vn(vWP.xz*0.8+31.7))-0.5)*1.3+(vec2(hh(floor(vWP.xz*4.0)),hh(floor(vWP.xz*4.0)+9.1))-0.5)*0.35;
   vec2 suv=(vWP.xz+jit-uSurfB.xy)/uSurfB.z; float code=floor(texture2D(tSurf,suv).r*255.0+0.5);
   float dc=distance(vWP,cameraPosition); float nearF=1.0-smoothstep(15.0,220.0,dc); float midF=1.0-smoothstep(80.0,900.0,dc);
   float d1=texture2D(tDet,vWP.xz*0.16).r, d2=texture2D(tDet,vWP.xz*0.035+0.37).r;
   vec3 c=diffuseColor.rgb*0.74; float l=dot(c,vec3(0.299,0.587,0.114)); c=max(mix(vec3(l),c,1.2),0.0);
   float amp=0.6;
   if(code>2.5&&code<3.5){ float st=step(0.5,fract(dot(vWP.xz,vec2(0.6,0.8))/11.0)); c=mix(c,vec3(0.12,0.29,0.06),0.28)*mix(0.95,1.06,st); amp=0.32; }
   else if(code>1.5&&code<2.5){ c=mix(c,vec3(0.14,0.30,0.08),0.12); amp=0.45; }
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
  if(W.SEA&&h>-1&&h<3) c=mixc(c,TP.shore,0.5);
  return c;
}
/* the core terrain is a grid of square tiles, each rebuilt at the level of detail its distance asks for (2-2.5 m next to
   you, 20 m far away); the photo is sampled by world position, so a tile can use the shared photo of the whole core or,
   when you are near, a sharper photo tile of its own (worlds that ship them) */
const CT={tiles:[],mat:null,det:null,surfB:null,ts:0,photo:null,lastX:1e9,lastZ:1e9,lastY:1e9,tick:0};
function coreMaterial(tex,x0,z0,size){
  const mat=new THREE.MeshLambertMaterial({map:tex}); mat.userData.mapB=new V3(x0,z0,size);
  mat.onBeforeCompile=function(sh){ injectWP(sh); sh.uniforms.tSurf={value:surfTex}; sh.uniforms.tDet={value:CT.det}; sh.uniforms.uSurfB={value:CT.surfB}; sh.uniforms.uMapB={value:this.userData.mapB};
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;\nuniform sampler2D tSurf; uniform sampler2D tDet; uniform vec3 uSurfB; uniform vec3 uMapB;\n'+NOISE_GLSL)
      .replace('#include <map_fragment>','{ vec2 muv=(vWP.xz-uMapB.xy)/uMapB.z; vec4 texelColor=texture2D(map,vec2(muv.x,1.0-muv.y)); texelColor=mapTexelToLinear(texelColor); diffuseColor*=texelColor; }\n'+CORE_FRAG); };
  return mat; }
const LODS=[HIGH?2.0:2.6,5,10,20], LODR=[HIGH?260:190,700,1700];
function tileGeo(t,lv){
  const n=Math.max(4,Math.ceil(t.s/LODS[lv])), N=n+1, st=t.s/n, e=1.25;
  const nv=N*N+4*N; const pos=new Float32Array(nv*3), nor=new Float32Array(nv*3); const H=new Float32Array(N*N);
  for(let j=0;j<N;j++) for(let i=0;i<N;i++){ const x=t.x0+i*st, z=t.z0+j*st, h=W.terrain(x,z), k=j*N+i; H[k]=h;
    pos[k*3]=x; pos[k*3+1]=h; pos[k*3+2]=z;
    const gx=(W.terrain(x+e,z)-W.terrain(x-e,z))/(2*e), gz=(W.terrain(x,z+e)-W.terrain(x,z-e))/(2*e); const l=Math.hypot(gx,1,gz);
    nor[k*3]=-gx/l; nor[k*3+1]=1/l; nor[k*3+2]=-gz/l; }
  const idx=[]; for(let j=0;j<n;j++) for(let i=0;i<n;i++){ const a=j*N+i, b=a+1, c=a+N, d=c+1; idx.push(a,c,b, b,c,d); }
  // a skirt hangs from the four edges and hides the hairline gaps against a neighbour drawn at another level of detail
  const drop=0.6+LODS[lv]*0.3; let v=N*N; const edge=[]; for(let i=0;i<N;i++) edge.push(i); for(let j=1;j<N;j++) edge.push(j*N+n); for(let i=n-1;i>=0;i--) edge.push(n*N+i); for(let j=n-1;j>0;j--) edge.push(j*N);
  const base=v; for(const k of edge){ pos[v*3]=pos[k*3]; pos[v*3+1]=pos[k*3+1]-drop; pos[v*3+2]=pos[k*3+2]; nor[v*3]=nor[k*3]; nor[v*3+1]=nor[k*3+1]; nor[v*3+2]=nor[k*3+2]; v++; }
  for(let q=0;q<edge.length;q++){ const a=edge[q], b=edge[(q+1)%edge.length], a2=base+q, b2=base+(q+1)%edge.length; idx.push(a,b,a2, b,b2,a2, a,a2,b, b,a2,b2); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(pos.subarray(0,v*3),3)); g.setAttribute('normal',new THREE.BufferAttribute(nor.subarray(0,v*3),3));
  g.setIndex(v>65535?new THREE.Uint32BufferAttribute(idx,1):new THREE.Uint16BufferAttribute(idx,1)); g.computeBoundingSphere(); g.computeBoundingBox(); return g; }
function buildCore(tex){
  const C=W.CORE, S=C[2]; const NTM=WP.coreTiles||Math.max(2,Math.round(S/512)); const ts=S/NTM; CT.ts=ts;
  CT.det=detailTex(); CT.det.encoding=THREE.LinearEncoding; CT.surfB=new V3(C[0],C[1],S);
  CT.mat=coreMaterial(tex,C[0],C[1],S);
  for(let j=0;j<NTM;j++) for(let i=0;i<NTM;i++){ const t={i,j,x0:C[0]+i*ts,z0:C[1]+j*ts,s:ts,lv:-1,geos:[],mesh:null};
    t.mesh=new THREE.Mesh(tileGeo(t,3),CT.mat); t.geos[3]=t.mesh.geometry; t.lv=3; t.mesh.receiveShadow=true; t.mesh.userData.tile=t; scene.add(t.mesh); pickables.push(t.mesh); CT.tiles.push(t); }
  // sharper photo tiles near you (when the world ships them)
  const TF=W.course.frames&&W.course.frames.tiles; if(TF&&QUAL!=='low'){ CT.photo={n:TF.n,size:S/TF.n,tex:new Map()}; }
  updateCoreLOD(true);
}
function tileDist(t,p){ const dx=Math.max(t.x0-p.x,0,p.x-(t.x0+t.s)), dz=Math.max(t.z0-p.z,0,p.z-(t.z0+t.s)); const gy=Math.max(0,p.y-W.terrain(Math.min(Math.max(p.x,t.x0),t.x0+t.s),Math.min(Math.max(p.z,t.z0),t.z0+t.s))); return Math.hypot(dx,dz,gy*0.6); }
function updateCoreLOD(all){
  const p=camera.position; let budget=all?1e9:1;
  const order=CT.tiles.map(t=>[tileDist(t,p),t]).sort((a,b)=>a[0]-b[0]);
  for(const [d,t] of order){ const lv=d<LODR[0]?0:d<LODR[1]?1:d<LODR[2]?2:3; if(lv===t.lv) continue;
    if(!t.geos[lv]){ if(lv<2){ if(budget<=0) continue; budget--; } t.geos[lv]=tileGeo(t,lv); }
    t.mesh.geometry=t.geos[lv]; t.lv=lv;
    for(let k=0;k<3;k++){ if(t.geos[k]&&Math.abs(k-lv)>1){ t.geos[k].dispose(); t.geos[k]=null; } } }
  if(CT.photo) updatePhotoTiles(p);
}
function updatePhotoTiles(p){
  const P=CT.photo, C=W.CORE, near=HIGH?650:420, far=near+450;
  for(let j=0;j<P.n;j++) for(let i=0;i<P.n;i++){ const key=j+'_'+i; const x0=C[0]+i*P.size, z0=C[1]+j*P.size;
    const d=Math.hypot(Math.max(x0-p.x,0,p.x-(x0+P.size)),Math.max(z0-p.z,0,p.z-(z0+P.size)),Math.max(0,p.y-80)*0.5); const e=P.tex.get(key);
    if(d<near&&!e){ const rec={mat:null,ready:false}; P.tex.set(key,rec);
      new THREE.TextureLoader().load(DATA_BASE+'tiles/t_'+key+'.jpg',tx=>{ tx.encoding=THREE.sRGBEncoding; tx.anisotropy=Math.min(HIGH?8:4,MAXANI); tx.wrapS=tx.wrapT=THREE.ClampToEdgeWrapping;
        if(P.tex.get(key)!==rec){ tx.dispose(); return; } rec.mat=coreMaterial(tx,x0,z0,P.size); rec.ready=true; assignTileMats(); },undefined,()=>{ rec.failed=true; }); }
    else if(d>far&&e){ if(e.mat){ e.mat.map.dispose(); e.mat.dispose(); } P.tex.delete(key); assignTileMats(); } }
}
function assignTileMats(){ const P=CT.photo, C=W.CORE; for(const t of CT.tiles){ let m=CT.mat;
  if(P){ const i=Math.floor((t.x0-C[0]+1)/P.size), j=Math.floor((t.z0-C[1]+1)/P.size); const e=P.tex.get(j+'_'+i); if(e&&e.ready) m=e.mat; }
  if(t.mesh.material!==m) t.mesh.material=m; } }
function tickCore(dt){ CT.tick+=dt; const p=camera.position; if(CT.tick<0.12) return; CT.tick=0;
  if(Math.hypot(p.x-CT.lastX,p.z-CT.lastZ)<4&&Math.abs(p.y-CT.lastY)<4) return; updateCoreLOD(false); if(CT.tiles.every(t=>t.lv===levelFor(t))){ CT.lastX=p.x; CT.lastZ=p.z; CT.lastY=p.y; } }
function levelFor(t){ const d=tileDist(t,camera.position); return d<LODR[0]?0:d<LODR[1]?1:d<LODR[2]?2:3; }
function wideMaterial(tex){
  const m=new THREE.MeshLambertMaterial({map:tex,vertexColors:true});
  m.onBeforeCompile=sh=>{ injectWP(sh); sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;\n'+NOISE_GLSL)
    .replace('#include <map_fragment>','vec4 texelColor=texture2D(map,vUv); texelColor=mapTexelToLinear(texelColor);\nfloat ins=smoothstep(0.0,0.035,min(min(vUv.x,1.0-vUv.x),min(vUv.y,1.0-vUv.y)));\nfloat dn=vn(vWP.xz*0.035)*0.6+vn(vWP.xz*0.11)*0.4; vec3 oc=vColor*(0.86+0.22*vn(vWP.xz*0.0021)+(dn-0.5)*0.22);\ndiffuseColor.rgb=mix(oc,texelColor.rgb*0.9,ins);')
    .replace('#include <color_fragment>',''); };
  return m;
}
function wideRect(){ const G=W.wide; return [G.x0,G.z0,G.x0+G.step*(G.w-1),G.z0+G.step*(G.h-1)]; }
function buildWide(tex){
  const [wx0,wz0,wx1,wz1]=wideRect(), S=Math.max(wx1-wx0,wz1-wz0), N=Math.min(HIGH?440:300,Math.round((HIGH?300:220)*Math.max(1,S/5200))); const geo=new THREE.PlaneGeometry(S,S,N,N); geo.rotateX(-Math.PI/2); geo.translate((wx0+wx1)/2,0,(wz0+wz1)/2);
  const pos=geo.attributes.position, n=pos.count; const col=new Float32Array(n*3), uv=new Float32Array(n*2); const C=W.CORE, O=W.ORTHO;
  for(let i=0;i<n;i++){ const x=pos.getX(i), z=pos.getZ(i); let h=W.terrain(x,z);
    if(x>C[0]+30&&x<C[0]+C[2]-30&&z>C[1]+30&&z<C[1]+C[2]-30) h-=14;
    pos.setY(i,h); col.set(outerColor(x,z,h),i*3); uv[i*2]=(x-O[0])/O[2]; uv[i*2+1]=1-(z-O[1])/O[2]; }
  geo.setAttribute('color',new THREE.BufferAttribute(col,3)); geo.setAttribute('uv',new THREE.BufferAttribute(uv,2)); geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,wideMaterial(tex)); m.receiveShadow=true; scene.add(m); pickables.push(m);
  // skirt on the outer edge, against the regional relief
  const sp=[]; const st=S/N; const cx0=(wx0+wx1)/2, cz0=(wz0+wz1)/2, h0=S/2; const sides=[[cx0-h0,cz0-h0,1,0],[cx0+h0,cz0-h0,0,1],[cx0+h0,cz0+h0,-1,0],[cx0-h0,cz0+h0,0,-1]];
  for(const [sx,sz,dx,dz] of sides){ for(let k=0;k<N;k++){ const ax=sx+dx*k*st, az=sz+dz*k*st, bx=ax+dx*st, bz=az+dz*st; const ha=W.terrain(ax,az), hb=W.terrain(bx,bz); sp.push(ax,ha,az,bx,hb,bz,bx,hb-40,bz, ax,ha,az,bx,hb-40,bz,ax,ha-40,az); } }
  const sg=new THREE.BufferGeometry(); sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3)); sg.computeVertexNormals();
  scene.add(new THREE.Mesh(sg,new THREE.MeshLambertMaterial({color:Cc('#857a62'),side:THREE.DoubleSide})));
}
let RESMASK=null;
function resAt(x,z){ if(!RESMASK) return true; const R=W.reg; const j=Math.round((x-R.x0)/R.step), i=Math.round((z-R.z0)/R.step); if(i<0||j<0||i>=R.h||j>=R.w) return false; return !!RESMASK[i*R.w+j]; }
function regionStrip(x0,x1,z0,z1,nx,nz,mat){
  const geo=new THREE.PlaneGeometry(x1-x0,z1-z0,nx,nz); geo.rotateX(-Math.PI/2); geo.translate((x0+x1)/2,0,(z0+z1)/2);
  const pos=geo.attributes.position, n=pos.count; const col=new Float32Array(n*3);
  for(let i=0;i<n;i++){ const x=pos.getX(i), z=pos.getZ(i); let h=W.terrain(x,z), hc=h; if(W.SEA&&h<0.9&&!resAt(x,z)){ h=0.9+Math.max(0,h)*0.2; hc=25; } pos.setY(i,h); col.set(outerColor(x,z,hc),i*3); }
  geo.setAttribute('color',new THREE.BufferAttribute(col,3)); geo.computeVertexNormals(); scene.add(new THREE.Mesh(geo,mat));
}
function outerMaterial(){ const m=new THREE.MeshLambertMaterial({vertexColors:true});
  m.onBeforeCompile=sh=>{ injectWP(sh); sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vWP;\n'+NOISE_GLSL)
    .replace('#include <color_fragment>','#include <color_fragment>\nfloat dn=vn(vWP.xz*0.035)*0.6+vn(vWP.xz*0.11)*0.4; diffuseColor.rgb*=0.86+0.22*vn(vWP.xz*0.0021)+(dn-0.5)*0.22;'); };
  return m; }
function buildRegion(){
  if(W.SEA) RESMASK=reservoirMask(W.reg);
  const mat=outerMaterial(); const E=40000, k=HIGH?1:1.4; const [ax,az,bx,bz]=wideRect();
  const nl=Math.round(2*E/400/k), nn=Math.round((E+az)/400/k), ns=Math.round((E-bz)/400/k), nw=Math.round((E+ax)/400/k), ne=Math.round((E-bx)/400/k), nm=Math.max(4,Math.round((bz-az)/400/k));
  regionStrip(-E,E,-E,az,nl,nn,mat); regionStrip(-E,E,bz,E,nl,ns,mat); regionStrip(-E,ax,az,bz,nw,nm,mat); regionStrip(bx,E,az,bz,ne,nm,mat);
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
// lake bed heights for the water shader (8 bits over -20..40 m, linearly filtered): depth tint and shore foam
const BED=WP.bed||[-20,40];
function heightTex(G){ const n=G.w*G.h, a=new Uint8Array(n), lo=BED[0], span=BED[1]-BED[0]; for(let k=0;k<n;k++) a[k]=Math.max(0,Math.min(255,Math.round((G.data[k]-lo)/span*255)));
  const t=new THREE.DataTexture(a,G.w,G.h,THREE.LuminanceFormat,THREE.UnsignedByteType); t.magFilter=t.minFilter=THREE.LinearFilter; t.generateMipmaps=false; t.needsUpdate=true; return t; }
function setWaterBed(m){ const c=W.core, w=W.wide; const u=m.uniforms; u.tH.value=WBED.c; u.tHW.value=WBED.w; u.uHasH.value=1;
  u.uHB.value.set(c.x0-c.step/2,c.z0-c.step/2,c.step*c.w,0); u.uHBW.value.set(w.x0-w.step/2,w.z0-w.step/2,w.step*w.w,0); }
const WBED={c:null,w:null};
function buildWater(){
  WBED.c=heightTex(W.core); WBED.w=heightTex(W.wide); setWaterBed(waterMat);
  if(W.SEA){ const wm=new THREE.Mesh(new THREE.PlaneGeometry(90000,90000,96,96).rotateX(-Math.PI/2),waterMat); wm.layers.set(1); scene.add(wm); }
  const pp=[]; for(const p of W.PONDS){ const pts=p.poly.map(q=>new THREE.Vector2(q[0],q[1])); const tris=THREE.ShapeUtils.triangulateShape(pts,[]);
    for(const t of tris) for(const k of t) pp.push(pts[k].x,p.level,pts[k].y); }
  if(pp.length){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pp,3)); const pm=new THREE.Mesh(g,waterMat); pm.layers.set(1); scene.add(pm); }
}

/* ================= swimming pools (from the photo) ================= */
function buildPools(){
  if(!W.POOLS||!W.POOLS.length) return;
  const poolMat=waterMat.clone(); poolMat.side=THREE.DoubleSide; poolMat.userData.pool=true; poolMat.uniforms.uDeep.value=Cc('#1595b5'); poolMat.uniforms.uShallow.value=Cc('#6fd6e3'); poolMat.uniforms.uPool.value=1; setWaterBed(poolMat); WATERMATS.push(poolMat);
  const pos=[]; const gRim=new GB(false);
  for(const p of W.POOLS){ const r=orient(p.ring,true); const pts=r.map(q=>new THREE.Vector2(q[0],q[1])); const tris=THREE.ShapeUtils.triangulateShape(pts,[]);
    for(const t of tris) for(const k of t) pos.push(pts[k].x,p.level,pts[k].y);
    const out=insetRing(r,-0.38);
    for(let i=0;i<r.length;i++){ const j=(i+1)%r.length; gRim.quad([r[i][0],p.level+0.05,r[i][1]],[r[j][0],p.level+0.05,r[j][1]],[out[j][0],p.level+0.05,out[j][1]],[out[i][0],p.level+0.05,out[i][1]],[0,1,0]); } }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); const pm=new THREE.Mesh(g,poolMat); pm.layers.set(1); scene.add(pm);
  gRim.mesh(new THREE.MeshLambertMaterial({color:Cc('#ebe4d4'),polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1}),false);
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
  if(!WP.range) return; const gP=new GB(false), gR=new GB(false); const sx=WP.range[0], sz=WP.range[1], g0=W.terrain(sx,sz);
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
function villaAtlas(K){ // 8 cells of 3 m x 6 m: 0 plain, 1 glazing, 2 window, 3 slot openings; 4-7 the same with the lights on at night
  K=Object.assign({wall:'#d6ba86',base:'#a08a64',sill:'#b9a173'},K||{});
  const draw=(g,w,h,lit)=>{
    g.fillStyle=lit?'#000000':K.wall; g.fillRect(0,0,w,h); if(!lit) speckle(g,w,h,28000,31,['rgba(255,246,222,0.12)','rgba(125,92,52,0.09)','rgba(190,150,96,0.10)']);
    const PX=256/3, PY=512/6, yv=y=>h-y*PY;
    if(!lit){ g.fillStyle=K.base; g.fillRect(0,h-7,w,7); }
    for(let half=0;half<2;half++){ const on=lit&&half===1; if(lit&&half===0) continue; const off=half*1024;
      const glass=(x0,x1,yb,yt)=>{ if(lit){ g.fillStyle='#ffc56e'; g.fillRect(x0+6,yt+6,x1-x0-12,yb-yt-12); return; }
        g.fillStyle='rgba(95,68,36,0.33)'; g.fillRect(x0-9,yt-9,x1-x0+18,yb-yt+9); g.fillStyle='#2a2e30'; g.fillRect(x0,yt,x1-x0,yb-yt);
        const gr=g.createLinearGradient(0,yt,0,yb); gr.addColorStop(0,'#86a0ad'); gr.addColorStop(0.5,'#43596a'); gr.addColorStop(1,'#25323a'); g.fillStyle=gr; g.fillRect(x0+6,yt+6,x1-x0-12,yb-yt-12); };
      g.save(); g.translate(off+256,0); glass(0.35*PX,2.65*PX,yv(0),yv(2.55)); if(!lit){ g.fillStyle='#2a2e30'; g.fillRect(1.5*PX-3,yv(2.55),6,2.55*PY); } else { g.fillStyle='#000'; g.fillRect(1.5*PX-3,yv(2.55),6,2.55*PY); } g.restore();
      g.save(); g.translate(off+512,0); glass(0.8*PX,2.2*PX,yv(0.95),yv(2.25)); if(!lit){ g.fillStyle=K.sill; g.fillRect(0.75*PX,yv(0.95),1.5*PX,7); } g.restore();
      g.save(); g.translate(off+768,0); for(let i=0;i<5;i++){ const cx=(0.62+i*0.44)*PX; if(lit){ g.fillStyle='#ffb85c'; g.fillRect(cx-7,yv(2.1)+1,14,14); continue; } g.fillStyle='rgba(95,68,36,0.35)'; g.fillRect(cx-10,yv(2.12)-2,20,20); g.fillStyle='#2b2723'; g.fillRect(cx-8,yv(2.1),16,16); } g.restore();
      if(lit) break; }
  };
  const map=canvasTex(2048,512,(g,w,h)=>{ draw(g,w,h,false); g.drawImage(g.canvas,0,0,1024,512,1024,0,1024,512); });
  const em=canvasTex(2048,512,(g,w,h)=>draw(g,w,h,true));
  return {map,em};
}
function hotelFacade(){ // 2 x 2 modules of 3.2 m x 3.4 m; the emissive copy lights three of the four windows
  const PX=512/3.2, PY=512/3.4;
  const mod=(g,ox,oy,lit,on)=>{ const yv=y=>oy+512-y*PY; const x0=ox+0.3*PX, x1=ox+2.9*PX, yb=yv(0.9), yt=yv(2.75);
    if(lit){ if(on){ g.fillStyle='#ffc876'; g.fillRect(x0+5,yt+5,x1-x0-10,yb-yt-10); g.fillStyle='#000'; g.fillRect((x0+x1)/2-3,yt,6,yb-yt); } return; }
    g.fillStyle='#c4a875'; g.fillRect(ox,yv(0.32),512,0.32*PY);
    g.fillStyle='rgba(95,68,36,0.3)'; g.fillRect(x0-8,yt-8,x1-x0+16,yb-yt+8); g.fillStyle='#2b3033'; g.fillRect(x0,yt,x1-x0,yb-yt);
    const gr=g.createLinearGradient(0,yt,0,yb); gr.addColorStop(0,'#8aa4b1'); gr.addColorStop(1,'#2c3b45'); g.fillStyle=gr; g.fillRect(x0+5,yt+5,x1-x0-10,yb-yt-10);
    g.fillStyle='#2b3033'; g.fillRect((x0+x1)/2-3,yt,6,yb-yt); g.fillStyle='rgba(240,236,228,0.85)'; g.fillRect(x0,yv(1.0),x1-x0,4); };
  const map=canvasTex(1024,1024,(g,w,h)=>{ g.fillStyle='#d9c08f'; g.fillRect(0,0,w,h); speckle(g,w,h,22000,41,['rgba(255,246,222,0.12)','rgba(125,92,52,0.08)']); for(const [ox,oy] of [[0,0],[512,0],[0,512],[512,512]]) mod(g,ox,oy,false); },true);
  const em=canvasTex(1024,1024,(g,w,h)=>{ g.fillStyle='#000'; g.fillRect(0,0,w,h); [[0,0,1],[512,0,0],[0,512,1],[512,512,1]].forEach(([ox,oy,on])=>mod(g,ox,oy,true,on)); },true);
  return {map,em};
}
function villaORM(){ // G = roughness, B = metalness, same cell layout as villaAtlas
  return canvasTex(2048,512,(g,w,h)=>{ g.fillStyle='rgb(0,255,0)'; g.fillRect(0,0,w,h); const PX=256/3, PY=512/6, yv=y=>h-y*PY;
    const glass=(x0,x1,yb,yt)=>{ g.fillStyle='rgb(0,110,150)'; g.fillRect(x0,yt,x1-x0,yb-yt); g.fillStyle='rgb(0,22,120)'; g.fillRect(x0+6,yt+6,x1-x0-12,yb-yt-12); };
    for(const off of [0,1024]){ g.save(); g.translate(off+256,0); glass(0.35*PX,2.65*PX,yv(0),yv(2.55)); g.fillStyle='rgb(0,110,150)'; g.fillRect(1.5*PX-3,yv(2.55),6,2.55*PY); g.restore();
      g.save(); g.translate(off+512,0); glass(0.8*PX,2.2*PX,yv(0.95),yv(2.25)); g.restore();
      g.save(); g.translate(off+768,0); for(let i=0;i<5;i++){ const cx=(0.62+i*0.44)*PX; g.fillStyle='rgb(0,40,90)'; g.fillRect(cx-8,yv(2.1),16,16); } g.restore(); } }); }
function hotelORM(){ const PX=512/3.2, PY=512/3.4;
  return canvasTex(1024,1024,(g,w,h)=>{ g.fillStyle='rgb(0,230,0)'; g.fillRect(0,0,w,h);
    for(const [ox,oy] of [[0,0],[512,0],[0,512],[512,512]]){ const yv=y=>oy+512-y*PY; const x0=ox+0.3*PX, x1=ox+2.9*PX, yb=yv(0.9), yt=yv(2.75);
      g.fillStyle='rgb(0,110,150)'; g.fillRect(x0,yt,x1-x0,yb-yt); g.fillStyle='rgb(0,22,120)'; g.fillRect(x0+5,yt+5,x1-x0-10,yb-yt-10); g.fillStyle='rgb(0,110,150)'; g.fillRect((x0+x1)/2-3,yt,6,yb-yt); } },true); }
function gravelTex(base,seed){ return canvasTex(256,256,(g,w,h)=>{ g.fillStyle=base; g.fillRect(0,0,w,h); speckle(g,w,h,9000,seed,['rgba(255,235,210,0.18)','rgba(60,30,20,0.22)','rgba(150,90,60,0.2)']); },true); }
const BLD=[]; const BLDMESH=[]; // the building shells that stop casting shadows while you are inside a villa
function buildBuildings(){
  if(WP.bstyle==='madrid') return buildBuildingsMadrid();
  const M=(o)=>new THREE.MeshLambertMaterial(o);
  const gWall=new GB(true), gHotel=new GB(true), gRoof=new GB(true), gRoof2=new GB(true), gPlain=new GB(false), gCorten=new GB(false), gGlass=new GB(false), gDark=new GB(false);
  for(const b of W.BUILDINGS){
    b.solid=false; b.walkY=undefined;
    if(b.f<1||b.ext.length<3) continue;
    const ext=orient(b.ext,true), holes=(b.holes||[]).filter(h=>h.length>=3).map(h=>orient(h,false));
    let gmin=1e9,gmax=-1e9; for(const p of ext){ const g=W.terrain(p[0],p[1]); gmin=Math.min(gmin,g); gmax=Math.max(gmax,g); }
    const cg=W.terrain(b.c[0],b.c[1]); gmin=Math.min(gmin,cg); gmax=Math.max(gmax,cg);
    const R=rng(1000+b.k*7); const occ=R()<0.45;
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
      if(kind==='hotel'){ const v0=(y0-floorY)/6.8, v1=(top-floorY)/6.8; gHotel.quad([a[0],y0,a[1]],[c[0],y0,c[1]],[c[0],top,c[1]],[a[0],top,a[1]],n,[0,v0],[L/6.4,v0],[L/6.4,v1],[0,v1]); continue; }
      const np=Math.max(1,Math.round(L/3)); for(let k=0;k<np;k++){ const t0=k/np, t1=(k+1)/np; const p0=[a[0]+dx*t0,a[1]+dz*t0], p1=[a[0]+dx*t1,a[1]+dz*t1];
        let ty=0; if(kind==='villa'&&L/np>1.8){ const r=R(); ty=r<0.42?0:r<0.66?1:r<0.86?2:3; }
        const cellI=ty+(ty>0&&occ&&R()<0.75?4:0); const u0=(cellI+0.04)/8, u1=(cellI+0.96)/8, v0=(y0-floorY)/6, v1=(top-floorY)/6;
        if(kind==='villa') (b.panels||(b.panels=[])).push({p0,p1,ty,n});
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
  const atlas=villaAtlas(), hf=hotelFacade();
  let wm, hm;
  if(FXQ){ const vo=villaORM(), ho=hotelORM(); vo.encoding=ho.encoding=THREE.LinearEncoding;
    wm=envMat(new THREE.MeshStandardMaterial({color:new THREE.Color(0.86,0.82,0.76),map:atlas.map,emissiveMap:atlas.em,emissive:new THREE.Color(1,1,1),emissiveIntensity:0,roughnessMap:vo,metalnessMap:vo,roughness:1,metalness:1}),0.75);
    hm=envMat(new THREE.MeshStandardMaterial({map:hf.map,emissiveMap:hf.em,emissive:new THREE.Color(1,1,1),emissiveIntensity:0,roughnessMap:ho,metalnessMap:ho,roughness:1,metalness:1}),1.0); }
  else { wm=M({map:atlas.map,emissiveMap:atlas.em,emissive:new THREE.Color(1,1,1),emissiveIntensity:0}); hm=M({map:hf.map,emissiveMap:hf.em,emissive:new THREE.Color(1,1,1),emissiveIntensity:0}); }
  wm.userData.nightK=1.0; hm.userData.nightK=0.85; NIGHTMATS.push(wm,hm);
  BLDMESH.push(gWall.mesh(wm)); gHotel.mesh(hm);
  gRoof.mesh(M({map:gravelTex('#8a5a44',51)}),false); gRoof2.mesh(M({map:gravelTex('#9a958c',52)}),false);
  BLDMESH.push(gPlain.mesh(M({color:Cc('#d4b884')})),gCorten.mesh(M({color:Cc('#7a3f22')}))); gGlass.mesh(FXQ?envMat(new THREE.MeshStandardMaterial({color:Cc('#1d2a33'),roughness:0.06,metalness:0.6}),1.2):M({color:Cc('#22303a'),emissive:Cc('#0c151b')}),false); BLDMESH.push(gDark.mesh(M({color:Cc('#5b4733')}))); for(let i=BLDMESH.length-1;i>=0;i--) if(!BLDMESH[i]) BLDMESH.splice(i,1);
}

/* ================= Madrid buildings: stucco chalets with tiled hip roofs, brick or plaster blocks; grouped in 400 m
   cells so that only what is in view (and in the sun's shadow box) is drawn ================= */
function facadeTex(kind,lit){ // repeating modules: chalet 3 m x 6 m (two floors), block 3.2 m x 6.2 m (two floors)
  const W_=256, H_=512; return canvasTex(W_,H_,(g,w,h)=>{
    const PX=kind==='block'?w/3.2:w/3, PY=h/(kind==='block'?6.2:6), yv=y=>h-y*PY;
    if(!lit){ if(kind==='brick'){ g.fillStyle='#b4643f'; g.fillRect(0,0,w,h); g.strokeStyle='rgba(235,220,200,0.45)'; g.lineWidth=1; for(let y=0;y<h;y+=7){ g.beginPath(); g.moveTo(0,y); g.lineTo(w,y); g.stroke(); const o=(y/7)%2?0:9; for(let x=o;x<w;x+=18){ g.beginPath(); g.moveTo(x,y); g.lineTo(x,y+7); g.stroke(); } } speckle(g,w,h,5000,7,['rgba(80,30,20,0.18)','rgba(255,220,190,0.12)']); }
      else { g.fillStyle='#f1ece3'; g.fillRect(0,0,w,h); speckle(g,w,h,9000,11,['rgba(255,255,255,0.18)','rgba(120,105,85,0.08)']); } }
    else { g.fillStyle='#000'; g.fillRect(0,0,w,h); }
    const floors=2, fh=kind==='block'?3.1:3.0;
    for(let f=0;f<floors;f++){ const yb=f*fh+(kind==='block'?0.9:0.95), yt=yb+(kind==='block'?1.5:1.35);
      const x0=(kind==='block'?0.6:0.85)*PX, x1=(kind==='block'?2.6:2.15)*PX;
      if(lit){ if((f+(kind==='block'?1:0))%3!==2){ g.fillStyle='#ffc777'; g.fillRect(x0+4,yv(yt)+4,x1-x0-8,(yt-yb)*PY-8); } continue; }
      g.fillStyle='rgba(60,45,30,0.28)'; g.fillRect(x0-6,yv(yt)-6,x1-x0+12,(yt-yb)*PY+10);
      g.fillStyle=kind==='brick'?'#e9e2d6':'#ffffff'; g.fillRect(x0-4,yv(yt)-4,x1-x0+8,(yt-yb)*PY+8);
      const gr=g.createLinearGradient(0,yv(yt),0,yv(yb)); gr.addColorStop(0,'#7f98a6'); gr.addColorStop(1,'#26323a'); g.fillStyle=gr; g.fillRect(x0,yv(yt),x1-x0,(yt-yb)*PY);
      g.fillStyle=kind==='brick'?'#e9e2d6':'#ffffff'; g.fillRect((x0+x1)/2-2,yv(yt),4,(yt-yb)*PY);
      if(kind!=='block'&&kind!=='brick'){ g.fillStyle='rgba(95,70,48,0.85)'; g.fillRect(x0,yv(yt),x1-x0,(yt-yb)*PY*0.28); }       // persiana half down
      if(kind==='block'||kind==='brick'){ g.fillStyle='rgba(40,40,40,0.55)'; g.fillRect(x0-6,yv(yb)-3,x1-x0+12,5); for(let x=x0-6;x<x1+6;x+=7) g.fillRect(x,yv(yb+0.95),2,0.95*PY); g.fillRect(x0-6,yv(yb+0.95),x1-x0+12,3); } }
    if(!lit&&kind!=='brick'){ g.fillStyle='rgba(150,135,110,0.35)'; g.fillRect(0,h-10,w,10); }
  },true); }
function roofTileTex(){ return canvasTex(256,256,(g,w,h)=>{ g.fillStyle='#a3522f'; g.fillRect(0,0,w,h); const R=rng(91);
  for(let y=0;y<h;y+=16){ for(let x=-(y/16%2)*12;x<w;x+=24){ const v=0.82+R()*0.3; g.fillStyle='rgb('+Math.round(168*v)+','+Math.round(86*v)+','+Math.round(52*v)+')'; g.fillRect(x+1,y+1,22,14); g.fillStyle='rgba(60,25,15,0.35)'; g.fillRect(x,y+12,24,4); } }
  speckle(g,w,h,3000,5,['rgba(40,30,20,0.25)','rgba(230,200,170,0.15)']); },true); }
function hipRoof(gb,ext,top,soffit){
  const eave=insetRing(ext,-0.45); const A0=Math.abs(ringSA(eave)); let per=0; for(let i=0;i<eave.length;i++){ const j=(i+1)%eave.length; per+=Math.hypot(eave[j][0]-eave[i][0],eave[j][1]-eave[i][1]); }
  const rin=2*A0/per, steps=3, d=rin/steps*0.985, slope=0.58; let cur=eave, y=top, v=0, ridge=top;
  for(let k=0;k<steps;k++){ const nxt=insetRing(cur,d); const A=ringSA(nxt);
    if(Math.sign(A)!==Math.sign(ringSA(cur))||Math.abs(A)<A0*0.02) break;
    let ok=true; for(let i=0;i<cur.length;i++){ const j=(i+1)%cur.length; if((cur[j][0]-cur[i][0])*(nxt[j][0]-nxt[i][0])+(cur[j][1]-cur[i][1])*(nxt[j][1]-nxt[i][1])<=0){ ok=false; break; } }
    if(!ok) break; const y2=y+d*slope, dv=Math.hypot(d,d*slope)/0.95;
    for(let i=0;i<cur.length;i++){ const j=(i+1)%cur.length; const A_=[cur[i][0],y,cur[i][1]], B_=[cur[j][0],y,cur[j][1]], C_=[nxt[j][0],y2,nxt[j][1]], D_=[nxt[i][0],y2,nxt[i][1]];
      const ex=B_[0]-A_[0], ez=B_[2]-A_[2], L=Math.hypot(ex,ez)||1; const ux=ex/L, uz=ez/L;
      const ux1=D_[0]-A_[0], uy1=D_[1]-A_[1], uz1=D_[2]-A_[2]; let nx=-(0*uz1-uz*uy1), ny=-(uz*ux1-ux*uz1), nz=-(ux*uy1-0*ux1); if(ny<0){ nx=-nx; ny=-ny; nz=-nz; } const nl=Math.hypot(nx,ny,nz)||1;
      const U=P=>((P[0]-A_[0])*ux+(P[2]-A_[2])*uz)/2.2;
      gb.quad(A_,B_,C_,D_,[nx/nl,ny/nl,nz/nl],[U(A_),v],[U(B_),v],[U(C_),v+dv],[U(D_),v+dv]); }
    cur=nxt; y=y2; v+=1; ridge=y; }
  const tris=THREE.ShapeUtils.triangulateShape(cur.map(p=>new THREE.Vector2(p[0],p[1])),[]);
  for(const t of tris){ const P=t.map(k=>cur[k]); gb.tri([P[0][0],y,P[0][1]],[P[1][0],y,P[1][1]],[P[2][0],y,P[2][1]],[0,1,0],[P[0][0]/2.2,P[0][1]/2.2],[P[1][0]/2.2,P[1][1]/2.2],[P[2][0]/2.2,P[2][1]/2.2]); }
  if(soffit) for(let i=0;i<ext.length;i++){ const j=(i+1)%ext.length; soffit.quad([ext[i][0],top,ext[i][1]],[ext[j][0],top,ext[j][1]],[eave[j][0],top,eave[j][1]],[eave[i][0],top,eave[i][1]],[0,-1,0]); }
  return ridge; }
function buildBuildingsMadrid(){
  const CELL=400, groups=new Map(); const V=['villa','chalet','chaletB','brick','block','tile','gravel','plain','dark','glass'];
  const grp=(x,z)=>{ const k=Math.floor(x/CELL)+','+Math.floor(z/CELL); let g=groups.get(k); if(!g){ g={}; for(const n of V) g[n]=new GB(!['plain','dark','glass'].includes(n)); groups.set(k,g); } return g; };
  // houses near the holes get real window panels (the ones you can walk into); a 50 m grid marks the land within 260 m of a hole
  const NEAR=new Set(); const mark=(x,z)=>{ for(let dx=-6;dx<=6;dx++) for(let dz=-6;dz<=6;dz++) if(dx*dx+dz*dz<=27) NEAR.add((Math.floor(x/50)+dx)+','+(Math.floor(z/50)+dz)); };
  for(const H of W.HOLES){ const pts=[[H.tx,H.tz]].concat(H.P,[[H.gx,H.gz]]); for(let i=0;i<pts.length-1;i++){ const L=Math.hypot(pts[i+1][0]-pts[i][0],pts[i+1][1]-pts[i][1]); for(let s=0;s<=L;s+=40) mark(pts[i][0]+(pts[i+1][0]-pts[i][0])*s/(L||1),pts[i][1]+(pts[i+1][1]-pts[i][1])*s/(L||1)); } }
  for(const b of W.BUILDINGS){
    b.solid=false; b.walkY=undefined;
    if(b.f<1||b.ext.length<3) continue;
    const ext=orient(b.ext,true), holes=(b.holes||[]).filter(h=>h.length>=3).map(h=>orient(h,false));
    let gmin=1e9,gmax=-1e9; for(const p of ext){ const g=W.terrain(p[0],p[1]); gmin=Math.min(gmin,g); gmax=Math.max(gmax,g); }
    const R=rng(1000+b.k*7); const occ=R()<0.5; const G_=grp(b.c[0],b.c[1]);
    let kind=b.area<14?'shed':(b.f<=2&&b.area<=650)?(b.f===1?'villa':'chalet'):'block';
    const floorY=gmin+0.15+Math.max(0,(gmax-gmin)*0.35);
    const H=kind==='block'?b.f*3.1+0.7:kind==='villa'?3.3+R()*0.5:kind==='chalet'?6.2+R()*0.4:2.6;
    const top=floorY+H, y0=gmin-1.2; const near=NEAR.has(Math.floor(b.c[0]/50)+','+Math.floor(b.c[1]/50));
    b.kind=kind==='villa'&&near?'villa':kind==='block'?'hotel':kind==='shed'?'shed':'house'; b.ring=ext; b.holesO=holes; b.floorY=floorY; b.top=top; b.base=y0;
    const wallsFor=(ring)=>{ for(let i=0;i<ring.length;i++){ const a=ring[i], c=ring[(i+1)%ring.length]; const dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz); if(L<0.05) continue; const n=[dz/L,0,-dx/L];
      if(b.kind==='villa'){ const np=Math.max(1,Math.round(L/3)); for(let k=0;k<np;k++){ const t0=k/np, t1=(k+1)/np; const p0=[a[0]+dx*t0,a[1]+dz*t0], p1=[a[0]+dx*t1,a[1]+dz*t1];
          let ty=0; if(L/np>1.8){ const r=R(); ty=r<0.36?0:r<0.56?1:r<0.9?2:3; } const cellI=ty+(ty>0&&occ&&R()<0.75?4:0); const u0=(cellI+0.04)/8, u1=(cellI+0.96)/8, v0=(y0-floorY)/6, v1=(top-floorY)/6;
          (b.panels||(b.panels=[])).push({p0,p1,ty,n}); G_.villa.quad([p0[0],y0,p0[1]],[p1[0],y0,p1[1]],[p1[0],top,p1[1]],[p0[0],top,p0[1]],n,[u0,v0],[u1,v0],[u1,v1],[u0,v1]); } continue; }
      if(kind==='shed'){ G_.plain.quad([a[0],y0,a[1]],[c[0],y0,c[1]],[c[0],top,c[1]],[a[0],top,a[1]],n); continue; }
      const mod=kind==='block'?3.2:3, fh=kind==='block'?6.2:6, gbw=kind==='block'?(R()<0.55?G_.brick:G_.block):(b.k%3===0?G_.chaletB:G_.chalet);
      const u1=Math.max(1,Math.round(L/mod)); gbw.quad([a[0],y0,a[1]],[c[0],y0,c[1]],[c[0],top,c[1]],[a[0],top,a[1]],n,[0,(y0-floorY)/fh],[u1,(y0-floorY)/fh],[u1,(top-floorY)/fh],[0,(top-floorY)/fh]); } };
    wallsFor(ext); holes.forEach(wallsFor);
    if((kind==='villa'||kind==='chalet')&&!holes.length&&ext.length<=12){ const ridge=hipRoof(G_.tile,ext,top,G_.plain); b.walkY=top+0.05; b.roofTop=ridge; }
    else { const pd=0.3, drop=kind==='block'?0.9:0.4, roofY=top-drop; const extI=insetRing(ext,pd), holesI=holes.map(h=>insetRing(h,pd));
      const cap=(o,i_)=>{ for(let k=0;k<o.length;k++){ const k2=(k+1)%o.length; G_.plain.quad([o[k][0],top,o[k][1]],[o[k2][0],top,o[k2][1]],[i_[k2][0],top,i_[k2][1]],[i_[k][0],top,i_[k][1]],[0,1,0]); } };
      const inner=(r)=>{ for(let k=0;k<r.length;k++){ const a=r[k], c=r[(k+1)%r.length]; const dx=c[0]-a[0], dz=c[1]-a[1], L=Math.hypot(dx,dz); if(L<0.05) continue; G_.plain.quad([a[0],roofY,a[1]],[c[0],roofY,c[1]],[c[0],top,c[1]],[a[0],top,a[1]],[-dz/L,0,dx/L]); } };
      cap(ext,extI); holes.forEach((h,i_)=>cap(h,holesI[i_])); inner(extI); holesI.forEach(inner);
      const pts=extI.concat(...holesI); const tris=THREE.ShapeUtils.triangulateShape(extI.map(p=>new THREE.Vector2(p[0],p[1])),holesI.map(h=>h.map(p=>new THREE.Vector2(p[0],p[1]))));
      for(const t of tris){ const P=t.map(k=>pts[k]); if(!P[0]||!P[1]||!P[2]) continue; G_.gravel.tri([P[0][0],roofY,P[0][1]],[P[1][0],roofY,P[1][1]],[P[2][0],roofY,P[2][1]],[0,1,0],[P[0][0]/3,P[0][1]/3],[P[1][0]/3,P[1][1]/3],[P[2][0]/3,P[2][1]/3]); }
      if(kind==='block'&&b.area>150){ const I2=insetRing(ext,1.2); for(let k=0;k<2;k++){ const p=I2[(R()*I2.length)|0], q=b.c, t=0.3+R()*0.5; const sx=p[0]+(q[0]-p[0])*t, sz=p[1]+(q[1]-p[1])*t; if(W.pointInPoly(sx,sz,extI)) G_.dark.box(sx,roofY,sz,1.6+R()*1.4,1.2,1.2+R(),R()*3); } }
      b.walkY=roofY; }
    b.solid=true; BLD.push(b);
  }
  const M=(o)=>new THREE.MeshLambertMaterial(o); const PBR=(o,k)=>FXQ?envMat(new THREE.MeshStandardMaterial(Object.assign({roughness:0.9,metalness:0},o)),k||0.6):M(o);
  const atlas=villaAtlas({wall:'#eee8dd',base:'#bdb3a2',sill:'#ffffff'});
  const mats={villa:FXQ?envMat(new THREE.MeshStandardMaterial({map:atlas.map,emissiveMap:atlas.em,emissive:new THREE.Color(1,1,1),emissiveIntensity:0,roughness:0.85,metalness:0}),0.7):M({map:atlas.map,emissiveMap:atlas.em,emissive:new THREE.Color(1,1,1),emissiveIntensity:0}),
    tile:PBR({map:roofTileTex(),roughness:0.75},0.5), gravel:M({map:gravelTex('#8e8b84',53)}), plain:M({color:Cc('#e9e3d6')}), dark:M({color:Cc('#5b5853')}), glass:M({color:Cc('#22303a')})};
  for(const [k,kind,tint] of [['chalet','chalet','#f6efe2'],['chaletB','chalet','#ead9b8'],['brick','brick','#ffffff'],['block','block','#e8dfcf']]){
    const tx=facadeTex(kind,false), em=facadeTex(kind,true); mats[k]=FXQ?envMat(new THREE.MeshStandardMaterial({map:tx,color:Cc(tint),emissiveMap:em,emissive:new THREE.Color(1,1,1),emissiveIntensity:0,roughness:0.9,metalness:0}),0.6):M({map:tx,color:Cc(tint),emissiveMap:em,emissive:new THREE.Color(1,1,1),emissiveIntensity:0});
    mats[k].userData.nightK=0.75; NIGHTMATS.push(mats[k]); }
  mats.villa.userData.nightK=1.0; NIGHTMATS.push(mats.villa);
  for(const g of groups.values()) for(const n of V){ const m=g[n].mesh(mats[n],!['gravel','glass'].includes(n)); if(m&&['villa','chalet','chaletB','brick','block','plain','dark'].includes(n)) BLDMESH.push(m); }
}

/* ================= unfinished concrete structures at the west tip (seen in the photo, not in the Catastro) ================= */
const PLAT=[]; const platGrid=new Map(); const PCELL=16;
function addPlat(cx,cz,a,sx,sz,top,thick){ const p={x:cx,z:cz,c:Math.cos(a),s:Math.sin(a),sx,sz,top,bot:top-(thick||0.3)}; PLAT.push(p); const r=Math.hypot(sx,sz)/2+1;
  for(let i=Math.floor((cx-r)/PCELL);i<=Math.floor((cx+r)/PCELL);i++) for(let j=Math.floor((cz-r)/PCELL);j<=Math.floor((cz+r)/PCELL);j++){ const k=i+','+j; if(!platGrid.has(k)) platGrid.set(k,[]); platGrid.get(k).push(p); } return p; }
function platsNear(x,z){ return platGrid.get(Math.floor(x/PCELL)+','+Math.floor(z/PCELL))||[]; }
function insidePlat(p,x,z,m){ const dx=x-p.x, dz=z-p.z; const lx=dx*p.c+dz*p.s, lz=-dx*p.s+dz*p.c; return Math.abs(lx)<p.sx/2+m && Math.abs(lz)<p.sz/2+m; }
const RUINS=WP.ruins||[];
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
const PIER=WP.pier?{A:WP.pier.A,B:WP.pier.B}:{};
function buildMarina(){
  if(!PIER.A) return;
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
let LOD_D=HIGH?650:420; const TREE_EXCL=WP.treeExclude||[]; const PINE_N=WP.pineNoise!==undefined?WP.pineNoise:0.35, PINE_B=WP.pineBase!==undefined?WP.pineBase:0.07; const TREE_FAR=WP.treeFar||1e9;
function buildTrees(){
  const TYPES={
    oak:{hi:shade(lumpy(new THREE.IcosahedronGeometry(1,1),0.13,3),0.56),lo:shade(lumpy(new THREE.IcosahedronGeometry(1,0),0.05,4),0.6),cols:['#536438','#5f6f40','#4b5a32','#657543','#56663a']},
    pine:{hi:shade(lumpy(new THREE.SphereGeometry(1,12,6),0.1,5),0.55),lo:shade(lumpy(new THREE.IcosahedronGeometry(1,0),0.05,6),0.58),cols:['#466434','#50703c','#3e5a30']},
    cypress:{hi:shade(new THREE.ConeGeometry(1,2,8,1),0.55),lo:shade(new THREE.ConeGeometry(1,2,5,1),0.55),cols:['#2f4a2a','#37512f','#2c4528']},
    poplar:{hi:shade(lumpy(new THREE.SphereGeometry(1,9,7),0.08,9),0.6),lo:shade(new THREE.SphereGeometry(1,6,4),0.6),cols:['#b5a148','#c4b05a','#a39a3f','#8d9e49','#b9a04a']}
  };
  const trunkHi=new THREE.CylinderGeometry(0.7,1,1,6,1,true).translate(0,0.5,0);
  const sphere=new THREE.Sphere(new V3(0,30,0),375);
  for(const k in TYPES){ TYPES[k].hi.boundingSphere=sphere; TYPES[k].lo.boundingSphere=sphere; } trunkHi.boundingSphere=sphere;
  const canMat=leafyCanopy(new THREE.MeshLambertMaterial({vertexColors:true})), trunkMat=new THREE.MeshLambertMaterial({color:Cc('#5b5045')});
  const CH=WP.treeChunk||512, chunks=new Map(), OX=W.CORE[0], OZ=W.CORE[1];
  for(const t of W.TREES){
    const x=t.x, z=t.z; const g=W.terrain(x,z); if(W.SEA&&g<0.3) continue; const code=W.surfAt(x,z); if(code===0||code>=20||(code>=3&&code<=7)||code===9) continue;
    if(W.waterLevel(x,z)>g) continue; if(TREE_EXCL.some(r=>x>r[0]&&x<r[1]&&z>r[2]&&z<r[3])) continue;
    const bd=bldDist(x,z,16); if(bd<0.8) continue;
    let near=false; if(W.SEA&&g<4){ for(const [ox,oz] of [[22,0],[-22,0],[0,22],[0,-22]]) if(W.terrain(x+ox,z+oz)<0){ near=true; break; } }
    const r=hsh(Math.round(x*4),Math.round(z*4)), r2=hsh(Math.round(z*4)+7,Math.round(x*4)-3);
    let type='oak'; if(bd<16) type=r<0.42?'pine':r<0.62?'cypress':r<0.76?'poplar':'oak'; else if(near) type=r<0.45?'pine':'oak'; else { const patch=W.vnoise(x/180+3,z/180-7); type=((patch>PINE_N&&r<0.7)||r<PINE_B)?'pine':'oak'; }
    let R,Ry,th,tr;
    if(type==='oak'){ R=t.r*(0.95+r2*0.2); Ry=R*0.62; th=1.3+0.35*R; tr=0.12+0.045*R; }
    else if(type==='pine'){ R=t.r*(1.0+r2*0.25); Ry=Math.max(1.1,R*0.36); th=4.5+R*0.9; tr=0.16+0.035*R; }
    else if(type==='cypress'){ R=0.95+r2*0.4; Ry=4.2+r2*1.8; th=0.5; tr=0.15; }
    else { R=1.5+r2*0.6; Ry=5.8+r2*2.2; th=2.2; tr=0.2; }
    const cy=g+th+Ry*(type==='pine'?0.55:type==='oak'?0.78:0.92);
    const ck=Math.floor((x-OX)/CH)+','+Math.floor((z-OZ)/CH); let C=chunks.get(ck); if(!C){ C={cx:OX+(Math.floor((x-OX)/CH)+0.5)*CH,cz:OZ+(Math.floor((z-OZ)/CH)+0.5)*CH,types:{}}; chunks.set(ck,C); }
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
function updateTreeLOD(){ const cp=camera.position; const gy=Math.max(0,cp.y-W.terrain(cp.x,cp.z)); for(const c of treeChunks){ const d=Math.hypot(cp.x-c.cx,cp.z-c.cz,gy*0.5); const near=d<LOD_D; if(c.can.geometry!==(near?c.hi:c.lo)) c.can.geometry=near?c.hi:c.lo; c.trk.visible=d<LOD_D*1.25; c.can.visible=d<TREE_FAR; } }

/* ================= ambient life: cranes, boats, clouds ================= */
const boats=[], birds=[]; const BIRDGEO={g:null}; const CLOUDMATS=[];
const CRANE_V=24;
function animateBirds(T,dt){ if(!BIRDGEO.g) return; const a=BIRDGEO.g.attributes.position.array; let o=0;
  const P=(x,y,z)=>{ a[o++]=x; a[o++]=y; a[o++]=z; };
  for(const fl of birds){ fl.a+=fl.w*dt; const cx=fl.c[0]+Math.cos(fl.a)*fl.r, cz=fl.c[2]+Math.sin(fl.a)*fl.r; const sg=fl.w>0?1:-1; const fx=-Math.sin(fl.a)*sg, fz=Math.cos(fl.a)*sg; const rx=-fz, rz=fx;
    fl.pos[0]=cx; fl.pos[1]=fl.c[1]; fl.pos[2]=cz;
    for(const b of fl.birds){ const s=1.5; const bx=cx+b.off[0]*fx+b.off[2]*rx, bz=cz+b.off[0]*fz+b.off[2]*rz, by=fl.c[1]+b.off[1]+Math.sin(T*0.6+b.ph)*0.8;
      const L=(u,v,w)=>[bx+(fx*u+rx*v)*s, by+w*s, bz+(fz*u+rz*v)*s];
      const ph=T*1.7*Math.PI*2/1.7+b.ph; const fy=Math.sin(ph)*0.55, span=1.1;
      const F1=L(0.45,0,0), B1=L(-0.55,0,0), Lb=L(0,-0.16,-0.02), Rb=L(0,0.16,-0.02);
      P(...F1); P(...Lb); P(...B1); P(...F1); P(...B1); P(...Rb);
      P(...L(0.45,0.05,0)); P(...L(0.45,-0.05,0)); P(...L(1.25,0,-0.08));
      P(...L(-0.55,0.04,0)); P(...L(-0.55,-0.04,0)); P(...L(-1.35,0,-0.05));
      for(const sd of [-1,1]){ const s1=L(0.2,0.12*sd,0), s2=L(-0.25,0.12*sd,0), t1=L(0.05,span*sd*Math.cos(fy),span*Math.sin(fy)), t2=L(-0.3,span*0.95*sd*Math.cos(fy),span*0.95*Math.sin(fy));
        P(...s1); P(...t1); P(...t2); P(...s1); P(...t2); P(...s2); } } }
  BIRDGEO.g.attributes.position.needsUpdate=true; }
function buildLife(){
  // boats: sailboats and motorboats on loops of open water
  const M=c=>new THREE.MeshLambertMaterial({color:Cc(c)});
  const white=M('#f6f5f1'), blue=M('#2a5f86'), dark=M('#2b2f33'), sailW=new THREE.MeshLambertMaterial({color:Cc('#fbfaf4'),side:THREE.DoubleSide}), sailR=new THREE.MeshLambertMaterial({color:Cc('#d6442a'),side:THREE.DoubleSide});
  const cand=WP.boats||[];
  const wakeM=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.32,depthWrite:false,side:THREE.DoubleSide});
  const tri=(pts,mat)=>{ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3)); g.computeVertexNormals(); return new THREE.Mesh(g,mat); };
  let i=0;
  for(const [cx,cz,r,type] of cand){ let ok=true; for(let k=0;k<32;k++){ const a=k/32*Math.PI*2; if(W.terrain(cx+Math.cos(a)*r,cz+Math.sin(a)*r)>-1.5){ ok=false; break; } } if(!ok) continue;
    const g=new THREE.Group();
    if(type==='sail'){ const h=new THREE.Mesh(new THREE.BoxGeometry(6.6,0.9,2.1),white); h.position.y=0.35; g.add(h); const bow=new THREE.Mesh(new THREE.ConeGeometry(1.05,1.6,4),white); bow.rotation.z=-Math.PI/2; bow.rotation.x=Math.PI/4; bow.scale.set(1,1,0.45); bow.position.set(4.1,0.35,0); g.add(bow);
      const cab=new THREE.Mesh(new THREE.BoxGeometry(2.2,0.55,1.4),white); cab.position.set(-0.6,1.05,0); g.add(cab);
      const mast=new THREE.Mesh(new THREE.BoxGeometry(0.12,10.5,0.12),dark); mast.position.set(0.6,5.9,0); g.add(mast);
      g.add(tri([0.6,1.4,0, 0.6,10.8,0, -2.6,1.4,0],i%3===1?sailR:sailW)); g.add(tri([0.7,1.4,0, 0.7,9.4,0, 4.2,1.0,0],sailW));
      boats.push({g,cx,cz,r,a:i*1.9,w:(2.6/r)*(i%2?1:-1),bob:i}); }
    else { const h=new THREE.Mesh(new THREE.BoxGeometry(5.2,0.8,2.0),white); h.position.y=0.35; g.add(h); const bow=new THREE.Mesh(new THREE.ConeGeometry(1.0,1.4,4),white); bow.rotation.z=-Math.PI/2; bow.rotation.x=Math.PI/4; bow.scale.set(1,1,0.4); bow.position.set(3.25,0.35,0); g.add(bow);
      const cab=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.75,1.5),blue); cab.position.set(0.2,1.1,0); g.add(cab);
      const wk=tri([-2.6,0.06,0.7, -30,0.06,9, -30,0.06,6.5, -2.6,0.06,-0.7, -30,0.06,-9, -30,0.06,-6.5, -2.6,0.06,0.5, -18,0.06,0.9, -18,0.06,-0.9],wakeM); wk.renderOrder=2; g.add(wk);
      boats.push({g,cx,cz,r,a:i*1.3,w:(8.5/r)*(i%2?-1:1),bob:i}); }
    g.traverse(o=>{ if(o.isMesh&&o.material!==wakeM) o.castShadow=true; }); scene.add(g); i++; }
  // grullas: flocks in V formation circling the reservoir (they winter in Extremadura from late October)
  const paths=WP.birds||[];
  paths.forEach(([x,y,z,r,v,n],f)=>{ const fl={c:[x,y,z],r,a:f*2.1,w:(v/r)*(f%2?-1:1),birds:[],pos:[x,y,z]};
    for(let b=0;b<n;b++){ const k=Math.ceil(b/2), side=b===0?0:(b%2?1:-1); fl.birds.push({off:[-k*2.7,(Math.random()-0.5)*0.6,side*k*2.5],ph:b*0.9}); } birds.push(fl); });
  const nb=birds.reduce((a,f)=>a+f.birds.length,0); const bg=new THREE.BufferGeometry(); bg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(nb*CRANE_V*3),3));
  const bmesh=new THREE.Mesh(bg,new THREE.MeshBasicMaterial({color:Cc('#5c6265'),side:THREE.DoubleSide})); bmesh.frustumCulled=false; scene.add(bmesh); BIRDGEO.g=bg; BIRDGEO.mat=bmesh.material;
}
function animateBoats(T,dt){ for(const b of boats){ b.a+=b.w*dt; const x=b.cx+Math.cos(b.a)*b.r, z=b.cz+Math.sin(b.a)*b.r; const hx=-Math.sin(b.a)*Math.sign(b.w), hz=Math.cos(b.a)*Math.sign(b.w);
  b.g.position.set(x,0.05+Math.sin(T*1.3+b.bob)*0.12,z); b.g.rotation.set(Math.sin(T*0.9+b.bob)*0.03,-Math.atan2(hz,hx),Math.sin(T*1.1+b.bob)*0.04); } }
