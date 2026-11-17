/* ================= H2 · poderes de los disfraces: cada disfraz de H1 da un poder, en los dos mundos y con o sin la noche de Halloween ================= */
// Botón «Poder» (#bPow, encima de Esprint y Saltar), △ / Y del mando y tecla Q. Mientras dura, el modo es 'pow' y PW.k dice qué pasa:
// venda (colgado de la venda), vuelo (por el aire tras soltar la venda o tras el cañón), escoba, bat (murciélago), cape (planear con la capa),
// ghost (atravesar paredes), bones (huesos por el aire), roll (calabaza rodando) y cannon (apuntando con el cañón).
// H3 añade dos disfraces: wolf (el hombre lobo convertido en lobo), climb (la araña en una pared) y hilo (la araña bajando colgada de su hilo).
const PW_DEF={
  momia:{n:'Vendas para columpiarse',ic:'🧻',cd:0.8,
    how:'Lanza una venda a lo que tenga delante y por encima (una pared, un tejado o un árbol) y se columpia colgada de ella. <b>Poder</b> otra vez: se suelta con impulso, y en el aire puede lanzar otra para encadenar. <b>Mantén Saltar</b>: recoge la venda y sube; si está enganchada al borde de una azotea, te deja arriba. Sin nada a lo que agarrarse, la venda vuelve sola.'},
  bruja:{n:'Vuela en su escoba',ic:'🧹',cd:1.5,
    how:'Monta en la escoba de la espalda y vuela libre: <b>Subir</b> (Saltar) y <b>Bajar</b> (Esprint), joystick adelante para avanzar y a los lados para girar; si sueltas todo, se queda quieta en el aire. Va más deprisa y gira mejor que un helicóptero y deja una estela de chispas moradas. Se posa en cualquier sitio llano; <b>Poder</b> o <b>Acción</b> para aterrizar y bajarte. En una sala, un amigo puede subirse detrás.'},
  dracula:{n:'Se convierte en murciélago',ic:'🦇',cd:6,dur:25,
    how:'Una nube morada y Drácula se convierte en un murciélago grande que vuela bajo (hasta unos 22 m sobre el suelo) y rápido durante 25 segundos: <b>Subir</b>, <b>Bajar</b> y el joystick. Al acabar, o con <b>Poder</b>, vuelve a ser Drácula; si está alto, baja planeando con la capa. Además, con la capa <b>planea</b> si mantienes Saltar al caer desde alto.'},
  fantasma:{n:'Atraviesa paredes',ic:'👻',cd:5,dur:12,
    how:'Durante 12 segundos se vuelve transparente: flota, cae despacio y atraviesa paredes, puertas y árboles. <b>Mantén Saltar</b> para flotar hacia arriba. Si al acabar está dentro de algo, sale solo al sitio libre más cercano. Con este disfraz, las apariciones de Halloween no te asustan.'},
  esqueleto:{n:'Se desmonta y se vuelve a montar',ic:'💀',cd:2.5,
    how:'Los huesos saltan por el aire y el esqueleto se vuelve a montar hasta 20 m más allá, hacia donde mira, en un sitio libre y seco. Suena a huesos.'},
  calabaza:{n:'Rueda como una bola',ic:'🎃',cd:1.5,
    how:'Se hace bola y rueda: cuesta abajo acelera, rebota en las paredes, salta las rampas y las lomas y flota en el agua. El joystick la dirige y <b>Saltar</b> da un bote. Se para con <b>Poder</b> o sola cuando se queda quieta.'},
  pirata:{n:'Sale disparado de un cañón',ic:'💥',cd:3,
    how:'Aparece un cañón a su lado y el pirata se mete dentro. Joystick a los lados: girar; adelante y atrás: subir o bajar el cañón. Se ve el arco del disparo (bolas naranjas), su sombra en el suelo (puntos blancos) y un círculo donde caerías. <b>Disparar</b> con Poder, Saltar o Acción: sales volando hasta 120 m y al bajar se abre el planeador. <b>Guardar</b> (Esprint) quita el cañón sin disparar.'},
  lobo:{n:'Se convierte en lobo',ic:'🐺',cd:6,dur:30,
    how:'Una nube de humo gris y el hombre lobo se convierte en un lobo grande de cuatro patas durante 30 segundos (o hasta que pulses <b>Poder</b> otra vez). Corre mucho (unos 58 km/h, y con Esprint unos 72), <b>Saltar</b> da un salto largo de unos 9 m y también nada. Con <b>Acción</b> aúlla: la luna brilla un momento, las apariciones de Halloween que estén cerca huyen y los caballos relinchan. En la sala tus amigos ven el lobo y oyen el aullido.'},
  arana:{n:'Trepa por las paredes',ic:'🕷️',cd:1.2,
    how:'De frente a una pared, <b>Poder</b> la pega a ella: el joystick arriba y abajo trepa y a los lados va por la pared (también dobla las esquinas). Arriba del todo pasa a la azotea si la hay; <b>Saltar</b> la suelta con impulso hacia fuera y, en el aire, <b>Poder</b> cerca de otra pared se vuelve a agarrar. En el borde de una azotea, <b>Poder</b> baja colgada de un hilo que se ve: baja sola, el joystick atrás baja y adelante sube; si sueltas el joystick o pulsas Saltar, se para, y Poder otra vez la suelta. Sin pared delante ni borde, el botón lo dice.'}};
const PW_FLY={escoba:{vmax:44,acc:16,up:12,dn:11,yaw:2.3,r:0.7,alt:0},bat:{vmax:30,acc:20,up:9,dn:10,yaw:3.0,r:0.6,alt:22}};
const PW_G=22, PW_V0=Math.sqrt(120*PW_G), PW_RB=0.72, PW_BAT=25, PW_GHOST=12, PW_WOLF=30, PW_WS=2.0, PW_HAND=2.05;
var PW={hid:false,k:null,cos:'',t:0,dur:0,cd:0,cdM:1,from:'',a:null,L:0,ext:0,miss:null,br:null,bt:null,bn:null,rl:null,cn:null,cnOld:null,grp:null,M:{},fx:[],sp:null,spI:0,flap:0,ghR:null,gh:false,tipK:'',tipT:0,uiK:'',uiR:-1,seen:{},inB:null,wf:null,ar:null,hn:0,moonT:0,thOld:null};

/* ---- meshes, made the first time they are needed ---- */
function pwGrp(){ if(!PW.grp){ PW.grp=new THREE.Group(); PW.grp.name='pwFx'; scene.add(PW.grp); } return PW.grp; }
function pwRopeMesh(){ const g=new THREE.CylinderGeometry(0.032,0.032,1,6,1,true); g.translate(0,0.5,0); const m=new THREE.Mesh(g,hlMat('#efe4c8',{side:THREE.DoubleSide})); m.frustumCulled=false; m.visible=false; m.castShadow=true; return m; }
const _pwU=new V3(0,1,0), _pwD=new V3(), _pwQ=new THREE.Quaternion(), _pwE=new THREE.Euler(), _pwS=new V3(), _pwM=new THREE.Matrix4(), _pwP=new V3();
function pwRopeSet(m,x0,y0,z0,x1,y1,z1){ _pwD.set(x1-x0,y1-y0,z1-z0); const L=_pwD.length(); if(L<0.05){ m.visible=false; return; } m.visible=true; m.position.set(x0,y0,z0); m.quaternion.setFromUnitVectors(_pwU,_pwD.multiplyScalar(1/L)); m.scale.set(1,L,1); }
function pwBroomMesh(){ const g=new THREE.Group(), add=(geo,c,x,y,z,rz)=>{ const m=new THREE.Mesh(geo,hlMat(c)); m.position.set(x,y,z); if(rz) m.rotation.z=rz; m.castShadow=true; g.add(m); return m; };
  add(new THREE.CylinderGeometry(0.028,0.028,1.75,7),'#7a5230',0.22,0.6,0,Math.PI/2); add(new THREE.ConeGeometry(0.17,0.5,12),'#d6b25c',-0.85,0.6,0,-Math.PI/2); add(new THREE.CylinderGeometry(0.045,0.045,0.06,10),'#b8322a',-0.58,0.6,0,Math.PI/2);
  g.rotation.order='YXZ'; g.visible=false; return g; }
function pwBatMesh(){ const g=new THREE.Group(), inner=new THREE.Group(); g.add(inner); inner.scale.setScalar(1.5); const M=hlMat('#2b2030'), Mw=hlMat('#4b3560',{side:THREE.DoubleSide,emissive:Cc('#1c0f28')}), Me=new THREE.MeshBasicMaterial({color:Cc('#ff3b2f')});
  const add=(geo,m,x,y,z,sx,sy,sz)=>{ const o=new THREE.Mesh(geo,m); o.position.set(x,y,z); if(sx) o.scale.set(sx,sy,sz); o.castShadow=true; inner.add(o); return o; };
  add(new THREE.SphereGeometry(0.26,14,10),M,0,0,0,1.35,0.9,0.85); add(new THREE.SphereGeometry(0.16,12,9),M,0.36,0.07,0);
  for(const s of [-1,1]){ const e=add(new THREE.ConeGeometry(0.055,0.17,6),M,0.36,0.25,s*0.08); e.rotation.x=-s*0.25; add(new THREE.SphereGeometry(0.028,6,5),Me,0.49,0.1,s*0.06); add(new THREE.ConeGeometry(0.012,0.045,4),hlMat('#ffffff'),0.48,-0.02,s*0.03).rotation.z=Math.PI; }
  const sh=new THREE.Shape(); sh.moveTo(0.22,0); sh.lineTo(0.12,0.55); sh.lineTo(0.02,1.05); sh.lineTo(-0.12,1.35); sh.quadraticCurveTo(-0.2,1.05,-0.34,1.0); sh.quadraticCurveTo(-0.33,0.7,-0.46,0.62); sh.quadraticCurveTo(-0.4,0.34,-0.5,0.24); sh.quadraticCurveTo(-0.3,0.12,-0.26,0); sh.lineTo(0.22,0);
  const wg=new THREE.ShapeGeometry(sh,4); wg.rotateX(Math.PI/2); const W_=[];
  for(const s of [-1,1]){ const w=new THREE.Group(); w.position.set(0.02,0.06,s*0.16); w.scale.z=s; const m=new THREE.Mesh(wg,Mw); m.castShadow=true; w.add(m);
    for(const [a,b] of [[[0.12,0.55],[-0.12,1.35]],[[0.05,0.3],[-0.46,0.62]]]){ const L=Math.hypot(a[0]-b[0],a[1]-b[1]), bn=new THREE.Mesh(new THREE.CylinderGeometry(0.014,0.014,L,4),M); bn.position.set((a[0]+b[0])/2,0.01,(a[1]+b[1])/2); bn.rotation.set(0,-Math.atan2(b[1]-a[1],b[0]-a[0]),-Math.PI/2); w.add(bn); }
    inner.add(w); W_.push({w,s}); }
  g.userData.w=W_; g.rotation.order='YXZ'; g.visible=false; return g; }
function pwBatFlap(g,ph,amp){ for(const o of g.userData.w){ const a=(Math.sin(ph)*0.85+0.15)*amp+0.3; o.w.rotation.x=-o.s*a; } }
const PW_BONES=[['skull',1.62,0,0],['jaw',1.5,0.07,0],['ribs',1.3,0,0],['spine',1.12,-0.02,0],['pelvis',0.95,0,0],['bone',1.33,0,0.26],['bone',1.33,0,-0.26],['arm',1.02,0.04,0.3],['arm',1.02,0.04,-0.3],['bone',0.7,0,0.1],['bone',0.7,0,-0.1],['leg',0.28,0,0.1],['leg',0.28,0,-0.1]];
function pwBonesMesh(){ const g=new THREE.Group(), M=hlMat('#f1eee4'), Mk=hlMat('#151517'), G={skull:new THREE.SphereGeometry(0.14,12,9),jaw:new THREE.BoxGeometry(0.1,0.05,0.13),ribs:new THREE.TorusGeometry(0.17,0.025,5,14),spine:new THREE.CylinderGeometry(0.03,0.03,0.42,6),
    pelvis:new THREE.TorusGeometry(0.13,0.03,5,12),bone:new THREE.CylinderGeometry(0.025,0.025,0.36,6),arm:new THREE.CylinderGeometry(0.02,0.02,0.3,6),leg:new THREE.CylinderGeometry(0.026,0.026,0.4,6)};
  g.userData.b=PW_BONES.map(([k,y,x,z],i)=>{ const m=new THREE.Mesh(G[k],M); m.castShadow=true; g.add(m); if(k==='skull') for(const s of [-1,1]){ const e=new THREE.Mesh(new THREE.SphereGeometry(0.035,6,5),Mk); e.position.set(0.11,0.02,s*0.05); m.add(e); }
    const a=i*2.399, u=(i%5)/4-0.5; return {m,k,y,x,z,dx:Math.cos(a)*(0.7+0.5*Math.abs(u)),dy:0.6+((i*7)%5)*0.25,dz:Math.sin(a)*(0.7+0.5*Math.abs(u)),sx:3+((i*3)%4)*2.2,sy:2+((i*5)%3)*3,sz:4-((i*2)%3)*2}; });
  g.visible=false; return g; }
function pwCannonMesh(){ const g=new THREE.Group(), add=(par,geo,c,x,y,z,rx,ry,rz)=>{ const m=new THREE.Mesh(geo,hlMat(c)); m.position.set(x,y,z); m.rotation.set(rx||0,ry||0,rz||0); m.castShadow=true; par.add(m); return m; };
  add(g,new THREE.BoxGeometry(1.6,0.34,0.86),'#6b4423',-0.1,0.42,0); add(g,new THREE.BoxGeometry(0.9,0.42,0.12),'#5a391d',0.1,0.75,0.37); add(g,new THREE.BoxGeometry(0.9,0.42,0.12),'#5a391d',0.1,0.75,-0.37);
  for(const s of [-1,1]) for(const x of [-0.55,0.45]){ add(g,new THREE.CylinderGeometry(0.3,0.3,0.12,16),'#3d2a17',x,0.3,s*0.52,Math.PI/2); add(g,new THREE.CylinderGeometry(0.08,0.08,0.14,8),'#2a2a2c',x,0.3,s*0.6,Math.PI/2); }
  const bar=new THREE.Group(); bar.position.set(0.1,0.92,0); g.add(bar); const Mi='#2b2d31';
  add(bar,new THREE.CylinderGeometry(0.3,0.38,2.2,18,1,true),Mi,0.5,0,0,0,0,-Math.PI/2).material.side=THREE.DoubleSide; add(bar,new THREE.SphereGeometry(0.38,14,10,0,Math.PI*2,0,Math.PI/2),Mi,-0.6,0,0,0,0,Math.PI/2);
  add(bar,new THREE.TorusGeometry(0.31,0.06,6,18),'#3a3c41',1.58,0,0,0,Math.PI/2,0); add(bar,new THREE.TorusGeometry(0.36,0.035,6,18),'#c9a43a',0.0,0,0,0,Math.PI/2,0); add(bar,new THREE.CylinderGeometry(0.09,0.09,0.95,10),Mi,0,0,0,Math.PI/2);
  g.userData.bar=bar; g.visible=false; return g; }
function pwArcMeshes(){ const n=56, a=new THREE.InstancedMesh(new THREE.SphereGeometry(0.3,8,6),new THREE.MeshBasicMaterial({color:Cc('#ff8a1a')}),n), s=new THREE.InstancedMesh(new THREE.CircleGeometry(0.5,12).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.85,depthWrite:false}),n);
  a.frustumCulled=s.frustumCulled=false; a.count=s.count=0; const r=new THREE.Mesh(new THREE.RingGeometry(1.7,2.4,36).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:Cc('#ff8a1a'),transparent:true,opacity:0.9,depthWrite:false,side:THREE.DoubleSide}));
  const g=new THREE.Group(); g.add(a); g.add(s); g.add(r); g.visible=false; g.userData={a,s,r,n}; return g; }
function pwMesh(k){ const M=PW.M; if(M[k]) return M[k]; const g=pwGrp(); let m=null;
  if(k==='rope'){ m=pwRopeMesh(); } else if(k==='broom') m=pwBroomMesh(); else if(k==='bat') m=pwBatMesh(); else if(k==='bones') m=pwBonesMesh(); else if(k==='cannon') m=pwCannonMesh(); else if(k==='arc') m=pwArcMeshes(); else if(k==='wolf') m=pwWolfMesh(); else if(k==='thread') m=pwThreadMesh(); else if(k==='moon') m=pwMoonMesh();
  else if(k==='ball'){ m=new THREE.Group(); const p=hlPumpkin(PW_RB/0.74,0.3); p.position.y=0.02; m.add(p); m.userData.p=p; m.visible=false; m.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); }
  else if(k==='sparks'){ const n=90, geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3)); geo.setAttribute('color',new THREE.BufferAttribute(new Float32Array(n*3),3));
    const cv=document.createElement('canvas'); cv.width=cv.height=32; const c2=cv.getContext('2d'), gr=c2.createRadialGradient(16,16,0,16,16,16); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.35,'rgba(255,255,255,.75)'); gr.addColorStop(1,'rgba(255,255,255,0)'); c2.fillStyle=gr; c2.fillRect(0,0,32,32);
    m=new THREE.Points(geo,new THREE.PointsMaterial({size:0.26,map:new THREE.CanvasTexture(cv),vertexColors:true,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false})); m.frustumCulled=false; m.userData.p=Array.from({length:n},()=>({x:0,y:-9999,z:0,vx:0,vy:0,vz:0,t:9,c:[1,1,1]})); }
  g.add(m); return M[k]=m; }

