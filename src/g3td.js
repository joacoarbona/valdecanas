/* ================= Sedbergh uniforms (Casterton: WP.uniform) and the topdorm room (WP.topdorm) =================
   Uniforms: own designs in the school's real colours, no crest: everyday (navy blazer, white shirt, navy V-neck jumper,
   red tartan skirt or grey trousers), coat, hockey and rugby (Sedbergh's brown shirt). Friends in the room see them (state
   `un`). Topdorm: a private room for 8. Its 4 fixed profiles (names and portrait features) travel in the page only encrypted
   with the room password (PBKDF2 + AES-GCM, tools/td_pack.mjs); the room key also comes from the password. The other 4 places
   are made on the device. Portraits are painted in code, in watercolour style: no photos anywhere. */
const UN_NAVY='#1c2436', UN_BROWN='#6b4428', UN_GREY='#4b4e54';
const UN_DEF=[
  {k:'',n:'Mi ropa',ic:'👕',d:'Tu ropa de siempre, con lo que hayas comprado en la tienda.'},
  {k:'diario',n:'Uniforme',ic:'🎒',d:'Blazer azul marino, camisa blanca, jersey de pico azul marino y falda de tartán rojo (o pantalón gris), medias y zapatos negros.'},
  {k:'abrigo',n:'Abrigo',ic:'🧥',d:'Abrigo azul marino largo, con botones y bufanda de tartán, encima del uniforme.'},
  {k:'hockey',n:'Hockey',ic:'🏑',d:'Camiseta marrón del colegio, falda pantalón azul marino (o pantalón corto), medias marrones con espinilleras y el stick a la espalda.'},
  {k:'rugby',n:'Rugby',ic:'🏉',d:'Camiseta marrón con cuello blanco, pantalón corto blanco y medias marrones con la vuelta blanca.'}];
var UN={i:1,ul:0,tex:null};
function unLoad(){ if(!WP.uniform) return; try{ const o=JSON.parse(store.get(WP.key+'_uni')||'null'); if(o){ UN.i=clamp(o.i|0,0,4); UN.ul=o.ul?1:0; } }catch(e){} }
function unSave(){ store.set(WP.key+'_uni',JSON.stringify({i:UN.i,ul:UN.ul})); }
function unCode(){ return WP.uniform&&UN&&UN.i?UN.i+8*UN.ul:0; }
// colours first (buildRig paints with them), then unDress adds the pieces; a Halloween costume wins
function unApply(sk,code){ code=code|0; const i=code&7; if(!WP.uniform||i<1||i>4||!sk||sk.cos) return sk;
  const k=UN_DEF[i].k, ul=(code>>3)&1, o=Object.assign({},sk,{uni:k,ul,cap:null,hat:''});
  if(k==='diario'||k==='abrigo') Object.assign(o,{shirt:k==='abrigo'?'#192132':UN_NAVY,top:'manga',pt:'largo',pants:ul?UN_GREY:'#1a1d27',shoe:'#131313'});
  else if(k==='hockey') Object.assign(o,{shirt:UN_BROWN,top:'polo',pt:'corto',pants:UN_NAVY,shoe:'#22272e'});
  else Object.assign(o,{shirt:UN_BROWN,top:'polo',pt:'corto',pants:'#f1f0ea',shoe:'#151515',ul:1});
  return o; }
function unTartan(){ if(UN.tex) return UN.tex; const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d');
  g.fillStyle='#b4232c'; g.fillRect(0,0,128,128);
  const band=(p,w,col,a)=>{ g.globalAlpha=a; g.fillStyle=col; g.fillRect(p,0,w,128); g.fillRect(0,p,128,w); };
  band(8,26,'#173324',0.5); band(72,26,'#173324',0.5); band(50,7,'#101218',0.55); band(114,7,'#101218',0.55); band(40,2,'#f0e2a8',0.45); band(104,2,'#f0e2a8',0.45);
  g.globalAlpha=0.1; for(let y=0;y<128;y+=2){ g.fillStyle=(y%4)?'#000':'#fff'; g.fillRect(0,y,128,1); }
  g.globalAlpha=1; const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(3,1.4); UN.tex=t; return t; }
// open cone with pleats (alternate radial vertices out and in, more at the hem)
function unSkirtGeo(rt,rb,h,pl){ const n=24, g=new THREE.CylinderGeometry(rt,rb,h,n,1,true), p=g.attributes.position;
  for(let i=0;i<p.count;i++){ const j=i%(n+1), t=(h/2-p.getY(i))/h, f=1+((j%2)?pl:-pl*0.5)*(0.35+t); p.setX(i,p.getX(i)*f); p.setZ(i,p.getZ(i)*f); }
  g.computeVertexNormals(); return g; }
