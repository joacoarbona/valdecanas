#!/usr/bin/env python3
"""Routing of the four 18-hole courses of the Madrid golf world, in game coordinates (metres, x = east, z = south,
origin = madrid/data/meta.json centre).

- Real Club de la Puerta de Hierro (Arriba, Abajo): hole lines, greens and tees from OpenStreetMap. The Abajo holes carry
  their numbers in OSM; the Arriba numbering follows the chain green -> next tee checked against the scorecard lengths.
- Club de Campo Villa de Madrid (Negro, Amarillo): OSM has greens, fairways and some tees but no hole lines. The Negro
  numbering comes from the official Open de España course map fitted onto the OSM greens; the Amarillo numbering from the
  club's hole drawings and descriptions (creeks, doglegs, out of bounds) and the chain of greens and tees. Each hole's line
  follows its fairway's centreline; the tees sit at the scorecard distance from the green along that line.

Scorecards: rcphierro / hole19 / EGA St Andrews Trophy 2025 brochure (Arriba white), ccvm.es (Negro, Amarillo).
Output: madrid/scripts/course_def.json"""
import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw
from skimage.morphology import skeletonize
from pyproj import Transformer

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D = os.path.join(ROOT, 'madrid', 'data')
meta = json.load(open(os.path.join(D, 'meta.json'))); CX, CY = meta['centre_utm30']
osm = json.load(open(os.path.join(D, 'osm.json')))
tr = Transformer.from_crs('EPSG:4326', 'EPSG:25830', always_xy=True)
def loc(g): e, n = tr.transform(g['lon'], g['lat']); return (e - CX, CY - n)

