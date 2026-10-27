#!/usr/bin/env python3
"""Download open geodata for Isla de Valdecañas into data/.

Sources (all open):
- IGN / CNIG: MDT elevation (WCS) and PNOA orthophoto (WMS). Licence CC BY 4.0, (c) Instituto Geografico Nacional.
- Direccion General del Catastro: INSPIRE buildings (WFS).
- OpenStreetMap contributors (Overpass API). Licence ODbL.
"""
import json, os, re, time, urllib.parse, urllib.request
from pyproj import Transformer
from PIL import Image

OUT = 'data'; RAW = os.path.join(OUT, 'raw'); os.makedirs(os.path.join(RAW, 'ortho'), exist_ok=True)
UA = {'User-Agent': 'valdecanas-family-game/1.0 (+https://github.com/joacoarbona/valdecanas)'}
LOG = {'started': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'steps': []}

def log(*a):
    s = ' '.join(str(x) for x in a); print(s, flush=True); LOG['steps'].append(s)

def get(url, timeout=180, tries=4, data=None, headers=None):
    h = dict(UA); h.update(headers or {}); last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, data=data, headers=h)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read(), r.headers.get('Content-Type', '')
        except Exception as e:
            last = e; log('retry', i + 1, url[:150], repr(e)[:200]); time.sleep(5 * (i + 1))
    raise RuntimeError(f'failed {url[:150]}: {last}')

def locate():
    found = []
    for q in ['Golf Isla Valdecañas', 'Isla de Valdecañas', 'Vincci Valdecañas Golf', 'Valdecañas Golf El Gordo']:
        try:
            d, _ = get('https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode(
                {'q': q, 'format': 'jsonv2', 'limit': 10, 'countrycodes': 'es'}), timeout=60)
            for r in json.loads(d):
                found.append({'q': q, 'name': r.get('display_name'), 'category': r.get('category'), 'type': r.get('type'),
                              'lat': float(r['lat']), 'lon': float(r['lon']), 'bbox': [float(v) for v in r['boundingbox']]})
        except Exception as e:
            log('nominatim fail', q, e)
        time.sleep(1.5)
    LOG['nominatim'] = found
    def score(r):
        s = 0; n = (r['name'] or ''); t = (r['type'] or '')
        if t == 'golf_course': s += 6
        if t in ('island', 'islet'): s += 5
        if 'Valdeca' in n: s += 2
        if 'Cáceres' in n: s += 2
        return -s
    found.sort(key=score)
    for r in found:
        if 39.5 < r['lat'] < 40.2 and -5.95 < r['lon'] < -4.95:
            return r
    return None

def overpass(s, w, n, e):
    bb = f'{s},{w},{n},{e}'
    q = ('[out:json][timeout:180];(' + ''.join(f'nwr["{k}"]({bb});' for k in
         ['leisure', 'golf', 'building', 'highway', 'natural', 'landuse', 'amenity', 'tourism', 'man_made', 'place', 'water', 'waterway', 'barrier', 'sport']) +
         ');out body geom;')
    for url in ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter']:
        try:
            d, _ = get(url, timeout=240, data=urllib.parse.urlencode({'data': q}).encode())
            js = json.loads(d); open(os.path.join(OUT, 'osm.json'), 'w').write(json.dumps(js))
            kinds = {}
            for el in js.get('elements', []):
                t = el.get('tags', {})
                for k in ('golf', 'building', 'highway', 'leisure', 'natural'):
                    if k in t: kinds[k + '=' + (t[k] if k != 'building' else '*')] = kinds.get(k + '=' + (t[k] if k != 'building' else '*'), 0) + 1
            LOG['osm_counts'] = dict(sorted(kinds.items(), key=lambda kv: -kv[1])[:80]); log('osm ok', len(js.get('elements', [])), 'elements')
            return
        except Exception as ex:
            log('overpass fail', url, ex)

