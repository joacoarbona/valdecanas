"""F1 · copia sin conexión (Valdecañas en joaco.org): python3 tools/test/pwa.py [WxH]
Sirve build/joaco_valdecanas en http://localhost:<puerto>/valdecanas/ (localhost cuenta como sitio seguro, así que el service worker funciona),
espera a que la copia esté entera, comprueba el manifiesto y los iconos, la pestaña «Sin conexión» y el botón del inicio,
recarga sin conexión (juego y tarjeta en directo), prueba que las salas avisan sin conexión y publica una versión nueva
para ver que solo baja lo que cambió, que sale «Versión nueva lista» y que «Actualizar» abre la nueva.
Las peticiones del service worker a cdnjs y jsdelivr se sirven desde node_modules (PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1)."""
import os, sys, json, time, shutil, threading, functools, http.server, socketserver, tempfile
os.environ['PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS']='1'
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from paths import BUILD, THREE128, QRCODE, OUTDIR
sys.path.insert(0,os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),'src','pwa'))
import pwa as PWA
from playwright.sync_api import sync_playwright
vw,vh=(sys.argv[1].split('x') if len(sys.argv)>1 else (1000,700))
WORLD=os.environ.get('PWA_W','valdecanas')   # PWA_W=casterton: joaco.org/sedberghprep
SC={'valdecanas':'valdecanas','casterton':'sedberghprep'}[WORLD]; PRE='vg-'+SC+'-'
ARGS={'valdecanas':('Isla de Valdecañas Golf','Valdecañas','prueba','es','island'),'casterton':('Casterton and the Lakes','Casterton','test','en','valley')}[WORLD]
site=tempfile.mkdtemp(); jo=os.path.join(site,SC); shutil.copytree(os.path.join(BUILD,'joaco_'+WORLD),jo)
hits=[]
class H(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*a): pass
    def end_headers(self): self.send_header('Cache-Control','public, max-age=0, must-revalidate'); super().end_headers()
    def do_GET(self): hits.append(self.path); super().do_GET()
