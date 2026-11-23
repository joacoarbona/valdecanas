#!/usr/bin/env python3
"""Build the game assets of the Casterton world (Casterton, Sedbergh Prep, its golf club and 3 km of the Lune valley)
from the open data in casterton/data (see scripts/fetch_geodata_casterton.py).

Game frame: metres, x = east, z = south, y = up; origin = the school (casterton/data/meta.json, British National Grid);
y = 0 is sea level (the world has the Irish Sea in the far west, so WP.sea is true).

The ground texture is drawn, not photographed: there is no open aerial photo of Casterton. It mixes
  - the colour of a Copernicus Sentinel-2 summer composite (10 m),
  - the relief of the Environment Agency LIDAR surface model (1 m): every tree crown, hedge, dry stone wall and roof
    shades and casts its shadow as in an aerial photo,
  - OpenStreetMap: roads and tracks, water, sports pitches, the golf course, gardens and yards.

Outputs (casterton/game/data):
  h_core.bin (4 m over the 6 km core), h_wide.bin (20 m over 16 km), h_region.bin (200 m over 120 km)
  surface_core.rle (1.5 m surface codes), trees.bin, buildings.json, pools.json, walls.json, course.json
  ortho_core_4096.jpg / _2048.jpg, tiles/t_<j>_<i>.jpg (8 x 8 tiles of 1024 px, 0.73 m/px)
  ortho_wide_2048.jpg (16 km), ortho_map_2048.jpg + map_surface_2048.png (in-game map), build_report.json
Surface codes: 1 rough (moor, woods, scrub), 2 semi-rough, 3 fairway, 4 fringe, 5 green, 6 tee, 7 bunker,
8 road and path, 9 bare ground and yards, 10 grazed grass, lawns and pitches, 20+ water (index into course.json ponds)."""
import gzip, json, math, os, struct, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
from scipy import ndimage as ndi
import rasterio
from pyproj import Transformer
from shapely.geometry import Polygon, box, LineString, Point
from shapely.ops import unary_union

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D = os.path.join(ROOT, 'casterton', 'data'); OUT = os.path.join(ROOT, 'casterton', 'game', 'data'); TILES = os.path.join(OUT, 'tiles')
os.makedirs(TILES, exist_ok=True)
meta = json.load(open(os.path.join(D, 'meta.json'))); CX, CY = meta['centre_bng']
DATUM = 0.0
CORE = (-3000.0, -3000.0, 6000.0)       # x0, z0, size
SN = 4000                                # surface cells per side (1.5 m)
TN = 8192                                # drawn texture pixels per side (0.73 m)
NT = 8                                   # photo tiles per side
WIDE = (-8000.0, -8000.0, 16000.0)
REPORT = {'datum': DATUM, 'core': CORE}
ll = Transformer.from_crs('EPSG:4326', 'EPSG:27700', always_xy=True)
def loc(g): e, n = ll.transform(g['lon'], g['lat']); return (e - CX, CY - n)
def log(*a): print(*a, flush=True)
COURSE_ONLY = os.environ.get('COURSE_ONLY') == '1'   # only course.json (the holes, the range, footgolf and rugbygolf)
FAST = os.environ.get('FAST') == '1'     # quick runs while developing: smaller texture

# ------------------------------------------------------------------ helpers
def write_u16(path, h, offset, scale):
    v = np.clip(np.round((h + offset) * scale), 0, 65535).astype('<u2')
    with open(path, 'wb') as f:
        f.write(struct.pack('<4sIIff', b'VH16', h.shape[1], h.shape[0], float(offset), float(scale))); f.write(v.tobytes())
def write_rle(path, cls):
    flat = cls.ravel(); out = bytearray(struct.pack('<4sII', b'VRLE', cls.shape[1], cls.shape[0]))
    change = np.flatnonzero(np.diff(flat)) + 1
    starts = np.concatenate([[0], change]); ends = np.concatenate([change, [flat.size]])
    for s, e in zip(starts, ends):
        v = int(flat[s]); run = int(e - s)
        while run > 0:
            r = min(run, 65535); out += struct.pack('<BH', v, r); run -= r
    open(path, 'wb').write(out)
def ring_area(r):
    a = 0.0
    for i in range(len(r)):
        x1, z1 = r[i - 1]; x2, z2 = r[i]; a += x1 * z2 - x2 * z1
    return a / 2
def rdp(pts, tol):
    pts = np.asarray(pts, dtype='float64')
    if len(pts) < 3: return pts.tolist()
    keep = np.zeros(len(pts), bool); keep[0] = keep[-1] = True; st = [(0, len(pts) - 1)]
    while st:
        a, b = st.pop()
        if b <= a + 1: continue
        p, q = pts[a], pts[b]; v = q - p; L = math.hypot(*v) or 1e-9; w = pts[a + 1:b] - p
        d = np.abs(v[0] * w[:, 1] - v[1] * w[:, 0]) / L; i = int(np.argmax(d))
        if d[i] > tol: keep[a + 1 + i] = True; st += [(a, a + 1 + i), (a + 1 + i, b)]
    return pts[keep].tolist()
def simplify_ring(ring, tol=0.25):
    if len(ring) > 1 and ring[0] == ring[-1]: ring = ring[:-1]
    if len(ring) < 5: return [list(p) for p in ring]
    r = rdp(list(ring) + [ring[0]], tol)[:-1]
    return r if len(r) >= 3 else [list(p) for p in ring]
def sample(grid, gx0, gz0, res, xs, zs, order=1):
    return ndi.map_coordinates(grid, [(np.asarray(zs) - gz0) / res - 0.5, (np.asarray(xs) - gx0) / res - 0.5], order=order, mode='nearest')
def read_raster(name, scale=1.0, nodata_nan=True):
    with rasterio.open(os.path.join(D, 'raw', name)) as s:
        a = s.read(1).astype('float32'); tr = s.transform; nd = s.nodata
    if nd is not None and nodata_nan: a[a == nd] = np.nan
    return a * scale, tr.c - CX, CY - tr.f, tr.a

# ------------------------------------------------------------------ OpenStreetMap
osm = json.load(gzip.open(os.path.join(D, 'osm.json.gz'), 'rt', encoding='utf-8'))
def rings_of(el):
    if el['type'] == 'way' and el.get('geometry'): return [[loc(q) for q in el['geometry']]], []
    if el['type'] == 'relation':
        # stitch the member ways of each role into closed rings
        def stitch(ws):
            ws = [w for w in ws if len(w) >= 2]; rings = []
            while ws:
                cur = ws.pop(0)
                changed = True
                while changed and math.hypot(cur[0][0] - cur[-1][0], cur[0][1] - cur[-1][1]) > 0.5:
                    changed = False
                    for i, w in enumerate(ws):
                        if math.hypot(w[0][0] - cur[-1][0], w[0][1] - cur[-1][1]) < 0.5: cur = cur + w[1:]
                        elif math.hypot(w[-1][0] - cur[-1][0], w[-1][1] - cur[-1][1]) < 0.5: cur = cur + w[::-1][1:]
                        elif math.hypot(w[-1][0] - cur[0][0], w[-1][1] - cur[0][1]) < 0.5: cur = w + cur[1:]
                        elif math.hypot(w[0][0] - cur[0][0], w[0][1] - cur[0][1]) < 0.5: cur = w[::-1] + cur[1:]
                        else: continue
                        ws.pop(i); changed = True; break
                rings.append(cur)
            return rings
        outer = stitch([[loc(q) for q in (m.get('geometry') or [])] for m in el.get('members', []) if m.get('role') in ('outer', '') and m.get('geometry')])
        inner = stitch([[loc(q) for q in (m.get('geometry') or [])] for m in el.get('members', []) if m.get('role') == 'inner' and m.get('geometry')])
        return outer, inner
    return [], []
def closed(r): return len(r) > 3 and math.hypot(r[0][0] - r[-1][0], r[0][1] - r[-1][1]) < 0.5
def poly_of(el):
    outer, inner = rings_of(el); ps = []
    for r in outer:
        if not closed(r): continue
        P = Polygon(r, [h for h in inner if closed(h) and Polygon(r).contains(Polygon(h).representative_point())])
        if not P.is_valid: P = P.buffer(0)
        if not P.is_empty: ps.append(P)
    if not ps: return None
    U = unary_union(ps); return U if not U.is_empty else None
ELS = osm['elements']
def T(el): return el.get('tags', {})

class Raster:
    """Draw game-frame shapes onto a square grid covering the core."""
    def __init__(self, n, mode='L', fill=0):
        self.n = n; self.s = n / CORE[2]; self.im = Image.new(mode, (n, n), fill); self.d = ImageDraw.Draw(self.im)
    def px(self, p): return ((p[0] - CORE[0]) * self.s, (p[1] - CORE[1]) * self.s)
    def poly(self, P, fill):
        geoms = [P] if P.geom_type == 'Polygon' else list(getattr(P, 'geoms', []))
        for g in geoms:
            if g.geom_type != 'Polygon' or g.is_empty: continue
            self.d.polygon([self.px(q) for q in g.exterior.coords], fill=fill)
            for h in g.interiors: self.d.polygon([self.px(q) for q in h.coords], fill=0 if self.im.mode == 'L' else None)
    def poly_keep(self, P, fill):   # holes keep whatever was below
        geoms = [P] if P.geom_type == 'Polygon' else list(getattr(P, 'geoms', []))
        for g in geoms:
            if g.geom_type != 'Polygon' or g.is_empty: continue
            m = Image.new('L', self.im.size, 0); dm = ImageDraw.Draw(m)
            dm.polygon([self.px(q) for q in g.exterior.coords], fill=255)
            for h in g.interiors: dm.polygon([self.px(q) for q in h.coords], fill=0)
            self.im.paste(fill, (0, 0), m) if isinstance(fill, int) else self.im.paste(Image.new(self.im.mode, self.im.size, fill), (0, 0), m)
    def line(self, pts, w_m, fill):
        self.d.line([self.px(q) for q in pts], fill=fill, width=max(1, int(round(w_m * self.s))), joint='curve')
    def arr(self): return np.asarray(self.im)

# ------------------------------------------------------------------ the land cover from OpenStreetMap
def landcover():
    LC = {'wood': [], 'rough': [], 'water': [], 'river': [], 'pitch': [], 'astro': [], 'track': [], 'tennis': [], 'park': [], 'resid': [], 'yard': [], 'parking': [],
          'golf': [], 'fairway': [], 'green': [], 'tee': [], 'bunker': [], 'grough': [], 'school': [], 'farm': [], 'cemetery': [], 'quarry': []}
    for el in ELS:
        t = T(el)
        if not t or el['type'] == 'node': continue
        nat, lu, le, am, g = t.get('natural'), t.get('landuse'), t.get('leisure'), t.get('amenity'), t.get('golf')
        k = None
        if nat == 'water' or lu in ('reservoir', 'basin') or t.get('waterway') == 'riverbank':
            k = 'river' if (t.get('water') == 'river' or t.get('waterway') == 'riverbank') else 'water'
        elif nat in ('wood',) or lu == 'forest': k = 'wood'
        elif nat in ('heath', 'scrub', 'moor', 'wetland', 'fell', 'bare_rock', 'scree') or lu == 'brownfield': k = 'rough'
        elif g in ('fairway', 'green', 'tee', 'bunker'): k = g
        elif g == 'rough': k = 'grough'
        elif le == 'golf_course': k = 'golf'
        elif le == 'pitch':
            sp = t.get('sport', ''); sf = t.get('surface', '')
            k = 'tennis' if sp == 'tennis' else 'astro' if ('artificial' in sf or sf in ('acrylic', 'tartan', 'asphalt', 'concrete')) else 'pitch'
        elif le == 'track' or t.get('highway') == 'raceway': k = 'track'
        elif le in ('park', 'garden', 'playground', 'common', 'recreation_ground') or lu in ('recreation_ground', 'village_green', 'grass'): k = 'park'
        elif lu == 'residential': k = 'resid'
        elif lu in ('farmyard', 'industrial', 'construction') : k = 'yard'
        elif am == 'parking' or (t.get('highway') and t.get('area') == 'yes'): k = 'parking'
        elif am == 'school': k = 'school'
        elif lu == 'cemetery' or am == 'grave_yard': k = 'cemetery'
        elif lu == 'quarry': k = 'quarry'
        if not k: continue
        P = poly_of(el)
        if P is None: continue
        LC[k].append((t, P))
    REPORT['landcover'] = {k: len(v) for k, v in LC.items()}
    return LC