# ------------------------------------------------------------------ scorecards
CARDS = {
 'arriba': dict(name='Campo de Arriba', short='Arriba', club='Real Club de la Puerta de Hierro', color='#8a2a2a',
   par=[3,5,4,4,5,3,4,4,4,4,3,4,4,4,5,4,3,5], hcp=[13,3,7,11,9,15,5,17,1,6,10,4,8,2,16,18,14,12],
   tees={'amarillas':[169,465,367,333,454,154,301,257,364,347,181,399,356,402,437,304,158,508],
         'blancas':[178,521,384,354,468,171,349,275,415,380,197,425,369,416,456,328,166,550]}),
 'abajo': dict(name='Campo de Abajo', short='Abajo', club='Real Club de la Puerta de Hierro', color='#2a5f86',
   par=[3,4,4,4,5,3,4,5,4,4,5,4,3,5,4,4,3,4], hcp=[11,5,7,13,1,15,9,17,3,2,16,4,12,8,18,14,10,6],
   tees={'amarillas':[175,368,309,344,481,134,353,477,381,404,462,376,167,454,313,301,190,314]}),
 'negro': dict(name='Recorrido Negro', short='Negro', club='Club de Campo Villa de Madrid', color='#1d1f22',
   par=[4,4,3,5,4,4,5,4,3,4,3,4,4,5,4,4,3,4], hcp=[7,5,15,3,11,1,13,9,17,8,10,2,6,4,14,16,18,12],
   tees={'amarillas':[417,387,181,453,366,388,487,323,152,360,181,390,398,471,321,326,140,312],
         'blancas':[427,404,189,481,372,404,516,352,162,376,192,407,427,490,343,386,153,331],
         'azules':[379,358,166,427,291,334,434,279,130,323,169,327,350,456,285,305,129,298],
         'rojas':[355,317,139,391,279,324,420,262,125,302,156,323,325,428,279,283,119,292]}),
 'amarillo': dict(name='Recorrido Amarillo', short='Amarillo', club='Club de Campo Villa de Madrid', color='#c79a12',
   par=[4,3,4,5,4,3,4,4,4,3,4,4,4,5,4,3,4,5], hcp=[4,12,2,14,6,16,18,8,10,11,5,17,13,7,1,15,3,9],
   tees={'blancas':[433,182,397,449,347,151,295,367,321,181,375,303,307,527,403,130,417,420],
         'amarillas':[387,165,360,445,330,136,284,366,311,155,344,290,293,483,342,123,401,418],
         'azules':[340,157,329,385,294,115,259,316,302,116,296,260,247,457,305,123,369,390],
         'rojas':[319,142,None,366,276,114,237,315,293,113,287,249,240,446,292,87,358,368]}),
}
# short facts per hole from the clubs' own descriptions (Club de Campo), written as plain advice
INFO = {
 'negro': ['Tee elevado con vistas sobre Madrid. Mejor la calle por la derecha; green de dos alturas.',
   'Llano, con fuera de límites a la derecha en la salida. Green con fuerte caída por delante.',
   'Par 3 sobre el arroyo: exige precisión desde el tee. Green con escalón.',
   'Par 5 que cruza el arroyo cerca del tee. Evita la izquierda en el segundo golpe; green de tres alturas.',
   'Gran vista desde el tee, al otro lado del arroyo. Mejor la derecha en salida y aproximación.',
   'El más difícil del campo: dogleg a la izquierda con un obstáculo que cruza la calle. Green ciego de dos alturas.',
   'Par 5 de recuperación: la derecha en los dos golpes. Green de tres alturas en una ligera hondonada.',
   'Cuidado con los búnkeres de la izquierda en la salida. Green ciego, cuesta arriba.',
   'Par 3 espectacular junto a la casa club; el reto es el green, largo y con escalones.',
   'Ligero dogleg a la derecha: sal por la izquierda.',
   'El par 3 más largo y difícil, sobre el arroyo de la Granjilla. Green de tres alturas.',
   'De los par 4 más duros: izquierda en la salida y derecha en el segundo. Green ondulado de dos alturas.',
   'Gemelo del 1, con ligero dogleg a la derecha: sal por la izquierda. Green escalonado y en bajada.',
   'Par 5: derecha en la salida e izquierda en el segundo. Green con un escalón hacia arriba y otro hacia abajo.',
   'Cuesta arriba con ligero dogleg a la izquierda; derecha en los dos golpes. Green ondulado con una terraza a la izquierda.',
   'Fuera de límites a la izquierda: juega por la derecha. Green en forma de bañera.',
   'Par 3 con el green defendido por tres búnkeres y fuera de límites a la izquierda.',
   'Tres búnkeres a la izquierda en la salida. Green alto, ciego y de tres alturas, a los pies de la casa club.'],
 'amarillo': ['Casi llano, con fuera de límites a la izquierda: el lado seguro es la derecha.',
   'Par 3 llano: mejor la derecha, fuera de límites a la izquierda.',
   'Llano y largo: el drive mejor por la izquierda; búnkeres a ambos lados del green.',
   'Par 5 en dogleg a la izquierda que cruza el arroyo de Antequina; fuera de límites a la izquierda.',
   'Salida por la derecha (fuera de límites a la izquierda). El arroyo rodea el green.',
   'Par 3 sobre el arroyo, con puente. Green muy ondulado de dos alturas.',
   'Todo cuesta arriba hasta un green ciego con meseta delantera y búnker a la derecha.',
   'Ligero dogleg a la izquierda; por la pendiente, mejor salir por la izquierda. Green en alto.',
   'Dogleg a la izquierda y cuesta arriba hasta la casa club. Green ciego de tres alturas.',
   'Par 3 desde un tee elevado: precisión y mejor la derecha. Green llano.',
   'Cuesta arriba tras cruzar el arroyo Pozuelo; drive preciso, un poco a la derecha. Green ciego.',
   'Dogleg a la izquierda: por la pendiente, la mejor línea es el borde izquierdo de la calle.',
   'Cuesta arriba: sal por la derecha. Green ciego.',
   'Par 5 largo junto a la A-6: derecha en los dos golpes, fuera de límites a la izquierda.',
   'El más difícil: obstáculo a la izquierda y el arroyo cruzando por delante del green.',
   'Par 3 corto con el arroyo junto al tee. Green elevado y ciego.',
   'Dogleg muy cerrado a la derecha: drive por la derecha.',
   'Par 5 todo cuesta arriba en dogleg a la izquierda hasta la casa club.'],
}

# ------------------------------------------------------------------ OSM features
els = osm['elements']
greens, tees, fairways = [], [], []
for e in els:
    t = e.get('tags', {}); g = t.get('golf')
    if e['type'] == 'way' and e.get('geometry'):
        P = [loc(q) for q in e['geometry']]
        if g == 'green': greens.append(dict(id=e['id'], P=P))
        elif g == 'tee': tees.append(dict(id=e['id'], P=P))
        elif g == 'fairway': fairways.append(dict(id=e['id'], P=P))
    elif e['type'] == 'node' and g == 'tee':
        tees.append(dict(id=e['id'], P=[loc(e)]))
