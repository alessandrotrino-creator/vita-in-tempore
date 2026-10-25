/* Vita in Tempore — ambienti naturali del passato, esplorabili in 3D.
   Modulo autonomo: richiede three.js r128 già caricato come window.THREE.
   Espone soltanto window.PaleoEnv = {list, forTime, open}. Tutto è procedurale: niente immagini né file esterni. */
(function () {
'use strict';

/* ---------- utilità ---------- */
const PI = Math.PI, TAU = PI * 2;
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
function rng(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1000003) / 1000003; }; }
function hash2(x, y) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, o = 4) { let s = 0, a = .5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f + i * 17.3, y * f - i * 9.1); f *= 2.03; a *= .5; } return s / (1 - Math.pow(.5, o)); }
const ridge = (x, y, o = 3) => 1 - Math.abs(2 * fbm(x, y, o) - 1);
function mkc(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const SERIF = '"Alegreya", Georgia, serif', SANS = '"Alegreya Sans", "Segoe UI", system-ui, sans-serif';
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const dist = (x, z) => Math.hypot(x, z);
let T3 = null, CUR = null;

/* ---------- stile ---------- */
const CSS = `
.pe-root{position:fixed;inset:0;z-index:100;background:#15191d;color:#eef2f3;font-family:"Alegreya Sans","Segoe UI",system-ui,sans-serif;overflow:hidden;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
.pe-root *{box-sizing:border-box}
.pe-root [hidden]{display:none!important}
.pe-cv{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab;outline:none}
.pe-cv:active{cursor:grabbing}
.pe-vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,transparent 58%,rgba(0,0,0,.4) 100%)}
.pe-top{position:absolute;left:0;right:0;top:0;display:flex;justify-content:space-between;align-items:center;gap:10px 18px;flex-wrap:wrap;padding:calc(10px + env(safe-area-inset-top,0px)) calc(18px + env(safe-area-inset-right,0px)) 10px calc(18px + env(safe-area-inset-left,0px));background:#15191de6;border-bottom:1px solid #ffffff1a}
.pe-head{min-width:0}
.pe-eyebrow{display:flex;align-items:center;gap:7px;font-weight:700;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#e8879a}
.pe-dot{display:inline-block;width:9px;height:9px;border-radius:50%;flex:none}
.pe-top h2{font-family:"Alegreya",Georgia,serif;font-weight:700;font-size:26px;margin:1px 0 0;line-height:1.1}
.pe-sub{font-size:14px;color:#c3ccd0;margin-top:1px}
.pe-tour{display:flex;align-items:center;gap:10px}
.pe-step{font-size:14px;color:#d4dadd;min-width:150px;text-align:center;font-variant-numeric:tabular-nums}
.pe-actions{display:flex;gap:8px}
.pe-root button{border:1px solid #ffffff40;background:#ffffff14;color:#fff;border-radius:999px;padding:8px 15px;font:inherit;font-size:15px;line-height:1.1;cursor:pointer;white-space:nowrap;min-height:38px}
.pe-root button:hover{background:#ffffff2a}
.pe-root button:focus-visible{outline:2px solid #e8879a;outline-offset:2px}
.pe-root .pe-primary{background:#e8879a;border-color:#e8879a;color:#15191d;font-weight:700}
.pe-root .pe-primary:hover{background:#f19aab}
.pe-root .pe-exit{background:#fff;color:#15191d;border-color:#fff;font-weight:700}
.pe-root .pe-exit:hover{background:#e9eef0}
.pe-card{position:absolute;left:calc(18px + env(safe-area-inset-left,0px));bottom:calc(62px + env(safe-area-inset-bottom,0px));width:min(430px,calc(100% - 36px));max-height:calc(100% - 220px);overflow:auto;background:#1f2a30f2;border:1px solid #ffffff22;border-radius:12px;padding:14px 16px;box-shadow:0 10px 30px #0006;-webkit-user-select:text;user-select:text}
.pe-card h3{font-family:"Alegreya",Georgia,serif;font-size:23px;margin:4px 0 6px;line-height:1.15}
.pe-card p{margin:0;font-size:15.5px;line-height:1.42;color:#dde3e6}
.pe-card .pe-meta{font-size:13.5px;color:#aab8be;margin-top:8px}
.pe-card .pe-cred summary{cursor:pointer;text-decoration:underline dotted}
.pe-cardbtns{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.pe-bottom{position:absolute;left:0;right:0;bottom:0;padding:8px calc(18px + env(safe-area-inset-right,0px)) calc(9px + env(safe-area-inset-bottom,0px)) calc(18px + env(safe-area-inset-left,0px));background:#15191de6;border-top:1px solid #ffffff1a;pointer-events:none}
.pe-hint{margin:2px 0;font-size:13.5px;color:#d4dadd}
.pe-touch{display:none}
@media (pointer:coarse){.pe-touch{display:inline}.pe-fine{display:none}}
.pe-loading{position:absolute;inset:0;display:grid;place-items:center;font-family:"Alegreya",Georgia,serif;font-size:22px;color:#c3ccd0;background:#15191d;padding:24px;text-align:center}
@media (max-width:620px){
 .pe-top{gap:6px 10px;padding-top:calc(8px + env(safe-area-inset-top,0px));padding-bottom:8px}
 .pe-head{flex:1 1 55%}
 .pe-eyebrow{font-size:11px}
 .pe-top h2{font-size:20px}
 .pe-sub{font-size:12.5px}
 .pe-tour{order:3;width:100%;justify-content:space-between;gap:6px}
 .pe-step{min-width:0;font-size:13px}
 .pe-root button{padding:7px 12px;font-size:14px;min-height:36px}
 .pe-card{bottom:calc(58px + env(safe-area-inset-bottom,0px));max-height:min(44%,calc(100% - 250px));padding:11px 13px;width:calc(100% - 24px);left:calc(12px + env(safe-area-inset-left,0px))}
 .pe-card h3{font-size:19px}
 .pe-card p{font-size:14.5px}
 .pe-hint{font-size:12px}
}
@media (orientation:landscape) and (max-height:520px){
 .pe-top{flex-wrap:nowrap;gap:10px;padding-top:calc(5px + env(safe-area-inset-top,0px));padding-bottom:5px}
 .pe-head{flex:1 1 auto;min-width:0}
 .pe-eyebrow{font-size:10px;letter-spacing:.1em}
 .pe-top h2{font-size:17px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .pe-sub{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .pe-tour{order:0;width:auto;gap:6px}
 .pe-step{min-width:0;font-size:12px}
 .pe-root button{padding:5px 11px;font-size:13px;min-height:32px}
 .pe-card{bottom:calc(30px + env(safe-area-inset-bottom,0px));width:min(360px,46%);max-height:calc(100% - 100px);padding:9px 12px}
 .pe-card h3{font-size:17px;margin:2px 0 4px}
 .pe-card p{font-size:13px;line-height:1.35}
 .pe-card .pe-meta{font-size:12px}
 .pe-cardbtns{margin-top:8px}
 .pe-bottom{padding-top:3px;padding-bottom:calc(4px + env(safe-area-inset-bottom,0px))}
 .pe-hint{font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
}
@media (min-width:1600px) and (min-height:900px){
 .pe-top{padding:calc(14px + env(safe-area-inset-top,0px)) 30px 14px;gap:14px 26px}
 .pe-eyebrow{font-size:16px}
 .pe-dot{width:12px;height:12px}
 .pe-top h2{font-size:38px}
 .pe-sub{font-size:20px}
 .pe-root button{font-size:21px;padding:12px 24px;min-height:56px}
 .pe-step{font-size:20px;min-width:230px}
 .pe-card{width:600px;left:30px;bottom:86px;padding:22px 26px;max-height:calc(100% - 300px)}
 .pe-card h3{font-size:32px}
 .pe-card p{font-size:21px}
 .pe-card .pe-meta{font-size:18px}
 .pe-hint{font-size:18px}
 .pe-bottom{padding:12px 30px 14px}
 .pe-loading{font-size:32px}
}
@media (prefers-reduced-motion:reduce){.pe-root *{transition:none!important;animation:none!important}}
`;
function injectCSS() { if (document.getElementById('pe-style')) return; const s = document.createElement('style'); s.id = 'pe-style'; s.textContent = CSS; document.head.appendChild(s); }

/* ---------- cartello "Lo sapevi?" disegnato su canvas ---------- */
function wrapLines(g, text, maxW) { const words = String(text).split(/\s+/), out = []; let line = ''; for (const w of words) { const t = line ? line + ' ' + w : w; if (line && g.measureText(t).width > maxW) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }
function fitText(g, text, font, size, min, maxW, maxH, lh) { for (let s = size; s >= min; s -= 2) { g.font = font(s); const L = wrapLines(g, text, maxW); if (L.length * s * lh <= maxH) return {L, s}; } g.font = font(min); return {L: wrapLines(g, text, maxW), s: min}; }
function paintFact(E, i, n, title, text) {
  const [c, g] = mkc(1024, 680);
  const gr = g.createLinearGradient(0, 0, 0, 680); gr.addColorStop(0, '#22303a'); gr.addColorStop(1, '#161d22'); g.fillStyle = gr; g.fillRect(0, 0, 1024, 680);
  g.fillStyle = E.color; g.fillRect(0, 0, 1024, 16);
  g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 3; g.strokeRect(22, 36, 980, 622);
  g.fillStyle = E.color; g.beginPath(); g.arc(100, 116, 38, 0, 7); g.fill();
  g.fillStyle = '#15191d'; g.font = `700 40px ${SANS}`; g.textAlign = 'center'; g.fillText(String(i + 1), 100, 130); g.textAlign = 'left';
  g.fillStyle = '#e8879a'; g.font = `700 26px ${SANS}`; const lab = 'LO SAPEVI?  ·  ' + (i + 1) + ' DI ' + n; let x = 162; for (const ch of lab) { g.fillText(ch, x, 100); x += g.measureText(ch).width + 3; }
  g.fillStyle = '#ffffff'; const T = fitText(g, title, s => `700 ${s}px ${SERIF}`, 54, 34, 800, 130, 1.08);
  T.L.slice(0, 2).forEach((l, k) => g.fillText(l, 162, 156 + k * T.s * 1.08));
  const top = 156 + Math.min(2, T.L.length) * T.s * 1.08 + 26;
  g.fillStyle = '#e4e9ec'; const B = fitText(g, text, s => `400 ${s}px ${SANS}`, 38, 24, 900, 640 - top, 1.32);
  B.L.forEach((l, k) => g.fillText(l, 64, top + B.s + k * B.s * 1.32));
  return c;
}

/* ---------- geometrie di base ---------- */
const V3 = () => new T3.Vector3();
const G = {
  tr(g, x, y, z) { g.translate(x, y, z); return g; },
  rx(g, a) { g.rotateX(a); return g; }, ry(g, a) { g.rotateY(a); return g; }, rz(g, a) { g.rotateZ(a); return g; },
  sc(g, x, y, z) { g.scale(x, y, z); return g; },
  ell(rx, ry, rz, w = 12, h = 8) { const g = new T3.SphereGeometry(1, w, h); g.scale(rx, ry, rz); return g; },
  ball(r, w = 8, h = 6) { return new T3.SphereGeometry(r, w, h); },
  cyl(r1, r2, h, n = 8, open = false) { const g = new T3.CylinderGeometry(r2, r1, h, n, 1, open); g.translate(0, h / 2, 0); return g; },
  cone(r, h, n = 8) { const g = new T3.ConeGeometry(r, h, n); g.translate(0, h / 2, 0); return g; },
  box(w, h, d) { return new T3.BoxGeometry(w, h, d); },
  ico(r, d = 1) { return new T3.IcosahedronGeometry(r, d); },
  // tubo lungo una serie di punti [x,y,z,ry,rz]: corpi, colli, code, zampe, rami
  loft(pts, n = 8, cap = true) {
    const m = pts.length, pos = [], idx = [], P = pts.map(p => new T3.Vector3(p[0], p[1], p[2]));
    const t = V3(), nn = V3(), bb = V3(), UP = new T3.Vector3(0, 1, 0), XA = new T3.Vector3(1, 0, 0);
    for (let i = 0; i < m; i++) {
      if (i === 0) t.subVectors(P[1], P[0]); else if (i === m - 1) t.subVectors(P[m - 1], P[m - 2]); else t.subVectors(P[i + 1], P[i - 1]);
      t.normalize(); nn.crossVectors(t, Math.abs(t.y) < .92 ? UP : XA).normalize(); bb.crossVectors(nn, t).normalize();
      const ry = pts[i][3], rz = pts[i][4] != null ? pts[i][4] : ry;
      for (let j = 0; j < n; j++) { const a = j / n * TAU, c = Math.cos(a), s = Math.sin(a); pos.push(P[i].x + nn.x * c * rz + bb.x * s * ry, P[i].y + nn.y * c * rz + bb.y * s * ry, P[i].z + nn.z * c * rz + bb.z * s * ry); }
    }
    for (let i = 0; i < m - 1; i++) for (let j = 0; j < n; j++) { const a = i * n + j, b = i * n + (j + 1) % n, c = (i + 1) * n + j, d = (i + 1) * n + (j + 1) % n; idx.push(a, c, b, b, c, d); }
    if (cap) { const s0 = pos.length / 3; pos.push(P[0].x, P[0].y, P[0].z); const e0 = s0 + 1; pos.push(P[m - 1].x, P[m - 1].y, P[m - 1].z);
      for (let j = 0; j < n; j++) { const a = j, b = (j + 1) % n; idx.push(s0, a, b); idx.push(e0, (m - 1) * n + b, (m - 1) * n + a); } }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
  },
  // linea che si curva (per costruire lofts): da a a b con curvatura
  arcPts(a, b, bend, n, r0, r1, bendAxis = [0, 1, 0]) {
    const out = []; for (let i = 0; i <= n; i++) { const t = i / n, s = Math.sin(t * PI) * bend; out.push([lerp(a[0], b[0], t) + bendAxis[0] * s, lerp(a[1], b[1], t) + bendAxis[1] * s, lerp(a[2], b[2], t) + bendAxis[2] * s, lerp(r0, r1, t)]); } return out;
  },
  // foglia / pinna piatta lungo x: larghezza w(t), incurvata verso il basso di droop
  leaf(len, w, seg = 5, droop = 0, shape = t => Math.sin(Math.PI * Math.min(1, t * 1.15)) ) {
    const g = new T3.PlaneGeometry(len, w, seg, 1); g.translate(len / 2, 0, 0); const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) { const x = p.getX(k), t = x / len; p.setY(k, p.getY(k) * Math.max(.04, shape(t))); p.setZ(k, -t * t * droop); }
    g.rotateX(-PI / 2); g.computeVertexNormals(); return g;
  },
  // forma piana (in XY) da un contorno
  shape(pts) { const s = new T3.Shape(pts.map(p => new T3.Vector2(p[0], p[1]))); return new T3.ShapeGeometry(s); },
  // unisce i vertici nella stessa posizione: così le normali si mediano e la luce sfuma (niente faccette)
  weld(g) { g = g.index ? g.toNonIndexed() : g; const p = g.attributes.position, map = new Map(), pos = [], idx = [];
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), key = Math.round(x * 1e4) + ',' + Math.round(y * 1e4) + ',' + Math.round(z * 1e4);
      let j = map.get(key); if (j === undefined) { j = pos.length / 3; map.set(key, j); pos.push(x, y, z); } idx.push(j); }
    const w = new T3.BufferGeometry(); w.setAttribute('position', new T3.Float32BufferAttribute(pos, 3)); w.setIndex(idx); return w; },
  organic(g, amp, f = 1.3, seed = 0) { g = G.weld(g); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, x + (vnoise(x * f + 11 + seed, y * f + z) - .5) * amp, y + (vnoise(y * f + 3, z * f + x + seed) - .5) * amp * .6, z + (vnoise(z * f + 7 + seed, x * f + y) - .5) * amp); } g.computeVertexNormals(); return g; }
};
// costruttore: unisce parti con colore per vertice e pesi di animazione (aw)
function mk() { const P = []; const b = {add(g, c, o) { P.push([g, c, o || {}]); return b; }, geo(o) { return merge(P, o || {}); }}; return b; }
function merge(P, o) {
  const C = new T3.Color(), BC = new T3.Color(), list = []; let n = 0;
  for (const [g0, col, po] of P) { let g = g0; if (!g.attributes.normal) g.computeVertexNormals(); if (g.index) g = g.toNonIndexed(); list.push([g, col, po]); n += g.attributes.position.count; }
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), cl = new Float32Array(n * 3), aw = new Float32Array(n * 4);
  let off = 0, ymin = 1e9, ymax = -1e9;
  if (o.ao) for (const [g] of list) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < ymin) ymin = y; if (y > ymax) ymax = y; } }
  for (const [g, col, po] of list) {
    const p = g.attributes.position, nm = g.attributes.normal, m = p.count, fn = typeof col === 'function';
    if (!fn) C.set(col); const base = fn ? null : C.clone(); const belly = po.belly != null ? new T3.Color(po.belly) : null;
    for (let i = 0; i < m; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i), j = off + i; let nx = nm.getX(i), ny = nm.getY(i), nz = nm.getZ(i);
      if (po.upN) { nx *= po.upN; nz *= po.upN; ny = Math.abs(ny) * po.upN + 1; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; }
      pos[j * 3] = x; pos[j * 3 + 1] = y; pos[j * 3 + 2] = z; nor[j * 3] = nx; nor[j * 3 + 1] = ny; nor[j * 3 + 2] = nz;
      if (fn) col(x, y, z, C, ny); else C.copy(base);
      if (belly) C.lerp(BC.copy(belly), smooth(.2, -.65, ny));
      if (o.ao) C.multiplyScalar(lerp(o.ao, 1, smooth(ymin, ymin + (ymax - ymin) * (o.aoH || .5), y)));
      if (po.k) C.multiplyScalar(po.k);
      C.convertSRGBToLinear(); cl[j * 3] = C.r; cl[j * 3 + 1] = C.g; cl[j * 3 + 2] = C.b;
      const wv = po.wave != null ? (typeof po.wave === 'function' ? po.wave(x, y, z) : po.wave) : (o.wave ? o.wave(x, y, z) : 0);
      aw[j * 4] = wv; aw[j * 4 + 1] = po.leg != null ? po.leg + 1 : 0; aw[j * 4 + 2] = po.hip || 0;
      aw[j * 4 + 3] = po.wing ? Math.max(0, Math.abs(z) - (po.wing0 || 0)) * po.wing * (po.wingSign || 1) : (po.lift || 0);
    }
    off += m;
  }
  const g = new T3.BufferGeometry();
  g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('normal', new T3.BufferAttribute(nor, 3));
  g.setAttribute('color', new T3.BufferAttribute(cl, 3)); g.setAttribute('aw', new T3.BufferAttribute(aw, 4));
  g.computeBoundingSphere(); return g;
}

/* ---------- attrezzi per costruire un ambiente ---------- */
const MODELS = {}; // modelli glTF già scaricati (url → Promise), per non riscaricarli riaprendo l'ambiente
function makeKit(scene, renderer, touch) {
  const k = {scene, renderer, touch, up: [], targets: [], grounds: [], time: {value: 0}, shadows: renderer.shadowMap.enabled, r: rng(1234), pending: [], dummy: new T3.Object3D(), follow: []};
  const lin = c => new T3.Color(c).convertSRGBToLinear(); k.lin = lin;
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  k.tex = (c, srgb = true, rep) => { const t = new T3.CanvasTexture(c); if (srgb) t.encoding = T3.sRGBEncoding; t.anisotropy = aniso; if (rep) { t.wrapS = t.wrapT = T3.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };
  k.tint = (v = .12, base) => { const c = base ? new T3.Color(base) : new T3.Color(1, 1, 1); const f = 1 - v + k.r() * v * 1.6; c.r *= f * (1 + (k.r() - .5) * v * .5); c.g *= f * (1 + (k.r() - .5) * v * .5); c.b *= f * (1 + (k.r() - .5) * v * .5); return c; };
  k.dot = (() => { const [c, g] = mkc(64, 64); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.4, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return new T3.CanvasTexture(c); })();
  k.cloudTex = (() => { const [c, g] = mkc(256, 128), r = rng(77); for (let i = 0; i < 30; i++) { const x = 50 + r() * 156, y = 62 + (r() - .4) * 24, s = Math.min(18 + r() * 34, x - 4, 252 - x, y - 4, 124 - y); const gr = g.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 128); } return k.tex(c); })();
  k.detailTex = (() => { const [c, g] = mkc(256, 256), r = rng(5); g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 5000; i++) { const v = 90 + r() * 90 | 0; g.fillStyle = `rgba(${v},${v},${v},${.25 + r() * .4})`; const s = 1 + r() * r() * 7; g.beginPath(); g.arc(r() * 256, r() * 256, s, 0, 7); g.fill(); } return k.tex(c, false, [70, 70]); })();
  // chiazze chiare e scure sul terreno (moltiplicano il colore): danno grana al suolo da vicino
  k.groundTex = (() => { const [c, g] = mkc(256, 256), r = rng(9); g.fillStyle = 'rgb(236,236,236)'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2600; i++) { const v = 175 + r() * 80 | 0, s = 2 + r() * r() * 16; g.fillStyle = `rgba(${v},${v},${v},${.18 + r() * .3})`; g.beginPath(); g.ellipse(r() * 256, r() * 256, s, s * (.5 + r() * .5), r() * 3, 0, 7); g.fill(); }
    for (let i = 0; i < 4000; i++) { const v = 150 + r() * 105 | 0; g.fillStyle = `rgba(${v},${v},${v},.5)`; g.fillRect(r() * 256, r() * 256, 1 + r() * 1.5, 1 + r() * 1.5); }
    return k.tex(c, false, [40, 40]); })();

  /* cielo: gradiente con sole e alone */
  k.skyU = {top: {value: lin('#3f7fd0')}, horizon: {value: lin('#e8eef2')}, bottom: {value: lin('#c8c0b0')}, sunDir: {value: new T3.Vector3(0, .5, -1).normalize()}, sunCol: {value: lin('#fff2d8')}, sunSize: {value: 1}, glow: {value: 1}, haze: {value: 0}};
  k.sky = (o) => {
    const U = k.skyU; U.top.value = lin(o.top); U.horizon.value = lin(o.hor); U.bottom.value = lin(o.bot || o.hor);
    if (o.sun === false) { U.sunSize.value = 0; U.glow.value = o.glow || 0; } else { U.sunSize.value = o.sunSize != null ? o.sunSize : 1; U.glow.value = o.glow != null ? o.glow : 1; }
    U.haze.value = o.haze || 0;
    const m = new T3.Mesh(new T3.SphereGeometry(480, 40, 20), new T3.ShaderMaterial({uniforms: U, side: T3.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 top, horizon, bottom, sunDir, sunCol; uniform float sunSize, glow, haze; varying vec3 vDir;
        void main(){ vec3 d = normalize(vDir); float h = d.y; vec3 col = h > 0. ? mix(horizon, top, pow(clamp(h, 0., 1.), .55 + haze)) : mix(horizon, bottom, clamp(-h * 4., 0., 1.));
          float s = max(dot(d, normalize(sunDir)), 0.); col += sunCol * (smoothstep(.9994, .9998, s) * 6. * sunSize + pow(s, 32.) * .45 * glow + pow(s, 6.) * .1 * glow);
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <encodings_fragment>
        }`}));
    m.renderOrder = -1; m.frustumCulled = false; scene.add(m); k.skyMesh = m;
    const fc = lin(o.fogCol || o.hor); scene.background = fc.clone();
    scene.fog = o.fogExp ? new T3.FogExp2(fc, o.fogExp) : new T3.Fog(fc, o.fog ? o.fog[0] : 60, o.fog ? o.fog[1] : 300);
    if (o.sunDir) U.sunDir.value.set(o.sunDir[0], o.sunDir[1], o.sunDir[2]).normalize();
  };
  k.lights = (o) => {
    scene.add(new T3.HemisphereLight(lin(o.sky), lin(o.ground), (o.hemi || 1) * .75));
    if (o.amb) scene.add(new T3.AmbientLight(lin(o.amb[0]), o.amb[1]));
    if (o.sunI) {
      const d = new T3.DirectionalLight(lin(o.sun || '#ffffff'), o.sunI * 1.5), v = new T3.Vector3(...o.dir).normalize(); d.position.copy(v).multiplyScalar(150);
      if (k.shadows) { d.castShadow = true; const S = touch ? 1024 : 2048; d.shadow.mapSize.set(S, S); const s = d.shadow.camera; s.left = -60; s.right = 60; s.top = 60; s.bottom = -60; s.near = 10; s.far = 420; d.shadow.bias = -.0006; d.shadow.normalBias = .04; }
      scene.add(d); scene.add(d.target); k.sun = d; k.sunV = v;
      if (o.skySun !== false) k.skyU.sunDir.value.copy(v);
      k.skyU.sunCol.value = lin(o.skySunCol || o.sun || '#ffffff');
    }
  };
  k.envLight = (intensity = 1) => {
    const pm = new T3.PMREMGenerator(renderer), sc = new T3.Scene();
    if (k.skyMesh) sc.add(new T3.Mesh(k.skyMesh.geometry, k.skyMesh.material)); else sc.background = scene.background;
    const rt = pm.fromScene(sc, .04); scene.environment = rt.texture; k.envRT = rt; k.envInt = intensity; pm.dispose();
  };
  /* terreno a griglia con colori per vertice */
  k.terrain = (H, colorFn, o = {}) => {
    const size = o.size || 300, seg = o.seg || (touch ? 120 : 180);
    const g = new T3.PlaneGeometry(size, size, seg, seg); g.rotateX(-PI / 2); if (o.cx || o.cz) g.translate(o.cx || 0, 0, o.cz || 0);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, H(p.getX(i), p.getZ(i)));
    g.computeVertexNormals(); const nr = g.attributes.normal, cols = new Float32Array(p.count * 3), c = new T3.Color();
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); colorFn(x, p.getY(i), z, 1 - nr.getY(i), c); c.multiplyScalar(.92 + .16 * vnoise(x * .35, z * .35)); c.convertSRGBToLinear(); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b; }
    g.setAttribute('color', new T3.BufferAttribute(cols, 3));
    const mat = new T3.MeshStandardMaterial(Object.assign({vertexColors: true, roughness: .95, metalness: 0, map: k.groundTex, bumpMap: k.detailTex, bumpScale: .035}, o.mat || {}));
    if (o.caustics) k.caustics(mat, o.caustics);
    const m = new T3.Mesh(g, mat); m.receiveShadow = true; m.userData.ground = true; scene.add(m); k.grounds.push(m); k.ground = m; return m;
  };
  // riflessi di luce sul fondale (acqua sopra)
  k.caustics = (mat, o) => {
    const U = {uT: k.time, uCc: {value: lin(o.col || '#bfefff')}, uCs: {value: o.scale || .35}, uCi: {value: o.i || .35}};
    mat.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
      sh.vertexShader = 'varying vec3 vWP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = `uniform float uT, uCs, uCi; uniform vec3 uCc; varying vec3 vWP;
        float caus(vec2 p, float t){ float c = 0.; vec2 q = p; for (int i = 0; i < 3; i++){ float fi = float(i); q = vec2(q.x + .55*sin(q.y*1.3 + t*.6 + fi*1.7), q.y + .55*cos(q.x*1.1 - t*.5 + fi*2.3)); c += 1. / (1. + 14. * abs(sin(q.x * 1.7) * sin(q.y * 1.7))); } return pow(c / 3., 2.2); }
        ` + sh.fragmentShader.replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb += uCc * caus(vWP.xz * uCs, uT) * uCi * clamp(vNormal.y*0.0 + 1.0, 0., 1.);\n#include <tonemapping_fragment>');
    };
    mat.customProgramCacheKey = () => 'pe-caus';
  };
  k.mat = (o = {}) => new T3.MeshStandardMaterial(Object.assign({vertexColors: true, roughness: .85, metalness: 0}, o));
  /* materiale animato: ondeggiare, nuotare, camminare, volare (pesi nei vertici: aw) */
  k.anim = (A = {}, mo = {}) => {
    const m = new T3.MeshStandardMaterial(Object.assign({vertexColors: true, roughness: .8, metalness: 0}, mo));
    const U = {uT: k.time, uA: {value: new T3.Vector4(A.wave || 0, A.k || 0, A.leg || 0, A.flap || 0)}, uS: {value: A.sp || 1}, uP: {value: A.plant ? 1 : 0}};
    m.onBeforeCompile = sh => { Object.assign(sh.uniforms, U);
      if (m.side === T3.DoubleSide) sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', T3.ShaderChunk.normal_fragment_begin.replace(/normal = normal \* faceDirection;/g, '').replace(/normal \*= faceDirection;/g, ''));
      sh.vertexShader = 'uniform float uT, uS, uP; uniform vec4 uA; attribute vec4 aw; attribute vec2 iph;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
        float ph = uT * uS + iph.x; float mv = iph.y;
        transformed.z += aw.x * sin(ph - position.x * uA.y) * uA.x * (.35 + .65 * mv);
        transformed.x += uP * aw.x * cos(ph * .83 + iph.x * 1.7) * uA.x * .7;
        if (aw.y > 0.) { float lp = ph + aw.y; float dd = max(0., aw.z - position.y); transformed.x += sin(lp) * dd * uA.z * mv; transformed.y += max(0., cos(lp)) * dd * uA.z * .25 * mv; }
        transformed.y += aw.w * sin(ph) * uA.w;`); };
    m.customProgramCacheKey = () => 'pe-anim' + (m.side === T3.DoubleSide ? 'd' : '');
    return m;
  };
  /* tante copie (InstancedMesh): lista di {x,y,z,r,s,sy,rx,rz,c,ph,mv} */
  k.inst = (geo, list, mat, o = {}) => {
    if (!list.length) return null;
    const n = list.length; if (geo.attributes.iph) geo = geo.clone();
    const iph = new Float32Array(n * 2); list.forEach((p, i) => { iph[i * 2] = p.ph != null ? p.ph : k.r() * TAU; iph[i * 2 + 1] = p.mv != null ? p.mv : 1; });
    geo.setAttribute('iph', new T3.InstancedBufferAttribute(iph, 2));
    const im = new T3.InstancedMesh(geo, mat, n), d = k.dummy;
    list.forEach((p, i) => { d.position.set(p.x || 0, (p.y || 0) + (o.dy || 0), p.z || 0); d.rotation.set(p.rx || 0, p.r || 0, p.rz || 0); d.scale.setScalar(p.s || 1); if (p.sy) d.scale.y *= p.sy; if (p.sx) d.scale.x *= p.sx; d.updateMatrix(); im.setMatrixAt(i, d.matrix);
      if (o.tint !== false) im.setColorAt(i, p.c ? lin(p.c) : k.tint(o.v != null ? o.v : .14, o.tint)); });
    im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.castShadow = o.shadow !== false && k.shadows; im.receiveShadow = !!o.receive && k.shadows; im.frustumCulled = false; scene.add(im); return im;
  };
  k.plant = (geo, list, mat, o) => { k.pending.push([geo, list, mat, o || {}]); };
  // toglie le piante dai punti dove si sta in piedi; erba e piantine basse (senza ombra e senza rad) possono arrivare più vicino
  k.flush = keep => { for (const [geo, list0, mat, o] of k.pending) { const low = !o.rad && o.shadow === false ? .35 : 1; const list = list0.filter(p => !keep.some(([x, z, r]) => (p.x - x) ** 2 + (p.z - z) ** 2 < (r * low + (o.rad || 0)) ** 2)); k.inst(geo, list, mat, o); } k.pending = []; };
  k.scatter = (n, fn) => { const out = []; let tries = 0; while (out.length < n && tries++ < n * 40) { const p = fn(k.r); if (p) { if (p.y == null) p.y = k.H(p.x, p.z); if (p.r == null) p.r = k.r() * TAU; out.push(p); } } return out; };
  // punto a caso in un anello attorno a (cx,cz)
  k.ringPt = (r0, r1, cx = 0, cz = 0) => { const a = k.r() * TAU, d = Math.sqrt(lerp(r0 * r0, r1 * r1, k.r())); return [cx + Math.cos(a) * d, cz + Math.sin(a) * d]; };
  /* animali che si muovono lungo percorsi */
  k.herd = (geo, mat, items, o = {}) => {
    const im = k.inst(geo, items.map(it => ({s: it.s, c: it.c, ph: it.ph, mv: it.mv != null ? it.mv : 1})), mat, Object.assign({}, o, {dy: 0}));
    if (!im) return;
    const d = new T3.Object3D(); d.rotation.order = 'YZX';
    const upd = t => { for (let i = 0; i < items.length; i++) { const it = items[i], tt = t * (it.sp || 1) + (it.t0 || 0), p = it.path(tt), q = it.path(tt + .2);
        const y = p[1] == null ? k.H(p[0], p[2]) + (it.dy || 0) : p[1];
        const vx = q[0] - p[0], vz = q[2] - p[2]; let yaw = p[3] != null ? p[3] : Math.atan2(-vz, vx);
        let pitch = 0; if (o.pitch && p[1] != null && q[1] != null) pitch = Math.atan2(q[1] - p[1], Math.hypot(vx, vz) + 1e-6) * o.pitch;
        d.position.set(p[0], y, p[2]); d.rotation.set(it.roll || 0, yaw, pitch); d.scale.setScalar(it.s || 1); d.updateMatrix(); im.setMatrixAt(i, d.matrix); }
      im.instanceMatrix.needsUpdate = true; };
    upd(0); k.up.push(upd); im.userData.upd = upd; return im;
  };
  /* modelli 3D veri (file glTF/GLB nella cartella modelli/, vedi CLAUDE.md): il file si scarica solo quando si apre l'ambiente.
     Finché non arriva, o se manca (per esempio aprendo la pagina dal disco), restano gli animali fatti dal codice (fallback).
     o: {len: lunghezza in metri, v0: velocità (m/s) a cui l'animazione del passo è naturale, clip: RegExp del nome dell'animazione,
         rot: rotazione del modello perché guardi verso +x (se manca si ricava dalle proporzioni), sRef: scala di riferimento degli item} */
  k.credits = [];
  k.model = (url, o, items, fallback) => {
    const im = fallback(); if (o.credit) k.credits.push(o.credit);
    if (!T3.GLTFLoader || !T3.SkeletonUtils || location.protocol === 'file:') return;
    (MODELS[url] = MODELS[url] || new Promise((ok, ko) => new T3.GLTFLoader().load(url, ok, undefined, ko))).then(gl => {
      if (k.dead) return;
      // ingombro calcolato sui vertici già deformati dallo scheletro (setFromObject sbaglia con le mesh con scheletro)
      const src = gl.scene, box = new T3.Box3(), v = new T3.Vector3(); src.updateMatrixWorld(true);
      // o.noMorph: toglie le deformazioni (morph target) difettose di alcuni file (la manta diventava un enorme telo bianco)
      if (o.noMorph) { src.traverse(m => { if (m.isMesh && m.morphTargetInfluences) { m.geometry.morphAttributes = {}; m.morphTargetInfluences = undefined; m.morphTargetDictionary = undefined; } }); gl.animations.forEach(a => { a.tracks = a.tracks.filter(tr => !/morphTargetInfluences/.test(tr.name)); }); }
      src.traverse(m => { if (!m.isMesh) return; const p = m.geometry.attributes.position, st = Math.max(1, p.count / 3000 | 0); for (let i = 0; i < p.count; i += st) { v.fromBufferAttribute(p, i); if (m.isSkinnedMesh) m.boneTransform(i, v); box.expandByPoint(v.applyMatrix4(m.matrixWorld)); } });
      const sz = box.getSize(new T3.Vector3()), c = box.getCenter(new T3.Vector3());
      const s0 = o.len / Math.max(sz.x, sz.z), rot = o.rot != null ? o.rot : (sz.z > sz.x ? PI / 2 : 0);
      const clip = gl.animations.find(a => o.clip && o.clip.test(a.name)) || gl.animations[0];
      const A = items.map(it => {
        const obj = T3.SkeletonUtils.clone(src), mid = new T3.Group(), wrap = new T3.Group();
        obj.position.set(-c.x, -box.min.y, -c.z); mid.rotation.y = rot; mid.scale.setScalar(s0 * (o.sRef ? (it.s || 1) / o.sRef : 1));
        mid.add(obj); wrap.add(mid); wrap.rotation.order = 'YZX';
        obj.traverse(m => { if (m.isMesh) { m.castShadow = k.shadows; m.frustumCulled = false; (Array.isArray(m.material) ? m.material : [m.material]).forEach(mm => { if (mm.isMeshStandardMaterial && k.envInt != null) mm.envMapIntensity = k.envInt; }); } });
        const mix = new T3.AnimationMixer(obj), act = clip ? mix.clipAction(clip) : null;
        if (act) { act.play(); act.time = k.r() * clip.duration; }
        scene.add(wrap); return {wrap, mix, act};
      });
      if (im) { scene.remove(im); const i = k.up.indexOf(im.userData.upd); if (i >= 0) k.up.splice(i, 1); im.geometry.dispose(); im.material.dispose(); }
      k.up.push((t, dt) => { for (let i = 0; i < items.length; i++) { const it = items[i], a = A[i];
        // o.ctl(t, i, durata) → {p: [x,y,z], yaw, roll, at}: posizione e istante dell'animazione decisi da chi crea l'ambiente (es. il corvo che decolla)
        if (o.ctl) { const c = o.ctl(t, i, clip ? clip.duration : 0); a.wrap.position.set(c.p[0], c.p[1], c.p[2]); a.wrap.rotation.set(c.roll || 0, c.yaw, 0); if (a.act) { a.act.time = c.at; a.mix.update(0); } continue; }
        const tt = t * (it.sp || 1) + (it.t0 || 0), p = it.path(tt), q = it.path(tt + .2);
        const y = p[1] == null ? k.H(p[0], p[2]) + (it.dy || 0) : p[1], vx = q[0] - p[0], vz = q[2] - p[2];
        a.wrap.position.set(p[0], y, p[2]); a.wrap.rotation.set(it.roll || 0, p[3] != null ? p[3] : Math.atan2(-vz, vx), 0);
        if (a.act && o.v0) a.act.timeScale = Math.hypot(vx, vz) / .2 * (it.sp || 1) / o.v0;
        a.mix.update(dt); } });
    }).catch(e => { delete MODELS[url]; console.warn('Modello 3D non disponibile, resta quello semplice:', url, e && e.message); });
  };
  // percorsi
  k.circ = (cx, cz, R, w, a0 = 0, y = null, bob = 0) => t => { const a = a0 + w * t; return [cx + Math.cos(a) * R, y == null ? null : y + Math.sin(t * .7 + a0 * 3) * bob, cz + Math.sin(a) * R]; };
  k.liss = (cx, cz, R, w, a0 = 0, y = null, bob = 0) => t => { const a = a0 + w * t; return [cx + Math.sin(a) * R, y == null ? null : y + Math.sin(t * .6 + a0) * bob, cz + Math.sin(a * 2) * R * .45]; };
  k.stay = (x, z, yaw, y = null) => () => [x, y, z, yaw];
  /* acqua vista da sopra */
  k.waterNormal = (() => { const S = 128, [c, g] = mkc(S, S), img = g.createImageData(S, S), P2 = TAU / S, W8 = [[1, 2, .5, 0], [3, 1, .3, 1.3], [2, 5, .2, 2.1], [6, 3, .12, .7], [5, 7, .08, 3.3]], hgt = (x, y) => W8.reduce((s, [a, b, amp, ph]) => s + amp * Math.sin(P2 * (a * x + b * y) + ph) + amp * .7 * Math.sin(P2 * (b * x - a * y) + ph * 2), 0);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const dx = hgt((x + 1) % S, y) - hgt((x + S - 1) % S, y), dy = hgt(x, (y + 1) % S) - hgt(x, (y + S - 1) % S); const nx = -dx * 2.2, ny = -dy * 2.2, l = Math.hypot(nx, ny, 1); const i = (y * S + x) * 4; img.data[i] = (nx / l * .5 + .5) * 255; img.data[i + 1] = (ny / l * .5 + .5) * 255; img.data[i + 2] = (1 / l * .5 + .5) * 255; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0); const t = new T3.CanvasTexture(c); t.wrapS = t.wrapT = T3.RepeatWrapping; return t; })();
  k.water = (y, color, opacity, w, h = w, x = 0, z = 0, o = {}) => {
    const g = o.round ? new T3.CircleGeometry(w / 2, 40) : new T3.PlaneGeometry(w, h, Math.min(60, Math.ceil(w / 15)), Math.min(60, Math.ceil(h / 15))); g.rotateX(-PI / 2); delete o.round;
    const nm = k.waterNormal.clone(); nm.needsUpdate = true; nm.repeat.set(w / 7, h / 7);
    const m = new T3.Mesh(g, new T3.MeshStandardMaterial(Object.assign({color: lin(color), transparent: opacity < 1, opacity, roughness: .07, metalness: .1, normalMap: nm, normalScale: new T3.Vector2(.35, .35), envMapIntensity: 1.2}, o)));
    m.receiveShadow = k.shadows; m.position.set(x, y, z); scene.add(m); k.up.push(t => nm.offset.set(t * .012, t * .007)); return m;
  };
  /* superficie del mare vista da sotto */
  k.surface = (y, color, op = .7) => {
    const [c, g] = mkc(256, 256), r = rng(9); g.fillStyle = '#5c8aa0'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 160; i++) { const x = r() * 256, yy = r() * 256, s = 8 + r() * 26; const gr = g.createRadialGradient(x, yy, 0, x, yy, s); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; for (const ox of [-256, 0, 256]) for (const oy of [-256, 0, 256]) g.fillRect(x - s + ox, yy - s + oy, s * 2, s * 2); }
    const t = k.tex(c, true, [40, 40]);
    const m = new T3.Mesh(new T3.PlaneGeometry(600, 600, 40, 40), new T3.MeshBasicMaterial({map: t, color: lin(color), transparent: true, opacity: op, side: T3.DoubleSide, depthWrite: false}));
    m.rotation.x = PI / 2; m.position.y = y; scene.add(m); k.follow.push([m, false]);
    k.up.push(tt => { t.offset.set(tt * .01, Math.sin(tt * .2) * .02); });
    return m;
  };
  /* raggi di luce nell'acqua */
  k.rays = (n, top, color, op = .12, len = 26) => {
    const [c, g] = mkc(64, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.6, 'rgba(255,255,255,.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    g.globalCompositeOperation = 'destination-in'; const hg = g.createLinearGradient(0, 0, 64, 0); hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(.5, 'rgba(0,0,0,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = hg; g.fillRect(0, 0, 64, 256);
    const tx = k.tex(c, false), geo = new T3.PlaneGeometry(1, 1); geo.translate(0, -.5, 0);
    const mat = new T3.MeshBasicMaterial({map: tx, color: lin(color), transparent: true, opacity: op, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide, fog: false});
    const R = [];
    for (let i = 0; i < n; i++) { const m = new T3.Mesh(geo, mat); const [x, z] = k.ringPt(4, 34); m.position.set(x, top, z); const w = 1.5 + k.r() * 3.5; m.scale.set(w, len * (.7 + k.r() * .6), 1); m.rotation.z = .12; m.userData.w = w; m.userData.ph = k.r() * TAU; scene.add(m); R.push(m); }
    k.up.push((t, dt, cam, rig) => { for (const m of R) { let dx = m.position.x - rig.position.x, dz = m.position.z - rig.position.z; if (dx > 36) m.position.x -= 72; else if (dx < -36) m.position.x += 72; if (dz > 36) m.position.z -= 72; else if (dz < -36) m.position.z += 72; m.rotation.order = 'YXZ'; m.rotation.y = Math.atan2(cam.x - m.position.x, cam.z - m.position.z); m.scale.x = m.userData.w * (.75 + .25 * Math.sin(t * .4 + m.userData.ph)); } });
  };
  /* particelle con trasparenza e dimensione per punto */
  k.parts = (n, o) => {
    const pos = new Float32Array(n * 3), al = new Float32Array(n), sz = new Float32Array(n), P = [];
    for (let i = 0; i < n; i++) { const p = {x: 0, y: 0, z: 0, s: 1, a: 1, i}; o.init(p, k.r, true); P.push(p); }
    const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('a', new T3.BufferAttribute(al, 1)); g.setAttribute('s', new T3.BufferAttribute(sz, 1));
    const U = {uCol: {value: lin(o.col || '#ffffff')}, uMap: {value: k.dot}, uScale: {value: 400}, uOp: {value: o.op != null ? o.op : 1}};
    const mat = new T3.ShaderMaterial({uniforms: U, transparent: true, depthWrite: false, blending: o.add ? T3.AdditiveBlending : T3.NormalBlending,
      vertexShader: 'attribute float a; attribute float s; varying float va; uniform float uScale; void main(){ va = a; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = s * uScale / max(.1, -mv.z); gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform vec3 uCol; uniform sampler2D uMap; uniform float uOp; varying float va; void main(){ float m = texture2D(uMap, gl_PointCoord).a; gl_FragColor = vec4(uCol, m * va * uOp);\n#include <encodings_fragment>\n}'});
    const pts = new T3.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 2; scene.add(pts); k.pointMats = k.pointMats || []; k.pointMats.push(U.uScale);
    k.up.push((t, dt, cam, rig) => { for (let i = 0; i < n; i++) { const p = P[i]; o.step(p, t, dt, rig.position, k.r); pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; al[i] = p.a; sz[i] = p.s; } g.attributes.position.needsUpdate = true; g.attributes.a.needsUpdate = true; g.attributes.s.needsUpdate = true; });
    return pts;
  };
  // particelle sospese attorno al visitatore (neve marina, polline, neve, cenere)
  k.drift = (n, o) => {
    const R = o.R || 25, h0 = o.h0 != null ? o.h0 : -2, h1 = o.h1 != null ? o.h1 : 12, v = o.vel || [0, 0, 0];
    return k.parts(n, {col: o.col, add: o.add, op: o.op, init(p, r) { p.ox = (r() - .5) * 2 * R; p.oz = (r() - .5) * 2 * R; p.y0 = lerp(h0, h1, r()); p.s = lerp(o.size[0], o.size[1], r()); p.ph = r() * TAU; p.a = o.alpha != null ? o.alpha * (.5 + r() * .5) : 1; p.wx = p.wz = 0; },
      step(p, t, dt, c) { p.wx += v[0] * dt; p.wz += v[2] * dt; p.y0 += v[1] * dt; if (p.y0 < h0) p.y0 += h1 - h0; if (p.y0 > h1) p.y0 -= h1 - h0;
        let x = p.ox + p.wx + Math.sin(t * .3 + p.ph) * (o.wob || .4), z = p.oz + p.wz + Math.cos(t * .27 + p.ph) * (o.wob || .4);
        x = ((x - c.x) % (2 * R) + 3 * R) % (2 * R) - R + c.x; z = ((z - c.z) % (2 * R) + 3 * R) % (2 * R) - R + c.z;
        p.x = x; p.z = z; p.y = (o.ground ? k.H(x, z) : o.abs ? 0 : c.y) + p.y0; if (o.tw) p.a = (o.alpha || 1) * (.5 + .5 * Math.sin(t * o.tw + p.ph)); } });
  };
  // pennacchi di fumo o vapore da sorgenti fisse
  k.plumes = (src, n, o) => k.parts(n, {col: o.col, add: o.add, op: o.op, init(p, r, first) { const s = src[p.i % src.length]; p.sx = s[0]; p.sy = s[1]; p.sz = s[2]; p.sr = s[3] || 1; p.life = first ? r() : 0; p.dx = (r() - .5); p.dz = (r() - .5); p.sp = .7 + r() * .6; },
    step(p, t, dt, c, r) { p.life += dt / (o.life || 8) * p.sp; if (p.life > 1) { p.life = 0; p.dx = r() - .5; p.dz = r() - .5; }
      const L = p.life, rise = (o.rise || 20) * p.sr; p.x = p.sx + (p.dx * (o.spread || 3) + (o.wind ? o.wind[0] : 0) * L) * p.sr * L * 2; p.z = p.sz + (p.dz * (o.spread || 3) + (o.wind ? o.wind[1] : 0) * L) * p.sr * L * 2; p.y = p.sy + rise * L;
      p.s = (o.size[0] + (o.size[1] - o.size[0]) * L) * p.sr; p.a = Math.sin(Math.min(1, L * 1.2) * PI) * (o.alpha || .6); } });
  k.glowTex = (inner, outer) => { const [c, g] = mkc(128, 128); const gr = g.createRadialGradient(64, 64, 2, 64, 64, 64); gr.addColorStop(0, inner); gr.addColorStop(1, outer); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return k.tex(c); };
  k.sprite = (tex, x, y, z, s, o = {}) => { const sp = new T3.Sprite(new T3.SpriteMaterial(Object.assign({map: tex, blending: T3.AdditiveBlending, depthWrite: false, transparent: true}, o))); sp.position.set(x, y, z); sp.scale.set(s, s, 1); scene.add(sp); return sp; };
  k.clouds = (n, y0, y1, o = {}) => { const tint = o.tint ? lin(o.tint) : new T3.Color(1, 1, 1); for (let i = 0; i < n; i++) { const a = k.r() * TAU, d = 200 + k.r() * 180; const sp = k.sprite(k.cloudTex, Math.cos(a) * d, y0 + k.r() * (y1 - y0), Math.sin(a) * d, 70 + k.r() * 90, {blending: T3.NormalBlending, opacity: (o.op || .8) * (.6 + k.r() * .4), fog: false, color: tint}); sp.scale.y *= .45; k.follow.push([sp, true]); } };
  /* cartello "Lo sapevi?" */
  k.sign = (E, i, n, x, y, z, face, s = 1, float = false) => {
    const grp = new T3.Group();
    const dark = new T3.MeshStandardMaterial({color: lin('#20282d'), roughness: .6, metalness: .2});
    const acc = new T3.MeshStandardMaterial({color: lin(E.color), roughness: .5, emissive: lin(E.color), emissiveIntensity: .25});
    if (!float) { const p = new T3.Mesh(new T3.CylinderGeometry(.05, .07, 1.9, 8), dark); p.position.set(0, .95, -.02); p.castShadow = k.shadows; grp.add(p);
      const foot = new T3.Mesh(new T3.CylinderGeometry(.35, .45, .08, 12), dark); foot.position.y = .04; grp.add(foot); }
    const board = new T3.Mesh(new T3.BoxGeometry(2.56, 1.76, .07), dark); board.position.set(0, 2.05, -.04); board.castShadow = k.shadows; grp.add(board);
    const strip = new T3.Mesh(new T3.BoxGeometry(2.56, .06, .09), acc); strip.position.set(0, 2.96, -.03); grp.add(strip);
    const t = k.tex(paintFact(E, i, n, E.facts[i][0], E.facts[i][1]));
    const f = new T3.Mesh(new T3.PlaneGeometry(2.46, 1.64), new T3.MeshBasicMaterial({map: t, toneMapped: false, fog: false})); f.position.set(0, 2.05, .002); f.userData.fact = i; grp.add(f);
    grp.scale.setScalar(s); grp.position.set(x, y, z); grp.rotation.y = face; scene.add(grp); k.targets.push(f);
    if (float) { const y0 = y, ph = i * 1.3; k.up.push(tt => { grp.position.y = y0 + Math.sin(tt * .6 + ph) * .08 * s; }); }
    return grp;
  };
  return k;
}

/* ---------- forme di piante e animali ---------- */
let LR = rng(7);
const rr = (a, b) => a + (b - a) * LR();
// unisce geometrie "grezze" (solo posizioni e normali)
function cat(list) {
  let n = 0; const gs = list.map(g => { if (!g.attributes.normal) g.computeVertexNormals(); return g.index ? g.toNonIndexed() : g; }); gs.forEach(g => n += g.attributes.position.count);
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3); let o = 0;
  gs.forEach(g => { pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3); o += g.attributes.position.count; });
  const g = new T3.BufferGeometry(); g.setAttribute('position', new T3.BufferAttribute(pos, 3)); g.setAttribute('normal', new T3.BufferAttribute(nor, 3)); return g;
}
// orienta una forma costruita lungo +x: prima inclinazione verso l'alto, poi direzione
const aim = (g, yaw, tilt) => { g.rotateZ(tilt); g.rotateY(yaw); return g; };
const along = (g, dir) => { g.applyMatrix4(new T3.Matrix4().makeRotationFromQuaternion(new T3.Quaternion().setFromUnitVectors(new T3.Vector3(0, 1, 0), dir.clone().normalize()))); return g; };
const S = (pts, s, z = 0) => pts.map(p => [p[0] * s, p[1] * s, (p.length > 4 ? p[2] : z) * s, (p.length > 4 ? p[3] : p[2]) * s, (p.length > 4 ? p[4] : (p[3] != null ? p[3] : p[2])) * s]);
const banded = (col, f, amt, axis = 1) => { const C = new T3.Color(col); return (x, y, z, c) => { const v = axis === 1 ? y : axis === 0 ? x : z; c.copy(C).multiplyScalar(1 - amt + amt * (.5 + .5 * Math.sin(v * f))); }; };
const mottled = (col, f, amt, col2) => { const C = new T3.Color(col), C2 = col2 ? new T3.Color(col2) : null; return (x, y, z, c) => { const n = vnoise(x * f + z * f * .7 + 3, y * f + z * f * .3); if (C2) c.copy(C).lerp(C2, smooth(.45, .7, n)); else c.copy(C).multiplyScalar(1 - amt + amt * 2 * n); }; };

