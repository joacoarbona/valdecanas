
/* ================= shot replay, photo mode and the challenges ================= */
// ---- replay: the last shot is recorded frame by frame and can be watched again with a TV camera
const REP={pts:[],tt:0,t:0,air:0,ready:false,age:0,ret:null,info:'',hole:-1,yaw:0,putt:false,club:'',cur:new V3(),land:null,line:null,lineN:0,px:0,py:0,pz:0,pyaw:0,end:0};
function repStart(){ const g=S.g; REP.pts=[[0,g.ball.x,g.ball.y,g.ball.z]]; REP.tt=0; REP.air=0; REP.ready=false; REP.yaw=g.yaw; REP.club=CLUBS[g.club].n; REP.putt=!!CLUBS[g.club].putt; REP.hole=g.hole; REP.px=P.x; REP.py=P.y; REP.pz=P.z; REP.pyaw=P.yaw; REP.land=null; }
function repRec(dt){ if(!REP.pts.length) return; const g=S.g, s=g.sim; REP.tt+=dt; REP.pts.push([REP.tt,g.ball.x,g.ball.y,g.ball.z]); if(s&&s.mode==='air') REP.air=REP.tt; if(s&&s.land&&!REP.land) REP.land=[s.land.x,s.land.z]; if(REP.pts.length>3000) REP.pts.splice(1,2); }
function repEnd(s){ if(REP.pts.length<3) return; const p0=REP.pts[0], p1=REP.pts[REP.pts.length-1]; const d=Math.hypot(p1[1]-p0[1],p1[3]-p0[3]); const H=W.HOLES[REP.hole];
  REP.ready=true; REP.age=0; REP.info=(H?holeLabel(H)+' · ':'')+REP.club+' · '+(s.done==='holed'?'¡dentro!':s.done==='water'?'al agua':fmt(d)+' m'); }
function repAt(t,out){ const a=REP.pts; let lo=0, hi=a.length-1; if(t<=a[0][0]) return out.set(a[0][1],a[0][2],a[0][3]); if(t>=a[hi][0]) return out.set(a[hi][1],a[hi][2],a[hi][3]);
  while(hi-lo>1){ const m=(lo+hi)>>1; if(a[m][0]<=t) lo=m; else hi=m; } const p=a[lo], q=a[hi], k=(t-p[0])/Math.max(1e-6,q[0]-p[0]); return out.set(p[1]+(q[1]-p[1])*k,p[2]+(q[2]-p[2])*k,p[3]+(q[3]-p[3])*k); }
function repCanStart(){ return REP.ready&&REP.age<120&&(S.mode==='walk'||S.mode==='aim')&&!S.interior; }
function startReplay(){ if(!REP.ready||S.mode==='replay') return; closeModal(); REP.ret={mode:S.mode}; REP.t=0; REP.end=0; S.mode='replay'; S.snap=true;
  if(!REP.line){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(900*3),3)); REP.line=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0.95})); REP.line.frustumCulled=false; scene.add(REP.line); }
  REP.lineN=0; REP.line.geometry.setDrawRange(0,0); REP.line.visible=true; $('repInfo').textContent=REP.info; refreshHUD(); repStep(0); }
