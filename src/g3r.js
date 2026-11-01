
/* ================= real rounds of the live scorecard (tarjeta/), replayed in 3D hole by hole like a video ================= */
const RR={r:null,pid:'',holes:[],k:0,seq:[],si:0,t:0,ph:'',paused:false,speed:1,line:null,lineN:0,ball:null,labs:[],ret:null,par:0};
const RR_CLUB={Dr:'Driver',M3:'Madera 3',M5:'Madera 5',H:'Híbrido','4':'Hierro 4','5':'Hierro 5','6':'Hierro 6','7':'Hierro 7','8':'Hierro 8','9':'Hierro 9',PW:'Pitching',GW:'Gap wedge',SW:'Sand wedge',LW:'Lob wedge'};
function cardURL(){ return (VGC.data&&/data\/$/.test(VGC.data)?VGC.data.replace(/data\/$/,''):'')+'tarjeta/'; }
function rrAll(){ try{ return JSON.parse(store.get(WP.key+'_rondas')||'{}')||{}; }catch(e){ return {}; } }
function rrRecv(ch,si){ si=si||18; const base=Math.floor(ch/18), rem=ch-base*18; return base+(si<=rem?1:0); }
function rrCh(p,r){ if(p.ov!==''&&p.ov!==null&&p.ov!==undefined&&Number.isFinite(+p.ov)) return Math.round(+p.ov); const tv=(r.tv||{})[p.tee]||{}; let ch=+p.hi||0; const C=W.COURSES[r.c]; if(+tv.slope>0) ch=ch*(+tv.slope)/113+((+tv.cr||C.par)-C.par); return Math.round(ch*(r.alloc||100)/100); }
// per hole: the flights from each GPS shot to the next (the last one to the ball on the green or the flag) and the putts
function rrPrep(r,pid){ const C=W.COURSES[r.c]; const pi=r.p.findIndex(p=>p.id===pid); const P=r.p[pi]; const ch=rrCh(P,r);
  return C.holes.map((gi,k)=>{ const H=W.HOLES[gi]; const sc=((r.sc||{})[pid]||{})[k]||null; const sh=((r.sh||{})[pid]||{})[k]||null; const seg=[];
    if(sh&&sh.s&&sh.s.length){ const pts=sh.s.map(s=>[s[0],s[1]]); const end=sh.gb||[H.pin[0]+(Math.random()-0.5)*4,H.pin[1]+(Math.random()-0.5)*4]; pts.push(end);
      for(let i=0;i<sh.s.length;i++){ const A=pts[i], B=pts[i+1]; seg.push({k:'shot',A,B,club:sh.s[i][3]||'',d:Math.hypot(B[0]-A[0],B[1]-A[1]),n:i+1}); }
      const np=sc&&sc.p!==undefined&&sc.p!==''?+sc.p:0; let cur=end; for(let j=0;j<np;j++){ const last=j===np-1; const dx=H.pin[0]-cur[0], dz=H.pin[1]-cur[1], d=Math.hypot(dx,dz); const B=last?[H.pin[0],H.pin[1]]:[H.pin[0]-dx/Math.max(d,0.01)*Math.min(d*0.12+0.4,2.2),H.pin[1]-dz/Math.max(d,0.01)*Math.min(d*0.12+0.4,2.2)];
        seg.push({k:'putt',A:cur,B,d,n:sh.s.length+j+1,last}); cur=B; } }
    const rc=rrRecv(ch,H.hcp); return {H,k,sc,seg,rc,pts:sc&&sc.g?Math.max(0,2+H.par+rc-sc.g):0}; }); }
