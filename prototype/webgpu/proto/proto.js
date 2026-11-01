// Prototype of the island with the new engine: three.js r187, WebGPU renderer (falls back to WebGL 2), node materials (TSL).
// Same data as the game (relief, aerial photo, trees, buildings, sun); new: physical sky with clouds, sky lighting (IBL),
// long sun shadows, water with real reflections and shallow-water colour, layered tree crowns, ambient occlusion and bloom.
import * as THREE from 'three/webgpu';
import { pass, mrt, output, normalView, packNormalToRGB, unpackRGBToNormal, texture, uniform, Fn, vec2, vec3, float, mix, smoothstep, step,
  positionWorld, cameraPosition, normalize, reflect, max, dot, pow, length, reflector, mx_noise_float, clamp } from 'three/tsl';
import { SkyMesh } from 'three/addons/objects/SkyMesh.js';
import { ao } from 'three/addons/tsl/display/GTAONode.js';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const Q = new URLSearchParams(location.search);
const VW = +Q.get('w') || 1280, VH = +Q.get('h') || 720, PR = +Q.get('pr') || 1;
const log = (...a) => { console.log('[proto]', ...a); };
const t0 = performance.now();

const [meta, TREES, BLDS, RUINS] = await Promise.all(['/data/meta.json', '/data/trees.json', '/data/buildings.json', '/data/ruins.json'].map(u => fetch(u).then(r => r.json())));
log('data', ((performance.now() - t0) / 1000).toFixed(1) + 's', TREES.length, 'trees', BLDS.length, 'buildings');

const renderer = new THREE.WebGPURenderer({ antialias: false, forceWebGL: Q.get('webgl') === '1' });
renderer.setPixelRatio(PR); renderer.setSize(VW, VH);
renderer.toneMapping = Q.get('tm') === 'agx' ? THREE.AgXToneMapping : Q.get('tm') === 'neutral' ? THREE.NeutralToneMapping : THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = +(Q.get('exp') || 0.8);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);
await renderer.init();
window.BACKEND = renderer.backend.isWebGPUBackend ? 'WebGPU' : 'WebGL2';
log('backend', window.BACKEND);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, VW / VH, 0.5, 250000);
const sunDir = new THREE.Vector3().fromArray(meta.sunDir).normalize();
const uTime = uniform(0);

/* ---- sky, sky light and haze ---- */
function makeSky() {
  const s = new SkyMesh(); s.scale.setScalar(200000);
  s.turbidity.value = +(Q.get('turb') || 7.5); s.rayleigh.value = +(Q.get('ray') || 1.9); s.mieCoefficient.value = +(Q.get('mie') || 0.0055); s.mieDirectionalG.value = 0.86;
  s.sunPosition.value.copy(sunDir);
  if (s.cloudCoverage) { s.cloudCoverage.value = 0.3; s.cloudDensity.value = 0.35; s.cloudScale.value = 0.00022; s.cloudSpeed.value = 0; }
  return s;
}
scene.add(makeSky());
const envScene = new THREE.Scene(); envScene.add(makeSky());
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(envScene).texture; scene.environmentIntensity = +(Q.get('env') || 0.26);
scene.fog = new THREE.FogExp2(new THREE.Color().setRGB(0.70, 0.72, 0.76, THREE.SRGBColorSpace), +(Q.get('fog') || 0.000024));

const sun = new THREE.DirectionalLight(new THREE.Color().setRGB(1.0, 0.76, 0.52, THREE.SRGBColorSpace), +(Q.get('sun') || 7));
const focus = new THREE.Vector3(-1150, 0, 420);
sun.position.copy(focus).addScaledVector(sunDir, 3000); sun.target.position.copy(focus);
sun.castShadow = Q.get('shadow') !== '0'; const SM = +(Q.get('sm') || 4096); sun.shadow.mapSize.set(SM, SM);
Object.assign(sun.shadow.camera, { left: -950, right: 950, top: 950, bottom: -950, near: 100, far: 6500 });
sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -0.0003; sun.shadow.normalBias = +(Q.get('nb') || 0.25);
scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color().setRGB(0.62, 0.74, 0.95, THREE.SRGBColorSpace), new THREE.Color().setRGB(0.36, 0.30, 0.22, THREE.SRGBColorSpace), 0.18));

