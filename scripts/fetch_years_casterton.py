#!/usr/bin/env python3
"""Years of construction for Casterton's buildings (runs in GitHub Actions: from the cloud sandbox Wikidata and Historic England
can't be reached). Output: casterton/data/years.json = {"v":1, "items":[{q, n, lon, lat, nhle, y | c+q, src}]}
  - Wikidata: every item within 4.5 km of the school with a National Heritage List entry (P1216) or an inception date (P571).
  - Historic England: for listed buildings without P571, the list entry text («House. Late C17, altered C19.» → late, 17th c.;
    «dated 1690» → 1690). Only the Details section, never the listing dates.
"""
import json, re, time, os, urllib.request, urllib.parse, html

UA = {'User-Agent': 'joaco.org family golf game (https://github.com/joacoarbona/valdecanas)', 'Accept': 'application/sparql-results+json'}
LON, LAT, R_KM = -2.575, 54.212, 4.5
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'casterton', 'data', 'years.json')

def get(url, headers=UA, tries=4, timeout=60):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=timeout) as r:
                return r.read().decode('utf-8', 'replace')
        except Exception as e:
            print('retry', k, url[:90], e); time.sleep(3 + 4 * k)
    return None

Q = '''SELECT ?i ?iLabel ?c ?d ?pr ?n WHERE {
  SERVICE wikibase:around { ?i wdt:P625 ?c. bd:serviceParam wikibase:center "Point(%f %f)"^^geo:wktLiteral; wikibase:radius "%s". }
  OPTIONAL { ?i wdt:P1216 ?n } OPTIONAL { ?i p:P571/psv:P571 [ wikibase:timeValue ?d; wikibase:timePrecision ?pr ] }
  FILTER(BOUND(?n) || BOUND(?d))
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }''' % (LON, LAT, R_KM)

def century(text):
    """first «early/mid/late C17» or year in the Details section"""
    m = re.search(r'\b(?:(early|mid|late)[\s-]+)?C(1[0-9])\b', text, re.I)
    y = re.search(r'\b(?:dated|datestone|date stone|built in|built|of|inscribed)\D{0,12}(1[2-8]\d\d)\b', text, re.I)
    if y and (not m or y.start() < m.start() + 400): return {'y': int(y.group(1))}
    if m: return {'c': int(m.group(2)), 'q': (m.group(1) or '').lower()}
    return None

def main():
    raw = get('https://query.wikidata.org/sparql?format=json&query=' + urllib.parse.quote(Q))
    if raw is None: raise SystemExit('Wikidata no responde')
    rows = json.loads(raw)['results']['bindings'] if raw else []
    items = {}
    for b in rows:
        q = b['i']['value'].rsplit('/', 1)[-1]
        pt = re.match(r'Point\(([-\d.]+) ([-\d.]+)\)', b['c']['value'])
        it = items.setdefault(q, {'q': q, 'n': b.get('iLabel', {}).get('value', ''), 'lon': float(pt.group(1)), 'lat': float(pt.group(2))})
        if 'n' in b: it['nhle'] = b['n']['value']
        if 'd' in b:
            m = re.match(r'[+-]?(\d{4})', b['d']['value']); pr = int(b.get('pr', {}).get('value', 9))
            if m:
                y = int(m.group(1)); it['src'] = 'wikidata'
                if pr >= 9: it['y'] = y
                elif pr == 8: it['y'] = y - y % 10; it['a'] = 1
                elif pr == 7: it['c'] = y // 100 + (0 if y % 100 == 0 else 1)
    print(len(items), 'Wikidata items;', sum(1 for i in items.values() if 'y' in i), 'with a year', flush=True)
    save(items)
    wikipedia(items); save(items)
    t0 = time.time(); fails = 0
    for it in items.values():
        if 'y' in it or 'c' in it or 'nhle' not in it: continue
        if time.time() - t0 > 900 or fails >= 6: print('Historic England: stop (time or failures)'); break
        page = get('https://historicengland.org.uk/listing/the-list/list-entry/%s' % it['nhle'], headers={'User-Agent': UA['User-Agent']}, tries=1, timeout=20)
        time.sleep(0.6)
        if not page: fails += 1; continue
        fails = 0
        text = html.unescape(re.sub(r'<[^>]+>', ' ', page)); text = re.sub(r'\s+', ' ', text)
        i = text.find('Details'); j = text.find('Listing NGR', i)
        det = text[i:j if j > i else i + 3000] if i >= 0 else ''
        det = re.sub(r'Date (first listed|of most recent amendment)[^.]*\.', ' ', det)
        r = century(det)
        if r: it.update(r); it['src'] = 'historicengland'
    save(items)

