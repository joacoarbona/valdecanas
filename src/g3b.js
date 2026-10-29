
/* ================= character rig ================= */
const SKINS=[
  {n:'Golfista',shirt:'#2a6f87',pants:'#f1eee6',hair:'#5a3b26',skin:'#f1c7a5',shoe:'#ffffff',cap:'#ffffff',pack:'#d6442a'},
  {n:'Naranja',shirt:'#e8742c',pants:'#2b2f3a',hair:'#1f1a17',skin:'#e0ac83',shoe:'#2b2f3a',cap:null,pack:'#2a6f87'},
  {n:'Lila',shirt:'#8b6fd6',pants:'#3b4a6b',hair:'#d9b86a',skin:'#f1c7a5',shoe:'#f2f2f2',cap:null,pack:'#f2c230'},
  {n:'Encina',shirt:'#4f7a3a',pants:'#c9b48a',hair:'#5a3b26',skin:'#c58c63',shoe:'#6b4b2e',cap:'#4f7a3a',pack:'#8a6a4a'},
  {n:'Rojo',shirt:'#d6442a',pants:'#24324a',hair:'#2d1e17',skin:'#e0ac83',shoe:'#ffffff',cap:'#d6442a',pack:'#ffffff'},
  {n:'Sol',shirt:'#f2c230',pants:'#2a6f87',hair:'#a4673a',skin:'#f1c7a5',shoe:'#f2f2f2',cap:null,pack:'#4f7a3a'}
];
function buildRig(sk){
  const M=c=>new THREE.MeshLambertMaterial({color:Cc(c)});
  const mS=M(sk.skin), mT=M(sk.shirt), mP=M(sk.pants), mH=M(sk.hair), mF=M(sk.shoe), mK=M(sk.pack||'#000000');
  const root=new THREE.Group(); const body=new THREE.Group(); body.position.y=0.95; root.add(body);
  body.add(new THREE.Mesh(new THREE.BoxGeometry(0.22,0.2,0.34),mP));
  const torso=new THREE.Group(); torso.position.y=0.06; body.add(torso);
  const cK=sk.chest||1, sK=sk.sh||1, aK=sk.arm||1, lK=sk.leg||1;
  const chest=new THREE.Mesh(new THREE.CylinderGeometry(0.19,0.16,0.5,10),mT); chest.position.y=0.27; chest.scale.set(0.82*cK,1,1.05*cK); torso.add(chest);
  const sh=new THREE.Mesh(new THREE.SphereGeometry(0.2,12,8),mT); sh.scale.set(0.75*cK,0.45,1.18*sK); sh.position.y=0.5; torso.add(sh);
  if(sk.belly){ const bl=new THREE.Mesh(new THREE.SphereGeometry(0.2,14,10),mT); bl.scale.set(1.02,0.9,1.12); bl.position.set(0.06,0.13,0); torso.add(bl); }
  if(sk.top==='jersey'){ const col=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.07,0.13),M('#ffffff')); col.position.set(0.13,0.55,0); col.rotation.z=-0.25; torso.add(col); }
  if(sk.pack){ const pack=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.34,0.28),mK); pack.position.set(-0.19,0.3,0); torso.add(pack); }
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.07,0.12,8),mS); neck.position.y=0.6; torso.add(neck);
  const headG=new THREE.Group(); headG.position.y=0.76; torso.add(headG);
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.135,14,12),mS); head.scale.set(1,1.06,0.96); headG.add(head);
  const hs=sk.hs||(sk.long?'largo':'corto');
  if(hs==='corto'||hs==='largo'||hs==='rizado'||hs==='entradas'){ const hair=new THREE.Mesh(new THREE.SphereGeometry(hs==='rizado'?0.15:0.143,14,10,0,Math.PI*2,0,Math.PI*(hs==='entradas'?0.4:0.52)),mH); hair.position.set(-0.012,0.02,0); if(hs==='entradas'){ hair.rotation.z=0.62; hair.position.set(-0.03,0.0,0); } headG.add(hair);
    if(hs==='rizado') for(let k=0;k<9;k++){ const a=k/9*Math.PI*2; const b=new THREE.Mesh(new THREE.SphereGeometry(0.055,8,6),mH); b.position.set(-0.01+Math.cos(a)*0.09,0.1+((k%2)?0.02:-0.01),Math.sin(a)*0.1); headG.add(b); } }
  if(hs==='rapado'){ const hair=new THREE.Mesh(new THREE.SphereGeometry(0.139,14,10,0,Math.PI*2,0,Math.PI*0.5),mH); hair.position.set(-0.006,0.012,0); headG.add(hair); }
  if(hs==='coronilla'||hs==='entradas'){ const band=new THREE.Mesh(new THREE.SphereGeometry(0.146,18,6,-0.62*Math.PI,1.24*Math.PI,0.38*Math.PI,0.24*Math.PI),mH); band.position.set(-0.008,0.012,0); headG.add(band); }
  if(hs==='largo'&&!sk.long){ const lh=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.3,0.27),mH); lh.position.set(-0.085,-0.1,0); headG.add(lh); }
  if(sk.fh==='barba'){ const bd=new THREE.Mesh(new THREE.SphereGeometry(0.128,12,8,0.5*Math.PI,Math.PI,Math.PI*0.55,Math.PI*0.4),mH); bd.position.set(0.012,0.0,0); bd.scale.set(1,1.05,0.98); headG.add(bd); }
  if(sk.fh==='barba'||sk.fh==='bigote'||sk.fh==='perilla'){ const mu=new THREE.Mesh(new THREE.BoxGeometry(0.03,0.022,0.075),mH); mu.position.set(0.128,-0.045,0); headG.add(mu); }
  if(sk.fh==='perilla'){ const pe=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.05,0.055),mH); pe.position.set(0.112,-0.112,0); headG.add(pe); }
  if(sk.gl==='gafas'||sk.gl==='sol'){ const fm=M('#202020'), lm=M(sk.gl==='sol'?'#141414':'#cfe2ec'); for(const s of [-1,1]){ const l=new THREE.Mesh(new THREE.BoxGeometry(0.016,0.042,0.066),lm); l.position.set(0.131,0.03,s*0.05); headG.add(l); const fr=new THREE.Mesh(new THREE.BoxGeometry(0.012,0.05,0.074),fm); fr.position.set(0.127,0.03,s*0.05); headG.add(fr); } const br=new THREE.Mesh(new THREE.BoxGeometry(0.014,0.01,0.17),fm); br.position.set(0.133,0.05,0); headG.add(br); }
  if(sk.long){ const lh=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.36,0.27),mH); lh.position.set(-0.085,-0.12,0); headG.add(lh); for(const s of [-1,1]){ const sl=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.26,0.05),mH); sl.position.set(0.0,-0.09,s*0.125); headG.add(sl); } }
  if(sk.glasses){ const gm=M('#141414'); for(const s of [-1,1]){ const l=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.045,0.072),gm); l.position.set(0.13,0.03,s*0.05); headG.add(l); } const br=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.012,0.17),gm); br.position.set(0.132,0.048,0); headG.add(br); }
  const eyeM=M('#1d1d1d'); for(const s of [-1,1]){ const e=new THREE.Mesh(new THREE.SphereGeometry(0.019,6,6),eyeM); e.position.set(0.122,0.025,s*0.048); headG.add(e); }
  const nose=new THREE.Mesh(new THREE.SphereGeometry(0.022,6,6),mS); nose.position.set(0.135,-0.01,0); headG.add(nose);
  const hat=sk.hat||(sk.cap?'gorra':'');
  if(hat==='visera'&&sk.cap){ const mC=M(sk.cap); const rg=new THREE.Mesh(new THREE.TorusGeometry(0.142,0.016,6,24),mC); rg.rotation.x=Math.PI/2; rg.position.y=0.06; headG.add(rg); const vis=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.018,0.2),mC); vis.position.set(0.15,0.05,0); headG.add(vis); }
  if(hat==='sombrero'&&sk.cap){ const mC=M(sk.cap); const brim=new THREE.Mesh(new THREE.CylinderGeometry(0.25,0.25,0.016,20),mC); brim.position.y=0.07; headG.add(brim); const crown=new THREE.Mesh(new THREE.CylinderGeometry(0.135,0.15,0.12,16),mC); crown.position.y=0.135; headG.add(crown); }
  if(hat==='gorra'&&sk.cap){ const mC=M(sk.cap); const dome=new THREE.Mesh(new THREE.SphereGeometry(0.15,14,8,0,Math.PI*2,0,Math.PI*0.5),mC); dome.position.y=0.03; headG.add(dome); const vis=new THREE.Mesh(new THREE.BoxGeometry(0.16,0.02,0.2),mC); vis.position.set(0.15,0.035,0); headG.add(vis); }
  function arm(side){ const sg=new THREE.Group(); sg.position.set(0,0.46,0.25*side*sK); torso.add(sg);
    const up=new THREE.Mesh(new THREE.CylinderGeometry(0.058*aK,0.052*aK,0.3,8),mT); up.position.y=-0.15; sg.add(up);
    const el=new THREE.Group(); el.position.y=-0.3; sg.add(el);
    const lo=new THREE.Mesh(new THREE.CylinderGeometry(0.05*aK,0.045*aK,0.27,8),(sk.top==='manga'||sk.top==='jersey')?mT:mS); lo.position.y=-0.135; el.add(lo);
    const hand=new THREE.Mesh(new THREE.SphereGeometry(0.056,8,6),mS); hand.position.y=-0.29; el.add(hand); return {sg,el}; }
  function leg(side){ const hg=new THREE.Group(); hg.position.set(0,-0.06,0.1*side); body.add(hg);
    const th=new THREE.Mesh(new THREE.CylinderGeometry(0.08*lK,0.068*lK,0.42,8),mP); th.position.y=-0.21; hg.add(th);
    const kn=new THREE.Group(); kn.position.y=-0.42; hg.add(kn);
    const shn=new THREE.Mesh(new THREE.CylinderGeometry(0.065*lK,0.055*lK,0.4,8),sk.pt==='corto'?mS:mP); shn.position.y=-0.2; kn.add(shn);
    if(sk.pt==='corto'){ const sock=new THREE.Mesh(new THREE.CylinderGeometry(0.058*lK,0.058*lK,0.08,8),M('#f4f4f2')); sock.position.y=-0.37; kn.add(sock); const sht=new THREE.Mesh(new THREE.CylinderGeometry(0.075*lK,0.07*lK,0.12,8),mP); sht.position.y=-0.02; kn.add(sht); }
    const shoe=new THREE.Mesh(new THREE.BoxGeometry(0.25,0.09,0.11),mF); shoe.position.set(0.05,-0.43,0); kn.add(shoe); return {hg,kn}; }
  const R={root,body,torso,headG,aL:arm(-1),aR:arm(1),lL:leg(-1),lR:leg(1)};
  const club=new THREE.Group(); const shaft=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,1.0,6),M('#cfd3d6')); shaft.position.y=-0.5; club.add(shaft);
  const chd=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.05,0.07),M('#2b2f33')); chd.position.set(0.04,-1.0,0); club.add(chd); club.position.y=-0.3; R.aR.el.add(club); club.visible=false; R.club=club;
  if(sk.H||sk.W) root.scale.set(sk.W||1,sk.H||1,sk.W||1);
  root.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  return R;
}
function poseRig(R,st,t,k){
  R.body.rotation.set(0,0,0); R.body.position.set(0,0.95,0); R.torso.rotation.set(0,0,0); R.headG.rotation.set(0,0,0);
  for(const a of [R.aL,R.aR]){ a.sg.rotation.set(0,0,0); a.el.rotation.set(0,0,0); }
  for(const l of [R.lL,R.lR]){ l.hg.rotation.set(0,0,0); l.kn.rotation.set(0,0,0); }
  const sn=Math.sin(t);
  if(st==='idle'){ R.torso.rotation.z=Math.sin(t*0.4)*0.02; R.aL.sg.rotation.x=0.09; R.aR.sg.rotation.x=-0.09; R.aL.el.rotation.z=0.15; R.aR.el.rotation.z=0.15; R.body.position.y=0.95+Math.sin(t*0.8)*0.006; }
  else if(st==='run'){ const amp=0.3+0.6*k; R.lL.hg.rotation.z=sn*amp; R.lR.hg.rotation.z=-sn*amp; R.lL.kn.rotation.z=-Math.max(0,-Math.cos(t))*1.2*k-0.08; R.lR.kn.rotation.z=-Math.max(0,Math.cos(t))*1.2*k-0.08;
    R.aL.sg.rotation.z=-sn*amp*0.9; R.aR.sg.rotation.z=sn*amp*0.9; R.aL.el.rotation.z=0.35+0.6*k; R.aR.el.rotation.z=0.35+0.6*k; R.aL.sg.rotation.x=0.1; R.aR.sg.rotation.x=-0.1;
    R.torso.rotation.z=-0.14*k; R.body.position.y=0.95+Math.abs(Math.cos(t))*0.06*k; }
  else if(st==='air'){ R.lL.hg.rotation.z=0.6; R.lR.hg.rotation.z=0.2; R.lL.kn.rotation.z=-1.0; R.lR.kn.rotation.z=-0.6; R.aL.sg.rotation.z=0.5; R.aR.sg.rotation.z=0.5; R.aL.sg.rotation.x=0.7; R.aR.sg.rotation.x=-0.7; }
  else if(st==='fall'){ R.body.rotation.z=-1.35; R.body.position.y=1.0; R.aL.sg.rotation.x=1.35; R.aR.sg.rotation.x=-1.35; R.aL.el.rotation.x=0.6; R.aR.el.rotation.x=-0.6; R.aL.sg.rotation.z=0.5+Math.sin(t*6)*0.05; R.aR.sg.rotation.z=0.5-Math.sin(t*6)*0.05;
    R.lL.hg.rotation.x=0.35; R.lR.hg.rotation.x=-0.35; R.lL.kn.rotation.z=-0.8; R.lR.kn.rotation.z=-0.8; R.headG.rotation.z=0.6; }
  else if(st==='glide'){ R.aL.sg.rotation.z=2.75; R.aR.sg.rotation.z=2.75; R.aL.sg.rotation.x=0.3; R.aR.sg.rotation.x=-0.3; R.lL.hg.rotation.z=0.3+Math.sin(t*2)*0.06; R.lR.hg.rotation.z=0.2-Math.sin(t*2)*0.06; R.lL.kn.rotation.z=-0.3; R.lR.kn.rotation.z=-0.3; R.torso.rotation.z=0.05; }
  else if(st==='swim'){ R.body.rotation.z=-1.32; R.body.position.y=0.3; R.aL.sg.rotation.z=t*2; R.aR.sg.rotation.z=t*2+Math.PI; R.lL.hg.rotation.z=Math.sin(t*5)*0.3; R.lR.hg.rotation.z=-Math.sin(t*5)*0.3; R.headG.rotation.z=0.8; }
  else if(st==='tread'){ R.body.position.y=0.25; R.aL.sg.rotation.x=0.9+Math.sin(t*3)*0.25; R.aR.sg.rotation.x=-0.9-Math.sin(t*3)*0.25; R.lL.hg.rotation.z=Math.sin(t*3)*0.35; R.lR.hg.rotation.z=-Math.sin(t*3)*0.35; R.lL.kn.rotation.z=-0.5; R.lR.kn.rotation.z=-0.5; }
  else if(st==='drive'){ R.body.position.y=0.62; R.lL.hg.rotation.z=1.45; R.lR.hg.rotation.z=1.45; R.lL.kn.rotation.z=-1.4; R.lR.kn.rotation.z=-1.4; R.aL.sg.rotation.z=1.0; R.aR.sg.rotation.z=1.0; R.aL.el.rotation.z=0.5; R.aR.el.rotation.z=0.5; R.aL.sg.rotation.x=-0.15; R.aR.sg.rotation.x=0.15; }
  else if(st==='address'||st==='swing'||st==='follow'){
    R.torso.rotation.z=-0.42; R.lL.hg.rotation.z=0.12; R.lR.hg.rotation.z=0.12; R.lL.kn.rotation.z=-0.22; R.lR.kn.rotation.z=-0.22; R.lL.hg.rotation.x=0.12; R.lR.hg.rotation.x=-0.12;
    let ang=0.32, turn=0;
    if(st==='swing'){ ang=0.32-2.5*k; turn=-1.25*k; }
    if(st==='follow'){ const f=clamp(k,0,1); ang=-2.18+5.0*f; turn=-1.25+2.6*f; if(ang>2.6) ang=2.6; }
    R.torso.rotation.y=turn*0.8; R.headG.rotation.y=-turn*0.6;
    R.aL.sg.rotation.z=ang; R.aR.sg.rotation.z=ang; R.aL.sg.rotation.x=-0.28; R.aR.sg.rotation.x=0.28; R.aL.el.rotation.z=0.05; R.aR.el.rotation.z=0.25;
  }
  else if(st==='cheer'){ R.aL.sg.rotation.z=2.9+Math.sin(t*8)*0.15; R.aR.sg.rotation.z=2.9-Math.sin(t*8)*0.15; R.aL.sg.rotation.x=0.35; R.aR.sg.rotation.x=-0.35; R.body.position.y=0.95+Math.abs(Math.sin(t*6))*0.15; }
}