/* ---- textures: the same aerial photos as the game ---- */
const loader = new THREE.TextureLoader();
const loadTex = u => new Promise((ok, ko) => loader.load(u, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; ok(t); }, undefined, ko));
const [coreTex, wideTex] = await Promise.all([loadTex('/gamedata/ortho_core_4096.jpg'), loadTex('/gamedata/ortho_wide_2048.jpg')]);

/* ---- relief: three nested grids (near 4 m, middle 30 m, far 400 m) ---- */
function gridGeo(G, lowerIn) {
  const n = G.n, pos = new Float32Array(n * n * 3);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = G.x0 + i * G.step, z = G.z0 + j * G.step, k = j * n + i; let y = G.h[k];
    if (lowerIn && x > lowerIn[0] && x < lowerIn[1] && z > lowerIn[2] && z < lowerIn[3]) y -= lowerIn[4];
    pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z;
  }
  const idx = new Uint32Array((n - 1) * (n - 1) * 6); let o = 0;
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) { const a = j * n + i, b = a + 1, c = a + n, d = c + 1; idx[o++] = a; idx[o++] = c; idx[o++] = b; idx[o++] = b; idx[o++] = c; idx[o++] = d; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals(); return g;
}
const C = meta.CORE, O = meta.ORTHO;
function groundMaterial() {
  const m = new THREE.MeshStandardNodeMaterial({ roughness: 0.93, metalness: 0 });
  const wx = positionWorld.x, wz = positionWorld.z;
  const uvC = vec2(wx.sub(C[0]).div(C[2]), float(1).sub(wz.sub(C[1]).div(C[2])));
  const uvW = vec2(wx.sub(O[0]).div(O[2]), float(1).sub(wz.sub(O[1]).div(O[2])));
  const edge = (a, lo, hi, b) => smoothstep(lo, lo.add(b), a).mul(smoothstep(hi, hi.sub(b), a));
  const inC = edge(wx, float(C[0]), float(C[0] + C[2]), 30).mul(edge(wz, float(C[1]), float(C[1] + C[2]), 30));
  const inW = edge(wx, float(O[0]), float(O[0] + O[2]), 60).mul(edge(wz, float(O[1]), float(O[1] + O[2]), 60));
  // outside the photos: dry pasture and scrub, varied with noise
  const n1 = mx_noise_float(positionWorld.xz.mul(0.0021)).mul(0.5).add(0.5), n2 = mx_noise_float(positionWorld.xz.mul(0.017)).mul(0.5).add(0.5);
  const land = mix(vec3(0.27, 0.25, 0.15), vec3(0.42, 0.36, 0.22), n1).mul(n2.mul(0.25).add(0.85));
  const photo = mix(texture(wideTex, uvW).rgb, texture(coreTex, uvC).rgb, inC);
  const pl = dot(photo, vec3(0.299, 0.587, 0.114)); const photoS = mix(vec3(pl, pl, pl), photo, float(+(Q.get('sat') || 1.3)));
  const photoC = pow(photoS, vec3(1.18, 1.18, 1.18)).mul(1.05);
  const base = mix(land, photoC, max(inW, inC));
  // fine detail so the photo does not look soft near the camera
  const det = mx_noise_float(positionWorld.xz.mul(0.7)).mul(0.07).add(mx_noise_float(positionWorld.xz.mul(2.9)).mul(0.04));
  m.colorNode = base.mul(det.add(1.0)).mul(float(+(Q.get('alb') || 0.9)));
  return m;
}
const gmat = groundMaterial();
const N = meta.near, M = meta.mid, F = meta.far;
const nearMesh = new THREE.Mesh(gridGeo(N), gmat); nearMesh.receiveShadow = true; nearMesh.castShadow = Q.get('tcast') === '1';
const midMesh = new THREE.Mesh(gridGeo(M, [N.x0 + 40, N.x0 + N.size - 40, N.z0 + 40, N.z0 + N.size - 40, 3]), gmat); midMesh.receiveShadow = true;
const farMesh = new THREE.Mesh(gridGeo(F, [M.x0 + 400, M.x0 + M.size - 400, M.z0 + 400, M.z0 + M.size - 400, 8]), gmat);
scene.add(nearMesh, midMesh, farMesh);
log('relief', ((performance.now() - t0) / 1000).toFixed(1) + 's');

