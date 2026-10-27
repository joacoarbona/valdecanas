#!/usr/bin/env python3
"""Build the game assets for Isla de Valdecañas from the downloaded open data.

Inputs (data/): IGN MDT 5 m + 200 m, PNOA orthophoto tiles (0.4 m), Catastro INSPIRE buildings, OpenStreetMap.
Outputs (game/data/): heights, orthophoto textures, surface map, trees, buildings and the course.

Game frame: metres, x = east, z = south, y = up. Origin = meta.json centre. y = 0 is the reservoir surface
seen in the orthophoto (313.25 m a.s.l., fitted against the photo shoreline).
"""
import glob, json, math, os, re, struct, sys
import numpy as np
from PIL import Image, ImageEnhance
from scipy import ndimage as ndi
import rasterio
from pyproj import Transformer
from skimage import measure

Image.MAX_IMAGE_PIXELS = None
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'data'); OUT = os.path.join(ROOT, 'game', 'data'); os.makedirs(OUT, exist_ok=True)
meta = json.load(open(os.path.join(D, 'meta.json')))
CX, CY = meta['centre_utm30']
WL = 313.25
CORE = (-1360.0, -1050.0, 2048.0)          # x0, z0, size (m) of the detailed area
ORTHO = (-1600.0, -1600.0, 3200.0)          # extent of the downloaded orthophoto
REPORT = {}

def log(*a): print(*a, flush=True)

# ---------------------------------------------------------------- orthophoto mosaic (0.4 m/px)
def mosaic():
    tiles = sorted(glob.glob(os.path.join(D, 'raw', 'ortho', 'o_*.jpg')))
    n = int(round(math.sqrt(len(tiles))))
    im = Image.new('RGB', (2000 * n, 2000 * n))
    for p in tiles:
        j, i = map(int, re.findall(r'o_(\d+)_(\d+)', p)[0])
        im.paste(Image.open(p).convert('RGB'), (i * 2000, j * 2000))
    return im

# ---------------------------------------------------------------- elevation
def dem_smooth():
    p = sorted(glob.glob(os.path.join(D, 'raw', 'dem_Elevacion25830_5*.tif')))[0]
    with rasterio.open(p) as s:
        h0 = s.read(1).astype('float64'); tr = s.transform
    h = h0.copy(); lo = h0 - 0.5; hi = h0 + 0.5        # the MDT is rounded to 1 m: relax inside the rounding band
    for _ in range(80):
        h = ndi.gaussian_filter(h, 1.0, mode='nearest'); np.clip(h, lo, hi, out=h)
    h = ndi.gaussian_filter(h, 0.6, mode='nearest')
    gx0 = tr.c - CX; gz0 = CY - tr.f                     # game coords of the top-left corner
    return (h - WL).astype('float32'), gx0, gz0, tr.a

def sample(grid, gx0, gz0, res, xs, zs, order=3):
    return ndi.map_coordinates(grid, [(zs - gz0) / res - 0.5, (xs - gx0) / res - 0.5], order=order, mode='nearest')

