/* ================= búsqueda del tesoro y álbum de cromos (J4b, solo Valdecañas con WP.kids.tesoro) ================= */
// Nombres ts*, estado TS. Doce cofres en sitios de la isla, cada uno con su pista: el mapa marca una zona (no el sitio exacto) y un medidor dice si
// vas frío o caliente. Cada cofre da el cromo de su sitio; los cromos de animales se ganan con los animales (caballos, patos, ciervos, conejos,
// grullas, peces y tu perro). Medallas de explorador: bronce con 4 cofres, plata con 8 y oro con los 12.
const TS_PLACES=[
  {id:'hotel',n:'El hotel',ic:'🏨',pista:'Donde se duerme y se cena: busca cerca de la puerta grande, la que mira al norte.',txt:'El hotel de la isla tiene recepción, bar, terraza y el restaurante Ribereño.',at:W=>W.HOT_B?[(W.HOT_B.x0+W.HOT_B.x1)/2+24,W.HOT_B.z0-14]:[W.HOT[0]+24,W.HOT[1]-26]},
  {id:'heli',n:'El helipuerto',ic:'🚁',pista:'Donde aterrizan los helicópteros, muy cerca del hotel.',txt:'La H grande del suelo dice a los pilotos dónde posarse.',at:()=>{ const p=FL.pads&&FL.pads[0]; return p?[p.x+9,p.z+3]:null; }},
  {id:'mini',n:'El minigolf loco',ic:'⛳',pista:'Junto al molino que nunca muele trigo.',txt:'Nueve hoyos locos con molino, looping, río y volcán. El par de todos juntos es 24.',at:()=>MG.ok&&MG.H[1]?(()=>{ const w=mgW(MG.H[1],-2.2,5.2,0); return [w.x,w.z]; })():null},
  {id:'playa',n:'La playa',ic:'🏖️',pista:'Donde la arena toca el agua tranquila de la laguna.',txt:'Una playa de arena en una laguna separada del embalse.',at:(W,WP)=>WP.nautica&&WP.nautica.beach?[WP.nautica.beach[0]+70,WP.nautica.beach[1]-55]:[-1180,445]},
  {id:'ruinas',n:'Las piedras antiguas',ic:'🏛️',pista:'Entre piedras talladas más viejas que los abuelos de tus abuelos.',txt:'Al llenarse el embalse quedaron bajo el agua caminos y el pueblo de Talavera la Vieja.',at:(W,WP)=>WP.ruins&&WP.ruins[0]?[WP.ruins[0][0]+8,WP.ruins[0][1]-14]:null},
  {id:'bike',n:'El bike park',ic:'🚲',pista:'Donde las bicis saltan por lomas y medio tubo.',txt:'En el pump track se avanza sin pedalear: empujando en cada bajada.',at:()=>BK.pk?(()=>{ const w=bkPkW(-6,25); return [w[0],w[1]]; })():null},
  {id:'marina',n:'El pantalán',ic:'⚓',pista:'Donde amarran las lanchas y las motos de agua.',txt:'Del pantalán salen las lanchas, las motos de agua y los esquiadores.',at:(W,WP)=>WP.pier?[WP.pier.A[0]-14,WP.pier.A[1]-6]:null},
  {id:'cumbre',n:'La cumbre',ic:'⛰️',pista:'En lo más alto de la isla, donde pastan los caballos.',txt:'El punto más alto de la isla: desde aquí se ve casi todo el embalse.',at:()=>TS.top||null},
  {id:'tirolina',n:'La tirolina',ic:'🪂',pista:'Al pie de la torre desde la que se baja colgado hasta el agua.',txt:'Una polea rueda por el cable desde la loma hasta el embalse.',at:()=>OXF.zip?[OXF.zip.base[0],OXF.zip.base[1]]:null},
  {id:'piscina',n:'La piscina del tobogán',ic:'🛝',pista:'Junto al tobogán que acaba en el agua.',txt:'Tobogán en espiral y trampolín: al agua de pie o con voltereta.',at:()=>OXF.pool?OXF.pool.chest:null},
  {id:'green9',n:'El green del 9',ic:'🚩',pista:'Junto a la bandera del hoyo 9, el último de la ida.',txt:'El hoyo 9 cierra la ida del recorrido de 18 hoyos.',at:W=>{ const H=W.HOLES&&W.HOLES[8]; return H?[H.pin[0]+16,H.pin[1]+10]:null; }},
  {id:'patos',n:'La laguna de los patos',ic:'🦆',pista:'Donde nadan los patitos en fila detrás de su madre.',txt:'Los patos viven en la laguna, junto a la playa.',at:()=>AN.home?AN.shore:null}];
