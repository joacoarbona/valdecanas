/* ================= Pilla-pilla y escondite de noche (D2, solo Valdecañas con WP.pilla) ================= */
// Uno la liga con linterna (cono de luz) y los demás se esconden por las villas y jardines de una zona marcada con farolillos.
// Escondite: quien la liga cuenta 20 s en la casa y luego busca; a quien pilla, busca con él. Pilla-pilla: quien la liga
// pilla a otro y se cambian. Radar a falta de 30 s. Con la sala (mensajes tgo invitación, tgj me apunto, tgs salida,
// tgc pillada, tgx me voy; estado tg = [partida, papel + 4·agachado, puntos, pilladas, rumbo de la linterna ×100])
// o, sin amigos, con jugadores de la máquina. Nombres tg*, estado TG.
var TG={ok:false,built:false,on:false,g:null,md:'esc',zi:0,dur:180,nb:3,first:'azar',tab:'jugar',zones:[],bots:[],grp:null,ring:null,ringZ:null,lamps:[],myCone:null,
  st:null,night:{},prevTOD:null,hudT:0,radT:0,still:0,crouch:false,outT:0,seen:false,seenT:0,pingT:0,beepS:-1,coneGeo:null,coneMat:null,tags:[]};
TOD_PRESETS.pilla=[-12,300,{sun:1.15,hemi:1.05}];
const TG_MD={esc:{n:'Escondite',ic:'🙈',hide:20,r:75},pilla:{n:'Pilla-pilla',ic:'🏃',hide:6,r:55}};
const TG_LR=26, TG_LRC=13, TG_NEAR=4.2, TG_NEARC=2.6, TG_HALF=0.42, TG_TOUCH=1.6, TG_ACT=3.2, TG_RADAR=30, TG_LEN=24;
TRO.push({id:'escondido',n:'Escondido hasta el final',how:'Acaba una ronda de escondite sin que te pillen, con al menos 3 jugadores.',m:'s',c:15,w:'pilla'},
  {id:'pillapilla',n:'Rey del pilla-pilla',how:'Gana una ronda de pilla-pilla (más puntos que nadie) con al menos 3 jugadores.',m:'g',c:20,w:'pilla'});
function tgLoad(){ let o={}; try{ o=JSON.parse(store.get('vg_tg')||'{}')||{}; }catch(e){ o={}; } TG.st=Object.assign({r:0,w:0,best:0,c:0,h:0,sv:0},o); }
function tgSave(){ store.set('vg_tg',JSON.stringify(TG.st)); }
function tgNow(){ return Date.now(); }
function tgPlaying(){ const G=TG.g; return TG.on&&!!G&&(G.phase==='hide'||G.phase==='play'); }
/* ---- zones: the three clusters of villas with most houses, far apart, centred on a free spot (the «casa») ---- */
function tgTreeNear(x,z,m){ const a=treeGrid.get(Math.floor(x/20)+','+Math.floor(z/20)); if(a) for(const t of a) if(Math.hypot(x-t.x,z-t.z)<t.tr+m) return true; return false; }
function tgFree(x,z,m){ if(bldAt(x,z,m===undefined?0.7:m)||W.poolAt(x,z)||tgTreeNear(x,z,0.5)) return false; return dsSpot({k:'walk',o:{y:W.terrain(x,z)}},x,z); }
function tgFreeNear(x,z,R,m){ if(tgFree(x,z,m)) return [x,z]; for(let r=2;r<=R;r+=2){ const n=Math.max(8,Math.round(r*1.6)); for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+r*0.37, px=x+Math.cos(a)*r, pz=z+Math.sin(a)*r; if(tgFree(px,pz,m)) return [px,pz]; } } return null; }
function tgZones(){ if(TG.zones.length||!WP.pilla) return TG.zones; const vs=BLD.filter(b=>b.kind==='villa'&&b.ring&&b.c); if(!vs.length) return TG.zones;
  const H=W.HOT||[0,0], cand=vs.map(b=>{ let n=0; for(const o of vs) if(Math.hypot(o.c[0]-b.c[0],o.c[1]-b.c[1])<70) n++; return {x:b.c[0],z:b.c[1],n}; }).sort((a,b)=>b.n-a.n);
  const pick=[]; for(const c of cand){ if(pick.length>=(WP.pilla.zones||3)) break; if(pick.some(p=>Math.hypot(p.x-c.x,p.z-c.z)<230)) continue; const f=tgFreeNear(c.x,c.z,36,1.6); if(!f) continue; pick.push({x:f[0],z:f[1],n:c.n}); }
  const DIR=['del este','del noreste','del norte','del noroeste','del oeste','del suroeste','del sur','del sureste'], used={};
  pick.sort((a,b)=>Math.hypot(a.x-H[0],a.z-H[1])-Math.hypot(b.x-H[0],b.z-H[1])).forEach((p,i)=>{ const d=Math.hypot(p.x-H[0],p.z-H[1]);
    let n=d<260?'Villas del hotel':'Villas '+DIR[((Math.round(Math.atan2(-(p.z-H[1]),p.x-H[0])/(Math.PI/4))%8)+8)%8]; if(used[n]){ used[n]++; n+=' '+used[n]; } else used[n]=1;
    p.name=n; p.villas=vs.filter(b=>Math.hypot(b.c[0]-p.x,b.c[1]-p.z)<75).length; p.i=i; });
  TG.zones=pick; return pick; }
function tgZoneR(md){ return (TG_MD[md]||TG_MD.esc).r; }
// hiding spots: a metre outside the walls of the houses and behind the trunks of the trees in the zone
function tgSpots(z){ if(z.spots) return z.spots; const L=[], seen=new Set(), r0=z.r-3;
  const add=(x,zz,k)=>{ if(Math.hypot(x-z.x,zz-z.z)>r0) return; const key=Math.round(x/2.5)+','+Math.round(zz/2.5); if(seen.has(key)) return; seen.add(key); if(tgFree(x,zz,0.55)) L.push({x,z:zz,k}); };
  for(const b of BLD){ if(!b.solid||!b.ring||!b.c||Math.hypot(b.c[0]-z.x,b.c[1]-z.z)>z.r+25) continue; const r=b.ring;
    for(let i=0,j=r.length-1;i<r.length;j=i++){ const ax=r[j][0], az=r[j][1], bx=r[i][0], bz=r[i][1], Lg=Math.hypot(bx-ax,bz-az); if(Lg<2) continue; let nx=(bz-az)/Lg, nz=-(bx-ax)/Lg;
      if(inBld(b,(ax+bx)/2+nx*0.4,(az+bz)/2+nz*0.4)){ nx=-nx; nz=-nz; } for(let s=1;s<Lg-0.6;s+=3.2) add(ax+(bx-ax)*s/Lg+nx*1.05,az+(bz-az)*s/Lg+nz*1.05,'w'); } }
  for(let gx=Math.floor((z.x-z.r)/20);gx<=Math.floor((z.x+z.r)/20);gx++) for(let gz=Math.floor((z.z-z.r)/20);gz<=Math.floor((z.z+z.r)/20);gz++){ const a=treeGrid.get(gx+','+gz); if(!a) continue;
    for(const t of a){ const ang=Math.atan2(t.z-z.z,t.x-z.x); add(t.x+Math.cos(ang)*(t.tr+0.75),t.z+Math.sin(ang)*(t.tr+0.75),'t'); } }
  z.spots=L; return L; }
/* ---- seeing: the flashlight sees far inside its cone, and anyone sees a short way all round in the dark ---- */
function tgLOS(ax,az,bx,bz){ const d=Math.hypot(bx-ax,bz-az), n=Math.ceil(d/0.8); for(let i=1;i<n;i++){ const f=i/n, x=ax+(bx-ax)*f, z=az+(bz-az)*f;
    for(const b of bldsNear(x,z)){ if(b.solid&&b.top-b.base>1.3&&inBld(b,x,z)) return false; } if(tgTreeNear(x,z,-0.1)) return false; } return true; }
function tgSees(sx,sz,yaw,tx,tz,crouch){ const dx=tx-sx, dz=tz-sz, d=Math.hypot(dx,dz); if(d>(crouch?TG_LRC:TG_LR)) return false;
  if(d>(crouch?TG_NEARC:TG_NEAR)){ let a=Math.atan2(dz,dx)-yaw; while(a>Math.PI) a-=2*Math.PI; while(a<-Math.PI) a+=2*Math.PI; if(Math.abs(a)>TG_HALF) return false; } return tgLOS(sx,sz,tx,tz); }
/* ---- the players: you, the computer's players and the friends of the sala who joined ---- */
function tgMe(){ const G=TG.g; return G&&!G.bots&&MP.id?MP.id:'me'; }
function tgPeerOf(id){ return MP.peers.get(id)||null; }
function tgPeerState(p){ const s=p&&(p.out||p.cur); return s&&s.tg&&TG.g&&s.tg[0]===TG.g.id?s:null; }
function tgRole(id){ const G=TG.g; if(!G) return 0; if(id===tgMe()||id.charAt(0)==='b'&&TG.bots.some(b=>b.id===id)) return G.role[id]|0;
  const t=G.roleT[id]||0, s=tgPeerState(tgPeerOf(id)); if(s&&tgNow()-t>2500) return s.tg[1]&3; return G.role[id]|0; }
function tgScore(id){ const G=TG.g; return Math.floor((G.free[id]||0)/10)+5*(G.catches[id]|0)+(G.bonus[id]|0); }
// everyone in the game with a position: {id,n,x,y,z,aim,crouch,me,bot,p}
function tgAll(){ const G=TG.g, L=[]; if(!G) return L; const me=tgMe();
  L.push({id:me,n:'Tú',x:P.x,y:P.y,z:P.z,aim:camS.yaw,crouch:TG.crouch,me:1});
  for(const b of TG.bots) L.push({id:b.id,n:b.n,x:b.x,y:b.y,z:b.z,aim:b.aim,crouch:b.crouch,bot:b});
  if(!G.bots) for(const p of MP.peers.values()){ const s=tgPeerState(p); if(!s||!G.ids.includes(p.id)) continue; const q=p.tgS||s; L.push({id:p.id,n:p.n||'Amigo',x:q.x,y:q.y,z:q.z,aim:s.tg[4]/100,crouch:!!(s.tg[1]&4),p}); }
  return L; }