function rrWord(g,par){ const d=g-par; return g===1?'¡Hoyo en uno!':d<=-3?'Albatros':d===-2?'Eagle':d===-1?'Birdie':d===0?'Par':d===1?'Bogey':d===2?'Doble bogey':'+'+d; }
function rrStart(r,pid){ if(!r||!r.p) return; closeModal(); hideMap(); if(S.interior) exitVilla(); const C=W.COURSES[r.c]; if(!C){ toast('Esa partida es de otro campo',''); return; }
  pid=r.p.some(p=>p.id===pid)?pid:(r.p.find(p=>Object.keys(((r.sh||{})[p.id])||{}).length)||r.p[0]).id;
  if(S.mode!=='rround') RR.ret={mode:['aim','swing','flight','wait','view','replay','photo','racket','jet','fish'].includes(S.mode)?(S.mode==='menu'?'menu':'walk'):S.mode};
  RR.r=r; RR.pid=pid; RR.holes=rrPrep(r,pid); RR.speed=1; RR.paused=false; setCourse(r.c);
  if(!RR.ball){ RR.ball=new THREE.Mesh(new THREE.SphereGeometry(0.22,16,12),new THREE.MeshLambertMaterial({color:0xffffff,emissive:Cc('#4a4a4a')})); RR.ball.castShadow=true; scene.add(RR.ball);
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(3000*3),3)); RR.line=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xffd23f})); RR.line.frustumCulled=false; scene.add(RR.line); }
  S.mode='rround'; if(rig) rig.root.visible=false; refreshHUD(); rrHole(Math.max(0,RR.holes.findIndex(h=>h.seg.length||(h.sc&&h.sc.g)))); }
function rrClearLabs(){ for(const l of RR.labs) l.el.remove(); RR.labs=[]; }
function rrLab(txt,x,z,cls){ const el=document.createElement('div'); el.className='lab vlab '+(cls||''); el.textContent=txt; el.hidden=true; $('labels').appendChild(el); RR.labs.push({el,x,z,y:W.terrain(x,z)+2.6}); }
function rrHole(k){ const h=RR.holes[k]; if(!h) return rrEnd(); RR.k=k; RR.si=0; RR.t=0; RR.ph='intro'; rrClearLabs(); RR.lineN=0; RR.line.geometry.setDrawRange(0,0);
  const H=h.H, tp=h.seg.length?h.seg[0].A:[H.tx,H.tz]; RR.ball.position.set(tp[0],W.terrain(tp[0],tp[1])+0.22,tp[1]); RR.ball.visible=true; rrLab('Hoyo '+H.n,H.pin[0],H.pin[1],'green');
  for(const s of h.seg) if(s.k==='shot') rrLab(s.n+' · '+(RR_CLUB[s.club]||'golpe')+' · '+Math.round(s.d)+' m',s.B[0],s.B[1],'dist'); for(const l of RR.labs) l.on=l.el.className.includes('green');
  rrCard(); S.snap=true; }
function rrCard(){ const r=RR.r, h=RR.holes[RR.k], C=W.COURSES[r.c], P=r.p.find(p=>p.id===RR.pid); if(!h) return; const H=h.H, sc=h.sc;
  $('rrTitle').innerHTML='Hoyo '+H.n+'<small>Par '+H.par+(H.hcp?' · Hcp '+H.hcp:'')+'</small>';
  $('rrSub').textContent=P.n+' · '+C.name+' · '+new Date(r.created).toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'});
  const shots=h.seg.filter(s=>s.k==='shot'); $('rrInfo').innerHTML=sc&&sc.g?'<b>'+sc.g+' golpes · '+rrWord(sc.g,H.par)+'</b>'+(sc.p!==undefined&&sc.p!==''?' · '+sc.p+(+sc.p===1?' putt':' putts'):'')+(r.f==='stb'||r.f==='fb'?' · '+h.pts+' pts':'')+(shots.length?'':'<br><span>Sin golpes GPS en este hoyo</span>'):'Sin apuntar';
  let tg=0, tp=0, n=0, pts=0; for(let i=0;i<=RR.k;i++){ const q=RR.holes[i]; if(q.sc&&q.sc.g){ tg+=q.sc.g; tp+=q.H.par; pts+=q.pts; n++; } }
  $('rrTot').textContent=n?'Tras '+n+(n===1?' hoyo':' hoyos')+': '+tg+' golpes ('+(tg-tp===0?'par':(tg-tp>0?'+':'')+(tg-tp))+')'+(r.f==='stb'||r.f==='fb'?' · '+pts+' pts':''):'';
  $('rrPause').textContent=RR.paused?'▶':'❚❚'; $('rrSpeed').textContent=RR.speed+'×';
  $('rrWho').innerHTML=r.p.length>1?r.p.map(p=>'<button class="'+(p.id===RR.pid?'on':'')+'" data-rp="'+p.id+'">'+esc(p.n)+'</button>').join(''):''; $('rrWho').querySelectorAll('[data-rp]').forEach(b=>b.onclick=()=>{ const k=RR.k; rrStart(RR.r,b.dataset.rp); rrHole(k); }); }
