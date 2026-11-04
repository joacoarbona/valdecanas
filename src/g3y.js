
/* ================= motivos para volver: monedas, tienda, vitrina de trofeos, circuitos (boyas, slalom, caballos) y torneo familiar ================= */
// ---- progress: coins and unlocks live in this browser and are shared by both worlds; each trophy remembers where and by whom it was won
const PRG={coins:0,earned:0,own:{},eq:{},tro:{},log:[]};
const PRG_SLOTS={camisa:'Camisa',pantalon:'Pantalón',gorro:'Gorra o sombrero',palos:'Palos',bola:'Bola'};
const SHOP=[
  {id:'c-blanco',slot:'camisa',n:'Polo blanco',p:40,c:'#f4f3ef'},
  {id:'c-marino',slot:'camisa',n:'Polo azul marino',p:40,c:'#1f2f4f'},
  {id:'c-rosa',slot:'camisa',n:'Polo rosa',p:50,c:'#e88aa8'},
  {id:'c-jersey',slot:'camisa',n:'Jersey del club',p:90,c:'#2a4a7a',jersey:1},
  {id:'c-verde',slot:'camisa',n:'Chaqueta verde de campeón',req:'campeon',c:'#1c6b3a',jersey:1},
  {id:'p-blanco',slot:'pantalon',n:'Pantalón blanco',p:30,c:'#f1eee6'},
  {id:'p-caqui',slot:'pantalon',n:'Pantalón caqui',p:30,c:'#c9b48a'},
  {id:'p-rojo',slot:'pantalon',n:'Pantalón rojo',p:60,c:'#b8322a'},
  {id:'g-sin',slot:'gorro',n:'Sin gorra',p:0,hat:'none',c:'#e9e4da'},
  {id:'g-blanca',slot:'gorro',n:'Gorra blanca',p:30,hat:'gorra',c:'#ffffff'},
  {id:'g-visera',slot:'gorro',n:'Visera azul',p:40,hat:'visera',c:'#2a6f87'},
  {id:'g-panama',slot:'gorro',n:'Sombrero de paja',p:80,hat:'sombrero',c:'#e2cf9a'},
  {id:'g-oro',slot:'gorro',n:'Gorra dorada',p:150,hat:'gorra',c:'#d4a72c'},
  {id:'pl-negro',slot:'palos',n:'Negro mate',p:60,cs:'#2b2d30',ch:'#141516',c:'#2b2d30'},
  {id:'pl-madera',slot:'palos',n:'Cabeza de madera',p:80,cs:'#cfd3d6',ch:'#8a5a32',c:'#8a5a32'},
  {id:'pl-azul',slot:'palos',n:'Carbono azul',p:100,cs:'#2a4f87',ch:'#c9cccf',c:'#2a4f87'},
  {id:'pl-oro',slot:'palos',n:'Palos dorados',p:220,cs:'#d4a72c',ch:'#d4a72c',c:'#d4a72c'},
  {id:'b-amarilla',slot:'bola',n:'Bola amarilla',p:25,c:'#f2e14c'},
  {id:'b-naranja',slot:'bola',n:'Bola naranja',p:25,c:'#ff8a2a'},
  {id:'b-rosa',slot:'bola',n:'Bola rosa',p:30,c:'#ff7fb0'},
  {id:'b-azul',slot:'bola',n:'Bola azul',p:30,c:'#59a8ff'},
  {id:'b-oro',slot:'bola',n:'Bola dorada',req:'doradas',c:'#e8c04a',glow:1}];
// m: metal of the cup (g oro, s plata, b bronce); c: coins it gives; w: what the world needs to have it
const TRO=[
  {id:'birdie',n:'Primer birdie',how:'Haz un birdie: un golpe menos que el par de un hoyo.',m:'b',c:15},
  {id:'eagle',n:'Eagle',how:'Haz un eagle: dos golpes menos que el par.',m:'s',c:40},
  {id:'hio',n:'Hoyo en uno',how:'Mete la bola desde el tee de un solo golpe.',m:'g',c:100},
  {id:'vuelta',n:'Vuelta completa',how:'Termina todos los hoyos de un recorrido.',m:'b',c:20},
  {id:'par',n:'Al par',how:'Termina una vuelta al par o por debajo.',m:'g',c:80},
  {id:'retos',n:'Plusmarquista',how:'Bate un récord de los Retos: drive, bandera o putt.',m:'b',c:15},
  {id:'doradas',n:'Todas las bolas doradas',how:'Encuentra todas las bolas doradas escondidas.',m:'g',c:60},
  {id:'kart',n:'Ganador en karts',how:'Gana una carrera de karts.',m:'s',c:30},
  {id:'meta',n:'Primera meta',how:'Termina un circuito de boyas o la carrera de caballos.',m:'b',c:10},
  {id:'boyas',n:'Oro en las boyas',how:'Medalla de oro en un circuito de boyas, en moto de agua o en lancha.',m:'g',c:50,w:'water'},
  {id:'slalom',n:'Slalom perfecto',how:'Rodea las seis boyas de una pasada de slalom.',m:'s',c:40,w:'water'},
  {id:'hipica',n:'Oro en la hípica',how:'Medalla de oro en la carrera de caballos.',m:'g',c:50,w:'horse'},
  {id:'pesca',n:'Gran pesca',how:'Pesca un pez de 10 kg o más desde el muelle.',m:'s',c:30,w:'pier'},
  {id:'tienda',n:'Bien equipado',how:'Desbloquea cinco cosas de la tienda.',m:'b',c:20},
  {id:'campeon',n:'Campeón del torneo familiar',how:'Gana un torneo familiar. Da la chaqueta verde de campeón.',m:'g',c:100}];
const METAL={g:{n:'oro',c:'#d4ad5a',d:'#9c7414'},s:{n:'plata',c:'#cfd3d8',d:'#8a9097'},b:{n:'bronce',c:'#c27a3e',d:'#7f4a1f'}};
function prgLoad(){ try{ const o=JSON.parse(store.get('vg_prog')||'{}')||{}; Object.assign(PRG,o); }catch(e){} for(const k of ['own','eq','tro']) if(!PRG[k]||typeof PRG[k]!=='object') PRG[k]={}; if(!Array.isArray(PRG.log)) PRG.log=[]; PRG.coins=+PRG.coins||0; PRG.earned=+PRG.earned||0; }
function prgSave(){ store.set('vg_prog',JSON.stringify({coins:PRG.coins,earned:PRG.earned,own:PRG.own,eq:PRG.eq,tro:PRG.tro,log:PRG.log})); }
function prgItem(id){ return SHOP.find(s=>s.id===id)||null; }
function prgOwned(it){ return !!it&&(it.p===0||!!PRG.own[it.id]||(it.req&&!!PRG.tro[it.req])); }
// the clothes and clubs you have on go over the base outfit (or your avatar)
function prgSkin(sk){ const o=Object.assign({},sk), e=PRG.eq;
  const c=prgItem(e.camisa); if(c){ o.shirt=c.c; if(c.jersey) o.top='jersey'; }
  const p=prgItem(e.pantalon); if(p) o.pants=p.c;
  const g=prgItem(e.gorro); if(g){ if(g.hat==='none'){ o.cap=null; o.hat='none'; } else { o.cap=g.c; o.hat=g.hat; } }
  const l=prgItem(e.palos); if(l){ o.cs=l.cs; o.ch=l.ch; } return o; }
function prgBall(){ const b=prgItem(PRG.eq.bola); ballMesh.material.color.set(b?b.c:'#ffffff'); ballMesh.material.emissive.set(b&&b.glow?'#7a5a10':'#3a3a3a'); trail.material.color.set(b?b.c:'#ffffff'); }
function prgApply(){ const a=S.av?avById(S.av):null; setSkin(S.skin,a||undefined); prgBall(); }

// ---- the little panel that tells you what you won (a queue, so a birdie and its trophy don't step on each other)
const PPQ=[]; let ppT=0;
function prgPop(icon,b,s,n){ const L=PPQ[PPQ.length-1]; if(icon==='coin'&&L&&L[0]==='coin'){ L[3]+=n; L[1]='+'+L[3]+' monedas'; L[2]=L[4]+' y más · tienes '+PRG.coins; return; } PPQ.push([icon,b,s,n||0,(s||'').split(' · ')[0]]); }
function prgPopTick(dt){ const el=$('prgPop'); if(!el) return; if(ppT>0){ ppT-=dt; if(ppT<=0.3) el.classList.remove('show'); if(ppT>0) return; }
  if(!PPQ.length||quietNow()) return; const [ic,b,s]=PPQ.shift(); $('prgPopI').innerHTML=ic==='cup'?cupSVG('g',true):'<i class="coin"></i>'; $('prgPopB').textContent=b; $('prgPopS').textContent=s||''; el.classList.add('show'); ppT=2.6; }
function prgEarn(n,why){ n=Math.round(n); if(!(n>0)) return; PRG.coins+=n; PRG.earned+=n; PRG.log.unshift([Date.now(),n,why]); if(PRG.log.length>12) PRG.log.length=12; prgSave(); prgPop('coin','+'+n+' monedas',why+' · tienes '+PRG.coins,n); }
function prgTrophy(id,who,extra){ const t=TRO.find(x=>x.id===id); if(!t||PRG.tro[id]) return false; PRG.tro[id]={d:Date.now(),w:WP.key,who:who||(S.name||'').trim()||'Tú',x:extra||''}; prgSave(); blip('gold');
  prgPop('cup','Trofeo: '+t.n,'Ya está en tu vitrina'+(HX.ok?' y en la del hotel':'')); prgEarn(t.c,'Trofeo '+t.n); if(MP.code) mpSay('🏆 Trofeo nuevo: '+t.n); return true; }