/* ---- water: real reflections, waves, shallow colour and a line of foam on the shore ---- */
function waterNormalsTex() {
  const S = 256, d = new Uint8Array(S * S * 4); const waves = [];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 28; k++) { const a = rnd() * 6.283, f = 1 + Math.floor(rnd() * 14); waves.push([Math.round(Math.cos(a) * f), Math.round(Math.sin(a) * f), rnd() * 6.283, 1 / (f * 0.6 + 1)]); }
  const hgt = (x, y) => { let s = 0; for (const [kx, ky, p, a] of waves) s += a * Math.sin(6.2832 * (kx * x + ky * y) / S + p); return s; };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = hgt(x + 1, y) - hgt(x - 1, y), dy = hgt(x, y + 1) - hgt(x, y - 1); const v = new THREE.Vector3(-dx * 0.35, -dy * 0.35, 1).normalize(); const o = (y * S + x) * 4;
    d[o] = (v.x * 0.5 + 0.5) * 255; d[o + 1] = (v.y * 0.5 + 0.5) * 255; d[o + 2] = (v.z * 0.5 + 0.5) * 255; d[o + 3] = 255;
  }
  const t = new THREE.DataTexture(d, S, S); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.needsUpdate = true; return t;
}
const wN = texture(waterNormalsTex());
// water depth below each level, from the relief grid (metres, 0..10 in a byte)
function depthTex(level, maskLevel) {
  const n = N.n, d = new Uint8Array(n * n * 4);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const k = j * n + i, h = N.h[k], wl = N.wl[k], o = ((n - 1 - j) * n + i) * 4; const dep = Math.max(0, Math.min(10, level - h));
    d[o] = dep / 10 * 255; d[o + 1] = maskLevel === undefined ? 255 : (Math.abs(wl - maskLevel) < 0.2 && h < maskLevel + 0.6 ? 255 : 0); d[o + 2] = 0; d[o + 3] = 255;
  }
  const t = new THREE.DataTexture(d, n, n); t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; return t;
}
const sunU = uniform(new THREE.Vector3().copy(sunDir)), sunColU = uniform(new THREE.Color().setRGB(1.0, 0.80, 0.58, THREE.SRGBColorSpace));
function makeWater(width, height, level, opts) {
  const mat = new THREE.MeshBasicNodeMaterial(); mat.fog = true;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), mat); mesh.rotation.x = -Math.PI / 2; mesh.position.set(opts.cx, level, opts.cz);
  const dt = texture(opts.depth), duv = vec2(positionWorld.x.sub(N.x0).div(N.size), float(1).sub(positionWorld.z.sub(N.z0).div(N.size)));
  const inside = step(0.0, duv.x).mul(step(duv.x, 1.0)).mul(step(0.0, duv.y)).mul(step(duv.y, 1.0));
  const ds = dt.sample(clamp(duv, 0.0, 1.0));
  const depth = mix(float(10.0), ds.r.mul(10.0), inside);
  if (opts.mask) { mat.alphaTest = 0.5; mat.opacityNode = ds.g.mul(inside); }
  const noiseAt = Fn(([uv]) => {
    const t = uTime;
    const s0 = wN.sample(uv.div(103).add(vec2(t.div(17), t.div(29)))), s1 = wN.sample(uv.div(107).sub(vec2(t.div(-19), t.div(31))));
    const s2 = wN.sample(uv.div(vec2(8907.0, 9803.0)).add(vec2(t.div(101), t.div(97)))), s3 = wN.sample(uv.div(vec2(1091.0, 1027.0)).sub(vec2(t.div(109), t.div(-113))));
    return s0.add(s1).add(s2).add(s3).mul(0.5).sub(1);
  });
  const nz = noiseAt(positionWorld.xz.mul(opts.size));
  const surfaceNormal = normalize(nz.xzy.mul(vec3(1.0, 1.0, 1.0).mul(vec3(opts.rough, 1.0, opts.rough))));
  const toEye = cameraPosition.sub(positionWorld), eye = normalize(toEye);
  const refl = normalize(reflect(sunU.negate(), surfaceNormal));
  const spec = pow(max(0.0, dot(eye, refl)), 200.0).mul(sunColU).mul(1.7);
  const diff = max(dot(sunU, surfaceNormal), 0.0).mul(sunColU).mul(0.5);
  const distortion = surfaceNormal.xz.mul(float(0.001).add(float(1.0).div(length(toEye)))).mul(opts.distort);
  mat.colorNode = Fn(() => {
    const mirror = reflector({ resolutionScale: opts.res || 0.5, bounces: false });
    mirror.uvNode = mirror.uvNode.add(distortion);
    mesh.add(mirror.target);
    const theta = max(dot(eye, surfaceNormal), 0.0);
    const fres = pow(float(1.0).sub(theta), 5.0).mul(0.98).add(0.02);
    const shallow = float(1.0).sub(smoothstep(0.0, opts.shallowDepth, depth));
    const wcol = mix(opts.deep, opts.shallow, shallow);
    const scatter = max(0.0, dot(surfaceNormal, eye)).mul(wcol);
    const body = sunColU.mul(diff).mul(0.25).add(scatter);
    const col = mix(body, mirror.rgb.mul(vec3(0.82, 0.88, 0.94)).add(spec), fres.mul(opts.reflect));
    const foam = smoothstep(0.45, 0.05, depth).mul(mx_noise_float(positionWorld.xz.mul(0.35).add(vec2(uTime.mul(0.05), 0))).mul(0.35).add(0.55)).mul(0.55);
    return mix(col, vec3(0.86, 0.87, 0.84), foam);
  })();
  return mesh;
}
const srgb = (r, g, b) => vec3(...new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace).toArray());
const lake = makeWater(240000, 240000, 0, { cx: -1200, cz: 400, depth: depthTex(0), size: +(Q.get('wsize') || 6.0), rough: 1.0, distort: +(Q.get('wdist') || 2.0), deep: srgb(0.06, 0.24, 0.34), shallow: srgb(0.22, 0.52, 0.52), shallowDepth: 7, reflect: 1.0 });
if (Q.get('water') !== '0') scene.add(lake);
const LAG = 1.8, lag = makeWater(N.size, N.size, LAG, { cx: N.x0 + N.size / 2, cz: N.z0 + N.size / 2, depth: depthTex(LAG, LAG), mask: true, size: 1.6, rough: 1.2, distort: 4, deep: srgb(0.16, 0.48, 0.46), shallow: srgb(0.42, 0.70, 0.62), shallowDepth: 3, reflect: 0.9, res: 0.35 });
if (Q.get('water') !== '0' && Q.get('lag') !== '0') scene.add(lag);
log('water', ((performance.now() - t0) / 1000).toFixed(1) + 's');

