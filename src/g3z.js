
/* ================= «Partida con la sala»: a handicap round of golf among the friends in the room, everyone from tee 1, live standings on screen; no bots =================
   One player proposes it (format, course and tees) and the others accept with their own handicap. Each player sends their entry, «rmp»: the match header
   plus their handicap and their strokes on every hole of the course (in course order), on joining, after each hole, when someone arrives and every 25 s.
   The standings are worked out by each browser from those entries, so a lost message is mended by the next one. Players are known by a stable id
   (vg_uid), so after reloading the page you come back into the same match. Live hole and stroke come from the room's position messages (p.cur). */
var RM={on:false,room:'',mid:'',host:'',hn:'',fmt:'stableford',course:0,tee:'',t0:0,pl:new Map(),offer:null,asked:new Set(),final:false,closed:false,
  hc:18,uid:'',open:true,sig:'',lead:'',acc:0,beat:0,toastT:0,fsel:'stableford',won:false};
const RMF={stableford:'Stableford',medal:'Medal neto',match:'Match play'};
const RM_TXT={stableford:'Stableford: cada hoyo da puntos según tu resultado neto (golpes menos los que te da tu hándicap en ese hoyo): 2 por el par neto, 3 por birdie neto, 4 por eagle neto, 1 por bogey neto y 0 si haces más. Gana quien más puntos suma.',
  medal:'Medal neto: cuentan todos los golpes de la vuelta menos tu hándicap. La clasificación va en neto respecto al par de los hoyos jugados (−2 es dos bajo par neto). Gana quien menos tiene.',
  match:'Match play: hoyo a hoyo. Con dos jugadores es el duelo de siempre; con más, todos contra todos (liguilla): cada pareja juega su match y suma 1 punto por match ganado y medio por empate. En cada match, el de más hándicap recibe la diferencia en los hoyos más difíciles.'};
(function rmInit(){ let u=store.get('vg_uid'); if(!u||!/^[0-9a-f]{8,32}$/.test(u)){ try{ u=mpRandId(); }catch(e){ u=Math.random().toString(16).slice(2,14).padEnd(12,'0'); } store.set('vg_uid',u); } RM.uid=u;
  const h=+(store.get('vg_hcp')||''); RM.hc=Number.isFinite(h)&&store.get('vg_hcp')!==null?clamp(Math.round(h),0,54):clamp(Math.round(BOT.my||18),0,54);
  RM.open=store.get('vg_rmopen')!=='0'; const f=store.get(WP.key+'_rmf'); if(RMF[f]) RM.fsel=f; })();
// the match you were playing before reloading the page (called from boot, once the courses exist)
function rmLoad(){ try{ const o=JSON.parse(store.get(WP.key+'_rm')||'null'); if(o&&o.on&&RMF[o.fmt]&&W.COURSES[o.course]&&Date.now()-(+o.t0||0)<18*3600e3){
      Object.assign(RM,{on:true,room:String(o.room||''),mid:String(o.mid),host:String(o.host||''),hn:String(o.hn||''),fmt:o.fmt,course:o.course|0,tee:String(o.tee||''),t0:+o.t0,final:!!o.final,closed:!!o.closed,won:!!o.won});
      for(const e of (o.pl||[])) if(e&&typeof e.u==='string'&&Array.isArray(e.sc)) RM.pl.set(e.u,{u:e.u,n:String(e.n||'Jugador').slice(0,16),col:rmCol(e.col),hc:clamp(e.hc|0,0,54),sc:e.sc.map(v=>clamp(v|0,0,15)),left:!!e.left,id:'',seen:0}); } }catch(e){} }
