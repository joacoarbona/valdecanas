
/* ================= multiplayer: rooms, friends on the island, chat and voice ================= */
/* Each player publishes to a room topic on two public MQTT brokers at once (EMQX and HiveMQ, over secure WebSockets).
   Every message is encrypted with AES-GCM using a key derived from the room code (PBKDF2), so the brokers only relay
   ciphertext and the topic name does not reveal the code. Voice goes straight between browsers with WebRTC; the
   room carries its signalling. Nothing is stored anywhere. */
const MPV=1, MP_DELAY=170, MP_MAXPEERS=11;
const MPQ=new URLSearchParams(location.search), VGC=window.VG_CFG||{};
const MP_BROKERS=(MPQ.get('broker')||VGC.brokers||'wss://broker.emqx.io:8084/mqtt,wss://broker.hivemq.com:8884/mqtt').split(',').map(s=>s.trim()).filter(Boolean);
const MP_ALPHA='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const SITE_URL=VGC.site||WP.site||'https://joaco.org/', SITE_TXT=SITE_URL.replace(/^https?:\/\//,'').replace(/\/$/,'');
const TE=new TextEncoder(), TD=new TextDecoder();
const r2=v=>Math.round(v*100)/100, r3=v=>Math.round(v*1000)/1000;
const MP_OK=!!(window.crypto&&crypto.subtle&&window.WebSocket&&window.isSecureContext!==false);
const VC_OK=!!(window.RTCPeerConnection&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function toHex(u){ let s=''; for(const b of u) s+=b.toString(16).padStart(2,'0'); return s; }
function mpRandId(){ const a=new Uint8Array(8); crypto.getRandomValues(a); return toHex(a); }
function mpNewCode(){ const a=new Uint8Array(6); crypto.getRandomValues(a); let s=''; for(const v of a) s+=MP_ALPHA[v%MP_ALPHA.length]; return s; }
function mpNorm(s){ return String(s||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,12); }
function mpPretty(c){ return c&&c.length===6?c.slice(0,3)+' '+c.slice(3):(c||''); }
async function mpDerive(code){
  const base=await crypto.subtle.importKey('raw',TE.encode(code),'PBKDF2',false,['deriveBits']);
  const bits=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:TE.encode(WP.mpSalt),iterations:100000,hash:'SHA-256'},base,256));
  const key=await crypto.subtle.importKey('raw',bits.slice(0,16),{name:'AES-GCM'},false,['encrypt','decrypt']);
  return {key,topic:WP.mpTopic+toHex(bits.slice(16,26))};
}
async function mpSeal(key,obj){ const iv=crypto.getRandomValues(new Uint8Array(12)); const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,TE.encode(JSON.stringify(obj)))); const out=new Uint8Array(12+ct.length); out.set(iv); out.set(ct,12); return out; }
async function mpOpen(key,buf){ if(!key||buf.length<29) return null; try{ const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:buf.subarray(0,12)},key,buf.subarray(12)); return JSON.parse(TD.decode(pt)); }catch(e){ return null; } }

/* ---- a minimal MQTT 3.1.1 client over WebSocket (QoS 0 publish/subscribe, keep-alive, last will, reconnect) ---- */
function mqStr(s){ const b=typeof s==='string'?TE.encode(s):s; const o=new Uint8Array(2+b.length); o[0]=(b.length>>8)&255; o[1]=b.length&255; o.set(b,2); return o; }
function mqPkt(type,parts){ let L=0; for(const p of parts) L+=p.length; const lb=[]; let n=L; do{ let d=n%128; n=Math.floor(n/128); if(n>0) d|=128; lb.push(d); }while(n>0);
  const o=new Uint8Array(1+lb.length+L); o[0]=type; o.set(lb,1); let k=1+lb.length; for(const p of parts){ o.set(p,k); k+=p.length; } return o; }
