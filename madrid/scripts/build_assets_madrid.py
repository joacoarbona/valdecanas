#!/usr/bin/env python3
"""Build the game assets of the Madrid golf world (Real Club de la Puerta de Hierro + Club de Campo Villa de Madrid)
from the downloaded open data in madrid/data (see scripts/fetch_geodata_madrid*.py) and the routing of the four courses
(madrid/scripts/course_def.json, built by course_madrid.py).

Game frame: metres, x = east, z = south, y = up; origin = madrid/data/meta.json centre; y = 0 is DATUM metres above sea
level (no sea here: water only in ponds, the river and pools).

Outputs (madrid/game/data):
  h_core.bin (4 m over the core square), h_wide.bin (20 m over 16 km), h_region.bin (200 m over 140 km)
  surface_core.rle (1 m surface codes over the core), trees.bin, buildings.json, pools.json, course.json
  ortho_core_4096.jpg / _2048.jpg (core), tiles/t_<j>_<i>.jpg (8 x 8 tiles of 1024 px, 0.46 m/px, loaded near the player)
  ortho_region_4096.jpg (16 km, for the land around), ortho_map_2048.jpg + map_surface_2048.png (in-game map)
Surface codes: 1 rough, 2 semi-rough, 3 fairway, 4 fringe, 5 green, 6 tee, 7 bunker, 8 road and path, 9 bare sand,
10 lawn and sports fields, 20+ ponds and river reaches (index into course.json ponds)."""
import glob, json, math, os, re, struct, sys
import numpy as np
from PIL import Image, ImageDraw, ImageEnhance
from scipy import ndimage as ndi
import rasterio
from pyproj import Transformer
from skimage import measure
from shapely.geometry import Polygon, box, LineString
from shapely.ops import unary_union

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D = os.path.join(ROOT, 'madrid', 'data'); OUT = os.path.join(ROOT, 'madrid', 'game', 'data'); TILES = os.path.join(OUT, 'tiles')
os.makedirs(TILES, exist_ok=True)
meta = json.load(open(os.path.join(D, 'meta.json'))); CX, CY = meta['centre_utm30']
FLOG = json.load(open(os.path.join(D, 'fetch_log.json')))
OBB = FLOG['ortho']['bbox_utm30']                       # minx, miny, maxx, maxy of the 0.3 m photo
ORTHO_HI = (OBB[0] - CX, CY - OBB[3], OBB[2] - OBB[0])  # x0, z0, size in game metres
OPX = FLOG['ortho']['px_m']
DATUM = 560.0
CORE = (-1950.0, -1700.0, 3800.0)                       # x0, z0, size: the four courses plus a margin
NT = 8                                                   # photo tiles per side over the core (1024 px each)
MAPF = (-1960.0, -1650.0, 3710.0)                        # square frame of the in-game map photo
REPORT = {'datum': DATUM, 'core': CORE}
ll = Transformer.from_crs('EPSG:4326', 'EPSG:25830', always_xy=True)
def loc(g): e, n = ll.transform(g['lon'], g['lat']); return (e - CX, CY - n)
def log(*a): print(*a, flush=True)

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
def simplify(ring, tol=0.25):
    if len(ring) > 1 and ring[0] == ring[-1]: ring = ring[:-1]
    if len(ring) < 5: return ring
    pts = np.array(ring, dtype='float64')
    def rdp(a, b):
        if b <= a + 1: return [a]
        p, q = pts[a], pts[b]; v = q - p; L = math.hypot(*v) or 1e-9; w = pts[a + 1:b] - p
        d = np.abs(v[0] * w[:, 1] - v[1] * w[:, 0]) / L; i = int(np.argmax(d))
        if d[i] > tol: return rdp(a, a + 1 + i) + rdp(a + 1 + i, b)
        return [a]
    far = int(np.argmax(np.hypot(*(pts - pts[0]).T)))
    pts = np.vstack([pts, pts[:1]])
    idx = rdp(0, far) + rdp(far, len(pts) - 1)
    return [ring[i % len(ring)] for i in idx]
def grade(im):
    im = ImageEnhance.Color(im).enhance(1.14); im = ImageEnhance.Contrast(im).enhance(1.07)
    return ImageEnhance.Brightness(im).enhance(1.03)

# ------------------------------------------------------------------ photo
def mosaic():
    tiles = sorted(glob.glob(os.path.join(D, 'raw', 'ortho', 'o_*.jpg')))
    nx, ny = FLOG['ortho']['nx'], FLOG['ortho']['ny']
    im = Image.new('RGB', (2000 * nx, 2000 * ny), (110, 120, 100))
    for p in tiles:
        j, i = map(int, re.findall(r'o_(\d+)_(\d+)', p)[0]); im.paste(Image.open(p).convert('RGB'), (i * 2000, j * 2000))
    return im