/* foglia pennata (fronda) lungo +x */
function frond(len, w, np = 10, droop = .4) {
  const parts = [G.loft([[0, 0, 0, w * .05], [len * .5, -droop * .25 * len, 0, w * .04], [len, -droop * len, 0, w * .02]], 3, false)];
  for (let i = 1; i <= np; i++) { const t = i / (np + 1), x = t * len, y = -droop * len * t * t, pl = w * (1 - t * .7) * (t < .12 ? .6 : 1);
    for (const s of [-1, 1]) { const g = G.leaf(pl, pl * .3, 2, 0); g.rotateY(s * (PI / 2 - .55)); g.translate(x, y, 0); parts.push(g); } }
  return cat(parts);
}
const serr = t => Math.sin(PI * Math.min(1, t * 1.1)) * (.5 + .5 * Math.abs(Math.sin(t * 26)));

// fogliame: più scuro sotto e all'interno, a chiazze di luce (al posto di un colore unico)
const foliage = col => { const C0 = new T3.Color(col); return (x, y, z, c, ny) => { c.copy(C0).multiplyScalar((.72 + .28 * ((ny || 0) * .5 + .5)) * (.85 + .3 * vnoise(x * 2.3 + 5, y * 2.3 + z * 2.3))); }; };
const PL = {
  trunkCol: (c, k = .3) => banded(c, 9, k),
  conifer(h = 10, col = '#2e5634', tcol = '#5a4330') {
    const b = mk(), r = h * .3; b.add(G.cyl(h * .04, h * .02, h * .5, 6), tcol);
    for (let i = 0; i < 4; i++) { const y = h * (.2 + i * .19), rad = r * (1 - i * .22), hh = h * (.38 - i * .05); b.add(G.organic(G.tr(G.cone(rad, hh, 16), 0, y, 0), rad * .25, 1.5 / rad, i), foliage(col), {k: .85 + i * .07}); }
    return b.geo({ao: .5, aoH: .7, wave: (x, y) => Math.max(0, y - h * .3) / h * .6});
  },
  araucaria(h = 26, col = '#2b4b2c', tcol = '#6a5038') {
    const b = mk(); b.add(G.loft([[0, 0, 0, h * .03], [0, h * .08, 0, h * .022], [0, h * .6, 0, h * .016], [0, h, 0, h * .008]], 8, true), PL.trunkCol(tcol, .2));
    for (let L = 0; L < 6; L++) { const y = h * (.6 + L * .075), len = h * (.2 - L * .022), nb = 5;
      for (let i = 0; i < nb; i++) { const a = i / nb * TAU + L * .6; const ex = Math.cos(a) * len, ez = Math.sin(a) * len;
        b.add(G.loft([[0, y, 0, h * .006], [ex * .6, y + len * .08, ez * .6, h * .005], [ex, y + len * .2, ez, h * .003]], 4, false), tcol);
        const f = G.ell(len * .45, h * .028, h * .045, 8, 5); f.rotateY(-a); f.translate(ex * .6, y + len * .13, ez * .6); b.add(G.organic(f, h * .02, 2, L * 7 + i), col, {k: .8 + L * .05}); } }
    b.add(G.organic(G.tr(G.ell(h * .1, h * .04, h * .1, 8, 5), 0, h * .99, 0), h * .02, 2), col, {k: 1.1});
    return b.geo({ao: .55, aoH: .9, wave: (x, y) => Math.max(0, y - h * .55) / h * .5});
  },
  treeFern(h = 6, col = '#3f7a3a', tcol = '#4a3a2c', nf = 10) {
    const b = mk(), bend = rr(-1, 1) * h * .08;
    b.add(G.loft([[0, 0, 0, h * .055], [bend * .4, h * .5, 0, h * .038], [bend, h, 0, h * .034]], 7, true), (x, y, z, c) => c.set(tcol).multiplyScalar(.75 + .35 * Math.abs(Math.sin(y * 9))));
    for (let i = 0; i < nf; i++) { const g = frond(h * .45, h * .12, 12, .45); aim(g, i / nf * TAU + rr(0, .4), rr(.2, .75)); g.translate(bend, h, 0); b.add(g, col, {upN: .6, k: rr(.85, 1.1)}); }
    return b.geo({ao: .6, aoH: .85, wave: (x, y, z) => Math.max(0, y - h * .9) / h + Math.hypot(x - bend, z) / h * .8});
  },
  fern(s = 1, col = '#4c8a3c', n = 7) {
    const parts = []; for (let i = 0; i < n; i++) { const g = G.leaf(1.1 * s, .38 * s, 10, .45 * s, serr); aim(g, i / n * TAU + rr(0, .5), rr(.45, .9)); g.translate(0, .04, 0); parts.push(g); }
    return mk().add(cat(parts), col, {upN: .6}).geo({ao: .5, aoH: .9, wave: (x, y) => Math.hypot(x, y) / s * .5});
  },
  cycad(h = 1.6, col = '#3d6e32', tcol = '#6b5a3a') {
    const b = mk(); b.add(G.loft([[0, 0, 0, .3 * h / 1.6], [0, h * .3, 0, .32 * h / 1.6], [0, h * .55, 0, .26 * h / 1.6], [0, h * .62, 0, .12 * h / 1.6]], 9, true), (x, y, z, c) => c.set(tcol).multiplyScalar(.75 + .3 * Math.abs(Math.sin(y * 30 + Math.atan2(z, x) * 4))));
    for (let i = 0; i < 14; i++) { const g = frond(h * .75, h * .16, 10, .18); aim(g, i / 14 * TAU + rr(0, .3), rr(.35, .95)); g.translate(0, h * .58, 0); b.add(g, col, {upN: .6, k: rr(.85, 1.1)}); }
    return b.geo({ao: .55, aoH: .7, wave: (x, y, z) => Math.hypot(x, z) / h * .4});
  },
  broadleaf(h = 10, col = '#3d6b35', tcol = '#5a4636', o = {}) {
    const b = mk(), r = h * (o.w || .28), lean = rr(-.06, .06) * h;
    b.add(G.loft([[0, 0, 0, h * .04], [lean * .5, h * .3, 0, h * .028], [lean, h * .62, 0, h * .018]], 7), tcol);
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + rr(0, 1); b.add(G.loft([[lean * .5, h * .4, 0, h * .018], [lean + Math.cos(a) * r * .6, h * .64, Math.sin(a) * r * .6, h * .008]], 5), tcol); }
    const nb = o.blobs || 6;
    for (let i = 0; i < nb; i++) { const a = i / nb * TAU + rr(0, .6), d = i === 0 ? 0 : r * rr(.45, .75), y = h * (i === 0 ? .82 : rr(.62, .78)), s = r * (i === 0 ? .62 : rr(.42, .58));
      b.add(G.organic(G.tr(G.ico(s, 2), lean + Math.cos(a) * d, y, Math.sin(a) * d), s * .32, 1.2 / s, i), foliage(col), {k: rr(.82, 1.1)}); }
    if (o.flowers) for (let i = 0; i < o.flowers; i++) { const a = LR() * TAU, e = rr(-.1, 1.2); b.add(G.tr(G.ico(o.fs || h * .016, 0), lean + Math.cos(a) * Math.cos(e) * r * 1.02, h * .74 + Math.sin(e) * r * .75, Math.sin(a) * Math.cos(e) * r * 1.02), o.fcol || '#f4efe6'); }
    return b.geo({ao: .5, aoH: .85, wave: (x, y) => Math.max(0, y - h * .5) / h * .8});
  },
  ginkgo(h = 12) { return PL.broadleaf(h, '#7ea24a', '#6b5a48', {w: .22, blobs: 7}); },
  palm(h = 8, col = '#4f8a3a', tcol = '#7a6448', nf = 11) {
    const b = mk(), bx = rr(.3, 1) * h * .12, parts = [];
    for (let i = 0; i <= 6; i++) { const t = i / 6; parts.push([bx * t * t, h * t, 0, h * (.028 - t * .008)]); }
    b.add(G.loft(parts, 7, true), (x, y, z, c) => c.set(tcol).multiplyScalar(.75 + .3 * Math.abs(Math.sin(y * 6))));
    for (let i = 0; i < nf; i++) { const g = frond(h * .42, h * .12, 14, .7); aim(g, i / nf * TAU + rr(0, .3), rr(.1, .6)); g.translate(bx, h, 0); b.add(g, col, {upN: .6, k: rr(.85, 1.1)}); }
    return b.geo({ao: .6, aoH: .8, wave: (x, y) => Math.max(0, y - h * .85) / h * 1.4});
  },
  fanPalm(h = 4, col = '#5b8a45', tcol = '#6e5a42', nf = 12) {
    const b = mk(); if (h > .3) b.add(G.loft([[0, 0, 0, .2], [0, h * .5, 0, .17], [0, h, 0, .18]], 8, true), (x, y, z, c) => c.set(tcol).multiplyScalar(.7 + .35 * Math.abs(Math.sin(y * 10 + Math.atan2(z, x) * 2))));
    for (let i = 0; i < nf; i++) { const a = i / nf * TAU + rr(0, .4), t = rr(.2, .9), pl = rr(.8, 1.2);
      const pet = G.loft([[0, 0, 0, .025], [pl, .1, 0, .02]], 4, false); aim(pet, a, t); pet.translate(0, h, 0); b.add(pet, tcol);
      const fan = new T3.CircleGeometry(1, 12, -1.05, 2.1), p = fan.attributes.position; for (let v = 0; v < p.count; v++) p.setZ(v, (v % 2 ? .07 : -.07) * Math.hypot(p.getX(v), p.getY(v)));
      fan.rotateX(-PI / 2); fan.translate(pl * .95, 0, 0); fan.computeVertexNormals(); aim(fan, a, t + .25); fan.translate(0, h + .08, 0); b.add(fan, col, {upN: .5, k: rr(.85, 1.1)}); }
    return b.geo({ao: .6, aoH: .8, wave: (x, y) => Math.max(0, y - h) * .6});
  },
  acacia(h = 6, col = '#6f8a3a', tcol = '#4c3a2a') {
    const b = mk(), r = h * .5;
    b.add(G.loft([[0, 0, 0, .2], [.1, h * .5, 0, .14], [.2, h * .7, 0, .1]], 6), tcol);
    for (const [a, l] of [[0, 1], [2.2, .9], [4.1, .85]]) b.add(G.loft([[.15, h * .6, 0, .1], [Math.cos(a) * r * .5 * l, h * .8, Math.sin(a) * r * .5 * l, .05], [Math.cos(a) * r * .75 * l, h * .9, Math.sin(a) * r * .75 * l, .03]], 5), tcol);
    for (const [x, z, s] of [[0, 0, 1], [r * .45, r * .25, .6], [-r * .4, -r * .3, .55], [-r * .2, r * .4, .5], [r * .3, -r * .4, .5]]) b.add(G.organic(G.tr(G.sc(new T3.CylinderGeometry(r * s * .8, r * s * .65, h * .09, 12), 1, 1, 1), x, h * .93 + rr(-.1, .1) * h * .05, z), r * .12, .9), foliage(col), {k: rr(.85, 1.1)});
    return b.geo({ao: .6, aoH: .95, wave: (x, y) => Math.max(0, y - h * .8) / h});
  },
  shrub(r = .6, col = '#4f7a3a') { return mk().add(G.organic(G.tr(G.ico(r, 2), 0, r * .55, 0), r * .4, 1.5 / r), foliage(col)).geo({ao: .5, aoH: 1, wave: (x, y) => y / r * .3}); },
  rock(r = 1, col = '#7d766d') { return mk().add(G.organic(new T3.DodecahedronGeometry(r, 1), r * .4, 1.2 / r), col).geo({ao: .55, aoH: .7}); },
  tuft(h = .6, col = '#8a9a52', tip = '#c8c07a', n = 7) {
    const blades = [], TC = new T3.Color(tip), BC = new T3.Color(col);
    for (let i = 0; i < n; i++) { const g = new T3.PlaneGeometry(.06, h * rr(.7, 1.15), 1, 3); g.translate(0, h * .5, 0); const p = g.attributes.position; for (let v = 0; v < p.count; v++) { const y = p.getY(v); p.setX(v, p.getX(v) * (1 - y / (h * 1.2))); p.setZ(v, y * y * .4 / h); } g.rotateY(i / n * TAU + i * .5); g.rotateZ(rr(-.25, .25)); g.translate(rr(-.06, .06), 0, rr(-.06, .06)); blades.push(g); }
    return mk().add(cat(blades), (x, y, z, c) => c.copy(BC).lerp(TC, clamp01(y / h)), {upN: .7}).geo({wave: (x, y) => y / h * .6});
  },
  horsetail(h = 1.2, col = '#5d7d3a') {
    const parts = []; for (let i = 0; i < 9; i++) { const x = rr(-.2, .2), z = rr(-.2, .2), hh = h * rr(.6, 1.1), lx = rr(-.1, .1) * hh; parts.push(G.loft([[x, 0, z, .02], [x + lx * .5, hh * .5, z, .018], [x + lx, hh, z, .006]], 5, true)); }
    return mk().add(cat(parts), (x, y, z, c) => { c.set(col); if (Math.sin(y * 28) > .85) c.multiplyScalar(.45); }).geo({wave: (x, y) => y / h * .5});
  },
  // Lepidodendron: tronco a scaglie (texture) + chioma ramificata
  lepidoCrown(h = 30, col = '#4c6e32', bcol = '#5d5a3c') {
    const b = mk(), y0 = h * .76, UP = new T3.Vector3(0, 1, 0);
    const br = (p, dir, len, r, d, rot) => { const e = p.clone().addScaledVector(dir, len); b.add(G.loft([[p.x, p.y, p.z, r], [e.x, e.y, e.z, r * .75]], 6, false), bcol);
      if (d === 0) { const c = G.ell(.35 * h / 30, 1.4 * h / 30, .35 * h / 30, 7, 5); along(c, dir); c.translate(e.x + dir.x * .9, e.y + dir.y * .9, e.z + dir.z * .9); b.add(G.organic(c, .2, 3), col, {k: rr(.85, 1.1)}); return; }
      const ax = new T3.Vector3(Math.cos(rot), 0, Math.sin(rot));
      for (const s of [-1, 1]) { const nd = dir.clone().applyAxisAngle(ax, s * .5).normalize(); br(e, nd, len * .72, r * .7, d - 1, rot + PI / 2); } };
    br(new T3.Vector3(0, y0 - .5, 0), UP, h * .07, h * .012, 3, rr(0, PI));
    return b.geo({ao: .7, aoH: .5, wave: (x, y) => Math.max(0, y - y0) / h});
  },
  sigiCrown(h = 20, col = '#567a34', bcol = '#5d5a3c') {
    const b = mk(), y0 = h * .9;
    for (const s of [-1, 1]) { const ex = s * h * .05; b.add(G.loft([[0, y0 - 1, 0, h * .016], [ex, y0 + h * .05, 0, h * .013]], 7, true), bcol);
      for (let i = 0; i < 26; i++) { const g = G.leaf(h * .09 * rr(.8, 1.2), .07, 3, h * .03); aim(g, i / 26 * TAU + rr(0, .3), rr(-.5, .9)); g.translate(ex, y0 + h * .05, 0); b.add(g, col, {upN: .5, k: rr(.8, 1.1)}); } }
    return b.geo({ao: .7, aoH: .5, wave: (x, y) => Math.max(0, y - y0) / h * 2});
  },
  barkTex(kind, k) {
    const [c, g] = mkc(128, 256), r = rng(kind === 'lepido' ? 3 : 4);
    g.fillStyle = kind === 'lepido' ? '#5c5a40' : '#5a5238'; g.fillRect(0, 0, 128, 256);
    if (kind === 'lepido') { for (let y = -16; y < 272; y += 16) for (let x = -16; x < 144; x += 16) { const ox = (y / 16 % 2) * 8; g.fillStyle = `hsl(${55 + r() * 15},${18 + r() * 10}%,${30 + r() * 10}%)`; g.beginPath(); g.moveTo(x + ox, y - 9); g.lineTo(x + ox + 7, y); g.lineTo(x + ox, y + 9); g.lineTo(x + ox - 7, y); g.closePath(); g.fill(); g.strokeStyle = 'rgba(20,18,10,.6)'; g.lineWidth = 1.5; g.stroke(); g.fillStyle = 'rgba(30,25,15,.6)'; g.fillRect(x + ox - 1, y - 2, 2, 4); } }
    else { for (let x = 0; x < 128; x += 16) { g.fillStyle = 'rgba(20,18,10,.5)'; g.fillRect(x, 0, 3, 256); for (let y = 0; y < 256; y += 14) { g.fillStyle = `hsl(${50 + r() * 12},${16 + r() * 10}%,${30 + r() * 10}%)`; g.beginPath(); g.ellipse(x + 9.5, y + ((x / 16) % 2) * 7, 5, 5.5, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(25,20,12,.6)'; g.fillRect(x + 8, y + ((x / 16) % 2) * 7 - 1, 3, 3); } } }
    return k.tex(c, true, [3, 12]);
  },
  barkTrunk(h, r0, r1) { const g = new T3.CylinderGeometry(r1, r0, h, 12, 6, true); g.translate(0, h / 2, 0); return g; },
  calamites(h = 10, col = '#5f8a3a', scol = '#7a8a50') {
    const b = mk(), r = h * .02, pts = [];
    for (let i = 0; i <= 12; i++) { const y = h * i / 12; pts.push([0, y, 0, r * (1 - i / 16) * (i % 1 ? 1 : 1)]); }
    b.add(G.loft(pts, 7, true), (x, y, z, c) => { c.set(scol); if (Math.abs(Math.sin(y / h * 12 * PI)) < .12) c.multiplyScalar(.55); });
    for (let n = 4; n < 12; n++) { const y = h * n / 12, len = h * .12 * (1 - (n - 4) / 10); for (let i = 0; i < 8; i++) { const g = G.leaf(len, .2, 3, -len * .25, t => 1 - t * .7); aim(g, i / 8 * TAU + n * .4, .55); g.translate(0, y, 0); b.add(g, col, {upN: .5, k: rr(.85, 1.1)}); } }
    return b.geo({ao: .7, aoH: .4, wave: (x, y) => y / h * .8});
  },
  archaeopteris(h = 16, col = '#3e6e30', tcol = '#5a4632') {
    const b = mk(); b.add(G.loft([[0, 0, 0, h * .03], [0, h * .5, 0, h * .02], [0, h, 0, h * .006]], 7, true), PL.trunkCol(tcol, .25));
    for (let L = 0; L < 9; L++) { const y = h * (.35 + L * .075), len = h * (.3 - L * .028); for (let i = 0; i < 5; i++) { const g = G.leaf(len, len * .55, 6, len * .2, serr); aim(g, i / 5 * TAU + L * .8 + rr(0, .4), rr(-.1, .15)); g.translate(0, y, 0); b.add(g, col, {upN: .5, k: rr(.8, 1.1)}); } }
    return b.geo({ao: .6, aoH: .7, wave: (x, y) => Math.max(0, y - h * .3) / h * .7});
  },
  walchia(h = 8, col = '#2f5a30', tcol = '#5a4632') {
    const b = mk(); b.add(G.loft([[0, 0, 0, h * .03], [0, h, 0, h * .006]], 6, true), tcol);
    for (let L = 0; L < 7; L++) { const y = h * (.3 + L * .1), len = h * (.3 - L * .036); for (let i = 0; i < 5; i++) { const g = G.leaf(len, .45 * h / 8, 6, len * .25, serr); aim(g, i / 5 * TAU + L * .7, -.05); g.translate(0, y, 0); b.add(g, col, {upN: .5, k: rr(.8, 1.1)}); } }
    b.add(G.organic(G.tr(G.cone(h * .05, h * .15, 6), 0, h * .92, 0), .1, 2), col);
    return b.geo({ao: .6, aoH: .8, wave: (x, y) => Math.max(0, y - h * .3) / h * .6});
  },
  seedFern(h = 4, col = '#5c8a3a', tcol = '#5b4a36') { // Dicroidium e simili: alberelli con fronde biforcute
    const b = mk(); b.add(G.loft([[0, 0, 0, h * .04], [0, h * .6, 0, h * .025], [0, h * .8, 0, h * .015]], 6), tcol);
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + rr(0, .4), t = rr(-.1, .7), y = h * rr(.55, .85); for (const s of [-.25, .25]) { const g = frond(h * .32, h * .07, 8, .2); aim(g, a + s, t); g.translate(0, y, 0); b.add(g, col, {upN: .6, k: rr(.8, 1.1)}); } }
    return b.geo({ao: .55, aoH: .8, wave: (x, y) => Math.max(0, y - h * .5) / h * .8});
  },
  // piante di Rhynie: fusti nudi che si biforcano, con sporangi in cima
  rhynio(h = .5, col = '#7b8f3a', tip = '#c08a3a', n = 6, kind = 0) {
    const b = mk(), parts = [], tips = [];
    const br = (p, dir, len, r, d) => { const e = p.clone().addScaledVector(dir, len), m = p.clone().lerp(e, .5); m.x += rr(-.05, .05) * len; m.z += rr(-.05, .05) * len; parts.push(G.loft([[p.x, p.y, p.z, r], [m.x, m.y, m.z, r * .95], [e.x, e.y, e.z, r * .85]], 4, false));
      if (d === 0) { tips.push(e); return; } const ax = new T3.Vector3().crossVectors(dir, new T3.Vector3(rr(-1, 1), 0, rr(-1, 1)).normalize()).normalize();
      for (const s of [-1, 1]) br(e, dir.clone().applyAxisAngle(ax, s * rr(.3, .5)).normalize(), len * rr(.6, .8), r * .85, d - 1); };
    for (let i = 0; i < n; i++) { const a = LR() * TAU, d = rr(0, .5) * h * .4; br(new T3.Vector3(Math.cos(a) * d, 0, Math.sin(a) * d), new T3.Vector3(rr(-.25, .25), 1, rr(-.25, .25)).normalize(), h * rr(.35, .5), h * (kind === 2 ? .025 : .016), kind === 1 ? 2 : 3); }
    b.add(cat(parts), col);
    for (const e of tips) b.add(kind === 1 ? G.tr(G.ell(h * .035, h * .022, h * .035, 6, 4), e.x, e.y + h * .01, e.z) : G.tr(G.ell(h * .018, h * .045, h * .018, 5, 4), e.x, e.y + h * .03, e.z), tip);
    return b.geo({ao: .6, aoH: .5, wave: (x, y) => y / h * .8});
  },
  prototaxites(h = 6, r = .5) { return mk().add(G.loft([[0, -.2, 0, r * 1.15], [0, .3, 0, r], [0, h * .5, 0, r * .95], [0, h * .93, 0, r * .85], [0, h, 0, r * .45]], 12, true), (x, y, z, c) => { c.set('#b9a88a').multiplyScalar(.82 + .18 * Math.sin(y * 3.3 + vnoise(x * 4, z * 4) * 2)); }).geo({ao: .6, aoH: .3}); },
  stromatolite(r = 1, h = .6, col = '#8a7a62', top = '#5f6a3a') { const C = new T3.Color(col), Tc = new T3.Color(top); return mk().add(G.organic(G.ell(r, h, r * rr(.8, 1.1), 14, 8), r * .12, 2 / r), (x, y, z, c) => { c.copy(C).multiplyScalar(.8 + .22 * Math.sin(y * 40 / h)); c.lerp(Tc, smooth(h * .55, h * .95, y)); }).geo({ao: .6, aoH: .7}); },
  crinoid(h = 1, acol = '#c4704a', scol = '#d8c6a0') {
    const b = mk(), bx = rr(-.1, .1) * h;
    b.add(G.loft([[0, 0, 0, .02 * h], [bx * .5, h * .5, 0, .016 * h], [bx, h, 0, .016 * h]], 5, false), (x, y, z, c) => { c.set(scol); if (Math.sin(y * 120) > .6) c.multiplyScalar(.75); });
    b.add(G.tr(G.cone(.05 * h, .1 * h, 6), bx, h - .02 * h, 0).rotateX(PI).translate(0, 2 * h + .06 * h, 0), acol, {k: .8});
    for (let i = 0; i < 10; i++) { const g = G.leaf(.4 * h, .08 * h, 6, -.14 * h, t => .5 + .5 * Math.abs(Math.sin(t * 22))); aim(g, i / 10 * TAU, rr(.15, .5)); g.translate(bx, h + .06 * h, 0); b.add(g, acol, {upN: .5, k: rr(.85, 1.15)}); }
    return b.geo({wave: (x, y) => y / h * .9});
  },
  sponge(h = .6, col = '#d8b46a') { const b = mk(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + rr(0, .5), d = rr(.03, .12), x1 = Math.cos(a) * d, z1 = Math.sin(a) * d, hh = h * rr(.6, 1.1), x2 = x1 * 2.2, z2 = z1 * 2.2, r = rr(.05, .08) * h / .6;
      b.add(G.loft([[0, 0, 0, r * .6], [x1, hh * .5, z1, r], [x2, hh, z2, r * 1.1]], 7, true), col, {k: rr(.85, 1.1)}); b.add(G.tr(G.ell(r * .85, r * .2, r * .85, 7, 3), x2, hh + r * .05, z2), '#4a3020'); }
    return b.geo({ao: .6, aoH: .6, wave: (x, y) => y / h * .3}); },
  coralTab(r = .6, col = '#c7a46c') { const C = new T3.Color(col); return mk().add(G.organic(G.tr(G.ell(r, r * .55, r * rr(.8, 1.1), 16, 8), 0, -r * .1, 0), r * .15, 2 / r), (x, y, z, c) => { c.copy(C); const v = Math.sin(x * 34) + Math.sin(z * 34) + Math.sin(y * 34); if (v > 1.1) c.multiplyScalar(.62); }).geo({ao: .55, aoH: .6}); },
  hornCoral(col = '#b9784a') { const b = mk(); for (let i = 0; i < 4; i++) { const a = LR() * TAU, d = rr(.05, .25), x = Math.cos(a) * d, z = Math.sin(a) * d, l = rr(.2, .35), bx = Math.cos(a) * .12, bz = Math.sin(a) * .12; b.add(G.loft([[x, 0, z, .01], [x + bx * .3, l * .3, z + bz * .3, .03], [x + bx, l * .7, z + bz, .05], [x + bx * 1.1, l, z + bz * 1.1, .065]], 8, true), (xx, y, zz, c) => c.set(col).multiplyScalar(.8 + .25 * Math.sin(y * 90))); b.add(G.tr(G.ell(.055, .012, .055, 8, 3), x + bx * 1.1, l + .005, z + bz * 1.1), '#5a3424'); } return b.geo({}); },
  bryozoan(h = .35, col = '#e0c39a') { const parts = []; const br = (p, dir, len, r, d) => { const e = p.clone().addScaledVector(dir, len); parts.push(G.loft([[p.x, p.y, p.z, r], [e.x, e.y, e.z, r * .9]], 4, false)); if (d === 0) return; for (const s of [-1, 1]) br(e, dir.clone().applyAxisAngle(new T3.Vector3(0, 0, 1), s * .45).applyAxisAngle(new T3.Vector3(0, 1, 0), rr(-.3, .3)).normalize(), len * .8, r * .85, d - 1); };
    br(new T3.Vector3(0, 0, 0), new T3.Vector3(0, 1, 0), h * .3, h * .03, 4); return mk().add(cat(parts), col).geo({wave: (x, y) => y / h * .3}); },
  seaweed(h = .8, col = '#5d6e2a') { const parts = []; for (let i = 0; i < 6; i++) { const g = G.leaf(h * rr(.7, 1.1), .09, 5, 0); g.rotateZ(PI / 2 - rr(0, .3)); g.rotateY(LR() * TAU); parts.push(g); } return mk().add(cat(parts), col, {upN: .3}).geo({wave: (x, y) => y / h}); },
  charnia(h = .5, col = '#c9b08a') { // fronda di Ediacara
    const b = mk(); const g = new T3.PlaneGeometry(1, 1, 2, 22), p = g.attributes.position;
    for (let v = 0; v < p.count; v++) { const t = p.getY(v) + .5, x = p.getX(v); const w = Math.sin(PI * Math.min(1, t * 1.05)) * .38 * h * (t < .1 ? t * 8 : 1); p.setXYZ(v, x * w, h * .15 + t * h * .85, Math.abs(x) * .04 * h + Math.sin(t * 60) * .006 * h); }
    g.computeVertexNormals(); b.add(g, (x, y, z, c) => { c.set(col).multiplyScalar(.8 + .25 * Math.sin(y / h * 70 + Math.abs(x) * 30)); }, {upN: .2});
    b.add(G.loft([[0, 0, 0, .012 * h], [0, h * .16, 0, .01 * h]], 5, false), col, {k: .8});
    b.add(G.tr(G.ell(.08 * h, .02 * h, .08 * h, 8, 4), 0, 0, 0), col, {k: .7});
    return b.geo({wave: (x, y) => y / h * .9});
  },
  // tronco caduto
  log(len = 8, r = .4, col = '#4e3d2c') { const g = G.loft([[-len / 2, 0, 0, r], [0, 0, rr(-.3, .3), r * .95], [len / 2, 0, 0, r * .85]], 9, true); return mk().add(G.organic(g, r * .2, 1.5), banded(col, 3, .25, 0)).geo({ao: .6, aoH: .6}); }
};

/* ---------- animali ---------- */
// zampa: dall'anca al piede, con ginocchio e caviglia
function leg(b, x, z, hip, r, col, ph, o = {}) {
  const kn = o.kn != null ? o.kn : 0, an = o.an != null ? o.an : 0, zf = o.zf != null ? o.zf : z, ft = o.ft != null ? o.ft : r * .7;
  const pts = [[x, hip, z, r * 1.1, r], [x + kn, hip * .52, lerp(z, zf, .5), r * .7], [x + an, hip * .14, zf, r * .52], [x + an + ft, .03, zf, r * .4, r * .5]];
  b.add(G.loft(pts, 7, true), col, {leg: ph, hip, belly: o.belly});
}
function legs4(b, xf, xh, zf, zh, hf, hh, rf, rh, col, o = {}) {
  leg(b, xh, zh, hh, rh, col, 0, Object.assign({kn: hh * .14, an: -hh * .12}, o.h || {}));
  leg(b, xh, -zh, hh, rh, col, PI, Object.assign({kn: hh * .14, an: -hh * .12}, o.h || {}));
  leg(b, xf, zf, hf, rf, col, PI / 2, Object.assign({kn: -hf * .04, an: 0}, o.f || {}));
  leg(b, xf, -zf, hf, rf, col, PI * 1.5, Object.assign({kn: -hf * .04, an: 0}, o.f || {}));
}
const eyes = (b, x, y, z, r, col = '#111') => { b.add(G.tr(G.ball(r, 6, 4), x, y, z), col); b.add(G.tr(G.ball(r, 6, 4), x, y, -z), col); };
const shag = (col, f = 5, a = .35) => { const C = new T3.Color(col); return (x, y, z, c) => c.copy(C).multiplyScalar(1 - a / 2 + a * vnoise(x * f + 7, y * f * 1.7 + z * f)); };
const tailW = (x0, x1, amt = 1) => (x, y, z) => smooth(x0, x1, x) * amt;

const AN = {
  theropod(o) {
    const s = o.s || 1, hd = o.hd || 1, gi = o.g || 1, b = mk(), C = new T3.Color(o.col), D = new T3.Color(o.dark || o.col);
    const cf = (x, y, z, c) => { c.copy(C); if (o.str && Math.sin(x / s * 8) > .3 && y > 1.15 * s) c.lerp(D, .7); else if (y > 1.3 * s) c.lerp(D, .4); };
    const hx = 1.35, hy = 1.62;
    const sp = [[-2.6, .98, .03, .03], [-1.9, 1.05, .09 * gi, .08 * gi], [-1.1, 1.14, .17 * gi, .14 * gi], [-.4, 1.2, .27 * gi, .22 * gi], [0, 1.22, .31 * gi, .26 * gi], [.5, 1.26, .33 * gi, .27 * gi], [.9, 1.34, .26 * gi, .21 * gi], [1.15, 1.48, .15 * gi * hd, .13 * gi * hd], [hx, hy, .13 * hd, .11 * hd],
      [hx + .14 * hd, hy + .04 * hd, .18 * hd, .13 * hd], [hx + .4 * hd, hy + .01 * hd, .15 * hd, .1 * hd], [hx + .62 * hd, hy - .04 * hd, .09 * hd, .07 * hd], [hx + .7 * hd, hy - .05 * hd, .04 * hd, .04 * hd]];
    b.add(G.loft(S(sp, s), 10), cf, {belly: o.bel});
    b.add(G.loft(S([[hx + .05 * hd, hy - .1 * hd, .09 * hd, .08 * hd], [hx + .4 * hd, hy - .1 * hd, .06 * hd, .07 * hd], [hx + .62 * hd, hy - .1 * hd, .03 * hd, .05 * hd]], s), 7), o.bel || o.col, {k: .9});
    eyes(b, (hx + .3 * hd) * s, (hy + .08 * hd) * s, .1 * hd * s, .026 * hd * s, '#1a140c');
    for (const zz of [-1, 1]) { const z = zz * .2 * gi;
      b.add(G.loft(S([[0, 1.18, z, .16 * gi, .13 * gi], [.24, .66, z, .095 * gi, .095 * gi], [-.1, .2, z * 1.05, .06 * gi, .06 * gi], [.14, .02, z * 1.05, .045 * gi, .07 * gi]], s), 7, true), cf, {leg: zz > 0 ? 0 : PI, hip: 1.18 * s});
      const al = o.arm || 1; b.add(G.loft(S([[.95, 1.2, zz * .16 * gi, .045, .045], [.95 + .12 * al, 1.02, zz * .2 * gi, .035, .035], [.95 + .3 * al, 1.04, zz * .18 * gi, .025, .025]], s), 5, true), cf); }
    if (o.crest) b.add(G.loft(S([[hx + .1 * hd, hy + .14 * hd, .02, .015], [hx + .45 * hd, hy + .1 * hd, .03, .015]], s), 5), o.crest);
    return b.geo({ao: .75, aoH: .35, wave: tailW(-.4 * s, -2.6 * s, 1)});
  },
  sauropod(o) { // o.kind = 'brachio' | 'diplo'
    const b = mk(), br = o.kind === 'brachio', C = new T3.Color(o.col), D = new T3.Color(o.dark || o.col);
    const cf = (x, y, z, c) => { c.copy(C).lerp(D, smooth(br ? 6.4 : 4.4, br ? 7.2 : 5.2, y) * .6); if (o.str && Math.sin(x * 1.3) > .5 && y > (br ? 6 : 4.2)) c.lerp(D, .5); };
    const sp = br ? [[-10, 3.4, .08, .08], [-7, 4.3, .35, .3], [-4, 5.3, .9, .8], [-2.2, 5.8, 1.5, 1.3], [0, 6.1, 1.8, 1.5], [2.2, 6.8, 1.5, 1.3], [3.4, 7.8, .95, .85], [4.4, 9.5, .62, .52], [5.2, 11.3, .46, .4], [5.8, 12.7, .38, .34], [6.3, 13.15, .4, .3], [6.9, 12.95, .29, .24], [7.35, 12.75, .19, .17]]
      : [[-15, 2, .06, .06], [-11, 2.8, .2, .2], [-7, 3.7, .5, .45], [-4, 4.3, .9, .8], [-1.8, 4.5, 1.3, 1.1], [0, 4.3, 1.5, 1.25], [1.8, 4.0, 1.25, 1.05], [3, 4.0, .75, .65], [5.5, 4.2, .5, .42], [8, 4.4, .36, .3], [10, 4.3, .28, .24], [10.8, 4.15, .27, .22], [11.4, 4.05, .19, .16], [11.8, 4.0, .13, .12]];
    b.add(G.loft(sp.map(p => [p[0], p[1], 0, p[2], p[3]]), 12), cf, {belly: o.bel});
    if (br) b.add(G.tr(G.ell(.32, .25, .22, 8, 5), 6.4, 13.45, 0), o.dark || o.col);
    const e = br ? [6.75, 13.1, .2] : [11.2, 4.12, .16]; eyes(b, e[0], e[1], e[2], .06, '#111');
    if (br) legs4(b, 2.1, -2.3, .85, .95, 6.0, 5.0, .55, .65, cf, {f: {kn: .1, an: .15, ft: .3}, h: {kn: .4, an: -.2, ft: .35}});
    else legs4(b, 1.6, -1.8, .8, .9, 3.5, 4.0, .45, .55, cf, {f: {kn: .1, an: .1, ft: .3}, h: {kn: .4, an: -.25, ft: .35}});
    return b.geo({ao: .7, aoH: .35, wave: tailW(br ? -4 : -5, br ? -10 : -15, br ? .8 : 1.4)});
  },
  stego(o = {}) {
    const b = mk(), col = o.col || '#7d7a52';
    const sp = [[-4.2, 1.4, .06, .06], [-3, 1.95, .2, .18], [-1.6, 2.5, .55, .45], [-.6, 2.7, .8, .66], [.4, 2.45, .8, .66], [1.3, 1.8, .6, .5], [2.1, 1.2, .28, .25], [2.6, .95, .2, .17], [3.0, .85, .1, .1]];
    b.add(G.loft(sp.map(p => [p[0], p[1], 0, p[2], p[3]]), 11), mottled(col, 1.6, .25), {belly: '#b8b088'});
    eyes(b, 2.7, 1.0, .14, .03);
    const yAt = x => { for (let i = 0; i < sp.length - 1; i++) if (x >= sp[i][0] && x <= sp[i + 1][0]) { const t = (x - sp[i][0]) / (sp[i + 1][0] - sp[i][0]); return lerp(sp[i][1] + sp[i][2], sp[i + 1][1] + sp[i + 1][2], t); } return 1; };
    const PCol = o.plate || '#b0603a';
    for (let i = 0; i < 17; i++) { const x = -3.4 + i * .32, hgt = Math.sin(clamp01((x + 3.6) / 5.6) * PI) * .85 + .15, w = hgt * .75; if (x > 2) break;
      const g = new T3.ExtrudeGeometry(new T3.Shape([[-w * .5, 0], [-w * .45, hgt * .5], [0, hgt], [w * .45, hgt * .55], [w * .5, 0]].map(p => new T3.Vector2(p[0], p[1]))), {depth: .05, bevelEnabled: false});
      g.translate(x, yAt(x) - .12, (i % 2 ? 1 : -1) * .08 - .025); const y0 = yAt(x); b.add(g, (xx, y, z, c) => c.set(PCol).lerp(new T3.Color('#e2c070'), smooth(y0 + .1, y0 + hgt, y) * .6)); }
    for (const [z, a] of [[.12, .5], [-.12, -.5], [.1, .7], [-.1, -.7]]) { const sx = -3.9 + Math.abs(a) * .5; b.add(G.loft([[sx, 1.6, z, .07], [sx - .45, 1.75, z + a * 1.1, .01]], 5, true), '#d8c8a0'); }
    legs4(b, 1.2, -.7, .45, .55, 1.4, 2.25, .24, .34, col, {f: {kn: .05, an: .05, ft: .15}, h: {kn: .25, an: -.15, ft: .2}});
    return b.geo({ao: .7, aoH: .4, wave: tailW(-1.6, -4.2, .8)});
  },
  ceratops(o = {}) {
    const b = mk(), col = o.col || '#6f6a4a';
    b.add(G.loft([[-4.2, 1.2, 0, .08], [-3.2, 1.75, 0, .25], [-2, 2.3, 0, .62, .55], [-1, 2.5, 0, .98, .88], [0, 2.4, 0, 1.12, 1.02], [1.1, 2.15, 0, .95, .85], [1.9, 1.85, 0, .62, .55], [2.4, 1.78, 0, .56, .46], [3.1, 1.45, 0, .38, .3], [3.55, 1.12, 0, .2, .14], [3.7, 1.0, 0, .08, .06]], 11), mottled(col, 1.4, .3), {belly: '#a59e7c'});
    b.add(G.tr(G.sc(G.ball(1, 14, 8), .18, 1.15, 1.15), 0, 0, 0).rotateZ(.95).translate(1.9, 2.75, 0), (x, y, z, c) => { c.set('#8a6a44'); if (Math.hypot(y - 2.75, z) > .95) c.set('#c98a4a'); });
    for (const z of [-1, 1]) b.add(G.loft([[2.75, 2.05, z * .3, .13], [3.2, 2.45, z * .37, .08], [3.65, 2.8, z * .4, .015]], 6, true), '#e5dcc0');
    b.add(G.loft([[3.35, 1.55, 0, .1], [3.5, 1.85, 0, .015]], 6, true), '#e5dcc0');
    eyes(b, 2.85, 1.85, .33, .04);
    legs4(b, 1.2, -1.0, .6, .62, 1.6, 2.2, .34, .45, col, {f: {kn: .08, an: .05, ft: .2, zf: .75}, h: {kn: .25, an: -.15, ft: .25}});
    return b.geo({ao: .7, aoH: .35, wave: tailW(-2, -4.2, .5)});
  },
  hadro(o = {}) {
    const b = mk(), col = o.col || '#7a7458';
    b.add(G.loft([[-6.5, 2.6, 0, .06], [-4.5, 3.05, 0, .3, .28], [-2.4, 3.45, 0, .72, .6], [-1, 3.55, 0, 1.0, .85], [.4, 3.25, 0, 1.05, .9], [1.6, 2.7, 0, .8, .7], [2.5, 2.6, 0, .4, .36], [3.1, 2.9, 0, .33, .3], [3.4, 2.95, 0, .33, .28], [4.0, 2.65, 0, .25, .23], [4.55, 2.45, 0, .14, .26]], 11), banded(col, 2.2, .25, 0), {belly: '#c2b896'});
    eyes(b, 3.55, 3.05, .26, .04);
    legs4(b, 1.6, -1, .5, .55, 2.25, 3.25, .17, .5, col, {f: {kn: .1, an: .1, ft: .12}, h: {kn: .45, an: -.35, ft: .3}});
    return b.geo({ao: .7, aoH: .35, wave: tailW(-2.4, -6.5, 1)});
  },
  pterosaur(o) { // o.span, o.neck, o.beak, o.tail, o.crest
    const b = mk(), s = o.span / 2, col = o.col || '#6d5a4a', wcol = o.wcol || '#7a5a48';
    b.add(G.loft([[-.2 * s, 0, 0, .03 * s], [0, 0, 0, .06 * s, .055 * s], [.12 * s, .01 * s, 0, .05 * s]], 7), col, {belly: '#cfc0a8'});
    const nl = (o.neck || .15) * s, bl = (o.beak || .2) * s;
    b.add(G.loft([[.12 * s, .01 * s, 0, .03 * s], [.12 * s + nl, .04 * s, 0, .022 * s], [.12 * s + nl + .04 * s, .05 * s, 0, .03 * s], [.12 * s + nl + bl, .02 * s, 0, .004 * s]], 6), col);
    if (o.crest) b.add(G.shape([[0, 0], [-.18 * s, .14 * s], [.06 * s, .02 * s]]).translate(.12 * s + nl + .05 * s, .06 * s, 0), o.crest);
    if (o.tail) { b.add(G.loft([[-.2 * s, 0, 0, .012 * s], [-.2 * s - o.tail * s, 0, 0, .004 * s]], 4), col); b.add(G.shape([[0, 0], [-.04 * s, .03 * s], [-.08 * s, 0], [-.04 * s, -.03 * s]]).rotateX(PI / 2).translate(-.2 * s - o.tail * s, 0, 0), o.crest || col); }
    for (const z of [-1, 1]) { const w = G.shape([[.1 * s, 0], [.05 * s, .5 * s], [-.05 * s, 1 * s], [-.12 * s, .55 * s], [-.22 * s, .12 * s], [-.2 * s, 0]]); w.rotateX(PI / 2); if (z < 0) w.scale(1, 1, -1); b.add(w, wcol, {wing: .55, upN: .4}); }
    return b.geo({});
  },
  ichthyo(o = {}) {
    const b = mk(), col = o.col || '#4a5660';
    b.add(G.loft([[-1.45, 0, 0, .05, .02], [-1.1, 0, 0, .1, .06], [-.6, .02, 0, .26, .2], [0, .03, 0, .36, .28], [.5, .02, 0, .3, .24], [.9, 0, 0, .18, .15], [1.15, -.01, 0, .07, .06], [1.6, -.02, 0, .03, .025]], 11), col, {belly: '#cfd4d0'});
    b.add(G.shape([[0, 0], [.35, -.55], [.15, -.05], [.35, .55]]).translate(-1.75, 0, 0), col);
    b.add(G.shape([[-.25, 0], [.05, .36], [.25, 0]]).translate(-.15, .3, 0), col);
    for (const [x, l, z] of [[.55, .5, .22], [-.55, .28, .15]]) for (const sgn of [-1, 1]) { const f = G.leaf(l, l * .32, 3, 0); f.rotateY(sgn * (PI / 2 + .45)); f.rotateX(sgn * .35); f.translate(x, -.12, sgn * z); b.add(f, col, {wing: .5, k: .9}); }
    b.add(G.tr(G.ball(.075, 8, 6), .95, .06, .12), '#e8e0c8'); b.add(G.tr(G.ball(.075, 8, 6), .95, .06, -.12), '#e8e0c8');
    eyes(b, .99, .06, .13, .045);
    return b.geo({wave: tailW(-.2, -1.8, 1)});
  },
  plesio(o = {}) {
    const b = mk(), col = o.col || '#5c6a5e';
    b.add(G.loft([[-1.5, 0, 0, .04], [-1.1, 0, 0, .12], [-.5, 0, 0, .34, .5], [.2, 0, 0, .38, .55], [.8, .02, 0, .25, .3], [1.3, .1, 0, .13], [2.2, .25, 0, .1], [2.8, .32, 0, .08], [3.0, .33, 0, .1, .09], [3.25, .3, 0, .05]], 11), col, {belly: '#cfd2c4'});
    eyes(b, 3.08, .38, .07, .025);
    for (const [x, l] of [[.55, 1.0], [-.65, .9]]) for (const sgn of [-1, 1]) { const f = G.leaf(l, l * .26, 4, 0); f.rotateY(sgn * (PI / 2 + .3)); f.translate(x, -.08, sgn * .4); b.add(f, col, {wing: .55, k: .9}); }
    return b.geo({wave: (x) => smooth(1, 3, x) * .25 + smooth(-.6, -1.5, x) * .6});
  },
  ammonite(r = .3, col = '#c8a070', ribs = 28) {
    const pts = [], b = mk(), a = .12 * r, k = .19;
    for (let i = 0; i <= 44; i++) { const th = i / 44 * 3.2 * PI, rad = a * Math.exp(k * th); pts.push([Math.cos(th) * rad, Math.sin(th) * rad + r * .6, 0, rad * .42, rad * .3]); }
    const C = new T3.Color(col);
    b.add(G.loft(pts, 8, true), (x, y, z, c) => { c.copy(C).multiplyScalar(.8 + .25 * Math.abs(Math.sin(Math.atan2(y - r * .6, x) * ribs / 2))); });
    const last = pts[pts.length - 1]; for (let i = 0; i < 8; i++) { const ang = i / 8 * TAU; b.add(G.loft([[last[0], last[1], 0, r * .03], [last[0] + r * .35, last[1] - r * .1 + Math.cos(ang) * r * .12, Math.sin(ang) * r * .12, r * .012]], 4, true), '#a0624a'); }
    eyes(b, last[0] + r * .05, last[1] + r * .1, r * .12, r * .03);
    const g = b.geo({wave: (x) => Math.max(0, x - last[0]) / r * .4}); g.rotateY(PI); g.translate(0, -r * .6, 0); return g;
  },
  belemnite(col = '#b78a6a') { const b = mk(); b.add(G.loft([[-.25, 0, 0, .004], [-.18, 0, 0, .02], [-.08, 0, 0, .035], [.06, 0, 0, .04], [.12, 0, 0, .03]], 8), col, {belly: '#e8d6c0'}); for (const z of [-1, 1]) b.add(G.shape([[0, 0], [-.07, z * .05], [-.09, 0]]).rotateX(PI / 2).translate(-.06, 0, 0), col); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; b.add(G.loft([[.12, 0, 0, .01], [.22, Math.cos(a) * .02, Math.sin(a) * .02, .003]], 3), '#9a6a50'); } eyes(b, .1, .02, .035, .01); return b.geo({wave: (x) => Math.max(0, x - .12) * 2}); },
  fish(o) { // o.L lunghezza, o.h altezza, o.w larghezza, tail 'fork'|'hetero', o.col, o.bel, o.fins
    const L = o.L, h = o.h || L * .22, w = o.w || h * .55, b = mk();
    const sp = o.sp || [[-.5, 0, .04, .03], [-.36, 0, .18, .1], [-.1, .02, .45, .45], [.15, .02, .5, .5], [.36, 0, .36, .38], [.5, -.01, .1, .14]];
    b.add(G.loft(sp.map(p => [p[0] * L, p[1] * L, 0, p[2] * h, p[3] * w]), 10), o.cf || o.col, {belly: o.bel});
    const tl = o.tail || 'fork', tx = -.48 * L;
    if (tl === 'fork') b.add(G.shape([[0, 0], [-.22 * L, .55 * h], [-.12 * L, 0], [-.22 * L, -.55 * h]]).translate(tx, 0, 0), o.fcol || o.col);
    else if (tl === 'hetero') b.add(G.shape([[0, 0], [-.3 * L, .75 * h], [-.15 * L, 0], [-.12 * L, -.35 * h]]).translate(tx, 0, 0), o.fcol || o.col);
    else if (tl === 'round') b.add(G.shape([[0, 0], [-.12 * L, .3 * h], [-.2 * L, 0], [-.12 * L, -.3 * h]]).translate(tx, 0, 0), o.fcol || o.col);
    if (o.dorsal !== false) b.add(G.shape([[-.12 * L, 0], [0, .45 * h], [.08 * L, 0]]).translate((o.dx || 0) * L, .42 * h, 0), o.fcol || o.col);
    if (o.dorsal2) b.add(G.shape([[-.08 * L, 0], [-.02 * L, .35 * h], [.04 * L, 0]]).translate(-.25 * L, .3 * h, 0), o.fcol || o.col);
    if (o.pect !== false) for (const s of [-1, 1]) { const f = G.leaf(.2 * L * (o.pect || 1), .07 * L * (o.pect || 1), 3, 0); f.rotateY(s * (PI / 2 + .9)); f.rotateX(s * .4); f.translate(.25 * L, -.15 * h, s * .3 * w); b.add(f, o.fcol || o.col, {k: .9}); }
    eyes(b, .4 * L, .08 * h, .3 * w, Math.max(.008, .04 * h), '#111');
    if (o.extra) o.extra(b, L, h, w);
    return b.geo({wave: tailW(.1 * L, -.6 * L, 1)});
  },
  // artropodi a segmenti (trilobiti, Arthropleura, Marrella...)
  trilobite(L = .3, col = '#7a6248') {
    const b = mk(), C = new T3.Color(col);
    b.add(G.tr(G.sc(G.ball(1, 14, 7, 0, TAU, 0, PI / 2), L * .26, L * .1, L * .36), L * .3, 0, 0), C.getHex(), {k: 1});
    for (const z of [-1, 1]) b.add(G.loft([[L * .2, .005, z * L * .33, L * .02], [-L * .05, .005, z * L * .3, L * .005]], 4, true), col, {k: .9});
    for (let i = 0; i < 10; i++) { const x = L * (.15 - i * .05), wd = L * .3 * (1 - i * .045); b.add(G.tr(G.sc(G.ball(1, 10, 5), L * .03, L * .065, wd), x, 0, 0), col, {k: .85 + (i % 2) * .15}); }
    b.add(G.tr(G.sc(G.ball(1, 10, 5), L * .1, L * .06, L * .17), -L * .42, 0, 0), col, {k: .95});
    b.add(G.tr(G.sc(G.ball(1, 8, 5), L * .5, L * .08, L * .06), -L * .05, .02 * L, 0), col, {k: 1.15});
    eyes(b, L * .32, L * .07, L * .12, L * .025, '#3a3020');
    for (const z of [-1, 1]) b.add(G.loft([[L * .5, .005, z * L * .05, L * .006], [L * .75, .01, z * L * .2, L * .003]], 3, true), col);
    return b.geo({});
  },
  arthropleura() {
    const b = mk(); const n = 28, L = 2.2;
    for (let i = 0; i < n; i++) { const x = L / 2 - i * L / n, w = .25 * (i < 3 ? .6 + i * .13 : i > n - 4 ? 1 - (i - n + 4) * .15 : 1);
      b.add(G.tr(G.sc(G.ball(1, 10, 5), L / n * .65, .07, w), x, .15, 0), (xx, y, z, c) => { c.set('#5a4a38'); if (Math.abs(z) > w * .55) c.set('#9a7a50'); if (Math.abs(z) < .03) c.multiplyScalar(.8); });
      if (i > 1 && i < n - 1) for (const s of [-1, 1]) b.add(G.loft([[x, .13, s * w * .7, .015], [x + .02, .08, s * (w + .08), .012], [x + .02, 0, s * (w + .12), .008]], 4, true), '#4a3a28', {leg: (i * 1.1 + (s > 0 ? 0 : PI)) % TAU, hip: .15}); }
    b.add(G.tr(G.sc(G.ball(1, 10, 6), .1, .08, .15), L / 2 + .07, .15, 0), '#4a3a2a');
    for (const s of [-1, 1]) b.add(G.loft([[L / 2 + .12, .17, s * .05, .01], [L / 2 + .3, .22, s * .14, .005]], 3), '#4a3a2a');
    return b.geo({wave: (x) => .3});
  },
  dragonfly(span = .7) { // Meganeura: corpo
    const b = mk(), s = span; b.add(G.loft([[-.42 * s, 0, 0, .012 * s], [-.1 * s, 0, 0, .018 * s], [.03 * s, 0, 0, .035 * s], [.1 * s, 0, 0, .032 * s]], 6), (x, y, z, c) => { c.set('#2a4a3a'); if (Math.sin(x / s * 90) > .7) c.set('#7a6a3a'); });
    b.add(G.tr(G.ball(.04 * s, 8, 6), .13 * s, .005, 0), '#3a2a1a'); eyes(b, .14 * s, .01 * s, .025 * s, .022 * s, '#5a3020');
    return b.geo({wave: (x) => Math.max(0, -x) * .3});
  },
  dragonWings(span = .7) { const b = mk(), s = span / 2; for (const x of [.06 * span, -.02 * span]) for (const z of [-1, 1]) { const w = G.shape([[0, 0], [.04 * s, .5 * s], [.02 * s, .98 * s], [-.06 * s, 1 * s], [-.08 * s, .4 * s], [-.04 * s, 0]]); w.rotateX(PI / 2); if (z < 0) w.scale(1, 1, -1); w.translate(x, .015 * span, 0); b.add(w, (xx, y, zz, c) => { c.set('#d8e0dc'); if (Math.abs(zz) > s * .9) c.set('#6a5a40'); }, {wing: 1, wingSign: x > 0 ? 1 : -1, upN: .3}); } return b.geo({}); },
  smallArthro(L = .03, col = '#6a4a2a', nl = 4) { // piccolo ragno o millepiedi
    const b = mk(); b.add(G.tr(G.ell(L * .5, L * .25, L * .35, 8, 5), -L * .2, L * .3, 0), col); b.add(G.tr(G.ell(L * .3, L * .2, L * .28, 8, 5), L * .3, L * .3, 0), col, {k: .8});
    for (let i = 0; i < nl; i++) for (const s of [-1, 1]) { const x = L * (.4 - i * .18); b.add(G.loft([[x, L * .3, s * L * .2, L * .04], [x + L * .1, L * .45, s * L * .6, L * .03], [x + L * .15, 0, s * L * .85, L * .02]], 3, true), col, {leg: (i * 1.6 + (s > 0 ? 0 : PI)) % TAU, hip: L * .4}); }
    return b.geo({});
  },
  synapsid(o) { // Dimetrodon / Edaphosaurus: zampe a "lucertola" e vela sul dorso
    const b = mk(), ed = o.kind === 'edapho', col = o.col;
    const sp = ed ? [[-1.6, .25, .03, .03], [-1.0, .32, .08, .08], [-.5, .42, .2, .26], [0, .46, .26, .32], [.5, .45, .22, .27], [.8, .42, .12, .13], [.95, .42, .1, .1], [1.1, .38, .07, .07]]
      : [[-1.6, .22, .03, .03], [-1.0, .32, .08, .07], [-.5, .42, .17, .2], [0, .46, .2, .24], [.5, .46, .18, .21], [.78, .44, .12, .13], [1.0, .45, .12, .11], [1.25, .4, .09, .08], [1.42, .34, .05, .05]];
    b.add(G.loft(sp.map(p => [p[0], p[1], 0, p[2], p[3]]), 10), mottled(col, 3, .3), {belly: o.bel || '#b8a888'});
    eyes(b, ed ? 1.0 : 1.15, ed ? .45 : .5, ed ? .07 : .09, .02);
    if (!ed) for (const z of [-1, 1]) b.add(G.tr(G.cone(.012, .05, 4), 1.3, .3, z * .05).rotateX(PI).translate(0, .63, 0), '#eee');
    const x0 = -.55, x1 = .65, n = ed ? 16 : 18, sailH = ed ? .7 : 1.05;
    const sh = x => Math.sin(clamp01((x - x0) / (x1 - x0)) * PI) * sailH;
    const mem = new T3.PlaneGeometry(1, 1, n, 1), p = mem.attributes.position;
    for (let v = 0; v < p.count; v++) { const x = x0 + (p.getX(v) + .5) * (x1 - x0), t = p.getY(v) + .5; p.setXYZ(v, x, .55 + t * sh(x) * (ed ? .95 : .98), 0); }
    mem.computeVertexNormals(); b.add(mem, o.sail || '#a0503a', {upN: 0});
    const mem2 = mem.clone(); mem2.rotateY(PI); mem2.translate(x0 + x1, 0, 0); b.add(mem2, o.sail || '#a0503a');
    for (let i = 0; i <= n; i += 2) { const x = x0 + i / n * (x1 - x0), hgt = sh(x); if (hgt < .05) continue; b.add(G.loft([[x, .5, 0, .016], [x, .55 + hgt, 0, .008]], 4, true), '#e0cfae');
      if (ed) for (let j = 1; j < 4; j++) b.add(G.loft([[x, .55 + hgt * j / 4, -.05, .007], [x, .55 + hgt * j / 4, .05, .007]], 3, true), '#e0cfae'); }
    for (const [x, hp, ph] of [[.45, .36, PI / 2], [-.45, .38, 0]]) for (const s of [-1, 1]) {
      b.add(G.loft([[x, hp, s * .16, .07], [x + .05, hp * .65, s * .4, .055], [x + .08, .14, s * .43, .045], [x + .16, .02, s * .45, .035]], 6, true), col, {leg: (ph + (s > 0 ? 0 : PI)) % TAU, hip: hp + .05}); }
    return b.geo({ao: .75, aoH: .4, wave: tailW(-.4, -1.6, 1)});
  },
  rhyncho(o = {}) { const b = mk(), col = o.col || '#7a6a58';
    b.add(G.loft([[-.75, .2, 0, .03], [-.5, .3, 0, .08], [-.3, .38, 0, .18, .2], [0, .42, 0, .22, .27], [.3, .4, 0, .18, .22], [.42, .4, 0, .12, .14], [.5, .4, 0, .13, .16], [.62, .36, 0, .09, .1], [.7, .3, 0, .04, .05]], 9), mottled(col, 6, .3), {belly: '#c0b090'});
    eyes(b, .55, .45, .1, .016);
    for (const [x, hp, ph] of [[.27, .3, PI / 2], [-.28, .32, 0]]) for (const s of [-1, 1]) b.add(G.loft([[x, hp, s * .15, .05], [x + .04, hp * .55, s * .28, .04], [x + .06, .02, s * .3, .03, .04]], 6, true), col, {leg: (ph + (s > 0 ? 0 : PI)) % TAU, hip: hp + .05});
    return b.geo({ao: .75, aoH: .4, wave: tailW(-.3, -.75, 1)}); },
  cynodont(o = {}) { const b = mk(), col = o.col || '#6e5a44';
    b.add(G.loft([[-1.05, .42, 0, .03], [-.8, .55, 0, .08], [-.55, .62, 0, .2, .18], [0, .63, 0, .25, .23], [.45, .62, 0, .21, .19], [.7, .64, 0, .13, .12], [.88, .63, 0, .13, .12], [1.12, .56, 0, .07, .07]], 9), shag(col, 6, .3), {belly: '#b8a080'});
    eyes(b, .95, .7, .09, .018);
    legs4(b, .45, -.55, .17, .17, .5, .52, .07, .085, col, {f: {kn: -.05, an: .03, ft: .06}, h: {kn: .1, an: -.06, ft: .07}});
    return b.geo({ao: .75, aoH: .4, wave: tailW(-.55, -1.05, 1)}); },
  proboscid(o) { // mammut (tusk 'up'), Deinotherium (tusk 'down')
    const b = mk(), s = o.s || 1, col = o.col, dn = o.tusk === 'down', hair = o.hair ? shag(col, 4, .45) : mottled(col, 2.5, .2);
    const sp = dn ? [[-2.1, 1.8, .04, .04], [-1.9, 2.3, .12, .1], [-1.6, 2.65, .72, .7], [-.6, 2.9, .95, .85], [.5, 3.15, .95, .85], [1.1, 3.05, .75, .7], [1.45, 3.15, .55, .5], [1.75, 3.0, .5, .45], [1.95, 2.65, .36, .32]]
      : [[-2.3, 1.6, .05, .05], [-2.0, 2.2, .13, .12], [-1.7, 2.35, .72, .76], [-.7, 2.6, 1.0, .95], [.5, 2.95, 1.0, .9], [1.1, 2.85, .82, .75], [1.45, 3.2, .7, .6], [1.85, 2.95, .62, .52], [2.05, 2.5, .42, .38]];
    b.add(G.loft(S(sp, s), 12), hair, {belly: o.bel});
    const tr = dn ? [[1.95, 2.5, .26], [2.1, 1.9, .18], [2.15, 1.4, .13], [2.25, 1.15, .08]] : [[2.1, 2.1, .26], [2.2, 1.4, .18], [2.15, .8, .12], [2.25, .35, .08], [2.38, .25, .06]];
    b.add(G.loft(S(tr, s), 9, true), hair, {wave: (x, y) => smooth(2.2 * s, .3 * s, y) * .5});
    for (const z of [-1, 1]) {
      const tk = dn ? [[1.95, 2.2, z * .2, .1, .1], [2.1, 1.7, z * .22, .09, .09], [2.0, 1.25, z * .24, .07, .07], [1.75, .95, z * .25, .04, .04]]
        : [[2.0, 2.25, z * .3, .12, .12], [2.6, 1.75, z * .48 * (o.tw || 1), .11, .11], [3.25 * (o.tl || 1), 1.75, z * .55 * (o.tw || 1), .09, .09], [3.55 * (o.tl || 1), 2.25, z * .35 * (o.tw || 1), .07, .07], [3.35 * (o.tl || 1), 2.75, z * .12, .04, .04]];
      b.add(G.loft(S(tk, s), 7, true), '#e8dcc0');
      b.add(G.tr(G.ell(.1 * s, (o.ear || .35) * s, (o.ear || .35) * .8 * s, 8, 6), 1.4 * s, 2.95 * s, z * .62 * s), hair, {k: .85});
    }
    eyes(b, 1.85 * s, 2.85 * s, .4 * s, .04 * s);
    const lc = o.hair ? shag(col, 4, .4) : col;
    legs4(b, .6 * s, -1.35 * s, .5 * s, .5 * s, 2.25 * s, 2.0 * s, .36 * s, .4 * s, lc, {f: {kn: .05 * s, an: 0, ft: .1 * s}, h: {kn: .15 * s, an: -.08 * s, ft: .1 * s}});
    return b.geo({ao: .75, aoH: .35, wave: tailW(-1.8 * s, -2.3 * s, .8)});
  },
  rhino(o = {}) { const b = mk(), col = o.col || '#6a4a30';
    b.add(G.loft([[-1.95, 1.0, 0, .04], [-1.75, 1.35, 0, .1], [-1.45, 1.48, 0, .55, .5], [-.5, 1.58, 0, .72, .62], [.3, 1.78, 0, .68, .56], [.9, 1.55, 0, .5, .45], [1.3, 1.2, 0, .36, .3], [1.7, .95, 0, .26, .23], [1.97, .85, 0, .17, .16]], 11), shag(col, 4, .4), {belly: '#8a6a48'});
    b.add(G.loft([[1.85, .98, 0, .12, .07], [2.1, 1.35, 0, .08, .04], [2.42, 1.9, 0, .015, .01]], 6, true), '#3a2c22');
    b.add(G.loft([[1.55, 1.15, 0, .08, .06], [1.68, 1.48, 0, .012]], 5, true), '#3a2c22');
    for (const z of [-1, 1]) b.add(G.tr(G.ell(.05, .12, .07, 6, 4), 1.25, 1.42, z * .2), col);
    eyes(b, 1.62, 1.1, .2, .022);
    legs4(b, .5, -1.2, .35, .35, 1.15, 1.15, .17, .2, shag(col, 4, .4), {f: {kn: .03, an: 0, ft: .08}, h: {kn: .12, an: -.06, ft: .08}});
    return b.geo({ao: .75, aoH: .35, wave: tailW(-1.7, -2, .5)}); },
  horse(o = {}) { const b = mk(), s = o.s || 1, col = o.col || '#a88a5c', dk = o.dark || '#3a2c20', C = new T3.Color(col), D = new T3.Color(dk), arch = o.arch || 0;
    const cf = (x, y, z, c) => { c.copy(C); if (y < .45 * s) c.lerp(D, .8); };
    b.add(G.loft(S([[-.95, 1.32 + arch * .1, .33, .28], [-.3, 1.3 + arch * .2, .38, .32], [.45, 1.32, .36, .3], [.7, 1.45, .28, .22], [.95, 1.75 - arch * .25, .18, .14], [1.1, 1.9 - arch * .3, .13, .1], [1.35, 1.64 - arch * .3, .11, .09], [1.5, 1.44 - arch * .3, .08, .07]], s), 10), cf, {belly: o.bel || '#d8c8a8'});
    b.add(G.loft(S([[-1.0, 1.35, .06], [-1.15, 1.0, .07], [-1.2, .65, .03]], s), 5, true), dk, {wave: .6});
    if (!o.noMane) b.add(G.loft(S([[.65, 1.62, .05, .03], [.95, 1.92 - arch * .25, .06, .03], [1.1, 2.0 - arch * .3, .04, .02]], s), 4, true), dk);
    for (const z of [-1, 1]) b.add(G.tr(G.cone(.04 * s, .14 * s, 4), 1.12 * s, 1.95 * s - arch * .3 * s, z * .06 * s), col);
    eyes(b, 1.3 * s, (1.75 - arch * .3) * s, .085 * s, .018 * s);
    legs4(b, .48 * s, -.82 * s, .16 * s, .16 * s, 1.08 * s, 1.15 * s, .075 * s, .1 * s, cf, {f: {kn: -.03 * s, an: .02 * s, ft: .05 * s}, h: {kn: .14 * s, an: -.14 * s, ft: .05 * s}});
    return b.geo({ao: .8, aoH: .35}); },
  bison(o = {}) { const b = mk(), col = o.col || '#4a3424';
    b.add(G.loft([[-1.35, 1.45, 0, .42, .38], [-.4, 1.55, 0, .6, .48], [.4, 1.95, 0, .62, .5], [.8, 1.7, 0, .55, .45], [1.1, 1.35, 0, .42, .38], [1.35, 1.05, 0, .3, .27], [1.55, .85, 0, .18, .17]], 10), (x, y, z, c) => { c.set(col).multiplyScalar(x > .3 ? .7 : 1); c.multiplyScalar(.85 + .3 * vnoise(x * 5, y * 7 + z * 5)); }, {belly: '#5a4030'});
    b.add(G.loft([[-1.35, 1.4, 0, .05], [-1.5, .9, 0, .04]], 4, true), col, {wave: .5});
    b.add(G.tr(G.ell(.18, .35, .2, 8, 5), 1.3, .85, 0), '#2a1c14');
    for (const z of [-1, 1]) b.add(G.loft([[1.32, 1.22, z * .22, .06], [1.35, 1.3, z * .5, .045], [1.25, 1.55, z * .62, .012]], 5, true), '#2a2420');
    eyes(b, 1.45, 1.05, .2, .022);
    legs4(b, .6, -1.1, .3, .3, 1.15, 1.15, .12, .14, col, {f: {kn: -.02, an: .02, ft: .06}, h: {kn: .12, an: -.1, ft: .06}});
    return b.geo({ao: .8, aoH: .35}); },
  deer(o = {}) { // Megaloceros (o.mega) o antilope
    const b = mk(), s = o.s || 1, col = o.col || '#8a6a48', C = new T3.Color(col);
    b.add(G.loft(S([[-1.0, 1.8, .38, .32], [-.3, 1.85, .45, .38], [.5, 1.95, .45, .38], [.75, 2.1, .3, .27], [1.0, 2.5, .2, .18], [1.15, 2.7, .16, .13], [1.45, 2.55, .12, .1], [1.62, 2.45, .07, .07]], s), 10), (x, y, z, c) => { c.copy(C); if (o.mega && x > .6 * s && y < 2.6 * s) c.multiplyScalar(.7); }, {belly: o.bel || '#d8c8a8'});
    b.add(G.loft(S([[-1.0, 1.85, .05], [-1.15, 1.6, .04]], s), 4, true), col);
    for (const z of [-1, 1]) b.add(G.tr(G.cone(.05 * s, .2 * s, 4).rotateZ(-.9), 1.12 * s, 2.82 * s, z * .1 * s), col);
    eyes(b, 1.36 * s, 2.66 * s, .1 * s, .018 * s);
    if (o.mega) for (const z of [-1, 1]) { b.add(G.loft([[1.15, 2.85, z * .08, .06], [1.05, 3.0, z * .55, .05], [.95, 3.08, z * .95, .04]], 5, true), '#d0c0a0');
      const pal = G.ell(.62, .05, .4, 10, 5); pal.rotateX(-z * .85); pal.translate(.92, 3.3, z * 1.15); b.add(G.organic(pal, .04, 6), '#d6c6a4');
      for (let i = 0; i < 5; i++) b.add(G.cone(.035, .32, 5).rotateX(-z * .7).translate(.5 + i * .2, 3.45 + Math.sin(i / 4 * PI) * .1, z * (1.45 + Math.sin(i / 4 * PI) * .1)), '#d6c6a4');
      b.add(G.loft([[1.12, 2.95, z * .25, .03], [1.45, 3.05, z * .4, .01]], 4, true), '#d6c6a4'); }
    else if (o.horns) for (const z of [-1, 1]) b.add(G.loft([[1.15 * s, 2.82 * s, z * .05 * s, .025 * s], [1.0 * s, 3.2 * s, z * .08 * s, .01 * s]], 4, true), '#2a2420');
    legs4(b, .52 * s, -.85 * s, .18 * s, .18 * s, 1.35 * s, 1.42 * s, .09 * s, .12 * s, col, {f: {kn: -.03 * s, an: .02 * s, ft: .05 * s}, h: {kn: .16 * s, an: -.16 * s, ft: .05 * s}});
    return b.geo({ao: .8, aoH: .35}); },
  giraffe(o = {}) { const b = mk(), C = new T3.Color('#c99a5a'), D = new T3.Color('#6a3a1e');
    const cf = (x, y, z, c) => { c.copy(C); const v = Math.sin(x * 9 + Math.sin(y * 7) * 1.4) * Math.sin(y * 9 + z * 6 + Math.sin(x * 5)); if (v > .25) c.lerp(D, .85); };
    b.add(G.loft([[-.9, 2.2, 0, .35, .3], [-.3, 2.4, 0, .45, .38], [.45, 2.7, 0, .45, .38], [.7, 3.0, 0, .3, .25], [1.2, 4.0, 0, .18, .16], [1.5, 4.8, 0, .13, .11], [1.6, 5.02, 0, .14, .11], [1.85, 4.88, 0, .1, .08], [2.02, 4.78, 0, .07, .06]], 10), cf, {belly: '#e8dcc0'});
    b.add(G.loft([[-.95, 2.25, 0, .04], [-1.1, 1.3, 0, .025]], 4, true), '#5a3a20', {wave: .5});
    for (const z of [-1, 1]) b.add(G.loft([[1.6, 5.1, z * .05, .025], [1.58, 5.3, z * .06, .03]], 4, true), '#4a3020');
    eyes(b, 1.75, 5.0, .09, .02);
    legs4(b, .5, -.8, .2, .2, 2.25, 2.05, .1, .11, cf, {f: {kn: -.05, an: .03, ft: .06}, h: {kn: .2, an: -.2, ft: .06}});
    return b.geo({ao: .85, aoH: .3}); },
  smilodon(o = {}) { const b = mk(), col = o.col || '#b08a58';
    b.add(G.loft([[-1.0, .82, 0, .05], [-.88, .9, 0, .2], [-.75, .92, 0, .25, .22], [-.2, .88, 0, .28, .24], [.45, 1.0, 0, .3, .26], [.75, 1.05, 0, .2, .18], [.95, 1.05, 0, .17, .16], [1.15, .98, 0, .12, .12], [1.25, .93, 0, .08, .09]], 10), col, {belly: '#e0d0b0'});
    for (const z of [-1, 1]) { b.add(G.tr(G.cone(.022, .22, 5).rotateX(PI), 1.18, 1.1, z * .045), '#f0ead8'); b.add(G.tr(G.cone(.05, .1, 4), .92, 1.17, z * .1), col); }
    eyes(b, 1.12, 1.07, .09, .018, '#3a3010');
    legs4(b, .45, -.7, .16, .16, .72, .76, .1, .1, col, {f: {kn: -.02, an: .02, ft: .07}, h: {kn: .1, an: -.12, ft: .07}});
    return b.geo({ao: .8, aoH: .35}); },
  glypto(o = {}) { const b = mk(), C = new T3.Color(o.col || '#6e5a40'), D = new T3.Color('#3e3020');
    b.add(G.tr(G.ell(1.3, .95, .95, 18, 10), 0, .55, 0), (x, y, z, c) => { c.copy(C); const v = Math.abs(Math.sin(x * 9 + Math.sin(z * 9) * .8)) * Math.abs(Math.sin(z * 9 + y * 4)); if (v < .18) c.lerp(D, .7); });
    b.add(G.loft([[-1.2, .6, 0, .22], [-1.6, .45, 0, .16], [-2.0, .35, 0, .1]], 8, true), (x, y, z, c) => { c.copy(C).multiplyScalar(Math.sin(x * 18) > 0 ? 1 : .7); }, {wave: tailW(-1.3, -2, 1)});
    b.add(G.loft([[1.1, .45, 0, .2], [1.35, .4, 0, .18], [1.55, .32, 0, .1]], 8, true), '#5a4a38'); b.add(G.tr(G.ell(.2, .07, .16, 8, 4), 1.35, .56, 0), C.getHex());
    legs4(b, .7, -.7, .55, .55, .4, .4, .14, .16, '#4a3a28', {f: {kn: 0, an: 0, ft: .05}, h: {kn: 0, an: 0, ft: .05}});
    return b.geo({}); },
  sloth(o = {}) { const b = mk(), col = o.col || '#6a5038', hc = shag(col, 3, .45);
    b.add(G.loft([[-1.6, .1, 0, .12], [-.9, .3, 0, .3], [-.3, 1.2, 0, .75, .8], [0, 2.2, 0, .9, .85], [.15, 3.2, 0, .75, .7], [.2, 3.8, 0, .55, .5], [.3, 4.2, 0, .3, .28], [.5, 4.45, 0, .23, .21], [.78, 4.38, 0, .13, .13]], 11), hc, {wave: (x, y) => smooth(.5, 4.5, y) * .25});
    for (const z of [-1, 1]) { b.add(G.loft([[-.2, 1.3, z * .5, .32], [.1, .6, z * .55, .25], [.0, .05, z * .55, .18, .25]], 7, true), hc);
      b.add(G.loft([[.3, 3.7, z * .55, .2], [.6, 4.5, z * .55, .14], [.9, 5.3, z * .45, .1], [1.05, 5.6, z * .4, .05]], 7, true), hc, {wave: (x, y) => smooth(3.7, 5.6, y) * .5}); }
    eyes(b, .62, 4.52, .15, .025); return b.geo({ao: .75, aoH: .3}); },
  hominin(o = {}) { const b = mk(), col = o.col || '#3e2c20';
    b.add(G.loft([[0, .62, 0, .12, .14], [0, .85, 0, .15, .16], [.02, 1.02, 0, .13, .17], [.04, 1.1, 0, .06], [.06, 1.16, 0, .06]], 8), col);
    b.add(G.tr(G.ell(.1, .11, .09, 8, 6), .1, 1.24, 0), col); b.add(G.tr(G.ell(.06, .05, .06, 6, 4), .17, 1.2, 0), col, {k: 1.15});
    for (const z of [-1, 1]) { b.add(G.loft([[0, .64, z * .08, .06], [.04, .34, z * .09, .045], [-.02, .05, z * .09, .035], [.07, .02, z * .09, .03]], 5, true), col, {leg: z > 0 ? 0 : PI, hip: .64});
      b.add(G.loft([[.02, 1.04, z * .17, .04], [.03, .78, z * .2, .032], [.06, .55, z * .2, .025]], 5, true), col, {leg: z > 0 ? PI : 0, hip: 1.04}); }
    return b.geo({}); },
  gastornis() { const b = mk(), C = '#5a4a3a';
    b.add(G.tr(G.ell(.75, .6, .5, 12, 8), 0, 1.25, 0), shag(C, 6, .35));
    b.add(G.loft([[.45, 1.45, 0, .22], [.62, 1.75, 0, .16], [.7, 1.95, 0, .18]], 8), shag(C, 6, .35));
    b.add(G.loft([[.66, 2.0, 0, .2, .16], [.9, 1.98, 0, .19, .11], [1.1, 1.92, 0, .12, .06], [1.18, 1.86, 0, .04, .02]], 8, true), '#c8a050');
    eyes(b, .74, 2.07, .12, .025, '#1a1208');
    b.add(G.loft([[-.7, 1.3, 0, .1], [-.9, 1.25, 0, .05]], 5, true), '#3a2e24', {wave: .5});
    for (const z of [-1, 1]) { b.add(G.loft([[0, 1.0, z * .22, .13], [.1, .55, z * .22, .08], [-.05, .15, z * .22, .06], [.12, .02, z * .22, .04, .08]], 6, true), '#7a6a50', {leg: z > 0 ? 0 : PI, hip: 1.0}); b.add(G.tr(G.ell(.2, .08, .04, 6, 4), .05, 1.35, z * .48), C); }
    return b.geo({}); },
  bird(span = .5, col = '#3a3a3a') { const b = mk(), s = span / 2; b.add(G.loft([[-.25 * s, 0, 0, .02 * s], [-.1 * s, 0, 0, .08 * s], [.15 * s, 0, 0, .07 * s], [.25 * s, .02 * s, 0, .05 * s], [.33 * s, .01 * s, 0, .01 * s]], 6), col); for (const z of [-1, 1]) { const w = G.shape([[.08 * s, 0], [.05 * s, .6 * s], [-.08 * s, 1 * s], [-.12 * s, .4 * s], [-.1 * s, 0]]); w.rotateX(PI / 2); if (z < 0) w.scale(1, 1, -1); b.add(w, col, {wing: .6}); } return b.geo({}); },
  primate() { const b = mk(), col = '#5a4030'; b.add(G.loft([[-.12, .12, 0, .06], [0, .14, 0, .075], [.12, .16, 0, .065], [.18, .2, 0, .045], [.24, .22, 0, .05], [.29, .21, 0, .03]], 8), col, {belly: '#9a7a58'}); eyes(b, .27, .25, .03, .014, '#d8a020');
    b.add(G.loft([[-.12, .12, 0, .025], [-.3, .05, 0, .02], [-.4, -.15, 0, .015], [-.38, -.3, 0, .01]], 5, true), col, {wave: .4});
    for (const [x, z] of [[.1, 1], [.1, -1], [-.08, 1], [-.08, -1]]) b.add(G.loft([[x, .12, z * .05, .022], [x + .03, .05, z * .07, .018], [x + .05, 0, z * .07, .014]], 4, true), col);
    return b.geo({}); },
  croc(L = 2) { const b = mk(), s = L / 2; b.add(G.loft(S([[-1, .02, .02, .03], [-.6, .05, .06, .08], [-.2, .08, .13, .2], [.2, .08, .14, .22], [.5, .08, .08, .1], [.6, .08, .07, .09], [.95, .06, .03, .04]], s), 9), (x, y, z, c) => { c.set('#4a5232'); if (Math.sin(x * 20 / s) > .5) c.multiplyScalar(.8); }, {belly: '#b8b08a'}); eyes(b, .62 * s, .14 * s, .05 * s, .015 * s, '#c8b040'); return b.geo({wave: tailW(-.2 * s, -s, 1)}); },
  // Ediacara
  dickinsonia(L = .4) { const g = new T3.PlaneGeometry(1, 1, 26, 6), p = g.attributes.position;
    for (let v = 0; v < p.count; v++) { const u = p.getX(v), w = p.getY(v), e = Math.sqrt(Math.max(0, 1 - 4 * u * u)); p.setXYZ(v, u * L, (.012 + .018 * e * (1 - 4 * w * w)) * L * 2 + Math.abs(Math.sin(u * 26 * PI / 2)) * .006 * L, w * L * .75 * e); }
    g.rotateX(0); const idx = g.index.array; for (let i = 0; i < idx.length; i += 3) { const t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.computeVertexNormals();
    return mk().add(g, (x, y, z, c) => { c.set('#c49a72').multiplyScalar(.8 + .25 * Math.abs(Math.sin(x / L * 26 * PI / 2 + PI / 2))); if (Math.abs(z) < .012 * L) c.multiplyScalar(.75); }).geo({}); },
  kimberella(L = .12) { const b = mk(); b.add(G.tr(G.ell(L * .5, L * .22, L * .32, 10, 6), 0, 0, 0), '#b8946a'); b.add(G.tr(G.ell(L * .62, L * .05, L * .42, 12, 4), 0, .005, 0), (x, y, z, c) => c.set('#d8b890').multiplyScalar(.85 + .2 * Math.sin(Math.atan2(z, x) * 30))); return b.geo({}); },
  spriggina(L = .12) { const b = mk(); for (let i = 0; i < 12; i++) { const x = L * (.3 - i * .06); b.add(G.tr(G.ell(L * .04, L * .04, L * .12 * (1 - i * .05), 6, 4), x, .012, 0), '#c8a07a', {k: .85 + (i % 2) * .15}); } b.add(G.tr(G.ell(L * .1, L * .05, L * .14, 8, 4), L * .38, .014, 0), '#b8906a'); return b.geo({wave: (x) => smooth(.2 * L, -.4 * L, x) * .5}); },
  tribrachidium(r = .06) { const b = mk(); b.add(G.tr(G.ell(r, r * .3, r, 14, 6), 0, 0, 0), '#c8a888'); for (let i = 0; i < 3; i++) { const pts = []; for (let j = 0; j <= 6; j++) { const t = j / 6, a = i * TAU / 3 + t * 1.6; pts.push([Math.cos(a) * r * t * .85, r * .28, Math.sin(a) * r * t * .85, r * .09 * (1 - t * .5)]); } b.add(G.loft(pts, 5, true), '#9a7a5a'); } return b.geo({}); },
  // Cambriano
  anomalocaris(L = .8) { const b = mk(), C = '#b0604a';
    for (let i = 0; i < 13; i++) { const x = L * (.32 - i * .055), w = L * .13 * Math.sin(PI * (i + 2) / 16); b.add(G.tr(G.ell(L * .04, L * .05, w * .5 + L * .02, 8, 5), x, 0, 0), C, {k: .85 + (i % 2) * .12, belly: '#e0a888'});
      for (const z of [-1, 1]) { const f = G.leaf(w + L * .08, L * .06, 2, 0); f.rotateY(z * (-PI / 2 - .25)); f.translate(x, -.005, z * w * .3); b.add(f, '#c8785a', {wing: 1.6, upN: .3}); } }
    b.add(G.tr(G.ell(L * .1, L * .06, L * .08, 10, 6), L * .4, .01, 0), C);
    for (const z of [-1, 1]) { b.add(G.loft([[L * .42, .03 * L, z * L * .04, L * .012], [L * .45, .08 * L, z * L * .1, L * .01]], 4, true), C); b.add(G.tr(G.ball(L * .035, 8, 6), L * .45, .085 * L, z * L * .11), '#1a1410');
      const ap = []; for (let j = 0; j <= 8; j++) { const t = j / 8, a = t * 2.2; ap.push([L * (.48 + Math.sin(a) * .1), -L * .02 - (1 - Math.cos(a)) * L * .06, z * L * .04, L * .022 * (1 - t * .6)]); } b.add(G.loft(ap, 5, true), (x, y, zz, c) => c.set('#c8704a').multiplyScalar(Math.sin(x / L * 120) > 0 ? 1 : .75)); }
    for (const z of [-1, 1]) for (let i = 0; i < 3; i++) { const f = G.leaf(L * .14, L * .04, 2, 0); f.rotateY(PI + z * (.25 + i * .18)); f.translate(-L * .38, .01 * L * i, 0); b.add(f, '#a04a3a'); }
    return b.geo({wave: (x) => .15}); },
  opabinia(L = .2) { const b = mk(), C = '#9a8a6a';
    for (let i = 0; i < 15; i++) { const x = L * (.2 - i * .03), w = L * .07 * Math.sin(PI * (i + 3) / 19); b.add(G.tr(G.ell(L * .02, L * .035, w * .5 + L * .015, 6, 4), x, 0, 0), C, {k: .85 + (i % 2) * .12}); for (const z of [-1, 1]) { const f = G.leaf(w + L * .04, L * .03, 1, 0); f.rotateY(z * -PI / 2); f.translate(x, 0, 0); b.add(f, '#b8a07a', {wing: 2}); } }
    for (let i = 0; i < 5; i++) { const z = (i - 2) * L * .03, x = L * (.22 + (i % 2) * .02); b.add(G.loft([[x, .02 * L, z, L * .006], [x + L * .01, .07 * L, z * 1.3, L * .005]], 3, true), C); b.add(G.tr(G.ball(L * .014, 6, 4), x + L * .01, .075 * L, z * 1.3), '#2a1a10'); }
    b.add(G.loft([[L * .24, 0, 0, L * .012], [L * .34, -L * .02, 0, L * .009], [L * .42, -L * .05, 0, L * .007]], 4, true), C); b.add(G.tr(G.ell(L * .025, L * .012, L * .02, 6, 4), L * .43, -L * .055, 0), '#7a5a3a');
    for (const z of [-1, 1]) for (let i = 0; i < 3; i++) { const f = G.leaf(L * .08, L * .025, 1, 0); f.rotateY(PI + z * (.3 + i * .25)); f.translate(-L * .23, 0, 0); b.add(f, i === 1 ? '#c04a3a' : '#3a5a8a'); }
    return b.geo({wave: (x) => smooth(0, -.25 * L, x) * .5}); },
  hallucigenia(L = .12) { const b = mk(); b.add(G.loft([[-L * .5, L * .12, 0, L * .02], [-L * .2, L * .16, 0, L * .03], [L * .2, L * .16, 0, L * .03], [L * .4, L * .2, 0, L * .025], [L * .5, L * .22, 0, L * .03]], 6, true), '#d8b8a0');
    for (let i = 0; i < 7; i++) { const x = L * (-.3 + i * .1); for (const z of [-1, 1]) { b.add(G.loft([[x, L * .17, z * L * .02, L * .01], [x - L * .03, L * .35, z * L * .05, L * .002]], 4, true), '#8a5a40'); b.add(G.loft([[x, L * .15, z * L * .02, L * .01], [x + L * .01, 0, z * L * .05, L * .006]], 4, true), '#d0a890', {leg: (i * .9 + (z > 0 ? 0 : PI)) % TAU, hip: L * .16}); } }
    return b.geo({}); },
  marrella(L = .1) { const b = mk(); b.add(G.tr(G.ell(L * .08, L * .04, L * .07, 8, 5), L * .2, 0, 0), '#b89070');
    for (const z of [-1, 1]) { b.add(G.loft([[L * .2, .02 * L, z * L * .04, L * .01], [L * .05, .06 * L, z * L * .25, L * .008], [-L * .35, .02 * L, z * L * .3, L * .003]], 4, true), '#d8a070'); b.add(G.loft([[L * .2, 0, z * L * .04, L * .01], [0, -.04 * L, z * L * .22, L * .006], [-L * .3, -.08 * L, z * L * .18, L * .003]], 4, true), '#d8a070');
      b.add(G.loft([[L * .27, 0, z * L * .02, L * .005], [L * .55, .05 * L, z * L * .12, L * .002]], 3, true), '#c09070'); }
    for (let i = 0; i < 12; i++) b.add(G.tr(G.ell(L * .02, L * .02, L * .05 * (1 - i * .06), 6, 4), L * (.12 - i * .035), 0, 0), '#c8a080', {k: .85 + (i % 2) * .15});
    return b.geo({wave: (x) => .3}); },
  wiwaxia(L = .1) { const b = mk(); b.add(G.tr(G.ell(L * .5, L * .2, L * .3, 12, 6), 0, 0, 0), (x, y, z, c) => c.set('#8a7a5a').multiplyScalar(.75 + .3 * Math.abs(Math.sin(x / L * 40) * Math.sin(z / L * 40))));
    for (let i = 0; i < 9; i++) for (const z of [-1, 1]) { const x = L * (-.35 + i * .09); b.add(G.loft([[x, L * .15, z * L * .1, L * .02], [x - L * .05, L * .5, z * L * .2, L * .003]], 4, true), '#6a5a3a'); }
    return b.geo({}); },
  pikaia(L = .12) { return AN.fish({L, h: L * .12, w: L * .05, col: '#b8b0a0', bel: '#d8d0c0', tail: 'round', dorsal: false, pect: false, sp: [[-.5, 0, .1, .1], [-.2, 0, .45, .4], [.2, 0, .5, .45], [.45, 0, .25, .25], [.5, 0, .05, .05]], cf: (x, y, z, c) => { c.set('#b8b0a0').multiplyScalar(.85 + .2 * Math.abs(Math.sin(x / L * 60))); }}); },
  orthocone(L = 2, col = '#d8c0a0') { const b = mk(), C = new T3.Color(col), D = new T3.Color('#7a4a30');
    b.add(G.loft([[-L, 0, 0, L * .005], [-L * .5, 0, 0, L * .05], [0, 0, 0, L * .085]], 10, true), (x, y, z, c) => { c.copy(C); if (Math.sin(x / L * 50 + Math.sin(Math.atan2(z, y) * 3) * 1.5) > .2) c.lerp(D, .65); });
    b.add(G.tr(G.ell(L * .07, L * .065, L * .07, 10, 6), L * .04, 0, 0), '#8a6a5a'); eyes(b, L * .07, L * .04, L * .055, L * .014);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; b.add(G.loft([[L * .08, Math.cos(a) * L * .03, Math.sin(a) * L * .03, L * .01], [L * .2, Math.cos(a) * L * .06 - L * .02, Math.sin(a) * L * .06, L * .005], [L * .28, Math.cos(a) * L * .05 - L * .05, Math.sin(a) * L * .05, L * .003]], 4, true), '#9a6a5a', {wave: .8}); }
    return b.geo({}); },
  jawless(L = .25) { return AN.fish({L, h: L * .2, w: L * .2, col: '#8a8a7a', bel: '#c8c8b8', tail: 'fork', dorsal: false, pect: false, sp: [[-.5, 0, .05, .05], [-.25, 0, .4, .35], [0, 0, .6, .8], [.2, 0, .7, 1.0], [.38, -.02, .55, .85], [.48, -.04, .2, .3]],
      cf: (x, y, z, c) => { c.set(x > 0 ? '#9a9a90' : '#7a7a6a'); if (x > 0 && Math.sin(x / L * 30) > .7) c.multiplyScalar(.8); }}); },
  dunkleosteus(L = 4.5) { return AN.fish({L, h: L * .2, w: L * .15, col: '#4a5058', bel: '#b8b8b0', tail: 'hetero', dorsal: true, dx: .05, pect: 1.1,
      sp: [[-.5, .05, .05, .04], [-.35, .02, .25, .2], [-.1, 0, .5, .48], [.15, 0, .6, .6], [.3, 0, .65, .65], [.42, -.03, .5, .55], [.5, -.06, .18, .22]],
      cf: (x, y, z, c) => { c.set(x > .12 * L ? '#6a6e70' : '#3e4650'); if (x > .12 * L && Math.abs(Math.sin(x / L * 22)) < .12) c.multiplyScalar(.6); },
      extra: (b, L2, h) => { for (const z of [-1, 1]) { b.add(G.tr(G.cone(.025 * L2, .09 * L2, 4).rotateX(PI), .49 * L2, -.04 * L2, z * .02 * L2).translate(0, .0, 0), '#d8d0c0'); } b.add(G.loft([[.3 * L2, -.1 * h - .04 * L2, 0, .04 * L2, .06 * L2], [.5 * L2, -.1 * h - .02 * L2, 0, .02 * L2, .03 * L2]], 6, true), '#3a4048'); }}); },
  shark(L = 1.8) { return AN.fish({L, h: L * .17, w: L * .12, col: '#5a6a78', bel: '#d8dcd8', tail: 'fork', dorsal: true, dx: .05, dorsal2: true, pect: 1.3}); },
  tiktaalik(L = 2.6) { return AN.fish({L, h: L * .12, w: L * .16, col: '#5a5a3a', bel: '#b0a880', tail: 'round', dorsal: false, pect: 1.4,
      sp: [[-.5, 0, .05, .04], [-.3, 0, .35, .3], [0, 0, .7, .75], [.25, 0, .65, .8], [.38, -.01, .45, .75], [.5, -.03, .15, .3]], cf: mottled('#5a5a3a', 4, .35, '#3a3a24')}); }
};

/* ---------- elenco degli ambienti ---------- */
const ENVS = [
  {id: 'adeano', name: 'La Terra appena nata', era: 'Adeano', when: 'circa 4,5 miliardi di anni fa', place: 'Oceano di magma e prima crosta', from: 4560, to: 4030, ma: 4450, lat: -26.1, lon: 117.2, color: '#e0663a',
    intro: 'Poco dopo la nascita del Sistema solare la superficie della Terra è in gran parte fusa. Una crosta nera e sottile galleggia sul magma, il vapore riempie l’aria, la Luna appena formata è vicinissima e i meteoriti cadono di continuo.',
    facts: [
      ['Un oceano di magma', 'Dopo l’impatto gigante che formò la Luna, la Terra era fusa per centinaia di chilometri di profondità. Raffreddandosi, il magma formò una prima crosta sottile e scura, rotta di continuo.'],
      ['La Luna vicinissima', 'La Luna nacque dai detriti dello scontro tra la Terra e un pianeta grande come Marte, chiamato Theia. All’inizio era molto più vicina e nel cielo appariva molte volte più grande di oggi. Si allontana ancora: circa 3,8 cm all’anno.'],
      ['Un giorno di poche ore', 'La giovane Terra ruotava molto più in fretta: un giorno durava forse 5 o 6 ore. Le maree della Luna l’hanno rallentata poco a poco fino alle 24 ore di oggi.'],
      ['Pioggia di meteoriti', 'Nel giovane Sistema solare vagavano ancora moltissimi corpi rocciosi. Gli impatti erano frequenti e scaldavano la superficie; alcuni portarono acqua e altre sostanze.'],
      ['Niente ossigeno', 'L’aria era fatta soprattutto di vapore acqueo, anidride carbonica e azoto, senza ossigeno libero. Quando il vapore si condensò, piogge torrenziali formarono i primi oceani.'],
      ['I cristalli più antichi', 'Nelle Jack Hills, in Australia, si trovano minuscoli cristalli di zircone di circa 4,4 miliardi di anni: sono i frammenti di Terra più antichi conosciuti e indicano che l’acqua liquida esisteva già.']]},
  {id: 'archeano', name: 'Le prime scogliere di microbi', era: 'Archeano', when: 'circa 3,4 miliardi di anni fa', place: 'Mare basso tropicale, Pilbara (Australia occidentale)', from: 4000, to: 2500, ma: 3430, lat: -21.2, lon: 119.4, color: '#d98a4a',
    intro: 'Un mare caldo e poco profondo bagna coste di roccia vulcanica. Non ci sono piante né animali: gli unici esseri viventi sono microbi, che costruiscono cupole a strati chiamate stromatoliti.',
    facts: [
      ['Stromatoliti', 'Sono costruite da tappeti di microbi che intrappolano granelli di sedimento e crescono verso la luce, strato dopo strato. Quelle di Strelley Pool, nel Pilbara, hanno circa 3,4 miliardi di anni.'],
      ['Un cielo senza ossigeno', 'L’aria non conteneva ossigeno libero ma azoto, anidride carbonica e forse metano, che poteva formare una foschia arancione. Senza strato di ozono, i raggi ultravioletti arrivavano fino al suolo.'],
      ['Un Sole più debole', 'Il giovane Sole emetteva circa un quarto di luce in meno di oggi. La Terra non gelò grazie ai gas serra dell’atmosfera, come anidride carbonica e metano.'],
      ['Poche terre emerse', 'Le terre emerse erano soprattutto isole vulcaniche e piccoli nuclei di crosta. Il Pilbara è uno dei pochi pezzi di crosta di quell’epoca arrivati quasi intatti fino a noi.'],
      ['La luce come cibo', 'Alcuni di questi microbi usavano già la luce del Sole per vivere. Più tardi i cianobatteri cominciarono a liberare ossigeno, che circa 2,4 miliardi di anni fa iniziò ad accumularsi nell’aria.'],
      ['Esistono ancora', 'Stromatoliti vive crescono ancora oggi in pochi luoghi, come Shark Bay in Australia, dove l’acqua è così salata che gli animali che le mangerebbero non ci vivono.']]},
  {id: 'criogeniano', name: 'Terra a palla di neve', era: 'Criogeniano', when: 'circa 650 milioni di anni fa', place: 'Calotta di ghiaccio vicino all’equatore (rocce oggi in Namibia)', from: 720, to: 635, ma: 650, lat: -19.6, lon: 15.5, color: '#8ec5e0',
    intro: 'Il ghiaccio copre quasi tutto il pianeta, fino all’equatore. Solo i vulcani bucano la calotta, mentre la vita resiste nel mare sotto il ghiaccio e vicino alle sorgenti calde.',
    facts: [
      ['Ghiaccio fino all’equatore', 'Depositi lasciati dai ghiacciai si trovano in rocce che allora erano vicine all’equatore. Per questo molti geologi pensano che il ghiaccio coprisse quasi tutta la Terra.'],
      ['Due grandi glaciazioni', 'Il Criogeniano ebbe due glaciazioni globali: la Sturtiana (circa 717–660 milioni di anni fa) e la Marinoana (fino a circa 635 milioni di anni fa). Ognuna durò milioni di anni.'],
      ['Uno specchio bianco', 'Il ghiaccio riflette gran parte della luce del Sole: più ghiaccio c’è, più il pianeta si raffredda. Così il freddo si alimentava da solo.'],
      ['I vulcani sciolgono il ghiaccio', 'I vulcani continuarono a emettere anidride carbonica. Con le rocce coperte dal ghiaccio, il gas non veniva più assorbito: si accumulò nell’aria finché l’effetto serra sciolse la calotta.'],
      ['La vita resiste', 'Alghe e altri microrganismi sopravvissero in acque libere, sotto il ghiaccio sottile o vicino alle sorgenti calde. Dopo il disgelo comparvero i primi grandi organismi pluricellulari.']]},
  {id: 'ediacara', name: 'Il giardino di Ediacara', era: 'Ediacarano', when: 'circa 555 milioni di anni fa', place: 'Fondale marino poco profondo, Ediacara (Australia meridionale)', from: 575, to: 539, ma: 555, lat: -30.6, lon: 138.1, color: '#c9a27a',
    intro: 'Sul fondale, coperto da tappeti di microbi, vivono i primi organismi grandi e complessi: forme a foglia, a disco, a cuscino. Molti non somigliano a nessun essere vivente di oggi.',
    facts: [
      ['Dickinsonia', 'Era un organismo piatto e ovale, diviso in segmenti, lungo da pochi centimetri a più di un metro. Nei suoi fossili sono state trovate tracce di colesterolo: era quindi un animale.'],
      ['Charnia, la fronda', 'Sembra una pianta, ma non lo è: viveva anche in acque profonde e buie, quindi non faceva fotosintesi. Stava ancorata al fondo con un disco e forse assorbiva nutrienti dall’acqua.'],
      ['Kimberella', 'Era un piccolo animale a forma di cupola che strisciava sul fondo. Accanto ai suoi fossili si vedono graffi a ventaglio: forse raschiava i tappeti di microbi per nutrirsi.'],
      ['Spriggina e Tribrachidium', 'Spriggina, lunga pochi centimetri, aveva il corpo a segmenti e una specie di testa. Tribrachidium era un dischetto con tre bracci a spirale: una simmetria che oggi non esiste in nessun animale.'],
      ['Un fondale tappezzato', 'Il fondo era coperto da tappeti di microbi spessi e gommosi. Non c’erano ancora animali che scavavano, così i tappeti restavano intatti e hanno conservato le impronte degli organismi.'],
      ['Un mondo senza predatori', 'Non si conoscono denti, gusci o artigli: in questo mondo tranquillo forse non esistevano predatori. Le cose cambiarono con il Cambriano.']]},
  {id: 'cambriano', name: 'L’esplosione cambriana', era: 'Cambriano', when: 'circa 508 milioni di anni fa', place: 'Fondale ai piedi di una scogliera, Burgess Shale (Canada)', from: 539, to: 485, ma: 508, lat: 51.43, lon: -116.47, color: '#d07a5a',
    intro: 'Ai piedi di una grande scogliera sottomarina vive una comunità ricchissima: spugne, vermi, artropodi di ogni forma e il predatore Anomalocaris. In pochi milioni di anni sono comparsi quasi tutti i grandi gruppi di animali.',
    facts: [
      ['Anomalocaris', 'Lungo alcune decine di centimetri, era uno dei predatori più grandi del Cambriano. Nuotava ondeggiando i lobi ai lati del corpo e afferrava le prede con due appendici spinose davanti alla bocca.'],
      ['Opabinia', 'Aveva cinque occhi su peduncoli e una lunga proboscide con una pinza in punta. Quando fu presentata a un congresso scientifico, il pubblico rise pensando a uno scherzo.'],
      ['Hallucigenia', 'Un vermetto con zampe e spine, lungo pochi centimetri. Per anni è stato ricostruito sottosopra e al contrario: le spine stanno sul dorso e la testa era dove si credeva ci fosse la coda.'],
      ['Pikaia, un lontano parente', 'Pikaia, lunga circa 5 cm, aveva una corda dorsale lungo il corpo: è uno dei primi cordati, il gruppo a cui appartengono anche i pesci e gli esseri umani.'],
      ['Trilobiti, Marrella e Wiwaxia', 'I trilobiti avevano occhi fatti di cristalli di calcite. Marrella, piccola e con lunghe spine, è l’animale più comune della Burgess Shale; Wiwaxia, coperta di scaglie e spine, brucava i tappeti di microbi.'],
      ['Fossili eccezionali', 'Qui colate di fango seppellirono gli animali all’istante, conservando anche le parti molli come zampe, branchie e intestino. Per questo la Burgess Shale è famosa in tutto il mondo.']]},
  {id: 'ordoviciano', name: 'Barriera dell’Ordoviciano', era: 'Ordoviciano', when: 'circa 450 milioni di anni fa', place: 'Mare tropicale poco profondo, Laurentia (oggi Ohio, USA)', from: 485, to: 444, ma: 450, lat: 39.1, lon: -84.5, color: '#5aa0b0',
    intro: 'Un mare caldo copre buona parte del continente Laurentia, allora vicino all’equatore. Sul fondo crescono coralli, briozoi e prati di gigli di mare; sopra nuotano nautiloidi dal guscio dritto e i primi pesci.',
    facts: [
      ['Gigli di mare', 'I crinoidi sembrano fiori, ma sono animali parenti delle stelle marine. Stavano fissati al fondo con un lungo stelo e catturavano il cibo con le braccia piumate.'],
      ['Nautiloidi giganti', 'Endoceras e Cameroceras avevano un guscio conico e dritto, lungo anche più di 3 metri. Erano predatori: catturavano le prede con i tentacoli e galleggiavano grazie a camere piene di gas.'],
      ['Coralli diversi da oggi', 'I coralli tabulati formavano colonie a nido d’ape, i coralli rugosi spesso vivevano da soli, a forma di corno. Sono scomparsi entrambi alla fine del Permiano.'],
      ['I primi pesci', 'Pesci come Sacabambaspis e Arandaspis non avevano mascelle: aspiravano il cibo dal fondo. La testa era protetta da placche d’osso.'],
      ['Briozoi', 'Sembrano muschi o rametti, ma sono colonie di minuscoli animali, ognuno chiuso in una celletta. Nell’Ordoviciano si diffusero moltissimo.'],
      ['La prima grande estinzione', 'Alla fine dell’Ordoviciano, circa 445 milioni di anni fa, una glaciazione abbassò il livello del mare e cambiò il clima: scomparve circa l’85% delle specie marine.']]},
  {id: 'rhynie', name: 'Le prime piante sulla terra', era: 'Devoniano inferiore', when: 'circa 407 milioni di anni fa', place: 'Sorgenti calde e paludi, Rhynie (Scozia)', from: 430, to: 393, ma: 407, lat: 57.33, lon: -2.84, color: '#8aa04a',
    intro: 'Vicino a sorgenti d’acqua calda crescono piante basse, senza foglie né fiori: semplici fusti verdi che si biforcano. Tra loro svettano le colonne di Prototaxites e camminano piccoli artropodi.',
    facts: [
      ['Piante senza foglie', 'Rhynia e Aglaophyton erano alte circa 20 cm: fusti verdi che si biforcano, senza foglie né vere radici. In cima portavano gli sporangi, che liberavano le spore. Qui sono mostrate ingrandite circa 3 volte.'],
      ['Cooksonia', 'È una delle piante terrestri più antiche, alta pochi centimetri. Piante come questa avevano sottili vasi per trasportare l’acqua: un’invenzione che permise di crescere verso l’alto.'],
      ['Prototaxites', 'Queste colonne, alte fino a 8 metri, erano gli organismi più grandi sulla terraferma. Erano probabilmente funghi giganti: gli alberi non esistevano ancora.'],
      ['Un fossile perfetto', 'L’acqua delle sorgenti era ricca di silice: quando inondava la palude pietrificava le piante in fretta. Nella selce di Rhynie si vedono perfino le singole cellule.'],
      ['I primi animali di terra', 'Tra le piante vivevano acari, collemboli e trigonotarbidi, piccoli parenti dei ragni. Non c’erano ancora insetti con le ali né vertebrati sulla terraferma.'],
      ['Funghi alleati', 'Nei fusti di Aglaophyton si sono trovati funghi simbionti, come quelli che ancora oggi aiutano le piante ad assorbire acqua e sali minerali.']]},
  {id: 'devmare', name: 'Il mare dei pesci corazzati', era: 'Devoniano superiore', when: 'circa 365 milioni di anni fa', place: 'Mare tropicale, Laurentia (oggi Ohio, USA)', from: 393, to: 359, ma: 365, lat: 41.4, lon: -81.7, color: '#4a7aa0',
    intro: 'Il Devoniano è chiamato «età dei pesci». In questo mare caldo nuota Dunkleosteus, un gigante con la testa coperta da placche d’osso, insieme ai primi squali; sul fondo crescono gigli di mare e spugne.',
    facts: [
      ['Dunkleosteus', 'Era un placoderma, un pesce con testa e torace coperti da una corazza d’osso. Le stime più recenti gli danno circa 4 metri di lunghezza: uno dei più grandi predatori del suo tempo.'],
      ['Denti che non erano denti', 'Al posto dei denti aveva placche ossee taglienti che si affilavano sfregando tra loro. Il morso era fortissimo e la bocca si apriva in una frazione di secondo.'],
      ['I primi squali', 'Cladoselache, lungo circa 1,5–2 metri, è uno degli squali antichi meglio conosciuti. Era veloce, con la coda quasi simmetrica e una spina davanti a ogni pinna dorsale.'],
      ['Gusci a spirale', 'Nel Devoniano si diffusero le goniatiti, i primi ammonoidi: molluschi con il guscio arrotolato a spirale, parenti dei nautili.'],
      ['Le prime foreste', 'Mentre i pesci dominavano i mari, sulla terraferma crescevano le prime foreste. Le radici cambiarono i suoli e i fiumi portarono al mare molte sostanze nutritive.'],
      ['Un’altra estinzione', 'Alla fine del Devoniano i mari rimasero più volte senza ossigeno: scomparvero i placodermi e molte barriere coralline. È la seconda delle cinque grandi estinzioni.']]},
  {id: 'devpalude', name: 'La palude di Tiktaalik', era: 'Devoniano superiore', when: 'circa 375 milioni di anni fa', place: 'Delta fluviale tropicale (oggi isola di Ellesmere, Canada)', from: 385, to: 359, ma: 375, lat: 77.1, lon: -86.5, color: '#6a9a6a',
    intro: 'Acque basse e calde scorrono tra rive coperte dai primi veri alberi, gli Archaeopteris. Nell’acqua Tiktaalik, un pesce con pinne robuste e collo mobile, si sostiene sul fondo: è a metà strada tra pesci e animali a quattro zampe.',
    facts: [
      ['Tiktaalik', 'Lungo fino a circa 2,7 metri, aveva testa piatta, collo mobile e pinne con ossa simili a quelle di un braccio. Poteva sostenersi nell’acqua bassa e forse fare brevi passi fuori.'],
      ['Trovato grazie a una previsione', 'Nel 2004 i paleontologi lo cercarono apposta in rocce di circa 375 milioni di anni, l’età in cui pensavano fosse avvenuto il passaggio dall’acqua alla terra. E lo trovarono.'],
      ['Archaeopteris, il primo albero', 'Aveva un tronco di legno vero, alto anche 20–30 metri, ma si riproduceva con spore come le felci. Le sue foreste coprivano le rive di fiumi e delta.'],
      ['Branchie e polmoni', 'Molti pesci del Devoniano, come Tiktaalik, avevano sia branchie sia polmoni: in acque calde e povere di ossigeno potevano respirare aria.'],
      ['Zampe con molte dita', 'I primi tetrapodi, come Acanthostega e Ichthyostega, avevano zampe con sette o otto dita e vivevano ancora soprattutto in acqua.'],
      ['Nessun insetto in volo', 'In queste paludi non volava nessun insetto: le ali compariranno decine di milioni di anni più tardi. Sulla terraferma vivevano millepiedi, scorpioni e piccoli parenti dei ragni.']]},
  {id: 'carbonifero', name: 'La foresta del Carbonifero', era: 'Carbonifero', when: 'circa 310 milioni di anni fa', place: 'Foresta paludosa tropicale, Euramerica (oggi Nuova Scozia, Canada)', from: 359, to: 299, ma: 310, lat: 45.7, lon: -64.4, color: '#4a8a4a',
    intro: 'Una foresta palustre calda e umida, vicina all’equatore. Gli alberi non sono quelli di oggi: licopodi giganti dal tronco a scaglie, equiseti alti come case, felci arboree. In volo passano insetti enormi.',
    facts: [
      ['Alberi a scaglie', 'Lepidodendron e Sigillaria erano parenti dei piccoli licopodi di oggi, ma alti fino a 30–40 metri. Il tronco era coperto dai segni a rombo lasciati dalle foglie cadute.'],
      ['Equiseti giganti', 'Calamites somigliava a un equiseto (coda cavallina) ma poteva superare i 10 metri. Il fusto era cavo e diviso in nodi, con rametti a raggiera.'],
      ['Meganeura', 'Parente delle libellule, aveva un’apertura alare di circa 70 cm: è uno degli insetti più grandi mai esistiti.'],
      ['Più ossigeno nell’aria', 'L’aria conteneva forse il 30–35% di ossigeno, contro il 21% di oggi. Questo potrebbe aver aiutato insetti e altri artropodi a diventare così grandi.'],
      ['Arthropleura', 'Era un millepiedi lungo più di 2 metri, il più grande artropode terrestre mai esistito. Si nutriva probabilmente di piante e resti vegetali.'],
      ['Il carbone', 'I tronchi caduti nella palude non marcivano del tutto: sepolti e schiacciati per milioni di anni sono diventati strati di carbone. Da qui il nome Carbonifero.']]},
  {id: 'permiano', name: 'Il deserto della Pangea', era: 'Permiano inferiore', when: 'circa 285 milioni di anni fa', place: 'Pianura arida con un fiume, Pangea equatoriale (oggi Texas, USA)', from: 299, to: 252, ma: 285, lat: 33.6, lon: -99.3, color: '#c8603a',
    intro: 'Tutti i continenti sono uniti nella Pangea. L’interno è caldo e secco, con suoli rossi; la vita si concentra lungo i fiumi, dove crescono conifere primitive e felci con semi. Qui vivono Dimetrodon ed Edaphosaurus, con le vele sul dorso.',
    facts: [
      ['Dimetrodon non è un dinosauro', 'Visse circa 40 milioni di anni prima dei dinosauri. Era un sinapside: appartiene al gruppo da cui, molto più tardi, sono nati i mammiferi.'],
      ['A che serviva la vela?', 'Era sostenuta dalle spine lunghissime delle vertebre. Forse serviva a scaldarsi al sole o a farsi riconoscere: gli scienziati ne discutono ancora.'],
      ['Edaphosaurus, l’erbivoro', 'Aveva una testa piccola e denti adatti a triturare piante. Le spine della sua vela avevano piccole sporgenze laterali, come i rami di un albero spoglio.'],
      ['Un supercontinente', 'Con le terre unite, l’interno della Pangea era lontanissimo dal mare: piogge scarse, forti sbalzi di temperatura e grandi distese di sabbia rossa.'],
      ['E Glossopteris?', 'Glossopteris era una pianta con semi tipica dei continenti del sud (Gondwana). Qui, nella parte nord della Pangea, crescevano invece conifere come Walchia e felci con semi.'],
      ['La più grande estinzione', 'Alla fine del Permiano, 252 milioni di anni fa, enormi eruzioni in Siberia sconvolsero il clima: scomparve quasi il 90% delle specie marine.']]},
  {id: 'triassico', name: 'Il Triassico dei primi dinosauri', era: 'Triassico superiore', when: 'circa 230 milioni di anni fa', place: 'Pianura alluvionale, Ischigualasto (Argentina)', from: 237, to: 201, ma: 230, lat: -30.0, lon: -67.9, color: '#c89a4a',
    intro: 'Una pianura attraversata da fiumi, con un clima caldo e stagioni secche e piovose. Qui vivono alcuni dei dinosauri più antichi conosciuti, ancora rari, insieme a rincosauri e cinodonti, molto più numerosi.',
    facts: [
      ['Herrerasaurus', 'Lungo circa 4–6 metri, era uno dei predatori più grandi di Ischigualasto. Camminava su due zampe e aveva denti ricurvi e seghettati.'],
      ['Eoraptor', 'Lungo circa un metro, leggero e veloce, è uno dei dinosauri più antichi: ha circa 231 milioni di anni. Probabilmente mangiava piccoli animali e forse anche piante.'],
      ['I rincosauri', 'Hyperodapedon aveva un becco ricurvo e mascelle adatte a tagliare piante dure. A Ischigualasto è il fossile più comune, molto più dei dinosauri.'],
      ['Cinodonti, quasi mammiferi', 'Exaeretodon era un cinodonte, stretto parente dei mammiferi, con denti di forme diverse per mordere e masticare. Forse aveva anche il pelo.'],
      ['Le piante del Triassico', 'Non c’erano fiori né erba. Crescevano conifere, felci, equiseti e Dicroidium, una felce con semi tipica del Gondwana.'],
      ['La Valle della Luna', 'Ischigualasto, oggi un deserto, è chiamata «Valle della Luna» per le sue rocce dalle forme strane. È patrimonio dell’umanità UNESCO.']]},
  {id: 'giurassico', name: 'Il Giurassico dei giganti', era: 'Giurassico superiore', when: 'circa 150 milioni di anni fa', place: 'Pianura con fiumi, Formazione Morrison (oggi Utah e Colorado, USA)', from: 165, to: 145, ma: 150, lat: 40.44, lon: -109.3, color: '#7aa04a',
    intro: 'Una vasta pianura semiarida solcata da fiumi. Lungo le rive crescono araucarie, cicadee, ginkgo ed equiseti; il suolo è coperto di felci. Qui pascolano i sauropodi, i più grandi animali mai vissuti sulla terraferma.',
    facts: [
      ['Brachiosaurus', 'Con le zampe anteriori più lunghe delle posteriori e il collo alzato, poteva brucare a oltre 12 metri d’altezza, come una gru vivente.'],
      ['Diplodocus', 'Lungo circa 25 metri, teneva il collo quasi orizzontale e mangiava piante basse spazzando ampie zone. La lunga coda gli faceva da contrappeso.'],
      ['Stegosaurus', 'Le piastre sul dorso servivano forse a farsi riconoscere. Le quattro spine della coda erano un’arma: in un osso di Allosaurus è stata trovata una ferita fatta da una di queste spine.'],
      ['Allosaurus', 'Era il grande predatore di Morrison, lungo 8–9 metri. Aveva un cranio leggero e forse attaccava con morsi rapidi, come colpi d’accetta.'],
      ['Rettili volanti', 'Gli pterosauri non erano dinosauri, ma loro cugini. Volavano con una membrana di pelle tesa tra il corpo e un quarto dito lunghissimo.'],
      ['Niente fiori, niente erba', 'Nel Giurassico non esistevano ancora piante con fiori. Il paesaggio era fatto di conifere, cicadee, ginkgo, felci ed equiseti.']]},
  {id: 'maremeso', name: 'Il mare dei rettili marini', era: 'Giurassico inferiore', when: 'circa 182 milioni di anni fa', place: 'Mare caldo poco profondo, Holzmaden (Germania)', from: 201, to: 66, ma: 182, lat: 48.63, lon: 9.53, color: '#3a7ab0',
    intro: 'Un mare caldo e poco profondo copre gran parte dell’Europa. Vi nuotano ittiosauri a forma di delfino, plesiosauri, banchi di belemniti e ammoniti dal guscio a spirale.',
    facts: [
      ['Ittiosauri', 'Erano rettili, non pesci, ma avevano un corpo da delfino e nuotavano con la coda. Respiravano aria e partorivano piccoli vivi: a Holzmaden ci sono fossili di madri con i piccoli.'],
      ['Plesiosauri', 'Avevano un corpo largo e quattro pinne a forma di ala. Alcuni avevano il collo lungo; altri, i pliosauri come Hauffiosaurus di Holzmaden, una testa grande e un collo corto. «Volavano» nell’acqua come le tartarughe marine e catturavano pesci e molluschi.'],
      ['Ammoniti', 'Erano molluschi con il guscio a spirale diviso in camere piene di gas, che servivano a galleggiare. Cambiavano forma così in fretta che i geologi le usano per datare le rocce.'],
      ['Belemniti', 'Somigliavano a calamari con dieci braccia munite di uncini. Dentro il corpo avevano un rostro duro a forma di proiettile: è la parte che si trova fossile più spesso.'],
      ['Gigli di mare viaggiatori', 'Alcuni crinoidi, come Seirocrinus, vivevano appesi a tronchi galleggianti, con steli lunghi fino a 20 metri: così viaggiavano per il mare aperto.'],
      ['Un fondo senza ossigeno', 'Sul fondo l’acqua aveva pochissimo ossigeno: niente spazzini e poca decomposizione. Per questo a Holzmaden si conservano scheletri interi e perfino il contorno del corpo.']]},
  {id: 'cretaceo', name: 'Il Cretaceo alla fine', era: 'Cretaceo superiore', when: 'circa 67 milioni di anni fa', place: 'Pianura costiera con fiumi, Hell Creek (Montana, USA)', from: 100, to: 66, ma: 67, lat: 47.6, lon: -106.6, color: '#b06a4a',
    intro: 'Una pianura umida solcata da fiumi, vicino a un mare interno. Tra conifere e felci crescono le piante con fiori, ormai diffuse: magnolie, palme, alberi a foglia larga. Ma non c’è ancora l’erba.',
    facts: [
      ['Tyrannosaurus', 'Lungo circa 12 metri e pesante 8–9 tonnellate, aveva il morso più potente di qualsiasi animale terrestre conosciuto: poteva frantumare le ossa.'],
      ['Triceratops', 'Pesante come un elefante, aveva tre corna e un grande collare d’osso. Mangiava piante basse strappandole con il becco.'],
      ['Edmontosaurus', 'Era un adrosauro, un «dinosauro a becco d’anatra». In bocca aveva centinaia di denti in file, che si rinnovavano di continuo per macinare le piante.'],
      ['Le piante con i fiori', 'Le angiosperme, le piante con fiori, comparvero circa 130 milioni di anni fa. Alla fine del Cretaceo erano già diffuse, ma le praterie d’erba arrivarono decine di milioni di anni dopo.'],
      ['Quetzalcoatlus', 'Con un’apertura alare di circa 10 metri è uno dei più grandi animali che abbiano mai volato. I suoi fossili vengono dal Texas, più a sud.'],
      ['La fine dei dinosauri', '66 milioni di anni fa un asteroide largo circa 10 km cadde nello Yucatán (Messico). Con le grandi eruzioni dell’India sconvolse il clima: scomparvero i dinosauri, tranne gli uccelli.']]},
  {id: 'eocene', name: 'La foresta dell’Eocene', era: 'Eocene', when: 'circa 47 milioni di anni fa', place: 'Lago vulcanico nella foresta subtropicale, Messel (Germania)', from: 56, to: 34, ma: 47, lat: 49.92, lon: 8.76, color: '#5a9a5a',
    intro: 'La Terra è molto più calda di oggi: in Germania cresce una foresta subtropicale con palme e allori intorno a un lago profondo. Vi vivono piccoli cavalli, primati, coccodrilli e grandi uccelli che non volano.',
    facts: [
      ['Darwinius, il primate di Messel', 'Lo scheletro quasi completo di questo giovane primate, soprannominato «Ida», è lungo circa 58 cm compresa la coda. Viveva sugli alberi e mangiava frutta e foglie.'],
      ['Cavalli piccoli come cani', 'Eurohippus era un cavallo grande come un piccolo cane, con quattro dita sulle zampe anteriori e tre su quelle posteriori. Viveva nel sottobosco e mangiava foglie e frutti.'],
      ['Gastornis', 'Alto circa 2 metri, non volava e aveva un becco enorme. Un tempo era visto come un feroce predatore; oggi molti studiosi pensano che mangiasse piante, semi e frutti.'],
      ['Un mondo caldo', 'All’inizio dell’Eocene la Terra era così calda che vicino ai poli crescevano foreste e non c’erano calotte di ghiaccio. Nell’aria c’era molta più anidride carbonica di oggi.'],
      ['Un lago trappola', 'Il lago di Messel era profondo e senza ossigeno sul fondo. Gli animali caduti in acqua si sono conservati con pelle, piume e perfino il contenuto dello stomaco.'],
      ['Colori di 47 milioni di anni', 'In alcuni coleotteri fossili di Messel si vedono ancora i colori metallici originali.']]},
  {id: 'savana', name: 'La savana di Laetoli', era: 'Pliocene', when: 'circa 3,6 milioni di anni fa', place: 'Savana alberata vicino a un vulcano, Laetoli (Tanzania)', from: 7, to: 2.6, ma: 3.66, lat: -3.21, lon: 35.19, color: '#c8a050',
    intro: 'Una savana con acacie e praterie, ai piedi del vulcano Sadiman che a volte copre tutto di cenere. Pascolano giraffe e antichi parenti degli elefanti; in lontananza cammina un piccolo gruppo di Australopithecus afarensis.',
    facts: [
      ['Impronte nella cenere', 'Una pioggia leggera trasformò la cenere del vulcano in una specie di cemento. Così si sono conservate le impronte di molti animali e quelle di alcuni ominini che camminavano su due piedi, 3,66 milioni di anni fa.'],
      ['Australopithecus afarensis', 'Era alto circa 1–1,5 metri, con un cervello poco più grande di quello di uno scimpanzé. Camminava eretto ma si arrampicava ancora bene. Il fossile più famoso della specie è «Lucy», trovato in Etiopia.'],
      ['Deinotherium', 'Era un parente degli elefanti alto fino a 4 metri, con zanne nella mascella inferiore piegate verso il basso. Forse le usava per staccare corteccia e rami.'],
      ['Le praterie si allargano', 'Negli ultimi milioni di anni il clima dell’Africa orientale diventò più secco e stagionale: le foreste si ridussero e si allargarono le savane d’erba.'],
      ['Chi passava di qui', 'A Laetoli si trovano impronte di giraffe, antilopi, rinoceronti, cavalli a tre dita (Hipparion), lepri e perfino uccelli simili alle faraone.'],
      ['Un vulcano vicino', 'Il vulcano Sadiman, oggi spento, eruttava una cenere ricca di carbonati. Bagnata dalla pioggia e asciugata dal sole, si indurì in poco tempo.']]},
  {id: 'steppa', name: 'La steppa dei mammut', era: 'Pleistocene', when: 'circa 20 000 anni fa', place: 'Steppa fredda davanti alla calotta di ghiaccio (oggi Germania e Polonia)', from: 0.4, to: 0.0117, ma: 0.02, lat: 52.6, lon: 14.0, color: '#a8b8c0',
    intro: 'Durante l’ultima glaciazione una calotta di ghiaccio copre la Scandinavia e arriva fino alla Germania settentrionale. Davanti al ghiaccio si stende una steppa fredda e asciutta, ricca di erbe, dove pascolano grandi mandrie.',
    facts: [
      ['Il mammut lanoso', 'Alto circa 3 metri, era coperto da una pelliccia lunga e da uno strato di grasso. Aveva orecchie e coda piccole, per disperdere meno calore.'],
      ['Una steppa ricca', 'Il clima era freddo ma asciutto e luminoso: crescevano molte erbe e fiori. Questa «steppa dei mammut» andava dalla Spagna fino al Canada ed era piena di erbivori.'],
      ['Il rinoceronte lanoso', 'Aveva due corna, la più lunga fino a oltre un metro, forse usate anche per spazzare la neve e trovare l’erba. Lo conosciamo bene grazie ad animali congelati in Siberia.'],
      ['Megaloceros, il cervo gigante', 'Chiamato «alce irlandese», non era un alce ma un cervo, con palchi larghi fino a 3,6 metri: i più grandi mai esistiti.'],
      ['Il mare più basso', 'Tanta acqua era chiusa nei ghiacci che il mare era circa 120 metri più basso di oggi. Si poteva andare a piedi dalla Francia all’Inghilterra e dall’Asia all’America.'],
      ['Animali dipinti', 'Gli esseri umani di allora dipinsero mammut, cavalli, bisonti e rinoceronti sulle pareti delle grotte, come a Chauvet e a Lascaux, in Francia.']]},
  {id: 'americhe', name: 'Le Americhe dei giganti', era: 'Pleistocene superiore', when: 'circa 13 000 anni fa', place: 'Savana con boschi e sorgenti, Florida (USA)', from: 0.13, to: 0.0117, ma: 0.013, lat: 30.25, lon: -83.95, color: '#b08a5a',
    intro: 'Alla fine dell’ultima glaciazione le Americhe sono abitate da animali giganteschi: mammut e mastodonti, bradipi di terra grandi come un orso, bisonti dalle corna enormi, cavalli, felini dai denti a sciabola, lupi terribili e, in cielo, i teratorni, uccelli con quasi 4 metri di apertura alare.',
    facts: [
      ['Bradipi di terra', 'Paramylodon era un bradipo di terra lungo circa 3 metri e pesante più di una tonnellata. Nella pelle aveva tanti piccoli ossicini, come una cotta di maglia. In Florida viveva anche Eremotherium, lungo il doppio, che poteva brucare le foglie più alte.'],
      ['Il mastodonte americano', 'Non era un mammut ma un parente più lontano degli elefanti, più basso e tozzo, con denti a punte adatti a masticare rami e foglie. In Florida, nel fiume Aucilla, una sua zanna con segni di macellazione dimostra che qui c’erano esseri umani già circa 14 500 anni fa.'],
      ['Smilodon', 'Il felino «dai denti a sciabola» aveva canini lunghi più di 15 cm. Non era parente stretto delle tigri: cacciava grandi erbivori bloccandoli con le zampe anteriori molto robuste.'],
      ['Il mammut colombiano', 'Più grande del mammut lanoso, poteva superare i 4 metri al garrese e aveva poco pelo, adatto a un clima più mite.'],
      ['Il grande scambio americano', 'Bradipi e gliptodonti vengono dal Sud America: arrivarono a nord quando, circa 3 milioni di anni fa, l’istmo di Panama unì le due Americhe.'],
      ['La scomparsa dei giganti', 'Tra 13 000 e 11 000 anni fa quasi tutti i grandi mammiferi americani si estinsero. Le cause probabili sono il rapido cambiamento del clima e la caccia dei primi esseri umani arrivati nel continente.']]}
];

/* ---------- i paesaggi ---------- */
const LAND = {};
const C_ = (() => { const m = {}; return h => m[h] || (m[h] = new T3.Color(h)); })();
const NQ = (k, n) => Math.max(1, Math.round(n * (k.touch ? .55 : 1)));
const pm = (k, A, sp = 1) => k.anim({plant: 1, wave: A, sp}, {side: T3.DoubleSide, roughness: .85});
const amat = (k, A, ds) => k.anim(A, {side: ds ? T3.DoubleSide : T3.FrontSide, roughness: .72});
const smat = (k, o) => k.mat(Object.assign({roughness: .9}, o || {}));
// mondo sottomarino: acqua azzurra, superficie vista da sotto, raggi di luce, particelle
function sea(k, o) {
  k.sky({top: o.top, hor: o.hor, bot: o.bot, sun: false, glow: 0, fogExp: o.fog, haze: .4});
  k.lights({sky: o.top, ground: o.bot, hemi: o.hemi || 1, sun: '#e8fbff', sunI: o.sunI || .55, dir: [.25, 1, .15], skySun: false});
  k.surface(o.surf, o.surfCol || '#d8f6fa', .6);
  k.rays(k.touch ? 7 : 12, o.surf, '#d8f4ff', o.rayOp || .1, o.surf + 6);
  k.drift(NQ(k, 420), {col: '#e8f4f0', size: [.03, .07], alpha: .55, R: 20, h0: -3, h1: 9, vel: [.05, -.03, .02], wob: .5});
}
function pnoise(x, y, P) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), m = a => ((a % P) + P) % P; const a = hash2(m(xi), m(yi)), b = hash2(m(xi + 1), m(yi)), c = hash2(m(xi), m(yi + 1)), d = hash2(m(xi + 1), m(yi + 1)); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function lavaTex(k) {
  const S = 256, [c, g] = mkc(S, S), img = g.createImageData(S, S), cA = [40, 6, 2], cB = [150, 30, 6], cC = [255, 150, 40], cD = [255, 235, 160];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let r1 = 0, a = .5, f = 1; for (let o = 0; o < 3; o++) { r1 += a * pnoise(x / S * 6 * f, y / S * 6 * f, 6 * f); a *= .5; f *= 2; } r1 /= .875;
    const rid = 1 - Math.abs(2 * r1 - 1), glow = Math.pow(smooth(.62, .98, rid), 1.5) + .25 * pnoise(x / S * 24, y / S * 24, 24);
    const t = clamp01(glow), col = t < .33 ? cA.map((v, i) => lerp(v, cB[i], t / .33)) : t < .75 ? cB.map((v, i) => lerp(v, cC[i], (t - .33) / .42)) : cC.map((v, i) => lerp(v, cD[i], (t - .75) / .25));
    const i = (y * S + x) * 4; img.data[i] = col[0]; img.data[i + 1] = col[1]; img.data[i + 2] = col[2]; img.data[i + 3] = 255; }
  g.putImageData(img, 0, 0); return k.tex(c, true, [1, 1]);
}
function moonTex(k) { const [c, g] = mkc(256, 128), r = rng(31); g.fillStyle = '#a8a29a'; g.fillRect(0, 0, 256, 128);
  for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(70,66,62,${.25 + r() * .35})`; g.beginPath(); g.ellipse(r() * 256, 20 + r() * 88, 8 + r() * 26, 6 + r() * 18, 0, 0, 7); g.fill(); }
  for (let i = 0; i < 160; i++) { const x = r() * 256, y = r() * 128, s = 1 + r() * r() * 7; g.strokeStyle = 'rgba(40,36,32,.5)'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, s, 0, 7); g.stroke(); g.fillStyle = 'rgba(230,226,220,.25)'; g.beginPath(); g.arc(x - s * .3, y - s * .3, s * .5, 0, 7); g.fill(); }
  return k.tex(c); }

LAND.adeano = (k) => {
  const H = (x, z) => { const d = dist(x, z), n = fbm(x * .035, z * .035, 4), cr = ridge(x * .05 + 5, z * .05 - 3, 3);
    let h = .55 + n * 1.5 - smooth(.8, .93, cr) * 2 * smooth(9, 17, d);
    h -= smooth(36, 60, d + (n - .5) * 30) * 2.8;
    h += smooth(110, 150, d) * Math.pow(fbm(x * .012 + 9, z * .012), 2) * 70;
    return h; };
  k.H = H;
  k.sky({top: '#2a0e0a', hor: '#b84a28', bot: '#4a1408', fog: [30, 250], fogCol: '#7a3020', sunSize: .5, glow: 1.6, haze: .2, sunDir: [.6, .25, -.5]});
  k.lights({sky: '#c0603a', ground: '#ff6a1a', hemi: 1.25, sun: '#ffb27a', sunI: .75, dir: [.6, .25, -.5]});
  k.terrain(H, (x, y, z, s, c) => { c.set('#1c1a19'); c.lerp(C_('#3a3330'), fbm(x * .3, z * .3, 2) * .7); c.lerp(C_('#b8401a'), smooth(.45, 0, y)); if (y > 5) c.lerp(C_('#2a2422'), .6); }, {mat: {roughness: .8}});
  const lt = lavaTex(k); lt.repeat.set(70, 70);
  const lava = new T3.Mesh(new T3.PlaneGeometry(800, 800), new T3.MeshBasicMaterial({map: lt, toneMapped: false, fog: false})); lava.rotation.x = -PI / 2; lava.position.y = .02; k.scene.add(lava);
  k.up.push(t => lt.offset.set(t * .003, t * .002));
  const moon = new T3.Mesh(new T3.SphereGeometry(30, 32, 20), new T3.MeshStandardMaterial({map: moonTex(k), roughness: 1, fog: false, emissive: k.lin('#4a3a34'), emissiveIntensity: .5}));
  moon.position.set(-170, 115, -300); moon.rotation.y = 2; k.scene.add(moon); k.follow.push([moon]);
  // rocce di basalto
  k.plant(PL.rock(1, '#2e2a28'), k.scatter(NQ(k, 70), () => { const [x, z] = k.ringPt(5, 60); return H(x, z) > .5 ? {x, z, s: rr(.2, 1), sy: rr(.4, .9)} : null; }), smat(k), {shadow: true});
  // vapore dalle fessure e scintille
  const src = []; for (let i = 0; i < 400 && src.length < 16; i++) { const [x, z] = k.ringPt(18, 95); if (H(x, z) < .1) src.push([x, .1, z, rr(.8, 1.6)]); }
  if (src.length) k.plumes(src, NQ(k, 220), {col: '#d8c0b8', size: [2, 11], rise: 18, life: 9, alpha: .28, spread: 3, wind: [2, 1]});
  k.drift(NQ(k, 160), {col: '#ffa040', add: true, size: [.06, .16], alpha: .9, R: 20, h0: -1, h1: 14, vel: [.3, .8, .1], tw: 3});
  // meteoriti che solcano il cielo
  const MET = [0, 1, 2, 3].map(i => ({t: -1 - i * 1.7, dur: 1.4}));
  const flash = k.sprite(k.glowTex('rgba(255,220,160,1)', 'rgba(255,120,40,0)'), 0, -50, 0, 60, {opacity: 0, fog: false}); let fl = 9;
  k.parts(4 * 14, {col: '#ffe0b0', add: true, init(p) { p.a = 0; p.s = 1; p.y = -100; }, step(p, t, dt, c, r) {
    const m = MET[Math.floor(p.i / 14)], j = p.i % 14;
    if (j === 0) { if (p.i === 0) { fl += dt; flash.material.opacity = Math.max(0, 1 - fl / 1.2) * .9; flash.scale.setScalar(40 + fl * 60); }
      m.t += dt; if (m.t > m.dur) { if (!m.done) { m.done = true; if (m.ey < 30) { flash.position.set(m.ex, Math.max(2, m.ey), m.ez); fl = 0; } } if (m.t > m.dur + 1 + r() * 4) {
          const az = r() * TAU, el = rr(.4, .9), R0 = 330; m.sx = c.x + Math.cos(el) * Math.cos(az) * R0; m.sy = Math.sin(el) * R0; m.sz = c.z + Math.cos(el) * Math.sin(az) * R0;
          const hx = Math.cos(az + PI / 2 + rr(-.6, .6)), hz = Math.sin(az + PI / 2 + rr(-.6, .6)); m.dx = hx * 120; m.dy = -m.sy * rr(.8, 1.05); m.dz = hz * 120; m.t = 0; m.dur = rr(1, 1.8); m.done = false; } } }
    const q = clamp01(m.t / m.dur) - j * .012; if (m.t < 0 || m.t > m.dur || q < 0) { p.a = 0; return; }
    p.x = m.sx + m.dx * q; p.y = m.sy + m.dy * q; p.z = m.sz + m.dz * q; p.s = (j === 0 ? 9 : 7 * (1 - j / 14)); p.a = j === 0 ? 1 : .8 * (1 - j / 14);
    if (j === 0) { m.ex = p.x; m.ey = p.y; m.ez = p.z; } }});
  return {H, spawn: [0, 0, 0], inside: (x, z) => dist(x, z) < 60 && H(x, z) > .2, signOk: (x, z) => H(x, z) > .35, exp: 1.05, envI: .5, pitch: .02};
};

LAND.archeano = (k) => {
  const VOL = [[-70, -150, 50], [95, -165, 38], [-160, -70, 30]];
  const H = (x, z) => { const n = fbm(x * .02, z * .02, 3); let h = lerp(-1.3, 1.1, smooth(-30, 30, z + (n - .5) * 40)) + fbm(x * .09, z * .09, 3) * .55 - .27;
    h += Math.max(0, ridge(x * .03, z * .03) - .72) * 5 * smooth(5, 30, z);
    for (const [vx, vz, vh] of VOL) { const d = dist(x - vx, z - vz); h = Math.max(h, vh * Math.max(0, 1 - d / (vh * 2.2)) - (d < vh * .22 ? (vh * .22 - d) * .9 : 0)); }
    return h; };
  k.H = H;
  k.sky({top: '#a8683a', hor: '#e2a868', bot: '#7a5a40', fog: [40, 270], sunSize: .45, glow: 1.4, haze: .3, sunDir: [.3, .3, -.8]});
  k.lights({sky: '#e8b080', ground: '#6a5a48', hemi: 1.1, sun: '#ffcf9a', sunI: 1.0, dir: [.3, .35, -.8]});
  k.terrain(H, (x, y, z, s, c) => { c.set('#7a7266'); if (y < .35) c.lerp(C_('#5f6442'), smooth(.35, -.1, y) * .9); if (y < -.4) c.lerp(C_('#4a4636'), .7); if (s > .3 || y > 2) c.lerp(C_('#5a4438'), .6); if (y > 6) c.set('#3a3430'); c.multiplyScalar(.9 + .2 * fbm(x * .5, z * .5, 2)); });
  k.water(0, '#4f7468', .84, 800);
  const g1 = PL.stromatolite(1, .6), g2 = PL.stromatolite(1, .9, '#857560', '#566a36');
  const strom = () => k.scatter(NQ(k, 130), () => { const [x, z] = k.ringPt(3, 75); const h = H(x, z); return h > -1.15 && h < .3 ? {x, z, s: rr(.3, 1.5), sy: rr(.6, 1.2), y: h - .1} : null; });
  k.plant(g1, strom(), smat(k), {rad: .5}); k.plant(g2, strom(), smat(k), {rad: .5});
  k.plant(PL.rock(1, '#5a5048'), k.scatter(NQ(k, 50), () => { const [x, z] = k.ringPt(8, 80); return H(x, z) > .3 ? {x, z, s: rr(.3, 1.4), sy: rr(.5, .9)} : null; }), smat(k));
  k.plumes(VOL.map(v => [v[0], v[2] - 2, v[1], v[2] / 14]), NQ(k, 150), {col: '#6a5a50', size: [4, 14], rise: 25, life: 14, alpha: .45, spread: 3, wind: [4, 1]});
  return {H, spawn: [0, 10, 0], inside: (x, z) => dist(x, z) < 80 && H(x, z) > -.6, signOk: (x, z) => H(x, z) > -.45, exp: 1.0, envI: .6};
};

LAND.criogeniano = (k) => {
  const VOL = [[-60, -190, 70], [85, -80, 24]];
  const H = (x, z) => { const d = dist(x, z); let h = 2 + fbm(x * .015, z * .015, 4) * (2 + smooth(30, 90, d) * 4) + fbm(x * .1, z * .1, 2) * .4;
    const cr = ridge(x * .02 + 3, z * .035, 2); h -= smooth(.93, .985, cr) * 7 * smooth(18, 30, d);
    h += Math.pow(Math.max(0, ridge(x * .01, z * .01, 2) - .6), 2) * 60 * smooth(40, 80, d);
    for (const [vx, vz, vh] of VOL) { const dd = dist(x - vx, z - vz), cone = vh * Math.max(0, 1 - dd / (vh * 1.25)) * (.85 + .3 * fbm(x * .08, z * .08, 2)) + 2 - (dd < vh * .15 ? (vh * .15 - dd) * 1.2 : 0); if (cone > h) h = cone; }
    return h; };
  k.H = H;
  k.sky({top: '#6fa8d0', hor: '#e8eff3', bot: '#cfdde6', fog: [70, 360], sunSize: 1, glow: 1, sunDir: [.5, .2, -.7]});
  k.lights({sky: '#cfe4f0', ground: '#e8eef2', hemi: .95, sun: '#fff1d8', sunI: 1.15, dir: [.5, .22, -.7]});
  k.terrain(H, (x, y, z, s, c) => { c.set('#f2f6fa'); c.lerp(C_('#a8d0e6'), smooth(.08, .35, s)); if (y < .5) c.lerp(C_('#3a7ab8'), smooth(.5, -3, y)); for (const [vx, vz, vh] of VOL) { const dd = dist(x - vx, z - vz); if (dd < vh * 1.2 && y > 4) c.lerp(C_('#3a3432'), smooth(.06, .2, s) * (.6 + .4 * fbm(x * .3, y * .5, 2))); } c.multiplyScalar(.95 + .08 * fbm(x * .4, z * .4, 2)); }, {mat: {roughness: .6}});
  k.plant(PL.rock(1, '#bfe0f0'), k.scatter(NQ(k, 50), () => { const [x, z] = k.ringPt(18, 90); return H(x, z) > 1.5 ? {x, z, s: rr(.6, 2.5), sy: rr(.6, 1.6)} : null; }), smat(k, {roughness: .4}));
  k.plumes(VOL.map(v => [v[0], v[2] + 2, v[1], v[2] / 18]), NQ(k, 140), {col: '#5a5450', size: [6, 26], rise: 50, life: 14, alpha: .45, spread: 3, wind: [6, 2]});
  k.drift(NQ(k, 350), {col: '#ffffff', size: [.04, .1], alpha: .85, R: 20, h0: .1, h1: 3, vel: [4, 0, 1.5], ground: true, wob: .2});
  return {H, spawn: [0, 0, .3], inside: (x, z) => dist(x, z) < 80 && H(x, z) > 1.2, signOk: (x, z) => H(x, z) > 1.5, exp: .8, envI: .7};
};

LAND.ediacara = (k) => {
  const H = (x, z) => fbm(x * .03, z * .03, 3) * 1.6 + Math.sin(x * 1.1 + fbm(x * .2, z * .2) * 4) * .04 + smooth(60, 120, dist(x, z)) * 10 * fbm(x * .02 + 4, z * .02);
  k.H = H;
  sea(k, {top: '#8ad0d0', hor: '#2a6e7c', bot: '#0c2a30', fog: .042, surf: 14});
  k.terrain(H, (x, y, z, s, c) => { c.set('#7a6a4a'); c.lerp(C_('#5a5430'), smooth(.4, .7, fbm(x * .6, z * .6, 3)) * .8); c.lerp(C_('#8a6a52'), smooth(.55, .8, fbm(x * .15 + 7, z * .15)) * .6); c.multiplyScalar(.78 + .32 * vnoise(x * 3.5, z * 3.5)); }, {caustics: {i: .2, scale: .4}});
  const bed = (n, r0, r1, f) => k.scatter(n, () => { const [x, z] = k.ringPt(r0, r1); return f(x, z); });
  k.plant(AN.dickinsonia(1), bed(NQ(k, 90), 2, 26, (x, z) => ({x, z, s: rr(.1, .6), y: H(x, z) + .005})), smat(k), {shadow: false});
  k.plant(PL.charnia(1), bed(NQ(k, 170), 2, 30, (x, z) => ({x, z, s: rr(.3, 1)})), pm(k, .07, .7), {rad: .3});
  k.plant(PL.charnia(1, '#d6b49a'), bed(NQ(k, 60), 3, 35, (x, z) => ({x, z, s: rr(.4, 1.2), sx: 1.3})), pm(k, .07, .6), {rad: .3});
  k.plant(AN.kimberella(.12), bed(NQ(k, 50), 2, 22, (x, z) => ({x, z, s: rr(.8, 1.4)})), smat(k), {shadow: false});
  k.plant(AN.tribrachidium(.06), bed(NQ(k, 70), 2, 22, (x, z) => ({x, z, s: rr(1, 1.6)})), smat(k), {shadow: false});
  k.herd(AN.spriggina(.12), amat(k, {wave: .015, k: 40, sp: 4}), Array.from({length: NQ(k, 24)}, () => { const [cx, cz] = k.ringPt(3, 25); return {path: k.circ(cx, cz, rr(.8, 3), rr(.04, .1) * (k.r() < .5 ? 1 : -1), rr(0, TAU)), dy: .01}; }), {shadow: false});
  return {H, spawn: [0, 0, 0], eye: 1.1, under: true, signScale: .6, signLift: .25, inside: (x, z) => dist(x, z) < 55, exp: 1.15, envI: .4, speed: .6, pitch: -.18, note: 'alcuni organismi molto piccoli sono mostrati ingranditi'};
};

LAND.cambriano = (k) => {
  const H = (x, z) => { let h = fbm(x * .04, z * .04, 3) * 1.2; const w = smooth(-22, -34, x + (fbm(z * .03, 3) - .5) * 12); return h + w * (28 + fbm(x * .05, z * .05) * 10); };
  k.H = H;
  sea(k, {top: '#7ab8c0', hor: '#255a68', bot: '#0a2028', fog: .04, surf: 18});
  k.terrain(H, (x, y, z, s, c) => { c.set('#5e5a48'); if (y > 2) { c.set('#5a5448'); if (Math.sin(y * 3.1 + fbm(x * .1, z * .1) * 3) > .3) c.lerp(C_('#7a7262'), .7); } c.multiplyScalar(.85 + .25 * vnoise(x * 2, z * 2)); }, {caustics: {i: .16, scale: .35}});
  const bed = (n, r0, r1, f) => k.scatter(n, () => { const [x, z] = k.ringPt(r0, r1, 0, -6); return H(x, z) < 2 ? f(x, z) : null; });
  k.plant(PL.sponge(.6), bed(NQ(k, 110), 2, 28, (x, z) => ({x, z, s: rr(.6, 1.6)})), pm(k, .03, .5), {rad: .3});
  k.plant(PL.sponge(.5, '#c88a5a'), bed(NQ(k, 60), 2, 28, (x, z) => ({x, z, s: rr(.6, 1.4)})), pm(k, .03, .5), {rad: .3});
  k.plant(PL.seaweed(.6, '#5a6a3a'), bed(NQ(k, 50), 3, 40, (x, z) => ({x, z, s: rr(.6, 1.3)})), pm(k, .08, .7), {shadow: false});
  const swim = (n, f) => Array.from({length: n}, f);
  k.herd(AN.anomalocaris(.5), amat(k, {flap: .7, sp: 3, wave: .02, k: 6}, true), swim(3, (_, i) => ({path: k.circ(rr(-6, 6), -14 + rr(-4, 4), rr(7, 13), rr(.1, .16) * (i % 2 ? 1 : -1), rr(0, TAU), rr(2, 3.5), .5)})), {pitch: .5});
  k.herd(AN.trilobite(.25), amat(k, {}), swim(NQ(k, 30), () => { const [cx, cz] = k.ringPt(2, 25, 0, -6); return {path: k.circ(cx, cz, rr(1, 4), rr(.03, .07) * (k.r() < .5 ? 1 : -1), rr(0, TAU)), dy: .03}; }), {shadow: false});
  // modelli 3D veri (cartella modelli/), ingranditi come gli altri animali piccoli
  const opas = swim(5, () => { const [cx, cz] = k.ringPt(4, 18, 0, -6); return {path: k.circ(cx, cz, rr(2, 5), rr(.1, .2), rr(0, TAU), H(cx, cz) + rr(.5, 1.2), .2)}; });
  k.model('modelli/opabinia.glb', {len: .3, rot: 2.1, credit: 'hymenoptera0908 (Opabinia, CC BY 4.0)'}, opas, () => k.herd(AN.opabinia(.21), amat(k, {flap: .5, sp: 4, wave: .01, k: 20}, true), opas, {pitch: .5, shadow: false}));
  const halls = swim(NQ(k, 20), () => { const [cx, cz] = k.ringPt(2, 15, 0, -6); return {path: k.circ(cx, cz, rr(.5, 2), rr(.02, .05), rr(0, TAU))}; });
  k.model('modelli/hallucigenia.glb', {len: .15, rot: PI, credit: 'huykhoi2407 (Hallucigenia, CC BY 4.0)'}, halls, () => k.herd(AN.hallucigenia(.12), amat(k, {leg: .5, sp: 2}), halls, {shadow: false}));
  k.herd(AN.marrella(.08), amat(k, {wave: .01, k: 30, sp: 6}), swim(NQ(k, 50), () => { const [cx, cz] = k.ringPt(2, 20, 0, -6); return {path: k.circ(cx, cz, rr(1, 4), rr(.15, .3) * (k.r() < .5 ? 1 : -1), rr(0, TAU), H(cx, cz) + rr(.2, 1.2), .3)}; }), {pitch: .5, shadow: false});
  k.herd(AN.pikaia(.15), amat(k, {wave: .03, k: 30, sp: 7}, true), swim(NQ(k, 12), () => { const [cx, cz] = k.ringPt(3, 20, 0, -6); return {path: k.circ(cx, cz, rr(2, 5), rr(.2, .35) * (k.r() < .5 ? 1 : -1), rr(0, TAU), H(cx, cz) + rr(.6, 2), .4)}; }), {pitch: .5, shadow: false});
  k.herd(AN.wiwaxia(.15), amat(k, {}), swim(NQ(k, 18), () => { const [cx, cz] = k.ringPt(2, 20, 0, -6); return {path: k.circ(cx, cz, rr(.3, 1.5), rr(.02, .05), rr(0, TAU)), dy: .02}; }), {shadow: false});
  return {H, spawn: [0, 0, 0], eye: 1.3, under: true, signScale: .65, signLift: .3, inside: (x, z) => dist(x, z) < 55 && H(x, z) < 2.5, exp: 1.15, envI: .4, speed: .6, pitch: -.12, note: 'gli animali più piccoli sono mostrati ingranditi 3–4 volte'};
};

LAND.ordoviciano = (k) => {
  const H = (x, z) => fbm(x * .03, z * .03, 3) * 1.4 + Math.max(0, fbm(x * .06 + 3, z * .06) - .55) * 6 + smooth(55, 110, dist(x, z)) * 8 * fbm(x * .02, z * .02 + 5);
  k.H = H;
  sea(k, {top: '#8ee0e0', hor: '#2a7a8a', bot: '#0c3038', fog: .036, surf: 13, rayOp: .12});
  k.terrain(H, (x, y, z, s, c) => { c.set('#9a8c6c'); c.lerp(C_('#6e6650'), smooth(.4, .7, fbm(x * .3, z * .3, 2))); c.multiplyScalar(.8 + .3 * vnoise(x * 3, z * 3)); }, {caustics: {i: .2, scale: .4}});
  const bed = (n, r0, r1, f) => k.scatter(n, () => { const [x, z] = k.ringPt(r0, r1); return f(x, z); });
  k.plant(PL.coralTab(1, '#b07a4a'), bed(NQ(k, 80), 3, 45, (x, z) => ({x, z, s: rr(.4, 1.4), sy: rr(.7, 1.3)})), smat(k), {rad: .8});
  k.plant(PL.coralTab(1, '#8a6a8a'), bed(NQ(k, 50), 3, 45, (x, z) => ({x, z, s: rr(.3, 1)})), smat(k), {rad: .6});
  k.plant(PL.hornCoral(), bed(NQ(k, 70), 2, 45, (x, z) => ({x, z, s: rr(.8, 1.6)})), smat(k), {rad: .3});
  k.plant(PL.bryozoan(.35), bed(NQ(k, 140), 2, 45, (x, z) => ({x, z, s: rr(.6, 1.5)})), smat(k), {rad: .2, shadow: false});
  const cl = []; for (let i = 0; i < 9; i++) cl.push(k.ringPt(6, 40));
  const crin = (col) => k.scatter(NQ(k, 140), () => { const c = cl[Math.floor(k.r() * cl.length)], [x, z] = k.ringPt(0, 6, c[0], c[1]); return {x, z, s: rr(.5, 1.5)}; });
  k.plant(PL.crinoid(1, '#c4704a'), crin(), pm(k, .12, .6), {rad: .2});
  k.plant(PL.crinoid(1, '#d8b04a'), crin(), pm(k, .12, .6), {rad: .2});
  k.plant(PL.seaweed(.5, '#6a7a3a'), bed(NQ(k, 40), 3, 45, (x, z) => ({x, z, s: rr(.6, 1.2)})), pm(k, .07, .6), {shadow: false});
  const swim = (n, f) => Array.from({length: n}, f);
  k.herd(AN.orthocone(2.5), amat(k, {wave: .03, k: 4, sp: 1}), swim(4, (_, i) => ({path: k.circ(rr(-10, 10), rr(-25, -5), rr(10, 22), rr(.04, .07) * (i % 2 ? 1 : -1), rr(0, TAU), rr(3.5, 6.5), .6)})), {pitch: .5});
  k.herd(AN.trilobite(.35, '#6a5040'), amat(k, {}), swim(NQ(k, 20), () => { const [cx, cz] = k.ringPt(3, 25); return {path: k.circ(cx, cz, rr(1, 4), rr(.03, .06) * (k.r() < .5 ? 1 : -1), rr(0, TAU)), dy: .04}; }), {shadow: false});
  const sch = [[-8, -18], [12, -10], [0, 14]];
  k.herd(AN.jawless(.25), amat(k, {wave: .03, k: 18, sp: 8}, true), swim(NQ(k, 30), (_, i) => { const c = sch[i % 3]; return {path: k.circ(c[0] + rr(-1.5, 1.5), c[1] + rr(-1.5, 1.5), rr(5, 7), .25, i * .07, rr(1.8, 3.2), .3)}; }), {pitch: .5, shadow: false});
  return {H, spawn: [0, 0, 0], eye: 2.2, under: true, signScale: .8, signLift: .6, inside: (x, z) => dist(x, z) < 55, exp: 1.1, envI: .4, speed: .7, pitch: -.1};
};
// gruppi di animali che camminano insieme lungo un cerchio
function group(k, n, cx, cz, R, w, o = {}) { const a0 = o.a0 != null ? o.a0 : rr(0, TAU); return Array.from({length: n}, (_, i) => ({path: k.circ(cx + rr(-1, 1) * (o.sc || 0), cz + rr(-1, 1) * (o.sc || 0), R + rr(-1, 1) * (o.dr != null ? o.dr : 3), w, a0 + i * (o.da != null ? o.da : .12) * Math.sign(w) * -1 + rr(-.03, .03), o.y != null ? o.y : null, o.bob || 0), s: rr(o.s0 || .9, o.s1 || 1.1), dy: o.dy || 0, ph: rr(0, TAU)})); }
const walkSp = (v, hip) => Math.max(.6, 4.6 * v / hip);
const ringList = (k, n, r0, r1, f, cx = 0, cz = 0) => k.scatter(n, () => { const [x, z] = k.ringPt(r0, r1, cx, cz); return f(x, z); });
const farHills = (x, z, a = 12, r0 = 70, r1 = 130) => smooth(r0, r1, dist(x, z)) * a * (.4 + fbm(x * .015 + 11, z * .015 - 7, 3));

LAND.rhynie = (k) => {
  const POOLS = [[-9, -17, 3.5], [12, -23, 4.5], [-21, -35, 5.5], [24, -8, 3]];
  const H = (x, z) => { let h = fbm(x * .05, z * .05, 3) * .8 + fbm(x * .4, z * .4, 2) * .06; for (const [px, pz, r] of POOLS) { const d = dist(x - px, z - pz); h -= smooth(r * 1.2, r * .5, d) * .55; h += smooth(r * 2.2, r * 1.2, d) * .1; } return h + farHills(x, z, 14, 55, 110); };
  k.H = H;
  const inPool = (x, z, m = 1) => POOLS.some(([px, pz, r]) => dist(x - px, z - pz) < r * m);
  k.sky({top: '#5a8fc8', hor: '#cfdde6', fog: [35, 220], sunDir: [.5, .6, -.4]});
  k.lights({sky: '#cfe0f0', ground: '#7a6a50', hemi: 1, sun: '#fff4e0', sunI: 1.1, dir: [.5, .6, -.4]});
  k.clouds(12, 60, 110, {op: .7});
  k.terrain(H, (x, y, z, s, c) => { c.set('#5e5844'); c.lerp(C_('#56683a'), smooth(.35, .65, fbm(x * .2, z * .2, 3)) * .85);
    for (const [px, pz, r] of POOLS) { const d = dist(x - px, z - pz); if (d < r * 2.2) { c.lerp(C_(d < r * 1.5 ? '#e0d4b8' : '#c8803a'), smooth(r * 2.2, r * 1.3, d) * .85); } } });
  for (const [px, pz, r] of POOLS) k.water(H(px + r * 1.15, pz) - .06, '#5fb8b0', .78, r * 2.6, r * 2.6, px, pz, {round: true});
  const pl = (geo, n, r0, r1, s0, s1) => k.plant(geo, ringList(k, NQ(k, n), r0, r1, (x, z) => inPool(x, z, 1.25) ? null : {x, z, s: rr(s0, s1)}), pm(k, .04, .9), {shadow: false, rad: .15});
  pl(PL.rhynio(.6, '#7a9a3a', '#a07a3a', 7, 0), 480, 1.2, 32, .7, 1.3);
  pl(PL.rhynio(.55, '#93a843', '#b89040', 6, 2), 380, 1.2, 32, .7, 1.3);
  pl(PL.rhynio(.2, '#6a8a3a', '#c08a3a', 8, 1), 420, 1, 22, .7, 1.4);
  k.plant(PL.prototaxites(6, .5), ringList(k, 12, 12, 70, (x, z) => inPool(x, z, 1.5) ? null : {x, z, s: rr(.7, 1.3), r: 0}), smat(k), {rad: 1});
  k.herd(AN.smallArthro(.06), amat(k, {leg: .6, sp: 9}), Array.from({length: NQ(k, 16)}, () => { const [cx, cz] = k.ringPt(1.5, 14); return {path: k.circ(cx, cz, rr(.3, 1.2), rr(.05, .15) * (k.r() < .5 ? 1 : -1), rr(0, TAU))}; }), {shadow: false});
  k.plumes(POOLS.map(([x, z, r]) => [x, H(x + r * 1.15, z), z, r / 3]), NQ(k, 120), {col: '#f0f4f4', size: [.6, 3.5], rise: 5, life: 6, alpha: .35, spread: 2, wind: [.6, .2]});
  return {H, spawn: [0, 2, 0], eye: .75, speed: .45, signScale: .5, inside: (x, z) => dist(x, z) < 55 && !inPool(x, z, 1.05), signOk: (x, z) => !inPool(x, z, 1.4), exp: .95, envI: .7, pitch: -.12, note: 'le piantine sono ingrandite circa 3 volte e il punto di vista è basso'};
};

LAND.devmare = (k) => {
  const H = (x, z) => fbm(x * .03, z * .03, 3) * 1.6 + Math.max(0, fbm(x * .05 + 9, z * .05) - .55) * 5 + smooth(55, 110, dist(x, z)) * 8 * fbm(x * .02, z * .02 + 5);
  k.H = H;
  sea(k, {top: '#6ab4c8', hor: '#1f5a78', bot: '#081c28', fog: .034, surf: 16});
  k.terrain(H, (x, y, z, s, c) => { c.set('#7a7460'); c.lerp(C_('#5a5848'), smooth(.4, .7, fbm(x * .3, z * .3, 2))); c.multiplyScalar(.8 + .3 * vnoise(x * 3, z * 3)); }, {caustics: {i: .16, scale: .35}});
  const bed = (n, r0, r1, f) => ringList(k, n, r0, r1, f);
  const cl = []; for (let i = 0; i < 8; i++) cl.push(k.ringPt(6, 40));
  const crin = () => k.scatter(NQ(k, 110), () => { const c = cl[Math.floor(k.r() * cl.length)], [x, z] = k.ringPt(0, 6, c[0], c[1]); return {x, z, s: rr(.6, 1.6)}; });
  k.plant(PL.crinoid(1, '#a85a6a'), crin(), pm(k, .12, .6), {rad: .2});
  k.plant(PL.crinoid(1, '#d0a050'), crin(), pm(k, .12, .6), {rad: .2});
  k.plant(PL.sponge(.7, '#c8a870'), bed(NQ(k, 60), 3, 45, (x, z) => ({x, z, s: rr(.6, 1.6)})), pm(k, .03, .5), {rad: .3});
  k.plant(PL.coralTab(1, '#9a7a5a'), bed(NQ(k, 40), 4, 45, (x, z) => ({x, z, s: rr(.4, 1.2)})), smat(k), {rad: .7});
  k.plant(PL.hornCoral('#a8704a'), bed(NQ(k, 50), 3, 45, (x, z) => ({x, z, s: rr(.8, 1.5)})), smat(k), {rad: .3});
  k.plant(mk().add(G.ell(.045, .022, .04, 8, 4), '#c8b090').geo(), bed(NQ(k, 160), 2, 35, (x, z) => ({x, z, s: rr(.7, 1.4), rx: rr(-.3, .3)})), smat(k), {shadow: false});
  const sw = (n, f) => Array.from({length: n}, f);
  k.herd(AN.dunkleosteus(4.2), amat(k, {wave: .12, k: 1.2, sp: 2.2}, true), sw(2, (_, i) => ({path: k.circ(i ? 8 : -6, i ? -26 : -14, i ? 22 : 15, (i ? -1 : 1) * .05, rr(0, TAU), rr(4, 6), .8)})), {pitch: .5});
  k.herd(AN.shark(1.8), amat(k, {wave: .08, k: 2, sp: 5}, true), sw(NQ(k, 5), (_, i) => ({path: k.circ(rr(-10, 10), rr(-30, -10), rr(8, 16), (i % 2 ? 1 : -1) * rr(.12, .18), rr(0, TAU), rr(3, 8), .6)})), {pitch: .5});
  const ag = [[-6, -10], [10, -16], [0, -28]];
  k.herd(AN.ammonite(.12, '#c8a070', 16), amat(k, {wave: .02, k: 0, sp: 3}), sw(NQ(k, 36), (_, i) => { const c = ag[i % 3]; return {path: k.circ(c[0] + rr(-2, 2), c[1] + rr(-2, 2), rr(1, 3), rr(.04, .09), rr(0, TAU), rr(1.5, 4), .3)}; }), {shadow: false});
  k.herd(AN.fish({L: .3, h: .07, w: .035, col: '#8a96a0', bel: '#d8e0e0', tail: 'hetero'}), amat(k, {wave: .03, k: 12, sp: 9}, true), sw(NQ(k, 30), (_, i) => ({path: k.circ(-12 + rr(-1, 1), -6 + rr(-1, 1), rr(4, 6), .3, i * .08, rr(2, 3.5), .3)})), {pitch: .5, shadow: false});
  return {H, spawn: [0, 0, 0], eye: 2.4, under: true, signScale: .8, signLift: .7, inside: (x, z) => dist(x, z) < 55, exp: 1.05, envI: .4, speed: .7, pitch: -.08};
};

LAND.devpalude = (k) => {
  const zc = x => -16 + Math.sin(x * .03) * 8;
  const H = (x, z) => .7 + fbm(x * .04, z * .04, 3) * .6 - smooth(13, 3, Math.abs(z - zc(x))) * 1.7 + farHills(x, z, 14);
  k.H = H;
  k.sky({top: '#5a92c8', hor: '#d6e0da', fog: [40, 250], sunDir: [.45, .55, -.5]});
  k.lights({sky: '#d0e2ea', ground: '#5a5a3a', hemi: 1, sun: '#fff2dc', sunI: 1.1, dir: [.45, .55, -.5]});
  k.clouds(14, 60, 120, {op: .75});
  k.terrain(H, (x, y, z, s, c) => { c.set('#5a5034'); c.lerp(C_('#4a5a2a'), smooth(.45, .7, fbm(x * .15, z * .15, 3)) * .8); if (y < .3) c.lerp(C_('#3e3828'), smooth(.3, -.2, y)); });
  k.water(0, '#4a6a50', .78, 800);
  const dry = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => H(x, z) > .15 ? f(x, z) : null);
  k.plant(PL.archaeopteris(16), dry(NQ(k, 45), 14, 100, (x, z) => ({x, z, s: rr(.7, 1.3)})), pm(k, .35, .8), {rad: 1});
  k.plant(PL.fern(1.1, '#5a7a36'), dry(NQ(k, 380), 2, 40, (x, z) => ({x, z, s: rr(.6, 1.2)})), pm(k, .12, 1.2), {shadow: false});
  k.plant(PL.horsetail(.6, '#4a7a3a'), ringList(k, NQ(k, 220), 2, 60, (x, z) => { const h = H(x, z); return h > -.2 && h < .5 ? {x, z, s: rr(.6, 1.2)} : null; }), pm(k, .05, 1.1), {shadow: false});
  const tiks = Array.from({length: 3}, (_, i) => { const cx = [-6, 10, -20][i]; return {path: k.circ(cx, zc(cx), rr(2.5, 4), (i % 2 ? 1 : -1) * .07, rr(0, TAU), -.12)}; });
  k.model('modelli/tiktaalik.glb', {len: 2.6, v0: .5, rot: PI / 2, credit: 'kelskora (Tiktaalik, CC BY 4.0)'}, tiks, () => k.herd(AN.tiktaalik(2.6), amat(k, {wave: .1, k: 1.8, sp: 2.5}, true), tiks));
  k.herd(AN.fish({L: 1.4, h: .22, w: .14, col: '#5a6040', bel: '#b0a880', tail: 'round', dorsal2: true}), amat(k, {wave: .06, k: 3, sp: 4}, true), Array.from({length: 5}, () => { const cx = rr(-30, 30); return {path: k.circ(cx, zc(cx), rr(2, 4), rr(.1, .2), rr(0, TAU), -.55)}; }), {shadow: false});
  return {H, spawn: [0, 3, 0], inside: (x, z) => dist(x, z) < 70 && H(x, z) > -.3, signOk: (x, z) => H(x, z) > .05, exp: .95, envI: .7};
};

LAND.carbonifero = (k) => {
  const H = (x, z) => .35 + fbm(x * .04, z * .04, 3) * .7 - smooth(.42, .3, fbm(x * .03 + 5, z * .03)) * .9 + farHills(x, z, 8, 80, 130);
  k.H = H;
  k.sky({top: '#8aa8a0', hor: '#b8c8b0', fog: [12, 120], sunDir: [.4, .7, -.3], glow: .8});
  k.lights({sky: '#d8e8c8', ground: '#4a4a30', hemi: 1.05, sun: '#fff0d0', sunI: .9, dir: [.4, .7, -.3]});
  k.terrain(H, (x, y, z, s, c) => { c.set('#3a3424'); c.lerp(C_('#4a5a2a'), smooth(.4, .7, fbm(x * .2, z * .2, 3)) * .8); if (y < .15) c.lerp(C_('#2e2e22'), .6); });
  k.water(0, '#3e4a34', .82, 800);
  const dry = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => H(x, z) > .1 ? f(x, z) : null);
  const lep = dry(NQ(k, 40), 8, 65, (x, z) => ({x, z, s: rr(.8, 1.15)}));
  const barkL = new T3.MeshStandardMaterial({map: PL.barkTex('lepido', k), roughness: .9});
  k.plant(PL.barkTrunk(22.8, .55, .32), lep, barkL, {tint: false, rad: 1});
  k.plant(PL.lepidoCrown(30), lep, pm(k, .25, .6), {rad: 1});
  const sig = dry(NQ(k, 30), 8, 65, (x, z) => ({x, z, s: rr(.8, 1.2)}));
  const barkS = new T3.MeshStandardMaterial({map: PL.barkTex('sigi', k), roughness: .9});
  k.plant(PL.barkTrunk(18, .5, .38), sig, barkS, {tint: false, rad: 1});
  k.plant(PL.sigiCrown(20), sig, pm(k, .25, .7), {rad: 1});
  k.plant(PL.calamites(10), ringList(k, NQ(k, 110), 5, 55, (x, z) => H(x, z) > -.3 ? {x, z, s: rr(.6, 1.2)} : null), pm(k, .25, .8), {rad: .5});
  k.plant(PL.treeFern(6, '#3a7a3a'), dry(NQ(k, 60), 5, 55, (x, z) => ({x, z, s: rr(.7, 1.2)})), pm(k, .25, .9), {rad: .6});
  k.plant(PL.fern(1.2, '#4a7a32'), dry(NQ(k, 520), 2, 45, (x, z) => ({x, z, s: rr(.6, 1.3)})), pm(k, .12, 1.1), {shadow: false});
  k.plant(PL.log(9, .45), dry(NQ(k, 14), 6, 60, (x, z) => ({x, z, y: H(x, z) + .2, s: rr(.7, 1.3)})), smat(k), {rad: 3});
  const fl = Array.from({length: NQ(k, 6)}, (_, i) => ({path: k.circ(rr(-10, 10), rr(-18, 2), rr(5, 12), (i % 2 ? 1 : -1) * rr(.3, .5), rr(0, TAU), rr(2, 4.5), 1.2), roll: (i % 2 ? -1 : 1) * .25}));
  k.herd(AN.dragonfly(.7), amat(k, {wave: .01, k: 10, sp: 6}), fl, {shadow: false});
  k.herd(AN.dragonWings(.7), k.anim({flap: .35, sp: 28}, {side: T3.DoubleSide, transparent: true, opacity: .55, depthWrite: false, roughness: .4}), fl, {shadow: false});
  k.herd(AN.arthropleura(), amat(k, {leg: .5, sp: 7, wave: .04, k: 3}), [{path: k.circ(9, -15, 6, .06, 0)}, {path: k.circ(-13, -9, 8, -.05, 2)}], {shadow: false});
  k.drift(NQ(k, 200), {col: '#eef0c8', size: [.02, .05], alpha: .5, R: 18, h0: -1, h1: 8, vel: [.1, .02, .05]});
  return {H, spawn: [0, 0, 0], inside: (x, z) => dist(x, z) < 70 && H(x, z) > -.15, signOk: (x, z) => H(x, z) > .1, exp: 1.05, envI: .6};
};

LAND.permiano = (k) => {
  const zc = x => -18 + Math.sin(x * .04) * 6, MESA = [[-60, -120, 28], [70, -140, 34], [130, -40, 24]];
  const H = (x, z) => { const d = dist(x, z), rz = Math.abs(z - zc(x)); let h = .6 + fbm(x * .03, z * .03, 3) * 1.0 - smooth(6, 1.5, rz) * .95;
    h += smooth(45, 90, d) * (.5 + .5 * Math.sin(x * .08 + fbm(x * .02, z * .02) * 4)) * 6;
    for (const [mx, mz, r] of MESA) h += smooth(r + 8, r, dist(x - mx, z - mz)) * (22 + fbm(x * .05, z * .05) * 4);
    return h; };
  k.H = H;
  k.sky({top: '#5a90c8', hor: '#e8d2b0', fog: [60, 300], fogCol: '#dcc8a8', sunDir: [.3, .9, -.3]});
  k.lights({sky: '#e0e8f0', ground: '#a85a3a', hemi: 1, sun: '#fff0d8', sunI: 1.45, dir: [.3, .9, -.3]});
  k.clouds(6, 70, 110, {op: .5});
  k.terrain(H, (x, y, z, s, c) => { c.set('#a8543a'); c.lerp(C_('#c07a4a'), fbm(x * .1, z * .1, 3)); if (y > 8) { c.set(Math.sin(y * 1.3) > 0 ? '#a04a32' : '#d0a080'); } const rz = Math.abs(z - zc(x)); c.lerp(C_('#5a4a34'), smooth(10, 3, rz) * .8); });
  k.water(0, '#6a7a6a', .8, 800);
  const nearR = (n, w, f) => ringList(k, n, 2, 90, (x, z) => Math.abs(z - zc(x)) < w && H(x, z) > .1 ? f(x, z) : null);
  k.plant(PL.walchia(7), nearR(NQ(k, 50), 18, (x, z) => ({x, z, s: rr(.7, 1.4)})), pm(k, .2, .8), {rad: .8});
  k.plant(PL.fern(1.6, '#5a7a3a'), nearR(NQ(k, 160), 14, (x, z) => ({x, z, s: rr(.6, 1.2)})), pm(k, .15, 1), {shadow: false});
  k.plant(PL.horsetail(1, '#6a7a3a'), nearR(NQ(k, 130), 6, (x, z) => ({x, z, s: rr(.6, 1.3)})), pm(k, .05, 1), {shadow: false});
  k.plant(PL.shrub(.5, '#6a6a3a'), ringList(k, NQ(k, 50), 5, 80, (x, z) => ({x, z, s: rr(.5, 1.2)})), smat(k), {shadow: false});
  k.plant(PL.rock(1, '#8a4a34'), ringList(k, NQ(k, 60), 4, 80, (x, z) => ({x, z, s: rr(.3, 1.4), sy: rr(.4, .8)})), smat(k), {rad: .5});
  const yz = (x) => zc(x);
  k.herd(AN.synapsid({kind: 'dimetro', col: '#6a5a44', sail: '#a0503a'}), amat(k, {leg: .5, sp: 3.5, wave: .06, k: 1.5}, true), [{path: k.circ(-14, yz(-14) + 4, 6, .1, 0)}, {path: k.circ(20, yz(20) + 6, 8, -.08, 1)}, {path: k.circ(32, yz(32) - 8, 5, .1, 2)}]);
  k.herd(AN.synapsid({kind: 'edapho', col: '#5a6a4a', sail: '#8a6a4a'}), amat(k, {leg: .5, sp: 3, wave: .06, k: 1.5}, true), group(k, 4, -30, yz(-30) - 2, 10, .06, {da: .25, dr: 2}));
  k.drift(NQ(k, 120), {col: '#e0c8a0', size: [.03, .08], alpha: .5, R: 20, h0: 0, h1: 4, vel: [2, 0, .5], ground: true});
  return {H, spawn: [0, 0, 0], inside: (x, z) => dist(x, z) < 70 && H(x, z) > -.15, signOk: (x, z) => H(x, z) > .1, exp: .88, envI: .7};
};

LAND.triassico = (k) => {
  const zc = x => -22 + Math.sin(x * .05) * 5;
  const H = (x, z) => .5 + fbm(x * .035, z * .035, 3) * .9 - smooth(9, 2.5, Math.abs(z - zc(x))) * 1.3 + smooth(55, 100, dist(x, z)) * 16 * (.4 + fbm(x * .02, z * .02, 3));
  k.H = H;
  k.sky({top: '#4a88c8', hor: '#e0dccc', fog: [60, 320], sunDir: [.5, .7, -.4]});
  k.lights({sky: '#d8e4ee', ground: '#8a7050', hemi: 1, sun: '#fff0d8', sunI: 1.3, dir: [.5, .7, -.4]});
  k.clouds(12, 60, 110, {op: .7});
  k.terrain(H, (x, y, z, s, c) => { c.set('#8a7a5a'); c.lerp(C_('#6a6a3a'), smooth(.4, .7, fbm(x * .15, z * .15, 3)) * .7); if (y > 4) { const b = Math.sin(y * 1.1 + fbm(x * .05, z * .05) * 2); c.set(b > .3 ? '#a8705a' : b > -.4 ? '#c8b8a8' : '#7a6a6a'); } if (y < .2) c.lerp(C_('#4a4434'), .6); });
  k.water(0, '#5a7a6a', .8, 800);
  const dry = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => { const h = H(x, z); return h > .15 && h < 3 ? f(x, z) : null; });
  k.plant(PL.conifer(18, '#2e4e30'), dry(NQ(k, 40), 15, 90, (x, z) => ({x, z, s: rr(.7, 1.3)})), pm(k, .2, .7), {rad: 1});
  k.plant(PL.seedFern(4.5), dry(NQ(k, 50), 8, 80, (x, z) => ({x, z, s: rr(.7, 1.3)})), pm(k, .2, .9), {rad: .6});
  k.plant(PL.fern(1, '#5a7a3a'), dry(NQ(k, 420), 2, 45, (x, z) => ({x, z, s: rr(.6, 1.2)})), pm(k, .12, 1.1), {shadow: false});
  k.plant(PL.horsetail(1.2, '#5d7d3a'), ringList(k, NQ(k, 160), 3, 70, (x, z) => Math.abs(z - zc(x)) < 6 && H(x, z) > -.2 ? {x, z, s: rr(.6, 1.2)} : null), pm(k, .05, 1), {shadow: false});
  k.herd(AN.theropod({s: 1, col: '#7a6a4a', dark: '#4a3a2a', bel: '#c8b898', str: true}), amat(k, {leg: .45, sp: walkSp(1.3, 1.18), wave: .05, k: .8}), [{path: k.circ(-12, -36, 20, .065, 1)}]);
  k.herd(AN.theropod({s: .23, col: '#8a6a4a', dark: '#5a4030', bel: '#d8c8a8', str: true}), amat(k, {leg: .45, sp: walkSp(1, .27), wave: .02, k: 3}), group(k, 3, 18, -26, 5, .2, {da: .5, dr: 1}), {shadow: false});
  k.herd(AN.rhyncho(), amat(k, {leg: .5, sp: walkSp(.4, .35), wave: .02, k: 4}), group(k, NQ(k, 10), -24, -14, 9, .045, {da: .2, dr: 2.5}), {shadow: false});
  k.herd(AN.cynodont(), amat(k, {leg: .5, sp: walkSp(.6, .5), wave: .03, k: 3}), group(k, 4, 22, -44, 8, -.075, {da: .25, dr: 1.5}));
  return {H, spawn: [0, 2, 0], inside: (x, z) => dist(x, z) < 70 && H(x, z) > -.25, signOk: (x, z) => H(x, z) > .15, exp: .9, envI: .7};
};

LAND.giurassico = (k) => {
  const zc = x => -38 + Math.sin(x * .025) * 10;
  const H = (x, z) => .5 + fbm(x * .03, z * .03, 3) * 1.2 - smooth(12, 4, Math.abs(z - zc(x))) * 1.6 + farHills(x, z, 18, 90, 150);
  k.H = H;
  k.sky({top: '#4a86c8', hor: '#d8e0e0', fog: [70, 400], sunDir: [.5, .7, -.4]});
  k.lights({sky: '#d8e6f0', ground: '#7a7050', hemi: 1, sun: '#fff2dc', sunI: 1.35, dir: [.5, .7, -.4]});
  k.clouds(14, 70, 130, {op: .75});
  k.terrain(H, (x, y, z, s, c) => { c.set('#6a6a3a'); c.lerp(C_('#9a8a5a'), smooth(.45, .7, fbm(x * .08, z * .08, 3)) * .8); if (y < .2) c.lerp(C_('#5a5440'), .7); });
  k.water(0, '#5a7a70', .8, 900);
  const dry = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => H(x, z) > .15 ? f(x, z) : null);
  k.plant(PL.fern(1, '#5a8a3a'), dry(NQ(k, 1000), 2, 60, (x, z) => ({x, z, s: rr(.7, 1.4)})), pm(k, .12, 1.1), {shadow: false});
  k.plant(PL.cycad(1.6), dry(NQ(k, 110), 4, 80, (x, z) => ({x, z, s: rr(.6, 1.3)})), pm(k, .06, .8), {rad: .5});
  k.plant(PL.araucaria(28), dry(NQ(k, 34), 22, 110, (x, z) => ({x, z, s: rr(.7, 1.2)})), pm(k, .3, .5), {rad: 1});
  k.plant(PL.ginkgo(12), dry(NQ(k, 16), 15, 90, (x, z) => ({x, z, s: rr(.7, 1.2)})), pm(k, .2, .8), {rad: 1});
  k.plant(PL.conifer(14, '#2e5032'), dry(NQ(k, 24), 20, 100, (x, z) => ({x, z, s: rr(.7, 1.3)})), pm(k, .2, .7), {rad: 1});
  k.plant(PL.treeFern(5), ringList(k, NQ(k, 26), 8, 80, (x, z) => Math.abs(z - zc(x)) < 16 && H(x, z) > .1 ? {x, z, s: rr(.7, 1.2)} : null), pm(k, .2, .9), {rad: .6});
  k.plant(PL.horsetail(1.3, '#5d7d3a'), ringList(k, NQ(k, 200), 5, 90, (x, z) => Math.abs(z - zc(x)) < 8 && H(x, z) > -.2 ? {x, z, s: rr(.6, 1.3)} : null), pm(k, .05, 1), {shadow: false});
  k.herd(AN.sauropod({kind: 'brachio', col: '#7a7462', dark: '#5a5446', bel: '#a8a08a'}), amat(k, {leg: .28, sp: walkSp(.56, 5.5), wave: .25, k: .25}), [{path: k.circ(-30, -72, 28, .02, 1)}, {path: k.circ(-30, -72, 33, .02, 1.5)}], {s0: 1});
  k.herd(AN.sauropod({kind: 'diplo', col: '#8a7e64', dark: '#5e5440', bel: '#b8ae94', str: true}), amat(k, {leg: .3, sp: walkSp(.63, 3.8), wave: .35, k: .2}), group(k, 4, 45, -85, 35, -.018, {da: .5, dr: 4}));
  // modelli 3D veri (cartella modelli/); i sauropodi restano quelli fatti dal codice (nessun modello gratuito fedele)
  const stegos = group(k, 3, -26, -18, 13, .05, {da: .4, dr: 2});
  k.model('modelli/stegosauro.glb', {len: 7, v0: 1.1, clip: /walk/i, credit: 'Ferocious Industries (stegosauro, CC BY 4.0)'}, stegos, () => k.herd(AN.stego({col: '#7d7a52', plate: '#b0603a'}), amat(k, {leg: .35, sp: walkSp(.7, 2.2), wave: .1, k: .6}), stegos));
  const allos = [{path: k.circ(46, -24, 20, .07, 3)}];
  k.model('modelli/allosauro.glb', {len: 8.5, v0: 1.6, rot: PI / 2, credit: 'Anees Animates (allosauro, CC BY-NC 4.0)'}, allos, () => k.herd(AN.theropod({s: 1.9, hd: 1.25, col: '#8a6a4a', dark: '#5a4030', bel: '#d0c0a0', str: true, crest: '#a05030'}), amat(k, {leg: .42, sp: walkSp(1.4, 2.2), wave: .1, k: .4}), allos));
  const pteros = Array.from({length: NQ(k, 5)}, (_, i) => ({path: k.circ(rr(-15, 15), rr(-40, -15), rr(22, 40), (i % 2 ? 1 : -1) * rr(.15, .22), rr(0, TAU), rr(16, 30), 2), roll: (i % 2 ? -1 : 1) * .3}));
  k.model('modelli/ranforinco.glb', {len: 2, rot: PI / 2, credit: 'Robear (pterosauro Rhamphorhynchus, CC BY 4.0)'}, pteros, () => k.herd(AN.pterosaur({span: 2.5, neck: .12, beak: .18, tail: .6, crest: '#a04030'}), amat(k, {flap: .7, sp: 4}, true), pteros, {shadow: false}));
  return {H, spawn: [0, 0, 0], inside: (x, z) => dist(x, z) < 75 && H(x, z) > -.25, signOk: (x, z) => H(x, z) > .15, exp: .9, envI: .7};
};

LAND.maremeso = (k) => {
  const H = (x, z) => fbm(x * .025, z * .025, 3) * 2.2 + smooth(55, 110, dist(x, z)) * 6 * fbm(x * .02, z * .02 + 5);
  k.H = H;
  sea(k, {top: '#5ab0d8', hor: '#1a5a88', bot: '#061a2c', fog: .03, surf: 18, rayOp: .09});
  k.terrain(H, (x, y, z, s, c) => { c.set('#6a6a62'); c.lerp(C_('#4a4c48'), smooth(.4, .7, fbm(x * .2, z * .2, 2))); c.multiplyScalar(.8 + .3 * vnoise(x * 2, z * 2)); }, {caustics: {i: .1, scale: .3}});
  const bed = (n, r0, r1, f) => ringList(k, n, r0, r1, f);
  k.plant(PL.sponge(.8, '#d8d0b0'), bed(NQ(k, 60), 3, 45, (x, z) => ({x, z, s: rr(.6, 1.6)})), pm(k, .02, .5), {rad: .3});
  k.plant(PL.crinoid(1, '#a86a8a'), bed(NQ(k, 50), 3, 40, (x, z) => ({x, z, s: rr(.5, 1.1)})), pm(k, .1, .6), {rad: .2});
  k.plant(PL.rock(1, '#5a5a56'), bed(NQ(k, 30), 4, 50, (x, z) => ({x, z, s: rr(.3, 1.2), sy: rr(.4, .8)})), smat(k), {rad: .5});
  // tronco alla deriva con gigli di mare appesi (Seirocrinus)
  const LX = 7, LZ = -16, LY = 17.3;
  k.inst(PL.log(10, .45, '#5a4a38'), [{x: LX, y: LY, z: LZ, r: .4, s: 1}], smat(k));
  k.inst(PL.crinoid(7, '#d08ab8', '#e8dcc0'), Array.from({length: 7}, (_, i) => ({x: LX + Math.cos(.4) * (i - 3) * 1.3, y: LY - .2, z: LZ - Math.sin(.4) * (i - 3) * 1.3, rx: PI, r: rr(0, TAU), s: rr(.7, 1.1)})), pm(k, .25, .4), {shadow: false});
  const sw = (n, f) => Array.from({length: n}, f);
  k.herd(AN.ichthyo(), amat(k, {wave: .14, k: 2, sp: 6, flap: .15}, true), sw(4, (_, i) => ({path: k.circ(rr(-6, 6), rr(-22, -10), rr(10, 22), (i % 2 ? 1 : -1) * rr(.12, .17), rr(0, TAU), rr(4, 10), 1), s: rr(.9, 1.2)})), {pitch: .5});
  // modelli 3D veri (cartella modelli/): pliosauro (come Hauffiosaurus) e ammoniti; ittiosauri e belemniti restano quelli fatti dal codice
  const plesios = sw(2, (_, i) => ({path: k.circ(i ? 10 : -8, i ? -30 : -20, i ? 22 : 16, (i ? -1 : 1) * .07, rr(0, TAU), rr(6, 10), .8)}));
  k.model('modelli/pliosauro.glb', {len: 4.5, credit: 'animalanimator (pliosauro, CC BY 4.0)'}, plesios, () => k.herd(AN.plesio(), amat(k, {wave: .06, k: 1.5, sp: 1.8, flap: .5}, true), plesios, {pitch: .5}));
  const ag = [[-8, -8], [9, -12], [-2, -26], [14, -24]];
  // le ammoniti nuotano all'indietro, con la conchiglia davanti (spinta a getto come il nautilo)
  const amms = sw(NQ(k, 36), (_, i) => { const c = ag[i % 4]; return {path: k.circ(c[0] + rr(-2, 2), c[1] + rr(-2, 2), rr(1, 3.5), rr(.04, .08) * (i % 2 ? 1 : -1), rr(0, TAU), rr(2, 7), .4), s: rr(.5, 1.4)}; });
  k.model('modelli/ammonite.glb', {len: .5, rot: PI, sRef: 1, credit: 'Emil van Dam (ammonite, CC BY 4.0)'}, amms, () => k.herd(AN.ammonite(.3), amat(k, {wave: .03, k: 0, sp: 3}), amms, {shadow: false}));
  k.herd(AN.belemnite(), amat(k, {wave: .02, k: 6, sp: 8}, true), sw(NQ(k, 40), (_, i) => { const c = i % 2 ? [-14, -14] : [12, -4]; return {path: k.circ(c[0] + rr(-1, 1), c[1] + rr(-1, 1), rr(3.5, 4.5), .3, i * .1, rr(4, 6), .3), s: rr(1, 1.4)}; }), {shadow: false, pitch: .5});
  k.herd(AN.fish({L: .25, h: .06, w: .03, col: '#9aa8b0', bel: '#e0e8e8', tail: 'fork'}), amat(k, {wave: .03, k: 14, sp: 10}, true), sw(NQ(k, 60), (_, i) => ({path: k.circ(-4 + rr(-1.2, 1.2), -6 + rr(-1.2, 1.2), rr(5, 7), .35, i * .06, rr(5, 7.5), .3)})), {pitch: .5, shadow: false});
  return {H, spawn: [0, 0, 0], eye: 5, under: true, signScale: .9, signLift: 3, inside: (x, z) => dist(x, z) < 60, exp: 1.05, envI: .4, speed: .7, pitch: -.05};
};

LAND.cretaceo = (k) => {
  const zc = x => -32 + Math.sin(x * .03) * 8;
  const H = (x, z) => .5 + fbm(x * .03, z * .03, 3) * 1 - smooth(11, 3, Math.abs(z - zc(x))) * 1.6 + farHills(x, z, 12);
  k.H = H;
  k.sky({top: '#4a84c4', hor: '#dce4e0', fog: [55, 330], sunDir: [.5, .65, -.45]});
  k.lights({sky: '#d8e6f0', ground: '#5a5a3a', hemi: 1, sun: '#fff0d8', sunI: 1.3, dir: [.5, .65, -.45]});
  k.clouds(14, 70, 130, {op: .75});
  k.terrain(H, (x, y, z, s, c) => { c.set('#4e4a30'); c.lerp(C_('#4a5e2a'), smooth(.4, .7, fbm(x * .12, z * .12, 3)) * .8); if (y < .2) c.lerp(C_('#5a5440'), .7); });
  k.water(0, '#4a6a5a', .8, 900);
  const dry = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => H(x, z) > .15 ? f(x, z) : null);
  k.plant(PL.broadleaf(12, '#3a6a30'), dry(NQ(k, 45), 15, 100, (x, z) => ({x, z, s: rr(.7, 1.3)})), pm(k, .3, .8), {rad: 1});
  k.plant(PL.broadleaf(8, '#3d6a32', '#5a4636', {flowers: 26, fcol: '#f4ece0', fs: .14}), dry(NQ(k, 22), 12, 80, (x, z) => ({x, z, s: rr(.7, 1.2)})), pm(k, .25, .8), {rad: .8});
  k.plant(PL.fanPalm(4), dry(NQ(k, 45), 8, 90, (x, z) => ({x, z, s: rr(.6, 1.4)})), pm(k, .2, .9), {rad: .6});
  k.plant(PL.fanPalm(.15, '#5a7a48'), dry(NQ(k, 80), 3, 70, (x, z) => ({x, z, s: rr(.6, 1.1)})), pm(k, .08, 1), {shadow: false});
  k.plant(PL.conifer(22, '#2a4a2c'), dry(NQ(k, 34), 20, 110, (x, z) => ({x, z, s: rr(.7, 1.3)})), pm(k, .2, .7), {rad: 1});
  k.plant(PL.fern(1, '#4e7a34'), dry(NQ(k, 700), 2, 50, (x, z) => ({x, z, s: rr(.6, 1.3)})), pm(k, .12, 1.1), {shadow: false});
  k.plant(PL.horsetail(1.2, '#5d7d3a'), ringList(k, NQ(k, 150), 5, 90, (x, z) => Math.abs(z - zc(x)) < 7 && H(x, z) > -.2 ? {x, z, s: rr(.6, 1.2)} : null), pm(k, .05, 1), {shadow: false});
  // modelli 3D veri (cartella modelli/); gli edmontosauri restano quelli fatti dal codice (nessun modello gratuito fedele)
  const ceras = group(k, 4, -24, -55, 22, .03, {da: .35, dr: 3});
  k.model('modelli/triceratopo.glb', {len: 8, v0: 1.2, credit: 'D.art (triceratopo, CC BY-NC 4.0)'}, ceras, () => k.herd(AN.ceratops(), amat(k, {leg: .32, sp: walkSp(.66, 2.2), wave: .05, k: .8}), ceras));
  k.herd(AN.hadro(), amat(k, {leg: .32, sp: walkSp(.9, 3.2), wave: .1, k: .5}), group(k, 6, 48, -72, 30, -.03, {da: .25, dr: 4}));
  const rexes = [{path: k.circ(52, 8, 25, .05, 2)}];
  k.model('modelli/tirannosauro.glb', {len: 12, v0: 1.3, clip: /walk/i, credit: 'animalanimator (tirannosauro, CC BY 4.0)'}, rexes, () => k.herd(AN.theropod({s: 2.65, hd: 1.6, g: 1.25, arm: .35, col: '#6a5a40', dark: '#4a3a28', bel: '#b8a888'}), amat(k, {leg: .4, sp: walkSp(1.25, 3.1), wave: .12, k: .3}), rexes));
  const quetz = [{path: k.circ(-10, -40, 70, .05, 0, 55, 3), roll: .2}, {path: k.circ(20, -60, 90, -.04, 2, 48, 3), roll: -.2}];
  k.model('modelli/quetzalcoatlo.glb', {len: 10, rot: PI / 2, credit: 'agusardwinata (pterosauro Quetzalcoatlus, CC BY 4.0)'}, quetz, () => k.herd(AN.pterosaur({span: 10, neck: .5, beak: .5, crest: '#c04a30', col: '#d8d0c0', wcol: '#8a6a5a'}), amat(k, {flap: .45, sp: 1.3}, true), quetz));
  k.herd(AN.bird(.5, '#3a3a3a'), amat(k, {flap: 1, sp: 10}, true), Array.from({length: NQ(k, 6)}, (_, i) => ({path: k.circ(rr(-20, 20), rr(-40, -10), rr(10, 25), (i % 2 ? 1 : -1) * rr(.3, .4), rr(0, TAU), rr(10, 20), 1.5), roll: (i % 2 ? -1 : 1) * .3})), {shadow: false});
  return {H, spawn: [0, 0, 0], inside: (x, z) => dist(x, z) < 75 && H(x, z) > -.25, signOk: (x, z) => H(x, z) > .15, exp: .9, envI: .7};
};

LAND.eocene = (k) => {
  const LC = [0, -50], LR0 = 28;
  const H = (x, z) => 1 + fbm(x * .035, z * .035, 3) * 1.5 - smooth(LR0 + 4, LR0 - 6, dist(x - LC[0], z - LC[1])) * 3.6 + farHills(x, z, 20, 70, 120);
  k.H = H;
  k.sky({top: '#5a90c0', hor: '#dfe6dc', fog: [35, 260], sunDir: [.45, .6, -.5]});
  k.lights({sky: '#d8e6e4', ground: '#4a4a30', hemi: 1, sun: '#fff0d8', sunI: 1.2, dir: [.45, .6, -.5]});
  k.clouds(12, 60, 120, {op: .8});
  k.terrain(H, (x, y, z, s, c) => { c.set('#3e3c26'); c.lerp(C_('#5a4a2e'), smooth(.4, .7, fbm(x * .2, z * .2, 3)) * .7); if (y < .4) c.lerp(C_('#4a4436'), smooth(.4, 0, y)); });
  k.water(0, '#3a5a4a', .85, 120, 120, LC[0], LC[1]);
  const dry = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => H(x, z) > .5 ? f(x, z) : null);
  k.plant(PL.broadleaf(16, '#2f5a2a', '#4a3a2a', {blobs: 7}), dry(NQ(k, 80), 10, 100, (x, z) => ({x, z, s: rr(.7, 1.3)})), pm(k, .3, .7), {rad: 1.2});
  k.plant(PL.broadleaf(9, '#3a6a32'), dry(NQ(k, 50), 8, 90, (x, z) => ({x, z, s: rr(.7, 1.2)})), pm(k, .25, .8), {rad: .8});
  k.plant(PL.palm(9), dry(NQ(k, 40), 8, 90, (x, z) => ({x, z, s: rr(.7, 1.3)})), pm(k, .25, .9), {rad: .6});
  k.plant(PL.treeFern(5, '#3f7a3a'), dry(NQ(k, 20), 6, 70, (x, z) => ({x, z, s: rr(.7, 1.1)})), pm(k, .2, .9), {rad: .6});
  k.plant(PL.fern(1, '#4e8a3a'), dry(NQ(k, 560), 2, 45, (x, z) => ({x, z, s: rr(.6, 1.3)})), pm(k, .12, 1.1), {shadow: false});
  k.plant(PL.shrub(.8, '#3e6a32'), dry(NQ(k, 100), 4, 80, (x, z) => ({x, z, s: rr(.6, 1.4)})), pm(k, .05, .8), {shadow: false});
  // l'albero di Darwinius, con un ramo basso verso il visitatore
  const TX = 2, TZ = -20, tb = mk(); tb.add(G.loft([[0, -.3, 0, .32], [0, 3, 0, .24], [0, 7, 0, .16]], 8), '#4a3a2a').add(G.loft([[0, 2.2, 0, .14], [.2, 2.45, 1.6, .1], [.3, 2.55, 3.2, .06]], 6), '#4a3a2a');
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, r = i ? 2.2 : 0, s = i ? 2 : 2.6; tb.add(G.organic(G.tr(G.ico(s, 1), Math.cos(a) * r, i ? 7.5 : 8.6, Math.sin(a) * r), s * .3, 1.2 / s, i), '#2f5a2a'); }
  k.inst(tb.geo({ao: .5, aoH: .8, wave: (x, y) => Math.max(0, y - 6) * .05}), [{x: TX, y: H(TX, TZ), z: TZ, r: 0}], pm(k, .3, .7));
  k.inst(AN.primate(), [{x: TX + .2, y: H(TX, TZ) + 2.5, z: TZ + 2.2, r: -PI / 2 + .3, s: 1, mv: 0}], amat(k, {wave: .05, k: 0, sp: 1}));
  k.herd(AN.horse({s: .3, col: '#6a5038', dark: '#3a2a1a', bel: '#a88a68', arch: 1, noMane: true}), amat(k, {leg: .4, sp: walkSp(.6, .33)}), group(k, 6, -17, -13, 7, .085, {da: .3, dr: 1.2}), {shadow: false});
  k.herd(AN.gastornis(), amat(k, {leg: .4, sp: walkSp(.6, 1)}), group(k, 2, 24, -16, 8, -.075, {da: .5, dr: 1}));
  // coccodrilli di Messel (Diplocynodon, parente degli alligatori): modello 3D di un alligatore, cartella modelli/
  const crocs = [{path: k.circ(LC[0] - 4, LC[1], 10, .05, 0, -.06)}, {path: k.circ(LC[0] + 6, LC[1] - 4, 7, -.06, 2, -.06)}];
  k.model('modelli/diplocinodonte.glb', {len: 2, v0: .5, clip: /trot/i, credit: 'WildMesh 3D (alligatore come Diplocynodon, CC BY-NC 4.0)'}, crocs, () => k.herd(AN.croc(2), amat(k, {wave: .08, k: 2, sp: 2}), crocs, {shadow: false}));
  k.herd(AN.bird(.4, '#2a2a2a'), amat(k, {flap: 1, sp: 11}, true), Array.from({length: NQ(k, 8)}, (_, i) => ({path: k.circ(LC[0] + rr(-6, 6), LC[1] + rr(-6, 6), rr(12, 22), (i % 2 ? 1 : -1) * rr(.3, .45), rr(0, TAU), rr(9, 18), 1.5), roll: (i % 2 ? -1 : 1) * .3})), {shadow: false});
  k.drift(NQ(k, 120), {col: '#f0f0d0', size: [.02, .04], alpha: .6, R: 16, h0: 0, h1: 5, vel: [.1, .05, .05], tw: 2});
  return {H, spawn: [0, 2, 0], inside: (x, z) => dist(x, z) < 70 && H(x, z) > .3, signOk: (x, z) => H(x, z) > .5, exp: .95, envI: .7};
};

LAND.savana = (k) => {
  const VC = [-90, -175, 70], AC = [0, -4];
  const H = (x, z) => { const d = dist(x, z); let h = .3 + fbm(x * .025, z * .025, 3) * 1.2 + farHills(x, z, 10, 80, 140);
    const dv = dist(x - VC[0], z - VC[1]); h = Math.max(h, VC[2] * Math.max(0, 1 - dv / (VC[2] * 2.6)) - (dv < 10 ? (10 - dv) : 0));
    const da = dist(x - AC[0], z - AC[1]); return lerp(h, .5, smooth(10, 6, da)); };
  k.H = H;
  const ash = (x, z) => dist(x - AC[0], z - AC[1]) < 8.5;
  k.sky({top: '#3f7fd0', hor: '#e6e2d4', fog: [80, 430], sunDir: [.5, .8, -.3]});
  k.lights({sky: '#dce8f4', ground: '#9a8a5a', hemi: 1, sun: '#fff4e0', sunI: 1.4, dir: [.5, .8, -.3]});
  k.clouds(16, 70, 130, {op: .8});
  k.terrain(H, (x, y, z, s, c) => { c.set('#9a8a5a'); c.lerp(C_('#7a7a42'), smooth(.45, .7, fbm(x * .1, z * .1, 3)) * .6); const da = dist(x - AC[0], z - AC[1]); c.lerp(C_('#8e897e'), smooth(9.5, 7.5, da)); if (y > 6) c.lerp(C_('#6a6050'), .6); });
  const open = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => ash(x, z) ? null : f(x, z));
  k.plant(PL.tuft(.7, '#8a9a4a', '#d8c87a'), open(NQ(k, 3000), 2, 55, (x, z) => ({x, z, s: rr(.6, 1.3)})), pm(k, .12, 1.4), {shadow: false, tint: '#ffffff', v: .25});
  k.plant(PL.tuft(.8, '#9a9a52', '#e0d08a', 5), open(NQ(k, 1400), 50, 120, (x, z) => ({x, z, s: rr(1, 1.8)})), pm(k, .12, 1.4), {shadow: false, v: .25});
  k.plant(PL.tuft(.5, '#7a8a3a', '#b8b860', 9), open(NQ(k, 1200), 2, 50, (x, z) => ({x, z, s: rr(.6, 1.2)})), pm(k, .1, 1.4), {shadow: false});
  k.plant(PL.acacia(7), open(NQ(k, 40), 15, 120, (x, z) => ({x, z, s: rr(.7, 1.3)})), pm(k, .2, .7), {rad: 1});
  k.plant(PL.shrub(.8, '#6a7a3a'), open(NQ(k, 80), 6, 100, (x, z) => ({x, z, s: rr(.5, 1.3)})), pm(k, .05, .8), {shadow: false});
  k.plant(PL.rock(1, '#8a8070'), open(NQ(k, 25), 8, 100, (x, z) => ({x, z, s: rr(.3, 1.2), sy: rr(.4, .8)})), smat(k));
  // impronte nella cenere: due file di ominini, un cavallo a tre dita e un uccello
  const pr = []; const dir = [Math.cos(-.5), Math.sin(-.5)];
  for (const [ox, oz] of [[-.25, .2], [.25, -.2]]) for (let i = 0; i < 26; i++) { const t = -7 + i * .5, side = i % 2 ? .07 : -.07; pr.push({x: AC[0] + dir[0] * t - dir[1] * side + ox, z: AC[1] + dir[1] * t + dir[0] * side + oz, y: .5 + .004, r: .5, s: rr(.9, 1.05)}); }
  k.inst(mk().add(G.ell(.11, .012, .05, 8, 3), '#5e5a52').geo(), pr, smat(k), {shadow: false, tint: false});
  const hp = []; for (let i = 0; i < 16; i++) hp.push({x: -6 + i * .8, z: 1.5 - i * .35, y: .504, s: 1});
  const fowl = []; for (let i = 0; i < 20; i++) fowl.push({x: 3 + (i % 2) * .08, z: 3 - i * .3, y: .504, s: 1, r: PI / 2});
  k.inst(mk().add(G.ell(.06, .012, .055, 8, 3), '#5e5a52').geo(), hp.concat(fowl.map(p => ({x: p.x, z: p.z, y: p.y, s: .45}))), smat(k), {shadow: false, tint: false});
  k.plumes([[VC[0], VC[2] - 6, VC[1], 3]], NQ(k, 60), {col: '#d8d8d4', size: [6, 24], rise: 40, life: 16, alpha: .35, spread: 2, wind: [5, 1]});
  k.herd(AN.proboscid({tusk: 'down', col: '#7a6a5a', bel: '#8a7a6a', s: 1.15}), amat(k, {leg: .28, sp: walkSp(.6, 2.6), wave: .1, k: .5}), group(k, 2, 40, -70, 25, .025, {da: .3, dr: 2}));
  k.herd(AN.giraffe(), amat(k, {leg: .35, sp: walkSp(.63, 2.2)}), group(k, 4, -45, -45, 18, .035, {da: .35, dr: 3}));
  k.herd(AN.deer({s: .5, col: '#b08a5a', horns: true, bel: '#e8dcc8'}), amat(k, {leg: .4, sp: walkSp(.75, .7)}), group(k, NQ(k, 12), 26, -38, 15, .05, {da: .15, dr: 3, sc: 2}), {shadow: false});
  k.herd(AN.horse({s: .85, col: '#a08060', dark: '#4a3a2a'}), amat(k, {leg: .4, sp: walkSp(1, .95)}), group(k, 6, -20, -78, 20, -.05, {da: .15, dr: 3}));
  k.herd(AN.hominin(), amat(k, {leg: .45, sp: walkSp(1.1, .64)}), group(k, 3, 0, 0, 58, .019, {da: .03, dr: .6, s0: .85, s1: 1.15}), {shadow: false});
  return {H, spawn: [0, 7, 0], inside: (x, z) => dist(x, z) < 75, exp: .92, envI: .7};
};

LAND.steppa = (k) => {
  const H = (x, z) => .3 + fbm(x * .025, z * .025, 3) * 1.5 + smooth(-95, -150, z) * (30 + fbm(x * .03, z * .03) * 12) + farHills(x, z, 10, 90, 150) * smooth(-60, 0, z);
  k.H = H;
  k.sky({top: '#9aaab8', hor: '#dde2e4', fog: [60, 380], sunDir: [.4, .35, -.6], sunSize: .6, glow: .8});
  k.lights({sky: '#dce4ea', ground: '#7a7a5a', hemi: 1.05, sun: '#fff0e0', sunI: 1, dir: [.4, .35, -.6]});
  k.clouds(20, 60, 120, {op: .85, tint: '#d8dce0'});
  k.terrain(H, (x, y, z, s, c) => { c.set('#9a9a6a'); c.lerp(C_('#7a7a50'), smooth(.4, .7, fbm(x * .1, z * .1, 3)) * .6); if (fbm(x * .07 + 3, z * .07) > .68) c.lerp(C_('#eef2f4'), .8); if (z < -85 && y > 4) { c.set('#e8f0f6'); c.lerp(C_('#9ac0d8'), smooth(.2, .5, s)); } else if (y > 4) c.lerp(C_('#8a8a80'), .5); });
  const open = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => H(x, z) < 4 ? f(x, z) : null);
  k.plant(PL.tuft(.5, '#8a9058', '#c8c088'), open(NQ(k, 2800), 2, 55, (x, z) => ({x, z, s: rr(.6, 1.3)})), pm(k, .12, 1.6), {shadow: false, v: .2});
  k.plant(PL.tuft(.6, '#8a9058', '#d0c890', 5), open(NQ(k, 1400), 50, 120, (x, z) => ({x, z, s: rr(1, 1.8)})), pm(k, .12, 1.6), {shadow: false, v: .2});
  k.plant(PL.tuft(.35, '#6a7048', '#9aa070', 9), open(NQ(k, 1000), 2, 45, (x, z) => ({x, z, s: rr(.6, 1.2)})), pm(k, .1, 1.6), {shadow: false});
  k.plant(PL.shrub(.45, '#5a6040'), open(NQ(k, 120), 4, 90, (x, z) => ({x, z, s: rr(.5, 1.3)})), pm(k, .04, .8), {shadow: false});
  k.plant(PL.rock(1.5, '#8a8a88'), open(NQ(k, 30), 8, 100, (x, z) => ({x, z, s: rr(.3, 1.2), sy: rr(.5, .9)})), smat(k), {rad: 1});
  k.herd(AN.proboscid({tusk: 'up', hair: true, col: '#5a3e2a', bel: '#4a3222'}), amat(k, {leg: .3, sp: walkSp(.7, 2.25), wave: .12, k: .5}), group(k, 5, -25, -60, 28, .025, {da: .22, dr: 3}));
  k.herd(AN.rhino(), amat(k, {leg: .35, sp: walkSp(.64, 1.15)}), group(k, 2, 40, -30, 16, .04, {da: .3, dr: 2}));
  k.herd(AN.horse({col: '#a88a5c'}), amat(k, {leg: .42, sp: walkSp(1.08, 1.1)}), group(k, NQ(k, 8), 36, 22, 18, .06, {da: .14, dr: 3, sc: 2}));
  k.herd(AN.bison(), amat(k, {leg: .35, sp: walkSp(.6, 1.15)}), group(k, 6, -50, 5, 15, -.04, {da: .2, dr: 3}));
  k.herd(AN.deer({mega: true, col: '#8a6a48'}), amat(k, {leg: .38, sp: walkSp(.8, 1.4)}), group(k, 3, 12, -85, 20, .04, {da: .3, dr: 3}));
  k.drift(NQ(k, 160), {col: '#ffffff', size: [.03, .07], alpha: .8, R: 22, h0: -2, h1: 10, vel: [1.2, -.6, .4], wob: .6});
  return {H, spawn: [0, 0, 0], inside: (x, z) => dist(x, z) < 75 && H(x, z) < 4, exp: .85, envI: .8};
};

LAND.americhe = (k) => {
  const SP = [12, -28, 7];
  const H = (x, z) => .4 + fbm(x * .03, z * .03, 3) * 1.2 - smooth(SP[2] + 2, SP[2] - 3, dist(x - SP[0], z - SP[1])) * 1.8 + farHills(x, z, 8);
  k.H = H;
  const wet = (x, z) => dist(x - SP[0], z - SP[1]) < SP[2] + .5;
  k.sky({top: '#3f80d0', hor: '#e4ecea', fog: [70, 400], sunDir: [.4, .85, -.3]});
  k.lights({sky: '#dce8f4', ground: '#7a7a4a', hemi: 1, sun: '#fff4e0', sunI: 1.35, dir: [.4, .85, -.3]});
  k.clouds(14, 70, 130, {op: .8});
  k.terrain(H, (x, y, z, s, c) => { c.set('#7a7a4a'); c.lerp(C_('#b8a880'), smooth(.5, .75, fbm(x * .08, z * .08, 3)) * .7); if (y < .2) c.lerp(C_('#5a5440'), .7); });
  k.water(.05, '#4a8a8a', .8, (SP[2] + 3) * 2, (SP[2] + 3) * 2, SP[0], SP[1], {round: true});
  const open = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => wet(x, z) ? null : f(x, z));
  k.plant(PL.tuft(.6, '#7a8a42', '#c0b870'), open(NQ(k, 2600), 2, 55, (x, z) => ({x, z, s: rr(.6, 1.3)})), pm(k, .12, 1.4), {shadow: false, v: .22});
  k.plant(PL.tuft(.7, '#7a8a42', '#c8c078', 5), open(NQ(k, 1200), 50, 110, (x, z) => ({x, z, s: rr(1, 1.8)})), pm(k, .12, 1.4), {shadow: false, v: .22});
  k.plant(PL.fanPalm(.15, '#5a7a48'), open(NQ(k, 140), 4, 80, (x, z) => ({x, z, s: rr(.6, 1.2)})), pm(k, .08, 1), {shadow: false});
  k.plant(PL.fanPalm(7), open(NQ(k, 30), 10, 100, (x, z) => ({x, z, s: rr(.7, 1.3)})), pm(k, .2, .8), {rad: .6});
  const OAK = [[-12, -26], [22, -44]];
  const oak = PL.broadleaf(10, '#3a5a30', '#4a3a2a', {w: .45, blobs: 8});
  k.plant(oak, open(NQ(k, 25), 14, 100, (x, z) => ({x, z, s: rr(.8, 1.2)})).concat(OAK.map(([x, z]) => ({x: x + 2.2, z, y: H(x + 2.2, z), r: 0, s: 1.1}))), pm(k, .25, .7), {rad: 1});
  k.plant(PL.conifer(18, '#3a5a34'), open(NQ(k, 15), 25, 110, (x, z) => ({x, z, s: rr(.7, 1.2)})), pm(k, .2, .7), {rad: 1});
  // modelli 3D veri del Natural History Museum of Los Angeles (fossili di La Brea), cartella modelli/; se mancano restano quelli fatti dal codice
  const NH = 'NHMLA – Natural History Museum of Los Angeles (CC BY-NC-SA 4.0)';
  const sloths = group(k, 2, -12, -22, 4, .12, {da: 1.6, dr: .5});
  k.model('modelli/paramylodon.glb', {len: 3, v0: .5, clip: /walk/i, credit: NH}, sloths, () => k.herd(AN.sloth(), amat(k, {wave: .1, k: 0, sp: .7}), sloths));
  const wolves = group(k, 3, -24, -8, 5, .22, {da: .3, dr: 1});
  k.model('modelli/lupo-terribile.glb', {len: 1.8, v0: 1.2, clip: /walk/i}, wolves, () => k.herd(AN.canid({col: '#7a6a58', bel: '#c8b8a0'}), amat(k, {leg: .4, sp: walkSp(1.1, .7)}), wolves.map(w => Object.assign({}, w, {s: 1.3}))));
  const cats = group(k, 2, 34, -16, 12, .07, {da: .2, dr: 1});
  k.model('modelli/smilodonte.glb', {len: 2, v0: .9, clip: /walk/i}, cats, () => k.herd(AN.smilodon(), amat(k, {leg: .4, sp: walkSp(.84, .74)}), cats));
  const mams = group(k, 4, -30, -72, 30, .04, {da: .25, dr: 3});
  k.model('modelli/mammut.glb', {len: 7, v0: 1.2, clip: /walk/i}, mams, () => k.herd(AN.proboscid({tusk: 'up', col: '#6e5f52', bel: '#7a6a5a', s: 1.25, tl: 1.2, tw: 1.15, ear: .45}), amat(k, {leg: .28, sp: walkSp(.66, 2.8), wave: .1, k: .4}), mams));
  const masts = group(k, 2, SP[0], SP[1], SP[2] + 4, -.1, {da: .4, dr: 1});
  k.model('modelli/mastodonte.glb', {len: 5.2, v0: 1, clip: /walk/i}, masts, () => k.herd(AN.proboscid({tusk: 'up', col: '#5a4030', bel: '#6a5040', s: .95, tl: .9, tw: .8, ear: .45}), amat(k, {leg: .28, sp: walkSp(.66, 2.4), wave: .1, k: .4}), masts));
  const bisons = group(k, 4, 42, -62, 15, -.08, {da: .25, dr: 2});
  k.model('modelli/bisonte-antico.glb', {len: 4.6, v0: 1.3, clip: /walk/i}, bisons, () => k.herd(AN.bison({col: '#5a402c'}), amat(k, {leg: .35, sp: walkSp(.6, 1.15)}), bisons));
  const horses = group(k, 5, -52, -22, 16, .09, {da: .15, dr: 2});
  k.model('modelli/cavallo-occ.glb', {len: 2.8, v0: 1.5, clip: /walk/i}, horses, () => k.herd(AN.horse({col: '#9a7a52'}), amat(k, {leg: .42, sp: walkSp(1, 1.1)}), horses));
  const terats = [{path: k.circ(0, -30, 20, .12, 0, 24, 2), roll: -.3}, {path: k.circ(10, -40, 26, .09, 2, 30, 2), roll: -.25}];
  k.model('modelli/teratorno.glb', {len: 3.7}, terats, () => k.herd(AN.bird(3.5, '#2a2622'), amat(k, {flap: .15, sp: 1.2}, true), terats, {shadow: false}));
  return {H, spawn: [0, 3, 0], inside: (x, z) => dist(x, z) < 75 && !wet(x, z), signOk: (x, z) => !wet(x, z), exp: .9, envI: .7};
};

/* ---------- apertura dell'ambiente ---------- */
function fmtMa(ma) {
  const nf = v => v.toLocaleString('it-IT', {maximumFractionDigits: 1});
  if (ma >= 1000) return 'circa ' + nf(ma / 1000) + ' miliardi di anni fa';
  if (ma >= 1) return 'circa ' + nf(ma) + ' milioni di anni fa';
  return 'circa ' + (Math.round(ma * 1e4) * 100).toLocaleString('it-IT') + ' anni fa';
}
function open(id, cb) {
  cb = cb || {};
  if (!window.THREE) { console.error('PaleoEnv: three.js non è caricato'); return false; }
  T3 = window.THREE;
  const E = ENVS.find(e => e.id === id); if (!E) { console.error('PaleoEnv: ambiente sconosciuto', id); return false; }
  if (CUR) CUR.close(true);
  injectCSS();
  const root = document.createElement('div'); root.className = 'pe-root'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'pe-title');
  root.innerHTML = `<canvas class="pe-cv" tabindex="-1" aria-label="Ambiente in 3D: ${esc(E.name)}"></canvas><div class="pe-vig" aria-hidden="true"></div>
    <div class="pe-top"><div class="pe-head"><div class="pe-eyebrow"><span class="pe-dot" style="background:${E.color}"></span>${E.now ? 'Ecosistema di oggi' : 'Ambiente del passato'}</div><h2 id="pe-title">${esc(E.name)}</h2><div class="pe-sub">${esc(E.era)} · ${esc(E.when || fmtMa(E.ma))}</div></div>
    <div class="pe-tour" role="group" aria-label="Cartelli Lo sapevi?"><button class="pe-prev" aria-label="Cartello precedente">‹ Precedente</button><span class="pe-step" aria-live="polite"></span><button class="pe-next pe-primary" aria-label="Cartello successivo">Successiva ›</button></div>
    <div class="pe-actions"><button class="pe-exit">Torna al globo</button></div></div>
    <div class="pe-card" hidden aria-live="polite"></div>
    <div class="pe-bottom"><p class="pe-hint"><span class="pe-fine">Trascina per guardarti intorno · W A S D o frecce per muoverti · clicca il terreno per andare lì o un cartello per leggerlo · N e P per i cartelli · Esc per uscire</span><span class="pe-touch">Trascina per guardarti intorno · tocca il terreno per spostarti o un cartello per leggerlo</span></p></div>
    <div class="pe-loading">Preparo l'ambiente…</div>`;
  document.body.appendChild(root);
  const q = s => root.querySelector(s), loading = q('.pe-loading'), card = q('.pe-card');
  const prevOv = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
  const prevFocus = document.activeElement;
  const S = {closed: false, cleanup: []};
  function close(silent) {
    if (S.closed) return; S.closed = true;
    for (const f of S.cleanup) { try { f(); } catch (e) { console.error(e); } }
    root.remove(); document.documentElement.style.overflow = prevOv; if (CUR && CUR.S === S) CUR = null;
    if (prevFocus && prevFocus.focus && document.contains(prevFocus)) { try { prevFocus.focus(); } catch (e) {} }
    if (!silent && cb.onExit) cb.onExit();
  }
  CUR = {close, S, id};
  q('.pe-exit').onclick = () => close();
  const kd0 = ev => { if (ev.key === 'Escape') { ev.preventDefault(); if (!card.hidden) card.hidden = true; else close(); } };
  window.addEventListener('keydown', kd0); S.cleanup.push(() => window.removeEventListener('keydown', kd0));
  q('.pe-exit').focus();
  const fonts = document.fonts && document.fonts.load ? Promise.all([document.fonts.load(`700 40px ${SERIF}`), document.fonts.load(`400 30px ${SANS}`), document.fonts.load(`700 30px ${SANS}`)]).catch(() => {}) : Promise.resolve();
  Promise.race([fonts, new Promise(r => setTimeout(r, 1500))]).then(() => new Promise(r => setTimeout(r, 40))).then(() => {
    if (S.closed) return;
    try { build(E, root, S, close, cb); loading.hidden = true; q('.pe-next').focus(); }
    catch (e) { console.error(e); loading.textContent = 'Questo dispositivo non riesce a mostrare l’ambiente in 3D (serve WebGL).'; }
  });
  return true;
}