function exitReplay(){ if(S.mode!=='replay') return; if(REP.line) REP.line.visible=false; ballMesh.scale.setScalar(1); const r=REP.ret||{mode:'walk'}; S.mode=r.mode==='aim'?'aim':'walk'; refreshHUD(); if(S.mode==='aim'){ placeAtAddress(); snapAimCamera(); } S.snap=true; }
function repStep(dt){ const dur=REP.tt; const rate=REP.t<0.45&&!REP.putt?0.45:(REP.t>REP.air&&!REP.putt?1.7:1); REP.t=Math.min(dur,REP.t+dt*rate);
  const b=repAt(REP.t,REP.cur), p0=REP.pts[0]; const dx=Math.cos(REP.yaw), dz=Math.sin(REP.yaw), sx=-dz, sz=dx; const air=Math.max(0.01,REP.air), u=REP.t/air;
  if(REP.putt){ camT.pos.set(b.x-dx*4.2,b.y+1.25,b.z-dz*4.2); camT.look.set(b.x+dx*2,b.y,b.z+dz*2); }
  else if(u<0.32){ camT.pos.set(p0[1]-dx*8,p0[2]+2.4,p0[3]-dz*8); camT.look.set(b.x,b.y+0.5,b.z); }
  else if(u<0.78){ const gh=Math.max(0,b.y-W.terrain(b.x,b.z)); camT.pos.set(b.x+sx*(20+gh*0.3)-dx*14,b.y+3+gh*0.12,b.z+sz*(20+gh*0.3)-dz*14); camT.look.set(b.x+dx*6,b.y,b.z+dz*6); }
  else { const L=REP.land||[b.x,b.z]; camT.pos.set(L[0]+dx*20+sx*9,W.terrain(L[0]+dx*20+sx*9,L[1]+dz*20+sz*9)+5,L[1]+dz*20+sz*9); camT.look.set(b.x,b.y,b.z); }
  { const g=W.terrain(camT.pos.x,camT.pos.z); if(camT.pos.y<g+1.2) camT.pos.y=g+1.2; }
  if(REP.line&&REP.lineN<900){ const a=REP.line.geometry.attributes.position.array; const last=REP.lineN?[a[REP.lineN*3-3],a[REP.lineN*3-2],a[REP.lineN*3-1]]:null;
    if(!last||Math.hypot(b.x-last[0],b.y+0.15-last[1],b.z-last[2])>0.6){ a[REP.lineN*3]=b.x; a[REP.lineN*3+1]=b.y+0.15; a[REP.lineN*3+2]=b.z; REP.lineN++; REP.line.geometry.setDrawRange(0,REP.lineN); REP.line.geometry.attributes.position.needsUpdate=true; } }
  if(REP.t>=dur){ REP.end+=dt; if(REP.end>1.6) exitReplay(); } }
// after the rig update: the player stays at the address of the replayed shot
function repPost(T){ if(S.mode!=='replay') return; ballMesh.visible=true; ballMesh.position.set(REP.cur.x,REP.cur.y+0.2,REP.cur.z); ballMesh.scale.setScalar(clamp(camera.position.distanceTo(ballMesh.position)/20,1,4));
  if(rig){ const R=rig; R.root.visible=true; R.root.position.set(REP.px,REP.py,REP.pz); R.root.rotation.set(0,-REP.pyaw,0); poseRig(R,'follow',T,Math.min(1,REP.t/0.35)); } }
function repUI(dt){ REP.age+=dt; const b=$('repBtn'); const show=repCanStart(); if(b.hidden===show) b.hidden=!show; }

// ---- photo mode: the camera turns freely around you, without the game panels; the photo is saved as a JPG
const PH={ret:null,me:true,url:null,blob:null};
function startPhoto(){ if(['loading','plane','fall','glide','flight','swing','wait','replay','photo','racket','view'].includes(S.mode)) { tip('El modo foto se abre andando, apuntando, en buggy, a caballo o desde la vista dron',3000); return; }
  closeModal(); hideMap(); PH.ret={mode:S.mode,th:orbit.th,ph:orbit.ph,r:orbit.r,t:orbit.t.clone(),auto:orbit.auto};
  if(S.mode!=='menu'&&S.mode!=='drone'){ const c=camera.position; orbit.t.set(P.x,P.y+1.1,P.z); const d=c.clone().sub(orbit.t); orbit.r=clamp(d.length(),3,40); orbit.th=Math.atan2(d.z,d.x); orbit.ph=Math.acos(clamp(d.y/Math.max(0.01,d.length()),-1,1)); }
  orbit.auto=false; orbit.tT=null; const off=PH.ret.mode==='menu'||PH.ret.mode==='drone'; S.mode='photo'; PH.me=!off; refreshHUD(); $('phMe').hidden=off; $('phMe').textContent='Personaje: sí';
  $('phTod').textContent='Hora'; $('phWx').textContent='Tiempo: '+WX.mode; tip('Arrastra para girar · pellizca o usa la rueda para acercarte',3000); }
function exitPhoto(){ if(S.mode!=='photo') return; const r=PH.ret||{mode:'walk'}; $('photoOv').hidden=true; S.overlay=false;
  if(r.mode==='menu'||r.mode==='drone'){ Object.assign(orbit,{th:r.th,ph:r.ph,r:r.r,auto:r.auto}); orbit.t.copy(r.t); if(r.mode==='menu') goMenu(); else { S.mode='drone'; refreshHUD(); } return; }
  S.mode=r.mode; if(rig) rig.root.visible=true; refreshHUD(); if(S.mode==='aim'){ placeAtAddress(); snapAimCamera(); } S.snap=true; }
