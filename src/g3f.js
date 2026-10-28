
/* ================= graphics: HDR post-processing, image-based light, grass and foliage ================= */
/* The scene renders into a 4x multisampled half-float target. On top: ambient occlusion from a half-resolution depth
   pass (high quality only), a mip-chain bloom, then one composite pass with ACES filmic tone mapping, a light grade,
   vignette and dithering. The sky is the environment map for glossy materials (glass, water-side metal). */
const GLOBU={uTime:{value:0}};
const PP={rt:null,dRT:null,ao:null,ao2:null,bl:[],w:0,h:0,scene:null,cam:null,quad:null,m:{},white:null,expo:1,aoNow:0};
const PPK={bloom:FXQ===2?0.06:0.055,ao:FXQ===2?0.75:0,expo:0.92,sat:1.13,con:1.07,vig:0.24,thr:1.0,knee:0.55,aoRad:0.9};
const PPVS='varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
function ppMat(frag,uniforms,blend){ return new THREE.ShaderMaterial({uniforms,vertexShader:PPVS,fragmentShader:frag,depthTest:false,depthWrite:false,blending:blend||THREE.NoBlending,toneMapped:false,transparent:!!blend}); }
function ppRT(w,h,type){ return new THREE.WebGLRenderTarget(Math.max(1,w),Math.max(1,h),{type:type||THREE.HalfFloatType,format:THREE.RGBAFormat,depthBuffer:false,stencilBuffer:false,minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,generateMipmaps:false}); }
function ppInit(){
  if(!FXQ||PP.scene) return;
  PP.scene=new THREE.Scene(); PP.cam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  PP.quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),null); PP.quad.frustumCulled=false; PP.scene.add(PP.quad);
  PP.white=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1,THREE.RGBAFormat); PP.white.needsUpdate=true;
  PP.depthMat=new THREE.MeshBasicMaterial({colorWrite:false});
  const T=n=>({value:n});
  PP.m.pre=ppMat(`uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uThr,uKnee; varying vec2 vUv;
vec3 s(vec2 o){ return texture2D(tSrc,vUv+uTexel*o).rgb; }
void main(){ vec3 c=(s(vec2(-1.0,-1.0))+s(vec2(1.0,-1.0))+s(vec2(-1.0,1.0))+s(vec2(1.0,1.0)))*0.125+(s(vec2(-2.0,-2.0))+s(vec2(2.0,-2.0))+s(vec2(-2.0,2.0))+s(vec2(2.0,2.0)))*0.03125
  +(s(vec2(0.0,-2.0))+s(vec2(-2.0,0.0))+s(vec2(2.0,0.0))+s(vec2(0.0,2.0)))*0.0625+s(vec2(0.0))*0.125;
  float br=max(c.r,max(c.g,c.b)); float sq=clamp(br-uThr+uKnee,0.0,2.0*uKnee); sq=sq*sq/(4.0*uKnee+1e-4); c*=max(sq,br-uThr)/max(br,1e-4); c=min(c,vec3(40.0)); gl_FragColor=vec4(c,1.0); }`,{tSrc:T(null),uTexel:T(new THREE.Vector2()),uThr:T(PPK.thr),uKnee:T(PPK.knee)});
  PP.m.down=ppMat(`uniform sampler2D tSrc; uniform vec2 uTexel; varying vec2 vUv;
vec3 s(vec2 o){ return texture2D(tSrc,vUv+uTexel*o).rgb; }
void main(){ vec3 c=(s(vec2(-1.0,-1.0))+s(vec2(1.0,-1.0))+s(vec2(-1.0,1.0))+s(vec2(1.0,1.0)))*0.125+(s(vec2(-2.0,-2.0))+s(vec2(2.0,-2.0))+s(vec2(-2.0,2.0))+s(vec2(2.0,2.0)))*0.03125
  +(s(vec2(0.0,-2.0))+s(vec2(-2.0,0.0))+s(vec2(2.0,0.0))+s(vec2(0.0,2.0)))*0.0625+s(vec2(0.0))*0.125; gl_FragColor=vec4(c,1.0); }`,{tSrc:T(null),uTexel:T(new THREE.Vector2())});
  PP.m.up=ppMat(`uniform sampler2D tSrc; uniform vec2 uTexel; uniform float uK; varying vec2 vUv;
vec3 s(vec2 o){ return texture2D(tSrc,vUv+uTexel*o).rgb; }
void main(){ vec3 c=s(vec2(-1.0,-1.0))+2.0*s(vec2(0.0,-1.0))+s(vec2(1.0,-1.0))+2.0*s(vec2(-1.0,0.0))+4.0*s(vec2(0.0))+2.0*s(vec2(1.0,0.0))+s(vec2(-1.0,1.0))+2.0*s(vec2(0.0,1.0))+s(vec2(1.0,1.0)); gl_FragColor=vec4(c/16.0*uK,1.0); }`,
    {tSrc:T(null),uTexel:T(new THREE.Vector2()),uK:T(1)},THREE.AdditiveBlending);
  PP.m.ao=ppMat(`uniform sampler2D tDepth; uniform mat4 uInvProj; uniform vec2 uRes; uniform float uRad,uInt,uPS; varying vec2 vUv;
vec3 vpos(vec2 uv){ float d=texture2D(tDepth,uv).x; vec4 p=uInvProj*vec4(uv*2.0-1.0,d*2.0-1.0,1.0); return p.xyz/p.w; }
float ign(vec2 p){ return fract(52.9829189*fract(dot(p,vec2(0.06711056,0.00583715)))); }
void main(){ float d=texture2D(tDepth,vUv).x; if(d>0.99999){ gl_FragColor=vec4(1.0); return; }
  vec3 P=vpos(vUv); vec2 px=1.0/uRes;
  vec3 Pr=vpos(vUv+vec2(px.x,0.0)), Pl=vpos(vUv-vec2(px.x,0.0)), Pu=vpos(vUv+vec2(0.0,px.y)), Pd=vpos(vUv-vec2(0.0,px.y));
  vec3 dx=abs(Pr.z-P.z)<abs(P.z-Pl.z)?Pr-P:P-Pl; vec3 dy=abs(Pu.z-P.z)<abs(P.z-Pd.z)?Pu-P:P-Pd; vec3 N=normalize(cross(dx,dy));
  float ssr=uPS*uRad/max(-P.z,0.05); if(ssr<1.0){ gl_FragColor=vec4(1.0); return; } ssr=min(ssr,72.0);
  float a0=ign(gl_FragCoord.xy)*6.2831853; float occ=0.0; float r2=uRad*uRad; float bias=0.012+0.0015*(-P.z);
  for(int i=0;i<12;i++){ float t=(float(i)+0.5)/12.0; float a=a0+t*43.98; vec2 suv=vUv+vec2(cos(a),sin(a))*t*ssr*px;
    vec3 v=vpos(suv)-P; float vv=dot(v,v); float f=max(r2-vv,0.0)/r2; occ+=f*f*f*max(dot(v,N)-bias,0.0)/(vv+0.02); }
  float ao=clamp(1.0-occ*uInt*0.42,0.0,1.0); gl_FragColor=vec4(ao,ao,ao,1.0); }`,
    {tDepth:T(null),uInvProj:T(new THREE.Matrix4()),uRes:T(new THREE.Vector2()),uRad:T(PPK.aoRad),uInt:T(1.0),uPS:T(1)});
  PP.m.blur=ppMat(`uniform sampler2D tAO,tDepth; uniform vec2 uDir; uniform float uNear,uFar; varying vec2 vUv;
float ld(vec2 uv){ float z=texture2D(tDepth,uv).x*2.0-1.0; return 2.0*uNear*uFar/(uFar+uNear-z*(uFar-uNear)); }
void main(){ float c=ld(vUv); float s=0.0,w=0.0; for(int i=-4;i<=4;i++){ vec2 uv=vUv+uDir*float(i); float wt=exp(-abs(ld(uv)-c)/(c*0.025+0.03))*(5.0-abs(float(i))); s+=texture2D(tAO,uv).r*wt; w+=wt; } float a=s/max(w,1e-4); gl_FragColor=vec4(a,a,a,1.0); }`,
    {tAO:T(null),tDepth:T(null),uDir:T(new THREE.Vector2()),uNear:T(0.3),uFar:T(60000)});
  PP.m.comp=ppMat(`uniform sampler2D tHDR,tBloom,tAO; uniform float uBloomK,uAOK,uExpo,uSat,uCon,uVig; varying vec2 vUv;
vec3 rrt(vec3 v){ vec3 a=v*(v+0.0245786)-0.000090537; vec3 b=v*(0.983729*v+0.4329510)+0.238081; return a/b; }
vec3 aces(vec3 c){ const mat3 I=mat3(vec3(0.59719,0.07600,0.02840),vec3(0.35458,0.90834,0.13383),vec3(0.04823,0.01566,0.83777)); const mat3 O=mat3(vec3(1.60475,-0.10208,-0.00327),vec3(-0.53108,1.10813,-0.07276),vec3(-0.07367,-0.00605,1.07602));
  c*=1.0/0.6; c=I*c; c=rrt(c); c=O*c; return clamp(c,0.0,1.0); }
vec3 srgb(vec3 c){ return mix(c*12.92,1.055*pow(c,vec3(1.0/2.4))-0.055,step(vec3(0.0031308),c)); }
void main(){ vec3 c=texture2D(tHDR,vUv).rgb; float ao=texture2D(tAO,vUv).r; c*=mix(1.0,ao,uAOK);
  c+=texture2D(tBloom,vUv).rgb*uBloomK; c=aces(c*uExpo);
  float l=dot(c,vec3(0.2126,0.7152,0.0722)); c=mix(vec3(l),c,uSat); c=clamp((c-0.5)*uCon+0.5,0.0,1.0);
  vec2 q=vUv-0.5; c*=1.0-uVig*dot(q,q)*1.7; c=srgb(c);
  c+=(fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-0.5)/255.0; gl_FragColor=vec4(c,1.0); }`,
    {tHDR:T(null),tBloom:T(null),tAO:T(null),uBloomK:T(PPK.bloom),uAOK:T(PPK.ao),uExpo:T(1),uSat:T(PPK.sat),uCon:T(PPK.con),uVig:T(PPK.vig)});
}
function ppSetup(){
  const pr=renderer.getPixelRatio(); const w=Math.max(2,Math.floor(innerWidth*pr)), h=Math.max(2,Math.floor(innerHeight*pr));
  if(PP.rt&&PP.w===w&&PP.h===h) return; PP.w=w; PP.h=h;
  for(const r of [PP.rt,PP.dRT,PP.ao,PP.ao2,...PP.bl]) if(r) r.dispose(); PP.bl=[];
  PP.rt=new THREE.WebGLMultisampleRenderTarget(w,h,{type:THREE.HalfFloatType,format:THREE.RGBAFormat,depthBuffer:true,stencilBuffer:false}); PP.rt.samples=4; PP.rt.texture.generateMipmaps=false;
  if(FXQ===2){ const hw=Math.ceil(w/2), hh=Math.ceil(h/2); PP.dRT=new THREE.WebGLRenderTarget(hw,hh,{depthBuffer:true,stencilBuffer:false,generateMipmaps:false}); PP.dRT.depthTexture=new THREE.DepthTexture(hw,hh); PP.dRT.depthTexture.type=THREE.UnsignedIntType;
    PP.ao=ppRT(hw,hh,THREE.UnsignedByteType); PP.ao2=ppRT(hw,hh,THREE.UnsignedByteType); }
  let bw=w, bh=h; for(let i=0;i<5;i++){ bw=Math.max(1,bw>>1); bh=Math.max(1,bh>>1); PP.bl.push(ppRT(bw,bh)); }
}
// three r128 reuses the depth-pass override program across instanced meshes with and without per-instance colour;
// giving every instanced mesh a (white) colour keeps that program valid for all of them
function ppInstanceColors(){ scene.traverse(o=>{ if(o.isInstancedMesh&&!o.instanceColor){ o.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(o.count*3).fill(1),3); } }); }
function ppPass(mat,target,clear){ PP.quad.material=mat; renderer.setRenderTarget(target); renderer.autoClear=clear!==false; renderer.render(PP.scene,PP.cam); renderer.autoClear=true; }
function ppWantExpo(){ return PPK.expo*(S.interior?1.55-0.12*TOD.night:1+1.25*TOD.night); }
function ppSnapExposure(){ PP.expo=ppWantExpo(); }
function ppRender(dt){
  if(!FXQ){ renderer.render(scene,camera); return; }
  ppInit(); ppSetup();
  renderer.setRenderTarget(PP.rt); renderer.render(scene,camera);
  // exposure: the eye adapts indoors
  PP.expo+=(ppWantExpo()-PP.expo)*(1-Math.exp(-(dt||0.016)*2.5));
  let aoTex=PP.white;
  if(FXQ===2&&PPK.ao>0){
    if(PP.icN!==scene.children.length){ PP.icN=scene.children.length; ppInstanceColors(); }
    const au=renderer.shadowMap.autoUpdate; renderer.shadowMap.autoUpdate=false; camera.layers.set(0); scene.overrideMaterial=PP.depthMat;
    renderer.setRenderTarget(PP.dRT); renderer.render(scene,camera); scene.overrideMaterial=null; camera.layers.enable(1); renderer.shadowMap.autoUpdate=au;
    const m=PP.m.ao.uniforms; m.tDepth.value=PP.dRT.depthTexture; m.uInvProj.value.copy(camera.projectionMatrixInverse); m.uRes.value.set(PP.dRT.width,PP.dRT.height);
    m.uPS.value=PP.dRT.height/(2*Math.tan(camera.fov*Math.PI/360)); m.uRad.value=S.interior?0.55:PPK.aoRad;
    ppPass(PP.m.ao,PP.ao);
    const b=PP.m.blur.uniforms; b.tDepth.value=PP.dRT.depthTexture; b.uNear.value=camera.near; b.uFar.value=camera.far;
    b.tAO.value=PP.ao.texture; b.uDir.value.set(1/PP.dRT.width,0); ppPass(PP.m.blur,PP.ao2);
    b.tAO.value=PP.ao2.texture; b.uDir.value.set(0,1/PP.dRT.height); ppPass(PP.m.blur,PP.ao);
    aoTex=PP.ao.texture; }
  // bloom: bright parts, 5 halvings, then back up adding each level
  const pre=PP.m.pre.uniforms; pre.tSrc.value=PP.rt.texture; pre.uTexel.value.set(1/PP.w,1/PP.h); ppPass(PP.m.pre,PP.bl[0]);
  const dn=PP.m.down.uniforms; for(let i=1;i<PP.bl.length;i++){ dn.tSrc.value=PP.bl[i-1].texture; dn.uTexel.value.set(1/PP.bl[i-1].width,1/PP.bl[i-1].height); ppPass(PP.m.down,PP.bl[i]); }
  const up=PP.m.up.uniforms; for(let i=PP.bl.length-1;i>0;i--){ up.tSrc.value=PP.bl[i].texture; up.uTexel.value.set(1/PP.bl[i].width,1/PP.bl[i].height); up.uK.value=1.0; ppPass(PP.m.up,PP.bl[i-1],false); }
  const c=PP.m.comp.uniforms; c.tHDR.value=PP.rt.texture; c.tBloom.value=PP.bl[0].texture; c.tAO.value=aoTex; c.uAOK.value=aoTex===PP.white?0:PPK.ao; c.uExpo.value=PP.expo; c.uBloomK.value=PPK.bloom*(1+0.8*TOD.night);
  ppPass(PP.m.comp,null);
}

