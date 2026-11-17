/* ================= E1a · cuentas para los peques (solo Valdecañas con WP.cuentas) ================= */
// Nombres mt*, estado MT. Perfiles por niño en este dispositivo (vg_mt): nombre, avatar, nivel 1-6 con su dificultad d (0-1), repaso de las falladas (rv),
// cuentas que más falla (fl), semana (wk: por día [a la primera, hechas, bien al final, segundos de cuentas, segundos de juego]) y monedas de hoy por cuentas (cd, cc).
// Reto cada MT.d.iv minutos de juego, solo en una pausa natural (al bajarse de algo, al aterrizar, al acabar un poder o una carrera, o quieto un rato);
// 4 cuentas → monedas ×2 durante 10 minutos (MT.d.x2, en prgEarn). Supercarga: una cuenta con el botón ⚡ junto a Poder. Modo deberes con PIN.
var MT_LV=[null,{n:'Sumas hasta 10',s:'+'},{n:'Restas hasta 10',s:'−'},{n:'Sumas hasta 20',s:'+'},{n:'Restas hasta 20',s:'−'},{n:'Sumas llevando hasta 100',s:'+'},{n:'Restas llevando hasta 100',s:'−'}];
var MT_AV=['🦊','🐯','🐼','🐸','🦄','🐙','🦖','🚀','🏎️','🚁','🧙','🐺'];
var MT_IVS=[8,10,13,15,20], MT_CAP=100, MT_X2=600, MT_GOLD='#ffc61a';
var MT_FROM=['drive','ride','jet','bike','fly','pow','sled','ox','glide','ski','pas','fall'];
var MT={d:null,play:0,pm:'',calm:0,idle:0,soon:0,rn:false,q:null,tab:'jugar',unlock:false,pin:'',pin1:'',pinMode:'',newAv:'',del:0,armed:false,sv:0,veh:[],lastClose:0,uiX:'',uiS:'',tm:null,gate:[0,0]};
function mtLoad(){ let o={}; try{ o=JSON.parse(store.get('vg_mt')||'{}')||{}; }catch(e){} MT.d=Object.assign({v:1,ps:[],cur:'',pin:'',hw:false,iv:13,on:true,sup:true,play:0,x2:0},o);
  if(!Array.isArray(MT.d.ps)) MT.d.ps=[]; if(!MT_IVS.includes(MT.d.iv)) MT.d.iv=13; MT.play=+MT.d.play||0; for(const p of MT.d.ps) mtFix(p); }
function mtFix(p){ for(const [k,v] of [['lv',1],['d',0.3],['k',0],['ok',0],['oka',0],['tot',0],['st',0],['bs',0],['rt',0],['cc',0]]) if(typeof p[k]!=='number') p[k]=v;
  for(const k of ['win','rv']) if(!Array.isArray(p[k])) p[k]=[]; for(const k of ['fl','wk']) if(!p[k]||typeof p[k]!=='object') p[k]={}; p.lv=clamp(p.lv|0,1,6); return p; }
