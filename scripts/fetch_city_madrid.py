#!/usr/bin/env python3
"""The city around the Madrid golf world: every OpenStreetMap building in the 16 km x 16 km square around the two clubs
(outside the 3.8 km core, whose buildings come from the Catastro), reduced to a compact footprint + height list.
Most Madrid buildings in OSM come from the Catastro import and carry building:levels; towers carry height.
Source: OpenStreetMap contributors (Overpass API), ODbL.

Output: madrid/data/city.bin and madrid/data/city_log.json
city.bin: b'CITY', uint32 count, then per building: uint8 n, uint16 height (dm), uint8 kind, n x (int16 x*2, int16 z*2)
          in game metres (x = east, z = south from meta.json centre). kind: 0 house, 1 block, 2 tower, 3 industrial, 4 church."""
import json, math, os, struct, sys, time, urllib.parse, urllib.request
from pyproj import Transformer
OUT = os.path.join('madrid', 'data'); os.makedirs(OUT, exist_ok=True)
UA = {'User-Agent': 'valdecanas-family-game/1.0 (madrid golf world; +https://github.com/joacoarbona/valdecanas)'}
meta = json.load(open(os.path.join(OUT, 'meta.json'))); CX, CY = meta['centre_utm30']
HALF = 8000; CORE = (-1950.0, -1700.0, 3800.0)
LOG = {'started': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'steps': []}
def log(*a): s = ' '.join(str(x) for x in a); print(s, flush=True); LOG['steps'].append(s)
to_utm = Transformer.from_crs('EPSG:4326', 'EPSG:25830', always_xy=True)
to_ll = Transformer.from_crs('EPSG:25830', 'EPSG:4326', always_xy=True)

def post(url, q, timeout):
    req = urllib.request.Request(url, data=urllib.parse.urlencode({'data': q}).encode(), headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r: return json.loads(r.read())
def overpass(q, timeout=400):
    for k in range(3):
        for url in ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter']:
            try: return post(url, q, timeout)
            except Exception as ex: log('overpass fail', url, repr(ex)[:200]); time.sleep(10 + 10 * k)
    return None

def num(v):
    if v is None: return None
    try: return float(str(v).replace(',', '.').split(';')[0].split()[0].rstrip('m'))
    except Exception: return None

def simplify(P, tol):
    # Douglas-Peucker on a closed ring (first point repeated removed)
    if len(P) < 4: return P
    def dp(pts):
        if len(pts) < 3: return pts
        a, b = pts[0], pts[-1]; dx, dz = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dz) or 1e-9
        best, bi = -1, 0
        for i in range(1, len(pts) - 1):
            d = abs((pts[i][0] - a[0]) * dz - (pts[i][1] - a[1]) * dx) / L
            if d > best: best, bi = d, i
        if best <= tol: return [a, b]
        return dp(pts[:bi + 1])[:-1] + dp(pts[bi:])
    # split at the farthest point from the first so both halves are open chains
    far = max(range(len(P)), key=lambda i: (P[i][0] - P[0][0]) ** 2 + (P[i][1] - P[0][1]) ** 2)
    out = dp(P[:far + 1])[:-1] + dp(P[far:] + [P[0]])[:-1]
    return out if len(out) >= 3 else P

def area(P):
    a = 0.0
    for i in range(len(P)): j = (i + 1) % len(P); a += P[i][0] * P[j][1] - P[j][0] * P[i][1]
    return a / 2