/* ================= vehicles: plane, glider, buggies ================= */
function makePlane(){
  const g=new THREE.Group(); const M=c=>new THREE.MeshLambertMaterial({color:Cc(c)});
  const yel=M('#f2c230'), red=M('#d6442a'), wht=M('#f6f4ee'), gls=M('#3e5462');
  const fus=new THREE.Mesh(new THREE.BoxGeometry(11,2.2,2.2),yel); g.add(fus);
  const nose=new THREE.Mesh(new THREE.CylinderGeometry(0.7,1.1,1.4,10),yel); nose.rotation.z=-Math.PI/2; nose.position.x=6.2; g.add(nose);
  const cab=new THREE.Mesh(new THREE.BoxGeometry(2.6,0.9,2.0),gls); cab.position.set(3,1.3,0); g.add(cab);
  const wing=new THREE.Mesh(new THREE.BoxGeometry(3,0.3,19),red); wing.position.set(2.2,1.9,0); g.add(wing);
  const fin=new THREE.Mesh(new THREE.BoxGeometry(2.2,2.8,0.25),red); fin.position.set(-5.2,2.2,0); g.add(fin);
  const stab=new THREE.Mesh(new THREE.BoxGeometry(1.8,0.22,6.5),red); stab.position.set(-5.3,0.9,0); g.add(stab);
  for(const s of [-1,1]){ const fl=new THREE.Mesh(new THREE.BoxGeometry(8,0.8,0.8),wht); fl.position.set(1.2,-2.6,s*2.4); g.add(fl); const st=new THREE.Mesh(new THREE.BoxGeometry(0.2,1.6,0.2),wht); st.position.set(1.5,-1.6,s*2.0); g.add(st); }
  const prop=new THREE.Group(); prop.position.x=7; for(const r of [0,Math.PI/2]){ const b=new THREE.Mesh(new THREE.BoxGeometry(0.12,4.4,0.32),M('#2b2f33')); b.rotation.x=r; prop.add(b); } g.add(prop); g.userData.prop=prop;
  g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); g.visible=false; scene.add(g); return g;
}
function makeGlider(){
  const g=new THREE.Group(); const cols=['#2a6f87','#f6f4ee','#d6442a','#f6f4ee','#2a6f87','#f6f4ee','#d6442a'];
  for(let i=0;i<7;i++){ const a=(i-3)*0.19; const seg=new THREE.Mesh(new THREE.BoxGeometry(1.5,0.14,1.25),new THREE.MeshLambertMaterial({color:Cc(cols[i]),side:THREE.DoubleSide}));
    seg.position.set(0,Math.cos(a)*3.4-3.4,Math.sin(a)*3.4); seg.rotation.x=a; g.add(seg); }
  const pts=[]; for(const s of [-1,1]) for(const z of [0.6,1.8,3.0]){ const a=Math.asin(Math.min(1,z/3.4)); pts.push(0,Math.cos(a)*3.4-3.45,s*z, 0.05,-2.35,s*0.18); }
  const lg=new THREE.BufferGeometry(); lg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3)); g.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0x444444})));
  g.position.y=4.25; g.visible=false; g.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); return g;
}
function mergeGroup(group){ group.updateMatrixWorld(true); const pos=[], nor=[], col=[]; const v=new V3(), n=new V3(), nm=new THREE.Matrix3();
  group.traverse(o=>{ if(!o.isMesh) return; const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry; const P=g.attributes.position, N=g.attributes.normal; nm.getNormalMatrix(o.matrixWorld); const c=o.material.color;
    for(let i=0;i<P.count;i++){ v.fromBufferAttribute(P,i).applyMatrix4(o.matrixWorld); n.fromBufferAttribute(N,i).applyMatrix3(nm).normalize(); pos.push(v.x,v.y,v.z); nor.push(n.x,n.y,n.z); col.push(c.r,c.g,c.b); } });
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3)); g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(col,3)); return g; }
let BUGGY_GEO=null, BUGGY_MAT=null;
function makeBuggy(){
  if(!BUGGY_GEO){ const g=new THREE.Group(); const M=c=>new THREE.MeshLambertMaterial({color:Cc(c)});
    const wht=M('#f4f2ec'), blk=M('#222628'), seat=M('#255d3c'), grey=M('#9aa3ab');
    const add=(geo,mat,x,y,z,rx,ry,rz)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.rotation.set(rx||0,ry||0,rz||0); g.add(m); };
    add(new THREE.BoxGeometry(2.5,0.32,1.25),wht,0,0.45,0); add(new THREE.BoxGeometry(0.6,0.55,1.2),wht,1.0,0.7,0); add(new THREE.BoxGeometry(0.6,0.4,1.15),seat,-0.25,0.82,0); add(new THREE.BoxGeometry(0.15,0.55,1.15),seat,-0.6,1.1,0);
    add(new THREE.CylinderGeometry(0.2,0.2,0.9,8),M('#2a6f87'),-1.05,1.05,0.25,0,0,0.25);
    for(const [x,z] of [[0.75,0.55],[0.75,-0.55],[-0.95,0.55],[-0.95,-0.55]]) add(new THREE.BoxGeometry(0.06,1.3,0.06),grey,x,1.35,z);
    add(new THREE.BoxGeometry(2.1,0.08,1.35),wht,-0.1,2.02,0); add(new THREE.TorusGeometry(0.17,0.025,6,16),blk,0.55,1.15,-0.25,0.5,Math.PI/2,0);
    for(const [x,z] of [[0.82,0.62],[0.82,-0.62],[-0.82,0.62],[-0.82,-0.62]]) add(new THREE.CylinderGeometry(0.28,0.28,0.2,12),blk,x,0.28,z,Math.PI/2,0,0);
    BUGGY_GEO=mergeGroup(g); }
  const m=new THREE.Mesh(BUGGY_GEO,BUGGY_MAT||(BUGGY_MAT=FXQ?envMat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.34,metalness:0.12}),1.0):new THREE.MeshLambertMaterial({vertexColors:true}))); m.castShadow=true; m.receiveShadow=true; scene.add(m); return m;
}
const buggies=[];
function placeBuggies(){
  const roads=(W.course.roads||[]).map(r=>r.p);
  const nearRoad=(x,z,maxd)=>{ let best=null; for(const P of roads) for(let i=0;i<P.length-1;i++){ const ax=P[i][0], az=P[i][1], vx=P[i+1][0]-ax, vz=P[i+1][1]-az; const l2=vx*vx+vz*vz||1e-9; const t=clamp(((x-ax)*vx+(z-az)*vz)/l2,0,1); const qx=ax+vx*t, qz=az+vz*t; const d=Math.hypot(qx-x,qz-z); if(d<maxd&&(!best||d<best.d)) best={d,x:qx,z:qz,yaw:Math.atan2(vz,vx)}; } return best; };
  const spots=[];
  const rows=(x,z,n)=>{ const h0=nearRoad(x,z,70); if(h0){ for(let k=0;k<n;k++) spots.push([h0.x+Math.cos(h0.yaw)*k*3.2,h0.z+Math.sin(h0.yaw)*k*3.2,h0.yaw]); } };
  const atTee=i=>{ const H=W.HOLES[i]; if(!H) return; const r=nearRoad(H.tx,H.tz,45); if(r) spots.push([r.x,r.z,r.yaw]); else spots.push([H.tx-10*H.tc+8*H.ts,H.tz-10*H.ts-8*H.tc,H.ta]); };
  WP.buggySpots({rows,atTee,W});
  for(const [x0,z0,yaw] of spots){ let x=x0, z=z0; if(W.terrain(x,z)<W.waterLevel(x,z)+0.2) continue; if(bldAt(x,z,1.6)) continue;
    const g=makeBuggy(); const b={g,x,z,yaw,speed:0,y:W.terrain(x,z)}; buggies.push(b); placeBuggyMesh(b); }
  placeCars();
}
function placeBuggyMesh(b){ if(b.type) return placeCarMesh(b); const c=Math.cos(b.yaw), s=Math.sin(b.yaw);
  const hF=groundAt(b.x+c*0.85,b.z+s*0.85,b.y+1.5), hB=groundAt(b.x-c*0.85,b.z-s*0.85,b.y+1.5), hL=groundAt(b.x-s*0.6,b.z+c*0.6,b.y+1.5), hR=groundAt(b.x+s*0.6,b.z-c*0.6,b.y+1.5);
  b.y=(hF+hB+hL+hR)/4; b.g.position.set(b.x,b.y,b.z); b.g.rotation.order='YXZ'; b.g.rotation.set(0,0,0);
  b.g.rotation.y=-b.yaw; b.g.rotation.z=Math.atan2(hF-hB,1.7); }

/* ================= collisions: real building outlines, piers, trees ================= */
function terrainAt(x,z){ const p=W.poolAt(x,z); return p?p.level-1.6:W.terrain(x,z); }
function bldsNear(x,z){ return W.bgrid.get(Math.floor(x/W.BCELL)+','+Math.floor(z/W.BCELL))||[]; }
function inBld(b,x,z){ if(!b.ring||x<b.x0||x>b.x1||z<b.z0||z>b.z1) return false; if(!W.pointInPoly(x,z,b.ring)) return false; for(const h of b.holesO) if(W.pointInPoly(x,z,h)) return false; return true; }
function nearestEdge(b,x,z){ let best=[1e9,x,z,1,0]; const test=r=>{ for(let i=0,j=r.length-1;i<r.length;j=i++){ const ax=r[j][0], az=r[j][1], vx=r[i][0]-ax, vz=r[i][1]-az; const l2=vx*vx+vz*vz; if(l2<1e-6) continue; const t=clamp(((x-ax)*vx+(z-az)*vz)/l2,0,1); const qx=ax+vx*t, qz=az+vz*t; const d=Math.hypot(x-qx,z-qz); if(d<best[0]){ const L=Math.sqrt(l2); best=[d,qx,qz,vz/L,-vx/L]; } } }; test(b.ring); for(const h of b.holesO) test(h); return best; }
function bldAt(x,z,m){ for(const b of bldsNear(x,z)){ if(!b.solid) continue; if(inBld(b,x,z)) return b; if(m&&x>b.x0-m&&x<b.x1+m&&z>b.z0-m&&z<b.z1+m&&nearestEdge(b,x,z)[0]<m) return b; } return null; }
function groundAt(x,z,y){
  if(S.interior&&inBld(S.interior.b,x,z)){ let g=S.interior.floor; for(const p of platsNear(x,z)){ if(p.top>g&&p.top<=y+0.7&&insidePlat(p,x,z,0.05)) g=p.top; } return g; }
  let g=terrainAt(x,z);
  for(const b of bldsNear(x,z)){ const wy=b.walkY; if(wy===undefined||wy<=g||wy>y+0.7) continue; if(inBld(b,x,z)) g=wy; }
  for(const p of platsNear(x,z)){ if(p.top>g&&p.top<=y+0.7&&insidePlat(p,x,z,0.05)) g=p.top; }
  return g; }