/* ---- the costume you are wearing and whether its power can start now ---- */
function pwCos(){ const c=hlMyCos(); return c==='calabazo'?'calabaza':c; }
function pwDef(){ return PW_DEF[pwCos()]||null; }
function pwShown(){ return !!pwDef()&&(S.mode==='pow'||(['walk','glide'].includes(S.mode)&&!S.interior&&!HX.sit)); }
function pwWhyNot(c){ if(S.interior) return 'Dentro de una casa no hay poderes: sal al jardín'; if(HX.sit) return 'Levántate primero';
  if(typeof tgPlaying==='function'&&tgPlaying()) return 'En el pilla-pilla y el escondite no hay poderes'; if(raceNow()) return 'En plena carrera no hay poderes'; if(!['walk','glide'].includes(S.mode)) return 'Los poderes se usan a pie (o planeando)';
  if(P.swim&&!['bruja','dracula','lobo'].includes(c)) return 'Nadando no: sal del agua (la bruja, Drácula y el hombre lobo sí pueden)';
  if(['esqueleto','calabaza','pirata'].includes(c)&&(S.mode!=='walk'||!P.onGround)) return 'Hace falta estar con los pies en el suelo';
  if(c==='lobo'&&(S.mode!=='walk'||(!P.onGround&&!P.swim))) return 'Hace falta estar en el suelo (o nadando)';
  if(c==='arana'&&!pwSpEdge()&&!pwSpWall()) return 'Para trepar, ponte de frente a una pared (a un paso); para bajar con el hilo, ve al borde de una azotea';
  return ''; }
function pwTip(t,ms){ const now=performance.now(); if(t===PW.tipK&&now<PW.tipT) return; PW.tipK=t; PW.tipT=now+3500; tip(t,ms||2600); }
function pwFirst(k,t,ms){ if(PW.seen[k]) return; PW.seen[k]=1; tip(t,ms||5500); }
// the Poder button, △ / Y and Q
function pwPress(){ ensureAudio(); const c=pwCos(), D=PW_DEF[c];
  if(S.mode==='pow'&&PW.k){ pwAgain(); return; }
  if(!D){ toast('Sin poder','Ponte un disfraz de Halloween: cada uno tiene su poder (menú → Halloween → Disfraces, o la tienda)'); return; }
  const w=pwWhyNot(c); if(w){ pwTip(w); return; }
  if(PW.cd>0){ pwTip('Recargando el poder… '+Math.ceil(PW.cd)+' s'); return; }
  if(S.mode==='glide'&&glider) glider.visible=false; PW.cos=c; PW.t=0; PW.dur=0;
  if(c==='momia') pwVendaThrow(); else if(c==='bruja') pwBroomStart(); else if(c==='dracula') pwBatStart(); else if(c==='fantasma') pwGhostStart();
  else if(c==='esqueleto') pwBonesStart(); else if(c==='calabaza') pwRollStart(); else if(c==='pirata') pwCannonStart(); else if(c==='lobo') pwWolfStart(); else if(c==='arana') pwSpiderStart();
  if(typeof mtSupOn==='function') mtSupOn(); }
// the same button while the power is on
function pwAgain(){ const k=PW.k;
  if(k==='venda') pwVendaRelease(); else if(k==='vuelo'){ if(PW.cos==='momia'&&PW.from==='venda') pwVendaThrow(); else if(PW.from==='arana'){ const w=pwSpWall(2.3); if(w) pwClimbStart(w); else pwGlideNow(); } else pwGlideNow(); }
  else if(k==='escoba') pwBroomOff(true); else if(k==='bat') pwBatEnd(); else if(k==='cape'){ if(PW.cd>0) pwTip('El murciélago se recarga… '+Math.ceil(PW.cd)+' s'); else pwBatStart(); }
  else if(k==='ghost') pwGhostEnd(); else if(k==='roll') pwRollEnd(); else if(k==='cannon') pwFire(); else if(k==='wolf') pwWolfEnd(); else if(k==='climb'||k==='hilo') pwSpOff(); }
// ○ / B, Escape and «Guardar»
function pwBack(){ if(S.mode!=='pow') return; if(PW.k==='cannon') pwCannonCancel(); else if(PW.k==='escoba') pwBroomOff(true); else pwAgain(); }
function pwEnter(k){ PW.k=k; if(S.mode!=='pow') setMode('pow'); S.snap=false; }
// leave the power: back to walking (or swimming, or the glider), with the recharge time
function pwExit(mode,cd){ const D=PW_DEF[PW.cos]; pwClear(); const c=cd===undefined?(D?D.cd:1):cd; if(c>0){ PW.cd=c; PW.cdM=c; } setMode(mode||'walk'); }
// everything back as it was: the rig, the buttons and the meshes
function pwClear(){ PW.k=null; PW.a=null; PW.br=null; PW.bt=null; PW.bn=null; PW.rl=null; PW.wf=null; PW.ar=null; PW.dur=0; PW.inB=null; FL.dn=false;
  for(const k of ['rope','broom','bat','bones','ball','arc','wolf']) if(PW.M[k]) PW.M[k].visible=false; if(PW.M.thread&&!PW.thOld) PW.M.thread.visible=false;
  if(PW.cn&&PW.cn.ph!=='fired'){ pwPoof(PW.cn.x,PW.cn.y+0.8,PW.cn.z,'#9aa0a6'); if(PW.M.cannon) PW.M.cannon.visible=false; PW.cn=null; }
  if(rig){ rig.root.rotation.order='XYZ'; if(PW.hid){ PW.hid=false; rig.root.visible=!['menu','loading','plane'].includes(S.mode); } if(PW.gh) pwGhostLook(rig,false); PW.gh=false; PW.ghR=rig; const bb=rig.torso.getObjectByName('hlBroom'); if(bb) bb.visible=true; }
  const bj=$('bJump'), bs=$('bSprint'); if(bj&&S.mode!=='drive') bj.textContent='Saltar'; if(bs){ if(bs.textContent!=='Esprint'&&S.mode!=='fly') bs.textContent='Esprint'; bs.classList.remove('on'); } P.sprintLock=false; }

/* ---- sounds (synthesised, like the Halloween ones) ---- */
function pwSnd(k,vol){ if(!AC||!master) return; const t=AC.currentTime; vol=vol===undefined?1:vol; try{
  if(k==='whoosh'){ hlNoise(t,0.32,0.22*vol,1700,'bandpass',0.9); hlOsc('sine',300,900,t,0.22,0.03*vol); }
  else if(k==='release') hlOsc('triangle',480,960,t,0.2,0.07*vol);
  else if(k==='magic') [1319,1568,1976,2637,3136].forEach((f,i)=>hlOsc('sine',f,f*1.02,t+i*0.05,0.25,0.05*vol));
  else if(k==='poof') hlSnd('poof',vol); else if(k==='rattle') hlSnd('rattle',vol); else if(k==='boo') hlSnd('boo',vol*0.7); else if(k==='squeak') hlSnd('squeak',vol);
  else if(k==='boom'){ hlNoise(t,1.1,0.7*vol,420,'lowpass'); hlOsc('sine',130,38,t,0.7,0.4*vol); hlNoise(t+0.02,0.25,0.3*vol,2400,'bandpass',0.7); }
  else if(k==='clunk'){ hlNoise(t,0.14,0.35*vol,320); hlOsc('square',95,70,t,0.12,0.05*vol,320,2); }
  else if(k==='bounce') hlOsc('sine',230,110,t,0.16,0.14*vol);
  else if(k==='flap') hlNoise(t,0.08,0.06*vol,700,'lowpass');
  else if(k==='growl'){ hlNoise(t,0.7,0.16*vol,260,'lowpass',3); hlOsc('sawtooth',92,70,t,0.7,0.05*vol,380,3); }
  else if(k==='stick'){ hlNoise(t,0.09,0.2*vol,1100,'bandpass',2); hlOsc('sine',520,260,t,0.1,0.06*vol); }
  else if(k==='step') hlNoise(t,0.05,0.07*vol,1500,'bandpass',1.5);
  else if(k==='zip') hlOsc('sine',1500,620,t,0.28,0.035*vol);
  else if(k==='splash'){ hlNoise(t,0.5,0.35*vol,900,'lowpass'); hlNoise(t+0.05,0.3,0.14*vol,2600,'bandpass',0.8); }
  else if(k==='howl'){ // a wolf's howl: rises, holds with a tremble and falls away, with an echo
    for(const [d,g0] of [[0,1],[0.42,0.28]]){ const o=AC.createOscillator(), o2=AC.createOscillator(), f=AC.createBiquadFilter(), g=AC.createGain(), lf=AC.createOscillator(), lg=AC.createGain(), t0=t+d;
      o.type='sawtooth'; o2.type='sine'; f.type='lowpass'; f.frequency.value=1250; f.Q.value=5; lf.frequency.value=5.2; lg.gain.value=11; lf.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency);
      for(const [osc,m] of [[o,1],[o2,2]]){ osc.frequency.setValueAtTime(290*m,t0); osc.frequency.exponentialRampToValueAtTime(610*m,t0+0.5); osc.frequency.setValueAtTime(610*m,t0+1.05); osc.frequency.exponentialRampToValueAtTime(400*m,t0+1.95); }
      const v=0.13*vol*g0; g.gain.setValueAtTime(0.0001,t0); g.gain.exponentialRampToValueAtTime(v,t0+0.3); g.gain.setValueAtTime(v*0.85,t0+1.3); g.gain.exponentialRampToValueAtTime(0.0001,t0+2.05);
      const g2=AC.createGain(); g2.gain.value=0.35; o.connect(f); o2.connect(g2); g2.connect(f); f.connect(g); g.connect(master); for(const x of [o,o2,lf]){ x.start(t0); x.stop(t0+2.1); } } }
}catch(e){} }
// a puff of coloured smoke (changing shape, the cannon, getting out)
function pwPoof(x,y,z,c,r){ const m=new THREE.Mesh(new THREE.SphereGeometry(1,14,9),new THREE.MeshBasicMaterial({color:Cc(c||'#8e44ad'),transparent:true,opacity:0.7,depthWrite:false})); m.position.set(x,y,z); pwGrp().add(m); PW.fx.push({k:'poof',o:m,t:0,life:0.7,r:r||1.4}); }
function pwSpark(x,y,z,vx,vy,vz,c){ const S_=pwMesh('sparks'), p=S_.userData.p[PW.spI++%S_.userData.p.length]; p.x=x; p.y=y; p.z=z; p.vx=vx; p.vy=vy; p.vz=vz; p.t=0; p.life=0.6+Math.random()*0.5; p.c=c; }
function pwFx(dt){ for(let i=PW.fx.length-1;i>=0;i--){ const f=PW.fx[i]; f.t+=dt; const q=f.t/f.life; if(q>=1){ pwGrp().remove(f.o); f.o.geometry.dispose(); f.o.material.dispose(); PW.fx.splice(i,1); continue; }
    f.o.scale.setScalar(0.3+f.r*Math.sqrt(q)); f.o.material.opacity=0.7*(1-q); if(f.vy) f.o.position.y+=f.vy*dt; }
  const S_=PW.M.sparks; if(S_){ const P_=S_.geometry.attributes.position.array, C_=S_.geometry.attributes.color.array; let any=false;
    S_.userData.p.forEach((p,i)=>{ if(p.t<p.life){ any=true; p.t+=dt; p.vy-=1.2*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt; const k=Math.max(0,1-p.t/p.life); P_[i*3]=p.x; P_[i*3+1]=p.y; P_[i*3+2]=p.z; C_[i*3]=p.c[0]*k; C_[i*3+1]=p.c[1]*k; C_[i*3+2]=p.c[2]*k; } else { P_[i*3+1]=-9999; } });
    S_.geometry.attributes.position.needsUpdate=true; S_.geometry.attributes.color.needsUpdate=true; S_.visible=any; }
  // a bandage thrown at nothing comes back by itself
  if(PW.miss){ const M=PW.miss; M.t+=dt; const q=M.t/0.6, r=pwMesh('rope'); if(q>=1){ PW.miss=null; if(PW.k!=='venda') r.visible=false; }
    else { const L=Math.sin(q*Math.PI)*14, h=[P.x,P.y+1.9,P.z]; pwRopeSet(r,h[0],h[1],h[2],h[0]+Math.cos(M.yaw)*L*0.77,h[1]+L*0.64,h[2]+Math.sin(M.yaw)*L*0.77); } }
  // the cannon stays a moment after the shot, then it goes
  const C=PW.cnOld; if(C){ C.ft+=dt; const cm=PW.M.cannon, bar=cm.userData.bar; bar.position.x=0.1-0.35*Math.max(0,1-C.ft*3); if(C.ft>2.6){ const k=Math.max(0,1-(C.ft-2.6)/0.4); cm.scale.setScalar(k); if(k<=0){ cm.visible=false; cm.scale.setScalar(1); PW.cnOld=null; if(C.smoke) pwPoof(C.x,C.y+0.8,C.z,'#9aa0a6',1.2); } } } }

/* ================= 1 · momia: vendas para columpiarse ================= */
// a point to hang from, ahead and above: the edge of a roof or the top of a wall, or the canopy of a tree
function pwAnchor(){ const f=[Math.cos(camS.yaw),Math.sin(camS.yaw)], hx=P.x, hy=P.y+1.9, hz=P.z; let best=null; const seen=new Set();
  const take=(x,y,z,kind,ref)=>{ const dx=x-hx, dy=y-hy, dz=z-hz, h=Math.hypot(dx,dz), d=Math.hypot(h,dy); if(d<4||d>40||y-P.y<3.2) return; const dot=h<2.5?1:(dx*f[0]+dz*f[1])/h; if(dot<0.3) return;
    const sc=dot*2+Math.min(dy,18)/9-Math.abs(d-16)/14; if(!best||sc>best.sc) best={x,y,z,kind,ref,sc,d}; };
  for(let a=0;a<=40;a+=5) for(let l=-15;l<=15;l+=5){ const x=hx+f[0]*a-f[1]*l, z=hz+f[1]*a+f[0]*l;
    for(const b of bldsNear(x,z)){ if(seen.has(b)) continue; seen.add(b); if(!b.solid||b.top===undefined||b.top<P.y+3.2||!b.ring) continue; const e=nearestEdge(b,hx+f[0]*8,hz+f[1]*8), y=Math.min(b.top,hy+24); take(e[1],y,e[2],y>=b.top?'b':'w',{b,nx:e[3],nz:e[4]}); } }
  const cx=Math.floor(hx/20), cz=Math.floor(hz/20); for(let i=-2;i<=2;i++) for(let j=-2;j<=2;j++){ const tr=treeGrid.get((cx+i)+','+(cz+j)); if(!tr) continue; for(const t of tr) take(t.x,t.cy+t.ry*0.45,t.z,'t',t); }
  return best; }
function pwVendaThrow(){ const a=pwAnchor(); PW.cos='momia';
  if(!a){ PW.miss={t:0,yaw:camS.yaw}; pwSnd('whoosh'); pwTip('No hay nada a lo que agarrarse: acércate a una pared, un tejado o un árbol que tengas delante y por encima'); if(S.mode!=='pow'){ PW.cd=0.5; PW.cdM=0.5; } return false; }
  const hx=P.x, hy=P.y+1.9, hz=P.z, d=Math.hypot(a.x-hx,a.y-hy,a.z-hz); PW.a=a; PW.L=d; PW.ext=0; PW.t=0; PW.from='venda';
  // a tug towards the anchor starts the swing
  P.vx+=(a.x-hx)/d*6; P.vy=Math.max(P.vy,0)+(a.y-hy)/d*6; P.vz+=(a.z-hz)/d*6; P.onGround=false;
  pwEnter('venda'); pwSnd('whoosh');
  pwFirst('venda','Colgada de la venda: el joystick te columpia, mantén Saltar para recogerla y subir, y Poder te suelta con impulso (en el aire, Poder lanza otra)',6500); return true; }
function pwVendaStep(dt){ const A=PW.a; if(!A){ PW.k='vuelo'; return; } PW.t+=dt; PW.ext=Math.min(1,PW.ext+dt/0.16);
  const f=[Math.cos(camS.yaw),Math.sin(camS.yaw)], r=[-Math.sin(camS.yaw),Math.cos(camS.yaw)], wx=f[0]*inp.my+r[0]*inp.mx, wz=f[1]*inp.my+r[1]*inp.mx;
  P.vy-=PW_G*0.8*dt; P.vx+=wx*8*dt; P.vz+=wz*8*dt; const dm=Math.exp(-0.12*dt); P.vx*=dm; P.vz*=dm; P.vy*=dm;
  const reel=flUpHeld()&&PW.ext>=1; inp.jumpQ=false; if(reel){ const L0=PW.L; PW.L=Math.max(1.2,PW.L-13*dt); if(L0>1.25) P.vy=Math.max(P.vy,-2); }
  let hx=P.x+P.vx*dt, hy=P.y+1.9+P.vy*dt, hz=P.z+P.vz*dt;
  { const dx=hx-A.x, dy=hy-A.y, dz=hz-A.z, d=Math.hypot(dx,dy,dz); if(d>PW.L&&d>1e-3){ const ux=dx/d, uy=dy/d, uz=dz/d; hx=A.x+ux*PW.L; hy=A.y+uy*PW.L; hz=A.z+uz*PW.L; const vr=P.vx*ux+P.vy*uy+P.vz*uz; if(vr>0){ P.vx-=ux*vr; P.vy-=uy*vr; P.vz-=uz*vr; } } }
  let ny=hy-1.9; const res=collide(hx,hz,ny,0.36,false); if(Math.abs(res[0]-hx)+Math.abs(res[1]-hz)>1e-4){ const k=Math.exp(-6*dt); P.vx*=k; P.vz*=k; } hx=res[0]; hz=res[1];
  const g=groundAt(hx,hz,ny), wl=W.waterLevel(hx,hz);
  if(ny<=g){ ny=g; if(P.vy<0) P.vy=0; P.onGround=true; const fr=Math.exp(-3*dt); P.vx*=fr; P.vz*=fr; } else P.onGround=false;
  P.x=hx; P.y=ny; P.z=hz; const vh=Math.hypot(P.vx,P.vz); P.yaw=lerpAng(P.yaw,vh>1.5?Math.atan2(P.vz,P.vx):Math.atan2(A.z-P.z,A.x-P.x),1-Math.exp(-dt*6));
  if(vh>3&&performance.now()-camS.lastLook>1300) camS.yaw=lerpAng(camS.yaw,Math.atan2(P.vz,P.vx),1-Math.exp(-dt*1.1));
  if(terrainAt(P.x,P.z)<wl-1.15&&P.y<wl-1.2){ PW.a=null; P.y=wl-1.25; P.swim=true; P.vy=0; pwExit('walk'); return; }
  if(PW.L<2.4&&Math.hypot(P.x-A.x,P.y+1.9-A.y,P.z-A.z)<2.6){ pwVendaTop(); return; }
  if(PW.t>15) pwVendaRelease(); }
