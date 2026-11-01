"""Exports the scene around the beach spit from the current engine (terrain, water, trees, buildings, sun, camera poses)
and renders the 'before' stills and video frames with the current engine (three.js r128, WebGL)."""
import sys, os, mimetypes, json, time, math
from playwright.sync_api import sync_playwright
w='valdecanas'
HERE=os.path.dirname(os.path.abspath(__file__)); REPO=os.path.dirname(os.path.dirname(HERE)); BUILD=os.environ.get('PAGES_OUT', os.path.join(REPO,'build'))
src=os.path.join(BUILD,'publish_%s'%w,'index.html'); DATA=os.path.join(BUILD,'publish_%s'%w,'data')
html=open(src).read()
page_html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+html+'</body></html>'
three=open(os.path.join(REPO,'tools','test','node_modules','three','build','three.js')).read()
OUT=HERE
def data_route(route):
    name=route.request.url.split('/data/')[-1].split('?')[0]; p=os.path.join(DATA,name)
    if not os.path.exists(p): route.fulfill(status=404, body='nf'); return
    route.fulfill(body=open(p,'rb').read(), content_type=mimetypes.guess_type(p)[0] or 'application/octet-stream')
# viewpoints: drone orbit around a target (t), radius r, polar ph (from vertical), azimuth th
VIEWS={'A':dict(t=[-1230,3,470],r=330,ph=1.42,th=1.45),'B':dict(t=[-1180,6,600],r=210,ph=1.30,th=4.45)}
VID=dict(t=[-1230,3,470],r0=360,r1=290,ph0=1.43,ph1=1.40,th0=1.20,th1=1.72,n=int(sys.argv[1]) if len(sys.argv)>1 else 96)
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=b.new_page(viewport={'width':1280,'height':720}); logs=[]
    pg.on('pageerror', lambda e: logs.append('PAGEERROR: '+str(e)))
    pg.route('**/three.min.js', lambda r: r.fulfill(body=three, content_type='application/javascript'))
    pg.route('https://fonts.**', lambda r: r.abort())
    pg.route('http://local/data/**', data_route)
    pg.route('http://local/', lambda r: r.fulfill(body=page_html, content_type='text/html'))
    pg.add_init_script("try{localStorage.setItem('vg_q','high');localStorage.setItem('vg_snd','0')}catch(e){}")
    pg.goto('http://local/'); pg.wait_for_selector('#loading', state='hidden', timeout=300000)
    pg.evaluate("__vg.setRender(false)")
    print(pg.evaluate("""(()=>{ const v=__vg; v.setPaused(true); v.setTOD('tarde'); v.setWeather('despejado'); v.startDrop(); v.jumpFromPlane(); v.landNow(); v.goDrone(); v.orbit.auto=false; v.tick(5,1/30);
      for(const e of document.body.children) if(e.id!=='c') e.style.visibility='hidden'; let nb=0; v.scene.traverse(o=>{ if(o.isInstancedMesh&&o.material&&o.material.color&&o.material.color.getHex()===0xffd34d){ o.visible=false; nb++; } }); return [v.W.CORE, v.W.ORTHO, v.TOD.mode, 'beams hidden '+nb]; })()"""))
    # --- data export ---
    meta=pg.evaluate("""(()=>{ const v=__vg, W=v.W; const s=v.sun; const d=s.position.clone().sub(s.target.position).normalize();
      const R={x0:-1800,z0:-250,size:1500,step:2.5}; const n=Math.round(R.size/R.step)+1; const h=new Array(n*n), wl=new Array(n*n);
      for(let j=0;j<n;j++) for(let i=0;i<n;i++){ const x=R.x0+i*R.step, z=R.z0+j*R.step; h[j*n+i]=+W.terrain(x,z).toFixed(3); wl[j*n+i]=+W.waterLevel(x,z).toFixed(3); }
      const M={x0:-6000,z0:-6000,size:12000,step:30}; const m=Math.round(M.size/M.step)+1; const hm=new Array(m*m); for(let j=0;j<m;j++) for(let i=0;i<m;i++){ hm[j*m+i]=+W.terrain(M.x0+i*M.step,M.z0+j*M.step).toFixed(2); }
      const F={x0:-60000,z0:-60000,size:120000,step:400}; const f=Math.round(F.size/F.step)+1; const hf=new Array(f*f); for(let j=0;j<f;j++) for(let i=0;i<f;i++){ hf[j*f+i]=+W.terrain(F.x0+i*F.step,F.z0+j*F.step).toFixed(1); }
      return {CORE:W.CORE, ORTHO:W.ORTHO, sunDir:[d.x,d.y,d.z], sunColor:s.color.toArray(), sunI:s.intensity, near:{...R,n,h,wl}, mid:{...M,n:m,h:hm}, far:{...F,n:f,h:hf}}; })()""")
    # trees from the instanced chunks (canopy matrix -> centre and radii; trunk matrix -> base and height)
    trees=pg.evaluate("""(()=>{ const v=__vg, out=[]; const R={x0:-2100,z0:-550,x1:-100,z1:1550}; const m=new v.camera.matrix.constructor(), m2=new v.camera.matrix.constructor(); const pos=v.camera.position.clone(), q=v.camera.quaternion.clone(), sc=v.camera.position.clone(); const tp=pos.clone(), ts=sc.clone();
      for(const c of v.treeChunks){ const can=c.can, trk=c.trk, vc=c.hi.attributes.position.count; const col=can.instanceColor&&can.instanceColor.array;
        for(let i=0;i<can.count;i++){ can.getMatrixAt(i,m); m.decompose(pos,q,sc); const x=pos.x+can.position.x, z=pos.z+can.position.z; if(x<R.x0||x>R.x1||z<R.z0||z>R.z1) continue;
          trk.getMatrixAt(i,m2); m2.decompose(tp,q,ts); out.push([+x.toFixed(2),+pos.y.toFixed(2),+z.toFixed(2),+sc.x.toFixed(2),+sc.y.toFixed(2),+tp.y.toFixed(2),+ts.y.toFixed(2),+ts.x.toFixed(3),col?+col[i*3].toFixed(3):0.4,col?+col[i*3+1].toFixed(3):0.5,col?+col[i*3+2].toFixed(3):0.3,vc]); } }
      return out; })()""")
    blds=pg.evaluate("""(()=>{ const v=__vg, out=[]; for(const b of v.W.BUILDINGS){ if(!b.ring||!b.kind) continue; const x=b.c[0], z=b.c[1]; if(x<-2100||x>-100||z<-550||z>1550) continue;
      out.push({k:b.kind,f:b.f,ring:b.ring.map(p=>[+p[0].toFixed(2),+p[1].toFixed(2)]),holes:(b.holesO||[]).map(h=>h.map(p=>[+p[0].toFixed(2),+p[1].toFixed(2)])),y0:+b.floorY.toFixed(2),top:+b.top.toFixed(2),base:+b.base.toFixed(2)}); } return out; })()""")
    print('trees',len(trees),'buildings',len(blds),'tree vertex counts',sorted(set(t[11] for t in trees)))
    def cam_pose():
        return pg.evaluate("(()=>{ const c=__vg.camera; return {p:c.position.toArray(),q:c.quaternion.toArray(),fov:c.fov,near:c.near,far:c.far}; })()")
    def set_orbit(t,r,ph,th,ticks):
        pg.evaluate("(a)=>{ const v=__vg; v.orbit.t.set(a[0],a[1],a[2]); v.orbit.r=a[3]; v.orbit.ph=a[4]; v.orbit.th=a[5]; v.orbit.tT=null; v.tick(a[6],1/30); }",[t[0],t[1],t[2],r,ph,th,ticks])
    def shot(path):
        pg.evaluate("(()=>{ const v=__vg; if(v.snapExpo) v.snapExpo(); v.ppRender(1/30); return 1; })()")
        pg.locator('#c').screenshot(path=path, timeout=180000)
    poses={}
    for k,V in VIEWS.items():
        set_orbit(V['t'],V['r'],V['ph'],V['th'],45); poses[k]=cam_pose(); shot(f'{OUT}/before/still_{k}.png'); print('still',k,poses[k]['p'])
    # video frames (smaller)
    pg.set_viewport_size({'width':960,'height':540}); pg.wait_for_timeout(500); pg.evaluate("__vg.fitView&&__vg.fitView()")
    vid=[]; N=VID['n']
    set_orbit(VID['t'],VID['r0'],VID['ph0'],VID['th0'],45)
    for i in range(N):
        f=i/(N-1); e=f*f*(3-2*f)
        set_orbit(VID['t'],VID['r0']+(VID['r1']-VID['r0'])*e,VID['ph0']+(VID['ph1']-VID['ph0'])*e,VID['th0']+(VID['th1']-VID['th0'])*e,1)
        vid.append(cam_pose()); shot(f'{OUT}/before/v_{i:03d}.png')
        if i%16==0: print('frame',i,flush=True)
    meta['poses']=poses; meta['video']=vid; meta['stillSize']=[1280,720]; meta['videoSize']=[960,540]
    json.dump(meta,open(f'{OUT}/data/meta.json','w')); json.dump(trees,open(f'{OUT}/data/trees.json','w')); json.dump(blds,open(f'{OUT}/data/buildings.json','w'))
    print('\n'.join(logs[:10])); b.close()