function collide(x,z,y,r,swim){
  let stepTop=-1e9;
  for(let pass=0;pass<2;pass++){
    if(S.interior){ const ib=S.interior.b; const inside=inBld(ib,x,z); const e=nearestEdge(ib,x,z); if(!inside){ x=e[1]-e[3]*(r+0.01); z=e[2]-e[4]*(r+0.01); } else if(e[0]<r){ x=e[1]-e[3]*r; z=e[2]-e[4]*r; } }
    for(const b of bldsNear(x,z)){
      if(!b.solid||b===(S.interior&&S.interior.b)||y>=b.top-0.05||y+1.7<=b.base) continue;
      if(x<b.x0-r||x>b.x1+r||z<b.z0-r||z>b.z1+r) continue;
      const inside=inBld(b,x,z); const e=nearestEdge(b,x,z);
      if(!inside&&e[0]>=r) continue;
      if(b.walkY>y&&b.walkY-y<0.62){ stepTop=Math.max(stepTop,b.walkY); continue; }
      x=e[1]+e[3]*(r+0.01); z=e[2]+e[4]*(r+0.01);
    }
    for(const p of platsNear(x,z)){
      if(y>=p.top-0.02||y+1.7<=p.bot) continue;
      const dx=x-p.x, dz=z-p.z; let lx=dx*p.c+dz*p.s, lz=-dx*p.s+dz*p.c; const hx=p.sx/2+r, hz=p.sz/2+r;
      if(Math.abs(lx)<hx&&Math.abs(lz)<hz){
        if(!p.nostep&&(p.top-y<0.62||(swim&&p.top<2.2))){ stepTop=Math.max(stepTop,p.top); continue; }
        const qx=hx-Math.abs(lx), qz=hz-Math.abs(lz); if(qx<qz) lx=Math.sign(lx||1)*hx; else lz=Math.sign(lz||1)*hz;
        x=p.x+lx*p.c-lz*p.s; z=p.z+lx*p.s+lz*p.c; }
    }
  }
  const trees=treeGrid.get(Math.floor(x/20)+','+Math.floor(z/20));
  if(trees) for(const t of trees){ const dx=x-t.x, dz=z-t.z, d=Math.hypot(dx,dz), m=r+t.tr; if(d<m&&d>1e-4&&y<t.cy){ x=t.x+dx/d*m; z=t.z+dz/d*m; } }
  return [x,z,stepTop];
}

/* ================= golf physics ================= */
const GRAV=9.81, KD=0.0032;
const SURF={
  1:{n:'Rough',e:.15,mu:.5,c:.75,sp:.85,err:1.8}, 2:{n:'Semi-rough',e:.2,mu:.42,c:.48,sp:.94,err:1.3}, 3:{n:'Calle',e:.22,mu:.4,c:.34,sp:1,err:1},
  4:{n:'Antegreen',e:.22,mu:.3,c:.16,sp:1,err:.9}, 5:{n:'Green',e:.16,mu:.2,c:.068,sp:1,err:1}, 6:{n:'Tee',e:.22,mu:.4,c:.34,sp:1,err:1},
  7:{n:'Búnker',e:.04,mu:.85,c:1.2,sp:.75,err:2}, 8:{n:'Camino',e:.45,mu:.2,c:.12,sp:.95,err:1.2}, 9:{n:'Playa',e:.05,mu:.85,c:1.1,sp:.75,err:2},
  10:{n:'Jardín',e:.2,mu:.42,c:.48,sp:.94,err:1.3}, 0:{n:'Orilla',e:.15,mu:.55,c:.8,sp:.8,err:1.9}
};
const CLUBS=[
  {n:'Driver',c:225,loft:16,err:2.2},{n:'Madera 3',c:205,loft:18,err:2.0},{n:'Híbrido',c:185,loft:21,err:1.8},{n:'Hierro 5',c:165,loft:23,err:1.6},
  {n:'Hierro 7',c:145,loft:27,err:1.4},{n:'Hierro 9',c:122,loft:33,err:1.2},{n:'Pitching',c:102,loft:39,err:1.1},{n:'Sand wedge',c:78,loft:48,err:1.1},
  {n:'Putter',c:30,loft:0,err:0.5,putt:true}];
const PUTT_VMAX=Math.sqrt(2*0.062*GRAV*30);
(function(){ for(const cl of CLUBS){ if(cl.putt){ cl.v0=PUTT_VMAX; continue; }
  let lo=10, hi=140; for(let it=0;it<40;it++){ const v=(lo+hi)/2; const a=cl.loft*Math.PI/180; let x=0,y=0,vx=v*Math.cos(a),vy=v*Math.sin(a),dt=1/120;
    for(let s=0;s<3000;s++){ const sp=Math.hypot(vx,vy); vx+=-KD*sp*vx*dt; vy+=(-GRAV-KD*sp*vy)*dt; x+=vx*dt; y+=vy*dt; if(y<0&&vy<0) break; }
    if(x<cl.c) lo=v; else hi=v; } cl.v0=(lo+hi)/2; } })();
function normalAt(x,z,h){ const e=0.5; const hx=(W.terrain(x+e,z)-h)/e, hz=(W.terrain(x,z+e)-h)/e; const l=Math.hypot(hx,1,hz); return [-hx/l,1/l,-hz/l]; }
function treeHit(s){ const arr=treeGrid.get(Math.floor(s.x/20)+','+Math.floor(s.z/20)); if(!arr) return false;
  for(const t of arr){ const dx=(s.x-t.x)/t.r, dy=(s.y-t.cy)/t.ry, dz=(s.z-t.z)/t.r; if(dx*dx+dy*dy+dz*dz<1) return true; } return false; }
function ballBld(s){ for(const b of bldsNear(s.x,s.z)){ if(b.top===undefined||s.y>=b.top||s.y<b.base) continue; if(!b.solid&&s.y<b.top-0.6) continue; if(inBld(b,s.x,s.z)) return b; } return null; }
function newSim(p,v,roll,opts){ return {x:p.x,y:p.y,z:p.z,vx:v.x,vy:v.y,vz:v.z,mode:roll?'roll':'air',t:0,b:0,land:null,done:null,spin:opts.spin||0,trees:!!opts.trees,cup:opts.cup,treeHits:0,wallHits:0,lip:false,apex:p.y}; }
function simStep(s,dt,wind){
  s.t+=dt;
  if(s.mode==='air'){
    const rx=s.vx-wind.x, ry=s.vy, rz=s.vz-wind.z; const sp=Math.sqrt(rx*rx+ry*ry+rz*rz);
    s.vx+=-KD*sp*rx*dt; s.vy+=(-GRAV-KD*sp*ry)*dt; s.vz+=-KD*sp*rz*dt;
    const py=s.y; s.x+=s.vx*dt; s.y+=s.vy*dt; s.z+=s.vz*dt; if(s.y>s.apex) s.apex=s.y;
    if(Math.abs(s.x)>2500||Math.abs(s.z)>2500){ s.done='water'; return; }
    const bb=ballBld(s);
    if(bb){ if(py>=bb.top-0.2){ s.done='roof'; s.roofB=bb; return; }
      if(bb.solid){ const e=nearestEdge(bb,s.x,s.z); const vn=s.vx*e[3]+s.vz*e[4]; if(vn<0){ s.vx-=2*vn*e[3]; s.vz-=2*vn*e[4]; } s.vx*=0.35; s.vz*=0.35; s.vy*=0.5; s.x=e[1]+e[3]*0.3; s.z=e[2]+e[4]*0.3; s.wallHits++; } }
    const hg=W.terrain(s.x,s.z); const wl=W.waterLevel(s.x,s.z);
    if(s.trees && s.y<hg+24 && s.treeHits<3 && treeHit(s)){ s.treeHits++; s.vx*=0.3; s.vz*=0.3; s.vy=Math.min(s.vy*0.3,0)-1; s.vx+=(Math.random()-.5)*4; s.vz+=(Math.random()-.5)*4; }
    if(s.y<=Math.max(hg,wl)){
      if(hg<wl+0.02){ s.done='water'; return; }
      const n=normalAt(s.x,s.z,hg); const sc=W.surfAt(s.x,s.z); const P=SURF[sc]||SURF[1];
      if(!s.land) s.land={x:s.x,z:s.z};
      const vn=s.vx*n[0]+s.vy*n[1]+s.vz*n[2];
      if(vn<0){ let tx=s.vx-vn*n[0], ty=s.vy-vn*n[1], tz=s.vz-vn*n[2]; const chk=(sc===5||sc===4)?(s.b===0?0.32:s.b===1?0.18:0.06):0; const mu=Math.min(0.95,P.mu+chk+(s.b===0?s.spin:s.b===1?s.spin*0.5:0)); tx*=1-mu; ty*=1-mu; tz*=1-mu; const nb=-vn*P.e;
        s.vx=tx+nb*n[0]; s.vy=ty+nb*n[1]; s.vz=tz+nb*n[2]; s.y=hg+0.002; s.b++; if(nb<1.3||s.b>7){ s.mode='roll'; s.vx=tx; s.vy=ty; s.vz=tz; } }
    }
    return;
  }
  const hg=W.terrain(s.x,s.z); if(hg<W.waterLevel(s.x,s.z)+0.02){ s.done='water'; return; }
  const n=normalAt(s.x,s.z,hg); const P=SURF[W.surfAt(s.x,s.z)]||SURF[1];
  const vn=s.vx*n[0]+s.vy*n[1]+s.vz*n[2]; s.vx-=vn*n[0]; s.vy-=vn*n[1]; s.vz-=vn*n[2];
  const gx=GRAV*n[1]*n[0], gy=-GRAV+GRAV*n[1]*n[1], gz=GRAV*n[1]*n[2]; const gt=Math.hypot(gx,gy,gz); const fr=P.c*GRAV*n[1];
  const sp=Math.hypot(s.vx,s.vy,s.vz);
  if(sp>0.04){ const ux=s.vx/sp, uy=s.vy/sp, uz=s.vz/sp; let nx=s.vx+(gx-ux*fr)*dt, ny=s.vy+(gy-uy*fr)*dt, nz=s.vz+(gz-uz*fr)*dt; if(nx*ux+ny*uy+nz*uz<=0 && gt<fr){ nx=ny=nz=0; } s.vx=nx; s.vy=ny; s.vz=nz; }
  else { if(gt>fr*1.15){ s.vx+=gx*dt; s.vy+=gy*dt; s.vz+=gz*dt; } else { s.vx=s.vy=s.vz=0; s.done='stop'; } }
  s.x+=s.vx*dt; s.z+=s.vz*dt; s.y=W.terrain(s.x,s.z);
  { const bb=bldAt(s.x,s.z,0); if(bb){ const e=nearestEdge(bb,s.x,s.z); const vn2=s.vx*e[3]+s.vz*e[4]; if(vn2<0){ s.vx-=2*vn2*e[3]; s.vz-=2*vn2*e[4]; } s.vx*=0.4; s.vz*=0.4; s.x=e[1]+e[3]*0.2; s.z=e[2]+e[4]*0.2; s.y=W.terrain(s.x,s.z); } }
  if(s.cup){ const d=Math.hypot(s.x-s.cup[0],s.z-s.cup[1]); const v=Math.hypot(s.vx,s.vz);
    if(d<0.14){ if(v<1.7){ s.done='holed'; s.x=s.cup[0]; s.z=s.cup[1]; return; } else if(!s.lip){ s.lip=true; const a=(Math.random()<.5?1:-1)*0.35; const c=Math.cos(a), sn=Math.sin(a); const vx=s.vx*c-s.vz*sn, vz=s.vx*sn+s.vz*c; s.vx=vx*0.75; s.vz=vz*0.75; } } }
  if(s.t>40) s.done='stop';
}
function gauss(){ let u=0,v=0; while(!u)u=Math.random(); while(!v)v=Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }

/* ================= game state ================= */
const S={mode:'loading',skin:+(store.get('vg_skin')||0)%SKINS.length,name:store.get('vg_name')||'',gold:new Set(),marker:null,overlay:false,plane:null,course:Math.max(0,+(store.get(WP.key+'_course')||0)|0),
  g:{hole:-1,cur:0,ball:new V3(),last:new V3(),lie:6,yaw:0,club:0,power:1,swingT:0,wind:{x:0,z:0,sp:0,a:0},overview:false,sim:null,waitT:0,after:'',scores:[],flightStart:new V3(),ballVisible:false,next:0,carryPrev:0}};
const P={x:0,y:0,z:0,vx:0,vy:0,vz:0,yaw:0,onGround:false,swim:false,sprint:false,sprintLock:false,animT:0,state:'idle',buggy:null,stickHold:0,landT:0,cheerT:0,followT:0};
const camS={yaw:0,pitch:0.3,dist:5.4,lastLook:0,pos:new V3(),look:new V3()};
const inp={mx:0,my:0,jumpQ:false,keys:{},lookDX:0,lookDY:0};
let rig=null, glider=null, plane=null;
function setSkin(i,av){ S.skin=i; store.set('vg_skin',String(i)); if(!av){ S.av=null; store.set(WP.key+'_av',''); } const vis=rig?rig.root.visible:false; if(rig){ scene.remove(rig.root); } rig=buildRig(av?avSkin(av):SKINS[i]); scene.add(rig.root); glider=makeGlider(); rig.root.add(glider); rig.root.visible=vis&&S.mode!=='menu'; mpHello(); }

/* audio */
let AC=null, windNode=null, windGain=null, master=null, waterGain=null, cricketGain=null, noiseBuf=null;
let SOUND=store.get('vg_snd')!=='0';
function ensureAudio(){ if(AC) return; try{ AC=new (window.AudioContext||window.webkitAudioContext)();
  master=AC.createGain(); master.gain.value=SOUND?1:0; master.connect(AC.destination);
  const len=AC.sampleRate*2; noiseBuf=AC.createBuffer(1,len,AC.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<len;i++) d[i]=Math.random()*2-1;
  windNode=AC.createBufferSource(); windNode.buffer=noiseBuf; windNode.loop=true; const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=600; windGain=AC.createGain(); windGain.gain.value=0;
  windNode.connect(f); f.connect(windGain); windGain.connect(master); windNode.start();
  // water lapping on the shore: band-passed noise, swelled from the game loop
  const wn=AC.createBufferSource(); wn.buffer=noiseBuf; wn.loop=true; wn.playbackRate.value=0.7; const wf=AC.createBiquadFilter(); wf.type='bandpass'; wf.frequency.value=520; wf.Q.value=0.7;
  waterGain=AC.createGain(); waterGain.gain.value=0; wn.connect(wf); wf.connect(waterGain); waterGain.connect(master); wn.start();
  // crickets at night: a high tone chopped by a fast LFO
  const co=AC.createOscillator(); co.type='triangle'; co.frequency.value=4350; const cg=AC.createGain(); cg.gain.value=0; const lfo=AC.createOscillator(); lfo.frequency.value=24; const ld=AC.createGain(); ld.gain.value=0.5;
  lfo.connect(ld); ld.connect(cg.gain); co.connect(cg); cricketGain=AC.createGain(); cricketGain.gain.value=0; cg.connect(cricketGain); cricketGain.connect(master); co.start(); lfo.start();
  }catch(e){ AC=null; } }