// at the top of the bandage: onto the roof if there is one, otherwise a hop over it
function pwVendaTop(){ const A=PW.a, b=A.kind==='b'&&A.ref.b; PW.a=null;
  if(b&&b.walkY!==undefined){ let x=A.x-A.ref.nx*1.2, z=A.z-A.ref.nz*1.2; if(!inBld(b,x,z)){ x=A.x-A.ref.nx*2.5; z=A.z-A.ref.nz*2.5; }
    if(inBld(b,x,z)){ P.x=x; P.z=z; P.y=groundAt(x,z,b.walkY+0.5); P.vx=P.vy=P.vz=0; P.onGround=true; blip('land'); pwSnd('release'); tip('¡Arriba del todo!',1800); pwExit('walk'); return; } }
  if(A.kind==='w'){ P.vx=A.ref.nx*1.5; P.vz=A.ref.nz*1.5; P.vy=6; PW.k='vuelo'; PW.from='venda'; pwSnd('release'); pwTip('Arriba de la pared: lanza otra venda (Poder) para seguir subiendo'); return; }
  P.vy=7.5; P.vx+=Math.cos(P.yaw)*3; P.vz+=Math.sin(P.yaw)*3; PW.k='vuelo'; PW.from='venda'; pwSnd('release'); }
// open the glider now, if there is height for it
function pwGlideNow(){ const g=groundAt(P.x,P.z,P.y), wl=W.waterLevel(P.x,P.z); if(P.y-Math.max(g,wl)<4){ pwTip('Muy bajo para abrir el planeador'); return; } const c=PW.from==='cannon'?PW_DEF.pirata.cd:PW_DEF.momia.cd; pwClear(); PW.cd=c; PW.cdM=c; openGlider(); }
function pwVendaRelease(){ if(!PW.a) return; PW.a=null; P.vx*=1.12; P.vz*=1.12; P.vy=Math.max(P.vy*1.1,0)+4.5; PW.k='vuelo'; PW.from='venda'; PW.t=0; pwSnd('release'); }
// in the air after the bandage or the cannon: falls, lands, or opens the glider
function pwVueloStep(dt){ const can=PW.from==='cannon'; PW.t+=dt;
  const f=[Math.cos(camS.yaw),Math.sin(camS.yaw)], r=[-Math.sin(camS.yaw),Math.cos(camS.yaw)], wx=f[0]*inp.my+r[0]*inp.mx, wz=f[1]*inp.my+r[1]*inp.mx, ac=can?2.5:5;
  P.vx+=wx*ac*dt; P.vz+=wz*ac*dt; P.vy-=PW_G*dt;
  // in short steps (0,3 m at most), so a fast shot cannot go through a wall; against a wall or a tree you bounce back a little
  const ns=Math.min(14,Math.max(1,Math.ceil(Math.hypot(P.vx,P.vy,P.vz)*dt/0.3))), h=dt/ns; let nx=P.x, nz=P.z, ny=P.y, g=0, wl=0, hit=0;
  for(let i=0;i<ns;i++){ const tx=nx+P.vx*h, tz=nz+P.vz*h; ny+=P.vy*h; const res=collide(tx,tz,ny,0.36,false), px=res[0]-tx, pz=res[1]-tz, pl=Math.hypot(px,pz);
    if(pl>1e-4){ const ux=px/pl, uz=pz/pl, vn=P.vx*ux+P.vz*uz; if(vn<0){ hit=Math.max(hit,Math.hypot(P.vx,P.vz)); P.vx-=1.35*vn*ux; P.vz-=1.35*vn*uz; P.vx*=0.6; P.vz*=0.6; } }
    nx=res[0]; nz=res[1]; g=groundAt(nx,nz,ny); wl=W.waterLevel(nx,nz); if(ny<=g||ny<=wl-1.2) break; }
  if(hit>6) blip('bump'); const alt=ny-Math.max(g,wl);
  P.x=nx; P.z=nz; const vh=Math.hypot(P.vx,P.vz); if(vh>1) P.yaw=Math.atan2(P.vz,P.vx); if(vh>3&&performance.now()-camS.lastLook>1000) camS.yaw=lerpAng(camS.yaw,P.yaw,1-Math.exp(-dt*(can?2.5:1.2)));
  const jq=inp.jumpQ; inp.jumpQ=false;
  if(P.vy<0&&((can&&alt<16&&alt>5)||(jq&&alt>5)||(!can&&P.vy<-16&&alt>20)||(PW.t>15&&alt>5))){ P.y=ny; pwClear(); PW.cd=(PW_DEF[PW.cos]||PW_DEF.momia).cd; PW.cdM=PW.cd; openGlider(); tip(can?'¡Se abre el planeador!':'Planeador abierto',1600); return; }
  if(terrainAt(nx,nz)<wl-1.15&&ny<=wl-1.2&&g<wl-1.15){ P.y=wl-1.25; P.swim=true; P.vy=0; P.onGround=false; pwExit('walk'); return; }
  if(ny<=g){ P.y=g; if(P.vy<-14) P.landT=0.3; P.vy=0; P.onGround=true; P.vx*=0.3; P.vz*=0.3; blip('land'); pwExit('walk'); return; }
  P.y=ny; P.onGround=false; }

/* ================= 2 · bruja: vuela en su escoba (y 3 · el murciélago de Drácula, con la misma física) ================= */
function pwWall(x,z,y,r){ for(const b of bldsNear(x,z)){ const bt=b.walkY!==undefined?b.walkY:b.top; if(!b.solid||bt===undefined||bt<=y+0.3||b.base>y+2.2) continue; if(x<b.x0-r||x>b.x1+r||z<b.z0-r||z>b.z1+r) continue; if(inBld(b,x,z)||nearestEdge(b,x,z)[0]<r) return true; }
  const tr=treeGrid.get(Math.floor(x/20)+','+Math.floor(z/20)); if(tr) for(const t of tr) if(y<t.cy-t.ry*0.4&&Math.hypot(x-t.x,z-t.z)<t.tr+r) return true; return false; }
function pwFlat(A,g){ for(const [a,b] of [[0.8,0],[-0.8,0],[0,0.7],[0,-0.7]]){ const h=flGround(A.x+a,A.z+b,A.y+0.5); if(FL.gk||Math.abs(h-g)>0.6) return false; } flGround(A.x,A.z,A.y+0.5); return !FL.gk; }
// like flPhys (g3fl.js): stick forward = speed, to the sides = turn, up and down; hands off = it hovers. With T.alt it is a bat: it never lands and stays low.
function pwFlyPhys(A,dt,th,st,up,T){
  if(A.gnd){ A.vf=0; A.vy=0; A.yr=0; A.bank*=Math.exp(-dt*6); A.pitch*=Math.exp(-dt*6); if(Math.abs(st)>0.2) A.yaw+=st*1.6*dt; if(up>0){ A.gnd=false; A.vy=2.5; blip('jump'); } else return; }
  const tv=th>=0?th*T.vmax:th*8; A.vf+=clamp(tv-A.vf,-T.acc*1.5*dt,T.acc*dt);
  const yr=st*T.yaw*(1-0.35*Math.min(1,Math.abs(A.vf)/T.vmax)); A.yr+=(yr-A.yr)*(1-Math.exp(-dt*6)); A.yaw+=A.yr*dt;
  const ty=up>0?T.up:up<0?-T.dn:0; A.vy+=clamp(ty-A.vy,-24*dt,24*dt);
  const wl0=W.waterLevel(A.x,A.z), base=Math.max(terrainAt(A.x,A.z),wl0), ceil=T.alt?base+T.alt:Math.max(wl0+FL.ceil,base+150), band=T.alt?4:25;
  if(A.vy>0&&A.y>ceil-band){ A.vy*=clamp((ceil-A.y)/band,0,1); if(A.y>ceil-1.5) pwTip(T.alt?'Los murciélagos vuelan bajo: no se sube más':'Techo de vuelo de la escoba'); }
  if(A.y>ceil) A.y-=(A.y-ceil)*Math.min(1,dt*2);
  const c=Math.cos(A.yaw), s=Math.sin(A.yaw), nx=A.x+c*A.vf*dt, nz=A.z+s*A.vf*dt;
  if(!flInWorld(nx,nz)){ A.vf*=-0.3; pwTip('Límite del mapa: da la vuelta'); }
  else if(pwWall(nx,nz,A.y,T.r)){ if(Math.abs(A.vf)>6) blip('bump'); A.vf*=-0.3; pwTip('Una pared: sube para pasar por encima'); }
  else { A.x=nx; A.z=nz; }
  const g=flGround(A.x,A.z,A.y), gk=FL.gk, ny=A.y+A.vy*dt, hov=T.alt?0.9:0;
  if(ny<=g+hov+0.02){ if(!T.alt&&A.vy<=0.01&&!gk&&Math.abs(A.vf)<10&&pwFlat(A,g)){ A.y=g; A.gnd=true; A.vy=0; A.vf=0; A.auto=false; blip('land'); }
    else { const lo=g+hov; A.y=Math.max(A.y,ny); if(A.y<lo) A.y=Math.min(lo,A.y+Math.max(16*dt,(lo-A.y)*0.25)); A.vy=Math.max(0,A.vy);
      if(!T.alt&&up<0&&Math.abs(A.vf)<10) pwTip(gk==='agua'?'Sobre el agua no se aterriza: busca tierra':gk==='árbol'?'Encima de un árbol no se aterriza':'Aquí no se puede aterrizar: busca un sitio llano'); A.noLand=true; } }
  else { A.y=ny; A.noLand=false; }
  A.bank+=(clamp(A.yr*0.32*(0.4+Math.abs(A.vf)/T.vmax),-0.55,0.55)-A.bank)*(1-Math.exp(-dt*5));
  A.pitch+=(clamp(-(tv-A.vf)*0.012-A.vf*0.004+A.vy*0.02,-0.3,0.25)-A.pitch)*(1-Math.exp(-dt*4)); }
function pwFlyInput(A){ let th=inp.my, st=inp.mx, up=(flUpHeld()?1:0)-(flDnHeld()?1:0); inp.jumpQ=false; if(P.sprintLock){ P.sprintLock=false; $('bSprint').classList.remove('on'); }
  if(A.auto){ if(Math.abs(th)>0.25||Math.abs(st)>0.25||up>0){ A.auto=false; A.off=false; } else { th=0; st=0; up=Math.abs(A.vf)<4?-1:0; if(A.noLand&&Math.abs(A.vf)<1){ A.auto=false; A.off=false; pwTip('Aquí no se puede aterrizar: llévala a un sitio llano y seco'); } } }
  return [th,st,up]; }
function pwFollow(A,dt){ P.x=A.x; P.y=A.y; P.z=A.z; P.yaw=A.yaw; P.vx=Math.cos(A.yaw)*A.vf; P.vz=Math.sin(A.yaw)*A.vf; P.vy=A.vy; P.onGround=!!A.gnd; P.swim=false;
  if(performance.now()-camS.lastLook>900&&(Math.abs(A.vf)>2||Math.abs(inp.mx)>0.2)) camS.yaw=lerpAng(camS.yaw,A.yaw,1-Math.exp(-dt*2.4)); }
function pwBroomStart(){ const A=PW.br={x:P.x,y:P.y,z:P.z,yaw:P.yaw,vf:0,vy:0,yr:0,bank:0,pitch:0,gnd:P.onGround&&!P.swim&&S.mode==='walk',auto:false,off:false,noLand:false};
  if(P.swim){ A.y=W.waterLevel(P.x,P.z)+0.8; A.vy=3; P.swim=false; } else if(!A.gnd){ A.vf=Math.min(20,Math.hypot(P.vx,P.vz)); }
  pwEnter('escoba'); pwPoof(P.x,P.y+0.8,P.z,'#8e44ad',1.1); pwSnd('magic');
  pwFirst('escoba','En la escoba: mantén Subir para despegar; joystick adelante avanza y a los lados gira; Bajar desciende; si sueltas todo, se queda quieta. Poder o Acción: aterrizar y bajarte',6500); }
function pwBroomStep(dt){ const A=PW.br; if(!A){ pwExit('walk',0); return; } const [th,st,up]=pwFlyInput(A); pwFlyPhys(A,dt,th,st,up,pwSupT(PW_FLY.escoba));
  if(A.gnd&&A.off){ pwBroomOff(false); return; } pwFollow(A,dt);
  // the purple sparks behind the brush
  const sp=Math.abs(A.vf); if(!A.gnd&&(sp>2||Math.abs(A.vy)>1)&&Math.random()<dt*(14+sp*1.6)){ const c=Math.cos(A.yaw), s=Math.sin(A.yaw), x=A.x-c*1.05, z=A.z-s*1.05; for(let i=0;i<2;i++) pwSpark(x+(Math.random()-0.5)*0.3,A.y+0.6+(Math.random()-0.5)*0.3,z+(Math.random()-0.5)*0.3,-c*sp*0.15+(Math.random()-0.5),Math.random()*0.6,-s*sp*0.15+(Math.random()-0.5),Math.random()<0.5?[0.75,0.3,1]:[1,0.45,0.9]); } }
// get off: in the air it lands by itself first
function pwBroomOff(btn){ const A=PW.br; if(!A) return; if(btn&&!A.gnd){ A.off=true; A.auto=true; tip('Aterrizando: frena y baja sola; al tocar el suelo te bajas. Mueve el joystick para seguir volando',3200); return; }
  const c=Math.cos(A.yaw), s=Math.sin(A.yaw); let x=A.x+s*0.9, z=A.z-c*0.9; if(bldAt(x,z,0.4)){ x=A.x; z=A.z; } P.x=x; P.z=z; P.y=groundAt(x,z,A.y+1); P.vx=P.vy=P.vz=0; P.onGround=true; pwPoof(A.x,A.y+0.6,A.z,'#8e44ad',0.9); pwSnd('poof',0.6); pwExit('walk'); }
// Drácula's bat: 25 s, low and fast; then Drácula again (gliding with the cape if he is high)
function pwBatStart(){ const wl=W.waterLevel(P.x,P.z), A=PW.bt={x:P.x,y:P.swim?wl+1.2:P.y+(P.onGround?1.4:0.6),z:P.z,yaw:P.yaw,vf:Math.min(18,Math.hypot(P.vx,P.vz)),vy:2,yr:0,bank:0,pitch:0,gnd:false,auto:false};
  P.swim=false; PW.t=0; PW.dur=PW_BAT; PW.cos='dracula'; pwEnter('bat'); pwPoof(P.x,P.y+1,P.z,'#6a2c91',1.6); pwSnd('poof'); pwSnd('squeak',0.7);
  pwFirst('bat','¡Murciélago! 25 segundos de vuelo bajo y rápido: Subir y Bajar, y el joystick. Poder: volver a ser Drácula',6000); }
function pwBatStep(dt){ const A=PW.bt; if(!A){ pwExit('walk',0); return; } PW.t+=dt; const [th,st,up]=pwFlyInput(A); A.auto=false; pwFlyPhys(A,dt,th,st,up,pwSupT(PW_FLY.bat)); pwFollow(A,dt);
  const fast=Math.abs(A.vf)/PW_FLY.bat.vmax, ph0=PW.flap; PW.flap+=dt*(9+7*(up>0?1:0)+4*fast); if(Math.floor(ph0/Math.PI/2)!==Math.floor(PW.flap/Math.PI/2)) pwSnd('flap',0.5);
  if(PW.t>=(PW.dur||PW_BAT)) pwBatEnd(); }
function pwBatEnd(){ const A=PW.bt; if(!A) return; pwPoof(A.x,A.y+0.4,A.z,'#6a2c91',1.4); pwSnd('poof'); P.x=A.x; P.y=A.y-0.4; P.z=A.z; P.vx=Math.cos(A.yaw)*A.vf*0.6; P.vz=Math.sin(A.yaw)*A.vf*0.6; P.vy=0; PW.bt=null;
  const g=groundAt(P.x,P.z,P.y), wl=W.waterLevel(P.x,P.z), alt=P.y-Math.max(g,wl); PW.cd=PW_DEF.dracula.cd; PW.cdM=PW.cd;
  if(alt>2.2){ PW.k='cape'; PW.dur=0; tip('Vuelves a ser Drácula: bajas planeando con la capa',2400); return; }
  P.y=Math.max(g,P.y); pwExit('walk',PW_DEF.dracula.cd); tip('Vuelves a ser Drácula',1800); }
