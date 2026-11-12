/* ================= karts, second part (J2b): garage, items, Grand Prix, time trial with ghost, balloon battle, options ================= */
// The driving, the circuits and the race itself are in g3w.js; this module hangs from it.
// Everything is our own and golf-themed: golf balls, sand bags from the bunker, golf umbrellas, rain clouds.

/* ---- options of the race (they travel in the invitation, so the whole room plays the same) and help for the little ones (only on this device) ---- */
var KOPT=(()=>{ let o={}; try{ o=JSON.parse(store.get('vg_kopt')||'{}')||{}; }catch(e){} o=Object.assign({nb:3,it:1,bs:1,cu:1,rv:0,as:0,ag:0,open:false},o); o.md='race'; return o; })();
function koptSave(){ const o=Object.assign({},KOPT); delete o.md; store.set('vg_kopt',JSON.stringify(o)); }
var KART_PICK={};
const KB_BAT_MS=180000;
const KB_IT={turbo:{n:'Turbo',a:'Usar turbo',d:'acelerón de 2 segundos'},bola:{n:'Bolas de golf',a:'Lanzar bola',d:'tres bolas que salen rectas hacia delante; a quien le dan, trompo'},oro:{n:'Bola dorada',a:'Lanzar bola dorada',d:'persigue al kart que va delante de ti'},
  arena:{n:'Bolsa de arena',a:'Soltar arena',d:'bolsa de arena de búnker que se suelta detrás; frena en seco a quien la pisa'},paraguas:{n:'Paraguas de golf',a:'Abrir paraguas',d:'te protege del siguiente golpe durante 8 segundos'},
  nube:{n:'Nube de lluvia',a:'Lanzar nube',d:'llueve 4 segundos sobre todos los que van delante de ti y los frena'},dorado:{n:'Modo dorado',a:'Modo dorado',d:'6 segundos invencible y más rápido; a quien tocas, trompo'}};
var KB={shots:[],ghost:null,rec:null,gt:0,recT:0,netT:0,lastBt:0,arena:undefined};
function kbItemsHTML(){ return 'Son: '+Object.keys(KB_IT).map(k=>'<b>'+KB_IT[k].n+'</b> ('+KB_IT[k].d+')').join('; ')+'. Al que va detrás le tocan los mejores.'; }
function kbActLabel(){ const I=KB_IT[KART.item]; return I?I.a:'Usar objeto'; }
function kbClear(){ for(const s of KB.shots) scene.remove(s.m); KB.shots=[]; KB.ghost=null; KB.rec=null; }
function kbWrap(d){ while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; return d; }

/* ---- garage: vehicle, colour and sticker ---- */
// seat = [forward, left, up] of the driver from the centre of the vehicle; h = height where umbrella, balloons and cloud hang; stk = where the stickers go (t: on top, s: on each side)
const KG_VEH={kart:{n:'Kart',txt:'Bajo y ligero: es el que mejor acelera.',acc:1.22,max:0,grass:8,seat:[-0.32,0,-0.34],h:1.75,stk:{t:[1.2,0.5,0,0.5,0.56],s:[-0.05,0.44,0.775,0.28,0.26]},st:[3,2,2]},
  buggy:{n:'Buggy',txt:'El de siempre: equilibrado, y la hierba lo frena menos.',acc:1,max:0.3,grass:10.5,seat:[-0.25,0.28,0.18],h:2.35,stk:{t:[-0.1,2.07,0,1.0,1.0],s:[0.1,0.46,0.63,0.3,0.28]},st:[2,2,3]},
  coche:{n:'Coche',txt:'El más rápido en las rectas, pero le cuesta arrancar.',acc:0.86,max:0.9,grass:8,seat:[-0.25,0.28,-0.04],h:2.0,stk:{t:[0.92,0.94,0,0.9,0.8],s:[0.1,0.58,0.675,0.42,0.4]},st:[1,3,2]}};
