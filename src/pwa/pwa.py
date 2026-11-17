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
    return {'sw':scope+'sw.js','scope':scope}
def icons(out):
    from PIL import Image, ImageDraw
    S=2048; im=Image.new('RGB',(S,S)); d=ImageDraw.Draw(im)
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
def build(jo,scope,name,short,desc):
    """jo: build/joaco_<world>; scope: '/valdecanas/'"""
    ic=os.path.join(jo,'icons'); os.makedirs(ic,exist_ok=True); icons(ic)
    man={'name':name,'short_name':short,'description':desc,'lang':'es','id':scope,'start_url':scope+'?app=1','scope':scope,'display':'fullscreen','display_override':['fullscreen','standalone'],
         'orientation':'any','background_color':'#123a52','theme_color':'#123a52',
         'icons':[{'src':scope+'icons/icon-192.png','sizes':'192x192','type':'image/png'},{'src':scope+'icons/icon-512.png','sizes':'512x512','type':'image/png'},
                  {'src':scope+'icons/icon-maskable-512.png','sizes':'512x512','type':'image/png','purpose':'maskable'}],
         'shortcuts':[{'name':'Tarjeta en directo','url':scope+'tarjeta/'}]}
    open(os.path.join(jo,'manifest.webmanifest'),'w').write(json.dumps(man,ensure_ascii=False,indent=1))
    core=[]; size=0
    def add(path,url):
        nonlocal size; b=open(path,'rb').read(); size+=len(b); core.append([url,h(b)])
    add(os.path.join(jo,'index.html'),scope)
    for f in sorted(glob.glob(os.path.join(jo,'data','*'))): add(f,scope+'data/'+os.path.basename(f))
    add(os.path.join(jo,'tarjeta','index.html'),scope+'tarjeta/')
    core.append([THREE,'r128']); size+=603445
    opt=[QR,scope+'manifest.webmanifest']+[scope+'icons/'+n for n in ('icon-180.png','icon-192.png','icon-512.png')]
    v=h(json.dumps(core).encode())[:10]
    sw=open(os.path.join(E,'sw.js')).read().replace('__V__',v).replace('__SCOPE__',scope).replace('__CORE__',json.dumps(core)).replace('__OPT__',json.dumps(opt)).replace('__FONTS__',json.dumps(FONTS)).replace('__MB__',str(round(size/1048576,1)))
    open(os.path.join(jo,'sw.js'),'w').write(sw)
    return v,size
