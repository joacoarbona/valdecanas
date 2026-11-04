
/* ================= music: four stations composed live in the browser (no recordings, no copyright) ================= */
// Each station is a short chord loop plus voices built from oscillators and noise, scheduled a quarter of a second ahead.
// It goes through the master gain, so «Sonido: no» silences it too.
const MUS={st:store.get('vg_mus')||'off',vol:clamp(+(store.get('vg_musv')||60),0,100),g:null,next:0,step:0,timer:null};
const MUS_ST=[['off','No','Sin música'],['paseo','Paseo','Paseo tranquilo'],['guitarra','Guitarra','Guitarra española'],['arcade','Arcade','Arcade'],['noche','Noche','Noche']];
if(!MUS_ST.some(s=>s[0]===MUS.st)) MUS.st='off';
function musF(m){ return 440*Math.pow(2,(m-69)/12); }
function musOut(){ return MUS.g; }
function musTone(t,m,dur,type,vol,att,filt){ const o=AC.createOscillator(); o.type=type; o.frequency.value=musF(m); const g=AC.createGain();
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+att); g.gain.exponentialRampToValueAtTime(0.0001,t+att+dur);
  let n=o; if(filt){ const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=filt; o.connect(f); n=f; } n.connect(g); g.connect(musOut()); o.start(t); o.stop(t+att+dur+0.05); }
// plucked string: a bright sawtooth whose low-pass closes quickly, like a nylon guitar string
function musPluck(t,m,vol,len){ const o=AC.createOscillator(); o.type='sawtooth'; o.frequency.value=musF(m); const f=AC.createBiquadFilter(); f.type='lowpass'; f.Q.value=2;
  f.frequency.setValueAtTime(Math.min(6000,musF(m)*7),t); f.frequency.exponentialRampToValueAtTime(Math.max(180,musF(m)*1.2),t+0.35);
  const g=AC.createGain(); g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.003); g.gain.exponentialRampToValueAtTime(0.0001,t+(len||1.1));
  o.connect(f); f.connect(g); g.connect(musOut()); o.start(t); o.stop(t+(len||1.1)+0.05); }
function musNoise(t,dur,vol,freq,type){ if(!noiseBuf) return; const s=AC.createBufferSource(); s.buffer=noiseBuf; const f=AC.createBiquadFilter(); f.type=type||'highpass'; f.frequency.value=freq;
  const g=AC.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(f); f.connect(g); g.connect(musOut()); s.start(t,Math.random()*1.5); s.stop(t+dur+0.05); }
function musKick(t,vol){ const o=AC.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(42,t+0.13);
  const g=AC.createGain(); g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0001,t+0.28); o.connect(g); g.connect(musOut()); o.start(t); o.stop(t+0.3); }
