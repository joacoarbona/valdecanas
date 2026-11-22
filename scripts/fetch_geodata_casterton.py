#!/usr/bin/env python3
"""Download open geodata for the Casterton world (Casterton, Sedbergh Prep, the golf club next door and 3 km of the
Lune valley around) into casterton/data/. Runs in GitHub Actions (see .github/workflows/geodata-casterton.yml),
because the cloud sandbox cannot reach these servers.

Sources (all open):
- Environment Agency LIDAR Composite DTM 1 m and First Return DSM 1 m (WCS). Open Government Licence,
  (c) Environment Agency copyright and/or database right.
- Environment Agency LIDAR Composite DTM 2 m for the land around (WCS); Copernicus GLO-30 DEM for the region
  (AWS open data; (c) DLR e.V. 2010-2014 and (c) Airbus Defence and Space GmbH 2014-2018, provided under COPERNICUS
  by the European Union and ESA).
- Copernicus Sentinel-2 L2A (Earth Search STAC, AWS open data): summer colour composite, 10 m.
- OpenStreetMap contributors (Overpass API). ODbL.
- Ordnance Survey OS OpenMap Local buildings (OGL), to fill footprints that OpenStreetMap lacks.
- Environment Agency vertical aerial photography index (only logged: the photos are ECW and project based).

Game frame: British National Grid (EPSG:27700) metres, origin at the school; x = east, z = south.
Outputs (casterton/data):
  meta.json, fetch_log.json, osm.json.gz, os_buildings.json.gz
  raw/dtm_2m.tif      uint16 centimetres over the core + 300 m (2 m)
  raw/ndsm_1m.tif     uint8 decimetres (DSM - DTM, 0..25.5 m) over the same square (1 m)
  raw/dtm_wide_20m.tif float32 over 16 km (EA 2 m resampled, Copernicus where missing)
  raw/dem_region_200m.tif float32 over 120 km (Copernicus GLO-30)
  raw/s2_wide_10m.jpg  Sentinel-2 summer composite over the 16 km square (north up, BNG aligned)"""
import gzip, io, json, math, os, re, sqlite3, struct, sys, time, urllib.parse, urllib.request, zipfile
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from pyproj import Transformer

OUT = os.path.join('casterton', 'data'); RAW = os.path.join(OUT, 'raw'); os.makedirs(RAW, exist_ok=True)
TMP = os.path.join('/tmp', 'casterton'); os.makedirs(TMP, exist_ok=True)
UA = {'User-Agent': 'valdecanas-family-game/1.0 (casterton world; +https://github.com/joacoarbona/valdecanas)'}
LOG = {'started': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'steps': []}
CX, CY = 362600, 479700            # Casterton, Sedbergh Prep (OSM way 556124820), BNG metres
CORE_H = 3000; MARGIN = 300        # core square: 6 km; LIDAR over 6.6 km
WIDE_H = 8000                      # 16 km
REG_H = 60000                      # 120 km
to_bng = Transformer.from_crs('EPSG:4326', 'EPSG:27700', always_xy=True)
to_ll = Transformer.from_crs('EPSG:27700', 'EPSG:4326', always_xy=True)

def log(*a):
    s = ' '.join(str(x) for x in a); print(s, flush=True); LOG['steps'].append(s[:600])