function mtSave(){ if(!MT.d) return; MT.d.play=Math.round(MT.play); store.set('vg_mt',JSON.stringify(MT.d)); }
function mtP(){ return MT.d?MT.d.ps.find(p=>p.id===MT.d.cur)||null:null; }
function mtDay(t){ const d=new Date(t||Date.now()); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function mtWk(p){ const k=mtDay(); if(!p.wk[k]){ p.wk[k]=[0,0,0,0,0]; const ks=Object.keys(p.wk).sort(); while(ks.length>28) delete p.wk[ks.shift()]; } return p.wk[k]; }
function mtX2On(){ return !!MT.d&&MT.d.x2>Date.now(); }
function mtMin(){ return Math.max(0,Math.ceil((MT.d.iv*60-MT.play)/60)); }
function mtR(a,b){ return a+Math.floor(Math.random()*(b-a+1)); }
function mtAcc(w){ return w.length?w.reduce((a,b)=>a+b,0)/w.length:0; }

/* ---- the sums and subtractions of each level; d (0-1) makes them a little harder inside the level ---- */
function mtQ(a,op,b,lv,rv){ return {a,op,b,lv,rv:!!rv,key:a+op+b,ans:op==='+'?a+b:a-b}; }
function mtGen(lv,d){ d=clamp(d,0,1); let a=3,b=2,op='+';
  if(lv===1){ const m=5+Math.round(5*d); a=mtR(1,m-1); b=mtR(1,Math.max(1,m-a)); }
  else if(lv===2){ const m=5+Math.round(5*d); a=mtR(2,m); b=mtR(1,a); op='-'; }
  else if(lv===3){ const s=mtR(9+Math.round(3*d),12+Math.round(8*d)); a=mtR(Math.max(2,s-10),Math.min(s-2,10)); b=s-a; if(Math.random()<0.5){ const t=a; a=b; b=t; } }
  else if(lv===4){ a=mtR(11,Math.min(20,13+Math.round(7*d))); const u=a%10; b=(u<9&&Math.random()<0.3+0.5*d)?mtR(u+1,9):(u>0?mtR(1,u):mtR(1,9)); op='-'; }
  else if(lv===5){ for(let i=0;i<40;i++){ const M=30+Math.round(70*d), ua=mtR(1,9), ub=mtR(10-ua,9), r=ua+ub-10, sm=Math.floor((M-r)/10)-1; if(sm<1) continue;
      const ta=mtR(1,sm), tb=mtR(d<0.3?0:Math.min(1,sm-ta),sm-ta); a=ta*10+ua; b=tb*10+ub; if(Math.random()<0.5){ const t=a; a=b; b=t; } break; } }
  else { op='-'; for(let i=0;i<40;i++){ const M=30+Math.round(70*d), A=mtR(20,M), ua=A%10; if(ua===9) continue; const ub=mtR(ua+1,9), tb=mtR(d<0.3?0:1,Math.max(0,Math.floor(A/10)-1)), B=tb*10+ub; if(B>=A||B<2) continue; a=A; b=B; break; } if(a<=b){ a=23; b=8; } }
  return mtQ(a,op,b,lv,false); }
// what comes next: a due review first (60 %), sometimes one of the level below (to keep it alive), never the same twice in a session
function mtPick(p,mode){ const seen=(MT.q&&MT.q.seen)||[];
  if(mode!=='test'){ const due=p.rv.filter(r=>r.due<=p.k&&r.lv<=p.lv+1&&!seen.includes(r.key)); if(due.length&&Math.random()<0.6){ const r=due[Math.floor(Math.random()*due.length)]; return mtQ(r.a,r.op,r.b,r.lv,true); } }
  let lv=p.lv, d=p.d; if(mode==='test'){ lv=MT.q.tl; d=0.5; } else if(lv>1&&Math.random()<0.25){ lv--; d=0.5+Math.random()*0.5; }
  let q=null; for(let i=0;i<10;i++){ q=mtGen(lv,d); if(!seen.includes(q.key)) break; } return q; }

/* ---- profiles ---- */
function mtNew(nm,av){ const p=mtFix({id:'p'+Date.now().toString(36)+mtR(100,999),nm:String(nm||'').trim().slice(0,14)||'Peque',av:av||MT_AV[MT.d.ps.length%MT_AV.length],made:Date.now(),t:false});
  MT.d.ps.push(p); MT.d.cur=p.id; mtSave(); return p; }
function mtUse(id){ if(!MT.d.ps.some(p=>p.id===id)) return; MT.d.cur=id; mtSave(); }
function mtDel(id){ MT.d.ps=MT.d.ps.filter(p=>p.id!==id); if(MT.d.cur===id) MT.d.cur=MT.d.ps.length?MT.d.ps[0].id:''; mtSave(); }
// coins from the sums: at most MT_CAP a day for each child (they are not doubled by the ×2)
function mtCoins(p,n){ if(p.cd!==mtDay()){ p.cd=mtDay(); p.cc=0; } const g=Math.max(0,Math.min(n,MT_CAP-p.cc)); if(g>0){ p.cc+=g; prgEarn(g,'Cuentas de '+p.nm,true); } return g; }
// one answered question: stats, the review box, the level that adjusts itself (to get about 8 out of 10 right), the streak and the trophies
function mtRecord(p,q,res,secs){ const Q=MT.q; p.k++; p.tot++; const w=mtWk(p); w[1]++; if(res===1){ p.ok++; w[0]++; } if(res>0){ p.oka++; w[2]++; } w[3]+=Math.min(60,secs);
  if(res!==1){ p.fl[q.key]=(p.fl[q.key]||0)+1; const ks=Object.keys(p.fl); if(ks.length>60){ ks.sort((x,y)=>p.fl[x]-p.fl[y]); delete p.fl[ks[0]]; } }
  const i=p.rv.findIndex(r=>r.key===q.key);
  if(res===1){ if(i>=0){ const r=p.rv[i]; r.bx++; if(r.bx>3) p.rv.splice(i,1); else r.due=p.k+[0,4,10,25][r.bx]; } }
  else if(i>=0){ p.rv[i].bx=0; p.rv[i].due=p.k+3; } else { p.rv.push({a:q.a,op:q.op,b:q.b,lv:q.lv,key:q.key,bx:0,due:p.k+3}); if(p.rv.length>30) p.rv.shift(); }
  if(Q.mode!=='test'&&q.lv===p.lv&&!q.rv){ p.win.push(res===1?1:0); if(p.win.length>12) p.win.shift(); p.d=clamp(p.d+(res===1?0.06:-0.24),0,1); const acc=mtAcc(p.win);
    if(p.d>=1&&p.win.length>=8&&acc>=0.85&&p.lv<6){ p.lv++; p.d=0.25; p.win=[]; Q.up=p.lv; } else if(p.d<=0&&p.win.length>=6&&acc<0.6&&p.lv>1){ p.lv--; p.d=0.7; p.win=[]; Q.down=p.lv; } }
  if(res===1){ p.st++; p.bs=Math.max(p.bs,p.st); } else p.st=0;
  if(p.oka>=50) prgTrophy('calculadora',p.nm); if(p.oka>=150) prgTrophy('matematico',p.nm); mtSave(); }

/* ---- the sessions: reto (4), deberes (3 seguidas), práctica (5), prueba de nivel (5) y supercarga (1) ---- */
function mtStart(mode){ const p=mtP(); if(!p){ mtSheet('jugar'); return; } $('mtSheet').hidden=true;
  MT.q={mode,p,i:0,n:mode==='reto'?4:mode==='sup'?1:5,hw:mode==='reto'&&MT.d.hw,cur:null,buf:'',st:'ask',tries:0,res:[],coins:0,run:0,seen:[],tl:1,t0:0,up:0,down:0};
  if(mode==='test'){ MT.q.tl=1; } mtNext(); }
function mtNext(){ const Q=MT.q; Q.cur=mtPick(Q.p,Q.mode); Q.seen.push(Q.cur.key); Q.buf=''; Q.st='ask'; Q.tries=0; Q.t0=performance.now(); mtCard(); }
function mtDone(){ const Q=MT.q; return Q.hw?(Q.res.length>=4&&Q.run>=3):Q.res.length>=Q.n; }
function mtKey(k){ const Q=MT.q; if(!Q||$('mtCard').hidden) return;
  if(Q.st==='show'||Q.st==='end'||Q.st==='offer'){ if(k==='ok'){ const b=$('mtNextB')||$('mtGo'); if(b) b.click(); } return; }
  if(Q.st!=='ask'&&Q.st!=='help') return;
  if(k==='del') Q.buf=Q.buf.slice(0,-1); else if(k==='ok'){ if(Q.buf!=='') mtCheck(); return; } else if(/^\d$/.test(k)&&Q.buf.length<3) Q.buf=(Q.buf==='0'?'':Q.buf)+k;
  mtAnsUI(); }
function mtCheck(){ const Q=MT.q, q=Q.cur, ok=+Q.buf===q.ans; Q.tries++; const secs=(performance.now()-Q.t0)/1000;
  if(Q.mode==='test'){ Q.res.push(ok?1:0); mtRecord(Q.p,q,ok?1:0,secs); if(ok) Q.best=Math.max(Q.best||0,q.lv); Q.tl=ok?(Q.i===0?3:Math.min(6,q.lv+1)):Math.max(1,q.lv-1);
    Q.i++; mtFlash(ok); MT.tm=setTimeout(()=>{ if(Q.i>=Q.n) mtEnd(); else mtNext(); },ok?650:900); return; }
  if(ok){ const res=Q.tries===1?1:2; Q.res.push(res); Q.run=res===1?Q.run+1:0; mtRecord(Q.p,q,res,secs); Q.i++;
    if(Q.mode!=='sup'){ const c=mtCoins(Q.p,Q.mode==='reto'?(res===1?3:1):(res===1?2:1)); Q.coins+=c; }
    Q.st='right'; mtFlash(true); blip('gold'); mtCard(); MT.tm=setTimeout(()=>{ if(mtDone()) mtEnd(); else mtNext(); },950); return; }
  mtFlash(false); blip('hit');
  if(Q.tries===1){ Q.st='help'; Q.buf=''; mtCard(); return; }
  Q.res.push(0); Q.run=0; mtRecord(Q.p,q,0,secs); Q.i++; Q.st='show'; mtCard(); }
function mtEnd(){ const Q=MT.q, p=Q.p; Q.st='end';
  if(Q.mode==='reto'){ p.rt++; MT.play=0; MT.d.x2=Date.now()+MT_X2*1000; const c=mtCoins(p,5); Q.coins+=c; prgTrophy('cuentas1',p.nm); }
  else if(Q.mode==='test'){ p.t=true; p.lv=clamp(Q.best||1,1,6); p.d=0.4; p.win=[]; }
  else if(Q.mode==='sup'){ const ok=Q.res[0]>0; if(ok){ MT.armed=true; if(PW.cd>0) PW.cd=0; } mtSave(); mtClose();
    if(ok) toast('⚡ Supercarga lista','Tu próximo poder dura el doble, va más rápido y se recarga al instante'); else tip('Esta vez no hay supercarga. Pulsa ⚡ y prueba con otra cuenta',2600); return; }
  mtSave();
  mtCard(); }
function mtClose(){ const Q=MT.q; if(Q&&Q.hw&&Q.st!=='end'&&Q.st!=='offer') return; clearTimeout(MT.tm); $('mtCard').hidden=true; MT.q=null; MT.lastClose=performance.now(); mtSave(); }
function mtBack(){ const Q=MT.q; if(!Q){ $('mtCard').hidden=true; return; } if(Q.hw&&Q.st!=='end') return; if(Q.st==='offer'){ mtSkip(); return; } mtClose(); }
function mtSkip(){ MT.play=0; MT.soon=0; mtClose(); tip('Reto saltado: el próximo llega en '+MT.d.iv+' minutos de juego',2600); }
// the offer at a natural pause (in homework mode it is not optional)
function mtOffer(){ const p=mtP(); if(!p) return; MT.q={mode:'reto',p,st:'offer',hw:MT.d.hw,i:0,n:4,res:[],seen:[],run:0,coins:0}; MT.calm=0; MT.idle=0; MT.soon=0; mtCard(); blip('gold'); }
function mtSupShown(){ return !!(WP.cuentas&&MT.d&&MT.d.sup&&mtP()&&!MT.armed&&!PW.sup&&typeof pwShown==='function'&&pwShown()&&S.mode==='walk'&&P.onGround&&$('mtCard').hidden); }
function mtSupAsk(){ if(!mtSupShown()) return; ensureAudio(); mtStart('sup'); }
// called by pwPress once a power has started: the supercharged power lasts twice as long, goes faster and recharges at once
function mtSupOn(){ if(!MT.armed||S.mode!=='pow'||!PW.k) return; MT.armed=false; PW.sup=true; if(PW.dur>0) PW.dur*=2; tip('⚡ ¡Supercarga! '+(PW.dur>0?'Dura '+Math.round(PW.dur)+' s, ':'')+'va más rápido y se recarga al instante',2600); }
function pwSupT(T){ if(!PW.sup) return T; T.sx=T.sx||Object.assign({},T,{vmax:T.vmax*1.3,acc:T.acc*1.25}); return T.sx; }

/* ---- the card: the question, the big number pad, the help when it goes wrong ---- */
function mtPadHTML(pre){ const K=(k,l,c)=>'<button class="mtk'+(c?' '+c:'')+'" id="'+pre+k+'" data-mk="'+k+'" aria-label="'+(k==='del'?'Borrar':k==='ok'?'Comprobar':k)+'">'+l+'</button>';
  return '<div class="mtpad">'+[7,8,9,4,5,6,1,2,3].map(n=>K(n,n)).join('')+K('del','⌫','del')+K(0,0)+K('ok','OK','ok')+'</div>'; }
function mtOpTxt(q){ return q.a+' '+(q.op==='+'?'+':'−')+' '+q.b; }
function mtHead(p){ return '<div class="mthead"><span class="mtav">'+p.av+'</span><b>'+esc(p.nm)+'</b><span class="note">Nivel '+p.lv+' · '+MT_LV[p.lv].n+'</span></div>'; }
function mtDots(Q){ if(Q.hw) return '<div class="mtdots" aria-label="'+Q.run+' bien seguidas de 3">'+[0,1,2].map(i=>'<i class="'+(i<Q.run?'ok':'')+'"></i>').join('')+'<span>'+Q.run+' de 3 bien seguidas</span></div>';
  return '<div class="mtdots" aria-label="Cuenta '+Math.min(Q.i+1,Q.n)+' de '+Q.n+'">'+Array.from({length:Q.n},(_,i)=>'<i class="'+(Q.res[i]===1?'ok':Q.res[i]===2?'ok2':Q.res[i]===0?'no':i===Q.i?'cur':'')+'"></i>').join('')+'<span>'+Math.min(Q.i+1,Q.n)+' de '+Q.n+'</span></div>'; }
function mtCard(){ const Q=MT.q, B=$('mtCardB'), p=Q.p; let h='';
  if(Q.st==='offer'){ const others=MT.d.ps.filter(x=>x.id!==p.id);
    h=mtHead(p)+(others.length?'<div class="qual">¿Juega otro? '+others.map(x=>'<button data-mtu="'+x.id+'">'+x.av+' '+esc(x.nm)+'</button>').join('')+'</div>':'')+
      '<h2>🔢 ¡Reto de cuentas!</h2>'+(Q.hw?'<p><b>Modo deberes:</b> acierta <b>3 cuentas seguidas</b> para seguir jugando. Si fallas, te ayudo y lo vuelves a intentar.</p>':'<p>Haz <b>4 cuentas</b> y ganas <b>monedas ×2 durante 10 minutos</b> en todo lo que hagas: karts, aros, circuitos, trofeos…</p>')+
      '<div class="row"><button class="btn primary" id="mtGo">¡Vamos!</button>'+(Q.hw?'':'<button class="btn" id="mtSkip">Ahora no</button>')+'</div>'+
      '<p class="note">'+(Q.hw?'Lo ha puesto un mayor en «Para padres».':'Saltarlo no quita nada: el siguiente reto llega en '+MT.d.iv+' minutos de juego.')+' Cada acierto da monedas (hasta '+MT_CAP+' al día por cuentas).</p>'; }
  else if(Q.st==='end') h=mtEndHTML();
  else { const q=Q.cur, t=Q.mode==='test'?'Prueba de nivel':Q.mode==='sup'?'⚡ Supercarga':Q.mode==='prac'?'Practicar':Q.hw?'Deberes de cuentas':'Reto de cuentas';
    const shown=Q.st==='show'||Q.st==='right', ans=shown?String(q.ans):Q.buf;
    h=mtHead(p)+'<div class="mtt"><b>'+t+'</b>'+(Q.mode==='sup'?'':mtDots(Q))+'</div>'+
      (Q.mode==='sup'?'<p class="note">Acierta y tu próximo poder dura el doble, va más rápido y se recarga al instante.</p>':'')+
      '<div class="mtq" aria-live="polite"><span>'+mtOpTxt(q)+' =</span><b id="mtAns" class="'+(Q.st==='right'?'ok':Q.st==='show'?'show':'')+'">'+(ans===''?'<i>?</i>':ans)+'</b></div>'+
      '<div class="mtmsg" id="mtMsg">'+mtMsg()+'</div>'+
      (Q.st==='help'||Q.st==='show'?'<div class="mthelp">'+mtHelpHTML(q,Q.st==='show')+'</div>':'')+
      (Q.st==='show'?'<div class="row"><button class="btn primary" id="mtNextB">'+(mtDone()?'Terminar':'Siguiente cuenta')+'</button></div>':mtPadHTML('mtK'))+
      '<div class="row mtfoot">'+(Q.hw?'':'<button class="btn small" id="mtQuit">'+(Q.mode==='sup'?'Ahora no':Q.mode==='test'?'Luego':'Dejarlo')+'</button>')+'</div>'; }
  B.innerHTML=h; B.className=h.includes('class="mtpad"')?'q':''; $('mtCard').hidden=false; mtWire(); }
function mtMsg(){ const Q=MT.q, q=Q.cur;
  if(Q.st==='right') return Q.tries===1?'¡Muy bien! '+(['🎉','⭐','🚀','🏆'][Q.i%4]):'¡Eso es! A la segunda también vale';
  if(Q.st==='help') return 'Casi. Mira la ayuda y prueba otra vez.';
  if(Q.st==='show') return 'Era <b>'+q.ans+'</b>. Mira cómo se hace: la próxima vez sale seguro. No pierdes nada.';
  if(Q.mode==='test') return Q.i===0?'5 cuentas para saber por dónde empiezas. Si no sabes una, pon lo que creas.':'Cuenta '+(Q.i+1)+' de 5';
  return q.rv?'🔁 Esta la repasamos: la fallaste otro día.':''; }
function mtAnsUI(){ const Q=MT.q, a=$('mtAns'); if(!a) return; a.innerHTML=Q.buf===''?'<i>?</i>':Q.buf; const ok=$('mtKok'); if(ok) ok.classList.toggle('ready',Q.buf!==''); }
function mtFlash(ok){ const c=$('mtCard'); c.classList.remove('mtok','mtno'); void c.offsetWidth; c.classList.add(ok?'mtok':'mtno'); }
function mtWire(){ const B=$('mtCardB'), on=(id,f)=>{ const e=$(id); if(e) e.onclick=f; };
  B.querySelectorAll('[data-mk]').forEach(b=>b.onclick=()=>{ ensureAudio(); mtKey(b.dataset.mk); });
  B.querySelectorAll('[data-mtu]').forEach(b=>b.onclick=()=>{ mtUse(b.dataset.mtu); MT.q.p=mtP(); mtCard(); });
  on('mtGo',()=>{ ensureAudio(); mtStart('reto'); }); on('mtSkip',mtSkip); on('mtQuit',mtClose);
  on('mtNextB',()=>{ if(mtDone()) mtEnd(); else mtNext(); }); on('mtEndB',mtClose); on('mtEndP',()=>{ mtClose(); mtSheet('progreso'); }); }
function mtEndHTML(){ const Q=MT.q, p=Q.p, n1=Q.res.filter(r=>r===1).length, nok=Q.res.filter(r=>r>0).length;
  let h=mtHead(p);
  if(Q.mode==='test') h+='<h2>¡Prueba hecha!</h2><p>Has acertado <b>'+n1+' de 5</b>. Empiezas en el <b>nivel '+p.lv+': '+MT_LV[p.lv].n.toLowerCase()+'</b>. El nivel se ajusta solo: si aciertas mucho, sube; si cuesta, baja un poco.</p>';
  else { h+='<h2>'+(Q.mode==='reto'?'¡Reto completado!':'¡Bien hecho!')+'</h2><p><b>'+nok+' de '+Q.res.length+'</b> bien'+(n1<nok?' ('+n1+' a la primera)':' a la primera')+(Q.coins?' · <b>+'+Q.coins+' monedas</b>':'')+'.</p>';
    if(Q.mode==='reto') h+='<p class="mtx2big">🪙×2 · monedas dobles durante 10 minutos</p>';
    if(Q.up) h+='<p>⬆️ <b>¡Subes al nivel '+Q.up+'!</b> Ahora: '+MT_LV[Q.up].n.toLowerCase()+'.</p>'; if(Q.down) h+='<p class="note">Bajamos al nivel '+Q.down+' para practicar un poco más.</p>';
    if(p.cc>=MT_CAP) h+='<p class="note">Hoy ya has ganado las '+MT_CAP+' monedas de las cuentas; los aciertos siguen contando para tu barra.</p>'; }
  h+=mtBarHTML(p)+'<div class="row"><button class="btn primary" id="mtEndB">Seguir jugando</button><button class="btn small" id="mtEndP">Mi progreso</button></div>'; return h; }

/* ---- the help: balls to count (up to 10), the number line with jumps (up to 20) and tens first, then units (up to 100) ---- */
function mtHops(q){ const s=q.op==='+'?1:-1, H=[]; let x=q.a; const to=y=>{ if(y!==x){ H.push([x,y]); x=y; } };
  if(q.lv>=5||q.a>20||q.b>20){ const tb=Math.floor(q.b/10)*10, ub=q.b%10; to(x+s*tb); const y=x+s*ub, ten=s>0?Math.ceil((x+1)/10)*10:Math.floor((x-1)/10)*10; if(ub&&(s>0?y>ten:y<ten)&&x%10!==0) to(ten); to(y); }
  else { const y=q.ans; if(s>0&&x<10&&y>10) to(10); else if(s<0&&x>10&&y<10) to(10); to(y); }
  return H; }
function mtHelpHTML(q,reveal){ const small=q.a<=10&&q.b<=10&&q.ans<=10; let svg='', leg='', txt='';
  if(small){ const n=q.op==='+'?q.a+q.b:q.a, r=11, sp=27, rows=Math.ceil(n/5)||1, Wd=5*sp+10, Hd=rows*sp+6; let c='';
    for(let i=0;i<n;i++){ const x=8+r+(i%5)*sp, y=6+r+Math.floor(i/5)*sp, sec=q.op==='+'?i>=q.a:i>=q.a-q.b;
      c+='<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+(q.op==='+'?(sec?'#f08a24':'#2f80ed'):(sec?'#d4d8dc':'#2f80ed'))+'"/>'; if(q.op!=='+'&&sec) c+='<path d="M'+(x-7)+' '+(y-7)+'L'+(x+7)+' '+(y+7)+'M'+(x+7)+' '+(y-7)+'L'+(x-7)+' '+(y+7)+'" stroke="#d6442a" stroke-width="3"/>'; }
    svg='<svg viewBox="0 0 '+Wd+' '+Hd+'" width="'+Wd+'" height="'+Hd+'" role="img" aria-label="Bolas para contar">'+c+'</svg>';
    leg=q.op==='+'?'<span><i style="background:#2f80ed"></i>'+q.a+' azules</span><span><i style="background:#f08a24"></i>'+q.b+' naranjas que sumas</span>':'<span><i style="background:#2f80ed"></i>las que quedan</span><span><i style="background:#d4d8dc"></i>✕ las '+q.b+' que quitas</span>';
    txt=q.op==='+'?'Cuenta todas las bolas: primero las '+q.a+' azules y sigue con las naranjas.':'Había '+q.a+' bolas y quitas '+q.b+'. Cuenta las azules que quedan.'; }
  else { const H=mtHops(q), pts=[q.a,q.ans].concat(...H); let lo=Math.min(...pts), hi=Math.max(...pts);
    if(q.lv<=4&&hi<=20){ lo=0; hi=20; } else { lo=Math.floor(lo/10)*10; hi=Math.ceil(hi/10)*10; if(hi-lo<20) hi=lo+20; }
    const Wd=340, X=v=>14+(v-lo)/(hi-lo)*(Wd-28), y0=78, step=hi-lo<=20?1:hi-lo<=50?2:5; let c='<line x1="10" y1="'+y0+'" x2="'+(Wd-10)+'" y2="'+y0+'" stroke="#16231b" stroke-width="2"/>';
    for(let v=lo;v<=hi;v+=1){ const ten=v%10===0; if(!ten&&(v-lo)%step) continue; c+='<line x1="'+X(v)+'" y1="'+(y0-(ten?7:4))+'" x2="'+X(v)+'" y2="'+(y0+(ten?7:4))+'" stroke="#16231b" stroke-width="'+(ten?2:1)+'"/>'; if(ten||hi-lo<=20&&v%5===0) c+='<text x="'+X(v)+'" y="'+(y0+20)+'" text-anchor="middle" font-size="11" fill="#59665d">'+v+'</text>'; }
    H.forEach((h,i)=>{ const x1=X(h[0]), x2=X(h[1]), mx=(x1+x2)/2, ht=Math.min(46,14+Math.abs(x2-x1)*0.32), d=h[1]-h[0];
      c+='<path d="M'+x1+' '+(y0-3)+' Q'+mx+' '+(y0-3-ht*2)+' '+x2+' '+(y0-3)+'" fill="none" stroke="'+(i%2?'#8e44ad':'#f08a24')+'" stroke-width="2.5"/><path d="M'+x2+' '+(y0-3)+' l'+(d>0?-7:7)+' -6 M'+x2+' '+(y0-3)+' l'+(d>0?-1:1)+' -9" stroke="'+(i%2?'#8e44ad':'#f08a24')+'" stroke-width="2.5" fill="none"/>'+
        '<text x="'+mx+'" y="'+(y0-6-ht)+'" text-anchor="middle" font-size="13" font-weight="800" fill="'+(i%2?'#8e44ad':'#c76a12')+'">'+(d>0?'+':'−')+Math.abs(d)+'</text>'; });
    c+='<circle cx="'+X(q.a)+'" cy="'+y0+'" r="6" fill="#2f80ed"/><text x="'+X(q.a)+'" y="'+(y0+34)+'" text-anchor="middle" font-size="12" font-weight="800" fill="#2f80ed">'+q.a+'</text>';
    c+='<circle cx="'+X(q.ans)+'" cy="'+y0+'" r="6" fill="'+(reveal?'#2e8b3d':'#fff')+'" stroke="#2e8b3d" stroke-width="2"/><text x="'+X(q.ans)+'" y="'+(y0+34)+'" text-anchor="middle" font-size="12" font-weight="800" fill="#2e8b3d">'+(reveal?q.ans:'?')+'</text>';
    svg='<svg viewBox="0 0 '+Wd+' 118" width="100%" style="max-width:'+Wd+'px" role="img" aria-label="Recta numérica con los saltos">'+c+'</svg>';
    leg='<span><i style="background:#2f80ed"></i>empiezas en '+q.a+'</span><span><i style="background:#f08a24"></i>saltos que '+(q.op==='+'?'sumas (a la derecha)':'restas (a la izquierda)')+'</span><span><i style="background:#2e8b3d"></i>'+(reveal?'el resultado':'¿dónde acabas?')+'</span>';
    const hs=H.map(h=>(h[1]>h[0]?'+':'−')+Math.abs(h[1]-h[0]));
    if(q.lv>=5||q.a>20||q.b>20){ const tb=Math.floor(q.b/10)*10; txt=(tb?'Primero las decenas: '+q.a+(q.op==='+'?' + ':' − ')+tb+' = '+(q.op==='+'?q.a+tb:q.a-tb)+'. ':'')+'Luego las unidades'+(H.length>(tb?2:1)?', parando en la decena redonda':'')+': '+hs.slice(tb?1:0).join(' y ')+(reveal?' → '+q.ans:'')+'.'+(q.op==='+'?' Si las unidades pasan de 10, te llevas una decena (la llevada).':' Si no hay unidades suficientes, pides una decena prestada (llevando).'); }
    else txt='Empieza en el '+q.a+' y salta '+hs.join(' y luego ')+(H.length>1?' (primero hasta el 10, que es más fácil)':'')+(reveal?': llegas al '+q.ans:'')+'.'; }
  return '<div class="mtfig">'+svg+'</div><div class="mtleg">'+leg+'</div><p>'+txt+'</p>'; }

/* ---- the bar towards the trophies, and the progress of one child ---- */
function mtBarHTML(p){ const v=p.oka, M=150, pc=Math.min(100,v/M*100), m1=50/M*100;
  return '<div class="mtbar" aria-label="'+v+' aciertos de 150"><div class="mtbarT"><b>Hacia el trofeo «Matemático»</b><span>'+Math.min(v,M)+' / '+M+' aciertos</span></div><div class="mtbarB"><i style="width:'+pc+'%"></i><em style="left:'+m1+'%" class="'+(v>=50?'on':'')+'" title="50: color «Calculadora»">🧮</em><em style="left:100%" class="'+(v>=M?'on':'')+'" title="150: capa de mago">🧙</em></div>'+
    '<div class="note">🧮 a los 50: color dorado «Calculadora» para el kart, la moto de agua y el coche volador · 🧙 a los 150: trofeo «Matemático» y capa de mago. No se compran: solo se ganan con cuentas.</div></div>'; }
function mtProgHTML(){ const p=mtP(); if(!p) return '<p>Primero crea tu perfil en la pestaña <b>Jugar</b>.</p>';
  const w=mtWk(p), x2=mtX2On()?Math.ceil((MT.d.x2-Date.now())/60000):0, due=p.rv.filter(r=>r.due<=p.k).length;
  return mtHead(p)+'<div class="mtstats"><div><b>'+p.lv+'</b><span>Nivel: '+MT_LV[p.lv].n.toLowerCase()+'</span><i class="mtlvb"><u style="width:'+Math.round(p.d*100)+'%"></u></i></div><div><b>'+p.oka+'</b><span>cuentas bien en total</span></div><div><b>'+w[2]+'</b><span>bien hoy</span></div><div><b>'+(p.cd===mtDay()?p.cc:0)+'/'+MT_CAP+'</b><span>monedas de cuentas hoy</span></div><div><b>'+p.rt+'</b><span>retos completados</span></div><div><b>'+p.bs+'</b><span>mejor racha seguida</span></div></div>'+
    '<p class="note"><b>Cómo se lee:</b> la barrita bajo el nivel es lo que llevas dentro de él; cuando se llena y aciertas casi todo, subes. '+(due?due+' cuenta'+(due>1?'s':'')+' para repasar te saldrá'+(due>1?'n':'')+' pronto. ':'')+(x2?'<b>Monedas ×2:</b> te quedan '+x2+' min.':'')+'</p>'+mtBarHTML(p); }

/* ---- the sheet «Cuentas»: Jugar, Mi progreso, Para padres y Cómo funciona ---- */
function mtSheet(tab){ if(!WP.cuentas) return; try{ closeModal(); }catch(e){} MT.tab=tab||MT.tab||'jugar'; if(MT.tab!=='padres'){ MT.pinMode=''; }
  const T=MT.tab, B=$('mtBody');
  let h='<h2>🔢 Cuentas</h2><div class="tabs">'+[['jugar','🎮 Jugar'],['progreso','⭐ Mi progreso'],['padres','🔒 Para padres'],['como','❓ Cómo funciona']].map(t=>'<button data-mtt="'+t[0]+'" class="'+(T===t[0]?'on':'')+'">'+t[1]+'</button>').join('')+'</div>';
  h+=T==='jugar'?mtPlayHTML():T==='progreso'?mtProgHTML():T==='padres'?mtParentHTML():mtHowHTML();
  h+='<div class="row" style="margin-top:12px"><button class="btn small" id="mtClose">Cerrar</button></div>'; B.innerHTML=h; $('mtSheet').hidden=false; mtSheetWire(); }
function mtPlayHTML(){ const p=mtP(), ps=MT.d.ps; let h='';
  if(ps.length) h+='<h3>¿Quién juega?</h3><div class="mtprofs">'+ps.map(x=>'<button class="mtprof'+(p&&x.id===p.id?' on':'')+'" data-mtp="'+x.id+'"><span>'+x.av+'</span><b>'+esc(x.nm)+'</b><small>Nivel '+x.lv+'</small></button>').join('')+'</div>';
  else h+='<p>Para aprender <b>sumas y restas</b> jugando: cada ' +MT.d.iv+' minutos, en una pausa, un reto de 4 cuentas da <b>monedas ×2</b>, y con un disfraz una cuenta <b>supercarga</b> tu poder. Crea tu perfil para empezar.</p>';
  h+='<h3>'+(ps.length?'Nuevo perfil':'Crea tu perfil')+'</h3><div class="row"><input id="mtName" maxlength="14" placeholder="Tu nombre" autocomplete="off"></div><div class="mtavs">'+MT_AV.map(a=>'<button data-mta="'+a+'" class="'+(MT.newAv===a?'on':'')+'" aria-label="Avatar '+a+'">'+a+'</button>').join('')+'</div>'+
    '<div class="row"><button class="btn'+(ps.length?' small':' primary')+'" id="mtMk">Crear y hacer la prueba de nivel</button></div><p class="note">La prueba son 5 cuentas para saber por dónde empiezas; no hace falta decir la edad.</p>';
  if(p){ h+='<h3>'+p.av+' '+esc(p.nm)+'</h3><div class="row">'+(p.t?'':'<button class="btn primary" id="mtTest">Hacer la prueba de nivel</button>')+'<button class="btn'+(p.t?' primary':'')+'" id="mtPrac">Practicar 5 cuentas</button></div>';
    h+='<p class="note">'+(MT.d.on?'Próximo reto (monedas ×2) en unos <b>'+mtMin()+' min</b> de juego, en cuanto hagas una pausa: al bajarte de algo, al aterrizar o al acabar un poder o una carrera.':'Los retos están apagados (se encienden en «Para padres»).')+' Practicar da monedas (hasta '+MT_CAP+' al día por cuentas) y cuenta para tu barra.</p>';
    h+='<div class="qual">Botón ⚡ Supercarga junto a Poder <button data-mts="1" class="'+(MT.d.sup?'on':'')+'">Sí</button><button data-mts="0" class="'+(MT.d.sup?'':'on')+'">No</button></div>'; }
  return h; }
function mtHowHTML(){ return '<h3>Qué es</h3><p>Una forma de aprender <b>sumas y restas</b> sin dejar de jugar. Las cuentas salen solo en <b>pausas</b> (al bajarte del helicóptero, la moto o el coche, al aterrizar, al acabar un poder, una carrera o los aros, o si te quedas quieto un rato): nunca en plena carrera, en el aire, en el pilla-pilla ni en el golf. <b>Fallar nunca quita nada.</b></p>'+
  '<h3>Cómo se juega</h3><ol><li>Elige tu perfil en <b>Jugar</b> (cada niño el suyo: la tableta se comparte).</li><li>Escribe el resultado con el <b>teclado grande</b> y pulsa <b>OK</b> (con mando: cruceta y ✕; con teclado: los números y Intro).</li><li>Si fallas, sale una <b>ayuda</b> (bolas para contar o la recta numérica) y lo intentas otra vez. Si tampoco, te enseña el resultado y cómo se hace.</li></ol>'+
  '<h3>Premios</h3><ul><li><b>Reto de cuentas</b> (cada '+MT.d.iv+' min de juego): 4 cuentas → <b>monedas ×2 durante 10 minutos</b> (insignia 🪙×2 arriba con la cuenta atrás). Se puede saltar, sin premio.</li><li><b>Monedas</b> por acierto: 3 a la primera y 1 a la segunda en el reto (5 más al terminarlo), 2 en la práctica; como mucho '+MT_CAP+' al día por niño. El ×2 dobla lo que ganas jugando, no las de las cuentas.</li><li><b>Supercarga ⚡</b>: con un disfraz de Halloween puesto, el botón ⚡ junto a Poder (R3 en el mando, tecla K) te pone una cuenta; si aciertas, el poder se recarga ya y el siguiente dura el doble, va más rápido y se recarga al instante.</li><li><b>Barra</b> hacia el trofeo «Matemático»: a los 50 aciertos, el color dorado «Calculadora» (kart, moto de agua y coche volador); a los 150, el trofeo y la capa de mago. Se ponen en la tienda (Premios) y en el garaje.</li></ul>'+
  '<h3>Para padres</h3><ul><li><b>PIN</b>: protege la pestaña «Para padres». Si lo olvidas, «He olvidado el PIN» pide una multiplicación de dos cifras (para mayores) y lo quita sin borrar nada más.</li><li><b>Modo deberes</b>: el reto no se puede saltar ni cerrar y hay que acertar 3 cuentas seguidas para seguir jugando. Eliges cada cuántos minutos sale.</li><li><b>Cómo leer el panel</b>: «a la primera» es el porcentaje de cuentas bien sin ayuda; lo normal es rondar el 80 %, porque el nivel se ajusta para eso. «Minutos» separa el tiempo jugando del de hacer cuentas. «Más falladas» son las cuentas que más le cuestan, con las veces entre paréntesis, y «Para repasar», cuántas falladas esperan a volver a salir. El nivel se puede poner a mano con los botones 1 a 6.</li></ul>'+
  '<h3>Los niveles</h3><ol>'+MT_LV.slice(1).map(l=>'<li>'+l.n+'</li>').join('')+'</ol><p class="note">Se ajustan solos para acertar unas 8 de cada 10: si aciertas casi todas sube la dificultad y luego el nivel; si cuesta, baja. A veces sale una del nivel anterior para no olvidarla, y las falladas vuelven más tarde (repaso).</p>'+
  '<h3>Glosario</h3><dl class="gl">'+mtGlossHTML()+'</dl>'; }
function mtGuideHTML(){ return WP.cuentas?'<li><b>Cuentas</b> (botón 🔢 del inicio o «Cuentas» del menú): sumas y restas para los peques con su perfil y su nivel (6 niveles que se ajustan solos). Cada '+((MT.d&&MT.d.iv)||13)+' min de juego, en una pausa (nunca en carrera, en el aire, en el pilla-pilla ni en el golf), un <b>reto</b> de 4 cuentas da <b>monedas ×2 durante 10 minutos</b>; con un disfraz, el botón <b>⚡</b> junto a Poder pone una cuenta que <b>supercarga</b> el poder. Si fallas, ayuda con bolas o con la recta numérica y otro intento; fallar no quita nada. Los padres tienen <b>modo deberes</b> y un panel con PIN.</li>':''; }
function mtGlossHTML(){ return WP.cuentas?'<dt>Suma</dt><dd>Juntar dos cantidades: 7 + 5 = 12.</dd><dt>Resta</dt><dd>Quitar una cantidad a otra: 12 − 5 = 7.</dd><dt>Llevada</dt><dd>Cuando las unidades pasan de 10 se juntan en una decena que «te llevas» (38 + 25: 8 + 5 = 13, te llevas 1). En la resta, «llevando» es pedir una decena prestada.</dd><dt>Recta numérica</dt><dd>Una línea con los números en orden; sumar es saltar a la derecha y restar, a la izquierda.</dd><dt>Nivel</dt><dd>Del 1 (sumas hasta 10) al 6 (restas llevando hasta 100); se ajusta solo para acertar unas 8 de cada 10.</dd><dt>Prueba de nivel</dt><dd>5 cuentas al crear el perfil que dicen por qué nivel empezar.</dd><dt>Repaso</dt><dd>Las cuentas falladas vuelven más tarde, cada vez más espaciadas, hasta que salen bien tres veces.</dd><dt>Reto de cuentas</dt><dd>4 cuentas en una pausa del juego que dan monedas ×2 durante 10 minutos.</dd><dt>Monedas ×2</dt><dd>Lo que ganas jugando vale el doble mientras se ve la insignia 🪙×2.</dd><dt>Tope diario</dt><dd>Como mucho '+MT_CAP+' monedas al día por cuentas para cada niño.</dd><dt>Supercarga</dt><dd>Una cuenta antes de usar el poder del disfraz: si aciertas, dura el doble, va más rápido y se recarga al instante.</dd><dt>Modo deberes</dt><dd>Opción de los padres (con PIN): el reto no se puede saltar y hay que acertar 3 seguidas para seguir jugando.</dd>':''; }

/* ---- parents: a 4-digit PIN, settings, homework mode and the panel of each child ---- */
function mtParentHTML(){ const d=MT.d;
  if(MT.pinMode) return '<h3>'+(MT.pinMode==='set'?'Elige un PIN de 4 cifras':MT.pinMode==='set2'?'Repite el PIN':MT.pinMode==='lost'?'Para mayores: ¿cuánto es '+MT.gate[0]+' × '+MT.gate[1]+'?':'Escribe el PIN de padres')+'</h3>'+(MT.pinMode==='lost'?'<p class="note">Si aciertas, se quita el PIN y entras; luego puedes poner uno nuevo. No se borra nada más.</p>':'')+'<div class="mtpin">'+[0,1,2,3].map(i=>'<i class="'+(i<MT.pin.length?'on':'')+'"></i>').join('')+'</div>'+mtPadHTML('mtP')+'<div class="row"><button class="btn small" id="mtPinX">Cancelar</button></div>';
  if(d.pin&&!MT.unlock) return '<p>Esta pestaña es para los mayores: ajustes, <b>modo deberes</b> y el panel de cada niño.</p><div class="row"><button class="btn primary" id="mtPinGo">Escribir el PIN</button></div><p class="note">¿Lo has olvidado? <button class="btn small" id="mtPinLost">He olvidado el PIN</button> Te pide una multiplicación de mayores y quita el PIN sin borrar nada.</p>';
  let h=(d.pin?'':'<p class="note"><b>Sin PIN:</b> cualquiera puede cambiar esto. Pon uno para el modo deberes.</p>')+'<h3>Ajustes</h3>'+
    '<div class="qual">Retos de cuentas <button data-mto="on1" class="'+(d.on?'on':'')+'">Sí</button><button data-mto="on0" class="'+(d.on?'':'on')+'">No</button></div>'+
    '<div class="qual">Cada '+MT_IVS.map(v=>'<button data-mto="iv'+v+'" class="'+(d.iv===v?'on':'')+'">'+v+' min</button>').join('')+'</div>'+
    '<div class="qual">Modo deberes <button data-mto="hw1" class="'+(d.hw?'on':'')+'">Sí</button><button data-mto="hw0" class="'+(d.hw?'':'on')+'">No</button></div>'+
    '<p class="note"><b>Modo deberes:</b> el reto no se puede saltar y hay que acertar 3 cuentas seguidas para seguir jugando (con ayuda si falla). Necesita PIN.</p>'+
    '<div class="row"><button class="btn small" id="mtPinSet">'+(d.pin?'Cambiar el PIN':'Poner un PIN')+'</button>'+(d.pin?'<button class="btn small" id="mtLock">Bloquear</button>':'')+'</div>';
  h+='<h3>Panel por niño</h3>'+(d.ps.length?d.ps.map(mtPanelHTML).join(''):'<p class="note">Aún no hay perfiles.</p>');
  return h; }
function mtPanelHTML(p){ const ks=[]; for(let i=6;i>=0;i--){ const t=new Date(); t.setDate(t.getDate()-i); ks.push(mtDay(t)); }
  const rows=ks.map(k=>p.wk[k]||[0,0,0,0,0]), wk=rows.reduce((a,r)=>[a[0]+r[0],a[1]+r[1],a[2]+r[2],a[3]+r[3],a[4]+r[4]],[0,0,0,0,0]), mx=Math.max(5,...rows.map(r=>r[1]));
  const bw=34, Hh=90, svg='<svg viewBox="0 0 '+(ks.length*bw+8)+' '+(Hh+30)+'" width="100%" style="max-width:300px" role="img" aria-label="Cuentas de los últimos 7 días">'+rows.map((r,i)=>{ const x=6+i*bw, h1=r[1]/mx*Hh, h0=r[0]/mx*Hh, dd=new Date(ks[i]+'T12:00:00');
      return '<rect x="'+x+'" y="'+(Hh-h1+4)+'" width="'+(bw-10)+'" height="'+h1+'" rx="3" fill="#d7ddd2"/><rect x="'+x+'" y="'+(Hh-h0+4)+'" width="'+(bw-10)+'" height="'+h0+'" rx="3" fill="#2e8b3d"/>'+(r[1]?'<text x="'+(x+(bw-10)/2)+'" y="'+(Hh-h1)+'" text-anchor="middle" font-size="10" fill="#16231b">'+r[1]+'</text>':'')+'<text x="'+(x+(bw-10)/2)+'" y="'+(Hh+20)+'" text-anchor="middle" font-size="10" fill="#59665d">'+['D','L','M','X','J','V','S'][dd.getDay()]+'</text>'; }).join('')+'</svg>';
  const fails=Object.keys(p.fl).sort((a,b)=>p.fl[b]-p.fl[a]).slice(0,5), acc=p.tot?Math.round(p.ok/p.tot*100):0, m=s=>Math.round(s/60);
  return '<div class="mtpanel"><div class="mthead"><span class="mtav">'+p.av+'</span><b>'+esc(p.nm)+'</b><span class="note">'+p.tot+' cuentas · '+acc+' % a la primera</span></div>'+
    '<div class="qual">Nivel '+[1,2,3,4,5,6].map(v=>'<button data-mtl="'+p.id+':'+v+'" class="'+(p.lv===v?'on':'')+'" title="'+MT_LV[v].n+'">'+v+'</button>').join('')+'<span>'+MT_LV[p.lv].n+'</span></div>'+
    '<div class="tablewrap"><table class="card mp"><tbody><tr><td class="nm">Esta semana</td><td>'+wk[1]+' cuentas, '+wk[0]+' a la primera ('+(wk[1]?Math.round(wk[0]/wk[1]*100):0)+' %)</td></tr><tr><td class="nm">Minutos</td><td>'+m(wk[4])+' jugando · '+m(wk[3])+' haciendo cuentas</td></tr><tr><td class="nm">Retos completados</td><td>'+p.rt+'</td></tr><tr><td class="nm">Más falladas</td><td>'+(fails.length?fails.map(k=>k.replace('-',' − ').replace('+',' + ')+' ('+p.fl[k]+')').join(' · '):'ninguna todavía')+'</td></tr><tr><td class="nm">Para repasar</td><td>'+p.rv.length+'</td></tr></tbody></table></div>'+
    '<div class="mtfig">'+svg+'</div><div class="mtleg"><span><i style="background:#d7ddd2"></i>cuentas hechas cada día</span><span><i style="background:#2e8b3d"></i>acertadas a la primera</span></div>'+
    '<p class="note"><b>Cómo se lee:</b> cada columna es un día (el último es hoy); la parte verde son las acertadas a la primera y el número de arriba, las hechas. Lo normal es acertar unas 8 de cada 10: si pasa de 9, el nivel sube solo; si baja de 6, baja. «Más falladas» dice qué cuentas cuestan (entre paréntesis, las veces).</p>'+
    '<div class="row"><button class="btn small" data-mtd="'+p.id+'">'+(MT.del===p.id?'¿Seguro? Toca otra vez':'Borrar este perfil')+'</button></div></div>'; }
function mtGate(){ return [mtR(32,99),mtR(32,99)]; }
function mtPinKey(k){ if(!MT.pinMode) return; if(k==='del'){ MT.pin=MT.pin.slice(0,-1); mtSheet('padres'); return; } if(k==='ok'&&MT.pin.length<4) return; if(/^\d$/.test(k)&&MT.pin.length<4) MT.pin+=k;
  if(MT.pin.length===4||k==='ok'){ const v=MT.pin; MT.pin='';
    if(MT.pinMode==='ask'){ if(v===MT.d.pin){ MT.unlock=true; MT.pinMode=''; } else toast('PIN incorrecto','Prueba otra vez'); }
    else if(MT.pinMode==='lost'){ if(+v===MT.gate[0]*MT.gate[1]){ MT.d.pin=''; MT.unlock=true; MT.pinMode=''; mtSave(); toast('PIN quitado','Pon uno nuevo con «Poner un PIN»'); } else { MT.gate=mtGate(); toast('No es correcto','Prueba con esta otra'); } }
    else if(MT.pinMode==='set'){ MT.pin1=v; MT.pinMode='set2'; }
    else if(MT.pinMode==='set2'){ if(v===MT.pin1){ MT.d.pin=v; MT.unlock=true; MT.pinMode=''; mtSave(); toast('PIN guardado','Pídelo para entrar en «Para padres»'); } else { MT.pinMode='set'; toast('No coinciden','Elige el PIN otra vez'); } } }
  mtSheet('padres'); }
function mtSheetWire(){ const B=$('mtBody'), on=(id,f)=>{ const e=$(id); if(e) e.onclick=f; };
  B.querySelectorAll('[data-mtt]').forEach(b=>b.onclick=()=>mtSheet(b.dataset.mtt)); on('mtClose',()=>{ $('mtSheet').hidden=true; MT.unlock=false; MT.pinMode=''; MT.del=0; });
  B.querySelectorAll('[data-mtp]').forEach(b=>b.onclick=()=>{ mtUse(b.dataset.mtp); mtSheet('jugar'); });
  B.querySelectorAll('[data-mta]').forEach(b=>b.onclick=()=>{ MT.newAv=b.dataset.mta; const nm=$('mtName').value; mtSheet('jugar'); $('mtName').value=nm; });
  on('mtMk',()=>{ const nm=($('mtName').value||'').trim(); if(!nm){ toast('Escribe tu nombre','Así cada niño tiene su perfil'); $('mtName').focus(); return; } mtNew(nm,MT.newAv||undefined); MT.newAv=''; mtStart('test'); });
  on('mtTest',()=>mtStart('test')); on('mtPrac',()=>mtStart('prac'));
  B.querySelectorAll('[data-mts]').forEach(b=>b.onclick=()=>{ MT.d.sup=b.dataset.mts==='1'; mtSave(); mtSheet('jugar'); });
  B.querySelectorAll('[data-mto]').forEach(b=>b.onclick=()=>{ const v=b.dataset.mto; if(v==='on1'||v==='on0') MT.d.on=v==='on1'; else if(v.startsWith('iv')) MT.d.iv=+v.slice(2);
    else if(v==='hw1'){ if(!MT.d.pin){ toast('Primero un PIN','Sin PIN los peques podrían quitar el modo deberes'); MT.pinMode='set'; MT.pin=''; } else MT.d.hw=true; } else if(v==='hw0') MT.d.hw=false; mtSave(); mtSheet('padres'); });
  B.querySelectorAll('[data-mtl]').forEach(b=>b.onclick=()=>{ const [id,v]=b.dataset.mtl.split(':'), p=MT.d.ps.find(x=>x.id===id); if(p){ p.lv=+v; p.d=0.3; p.win=[]; p.t=true; mtSave(); } mtSheet('padres'); });
  B.querySelectorAll('[data-mtd]').forEach(b=>b.onclick=()=>{ const id=b.dataset.mtd; if(MT.del===id){ mtDel(id); MT.del=0; } else MT.del=id; mtSheet('padres'); });
  on('mtPinGo',()=>{ MT.pinMode='ask'; MT.pin=''; mtSheet('padres'); }); on('mtPinLost',()=>{ MT.pinMode='lost'; MT.pin=''; MT.gate=mtGate(); mtSheet('padres'); }); on('mtPinSet',()=>{ MT.pinMode='set'; MT.pin=''; mtSheet('padres'); }); on('mtPinX',()=>{ MT.pinMode=''; MT.pin=''; mtSheet('padres'); });
  on('mtLock',()=>{ MT.unlock=false; mtSheet('padres'); });
  B.querySelectorAll('[data-mk]').forEach(b=>b.onclick=()=>mtPinKey(b.dataset.mk)); }

/* ---- every frame: play time, the natural pauses, the ×2 badge, the ⚡ button and the «Calculadora» colour of the vehicle you ride ---- */
function mtCalmOK(){ return S.mode==='walk'&&P.onGround&&!P.swim&&!raceNow()&&!(typeof tgPlaying==='function'&&tgPlaying())&&S.g.hole<0&&!gpRoot()&&!HX.sit&&!S.overlay&&!S.tour&&$('modal').hidden&&($('tsCard')?$('tsCard').hidden:true)&&performance.now()-MT.lastClose>4000&&!document.body.classList.contains('race'); }
function mtTick(dt){ if(!WP.cuentas||!MT.d) return; const m=S.mode, p=mtP();
  mtX2UI(); mtSupUI(); mtVehTick();
  if(!p||!MT.d.on){ MT.pm=m; return; }
  if(m!=='menu'&&m!=='drone'&&m!=='loading'){ MT.play+=dt; mtWk(p)[4]+=dt; MT.sv+=dt; if(MT.sv>15){ MT.sv=0; mtSave(); } }
  const rn=raceNow(); if(MT.rn&&!rn) MT.soon=1; MT.rn=rn;
  if(!$('mtCard').hidden){ MT.pm=m; return; }
  if(MT.pm&&MT.pm!==m&&m==='walk'&&MT_FROM.includes(MT.pm)) MT.calm=1.2;
  MT.pm=m;
  if(m==='walk'&&P.onGround&&Math.hypot(inp.mx,inp.my)<0.05&&Math.hypot(P.vx||0,P.vz||0)<0.5) MT.idle+=dt; else MT.idle=0;
  const due=MT.play>=MT.d.iv*60; if(!due) return;
  if(MT.calm>0){ MT.calm-=dt; if(MT.calm<=0&&mtCalmOK()) mtOffer(); return; }
  if(mtCalmOK()&&MT.idle>=(MT.soon||MT.play-MT.d.iv*60>150?3:9)) mtOffer(); }
function mtX2UI(){ const b=$('mtX2'); if(!b) return; const on=mtX2On(); let t=''; if(on){ const s=Math.ceil((MT.d.x2-Date.now())/1000); t='🪙×2 · '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
  if(MT.uiX!==t){ MT.uiX=t; b.textContent=t; b.hidden=!on; } }
function mtSupUI(){ const b=$('bSup'), show=mtSupShown(); if(b&&b.hidden===show) b.hidden=!show; const bp=$('bPow'), sup=!!(MT.armed||PW.sup); if(bp&&bp.classList.contains('sup')!==sup) bp.classList.toggle('sup',sup); }
function mtVehTick(){ const on=PRG.eq.vehiculo==='v-calc'&&prgOwned(prgItem('v-calc')), cur=[on?P.jet:null,on?P.fly:null].filter(Boolean);
  for(const V of MT.veh.slice()) if(!cur.includes(V)) mtPaint(V,false); for(const V of cur) if(!MT.veh.includes(V)) mtPaint(V,true); }
function mtPaint(V,on){ if(!V||!V.g||!V.col) return; const C0=Cc(V.col), c0=C0.getHex(), G=Cc(MT_GOLD);
  V.g.traverse(o=>{ if(!o.isMesh) return; const ca=o.geometry&&o.geometry.attributes&&o.geometry.attributes.color, U=o.geometry&&o.geometry.userData;
    // merged bodies (mergeGroup) carry the colour in the vertices
    if(ca&&o.material&&o.material.vertexColors){ const a=ca.array; if(on){ if(!U.mt0){ U.mt0=a.slice(); let n=0; for(let i=0;i<a.length;i+=3) if(Math.abs(a[i]-C0.r)<2e-4&&Math.abs(a[i+1]-C0.g)<2e-4&&Math.abs(a[i+2]-C0.b)<2e-4){ a[i]=G.r; a[i+1]=G.g; a[i+2]=G.b; n++; } if(n) ca.needsUpdate=true; else delete U.mt0; } }
      else if(U.mt0){ a.set(U.mt0); ca.needsUpdate=true; delete U.mt0; } return; }
    for(const m of (Array.isArray(o.material)?o.material:[o.material])){ if(!m||!m.color) continue;
    if(on){ if(m.userData.mt0===undefined&&m.color.getHex()===c0){ m.userData.mt0=c0; m.color.copy(G); if(m.emissive){ m.userData.mte=m.emissive.getHex(); m.emissive.copy(Cc('#5a3e00')); } } }
    else if(m.userData.mt0!==undefined){ m.color.setHex(m.userData.mt0); delete m.userData.mt0; if(m.userData.mte!==undefined){ m.emissive.setHex(m.userData.mte); delete m.userData.mte; } } } });
  if(on) MT.veh.push(V); else MT.veh=MT.veh.filter(x=>x!==V); }

/* ---- prizes that cannot be bought: three trophies, the «Calculadora» gold (kart in the garage; jet ski and flying car from the shop) and the wizard's cape ---- */
if(WP.cuentas){
  TRO.push({id:'cuentas1',n:'Primer reto de cuentas',how:'Termina tu primer reto de cuentas (4 cuentas en una pausa del juego).',m:'b',c:10,w:'cuentas'},
    {id:'calculadora',n:'Calculadora humana',how:'Acierta 50 cuentas. Da el color dorado «Calculadora» para el kart, la moto de agua y el coche volador.',m:'s',c:30,w:'cuentas'},
    {id:'matematico',n:'Matemático',how:'Acierta 150 cuentas. Da la capa de mago.',m:'g',c:60,w:'cuentas'});
  PRG_SLOTS.vehiculo='Moto de agua y coche volador (color)';
  SHOP.push({id:'k-calc',slot:'kart',n:'Kart «Calculadora» (se pone en el garaje)',req:'calculadora',c:MT_GOLD},{id:'v-calc',slot:'vehiculo',n:'Dorado «Calculadora» para la moto de agua y el coche volador',req:'calculadora',c:MT_GOLD});
  KG_COL.push(['Calculadora',MT_GOLD,'k-calc']);
  HL_COS.mago={n:'Mago',c:'#2b3a8f',p:0}; SHOP.push({id:'h-mago',slot:'disfraz',n:'Capa de mago',req:'matematico',c:'#2b3a8f',cos:'mago'});
  mtLoad();
  { const b=$('mMath'); if(b){ b.hidden=false; b.onclick=()=>{ try{ saveName(); }catch(e){} ensureAudio(); mtSheet(mtP()?'jugar':'jugar'); }; } }
  { const b=$('bSup'); if(b) b.onclick=e=>{ e.stopPropagation(); mtSupAsk(); }; }
  // the number keys answer while the card (or the PIN pad) is open, and do not move the player
  addEventListener('keydown',e=>{ const card=!$('mtCard').hidden, pin=!$('mtSheet').hidden&&!!MT.pinMode; if(!card&&!pin){ if(e.code==='KeyK'&&!e.repeat&&!(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))&&mtSupShown()){ mtSupAsk(); e.preventDefault(); } return; }
    if(e.target&&/INPUT|TEXTAREA/.test(e.target.tagName)) return; let k=''; if(/^Digit\d$|^Numpad\d$/.test(e.code)) k=e.code.slice(-1); else if(e.code==='Backspace') k='del'; else if(e.code==='Enter'||e.code==='NumpadEnter'||e.code==='Space') k='ok'; else if(e.code==='Escape'){ if(card) mtBack(); e.preventDefault(); e.stopPropagation(); return; }
    if(k){ if(card) mtKey(k); else mtPinKey(k); } e.preventDefault(); e.stopPropagation(); },true);
}
