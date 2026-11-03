
/* ================= water sports on the reservoir: motorboats, windsurf, kitesurf and water skiing; horses on the map ================= */
// the craft: the jet ski of the marina and the new ones share the same riding mode ('jet'); sails move with the wind of the reservoir
const WCR={jet:{n:'Moto de agua',act:'Subir a la moto de agua',max:18,acc:7,brake:11,turn:1,cam:7.8,ch:2.0,len:1.7,eng:48},
  boat:{n:'Lancha',act:'Llevar la lancha',max:20,acc:4,brake:7,turn:0.55,cam:13,ch:3.6,len:3.0,eng:36},
  wind:{n:'Windsurf',act:'Coger la tabla de windsurf',sail:1.3,turn:0.75,cam:9,ch:2.6,len:1.4},
  kite:{n:'Kitesurf',act:'Coger la tabla de kitesurf',sail:1.6,turn:1.0,cam:11,ch:3.2,len:0.8,jump:true}};
const LAKE={a:-0.55,rec:+(store.get(WP.key+'_kitejump')||0)};
// the wind on the water: a breeze that depends on the weather and turns a little over the minutes
function lakeWind(){ const base=WX.mode==='lluvia'?8.5:WX.mode==='nubes'?6.5:5.2; const a=LAKE.a+0.28*Math.sin(T*0.011)+0.08*Math.sin(T*0.07); const sp=base*(1+0.16*Math.sin(T*0.19)+0.07*Math.sin(T*0.83)); return {a,sp,x:Math.cos(a)*sp,z:Math.sin(a)*sp}; }
const COMPASS=['este','sureste','sur','suroeste','oeste','noroeste','norte','noreste'];
function windFromName(a){ const from=a+Math.PI; const k=Math.round((((from%(2*Math.PI))+2*Math.PI)%(2*Math.PI))/(Math.PI/4))%8; return COMPASS[k]; }
// points of sail: the angle between where the board goes and where the wind comes from
function sailAngle(J,w){ let d=J.yaw-(w.a+Math.PI); while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; return d; }
function sailName(th){ th=Math.abs(th); return th<0.7?'proa al viento':th<1.2?'ceñida':th<1.95?'de través':th<2.6?'a un largo':'empopada'; }
function polar(th){ th=Math.abs(th); if(th<0.7) return 0; if(th<1.05) return 0.35+(th-0.7)/0.35*0.4; if(th<1.85) return 0.75+(th-1.05)/0.8*0.32; if(th<2.4) return 1.07-(th-1.85)/0.55*0.05; return 1.02-(th-2.4)/0.74*0.3; }

/* ---- the craft and their meshes ---- */
function makeBoat(col){ const g=new THREE.Group(); const M=c=>new THREE.MeshLambertMaterial({color:Cc(c)}); const wht=M('#f4f3ef'), dk=M('#2b3036'), cc=M(col), seat=M('#e9e2d0');
  const add=(geo,mat,x,y,z,rx,ry,rz)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.rotation.set(rx||0,ry||0,rz||0); m.castShadow=true; g.add(m); return m; };
  add(new THREE.BoxGeometry(4.6,0.7,2.1),wht,-0.3,0.35,0); const bow=add(new THREE.ConeGeometry(1.06,1.7,4),wht,2.75,0.38,0,0,Math.PI/4,-Math.PI/2); bow.scale.set(1,1,0.7);
  add(new THREE.BoxGeometry(4.0,0.12,2.14),cc,-0.2,0.22,0); add(new THREE.BoxGeometry(3.2,0.06,1.7),M('#d9cfb8'),-0.5,0.72,0);
  add(new THREE.BoxGeometry(0.9,0.5,0.75),seat,-0.6,0.98,-0.42); add(new THREE.BoxGeometry(0.9,0.5,0.75),seat,-0.6,0.98,0.42); add(new THREE.BoxGeometry(0.9,0.45,1.7),seat,-2.0,0.95,0);
  add(new THREE.BoxGeometry(0.7,0.62,0.9),dk,0.55,1.05,-0.42); const ws=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.42,1.9),new THREE.MeshLambertMaterial({color:Cc('#bfdde8'),transparent:true,opacity:0.45})); ws.position.set(1.0,1.15,0); ws.rotation.z=-0.45; g.add(ws);
  add(new THREE.BoxGeometry(0.5,0.9,0.42),dk,-2.75,0.65,0); add(new THREE.CylinderGeometry(0.035,0.035,1.1,6),dk,-2.35,1.25,0); return g; }
