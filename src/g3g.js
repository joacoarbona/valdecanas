
/* ================= «Ver hoyos»: the camera flies each hole from behind the tee to the green ================= */
const VW={i:-1,t:0,paused:false,ret:null,C:new V3(),T:new V3(),init:false,labs:[],line:null,next:0};
function holeTees(H){ // distance from each set of tee markers to the green, along the hole line
  if(!H.tees) return []; const P=H.P; const out=[];
  for(const k in H.tees){ const t=H.tees[k]; const L=W.polyLen([[t[0],t[1]]].concat(P.slice(1))); out.push([k,Math.round(L)]); }
  return out.sort((a,b)=>b[1]-a[1]); }
function holeShape(H){ // dogleg side and height difference, for the hole card
  let turn=0; const P=H.P; for(let i=1;i<P.length-1;i++){ const a=Math.atan2(P[i][1]-P[i-1][1],P[i][0]-P[i-1][0]), b=Math.atan2(P[i+1][1]-P[i][1],P[i+1][0]-P[i][0]); let d=b-a; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; turn+=d; }
  const dl=Math.abs(turn)>0.33?(turn>0?'dogleg a la derecha':'dogleg a la izquierda'):'recto'; const dh=Math.round(H.gH-H.tH); return {dl,dh}; }
const TEECOL={blancas:'#ffffff',amarillas:'#f2c230',azules:'#2f6bd6',rojas:'#d6442a',negras:'#16231b'};
function viewCard(){ const H=W.HOLES[VW.i]; if(!H) return; const C=courseOf(H); const sh=holeShape(H);
  $('vCourse').textContent=(W.MULTI?C.name+(C.club?' · '+C.club:''):WP.title)+' · hoyo '+(C.holes.indexOf(H.i)+1)+' de '+C.holes.length;
  $('vTitle').innerHTML='Hoyo '+H.n+'<small>Par '+H.par+' · '+fmt(H.L)+' m'+(H.hcp?' · Hcp '+H.hcp:'')+'</small>';
  const tees=holeTees(H); $('vTees').innerHTML=tees.length>1?tees.map(([k,L])=>'<span><i style="background:'+(TEECOL[k]||'#888')+'"></i>'+k+' '+fmt(L)+' m</span>').join(''):'';
  $('vShape').textContent=(sh.dl==='recto'?'Recto':sh.dl[0].toUpperCase()+sh.dl.slice(1))+' · desnivel tee→green '+(sh.dh>0?'+':'')+sh.dh+' m'+(H.par===3?' · par 3: del tee al green':'');
  $('vInfo').textContent=H.info||''; $('vInfo').hidden=!H.info;
  $('vPause').textContent=VW.paused?'▶ Seguir':'❚❚ Pausa'; }
function clearViewLabels(){ for(const l of VW.labs) l.el.remove(); VW.labs=[]; if(VW.line){ scene.remove(VW.line); VW.line.geometry.dispose(); VW.line=null; } }
function viewLabels(){ clearViewLabels(); const H=W.HOLES[VW.i]; if(!H) return; const box=$('labels');
  const add=(txt,x,z,cls)=>{ const el=document.createElement('div'); el.className='lab vlab '+(cls||''); el.textContent=txt; el.hidden=true; box.appendChild(el); VW.labs.push({el,x,z,y:terrainAt(x,z)+3}); };
  add('Tee · '+fmt(H.L)+' m',H.tx,H.tz,'tee'); add('Green · hoyo '+H.n,H.pin[0],H.pin[1],'green');
  // distance markers: straight line to the centre of the green, like the stakes on a real course
  for(const d of [50,100,150,200,250,300]){ if(d>H.len-25) break; let s=H.len; while(s>0){ const p=W.polyAt(H.P,s); if(Math.hypot(p.x-H.gx,p.z-H.gz)>=d) break; s-=1.5; } const p=W.polyAt(H.P,Math.max(0,s)); add(d+' m',p.x,p.z,'dist'); }
  // a dashed line along the middle of the hole, on the ground
  const pts=[]; for(let s=0;s<=H.len;s+=3){ const p=W.polyAt(H.P,s); pts.push(new V3(p.x,terrainAt(p.x,p.z)+0.5,p.z)); }
  const g=new THREE.BufferGeometry().setFromPoints(pts); VW.line=new THREE.Line(g,new THREE.LineDashedMaterial({color:0xffffff,dashSize:3,gapSize:2.2,transparent:true,opacity:0.85})); VW.line.computeLineDistances(); scene.add(VW.line); }
