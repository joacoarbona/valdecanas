
/* ================= friends' avatars: build each friend (height, build, hair, face, clothes) and play as them ================= */
const AVO={
  h:{l:'Altura',o:['Bajito','Algo bajo','Medio','Alto','Muy alto']}, c:{l:'Complexión',o:['Delgado','Normal','Fuerte','Gordete']},
  hs:{l:'Pelo',o:['Corto','Largo','Rizado','Rapado','Entradas','Calvo por arriba','Calvo']}, f:{l:'Cara',o:['Afeitado','Barba','Bigote','Perilla']},
  g:{l:'Gafas',o:['Sin gafas','Gafas','De sol']}, t:{l:'Arriba',o:['Polo','Manga larga','Jersey']}, p:{l:'Pantalón',o:['Largo','Corto']}, w:{l:'Cabeza',o:['Nada','Gorra','Visera','Sombrero']}
};
const AV_SKIN=['#f6d2b8','#f1c7a5','#e0ac83','#c58c63','#8d5a3b'], AV_SKIN_N=['Muy clara','Clara','Media','Morena','Oscura'];
const AV_HAIR=['#e5c76f','#c19a5b','#7a5232','#3a2a20','#16110e','#bdb8b0','#a8502a'], AV_HAIR_N=['Rubio','Rubio oscuro','Castaño','Moreno','Negro','Canoso','Pelirrojo'];
const AV_CL=['#ffffff','#16231b','#24324a','#2a6f87','#7fb3d5','#d6442a','#e8742c','#f2c230','#4f7a3a','#8b6fd6','#e98fb0','#c9b48a','#8e8f91','#6b4b2e'], AV_CL_N=['Blanco','Negro','Marino','Azul','Celeste','Rojo','Naranja','Amarillo','Verde','Lila','Rosa','Beige','Gris','Marrón'];
const AV_HS=['corto','largo','rizado','rapado','entradas','coronilla','calvo'], AV_FH=['','barba','bigote','perilla'], AV_GL=['','gafas','sol'], AV_TOP=['polo','manga','jersey'], AV_PT=['largo','corto'], AV_HAT=['','gorra','visera','sombrero'];
const AV_KEYS=['h','c','s','hs','hc','f','g','t','tc','p','pc','w','wc','z'], AV_MAX={h:5,c:4,s:5,hs:7,hc:7,f:4,g:3,t:3,tc:14,p:2,pc:14,w:4,wc:14,z:14};
function avSkin(a){ const C=a.c|0; return {n:a.n,shirt:AV_CL[a.tc],pants:AV_CL[a.pc],hair:AV_HAIR[a.hc],skin:AV_SKIN[a.s],shoe:AV_CL[a.z],cap:a.w?AV_CL[a.wc]:null,hat:AV_HAT[a.w],pack:'#3b4048',
  H:[0.9,0.95,1,1.06,1.11][a.h], W:[0.95,1,1.05,1.07][C], chest:[0.86,1,1.15,1.2][C], sh:[0.92,1,1.16,1.02][C], arm:[0.84,1,1.28,1.12][C], leg:[0.88,1,1.15,1.22][C], belly:C===3,
  hs:AV_HS[a.hs], fh:AV_FH[a.f], gl:AV_GL[a.g], top:AV_TOP[a.t], pt:AV_PT[a.p]}; }
function avClean(o){ if(!o||typeof o!=='object') return null; const a={id:typeof o.id==='string'?o.id.slice(0,24):'a'+Math.random().toString(36).slice(2,9),n:String(o.n||'Amigo').replace(/[<>]/g,'').slice(0,14)};
  for(const k of AV_KEYS){ const v=o[k]|0; a[k]=v>=0&&v<AV_MAX[k]?v:0; } return a; }
