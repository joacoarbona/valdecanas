#!/usr/bin/env python3
"""Download open geodata for the Madrid golf world (Real Club de la Puerta de Hierro + Club de Campo Villa de Madrid)
into madrid/data/. Same sources and formats as the Valdecañas pipeline (scripts/fetch_geodata.py):

- IGN / CNIG: MDT elevation (WCS) and PNOA orthophoto (WMS). Licence CC BY 4.0, (c) Instituto Geografico Nacional.
- Direccion General del Catastro: INSPIRE buildings (WFS).
- OpenStreetMap contributors (Overpass API + Nominatim). Licence ODbL.

The area is the union of the two clubs' golf-course polygons from OpenStreetMap, plus a margin."""
import json, os, re, sys, time, urllib.parse, urllib.request
from pyproj import Transformer
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join('madrid', 'data'); RAW = os.path.join(OUT, 'raw'); os.makedirs(os.path.join(RAW, 'ortho'), exist_ok=True)
UA = {'User-Agent': 'valdecanas-family-game/1.0 (madrid golf world; +https://github.com/joacoarbona/valdecanas)'}
LOG = {'started': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'steps': []}
# a generous search window over the north-west of Madrid (Monte del Pardo, Casa de Campo, Aravaca)
SEARCH = (40.415, -3.800, 40.495, -3.700)
CLUBS = [('puerta_hierro', ['Real Club de la Puerta de Hierro', 'Puerta de Hierro']), ('club_campo', ['Club de Campo Villa de Madrid', 'Club de Campo'])]

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

def overpass_query(q, timeout=240):
    for url in ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter']:
        try:
            d, _ = get(url, timeout=timeout, data=urllib.parse.urlencode({'data': q}).encode())
            return json.loads(d)
        except Exception as ex:
            log('overpass fail', url, repr(ex)[:200])
    return None

def locate():
    """The two clubs' golf-course areas from OSM (leisure=golf_course), matched by name; Nominatim as a fallback."""
    s, w, n, e = SEARCH
    js = overpass_query(f'[out:json][timeout:120];nwr["leisure"="golf_course"]({s},{w},{n},{e});out body geom;', 180) or {'elements': []}
    courses = []
    for el in js.get('elements', []):
        t = el.get('tags', {}); name = t.get('name', '') or ''
        pts = []
        if el.get('geometry'): pts = [(g['lon'], g['lat']) for g in el['geometry']]
        for m in el.get('members', []) or []:
            pts += [(g['lon'], g['lat']) for g in (m.get('geometry') or [])]
        if el.get('bounds'):
            b = el['bounds']; pts += [(b['minlon'], b['minlat']), (b['maxlon'], b['maxlat'])]
        if not pts: continue
        lons = [p[0] for p in pts]; lats = [p[1] for p in pts]
        courses.append({'id': el['type'] + '/' + str(el['id']), 'name': name, 'tags': t, 'bbox': [min(lons), min(lats), max(lons), max(lats)]})
    LOG['golf_courses_found'] = courses
    picked = {}
    for key, names in CLUBS:
        for c in courses:
            if any(nm.lower() in c['name'].lower() for nm in names): picked.setdefault(key, []).append(c)
    if len(picked) < 2:
        for key, names in CLUBS:
            if key in picked: continue
            try:
                d, _ = get('https://nominatim.openstreetmap.org/search?' + urllib.parse.urlencode({'q': names[0] + ', Madrid', 'format': 'jsonv2', 'limit': 5, 'countrycodes': 'es'}), timeout=60)
                for r in json.loads(d):
                    bb = [float(v) for v in r['boundingbox']]
                    picked.setdefault(key, []).append({'id': 'nominatim', 'name': r.get('display_name'), 'bbox': [bb[2], bb[0], bb[3], bb[1]]}); break
            except Exception as ex:
                log('nominatim fail', key, ex)
            time.sleep(1.5)
    LOG['clubs'] = picked
    allb = [c['bbox'] for v in picked.values() for c in v]
    if not allb:
        log('clubs not found: fallback window'); return [-3.765, 40.432, -3.725, 40.470], picked
    return [min(b[0] for b in allb), min(b[1] for b in allb), max(b[2] for b in allb), max(b[3] for b in allb)], picked