// every place of the game that hands out a prize calls this
function prgEvt(k,o){ o=o||{}; try{
  if(k==='hole'){ const d=o.st-o.par; if(o.st===1){ prgEarn(50,'Hoyo en uno'); prgTrophy('hio'); } else if(d<=-2){ prgEarn(25,d<=-3?'Albatros':'Eagle'); prgTrophy('eagle'); } else if(d===-1){ prgEarn(10,'Birdie'); prgTrophy('birdie'); } else if(d===0) prgEarn(3,'Par'); }
  else if(k==='round'){ prgEarn(20,'Vuelta terminada'); prgTrophy('vuelta'); if(o.ts<=o.par) prgTrophy('par'); }
  else if(k==='reto'){ prgEarn(15,'Récord de los Retos'); prgTrophy('retos'); }
  else if(k==='gold'){ prgEarn(5,'Bola dorada'); if(o.all) prgTrophy('doradas'); }
  else if(k==='kart'){ prgEarn(10+(o.pos===1?20:0)+(o.rec?10:0),o.pos===1?'Carrera de karts ganada':'Carrera de karts terminada'); if(o.pos===1) prgTrophy('kart'); }
  else if(k==='fish'){ if(o.best) prgEarn(10,'Récord de pesca'); if(o.kg>=10) prgTrophy('pesca'); }
  else if(k==='ski'){ prgEarn(10,'Récord de saltos en esquí'); }
}catch(e){ console.warn(e); } }
function prgBuy(id){ const it=prgItem(id); if(!it) return 'no'; if(prgOwned(it)){ prgEquip(id); return 'eq'; } if(it.req) return 'lock'; if(PRG.coins<it.p) return 'poor';
  PRG.coins-=it.p; PRG.own[id]=1; PRG.log.unshift([Date.now(),-it.p,it.n]); if(PRG.log.length>12) PRG.log.length=12; prgSave(); blip('gold'); prgEquip(id);
  if(SHOP.filter(s=>s.p>0&&PRG.own[s.id]).length>=5) prgTrophy('tienda'); return 'buy'; }
function prgEquip(id){ const it=prgItem(id); if(!it||!prgOwned(it)) return false; PRG.eq[it.slot]=id; prgSave(); prgApply(); return true; }
function prgBase(slot){ delete PRG.eq[slot]; prgSave(); prgApply(); }

// ---- the cup drawn in SVG (vitrina, avisos) and in 3D (vitrina del hotel)
function cupSVG(m,big){ const M=METAL[m]||{c:'#cfcac2',d:'#a7a29a'}; return '<svg viewBox="0 0 40 40" aria-hidden="true"'+(big?' width="30" height="30"':'')+'><path d="M11 6h18v6c0 7-4 12-9 12s-9-5-9-12z" fill="'+M.c+'" stroke="'+M.d+'" stroke-width="1.5"/><path d="M11 9H6c0 5 3 8 6 8M29 9h5c0 5-3 8-6 8" fill="none" stroke="'+M.d+'" stroke-width="2"/><rect x="18" y="24" width="4" height="6" fill="'+M.d+'"/><rect x="12" y="30" width="16" height="5" rx="1" fill="'+(m?'#3a2c22':'#a7a29a')+'"/></svg>'; }
function cupMesh(m,h){ const M=METAL[m]||METAL.g; const mat=IM({color:M.c,roughness:0.32,metalness:0.55,emissive:new THREE.Color(M.c).multiplyScalar(0.28)}); const g=new THREE.Group();
  const pr=[[0,0],[0.3,0],[0.3,0.12],[0.12,0.16],[0.06,0.22],[0.05,0.42],[0.09,0.5],[0.3,0.6],[0.38,0.8],[0.4,1],[0.36,1],[0.32,0.82],[0,0.68]].map(p=>new THREE.Vector2(p[0]*h,p[1]*h));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(pr,18),mat)); for(const s of [-1,1]){ const t=new THREE.Mesh(new THREE.TorusGeometry(0.15*h,0.025*h,6,12,Math.PI),mat); t.position.set(s*0.36*h,0.78*h,0); t.rotation.z=-s*Math.PI/2; g.add(t); }
  const base=new THREE.Mesh(new THREE.BoxGeometry(0.62*h,0.12*h,0.62*h),IM({color:'#2a211b',roughness:0.4})); base.position.y=0.06*h; g.add(base); return g; }

// ---- circuits: buoys on the water ring of the ski boat (jet ski and motorboat), slalom behind the boat and a horse race on open ground
const CIR={on:false,k:null,K:null,st:'',gates:[],next:0,lap:0,t:0,cd:0,px:0,pz:0,sx:0,sz:0,path:[],sT:0,splits:[],grp:null,ghost:null,rec:null,J:null,h:null,home:null,res:null,ring:null,ringTried:false,sl:null,dT:0,dTxt:'',miss:0};
const CIRK={moto:{n:'Boyas en moto de agua',veh:'jet',laps:1,vmax:18,w:14,off:12,ng:12,water:1,txt:'Doce puertas de boyas en zigzag alrededor del circuito de la lancha, frente al muelle. Una vuelta.'},
  lancha:{n:'Boyas en lancha',veh:'boat',laps:2,vmax:20,w:22,off:6,ng:8,water:1,txt:'Ocho puertas anchas: la lancha gira menos, así que hay que abrirse antes. Dos vueltas.'},
  slalom:{n:'Slalom de esquí acuático',veh:'ski',water:1,txt:'La lancha te remolca en línea recta por el circuito; tú rodeas por fuera boyas alternas, a un lado y a otro de la estela. Si haces una pasada perfecta, la lancha acelera.'},
  caballos:{n:'Carrera de caballos',veh:'horse',laps:2,vmax:13,w:11,ng:10,txt:'Óvalo con postes y banderas en terreno abierto, junto a los caballos. Dos vueltas al galope.'}};
function cirKey(k){ return 'vg_cir_'+WP.key+'_'+k; }
function cirRec(k){ try{ return JSON.parse(store.get(cirKey(k))||'null'); }catch(e){ return null; } }
function cirOK(k){ if(k==='moto') return !!SKI.loop&&JET.list.some(j=>(j.type||'jet')==='jet'); if(k==='lancha') return !!SKI.loop&&JET.list.some(j=>j.type==='boat'); if(k==='slalom') return !!SKI.loop; if(k==='caballos') return HORSES.length>0&&!!cirHorseRing(); return false; }
function cirWaterGates(K){ const L=SKI.loop, d=SKI.dir||1; const a0=Math.atan2(SKI.spot[1]-L.cz,SKI.spot[0]-L.cx)+d*0.3, out=[];
  for(let i=0;i<K.ng;i++){ const th=a0+d*i*2*Math.PI/K.ng, off=i===0?0:(i%2?K.off:-K.off), r=L.r+off, ux=Math.cos(th), uz=Math.sin(th);
    out.push({x:L.cx+ux*r,z:L.cz+uz*r,nx:ux,nz:uz,tx:-uz*d,tz:ux*d,w:i===0?K.w+4:K.w}); } return out; }
// an oval of open ground near a herd: no trees, buildings, water, greens or tees, and gentle slopes
function cirRingOK(cx,cz,A,B,ph,ok){ const N=64, c=Math.cos(ph), s=Math.sin(ph); let ph0=null, px=0, pz=0;
  for(let i=0;i<=N;i++){ const t=i/N*2*Math.PI, lx=A*Math.cos(t), lz=B*Math.sin(t); const x=cx+lx*c-lz*s, z=cz+lx*s+lz*c;
    let nx=B*Math.cos(t), nz=A*Math.sin(t); const nl=Math.hypot(nx,nz)||1; nx/=nl; nz/=nl; const wx=nx*c-nz*s, wz=nx*s+nz*c;
    for(const e of [0,-4.5,4.5]) if(!ok(x+wx*e,z+wz*e)) return false;
    const h=W.terrain(x,z); if(ph0!==null&&Math.abs(h-ph0)>0.22*Math.hypot(x-px,z-pz)) return false; ph0=h; px=x; pz=z; } return true; }
function cirHorseRing(){ if(CIR.ringTried) return CIR.ring; CIR.ringTried=true; CIR.ring=null;
  const ok=(x,z)=>{ if(!wildOK(x,z,'deer')) return false; const c=W.surfAt(x,z); if(c===5||c===6) return false; const tr=treeGrid.get(Math.floor(x/20)+','+Math.floor(z/20)); if(tr) for(const t of tr) if(Math.hypot(x-t.x,z-t.z)<t.tr+2.4) return false; return true; };
  let best=null;
  for(const [hx,hz] of (WP.horses||[])){ outer: for(let A=125;A>=40;A-=10){ if(best&&best.A>=A) break; for(let gx=-240;gx<=240;gx+=24) for(let gz=-240;gz<=240;gz+=24){ if(gx*gx+gz*gz>240*240) continue;
      for(const ph of [0,0.785,1.571,2.356]){ if(cirRingOK(hx+gx,hz+gz,A,A*0.55,ph,ok)){ best={cx:hx+gx,cz:hz+gz,A,B:A*0.55,ph,hx,hz}; break outer; } } } } }
  if(best){ const per=Math.PI*(3*(best.A+best.B)-Math.sqrt((3*best.A+best.B)*(best.A+3*best.B))); CIRK.caballos.laps=per<400?3:2; CIRK.caballos.txt='Óvalo de '+fmt(per)+' m con postes y banderas en terreno abierto, junto a los caballos. '+(per<400?'Tres':'Dos')+' vueltas al galope.'; }
  CIR.ring=best; return best; }
