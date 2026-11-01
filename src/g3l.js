
/* ================= tee sets, the caddie, reading the green and the weather ================= */
const TEECOL2={negras:'#16231b',blancas:'#f4f4f2',amarillas:'#f2c230',azules:'#2f6bd6',rojas:'#d6442a'};
const TEE_ORDER=['negras','blancas','amarillas','azules','rojas'];
function courseTees(C){ const s=new Set(); for(const i of C.holes){ const H=W.HOLES[i]; if(H&&H.tees) for(const k in H.tees) s.add(k); } return [...s].sort((a,b)=>TEE_ORDER.indexOf(a)-TEE_ORDER.indexOf(b)); }
function teeSet(C){ C=C||courseOf(); const list=courseTees(C); if(!list.length) return ''; const k=store.get(WP.key+'_tee_'+C.id); return list.includes(k)?k:(list.includes(C.tee)?C.tee:list[0]); }
function teePos(H){ const k=teeSet(courseOf(H)); return H.tees&&H.tees[k]?H.tees[k]:[H.tx,H.tz]; }
function teeLen(H){ const k=teeSet(courseOf(H)); if(!k||!H.tees||!H.tees[k]) return H.L; const e=holeTees(H).find(t=>t[0]===k); return e?e[1]:H.L; }
function courseLen(C){ return C.holes.reduce((a,i)=>a+teeLen(W.HOLES[i]),0); }
function teeNote(C){ const k=teeSet(C); const base=C.note||WP.T.cardNote; if(!k||!C.tee||k===C.tee) return base;
  return 'Metros desde barras '+k+', medidos sobre la línea del hoyo desde su posición (los de barras '+C.tee+' son los de la tarjeta oficial del club).'; }