const TS_ANIMALS=[
  {id:'caballo',n:'Caballo',ic:'🐴',how:'Dale una zanahoria a un caballo.',txt:'Los caballos pueden dormir de pie.'},
  {id:'pato',n:'Pato',ic:'🦆',how:'Échales pan a los patos de la laguna.',txt:'Los patitos siguen en fila a su madre desde que nacen.'},
  {id:'ciervo',n:'Ciervo',ic:'🦌',how:'Acércate a un ciervo (a menos de 20 m) sin asustarlo.',txt:'Los machos pierden las cuernas cada año y les salen otras nuevas.'},
  {id:'conejo',n:'Conejo',ic:'🐇',how:'Acércate a un conejo (a menos de 12 m).',txt:'Avisan del peligro golpeando el suelo con las patas de atrás.'},
  {id:'grulla',n:'Grulla',ic:'🪽',how:'Pasa por debajo de una bandada de grullas.',txt:'Las grullas pasan el invierno en Extremadura y viajan en forma de V.'},
  {id:'pez',n:'Pez del embalse',ic:'🐟',how:'Pesca un pez desde el muelle.',txt:'En el embalse del Tajo hay carpas y otros peces de agua dulce.'},
  {id:'perro',n:'Perro',ic:'🐶',how:'Tu perro te trae 5 pelotas.',txt:'Un perro huele miles de veces mejor que nosotros.'}];
const TS_ALL=TS_PLACES.length+TS_ANIMALS.length;
var TS={ok:false,list:[],f:[],c:{},act:null,top:null,grp:null,hudT:0,chk:0,openT:0,beam:null};
function tsLoad(){ try{ const o=JSON.parse(store.get('vg_ts')||'{}')||{}; TS.f=Array.isArray(o.f)?o.f.filter(x=>typeof x==='string'):[]; TS.c=o.c&&typeof o.c==='object'?o.c:{}; TS.act=typeof o.act==='string'?o.act:null; }catch(e){} }
function tsSave(){ store.set('vg_ts',JSON.stringify({f:TS.f,c:TS.c,act:TS.act})); }
// a dry, free place near (x, z) for a chest: not water, building, tree, green, tee or bunker
function tsSpot(x,z){ for(let r=0;r<=30;r+=1.5) for(let k=0;k<(r?12:1);k++){ const a=k/12*Math.PI*2+r, px=x+Math.cos(a)*r, pz=z+Math.sin(a)*r, g=terrainAt(px,pz);
    if(W.waterLevel(px,pz)>g-0.2||W.poolAt(px,pz)||bldAt(px,pz,1.2)) continue; const s=W.surfAt(px,pz); if(s>=4&&s<=7) continue; if(Math.hypot(px-x,pz-z)>0&&MG.ok&&mgGroundAt(px,pz)!==null&&Math.abs(mgPUV(px,pz)[1])<MG_PV) continue;
    const tr=treeGrid.get(Math.floor(px/20)+','+Math.floor(pz/20)); let bad=false; if(tr) for(const t of tr) if(Math.hypot(px-t.x,pz-t.z)<t.tr+0.8){ bad=true; break; } if(bad) continue; return [px,pz]; }
  return null; }