/* ---- trees: layered crowns with darker insides, trunks, the game's own positions, sizes and colours ---- */
function seeded(s) { return () => (s = (s * 16807) % 2147483647) / 2147483647; }
function lump(cx, cy, cz, sx, sy, sz, detail, rnd, amp) {
  const g = new THREE.IcosahedronGeometry(1, detail); const p = g.attributes.position; const v = new THREE.Vector3();
  const ph = [rnd() * 9, rnd() * 9, rnd() * 9];
  const nr = g.attributes.normal, w = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + amp * (Math.sin(v.x * 3.1 + ph[0]) * Math.sin(v.y * 2.7 + ph[1]) * Math.sin(v.z * 3.3 + ph[2])); p.setXYZ(i, cx + v.x * sx * k, cy + v.y * sy * k, cz + v.z * sz * k); w.set(v.x / sx, v.y / sy, v.z / sz).normalize(); nr.setXYZ(i, w.x, w.y, w.z); }
  return g;
}
function shadeCrown(g) {
  g.computeBoundingBox(); const b = g.boundingBox, p = g.attributes.position, n = g.attributes.normal, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const y = (p.getY(i) - b.min.y) / (b.max.y - b.min.y), r = Math.hypot(p.getX(i), p.getZ(i)); const up = n.getY(i) * 0.5 + 0.5;
    const k = 0.55 + 0.33 * y + 0.2 * up + 0.12 * Math.min(1, r); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = Math.min(1.08, k); }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