WID = {'motorway': 24, 'trunk': 11, 'primary': 8.5, 'secondary': 7.5, 'tertiary': 6.5, 'unclassified': 5, 'residential': 5.5, 'living_street': 5,
       'service': 3.6, 'track': 3.0, 'pedestrian': 4, 'footway': 1.6, 'path': 1.3, 'cycleway': 2.2, 'steps': 1.8, 'bridleway': 2.0,
       'primary_link': 6, 'secondary_link': 6, 'tertiary_link': 5, 'trunk_link': 7}
def roads():
    out = []
    for el in ELS:
        t = T(el); hw = t.get('highway')
        if not hw or el['type'] != 'way' or t.get('area') == 'yes' or not el.get('geometry'): continue
        if t.get('tunnel') in ('yes', 'building_passage'): continue
        w = WID.get(hw, 2.5)
        if hw == 'service' and t.get('service') in ('driveway', 'parking_aisle'): w = 3.0
        out.append({'k': hw, 'w': w, 'p': [loc(q) for q in el['geometry']], 'surf': t.get('surface', ''), 'bridge': t.get('bridge') == 'yes', 'name': t.get('name', '')})
    return out
def barriers():
    out = []
    for el in ELS:
        t = T(el); b = t.get('barrier'); nat = t.get('natural')
        if el['type'] != 'way' or not el.get('geometry'): continue
        if b in ('wall', 'retaining_wall', 'city_wall'): k = 0
        elif b == 'hedge' or nat in ('hedge',): k = 1
        elif nat == 'tree_row': k = 3
        elif b == 'fence' : k = 2
        else: continue
        out.append({'k': k, 'p': [loc(q) for q in el['geometry']], 'h': float(t.get('height', '0').split()[0]) if t.get('height', '').replace('.', '', 1).split(' ')[0].isdigit() else 0.0})
    return out