const KG_COL=[['rojo','#d6332a'],['azul','#2a6fd6'],['verde','#2f9e5a'],['amarillo','#f2c230'],['naranja','#f08a24'],['rosa','#e86aa0'],['blanco','#f4f2ec'],['negro','#2b2d30'],['dorado','#d9a520','k-oro']];
const KG_STK=[['no','Sin pegatina'],['num','Dorsal'],['rayas','Rayas'],['estrella','Estrella'],['bandera','Bandera de golf'],['llamas','Llamas','k-llamas'],['corona','Corona','k-corona']];
function kgOwned(id){ return !id||(typeof prgOwned==='function'&&prgOwned(prgItem(id))); }
var KG=(()=>{ let o={}; try{ o=JSON.parse(store.get('vg_kgar')||'{}')||{}; }catch(e){} return {v:KG_VEH[o.v]?o.v:'kart',c:clamp(o.c|0,0,KG_COL.length-1),s:KG_STK.some(s=>s[0]===o.s)?o.s:'num',num:clamp(o.num==null?7:o.num|0,0,99)}; })();
function kgSave(){ store.set('vg_kgar',JSON.stringify(KG)); }
function kgDesc(d){ const s=KG_STK.find(s=>s[0]===d.s); return KG_VEH[d.v].n+' '+KG_COL[d.c][0]+(d.s==='num'?', dorsal '+d.num:d.s==='no'?'':', pegatina: '+s[1].toLowerCase()); }
var KG_GEO={}, KG_TEX={};
function kgGeo(v,ci){ const key=v+ci; if(KG_GEO[key]) return KG_GEO[key]; const g=new THREE.Group(), M=c=>new THREE.MeshLambertMaterial({color:Cc(c)}), col=M(KG_COL[ci][1]), blk=M('#222628'), gry=M('#9aa3ab'), drk=M('#3a4046'), yel=M('#f2c230');
  const add=(geo,mat,x,y,z,rx,ry,rz)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.rotation.set(rx||0,ry||0,rz||0); g.add(m); }, B=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
  const wheels=(xs,y,zs,r,w)=>{ for(const x of xs) for(const z of zs) add(new THREE.CylinderGeometry(r,r,w,12),blk,x,y,z,Math.PI/2,0,0); };
  if(v==='kart'){ add(B(2.3,0.14,0.9),col,0,0.3,0); add(B(0.75,0.22,0.62),col,1.2,0.38,0); add(B(0.12,0.16,1.35),drk,1.6,0.3,0); add(B(1.0,0.3,0.3),col,-0.05,0.43,0.62); add(B(1.0,0.3,0.3),col,-0.05,0.43,-0.62);
    add(B(0.5,0.12,0.62),drk,-0.3,0.42,0); add(B(0.14,0.62,0.62),drk,-0.66,0.7,0); add(B(0.5,0.42,0.72),gry,-1.02,0.56,0); add(B(0.06,0.5,0.06),gry,-1.22,0.9,0.5); add(B(0.06,0.5,0.06),gry,-1.22,0.9,-0.5); add(B(0.34,0.06,1.36),col,-1.24,1.16,0);
    add(B(0.06,0.5,0.06),gry,0.52,0.6,0,0,0,0.5); add(new THREE.TorusGeometry(0.17,0.03,6,14),blk,0.38,0.84,0,0,Math.PI/2,0); wheels([0.85,-0.85],0.3,[0.74,-0.74],0.3,0.3); }
  else if(v==='coche'){ add(B(2.8,0.46,1.34),col,0,0.56,0); add(B(0.95,0.14,1.24),col,0.9,0.86,0); add(B(0.8,0.2,1.3),col,-1.0,0.88,0); add(B(0.06,0.42,1.2),M('#2b4a6b'),0.42,1.08,0,0,0,-0.25); add(B(0.7,0.14,1.1),drk,-0.25,0.8,0); add(B(0.12,0.5,1.1),drk,-0.64,1.02,0);
    add(B(0.3,0.06,1.4),col,-1.3,1.24,0); add(B(0.06,0.28,0.06),drk,-1.3,1.1,0.5); add(B(0.06,0.28,0.06),drk,-1.3,1.1,-0.5); add(B(0.08,0.14,0.3),yel,1.41,0.62,0.42); add(B(0.08,0.14,0.3),yel,1.41,0.62,-0.42); add(B(0.1,0.16,1.36),drk,1.42,0.4,0);
    add(new THREE.TorusGeometry(0.17,0.025,6,14),blk,0.2,1.02,-0.28,0,Math.PI/2,0); wheels([0.88,-0.88],0.32,[0.68,-0.68],0.32,0.24); }
  else { const seat=M('#3a4046');
    add(B(2.5,0.32,1.25),col,0,0.45,0); add(B(0.6,0.55,1.2),col,1.0,0.7,0); add(B(0.6,0.4,1.15),seat,-0.25,0.82,0); add(B(0.15,0.55,1.15),seat,-0.6,1.1,0); add(new THREE.CylinderGeometry(0.2,0.2,0.9,8),M('#2a6f87'),-1.05,1.05,0.25,0,0,0.25);
    for(const [x,z] of [[0.75,0.55],[0.75,-0.55],[-0.95,0.55],[-0.95,-0.55]]) add(B(0.06,1.3,0.06),gry,x,1.35,z);
    add(B(2.1,0.08,1.35),col,-0.1,2.02,0); add(new THREE.TorusGeometry(0.17,0.025,6,16),blk,0.55,1.15,-0.25,0.5,Math.PI/2,0); wheels([0.82,-0.82],0.28,[0.62,-0.62],0.28,0.2); }
  return KG_GEO[key]=mergeGroup(g); }
function kgStkDraw(g,w,s,num){ const c=w/2; g.clearRect(0,0,w,w); g.lineJoin='round';
  if(s==='num'){ g.fillStyle='#ffffff'; g.strokeStyle='#16231b'; g.lineWidth=w*0.05; g.beginPath(); g.arc(c,c,w*0.42,0,7); g.fill(); g.stroke(); g.fillStyle='#16231b'; g.font='bold '+Math.round(w*0.5)+'px sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(String(num),c,c+w*0.03); }
  else if(s==='rayas'){ g.fillStyle='#ffffff'; g.fillRect(w*0.26,0,w*0.17,w); g.fillRect(w*0.57,0,w*0.17,w); }
  else if(s==='estrella'){ g.fillStyle='#ffd23a'; g.strokeStyle='#16231b'; g.lineWidth=w*0.045; g.beginPath(); for(let k=0;k<10;k++){ const a=-Math.PI/2+k*Math.PI/5, r=k%2?w*0.19:w*0.45; g.lineTo(c+Math.cos(a)*r,c+Math.sin(a)*r); } g.closePath(); g.fill(); g.stroke(); }
  else if(s==='bandera'){ g.fillStyle='#ffffff'; g.strokeStyle='#16231b'; g.lineWidth=w*0.05; g.beginPath(); g.arc(c,c,w*0.42,0,7); g.fill(); g.stroke(); g.fillStyle='#16231b'; g.fillRect(w*0.4,w*0.2,w*0.05,w*0.58); g.fillStyle='#d6332a'; g.beginPath(); g.moveTo(w*0.45,w*0.2); g.lineTo(w*0.74,w*0.32); g.lineTo(w*0.45,w*0.44); g.fill(); g.fillStyle='#2f9e5a'; g.fillRect(w*0.3,w*0.74,w*0.26,w*0.05); }
  else if(s==='llamas'){ for(const [col,k] of [['#e8452a',1],['#f08a24',0.74],['#ffd23a',0.46]]){ g.fillStyle=col; g.beginPath(); g.moveTo(c-w*0.36*k,w*0.94); g.quadraticCurveTo(c-w*0.46*k,w*(0.94-0.5*k),c-w*0.16*k,w*(0.94-0.62*k)); g.quadraticCurveTo(c-w*0.1*k,w*(0.94-0.42*k),c,w*(0.94-0.9*k)); g.quadraticCurveTo(c+w*0.12*k,w*(0.94-0.5*k),c+w*0.2*k,w*(0.94-0.66*k)); g.quadraticCurveTo(c+w*0.46*k,w*(0.94-0.46*k),c+w*0.36*k,w*0.94); g.closePath(); g.fill(); } }
  else if(s==='corona'){ g.fillStyle='#e8b923'; g.strokeStyle='#16231b'; g.lineWidth=w*0.045; g.beginPath(); g.moveTo(w*0.14,w*0.76); g.lineTo(w*0.1,w*0.3); g.lineTo(w*0.32,w*0.5); g.lineTo(c,w*0.18); g.lineTo(w*0.68,w*0.5); g.lineTo(w*0.9,w*0.3); g.lineTo(w*0.86,w*0.76); g.closePath(); g.fill(); g.stroke(); g.fillStyle='#d6332a'; for(const x of [0.3,0.5,0.7]){ g.beginPath(); g.arc(w*x,w*0.64,w*0.045,0,7); g.fill(); } } }
function kgStkTex(s,num){ if(s==='no'||!KG_STK.some(q=>q[0]===s)) return null; const key=s+(s==='num'?num:''); if(KG_TEX[key]) return KG_TEX[key]; return KG_TEX[key]=kartTex((g,w)=>kgStkDraw(g,w,s,num),128,128); }
// dress a buggy mesh (ours, a bot's or a friend's) as the chosen vehicle, with its stickers; b, if given, also gets the seat of that vehicle
function kgDress(m,d,b){ kgUndress(m,b); const v=KG_VEH[d.v]?d.v:'kart', V=KG_VEH[v], U=m.userData, x=new THREE.Group(); U.kg0=m.geometry; m.geometry=kgGeo(v,clamp(d.c|0,0,KG_COL.length-1)); U.kx=x; U.kc=V.seat; U.kh=V.h; if(b) b.kc=V.seat;
  const tex=kgStkTex(d.s,d.num|0); if(tex){ const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,polygonOffset:true,polygonOffsetFactor:-2,depthWrite:false}), Q=V.stk;
    const top=new THREE.Mesh(new THREE.PlaneGeometry(Q.t[3],Q.t[4]),mat); top.position.set(Q.t[0],Q.t[1],Q.t[2]); top.rotation.set(-Math.PI/2,0,-Math.PI/2); x.add(top);
    for(const sd of [1,-1]){ const s=new THREE.Mesh(new THREE.PlaneGeometry(Q.s[3],Q.s[4]),mat); s.position.set(Q.s[0],Q.s[1],Q.s[2]*sd); if(sd<0) s.rotation.y=Math.PI; x.add(s); } }
  m.add(x); }