def cen(P): a = np.array(P, float); return [float(a[:, 0].mean()), float(a[:, 1].mean())]
for L_ in (greens, tees, fairways):
    for f in L_: f['c'] = cen(f['P'])
def pip(x, z, ring):
    c = False; j = len(ring) - 1
    for i in range(len(ring)):
        xi, zi = ring[i]; xj, zj = ring[j]
        if ((zi > z) != (zj > z)) and (x < (xj - xi) * (z - zi) / (zj - zi + 1e-12) + xi): c = not c
        j = i
    return c
def green_at(p, maxd=25):
    best = None
    for g in greens:
        d = 0 if pip(p[0], p[1], g['P']) else math.hypot(g['c'][0] - p[0], g['c'][1] - p[1])
        if d < maxd and (best is None or d < best[0]): best = (d, g)
    return best[1] if best else None

# the Club de Campo green and fairway indices used in the routing are the order of the features inside its course
# polygon (way 1097784618), as listed by the Overpass query; they are resolved here by position, which is stable
CCVM_POLY = [loc(g) for e in els if e['type'] == 'way' and e['id'] == 1097784618 for g in e['geometry']]
cg = [g for g in greens if pip(g['c'][0], g['c'][1], CCVM_POLY)]
cf = [f for f in fairways if pip(f['c'][0], f['c'][1], CCVM_POLY)]

def skeleton_path(P):
    """Centreline of a fairway polygon: the longest path of its 1 m skeleton."""
    a = np.array(P); x0, z0 = a.min(0) - 3; x1, z1 = a.max(0) + 3
    W = int(x1 - x0) + 1; H = int(z1 - z0) + 1
    im = Image.new('L', (W, H), 0); ImageDraw.Draw(im).polygon([(x - x0, z - z0) for x, z in P], fill=1)
    sk = skeletonize(np.asarray(im).astype(bool)); ys, xs = np.nonzero(sk); pts = set(zip(ys.tolist(), xs.tolist()))
    from collections import deque
    def bfs(s):
        dist = {s: 0}; prev = {s: None}; q = deque([s])
        while q:
            u = q.popleft()
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    v = (u[0] + dy, u[1] + dx)
                    if v in pts and v not in dist: dist[v] = dist[u] + 1; prev[v] = u; q.append(v)
        return max(dist, key=dist.get), prev
    s0, _ = bfs(next(iter(pts))); s1, prev = bfs(s0)
    path = []; u = s1
    while u is not None: path.append((u[1] + x0, u[0] + z0)); u = prev[u]
    return simplify_line(path, 2.0)
def simplify_line(P, tol):
    P = np.array(P, float)
    if len(P) < 3: return P.tolist()
    def rdp(a, b):
        if b <= a + 1: return [a]
        p, q = P[a], P[b]; v = q - p; L = math.hypot(*v) or 1e-9; w = P[a + 1:b] - p
        d = np.abs(v[0] * w[:, 1] - v[1] * w[:, 0]) / L; i = int(np.argmax(d))
        if d[i] > tol: return rdp(a, a + 1 + i) + rdp(a + 1 + i, b)
        return [a]
    idx = rdp(0, len(P) - 1) + [len(P) - 1]
    return P[idx].tolist()
def plen(P): return sum(math.hypot(P[i+1][0]-P[i][0], P[i+1][1]-P[i][1]) for i in range(len(P)-1))
def walk_back(path_gt, L):
    """path from the green to the tee side; returns the point at distance L along it (straight on past its end)."""
    s = 0
    for i in range(len(path_gt) - 1):
        a, b = path_gt[i], path_gt[i + 1]; d = math.hypot(b[0] - a[0], b[1] - a[1])
        if s + d >= L: t = (L - s) / d; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], i
        s += d
    a, b = path_gt[-2], path_gt[-1]; d = math.hypot(b[0] - a[0], b[1] - a[1]) or 1
    over = L - s; return [b[0] + (b[0] - a[0]) / d * over, b[1] + (b[1] - a[1]) / d * over], len(path_gt) - 2
def snap_tee(p, maxd=22):
    best = None
    for t in tees:
        d = math.hypot(t['c'][0] - p[0], t['c'][1] - p[1])
        if d < maxd and (best is None or d < best[0]): best = (d, t)
    return list(best[1]['c']) if best else p

# ------------------------------------------------------------------ Puerta de Hierro (OSM hole lines)
ABAJO = {}; geo = {}
for e in els:
    t = e.get('tags', {})
    if e['type'] == 'way' and t.get('golf') == 'hole': geo[e['id']] = (t, [loc(q) for q in e['geometry']])