const musPick=a=>a[(Math.random()*a.length)|0];
// chords as MIDI notes; step = one eighth or one sixteenth note, see div
const MUS_DEF={
  // C – Am – F – G, soft pad, walking bass and a pentatonic melody
  paseo:{bpm:78,div:2,len:8,ch:[[48,60,64,67],[45,57,60,64],[41,57,60,65],[43,55,59,62]],mel:[72,74,76,79,81,84],
    play(i,t,sp){ const b=(i/8|0)%4, k=i%8, C=this.ch[b];
      if(k===0){ for(const n of C.slice(1)) musTone(t,n,sp*7.5,'triangle',0.035,0.25,1400); musTone(t,C[0],sp*3.5,'sine',0.09,0.02); }
      if(k===4) musTone(t,C[0]+7,sp*3.5,'sine',0.07,0.02);
      if(Math.random()<(k%2?0.3:0.6)){ this.m=this.m||76; let j=this.mel.indexOf(this.m)+musPick([-1,-1,0,1,1,2,-2]); j=clamp(j,0,this.mel.length-1); this.m=this.mel[j]; musTone(t,this.m,sp*1.6,'sine',0.05,0.01); musTone(t,this.m+12,sp*0.8,'sine',0.012,0.01); } }},
  // Andalusian cadence Am – G – F – E: bass on the beat, rasgueado on 2 and 4, picado in A Phrygian on top
  guitarra:{bpm:104,div:4,len:16,ch:[[45,57,60,64],[43,55,59,62],[41,57,60,65],[40,56,59,64]],mel:[69,70,72,73,74,76,77,79,81],
    play(i,t,sp){ const b=(i/16|0)%4, k=i%16, C=this.ch[b];
      if(k===0||k===8) musPluck(t,C[0],0.11,1.4);
      if(k===4||k===12){ C.slice(1).concat([C[1]+12]).forEach((n,j)=>musPluck(t+j*0.018,n,0.05,0.8)); musNoise(t,0.05,0.035,1800,'bandpass'); }
      if(k===2||k===6||k===10||k===14) musPluck(t,musPick(C.slice(1))+12,0.04,0.6);
      if(b>=2&&k%2===0&&Math.random()<0.55){ const sc=b===3?[68,69,71,72,74,76]:this.mel; this.m=musPick(sc); musPluck(t,this.m,0.055,0.7); } }},
  // Am – F – C – G chiptune: square arpeggio, pulsing bass, kick, snare and hi-hat
  arcade:{bpm:142,div:4,len:16,ch:[[57,60,64,69],[53,57,60,65],[48,55,60,64],[55,59,62,67]],
    play(i,t,sp){ const b=(i/16|0)%4, k=i%16, C=this.ch[b];
      musTone(t,C[k%4]+12,sp*0.8,'square',0.022,0.003,3200);
      if(k%2===0) musTone(t,C[0]-12+(k%4?12:0),sp*1.6,'square',0.04,0.003,900);
      if(k===0||k===8||k===10) musKick(t,0.28); if(k===4||k===12) musNoise(t,0.12,0.11,1200); if(k%2===1) musNoise(t,0.03,0.035,7000);
      if(k%4===0&&Math.random()<0.7){ this.m=musPick([69,72,74,76,79,81]); musTone(t,this.m+12,sp*3,'square',0.02,0.003,4200); } }},
  // Dm9 – Bbmaj7 – Fmaj7 – C: slow pads and sparse bells, for the night
  noche:{bpm:56,div:2,len:8,ch:[[38,57,60,64],[34,53,57,62],[41,57,60,64],[36,55,59,62]],
    play(i,t,sp){ const b=(i/8|0)%4, k=i%8, C=this.ch[b];
      if(k===0){ for(const n of C.slice(1)) musTone(t,n,sp*7,'sine',0.03,1.4); musTone(t,C[0],sp*7,'sine',0.06,0.8,500); }
      if(Math.random()<0.22){ const n=musPick(C.slice(1))+24; musTone(t,n,1.8,'sine',0.028,0.005); musTone(t+sp*0.02,n+19,1.2,'sine',0.006,0.005); } }}
};
function musEnsure(){ ensureAudio(); if(!AC) return false; if(!MUS.g){ MUS.g=AC.createGain(); MUS.g.gain.value=0; const c=AC.createDynamicsCompressor(); c.threshold.value=-18; c.ratio.value=4; MUS.g.connect(c); c.connect(master); } return true; }
function musGain(){ if(!MUS.g||!AC) return; const on=MUS.st!=='off'&&!document.hidden; MUS.g.gain.setTargetAtTime(on?(MUS.vol/100)*0.7:0,AC.currentTime,0.35); }
function musTick(){ if(!AC||!MUS.g||MUS.st==='off'||AC.state!=='running') return; const D=MUS_DEF[MUS.st]; if(!D) return; const sp=60/D.bpm/D.div;
  if(MUS.next<AC.currentTime-0.5) MUS.next=AC.currentTime+0.05;
  while(MUS.next<AC.currentTime+0.3){ try{ D.play(MUS.step,MUS.next,sp); }catch(e){} MUS.next+=sp; MUS.step++; } }
function musSet(st){ if(!MUS_DEF[st]) st='off'; const ch=st!==MUS.st; MUS.st=st; store.set('vg_mus',st);
  if(st!=='off'&&musEnsure()){ if(ch||!MUS.timer){ MUS.step=0; MUS.next=AC.currentTime+0.12; } if(!MUS.timer) MUS.timer=setInterval(musTick,80); }
  musGain(); musUI(); }
