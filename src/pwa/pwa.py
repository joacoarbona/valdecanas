"""F1 · copia sin conexión (fase 1 del plan iPhone): manifiesto, iconos y service worker de la copia de joaco.org.
build_pages.py la llama después de escribir build/joaco_<mundo>/ (index.html, data/ y tarjeta/)."""
import os, json, hashlib, glob
E=os.path.dirname(os.path.abspath(__file__))
THREE='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
QR='https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js'
FONTS=['https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Figtree:wght@400;500;600;700;800&display=swap']
def h(b): return hashlib.sha256(b).hexdigest()[:16]
def head(scope,name):
    return ('<link rel="manifest" href="'+scope+'manifest.webmanifest">\n<meta name="theme-color" content="#123a52">\n'
            '<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n'
            '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n<meta name="apple-mobile-web-app-title" content="'+name+'">\n'
            '<link rel="apple-touch-icon" href="'+scope+'icons/icon-180.png">\n<link rel="icon" type="image/png" sizes="192x192" href="'+scope+'icons/icon-192.png">\n')
def cfg(scope):
    # what the page needs: where the service worker is; the version, the list of files and the size live in sw.js (the page asks it with the message «status»)
    return {'sw':scope+'sw.js','scope':scope,'pre':pre(scope)}
def pre(scope): return 'vg-'+scope.strip('/').replace('/','-')+'-'   # one cache name per world: '/valdecanas/' → 'vg-valdecanas-' (same origin, separate copies)
def icons(out,style='island'):
    from PIL import Image, ImageDraw
    S=2048; im=Image.new('RGB',(S,S)); d=ImageDraw.Draw(im)
    if style=='valley': return icons_valley(out)
    for y in range(S):  # sky to lake
        t=y/S
        if t<0.55: c=tuple(int(a+(b-a)*(t/0.55)) for a,b in zip((84,170,214),(196,231,245)))
        else: c=tuple(int(a+(b-a)*((t-0.55)/0.45)) for a,b in zip((47,127,176),(18,58,82)))
        d.line([(0,y),(S,y)],fill=c)
    d.ellipse([S*0.1,S*0.47,S*0.9,S*0.69],fill=(214,198,150))                      # beach
    d.ellipse([S*0.13,S*0.44,S*0.87,S*0.64],fill=(86,158,72))                      # island
    d.ellipse([S*0.24,S*0.47,S*0.64,S*0.6],fill=(128,196,92))                      # fairway
    d.ellipse([S*0.52,S*0.49,S*0.72,S*0.57],fill=(160,214,110))                    # green
    d.rectangle([S*0.6,S*0.18,S*0.615,S*0.53],fill=(250,250,250))                  # pin
    d.polygon([(S*0.615,S*0.19),(S*0.8,S*0.245),(S*0.615,S*0.3)],fill=(226,74,58))  # flag
    d.ellipse([S*0.33,S*0.5,S*0.385,S*0.555],fill=(255,255,255))                   # ball
    for n,sz in (('icon-180.png',180),('icon-192.png',192),('icon-512.png',512)): im.resize((sz,sz),Image.LANCZOS).save(os.path.join(out,n))
    m=Image.new('RGB',(S,S),(18,58,82)); m.paste(im.resize((int(S*0.8),int(S*0.8)),Image.LANCZOS),(int(S*0.1),int(S*0.1)))
    m.resize((512,512),Image.LANCZOS).save(os.path.join(out,'icon-maskable-512.png'))
