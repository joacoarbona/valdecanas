#!/usr/bin/env python3
"""Turn the raw downloads in data/ into compact game assets in game/data/.

Game coordinates: metres, origin at the centre in meta.json, x = east, z = south, y = up,
y = 0 at the reservoir water level found in the elevation model.
"""
import glob, json, os, re, sys
import numpy as np
import rasterio
from rasterio.warp import reproject, Resampling
from rasterio.transform import from_origin
from PIL import Image
from pyproj import Transformer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, 'data'); G = os.path.join(ROOT, 'game', 'data'); os.makedirs(G, exist_ok=True)
meta = json.load(open(os.path.join(D, 'meta.json')))
CX, CY = meta['centre_utm30']
report = {}

def to_game(e, n):
    return (e - CX, CY - n)

def resample(path, half, res):
    """Resample a DEM onto a square EPSG:25830 grid centred on (CX, CY)."""
    n = int(round(2 * half / res))
    dst = np.full((n, n), np.nan, dtype='float32')
    tr = from_origin(CX - half, CY + half, res, res)
    with rasterio.open(path) as src:
        reproject(source=rasterio.band(src, 1), destination=dst, dst_transform=tr, dst_crs='EPSG:25830',
                  resampling=Resampling.bilinear, src_nodata=src.nodata, dst_nodata=np.nan)
    return dst

def encode16(h, offset, path):
    """Pack heights (metres) into an RGB PNG: value = (h + offset) * 100, R = high byte, G = low byte."""
    v = np.clip(np.round((np.nan_to_num(h, nan=-offset) + offset) * 100), 0, 65535).astype('uint32')
    img = np.zeros(h.shape + (3,), dtype='uint8'); img[..., 0] = v >> 8; img[..., 1] = v & 255
    Image.fromarray(img, 'RGB').save(path, optimize=True)

def water_level(h):
    """The reservoir surface is the large flat area at the low end of the elevation histogram."""
    vals = h[np.isfinite(h)]
    lo = np.percentile(vals, 1); hi = np.percentile(vals, 60)
    sel = vals[(vals >= lo) & (vals <= hi)]
    hist, edges = np.histogram(sel, bins=np.arange(np.floor(lo), np.ceil(hi) + 0.25, 0.25))
    i = int(np.argmax(hist)); return float((edges[i] + edges[i + 1]) / 2), int(hist[i])