function tgName(id){ if(id===tgMe()) return 'Tú'; const b=TG.bots.find(q=>q.id===id); if(b) return b.n; const p=tgPeerOf(id); return p?(p.n||'Amigo'):'Alguien'; }
function tgRows(){ const G=TG.g; if(!G) return []; const L=tgAll().map(e=>({id:e.id,n:e.n,me:!!e.me,bot:!!e.bot,role:tgRole(e.id),pts:e.p?tgPeerState(e.p).tg[2]:tgScore(e.id),c:e.p?tgPeerState(e.p).tg[3]:(G.catches[e.id]|0)}));
  L.sort((a,b)=>b.pts-a.pts||b.c-a.c||(a.me?-1:b.me?1:0)); return L; }
/* ---- the sheet's settings and starting ---- */
function tgCanGo(){ return ['walk','drive','ride','jet','bike','menu','drone','fly','pas','pow','sled','aim','ski'].includes(S.mode); }
function tgWhyNot(){ if(!WP.pilla) return 'En este mundo no hay pilla-pilla'; if(raceNow()) return 'Termina antes la carrera'; if(!tgCanGo()) return 'Termina antes lo que estás haciendo'; if(!tgZones().length) return 'No hay villas para jugar'; return ''; }
function tgNewGame(o){ const md=o.md==='pilla'?'pilla':'esc', z0=o.z; const z={x:z0.x,z:z0.z,r:tgZoneR(md),name:z0.name,i:z0.i};
  return {id:o.id||1+((Math.random()*999999)|0),md,z,dur:clamp(o.dur|0,60,600),phase:'lobby',go:o.go||0,t0:0,hideEnd:0,end:0,host:o.host||'',bots:!!o.bots,joined:[],ids:[],
    role:{},roleT:{},free:{},catches:{},bonus:{},frozen:{},immune:{},firstCaught:null,lastIt:null,noIt:0,pend:[],resT:0,awarded:false,endT:0,place:false,allT:0,tagged:{}}; }
function tgStart(){ const w=tgWhyNot(); if(w){ toast('Pilla-pilla',w); return; } ensureAudio(); const Z=tgZones()[TG.zi]||tgZones()[0];
  if(MP.code&&MP.peers.size){ tgInvite(Z); return; } tgBotGame(Z); }
function tgBotGame(Z,first){ tgEndAll(true); const G=tgNewGame({md:TG.md,z:Z,dur:TG.dur,bots:true,host:'me'}); TG.g=G; TG.on=true; tgBuild();
  const L=kbBotList(clamp(TG.nb,1,5),false); TG.bots=L.map((d,k)=>tgBotMake(d,k)); const ids=['me',...TG.bots.map(b=>b.id)];
  const it=first&&ids.includes(first)?first:(TG.first==='yo'?'me':ids[(Math.random()*ids.length)|0]); tgBegin(ids,it,tgNow()+1200); }
function tgInvite(Z){ tgEndAll(true); const G=tgNewGame({md:TG.md,z:Z,dur:TG.dur,host:MP.id,go:tgNow()+12000}); G.joined=[MP.id]; TG.g=G; TG.on=true; tgBuild();
  mpSend({t:'tgo',id:G.id,md:G.md,z:[Math.round(G.z.x*10)/10,Math.round(G.z.z*10)/10,G.z.r],zn:G.z.name,dur:G.dur,go:G.go});
  $('tgSheet').hidden=true; closeModal(); toast(TG_MD[G.md].ic+' '+TG_MD[G.md].n+' de noche','Invitación enviada a la sala: empieza en 12 s con los que se apunten'); tgUI(); }
function tgAccept(o,host){ if(TG.on&&TG.g&&TG.g.phase!=='end'&&TG.g.phase!=='lobby'){ toast('Pilla-pilla','Ya estás jugando una partida'); return; } tgEndAll(true);
  const Z={x:o.z[0],z:o.z[1],name:String(o.zn||'La zona').slice(0,40)}; const G=tgNewGame({id:o.id,md:o.md,z:Z,dur:o.dur,host,go:o.go}); G.z.r=clamp(+o.z[2]||tgZoneR(G.md),30,120); TG.g=G; TG.on=true; tgBuild();
  mpSend({t:'tgj',g:G.id}); toast('Te has apuntado','Empieza en '+Math.max(1,Math.ceil((G.go-tgNow())/1000))+' s'); tgUI(); }
// the host closes the list: who la liga first, and everybody starts together
function tgLobbyTick(){ const G=TG.g; if(!G||G.phase!=='lobby') return; const now=tgNow();
  if(G.host===MP.id&&now>=G.go){ const ids=G.joined.filter(id=>id===MP.id||MP.peers.has(id));
    if(ids.length<2){ toast('Nadie se ha apuntado','Jugáis tú y los jugadores de la máquina'); const Z=G.z; tgBotGame(Z); return; }
    const it=TG.first==='yo'?MP.id:ids[(Math.random()*ids.length)|0], t0=now+1500; mpSend({t:'tgs',g:G.id,ids,it,t0}); tgBegin(ids,it,t0); }
  else if(G.host!==MP.id&&now>G.go+9000){ TG.on=false; TG.g=null; toast('El juego no ha empezado','Quien invitaba se ha ido de la sala'); tgUI(); } }
function tgBegin(ids,it,t0){ const G=TG.g; if(!G) return; const md=TG_MD[G.md]; G.ids=ids.slice(); G.t0=t0; G.hideEnd=t0+md.hide*1000; G.end=G.hideEnd+G.dur*1000; G.phase='hide';
  for(const id of ids){ G.role[id]=id===it?1:0; G.free[id]=0; G.catches[id]=0; G.bonus[id]=0; } G.frozen[it]=G.hideEnd; G.lastIt=it; G.place=true; G.placeK=ids.indexOf(tgMe());
  for(const b of TG.bots) tgBotPlace(b,ids.indexOf(b.id),b.id===it);
  if(!TG.prevTOD&&!HL.on){ TG.prevTOD=TOD.mode; TOD.mode='pilla'; updateTOD(true); if(typeof ppSnapExposure==='function') ppSnapExposure(); }
  $('tgSheet').hidden=true; closeModal(); hideMap(); const meIt=it===tgMe();
  toast(md.ic+' '+md.n+' · '+G.z.name,meIt?(G.md==='esc'?'La ligas tú: cuenta hasta 20 en la casa y luego busca con la linterna':'La ligas tú: en 6 s sales a pillar'):(tgName(it)+' la liga: '+(G.md==='esc'?'tienes 20 s para esconderte':'¡corre, que en 6 s sale a pillar!')));
  blip('cup'); tgUI(); }
// where you start: whoever la liga at the casa, the rest in a ring round it
function tgStartSpot(k,isIt){ const z=TG.g.z; if(isIt) return [z.x,z.z,0]; const a=k*2.399+0.6, r=5+(k%3)*2.2; const f=tgFreeNear(z.x+Math.cos(a)*r,z.z+Math.sin(a)*r,8,0.6)||[z.x+Math.cos(a)*r,z.z+Math.sin(a)*r]; return [f[0],f[1],Math.atan2(f[1]-z.z,f[0]-z.x)]; }
function tgPlaceMe(){ const G=TG.g; if(!G) return; G.place=false; TG.placedT=tgNow(); const isIt=tgRole(tgMe())>=1, s=tgStartSpot(Math.max(0,G.placeK),isIt);
  fadeTo(()=>{ tgLeaveAll(); P.x=s[0]; P.z=s[1]; P.y=groundAt(s[0],s[1],W.terrain(s[0],s[1])+2); P.vx=P.vy=P.vz=0; P.swim=false; P.onGround=true; P.yaw=isIt?Math.atan2(-1,0):s[2]; camS.yaw=P.yaw; S.snap=true; setMode('walk'); TG.frzX=P.x; TG.frzZ=P.z; TG.placedT=tgNow(); }); }
function tgLeaveAll(){ if(S.mode==='ski') stopSki(); if(S.mode==='sled') snLeave(true);
  if(P.fly){ if(!P.fly.gnd){ const A=P.fly; A.x=A.home[0]; A.y=A.home[1]; A.z=A.home[2]; A.yaw=A.home[3]; A.gnd=true; A.vf=A.vy=0; flPlace(A); } flLeave(); }
  snLeaveAll(); if(HX.sit&&typeof hxStand==='function') hxStand(); }
/* ---- catching ---- */
function tgCatch(by,who,net){ const G=TG.g; if(!G||G.phase!=='play'||by===who) return false; const now=tgNow(), me=tgMe(); if(G.tagged[who+'|'+by]&&now-G.tagged[who+'|'+by]<1500) return false;
  if(G.md==='pilla'){ if(!net&&(tgRole(by)!==1||tgRole(who)!==0||(G.immune[who]||0)>now||(G.frozen[by]||0)>now)) return false;
    G.role[by]=0; G.role[who]=1; G.roleT[by]=G.roleT[who]=now; G.frozen[who]=now+3000; G.immune[by]=now+4500; G.lastIt=who; }
  else { if(!net&&(tgRole(by)<1||tgRole(who)!==0||(G.frozen[by]||0)>now)) return false; G.role[who]=2; G.roleT[who]=now; if(!G.firstCaught) G.firstCaught=who; }
  G.tagged[who+'|'+by]=now;
  if(!net) G.catches[by]=(G.catches[by]|0)+1;
  if(!G.bots&&!net&&by===me){ mpSend({t:'tgc',g:G.id,by,who}); G.pend.push({who,n:0,t:now}); }
  if(by===me){ blip('cup'); TG.st.c++; tgSave(); toast('¡Pillado!',G.md==='pilla'?'Has pillado a '+tgName(who)+': ahora la liga y tú corres':'Has pillado a '+tgName(who)+': ahora busca contigo'); }
  else if(who===me){ blip('hit'); TG.crouch=false; toast('¡Te ha pillado '+tgName(by)+'!',G.md==='pilla'?'Ahora la ligas tú: cuenta 3 y a pillar':'Ahora buscas tú también, con tu linterna'); }
  else if(TG.on) toast(tgName(by)+' ha pillado a '+tgName(who),G.md==='pilla'?'Ahora la liga '+tgName(who):'Quedan '+tgHiders()+' escondidos');
  tgUI(); return true; }
