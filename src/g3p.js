
/* ================= padel and tennis against a friend of the room: whoever invites keeps the ball and the score ================= */
// messages: rkinv (invitation), rkok (I accept), rkgo (the match starts), rks (state of the host), rkg (position of the guest), rkh (a hit of the guest), rkp (point), rkm (message), rkbye (leave)
const RKN={inv:0,sendT:0,tgt:null};
function rkNetCan(){ return !!(typeof MP!=='undefined'&&MP.code&&MP.peers.size&&RK.C&&!RK.net&&W.COURTS); }
function rkCourtId(C){ return W.COURTS?W.COURTS.indexOf(C):-1; }
function rkNetInvite(){ if(!rkNetCan()) return; const ci=rkCourtId(RK.C); RKN.inv=performance.now(); mpSend({t:'rkinv',c:ci,k:RK.C.k}); rkMsg('Reto enviado a la sala: juegas con el primero que acepte'); }
function rkPeer(){ return RK.net?MP.peers.get(RK.net.peer):null; }
function rkR3(x){ return Math.round(x*1000)/1000; }
function rkNetSend(now){ const N=RK.net; if(!N) return; const t=performance.now(); if(!now&&t-RKN.sendT<80) return; RKN.sendT=t; const b=RK.ball;
  if(N.role==='host') mpSend({t:'rks',b:[b.u,b.y,b.v,b.vu,b.vy,b.vv].map(rkR3),l:b.live?1:0,ph:RK.phase,h:RK.hitter,bn:RK.bounces,sv:RK.serve?1:0,sr:RK.server,sc:[RK.score.pts[0],RK.score.pts[1],RK.score.games[0],RK.score.games[1]],ov:RK.over?1:0,me:[rkR3(RK.me.u),rkR3(RK.me.v)],mv:rkR3(RK.me.mv),n:RK.shot},N.peer);
  else mpSend({t:'rkg',p:[rkR3(RK.me.u),rkR3(RK.me.v)],mv:rkR3(RK.me.mv)},N.peer); }
// the guest hit the ball on his screen: the host takes it from there
function rkNetHit(type,T){ const N=RK.net; if(!N||N.role!=='guest') return; const b=RK.ball; N.wait=N.hostShot; N.waitT=performance.now(); RK.ai.sw=0;
  mpSend({t:'rkh',ty:type,T:[rkR3(T[0]),rkR3(T[1])],b:[b.u,b.y,b.v].map(rkR3),s:N.hostShot},N.peer); }
function rkNetPoint(w,why,kind){ const N=RK.net; if(!N||N.role!=='host') return; mpSend({t:'rkp',w,k:kind||'p',why:String(why).slice(0,40),sc:[RK.score.pts[0],RK.score.pts[1],RK.score.games[0],RK.score.games[1]],ov:RK.over?1:0},N.peer); rkNetSend(true); }
function rkNetMsg(x){ if(RK.net&&RK.net.role==='host') mpSend({t:'rkm',x:String(x).slice(0,40)},RK.net.peer); }
function rkNetLeave(){ const N=RK.net; if(!N) return; mpSend({t:'rkbye'},N.peer); RK.net=null; }
function rkNetGone(p,why){ if(!RK.net||RK.net.peer!==p.id) return; RK.net=null; toast(p.n+' '+(why||'ha dejado el partido'),'Vuelves a jugar contra el ordenador'); if(RK.C){ const C=RK.C, f=RK.flip; startRacket(C,{flip:f}); } }
function rkNetStep(dt){ const N=RK.net; if(!N) return; const pp=rkPeer(); if(!pp){ rkNetGone({id:N.peer,n:N.name},'se ha desconectado'); return; }
  if(RKN.tgt){ const a=RK.ai, k=1-Math.exp(-dt*12); a.u+=(RKN.tgt[0]-a.u)*k; a.v+=(RKN.tgt[1]-a.v)*k; a.mv=RKN.tgt[2]; }
  rkNetSend(false); }
