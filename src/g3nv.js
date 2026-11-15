/* ================= Navidad y Reyes (D1, solo Valdecañas con WP.navidad): nieve, luces en las villas, árbol junto al hotel, regalos de Reyes, hoja, mapa y textos ================= */
// El trineo, las bolas de nieve y los muñecos están en g3sn.js. Nombres nv*, estado NV.
var NV={on:false,auto:false,built:false,snow:0,prevMus:null,ac:-1,t:0,grp:null,fl:null,bulbs:null,bulbN:0,tree:null,houses:[],gifts:[],reyes:false,rAuto:false,prevTOD:null,ry:{k:'',o:[]},tab:'navidad',twT:0,star:null,conf:null};
const NV_COLS=['#ff4d4d','#ffd23f','#4dd2ff','#7cff6b','#ff7bf2'];
function nvKey(d){ d=d||new Date(); return String(d.getMonth()===0?d.getFullYear()-1:d.getFullYear()); }
function nvWindow(d){ const m=d.getMonth(), day=d.getDate(); return (m===11&&day>=20)||(m===0&&day<=6); }
function nvReyesWindow(d){ const m=d.getMonth(), day=d.getDate(); return m===0&&((day===5&&sunNow(d).elev<-0.5)||day===6); }
function nvLoad(){ try{ const o=JSON.parse(store.get('vg_nv_ry')||'{}'); NV.ry=o&&o.k===nvKey()&&Array.isArray(o.o)?o:{k:nvKey(),o:[]}; }catch(e){ NV.ry={k:nvKey(),o:[]}; } }
function nvSave(){ store.set('vg_nv_ry',JSON.stringify(NV.ry)); }
function nvFree(x,z,r){ if(bldAt(x,z,r||1)||W.poolAt(x,z)) return false; const g=W.terrain(x,z); if(g<W.waterLevel(x,z)+0.5) return false; const k=W.surfAt(x,z); if(k>=3&&k<=7) return false;
  if(MG.ok&&mgGroundAt(x,z)!==null) return false; if(typeof flPadY==='function'&&flPadY(x,z)!==null) return false; return true; }
/* ---- built the first time Navidad is switched on ---- */
function nvBuild(){ if(NV.built) return; NV.built=true; const g=NV.grp=new THREE.Group(); g.visible=false; scene.add(g); nvLoad();
  NV.houses=HL.houses&&HL.houses.length?HL.houses:hlPick();
  try{ nvFlakesBuild(); }catch(e){ console.warn('copos',e); } try{ nvBulbsBuild(); }catch(e){ console.warn('luces',e); } try{ nvTreeBuild(); }catch(e){ console.warn('árbol',e); } try{ nvGiftsBuild(); }catch(e){ console.warn('regalos',e); }
  try{ snBuild(); }catch(e){ console.warn('trineos',e); } }
// falling snow: flakes in a box that follows the camera
function nvFlakesBuild(){ const N=2400, pos=new Float32Array(N*3), sp=new Float32Array(N); for(let i=0;i<N;i++){ pos[i*3]=(Math.random()-0.5)*70; pos[i*3+1]=(Math.random()-0.5)*36; pos[i*3+2]=(Math.random()-0.5)*70; sp[i]=0.7+Math.random()*0.7; }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const tex=canvasTex(32,32,(c,w,h)=>{ const gr=c.createRadialGradient(16,16,0,16,16,16); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(0.45,'rgba(255,255,255,0.75)'); gr.addColorStop(1,'rgba(255,255,255,0)'); c.fillStyle=gr; c.fillRect(0,0,w,h); });
  const P0=new THREE.Points(geo,new THREE.PointsMaterial({size:0.16,map:tex,transparent:true,depthWrite:false,color:Cc('#ffffff'),opacity:0.95})); P0.frustumCulled=false; NV.grp.add(P0); NV.fl={P:P0,pos,sp,N,cx:0,cy:0,cz:0}; }
function nvFlakesTick(dt,T){ const F=NV.fl; if(!F) return; const c=camera.position, on=NV.snow>0.05&&!S.interior; F.P.visible=on; if(!on) return; const p=F.pos;
  for(let i=0;i<F.N;i++){ const j=i*3; p[j+1]-=F.sp[i]*dt; p[j]+=Math.sin(T*0.6+i*1.7)*0.35*dt; p[j+2]+=Math.cos(T*0.5+i*2.3)*0.3*dt;
    let dx=p[j]-c.x; if(dx>35) p[j]-=70; else if(dx<-35) p[j]+=70; let dz=p[j+2]-c.z; if(dz>35) p[j+2]-=70; else if(dz<-35) p[j+2]+=70; let dy=p[j+1]-c.y; if(dy<-18) p[j+1]+=36; else if(dy>18) p[j+1]-=36; }
  F.P.geometry.attributes.position.needsUpdate=true; F.P.material.opacity=0.95*Math.min(1,NV.snow*1.5); }
