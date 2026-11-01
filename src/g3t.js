
/* ================= the screen at its normal size on phones ================= */
// iPhones zoom the page when a text box with small letters gets the focus, and on a double tap or a pinch outside the 3D view.
// The 3D view itself takes every gesture for the game (touch-action:none), so once zoomed there was no way to pinch back out.
// Now: text boxes at 16 px, no double tap or pinch zoom while playing, the drawing size follows the canvas (not the zoomed window),
// a "Volver al tamaño normal" button that shows up by itself when the page is zoomed or shifted, and «Ajustar pantalla» in the menu.
const FIT={pill:null,on:false,allow:0,iv:0};
const VP_GAME='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover';
function fitView(){ measureView(); const w=VIEW.w, h=VIEW.h; if(!w||!h) return; renderer.setSize(w,h,false); camera.aspect=w/h; camera.updateProjectionMatrix(); }
function pageZoom(){ const v=window.visualViewport; return v&&v.scale?v.scale:1; }
function typing(){ const a=document.activeElement; return !!a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)&&a.type!=='checkbox'; }
function pageShifted(){ const v=window.visualViewport; return Math.abs(window.scrollX||0)>2||Math.abs(window.scrollY||0)>2||(!!v&&v.scale<=1.01&&(Math.abs(v.offsetTop)>2||Math.abs(v.offsetLeft)>2)); }
function zoomAllowed(){ return pageZoom()>1.01||performance.now()<FIT.allow; }
function vpMeta(){ let m=document.querySelector('meta[name=viewport]'); if(!m){ m=document.createElement('meta'); m.name='viewport'; (document.head||document.documentElement).appendChild(m); } return m; }
// try to drop the zoom (works where the browser listens to the viewport tag), scroll back to the corner and resize the 3D view
function resetZoom(){ if(typing()) document.activeElement.blur(); const m=vpMeta();
  m.setAttribute('content','width=device-width,initial-scale=1.0,minimum-scale=1.0,maximum-scale=1.0,user-scalable=0'); setTimeout(()=>m.setAttribute('content',VP_GAME),350);
  window.scrollTo(0,0); fitView(); setTimeout(()=>{ window.scrollTo(0,0); fitView(); fitCheck(); },400); }
// «Ajustar pantalla» in the menu; inside the claude.ai viewer the zoom belongs to the app around the game, so pinching is let through for a few seconds
function fitScreen(){ FIT.allow=performance.now()+9000; resetZoom(); fitCheck();
  const framed=(()=>{ try{ return window.top!==window; }catch(e){ return true; } })();
  tip(framed||pageZoom()>1.01?'Pantalla ajustada. Si aún se ve ampliada, junta dos dedos sobre la pantalla para alejar (tienes unos segundos)':'Pantalla ajustada al tamaño normal',4500); }
function fitPill(){ if(FIT.pill) return FIT.pill; const p=document.createElement('div'); p.id='fitPill'; p.hidden=true; p.setAttribute('role','status');
  p.innerHTML='<div><b>Pantalla ampliada</b><small>o junta dos dedos para alejar</small></div><button type="button" id="fitBtn">Volver al tamaño normal</button>';
  document.body.appendChild(p); p.querySelector('#fitBtn').onclick=e=>{ e.stopPropagation(); FIT.allow=performance.now()+9000; resetZoom(); }; FIT.pill=p; return p; }
// the pill sits at the top of what you actually see, at its normal size even when the page is zoomed
function placePill(){ const p=FIT.pill; if(!p||p.hidden) return; const v=window.visualViewport; const s=v?v.scale:1, ox=v?v.offsetLeft:0, oy=v?v.offsetTop:0, w=v?v.width:innerWidth;
  p.style.maxWidth=Math.max(260,Math.round(w*s)-16)+'px'; p.style.transform='translate('+(ox+w/2).toFixed(1)+'px,'+(oy+10).toFixed(1)+'px) scale('+(1/s).toFixed(4)+') translateX(-50%)'; }
function fitCheck(){ const z=pageZoom(); document.documentElement.classList.toggle('vzoom',zoomAllowed());
  const bad=!typing()&&(z>1.02||pageShifted());
  if(bad!==FIT.on){ FIT.on=bad; fitPill().hidden=!bad; if(!bad) fitView(); }
  if(bad) placePill(); }
function fitInit(){ const m=vpMeta(); if(m.getAttribute('content')!==VP_GAME) m.setAttribute('content',VP_GAME);
  // no pinch or double-tap zoom while playing (pinching out stays possible whenever the page is already zoomed)
  for(const t of ['gesturestart','gesturechange']) document.addEventListener(t,e=>{ if(!zoomAllowed()) e.preventDefault(); },{passive:false});
  document.addEventListener('touchmove',e=>{ if(((e.touches&&e.touches.length>1)||(e.scale!==undefined&&e.scale!==1))&&!zoomAllowed()) e.preventDefault(); },{passive:false});
  document.addEventListener('dblclick',e=>e.preventDefault());
  const v=window.visualViewport; if(v){ v.addEventListener('resize',fitCheck); v.addEventListener('scroll',fitCheck); }
  addEventListener('orientationchange',()=>{ setTimeout(fitView,250); setTimeout(()=>{ fitView(); fitCheck(); },900); });
  // after typing (chat, room code, names) the keyboard leaves the page scrolled on some phones
  document.addEventListener('focusout',()=>setTimeout(()=>{ if(typing()) return; if(pageZoom()<=1.01){ window.scrollTo(0,0); } fitView(); fitCheck(); },150));
  if(window.ResizeObserver) new ResizeObserver(()=>fitView()).observe(canvas);
  // a slow safety net: the drawing size always matches the canvas
  FIT.iv=setInterval(()=>{ if(document.hidden) return; const w=VIEW.w, h=VIEW.h; measureView(); const pr=renderer.getPixelRatio();
    if(VIEW.w!==w||VIEW.h!==h||Math.abs(canvas.width-Math.floor(VIEW.w*pr))>2||Math.abs(canvas.height-Math.floor(VIEW.h*pr))>2) fitView(); fitCheck(); },800); }