function avEncode(a){ return [a.n].concat(AV_KEYS.map(k=>a[k])); }
function avDecode(arr){ if(!Array.isArray(arr)||arr.length!==AV_KEYS.length+1||typeof arr[0]!=='string') return null; const o={n:arr[0]}; AV_KEYS.forEach((k,i)=>{ o[k]=arr[i+1]; }); for(const k of AV_KEYS) if(!Number.isInteger(o[k])) return null; return avClean(o); }
function avCode(a){ return btoa(unescape(encodeURIComponent(JSON.stringify(avEncode(a))))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function avFromCode(c){ try{ c=String(c).trim().replace(/^.*[?&]amigo=/,'').replace(/&.*$/,'').replace(/-/g,'+').replace(/_/g,'/'); return avDecode(JSON.parse(decodeURIComponent(escape(atob(c))))); }catch(e){ return null; } }
let AVS=[];
function avLoad(){ if(!WP.avatars) return; try{ AVS=(JSON.parse(store.get(WP.key+'_avs')||'null')||[]).map(avClean).filter(Boolean); }catch(e){ AVS=[]; }
  if(!AVS.length&&!store.get(WP.key+'_avs_seed')&&WP.avatarPresets){ AVS=WP.avatarPresets.map(avClean); store.set(WP.key+'_avs_seed','1'); avSave(); } }
function avSave(){ store.set(WP.key+'_avs',JSON.stringify(AVS)); }
function avById(id){ return AVS.find(a=>a.id===id)||null; }
function curSkin(){ const a=S.av&&avById(S.av); return a?avSkin(a):SKINS[S.skin]||SKINS[0]; }
function setAvatar(id){ const a=avById(id); if(!a) return; const prev=S.av?avById(S.av):null; S.av=id; store.set(WP.key+'_av',id); setSkin(S.skin,a);
  const pn=$('pname'); if(pn&&(!pn.value.trim()||(prev&&pn.value.trim()===prev.n)||SKINS.some(s=>s.n===pn.value.trim()))){ pn.value=a.n; S.name=a.n; store.set('vg_name',a.n); mpHello(); } renderSkins(); renderFriends(); }
// a small drawing of the avatar for the pickers (head, hair by style, body by build and height)
function avIcon(sk){ const H=sk.H||1, bw=sk.belly?20:(sk.chest||1)>1.1?19:(sk.chest||1)<0.9?13:16, x0=17-bw/2, top=Math.round(16-(H-1)*20), hy=top-7;
  let hair=''; const hs=sk.hs||'corto';
  if(hs==='corto'||hs==='rapado') hair=`<path d="M10 ${hy}a7 7 0 0 1 14 0z" fill="${sk.hair}"/>`; else if(hs==='largo') hair=`<path d="M10 ${hy}a7 7 0 0 1 14 0v7h-3v-6h-8v6h-3z" fill="${sk.hair}"/>`;
  else if(hs==='rizado') hair=`<circle cx="12" cy="${hy-2}" r="3.4" fill="${sk.hair}"/><circle cx="17" cy="${hy-4}" r="3.6" fill="${sk.hair}"/><circle cx="22" cy="${hy-2}" r="3.4" fill="${sk.hair}"/>`;
  else if(hs==='entradas') hair=`<path d="M10.5 ${hy+1}a7 7 0 0 1 4-6l1 4z M23.5 ${hy+1}a7 7 0 0 0-4-6l-1 4z" fill="${sk.hair}"/>`; else if(hs==='coronilla') hair=`<rect x="9.6" y="${hy}" width="2.4" height="5" rx="1" fill="${sk.hair}"/><rect x="22" y="${hy}" width="2.4" height="5" rx="1" fill="${sk.hair}"/>`;
  const hat=sk.hat&&sk.cap?(sk.hat==='sombrero'?`<rect x="7" y="${hy-1}" width="20" height="2" rx="1" fill="${sk.cap}"/><rect x="11" y="${hy-6}" width="12" height="5" rx="2" fill="${sk.cap}"/>`:`<path d="M10 ${hy}a7 7 0 0 1 14 0z" fill="${sk.cap}"/><rect x="20" y="${hy-1}" width="7" height="2" rx="1" fill="${sk.cap}"/>`):'';
  const legs=sk.pt==='corto'?`<rect x="11" y="${top+13}" width="5" height="5" rx="2" fill="${sk.pants}"/><rect x="18" y="${top+13}" width="5" height="5" rx="2" fill="${sk.pants}"/><rect x="11.5" y="${top+18}" width="4" height="${24-top-1}" rx="1.5" fill="${sk.skin}"/><rect x="18.5" y="${top+18}" width="4" height="${24-top-1}" rx="1.5" fill="${sk.skin}"/>`
    :`<rect x="11" y="${top+13}" width="5" height="${40-top-13}" rx="2" fill="${sk.pants}"/><rect x="18" y="${top+13}" width="5" height="${40-top-13}" rx="2" fill="${sk.pants}"/>`;
  return `<svg viewBox="0 0 34 42" aria-hidden="true"><circle cx="17" cy="${hy+2}" r="7" fill="${sk.skin}"/>${hair}${hat}${sk.gl?`<rect x="13" y="${hy+1}" width="8" height="2.2" rx="1" fill="${sk.gl==='sol'?'#141414':'#5b6168'}"/>`:''}<rect x="${x0}" y="${top}" width="${bw}" height="13" rx="4" fill="${sk.shirt}"/>${legs}</svg>`; }
function renderFriends(){ const box=$('friends'); if(!box) return; const wrap=$('friendsBox'); if(wrap) wrap.hidden=!WP.avatars; if(!WP.avatars) return;
  box.innerHTML=AVS.map(a=>`<div class="fr ${a.id===S.av?'on':''}"><button class="skin" data-av="${a.id}" aria-label="Jugar como ${esc(a.n)}">${avIcon(avSkin(a))}${esc(a.n)}</button><button class="fe" data-ed="${a.id}" aria-label="Editar a ${esc(a.n)}">✎</button></div>`).join('')+'<button class="skin addf" id="avNew" aria-label="Crear un amigo"><b>+</b>Nuevo</button>';
  box.querySelectorAll('[data-av]').forEach(b=>b.onclick=()=>setAvatar(b.dataset.av)); box.querySelectorAll('[data-ed]').forEach(b=>b.onclick=()=>openAvEditor(b.dataset.ed)); $('avNew').onclick=()=>openAvEditor(null); }

/* ---- the editor: a live 3D preview and one row per choice ---- */
const AVE={a:null,isNew:false,r:null,sc:null,cam:null,rig:null,yaw:0.5,raf:0,drag:null};
function avPreviewInit(){ if(AVE.r) return; const cv=$('avCanvas'); AVE.r=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true}); AVE.r.setPixelRatio(Math.min(2,devicePixelRatio||1)); AVE.r.outputEncoding=THREE.sRGBEncoding;
  AVE.sc=new THREE.Scene(); AVE.sc.add(new THREE.HemisphereLight(0xffffff,0x8a9a7a,0.95)); const d=new THREE.DirectionalLight(0xffffff,0.75); d.position.set(3,5,4); AVE.sc.add(d);
  const fl=new THREE.Mesh(new THREE.CircleGeometry(0.9,32),new THREE.MeshLambertMaterial({color:Cc('#9fc27a')})); fl.rotation.x=-Math.PI/2; AVE.sc.add(fl);
  AVE.cam=new THREE.PerspectiveCamera(28,1,0.1,50);
  cv.addEventListener('pointerdown',e=>{ AVE.drag=e.clientX; try{ cv.setPointerCapture(e.pointerId); }catch(_){} }); cv.addEventListener('pointermove',e=>{ if(AVE.drag===null) return; AVE.yaw+=(e.clientX-AVE.drag)*0.012; AVE.drag=e.clientX; });
  ['pointerup','pointercancel'].forEach(t=>cv.addEventListener(t,()=>{ AVE.drag=null; })); }