function cirHorseGates(K){ const R=cirHorseRing(), c=Math.cos(R.ph), s=Math.sin(R.ph), out=[];
  for(let i=0;i<K.ng;i++){ const t=i/K.ng*2*Math.PI, lx=R.A*Math.cos(t), lz=R.B*Math.sin(t); let tx=-R.A*Math.sin(t), tz=R.B*Math.cos(t); const tl=Math.hypot(tx,tz); tx/=tl; tz/=tl;
    const wtx=tx*c-tz*s, wtz=tx*s+tz*c; out.push({x:R.cx+lx*c-lz*s,z:R.cz+lx*s+lz*c,nx:-wtz,nz:wtx,tx:wtx,tz:wtz,w:i===0?K.w+3:K.w}); } return out; }
function cirLen(G,laps){ let L=0; for(let i=0;i<G.length;i++){ const a=G[i], b=G[(i+1)%G.length]; L+=Math.hypot(b.x-a.x,b.z-a.z); } return L*laps+14; }
// medal times: gold needs ~86 % of top speed all the way round, silver 70 %, bronze 55 %
function cirMedals(k){ const K=CIRK[k]; if(k==='slalom'||!cirOK(k)) return null; const G=k==='caballos'?cirHorseGates(K):cirWaterGates(K); const L=cirLen(G,K.laps); return [0.86,0.7,0.55].map(f=>Math.round(L/(K.vmax*f)*2)/2*1000); }
function cirMedal(ms,M){ return !M?'':ms<=M[0]?'g':ms<=M[1]?'s':ms<=M[2]?'b':''; }
function cirSurfY(x,z){ return CIR.K&&CIR.K.water?W.waterLevel(x,z):W.terrain(x,z); }
function cirFlagTex(){ return txc('cirChk',()=>canvasTex(256,64,(g,w,h)=>{ const n=16, sq=w/n; for(let i=0;i<n;i++) for(let j=0;j<4;j++){ g.fillStyle=(i+j)%2?'#16231b':'#ffffff'; g.fillRect(i*sq,j*16,sq,16); } })); }
function cirBuild(){ const grp=new THREE.Group(); scene.add(grp); CIR.grp=grp; const water=!!CIR.K.water;
  const mO=new THREE.MeshLambertMaterial({color:Cc(water?'#ff7a1a':'#d6442a')}), mN=new THREE.MeshLambertMaterial({color:Cc('#2fbf5a'),emissive:Cc('#145a28')}), mS=new THREE.MeshLambertMaterial({color:Cc('#f2c230')}), mW=new THREE.MeshLambertMaterial({color:Cc('#f4f3ef')});
  CIR.mats={mO,mN,mS}; const buoy=new THREE.SphereGeometry(0.6,14,10), post=new THREE.CylinderGeometry(0.07,0.07,1.7,8), flag=new THREE.BoxGeometry(0.03,0.32,0.5);
  CIR.gates.forEach((G,i)=>{ G.m=[]; for(const sd of [-1,1]){ const x=G.x+G.nx*sd*G.w/2, z=G.z+G.nz*sd*G.w/2, y=cirSurfY(x,z); let o;
      if(water){ o=new THREE.Mesh(buoy,i===0?mS:mO); o.position.set(x,y+0.25,z); }
      else { o=new THREE.Group(); const p=new THREE.Mesh(post,mW); p.position.y=0.85; o.add(p); const f=new THREE.Mesh(flag,i===0?mS:mO); f.position.set(0,1.5,0.26); o.add(f); o.userData.f=f; o.position.set(x,y,z); o.rotation.y=-Math.atan2(G.tz,G.tx); }
      grp.add(o); G.m.push(o); }
    if(i===0){ // start and finish: two poles with a chequered banner
      const pm=new THREE.MeshLambertMaterial({color:Cc('#16231b')}), y0=cirSurfY(G.x,G.z); for(const sd of [-1,1]){ const p=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,4.6,8),pm); p.position.set(G.x+G.nx*sd*(G.w/2+0.9),y0+2.3,G.z+G.nz*sd*(G.w/2+0.9)); grp.add(p); }
      const ban=new THREE.Mesh(new THREE.PlaneGeometry(G.w+1.8,0.9),new THREE.MeshLambertMaterial({map:cirFlagTex(),side:THREE.DoubleSide})); ban.position.set(G.x,y0+4.1,G.z); ban.rotation.y=Math.atan2(G.tx,G.tz); grp.add(ban); } });
  const bm=new THREE.Mesh(new THREE.CylinderGeometry(0.35,0.35,26,8,1,true),new THREE.MeshBasicMaterial({color:0xf2c230,transparent:true,opacity:0.35,depthWrite:false})); bm.frustumCulled=false; grp.add(bm); CIR.beam=bm; }
function cirHighlight(){ if(!CIR.grp) return; const {mO,mN,mS}=CIR.mats, water=!!CIR.K.water;
  CIR.gates.forEach((G,i)=>{ const m=i===CIR.next?mN:i===0?mS:mO; for(const o of G.m){ if(water) o.material=m; else o.userData.f.material=m; } });
  const G=CIR.gates[CIR.next]; if(G&&CIR.beam){ CIR.beam.position.set(G.x,cirSurfY(G.x,G.z)+13,G.z); CIR.beam.visible=true; } }
function cirGhostMesh(){ const g=new THREE.Group(); const m=new THREE.MeshBasicMaterial({color:0xf2c230,transparent:true,opacity:0.42,depthWrite:false});
  const c=new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,2.2,12),m); c.position.y=1.1; g.add(c); const r=new THREE.Mesh(new THREE.TorusGeometry(1.1,0.08,6,24),m); r.rotation.x=Math.PI/2; r.position.y=0.15; g.add(r);
  const tx=canvasTex(256,64,(x,w,h)=>{ x.fillStyle='rgba(255,255,255,.88)'; x.fillRect(0,0,w,h); x.fillStyle='#16231b'; x.font='800 36px Figtree, system-ui, sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.fillText('Tu récord',w/2,h/2+2); });
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,depthWrite:false,transparent:true})); sp.scale.set(2.6,0.65,1); sp.position.y=3; g.add(sp); g.visible=false; return g; }
function cirGhostTick(){ const R=CIR.rec, G=CIR.ghost; if(!G||!R||!R.path||R.path.length<4) return; const n=R.path.length/2, f=CIR.t/0.1, i=Math.min(n-1,Math.floor(f)), j=Math.min(n-1,i+1), k=f-Math.floor(f);
  const x=R.path[i*2]+(R.path[j*2]-R.path[i*2])*k, z=R.path[i*2+1]+(R.path[j*2+1]-R.path[i*2+1])*k; G.position.set(x,cirSurfY(x,z),z); G.visible=CIR.st==='run'&&f<n+20; CIR.gx=x; CIR.gz=z; }
function cirCross(G,x0,z0,x1,z1){ const s0=(x0-G.x)*G.tx+(z0-G.z)*G.tz, s1=(x1-G.x)*G.tx+(z1-G.z)*G.tz; if(!(s0<0&&s1>=0)) return 0; const k=s0/(s0-s1);
  const l=((x0+(x1-x0)*k)-G.x)*G.nx+((z0+(z1-z0)*k)-G.z)*G.nz; return Math.abs(l)<=G.w/2+0.6?1:-1; }