function unDress(R,sk){ const k=sk.uni, ul=sk.ul, T=R.torso, B=R.body, mS=R.headG.children[0].material, cK=sk.chest||1, lK=sk.leg||1;
  const M=(c,two)=>new THREE.MeshLambertMaterial({color:Cc(c),side:two?THREE.DoubleSide:THREE.FrontSide}), Mt=()=>new THREE.MeshLambertMaterial({map:unTartan(),side:THREE.DoubleSide});
  const add=(par,geo,mat,x,y,z,rx,ry,rz)=>{ const m=new THREE.Mesh(geo,mat); m.position.set(x,y,z); m.rotation.set(rx||0,ry||0,rz||0); par.add(m); return m; };
  const fx=0.155*cK;
  if(k==='diario'||k==='abrigo'){ const Wm=M('#f7f7f3',true);
    for(const s of [-1,1]) add(T,new THREE.BoxGeometry(0.014,0.05,0.06),Wm,0.085,0.575,s*0.045,s*0.55,0,0);
    const v=new THREE.Shape(); v.moveTo(-0.042,0); v.lineTo(0.042,0); v.lineTo(0,-0.1); v.lineTo(-0.042,0);
    add(T,new THREE.ShapeGeometry(v),Wm,fx+0.006,0.545,0,0,Math.PI/2,0);
    add(T,new THREE.BoxGeometry(0.006,0.012,0.034),M('#f2c230'),fx+0.004,0.43,-0.075); add(T,new THREE.BoxGeometry(0.006,0.012,0.034),M('#2f6bd6'),fx+0.004,0.418,-0.075);
    if(k==='diario'){ const hem=add(B,unSkirtGeo(0.19,0.21,0.14,0),M(sk.shirt,true),0,0.02,0); hem.scale.set(0.8,1,1); }
    if(!ul){ const kt=add(B,unSkirtGeo(0.185,0.25,0.46,0.05),Mt(),0,-0.19,0); kt.scale.set(0.74,1,1.02); }
    if(k==='abrigo'){ const ct=add(B,unSkirtGeo(0.2,0.27,0.42,0.012),M(sk.shirt,true),0,-0.13,0); ct.scale.set(0.8,1,1.05);
      const bm=M('#3a2c22'); for(const y of [0.45,0.33,0.21,0.09]) add(T,new THREE.SphereGeometry(0.012,6,5),bm,fx+0.01,y,0.012);
      const sc=add(T,new THREE.TorusGeometry(0.085,0.032,8,18),Mt(),0,0.585,0,Math.PI/2,0,0); sc.scale.set(0.95,1.12,1);
      add(T,new THREE.BoxGeometry(0.024,0.22,0.06),Mt(),fx+0.03,0.47,0.055,0,0,-0.08); } }
  if(k==='hockey'||k==='rugby'){
    add(T,new THREE.TorusGeometry(0.072,0.018,6,16),M(k==='rugby'?'#f4f4f0':UN_NAVY),0.004,0.585,0,Math.PI/2,0,0);
    if(k==='rugby') add(T,new THREE.BoxGeometry(0.006,0.07,0.024),M('#f4f4f0'),fx+0.006,0.52,0);
    const so=M(UN_BROWN);
    for(const L of [R.lL,R.lR]){ const kc=L.kn.children; if(kc[0]) kc[0].material=so; if(kc[1]) kc[1].material=so;
      add(L.kn,new THREE.CylinderGeometry(0.068*lK,0.068*lK,0.045,10),M(k==='rugby'?'#f4f4f0':UN_NAVY),0,-0.035,0);
      if(k==='hockey') add(L.kn,new THREE.BoxGeometry(0.03,0.2,0.075*lK),so,0.05*lK,-0.2,0);
      if(k==='hockey'&&!ul){ L.hg.children[0].material=mS; if(kc[2]) kc[2].material=mS; } }
    if(k==='hockey'){ if(!ul){ const sk2=add(B,unSkirtGeo(0.185,0.22,0.17,0.04),M(UN_NAVY,true),0,-0.035,0); sk2.scale.set(0.76,1,1.02); }
      const st=new THREE.Group(); st.position.set(-0.29,0.25,0); st.rotation.x=0.6; T.add(st);
      add(st,new THREE.CylinderGeometry(0.014,0.014,0.82,6),M('#2c3e66'),0,0,0); add(st,new THREE.CylinderGeometry(0.017,0.017,0.2,6),M('#151515'),0,0.32,0);
      add(st,new THREE.TorusGeometry(0.045,0.016,6,10,Math.PI),M('#2c3e66'),0.045,-0.41,0,0,0,Math.PI); } }
  R.root.traverse(o=>{ if(o.isMesh) o.castShadow=true; }); }

/* ---------- topdorm: profiles, password, room ---------- */
const TD_CODE='TOPDORM', TD_HS=['atras','coleta','melena','corto','rizado','largo'], TD_HS_N=['Recogido','Coleta','Media melena','Corto','Rizado','Largo'];
const TD_EYE=['#6b5236','#7a6a3a','#5f7a4f','#4f78a8'], TD_EYE_N=['Marrones','Avellana','Verdes','Azules'];
const TD_BG=['#cfe2ea','#f3dcc4','#e2dcf0','#d9ead2','#f6d6dc','#f3ebc6'], TD_TOP=['#7fb3d5','#e98fb0','#8b6fd6','#4f7a3a','#e8742c','#2a6f87'];
var TDM={pack:null,pw:'',me:-1,cust:[null,null,null,null],err:'',busy:false,tab:'uniforme',url:new Map(),ed:null,prevName:null,join:false,boot:null,cardT:0};
function tdClean(o){ if(!o||typeof o!=='object') return null; const n=String(o.n||'').replace(/[<>&"'\u0000-\u001f]/g,'').trim().slice(0,14); if(!n) return null;
  const hx=(v,d)=>typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v)?v:d;
  return {n,s:clamp(o.s|0,0,4),hc:hx(o.hc,AV_HAIR[2]),hl:hx(o.hl,''),hs:TD_HS.includes(o.hs)?o.hs:'atras',part:o.part<0?-1:1,eye:hx(o.eye,TD_EYE[0]),ex:o.ex==='risa'?'risa':'sonrisa',
    gt:o.gt?1:0,gl:o.gl?1:0,h:clamp(+o.h||0.92,0.85,1.06),bg:hx(o.bg,TD_BG[0]),top:hx(o.top,TD_TOP[0])}; }
function tdLoadSt(){ try{ const o=JSON.parse(store.get(WP.key+'_td')||'null'); if(!o) return; TDM.me=Number.isInteger(o.me)&&o.me>=-1&&o.me<8?o.me:-1;
  if(Array.isArray(o.cust)) TDM.cust=[0,1,2,3].map(i=>tdClean(o.cust[i])); TDM.prevName=typeof o.pn==='string'?o.pn.slice(0,14):null; }catch(e){} }
function tdSaveSt(){ store.set(WP.key+'_td',JSON.stringify({me:TDM.me,cust:TDM.cust,pn:TDM.prevName})); }
function tdProf(i){ return i<0?null:i<4?(TDM.pack&&TDM.pack[i]||null):(TDM.cust[i-4]||null); }
function tdB64(s){ return Uint8Array.from(atob(s),c=>c.charCodeAt(0)); }
async function tdUnlock(pw,remember){ pw=String(pw||'').trim().toLowerCase(); const P=WP.topdorm; if(!P||!pw) return false;
  if(!(window.crypto&&crypto.subtle)){ TDM.err='Este navegador no puede abrir topdorm aquí (hace falta una página https).'; return false; }
  try{ const base=await crypto.subtle.importKey('raw',TE.encode(pw),'PBKDF2',false,['deriveKey']);
    const key=await crypto.subtle.deriveKey({name:'PBKDF2',salt:tdB64(P.s),iterations:P.it,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['decrypt']);
    const o=JSON.parse(TD.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:tdB64(P.i)},key,tdB64(P.c))));
    TDM.pack=(o.p||[]).slice(0,4).map(tdClean); TDM.pw=pw; TDM.err=''; TDM.url.clear(); if(remember) store.set('vg_td_pw',pw); return true;
  }catch(e){ TDM.err='Esa no es la contraseña.'; return false; } }