// Drácula's cape: hold Saltar while falling from high up
function pwCapeStart(){ PW.cos='dracula'; PW.t=0; PW.dur=0; pwEnter('cape'); pwFirst('cape','Drácula planea con la capa: joystick para dirigirte; aterriza donde quieras',4500); }
function pwCapeStep(dt){ const f=[Math.cos(camS.yaw),Math.sin(camS.yaw)], r=[-Math.sin(camS.yaw),Math.cos(camS.yaw)], mag=Math.min(1,Math.hypot(inp.mx,inp.my)); inp.jumpQ=false;
  if(mag>0.1){ const wx=f[0]*inp.my+r[0]*inp.mx, wz=f[1]*inp.my+r[1]*inp.mx; P.yaw=lerpAng(P.yaw,Math.atan2(wz,wx),1-Math.exp(-dt*2.6)); }
  const fwd=mag>0.1?Math.max(0,inp.my):0, sp=8.5+5*fwd; P.vx+=(Math.cos(P.yaw)*sp-P.vx)*Math.min(1,dt*1.6); P.vz+=(Math.sin(P.yaw)*sp-P.vz)*Math.min(1,dt*1.6); P.vy+=(-(2.6+1.6*fwd)-P.vy)*Math.min(1,dt*2.2);
  let nx=P.x+P.vx*dt, nz=P.z+P.vz*dt, ny=P.y+P.vy*dt; const res=collide(nx,nz,ny,0.4,false); nx=res[0]; nz=res[1]; P.x=nx; P.z=nz; P.y=ny;
  if(performance.now()-camS.lastLook>1000) camS.yaw=lerpAng(camS.yaw,P.yaw,1-Math.exp(-dt*1.2));
  const g=groundAt(nx,nz,ny), wl=W.waterLevel(nx,nz); if(ny<=Math.max(g,wl)+0.02){ if(g<wl-1.15){ P.y=wl-1.25; P.swim=true; } else P.y=g; P.vy=0; P.onGround=!P.swim; blip('land'); pwExit('walk',0); } }

/* ================= 4 · fantasma: atraviesa paredes ================= */
// see-through: every material of the rig (they belong to that rig), remembering how it was
function pwGhostLook(R,on){ if(!R) return; R.body.traverse(o=>{ if(!o.isMesh) return; for(const m of Array.isArray(o.material)?o.material:[o.material]){ if(!m) continue;
    if(on){ if(!m.userData.pwG) m.userData.pwG=[m.transparent,m.opacity,m.depthWrite]; m.transparent=true; m.opacity=0.42; m.depthWrite=false; m.needsUpdate=true; }
    else if(m.userData.pwG){ const q=m.userData.pwG; m.transparent=q[0]; m.opacity=q[1]; m.depthWrite=q[2]; delete m.userData.pwG; m.needsUpdate=true; } } }); }
function pwGhostStart(){ PW.t=0; PW.dur=PW_GHOST; PW.inB=null; P.onGround=false; pwEnter('ghost'); pwSnd('boo'); pwFirst('ghost','¡Fantasma! 12 segundos atravesando paredes, puertas y árboles. Mantén Saltar para flotar hacia arriba. Poder: volver',5500); }
function pwGhostStep(dt){ PW.t+=dt; const f=[Math.cos(camS.yaw),Math.sin(camS.yaw)], r=[-Math.sin(camS.yaw),Math.cos(camS.yaw)], mag=Math.min(1,Math.hypot(inp.mx,inp.my)), wx=f[0]*inp.my+r[0]*inp.mx, wz=f[1]*inp.my+r[1]*inp.mx, wl_=Math.hypot(wx,wz)||1;
  if(mag>0.93) P.stickHold+=dt; else P.stickHold=0; const sprint=(P.sprintLock||inp.keys.ShiftLeft||inp.keys.ShiftRight||P.stickHold>0.35)&&mag>0.3, sp=(sprint?10:6.8)*Math.min(1,mag*1.15);
  const tvx=mag>0.08?wx/wl_*sp:0, tvz=mag>0.08?wz/wl_*sp:0, k=1-Math.exp(-dt*5); P.vx+=(tvx-P.vx)*k; P.vz+=(tvz-P.vz)*k; if(mag>0.1) P.yaw=lerpAng(P.yaw,Math.atan2(wz,wx),1-Math.exp(-dt*10));
  inp.jumpQ=false; if(flUpHeld()) P.vy+=(3.2-P.vy)*Math.min(1,dt*4); else P.vy=Math.max(-2.2,P.vy-6*dt);
  let nx=P.x+P.vx*dt, nz=P.z+P.vz*dt, ny=P.y+P.vy*dt; if(!dsInWorld(nx,nz)){ nx=P.x; nz=P.z; P.vx=P.vz=0; }
  const wl=W.waterLevel(nx,nz), g=Math.max(groundAt(nx,nz,ny),terrainAt(nx,nz)<wl?wl+0.05:-1e9), top=Math.max(terrainAt(nx,nz),wl)+9;
  if(ny<=g){ ny=g; if(P.vy<0) P.vy=0; P.onGround=true; } else P.onGround=false; if(ny>top){ ny=top; P.vy=Math.min(0,P.vy); }
  P.x=nx; P.y=ny; P.z=nz; P.swim=false;
  const b=bldAt(P.x,P.z,0); const inB=b&&P.y<(b.walkY!==undefined?b.walkY:b.top)?b:null; if(inB&&inB!==PW.inB){ pwSnd('whoosh',0.7); pwTip('Atravesando una pared…',1500); } PW.inB=inB;
  if(PW.t>=(PW.dur||PW_GHOST)) pwGhostEnd(); }
// back to flesh and bone: if that leaves you inside a wall or a tree, out to the nearest free spot
function pwGhostEnd(){ const v={k:'walk',o:P}, g=groundAt(P.x,P.z,P.y+0.5); let moved=false; PW.inB=null;
  const bb=bldAt(P.x,P.z,0.25), stuck=(!!bb&&P.y<(bb.walkY!==undefined?bb.walkY:bb.top)-0.3)||dsPenAt(P.x,P.z,g,0.25,0.2)>1e-4;
  if(stuck){ const s=dsFind(v,null); if(s){ dsPlace(v,s); moved=true; } }
  if(rig) pwGhostLook(rig,false); PW.gh=false; pwSnd('poof',0.6); P.vy=Math.min(P.vy,0);
  pwExit('walk'); if(moved) toast('Vuelves a ser de carne y hueso','Estabas dentro de algo: has salido al sitio libre más cercano'); else tip('Vuelves a ser de carne y hueso',1800); }

/* ================= 5 · esqueleto: se desmonta y se vuelve a montar más allá ================= */
function pwBonesStart(){ const v={k:'walk',o:P}, h=P.yaw; let tg=null;
  // the bones fly over low walls, not through a house: every metre of the arc must be above what is under it
  const clear=(d,y1)=>{ const H=2.5+d*0.22; for(let s=1;s<d;s+=1){ const q=s/d, x=P.x+Math.cos(h)*s, z=P.z+Math.sin(h)*s, y=P.y+(y1-P.y)*q+4*H*q*(1-q)+0.6, b=bldAt(x,z,0.3); if(b&&y<(b.walkY!==undefined?b.walkY:b.top)+0.3) return false; } return true; };
  for(let d=20;d>=3;d-=1){ const x=P.x+Math.cos(h)*d, z=P.z+Math.sin(h)*d; if(dsSpot(v,x,z)&&!bldAt(x,z,0.4)&&dsFits(v,x,z,h,0.15)&&clear(d,groundAt(x,z,P.y+12))){ tg={x,z,d}; break; } }
  if(!tg){ pwTip('No hay sitio libre y seco delante: gira o apártate de la pared'); return; }
  PW.bn={x0:P.x,y0:P.y,z0:P.z,x1:tg.x,y1:groundAt(tg.x,tg.z,P.y+12),z1:tg.z,d:tg.d,yaw:h,t:0}; const B=pwMesh('bones'); B.visible=true; pwEnter('bones'); pwSnd('rattle'); pwBonesPlace(0); }
function pwBonesBase(B,t){ const T1=0.28, T2=1.08; if(t<T1) return [B.x0,B.y0,B.z0]; if(t>=T2) return [B.x1,B.y1,B.z1]; const q=(t-T1)/(T2-T1), H=2.5+B.d*0.22;
  return [B.x0+(B.x1-B.x0)*q,B.y0+(B.y1-B.y0)*q+4*H*q*(1-q),B.z0+(B.z1-B.z0)*q]; }
function pwBonesPlace(t,B,M,yaw){ B=B||PW.bn; M=M||PW.M.bones; if(!B||!M) return; const T1=0.28, T2=1.08, T3=1.35, base=pwBonesBase(B,t), c=Math.cos(yaw===undefined?B.yaw:yaw), s=Math.sin(yaw===undefined?B.yaw:yaw);
  const amp=t<T1?1.3*Math.sin(Math.PI/2*t/T1):t<T2?1.3:1.3*(1-Math.min(1,(t-T2)/(T3-T2))), sc=t<T1?1-0.6*t/T1:t<T2?0.4:0.4+0.6*Math.min(1,(t-T2)/(T3-T2)), spin=t<T2?1:Math.max(0,1-(t-T2)/(T3-T2));
  for(const b of M.userData.b){ const lx=b.x*sc, lz=b.z*sc, wx=base[0]+c*lx-s*lz+(b.dx*c-b.dz*s)*amp, wz=base[2]+s*lx+c*lz+(b.dx*s+b.dz*c)*amp, wy=base[1]+b.y*sc+(1-sc)*0.9+b.dy*amp*0.8;
    b.m.position.set(wx,wy,wz); const a=t*spin; b.m.rotation.set((b.k==='ribs'||b.k==='pelvis'?Math.PI/2:0)+b.sx*a,-(yaw===undefined?B.yaw:yaw)+b.sy*a,b.sz*a); } return base; }
function pwBonesStep(dt){ const B=PW.bn; if(!B){ pwExit('walk',0); return; } B.t+=dt; inp.jumpQ=false; const base=pwBonesPlace(B.t);
  P.x=base[0]; P.y=base[1]; P.z=base[2]; P.vx=P.vy=P.vz=0; P.onGround=false; if(Math.abs(B.t-1.08)<dt*0.6) pwSnd('rattle',0.8);
  if(B.t>=1.35){ P.x=B.x1; P.z=B.z1; P.y=B.y1; P.yaw=B.yaw; P.onGround=true; tip('¡Montado otra vez, '+Math.round(B.d)+' m más allá!',1800); pwExit('walk'); } }

/* ================= 6 · calabaza: rueda como una bola ================= */
function pwRollStart(){ const g=groundAt(P.x,P.z,P.y+0.5); PW.rl={x:P.x,y:g+PW_RB,z:P.z,vx:P.vx,vy:0,vz:P.vz,q:new THREE.Quaternion(),gp:g,t:0,still:0,water:false};
  pwMesh('ball').visible=true; pwEnter('roll'); pwPoof(P.x,P.y+0.8,P.z,'#f07f1e',1.2); pwSnd('poof');
  pwFirst('roll','¡A rodar! Cuesta abajo aceleras; el joystick te dirige y Saltar da un bote. Poder: parar',5000); }
function pwRollStep(dt){ const B=PW.rl, R=PW_RB; if(!B){ pwExit('walk',0); return; } B.t+=dt;
  const f=[Math.cos(camS.yaw),Math.sin(camS.yaw)], r=[-Math.sin(camS.yaw),Math.cos(camS.yaw)], wx=f[0]*inp.my+r[0]*inp.mx, wz=f[1]*inp.my+r[1]*inp.mx;
  const G=(x,z)=>groundAt(x,z,B.y-R+0.5), g0=G(B.x,B.z), onG=B.y-R<=g0+0.06||B.water; let ax=wx*(B.water?3:7.5), az=wz*(B.water?3:7.5);
  if(onG&&!B.water){ const e=0.6, gx=(G(B.x+e,B.z)-G(B.x-e,B.z))/(2*e), gz=(G(B.x,B.z+e)-G(B.x,B.z-e))/(2*e), n=Math.sqrt(1+gx*gx+gz*gz); ax-=15.7*gx/n; az-=15.7*gz/n; const fr=Math.exp(-0.4*dt), vh=Math.hypot(B.vx,B.vz), rr=vh>1e-4?Math.max(0,vh-1.1*dt)/vh:0; B.vx*=fr*rr; B.vz*=fr*rr; }
  if(inp.jumpQ){ inp.jumpQ=false; if(onG){ B.vy=7.2; B.water=false; blip('jump'); } }
  B.vx+=ax*dt; B.vz+=az*dt; const vh0=Math.hypot(B.vx,B.vz); if(vh0>26){ B.vx*=26/vh0; B.vz*=26/vh0; } B.vy-=PW_G*dt;
  let nx=B.x+B.vx*dt, nz=B.z+B.vz*dt, ny=B.y+B.vy*dt; const res=collide(nx,nz,ny-R,R*0.9,false), px=res[0]-nx, pz=res[1]-nz, pl=Math.hypot(px,pz);
  if(pl>1e-4){ const ux=px/pl, uz=pz/pl, vn=B.vx*ux+B.vz*uz; if(vn<0){ B.vx-=1.45*vn*ux; B.vz-=1.45*vn*uz; if(-vn>4){ blip('bump'); pwSnd('bounce',0.6); } } }
  nx=res[0]; nz=res[1]; if(res[2]>-1e8&&res[2]>ny-R&&res[2]-(ny-R)<0.62) ny=res[2]+R;
  if(!dsInWorld(nx,nz)){ nx=B.x; nz=B.z; B.vx*=-0.5; B.vz*=-0.5; }
  const g=groundAt(nx,nz,ny-R+0.5), wl=W.waterLevel(nx,nz);
  if(terrainAt(nx,nz)<wl-0.4&&g<wl&&ny-R*0.6<wl){ ny=wl+R*0.35; B.vy=Math.max(0,B.vy*0.2); const d=Math.exp(-1.6*dt); B.vx*=d; B.vz*=d; if(!B.water) pwSnd('bounce',0.4); B.water=true; B.gp=wl; }
  else { B.water=false; if(ny-R<=g){ if(B.vy<-5){ B.vy=-B.vy*0.38; pwSnd('bounce'); } else B.vy=clamp((g-B.gp)/Math.max(dt,1e-3),0,9); ny=g+R; } B.gp=g; }
  const vh=Math.hypot(B.vx,B.vz); if(vh>1e-3){ _pwD.set(B.vz/vh,0,-B.vx/vh); _pwQ.setFromAxisAngle(_pwD,vh*dt/R); B.q.premultiply(_pwQ); }
  B.x=nx; B.y=ny; B.z=nz; const M=pwMesh('ball'); M.position.set(B.x,B.y,B.z); M.quaternion.copy(B.q);
  P.x=B.x; P.y=B.y-R; P.z=B.z; P.vx=B.vx; P.vz=B.vz; P.vy=B.vy; P.onGround=onG; if(vh>0.5) P.yaw=Math.atan2(B.vz,B.vx);
  if(vh>2.5&&performance.now()-camS.lastLook>1100) camS.yaw=lerpAng(camS.yaw,P.yaw,1-Math.exp(-dt*1.6));
  if(B.t>2&&vh<0.35&&onG&&!B.water&&Math.abs(B.vy)<0.5) B.still+=dt; else B.still=0; if(B.still>1.2) pwRollEnd(); }
function pwRollEnd(){ const B=PW.rl; if(!B) return; const wl=W.waterLevel(B.x,B.z); pwPoof(B.x,B.y,B.z,'#f07f1e',1.1); pwSnd('poof',0.7);
  P.x=B.x; P.z=B.z; P.vx=B.vx*0.5; P.vz=B.vz*0.5; P.vy=0; if(B.water){ P.y=wl-1.25; P.swim=true; P.onGround=false; } else { P.y=groundAt(B.x,B.z,B.y); P.onGround=true; } pwExit('walk'); }

/* ================= 7 · pirata: cañón ================= */
function pwCnDir(C){ const ce=Math.cos(C.el); return [ce*Math.cos(C.yaw),Math.sin(C.el),ce*Math.sin(C.yaw)]; }
function pwMuzzle(C){ const d=pwCnDir(C); return [C.x+Math.cos(C.yaw)*0.1+d[0]*1.6,C.y+0.92+d[1]*1.6,C.z+Math.sin(C.yaw)*0.1+d[2]*1.6]; }
function pwCnPlace(C,M){ M=M||PW.M.cannon; M.visible=true; M.position.set(C.x,C.y,C.z); M.rotation.set(0,-C.yaw,0); M.userData.bar.rotation.z=C.el; }
function pwCannonStart(){ const h=camS.yaw, sx=-Math.sin(h), sz=Math.cos(h); let x=P.x+sx*1.5, z=P.z+sz*1.5;
  if(bldAt(x,z,0.9)||!dsSpot({k:'walk',o:P},x,z)){ x=P.x-sx*1.5; z=P.z-sz*1.5; if(bldAt(x,z,0.9)||!dsSpot({k:'walk',o:P},x,z)){ x=P.x; z=P.z; } }
  if(PW.cnOld){ PW.M.cannon.visible=false; PW.M.cannon.scale.setScalar(1); PW.cnOld=null; }
  const C=PW.cn={x,y:groundAt(x,z,P.y+1),z,yaw:h,el:0.7,t:0,ph:'aim',ft:0,range:0}; pwCnPlace(C,pwMesh('cannon')); pwMesh('arc').visible=true; pwPoof(x,C.y+0.9,z,'#d9b23a',1.2); pwSnd('clunk'); pwSnd('poof',0.5);
  pwEnter('cannon'); pwArc(C); pwFirst('cannon','Al cañón: joystick a los lados gira, adelante y atrás sube o baja el cañón. Disparar: Poder, Saltar o Acción. Guardar (Esprint): sin disparar',6500); }
