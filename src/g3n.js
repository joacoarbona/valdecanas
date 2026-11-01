
/* ================= a round against friends: their scores come hole by hole from their handicap ================= */
const BOT={on:false,fmt:'stableford',course:-1,my:18,opp:[],seed:1,where:'',final:false};
const BFMT={stableford:'Stableford',medal:'Medal neto',match:'Match play'};
function botLoad(){ try{ const o=JSON.parse(store.get(WP.key+'_match')||'null'); if(o&&Array.isArray(o.opp)) Object.assign(BOT,o); }catch(e){} BOT.opp.forEach(o=>{ o.rig=null; o.tag=null; o.sc=o.sc||{}; }); BOT.where=''; }
function botSave(){ store.set(WP.key+'_match',JSON.stringify({on:BOT.on,fmt:BOT.fmt,course:BOT.course,my:BOT.my,seed:BOT.seed,final:BOT.final,opp:BOT.opp.map(o=>({id:o.id,k:o.k,n:o.n,hcp:o.hcp,sc:o.sc}))})); }
function botCands(){ return WP.avatars&&AVS.length?AVS.map(a=>({id:a.id,n:a.n})):SKINS.map((s,i)=>({k:i,n:s.n})); }
function botKey(c){ return WP.key+'_bh_'+(c.id||('s'+c.k)); }
function botSkin(o){ const a=o.id&&avById(o.id); return a?avSkin(a):(SKINS[o.k|0]||SKINS[0]); }
// strokes received on a hole: one on the holes whose stroke index is within the handicap, two when it goes past 18
function recv(h,H,C){ h=Math.max(0,Math.round(h)); const si=H.hcp||((C.holes.indexOf(H.i)%18)+1); return Math.floor(h/18)+(si<=h%18?1:0); }
function hrand(a,b,c){ const x=Math.sin(a*12.9898+b*78.233+c*37.719)*43758.5453; return x-Math.floor(x); }
function botGross(o,H,C,oi){ const r=recv(o.hcp,H,C); const u1=hrand(BOT.seed,H.i+1,oi+1), u2=hrand(BOT.seed+7,H.i+3,oi+5);
  const z=Math.sqrt(-2*Math.log(Math.max(1e-6,u1)))*Math.cos(2*Math.PI*u2), sd=o.hcp<6?0.72:o.hcp<15?0.85:1.0;
  let d=Math.round(r+0.15+z*sd); d=Math.max(H.par===3?-1:-2,Math.min(r+3,d)); return H.par+d; }
function stbl(g,par,r){ return g?Math.max(0,2+par-(g-r)):0; }
function scoreWord(s,par){ const d=s-par; return d<=-2?'eagle':d===-1?'birdie':d===0?'par':d===1?'bogey':d===2?'doble bogey':'+'+d; }
function botPlayers(){ const C=W.COURSES[BOT.course]; const me={n:(S.name||'').trim()||'Tú',hcp:BOT.my,sc:{},me:true}; for(const i of C.holes) if(S.g.scores[i]) me.sc[i]=S.g.scores[i]; return [me].concat(BOT.opp); }
function standings(){ const C=W.COURSES[BOT.course]; const L=botPlayers().map(p=>{ let g=0,n=0,pts=0,par=0,holes=0; for(const i of C.holes){ const s=p.sc[i]; if(!s) continue; const H=W.HOLES[i], r=recv(p.hcp,H,C); g+=s; n+=s-r; pts+=stbl(s,H.par,r); par+=H.par; holes++; } return {p,g,n,pts,par,holes}; });
  if(BOT.fmt==='stableford') L.sort((a,b)=>b.pts-a.pts||(a.n-a.par)-(b.n-b.par)); else L.sort((a,b)=>(a.n-a.par)-(b.n-b.par)||b.pts-a.pts); return L; }
function matchState(){ const C=W.COURSES[BOT.course], o=BOT.opp[0]; let up=0, played=0, done=null;
  for(const i of C.holes){ const a=S.g.scores[i], b=o.sc[i]; if(!a||!b) continue; const H=W.HOLES[i]; const na=a-recv(BOT.my,H,C), nb=b-recv(o.hcp,H,C); if(na<nb) up++; else if(nb<na) up--; played++; const left=C.holes.length-played; if(!done&&Math.abs(up)>left) done={up,left}; }
  return {up,played,left:C.holes.length-played,done}; }
function matchText(m){ const o=BOT.opp[0]; if(m.done) return (m.done.up>0?'Ganas':'Gana '+o.n)+' '+Math.abs(m.done.up)+(m.done.left?' y '+m.done.left:' arriba');
  if(m.up===0) return m.left===0?'Empate':'Igualados'+(m.played?'':' (A/S)'); return (m.up>0?'Vas '+m.up+' arriba':o.n+' va '+(-m.up)+' arriba')+(m.left?' · quedan '+m.left:''); }
