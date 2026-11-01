#!/usr/bin/env python3
"""Compact course data for the live scorecard (card.json): courses, holes with par, stroke index, tees and their length,
green centre and outline, the frame of the surface grid and of the aerial map, and the UTM centre to place GPS positions."""
import json, math, os, sys
def plen(P): return sum(math.hypot(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1]) for i in range(len(P)-1))
def simplify(P, tol):
    if len(P) < 4: return P
    def dp(pts):
        if len(pts) < 3: return pts
        a, b = pts[0], pts[-1]; dx, dz = b[0]-a[0], b[1]-a[1]; L = math.hypot(dx, dz) or 1e-9; best, bi = -1, 0
        for i in range(1, len(pts)-1):
            d = abs((pts[i][0]-a[0])*dz-(pts[i][1]-a[1])*dx)/L
            if d > best: best, bi = d, i
        if best <= tol: return [a, b]
        return dp(pts[:bi+1])[:-1]+dp(pts[bi:])
    out = dp(P+[P[0]])[:-1]; return out if len(out) >= 3 else P
def build(course_json, meta_json, out, key, title, mapimg, mapframe):
    d = json.load(open(course_json)); m = json.load(open(meta_json)); F = d['frames']
    CS = d.get('courses') or [{'id':'isla','name':title,'short':'','club':'','color':'#255d3c','tee':'','holes':len(d['holes'])}]
    holes = []; courses = []
    for ci, c in enumerate(CS):
        idx = list(c['holes']) if isinstance(c.get('holes'), list) else [i for i, h in enumerate(d['holes']) if (h.get('course') == c['id'] if d.get('courses') else True)]
        courses.append({'id': c['id'], 'name': c['name'], 'short': c.get('short', ''), 'club': c.get('club', ''), 'color': c.get('color', '#255d3c'), 'tee': c.get('tee', ''), 'note': c.get('note', ''), 'holes': idx})
        for i in idx:
            h = d['holes'][i]; P = [h['tee']]+(h.get('bends') or [])+[h['green']]; d0 = plen(P)
            gp = h['green_poly']; gc = [sum(p[0] for p in gp)/len(gp), sum(p[1] for p in gp)/len(gp)]
            tees = {}
            for k, t in (h.get('tees') or {}).items(): tees[k] = [round(t[0], 1), round(t[1], 1), round(h['L']+plen([t]+P[1:])-d0)]
            holes.append({'i': i, 'c': ci, 'n': h['n'], 'par': h['par'], 'hcp': h.get('hcp', 0), 'L': h['L'], 't': [round(h['tee'][0], 1), round(h['tee'][1], 1)], 'tees': tees,
                          'g': [round(gc[0], 1), round(gc[1], 1)], 'gp': [[round(p[0], 1), round(p[1], 1)] for p in simplify([list(p) for p in gp], 0.6)],
                          'P': [[round(p[0], 1), round(p[1], 1)] for p in P], 'info': h.get('info', '')})
    holes.sort(key=lambda h: h['i'])
    out_d = {'key': key, 'title': title, 'utm': m['centre_utm30'], 'core': F['core'], 'map': {'img': mapimg, 'f': mapframe or F.get('mapPhoto') or F['ortho']}, 'courses': courses, 'holes': holes}
    json.dump(out_d, open(out, 'w'), ensure_ascii=False, separators=(',', ':')); print(out, os.path.getsize(out), len(holes), 'holes')
if __name__ == '__main__':
    R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    build(R+'/madrid/game/data/course.json', R+'/madrid/data/meta.json', R+'/madrid/game/data/card.json', 'pm', 'Golf en Madrid', 'ortho_map_2048.jpg', None)
    build(R+'/game/data/course.json', R+'/data/meta.json', R+'/game/data/card.json', 'vg', 'Isla de Valdecañas', 'ortho_map_1024.jpg', None)