function tdForget(){ if(MP.code===TD_CODE) mpLeave(false); tdDrop(false); TDM.pack=null; TDM.pw=''; TDM.url.clear(); TDM.ed=null; store.set('vg_td_pw',''); tdRebuild(); }
function tdRoomKey(code){ return code===TD_CODE&&WP.topdorm&&TDM&&TDM.pw?TD_CODE+':'+TDM.pw:code; }
async function tdBeforeJoin(code){ if(code!==TD_CODE||!WP.topdorm||!TDM) return true; if(TDM.boot) await TDM.boot; if(TDM.pack) return true; TDM.join=true; tdSheet('sala'); return false; }
function tdSkin(P){ const own=['atras','coleta','melena'].includes(P.hs);
  return {n:P.n,shirt:P.top||TD_TOP[0],pants:'#2b3442',hair:P.hc,skin:AV_SKIN[P.s|0]||AV_SKIN[1],shoe:'#f2f2f2',cap:null,hat:'',pack:'#3b4048',
    H:P.h||0.92,W:0.95,chest:0.86,sh:0.92,arm:0.84,leg:0.88,hs:own?'none':P.hs,hs2:own?P.hs:'',part:P.part||1,gt:P.gt?1:0,gl:P.gl?'gafas':'',top:'manga',pt:'largo',fh:''}; }
function tdMySkin(){ if(!WP.topdorm||!TDM||TDM.me<0) return null; const P=tdProf(TDM.me); return P?tdSkin(P):null; }
function tdRebuild(){ if(typeof rig==='undefined'||!rig) return; setSkin(S.skin,S.av?avById(S.av):null); }
function tdName(n){ S.name=n; store.set('vg_name',n); const pn=$('pname'); if(pn) pn.value=n; }
function tdUse(i){ const P=tdProf(i); if(!P) return; if(TDM.me<0) TDM.prevName=S.name||''; TDM.me=i; tdSaveSt(); tdName(P.n); tdRebuild(); tdCard(P,'Eres '+P.n); }
function tdDrop(rebuild){ if(TDM.me<0) return; TDM.me=-1; tdName(TDM.prevName||''); TDM.prevName=null; tdSaveSt(); if(rebuild) tdRebuild(); }
// hair styles of the profiles that the base rig does not have, and sunglasses up on the head
function tdHair(R,sk){ const Hd=R.headG, mH=new THREE.MeshLambertMaterial({color:Cc(sk.hair)}), st=sk.hs2, pt=sk.part||1;
  const add=(geo,x,y,z,rx,ry,rz,mat)=>{ const m=new THREE.Mesh(geo,mat||mH); m.position.set(x,y,z); m.rotation.set(rx||0,ry||0,rz||0); Hd.add(m); return m; };
  if(st){ add(new THREE.SphereGeometry(0.146,16,10,0,Math.PI*2,0,Math.PI*0.55),-0.012,0.018,0.006*pt,0,0,0.2);
    add(new THREE.SphereGeometry(0.147,14,10,-Math.PI/2,Math.PI,0.15*Math.PI,0.6*Math.PI),-0.006,0.01,0);
    if(st==='atras'){ add(new THREE.SphereGeometry(0.055,10,8),-0.15,-0.03,0); add(new THREE.CylinderGeometry(0.035,0.018,0.16,8),-0.17,-0.12,0,0,0,-0.2); }
    if(st==='coleta'){ add(new THREE.SphereGeometry(0.032,8,6),-0.145,0.0,0); add(new THREE.CylinderGeometry(0.045,0.03,0.24,8),-0.18,-0.14,0,0,0,-0.3);
      for(const c of [[-0.2,-0.27,0.03,0.036],[-0.225,-0.3,-0.025,0.032],[-0.19,-0.32,-0.005,0.03],[-0.215,-0.26,-0.035,0.028]]) add(new THREE.SphereGeometry(c[3],8,6),c[0],c[1],c[2]); }
    if(st==='melena'){ add(new THREE.BoxGeometry(0.1,0.26,0.27),-0.075,-0.09,0); for(const s of [-1,1]) add(new THREE.BoxGeometry(0.11,0.2,0.035),0.005,-0.08,s*0.128);
      const fr=add(new THREE.SphereGeometry(0.06,10,8),0.105,0.08,-pt*0.03,0.3*pt,0,-0.3); fr.scale.set(0.7,0.45,1.5); } }
  if(sk.gt){ const fm=new THREE.MeshLambertMaterial({color:Cc('#4a2e18')}), lm=new THREE.MeshLambertMaterial({color:Cc('#c98a2b')});
    for(const s of [-1,1]){ add(new THREE.BoxGeometry(0.034,0.01,0.056),0.075,0.132,s*0.045,0,0,-0.75,lm); add(new THREE.BoxGeometry(0.038,0.008,0.062),0.074,0.128,s*0.045,0,0,-0.75,fm); }
    add(new THREE.BoxGeometry(0.01,0.008,0.03),0.082,0.128,0,0,0,-0.75,fm); } }

