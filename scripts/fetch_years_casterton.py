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

def get(url, headers=UA, tries=4):
    for k in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=60) as r:
                return r.read().decode('utf-8', 'replace')
        except Exception as e:
            print('retry', k, url[:90], e); time.sleep(3 + 4 * k)
    return None

Q = '''SELECT ?i ?iLabel ?c ?d ?n WHERE {
  SERVICE wikibase:around { ?i wdt:P625 ?c. bd:serviceParam wikibase:center "Point(%f %f)"^^geo:wktLiteral; wikibase:radius "%s". }
  OPTIONAL { ?i wdt:P1216 ?n } OPTIONAL { ?i wdt:P571 ?d }
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
            m = re.match(r'[+-]?(\d{4})', b['d']['value'])
            if m: it['y'] = int(m.group(1)); it['src'] = 'wikidata'
    print(len(items), 'Wikidata items;', sum(1 for i in items.values() if 'y' in i), 'with a year')
    for it in items.values():
        if 'y' in it or 'nhle' not in it: continue
        page = get('https://historicengland.org.uk/listing/the-list/list-entry/%s' % it['nhle'], headers={'User-Agent': UA['User-Agent']})
        time.sleep(1.0)
        if not page: continue
        text = html.unescape(re.sub(r'<[^>]+>', ' ', page)); text = re.sub(r'\s+', ' ', text)
        i = text.find('Details'); j = text.find('Listing NGR', i)
        det = text[i:j if j > i else i + 3000] if i >= 0 else ''
        det = re.sub(r'Date (first listed|of most recent amendment)[^.]*\.', ' ', det)
        r = century(det)
        if r: it.update(r); it['src'] = 'historicengland'
    out = sorted(items.values(), key=lambda i: i['q'])
    json.dump({'v': 1, 'center': [LON, LAT], 'r_km': R_KM, 'items': out}, open(OUT, 'w'), ensure_ascii=False, indent=0)
    print('written', OUT, len(out), 'items;', sum(1 for i in out if 'y' in i or 'c' in i), 'with a date')

if __name__ == '__main__':
    main()