function tsChestMesh(){ const g=new THREE.Group(), wood=new THREE.MeshLambertMaterial({color:Cc('#8a5a2e')}), band=new THREE.MeshLambertMaterial({color:Cc('#e2b23c'),emissive:Cc('#3a2a00')});
  const box=new THREE.Mesh(new THREE.BoxGeometry(0.9,0.5,0.6),wood); box.position.y=0.25; box.castShadow=true; g.add(box);
  for(const x of [-0.3,0.3]){ const b=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.52,0.62),band); b.position.set(x,0.25,0); g.add(b); }
  const lid=new THREE.Group(); lid.position.set(0,0.5,-0.3); g.add(lid); const lm=new THREE.Mesh(new THREE.CylinderGeometry(0.3,0.3,0.9,12,1,false,0,Math.PI),wood); lm.rotation.set(0,0,Math.PI/2); lm.position.set(0,0,0.3); lm.castShadow=true; lid.add(lm);
  for(const x of [-0.3,0.3]){ const b=new THREE.Mesh(new THREE.CylinderGeometry(0.31,0.31,0.07,12,1,false,0,Math.PI),band); b.rotation.set(0,0,Math.PI/2); b.position.set(x,0,0.3); lid.add(b); }
  const lock=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.14,0.04),band); lock.position.set(0,0.42,0.31); g.add(lock);
  const gold=new THREE.Mesh(new THREE.SphereGeometry(0.26,10,6,0,Math.PI*2,0,Math.PI/2),new THREE.MeshLambertMaterial({color:Cc('#f2c94c'),emissive:Cc('#7a5a00')})); gold.position.y=0.46; gold.scale.set(1.4,0.5,0.9); gold.visible=false; g.add(gold);
  g.userData={lid,gold}; return g; }
// built while loading, after the minigolf and the outdoor fun (it puts chests next to them) and before the trees
function buildTesoro(){ if(!WP.kids||!WP.kids.tesoro) return; tsLoad();
  let best=null; for(let z=-1000;z<=900;z+=20) for(let x=-1300;x<=780;x+=20){ const t=W.terrain(x,z); if(t<W.waterLevel(x,z)+1||bldAt(x,z,2)) continue; if(!best||t>best[2]) best=[x,z,t]; } TS.top=best?[best[0]+6,best[1]+8]:null;
  TS.grp=new THREE.Group(); scene.add(TS.grp);
  for(const pl of TS_PLACES){ let p=null; try{ p=pl.at(W,WP); }catch(e){ p=null; } if(!p) continue; const s=tsSpot(p[0],p[1]); if(!s) continue; const m=tsChestMesh(), y=groundAt(s[0],s[1],terrainAt(s[0],s[1])+3);
    m.position.set(s[0],y,s[1]); m.rotation.y=Math.random()*6.28; TS.grp.add(m); TREE_EXCL.push([s[0]-1.5,s[0]+1.5,s[1]-1.5,s[1]+1.5]);
    const h=(pl.id.charCodeAt(0)*37+pl.id.length*91)%360*Math.PI/180, off=10+(pl.id.charCodeAt(1)%14); // the zone on the map: not centred on the chest
    TS.list.push({pl,x:s[0],y,z:s[1],m,zx:s[0]+Math.cos(h)*off,zz:s[1]+Math.sin(h)*off,open:TS.f.includes(pl.id)}); }
  for(const C of TS.list) if(C.open){ C.m.userData.lid.rotation.x=-1.9; C.m.userData.gold.visible=false; }
  if(TS.act&&!TS.list.find(C=>C.pl.id===TS.act&&!C.open)) TS.act=null;
  TS.beam=new THREE.Mesh(new THREE.CylinderGeometry(0.5,0.5,30,12,1,true),new THREE.MeshBasicMaterial({color:Cc('#ffd54a'),transparent:true,opacity:0.35,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending})); TS.beam.visible=false; scene.add(TS.beam);
  TS.ok=TS.list.length>0; }