class MQ{
  constructor(url,will,onMsg,onUp){ this.url=url; this.will=will; this.onMsg=onMsg; this.onUp=onUp; this.subs=[]; this.up=false; this.buf=null; this.tries=0; this.dead=false; this.pid=1; this.cid='vg'+mpRandId(); this.host=url.replace(/^wss?:\/\//,'').split(/[:/]/)[0]; this.open(); }
  open(){ if(this.dead) return; let ws; try{ ws=new WebSocket(this.url,['mqtt']); }catch(e){ this.retry(); return; } this.ws=ws; ws.binaryType='arraybuffer'; this.buf=null;
    ws.onopen=()=>{ try{ ws.send(this.connPkt()); }catch(e){} };
    ws.onmessage=e=>{ if(typeof e.data!=='string') this.feed(new Uint8Array(e.data)); };
    ws.onclose=()=>{ if(this.ws!==ws) return; clearInterval(this.pingT); clearTimeout(this.cto); const was=this.up; this.up=false; if(was) this.onUp(false,this); this.retry(); };
    ws.onerror=()=>{};
    clearTimeout(this.cto); this.cto=setTimeout(()=>{ if(!this.up&&this.ws===ws){ try{ ws.close(); }catch(e){} } },9000); }
  retry(){ if(this.dead) return; clearTimeout(this.rt); const d=Math.min(20000,1200*Math.pow(1.8,this.tries++)); this.rt=setTimeout(()=>this.open(),d); }
  connPkt(){ const flags=0x02|(this.will?0x04:0); const parts=[new Uint8Array([0,4,77,81,84,84,4,flags,0,40]),mqStr(this.cid)]; if(this.will) parts.push(mqStr(this.will.topic),mqStr(this.will.payload)); return mqPkt(0x10,parts); }
  sendSub(list){ if(!list.length||!this.ws) return; this.pid=(this.pid%65535)+1; const id=this.pid; const parts=[new Uint8Array([id>>8,id&255])]; for(const t of list) parts.push(mqStr(t),new Uint8Array([0])); try{ this.ws.send(mqPkt(0x82,parts)); }catch(e){} }
  sub(t){ if(!this.subs.includes(t)) this.subs.push(t); if(this.up) this.sendSub([t]); }
  pub(t,payload){ if(!this.up||!this.ws||this.ws.readyState!==1) return false; try{ this.ws.send(mqPkt(0x30,[mqStr(t),payload])); return true; }catch(e){ return false; } }
  feed(ch){ let b=ch; if(this.buf&&this.buf.length){ b=new Uint8Array(this.buf.length+ch.length); b.set(this.buf); b.set(ch,this.buf.length); } let p=0;
    while(b.length-p>=2){ let mul=1,len=0,i=p+1,byte=0,ok=true; do{ if(i>=b.length){ ok=false; break; } byte=b[i++]; len+=(byte&127)*mul; mul*=128; }while(byte&128); if(!ok||b.length-i<len) break; this.pkt(b[p],b.subarray(i,i+len)); p=i+len; }
    this.buf=p<b.length?b.slice(p):null; }
  pkt(h,d){ const t=h>>4;
    if(t===2){ if(d.length>=2&&d[1]===0){ this.up=true; this.tries=0; clearTimeout(this.cto); this.sendSub(this.subs); clearInterval(this.pingT); this.pingT=setInterval(()=>{ try{ if(this.ws&&this.ws.readyState===1) this.ws.send(new Uint8Array([0xC0,0])); }catch(e){} },15000); this.onUp(true,this); }
      else { try{ this.ws.close(); }catch(e){} } }
    else if(t===3){ if(d.length<2) return; const tl=(d[0]<<8)|d[1]; const topic=TD.decode(d.subarray(2,2+tl)); let o=2+tl; if((h>>1)&3) o+=2; this.onMsg(topic,d.slice(o)); } }
  close(){ this.dead=true; clearTimeout(this.rt); clearTimeout(this.cto); clearInterval(this.pingT); const ws=this.ws; this.ws=null; this.up=false; try{ if(ws&&ws.readyState===1) ws.send(new Uint8Array([0xE0,0])); if(ws) ws.close(); }catch(e){} }
}

/* ---- room state ---- */
const MP={code:'',id:'',key:null,topic:'',conns:[],peers:new Map(),gone:new Map(),seq:0,epoch:0,lastKey:'',lastSent:0,chat:[],seen:new Map(),rx:Promise.resolve(),
  panelOpen:false,joining:false,err:'',byePl:null,uiT:0,sigs:{},promptT:{},
  voice:{mic:false,prox:store.get('vg_vprox')==='1',stream:null,an:null,src:null,level:0,err:''}};
function mpUp(){ let n=0; for(const c of MP.conns) if(c.up) n++; return n; }
function mpName(){ const n=(S.name||'').trim(); return n||('Jugador '+((parseInt((MP.id||'00').slice(0,4),16)%90)+10)); }
function mpCardArr(){ return W.HOLES.map((H,i)=>S.g.scores[i]||0); }
function mpMovedBuggies(){ const out=[]; buggies.forEach((b,i)=>{ if(!b.home) return; if(Math.hypot(b.x-b.home[0],b.z-b.home[1])>1.2) out.push([i,r2(b.x),r2(b.z),r3(b.yaw)]); }); return out; }
function mpHiMsg(reply){ const o={t:'hi',n:mpName(),k:S.skin,sc:mpCardArr(),mic:MP.voice.mic?1:0,bz:mpMovedBuggies()}; if(reply) o.r=1; return o; }
function mpState(){
  const m=S.mode, g=S.g; const o={t:'s',m};
  if(m==='plane'&&S.plane){ const q=planePos(); o.p=[r2(q[0]),r2(q[1]),r2(q[2])]; o.y=r3(Math.atan2(S.plane.dz,S.plane.dx)); }
  else { o.p=[r2(P.x),r2(P.y),r2(P.z)]; o.y=r3(P.yaw); }
  o.a=P.anim||'idle'; o.k=r2(P.animK||0); o.h=g.hole; o.c=g.cur;
  if(g.hole>=0&&g.ballVisible) o.b=[r2(g.ball.x),r2(g.ball.y),r2(g.ball.z)];
  if(m==='flight') o.f=1;
  if(P.buggy){ o.d=buggies.indexOf(P.buggy); if(P.buggy.cop) o.cp=1; }
  if(S.interior) o.iv=S.interior.b.id;
  if(P.swim) o.sw=1;
  if(glider&&glider.visible) o.gl=1;
  if(document.hidden) o.aw=1;
  if(MP.voice.mic) o.mic=1;
  return o;
}
async function mpSendVia(conns,o,to){ if(!MP.key) return; const ep=MP.epoch, key=MP.key; o.i=MP.id; o.q=++MP.seq; o.ts=Date.now(); o.v=MPV; const pl=await mpSeal(key,o); if(ep!==MP.epoch) return; const t=to?MP.topic+'/u/'+to:MP.topic+'/r'; for(const c of conns) c.pub(t,pl); }
function mpSend(o,to){ return mpSendVia(MP.conns,o,to); }

async function mpJoin(code){
  code=mpNorm(code); if(code.length<4){ MP.err='Ese código no es válido: tiene 6 letras y números.'; mpUI(); return; }
  if(!MP_OK){ MP.err='Este navegador no permite salas aquí (hace falta una página https).'; mpUI(); return; }
  if(MP.code) mpLeave(true);
  const ep=++MP.epoch; MP.joining=true; MP.err=''; MP.code=code; MP.introSig=''; mpUI();
  let d; try{ d=await mpDerive(code); }catch(e){ if(ep===MP.epoch){ MP.err='No se pudo preparar el cifrado de la sala.'; MP.joining=false; MP.code=''; mpUI(); } return; }
  if(ep!==MP.epoch) return;
  MP.key=d.key; MP.topic=d.topic; MP.id=mpRandId(); MP.seq=0; MP.seen.clear(); MP.lastKey=''; MP.lastSent=0; MP.chat=[];
  const will={topic:MP.topic+'/r',payload:await mpSeal(MP.key,{t:'bye',i:MP.id,q:0,v:MPV,ts:Date.now()})};
  MP.byePl=await mpSeal(MP.key,{t:'bye',i:MP.id,q:-1,v:MPV,ts:Date.now()});
  if(ep!==MP.epoch) return;
  MP.conns=MP_BROKERS.map(u=>{ const c=new MQ(u,will,(t,b)=>mpRaw(ep,b),up=>mpConnUp(ep,c,up)); c.sub(MP.topic+'/r'); c.sub(MP.topic+'/u/'+MP.id); return c; });
  MP.joining=false;
  try{ const u=new URL(location.href); u.searchParams.set('sala',code); history.replaceState(null,'',u.toString()); }catch(e){}
  store.set('vg_room',code); MP.joinT=performance.now(); MP.everUp=false; mpUI();
}
function mpConnUp(ep,c,up){ if(ep!==MP.epoch) return; if(up){ MP.everUp=true; if(MP.err&&MP.err.startsWith('No se puede conectar')) MP.err=''; mpSendVia([c],mpHiMsg(false)); MP.lastKey=''; } mpUI(true); }
function mpLeave(switching){
  if(!MP.code) return;
  for(const c of MP.conns){ if(MP.byePl) c.pub(MP.topic+'/r',MP.byePl); }
  const old=MP.conns; MP.conns=[]; setTimeout(()=>old.forEach(c=>c.close()),120);
  MP.epoch++; for(const p of [...MP.peers.values()]) mpDropPeer(p,null);
  if(MP.voice.mic) vcSetMic(false,true);
  MP.code=''; MP.key=null; MP.topic=''; MP.byePl=null; MP.err=''; MP.introSig=''; MP.gone.clear();
  if(!switching){ try{ const u=new URL(location.href); u.searchParams.delete('sala'); history.replaceState(null,'',u.toString()); }catch(e){} store.set('vg_room',''); }
  for(const el of [...$('mpFeed').children]) el.remove(); $('mpPrompt').hidden=true; mpCloseChat();
  if(!switching) mpFeed('Has salido de la sala','sys');
  mpUI();
}
function mpRaw(ep,bytes){ MP.rx=MP.rx.then(async()=>{ if(ep!==MP.epoch) return; const o=await mpOpen(MP.key,bytes); if(ep!==MP.epoch||!o) return;
  try{ await Promise.race([mpHandle(o),new Promise(r=>setTimeout(r,4000))]); }catch(e){ console.warn('sala:',e); } }); }

/* ---- peers ---- */
function mpAddPeer(id){ const p={id,n:'',k:0,sc:[],snaps:[],off:undefined,last:performance.now(),cur:null,out:null,animT:0,rig:null,rigK:-1,gl:null,tag:null,tagTxt:'',
  ball:null,trail:null,trailN:0,wasF:false,trailT:0,bm:null,pm:null,hiT:0,mic:false,dist:0,level:0,pc:null}; MP.peers.set(id,p); return p; }
function mpDispose(obj){ obj.traverse(o=>{ if(o.geometry&&o.geometry!==BUGGY_GEO&&o.geometry!==ballMesh.geometry) o.geometry.dispose(); if(o.material&&o.material!==ballMesh.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose()); } }); }
function mpDropPeer(p,why){
  MP.peers.delete(p.id); MP.seen.delete(p.id); if(p.n) MP.gone.set(p.id,performance.now());
  for(const o of [p.rig&&p.rig.root,p.ball,p.trail,p.bm,p.pm]) if(o){ scene.remove(o); if(o!==p.ball) mpDispose(o); }
  if(p.tag) p.tag.remove();
  for(const b of buggies) if(b.remoteBy===p.id){ b.remoteBy=null; b.g.visible=true; }
  vcClose(p);
  if(why&&p.n) mpFeed(p.n+' '+why,'sys');
  mpUI();
}
async function mpHandle(o){
  if(!o||typeof o!=='object'||typeof o.i!=='string'||o.i===MP.id||typeof o.t!=='string') return;
  let sn=MP.seen.get(o.i); if(!sn){ sn=new Set(); MP.seen.set(o.i,sn); } if(sn.has(o.q)) return; sn.add(o.q); if(sn.size>400){ const it=sn.values(); for(let k=0;k<150;k++) sn.delete(it.next().value); }
  let p=MP.peers.get(o.i);
  if(o.t==='bye'){ if(p&&!(o.q===0&&performance.now()-p.last<4500)) mpDropPeer(p,o.q===0?'se ha desconectado':'ha salido de la sala'); return; }
  if(o.v!==MPV){ if(!MP.sigs.ver){ MP.sigs.ver=1; mpFeed('Alguien de la sala usa otra versión del juego: recargad la página todos.','sys'); } return; }
  if(!p){ if(MP.peers.size>=MP_MAXPEERS) return; p=mpAddPeer(o.i); if(o.t!=='hi'){ p.hiT=performance.now(); mpSend(mpHiMsg(false)); } }
  p.last=performance.now();
  switch(o.t){
    case 'hi': mpHi(p,o); break;
    case 's': mpSnap(p,o); break;
    case 'chat': { const x=String(o.x||'').replace(/[\u0000-\u001f]/g,' ').slice(0,160).trim(); if(x) mpChatIn(p,x); break; }
    case 'card': { if(Array.isArray(o.sc)){ const before=p.sc||[]; p.sc=o.sc.slice(0,18).map(v=>(v|0)>0&&(v|0)<=15?v|0:0);
        if(Array.isArray(o.j)&&W.HOLES[o.j[0]|0]&&p.sc[o.j[0]|0]&&before[o.j[0]|0]!==p.sc[o.j[0]|0]){ const H=W.HOLES[o.j[0]|0], st=p.sc[o.j[0]|0]; mpFeed('<b>'+esc(p.n)+'</b>: '+scoreName(st,H.par)+' en el '+H.n+' ('+st+(st===1?' golpe':' golpes')+')','ev',true); } mpUI(true); } break; }
    case 'drop': { if(!Number.isFinite(o.ang)||!Number.isFinite(o.off)) break; const t0=performance.now();
      mpFeed('<b>'+esc(p.n)+'</b> ha llamado a la avioneta','ev',true);
      mpPrompt(esc(p.n)+' ha llamado a la avioneta para todos. ¿Subes?','Subir',()=>mpBoard(o.ang,o.off,(performance.now()-t0)/1000+0.15),14000); break; }
    case 'hole': { const h=o.h|0; const H=W.HOLES[h]; if(!H) break; const busy=S.g.hole>=0||['aim','swing','flight','wait','plane','fall','glide'].includes(S.mode);
      mpFeed('<b>'+esc(p.n)+'</b> empieza el hoyo '+H.n,'ev',true);
      if(!busy&&S.mode!=='menu'&&performance.now()-(MP.promptT[p.id]||0)>20000){ MP.promptT[p.id]=performance.now(); mpPrompt(esc(p.n)+' empieza el hoyo '+H.n+' (par '+H.par+'). ¿Lo juegas también?','Jugar el '+H.n,()=>mpPlayHole(h),12000); } break; }
    case 'gold': mpFeed('<b>'+esc(p.n)+'</b> ha encontrado una bola dorada ('+(o.c|0)+' de '+GOLD.length+')','ev',true); break;
    case 'bug': mpApplyBuggy(o.b); break;
    case 'reset': { const ck=(o.c|0)<W.COURSES.length?(o.c|0):S.course; const C=W.COURSES[ck]; mpPrompt(esc(p.n)+' propone empezar una tarjeta nueva para toda la sala'+(W.MULTI?' en '+C.name:'')+'. Se borra la tuya.','Vale, tarjeta nueva',()=>{ if(ck!==S.course) setCourse(ck); clearCard(); mpFeed('Tarjeta nueva: ve al tee '+W.HOLES[C.holes[0]].n,'sys'); },15000); } break;
    case 'sig': if(o.to===undefined||o.to===MP.id) await vcSignal(p,o); break;
  }
}
function mpHi(p,o){
  const first=!p.n; p.n=String(o.n||'').replace(/[\u0000-\u001f]/g,'').trim().slice(0,16)||'Jugador';
  const k=o.k|0; p.k=(k>=0&&k<SKINS.length)?k:0;
  if(Array.isArray(o.sc)) p.sc=o.sc.slice(0,18).map(v=>(v|0)>0&&(v|0)<=15?v|0:0);
  p.mic=!!o.mic; if(Array.isArray(o.bz)) for(const e of o.bz.slice(0,20)) mpApplyBuggy(e);
  if(first){ const back=performance.now()-(MP.gone.get(p.id)||-1e9)<60000; MP.gone.delete(p.id); // a friend back after a short stall is not news
    if(!back){ mpFeed('<b>'+esc(p.n)+'</b> ha entrado en la sala','sys',true); blip('jump'); } if(MP.voice.mic) vcEnsure(p); }
  if(!o.r&&performance.now()-p.hiT>2500){ p.hiT=performance.now(); setTimeout(()=>{ if(MP.peers.has(p.id)) mpSend(mpHiMsg(true)); },60+Math.random()*320); }
  mpUI(true);
}
function mpApplyBuggy(e){ if(!Array.isArray(e)||e.length<4) return; const b=buggies[e[0]|0]; if(!b||P.buggy===b) return; if(![e[1],e[2],e[3]].every(Number.isFinite)) return; b.x=e[1]; b.z=e[2]; b.yaw=e[3]; placeBuggyMesh(b); }
function mpSnap(p,o){
  if(!Array.isArray(o.p)||o.p.length!==3||!o.p.every(v=>Number.isFinite(v)&&Math.abs(v)<60000)||!Number.isFinite(o.ts)) return;
  const off=Date.now()-o.ts; if(p.off===undefined||off<p.off) p.off=off; else p.off+=(off-p.off)*0.02;
  const s={ts:o.ts,p:o.p,y:Number.isFinite(o.y)?o.y:0,a:typeof o.a==='string'?o.a.slice(0,8):'idle',k:Number.isFinite(o.k)?o.k:0,m:typeof o.m==='string'?o.m.slice(0,8):'walk',h:Number.isInteger(o.h)?o.h:-1,c:o.c|0,
    b:Array.isArray(o.b)&&o.b.length===3&&o.b.every(Number.isFinite)?o.b:null,f:!!o.f,d:Number.isInteger(o.d)?o.d:-1,iv:o.iv===undefined?null:o.iv,sw:!!o.sw,gl:!!o.gl,aw:!!o.aw,mic:!!o.mic,cp:!!o.cp};
  const sn=p.snaps;
  if(sn.length&&s.ts<=sn[sn.length-1].ts){ if(s.ts<sn[0].ts) return; let i=sn.length-1; while(i>0&&sn[i].ts>s.ts) i--; if(sn[i].ts===s.ts) return; sn.splice(i+1,0,s); } else sn.push(s);
  while(sn.length>2&&sn[sn.length-1].ts-sn[0].ts>3000) sn.shift();
  if(!p.cur||s.ts>=p.cur.ts){ const prev=p.cur; p.cur=s; p.mic=s.mic; if(!prev||prev.m!==s.m||prev.h!==s.h||prev.aw!==s.aw) mpUI(true); }
}
// interpolate each friend ~170 ms in the past, in the sender's own clock
function mpInterp(p,now){
  const sn=p.snaps; if(!sn.length) return null; const rt=now-p.off-MP_DELAY; const o=p.out||(p.out={x:0,y:0,z:0,yaw:0,spd:0});
  let a=sn[sn.length-1], b=null;
  for(let i=sn.length-1;i>=0;i--){ if(sn[i].ts<=rt){ a=sn[i]; b=sn[i+1]||null; break; } if(i===0){ a=sn[0]; b=null; } }
  const take=s=>{ o.m=s.m; o.a=s.a; o.k=s.k; o.h=s.h; o.c=s.c; o.f=s.f; o.d=s.d; o.iv=s.iv; o.sw=s.sw; o.gl=s.gl; o.aw=s.aw; o.cp=s.cp; };
  if(b){ const u=clamp((rt-a.ts)/Math.max(1,b.ts-a.ts),0,1); const jump=Math.hypot(b.p[0]-a.p[0],b.p[1]-a.p[1],b.p[2]-a.p[2])>45||(a.m!==b.m&&(a.m==='plane'||b.m==='plane'));
    const s=jump?b:null;
    if(s){ o.x=s.p[0]; o.y=s.p[1]; o.z=s.p[2]; o.yaw=s.y; o.spd=0; }
    else { o.x=a.p[0]+(b.p[0]-a.p[0])*u; o.y=a.p[1]+(b.p[1]-a.p[1])*u; o.z=a.p[2]+(b.p[2]-a.p[2])*u; o.yaw=lerpAng(a.y,b.y,u); o.spd=Math.hypot(b.p[0]-a.p[0],b.p[2]-a.p[2])/Math.max(0.001,(b.ts-a.ts)/1000); }
    take(u>0.5?b:a); if(a.a===b.a&&!jump) o.k=a.k+(b.k-a.k)*u;
    if(a.b&&b.b&&!jump){ o.b=o.b||[0,0,0]; for(let k=0;k<3;k++) o.b[k]=a.b[k]+(b.b[k]-a.b[k])*u; } else o.b=(u>0.5?b.b:a.b)||null; }
  else { o.x=a.p[0]; o.y=a.p[1]; o.z=a.p[2]; o.yaw=a.y; o.spd=0; take(a); o.b=a.b; }
  return o;
}

/* ---- friends drawn in the world ---- */
const OFFWORLD=['menu','drone','loading'];
function mpTrailAdd(p,b){
  if(!p.trail){ const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(TRAIL_N*3),3)); geo.setDrawRange(0,0);
    p.trail=new THREE.Line(geo,new THREE.LineBasicMaterial({color:Cc(SKINS[p.k].shirt),transparent:true,opacity:0.9})); p.trail.frustumCulled=false; scene.add(p.trail); }
  const a=p.trail.geometry.attributes.position.array; const n=p.trailN;
  if(n>0){ const dx=a[(n-1)*3]-b[0], dz=a[(n-1)*3+2]-b[2], dy=a[(n-1)*3+1]-(b[1]+0.2); if(dx*dx+dy*dy+dz*dz<0.64) return; }
  if(n>=TRAIL_N) return; a[n*3]=b[0]; a[n*3+1]=b[1]+0.2; a[n*3+2]=b[2]; p.trailN=n+1; p.trail.geometry.setDrawRange(0,p.trailN); p.trail.geometry.attributes.position.needsUpdate=true;
}
function mpFrame(dt){
  if(!MP.code||!MP.peers.size) return;
  const now=Date.now(); const shownPlanes=[]; if(plane&&plane.visible) shownPlanes.push(plane.position);
  const off=OFFWORLD.includes(S.mode); const meX=off?camera.position.x:P.x, meZ=off?camera.position.z:P.z;
  for(const p of MP.peers.values()){
    const s=mpInterp(p,now);
    if(!s){ if(p.tag) p.tag.hidden=true; continue; }
    const inWorld=!OFFWORLD.includes(s.m);
    const cd=Math.hypot(s.x-camera.position.x,s.y-camera.position.y,s.z-camera.position.z); p.dist=Math.hypot(s.x-meX,s.z-meZ);
    if(p.rigK!==p.k){ if(p.rig){ scene.remove(p.rig.root); mpDispose(p.rig.root); } p.rig=buildRig(SKINS[p.k]); p.gl=makeGlider(); p.rig.root.add(p.gl); scene.add(p.rig.root); p.rigK=p.k;
      if(p.trail) p.trail.material.color.copy(Cc(SKINS[p.k].shirt)); }
    const R=p.rig; const showRig=inWorld&&s.m!=='plane'&&cd<500; R.root.visible=showRig;
    if(showRig){ p.animT+=dt*(s.a==='run'?1+Math.max(0.2,s.k)*10.5*1.15:1); const anim=['idle','run','air','fall','glide','swim','tread','drive','address','swing','follow','cheer'].includes(s.a)?s.a:'idle';
      poseRig(R,anim,(anim==='run'||anim==='swim')?p.animT:T,s.k); R.root.position.set(s.x,s.y,s.z); R.root.rotation.set(0,-s.yaw,0);
      p.gl.visible=!!s.gl; R.club.visible=['aim','swing','flight'].includes(s.m)||(s.m==='wait'&&anim==='follow'); }
    // a friend's buggy: hide our parked copy while they drive it and draw theirs
    if(inWorld&&s.m==='drive'){ const lb0=buggies[s.d]; const ty=(lb0&&lb0.type)||''; if(!p.bm||p.bmT!==ty){ if(p.bm) scene.remove(p.bm); p.bm=ty?makeCarMesh(ty):makeBuggy(); p.bmT=ty; } p.bm.visible=true; const c=Math.cos(s.yaw), sn=Math.sin(s.yaw);
      const wb=ty?VEH[ty].base:0.85; const hF=W.terrain(s.x+c*wb,s.z+sn*wb), hB=W.terrain(s.x-c*wb,s.z-sn*wb);
      p.bm.position.set(s.x,s.y,s.z); p.bm.rotation.order='YXZ'; p.bm.rotation.set(0,-s.yaw,clamp(Math.atan2(hF-hB,2*wb),-0.5,0.5));
      if(ty) setCarCopilot(p.bm,!!s.cp);
      if(showRig){ const sp=seatPos(ty?{x:s.x,y:s.y,z:s.z,yaw:s.yaw,type:ty,pitch:0}:{x:s.x,y:s.y,z:s.z,yaw:s.yaw}); R.root.position.set(sp[0],sp[1],sp[2]); }
      const lb=buggies[s.d]; if(lb&&P.buggy!==lb&&lb.remoteBy!==p.id){ lb.remoteBy=p.id; lb.g.visible=false; } }
    else { if(p.bm) p.bm.visible=false; for(const b of buggies) if(b.remoteBy===p.id){ b.remoteBy=null; b.g.visible=true; } }
    // their aeroplane, unless it is the same one we can already see
    if(inWorld&&s.m==='plane'){ let near=false; for(const q of shownPlanes){ if(Math.hypot(q.x-s.x,q.y-s.y,q.z-s.z)<90){ near=true; break; } }
      if(!near){ if(!p.pm) p.pm=makePlane(); p.pm.visible=true; p.pm.position.set(s.x,s.y,s.z); p.pm.rotation.y=-s.yaw; p.pm.userData.prop.rotation.x+=dt*40; shownPlanes.push(p.pm.position); }
      else if(p.pm) p.pm.visible=false; }
    else if(p.pm) p.pm.visible=false;
    // their ball and its trail, in the colour of their shirt
    if(inWorld&&s.b&&s.h>=0){ if(!p.ball){ p.ball=new THREE.Mesh(ballMesh.geometry,ballMesh.material); p.ball.castShadow=true; scene.add(p.ball); } p.ball.visible=true; p.ball.position.set(s.b[0],s.b[1]+0.2,s.b[2]); }
    else if(p.ball) p.ball.visible=false;
    if(inWorld&&s.f&&s.b){ if(!p.wasF){ p.trailN=0; if(p.trail) p.trail.geometry.setDrawRange(0,0); } p.wasF=true; p.trailT=5; mpTrailAdd(p,s.b); } else p.wasF=false;
    if(p.trail){ if(!s.f) p.trailT-=dt; p.trail.visible=inWorld&&p.trailT>0; }
    // name tag
    if(!p.tag){ p.tag=document.createElement('div'); p.tag.className='ptag'; p.tag.hidden=true; $('labels').appendChild(p.tag); }
    if(inWorld&&cd<3000){ const hy=s.m==='plane'?s.y+5.5:(s.m==='drive'?s.y+2.7:(s.sw?s.y+1.2:s.y+2.3)); const q=project(s.x,hy,s.z);
      if(q&&q[2]){ p.tag.hidden=false; p.tag.style.transform='translate('+q[0].toFixed(1)+'px,'+q[1].toFixed(1)+'px) translate(-50%,-100%)';
        const talk=p.level>0.035; const txt='<i style="background:'+SKINS[p.k].shirt+'"></i>'+esc(p.n||'…')+(p.dist>25?' <small>'+fmt(p.dist)+' m</small>':'')+(p.mic?' <svg class="mic" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4"/></svg>':'');
        if(txt!==p.tagTxt){ p.tag.innerHTML=txt; p.tagTxt=txt; } p.tag.classList.toggle('talk',talk); p.tag.style.opacity=cd>700?0.78:1; }
      else p.tag.hidden=true; }
    else p.tag.hidden=true;
  }
}
// friends on the minimap and the big map: a dot in the colour of their shirt (with the name on the big map)
function mpDrawMap(g,W_,H_,s,big,tf){
  if(!MP.code) return; const m2c_=tf||((x,z)=>m2c(x,z,W_,H_));
  for(const p of MP.peers.values()){ const o=p.out; if(!o||OFFWORLD.includes(o.m)) continue; const [x,y]=m2c_(o.x,o.z); if(x<-20||y<-20||x>W_+20||y>H_+20) continue;
    if(o.b&&o.h>=0){ const [bx,by]=m2c_(o.b[0],o.b[2]); g.fillStyle='#ffffff'; g.strokeStyle=SKINS[p.k].shirt; g.lineWidth=(big?1.4:2)*s; g.beginPath(); g.arc(bx,by,(big?3:5)*s,0,7); g.fill(); g.stroke(); }
    const r=(big?5.5:9)*s; g.fillStyle=SKINS[p.k].shirt; g.strokeStyle='#ffffff'; g.lineWidth=(big?1.8:3.5)*s; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); g.stroke();
    if(big){ g.font='800 '+(8*s)+'px Figtree, system-ui, sans-serif'; g.textAlign='left'; g.textBaseline='middle'; g.lineWidth=3*s; g.strokeStyle='rgba(255,255,255,.92)'; g.strokeText(p.n||'…',x+r+3*s,y); g.fillStyle='#16231b'; g.fillText(p.n||'…',x+r+3*s,y); } }
}