/* ---------- watercolour portraits (painted in code: no photos) ---------- */
function tdHash(s){ let h=2166136261; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function tdRng(a){ return ()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function tdMix(a,b,t){ const p=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)), A=p(a), B=p(b); return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join(''); }
function tdPaint(P,N){ const c=document.createElement('canvas'); c.width=c.height=N; const g=c.getContext('2d'), R=tdRng(tdHash(JSON.stringify(P))), s=N, X=u=>u*s;
  g.fillStyle='#fbf8f1'; g.fillRect(0,0,s,s);
  const wob=(pts,j)=>{ let q=pts; for(let it=0;it<3;it++){ const o=[]; for(let i=0;i<q.length;i++){ const a=q[i], b=q[(i+1)%q.length], L=Math.hypot(b[0]-a[0],b[1]-a[1]); o.push(a); if(!L) continue;
      const n=(R()-0.5)*2*j*L; o.push([(a[0]+b[0])/2-(b[1]-a[1])/L*n,(a[1]+b[1])/2+(b[0]-a[0])/L*n]); } q=o; j*=0.6; } return q; };
  const path=q=>{ g.beginPath(); g.moveTo(X(q[0][0]),X(q[0][1])); for(let i=1;i<q.length;i++) g.lineTo(X(q[i][0]),X(q[i][1])); g.closePath(); };
  // a wash: several transparent layers, each with its own ragged edge, and the darker rim watercolour leaves when it dries
  const wash=(pts,col,a,n,j,edge,mode)=>{ g.save(); g.globalCompositeOperation=mode||'multiply'; for(let k=0;k<n;k++){ path(wob(pts,j)); g.globalAlpha=a*(0.75+R()*0.5); g.fillStyle=col; g.fill();
      if(edge!==0){ g.globalAlpha=Math.min(1,a*(edge||1.1)); g.strokeStyle=col; g.lineWidth=s*0.0035; g.stroke(); } } g.restore(); };
  const body=(pts,col,j,edge,a)=>{ wash(pts,col,a||0.94,1,j,0,'source-over'); wash(pts,col,0.22,2,j,edge===undefined?1.3:edge); };
  const ell=(cx,cy,rx,ry,n,a0,a1)=>{ n=n||28; a0=a0||0; a1=a1===undefined?Math.PI*2:a1; const full=a1-a0>Math.PI*2-1e-6, o=[]; for(let i=0;i<n;i++){ const t=a0+(a1-a0)*i/(full?n:n-1); o.push([cx+Math.cos(t)*rx,cy+Math.sin(t)*ry]); } return o; };
  const curve=(a,b,q,col,w,al)=>{ g.save(); g.globalAlpha=al; g.strokeStyle=col; g.lineWidth=Math.max(0.7,s*w); g.lineCap='round'; g.beginPath(); g.moveTo(X(a[0]),X(a[1])); g.quadraticCurveTo(X(q[0]),X(q[1]),X(b[0]),X(b[1])); g.stroke(); g.restore(); };
  const shape=(draw,col,a,mode)=>{ g.save(); g.globalCompositeOperation=mode||'multiply'; g.globalAlpha=a; g.fillStyle=col; g.beginPath(); draw(); g.closePath(); g.fill(); g.restore(); };
  const M2=(x,y)=>g.moveTo(X(x),X(y)), Q2=(qx,qy,x,y)=>g.quadraticCurveTo(X(qx),X(qy),X(x),X(y)), L2=(x,y)=>g.lineTo(X(x),X(y));
  const skin=AV_SKIN[P.s|0]||AV_SKIN[1], shade=tdMix(skin,'#9a5a44',0.4), hair=P.hc, hl=P.hl||tdMix(hair,'#e8c890',0.35), hd=tdMix(hair,'#160f0a',0.45), st=P.hs, pr=P.part||1, px=0.5+0.065*pr, navy='#26314f';
  const long=st==='melena'?0.74:st==='largo'?0.88:0;
  // background and hair behind the head
  wash(ell(0.5,0.47,0.45,0.43,22),P.bg||TD_BG[0],0.36,4,0.2,0.6);
  wash(ell(0.25+R()*0.5,0.2+R()*0.2,0.15,0.11,14),tdMix(P.bg||TD_BG[0],'#9fb7c9',0.25),0.18,2,0.3,0.4);
  if(long) body(ell(0.5,0.43,0.195,0.255,18,Math.PI*1.02,Math.PI*1.98).concat([[0.695,0.5],[0.715,long-0.06],[0.665,long],[0.5,long-0.06],[0.335,long],[0.285,long-0.06],[0.305,0.5]]),tdMix(hair,hd,0.25),0.035);
  if(st==='rizado') for(let k=0;k<15;k++){ const t=Math.PI*(0.92+k/14*1.16); body(ell(0.5+Math.cos(t)*0.19,0.43+Math.sin(t)*0.22,0.055,0.055,12),hair,0.15,0.9); }
  // shoulders: navy blazer over the navy jumper, white shirt and its collar (the everyday uniform)
  wash([[0.03,1.02],[0.07,0.88],[0.17,0.8],[0.36,0.74],[0.5,0.76],[0.64,0.74],[0.83,0.8],[0.93,0.88],[0.97,1.02]],navy,0.55,3,0.03);
  wash([[0.2,0.82],[0.33,0.77],[0.3,0.86]],'#5c6d95',0.12,2,0.1,0); wash([[0.8,0.82],[0.67,0.77],[0.7,0.86]],'#5c6d95',0.1,2,0.1,0);
  wash([[0.36,0.755],[0.64,0.755],[0.6,1.02],[0.4,1.02]],'#1b2238',0.32,2,0.02);
  wash([[0.43,0.745],[0.57,0.745],[0.5,0.865]],'#ffffff',0.9,1,0.01,0,'source-over'); wash([[0.43,0.745],[0.57,0.745],[0.5,0.865]],'#c9ccd6',0.18,1,0.01,1.6);
  for(const sx of [-1,1]){ const w=[[0.5+0.09*sx,0.735],[0.5,0.772],[0.5+0.045*sx,0.815]]; wash(w,'#ffffff',0.92,1,0.01,0,'source-over'); wash(w,'#b9bdc9',0.2,1,0.01,1.8); }
  curve([0.37,0.765],[0.5,0.92],[0.43,0.86],'#121829',0.006,0.55); curve([0.63,0.765],[0.5,0.92],[0.57,0.86],'#121829',0.006,0.55);
  curve([0.33,0.775],[0.41,1.01],[0.35,0.9],'#10152a',0.005,0.6); curve([0.67,0.775],[0.59,1.01],[0.65,0.9],'#10152a',0.005,0.6);
  wash([[0.665,0.865],[0.705,0.865],[0.705,0.876],[0.665,0.876]],'#f2c230',0.9,1,0.02,0,'source-over'); wash([[0.665,0.876],[0.705,0.876],[0.705,0.887],[0.665,0.887]],'#3a6fd0',0.9,1,0.02,0,'source-over');
  // neck, ears and face
  body([[0.44,0.6],[0.56,0.6],[0.565,0.75],[0.5,0.775],[0.435,0.75]],skin,0.02,0.8); wash(ell(0.5,0.645,0.07,0.032,16),shade,0.25,2,0.08,0);
  if(!long&&st!=='rizado') for(const sx of [-1,1]){ body(ell(0.5+0.166*sx,0.47,0.026,0.04,14),skin,0.04,0.8); wash(ell(0.5+0.168*sx,0.47,0.012,0.022,10),shade,0.25,1,0.05,0); }
  const face=[]; for(let i=0;i<34;i++){ const t=i/34*Math.PI*2, lo=Math.max(0,Math.sin(t)); face.push([0.5+Math.cos(t)*0.163*(1-0.2*lo*lo),0.45+Math.sin(t)*(Math.sin(t)>0?0.21:0.2)]); }
  body(face,skin,0.012,0.9,1); wash(ell(0.6-0.2*(pr<0?1:0),0.48,0.07,0.16,18),shade,0.12,2,0.08,0);
  for(const sx of [-1,1]) wash(ell(0.5+0.088*sx,0.525,0.04,0.026,14),'#ec8f86',0.085,2,0.1,0);
  // hair on top: a cap from the parting, then strands, side curtains, fringe or curls
  const cap=ell(0.5,0.425,0.178,0.235,22,Math.PI*0.97,Math.PI*2.03).concat([[0.666,0.45],[0.655,0.36],[0.605,0.3],[px+0.02,0.268],[px,0.258],[px-0.03,0.272],[0.395,0.3],[0.345,0.36],[0.334,0.45]]);
  if(st==='corto') cap.splice(cap.length-9,9,[0.668,0.42],[0.64,0.32],[0.5,0.285],[0.36,0.32],[0.332,0.42]);
  body(cap,hair,0.025,1.2);
  for(let k=0;k<7;k++){ const sd=k%2?1:-1, ex=0.5+sd*(0.158+R()*0.016), ey=0.33+R()*0.06; curve([px,0.265],[ex,ey],[px+sd*0.08,0.23+R()*0.04],k%3?hl:hd,0.004,0.4); }
  if(st==='atras'||st==='coleta'){ curve([0.345,0.39],[0.338,0.5],[0.33,0.45],hair,0.005,0.45); curve([0.655,0.39],[0.664,0.49],[0.672,0.44],hair,0.004,0.35); }
  if(long){ for(const sx of [-1,1]) body([[0.5+0.16*sx,0.33],[0.5+0.14*sx,0.42],[0.5+0.155*sx,0.55],[0.5+0.14*sx,0.7],[0.5+0.2*sx,long],[0.5+0.215*sx,0.5],[0.5+0.19*sx,0.32]],hair,0.04,1.2);
    body([[px,0.252],[px+0.12*(-pr),0.285],[0.5-0.165*pr,0.38],[0.5-0.13*pr,0.34],[0.5-0.05*pr,0.31],[px-0.01*pr,0.29]],hair,0.04,1.2);
    for(let k=0;k<6;k++){ const sx=k%2?1:-1; curve([0.5+0.17*sx,0.4],[0.5+(0.17+R()*0.04)*sx,long-0.04],[0.5+0.2*sx,0.58],k%3?hl:hd,0.004,0.35); } }
  if(st==='rizado') for(let k=0;k<6;k++) body(ell(0.38+k*0.048,0.29+(k%2)*0.02,0.035,0.03,10),hair,0.15,1);
  // eyes, brows, nose, mouth
  for(const sx of [-1,1]){ const ex=0.5+0.068*sx, ey=0.455, laugh=P.ex==='risa';
    wash(ell(ex,ey,0.031,laugh?0.011:0.016,16),'#ffffff',0.9,1,0.02,0,'source-over');
    shape(()=>{ g.arc(X(ex),X(ey+(laugh?0.002:0)),X(laugh?0.012:0.0145),0,Math.PI*2); },P.eye||TD_EYE[0],0.85);
    shape(()=>{ g.arc(X(ex),X(ey+(laugh?0.002:0)),X(0.006),0,Math.PI*2); },'#24180f',0.9);
    shape(()=>{ g.arc(X(ex+0.005),X(ey-0.004),X(0.0035),0,Math.PI*2); },'#ffffff',0.9,'source-over');
    curve([ex-0.034,ey+0.003],[ex+0.034,ey+0.001],[ex,ey-(laugh?0.024:0.03)],'#3d2a1e',0.006,0.8);
    if(laugh) curve([ex-0.026,ey+0.02],[ex+0.026,ey+0.02],[ex,ey+0.03],shade,0.003,0.45); else curve([ex-0.024,ey+0.014],[ex+0.024,ey+0.013],[ex,ey+0.022],shade,0.003,0.3);
    curve([ex-0.036,ey-0.046],[ex+0.036,ey-0.05],[ex+0.004*sx,ey-0.07],hd,0.008,0.55); }
  curve([0.506,0.47],[0.494,0.528],[0.51,0.505],shade,0.004,0.5); curve([0.483,0.533],[0.517,0.533],[0.5,0.546],shade,0.004,0.5); wash(ell(0.507,0.527,0.018,0.01,10),shade,0.12,1,0.05,0);
  if(P.ex==='risa'){ shape(()=>{ M2(0.432,0.582); Q2(0.5,0.6,0.568,0.582); Q2(0.5,0.695,0.432,0.582); },'#6e2a2e',0.78);
    shape(()=>{ M2(0.444,0.588); Q2(0.5,0.603,0.556,0.588); L2(0.55,0.607); Q2(0.5,0.62,0.45,0.607); },'#ffffff',0.92,'source-over');
    wash(ell(0.5,0.655,0.036,0.016,12),'#d66b6f',0.5,1,0.05,0); curve([0.45,0.662],[0.55,0.662],[0.5,0.7],'#c97b7a',0.007,0.4); }
  else { shape(()=>{ M2(0.443,0.588); Q2(0.5,0.6,0.557,0.588); Q2(0.5,0.657,0.443,0.588); },'#9b3f3f',0.62);
    shape(()=>{ M2(0.453,0.593); Q2(0.5,0.602,0.547,0.593); Q2(0.5,0.624,0.453,0.593); },'#ffffff',0.9,'source-over');
    curve([0.46,0.637],[0.54,0.637],[0.5,0.66],'#d98a86',0.008,0.45); }
  curve([0.43,0.578],[0.44,0.592],[0.43,0.59],shade,0.003,0.4); curve([0.57,0.578],[0.56,0.592],[0.57,0.59],shade,0.003,0.4);
  const jaw=ell(0.5,0.45,0.158,0.205,12,Math.PI*0.12,Math.PI*0.88); for(let i=0;i<jaw.length-1;i+=2) curve(jaw[i],jaw[i+1],[(jaw[i][0]+jaw[i+1][0])/2,(jaw[i][1]+jaw[i+1][1])/2+0.004],'#8a5a44',0.003,0.28);
  // the ponytail's curls over the shoulder, glasses, sunglasses up on the head
  if(st==='coleta') for(let k=0;k<7;k++){ const t=k/6, cx=0.355-0.06*t+(k%2?0.018:-0.012), cy=0.6+0.27*t; body(ell(cx,cy,0.042-0.012*t,0.038,12),k%2?hair:tdMix(hair,hl,0.4),0.14,1.3);
    curve([cx-0.025,cy-0.01],[cx+0.02,cy+0.02],[cx+0.02,cy-0.03],hd,0.004,0.4); }
  if(P.gl) for(const sx of [-1,1]){ g.save(); g.globalAlpha=0.8; g.strokeStyle='#2b2b2b'; g.lineWidth=s*0.006; g.beginPath(); g.ellipse(X(0.5+0.068*sx),X(0.457),X(0.045),X(0.033),0,0,Math.PI*2); g.stroke(); g.restore(); }
  if(P.gt){ for(const sx of [-1,1]){ body(ell(0.5+0.07*sx,0.236,0.052,0.03,16),'#c98a2b',0.03,1.4,0.8); g.save(); g.globalAlpha=0.8; g.strokeStyle='#4a2e18'; g.lineWidth=s*0.007; g.beginPath(); g.ellipse(X(0.5+0.07*sx),X(0.236),X(0.054),X(0.032),0,0,Math.PI*2); g.stroke(); g.restore();
      wash(ell(0.5+0.06*sx,0.228,0.015,0.008,8),'#ffffff',0.5,1,0.05,0,'source-over'); }
    curve([0.47,0.236],[0.53,0.236],[0.5,0.224],'#4a2e18',0.007,0.8); }
  // pigment grain and paper
  g.save(); g.globalCompositeOperation='multiply'; for(let i=0;i<s*s/30;i++){ g.globalAlpha=0.03+R()*0.05; g.fillStyle=R()<0.5?'#6a5a48':'#8a7a66'; g.fillRect(R()*s,R()*s,1,1); } g.restore();
  return c; }