// where the shot goes: the arc in the air (orange balls), its shadow on the ground (white dots) and the ring where you would come down
function pwArc(C){ const A=pwMesh('arc'), U=A.userData, d=pwCnDir(C), m=pwMuzzle(C); let x=m[0], y=m[1], z=m[2], vx=d[0]*PW_V0, vy=d[1]*PW_V0, vz=d[2]*PW_V0, n=0, hit=null, dt=0.07, k=0;
  for(let i=0;i<120;i++){ x+=vx*dt; z+=vz*dt; vy-=PW_G*dt; y+=vy*dt; const g=groundAt(x,z,y), wl=W.waterLevel(x,z), gg=Math.max(g,wl); const b=bldAt(x,z,0); const bh=b&&y<(b.walkY!==undefined?b.walkY:b.top)-0.3;
    if(y<=gg||bh){ hit=[x,bh?groundAt(x,z,9999):gg,z,!!bh]; break; } if(i%2===0&&n<U.n){ _pwM.makeTranslation(x,y,z); U.a.setMatrixAt(n,_pwM); _pwM.makeTranslation(x,gg+0.08,z); U.s.setMatrixAt(n,_pwM); n++; } }
  U.a.count=n; U.s.count=n; U.a.instanceMatrix.needsUpdate=true; U.s.instanceMatrix.needsUpdate=true;
  if(hit){ U.r.visible=true; U.r.position.set(hit[0],hit[1]+0.12,hit[2]); U.r.material.color.copy(Cc(hit[3]?'#d6442a':'#ff8a1a')); C.range=Math.hypot(hit[0]-C.x,hit[2]-C.z); C.wall=hit[3]; } else { U.r.visible=false; C.range=Math.hypot(x-C.x,z-C.z); C.wall=false; } }
// you, inside the barrel: head out of the muzzle
function pwInBarrel(R,C){ const d=pwCnDir(C), m=pwMuzzle(C); poseRig(R,'glide',T,0); R.root.rotation.order='YXZ'; R.root.rotation.set(0,-C.yaw,-(Math.PI/2-C.el)); R.root.position.set(m[0]-d[0]*1.75,m[1]-d[1]*1.75,m[2]-d[2]*1.75); }
function pwCannonStep(dt){ const C=PW.cn; if(!C){ pwExit('walk',0); return; } C.t+=dt;
  C.yaw+=inp.mx*1.1*dt; C.el=clamp(C.el+inp.my*0.7*dt,0.3,1.15); if(performance.now()-camS.lastLook>700) camS.yaw=lerpAng(camS.yaw,C.yaw,1-Math.exp(-dt*6));
  pwCnPlace(C); pwArc(C); const m=pwMuzzle(C), d=pwCnDir(C); P.x=m[0]-d[0]*1.75; P.y=m[1]-d[1]*1.75; P.z=m[2]-d[2]*1.75; P.yaw=C.yaw; P.vx=P.vy=P.vz=0; P.onGround=true;
  if(inp.jumpQ){ inp.jumpQ=false; if(C.t>0.25) pwFire(); } }
function pwFire(){ const C=PW.cn; if(!C||C.ph!=='aim') return; const d=pwCnDir(C), m=pwMuzzle(C);
  const sx=m[0]-d[0]*0.9, sy=m[1]-d[1]*0.9, sz=m[2]-d[2]*0.9, ob=bldAt(sx,sz,0.4), wb=ob&&sy<(ob.walkY!==undefined?ob.walkY:ob.top); if(!wb){ P.x=sx; P.y=sy; P.z=sz; } P.vx=d[0]*PW_V0; P.vy=d[1]*PW_V0; P.vz=d[2]*PW_V0; P.yaw=C.yaw; P.onGround=false;
  C.ph='fired'; C.ft=0; C.smoke=true; PW.cnOld=C; PW.cn=null; if(PW.M.arc) PW.M.arc.visible=false;
  pwPoof(m[0],m[1],m[2],'#cfd3d6',2.2); pwPoof(m[0]+d[0]*1.2,m[1]+d[1]*1.2,m[2]+d[2]*1.2,'#ffb347',1.1); pwSnd('boom'); PW.k='vuelo'; PW.from='cannon'; PW.t=0; tip('¡Fuego! El planeador se abre al bajar',2000); }
function pwCannonCancel(){ const C=PW.cn; if(C){ const sx=-Math.sin(C.yaw), sz=Math.cos(C.yaw); let x=C.x-sx*1.4, z=C.z-sz*1.4; if(bldAt(x,z,0.4)) { x=C.x; z=C.z; } P.x=x; P.z=z; P.y=groundAt(x,z,C.y+1); P.vx=P.vy=P.vz=0; P.onGround=true; }
  pwExit('walk',1); tip('Cañón guardado',1500); }

/* ================= H3 · 8 · hombre lobo: se convierte en un lobo grande de cuatro patas ================= */
// the wolf: own design (grey, light belly and chest, yellow eyes, pointed ears, bushy tail), about 1,3 m at the shoulder; faces +x like the rig
function pwWolfMesh(){ const root=new THREE.Group(), body=new THREE.Group(); root.add(body); body.scale.setScalar(PW_WS);
  const C='#77716a', D='#4b4640', L='#bdb6a9', R_='#8f8980', Y=0.1, sph=(g,c,x,y,z,sx,sy,sz,o)=>{ const m=new THREE.Mesh(new THREE.SphereGeometry(0.5,14,10),hlMat(c,o)); m.position.set(x,y,z); m.scale.set(sx,sy,sz); m.castShadow=true; g.add(m); return m; };
  sph(body,C,0,0.46+Y,0,0.66,0.28,0.25); sph(body,D,-0.03,0.55+Y,0,0.5,0.12,0.19); sph(body,R_,0.2,0.5+Y,0,0.36,0.36,0.3); sph(body,C,-0.23,0.47+Y,0,0.3,0.27,0.24); sph(body,L,0.03,0.37+Y,0,0.48,0.12,0.18); sph(body,L,0.31,0.49+Y,0,0.15,0.26,0.21);
  const neck=new THREE.Group(); neck.position.set(0.33,0.6+Y,0); body.add(neck); sph(neck,R_,0.03,0.03,0,0.24,0.27,0.25);
  const head=new THREE.Group(); head.position.set(0.12,0.12,0); neck.add(head);
  sph(head,C,0.03,0.03,0,0.22,0.2,0.21); sph(head,L,-0.01,-0.03,0,0.15,0.11,0.23); sph(head,'#a39d93',0.16,-0.015,0,0.24,0.095,0.1); sph(head,C,0.12,0.02,0,0.14,0.08,0.11);
  sph(head,'#151314',0.28,0.0,0,0.048,0.038,0.05).castShadow=false;
  for(const s of [-1,1]){ sph(head,'#f2c230',0.11,0.05,s*0.058,0.038,0.03,0.028,{emissive:Cc('#6b4c00')}).castShadow=false; sph(head,'#111111',0.125,0.05,s*0.061,0.013,0.022,0.011).castShadow=false;
    const ear=new THREE.Mesh(new THREE.ConeGeometry(0.038,0.105,4),hlMat(D)); ear.position.set(-0.03,0.13,s*0.065); ear.rotation.set(s*0.3,0,-0.2); ear.castShadow=true; head.add(ear);
    const ei=new THREE.Mesh(new THREE.ConeGeometry(0.02,0.06,4),hlMat('#c79a8e')); ei.position.set(-0.014,0.12,s*0.067); ei.rotation.set(s*0.3,0,-0.2); head.add(ei); }
  const jaw=new THREE.Group(); jaw.position.set(0.1,-0.055,0); head.add(jaw); sph(jaw,L,0.08,-0.01,0,0.17,0.045,0.08); for(const s of [-1,1]){ const f=new THREE.Mesh(new THREE.ConeGeometry(0.008,0.03,4),hlMat('#f4f1e8')); f.position.set(0.14,0.02,s*0.022); jaw.add(f); }
  const tb=new THREE.Group(); tb.position.set(-0.36,0.54+Y,0); tb.rotation.z=2.05; body.add(tb); sph(tb,C,0,0.21,0,0.1,0.36,0.11); sph(tb,D,0,0.4,0,0.07,0.1,0.075);
  const legs=[]; for(const [fx,fz] of [[1,1],[1,-1],[-1,1],[-1,-1]]){ const g=new THREE.Group(); g.position.set(fx>0?0.22:-0.24,0.44+Y,fz*0.095); body.add(g);
    const up=new THREE.Mesh(new THREE.CylinderGeometry(0.058,0.04,0.3,8),hlMat(fx>0?R_:C)); up.position.y=-0.14; up.castShadow=true; g.add(up);
    const k=new THREE.Group(); k.position.y=-0.29; g.add(k); const lo=new THREE.Mesh(new THREE.CylinderGeometry(0.038,0.03,0.25,8),hlMat(C)); lo.position.y=-0.115; lo.castShadow=true; k.add(lo); sph(k,L,0.025,-0.245,0,0.1,0.05,0.085);
    legs.push({g,k,front:fx>0,s:fz}); }
  root.visible=false; root.userData={body,neck,head,jaw,tb,legs}; return root; }
// the pose from a few numbers (yours and a friend's): speed, in the air, swimming, howling
function pwWolfPose(M,A,dt){ const U=M.userData, v=A.v||0, sw=!!A.swim, air=!!A.air&&!sw, h=A.howl||0; A.ph=(A.ph||0)+dt*(sw?7:Math.min(16,3.2+v*0.68)); const ph=A.ph, k=sw?0.7:Math.min(1,v/9);
  for(const L of U.legs){ let a, kn;
    if(air){ a=L.front?0.8:-0.9; kn=L.front?-0.3:0.45; }
    else if(sw){ const s=Math.sin(ph+(L.front?0:Math.PI)+(L.s>0?0:Math.PI/2)); a=s*0.7; kn=-0.35-0.4*Math.max(0,s); }
    else if(v>11){ const s=Math.sin(ph+(L.front?0:Math.PI*0.85)+(L.s>0?0:0.35)); a=s*0.95*k; kn=(L.front?-1:1)*Math.max(0,-s)*0.9*k; }
    else { const s=Math.sin(ph+(L.front===(L.s>0)?0:Math.PI)); a=s*0.6*k; kn=(L.front?-1:1)*Math.max(0,-s)*0.6*k; }
    L.g.rotation.z=a; L.k.rotation.z=kn; }
  U.body.position.y=sw?0:Math.abs(Math.sin(ph))*0.035*k*PW_WS; U.body.rotation.z=air?clamp((A.vy||0)*0.035,-0.3,0.3):Math.sin(ph*2)*0.04*k;
  U.neck.rotation.z=-0.12*k+h*1.05+(sw?0.25:0); U.jaw.rotation.z=-h*(0.5+0.08*Math.sin(T*28)); U.tb.rotation.z=2.05-0.3*k+(h>0?0.35:0)+Math.sin(ph*0.5)*0.12; }
function pwWolfStart(){ const A=PW.wf={v:0,air:!P.onGround&&!P.swim,swim:!!P.swim,howl:0,howlT:0,ph:0,vy:0,n:0}; PW.t=0; PW.dur=PW_WOLF; PW.cos='lobo';
  if(P.swim) P.y=W.waterLevel(P.x,P.z)-0.85; P.swim=false; pwEnter('wolf'); pwMesh('wolf'); pwPoof(P.x,P.y+1.1,P.z,'#8f9296',1.8); pwSnd('poof'); pwSnd('growl');
  pwFirst('wolf','¡Lobo! 30 segundos: corre mucho (con Esprint, aún más), Saltar da un salto largo y nada. Acción: aullar. Poder: volver a ser hombre lobo',6500); }
function pwWolfStep(dt){ const A=PW.wf; if(!A){ pwExit('walk',0); return; } PW.t+=dt; if(A.howl>0) A.howl=Math.max(0,A.howl-dt/1.9); if(A.howlT>0) A.howlT=Math.max(0,A.howlT-dt);
  const f=[Math.cos(camS.yaw),Math.sin(camS.yaw)], r=[-Math.sin(camS.yaw),Math.cos(camS.yaw)], mag=Math.min(1,Math.hypot(inp.mx,inp.my)), wx=f[0]*inp.my+r[0]*inp.mx, wz=f[1]*inp.my+r[1]*inp.mx, wl_=Math.hypot(wx,wz)||1;
  const sprint=(P.sprintLock||inp.keys.ShiftLeft||inp.keys.ShiftRight)&&mag>0.3&&!A.swim;
  const sp=(A.swim?4.5:sprint?20:16)*(PW.sup?1.25:1)*Math.min(1,mag*1.1)*(A.howl>0.35?0.12:1), tvx=mag>0.08?wx/wl_*sp:0, tvz=mag>0.08?wz/wl_*sp:0;
  const acc=A.swim?10:P.onGround?32:4, dvx=tvx-P.vx, dvz=tvz-P.vz, dl=Math.hypot(dvx,dvz), mxd=acc*dt; if(dl>mxd){ P.vx+=dvx/dl*mxd; P.vz+=dvz/dl*mxd; } else { P.vx=tvx; P.vz=tvz; }
  if(mag>0.1) P.yaw=lerpAng(P.yaw,Math.atan2(wz,wx),1-Math.exp(-dt*(A.swim?3:P.onGround?8:2)));
  if(inp.jumpQ){ inp.jumpQ=false; if((P.onGround||A.swim)&&A.howl<0.35){ const fw=Math.max(Math.hypot(P.vx,P.vz),A.swim?5:7); P.vx=Math.cos(P.yaw)*fw; P.vz=Math.sin(P.yaw)*fw; P.vy=A.swim?6:6.6; P.onGround=false; A.swim=false; A.jumps=(A.jumps||0)+1; blip('jump'); pwSnd('whoosh',0.45); } }
  if(!A.swim) P.vy-=PW_G*dt; const wasG=P.onGround;
  let nx=P.x+P.vx*dt, nz=P.z+P.vz*dt, ny=P.y+P.vy*dt; const res=collide(nx,nz,ny,0.55,A.swim);
  if(Math.abs(res[0]-nx)+Math.abs(res[1]-nz)>1e-3&&Math.hypot(P.vx,P.vz)>10) blip('bump');
  nx=res[0]; nz=res[1]; if(!dsInWorld(nx,nz)){ nx=P.x; nz=P.z; P.vx=P.vz=0; }
  if(res[2]>-1e8&&(wasG||A.swim)&&res[2]>ny){ ny=res[2]; P.vy=0; A.swim=false; }
  const tH=terrainAt(nx,nz), g=groundAt(nx,nz,ny+0.3), wl=W.waterLevel(nx,nz);
  if(tH<wl-1.15&&g<wl-1.15&&ny<=wl-0.85){ if(!A.swim&&P.vy<-3) pwSnd('splash'); A.swim=true; ny=wl-0.85; P.vy=0; P.onGround=false; }
  else if(A.swim&&g>wl-1.15) A.swim=false;
  if(!A.swim){ const snap=wasG&&P.vy<=0.01?0.3+Math.hypot(P.vx,P.vz)*dt*0.8:0.04; if(ny<=g||ny-g<snap){ if(P.vy<-12) blip('land'); ny=g; P.vy=0; P.onGround=true; } else P.onGround=false; }
  P.x=nx; P.y=ny; P.z=nz; P.swim=false; A.v=Math.hypot(P.vx,P.vz); A.air=!P.onGround&&!A.swim; A.vy=P.vy;
  if(A.v>3&&performance.now()-camS.lastLook>1100) camS.yaw=lerpAng(camS.yaw,P.yaw,1-Math.exp(-dt*1.4));
  if(PW.t>=(PW.dur||PW_WOLF)) pwWolfEnd(); }
function pwWolfEnd(){ const A=PW.wf; if(!A) return; const sw=A.swim, wl=W.waterLevel(P.x,P.z); pwPoof(P.x,P.y+1.1,P.z,'#8f9296',1.5); pwSnd('poof',0.8); P.vx*=0.4; P.vz*=0.4;
  if(sw) P.y=wl-1.25; pwExit('walk'); if(sw){ P.swim=true; P.onGround=false; } tip('Vuelves a ser hombre lobo',1800); }
// the howl: the moon shines a moment, Halloween apparitions nearby run away and the horses around neigh (also when a friend howls)
function pwHowl(){ const A=PW.wf; if(!A) return; if(A.howlT>0){ pwTip('Aún resuena el aullido… '+Math.ceil(A.howlT)+' s'); return; } A.howl=1; A.howlT=3.5; A.n++; PW.hn++;
  pwSnd('howl'); pwMoonFlash(); const r=pwHowlFx(P.x,P.z); tip('¡Auuuuuh!'+(r.mobs?' · '+(r.mobs===1?'una aparición huye':r.mobs+' apariciones huyen'):'')+(r.horses?' · relinchan '+(r.horses===1?'un caballo':r.horses+' caballos'):''),2600); }
function pwHowlFx(x,z){ let mobs=0, horses=0;
  if(typeof HL!=='undefined'&&HL.mobs) for(const m of HL.mobs){ if(m.fled||m.k==='boo'||m.k==='poof') continue; const mx=m.x!==undefined?m.x:m.ex, mz=m.z!==undefined?m.z:m.ez; if(!(Math.hypot(mx-x,mz-z)<90)) continue; m.fled=1; mobs++; const t=m.t;
    if(m.k==='ghost') m.life=Math.min(m.life,Math.max(t,0.7)+1.4); else if(m.k==='skel') m.life=Math.min(m.life,Math.max(t,0.9)+0.9); else if(m.k==='bats') m.life=Math.min(m.life,t+0.7); else if(m.k==='cat') m.life=Math.min(m.life,t+0.4);
    else if(m.k==='witch'){ let dx=m.x-x, dz=m.z-z; const d=Math.hypot(dx,dz)||1; dx/=d; dz/=d; const s=t*12; m.a=[m.x-dx*s,m.z-dz*s]; m.dir=[dx,dz]; m.life=Math.min(m.life,t+4); } }
  try{ for(const h of HORSES) if(Math.hypot(h.x-x,h.z-z)<60){ horses++; h.pwNeigh=performance.now(); } }catch(e){}
  if(horses) setTimeout(()=>{ try{ anSnd('neigh'); }catch(e){} },450); PW.howlFx={mobs,horses}; return PW.howlFx; }