function setTeeSet(k){ const C=courseOf(); store.set(WP.key+'_tee_'+C.id,k); renderTeeRow(); renderCourseRow(); CAD.key=''; }
function teeChips(){ const C=courseOf(), L=courseTees(C); if(L.length<2) return ''; const cur=teeSet(C);
  return '<div class="row teesel" style="margin:0 0 10px;gap:6px;align-items:center;flex-wrap:wrap"><span class="lbl" style="margin:0">Barras</span>'+L.map(k=>'<button class="btn small'+(k===cur?' primary':'')+'" data-tee="'+k+'"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+TEECOL2[k]+';border:1px solid rgba(0,0,0,.35);margin-right:5px;vertical-align:-1px"></i>'+k[0].toUpperCase()+k.slice(1)+'</button>').join('')+'</div>'; }
function wireTeeChips(root){ (root||document).querySelectorAll('[data-tee]').forEach(b=>b.onclick=()=>{ setTeeSet(b.dataset.tee); if(!$('modal').hidden&&root!==$('teeRow')){ const on=$('tabs').querySelector('.on'); openModal(on?on.dataset.k:'hoyos'); } }); }
function renderTeeRow(){ const box=$('teeRow'); if(!box) return; const html=teeChips(); box.hidden=!html; box.innerHTML=html; wireTeeChips(box); }
// the markers of every set of tees: two balls of its colour
function buildTeeSets(){ const list=[]; for(const H of W.HOLES){ if(!H.tees) continue; for(const k in H.tees){ const t=H.tees[k]; list.push([t[0],t[1],k,H]); } }
  if(!list.length) return; const m=new THREE.InstancedMesh(new THREE.SphereGeometry(0.19,10,8),new THREE.MeshLambertMaterial({color:0xffffff}),list.length*2); const dm=new THREE.Object3D(), col=new THREE.Color(); let n=0;
  for(const [x,z,k,H] of list){ for(const s of [-1,1]){ const wx=x+1.2*H.tc-s*2.4*H.ts, wz=z+1.2*H.ts+s*2.4*H.tc; dm.position.set(wx,W.terrain(wx,wz)+0.19,wz); dm.updateMatrix(); m.setMatrixAt(n,dm.matrix); m.setColorAt(n,col.copy(Cc(TEECOL2[k]||'#2f6bd6'))); n++; } }
  m.instanceColor.needsUpdate=true; m.castShadow=true; scene.add(m); }

/* ---- the caddie: the club that lands short of the flag with this wind and this slope, and how long the shot "plays" ---- */
const CAD={key:'',res:null};
function baseWind(){ const b=S.g.windBase; return b?{x:Math.cos(b.a)*b.sp,z:Math.sin(b.a)*b.sp}:S.g.wind; }
// carry of a club on flat ground without wind (what the caddie compares with)
function flatCarry(i){ const c=CLUBS[i], M=shotMods(i), a=(c.loft+M.dl)*Math.PI/180, sp=c.v0*lieSpeed(i)*M.k; let x=0,y=0,vx=Math.cos(a)*sp,vy=Math.sin(a)*sp; const dt=1/60;
  for(let k=0;k<900;k++){ const s=Math.hypot(vx,vy); vx+=-KD*s*vx*dt; vy+=(-GRAV-KD*s*vy)*dt; x+=vx*dt; y+=vy*dt; if(y<0&&vy<0) break; } return x; }
function caddie(){ const g=S.g, H=hole(); if(!H||g.lie===5) return null; const d=distToPin(); if(d<22) return null; const w=baseWind();
  const key=[g.ball.x.toFixed(1),g.ball.z.toFixed(1),w.x.toFixed(1),w.z.toFixed(1),g.lie,g.shot||'',WX.wet].join('|'); if(CAD.key===key) return CAD.res; CAD.key=key;
  const yaw=Math.atan2(H.pin[1]-g.ball.z,H.pin[0]-g.ball.x); let best=null;
  for(let i=0;i<8;i++){ const c=CLUBS[i], M=shotMods(i), a=(c.loft+M.dl)*Math.PI/180, sp=c.v0*lieSpeed(i)*M.k;
    const s=newSim({x:g.ball.x,y:g.ball.y+0.05,z:g.ball.z},{x:Math.cos(yaw)*Math.cos(a)*sp,y:Math.sin(a)*sp,z:Math.sin(yaw)*Math.cos(a)*sp},false,{cup:null});
    for(let k=0;k<900&&!s.land&&!s.done;k++) simStep(s,1/60,w); if(!s.land) continue; const carry=Math.hypot(s.land.x-g.ball.x,s.land.z-g.ball.z);
    const want=Math.max(10,d-(i<=1?16:i<=3?8:3)); const err=Math.abs(carry-want); if(!best||err<best.err) best={i,carry,want,err}; }
  if(!best) return (CAD.res=null);
  const fc=flatCarry(best.i); CAD.res={club:best.i,plays:Math.round(d*fc/Math.max(1,best.carry)),carry:Math.round(best.carry),flat:Math.round(fc),reach:best.carry>=d-30}; return CAD.res; }
function caddieLine(){ const el=$('hcCaddie'); if(!el) return; const aiming=S.mode==='aim'||S.mode==='swing'; const r=aiming?caddie():null; if(!r){ el.hidden=true; return; } el.hidden=false;
  const d=Math.round(distToPin()), use=S.g.club!==r.club?' <button class="chip pe" id="useCad">Usar</button>':'';
  if(r.reach){ const df=r.plays-d; el.innerHTML='Caddie: <b>'+CLUBS[r.club].n+'</b> · juega como <b>'+r.plays+' m</b>'+(Math.abs(df)>=3?' <span>('+(df>0?'+':'')+df+' por viento y desnivel)</span>':'')+use; }
  else { const df=r.carry-r.flat; el.innerHTML='Caddie: <b>'+CLUBS[r.club].n+'</b> · hoy vuela <b>'+r.carry+' m</b>'+(Math.abs(df)>=3?' <span>('+(df>0?'+':'')+df+' por viento y desnivel)</span>':'')+use; }
  const u=$('useCad'); if(u) u.onclick=()=>{ S.g.club=r.club; prevKey=''; updateGolfHUD(); }; }

/* ---- reading the green: arrows of the fall between the ball and the hole, and the whole line of the putt ---- */
const GREAD={mesh:null,key:''}; let PUTT_FULL=store.get('vg_puttfull')!=='0';
const GREAD_COL=[Cc('#ffffff'),Cc('#ffd23f'),Cc('#ff8a3d')];
function greenArrows(show){ if(!GREAD.mesh){ const sh=new THREE.Shape(); sh.moveTo(0.42,0); sh.lineTo(-0.2,0.2); sh.lineTo(-0.08,0); sh.lineTo(-0.2,-0.2); sh.closePath(); const g=new THREE.ShapeGeometry(sh); g.rotateX(-Math.PI/2);
    GREAD.mesh=new THREE.InstancedMesh(g,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.62,depthWrite:false,side:THREE.DoubleSide}),170); GREAD.mesh.frustumCulled=false; GREAD.mesh.renderOrder=3; GREAD.mesh.visible=false; scene.add(GREAD.mesh); }
  const M=GREAD.mesh; if(!show){ if(M.visible){ M.visible=false; GREAD.key=''; } return; } const g=S.g, H=hole(); if(!H) return; const key=g.ball.x.toFixed(2)+g.ball.z.toFixed(2); if(GREAD.key===key&&M.visible) return; GREAD.key=key; M.visible=true;
  const bx=g.ball.x, bz=g.ball.z, px=H.pin[0], pz=H.pin[1]; const dm=new THREE.Object3D(); let n=0; const cx=(bx+px)/2, cz=(bz+pz)/2, R=Math.min(18,Math.hypot(px-bx,pz-bz)/2+4), st=Math.max(1.3,R/6);
  for(let x=cx-R;x<=cx+R+1e-6&&n<170;x+=st) for(let z=cz-R;z<=cz+R+1e-6&&n<170;z+=st){ if(Math.hypot(x-cx,z-cz)>R) continue; const c=W.surfAt(x,z); if(c!==5&&c!==4) continue;
    const e=0.4, h0=W.terrain(x,z), gx=(W.terrain(x+e,z)-W.terrain(x-e,z))/(2*e), gz=(W.terrain(x,z+e)-W.terrain(x,z-e))/(2*e), sl=Math.hypot(gx,gz); if(sl<0.002) continue;
    dm.position.set(x,h0+0.05,z); dm.rotation.set(0,-Math.atan2(-gz,-gx),0); const k=Math.min(1.25,0.5+sl*28); dm.scale.set(k,1,k); dm.updateMatrix(); M.setMatrixAt(n,dm.matrix); M.setColorAt(n,GREAD_COL[sl<0.01?0:sl<0.02?1:2]); n++; }
  M.count=n; M.instanceMatrix.needsUpdate=true; if(M.instanceColor) M.instanceColor.needsUpdate=true; }