function tdUrl(P,N){ const k=N+JSON.stringify(P); let u=TDM.url.get(k); if(!u){ try{ u=tdPaint(P,N).toDataURL('image/png'); }catch(e){ u=''; } TDM.url.set(k,u); } return u; }
function tdCard(P,txt){ const el=$('tdCard'); if(!el||!P) return; el.innerHTML='<img src="'+tdUrl(P,128)+'" alt=""><span>'+esc(txt)+'</span>'; el.hidden=false; clearTimeout(TDM.cardT); TDM.cardT=setTimeout(()=>{ el.hidden=true; },3400); }

/* ---------- the room: what goes out and what comes in ---------- */
function tdHiOut(o){ if(WP.topdorm&&MP.code===TD_CODE&&TDM.me>=0&&tdProf(TDM.me)){ o.tp=TDM.me; if(TDM.me>=4) o.tpa=tdProf(TDM.me); } }
function tdHiIn(p,o,first){ const t=Number.isInteger(o.tp)&&o.tp>=0&&o.tp<8?o.tp:-1; const was=p.tp; p.tp=t; p.tpa=t>=4?tdClean(o.tpa):null;
  const P=tdPeerP(p); if(P&&(first||was!==t)) tdCard(P,P.n+' está en topdorm'); }
function tdPeerP(p){ if(!WP.topdorm||!TDM||MP.code!==TD_CODE||!(p.tp>=0)) return null; return p.tp<4?tdProf(p.tp):p.tpa; }
function tdPeerSig(p){ const P=tdPeerP(p); return P?p.tp+JSON.stringify(P):''; }
function tdMyFace(){ if(!WP.topdorm||MP.code!==TD_CODE||!TDM||TDM.me<0) return ''; const P=tdProf(TDM.me); return P?'<img class="tdf" src="'+tdUrl(P,96)+'" alt="">':''; }
function tdFace(p){ const P=tdPeerP(p); return P?'<img class="tdf" src="'+tdUrl(P,96)+'" alt="">':''; }
function tdNetState(o){ const u=unCode(); if(u) o.un=u; }
function tdOnline(i){ if(MP.code!==TD_CODE) return ''; for(const p of MP.peers.values()) if(p.tp===i) return p.n||'…'; return ''; }