function pwPeerWolf(p,s,R,V,q,dt){ if(R) R.root.visible=false; const B=pwPeerMesh(V,'wolf'); B.visible=true; B.position.set(s.x,s.y,s.z); B.rotation.set(0,-s.yaw,0);
  const A=V.wA||(V.wA={}), hn=q[3]|0; A.v=+q[1]||0; A.swim=!!((q[2]|0)&1); A.air=!!((q[2]|0)&2);
  if(A.hn===undefined) A.hn=hn; else if(hn!==A.hn){ A.hn=hn; A.howl=1; pwSnd('howl',hlVol(s.x,s.z)); if(Math.hypot(s.x-P.x,s.z-P.z)<400) pwMoonFlash(); pwHowlFx(s.x,s.z); tip((p.n||'Un amigo')+' aúlla como un lobo',2200); V.howls=(V.howls||0)+1; }
  if(A.howl>0) A.howl=Math.max(0,A.howl-dt/1.9); pwWolfPose(B,A,dt); }
// a soft halo around the moon (wherever the sky draws it), for a moment
function pwMoonMesh(){ const cv=document.createElement('canvas'); cv.width=cv.height=128; const c=cv.getContext('2d'), g=c.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(0.12,'rgba(235,242,255,.95)'); g.addColorStop(0.35,'rgba(170,190,255,.35)'); g.addColorStop(1,'rgba(120,140,255,0)'); c.fillStyle=g; c.fillRect(0,0,128,128);
  const m=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),fog:false,depthWrite:false,transparent:true,blending:THREE.AdditiveBlending,opacity:0})); m.renderOrder=-1; m.frustumCulled=false; m.visible=false; return m; }
function pwMoonFlash(){ PW.moonT=0.001; pwMesh('moon'); }
function pwMoonTick(dt){ if(!(PW.moonT>0)) return; PW.moonT+=dt; const q=PW.moonT/2.8, e=q>=1?0:Math.sin(Math.PI*q)*(q<0.5?1:1), G=PW.M.moon; if(!G) return;
  const d=sky&&sky.material.uniforms.uMoon?sky.material.uniforms.uMoon.value:dirFromElAz(38,150); G.visible=e>0.01; G.material.opacity=0.95*e; G.position.copy(camera.position).addScaledVector(d,3800); G.scale.set(700+900*e,700+900*e,1);
  if(typeof HL!=='undefined'&&HL.moon) HL.moon.scale.set(820*(1+0.3*e),820*(1+0.3*e),1); if(q>=1){ PW.moonT=0; G.visible=false; if(typeof HL!=='undefined'&&HL.moon) HL.moon.scale.set(820,820,1); } }

/* ================= H3 · 9 · araña: trepa por las paredes y baja colgada de un hilo ================= */
function pwThreadMesh(){ const g=new THREE.CylinderGeometry(0.013,0.013,1,5,1,true); g.translate(0,0.5,0); const m=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:Cc('#f4f4fa'),transparent:true,opacity:0.9,side:THREE.DoubleSide})); m.frustumCulled=false; m.visible=false; return m; }
// a wall in front, at a step: the nearest outline edge of a solid building taller than you, facing it (or very close)
function pwSpWall(maxD){ maxD=maxD||1.7; let best=null; const seen=new Set(), ys=[P.yaw,camS.yaw];
  for(const [ox,oz] of [[0,0],[Math.cos(P.yaw)*1.2,Math.sin(P.yaw)*1.2],[Math.cos(camS.yaw)*1.2,Math.sin(camS.yaw)*1.2]]) for(const b of bldsNear(P.x+ox,P.z+oz)){ if(seen.has(b)) continue; seen.add(b);
    if(!b.solid||!b.ring||b.top===undefined) continue; const top=b.walkY!==undefined?b.walkY:b.top; if(top<P.y+2.2||(b.base!==undefined&&b.base>P.y+1.2)||inBld(b,P.x,P.z)) continue;
    const e=nearestEdge(b,P.x,P.z); if(e[0]>maxD) continue; let face=-1; for(const y of ys) face=Math.max(face,-(Math.cos(y)*e[3]+Math.sin(y)*e[4])); if(face<0.3&&e[0]>0.7) continue;
    const sc=e[0]-face; if(!best||sc<best.sc) best={b,e,sc,top}; }
  return best; }
// the edge of the roof terrace you are standing on, with a drop of at least 2,4 m outside (not into a patio)
function pwSpEdge(){ if(!P.onGround||P.swim) return null; let best=null;
  for(const b of bldsNear(P.x,P.z)){ if(!b.solid||!b.ring||b.walkY===undefined||Math.abs(P.y-b.walkY)>0.35||!inBld(b,P.x,P.z)) continue;
    const e=nearestEdge(b,P.x,P.z); if(e[0]>2.6) continue; const ox=e[1]+e[3]*0.8, oz=e[2]+e[4]*0.8; if(inBld(b,ox,oz)||W.pointInPoly(ox,oz,b.ring)&&b.holesO.some(h=>W.pointInPoly(ox,oz,h))) continue;
    const below=groundAt(ox,oz,b.walkY-1.5); if(b.walkY-below<2.4) continue; if(!best||e[0]<best.e[0]) best={b,e,below}; }
  return best; }
function pwSpiderStart(){ const ed=pwSpEdge(); if(ed){ pwHiloStart(ed); return; } const w=pwSpWall(); if(w){ pwClimbStart(w); return; } pwTip(pwWhyNot('arana')||'No hay pared'); }
function pwOtherBld(b,x,z,y){ for(const o of bldsNear(x,z)){ if(o===b||!o.solid||!o.ring||y>=o.top-0.05||y+1.7<=o.base) continue; if(inBld(o,x,z)||(x>o.x0-0.3&&x<o.x1+0.3&&z>o.z0-0.3&&z<o.z1+0.3&&nearestEdge(o,x,z)[0]<0.3)) return o; } return null; }
const PW_WD=0.4;
function pwClimbStart(w){ const b=w.b, e=w.e; PW.cos='arana'; PW.t=0; PW.dur=0; if(S.mode==='glide'&&glider) glider.visible=false;
  PW.ar={m:'wall',b,nx:e[3],nz:e[4],ph:0,mv:0,top:w.top,roof:b.walkY!==undefined,topT:0,stepI:0};
  P.x=e[1]+e[3]*PW_WD; P.z=e[2]+e[4]*PW_WD; P.y=Math.max(P.y,groundAt(P.x,P.z,P.y+0.5))+(P.onGround?0.15:0); P.vx=P.vy=P.vz=0; P.onGround=false; P.swim=false; P.yaw=Math.atan2(-e[4],-e[3]);
  pwEnter('climb'); pwSnd('stick'); pwFirst('climb','¡Araña en la pared! Joystick arriba y abajo para trepar y a los lados para ir por la pared. Arriba del todo pasas a la azotea. Saltar: soltarte con impulso',6500); }
function pwClimbStep(dt){ const A=PW.ar; if(!A||A.m!=='wall'){ pwExit('walk',0); return; } PW.t+=dt; let b=A.b; const D=PW_WD;
  if(inp.jumpQ){ inp.jumpQ=false; pwClimbJump(); return; }
  const sprint=P.sprintLock||inp.keys.ShiftLeft||inp.keys.ShiftRight, sp=sprint?4.6:3.2, my=Math.abs(inp.my)>0.1?inp.my:0, mx=Math.abs(inp.mx)>0.12?inp.mx:0;
  // sideways along the wall (to your right as you face it); round the corners: the normal comes from the nearest point of the outline
  const rx=A.nz, rz=-A.nx; let px=P.x, pz=P.z;
  if(mx){ const cr=[-Math.sin(camS.yaw),Math.cos(camS.yaw)], sg=(cr[0]*rx+cr[1]*rz)>=-0.2?1:-1; px+=rx*mx*sg*sp*0.85*dt; pz+=rz*mx*sg*sp*0.85*dt; }
  const e=nearestEdge(b,px,pz); let nx=px-e[1], nz=pz-e[2]; const d=Math.hypot(nx,nz); if(d>1e-3&&!inBld(b,px,pz)){ nx/=d; nz/=d; } else { nx=e[3]; nz=e[4]; }
  let x=e[1]+nx*D, z=e[2]+nz*D; const ob=pwOtherBld(b,x,z,P.y);
  // a building joined to this one (a wing of the hotel, a garage): carry on along its wall if you can
  if(ob&&ob.ring&&(ob.walkY!==undefined?ob.walkY:ob.top)>P.y+1.6){ const e2=nearestEdge(ob,px,pz); let n2x=px-e2[1], n2z=pz-e2[2]; const d2=Math.hypot(n2x,n2z); if(d2>1e-3&&!inBld(ob,px,pz)){ n2x/=d2; n2z/=d2; } else { n2x=e2[3]; n2z=e2[4]; }
    const x2=e2[1]+n2x*D, z2=e2[2]+n2z*D; if(!pwOtherBld(ob,x2,z2,P.y)&&!inBld(b,x2,z2)&&dsInWorld(x2,z2)){ A.b=ob; A.top=ob.walkY!==undefined?ob.walkY:ob.top; A.roof=ob.walkY!==undefined; x=x2; z=z2; nx=n2x; nz=n2z; } else { x=P.x; z=P.z; nx=A.nx; nz=A.nz; if(mx) pwTip('Otra pared en medio: por aquí no se pasa'); } }
  else if(ob||!dsInWorld(x,z)){ x=P.x; z=P.z; nx=A.nx; nz=A.nz; if(mx) pwTip('Otra pared en medio: por aquí no se pasa'); }
  A.nx=nx; A.nz=nz; let y=P.y+my*sp*dt; const g=groundAt(x,z,P.y+0.5), wl=W.waterLevel(x,z);
  if(y<=Math.max(g,wl-1.2)){ y=Math.max(g,wl-1.2); if(my<-0.3){ P.x=x; P.z=z; P.y=y; P.vx=P.vy=P.vz=0; if(g<wl-1.15&&terrainAt(x,z)<wl-1.15){ P.y=wl-1.25; P.swim=true; P.onGround=false; } else P.onGround=true; pwExit('walk'); tip('Abajo: otra vez en el suelo',1300); return; } }
  if(y+1.55>=A.top){ y=A.top-1.55; if(my>0.3){ if(A.roof){ if(pwClimbOver(x,z,nx,nz)) return; } else { A.topT+=dt; if(A.topT>0.2) pwTip('Arriba del todo: este tejado no tiene azotea. Saltar te suelta'); } } } else A.topT=0;
  const mv=Math.min(1,Math.hypot(mx,my)); A.mv+=(mv-A.mv)*Math.min(1,dt*10); const ph0=A.ph; A.ph+=dt*mv*(sprint?9:7); if(mv>0.3&&Math.floor(ph0/Math.PI)!==Math.floor(A.ph/Math.PI)) pwSnd('step',0.5);
  P.x=x; P.z=z; P.y=y; P.vx=P.vy=P.vz=0; P.onGround=false; P.swim=false; P.yaw=lerpAng(P.yaw,Math.atan2(-nz,-nx),1-Math.exp(-dt*10));
  if(performance.now()-camS.lastLook>900) camS.yaw=lerpAng(camS.yaw,P.yaw,1-Math.exp(-dt*2.2)); }
// at the top: onto the roof terrace, a step in from the edge
function pwClimbOver(x,z,nx,nz){ const b=PW.ar.b; for(const k of [0.9,1.6,2.6]){ const ix=x-nx*(PW_WD+k), iz=z-nz*(PW_WD+k); if(!inBld(b,ix,iz)||pwOtherBld(b,ix,iz,b.walkY)) continue;
    P.x=ix; P.z=iz; P.y=groundAt(ix,iz,b.walkY+0.5); P.vx=P.vy=P.vz=0; P.onGround=true; P.yaw=Math.atan2(-nz,-nx); blip('land'); pwSnd('release',0.6); pwExit('walk'); tip('¡En la azotea!',1600); return true; }
  return false; }
// Saltar on the wall: let go with a push outwards (and to the side you push)
function pwClimbJump(){ const A=PW.ar; if(!A) return; const nx=A.nx, nz=A.nz, rx=nz, rz=-nx; P.vx=nx*5.2+rx*inp.mx*2.5; P.vz=nz*5.2+rz*inp.mx*2.5; P.vy=4.8+Math.max(0,inp.my)*2; P.x+=nx*0.15; P.z+=nz*0.15; P.yaw=Math.atan2(nz,nx);
  PW.ar=null; PW.k='vuelo'; PW.from='arana'; PW.t=0; P.onGround=false; blip('jump'); pwSnd('release'); pwTip('Te has soltado: Poder cerca de otra pared para agarrarte',2200); }
// Poder or Acción on the wall or the thread: let go (falling; low down you are just on the ground)
function pwSpOff(){ const A=PW.ar; if(!A){ if(PW.k==='climb'||PW.k==='hilo') pwExit('walk'); return; }
  if(A.m==='hilo') PW.thOld={ax:A.ax,ay:A.ay,az:A.az,x:P.x,y:P.y+PW_HAND,z:P.z,t:0};
  const g=groundAt(P.x,P.z,P.y+0.3); P.vx=A.m==='wall'?A.nx*1.2:0; P.vz=A.m==='wall'?A.nz*1.2:0; P.vy=0; PW.ar=null; pwSnd('release',0.6);
  if(P.y-g<0.7){ P.y=g; P.onGround=true; pwExit('walk'); return; } PW.k='vuelo'; PW.from='arana'; PW.t=0; P.onGround=false; }
// the thread: from the edge of a roof terrace you go down hanging from it
function pwHiloStart(ed){ const b=ed.b, e=ed.e, O=0.55; PW.cos='arana'; PW.t=0; PW.dur=0; PW.thOld=null;
  const A=PW.ar={m:'hilo',b,ax:e[1]+e[3]*O,ay:b.walkY+0.12,az:e[2]+e[4]*O,nx:e[3],nz:e[4],L:0.45,man:false,stop:false,sw:0,t:0,upT:0,v:0};
  P.x=A.ax; P.z=A.az; P.y=A.ay-PW_HAND-A.L; P.vx=P.vy=P.vz=0; P.onGround=false; P.yaw=Math.atan2(-A.nz,-A.nx);
  pwEnter('hilo'); pwSnd('zip'); pwFirst('hilo','Bajas colgada de tu hilo. Joystick atrás: bajar; adelante: subir; si lo sueltas o pulsas Saltar, te paras. Poder: soltarte',6500); }
function pwHiloStep(dt){ const A=PW.ar; if(!A||A.m!=='hilo'){ pwExit('walk',0); return; } A.t+=dt; PW.t+=dt;
  const my=inp.my, mx=inp.mx, sprint=P.sprintLock||inp.keys.ShiftLeft||inp.keys.ShiftRight;
  if(inp.jumpQ){ inp.jumpQ=false; A.man=true; A.stop=true; pwTip('Parada en el hilo',1200); }
  if(Math.abs(my)>0.2){ A.man=true; A.stop=false; }
  const v=!A.man?3:my<-0.2?-my*(sprint?6:3.6):my>0.2?-my*2.6:0; A.v=v; const L0=A.L; A.L=Math.max(0.35,A.L+v*dt);
  if(Math.abs(v)>0.3&&Math.floor(L0*1.4)!==Math.floor(A.L*1.4)) pwSnd('zip',0.25);
  if(A.L<=0.351&&my>0.5){ A.upT+=dt; if(A.upT>0.35&&pwHiloUp()) return; } else A.upT=0;
  A.sw+=(mx*0.7-A.sw)*Math.min(1,dt*2.5); const rx=A.nz, rz=-A.nx, k=Math.min(1,A.L/4), o=A.sw*k+Math.sin(A.t*1.6)*0.05*k;
  const x=A.ax+rx*o, z=A.az+rz*o, y=A.ay-PW_HAND-A.L, g=groundAt(x,z,y+1.2), wl=W.waterLevel(x,z);
  if(terrainAt(x,z)<wl-1.15&&g<wl-1.15&&y<=wl-1.25){ PW.thOld={ax:A.ax,ay:A.ay,az:A.az,x,y:wl-1.25+PW_HAND,z,t:0}; P.x=x; P.z=z; P.y=wl-1.25; P.vx=P.vy=P.vz=0; P.swim=true; P.onGround=false; pwExit('walk'); tip('¡Al agua!',1300); return; }
  if(y<=g){ PW.thOld={ax:A.ax,ay:A.ay,az:A.az,x,y:g+PW_HAND,z,t:0}; P.x=x; P.z=z; P.y=g; P.vx=P.vy=P.vz=0; P.onGround=true; blip('land'); pwExit('walk'); tip('¡Abajo! El hilo se queda colgando un momento',1800); return; }
  P.x=x; P.z=z; P.y=y; P.vx=P.vz=0; P.vy=-v; P.onGround=false; P.swim=false; P.yaw=lerpAng(P.yaw,Math.atan2(-A.nz,-A.nx),1-Math.exp(-dt*6));
  if(performance.now()-camS.lastLook>900) camS.yaw=lerpAng(camS.yaw,P.yaw,1-Math.exp(-dt*1.8)); }