function viewHole(i,opts){ opts=opts||{}; const H=W.HOLES[i]; if(!H) return;
  closeModal(); hideMap(); if(S.interior) exitVilla(); if(S.tour) stopTour();
  if(S.mode!=='view'){ let m=S.mode; if(['aim','swing','flight','wait'].includes(m)) m='walk'; VW.ret={mode:m}; }
  if(H.course!==S.course) setCourse(H.course);
  VW.i=i; VW.t=0; VW.next=0; VW.paused=!!opts.paused; VW.init=!opts.keepCam; S.mode='view'; orbit.auto=false; orbit.tT=null; refreshHUD(); viewCard(); viewLabels(); }
function viewNav(k){ const C=courseOf(W.HOLES[VW.i]); const hs=C.holes; const j=(hs.indexOf(VW.i)+k+hs.length)%hs.length; fadeTo(()=>viewHole(hs[j],{paused:false})); }
function viewPause(p){ if(!p&&VW.paused){ VW.C.copy(camera.position); VW.T.copy(orbit.t); } VW.paused=p; $('vPause').textContent=p?'▶ Seguir':'❚❚ Pausa'; if(p) tip('Pausa: arrastra para girar la cámara, pellizca o usa la rueda para acercarte',3200); }
function exitView(){ const r=VW.ret||{mode:'menu'}; VW.i=-1; clearViewLabels(); $('tip').hidden=true;
  if(r.mode==='menu'){ goMenu(); return; } if(r.mode==='drone'){ goDrone(); return; } setMode(r.mode); S.snap=true; }
function playFromView(){ const i=VW.i; const from=VW.ret?VW.ret.mode:'menu'; VW.i=-1; clearViewLabels();
  if(from==='menu'){ S.name=$('pname').value.trim(); store.set('vg_name',S.name); mpHello(); }
  if(P.buggy) exitBuggy(); plane.visible=false; glider.visible=false; rig.root.visible=true; P.swim=false; P.onGround=true; S.landedOnce=true; S.snap=true; startHole(i); }
function viewStep(dt){
  const H=W.HOLES[VW.i]; if(!H) return; if(!VW.paused) VW.t+=dt;
  const L=H.len, P_=H.P, t=VW.t; const T0=2.4, T1=clamp(L/42,4.2,11), T2=7.0, T3=2.2;
  const at=s=>{ if(s>=0) return W.polyAt(P_,Math.min(L,s)); const p=W.polyAt(P_,0); return {x:p.x+p.ux*s,z:p.z+p.uz*s,ux:p.ux,uz:p.uz}; };
  const gy=(x,z)=>{ const w=W.waterLevel(x,z); return Math.max(terrainAt(x,z),w>-1e3?w:-1e9); };
  const s0=Math.min(120,L*0.42); const ease=x=>x*x*(3-2*x);
  const cx=new V3(), tx=new V3();
  if(t<T0+T1){ const p=t<T0?0:ease(clamp((t-T0)/T1,0,1)); const sf=s0+(L-s0)*p; const back=(s0+16)+(62-(s0+16))*p, up=9+(40-9)*p;
    const c=at(sf-back), f=at(sf); cx.set(c.x,gy(c.x,c.z)+up,c.z); tx.set(f.x,gy(f.x,f.z)+1.5,f.z); }
  else { const e=at(L-30), g=at(L); const base=Math.atan2(e.z-g.z,e.x-g.x); const u=Math.min(1,(t-T0-T1)/T2); const a=base+2.3*ease(u)+(t>T0+T1+T2?(t-T0-T1-T2)*0.12:0);
    const R=62-14*ease(u), up=40-10*ease(u); const px=H.pin[0]+Math.cos(a)*R, pz=H.pin[1]+Math.sin(a)*R; cx.set(px,Math.max(gy(px,pz),gy(H.pin[0],H.pin[1]))+up,pz); tx.set(H.pin[0],gy(H.pin[0],H.pin[1])+1,H.pin[1]);
    if(!VW.paused&&t>T0+T1+T2+T3&&!VW.next){ VW.next=1; viewNav(1); } }
  if(VW.paused&&!VW.init) return; // the user is looking around: leave the orbit to the pointer
  if(VW.init){ VW.C.copy(cx); VW.T.copy(tx); VW.init=false; } else { const k=1-Math.exp(-dt*3.2); VW.C.lerp(cx,k); VW.T.lerp(tx,k); }
  const d=VW.C.clone().sub(VW.T); const r=Math.max(1,d.length()); orbit.t.copy(VW.T); orbit.r=r; orbit.ph=Math.acos(clamp(d.y/r,-1,1)); orbit.th=Math.atan2(d.z,d.x);
}
function updateViewLabels(){ const on=S.mode==='view'; for(const l of VW.labs){ if(!on){ l.el.hidden=true; continue; } const q=project(l.x,l.y,l.z); if(!q||!q[2]){ l.el.hidden=true; continue; } l.el.hidden=false; l.el.style.transform='translate('+q[0]+'px,'+(q[1]-6)+'px) translate(-50%,-100%)'; } }
$('vPrev').onclick=()=>viewNav(-1); $('vNext').onclick=()=>viewNav(1); $('vPause').onclick=()=>viewPause(!VW.paused); $('vExit').onclick=exitView; $('vPlay').onclick=playFromView;