/* ---------- the sheet ---------- */
function tdSheet(tab,arg){ if(!WP.uniform&&!WP.topdorm) return; closeModal(); if(tab) TDM.tab=tab; const T=TDM.tab, B=$('tdBody');
  const tabs=[['uniforme','👔 Uniforme']].concat(WP.topdorm?[['quien','🧒 Quién eres'],['sala','🛏️ Topdorm']]:[]).concat([['como','❓ Cómo funciona']]);
  let h='<h2>Uniforme'+(WP.topdorm?' y topdorm':'')+'</h2><div class="tabs">'+tabs.map(t=>'<button data-tdt="'+t[0]+'" class="'+(T===t[0]?'on':'')+'">'+t[1]+'</button>').join('')+'</div>';
  h+=T==='uniforme'?unHTML():T==='como'?tdHowHTML():!TDM.pack?tdLockHTML():T==='quien'?tdWhoHTML():tdSalaHTML();
  h+='<div class="row" style="margin-top:12px"><button class="btn small" id="tdClose">Cerrar</button></div>'; B.innerHTML=h; $('tdSheet').hidden=false; if(!arg) $('tdSheet').scrollTop=0;
  B.querySelectorAll('[data-tdt]').forEach(b=>b.onclick=()=>tdSheet(b.dataset.tdt)); $('tdClose').onclick=()=>{ $('tdSheet').hidden=true; TDM.ed=null; TDM.join=false; };
  B.querySelectorAll('[data-uni]').forEach(b=>b.onclick=()=>{ UN.i=+b.dataset.uni; unSave(); tdRebuild(); mpHello(); tdSheet('uniforme',1); });
  B.querySelectorAll('[data-unl]').forEach(b=>b.onclick=()=>{ UN.ul=+b.dataset.unl; unSave(); tdRebuild(); mpHello(); tdSheet('uniforme',1); });
  const pw=$('tdPw'); if(pw){ const go=async()=>{ if(TDM.busy) return; TDM.busy=true; $('tdPwGo').textContent='Comprobando…'; const ok=await tdUnlock(pw.value,$('tdRem').checked); TDM.busy=false;
      if(ok){ tdRebuild(); if(TDM.join){ TDM.join=false; tdSheet('sala'); tdJoin(); } else tdSheet(T==='sala'?'sala':'quien'); } else tdSheet(T,1); };
    pw.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'){ e.preventDefault(); go(); } }); $('tdPwGo').onclick=go; if(!arg) setTimeout(()=>{ try{ pw.focus(); }catch(e){} },60); }
  B.querySelectorAll('[data-tdu]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.tdu; if(TDM.me===i){ tdDrop(true); } else tdUse(i); mpHello(); tdSheet('quien',1); });
  B.querySelectorAll('[data-tde]').forEach(b=>b.onclick=()=>{ const i=+b.dataset.tde, P=tdProf(i); TDM.ed={i,P:Object.assign({},P||{n:'',s:1,hc:AV_HAIR[1],hs:'coleta',part:1,eye:TD_EYE[0],ex:'sonrisa',gt:0,gl:0,h:0.92,bg:TD_BG[(i+2)%6],top:TD_TOP[i%6]})}; tdSheet('quien',1); setTimeout(()=>{ const e=$('tdEdN'); if(e) e.focus(); },60); });
  if(TDM.ed){ const E=TDM.ed, nm=$('tdEdN');
    nm.addEventListener('keydown',e=>e.stopPropagation()); nm.addEventListener('input',()=>{ E.P.n=nm.value; });
    B.querySelectorAll('[data-tdk]').forEach(b=>b.onclick=()=>{ const k=b.dataset.tdk, v=b.dataset.v; E.P[k]=/^-?\d+(\.\d+)?$/.test(v)?+v:v; if(k==='hc') E.P.hl=''; tdSheet('quien',1); });
    $('tdEdSave').onclick=()=>{ const P=tdClean(E.P); if(!P){ $('tdEdMsg').textContent='Escribe un nombre.'; return; } TDM.cust[E.i-4]=P; tdSaveSt(); TDM.ed=null; if(TDM.me===E.i){ tdName(P.n); tdRebuild(); mpHello(); } tdSheet('quien',1); };
    $('tdEdCancel').onclick=()=>{ TDM.ed=null; tdSheet('quien',1); };
    const del=$('tdEdDel'); if(del) del.onclick=()=>{ if(del.dataset.sure!=='1'){ del.dataset.sure='1'; del.textContent='Pulsa otra vez para vaciarla'; return; } if(TDM.me===E.i) tdDrop(true); TDM.cust[E.i-4]=null; tdSaveSt(); TDM.ed=null; mpHello(); tdSheet('quien',1); }; }
  const jn=$('tdJoin'); if(jn) jn.onclick=tdJoin; const lv=$('tdLeave'); if(lv) lv.onclick=()=>{ mpLeave(false); tdSheet('sala',1); };
  const iv=$('tdInv'); if(iv) iv.onclick=()=>{ try{ mpInvite(); }catch(e){} };
  const fg=$('tdForget'); if(fg) fg.onclick=()=>{ if(fg.dataset.sure!=='1'){ fg.dataset.sure='1'; fg.textContent='Pulsa otra vez para olvidarla'; return; } tdForget(); tdSheet('sala'); }; }
function tdJoin(){ if(!TDM.pack){ TDM.join=true; tdSheet('sala'); return; } ensureAudio(); mpJoin(TD_CODE).then(()=>{ if(MP.code===TD_CODE){ mpFeed('Has entrado en topdorm','sys'); if(!$('tdSheet').hidden) tdSheet('sala',1); } }); }
function unHTML(){ let h='<p>En Casterton cada jugador puede llevar el uniforme del colegio. Es un diseño propio con los colores de verdad y <b>sin escudo</b>. Tus amigos de la sala te ven con él.</p><div class="tdgrid un">';
  h+=UN_DEF.map((u,i)=>'<button class="tdun'+(UN.i===i?' on':'')+'" data-uni="'+i+'"><i aria-hidden="true">'+u.ic+'</i><b>'+u.n+(UN.i===i?' ✓':'')+'</b><span>'+u.d+'</span></button>').join('')+'</div>';
  h+='<h3>Con falda o con pantalón</h3><div class="row"><button class="btn small'+(!UN.ul?' primary':'')+'" data-unl="0">Falda de tartán</button><button class="btn small'+(UN.ul?' primary':'')+'" data-unl="1">Pantalón</button></div>';
  h+='<p class="note">Con pantalón: gris en el uniforme y el abrigo, corto azul marino en hockey. En rugby, siempre pantalón corto blanco. Si llevas un disfraz de Halloween, se ve el disfraz.</p>'; return h; }
function tdLockHTML(){ return '<div class="tdlock"><p>🔒 <b>Topdorm</b> es una sala privada para ocho jugadores. Cada uno tiene su avatar y su retrato pintado en acuarela. Para verlos y entrar hace falta la contraseña.</p>'+
  '<div class="row"><input id="tdPw" type="password" class="mpin" style="font-size:16px;flex:1;min-width:150px" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Contraseña" aria-label="Contraseña de topdorm"><button class="btn primary" id="tdPwGo">Entrar</button></div>'+
  '<label class="tdchk"><input type="checkbox" id="tdRem" checked> Recordarla en este dispositivo</label>'+(TDM.err?'<p class="note bad">'+esc(TDM.err)+'</p>':'')+
  '<p class="note">No importan las mayúsculas. Sin la contraseña la página no tiene los nombres ni los retratos: van cifrados con ella.</p></div>'; }
function tdWhoHTML(){ let h='<p>Elige quién eres. Tu avatar se pone el uniforme que elijas. Los demás te ven con tu nombre y tu retrato en la etiqueta de encima de tu cabeza.</p><div class="tdgrid">';
  for(let i=0;i<8;i++){ const P=tdProf(i), mine=TDM.me===i, on=tdOnline(i);
    if(P) h+='<div class="tdc'+(mine?' on':'')+'"><img src="'+tdUrl(P,192)+'" alt="Retrato en acuarela de '+esc(P.n)+'"><b>'+esc(P.n)+'</b>'+(mine?'<span class="tdme">Eres tú</span>':on?'<span class="tdon">En la sala</span>':'')+
      '<button class="btn small'+(mine?'':' primary')+'" data-tdu="'+i+'">'+(mine?'Dejar de serlo':'Jugar como '+esc(P.n))+'</button>'+(i>=4?'<button class="btn small" data-tde="'+i+'">Cambiar</button>':'')+'</div>';
    else h+='<div class="tdc free"><div class="tdph" aria-hidden="true">+</div><b>Plaza libre</b><button class="btn small" data-tde="'+i+'">Crear</button></div>'; }
  h+='</div>'; if(TDM.ed) h+=tdEdHTML(); return h; }
function tdEdHTML(){ const E=TDM.ed, P=E.P, prev=tdClean(Object.assign({},P,{n:P.n||'?'}));
  const sw=(k,vals,names,col)=>'<div class="tdrow"><span>'+names[0]+'</span><div class="tdsws">'+vals.map((v,j)=>col?'<button class="tdsw'+(String(P[k])===String(v)?' on':'')+'" data-tdk="'+k+'" data-v="'+v+'" style="background:'+(typeof col==='function'?col(v):v)+'" aria-label="'+esc(names[j+1]||'')+'"></button>':'<button class="btn small'+(String(P[k])===String(v)?' primary':'')+'" data-tdk="'+k+'" data-v="'+v+'">'+names[j+1]+'</button>').join('')+'</div></div>';
  return '<div class="tded"><img src="'+tdUrl(prev,192)+'" alt="Vista previa del retrato"><div><b>Plaza '+(E.i+1)+'</b>'+
    '<div class="tdrow"><span>Nombre</span><input id="tdEdN" class="mpin" style="font-size:16px" maxlength="14" value="'+esc(P.n)+'" autocomplete="off"></div>'+
    sw('s',[0,1,2,3,4],['Piel'].concat(AV_SKIN_N),v=>AV_SKIN[v])+sw('hc',AV_HAIR,['Pelo'].concat(AV_HAIR_N),true)+sw('hs',TD_HS,['Peinado'].concat(TD_HS_N))+
    sw('part',[-1,1],['Raya','A un lado','Al otro'])+sw('eye',TD_EYE,['Ojos'].concat(TD_EYE_N),true)+sw('gl',[0,1],['Gafas','No','Sí'])+sw('ex',['sonrisa','risa'],['Cara','Sonrisa','Risa'])+
    sw('top',TD_TOP,['Ropa (sin uniforme)','Celeste','Rosa','Lila','Verde','Naranja','Azul'],true)+sw('bg',TD_BG,['Fondo','Azul','Melocotón','Lavanda','Menta','Rosa','Vainilla'],true)+
    '<div class="row"><button class="btn primary" id="tdEdSave">Guardar</button><button class="btn small" id="tdEdCancel">Cancelar</button>'+(TDM.cust[E.i-4]?'<button class="btn small" id="tdEdDel">Vaciar la plaza</button>':'')+'</div><p class="note bad" id="tdEdMsg"></p></div></div>'; }
function tdSalaHTML(){ const inR=MP.code===TD_CODE; let h='<p>Topdorm es una sala de amigos como las demás: os veis, cada uno juega su bola y hay chat y voz. La diferencia es que solo entra quien sabe la contraseña, porque la llave del cifrado sale de ella.</p>';
  if(!MP_OK) return h+'<p class="note">Para entrar en salas abre el juego en <a href="'+SITE_URL+'" target="_blank" rel="noopener">'+SITE_TXT+'</a>.</p>';
  if(TDM.me<0) h+='<p class="note">Aún no has elegido quién eres (pestaña «Quién eres»): entrarás con tu nombre y tu ropa.</p>';
  if(inR){ const me=tdProf(TDM.me), rows=[[me,mpName()+' (tú)']].concat([...MP.peers.values()].map(p=>[tdPeerP(p),(p.n||'…')+(p.dist>25?' · a '+fmt(p.dist)+' m':'')]));
    h+='<h3>En la sala ('+rows.length+')</h3>'+rows.map(r=>'<div class="tdp">'+(r[0]?'<img src="'+tdUrl(r[0],96)+'" alt="">':'<span class="tdph s" aria-hidden="true">?</span>')+'<span>'+esc(r[1])+'</span></div>').join('');
    h+='<div class="row" style="margin-top:8px"><button class="btn" id="tdLeave">Salir de la sala</button><button class="btn small" id="tdInv">Invitar</button></div><p class="note">La invitación lleva a la sala; al abrirla, hay que escribir la contraseña.</p>'; }
  else h+='<div class="row"><button class="btn primary" id="tdJoin">Entrar en la sala topdorm</button></div>'+(MP.code?'<p class="note">Saldrás de la sala '+esc(mpPretty(MP.code))+'.</p>':'');
  h+='<h3>Este dispositivo</h3><p class="note">La contraseña '+(store.get('vg_td_pw')?'está guardada aquí':'no está guardada aquí: la pedirá al volver a abrir el juego')+'.</p><div class="row"><button class="btn small" id="tdForget">Olvidar la contraseña aquí</button></div>'; return h; }
function tdHowHTML(){ let h='';
  if(WP.uniform) h+='<h3>Uniforme</h3><p>En la pestaña <b>Uniforme</b> eliges qué llevas en Casterton: uniforme de diario, abrigo, hockey o rugby, con falda de tartán o pantalón. Es un diseño propio con los colores de verdad del colegio y sin escudo. Sedbergh juega con camiseta marrón (en inglés, «the brown shirt»). Tus amigos de la sala te ven igual. Con un disfraz de Halloween puesto se ve el disfraz.</p>';
  if(WP.topdorm) h+='<h3>Topdorm</h3><ol><li>Abre la pestaña <b>Quién eres</b> y escribe la contraseña (no importan las mayúsculas). Puedes dejarla recordada en el dispositivo.</li><li>Elige quién eres: cuatro jugadoras fijas y cuatro plazas libres que creas tú con nombre, piel, pelo, peinado, ojos y gafas.</li><li>En la pestaña <b>Topdorm</b>, entra en la sala. Ves a los demás con su nombre y su retrato encima de la cabeza, y al entrar alguien sale su retrato.</li></ol>'+
    '<h3>Retratos y privacidad</h3><p>Los retratos los pinta el propio juego con manchas de color transparentes, como la acuarela: no hay ninguna foto. Los nombres y los retratos de las cuatro jugadoras fijas van cifrados con la contraseña. Sin ella, la página no los tiene y no se pueden ver ni en el código. Las plazas libres se guardan solo en tu dispositivo y los demás las ven cuando estáis en la sala.</p>'+
    '<h3>Cómo se lee</h3><ul><li><b>Eres tú</b> (verde): el perfil con el que juegas.</li><li><b>En la sala</b> (azul): alguien de la sala juega con ese perfil.</li><li>En la etiqueta de un amigo, el círculo con su retrato dice quién es.</li></ul>';
  h+='<h3>Glosario</h3><dl class="gloss">'+tdGlossHTML()+'</dl>'; return h; }
function tdGuideHTML(){ let h=''; if(WP.uniform) h+='<li><b>Uniforme de Sedbergh</b> (Casterton, «Uniforme y topdorm» del menú y del inicio): uniforme de diario (blazer azul marino, camisa blanca, jersey de pico y falda de tartán rojo o pantalón gris), abrigo, hockey o rugby (la camiseta marrón del colegio). Diseño propio y sin escudo; tus amigos de la sala te ven con él.</li>';
  if(WP.topdorm) h+='<li><b>Topdorm</b>: sala privada con contraseña para ocho jugadores. Con la contraseña eliges quién eres y cada perfil sale con su retrato en acuarela, pintado por el juego. Sin ella no se ven los nombres ni los retratos, porque van cifrados.</li>'; return h; }
function tdGlossHTML(){ return (WP.uniform?'<dt>Uniforme</dt><dd>La ropa del colegio: aquí, blazer azul marino, camisa blanca, jersey de pico y falda de tartán o pantalón gris.</dd><dt>Tartán</dt><dd>Tela escocesa de cuadros. La falda del uniforme es de tartán rojo con franjas verdes y negras.</dd><dt>Camiseta marrón</dt><dd>El color de los equipos de Sedbergh («the brown shirt»): se lleva en hockey y rugby.</dd><dt>Falda pantalón</dt><dd>Falda con pantalón corto por dentro, la de hockey.</dd>':'')+
  (WP.topdorm?'<dt>Topdorm</dt><dd>Sala privada de amigos con contraseña para ocho jugadores.</dd><dt>Retrato en acuarela</dt><dd>Dibujo que pinta el juego con capas de color transparentes y bordes irregulares, como la acuarela. No es una foto.</dd><dt>Plaza libre</dt><dd>Perfil de topdorm que crea cada uno en su dispositivo: nombre, piel, pelo, peinado, ojos y gafas.</dd><dt>Contraseña</dt><dd>La palabra que abre topdorm. Con ella se descifran los perfiles y sale la llave de la sala.</dd>':''); }
{ const m=$('mDorm'); if(m){ m.hidden=!(WP.uniform||WP.topdorm); m.onclick=()=>{ saveName(); ensureAudio(); tdSheet('uniforme'); }; } }
unLoad(); if(WP.topdorm){ tdLoadSt(); const pw=store.get('vg_td_pw'); if(pw) TDM.boot=tdUnlock(pw,false).then(ok=>{ TDM.boot=null; if(ok){ if(TDM.me>=0) tdRebuild(); } else store.set('vg_td_pw',''); return ok; }); }