function crown(type, detail) {
  const rnd = seeded(type.length * 977 + detail * 31); const parts = [];
  if (type === 'pine') { parts.push(lump(0, 0.25, 0, 0.62, 0.62, 0.62, detail, rnd, 0.12)); for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283 + rnd() * 0.4; parts.push(lump(Math.cos(a) * 0.55, (rnd() - 0.5) * 0.35, Math.sin(a) * 0.55, 0.46, 0.55, 0.46, detail, rnd, 0.14)); } }
  else if (type === 'oak') { parts.push(lump(0, 0.05, 0, 0.7, 0.7, 0.7, detail, rnd, 0.12)); for (let i = 0; i < 9; i++) { const a = rnd() * 6.283, e = (rnd() - 0.3) * 1.2; parts.push(lump(Math.cos(a) * Math.cos(e) * 0.5, Math.sin(e) * 0.5, Math.sin(a) * Math.cos(e) * 0.5, 0.45, 0.42, 0.45, detail, rnd, 0.16)); } }
  else if (type === 'cypress') { for (let i = 0; i < 5; i++) { const y = -0.8 + i * 0.4, r = 0.95 - i * 0.17; parts.push(lump(0, y, 0, r, 0.42, r, detail, rnd, 0.1)); } }
  else { for (let i = 0; i < 4; i++) { const y = -0.6 + i * 0.4, r = 0.85 - Math.abs(i - 1.3) * 0.18; parts.push(lump((rnd() - 0.5) * 0.15, y, (rnd() - 0.5) * 0.15, r, 0.5, r, detail, rnd, 0.12)); } }
  return shadeCrown(mergeGeometries(parts.map(g => g.toNonIndexed ? (g.index ? g.toNonIndexed() : g) : g)));
}
const TYPE_BY_VC = { 240: 'oak', 91: 'pine', 35: 'cypress', 80: 'poplar' };
const crownMat = new THREE.MeshStandardNodeMaterial({ vertexColors: true, roughness: 0.88, metalness: 0 });
const trunkMat = new THREE.MeshStandardNodeMaterial({ color: new THREE.Color().setRGB(0.36, 0.28, 0.22, THREE.SRGBColorSpace), roughness: 0.95 });
const trunkGeo = new THREE.CylinderGeometry(0.62, 1, 1, 7, 1, true).translate(0, 0.5, 0);
const LODC = new THREE.Vector3(-1180, 0, 560), LODR = 1400;
const groups = {}; for (const t of TREES) { const type = TYPE_BY_VC[t[11]] || 'oak'; const near = Math.hypot(t[0] - LODC.x, t[2] - LODC.z) < LODR; const key = type + (near ? ':n' : ':f'); (groups[key] || (groups[key] = [])).push(t); }
const dm = new THREE.Object3D(), col = new THREE.Color(); let nTree = 0;
for (const key in groups) {
  const [type, lod] = key.split(':'), arr = groups[key];
  const geo = crown(type, lod === 'n' ? 1 : 0);
  const can = new THREE.InstancedMesh(geo, crownMat, arr.length), trk = new THREE.InstancedMesh(trunkGeo, trunkMat, arr.length);
  arr.forEach((t, i) => {
    const [x, cy, z, R, Ry, tb, th, tr, r, g, b] = t;
    dm.position.set(x, cy, z); dm.scale.set(R, Ry, R); dm.rotation.set(0, (x * 13.1 + z * 7.7) % 6.28, 0); dm.updateMatrix(); can.setMatrixAt(i, dm.matrix);
    col.setRGB(r, g, b, THREE.SRGBColorSpace).multiplyScalar(1.12); can.setColorAt(i, col);
    dm.position.set(x, tb, z); dm.scale.set(tr, th, tr); dm.rotation.set(0, 0, 0); dm.updateMatrix(); trk.setMatrixAt(i, dm.matrix);
  });
  can.castShadow = true; can.receiveShadow = true; trk.castShadow = true; trk.receiveShadow = true;
  can.instanceMatrix.needsUpdate = true; can.instanceColor.needsUpdate = true; can.computeBoundingSphere(); trk.computeBoundingSphere();
  if (Q.get('trees') !== '0') scene.add(can, trk); nTree += arr.length;
}
log('trees', nTree, ((performance.now() - t0) / 1000).toFixed(1) + 's');