function cirBusy(){ return ['ski','pas','racket','swing','flight','wait','replay','photo','rround','fish','view','plane','fall','glide','loading'].includes(S.mode); }
function cirLand(){ if(S.mode==='menu'||S.mode==='drone'){ plane.visible=false; glider.visible=false; rig.root.visible=true; S.landedOnce=true; setMode('walk'); } }
function cirStart(k){ const K=CIRK[k]; if(!K) return; if(!cirOK(k)){ toast('Este circuito no está en este mundo',''); return; }
  if(S.mode==='ski'){ if(k==='slalom'&&!SKI.tow){ closeModal(); $('cirSheet').hidden=true; cirClear(true); CIR.k=k; CIR.K=K; CIR.res=null; CIR.rec=cirRec(k); CIR.next=0; CIR.on=true; CIR.st='wait'; $('cirHud').hidden=false; return; } tip('Suelta antes la cuerda (botón Acción)',2600); return; }
  if(cirBusy()){ if(S.mode==='fish') exitFish(); else if(S.mode==='view') exitView(); else { tip('Termina primero lo que estás haciendo',2600); return; } }
  closeModal(); hideMap(); $('cirSheet').hidden=true; ensureAudio(); if(CIR.on) cirClear(true);
  fadeTo(()=>{ cirLand(); if(KART.on) kartEnd('Has dejado la carrera'); if(S.interior) exitVilla(); if(P.buggy) exitBuggy(); if(HX.sit) hxStand();
    CIR.k=k; CIR.K=K; CIR.res=null; CIR.rec=cirRec(k); CIR.t=0; CIR.next=0; CIR.lap=0; CIR.started=false; CIR.splits=[]; CIR.path=[]; CIR.sT=0; CIR.dT=0; CIR.miss=0;
    if(k==='slalom'){ if(P.horse) dismountHorse(); if(P.jet) dismountJet(); P.x=SKI.spot[0]; P.z=SKI.spot[1]; P.y=PIER.deckY; P.vx=P.vy=P.vz=0; P.swim=false; setMode('walk');
      CIR.on=true; CIR.st='wait'; CIR.sl=null; $('cirHud').hidden=false; cirHudUpd(); setTimeout(()=>{ if(CIR.on&&CIR.k==='slalom'&&CIR.st==='wait') startSki(); },50); return; }
    CIR.gates=k==='caballos'?cirHorseGates(K):cirWaterGates(K); CIR.med=cirMedals(k); cirBuild(); CIR.ghost=cirGhostMesh(); scene.add(CIR.ghost);
    const g0=CIR.gates[0], sx=g0.x-g0.tx*14, sz=g0.z-g0.tz*14, yaw=Math.atan2(g0.tz,g0.tx); CIR.sx=sx; CIR.sz=sz;
    if(K.veh==='horse'){ if(P.jet) dismountJet(); let h=P.horse; if(!h){ let bd=1e9; for(const o of HORSES){ if(o.remoteBy) continue; const d=Math.hypot(o.x-sx,o.z-sz); if(d<bd){ bd=d; h=o; } } }
      CIR.home=[h.x,h.z,h.yaw]; h.x=sx; h.z=sz; h.y=W.terrain(sx,sz); h.yaw=yaw; h.spd=0; h.air=false; placeHorse(h); if(P.horse!==h){ if(P.horse) dismountHorse(); mountHorse(h); } CIR.h=h; CIR.J=null; }
    else { if(P.horse) dismountHorse(); const J=(P.jet&&(P.jet.type||'jet')===K.veh)?P.jet:JET.list.find(j=>(j.type||'jet')===K.veh&&!j.remoteBy); if(P.jet&&P.jet!==J) dismountJet();
      CIR.home=[J.x,J.z,J.yaw]; J.x=sx; J.z=sz; J.yaw=yaw; J.v=0; J.air=false; J.y=W.waterLevel(sx,sz)+0.1; jetPlace(J,0); if(P.jet!==J) mountJet(J); CIR.J=J; CIR.h=null; }
    P.x=sx; P.z=sz; P.yaw=yaw; camS.yaw=yaw; CIR.px=sx; CIR.pz=sz; CIR.on=true; CIR.st='count'; CIR.cd=3.2; cirHighlight(); $('cirHud').hidden=false; cirHudUpd();
    tip(K.water?'Pasa entre las dos boyas verdes de cada puerta, en orden. La columna amarilla marca la siguiente':'Pasa entre los dos postes de banderas verdes, en orden. Mantén el joystick a tope para galopar',4200); }); }
function cirLights(){ const el=$('kartLights'); if(!el||KART.on) return; if(CIR.on&&CIR.st==='count'){ el.hidden=false; const n=CIR.cd>2.2?1:CIR.cd>1.1?2:3; el.querySelectorAll('i').forEach((x,i)=>{ x.className=i<n?'r':''; }); $('kartGo').textContent=''; }
  else if(CIR.on&&CIR.st==='run'&&CIR.t<1){ el.hidden=false; el.querySelectorAll('i').forEach(x=>x.className='g'); $('kartGo').textContent='¡Ya!'; } else if(!el.hidden) el.hidden=true; }
function cirTick(dt){ if(!CIR.on) return; if(CIR.k==='slalom'){ slTick(dt); return; } if(CIR.dT>0) CIR.dT-=dt;
  if(CIR.st==='count'){ CIR.cd-=dt; const V=CIR.J||CIR.h; V.x=CIR.sx; V.z=CIR.sz; if(CIR.J){ CIR.J.v=0; jetPlace(CIR.J,0); } else { CIR.h.spd=0; placeHorse(CIR.h); } P.x=V.x; P.z=V.z;
    if(CIR.cd<=0){ CIR.st='run'; CIR.t=0; blip('gold'); } CIR.px=P.x; CIR.pz=P.z; cirLights(); cirHudUpd(); return; }
  if(CIR.st!=='run'){ cirLights(); return; }
  if((CIR.J&&(S.mode!=='jet'||P.jet!==CIR.J))||(CIR.h&&(S.mode!=='ride'||P.horse!==CIR.h))){ cirClear(); toast('Has dejado el circuito','Puedes volver a empezarlo desde el menú, en «Circuitos»'); return; }
  CIR.t+=dt; CIR.sT+=dt; while(CIR.sT>=0.1){ CIR.sT-=0.1; CIR.path.push(Math.round(P.x*2)/2,Math.round(P.z*2)/2); }
  const G=CIR.gates[CIR.next]; const c=G?cirCross(G,CIR.px,CIR.pz,P.x,P.z):0; if(c>0) cirGate(); else if(c<0){ CIR.miss++; tip('Te has saltado la puerta: da la vuelta y pasa entre '+(CIR.K.water?'las dos boyas verdes':'los dos postes verdes'),3000); blip('jump'); }
  CIR.px=P.x; CIR.pz=P.z; cirGhostTick(); cirLights(); cirHudUpd(); }
function cirGate(){ const n=CIR.gates.length, ms=Math.round(CIR.t*1000); CIR.splits.push(ms); blip('hit');
  const R=CIR.rec, ix=CIR.splits.length-1; if(R&&R.splits&&R.splits[ix]!==undefined){ const d=(ms-R.splits[ix])/1000; CIR.dTxt=(d<=0?'−':'+')+fmt(Math.abs(d),1)+' s respecto a tu récord'; CIR.dGood=d<=0; CIR.dT=3; }
  if(CIR.next===0){ if(!CIR.started) CIR.started=true; else { CIR.lap++; if(CIR.lap>=CIR.K.laps){ cirFinish(); return; } } }
  CIR.next=(CIR.next+1)%n; cirHighlight(); }
function cirFinish(){ const k=CIR.k, K=CIR.K, ms=Math.round(CIR.t*1000), M=CIR.med, md=cirMedal(ms,M), R=CIR.rec, isRec=!R||ms<R.ms; CIR.st='done'; if(CIR.beam) CIR.beam.visible=false; if(CIR.ghost) CIR.ghost.visible=false;
  if(isRec) store.set(cirKey(k),JSON.stringify({ms,path:CIR.path,splits:CIR.splits,d:Date.now(),who:(S.name||'').trim()||'Tú',md}));
  else if(md&&'gsb'.indexOf(md)<'gsb'.indexOf(R.md||'x')){ R.md=md; store.set(cirKey(k),JSON.stringify(R)); }
  CIR.res={k,ms,md,isRec,prev:R?R.ms:0}; blip('gold'); toast(md?'Medalla de '+METAL[md].n:'¡Meta!',kartFmt(ms)+(isRec?' · ¡récord!':''));
  prgEarn(10+(md==='g'?15:md==='s'?8:md==='b'?4:0)+(isRec&&R?10:0),K.n); prgTrophy('meta'); if(md==='g') prgTrophy(K.water?'boyas':'hipica');
  cirResults(); }
function cirClear(keep){ CIR.on=false; CIR.st=''; if(CIR.grp){ scene.remove(CIR.grp); CIR.grp=null; } if(CIR.ghost){ scene.remove(CIR.ghost); CIR.ghost=null; } CIR.beam=null;
  if(CIR.sl){ for(const b of CIR.sl.b) scene.remove(b.m); CIR.sl=null; } SKI.sp=12.5; $('cirHud').hidden=true; const el=$('kartLights'); if(el&&!KART.on) el.hidden=true; if(!keep) $('cirSheet').hidden=true; }
function cirBack(){ const J=CIR.J, h=CIR.h, home=CIR.home; cirClear(); fadeTo(()=>{ if(J&&P.jet===J&&home){ J.x=home[0]; J.z=home[1]; J.yaw=home[2]; J.v=0; jetPlace(J,0); dismountJet(); }
  else if(h&&P.horse===h){ dismountHorse(); } else if(S.mode==='ski') stopSki(); }); }
function cirHudUpd(){ if($('cirHud').hidden) return; const K=CIR.K; if(!K) return; const R=CIR.rec;
  if(CIR.k==='slalom'){ const L=CIR.sl; $('cirT1').textContent=K.n; $('cirT2').textContent=L?'Boya '+Math.min(L.b.length,CIR.next+1)+' de '+L.b.length+' · pasada '+Math.min(L.np,Math.floor(CIR.next/6)+1)+' de '+L.np:'Agárrate a la cuerda…';
    $('cirT3').textContent=L?'Rodeadas: '+L.score+(R?' · récord '+R.n:''):''; $('cirT4').textContent=L?'Lancha a '+fmt(SKI.sp*3.6)+' km/h':''; $('cirT4').className=''; return; }
  $('cirT1').textContent=K.n; const n=CIR.gates.length;
  $('cirT2').textContent=CIR.st==='done'?'Meta':CIR.st==='count'?'Preparados…':'Puerta '+(CIR.started?(CIR.next===0?n:CIR.next):0)+' de '+n+(K.laps>1?' · vuelta '+Math.min(K.laps,CIR.lap+1)+' de '+K.laps:'');
  $('cirT3').textContent=kartFmt(CIR.st==='done'&&CIR.res?CIR.res.ms:CIR.t*1000||1)+(R?' · récord '+kartFmt(R.ms):'');
  const t4=$('cirT4'); if(CIR.dT>0){ t4.textContent=CIR.dTxt; t4.className=CIR.dGood?'good':'bad'; } else { const M=CIR.med; t4.className=''; t4.textContent=M?'Oro '+kartFmt(M[0])+' · plata '+kartFmt(M[1])+' · bronce '+kartFmt(M[2]):''; } }