function slug(s){ return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function takePhoto(){ let url; try{ ppRender(1/60); url=canvas.toDataURL('image/jpeg',0.93); }catch(e){ toast('No se pudo hacer la foto',''); return; }
  const f=$('flash'); f.style.transition='none'; f.style.opacity=0.85; requestAnimationFrame(()=>{ f.style.transition='opacity .45s'; f.style.opacity=0; }); blip('hit');
  const im=new Image(); im.onload=()=>{ const c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d'); x.drawImage(im,0,0); const s=Math.max(1,c.width/1100);
    const txt=WP.title+' · joaco.org'; x.font='800 '+Math.round(15*s)+'px Figtree, system-ui, sans-serif'; x.textAlign='right'; x.textBaseline='bottom'; x.fillStyle='rgba(0,0,0,.4)'; x.fillText(txt,c.width-13*s,c.height-11*s); x.fillStyle='#fff'; x.fillText(txt,c.width-14*s,c.height-12*s);
    c.toBlob(b=>{ if(!b) return; if(PH.url) URL.revokeObjectURL(PH.url); PH.blob=b; PH.url=URL.createObjectURL(b); $('photoImg').src=PH.url; $('photoOv').hidden=false; S.overlay=true;
      $('phShare').hidden=!(navigator.canShare&&navigator.canShare({files:[new File([b],'foto.jpg',{type:'image/jpeg'})]}));
      if(window.claude) dlNS().then(dl=>{ $('phSave').hidden=!dl; }); },'image/jpeg',0.92); };
  im.src=url; }
function photoName(){ const d=new Date(), p=n=>String(n).padStart(2,'0'); return slug(WP.title)+'-'+d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds())+'.jpg'; }
// inside the claude.ai viewer files are offered through its downloads capability; elsewhere (joaco.org) with a plain link
let DLNS; function dlNS(){ if(DLNS===undefined) DLNS=(window.claude&&typeof window.claude.use==='function')?Promise.resolve(window.claude.use('downloads')).catch(()=>null):Promise.resolve(null); return DLNS; }
async function photoSave(){ if(!PH.blob) return; const dl=await dlNS();
  if(dl){ try{ await dl.save({filename:photoName(),data:PH.blob}); }catch(e){ if(!e||e.code!=='declined') toast('No se pudo guardar la foto','Mantén el dedo o haz clic derecho sobre ella para guardarla'); } return; }
  const a=document.createElement('a'); a.href=PH.url; a.download=photoName(); document.body.appendChild(a); a.click(); setTimeout(()=>a.remove(),1000); }
async function photoShare(){ if(!PH.blob) return; try{ await navigator.share({files:[new File([PH.blob],photoName(),{type:'image/jpeg'})],title:WP.title}); }catch(e){} }
// the player keeps the pose of what he was doing (in the buggy, on the horse, at the address)
function phPost(T){ if(S.mode!=='photo'||!rig) return; const R=rig, r=PH.ret&&PH.ret.mode; R.root.visible=PH.me; if(!PH.me) return;
  if(r==='drive'&&P.buggy){ poseRig(R,'drive',T,0); const sp=seatPos(P.buggy); R.root.position.set(sp[0],sp[1],sp[2]); }
  else if(r==='ride'&&P.horse){ riderPose(R,P.horse); const sp=horseSeat(P.horse); R.root.position.set(sp[0],sp[1],sp[2]); }
  else if(r==='aim'){ poseRig(R,'address',T,0); } }
function photoMe(){ PH.me=!PH.me; if(rig) rig.root.visible=PH.me; $('phMe').textContent='Personaje: '+(PH.me?'sí':'no'); }

// ---- challenges: longest drive, closest to the pin and longest holed putt, per course, with the date and who did it
const CH={rec:{}};
const CHK={drive:{n:'Drive más largo',best:'max',rule:'Primer golpe con driver en un par 4 o 5. Cuenta la distancia del tee a donde se para la bola, si queda en calle, antegreen o green.'},
  pin:{n:'Más cerca de bandera',best:'min',rule:'Primer golpe en un par 3. Cuenta si la bola se para en el green; un hoyo en uno son 0 m.'},
  putt:{n:'Putt más largo embocado',best:'max',rule:'El putt más largo que entra, desde 3 m.'}};