// strings of coloured bulbs round the roofs of the villas, and a wreath on the door of the 20 houses
function nvBulbsBuild(){ const H=W.HOT||[0,0], vs=BLD.filter(b=>b.kind==='villa'&&b.ring&&b.area>70&&b.walkY).sort((a,b)=>Math.hypot(a.c[0]-H[0],a.c[1]-H[1])-Math.hypot(b.c[0]-H[0],b.c[1]-H[1]));
  const ids=new Set(NV.houses.map(h=>h.id)), pick=vs.filter(b=>ids.has(b.id)).concat(vs.filter(b=>!ids.has(b.id)).slice(0,46)); const pts=[];
  for(const b of pick){ const r=b.ring, y=b.walkY+0.44; let acc=0; for(let i=0,j=r.length-1;i<r.length;j=i++){ const ax=r[j][0], az=r[j][1], bx=r[i][0], bz=r[i][1], L=Math.hypot(bx-ax,bz-az); if(L<0.3) continue; let nx=(bz-az)/L, nz=-(bx-ax)/L; if(inBld(b,(ax+bx)/2+nx*0.3,(az+bz)/2+nz*0.3)){ nx=-nx; nz=-nz; }
      for(let s=(0.75-acc%0.75);s<L;s+=0.75){ const f=s/L, sag=Math.abs(Math.sin(s/0.75*Math.PI*0.5))*0.0; pts.push([ax+(bx-ax)*f+nx*0.06,y-0.08*Math.abs(Math.sin((acc+s)*Math.PI/1.5)),az+(bz-az)*f+nz*0.06]); } acc+=L; } }
  const N=pts.length; if(!N) return; const m=new THREE.InstancedMesh(new THREE.SphereGeometry(0.075,6,4),new THREE.MeshBasicMaterial({color:Cc('#ffffff')}),N); const M4=new THREE.Matrix4(), col=new THREE.Color();
  pts.forEach((p,i)=>{ M4.makeTranslation(p[0],p[1],p[2]); m.setMatrixAt(i,M4); m.setColorAt(i,col.set(NV_COLS[i%NV_COLS.length])); }); m.instanceColor.needsUpdate=true; NV.grp.add(m); NV.bulbs=m; NV.bulbN=N; NV.bulbP=pts;
  // wreaths: a green ring with a red bow on the door wall of the houses with a gift at Reyes
  const wr=new THREE.InstancedMesh(new THREE.TorusGeometry(0.26,0.08,6,14),new THREE.MeshLambertMaterial({color:Cc('#1f6b2e')}),NV.houses.length), bw=new THREE.InstancedMesh(new THREE.SphereGeometry(0.07,6,4),new THREE.MeshLambertMaterial({color:Cc('#d62828')}),NV.houses.length);
  NV.houses.forEach((h,i)=>{ const y=hlGround(h.mx+h.nx*0.4,h.mz+h.nz*0.4)+1.75, x=h.mx+h.nx*0.07, z=h.mz+h.nz*0.07; M4.makeRotationY(Math.atan2(h.nx,h.nz)); M4.setPosition(x,y,z); wr.setMatrixAt(i,M4); M4.makeTranslation(x+h.nx*0.05,y-0.24,z+h.nz*0.05); bw.setMatrixAt(i,M4); }); NV.grp.add(wr,bw); }
function nvBulbsTick(dt){ const m=NV.bulbs; if(!m) return; const night=TOD.night; m.material.color.setScalar(0.75+night*1.6); NV.twT-=dt; if(NV.twT>0) return; NV.twT=0.22; const col=new THREE.Color(), n=Math.max(1,(NV.bulbN*0.04)|0);
  for(let k=0;k<n;k++){ const i=(Math.random()*NV.bulbN)|0; col.set(NV_COLS[(Math.random()*NV_COLS.length)|0]); if(Math.random()<0.3) col.multiplyScalar(0.25); m.setColorAt(i,col); } m.instanceColor.needsUpdate=true; }
// the Christmas tree in front of the hotel: cones with snowy tips, a spiral of bulbs, a star and presents underneath
function nvTreeSpot(){ const F=hxFrame(); let best=null; const H=W.HOT||[0,0];
  if(F){ for(let s=HXL.doorN-24;s<=HXL.doorN+24;s+=2) for(let t=F.tO-6;t>=F.tO-34;t-=2){ const p=hxW(s,t); if(Math.abs(s-HXL.doorN)<4) continue; let ok=nvFree(p[0],p[1],5.5); for(let k=0;k<8&&ok;k++){ const a=k/8*Math.PI*2; if(!nvFree(p[0]+Math.cos(a)*4.5,p[1]+Math.sin(a)*4.5,1)) ok=false; }
      if(!ok) continue; const d=Math.hypot(s-(HXL.doorN+8),t-(F.tO-14)); if(!best||d<best.d) best={d,x:p[0],z:p[1]}; } }
  if(!best) for(let r=20;r<=90&&!best;r+=5) for(let k=0;k<24;k++){ const a=k/24*Math.PI*2, x=H[0]+Math.cos(a)*r, z=H[1]+Math.sin(a)*r; if(nvFree(x,z,5.5)){ best={x,z}; break; } }
  return best; }