// back up the thread and onto the roof terrace
function pwHiloUp(){ const A=PW.ar, b=A.b; for(const k of [0.9,1.6]){ const ix=A.ax-A.nx*(0.55+k), iz=A.az-A.nz*(0.55+k); if(!inBld(b,ix,iz)) continue;
    P.x=ix; P.z=iz; P.y=groundAt(ix,iz,b.walkY+0.5); P.vx=P.vy=P.vz=0; P.onGround=true; P.yaw=Math.atan2(-A.nz,-A.nx); pwSnd('release',0.6); pwExit('walk'); tip('Otra vez en la azotea',1500); return true; }
  return false; }
// poses: climbing (hands and feet on the wall, the four extra legs moving) and hanging from the thread
function pwSpLegs(R,ph,mv){ for(const c of R.torso.children){ if(c.name!=='hlSpLeg') continue; const u=c.userData, w=Math.sin(ph*1.3+u.i*Math.PI+(u.s>0?0:1.6)); c.rotation.x=u.rx+w*0.28*mv*u.s; if(u.k) u.k.rotation.x=u.s*(1.35+0.25*w*mv); } }
function pwClimbPose(R,ph,mv){ poseRig(R,'idle',T,0); const s=Math.sin(ph); R.body.rotation.z=-0.1; R.headG.rotation.z=0.3;
  R.aL.sg.rotation.z=2.35+s*0.4*mv; R.aR.sg.rotation.z=2.35-s*0.4*mv; R.aL.sg.rotation.x=0.4; R.aR.sg.rotation.x=-0.4; R.aL.el.rotation.z=0.6+0.2*Math.max(0,-s)*mv; R.aR.el.rotation.z=0.6+0.2*Math.max(0,s)*mv;
  R.lL.hg.rotation.z=0.8-s*0.45*mv; R.lR.hg.rotation.z=0.8+s*0.45*mv; R.lL.kn.rotation.z=-1.25-0.3*Math.max(0,s)*mv; R.lR.kn.rotation.z=-1.25-0.3*Math.max(0,-s)*mv; R.lL.hg.rotation.x=0.25; R.lR.hg.rotation.x=-0.25; pwSpLegs(R,ph,Math.max(0.25,mv)); }
function pwHangPose(R,sw){ poseRig(R,'idle',T,0); R.aL.sg.rotation.z=2.95; R.aR.sg.rotation.z=2.95; R.aL.sg.rotation.x=0.16; R.aR.sg.rotation.x=-0.16; R.aL.el.rotation.z=0.25; R.aR.el.rotation.z=0.25;
  R.lL.hg.rotation.z=0.3; R.lR.hg.rotation.z=0.05; R.lL.kn.rotation.z=-0.6; R.lR.kn.rotation.z=-0.2; R.body.rotation.x=(sw||0)*0.25; pwSpLegs(R,T*2,0.35); }
// every frame, from pwTick: the wolf and the thread (also the one left hanging for a moment)
function pwH3Tick(dt,on){ const M=PW.M; pwMoonTick(dt);
  { const A=on&&PW.k==='wolf'?PW.wf:null; if(A||M.wolf){ const B=pwMesh('wolf'); B.visible=!!A; if(A){ B.position.set(P.x,P.y,P.z); B.rotation.set(0,-P.yaw,0); pwWolfPose(B,A,dt); } } }
  const H=on&&PW.k==='hilo'?PW.ar:null;
  if(H){ const t=pwMesh('thread'); t.material.opacity=0.9; pwRopeSet(t,P.x,P.y+PW_HAND,P.z,H.ax,H.ay,H.az); }
  else if(PW.thOld){ const O=PW.thOld, t=pwMesh('thread'); O.t+=dt; if(O.t>3){ t.visible=false; PW.thOld=null; } else { pwRopeSet(t,O.x,O.y,O.z,O.ax,O.ay,O.az); t.material.opacity=0.9*Math.min(1,(3-O.t)/1); } }
  else if(M.thread) M.thread.visible=false; }

/* ================= every frame ================= */
function pwStep(dt){ const k=PW.k; if(!k){ setMode('walk'); return; }
  if(k==='venda') pwVendaStep(dt); else if(k==='vuelo') pwVueloStep(dt); else if(k==='escoba') pwBroomStep(dt); else if(k==='bat') pwBatStep(dt); else if(k==='cape') pwCapeStep(dt);
  else if(k==='ghost') pwGhostStep(dt); else if(k==='bones') pwBonesStep(dt); else if(k==='roll') pwRollStep(dt); else if(k==='cannon') pwCannonStep(dt); else if(k==='wolf') pwWolfStep(dt); else if(k==='climb') pwClimbStep(dt); else if(k==='hilo') pwHiloStep(dt); }
// the camera for each power
function pwCamFree(dist,pitch,height){ const f=[Math.cos(camS.yaw),Math.sin(camS.yaw)], cp=Math.cos(pitch), sp=Math.sin(pitch), tx=P.x, ty=P.y+height, tz=P.z;
  camT.pos.set(tx-f[0]*dist*cp,ty+dist*sp,tz-f[1]*dist*cp); camT.look.set(tx+f[0]*2.5,ty+0.1,tz+f[1]*2.5); }
function pwCam(){ const k=PW.k, pt=camS.pitch;
  if(k==='venda'){ thirdPerson(8,Math.max(0.12,pt),1.6,0); return 8; } if(k==='vuelo'){ thirdPerson(PW.from==='cannon'?10:8,Math.max(0.1,pt),1.2,0); return 7; }
  if(k==='escoba'){ thirdPerson(7,Math.max(0.12,pt),1.7,0); return 7; } if(k==='bat'){ thirdPerson(7.5,Math.max(0.36,pt),1.0,0); return 8; } if(k==='cape'){ thirdPerson(7.5,pt,1.4,0); return 7; }
  if(k==='ghost'){ const p=Math.max(0.05,pt), c=Math.cos(p), f=[Math.cos(camS.yaw),Math.sin(camS.yaw)], B=PW.inB; let d=Math.max(4,camS.dist); if(B){ while(d>0.7&&!inBld(B,P.x-f[0]*d*c,P.z-f[1]*d*c)) d-=0.3; } pwCamFree(d,p,B?1.4:1.55); return B?16:10; } if(k==='bones'){ thirdPerson(10,Math.max(0.3,pt),1.0,0); return 7; } if(k==='roll'){ thirdPerson(6.5,Math.max(0.18,pt),0.9,0); return 8; }
  if(k==='wolf'){ thirdPerson(8.5,Math.max(0.12,pt),1.5,0); return 9; } if(k==='climb'){ thirdPerson(6.5,clamp(pt,0.02,0.7),1.3,0); return 7; } if(k==='hilo'){ thirdPerson(7,Math.max(0.2,pt),1.5,0); return 7; }
  if(k==='cannon'&&PW.cn){ const C=PW.cn, f=[Math.cos(camS.yaw),Math.sin(camS.yaw)], cy=camS.yaw+0.5, g=[Math.cos(cy),Math.sin(cy)], p=Math.max(0.42,pt); camT.pos.set(C.x-g[0]*15*Math.cos(p),C.y+2+15*Math.sin(p),C.z-g[1]*15*Math.cos(p)); camT.look.set(C.x+f[0]*34,C.y+6,C.z+f[1]*34); return 6; }
  thirdPerson(camS.dist,pt,1.55,0.45); return 10; }
// the rig on top of the normal pose (called from step in g3c.js)
function pwRider(R){ const k=PW.k; if(!k) return;
  if(k==='venda'){ poseRig(R,'glide',T,0); P.anim='glide'; }
  else if(k==='vuelo'){ if(PW.from==='cannon'){ const vh=Math.hypot(P.vx,P.vz), e=Math.atan2(P.vy,Math.max(0.1,vh)); poseRig(R,'glide',T,0); R.root.rotation.order='YXZ'; R.root.rotation.set(0,-P.yaw,-(Math.PI/2-e)); P.anim='glide'; } else { poseRig(R,'air',T,0); P.anim='air'; } }
  else if(k==='escoba'&&PW.br){ const A=PW.br; pwBroomPose(R,A.bank,A.pitch,A.yaw); R.root.position.set(A.x,A.y,A.z); P.anim='drive'; }
  else if(k==='cape'){ pwCapePose(R); P.anim='glide'; }
  else if(k==='ghost'){ const hs=Math.hypot(P.vx,P.vz); poseRig(R,hs>0.4?'run':'idle',P.animT,clamp(hs/12,0.15,0.7)); R.root.position.y=P.y+0.12+Math.sin(T*2.4)*0.1; P.anim=hs>0.4?'run':'idle'; }
  else if(k==='cannon'&&PW.cn){ pwInBarrel(R,PW.cn); P.anim='glide'; }
  else if(k==='climb'&&PW.ar){ pwClimbPose(R,PW.ar.ph,PW.ar.mv); P.anim='idle'; } else if(k==='hilo'&&PW.ar){ pwHangPose(R,PW.ar.sw); P.anim='idle'; } }
function pwBroomPose(R,bank,pitch,yaw){ poseRig(R,'drive',0,0); R.lL.hg.rotation.z=1.15; R.lR.hg.rotation.z=1.15; R.lL.kn.rotation.z=-0.7; R.lR.kn.rotation.z=-0.7; R.aL.sg.rotation.z=0.9; R.aR.sg.rotation.z=0.9; R.root.rotation.order='YXZ'; R.root.rotation.set(bank||0,-(yaw||0),pitch||0); }
function pwCapeWing(R,on){ if(!R||!!R.root.userData.pwCape===on) return; R.root.userData.pwCape=on; let w=R.torso.getObjectByName('pwCapeW');
  if(on&&!w){ const sh=new THREE.Shape(), Pt=[[0,0.62],[0.8,0.52],[0.74,0.2],[0.64,-0.32],[0.32,-0.66],[0,-0.78],[-0.32,-0.66],[-0.64,-0.32],[-0.74,0.2],[-0.8,0.52]]; sh.moveTo(Pt[0][0],Pt[0][1]); for(let i=1;i<Pt.length;i++){ const a=Pt[i-1], b=Pt[i]; sh.quadraticCurveTo((a[0]+b[0])/2*1.02,(a[1]+b[1])/2-(i>3&&i<8?0.06:0),b[0],b[1]); } sh.lineTo(Pt[0][0],Pt[0][1]);
    const g=new THREE.ShapeGeometry(sh,4); g.rotateY(Math.PI/2); w=new THREE.Group(); w.name='pwCapeW'; w.position.set(-0.2,0.0,0); const a=new THREE.Mesh(g,hlMat('#9e1426',{side:THREE.FrontSide})), b=new THREE.Mesh(g,hlMat('#121214',{side:THREE.BackSide})); a.castShadow=b.castShadow=true; w.add(a); w.add(b); R.torso.add(w); }
  if(w) w.visible=on; R.torso.children.forEach(c=>{ if(c.name==='hlCape') c.visible=!on; }); }
function pwCapePose(R){ pwCapeWing(R,true); poseRig(R,'air',T,0); R.body.rotation.z=-0.35; R.aL.sg.rotation.x=1.45; R.aR.sg.rotation.x=-1.45; R.aL.sg.rotation.z=0.25; R.aR.sg.rotation.z=0.25; R.aL.el.rotation.z=0.1; R.aR.el.rotation.z=0.1; }
function pwTick(dt){ if(PW.sup&&S.mode!=='pow'&&!PW.k){ PW.sup=false; PW.cd=0; } if(PW.cd>0) PW.cd=Math.max(0,PW.cd-dt); const m=S.mode, on=!!PW.k&&(m==='pow'||m==='photo');
  if(PW.k&&!on) pwClear();
  // the costume changed under the power (the pumpkin joke ran out, a change in the shop): the power stops
  if(on&&m==='pow'&&PW.cos&&pwCos()!==PW.cos&&!(PW.k==='vuelo'&&PW.from==='cannon')){ if(PW.k==='escoba') pwBroomOff(false); else if(PW.k==='bat') pwBatEnd(); else if(PW.k==='ghost') pwGhostEnd(); else if(PW.k==='roll') pwRollEnd(); else if(PW.k==='cannon') pwCannonCancel(); else if(PW.k==='venda') pwVendaRelease(); else if(PW.k==='wolf') pwWolfEnd(); else if(PW.k==='climb'||PW.k==='hilo') pwSpOff(); }
  // Drácula's cape opens by itself if you hold Saltar while falling from high up
  if(m==='walk'&&pwCos()==='dracula'&&!S.interior&&!P.onGround&&!P.swim&&P.vy<-3.5&&flUpHeld()){ const g=groundAt(P.x,P.z,P.y), wl=W.waterLevel(P.x,P.z); if(P.y-Math.max(g,wl)>3) pwCapeStart(); }
  pwFx(dt);
  if(rig){ const hide=on&&['bat','bones','roll','wolf'].includes(PW.k); if(hide&&rig.root.visible){ rig.root.visible=false; PW.hid=true; } else if(!hide&&PW.hid){ PW.hid=false; rig.root.visible=!['menu','loading','plane'].includes(m); }
    const gh=on&&PW.k==='ghost'; if(PW.ghR!==rig||PW.gh!==gh){ if(PW.ghR&&PW.ghR!==rig&&PW.gh) pwGhostLook(PW.ghR,false); pwGhostLook(rig,gh); PW.ghR=rig; PW.gh=gh; }
    const bb=rig.torso.getObjectByName('hlBroom'), bv=!(on&&PW.k==='escoba'); if(bb&&bb.visible!==bv) bb.visible=bv; if(rig.root.userData.pwCape&&!(on&&PW.k==='cape')) pwCapeWing(rig,false); }
  // the meshes of the power
  const M=PW.M; if(M.broom){ const A=on&&PW.k==='escoba'?PW.br:null; M.broom.visible=!!A; if(A){ M.broom.position.set(A.x,A.y,A.z); M.broom.rotation.set(A.bank,-A.yaw,A.pitch); } } else if(on&&PW.k==='escoba') pwMesh('broom');
  { const A=on&&PW.k==='bat'?PW.bt:null; if(A||M.bat){ const B=pwMesh('bat'); B.visible=!!A; if(A){ B.position.set(A.x,A.y+0.35,A.z); B.rotation.set(A.bank*1.3,-A.yaw,A.pitch); pwBatFlap(B,PW.flap,1); } } }
  if(M.rope&&!PW.miss){ const A=on&&PW.k==='venda'?PW.a:null; if(!A) M.rope.visible=false; else { const h=[P.x,P.y+1.9,P.z], e=PW.ext; pwRopeSet(M.rope,h[0],h[1],h[2],h[0]+(A.x-h[0])*e,h[1]+(A.y-h[1])*e,h[2]+(A.z-h[2])*e); } } else if(on&&PW.k==='venda') pwMesh('rope');
  if(M.bones&&!(on&&PW.k==='bones')) M.bones.visible=false; if(M.ball&&!(on&&PW.k==='roll')) M.ball.visible=false;
  pwH3Tick(dt,on);
  pwUI(); }
// the button (icon, label and the ring: recharge, or the time left), the labels of Saltar and Esprint and the altitude box
const PW_LAB={venda:'Soltar',vuelo:'Otra venda',escoba:'Bajarme',bat:'Drácula',cape:'Murciélago',ghost:'Volver',bones:'…',roll:'Parar',cannon:'¡Fuego!',wolf:'Volver',climb:'Soltarte',hilo:'Soltarte'};
function pwUI(){ const b=$('bPow'); if(!b) return; const D=pwDef(), show=pwShown(); if(b.hidden===show) b.hidden=!show; if(document.body.classList.contains('pwon')!==show) document.body.classList.toggle('pwon',show);
  if(!show) return; const act=S.mode==='pow'&&PW.k, lab=act?(PW.k==='vuelo'&&PW.from!=='venda'?(PW.from==='arana'?'Agarrarte':'Planeador'):PW_LAB[PW.k]||'Poder'):'Poder';
  if(PW.uiK!==D.ic+lab){ PW.uiK=D.ic+lab; $('bPowI').textContent=D.ic; $('bPowT').textContent=lab; b.setAttribute('aria-label','Poder del disfraz: '+D.n+' · '+lab); b.title=D.n+' (Q, o △ / Y en el mando)'; }
  let r=1, run=false; if(act&&PW.dur){ r=clamp(1-PW.t/PW.dur,0,1); run=true; } else if(PW.cd>0) r=1-PW.cd/PW.cdM; const rv=Math.round(r*50)/50; if(PW.uiR!==rv){ PW.uiR=rv; b.style.setProperty('--pwr',rv); }
  const cd=PW.cd>0&&!act; if(b.classList.contains('cd')!==cd) b.classList.toggle('cd',cd); if(b.classList.contains('run')!==run) b.classList.toggle('run',run);
  if(S.mode!=='pow') return; const k=PW.k, bj=$('bJump'), bs=$('bSprint'), J={venda:'Recoger',vuelo:'Planear',escoba:'Subir',bat:'Subir',cape:'Saltar',ghost:'Flotar',bones:'Saltar',roll:'Bote',cannon:'Disparar',wolf:'Saltar',climb:'Soltarte',hilo:'Parar'}[k]||'Saltar', Sp={escoba:'Bajar',bat:'Bajar',cannon:'Guardar',ghost:'Esprint',wolf:'Esprint',climb:'Esprint'}[k]||'';
  if(bj.textContent!==J) bj.textContent=J; if(bj.hidden) bj.hidden=false; if(bs.hidden!==!Sp) bs.hidden=!Sp; if(Sp&&bs.textContent!==Sp) bs.textContent=Sp;
  const ab=$('altBox'), fl=k==='escoba'||k==='bat'||k==='vuelo'||k==='cape'||k==='climb'||k==='hilo'; if(ab.hidden===fl) ab.hidden=!fl; if(fl){ const gnd=Math.max(W.waterLevel(P.x,P.z),groundAt(P.x,P.z,9999)), v=fmt(Math.max(0,P.y-gnd)); if($('altV').textContent!==v) $('altV').textContent=v; } }
