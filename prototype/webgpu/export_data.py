"""Data-only export over the whole island (relief 4 m, water levels, all trees and buildings); keeps the poses from meta.json."""
import os, mimetypes, json
from playwright.sync_api import sync_playwright
w='valdecanas'; HERE=os.path.dirname(os.path.abspath(__file__)); REPO=os.path.dirname(os.path.dirname(HERE)); BUILD=os.environ.get('PAGES_OUT', os.path.join(REPO,'build'))
src=os.path.join(BUILD,'publish_%s'%w,'index.html'); DATA=os.path.join(BUILD,'publish_%s'%w,'data')
html=open(src).read(); page_html='<!doctype html><html><head><meta charset="utf-8"></head><body>'+html+'</body></html>'
three=open(os.path.join(REPO,'tools','test','node_modules','three','build','three.js')).read(); OUT=HERE
def data_route(route):
    name=route.request.url.split('/data/')[-1].split('?')[0]; p=os.path.join(DATA,name)
    if not os.path.exists(p): route.fulfill(status=404, body='nf'); return
    route.fulfill(body=open(p,'rb').read(), content_type=mimetypes.guess_type(p)[0] or 'application/octet-stream')
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':800,'height':500})
    pg.route('**/three.min.js', lambda r: r.fulfill(body=three, content_type='application/javascript')); pg.route('https://fonts.**', lambda r: r.abort())
    pg.route('http://local/data/**', data_route); pg.route('http://local/', lambda r: r.fulfill(body=page_html, content_type='text/html'))
    pg.add_init_script("try{localStorage.setItem('vg_q','high');localStorage.setItem('vg_snd','0')}catch(e){}")
    pg.goto('http://local/'); pg.wait_for_selector('#loading', state='hidden', timeout=300000); pg.evaluate("__vg.setRender(false)")
    pg.evaluate("(()=>{ const v=__vg; v.setPaused(true); v.setTOD('tarde'); v.startDrop(); v.jumpFromPlane(); v.landNow(); v.goDrone(); v.tick(5,1/30); return 1; })()")
    d=pg.evaluate("""(()=>{ const v=__vg, W=v.W;
      const R={x0:-2000,z0:-1400,size:3000,step:4}; const n=Math.round(R.size/R.step)+1; const h=new Array(n*n), wl=new Array(n*n);
      for(let j=0;j<n;j++) for(let i=0;i<n;i++){ const x=R.x0+i*R.step, z=R.z0+j*R.step; h[j*n+i]=+W.terrain(x,z).toFixed(2); wl[j*n+i]=+W.waterLevel(x,z).toFixed(2); }
      const M={x0:-7000,z0:-7000,size:14000,step:35}; const m=Math.round(M.size/M.step)+1; const hm=new Array(m*m); for(let j=0;j<m;j++) for(let i=0;i<m;i++) hm[j*m+i]=+W.terrain(M.x0+i*M.step,M.z0+j*M.step).toFixed(2);
      const F={x0:-70000,z0:-70000,size:140000,step:500}; const f=Math.round(F.size/F.step)+1; const hf=new Array(f*f); for(let j=0;j<f;j++) for(let i=0;i<f;i++) hf[j*f+i]=+W.terrain(F.x0+i*F.step,F.z0+j*F.step).toFixed(1);
      const m4=new v.camera.matrix.constructor(), m5=new v.camera.matrix.constructor(); const pos=v.camera.position.clone(), q=v.camera.quaternion.clone(), sc=v.camera.position.clone(), tp=pos.clone(), ts=sc.clone(); const trees=[];
      for(const c of v.treeChunks){ const can=c.can, trk=c.trk, vc=c.hi.attributes.position.count, col=can.instanceColor&&can.instanceColor.array;
        for(let i=0;i<can.count;i++){ can.getMatrixAt(i,m4); m4.decompose(pos,q,sc); trk.getMatrixAt(i,m5); m5.decompose(tp,q,ts);
          trees.push([+(pos.x+can.position.x).toFixed(2),+pos.y.toFixed(2),+(pos.z+can.position.z).toFixed(2),+sc.x.toFixed(2),+sc.y.toFixed(2),+tp.y.toFixed(2),+ts.y.toFixed(2),+ts.x.toFixed(3),col?+col[i*3].toFixed(3):0.4,col?+col[i*3+1].toFixed(3):0.5,col?+col[i*3+2].toFixed(3):0.3,vc]); } }
      const blds=[]; for(const b of W.BUILDINGS){ if(!b.ring||!b.kind) continue; blds.push({k:b.kind,f:b.f,ring:b.ring.map(p=>[+p[0].toFixed(2),+p[1].toFixed(2)]),holes:(b.holesO||[]).map(h=>h.map(p=>[+p[0].toFixed(2),+p[1].toFixed(2)])),y0:+b.floorY.toFixed(2),top:+b.top.toFixed(2),base:+b.base.toFixed(2)}); }
      return {near:{...R,n,h,wl}, mid:{...M,n:m,h:hm}, far:{...F,n:f,h:hf}, trees, blds}; })()""")
    meta=json.load(open(f'{OUT}/data/meta.json'))
    meta['near']=d['near']; meta['mid']=d['mid']; meta['far']=d['far']
    json.dump(meta,open(f'{OUT}/data/meta.json','w')); json.dump(d['trees'],open(f'{OUT}/data/trees.json','w')); json.dump(d['blds'],open(f'{OUT}/data/buildings.json','w'))
    print('near n',d['near']['n'],'trees',len(d['trees']),'buildings',len(d['blds'])); b.close()