function rel(v){ return v===0?'par':(v>0?'+':'−')+Math.abs(v); }
function standLine(){ if(BOT.fmt==='match') return matchText(matchState()); const L=standings();
  return L.map(r=>(r.p.me?'<b>'+esc(r.p.n)+'</b>':esc(r.p.n))+' '+(BOT.fmt==='stableford'?r.pts+' pts':rel(r.n-r.par))).join(' · '); }
// after each of your holes: their scores, a message and the standing
function botsPlay(j){ if(!BOT.on||BOT.final) return; const H=W.HOLES[j]; if(!H||H.course!==BOT.course) return; const C=W.COURSES[BOT.course]; const parts=[];
  BOT.opp.forEach((o,oi)=>{ if(!o.sc[j]) o.sc[j]=botGross(o,H,C,oi); parts.push(o.n+': '+scoreWord(o.sc[j],H.par)); }); botSave();
  setTimeout(()=>{ const L=BOT.fmt==='match'?matchText(matchState()):'líder: '+standings()[0].p.n; toast(parts.join(' · '),BFMT[BOT.fmt]+' · '+L); },2900); }
function botAll(){ return BOT.on&&BOT.course===S.course&&W.COURSES[BOT.course].holes.every(i=>S.g.scores[i]); }

/* ---- your rivals on the course: they watch your tee shot from beside the tee and wait for you around the green ---- */
function botRigs(){ for(const o of BOT.opp){ if(o.rig) continue; o.rig=buildRig(Object.assign({},botSkin(o),{pack:null})); o.rig.root.visible=false; scene.add(o.rig.root);
  const el=document.createElement('div'); el.className='lab vlab bot'; el.textContent=o.n; el.hidden=true; $('labels').appendChild(el); o.tag=el; } }
function botHide(){ for(const o of BOT.opp){ if(o.rig) o.rig.root.visible=false; if(o.tag) o.tag.hidden=true; } BOT.where=''; }
function botSpot(x,z){ for(let k=0;k<10;k++){ const c=W.surfAt(x,z); if(c!==7&&!(c>=20)&&!bldAt(x,z,0.6)&&W.terrain(x,z)>W.waterLevel(x,z)+0.1) return [x,z]; x+=(Math.random()-0.5)*3; z+=(Math.random()-0.5)*3; } return [x,z]; }
function botPlace(where){ const H=hole(); if(!H) return; botRigs(); BOT.where=where; const g=S.g;
  BOT.opp.forEach((o,i)=>{ let x,z; if(where==='tee'){ const tp=teePos(H); x=tp[0]-H.tc*(1.2+i*0.7)-H.ts*(5.2+i*1.5); z=tp[1]-H.ts*(1.2+i*0.7)+H.tc*(5.2+i*1.5); }
    else { const a0=Math.atan2(H.pin[1]-g.ball.z,H.pin[0]-g.ball.x), a=a0+(i%2?-1:1)*(0.85+0.35*Math.floor(i/2)), r=5.5+i*1.2; x=H.pin[0]+Math.cos(a)*r; z=H.pin[1]+Math.sin(a)*r; }
    [x,z]=botSpot(x,z); o.x=x; o.z=z; o.y=W.terrain(x,z); o.rig.root.position.set(x,o.y,z); o.rig.root.visible=true; o.ph=Math.random()*6; }); }
function botTick(T){ if(!BOT.on||!BOT.opp.length) return; const g=S.g, H=hole(); const m=S.mode;
  let want=''; if(H&&H.course===BOT.course&&g.hole>=0&&!['view','menu','drone','racket'].includes(m)){ const tp=teePos(H);
    if(g.cur===0||(BOT.where==='tee'&&Math.hypot(P.x-tp[0],P.z-tp[1])<45)) want='tee';
    else if(m==='flight') want=BOT.where==='green'?'green':'';
    else { const bl=W.surfAt(g.ball.x,g.ball.z); if(bl===5||bl===4||(BOT.where==='green'&&distToPin()<30)) want='green'; } }
  if(m==='photo'||m==='replay') want=BOT.where;
  if(want!==BOT.where){ if(want) botPlace(want); else botHide(); } if(!BOT.where) return;
  const tx=g.ball.x, tz=g.ball.z; for(const o of BOT.opp){ if(!o.rig) continue; const R=o.rig; poseRig(R,'idle',T+o.ph,0); R.root.position.set(o.x,o.y,o.z); R.root.rotation.set(0,-Math.atan2(tz-o.z,tx-o.x),0);
    const q=project(o.x,o.y+2.25,o.z); if(o.tag){ const show=!!(q&&q[2])&&!['view','menu','drone'].includes(m); o.tag.hidden=!show; if(show) o.tag.style.transform='translate('+q[0]+'px,'+q[1]+'px) translate(-50%,-100%)'; } } }
