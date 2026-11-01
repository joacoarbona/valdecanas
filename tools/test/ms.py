"""Multi-step runner: python3 ms.py <world> <steps.txt> [WxH]
steps.txt: lines 'js: <code>' (evaluated, printed if not null), 'tick: n' (n frames of 1/30 s), 'shot: name' (renders and saves tools/test/out/name.png)."""
import sys, os, mimetypes, json, time
import os as _os, sys as _sys
_sys.path.insert(0,_os.path.dirname(_os.path.abspath(__file__)))
from paths import BUILD, THREE128, OUTDIR
from playwright.sync_api import sync_playwright
w=sys.argv[1]; steps=open(sys.argv[2]).read().split('\n'); vw,vh=(sys.argv[3].split('x') if len(sys.argv)>3 else (1000,620))
src=os.path.join(BUILD,'publish_%s'%w,'index.html'); DATA=os.path.join(BUILD,'publish_%s'%w,'data')
html=open(src).read()
page_html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+html+'</body></html>'
three=open(THREE128).read()
def data_route(route):
    name=route.request.url.split('/data/')[-1].split('?')[0]; p=os.path.join(DATA,name)
    if not os.path.exists(p): route.fulfill(status=404, body='nf'); return
    route.fulfill(body=open(p,'rb').read(), content_type=mimetypes.guess_type(p)[0] or 'application/octet-stream')
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=b.new_page(viewport={'width':int(vw),'height':int(vh)}); logs=[]
    pg.on('pageerror', lambda e: logs.append('PAGEERROR: '+str(e)))
    pg.on('console', lambda m: logs.append('console '+m.type+': '+m.text) if m.type in ('error','warning') else None)
    pg.route('**/three.min.js', lambda r: r.fulfill(body=three, content_type='application/javascript'))
    pg.route('https://fonts.**', lambda r: r.abort())
    pg.route('http://local/data/**', data_route)
    pg.route('http://local/', lambda r: r.fulfill(body=page_html, content_type='text/html'))
    pg.add_init_script("try{localStorage.setItem('vg_q','med');localStorage.setItem('vg_snd','0')}catch(e){}")
    pg.goto('http://local/'); t0=time.time(); pg.wait_for_selector('#loading', state='hidden', timeout=300000)
    print('load s', round(time.time()-t0,1)); pg.evaluate("__vg.setRender(false)")
    for st in steps:
        st=st.strip()
        if not st or st.startswith('#'): continue
        k,_,a=st.partition(':'); a=a.strip()
        try:
            if k=='js':
                r=pg.evaluate(a)
                if r is not None: print('js>', json.dumps(r, ensure_ascii=False)[:1500])
            elif k=='tick': pg.evaluate("__vg.tick(%d,1/30)"%int(a))
            elif k=='shot':
                pg.evaluate("(()=>{ const v=__vg; if(v.snapExpo) v.snapExpo(); v.ppRender(1/30); return 1; })()")
                pg.screenshot(path=os.path.join(OUTDIR,a+'.png'), timeout=180000); print('shot', a)
        except Exception as e: print('FAIL', st[:80], str(e)[:400])
    print('\n'.join(logs[:20])); b.close()