function makeBoard(len,w,col){ const g=new THREE.Group(); const M=c=>new THREE.MeshLambertMaterial({color:Cc(c)});
  const b=new THREE.Mesh(new THREE.BoxGeometry(len,0.09,w),M('#f7f5ef')); b.position.y=0.06; b.castShadow=true; g.add(b); const n=new THREE.Mesh(new THREE.ConeGeometry(w*0.5,0.5,4),M('#f7f5ef')); n.rotation.set(0,Math.PI/4,-Math.PI/2); n.scale.set(1,1,0.22); n.position.set(len/2+0.22,0.06,0); g.add(n);
  const s=new THREE.Mesh(new THREE.BoxGeometry(len*0.8,0.1,w*0.25),M(col)); s.position.y=0.07; g.add(s); return g; }
function makeWindsurf(col){ const g=makeBoard(2.5,0.64,col); const rig_=new THREE.Group(); rig_.position.set(0.15,0.1,0); g.add(rig_);
  const mast=new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.03,4.6,6),new THREE.MeshLambertMaterial({color:Cc('#2b3036')})); mast.position.y=2.3; rig_.add(mast);
  const sh=new THREE.Shape(); sh.moveTo(0,0.35); sh.lineTo(0,4.55); sh.quadraticCurveTo(-1.1,2.2,-2.05,0.55); sh.lineTo(0,0.35);
  const sail=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshLambertMaterial({color:Cc(col),transparent:true,opacity:0.88,side:THREE.DoubleSide})); rig_.add(sail);
  const boom=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,1.9,6),new THREE.MeshLambertMaterial({color:Cc('#9aa3ab')})); boom.rotation.z=Math.PI/2; boom.position.set(-0.95,1.55,0); rig_.add(boom);
  rig_.rotation.z=-0.1; g.userData.rig=rig_; return g; }
function makeKite(col){ const g=new THREE.Group(); const M=new THREE.MeshLambertMaterial({color:Cc(col),side:THREE.DoubleSide}), E=new THREE.MeshLambertMaterial({color:Cc('#16231b')});
  for(let i=0;i<10;i++){ const a0=-1.15+i*0.23; const seg=new THREE.Mesh(new THREE.BoxGeometry(0.85,0.06,1.6),M); seg.position.set(Math.sin(a0+0.115)*3.4,Math.cos(a0+0.115)*3.4-3.4,0); seg.rotation.z=-(a0+0.115); g.add(seg);
    const le=new THREE.Mesh(new THREE.CylinderGeometry(0.11,0.11,0.85,6),E); le.rotation.z=Math.PI/2-(a0+0.115); le.position.set(seg.position.x,seg.position.y+0.02,0.8); g.add(le); } return g; }