def crop_game(mos, x0, z0, size, out_px):
    f = lambda v, o: int(round((v - o) / OPX))
    return mos.crop((f(x0, ORTHO_HI[0]), f(z0, ORTHO_HI[1]), f(x0 + size, ORTHO_HI[0]), f(z0 + size, ORTHO_HI[1]))).resize((out_px, out_px), Image.LANCZOS)

# ------------------------------------------------------------------ elevation
def relax(h0):
    h = h0.copy(); lo = h0 - 0.5; hi = h0 + 0.5           # the MDT is rounded to 1 m: relax inside the rounding band
    for _ in range(80):
        h = ndi.gaussian_filter(h, 1.0, mode='nearest'); np.clip(h, lo, hi, out=h)
    return ndi.gaussian_filter(h, 0.6, mode='nearest')
def load_dem(name, smooth=True):
    with rasterio.open(os.path.join(D, 'raw', name)) as s:
        h0 = s.read(1).astype('float64'); tr = s.transform
    h = relax(h0) if smooth else h0
    return (h - DATUM).astype('float32'), tr.c - CX, CY - tr.f, tr.a
def sample(grid, gx0, gz0, res, xs, zs, order=3):
    return ndi.map_coordinates(grid, [(zs - gz0) / res - 0.5, (xs - gx0) / res - 0.5], order=order, mode='nearest')

# ------------------------------------------------------------------ OpenStreetMap
osm = json.load(open(os.path.join(D, 'osm.json')))
def rings_of(el):
    if el['type'] == 'way' and el.get('geometry'): return [[loc(q) for q in el['geometry']]], []
    if el['type'] == 'relation':
        outer = [[loc(q) for q in (m.get('geometry') or [])] for m in el.get('members', []) if m.get('role') == 'outer' and m.get('geometry')]
        inner = [[loc(q) for q in (m.get('geometry') or [])] for m in el.get('members', []) if m.get('role') == 'inner' and m.get('geometry')]
        return outer, inner
    return [], []
def closed(r): return len(r) > 3 and math.hypot(r[0][0] - r[-1][0], r[0][1] - r[-1][1]) < 0.5

