"""Two phones on the live scorecard through the in-test MQTT relay: python3 ct.py <world> <steps>
steps: 'A: js' / 'B: js' (/ 'C: js', a third phone if any step uses it), 'wait: ms', 'geo: A lat lon', 'shot: A name', 'goto: B url-suffix',
'cloud: off|on|dump|limit n' (the group's cloud is a copy of the Supabase functions of src/card/nube.sql, in memory)"""
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
# ---- the group's cloud: the five functions of src/card/nube.sql, same rules, in memory ----
import hashlib, re, datetime
NBS={'groups':{}, 'rows':{}, 'off':False, 'limit':600, 'calls':[]}
def nb_now(): return datetime.datetime.now(datetime.timezone.utc)
def nb_iso(t): return t.isoformat()
def nb_norm(c): return re.sub(r'[^A-Za-z0-9]','',c or '').upper()
def nb_hash(c): return hashlib.sha256(('golf-nube/v1/'+nb_norm(c)).encode()).hexdigest()
class NbErr(Exception): pass
def nb_group(code):
    c=nb_norm(code)
    if len(c)<16 or len(c)>40: raise NbErr('codigo-no-valido')
    g=NBS['groups'].get(nb_hash(c))
    if not g: raise NbErr('grupo-no-existe')
    return g
NBID=re.compile(r'^[A-Za-z0-9_.:-]{1,80}$'); NBK=re.compile(r'^[a-z0-9]{1,12}$'); NBD=re.compile(r'^[a-z0-9]{4,32}$')
def nb_call(fn,a):
    R=NBS['rows']
    if fn=='golf_crear':
        c=nb_norm(a.get('p_code'))
        if len(c)<16 or len(c)>40: raise NbErr('codigo-no-valido')
        n=re.sub(r'\s+',' ',a.get('p_nombre') or '').strip()[:60] or 'Mi grupo de golf'
        h=nb_hash(c)
        if h in NBS['groups']: raise NbErr('grupo-ya-existe')
        NBS['groups'][h]={'id':h[:12],'nombre':n,'creado':nb_iso(nb_now())}; return {'nombre':n,'rondas':0,'moviles':0}
    g=nb_group(a.get('p_code')); gid=g['id']
    mine=lambda: [r for (gg,i,d),r in R.items() if gg==gid]
    if fn=='golf_ver':
        live=[r for r in mine() if not r['b']]
        return {'nombre':g['nombre'],'creado':g['creado'],'rondas':len({r['id'] for r in live}),'moviles':len({r['dev'] for r in live})}
    dev=a.get('p_dev') or ''
    if fn in ('golf_subir','golf_borrar') and not NBD.match(dev): raise NbErr('movil-no-valido')
    if fn=='golf_subir':
        L=a.get('p_rondas')
        if not isinstance(L,list) or len(L)>40: raise NbErr('lote-no-valido')
        n=0; b=[]
        for e in L:
            i=e.get('id') if isinstance(e,dict) else None
            if not isinstance(e,dict) or not isinstance(e.get('data'),dict) or not NBID.match(i or '') or not NBK.match(e.get('k') or '') or len(json.dumps(e['data']))>=200000: continue
            if any(r['b'] for r in mine() if r['id']==i):
                if str(e.get('r','')) in ('1','true','True'):
                    for key in [key for key,r in R.items() if key[0]==gid and key[1]==i]: del R[key]
                else: b.append(i); continue
            if (gid,i,dev) not in R and len(mine())>=6000: raise NbErr('grupo-lleno')
            R[(gid,i,dev)]={'id':i,'dev':dev,'k':e['k'],'data':e['data'],'b':False,'upd':nb_now()}; n+=1
        return {'n':n,'borradas':b}
    if fn=='golf_borrar':
        L=a.get('p_rondas')
        if not isinstance(L,list) or len(L)>100: raise NbErr('lote-no-valido')
        n=0
        for e in L:
            i=e.get('id'); 
            if not NBID.match(i or '') or not NBK.match(e.get('k') or ''): continue
            hit=[r for r in mine() if r['id']==i]
            for r in hit: r.update(b=True,data=None,upd=nb_now())
            if not hit: R[(gid,i,dev)]={'id':i,'dev':dev,'k':e['k'],'data':None,'b':True,'upd':nb_now()}
            n+=1
        return {'n':n}
    if fn=='golf_bajar':
        now=nb_now(); d=a.get('p_desde')
        if d: d=datetime.datetime.fromisoformat(d.replace('Z','+00:00')) - (datetime.timedelta(0) if a.get('p_seguir') else datetime.timedelta(seconds=30))
        rows=sorted([r for r in mine() if (r['dev']!=dev or r['b']) and (d is None or r['upd']>=d)], key=lambda r:(r['upd'],r['id'],r['dev']))[:NBS['limit']]
        out=[{k:v for k,v in {'id':r['id'],'dev':r['dev'],'k':r['k'],'b':r['b'],'data':r['data']}.items() if v is not None} for r in rows]
        return {'ahora':nb_iso(now),'nombre':g['nombre'],'mas':len(rows)>=NBS['limit'],'ultimo':nb_iso(rows[-1]['upd']) if rows else None,'rondas':out}
    raise NbErr('PGRST202 no existe '+fn)
CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'apikey, content-type, authorization','Access-Control-Allow-Methods':'POST, OPTIONS'}
def nb_route(route):
    req=route.request
    if req.method=='OPTIONS': route.fulfill(status=204, headers=CORS); return
    if NBS['off']: route.abort('internetdisconnected'); return
    fn=req.url.split('/rpc/')[-1].split('?')[0]
    try: a=json.loads(req.post_data or '{}')
    except Exception: a={}
    NBS['calls'].append(fn)
    if req.headers.get('apikey','')[:15]!='sb_publishable_': route.fulfill(status=401, body='{"message":"No API key found in request"}', headers=CORS, content_type='application/json'); return
    try: route.fulfill(status=200, body=json.dumps(nb_call(fn,a)), headers=CORS, content_type='application/json')
    except NbErr as e: route.fulfill(status=400, body=json.dumps({'code':'P0001','message':str(e)}), headers=CORS, content_type='application/json')
with sync_playwright() as p:
    b=p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pages={}; logs=[]
    for k in ('ABC' if any(l.strip().startswith('C:') for l in steps) else 'AB'):
        ctx=b.new_context(viewport={'width':400,'height':820},device_scale_factor=2,geolocation={'latitude':40.4519,'longitude':-3.7545,'accuracy':4},permissions=['geolocation'])
        pg=ctx.new_page(); pg.on('pageerror', lambda e,k=k: logs.append(k+' PAGEERROR: '+str(e)))
        pg.on('console', lambda m,k=k: logs.append(k+' console '+m.type+': '+m.text[:200]) if m.type=='error' else None)
        pg.route('**/qrcode.js', lambda r: r.fulfill(body=open(QRCODE).read() if os.path.exists(QRCODE) else '', content_type='application/javascript'))
        pg.route('**/three.min.js', lambda r: r.fulfill(body=three, content_type='application/javascript'))
        pg.route('https://fonts.**', lambda r: r.abort())
        pg.route('https://api.open-meteo.com/**', lambda r: r.fulfill(body=json.dumps({'current':{'wind_speed_10m':18.4,'wind_direction_10m':0,'wind_gusts_10m':31}}), content_type='application/json'))  # G2: a north wind of 18 km/h
        pg.route(ORIG+'/'+base+'/data/**', data_route)
        pg.route(lambda u: u.startswith(ORIG+'/'+base+'/tarjeta/'), lambda r: r.fulfill(body=page_html, content_type='text/html'))
        pg.route(lambda u: u.startswith(ORIG+'/'+base+'/?') or u==ORIG+'/'+base+'/', lambda r: r.fulfill(body=game_html, content_type='text/html'))
        pg.route_web_socket(lambda u: 'mqtt' in u, mq_route)
        pg.route('https://*.supabase.co/rest/v1/rpc/**', nb_route)
        pages[k]=pg
    print('ready')
    VARS={}
    for st in steps:
        st=st.strip()
        for kk,vv in VARS.items(): st=st.replace('{{'+kk+'}}',vv)
        if not st or st.startswith('#'): continue
        k,_,a=st.partition(':'); a=a.strip()
        try:
            if k in ('A','B','C'):
                r=pages[k].evaluate(a)
                if isinstance(r,str) and r.startswith('VAR:'): kk,_,vv=r[4:].partition('='); VARS[kk]=vv
                if r is not None: print(k+'>', json.dumps(r, ensure_ascii=False)[:1500])
            elif k=='goto':
                who,suf=a.split(' ',1); pages[who].goto(ORIG+'/'+base+'/'+suf); pages[who].wait_for_timeout(800)
            elif k=='wait': pages['A'].wait_for_timeout(int(a))
            elif k=='cloud':
                if a in ('off','on'): NBS['off']=(a=='off'); print('cloud', a)
                elif a.startswith('limit'): NBS['limit']=int(a.split()[1]); print('cloud limit', NBS['limit'])
                elif a=='dump':
                    rows=list(NBS['rows'].values()); print('cloud>', json.dumps({'grupos':[g['nombre'] for g in NBS['groups'].values()],'filas':len(rows),'partidas':sorted({r['id'] for r in rows if not r['b']}),'borradas':sorted({r['id'] for r in rows if r['b']}),'moviles':sorted({r['dev'] for r in rows}),'llamadas':{f:NBS['calls'].count(f) for f in set(NBS['calls'])}}, ensure_ascii=False))
            elif k=='geo':
                who,la,lo=a.split(); pages[who].context.set_geolocation({'latitude':float(la),'longitude':float(lo),'accuracy':4})
            elif k=='shot':
                who,name=a.split(); g=pages[who].evaluate("(()=>{ if(window.__vg){ try{ __vg.snapExpo&&__vg.snapExpo(); }catch(e){} __vg.ppRender(1/30); return 1; } return 0; })()")
                pages[who].screenshot(path=os.path.join(OUTDIR,name+'.png'), full_page=not g, timeout=180000); print('shot',name)
        except Exception as e: print('FAIL', st[:70], str(e)[:400])
    print('\n'.join(logs[:20])); b.close()
