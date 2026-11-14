/* ================= T1 · menus with the gamepad, no mouse: a visible focus, ✕ accepts, ○ goes back, L1/R1 change tab, the right stick scrolls ================= */
const GPN={el:null,rootId:'',key:'',pad:0,ptr:-1,bar:'',kind:'xbox'};
// the names on the pad you have: PlayStation ✕ ○ □ △, Xbox (and Luna, and any other pad) A B X Y
function gpKind(id){ return gpName(id)==='PlayStation'?'ps':'xbox'; }
const GP_SYM={ps:{A:'✕',B:'○',X:'□',Y:'△',LB:'L1',RB:'R1',LT:'L2',RT:'R2',START:'Options',BACK:'Create'},
  xbox:{A:'A',B:'B',X:'X',Y:'Y',LB:'LB',RB:'RB',LT:'LT',RT:'RT',START:'Menú',BACK:'Vista'}};
function gpSym(k,kind){ return (GP_SYM[kind||GPN.kind]||GP_SYM.xbox)[k]||k; }
function gpChip(k,kind){ kind=kind||GPN.kind; return '<b class="gpk '+kind+' k'+k+'">'+gpSym(k,kind)+'</b>'; }
function gpVis(el){ return !!el&&!el.hidden&&el.getClientRects().length>0; }
function gpClick(id){ const e=document.getElementById(id); if(gpVis(e)){ e.click(); return true; } return false; }
// the window the pad works in now, the top one first. heavy: it takes the whole pad.
// light: a notice (an invitation, the copilot question) you answer with the d-pad and ✕ / ○ while the sticks keep driving
const GP_MOVE=['walk','drive','ride','jet','ski','bike','pas','glide','fall'];
function gpRoot(){ const q=id=>document.getElementById(id), mv=GP_MOVE.includes(S.mode);
  const L=[['mpPrompt',1,()=>q('mpPromptNo').click(),()=>q('mpPromptNo').textContent],['carPrompt',1,()=>q('carNo').click(),()=>q('carNo').textContent],['pasPrompt',1,()=>q('pasNo').click(),()=>q('pasNo').textContent],
    ['photoOv',0,()=>gpClick('phClose')||(q('photoOv').hidden=true)],['avEd',0,()=>{ q('avEd').hidden=true; S.overlay=false; }],['modal',0,closeModal],['mapOv',0,hideMap],
    ['hotelSheet',0,()=>gpClick('hotelClose')||(q('hotelSheet').hidden=true)],['kartSheet',0,()=>gpClick('kgBack')||gpClick('kartClose')||kartSheetClose(),()=>gpVis(q('kgBack'))?'Volver':'Cerrar'],
    ['bkSheet',0,()=>gpClick('bkClose')||(q('bkSheet').hidden=true)],['cirSheet',0,()=>gpClick('cirClose')||(q('cirSheet').hidden=true)],
    ['hotelSeat',1,()=>q('hotelUp').click(),()=>q('hotelUp').textContent]];
  for(const [id,lt,back,bt] of L){ const el=q(id); if(gpVis(el)) return {id,light:!!lt&&mv,el:id==='modal'?q('sheet'):el,back,bt:bt?bt():(lt?'No':'Cerrar')}; }
  if(S.mode==='menu'&&gpVis(q('intro'))) return {id:'intro',light:false,el:q('intro').querySelector('.card')||q('intro'),back:null,bt:''};
  return null; }
// what the focus can land on: buttons, links, fields; a checkbox is reached through its label
const GP_SEL='button,a[href],a.btn,input:not([type=hidden]),select,textarea,[tabindex]:not([tabindex="-1"])';
function gpList(root){ const out=[]; for(let el of root.querySelectorAll(GP_SEL)){ if(el.matches('input[type=checkbox],input[type=radio]')&&el.closest('label')) el=el.closest('label');
    if(out.includes(el)||el.disabled||el.closest('[hidden]')||!el.getClientRects().length||getComputedStyle(el).visibility==='hidden') continue; out.push(el); } return out; }
function gpElKey(el){ if(!el) return ''; if(el.id) return '#'+el.id; for(const a of el.attributes) if(a.name.startsWith('data-')&&/^[\w.-]*$/.test(a.value)) return '['+a.name+'="'+a.value+'"]'; return el.tagName+'|'+(el.textContent||'').trim().slice(0,40); }
function gpFind(root,key,L){ if(!key) return null; if(key[0]==='#'||key[0]==='['){ try{ const e=root.querySelector(key); if(e) return L.includes(e)?e:L.find(x=>x.contains(e))||null; }catch(_){ } return null; } return L.find(el=>gpElKey(el)===key)||null; }
function gpInView(el){ const r=el.getBoundingClientRect(); if(r.bottom<0||r.top>viewH()) return false; let p=el.parentElement; while(p&&p!==document.body){ if(p.scrollHeight>p.clientHeight+4){ const q=p.getBoundingClientRect(); if(r.bottom<q.top||r.top>q.bottom) return false; } p=p.parentElement; } return true; }
// where the focus starts when a window opens: the main button in sight, then the first menu action or the open tab
function gpFirst(R,L){ if(R.id==='intro') return document.getElementById('mGolf')||L[0];
  // a big main button (Al tee, Empezar) before a highlighted chip (the chosen format, the chosen tees)
  const pri=L.find(el=>el.classList.contains('primary')&&!el.classList.contains('small')&&gpInView(el))||L.find(el=>el.classList.contains('primary')&&gpInView(el)); if(pri) return pri;
  if(R.id==='modal'){ const a=L.find(el=>el.closest('#menuActs')); if(a) return a; const t=L.find(el=>el.closest('#tabs')&&el.classList.contains('on')); if(t) return t; }
  return L.find(el=>el.id!=='closeModal'&&gpInView(el))||L[0]; }