/* ---- where they wait: the motorboats at the pier, the boards on the beach next to the lagoon, the ski boat at the end of the pier ---- */
const NAU={kite:null,lines:null,base:null,ski:null};
// a fresh copy of a craft, for a friend who is using it (cloning would share the windsurf rig)
function makeCraftMesh(J){ const t=J.type||'jet', c=J.col||'#f2c230'; return t==='boat'?makeBoat(c):t==='wind'?makeWindsurf(c):t==='kite'?makeBoard(1.45,0.44,c):makeJet(c); }
function placeNautica(){ labelHorses(); if(!PIER.B||!PIER.plat) return; const F=pierFrame(); let n=JET.list.length;
  // two motorboats on the side of the pier with open water (the jets took the best one)
  const js=JET.list.length?Math.sign((JET.list[0].x-PIER.A[0])*F.px+(JET.list[0].z-PIER.A[1])*F.pz)||1:1; let bs=0;
  for(const sd of [-js,js]){ const f0=sd===js?0.44:0.62; let ok=0; for(const f of [f0,f0+0.08]){ const x=PIER.A[0]+F.ux*F.L*f+F.px*sd*6.5, z=PIER.A[1]+F.uz*F.L*f+F.pz*sd*6.5; if(W.terrain(x,z)<W.waterLevel(x,z)-1.2&&freeRun(x,z,Math.atan2(F.pz*sd,F.px*sd),50)>=30) ok++; } if(ok===2){ bs=sd; break; } }
  if(bs){ const f0=bs===js?0.44:0.62; [['#2a6f87',f0],['#d6442a',f0+0.08]].forEach(([col,f])=>{ const x=PIER.A[0]+F.ux*F.L*f+F.px*bs*6.5, z=PIER.A[1]+F.uz*F.L*f+F.pz*bs*6.5; const g=makeBoat(col); scene.add(g);
    const J={g,i:n++,type:'boat',col,x,z,y:W.waterLevel(x,z)+0.05,yaw:Math.atan2(F.pz*bs,F.px*bs),v:0,pitch:0,roll:0,home:[x,z]}; JET.list.push(J); jetPlace(J,0); }); }
  // the beach: the strip of sand between the lagoon and the reservoir; boards at the water's edge facing open water
  const B=WP.nautica&&WP.nautica.beach; if(B){ const [bx,bz,ba]=B; let k=0;
    for(const [type,col,off] of [['wind','#e8742c',-9],['wind','#8b6fd6',-4],['kite','#d6442a',4],['kite','#2a6f87',9]]){ const px=-Math.sin(ba), pz=Math.cos(ba); let x=bx+px*off, z=bz+pz*off;
      for(let s=0;s<40&&W.terrain(x,z)>W.waterLevel(x,z)-0.5;s++){ x+=Math.cos(ba)*1.5; z+=Math.sin(ba)*1.5; } const g=type==='wind'?makeWindsurf(col):makeBoard(1.45,0.44,col); scene.add(g);
      const J={g,i:n++,type,x,z,y:W.waterLevel(x,z)+0.02,yaw:ba,v:0,pitch:0,roll:0,col,home:[x,z,ba]}; JET.list.push(J); jetPlace(J,0); k++; }
    NAU.base=[bx,bz]; W.POIS.push({n:'Escuela náutica: windsurf y kitesurf',p:[bx,W.terrain(bx,bz)+8,bz]}); }
  if(bs) W.POIS.push({n:'Lanchas, motos de agua y esquí acuático',p:[PIER.A[0]+F.ux*F.L*0.6,12,PIER.A[1]+F.uz*F.L*0.6]});
  for(const J of JET.list) J.h0=[J.x,J.z];
  skiSetup(F); }
// one «Caballos» label per group of horses in the drone view (both worlds)
function labelHorses(){ for(const [x,z] of horseHerds()) W.POIS.push({n:'Caballos',p:[x,W.terrain(x,z)+6,z]}); }
function horseHerds(){ const out=[]; for(const h of HORSES){ const c=out.find(o=>Math.hypot(o[0]-h.x,o[1]-h.z)<200); if(c){ c[2]++; } else out.push([h.x,h.z,1]); } return out; }