// ---- slalom: six buoys per pass, alternately outside and inside the ring; you must swing out past each one on its side
function slSetup(){ const L=SKI.loop, d=SKI.dir||1, sp=36, gap=60; const circ=2*Math.PI*L.r; const np=clamp(Math.floor((circ-50)/(6*sp+gap)),1,3); const ths=SKI.th-d*SKI.rope_/L.r; const b=[];
  const mO=new THREE.MeshLambertMaterial({color:Cc('#ff7a1a')}); for(let p=0;p<np;p++) for(let i=0;i<6;i++){ const dist=45+p*(6*sp+gap)+i*sp, th=ths+d*dist/L.r, o=i%2?-9:9; const x=L.cx+Math.cos(th)*(L.r+o), z=L.cz+Math.sin(th)*(L.r+o);
    const m=new THREE.Mesh(new THREE.SphereGeometry(0.6,14,10),mO.clone()); m.position.set(x,W.waterLevel(x,z)+0.25,z); scene.add(m); b.push({th,o,m,ok:null}); }
  CIR.sl={b,np,score:0,pass:0,clean:0}; CIR.next=0; slMark(); }
function slMark(){ const L=CIR.sl; if(!L) return; L.b.forEach((b,i)=>{ b.m.material.color.set(b.ok===true?'#2fbf5a':b.ok===false?'#9a9a9a':i===CIR.next?'#f2c230':'#ff7a1a'); b.m.scale.setScalar(i===CIR.next?1.35:1); }); }
function slTick(dt){ if(CIR.st==='wait'){ if(S.mode==='ski'&&SKI.on&&!SKI.tow){ slSetup(); CIR.st='run'; tip('Rodea por fuera cada boya amarilla: a la derecha de la estela y luego a la izquierda. Joystick a los lados',4500); } cirHudUpd(); return; }
  if(CIR.st!=='run') return; if(S.mode!=='ski'){ slFinish(true); return; }
  const Lp=SKI.loop, d=SKI.dir||1, ths=SKI.th-d*SKI.rope_/Lp.r, L=CIR.sl, b=L.b[CIR.next]; if(!b){ slFinish(false); return; }
  if(d*(ths-b.th)>=0){ const ok=b.o>0?SKI.off>b.o-0.3:SKI.off<b.o+0.3; b.ok=ok; if(ok){ L.score++; blip('hit'); } else blip('jump'); CIR.next++;
    if(CIR.next%6===0){ const pc=L.b.slice(CIR.next-6,CIR.next).every(x=>x.ok); if(pc){ prgTrophy('slalom'); SKI.sp+=1.6; tip('¡Pasada perfecta! La lancha acelera',2500); } }
    slMark(); if(CIR.next>=L.b.length){ slFinish(false); return; } }
  cirHudUpd(); }
function slFinish(quit){ const L=CIR.sl, n=L?L.score:0, tot=L?L.b.length:0, R=CIR.rec, isRec=n>0&&(!R||n>R.n); CIR.st='done';
  if(isRec) store.set(cirKey('slalom'),JSON.stringify({n,tot,d:Date.now(),who:(S.name||'').trim()||'Tú'})); CIR.res={k:'slalom',n,tot,isRec,prev:R?R.n:0,quit};
  toast('Slalom: '+n+' de '+tot+' boyas',isRec?'¡récord!':''); if(n) prgEarn(2*n+(isRec&&R?10:0),'Slalom de esquí'); cirResults(); }

// ---- the circuits sheet: choose, read the medals and the record; then the results
function cirSheet(){ const B=$('cirBody'); const fd=t=>new Date(t).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
  let h='<h2>Circuitos</h2><p>Carreras contra el reloj y contra <b>tu récord</b>: cuando ya tienes uno, una columna dorada semitransparente («Tu récord») repite tu mejor vuelta y en cada puerta ves si vas por delante (−, en verde) o por detrás (+, en rojo).</p>';
  let any=false; for(const k in CIRK){ const K=CIRK[k]; if(!cirOK(k)) continue; any=true; const R=cirRec(k), M=cirMedals(k);
    h+='<div class="cirk"><b>'+K.n+'</b><p>'+K.txt+'</p>'+(M?'<p class="note">Medallas: oro en '+kartFmt(M[0])+' o menos · plata '+kartFmt(M[1])+' · bronce '+kartFmt(M[2])+'</p>':'')+
      '<p class="note">'+(R?(k==='slalom'?'Récord: <b>'+R.n+' boyas</b>':'Récord: <b>'+kartFmt(R.ms)+'</b>'+(R.md?' · '+cupSVG(R.md,true).replace('<svg','<svg style="vertical-align:-8px"'):''))+' · '+R.who+' · '+fd(R.d):'Aún sin récord')+'</p><button class="btn small primary" data-cir="'+k+'">Empezar</button></div>'; }
  if(!any) h+='<p>En este mundo no hay agua ni caballos con sitio para un circuito.</p>';
  if(CIR.on) h+='<div class="row"><button class="btn small" id="cirQuit">Dejar el circuito</button></div>';
  h+='<h3>Cómo se lee</h3><ul><li><b>Columna amarilla:</b> la siguiente puerta. Sus boyas o banderas se ponen verdes.</li><li><b>Boyas o banderas a cuadros:</b> salida y meta.</li><li><b>Arriba:</b> puerta y vuelta, tiempo y récord, y la diferencia con tu récord en la última puerta.</li><li><b>Mapa:</b> el recorrido en línea discontinua, la siguiente puerta en amarillo y tu récord como punto dorado.</li></ul>';
  h+='<div class="row"><button class="btn small" id="cirClose">Cerrar</button></div>'; B.innerHTML=h; $('cirSheet').hidden=false;
  B.querySelectorAll('[data-cir]').forEach(b=>b.onclick=()=>cirStart(b.dataset.cir)); $('cirClose').onclick=()=>{ $('cirSheet').hidden=true; }; const q=$('cirQuit'); if(q) q.onclick=()=>{ $('cirSheet').hidden=true; cirBack(); }; }
function cirResults(){ const r=CIR.res, K=CIRK[r.k], B=$('cirBody'); let h='<h2>'+K.n+'</h2>';
  if(r.k==='slalom') h+='<p style="font-family:var(--f-display);font-size:26px;font-weight:800;margin:0 0 4px">'+r.n+' de '+r.tot+' boyas</p><p>'+(r.isRec?'¡Nuevo récord!'+(r.prev?' Antes: '+r.prev+'.':''):r.prev?'Tu récord sigue en '+r.prev+' boyas.':'')+(r.quit?' Soltaste la cuerda antes del final.':'')+'</p>';
  else { const M=CIR.med; h+='<p style="font-family:var(--f-display);font-size:28px;font-weight:800;margin:0 0 4px">'+kartFmt(r.ms)+' '+(r.md?cupSVG(r.md,true).replace('<svg','<svg style="vertical-align:-6px"'):'')+'</p><p>'+(r.md?'Medalla de <b>'+METAL[r.md].n+'</b>. ':'Sin medalla esta vez. ')+(r.isRec?'¡Nuevo récord!'+(r.prev?' Has mejorado en '+fmt((r.prev-r.ms)/1000,1)+' s.':''):'A '+fmt((r.ms-r.prev)/1000,1)+' s de tu récord ('+kartFmt(r.prev)+').')+'</p>'+(M?'<p class="note">Oro '+kartFmt(M[0])+' · plata '+kartFmt(M[1])+' · bronce '+kartFmt(M[2])+'</p>':''); }
  h+='<div class="row"><button class="btn small primary" id="cirAgain">Repetir</button><button class="btn small" id="cirHome">'+(K.veh==='horse'?'Bajar del caballo':K.veh==='ski'?'Volver al muelle':'Volver al muelle')+'</button><button class="btn small" id="cirOk">Seguir aquí</button></div>';
  B.innerHTML=h; $('cirSheet').hidden=false; $('cirAgain').onclick=()=>cirStart(r.k); $('cirHome').onclick=()=>{ $('cirSheet').hidden=true; cirBack(); }; $('cirOk').onclick=()=>{ $('cirSheet').hidden=true; cirClear(); }; }
function cirDrawMap(g,m2c,s,big){ if(!CIR.on) return; g.save();
  if(CIR.k==='slalom'){ if(CIR.sl) CIR.sl.b.forEach((b,i)=>{ const [x,y]=m2c(b.m.position.x,b.m.position.z); g.fillStyle=i===CIR.next?'#f2c230':'#ff7a1a'; g.beginPath(); g.arc(x,y,(big?3:2)*s,0,7); g.fill(); }); g.restore(); return; }
  g.strokeStyle=CIR.K.water?'#1d5f8a':'#7a4a1f'; g.lineWidth=(big?3:2)*s; g.setLineDash([6*s,4*s]); g.beginPath(); CIR.gates.forEach((G,i)=>{ const [x,y]=m2c(G.x,G.z); i?g.lineTo(x,y):g.moveTo(x,y); }); g.closePath(); g.stroke(); g.setLineDash([]);
  const G=CIR.gates[CIR.next]; if(G&&CIR.st!=='done'){ const [x,y]=m2c(G.x,G.z); g.fillStyle='#f2c230'; g.strokeStyle='#16231b'; g.lineWidth=1.2*s; g.beginPath(); g.arc(x,y,(big?5:3.4)*s,0,7); g.fill(); g.stroke(); }
  if(CIR.ghost&&CIR.ghost.visible){ const [x,y]=m2c(CIR.gx,CIR.gz); g.fillStyle='#d4ad5a'; g.strokeStyle='#fff'; g.lineWidth=1.2*s; g.beginPath(); g.arc(x,y,(big?4:2.8)*s,0,7); g.fill(); g.stroke(); } g.restore(); }