def dem(minx, miny, maxx, maxy):
    base = 'https://servicios.idee.es/wcs-inspire/mdt'
    ids = []
    try:
        caps, _ = get(base + '?SERVICE=WCS&REQUEST=GetCapabilities&VERSION=2.0.1', timeout=120)
        ids = re.findall(r'<wcs:CoverageId>([^<]+)</wcs:CoverageId>', caps.decode('utf8', 'ignore'))
    except Exception as e:
        log('wcs caps fail', e)
    LOG['wcs_ids'] = ids
    def res(cid):
        m = re.findall(r'_(\d+(?:\.\d+)?)$', cid); return float(m[0]) if m else 999
    cands = sorted([i for i in ids if '25830' in i], key=res) or ['Elevacion25830_2', 'Elevacion25830_5']
    for cid in cands:
        for ax in (('x', 'y'), ('E', 'N'), ('X', 'Y')):
            url = (f'{base}?SERVICE=WCS&VERSION=2.0.1&REQUEST=GetCoverage&COVERAGEID={cid}'
                   f'&SUBSET={ax[0]}({minx},{maxx})&SUBSET={ax[1]}({miny},{maxy})&FORMAT=image/tiff')
            try:
                d, ct = get(url, timeout=300, tries=2)
                if d[:2] in (b'II', b'MM') and len(d) > 10000:
                    open(os.path.join(RAW, f'dem_{cid}.tif'), 'wb').write(d); log('dem ok', cid, ax, len(d)); LOG['dem'] = cid; return
                log('dem not tiff', cid, ax, ct, d[:300])
            except Exception as e:
                log('dem fail', cid, ax, e)
    url = 'https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N39_00_W006_00_DEM/Copernicus_DSM_COG_10_N39_00_W006_00_DEM.tif'
    try:
        d, _ = get(url, timeout=600); open(os.path.join(RAW, 'dem_copernicus30.tif'), 'wb').write(d); LOG['dem'] = 'copernicus30'; log('dem fallback copernicus ok', len(d))
    except Exception as e:
        log('copernicus fail', e)

def dem_region(cx, cy, half=40000):
    """Coarse relief of the surroundings (Gredos, Villuercas, Monfragüe) for the horizon."""
    base = 'https://servicios.idee.es/wcs-inspire/mdt'
    ids = LOG.get('wcs_ids') or []
    def res(cid):
        m = re.findall(r'_(\d+(?:\.\d+)?)$', cid); return float(m[0]) if m else 0
    cands = sorted([i for i in ids if '25830' in i and res(i) >= 100], key=res) or ['Elevacion25830_200']
    minx, miny, maxx, maxy = cx - half, cy - half, cx + half, cy + half
    for cid in cands:
        for ax in (('x', 'y'), ('E', 'N')):
            url = (f'{base}?SERVICE=WCS&VERSION=2.0.1&REQUEST=GetCoverage&COVERAGEID={cid}'
                   f'&SUBSET={ax[0]}({minx},{maxx})&SUBSET={ax[1]}({miny},{maxy})&FORMAT=image/tiff')
            try:
                d, ct = get(url, timeout=300, tries=2)
                if d[:2] in (b'II', b'MM') and len(d) > 5000:
                    open(os.path.join(RAW, f'dem_region_{cid}.tif'), 'wb').write(d); log('dem region ok', cid, len(d)); LOG['dem_region'] = cid; return
                log('dem region not tiff', cid, ct, d[:200])
            except Exception as e:
                log('dem region fail', cid, e)
    for cid in [i for i in ids if '25830' in i and 20 <= res(i) < 100]:
        url = (f'{base}?SERVICE=WCS&VERSION=2.0.1&REQUEST=GetCoverage&COVERAGEID={cid}'
               f'&SUBSET=x({minx},{maxx})&SUBSET=y({miny},{maxy})&SCALESIZE=x(800),y(800)&FORMAT=image/tiff')
        try:
            d, ct = get(url, timeout=400, tries=2)
            if d[:2] in (b'II', b'MM'):
                open(os.path.join(RAW, f'dem_region_{cid}.tif'), 'wb').write(d); log('dem region scaled ok', cid, len(d)); LOG['dem_region'] = cid; return
        except Exception as e:
            log('dem region scaled fail', cid, e)