function setSound(on){ SOUND=on; store.set('vg_snd',on?'1':'0'); if(master&&AC) master.gain.setTargetAtTime(on?1:0,AC.currentTime,0.05); document.querySelectorAll('#sndOn,#sndOff').forEach(b=>b.classList.toggle('on',(b.id==='sndOn')===on)); const mb=$('mSound'); if(mb) mb.textContent='Sonido: '+(on?'sí':'no'); }
function blip(type){ if(!AC) return; const t=AC.currentTime; const o=AC.createOscillator(), g=AC.createGain(); o.connect(g); g.connect(master);
  if(type==='hit'){ o.type='triangle'; o.frequency.setValueAtTime(900,t); o.frequency.exponentialRampToValueAtTime(220,t+0.08); g.gain.setValueAtTime(0.25,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.12); o.start(t); o.stop(t+0.13); }
  else if(type==='cup'||type==='gold'){ o.type='sine'; o.frequency.setValueAtTime(type==='gold'?880:660,t); o.frequency.setValueAtTime(type==='gold'?1320:990,t+0.09); g.gain.setValueAtTime(0.18,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.4); o.start(t); o.stop(t+0.42); }
  else if(type==='jump'){ o.type='sine'; o.frequency.setValueAtTime(320,t); o.frequency.exponentialRampToValueAtTime(520,t+0.1); g.gain.setValueAtTime(0.06,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.14); o.start(t); o.stop(t+0.15); }
  else if(type==='door'){ o.type='square'; o.frequency.setValueAtTime(180,t); o.frequency.exponentialRampToValueAtTime(90,t+0.12); g.gain.setValueAtTime(0.05,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.16); o.start(t); o.stop(t+0.17); }
  else { o.type='sawtooth'; o.frequency.setValueAtTime(240,t); o.frequency.exponentialRampToValueAtTime(60,t+0.3); g.gain.setValueAtTime(0.08,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.36); o.start(t); o.stop(t+0.36); } }
function chirp(vol){ if(!AC||!SOUND) return; const t=AC.currentTime; const n=2+(Math.random()*3|0); const base=2600+Math.random()*1800; const pan=AC.createStereoPanner?AC.createStereoPanner():null; if(pan){ pan.pan.value=Math.random()*1.6-0.8; pan.connect(master); }
  for(let k=0;k<n;k++){ const o=AC.createOscillator(), g=AC.createGain(); o.type='sine'; const t0=t+k*0.11; o.frequency.setValueAtTime(base,t0); o.frequency.exponentialRampToValueAtTime(base*1.45,t0+0.05); o.frequency.exponentialRampToValueAtTime(base*0.9,t0+0.08);
    g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(0.025*vol,t0+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t0+0.09); o.connect(g); g.connect(pan||master); o.start(t0); o.stop(t0+0.1); } }
function craneCall(vol){ if(!AC||!SOUND) return; const t=AC.currentTime; for(let k=0;k<2;k++){ const t0=t+k*0.32; const o=AC.createOscillator(), f=AC.createBiquadFilter(), g=AC.createGain(); o.type='sawtooth'; o.frequency.setValueAtTime(k?505:470,t0); o.frequency.linearRampToValueAtTime(k?470:455,t0+0.22);
  f.type='bandpass'; f.frequency.value=1100; f.Q.value=3; g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(0.05*vol,t0+0.03); g.gain.exponentialRampToValueAtTime(0.0001,t0+0.26); o.connect(f); f.connect(g); g.connect(master); o.start(t0); o.stop(t0+0.28); } }
let ambT=0;
function updateAmbient(dt){ if(!AC) return; ambT+=dt; if(ambT<0.2) return; const step=ambT; ambT=0; const t=AC.currentTime;
  const x=camera.position.x, z=camera.position.z; let wet=0; for(let k=0;k<8;k++){ const a=k/8*Math.PI*2, qx=x+Math.cos(a)*18, qz=z+Math.sin(a)*18; if(W.terrain(qx,qz)<W.waterLevel(qx,qz)) wet++; }
  const shore=(wet>0&&wet<8)?1:(wet===8?0.35:0); const near=camera.position.y-Math.max(W.terrain(x,z),W.waterLevel(x,z))<25?1:0.2;
  if(waterGain) waterGain.gain.setTargetAtTime(SOUND?0.09*shore*near*(0.7+0.3*Math.sin(T*0.8)):0,t,0.4);
  const night=TOD.night; if(cricketGain) cricketGain.gain.setTargetAtTime(SOUND?0.012*night*near*(S.interior?0.3:1):0,t,0.5);
  if(!S.interior&&night<0.5&&near>0.5&&Math.random()<step*0.5) chirp(1-night);
  for(const fl of birds){ const d=Math.hypot(fl.pos[0]-x,fl.pos[1]-camera.position.y,fl.pos[2]-z); if(d<900&&Math.random()<step*0.35) craneCall(Math.max(0.15,1-d/900)); } }
function setWind(v){ if(windGain&&AC) windGain.gain.setTargetAtTime(v,AC.currentTime,0.2); }

/* ================= golden balls at real places ================= */
const GOLD=[];
function buildGold(){
  const spots=[]; const add=(x,y,z,hint)=>{ if(isFinite(x)&&isFinite(y)&&isFinite(z)) spots.push({x,y,z,hint}); };
  const T=(x,z)=>W.terrain(x,z);
  WP.goldSpots({add,T,W,BLD,PIER,ruinTop,insideGoldSpot,spots});
  const list=spots.slice(0,12);
  GOLDI.balls=new THREE.InstancedMesh(new THREE.SphereGeometry(0.5,24,16),FXQ?envMat(new THREE.MeshStandardMaterial({color:Cc('#f4c64a'),metalness:1.0,roughness:0.22,emissive:Cc('#3a2a00')}),1.6):new THREE.MeshLambertMaterial({color:Cc('#f2c230'),emissive:Cc('#7a5a00')}),list.length);
  GOLDI.beams=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.35,0.35,60,8,1,true),new THREE.MeshBasicMaterial({color:0xffd34d,transparent:true,opacity:0.18,depthWrite:false}),list.length);
  GOLDI.balls.castShadow=true; GOLDI.balls.frustumCulled=false; GOLDI.beams.frustumCulled=false; scene.add(GOLDI.balls); scene.add(GOLDI.beams);
  list.forEach((s,i)=>GOLD.push({i,...s,taken:false}));
  try{ const saved=JSON.parse(store.get(WP.key+'_gold4')||'[]'); for(const i of saved){ const g=GOLD[i]; if(g){ g.taken=true; S.gold.add(i); } } }catch(e){}
  updateGoldMeshes(0);
}
const GOLDI={balls:null,beams:null}; const _gm=new THREE.Object3D();
function updateGoldMeshes(T){ if(!GOLDI.balls) return; for(const o of GOLD){ const s=o.taken?0.0001:1; _gm.position.set(o.x,o.y+Math.sin(T*2+o.i)*0.2,o.z); _gm.rotation.set(0,T+o.i,0); _gm.scale.set(s,s,s); _gm.updateMatrix(); GOLDI.balls.setMatrixAt(o.i,_gm.matrix);
    _gm.position.set(o.x,o.y+30,o.z); _gm.rotation.set(0,0,0); _gm.updateMatrix(); GOLDI.beams.setMatrixAt(o.i,_gm.matrix); }
  GOLDI.balls.instanceMatrix.needsUpdate=true; GOLDI.beams.instanceMatrix.needsUpdate=true; }

/* ================= visual helpers ================= */
const ballMesh=new THREE.Mesh(new THREE.SphereGeometry(0.22,18,12),new THREE.MeshLambertMaterial({color:Cc('#ffffff'),emissive:Cc('#3a3a3a')}));
ballMesh.castShadow=true; ballMesh.visible=false; scene.add(ballMesh);
const TRAIL_N=240; const trailGeo=new THREE.BufferGeometry(); trailGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(TRAIL_N*3),3)); trailGeo.setDrawRange(0,0);
const trail=new THREE.Line(trailGeo,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.85})); trail.frustumCulled=false; scene.add(trail);
const ringMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.9,depthTest:false});
const aimRing=new THREE.Mesh(new THREE.RingGeometry(1.5,2.2,48).rotateX(-Math.PI/2),ringMat); aimRing.renderOrder=5; aimRing.visible=false; scene.add(aimRing);
const aimDot=new THREE.Mesh(new THREE.CircleGeometry(0.45,20).rotateX(-Math.PI/2),ringMat); aimDot.renderOrder=5; aimDot.visible=false; scene.add(aimDot);
const PREV_N=400; const prevGeo=new THREE.BufferGeometry(); prevGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(PREV_N*3),3)); prevGeo.setDrawRange(0,0);
const prevLine=new THREE.Line(prevGeo,new THREE.LineDashedMaterial({color:0xffffff,dashSize:2,gapSize:1.4,transparent:true,opacity:0.8,depthTest:false})); prevLine.renderOrder=4; prevLine.frustumCulled=false; prevLine.visible=false; scene.add(prevLine);
const splashGeo=new THREE.BufferGeometry(); splashGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(60*3),3));
const splash=new THREE.Points(splashGeo,new THREE.PointsMaterial({color:0xffffff,size:0.6,transparent:true,opacity:0})); splash.frustumCulled=false; scene.add(splash);
let splashV=null, splashT=0;
function startSplash(x,z,y){ const a=splashGeo.attributes.position.array; splashV=[]; for(let i=0;i<60;i++){ a[i*3]=x; a[i*3+1]=(y||0)+0.1; a[i*3+2]=z; splashV.push([(Math.random()-.5)*3,3+Math.random()*5,(Math.random()-.5)*3]); } splashGeo.attributes.position.needsUpdate=true; splashT=1.3; splash.material.opacity=0.9; splash.userData.y0=(y||0); }
function beamMesh(color){ const m=new THREE.Mesh(new THREE.CylinderGeometry(0.4,0.4,45,8,1,true),new THREE.MeshBasicMaterial({color,transparent:true,opacity:0.28,depthWrite:false})); m.visible=false; scene.add(m); return m; }
const ballBeam=beamMesh(0xffffff), teeBeam=beamMesh(0x4aa3ff), markBeam=beamMesh(0xff7a3d);

/* ================= mode helpers ================= */
function hole(){ return W.HOLES[S.g.hole]; }
function distToPin(){ const H=hole(); return H?Math.hypot(S.g.ball.x-H.pin[0],S.g.ball.z-H.pin[1]):0; }
function dirV(){ return new V3(Math.cos(S.g.yaw),0,Math.sin(S.g.yaw)); }
function setMode(m){ S.mode=m; refreshHUD(); }
function courseOf(H){ return W.COURSES[H?H.course:S.course]||W.COURSES[0]; }
function holeLabel(H,short){ return (short?'':'Hoyo ')+H.n+(W.MULTI?' · '+courseOf(H).short:''); }
// the next hole without a score in the current course, after the hole with global index 'from' (-1: from the first)
function nextUnplayed(from){ const C=W.COURSES[S.course]||W.COURSES[0], hs=C.holes; let k0=hs.indexOf(from); if(k0<0) k0=-1;
  for(let k=1;k<=hs.length;k++){ const i=hs[(k0+k)%hs.length]; if(!S.g.scores[i]) return i; } return -1; }
function playedIn(C){ return (C||W.COURSES[S.course]||W.COURSES[0]).holes.filter(i=>S.g.scores[i]).length; }
function clearCard(){ const C=W.COURSES[S.course]||W.COURSES[0]; for(const i of C.holes) S.g.scores[i]=0; while(S.g.scores.length&&!S.g.scores[S.g.scores.length-1]) S.g.scores.pop(); saveScores(); S.g.next=nextUnplayed(-1); }
function setCourse(k){ if(!W.COURSES[k]) return; S.course=k; store.set(WP.key+'_course',String(k)); if(S.g.hole<0) S.g.next=nextUnplayed(-1); }
const ISLE=WP.center;
function startDrop(o){
  o=o||{}; ensureAudio(); closeModal(); hideMap(); if(S.interior) exitVilla();
  const R=Math.random; const ang=Number.isFinite(o.ang)?o.ang:R()*Math.PI*2; const dx=Math.cos(ang), dz=Math.sin(ang); const off=Number.isFinite(o.off)?o.off:(R()-0.5)*WP.plane.spread;
  const c0=WP.dropCenter?WP.dropCenter(S.course):ISLE; const cx=c0[0]-dz*off, cz=c0[1]+dx*off;
  S.plane={x0:cx-dx*2700, z0:cz-dz*2700, dx, dz, t:o.t||0, speed:58, alt:WP.plane.alt, len:5400};
  plane.visible=true; rig.root.visible=false; glider.visible=false;
  camS.yaw=ang; camS.pitch=0.28;
  if(P.buggy){ const b=P.buggy; P.buggy=null; mpBuggyParked(b); }
  setMode('plane'); toast('¡A la avioneta!','Pulsa SALTAR cuando estés sobre donde quieras caer');
}
function planePos(){ const p=S.plane; const d=p.t*p.speed; return [p.x0+p.dx*d, p.alt, p.z0+p.dz*d]; }
function jumpFromPlane(){ S.snap=true; const [x,y,z]=planePos(); P.x=x-S.plane.dx*6; P.y=y-4; P.z=z-S.plane.dz*6; P.vx=S.plane.dx*12; P.vz=S.plane.dz*12; P.vy=-5; P.yaw=Math.atan2(S.plane.dz,S.plane.dx);
  rig.root.visible=true; setMode('fall'); blip('jump'); }
function openGlider(){ glider.visible=true; P.vy=Math.max(P.vy,-8); setMode('glide'); blip('jump'); }
function landNow(){ glider.visible=false; P.landT=0.35; setWind(0); P.vy=0; P.onGround=true;
  setMode('walk'); if(!S.landedOnce){ S.landedOnce=true; toast(WP.T.landed[0],WP.T.landed[1]); } }

/* ================= golf flow ================= */
function autoClub(){ const g=S.g; const d=distToPin(); const lie=g.lie;
  if((lie===5||lie===4) && d<40){ g.club=8; return; } if(lie===5){ g.club=8; return; }
  let pick=0; for(let i=0;i<8;i++){ if(CLUBS[i].c>=d-4) pick=i; } if(g.cur===0 && hole().par>3) pick=0; if(lie===7 && d<95) pick=7; g.club=pick; }
function autoAim(){ const g=S.g, H=hole(); const d=distToPin(); const cl=CLUBS[g.club];
  if(cl.putt || d<=cl.c*1.06){ g.yaw=Math.atan2(H.pin[1]-g.ball.z,H.pin[0]-g.ball.x); return; }
  const s=W.projPoly(H.P,g.ball.x,g.ball.z); const tgt=W.polyAt(H.P,Math.min(H.len,s+cl.c*0.98)); g.yaw=Math.atan2(tgt.z-g.ball.z,tgt.x-g.ball.x); }