/* ---- actions with friends ---- */
function mpEnterWorld(){ const m=S.mode; if(OFFWORLD.includes(m)||m==='plane'){ if(m==='plane') plane.visible=false; if(rig) rig.root.visible=true; S.landedOnce=true; }
  if(m==='plane'||m==='fall'||m==='glide'){ if(glider) glider.visible=false; setWind(0); } }
function mpGoTo(id){
  const p=MP.peers.get(id); if(!p||!p.cur||!p.out) return; const c=p.cur, o=p.out;
  if(OFFWORLD.includes(c.m)){ mpFeed((p.n||'Tu amigo')+' '+WP.T.notJumped,'sys'); return; }
  if(['plane','fall','glide'].includes(c.m)){ mpFeed((p.n||'Tu amigo')+' está en el aire: espera a que aterrice o llamad juntos a la avioneta','sys'); return; }
  if(['flight','wait','swing'].includes(S.mode)){ mpFeed('Espera a que se pare tu bola','sys'); return; }
  closeModal(); hideMap(); ensureAudio();
  if(c.iv!=null){ const b=BLD.find(b=>b.id===c.iv); if(b){ if(S.mode==='aim') exitAim(); if(P.buggy) exitBuggy(); mpEnterWorld(); if(S.mode!=='walk') setMode('walk');
      if(S.interior&&S.interior.b===b) return; if(S.interior) exitVilla(); P.x=o.x; P.z=o.z; goInside(b); return; } }
  fadeTo(()=>{ if(S.interior) exitVilla(); if(P.buggy) exitBuggy(); mpEnterWorld();
    let best=null; for(let k=0;k<12;k++){ const a=k/12*Math.PI*2+o.yaw+Math.PI, r=k<8?2.6:4.5; const x=o.x+Math.cos(a)*r, z=o.z+Math.sin(a)*r;
      if(bldAt(x,z,0.4)) continue; if(terrainAt(x,z)<W.waterLevel(x,z)-0.6&&!c.sw) continue; best=[x,z]; break; }
    const [x,z]=best||[o.x,o.z]; P.x=x; P.z=z; P.y=groundAt(x,z,o.y+3); P.vx=P.vy=P.vz=0; P.swim=false; P.yaw=Math.atan2(o.z-z,o.x-x); camS.yaw=P.yaw; camS.pitch=0.25; setMode('walk'); });
}
function mpPlayHole(h){ const H=W.HOLES[h]; if(!H) return; closeModal(); hideMap(); ensureAudio(); fadeTo(()=>{ mpEnterWorld(); if(S.interior) exitVilla(); if(P.buggy) exitBuggy(); startHole(h); }); }
function mpBoard(ang,off,t){ if(S.g.hole>=0){ S.g.hole=-1; S.g.ballVisible=false; } if(S.interior) exitVilla(); startDrop({ang,off,t:clamp(t||0,0,60)}); }
function mpCallPlane(){ if(!MP.code) return; const ang=Math.random()*Math.PI*2, off=(Math.random()-0.5)*600; mpSend({t:'drop',ang:r3(ang),off:r2(off)}); mpFeed('Has llamado a la avioneta para toda la sala','sys'); closeModal(); mpBoard(r3(ang),r2(off),0); }
// friends already teeing off on this hole: tee up beside them instead of on top of them
function mpTeeOffset(i){ const H=W.HOLES[i]; if(!MP.code||!H) return [0,0]; let n=0; for(const p of MP.peers.values()){ const c=p.cur; if(c&&c.h===i&&c.b&&Math.hypot(c.b[0]-H.tx,c.b[2]-H.tz)<3) n++; }
  if(!n) return [0,0]; const side=(n%2?1:-1)*Math.ceil(n/2)*2.6; return [-H.ts*side,H.tc*side]; }