/* ---- the sky as an environment map (PMREM), for glossy glass and metal ---- */
const ENV={tex:null,rt:null,gen:null,scene:null,last:-1e9,mats:[]};
function envUpdate(force){
  if(!FXQ) return; const now=performance.now(); if(!force&&ENV.tex&&now-ENV.last<12000) return; ENV.last=now;
  try{ if(!ENV.gen){ ENV.gen=new THREE.PMREMGenerator(renderer); ENV.scene=new THREE.Scene(); ENV.scene.add(new THREE.Mesh(sky.geometry,sky.material)); }
    const rt=ENV.gen.fromScene(ENV.scene,0.0,1,100000); const old=ENV.rt; ENV.rt=rt; ENV.tex=rt.texture;
    for(const m of ENV.mats){ const first=!m.envMap; m.envMap=ENV.tex; if(first) m.needsUpdate=true; }
    if(old) old.dispose(); }catch(e){ console.warn('env',e); }
}
function envMat(m,k){ if(!FXQ) return m; m.envMapIntensity=k||1; ENV.mats.push(m); if(ENV.tex){ m.envMap=ENV.tex; m.needsUpdate=true; } return m; }

/* ---- foliage: leafy, ragged canopies that sway in the wind ---- */
const FOLIAGE_FILL={value:new THREE.Color(0,0,0)};
const NOISE3_GLSL='float h31(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }\nfloat vn3(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.0-2.0*f); return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z); }\n';
function leafyCanopy(mat){
  mat.onBeforeCompile=sh=>{ sh.uniforms.uTime=GLOBU.uTime; sh.uniforms.uFill=FOLIAGE_FILL;
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime; varying vec3 vLoc; varying vec3 vNv; varying vec3 vVp;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\n#ifdef USE_INSTANCING\n vec3 ip=vec3(instanceMatrix[3][0],instanceMatrix[3][1],instanceMatrix[3][2]);\n#else\n vec3 ip=vec3(0.0);\n#endif\n float sd=fract(sin(dot(ip.xz,vec2(12.9898,78.233)))*43758.5453); float sw=(position.y+1.0)*0.5;\n transformed.x+=sin(uTime*1.25+sd*6.28)*0.035*sw; transformed.z+=cos(uTime*1.05+sd*5.1)*0.028*sw; vLoc=position+sd*7.0;')
      .replace('#include <defaultnormal_vertex>','#include <defaultnormal_vertex>\n vNv=normalize(transformedNormal);')
      .replace('#include <project_vertex>','#include <project_vertex>\n vVp=-mvPosition.xyz;');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uFill; varying vec3 vLoc; varying vec3 vNv; varying vec3 vVp;\n'+NOISE3_GLSL).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+=diffuseColor.rgb*uFill;')
      .replace('#include <color_fragment>','#include <color_fragment>\n float ln=vn3(vLoc*6.5)*0.65+vn3(vLoc*15.0)*0.35; diffuseColor.rgb*=0.72+0.52*ln;\n float rim=1.0-abs(dot(normalize(vNv),normalize(vVp))); if(rim>0.4&&ln<(rim-0.4)*1.85) discard;');
  };
  mat.customProgramCacheKey=()=>'leafy2';
  return mat;
}