function newWind(){ const a=Math.random()*Math.PI*2, sp=Math.random()<0.15?0:0.8+Math.random()*4.8; S.g.wind={x:Math.cos(a)*sp,z:Math.sin(a)*sp,sp,a}; }
function startHole(i){ const g=S.g; g.hole=i; g.cur=0; const H=hole(); if(H.course!==S.course) setCourse(H.course); const to=mpTeeOffset(i); g.ball.set(H.tx+to[0],W.terrain(H.tx+to[0],H.tz+to[1])+0.03,H.tz+to[1]); g.lie=6; g.ballVisible=true; newWind();
  enterAim(true); toast(holeLabel(H),'Par '+H.par+' · '+fmt(H.L)+' m'); mpHoleStarted(i); }
function enterAim(first){ if(S.interior) exitVilla(); const g=S.g; if(!first){ g.lie=W.surfAt(g.ball.x,g.ball.z); if(g.lie>=20) g.lie=1; } autoClub(); autoAim(); g.overview=false; prevKey='';
  if(P.buggy) exitBuggy(); placeAtAddress(); setMode('aim'); snapAimCamera(); }
function placeAtAddress(){ const g=S.g; const face=g.yaw+Math.PI/2; P.yaw=face; const fx=Math.cos(face), fz=Math.sin(face);
  P.x=g.ball.x-fx*0.8; P.z=g.ball.z-fz*0.8; P.y=W.terrain(P.x,P.z); P.vx=P.vz=P.vy=0; }
function exitAim(){ setMode('walk'); camS.yaw=S.g.yaw; }
function hit(power){
  const g=S.g, cl=CLUBS[g.club], Pp=SURF[g.lie]||SURF[1]; ensureAudio(); blip('hit');
  let sd=cl.err*(cl.putt?1:Pp.err); const over=Math.max(0,power-1);
  let err=gauss()*sd*Math.PI/180+(over>0?(Math.random()<.5?-1:1)*over*22*Math.PI/180:0); if(g.lie===6) err*=0.85;
  const yaw=g.yaw+err; let speed=cl.v0*power;
  if(!cl.putt){ let f=Pp.sp; if(g.lie===7 && g.club===7) f=0.92; speed*=f*(0.985+Math.random()*0.03); }
  const d=new V3(Math.cos(yaw),0,Math.sin(yaw)); let v;
  if(cl.putt) v=d.multiplyScalar(speed); else { const a=cl.loft*Math.PI/180; v=new V3(d.x*Math.cos(a)*speed,Math.sin(a)*speed,d.z*Math.cos(a)*speed); }
  g.cur++; g.last.copy(g.ball); g.flightStart.copy(g.ball);
  const p=g.ball.clone(); if(!cl.putt) p.y+=0.05;
  g.sim=newSim(p,v,cl.putt,{trees:true,cup:hole().pin,spin:cl.loft/100});
  g.overview=false; trailN=0; trailGeo.setDrawRange(0,0); prevGeo.setDrawRange(0,0); aimRing.visible=aimDot.visible=false;
  P.followT=0.001; setMode('flight');
}
let trailN=0, trailTick=0;
function updateFlight(dt){
  const g=S.g, s=g.sim; let acc=Math.min(dt,0.05); const step=1/120; let n=0;
  while(acc>0 && !s.done && n<20){ simStep(s,step,g.wind); acc-=step; n++; }
  g.ball.set(s.x,s.y,s.z);
  if(++trailTick%2===0 && s.mode==='air' && trailN<TRAIL_N){ const a=trailGeo.attributes.position.array; a[trailN*3]=s.x; a[trailN*3+1]=s.y+0.2; a[trailN*3+2]=s.z; trailN++; trailGeo.setDrawRange(0,trailN); trailGeo.attributes.position.needsUpdate=true; }
  const carry=Math.hypot(s.x-g.flightStart.x,s.z-g.flightStart.z);
  $('flightInfo').textContent=(s.mode==='air'?'Vuelo ':'Rodando ')+fmt(carry)+' m'+(s.treeHits?' · ¡árbol!':'')+(s.wallHits?' · ¡pared!':'');
  if(s.done){
    const H=hole();
    if(s.done==='water'){ g.cur++; startSplash(s.x,s.z,W.waterLevel(s.x,s.z)); blip('water'); toast('Agua','+1 golpe de penalidad · repites desde donde golpeaste'); g.ball.copy(g.last); g.waitT=1.8; g.after='aim'; }
    else if(s.done==='roof'){ const b=s.roofB; const e=nearestEdge(b,s.x,s.z); const dx=e[1]+e[3]*2.2, dz=e[2]+e[4]*2.2; g.ball.set(dx,W.terrain(dx,dz)+0.03,dz); toast('¡En el tejado!','Dropeas junto al edificio sin penalidad'); g.waitT=1.6; g.after='walk'; }
    else if(s.done==='holed'){ blip('cup'); const diff=g.cur-H.par; g.scores[g.hole]=g.cur; saveScores(g.hole); toast(scoreName(g.cur,H.par),g.cur+(g.cur===1?' golpe':' golpes')+' · '+(diff===0?'par':(diff>0?'+':'')+diff)); g.waitT=2.6; g.after='holed'; g.ballVisible=false; P.cheerT=2.4; }
    else if(g.cur>=10){ g.scores[g.hole]=10; saveScores(g.hole); toast('Bola recogida','Máximo de 10 golpes'); g.waitT=1.8; g.after='holed'; g.ballVisible=false; }
    else { let lie=W.surfAt(s.x,s.z); if(lie>=20) lie=1; if(!CLUBS[g.club].putt) toast(fmt(carry)+' m','Queda en '+((SURF[lie]||SURF[1]).n.toLowerCase())+' · '+fmt(distToPin())+' m a bandera');
      g.waitT=1.1; g.after=(CLUBS[g.club].putt||lie===5||lie===4)&&distToPin()<30?'aim':'walk'; }
    setMode('wait');
  }
}
function afterWait(){ const g=S.g;
  if(g.after==='aim'){ enterAim(false); return; }
  if(g.after==='holed'){ const C=W.COURSES[S.course]||W.COURSES[0], done=playedIn(C); g.hole=-1; g.next=nextUnplayed(S.lastHole===undefined?-1:S.lastHole); trail.visible=false;
    setMode('walk'); camS.yaw=P.yaw;
    if(done===C.holes.length) setTimeout(endRound,600); else if(g.next>=0) tip('Siguiente: '+holeLabel(W.HOLES[g.next]).toLowerCase()+'. Sigue la luz azul o pulsa "Ir al tee"',4500); return; }
  setMode('walk'); camS.yaw=g.yaw; tip('Ve hasta tu bola o pulsa "Ir a la bola"',4000);
}
function scoreName(st,par){ if(st===1) return '¡Hoyo en uno!'; const d=st-par; return d<=-3?'Albatros':d===-2?'Eagle':d===-1?'Birdie':d===0?'Par':d===1?'Bogey':d===2?'Doble bogey':'+'+d; }
function saveScores(j){ S.lastHole=S.g.hole; store.set(WP.key+'_scores3',JSON.stringify(S.g.scores)); mpCard(j===undefined?-1:j); }
function bestKey(C){ return WP.key+'_best18'+(W.MULTI?'_'+C.id:''); }
function endRound(){ const g=S.g; const C=W.COURSES[S.course]||W.COURSES[0]; const ts=C.holes.reduce((a,i)=>a+(g.scores[i]||0),0); const b=+store.get(bestKey(C)); if(!b||ts<b) store.set(bestKey(C),ts);
  openModal('tarjeta',{title:'Vuelta terminada',html:cardHTML(true)}); }

/* preview for aiming */
let prevKey='';
function updatePreview(){
  const g=S.g, cl=CLUBS[g.club]; const p=S.mode==='swing'?Math.max(0.05,g.power):1;
  const key=g.club+'|'+g.yaw.toFixed(4)+'|'+p.toFixed(3)+'|'+g.ball.x.toFixed(2)+g.ball.z.toFixed(2);
  if(key===prevKey) return; prevKey=key;
  const d=dirV(); const arr=prevGeo.attributes.position.array; let np=0;
  if(cl.putt){ const sim=newSim(g.ball,d.clone().multiplyScalar(cl.v0*p),true,{cup:null}); const pts=[];
    for(let i=0;i<1500&&!sim.done;i++){ simStep(sim,1/60,{x:0,z:0}); if(i%3===0) pts.push([sim.x,sim.y,sim.z]); }
    const show=Math.max(2,Math.floor(pts.length*0.5)); for(let i=0;i<show&&np<PREV_N;i++){ arr[np*3]=pts[i][0]; arr[np*3+1]=pts[i][1]+0.08; arr[np*3+2]=pts[i][2]; np++; }
    const end=pts[pts.length-1]||[g.ball.x,g.ball.y,g.ball.z]; const L=Math.hypot(end[0]-g.ball.x,end[2]-g.ball.z);
    aimRing.visible=false; aimDot.visible=true; const ex=g.ball.x+d.x*L, ez=g.ball.z+d.z*L; aimDot.position.set(ex,W.terrain(ex,ez)+0.1,ez); aimDot.scale.setScalar(0.5);
  } else { const a=cl.loft*Math.PI/180, sp=cl.v0*p*((SURF[g.lie]||SURF[1]).sp);
    const sim=newSim({x:g.ball.x,y:g.ball.y+0.05,z:g.ball.z},{x:d.x*Math.cos(a)*sp,y:Math.sin(a)*sp,z:d.z*Math.cos(a)*sp},false,{cup:null});
    for(let i=0;i<1200&&!sim.land&&!sim.done;i++){ simStep(sim,1/60,g.wind); if(i%2===0&&np<PREV_N){ arr[np*3]=sim.x; arr[np*3+1]=sim.y; arr[np*3+2]=sim.z; np++; } }
    const lx=sim.land?sim.land.x:sim.x, lz=sim.land?sim.land.z:sim.z;
    aimRing.visible=aimDot.visible=true; const ly=Math.max(W.terrain(lx,lz),W.waterLevel(lx,lz)); aimRing.position.set(lx,ly+0.3,lz); aimDot.position.set(lx,ly+0.3,lz);
    const cd=camera.position.distanceTo(aimRing.position); aimRing.scale.setScalar(Math.max(1,cd/90)); aimDot.scale.setScalar(Math.max(1,cd/90)); g.carryPrev=Math.hypot(lx-g.ball.x,lz-g.ball.z); }
  prevGeo.setDrawRange(0,np); prevGeo.attributes.position.needsUpdate=true; prevLine.computeLineDistances();
}

/* ================= buggies ================= */
function enterBuggy(b){ if(b.type) return enterCar(b); P.buggy=b; b.speed=0; setMode('drive'); camS.yaw=b.yaw; tip('Joystick: arriba acelera, abajo frena, a los lados gira',3500); }
function exitBuggy(){ const b=P.buggy; if(!b) return; P.buggy=null; const c=Math.cos(b.yaw), s=Math.sin(b.yaw);
  let x=b.x+s*1.6, z=b.z-c*1.6; if(b.type){ [x,z]=exitCar(b); } else if(bldAt(x,z,0.4)){ x=b.x-s*1.6; z=b.z+c*1.6; } P.x=x; P.z=z; P.y=groundAt(x,z,b.y+2); P.vx=P.vz=P.vy=0; P.yaw=b.yaw; if(S.mode==='drive') setMode('walk'); mpBuggyParked(b); }
function updateDrive(dt){
  if(P.buggy&&P.buggy.type) return updateCar(dt);
  const b=P.buggy; const th=inp.my, st=inp.mx;
  if(Math.abs(th)>0.05){ b.speed+=th*(th*b.speed<0?14:6)*dt; } else b.speed*=Math.max(0,1-1.6*dt);
  b.speed=clamp(b.speed,-4,12);
  b.yaw+=st*clamp(b.speed,-4,12)*0.13*dt;
  const nx=b.x+Math.cos(b.yaw)*b.speed*dt, nz=b.z+Math.sin(b.yaw)*b.speed*dt;
  const gh=W.terrain(nx,nz), wl=W.waterLevel(nx,nz);
  let blocked=gh<wl+0.15 && groundAt(nx,nz,b.y+1)<wl+0.15;
  if(!blocked){ const bb=bldAt(nx,nz,0.9); if(bb&&bb.top>b.y+0.5&&bb.base<b.y+1.6) blocked=true; }
  if(!blocked){ const trees=treeGrid.get(Math.floor(nx/20)+','+Math.floor(nz/20)); if(trees) for(const t of trees){ if(Math.hypot(nx-t.x,nz-t.z)<t.tr+0.9 && b.y<t.cy){ blocked=true; break; } } }
  if(blocked){ b.speed*=-0.25; } else { b.x=nx; b.z=nz; }
  placeBuggyMesh(b);
  P.x=b.x; P.z=b.z; P.y=b.y; P.yaw=b.yaw;
  if(performance.now()-camS.lastLook>900) camS.yaw=lerpAng(camS.yaw,b.yaw,1-Math.exp(-dt*2.2));
}