function nvTreeBuild(){ const sp=nvTreeSpot(); if(!sp) return; const g=new THREE.Group(), y0=W.terrain(sp.x,sp.z); g.position.set(sp.x,y0,sp.z); NV.grp.add(g); NV.tree={x:sp.x,z:sp.z,y:y0,g};
  const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.45,1.6,10),new THREE.MeshLambertMaterial({color:Cc('#6b4a2b')})); tr.position.y=0.8; tr.castShadow=true; g.add(tr);
  const lev=[[3.9,3.2,1.2],[3.2,2.9,3.2],[2.5,2.6,5.0],[1.8,2.3,6.6],[1.1,1.9,8.0]];
  for(const [r,h,y] of lev){ const geo=new THREE.ConeGeometry(r,h,14,3), p=geo.attributes.position, c=new Float32Array(p.count*3), gr=Cc('#1d5e2c'), sn=Cc('#eef3f8');
    for(let i=0;i<p.count;i++){ const yy=p.getY(i), f=(yy+h/2)/h, w=f<0.18&&Math.random()<0.75?1:f>0.55&&Math.random()<0.25?0.6:0; const cc=gr.clone().lerp(sn,w); c[i*3]=cc.r; c[i*3+1]=cc.g; c[i*3+2]=cc.b; }
    geo.setAttribute('color',new THREE.BufferAttribute(c,3)); const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({vertexColors:true})); m.position.y=y+h/2; m.castShadow=true; g.add(m); }
  // the spiral of bulbs (they twinkle with the villas' ones)
  const N=150, bm=new THREE.InstancedMesh(new THREE.SphereGeometry(0.11,6,4),new THREE.MeshBasicMaterial({color:Cc('#ffffff')}),N), M4=new THREE.Matrix4(), col=new THREE.Color();
  for(let i=0;i<N;i++){ const f=i/N, y=1.5+f*7.9, r=3.9*(1-f*0.82)+0.05, a=f*Math.PI*2*5.5; M4.makeTranslation(Math.cos(a)*r,y,Math.sin(a)*r); bm.setMatrixAt(i,M4); bm.setColorAt(i,col.set(NV_COLS[i%NV_COLS.length])); } bm.instanceColor.needsUpdate=true; g.add(bm); NV.tree.bm=bm;
  // the star: five points, flat, always facing up the tree's axis and turning slowly
  const sh=new THREE.Shape(); for(let i=0;i<10;i++){ const a=i/10*Math.PI*2+Math.PI/2, r=i%2?0.38:0.9; if(i) sh.lineTo(Math.cos(a)*r,Math.sin(a)*r); else sh.moveTo(Math.cos(a)*r,Math.sin(a)*r); }
  const st=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:0.18,bevelEnabled:false}),new THREE.MeshBasicMaterial({color:Cc('#ffd23f')})); st.geometry.center(); st.position.y=10.4; g.add(st); NV.tree.star=st;
  // presents
  const R=rng(7); for(let i=0;i<7;i++){ const a=i/7*Math.PI*2+R()*0.4, r=2.2+R()*1.2, w=0.5+R()*0.45, h=0.35+R()*0.4; const bx=nvBox(w,h,w*(0.8+R()*0.4),NV_COLS[(i+1)%5],i%2?'#ffffff':'#d62828'); bx.position.set(Math.cos(a)*r,0,Math.sin(a)*r); bx.rotation.y=R()*3; g.add(bx); }
  bkSign(sp.x+3.2,sp.z+4.4,0,y0,'¡Feliz Navidad!','Árbol del hotel','#1f6b2e'); TREE_EXCL.push([sp.x-6,sp.x+6,sp.z-6,sp.z+6]); }
// a wrapped box with a ribbon cross and a bow (also the Reyes gifts); the lid is a child so it can fly off
function nvBox(w,h,d,c,rib){ const g=new THREE.Group(), mw=new THREE.MeshLambertMaterial({color:Cc(c)}), mr=new THREE.MeshLambertMaterial({color:Cc(rib)});
  const b=new THREE.Mesh(new THREE.BoxGeometry(w,h*0.82,d),mw); b.position.y=h*0.41; b.castShadow=true; g.add(b);
  for(const [x,z] of [[w*0.0+0.001,0],[0,0.001]]){ const r=new THREE.Mesh(new THREE.BoxGeometry(x?0.08:w+0.01,h*0.82+0.01,x?d+0.01:0.08),mr); r.position.y=h*0.41; g.add(r); }
  const lid=new THREE.Group(); lid.position.y=h*0.82; g.add(lid); const l=new THREE.Mesh(new THREE.BoxGeometry(w+0.06,h*0.18,d+0.06),mw); l.position.y=h*0.09; lid.add(l);
  for(const x of [0,1]){ const r=new THREE.Mesh(new THREE.BoxGeometry(x?0.09:w+0.07,h*0.18+0.01,x?d+0.07:0.09),mr); r.position.y=h*0.09; lid.add(r); }
  for(const s of [-1,1]){ const t=new THREE.Mesh(new THREE.TorusGeometry(0.09,0.03,6,10),mr); t.position.set(s*0.08,h*0.18+0.07,0); t.rotation.y=Math.PI/2; t.rotation.x=s*0.5; lid.add(t); }
  g.userData.lid=lid; return g; }