function mpHoleStarted(i){ if(MP.code) mpSend({t:'hole',h:i}); }
function mpCard(j){ if(MP.code) mpSend(j>=0?{t:'card',sc:mpCardArr(),j:[j,S.g.scores[j]||0]}:{t:'card',sc:mpCardArr()}); if(MP.panelOpen) mpUI(true); }
function mpGold(){ if(MP.code) mpSend({t:'gold',c:S.gold.size}); }
function mpBuggyParked(b){ if(MP.code) mpSend({t:'bug',b:[buggies.indexOf(b),r2(b.x),r2(b.z),r3(b.yaw)]}); }
function mpSay(x){ x=String(x||'').trim().slice(0,160); if(!x||!MP.code) return; mpSend({t:'chat',x}); mpChatIn(null,x); }
function mpChatIn(p,x){ const who=p?p.n:mpName(); const col=SKINS[p?p.k:S.skin].shirt; MP.chat.push({who,x,col,me:!p}); if(MP.chat.length>60) MP.chat.shift();
  mpFeed('<b style="color:'+col+'">'+esc(who)+':</b> '+esc(x),'chat',true); if(p) blip('jump');
  const log=$('mpLog'); if(log){ log.insertAdjacentHTML('beforeend',mpChatLine(MP.chat[MP.chat.length-1])); log.scrollTop=log.scrollHeight; } }