/* ================= on-foot movement ================= */
function updateWalk(dt){
  const f=[Math.cos(camS.yaw),Math.sin(camS.yaw)], r=[-Math.sin(camS.yaw),Math.cos(camS.yaw)];
  let mx=inp.mx, my=inp.my; const mag=Math.min(1,Math.hypot(mx,my));
  const wx=f[0]*my+r[0]*mx, wz=f[1]*my+r[1]*mx; const wl=Math.hypot(wx,wz)||1;
  if(mag>0.93) P.stickHold+=dt; else P.stickHold=0;
  const sprint=!P.swim && (P.sprintLock||inp.keys.ShiftLeft||inp.keys.ShiftRight||P.stickHold>0.35) && mag>0.3;
  P.sprint=sprint;
  const speed=P.swim?3.4:(sprint?10.5:6.8)*Math.min(1,mag*1.15);
  const tvx=wx/wl*speed*(mag>0.08?1:0), tvz=wz/wl*speed*(mag>0.08?1:0);
  const acc=(P.onGround||P.swim)?38:9; const dvx=tvx-P.vx, dvz=tvz-P.vz, dl=Math.hypot(dvx,dvz), mxd=acc*dt;
  if(dl>mxd){ P.vx+=dvx/dl*mxd; P.vz+=dvz/dl*mxd; } else { P.vx=tvx; P.vz=tvz; }
  if(mag>0.1) P.yaw=lerpAng(P.yaw,Math.atan2(wz,wx),1-Math.exp(-dt*12));
  if(inp.jumpQ){ inp.jumpQ=false; if(P.onGround||P.swim){ P.vy=P.swim?5.5:7.6; P.onGround=false; P.swim=false; blip('jump'); } }
  if(!P.swim) P.vy-=22*dt;
  let nx=P.x+P.vx*dt, nz=P.z+P.vz*dt, ny=P.y+P.vy*dt;
  const res=collide(nx,nz,ny,0.36,P.swim); nx=res[0]; nz=res[1];
  if(res[2]>-1e8 && (P.onGround||P.swim) && res[2]>ny){ ny=res[2]; P.vy=0; P.swim=false; P.onGround=true; }
  const tH=terrainAt(nx,nz); const g=groundAt(nx,nz,ny); const wlev=W.waterLevel(nx,nz); P.wl=wlev;
  if(tH<wlev-1.15 && g<wlev-1.15 && ny<=wlev-1.2){ P.swim=true; ny=wlev-1.25; P.vy=0; P.onGround=false; }
  else if(P.swim && (g>wlev-1.15)){ P.swim=false; }
  if(!P.swim){ if(ny<=g){ ny=g; if(P.vy<-14) P.landT=0.3; P.vy=0; P.onGround=true; } else P.onGround=(ny-g)<0.05; }
  if(S.interior&&ny+1.85>S.interior.ceil){ ny=S.interior.ceil-1.85; if(P.vy>0) P.vy=0; }
  if(Math.abs(nx)>20000||Math.abs(nz)>20000){ nx=P.x; nz=P.z; }
  P.x=nx; P.y=ny; P.z=nz;
}
function updateFall(dt){
  const f=[Math.cos(camS.yaw),Math.sin(camS.yaw)], r=[-Math.sin(camS.yaw),Math.cos(camS.yaw)];
  const mx=inp.mx, my=inp.my, mag=Math.min(1,Math.hypot(mx,my)); const wx=f[0]*my+r[0]*mx, wz=f[1]*my+r[1]*mx, wl=Math.hypot(wx,wz)||1;
  const sp=20*mag; const tvx=wx/wl*sp, tvz=wz/wl*sp; P.vx+=(tvx-P.vx)*Math.min(1,dt*1.6); P.vz+=(tvz-P.vz)*Math.min(1,dt*1.6);
  const tvy=-(44+20*Math.max(0,my)); P.vy+=(tvy-P.vy)*Math.min(1,dt*1.2);
  P.x+=P.vx*dt; P.y+=P.vy*dt; P.z+=P.vz*dt; if(mag>0.1) P.yaw=lerpAng(P.yaw,Math.atan2(wz,wx),1-Math.exp(-dt*4));
  const g=groundAt(P.x,P.z,P.y); const alt=P.y-Math.max(g,W.waterLevel(P.x,P.z));
  setWind(clamp(-P.vy/90,0,0.6));
  if(alt<110){ openGlider(); return; }
  if(P.y<=g){ P.y=g; landNow(); }
}
function updateGlide(dt){
  const f=[Math.cos(camS.yaw),Math.sin(camS.yaw)], r=[-Math.sin(camS.yaw),Math.cos(camS.yaw)];
  const mx=inp.mx, my=inp.my, mag=Math.min(1,Math.hypot(mx,my));
  let hx=Math.cos(P.yaw), hz=Math.sin(P.yaw);
  if(mag>0.1){ const wx=f[0]*my+r[0]*mx, wz=f[1]*my+r[1]*mx; P.yaw=lerpAng(P.yaw,Math.atan2(wz,wx),1-Math.exp(-dt*2.2)); hx=Math.cos(P.yaw); hz=Math.sin(P.yaw); }
  const fwd=mag>0.1?Math.max(0,my):0; const sp=11+7*fwd*(mag>0.1?1:0)+(mag>0.1?2:0);
  P.vx+=(hx*sp-P.vx)*Math.min(1,dt*1.5); P.vz+=(hz*sp-P.vz)*Math.min(1,dt*1.5); const tvy=-(5.2+3.2*fwd); P.vy+=(tvy-P.vy)*Math.min(1,dt*2);
  let nx=P.x+P.vx*dt, nz=P.z+P.vz*dt, ny=P.y+P.vy*dt;
  const res=collide(nx,nz,ny,0.4,false); nx=res[0]; nz=res[1];
  P.x=nx; P.z=nz; P.y=ny; setWind(0.12);
  if(performance.now()-camS.lastLook>1000) camS.yaw=lerpAng(camS.yaw,P.yaw,1-Math.exp(-dt*1.2));
  const g=groundAt(P.x,P.z,P.y);
  const wl=W.waterLevel(P.x,P.z);
  if(P.y<=Math.max(g,wl)+0.02){ if(g<wl-1.15){ P.y=wl-1.25; P.swim=true; } else P.y=g; landNow(); }
}

/* ================= camera ================= */
const camT={pos:new V3(),look:new V3()}; const camLook=new V3();
const orbit={t:new V3(ISLE[0],10,ISLE[1]),r:1700,th:0.9,ph:1.08,auto:true,tT:null,tR:null};
function aimCamTarget(){
  const g=S.g, d=dirV(), cl=CLUBS[g.club], b=g.ball;
  if(g.overview){ const H=hole(); const tx=H.pin[0], tz=H.pin[1]; const L=Math.hypot(tx-b.x,tz-b.z); const mx=(b.x+tx)/2, mz=(b.z+tz)/2; const hgt=Math.max(90,L*1.25);
    camT.pos.set(mx-d.x*hgt*0.28,hgt+groundAt(mx,mz,999),mz-d.z*hgt*0.28); camT.look.set(mx,groundAt(mx,mz,999),mz); return; }
  if(cl.putt){ const H=hole(); const L=Math.hypot(H.pin[0]-b.x,H.pin[1]-b.z); const back=7+Math.min(L,20)*0.2;
    let bk=back; for(let s=1.5;s<=back;s+=1.5){ if(camBlocked(b.x-d.x*s,b.y+1.9,b.z-d.z*s)){ bk=Math.max(2,s-1.5); break; } }
    camT.pos.set(b.x-d.x*bk,b.y+1.9+Math.min(L,20)*0.1,b.z-d.z*bk); camT.look.set(b.x+d.x*Math.min(L,12),b.y,b.z+d.z*Math.min(L,12)); }
  else { let back=9, up=3.2; for(let s=1.5;s<=9;s+=1.5){ if(camBlocked(b.x-d.x*s,b.y+up,b.z-d.z*s)){ back=Math.max(2.2,s-1.6); up=2.4; break; } }
    camT.pos.set(b.x-d.x*back,b.y+up,b.z-d.z*back); camT.look.set(b.x+d.x*70,b.y+5,b.z+d.z*70); }
}
function snapAimCamera(){ aimCamTarget(); camera.position.copy(camT.pos); camLook.copy(camT.look); camera.lookAt(camLook); }
function camBlocked(px,py,pz){
  if(S.interior){ const I=S.interior; if(!inBld(I.b,px,pz)) return true; if(nearestEdge(I.b,px,pz)[0]<0.25) return true; if(interiorCamBlocked(px,pz)) return true; return py>I.ceil-0.15||py<I.floor+0.25; }
  const gg=terrainAt(px,pz); if(py<gg+0.4) return true; for(const b of bldsNear(px,pz)){ if(b.solid&&py<b.top+0.2&&py>b.base&&inBld(b,px,pz)) return true; } return false; }
function thirdPerson(dist,pitch,height,shoulder){
  const f=[Math.cos(camS.yaw),Math.sin(camS.yaw)], r=[-Math.sin(camS.yaw),Math.cos(camS.yaw)];
  const tx=P.x+r[0]*shoulder, ty=P.y+height, tz=P.z+r[1]*shoulder;
  const cp=Math.cos(pitch), sp=Math.sin(pitch);
  let d=dist; let px,py,pz;
  if(S.interior){ let ok=false; for(let k=0;k<10;k++){ px=tx-f[0]*d*cp; py=ty+d*sp; pz=tz-f[1]*d*cp; if(!camBlocked(px,py,pz)){ ok=true; break; } d*=0.75; if(d<0.45) break; }
    if(!ok){ px=tx-f[0]*0.3; pz=tz-f[1]*0.3; py=ty+0.1; if(camBlocked(px,py,pz)){ px=tx; pz=tz; py=ty; } } }
  else for(let k=0;k<8;k++){ px=tx-f[0]*d*cp; py=ty+d*sp; pz=tz-f[1]*d*cp; if(!camBlocked(px,py,pz)) break; d*=0.72; if(d<1.2){ py=Math.max(py,terrainAt(px,pz)+0.6); break; } }
  camT.pos.set(px,py,pz); camT.look.set(tx+f[0]*2.5,ty+0.1,tz+f[1]*2.5);
}
function updateCamera(dt){
  if(S.mode==='menu'||S.mode==='drone'||S.mode==='view'){
    if(orbit.tT){ orbit.t.lerp(orbit.tT,1-Math.exp(-dt*2.2)); orbit.r+=(orbit.tR-orbit.r)*(1-Math.exp(-dt*2.2)); if(orbit.t.distanceTo(orbit.tT)<1&&Math.abs(orbit.r-orbit.tR)<2) orbit.tT=null; }
    if(orbit.auto && !reduceMotion) orbit.th+=dt*(S.mode==='menu'?0.035:0.05);
    const sp=Math.sin(orbit.ph); camera.position.set(orbit.t.x+orbit.r*sp*Math.cos(orbit.th),orbit.t.y+orbit.r*Math.cos(orbit.ph),orbit.t.z+orbit.r*sp*Math.sin(orbit.th));
    const g=Math.max(0,terrainAt(camera.position.x,camera.position.z)); if(camera.position.y<g+6) camera.position.y=g+6; camera.lookAt(orbit.t); return; }
  let k=10;
  if(S.mode==='plane'){ const [x,y,z]=planePos(); const f=[Math.cos(camS.yaw),Math.sin(camS.yaw)]; const cp=Math.cos(camS.pitch), sp=Math.sin(camS.pitch); const d=34;
    camT.pos.set(x-f[0]*d*cp,y+4+d*sp,z-f[1]*d*cp); camT.look.set(x,y+2,z); k=6; }
  else if(S.mode==='fall'){ thirdPerson(9,Math.max(0.45,camS.pitch),0.8,0); k=8; }
  else if(S.mode==='glide'){ thirdPerson(8,camS.pitch,1.6,0); k=7; }
  else if(S.mode==='walk'){ if(S.interior&&camS.fp){ const cp=Math.cos(camS.pitch), sp=Math.sin(camS.pitch), ey=P.y+1.6; camT.pos.set(P.x,ey,P.z); camT.look.set(P.x+Math.cos(camS.yaw)*cp*4,ey-sp*4,P.z+Math.sin(camS.yaw)*cp*4); k=30; }
    else if(S.interior){ thirdPerson(3.0,clamp(camS.pitch,0.02,0.55),1.45,0.25); k=12; } else { thirdPerson(camS.dist,camS.pitch,P.swim?1.75:1.55,0.45); k=14; } }
  else if(S.mode==='drive'){ const V=P.buggy&&P.buggy.type?VEH[P.buggy.type]:null; thirdPerson(V?V.cam:8.5,Math.max(V?0.13:0.18,camS.pitch),V?1.5:1.8,0); k=V?9:8; }
  else if(S.mode==='aim'||S.mode==='swing'){ aimCamTarget(); k=S.g.overview?3:6; }
  else if(S.mode==='flight'||S.mode==='wait'){ const s=S.g.sim; const b=S.g.ball; let hx=s?s.vx:0, hz=s?s.vz:0; const hl=Math.hypot(hx,hz); let dx,dz; if(hl<0.5){ const d=dirV(); dx=d.x; dz=d.z; } else { dx=hx/hl; dz=hz/hl; }
    const putt=CLUBS[S.g.club].putt; const back=putt?6:16, up=putt?2.2:6.5; camT.pos.set(b.x-dx*back,b.y+up,b.z-dz*back); camT.look.set(b.x,b.y+(putt?0:1),b.z); k=putt?3:2.6;
    if(S.g.after==='holed'&&S.mode==='wait'){ thirdPerson(5,0.25,1.4,0); k=3; } }
  const a=S.snap?1:1-Math.exp(-dt*k); S.snap=false; camera.position.lerp(camT.pos,a); camLook.lerp(camT.look,a); if(S.mode==='walk'&&S.interior&&camS.fp) camera.position.copy(camT.pos);
  const g=terrainAt(camera.position.x,camera.position.z); if(camera.position.y<g+0.5) camera.position.y=g+0.5;
  const cwl=W.waterLevel(camera.position.x,camera.position.z); if(camera.position.y<cwl+0.4 && g<cwl) camera.position.y=cwl+0.4;
  camera.lookAt(camLook);
}

