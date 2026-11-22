#!/usr/bin/env python3
"""Adds to Casterton's buildings.json what is known of each house, by position (no new geometry):
  lv  floors (OSM building:levels)            g   listed status (OSM listed_status, «Grade II»…; «listed» if only the NHLE is known)
  y   year of construction                    c,q century and part of it (17, «late») when only that is known
  ya  1 if the year is approximate (c. 1700, 1840s)    ys  where the date comes from: osm, wikipedia («Listed buildings in …»), wikidata, he
  nl  the listed building's name, when OSM has none
Dates: OSM start_date, then casterton/data/years.json (scripts/fetch_years_casterton.py, from GitHub Actions). A point is matched to
the building that contains it, or to the nearest one within 10 m; milestones, walls, gates, bridges, tombs and the like never count. Run on its own (python3 casterton/scripts/building_info.py) or from
build_assets_casterton.py after the buildings."""
import json, gzip, os, re, sys
from pyproj import Transformer
from shapely.geometry import Polygon, Point

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
D = os.path.join(ROOT, 'data'); OUT = os.path.join(ROOT, 'game', 'data')
CX, CY = json.load(open(os.path.join(D, 'meta.json')))['centre_bng']
sys.path.insert(0, os.path.join(os.path.dirname(ROOT), 'scripts'))
from fetch_years_casterton import parse_date   # the same reading of «Late 17th century», «c. 1700»…
ll = Transformer.from_crs('EPSG:4326', 'EPSG:27700', always_xy=True)
def loc(lon, lat): e, n = ll.transform(lon, lat); return (e - CX, CY - n)

def add_info(out, els=None):
    if els is None: els = json.load(gzip.open(os.path.join(D, 'osm.json.gz')))['elements']
    polys = []
    for b in out:
        try: g = Polygon(b['e'])
        except Exception: g = None
        if g is not None and not g.is_valid: g = g.buffer(0)
        polys.append(g)
    def match(x, z, maxd=25.0):
        p = Point(x, z); best, bd = None, maxd
        for i, g in enumerate(polys):
            if g is None: continue
            x0, z0, x1, z1 = g.bounds
            if x < x0 - maxd or x > x1 + maxd or z < z0 - maxd or z > z1 + maxd: continue
            if g.contains(p): return i
            d = g.distance(p)
            if d < bd: best, bd = i, d
        return best
    n = {'lv': 0, 'g': 0, 'y': 0, 'n': 0}
    NOT_BLD = re.compile(r'mile ?stone|guide ?(stone|post)|boundary|stone\b|cross\b|sundial|tomb|monument|memorial|headstone|grave|statue|urn\b|gate|piers?\b|wall|railing|bridge|pump|well\b|trough|fountain|lamp|kiosk|telephone|post ?box|letter ?box|cairn|obelisk|steps|mounting block|lych|culvert|weir|sluice|lime ?kiln|kiln', re.I)
    for el in els:
        t = el.get('tags') or {}
        if not t.get('building') or el.get('type') != 'way' or not el.get('geometry'): continue
        if not any(k in t for k in ('building:levels', 'listed_status', 'heritage', 'start_date')): continue
        pts = [loc(q['lon'], q['lat']) for q in el['geometry']]
        if len(pts) < 3: continue
        c = Polygon(pts).centroid; i = match(c.x, c.y, 6.0)
        if i is None: continue
        b = out[i]
        if 'building:levels' in t:
            m = re.match(r'\d+', t['building:levels'])
            if m and 'lv' not in b: b['lv'] = int(m.group()); n['lv'] += 1
        if t.get('listed_status') and 'g' not in b: b['g'] = t['listed_status']; n['g'] += 1
        elif t.get('heritage') in ('1', '2') and 'g' not in b: b['g'] = 'Grade ' + ('I' if t['heritage'] == '1' else 'II'); n['g'] += 1
        m = re.match(r'~?(\d{4})', t.get('start_date', ''))
        if m and 'y' not in b: b['y'] = int(m.group(1)); b['ys'] = 'osm'; n['y'] += 1
    yp = os.path.join(D, 'years.json')
    if os.path.exists(yp):
        # the lists' dates first (they come from the list entry text), then Wikidata's
        for it in sorted(json.load(open(yp)).get('items', []), key=lambda i: 0 if i.get('dt') or i.get('src') == 'wikipedia' else 1):
            if 'nhle' not in it and 'wpn' not in it: continue     # only listed buildings: an item that is a school or a parish is not a building
            if it.get('dt'):                                       # the list's date text, read again here
                d = parse_date(it['dt'])
                for k in ('y', 'c', 'cq', 'a'): it.pop(k, None)
                if d: it.update(d); it['src'] = 'wikipedia'
            nm = it.get('wpn') or it.get('n') or ''
            if NOT_BLD.search(nm): continue
            i = match(*loc(it['lon'], it['lat']), 10.0)
            if i is None: continue
            b = out[i]
            if 'g' not in b:
                gr = (it.get('grade') or '').replace("'", '').strip()
                b['g'] = ('Grade ' + gr) if re.fullmatch(r'I{1,2}\*?', gr) else 'listed'; n['g'] += 1
            if nm and not b.get('n') and 'nl' not in b and not re.match(r'(Q\d+|he\d*)$', nm): b['nl'] = nm; n['n'] += 1
            if 'y' in b or 'c' in b: continue
            if 'y' in it: b['y'] = it['y']; n['y'] += 1
            elif 'c' in it: b['c'] = it['c']; b['q'] = it.get('cq', ''); n['y'] += 1
            else: continue
            if it.get('a'): b['ya'] = 1
            b['ys'] = it.get('src', 'he')
    return n

if __name__ == '__main__':
    p = os.path.join(OUT, 'buildings.json'); out = json.load(open(p))
    for b in out:
        for k in ('lv', 'g', 'y', 'c', 'q', 'ys', 'ya', 'nl'): b.pop(k, None)
    n = add_info(out)
    json.dump(out, open(p, 'w'), separators=(',', ':'), ensure_ascii=False)
    print('buildings', len(out), n)