function rrEnd(){ RR.ph='end'; const r=RR.r, P=r.p.find(p=>p.id===RR.pid); let tg=0,tp=0,pts=0,n=0; for(const q of RR.holes) if(q.sc&&q.sc.g){ tg+=q.sc.g; tp+=q.H.par; pts+=q.pts; n++; }
  $('rrTitle').innerHTML='Fin de la vuelta<small>'+esc(P.n)+'</small>'; $('rrInfo').innerHTML='<b>'+tg+' golpes en '+n+' hoyos ('+(tg-tp===0?'par':(tg-tp>0?'+':'')+(tg-tp))+')</b>'+(r.f==='stb'||r.f==='fb'?' · '+pts+' puntos':''); $('rrTot').textContent='Pulsa ▶ para verla otra vez'; RR.paused=true; $('rrPause').textContent='▶'; }
function rrExit(){ if(S.mode!=='rround') return; rrClearLabs(); if(RR.ball) RR.ball.visible=false; if(RR.line) RR.line.visible=false; const m=RR.ret?RR.ret.mode:'menu'; if(m==='menu'){ goMenu(); return; } if(m==='drone'){ goDrone(); return; } if(rig) rig.root.visible=true; setMode(m); S.snap=true; }
function rrPush(x,y,z){ const g=RR.line.geometry, a=g.attributes.position.array; if(RR.lineN>=3000) return; a[RR.lineN*3]=x; a[RR.lineN*3+1]=y; a[RR.lineN*3+2]=z; RR.lineN++; g.setDrawRange(0,RR.lineN); g.attributes.position.needsUpdate=true; RR.line.visible=true; }
function rrStep(dt){ const h=RR.holes[RR.k]; if(!h||RR.ph==='end'){ rrCam(dt); return; } if(RR.paused){ rrCam(dt); return; } dt*=RR.speed; RR.t+=dt; const H=h.H;
  if(RR.ph==='intro'){ if(RR.t>2.2){ RR.ph=h.seg.length?'seg':'outro'; RR.t=0; } }
  else if(RR.ph==='seg'){ const s=h.seg[RR.si]; const T=s.k==='putt'?Math.max(0.9,Math.min(2.2,s.d/4)):Math.max(1.3,Math.min(4.2,s.d/38)); const u=Math.min(1,RR.t/T);
    const x=s.A[0]+(s.B[0]-s.A[0])*u, z=s.A[1]+(s.B[1]-s.A[1])*u; let y=W.terrain(x,z)+0.22; if(s.k==='shot'){ const hh=s.d<30?s.d*0.08:Math.min(38,s.d*0.14); const ka=u<1?(1-Math.pow(1-u,1.15)):1; y+=4*hh*ka*(1-ka); }
    RR.ball.position.set(x,y,z); if(s.k==='shot'&&(RR.lineN===0||Math.random()<0.6)) rrPush(x,y,z);
    if(u>=1){ if(s.k==='shot'){ const l=RR.labs.find(q=>q.el.textContent.startsWith(s.n+' · ')); if(l) l.on=true; blip('hit'); } else if(s.last) blip('cup'); RR.si++; RR.t=0; if(RR.si>=h.seg.length){ RR.ph='outro'; if(s.k==='putt'&&s.last) RR.ball.visible=false; } } }
  else if(RR.ph==='outro'){ if(RR.t>2.4){ if(RR.k<RR.holes.length-1) rrHole(RR.k+1); else rrEnd(); return; } }
  rrCam(dt); }
