#!/usr/bin/env python3
"""Assemble game/index.html from src/ and copy the binary grids as base64 text next to them."""
import base64, os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC=os.path.join(ROOT,'src'); DATA=os.path.join(ROOT,'game','data')
T=open(os.path.join(SRC,'template3.html')).read()
w=open(os.path.join(SRC,'world3.js')).read()
g=''.join(open(os.path.join(SRC,f)).read() for f in ('g3a.js','g3b.js','g3c.js'))
page=T.replace('/*WORLD*/',w).replace('/*GAME*/',g)
full='<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'+page.replace('<style>','</head>\n<body>\n<style>',1)+'\n</body>\n</html>\n'
open(os.path.join(ROOT,'game','index.html'),'w').write(full)
for name in ('h_core.bin','h_wide.bin','h_region.bin','surface_core.rle','trees.bin'):
    b=open(os.path.join(DATA,name),'rb').read()
    open(os.path.join(DATA,name+'.txt'),'w').write(base64.b64encode(b).decode('ascii'))
print('game/index.html', len(full))