def ortho(minx, miny, maxx, maxy, px=0.4, tile=2000):
    base = 'https://www.ign.es/wms-inspire/pnoa-ma'
    span = tile * px; nx = int(round((maxx - minx) / span)); ny = int(round((maxy - miny) / span))
    tiles = []
    for j in range(ny):
        for i in range(nx):
            x0 = minx + i * span; y1 = maxy - j * span; x1 = x0 + span; y0 = y1 - span
            url = base + '?' + urllib.parse.urlencode({'SERVICE': 'WMS', 'VERSION': '1.3.0', 'REQUEST': 'GetMap', 'LAYERS': 'OI.OrthoimageCoverage',
                  'STYLES': '', 'CRS': 'EPSG:25830', 'BBOX': f'{x0},{y0},{x1},{y1}', 'WIDTH': tile, 'HEIGHT': tile, 'FORMAT': 'image/jpeg'})
            try:
                d, ct = get(url, timeout=240)
                if 'image' not in ct:
                    log('ortho not image', i, j, ct, d[:300]); continue
                p = os.path.join(RAW, 'ortho', f'o_{j}_{i}.jpg'); open(p, 'wb').write(d); tiles.append((i, j, p))
                log('ortho tile', i, j, len(d))
            except Exception as e:
                log('ortho fail', i, j, e)
            time.sleep(0.5)
    if tiles:
        W = nx * tile; H = ny * tile; mos = Image.new('RGB', (W, H), (90, 120, 140))
        for i, j, p in tiles:
            mos.paste(Image.open(p).convert('RGB'), (i * tile, j * tile))
        for size in (4096, 2048):
            mos.resize((size, int(size * H / W)), Image.LANCZOS).save(os.path.join(OUT, f'ortho_{size}.jpg'), quality=86, optimize=True, progressive=True)
        LOG['ortho'] = {'tiles': len(tiles), 'nx': nx, 'ny': ny, 'px_m': px}

def catastro(minx, miny, maxx, maxy, step=1000):
    base = 'https://ovc.catastro.meh.es/INSPIRE/wfsBU.aspx'
    os.makedirs(os.path.join(RAW, 'catastro'), exist_ok=True); n = 0
    x = minx
    while x < maxx:
        y = miny
        while y < maxy:
            for tn in ('BU:Building', 'BU:BuildingPart'):
                url = base + '?' + urllib.parse.urlencode({'service': 'wfs', 'version': '2.0.0', 'request': 'getfeature', 'typenames': tn,
                      'bbox': f'{x},{y},{min(x+step,maxx)},{min(y+step,maxy)}', 'srsname': 'EPSG::25830'})
                try:
                    d, ct = get(url, timeout=240, tries=3)
                    fn = os.path.join(RAW, 'catastro', f'{tn.split(":")[1]}_{int(x)}_{int(y)}.gml'); open(fn, 'wb').write(d); n += 1
                    log('catastro', tn, int(x), int(y), len(d), d[:120].decode('utf8', 'ignore').replace('\n', ' ')[:120])
                except Exception as e:
                    log('catastro fail', tn, x, y, e)
                time.sleep(0.4)
            y += step
        x += step
    LOG['catastro_files'] = n

def main():
    r = locate()
    if r: lat, lon = r['lat'], r['lon']; log('located', r)
    else: lat, lon = 39.84, -5.36; log('fallback centre', lat, lon)
    to_utm = Transformer.from_crs('EPSG:4326', 'EPSG:25830', always_xy=True)
    to_ll = Transformer.from_crs('EPSG:25830', 'EPSG:4326', always_xy=True)
    cx, cy = to_utm.transform(lon, lat); cx = round(cx / 10) * 10; cy = round(cy / 10) * 10
    half_o = 1600 if r else 3200; half_d = 2600 if r else 4000
    meta = {'centre_lonlat': [lon, lat], 'centre_utm30': [cx, cy], 'ortho_bbox_utm30': [cx - half_o, cy - half_o, cx + half_o, cy + half_o],
            'dem_bbox_utm30': [cx - half_d, cy - half_d, cx + half_d, cy + half_d], 'crs': 'EPSG:25830',
            'sources': {'dem': 'IGN MDT (WCS servicios.idee.es) — CC BY 4.0 (c) Instituto Geografico Nacional',
                        'ortho': 'IGN PNOA máxima actualidad (WMS) — CC BY 4.0 (c) Instituto Geografico Nacional',
                        'buildings': 'Direccion General del Catastro (INSPIRE WFS)', 'osm': '(c) OpenStreetMap contributors, ODbL'}}
    s_w = to_ll.transform(cx - half_d, cy - half_d); n_e = to_ll.transform(cx + half_d, cy + half_d)
    meta['dem_bbox_lonlat'] = [s_w[0], s_w[1], n_e[0], n_e[1]]
    os.makedirs(OUT, exist_ok=True); json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=1)
    overpass(s_w[1], s_w[0], n_e[1], n_e[0])
    dem(*meta['dem_bbox_utm30'])
    dem_region(cx, cy)
    ortho(*meta['ortho_bbox_utm30'])
    catastro(*meta['ortho_bbox_utm30'])
    LOG['finished'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    json.dump(LOG, open(os.path.join(OUT, 'fetch_log.json'), 'w'), indent=1, ensure_ascii=False)

if __name__ == '__main__':
    main()