def overpass(s, w, n, e):
    bb = f'{s},{w},{n},{e}'
    keys = ['leisure', 'golf', 'highway', 'natural', 'landuse', 'amenity', 'tourism', 'man_made', 'place', 'water', 'waterway', 'barrier', 'sport', 'railway', 'surface']
    q = '[out:json][timeout:240];(' + ''.join(f'nwr["{k}"]({bb});' for k in keys) + ');out body geom;'
    js = overpass_query(q, 300)
    if not js: return
    open(os.path.join(OUT, 'osm.json'), 'w').write(json.dumps(js))
    kinds = {}
    for el in js.get('elements', []):
        t = el.get('tags', {})
        for k in ('golf', 'highway', 'leisure', 'natural', 'landuse', 'water'):
            if k in t: kinds[k + '=' + t[k]] = kinds.get(k + '=' + t[k], 0) + 1
    holes = [el.get('tags', {}) for el in js.get('elements', []) if el.get('tags', {}).get('golf') == 'hole']
    LOG['osm_counts'] = dict(sorted(kinds.items(), key=lambda kv: -kv[1])[:100]); LOG['osm_holes'] = holes
    log('osm ok', len(js.get('elements', [])), 'elements;', len(holes), 'golf=hole')

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
    cands = sorted([i for i in ids if '25830' in i and res(i) >= 2], key=res) or ['Elevacion25830_2', 'Elevacion25830_5']
    got = 0
    for cid in cands:
        if res(cid) > 5 and got: break
        for ax in (('x', 'y'), ('E', 'N'), ('X', 'Y')):
            url = (f'{base}?SERVICE=WCS&VERSION=2.0.1&REQUEST=GetCoverage&COVERAGEID={cid}'
                   f'&SUBSET={ax[0]}({minx},{maxx})&SUBSET={ax[1]}({miny},{maxy})&FORMAT=image/tiff')
            try:
                d, ct = get(url, timeout=400, tries=2)
                if d[:2] in (b'II', b'MM') and len(d) > 10000:
                    open(os.path.join(RAW, f'dem_{cid}.tif'), 'wb').write(d); log('dem ok', cid, ax, len(d)); LOG.setdefault('dem', []).append(cid); got += 1; break
                log('dem not tiff', cid, ax, ct, d[:300])
            except Exception as e:
                log('dem fail', cid, ax, e)
        if got >= 2: break

def dem_region(cx, cy, half=70000):
    """Coarse relief of the surroundings (Sierra de Guadarrama to the north-west) for the horizon."""
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
                d, ct = get(url, timeout=400, tries=2)
                if d[:2] in (b'II', b'MM') and len(d) > 5000:
                    open(os.path.join(RAW, f'dem_region_{cid}.tif'), 'wb').write(d); log('dem region ok', cid, len(d)); LOG['dem_region'] = cid; return
                log('dem region not tiff', cid, ct, d[:200])
            except Exception as e:
                log('dem region fail', cid, e)