function kgUndress(m,b){ if(!m) return; const U=m.userData; if(U.kg0){ m.geometry=U.kg0; U.kg0=null; } if(U.kx){ m.remove(U.kx); U.kx=null; } U.kc=null; U.kfx=null; U.kgKey=''; if(b) b.kc=null; }
// what hangs over a kart: the open umbrella, the golden glow, the rain cloud and the balloons of the battle
function kgFx(m,f,dt){ const U=m.userData; if(!U.kx) return; let F=U.kfx;
  if(!F){ if(!(f.sh||f.gold||f.cloud||f.bal>=0)) return; const h=U.kh, L=c=>new THREE.MeshLambertMaterial({color:Cc(c)}); F=U.kfx={bal:[]};
    F.umb=new THREE.Group(); { const c=new THREE.Mesh(new THREE.ConeGeometry(1.25,0.45,10,1,true),new THREE.MeshLambertMaterial({color:Cc('#d6332a'),side:THREE.DoubleSide})); c.position.y=h+0.72; const p=new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.95,6),L('#3a4046')); p.position.y=h+0.2; F.umb.add(c); F.umb.add(p); }
    F.aura=new THREE.Mesh(new THREE.IcosahedronGeometry(1.8,1),new THREE.MeshBasicMaterial({color:Cc('#ffd23a'),transparent:true,opacity:0.3,depthWrite:false})); F.aura.position.y=0.8;
    F.cloud=new THREE.Group(); { const cm=L('#8a929a'); for(const [x,z,r] of [[0,0,0.75],[0.6,0.2,0.55],[-0.6,-0.1,0.6]]){ const s=new THREE.Mesh(new THREE.SphereGeometry(r,10,8),cm); s.position.set(x,h+1.5,z); s.scale.y=0.6; F.cloud.add(s); } }
    ['#d6332a','#f2c230','#2a6fd6'].forEach((c,i)=>{ const g=new THREE.Group(), s=new THREE.Mesh(new THREE.SphereGeometry(0.34,12,10),L(c)), t=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.8,0.02),L('#ffffff')); s.position.set(-0.95,h+0.75+i%2*0.18,(i-1)*0.55); s.scale.y=1.15; t.position.set(-0.95,h+0.1,(i-1)*0.55); g.add(s); g.add(t); F.bal.push(g); U.kx.add(g); });
    U.kx.add(F.umb); U.kx.add(F.aura); U.kx.add(F.cloud); }
  F.umb.visible=!!f.sh; F.aura.visible=!!f.gold; F.cloud.visible=!!f.cloud; F.bal.forEach((b,i)=>{ b.visible=i<f.bal; }); if(f.gold) F.aura.rotation.y+=(dt||0.03)*3; }
// a friend in the race: his buggy copy takes the look he sends in his state (kg) and what hangs over it (kf)
function kgPeer(p,s){ const m=p.bm; if(!m||p.bmT) return; const g=s.kr&&Array.isArray(s.kg)&&s.kg.length===4?s.kg:null, key=g?g.join(','):'';
  if((m.userData.kgKey||'')!==key){ if(g) kgDress(m,{v:String(g[0]),c:g[1]|0,s:String(g[2]),num:clamp(g[3]|0,0,99)}); else kgUndress(m); m.userData.kgKey=key; }
  if(g) kgFx(m,{sh:s.kf&1,gold:s.kf&2,cloud:s.kf&4,bal:KART.on&&KART.mode==='bat'&&s.kr===KART.rid&&Array.isArray(s.kp)?s.kp[0]|0:-1}); }
// side view of the vehicle, for the sheet and the garage
function kgDraw2D(cv,d){ if(!cv) return; const g=cv.getContext('2d'), W2=cv.width, H2=cv.height, k=W2/150, col=KG_COL[d.c][1], gy=H2-12*k; g.clearRect(0,0,W2,H2); g.save(); g.scale(k,k); const y0=gy/k;
  g.fillStyle='#cfd8cf'; g.fillRect(8,y0,134,3); const wheel=(x,r)=>{ g.fillStyle='#222628'; g.beginPath(); g.arc(x,y0-r,r,0,7); g.fill(); g.fillStyle='#9aa3ab'; g.beginPath(); g.arc(x,y0-r,r*0.4,0,7); g.fill(); };
  g.fillStyle=col; g.strokeStyle='#16231b'; g.lineWidth=1.2; let sx=75, sy=y0-22, ss=16;
  if(d.v==='kart'){ g.beginPath(); g.moveTo(24,y0-8); g.lineTo(24,y0-22); g.lineTo(44,y0-22); g.lineTo(58,y0-16); g.lineTo(104,y0-16); g.lineTo(128,y0-12); g.lineTo(130,y0-8); g.closePath(); g.fill(); g.stroke(); g.fillRect(18,y0-36,22,4); g.strokeRect(18,y0-36,22,4); g.fillStyle='#3a4046'; g.fillRect(46,y0-34,5,18); g.fillRect(26,y0-33,3,12); wheel(40,10); wheel(112,10); sx=82; sy=y0-17; ss=13; }
  else if(d.v==='coche'){ g.beginPath(); g.moveTo(14,y0-9); g.lineTo(14,y0-30); g.lineTo(46,y0-30); g.lineTo(52,y0-26); g.lineTo(80,y0-26); g.lineTo(92,y0-30); g.lineTo(126,y0-26); g.lineTo(136,y0-18); g.lineTo(136,y0-9); g.closePath(); g.fill(); g.stroke(); g.fillRect(10,y0-42,18,4); g.strokeRect(10,y0-42,18,4); g.fillStyle='#2b4a6b'; g.beginPath(); g.moveTo(80,y0-26); g.lineTo(86,y0-40); g.lineTo(90,y0-40); g.lineTo(92,y0-30); g.fill(); wheel(40,11); wheel(112,11); sx=76; sy=y0-18; ss=15; }
  else { g.fillRect(18,y0-26,112,14); g.strokeRect(18,y0-26,112,14); g.fillRect(104,y0-40,24,14); g.strokeRect(104,y0-40,24,14); g.fillRect(22,y0-64,96,5); g.strokeRect(22,y0-64,96,5); g.fillStyle='#9aa3ab'; for(const x of [30,110]) g.fillRect(x,y0-60,3,34); g.fillStyle='#3a4046'; g.fillRect(52,y0-36,28,10); g.fillRect(48,y0-48,6,22); wheel(38,10); wheel(112,10); sx=88; sy=y0-19; ss=13; }
  if(d.s!=='no'){ g.translate(sx-ss/2,sy-ss/2); kgStkDraw(g,ss,d.s,d.num); } g.restore(); }