def main():
    dems = [p for p in glob.glob(os.path.join(D, 'raw', 'dem_*.tif')) if 'region' not in p]
    if not dems: sys.exit('no DEM downloaded')
    dem = sorted(dems)[0]; report['dem'] = os.path.basename(dem)
    with rasterio.open(dem) as src:
        report['dem_res'] = src.res; report['dem_crs'] = str(src.crs); report['dem_shape'] = src.shape
    near = resample(dem, 1300, 2.5)          # island area
    wide = resample(dem, 2600, 10.0)         # banks around the reservoir tail
    wl, cnt = water_level(wide); report['water_level_m'] = wl; report['water_cells'] = cnt
    near -= wl; wide -= wl
    near[near < 0] = np.minimum(near[near < 0], -0.6)   # anything below the surface is lakebed
    encode16(near, 30, os.path.join(G, 'height_near.png')); encode16(wide, 30, os.path.join(G, 'height_wide.png'))
    report['near'] = {'half': 1300, 'res': 2.5, 'n': near.shape[0], 'min': float(np.nanmin(near)), 'max': float(np.nanmax(near))}
    report['wide'] = {'half': 2600, 'res': 10.0, 'n': wide.shape[0], 'min': float(np.nanmin(wide)), 'max': float(np.nanmax(wide))}
    reg = glob.glob(os.path.join(D, 'raw', 'dem_region_*.tif'))
    if reg:
        region = resample(reg[0], 40000, 200.0) - wl
        encode16(region, 30, os.path.join(G, 'height_region.png'))
        report['region'] = {'half': 40000, 'res': 200.0, 'n': region.shape[0], 'max': float(np.nanmax(region))}
    # orthophoto
    ob = meta['ortho_bbox_utm30']
    for size in (4096, 2048):
        p = os.path.join(D, f'ortho_{size}.jpg')
        if os.path.exists(p):
            Image.open(p).save(os.path.join(G, f'ortho_{size}.jpg'), quality=84, optimize=True, progressive=True)
    report['ortho'] = {'x0': ob[0] - CX, 'x1': ob[2] - CX, 'z0': CY - ob[3], 'z1': CY - ob[1]}
    # buildings from the Catastro (INSPIRE BuildingPart has the floors above ground)
    blds = []
    for f in glob.glob(os.path.join(D, 'raw', 'catastro', 'BuildingPart_*.gml')):
        txt = open(f, encoding='utf8', errors='ignore').read()
        for part in re.findall(r'<bu-ext2d:BuildingPart\b.*?</bu-ext2d:BuildingPart>', txt, re.S):
            fl = re.search(r'numberOfFloorsAboveGround>(\d+)<', part); fl = int(fl.group(1)) if fl else 1
            for pl in re.findall(r'<gml:posList[^>]*>([^<]+)</gml:posList>', part):
                nums = [float(v) for v in pl.split()]
                pts = [to_game(nums[i], nums[i + 1]) for i in range(0, len(nums) - 1, 2)]
                if len(pts) >= 3: blds.append({'p': [[round(x, 2), round(z, 2)] for x, z in pts], 'f': fl})
    report['buildings'] = len(blds)
    json.dump(blds, open(os.path.join(G, 'buildings.json'), 'w'), separators=(',', ':'))
    # OpenStreetMap: golf features, paths, piers, buildings
    osm = json.load(open(os.path.join(D, 'osm.json'))) if os.path.exists(os.path.join(D, 'osm.json')) else {'elements': []}
    ll = Transformer.from_crs('EPSG:4326', 'EPSG:25830', always_xy=True)
    feats = []
    for el in osm.get('elements', []):
        t = el.get('tags', {}); geom = el.get('geometry')
        if not geom and el['type'] == 'node': geom = [{'lat': el['lat'], 'lon': el['lon']}]
        if not geom: continue
        keep = any(k in t for k in ('golf', 'highway', 'man_made', 'leisure', 'building', 'natural', 'amenity', 'water', 'sport', 'tourism'))
        if not keep: continue
        pts = []
        for g in geom:
            e, n = ll.transform(g['lon'], g['lat']); x, z = to_game(e, n); pts.append([round(x, 2), round(z, 2)])
        feats.append({'type': el['type'], 'tags': t, 'p': pts})
    report['osm_features'] = len(feats)
    golf = [f for f in feats if 'golf' in f['tags']]
    report['osm_golf'] = {}
    for f in golf: k = f['tags']['golf']; report['osm_golf'][k] = report['osm_golf'].get(k, 0) + 1
    holes = [f for f in golf if f['tags'].get('golf') == 'hole']
    report['osm_holes'] = sorted([(f['tags'].get('ref'), f['tags'].get('par'), len(f['p'])) for f in holes], key=lambda r: int(r[0]) if (r[0] or '').isdigit() else 99)
    json.dump(feats, open(os.path.join(G, 'osm_features.json'), 'w'), separators=(',', ':'))
    json.dump({'water_level_m': wl, 'centre_utm30': [CX, CY], **{k: report[k] for k in ('near', 'wide', 'ortho')}, **({'region': report['region']} if 'region' in report else {})},
              open(os.path.join(G, 'terrain.json'), 'w'), indent=1)
    json.dump(report, open(os.path.join(G, 'process_report.json'), 'w'), indent=1, default=str)
    print(json.dumps(report, indent=1, default=str)[:4000])

if __name__ == '__main__':
    main()