def ortho(minx, miny, maxx, maxy, px=0.3, tile=2000):
    base = 'https://www.ign.es/wms-inspire/pnoa-ma'
    span = tile * px; nx = int(-(-(maxx - minx) // span)); ny = int(-(-(maxy - miny) // span))
    tiles = []
    for j in range(ny):
        for i in range(nx):
            x0 = minx + i * span; y1 = maxy - j * span; x1 = x0 + span; y0 = y1 - span
            p = os.path.join(RAW, 'ortho', f'o_{j}_{i}.jpg')
            url = base + '?' + urllib.parse.urlencode({'SERVICE': 'WMS', 'VERSION': '1.3.0', 'REQUEST': 'GetMap', 'LAYERS': 'OI.OrthoimageCoverage',
                  'STYLES': '', 'CRS': 'EPSG:25830', 'BBOX': f'{x0},{y0},{x1},{y1}', 'WIDTH': tile, 'HEIGHT': tile, 'FORMAT': 'image/jpeg'})
            try:
                d, ct = get(url, timeout=240)
                if 'image' not in ct:
                    log('ortho not image', i, j, ct, d[:300]); continue
                open(p, 'wb').write(d); tiles.append((i, j, p)); log('ortho tile', i, j, len(d))
            except Exception as e:
                log('ortho fail', i, j, e)
            time.sleep(0.4)
    if tiles:
        W = nx * tile; H = ny * tile; mos = Image.new('RGB', (W, H), (110, 120, 100))
        for i, j, p in tiles:
            mos.paste(Image.open(p).convert('RGB'), (i * tile, j * tile))
        for size in (8192, 4096, 2048):
            mos.resize((size, int(size * H / W)), Image.LANCZOS).save(os.path.join(OUT, f'ortho_{size}.jpg'), quality=86 if size < 8192 else 82, optimize=True, progressive=True)
        LOG['ortho'] = {'tiles': len(tiles), 'nx': nx, 'ny': ny, 'px_m': px, 'bbox_utm30': [minx, maxy - ny * span, minx + nx * span, maxy]}

def catastro(minx, miny, maxx, maxy, step=800):
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
                    log('catastro', tn, int(x), int(y), len(d))
                except Exception as e:
                    log('catastro fail', tn, x, y, e)
                time.sleep(0.4)
            y += step
        x += step
    LOG['catastro_files'] = n

def main():
    bbox_ll, clubs = locate(); log('area lonlat', bbox_ll)
    to_utm = Transformer.from_crs('EPSG:4326', 'EPSG:25830', always_xy=True)
    to_ll = Transformer.from_crs('EPSG:25830', 'EPSG:4326', always_xy=True)
    xs, ys = zip(*[to_utm.transform(bbox_ll[0], bbox_ll[1]), to_utm.transform(bbox_ll[2], bbox_ll[3]), to_utm.transform(bbox_ll[0], bbox_ll[3]), to_utm.transform(bbox_ll[2], bbox_ll[1])])
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    cx = round((minx + maxx) / 2 / 10) * 10; cy = round((miny + maxy) / 2 / 10) * 10
    half = max(maxx - minx, maxy - miny) / 2 + 350; half = round(half / 50) * 50
    half_d = half + 1500
    meta = {'world': 'madrid', 'clubs': {k: [c['name'] for c in v] for k, v in clubs.items()}, 'clubs_bbox_lonlat': bbox_ll,
            'centre_utm30': [cx, cy], 'centre_lonlat': list(to_ll.transform(cx, cy)),
            'ortho_bbox_utm30': [cx - half, cy - half, cx + half, cy + half], 'dem_bbox_utm30': [cx - half_d, cy - half_d, cx + half_d, cy + half_d], 'crs': 'EPSG:25830',
            'sources': {'dem': 'IGN MDT (WCS servicios.idee.es) — CC BY 4.0 (c) Instituto Geografico Nacional',
                        'ortho': 'IGN PNOA máxima actualidad (WMS) — CC BY 4.0 (c) Instituto Geografico Nacional',
                        'buildings': 'Direccion General del Catastro (INSPIRE WFS)', 'osm': '(c) OpenStreetMap contributors, ODbL'}}
    s_w = to_ll.transform(cx - half_d, cy - half_d); n_e = to_ll.transform(cx + half_d, cy + half_d)
    meta['dem_bbox_lonlat'] = [s_w[0], s_w[1], n_e[0], n_e[1]]
    json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=1, ensure_ascii=False)
    log('meta', meta['ortho_bbox_utm30'], 'half', half)
    overpass(s_w[1], s_w[0], n_e[1], n_e[0])
    dem(*meta['dem_bbox_utm30'])
    dem_region(cx, cy)
    ortho(*meta['ortho_bbox_utm30'])
    catastro(*meta['ortho_bbox_utm30'])
    LOG['finished'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    json.dump(LOG, open(os.path.join(OUT, 'fetch_log.json'), 'w'), indent=1, ensure_ascii=False)

if __name__ == '__main__':
    main()