/* ---- Reyes: a gift at the door of the 20 houses, the night of the 5th of January (or with the button) ---- */
function nvGiftsBuild(){ const R=rng(61); NV.gifts=NV.houses.map((h,i)=>{ const x=h.x+h.nx*0.2, z=h.z+h.nz*0.2, y=hlGround(x,z), g=nvBox(0.62,0.52,0.62,NV_COLS[i%5],['#ffffff','#d62828','#ffd23f'][i%3]); g.position.set(x,y,z); g.rotation.y=R()*3; g.visible=false; NV.grp.add(g); return {h,n:h.n,x,y,z,g,lid:g.userData.lid,ly:g.userData.lid.position.y,t:-1}; });
  const tex=canvasTex(64,64,(c,w,h)=>{ c.translate(32,32); c.fillStyle='rgba(255,240,180,1)'; c.beginPath(); for(let i=0;i<8;i++){ const a=i/8*Math.PI*2, r=i%2?7:31; c.lineTo(Math.cos(a)*r,Math.sin(a)*r); } c.fill(); const gr=c.createRadialGradient(0,0,0,0,0,18); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(1,'rgba(255,230,150,0)'); c.fillStyle=gr; c.fillRect(-32,-32,64,64); });
  const st=NV.star=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})); st.scale.setScalar(60); st.visible=false; NV.grp.add(st); }
function nvOpened(g){ return NV.ry.o.includes(g.n); }
function nvReyes(on,opt){ opt=opt||{}; on=!!on; if(!WP.navidad||on===NV.reyes) return; if(on&&!NV.on) nvSet(true,{quiet:true}); nvBuild(); NV.reyes=on; NV.rAuto=!!opt.auto;
  if(on){ nvLoad(); for(const G of NV.gifts){ G.g.visible=true; const o=nvOpened(G); G.lid.visible=!o; G.lid.position.set(0,G.ly,0); G.lid.rotation.set(0,0,0); G.t=o?2:-1; } if(!opt.auto&&TOD.night<0.5){ NV.prevTOD=TOD.mode; setTOD('noche'); }
    toast('¡Han pasado los Reyes Magos!','Hay un regalo en la puerta de '+NV.gifts.length+' villas. Búscalos y pulsa «Abrir el regalo»'); if(MP.code&&!opt.net) mpSend({t:'nvrey'}); }
  else { for(const G of NV.gifts) G.g.visible=false; if(NV.prevTOD){ setTOD(NV.prevTOD); NV.prevTOD=null; } }
  if(NV.star) NV.star.visible=on; nvUI(); }
function nvGiftNear(){ if(!NV.reyes||S.mode!=='walk'||P.swim) return null; let best=null, bd=2.3; for(const G of NV.gifts){ if(nvOpened(G)||G.t>=0) continue; const d=Math.hypot(P.x-G.x,P.z-G.z); if(d<bd){ bd=d; best=G; } } return best?{k:'nvGift',ref:best,label:'Abrir el regalo'}:null; }
// the surprise: coins, something from the shop, sweet coal or a jack-in-the-box with a snowman head
function nvOpen(G){ if(!G||nvOpened(G)) return; G.t=0; ensureAudio(); blip('gold'); nvConfetti(G.x,G.y+0.7,G.z); NV.ry.o.push(G.n); nvSave(); const n=NV.ry.o.length, N=NV.gifts.length, r=Math.random();
  setTimeout(()=>{ let t='', s='';
    if(r<0.45){ const c=3+((Math.random()*10)|0); prgEarn(c,'Regalo de Reyes'); t='¡Monedas!'; s='Te han traído '+c+' monedas'; }
    else if(r<0.7){ const L=SHOP.filter(it=>it.p>0&&it.p<=70&&!PRG.own[it.id]&&!it.req); if(L.length){ const it=L[(Math.random()*L.length)|0]; PRG.own[it.id]=1; PRG.log.unshift([Date.now(),0,'Regalo: '+it.n]); if(PRG.log.length>12) PRG.log.length=12; prgSave(); t='¡Un regalo de la tienda!'; s=it.n+'. Póntelo en Menú → Premios → Tienda'; } else { prgEarn(8,'Regalo de Reyes'); t='¡Monedas!'; s='Ya tienes todo lo de la tienda: 8 monedas'; } }
    else if(r<0.85){ prgEarn(1,'Carbón dulce'); t='¡Carbón!'; s='Tranquilo: es carbón dulce, de azúcar. ¡Riquísimo!'; }
    else { nvJack(G); prgEarn(2,'Caja sorpresa'); t='¡Caja sorpresa!'; s='¡Boing! Era una caja con muelle'; }
    toast(t+' · Regalo '+n+' de '+N,s); if(n>=N){ setTimeout(()=>{ toast('¡Todos los regalos de Reyes!','Has abierto los '+N); prgTrophy('reyes'); },2600); } nvUI(); },650); }
