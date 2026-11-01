"""Two phones on the live scorecard through the in-test MQTT relay: python3 ct.py <world> <steps>
steps: 'A: js' / 'B: js', 'wait: ms', 'geo: A lat lon', 'shot: A name', 'goto: B url-suffix'"""
import sys, os, mimetypes, json, time
HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,os.path.dirname(HERE))
from paths import BUILD, THREE128, QRCODE, OUTDIR
from playwright.sync_api import sync_playwright
w=sys.argv[1]; steps=open(sys.argv[2]).read().split('\n'); base={'madrid':'golf-madrid','valdecanas':'valdecanas'}[w]
J=os.path.join(BUILD,'joaco_%s'%w); page_html=open(J+'/tarjeta/index.html').read(); game_html=open(J+'/index.html').read()
three=open(THREE128).read()
src=open(os.path.join(os.path.dirname(HERE),'mp2.py')).read(); exec(src[src.index('CONNS=[]'):src.index('with sync_playwright() as p:')])
def data_route(route):
    name=route.request.url.split('/data/')[-1].split('?')[0]; p=os.path.join(J,'data',name)
    if not os.path.exists(p): route.fulfill(status=404, body='nf'); return
    route.fulfill(body=open(p,'rb').read(), content_type=mimetypes.guess_type(p)[0] or 'application/octet-stream')
ORIG='http://localhost:8124'
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pages={}; logs=[]
    for k in 'AB':
        ctx=b.new_context(viewport={'width':400,'height':820},device_scale_factor=2,geolocation={'latitude':40.4519,'longitude':-3.7545,'accuracy':4},permissions=['geolocation'])
        pg=ctx.new_page(); pg.on('pageerror', lambda e,k=k: logs.append(k+' PAGEERROR: '+str(e)))
        pg.on('console', lambda m,k=k: logs.append(k+' console '+m.type+': '+m.text[:200]) if m.type=='error' else None)
        pg.route('**/qrcode.js', lambda r: r.fulfill(body=open(QRCODE).read() if os.path.exists(QRCODE) else '', content_type='application/javascript'))
        pg.route('**/three.min.js', lambda r: r.fulfill(body=three, content_type='application/javascript'))
        pg.route('https://fonts.**', lambda r: r.abort())
        pg.route(ORIG+'/'+base+'/data/**', data_route)
        pg.route(lambda u: u.startswith(ORIG+'/'+base+'/tarjeta/'), lambda r: r.fulfill(body=page_html, content_type='text/html'))
        pg.route(lambda u: u.startswith(ORIG+'/'+base+'/?') or u==ORIG+'/'+base+'/', lambda r: r.fulfill(body=game_html, content_type='text/html'))
        pg.route_web_socket(lambda u: 'mqtt' in u, mq_route)
        pages[k]=pg
    print('ready')
    VARS={}
    for st in steps:
        st=st.strip()
        for kk,vv in VARS.items(): st=st.replace('{{'+kk+'}}',vv)
        if not st or st.startswith('#'): continue
        k,_,a=st.partition(':'); a=a.strip()
        try:
            if k in ('A','B'):
                r=pages[k].evaluate(a)
                if isinstance(r,str) and r.startswith('VAR:'): kk,_,vv=r[4:].partition('='); VARS[kk]=vv
                if r is not None: print(k+'>', json.dumps(r, ensure_ascii=False)[:1500])
            elif k=='goto':
                who,suf=a.split(' ',1); pages[who].goto(ORIG+'/'+base+'/'+suf); pages[who].wait_for_timeout(800)
            elif k=='wait': pages['A'].wait_for_timeout(int(a))
            elif k=='geo':
                who,la,lo=a.split(); pages[who].context.set_geolocation({'latitude':float(la),'longitude':float(lo),'accuracy':4})
            elif k=='shot':
                who,name=a.split(); g=pages[who].evaluate("(()=>{ if(window.__vg){ try{ __vg.snapExpo&&__vg.snapExpo(); }catch(e){} __vg.ppRender(1/30); return 1; } return 0; })()")
                pages[who].screenshot(path=os.path.join(OUTDIR,name+'.png'), full_page=not g, timeout=180000); print('shot',name)
        except Exception as e: print('FAIL', st[:70], str(e)[:400])
    print('\n'.join(logs[:20])); b.close()