function mpChatLine(m){ return '<div><b style="color:'+m.col+'">'+esc(m.who)+(m.me?' (tú)':'')+':</b> '+esc(m.x)+'</div>'; }

/* ---- feed (left column), prompt (invitations) and the floating bar ---- */
function mpFeed(html,kind,isHtml){ const box=$('mpFeed'); const el=document.createElement('div'); el.className=kind||'sys'; if(isHtml) el.innerHTML=html; else el.textContent=html; box.appendChild(el);
  while(box.children.length>5) box.firstElementChild.remove(); setTimeout(()=>{ el.style.opacity='0'; setTimeout(()=>el.remove(),700); },kind==='chat'?14000:9000); }
let mpPromptFn=null, mpPromptTimer=0;
function mpPrompt(html,yes,fn,ms){ $('mpPromptTxt').innerHTML=html; $('mpPromptYes').textContent=yes; mpPromptFn=fn; $('mpPrompt').hidden=false; clearTimeout(mpPromptTimer); mpPromptTimer=setTimeout(()=>{ $('mpPrompt').hidden=true; mpPromptFn=null; },ms||10000); }
$('mpPromptYes').onclick=()=>{ $('mpPrompt').hidden=true; clearTimeout(mpPromptTimer); const f=mpPromptFn; mpPromptFn=null; if(f) f(); };
$('mpPromptNo').onclick=()=>{ $('mpPrompt').hidden=true; clearTimeout(mpPromptTimer); mpPromptFn=null; };
function mpOpenChat(){ if(!MP.code) return; $('mpChatBar').hidden=false; const i=$('mpChatIn'); i.value=''; setTimeout(()=>i.focus(),30); }
function mpCloseChat(){ $('mpChatBar').hidden=true; $('mpChatIn').blur(); }
$('mpChatSend').onclick=()=>{ mpSay($('mpChatIn').value); mpCloseChat(); };
$('mpChatIn').addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); mpSay($('mpChatIn').value); mpCloseChat(); } else if(e.key==='Escape'){ mpCloseChat(); } });
$('mpPeople').onclick=()=>openModal('amigos'); $('mpChatBtn').onclick=mpOpenChat; $('mpMic').onclick=()=>vcSetMic(!MP.voice.mic);
addEventListener('keydown',e=>{ if(!MP.code||e.repeat) return; const t=e.target; if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA')) return; if(!$('modal').hidden||!$('mapOv').hidden) return;
  if(e.key==='Enter'||e.key==='t'||e.key==='T'){ if(['aim','swing'].includes(S.mode)&&e.key==='Enter') return; e.preventDefault(); e.stopImmediatePropagation(); mpOpenChat(); } });