def save_log():
    LOG['finished'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    json.dump(LOG, open(os.path.join(OUT, 'fetch_log.json'), 'w'), indent=1)

def get(url, timeout=180, tries=4, data=None, headers=None, quiet=False):
    h = dict(UA); h.update(headers or {}); last = None; wait = 4
    for i in range(tries):
        try:
            req = urllib.request.Request(url, data=data, headers=h)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read(), r.headers.get('Content-Type', '')
        except urllib.error.HTTPError as e:
            body = b''
            try: body = e.read()[:400]
            except Exception: pass
            last = f'{e} {body!r}'
            if e.code in (400, 404) and i >= 1: break
            if e.code in (429, 503):   # the EA servers limit the rate: wait as long as they ask, or longer each time
                ra = e.headers.get('Retry-After') if e.headers else None
                wait = max(float(ra) if ra and ra.replace('.', '', 1).isdigit() else 0, 15 * (i + 1))
        except Exception as e:
            last = repr(e)
        if not quiet: log('retry', i + 1, url[:170], str(last)[:260])
        time.sleep(max(wait, 4 * (i + 1)))
    raise RuntimeError(f'failed {url[:170]}: {str(last)[:300]}')

def bng_box_ll(x0, y0, x1, y1):
    xs = [x0, x1, x0, x1]; ys = [y0, y0, y1, y1]; lo, la = to_ll.transform(xs, ys)
    return min(lo), min(la), max(lo), max(la)

# ------------------------------------------------------------------ Environment Agency WCS
WCS_BASE = 'https://environment.data.gov.uk/spatialdata/{slug}/wcs'
def wcs_caps(slug):
    d, _ = get(WCS_BASE.format(slug=slug) + '?request=GetCapabilities&service=WCS&version=2.0.1', timeout=90, tries=3)
    t = d.decode('utf-8', 'replace')
    ids = re.findall(r'<wcs:CoverageId>([^<]+)</wcs:CoverageId>', t)
    op = re.search(r'<ows:Operation name="GetCoverage">.*?xlink:href="([^"]+)"', t, re.S)
    return ids, (op.group(1) if op else WCS_BASE.format(slug=slug) + '?')
def wcs_axes(url, cid):
    try:
        d, _ = get(url + ('&' if '?' in url and not url.endswith('?') else '') + 'service=WCS&version=2.0.1&request=DescribeCoverage&CoverageId=' + urllib.parse.quote(cid), timeout=90, tries=2)
        t = d.decode('utf-8', 'replace'); m = re.search(r'axisLabels="([^"]+)"', t)
        LOG.setdefault('describe', {})[cid] = t[:1800]
        if m: return m.group(1).split()
    except Exception as e:
        log('describe fail', cid, str(e)[:200])
    return ['E', 'N']
def wcs_tile(url, cid, ax, x0, y0, x1, y1):
    q = url + ('&' if '?' in url and not url.endswith('?') else '') + urllib.parse.urlencode([('service', 'WCS'), ('version', '2.0.1'), ('request', 'GetCoverage'), ('CoverageId', cid),
        ('subset', f'{ax[0]}({x0},{x1})'), ('subset', f'{ax[1]}({y0},{y1})'), ('format', 'image/tiff')])
    d, ct = get(q, timeout=240, tries=6, quiet=True)
    if not d[:4] in (b'II*\x00', b'MM\x00*'): raise RuntimeError('not a tiff: ' + ct + ' ' + d[:300].decode('utf-8', 'replace'))
    return d
def read_tiff(b):
    import rasterio
    with rasterio.MemoryFile(b) as mf, mf.open() as s:
        a = s.read(1).astype('float32'); nd = s.nodata; tr = s.transform
    if nd is not None: a[a == nd] = np.nan
    a[(a < -1000) | (a > 5000)] = np.nan
    return a, tr
def wcs_grid(slugs, want, x0, y0, x1, y1, res, chunk):
    """Mosaic a WCS coverage over [x0,x1]x[y0,y1] (BNG) on a north-up grid of `res` metres; NaN where missing."""
    for slug in slugs:
        try:
            ids, url = wcs_caps(slug)
        except Exception as e:
            log('wcs caps fail', slug, str(e)[:200]); continue
        cids = [c for c in ids if all(w.lower() in c.lower() for w in want)] or [c for c in ids if 'elevation' in c.lower()]
        log('wcs', slug, 'ids', ids, '->', cids[:1], 'url', url[:120])
        if not cids: continue
        cid = cids[0]; ax = wcs_axes(url, cid); log('axes', ax)
        nx = int(round((x1 - x0) / res)); ny = int(round((y1 - y0) / res)); G = np.full((ny, nx), np.nan, 'float32')
        jobs = [(a, b, chunk) for b in np.arange(y0, y1, chunk) for a in np.arange(x0, x1, chunk)]
        ok = [0]; bad = []; failed = []
        def one(job):
            a, b, ch = job; a2 = min(a + ch, x1); b2 = min(b + ch, y1)
            try:
                arr, tr = read_tiff(wcs_tile(url, cid, ax, int(a), int(b), int(a2), int(b2)))
            except Exception as e:
                bad.append(str(e)[:200]); failed.append(job); return
            px = tr.a; ox, oy = tr.c, tr.f
            if abs(px - res) > 1e-6:   # resample to the target spacing (block mean or nearest)
                f = res / px
                if f >= 1 and abs(f - round(f)) < 1e-6:
                    k = int(round(f)); hh, ww = arr.shape[0] // k * k, arr.shape[1] // k * k
                    arr = np.nanmean(arr[:hh, :ww].reshape(hh // k, k, ww // k, k), axis=(1, 3)); px = res
                else:
                    bad.append(f'res {px} vs {res}'); return
            c0 = int(round((ox - x0) / res)); r0 = int(round((y1 - oy) / res))
            r1 = r0 + arr.shape[0]; c1 = c0 + arr.shape[1]
            rr0, cc0 = max(r0, 0), max(c0, 0); rr1, cc1 = min(r1, ny), min(c1, nx)
            if rr1 <= rr0 or cc1 <= cc0: return
            sub = arr[rr0 - r0:rr1 - r0, cc0 - c0:cc1 - c0]; dst = G[rr0:rr1, cc0:cc1]
            m = ~np.isnan(sub); dst[m] = sub[m]; ok[0] += 1
        with ThreadPoolExecutor(2) as ex: list(ex.map(one, jobs))
        for ps in range(4):   # the tiles refused for the rate limit: again, one at a time, in halves after the first pass
            if not failed: break
            todo = failed[:]; failed.clear(); log('wcs retry pass', ps + 1, len(todo), 'tiles'); time.sleep(30)
            for a, b, ch in todo:
                if ps == 0: one((a, b, ch))
                else:
                    h_ = ch / 2
                    for (aa, bb) in ((a, b), (a + h_, b), (a, b + h_), (a + h_, b + h_)):
                        if aa < x1 and bb < y1: one((aa, bb, h_))
                time.sleep(3)
        cover = float(np.mean(~np.isnan(G)))
        log('wcs grid', slug, cid, f'{ok[0]} tiles ok of {len(jobs)}, cover {cover:.4f}, still failed {len(failed)}', ('errors: ' + ' | '.join(b[-120:] for b in bad[:3])) if bad else '')
        if cover > 0.5: return G, {'slug': slug, 'coverage': cid, 'cover': cover}
    return None, None

# ------------------------------------------------------------------ Environment Agency survey tile download (fallback)
def survey_tiles(kind, x0, y0, x1, y1):
    """Fallback: the Defra survey download API (5 km GeoTIFF tiles in zips). kind = 'dtm' or 'dsm'."""
    poly = {'type': 'Polygon', 'coordinates': [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]]}
    out = []
    for url in ['https://environment.data.gov.uk/backend/catalog/api/tiles/collections/survey/search']:
        try:
            d, _ = get(url, timeout=120, tries=2, data=json.dumps(poly).encode(), headers={'Content-Type': 'application/geo+json'})
            js = json.loads(d); res = js.get('results', js if isinstance(js, list) else [])
            LOG.setdefault('survey_products', sorted({(r.get('product', {}) or {}).get('id', '?') for r in res}))
            for r in res:
                pid = ((r.get('product') or {}).get('id') or '').lower(); reso = str(((r.get('resolution') or {}).get('id')) or '')
                if 'composite' not in pid or reso not in ('1', '1m'): continue
                if kind == 'dtm' and 'dtm' in pid: out.append(r)
                if kind == 'dsm' and 'dsm' in pid and ('first' in pid or 'fz' in pid): out.append(r)
        except Exception as e:
            log('survey search fail', str(e)[:200])
    if not out: return None
    import rasterio
    from rasterio.merge import merge
    srcs = []
    for r in out:
        uri = r.get('uri') or r.get('url')
        if not uri: continue
        try:
            d, _ = get(uri, timeout=600, tries=3)
            z = zipfile.ZipFile(io.BytesIO(d))
            for n in z.namelist():
                if n.lower().endswith('.tif'):
                    p = os.path.join(TMP, os.path.basename(n)); open(p, 'wb').write(z.read(n)); srcs.append(rasterio.open(p))
        except Exception as e:
            log('survey tile fail', uri[:150], str(e)[:200])
    if not srcs: return None
    arr, tr = merge(srcs, bounds=(x0, y0, x1, y1), res=1.0, nodata=-9999)
    a = arr[0].astype('float32'); a[a < -1000] = np.nan
    log('survey tiles', kind, len(srcs), 'cover', float(np.mean(~np.isnan(a))))
    return a

# ------------------------------------------------------------------ Copernicus GLO-30 (region, and the land around where EA is missing)
def copernicus(x0, y0, x1, y1, res):
    import rasterio
    from rasterio.warp import reproject, Resampling
    from rasterio.transform import from_origin
    lo0, la0, lo1, la1 = bng_box_ll(x0, y0, x1, y1)
    nx = int(round((x1 - x0) / res)); ny = int(round((y1 - y0) / res)); G = np.full((ny, nx), np.nan, 'float32')
    dst_tr = from_origin(x0, y1, res, res); n_ok = 0
    for la in range(int(math.floor(la0)), int(math.floor(la1)) + 1):
        for lo in range(int(math.floor(lo0)), int(math.floor(lo1)) + 1):
            ns = ('N' if la >= 0 else 'S') + f'{abs(la):02d}'; ew = ('E' if lo >= 0 else 'W') + f'{abs(lo):03d}'
            name = f'Copernicus_DSM_COG_10_{ns}_00_{ew}_00_DEM'
            url = f'https://copernicus-dem-30m.s3.amazonaws.com/{name}/{name}.tif'
            try:
                with rasterio.open('/vsicurl/' + url) as s:
                    tmp = np.full((ny, nx), np.nan, 'float32')
                    reproject(rasterio.band(s, 1), tmp, src_nodata=s.nodata, dst_transform=dst_tr, dst_crs='EPSG:27700', dst_nodata=np.nan, resampling=Resampling.average if res > 60 else Resampling.bilinear)
                m = ~np.isnan(tmp); G[m] = tmp[m]; n_ok += 1; log('copernicus', name, float(m.mean()))
            except Exception as e:
                log('copernicus fail', name, str(e)[:200])
    G[np.isnan(G)] = 0.0   # the Irish Sea
    return G, n_ok

def write_tif(path, a, x0, y1, res, dtype, nodata=None, scale=1.0):
    import rasterio
    from rasterio.transform import from_origin
    prof = dict(driver='GTiff', height=a.shape[0], width=a.shape[1], count=1, dtype=dtype, crs='EPSG:27700', transform=from_origin(x0, y1, res, res),
                compress='deflate', zlevel=9, predictor=(3 if dtype == 'float32' else 2), tiled=True, blockxsize=256, blockysize=256)
    if nodata is not None: prof['nodata'] = nodata
    with rasterio.open(path, 'w', **prof) as d:
        if dtype == 'float32': d.write(a.astype('float32'), 1)
        else:
            info = np.iinfo(dtype); v = np.where(np.isnan(a), nodata if nodata is not None else 0, np.clip(np.round(a * scale), info.min, info.max))
            d.write(v.astype(dtype), 1)
    log('wrote', path, os.path.getsize(path))

# ------------------------------------------------------------------ Sentinel-2 summer composite
def sentinel(x0, y0, x1, y1, res=10.0, nmax=10):
    import rasterio
    from rasterio.vrt import WarpedVRT
    from rasterio.enums import Resampling
    from rasterio.windows import from_bounds
    lo0, la0, lo1, la1 = bng_box_ll(x0, y0, x1, y1)
    items = []
    for coll in ('sentinel-2-l2a', 'sentinel-2-c1-l2a'):
        for yr in (2025, 2024, 2023, 2022):
            body = {'collections': [coll], 'bbox': [lo0, la0, lo1, la1], 'datetime': f'{yr}-05-01T00:00:00Z/{yr}-09-15T23:59:59Z',
                    'query': {'eo:cloud_cover': {'lt': 25}}, 'limit': 100}
            try:
                d, _ = get('https://earth-search.aws.element84.com/v1/search', timeout=90, tries=3, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
                for f in json.loads(d).get('features', []):
                    a = f.get('assets', {}); vis = a.get('visual') or a.get('TCI'); scl = a.get('scl') or a.get('SCL')
                    if vis: items.append({'id': f['id'], 'cc': f['properties'].get('eo:cloud_cover', 99), 'vis': vis['href'], 'scl': scl['href'] if scl else None, 'coll': coll})
            except Exception as e:
                log('stac fail', coll, yr, str(e)[:200])
        if items: break
    items.sort(key=lambda r: r['cc']); seen = set(); pick = []
    for it in items:
        if it['id'] in seen: continue
        seen.add(it['id']); pick.append(it)
        if len(pick) >= nmax: break
    log('sentinel scenes', [(p['id'], round(p['cc'], 1)) for p in pick])
    nx = int(round((x1 - x0) / res)); ny = int(round((y1 - y0) / res)); stack = []
    for it in pick:
        try:
            from rasterio.transform import from_origin
            dtr = from_origin(x0, y1, res, res)
            with rasterio.open('/vsicurl/' + it['vis']) as s, WarpedVRT(s, crs='EPSG:27700', transform=dtr, width=nx, height=ny, resampling=Resampling.bilinear, nodata=0) as v:
                rgb = v.read().astype('float32')[:3]
            valid = rgb.sum(0) > 0
            if it['scl']:
                with rasterio.open('/vsicurl/' + it['scl']) as s, WarpedVRT(s, crs='EPSG:27700', transform=dtr, width=nx, height=ny, resampling=Resampling.nearest, nodata=0) as v:
                    scl = v.read(1)
                valid &= np.isin(scl, (4, 5, 6, 7))
            rgb[:, ~valid] = np.nan; stack.append(rgb); log('sentinel read', it['id'], 'valid', round(float(valid.mean()), 3))
        except Exception as e:
            log('sentinel fail', it['id'], str(e)[:200])
    if not stack: return None
    S = np.stack(stack); med = np.nanmedian(S, axis=0)
    hole = np.isnan(med)
    if hole.any():   # anywhere every scene was cloudy: plain median of the raw values
        log('sentinel holes', float(hole.mean()))
        med[hole] = 110.0
    return np.clip(np.moveaxis(med, 0, -1), 0, 255).astype('uint8')

# ------------------------------------------------------------------ OpenStreetMap
def overpass(q, timeout=420):
    for url in ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter', 'https://maps.mail.ru/osm/tools/overpass/api/interpreter']:
        try:
            d, _ = get(url, timeout=timeout, tries=2, data=urllib.parse.urlencode({'data': q}).encode())
            js = json.loads(d)
            if js.get('elements') is not None: return js
        except Exception as ex:
            log('overpass fail', url, str(ex)[:200])
    return None

# ------------------------------------------------------------------ OS OpenMap Local buildings (fill-in)
def gpkg_geom(blob):
    # GeoPackage binary: 'GP', version, flags, srs_id, envelope, then WKB
    flags = blob[3]; env = (flags >> 1) & 7; n = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}.get(env, 0)
    from shapely import wkb
    return wkb.loads(bytes(blob[8 + n:]))
def os_buildings(x0, y0, x1, y1):
    try:
        d, _ = get('https://api.os.uk/downloads/v1/products/OpenMapLocal/downloads', timeout=90, tries=3)
        lst = json.loads(d)
        LOG['os_downloads'] = [(r.get('area'), r.get('format'), r.get('fileName'), r.get('size')) for r in lst][:80]
        sd = [r for r in lst if r.get('area') == 'SD']
        pick = [r for r in sd if 'geopackage' in (r.get('format') or '').lower()] or [r for r in sd if 'shapefile' in (r.get('format') or '').lower()]
        log('os openmap list', len(lst), 'SD:', [(r.get('format'), r.get('fileName'), r.get('size')) for r in sd])
        if not pick: return None
        url = pick[0]['url']
        p = os.path.join(TMP, 'oml.zip')
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=1200) as r, open(p, 'wb') as f:
            while True:
                b = r.read(1 << 20)
                if not b: break
                f.write(b)
        z = zipfile.ZipFile(p); gp = [n for n in z.namelist() if n.lower().endswith('.gpkg')]
        log('os openmap zip', os.path.getsize(p), gp or [n for n in z.namelist() if 'uilding' in n][:6])
        if not gp: return os_buildings_shp(z, x0, y0, x1, y1)
        gpp = z.extract(gp[0], TMP); con = sqlite3.connect(gpp)
        tabs = [r[0] for r in con.execute("select table_name from gpkg_contents where data_type='features'")]
        log('os tables', tabs)
        bt = [t for t in tabs if 'building' in t.lower()]
        if not bt: return None
        t = bt[0]; gc = con.execute("select column_name from gpkg_geometry_columns where table_name=?", (t,)).fetchone()[0]
        rt = f'rtree_{t}_{gc}'
        try:
            rows = con.execute(f'select g.{gc} from "{t}" g join "{rt}" r on g.fid=r.id where r.maxx>=? and r.minx<=? and r.maxy>=? and r.miny<=?', (x0, x1, y0, y1)).fetchall()
        except Exception as e:
            log('rtree fail', e); rows = con.execute(f'select {gc} from "{t}"').fetchall()
        out = []
        for (blob,) in rows:
            try:
                g = gpkg_geom(blob)
            except Exception:
                continue
            for P in (getattr(g, 'geoms', None) or [g]):
                if P.geom_type != 'Polygon': continue
                b = P.bounds
                if b[2] < x0 or b[0] > x1 or b[3] < y0 or b[1] > y1: continue
                out.append({'e': [[round(x - CX, 2), round(CY - y, 2)] for x, y in P.exterior.coords[:-1]], 'h': [[[round(x - CX, 2), round(CY - y, 2)] for x, y in r.coords[:-1]] for r in P.interiors]})
        log('os buildings', len(out)); return out
    except Exception as e:
        log('os openmap fail', str(e)[:300]); return None

def os_buildings_shp(z, x0, y0, x1, y1):
    import shapefile   # pyshp
    shp = [n for n in z.namelist() if n.lower().endswith('.shp') and 'building' in n.lower()]
    out = []
    for n in shp:
        base = n[:-4]
        r = shapefile.Reader(shp=io.BytesIO(z.read(base + '.shp')), shx=io.BytesIO(z.read(base + '.shx')), dbf=io.BytesIO(z.read(base + '.dbf')))
        for sh in r.iterShapes():
            b = sh.bbox
            if b[2] < x0 or b[0] > x1 or b[3] < y0 or b[1] > y1: continue
            parts = list(sh.parts) + [len(sh.points)]
            rings = [sh.points[parts[i]:parts[i + 1]] for i in range(len(parts) - 1)]
            if not rings: continue
            out.append({'e': [[round(x - CX, 2), round(CY - y, 2)] for x, y in rings[0][:-1]], 'h': [[[round(x - CX, 2), round(CY - y, 2)] for x, y in rg[:-1]] for rg in rings[1:]]})
    log('os buildings (shapefile)', len(out)); return out

def photo_index(x0, y0, x1, y1):
    q = urllib.parse.urlencode({'where': '1=1', 'geometry': f'{x0},{y0},{x1},{y1}', 'geometryType': 'esriGeometryEnvelope', 'inSR': 27700, 'spatialRel': 'esriSpatialRelIntersects',
                                'outFields': '*', 'returnGeometry': 'false', 'f': 'json'})
    for lyr in (0, 1, 2):
        try:
            d, _ = get(f'https://gisrest.defra.gov.uk/server/rest/services/EA/Vertical_Photography_Catalogues/MapServer/{lyr}/query?' + q, timeout=90, tries=2)
            js = json.loads(d); feats = [f.get('attributes') for f in js.get('features', [])]
            LOG.setdefault('vertical_photo_index', {})[lyr] = feats[:40]; log('photo index layer', lyr, len(feats))
        except Exception as e:
            log('photo index fail', lyr, str(e)[:200])

STEPS = set((os.environ.get('STEPS') or 'osm,lidar,wide,region,sentinel,os,photo').split(','))
def main():
    t0 = time.time(); log('steps', sorted(STEPS))
    cx0, cy0, cx1, cy1 = CX - CORE_H - MARGIN, CY - CORE_H - MARGIN, CX + CORE_H + MARGIN, CY + CORE_H + MARGIN
    meta = {'world': 'casterton', 'crs': 'EPSG:27700', 'centre_bng': [CX, CY], 'centre_lonlat': list(to_ll.transform(CX, CY)),
            'core_bbox_bng': [CX - CORE_H, CY - CORE_H, CX + CORE_H, CY + CORE_H], 'lidar_bbox_bng': [cx0, cy0, cx1, cy1],
            'wide_bbox_bng': [CX - WIDE_H, CY - WIDE_H, CX + WIDE_H, CY + WIDE_H], 'region_bbox_bng': [CX - REG_H, CY - REG_H, CX + REG_H, CY + REG_H],
            'sources': {'lidar': 'Environment Agency LIDAR Composite DTM and First Return DSM, 1 m (OGL) (c) Environment Agency copyright and/or database right',
                        'wide': 'Environment Agency LIDAR Composite DTM 2 m (OGL); Copernicus GLO-30 DEM where missing',
                        'region': 'Copernicus GLO-30 DEM (c) DLR e.V. 2010-2014 and (c) Airbus Defence and Space GmbH 2014-2018, provided under COPERNICUS by the European Union and ESA',
                        'colour': 'Copernicus Sentinel-2 L2A (modified Copernicus Sentinel data), Earth Search (AWS open data)',
                        'osm': '(c) OpenStreetMap contributors, ODbL', 'os': 'Contains OS data (c) Crown copyright and database right (OS OpenMap Local, OGL)'}}
    json.dump(meta, open(os.path.join(OUT, 'meta.json'), 'w'), indent=1)
    # ---- OpenStreetMap over the core + 1 km
    s_, w_, n_, e_ = None, None, None, None
    lo0, la0, lo1, la1 = bng_box_ll(CX - CORE_H - 1000, CY - CORE_H - 1000, CX + CORE_H + 1000, CY + CORE_H + 1000)
    js = overpass(f'[out:json][timeout:400][maxsize:1073741824];(nwr({la0},{lo0},{la1},{lo1}););out body geom;') if 'osm' in STEPS else None
    if js:
        with gzip.open(os.path.join(OUT, 'osm.json.gz'), 'wt', encoding='utf-8') as f: json.dump(js, f, separators=(',', ':'))
        tags = {}
        for el in js['elements']:
            t = el.get('tags', {})
            for k in ('building', 'landuse', 'natural', 'barrier', 'leisure', 'golf', 'waterway', 'highway', 'amenity'):
                if k in t: tags[k + '=' + t[k]] = tags.get(k + '=' + t[k], 0) + 1
        LOG['osm_tags'] = dict(sorted(tags.items(), key=lambda kv: -kv[1])[:160])
        named = [(el['type'], el['id'], el['tags'].get('name')) for el in js['elements'] if el.get('tags', {}).get('name') and (el['tags'].get('amenity') == 'school' or el['tags'].get('leisure') in ('golf_course', 'pitch', 'sports_centre') or 'Grange' in el['tags'].get('name', '') or el['tags'].get('place'))]
        LOG['osm_named'] = named[:120]
        log('osm', len(js['elements']), 'elements')
    elif 'osm' in STEPS:
        log('osm FAILED')
    save_log()
    # ---- LIDAR, 1 m, over the core + 300 m
    dtm = dsm = dinfo = sinfo = None
    if 'lidar' in STEPS: dtm, dinfo = wcs_grid(['lidar-composite-digital-terrain-model-dtm-1m'], ['elevation', 'dtm'], cx0, cy0, cx1, cy1, 1.0, 1100)
    if dtm is None and 'lidar' in STEPS:
        dtm = survey_tiles('dtm', cx0, cy0, cx1, cy1); dinfo = {'source': 'survey tiles'} if dtm is not None else None
    if 'lidar' in STEPS: dsm, sinfo = wcs_grid(['lidar-composite-digital-surface-model-first-return-dsm-1m', 'lidar-composite-first-return-digital-surface-model-fz-dsm-1m',
                           'lidar-composite-digital-surface-model-dsm-1m', 'lidar-composite-digital-surface-model-last-return-dsm-1m'], ['elevation'], cx0, cy0, cx1, cy1, 1.0, 1100)
    if dsm is None and 'lidar' in STEPS:
        dsm = survey_tiles('dsm', cx0, cy0, cx1, cy1); sinfo = {'source': 'survey tiles'} if dsm is not None else None
    LOG['dtm'] = dinfo; LOG['dsm'] = sinfo
    if dtm is not None:
        # fill small holes (water, gaps) with the nearest valid value
        from scipy import ndimage as ndi
        m = np.isnan(dtm); LOG['dtm_missing'] = float(m.mean())
        if m.any():
            idx = ndi.distance_transform_edt(m, return_distances=False, return_indices=True); dtm = dtm[tuple(idx)]
        n2 = dtm.shape[0] // 2 * 2
        d2 = dtm[:n2, :n2].reshape(n2 // 2, 2, n2 // 2, 2).mean(axis=(1, 3))
        write_tif(os.path.join(RAW, 'dtm_2m.tif'), d2, cx0, cy1, 2.0, 'uint16', nodata=0, scale=100.0)
        LOG['dtm_range'] = [float(np.nanmin(dtm)), float(np.nanmax(dtm))]
        if dsm is not None:
            nd = dsm - dtm; LOG['ndsm_missing'] = float(np.mean(np.isnan(nd))); nd[np.isnan(nd)] = 0; nd = np.clip(nd, 0, 25.5)
            write_tif(os.path.join(RAW, 'ndsm_1m.tif'), nd, cx0, cy1, 1.0, 'uint8', scale=10.0)
            LOG['ndsm_share_over_2m'] = float(np.mean(nd > 2))
        del dsm
    elif 'lidar' in STEPS:
        log('LIDAR FAILED: the build will use Copernicus only')
    save_log()
    # ---- the land around (16 km at 20 m): EA 2 m DTM averaged, Copernicus where missing
    wx0, wy0, wx1, wy1 = CX - WIDE_H, CY - WIDE_H, CX + WIDE_H, CY + WIDE_H
    if 'wide' in STEPS: wide_step(wx0, wy0, wx1, wy1)
    if 'region' in STEPS:
        reg, n_ok = copernicus(CX - REG_H, CY - REG_H, CX + REG_H, CY + REG_H, 200.0)
        write_tif(os.path.join(RAW, 'dem_region_200m.tif'), reg, CX - REG_H, CY + REG_H, 200.0, 'float32')
    save_log()
    if 'sentinel' in STEPS:
        img = sentinel(wx0, wy0, wx1, wy1, 10.0)
        if img is not None:
            from PIL import Image
            Image.fromarray(img).save(os.path.join(RAW, 's2_wide_10m.jpg'), quality=93)
            log('sentinel composite', img.shape)
    save_log()
    if 'os' in STEPS:
        ob = os_buildings(cx0, cy0, cx1, cy1)
        if ob:
            with gzip.open(os.path.join(OUT, 'os_buildings.json.gz'), 'wt', encoding='utf-8') as f: json.dump(ob, f, separators=(',', ':'))
    if 'photo' in STEPS: photo_index(cx0, cy0, cx1, cy1)
    log('done in', round(time.time() - t0), 's'); save_log()

def wide_step(wx0, wy0, wx1, wy1):
    cop_w, _ = copernicus(wx0, wy0, wx1, wy1, 20.0)
    ea_w, winfo = wcs_grid(['lidar-composite-digital-terrain-model-dtm-2m'], ['elevation'], wx0, wy0, wx1, wy1, 20.0, 2000)
    wide = cop_w.copy()
    if ea_w is not None:
        m = ~np.isnan(ea_w); wide[m] = ea_w[m]; LOG['wide'] = winfo
    write_tif(os.path.join(RAW, 'dtm_wide_20m.tif'), wide, wx0, wy1, 20.0, 'float32')

if __name__ == '__main__':
    try:
        main()
    finally:
        save_log()
