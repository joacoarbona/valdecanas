"""Phone-like checks of the screen-fit code: viewport tag, 16 px inputs, canvas size after rotating, zoom pill and its reset (Chromium)."""
import sys, os, mimetypes, json, time
import os as _os, sys as _sys
_sys.path.insert(0,_os.path.dirname(_os.path.abspath(__file__)))
from paths import BUILD, THREE128, OUTDIR
from playwright.sync_api import sync_playwright
w=sys.argv[1]; VW=int(sys.argv[2]) if len(sys.argv)>2 else 390
src=os.path.join(BUILD,'publish_%s'%w,'index.html'); DATA=os.path.join(BUILD,'publish_%s'%w,'data')
html=open(src).read()
page_html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+html+'</body></html>'
three=open(THREE128).read()
def data_route(route):
    name=route.request.url.split('/data/')[-1].split('?')[0]; p=os.path.join(DATA,name)
    if not os.path.exists(p): route.fulfill(status=404, body='nf'); return
    route.fulfill(body=open(p,'rb').read(), content_type=mimetypes.guess_type(p)[0] or 'application/octet-stream')
def J(pg,code):
    r=pg.evaluate(code); print('js>', json.dumps(r, ensure_ascii=False)[:900]); return r
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    ctx=b.new_context(viewport={'width':VW,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg=ctx.new_page(); logs=[]
    pg.on('pageerror', lambda e: logs.append('PAGEERROR: '+str(e)))
    pg.route('**/three.min.js', lambda r: r.fulfill(body=three, content_type='application/javascript'))
    pg.route('https://fonts.**', lambda r: r.abort())
    pg.route('http://local/data/**', data_route)
    pg.route('http://local/', lambda r: r.fulfill(body=page_html, content_type='text/html'))
    pg.add_init_script("try{localStorage.setItem('vg_q','med');localStorage.setItem('vg_snd','0')}catch(e){}")
    pg.goto('http://local/'); pg.wait_for_selector('#loading', state='hidden', timeout=300000)
    J(pg,"(()=>{ const v=__vg; v.setRender(false); v.setPaused(true); v.startDrop(); v.jumpFromPlane(); v.landNow(); return [document.querySelector('meta[name=viewport]').content, v.VIEW.w, v.VIEW.h, document.getElementById('c').width, document.getElementById('c').height, Math.round(v.pageZoom()*100)/100]; })()")
    J(pg,"(()=>{ const ids=['pname','mpChatIn']; return ids.map(i=>{ const e=document.getElementById(i); return i+':'+(e?getComputedStyle(e).fontSize:'none'); }).concat([getComputedStyle(document.documentElement).touchAction, getComputedStyle(document.documentElement).webkitTextSizeAdjust||getComputedStyle(document.documentElement).textSizeAdjust]); })()")
    # rotate to landscape and back: the drawing buffer follows the canvas
    pg.set_viewport_size({'width':844,'height':390}); pg.wait_for_timeout(1200)
    J(pg,"(()=>{ const v=__vg, c=document.getElementById('c'); return ['landscape', v.VIEW.w, v.VIEW.h, c.width, c.height, +v.camera.aspect.toFixed(3)]; })()")
    pg.set_viewport_size({'width':390,'height':844}); pg.wait_for_timeout(1200)
    J(pg,"(()=>{ const v=__vg, c=document.getElementById('c'); return ['portrait', v.VIEW.w, v.VIEW.h, c.width, c.height, +v.camera.aspect.toFixed(3)]; })()")
    # a browser that zooms anyway (like an iPhone): pretend the visual viewport is zoomed and check the guards and the pill
    J(pg,"""(()=>{ const ev=t=>{ const e=new Event(t,{cancelable:true}); document.dispatchEvent(e); return e.defaultPrevented; };
      const tm=()=>{ const t1=new Touch({identifier:1,target:document.body,clientX:100,clientY:300}), t2=new Touch({identifier:2,target:document.body,clientX:200,clientY:400}); const e=new TouchEvent('touchmove',{touches:[t1,t2],cancelable:true,bubbles:true}); document.body.dispatchEvent(e); return e.defaultPrevented; };
      return ['not zoomed: gesture blocked', ev('gesturestart'), 'two-finger move blocked', tm(), 'canvas touch-action', getComputedStyle(document.getElementById('c')).touchAction]; })()""")
    J(pg,"""(()=>{ window.visualViewport={scale:1.03,offsetLeft:0,offsetTop:0,width:"""+str(VW)+"""/1.03,height:844,addEventListener(){}}; __vg.fitCheck(); const p=document.getElementById('fitPill'); const r=p.getBoundingClientRect();
      const ev=t=>{ const e=new Event(t,{cancelable:true}); document.dispatchEvent(e); return e.defaultPrevented; };
      return ['zoomed: pill shown', !p.hidden, [Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)], 'gesture blocked', ev('gesturestart'), 'class', document.documentElement.className, 'canvas touch-action', getComputedStyle(document.getElementById('c')).touchAction]; })()""")
    pg.screenshot(path=os.path.join(OUTDIR,'zoomed_pill_%d.png'%VW))
    J(pg,"""(()=>{ window.visualViewport={scale:2.2,offsetLeft:120,offsetTop:200,width:177,height:384,addEventListener(){}}; __vg.fitCheck(); const p=document.getElementById('fitPill'); return ['placed in the zoomed view', p.style.transform]; })()""")
    J(pg,"""(()=>{ document.getElementById('fitBtn').click(); return ['after tap', document.querySelector('meta[name=viewport]').content, document.documentElement.classList.contains('vzoom')]; })()""")
    pg.wait_for_timeout(700)
    J(pg,"""(()=>{ window.visualViewport={scale:1,offsetLeft:0,offsetTop:0,width:390,height:844,addEventListener(){}}; __vg.FIT.allow=0; __vg.fitCheck(); const p=document.getElementById('fitPill'); return ['back to normal: pill hidden', p.hidden, 'class', document.documentElement.className, 'tag', document.querySelector('meta[name=viewport]').content]; })()""")
    # the menu entry
    J(pg,"(()=>{ document.getElementById('btnMenu').click(); const b=document.getElementById('mFit'); if(!b) return 'no mFit'; b.click(); return ['menu', document.getElementById('tip').textContent, document.getElementById('modal').hidden]; })()")
    # typing in the chat and leaving it: page back at the corner
    J(pg,"(()=>{ const i=document.getElementById('mpChatIn'); return i?getComputedStyle(i).fontSize:'none'; })()")
    print('\n'.join(logs[:10])); b.close()