def main():
    log('loading rasters')
    dtm, dgx, dgz, dres = read_raster('dtm_2m.tif', 0.01)
    dtm = np.where(np.isnan(dtm), np.nanmedian(dtm), dtm) - DATUM
    nd8, ngx, ngz, nres = read_raster('ndsm_1m.tif', 0.1, nodata_nan=False)
    nd8 = np.nan_to_num(nd8)
    LC = landcover(); RD = roads(); BR = barriers()
    log('landcover', REPORT['landcover'], 'roads', len(RD), 'barriers', len(BR))
    S = CORE[2]

    # -------------------------------------------------- water: ponds, tarns and the River Lune (split into reaches)
    core_box = box(CORE[0] + 4, CORE[1] + 4, CORE[0] + S - 4, CORE[1] + S - 4)
    ponds = []
    rivers = []   # the river lines with a name, to name the (unnamed) river polygons around them
    for el in ELS:
        t = T(el)
        if el['type'] == 'way' and t.get('waterway') in ('river', 'stream') and t.get('name') and el.get('geometry'):
            rivers.append((t['name'], LineString([loc(q) for q in el['geometry']])))
    def river_name(g):
        best = None
        for n, Ln in rivers:
            d = Ln.distance(g)
            if d < 40 and (best is None or d < best[0]): best = (d, n)
        if not best: return 'Arroyo'
        return 'Río Lune' if 'Lune' in best[1] else best[1]
    for kind in ('river', 'water'):
        for t, P in LC[kind]:
            P = P.intersection(core_box)
            if P.is_empty or P.area < 30: continue
            river = kind == 'river'; pieces = []
            if river:
                minx, minz, maxx, maxz = P.bounds; cell = 80.0
                for gx in np.arange(math.floor(minx / cell) * cell, maxx, cell):
                    for gz in np.arange(math.floor(minz / cell) * cell, maxz, cell):
                        q = P.intersection(box(gx, gz, gx + cell, gz + cell))
                        if not q.is_empty: pieces.append(q)
            else: pieces = [P]
            for q in pieces:
                geoms = [q] if q.geom_type == 'Polygon' else [g for g in getattr(q, 'geoms', []) if g.geom_type == 'Polygon']
                for g in geoms:
                    if g.area < 20: continue
                    ring = simplify_ring([(round(x, 2), round(z, 2)) for x, z in g.exterior.coords[:-1]], 0.4)
                    if len(ring) < 3: continue
                    xs = np.array([p[0] for p in ring]); zs = np.array([p[1] for p in ring])
                    hb = sample(dtm, dgx, dgz, dres, xs, zs)
                    ip = [g.representative_point()] + [g.interpolate(f, normalized=True) for f in ()]
                    mx = np.linspace(g.bounds[0], g.bounds[2], 9); mz = np.linspace(g.bounds[1], g.bounds[3], 9); MX, MZ = np.meshgrid(mx, mz)
                    ins = np.array([g.contains(Point(a, b)) for a, b in zip(MX.ravel(), MZ.ravel())])
                    hi = sample(dtm, dgx, dgz, dres, MX.ravel()[ins], MZ.ravel()[ins]) if ins.any() else hb
                    level = float(min(np.percentile(hb, 10) - 0.25, np.median(hi) + 0.15))
                    name = t.get('name') or (river_name(g) if river else 'Laguna' if g.area > 4000 else 'Estanque')
                    if 'Lune' in name: name = 'Río Lune'
                    ponds.append({'name': name, 'poly': [list(p) for p in ring], 'level': round(level, 2), 'river': river})
    if len(ponds) > 230:
        ponds.sort(key=lambda p: -abs(ring_area(p['poly']))); ponds = ponds[:230]
    REPORT['ponds'] = len(ponds); log('ponds', len(ponds))

    # -------------------------------------------------- core heights (4 m), carved for the water
    N = int(round(S / 4)) + 1; step = S / (N - 1)
    zz, xx = np.mgrid[0:N, 0:N]; X = CORE[0] + xx * step; Z = CORE[1] + zz * step
    h = sample(dtm, dgx, dgz, dres, X, Z, order=3).astype('float64')
    from matplotlib.path import Path as MPath
    for pd in ponds:
        poly = np.array(pd['poly']); mp = MPath(poly)
        bx0, bz0 = poly.min(0) - 10; bx1, bz1 = poly.max(0) + 10
        sel = (X >= bx0) & (X <= bx1) & (Z >= bz0) & (Z <= bz1)
        if not sel.any(): continue
        ii, jj = np.nonzero(sel)
        inside = np.zeros_like(sel); inside[ii, jj] = mp.contains_points(np.stack([X[ii, jj], Z[ii, jj]], 1), radius=-0.5)
        target = pd['level'] - (1.1 if pd['river'] else 1.3)
        h = np.where(inside, np.minimum(h, target), h)
        if inside.any():
            dd = ndi.distance_transform_edt(~inside) * step
            bank = np.clip(1 - dd / 6.0, 0, 1) * sel * (~inside)
            h = np.where(bank > 0, np.minimum(h, pd['level'] + 0.2 + (h - pd['level'] - 0.2) * (1 - bank)), h)
    write_u16(os.path.join(OUT, 'h_core.bin'), h, 50, 100)
    REPORT['h_core'] = {'n': N, 'step': step, 'x0': CORE[0], 'z0': CORE[1], 'min': float(h.min()), 'max': float(h.max())}
    log('h_core', REPORT['h_core'])

    # -------------------------------------------------- wide (20 m over 16 km) and region (200 m over 120 km)
    wg, wgx, wgz, wres = read_raster('dtm_wide_20m.tif')
    Nw = 801; sw = 20.0; W0 = WIDE[0]
    zz, xx = np.mgrid[0:Nw, 0:Nw]; Xw = W0 + xx * sw; Zw = W0 + zz * sw
    hw = sample(wg, wgx, wgz, wres, Xw, Zw) - DATUM
    hc = sample(dtm, dgx, dgz, dres, Xw, Zw)
    edge = np.minimum.reduce([Xw - (dgx + 40), (dgx + dtm.shape[1] * dres - 40) - Xw, Zw - (dgz + 40), (dgz + dtm.shape[0] * dres - 40) - Zw])
    t_ = np.clip(edge / 200.0, 0, 1); hw = hw * (1 - t_) + hc * t_
    write_u16(os.path.join(OUT, 'h_wide.bin'), hw, 50, 50)
    REPORT['h_wide'] = {'n': Nw, 'step': sw, 'x0': W0, 'z0': W0, 'max': float(hw.max()), 'min': float(hw.min())}
    with rasterio.open(os.path.join(D, 'raw', 'dem_region_200m.tif')) as s:
        hr = s.read(1).astype('float32') - DATUM; trr = s.transform
    hr = np.where(hr <= 0.5, -6.0, hr)       # the Irish Sea and Morecambe Bay below the water plane
    write_u16(os.path.join(OUT, 'h_region.bin'), hr, 400, 20)
    REPORT['h_region'] = {'n': hr.shape[0], 'step': trr.a, 'x0': trr.c - CX, 'z0': CY - trr.f, 'max': float(hr.max()), 'min': float(hr.min())}
    log('wide/region', REPORT['h_wide'], REPORT['h_region'])

    # -------------------------------------------------- buildings: OpenStreetMap, OS OpenMap Local where OSM has none; heights from LIDAR
    blds = build_buildings(dtm, dgx, dgz, dres, nd8, ngx, ngz, nres, LC)

    # -------------------------------------------------- surfaces (1.5 m over the core)
    log('surfaces')
    R = Raster(SN, 'L', 10)
    for k, code in (('park', 10), ('resid', 10), ('cemetery', 10), ('school', 10), ('rough', 1), ('wood', 1), ('quarry', 9), ('yard', 9), ('farm', 9)):
        for t, P in LC[k]: R.poly_keep(P, code)
    golf = Raster(SN, 'L', 0)
    for t, P in LC['golf']: golf.poly_keep(P, 1)
    golf_m = golf.arr() > 0
    for t, P in LC['grough']: R.poly_keep(P, 1)
    if golf_m.any():
        a = np.array(R.im); a[golf_m & (a == 10)] = 2; R.im = Image.fromarray(a); R.d = ImageDraw.Draw(R.im)
    for k, code in (('pitch', 10), ('astro', 10), ('track', 9), ('tennis', 10), ('parking', 8)):
        for t, P in LC[k]: R.poly_keep(P, code)
    for r in RD:
        R.line(r['p'], max(r['w'], 1.6), 8)
    for t, P in LC['fairway']: R.poly_keep(P, 3)
    cls = np.array(R.im)
    gm = Raster(SN, 'L', 0)
    for t, P in LC['green']: gm.poly_keep(P, 1)
    greens = gm.arr() > 0
    fringe = ndi.binary_dilation(greens, iterations=1) & ~greens
    tm = Raster(SN, 'L', 0)
    for t, P in LC['tee']: tm.poly_keep(P, 1)
    bm = Raster(SN, 'L', 0)
    for t, P in LC['bunker']: bm.poly_keep(P, 1)
    cls[fringe] = 4; cls[greens] = 5; cls[tm.arr() > 0] = 6; cls[bm.arr() > 0] = 7
    pond_id = np.zeros((SN, SN), np.uint8)
    for k, p in enumerate(ponds):
        pr = Raster(SN, 'L', 0); pr.d.polygon([pr.px(q) for q in p['poly']], fill=1); pond_id[pr.arr() > 0] = 20 + k
    cls[pond_id > 0] = pond_id[pond_id > 0]
    write_rle(os.path.join(OUT, 'surface_core.rle'), cls)
    REPORT['surface_counts'] = {int(k): int(v) for k, v in zip(*np.unique(cls, return_counts=True)) if k < 20}
    log('surface', REPORT['surface_counts'])
    pal = {1: (126, 132, 84), 2: (124, 164, 80), 3: (116, 181, 74), 4: (102, 182, 73), 5: (79, 174, 69), 6: (98, 173, 70), 7: (239, 226, 185),
           8: (150, 147, 140), 9: (190, 176, 150), 10: (146, 180, 98)}
    rgb = np.zeros((SN, SN, 3), np.uint8)
    for k, c in pal.items(): rgb[cls == k] = c
    rgb[cls >= 20] = (92, 140, 168)
    bimg = Raster(SN, 'L', 0)
    for b in blds: bimg.d.polygon([bimg.px(q) for q in b['e']], fill=1)
    rgb[bimg.arr() > 0] = (190, 182, 170)
    Image.fromarray(rgb).resize((2048, 2048), Image.NEAREST).save(os.path.join(OUT, 'map_surface_2048.png'), optimize=True)

    # -------------------------------------------------- walls and hedges (OpenStreetMap and the LIDAR), trees (LIDAR)
    bmask1 = building_mask_1m(blds, nd8.shape, ngx, ngz)
    if not COURSE_ONLY:
        walls = build_walls(nd8, ngx, ngz, bmask1, BR, RD, ponds)
        trees = build_trees(nd8, ngx, ngz, bmask1, cls, LC)

    # -------------------------------------------------- the drawn ground texture
    if not COURSE_ONLY:
        tex = draw_texture(dtm, dgx, dgz, dres, nd8, ngx, ngz, bmask1, LC, RD, walls, ponds, blds, cls)
        tex.resize((4096, 4096), Image.LANCZOS).save(os.path.join(OUT, 'ortho_core_4096.jpg'), quality=84, optimize=True, progressive=True)
        tex.resize((2048, 2048), Image.LANCZOS).save(os.path.join(OUT, 'ortho_core_2048.jpg'), quality=85, optimize=True, progressive=True)
        tex.resize((2048, 2048), Image.LANCZOS).save(os.path.join(OUT, 'ortho_map_2048.jpg'), quality=86, optimize=True, progressive=True)
        tp = tex.size[0] // NT
        for j in range(NT):
            for i in range(NT):
                tl = tex.crop((i * tp, j * tp, (i + 1) * tp, (j + 1) * tp))
                if tl.size[0] != 1024: tl = tl.resize((1024, 1024), Image.LANCZOS)
                tl.save(os.path.join(TILES, f't_{j}_{i}.jpg'), quality=78, optimize=True, progressive=True)
        wide_texture(tex)
        json.dump([], open(os.path.join(OUT, 'pools.json'), 'w'))

    # -------------------------------------------------- course (the holes mapped in OpenStreetMap; S1 draws the real routing)
    POIS_CACHE[:] = named_places(blds)
    course = build_course(ponds, RD, cls, blds)
    course.update(build_campo(RD))
    course['pois'] = POIS_CACHE
    course['frames'] = {'core': CORE, 'ortho': WIDE, 'mapPhoto': CORE, 'tiles': {'n': NT, 'px': 1024},
                        'h_core': REPORT['h_core'], 'h_wide': REPORT['h_wide'], 'h_region': REPORT['h_region']}
    json.dump(course, open(os.path.join(OUT, 'course.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    if not COURSE_ONLY: json.dump(REPORT, open(os.path.join(OUT, 'build_report.json'), 'w'), indent=1, ensure_ascii=False)
    log(json.dumps(REPORT, indent=1, ensure_ascii=False)[:3000])

# ------------------------------------------------------------------ buildings
def build_buildings(dtm, dgx, dgz, dres, nd, ngx, ngz, nres, LC):
    log('buildings'); cands = []
    school = unary_union([P for t, P in LC['school']]) if LC['school'] else None
    farm_land = unary_union([P for t, P in LC['yard']]) if LC['yard'] else None
    for el in ELS:
        t = T(el)
        if not t.get('building') or el['type'] == 'node': continue
        if t.get('building') in ('no', 'roof', 'construction') and t.get('building') != 'roof': continue
        P = poly_of(el)
        if P is None: continue
        for g in ([P] if P.geom_type == 'Polygon' else list(P.geoms)):
            if g.geom_type == 'Polygon' and g.area >= 6: cands.append(('osm', t, g))
    osm_u = unary_union([g for _, _, g in cands]) if cands else None
    op = os.path.join(D, 'os_buildings.json.gz'); n_os = 0
    if os.path.exists(op):
        for b in json.load(gzip.open(op, 'rt', encoding='utf-8')):
            try: g = Polygon(b['e'], [h for h in b.get('h', []) if len(h) >= 3])
            except Exception: continue
            if not g.is_valid: g = g.buffer(0)
            if g.is_empty or g.area < 12 or g.geom_type != 'Polygon': continue
            if osm_u is not None and g.intersection(osm_u).area > 0.3 * g.area: continue
            cands.append(('os', {}, g)); n_os += 1
    REPORT['buildings_os_added'] = n_os
    out = []
    for src, t, g in cands:
        c = g.centroid
        if not (CORE[0] + 5 < c.x < CORE[0] + CORE[2] - 5 and CORE[1] + 5 < c.y < CORE[1] + CORE[2] - 5): continue
        ring = simplify_ring([(round(x, 2), round(z, 2)) for x, z in g.exterior.coords[:-1]], 0.3)
        if len(ring) < 3 or abs(ring_area(ring)) < 6: continue
        holes = [hh for hh in (simplify_ring([(round(x, 2), round(z, 2)) for x, z in r.coords[:-1]], 0.3) for r in g.interiors) if len(hh) >= 3 and abs(ring_area(hh)) >= 2]
        # height: the 90th percentile of the LIDAR surface over the ground inside the footprint (eroded by 1 m)
        x0, z0, x1, z1 = g.bounds; i0 = int((z0 - ngz) / nres); i1 = int((z1 - ngz) / nres) + 1; j0 = int((x0 - ngx) / nres); j1 = int((x1 - ngx) / nres) + 1
        hgt = 0.0
        if i0 >= 0 and j0 >= 0 and i1 <= nd.shape[0] and j1 <= nd.shape[1] and i1 > i0 and j1 > j0:
            m = Image.new('L', (j1 - j0, i1 - i0), 0); ImageDraw.Draw(m).polygon([((x - ngx) / nres - j0, (z - ngz) / nres - i0) for x, z in ring], fill=1)
            m = np.asarray(m) > 0; me = ndi.binary_erosion(m, iterations=1)
            vals = nd[i0:i1, j0:j1][me if me.sum() >= 4 else m]
            if vals.size: hgt = float(np.percentile(vals, 90))
        a_ = abs(ring_area(ring)); bt = t.get('building', 'yes')
        if hgt < 2.2: hgt = 3.2 if a_ < 30 else 5.5          # not seen by the LIDAR (new, or slightly off): an ordinary height
        hgt = min(hgt, 26.0)
        f = int(max(1, min(7, round((hgt - 1.2) / 3.2))))
        hb = sample(dtm, dgx, dgz, dres, [p[0] for p in ring], [p[1] for p in ring])
        k = 'house'
        if bt in ('church', 'chapel', 'cathedral') or t.get('amenity') == 'place_of_worship': k = 'church'
        elif bt in ('barn', 'farm_auxiliary', 'stable', 'cowshed', 'shed', 'agricultural', 'greenhouse', 'sty', 'hut', 'garage', 'garages', 'storage_tank'): k = 'farm'
        elif bt in ('school', 'college', 'dormitory', 'sports_hall', 'sports_centre') or (school is not None and school.contains(c)): k = 'school'
        elif farm_land is not None and farm_land.contains(c) and a_ > 60: k = 'farm'
        if a_ < 22 and k == 'house': k = 'shed'
        o = {'id': f'{src}{len(out)}', 'f': f, 'b': round(float(hb.min()), 2), 't': round(hgt, 1), 'k': k, 'e': [list(p) for p in ring], 'h': [[list(p) for p in hh] for hh in holes]}
        if t.get('name'): o['n'] = t['name']
        out.append(o)
    import building_info; REPORT['building_info'] = building_info.add_info(out, ELS)   # floors, listed status and year, by position
    json.dump(out, open(os.path.join(OUT, 'buildings.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    REPORT['buildings'] = len(out); REPORT['building_kinds'] = {k: sum(1 for b in out if b['k'] == k) for k in ('house', 'farm', 'school', 'church', 'shed')}
    log('buildings', len(out), REPORT['building_kinds'], 'from OS', n_os)
    return out
def building_mask_1m(blds, shape, ngx, ngz):
    m = Image.new('L', (shape[1], shape[0]), 0); d = ImageDraw.Draw(m)
    for b in blds: d.polygon([(x - ngx, z - ngz) for x, z in b['e']], fill=1)
    return ndi.binary_dilation(np.asarray(m) > 0, iterations=2)

# ------------------------------------------------------------------ dry stone walls and hedges
def trace_skeleton(sk):
    """Polylines (lists of (row, col)) along a 1-pixel skeleton, split at junctions."""
    H, Wd = sk.shape; nb = ndi.convolve(sk.astype(np.uint8), np.ones((3, 3), np.uint8), mode='constant') - 1
    nb = nb * sk; ys, xs = np.nonzero(sk); pts = set(zip(ys.tolist(), xs.tolist())); seen = set(); lines = []
    def nbrs(p):
        y, x = p
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if (dy or dx) and (y + dy, x + dx) in pts: yield (y + dy, x + dx)
    nodes = [p for p in pts if nb[p] != 2]
    def walk(a, b):
        line = [a, b]; prev, cur = a, b
        while nb[cur] == 2:
            nxt = [q for q in nbrs(cur) if q != prev and (min(cur, q), max(cur, q)) not in seen]
            if not nxt: break
            q = nxt[0]; seen.add((min(cur, q), max(cur, q))); prev, cur = cur, q; line.append(cur)
        return line
    for a in nodes:
        for b in nbrs(a):
            e = (min(a, b), max(a, b))
            if e in seen: continue
            seen.add(e); lines.append(walk(a, b))
    # loops without nodes
    left = [p for p in pts if nb[p] == 2 and not any((min(p, q), max(p, q)) in seen for q in nbrs(p))]
    for a in left:
        nn = list(nbrs(a))
        if not nn: continue
        e = (min(a, nn[0]), max(a, nn[0]))
        if e in seen: continue
        seen.add(e); lines.append(walk(a, nn[0]))
    return lines
def build_walls(nd, ngx, ngz, bmask, BR, RD, ponds):
    log('walls and hedges')
    out = []
    for b in BR:
        p = [q for q in b['p']]
        if len(p) < 2: continue
        if not any(CORE[0] < q[0] < CORE[0] + CORE[2] and CORE[1] < q[1] < CORE[1] + CORE[2] for q in p): continue
        k = b['k']; hh = b['h'] or (1.3 if k == 0 else 2.0 if k == 1 else 1.2 if k == 2 else 6.0)
        out.append({'k': k, 'h': hh, 'p': rdp(p, 0.4), 'src': 'osm'})
    n_osm = len(out)
    # the LIDAR sees long thin raised lines 0.5-2.6 m high: walls (lower) and hedges (higher)
    low = (nd > 0.45) & (nd < 2.8) & ~bmask
    tall = ndi.binary_opening(nd > 2.8, iterations=2)        # crowns and buildings (thin lines removed)
    low &= ~ndi.binary_dilation(tall, iterations=1)
    thin = low & ~ndi.binary_opening(low, structure=np.ones((4, 4), bool))   # what is no wider than ~3 m
    # no lines along the road edges (banks and kerbs) nor on water
    rm = Image.new('L', (nd.shape[1], nd.shape[0]), 0); d = ImageDraw.Draw(rm)
    for r in RD:
        if r['w'] >= 3: d.line([(x - ngx, z - ngz) for x, z in r['p']], fill=1, width=int(r['w']) + 2)
    for p in ponds: d.polygon([(x - ngx, z - ngz) for x, z in p['poly']], fill=1)
    thin &= ~(np.asarray(rm) > 0)
    thin = ndi.binary_closing(thin, iterations=1)
    from skimage.morphology import skeletonize, remove_small_objects
    thin = remove_small_objects(thin, max_size=25)
    sk = skeletonize(thin)
    lab, n = ndi.label(sk, structure=np.ones((3, 3)))
    sizes = ndi.sum(sk, lab, range(1, n + 1)); keep = np.isin(lab, 1 + np.where(sizes >= 14)[0]); sk &= keep
    lines = trace_skeleton(sk)
    osm_m = Image.new('L', (nd.shape[1], nd.shape[0]), 0); d = ImageDraw.Draw(osm_m)
    for w in out: d.line([(x - ngx, z - ngz) for x, z in w['p']], fill=1, width=5)
    osm_m = np.asarray(osm_m) > 0
    ndg = ndi.maximum_filter(nd, 3)
    n_l = 0
    for L in lines:
        if len(L) < 10: continue
        arr = np.array(L)
        if osm_m[arr[:, 0], arr[:, 1]].mean() > 0.5: continue
        hh = float(np.median(ndg[arr[:, 0], arr[:, 1]]))
        pts = [(ngx + c + 0.5, ngz + r + 0.5) for r, c in L]
        pts = [q for q in pts if CORE[0] < q[0] < CORE[0] + CORE[2] and CORE[1] < q[1] < CORE[1] + CORE[2]]
        if len(pts) < 8: continue
        pts = rdp(pts, 0.7)
        Ln = sum(math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]) for i in range(len(pts) - 1))
        if Ln < 12: continue
        k = 0 if hh < 1.65 else 1
        out.append({'k': k, 'h': round(min(max(hh, 0.9), 2.6) if k == 1 else min(max(hh, 0.9), 1.6), 2), 'p': pts, 'src': 'lidar'}); n_l += 1
    tot = {k: 0.0 for k in range(4)}
    for w in out:
        p = w['p']; tot[w['k']] += sum(math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]) for i in range(len(p) - 1))
    REPORT['walls'] = {'osm': n_osm, 'lidar': n_l, 'km': {('muro', 'seto', 'valla', 'hilera')[k]: round(v / 1000, 1) for k, v in tot.items()}}
    log('walls', REPORT['walls'])
    js = {'v': 1, 'w': [[w['k'], int(round(w['h'] * 10)), [int(round(c * 4)) for q in w['p'] for c in q]] for w in out]}
    json.dump(js, open(os.path.join(OUT, 'walls.json'), 'w'), separators=(',', ':'))
    return out

# ------------------------------------------------------------------ trees from the LIDAR
def build_trees(nd, ngx, ngz, bmask, cls, LC):
    log('trees')
    canopy = (nd > 2.6) & ~bmask
    canopy = ndi.binary_opening(canopy, iterations=1)
    sm = ndi.gaussian_filter(nd, 1.3)
    peaks = (sm == ndi.maximum_filter(sm, size=5)) & canopy & (sm > 3.2)
    dt = ndi.distance_transform_edt(canopy)
    py, pxx = np.nonzero(peaks)
    T_ = []
    for y_, x_ in zip(py, pxx):
        x = ngx + x_ + 0.5; z = ngz + y_ + 0.5
        if not (CORE[0] + 2 < x < CORE[0] + CORE[2] - 2 and CORE[1] + 2 < z < CORE[1] + CORE[2] - 2): continue
        hgt = float(sm[y_, x_]); r = float(min(max(0.55 * dt[y_, x_] + 0.18 * hgt, 1.3), 7.5))
        T_.append((x, z, r, hgt))
    log('tree tops', len(T_))
    # thin out: one crown per cell (3.5 m near the school and the golf, 5 m elsewhere), the tallest first
    T_.sort(key=lambda t: -t[3]); taken = set(); keep = []
    sc = SN / CORE[2]
    for x, z, r, hgt in T_:
        near = math.hypot(x, z) < 1600
        cell = 3.5 if near else 5.0
        k = (int(x // cell), int(z // cell), cell)
        if k in taken: continue
        c = cls[min(SN - 1, int((z - CORE[1]) * sc)), min(SN - 1, int((x - CORE[0]) * sc))]
        if c >= 20 or c in (3, 4, 5, 6, 7): continue
        for dx in (-1, 0, 1):
            for dz in (-1, 0, 1): taken.add((k[0] + dx, k[1] + dz, cell))
        keep.append((x, z, r, near))
    MAXT = 65000
    if len(keep) > MAXT:
        a = [t for t in keep if t[3]]; b = [t for t in keep if not t[3]]
        keep = a[:MAXT] + b[:max(0, MAXT - len(a))]
    # conifers: inside woods mapped as needle-leaved (the sign of the radius carries it)
    con = Raster(SN, 'L', 0)
    for t, P in LC['wood']:
        if t.get('leaf_type') == 'needleleaved' or t.get('wood') in ('coniferous', 'evergreen'): con.poly_keep(P, 2)
        elif t.get('leaf_type') == 'mixed' or t.get('wood') == 'mixed': con.poly_keep(P, 1)
    cm = con.arr()
    def sgn(x, z):
        v = cm[min(SN - 1, int((z - CORE[1]) * sc)), min(SN - 1, int((x - CORE[0]) * sc))]
        return -1 if v == 2 or (v == 1 and (hash((round(x), round(z))) % 100) < 40) else 1
    arr = np.array([(round(x * 4), round(z * 4), sgn(x, z) * round(r * 10)) for x, z, r, _ in keep], dtype='<i2')
    REPORT['conifers'] = int((arr[:, 2] < 0).sum()) if len(arr) else 0
    arr.tofile(os.path.join(OUT, 'trees.bin')); REPORT['trees'] = len(keep); log('trees', len(keep))
    return keep

# ------------------------------------------------------------------ the drawn ground texture
def hillshade(z, res, az_deg=225.0, el_deg=40.0):
    gy, gx = np.gradient(z, res)          # rows go south (+z), columns east (+x)
    az = math.radians(az_deg); el = math.radians(el_deg)
    # light comes FROM azimuth az (clockwise from north); in (x east, z south) the light vector is (sin az, -cos az)
    lx, lz = math.sin(az), -math.cos(az)
    nx, nz, ny = -gx, -gy, np.ones_like(z)
    n = np.sqrt(nx * nx + nz * nz + 1)
    return (nx * lx * math.cos(el) + nz * lz * math.cos(el) + ny * math.sin(el)) / n
def cast_shadow(dsm, res, az_deg=225.0, el_deg=34.0, reach=28):
    az = math.radians(az_deg); dx, dz = math.sin(az), -math.cos(az); tl = math.tan(math.radians(el_deg))
    sh = np.zeros(dsm.shape, np.float32)
    for k in range(1, reach + 1):
        oy = int(round(-dz * k)); ox = int(round(-dx * k))   # toward the sun: shift the surface from the sun side
        # value at (r, c) = dsm at (r + dz*k, c + dx*k) -> the point toward the light
        src = np.roll(np.roll(dsm, -int(round(dz * k)), axis=0), -int(round(dx * k)), axis=1)
        sh = np.maximum(sh, (src - dsm - k * res * tl > 0.25).astype(np.float32) * (1.0 - k / (reach + 6)))
    return sh
def s2_image():
    """The Sentinel-2 composite, levelled and a little more saturated; without it (first runs), a plain green land."""
    p = os.path.join(D, 'raw', 's2_wide_10m.jpg')
    if not os.path.exists(p):
        log('NO SENTINEL-2: plain colours'); wg, wgx, wgz, wres = read_raster('dtm_wide_20m.tif')
        h = ndi.zoom(wg, 2, order=1); t = np.clip((h - 120) / 300, 0, 1)[..., None]
        c = np.array([112, 142, 78], 'float32') * (1 - t) + np.array([128, 120, 84], 'float32') * t
        return Image.fromarray(c.astype('uint8'))
    S2 = np.asarray(Image.open(p).convert('RGB')).astype('float32')
    # one stretch for the three channels (keeps the colours as the satellite saw them), a little lighter
    L = S2.mean(-1); lo = np.percentile(L, 0.5); hi = np.percentile(L, 99.7)
    S2 = np.clip((S2 - lo * 0.6) / (hi - lo * 0.6), 0, 1) ** 0.85 * 235
    # bright and very dark specks of 10 m (roofs, yards, cars, water) smear into blotches when enlarged:
    # keep each pixel's brightness within a band around its 70 m neighbourhood
    L = S2.mean(-1) + 1e-3; med = ndi.median_filter(L, size=7)
    k = np.clip(L, med * 0.62, med * 1.22) / L; S2 *= k[..., None]
    grey = S2.mean(-1, keepdims=True); S2 = np.clip(grey + (S2 - grey) * 0.74, 0, 255)
    return Image.fromarray(S2.astype('uint8'))
def draw_texture(dtm, dgx, dgz, dres, nd, ngx, ngz, bmask, LC, RD, walls, ponds, blds, cls):
    n = 4096 if FAST else TN; s = n / CORE[2]
    log('texture', n)
    # 1) colour of the land: the Sentinel-2 composite (10 m), graded and smoothed
    s2g = s2_image(); px = s2g.size[0] / WIDE[2]
    crop = s2g.crop((int((CORE[0] - WIDE[0]) * px), int((CORE[1] - WIDE[1]) * px), int((CORE[0] + CORE[2] - WIDE[0]) * px), int((CORE[1] + CORE[2] - WIDE[1]) * px)))
    base = np.asarray(crop.resize((n, n), Image.BICUBIC).filter(ImageFilter.GaussianBlur(4 * n / 8192))).astype('float32')
    # 2) the micro relief of the LIDAR surface (trees, hedges, walls, roofs, banks), with shadows, on the 1 m grid
    o = int(round(CORE[0] - ngx)); m1 = int(CORE[2])
    dtm1 = ndi.zoom(dtm, 2, order=1)[:nd.shape[0], :nd.shape[1]]
    dsm = (dtm1 + nd)[o:o + m1, o:o + m1].astype('float32'); gsm = ndi.gaussian_filter(dtm1[o:o + m1, o:o + m1], 3.0)
    hs = hillshade(dsm, 1.0) - hillshade(gsm, 1.0)
    shad = cast_shadow(dsm, 1.0)
    ndc = nd[o:o + m1, o:o + m1]
    canopy = ndi.binary_opening(ndc > 2.4, iterations=1) & ~bmask[o:o + m1, o:o + m1]
    hedge = (ndc > 0.9) & (ndc <= 2.4) & ~bmask[o:o + m1, o:o + m1]
    upF = lambda a: np.array(Image.fromarray(a.astype('float32'), 'F').resize((n, n), Image.BILINEAR))
    upL = lambda m: np.asarray(Image.fromarray((m * 255).astype('uint8'), 'L').resize((n, n), Image.BILINEAR))   # 0..255
    HS = upF(hs); del hs
    SH = upL(np.clip(shad, 0, 1)); del shad
    CAN = upL(canopy.astype('float32')); HED = upL(hedge.astype('float32'))
    del dsm, gsm, dtm1
    rng = np.random.default_rng(7)
    def noise(sc, amp):
        g = rng.standard_normal((n // sc + 2, n // sc + 2)).astype('float32')
        return np.asarray(Image.fromarray(g, 'F').resize((n, n), Image.BICUBIC)) * amp
    # (memory: the colour is worked one channel at a time; the 8192 px texture would not fit otherwise)
    fld = 1.0 + noise(48, 0.035) + noise(6, 0.025)          # grazed fields: a little variation per field and fine grain
    leaf = 1.0 + noise(3, 0.08)
    cm = CAN.astype('float32') * (0.5 / 255)                  # 3) under the crowns: the woodland floor in the shade
    hm = HED.astype('float32') * (0.55 / 255)                 #    (the crowns themselves are 3D trees in the game)
    out = np.empty((n, n, 3), np.uint8)
    for c, (wc, hc) in enumerate(zip((74, 80, 50), (62, 84, 44))):
        ch = base[..., c].astype('float32') * fld
        ch = ch * (1 - cm) + (wc * leaf) * cm
        ch = ch * (1 - hm) + hc * hm
        out[..., c] = np.clip(ch, 0, 255).astype(np.uint8); del ch
    del fld, leaf, cm, hm, base
    col = out
    # 4) what OpenStreetMap draws
    img = Image.fromarray(col); del col; d = ImageDraw.Draw(img)
    P = lambda q: ((q[0] - CORE[0]) * s, (q[1] - CORE[1]) * s)
    def fill_poly(Pl, c):
        for g in ([Pl] if Pl.geom_type == 'Polygon' else list(getattr(Pl, 'geoms', []))):
            if g.geom_type != 'Polygon': continue
            d.polygon([P(q) for q in g.exterior.coords], fill=c)
    over = Image.new('RGBA', img.size, (0, 0, 0, 0)); do = ImageDraw.Draw(over)
    def opoly(Pl, c):
        for g in ([Pl] if Pl.geom_type == 'Polygon' else list(getattr(Pl, 'geoms', []))):
            if g.geom_type != 'Polygon': continue
            do.polygon([P(q) for q in g.exterior.coords], fill=c)
            for h in g.interiors: do.polygon([P(q) for q in h.coords], fill=(0, 0, 0, 0))
    for t, Pl in LC['yard'] + LC['quarry']: opoly(Pl, (150, 140, 120, 120))
    for t, Pl in LC['cemetery']: opoly(Pl, (110, 140, 80, 90))
    for t, Pl in LC['park']: opoly(Pl, (118, 168, 84, 70))
    for t, Pl in LC['pitch']: opoly(Pl, (104, 168, 76, 215))
    for t, Pl in LC['astro']: opoly(Pl, (66, 128, 70, 240))
    for t, Pl in LC['tennis']: opoly(Pl, (74, 120, 86, 240) if 'grass' not in t.get('surface', '') else (108, 160, 80, 220))
    for t, Pl in LC['track']: opoly(Pl, (178, 86, 64, 235))
    for t, Pl in LC['parking']: opoly(Pl, (118, 116, 110, 235))
    for t, Pl in LC['fairway']: opoly(Pl, (112, 172, 74, 200))
    for t, Pl in LC['tee']: opoly(Pl, (104, 170, 72, 230))
    for t, Pl in LC['green']: opoly(Pl, (86, 166, 66, 240))
    for t, Pl in LC['bunker']: opoly(Pl, (226, 212, 168, 250))
    img = Image.alpha_composite(img.convert('RGBA'), over).convert('RGB'); d = ImageDraw.Draw(img)
    # mowing stripes on pitches and fairways
    stripes = None; st = Image.new('L', (n, n), 0); ds = ImageDraw.Draw(st)
    for t, Pl in LC['pitch'] + LC['fairway']:
        for g in ([Pl] if Pl.geom_type == 'Polygon' else list(getattr(Pl, 'geoms', []))):
            if g.geom_type == 'Polygon': ds.polygon([P(q) for q in g.exterior.coords], fill=255)
    stm = np.asarray(st) > 0
    if stm.any():
        ar = np.arange(n, dtype=np.float32) * (0.7 / (7.0 * s))
        band = (np.floor(ar[None, :] + ar[:, None]).astype(np.int32) & 1).astype(bool)
        stripes = np.where(stm, np.where(band, np.float32(1.05), np.float32(0.96)), np.float32(1.0)); del band
    # water
    for p in ponds: d.polygon([P(q) for q in p['poly']], fill=(56, 78, 84) if p['river'] else (60, 84, 92))
    for el in ELS:
        t = T(el)
        if el['type'] == 'way' and t.get('waterway') in ('stream', 'ditch', 'drain', 'river', 'canal') and el.get('geometry'):
            w = {'river': 10, 'canal': 8, 'stream': 2.2, 'ditch': 1.2, 'drain': 1.2}[t['waterway']]
            d.line([P(loc(q)) for q in el['geometry']], fill=(64, 86, 86), width=max(1, int(round(w * s))))
    # roads: edges first, then the surface
    order = ['path', 'footway', 'bridleway', 'cycleway', 'steps', 'track', 'service', 'pedestrian', 'living_street', 'residential', 'unclassified', 'tertiary_link', 'tertiary', 'secondary_link', 'secondary', 'primary_link', 'primary', 'trunk_link', 'trunk']
    rk = lambda r: order.index(r['k']) if r['k'] in order else 0
    # footpaths and bridleways across the fields: only a worn, slightly paler line in the grass
    po = Image.new('RGBA', img.size, (0, 0, 0, 0)); dp = ImageDraw.Draw(po)
    for r in RD:
        if r['k'] in ('path', 'footway', 'bridleway', 'steps') and r['surf'] not in ('asphalt', 'paved', 'paving_stones', 'concrete'):
            dp.line([P(q) for q in r['p']], fill=(158, 150, 118, 70), width=max(1, int(round(1.2 * s))), joint='curve')
    img = Image.alpha_composite(img.convert('RGBA'), po).convert('RGB'); d = ImageDraw.Draw(img); del po, dp
    for r in sorted(RD, key=rk):
        w = r['w']; k = r['k']; pts = [P(q) for q in r['p']]
        if k in ('path', 'footway', 'bridleway', 'steps') and r['surf'] not in ('asphalt', 'paved', 'paving_stones', 'concrete'): continue
        if k in ('path', 'footway', 'bridleway', 'steps'): c = (168, 160, 138)
        elif k == 'track': c = (156, 146, 120) if r['surf'] not in ('asphalt', 'paved') else (112, 110, 104)
        elif k == 'cycleway': c = (126, 122, 114)
        else: c = (98, 98, 96)
        if k not in ('path', 'footway', 'bridleway', 'steps', 'track'):
            d.line(pts, fill=(136, 134, 120), width=max(1, int(round((w + 1.0) * s))), joint='curve')
        d.line(pts, fill=c, width=max(1, int(round(w * s))), joint='curve')
        if k in ('primary', 'secondary', 'trunk') and w >= 7:
            pass
    # roofs (under the 3D buildings, seen on the map)
    for b in blds:
        v = 0.9 + 0.2 * ((hash(b['id']) % 100) / 100.0)
        c = (int(84 * v), int(88 * v), int(94 * v)) if b['k'] != 'farm' else (int(98 * v), int(98 * v), int(96 * v))
        d.polygon([P(q) for q in b['e']], fill=c)
    # walls: grey stone, one pixel; hedges darker green
    for w in walls:
        pts = [P(q) for q in w['p']]
        if w['k'] == 0: d.line(pts, fill=(146, 144, 134), width=max(1, int(round(0.7 * s))))
        elif w['k'] == 1: d.line(pts, fill=(56, 78, 40), width=max(1, int(round(1.4 * s))))
        elif w['k'] == 2: d.line(pts, fill=(120, 112, 96), width=1)
    # 5) light: the micro relief and the cast shadows
    shade = HS; HS = None
    shade *= 1.0 - CAN.astype(np.float32) * (0.75 / 255); del CAN    # walls, hedges, banks and roofs; little on the crowns
    shade *= 1.25; shade += 1.0; np.clip(shade, 0.6, 1.4, out=shade)
    shade *= 1.0 - SH.astype(np.float32) * (0.28 / 255); del SH
    if stripes is not None: shade *= stripes; del stripes
    a = np.asarray(img); outc = np.empty_like(a)
    for c in range(3): outc[..., c] = np.clip(a[..., c].astype(np.float32) * shade, 0, 255).astype(np.uint8)
    del shade, a
    im = Image.fromarray(outc)
    im = ImageEnhance.Contrast(im).enhance(1.04)
    log('texture done')
    return im
def wide_texture(core_img):
    W_ = s2_image().resize((2048, 2048), Image.BICUBIC)
    k = 2048 / WIDE[2]; sz = int(round(CORE[2] * k)); px0 = int(round((CORE[0] - WIDE[0]) * k)); pz0 = int(round((CORE[1] - WIDE[1]) * k))
    hi_ = core_img.resize((sz, sz), Image.LANCZOS)
    mask = Image.new('L', (sz, sz), 0); ImageDraw.Draw(mask).rectangle((8, 8, sz - 9, sz - 9), fill=255); mask = mask.filter(ImageFilter.GaussianBlur(6))
    W_.paste(hi_, (px0, pz0), mask)
    W_.save(os.path.join(OUT, 'ortho_wide_2048.jpg'), quality=85, optimize=True, progressive=True)

# ------------------------------------------------------------------ named places (labels, the plane, horses and the gold balls of the world file)
def named_places(blds):
    out = []; seen = set()
    for el in ELS:
        t = T(el); name = t.get('name')
        if not name: continue
        k = None; nl = name.lower()
        if t.get('place') in ('town', 'village', 'hamlet', 'locality', 'farm', 'isolated_dwelling'): k = 'place:' + t['place']
        elif t.get('amenity') == 'school': k = 'school'
        elif t.get('golf') == 'clubhouse': k = 'clubhouse'
        elif t.get('leisure') == 'golf_course': k = 'golf'
        elif t.get('amenity') == 'place_of_worship' or t.get('building') in ('church', 'chapel'): k = 'church'
        elif 'bridge' in nl and (t.get('bridge') or t.get('man_made') == 'bridge' or t.get('historic') or t.get('highway')): k = 'bridge'
        elif t.get('tourism') == 'viewpoint': k = 'view'
        elif 'grange' in nl or 'hall' in nl and t.get('building'): k = 'house'
        elif t.get('leisure') in ('horse_riding', 'equestrian') or t.get('sport') == 'equestrian' or t.get('building') == 'stable': k = 'horses'
        elif t.get('leisure') in ('sports_centre', 'sports_hall', 'swimming_pool') or t.get('building') == 'sports_hall': k = 'sport'
        elif t.get('leisure') == 'pitch': k = 'pitch:' + t.get('sport', '')
        elif t.get('amenity') in ('pub', 'cafe', 'restaurant') or t.get('tourism') in ('hotel', 'attraction', 'museum', 'guest_house'): k = 'poi'
        elif t.get('natural') in ('peak', 'hill'): k = 'peak'
        elif t.get('waterway') == 'river': k = 'river'
        elif t.get('historic'): k = 'historic'
        if not k: continue
        if el['type'] == 'node': x, z = loc(el)
        else:
            P = poly_of(el)
            if P is not None: c = P.representative_point(); x, z = c.x, c.y
            elif el.get('geometry'):
                g = [loc(q) for q in el['geometry']]; x, z = g[len(g) // 2]
            elif el.get('center'): x, z = loc(el['center'])
            else: continue
        if not (CORE[0] < x < CORE[0] + CORE[2] and CORE[1] < z < CORE[1] + CORE[2]): continue
        key = (name, k)
        if key in seen: continue
        seen.add(key); out.append({'n': name, 'k': k, 'p': [round(x, 1), round(z, 1)], 'ele': t.get('ele', '')})
    REPORT['named'] = len(out)
    log('named places', len(out), sorted({o['k'] for o in out}))
    return out

def re_casterton(n): return 'casterton' in n.lower() and 'golf' in n.lower()
# ------------------------------------------------------------------ course (S1)
# The club's scorecard (GolfPass / Golf Advisor, 22-nov-2026): 9 holes played twice (par 70); yards per tee set.
# Stroke index of holes 10-18: not published; the even indexes are the front nine's, so the back nine takes the odd ones.
CARD = {'par': [4, 4, 3, 4, 3, 4, 4, 4, 5], 'si': [10, 8, 16, 4, 18, 2, 14, 6, 12],
        'yd': {'blancas': [412, 315, 142, 355, 136, 424, 293, 338, 486], 'amarillas': [409, 305, 135, 345, 131, 418, 280, 330, 476],
               'rojas': [298, 300, 138, 346, 122, 380, 274, 300, 460]}}
YD = 0.9144
def plen(P): return sum(math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]) for i in range(len(P) - 1))
def walk_back(path_gt, L):
    s = 0
    for i in range(len(path_gt) - 1):
        a, b = path_gt[i], path_gt[i + 1]; d = math.hypot(b[0] - a[0], b[1] - a[1])
        if d > 0 and s + d >= L: t = (L - s) / d; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], i
        s += d
    a, b = path_gt[-2], path_gt[-1]; d = math.hypot(b[0] - a[0], b[1] - a[1]) or 1
    over = L - s; return [b[0] + (b[0] - a[0]) / d * over, b[1] + (b[1] - a[1]) / d * over], len(path_gt) - 2
def at_s(P, s_):
    for i in range(len(P) - 1):
        a, b = P[i], P[i + 1]; d = math.hypot(b[0] - a[0], b[1] - a[1])
        if d > 0 and s_ <= d: t = s_ / d; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], ((b[0] - a[0]) / d, (b[1] - a[1]) / d)
        s_ -= d
    a, b = P[-2], P[-1]; d = math.hypot(b[0] - a[0], b[1] - a[1]) or 1
    return list(b), ((b[0] - a[0]) / d, (b[1] - a[1]) / d)
def holes_in(area, greens, tee_cs):
    """OSM golf=hole lines inside an area: {ref: (par, line tee -> green, green polygon)}."""
    out = {}
    for el in ELS:
        t = T(el)
        if not (t.get('golf') == 'hole' and el['type'] == 'way' and el.get('geometry')): continue
        pts = [loc(q) for q in el['geometry']]
        if len(pts) < 2 or area is None or not area.buffer(30).contains(LineString(pts).interpolate(0.5, normalized=True)): continue
        try: n = int(t.get('ref', ''))
        except Exception: continue
        # the green is at the end nearer a mapped green
        def gnear(p):
            best = None
            for g in greens:
                d = g.distance(Point(p))
                if d < 30 and (best is None or d < best[0]): best = (d, g)
            return best
        ga, gb = gnear(pts[0]), gnear(pts[-1])
        if ga and (not gb or ga[0] < gb[0]): pts = pts[::-1]; gb = ga
        gp = gb[1] if gb else Point(pts[-1]).buffer(12, 12)
        out[n] = (int(t.get('par', '0') or 0), pts, gp)
    return out
def snap(p, cs, maxd):
    best = None
    for c in cs:
        d = math.hypot(c[0] - p[0], c[1] - p[1])
        if d < maxd and (best is None or d < best[0]): best = (d, c)
    return [round(best[1][0], 1), round(best[1][1], 1)] if best else [round(p[0], 1), round(p[1], 1)]
def side_spot(P, s_, offs, ok):
    """A point at distance s_ along the line, moved to the side (left or right) where the ground suits (ok)."""
    p, (ux, uz) = at_s(P, s_); px, pz = -uz, ux
    for o in offs:
        for sd in (1, -1):
            q = (p[0] + px * o * sd, p[1] + pz * o * sd)
            if ok(q): return [round(q[0], 1), round(q[1], 1)]
    return [round(p[0], 1), round(p[1], 1)]
def build_course(ponds, RD, cls=None, blds=()):
    greens = []; tee_cs = []
    for el in ELS:
        t = T(el)
        if t.get('golf') in ('green', 'tee'):
            P = poly_of(el)
            if P is None: continue
            g = P if P.geom_type == 'Polygon' else max(P.geoms, key=lambda q: q.area)
            if t['golf'] == 'green': greens.append(g)
            else: tee_cs.append((g.centroid.x, g.centroid.y))
    areas = {}
    for el in ELS:
        t = T(el); nm = t.get('name', '')
        if t.get('leisure') == 'golf_course' and 'casterton' in nm.lower():
            P = poly_of(el)
            if P is None: continue
            k = 'par3' if 'par' in nm.lower() else 'range' if 'range' in nm.lower() else 'main' if 'golf' in nm.lower() else None
            if k: areas[k] = P if k not in areas else areas[k].union(P)
    REPORT['club_area_ha'] = {k: round(v.area / 1e4, 1) for k, v in areas.items()}
    sc = SN / CORE[2]
    def code(q):
        if cls is None: return 10
        i, j = int((q[1] - CORE[1]) * sc), int((q[0] - CORE[0]) * sc)
        return int(cls[min(SN - 1, max(0, i)), min(SN - 1, max(0, j))])
    bpolys = [Polygon(b['e']) for b in blds if len(b['e']) >= 3]
    def free(q, m=3.0):
        pt = Point(q)
        return not any(bp.distance(pt) < m for bp in bpolys if abs(bp.centroid.x - q[0]) < 60 and abs(bp.centroid.y - q[1]) < 60)
    holes = []
    # ---- the club's 9 holes, twice
    H9 = holes_in(areas.get('main'), greens, tee_cs)
    main9 = []
    for k in range(9):
        n = k + 1
        if n not in H9: raise SystemExit(f'hole {n} not in OSM')
        par_osm, pts, gp = H9[n]
        gc = [gp.centroid.x, gp.centroid.y]
        path_gt = [gc] + [p for p in pts[::-1][1:] if math.hypot(p[0] - gc[0], p[1] - gc[1]) > 12]
        Lmain = CARD['yd']['amarillas'][k] * YD
        off = plen(path_gt) - Lmain          # the OSM line starts at the yellow tee (its length matches the yellow card)
        tees = {}
        p_, _ = walk_back(path_gt, max(30.0, Lmain + off)); tees['amarillas'] = ty = snap(p_, tee_cs, 12)
        for col, arr in CARD['yd'].items():
            if col == 'amarillas': continue
            dL = arr[k] * YD - Lmain
            if abs(dL) < 30:      # a few metres from the yellow tee: the same line, behind or in front of it
                q, _ = walk_back(path_gt, max(30.0, Lmain + off) + 0.5); ux, uz = q[0] - p_[0], q[1] - p_[1]; l = math.hypot(ux, uz) or 1
                tees[col] = [round(ty[0] + ux / l * dL, 1), round(ty[1] + uz / l * dL, 1)]
            else:
                q, _ = walk_back(path_gt, max(30.0, arr[k] * YD + off)); tees[col] = snap(q, tee_cs, 12)
        _, i = walk_back(path_gt, max(30.0, Lmain + off))
        bends = [p for p in path_gt[1:i + 1][::-1] if math.hypot(p[0] - tees['amarillas'][0], p[1] - tees['amarillas'][1]) > 25 and math.hypot(p[0] - gc[0], p[1] - gc[1]) > 25]
        ring = simplify_ring([(round(x, 2), round(z, 2)) for x, z in gp.exterior.coords[:-1]], 0.3)
        main9.append(dict(par=CARD['par'][k], L=int(round(Lmain)), tee=tees['amarillas'], tees=tees, bends=[[round(x, 1), round(z, 1)] for x, z in bends],
                          green=[round(gc[0], 1), round(gc[1], 1)], green_poly=[list(p) for p in ring], line=[tees['amarillas']] + [[round(x, 1), round(z, 1)] for x, z in bends] + [[round(gc[0], 1), round(gc[1], 1)]]))
    for rnd in (0, 1):
        for k, h in enumerate(main9):
            hh = {kk: v for kk, v in h.items() if kk != 'line'}
            hh.update(n=k + 1 + 9 * rnd, hcp=CARD['si'][k] - rnd, info=('Segunda vuelta al hoyo ' + str(k + 1) + ': mismas calles, green y bandera.') if rnd else '')
            if rnd: hh['same'] = k     # the engine shares the flag and the pin with the hole it repeats
            holes.append(hh)
    # ---- the par 3 course (9 holes; metres from the OpenStreetMap lines)
    P3 = holes_in(areas.get('par3'), greens, tee_cs)
    p3 = []
    for n in sorted(P3):
        par_osm, pts, gp = P3[n]; gc = [gp.centroid.x, gp.centroid.y]
        tee = snap(pts[0], tee_cs, 10); L = math.hypot(gc[0] - tee[0], gc[1] - tee[1])
        ring = simplify_ring([(round(x, 2), round(z, 2)) for x, z in gp.exterior.coords[:-1]], 0.3)
        p3.append(dict(n=n, par=3, L=int(round(L)), hcp=None, tee=tee, tees={'blancas': tee}, bends=[], green=[round(gc[0], 1), round(gc[1], 1)], green_poly=[list(p) for p in ring], info=''))
    hcp_order = sorted(range(len(p3)), key=lambda i: -p3[i]['L'])
    for r, i in enumerate(hcp_order): p3[i]['hcp'] = r + 1
    holes += p3
    # ---- the driving range: the mat at the end nearer the clubhouse, a target green at 150 m along the range
    rng_ = None
    if 'range' in areas:
        R = areas['range'].minimum_rotated_rectangle; cs_ = list(R.exterior.coords)[:4]
        e = [(cs_[i], cs_[(i + 1) % 4]) for i in range(4)]; e.sort(key=lambda ab: -math.hypot(ab[1][0] - ab[0][0], ab[1][1] - ab[0][1]))
        (a0, a1) = e[0]; Lr = math.hypot(a1[0] - a0[0], a1[1] - a0[1]); ux, uz = (a1[0] - a0[0]) / Lr, (a1[1] - a0[1]) / Lr
        c = R.centroid; ends = [(c.x - ux * Lr / 2, c.y - uz * Lr / 2), (c.x + ux * Lr / 2, c.y + uz * Lr / 2)]
        club = next((pp for pp in POIS_CACHE if pp['k'] == 'clubhouse'), None)
        ref = club['p'] if club else (0, 0)
        if math.hypot(ends[1][0] - ref[0], ends[1][1] - ref[1]) < math.hypot(ends[0][0] - ref[0], ends[0][1] - ref[1]): ends = ends[::-1]; ux, uz = -ux, -uz
        mat = (ends[0][0] + ux * 6, ends[0][1] + uz * 6); dT = min(150.0, Lr * 0.75); tg = (mat[0] + ux * dT, mat[1] + uz * dT)
        gp = Point(tg).buffer(11, 10); ring = simplify_ring([(round(x, 2), round(z, 2)) for x, z in gp.exterior.coords[:-1]], 0.3)
        holes.append(dict(n=1, par=3, L=int(round(dT)), hcp=1, tee=[round(mat[0], 1), round(mat[1], 1)], tees={'blancas': [round(mat[0], 1), round(mat[1], 1)]}, bends=[],
                          green=[round(tg[0], 1), round(tg[1], 1)], green_poly=[list(p) for p in ring], info='Campo de prácticas: tiras bolas desde la alfombrilla; cada golpe vuelve a empezar desde ella.'))
        rng_ = [round(mat[0], 1), round(mat[1], 1), round(math.atan2(uz, ux), 4), round(Lr, 1)]
    nm, n3 = 18, len(p3)
    courses = [{'id': 'casterton', 'name': 'Casterton Golf Club', 'short': 'Casterton', 'club': 'Casterton Golf Club', 'color': '#2f6b3a', 'holes': list(range(18)),
                'tee': 'amarillas', 'tees': ['blancas', 'amarillas', 'rojas'], 'note': 'Metros desde barras amarillas, de la tarjeta del club (en yardas, pasadas a metros). Los 9 hoyos se juegan dos veces.'}]
    if n3: courses.append({'id': 'par3', 'name': 'Casterton Par 3', 'short': 'Par 3', 'club': 'Casterton Golf Club', 'color': '#8a6a2a', 'holes': list(range(nm, nm + n3)), 'tee': 'blancas', 'tees': ['blancas'],
                           'note': 'Campo corto de nueve hoyos de par 3; metros medidos sobre el plano de OpenStreetMap.'})
    if rng_: courses.append({'id': 'practicas', 'name': 'Campo de prácticas', 'short': 'Prácticas', 'club': 'Casterton Golf Club', 'color': '#2f6bd6', 'holes': [nm + n3], 'tee': 'blancas', 'tees': ['blancas'],
                             'note': 'Tiras bolas desde la alfombrilla hacia las banderas de 50, 100, 150 y 200 m; cada golpe vuelve a empezar desde ella.'})
    # ---- footgolf and rugbygolf on the 9 holes: shorter holes, the cup or the goal beside the fairway, short of the green
    soft = lambda q: code(q) in (1, 2, 10) and free(q)
    foot, rugby = [], []
    for k, h in enumerate(main9):
        P = h['line']; L = plen(P)
        Lf = max(70.0, min(190.0, L * 0.5)); Lr_ = max(70.0, min(210.0, L * 0.55))
        cup = side_spot(P, L - 24, (11, 14, 17, 21), soft); fte = side_spot(P, max(0.0, L - 24 - Lf), (6, 9, 12), soft)
        goal = side_spot(P, L - 46, (-9, -12, -15, 9, 12), soft) if True else None
        rte = side_spot(P, max(0.0, L - 46 - Lr_), (-5, -8, 5, 8), soft)
        dF = math.hypot(cup[0] - fte[0], cup[1] - fte[1]); dR = math.hypot(goal[0] - rte[0], goal[1] - rte[1])
        foot.append({'n': k + 1, 'par': 3 if dF < 95 else 4 if dF < 175 else 5, 'L': int(round(dF)), 'tee': fte, 'cup': cup})
        rugby.append({'n': k + 1, 'par': 3 if dR < 95 else 4 if dR < 180 else 5, 'L': int(round(dR)), 'tee': rte, 'goal': goal})
    # ---- tennis courts (S2): OSM pitches with tennis, levelled by the engine; not where a building stands
    courts = []
    for el in ELS:
        t = T(el)
        if t.get('leisure') != 'pitch' or 'tennis' not in t.get('sport', '') or el['type'] != 'way': continue
        P = poly_of(el)
        if P is None or P.area < 200: continue
        if any(bp.intersection(P).area > 0.2 * P.area for bp in bpolys if abs(bp.centroid.x - P.centroid.x) < 90 and abs(bp.centroid.y - P.centroid.y) < 90): continue
        c = P.centroid
        if not (CORE[0] + 5 < c.x < CORE[0] + CORE[2] - 5 and CORE[1] + 5 < c.y < CORE[1] + CORE[2] - 5): continue
        R = list(P.minimum_rotated_rectangle.exterior.coords)[:4]
        e1 = math.hypot(R[1][0] - R[0][0], R[1][1] - R[0][1]); e2 = math.hypot(R[2][0] - R[1][0], R[2][1] - R[1][1])
        if e1 >= e2: L, Wd, a = e1, e2, math.atan2(R[1][1] - R[0][1], R[1][0] - R[0][0])
        else: L, Wd, a = e2, e1, math.atan2(R[2][1] - R[1][1], R[2][0] - R[1][0])
        if L > 45 or Wd < 8: continue
        if L > 30 or Wd > 16:     # a block of courts mapped as one: the first court of it, at the regulation size
            L, Wd = min(L, 36.6), min(Wd, 18.3)
        courts.append({'k': 'tennis', 'c': [round(c.x, 1), round(c.y, 1)], 'a': round(a, 4), 'L': round(L, 1), 'W': round(Wd, 1), 's': 'green', 'rgb': [92, 140, 88]})
    # ---- team-sport pitches (S5): rugby, hockey (grass and the astro), football, the netball court (OSM: basketball) and cricket (S6)
    SPORT_K = {'rugby_union': 'rugby', 'rugby': 'rugby', 'field_hockey': 'hockey', 'tennis;field_hockey': 'astro', 'field_hockey;tennis': 'astro',
               'soccer': 'football', 'basketball': 'netball', 'netball': 'netball', 'cricket': 'cricket'}
    pitches = []
    for el in ELS:
        t = T(el)
        if t.get('leisure') != 'pitch' or el['type'] != 'way': continue
        k = SPORT_K.get(t.get('sport', ''))
        if not k: continue
        P = poly_of(el)
        if P is None or P.area < 150: continue
        c = P.centroid
        if not (CORE[0] + 5 < c.x < CORE[0] + CORE[2] - 5 and CORE[1] + 5 < c.y < CORE[1] + CORE[2] - 5): continue
        R = list(P.minimum_rotated_rectangle.exterior.coords)[:4]
        e1 = math.hypot(R[1][0] - R[0][0], R[1][1] - R[0][1]); e2 = math.hypot(R[2][0] - R[1][0], R[2][1] - R[1][1])
        if e1 >= e2: L, Wd, a = e1, e2, math.atan2(R[1][1] - R[0][1], R[1][0] - R[0][0])
        else: L, Wd, a = e2, e1, math.atan2(R[2][1] - R[1][1], R[2][0] - R[1][0])
        if k == 'cricket': L = Wd = min(L, Wd)                     # an oval: its square fits inside
        nm = t.get('name', '')
        pitches.append({'k': k, 'id': el['id'], 'c': [round(c.x, 1), round(c.y, 1)], 'a': round(a, 4), 'L': round(L, 1), 'W': round(Wd, 1),
                        's': 'astro' if k in ('astro', 'netball') else 'grass', 'n': nm, 'd': round(math.hypot(c.x, c.y))})
    pitches.sort(key=lambda p: (p['k'], p['d']))
    REPORT['pitches'] = [(p['k'], p['c'], p['L'], p['W'], p['d']) for p in pitches]
    log('pitches', REPORT['pitches'])
    # ---- car parks (S2): the one nearest the school, the golf club and Kirkby Lonsdale's centre
    parks = []
    for el in ELS:
        t = T(el)
        if t.get('amenity') != 'parking' or el['type'] != 'way': continue
        P = poly_of(el)
        if P is None or P.area < 300: continue
        R = list(P.minimum_rotated_rectangle.exterior.coords)[:4]
        e1 = math.hypot(R[1][0] - R[0][0], R[1][1] - R[0][1]); e2 = math.hypot(R[2][0] - R[1][0], R[2][1] - R[1][1])
        a = math.atan2(R[1][1] - R[0][1], R[1][0] - R[0][0]) if e1 >= e2 else math.atan2(R[2][1] - R[1][1], R[2][0] - R[1][0])
        parks.append({'c': [round(P.centroid.x, 1), round(P.centroid.y, 1)], 'a': round(a, 4), 'L': round(max(e1, e2), 1), 'W': round(min(e1, e2), 1), 'A': P.area})
    club = next((pp for pp in POIS_CACHE if pp['k'] == 'clubhouse'), None)
    parking = []
    for nm, ref in (('Colegio', (0, 0)), ('Club de golf', club['p'] if club else (-452, 613)), ('Kirkby Lonsdale', (-1430, 1080))):
        cand = [q for q in parks if math.hypot(q['c'][0] - ref[0], q['c'][1] - ref[1]) < 400 and q not in parking]
        if not cand: continue
        q = min(cand, key=lambda q: math.hypot(q['c'][0] - ref[0], q['c'][1] - ref[1]) - 0.02 * q['A'])
        parking.append(q); q['n'] = nm
    parking = [{k: v for k, v in q.items() if k != 'A'} for q in parking]
    REPORT['courts'] = [(c['c'], c['L'], c['W']) for c in courts]; REPORT['parking'] = [(q['n'], q['c']) for q in parking]
    log('courts', REPORT['courts'], 'parking', REPORT['parking'])
    REPORT['holes'] = [(h['n'], h['par'], h['L'], h['hcp']) for h in holes]
    REPORT['kick'] = {'foot': [(f['n'], f['par'], f['L']) for f in foot], 'rugby': [(r['n'], r['par'], r['L']) for r in rugby]}
    log('holes', len(holes), 'courses', [c['id'] for c in courses], 'range', rng_)
    log('footgolf', REPORT['kick'])
    roads_c = [{'w': r['w'], 'p': [[round(x, 1), round(z, 1)] for x, z in r['p']], 'cart': True} for r in RD if r['k'] in ('service', 'track') and any(abs(q[0]) < 1500 and abs(q[1]) < 1500 for q in r['p'])]
    return {'world': 'casterton', 'courses': courses, 'holes': holes, 'ponds': ponds, 'roads': roads_c, 'datum_m': DATUM, 'range': rng_, 'kick': {'foot': foot, 'rugby': rugby}, 'courts': courts, 'parking': parking, 'pitches': pitches}

# ------------------------------------------------------------------ S3: gates and openings in the walls, bridges and real routes
GATE_W = {'gate': 3.6, 'swing_gate': 3.6, 'lift_gate': 3.8, 'kissing_gate': 1.6, 'stile': 0.9}
GATE_T = {'gate': 0, 'swing_gate': 0, 'lift_gate': 1, 'kissing_gate': 2, 'stile': 3}
OPEN_W = {'footway': 1.6, 'path': 1.8, 'bridleway': 2.6, 'track': 3.6, 'service': 4.0, 'cycleway': 2.2, 'steps': 1.4}
ROUTE_F = {'bridleway': 0.75, 'track': 0.85, 'path': 1.0, 'footway': 1.1, 'cycleway': 1.0, 'service': 1.1, 'residential': 1.15, 'unclassified': 1.15,
           'living_street': 1.1, 'tertiary': 1.45, 'secondary': 1.9, 'primary': 2.5, 'trunk': 3.2, 'pedestrian': 1.1}
ROUTES = [('devil', "Del colegio al Devil's Bridge", [(-85, 77), (-1012, 1471), (-1066, 1459)]),
          ('pueblo', "Kirkby Lonsdale y Ruskin's View", [(-1066, 1459), (-1440, 1079), (-1478, 878), (-1502, 702)]),
          ('grange', 'Holy Trinity y Casterton Grange', [(-85, 77), (-140, 15), (-141, -416), (-290, -402)]),
          ('barbon', 'Por el valle hasta Barbon', [(-85, 77), (289, -2810)]),
          ('circulo', 'Al círculo de piedras', [(-85, 77), (1334, -294)])]
def cut_polyline(P, circ):
    """Removes from a polyline what lies inside any circle (x, z, r): returns the pieces left."""
    out = []; cur = None
    for i in range(len(P) - 1):
        ax, az = P[i]; bx, bz = P[i + 1]; dx, dz = bx - ax, bz - az; L2 = dx * dx + dz * dz
        rem = []
        for (cx, cz, r) in circ:
            if L2 < 1e-9: break
            fx, fz = ax - cx, az - cz; b = 2 * (fx * dx + fz * dz); c = fx * fx + fz * fz - r * r; disc = b * b - 4 * L2 * c
            if disc <= 0: continue
            sq = math.sqrt(disc); t1 = (-b - sq) / (2 * L2); t2 = (-b + sq) / (2 * L2)
            if t2 <= 0 or t1 >= 1: continue
            rem.append((max(0.0, t1), min(1.0, t2)))
        rem.sort(); keep = []; t = 0.0
        for a, b2 in rem:
            if a > t: keep.append((t, a))
            t = max(t, b2)
        if t < 1: keep.append((t, 1.0))
        pt = lambda u: (ax + dx * u, az + dz * u)
        if not keep:
            if cur: out.append(cur); cur = None
            continue
        for (u, v) in keep:
            if u > 1e-9 or cur is None:
                if cur: out.append(cur)
                cur = [pt(u)]
            cur.append(pt(v))
            if v < 1 - 1e-9: out.append(cur); cur = None
    if cur: out.append(cur)
    return [q for q in out if len(q) >= 2 and sum(math.hypot(q[k + 1][0] - q[k][0], q[k + 1][1] - q[k][1]) for k in range(len(q) - 1)) > 0.8]
def build_campo(RD):
    import heapq
    from scipy.spatial import cKDTree
    from shapely.strtree import STRtree
    log('campo: gates, openings in the walls, bridges and routes')
    inC = lambda q: CORE[0] + 2 < q[0] < CORE[0] + CORE[2] - 2 and CORE[1] + 2 < q[1] < CORE[1] + CORE[2] - 2
    npos = {}; nhw = {}; nbar = {}; adj = {}
    for el in ELS:
        if el['type'] != 'way' or not el.get('geometry') or not el.get('nodes'): continue
        t = T(el); hw = t.get('highway'); bar = t.get('barrier') or ('hedge' if t.get('natural') == 'hedge' else None)
        G, N = el['geometry'], el['nodes']
        for i, nid in enumerate(N):
            if G[i]: npos[nid] = loc(G[i])
        for i, nid in enumerate(N):
            if not G[i]: continue
            a = G[max(0, i - 1)] or G[i]; b = G[min(len(N) - 1, i + 1)] or G[i]
            pa, pb = loc(a), loc(b)
            if pa == pb: continue
            d = math.atan2(pb[1] - pa[1], pb[0] - pa[0])
            if hw and nid not in nhw: nhw[nid] = (hw, d)
            if bar in ('wall', 'fence', 'hedge') and nid not in nbar: nbar[nid] = d
        if hw and hw not in ('motorway', 'motorway_link', 'proposed', 'construction', 'abandoned', 'raceway', 'bus_guideway') and t.get('area') != 'yes':
            f = ROUTE_F.get(hw, 1.6) * (40 if hw == 'steps' else 1) * (0.9 if t.get('designation') in ('public_bridleway', 'byway_open_to_all_traffic', 'restricted_byway') else 1)
            if t.get('horse') == 'no': f *= 8
            if t.get('access') in ('private', 'no'): f *= 6
            for i in range(len(N) - 1):
                if not G[i] or not G[i + 1]: continue
                pa, pb = loc(G[i]), loc(G[i + 1]); L = math.hypot(pb[0] - pa[0], pb[1] - pa[1])
                adj.setdefault(N[i], []).append((N[i + 1], L * f, L)); adj.setdefault(N[i + 1], []).append((N[i], L * f, L))
    # ---- the gates (nodes on paths, walls or fences, and gates mapped as a short line)
    gates = []; openings = []
    for el in ELS:
        t = T(el); b = t.get('barrier')
        if b not in GATE_W: continue
        if el['type'] == 'node':
            p = loc(el)
            if not inC(p): continue
            w = GATE_W[b]
            if el['id'] in nhw:
                hw, d = nhw[el['id']]; a = d + math.pi / 2
                if b in ('gate', 'swing_gate', 'lift_gate'): w = min(4.6, max(w, WID.get(hw, 3.0) * (0.75 if hw not in OPEN_W else 1.0)))
            elif el['id'] in nbar: a = nbar[el['id']]
            else: continue
        elif el['type'] == 'way' and el.get('geometry') and b == 'gate':
            g = [loc(q) for q in el['geometry'] if q]
            if len(g) < 2: continue
            p = ((g[0][0] + g[-1][0]) / 2, (g[0][1] + g[-1][1]) / 2); w = math.hypot(g[-1][0] - g[0][0], g[-1][1] - g[0][1])
            if not inC(p) or w < 1 or w > 7: continue
            a = math.atan2(g[-1][1] - g[0][1], g[-1][0] - g[0][0])
        else: continue
        k = GATE_T[b]
        if k == 0 and (int(p[0] * 7 + p[1] * 13) % 5) < 2: k = 1      # some field gates are galvanised steel
        gates.append([round(p[0], 1), round(p[1], 1), round(a, 3), round(w, 1), k])
        openings.append((p[0], p[1], w / 2 + 0.25))
    # ---- where a path, a track or a road crosses a wall, a hedge or a fence, there is a way through
    J = json.load(open(os.path.join(OUT, 'walls.json')))
    WL = [(k, h, [(c[i] / 4, c[i + 1] / 4) for i in range(0, len(c), 2)]) for k, h, c in J['w']]
    lines = []; meta = []
    for r in RD:
        if r['bridge'] or len(r['p']) < 2: continue
        lines.append(LineString(r['p'])); meta.append(r)
    tree = STRtree(lines); n_x = 0
    for k, h, P in WL:
        if k == 3 or len(P) < 2: continue
        Lw = LineString(P)
        for j in tree.query(Lw, predicate='intersects'):
            r = meta[j]; X = Lw.intersection(lines[j])
            pts = [X] if X.geom_type == 'Point' else list(getattr(X, 'geoms', []))
            for q in pts:
                if q.geom_type != 'Point': continue
                openings.append((q.x, q.y, (OPEN_W.get(r['k'], r['w']) + 0.7) / 2)); n_x += 1
    O = np.array([(o[0], o[1]) for o in openings]); R_ = np.array([o[2] for o in openings]); kd = cKDTree(O)
    out = []; n_cut = 0
    for k, h, P in WL:
        if k == 3: out.append((k, h, P)); continue
        xs = [q[0] for q in P]; zs = [q[1] for q in P]; cx, cz = (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2
        rad = math.hypot(max(xs) - min(xs), max(zs) - min(zs)) / 2 + 3
        near = [i for i in kd.query_ball_point((cx, cz), rad)]
        circ = [(O[i][0], O[i][1], R_[i]) for i in near]
        if not circ: out.append((k, h, P)); continue
        pieces = cut_polyline(P, circ)
        if len(pieces) != 1 or len(pieces[0]) != len(P): n_cut += 1
        for q in pieces: out.append((k, h, q))
    J = {'v': 2, 'w': [[k, h, [int(round(c * 4)) for q in P for c in q]] for k, h, P in out]}
    json.dump(J, open(os.path.join(OUT, 'walls.json'), 'w'), separators=(',', ':'))
    # ---- bridges: every road or path on a bridge (the LIDAR ground model has none), with the name of the bridge it is on
    named = []
    for el in ELS:
        t = T(el)
        if t.get('man_made') == 'bridge' and el['type'] == 'way':
            P = poly_of(el)
            if P is not None: named.append((P, t.get('name', '')))
    bridges = []
    for r in RD:
        if not r['bridge'] or r['k'] in ('abandoned', 'proposed', 'construction'): continue
        P = [q for q in r['p']]; Ln = plen(P)
        if Ln < 8 or not all(inC(q) for q in P): continue
        mid = LineString(P).interpolate(0.5, normalized=True)
        nm = next((n for Pp, n in named if Pp.buffer(2).contains(mid)), '') or r['name']
        bridges.append({'p': [[round(x, 1), round(z, 1)] for x, z in P], 'w': r['w'] if r['k'] not in OPEN_W else OPEN_W[r['k']] + 0.6, 'k': r['k'], 'n': nm})
    # ---- real routes for walking, riding and cycling: the cheapest way along the mapped paths (bridleways and tracks first)
    ids = [n for n in adj if n in npos]; P_ = np.array([npos[n] for n in ids]); kdn = cKDTree(P_)
    def near_node(q): return ids[kdn.query(q)[1]]
    def dijkstra(a, b):
        dist = {a: 0.0}; prev = {}; hq = [(0.0, a)]
        while hq:
            d, u = heapq.heappop(hq)
            if u == b: break
            if d > dist.get(u, 1e18): continue
            for v, c, _ in adj.get(u, ()):
                nd_ = d + c
                if nd_ < dist.get(v, 1e18): dist[v] = nd_; prev[v] = u; heapq.heappush(hq, (nd_, v))
        if b not in dist: return None
        path = [b]
        while path[-1] != a: path.append(prev[path[-1]])
        return path[::-1]
    routes = []
    for rid, nm, wps in ROUTES:
        seq = []; stops = []; ok = True
        for i in range(len(wps) - 1):
            pth = dijkstra(near_node(wps[i]), near_node(wps[i + 1]))
            if not pth: ok = False; break
            pts = [npos[n] for n in pth]
            if seq and pts and math.hypot(seq[-1][0] - pts[0][0], seq[-1][1] - pts[0][1]) < 0.01: pts = pts[1:]
            seq += pts; stops.append(len(seq) - 1)
        if not ok or len(seq) < 2: log('route failed', rid); continue
        # resample every 4 m
        res = [seq[0]]; acc = 0.0
        for i in range(len(seq) - 1):
            ax, az = seq[i]; bx, bz = seq[i + 1]; L = math.hypot(bx - ax, bz - az); s = 4.0 - acc
            while s < L: res.append((ax + (bx - ax) * s / L, az + (bz - az) * s / L)); s += 4.0
            acc = L - (s - 4.0)
        res.append(seq[-1])
        st = [min(range(len(res)), key=lambda j: math.hypot(res[j][0] - seq[k][0], res[j][1] - seq[k][1])) for k in stops]
        routes.append({'id': rid, 'n': nm, 'L': round(plen(seq)), 'p': [c for q in res for c in (round(q[0], 1), round(q[1], 1))], 'st': st})
    REPORT['campo'] = {'gates': len(gates), 'crossings': n_x, 'walls_cut': n_cut, 'bridges': [(b['n'], b['k'], round(plen(b['p']))) for b in bridges],
                       'routes': [(r['id'], r['L']) for r in routes]}
    log('campo', REPORT['campo'])
    return {'gates': gates, 'bridges': bridges, 'routes': routes}

POIS_CACHE = []

if __name__ == '__main__':
    main()