function musVol(v){ MUS.vol=clamp(v|0,0,100); store.set('vg_musv',String(MUS.vol)); musGain(); }
function musLabel(){ return (MUS_ST.find(s=>s[0]===MUS.st)||MUS_ST[0])[1]; }
function musUI(){ document.querySelectorAll('#musRow button').forEach(b=>b.classList.toggle('on',b.dataset.mus===MUS.st)); const mb=$('mMusic'); if(mb) mb.textContent='Música: '+musLabel().toLowerCase(); }
function musMenuHTML(){ return '<button class="btn small" id="mMusic">Música: '+musLabel().toLowerCase()+'</button><label class="musvol">Volumen <input type="range" id="mMusVol" min="0" max="100" step="5" value="'+MUS.vol+'" aria-label="Volumen de la música"></label>'; }
function musMenuBind(){ const b=$('mMusic'); if(!b) return; b.onclick=()=>{ const i=MUS_ST.findIndex(s=>s[0]===MUS.st); musSet(MUS_ST[(i+1)%MUS_ST.length][0]); };
  const r=$('mMusVol'); r.oninput=()=>{ musVol(+r.value); if(MUS.st==='off') musSet('paseo'); }; }
{ const row=$('musRow'); if(row){ row.insertAdjacentHTML('beforeend',MUS_ST.map(s=>'<button data-mus="'+s[0]+'" title="'+s[2]+'">'+s[1]+'</button>').join('')); row.querySelectorAll('button').forEach(b=>b.onclick=()=>musSet(b.dataset.mus)); musUI(); } }
document.addEventListener('visibilitychange',musGain);
// browsers only start audio after a tap: a saved station starts with the first one
if(MUS.st!=='off') addEventListener('pointerdown',function f(){ removeEventListener('pointerdown',f); musSet(MUS.st); },{once:true});

/* ================= passengers: ride with a friend (pillion on the horse, the other seat of the buggy or car, behind on the jet ski or boat) ================= */
// The driver steers; the passenger only looks around. A friend's boat also offers to water-ski behind it (SKI.tow in g3s.js).
const PAS={pid:null,kind:'',name:'',q:null,ask:null};
// a friend's vehicle as a pose: kind 'drive' (buggy or car), 'ride' (horse) or 'jet' (jet ski or boat), from their interpolated state
function pasPeerVeh(p){ const s=p&&p.out; if(!s) return null;
  if(s.m==='drive'&&buggies[s.d]) return {kind:'drive',cp:!!s.cp,v:{x:s.x,y:s.y,z:s.z,yaw:s.yaw,type:buggies[s.d].type||'',pitch:0}};
  if(s.m==='ride'&&HORSES[s.hz]&&p.hm) return {kind:'ride',v:{x:s.x,y:s.y,z:s.z,yaw:s.yaw,g:p.hm,spd:s.spd||0,ph:0}};
  if(s.m==='jet'&&JET.list[s.j]){ const ty=JET.list[s.j].type||'jet'; if(ty==='jet'||ty==='boat') return {kind:'jet',v:{x:s.x,y:s.y-0.42,z:s.z,yaw:s.yaw,type:ty}}; }
  return null; }
// our own vehicle, when a friend rides with us
function pasMyVeh(){ const m=S.mode; if(m==='drive'&&P.buggy) return {kind:'drive',v:P.buggy}; if(m==='ride'&&P.horse) return {kind:'ride',v:P.horse};
  if(m==='jet'&&P.jet&&!WCR[P.jet.type||'jet'].sail) return {kind:'jet',v:P.jet}; return null; }
// the passenger seat: the other side of the car or buggy, behind the rider on the horse, behind the driver on the water
function pasSeat(q){ const v=q.v, c=Math.cos(v.yaw), s=Math.sin(v.yaw);
  if(q.kind==='drive'){ const d=seatPos(v); const lx=-s, lz=c; const lat=(d[0]-v.x)*lx+(d[2]-v.z)*lz; const m=Math.abs(lat)<0.15?-0.7:2*lat; return [d[0]-m*lx,d[1],d[2]-m*lz]; }
  if(q.kind==='ride'){ const d=horseSeat(v); return [d[0]-c*0.55,d[1]+0.05,d[2]-s*0.55]; }
  const boat=v.type==='boat', back=boat?1.7:0.95, up=boat?0.62:0.55, side=boat?-0.42:0; return [v.x-c*back+s*side,v.y+up,v.z-s*back-c*side]; }
