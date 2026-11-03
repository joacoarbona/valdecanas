#!/usr/bin/env python3
"""Builds the game pages of every world from one engine (g3*.js) and one template.
For each world: the artifact copy (binary grids as base64 text), the repository copy and the joaco.org copy (raw files)."""
import os, sys, shutil, base64, glob, json
E=os.path.dirname(os.path.abspath(__file__)); ROOT=os.path.dirname(E)
OUT=os.environ.get('PAGES_OUT',os.path.join(ROOT,'build'))
T=open(os.path.join(E,'template3.html')).read()
ENGINE=''.join(open(os.path.join(E,f)).read() for f in ('g3a.js','g3f.js','g3b.js','g3d.js','g3e.js','g3g.js','g3h.js','g3i.js','g3j.js','g3k.js','g3l.js','g3m.js','g3n.js','g3o.js','g3p.js','g3q.js','g3r.js','g3s.js','g3t.js','g3u.js','g3c.js'))
BIN=('h_core.bin','h_wide.bin','h_region.bin','surface_core.rle','trees.bin')
WORLDS={
 'valdecanas':dict(
   world=('world_common.js','world_valdecanas.js'), data=ROOT+'/game/data', site='https://joaco.org/valdecanas/', joaco_path='/valdecanas/data/',
   files=('course.json','buildings.json','pools.json','ortho_core_4096.jpg','ortho_core_2048.jpg','ortho_wide_2048.jpg','ortho_map_1024.jpg','map_surface_1024.png','card.json'),
   repo=ROOT+'/game/index.html',
   texts=dict(TITLE='Isla de Valdecañas Golf', CANVAS='Isla de Valdecañas en 3D', LOAD_LBL='Embalse de Valdecañas · Cáceres', LOAD_H1='Levantando la isla real',
     INTRO_LBL='Embalse de Valdecañas · Tajo · Cáceres', INTRO_H1='Isla de <span>Valdecañas</span> Golf',
     INTRO_P='La isla con su relieve, su foto aérea y sus edificios reales. Salta desde la avioneta, planea, recórrela corriendo, nadando o en buggy, juega los 18 hoyos y busca las 12 bolas doradas.',
     INTRO_EXTRA='', PLAY='Explorar la isla', PLAY_P='Salta de la avioneta, planea y recorre la isla a pie, en buggy, a caballo o en barco', STATUS='Isla de Valdecañas', MAPTITLE='Mapa de la isla',
     ATTR='Relieve y foto aérea © IGN · Edificios: Catastro · Caminos © colaboradores de OpenStreetMap')),
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
def full(out,vp=VP_GAME):
    return '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="'+vp+'">\n'+out.replace('<style>','</head>\n<body>\n<style>',1)+'\n</body>\n</html>\n'
def build(w):
    W=WORLDS[w]; pub=os.path.join(OUT,'publish_'+w); jo=os.path.join(OUT,'joaco_'+w)
    art=page(w,{'b64':True,'site':W['site']})
    os.makedirs(pub,exist_ok=True); open(os.path.join(pub,'index.html'),'w').write(art)
    os.makedirs(os.path.dirname(W['repo']),exist_ok=True); open(W['repo'],'w').write(full(page(w,{'b64':False,'site':W['site']})))
    os.makedirs(jo,exist_ok=True); open(os.path.join(jo,'index.html'),'w').write(full(page(w,{'b64':False,'data':W['joaco_path'],'site':W['site']})))
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
CARDW={'valdecanas':dict(key='vg',salt='isla-de-valdecanas/sala/v1',topic='vgolf/1/',title='Isla de Valdecañas'),'madrid':dict(key='pm',salt='golf-madrid/sala/v1',topic='mgolf/1/',title='Golf en Madrid')}
def card_page(w,data='../data/',game='../'):
    C=os.path.join(E,'card'); t=open(os.path.join(C,'card.html')).read(); js=open(os.path.join(C,'card.js')).read(); geo=open(os.path.join(C,'geo.js')).read().split('if(typeof module')[0]
    a=open(os.path.join(E,'g3e.js')).read(); lines=a.split('\n')
    pick=[l for l in lines if l.startswith(('const TE=new TextEncoder','function toHex','function mpRandId','async function mpSeal','async function mpOpen'))]
    net='\n'.join(pick)+'\n'+a[a.index('/* ---- a minimal MQTT 3.1.1 client'):a.index('/* ---- room state ---- */')]
    cw=CARDW[w]; cfg=dict(key=cw['key'],data=data,game=game,salt=cw['salt'],topic=cw['topic'],title=cw['title'])
    t=t.replace('{{TITLE}}',cw['title']).replace('/*CFG*/','window.CARD_CFG='+json.dumps(cfg,ensure_ascii=False)+';').replace('/*NET*/',net).replace('/*CARD*/',js.replace('/*GEO*/',geo))
    return full(t,'width=device-width,initial-scale=1,viewport-fit=cover')
def build_card(w):
    W=WORLDS[w]; jo=os.path.join(OUT,'joaco_'+w,'tarjeta'); os.makedirs(jo,exist_ok=True); open(os.path.join(jo,'index.html'),'w').write(card_page(w,W['joaco_path'],W['joaco_path'][:-len('data/')]))
    rp=os.path.join(os.path.dirname(W['repo']),'tarjeta'); os.makedirs(rp,exist_ok=True); open(os.path.join(rp,'index.html'),'w').write(card_page(w).replace("data:'../data/'","data:'../data/'"))
    print(w,'tarjeta',os.path.getsize(os.path.join(jo,'index.html')))
if __name__=='__main__':
    for w in (sys.argv[1:] or WORLDS): build(w); build_card(w)