def main():
    log('mosaic'); mos = mosaic(); W0 = mos.size[0]
    log('dem'); dem, dgx, dgz, dres = dem_smooth()
    # photo water at 1 m over the orthophoto extent
    small = np.asarray(mos.resize((3200, 3200), Image.BILINEAR)).astype('float32')
    R, G, B = small[..., 0], small[..., 1], small[..., 2]; L = (R + G + B) / 3
    water = ((B - R) > 8) & (L < 95)
    water = ndi.binary_opening(water, iterations=2); water = ndi.binary_closing(water, iterations=3)
    lab, n = ndi.label(water); sizes = ndi.sum(water, lab, range(1, n + 1))
    big = 1 + int(np.argmax(sizes)); reservoir = lab == big
    # small land specks inside the reservoir that the DEM puts at the old (lower) water level are water too
    land = ~reservoir; lab2, n2 = ndi.label(land); s2 = ndi.sum(land, lab2, range(1, n2 + 1))
    ys, xs = np.mgrid[0:3200, 0:3200]
    hph = sample(dem, dgx, dgz, dres, ORTHO[0] + xs + 0.5, ORTHO[1] + ys + 0.5, order=1)
    mx = ndi.maximum(hph, lab2, range(1, n2 + 1))
    reservoir |= np.isin(lab2, 1 + np.where((s2 < 2500) & (mx < 1.0))[0])
    REPORT['reservoir_share'] = float(reservoir.mean())
    dist_land = ndi.distance_transform_edt(~reservoir)     # metres into land
    dist_water = ndi.distance_transform_edt(reservoir)     # metres into water

    # ------------------------------------------------------------ core heights (4 m) consistent with the photo shoreline
    N = 513; step = CORE[2] / (N - 1)
    zz, xx = np.mgrid[0:N, 0:N]; X = CORE[0] + xx * step; Z = CORE[1] + zz * step
    h = sample(dem, dgx, dgz, dres, X, Z, order=3)
    pi = np.clip((Z - ORTHO[1]).astype(int), 0, 3199); pj = np.clip((X - ORTHO[0]).astype(int), 0, 3199)
    rw = reservoir[pi, pj]; dl = dist_land[pi, pj]; dw = dist_water[pi, pj]
    h = np.where(rw, np.minimum(h, -0.5 - 0.06 * dw), h)
    h = np.where(~rw & (h < 0.35), 0.35 + 0.025 * np.minimum(dl, 40), h)
    # carve the lake and ponds so their water shows above the terrain
    course0 = json.load(open(os.path.join(ROOT, 'scripts', 'course_def.json')))
    from matplotlib.path import Path as MPath
    pts = np.stack([X.ravel(), Z.ravel()], 1)
    for pd in course0['ponds']:
        poly = np.array(pd['poly']); mp = MPath(poly)
        inside = mp.contains_points(pts).reshape(X.shape)
        # distance (m) from the pond for a soft bank
        dd = ndi.distance_transform_edt(~inside) * step
        bank = np.clip(1 - dd / 8.0, 0, 1)
        target = pd['level'] - 1.4
        h = np.where(inside, np.minimum(h, target), h)
        h = np.where(~inside & (bank > 0), np.minimum(h, pd['level'] + 0.15 + (1 - bank) * 3.0 + (h - pd['level']) * (1 - bank)), h)
    write_u16(os.path.join(OUT, 'h_core.bin'), h, 50, 100)
    REPORT['h_core'] = {'n': N, 'step': step, 'x0': CORE[0], 'z0': CORE[1], 'min': float(h.min()), 'max': float(h.max())}
    # wide heights (10 m) for the reservoir banks
    Nw = 521; sw = 5200 / (Nw - 1)
    zz, xx = np.mgrid[0:Nw, 0:Nw]; Xw = -2600 + xx * sw; Zw = -2600 + zz * sw
    hw = sample(dem, dgx, dgz, dres, Xw, Zw, order=1)
    write_u16(os.path.join(OUT, 'h_wide.bin'), hw, 50, 100)
    REPORT['h_wide'] = {'n': Nw, 'step': sw, 'x0': -2600, 'z0': -2600, 'max': float(hw.max())}
    # regional relief (200 m) for the mountains on the horizon
    rp = glob.glob(os.path.join(D, 'raw', 'dem_region_*.tif'))[0]
    with rasterio.open(rp) as s:
        hr = s.read(1).astype('float32') - WL; tr = s.transform
    write_u16(os.path.join(OUT, 'h_region.bin'), hr, 400, 20)
    REPORT['h_region'] = {'n': hr.shape[0], 'step': tr.a, 'x0': tr.c - CX, 'z0': CY - tr.f, 'max': float(hr.max())}

    # ------------------------------------------------------------ textures
    log('textures')
    def grade(im):
        im = ImageEnhance.Color(im).enhance(1.18); im = ImageEnhance.Contrast(im).enhance(1.08)
        return ImageEnhance.Brightness(im).enhance(1.04)
    px = lambda v, o: int(round((v - o) / 0.4))
    core = mos.crop((px(CORE[0], ORTHO[0]), px(CORE[1], ORTHO[1]), px(CORE[0] + CORE[2], ORTHO[0]), px(CORE[1] + CORE[2], ORTHO[1])))
    core = grade(core)
    core.resize((4096, 4096), Image.LANCZOS).save(os.path.join(OUT, 'ortho_core_4096.jpg'), quality=82, optimize=True, progressive=True)
    core.resize((2048, 2048), Image.LANCZOS).save(os.path.join(OUT, 'ortho_core_2048.jpg'), quality=84, optimize=True, progressive=True)
    grade(mos.resize((2048, 2048), Image.LANCZOS)).save(os.path.join(OUT, 'ortho_wide_2048.jpg'), quality=82, optimize=True, progressive=True)
    grade(mos.resize((1024, 1024), Image.LANCZOS)).save(os.path.join(OUT, 'ortho_map_1024.jpg'), quality=85, optimize=True)

    # ------------------------------------------------------------ course definition
    course = json.load(open(os.path.join(ROOT, 'scripts', 'course_def.json')))
    # photo features at 1 m over the core
    cpx0, cpz0 = int(CORE[0] - ORTHO[0]), int(CORE[1] - ORTHO[1]); S = int(CORE[2])
    a = small[cpz0:cpz0 + S, cpx0:cpx0 + S]
    R, G, B = a[..., 0], a[..., 1], a[..., 2]; L = (R + G + B) / 3; sat = a.max(-1) - a.min(-1); gi = G - (R + B) / 2
    m = ndi.uniform_filter(L, 5); sd = np.sqrt(np.maximum(ndi.uniform_filter(L * L, 5) - m * m, 0))
    turf = (gi > -2) & (sd < 7) & (L > 85) & (L < 175)
    turf = ndi.binary_closing(ndi.binary_opening(turf, iterations=1), iterations=2)
    lab, n = ndi.label(turf); sz = ndi.sum(turf, lab, range(1, n + 1)); turf = np.isin(lab, 1 + np.where(sz > 400)[0])
    sand = (L > 165) & (sat < 45) & (sd < 12); sand = ndi.binary_opening(sand, iterations=1)
    res_core = reservoir[cpz0:cpz0 + S, cpx0:cpx0 + S]
    # distance to the hole centrelines
    from PIL import ImageDraw
    lines = Image.new('L', (S, S), 0); dr = ImageDraw.Draw(lines)
    for hdef in course['holes']:
        pts = [(p[0] - CORE[0], p[1] - CORE[1]) for p in [hdef['tee']] + hdef.get('bends', []) + [hdef['green']]]
        dr.line(pts, fill=255, width=1)
    dline = ndi.distance_transform_edt(np.asarray(lines) == 0)
    on_course = dline < 62
    # greens: flood the very smooth turf around each green centre
    a4 = np.asarray(mos.crop((px(CORE[0], ORTHO[0]), px(CORE[1], ORTHO[1]), px(CORE[0] + CORE[2], ORTHO[0]), px(CORE[1] + CORE[2], ORTHO[1])))).astype('float32')
    L4 = a4.mean(-1); gi4 = a4[..., 1] - (a4[..., 0] + a4[..., 2]) / 2
    m4 = ndi.uniform_filter(L4, 7); sd4 = np.sqrt(np.maximum(ndi.uniform_filter(L4 * L4, 7) - m4 * m4, 0))
    smooth4 = (sd4 < 3.4) & (gi4 > 2) & (L4 > 75)
    greens = np.zeros((S, S), bool); green_polys = []
    for hdef in course['holes']:
        gx, gz = hdef['green']; ci, cj = int((gz - CORE[1]) / 0.4), int((gx - CORE[0]) / 0.4)
        win = 70; sl = (slice(ci - win, ci + win), slice(cj - win, cj + win))
        blob = ndi.binary_opening(smooth4[sl], iterations=2)
        lab4, _ = ndi.label(blob)
        yy, xx2 = np.mgrid[-win:win, -win:win]; d2 = np.hypot(yy, xx2)
        ids = lab4[(d2 < 9) & (lab4 > 0)]
        if ids.size:
            k = np.bincount(ids).argmax(); g4 = (lab4 == k) & (d2 < 62)
            g4 = ndi.binary_closing(g4, iterations=3); g4 = ndi.binary_fill_holes(g4)
        else:
            g4 = d2 < 30
        area = g4.sum() * 0.16
        if area < 250 or area > 1500:          # fall back to an ellipse when the photo is ambiguous
            g4 = d2 < 34
        cs = measure.find_contours(g4.astype(float), 0.5)
        c = max(cs, key=len)
        poly = [[round(CORE[0] + (cj - win + p[1]) * 0.4, 2), round(CORE[1] + (ci - win + p[0]) * 0.4, 2)] for p in c[::3]]
        green_polys.append(poly)
        gm = Image.new('L', (S, S), 0); ImageDraw.Draw(gm).polygon([(x - CORE[0], z - CORE[1]) for x, z in poly], fill=255)
        greens |= np.asarray(gm) > 0
        hdef['green_area'] = round(float(area))
    fringe = ndi.binary_dilation(greens, iterations=2) & ~greens
    # tees as small boxes along the hole direction
    tees = np.zeros((S, S), bool); tm = Image.new('L', (S, S), 0); td = ImageDraw.Draw(tm)
    for hdef in course['holes']:
        tx, tz = hdef['tee']; nx_ = (hdef.get('bends') or [hdef['green']])[0]
        ang = math.atan2(nx_[1] - tz, nx_[0] - tx); c, s = math.cos(ang), math.sin(ang)
        box = [(-9, -5), (9, -5), (9, 5), (-9, 5)]
        td.polygon([(tx + bx * c - bz * s - CORE[0], tz + bx * s + bz * c - CORE[1]) for bx, bz in box], fill=255)
        hdef['tee_angle'] = ang
    tees = np.asarray(tm) > 0
    # ponds
    ponds = course['ponds']; pond_id = np.zeros((S, S), np.uint8)
    for k, p in enumerate(ponds):
        pm = Image.new('L', (S, S), 0); ImageDraw.Draw(pm).polygon([(x - CORE[0], z - CORE[1]) for x, z in p['poly']], fill=255)
        pond_id[np.asarray(pm) > 0] = 20 + k
    # roads from OpenStreetMap
    osm = json.load(open(os.path.join(D, 'osm.json')))
    ll = Transformer.from_crs('EPSG:4326', 'EPSG:25830', always_xy=True)
    roads = Image.new('L', (S, S), 0); rd = ImageDraw.Draw(roads)
    widths = {'tertiary': 8, 'unclassified': 7, 'residential': 7, 'service': 5, 'pedestrian': 4, 'track': 4, 'footway': 2, 'path': 2}
    road_lines = []
    for el in osm['elements']:
        t = el.get('tags', {}); g = el.get('geometry')
        if el['type'] != 'way' or not g or 'highway' not in t: continue
        w = widths.get(t['highway'], 3)
        if t.get('golf') == 'cartpath' or t.get('golf_cart') == 'yes': w = 2.4
        pts = []
        for q in g:
            e, nn = ll.transform(q['lon'], q['lat']); pts.append((e - CX - CORE[0], CY - nn - CORE[1]))
        rd.line(pts, fill=255, width=max(1, int(round(w))))
        road_lines.append({'w': w, 'p': [[round(x + CORE[0], 1), round(z + CORE[1], 1)] for x, z in pts], 'cart': t.get('golf') == 'cartpath'})
    roads = np.asarray(roads) > 0
    # surface codes: 0 reservoir, 1 rough, 2 semi-rough, 3 fairway, 4 fringe, 5 green, 6 tee, 7 bunker, 8 road, 9 beach, 10 lawn, 20+ ponds
    cls = np.ones((S, S), np.uint8)
    cls[turf] = 10
    cls[turf & on_course] = 3
    semi = ndi.binary_dilation(turf & on_course, iterations=2) & ~(turf & on_course) & on_course
    cls[semi & ~turf] = 2
    cls[roads] = 8
    bunk = sand & (dline < 70) & ~roads; cls[bunk] = 7
    cls[fringe] = 4; cls[greens] = 5; cls[tees] = 6
    beach = sand & ~on_course & (ndi.distance_transform_edt(~res_core) < 40) & ~roads; cls[beach] = 9
    cls[pond_id > 0] = pond_id[pond_id > 0]
    cls[res_core] = 0
    write_rle(os.path.join(OUT, 'surface_core.rle'), cls)
    REPORT['surface_counts'] = {int(k): int(v) for k, v in zip(*np.unique(cls, return_counts=True))}
    # map image of the course (1 m/px -> 1024 px) for the in-game map
    pal = {0: (134, 182, 198), 1: (166, 170, 102), 2: (143, 176, 90), 3: (116, 181, 74), 4: (102, 182, 73), 5: (79, 174, 69), 6: (98, 173, 70), 7: (239, 226, 185), 8: (154, 151, 144), 9: (239, 227, 196), 10: (140, 184, 92)}
    rgb = np.zeros((S, S, 3), np.uint8)
    for k, c in pal.items(): rgb[cls == k] = c
    rgb[cls >= 20] = (98, 160, 190)
    Image.fromarray(rgb).resize((1024, 1024), Image.NEAREST).save(os.path.join(OUT, 'map_surface_1024.png'), optimize=True)

    # ------------------------------------------------------------ trees from the canopy in the photo
    log('trees')
    full = np.asarray(mos.resize((W0 // 2, W0 // 2), Image.BILINEAR)).astype('float32')   # 0.8 m/px
    Lf = full.mean(-1); BR = full[..., 2] - full[..., 0]
    resf = ndi.zoom(reservoir.astype(np.uint8), 4000 / 3200, order=0).astype(bool)[:4000, :4000]
    loc = ndi.uniform_filter(Lf, 31)
    canopy = (Lf < loc - 14) & (Lf < 115) & (BR < 12) & ~resf
    canopy = ndi.binary_opening(canopy, iterations=1)
    dt = ndi.distance_transform_edt(canopy) * 0.8
    peaks = (dt == ndi.maximum_filter(dt, size=5)) & (dt > 1.0)
    py, pxx = np.nonzero(peaks)
    trees = [(ORTHO[0] + x_ * 0.8, ORTHO[1] + y_ * 0.8, float(min(dt[y_, x_] * 1.2 + 0.8, 7.5))) for y_, x_ in zip(py, pxx)]
    # building footprints (Catastro) to drop shadows mistaken for trees
    bmask = Image.new('L', (S, S), 0); bd = ImageDraw.Draw(bmask)
    for f in glob.glob(os.path.join(D, 'raw', 'catastro', 'BuildingPart_*.gml')):
        txt = open(f, encoding='iso-8859-1').read()
        for mm in re.finditer(r'<gml:exterior>.*?<gml:posList[^>]*>([^<]+)</gml:posList>', txt, re.S):
            v = [float(x) for x in mm.group(1).split()]
            bd.polygon([(v[i] - CX - CORE[0], CY - v[i + 1] - CORE[1]) for i in range(0, len(v) - 1, 2)], fill=255)
    bnear = ndi.binary_dilation(np.asarray(bmask) > 0, iterations=3)
    # thin: keep the largest crowns on a 3 m grid
    trees.sort(key=lambda t: -t[2]); taken = set(); keep = []
    for gx, gz, r in trees:
        k = (int(gx // 3), int(gz // 3))
        if k in taken: continue
        # never on greens, tees, fairway centre or roads inside the core
        if CORE[0] <= gx < CORE[0] + S and CORE[1] <= gz < CORE[1] + S:
            ii, jj = int(gz - CORE[1]), int(gx - CORE[0])
            c = cls[ii, jj]
            if c in (0, 4, 5, 6, 7, 8) or c >= 20 or bnear[ii, jj]: continue
            if c == 3 and r < 2.5: continue
        for dx in (-1, 0, 1):
            for dz in (-1, 0, 1): taken.add((k[0] + dx, k[1] + dz))
        keep.append((gx, gz, r))
    arr = np.array([(round(x * 4), round(z * 4), round(r * 10)) for x, z, r in keep], dtype='<i2')
    arr.tofile(os.path.join(OUT, 'trees.bin'))
    REPORT['trees'] = len(keep)

    # ------------------------------------------------------------ buildings (Catastro building parts)
    build_buildings(dem, dgx, dgz, dres)

    # ------------------------------------------------------------ course export
    for hdef, poly in zip(course['holes'], green_polys):
        hdef['green_poly'] = poly
    course['roads'] = [r for r in road_lines if r['cart']]
    course['water_level_m'] = WL
    course['frames'] = {'core': CORE, 'ortho': ORTHO, 'h_core': REPORT['h_core'], 'h_wide': REPORT['h_wide'], 'h_region': REPORT['h_region']}
    json.dump(course, open(os.path.join(OUT, 'course.json'), 'w'), separators=(',', ':'))
    json.dump(REPORT, open(os.path.join(OUT, 'build_report.json'), 'w'), indent=1)
    log(json.dumps(REPORT, indent=1)[:3000])

def build_buildings(dem, dgx, dgz, dres):
    """Catastro INSPIRE BuildingPart polygons (with floors above ground) -> buildings.json."""
    log('buildings')
    parts = {}
    for f in glob.glob(os.path.join(D, 'raw', 'catastro', 'BuildingPart_*.gml')):
        txt = open(f, encoding='iso-8859-1').read()
        for mm in re.finditer(r'<bu-ext2d:BuildingPart gml:id="([^"]+)">(.*?)</bu-ext2d:BuildingPart>', txt, re.S):
            pid, body = mm.group(1), mm.group(2)
            if pid in parts: continue
            fl = re.search(r'numberOfFloorsAboveGround>(\d+)<', body); fl = int(fl.group(1)) if fl else 1
            def pl(sv):
                v = [float(x) for x in sv.split()]
                return [[round(v[i] - CX, 2), round(CY - v[i + 1], 2)] for i in range(0, len(v) - 1, 2)]
            ext = re.search(r'<gml:exterior>.*?<gml:posList[^>]*>([^<]+)</gml:posList>', body, re.S)
            ints = re.findall(r'<gml:interior>.*?<gml:posList[^>]*>([^<]+)</gml:posList>', body, re.S)
            if not ext: continue
            ring = simplify(pl(ext.group(1)))
            if len(ring) < 3 or abs(ring_area(ring)) < 2.0: continue
            holes = [h for h in (simplify(pl(s)) for s in ints) if len(h) >= 3 and abs(ring_area(h)) >= 1.0]
            parts[pid] = {'f': fl, 'ext': ring, 'holes': holes}
    blds = []
    for pid, p in parts.items():
        ring = np.array(p['ext'])
        hb = sample(dem, dgx, dgz, dres, ring[:, 0], ring[:, 1], order=1)
        blds.append({'id': pid.split('.')[-1], 'f': p['f'], 'b': round(float(hb.min()), 2), 'e': p['ext'], 'h': p['holes']})
    json.dump(blds, open(os.path.join(OUT, 'buildings.json'), 'w'), separators=(',', ':'))
    REPORT['buildings'] = len(blds)
    return blds

def ring_area(r):
    a = 0.0
    for i in range(len(r)):
        x1, z1 = r[i - 1]; x2, z2 = r[i]; a += x1 * z2 - x2 * z1
    return a / 2

def simplify(ring, tol=0.25):
    """Douglas-Peucker for closed rings: drops the repeated closing point and splits at the farthest vertex."""
    if len(ring) > 1 and ring[0] == ring[-1]: ring = ring[:-1]
    if len(ring) < 5: return ring
    pts = np.array(ring, dtype='float64')
    def rdp(a, b):
        if b <= a + 1: return [a]
        p, q = pts[a], pts[b]; v = q - p; L = math.hypot(*v) or 1e-9
        w = pts[a + 1:b] - p
        d = np.abs(v[0] * w[:, 1] - v[1] * w[:, 0]) / L
        i = int(np.argmax(d))
        if d[i] > tol: return rdp(a, a + 1 + i) + rdp(a + 1 + i, b)
        return [a]
    far = int(np.argmax(np.hypot(*(pts - pts[0]).T)))
    pts = np.vstack([pts, pts[:1]])                    # close it again for the second half
    idx = rdp(0, far) + rdp(far, len(pts) - 1)
    return [ring[i % len(ring)] for i in idx]

def write_u16(path, h, offset, scale):
    v = np.clip(np.round((h + offset) * scale), 0, 65535).astype('<u2')
    with open(path, 'wb') as f:
        f.write(struct.pack('<4sIIff', b'VH16', h.shape[1], h.shape[0], float(offset), float(scale))); f.write(v.tobytes())

def write_rle(path, cls):
    flat = cls.ravel(); out = bytearray(struct.pack('<4sII', b'VRLE', cls.shape[1], cls.shape[0]))
    i = 0; nflat = flat.size
    change = np.flatnonzero(np.diff(flat)) + 1
    starts = np.concatenate([[0], change]); ends = np.concatenate([change, [nflat]])
    for s, e in zip(starts, ends):
        v = int(flat[s]); run = int(e - s)
        while run > 0:
            r = min(run, 65535); out += struct.pack('<BH', v, r); run -= r
    open(path, 'wb').write(out)

if __name__ == '__main__':
    if '--only-buildings' in sys.argv:
        build_buildings(*dem_smooth())
        log(json.dumps(REPORT))
    else:
        main()