def icons_valley(out):
    """Casterton: the Lune valley under the fells, a stone house with a slate roof and a golf flag (our own drawing)"""
    from PIL import Image, ImageDraw
    S=2048; im=Image.new('RGB',(S,S)); d=ImageDraw.Draw(im)
    for y in range(S):  # sky
        t=y/S; c=tuple(int(a+(b-a)*min(1,t/0.6)) for a,b in zip((96,160,210),(206,228,240))); d.line([(0,y),(S,y)],fill=c)
    d.polygon([(0,S*0.52),(S*0.22,S*0.3),(S*0.42,S*0.44),(S*0.66,S*0.26),(S,S*0.46),(S,S),(0,S)],fill=(104,128,98))     # far fells
    d.polygon([(0,S*0.62),(S*0.3,S*0.5),(S*0.62,S*0.6),(S,S*0.52),(S,S),(0,S)],fill=(92,152,74))                       # near hills
    d.rectangle([0,S*0.7,S,S],fill=(118,176,84))                                                                       # meadow
    for i in range(5): d.line([(0,S*(0.74+i*0.05)),(S,S*(0.71+i*0.055))],fill=(150,144,128),width=int(S*0.008))     # dry stone walls
    d.polygon([(S*0.0,S*0.93),(S*0.35,S*0.82),(S*0.7,S*0.86),(S,S*0.8),(S,S*0.9),(S*0.68,S*0.95),(S*0.34,S*0.92),(0,S)],fill=(70,132,178))  # the river
    d.rectangle([S*0.2,S*0.56,S*0.48,S*0.72],fill=(196,184,160))                                                       # stone house
    d.polygon([(S*0.17,S*0.57),(S*0.34,S*0.45),(S*0.51,S*0.57)],fill=(62,70,84))                                       # slate roof
    for x in (0.25,0.39): d.rectangle([S*x,S*0.61,S*(x+0.05),S*0.66],fill=(250,246,232))                               # windows
    d.rectangle([S*0.32,S*0.64,S*0.36,S*0.72],fill=(92,70,52))                                                         # door
    d.ellipse([S*0.56,S*0.69,S*0.84,S*0.75],fill=(168,222,118))                                                        # green
    d.rectangle([S*0.69,S*0.38,S*0.703,S*0.72],fill=(250,250,250))                                                     # pin
    d.polygon([(S*0.703,S*0.39),(S*0.86,S*0.44),(S*0.703,S*0.49)],fill=(226,74,58))                                    # flag
    for n,sz in (('icon-180.png',180),('icon-192.png',192),('icon-512.png',512)): im.resize((sz,sz),Image.LANCZOS).save(os.path.join(out,n))
    m=Image.new('RGB',(S,S),(18,58,82)); m.paste(im.resize((int(S*0.8),int(S*0.8)),Image.LANCZOS),(int(S*0.1),int(S*0.1)))
    m.resize((512,512),Image.LANCZOS).save(os.path.join(out,'icon-maskable-512.png'))
def build(jo,scope,name,short,desc,lang='es',icon='island'):
    """jo: build/joaco_<world>; scope: '/valdecanas/'"""
    ic=os.path.join(jo,'icons'); os.makedirs(ic,exist_ok=True); icons(ic,icon)
    man={'name':name,'short_name':short,'description':desc,'lang':lang,'id':scope,'start_url':scope+'?app=1','scope':scope,'display':'fullscreen','display_override':['fullscreen','standalone'],
         'orientation':'any','background_color':'#123a52','theme_color':'#123a52',
         'icons':[{'src':scope+'icons/icon-192.png','sizes':'192x192','type':'image/png'},{'src':scope+'icons/icon-512.png','sizes':'512x512','type':'image/png'},
                  {'src':scope+'icons/icon-maskable-512.png','sizes':'512x512','type':'image/png','purpose':'maskable'}],
         'shortcuts':[{'name':'Live scorecard' if lang=='en' else 'Tarjeta en directo','url':scope+'tarjeta/'}]}
    open(os.path.join(jo,'manifest.webmanifest'),'w').write(json.dumps(man,ensure_ascii=False,indent=1))
    core=[]; size=0
    def add(path,url):
        nonlocal size; b=open(path,'rb').read(); size+=len(b); core.append([url,h(b)])
    add(os.path.join(jo,'index.html'),scope)
    dd=os.path.join(jo,'data')
    for r,ds,fs in sorted(os.walk(dd)):
        ds.sort()
        for f in sorted(fs): p=os.path.join(r,f); add(p,scope+'data/'+os.path.relpath(p,dd).replace(os.sep,'/'))
    add(os.path.join(jo,'tarjeta','index.html'),scope+'tarjeta/')
    core.append([THREE,'r128']); size+=603445
    opt=[QR,scope+'manifest.webmanifest']+[scope+'icons/'+n for n in ('icon-180.png','icon-192.png','icon-512.png')]
    v=h(json.dumps(core).encode())[:10]
    sw=open(os.path.join(E,'sw.js')).read().replace('__V__',v).replace('__PRE__',pre(scope)).replace('__SCOPE__',scope).replace('__CORE__',json.dumps(core)).replace('__OPT__',json.dumps(opt)).replace('__FONTS__',json.dumps(FONTS)).replace('__MB__',str(round(size/1048576,1)))
    open(os.path.join(jo,'sw.js'),'w').write(sw)
    return v,size
