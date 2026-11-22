#!/usr/bin/env python3
"""Builds the game pages of every world from one engine (g3*.js) and one template.
For each world: the artifact copy (binary grids as base64 text), the repository copy and the joaco.org copy (raw files)."""
import os, sys, shutil, base64, glob, json
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'pwa')); import pwa
E=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(E)
OUT=os.environ.get('PAGES_OUT',os.path.join(ROOT,'build'))
T=open(os.path.join(E,'template3.html')).read()
ENGINE=''.join(open(os.path.join(E,f)).read() for f in ('g3a.js','g3f.js','g3b.js','g3d.js','g3e.js','g3g.js','g3h.js','g3i.js','g3j.js','g3k.js','g3l.js','g3m.js','g3n.js','g3o.js','g3p.js','g3q.js','g3r.js','card/g2.js','g3s.js','g3t.js','g3u.js','g3v.js','g3w.js','g3wb.js','g3x.js','g3y.js','g3z.js','g3bk.js','g3fl.js','g3ds.js','g3gp.js','g3hl.js','g3pw.js','g3ez.js','g3dg.js','g3mg.js','g3ox.js','g3an.js','g3ts.js','g3nv.js','g3sn.js','g3tg.js','g3mt.js','g3me.js','g3of.js','g3cs.js','g3lu.js','g3fg.js','g3sc.js','g3c.js'))
BIN=('h_core.bin','h_wide.bin','h_region.bin','surface_core.rle','trees.bin')
WORLDS={
 'valdecanas':dict(
   world=('world_common.js','world_valdecanas.js'), data=ROOT+'/game/data', site='https://joaco.org/valdecanas/', joaco_path='/valdecanas/data/', pwa=dict(scope='/valdecanas/',name='Isla de Valdecañas Golf',short='Valdecañas',desc='La isla de Valdecañas en 3D: golf, karts, bicis, volar, Halloween, Navidad y juegos para los peques. Funciona sin conexión.'),
   files=('course.json','buildings.json','pools.json','ortho_core_4096.jpg','ortho_core_2048.jpg','ortho_wide_2048.jpg','ortho_map_1024.jpg','map_surface_1024.png','card.json'),
   repo=ROOT+'/game/index.html',
   texts=dict(TITLE='Isla de Valdecañas Golf', CANVAS='Isla de Valdecañas en 3D', LOAD_LBL='Embalse de Valdecañas · Cáceres', LOAD_H1='Levantando la isla real',
     INTRO_LBL='Embalse de Valdecañas · Tajo · Cáceres', INTRO_H1='Isla de <span>Valdecañas</span> Golf',
     INTRO_P='La isla con su relieve, su foto aérea y sus edificios reales. Salta desde la avioneta, planea, recórrela corriendo, nadando o en buggy, juega los 18 hoyos y busca las 12 bolas doradas.',
     INTRO_EXTRA='', PLAY='Explorar la isla', PLAY_P='Salta de la avioneta, planea y recorre la isla a pie, en buggy, a caballo o en barco', STATUS='Isla de Valdecañas', MAPTITLE='Mapa de la isla',
     ATTR='Relieve y foto aérea © IGN · Edificios: Catastro · Caminos © colaboradores de OpenStreetMap')),
 'casterton':dict(
   world=('world_common.js','world_casterton.js'), data=ROOT+'/casterton/game/data', site='https://joaco.org/casterton/', joaco_path='/casterton/data/',
   files=('course.json','buildings.json','pools.json','walls.json','ortho_core_4096.jpg','ortho_core_2048.jpg','ortho_wide_2048.jpg','ortho_map_2048.jpg','map_surface_2048.png','card.json'),
   tiles=True, repo=ROOT+'/casterton/game/index.html',
   texts=dict(TITLE='Casterton y los Lagos', CANVAS='Casterton y el valle del Lune en 3D', LOAD_LBL='Casterton · valle del Lune · Cumbria', LOAD_H1='Levantando el valle real',
     INTRO_LBL='Casterton · Kirkby Lonsdale · Cumbria', INTRO_H1='Casterton <span>y los Lagos</span>',
     INTRO_P='El colegio de Casterton, el campo de golf de al lado y 3 km del valle del Lune alrededor, con su relieve, sus muros de piedra seca, sus setos, sus árboles y sus casas, todo sacado de datos reales. Juega los 18 hoyos, el par 3, las prácticas, el footgolf y el rugbygolf, o salta desde la avioneta y recórrelo.',
     INTRO_EXTRA='', PLAY='Explorar Casterton', PLAY_P='Salta de la avioneta sobre el valle del Lune y recórrelo a pie, en buggy o a caballo', STATUS='Casterton', MAPTITLE='Mapa de Casterton',
     ATTR='Relieve y LIDAR © Environment Agency (OGL) · Color: Copernicus Sentinel-2 · Casas y caminos © colaboradores de OpenStreetMap y OS OpenMap Local (OGL)')),
 'madrid':dict(
   world=('world_common.js','world_madrid.js'), data=ROOT+'/madrid/game/data', site='https://joaco.org/golf-madrid/', joaco_path='/golf-madrid/data/',
   files=('course.json','buildings.json','pools.json','ortho_core_4096.jpg','ortho_core_2048.jpg','ortho_region_4096.jpg','ortho_map_2048.jpg','map_surface_2048.png','card.json'),
   tiles=True, bins_opt=('city.bin',), repo=ROOT+'/madrid/game/index.html',
   texts=dict(TITLE='Golf en Madrid', CANVAS='Campos de golf de Puerta de Hierro y del Club de Campo en 3D',
     LOAD_LBL='Puerta de Hierro · Club de Campo · Madrid', LOAD_H1='Levantando los campos reales',
     INTRO_LBL='Madrid · Puerta de Hierro y Club de Campo', INTRO_H1='Golf en <span>Madrid</span>',
     INTRO_P='Los cuatro recorridos de 18 hoyos del Real Club de la Puerta de Hierro y del Club de Campo Villa de Madrid, con su relieve, su foto aérea y sus edificios reales. Elige recorrido, salta desde la avioneta y juega, recorre los hoyos en buggy o míralos uno a uno desde el aire.',
     INTRO_EXTRA='<div class="lbl">Recorrido</div><div class="crs" id="courseRow"></div><div id="teeRow" hidden></div>', PLAY='Explorar los campos', PLAY_P='Salta de la avioneta sobre Madrid y recorre los campos y la ciudad a pie o en coche', STATUS='Golf en Madrid', MAPTITLE='Mapa de los campos',
     ATTR='Relieve y foto aérea © IGN · Edificios: Catastro · Campos, caminos y ciudad © colaboradores de OpenStreetMap')),
}
def page(w,cfg):
    W=WORLDS[w]; t=T
    for k,v in W['texts'].items(): t=t.replace('{{'+k+'}}',v)
    world=''.join(open(os.path.join(E,f)).read() for f in W['world'])
    return t.replace('/*WORLD*/','window.VG_CFG='+json.dumps(cfg)+';\n'+world).replace('/*GAME*/',ENGINE)