function tsActive(){ return TS.act?TS.list.find(C=>C.pl.id===TS.act&&!C.open)||null:null; }
function tsFollow(id){ TS.act=id; tsSave(); const C=tsActive(); if(C){ toast('Pista: '+C.pl.n.replace(/^El |^La |^Las /,'').replace(/^./,c=>c.toUpperCase()),C.pl.pista); } tsHud(); }
function tsNext(){ const C=TS.list.find(C=>!C.open); TS.act=C?C.pl.id:null; tsSave(); }
function tsHeat(d){ return d<8?['¡Lo tienes al lado!','#d6442a']:d<20?['¡Quema!','#e8742c']:d<45?['Caliente','#f2994a']:d<100?['Templado','#c9a227']:d<220?['Frío','#2f80ed']:['Helado','#1f4e8c']; }
function tsHud(){ const e=$('tsHud'); if(!e) return; const C=tsActive(), show=TS.ok&&C&&['walk','drive','ride','bike','jet','fly'].includes(S.mode)&&!raceNow(); e.hidden=!show; if(!show) return;
  const d=Math.hypot(P.x-C.x,P.z-C.z), h=tsHeat(d); let arrow=''; if(ezOn()&&d>6){ const a=Math.atan2(C.z-P.z,C.x-P.x)-camS.yaw; arrow='<i class="tsArr" style="transform:rotate('+(a*180/Math.PI)+'deg)">➤</i>'; }
  e.innerHTML='<b>🗺️ '+esc(C.pl.pista)+'</b><span style="color:'+h[1]+'">'+arrow+h[0]+'</span>'; }
// a cromo as a picture: a coloured card with the icon, the number, the name and a fact
function tsCromoTex(it,animal,num){ const c=document.createElement('canvas'); c.width=300; c.height=420; const g=c.getContext('2d'), col=animal?'#2f9e44':'#2f6bd6';
  g.fillStyle='#fffaf0'; g.fillRect(0,0,300,420); g.fillStyle=col; g.fillRect(0,0,300,64); g.fillRect(0,0,12,420); g.fillRect(288,0,12,420); g.fillRect(0,408,300,12);
  g.fillStyle='#fff'; g.font='800 26px Figtree, system-ui, sans-serif'; g.textBaseline='middle'; g.fillText(it.n,24,34); g.font='800 20px Figtree, system-ui, sans-serif'; g.textAlign='right'; g.fillText(num+'/'+TS_ALL,278,34); g.textAlign='center';
  g.fillStyle=animal?'#e8f6ea':'#e8f0fd'; g.beginPath(); g.arc(150,170,88,0,7); g.fill(); g.font='110px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; g.fillText(it.ic,150,178);
  g.fillStyle='#16231b'; g.font='600 17px Figtree, system-ui, sans-serif'; const words=it.txt.split(' '); let line='', y=300; for(const w of words){ const t=line?line+' '+w:w; if(g.measureText(t).width>246){ g.fillText(line,150,y); y+=24; line=w; } else line=t; } g.fillText(line,150,y);
  g.fillStyle=col; g.font='800 14px Figtree, system-ui, sans-serif'; g.fillText(animal?'ANIMALES DE LA ISLA':'SITIOS DE LA ISLA',150,392); return c; }
function tsCromo(id){ if(!TS.ok||TS.c[id]) return false; const pl=TS_PLACES.find(p=>p.id===id), an=TS_ANIMALS.find(a=>a.id===id); if(!pl&&!an) return false;
  TS.c[id]=Date.now(); tsSave(); const n=Object.keys(TS.c).length; prgEarn(an?3:0,'Cromo nuevo: '+(pl||an).n); tsShowCard(pl||an,!!an,tsNum(id));
  if(n>=TS_ALL) prgTrophy('album'); if(MP.code) mpHello(); return true; }