function build(E, root, S, close, cb) {
  const q = s => root.querySelector(s), cv = q('.pe-cv'), card = q('.pe-card'), step = q('.pe-step');
  const touch = matchMedia('(pointer: coarse)').matches;
  const renderer = new T3.WebGLRenderer({canvas: cv, antialias: !touch || (window.devicePixelRatio || 1) < 2, powerPreference: 'high-performance'});
  S.cleanup.push(() => { renderer.setAnimationLoop(null); });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputEncoding = T3.sRGBEncoding; renderer.toneMapping = T3.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = !touch && window.innerWidth > 700; renderer.shadowMap.type = T3.PCFSoftShadowMap;
  const scene = new T3.Scene();
  const fovFor = () => window.innerWidth < window.innerHeight ? 78 : 66;
  const camera = new T3.PerspectiveCamera(fovFor(), window.innerWidth / window.innerHeight, .1, 1100);
  camera.rotation.order = 'YXZ';
  const rig = new T3.Group(); rig.add(camera); scene.add(rig);
  const k = makeKit(scene, renderer, touch); k.cam = camera; k.rig = rig; S.cleanup.push(() => { k.dead = true; });
  const L = LAND[E.id](k, E), H = L.H; k.H = H;
  const eye = L.eye || 1.6, NH = L.navH || H, sc = L.signScale || 1;
  camera.position.set(0, eye, 0); camera.near = Math.min(.1, eye / 8); camera.updateProjectionMatrix();
  renderer.toneMappingExposure = L.exp || 1;
  // cartelli disposti a ventaglio davanti al punto di partenza
  const [sx, sz, syaw] = L.spawn, n = E.facts.length, stops = [];
  E.facts.forEach((f, i) => {
    const a = syaw + (n > 1 ? (-1 + 2 * i / (n - 1)) * 1.05 : 0), d0 = (9 + (i % 2) * 3.5) * sc; let x, z;
    for (const f of [1, .85, 1.2, .7, 1.4, .55, 1.6, 1]) { x = sx - Math.sin(a) * d0 * f; z = sz - Math.cos(a) * d0 * f; if (!L.signOk || L.signOk(x, z)) break; }
    const face = Math.atan2(sx - x, sz - z), gy = L.under ? H(x, z) + (L.signLift || 1.2) * sc : H(x, z);
    k.sign(E, i, n, x, gy, z, face, sc, !!L.under);
    const st = new T3.Vector3(x + Math.sin(face) * 3.4 * sc, 0, z + Math.cos(face) * 3.4 * sc);
    stops.push({i, stand: st, look: new T3.Vector3(x, gy + 2.05 * sc, z), fact: f});
  });
  const keep = [[sx, sz, 4.5 * sc]]; stops.forEach(s => { keep.push([s.stand.x, s.stand.z, 2.2 * sc], [s.look.x, s.look.z, 2 * sc]); }); k.flush(keep);
  k.envLight(L.envI != null ? L.envI : .8);
  if (k.envInt != null) scene.traverse(o => { const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) if (m.isMeshStandardMaterial && m.envMapIntensity === 1) m.envMapIntensity = k.envInt; });

  /* navigazione */
  let yaw = syaw, pitch = L.pitch != null ? L.pitch : -.05, walk = null, cur = -1; const keys = {};
  rig.position.set(sx, NH(sx, sz), sz);
  const ok = (x, z) => L.inside(x, z);  const yawTo = (a, b) => Math.atan2(-(b.x - a.x), -(b.z - a.z));
  const spd = (L.speed || 1) * 4;
  function walkTo(to, look) {
    if (!ok(to.x, to.z)) return;
    const from = rig.position.clone(), d = Math.hypot(to.x - from.x, to.z - from.z);
    const fy = look ? yawTo(to, look) : yawTo(from, to);
    const fp = look ? Math.atan2(look.y - (NH(to.x, to.z) + eye), Math.hypot(look.x - to.x, look.z - to.z)) : pitch;
    walk = {from, to, t: 0, dur: Math.max(.6, Math.min(5, d / spd * 1.3)), fy, fp};
  }
  const nf = new Intl.NumberFormat('it-IT');
  function showIntro() {
    card.innerHTML = `<div class="pe-eyebrow"><span class="pe-dot" style="background:${E.color}"></span>L'ambiente</div><h3>${esc(E.place)}</h3><p>${esc(E.intro)}</p><p class="pe-meta">${E.now ? esc(E.era) : `${esc(E.era)} · da ${esc(fmtMa(E.from).replace('circa ', ''))} a ${esc(fmtMa(E.to).replace('circa ', ''))}`}${L.note ? ' · ' + esc(L.note) : ''}</p>${k.credits.length ? `<details class="pe-meta pe-cred"><summary>Modelli 3D da Sketchfab: autori e licenze</summary>${k.credits.map(esc).join(' · ')}</details>` : ''}<div class="pe-cardbtns"><button class="pe-go">Vedi sul globo</button><button class="pe-x">Chiudi</button></div>`;
    card.hidden = false; bindCard();
  }
  function showCard(s) {
    if (!s) { card.hidden = true; return; }
    card.innerHTML = `<div class="pe-eyebrow"><span class="pe-dot" style="background:${E.color}"></span>Lo sapevi? · ${s.i + 1} di ${n}</div><h3>${esc(s.fact[0])}</h3><p>${esc(s.fact[1])}</p><div class="pe-cardbtns">${s.fact[2] && cb.onSpecies ? '<button class="pe-sp">Scheda della specie</button>' : ''}<button class="pe-go">Vedi sul globo</button><button class="pe-x">Chiudi</button></div>`;
    card.hidden = false; bindCard();
    const spb = card.querySelector('.pe-sp'); if (spb) spb.onclick = () => { const id = s.fact[2]; close(); cb.onSpecies(id); };
  }
  function bindCard() {
    card.querySelector('.pe-go').onclick = () => { const lat = E.lat, lon = E.lon, ma = E.ma; close(); if (cb.onShowOnMap) cb.onShowOnMap(lat, lon, ma); };
    card.querySelector('.pe-x').onclick = () => { card.hidden = true; cv.focus({preventScroll: true}); };
  }
  function goStop(i) { cur = (i + stops.length) % stops.length; const s = stops[cur]; walkTo(s.stand.clone(), s.look); showCard(s); step.textContent = `Cartello ${cur + 1} di ${stops.length}`; }
  step.textContent = `${stops.length} cartelli · premi «Successiva»`;
  q('.pe-next').onclick = () => goStop(cur + 1); q('.pe-prev').onclick = () => goStop(cur - 1);
  showIntro();
  const ray = new T3.Raycaster(), v2 = new T3.Vector2();
  const pickAt = (cx, cy) => { const r = cv.getBoundingClientRect(); v2.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, camera); return ray.intersectObjects(k.targets.concat(k.grounds))[0]; };
  const activate = hit => { if (!hit) return; const u = hit.object.userData; if (u.fact != null) goStop(u.fact); else if (u.ground && hit.distance < 140) { walkTo(new T3.Vector3(hit.point.x, 0, hit.point.z)); card.hidden = true; } };
  let drag = null;
  const onDown = ev => { drag = {x: ev.clientX, y: ev.clientY, moved: false, id: ev.pointerId}; try { cv.setPointerCapture(ev.pointerId); } catch (e) {} };
  const onMove = ev => { if (!drag || ev.pointerId !== drag.id) return; const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y; if (!drag.moved && Math.hypot(dx, dy) > 6) drag.moved = true; if (drag.moved) { const f = touch ? .0055 : .0042; yaw += dx * f; pitch = Math.max(-1.25, Math.min(1.3, pitch + dy * f)); drag.x = ev.clientX; drag.y = ev.clientY; walk = null; } };
  const onUp = ev => { if (drag && !drag.moved) activate(pickAt(ev.clientX, ev.clientY)); drag = null; };
  const onCancel = () => { drag = null; };
  cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onCancel);
  const kd = ev => {
    if (ev.target && ev.target.tagName === 'BUTTON' && (ev.key === 'Enter' || ev.key === ' ')) return;
    if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
    if (ev.key === 'PageDown' || ev.key === 'n' || ev.key === 'N') { ev.preventDefault(); goStop(cur + 1); return; }
    if (ev.key === 'PageUp' || ev.key === 'p' || ev.key === 'P') { ev.preventDefault(); goStop(cur - 1); return; }
    const kk = ev.key.toLowerCase(); if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'q', 'e'].includes(kk)) { keys[kk] = true; walk = null; ev.preventDefault(); }
  };
  const ku = ev => { keys[ev.key.toLowerCase()] = false; };
  const blur = () => { for (const kk in keys) keys[kk] = false; };
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); window.addEventListener('blur', blur);
  const onResize = () => { renderer.setSize(window.innerWidth, window.innerHeight, false); camera.aspect = window.innerWidth / window.innerHeight; camera.fov = fovFor(); camera.updateProjectionMatrix(); };
  window.addEventListener('resize', onResize);
  S.cleanup.push(() => { cv.removeEventListener('pointerdown', onDown); cv.removeEventListener('pointermove', onMove); cv.removeEventListener('pointerup', onUp); cv.removeEventListener('pointercancel', onCancel);
    window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('blur', blur); window.removeEventListener('resize', onResize); });
  S.cleanup.push(() => { // libera la memoria della scheda grafica
    const seen = new Set(); scene.traverse(o => { if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
      const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []; for (const m of ms) { if (seen.has(m)) continue; seen.add(m); for (const key in m) { const v = m[key]; if (v && v.isTexture && !seen.has(v)) { seen.add(v); v.dispose(); } } if (m.uniforms) for (const u in m.uniforms) { const v = m.uniforms[u].value; if (v && v.isTexture && !seen.has(v)) { seen.add(v); v.dispose(); } } m.dispose(); } });
    if (k.envRT) k.envRT.dispose(); [k.dot, k.cloudTex, k.detailTex, k.groundTex, k.waterNormal].forEach(t => t && t.dispose());
    renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {} });

  const camW = new T3.Vector3();
  let last = performance.now(); const perf = {n: 0, sum: 0, step: 0};
  renderer.setAnimationLoop(() => {
    const now = performance.now(), rdt = Math.min(.5, (now - last) / 1000), dt = Math.min(.05, rdt); last = now; const t = now / 1000;
    // se il computer fatica, alleggerisce la grafica: prima la risoluzione extra degli schermi ad alta densità, poi le ombre.
    // Non scende mai sotto un pixel per pixel dello schermo, altrimenti l'immagine diventa sgranata (LIM e PC lenti).
    if (perf.step < 2) { perf.n++; if (perf.n > 20) perf.sum += rdt; if (perf.n === 80) { if (perf.sum / 60 > .042) { perf.step++;
          if (perf.step === 1 && renderer.getPixelRatio() > 1.25) renderer.setPixelRatio(Math.max(1, Math.min(1.25, window.devicePixelRatio || 1)));
          else if (renderer.shadowMap.enabled) { perf.step = 2; renderer.shadowMap.enabled = false; scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(mm => mm.needsUpdate = true); }); }
          onResize(); } else perf.step = 9; perf.n = 0; perf.sum = 0; } }
    const f = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0), stf = (keys.d ? 1 : 0) - (keys.a ? 1 : 0), turn = (keys.arrowleft || keys.q ? 1 : 0) - (keys.arrowright || keys.e ? 1 : 0);
    yaw += turn * dt * 1.8;
    if (f || stf) { const sp = spd * dt; const nx = rig.position.x + (-Math.sin(yaw) * f + Math.cos(yaw) * stf) * sp, nz = rig.position.z + (-Math.cos(yaw) * f - Math.sin(yaw) * stf) * sp; if (ok(nx, nz)) { rig.position.x = nx; rig.position.z = nz; } else if (ok(nx, rig.position.z)) rig.position.x = nx; else if (ok(rig.position.x, nz)) rig.position.z = nz; }
    if (walk) { walk.t += rdt / walk.dur; const kk = walk.t >= 1 ? 1 : ease(walk.t); rig.position.x = walk.from.x + (walk.to.x - walk.from.x) * kk; rig.position.z = walk.from.z + (walk.to.z - walk.from.z) * kk;
      let dy = walk.fy - yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); yaw += dy * Math.min(1, rdt * 5); pitch += (walk.fp - pitch) * Math.min(1, rdt * 4);
      if (walk.t >= 1.3) { yaw = walk.fy; pitch = walk.fp; walk = null; } }
    const gy = NH(rig.position.x, rig.position.z); rig.position.y += (gy - rig.position.y) * Math.min(1, rdt * 8);
    if (L.under) rig.position.y += Math.sin(t * .8) * .002;
    camera.rotation.set(pitch, yaw, 0);
    camera.getWorldPosition(camW);
    if (k.skyMesh) k.skyMesh.position.copy(camW);
    for (const [o] of k.follow) { if (o.userData.ox === undefined) { o.userData.ox = o.position.x; o.userData.oz = o.position.z; } o.position.x = camW.x + o.userData.ox; o.position.z = camW.z + o.userData.oz; }
    k.time.value = t % 3600;
    if (k.sun) { k.sun.position.copy(rig.position).addScaledVector(k.sunV, 150); k.sun.target.position.copy(rig.position); }
    if (k.pointMats) { const sc2 = renderer.domElement.height / (2 * Math.tan(camera.fov * PI / 360)); for (const u of k.pointMats) u.value = sc2; }
    const tt = t % 3600; for (const u of k.up) u(tt, dt, camW, rig, camera);
    renderer.render(scene, camera);
  });
}