/* ---- riding: motor or sail (called from updateJet for each craft) ---- */
function sailStep(J,dt){ const V=WCR[J.type], w=lakeWind(); const th=sailAngle(J,w); const st=inp.mx, pw=inp.my;
  const power=pw<-0.2?0.25:pw>0.2?1.0:0.8; const target=polar(th)*w.sp*V.sail*power; J.v+=(target-J.v)*(1-Math.exp(-dt*(target>J.v?0.55:0.9))); if(J.v<0) J.v=0;
  J.yaw+=st*V.turn*Math.min(1,0.35+J.v/5)*dt; J.th=th; J.wind=w;
  if(J.type==='kite'){ if(inp.jumpQ){ inp.jumpQ=false; if(!J.air&&J.v>4.5){ J.air=true; J.vy=4.2+J.v*0.42; J.ay=J.y; J.at=0; J.top=0; blip('jump'); } else if(!J.air) tip('Coge más velocidad para saltar (de través o a un largo)',2200); }
    if(J.air){ J.at+=dt; J.vy-=9.81*0.62*dt; J.y+=J.vy*dt; const wl=W.waterLevel(J.x,J.z); J.top=Math.max(J.top,J.y-wl); if(J.y<=wl+0.02&&J.vy<0){ J.air=false; J.y=wl+0.02; const hgt=J.top;
        if(hgt>LAKE.rec){ LAKE.rec=hgt; store.set(WP.key+'_kitejump',String(hgt.toFixed(2))); } toast('Salto de '+fmt(hgt,1)+' m','En el aire '+fmt(J.at,1)+' s · récord '+fmt(LAKE.rec,1)+' m'); startSplash(J.x,J.z,wl); } } }
  else inp.jumpQ=false; }
function kiteFrame(J,T,st,on){ st=st||NAU; if(!st.kite){ st.kite=makeKite(st===NAU?'#d6442a':(J.col||'#d6442a')); scene.add(st.kite); const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12),3)); st.lines=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x222222})); st.lines.frustumCulled=false; scene.add(st.lines); }
  if(on===undefined) on=S.mode==='jet'&&P.jet&&P.jet.type==='kite'; st.kite.visible=st.lines.visible=on; if(!on) return; const w=J.wind||lakeWind(); const side=Math.sign(Math.sin(J.yaw-w.a))||1;
  let off=J.yaw-w.a; while(off>Math.PI) off-=2*Math.PI; while(off<-Math.PI) off+=2*Math.PI; const k=J.air?0.3:clamp(Math.abs(off)-0.35,0.2,1.25); const phi=w.a+side*k, el=J.air?1.15:J.v>3?0.5:0.85, L=22; const hx=J.x, hz=J.z, hy=J.y+1.3;
  const kx=hx+Math.cos(phi)*Math.cos(el)*L, kz=hz+Math.sin(phi)*Math.cos(el)*L, ky=hy+Math.sin(el)*L+Math.sin(T*1.7)*0.4;
  st.kite.position.set(kx,ky,kz); st.kite.lookAt(hx,hy,hz); st.kite.rotateX(-Math.PI/2);
  const a=st.lines.geometry.attributes.position.array, rx=-Math.sin(phi)*3, rz=Math.cos(phi)*3; a.set([hx,hy,hz,kx+rx,ky,kz+rz,hx,hy,hz,kx-rx,ky,kz-rz]); st.lines.geometry.attributes.position.needsUpdate=true; }
// standing on a board: knees bent, arms out to the boom or the bar, leaning back against the pull
function boardPose(R,lean,T){ poseRig(R,'idle',T,0); R.lL.hg.rotation.z=0.42; R.lR.hg.rotation.z=0.22; R.lL.kn.rotation.z=-0.7; R.lR.kn.rotation.z=-0.42; R.aL.sg.rotation.z=1.3; R.aR.sg.rotation.z=1.3; R.aL.el.rotation.z=0.3; R.aR.el.rotation.z=0.3; R.body.rotation.z=lean; R.body.position.y=0.86; }
function craftPost(T){ if(S.mode!=='jet'||!P.jet||!rig) return; craftRider(rig,P.jet,T); }
// the rider on a craft: seated on a jet ski or a boat, standing on a board (also used for friends)
function craftRider(R,J,T){ const V=WCR[J.type||'jet'], c=Math.cos(J.yaw), s=Math.sin(J.yaw);
  if(!V.sail){ poseRig(R,'drive',T,0); const back=J.type==='boat'?0.65:0.4, up=J.type==='boat'?0.62:0.5, side=J.type==='boat'?0.42:0; R.root.position.set(J.x-c*back+s*side,J.y+up,J.z-s*back-c*side); R.root.rotation.set(0,-J.yaw,0); return; }
  const w=J.wind||lakeWind(); const sd=Math.sign(Math.sin(J.yaw-w.a))||1; boardPose(R,J.type==='kite'?0.42:0.3,T); R.root.rotation.order='YXZ';
  R.root.rotation.set(0,-(J.yaw-sd*Math.PI/2),0); R.root.position.set(J.x-c*(J.type==='kite'?0:0.35),J.y+0.1,J.z-s*(J.type==='kite'?0:0.35));
  if(J.type==='wind'&&J.g.userData.rig){ const th=Math.abs(J.th||1.5); J.g.userData.rig.rotation.y=sd*(0.25+th*0.42); J.g.userData.rig.rotation.x=sd*0.12; } }