function pasPose(R,q){ if(q.kind==='ride'){ riderPose(R,q.v); } else { poseRig(R,'drive',T,0); R.root.rotation.set(0,-q.v.yaw,0); } const p=pasSeat(q); R.root.position.set(p[0],p[1],p[2]); }
function pasSeatTaken(p){ for(const o of MP.peers.values()) if(o!==p&&o.out&&o.out.m==='pas'&&o.out.rd===p.id) return true; return false; }
// the nearest friend's vehicle we can get on (walk or swim up to it)
function pasNear(){ if(!MP.code||S.mode!=='walk'||S.interior) return null; let best=null, bd=1e9;
  for(const p of MP.peers.values()){ const q=pasPeerVeh(p); if(!q||(q.kind==='drive'&&q.cp)||pasSeatTaken(p)) continue;
    const lim=q.kind==='jet'?(q.v.type==='boat'?7:5):q.kind==='ride'?3.6:4.5; const d=Math.hypot(P.x-q.v.x,P.z-q.v.z); if(d<lim&&d<bd){ bd=d; best={p,q}; } }
  if(!best) return null; const n=best.p.n||'tu amigo';
  best.label=best.q.kind==='jet'&&best.q.v.type==='boat'?'Lancha de '+n:'Subir con '+n; return best; }
function pasBoard(b){ if(!b) return; if(b.q.kind==='jet'&&b.q.v.type==='boat'&&SKI.skis){ pasAsk(b); return; } pasStart(b.p,b.q.kind); }
function pasAsk(b){ PAS.ask=b; const n=esc(b.p.n||'Tu amigo'); $('pasPromptTxt').innerHTML='<b>'+n+'</b> va en lancha. ¿Te subes con él o esquías detrás?'; $('pasPrompt').hidden=false; }
function pasAskClose(){ PAS.ask=null; $('pasPrompt').hidden=true; }
$('pasRide').onclick=()=>{ const b=PAS.ask; pasAskClose(); if(b&&MP.peers.get(b.p.id)) pasStart(b.p,'jet'); };
$('pasSki').onclick=()=>{ const b=PAS.ask; pasAskClose(); if(b&&MP.peers.get(b.p.id)) skiTowStart(b.p); };
$('pasNo').onclick=pasAskClose;
function pasStart(p,kind){ PAS.pid=p.id; PAS.kind=kind; PAS.name=p.n||'Tu amigo'; PAS.q=null; P.swim=false; P.vx=P.vy=P.vz=0; setMode('pas'); S.snap=true;
  const what=kind==='ride'?'a la grupa de su caballo':kind==='jet'?'en su '+(pasPeerVeh(p)?.v.type==='boat'?'lancha':'moto de agua'):'en su '+(pasPeerVeh(p)?.v.type?'coche':'buggy');
  tip('Vas '+what+': '+PAS.name+' conduce y tú miras. Arrastra para mirar; Acción o Saltar para bajarte',5200); }
function pasStep(dt){ const p=MP.peers.get(PAS.pid); if(!p||!MP.code){ pasOff(PAS.name+' ya no está en la sala'); return; }
  mpInterp(p,Date.now()); const q=pasPeerVeh(p); if(!q||q.kind!==PAS.kind){ pasOff(PAS.name+' se ha bajado'); return; }
  PAS.q=q; const st=pasSeat(q); P.x=st[0]; P.y=st[1]; P.z=st[2]; P.yaw=q.v.yaw; P.vx=P.vy=P.vz=0; P.onGround=true; P.swim=false;
  if(performance.now()-camS.lastLook>1500) camS.yaw=lerpAng(camS.yaw,q.v.yaw,1-Math.exp(-dt*1.5));
  if(inp.jumpQ){ inp.jumpQ=false; pasOff(); } }
function pasOff(msg){ if(S.mode!=='pas') return; const q=PAS.q; let x=P.x, z=P.z;
  if(q){ const c=Math.cos(q.v.yaw), s=Math.sin(q.v.yaw); const lat=(P.x-q.v.x)*(-s)+(P.z-q.v.z)*c; const sg=lat>=0?1:-1; const d=q.kind==='jet'?2.2:1.5; x+=(-s)*sg*d; z+=c*sg*d; }
  pasLand(x,z); PAS.pid=null; PAS.q=null; setMode('walk'); if(msg) tip(msg,3200); }