/* ---- the weather: clear, cloudy or rain; the wind of each hole gusts while you aim ---- */
var WXP={despejado:{sun:1,hemi:1,grey:0,cloud:0.16,fog:1,wind:1},nubes:{sun:0.5,hemi:1.25,grey:0.45,cloud:0.44,fog:0.6,wind:1.15},lluvia:{sun:0.26,hemi:1.12,grey:0.68,cloud:0.6,fog:0.3,wind:1.4}};
var WX={mode:WXP[store.get('vg_wx')]?store.get('vg_wx'):'despejado',rain:null,rainV:null,wet:0,snd:null,sOn:false,hudT:0};
function applyWeather(){ if(!WX||!WXP) return; const p=WXP[WX.mode]||WXP.despejado; sun.intensity*=p.sun; hemi.intensity*=p.hemi;
  if(p.grey>0){ const dim=1-TOD.night*0.85, gH=new THREE.Color().copy(Cc('#b4bcc4')).multiplyScalar(dim), gZ=new THREE.Color().copy(Cc('#8d98a3')).multiplyScalar(dim);
    scene.fog.color.lerp(gH,p.grey); scene.background.copy(scene.fog.color); const su=sky.material.uniforms; su.uHor.value.lerp(gH,p.grey); su.uZen.value.lerp(gZ,p.grey); su.uSunCol.value.multiplyScalar(1-p.grey*0.7);
    hemi.color.lerp(gH,p.grey*0.5); }
  sky.material.uniforms.uCloud.value=p.cloud; sky.material.uniforms.uOver.value=p.grey; scene.fog.near=FOG_NEAR*p.fog; scene.fog.far=FOG_FAR*p.fog; WX.wet=WX.mode==='lluvia'?1:0;
  for(const m of WATERMATS){ const u=m.uniforms; if(p.grey>0){ u.uFog.value.copy(scene.fog.color); u.uHor.value.copy(scene.fog.color); } if(u.uNear) u.uNear.value=scene.fog.near; if(u.uFar) u.uFar.value=scene.fog.far; } }