function mpLink(){ const base=VGC.site||(location.origin+location.pathname); return base+(base.includes('?')?'&':'?')+'sala='+MP.code; }
async function mpInvite(){ if(!MP.code) return; const link=mpLink(); const txt='¡Vente a jugar conmigo a '+WP.T.invite+'! Sala '+mpPretty(MP.code)+': ';
  if(navigator.share&&isCoarse){ try{ await navigator.share({title:WP.T.gameTitle,text:txt,url:link}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
  try{ await navigator.clipboard.writeText(link); mpFeed('Enlace copiado. Pégalo en WhatsApp: '+link,'sys'); }catch(e){ mpFeed('Copia este enlace: '+link,'sys'); } }
function mpLayout(){
  const bar=$('mpBar'), feed=$('mpFeed'); const golfOn=!$('golf').hidden, hudOn=!$('hud').hidden;
  if(!bar.hidden){ let a=null; if(golfOn) a=!$('gExit').hidden?$('gExit'):$('wind'); else if(hudOn) a=$('mapBox'); if(a){ const r=a.getBoundingClientRect(); if(r.height>0) bar.style.top=Math.round(r.bottom+6)+'px'; } }
  let l=null; if(golfOn) l=$('holeCard'); else if(hudOn) l=$('status'); else if(!$('exploreHud').hidden) l=$('droneBar');
  if(l){ const r=l.getBoundingClientRect(); feed.style.top=Math.round(r.bottom+8)+'px'; } else feed.style.top='calc(10px + var(--st))';
}

/* ---- room UI: intro box, floating bar, Friends tab ---- */
const ICON_MIC='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const ICON_MICOFF='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" opacity=".45"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".45"/><path d="M4 4l16 16" stroke="#d6442a" stroke-width="2.4" stroke-linecap="round"/></svg>';
function mpStatusHTML(){ if(!MP.code) return ''; const up=mpUp(), n=MP.conns.length;
  if(MP.joining) return '<span class="mpst"><i></i>preparando…</span>';
  if(up===0) return '<span class="mpst bad"><i></i>conectando…</span>';
  return '<span class="mpst ok" title="Conectado a '+up+' de '+n+' servidores"><i></i>conectada'+(up<n?' ('+up+' de '+n+' servidores)':'')+'</span>'; }
function mpUI(force){
  mpIntroRender(force); mpBarRender();
  if(MP.panelOpen&&!$('modal').hidden) mpPanelRender(force);
}
function mpIntroRender(){
  const box=$('mpIntro'); if(!box) return;
  const names=[...MP.peers.values()].map(p=>p.n||'…');
  const sig=[MP_OK,MP.code,mpUp(),MP.joining,MP.err,names.join(',')].join('|'); if(sig===MP.introSig) return; MP.introSig=sig;
  if(!MP_OK){ box.innerHTML='<div class="lbl">Jugar con amigos</div><p class="note" style="margin:0">Para jugar con amigos abre el juego en <a href="'+SITE_URL+'" target="_blank" rel="noopener">'+SITE_TXT+'</a>.</p>'; return; }
  if(!MP.code){ box.innerHTML='<div class="lbl">Jugar con amigos</div><div class="row"><button class="btn small" id="mpCreate">Crear sala</button><input id="mpCodeIn" class="mpin" maxlength="7" placeholder="Código de sala" autocomplete="off" autocapitalize="characters" aria-label="Código de sala"><button class="btn small" id="mpJoinBtn">Unirme</button></div>'+(MP.err?'<p class="note bad" style="margin:0">'+esc(MP.err)+'</p>':'');
    $('mpCreate').onclick=()=>{ ensureAudio(); mpJoin(mpNewCode()).then(()=>{ if(MP.code) mpFeed('Sala creada. Pulsa Invitar para mandar el enlace.','sys'); }); };
    $('mpJoinBtn').onclick=()=>{ ensureAudio(); mpJoin($('mpCodeIn').value); };
    $('mpCodeIn').addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); mpJoin($('mpCodeIn').value); } }); return; }
  const n=names.length;
  box.innerHTML='<div class="lbl">Jugar con amigos</div><div class="mpline"><b>Sala '+mpPretty(MP.code)+'</b>'+mpStatusHTML()+'</div><div class="note">'+(n?('En la sala contigo: '+names.map(esc).join(', ')):'Aún no hay nadie más. Pulsa Invitar y manda el enlace.')+'</div>'+
    '<div class="row"><button class="btn small primary" id="mpInvite">Invitar</button><button class="btn small" id="mpTab">Amigos</button>'+(n?'<button class="btn small" id="mpPlaneAll">Avioneta para todos</button>':'')+'<button class="btn small" id="mpLeaveBtn">Salir de la sala</button></div>'+(MP.err?'<p class="note bad" style="margin:0">'+esc(MP.err)+'</p>':'');
  $('mpInvite').onclick=mpInvite; $('mpTab').onclick=()=>openModal('amigos'); $('mpLeaveBtn').onclick=()=>mpLeave(false); const pa=$('mpPlaneAll'); if(pa) pa.onclick=()=>{ S.name=$('pname').value.trim(); store.set('vg_name',S.name); mpCallPlane(); };
}
function mpBarRender(){
  const bar=$('mpBar'); const show=!!MP.code&&!['menu','loading','drone'].includes(S.mode); if(bar.hidden===show) bar.hidden=!show; if(!show) return;
  const n=MP.peers.size+1; const c=$('mpCount'); if(c.textContent!==String(n)) c.textContent=String(n);
  const up=mpUp(); bar.classList.toggle('off',up===0);
  const mb=$('mpMic'); mb.hidden=!VC_OK; mb.classList.toggle('on',MP.voice.mic); mb.classList.toggle('talk',MP.voice.mic&&MP.voice.level>0.035);
  const want=MP.voice.mic?ICON_MIC:ICON_MICOFF; if(mb.dataset.st!==String(MP.voice.mic)){ mb.innerHTML=want; mb.dataset.st=String(MP.voice.mic); mb.setAttribute('aria-label',MP.voice.mic?'Apagar micrófono':'Encender micrófono'); }
}
function mpDoing(c){ if(!c) return 'Conectando…'; if(c.aw) return 'Ausente (tiene el juego en segundo plano)';
  const m=c.m; if(m==='menu'||m==='loading') return 'En el menú de inicio'; if(m==='drone') return 'Mirando con la vista dron'; if(m==='plane') return 'En la avioneta'; if(m==='fall') return 'En caída libre'; if(m==='glide') return 'Planeando'; if(m==='drive') return 'Conduciendo un buggy';
  if(['aim','swing','flight','wait'].includes(m)&&c.h>=0&&W.HOLES[c.h]) return holeLabel(W.HOLES[c.h])+' · golpe '+(c.c+((m==='aim'||m==='swing')?1:0));
  if(c.iv!=null) return 'Dentro de una '+WP.T.house; if(c.sw) return 'Nadando'; if(c.h>=0&&W.HOLES[c.h]) return holeLabel(W.HOLES[c.h])+' · camino de su bola'; return WP.T.walking; }