function avPreviewRig(){ if(AVE.rig){ AVE.sc.remove(AVE.rig.root); } AVE.rig=buildRig(Object.assign(avSkin(AVE.a),{pack:null})); AVE.sc.add(AVE.rig.root); poseRig(AVE.rig,'idle',0,0); }
function avPreviewLoop(){ if($('avEd').hidden){ AVE.raf=0; return; } const cv=$('avCanvas'); const w=cv.clientWidth||300, h=cv.clientHeight||360; if(cv.width!==Math.round(w*AVE.r.getPixelRatio())){ AVE.r.setSize(w,h,false); AVE.cam.aspect=w/h; AVE.cam.updateProjectionMatrix(); }
  if(AVE.drag===null&&!reduceMotion) AVE.yaw+=0.006; const t=performance.now()/1000; poseRig(AVE.rig,'idle',t,0); AVE.rig.root.rotation.y=AVE.yaw;
  AVE.cam.position.set(0,1.05,4.6); AVE.cam.lookAt(0,0.92,0); AVE.r.render(AVE.sc,AVE.cam); AVE.raf=requestAnimationFrame(avPreviewLoop); }
function avFormHTML(){ const a=AVE.a; const seg=k=>`<div class="avrow"><span class="lbl">${AVO[k].l}</span><div class="avseg">${AVO[k].o.map((o,i)=>`<button data-k="${k}" data-v="${i}" class="${a[k]===i?'on':''}">${o}</button>`).join('')}</div></div>`;
  const sw=(k,pal,names,lbl)=>`<div class="avrow"><span class="lbl">${lbl}</span><div class="avsw">${pal.map((c,i)=>`<button data-k="${k}" data-v="${i}" class="${a[k]===i?'on':''}" style="background:${c}" aria-label="${names[i]}" title="${names[i]}"></button>`).join('')}</div></div>`;
  return `<div class="avrow"><span class="lbl">Nombre</span><input id="avName" maxlength="14" value="${esc(a.n)}" autocomplete="off"></div>`+seg('h')+seg('c')+sw('s',AV_SKIN,AV_SKIN_N,'Piel')+seg('hs')+sw('hc',AV_HAIR,AV_HAIR_N,'Color del pelo')+seg('f')+seg('g')+
    `<h3>Ropa</h3>`+seg('t')+sw('tc',AV_CL,AV_CL_N,'Color de arriba')+seg('p')+sw('pc',AV_CL,AV_CL_N,'Color del pantalón')+seg('w')+(a.w?sw('wc',AV_CL,AV_CL_N,'Color de la gorra o sombrero'):'')+sw('z',AV_CL,AV_CL_N,'Zapatos')+
    `<div class="row" style="margin-top:12px"><button class="btn primary" id="avPlay">Guardar y jugar con ${esc(a.n)}</button><button class="btn small" id="avSave">Guardar</button>${AVE.isNew?'':'<button class="btn small" id="avShare">Compartir</button><button class="btn small" id="avDel">Borrar</button>'}</div><p class="note" id="avMsg">Los avatares se guardan en este navegador. <b>Compartir</b> copia un enlace: quien lo abra en joaco.org recibe este avatar y juega con él; en una sala, los demás lo ven tal cual.</p>`; }