function chLoad(){ try{ CH.rec=JSON.parse(store.get(WP.key+'_retos')||'{}')||{}; }catch(e){ CH.rec={}; } }
function chSave(){ store.set(WP.key+'_retos',JSON.stringify(CH.rec)); }
function chRecord(k,v,H){ const C=courseOf(H), id=k+'|'+C.id, cur=CH.rec[id]; if(cur&&(CHK[k].best==='max'?v<=cur.v:v>=cur.v)) return false;
  CH.rec[id]={v,h:H.n,d:Date.now(),who:(S.name||'').trim()||'Tú',prev:cur?cur.v:null}; chSave(); return true; }
function chText(k,v){ return k==='pin'&&v===0?'¡hoyo en uno!':fmt(v,k==='drive'?0:1)+' m'; }
function chNotify(k,v,H){ const C=courseOf(H); setTimeout(()=>{ toast('¡Récord! '+CHK[k].n,chText(k,v)+' · '+(W.MULTI?C.short+' · ':'')+'hoyo '+H.n); blip('gold'); },1700);
  if(MP.code) mpSay('🏆 Récord de '+CHK[k].n.toLowerCase()+': '+chText(k,v)+' en el '+H.n+(W.MULTI?' del '+C.short:'')); }
function chCheck(s){ const g=S.g, H=hole(); if(!H||!s) return; const cl=CLUBS[g.club]; const d0=Math.hypot(s.x-g.flightStart.x,s.z-g.flightStart.z);
  if(s.done==='holed'&&cl.putt){ const L=Math.round(d0*10)/10; if(L>=3&&chRecord('putt',L,H)) chNotify('putt',L,H); }
  if(g.cur===1&&H.par===3&&!cl.putt){ if(s.done==='holed'){ if(chRecord('pin',0,H)) chNotify('pin',0,H); }
    else if(s.done==='stop'&&W.surfAt(s.x,s.z)===5){ const dp=Math.round(Math.hypot(s.x-H.pin[0],s.z-H.pin[1])*10)/10; if(chRecord('pin',dp,H)) chNotify('pin',dp,H); } }
  if(g.cur===1&&H.par>=4&&g.club===0&&s.done==='stop'){ const lie=W.surfAt(s.x,s.z); if(lie===3||lie===4||lie===5){ const L=Math.round(d0); if(chRecord('drive',L,H)) chNotify('drive',L,H); } } }
function chHTML(){ const C=courseOf(); const fd=t=>new Date(t).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
  let rows=''; for(const k in CHK){ const r=CH.rec[k+'|'+C.id]; rows+='<tr><td><b>'+CHK[k].n+'</b></td><td class="num">'+(r?chText(k,r.v):'—')+'</td><td>'+(r?'Hoyo '+r.h:'')+'</td><td>'+(r?r.who:'')+'</td><td>'+(r?fd(r.d):'')+'</td></tr>'; }
  return courseChips()+'<p>Tres récords que se guardan solos mientras juegas'+(W.MULTI?', uno por recorrido (aquí, <b>'+C.name+'</b>)':'')+'. Cuando superas uno sale un aviso'+(MP.code?' y se cuenta en el chat de la sala':'')+'.</p>'+
    '<div class="tablewrap"><table class="card"><thead><tr><th>Reto</th><th>Récord</th><th>Dónde</th><th>Quién</th><th>Fecha</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
    '<h3>Reglas</h3><ul>'+Object.values(CHK).map(c=>'<li><b>'+c.n+':</b> '+c.rule+'</li>').join('')+'</ul>'+
    (PIER.plat?'<h3>Pesca</h3><p>'+(FISH.rec?'Pez más grande: <b>'+FISH.rec.n+' de '+fmt(FISH.rec.kg,FISH.rec.kg<10?1:0)+' kg</b> · '+FISH.rec.who+' · '+fd(FISH.rec.d):'Aún no hay récord de pesca: ve al final del muelle y pulsa <b>Pescar</b>.')+'</p>':'')+
    '<p class="note">Los récords se guardan en este navegador, con el nombre que pones en el inicio. Las distancias son en línea recta sobre el plano.</p><div class="row"><button class="btn small" id="chReset">Borrar récords</button></div>'; }
function chWire(){ const b=$('chReset'); if(b) b.onclick=()=>{ if(b.dataset.ok){ CH.rec={}; chSave(); openModal('retos'); } else { b.dataset.ok='1'; b.textContent='Pulsa otra vez para borrarlos'; } }; }
chLoad();