# the game page does not zoom on phones (src/g3t.js); the scorecard page keeps normal zoom
VP_GAME='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover'
def full(out,vp=VP_GAME,head=''):
    return '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="'+vp+'">\n'+head+out.replace('<style>','</head>\n<body>\n<style>',1)+'\n</body>\n</html>\n'
def build(w):
    W=WORLDS[w]; pub=os.path.join(OUT,'publish_'+w); jo=os.path.join(OUT,'joaco_'+w)
    art=page(w,{'b64':True,'site':W['site']})
    os.makedirs(pub,exist_ok=True); open(os.path.join(pub,'index.html'),'w').write(art)
    os.makedirs(os.path.dirname(W['repo']),exist_ok=True); open(W['repo'],'w').write(full(page(w,{'b64':False,'site':W['site']})))
    jc={'b64':False,'data':W['joaco_path'],'site':W['site']}; P=W.get('pwa')
    if P: jc['pwa']=pwa.cfg(P['scope'])
    os.makedirs(jo,exist_ok=True); open(os.path.join(jo,'index.html'),'w').write(full(page(w,jc),head=pwa.head(P['scope'],P['short']) if P else ''))
    for sub in (pub,jo): os.makedirs(os.path.join(sub,'data'),exist_ok=True)
    for name in BIN:
        b=open(os.path.join(W['data'],name),'rb').read()
        open(os.path.join(pub,'data',name+'.txt'),'w').write(base64.b64encode(b).decode('ascii'))
        shutil.copy(os.path.join(W['data'],name),os.path.join(jo,'data',name))
    for name in W.get('bins_opt',()):
        src=os.path.join(W['data'],name)
        if not os.path.exists(src): continue
        b=open(src,'rb').read(); open(os.path.join(pub,'data',name+'.txt'),'w').write(base64.b64encode(b).decode('ascii')); shutil.copy(src,os.path.join(jo,'data',name))
    for name in W['files']:
        for sub in (pub,jo): shutil.copy(os.path.join(W['data'],name),os.path.join(sub,'data',name))
    if W.get('tiles'):
        for sub in (pub,jo):
            os.makedirs(os.path.join(sub,'data','tiles'),exist_ok=True)
            for f in glob.glob(os.path.join(W['data'],'tiles','*.jpg')): shutil.copy(f,os.path.join(sub,'data','tiles',os.path.basename(f)))
    for f in glob.glob(os.path.join(pub,'data','*')):
        if f.endswith('.bin') or f.endswith('.rle'): os.remove(f)
    print(w,'artifact',len(art),'files',sum(len(fs) for _,_,fs in os.walk(os.path.join(pub,'data'))))