function nvJack(G){ const g=new THREE.Group(); const sp=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.06,0.5,6),new THREE.MeshLambertMaterial({color:Cc('#9aa3ab')})); sp.position.y=0.25; g.add(sp);
  const hd=new THREE.Mesh(new THREE.SphereGeometry(0.2,10,8),new THREE.MeshLambertMaterial({color:Cc('#f4f6f8')})); hd.position.y=0.62; g.add(hd); const ns=new THREE.Mesh(new THREE.ConeGeometry(0.04,0.18,6),new THREE.MeshLambertMaterial({color:Cc('#f08a24')})); ns.rotation.z=-Math.PI/2; ns.position.set(0.2,0.62,0); g.add(ns);
  g.position.set(G.x,G.y+0.45,G.z); g.rotation.y=-Math.atan2(P.z-G.z,P.x-G.x); g.scale.setScalar(0.1); NV.grp.add(g); G.jack=g; G.jt=0; }
function nvConfetti(x,y,z){ const N=90, pos=new Float32Array(N*3), col=new Float32Array(N*3), vel=[]; const c=new THREE.Color();
  for(let i=0;i<N;i++){ pos[i*3]=x; pos[i*3+1]=y; pos[i*3+2]=z; c.set(NV_COLS[i%5]); col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b; const a=Math.random()*Math.PI*2, s=1+Math.random()*2.5; vel.push([Math.cos(a)*s,3+Math.random()*3,Math.sin(a)*s]); }
  const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3)); geo.setAttribute('color',new THREE.BufferAttribute(col,3)); geo.userData.y0=y-0.66; const p=new THREE.Points(geo,new THREE.PointsMaterial({size:0.09,vertexColors:true})); p.frustumCulled=false; NV.grp.add(p); (NV.cf=NV.cf||[]).push({p,vel,t:0}); }
function nvGiftsTick(dt,T){ for(const G of NV.gifts){ if(G.t>=0&&G.t<1.2){ G.t+=dt; G.lid.position.set(G.t*0.5,G.ly+G.t*1.6-G.t*G.t*1.3,0); G.lid.rotation.z=-G.t*2.2; if(G.t>=1.2) G.lid.visible=false; }
    if(G.jack){ G.jt+=dt; G.jack.scale.setScalar(Math.min(1,G.jt*4)*(1+Math.sin(G.jt*14)*0.15*Math.exp(-G.jt*2))); if(G.jt>6){ NV.grp.remove(G.jack); G.jack=null; } } }
  if(NV.cf) for(let k=NV.cf.length-1;k>=0;k--){ const C=NV.cf[k]; C.t+=dt; const a=C.p.geometry.attributes.position.array; C.vel.forEach((v,i)=>{ v[1]-=7*dt; v[0]*=0.985; v[2]*=0.985; a[i*3]+=v[0]*dt; a[i*3+1]=Math.max(a[i*3+1]+v[1]*dt,C.p.geometry.userData.y0||-1e9); a[i*3+2]+=v[2]*dt; }); C.p.geometry.attributes.position.needsUpdate=true; if(C.t>2.5){ NV.grp.remove(C.p); NV.cf.splice(k,1); } }
  if(NV.star&&NV.star.visible){ const tr=NV.tree, H=tr?[tr.x,tr.z]:(W.HOT||[0,0]); const a=T*0.01; NV.star.position.set(H[0]+Math.cos(a)*400,TOD.night>0.3?420:-1e4,H[1]+Math.sin(a)*400); } }
/* ---- switching on and off ---- */
function nvAuto(d){ if(!WP.navidad) return; const w=nvWindow(d);
  if(w&&!NV.on&&store.get('vg_nv_off')!==nvKey(d)){ nvSet(true,{auto:true}); toast('¡Feliz Navidad!','Ha nevado en la isla: trineos, bolas de nieve y luces en las villas'); }
  else if(!w&&NV.on&&NV.auto) nvSet(false,{auto:true});
  const r=NV.on&&nvReyesWindow(d); if(r&&!NV.reyes&&store.get('vg_nv_roff')!==nvKey(d)) nvReyes(true,{auto:true}); else if(!r&&NV.reyes&&NV.rAuto) nvReyes(false,{auto:true}); }