function kartGarage(){ const dots=n=>'●'.repeat(n)+'○'.repeat(3-n), lock=id=>{ const it=prgItem(id); return it?(it.req?'trofeo del Gran Premio':it.p+' monedas'):''; };
  let h='<h2>Garaje</h2><canvas id="kgBig" width="300" height="130" style="width:min(300px,100%);height:auto;border-radius:12px;background:#eef3ee;display:block;margin:0 auto 6px" role="img" aria-label="Tu vehículo"></canvas><p style="text-align:center;margin:0 0 6px"><b>'+esc(kgDesc(KG))+'</b></p>'
    +kartSeg('gv',Object.keys(KG_VEH).map(v=>[v,KG_VEH[v].n]),KG.v,'Vehículo')+'<p class="note">'+KG_VEH[KG.v].txt+'</p>'
    +'<div class="tablewrap"><table class="card mp"><thead><tr><th class="nm">Vehículo</th><th>Aceleración</th><th>Velocidad</th><th>En la hierba</th></tr></thead><tbody>'+Object.keys(KG_VEH).map(v=>'<tr'+(v===KG.v?' style="font-weight:800"':'')+'><td class="nm">'+KG_VEH[v].n+'</td>'+KG_VEH[v].st.map(n=>'<td aria-label="'+n+' de 3">'+dots(n)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><p class="note"><b>Cómo leerlo:</b> más puntos negros es mejor. La diferencia es pequeña: gana quien mejor derrapa.</p>'
    +'<div class="qual">Color '+KG_COL.map((c,i)=>'<button data-k="gc" data-v="'+i+'" class="'+(KG.c===i?'on':'')+'" aria-label="'+c[0]+(kgOwned(c[2])?'':' (bloqueado: '+lock(c[2])+')')+'" title="'+c[0]+'" style="min-width:40px"><span style="display:inline-block;width:18px;height:18px;border-radius:50%;vertical-align:middle;border:1px solid #16231b;background:'+c[1]+'"></span>'+(kgOwned(c[2])?'':' 🔒')+'</button>').join('')+'</div>'
    +'<div class="qual">Pegatina '+KG_STK.map(s=>'<button data-k="gs" data-v="'+s[0]+'" class="'+(KG.s===s[0]?'on':'')+'">'+s[1]+(kgOwned(s[2])?'':' 🔒')+'</button>').join('')+'</div>'
    +(KG.s==='num'?'<p><label>Dorsal (0 a 99): <input id="kgNum" type="number" inputmode="numeric" min="0" max="99" value="'+KG.num+'" style="font-size:16px;width:76px;padding:6px 8px;border-radius:8px;border:1px solid #9aa3ab"></label></p>':'')
    +'<p class="note">El candado 🔒 se abre con monedas (pintura dorada, 120; pegatina de llamas, 60) o ganando el Gran Premio (corona). Tienes <b>'+PRG.coins+'</b> monedas. Tus amigos de la sala ven tu vehículo tal como lo dejes aquí.</p>'
    +'<div class="row"><button class="btn primary" id="kgBack">Volver a la carrera</button></div>';
  $('kartBody').innerHTML=h; kgDraw2D($('kgBig'),KG);
  const pick=(id,fn)=>{ if(kgOwned(id)){ fn(); return; } const r=prgBuy(id), it=prgItem(id); if(r==='buy'||r==='eq'){ fn(); toast('Garaje',it.n+': comprado'); } else if(r==='poor') toast('Garaje','Te faltan monedas: cuesta '+it.p+' y tienes '+PRG.coins); else toast('Garaje','Se consigue ganando el Gran Premio'); };
  $('kartBody').querySelectorAll('button[data-k]').forEach(bt=>bt.onclick=()=>{ const k=bt.dataset.k, v=bt.dataset.v; if(k==='gv') KG.v=v; else if(k==='gc') pick(KG_COL[+v][2],()=>{ KG.c=+v; }); else if(k==='gs') pick((KG_STK.find(s=>s[0]===v)||[])[2],()=>{ KG.s=v; }); kgSave(); kartGarage(); });
  if($('kgNum')) $('kgNum').onchange=()=>{ KG.num=clamp(+$('kgNum').value|0,0,99); kgSave(); kartGarage(); };
  $('kgBack').onclick=kartSheet; $('kartSheet').hidden=false; }

/* ---- the bots: the family avatars drive first, then the usual rivals ---- */
function kbBotList(nb,net){ const L=[]; if(!net&&typeof AVS!=='undefined') for(const a of AVS){ if(a.id===S.av||L.length>=7) continue; L.push({n:String(a.n).slice(0,12),sk:avSkin(a),si:0}); }
  for(const [n,i] of KART_BOTS){ if(L.length>=7) break; if(!L.some(q=>q.n===n)) L.push({n,sk:SKINS[i%SKINS.length],si:i}); }
  return L.slice(0,clamp(nb|0,0,7)).map((d,k)=>Object.assign(d,{v:['kart','coche','buggy'][k%3],c:(KG.c+1+k)%8,s:'num',num:(KG.num+1+k)%100})); }

/* ---- items ---- */
function kbActs(){ const b=P.buggy, bat=KART.mode==='bat', A=[{id:'me',me:true,x:b?b.x:P.x,z:b?b.z:P.z,prog:bat?0:kartProg(KART.lap,KART.s),out:bat?!!KART.out:KART.done}];
  KART.bots.forEach((B,k)=>A.push({id:'b'+k,B,x:B.x,z:B.z,prog:bat?0:kartProg(B.lap,B.s),out:bat?!!B.out:B.done}));
  for(const p of MP.peers.values()){ const s=p.out; if(s&&s.m==='drive'&&s.kr===KART.rid) A.push({id:p.id,p,x:s.x,z:s.z,prog:!bat&&s.kp?kartProg(s.kp[0],s.kp[1]):0,out:bat?!!(s.kp&&(s.kp[2]||s.kp[0]<=0)):!!(s.kp&&s.kp[2])}); } return A; }
// where a racer is in the field: 0 the first, 1 the last (softer without the help for those behind)
function kbFrac(who){ if(KART.mode==='bat') return 0.5; const rk=kartRank(), i=who==='me'?rk.findIndex(r=>r.me):rk.findIndex(r=>r.bot&&KART.bots[+who.slice(1)]&&r.n===KART.bots[+who.slice(1)].n), f=rk.length>1?Math.max(0,i)/(rk.length-1):0; return KART.x.cu?f:f*0.6; }
function kbRoll(f,bat){ const w=bat?{bola:4,oro:2,arena:2,paraguas:2,turbo:1.5,dorado:0.5}:{arena:3*(1-f)+0.5,bola:2.5,paraguas:2*(1-f)+0.7,turbo:1+2*f,oro:f>0.01?0.4+2.5*f:0,nube:f>0.01?2.5*f:0,dorado:f>0.45?3*(f-0.3):0};
  let t=0; for(const k in w) t+=w[k]; let r=Math.random()*t; for(const k in w){ r-=w[k]; if(r<=0) return k; } return 'bola'; }
function kbGive(k){ if(!KB_IT[k]) return; KART.item=k; KART.itemN=k==='bola'?3:1; tip(KB_IT[k].n+': '+KB_IT[k].d+'. Pulsa Acción',2800); }
function kbUse(){ if(!KART.on||!KB_IT[KART.item]||!P.buggy||KART.lock||KART.done||KART.spin>0) return; const b=P.buggy, k=KART.item; if(--KART.itemN<=0){ KART.item=0; KART.itemN=0; } kbFire('me',k,b.x,b.z,b.yaw); blip(k==='turbo'||k==='dorado'?'gold':'jump'); }
function kbTarget(who){ const A=kbActs(), me=A.find(a=>a.id===who); if(!me) return null; let best=null, bd=1e17;
  for(const a of A){ if(a.id===who||a.out) continue; const d=KART.mode==='bat'?Math.hypot(a.x-me.x,a.z-me.z):(a.prog>me.prog?a.prog-me.prog:1e18); if(d<bd){ bd=d; best=a; } } return best; }
// who = 'me' or 'b<k>' (a bot). The one who fires simulates the shot and decides the hits; the rest of the room only draws it
function kbFire(who,k,x,z,yaw){ const me=who==='me', B=me?null:KART.bots[+who.slice(1)]; if(!me&&!B) return; const c=Math.cos(yaw), s=Math.sin(yaw); let to=null;
  if(k==='turbo'){ if(me) KART.boost=Math.max(KART.boost,2.2); else B.boost=2; }
  else if(k==='paraguas'){ if(me){ KART.shield=8; toast('Paraguas abierto','Te protege del siguiente golpe'); } else B.shield=8; }
  else if(k==='dorado'){ if(me){ KART.gold=6; KART.spin=0; KART.slow=0; KART.sandT=0; } else B.gold=6; }
  else if(k==='arena'){ kbSand(x-c*2.8,z-s*2.8,true); }
  else if(k==='bola'){ kbShot('bola',x+c*2.3,z+s*2.3,yaw,who,null,false); }
  else if(k==='oro'){ const t=kbTarget(who); to=t?t.id:null; kbShot('oro',x+c*2.3,z+s*2.3,yaw,who,to,false); }
  else if(k==='nube'){ kbCloud(who); if(me) toast('Nube de lluvia','Llueve sobre los que van delante'); }
  if(MP.code&&(k==='bola'||k==='oro'||k==='nube')){ const a=kbActs().find(a=>a.id===who); mpSend({t:'kti',rid:KART.rid,k,a:me?undefined:who,p:[r2(x+c*2.3),r2(z+s*2.3),r3(yaw)],to:to==='me'?MP.id:(to||undefined),pr:k==='nube'&&a?Math.round(a.prog):undefined}); } }
function kbShot(k,x,z,yaw,own,tg,vis){ const M=kartMats(), m=new THREE.Mesh(M.ballG,k==='oro'?M.coin:M.ball); if(k==='oro') m.scale.setScalar(1.35); scene.add(m); KB.shots.push({k,x,z,yaw,v:k==='oro'?26:32,own,tg,vis,t:k==='oro'?9:3,m}); }
function kbSand(x,z,send){ const M=kartMats(), m=new THREE.Mesh(M.ballG,M.sand); m.scale.set(1.7,1.0,1.7); m.position.set(x,terrainAt(x,z)+0.32,z); scene.add(m); KART.balls.push({x,z,m,t:performance.now(),k:'arena'}); if(send&&MP.code) mpSend({t:'kti',rid:KART.rid,k:'arena',p:[r2(x),r2(z),0]}); }
function kbCloudMe(){ if(KART.gold>0||KART.done) return; if(KART.shield>0){ KART.shield=0; toast('¡Paraguas!','La nube no te moja'); return; } KART.slow=4; tip('¡Nube de lluvia! Vas más lento unos segundos',2200); }
function kbCloud(who,prog){ const A=kbActs(), me=A.find(a=>a.id===who), p0=prog!=null?prog:me?me.prog:0;
  for(const a of A){ if(a.id===who||a.out||a.prog<=p0) continue; if(a.me) kbCloudMe(); else if(a.B&&!KART.guest){ if(a.B.gold>0) continue; if(a.B.shield>0) a.B.shield=0; else a.B.slow=4; } } }
// a hit on a racer: true if it landed (an umbrella or the golden mode stop it)
function kbHit(a,kind,by){ const bat=KART.mode==='bat';
  if(a.me){ if(KART.gold>0||KART.inv>0||KART.done) return false; if(KART.shield>0){ KART.shield=0; toast('¡Paraguas!','Te ha salvado del golpe'); blip('hit'); return false; }
    if(kind==='arena'){ if(P.buggy) P.buggy.speed*=0.3; KART.sandT=1.2; KART.dr=null; KART.coins=Math.max(0,KART.coins-1); tip('¡Bolsa de arena! Frenazo',1800); }
    else { kartHit(kind==='oro'?1.3:1.1); tip(kind==='oro'?'¡Trompo! Te ha alcanzado una bola dorada':kind==='dorado'?'¡Trompo! Te ha arrollado un kart dorado':'¡Trompo! Te ha dado una bola de golf',1800); }
    if(bat){ KART.bal--; KART.inv=1.5; toast('¡Globo pinchado!',KART.bal>0?'Te '+(KART.bal===1?'queda 1':'quedan '+KART.bal):'Te has quedado sin globos'); } return true; }
  if(a.B){ if(KART.guest){ mpSend({t:'kth',rid:KART.rid,to:a.id,k:kind}); return true; } const B=a.B; if(B.gold>0||B.inv>0||B.out) return false; if(B.shield>0){ B.shield=0; return false; }
    if(kind==='arena'){ B.v*=0.3; B.sandT=1.2; } else B.spin=1.1;
    if(bat){ B.bal--; B.inv=1.5; if(B.bal<=0){ B.out=Date.now(); B.g.visible=false; B.R.root.visible=false; toast(B.n+' se queda sin globos','Fuera de la batalla'); } } return true; }
  if(a.p){ mpSend({t:'kth',rid:KART.rid,to:a.id,k:kind}); return true; } return false; }
function kbCredit(own,ok){ if(!ok||KART.mode!=='bat') return; if(own==='me') KART.hits++; else { const B=KART.bots[+String(own).slice(1)]; if(B) B.hits++; } }
function kbShots(dt){ if(!KB.shots.length) return; const A=kbActs();
  for(let i=KB.shots.length-1;i>=0;i--){ const s=KB.shots[i]; s.t-=dt; let dead=s.t<=0;
    if(s.k==='oro'&&s.tg){ const tg=A.find(a=>a.id===s.tg&&!a.out); if(tg) s.yaw=lerpAng(s.yaw,Math.atan2(tg.z-s.z,tg.x-s.x),Math.min(1,dt*7)); }
    s.x+=Math.cos(s.yaw)*s.v*dt; s.z+=Math.sin(s.yaw)*s.v*dt; if(s.k==='bola'&&bldAt(s.x,s.z,0.3)) dead=true;
    if(KART.ar&&Math.hypot(s.x-KART.ar.x,s.z-KART.ar.z)>KART.ar.R+2) dead=true;
    s.m.position.set(s.x,Math.max(terrainAt(s.x,s.z),W.waterLevel(s.x,s.z))+0.55,s.z); s.m.rotation.z-=dt*14;
    if(!dead) for(const a of A){ if(a.id===s.own||a.out) continue; if(Math.hypot(a.x-s.x,a.z-s.z)<1.9){ if(!s.vis) kbCredit(s.own,kbHit(a,s.k,s.own)); dead=true; break; } }
    if(dead){ scene.remove(s.m); KB.shots.splice(i,1); } } }
function kbNetIn(p,o){ if(!KART.on||o.rid!==KART.rid) return;
  if(o.t==='kti'){ const q=Array.isArray(o.p)&&o.p.length>=2&&o.p.every(v=>Number.isFinite(v)&&Math.abs(v)<60000)?o.p:null, own=typeof o.a==='string'&&/^b\d$/.test(o.a)&&p.id===KART.host?o.a:p.id, k=o.k;
    if(k==='quita'&&q){ for(let i=KART.balls.length-1;i>=0;i--){ const B=KART.balls[i]; if(B.k&&Math.hypot(B.x-q[0],B.z-q[1])<1){ scene.remove(B.m); KART.balls.splice(i,1); } } }
    else if(k==='bola'&&q&&KB.shots.length<40) kbShot('bola',q[0],q[1],+q[2]||0,own,null,true);
    else if(k==='oro'&&q&&KB.shots.length<40) kbShot('oro',q[0],q[1],+q[2]||0,own,o.to===MP.id?'me':typeof o.to==='string'?o.to.slice(0,40):null,true);
    else if(k==='arena'&&q&&KART.balls.length<60) kbSand(q[0],q[1],false);
    else if(k==='nube'&&Number.isFinite(o.pr)&&KART.mode!=='bat') kbCloud(own,o.pr); }
  else if(o.t==='kth'){ const k=['bola','oro','arena','dorado'].includes(o.k)?o.k:'bola'; if(o.to===MP.id) kbHit({me:true,id:'me'},k,p.id); else if(!KART.guest&&typeof o.to==='string'&&/^b\d$/.test(o.to)){ const B=KART.bots[+o.to[1]]; if(B) kbHit({B,id:o.to},k,p.id); } }
  else if(o.t==='ktbt'){ if(KART.guest&&p.id===KART.host&&Array.isArray(o.b)){ KB.lastBt=performance.now(); o.b.forEach((e,k)=>{ const B=KART.bots[k]; if(B&&Array.isArray(e)&&e.length>=6&&e.every(Number.isFinite)) B.net=e.slice(0,6); }); } } }
function kbInFord(C,idx){ for(const f of C.fords||[]) if(idx>=f.i0&&idx<=f.i1) return true; return false; }

/* ---- time trial: the ghost of your best race ---- */
// The race is sampled four times a second: [x, z, yaw, lift, metres done]. The ghost replays it with the same clock.
function kbGhostStart(){ KB.rec=[]; KB.gt=0; KB.recT=0; KB.ghost=null; KART.gap=null; KART.ttWin=null; if(KART.mode!=='tt') return; let g=null; try{ g=JSON.parse(store.get(KART.C.key+'_g'+KART.laps)||'null'); }catch(e){}
  if(g&&Array.isArray(g.p)&&g.p.length>4&&g.t>0&&g.p.every(q=>Array.isArray(q)&&q.length===5&&q.every(Number.isFinite))){ const m=new THREE.Mesh(kgGeo(KG_VEH[g.v]?g.v:'kart',6),new THREE.MeshBasicMaterial({color:Cc('#ffffff'),transparent:true,opacity:0.45,depthWrite:false})); kartAdd(m); const lb=kartLabel('Tu récord'); kartAdd(lb); KB.ghost={g,m,lb,j:0}; } }
function kbGhost(dt){ if(KART.mode!=='tt'||!KB.rec) return; const b=P.buggy, G=KB.ghost;
  if(!KART.lock&&KART.t0&&!KART.done&&b){ KB.gt+=dt; KB.recT-=dt; if(KB.recT<=0){ KB.recT+=0.25; KB.rec.push([Math.round(b.x*10),Math.round(b.z*10),Math.round(b.yaw*100),Math.round((b.lift||0)*10),Math.round(kartProg(KART.lap,KART.s))]); } }
  if(!G) return; const Q=G.g.p, f=Math.min(KB.gt/0.25,Q.length-1), i=Math.floor(f), a=Q[i], c=Q[Math.min(i+1,Q.length-1)], u=f-i, x=(a[0]+(c[0]-a[0])*u)/10, z=(a[1]+(c[1]-a[1])*u)/10, y=terrainAt(x,z)+(a[3]+(c[3]-a[3])*u)/10;
  G.m.position.set(x,y,z); G.m.rotation.set(0,-(a[2]+(c[2]-a[2])*u)/100,0); G.lb.position.set(x,y+2.7,z);
  if(!KART.done&&KART.t0){ const pm=kartProg(KART.lap,KART.s); while(G.j<Q.length-1&&Q[G.j][4]<pm) G.j++; KART.gap=G.j>=Q.length-1&&Q[G.j][4]<pm?KB.gt-G.g.t:KB.gt-G.j*0.25; } }

/* ---- Grand Prix: four races with points ---- */
function kbGpRounds(){ const cs=[]; if(W.COURSES.length>1) W.COURSES.forEach((c,i)=>cs.push({cir:i===S.course?'campo':'c'+i,ids:kartPickHoles(i)})); else cs.push({cir:'campo',ids:kartPickHoles()});
  (WP.karts||[]).forEach(k=>cs.push({cir:k.id,ids:[]})); const out=[]; for(let k=0;out.length<4;k++){ const c=cs[k%cs.length]; out.push({cir:c.cir,ids:c.ids,rev:k>=cs.length?1:0}); } return out; }
function kbGpName(r){ return kartCirBuild(r.cir,r.ids,r.rev).n; }
function kbGpGo(){ const G=KART.gp; if(!G||!G.R||!G.R[G.k]) return false; const r=G.R[G.k]; KOPT.md='gp'; return kartLaunch({md:'gp',cir:r.cir,ids:r.ids,rev:r.rev,gp:[G.k,G.R.length,G.gid]}); }
function kbGpTable(){ const G=KART.gp; if(!G) return []; return Object.keys(G.pts).map(n=>({n,pts:G.pts[n],me:n==='Tú'})).sort((a,b)=>b.pts-a.pts||(b.me?1:0)-(a.me?1:0)); }

/* ---- balloon battle ---- */
// the arena: a round, dry, open and fairly flat spot near the first tee of the course
function kbArena(){ if(KB.arena!==undefined) return KB.arena; const ok=(x,z)=>W.terrain(x,z)>W.waterLevel(x,z)+0.4&&!W.poolAt(x,z)&&!bldAt(x,z,2.5)&&bkPkGround(x,z)===null, R=34; let best=null;
  const hs=(W.COURSES[S.course]||W.COURSES[0]).holes, H0=W.HOLES[hs[0]], cx0=H0.P[0][0], cz0=H0.P[0][1];
  for(let gx=-600;gx<=600;gx+=30) for(let gz=-600;gz<=600;gz+=30){ const cx=cx0+gx, cz=cz0+gz; if(!ok(cx,cz)) continue; let good=true, lo=1e9, hi=-1e9, trees=0;
    for(let a=0;a<16&&good;a++) for(const rr of [R+3,R*0.55]){ const x=cx+Math.cos(a*0.3927)*rr, z=cz+Math.sin(a*0.3927)*rr; if(!ok(x,z)){ good=false; break; } const h=W.terrain(x,z); lo=Math.min(lo,h); hi=Math.max(hi,h); }
    if(!good) continue;
    for(let tx=Math.floor((cx-R)/20);tx<=Math.floor((cx+R)/20);tx++) for(let tz=Math.floor((cz-R)/20);tz<=Math.floor((cz+R)/20);tz++){ const tr=treeGrid.get(tx+','+tz); if(tr) for(const t of tr) if(Math.hypot(t.x-cx,t.z-cz)<R+1) trees++; }
    const sc=trees*70+(hi-lo)*30+Math.hypot(gx,gz)*0.15; if(!best||sc<best.sc) best={x:cx,z:cz,R,sc,trees,slope:hi-lo}; }
  return KB.arena=best; }
function kbArenaC(ar){ const r=ar[2]*0.6, n=Math.max(12,Math.round(2*Math.PI*r/4)), pts=[]; for(let k=0;k<n;k++){ const a=k/n*2*Math.PI; pts.push([ar[0]+Math.cos(a)*r,ar[1]+Math.sin(a)*r,k*4]); }
  return {ids:[],pts,L:n*4,st:4,names:[],key:WP.key+'_kart_bat',id:'bat',n:'Recinto de globos',cuts:[],ramps:[],fords:[]}; }
function kbBatGrid(slot){ const A=KART.ar, a=(slot%8)/8*2*Math.PI, r=A.R*0.72; return {x:A.x+Math.cos(a)*r,z:A.z+Math.sin(a)*r,yaw:a+Math.PI}; }
function kbArenaProps(){ const A=KART.ar, M=kartMats(), T0=(x,z)=>terrainAt(x,z); KART.gates=[]; KART.pads=[]; KART.puddles=[]; KART.boxes=[]; KART.coinsM=[];
  // the fence: a red post and an orange cone, alternating, all the way round
  const n=Math.round(2*Math.PI*A.R/3.2), im=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.14,0.14,1.6,6),M.pole,n), im2=new THREE.InstancedMesh(new THREE.ConeGeometry(0.3,0.8,8),M.cone,n), o=new THREE.Object3D();
  for(let k=0;k<n;k++){ const a=k/n*2*Math.PI, x=A.x+Math.cos(a)*A.R, z=A.z+Math.sin(a)*A.R; o.position.set(x,T0(x,z)+0.8,z); o.updateMatrix(); im.setMatrixAt(k,o.matrix);
    const a2=a+Math.PI/n, x2=A.x+Math.cos(a2)*A.R, z2=A.z+Math.sin(a2)*A.R; o.position.set(x2,T0(x2,z2)+0.4,z2); o.updateMatrix(); im2.setMatrixAt(k,o.matrix); }
  im.frustumCulled=false; im2.frustumCulled=false; kartAdd(im); kartAdd(im2);
  const box=(x,z)=>{ const m=new THREE.Mesh(M.boxG,M.box); m.position.set(x,T0(x,z)+1.2,z); kartAdd(m); KART.boxes.push({x,z,m,t:0}); };
  for(let k=0;k<8;k++){ const a=k/8*2*Math.PI+0.39, r=A.R*(k%2?0.42:0.6); box(A.x+Math.cos(a)*r,A.z+Math.sin(a)*r); } box(A.x,A.z);
  KART.pads=[0,Math.PI].map(a=>{ const x=A.x+Math.cos(a)*A.R*0.3, z=A.z+Math.sin(a)*A.R*0.3, m=new THREE.Mesh(M.padG,M.pad); m.rotation.order='YXZ'; m.rotation.set(-Math.PI/2,0,0); m.rotation.y=-a-Math.PI; m.position.set(x,T0(x,z)+0.12,z); kartAdd(m); return {x,z}; });
  KART.beam=kartAdd(new THREE.Mesh(new THREE.CylinderGeometry(0.7,0.7,45,12,1,true),M.beam)); KART.beam.visible=false;
  KART.fx=kartFx(120,0.24,9); KART.conf=kartFx(280,0.34,3.5); }
