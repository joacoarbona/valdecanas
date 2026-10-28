#!/usr/bin/env python3
"""Surroundings of the Madrid golf world, for the view from the plane: a 16 km x 16 km photo (IGN PNOA, 4 m/px) and
relief (IGN MDT 25 m) around the two clubs. Same sources and licences as fetch_geodata_madrid.py (CC BY 4.0 IGN)."""
import json, os, re, sys, time, urllib.parse, urllib.request
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join('madrid', 'data'); RAW = os.path.join(OUT, 'raw'); os.makedirs(RAW, exist_ok=True)
UA = {'User-Agent': 'valdecanas-family-game/1.0 (madrid golf world; +https://github.com/joacoarbona/valdecanas)'}
meta = json.load(open(os.path.join(OUT, 'meta.json'))); CX, CY = meta['centre_utm30']
HALF = 8000; LOG = {'started': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'steps': []}
def log(*a): s = ' '.join(str(x) for x in a); print(s, flush=True); LOG['steps'].append(s)
def get(url, timeout=300, tries=4):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=timeout) as r: return r.read(), r.headers.get('Content-Type', '')
        except Exception as e: last = e; log('retry', i + 1, url[:120], repr(e)[:160]); time.sleep(6 * (i + 1))
    raise RuntimeError(str(last))
def dem25():
    base = 'https://servicios.idee.es/wcs-inspire/mdt'
    for ax in (('x', 'y'), ('E', 'N')):
        url = (f'{base}?SERVICE=WCS&VERSION=2.0.1&REQUEST=GetCoverage&COVERAGEID=Elevacion25830_25'
               f'&SUBSET={ax[0]}({CX-HALF},{CX+HALF})&SUBSET={ax[1]}({CY-HALF},{CY+HALF})&FORMAT=image/tiff')
        try:
            d, ct = get(url)
            if d[:2] in (b'II', b'MM'): open(os.path.join(RAW, 'dem_wide_Elevacion25830_25.tif'), 'wb').write(d); log('dem25 ok', len(d)); LOG['dem25'] = True; return
            log('dem25 not tiff', ct, d[:200])
        except Exception as e: log('dem25 fail', e)
def ortho_region(px=4.0, tile=2000):
    base = 'https://www.ign.es/wms-inspire/pnoa-ma'; span = tile * px; n = int(round(2 * HALF / span))
    mos = Image.new('RGB', (n * tile, n * tile), (110, 120, 100)); ok = 0
    for j in range(n):
        for i in range(n):
            x0 = CX - HALF + i * span; y1 = CY + HALF - j * span
            url = base + '?' + urllib.parse.urlencode({'SERVICE': 'WMS', 'VERSION': '1.3.0', 'REQUEST': 'GetMap', 'LAYERS': 'OI.OrthoimageCoverage', 'STYLES': '',
                  'CRS': 'EPSG:25830', 'BBOX': f'{x0},{y1-span},{x0+span},{y1}', 'WIDTH': tile, 'HEIGHT': tile, 'FORMAT': 'image/jpeg'})
            try:
                d, ct = get(url)
                if 'image' not in ct: log('ortho region not image', i, j, ct, d[:200]); continue
                p = os.path.join(RAW, f'oreg_{j}_{i}.jpg'); open(p, 'wb').write(d); mos.paste(Image.open(p).convert('RGB'), (i * tile, j * tile)); ok += 1; log('ortho region tile', i, j, len(d))
            except Exception as e: log('ortho region fail', i, j, e)
            time.sleep(0.5)
    if ok:
        mos.resize((4096, 4096), Image.LANCZOS).save(os.path.join(OUT, 'ortho_region_4096.jpg'), quality=86, optimize=True, progressive=True)
        LOG['ortho_region'] = {'tiles': ok, 'px_m': px, 'bbox_utm30': [CX - HALF, CY - HALF, CX + HALF, CY + HALF]}
if __name__ == '__main__':
    dem25(); ortho_region()
    LOG['finished'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    json.dump(LOG, open(os.path.join(OUT, 'fetch_wide_log.json'), 'w'), indent=1)