def main():
    course_def = json.load(open(os.path.join(ROOT, 'madrid', 'scripts', 'course_def.json')))
    # tees corrected on the photo: the card distance put these inside the club house, the tee box is just north of it
    TEE_FIX = {('arriba', 1): {'blancas': (-59.5, -77.5), 'amarillas': (-58.5, -86.5)}}
    for hd in course_def['holes']:
        fx = TEE_FIX.get((hd['course'], hd['n']))
        if fx:
            hd['tees'].update({k: [v[0], v[1]] for k, v in fx.items()})
            main = next(c['tee'] for c in course_def['courses'] if c['id'] == hd['course'])
            hd['tee'] = list(hd['tees'][main])
    log('mosaic'); mos = mosaic()
    log('dem'); dem, dgx, dgz, dres = load_dem('dem_Elevacion25830_5.tif')
    S = int(CORE[2]); x0c, z0c = CORE[0], CORE[1]
    def to_px(p): return (p[0] - x0c, p[1] - z0c)

    # -------------------------------------------------- water: ponds, tanks and the river (split into reaches)
    waters = []
    for el in osm['elements']:
        t = el.get('tags', {})
        isw = t.get('natural') == 'water' or t.get('golf') in ('water_hazard', 'lateral_water_hazard') or t.get('landuse') in ('reservoir', 'basin') or t.get('waterway') == 'riverbank'
        if not isw or t.get('leisure') == 'swimming_pool' or t.get('covered') == 'yes': continue
        outer, inner = rings_of(el)
        for r in outer:
            if not closed(r): continue
            P = Polygon(r)
            if not P.is_valid: P = P.buffer(0)
            if P.area < 25: continue
            waters.append((t, P))
    core_box = box(x0c + 5, z0c + 5, x0c + S - 5, z0c + S - 5)
    ponds = []
    for t, P in waters:
        P = P.intersection(core_box)
        if P.is_empty: continue
        river = t.get('water') == 'river' or t.get('waterway') == 'riverbank'
        pieces = []
        if river:   # a long river polygon cannot have one level: cut it into 70 m cells, each a reach with its own level
            minx, minz, maxx, maxz = P.bounds
            for gx in np.arange(math.floor(minx / 70) * 70, maxx, 70):
                for gz in np.arange(math.floor(minz / 70) * 70, maxz, 70):
                    q = P.intersection(box(gx, gz, gx + 70, gz + 70))
                    if not q.is_empty: pieces.append(q)
        else: pieces = [P]
        for q in pieces:
            geoms = [q] if q.geom_type == 'Polygon' else [g for g in getattr(q, 'geoms', []) if g.geom_type == 'Polygon']
            for g in geoms:
                if g.area < 20: continue
                ring = [(round(x, 2), round(z, 2)) for x, z in g.exterior.coords[:-1]]
                ring = simplify(ring, 0.4)
                if len(ring) < 3: continue
                xs = np.array([p[0] for p in ring]); zs = np.array([p[1] for p in ring])
                hb = sample(dem, dgx, dgz, dres, xs, zs, order=1)
                level = float(np.percentile(hb, 8)) - 0.25
                name = t.get('name') or ('Río Manzanares' if river else 'Lago' if g.area > 2500 else 'Estanque')
                if t.get('water') == 'wastewater': name = 'Depósito de la depuradora'
                ponds.append({'name': name, 'poly': [list(p) for p in ring], 'level': round(level, 2), 'river': river})
    ponds = ponds[:230]
    REPORT['ponds'] = len(ponds); log('ponds', len(ponds))

    # -------------------------------------------------- core heights (4 m), carved for the water
    N = int(round(CORE[2] / 4)) + 1; step = CORE[2] / (N - 1)
    zz, xx = np.mgrid[0:N, 0:N]; X = CORE[0] + xx * step; Z = CORE[1] + zz * step
    h = sample(dem, dgx, dgz, dres, X, Z, order=3)
    from matplotlib.path import Path as MPath
    pts = np.stack([X.ravel(), Z.ravel()], 1)
    for pd in ponds:
        poly = np.array(pd['poly']); mp = MPath(poly)
        bx0, bz0 = poly.min(0) - 12; bx1, bz1 = poly.max(0) + 12
        sel = (X >= bx0) & (X <= bx1) & (Z >= bz0) & (Z <= bz1)
        if not sel.any(): continue
        ii, jj = np.nonzero(sel)
        inside = np.zeros_like(sel); inside[ii, jj] = mp.contains_points(np.stack([X[ii, jj], Z[ii, jj]], 1))
        dd = ndi.distance_transform_edt(~inside) * step
        bank = np.clip(1 - dd / 8.0, 0, 1) * sel
        target = pd['level'] - (0.9 if pd['river'] else 1.4)
        h = np.where(inside, np.minimum(h, target), h)
        h = np.where(~inside & (bank > 0), np.minimum(h, pd['level'] + 0.15 + (1 - bank) * 3.0 + (h - pd['level']) * (1 - bank)), h)
    write_u16(os.path.join(OUT, 'h_core.bin'), h, 50, 100)
    REPORT['h_core'] = {'n': N, 'step': step, 'x0': CORE[0], 'z0': CORE[1], 'min': float(h.min()), 'max': float(h.max())}
    log('h_core', REPORT['h_core'])
    hcore = h

    # -------------------------------------------------- wide heights (20 m over 16 km) and the region (200 m)
    Nw = 801; sw = 20.0; W0 = -8000.0
    zz, xx = np.mgrid[0:Nw, 0:Nw]; Xw = W0 + xx * sw; Zw = W0 + zz * sw
    wide_tif = os.path.join(D, 'raw', 'dem_wide_Elevacion25830_25.tif')
    if os.path.exists(wide_tif):
        d25, g25x, g25z, r25 = load_dem('dem_wide_Elevacion25830_25.tif')
        hw = sample(d25, g25x, g25z, r25, Xw, Zw, order=1)
        # blend in the 5 m relief where it exists
        h5 = sample(dem, dgx, dgz, dres, Xw, Zw, order=1)
        e5 = min(dem.shape) * dres / 2 - 150
        dist = np.maximum(np.abs(Xw - (dgx + dem.shape[1] * dres / 2)), np.abs(Zw - (dgz + dem.shape[0] * dres / 2)))
        t = np.clip((e5 - dist) / 400, 0, 1)
        hw = hw * (1 - t) + h5 * t
    else:   # without the 25 m relief, the 5 m one (flat beyond its edge)
        hw = sample(dem, dgx, dgz, dres, Xw, Zw, order=1)
    write_u16(os.path.join(OUT, 'h_wide.bin'), hw, 50, 100)
    REPORT['h_wide'] = {'n': Nw, 'step': sw, 'x0': W0, 'z0': W0, 'max': float(hw.max()), 'min': float(hw.min())}
    rp = glob.glob(os.path.join(D, 'raw', 'dem_region_*.tif'))[0]
    with rasterio.open(rp) as s:
        hr = s.read(1).astype('float32') - DATUM; trr = s.transform
    write_u16(os.path.join(OUT, 'h_region.bin'), hr, 400, 20)
    REPORT['h_region'] = {'n': hr.shape[0], 'step': trr.a, 'x0': trr.c - CX, 'z0': CY - trr.f, 'max': float(hr.max()), 'min': float(hr.min())}
    log('wide/region', REPORT['h_wide'], REPORT['h_region'])

    # -------------------------------------------------- photo textures
    log('textures')
    core_img = grade(crop_game(mos, CORE[0], CORE[1], CORE[2], 8192))
    core_img.resize((4096, 4096), Image.LANCZOS).save(os.path.join(OUT, 'ortho_core_4096.jpg'), quality=84, optimize=True, progressive=True)
    core_img.resize((2048, 2048), Image.LANCZOS).save(os.path.join(OUT, 'ortho_core_2048.jpg'), quality=85, optimize=True, progressive=True)
    tp = 8192 // NT
    for j in range(NT):
        for i in range(NT):
            core_img.crop((i * tp, j * tp, (i + 1) * tp, (j + 1) * tp)).save(os.path.join(TILES, f't_{j}_{i}.jpg'), quality=80, optimize=True, progressive=True)
    del core_img
    grade(crop_game(mos, MAPF[0], MAPF[1], MAPF[2], 2048)).save(os.path.join(OUT, 'ortho_map_2048.jpg'), quality=84, optimize=True, progressive=True)
    reg = os.path.join(D, 'ortho_region_4096.jpg')
    if os.path.exists(reg):
        rimg = Image.open(reg).convert('RGB')
        # paste the sharper photo over the middle so the wide land matches the core
        hi = grade(mos.resize((int(ORTHO_HI[2] / 16000 * 4096),) * 2, Image.LANCZOS))
        rimg = grade(rimg); px0 = int(round((ORTHO_HI[0] + 8000) / 16000 * 4096)); pz0 = int(round((ORTHO_HI[1] + 8000) / 16000 * 4096))
        mask = Image.new('L', hi.size, 0); ImageDraw.Draw(mask).rectangle((6, 6, hi.size[0] - 7, hi.size[1] - 7), fill=255)
        from PIL import ImageFilter
        mask = mask.filter(ImageFilter.GaussianBlur(4)); rimg.paste(hi, (px0, pz0), mask)
        rimg.save(os.path.join(OUT, 'ortho_region_4096.jpg'), quality=84, optimize=True, progressive=True)
        ORTHO_W = (-8000.0, -8000.0, 16000.0)
    else:
        grade(mos.resize((2048, 2048), Image.LANCZOS)).save(os.path.join(OUT, 'ortho_region_4096.jpg'), quality=84)
        ORTHO_W = ORTHO_HI

    # -------------------------------------------------- surfaces (1 m over the core)
    log('surfaces')
    small = np.asarray(crop_game(mos, CORE[0], CORE[1], CORE[2], S)).astype('float32')   # 1 m/px
    R, G, B = small[..., 0], small[..., 1], small[..., 2]; L = (R + G + B) / 3; sat = small.max(-1) - small.min(-1)
    m5 = ndi.uniform_filter(L, 5); sd = np.sqrt(np.maximum(ndi.uniform_filter(L * L, 5) - m5 * m5, 0))
    def canvas(): im = Image.new('L', (S, S), 0); return im, ImageDraw.Draw(im)
    def mask_from(polys, width=None, inner=()):
        im, d = canvas()
        for r in polys:
            if width: d.line([to_px(p) for p in r], fill=255, width=max(1, int(round(width))))
            elif len(r) >= 3: d.polygon([to_px(p) for p in r], fill=255)
        for r in inner:
            if len(r) >= 3: d.polygon([to_px(p) for p in r], fill=0)
        return np.asarray(im) > 0
    golf_polys, lawn, paved, roads_lines, cart_lines, fair, tee_p, green_p, bunker_p, sand_p, rough_p = [], [], [], [], [], [], [], [], [], [], []
    WID = {'motorway': 26, 'trunk': 20, 'motorway_link': 9, 'trunk_link': 8, 'primary': 14, 'primary_link': 8, 'secondary': 12, 'secondary_link': 7,
           'tertiary': 9, 'tertiary_link': 6, 'unclassified': 7, 'residential': 8, 'living_street': 6, 'service': 5, 'track': 3.5,
           'pedestrian': 5, 'footway': 2.2, 'path': 2.0, 'cycleway': 2.5, 'steps': 2, 'bridleway': 2.5}
    for el in osm['elements']:
        t = el.get('tags', {}); outer, inner = rings_of(el)
        g = t.get('golf')
        if t.get('leisure') == 'golf_course': golf_polys += [r for r in outer if closed(r)]
        if g == 'fairway': fair += outer
        elif g == 'tee' and el['type'] == 'way': tee_p += outer
        elif g == 'green': green_p += outer
        elif g == 'bunker': bunker_p += outer
        elif g == 'rough': rough_p += outer
        elif g in ('cartpath', 'path') and el['type'] == 'way': cart_lines.append(outer[0] if outer else [])
        if t.get('natural') == 'sand' and el['type'] in ('way', 'relation'): sand_p += [r for r in outer if closed(r)]
        if t.get('landuse') in ('grass', 'meadow', 'recreation_ground', 'village_green') or t.get('leisure') in ('park', 'garden', 'pitch', 'playground', 'common', 'track') or g == 'driving_range':
            lawn += [r for r in outer if closed(r)]
        if t.get('amenity') == 'parking' or (t.get('highway') and t.get('area') == 'yes'):
            paved += [r for r in outer if closed(r)]
        hw_ = t.get('highway')
        if hw_ and el['type'] == 'way' and t.get('area') != 'yes' and outer and t.get('tunnel') not in ('yes', 'building_passage'):
            w = WID.get(hw_, 3)
            if t.get('golf') == 'cartpath' or t.get('golf_cart') == 'yes': w = 2.5
            if t.get('bridge') == 'yes' and w > 10: continue
            roads_lines.append((w, outer[0], hw_))
        if t.get('railway') in ('rail', 'light_rail') and el['type'] == 'way' and outer and t.get('tunnel') != 'yes':
            roads_lines.append((7, outer[0], 'rail'))
    golf = mask_from(golf_polys)
    cls = np.ones((S, S), np.uint8)
    cls[mask_from(lawn)] = 10
    # bare sandy ground outside the courses (photo): pale, flat, unsaturated
    bare = (L > 150) & (sat < 40) & (sd < 9) & ~golf
    bare = ndi.binary_opening(bare, iterations=2); cls[bare] = 9
    # paths inside the courses go under the fairways; real roads go over everything but greens, tees and bunkers
    soft = [(w, r, k) for w, r, k in roads_lines if WID.get(k, 3) <= 3.5 or k == 'cart']
    hard = [(w, r, k) for w, r, k in roads_lines if not (WID.get(k, 3) <= 3.5 or k == 'cart')]
    im, d = canvas()
    for w, r, k in soft: d.line([to_px(p) for p in r], fill=255, width=max(1, int(round(w))))
    for r in cart_lines:
        if r: d.line([to_px(p) for p in r], fill=255, width=2)
    cls[np.asarray(im) > 0] = 8
    cls[mask_from(rough_p)] = 1
    fw = mask_from(fair); cls[fw] = 3
    semi = ndi.binary_dilation(fw, iterations=2) & ~fw & golf & (cls == 1); cls[semi] = 2
    im, d = canvas()
    for w, r, k in hard: d.line([to_px(p) for p in r], fill=255, width=max(1, int(round(w))))
    pav = (np.asarray(im) > 0) | mask_from(paved); cls[pav] = 8
    # tees: OSM boxes plus a box at every tee of the routing (many Club de Campo tees are not mapped)
    im, d = canvas()
    for r in tee_p:
        if len(r) >= 3: d.polygon([to_px(p) for p in r], fill=255)
    for hd in course_def['holes']:
        nxt = (hd['bends'] or [hd['green']])[0]
        for tp_ in hd['tees'].values():
            a = math.atan2(nxt[1] - tp_[1], nxt[0] - tp_[0]); c, s_ = math.cos(a), math.sin(a)
            bx = [(-5, -3), (5, -3), (5, 3), (-5, 3)]
            d.polygon([to_px((tp_[0] + u * c - v * s_, tp_[1] + u * s_ + v * c)) for u, v in bx], fill=255)
    tees_m = np.asarray(im) > 0
    # greens: OSM plus the traced ones of the routing
    im, d = canvas()
    for r in green_p:
        if len(r) >= 3: d.polygon([to_px(p) for p in r], fill=255)
    for hd in course_def['holes']:
        d.polygon([to_px(p) for p in hd['green_poly']], fill=255)
    greens = np.asarray(im) > 0
    fringe = ndi.binary_dilation(greens, iterations=2) & ~greens
    # bunkers: OSM polygons, sand polygons inside the courses, and pale sand seen in the photo near the holes
    lines_im, ld = canvas()
    for hd in course_def['holes']:
        ld.line([to_px(p) for p in [hd['tee']] + hd['bends'] + [hd['green']]], fill=255, width=1)
    dline = ndi.distance_transform_edt(np.asarray(lines_im) == 0)
    photo_sand = (L > 168) & (sat < 46) & (sd < 13) & golf & (dline < 75)
    photo_sand = ndi.binary_opening(photo_sand, iterations=1)
    lab, n = ndi.label(photo_sand); szs = ndi.sum(photo_sand, lab, range(1, n + 1))
    photo_sand = np.isin(lab, 1 + np.where((szs >= 10) & (szs <= 900))[0])
    bunk = mask_from(bunker_p) | (mask_from(sand_p) & golf) | photo_sand
    bunk &= ~greens & ~tees_m
    cls[bunk] = 7
    cls[fringe & ~bunk] = 4; cls[greens] = 5; cls[tees_m & ~greens] = 6
    pond_id = np.zeros((S, S), np.uint8)
    for k, p in enumerate(ponds):
        im, d = canvas(); d.polygon([to_px(q) for q in p['poly']], fill=255); pond_id[np.asarray(im) > 0] = 20 + k
    cls[pond_id > 0] = pond_id[pond_id > 0]
    write_rle(os.path.join(OUT, 'surface_core.rle'), cls)
    REPORT['surface_counts'] = {int(k): int(v) for k, v in zip(*np.unique(cls, return_counts=True)) if k < 20}
    REPORT['photo_bunkers_px'] = int(photo_sand.sum())
    log('surface', REPORT['surface_counts'])
    pal = {1: (171, 168, 112), 2: (150, 176, 92), 3: (116, 181, 74), 4: (102, 182, 73), 5: (79, 174, 69), 6: (98, 173, 70), 7: (239, 226, 185),
           8: (154, 151, 144), 9: (226, 214, 180), 10: (140, 184, 92)}
    rgb = np.zeros((S, S, 3), np.uint8)
    for k, c in pal.items(): rgb[cls == k] = c
    rgb[cls >= 20] = (98, 160, 190)
    Image.fromarray(rgb).resize((2048, 2048), Image.NEAREST).save(os.path.join(OUT, 'map_surface_2048.png'), optimize=True)

    # -------------------------------------------------- buildings (Catastro) and trees (photo)
    blds = build_buildings(dem, dgx, dgz, dres)
    log('trees')
    fs = 0.8; full = np.asarray(crop_game(mos, ORTHO_HI[0], ORTHO_HI[1], ORTHO_HI[2], int(ORTHO_HI[2] / fs))).astype('float32')
    Lf = full.mean(-1); BR = full[..., 2] - full[..., 0]; GR = full[..., 1] - full[..., 0]
    locm = ndi.uniform_filter(Lf, 31)
    mf = ndi.uniform_filter(Lf, 5); sdf = np.sqrt(np.maximum(ndi.uniform_filter(Lf * Lf, 5) - mf * mf, 0))
    canopy = (Lf < locm - 12) & (Lf < 120) & (BR < 14) & (sdf > 5.5)
    canopy = ndi.binary_opening(canopy, iterations=1)
    dt = ndi.distance_transform_edt(canopy) * fs
    peaks = (dt == ndi.maximum_filter(dt, size=5)) & (dt > 1.0)
    py, pxx = np.nonzero(peaks)
    trees = [(ORTHO_HI[0] + x_ * fs, ORTHO_HI[1] + y_ * fs, float(min(dt[y_, x_] * 1.2 + 0.8, 8.0))) for y_, x_ in zip(py, pxx)]
    for el in osm['elements']:
        if el['type'] == 'node' and el.get('tags', {}).get('natural') == 'tree':
            x, z = loc(el); trees.append((x, z, 3.5))
    bm = Image.new('L', (int(ORTHO_HI[2] / fs),) * 2, 0); bd = ImageDraw.Draw(bm)
    for b in blds: bd.polygon([((x - ORTHO_HI[0]) / fs, (z - ORTHO_HI[1]) / fs) for x, z in b['e']], fill=255)
    bnear = ndi.binary_dilation(np.asarray(bm) > 0, iterations=3)
    # tee shots: no tree on the tee boxes nor in a corridor 9 m either side of the line for the first 90 m (shadows read as crowns there)
    imc, dc = canvas()
    for hd in course_def['holes']:
        P = [hd['tee']] + hd['bends'] + [hd['green']]; left = 90.0; pts = [P[0]]
        for i in range(len(P) - 1):
            seg = math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1])
            if seg >= left: t_ = left / seg; pts.append((P[i][0] + (P[i + 1][0] - P[i][0]) * t_, P[i][1] + (P[i + 1][1] - P[i][1]) * t_)); break
            pts.append(P[i + 1]); left -= seg
        dc.line([to_px(q) for q in pts], fill=255, width=18)
        for tp_ in hd['tees'].values():
            dc.line([to_px(tp_), to_px(hd['tee'])], fill=255, width=18); q = to_px(tp_); dc.ellipse([q[0] - 12, q[1] - 12, q[0] + 12, q[1] + 12], fill=255)
    corr = np.asarray(imc) > 0
    trees.sort(key=lambda t: -t[2]); taken = set(); keep = []
    golf_core = golf   # golf-course mask over the core (1 m)
    for gx_, gz_, r in trees:
        incore = CORE[0] <= gx_ < CORE[0] + S and CORE[1] <= gz_ < CORE[1] + S
        if not incore: continue                      # beyond the core the photo carries the woods
        ingolf = golf_core[int(gz_ - CORE[1]), int(gx_ - CORE[0])]
        cell = 3.0 if ingolf else 4.5
        k = (int(gx_ // cell), int(gz_ // cell), cell)
        if k in taken: continue
        bi, bj = int((gz_ - ORTHO_HI[1]) / fs), int((gx_ - ORTHO_HI[0]) / fs)
        if 0 <= bi < bnear.shape[0] and 0 <= bj < bnear.shape[1] and bnear[bi, bj]: continue
        if incore:
            ii, jj = int(gz_ - CORE[1]), int(gx_ - CORE[0]); c = cls[ii, jj]
            if c in (4, 5, 6, 7, 8) or c >= 20: continue
            if corr[ii, jj]: continue
            if c == 3 and r < 3.0: continue
        for dx in (-1, 0, 1):
            for dz in (-1, 0, 1): taken.add((k[0] + dx, k[1] + dz, cell))
        keep.append((gx_, gz_, r))
    MAXT = 70000
    if len(keep) > MAXT:   # keep every tree on the courses and the biggest crowns elsewhere
        ing = [t for t in keep if golf_core[int(t[1] - CORE[1]), int(t[0] - CORE[0])]]
        out = sorted([t for t in keep if not golf_core[int(t[1] - CORE[1]), int(t[0] - CORE[0])]], key=lambda t: -t[2])
        keep = ing + out[:max(0, MAXT - len(ing))]
    arr = np.array([(round(x * 4), round(z * 4), round(r * 10)) for x, z, r in keep], dtype='<i2')
    arr.tofile(os.path.join(OUT, 'trees.bin')); REPORT['trees'] = len(keep); log('trees', len(keep))
    build_pools(mos, osm)

    # -------------------------------------------------- course export
    roads = []
    for w, r, k in roads_lines:
        if k in ('service', 'track', 'footway', 'path', 'cycleway') and any(CORE[0] < p[0] < CORE[0] + S and CORE[1] < p[1] < CORE[1] + S for p in r):
            roads.append({'w': w, 'p': [[round(x, 1), round(z, 1)] for x, z in r], 'cart': k in ('service', 'track') or w <= 2.6})
    course = {'world': 'madrid', 'courses': course_def['courses'], 'holes': course_def['holes'], 'ponds': ponds,
              'roads': [r for r in roads if r['cart']], 'datum_m': DATUM,
              'frames': {'core': CORE, 'ortho': ORTHO_W, 'mapPhoto': MAPF, 'tiles': {'n': NT, 'px': 1024},
                         'h_core': REPORT['h_core'], 'h_wide': REPORT['h_wide'], 'h_region': REPORT['h_region']}}
    json.dump(course, open(os.path.join(OUT, 'course.json'), 'w'), separators=(',', ':'), ensure_ascii=False)
    json.dump(REPORT, open(os.path.join(OUT, 'build_report.json'), 'w'), indent=1)
    log(json.dumps(REPORT, indent=1)[:2500])

def build_pools(mos, osm):
    """Swimming pools: OSM leisure=swimming_pool outlines plus pale turquoise patches in the photo."""
    log('pools'); pools = []
    for el in osm['elements']:
        t = el.get('tags', {})
        if t.get('leisure') == 'swimming_pool' and el['type'] == 'way' and el.get('geometry') and t.get('indoor') != 'yes' and t.get('covered') != 'yes':
            r = [loc(q) for q in el['geometry']]
            if closed(r) and abs(ring_area(r)) > 8:
                c = np.mean(np.array(r[:-1]), 0)
                if CORE[0] < c[0] < CORE[0] + CORE[2] and CORE[1] < c[1] < CORE[1] + CORE[2]:
                    pools.append({'x': round(float(c[0]), 2), 'z': round(float(c[1]), 2), 'poly': [[round(x, 2), round(z, 2)] for x, z in simplify(r, 0.2)]})
    S = int(CORE[2])
    a = np.asarray(crop_game(mos, CORE[0], CORE[1], CORE[2], int(S / 0.4))).astype('int16')
    R, G, B = a[..., 0], a[..., 1], a[..., 2]; L = (R + G + B) / 3
    mx = np.maximum(np.maximum(R, G), B); mn = np.minimum(np.minimum(R, G), B)
    m = (L > 125) & (B - R > 22) & (G - R > 12) & (B >= G - 15) & ((mx - mn) > 22)
    m = ndi.binary_opening(m, iterations=1); m = ndi.binary_closing(m, iterations=2)
    lab, n = ndi.label(m)
    have = [Polygon(p['poly']) for p in pools]
    for p in measure.regionprops(lab):
        area = p.area * 0.16
        if area < 9 or area > 1500 or p.axis_minor_length * 0.4 < 1.6: continue
        cy, cx = p.centroid; gx_ = CORE[0] + cx * 0.4; gz_ = CORE[1] + cy * 0.4
        if any(h.distance(Polygon([(gx_ - 1, gz_ - 1), (gx_ + 1, gz_ - 1), (gx_ + 1, gz_ + 1)])) < 2 for h in have): continue
        if area <= 200:
            ang = -p.orientation + math.pi / 2
            pools.append({'x': round(gx_, 2), 'z': round(gz_, 2), 'l': round(p.axis_major_length * 0.4 * 0.89, 2), 'w': round(p.axis_minor_length * 0.4 * 0.89, 2), 'a': round(ang, 3)})
        else:
            sub = np.pad(lab[p.slice] == p.label, 1).astype(float)
            c = max(measure.find_contours(sub, 0.5), key=len); c = measure.approximate_polygon(c, 1.5)
            r0, c0 = p.slice[0].start, p.slice[1].start
            ring = [[round(CORE[0] + (c0 + q[1] - 1) * 0.4, 2), round(CORE[1] + (r0 + q[0] - 1) * 0.4, 2)] for q in c[:-1]]
            if len(ring) >= 3: pools.append({'x': round(gx_, 2), 'z': round(gz_, 2), 'poly': ring})
    json.dump(pools, open(os.path.join(OUT, 'pools.json'), 'w'), separators=(',', ':'))
    REPORT['pools'] = len(pools); log('pools', len(pools))

def build_buildings(dem, dgx, dgz, dres):
    """Catastro INSPIRE BuildingPart polygons (with floors above ground) -> buildings.json."""
    log('buildings'); parts = {}
    for f in glob.glob(os.path.join(D, 'raw', 'catastro', 'BuildingPart_*.gml')):
        txt = open(f, encoding='iso-8859-1').read()
        for mm in re.finditer(r'<bu-ext2d:BuildingPart gml:id="([^"]+)">(.*?)</bu-ext2d:BuildingPart>', txt, re.S):
            pid, body = mm.group(1), mm.group(2)
            if pid in parts: continue
            fl = re.search(r'numberOfFloorsAboveGround>(\d+)<', body); fl = int(fl.group(1)) if fl else 1
            if fl < 1: continue
            def pl(sv):
                v = [float(x) for x in sv.split()]
                return [[round(v[i] - CX, 2), round(CY - v[i + 1], 2)] for i in range(0, len(v) - 1, 2)]
            ext = re.search(r'<gml:exterior>.*?<gml:posList[^>]*>([^<]+)</gml:posList>', body, re.S)
            ints = re.findall(r'<gml:interior>.*?<gml:posList[^>]*>([^<]+)</gml:posList>', body, re.S)
            if not ext: continue
            ring = simplify(pl(ext.group(1)))
            if len(ring) < 3 or abs(ring_area(ring)) < 4.0: continue
            holes = [hh for hh in (simplify(pl(s)) for s in ints) if len(hh) >= 3 and abs(ring_area(hh)) >= 1.0]
            parts[pid] = {'f': fl, 'ext': ring, 'holes': holes}
    blds = []
    for pid, p in parts.items():
        ring = np.array(p['ext'])
        c = ring.mean(0)
        if not (ORTHO_HI[0] < c[0] < ORTHO_HI[0] + ORTHO_HI[2] and ORTHO_HI[1] < c[1] < ORTHO_HI[1] + ORTHO_HI[2]): continue
        a_ = abs(ring_area(p['ext']))
        if a_ > 25000 or (p['f'] <= 1 and a_ > 9000): continue   # a one-storey 'building' of hectares is a plot (club grounds, racecourse)
        hb = sample(dem, dgx, dgz, dres, ring[:, 0], ring[:, 1], order=1)
        blds.append({'id': pid.split('.')[-1], 'f': p['f'], 'b': round(float(hb.min()), 2), 'e': p['ext'], 'h': p['holes']})
    json.dump(blds, open(os.path.join(OUT, 'buildings.json'), 'w'), separators=(',', ':'))
    REPORT['buildings'] = len(blds); REPORT['building_floors'] = {int(k): int(v) for k, v in zip(*np.unique([b['f'] for b in blds], return_counts=True))}
    log('buildings', len(blds), REPORT['building_floors'])
    return blds

if __name__ == '__main__':
    main()