function tsNum(id){ const i=TS_PLACES.findIndex(p=>p.id===id); return i>=0?i+1:TS_PLACES.length+TS_ANIMALS.findIndex(a=>a.id===id)+1; }
function tsShowCard(it,animal,num){ const o=$('tsCard'); if(!o) return; if(S.mode==='ox'||S.mode==='mini'||S.mode==='sled'||raceNow()){ (TS.q=TS.q||[]).push([it,animal,num]); return; } const cv=tsCromoTex(it,animal,num); cv.style.width='200px'; cv.style.height='280px'; $('tsCardImg').innerHTML=''; $('tsCardImg').appendChild(cv); $('tsCardT').textContent='¡Cromo nuevo! '+num+' de '+TS_ALL; o.hidden=false; clearTimeout(TS.cardT); TS.cardT=setTimeout(()=>{ o.hidden=true; },4200); blip('gold'); }
// walking up to a closed chest: «Abrir el cofre»
function tsNear(){ if(!TS.ok||S.mode!=='walk') return null; for(const C of TS.list){ if(C.open) continue; if(Math.hypot(P.x-C.x,P.z-C.z)<2.3&&Math.abs(P.y-C.y)<2) return {k:'tsOpen',ref:C,label:typeof meTsLabel==='function'?meTsLabel():'Abrir el cofre'}; } return null; }
function tsOpen(C,bonus){ if(!C||C.open) return; if(bonus===undefined&&typeof meTsLock==='function'&&meTsLock(C)) return; C.open=true; C.t=0; TS.f.push(C.pl.id); ensureAudio(); blip('gold'); const n=TS.f.length;
  prgEarn(5+(bonus||0),'Cofre: '+C.pl.n); toast('¡Tesoro! '+C.pl.n,'Cofre '+n+' de '+TS.list.length); P.cheerT=1.6; if(TS.act===C.pl.id) tsNext(); else tsSave();
  setTimeout(()=>tsCromo(C.pl.id),900);
  const med=n===4?'bronce':n===8?'plata':n===TS.list.length?'oro':''; if(med) setTimeout(()=>{ toast('Medalla de explorador de '+med,n+' cofres encontrados'); blip('cup'); },5200); if(n===TS.list.length) prgTrophy('tesoro');
  if(MP.code) mpHello(); }
// every frame: lids, the light over the chest of the clue, the animals for the album, the clue on screen
function tsTick(dt){ if(TS.q&&TS.q.length&&$('tsCard').hidden&&S.mode!=='ox'&&S.mode!=='mini'&&S.mode!=='sled'&&!raceNow()){ const q=TS.q.shift(); tsShowCard(q[0],q[1],q[2]); } if(!TS.ok) return; for(const C of TS.list){ if(C.open&&C.t!==undefined&&C.t<1.5){ C.t+=dt; const L=C.m.userData.lid; L.rotation.x=-1.9*Math.min(1,C.t/0.7); C.m.userData.gold.visible=C.t<1.4; } }
  const A=tsActive(), d=A?Math.hypot(P.x-A.x,P.z-A.z):1e9; TS.beam.visible=!!A&&d<(ezOn()?60:22)&&S.mode!=='menu'; if(TS.beam.visible){ TS.beam.position.set(A.x,A.y+15,A.z); TS.beam.material.opacity=0.22+0.12*Math.sin(performance.now()/300); }
  TS.hudT-=dt; if(TS.hudT<=0){ TS.hudT=0.3; tsHud(); }
  TS.chk-=dt; if(TS.chk<=0&&S.mode!=='menu'){ TS.chk=0.5;
    for(const o of WILD){ const d2=Math.hypot(o.x-P.x,o.z-P.z); if(o.kind==='deer'&&d2<20) tsCromo('ciervo'); else if(o.kind!=='deer'&&d2<12) tsCromo('conejo'); }
    for(const fl of birds){ if(fl.pos&&Math.hypot(fl.pos[0]-P.x,fl.pos[2]-P.z)<140) tsCromo('grulla'); }
    if(typeof DG!=='undefined'&&DG.n>=5) tsCromo('perro'); } }