// the nearest button that way. Up and down prefer the same column; left and right stay in the row, and past its end go on in reading order
function gpMove(L,cur,d){ const r0=cur.getBoundingClientRect(), cx=r0.left+r0.width/2, cy=r0.top+r0.height/2; let best=null, bs=1e9;
  for(const el of L){ if(el===cur) continue; const r=el.getBoundingClientRect(), x=r.left+r.width/2, y=r.top+r.height/2; let sc;
    if(d==='d'||d==='u'){ if(d==='d'?(y<=cy+4||r.top<=r0.top+2):(y>=cy-4||r.bottom>=r0.bottom-2)) continue;
      const gap=Math.max(0,d==='d'?r.top-r0.bottom:r0.top-r.bottom), orth=r.right<r0.left?r0.left-r.right:r.left>r0.right?r.left-r0.right:0; sc=gap+orth*2.5+Math.abs(x-cx)*0.02; }
    else { if(d==='r'?x<=cx+4:x>=cx-4) continue; if(r.bottom<=r0.top+2||r.top>=r0.bottom-2) continue; sc=Math.abs(x-cx)+Math.abs(y-cy)*2; }
    if(sc<bs){ bs=sc; best=el; } }
  if(!best&&(d==='l'||d==='r')){ const i=L.indexOf(cur)+(d==='r'?1:-1); if(i>=0&&i<L.length) best=L[i]; }
  return best; }
// left and right change a number, a slider or a list instead of moving away
function gpAdjust(el,s){ if(el.tagName==='SELECT'){ const n=el.options.length; if(!n) return true; el.selectedIndex=(el.selectedIndex+s+n)%n; el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return true; }
  if(el.tagName==='INPUT'&&(el.type==='range'||el.type==='number')){ try{ s>0?el.stepUp():el.stepDown(); }catch(_){ el.value=(+el.value||0)+s; } el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true})); return true; }
  return false; }
// ✕: press the button; a text box gets the keyboard
function gpPress(el){ if(!el) return; if(el.tagName==='TEXTAREA'||(el.tagName==='INPUT'&&!/^(checkbox|radio|range|button|submit|color)$/.test(el.type))){ try{ el.focus(); el.select&&el.type!=='number'&&el.select(); }catch(_){ } return; }
  if(el.tagName==='SELECT'){ gpAdjust(el,1); return; } el.click(); }
function gpSet(el,moved){ if(GPN.el!==el){ if(GPN.el) GPN.el.classList.remove('gpf'); GPN.el=el; } if(!el) return; GPN.key=gpElKey(el);
  if(GPN.pad>=GPN.ptr) el.classList.add('gpf'); else el.classList.remove('gpf');
  const typing=el.tagName==='TEXTAREA'||(el.tagName==='INPUT'&&!/^(checkbox|radio|range|button|submit|color)$/.test(el.type));
  if(moved){ if(!typing) try{ el.focus({preventScroll:true}); }catch(_){ } else if(document.activeElement&&document.activeElement!==el) try{ document.activeElement.blur(); }catch(_){ }
    try{ el.scrollIntoView({block:'nearest',inline:'nearest'}); }catch(_){ } }
  const ms=[...document.querySelectorAll('#modes .mode')], i=ms.indexOf(el); if(i>=0) GP.sel=i; }
function gpDrop(){ if(GPN.el) GPN.el.classList.remove('gpf'); GPN.el=null; GPN.rootId=''; }
// the box the right stick scrolls: the one around the focus, or the window's own
function gpScrollBox(R){ const ok=e=>{ if(!e||e.scrollHeight<=e.clientHeight+4) return false; const oy=getComputedStyle(e).overflowY; return oy==='auto'||oy==='scroll'; };
  let e=GPN.el; while(e&&e!==R.el.parentElement){ if(ok(e)) return e; e=e.parentElement; }
  for(const c of [R.el,...R.el.querySelectorAll('#sheetBody,#mapLegend,#avForm,.tablewrap')]) if(ok(c)) return c; return null; }