H.extensions_map.update({'.webmanifest':'application/manifest+json','.js':'application/javascript'})
srv=socketserver.ThreadingTCPServer(('127.0.0.1',0),functools.partial(H,directory=site)); srv.daemon_threads=True; port=srv.server_address[1]
threading.Thread(target=srv.serve_forever,daemon=True).start()
BASE='http://localhost:%d/%s/'%(port,SC)
def show(k,v): print(k+'>',json.dumps(v,ensure_ascii=False)[:1400])
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ctx=b.new_context(viewport={'width':int(vw),'height':int(vh)}); logs=[]
    three=open(THREE128).read(); qr=open(QRCODE).read() if os.path.exists(QRCODE) else '/* qrcode */'
    ctx.route('https://cdnjs.cloudflare.com/**',lambda r: r.fulfill(body=three,content_type='application/javascript',headers={'Access-Control-Allow-Origin':'*'}))
    ctx.route('https://cdn.jsdelivr.net/**',lambda r: r.fulfill(body=qr,content_type='application/javascript',headers={'Access-Control-Allow-Origin':'*'}))
    ctx.route('https://fonts.**',lambda r: r.abort())
    ctx.add_init_script("try{localStorage.setItem('vg_q','med');localStorage.setItem('vg_snd','0');localStorage.setItem('vg_lang','"+os.environ.get('VG_LANG','es')+"')}catch(e){}")
    # another world's copy on the same site (joaco.org): it must survive this world's install, update and clearing
    if WORLD!='valdecanas': ctx.add_init_script("try{caches.open('vg-valdecanas-otro').then(c=>c.put('/valdecanas/otro',new Response('x')))}catch(e){}")
    pg=ctx.new_page(); pg.on('pageerror',lambda e: logs.append('PAGEERROR: '+str(e)))
    t0=time.time(); pg.goto(BASE); pg.wait_for_selector('#loading',state='hidden',timeout=300000); print('carga s',round(time.time()-t0,1)); pg.evaluate("__vg.setRender(false)")
    # 1 · the copy fills up by itself
    t0=time.time(); st=''
    while time.time()-t0<180:
        st=pg.evaluate("__vg.ofState()")
        if st=='ok': break
        time.sleep(1)
    r=pg.evaluate("""(async()=>{ const O=__vg.OF, ks=await caches.keys(); const c=await caches.open(ks.find(k=>k.startsWith('"""+PRE+"""'))); const all=await c.keys();
      const man=await (await fetch('manifest.webmanifest')).json(); const ic=await Promise.all(man.icons.map(i=>fetch(i.src).then(r=>r.status)));
      const head={manifest:!!document.querySelector('link[rel=manifest]'), appleIcon:!!document.querySelector('link[rel=apple-touch-icon]'), capable:!!document.querySelector('meta[name=apple-mobile-web-app-capable]')};
      return {estado:__vg.ofState(), version:O.av, archivos:O.n+' de '+O.tot, mb:O.mb, cachés:ks, enLaCache:all.length, tieneThree:all.some(q=>q.url.includes('three.min.js')), tieneTarjeta:all.some(q=>q.url.endsWith('/tarjeta/')), controlada:!!navigator.serviceWorker.controller,
        manifiesto:{name:man.name, short:man.short_name, start:man.start_url, scope:man.scope, display:man.display}, iconos:ic, head}; })()""")
    show('copia ('+str(round(time.time()-t0))+' s)',r)
    # 2 · start screen button and the tab
    r=pg.evaluate("""(()=>{ const v=__vg; const b=document.getElementById('mApp'); const s=b.querySelector('span').textContent; v.openModal('app'); const t=document.getElementById('sheetBody').textContent; const tab=[...document.querySelectorAll('#tabs button')].map(x=>x.textContent).includes('Sin conexión');
      const g=document.createElement('div'); v.openModal('glosario'); const gl=document.getElementById('sheetBody').textContent; v.openModal('guia'); const gu=document.getElementById('sheetBody').textContent;
      v.openModal('app'); return {boton:!b.hidden, botonDice:s, pestaña:tab, lista:t.includes('Lista para jugar sin conexión'), comoInstalar:t.includes('Añadir a pantalla de inicio'), queFunciona:t.includes('Qué funciona sin internet'), comoSeLee:t.includes('Cómo se lee el recuadro'), glosario:gl.includes('Copia sin conexión'), guia:gu.includes('Sin conexión (iPhone y iPad)')}; })()""")
    show('pestaña',r)
    pg.evaluate("__vg.setRender(true)"); pg.screenshot(path=os.path.join(OUTDIR,'f1_pestana.png')); pg.evaluate("__vg.setRender(false)")
    # 3 · without a connection: reload the game, the rooms say why they do not work, and the live scorecard
    ctx.set_offline(True); hits.clear(); t0=time.time()
    pg.reload(); pg.wait_for_selector('#loading',state='hidden',timeout=300000)
    r=pg.evaluate("""(async()=>{ const v=__vg; let w=0; while(v.ofState()!=='ok'&&w<60){ await new Promise(r=>setTimeout(r,500)); w++; } const b=document.getElementById('mApp').querySelector('span').textContent; await v.mpJoin('ABC123'); const e=v.MP.err; return {listaEn:w/2+' s', enLinea:navigator.onLine, controlada:!!navigator.serviceWorker.controller, estado:v.ofState(), botonDice:b, salas:e, isla:v.W&&!!v.W.terrain, hoyos:v.W.HOLES.length}; })()""")
    show('sin conexión ('+str(round(time.time()-t0,1))+' s, peticiones al servidor: '+str(len(hits))+')',r)
    pg.evaluate("__vg.setRender(true)"); pg.screenshot(path=os.path.join(OUTDIR,'f1_sin_conexion.png')); pg.evaluate("__vg.setRender(false)")
    r=pg.evaluate("""(()=>{ const v=__vg; v.startDrop(); v.jumpFromPlane(); v.landNow(); v.setPaused(true); v.tick(30,1/30); return {modo:v.S.mode, enLaIsla:v.P.y>-50}; })()""")
    show('jugar sin conexión',r)
    pc=ctx.new_page(); pc.on('pageerror',lambda e: logs.append('PAGEERROR tarjeta: '+str(e))); pc.goto(BASE+'tarjeta/'); time.sleep(5)
    show('tarjeta sin conexión',pc.evaluate("(()=>({titulo:document.title, vista:(document.getElementById('view')||{}).textContent?document.getElementById('view').textContent.slice(0,120):'', error:/No se pudiero/.test((document.getElementById('view')||document.body).textContent), hoyos:typeof CD!=='undefined'&&CD&&CD.holes?CD.holes.length:null}))()"))
    pc.close()
    # 4 · a new version: only what changed is downloaded, the bar says so, and «Actualizar» opens it
    ctx.set_offline(False)
    open(os.path.join(jo,'index.html'),'a').write('\n<!-- versión nueva de prueba -->\n')
    v2,_=PWA.build(jo,'/'+SC+'/',*ARGS); hits.clear()
    r=pg.evaluate("""(async()=>{ const v=__vg; v.ofCheckNow(); let t=0; while(!v.OF.wait&&t<120){ await new Promise(r=>setTimeout(r,500)); t++; v.ofUI(); } return {espera:t/2, nuevaLista:v.OF.wait, estado:v.ofState(), barra:!document.getElementById('ofBar').hidden, aviso:v.OF.chk, nueva:v.OF.nv}; })()""")
    data=[h for h in hits if '/data/' in h]
    show('versión nueva '+v2+' (descargas de datos: '+str(len(data))+', peticiones: '+str(sorted(set(hits)))[:300]+')',r)
    pg.evaluate("__vg.setRender(true)"); pg.screenshot(path=os.path.join(OUTDIR,'f1_version_nueva.png')); pg.evaluate("__vg.setRender(false)")
    try:
        with pg.expect_navigation(timeout=20000): pg.evaluate("document.getElementById('ofBarUp').click()")
    except Exception as e: print('sin recarga:',str(e)[:120])
    pg.wait_for_selector('#loading',state='hidden',timeout=300000); time.sleep(3)
    show('tras actualizar',pg.evaluate("(async()=>{ const v=__vg; let w=0; while(v.ofState()!=='ok'&&w<60){ await new Promise(r=>setTimeout(r,500)); w++; } return {estado:v.ofState(), version:v.OF.av, esperada:'"+v2+"', cachés:await caches.keys(), comentario:[...document.childNodes,...document.documentElement.childNodes,...document.body.childNodes].some(n=>n.nodeType===8&&n.data.includes('versión nueva de prueba'))}; })()"))
    # 5 · clearing the copy (two taps)
    show('borrar',pg.evaluate("(async()=>{ const v=__vg; await v.ofClear(); const a=v.ofState(); await v.ofClear(); await new Promise(r=>setTimeout(r,500)); return {primerToque:a, despues:v.ofState(), cachés:(await caches.keys()).filter(k=>k.startsWith('vg-'))}; })()"))
    show('copia del otro mundo',pg.evaluate("(async()=>(await caches.keys()))()"))
    print('\n'.join(logs[:20])); b.close()
srv.shutdown(); shutil.rmtree(site,ignore_errors=True)