function idleCraft(T){ for(const J of JET.list){ if(J===P.jet||!J.type||J.type==='jet') continue; J.y=W.waterLevel(J.x,J.z)+(J.type==='boat'?0.04:0.02)+Math.sin(T*1.5+J.i*2)*(J.type==='boat'?0.04:0.025); J.roll=Math.sin(T*1.2+J.i)*0.025; J.pitch=Math.sin(T*1.0+J.i)*0.015; jetPlace(J,T); } }
// back to where it was taken from when you get off far away (boards drift back to the beach, boats to the pier)
function craftHome(J){ if(!J.home||J.type==='jet') return; if(Math.hypot(J.x-J.home[0],J.z-J.home[1])<60) return; J.x=J.home[0]; J.z=J.home[1]; if(J.home[2]!==undefined) J.yaw=J.home[2]; J.v=0; J.air=false; jetPlace(J,0); }

/* ---- water skiing: a boat drives a loop in open water and tows you; the joystick swings you across the wake to jump it ---- */
const SKI={on:false,boat:null,skis:null,rope:null,loop:null,th:0,dir:1,off:0,voff:0,air:0,vy:0,y:0,jumps:0,best:+(store.get(WP.key+'_ski')||0),sp:12.5,rope_:17,spot:null};
function skiSetup(F){ const loops=(WP.boats||[]).map(b=>({cx:b[0],cz:b[1],r:b[2]})); let best=null;
  for(const L0 of loops) for(const dr of [-70,-40,0,40]){ const L={cx:L0.cx,cz:L0.cz,r:L0.r+dr}; if(L.r<120) continue; let ok=true; for(let a=0;a<6.283&&ok;a+=0.06) for(const e of [-26,0,26]){ const x=L.cx+Math.cos(a)*(L.r+e), z=L.cz+Math.sin(a)*(L.r+e); if(W.terrain(x,z)>W.waterLevel(x,z)-1.6||platHitJet(x,z)){ ok=false; break; } }
    if(ok){ const d=Math.hypot(L.cx-PIER.plat[0],L.cz-PIER.plat[1]); if(!best||d<best.d) best={...L,d}; } }
  if(!best) return; SKI.loop=best; SKI.spot=[PIER.plat[0]+F.ux*4-F.px*5,PIER.plat[1]+F.uz*4-F.pz*5];
  const g=makeBoat('#f2c230'); g.scale.setScalar(1.05); scene.add(g); SKI.boat=g; const sk=new THREE.Group(); for(const s of [-0.18,0.18]){ const m=new THREE.Mesh(new THREE.BoxGeometry(1.7,0.05,0.16),new THREE.MeshLambertMaterial({color:Cc('#d6442a')})); m.position.z=s; sk.add(m); } sk.visible=false; scene.add(sk); SKI.skis=sk;
  const rg=new THREE.BufferGeometry(); rg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(6),3)); SKI.rope=new THREE.Line(rg,new THREE.LineBasicMaterial({color:0xf2c230})); SKI.rope.frustumCulled=false; SKI.rope.visible=false; scene.add(SKI.rope);
  const a0=Math.atan2(SKI.spot[1]-best.cz,SKI.spot[0]-best.cx); SKI.th=a0; skiPlaceBoat(0); }