function kbBatRank(){ const out=[{n:'Tú',me:true,bal:Math.max(0,KART.bal),hits:KART.hits,out:KART.out}]; for(const B of KART.bots) out.push({n:B.n,bot:true,bal:Math.max(0,B.bal),hits:B.hits,out:B.out});
  for(const p of MP.peers.values()){ const s=p.out; if(s&&s.kr===KART.rid&&Array.isArray(s.kp)) out.push({n:p.n||'Amigo',bal:Math.max(0,s.kp[0]|0),hits:s.kp[1]|0,out:s.kp[2]?1:0}); }
  out.sort((a,b)=>(b.bal>0?1:0)-(a.bal>0?1:0)||b.bal-a.bal||(a.bal>0?b.hits-a.hits:(b.out||0)-(a.out||0)||b.hits-a.hits)); return out; }
function kbBatEnd(now){ if(KART.done) return; KART.done=true; KART.fin=Math.max(1,now-KART.t0); const rk=kbBatRank(), pos=rk.findIndex(r=>r.me)+1; KART.pos=pos;
  toast(pos===1?'¡Has ganado la batalla!':KART.bal>0?'Se acabó el tiempo: '+pos+'.º':'Sin globos: '+pos+'.º','Dianas: '+KART.hits); blip('gold'); prgEvt('kbat',{pos,n:rk.length}); KART.podT=1.6; }