function tgHiders(){ return tgAll().filter(e=>tgRole(e.id)===0).length; }
/* ---- the computer's players ---- */
function tgBotMake(d,k){ const R=buildRig(d.sk); if(R.club) R.club.visible=false; scene.add(R.root);
  const b={id:'b'+k,n:d.n,sk:d.sk,R,x:0,y:0,z:0,yaw:0,aim:0,v:0,animT:Math.random()*3,crouch:false,st:'idle',tx:0,tz:0,spot:null,stam:1,sideT:0,side:1,stuckT:0,chk:Math.random()*0.2,seeT:0,chase:null,lsx:0,lsz:0,lostT:0,
    seen:new Set(),wanT:0,fleeT:0,cone:null,tag:null};
  b.tag=document.createElement('div'); b.tag.className='ptag'; b.tag.hidden=true; $('labels').appendChild(b.tag); return b; }
function tgBotPlace(b,k,isIt){ const s=tgStartSpot(Math.max(0,k),isIt); b.x=s[0]; b.z=s[1]; b.y=groundAt(s[0],s[1],W.terrain(s[0],s[1])+2); b.yaw=isIt?-Math.PI/2:s[2]; b.aim=b.yaw; b.v=0; b.st='idle'; b.spot=null; b.chase=null; b.stam=1; b.crouch=false; b.seen.clear(); }
function tgBotRemove(){ for(const b of TG.bots){ scene.remove(b.R.root); try{ mpDispose(b.R.root); }catch(e){} if(b.cone) scene.remove(b.cone); if(b.tag) b.tag.remove(); } TG.bots=[]; }
function tgClampZone(x,z,m){ const Z=TG.g.z, dx=x-Z.x, dz=z-Z.z, d=Math.hypot(dx,dz), R=Z.r-(m||3); if(d<=R) return [x,z]; return [Z.x+dx/d*R,Z.z+dz/d*R]; }
function tgBotMove(b,tx,tz,spd,dt){ [tx,tz]=tgClampZone(tx,tz,2.5); let dx=tx-b.x, dz=tz-b.z; const d=Math.hypot(dx,dz); if(d<0.35){ b.v=Math.max(0,b.v-dt*24); return true; }
  let ux=dx/d, uz=dz/d; if(b.sideT>0){ b.sideT-=dt; const sx=-uz*b.side, sz=ux*b.side; ux=ux*0.25+sx; uz=uz*0.25+sz; const l=Math.hypot(ux,uz); ux/=l; uz/=l; }
  b.v+=(Math.min(spd,d*4)-b.v)*Math.min(1,dt*7); let nx=b.x+ux*b.v*dt, nz=b.z+uz*b.v*dt; const r=collide(nx,nz,b.y,0.36,false); nx=r[0]; nz=r[1];
  if(W.terrain(nx,nz)<W.waterLevel(nx,nz)-0.6||W.poolAt(nx,nz)){ nx=b.x; nz=b.z; b.sideT=0.9; b.side=Math.random()<0.5?1:-1; }
  const mv=Math.hypot(nx-b.x,nz-b.z); if(b.v>1&&mv<b.v*dt*0.35){ b.stuckT+=dt; if(b.stuckT>0.45){ b.stuckT=0; b.sideT=0.7+Math.random()*0.6; b.side=Math.random()<0.5?1:-1; } } else b.stuckT=Math.max(0,b.stuckT-dt*0.5);
  if(mv>0.004) b.yaw=lerpAng(b.yaw,Math.atan2(nz-b.z,nx-b.x),1-Math.exp(-dt*10)); b.x=nx; b.z=nz; b.y=groundAt(nx,nz,b.y+0.65); return false; }
function tgThreat(b){ let best=null, bd=1e9; for(const e of tgAll()){ if(e.id===b.id||tgRole(e.id)<1) continue; const d=Math.hypot(e.x-b.x,e.z-b.z); if(d<bd){ bd=d; best=e; } } return best?{e:best,d:bd}:null; }
function tgPickSpot(b,away){ const Z=TG.g.z, L=tgSpots(Z), taken=new Set(TG.bots.filter(q=>q!==b&&q.spot).map(q=>q.spot)); if(!L.length){ const a=Math.random()*6.28; return {x:Z.x+Math.cos(a)*Z.r*0.6,z:Z.z+Math.sin(a)*Z.r*0.6}; }
  const sc=[]; for(let i=0;i<40;i++){ const s=L[(Math.random()*L.length)|0]; if(taken.has(s)) continue; const dB=Math.hypot(s.x-Z.x,s.z-Z.z); let v=Math.min(dB,Z.r*0.8)+(tgLOS(Z.x,Z.z,s.x,s.z)?0:25)+Math.random()*12;
    if(away){ const da=Math.hypot(s.x-away.x,s.z-away.z); v+=Math.min(da,40)*1.5-(da<15?60:0); } sc.push([v,s]); } sc.sort((a,b)=>b[0]-a[0]); return sc.length?sc[0][1]:L[0]; }
function tgBotTick(b,dt,T){ const G=TG.g, now=tgNow(), role=tgRole(b.id), play=G.phase==='play', radar=play&&G.end-now<=TG_RADAR*1000; let tx=b.x, tz=b.z, spd=0;
  if(G.phase==='end'){ b.v=Math.max(0,b.v-dt*20); b.crouch=false; }
  else if((G.frozen[b.id]||0)>now){ b.v=0; b.crouch=false; b.aim=b.yaw; }
  else if(role>=1){ // whoever la liga: sees with the flashlight, chases, and on the radar goes straight for the nearest
    b.chk-=dt; if(b.chk<=0){ b.chk=0.2; let best=null, bd=1e9; for(const e of tgAll()){ if(tgRole(e.id)!==0||(G.md==='pilla'&&(G.immune[e.id]||0)>now)) continue; const d=Math.hypot(e.x-b.x,e.z-b.z);
        const vis=radar||(G.md==='pilla'?d<30&&(d<12||tgLOS(b.x,b.z,e.x,e.z)):tgSees(b.x,b.z,b.aim,e.x,e.z,e.crouch)); if(vis&&d<bd){ bd=d; best=e; } }
      if(best){ b.seeT+=0.2; if(b.seeT>=0.35||radar||G.md==='pilla'){ b.chase=best.id; b.lsx=best.x; b.lsz=best.z; b.lostT=0; } } else b.seeT=Math.max(0,b.seeT-0.2); }
    const t=b.chase?tgAll().find(e=>e.id===b.chase):null;
    if(t&&tgRole(t.id)===0&&!(G.md==='pilla'&&(G.immune[t.id]||0)>now)){ const d=Math.hypot(t.x-b.x,t.z-b.z); if(radar||d<6||tgSees(b.x,b.z,b.aim,t.x,t.z,t.crouch)||G.md==='pilla'&&d<30){ b.lsx=t.x; b.lsz=t.z; b.lostT=0; } else b.lostT+=dt;
      if(b.lostT>3){ b.chase=null; } tx=b.lsx; tz=b.lsz; spd=b.stam>0?(G.md==='pilla'?8.6:8.4):6.6; b.stam=Math.max(0,b.stam-dt*0.14);
      if(d<TG_TOUCH&&tgCatch(b.id,t.id)){ b.chase=null; b.seeT=0; } b.aim=lerpAng(b.aim,Math.atan2(t.z-b.z,t.x-b.x),1-Math.exp(-dt*8)); }
    else { b.chase=null; b.stam=Math.min(1,b.stam+dt*0.12); // patrol the hiding spots, sweeping the light
      if(!b.spot||Math.hypot(b.spot.x-b.x,b.spot.z-b.z)<1.5){ const L=tgSpots(G.z); let best=null, bd=1e9; for(let i=0;i<30&&L.length;i++){ const s=L[(Math.random()*L.length)|0]; if(b.seen.has(s)) continue; const d=Math.hypot(s.x-b.x,s.z-b.z)+Math.random()*25; if(d<bd){ bd=d; best=s; } }
        if(best){ b.seen.add(best); if(b.seen.size>40) b.seen.clear(); b.spot=best; } else { const a=Math.random()*6.28; b.spot={x:G.z.x+Math.cos(a)*G.z.r*0.5,z:G.z.z+Math.sin(a)*G.z.r*0.5}; } }
      tx=b.spot.x; tz=b.spot.z; spd=G.md==='pilla'?5.6:5.0; b.aim=b.yaw+Math.sin(T*1.6+b.animT)*0.55; } b.crouch=false; }
  else if(G.md==='esc'){ // hiding: go to a spot, crouch, and run if the light finds you
    const th=tgThreat(b), seen=play&&th&&(th.d<7||tgSees(th.e.x,th.e.z,th.e.aim,b.x,b.z,b.crouch));
    if(seen){ b.st='flee'; b.fleeT=2.5; } if(b.st==='flee'&&th){ b.fleeT-=dt; let ax=b.x-th.e.x, az=b.z-th.e.z; const l=Math.hypot(ax,az)||1; ax/=l; az/=l; const [cx,cz]=tgClampZone(b.x+ax*10,b.z+az*10,4); tx=cx; tz=cz;
      if(Math.hypot(cx-(b.x+ax*10),cz-(b.z+az*10))>2){ const s2=(b.side||1); tx=b.x-az*10*s2; tz=b.z+ax*10*s2; } spd=b.stam>0?8.8:5.6; b.stam=Math.max(0,b.stam-dt*0.16); b.crouch=false;
      if(b.fleeT<=0&&th.d>16){ b.st='go'; b.spot=tgPickSpot(b,th.e); } }
    else { b.stam=Math.min(1,b.stam+dt*0.1); if(!b.spot){ b.spot=tgPickSpot(b,null); b.st='go'; } tx=b.spot.x; tz=b.spot.z; spd=G.phase==='hide'?6.2:5.0;
      if(Math.hypot(tx-b.x,tz-b.z)<0.6){ b.st='hid'; spd=0; } b.crouch=b.st==='hid'&&b.v<0.3; } b.aim=b.yaw; }
  else { // pilla-pilla: wander, and run away from whoever la liga
    const th=tgThreat(b); b.crouch=false; if(th&&th.d<15&&!((G.immune[b.id]||0)>now&&th.d>4)){ let ax=b.x-th.e.x, az=b.z-th.e.z; const l=Math.hypot(ax,az)||1; ax/=l; az/=l; let [cx,cz]=tgClampZone(b.x+ax*10,b.z+az*10,4);
      if(Math.hypot(cx-(b.x+ax*10),cz-(b.z+az*10))>2){ cx=b.x-az*10*b.side; cz=b.z+ax*10*b.side; } tx=cx; tz=cz; spd=b.stam>0?9.0:5.8; b.stam=Math.max(0,b.stam-dt*0.15); }
    else { b.stam=Math.min(1,b.stam+dt*0.1); b.wanT-=dt; if(b.wanT<=0||!b.spot||Math.hypot(b.spot.x-b.x,b.spot.z-b.z)<1.5){ b.wanT=4+Math.random()*4; const a=Math.random()*6.28, r=Math.random()*G.z.r*0.8; b.spot={x:G.z.x+Math.cos(a)*r,z:G.z.z+Math.sin(a)*r}; }
      tx=b.spot.x; tz=b.spot.z; spd=4.2; } b.aim=b.yaw; }
  if(spd>0) tgBotMove(b,tx,tz,spd,dt); else b.v=Math.max(0,b.v-dt*20);
  // pose
  const R=b.R, k=clamp(b.v/10.5,0.2,1); if(b.v>0.4){ b.animT+=dt*b.v*1.15; poseRig(R,'run',b.animT,k); } else poseRig(R,'idle',T+b.animT,0);
  R.root.position.set(b.x,b.y,b.z); R.root.rotation.set(0,-b.yaw,0); if(b.crouch) tgCrouchPose(R); if(role>=1&&G.phase!=='end') tgArmPose(R); }