function skiNear(){ return SKI.spot&&S.mode==='walk'&&!P.swim&&Math.hypot(P.x-SKI.spot[0],P.z-SKI.spot[1])<7&&P.y>PIER.deckY-0.6; }
function skiPlaceBoat(T){ const L=SKI.loop; if(!L) return; const x=L.cx+Math.cos(SKI.th)*L.r, z=L.cz+Math.sin(SKI.th)*L.r; const yaw=SKI.th+SKI.dir*Math.PI/2; SKI.bx=x; SKI.bz=z; SKI.byaw=yaw;
  SKI.boat.position.set(x,W.waterLevel(x,z)+0.05+(SKI.on?0.12:Math.sin(T*1.4)*0.04),z); SKI.boat.rotation.order='YXZ'; SKI.boat.rotation.set(SKI.on?-0.05*SKI.dir:0,-yaw,SKI.on?0.06:0); }
function startSki(){ if(!SKI.loop) return; fadeTo(()=>{ SKI.on=true; SKI.off=0; SKI.voff=0; SKI.air=0; SKI.jumps=0; SKI.y=0; P.swim=false; if(P.buggy) exitBuggy(); setMode('ski'); SKI.boat.visible=true; SKI.remoteBy=null; SKI.skis.visible=true; SKI.rope.visible=true; camS.yaw=SKI.byaw; S.snap=true;
  tip('Joystick a los lados: te abres o cruzas la estela. Crúzala con fuerza para saltar. Acción: soltar la cuerda',5200); }); }
function stopSki(){ if(S.mode!=='ski') return; fadeTo(()=>{ SKI.on=false; SKI.skis.visible=false; SKI.rope.visible=false; jetSound(0); if(SKI.jumps>SKI.best){ SKI.best=SKI.jumps; store.set(WP.key+'_ski',String(SKI.best)); }
  P.x=SKI.spot[0]; P.z=SKI.spot[1]; P.y=PIER.deckY; P.vx=P.vy=P.vz=0; setMode('walk'); toast('Esquí acuático',SKI.jumps+(SKI.jumps===1?' salto':' saltos')+' · récord '+SKI.best); }); }
function skiStep(dt){ const L=SKI.loop; if(!L) return; SKI.th+=SKI.dir*SKI.sp/L.r*dt; skiPlaceBoat(T);
  const tgt=clamp(inp.mx,-1,1)*13; const acc=(tgt-SKI.off)*2.2-SKI.voff*1.6; SKI.voff+=acc*dt; const prev=SKI.off; SKI.off=clamp(SKI.off+SKI.voff*dt,-15,15);
  if(!SKI.air&&Math.sign(prev)!==Math.sign(SKI.off)&&Math.abs(SKI.voff)>3.2){ SKI.air=1; SKI.vy=2.4+Math.min(3,Math.abs(SKI.voff)*0.28); SKI.jumps++; blip('jump'); }
  if(SKI.air){ SKI.y+=SKI.vy*dt; SKI.vy-=9.81*dt; if(SKI.y<=0){ SKI.y=0; SKI.air=0; startSplash(P.x,P.z,W.waterLevel(P.x,P.z)); } }
  const ths=SKI.th-SKI.dir*SKI.rope_/L.r, rr=L.r+SKI.off; const x=L.cx+Math.cos(ths)*rr, z=L.cz+Math.sin(ths)*rr; const yaw=ths+SKI.dir*Math.PI/2+SKI.voff*0.03*SKI.dir;
  const wl=W.waterLevel(x,z); P.x=x; P.z=z; P.y=wl+0.06+SKI.y; P.yaw=yaw; SKI.skis.position.set(x,wl+0.04+SKI.y,z); SKI.skis.rotation.set(0,-yaw,0);
  if(performance.now()-camS.lastLook>900) camS.yaw=lerpAng(camS.yaw,yaw,1-Math.exp(-dt*2.5));
  const a=SKI.rope.geometry.attributes.position.array, bc=Math.cos(SKI.byaw), bs=Math.sin(SKI.byaw); a.set([SKI.bx-bc*2.4,W.waterLevel(SKI.bx,SKI.bz)+1.5,SKI.bz-bs*2.4,x+Math.cos(yaw)*0.55,P.y+1.05,z+Math.sin(yaw)*0.55]); SKI.rope.geometry.attributes.position.needsUpdate=true;
  jetSound(SKI.sp); const J={x:SKI.bx,z:SKI.bz,y:W.waterLevel(SKI.bx,SKI.bz),yaw:SKI.byaw,v:SKI.sp}; jetSpray(J,dt); }