// television camera: behind the tee for the intro, following the flight from behind and above, low behind the ball on the green
function rrCam(dt){ const h=RR.holes[RR.k]; if(!h) return; const H=h.H; let pos, look;
  const b=RR.ball.position; const s=h.seg[Math.min(RR.si,h.seg.length-1)];
  if(RR.ph==='intro'||!s){ const A=h.seg.length?h.seg[0].A:[H.tx,H.tz]; const dx=H.pin[0]-A[0], dz=H.pin[1]-A[1], L=Math.hypot(dx,dz)||1; const ux=dx/L, uz=dz/L;
    pos=new V3(A[0]-ux*30,W.terrain(A[0],A[1])+18,A[1]-uz*30); look=new V3(A[0]+ux*Math.min(160,L*0.55),W.terrain(A[0],A[1]),A[1]+uz*Math.min(160,L*0.55)); }
  else if(RR.ph==='outro'||s.k==='putt'){ const A=s.A, dx=H.pin[0]-A[0], dz=H.pin[1]-A[1], L=Math.hypot(dx,dz)||1; const ux=dx/L, uz=dz/L; const by=W.terrain(b.x,b.z);
    pos=new V3(b.x-ux*6.5,by+2.6,b.z-uz*6.5); look=new V3(H.pin[0],W.terrain(H.pin[0],H.pin[1]),H.pin[1]); }
  else { const dx=s.B[0]-s.A[0], dz=s.B[1]-s.A[1], L=Math.hypot(dx,dz)||1; const ux=dx/L, uz=dz/L; const gy=W.terrain(b.x,b.z);
    pos=new V3(b.x-ux*18-uz*5,Math.max(b.y,gy)+7,b.z-uz*18+ux*5); look=new V3(b.x+ux*14,b.y,b.z+uz*14); }
  const g=W.terrain(pos.x,pos.z); if(pos.y<g+1.5) pos.y=g+1.5; camT.pos.copy(pos); camT.look.copy(look); }
function rrLabels(){ const on=S.mode==='rround'; for(const l of RR.labs){ if(!on||!l.on){ l.el.hidden=true; continue; } const q=project(l.x,l.y,l.z); if(!q||!q[2]){ l.el.hidden=true; continue; } l.el.hidden=false; l.el.style.transform='translate('+q[0]+'px,'+(q[1]-6)+'px) translate(-50%,-100%)'; } }
function rrFromURL(){ const q=new URLSearchParams(location.search), id=q.get('ronda'); if(!id) return; const r=rrAll()[id]; if(!r){ toast('No encuentro esa partida en este móvil',''); return; } rrStart(r,q.get('jugador')||''); }
// the tab: the real rounds saved on this phone
function rondasHTML(){ const L=Object.values(rrAll()).filter(r=>!r.solo&&W.COURSES[r.c]).sort((a,b)=>(b.created||0)-(a.created||0)); const live=!VGC.b64;
  return '<p>Las partidas de verdad que apuntas con la <b>tarjeta en directo</b> (resultados, hándicap y golpes con GPS) se pueden ver aquí en 3D, hoyo a hoyo: la bola vuela de cada golpe al siguiente con su palo y su distancia, y termina con los putts.</p>'+
   (live?'<div class="row" style="margin:0 0 12px"><a class="btn primary" href="'+cardURL()+'">Abrir la tarjeta en directo</a></div>':'<p class="note">La tarjeta en directo está en joaco.org (necesita el GPS del móvil).</p>')+
   (L.length?'<div class="hlist">'+L.map(r=>'<div class="hrow"><div class="hn" style="background:'+(W.COURSES[r.c].color||'#255d3c')+'">'+new Date(r.created).getDate()+'</div><div class="hw"><b>'+esc(W.COURSES[r.c].name)+' · '+new Date(r.created).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'})+'</b><span>'+r.p.map(p=>esc(p.n)+(Object.keys(((r.sh||{})[p.id])||{}).length?' (GPS)':'')).join(', ')+(r.done?'':' · en juego')+'</span></div><div class="ha"><button class="btn small primary" data-rr="'+esc(r.id)+'">Ver en 3D</button></div></div>').join('')+'</div>':'<p class="note">Todavía no hay partidas guardadas en este móvil.</p>'); }
function rondasWire(){ $('sheetBody').querySelectorAll('[data-rr]').forEach(b=>b.onclick=()=>{ const r=rrAll()[b.dataset.rr]; if(r){ RR.ret={mode:S.mode==='menu'?'menu':'walk'}; rrStart(r,''); } }); }
$('rrPrev').onclick=()=>rrHole(Math.max(0,RR.k-1)); $('rrNext').onclick=()=>{ if(RR.k<RR.holes.length-1) rrHole(RR.k+1); else rrEnd(); };
$('rrPause').onclick=()=>{ if(RR.ph==='end'){ RR.paused=false; rrHole(0); return; } RR.paused=!RR.paused; rrCard(); }; $('rrSpeed').onclick=()=>{ RR.speed=RR.speed===1?2:RR.speed===2?4:1; rrCard(); }; $('rrExit').onclick=rrExit;