function botHUD(){ const el=$('hcMatch'); if(!el) return; const H=hole(); const on=BOT.on&&H&&H.course===BOT.course; el.hidden=!on; if(!on) return; const C=W.COURSES[BOT.course];
  const st=recv(BOT.my,H,C); el.innerHTML=BFMT[BOT.fmt]+': '+standLine()+(st?' <span>· recibes '+st+' golpe'+(st>1?'s':'')+' aquí</span>':''); }

/* ---- the tab: set up the match, follow it and see the group card ---- */
function matchHTML(){ const C=courseOf();
  if(!BOT.on){ const cs=botCands(); const sel=new Set(BOT.opp.map(o=>o.id||('s'+o.k)));
    const rows=cs.map((c,i)=>{ const key=c.id||('s'+c.k), h=+(store.get(botKey(c))||18); const sk=c.id?avSkin(avById(c.id)):SKINS[c.k];
      return '<label class="botc"><input type="checkbox" data-bi="'+i+'"'+(sel.size?(sel.has(key)?' checked':''):(i<3?' checked':''))+'><span class="bi">'+avIcon(sk)+'</span><b>'+esc(c.n)+'</b><span class="bh">hándicap <input type="number" min="0" max="54" step="1" data-bh="'+i+'" value="'+h+'"></span></label>'; }).join('');
    return courseChips()+'<p>Juega la vuelta de <b>'+C.name+'</b> contra '+(WP.avatars?'tus amigos':'los personajes')+'. Tú juegas tus golpes; los de ellos salen hoyo a hoyo de su hándicap (cuanto más alto, más golpes de más), así que cada partida es distinta. Te esperan junto al tee y alrededor del green.</p>'+
      '<div class="lbl">Formato</div><div class="row" style="margin:4px 0 10px;flex-wrap:wrap;gap:6px">'+Object.keys(BFMT).map(k=>'<button class="btn small'+(BOT.fmt===k?' primary':'')+'" data-fmt="'+k+'">'+BFMT[k]+'</button>').join('')+'</div>'+
      '<p class="note" style="margin:0 0 10px">'+({stableford:'Stableford: puntos por hoyo según tu resultado neto (golpes menos los que te da el hándicap): 2 por el par neto, 3 por birdie neto, 1 por bogey neto y 0 si haces más. Gana quien más puntos suma.',medal:'Medal neto: se suman los golpes de toda la vuelta y se resta el hándicap. Gana quien menos tiene.',match:'Match play: contra un solo rival (el primero marcado), hoyo a hoyo. Gana el hoyo quien hace menos golpes netos; gana la partida quien va más hoyos arriba de los que quedan.'})[BOT.fmt]+'</p>'+
      '<div class="row" style="margin:0 0 10px;align-items:center;gap:8px"><span class="lbl" style="margin:0">Tu hándicap</span><input type="number" id="myHcp" min="0" max="54" step="1" value="'+BOT.my+'" style="width:70px"></div>'+
      '<div class="lbl">Rivales (hasta 3)</div><div class="botl">'+rows+'</div>'+
      '<div class="row" style="margin-top:12px"><button class="btn primary" id="botGo">Empezar la partida en '+C.short+'</button></div><p class="note">Empezar borra tu tarjeta de '+C.name+'. El hándicap reparte golpes por hoyo según su índice (Hcp en la tarjeta): con 18 recibes uno en cada hoyo; con 9, en los 9 más difíciles.</p>'; }
  const L=standings(), Cm=W.COURSES[BOT.course], ps=botPlayers(); const done=botAll();
  let head='<tr><th>Hoyo</th><th>Par</th><th>Hcp</th>'+ps.map(p=>'<th>'+esc(p.n)+'<br><small>hcp '+p.hcp+'</small></th>').join('')+'</tr>', rows='';
  for(const i of Cm.holes){ const H=W.HOLES[i]; rows+='<tr><td>'+H.n+'</td><td>'+H.par+'</td><td>'+(H.hcp||'')+'</td>'+ps.map(p=>{ const s=p.sc[i]; if(!s) return '<td>—</td>'; const r=recv(p.hcp,H,Cm), d=s-H.par; const cls=d<=-2?'e':d===-1?'b':d===0?'':d===1?'o':'o2';
      return '<td><span class="sc '+cls+'">'+s+'</span>'+(BOT.fmt==='stableford'?'<small class="pt">'+stbl(s,H.par,r)+'</small>':'')+(r?'<small class="rv">'+'•'.repeat(r)+'</small>':'')+'</td>'; }).join('')+'</tr>'; }
  const foot='<tr><td>Total</td><td>'+Cm.par+'</td><td></td>'+ps.map(p=>{ const r=L.find(x=>x.p===p)||{g:0,pts:0,n:0,par:0}; return '<td>'+(r.g||'—')+(BOT.fmt==='stableford'?'<small class="pt">'+r.pts+'</small>':'<small class="pt">'+(r.holes?rel(r.n-r.par):'')+'</small>')+'</td>'; }).join('')+'</tr>';
  const board=BOT.fmt==='match'?'<p style="font-size:18px;margin:4px 0 10px"><b>'+matchText(matchState())+'</b></p>':'<ol class="board">'+L.map(r=>'<li'+(r.p.me?' class="me"':'')+'><b>'+esc(r.p.n)+'</b> '+(BOT.fmt==='stableford'?r.pts+' puntos':'neto '+(r.holes?rel(r.n-r.par):'—'))+' <small>'+r.holes+' hoyos · '+r.g+' golpes</small></li>').join('')+'</ol>';
  return '<p><b>'+BFMT[BOT.fmt]+'</b> en '+Cm.name+(done?' · <b>partida terminada</b>':'')+'</p>'+board+
    '<div class="tablewrap"><table class="card grp"><thead>'+head+'</thead><tbody>'+rows+'</tbody><tfoot>'+foot+'</tfoot></table></div>'+
    '<p class="note">Los puntos (en pequeño) son los Stableford de cada hoyo; los puntitos, los golpes que da el hándicap en ese hoyo. '+(BOT.course!==S.course?'La partida es en '+Cm.name+': cambia a ese recorrido para seguirla. ':'')+'</p>'+
    '<div class="row" style="margin-top:10px">'+(done?'<button class="btn primary" id="botNew">Nueva partida</button>':'<button class="btn small" id="botEnd">Terminar la partida</button>')+'</div>'; }