function skiPost(T){ if(S.mode!=='ski'||!rig) return; const R=rig; boardPose(R,0.38,T); R.lL.hg.rotation.z=0.5; R.lR.hg.rotation.z=0.5; R.root.rotation.order='YXZ'; R.root.rotation.set(0,-P.yaw,clamp(-SKI.voff*0.04,-0.3,0.3)); R.root.position.set(P.x,P.y+0.06,P.z); }
function skiIdle(T){ if(!SKI.on&&SKI.boat) skiPlaceBoat(T); }

/* ---- the map: horses and the water sports, so they can be found ---- */
function drawExtras(g,m2c,s,big){ if(!HORSES.length&&!JET.list.length) return; const r=(big?4.2:2.6)*s;
  for(const h of HORSES){ if(h.remoteBy) continue; const [x,y]=m2c(h.x,h.z); g.fillStyle='#8a5a2b'; g.strokeStyle='#fff'; g.lineWidth=1.2*s; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); g.stroke(); }
  for(const J of JET.list){ if(J.remoteBy) continue; const [x,y]=m2c(J.x,J.z); g.fillStyle=J.type==='boat'?'#2a6f87':J.type==='wind'?'#e8742c':J.type==='kite'?'#d6442a':'#f2c230'; g.strokeStyle='#fff'; g.lineWidth=1*s; g.beginPath(); g.moveTo(x,y-r); g.lineTo(x+r,y+r*0.8); g.lineTo(x-r,y+r*0.8); g.closePath(); g.fill(); g.stroke(); } }
function extrasLegend(){ const tri=c=>'<i style="background:'+c+';border:0;width:14px;clip-path:polygon(50% 0,100% 100%,0 100%)"></i>'; let h='';
  if(HORSES.length) h+='<div><i class="dot" style="background:#8a5a2b;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></i>Caballos</div>';
  const has=t=>JET.list.some(j=>(j.type||'jet')===t); if(has('jet')) h+='<div>'+tri('#f2c230')+'Moto de agua</div>'; if(has('boat')) h+='<div>'+tri('#2a6f87')+'Lancha (esquí acuático en el muelle)</div>'; if(has('wind')) h+='<div>'+tri('#e8742c')+'Windsurf</div>'; if(has('kite')) h+='<div>'+tri('#d6442a')+'Kitesurf</div>'; return h; }
function goHorses(){ if(!HORSES.length) return; closeModal(); let best=null, bd=1e9; for(const h of HORSES){ const d=Math.hypot(h.x-P.x,h.z-P.z); if(d<bd){ bd=d; best=h; } }
  fadeTo(()=>{ if(S.mode==='menu'||S.mode==='drone'){ plane.visible=false; glider.visible=false; rig.root.visible=true; S.landedOnce=true; } if(P.buggy) exitBuggy(); if(S.mode==='ride') dismountHorse(); if(S.mode==='jet') dismountJet();
    const a=Math.random()*6.28; let x=best.x+Math.cos(a)*2.2, z=best.z+Math.sin(a)*2.2; P.x=x; P.z=z; P.y=groundAt(x,z,999); P.vx=P.vy=P.vz=0; P.swim=false; P.onGround=true; P.yaw=Math.atan2(best.z-z,best.x-x); camS.yaw=P.yaw; setMode('walk'); tip('Pulsa «Montar a caballo» para subirte',3500); }); }
