"""Players in a room through a local MQTT broker: python3 mp2.py <world> <steps>
steps: lines 'A: js' / 'B: js' / 'C: js' (evaluated in that page), 'wait: ms', 'shot: A|B|C name'.
Pages A and B always open; C opens when a step uses it (three players). 'view: C 390x844' sets a page's window size (default 900x560)."""
import sys, os, mimetypes, json, time
import os as _os, sys as _sys
_sys.path.insert(0,_os.path.dirname(_os.path.abspath(__file__)))
from paths import BUILD, THREE128, OUTDIR
from playwright.sync_api import sync_playwright
w=sys.argv[1]; steps=open(sys.argv[2]).read().split('\n')
src=os.path.join(BUILD,'publish_%s'%w,'index.html'); DATA=os.path.join(BUILD,'publish_%s'%w,'data')
html=open(src).read(); page_html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'+html+'</body></html>'
three=open(THREE128).read()
def data_route(route):
    name=route.request.url.split('/data/')[-1].split('?')[0]; p=os.path.join(DATA,name)
    if not os.path.exists(p): route.fulfill(status=404, body='nf'); return
    route.fulfill(body=open(p,'rb').read(), content_type=mimetypes.guess_type(p)[0] or 'application/octet-stream')

# a tiny MQTT 3.1.1 broker inside the test (QoS 0, exact topics): the pages' WebSockets are routed here
CONNS=[]
def mq_len(b,i):
    mul=1; n=0
    while True:
        if i>=len(b): return None,None
        x=b[i]; i+=1; n+=(x&127)*mul; mul*=128
        if not x&128: return n,i
def mq_route(ws):
    c={'ws':ws,'subs':set(),'buf':b'','will':None,'clean':False}; CONNS.append(c)
    def deliver(topic,raw):
        for o in list(CONNS):
            if topic in o['subs']:
                try: o['ws'].send(raw)
                except Exception: pass
    def on_msg(m):
        if isinstance(m,str): return
        c['buf']+=m; b=c['buf']; p=0
        while len(b)-p>=2:
            n,i=mq_len(b,p+1)
            if n is None or len(b)-i<n: break
            h=b[p]; d=b[i:i+n]; raw=b[p:i+n]; p=i+n; t=h>>4
            if t==1:
                fl=d[7]; k=10; L=(d[k]<<8)|d[k+1]; k+=2+L
                if fl&4:
                    L=(d[k]<<8)|d[k+1]; wt=d[k+2:k+2+L].decode(); k+=2+L; L=(d[k]<<8)|d[k+1]; wp=d[k+2:k+2+L]; k+=2+L; c['will']=(wt,wp)
                ws.send(bytes([0x20,2,0,0]))
            elif t==8:
                pid=d[0:2]; k=2; n2=0
                while k<len(d):
                    L=(d[k]<<8)|d[k+1]; c['subs'].add(d[k+2:k+2+L].decode()); k+=3+L; n2+=1
                ws.send(bytes([0x90,2+n2])+pid+bytes(n2))
            elif t==3:
                L=(d[0]<<8)|d[1]; deliver(d[2:2+L].decode(),raw)
            elif t==12: ws.send(bytes([0xD0,0]))
            elif t==14: c['clean']=True
        c['buf']=b[p:]
    def on_close(code=None,reason=None):
        if c in CONNS: CONNS.remove(c)
        if c['will'] and not c['clean']:
            wt,wp=c['will']; body=bytes([len(wt.encode())>>8,len(wt.encode())&255])+wt.encode()+wp; ln=len(body); lb=[]
            while True:
                x=ln%128; ln//=128
                if ln: x|=128
                lb.append(x)
                if not ln: break
            deliver(wt,bytes([0x30]+lb)+body)
    ws.on_message(on_msg); ws.on_close(on_close)
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pages={}; logs=[]
    who=['A','B']+(['C'] if any(l.strip().startswith('C:') for l in steps) else [])
    views={}
    for l in steps:
        if l.strip().startswith('view:'):
            k2,sz=l.split(':',1)[1].split(); vw,vh=sz.split('x'); views[k2]=(int(vw),int(vh))
    for k in who:
        vw,vh=views.get(k,(900,560))
        ctx=b.new_context(viewport={'width':vw,'height':vh}, is_mobile=vw<600, has_touch=vw<600); pg=ctx.new_page()
        pg.on('pageerror', lambda e,k=k: logs.append(k+' PAGEERROR: '+str(e)))
        pg.route('**/three.min.js', lambda r: r.fulfill(body=three, content_type='application/javascript'))
        pg.route('https://fonts.**', lambda r: r.abort())
        pg.route('http://localhost:8124/data/**', data_route)
        pg.route(lambda u: u.startswith('http://localhost:8124/') and '/data/' not in u and 'three' not in u, lambda r: r.fulfill(body=page_html, content_type='text/html'))
        pg.add_init_script("try{localStorage.setItem('vg_q','med');localStorage.setItem('vg_snd','0');localStorage.setItem('vg_name','Jugador "+k+"')}catch(e){}")
        pg.route_web_socket('ws://localhost:8883/mqtt', mq_route)
        pg.goto('http://localhost:8124/?broker=ws://localhost:8883/mqtt'); pages[k]=pg
    for k,pg in pages.items(): pg.wait_for_selector('#loading', state='hidden', timeout=300000); pg.evaluate("__vg.setRender(false)")
    print('loaded')
    for st in steps:
        st=st.strip()
        if not st or st.startswith('#') or st.startswith('view:'): continue
        k,_,a=st.partition(':'); a=a.strip()
        try:
            if k in pages:
                r=pages[k].evaluate(a)
                if r is not None: print(k+'>', json.dumps(r, ensure_ascii=False)[:1200])
            elif k=='wait': pages['A'].wait_for_timeout(int(a))
            elif k=='shot':
                who,name=a.split()
                pages[who].evaluate("(()=>{ const v=__vg; if(v.snapExpo) v.snapExpo(); v.ppRender(1/30); return 1; })()")
                pages[who].screenshot(path=os.path.join(OUTDIR,name+'.png'), timeout=180000); print('shot',name)
        except Exception as e: print('FAIL', st[:70], str(e)[:300])
    print('\n'.join(logs[:20])); b.close()