function cirLegend(){ if(!CIR.on) return ''; if(CIR.k==='slalom') return '<div><i class="dot" style="background:#ff7a1a;border:0"></i>Boyas del slalom (en amarillo, la siguiente)</div>';
  return '<div><i style="background:repeating-linear-gradient(90deg,'+(CIR.K.water?'#1d5f8a':'#7a4a1f')+' 0 6px,transparent 6px 10px);height:4px;border:0"></i>'+CIR.K.n+'</div><div><i class="dot" style="background:#f2c230;border:1px solid #16231b"></i>Siguiente puerta</div>'+(CIR.rec&&CIR.rec.path?'<div><i class="dot" style="background:#d4ad5a;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)"></i>Tu récord (fantasma)</div>':''); }

// ---- family tournament: several rounds on different days, total and net leaderboard, a trophy in the hotel
const TOR={st:null,hist:[],form:{rounds:3,course:null,daily:true}};
function torLoad(){ try{ TOR.st=JSON.parse(store.get(WP.key+'_torneo')||'null'); }catch(e){ TOR.st=null; } try{ TOR.hist=JSON.parse(store.get(WP.key+'_torneos')||'[]')||[]; }catch(e){ TOR.hist=[]; } }
function torSave(){ store.set(WP.key+'_torneo',JSON.stringify(TOR.st)); store.set(WP.key+'_torneos',JSON.stringify(TOR.hist)); }
function torDay(t){ const d=new Date(t); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function torPar(){ const C=W.COURSES[TOR.st.course]||W.COURSES[0]; return C.par; }
// leaderboard: net to par (gross minus the handicap in every round, minus the par of the rounds played); ties go to the better last round
function torBoard(){ const T=TOR.st, par=torPar(); return T.players.map((p,i)=>{ const n=p.sc.length, g=p.sc.reduce((a,r)=>a+r.g,0), net=g-(p.h||0)*n; return {i,n:p.n,h:p.h||0,sc:p.sc,rounds:n,g,net,tp:net-par*n,last:n?p.sc[n-1].g-(p.h||0):999}; })
  .sort((a,b)=>(a.rounds?0:1)-(b.rounds?0:1)||a.tp-b.tp||a.last-b.last); }
function torTP(v){ return v===0?'Par':(v>0?'+':'−')+Math.abs(v); }
function torStart(name,players,rounds,course,daily){ TOR.st={name:name||'Torneo de la familia',course,rounds,daily:!!daily,players:players.map(p=>({n:p.n,h:+p.h||0,sc:[]})),d:Date.now(),cur:null,done:false}; torSave(); }
function torCanPlay(i){ const T=TOR.st, p=T&&T.players[i]; if(!p||T.done||p.sc.length>=T.rounds) return 'fin'; if(T.daily&&p.sc.some(r=>!r.man&&torDay(r.d)===torDay(Date.now()))) return 'hoy'; return 'ok'; }
function torPlay(i){ const T=TOR.st; if(torCanPlay(i)!=='ok') return; T.cur=i; torSave(); if(T.course!==S.course) setCourse(T.course); BOT.on=false; playTee(true);
  setTimeout(()=>toast('Torneo: juega '+T.players[i].n,'Ronda '+(T.players[i].sc.length+1)+' de '+T.rounds+' · la tarjeta se apunta sola al acabar'),1600); }
function torAdd(i,g,man){ const T=TOR.st, p=T.players[i]; if(!p||p.sc.length>=T.rounds||!(g>0)) return false; p.sc.push({g:Math.round(g),d:Date.now(),man:man?1:0}); if(T.cur===i) T.cur=null; prgEarn(10,'Ronda del torneo'); torCheckEnd(); torSave(); return true; }
// called by endRound: a finished card counts for whoever was playing their tournament round
function torRound(ts,C){ const T=TOR.st; if(!T||T.done||T.cur===null||T.cur===undefined||C.k!==T.course) return false; const i=T.cur, p=T.players[i]; if(!torAdd(i,ts,false)) return false;
  toast('Torneo: '+p.n,'Ronda '+p.sc.length+' de '+T.rounds+': '+ts+' golpes'); setTimeout(()=>openModal('torneo',{title:T.done?'¡Torneo terminado!':'Torneo familiar'}),500); return true; }
function torCheckEnd(){ const T=TOR.st; if(T.done||!T.players.every(p=>p.sc.length>=T.rounds)) return; const B=torBoard(); T.done=true; T.champ=B[0].n; T.cer=true; T.end=Date.now();
  TOR.hist.unshift({name:T.name,champ:T.champ,d:T.end,course:T.course,rounds:T.rounds,res:B.map(r=>({n:r.n,g:r.g,tp:r.tp}))}); if(TOR.hist.length>12) TOR.hist.length=12;
  prgTrophy('campeon',T.champ,T.name); blip('gold'); }
function torCeremony(){ const T=TOR.st; if(!T||!T.done||!T.cer) return; T.cer=false; torSave(); P.cheerT=3; blip('gold'); setTimeout(()=>toast('¡'+T.champ+', campeón del '+T.name+'!','Su copa ya está en la vitrina de recepción'),700); }
function torGoTrophy(){ if(!HX.ok) return; closeModal(); hxGo('N'); setTimeout(()=>{ if(S.interior&&S.interior.hotel&&HX.vit){ const p=hxW(HX.vit.s,HX.F.iN+HX.vit.q-1.5); P.x=p[0]; P.z=p[1]; P.vx=P.vz=0; P.yaw=Math.atan2(HX.F.v[1],HX.F.v[0]); camS.yaw=P.yaw; S.snap=true; } },700); }
function torHTML(){ const T=TOR.st, fd=t=>new Date(t).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'}); const cn=k=>(W.COURSES[k]||W.COURSES[0]).name;
  let h='<p>Un torneo para jugar en familia a lo largo de <b>varios días</b>: cada jugador juega sus rondas completas del mismo recorrido (una al día, si quieres) en este dispositivo o apunta a mano la de un día real. Gana el <b>neto más bajo respecto al par</b>; el campeón se lleva la copa, que queda expuesta en la vitrina de recepción del hotel'+(HX.ok?'':' (en la isla de Valdecañas)')+', y la chaqueta verde.</p>';
  if(T&&!T.done){ const B=torBoard(), par=torPar();
    h+='<h3>'+T.name+'</h3><p class="note">'+cn(T.course)+' · par '+par+' · '+T.rounds+(T.rounds===1?' ronda':' rondas')+' · empezó el '+fd(T.d)+(T.daily?' · una ronda por jugador y día':'')+(T.cur!==null&&T.cur!==undefined?' · <b>ahora juega '+T.players[T.cur].n+'</b>':'')+'</p>';
    h+=torTable(B,T); h+='<div class="torrows">'+T.players.map((p,i)=>{ const c=torCanPlay(i); return '<div class="row"><b style="min-width:90px">'+p.n+'</b>'+(c==='ok'?'<button class="btn small primary" data-torp="'+i+'">Jugar ronda '+(p.sc.length+1)+'</button>':c==='hoy'?'<span class="note">Hoy ya ha jugado: vuelve mañana</span>':'<span class="note">Ha terminado sus rondas</span>')+'</div>'; }).join('')+'</div>';
    h+='<h3>Apuntar una ronda a mano</h3><p class="note">Para una vuelta real del mismo recorrido: golpes totales, sin descontar hándicap.</p><div class="row"><select id="torMP" style="font-size:16px">'+T.players.map((p,i)=>p.sc.length<T.rounds?'<option value="'+i+'">'+p.n+'</option>':'').join('')+'</select><input id="torMG" type="number" min="18" max="200" inputmode="numeric" placeholder="Golpes" style="font-size:16px;width:90px"><button class="btn small" id="torMS">Apuntar</button></div>';
    h+=torRead()+'<div class="row" style="margin-top:10px"><button class="btn small" id="torCancel">Cancelar el torneo</button></div>'; }
  else { if(T&&T.done){ const B=torBoard(); h+='<div class="torwin">'+cupSVG('g',true)+'<div><b>'+T.champ+'</b> gana el '+T.name+'<br><span class="note">'+cn(T.course)+' · terminó el '+fd(T.end||Date.now())+'</span></div></div>'+torTable(B,T)+'<div class="row">'+(HX.ok?'<button class="btn small primary" id="torHotel">Ver la copa en el hotel</button>':'')+'<button class="btn small" id="torNew">Nuevo torneo</button></div>'+torRead(); }
    else { const F=TOR.form; if(F.course===null) F.course=S.course; const names=[(S.name||'').trim()||'Yo','','','','',''];
      h+='<h3>Nuevo torneo</h3><div class="torform"><label>Nombre<br><input id="torName" value="Torneo de la familia '+new Date().getFullYear()+'" style="font-size:16px;width:100%"></label>'+
        (W.MULTI?'<div class="row" style="flex-wrap:wrap;gap:6px">'+W.COURSES.map(c=>'<button class="btn small'+(c.k===F.course?' primary':'')+'" data-torc="'+c.k+'">'+c.name+'</button>').join('')+'</div>':'')+
        '<div class="row" style="gap:6px"><span>Rondas:</span>'+[1,2,3,4].map(n=>'<button class="btn small'+(n===F.rounds?' primary':'')+'" data-torr="'+n+'">'+n+'</button>').join('')+'</div>'+
        '<p class="note" style="margin:6px 0 2px">Jugadores (de 2 a 6) y su hándicap de juego: los golpes que se descuentan en cada ronda (0 si no tiene).</p>'+
        names.map((n,i)=>'<div class="row"><input id="torP'+i+'" placeholder="Jugador '+(i+1)+'" value="'+n+'" style="font-size:16px;flex:1"><input id="torH'+i+'" type="number" min="0" max="54" inputmode="numeric" placeholder="Hcp" style="font-size:16px;width:70px"></div>').join('')+
        '<label class="row"><input type="checkbox" id="torDaily"'+(F.daily?' checked':'')+'> Una ronda por jugador y día (el torneo dura varios días)</label><div class="row"><button class="btn primary" id="torGo">Empezar el torneo</button></div></div>'; } }
  if(TOR.hist.length) h+='<h3>Campeones</h3><ul>'+TOR.hist.map(r=>'<li><b>'+r.champ+'</b> · '+r.name+' · '+cn(r.course)+' · '+fd(r.d)+' ('+torTP(r.res[0].tp)+')</li>').join('')+'</ul>';
  return h; }
function torTable(B,T){ return '<div class="tablewrap"><table class="card"><thead><tr><th>Pos.</th><th>Jugador</th><th>Hcp</th>'+Array.from({length:T.rounds},(_,i)=>'<th>R'+(i+1)+'</th>').join('')+'<th>Bruto</th><th>Neto</th><th>Al par</th></tr></thead><tbody>'+
  B.map((r,k)=>'<tr'+(T.done&&k===0?' class="win"':'')+'><td>'+(r.rounds?k+1:'–')+'</td><td><b>'+r.n+'</b></td><td class="num">'+r.h+'</td>'+Array.from({length:T.rounds},(_,i)=>'<td class="num">'+(r.sc[i]?r.sc[i].g+(r.sc[i].man?'*':''):'')+'</td>').join('')+'<td class="num">'+(r.rounds?r.g:'')+'</td><td class="num">'+(r.rounds?r.net:'')+'</td><td class="num"><b>'+(r.rounds?torTP(r.tp):'')+'</b></td></tr>').join('')+'</tbody></table></div>'; }
function torRead(){ return '<h3>Cómo se lee la clasificación</h3><ul><li><b>R1, R2…:</b> golpes de cada ronda; con asterisco, las apuntadas a mano.</li><li><b>Bruto:</b> la suma de golpes.</li><li><b>Neto:</b> el bruto menos el hándicap en cada ronda jugada.</li><li><b>Al par:</b> el neto comparado con el par de las rondas jugadas; manda en la clasificación (−3 va por delante de +2). Así se puede comparar a quien lleva más rondas con quien lleva menos.</li><li><b>Empate:</b> gana la mejor última ronda neta.</li></ul>'; }
function torWire(){ const B=$('sheetBody'); const T=TOR.st, re=()=>openModal('torneo',{title:'Torneo familiar'});
  B.querySelectorAll('[data-torc]').forEach(b=>b.onclick=()=>{ TOR.form.course=+b.dataset.torc; torKeep(); re(); }); B.querySelectorAll('[data-torr]').forEach(b=>b.onclick=()=>{ TOR.form.rounds=+b.dataset.torr; torKeep(); re(); });
  B.querySelectorAll('[data-torp]').forEach(b=>b.onclick=()=>torPlay(+b.dataset.torp));
  const go=$('torGo'); if(go) go.onclick=()=>{ const ps=[]; for(let i=0;i<6;i++){ const n=$('torP'+i).value.trim(); if(n) ps.push({n:n.slice(0,24),h:clamp(+$('torH'+i).value||0,0,54)}); }
    if(ps.length<2){ toast('Faltan jugadores','Pon al menos dos nombres'); return; } TOR.form.daily=$('torDaily').checked; torStart($('torName').value.trim().slice(0,40),ps,TOR.form.rounds,TOR.form.course,TOR.form.daily); TOR.keep=null; re(); };
  if(TOR.keep&&$('torName')){ const K=TOR.keep; $('torName').value=K.name; for(let i=0;i<6;i++){ $('torP'+i).value=K.p[i]; $('torH'+i).value=K.h[i]; } }
  const ms=$('torMS'); if(ms) ms.onclick=()=>{ const i=+$('torMP').value, g=+$('torMG').value; if(!(g>=18&&g<=200)){ toast('Golpes no válidos','Entre 18 y 200'); return; } torAdd(i,g,true); re(); };
  const cc=$('torCancel'); if(cc) cc.onclick=()=>{ if(cc.dataset.ok){ TOR.st=null; torSave(); re(); } else { cc.dataset.ok='1'; cc.textContent='Pulsa otra vez para cancelarlo'; } };
  const nw=$('torNew'); if(nw) nw.onclick=()=>{ TOR.st=null; torSave(); re(); }; const th=$('torHotel'); if(th) th.onclick=torGoTrophy; }
function torKeep(){ if(!$('torName')) return; TOR.keep={name:$('torName').value,p:[],h:[]}; for(let i=0;i<6;i++){ TOR.keep.p.push($('torP'+i).value); TOR.keep.h.push($('torH'+i).value); } }

// ---- the trophy cabinet in the hotel hall (built with the interior, see hxEnter): your trophies on the shelves, the champions' cups on top
function torHotel(c){ const {G,Q,solid,FP,fl,a,D,grp,F}=c; const s=12.9, q=Math.min(4.6,D/2-1.6); HX.vit={s,q}; const p=Q(s,q);
  G.wood.bx(p[0],fl,p[1],2.4,0.45,0.62,a); G.glass.bx(p[0],fl+0.45,p[1],2.36,1.55,0.58,a); G.wood.bx(p[0],fl+2.0,p[1],2.44,0.07,0.66,a); G.glass.bx(p[0],fl+1.05,p[1],2.3,0.025,0.54,a); G.glow.bx(p[0],fl+1.96,p[1],2.2,0.03,0.08,a);
  for(const [os,oq] of [[-1.19,-0.3],[1.19,-0.3],[-1.19,0.3],[1.19,0.3]]){ const k=Q(s+os,q+oq); G.frame.bx(k[0],fl+0.45,k[1],0.04,1.55,0.04,a); }
  solid(s,q,2.45,0.68,2.07,'vitrina de trofeos');
  const won=TRO.filter(t=>PRG.tro[t.id]).sort((x,y)=>PRG.tro[x.id].d-PRG.tro[y.id].d).slice(0,12);
  won.forEach((t,i)=>{ const sh=i<6?0:1, k=i%6, cp=Q(s-1.0+k*0.4,q); const m=cupMesh(t.m,t.m==='g'?0.3:t.m==='s'?0.26:0.23); m.position.set(cp[0],fl+(sh?1.075:0.46),cp[1]); m.rotation.y=-a; grp.add(m); });
  TOR.hist.slice(0,3).forEach((r,i)=>{ const cp=Q(s+(i===0?0:i===1?-0.75:0.75),q); const m=cupMesh('g',i===0?0.6:0.42); m.position.set(cp[0],fl+2.07,cp[1]); m.rotation.y=-a; grp.add(m); });
  const last=TOR.hist[0]; const tx=canvasTex(1024,192,(x,w,h)=>{ x.fillStyle='#2b2d2f'; x.fillRect(0,0,w,h); x.strokeStyle='#d4ad5a'; x.lineWidth=6; x.strokeRect(8,8,w-16,h-16); x.textAlign='center'; x.textBaseline='middle';
    x.fillStyle='#e7c9a9'; x.font='700 52px Figtree, system-ui, sans-serif'; x.fillText('VITRINA DE TROFEOS',w/2,62); x.fillStyle='#f6f2ea'; x.font='600 40px Figtree, system-ui, sans-serif';
    x.fillText(last?'Campeón: '+last.champ+' · '+last.name:won.length+(won.length===1?' trofeo':' trofeos'),w/2,134); });
  const pm=IM({map:tx,roughness:0.5}); for(const sd of [-1,1]){ const k=Q(s,q+sd*0.316); const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.9,0.36),pm); pl.position.set(k[0],fl+0.24,k[1]); pl.rotation.y=Math.atan2(F.v[0]*sd,F.v[1]*sd); grp.add(pl); } }