function mpHowHTML(){ return '<ul><li><b>La sala</b> es un grupo privado: entra quien tiene el código o el enlace. Hasta 12 jugadores.</li><li><b>Mensajes:</b> posiciones, chat y tarjetas viajan por dos servidores públicos de mensajería (EMQX y HiveMQ) a la vez, por si uno falla. Van cifrados con el código de la sala: los servidores no pueden leerlos.</li><li><b>Voz:</b> va directa entre los navegadores (WebRTC). En algunas redes (4G de ciertas operadoras, wifi de empresa) la conexión directa no es posible: el resto del juego sigue funcionando.</li><li><b>Nada se guarda:</b> al cerrar la página sales de la sala. Tu tarjeta personal se queda en tu navegador.</li></ul>'; }
function mpPanelHTML(){
  return '<div id="mpRoomBox"></div><div id="mpMore">'+
    '<h3>Tu nombre</h3><div class="row"><input id="mpName" class="mpin wide" maxlength="14" placeholder="Tu nombre" autocomplete="off" value="'+esc(S.name)+'"><span class="note">Aparece encima de tu personaje</span></div>'+
    '<h3>En la sala</h3><div id="mpRoster" class="mproster"></div>'+
    '<h3>Voz</h3><div id="mpVoice"></div>'+
    '<h3>Avioneta para todos</h3><p>Llama a la avioneta y a los demás les sale un aviso para subir. Saltáis del mismo avión y cada uno cae donde quiere.</p><button class="btn small" id="mpPlane2">Llamar a la avioneta</button>'+
    '<h3>Tarjeta de la sala</h3><div id="mpCard"></div>'+
    '<h3>Chat</h3><div id="mpLog" class="mplog" aria-live="polite"></div><div class="row" style="margin-top:6px"><input id="mpChat2" class="mpin wide" maxlength="160" placeholder="Escribe a la sala…" autocomplete="off"><button class="btn small primary" id="mpSend2">Enviar</button></div>'+
    '</div><h3>Cómo funciona</h3>'+mpHowHTML();
}
function mpPanelWire(){
  MP.panelSig={}; mpPanelRender(true);
  const nm=$('mpName'); if(nm){ nm.addEventListener('keydown',e=>e.stopPropagation()); nm.addEventListener('change',()=>{ S.name=nm.value.trim().slice(0,14); store.set('vg_name',S.name); $('pname').value=S.name; if(MP.code) mpSend(mpHiMsg(true)); mpUI(true); }); }
  const pl=$('mpPlane2'); if(pl) pl.onclick=mpCallPlane;
  const ci=$('mpChat2'); if(ci){ ci.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); mpSay(ci.value); ci.value=''; } }); $('mpSend2').onclick=()=>{ mpSay(ci.value); ci.value=''; ci.focus(); }; }
  const log=$('mpLog'); if(log){ log.innerHTML=MP.chat.length?MP.chat.map(mpChatLine).join(''):'<div class="note">Aún no hay mensajes.</div>'; log.scrollTop=log.scrollHeight; }
  const ro=$('mpRoster'); if(ro) ro.addEventListener('click',e=>{ const b=e.target.closest('button[data-act]'); if(!b) return; const id=b.dataset.id;
    if(b.dataset.act==='go') mpGoTo(id); else if(b.dataset.act==='hole'){ const p=MP.peers.get(id); if(p&&p.cur&&p.cur.h>=0) mpPlayHole(p.cur.h); } });
}
function mpPanelRender(force){
  const sig=MP.panelSig||(MP.panelSig={});
  const rb=$('mpRoomBox'); if(!rb) return;
  const s1=[MP_OK,MP.code,mpUp(),MP.joining,MP.err].join('|');
  if(force||sig.room!==s1){ sig.room=s1;
    if(!MP.code){ rb.innerHTML='<p>Juega en '+WP.T.samePlace+' con tu familia o tus amigos, cada uno desde su móvil u ordenador: os veis moveros, cada uno juega su bola y compartís tarjeta, chat y voz.</p>'+
        (MP_OK?'<div class="row"><button class="btn primary" id="mpCreate2">Crear sala</button><input id="mpCode2" class="mpin" maxlength="7" placeholder="Código de sala" autocomplete="off" autocapitalize="characters" aria-label="Código de sala"><button class="btn" id="mpJoin2">Unirme</button></div>':'<p class="note">Para jugar con amigos abre el juego en <a href="'+SITE_URL+'" target="_blank" rel="noopener">'+SITE_TXT+'</a>.</p>')+(MP.err?'<p class="note bad">'+esc(MP.err)+'</p>':'');
      if(MP_OK){ $('mpCreate2').onclick=()=>{ ensureAudio(); mpJoin(mpNewCode()); }; const ci=$('mpCode2'); ci.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter') mpJoin(ci.value); }); $('mpJoin2').onclick=()=>mpJoin(ci.value); } }
    else { rb.innerHTML='<div class="mpline"><span class="lbl">Código de la sala</span>'+mpStatusHTML()+'</div><div class="mpcode">'+mpPretty(MP.code)+'</div>'+
        '<div class="row"><input class="mpin wide" id="mpLinkTxt" readonly value="'+esc(mpLink())+'" aria-label="Enlace de invitación"><button class="btn small primary" id="mpInvite2">'+(navigator.share&&isCoarse?'Compartir enlace':'Copiar enlace')+'</button><button class="btn small" id="mpLeave2">Salir de la sala</button></div>'+
        '<p class="note">Quien abra el enlace entra directamente; también puede escribir el código en «Unirme».</p>'+(MP.err?'<p class="note bad">'+esc(MP.err)+'</p>':'');
      $('mpInvite2').onclick=mpInvite; $('mpLeave2').onclick=()=>{ mpLeave(false); mpPanelRender(true); }; $('mpLinkTxt').onclick=e=>e.target.select(); }
    const more=$('mpMore'); if(more) more.hidden=!MP.code; }
  if(!MP.code) return;
  // roster
  const ro=$('mpRoster'); if(ro){ const me={n:mpName()+' (tú)',k:S.skin,cur:mpState(),mic:MP.voice.mic,level:MP.voice.level,me:true};
    const list=[me,...[...MP.peers.values()].sort((a,b)=>(a.dist||0)-(b.dist||0))];
    const html=list.map(p=>{ const c=p.cur; const st=mpDoing(c); const far=!p.me&&p.out&&c&&!OFFWORLD.includes(c.m)?' · a '+fmt(p.dist||0)+' m':'';
      const voice=p.mic?(p.me?' · micrófono abierto':(p.vstate==='failed'?' · voz: sin conexión directa':' · con micrófono')):'';
      const acts=p.me?'':('<button class="btn small" data-act="go" data-id="'+p.id+'"'+(c&&!OFFWORLD.includes(c.m)&&!['plane','fall','glide'].includes(c.m)?'':' disabled')+'>Ir</button>'+(c&&c.h>=0&&W.HOLES[c.h]?'<button class="btn small" data-act="hole" data-id="'+p.id+'">Jugar el '+(c.h+1)+'</button>':''));
      return '<div class="mprow'+(p.level>0.035?' talk':'')+'"><span class="dot" style="background:'+SKINS[p.k].shirt+'"></span><div class="who"><b>'+esc(p.n||'…')+'</b><span>'+esc(st)+far+voice+'</span></div><div class="acts">'+acts+'</div></div>'; }).join('');
    if(html!==sig.roster){ sig.roster=html; ro.innerHTML=html+(MP.peers.size?'':'<p class="note">Aún no hay nadie más en la sala. Manda el enlace con «Copiar enlace».</p>'); } }
  // voice
  const vb=$('mpVoice'); if(vb){ const s2=[VC_OK,MP.voice.mic,MP.voice.prox,MP.voice.err].join('|'); if(force||sig.voice!==s2){ sig.voice=s2;
      vb.innerHTML=VC_OK?('<div class="qual" style="font-size:13px">Micrófono <button id="vcOn" class="'+(MP.voice.mic?'on':'')+'">Abierto</button><button id="vcOff" class="'+(MP.voice.mic?'':'on')+'">Cerrado</button></div>'+
        '<div class="qual" style="font-size:13px;margin-top:6px">Voz por cercanía <button id="vpOn" class="'+(MP.voice.prox?'on':'')+'">Sí</button><button id="vpOff" class="'+(MP.voice.prox?'':'on')+'">No</button></div>'+
        '<p class="note" style="margin-top:6px">Con el micrófono abierto te oyen todos los de la sala. Con <b>voz por cercanía</b>, cada uno oye más fuerte a quien tiene cerca y deja de oír a quien está a más de 140 m; la voz suena además por el lado donde está esa persona. Usa auriculares para evitar eco. Botón rápido: el micrófono de la barra de la sala.</p>'+(MP.voice.err?'<p class="note bad">'+esc(MP.voice.err)+'</p>':''))
        :'<p class="note">Este navegador no permite chat de voz.</p>';
      if(VC_OK){ $('vcOn').onclick=()=>vcSetMic(true); $('vcOff').onclick=()=>vcSetMic(false); $('vpOn').onclick=()=>{ MP.voice.prox=true; store.set('vg_vprox','1'); mpUI(true); }; $('vpOff').onclick=()=>{ MP.voice.prox=false; store.set('vg_vprox','0'); mpUI(true); }; } } }
  // room scorecard laid out like a paper card: front nine and back nine, holes across, one row per player
  const cb=$('mpCard'); if(cb){ const players=[{n:mpName(),k:S.skin,sc:mpCardArr(),me:true},...MP.peers.values()];
    const s3=JSON.stringify(players.map(p=>[p.n,p.k,p.sc])); if(force||sig.card!==s3){ sig.card=s3;
      const cell=(s,par)=>{ if(!s) return '<span class="nd">·</span>'; const d=s-par; const cls=d<=-2?'e':d===-1?'b':d===0?'':d===1?'o':'o2'; return '<span class="sc '+cls+'">'+s+'</span>'; };
      const C=W.COURSES[S.course]||W.COURSES[0], CI=C.holes;
      const half=(a,b,label,last)=>{ const hs=CI.slice(a,b).map(i=>W.HOLES[i]); const parSum=hs.reduce((t,H)=>t+H.par,0);
        let h='<table class="card mp"><thead><tr><th class="nm">'+label+'</th>'+hs.map(H=>'<th>'+H.n+'</th>').join('')+'<th>'+(a?'Vuelta':'Ida')+'</th>'+(last?'<th>Total</th>':'')+'</tr></thead><tbody>';
        h+='<tr class="par"><td class="nm">Par</td>'+hs.map(H=>'<td>'+H.par+'</td>').join('')+'<td>'+parSum+'</td>'+(last?'<td>'+C.par+'</td>':'')+'</tr>';
        for(const p of players){ const sc=p.sc||[]; let sum=0,n=0; for(let q=a;q<b;q++){ const i=CI[q]; if(sc[i]){ sum+=sc[i]; n++; } }
          let tot='', all=0, alln=0, allpar=0; if(last){ CI.forEach(i=>{ const H=W.HOLES[i]; if(sc[i]){ all+=sc[i]; alln++; allpar+=H.par; } }); tot='<td><b>'+(alln?all:'—')+'</b>'+(alln?'<small>'+(all-allpar===0?'par':(all-allpar>0?'+':'')+(all-allpar))+'</small>':'')+'</td>'; }
          h+='<tr><td class="nm"><span class="dot" style="background:'+SKINS[p.k].shirt+'"></span>'+esc(p.n)+(p.me?' (tú)':'')+'</td>'+hs.map((H,k)=>'<td>'+cell(sc[CI[a+k]],H.par)+'</td>').join('')+'<td>'+(n?sum:'—')+'</td>'+tot+'</tr>'; }
        return '<div class="tablewrap">'+h+'</tbody></table></div>'; };
      cb.innerHTML=(W.MULTI?'<p style="margin:0 0 6px"><b>'+C.name+'</b> · cambia de recorrido en la pestaña Tarjeta</p>':'')+half(0,9,'Ida',false)+half(9,CI.length,'Vuelta',true)+
        '<p class="note" style="margin-top:8px">Una fila por jugador; cada columna es un hoyo con su par debajo del número. Ida y Vuelta suman los golpes de los hoyos jugados de cada mitad; Total suma toda la vuelta y, debajo, la diferencia con el par de esos hoyos. Círculo azul: birdie; azul relleno: eagle o mejor; cuadro dorado: bogey; dorado relleno: doble bogey o peor; punto: hoyo sin jugar.</p><div class="row"><button class="btn small" id="mpReset">Tarjeta nueva para todos</button></div>';
      $('mpReset').onclick=()=>{ clearCard(); mpSend({t:'reset',c:S.course}); mpFeed('Has empezado una tarjeta nueva; a los demás les llega la propuesta','sys'); mpUI(true); }; } }
}

/* ---- voice: WebRTC mesh signalled through the room ("perfect negotiation"), played through Web Audio ---- */
const RTC_CFG={iceServers:[{urls:['stun:stun.l.google.com:19302','stun:stun1.l.google.com:19302']},{urls:'stun:stun.cloudflare.com:3478'}]};
let vcBuf=null;
async function vcSetMic(on,quiet){
  const v=MP.voice;
  if(!VC_OK){ v.err='Este navegador no permite chat de voz.'; mpUI(true); return; }
  ensureAudio(); if(AC&&AC.state==='suspended') AC.resume().catch(()=>{});
  if(on){ if(v.mic) return; if(!MP.code){ v.err='Entra en una sala para hablar.'; mpUI(true); return; }
    try{ const st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      if(!MP.code){ st.getTracks().forEach(t=>t.stop()); return; }
      v.stream=st; v.mic=true; v.err='';
      if(AC){ try{ v.src=AC.createMediaStreamSource(st); v.an=AC.createAnalyser(); v.an.fftSize=512; v.src.connect(v.an); }catch(e){} }
      const tr=st.getAudioTracks()[0];
      for(const p of MP.peers.values()){ if(p.pc&&p.sender){ try{ await p.sender.replaceTrack(tr); }catch(e){} } else if(p.pc){ p.sender=p.pc.addTrack(tr,st); } else vcEnsure(p); }
      if(!quiet) mpFeed('Micrófono abierto: te oyen los de la sala','sys');
    }catch(e){ v.mic=false; v.err=e&&e.name==='NotAllowedError'?'El navegador no ha dado permiso al micrófono. Actívalo en el candado de la barra de direcciones y vuelve a probar.':'No se pudo abrir el micrófono ('+(e&&e.name||'error')+').'; if(!quiet) mpFeed(v.err,'sys'); } }
  else { v.mic=false; if(v.stream) v.stream.getTracks().forEach(t=>t.stop()); v.stream=null; if(v.src) try{ v.src.disconnect(); }catch(e){} v.src=null; v.an=null; v.level=0;
    for(const p of MP.peers.values()) if(p.sender) try{ await p.sender.replaceTrack(null); }catch(e){} }
  store.set('vg_mic',v.mic?'1':'0'); MP.lastKey=''; if(MP.code) mpSend(mpHiMsg(true)); mpUI(true);
}
function vcEnsure(p){
  if(!VC_OK||!MP.code) return null; if(p.pc&&p.pc.signalingState!=='closed') return p.pc;
  const pc=new RTCPeerConnection(RTC_CFG); p.pc=pc; p.polite=MP.id<p.id; p.makingOffer=false; p.ignoreOffer=false; p.sender=null; p.candQ=[]; p.vstate='new';
  pc.onicecandidate=e=>{ if(e.candidate) mpSend({t:'sig',to:p.id,c:e.candidate.toJSON()},p.id); };
  pc.onnegotiationneeded=async()=>{ try{ p.makingOffer=true; await pc.setLocalDescription(); mpSend({t:'sig',to:p.id,d:{type:pc.localDescription.type,sdp:pc.localDescription.sdp}},p.id); }catch(e){ console.warn('voz:',e); } finally{ p.makingOffer=false; } };
  pc.ontrack=e=>vcAttach(p,(e.streams&&e.streams[0])||new MediaStream([e.track]));
  pc.onconnectionstatechange=()=>{ p.vstate=pc.connectionState; if(pc.connectionState==='failed'&&pc.restartIce) try{ pc.restartIce(); }catch(e){} mpUI(true); };
  if(MP.voice.stream){ const tr=MP.voice.stream.getAudioTracks()[0]; if(tr) p.sender=pc.addTrack(tr,MP.voice.stream); }
  return pc;
}
async function vcSignal(p,o){
  if(!VC_OK) return; const pc=vcEnsure(p); if(!pc) return;
  if(o.d&&typeof o.d.type==='string'&&typeof o.d.sdp==='string'){ const desc=o.d; if(desc.type==='answer'&&pc.signalingState==='stable') return; // a late duplicate answer
    const collision=desc.type==='offer'&&(p.makingOffer||pc.signalingState!=='stable'); p.ignoreOffer=!p.polite&&collision; if(p.ignoreOffer) return;
    await pc.setRemoteDescription(desc); for(const c of p.candQ.splice(0)) try{ await pc.addIceCandidate(c); }catch(e){}
    if(desc.type==='offer'){ await pc.setLocalDescription(); mpSend({t:'sig',to:p.id,d:{type:pc.localDescription.type,sdp:pc.localDescription.sdp}},p.id); } }
  else if(o.c){ if(!pc.remoteDescription){ p.candQ.push(o.c); return; } try{ await pc.addIceCandidate(o.c); }catch(e){ if(!p.ignoreOffer) console.warn('voz:',e); } }
}
function vcAttach(p,stream){
  ensureAudio(); p.vstream=stream;
  if(!p.audioEl){ const a=document.createElement('audio'); a.autoplay=true; a.setAttribute('playsinline',''); document.body.appendChild(a); p.audioEl=a; }
  p.audioEl.srcObject=stream;
  if(AC){ p.audioEl.muted=true; // Chrome only feeds a remote stream to Web Audio while it is also attached to a media element
    try{ if(p.vsrc) p.vsrc.disconnect(); p.vsrc=AC.createMediaStreamSource(stream);
      if(!p.vgain){ p.vgain=AC.createGain(); p.van=AC.createAnalyser(); p.van.fftSize=512; p.vpan=AC.createStereoPanner?AC.createStereoPanner():null; if(p.vpan){ p.vgain.connect(p.vpan); p.vpan.connect(AC.destination); } else p.vgain.connect(AC.destination); }
      p.vsrc.connect(p.vgain); p.vsrc.connect(p.van); }catch(e){ p.audioEl.muted=false; } }
  p.audioEl.play().catch(()=>{});
}
function vcClose(p){ try{ if(p.pc) p.pc.close(); }catch(e){} p.pc=null; p.sender=null; if(p.audioEl){ p.audioEl.srcObject=null; p.audioEl.remove(); p.audioEl=null; } for(const n of [p.vsrc,p.vgain,p.vpan]) if(n) try{ n.disconnect(); }catch(e){} p.vsrc=p.vgain=p.vpan=p.van=null; p.level=0; }
function vcLevel(an){ const a=vcBuf||(vcBuf=new Uint8Array(512)); an.getByteTimeDomainData(a); let s=0; for(let i=0;i<a.length;i++){ const x=(a[i]-128)/128; s+=x*x; } return Math.sqrt(s/a.length); }
function vcTick(){ const v=MP.voice; v.level=v.an?vcLevel(v.an):0;
  const cx=camera.position.x, cz=camera.position.z, cyaw=Math.atan2(camLook.z-cz,camLook.x-cx);
  for(const p of MP.peers.values()){ p.level=p.van?vcLevel(p.van):0;
    if(p.vgain&&AC){ let g=1; if(v.prox){ const d=p.dist||0; g=d<12?1:d>140?0:1-(d-12)/128; } p.vgain.gain.setTargetAtTime(g,AC.currentTime,0.12);
      if(p.vpan&&p.out){ const rel=Math.atan2(p.out.z-cz,p.out.x-cx)-cyaw; p.vpan.pan.setTargetAtTime(v.prox?clamp(Math.sin(rel),-1,1)*0.65:0,AC.currentTime,0.12); } } } }

/* ---- the 10 Hz network tick ---- */
function mpTick(){
  if(!MP.code) return; const now=performance.now();
  // after a stall (busy main thread, tab in the background) give everyone a few seconds before calling them gone
  const gap=now-(MP.lastTick||now); MP.lastTick=now; if(gap>2000) for(const p of MP.peers.values()) p.last=Math.max(p.last,now-4000);
  if(!MP.everUp&&!MP.joining&&!MP.err&&now-(MP.joinT||now)>12000&&mpUp()===0){ MP.err='No se puede conectar con los servidores de salas desde aquí. Comprueba la conexión o abre el juego en '+SITE_TXT+'. Sigo intentándolo.'; mpUI(true); }
  if(mpUp()&&S.mode!=='loading'){ const st=mpState(); const key=JSON.stringify(st); if(key!==MP.lastKey||now-MP.lastSent>2000){ MP.lastKey=key; MP.lastSent=now; mpSend(st); } }
  for(const p of [...MP.peers.values()]){ const lim=(p.cur&&p.cur.aw)?150000:10000; if(now-p.last>lim) mpDropPeer(p,'se ha desconectado'); }
  vcTick(); mpBarRender(); mpLayout();
  if(++MP.uiT%10===0) mpUI();
}
setInterval(mpTick,100);
document.addEventListener('visibilitychange',()=>{ if(MP.code){ MP.lastKey=''; mpTick(); } });
addEventListener('pagehide',()=>{ if(MP.code&&MP.byePl) for(const c of MP.conns) c.pub(MP.topic+'/r',MP.byePl); });
addEventListener('pointerdown',()=>{ if(AC&&AC.state==='suspended') AC.resume().catch(()=>{}); },true);
function mpHello(){ if(MP.code&&MP.key) mpSend(mpHiMsg(true)); }
$('pname').addEventListener('change',()=>{ S.name=$('pname').value.trim().slice(0,14); store.set('vg_name',S.name); mpHello(); MP.introSig=''; mpUI(); });
function mpInit(){
  buggies.forEach(b=>{ b.home=[b.x,b.z,b.yaw]; });
  const code=mpNorm(MPQ.get('sala')||'');
  mpUI(true);
  if(code) mpJoin(code);
}