function kbBatMe(b,dt,now){ const A=KART.ar; const dx=b.x-A.x, dz=b.z-A.z, d=Math.hypot(dx,dz); if(d>A.R-1.3){ b.x=A.x+dx/d*(A.R-1.3); b.z=A.z+dz/d*(A.R-1.3); if(b.speed>5) b.speed*=Math.exp(-4*dt); }
  KART.offT=0; KART.idx=0; KART.s=0; if(KART.inv>0) KART.inv-=dt; if(KART.done||KART.lock) return;
  let alive=0, seen=0; for(const B of KART.bots){ seen++; if(!B.out) alive++; } for(const p of MP.peers.values()){ const s=p.out; if(s&&s.kr===KART.rid&&Array.isArray(s.kp)){ seen++; if(s.kp[0]>0&&!s.kp[2]) alive++; } } KART.seen=Math.max(KART.seen,seen);
  if(KART.bal<=0){ KART.out=now; kbBatEnd(now); } else if((KART.seen>0&&alive===0&&now>KART.go+3000)||now>KART.go+KB_BAT_MS) kbBatEnd(now); }
// the bots of the battle drive freely: to the nearest box when they carry nothing, to the nearest rival when they do
function kbBatBots(dt,now){ const A=KART.ar, acts=kbActs();
  KART.bots.forEach((B,k)=>{ if(B.out) return; const id='b'+k; if(B.inv>0) B.inv-=dt;
    if(KART.lock){ placeBuggyMesh(B); kartBotRig(B); kgFx(B.g,{bal:B.bal},dt); return; }
    let tx=A.x, tz=A.z, td=1e9, foe=null, fd=1e9; for(const a of acts){ if(a.id===id||a.out) continue; const d=Math.hypot(a.x-B.x,a.z-B.z); if(d<fd){ fd=d; foe=a; } }
    if(B.item&&foe){ tx=foe.x; tz=foe.z; } else { for(const X of KART.boxes) if(X.t<=0){ const d=Math.hypot(X.x-B.x,X.z-B.z); if(d<td){ td=d; tx=X.x; tz=X.z; } } }
    if(Math.hypot(B.x-A.x,B.z-A.z)>A.R-6){ tx=A.x; tz=A.z; }
    const d=kbWrap(Math.atan2(tz-B.z,tx-B.x)-B.yaw); let tv=KART.done?0:[8.5,10,11.5][KART.x.bs];
    if(B.gold>0){ B.gold-=dt; tv=15; } if(B.boost>0){ B.boost-=dt; tv=16; } if(B.sandT>0){ B.sandT-=dt; tv=3; } if(B.spin>0){ B.spin-=dt; tv=1.5; } if(B.shield>0) B.shield-=dt;
    B.v+=(tv-B.v)*(1-Math.exp(-dt*1.5)); if(B.spin>0) B.yaw+=9*dt; else B.yaw+=clamp(d*2,-1,1)*1.7*dt*Math.min(1,B.v/4+0.3);
    B.x+=Math.cos(B.yaw)*B.v*dt; B.z+=Math.sin(B.yaw)*B.v*dt; { const dx=B.x-A.x, dz=B.z-A.z, r=Math.hypot(dx,dz); if(r>A.R-1.5){ B.x=A.x+dx/r*(A.R-1.5); B.z=A.z+dz/r*(A.R-1.5); } }
    KART.bots.forEach((O,j)=>{ if(j===k||O.out) return; const dx=B.x-O.x, dz=B.z-O.z, r=Math.hypot(dx,dz); if(r<2.1&&r>0.01){ B.x+=dx/r*(2.1-r)/2; B.z+=dz/r*(2.1-r)/2; } });
    const AC={B,id}; kartHazards(B,w=>{ if(w==='ball') kbHit(AC,'bola'); else if(w==='sand') kbHit(AC,'arena'); else if(w==='pad') B.boost=1.5; });
    if(B.gold>0&&P.buggy&&Math.hypot(B.x-P.buggy.x,B.z-P.buggy.z)<2.3&&kbHit({me:true,id:'me'},'dorado',id)) B.hits++;
    if(!B.item&&!KART.done) for(const X of KART.boxes) if(X.t<=0&&Math.hypot(B.x-X.x,B.z-X.z)<2.2){ X.t=6; X.m.visible=false; B.item=kbRoll(0.5,true); B.itemT=0.8+Math.random()*2.5; break; }
    if(B.item&&B.spin<=0&&!KART.done){ B.itemT-=dt; const it=B.item, aim=foe?Math.abs(kbWrap(Math.atan2(foe.z-B.z,foe.x-B.x)-B.yaw)):9;
      if(it==='bola'?((B.itemT<=0&&foe&&fd<30&&aim<0.16)||B.itemT<-6):B.itemT<=0){ B.item=0; kbFire(id,it,B.x,B.z,B.yaw); } }
    placeBuggyMesh(B); kartBotRig(B); kgFx(B.g,{sh:B.shield>0,gold:B.gold>0,cloud:false,bal:B.bal},dt); }); }