ARRIBA = [987402448, 987402452, 1335040005, 1335040008, 1334993559, 1334993568, 1335040007, 1335040006, 1335040009,
          1335039997, 1335039995, 1335030459, 1335021844, 1335021834, 1335021807, 1335021819, 1335021804, 1335021787]
RCPH_POLY = [loc(g) for e in els if e['type'] == 'way' and e['id'] == 4378214 for g in e['geometry']]
for hid, (t, P) in geo.items():
    if t.get('ref') and (t.get('par') or hid == 1335021786) and pip(P[0][0], P[0][1], RCPH_POLY) and hid not in ARRIBA:
        ABAJO[int(t['ref'])] = hid
def orient_green_last(P):
    a, b = P[0], P[-1]; ga, gb = green_at(a, 30), green_at(b, 30)
    if ga and not gb: return P[::-1]
    if ga and gb:
        da = min(math.hypot(ga['c'][0]-a[0], ga['c'][1]-a[1]), 99); db = min(math.hypot(gb['c'][0]-b[0], gb['c'][1]-b[1]), 99)
        if da < db: return P[::-1]
    return P

def make_hole(cid, n, path_tg, green, fixed_tee=False):
    """path_tg: polyline from the tee (or from behind it) to the green centre. With fixed_tee its first point is the
    main tee; otherwise every tee sits at its scorecard distance from the green, measured back along the line."""
    C = CARDS[cid]; k = n - 1
    gc = list(green['c'])
    path_tg = simplify_line([list(p) for p in path_tg[:-1]] + [gc], 7.0)
    path_gt = [gc] + [p for p in path_tg[::-1][1:] if math.hypot(p[0]-gc[0], p[1]-gc[1]) > 12]
    main = 'amarillas' if C['tees']['amarillas'][k] else next(c for c, a in C['tees'].items() if a[k])
    Lmain = C['tees'][main][k]
    off = (plen(path_gt) - Lmain) if fixed_tee else 0.0     # shift so that the main tee lands on the given point
    tees_out = {}
    for colour, arr in C['tees'].items():
        L = arr[k]
        if not L: continue
        p, _ = walk_back(path_gt, max(30.0, L + off)); tees_out[colour] = [round(v, 1) for v in snap_tee(p, 14 if fixed_tee else 22)]
    tee = tees_out[main]
    _, i = walk_back(path_gt, max(30.0, Lmain + off))
    bends = [p for p in path_gt[1:i + 1][::-1]]
    bends = [p for p in bends if math.hypot(p[0]-tee[0], p[1]-tee[1]) > 25 and math.hypot(p[0]-gc[0], p[1]-gc[1]) > 25]
    bends = simplify_line([tee] + bends + [gc], 6.0)[1:-1]
    return dict(course=cid, n=n, par=C['par'][k], hcp=C['hcp'][k], L=Lmain, tee=tee, tees=tees_out,
                bends=[[round(x, 1), round(z, 1)] for x, z in bends], green=[round(v, 1) for v in gc],
                green_poly=[[round(x, 2), round(z, 2)] for x, z in green['P'][:-1]], info=INFO.get(cid, [''] * 18)[k])

holes = []
for cid, ids in (('arriba', ARRIBA), ('abajo', [ABAJO[i] for i in range(1, 19)])):
    for n, hid in enumerate(ids, 1):
        P = orient_green_last(geo[hid][1]); g = green_at(P[-1], 30)
        if cid == 'arriba' and n == 1:   # the OSM line of Arriba 1 is a short stub next to the green: aim it from the clubhouse side
            gc = g['c']; d = (-60 - gc[0], -29 - gc[1]); L = math.hypot(*d); P = [[gc[0] + d[0] / L * 175, gc[1] + d[1] / L * 175], gc]
        holes.append(make_hole(cid, n, P, g))

# ------------------------------------------------------------------ Club de Campo (fairway centrelines)
def ccvm_green(i): return cg[i]
FW = {}   # green index -> fairway index (from the analysis of the feature layout)
FW.update({1: 0, 6: 1, 16: 2, 7: 3, 15: 4, 10: 5, 3: 6, 2: 7, 19: 9, 20: 10, 22: 11, 28: 12, 29: 13, 25: 14, 21: 15, 18: 16,
           26: 18, 27: 29, 32: 20, 0: 21, 31: 22, 30: 23, 23: 19, 17: 17, 35: 34, 11: 28, 12: 27, 13: 26, 14: 25, 8: 24,
           9: 31, 5: 30, 4: 8, 34: None, 24: None})