function matchWire(){ const b=$('sheetBody');
  b.querySelectorAll('[data-fmt]').forEach(x=>x.onclick=()=>{ BOT.fmt=x.dataset.fmt; botSave(); openModal('partida'); });
  b.querySelectorAll('[data-bh]').forEach(x=>x.onchange=()=>{ const c=botCands()[+x.dataset.bh]; const v=Math.max(0,Math.min(54,Math.round(+x.value||0))); x.value=v; store.set(botKey(c),String(v)); });
  const mh=$('myHcp'); if(mh) mh.onchange=()=>{ BOT.my=Math.max(0,Math.min(54,Math.round(+mh.value||0))); mh.value=BOT.my; botSave(); };
  const go=$('botGo'); if(go) go.onclick=botStart;
  const en=$('botEnd'); if(en) en.onclick=()=>{ if(en.dataset.ok){ BOT.on=false; botHide(); botSave(); openModal('partida'); } else { en.dataset.ok='1'; en.textContent='Pulsa otra vez para terminarla'; } };
  const nw=$('botNew'); if(nw) nw.onclick=()=>{ BOT.on=false; BOT.final=false; botHide(); botSave(); openModal('partida'); }; }
function botStart(){ const cs=botCands(); const pick=[]; $('sheetBody').querySelectorAll('[data-bi]').forEach(x=>{ if(x.checked) pick.push(cs[+x.dataset.bi]); });
  if(!pick.length){ tip('Marca al menos un rival',2500); return; } const mh=$('myHcp'); if(mh) BOT.my=Math.max(0,Math.min(54,Math.round(+mh.value||0)));
  for(const o of BOT.opp){ if(o.rig){ scene.remove(o.rig.root); } if(o.tag) o.tag.remove(); }
  BOT.opp=pick.slice(0,BOT.fmt==='match'?1:3).map(c=>({id:c.id||null,k:c.k,n:c.n,hcp:+(store.get(botKey(c))||18),sc:{},rig:null,tag:null}));
  BOT.on=true; BOT.final=false; BOT.course=S.course; BOT.seed=1+Math.floor(Math.random()*1e6); BOT.where=''; clearCard(); botSave(); closeModal();
  const C=W.COURSES[S.course], first=C.holes[0];
  if(S.mode==='menu'){ VW.i=first; VW.ret={mode:'menu'}; playFromView(); } else fadeTo(()=>{ if(P.buggy) exitBuggy(); if(P.horse) dismountHorse(); startHole(first); });
  setTimeout(()=>toast(BFMT[BOT.fmt]+' en '+C.short,'Contra '+BOT.opp.map(o=>o.n).join(', ')),900); }
botLoad();