function torNearVit(){ if(!HX.vit||!S.interior||!S.interior.hotel) return false; const l=hxL(P.x,P.z), q=l[1]-HX.F.iN; return Math.abs(l[0]-HX.vit.s)<2.0&&Math.abs(q-HX.vit.q)<2.3; }

// ---- the «Premios» tab: coins, shop, cabinet of trophies, circuit records
function prgHTML(){ const fd=t=>new Date(t).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
  const has=w=>w==='water'?!!SKI.loop:w==='horse'?HORSES.length>0:w==='pier'?!!PIER.plat:true;
  let h='<div class="prghead"><i class="coin big"></i><div><b>'+PRG.coins+' monedas</b><br><span class="note">'+PRG.earned+' ganadas en total · '+Object.keys(PRG.tro).length+' de '+TRO.length+' trofeos</span></div></div>';
  h+='<p>Juega y gana <b>monedas</b>; con ellas desbloqueas ropa, palos y bolas de colores en la tienda. Los logros dan además <b>trofeos</b>, que se guardan en tu vitrina'+(HX.ok?' y aparecen en la vitrina de recepción del hotel':'')+'. Todo se guarda en este navegador y vale para los dos mundos.</p>';
  h+='<h3>Cómo se ganan monedas</h3><div class="tablewrap"><table class="card"><thead><tr><th>Qué</th><th>Monedas</th></tr></thead><tbody>'+
    [['Par en un hoyo',3],['Birdie',10],['Eagle o albatros',25],['Hoyo en uno',50],['Terminar una vuelta',20],['Récord de los Retos',15],['Bola dorada',5],['Carrera de karts','10 · ganarla +20 · récord +10'],['Circuito de boyas o caballos','10 · oro +15 · plata +8 · bronce +4 · récord +10'],['Slalom','2 por boya · récord +10'],['Récord de pesca o de saltos en esquí',10],['Ronda de torneo',10],['Cada trofeo','de 10 a 100']].map(r=>'<tr><td>'+r[0]+'</td><td class="num">'+r[1]+'</td></tr>').join('')+'</tbody></table></div>';
  h+='<h3>Tienda</h3><p class="note">Toca para comprar o ponértelo. «De serie» vuelve a la ropa de tu personaje. Lo que se gana con un trofeo no se compra.</p>';
  for(const sl in PRG_SLOTS){ const its=SHOP.filter(s=>s.slot===sl), cur=PRG.eq[sl];
    h+='<h4 style="margin:10px 0 4px">'+PRG_SLOTS[sl]+'</h4><div class="shop"><button class="it'+(cur?'':' on')+'" data-base="'+sl+'"><span class="sw" style="background:repeating-linear-gradient(45deg,#e9e4da 0 4px,#fff 4px 8px)"></span><span>De serie<small>'+(cur?'Ponértelo':'Puesto')+'</small></span></button>'+
      its.map(it=>{ const own=prgOwned(it), on=cur===it.id, lock=!own&&it.req, sub=on?'Puesto':own?'Tuyo · ponértelo':lock?'Con el trofeo «'+TRO.find(t=>t.id===it.req).n+'»':it.p+' monedas'+(PRG.coins<it.p?' (te faltan '+(it.p-PRG.coins)+')':'');
        return '<button class="it'+(on?' on':'')+(own||on?'':' lock')+'" data-buy="'+it.id+'"><span class="sw" style="background:'+it.c+'"></span><span>'+it.n+'<small>'+sub+'</small></span></button>'; }).join('')+'</div>'; }
  h+='<h3 id="prgVit">Vitrina de trofeos</h3><p class="note">Copa de oro, plata o bronce según lo difícil que es. En gris, los que te faltan, con lo que hay que hacer.</p><div class="vit">'+
    TRO.map(t=>{ const r=PRG.tro[t.id]; return '<div class="tr'+(r?'':' no')+'">'+cupSVG(r?t.m:'')+'<b>'+t.n+'</b>'+(r?METAL[t.m].n[0].toUpperCase()+METAL[t.m].n.slice(1)+' · '+r.who+' · '+fd(r.d)+(r.x?' · '+r.x:''):t.how+(has(t.w)?'':' (no en este mundo)'))+'</div>'; }).join('')+'</div>';
  let cr=''; for(const k in CIRK){ if(!cirOK(k)) continue; const R=cirRec(k); cr+='<tr><td>'+CIRK[k].n+'</td><td class="num">'+(R?(k==='slalom'?R.n+' boyas':kartFmt(R.ms)):'—')+'</td><td>'+(R&&R.md?cupSVG(R.md,true):'')+'</td><td>'+(R?R.who+' · '+fd(R.d):'')+'</td></tr>'; }
  if(cr) h+='<h3>Circuitos</h3><div class="tablewrap"><table class="card"><thead><tr><th>Circuito</th><th>Récord</th><th>Medalla</th><th>Quién y cuándo</th></tr></thead><tbody>'+cr+'</tbody></table></div><div class="row"><button class="btn small primary" id="prgCir">Ir a los circuitos</button></div>';
  if(PRG.log.length) h+='<h3>Últimos movimientos</h3><ul class="note">'+PRG.log.slice(0,8).map(l=>'<li>'+(l[1]>0?'+':'−')+Math.abs(l[1])+' · '+l[2]+'</li>').join('')+'</ul>';
  h+='<div class="row"><button class="btn small" id="prgReset">Borrar monedas, compras y trofeos</button></div>'; return h; }