// a friend in the room challenges you
function rkNetIn(p,o){ const N=RK.net;
  if(o.t==='rkinv'){ const C=W.COURTS&&W.COURTS[o.c|0]; if(!C||(N&&N.peer!==p.id)) return; mpFeed('<b>'+esc(p.n)+'</b> reta a la sala a un partido de '+(C.k==='padel'?'pádel':'tenis'),'ev',true);
    mpPrompt(esc(p.n)+' te reta a un partido de '+(C.k==='padel'?'pádel':'tenis')+'. ¿Juegas?','Jugar',()=>mpSend({t:'rkok',c:o.c|0},p.id),15000); return; }
  if(o.t==='rkok'){ if(!RK.C||rkCourtId(RK.C)!==(o.c|0)||RK.net||performance.now()-RKN.inv>60000){ mpSend({t:'rkno'},p.id); return; }
    const C=RK.C, f=RK.flip; startRacket(C,{flip:f,net:{role:'host',peer:p.id,name:p.n,skin:pSkin(p)}}); mpSend({t:'rkgo',c:o.c|0,f},p.id); rkMsg('Partido contra '+p.n+': sacas tú'); return; }
  if(o.t==='rkno'){ toast('Partido completo',esc(p.n)+' ya está jugando con otro'); return; }
  if(o.t==='rkgo'){ const C=W.COURTS&&W.COURTS[o.c|0]; if(!C) return; if(S.mode==='replay') exitReplay(); if(S.mode==='photo') exitPhoto(); if(S.mode==='jet') dismountJet(); if(S.mode==='fish') exitFish(); if(S.mode==='view') exitView();
    if(['aim','swing','flight','wait'].includes(S.mode)) setMode('walk'); closeModal(); startRacket(C,{flip:-(o.f||1),server:1,net:{role:'guest',peer:p.id,name:p.n,skin:pSkin(p),hostShot:0,wait:-1}}); return; }
  if(!N||N.peer!==p.id) return;
  if(o.t==='rkbye'){ rkNetGone(p,'ha dejado el partido'); return; }
  if(N.role==='host'){
    if(o.t==='rkg'&&Array.isArray(o.p)){ RKN.tgt=[-(+o.p[0]||0),-(+o.p[1]||0),+o.mv||0]; return; }
    if(o.t==='rkh'&&Array.isArray(o.T)&&Array.isArray(o.b)){ if((o.s|0)!==RK.shot&&!(RK.phase==='serve'&&RK.srv===RK.ai)) return; if(RK.phase==='dead') return; const b=RK.ball;
      b.u=-(+o.b[0]||0); b.y=Math.max(0.05,+o.b[1]||1); b.v=-(+o.b[2]||0); if(RK.phase==='serve') RK.phase='rally';
      rkHit(1,o.ty==='lob'?'lob':'drive',1,RK.ai,[-(+o.T[0]||0),-(+o.T[1]||0)]); if(RK.serve) RK.phase='rally'; rkNetSend(true); return; } }
  else {
    if(o.t==='rks'&&Array.isArray(o.b)){ const n=o.n|0; RKN.tgt=[-(+o.me[0]||0),-(+o.me[1]||0),+o.mv||0];
      if(n>N.hostShot&&(o.h|0)===0) RK.ai.sw=0.32; N.hostShot=n;
      const sc=o.sc||[0,0,0,0]; RK.score.pts=[sc[1]|0,sc[0]|0]; RK.score.games=[sc[3]|0,sc[2]|0]; RK.server=1-(o.sr|0); RK.over=!!o.ov;
      if(o.ph==='serve'&&RK.phase!=='serve'){ rkNewPoint(); rkHUD(); return; }
      if(N.wait>=0&&n<=N.wait&&performance.now()-N.waitT<700&&o.ph==='rally') return; N.wait=-1;
      const b=RK.ball, nb={u:-o.b[0],y:o.b[1],v:-o.b[2],vu:-o.b[3],vy:o.b[4],vv:-o.b[5]};
      const far=Math.hypot(nb.u-b.u,nb.v-b.v,nb.y-b.y)>0.9||n!==N.seenShot; N.seenShot=n;
      if(far){ Object.assign(b,nb); } else { const k=0.35; b.u+=(nb.u-b.u)*k; b.v+=(nb.v-b.v)*k; b.y+=(nb.y-b.y)*k; b.vu=nb.vu; b.vy=nb.vy; b.vv=nb.vv; }
      b.live=!!o.l; RK.hitter=o.h<0?-1:1-(o.h|0); RK.bounces=o.bn|0; RK.serve=!!o.sv; if(o.ph==='rally'&&RK.phase!=='rally'&&RK.phase!=='dead') RK.phase='rally'; if(o.ph==='rally'&&RK.phase==='dead'&&b.live) RK.phase='rally'; return; }
    if(o.t==='rkp'){ const w=1-(o.w|0), sc=o.sc||[0,0,0,0]; const g0=RK.score.games.slice(); RK.score.pts=[sc[1]|0,sc[0]|0]; RK.score.games=[sc[3]|0,sc[2]|0]; RK.over=!!o.ov; RK.phase='dead'; RK.deadT=1.6;
      let big=w===0?'¡Punto!':'Punto de '+N.name; if(o.k==='g'||(o.k===undefined&&RK.score.games[w]>g0[w])) big=w===0?'¡Juego tuyo!':'Juego de '+N.name; if(RK.over) big=w===0?'¡Has ganado '+RK.score.games[0]+'-'+RK.score.games[1]+'!':'Gana '+N.name+' '+RK.score.games[1]+'-'+RK.score.games[0];
      rkMsg(big+' · '+String(o.why||'').slice(0,40)); rkHUD(); return; }
    if(o.t==='rkm'){ rkMsg(String(o.x||'').slice(0,40)); return; } } }