/* ---- poses: crouching and holding the flashlight ---- */
function tgCrouchPose(R){ R.body.position.y=0.6; R.lL.hg.rotation.z=R.lR.hg.rotation.z=1.15; R.lL.kn.rotation.z=R.lR.kn.rotation.z=-2.0; R.torso.rotation.z=-0.35; R.headG.rotation.z=0.25; }
function tgArmPose(R){ R.aR.sg.rotation.set(0,0,1.25); R.aR.el.rotation.set(0,0,0.15); }
/* ---- the flashlights: a soft cone you can see and, for the two nearest, a real spotlight ---- */
function tgConeMesh(){ if(!TG.coneGeo){ const r=Math.tan(TG_HALF)*TG_LEN; const g=new THREE.ConeGeometry(r,TG_LEN,28,1,true); g.translate(0,-TG_LEN/2,0); g.rotateZ(Math.PI/2); TG.coneGeo=g;
    TG.coneMat=new THREE.ShaderMaterial({uniforms:{uL:{value:TG_LEN},uA:{value:0.24}},vertexShader:'uniform float uL; varying float vF; void main(){ vF=clamp(position.x/uL,0.0,1.0); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader:'uniform float uA; varying float vF; void main(){ float a=uA*(1.0-vF)*(1.0-vF)*smoothstep(0.0,0.05,vF); gl_FragColor=vec4(1.0,0.93,0.74,a); }',transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
    TG.bodyGeo=new THREE.CylinderGeometry(0.045,0.035,0.24,10); TG.bodyGeo.rotateZ(Math.PI/2); TG.bodyMat=new THREE.MeshLambertMaterial({color:Cc('#2b2f36')}); TG.lensMat=new THREE.MeshBasicMaterial({color:Cc('#fff6d8')}); }
  const g=new THREE.Group(), m=new THREE.Mesh(TG.coneGeo,TG.coneMat); m.frustumCulled=false; m.renderOrder=3; g.add(m); const bd=new THREE.Mesh(TG.bodyGeo,TG.bodyMat); bd.position.x=-0.1; g.add(bd);
  const ln=new THREE.Mesh(new THREE.CircleGeometry(0.045,12),TG.lensMat); ln.rotation.y=-Math.PI/2; ln.position.x=0.021; g.add(ln); g.rotation.order='YZX'; g.visible=false; scene.add(g); return g; }
function tgHand(x,y,z,yaw){ const c=Math.cos(yaw), s=Math.sin(yaw); return [x+c*0.42-s*0.2,y+1.32,z+s*0.42+c*0.2]; }
function tgPlaceCone(cone,x,y,z,yaw){ const h=tgHand(x,y,z,yaw); cone.position.set(h[0],h[1],h[2]); cone.rotation.set(0,-yaw,-0.08); cone.visible=true; return h; }
function tgLampsTick(){ if(!TG.lamps.length) return; const G=TG.g, on=TG.on&&G&&G.phase!=='lobby', L=[]; const cp=camera.position;
  if(on) for(const e of tgAll()){ if(tgRole(e.id)<1) continue; const h=tgHand(e.x,e.y,e.z,e.aim); L.push({h,aim:e.aim,d:e.me?-1:Math.hypot(h[0]-cp.x,h[2]-cp.z)}); }
  L.sort((a,b)=>a.d-b.d); TG.lamps.forEach((l,i)=>{ const q=L[i]; const vis=!!q&&q.d<90; if(l.visible!==vis) l.visible=vis; if(!vis) return; l.position.set(q.h[0],q.h[1],q.h[2]); l.target.position.set(q.h[0]+Math.cos(q.aim)*12,q.h[1]-1.0,q.h[2]+Math.sin(q.aim)*12); l.target.updateMatrixWorld(); }); }
/* ---- built the first time a game starts: the lamps, the ring of lanterns round the zone and the casa ---- */
function tgBuild(){ if(!TG.built){ TG.built=true; tgLoad(); TG.grp=new THREE.Group(); TG.grp.visible=false; scene.add(TG.grp);
    for(let i=0;i<2;i++){ const l=new THREE.SpotLight(Cc('#fff1d0'),1.7,TG_LEN+8,TG_HALF*0.95,0.45,1.2); l.castShadow=false; l.visible=false; scene.add(l); scene.add(l.target); TG.lamps.push(l); }
    TG.myCone=tgConeMesh(); }
  const z=TG.g&&TG.g.z; if(z&&(!TG.ringZ||TG.ringZ.x!==z.x||TG.ringZ.z!==z.z||TG.ringZ.r!==z.r)) tgRingBuild(z); }
function tgRingBuild(z){ if(TG.ring){ TG.grp.remove(TG.ring); TG.ring.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); } TG.ringZ={x:z.x,z:z.z,r:z.r}; const g=TG.ring=new THREE.Group(); TG.grp.add(g);
  const N=Math.round(z.r*2*Math.PI/7.5), pts=[]; for(let i=0;i<N;i++){ const a=i/N*Math.PI*2, x=z.x+Math.cos(a)*z.r, zz=z.z+Math.sin(a)*z.r; if(bldAt(x,zz,0.3)||W.terrain(x,zz)<W.waterLevel(x,zz)-0.3||W.poolAt(x,zz)) continue; pts.push([x,groundAt(x,zz,W.terrain(x,zz)+3),zz]); }
  const post=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05,0.06,1.15,6),new THREE.MeshLambertMaterial({color:Cc('#3a3128')}),Math.max(1,pts.length)), m=new THREE.Matrix4();
  pts.forEach((p,i)=>{ m.makeTranslation(p[0],p[1]+0.57,p[2]); post.setMatrixAt(i,m); }); post.count=pts.length; g.add(post);
  const tex=canvasTex(64,64,(c,w,h)=>{ const gr=c.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,240,200,1)'); gr.addColorStop(0.25,'rgba(255,190,90,0.85)'); gr.addColorStop(1,'rgba(255,150,40,0)'); c.fillStyle=gr; c.fillRect(0,0,w,h); });
  const gp=new Float32Array(pts.length*3); pts.forEach((p,i)=>{ gp[i*3]=p[0]; gp[i*3+1]=p[1]+1.25; gp[i*3+2]=p[2]; }); const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(gp,3));
  const glow=new THREE.Points(geo,new THREE.PointsMaterial({size:1.6,map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,color:Cc('#ffffff'),fog:false})); glow.frustumCulled=false; g.add(glow);
  // the casa: a lamp post with a sign
  const by=groundAt(z.x,z.z+2.4,W.terrain(z.x,z.z+2.4)+3), bp=new THREE.Mesh(new THREE.CylinderGeometry(0.07,0.09,2.7,8),new THREE.MeshLambertMaterial({color:Cc('#2c2a27')})); bp.position.set(z.x,by+1.35,z.z+2.4); g.add(bp);
  const bg=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.BufferAttribute(new Float32Array([z.x,by+2.8,z.z+2.4]),3)),new THREE.PointsMaterial({size:1.9,map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false})); bg.frustumCulled=false; g.add(bg);
  const st=canvasTex(256,96,(c,w,h)=>{ c.fillStyle='#fdf6e3'; c.fillRect(0,0,w,h); c.strokeStyle='#8a5a2b'; c.lineWidth=10; c.strokeRect(5,5,w-10,h-10); c.fillStyle='#5b3a1e'; c.font='900 58px system-ui, sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText('CASA',w/2,h/2+3); });
  const sg=new THREE.Sprite(new THREE.SpriteMaterial({map:st,color:Cc('#ffffff')})); sg.scale.set(1.1,0.41,1); sg.position.set(z.x,by+2.15,z.z+2.4); g.add(sg); }
/* ---- every frame ---- */
function tgTick(dt,T){ if(!WP.pilla) return; const G=TG.g;
  if(TG.grp) TG.grp.visible=TG.on&&!!G&&!S.interior; tgLampsTick();
  if(!TG.on||!G){ if(TG.myCone&&TG.myCone.visible) TG.myCone.visible=false; tgHud(); return; }
  if(G.phase==='lobby'){ tgLobbyTick(); TG.hudT-=dt; if(TG.hudT<=0){ TG.hudT=0.25; tgHud(); } return; }
  const now=tgNow(), me=tgMe();
  if(G.place&&now>=G.t0-900&&tgCanGo()) tgPlaceMe();
  if(G.phase==='hide'&&now>=G.hideEnd){ G.phase='play'; blip('gold'); toast(G.md==='esc'?'¡A buscar!':'¡A pillar!',tgRole(me)>=1?'Sal de la casa y busca con la linterna':(G.md==='esc'?'Quédate quieto y agachado, o cambia de sitio sin que te vea la linterna':'¡Que no te pille!')); }
  const myRole=tgRole(me);
  if(G.phase==='hide'||G.phase==='play'){
    // whoever is frozen (counting at the casa, or the new one who la liga) stays put
    if((G.frozen[me]||0)>now&&S.mode==='walk'){ if(TG.frzX===undefined){ TG.frzX=P.x; TG.frzZ=P.z; } P.x=TG.frzX; P.z=TG.frzZ; P.vx=P.vz=0; } else TG.frzX=undefined;
    if(G.phase==='hide'&&G.md==='esc'){ const s=Math.ceil((G.hideEnd-now)/1000); if(s!==TG.beepS){ TG.beepS=s; if(s<=5&&s>0) blip('door'); } }
    if(G.phase==='play'){ for(const id of [me,...TG.bots.map(b=>b.id)]) if(tgRole(id)===0) G.free[id]=(G.free[id]||0)+dt; }
    for(const b of TG.bots) tgBotTick(b,dt,T);
    if(G.phase==='play'&&myRole>=1&&!((G.frozen[me]||0)>now)&&S.mode==='walk') for(const e of tgAll()){ if(e.me||tgRole(e.id)!==0) continue; if(Math.hypot(e.x-P.x,e.z-P.z)<TG_TOUCH&&Math.abs(e.y-P.y)<1.6) tgCatch(me,e.id); }
    tgNetRepair(dt); tgZoneTick(dt); tgMeTick(dt);
    if(!G.bots&&G.phase==='play'&&tgAll().length<2){ G.soloT=(G.soloT||0)+dt; if(G.soloT>3){ toast('Te has quedado solo','Los demás han dejado la partida'); tgFinish(); } } else G.soloT=0;
    if(G.phase!=='end'&&now>=G.end) tgFinish();
    else if(G.phase==='play'&&G.md==='esc'&&now>G.hideEnd+3000){ if(tgHiders()===0){ G.allT+=dt; if(G.allT>1.2) tgFinish(); } else G.allT=0; } }
  else if(G.phase==='end'){ for(const b of TG.bots) tgBotTick(b,dt,T); if(G.resT&&now>=G.resT&&!G.awarded) tgResults(); if(now-G.endT>120000) tgQuit(true); }
  // my flashlight
  if(TG.myCone){ if(myRole>=1&&G.phase!=='end'&&S.mode==='walk'&&rig&&rig.root.visible){ tgPlaceCone(TG.myCone,P.x,P.y,P.z,camS.yaw); tgArmPose(rig); } else TG.myCone.visible=false; }
  for(const b of TG.bots){ const it=tgRole(b.id)>=1&&G.phase!=='end'; if(it){ if(!b.cone) b.cone=tgConeMesh(); tgPlaceCone(b.cone,b.x,b.y,b.z,b.aim); } else if(b.cone) b.cone.visible=false; }
  tgTags(); TG.hudT-=dt; if(TG.hudT<=0){ TG.hudT=0.2; tgHud(); } tgRadarTick(dt); }
// you: crouching when still, being seen, the radar ping
function tgMeTick(dt){ const G=TG.g, me=tgMe(), role=tgRole(me), now=tgNow();
  const still=S.mode==='walk'&&P.onGround&&!P.swim&&Math.hypot(P.vx,P.vz)<0.3&&!inp.mx&&!inp.my&&role===0; TG.still=still?TG.still+dt:0; const c=TG.still>0.8; if(c!==TG.crouch) TG.crouch=c;
  if(TG.crouch&&rig) tgCrouchPose(rig);
  let seen=false; if(role===0&&G.phase==='play') for(const e of tgAll()){ if(e.me||tgRole(e.id)<1) continue; if(tgSees(e.x,e.z,e.aim,P.x,P.z,TG.crouch)){ seen=true; break; } }
  if(seen&&!TG.seen){ TG.seenT=1.2; blip('door'); } TG.seen=seen; TG.seenT=Math.max(0,TG.seenT-dt); if(role!==0) TG.seenT=0; const sv=$('tgSeen'); if(sv){ const on=role===0&&(seen||TG.seenT>0); if(sv.hidden===on) sv.hidden=!on; }
  const ey=$('tgEyes'); if(ey){ const on=G.phase==='hide'&&G.md==='esc'&&role>=1; if(ey.hidden===on) ey.hidden=!on; if(on) $('tgEyesN').textContent=Math.max(1,Math.ceil((G.hideEnd-now)/1000)); }
  if(G.phase==='play'&&G.end-now<=TG_RADAR*1000&&role>=1){ TG.pingT-=dt; if(TG.pingT<=0){ TG.pingT=2; blip('jump'); } } }
// out of the zone: five seconds to come back, then you are put back in
function tgZoneTick(dt){ const z=TG.g.z, d=Math.hypot(P.x-z.x,P.z-z.z); if(S.mode!=='walk'||d<=z.r+2||TG.g.place||tgNow()-(TG.placedT||0)<2500){ TG.outT=0; return; } TG.outT+=dt;
  if(TG.outT>5){ TG.outT=0; const a=Math.atan2(P.z-z.z,P.x-z.x), f=tgFreeNear(z.x+Math.cos(a)*(z.r-6),z.z+Math.sin(a)*(z.r-6),12,0.6)||[z.x,z.z];
    fadeTo(()=>{ P.x=f[0]; P.z=f[1]; P.y=groundAt(f[0],f[1],W.terrain(f[0],f[1])+2); P.vx=P.vy=P.vz=0; P.swim=false; S.snap=true; setMode('walk'); }); toast('Has vuelto a la zona','No se puede jugar fuera del círculo de farolillos'); } }
// in the sala: resend a catch until the friend says so, and if nobody la liga in the pilla-pilla, the first one by id takes it
function tgNetRepair(dt){ const G=TG.g; if(G.bots) return; const now=tgNow();
  for(let i=G.pend.length-1;i>=0;i--){ const q=G.pend[i], s=tgPeerState(tgPeerOf(q.who)); const ok=s&&((G.md==='pilla'&&(s.tg[1]&3)===1)||(G.md==='esc'&&(s.tg[1]&3)>=1));
    if(ok||q.n>=6||!s&&now-q.t>4000){ G.pend.splice(i,1); continue; } if(now-q.t>1000*(q.n+1)){ q.n++; mpSend({t:'tgc',g:G.id,by:tgMe(),who:q.who}); } }
  if(G.md==='pilla'&&G.phase==='play'){ const L=tgAll(), its=L.filter(e=>tgRole(e.id)===1); if(its.length) G.noIt=0; else { G.noIt+=dt; if(G.noIt>2.5){ G.noIt=0; const c=L.map(e=>e.id).sort()[0];
        if(c===tgMe()){ G.role[c]=1; G.roleT[c]=now; G.frozen[c]=now+3000; G.lastIt=c; toast('Nadie la ligaba','Ahora la ligas tú: cuenta 3 y a pillar'); } else { G.role[c]=1; G.roleT[c]=now; } } } } }
/* ---- the end of the round ---- */
function tgFinish(){ const G=TG.g; if(!G||G.phase==='end') return; G.phase='end'; G.endT=tgNow(); G.resT=G.endT+1500;
  for(const id of [tgMe(),...TG.bots.map(b=>b.id)]) if(tgRole(id)===0) G.bonus[id]=5; TG.crouch=false; blip('gold'); toast('¡Se acabó la ronda!','Contando los puntos…'); tgUI(); }
function tgResults(){ const G=TG.g; G.awarded=true; const L=tgRows(), me=L.find(r=>r.me), n=L.length; if(!me) return;
  const win=n>1&&L[0].me&&(L.length<2||L[0].pts>L[1].pts), stayed=me.role===0, st=TG.st; st.r++; if(win) st.w++; if(me.pts>st.best) st.best=me.pts; st.h+=Math.round(G.free[tgMe()]||0); if(G.md==='esc'&&stayed) st.sv++; tgSave();
  for(const r of L){ const k=r.me?'Tú':r.n; const o=TG.night[k]||(TG.night[k]={n:k,pts:0,r:0,w:0,me:r.me}); o.pts+=r.pts; o.r++; if(r===L[0]) o.w++; }
  prgEarn(clamp(Math.round(me.pts/3),1,15),TG_MD[G.md].n+' de noche'); if(G.md==='esc'&&stayed&&n>=3) prgTrophy('escondido'); if(G.md==='pilla'&&win&&n>=3) prgTrophy('pillapilla');
  toast(win?'¡Has ganado la ronda!':'Fin de la ronda',L.slice(0,3).map((r,i)=>(i+1)+'.º '+r.n+' ('+r.pts+')').join(' · ')); tgSheet('clasif'); }
// leave the game; quiet = no message (starting another one)
function tgQuit(quiet){ const G=TG.g; if(G&&!G.bots&&MP.code&&G.phase!=='end') mpSend({t:'tgx',g:G.id}); tgEndAll(quiet); if(!quiet) toast('Pilla-pilla','Has dejado la partida'); tgUI(); }
function tgEndAll(quiet){ tgBotRemove(); TG.on=false; TG.g=null; TG.crouch=false; TG.seen=false; TG.outT=0; if(TG.myCone) TG.myCone.visible=false; if(TG.grp) TG.grp.visible=false;
  if(TG.prevTOD){ if(TOD.mode==='pilla') setTOD(TG.prevTOD!=='pilla'?TG.prevTOD:'real'); TG.prevTOD=null; }
  for(const p of MP.peers.values()) if(p.tgCone) p.tgCone.visible=false; for(const id of ['tgSeen','tgEyes','tgRadar']){ const e=$(id); if(e) e.hidden=true; } tgHud(); }
/* ---- action button ---- */
function tgAct(){ const G=TG.g; if(!tgPlaying()) return null; const me=tgMe(); if(tgRole(me)<1||G.phase!=='play'||(G.frozen[me]||0)>tgNow()) return null; let best=null, bd=TG_ACT;
  for(const e of tgAll()){ if(e.me||tgRole(e.id)!==0||(G.md==='pilla'&&(G.immune[e.id]||0)>tgNow())) continue; const d=Math.hypot(e.x-P.x,e.z-P.z); if(d<bd&&Math.abs(e.y-P.y)<1.6&&(d<TG_TOUCH*1.5||tgSees(P.x,P.z,camS.yaw,e.x,e.z,e.crouch))){ bd=d; best=e; } }
  return best?{k:'tgCatch',ref:best.id,label:'¡Pillar a '+best.n+'!'}:null; }
function tgDo(k,ref){ if(k==='tgCatch'){ const e=tgAll().find(q=>q.id===ref); if(e&&Math.hypot(e.x-P.x,e.z-P.z)<TG_ACT+0.6) tgCatch(tgMe(),ref); } }
/* ---- the sala ---- */
function tgNetState(o){ const G=TG.g; if(!TG.on||!G||G.bots||G.phase==='lobby') return; const me=tgMe(); o.tg=[G.id,tgRole(me)|(TG.crouch?4:0),tgScore(me),G.catches[me]|0,Math.round(camS.yaw*100)]; }
function tgNetIn(p,o){ if(!WP.pilla) return; const G=TG.g; const off=Number.isFinite(o.ts)&&Math.abs(Date.now()-o.ts)<3600000?Date.now()-o.ts:0; // their clock to ours (each device has its own)
  if(o.t==='tgo'&&typeof o.md==='string'&&Number.isFinite(o.id)&&Array.isArray(o.z)&&o.z.length===3&&o.z.every(Number.isFinite)&&Number.isFinite(o.go)&&Number.isFinite(o.dur)){ const md=TG_MD[o.md==='pilla'?'pilla':'esc'];
    if(tgPlaying()) return; mpPrompt('<b>'+esc(p.n)+'</b> te invita a jugar al <b>'+md.n.toLowerCase()+' de noche</b> en las '+esc(String(o.zn||'villas').replace(/^Villas /,'villas '))+' ('+Math.round(o.dur/60)+' min). ¿Juegas?','Jugar',()=>{ if(!tgCanGo()){ toast('Pilla-pilla','Termina antes lo que estás haciendo'); return; } tgAccept(Object.assign({},o,{go:o.go+off}),p.id); },Math.max(2000,o.go+off-tgNow())); }
  else if(o.t==='tgj'&&G&&G.phase==='lobby'&&G.host===MP.id&&o.g===G.id){ if(!G.joined.includes(p.id)){ G.joined.push(p.id); toast(esc(p.n||'Un amigo')+' se apunta','Empieza en '+Math.max(1,Math.ceil((G.go-tgNow())/1000))+' s'); tgUI(); } }
  else if(o.t==='tgs'&&G&&o.g===G.id&&G.phase==='lobby'&&Array.isArray(o.ids)&&Number.isFinite(o.t0)&&o.ids.includes(MP.id)) tgBegin(o.ids.filter(x=>typeof x==='string').slice(0,12),String(o.it),o.t0+off);
  else if(o.t==='tgc'&&G&&o.g===G.id&&(G.phase==='play'||G.phase==='hide')&&typeof o.who==='string'&&typeof o.by==='string'){ if(o.who===MP.id&&tgRole(MP.id)!==0) return;
    if(G.phase==='hide'){ G.phase='play'; G.hideEnd=Math.min(G.hideEnd,tgNow()); } tgCatch(o.by,o.who,true); }
  else if(o.t==='tgx'&&G&&o.g===G.id){ G.ids=G.ids.filter(x=>x!==p.id); G.joined=G.joined.filter(x=>x!==p.id); toast(esc(p.n||'Un amigo')+' deja la partida',''); } }
// a friend's flashlight and crouch
function tgPeer(p,s,R,inWorld,showRig){ p.tgS={x:s.x,y:s.y,z:s.z}; const on=inWorld&&showRig&&s.tg&&(s.tg[1]&3)>=1&&s.m==='walk';
  if(!on){ if(p.tgCone) p.tgCone.visible=false; } else { if(!p.tgCone) p.tgCone=tgConeMesh(); tgPlaceCone(p.tgCone,s.x,s.y,s.z,s.tg[4]/100); tgArmPose(R); }
  if(inWorld&&showRig&&s.tg&&(s.tg[1]&4)) tgCrouchPose(R); }
// who you can see on the map and with a name: whoever la liga sees the hidden only in the light, close by or on the radar
function tgCanSee(e){ const G=TG.g; if(!tgPlaying()||!e) return true; const me=tgMe(); if(tgRole(me)===0) return tgRole(e.id)===0||Math.hypot(e.x-P.x,e.z-P.z)<40;
  if(tgRole(e.id)>=1) return true; if(G.phase==='hide') return false; if(G.phase==='play'&&G.end-tgNow()<=TG_RADAR*1000) return true; const d=Math.hypot(e.x-P.x,e.z-P.z); return d<5||tgSees(P.x,P.z,camS.yaw,e.x,e.z,e.crouch); }
function tgTagHide(p,s){ if(!tgPlaying()||!s||!s.tg||s.tg[0]!==TG.g.id) return false; return !tgCanSee({id:p.id,x:s.x,y:s.y,z:s.z,crouch:!!(s.tg[1]&4)}); }
function tgMapHide(p,o){ if(!tgPlaying()||!o||!o.tg||o.tg[0]!==TG.g.id) return false; const me=tgMe(), role=tgRole(p.id);
  if(tgRole(me)===0) return false; if(role>=1) return false; return !(TG.g.phase==='play'&&TG.g.end-tgNow()<=TG_RADAR*1000); }
function tgTags(){ const G=TG.g, cp=camera.position; for(const b of TG.bots){ const e={id:b.id,x:b.x,y:b.y,z:b.z,crouch:b.crouch}, vis=tgCanSee(e)&&S.mode!=='menu';
    const cd=Math.hypot(b.x-cp.x,b.y-cp.y,b.z-cp.z); const q=vis&&cd<160?project(b.x,b.y+(b.crouch?1.6:2.3),b.z):null;
    if(!q||!q[2]){ if(!b.tag.hidden) b.tag.hidden=true; continue; } b.tag.hidden=false; b.tag.style.transform='translate('+q[0].toFixed(1)+'px,'+q[1].toFixed(1)+'px) translate(-50%,-100%)';
    const it=tgRole(b.id)>=1&&G.phase!=='end', txt='<i style="background:'+b.sk.shirt+'"></i>'+(it?'🔦 ':'')+esc(b.n)+(cd>25?' <small>'+fmt(cd)+' m</small>':''); if(txt!==b.tagTxt){ b.tag.innerHTML=txt; b.tagTxt=txt; } } }
/* ---- screen: the marker, the radar, the eyes and the warning ---- */
function tgFmtT(ms){ const s=Math.max(0,Math.ceil(ms/1000)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
function tgHud(){ const e=$('tgHud'); if(!e) return; const G=TG.g; if(!TG.on||!G||['menu','loading'].includes(S.mode)){ if(!e.hidden) e.hidden=true; return; }
  const md=TG_MD[G.md], now=tgNow(), me=tgMe(), role=tgRole(me); let h='<b>'+md.ic+' '+md.n+' · '+esc(G.z.name)+'</b>';
  if(G.phase==='lobby'){ const n=G.host===MP.id?G.joined.length:0; h+='<div class="big">Empieza en '+Math.max(0,Math.ceil((G.go-now)/1000))+' s</div><div>'+(G.host===MP.id?'Apuntados: '+n+(n<2?' · si nadie se apunta, con la máquina':''):'Esperando a que empiece')+'</div>'; }
  else if(G.phase==='end') h+='<div class="big">Fin de la ronda</div><div>Toca para ver la clasificación y jugar otra</div>';
  else { const hide=G.phase==='hide'; h+='<div class="big">'+(hide?(G.md==='esc'?'Escondeos':'Corred')+' · '+Math.max(0,Math.ceil((G.hideEnd-now)/1000))+' s':(G.md==='esc'?'Buscando':'Pillando')+' · '+tgFmtT(G.end-now))+'</div>';
    const fr=(G.frozen[me]||0)>now; h+='<div class="role '+(role>=1?'it':'hid')+'">'+(role>=1?(fr?'🔦 La ligas tú: '+(hide?'cuenta en la casa':'cuenta '+Math.ceil(((G.frozen[me]||0)-now)/1000)):(role===2?'🔦 Te han pillado: busca con tu linterna':'🔦 La ligas tú: '+(G.md==='esc'?'busca con la linterna':'¡pilla a alguien!'))):(TG.seen?'👀 ¡Te ve la linterna! Corre o escóndete':(G.md==='esc'?'🙈 Escondido'+(TG.crouch?' y agachado':' · quieto, te agachas'):'🏃 Libre: que no te pille')))+'</div>';
    const rad=G.phase==='play'&&G.end-now<=TG_RADAR*1000; h+='<div>'+(G.md==='esc'?'Quedan '+tgHiders()+' escondidos · ':'La liga: '+esc(tgAll().filter(x=>tgRole(x.id)===1).map(x=>x.n).join(', ')||'nadie')+' · ')+(rad?'<span class="rad">📡 ¡Radar!</span>':'radar en '+tgFmtT(Math.max(0,G.end-now-TG_RADAR*1000)))+'</div>';
    if(TG.outT>0) h+='<div class="out">¡Fuera de la zona! Vuelve: '+Math.max(1,Math.ceil(5-TG.outT))+'</div>'; }
  if(G.phase!=='lobby'){ const L=tgRows(); h+='<div class="rows">'+L.slice(0,5).map((r,i)=>'<span'+(r.me?' class="me"':'')+'>'+(i+1)+'.º '+(r.role>=1&&G.phase!=='end'?'🔦':'')+esc(r.n)+' <em>'+r.pts+'</em></span>').join('')+'</div>'; }
  if(e.innerHTML!==h) e.innerHTML=h; if(e.hidden) e.hidden=false; }
function tgRadarTick(dt){ const c=$('tgRadar'); if(!c) return; const G=TG.g, me=tgMe(), on=tgPlaying()&&G.phase==='play'&&G.end-tgNow()<=TG_RADAR*1000&&tgRole(me)>=1&&S.mode==='walk';
  if(c.hidden===on) c.hidden=!on; if(!on) return; TG.radT=(TG.radT+dt)%2; const g=c.getContext('2d'), W_=c.width, H_=c.height, cx=W_/2, cy=H_/2, R=W_/2-4, sc=R/80, yaw=camS.yaw, f=[Math.cos(yaw),Math.sin(yaw)], rt=[-Math.sin(yaw),Math.cos(yaw)];
  g.clearRect(0,0,W_,H_); g.fillStyle='rgba(10,30,22,.86)'; g.beginPath(); g.arc(cx,cy,R,0,7); g.fill(); g.strokeStyle='rgba(120,255,170,.45)'; g.lineWidth=1.5; for(const r of [R,R*0.5]){ g.beginPath(); g.arc(cx,cy,r,0,7); g.stroke(); }
  const sw=TG.radT/2*Math.PI*2; const gr=g.createConicGradient?g.createConicGradient(sw-0.9,cx,cy):null; if(gr){ gr.addColorStop(0,'rgba(120,255,170,0)'); gr.addColorStop(0.14,'rgba(120,255,170,.35)'); gr.addColorStop(0.15,'rgba(120,255,170,0)'); g.fillStyle=gr; g.beginPath(); g.arc(cx,cy,R,0,7); g.fill(); }
  for(const e of tgAll()){ if(e.me||tgRole(e.id)!==0) continue; const dx=e.x-P.x, dz=e.z-P.z; let x=(dx*rt[0]+dz*rt[1])*sc, y=-(dx*f[0]+dz*f[1])*sc; const l=Math.hypot(x,y); if(l>R-5){ x*=(R-5)/l; y*=(R-5)/l; }
    g.fillStyle='#ff4d4d'; g.strokeStyle='#fff'; g.lineWidth=1.5; g.beginPath(); g.arc(cx+x,cy+y,5+Math.sin(TG.radT*Math.PI*2)*1.2,0,7); g.fill(); g.stroke(); }
  g.fillStyle='#fff'; g.beginPath(); g.moveTo(cx,cy-7); g.lineTo(cx+5,cy+5); g.lineTo(cx-5,cy+5); g.closePath(); g.fill(); g.fillStyle='rgba(255,255,255,.85)'; g.font='800 10px system-ui, sans-serif'; g.textAlign='center'; g.fillText('80 m',cx,cy-R*0.5-3); }
function tgUI(){ const b=$('mTagB'); if(b) b.textContent=TG.on?'🔦 Pilla-pilla':'Pilla-pilla'; if(!$('tgSheet').hidden) tgSheet(TG.tab); tgHud(); }
/* ---- the sheet ---- */
function tgSheet(tab){ if(!WP.pilla) return; closeModal(); tgZones(); if(!TG.st) tgLoad(); TG.tab=tab||TG.tab||'jugar'; const T=TG.tab, B=$('tgBody'), G=TG.g, inSala=MP.code&&MP.peers.size;
  let h='<h2>🔦 Pilla-pilla y escondite de noche</h2><div class="tabs">'+[['jugar','Jugar'],['clasif','Clasificación'],['ayuda','Cómo se juega']].map(t=>'<button data-tgt="'+t[0]+'" class="'+(T===t[0]?'on':'')+'">'+t[1]+'</button>').join('')+'</div>';
  if(T==='jugar'){ h+='<p>De noche y con linterna: uno <b>la liga</b> y los demás se esconden o corren por las villas y jardines de una zona marcada con farolillos. Se juega con los amigos de la sala o, sin amigos, con jugadores de la máquina.</p>';
    if(G&&TG.on){ const md=TG_MD[G.md]; h+='<p class="note"><b>Partida en marcha:</b> '+md.n+' en las '+esc(G.z.name.replace(/^Villas /,'villas '))+(G.phase==='lobby'?' (esperando a los que se apuntan)':G.phase==='end'?' (terminada)':'')+'.</p><div class="row">'+(G.phase==='end'?'<button class="btn small primary" id="tgAgain">Otra ronda</button>':'')+(G.phase==='lobby'&&G.host===MP.id?'<button class="btn small primary" id="tgNow">Empezar ya</button>':'')+'<button class="btn small" id="tgQuit">'+(G.phase==='end'?'Terminar y volver a tu hora':'Dejar la partida')+'</button></div>'; }
    h+='<h3>Juego</h3><div class="row">'+['esc','pilla'].map(k=>'<button class="btn small'+(TG.md===k?' primary':'')+'" data-tgm="'+k+'">'+TG_MD[k].ic+' '+TG_MD[k].n+'</button>').join('')+'</div>';
    h+='<p class="note">'+(TG.md==='esc'?'<b>Escondite:</b> quien la liga cuenta 20 s en la casa con los ojos tapados mientras los demás se esconden. Luego busca con la linterna; a quien pilla, busca con él. Acaba cuando no queda nadie escondido o se acaba el tiempo.':'<b>Pilla-pilla:</b> quien la liga sale a los 6 s a pillar. Si pilla a alguien, se cambian: ahora la liga el pillado (cuenta 3 s) y no puede devolverla al que le pilló hasta 4,5 s después. Acaba con el tiempo.')+'</p>';
    h+='<h3>Zona</h3><div class="row" style="flex-wrap:wrap;gap:6px">'+TG.zones.map((z,i)=>'<button class="btn small'+(i===TG.zi?' primary':'')+'" data-tgz="'+i+'">'+(i===TG.zi?'✓ ':'')+esc(z.name)+' · '+z.villas+' villas · a '+fmt(Math.hypot(z.x-P.x,z.z-P.z))+' m</button>').join('')+'</div>';
    h+='<p class="note">El círculo de la zona mide '+tgZoneR(TG.md)+' m de radio en el '+TG_MD[TG.md].n.toLowerCase()+'. En el mapa sale con una raya naranja y la casa con un punto blanco.</p>';
    h+='<h3>Opciones</h3><div class="row"><span class="lbl">Duración</span>'+[2,3,5].map(m=>'<button class="btn small'+(TG.dur===m*60?' primary':'')+'" data-tgd="'+m*60+'">'+m+' min</button>').join('')+'</div>';
    h+='<div class="row"><span class="lbl">La liga primero</span><button class="btn small'+(TG.first==='azar'?' primary':'')+'" data-tgf="azar">Al azar</button><button class="btn small'+(TG.first==='yo'?' primary':'')+'" data-tgf="yo">Yo</button></div>';
    if(!inSala) h+='<div class="row"><span class="lbl">Jugadores de la máquina</span>'+[2,3,4,5].map(n=>'<button class="btn small'+(TG.nb===n?' primary':'')+'" data-tgn="'+n+'">'+n+'</button>').join('')+'</div>';
    h+='<div class="row" style="margin-top:8px"><button class="btn primary" id="tgGo">'+(inSala?'Invitar a la sala':'Empezar')+'</button></div><p class="note">'+(inSala?'Los amigos de la sala tienen 12 s para apuntarse. Si no se apunta nadie, juegas con la máquina.':'Sin amigos en la sala juegas con '+TG.nb+' jugadores de la máquina (la familia de los avatares y otros). Para jugar con amigos, entra en una sala con el botón Con amigos del inicio.')+' Se hace de noche mientras jugáis; al terminar vuelve tu hora.</p>'; }
  else if(T==='clasif'){ const L=tgRows(); if(G&&L.length){ h+='<h3>'+(G.phase==='end'?'Resultado de la ronda':'Ronda en marcha')+'</h3><div class="tablewrap"><table class="card"><thead><tr><th>#</th><th>Jugador</th><th>Papel</th><th>Pilladas</th><th>Puntos</th></tr></thead><tbody>'+L.map((r,i)=>'<tr'+(r.me?' class="me"':'')+'><td>'+(i+1)+'.º</td><td>'+esc(r.n)+(r.bot?' <small>(máquina)</small>':'')+'</td><td>'+(r.role===1?'🔦 la liga':r.role===2?'🔦 pillado, busca':(G.phase==='end'?'🙈 sin pillar':'🙈 libre'))+'</td><td class="num">'+r.c+'</td><td class="num"><b>'+r.pts+'</b></td></tr>').join('')+'</tbody></table></div>';
      if(G.phase==='end') h+='<div class="row"><button class="btn small primary" id="tgAgain">Otra ronda</button><button class="btn small" id="tgQuit">Terminar y volver a tu hora</button></div>'; }
    else h+='<p>Aún no hay ninguna ronda. Empieza una en la pestaña Jugar.</p>';
    const N=Object.values(TG.night).sort((a,b)=>b.pts-a.pts); if(N.length) h+='<h3>Esta noche</h3><div class="tablewrap"><table class="card"><thead><tr><th>Jugador</th><th>Rondas</th><th>Ganadas</th><th>Puntos</th></tr></thead><tbody>'+N.map(o=>'<tr'+(o.me?' class="me"':'')+'><td>'+esc(o.n)+'</td><td class="num">'+o.r+'</td><td class="num">'+o.w+'</td><td class="num"><b>'+o.pts+'</b></td></tr>').join('')+'</tbody></table></div>';
    const st=TG.st; h+='<h3>Tus números</h3><div class="tablewrap"><table class="card"><tbody><tr><td>Rondas jugadas / ganadas</td><td class="num">'+st.r+' / '+st.w+'</td></tr><tr><td>Mejor ronda</td><td class="num">'+st.best+' puntos</td></tr><tr><td>Pilladas en total</td><td class="num">'+st.c+'</td></tr><tr><td>Tiempo libre o escondido</td><td class="num">'+tgFmtT(st.h*1000)+'</td></tr><tr><td>Escondites sin que te pillen</td><td class="num">'+st.sv+'</td></tr></tbody></table></div>'; }
  else h+='<h3>Cómo se juega</h3><ul>'+tgGuideLis()+'</ul><h3>Cómo se lee</h3><ul>'+tgReadLis()+'</ul><h3>Glosario</h3><dl class="gloss">'+tgGlossHTML()+'</dl>';
  h+='<div class="row" style="margin-top:10px"><button class="btn small" id="tgClose">Cerrar</button></div>'; B.innerHTML=h; $('tgSheet').hidden=false;
  B.querySelectorAll('[data-tgt]').forEach(b=>b.onclick=()=>tgSheet(b.dataset.tgt)); $('tgClose').onclick=()=>{ $('tgSheet').hidden=true; };
  B.querySelectorAll('[data-tgm]').forEach(b=>b.onclick=()=>{ TG.md=b.dataset.tgm; tgSheet('jugar'); }); B.querySelectorAll('[data-tgz]').forEach(b=>b.onclick=()=>{ TG.zi=+b.dataset.tgz; tgSheet('jugar'); });
  B.querySelectorAll('[data-tgd]').forEach(b=>b.onclick=()=>{ TG.dur=+b.dataset.tgd; tgSheet('jugar'); }); B.querySelectorAll('[data-tgf]').forEach(b=>b.onclick=()=>{ TG.first=b.dataset.tgf; tgSheet('jugar'); });
  B.querySelectorAll('[data-tgn]').forEach(b=>b.onclick=()=>{ TG.nb=+b.dataset.tgn; tgSheet('jugar'); });
  const go=$('tgGo'); if(go) go.onclick=()=>{ saveName(); tgStart(); }; const q=$('tgQuit'); if(q) q.onclick=()=>{ tgQuit(false); $('tgSheet').hidden=true; };
  const nw=$('tgNow'); if(nw) nw.onclick=()=>{ if(TG.g) TG.g.go=tgNow(); };
  const ag=$('tgAgain'); if(ag) ag.onclick=()=>tgAgain(); }
// another round in the same zone: in the escondite la liga the first one caught; in the pilla-pilla whoever la liga at the end
function tgAgain(){ const G=TG.g; if(!G) { tgStart(); return; } const Z=G.z, nx=G.md==='esc'?(G.firstCaught||null):(tgAll().find(e=>tgRole(e.id)===1)||{}).id; TG.md=G.md; TG.dur=G.dur;
  const zi=TG.zones.findIndex(z=>Math.abs(z.x-Z.x)<1&&Math.abs(z.z-Z.z)<1); if(zi>=0) TG.zi=zi;
  if(G.bots){ const keep=TG.bots.length; TG.nb=keep||TG.nb; tgBotGame(TG.zones[TG.zi]||Z,nx); }
  else if(MP.code&&MP.peers.size){ const f0=TG.first; if(nx===MP.id) TG.first='yo'; tgInvite(TG.zones[TG.zi]||Z); TG.first=f0; } else tgBotGame(TG.zones[TG.zi]||Z); }
/* ---- map, legend, guide and glossary ---- */
function tgDrawMap(g,m2c,s,big){ const G=TG.g; if(!TG.on||!G) return; const z=G.z, [x,y]=m2c(z.x,z.z), [x2]=m2c(z.x+z.r,z.z), r=Math.abs(x2-x); g.save();
  g.fillStyle='rgba(255,159,28,.18)'; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); g.setLineDash([6*s,4*s]); g.lineWidth=(big?2.6:3.2)*s; g.strokeStyle='#ff9f1c'; g.stroke(); g.setLineDash([]);
  g.fillStyle='#ffffff'; g.strokeStyle='#5b3a1e'; g.lineWidth=1.6*s; g.beginPath(); g.arc(x,y,(big?4:5)*s,0,7); g.fill(); g.stroke();
  if(G.phase!=='lobby') for(const b of TG.bots){ const e={id:b.id,x:b.x,y:b.y,z:b.z,crouch:b.crouch}; if(!tgCanSee(e)&&!(tgRole(tgMe())>=1&&G.phase==='play'&&G.end-tgNow()<=TG_RADAR*1000)) continue; const [bx,by]=m2c(b.x,b.z), it=tgRole(b.id)>=1&&G.phase!=='end', rr=(big?4.5:7)*s;
    g.fillStyle=it?'#ffd23f':b.sk.shirt; g.strokeStyle=it?'#3a2a00':'#fff'; g.lineWidth=(big?1.4:2.5)*s; g.beginPath(); g.arc(bx,by,rr,0,7); g.fill(); g.stroke(); if(big){ g.font='800 '+(7.5*s)+'px system-ui, sans-serif'; g.textAlign='left'; g.textBaseline='middle'; g.lineWidth=3*s; g.strokeStyle='rgba(255,255,255,.9)'; g.strokeText((it?'🔦 ':'')+b.n,bx+rr+3*s,by); g.fillStyle='#16231b'; g.fillText((it?'🔦 ':'')+b.n,bx+rr+3*s,by); } }
  g.restore(); }
function tgLegend(){ if(!TG.on||!TG.g) return ''; return '<div><i style="background:rgba(255,159,28,.15);border:2px dashed #ff9f1c;border-radius:50%"></i>Zona del '+TG_MD[TG.g.md].n.toLowerCase()+': no salgas del círculo de farolillos</div><div><i style="background:#fff;border:2px solid #5b3a1e;border-radius:50%"></i>Casa: donde cuenta quien la liga</div><div><i style="background:#ffd23f;border:2px solid #3a2a00;border-radius:50%"></i>Quien la liga (con linterna)</div>'; }
function tgGuideLis(){ return '<li><b>Escondite</b>: quien la liga cuenta 20 s en la <b>casa</b> (la pantalla se oscurece) mientras los demás se esconden por las villas y jardines de la zona. Luego busca con la <b>linterna</b>; a quien toca, lo pilla y ese busca con él. Acaba cuando no queda nadie escondido o se acaba el tiempo.</li>'+
  '<li><b>Pilla-pilla</b>: quien la liga sale a los 6 s. Al tocar a alguien se cambian: el pillado la liga, cuenta 3 s y no puede devolverla al que le pilló durante 4,5 s («sin devolución»).</li>'+
  '<li><b>Pillar</b>: basta con tocar (a menos de 1,6 m); a menos de 3 m, si lo ves, también sirve el botón <b>¡Pillar a…!</b> (□ / X en el mando).</li>'+
  '<li><b>La linterna</b> ve hasta 26 m dentro de su cono de luz y, en la oscuridad, a 4 m alrededor. Detrás de una casa o de un tronco no se ve. Quien la liga apunta hacia donde mira la cámara.</li>'+
  '<li><b>Agacharse</b>: si te quedas quieto un segundo, te agachas solo; agachado la linterna solo te ve a 13 m (y a 2,6 m alrededor). Al moverte te levantas.</li>'+
  '<li><b>Radar</b>: en los últimos 30 s, quien la liga ve a todos en un radar redondo (y en el mapa) y suena un pitido; quien se esconde lo sabe por el marcador.</li>'+
  '<li><b>Zona</b>: un círculo de farolillos naranjas. Si sales, tienes 5 s para volver; si no, vuelves solo.</li>'+
  '<li><b>Puntos</b>: 1 por cada 10 s sin que te pillen (o sin ligarla), 5 por cada pillada y 5 más si acabas la ronda libre. Monedas al final (1 por cada 3 puntos, hasta 15) y dos trofeos: «Escondido hasta el final» y «Rey del pilla-pilla».</li>'+
  '<li><b>Con la sala</b>: «Invitar a la sala» da 12 s para apuntarse; luego todos aparecen en la zona. <b>Sin amigos</b>, con 2 a 5 jugadores de la máquina. Mientras juegas no hay vehículos, ni casas por dentro, ni poderes de los disfraces; es de noche y al terminar vuelve tu hora.</li>'; }
function tgReadLis(){ return '<li><b>Marcador</b> (arriba a la izquierda; tócalo para ver la clasificación): juego y zona; la fase con su reloj (Escondeos, Buscando, Pillando); tu papel (🔦 la ligas, 🙈 escondido, 🏃 libre, 👀 te ve la linterna); cuántos quedan escondidos o quién la liga; cuándo sale el radar; y los cinco primeros con sus puntos.</li>'+
  '<li><b>Borde rojo en la pantalla</b>: la linterna de quien la liga te está viendo. Corre o escóndete detrás de algo.</li>'+
  '<li><b>Radar</b> (círculo verde, solo para quien la liga en los últimos 30 s): tú en el centro, mirando hacia arriba; los puntos rojos son los que se esconden, hasta 80 m (el anillo de dentro son 40 m). Los que están más lejos salen en el borde.</li>'+
  '<li><b>Mapa</b>: raya naranja = zona; punto blanco = casa; punto amarillo = quien la liga. Quien la liga solo ve en el mapa a los escondidos con el radar.</li>'; }
function tgGuideHTML(){ if(!WP.pilla) return ''; return '<li><b>Pilla-pilla y escondite de noche</b> (botón <b>Pilla-pilla</b> del inicio o del menú): uno la liga con linterna y los demás se esconden o corren por las villas de una zona con farolillos, con la sala o con jugadores de la máquina. Escondite (20 s para esconderse; a quien pillan, busca) o pilla-pilla (se cambian al pillar), 2 a 5 minutos, radar en los últimos 30 s, puntos, monedas y dos trofeos. Las reglas, cómo se lee y el glosario están en su hoja.</li>'; }
function tgGlossHTML(){ return '<dt>Ligarla</dt><dd>Ser quien busca o persigue: «la ligas tú». Lleva la linterna.</dd><dt>Pillar</dt><dd>Tocar a otro jugador mientras la ligas.</dd><dt>Escondite</dt><dd>Juego en el que uno cuenta con los ojos tapados y luego busca a los demás, que se han escondido.</dd><dt>Pilla-pilla</dt><dd>Juego de perseguir: quien la liga intenta tocar a otro, que pasa a ligarla.</dd><dt>Casa</dt><dd>Sitio donde cuenta quien la liga antes de salir a buscar.</dd><dt>Cono de luz</dt><dd>La zona en forma de cucurucho que ilumina la linterna: lo que está dentro se ve de lejos.</dd><dt>Radar</dt><dd>Pantalla redonda que enseña dónde están los demás, con un barrido que da vueltas.</dd><dt>Sin devolución</dt><dd>En el pilla-pilla, quien acaba de pillar no puede ser pillado por el pillado durante 4,5 s.</dd><dt>Zona de juego</dt><dd>El círculo de farolillos del que no se puede salir mientras se juega.</dd>'; }
// home and menu buttons, and the HUD opens the sheet
{ const mt=$('mTag'); if(mt){ mt.hidden=!WP.pilla; mt.onclick=()=>{ saveName(); ensureAudio(); tgSheet(TG.on?'clasif':'jugar'); }; } const hd=$('tgHud'); if(hd) hd.onclick=()=>tgSheet(TG.g&&TG.g.phase!=='lobby'?'clasif':'jugar'); }