/* ---- the list of holes (menu tab) and the course picker on the start screen ---- */
function courseChips(){ return W.MULTI?'<div class="row" style="margin:0 0 10px;flex-wrap:wrap;gap:6px">'+W.COURSES.map(c=>'<button class="btn small'+(c.k===S.course?' primary':'')+'" data-course="'+c.k+'">'+c.name+'</button>').join('')+'</div>':''; }
function holesHTML(){ const C=courseOf(); let rows='';
  for(const i of C.holes){ const H=W.HOLES[i]; const sh=holeShape(H); const sc=S.g.scores[i];
    rows+='<div class="hrow"><div class="hn" style="background:'+(W.MULTI?C.color:'#16231b')+'">'+H.n+'</div><div class="hw"><b>Par '+H.par+' · '+fmt(H.L)+' m'+(H.hcp?' · Hcp '+H.hcp:'')+(sc?' · tu resultado: '+sc:'')+'</b><span>'+(sh.dl==='recto'?'Recto':sh.dl[0].toUpperCase()+sh.dl.slice(1))+' · desnivel '+(sh.dh>0?'+':'')+sh.dh+' m'+(H.info?' · '+H.info:'')+'</span></div><div class="ha"><button class="btn small" data-view="'+i+'">Ver</button><button class="btn small primary" data-play="'+i+'">Jugar</button></div></div>'; }
  return courseChips()+(W.MULTI?'<p style="margin:0 0 8px"><b>'+C.name+'</b>'+(C.club?' · '+C.club:'')+' · par '+C.par+' · '+fmt(C.L)+' m</p>':'')+
    '<p class="note" style="margin:0 0 8px"><b>Ver</b> vuela por el hoyo del tee al green, con las distancias al green marcadas; <b>Jugar</b> te pone en su tee. Desnivel: metros que sube (+) o baja (−) el green respecto al tee.</p><div class="hlist">'+rows+'</div>'; }
function holesWire(){ $('sheetBody').querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>viewHole(+b.dataset.view)); $('sheetBody').querySelectorAll('[data-play]').forEach(b=>b.onclick=()=>{ VW.i=+b.dataset.play; VW.ret={mode:S.mode}; closeModal(); playFromView(); }); }
function renderCourseRow(){ const box=$('courseRow'); if(!box||!W.MULTI) return;
  box.innerHTML=W.COURSES.map(c=>'<button class="'+(c.k===S.course?'on':'')+'" data-k="'+c.k+'" style="border-left-color:'+c.color+'"><b>'+c.name+'</b><small>'+(c.club.replace('Real Club de la ','').replace('Club de Campo Villa de Madrid','Club de Campo'))+' · par '+c.par+' · '+fmt(c.L)+' m</small></button>').join('');
  box.querySelectorAll('button').forEach(b=>b.onclick=()=>{ setCourse(+b.dataset.k); renderCourseRow(); const C=W.COURSES[S.course]; const bst=store.get(bestKey(C)); $('bestTxt').textContent=bst?' · Mejor vuelta: '+bst+' golpes':'';
    if(S.mode==='menu'&&C.mid){ orbit.tT=new V3(C.mid[0],terrainAt(C.mid[0],C.mid[1])+20,C.mid[1]); orbit.tR=1500; } }); }