/* ---- grass: blades placed on the GPU around the player, on rough, semi-rough, fairway, tees and gardens ---- */
const GRASS={mesh:null,u:null};
function buildGrass(orthoTex){
  if(!FXQ) return;
  const R=FXQ===2?34:21, cell=FXQ===2?0.3:0.42, Gn=Math.ceil(2*R/cell), N=Gn*Gn;
  const geo=new THREE.InstancedBufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute([-1,0,0, 1,0,0, -0.78,0.42,0, 0.78,0.42,0, -0.47,0.76,0, 0.47,0.76,0, 0,1,0],3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute([0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0, 0,1,0],3));
  geo.setIndex([0,1,3, 0,3,2, 2,3,5, 2,5,4, 4,5,6]);
  const off=new Float32Array(N*2); let k=0; for(let j=0;j<Gn;j++) for(let i=0;i<Gn;i++){ off[k++]=i; off[k++]=j; }
  geo.setAttribute('aI',new THREE.InstancedBufferAttribute(off,2)); geo.instanceCount=N;
  // no grass inside buildings or pools: a copy of the surface map with those cells cleared
  const S0=W.surf, mask=new Uint8Array(S0.data); const cs=S0.step;
  const clearPoly=(ring,pad)=>{ let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; for(const p of ring){ x0=Math.min(x0,p[0]); x1=Math.max(x1,p[0]); z0=Math.min(z0,p[1]); z1=Math.max(z1,p[1]); }
    for(let i=Math.max(0,Math.floor((z0-pad-S0.z0)/cs));i<=Math.min(S0.h-1,Math.ceil((z1+pad-S0.z0)/cs));i++) for(let j=Math.max(0,Math.floor((x0-pad-S0.x0)/cs));j<=Math.min(S0.w-1,Math.ceil((x1+pad-S0.x0)/cs));j++){
      const x=S0.x0+(j+0.5)*cs, z=S0.z0+(i+0.5)*cs; if(W.pointInPoly(x,z,ring)||distToRingXZ(x,z,ring)<pad) mask[i*S0.w+j]=7; } };
  for(const b of W.BUILDINGS){ if(b.ext&&b.f>=1) clearPoly(b.ext,0.6); }
  for(const p of W.POOLS) clearPoly(p.ring,0.5);
  const mtex=new THREE.DataTexture(mask,S0.w,S0.h,THREE.LuminanceFormat,THREE.UnsignedByteType); mtex.magFilter=mtex.minFilter=THREE.NearestFilter; mtex.generateMipmaps=false; mtex.needsUpdate=true;
  const C=W.core; const htex=new THREE.DataTexture(C.data,C.w,C.h,THREE.RedFormat,THREE.FloatType); htex.magFilter=htex.minFilter=THREE.NearestFilter; htex.generateMipmaps=false; htex.needsUpdate=true;
  const u={uCam:{value:new THREE.Vector2()},uPlayer:{value:new THREE.Vector2(1e6,1e6)},uCell:{value:cell},uN:{value:Gn},uR:{value:R},uOn:{value:1},uTime:GLOBU.uTime,
    tHg:{value:htex},uHB:{value:new THREE.Vector4(C.x0,C.z0,C.step,C.w)},tSg:{value:mtex},uSB:{value:new V3(S0.x0,S0.z0,S0.step*S0.w)},tCg:{value:orthoTex},uOB:{value:new V3(W.CORE[0],W.CORE[1],W.CORE[2])}};
  const mat=new THREE.MeshLambertMaterial({color:0xffffff,side:THREE.DoubleSide});
  mat.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,u);
    sh.vertexShader=sh.vertexShader.replace('#include <common>',`#include <common>
uniform vec2 uCam,uPlayer; uniform float uCell,uN,uR,uOn,uTime; uniform sampler2D tHg,tSg,tCg; uniform vec4 uHB; uniform vec3 uSB,uOB; attribute vec2 aI; varying vec3 vGC;
float gh(vec2 c){ return fract(sin(dot(c,vec2(127.1,311.7)))*43758.5453); }
float hAt(vec2 p){ vec2 f=(p-uHB.xy)/uHB.z; vec2 i=floor(f); vec2 t=f-i; float s=1.0/uHB.w;
  float a=texture2D(tHg,(i+0.5)*s).r, b=texture2D(tHg,(i+vec2(1.5,0.5))*s).r, c=texture2D(tHg,(i+vec2(0.5,1.5))*s).r, d=texture2D(tHg,(i+1.5)*s).r; return mix(mix(a,b,t.x),mix(c,d,t.x),t.y); }`)
      .replace('#include <begin_vertex>',`vec2 cellC=floor(uCam/uCell)+aI-vec2(floor(uN*0.5));
vec2 wp=(cellC+vec2(gh(cellC),gh(cellC+19.19)))*uCell; float dist=length(wp-uCam);
float code=floor(texture2D(tSg,(wp-uSB.xy)/uSB.z).r*255.0+0.5);
float hgt=0.0, wid=0.03;
if(code>0.5&&code<1.5){ hgt=0.44; wid=0.038; } else if(code>1.5&&code<2.5){ hgt=0.17; } else if(code>2.5&&code<3.5){ hgt=0.07; wid=0.02; } else if(code>3.5&&code<4.5){ hgt=0.045; wid=0.018; } else if(code>5.5&&code<6.5){ hgt=0.05; wid=0.018; } else if(code>9.5&&code<10.5){ hgt=0.12; wid=0.026; }
hgt*=(0.5+gh(cellC+3.7))*smoothstep(uR,uR*0.7,dist)*uOn;
vec3 transformed=vec3(0.0,-9000.0,0.0); vGC=vec3(0.0);
if(hgt>0.008){ float yaw=gh(cellC+7.3)*6.2831853; float cs=cos(yaw), sn=sin(yaw); float lx=position.x*wid;
  float bend=position.y*position.y; vec2 wdir=vec2(0.94,0.33);
  float w=(sin(uTime*1.7+dot(wp,vec2(0.37,0.21)))*0.5+0.5)*0.65+(sin(uTime*0.55+wp.x*0.045+wp.y*0.03)*0.5+0.5)*0.35;
  vec2 lean=vec2(gh(cellC+1.1)-0.5,gh(cellC+2.2)-0.5)*0.6; vec2 dp=wp-uPlayer; float pd=length(dp); vec2 push=pd<0.9?dp/max(pd,1e-3)*(0.9-pd)*1.1:vec2(0.0);
  vec2 off=(lean+wdir*w*0.5+push)*hgt*bend;
  transformed=vec3(wp.x+lx*cs+off.x, hAt(wp)+position.y*hgt-0.025, wp.y+lx*sn+off.y);
  vec3 pc=texture2D(tCg,vec2((wp.x-uOB.x)/uOB.z,1.0-(wp.y-uOB.y)/uOB.z)).rgb; pc=pow(pc,vec3(2.2));
  float pl=dot(pc,vec3(0.3,0.59,0.11)); pc=mix(vec3(pl),pc,1.3);
  float vr=gh(cellC+5.5); vec3 grn=mix(vec3(0.085,0.15,0.045),vec3(0.2,0.22,0.075),vr); pc=mix(pc,grn,code<1.5?0.5:0.28)*(0.82+0.32*gh(cellC+8.8));
  vGC=max(pc,0.0)*mix(0.4,1.04,position.y)*vec3(0.95,1.03,0.84); }`);
    // both faces of a blade take the light of its front (up-facing) side
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vGC;').replace('#include <color_fragment>','diffuseColor.rgb*=vGC;').replace(/:\s*vLightBack/g,': vLightFront').replace(/:\s*vIndirectBack/g,': vIndirectFront');
  };
  mat.customProgramCacheKey=()=>'grass1';
  const mesh=new THREE.Mesh(geo,mat); mesh.frustumCulled=false; mesh.layers.set(1); mesh.receiveShadow=true; mesh.castShadow=false; scene.add(mesh);
  GRASS.mesh=mesh; GRASS.u=u;
}
function distToRingXZ(x,z,ring){ let best=1e9; for(let i=0,j=ring.length-1;i<ring.length;j=i++){ const ax=ring[j][0], az=ring[j][1], vx=ring[i][0]-ax, vz=ring[i][1]-az; const l2=vx*vx+vz*vz||1e-9; const t=Math.max(0,Math.min(1,((x-ax)*vx+(z-az)*vz)/l2)); best=Math.min(best,Math.hypot(ax+vx*t-x,az+vz*t-z)); } return best; }
function updateGrass(){
  if(!GRASS.u) return; const m=S.mode; const off=['menu','drone','loading','plane'].includes(m);
  const cx=off?camera.position.x:P.x, cz=off?camera.position.z:P.z; GRASS.u.uCam.value.set(cx,cz);
  if(m==='walk'||m==='aim'||m==='swing'||m==='wait'||m==='flight') GRASS.u.uPlayer.value.set(P.x,P.z); else GRASS.u.uPlayer.value.set(1e6,1e6);
  const hc=camera.position.y-Math.max(0,W.terrain(camera.position.x,camera.position.z)); const on=1-sstep(40,90,hc);
  GRASS.u.uOn.value=on; GRASS.mesh.visible=on>0.01;
}