# the live scorecard for real rounds (joaco.org/<world>/tarjeta/): a light page that shares the course data and the room code of the game
# the group's cloud (Supabase project joaco-org; tables and functions in card/nube.sql). The publishable key is public by design: without the group's code it reads nothing
CLOUD=dict(url='https://zdlmpppkwfvtwkohwzct.supabase.co',key='sb_publishable_4M5hYAhlyWb3FlpdtMt5uQ_ZWUFROZY')
CARDW={'valdecanas':dict(key='vg',salt='isla-de-valdecanas/sala/v1',topic='vgolf/1/',title='Isla de Valdecañas'),'madrid':dict(key='pm',salt='golf-madrid/sala/v1',topic='mgolf/1/',title='Golf en Madrid'),'casterton':dict(key='cl',salt='casterton/sala/v1',topic='cgolf/1/',title='Casterton y los Lagos')}
def card_page(w,data='../data/',game='../'):
    C=os.path.join(E,'card'); t=open(os.path.join(C,'card.html')).read(); js=open(os.path.join(C,'card.js')).read(); geo=open(os.path.join(C,'geo.js')).read().split('if(typeof module')[0]; g2=open(os.path.join(C,'g2.js')).read(); js=js.replace('/*G2*/',g2)
    a=open(os.path.join(E,'g3e.js')).read(); lines=a.split('\n')
    pick=[l for l in lines if l.startswith(('const TE=new TextEncoder','function toHex','function mpRandId','async function mpSeal','async function mpOpen'))]
    net='\n'.join(pick)+'\n'+a[a.index('/* ---- a minimal MQTT 3.1.1 client'):a.index('/* ---- room state ---- */')]
    cw=CARDW[w]; cfg=dict(key=cw['key'],data=data,game=game,salt=cw['salt'],topic=cw['topic'],title=cw['title'],keys=[c['key'] for c in CARDW.values()],cloud=CLOUD)
    t=t.replace('{{TITLE}}',cw['title']).replace('/*CFG*/','window.CARD_CFG='+json.dumps(cfg,ensure_ascii=False)+';').replace('/*NET*/',net).replace('/*CARD*/',js.replace('/*GEO*/',geo))
    return full(t,'width=device-width,initial-scale=1,viewport-fit=cover')
def build_card(w):
    W=WORLDS[w]; jo=os.path.join(OUT,'joaco_'+w,'tarjeta'); os.makedirs(jo,exist_ok=True); open(os.path.join(jo,'index.html'),'w').write(card_page(w,W['joaco_path'],W['joaco_path'][:-len('data/')]))
    rp=os.path.join(os.path.dirname(W['repo']),'tarjeta'); os.makedirs(rp,exist_ok=True); open(os.path.join(rp,'index.html'),'w').write(card_page(w).replace("data:'../data/'","data:'../data/'"))
    print(w,'tarjeta',os.path.getsize(os.path.join(jo,'index.html')))
# the copy for playing without a connection (joaco.org only): manifest, icons and service worker, after the page, the data and the scorecard are written
def build_pwa(w):
    W=WORLDS[w]; P=W.get('pwa')
    if not P: return
    v,size=pwa.build(os.path.join(OUT,'joaco_'+w),P['scope'],P['name'],P['short'],P['desc']); print(w,'sin conexión',v,round(size/1048576,1),'MB')
if __name__=='__main__':
    for w in (sys.argv[1:] or WORLDS):
        build(w)
        if w in CARDW: build_card(w)
        build_pwa(w)
