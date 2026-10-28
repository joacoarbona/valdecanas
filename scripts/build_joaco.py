#!/usr/bin/env python3
"""Build the joaco.org copy of the game: <joaco-org>/public/valdecanas/{index.html,data/}.
Usage: python3 scripts/build_joaco.py /path/to/master/joaco-org
On joaco.org the binary grids are served raw (no base64) and the data path is absolute."""
import os, sys, shutil
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'src'); DATA=os.path.join(ROOT,'game','data')
dest=os.path.join(sys.argv[1] if len(sys.argv)>1 else '.', 'public','valdecanas')
T=open(os.path.join(SRC,'template3.html')).read()
w=open(os.path.join(SRC,'world3.js')).read()
g=''.join(open(os.path.join(SRC,f)).read() for f in ('g3a.js','g3b.js','g3d.js','g3e.js','g3c.js'))
page=T.replace('/*WORLD*/','window.VG_CFG={"b64":false,"data":"/valdecanas/data/"};\n'+w).replace('/*GAME*/',g)
full='<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'+page.replace('<style>','</head>\n<body>\n<style>',1)+'\n</body>\n</html>\n'
os.makedirs(os.path.join(dest,'data'),exist_ok=True)
open(os.path.join(dest,'index.html'),'w').write(full)
for name in ('course.json','buildings.json','pools.json','ortho_core_4096.jpg','ortho_core_2048.jpg','ortho_wide_2048.jpg','ortho_map_1024.jpg','map_surface_1024.png','h_core.bin','h_wide.bin','h_region.bin','surface_core.rle','trees.bin'):
    shutil.copy(os.path.join(DATA,name),os.path.join(dest,'data',name))
print('built',dest,len(full),'bytes +',len(os.listdir(os.path.join(dest,'data'))),'data files')