function rmCol(c){ return typeof c==='string'&&/^#[0-9a-f]{3,8}$/i.test(c)?c:'#7d8a80'; }
function rmSave(){ store.set(WP.key+'_rm',JSON.stringify(RM.on?{on:true,room:RM.room,mid:RM.mid,host:RM.host,hn:RM.hn,fmt:RM.fmt,course:RM.course,tee:RM.tee,t0:RM.t0,final:RM.final,closed:RM.closed,won:RM.won,
  pl:[...RM.pl.values()].map(e=>({u:e.u,n:e.n,col:e.col,hc:e.hc,sc:e.sc,left:e.left}))}:null)); }
function rmC(){ return W.COURSES[RM.course]||W.COURSES[0]; }
function rmMySc(){ return rmC().holes.map(i=>S.g.scores[i]||0); }
function rmMe(){ return {u:RM.uid,n:mpName(),col:curSkin().shirt,hc:RM.hc,sc:rmMySc(),me:true,id:MP.id}; }
function rmPlayers(all){ const L=[rmMe()]; for(const e of RM.pl.values()) if(all||!e.left) L.push(e); return L; }
function rmPeer(e){ if(e.me) return null; if(e.id){ const p=MP.peers.get(e.id); if(p&&p.rmu===e.u) return p; } for(const p of MP.peers.values()) if(p.rmu===e.u){ e.id=p.id; return p; } return null; }
function rmHoles(e){ let n=0; for(const v of e.sc) if(v) n++; return n; }
function rmDone(e){ return rmHoles(e)===rmC().holes.length; }

/* ---- scoring ---- */
function rmStats(e){ const C=rmC(); let g=0,n=0,pts=0,par=0,holes=0; C.holes.forEach((i,q)=>{ const s=e.sc[q]; if(!s) return; const H=W.HOLES[i], r=recv(e.hc,H,C); g+=s; n+=s-r; pts+=stbl(s,H.par,r); par+=H.par; holes++; }); return {g,n,pts,par,holes,tp:n-par}; }
// one match between a and b, seen from a: the higher handicap receives the difference on the hardest holes; it stops when it is decided
function rmDuel(a,b){ const C=rmC(), N=C.holes.length, d=Math.abs(a.hc-b.hc), aGets=a.hc>b.hc; let up=0,played=0,done=null;
  for(let q=0;q<N;q++){ const x=a.sc[q], y=b.sc[q]; if(!x||!y) continue; const H=W.HOLES[C.holes[q]], r=recv(d,H,C); const na=x-(aGets?r:0), nb=y-(aGets?0:r);
    if(na<nb) up++; else if(nb<na) up--; played++; if(Math.abs(up)>N-played){ done={up,left:N-played}; break; } }
  if(!done&&played===N) done={up,left:0}; return {up,played,left:N-played,done}; }
function rmDuelTxt(m,me){ const a=Math.abs(m.up);
  if(m.done){ if(!m.up) return 'empate'; const s=m.done.left?a+' y '+m.done.left:a+' arriba'; return (m.up>0)===me?'gana '+s:'pierde '+s; }
  if(!m.up) return m.played?'igualados':'A/S'; return a+(m.up>0?' arriba':' abajo')+(a===m.left?' · dormie':''); }
function rmNum(v){ return String(v).replace('.',','); }
// the standings, best first, with the place (ties share it), the value shown and the line under the name
function rmTable(){ const L=rmPlayers(false).map(e=>Object.assign({e},rmStats(e))); const f=RM.fmt;
  if(f==='match'){ for(const r of L){ r.w=0; r.hu=0; r.duels=[]; for(const o of L){ if(o===r) continue; const m=rmDuel(r.e,o.e); r.duels.push({o:o.e,m}); if(m.played) r.w+=m.up>0?1:m.up===0?0.5:0; r.hu+=m.up; } }
    L.sort((a,b)=>b.w-a.w||b.hu-a.hu||b.holes-a.holes); }
  else if(f==='stableford') L.sort((a,b)=>b.pts-a.pts||a.tp-b.tp||b.holes-a.holes);
  else L.sort((a,b)=>(a.holes?0:1)-(b.holes?0:1)||a.tp-b.tp||b.pts-a.pts);
  const key=r=>f==='match'?r.w+'|'+r.hu:f==='stableford'?r.pts+'|'+r.tp:(r.holes?r.tp:'x');
  L.forEach((r,k)=>{ r.pos=k&&key(r)===key(L[k-1])?L[k-1].pos:k+1; r.tie=false; });
  L.forEach(r=>{ r.tie=L.filter(x=>x.pos===r.pos).length>1;
    if(f==='stableford') r.val=r.pts+' pts'; else if(f==='medal') r.val=r.holes?rel(r.tp):'—';
    else if(L.length===2){ r.val=rmDuelTxt(r.duels[0].m,true); } else r.val=rmNum(r.w)+' pts'; });
  return L; }
function rmLive(e){ const C=rmC(); let h=-1,c=0,m='';
  if(e.me){ h=S.g.hole; c=S.g.cur; m=S.mode; } else { const p=rmPeer(e); if(!p) return e.left?'ha dejado la partida':(rmDone(e)?'terminó':'sin conexión'); const q=p.cur; if(!q) return 'conectando…'; h=q.h; c=q.c|0; m=q.m; if(q.aw) return 'ausente · '+rmHoles(e)+' hoyos'; }
  if(rmDone(e)) return 'terminó';
  if(h>=0&&W.HOLES[h]&&W.HOLES[h].course===RM.course&&!e.sc[C.holes.indexOf(h)]) return 'en el '+W.HOLES[h].n+' · golpe '+(c+((m==='aim'||m==='swing')?1:0));
  const n=rmHoles(e); return n?n+(n===1?' hoyo':' hoyos'):'aún sin empezar'; }
function rmLeader(){ const L=rmTable(); return L.length>1&&L[0].pos!==(L[1]&&L[1].pos)?L[0].e:null; }

/* ---- the room: send, receive, invite, join, leave ---- */
function rmHead(){ return {m:RM.mid,f:RM.fmt,c:RM.course,te:RM.tee,o:RM.host,on:RM.hn,t0:RM.t0}; }
function rmSend(iv){ if(!RM.on||!MP.code||!MP.key||(RM.room&&RM.room!==MP.code)) return; const me=rmMe(); RM.beat=0;
  mpSend(Object.assign({t:'rmp'},rmHead(),{u:me.u,n:me.n,cl:me.col,hc:me.hc,sc:me.sc,x:0,e:RM.closed?1:0},iv?{iv:1}:{})); }
function rmBusy(p){ return (RM.on&&!RM.final)||!!(RM.offer&&RM.offer.from===(p&&p.id)&&Date.now()-RM.offer.at<60000); }
function rmNetIn(p,o){ if(o.t!=='rmp') return;
  const C=W.COURSES[o.c|0]; if(typeof o.m!=='string'||o.m.length>60||!RMF[o.f]||!C||typeof o.u!=='string'||!/^[0-9a-f]{8,32}$/.test(o.u)||o.u===RM.uid||!Array.isArray(o.sc)||o.sc.length!==C.holes.length) return;
  p.rmu=o.u; const e={u:o.u,n:String(o.n||p.n||'Jugador').replace(/[\u0000-\u001f]/g,'').slice(0,16),col:rmCol(o.cl),hc:clamp(o.hc|0,0,54),sc:o.sc.map(v=>clamp(v|0,0,15)),left:!!o.x,id:p.id,seen:Date.now()};
  if(RM.on&&o.m===RM.mid&&(!RM.room||RM.room===MP.code)){ const had=RM.pl.get(e.u), lead0=RM.lead;
    if(!had&&!e.left) mpFeed('<b>'+esc(e.n)+'</b> se une a la partida','ev',true); if(had&&!had.left&&e.left) mpFeed('<b>'+esc(e.n)+'</b> deja la partida','sys',true);
    RM.pl.set(e.u,e); if(o.e&&!RM.closed){ RM.closed=true; mpFeed('<b>'+esc(e.n)+'</b> ha cerrado la partida','sys',true); }
    rmSave(); rmCheck(); const ld=rmLeader(); if(ld&&lead0&&ld.u!==lead0&&!RM.final){ mpFeed('<b>'+esc(ld.me?'Tú':ld.n)+'</b> '+(ld.me?'pasas':'pasa')+' a liderar','ev',true); if(!quietNow()) toast(ld.me?'Lideras la partida':ld.n+' lidera la partida',RMF[RM.fmt]+' con la sala'); }
    if(MP.panelOpen||rmTabOpen()) rmRefreshTab(); return; }
  // somebody else's match: keep it on offer, and ask once if it is a fresh invitation
  if(e.left){ if(RM.offer&&RM.offer.m===o.m){ RM.offer.pl.delete(e.u); if(!RM.offer.pl.size) RM.offer=null; } return; }
  if(!RM.offer||RM.offer.m!==o.m) RM.offer={m:o.m,f:o.f,c:o.c|0,te:typeof o.te==='string'?o.te.slice(0,12):'',o:typeof o.o==='string'?o.o:'',on:String(o.on||p.n||'').slice(0,16),t0:+o.t0||Date.now(),from:p.id,at:Date.now(),pl:new Map()};
  RM.offer.pl.set(e.u,e); if(o.iv) RM.offer.at=Date.now();
  // ask once per match: the invitation itself, or (arriving later) the first entry of a match still on its front nine
  if(!RM.on&&!RM.asked.has(o.m)&&(o.iv||rmHoles(e)<9)){ RM.asked.add(o.m); const n=esc(e.n), C2=C, tee=W.HOLES[C2.holes[0]].n, how=RMF[o.f]+' con hándicap'+(W.MULTI?' en '+esc(C2.name):'')+(RM.offer.te?' desde barras '+esc(RM.offer.te):'');
    mpFeed('<b>'+n+'</b> '+(o.iv?'propone':'juega')+' una partida de golf con la sala','ev',true);
    mpPrompt(o.iv?n+' propone una partida '+how+'. Todos al tee del hoyo '+tee+'. Juegas con hándicap '+RM.hc+' (se cambia en la pestaña Partida).'
      :'En la sala se juega una partida '+how+' (organiza '+esc(RM.offer.on||e.n)+'). Si te unes, empiezas en el tee del hoyo '+tee+' con hándicap '+RM.hc+'.','Jugar la partida',()=>rmJoin(),o.iv?30000:15000); }
  if(rmTabOpen()) rmRefreshTab(); }
function rmHello(){ if(RM.on&&!RM.final&&(!RM.room||RM.room===MP.code)) setTimeout(()=>rmSend(false),120+Math.random()*400); }
function rmReady(){ if(S.mode==='pas') pasOff(); if(S.mode==='ski') stopSki(); if(S.mode==='fish') exitFish(); if(KART.on&&!KART.done) kartEnd(''); if(CIR.on) cirClear(); if(S.mode==='racket'&&typeof exitRacket==='function') exitRacket(); if(S.mode==='photo') exitPhoto(); if(S.mode==='replay') exitReplay(); if(BOT.on){ BOT.on=false; botHide(); botSave(); } }
function rmGoTee(){ if(['swing','flight'].includes(S.mode)){ setTimeout(rmGoTee,400); return; } setCourse(RM.course); const C=rmC(); if(RM.tee&&courseTees(C).includes(RM.tee)) setTeeSet(RM.tee); playTee(true); }
function rmReset(){ RM.on=false; RM.final=false; RM.closed=false; RM.won=false; RM.pl=new Map(); RM.lead=''; RM.sig=''; rmSave(); rmBoard(); }
function rmStart(fmt){ if(!MP.code||!MP.peers.size){ tip('Antes invita a alguien a la sala: pestaña Amigos, «Copiar enlace»',4000); return false; }
  fmt=RMF[fmt]?fmt:RM.fsel; rmReady(); if(RM.on) rmLeave(true);
  const C=courseOf(); clearCard(); /* the invitation goes out with a blank card */ Object.assign(RM,{on:true,room:MP.code,mid:RM.uid+':'+Date.now().toString(36),host:RM.uid,hn:mpName(),fmt,course:C.k,tee:teeSet(C)||'',t0:Date.now(),pl:new Map(),final:false,closed:false,won:false,lead:'',sig:''});
  RM.fsel=fmt; store.set(WP.key+'_rmf',fmt); rmSave(); rmSend(true); mpFeed('Has invitado a la sala a una partida '+RMF[fmt],'sys'); closeModal(); rmGoTee();
  setTimeout(()=>toast(RMF[fmt]+' con la sala','Todos al tee '+W.HOLES[C.holes[0]].n+' · cuando se unan, salen en la clasificación'),900); return true; }
function rmJoin(){ const of=RM.offer; if(!of||!W.COURSES[of.c]) return false; rmReady(); if(RM.on&&RM.mid!==of.m) rmLeave(true); setCourse(of.c); clearCard();
  Object.assign(RM,{on:true,room:MP.code,mid:of.m,host:of.o,hn:of.on,fmt:of.f,course:of.c,tee:of.te,t0:of.t0,pl:new Map(of.pl),final:false,closed:false,won:false,lead:'',sig:''}); RM.offer=null;
  rmSave(); closeModal(); rmGoTee(); setTimeout(()=>rmSend(false),250); mpFeed('Te has unido a la partida '+RMF[RM.fmt],'sys');
  setTimeout(()=>toast(RMF[RM.fmt]+' con la sala','Contra '+[...RM.pl.values()].map(e=>e.n).join(', ')),900); return true; }
function rmLeave(quiet){ if(!RM.on) return; if(MP.code&&MP.key&&!RM.final&&(!RM.room||RM.room===MP.code)) mpSend(Object.assign({t:'rmp'},rmHead(),{u:RM.uid,n:mpName(),cl:curSkin().shirt,hc:RM.hc,sc:rmMySc(),x:1})); if(!quiet) mpFeed('Has dejado la partida con la sala','sys'); rmReset(); }
function rmClose(){ if(!RM.on||RM.final) return; RM.closed=true; rmSend(false); rmCheck(); rmSave(); }
function rmSetHcp(v){ RM.hc=clamp(Math.round(+v||0),0,54); store.set('vg_hcp',String(RM.hc)); BOT.my=RM.hc; botSave(); const m=$('myHcp'); if(m) m.value=RM.hc; if(RM.on) rmSend(false); }
// after each of your holes (from saveScores) and at the end of your round (from endRound)
function rmCard(j){ if(!RM||!RM.on||RM.final) return; if(j>=0&&(!W.HOLES[j]||W.HOLES[j].course!==RM.course)) return; rmSend(false); rmCheck();
  if(j>=0&&S.g.scores[j]){ clearTimeout(RM.toastT); RM.toastT=setTimeout(()=>{ if(!RM.on||RM.final) return; const L=rmTable(), me=L.find(r=>r.e.me); if(!me||L.length<2) return;
      const H=W.HOLES[j], C=rmC(), r=recv(RM.hc,H,C);
      const sub=RM.fmt==='stableford'?'+'+stbl(S.g.scores[j],H.par,r)+' en el '+H.n+' · '+me.val:RM.fmt==='medal'?'neto '+me.val+' tras '+me.holes+(me.holes===1?' hoyo':' hoyos'):me.val;
      toast((me.tie?'Empatas ':'Vas ')+me.pos+'.º de '+L.length,RMF[RM.fmt]+' · '+sub); },2900); } }
function rmRound(){ if(!RM.on||RM.course!==S.course) return false; rmSend(false); rmCheck(); openModal('partida',{title:RM.final?'Partida terminada':'Tu vuelta ha terminado'}); return true; }
// everyone still in has played every hole (or someone closed it): the result is final
function rmCheck(){ const L=rmTable(); const ld=rmLeader(); RM.lead=ld?ld.u:'';
  if(RM.final||!RM.on) return; const all=L.every(r=>rmDone(r.e)); if(!(all&&L.length>=2)&&!RM.closed) return;
  RM.final=true; const win=L.filter(r=>r.pos===1).map(r=>r.e), me=L.find(r=>r.e.me); RM.won=!!(me&&me.pos===1);
  const names=win.map(e=>e.me?'tú':e.n); if(L.length<2){ mpFeed('Partida cerrada','sys'); rmSave(); if(rmTabOpen()) rmRefreshTab(); return; } toast(win.length>1?'Empate en cabeza':(win[0].me?'¡Has ganado la partida!':'Gana '+win[0].n),RMF[RM.fmt]+' con la sala · '+(win.length>1?names.join(' y '):names[0])+(win.length>1?' empatan':''));
  mpFeed('Partida terminada: '+(win.length>1?'empate entre '+names.join(' y '):'gana '+names[0]),'ev');
  if(me&&rmHoles(me.e)&&L.length>=2) prgEvt('sala',{win:RM.won,n:L.length}); else RM.won=false; rmSave(); if(rmTabOpen()) rmRefreshTab(); }

/* ---- on screen: the live standings ---- */
function rmShow(){ return RM.on&&!['menu','loading','drone','view','photo','replay','racket','rround','fish'].includes(S.mode)&&!raceNow()&&$('modal').hidden; }
function rmBoard(){ const el=$('rmBoard'); if(!el) return; const show=rmShow(); if(el.hidden===show) el.hidden=!show; if(!show) return;
  const L=rmTable(), C=rmC(); const done=L.filter(r=>rmDone(r.e)).length;
  const cols=RM.fmt==='match'?(L.length===2?'Match':'Liguilla'):RM.fmt==='stableford'?'Puntos':'Neto';
  const sig=[RM.open,RM.final,RM.fmt,L.map(r=>r.e.u+r.pos+r.val+rmLive(r.e)+r.e.n).join('|')].join('#'); if(sig===RM.sig) return; RM.sig=sig;
  const me=L.find(r=>r.e.me), first=L[0];
  const head='<button class="rmh" id="rmHead" aria-expanded="'+RM.open+'"><span>'+(RM.final?'Final · ':'')+RMF[RM.fmt]+(W.MULTI?' · '+esc(C.short):'')+'</span>'+
    (RM.open?'':'<span class="rms">'+(first?(first.e.me?'tú':esc(first.e.n))+' '+esc(first.val):'')+(me&&me!==first?' · tú '+me.pos+'.º':'')+'</span>')+'<span class="ar">'+(RM.open?'▴':'▾')+'</span></button>';
  const max=viewH()<520?3:6; let rows=L.slice(0,max); if(me&&!rows.includes(me)) rows=rows.slice(0,max-1).concat([me]);
  const body=RM.open?'<div class="rmcols"><span>Pos.</span><span>Jugador · va por</span><span>'+cols+'</span></div><ol>'+rows.map(r=>{ const e=r.e, off=!e.me&&!rmPeer(e)&&!rmDone(e);
      return '<li class="'+(e.me?'me':'')+(off?' off':'')+'"><span class="ps">'+(r.tie?'=':'')+r.pos+'</span><span class="nm"><b><i class="dot" style="background:'+e.col+'"></i>'+esc(e.me?'Tú':e.n)+' <small class="hc">hcp '+e.hc+'</small></b><small>'+esc(rmLive(e))+'</small></span><span class="v">'+esc(r.val)+'</span></li>'; }).join('')+'</ol>'+
    (L.length>rows.length?'<div class="rmmore">y '+(L.length-rows.length)+' más · pestaña Partida</div>':'')+(L.length<2?'<div class="rmmore">Esperando a que se unan tus amigos…</div>':'')+(RM.final?'<div class="rmmore">Partida terminada · '+done+' de '+L.length+' acabaron</div>':''):'';
  el.classList.toggle('min',!RM.open); el.innerHTML=head+body;
  $('rmHead').onclick=e=>{ e.stopPropagation(); RM.open=!RM.open; store.set('vg_rmopen',RM.open?'1':'0'); RM.sig=''; rmBoard(); }; }
function rmTick(dt){ const el=$('rmBoard'); if(!RM.on){ if(el&&!el.hidden){ el.hidden=true; document.body.classList.remove('rmon'); } return; } RM.acc+=dt; RM.beat+=dt;
  const show=rmShow(); if(el&&el.hidden===show){ el.hidden=!show; RM.sig=''; RM.acc=1; document.body.classList.toggle('rmon',show); } // hide at once under a sheet or a race; redraw when it comes back
  if(show&&RM.acc>=0.4){ RM.acc=0; rmBoard(); rmPlace(el); } if(RM.beat>=25&&!RM.final) rmSend(false); }
// just under the room bar (its height moves with the minimap and the wind box); on low screens the CSS puts it top centre
function rmPlace(el){ const bar=$('mpBar'); let t=''; if(viewH()>=520&&bar&&!bar.hidden){ const r=bar.getBoundingClientRect(); if(r.height>0) t=Math.round(r.bottom+6)+'px'; } if(el.style.top!==t) el.style.top=t; }
// the line in the hole card: what this hole gives you
function rmHcLine(H){ if(!RM.on||!H||H.course!==RM.course) return ''; const C=rmC(); let t='';
  if(RM.fmt!=='match'){ const r=recv(RM.hc,H,C); t=r?'recibes '+r+' golpe'+(r>1?'s':'')+' aquí':'aquí no recibes golpes'; }
  else { const parts=[]; for(const e of RM.pl.values()){ if(e.left) continue; const d=Math.abs(RM.hc-e.hc), r=recv(d,H,C); if(!r) continue; parts.push(RM.hc>e.hc?esc(e.n)+' te da '+r:'das '+r+' a '+esc(e.n)); } t=parts.length?parts.join(' · '):'golpes iguales aquí'; }
  return RMF[RM.fmt]+' con la sala <span>· '+t+'</span>'; }

/* ---- the Partida tab: set it up, join it, follow it ---- */
function rmTabOpen(){ return !$('modal').hidden&&!!$('rmTab'); }
function rmRefreshTab(){ const box=$('rmTab'); if(!box) return; const y=$('sheetBody').scrollTop; box.innerHTML=rmTabInner(); rmWire(); $('sheetBody').scrollTop=y; }
function rmTabHTML(){ return '<div id="rmTab">'+rmTabInner()+'</div>'; }
function rmCardTable(){ const C=rmC(), ps=rmPlayers(true), L=rmTable(), two=RM.fmt==='match'&&L.length===2;
  const act=ps.filter(x=>!x.left), hi=two&&act.length===2&&act[0].hc!==act[1].hc?(act[0].hc>act[1].hc?act[0]:act[1]):null, dif=two&&act.length===2?Math.abs(act[0].hc-act[1].hc):0;
  const head='<tr><th>Hoyo</th><th>Par</th><th>Hcp</th>'+ps.map(p=>'<th>'+esc(p.me?'Tú':p.n)+'<br><small>hcp '+p.hc+(p.left?' · se fue':'')+'</small></th>').join('')+'</tr>';
  let rows=''; C.holes.forEach((i,q)=>{ const H=W.HOLES[i]; rows+='<tr><td>'+H.n+'</td><td>'+H.par+'</td><td>'+(H.hcp||'')+'</td>'+ps.map(p=>{ const s=p.sc[q];
      const r=RM.fmt==='match'?(p===hi?recv(dif,H,C):0):recv(p.hc,H,C);
      if(!s) return '<td>—'+(r?'<small class="rv">'+'•'.repeat(r)+'</small>':'')+'</td>'; const d=s-H.par, cls=d<=-2?'e':d===-1?'b':d===0?'':d===1?'o':'o2';
      return '<td><span class="sc '+cls+'">'+s+'</span>'+(RM.fmt==='stableford'?'<small class="pt">'+stbl(s,H.par,recv(p.hc,H,C))+'</small>':'')+(r?'<small class="rv">'+'•'.repeat(r)+'</small>':'')+'</td>'; }).join('')+'</tr>'; });
  const foot='<tr><td>Total</td><td>'+C.par+'</td><td></td>'+ps.map(p=>{ const s=rmStats(p); return '<td>'+(s.g||'—')+'<small class="pt">'+(RM.fmt==='stableford'?s.pts:(s.holes?rel(s.tp):''))+'</small></td>'; }).join('')+'</tr>';
  return '<div class="tablewrap"><table class="card grp"><thead>'+head+'</thead><tbody>'+rows+'</tbody><tfoot>'+foot+'</tfoot></table></div>'; }
function rmTabInner(){ const inRoom=!!MP.code, peers=MP.peers.size;
  let h='<h3 style="margin-top:0">Partida con la sala</h3>';
  if(RM.on){ const L=rmTable(), C=rmC();
    h+='<p><b>'+RMF[RM.fmt]+'</b> con hándicap'+(W.MULTI?' en <b>'+esc(C.name)+'</b>':'')+(RM.tee?' · barras '+esc(RM.tee):'')+' · organiza '+(RM.host===RM.uid?'tú':esc(RM.hn||'un amigo'))+(RM.final?' · <b>partida terminada</b>':'')+'</p>';
    h+='<ol class="board">'+L.map(r=>'<li'+(r.e.me?' class="me"':'')+'><b>'+(r.tie?'=':'')+r.pos+'.º '+esc(r.e.me?'Tú':r.e.n)+'</b> '+esc(r.val)+' <small>hcp '+r.e.hc+' · '+esc(rmLive(r.e))+' · '+r.g+' golpes</small></li>').join('')+'</ol>';
    if(RM.fmt==='match'&&L.length>2){ h+='<div class="lbl">Los matches de la liguilla</div><ul class="note" style="margin:4px 0 10px">'; const seen=new Set();
      for(const r of L) for(const d of r.duels){ const k=[r.e.u,d.o.u].sort().join('|'); if(seen.has(k)) continue; seen.add(k); h+='<li>'+esc(r.e.me?'Tú':r.e.n)+' – '+esc(d.o.me?'Tú':d.o.n)+': '+(d.m.up?esc(d.m.up>0?(r.e.me?'Tú':r.e.n):(d.o.me?'Tú':d.o.n))+' '+Math.abs(d.m.up)+(d.m.done&&d.m.done.left?' y '+d.m.done.left:' arriba')+(d.m.done?' (ganado)':''):(d.m.done?'empate':'igualados'))+'</li>'; }
      h+='</ul>'; }
    if(RM.room&&RM.room!==MP.code) h+='<p class="note bad">Esta partida es de la sala '+mpPretty(RM.room)+(MP.code?'; ahora estás en otra':'; ahora no estás en ninguna')+'. Vuelve a esa sala para seguirla, o déjala.</p>';
    if(RM.course!==S.course) h+='<p class="note bad">La partida es en '+esc(C.name)+': vuelve a ese recorrido con «Ir al tee 1».</p>';
    h+=rmCardTable()+
      '<p class="note"><b>Cómo leer la clasificación:</b> '+({stableford:'Puntos Stableford sumados (en pequeño, los de cada hoyo). Empate: mejor neto.',medal:'Neto respecto al par de los hoyos que lleva cada uno: −2 son dos golpes bajo par después de restar el hándicap; «par» es estar justo al par.',match:L.length===2?'Hoyos de ventaja: «2 arriba» gana de dos; «dormie», va tantos arriba como hoyos quedan; «3 y 2», ganado con tres de ventaja y dos por jugar. Los puntitos son los golpes que recibe el de más hándicap.':'Puntos de liguilla: 1 por match ganado y 0,5 por empate, como si los matches acabaran ahora; empate a puntos, más hoyos de ventaja en total.'})[RM.fmt]+
      ' «Va por» dice en qué hoyo y golpe está cada uno ahora. Los puntitos bajo los golpes son los que da el hándicap en ese hoyo. El signo = delante del puesto es empate.</p>'+
      '<div class="lbl">Tu hándicap</div><div class="row" style="margin:4px 0 10px;align-items:center;gap:8px"><input type="number" id="rmHcp" min="0" max="54" step="1" value="'+RM.hc+'" style="width:80px"'+(RM.final?' disabled':'')+'><span class="note">Lo ven todos; cambia los golpes que recibes.</span></div>'+
      '<div class="row" style="flex-wrap:wrap;gap:8px">'+(RM.final?'<button class="btn primary" id="rmNew">Nueva partida</button>':'<button class="btn primary" id="rmTee">Ir al tee '+W.HOLES[C.holes[0]].n+'</button><button class="btn small" id="rmCloseB">Cerrar la partida ahora</button><button class="btn small" id="rmLeaveB">Dejar la partida</button>')+'</div>'+
      (RM.final?'':'<p class="note">«Ir al tee» empieza tu tarjeta de nuevo desde el hoyo 1. «Cerrar la partida ahora» la da por terminada para todos con lo jugado (por ejemplo, si alguien se ha ido). Pulsa dos veces para confirmar.</p>');
    return h; }
  if(!inRoom) return h+'<p>Juega una vuelta con hándicap contra tus amigos de verdad: cada uno desde su móvil, todos desde el tee 1 y la clasificación en vivo en pantalla. Primero cread una sala.</p><div class="row"><button class="btn primary" id="rmToRoom">Crear o unirme a una sala</button></div>';
  const of=RM.offer&&(Date.now()-RM.offer.at<3*3600e3)?RM.offer:null;
  if(of){ const C=W.COURSES[of.c]; h+='<div class="rmoffer"><p style="margin:0 0 6px"><b>'+esc(of.on||'Un amigo')+'</b> ha organizado una partida <b>'+RMF[of.f]+'</b>'+(W.MULTI?' en '+esc(C.name):'')+(of.te?' (barras '+esc(of.te)+')':'')+'. Juegan: '+[...of.pl.values()].map(e=>esc(e.n)+' ('+rmHoles(e)+' hoyos)').join(', ')+'.</p>'+
      '<div class="row" style="align-items:center;gap:8px;flex-wrap:wrap"><span class="lbl" style="margin:0">Tu hándicap</span><input type="number" id="rmHcp" min="0" max="54" step="1" value="'+RM.hc+'" style="width:80px"><button class="btn primary" id="rmJoinB">Unirme a la partida</button></div><p class="note">Empiezas en el tee '+W.HOLES[C.holes[0]].n+' con tu tarjeta de '+esc(C.name)+' en blanco; los que ya van por delante siguen jugando.</p></div>'; }
  if(!peers) return h+'<p>Aún no hay nadie más en la sala. Manda el enlace (pestaña Amigos, «Copiar enlace») y, cuando entren, organiza aquí la partida.</p><div class="row"><button class="btn small" id="rmToRoom">Ir a Amigos</button></div>';
  const C=courseOf(), f=RM.fsel, names=[...MP.peers.values()].map(p=>esc(p.n||'…')).join(', ');
  h+='<p>'+(of?'O empieza otra: ':'')+'una vuelta con hándicap contra los de la sala ('+names+'). Les llega la invitación, cada uno pone su hándicap y todos salís del tee '+W.HOLES[C.holes[0]].n+'. Sin rivales de la máquina.</p>'+
    (W.MULTI?courseChips():'')+teeChips()+
    '<div class="lbl">Formato</div><div class="row" style="margin:4px 0 8px;flex-wrap:wrap;gap:6px">'+Object.keys(RMF).map(k=>'<button class="btn small'+(f===k?' primary':'')+'" data-rmf="'+k+'">'+RMF[k]+'</button>').join('')+'</div>'+
    '<p class="note" style="margin:0 0 10px">'+RM_TXT[f]+'</p>'+
    (of?'':'<div class="row" style="margin:0 0 10px;align-items:center;gap:8px"><span class="lbl" style="margin:0">Tu hándicap</span><input type="number" id="rmHcp" min="0" max="54" step="1" value="'+RM.hc+'" style="width:80px"></div>')+
    '<div class="row"><button class="btn primary" id="rmGo">Invitar a la sala y salir al tee '+W.HOLES[C.holes[0]].n+'</button></div><p class="note">Empezar borra tu tarjeta de '+esc(C.name)+'. Los que acepten empiezan también con la tarjeta en blanco.</p>';
  return h; }
function rmWire(){ const b=$('sheetBody'); if(!b) return;
  b.querySelectorAll('[data-rmf]').forEach(x=>x.onclick=()=>{ RM.fsel=x.dataset.rmf; store.set(WP.key+'_rmf',RM.fsel); rmRefreshTab(); });
  const hc=$('rmHcp'); if(hc){ hc.addEventListener('keydown',e=>e.stopPropagation()); hc.onchange=()=>{ rmSetHcp(hc.value); hc.value=RM.hc; if(RM.on) rmRefreshTab(); }; }
  const go=$('rmGo'); if(go) go.onclick=()=>{ if(hc) rmSetHcp(hc.value); rmStart(RM.fsel); };
  const jn=$('rmJoinB'); if(jn) jn.onclick=()=>{ if(hc) rmSetHcp(hc.value); rmJoin(); };
  const tr=$('rmToRoom'); if(tr) tr.onclick=()=>openModal('amigos',{title:'Con amigos'});
  const te=$('rmTee'); if(te) te.onclick=()=>{ closeModal(); rmGoTee(); };
  const nw=$('rmNew'); if(nw) nw.onclick=()=>{ rmReset(); openModal('partida'); };
  const twice=(el,fn,txt)=>{ if(el) el.onclick=()=>{ if(el.dataset.ok){ fn(); openModal('partida'); } else { el.dataset.ok='1'; el.textContent=txt; } }; };
  twice($('rmCloseB'),rmClose,'Pulsa otra vez para cerrarla'); twice($('rmLeaveB'),()=>rmLeave(false),'Pulsa otra vez para dejarla'); }
function rmGuideHTML(){ return '<li><b>Partida con la sala</b> (pestaña <b>Partida</b>, o «Jugar al golf» con amigos en la sala): una vuelta con hándicap en Stableford, Medal neto o Match play contra los de la sala, sin rivales de la máquina. A los demás les llega la invitación, cada uno pone su hándicap y todos salís del tee 1 con la tarjeta en blanco. Arriba a la derecha va la <b>clasificación en vivo</b>: puesto (= es empate), jugador, en qué hoyo y golpe va y su resultado (puntos, neto al par o estado del match). Tócala para encogerla. En Match play con tres o más jugadores se juega una liguilla: todos contra todos. Si recargas la página vuelves a la misma partida al entrar en la sala; quien se une tarde empieza en el tee 1.</li>'; }
// the box in the Amigos tab
function rmPanelHTML(){ if(RM.on){ const L=rmTable(), me=L.find(r=>r.e.me);
    return '<p style="margin:0 0 6px">Estás en una partida <b>'+RMF[RM.fmt]+'</b>'+(RM.final?' (terminada)':'')+(me&&L.length>1?': '+(RM.final?'acabaste':'vas')+' <b>'+(me.tie?'=':'')+me.pos+'.º de '+L.length+'</b> ('+esc(me.val)+')':'')+'.</p><div class="row"><button class="btn small primary" data-rm="tab">Ver la clasificación</button></div>'; }
  if(RM.offer&&Date.now()-RM.offer.at<3*3600e3){ const of=RM.offer; return '<p style="margin:0 0 6px"><b>'+esc(of.on||'Un amigo')+'</b> ha organizado una partida <b>'+RMF[of.f]+'</b> con '+[...of.pl.values()].map(e=>esc(e.n)).join(', ')+'.</p><div class="row"><button class="btn small primary" data-rm="join">Unirme con hándicap '+RM.hc+'</button><button class="btn small" data-rm="tab">Ver detalles</button></div>'; }
  return '<p style="margin:0 0 6px">Una vuelta con hándicap (Stableford, Medal o Match play) contra los de la sala: todos al tee 1 y la clasificación en vivo en pantalla.</p><div class="row"><button class="btn small'+(MP.peers.size?' primary':'')+'" data-rm="tab">Organizar una partida</button></div>'; }
function rmPanelWire(box){ box.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{ if(b.dataset.rm==='join') rmJoin(); else openModal('partida'); }); }