// put us down at x, z: on the ground, or swimming when the water is deep there
function pasLand(x,z){ const g=terrainAt(x,z), wl=W.waterLevel(x,z); P.x=x; P.z=z; P.vx=P.vy=P.vz=0; if(g<wl-1.15){ P.y=wl-1.25; P.swim=true; P.onGround=false; } else { P.y=Math.max(g,wl)+0.05; P.swim=false; } }
// a friend riding with us, or with someone else, drawn on their seat
function pasDrawPeer(p,s,R){ let q=null; if(s.rd===MP.id) q=pasMyVeh(); else { const h=MP.peers.get(s.rd); if(h) q=pasPeerVeh(h); }
  if(q&&q.kind===s.rk) pasPose(R,q); }

/* ---- water-skiing behind a friend's boat: the friend drives, we cross the wake to jump ---- */
function skiTowStart(p){ if(!SKI.skis) return; fadeTo(()=>{ SKI.tow=p.id; SKI.towEnd=false; SKI.towN=p.n||'Tu amigo'; SKI.slow=0; SKI.on=true; SKI.off=0; SKI.voff=0; SKI.air=0; SKI.jumps=0; SKI.y=0; P.swim=false;
  setMode('ski'); SKI.skis.visible=true; SKI.rope.visible=true; if(p.out) camS.yaw=p.out.yaw; S.snap=true;
  tip('Esquías detrás de la lancha de '+SKI.towN+'. Joystick a los lados: te abres o cruzas la estela para saltar. Acción: soltar la cuerda',5200); }); }
function skiTowStep(dt){ if(SKI.towEnd) return; const p=MP.peers.get(SKI.tow); if(p) mpInterp(p,Date.now()); const q=p&&pasPeerVeh(p);
  if(!q||q.kind!=='jet'||q.v.type!=='boat'){ const n=SKI.towN; SKI.towEnd=true; stopSki(); tip(n+' ha dejado la lancha: sueltas la cuerda',3200); return; }
  const v=q.v, c=Math.cos(v.yaw), s=Math.sin(v.yaw); SKI.bx=v.x; SKI.bz=v.z; SKI.byaw=v.yaw;
  SKI.slow=(p.out.spd||0)<1.2?SKI.slow+dt:0; if(SKI.slow>4){ SKI.towEnd=true; stopSki(); tip('La lancha se ha parado: sueltas la cuerda',3200); return; }
  const tgt=clamp(inp.mx,-1,1)*13; const acc=(tgt-SKI.off)*2.2-SKI.voff*1.6; SKI.voff+=acc*dt; const prev=SKI.off; SKI.off=clamp(SKI.off+SKI.voff*dt,-15,15);
  if(!SKI.air&&Math.sign(prev)!==Math.sign(SKI.off)&&Math.abs(SKI.voff)>3.2){ SKI.air=1; SKI.vy=2.4+Math.min(3,Math.abs(SKI.voff)*0.28); SKI.jumps++; blip('jump'); }
  if(SKI.air){ SKI.y+=SKI.vy*dt; SKI.vy-=9.81*dt; if(SKI.y<=0){ SKI.y=0; SKI.air=0; startSplash(P.x,P.z,W.waterLevel(P.x,P.z)); } }
  const x=v.x-c*SKI.rope_+(-s)*SKI.off, z=v.z-s*SKI.rope_+c*SKI.off, yaw=v.yaw+SKI.voff*0.03;
  const wl=W.waterLevel(x,z); P.x=x; P.z=z; P.y=wl+0.06+SKI.y; P.yaw=yaw; SKI.skis.position.set(x,wl+0.04+SKI.y,z); SKI.skis.rotation.set(0,-yaw,0);
  if(performance.now()-camS.lastLook>900) camS.yaw=lerpAng(camS.yaw,yaw,1-Math.exp(-dt*2.5));
  const a=SKI.rope.geometry.attributes.position.array; a.set([v.x-c*2.4,W.waterLevel(v.x,v.z)+1.5,v.z-s*2.4,x+Math.cos(yaw)*0.55,P.y+1.05,z+Math.sin(yaw)*0.55]); SKI.rope.geometry.attributes.position.needsUpdate=true; }
// where a towed friend's rope starts: the boat of whoever pulls them, as we see it
function skiTowBoat(s){ if(s.rd===MP.id&&S.mode==='jet'&&P.jet) return [P.jet.x,P.jet.z,P.jet.yaw]; const h=MP.peers.get(s.rd); if(h&&h.out&&h.out.m==='jet') return [h.out.x,h.out.z,h.out.yaw]; return null; }