function avFormWire(){ const f=$('avForm');
  f.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{ AVE.a[b.dataset.k]=+b.dataset.v; const st=f.scrollTop; f.innerHTML=avFormHTML(); avFormWire(); f.scrollTop=st; avPreviewRig(); });
  $('avName').oninput=e=>{ AVE.a.n=e.target.value.replace(/[<>]/g,'').slice(0,14)||'Amigo'; $('avPlay').textContent='Guardar y jugar con '+AVE.a.n; };
  const save=()=>{ const a=avClean(AVE.a); const i=AVS.findIndex(x=>x.id===a.id); if(i>=0) AVS[i]=a; else AVS.push(a); avSave(); AVE.isNew=false; return a; };
  $('avSave').onclick=()=>{ const a=save(); if(S.av===a.id) setSkin(S.skin,a); renderFriends(); renderSkins(); $('avEd').hidden=true; toast('Guardado',a.n); };
  $('avPlay').onclick=()=>{ const a=save(); $('avEd').hidden=true; setAvatar(a.id); toast('Juegas como '+a.n,''); };
  const sh=$('avShare'); if(sh) sh.onclick=()=>{ const a=save(); const url=(SITE_URL||'https://joaco.org/')+'?amigo='+avCode(a); const msg=$('avMsg');
    const done=ok=>{ msg.innerHTML=(ok?'Enlace copiado. ':'Copia este enlace: ')+'<span style="-webkit-user-select:all;user-select:all;word-break:break-all">'+esc(url)+'</span>'; };
    try{ navigator.clipboard.writeText(url).then(()=>done(true),()=>done(false)); }catch(e){ done(false); } };
  const dl=$('avDel'); if(dl) dl.onclick=()=>{ if(dl.dataset.sure!=='1'){ dl.dataset.sure='1'; dl.textContent='Pulsa otra vez para borrar'; return; } AVS=AVS.filter(x=>x.id!==AVE.a.id); avSave(); if(S.av===AVE.a.id) setSkin(S.skin); $('avEd').hidden=true; renderFriends(); renderSkins(); }; }
