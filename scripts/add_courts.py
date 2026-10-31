#!/usr/bin/env python3
"""Tennis and padel courts for both worlds, from OpenStreetMap (leisure=pitch, sport=tennis|padel) inside the core square.
Each court becomes an oriented rectangle: centre, angle of its long side, length, width and kind. OSM tags many padel
courts as tennis, so the kind comes from the size (padel ~20 x 10 m, tennis ~24-37 x 11-19 m). The surface colour
(clay, blue, green) is read from the aerial photo at the centre of the court.
Writes 'courts' into game/data/course.json and madrid/game/data/course.json (run after the asset builders)."""
import json, math, os, sys
from PIL import Image
from pyproj import Transformer
from shapely.geometry import Polygon
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORLDS = [('valdecanas', os.path.join(ROOT, 'data'), os.path.join(ROOT, 'game', 'data')),
          ('madrid', os.path.join(ROOT, 'madrid', 'data'), os.path.join(ROOT, 'madrid', 'game', 'data'))]
tr = Transformer.from_crs('EPSG:4326', 'EPSG:25830', always_xy=True)

def surface_of(img, frame, x, z):
    x0, z0, S = frame; W, H = img.size
    px, pz = (x - x0) / S * W, (z - z0) / S * H
    r = g = b = n = 0
    for dx in range(-3, 4):
        for dz in range(-3, 4):
            c = img.getpixel((int(min(W - 1, max(0, px + dx))), int(min(H - 1, max(0, pz + dz)))))
            r += c[0]; g += c[1]; b += c[2]; n += 1
    r, g, b = r / n, g / n, b / n
    if r > g * 1.12 and r > b * 1.35: return 'clay', [round(r), round(g), round(b)]
    if b > r * 1.05 and b >= g * 0.95: return 'blue', [round(r), round(g), round(b)]
    return 'green', [round(r), round(g), round(b)]

for name, D, G in WORLDS:
    osm = json.load(open(os.path.join(D, 'osm.json'))); meta = json.load(open(os.path.join(D, 'meta.json'))); CX, CY = meta['centre_utm30']
    cpath = os.path.join(G, 'course.json'); course = json.load(open(cpath)); core = course['frames']['core']
    img = Image.open(os.path.join(G, 'ortho_core_4096.jpg')).convert('RGB')
    courts = []
    for el in osm['elements']:
        t = el.get('tags', {})
        sport = t.get('sport', '')
        if t.get('leisure') != 'pitch' or not any(s in sport for s in ('tennis', 'padel', 'paddle')): continue
        g = el.get('geometry')
        if not g or el['type'] != 'way': continue
        P = [tr.transform(p['lon'], p['lat']) for p in g if p]; P = [(x - CX, CY - y) for x, y in P]
        poly = Polygon(P)
        if not poly.is_valid or poly.area < 60: continue
        c = poly.centroid
        if not (core[0] + 5 < c.x < core[0] + core[2] - 5 and core[1] + 5 < c.y < core[1] + core[2] - 5): continue
        R = list(poly.minimum_rotated_rectangle.exterior.coords)[:4]
        e1 = math.hypot(R[1][0] - R[0][0], R[1][1] - R[0][1]); e2 = math.hypot(R[2][0] - R[1][0], R[2][1] - R[1][1])
        if e1 >= e2: L, Wd, a = e1, e2, math.atan2(R[1][1] - R[0][1], R[1][0] - R[0][0])
        else: L, Wd, a = e2, e1, math.atan2(R[2][1] - R[1][1], R[2][0] - R[1][0])
        if L > 45 or Wd < 8: continue
        kind = 'padel' if (L < 23 and Wd < 13.5) else 'tennis'
        if kind == 'padel' and L < 17: continue
        surf, rgb = surface_of(img, core, c.x, c.y)
        courts.append({'k': kind, 'c': [round(c.x, 1), round(c.y, 1)], 'a': round(a, 4), 'L': round(L, 1), 'W': round(Wd, 1), 's': surf, 'rgb': rgb})
    course['courts'] = courts
    json.dump(course, open(cpath, 'w'), separators=(',', ':'))
    print(name, len(courts), 'courts:', sum(1 for c in courts if c['k'] == 'padel'), 'padel,', sum(1 for c in courts if c['k'] == 'tennis'), 'tennis',
          {s: sum(1 for c in courts if c['s'] == s) for s in ('clay', 'blue', 'green')})