// L1 / R1: the tab before or after
function gpTab(R,s){ const T=R.el.querySelector('.tabs'); if(!T) return false; const B=[...T.querySelectorAll('button')].filter(b=>b.getClientRects().length); if(!B.length) return false;
  let i=B.findIndex(b=>b.classList.contains('on')); i=((i<0?0:i+s)%B.length+B.length)%B.length; const k=B[i].dataset.k; B[i].click(); GPN.key=k?'[data-k="'+k+'"]':''; GPN.el=null;
  const nb=gpFind(R.el,GPN.key,gpList(R.el)); if(nb){ gpSet(nb,true); try{ nb.scrollIntoView({block:'nearest',inline:'center'}); }catch(_){ } } return true; }
// the help bar along the bottom, with the symbols of the pad you have; only while a pad is in use and a window is open
function gpBarSet(R){ const bar=$('gpBar'); if(!bar) return; const on=!!R&&GPN.pad>=GPN.ptr&&GP.known.size>0;
  const tabs=on&&!R.light&&!!R.el.querySelector('.tabs button'), sc=on&&!R.light&&!!gpScrollBox(R);
  const k=on?[R.id,R.light,GPN.kind,tabs,sc,R.bt].join('|'):''; if(k===GPN.bar) return; GPN.bar=k;
  bar.hidden=!on; document.body.classList.toggle('gpbar',on); if(!on){ bar.innerHTML=''; return; }
  const it=['<span><b class="gpk">✚</b>'+(R.light?'':'<b class="gpk">L</b>')+' Moverte</span>','<span>'+gpChip('A')+' '+(R.light?'Aceptar':'Elegir')+'</span>'];
  if(R.back) it.push('<span>'+gpChip('B')+' '+esc(R.bt)+'</span>');
  if(tabs) it.push('<span>'+gpChip('LB')+gpChip('RB')+' Pestañas</span>');
  if(sc) it.push('<span><b class="gpk">R</b> Desplazar</span>');
  if(!R.light) it.push('<span>'+gpChip('START')+' '+(R.id==='modal'?'Cerrar el menú':R.id==='intro'?'Cómo se juega':'Menú')+'</span>');
  bar.innerHTML=it.join(''); bar.setAttribute('aria-label','Mando: '+bar.textContent);
  // the windows above leave room for the bar, however many lines it takes on a narrow screen
  document.body.style.setProperty('--gpbh',Math.ceil(bar.offsetHeight+14)+'px'); }
// every frame, from gpApply: '' (no window), 'light' (only ✕, ○ and the d-pad were taken) or 'heavy' (the window took the pad)
function gpUI(g){ const R=gpRoot(); if(!R){ if(GPN.rootId) gpDrop(); gpBarSet(null); return ''; }
  const L=gpList(R.el); let cur=null;
  if(GPN.rootId!==R.id){ if(GPN.el) GPN.el.classList.remove('gpf'); GPN.el=null; GPN.rootId=R.id; GPN.key=''; }
  if(L.length){ cur=(GPN.el&&L.includes(GPN.el))?GPN.el:gpFind(R.el,GPN.key,L); const f=cur||gpFirst(R,L); gpSet(f,!cur&&!gpInView(f)); cur=GPN.el; }
  const d=gpNavDir(g,R.light);
  if(d&&cur){ if(!((d==='l'||d==='r')&&gpAdjust(cur,d==='r'?1:-1))){ const nx=gpMove(L,cur,d); if(nx) gpSet(nx,true); else if(d==='u'||d==='d'){ const sb=gpScrollBox(R); if(sb) sb.scrollTop+=(d==='d'?1:-1)*sb.clientHeight*0.6; } } }
  if(g.down(GPB.A)&&cur){ ensureAudio(); gpPress(cur); }
  else if((g.down(GPB.B)||(R.id==='mapOv'&&g.down(GPB.Y)))&&R.back) R.back();
  else if(!R.light&&(g.down(GPB.LB)||g.down(GPB.RB))) gpTab(R,g.down(GPB.RB)?1:-1);
  else if(!R.light&&g.down(GPB.START)){ if(R.id==='modal') closeModal(); else openModal('guia'); }
  if(!R.light&&(g.rx||g.ry)){ const sb=gpScrollBox(R); if(sb&&g.ry) sb.scrollTop+=g.ry*g.dt*1100; else if(R.id==='intro'){ orbit.th+=g.rx*g.dt*0.9; orbit.ph=clamp(orbit.ph-g.ry*g.dt*0.6,0.12,1.48); } }
  gpBarSet(gpRoot()); return R.light?'light':'heavy'; }
// touching the screen or using the mouse hides the focus ring and the bar until the pad is used again
addEventListener('pointerdown',e=>{ if(e.pointerType==='mouse'&&e.button<0) return; GPN.ptr=performance.now(); if(GPN.el) GPN.el.classList.remove('gpf'); gpBarSet(null); },true);
addEventListener('resize',()=>{ GPN.bar=''; });