function nvSet(on,opt){ opt=opt||{}; on=!!on; if(!WP.navidad||on===NV.on) return;
  if(on){ if(HL.on) hlSet(false); nvBuild(); NV.on=true; NV.auto=!!opt.auto; NV.grp.visible=true; NV.prevMus=MUS.st; musSet('navidad'); store.set('vg_mus',NV.prevMus); document.body.classList.add('nvon'); updateTOD(true);
    if(MP.code&&!opt.net) mpSend({t:'nvon'}); if(!opt.auto&&!opt.quiet) tip('Ha nevado: coge un trineo en lo alto de las sendas, lanza bolas de nieve (botón ❄) o haz un muñeco',4600); }
  else { if(NV.reyes) nvReyes(false); snEndAll(); NV.on=false; NV.auto=false; NV.grp.visible=false; if(MUS.st==='navidad') musSet(NV.prevMus&&NV.prevMus!=='navidad'?NV.prevMus:'off'); document.body.classList.remove('nvon'); updateTOD(true);
    if(!opt.auto&&nvWindow(new Date())) store.set('vg_nv_off',nvKey()); }
  nvUI(); mpHello(); }
// winter light: a paler sky and the snow lighting things from below (called from applyTOD)
function nvLight(){ if(typeof NV==='undefined'||!NV||!NV.on) return; const k=NV.snow; if(k<=0) return; const fc=scene.fog.color; fc.lerp(Cc('#c9d3dd'),0.35*k*(1-TOD.night*0.7)); scene.background.copy(fc); hemi.groundColor.lerp(Cc('#dfe6ee'),0.5*k); }
function nvTick(dt,T){ if(!WP.navidad) return; NV.t+=dt; NV.ac-=dt; if(NV.ac<=0){ NV.ac=20; nvAuto(new Date()); }
  const tg=NV.on?1:0; if(NV.snow!==tg){ NV.snow=tg>NV.snow?Math.min(1,NV.snow+dt*0.5):Math.max(0,NV.snow-dt*0.8); SNOWU.value=NV.snow; if(Math.abs(NV.snow-0.5)<dt*0.8||NV.snow===tg) nvRoofs(NV.snow>0.5); if(NV.snow===tg) updateTOD(true); }
  if(!NV.built) return;
  if(NV.on){ nvFlakesTick(dt,T); nvBulbsTick(dt); if(NV.tree){ NV.tree.star.rotation.y+=dt*0.6; NV.tree.bm.material.color.setScalar(0.8+TOD.night*1.5); if(NV.twT>0.2){ const col=new THREE.Color(); for(let k=0;k<6;k++){ const i=(Math.random()*150)|0; col.set(NV_COLS[(Math.random()*5)|0]); NV.tree.bm.setColorAt(i,col); } NV.tree.bm.instanceColor.needsUpdate=true; } } nvGiftsTick(dt,T); }
  snTick(dt,T); }