/* ================= HUD ================= */
const ringC=2*Math.PI*48;
(function(){ const rf=$('ringFill'), ro=$('ringOver'); rf.setAttribute('stroke-dasharray','0 '+ringC); ro.setAttribute('stroke-dasharray',(ringC*0.1/1.1)+' '+ringC); ro.setAttribute('stroke-dashoffset',-(ringC/1.1)); $('ringMark').setAttribute('transform','rotate('+((1/1.1)*360)+' 52 52)'); })();
function setPowerRing(p){ const f=Math.min(p,1.1)/1.1; $('ringFill').setAttribute('stroke-dasharray',(ringC*f)+' '+ringC); $('ringFill').setAttribute('stroke',p>1?'#d6442a':'#255d3c'); }
let toastTimer=0, tipTimer=0;
function toast(b,s){ $('toastB').textContent=b; $('toastS').textContent=s||''; const t=$('toast'); t.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove('show'),2300); }
function tip(text,ms){ const t=$('tip'); t.textContent=text; t.hidden=false; clearTimeout(tipTimer); tipTimer=setTimeout(()=>{ t.hidden=true; },ms||3000); }
function refreshHUD(){
  const m=S.mode; const golfMode=['aim','swing','flight','wait'].includes(m)&&!(m==='wait'&&S.g.after==='holed');
  $('intro').hidden=m!=='menu';
  $('hud').hidden=!(['plane','fall','glide','walk','drive'].includes(m)||(m==='wait'&&S.g.after==='holed'));
  $('golf').hidden=!golfMode;
  $('exploreHud').hidden=m!=='drone'; $('viewHud').hidden=m!=='view';
  const onFoot=m==='walk', drv=m==='drive';
  const carDrv=drv&&P.buggy&&P.buggy.type; $('btns').hidden=!(onFoot||drv); $('bJump').hidden=!(onFoot||carDrv); refreshCarBtns(); if(!carDrv) $('carPrompt').hidden=true; $('bSprint').hidden=!onFoot; $('stickHint').hidden=!(onFoot&&!S.movedOnce);
  $('bBig').hidden=!(m==='plane'||m==='fall'); $('bBig').textContent=m==='plane'?'SALTAR':'ABRIR';
  $('altBox').hidden=!(m==='plane'||m==='fall'||m==='glide');
  const aiming=m==='aim'||m==='swing';
  $('gBottom').style.opacity=aiming?1:0.35;
  $('gBottom').style.pointerEvents=aiming?'auto':'none'; $('gExit').hidden=!aiming;
  $('flightInfo').hidden=m!=='flight';
  prevLine.visible=aiming; if(!aiming){ aimRing.visible=aimDot.visible=false; }
  if(rig){ rig.club.visible=['aim','swing','flight'].includes(m)||(m==='wait'&&S.g.after!=='holed'); }
  trail.visible=['flight','wait','aim','swing'].includes(m);
  updateGolfHUD();
}
function updateGolfHUD(){
  const H=hole(); if(!H) return; const g=S.g;
  $('hcTitle').innerHTML=holeLabel(H)+'<small>Par '+H.par+' · '+fmt(H.L)+' m</small>';
  $('hcDist').innerHTML='<b>'+fmt(distToPin())+'</b> m a bandera'; $('hcStroke').textContent='Golpe '+(g.cur+1); $('hcLie').textContent=(SURF[g.lie]||SURF[1]).n; $('hcInfo').textContent=H.info;
  const cl=CLUBS[g.club]; $('clubName').textContent=cl.n; $('clubCarry').textContent=cl.putt?'hasta ~30 m':'vuelo '+cl.c+' m';
  const d=dirV(); const along=g.wind.x*d.x+g.wind.z*d.z, side=g.wind.x*(-d.z)+g.wind.z*d.x;
  $('windArrow').style.transform='rotate('+(Math.atan2(side,along)*180/Math.PI)+'deg)'; $('windSpeed').textContent=fmt(g.wind.sp,1);
  let t='calma'; if(g.wind.sp>0.3){ const parts=[]; if(Math.abs(along)>g.wind.sp*0.38) parts.push(along>0?'a favor':'en contra'); if(Math.abs(side)>g.wind.sp*0.38) parts.push(side>0?'hacia la derecha':'hacia la izquierda'); t=parts.join(', '); }
  $('windTxt').textContent=t; $('btnView').classList.toggle('on',g.overview);
  const pi=$('putInfo'); const aiming=S.mode==='aim'||S.mode==='swing';
  if(aiming && cl.putt){ const b=g.ball; const mx=(b.x+H.pin[0])/2, mz=(b.z+H.pin[1])/2; const e=0.6; const h0=W.terrain(mx,mz);
    const gx=(W.terrain(mx+e,mz)-h0)/e, gz=(W.terrain(mx,mz+e)-h0)/e; const sl=Math.hypot(gx,gz)*100; const sideS=(-gx)*(-d.z)+(-gz)*d.x; const dh=W.terrain(H.pin[0],H.pin[1])-b.y;
    pi.innerHTML='Caída '+(sl<0.4?'casi recta':(sideS>0?'hacia la derecha':'hacia la izquierda'))+' · '+fmt(sl,1)+' % &nbsp;|&nbsp; '+(Math.abs(dh)<0.05?'llano':(dh>0?'cuesta arriba ':'cuesta abajo ')+fmt(Math.abs(dh),2)+' m'); pi.hidden=false; } else pi.hidden=true;
}
let actKind=null, actRef=null;
function computeAction(){
  let k=null, ref=null, label='';
  const m=S.mode;
  if(m==='drive'){ k='exitBuggy'; label='Bajar'; }
  else if(m==='walk'&&S.interior){ k='exitHouse'; label='Salir'; }
  else if(m==='walk'){
    const g=S.g;
    if(g.hole>=0 && g.ballVisible){ const d=Math.hypot(P.x-g.ball.x,P.z-g.ball.z); if(d<4.5){ k='shot'; label='Golpear'; } }
    if(!k){ let best=null,bd=3.4; for(const b of buggies){ if(b.remoteBy) continue; const d=Math.hypot(P.x-b.x,P.z-b.z); if(d<bd){ bd=d; best=b; } } if(best){ k='buggy'; ref=best; label=best.type?'Conducir '+VEH[best.type].n.toLowerCase():'Conducir'; } }
    if(!k){ let bd=9; for(const H of W.HOLES){ const d=Math.hypot(P.x-H.tx,P.z-H.tz); if(d<bd && g.hole!==H.i){ bd=d; k='start'; ref=H.i; label='Jugar '+holeLabel(H).toLowerCase(); } } }
    if(!k && !P.swim){ const vb=villaNear(P.x,P.z); if(vb){ k='enterHouse'; ref=vb; label='Entrar'; } }
    if(!k && g.hole>=0 && g.ballVisible){ k='goBall'; label='Ir a la bola'; }
    if(!k && g.hole<0 && g.next>=0){ k='goTee'; ref=g.next; label='Ir al tee '+W.HOLES[g.next].n; }
  }
  actKind=k; actRef=ref; const b=$('bAct'); b.hidden=!k; if(k && b.textContent!==label) b.textContent=label;
  const bv=$('bView'); if(bv){ const hv=!((m==='walk'&&S.interior)||(m==='drive'&&P.buggy&&P.buggy.type)); if(bv.hidden!==hv) bv.hidden=hv; } const bt=$('bTour'); if(bt){ const ht=!(m==='walk'&&S.interior); if(bt.hidden!==ht){ bt.hidden=ht; refreshTourBtn(); } }
}
function doAction(){
  ensureAudio(); computeAction();
  if(actKind==='exitBuggy') exitBuggy();
  else if(actKind==='enterHouse') goInside(actRef);
  else if(actKind==='exitHouse') goOutside();
  else if(actKind==='buggy') enterBuggy(actRef);
  else if(actKind==='start') startHole(actRef);
  else if(actKind==='shot') enterAim(false);
  else if(actKind==='goBall'){ fadeTo(()=>{ enterAim(false); }); }
  else if(actKind==='goTee'){ const H=W.HOLES[actRef]; fadeTo(()=>{ P.x=H.tx-6*H.tc; P.z=H.tz-6*H.ts; P.y=groundAt(P.x,P.z,999); P.vx=P.vy=P.vz=0; P.swim=false; P.yaw=H.ta; camS.yaw=H.ta; }); }
}
function fadeTo(fn){ const f=$('fade'); f.style.opacity=1; setTimeout(()=>{ fn(); S.snap=true; setTimeout(()=>{ f.style.opacity=0; },60); },260); }
function statusText(){
  const m=S.mode; let t=WP.title, s='';
  if(m==='plane'){ t='En la avioneta'; s='Elige dónde caer y pulsa SALTAR'; }
  else if(m==='fall'){ t='Caída libre'; s='Joystick para dirigirte · el planeador se abre solo a 110 m'; }
  else if(m==='glide'){ t='Planeando'; s='Joystick para girar · aterriza donde quieras'; }
  else if(m==='drive'){ const b=P.buggy; t=b&&b.type?VEH[b.type].n+(b.cop?' · con copiloto':''):'En buggy'; s=fmt(Math.abs(b?(b.type?Math.hypot(b.vx,b.vz):b.speed)*3.6:0))+' km/h'+(b&&b.type?(DR.t>0.3?' · ¡derrapando!':' · Derrape: freno de mano')+(DR.best?' · récord '+DR.best.toFixed(1).replace('.',',')+' s':''):''); }
  else { const g=S.g; if(g.hole>=0){ const H=hole(); t=holeLabel(H)+' · Par '+H.par; s='Golpe '+(g.cur+1)+' · '+fmt(distToPin())+' m de la bola a la bandera'; }
    else if(S.interior){ t=WP.T.House+' · '+S.interior.th.n; s=interiorRoomName()+' · '+Math.round(S.interior.b.area)+' m² · '+(camS.fp?'1ª persona':'3ª persona')+' (C) · Salir te devuelve al jardín'; }
    else { const C=W.COURSES[S.course]||W.COURSES[0], played=playedIn(C); s=played?('Tarjeta'+(W.MULTI?' '+C.short:'')+': '+played+' de '+C.holes.length+' hoyos'):(W.MULTI?C.name+' · ':'')+'Ve a un tee para jugar o busca las bolas doradas'; if(P.swim) s='Nadando · Saltar para impulsarte'; } }
  $('stTitle').textContent=t; $('stSub').textContent=s; $('stGold').textContent='Bolas doradas '+S.gold.size+'/'+GOLD.length;
}