function prgWire(){ const B=$('sheetBody'), re=()=>{ const y=B.scrollTop; openModal('premios',{title:'Premios'}); B.scrollTop=y; };
  B.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{ const r=prgBuy(b.dataset.buy), it=prgItem(b.dataset.buy); if(r==='poor') toast('Te faltan '+(it.p-PRG.coins)+' monedas','Juega birdies, circuitos y retos para ganarlas'); else if(r==='lock') toast('Se gana con un trofeo',TRO.find(t=>t.id===it.req).how); else if(r==='buy') toast('¡'+it.n+'!','Comprado y puesto'); re(); });
  B.querySelectorAll('[data-base]').forEach(b=>b.onclick=()=>{ prgBase(b.dataset.base); re(); });
  const c=$('prgCir'); if(c) c.onclick=()=>{ closeModal(); cirSheet(); };
  const r=$('prgReset'); if(r) r.onclick=()=>{ if(r.dataset.ok){ PRG.coins=0; PRG.earned=0; PRG.own={}; PRG.eq={}; PRG.tro={}; PRG.log=[]; prgSave(); prgApply(); re(); } else { r.dataset.ok='1'; r.textContent='Pulsa otra vez para borrarlo todo'; } }; }
function prgGuideHTML(){ return '<h3>Premios, circuitos y torneo</h3><ul><li><b>Monedas:</b> pares, birdies, eagles, hoyos en uno, vueltas terminadas, retos, bolas doradas, karts, circuitos, pesca y esquí dan monedas. Un aviso arriba a la derecha te dice cuántas.</li><li><b>Tienda</b> (menú, pestaña Premios): camisas, pantalones, gorras, palos y bolas de colores. La chaqueta verde y la bola dorada no se compran: se ganan con un trofeo.</li><li><b>Vitrina de trofeos:</b> '+TRO.length+' logros con copa de oro, plata o bronce. '+(HX.ok?'En el hotel, la vitrina de recepción muestra tus copas y las de los campeones del torneo; acércate y pulsa «Ver la vitrina».':'')+'</li><li><b>Circuitos</b> (botón del menú o del inicio): boyas en moto de agua y en lancha, slalom de esquí acuático y carrera de caballos, según lo que haya en el mundo. Contra el reloj, con medallas y con el fantasma dorado de tu récord.</li><li><b>Torneo familiar</b> (pestaña Torneo): de 2 a 6 jugadores, de 1 a 4 rondas en días distintos, con hándicap. La tarjeta se apunta sola al acabar la vuelta; también se puede apuntar a mano una vuelta real. El campeón se lleva la copa'+(HX.ok?' al hotel':'')+' y la chaqueta verde.</li></ul>'; }
function prgGlossHTML(){ return '<dt>Monedas</dt><dd>Premio por jugar bien; se gastan en la tienda. Se guardan en este navegador.</dd><dt>Trofeo</dt><dd>Logro que queda en la vitrina, con copa de oro, plata o bronce.</dd><dt>Puerta</dt><dd>Paso entre dos boyas o dos postes de un circuito; hay que cruzarlas en orden.</dd><dt>Fantasma</dt><dd>Columna dorada que repite tu mejor vuelta del circuito, para correr contra ella.</dd><dt>Slalom</dt><dd>Esquí acuático rodeando boyas alternas a cada lado de la estela de la lancha.</dd><dt>Hándicap de juego</dt><dd>Golpes que se descuentan a un jugador en cada ronda del torneo para igualar niveles.</dd><dt>Bruto y neto</dt><dd>Golpes totales; y los mismos golpes menos el hándicap.</dd>'; }

// ---- wiring: start screen, the HUD exit button, the pop-up
$('mPrem').onclick=()=>openModal('premios',{title:'Premios'});
$('mCirc').onclick=()=>cirSheet();
$('mTorneo').onclick=()=>{ saveName(); openModal('torneo',{title:'Torneo familiar'}); };
$('cirExit').onclick=()=>{ if(CIR.st==='done'&&CIR.res) cirResults(); else cirSheet(); };
prgLoad(); torLoad(); prgBall();

/* ---- clean screen in competitions: while a kart race or a circuit is on, the status card goes, the race box shrinks,
   coin notices wait until the finish and instructions you have already read are not shown again. «Avisos: pocos» in the
   menu keeps the small boxes and the read-once instructions all the time. ---- */
var QUIET={race:false,on:store.get('vg_quiet')==='1'};
function raceNow(){ return (KART.on&&!KART.done)||((CIR.st==='count'||CIR.st==='run')&&!!CIR.K); }
function quietNow(){ return QUIET.race||['aim','swing','flight'].includes(S.mode); }
function raceUI(){ const r=raceNow(); if(r!==QUIET.race){ QUIET.race=r; document.body.classList.toggle('race',r); if(r&&ppT>0){ ppT=0; const el=$('prgPop'); if(el) el.classList.remove('show'); } } }
function setQuiet(on){ QUIET.on=!!on; store.set('vg_quiet',on?'1':'0'); document.body.classList.toggle('quiet',QUIET.on); const b=$('mQuiet'); if(b) b.textContent='Avisos: '+(QUIET.on?'pocos':'todos'); }
setQuiet(QUIET.on);
