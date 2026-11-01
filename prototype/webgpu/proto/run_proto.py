"""Renders the new-engine prototype (WebGPU through SwiftShader) at the poses exported from the current engine.
usage: run_proto.py still [A B]  |  run_proto.py video N  |  run_proto.py test"""
import sys, os, json, mimetypes, time
from playwright.sync_api import sync_playwright
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__))); GAME=os.path.join(os.environ.get('PAGES_OUT', os.path.join(os.path.dirname(os.path.dirname(ROOT)),'build')),'publish_valdecanas','data')
mode=sys.argv[1] if len(sys.argv)>1 else 'test'
HTML='''<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#000;overflow:hidden}canvas{display:block}</style>
<script type="importmap">{"imports":{"three":"/three/build/three.webgpu.js","three/webgpu":"/three/build/three.webgpu.js","three/tsl":"/three/build/three.tsl.js","three/addons/":"/three/examples/jsm/"}}</script>
</head><body><script type="module" src="/proto.js"></script></body></html>'''
def route(r):
    path=r.request.url.split('localhost',1)[1].split('?')[0]
    if path in ('/','/proto.html'): return r.fulfill(body=HTML, content_type='text/html')
    if path=='/proto.js': return r.fulfill(body=open(ROOT+'/proto/proto.js','rb').read(), content_type='application/javascript')
    if path.startswith('/three/'): f=ROOT+'/node_modules/three/'+path[7:]
    elif path.startswith('/data/'): f=ROOT+'/data/'+path[6:]
    elif path.startswith('/gamedata/'): f=GAME+'/'+path[10:]
    else: return r.fulfill(status=404, body='nf')
    if not os.path.exists(f): return r.fulfill(status=404, body='nf')
    ct='application/javascript' if f.endswith('.js') else (mimetypes.guess_type(f)[0] or 'application/octet-stream')
    r.fulfill(body=open(f,'rb').read(), content_type=ct)
def open_page(p, w, h, pr, extra=''):
    b=p.chromium.launch(args=['--enable-unsafe-webgpu','--use-webgpu-adapter=swiftshader','--enable-features=Vulkan'])
    pg=b.new_page(viewport={'width':w,'height':h}); logs=[]
    pg.on('console', lambda m: logs.append(m.type+': '+m.text) if (m.type in ('error','warning') or '[proto]' in m.text) else None)
    pg.on('pageerror', lambda e: logs.append('PAGEERROR: '+str(e)))
    pg.route('http://localhost/**', route)
    t=time.time(); pg.goto(f'http://localhost/proto.html?w={w}&h={h}&pr={pr}{extra}')
    pg.wait_for_function('window.READY===true || window.FAILED', timeout=900000)
    print('ready in', round(time.time()-t,1),'s', pg.evaluate('window.BACKEND'), flush=True)
    for l in logs: print('  ', l[:300])
    logs.clear(); return b, pg, logs
meta=json.load(open(ROOT+'/data/meta.json'))
os.makedirs(ROOT+'/after', exist_ok=True)
with sync_playwright() as p:
    if mode in ('still','test'):
        keys=sys.argv[2:] or ['A','B']; w,h=meta['stillSize']; pr=float(os.environ.get('PR','2' if mode=='still' else '1'))
        b,pg,logs=open_page(p, w, h, pr, os.environ.get('EXTRA',''))
        for k in keys:
            t=time.time(); pg.evaluate('(a)=>window.renderPose(a[0],a[1])', [meta['poses'][k], 2.0])
            pg.locator('canvas').screenshot(path=f'{ROOT}/after/still_{k}{"_test" if mode=="test" else ""}.png', timeout=600000)
            print('still',k,round(time.time()-t,1),'s', flush=True)
            for l in logs: print('  ', l[:300])
            logs.clear()
        b.close()
    elif mode=='video':
        n=int(sys.argv[2]) if len(sys.argv)>2 else len(meta['video']); w,h=meta['videoSize']; pr=float(os.environ.get('PR','1.5'))
        b,pg,logs=open_page(p, w, h, pr, os.environ.get('EXTRA',''))
        start=int(os.environ.get('START','0'))
        for i in range(start, n):
            t=time.time(); pg.evaluate('(a)=>window.renderPose(a[0],a[1])', [meta['video'][i], i/30])
            pg.locator('canvas').screenshot(path=f'{ROOT}/after/v_{i:03d}.png', timeout=600000)
            if i%8==0: print('frame',i,round(time.time()-t,1),'s', flush=True)
        for l in logs[:10]: print('  ', l[:300])
        b.close()
