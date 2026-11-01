"""Ruins boxes (same seeded sequence as buildRuins in the game) + the 'before' still of view C without the windsurf boards."""
import os, re, mimetypes, json
from playwright.sync_api import sync_playwright
w='valdecanas'; HERE=os.path.dirname(os.path.abspath(__file__)); REPO=os.path.dirname(os.path.dirname(HERE)); BUILD=os.environ.get('PAGES_OUT', os.path.join(REPO,'build'))
src=os.path.join(BUILD,'publish_%s'%w,'index.html'); DATA=os.path.join(BUILD,'publish_%s'%w,'data')
html=open(src).read(); page_html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>'
three=open(os.path.join(REPO,'tools','test','node_modules','three','build','three.js')).read(); OUT=HERE
wsrc=open(os.path.join(REPO,'src','world_valdecanas.js')).read(); RU=json.loads(re.search(r'ruins:(\[\[.*?\]\])',wsrc,re.S).group(1))
def data_route(route):
    name=route.request.url.split('/data/')[-1].split('?')[0]; p=os.path.join(DATA,name)
    if not os.path.exists(p): route.fulfill(status=404, body='nf'); return
    route.fulfill(body=open(p,'rb').read(), content_type=mimetypes.guess_type(p)[0] or 'application/octet-stream')
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=b.new_page(viewport={'width':1280,'height':720})
    pg.route('**/three.min.js', lambda r: r.fulfill(body=three, content_type='application/javascript')); pg.route('https://fonts.**', lambda r: r.abort())
    pg.route('http://local/data/**', data_route); pg.route('http://local/', lambda r: r.fulfill(body=page_html, content_type='text/html'))
    pg.add_init_script("try{localStorage.setItem('vg_q','high');localStorage.setItem('vg_snd','0')}catch(e){}")
    pg.goto('http://local/'); pg.wait_for_selector('#loading', state='hidden', timeout=300000); pg.evaluate("__vg.setRender(false)")
    boxes=pg.evaluate("""(RU)=>{ const W=__vg.W, R=W.rng(77), out=[];
      for(const [x,z,a] of RU){ const g0=Math.min(W.terrain(x,z),W.terrain(x+4,z),W.terrain(x-4,z),W.terrain(x,z+4),W.terrain(x,z-4)); const fl=R()<0.55?2:1; const sx=12, sz=10;
        out.push([x,g0-0.6,z,sx,0.85,sz,a,0]);
        for(let k=1;k<=fl;k++){ const y=g0+0.25+k*3.1; out.push([x,y-0.3,z,sx,0.3,sz,a,0]); }
        const c=Math.cos(a), s=Math.sin(a);
        for(const lx of [-5.6,0,5.6]) for(const lz of [-4.6,4.6]) out.push([x+lx*c-lz*s,g0+0.25,z+lx*s+lz*c,0.35,fl*3.1-0.3,0.35,a,0]);
        if(R()<0.6){ const lz=R()<0.5?-4.7:4.7; out.push([x-lz*s,g0+0.25,z+lz*c,sx*0.8,2.4,0.25,a,1]); } }
      return out; }""", RU)
    json.dump(boxes,open(f'{OUT}/data/ruins.json','w')); print('ruin boxes',len(boxes))
    pose=pg.evaluate("""(()=>{ const v=__vg; v.setPaused(true); v.setTOD('tarde'); v.setWeather('despejado'); v.startDrop(); v.jumpFromPlane(); v.landNow(); v.goDrone(); v.orbit.auto=false;
      v.orbit.t.set(-1215,3,475); v.orbit.r=125; v.orbit.ph=1.29; v.orbit.th=2.36; v.orbit.tT=null; v.tick(45,1/30);
      for(const e of document.body.children) if(e.id!=='c') e.style.visibility='hidden';
      v.scene.traverse(o=>{ if(o.isInstancedMesh&&o.material&&o.material.color&&o.material.color.getHex()===0xffd34d) o.visible=false; });
      for(const J of v.JET.list) if(J.type==='wind'||J.type==='kite') J.g.visible=false;
      const c=v.camera; return {p:c.position.toArray(),q:c.quaternion.toArray(),fov:c.fov,near:c.near,far:c.far}; })()""")
    pg.evaluate("(()=>{ const v=__vg; if(v.snapExpo) v.snapExpo(); v.ppRender(1/30); return 1; })()"); pg.locator('#c').screenshot(path=f'{OUT}/before/still_C.png')
    meta=json.load(open(f'{OUT}/data/meta.json')); meta['poses']['C']=pose; json.dump(meta,open(f'{OUT}/data/meta.json','w')); print('pose C',pose['p'])
    b.close()