// Acción while the power is on
function pwAct(){ const k=PW.k; if(k==='escoba'&&PW.br){ const A=PW.br; return A.gnd?{k:'pwOff',label:'Bajar de la escoba'}:{k:'pwLand',label:A.auto?'Seguir volando':'Aterrizar'}; }
  if(k==='cannon') return {k:'pwFire',label:'Disparar'}; if(k==='venda') return {k:'pwRel',label:'Soltarte'}; if(k==='bat') return {k:'pwBack',label:'Volver a ser Drácula'}; if(k==='ghost') return {k:'pwBack',label:'Volver'}; if(k==='roll') return {k:'pwBack',label:'Parar'};
  if(k==='wolf'&&PW.wf) return {k:'pwHowl',label:PW.wf.howlT>0?'Aullando…':'Aullar'}; if(k==='climb') return {k:'pwSpOff',label:'Soltarte de la pared'}; if(k==='hilo') return {k:'pwSpOff',label:'Soltarte del hilo'}; return null; }
function pwDo(k){ if(k==='pwOff') pwBroomOff(false); else if(k==='pwLand'){ const A=PW.br; if(!A) return; A.auto=!A.auto; A.off=false; if(A.auto) tip('Aterrizaje automático: frena y baja en vertical. Mueve el joystick para cancelarlo',3000); }
  else if(k==='pwFire') pwFire(); else if(k==='pwRel') pwVendaRelease(); else if(k==='pwBack') pwAgain(); else if(k==='pwHowl') pwHowl(); else if(k==='pwSpOff') pwSpOff(); }
function pwStatus(){ const k=PW.k, kmh=fmt(Math.hypot(P.vx,P.vz)*3.6)+' km/h', left=PW.dur?' · quedan '+Math.max(0,Math.ceil(PW.dur-PW.t))+' s':'';
  if(k==='venda') return ['Momia · colgada de la venda','Joystick: columpiarte · mantén Saltar: recoger la venda y subir · Poder: soltarte con impulso'];
  if(k==='vuelo'&&PW.from==='arana') return ['Araña · por el aire','Poder cerca de una pared: agarrarte otra vez · Saltar: abrir el planeador'];
  if(k==='wolf'&&PW.wf){ const A=PW.wf; return ['Hombre lobo · lobo',kmh+left+(A.swim?' · nadando':'')+' · Saltar: salto largo · Acción: aullar · Poder: volver']; }
  if(k==='climb'&&PW.ar) return ['Araña · en la pared','A '+fmt(Math.max(0,P.y-groundAt(P.x,P.z,P.y+0.3)))+' m del suelo · joystick: trepar y moverte por la pared · Saltar: soltarte con impulso'];
  if(k==='hilo'&&PW.ar) return ['Araña · colgada del hilo',fmt(Math.max(0,P.y-groundAt(P.x,P.z,P.y+0.3)))+' m sobre el suelo · joystick atrás: bajar, adelante: subir · suéltalo o Saltar: parar · Poder: soltarte'];
  if(k==='vuelo') return PW.from==='cannon'?['Pirata · bala de cañón',kmh+' · el planeador se abre al bajar (o con Saltar)']:['Momia · por el aire','Poder: lanzar otra venda · Saltar: abrir el planeador'];
  if(k==='escoba'&&PW.br){ const A=PW.br; let pas=''; if(MP.code) for(const p of MP.peers.values()) if(p.out&&p.out.m==='pas'&&p.out.rd===MP.id&&p.out.rk==='broom') pas=' · detrás va '+(p.n||'un amigo');
    return ['Bruja · escoba',(A.gnd?'En tierra · Subir: despegar · Poder o Acción: bajarte':fmt(Math.abs(A.vf)*3.6)+' km/h'+(A.auto?' · aterrizando sola':' · Subir y Bajar · suelta y se queda quieta'))+pas]; }
  if(k==='bat') return ['Drácula · murciélago',kmh+left+' · Subir y Bajar (vuela bajo) · Poder: volver a ser Drácula'];
  if(k==='cape') return ['Drácula · planeando con la capa','Joystick para dirigirte · aterriza donde quieras'];
  if(k==='ghost') return ['Fantasma · atraviesa paredes','Pasas por paredes, puertas y árboles'+left+' · mantén Saltar para flotar'];
  if(k==='bones'&&PW.bn) return ['Esqueleto · desmontado','Los huesos vuelan '+Math.round(PW.bn.d)+' m hacia delante'];
  if(k==='roll') return ['Calabaza rodando',kmh+' · cuesta abajo acelera · Saltar: bote · Poder: parar'];
  if(k==='cannon'&&PW.cn){ const C=PW.cn; return ['Pirata · cañón','Elevación '+Math.round(C.el*180/Math.PI)+'° · '+(C.wall?'¡chocarías con un edificio a ':'caerías a unos ')+fmt(C.range)+' m · joystick: apuntar · Disparar: Poder, Saltar o Acción']; }
  return ['Poder','']; }

/* ================= with the room: the state (pw), what friends see and riding behind a friend's broom ================= */
const PW_CODE={venda:1,escoba:2,bat:3,ghost:4,bones:5,roll:6,cannon:7,cape:8,wolf:11,climb:12,hilo:13};
function pwNetState(o){ if(S.mode!=='pow'||!PW.k) return; const r2=x=>Math.round(x*100)/100, k=PW.k;
  if(k==='venda'&&PW.a) o.pw=[1,r2(PW.a.x),r2(PW.a.y),r2(PW.a.z)]; else if(k==='vuelo') o.pw=[PW.from==='cannon'?10:9,r2(Math.atan2(P.vy,Math.max(0.1,Math.hypot(P.vx,P.vz)))),0,0];
  else if(k==='escoba'&&PW.br) o.pw=[2,r2(PW.br.bank),r2(PW.br.pitch),PW.br.gnd?1:0]; else if(k==='bat'&&PW.bt) o.pw=[3,r2(PW.bt.bank),r2(PW.bt.pitch),0];
  else if(k==='bones'&&PW.bn) o.pw=[5,r2(PW.bn.t),r2(PW.bn.yaw),0]; else if(k==='roll'&&PW.rl) o.pw=[6,r2(PW.rl.vx),r2(PW.rl.vz),0];
  else if(k==='cannon'&&PW.cn) o.pw=[7,r2(PW.cn.el),r2(PW.cn.x),r2(PW.cn.z)];
  else if(k==='wolf'&&PW.wf) o.pw=[11,r2(PW.wf.v),(PW.wf.swim?1:0)+(PW.wf.air?2:0),PW.hn%50000]; else if(k==='climb'&&PW.ar) o.pw=[12,PW.ar.mv>0.15?1:0,0,0];
  else if(k==='hilo'&&PW.ar) o.pw=[13,r2(PW.ar.ax),r2(PW.ar.ay),r2(PW.ar.az)]; else o.pw=[PW_CODE[k]||0,0,0,0]; }
function pwPeerV(p){ if(p.pwV) return p.pwV; const g=pwGrp(), V=p.pwV={q:new THREE.Quaternion(),ph:Math.random()*6,gh:false,ghR:null,c:0}; return V; }
function pwPeerMesh(V,k){ if(V[k]) return V[k]; const mk={rope:pwRopeMesh,broom:pwBroomMesh,bat:pwBatMesh,bones:pwBonesMesh,cannon:pwCannonMesh,wolf:pwWolfMesh,thread:pwThreadMesh}[k]; let m;
  if(mk) m=mk(); else if(k==='ball'){ m=new THREE.Group(); const pk=hlPumpkin(PW_RB/0.74,0.3); m.add(pk); m.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); }
  pwGrp().add(m); return V[k]=m; }
function pwPeer(p,s,R,inWorld,showRig,dt){ const c=inWorld&&s.m==='pow'&&Array.isArray(s.pw)?s.pw[0]|0:0; if(!c&&!p.pwV) return; const V=pwPeerV(p), q=s.pw||[0,0,0,0];
  const gh=c===4; if(R&&(V.ghR!==R||V.gh!==gh)){ if(V.gh&&V.ghR&&V.ghR!==R) pwGhostLook(V.ghR,false); pwGhostLook(R,gh); V.gh=gh; V.ghR=R; }
  for(const k of ['rope','broom','bat','bones','ball','cannon','wolf','thread']) if(V[k]) V[k].visible=false;
  if(R){ const bb=R.torso.getObjectByName('hlBroom'); if(bb) bb.visible=c!==2; if(![2,3,7,10].includes(c)&&V.c&&[2,3,7,10].includes(V.c)&&R.root.rotation.order!=='XYZ') R.root.rotation.order='XYZ'; }
  if(R&&R.root.userData.pwCape&&c!==8) pwCapeWing(R,false); V.c=c; if(!c) return; V.ph+=dt;
  if(c===1){ pwRopeSet(pwPeerMesh(V,'rope'),s.x,s.y+1.9,s.z,q[1],q[2],q[3]); if(showRig) poseRig(R,'glide',T,0); }
  else if(c===2){ const B=pwPeerMesh(V,'broom'); B.visible=true; B.position.set(s.x,s.y,s.z); B.rotation.set(q[1],-s.yaw,q[2]); if(showRig){ pwBroomPose(R,q[1],q[2],s.yaw); R.root.position.set(s.x,s.y,s.z); }
    if(!q[3]&&(s.spd||0)>2&&Math.random()<dt*20){ const cc=Math.cos(s.yaw), sn=Math.sin(s.yaw); pwSpark(s.x-cc*1.05,s.y+0.6,s.z-sn*1.05,(Math.random()-0.5),Math.random()*0.6,(Math.random()-0.5),[0.75,0.3,1]); } }
  else if(c===3){ if(R) R.root.visible=false; const B=pwPeerMesh(V,'bat'); B.visible=true; B.position.set(s.x,s.y+0.35,s.z); B.rotation.set(q[1]*1.3,-s.yaw,q[2]); pwBatFlap(B,V.ph*11,1); }
  else if(c===5){ if(R) R.root.visible=false; const B=pwPeerMesh(V,'bones'); B.visible=true; const t=clamp(+q[1]||0.5,0.3,1.0); pwBonesPlace(t,{x0:s.x,y0:s.y,z0:s.z,x1:s.x,y1:s.y,z1:s.z,d:0,yaw:+q[2]||s.yaw},B,+q[2]||s.yaw); }
  else if(c===6){ if(R) R.root.visible=false; const B=pwPeerMesh(V,'ball'); B.visible=true; B.position.set(s.x,s.y+PW_RB,s.z); const vx=+q[1]||0, vz=+q[2]||0, vh=Math.hypot(vx,vz); if(vh>0.05){ _pwD.set(vz/vh,0,-vx/vh); _pwQ.setFromAxisAngle(_pwD,vh*dt/PW_RB); V.q.premultiply(_pwQ); } B.quaternion.copy(V.q); }
  else if(c===7){ const C={x:+q[2],z:+q[3],y:groundAt(+q[2],+q[3],s.y+3),yaw:s.yaw,el:+q[1]}; pwCnPlace(C,pwPeerMesh(V,'cannon')); if(showRig) pwInBarrel(R,C); }
  else if(c===10&&showRig){ poseRig(R,'glide',T,0); R.root.rotation.order='YXZ'; R.root.rotation.set(0,-s.yaw,-(Math.PI/2-(+q[1]||0))); }
  else if(c===8&&showRig) pwCapePose(R);
  else if(c===4&&showRig) R.root.position.y=s.y+0.12+Math.sin(T*2.4)*0.1;
  else if(c===11) pwPeerWolf(p,s,R,V,q,dt); else if(c===12&&showRig) pwClimbPose(R,V.ph*7,q[1]?1:0);
  else if(c===13){ pwRopeSet(pwPeerMesh(V,'thread'),s.x,s.y+PW_HAND,s.z,+q[1],+q[2],+q[3]); if(showRig) pwHangPose(R,0); } }
// riding behind a friend's broom (the passenger side lives in g3v.js; these are the broom's parts)
function pwPeerBroom(s){ if(s&&s.m==='pow'&&Array.isArray(s.pw)&&s.pw[0]===2) return {kind:'broom',v:{x:s.x,y:s.y,z:s.z,yaw:s.yaw,bank:+s.pw[1]||0,pitch:+s.pw[2]||0,gnd:!!s.pw[3]}}; return null; }
function pwMyBroom(){ return S.mode==='pow'&&PW.k==='escoba'&&PW.br?{kind:'broom',v:PW.br}:null; }
function pwBroomSeat(v){ const c=Math.cos(v.yaw), s=Math.sin(v.yaw); return [v.x-c*0.72,v.y+0.03,v.z-s*0.72]; }
// a passenger who jumps off in the air falls with the glider
function pwPasBail(){ const q=PAS.q; if(!q||q.kind!=='broom') return false; const A=q.v, g=Math.max(terrainAt(A.x,A.z),W.waterLevel(A.x,A.z)); if(A.gnd||A.y-g<4) return false;
  PAS.pid=null; PAS.q=null; P.y-=1; P.vx=P.vz=0; P.vy=-3; P.onGround=false; rig.root.visible=true; setMode('fall'); blip('jump'); tip('¡Has saltado de la escoba! El planeador se abre solo',2600); return true; }

/* ================= the guide, the glossary, the Halloween sheet and the gamepad legend ================= */
function pwCosLine(k){ const D=PW_DEF[k]; return D?'<b>'+D.ic+' '+D.n+'.</b> '+D.how:''; }
function pwCosHTML(){ return '<h3>Poderes de los disfraces</h3><p class="note">Cada disfraz tiene su poder, en los dos mundos y con o sin la noche de Halloween, mientras lo llevas puesto. Botón <b>Poder</b> (encima de Esprint, con el icono del disfraz), <b>△</b> / <b>Y</b> del mando o tecla <b>Q</b>. El anillo del botón se llena mientras se recarga (unos segundos) y, en los poderes con tiempo, se vacía mientras dura.</p><ul>'+
  [['momia','Momia'],['bruja','Bruja'],['dracula','Drácula'],['fantasma','Fantasma'],['esqueleto','Esqueleto'],['calabaza','Calabaza'],['pirata','Pirata'],['lobo','Hombre lobo'],['arana','Araña']].map(([k,n])=>'<li><b>'+n+':</b> '+pwCosLine(k)+'</li>').join('')+'</ul>'; }
function pwGuideHTML(){ return '<li><b>Poderes de los disfraces</b> (con un disfraz de Halloween puesto, en los dos mundos): botón <b>Poder</b> encima de Esprint, <b>△</b> / <b>Y</b> del mando o tecla <b>Q</b>. Un anillo alrededor del botón se llena mientras se recarga y se vacía mientras dura el poder. Momia: lanza una venda a una pared, un tejado o un árbol y se columpia (mantén Saltar para subir; Poder para soltarte y lanzar otra en el aire). Bruja: vuela en su escoba (Subir, Bajar y el joystick; se queda quieta si sueltas) y un amigo puede subirse detrás. Drácula: murciélago 25 segundos, bajo y rápido, y con la capa planea al caer desde alto (mantén Saltar). Fantasma: 12 segundos atravesando paredes, puertas y árboles; si acaba dentro de algo sale solo al sitio libre más cercano, y las apariciones no le asustan. Esqueleto: se desmonta y se vuelve a montar hasta 20 m más allá. Calabaza: rueda (cuesta abajo acelera, Saltar da un bote). Pirata: cañón con el arco del disparo a la vista; sale volando hasta 120 m y al bajar se abre el planeador. Hombre lobo: se convierte 30 segundos en un lobo grande que corre mucho, salta lejos, nada y aúlla con Acción (la luna brilla, las apariciones huyen y los caballos relinchan). Araña: de frente a una pared trepa por ella con el joystick (Saltar la suelta) y pasa a la azotea; en el borde de una azotea baja colgada de un hilo (joystick atrás baja, adelante sube, suéltalo para pararte; Poder la suelta). En una sala tus amigos ven tu poder.</li>'; }
function pwGlossHTML(){ return '<dt>Poder (del disfraz)</dt><dd>Lo que puede hacer cada disfraz de Halloween mientras lo llevas: columpiarse, volar en escoba, convertirse en murciélago, atravesar paredes, desmontarse, rodar salir disparado de un cañón, convertirse en lobo o trepar por las paredes.</dd><dt>Aullido</dt><dd>Lo que hace el lobo con Acción: la luna brilla un momento, las apariciones de Halloween que estén cerca huyen y los caballos de alrededor relinchan; tus amigos de la sala lo oyen.</dd><dt>Trepar</dt><dd>Subir, bajar y moverse por una pared pegado a ella, como la araña; arriba del todo pasa a la azotea si el edificio la tiene.</dd><dt>Hilo de araña</dt><dd>El hilo del que baja colgada la araña desde el borde de una azotea; con el joystick bajas o subes y, si lo sueltas, te quedas parada.</dd><dt>Recarga</dt><dd>Los segundos que hay que esperar para volver a usar el poder; el anillo del botón se va llenando.</dd><dt>Péndulo</dt><dd>Lo que hace la momia colgada de la venda: va y viene de un lado a otro; cuanto más empujas en el sentido del vaivén, más alto sube.</dd><dt>Parábola</dt><dd>La curva que hace algo lanzado al aire, como el pirata al salir del cañón: sube, se frena y baja. Las bolas naranjas la dibujan antes de disparar y los puntos blancos son su sombra en el suelo.</dd>'; }
{ const b=$('bPow'); if(b){ b.addEventListener('pointerdown',e=>{ e.preventDefault(); pwPress(); }); b.addEventListener('contextmenu',e=>e.preventDefault()); } }
{ const bs=$('bSprint'); if(bs) bs.addEventListener('click',()=>{ if(S.mode==='pow'&&PW.k==='cannon'){ P.sprintLock=false; bs.classList.remove('on'); pwCannonCancel(); } }); }