/* ---- with the room: how many chests and cromos (ts) ---- */
function tsNetState(o){ if(TS.ok&&(TS.f.length||Object.keys(TS.c).length)) o.tz=[TS.f.length,Object.keys(TS.c).length]; }
function tsOKNet(a){ return Array.isArray(a)&&a.length===2&&a.every(v=>Number.isFinite(v)&&v>=0&&v<100)?a:null; }
function tsRank(){ const L=[{n:'Tú',f:TS.f.length,c:Object.keys(TS.c).length,me:1}]; if(MP.code) for(const p of MP.peers.values()){ const s=p.out||p.cur; if(s&&s.tz) L.push({n:p.n||'Amigo',f:s.tz[0],c:s.tz[1]}); } L.sort((a,b)=>b.f-a.f||b.c-a.c); return L; }
/* ---- map, legend, guide, glossary and the two tabs (treasure, cromos) ---- */
function tsDrawMap(g,m2c,s,big){ if(!TS.ok) return; g.save(); const A=tsActive();
  if(A){ const [x,y]=m2c(A.zx,A.zz), [x2]=m2c(A.zx+(ezOn()?30:55),A.zz); g.strokeStyle='#d4a017'; g.fillStyle='rgba(255,213,74,.18)'; g.lineWidth=2*s; g.setLineDash([5*s,4*s]); g.beginPath(); g.arc(x,y,Math.abs(x2-x),0,7); g.fill(); g.stroke(); g.setLineDash([]); if(big){ g.fillStyle='#7a5a00'; g.font='800 '+(7*s)+'px system-ui, sans-serif'; g.textAlign='center'; g.fillText('¿Tesoro?',x,y); } }
  for(const C of TS.list){ if(!C.open) continue; const [x,y]=m2c(C.x,C.z), r=(big?3.4:2.4)*s; g.strokeStyle='#b23b2a'; g.lineWidth=1.8*s; g.beginPath(); g.moveTo(x-r,y-r); g.lineTo(x+r,y+r); g.moveTo(x+r,y-r); g.lineTo(x-r,y+r); g.stroke(); }
  g.restore(); }
function tsLegend(){ if(!TS.ok) return ''; return '<div><i style="background:rgba(255,213,74,.25);border:2px dashed #d4a017;border-radius:50%"></i>Zona de la pista que sigues: el cofre está por ahí dentro'+(ezOn()?' (en modo fácil la zona es más pequeña)':'')+'</div><div><i style="background:transparent;border:0;color:#b23b2a;font-weight:900;font-style:normal;text-align:center;line-height:12px">✕</i>Cofre ya abierto</div>'; }
function tsGuideHTML(){ if(!TS.ok) return ''; return '<li><b>Búsqueda del tesoro</b> (pestaña <b>Tesoro</b> de «Para los peques»): '+TS.list.length+' cofres escondidos por la isla, cada uno con su pista. Elige una con <b>Seguir esta pista</b>: arriba sale la pista y si vas <b>frío</b>, <b>templado</b>, <b>caliente</b> o <b>¡quema!</b>, y en el mapa un círculo de rayas marca la zona (el cofre está dentro, no en el centro). A menos de 20 m sale una columna de luz dorada. Junto al cofre, <b>Abrir el cofre</b>: 5 monedas y el <b>cromo</b> de ese sitio. Medallas de explorador con 4, 8 y '+TS.list.length+' cofres. En modo fácil la zona es más pequeña y una flecha te guía.</li><li><b>Álbum de cromos</b> (pestaña <b>Cromos</b>): '+TS_ALL+' cromos, '+TS_PLACES.length+' de sitios (los cofres) y '+TS_ANIMALS.length+' de animales, que se ganan con ellos: zanahoria a un caballo, pan a los patos, acercarte a un ciervo o a un conejo, pasar bajo las grullas, pescar un pez y jugar a la pelota con tu perro.</li>'; }
function tsGlossHTML(){ return '<dt>Pista</dt><dd>La frase que dice dónde está un cofre sin decirlo del todo. El medidor de arriba dice si te acercas (caliente) o te alejas (frío).</dd><dt>Cromo</dt><dd>Una tarjeta con el dibujo y un dato de un sitio o un animal de la isla. Se guardan en el álbum.</dd><dt>Medalla de explorador</dt><dd>Bronce con 4 cofres, plata con 8 y oro con todos.</dd>'; }
function tsTabHTML(){ if(!TS.ok) return '<p>La búsqueda del tesoro no está en este mundo.</p>'; const n=TS.f.length, N=TS.list.length, med=n>=N?'🥇 oro':n>=8?'🥈 plata':n>=4?'🥉 bronce':'aún ninguna';
  let h='<p>Hay <b>'+N+' cofres</b> escondidos por la isla. Cada uno tiene una <b>pista</b>: elige una, mira la zona en el mapa y busca. Arriba verás si vas frío o caliente. Has abierto <b>'+n+' de '+N+'</b> · medalla de explorador: <b>'+med+'</b>.</p>';
  h+='<div class="tablewrap"><table class="card"><thead><tr><th></th><th>Pista</th><th></th></tr></thead><tbody>'+TS.list.map(C=>'<tr'+(C.pl.id===TS.act?' style="background:#fff7dd"':'')+'><td>'+(C.open?C.pl.ic:'❓')+'</td><td>'+(C.open?'<b>'+esc(C.pl.n)+'</b> · ':'')+esc(C.pl.pista)+'</td><td>'+(C.open?'Abierto':(C.pl.id===TS.act?'<b>La sigues</b>':'<button class="btn small" data-tsf="'+C.pl.id+'">Seguir esta pista</button>'))+'</td></tr>').join('')+'</tbody></table></div>';
  const R=tsRank(); if(R.length>1) h+='<h3>Con la sala</h3><div class="tablewrap"><table class="card"><thead><tr><th>Jugador</th><th>Cofres</th><th>Cromos</th></tr></thead><tbody>'+R.map(r=>'<tr><td>'+esc(r.n)+'</td><td class="num">'+r.f+'</td><td class="num">'+r.c+'</td></tr>').join('')+'</tbody></table></div>';
  h+='<h3>Cómo se lee</h3><ul><li><b>Arriba</b>: la pista que sigues y la temperatura: helado, frío, templado, caliente, ¡quema! y ¡lo tienes al lado!</li><li><b>Mapa</b>: el círculo de rayas amarillo es la zona de la pista (el cofre está dentro, no justo en el centro); las ✕ rojas, los cofres ya abiertos.</li><li><b>Columna de luz dorada</b>: sale a menos de 20 m del cofre (60 m en modo fácil, con flecha).</li></ul>';
  return h; }