/* ================= minimap + big map (aerial photo or course plan) ================= */
const MAP=WP.map; let mapPhoto=null, mapPlan=null, mapLayer=store.get('vg_layer')||'foto';
const MAPCOL=Object.assign({water:'#86b6c6',1:'#a6aa66',2:'#8fb05a',3:'#74b54a',4:'#66b649',5:'#4fae45',6:'#62ad46',7:'#efe2b9',8:'#9a9790',9:'#efe3c4',10:'#8cb85c',villa:'#f6f1e6',hotel:'#7c7f86',ruin:'#b8b6b0'},WP.mapCol||{});
function m2c(x,z,W_,H_){ return [(x-MAP.x0)/(MAP.x1-MAP.x0)*W_,(z-MAP.z0)/(MAP.z1-MAP.z0)*H_]; }
function buildMaps(imgPhoto,imgPlan){
  const W_=1080, H_=Math.round(1080*(MAP.z1-MAP.z0)/(MAP.x1-MAP.x0));
  const cp=document.createElement('canvas'); cp.width=W_; cp.height=H_; const g=cp.getContext('2d');
  const O=W.MAPPH||W.ORTHO; g.fillStyle=MAP.bg||MAPCOL.water; g.fillRect(0,0,W_,H_);
  g.drawImage(imgPhoto,(MAP.x0-O[0])/O[2]*imgPhoto.width,(MAP.z0-O[1])/O[2]*imgPhoto.height,(MAP.x1-MAP.x0)/O[2]*imgPhoto.width,(MAP.z1-MAP.z0)/O[2]*imgPhoto.height,0,0,W_,H_);
  if(Math.abs(H_/W_-1008/1080)>0.02){ $('bigMap').height=H_; }
  mapPhoto=cp;
  const cq=document.createElement('canvas'); cq.width=W_; cq.height=H_; const q=cq.getContext('2d'); q.fillStyle=MAP.bg||MAPCOL.water; q.fillRect(0,0,W_,H_);
  const [a0,b0]=m2c(W.CORE[0],W.CORE[1],W_,H_), [a1,b1]=m2c(W.CORE[0]+W.CORE[2],W.CORE[1]+W.CORE[2],W_,H_);
  q.imageSmoothingEnabled=false; q.drawImage(imgPlan,a0,b0,a1-a0,b1-b0); q.imageSmoothingEnabled=true;
  q.fillStyle=MAPCOL.water; for(const p of W.PONDS){ q.beginPath(); p.poly.forEach((pt,i)=>{ const [x,y]=m2c(pt[0],pt[1],W_,H_); i?q.lineTo(x,y):q.moveTo(x,y); }); q.closePath(); q.fill(); }
  q.lineWidth=0.8; q.strokeStyle='rgba(0,0,0,.35)';
  for(const b of BLD){ q.beginPath(); b.ring.forEach((pt,i)=>{ const [x,y]=m2c(pt[0],pt[1],W_,H_); i?q.lineTo(x,y):q.moveTo(x,y); }); q.closePath(); q.fillStyle=b.kind==='hotel'?MAPCOL.hotel:MAPCOL.villa; q.fill(); q.stroke(); }
  for(const [x,z,a] of RUINS){ const [px,py]=m2c(x,z,W_,H_); const s=W_/(MAP.x1-MAP.x0); q.save(); q.translate(px,py); q.rotate(a); q.fillStyle=MAPCOL.ruin; q.fillRect(-6*s,-5*s,12*s,10*s); q.strokeRect(-6*s,-5*s,12*s,10*s); q.restore(); }
  mapPlan=cq;
}
function drawArrow(g,x,y,yaw,s){ g.save(); g.translate(x,y); g.rotate(yaw); g.beginPath(); g.moveTo(s,0); g.lineTo(-s*0.7,s*0.65); g.lineTo(-s*0.35,0); g.lineTo(-s*0.7,-s*0.65); g.closePath(); g.fillStyle='#ffffff'; g.fill(); g.lineWidth=Math.max(1.5,s*0.22); g.strokeStyle='#d6442a'; g.stroke(); g.restore(); }
function drawMini(){
  const c=$('mini'), g=c.getContext('2d'); if(!mapPlan) return; if(S.interior){ drawPlan(g,c.width,c.height,false); return; }
  const W_=c.width, H_=c.height; let m2c=(x,z)=>[(x-MAP.x0)/(MAP.x1-MAP.x0)*W_,(z-MAP.z0)/(MAP.z1-MAP.z0)*H_];
  if(WP.miniWindow){ // a north-up window around you (or the plane), the size of WP.miniWindow metres across
    const ww=WP.miniWindow*(S.mode==='plane'||S.mode==='fall'?2.2:1), hh=ww*H_/W_; let cx=P.x, cz=P.z; if(S.mode==='plane'&&S.plane){ const pp=planePos(); cx=pp[0]; cz=pp[2]; }
    const vx0=cx-ww/2, vz0=cz-hh/2, sx=mapPlan.width/(MAP.x1-MAP.x0), sz=mapPlan.height/(MAP.z1-MAP.z0);
    g.fillStyle=MAP.bg||MAPCOL.water; g.fillRect(0,0,W_,H_); g.drawImage(mapPlan,(vx0-MAP.x0)*sx,(vz0-MAP.z0)*sz,ww*sx,hh*sz,0,0,W_,H_);
    m2c=(x,z)=>[(x-vx0)/ww*W_,(z-vz0)/hh*H_]; }
  else g.drawImage(mapPlan,0,0,W_,H_);
  if(S.mode==='plane' && S.plane){ const p=S.plane; const [ax,ay]=m2c(p.x0,p.z0), [bx,by]=m2c(p.x0+p.dx*p.len,p.z0+p.dz*p.len); g.strokeStyle='rgba(22,35,27,.65)'; g.setLineDash([5,4]); g.lineWidth=2; g.beginPath(); g.moveTo(ax,ay); g.lineTo(bx,by); g.stroke(); g.setLineDash([]); const [x,,z]=planePos(); const [qx,qy]=m2c(x,z); drawArrow(g,qx,qy,Math.atan2(p.dz,p.dx),7); return; }
  const gg=S.g;
  if(gg.hole>=0){ const H=hole(); g.lineWidth=1.4; g.strokeStyle='rgba(22,35,27,.6)'; g.setLineDash([3,3]); g.beginPath(); H.P.forEach((p,i)=>{ const [x,y]=m2c(p[0],p[1]); i?g.lineTo(x,y):g.moveTo(x,y); }); g.stroke(); g.setLineDash([]);
    const [px,py]=m2c(H.pin[0],H.pin[1]); g.fillStyle='#d6442a'; g.beginPath(); g.arc(px,py,3.6,0,7); g.fill();
    if(gg.ballVisible){ const [bx,by]=m2c(gg.ball.x,gg.ball.z); g.fillStyle='#fff'; g.strokeStyle='#16231b'; g.lineWidth=1.2; g.beginPath(); g.arc(bx,by,3,0,7); g.fill(); g.stroke(); } }
  else if(gg.next>=0){ const H=W.HOLES[gg.next]; const [tx,ty]=m2c(H.tx,H.tz); g.fillStyle='#2f6bd6'; g.beginPath(); g.arc(tx,ty,4,0,7); g.fill(); }
  if(S.marker){ const [mx,my]=m2c(S.marker[0],S.marker[1]); g.fillStyle='#ff7a3d'; g.beginPath(); g.arc(mx,my,4,0,7); g.fill(); }
  if(S.mode==='aim'||S.mode==='swing'){ const d=dirV(); const L=(CLUBS[gg.club].putt?20:(gg.carryPrev||CLUBS[gg.club].c)); const [bx,by]=m2c(gg.ball.x,gg.ball.z), [ax,ay]=m2c(gg.ball.x+d.x*L,gg.ball.z+d.z*L); g.strokeStyle='#ffffff'; g.lineWidth=2; g.beginPath(); g.moveTo(bx,by); g.lineTo(ax,ay); g.stroke(); }
  mpDrawMap(g,W_,H_,1,false,m2c);
  const [qx,qy]=m2c(P.x,P.z); drawArrow(g,qx,qy,P.yaw,7);
}
function drawBigMap(){
  const cv=$('bigMap'), g=cv.getContext('2d'); const W_=cv.width, H_=cv.height, s=W_/360;
  if(S.interior){ drawPlan(g,W_,H_,true); return; }
  g.drawImage(mapLayer==='plano'?mapPlan:mapPhoto,0,0,W_,H_);
  g.font='800 '+(8.5*s)+'px Figtree, system-ui, sans-serif'; g.textAlign='center'; g.textBaseline='middle';
  const photo=mapLayer!=='plano';
  const ms=s*(WP.mapMark||1);
  W.HOLES.forEach((H,i)=>{ const cur=H.course===S.course; if(!cur){ g.strokeStyle=photo?'rgba(255,255,255,.35)':'rgba(22,35,27,.22)'; g.lineWidth=0.9*s; g.setLineDash([2*s,3*s]); g.beginPath(); H.P.forEach((p,k)=>{ const [x,y]=m2c(p[0],p[1],W_,H_); k?g.lineTo(x,y):g.moveTo(x,y); }); g.stroke(); g.setLineDash([]); return; } });
  W.HOLES.forEach((H,i)=>{ if(H.course!==S.course) return; g.strokeStyle=photo?'rgba(255,255,255,.75)':'rgba(22,35,27,.5)'; g.lineWidth=1.1*s; g.setLineDash([4*s,4*s]); g.beginPath(); H.P.forEach((p,k)=>{ const [x,y]=m2c(p[0],p[1],W_,H_); k?g.lineTo(x,y):g.moveTo(x,y); }); g.stroke(); g.setLineDash([]);
    const [gx,gy]=m2c(H.pin[0],H.pin[1],W_,H_); g.fillStyle='#d6442a'; g.fillRect(gx-ms*0.6,gy-7*ms,1.2*ms,7*ms); g.beginPath(); g.moveTo(gx+ms*0.6,gy-7*ms); g.lineTo(gx+6*ms,gy-5.2*ms); g.lineTo(gx+ms*0.6,gy-3.4*ms); g.fill();
    const [tx,ty]=m2c(H.tx,H.tz,W_,H_); g.fillStyle=(S.g.hole===i)?'#d6442a':(S.g.scores[i]?'#8a948d':(W.MULTI?courseOf(H).color:'#16231b')); g.beginPath(); g.arc(tx,ty,6.5*ms,0,7); g.fill(); g.lineWidth=1.2*ms; g.strokeStyle='#fff'; g.stroke(); g.fillStyle='#fff'; g.font='800 '+(8.5*ms)+'px Figtree, system-ui, sans-serif'; g.fillText(String(H.n),tx,ty+0.6*ms); });
  for(const b of buggies){ if(b.remoteBy) continue; const [x,y]=m2c(b.x,b.z,W_,H_); g.fillStyle=b.type?VEH[b.type].col:'#ffffff'; g.strokeStyle='#255d3c'; g.lineWidth=2; g.fillRect(x-4*s,y-3*s,8*s,6*s); g.strokeRect(x-4*s,y-3*s,8*s,6*s); }
  for(const o of GOLD){ const [x,y]=m2c(o.x,o.z,W_,H_); g.beginPath(); g.arc(x,y,4.5*s,0,7); if(o.taken){ g.fillStyle='#f2c230'; g.fill(); } else { g.strokeStyle='#f2c230'; g.lineWidth=1.8*s; g.stroke(); } }
  if(S.g.hole>=0&&S.g.ballVisible){ const [bx,by]=m2c(S.g.ball.x,S.g.ball.z,W_,H_); g.fillStyle='#fff'; g.strokeStyle='#16231b'; g.lineWidth=2; g.beginPath(); g.arc(bx,by,4*s,0,7); g.fill(); g.stroke(); }
  if(S.marker){ const [mx,my]=m2c(S.marker[0],S.marker[1],W_,H_); g.fillStyle='#ff7a3d'; g.beginPath(); g.arc(mx,my,6*s,0,7); g.fill(); g.strokeStyle='#fff'; g.lineWidth=2; g.stroke(); }
  mpDrawMap(g,W_,H_,s,true);
  const [qx,qy]=m2c(P.x,P.z,W_,H_); drawArrow(g,qx,qy,P.yaw,9*s);
  g.fillStyle=photo?'#ffffff':'#16231b'; g.font='800 '+(10*s)+'px Figtree, system-ui, sans-serif'; g.textAlign='left'; g.fillText('N ↑',8*s,10*s);
  // scale bar: 200 m
  const sb=WP.scaleBar||200, px200=sb/(MAP.x1-MAP.x0)*W_; g.fillStyle=photo?'#ffffff':'#16231b'; g.fillRect(8*s,H_-10*s,px200,2*s); g.font='700 '+(7.5*s)+'px Figtree, system-ui, sans-serif'; g.fillText(fmt(sb)+' m',8*s,H_-16*s);
}
const LEG_PLAN=WP.legend;
function legendHTML(layer){
  const sym='<div><i class="dot" style="background:#fff;border:2px solid #d6442a"></i>Tú (flecha)</div><div><i class="dot" style="background:#16231b;border:2px solid #fff"></i>Tee con su número</div><div><i style="background:#d6442a;width:6px;border-radius:1px"></i>Bandera del green</div><div><i style="background:repeating-linear-gradient(90deg,#16231b 0 4px,transparent 4px 8px);height:3px;border:0"></i>Recorrido del hoyo</div><div><i style="background:#fff;border:2px solid #255d3c"></i>Buggy</div><div><i class="dot" style="background:#f2c230"></i>Bola dorada encontrada</div><div><i class="dot" style="background:transparent;border:2px solid #f2c230"></i>Bola dorada por encontrar</div><div><i class="dot" style="background:#ff7a3d"></i>Tu marca</div><div><i class="dot" style="background:#8b6fd6;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></i>Amigos de tu sala (color de su camiseta)</div><div><i class="dot" style="background:#fff;border:2px solid #8b6fd6;width:10px;height:10px"></i>Bola de un amigo</div>';
  if(layer==='plano') return '<div class="legend">'+LEG_PLAN.map(([k,n])=>'<div><i style="background:'+MAPCOL[k]+'"></i>'+n+'</div>').join('')+sym+'</div>';
  return '<p class="note" style="margin:6px 0">Fondo: foto aérea real (PNOA, Instituto Geográfico Nacional). '+WP.T.photoNote+'</p><div class="legend">'+sym+'</div>';
}
function setLayer(l){ mapLayer=l; store.set('vg_layer',l); $('lyFoto').classList.toggle('on',l!=='plano'); $('lyPlano').classList.toggle('on',l==='plano'); const inside=!!S.interior; $('mapHead').querySelector('h2').textContent=inside?'Plano de la '+WP.T.house:WP.T.mapTitle+(W.MULTI?' · '+courseOf().name:''); $('mapHead').querySelector('.seg').hidden=inside; $('mapClear').hidden=inside;
  $('mapLegend').innerHTML=inside?planLegendHTML():legendHTML(l)+'<p class="note">Toca el mapa para poner una marca naranja; aparece como una luz '+WP.T.where+'. Barra de escala: '+fmt(WP.scaleBar||200)+' m.'+(W.MULTI?' Con números, los tees del recorrido elegido ('+courseOf().name+'); en línea fina, los otros recorridos.':'')+'</p>'; drawBigMap(); }
function showMap(){ S.overlay=true; $('mapOv').hidden=false; setLayer(mapLayer); }
function hideMap(){ S.overlay=false; $('mapOv').hidden=true; }
$('bigMap').addEventListener('click',e=>{ if(S.interior) return; const cv=$('bigMap'), r=cv.getBoundingClientRect(); const a=cv.width/cv.height, b=r.width/r.height; let w=r.width,h=r.height,ox=0,oy=0; if(b>a){ w=r.height*a; ox=(r.width-w)/2; } else { h=r.width/a; oy=(r.height-h)/2; }
  const fx=(e.clientX-r.left-ox)/w, fz=(e.clientY-r.top-oy)/h; if(fx<0||fx>1||fz<0||fz>1) return; S.marker=[MAP.x0+fx*(MAP.x1-MAP.x0), MAP.z0+fz*(MAP.z1-MAP.z0)]; drawBigMap(); });
$('mapClose').onclick=hideMap; $('mapClear').onclick=()=>{ S.marker=null; drawBigMap(); };
$('lyFoto').onclick=()=>setLayer('foto'); $('lyPlano').onclick=()=>setLayer('plano');

/* ================= labels (drone view) ================= */
let POIS=[];
function buildPOIs(){
  POIS=W.POIS.map(p=>({n:p.n,p:[p.p[0],Math.max(p.p[1],W.terrain(p.p[0],p.p[2])+10),p.p[2]],far:!!p.far}));
  // mountain ranges: the highest cells of the regional relief to the north and to the south
  const R=W.reg; const band=(zlo,zhi,xlo,xhi)=>{ let best=null; for(let i=0;i<R.h;i++){ const z=R.z0+i*R.step; if(z<zlo||z>zhi) continue; for(let j=0;j<R.w;j++){ const x=R.x0+j*R.step; if(x<xlo||x>xhi) continue; const h=R.data[i*R.w+j]; if(!best||h>best.h) best={x,z,h}; } } return best; };
  for(const r of WP.ranges||[]){ const b=band(r.z[0],r.z[1],r.x?r.x[0]:-1e9,r.x?r.x[1]:1e9); if(b) POIS.push({n:r.n,p:[b.x,b.h+150,b.z],far:true}); }
  W.HOLES.forEach(H=>POIS.push({n:'Green '+holeLabel(H,true),p:[H.gx,H.gH+4,H.gz],small:true}));
  const box=$('labels'); box.innerHTML=''; POIS.forEach(p=>{ const el=document.createElement('div'); el.className='lab'+(p.far?' far':''); el.textContent=p.n; el.hidden=true; box.appendChild(el); p.el=el; });
}
const tmpV=new V3();
function project(x,y,z){ tmpV.set(x,y,z); tmpV.project(camera); if(tmpV.z>1) return null; return [(tmpV.x*0.5+0.5)*innerWidth,(-tmpV.y*0.5+0.5)*innerHeight,Math.abs(tmpV.x)<1.05&&Math.abs(tmpV.y)<1.05]; }
function updateLabels(){
  const show=S.mode==='drone';
  for(const p of POIS){ if(!show){ if(!p.el.hidden) p.el.hidden=true; continue; } const d=camera.position.distanceTo(tmpV.set(p.p[0],p.p[1],p.p[2])); const q=project(p.p[0],p.p[1],p.p[2]);
    if(!q||!q[2]||(p.small&&d>900)||(!p.far&&d>4500)){ p.el.hidden=true; continue; } p.el.hidden=false; p.el.style.transform='translate('+q[0]+'px,'+(q[1]-6)+'px) translate(-50%,-100%)'; }
}
function updateTags(){
  const bt=$('beaconTag'); let shown=false;
  if(S.mode==='walk'||S.mode==='drive'){
    const g=S.g; let tgt=null, txt='';
    if(g.hole>=0&&g.ballVisible){ tgt=[g.ball.x,g.ball.y+2,g.ball.z]; txt='Tu bola · '+fmt(Math.hypot(P.x-g.ball.x,P.z-g.ball.z))+' m'; }
    else if(g.hole<0&&g.next>=0&&playedIn()>0){ const H=W.HOLES[g.next]; tgt=[H.tx,W.terrain(H.tx,H.tz)+3,H.tz]; txt='Tee '+H.n+' · '+fmt(Math.hypot(P.x-H.tx,P.z-H.tz))+' m'; }
    if(tgt){ const q=project(tgt[0],tgt[1],tgt[2]); if(q&&q[2]){ shown=true; bt.style.transform='translate('+clamp(q[0],30,innerWidth-30)+'px,'+clamp(q[1],90,innerHeight-160)+'px) translate(-50%,-100%)'; $('beaconTxt').textContent=txt; } }
  }
  bt.hidden=!shown;
  const pt=$('pinTag'); const H=hole();
  if((S.mode==='aim'||S.mode==='swing'||S.mode==='flight')&&H){ const q=project(H.pin[0],W.terrain(H.pin[0],H.pin[1])+2.8,H.pin[1]); if(q){ pt.hidden=false; pt.style.transform='translate('+clamp(q[0],20,innerWidth-20)+'px,'+clamp(q[1],140,innerHeight-150)+'px) translate(-50%,-100%)'; $('pinTxt').textContent=fmt(distToPin())+' m'; } else pt.hidden=true; }
  else pt.hidden=true;
}