function setWeather(m){ if(!WXP[m]) return; const old=WXP[WX.mode]||WXP.despejado; WX.mode=m; store.set('vg_wx',m); updateTOD(true); if(typeof ppSnapExposure==='function') ppSnapExposure();
  document.querySelectorAll('#wxRow button').forEach(b=>b.classList.toggle('on',b.dataset.wx===m));
  const b=S.g&&S.g.windBase; if(b){ b.sp*=WXP[m].wind/old.wind; const w=S.g.wind; w.sp=b.sp; w.a=b.a; w.x=Math.cos(b.a)*b.sp; w.z=Math.sin(b.a)*b.sp; CAD.key=''; prevKey=''; if(hole()) updateGolfHUD(); } }
function rainTick(dt){ const on=WX.mode==='lluvia'&&!S.interior&&S.mode!=='loading';
  if(on!==WX.sOn){ WX.sOn=on; rainSound(on); }
  if(!WX.rain){ if(!on) return; const N=FXQ?2600:1500; const g=new THREE.BufferGeometry(); const a=new Float32Array(N*6); WX.rainV=new Float32Array(N); const c=camera.position;
    for(let i=0;i<N;i++){ const x=c.x+(Math.random()-0.5)*70, y=c.y-12+Math.random()*46, z=c.z+(Math.random()-0.5)*70; a.set([x,y,z,x,y-0.7,z],i*6); WX.rainV[i]=13+Math.random()*5; }
    g.setAttribute('position',new THREE.BufferAttribute(a,3)); WX.rain=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:Cc('#d3dbe2'),transparent:true,opacity:0.45,depthWrite:false})); WX.rain.frustumCulled=false; scene.add(WX.rain); }
  WX.rain.visible=on; if(!on) return; const c=camera.position, a=WX.rain.geometry.attributes.position.array, w=S.g.wind||{x:0,z:0}, wx=w.x*0.5*dt, wz=w.z*0.5*dt, sx=w.x*0.045, sz=w.z*0.045;
  for(let i=0;i<WX.rainV.length;i++){ const o=i*6; let y=a[o+1]-WX.rainV[i]*dt, x=a[o]+wx, z=a[o+2]+wz; if(y<c.y-12||Math.abs(x-c.x)>35||Math.abs(z-c.z)>35){ x=c.x+(Math.random()-0.5)*70; z=c.z+(Math.random()-0.5)*70; y=c.y+16+Math.random()*18; }
    a[o]=x; a[o+1]=y; a[o+2]=z; a[o+3]=x-sx; a[o+4]=y-0.7; a[o+5]=z-sz; }
  WX.rain.geometry.attributes.position.needsUpdate=true; }
function rainSound(on){ if(!AC||!master) return; if(!WX.snd){ if(!on) return; try{ const n=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate), d=n.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; const s=AC.createBufferSource(); s.buffer=n; s.loop=true;
      const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=2600; const g=AC.createGain(); g.gain.value=0; s.connect(f); f.connect(g); g.connect(master); s.start(); WX.snd=g; }catch(e){ return; } }
  WX.snd.gain.setTargetAtTime(on?0.07:0,AC.currentTime,0.6); }
// gusts: while you aim the wind of the hole breathes (speed ±30 %, direction ±8°)
function windTick(T,dt){ const g=S.g; if(!g||!g.windBase) return; const b=g.windBase, k=1+0.22*Math.sin(T*0.47+b.ph)+0.08*Math.sin(T*1.31+b.ph*2), a=b.a+0.14*Math.sin(T*0.29+b.ph);
  g.wind.sp=b.sp*k; g.wind.a=a; g.wind.x=Math.cos(a)*g.wind.sp; g.wind.z=Math.sin(a)*g.wind.sp;
  WX.hudT+=dt||0; if(WX.hudT>0.25){ WX.hudT=0; updateGolfHUD(); } }