def main():
    lo0, la0 = to_ll.transform(CX - HALF, CY - HALF); lo1, la1 = to_ll.transform(CX + HALF, CY + HALF)
    s, w, n, e = min(la0, la1), min(lo0, lo1), max(la0, la1), max(lo0, lo1)
    NT = 4; seen = set(); out = []; kinds = {}; tall = []; levels_missing = 0
    for ti in range(NT):
        for tj in range(NT):
            bs = s + (n - s) * ti / NT; bn = s + (n - s) * (ti + 1) / NT; bw = w + (e - w) * tj / NT; be = w + (e - w) * (tj + 1) / NT
            q = f'[out:json][timeout:300];(way["building"]({bs},{bw},{bn},{be});relation["building"]["type"="multipolygon"]({bs},{bw},{bn},{be}););out tags geom;'
            js = overpass(q)
            if not js: log('tile failed', ti, tj); continue
            els = js.get('elements', []); log('tile', ti, tj, 'elements', len(els))
            for el in els:
                key = (el['type'], el['id'])
                if key in seen: continue
                seen.add(key); t = el.get('tags', {})
                if t.get('building') in ('no', 'roof', 'ruins', 'construction', 'collapsed', 'demolished') or t.get('location') == 'underground': continue
                rings = []
                if el['type'] == 'way' and el.get('geometry'): rings = [el['geometry']]
                elif el['type'] == 'relation':
                    rings = [m['geometry'] for m in el.get('members', []) if m.get('role') == 'outer' and m.get('geometry')]
                if not rings: continue
                best = None
                for g in rings:
                    P = []
                    for p in g:
                        if not p: continue
                        x, y = to_utm.transform(p['lon'], p['lat']); P.append((x - CX, CY - y))
                    if len(P) >= 2 and P[0] == P[-1]: P = P[:-1]
                    if len(P) < 3: continue
                    a = abs(area(P))
                    if not best or a > best[0]: best = (a, P)
                if not best or best[0] < 12: continue
                a, P = best
                cx = sum(p[0] for p in P) / len(P); cz = sum(p[1] for p in P) / len(P)
                if CORE[0] + 25 < cx < CORE[0] + CORE[2] - 25 and CORE[1] + 25 < cz < CORE[1] + CORE[2] - 25: continue
                if abs(cx) > HALF - 5 or abs(cz) > HALF - 5: continue
                h = num(t.get('height')); lv = num(t.get('building:levels'))
                b = t.get('building', 'yes')
                kind = 0
                if b in ('industrial', 'warehouse', 'retail', 'commercial', 'supermarket', 'hangar', 'manufacture', 'garages', 'parking', 'sports_hall', 'stadium'): kind = 3
                if b in ('church', 'cathedral', 'chapel', 'temple', 'mosque'): kind = 4
                if h is None:
                    if lv is not None: h = lv * 3.15 + (1.2 if lv >= 3 else 0.6)
                    else:
                        levels_missing += 1
                        h = {'house': 6.5, 'detached': 6.5, 'semidetached_house': 6.5, 'terrace': 7, 'garage': 3, 'garages': 3, 'shed': 2.6, 'hut': 2.6,
                             'apartments': 16, 'residential': 13, 'church': 16, 'industrial': 8, 'warehouse': 8, 'retail': 7, 'commercial': 12, 'office': 20,
                             'school': 10, 'university': 13, 'hospital': 22, 'hotel': 20, 'sports_hall': 10, 'stadium': 25}.get(b, 7.0)
                h = max(2.5, min(300.0, h))
                if kind == 0: kind = 2 if h >= 60 else 1 if h >= 9 else 0
                tol = 0.6 if h >= 60 else 1.0 if a > 300 else 0.7
                Q = simplify(P, tol)
                while len(Q) > 24: tol *= 1.6; Q = simplify(P, tol)
                if area(Q) < 0: Q = Q[::-1]
                out.append((len(Q), h, kind, Q)); kinds[kind] = kinds.get(kind, 0) + 1
                if h >= 80: tall.append({'n': t.get('name', ''), 'h': round(h, 1), 'c': [round(cx), round(cz)], 'lv': lv})
            time.sleep(2)
    out.sort(key=lambda o: (o[3][0][0] // 500, o[3][0][1] // 500))
    with open(os.path.join(OUT, 'city.bin'), 'wb') as f:
        f.write(b'CITY'); f.write(struct.pack('<I', len(out)))
        for nv, h, kind, Q in out:
            f.write(struct.pack('<BHB', nv, int(round(h * 10)), kind))
            for x, z in Q: f.write(struct.pack('<hh', int(round(x * 2)), int(round(z * 2))))
    tall.sort(key=lambda o: -o['h'])
    LOG.update({'buildings': len(out), 'kinds': kinds, 'no_height_tag': levels_missing, 'tallest': tall[:80], 'bytes': os.path.getsize(os.path.join(OUT, 'city.bin')),
                'finished': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())})
    log('buildings', len(out), 'kinds', kinds, 'no height', levels_missing)
    json.dump(LOG, open(os.path.join(OUT, 'city_log.json'), 'w'), indent=1, ensure_ascii=False)

if __name__ == '__main__': main()