NEGRO = [1, 6, 16, 7, 15, 10, 3, 2, 34, 19, 20, 22, 28, 29, 25, 21, 24, 18]
AMARILLO = [26, 27, 32, 0, 31, 'GY', 30, 23, 17, 35, 11, 12, 13, 14, 8, 9, 5, 4]
# where each hole is played from when its fairway alone does not say it (par 3s and holes that leave from a tee complex)
FROM = {('negro', 3): (-1169, 337), ('negro', 5): (-1501, 504), ('negro', 9): (-1232, 760), ('negro', 10): (-1462, 965), ('negro', 11): (-1648, 1224),
        ('negro', 12): (-1458, 1328), ('negro', 16): (-1150, 1500), ('negro', 17): (-1372, 1414), ('negro', 18): (-1473, 1309),
        ('amarillo', 2): (-975, 1140), ('amarillo', 4): (-760, 1590), ('amarillo', 5): (-566, 1968), ('amarillo', 6): (-745, 1745),
        ('amarillo', 9): (-1395, 1322), ('amarillo', 10): (-1472, 716), ('amarillo', 11): (-1621, 479), ('amarillo', 16): (-1554, 367)}
# a green of the Amarillo (hole 6) that OpenStreetMap does not have yet, traced from the 0.3 m PNOA photo
GY = dict(id='gy', P=[(-835 + 14 * math.cos(a), 1648 + 12 * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 15)[:-1]], c=[-835.0, 1648.0])
for cid, seq in (('negro', NEGRO), ('amarillo', AMARILLO)):
    for n, gi in enumerate(seq, 1):
        g = GY if gi == 'GY' else ccvm_green(gi)
        fi = None if gi == 'GY' else FW.get(gi)
        gc = g['c']
        def centreline(fi):
            path = skeleton_path(cf[fi]['P'])
            if math.hypot(path[0][0]-gc[0], path[0][1]-gc[1]) < math.hypot(path[-1][0]-gc[0], path[-1][1]-gc[1]): path = path[::-1]
            # stop where the centreline comes closest to the green (fairways often wrap past it) and keep clear of the green
            k = min(range(len(path)), key=lambda i: math.hypot(path[i][0]-gc[0], path[i][1]-gc[1]))
            return [p for p in path[:k + 1] if math.hypot(p[0]-gc[0], p[1]-gc[1]) > 22]
        if fi is not None and (cid, n) not in FROM:
            path_tg = centreline(fi) + [gc]; fixed = False
        else:
            f = list(FROM[(cid, n)]); fixed = True
            if fi is not None:   # tee -> the part of the fairway centreline that lies between the tee and the green -> green
                ux, uz = gc[0] - f[0], gc[1] - f[1]; L = math.hypot(ux, uz); ux /= L; uz /= L
                mid = [p for p in centreline(fi) if 30 < (p[0]-f[0])*ux + (p[1]-f[1])*uz < L - 25]
                mid.sort(key=lambda p: (p[0]-f[0])*ux + (p[1]-f[1])*uz)
                path_tg = [f] + mid + [gc]
            else:
                path_tg = [f, gc]
        holes.append(make_hole(cid, n, path_tg, g, fixed))

courses = []; k = 0
for cid in ('arriba', 'abajo', 'negro', 'amarillo'):
    C = CARDS[cid]; idx = [i for i, h in enumerate(holes) if h['course'] == cid]
    courses.append(dict(id=cid, name=C['name'], short=C['short'], club=C['club'], color=C['color'], holes=idx,
                        tee='amarillas', tees=list(C['tees'].keys()),
                        note='Metros desde barras amarillas, de la tarjeta oficial del club.'))
out = dict(courses=courses, holes=holes)
json.dump(out, open(os.path.join(ROOT, 'madrid', 'scripts', 'course_def.json'), 'w'), indent=0, ensure_ascii=False)
for h in holes:
    gc = h['green']; t = h['tee']; d = plen([t] + h['bends'] + [gc])
    print('%-8s %2d par %d L %3d  line %3.0f  tee (%6.0f,%6.0f) green (%6.0f,%6.0f) bends %d tees %s' % (h['course'], h['n'], h['par'], h['L'], d, t[0], t[1], gc[0], gc[1], len(h['bends']), ','.join(h['tees'])))