WP_API = 'https://en.wikipedia.org/w/api.php?format=json&formatversion=2&'
PLACES = ['Casterton, Cumbria', 'Casterton', 'Kirkby Lonsdale', 'Barbon', 'Mansergh', 'Middleton, Cumbria', 'Lupton', 'Hutton Roof, Cumbria',
          'Leck', 'Burrow-with-Burrow', 'Whittington, Lancashire', 'Ireby, Lancashire', 'Tunstall, Lancashire', 'Killington', 'Firbank', 'Old Hutton and Holmescales']

def parse_date(t):
    """«Late 17th century», «c. 1700», «1831–33», «Early to mid 18th century», «Medieval» → {y[, a]} or {c, q}"""
    t = re.sub(r'<[^>]+>|\[\[(?:[^|\]]*\|)?([^\]]*)\]\]|\{\{[^}]*\}\}', r'\1', t or '').strip()
    m = re.search(r'\b(1[0-9]\d\d)(?!\d)', t)
    if m: return {'y': int(m.group(1)), **({'a': 1} if re.search(r'\b(c\.|circa|about|probably|possibly)', t[:m.start() + 1], re.I) or 's' == t[m.end():m.end() + 1] else {})}
    m = re.search(r'(?:(early|mid|late)\W+)?(?:(?:early|mid|late)\W+)?(1[0-9])(?:st|nd|rd|th)\s+century', t, re.I)
    if m: q = re.search(r'(early|mid|late)', t[:m.end()], re.I); return {'c': int(m.group(2)), 'q': q.group(1).lower() if q else ''}
    return None

def wikipedia(items):
    """the «Listed buildings in …» lists: one {{EH listed building row}} per building, with name, date, grade, coordinates and list entry number"""
    titles = ['Listed buildings in ' + p for p in PLACES]
    raw = get(WP_API + 'action=query&redirects=1&titles=' + urllib.parse.quote('|'.join(titles)), headers={'User-Agent': UA['User-Agent']})
    pages = [p['title'] for p in json.loads(raw)['query']['pages'] if 'missing' not in p] if raw else []
    print('Wikipedia lists:', pages, flush=True)
    byn = {it['nhle']: it for it in items.values() if 'nhle' in it}; n = 0
    for title in pages:
        raw = get(WP_API + 'action=parse&prop=wikitext&page=' + urllib.parse.quote(title), headers={'User-Agent': UA['User-Agent']})
        if not raw: continue
        wt = json.loads(raw)['parse']['wikitext']
        for row in re.split(r'\{\{\s*EH listed building row', wt)[1:]:
            row = row.split('\n}}')[0]; f = {}
            for k, v in re.findall(r'\|\s*([a-z_]+)\s*=\s*([^|\n]*(?:\[\[[^\]]*\]\][^|\n]*)*)', row): f.setdefault(k, v.strip())
            num = re.sub(r'\D', '', f.get('num', '') or f.get('hewiki', '') or f.get('list_entry', ''))
            try: lat, lon = float(f.get('lat', '')), float(f.get('long', f.get('lon', '')))
            except ValueError: continue
            d = parse_date(f.get('date', ''))
            name = re.sub(r'\[\[(?:[^|\]]*\|)?([^\]]*)\]\]', r'\1', f.get('name', '')).strip()
            it = byn.get(num) or items.setdefault('he' + (num or name), {'q': 'he' + (num or name), 'n': name, 'lon': lon, 'lat': lat})
            if num: it['nhle'] = num
            it['lon'], it['lat'] = lon, lat; it['wpn'] = name; it['grade'] = f.get('grade', '').strip()
            if d:
                for k in ('y', 'c', 'q', 'a'): it.pop(k, None)
                it.update(d); it['src'] = 'wikipedia'; n += 1
    print('Wikipedia: rows with a date', n, flush=True)

def save(items):
    out = sorted(items.values(), key=lambda i: i['q'])
    json.dump({'v': 1, 'center': [LON, LAT], 'r_km': R_KM, 'items': out}, open(OUT, 'w'), ensure_ascii=False, indent=0)
    print('written', OUT, len(out), 'items;', sum(1 for i in out if 'y' in i or 'c' in i), 'with a date', flush=True)

if __name__ == '__main__':
    main()