/* ---- buildings: the game's footprints and heights, with light walls and roofs that catch the low sun ---- */
const BCOL = { villa: [[0.78, 0.75, 0.69], [0.50, 0.33, 0.26]], hotel: [[0.80, 0.72, 0.55], [0.58, 0.28, 0.19]], shed: [[0.80, 0.76, 0.69], [0.47, 0.41, 0.35]], porch: [null, [0.83, 0.72, 0.52]], pergola: [null, [0.24, 0.21, 0.19]] };
const wallPos = { villa: [], hotel: [], shed: [] }, roofPos = { villa: [], hotel: [], shed: [], porch: [], pergola: [] };
for (const b of BLDS) {
  const ring = b.ring, kind = BCOL[b.k] ? b.k : 'villa';
  if (wallPos[kind]) for (let i = 0; i < ring.length; i++) { const a = ring[i], c = ring[(i + 1) % ring.length]; const P = wallPos[kind];
    P.push(a[0], b.base, a[1], c[0], b.base, c[1], c[0], b.top, c[1], a[0], b.base, a[1], c[0], b.top, c[1], a[0], b.top, a[1]); }
  const tris = THREE.ShapeUtils.triangulateShape(ring.map(p => new THREE.Vector2(p[0], p[1])), (b.holes || []).map(h => h.map(p => new THREE.Vector2(p[0], p[1]))));
  const all = ring.concat(...(b.holes || [])); const R = roofPos[kind]; const y = b.top + (kind === 'villa' || kind === 'hotel' ? 0.05 : 0);
  for (const t of tris) for (const k of t) R.push(all[k][0], y, all[k][1]);
  if (kind === 'porch' || kind === 'pergola') for (const t of tris) for (const k of [t[0], t[2], t[1]]) R.push(all[k][0], y - (kind === 'porch' ? 0.5 : 0.12), all[k][1]);
}
const addMesh = (arr, rgb, rough, side) => { if (!arr.length) return; const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); g.computeVertexNormals();
  const m = new THREE.Mesh(g, new THREE.MeshStandardNodeMaterial({ color: new THREE.Color().setRGB(...rgb, THREE.SRGBColorSpace), roughness: rough, side })); m.castShadow = true; m.receiveShadow = true; scene.add(m); };
for (const k in wallPos) addMesh(wallPos[k], BCOL[k][0], 0.85, THREE.DoubleSide);
for (const k in roofPos) addMesh(roofPos[k], BCOL[k][1], 0.9, THREE.DoubleSide);
{ const parts = [[], []]; const bx = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0); const mtx = new THREE.Matrix4(), qq = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  for (const [x, y0, z, sx, sy, sz, a, m] of RUINS) { const g = bx.clone(); mtx.compose(new THREE.Vector3(x, y0, z), qq.setFromAxisAngle(up, -a), new THREE.Vector3(sx, sy, sz)); g.applyMatrix4(mtx); parts[m].push(g); }
  [['#a8a6a0', 0.95], ['#b0775c', 0.9]].forEach(([c, r], i) => { if (!parts[i].length) return; const mm = new THREE.Mesh(mergeGeometries(parts[i]), new THREE.MeshStandardNodeMaterial({ color: new THREE.Color(c), roughness: r })); mm.castShadow = true; mm.receiveShadow = true; scene.add(mm); }); }
log('buildings', ((performance.now() - t0) / 1000).toFixed(1) + 's');

/* ---- image: ambient occlusion, bloom on the glints, AgX tone mapping ---- */
const pipeline = new THREE.RenderPipeline(renderer);
const scenePass = pass(scene, camera);
scenePass.setMRT(mrt({ output, normal: normalView }));
const sceneColor = scenePass.getTextureNode('output'), sceneDepth = scenePass.getTextureNode('depth'), sceneNormal = scenePass.getTextureNode('normal');
const aoPass = ao(sceneDepth, sceneNormal, camera); aoPass.radius.value = +(Q.get('aor') || 2.2); aoPass.thickness.value = 2.0; aoPass.distanceExponent.value = 1.2; aoPass.resolutionScale = 0.6;
const aoTerm = mix(float(1.0), aoPass.getTextureNode().r, 0.75);
const lit = sceneColor.mul(vec3(aoTerm, aoTerm, aoTerm));
const glow = bloom(lit, 0.16, 0.35, 1.05);
pipeline.outputNode = Q.get('noao') === '1' ? sceneColor.add(bloom(sceneColor, 0.22, 0.35, 0.92)) : lit.add(glow);

window.renderPose = async (pose, t) => {
  camera.position.fromArray(pose.p); camera.quaternion.fromArray(pose.q); camera.fov = pose.fov; camera.aspect = VW / VH; camera.near = 0.5; camera.far = 250000; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
  uTime.value = t || 0;
  if (Q.get('post') === '0') renderer.render(scene, camera); else pipeline.render();
  if (Q.get('wait') === '1') { const dev = renderer.backend && renderer.backend.device; if (dev && dev.queue && dev.queue.onSubmittedWorkDone) await dev.queue.onSubmittedWorkDone(); }
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  return true;
};
window.META = meta;
window.READY = true;
log('ready', ((performance.now() - t0) / 1000).toFixed(1) + 's');