/* ---------- interfaccia pubblica ---------- */
function forTime(ma) {
  ma = +ma; if (!isFinite(ma)) return [];
  const lg = v => Math.log(Math.max(v, .001));
  const hit = ENVS.filter(e => e.from >= ma && ma >= e.to);
  if (hit.length) return hit.map(e => ({e, d: Math.abs(lg(ma) - (lg(e.from) + lg(e.to)) / 2)})).sort((a, b) => a.d - b.d).map(o => o.e).map(pub);
  let best = null, bd = 1e9; for (const e of ENVS) { const d = ma > e.from ? lg(ma) - lg(e.from) : lg(e.to) - lg(ma); if (d < bd) { bd = d; best = e; } }
  return best ? [pub(best)] : [];
}
const pub = e => ({id: e.id, name: e.name, place: e.place, from: e.from, to: e.to, intro: e.intro, color: e.color, lat: e.lat, lon: e.lon, ma: e.ma, era: e.era, when: e.when, now: !!e.now});
// ecosistemi di oggi (src/ecosistemi.js): aggiungono ambienti e modelli con gli stessi attrezzi
if (window.PaleoEcosistemi) try {
  window.PaleoEcosistemi({ENVS, LAND, PL, AN, G, mk, cat, aim, along, S, banded, mottled, shag, tailW, eyes, leg, legs4, frond, serr, T3: () => T3,
    rng, rr, fbm, ridge, vnoise, smooth, lerp, clamp01, dist, PI, TAU, C_, NQ, pm, amat, smat, sea, ringList, group, walkSp, farHills, mkc});
} catch (e) { console.error('Ecosistemi non caricati', e); }
window.PaleoEnv = {list: ENVS.map(pub), forTime, open};
})();