function openAvEditor(id){ const a0=id?avById(id):null; AVE.isNew=!a0; AVE.a=a0?Object.assign({},a0):avClean({n:'Amigo '+(AVS.length+1),h:2,c:1,s:1,hs:0,hc:2,f:0,g:0,t:0,tc:3,p:0,pc:11,w:1,wc:0,z:0});
  $('avTitle').textContent=AVE.isNew?'Nuevo amigo':'Editar a '+AVE.a.n; $('avEd').hidden=false; S.overlay=true; avPreviewInit(); avPreviewRig(); $('avForm').innerHTML=avFormHTML(); avFormWire(); if(!AVE.raf) avPreviewLoop(); }
$('avClose').onclick=()=>{ $('avEd').hidden=true; S.overlay=false; };
// a friend's link: ?amigo=<code> adds that avatar and plays as it
function avFromURL(){ if(!WP.avatars) return; let c=null; try{ c=new URLSearchParams(location.search).get('amigo'); }catch(e){} if(!c) return; const a=avFromCode(c); if(!a) return;
  const same=AVS.find(x=>x.n===a.n&&AV_KEYS.every(k=>x[k]===a[k])); if(same) a.id=same.id; else { a.id='a'+Math.random().toString(36).slice(2,9); AVS.push(a); avSave(); }
  setAvatar(a.id); toast('Avatar de '+a.n,'Ya juegas con él; puedes cambiarlo en Avatares'); try{ history.replaceState(null,'',location.pathname); }catch(e){} }
function avatarsTabHTML(){ return `<p>Crea un avatar para cada amigo: altura, complexión, pelo, cara y ropa. Elige con quién juegas tocando su figura (en el inicio o aquí). En una sala, cada uno ve a los demás con su avatar.</p><div class="skins" id="friendsTab" style="grid-template-columns:repeat(auto-fill,minmax(74px,1fr))"></div>
  <h3>Recibir el avatar de un amigo</h3><p class="note">Pega aquí el enlace o el código que te ha mandado.</p><div class="row"><input class="mpin wide" id="avImport" placeholder="joaco.org/…?amigo=…" autocomplete="off"><button class="btn small" id="avImportBtn">Añadir</button></div><p class="note" id="avImpMsg"></p>`; }
function avatarsTabWire(){ const box=$('friendsTab'); box.innerHTML=AVS.map(a=>`<div class="fr ${a.id===S.av?'on':''}"><button class="skin" data-av="${a.id}">${avIcon(avSkin(a))}${esc(a.n)}</button><button class="fe" data-ed="${a.id}" aria-label="Editar a ${esc(a.n)}">✎</button></div>`).join('')+'<button class="skin addf" id="avNew2"><b>+</b>Nuevo</button>';
  box.querySelectorAll('[data-av]').forEach(b=>b.onclick=()=>{ setAvatar(b.dataset.av); avatarsTabWire(); }); box.querySelectorAll('[data-ed]').forEach(b=>b.onclick=()=>{ closeModal(); openAvEditor(b.dataset.ed); }); $('avNew2').onclick=()=>{ closeModal(); openAvEditor(null); };
  $('avImportBtn').onclick=()=>{ const a=avFromCode($('avImport').value); if(!a){ $('avImpMsg').textContent='Ese código no es un avatar válido.'; return; } a.id='a'+Math.random().toString(36).slice(2,9); AVS.push(a); avSave(); renderFriends(); avatarsTabWire(); $('avImpMsg').textContent='Añadido: '+a.n+'.'; }; }