// snowy roofs: the gravel texture becomes a white one while it is snowing
function nvRoofs(on){ if(!NV.rTex) NV.rTex=canvasTex(128,128,(c,w,h)=>{ c.fillStyle='#e9eef3'; c.fillRect(0,0,w,h); for(let i=0;i<500;i++){ const v=215+Math.random()*40|0; c.fillStyle='rgba('+v+','+v+','+(v+8)+',0.5)'; c.fillRect(Math.random()*w,Math.random()*h,2,2); } },true);
  for(const m of ROOFMATS){ if(!m.userData.map0) m.userData.map0=m.map; m.map=on?NV.rTex:m.userData.map0; m.needsUpdate=true; }
  // the downhill trails become pistes of packed snow
  if(!NV.pMat) NV.pMat=new THREE.MeshLambertMaterial({color:Cc('#dde6ef'),side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  for(const c of (BK.tr||[])) if(c.rib){ if(!c.rib.userData.m0) c.rib.userData.m0=c.rib.material; c.rib.material=on?NV.pMat:c.rib.userData.m0; } }
/* ---- the sala: invitation and gifts ---- */
function nvNetIn(p,o){ if(o.t==='nvon'&&WP.navidad&&!NV.on) mpPrompt('<b>'+esc(p.n)+'</b> ha encendido la Navidad: nieve, trineos y bolas de nieve. ¿Te unes?','Sí, Navidad',()=>nvSet(true,{net:true}),15000);
  else if(o.t==='nvrey'&&WP.navidad&&!NV.reyes) mpPrompt('<b>'+esc(p.n)+'</b> dice que han pasado los Reyes Magos: hay regalos en las puertas. ¿Vas a buscarlos?','Sí, Reyes',()=>nvReyes(true,{net:true}),15000); }
function nvUI(){ const b=$('mXmasB'); if(b) b.textContent=NV.on?'🎄 Navidad':'Navidad'; if(!$('nvSheet').hidden) nvSheet(NV.tab); snBtn(); }
function nvGoGift(G){ if(!G) return; $('nvSheet').hidden=true; fadeTo(()=>{ snLeave(); const x=G.x+G.h.nx*1.6, z=G.z+G.h.nz*1.6; P.x=x; P.z=z; P.y=groundAt(x,z,G.y+3); P.vx=P.vy=P.vz=0; P.swim=false; P.onGround=true; P.yaw=Math.atan2(G.z-z,G.x-x); camS.yaw=P.yaw; S.snap=true; setMode('walk'); }); }
function nvNextGift(){ let b=null, bd=1e9; for(const G of NV.gifts){ if(nvOpened(G)) continue; const d=Math.hypot(G.x-P.x,G.z-P.z); if(d<bd){ bd=d; b=G; } } return b; }
function nvGoTree(){ const T0=NV.tree; if(!T0) return; $('nvSheet').hidden=true; fadeTo(()=>{ snLeave(); const x=T0.x, z=T0.z+7; P.x=x; P.z=z; P.y=groundAt(x,z,99); P.vx=P.vy=P.vz=0; P.swim=false; P.yaw=-Math.PI/2; camS.yaw=P.yaw; camS.pitch=0.3; S.snap=true; setMode('walk'); }); }
/* ---- the sheet ---- */
function nvSheet(tab){ if(!WP.navidad) return; closeModal(); nvBuild(); NV.tab=tab||NV.tab||'navidad'; const T=NV.tab, B=$('nvBody'), N=NV.gifts.length, o=NV.ry.o.length, st=snStats();
  let h='<h2>🎄 Navidad y Reyes</h2><div class="tabs">'+[['navidad','Navidad'],['trineo','Trineo'],['nieve','Bolas y muñecos'],['reyes','Reyes'],['ayuda','Cómo se juega']].map(t=>'<button data-nvt="'+t[0]+'" class="'+(T===t[0]?'on':'')+'">'+t[1]+'</button>').join('')+'</div>';
  if(T==='navidad'){ h+='<p>'+(NV.on?'<b>La Navidad está encendida.</b> ':'')+'Ha nevado en la isla: nieve en el suelo, en los tejados y en las encinas, copos cayendo, <b>luces de colores</b> en las villas, un <b>árbol de Navidad</b> delante del hotel y la emisora Navidad con villancicos propios.</p><p class="note">Se enciende sola del 20 de diciembre al 6 de enero; cualquier otro día, con este botón. Al apagarla vuelve tu música.</p>';
    h+='<div class="row"><button class="btn small primary" id="nvOn">'+(NV.on?'Apagar la Navidad':'Encender la Navidad')+'</button>'+(NV.tree?'<button class="btn small" id="nvTree">Ir al árbol del hotel</button>':'')+'</div>';
    h+='<div class="tablewrap"><table class="card"><tbody><tr><td>Mejor bajada en trineo</td><td class="num">'+(st.best?kartFmt(st.best)+' ('+st.bestN+')':'Aún ninguna')+'</td></tr><tr><td>Muñecos de nieve hechos</td><td class="num">'+st.built+'</td></tr><tr><td>Bolas de nieve lanzadas / acertadas</td><td class="num">'+st.thrown+' / '+st.hits+'</td></tr><tr><td>Regalos de Reyes abiertos</td><td class="num">'+o+' de '+N+'</td></tr></tbody></table></div>'; }
  else if(T==='trineo') h+=snTabSled();
  else if(T==='nieve') h+=snTabSnow();
  else if(T==='reyes'){ h+='<p>La noche del <b>5 de enero</b> pasan los <b>Reyes Magos</b> y dejan un <b>regalo</b> en la puerta de '+N+' villas (las mismas de la ruta de Halloween). Cada regalo es una sorpresa: monedas, algo de la tienda, carbón dulce o una caja con muelle.</p><p class="note">Los regalos salen solos al anochecer del 5 de enero y siguen el día 6; cualquier otro día, con este botón (se hace de noche). Cada regalo se abre una vez por Navidad.</p>';
    h+='<div class="row"><button class="btn small primary" id="nvRey">'+(NV.reyes?'Quitar los regalos':'Noche de Reyes ahora')+'</button>'+(NV.reyes&&o<N?'<button class="btn small" id="nvNext">Ir al regalo más cercano</button>':'')+'</div>';
    h+='<div class="tablewrap"><table class="card"><tbody><tr><td>Regalos abiertos</td><td class="num">'+o+' de '+N+'</td></tr><tr><td>Trofeo «Noche de Reyes»</td><td class="num">'+(PRG.tro.reyes?'Conseguido':'Abre los '+N+' regalos')+'</td></tr></tbody></table></div>';
    if(NV.reyes) h+='<h3>Los regalos</h3><div class="tablewrap"><table class="card"><thead><tr><th>Casa</th><th>Regalo</th><th>Distancia</th><th></th></tr></thead><tbody>'+NV.gifts.map((G,i)=>'<tr><td>'+G.n+'</td><td>'+(nvOpened(G)?'✓ abierto':'🎁 por abrir')+'</td><td class="num">'+fmt(Math.hypot(G.x-P.x,G.z-P.z))+' m</td><td><button class="btn small" data-nvg="'+i+'">Ir</button></td></tr>').join('')+'</tbody></table></div>'; }
  else h+='<h3>Cómo se juega</h3><ul>'+nvGuideHTML().replace(/^<li>|<\/li>$/g,'').split('</li><li>').map(x=>'<li>'+x+'</li>').join('')+'</ul><h3>Glosario</h3><dl class="gloss">'+nvGlossHTML()+'</dl>';
  h+='<div class="row" style="margin-top:10px"><button class="btn small" id="nvClose">Cerrar</button></div>'; B.innerHTML=h; $('nvSheet').hidden=false;
  B.querySelectorAll('[data-nvt]').forEach(b=>b.onclick=()=>nvSheet(b.dataset.nvt)); $('nvClose').onclick=()=>{ $('nvSheet').hidden=true; };
  const on=$('nvOn'); if(on) on.onclick=()=>{ ensureAudio(); nvSet(!NV.on); nvSheet('navidad'); }; const tr=$('nvTree'); if(tr) tr.onclick=nvGoTree;
  const ry=$('nvRey'); if(ry) ry.onclick=()=>{ ensureAudio(); if(NV.reyes){ nvReyes(false); if(nvReyesWindow(new Date())) store.set('vg_nv_roff',nvKey()); } else nvReyes(true); nvSheet('reyes'); };
  const nx=$('nvNext'); if(nx) nx.onclick=()=>nvGoGift(nvNextGift()); B.querySelectorAll('[data-nvg]').forEach(b=>b.onclick=()=>nvGoGift(NV.gifts[+b.dataset.nvg]));
  if(T==='trineo'||T==='nieve') snTabWire(); }
/* ---- map, legend, guide and glossary ---- */
function nvDrawMap(g,m2c,s,big){ if(!NV.on||!NV.built) return; g.save();
  if(NV.tree){ const [x,y]=m2c(NV.tree.x,NV.tree.z), r=(big?6:4)*s; g.fillStyle='#1f6b2e'; g.strokeStyle='#fff'; g.lineWidth=1.2*s; g.beginPath(); g.moveTo(x,y-r); g.lineTo(x+r*0.75,y+r*0.7); g.lineTo(x-r*0.75,y+r*0.7); g.closePath(); g.fill(); g.stroke(); g.fillStyle='#ffd23f'; g.beginPath(); g.arc(x,y-r,1.6*s,0,7); g.fill(); }
  if(NV.reyes) for(const G of NV.gifts){ const [x,y]=m2c(G.x,G.z), r=(big?3.2:2.2)*s; g.fillStyle=nvOpened(G)?'#9aa3ab':'#d62828'; g.strokeStyle='#fff'; g.lineWidth=1*s; g.fillRect(x-r,y-r,2*r,2*r); g.strokeRect(x-r,y-r,2*r,2*r); if(!nvOpened(G)){ g.fillStyle='#ffd23f'; g.fillRect(x-0.6*s,y-r,1.2*s,2*r); } }
  snDrawMap(g,m2c,s,big); g.restore(); }
function nvLegend(){ if(!NV.on) return ''; let h='<div><i style="background:#1f6b2e;border:2px solid #fff;border-radius:2px;clip-path:polygon(50% 0,100% 100%,0 100%)"></i>Árbol de Navidad del hotel</div>';
  if(NV.reyes) h+='<div><i style="background:#d62828;border:2px solid #fff;border-radius:2px"></i>Regalo de Reyes por abrir (gris: ya abierto)</div>'; return h+snLegend(); }
function nvGuideHTML(){ if(!WP.navidad) return ''; return '<li><b>Navidad</b> (botón <b>Navidad</b> del inicio o del menú; sola del 20 de diciembre al 6 de enero): nieve en la isla, luces en las villas, árbol en el hotel y emisora con villancicos propios.</li>'+snGuideHTML()+'<li><b>Reyes</b>: la noche del 5 de enero (o con el botón de la pestaña Reyes) hay un regalo en la puerta de '+(NV.gifts.length||20)+' villas. Acércate y pulsa <b>Abrir el regalo</b>: monedas, algo de la tienda, carbón dulce o una caja sorpresa. Ábrelos todos para el trofeo «Noche de Reyes».</li>'; }
function nvGlossHTML(){ return '<dt>Reyes Magos</dt><dd>Melchor, Gaspar y Baltasar: en España traen los regalos la noche del 5 al 6 de enero.</dd><dt>Villancico</dt><dd>Canción de Navidad. Los de la emisora del juego son inventados.</dd><dt>Carbón dulce</dt><dd>Caramelo negro con forma de carbón: lo que traen los Reyes, en broma, a quien se ha portado regular.</dd>'+snGlossHTML(); }
{ const mx=$('mXmas'); if(mx){ mx.hidden=!WP.navidad; mx.onclick=()=>{ saveName(); ensureAudio(); nvSheet('navidad'); }; } const bs=$('bSnow'); if(bs) bs.onclick=e=>{ e.preventDefault(); snThrow(); }; }