function tsAlbumHTML(){ if(!TS.ok) return ''; const n=Object.keys(TS.c).length; let h='<p>Llevas <b>'+n+' de '+TS_ALL+'</b> cromos. Los de sitios salen en los cofres; los de animales, jugando con ellos. Toca un cromo para verlo grande.</p><div class="tsAlb">';
  const cell=(it,an)=>{ const has=!!TS.c[it.id], num=tsNum(it.id); return '<button class="tsC'+(has?' on':'')+(an?' an':'')+'" data-tsc="'+it.id+'"><span class="ic">'+(has?it.ic:'❔')+'</span><b>'+num+'. '+(has?esc(it.n):'???')+'</b><small>'+(has?'':esc(an?it.how:'Está en un cofre'))+'</small></button>'; };
  h+=TS_PLACES.map(p=>cell(p,false)).join('')+TS_ANIMALS.map(a=>cell(a,true)).join('')+'</div>'+(PRG.tro.album?'<p class="note">¡Álbum completo! Trofeo «Álbum completo» en tu vitrina.</p>':''); return h; }
function tsTabWire(){ document.querySelectorAll('[data-tsf]').forEach(b=>b.onclick=()=>{ tsFollow(b.dataset.tsf); kdSheet('tesoro'); });
  document.querySelectorAll('[data-tsc]').forEach(b=>b.onclick=()=>{ const id=b.dataset.tsc; if(!TS.c[id]) return; const pl=TS_PLACES.find(p=>p.id===id), an=TS_ANIMALS.find(a=>a.id===id); tsShowCard(pl||an,!!an,tsNum(id)); $('tsCardT').textContent=(pl||an).n+' · '+tsNum(id)+' de '+TS_ALL; }); }
{ const o=$('tsCard'); if(o) o.onclick=()=>{ o.hidden=true; }; }
