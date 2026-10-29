(() => {
"use strict";
const $ = id => document.getElementById(id);
const D = window.DATA;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clamp01 = v => clamp(v, 0, 1);
const lerp = (a, b, u) => a + (b - a) * u;
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const RAD = Math.PI / 180;
const NOW_YEAR = 2026;

// contenuti (definiti negli altri script; se mancano il globo funziona lo stesso)
const ERAS_ = typeof ERAS !== "undefined" ? ERAS : [];
const EVENTS_ = (typeof EVENTS !== "undefined" ? EVENTS : []).slice().sort((a, b) => b.t - a.t);
const TAXA_ = typeof TAXA !== "undefined" ? TAXA : [];
const GROUPS_ = typeof GROUPS !== "undefined" ? GROUPS : {};
const SCENARI_ = typeof SCENARI !== "undefined" ? SCENARI : [];
// il futuro possibile (src/futuro.js): tempo negativo = milioni di anni da oggi in avanti
const FUT = typeof FUTURO !== "undefined" ? FUTURO : null;
const FUT_END = -7600;
if (FUT) {
  (FUT.events || []).forEach(e => EVENTS_.push(e));
  EVENTS_.sort((a, b) => b.t - a.t);
  (FUT.taxa || []).forEach(x => TAXA_.push(Object.assign({}, x, {fut: true, to: x.to == null ? FUT_END : x.to})));
  (FUT.scenari || []).forEach(s => SCENARI_.push(s));
}
// suddivisione del futuro: non ufficiale, solo per orientarsi
const FUT_ERAS = [
  {level: "eone", name: "Futuro possibile", from: 0, to: FUT_END, color: "#b9b3e6", fut: true, text: "Il futuro non ha una scala ufficiale: queste fasi servono solo a orientarsi. Più ci si allontana da oggi, più le previsioni sono incerte, tranne quelle sull'evoluzione del Sole, che seguono leggi fisiche ben note."},
  {level: "periodo", name: "Glaciazioni e Antropocene", from: 0, to: -2, color: "#cfe3f2", fut: true, text: "Il clima dei prossimi millenni dipende dalla CO₂ che emettiamo oggi; poi tornano i cicli delle glaciazioni guidati dall'orbita terrestre."},
  {level: "periodo", name: "Continenti in cammino", from: -2, to: -200, color: "#d9e8c4", fut: true, text: "I continenti proseguono i loro moti: l'Africa chiude il Mediterraneo, l'Australia raggiunge l'Asia, si apre un nuovo oceano in Africa orientale."},
  {level: "periodo", name: "Nuovo supercontinente", from: -200, to: -500, color: "#e8dcb8", fut: true, text: "I continenti potrebbero riunirsi in un nuovo supercontinente, con interni caldissimi e aridi."},
  {level: "periodo", name: "Il Sole più caldo", from: -500, to: -1300, color: "#f0c89a", fut: true, text: "Il Sole diventa sempre più luminoso: la CO₂ dell'aria diminuisce, le piante scompaiono, poi gli animali; restano i microbi."},
  {level: "periodo", name: "Terra senza oceani", from: -1300, to: -5000, color: "#e8a77c", fut: true, text: "Gli oceani evaporano e l'acqua si perde nello spazio: la Terra diventa un deserto rovente, forse senza più vita."},
  {level: "periodo", name: "Il Sole gigante rossa", from: -5000, to: FUT_END, color: "#e0786a", fut: true, text: "Il Sole esaurisce l'idrogeno nel nucleo, si gonfia e diventa una gigante rossa: inghiotte Mercurio, Venere e probabilmente la Terra."}
];
FUT_ERAS.forEach(u => ERAS_.push(u));

/* ---------- formati ---------- */
const NF = {};
const nf = (v, d) => (NF[d] || (NF[d] = new Intl.NumberFormat("it-IT", {maximumFractionDigits: d, minimumFractionDigits: d}))).format(v);
const nfi = v => nf(Math.round(v), 0);
function fmtAge(t, mode) {
  // mode: "long" (default) | "short"
  const sh = mode === "short";
  if (Math.abs(t) <= 2e-7) return sh ? "oggi" : "Oggi";
  if (t < 0) return fmtFut(-t, sh);
  if (t >= 1000) { const g = t / 1000; return nf(g, 2) + (sh ? " Ga" : " miliardi di anni fa"); }
  if (t >= 1) return nf(t, t >= 100 ? 0 : t >= 10 ? 1 : 2) + (sh ? " Ma" : " milioni di anni fa");
  const y = t * 1e6;
  if (y < 4000) {
    const yr = Math.round(NOW_YEAR - y);
    return yr > 0 ? (sh ? yr + " d.C." : "Anno " + yr + " d.C.") : (sh ? (1 - yr) + " a.C." : "Anno " + (1 - yr) + " a.C.");
  }
  if (y >= 100000) return nfi(Math.round(y / 1000) * 1000) + (sh ? "" : " anni fa");
  if (y >= 10000) return nfi(Math.round(y / 100) * 100) + (sh ? "" : " anni fa");
  return nfi(Math.round(y / 10) * 10) + (sh ? "" : " anni fa");
}
// futuro: f = milioni di anni da oggi
const trimZ = s => s.includes(",") ? s.replace(/0+$/, "").replace(/,$/, "") : s;
function fmtFut(f, sh) {
  if (f >= 1000) { const g = trimZ(nf(f / 1000, 2)); return sh ? "+" + g + " Ga" : "Fra " + g + " miliardi di anni"; }
  if (f >= 1) { const m = trimZ(nf(f, f >= 100 ? 0 : f >= 10 ? 1 : 2)); return sh ? "+" + m + " Ma" : "Fra " + m + (f < 2 ? " milione di anni" : " milioni di anni"); }
  const y = f * 1e6;
  if (y < 8000) { const yr = Math.round(NOW_YEAR + y); return sh ? String(yr) : "Anno " + yr; }
  const r = nfi(y >= 100000 ? Math.round(y / 1000) * 1000 : Math.round(y / 100) * 100);
  return sh ? "+" + r + " anni" : "Fra " + r + " anni";
}
function fmtUnit(t, unit) {
  if (Math.abs(t) <= 2e-7) return "oggi";
  const s = t < 0 ? "+" : "", a = Math.abs(t);
  if (unit === "Ga") return s + nf(a / 1000, 2) + " Ga";
  if (unit === "Ma") return s + nf(a, a >= 100 ? 0 : a >= 10 ? 1 : 2) + " Ma";
  if (unit === "ka") return s + nfi(a * 1000) + " ka";
  return fmtAge(t, "short");
}
function fmtRange(a, b) {
  if (a == null) return "";
  if (b == null || Math.abs(a - b) < 1e-9) return fmtAge(a);
  if (Math.abs(b) <= 2e-7) return "da " + fmtAge(a, "short").replace(/ (Ga|Ma)$/, m => m) + " a oggi";
  return "da " + fmtAge(a, "short") + " a " + fmtAge(b, "short");
}

/* ---------- linea del tempo: scala a tratti ---------- */
// il passato occupa l'82% della linea, il futuro (fino alla gigante rossa) il resto
const MAIN_DOM = [4567, 4000, 2500, 1000, 541, 252, 66, 23, 2.58, 0.3, 0.0117, 0, -0.1, -10, -300, -1500, FUT_END];
const MAIN_RNG = [0, .037, .098, .164, .23, .41, .582, .656, .738, .783, .812, .82, .85, .885, .93, .965, 1];
const P_NOW = .82;
let TL = d3.scaleLinear().domain(MAIN_DOM).range(MAIN_RNG).clamp(true);
const t2p = t => TL(t), p2t = p => TL.invert(clamp01(p));

/* ---------- stato ---------- */
const state = {
  t: 66, mode: "globe", playing: false, sel: null, sc: null, step: -1,
  layers: {fossils: true, taxa: true, events: true, names: true, climate: true, today: false},
  groups: {}, hover: null
};
Object.keys(state.layers).forEach(l => {
  const el = $("l-" + l); if (!el) return;
  el.checked = state.layers[l];
  el.addEventListener("change", () => { state.layers[l] = el.checked; draw(); });
});

/* ---------- tettonica: due modelli di placche ----------
   0–750 Ma: PALEOMAP (Scotese), lo stesso dei PaleoDEM del globo fisico.
   750–1000 Ma: Merdith et al. 2021. Oltre 1000 Ma: posizioni schematiche (quelle di 1000 Ma). */
function qGet(a, i) {
  const w = a[4 * i], x = a[4 * i + 1], y = a[4 * i + 2], z = a[4 * i + 3];
  if (!w && !x && !y && !z) return null;
  return [w / 1e4, x / 1e4, y / 1e4, z / 1e4];
}
function vecOf(lon, lat) { const lo = lon * RAD, la = lat * RAD, c = Math.cos(la); return [c * Math.cos(lo), c * Math.sin(lo), Math.sin(la)]; }
function rotV(q, x, y, z) {
  const w = q[0], qx = q[1], qy = q[2], qz = q[3];
  const tx = 2 * (qy * z - qz * y), ty = 2 * (qz * x - qx * z), tz = 2 * (qx * y - qy * x);
  return [x + w * tx + (qy * tz - qz * ty), y + w * ty + (qz * tx - qx * tz), z + w * tz + (qx * ty - qy * tx)];
}
function toLL(v) { return [Math.atan2(v[1], v[0]) / RAD, Math.asin(clamp(v[2], -1, 1)) / RAD]; }
function mkCoast(list, useB) {
  return list.map(r => {
    const c = r.c.slice();
    if (c[0] !== c[c.length - 2] || c[1] !== c[c.length - 1]) c.push(c[0], c[1]);
    let ring = []; for (let i = 0; i < c.length; i += 2) ring.push([c[i], c[i + 1]]);
    if (d3.geoArea({type: "Polygon", coordinates: [ring]}) > 2 * Math.PI) ring.reverse();
    const n = ring.length, V = new Float64Array(n * 3);
    let x0 = 999, x1 = -999, y0 = 999, y1 = -999;
    ring.forEach(([lo, la], i) => { const v = vecOf(lo, la); V[3 * i] = v[0]; V[3 * i + 1] = v[1]; V[3 * i + 2] = v[2]; x0 = Math.min(x0, lo); x1 = Math.max(x1, lo); y0 = Math.min(y0, la); y1 = Math.max(y1, la); });
    return {p: r.p, b: useB ? r.b : 1e9, ring, V, n, bb: [x0, y0, x1, y1], feat: {type: "Feature", geometry: {type: "Polygon", coordinates: [ring]}}};
  });
}
function mkModel(key, rot, coste, useB) {
  return {key, rot, max: rot.max, step: rot.step, NT: rot.max / rot.step + 1, RQ: rot.q, QC: new Map(), qcT: NaN, pidc: new Map(), coast: mkCoast(coste, useB)};
}
const MP = mkModel("pm", D.rot_pm, D.coste_pm, false), MM = mkModel("md", D.rot, D.coste, true);
const TECT_MAX = MM.max;
const modelAt = t => t <= MP.max ? MP : MM;
function quatAt(M, pid, t) {
  if (t !== M.qcT) { M.QC.clear(); M.qcT = t; }
  if (M.QC.has(pid)) return M.QC.get(pid);
  const a = M.RQ[pid]; let q = null;
  if (a) {
    const tt = clamp(t, 0, M.max), f = tt / M.step, i = Math.min(M.NT - 1, Math.floor(f)), u = f - i;
    const q0 = qGet(a, i), q1 = i + 1 < M.NT ? qGet(a, i + 1) : q0;
    if (q0 && q1 && u > 0) {
      let d = q0[0] * q1[0] + q0[1] * q1[1] + q0[2] * q1[2] + q0[3] * q1[3];
      const s = d < 0 ? -1 : 1; d = Math.abs(d);
      let k0 = 1 - u, k1 = u * s;
      if (d < .9995) { const th = Math.acos(d), st = Math.sin(th); k0 = Math.sin((1 - u) * th) / st; k1 = s * Math.sin(u * th) / st; }
      q = [k0 * q0[0] + k1 * q1[0], k0 * q0[1] + k1 * q1[1], k0 * q0[2] + k1 * q1[2], k0 * q0[3] + k1 * q1[3]];
      const n = Math.hypot(q[0], q[1], q[2], q[3]); q = q.map(v => v / n);
    } else q = q0 && (u < .5 || !q1) ? q0 : (q1 && u >= .5 ? q1 : q0);
  }
  M.QC.set(pid, q); return q;
}
/* futuro: ogni placca prosegue il moto medio degli ultimi 10 milioni di anni (PALEOMAP), come nelle mappe
   «future» di Scotese; oltre FUT_TECT le posizioni restano quelle di FUT_TECT (schematiche). */
const FUT_TECT = 50, FQC = new Map();
function futQ(pid, f) {
  f = Math.min(f, FUT_TECT);
  const key = pid + ":" + Math.round(f * 20);
  if (FQC.has(key)) return FQC.get(key);
  const a = MP.RQ[pid]; let q = null;
  const q10 = a ? qGet(a, Math.round(10 / MP.step)) : null;
  if (q10) {
    let [w, x, y, z] = q10; if (w < 0) { w = -w; x = -x; y = -y; z = -z; }
    const h = Math.acos(clamp(w, -1, 1)), sh = Math.sin(h);
    if (sh < 1e-9) q = [1, 0, 0, 0];
    else { const h2 = -h * f / 10, k = Math.sin(h2) / sh; q = [Math.cos(h2), x * k, y * k, z * k]; }
  }
  if (FQC.size > 6000) FQC.clear();
  FQC.set(key, q); return q;
}
/* oltre FUT_TECT i continenti si radunano nel prossimo supercontinente del modello scelto (FUTURO.modelli):
   ogni blocco (Nord America, Africa…) va dalla posizione di FUT_TECT a quella del modello, raggiunta all'età M.t.
   Le posizioni dei modelli sono schematiche (ricavate dalle mappe pubblicate). */
const MODELLI = FUT && FUT.modelli ? FUT.modelli.filter(m => m && m.blocks) : [];
const MOD_COL = {ultima: "#c99a14", novopangea: "#2a9d8f", aurica: "#e76f51", amasia: "#3a86ff"};
state.model = MODELLI.length ? MODELLI[0].id : null;
const BLK0 = {NAM: [48, -100], SAM: [-15, -60], EUR: [52, 25], ASI: [45, 100], AFR: [5, 20], ARA: [23, 46], IND: [22, 79], AUS: [-25, 134], ANT: [-82, 0], GRL: [72, -40]};
function blockOf(lon, lat) {
  if (lat < -60) return "ANT";
  if (lat > 59 && lon > -75 && lon < -10) return "GRL";
  if (lon <= -30) { if (lon < -170) return lat > 50 ? "NAM" : null; return lat > 8.5 ? (lon > -130 || lat > 48 ? "NAM" : null) : lon > -95 ? "SAM" : null; }
  if ((lon > 110 && lat < -8) || (lon > 130 && lat < 0)) return lon > 160 && lat > -30 ? null : "AUS";
  if (lon >= 66 && lon <= 93 && lat >= 5 && lat <= 31) return "IND";
  if (lon >= 34 && lon <= 60 && lat >= 12 && lat <= 31) return "ARA";
  if (lon < 52 && lat < 37) return "AFR";
  return lon < 60 ? "EUR" : "ASI";
}
function qMul(a, b) {
  return [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
}
const qAxis = (v, ang) => { const s = Math.sin(ang / 2); return [Math.cos(ang / 2), v[0] * s, v[1] * s, v[2] * s]; };
function qSlerp(q0, q1, u) {
  let d = q0[0] * q1[0] + q0[1] * q1[1] + q0[2] * q1[2] + q0[3] * q1[3]; const s = d < 0 ? -1 : 1; d = Math.abs(d);
  let k0 = 1 - u, k1 = u * s;
  if (d < .9995) { const th = Math.acos(d), st = Math.sin(th); k0 = Math.sin((1 - u) * th) / st; k1 = s * Math.sin(u * th) / st; }
  const q = [k0 * q0[0] + k1 * q1[0], k0 * q0[1] + k1 * q1[1], k0 * q0[2] + k1 * q1[2], k0 * q0[3] + k1 * q1[3]], n = Math.hypot(...q);
  return q.map(v => v / n);
}
// rotazione che porta il blocco dalla posizione di oggi a quella del modello: spostamento del centro, poi rotazione oraria di rot gradi
function modelQ(M, blk) {
  const key = "_q" + blk; if (key in M) return M[key];
  const b = M.blocks[blk], c0 = BLK0[blk]; let q = null;
  if (b && c0) {
    const a = vecOf(c0[1], c0[0]), t = vecOf(b[1], b[0]);
    const cx = [a[1] * t[2] - a[2] * t[1], a[2] * t[0] - a[0] * t[2], a[0] * t[1] - a[1] * t[0]], cn = Math.hypot(...cx);
    const mv = cn < 1e-9 ? [1, 0, 0, 0] : qAxis(cx.map(v => v / cn), Math.atan2(cn, a[0] * t[0] + a[1] * t[1] + a[2] * t[2]));
    q = qMul(qAxis(t, -(b[2] || 0) * RAD), mv);
  }
  return (M[key] = q);
}
const modelNow = () => MODELLI.find(m => m.id === state.model) || MODELLI[0] || null;
const QB = new Map();
function futQB(pid, blk, f) {
  const q50 = futQ(pid, f), M = modelNow();
  if (!M || !q50 || f <= FUT_TECT || !blk) return q50;
  const qt = modelQ(M, blk); if (!qt) return q50;
  const key = M.id + pid + blk + Math.round(f);
  if (QB.has(key)) return QB.get(key);
  const q = qSlerp(q50, qt, smooth(FUT_TECT, -(M.t || -250), f));
  if (QB.size > 8000) QB.clear();
  QB.set(key, q); return q;
}
const blockOfR = r => r.blk !== undefined ? r.blk : (r.blk = (c => blockOf(c[0], c[1]))(d3.geoCentroid(r.feat)));
// placca di un punto (coordinate attuali) in un modello: poligono che lo contiene, altrimenti il vertice più vicino
function pidOf(M, lon, lat, fallback) {
  const key = lon.toFixed(2) + "," + lat.toFixed(2);
  if (M.pidc.has(key)) return M.pidc.get(key);
  let pid = null;
  for (const r of M.coast) {
    const [x0, y0, x1, y1] = r.bb;
    if (lon < x0 - .1 || lon > x1 + .1 || lat < y0 - .1 || lat > y1 + .1) continue;
    if (d3.geoContains(r.feat, [lon, lat])) { pid = r.p; break; }
  }
  if (pid == null) {
    const v = vecOf(lon, lat); let best = -2;
    for (const r of M.coast) {
      const [, y0, , y1] = r.bb;
      if (lat < y0 - 8 || lat > y1 + 8) continue;
      for (let i = 0; i < r.n; i++) { const d = v[0] * r.V[3 * i] + v[1] * r.V[3 * i + 1] + v[2] * r.V[3 * i + 2]; if (d > best) { best = d; pid = r.p; } }
    }
    if (best < Math.cos(6 * RAD) && fallback != null && M.RQ[fallback]) pid = fallback;
  }
  M.pidc.set(key, pid); return pid;
}
// posizione all'età t di un punto di oggi; fb = plate ID di riserva {pm, md}
function paleo(lon, lat, t, fb) {
  if (t < 0.02 && t > -0.02) return [lon, lat];
  const M = modelAt(t), pid = pidOf(M, lon, lat, fb ? fb[M.key] : null);
  if (pid == null) return null;
  const q = t < 0 ? futQB(pid, blockOf(lon, lat), -t) : quatAt(M, pid, Math.min(t, M.max)); if (!q) return null;
  const v = vecOf(lon, lat); return toLL(rotV(q, v[0], v[1], v[2]));
}
const COAST = MM.coast;   // coste di oggi (le più dettagliate)
const TODAY = {type: "MultiPolygon", coordinates: COAST.map(r => [r.ring])};
// terre emerse all'età t secondo le coste del modello: [{ring ruotato, r}]
let LAND = null, LAND_T = NaN;
function landAt(t) {
  if (t === LAND_T && LAND) return LAND;
  const M = modelAt(t), tt = Math.min(t, M.max), out = [];
  for (const r of M.coast) {
    if (r.b < t) continue;   // terra non ancora formata (o non ancora presente nel modello)
    if (t < 0.02 && t > -0.02) { out.push({r, ring: r.ring, q: null}); continue; }
    const q = t < 0 ? futQB(r.p, blockOfR(r), -t) : quatAt(M, r.p, tt); if (!q) continue;
    const ring = new Array(r.n);
    for (let i = 0; i < r.n; i++) ring[i] = toLL(rotV(q, r.V[3 * i], r.V[3 * i + 1], r.V[3 * i + 2]));
    out.push({r, ring, q});
  }
  LAND = {list: out, geo: {type: "MultiPolygon", coordinates: out.map(o => [o.ring])}}; LAND_T = t;
  return LAND;
}

/* ---------- fossili (Paleobiology Database) ---------- */
const F = D.fossili;
const STG = F.stages.map((s, i) => ({name: s[0], from: s[1], to: i + 1 < F.stages.length ? F.stages[i + 1][1] : 0}));
function stageOf(t) { for (let i = STG.length - 1; i >= 0; i--) if (t <= STG[i].from && t >= STG[i].to - 1e-9) return i; return -1; }
const FCELL = F.cells.map(c => ({lon: c[0], lat: c[1], gp: c[2], pid: null}));
const FIDX = {};            // gruppo -> piano -> [voci]
const GKEYS = Object.keys(F.groups);
GKEYS.forEach(g => {
  FIDX[g] = {};
  for (const e of F.groups[g]) { const s = e[1]; (FIDX[g][s] || (FIDX[g][s] = [])).push(e); }
  state.groups[g] = true;
});
function cellFb(ci) { const c = F.cells[ci]; return {md: c[2], pm: c[3]}; }

const GDEF = {
  microbi: ["Microbi e stromatoliti", "#8a6d3b", "🦠"], eucarioti: ["Eucarioti unicellulari e alghe", "#4f8f6f", "🧫"],
  ediacara: ["Organismi di Ediacara", "#c4874b", "🪸"], spugne_coralli: ["Spugne e coralli", "#e07a5f", "🪸"],
  trilobiti: ["Trilobiti", "#b5838d", "🪲"], artropodi: ["Altri artropodi", "#9c6644", "🦂"], insetti: ["Insetti", "#d4a017", "🪰"],
  molluschi: ["Cefalopodi (ammoniti, nautiloidi)", "#3d8fb3", "🐚"], brachiopodi: ["Brachiopodi", "#8d99ae", "🐚"],
  echinodermi: ["Echinodermi", "#e5989b", "⭐"], pesci: ["Pesci", "#2a9d8f", "🐟"], piante: ["Piante terrestri", "#4caf50", "🌿"],
  anfibi: ["Anfibi e primi tetrapodi", "#6a994e", "🐸"], sinapsidi: ["Sinapsidi (antenati dei mammiferi)", "#bc6c25", "🦎"],
  rettili: ["Altri rettili", "#7f9f3f", "🐊"], rettili_marini: ["Rettili marini", "#277da1", "🐋"], pterosauri: ["Pterosauri", "#a06cd5", "🦇"],
  dinosauri: ["Dinosauri non aviani", "#d62828", "🦖"], uccelli: ["Uccelli", "#f4a261", "🐦"], mammiferi: ["Mammiferi", "#9d4edd", "🐘"],
  ominini: ["Ominini", "#e76f51", "👣"]
};
const G = k => {
  const g = GROUPS_[k] || {}, d = GDEF[k] || [k, "#888", "•"];
  return {name: g.name || d[0], color: g.color || d[1], emoji: g.emoji || d[2], text: g.text || "", ott: g.ott, wiki: g.wiki, wikiEn: g.wikiEn};
};

/* ---------- protagonisti, eventi: posizioni ---------- */
TAXA_.forEach(x => { x.sitesP = (x.sites || []).map(s => ({lat: s[0], lon: s[1], name: s[2], pid: null})); });

/* ---------- clima, ghiacci, oceani ---------- */
const SEA = [[0, 0], [0.006, -1], [0.008, -15], [0.0105, -45], [0.0125, -60], [0.0145, -80], [0.0165, -100], [0.019, -122], [0.026, -125], [0.029, -110], [0.035, -85], [0.045, -75], [0.06, -85], [0.07, -70], [0.082, -25], [0.09, -50], [0.1, -25], [0.11, -50], [0.117, -10], [0.125, 5], [0.13, 0], [0.135, -60], [0.14, -110], [0.16, -120], [0.19, -60], [0.2, -20], [0.22, -70], [0.24, -10], [0.26, -90], [0.29, -70], [0.325, 0], [0.34, -60], [0.35, -110], [0.37, -70], [0.4, 5], [0.42, -60], [0.43, -120], [0.5, -60]];
function interp(arr, x) {
  if (x <= arr[0][0]) return arr[0][1];
  for (let i = 1; i < arr.length; i++) if (x <= arr[i][0]) { const [a, va] = arr[i - 1], [b, vb] = arr[i]; return va + (vb - va) * (x - a) / (b - a); }
  return arr[arr.length - 1][1];
}
// futuro: fotogrammi del clima di src/futuro.js (t decrescente), interpolati
const FCL = (FUT && FUT.clima && FUT.clima.length ? FUT.clima : [{t: 0, dT: 0, sea: 0, co2: 425, lum: 1, ocean: 1, iceN: 74, iceS: -63, plants: 1, animals: 1, life: 1}]).slice().sort((a, b) => b.t - a.t);
let FC_T = NaN, FC_V = null;
function futClim(t) {
  if (t === FC_T) return FC_V;
  let i = 0; while (i < FCL.length - 2 && FCL[i + 1].t > t) i++;
  const a = FCL[i], b = FCL[Math.min(i + 1, FCL.length - 1)], u = a === b ? 0 : clamp01((a.t - t) / (a.t - b.t)), o = {t};
  for (const k of ["dT", "sea", "co2", "lum", "ocean", "iceN", "iceS", "plants", "animals", "life"]) {
    const va = a[k], vb = b[k];
    o[k] = typeof va === "number" && typeof vb === "number" ? va + (vb - va) * u : (u < .5 ? va : vb);
    if (o[k] === undefined) o[k] = null;
  }
  o.note = (u < .5 ? a.note : b.note) || a.note || "";
  FC_T = t; FC_V = o; return o;
}
// livello del mare nel futuro: quello del modello, più l'abbassamento quando gli oceani evaporano
function futSea(t) { const f = futClim(t), w = f.ocean == null ? 1 : clamp01(f.ocean); return (f.sea || 0) - (w < 1 ? (w <= 0 ? 12000 : 5200 * Math.pow(1 - w, .7)) : 0); }
const seaLevel = t => t < 0 ? futSea(t) : t > 0.5 ? 0 : interp(SEA, t);
const iceF = t => clamp01(-(t < 0 ? futClim(t).sea || 0 : seaLevel(t)) / 125);
const DAY = [[FUT_END, 28], [-1300, 28], [-600, 27], [-200, 25], [0, 24], [70, 23.5], [250, 22.7], [400, 22], [620, 21.9], [1000, 19], [2000, 19], [2500, 17], [3200, 13], [4500, 6]];
const O2 = [[FUT_END, 0], [-1150, 0.01], [-1050, 1], [-950, 20], [0, 21], [66, 25], [100, 26], [150, 22], [200, 18], [230, 16], [260, 25], [300, 32], [350, 25], [400, 17], [450, 14], [541, 13], [700, 5], [800, 1], [1800, 1], [2050, 2], [2300, 1], [2450, 0.001], [4567, 0]];
function climate(t) {
  // ritorna: neve globale, latitudine del ghiaccio polare a sud e a nord (null = nessuno), aridità della fascia subtropicale
  const c = {snow: 0, s: null, n: null, arid: .45, note: ""};
  if (t < 0) {
    const f = futClim(t);
    c.s = f.iceS; c.n = f.iceN; c.arid = .5 + .3 * clamp01((f.dT - 3) / 25); c.note = f.note; c.fut = f;
    return c;
  }
  if (t <= 717 && t >= 660) { c.snow = 1; c.note = "Glaciazione sturtiana: la Terra è quasi tutta coperta di ghiaccio («Terra a palla di neve»)."; }
  else if (t <= 650 && t >= 635) { c.snow = 1; c.note = "Glaciazione marinoana: un'altra «Terra a palla di neve»."; }
  else if (t <= 2450 && t >= 2220) { c.snow = .75; c.note = "Glaciazioni uroniane: dopo l'arrivo dell'ossigeno il metano crolla e la Terra si raffredda."; }
  else if (t <= 447 && t >= 443) { c.s = -50; c.note = "Glaciazione del tardo Ordoviciano: il ghiaccio copre il Gondwana vicino al polo sud."; }
  else if (t <= 365 && t >= 358) { c.s = -62; }
  else if (t <= 340 && t >= 285) { c.s = t > 320 ? -55 : -45; c.note = "Era glaciale del tardo Paleozoico: calotte sul Gondwana meridionale."; }
  else if (t < 285 && t >= 265) { c.s = -62; }
  if (t <= 34) c.s = t > 14 ? -68 : -63;
  if (t <= 2.7) c.n = t > 0.5 ? 64 : 70;
  if (t <= 0.0117) c.n = 74;
  // aridità della fascia subtropicale (Pangea molto arida)
  if (t > 300) c.arid = .35; else if (t > 200) c.arid = .85; else if (t > 145) c.arid = .55; else if (t > 66) c.arid = .35; else if (t > 34) c.arid = .2; else c.arid = .5;
  return c;
}
const plantF = t => t < 0 ? clamp01(futClim(t).plants == null ? 1 : futClim(t).plants) : t > 470 ? 0 : t > 420 ? (470 - t) / 50 * .35 : t > 385 ? .35 + (420 - t) / 35 * .35 : t > 360 ? .7 + (385 - t) / 25 * .3 : 1;

/* ---------- etichette dei continenti antichi (punto d'appoggio attuale, intervallo in Ma) ---------- */
const PLABELS = [
  ["Rodinia", -100, 45, 1000, 760], ["Laurentia", -100, 50, 740, 425], ["Baltica", 30, 60, 740, 425], ["Siberia", 105, 63, 740, 255],
  ["Gondwana", 20, 2, 600, 336], ["Laurussia", -85, 42, 424, 336], ["Pangea", 18, 8, 335, 176], ["Gondwana", 25, -5, 175, 110],
  ["Laurasia", 70, 55, 175, 60], ["Africa", 22, 5, 109, 0], ["Sud America", -60, -12, 109, 0], ["Nord America", -100, 45, 59, 0],
  ["Eurasia", 85, 55, 59, 0], ["India", 78, 20, 109, 45], ["Australia", 134, -25, 80, 0], ["Antartide", 40, -78, 80, 0]
];
const PLAB = PLABELS.map(([n, lon, lat, from, to]) => ({n, lon, lat, from, to, pid: null}));

/* ---------- immagini e testi da Wikipedia ---------- */
const WCACHE = {};
async function wikiSum(title, lang) {
  if (!title) return null;
  const key = lang + ":" + title;
  if (key in WCACHE) return WCACHE[key];
  const p = (async () => {
    try {
      const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}?redirect=true`);
      if (!r.ok) return null;
      const j = await r.json();
      if (j.type === "disambiguation") return null;
      const thumb = j.thumbnail && j.thumbnail.source;
      let img = thumb;
      if (img && /\/\d+px-/.test(img) && j.originalimage && j.originalimage.width > 500) img = img.replace(/\/\d+px-/, "/500px-");
      if (window.Cerca && /^(Homo sapiens|Human|Humans|Essere umano|Umano)$/i.test(j.title)) return Object.assign({title: j.title, extract: j.extract, url: j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page, lang}, window.Cerca.safeImg("Homo sapiens"));
      if (window.Cerca && window.Cerca.badImg(thumb)) return {title: j.title, img: null, thumb: null, extract: j.extract, url: j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page, lang};
      return {title: j.title, img, thumb, full: j.originalimage && j.originalimage.source, extract: j.extract, url: j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page, lang};
    } catch (e) { return null; }
  })();
  WCACHE[key] = p; return p;
}
async function wikiBest(it, en, sci) {
  const sf = sci && window.Cerca && window.Cerca.safeImg(sci); if (sf) return Object.assign({title: sci}, sf);
  const a = it ? await wikiSum(it, "it") : null;
  if (a && a.img) return a;
  const b = en ? await wikiSum(en, "en") : null;
  if (b && b.img) return Object.assign({}, b, {extractIt: a && a.extract, urlIt: a && a.url});
  return a || b;
}
const ozLink = (name, ott) => ott ? `https://www.onezoom.org/life/@${encodeURIComponent(String(name).replace(/ /g, "_"))}=${ott}` : `https://www.onezoom.org/life/@${encodeURIComponent(String(name).replace(/ /g, "_"))}`;
const otLink = ott => `https://tree.opentreeoflife.org/opentree/argus/ottol@${ott}`;
const pbdbLink = name => `https://paleobiodb.org/classic/checkTaxonInfo?taxon_name=${encodeURIComponent(name)}`;
const wpLink = (t, lang) => `https://${lang || "it"}.wikipedia.org/wiki/${encodeURIComponent(String(t).replace(/ /g, "_"))}`;
const wpSearch = (q, lang) => `https://${lang || "it"}.wikipedia.org/w/index.php?search=${encodeURIComponent(q)}`;

/* ---------- proiezione e disegno ---------- */
const cv = $("map"), ctx = cv.getContext("2d");
let W = 0, H = 0, dpr = 1, proj = null, gp = null, BASE = 1, Z = 1, ROTV = [-15, -10], PANY = 0;
const DARK = () => getComputedStyle(document.documentElement).getPropertyValue("--bg").trim().toLowerCase() === "#0e1517";
let COL = {};
function readCols() {
  const g = n => getComputedStyle(document.documentElement).getPropertyValue("--" + n).trim();
  ["bg", "panel", "ink", "muted", "line", "sea", "atmo", "accent", "halo", "chip"].forEach(k => COL[k] = g(k));
  COL.dark = DARK();
}
function resize() {
  const r = $("mapwrap").getBoundingClientRect();
  W = Math.max(50, r.width); H = Math.max(50, r.height); dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  setProj(); draw();
}
function setProj() {
  const small = W < 600, low = H < 460;
  const top = low ? 46 : small ? 96 : 64, bot = low ? 70 : small ? 120 : 30;
  if (state.mode === "globe") {
    proj = d3.geoOrthographic().clipAngle(90).precision(.5).fitExtent([[10, top], [W - 10, H - bot]], {type: "Sphere"});
    BASE = proj.scale();
    proj.scale(BASE * Z).rotate([ROTV[0], ROTV[1]]);
  } else {
    proj = d3.geoEquirectangular().precision(.5).fitExtent([[10, top], [W - 10, H - bot]], {type: "Sphere"});
    BASE = proj.scale(); const tr = proj.translate();
    proj.scale(BASE * Z).rotate([ROTV[0], 0]).translate([tr[0], tr[1] + PANY]);
  }
  gp = d3.geoPath(proj, ctx);
}
const visible = (lon, lat) => state.mode !== "globe" || d3.geoDistance([lon, lat], [-ROTV[0], -ROTV[1]]) < Math.PI / 2 - 0.02;
const GRAT = d3.geoGraticule10();
const EQUATOR = {type: "LineString", coordinates: d3.range(-180, 181, 5).map(x => [x, 0])};

// piattaforma continentale (Natural Earth) e calotte dell'ultima glaciazione disegnate a mano
let SHELF_DEEP = null;
try { const s = D.shelf; if (s) { const k = Object.keys(s.objects)[0]; SHELF_DEEP = topojson.feature(s, s.objects[k]); } } catch (e) { SHELF_DEEP = null; }
const ICE_SHEETS = [
  {c: [-85, 60], off: .05, pts: [[-150, 60], [-135, 57], [-128, 50], [-123, 47.5], [-117, 48], [-110, 48.5], [-100, 47], [-96, 44], [-93.6, 41.6], [-89, 40], [-86, 39.5], [-82, 39], [-80, 40.5], [-75, 41], [-73, 40.7], [-70, 41.3], [-66, 43], [-60, 44], [-55, 46], [-52, 48], [-55, 52], [-60, 57], [-64, 60], [-63, 64], [-62, 67], [-68, 71], [-75, 76], [-85, 80], [-95, 82], [-110, 79], [-125, 76], [-128, 71], [-135, 68], [-138, 64], [-142, 62], [-150, 62], [-150, 60]]},
  {c: [18, 64], off: .15, pts: [[-10, 54], [-10.5, 52], [-6, 51.5], [-3, 51.5], [0, 52.5], [4, 53.5], [8, 53], [10, 53.5], [13, 52.5], [18, 52.5], [22, 53.5], [26, 54.5], [30, 55], [32, 56.5], [35, 58], [40, 61], [45, 63], [50, 64], [55, 65], [60, 66], [65, 68], [70, 72], [75, 75], [80, 78], [70, 80], [55, 81], [40, 81], [25, 80.5], [15, 79], [10, 72], [5, 65], [-2, 62], [-5, 60], [-8, 58], [-10, 56], [-10, 54]]},
  {c: [10, 46.3], off: -.12, pts: [[5.5, 45], [7, 44.2], [7.4, 45.07], [9, 45.6], [11, 45.5], [14, 46], [16, 47], [13, 47.9], [10, 47.7], [7, 47.4], [6, 46.5], [5.5, 45]]},
  {c: [-73, -47], off: -.2, pts: [[-75, -56], [-72, -55], [-71, -50], [-71.5, -44], [-71.5, -38], [-73.5, -38], [-75, -45], [-76, -52], [-75, -56]]},
  {c: [-42, 72], off: -1, pts: [[-52, 60], [-44, 59.5], [-38, 65], [-26, 69], [-22, 72], [-19, 76], [-18, 80], [-30, 83], [-45, 82.5], [-60, 81], [-66, 78], [-58, 76], [-54, 72], [-52, 66], [-52, 60]]}
];
function iceSheetGeo(sh, f) {
  const [cx, cy] = sh.c; let ring = sh.pts.map(([x, y]) => [cx + (x - cx) * f, cy + (y - cy) * f]);
  const poly = {type: "Polygon", coordinates: [ring]};
  if (d3.geoArea(poly) > 2 * Math.PI) ring.reverse();
  return poly;
}

/* ---------- globo fisico: rilievo, clima e biomi ----------
   Rilievo e batimetria 0–540 Ma: PaleoDEM di Scotese & Wright (2018, PALEOMAP, CC BY 4.0), 1° ogni 5 Ma.
   Prima di 540 Ma il rilievo è stimato dalla distanza dalla costa. Il dettaglio fine è un rumore frattale
   campionato in coordinate attuali, così si muove insieme alle placche. */
const NW = 512, NH = 256;
const NOISE = (() => {
  let s = 20261018; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const out = new Float32Array(NW * NH); let tot = 0;
  for (let o = 0; o < 7; o++) {
    const gw = 4 << o, gh = 2 << o, g = new Float32Array(gw * (gh + 1)), amp = Math.pow(.56, o); tot += amp;
    for (let i = 0; i < g.length; i++) g[i] = rnd() * 2 - 1;
    for (let y = 0; y < NH; y++) {
      const fy = y / NH * gh, y0 = Math.floor(fy), v = fy - y0, sv = v * v * (3 - 2 * v);
      for (let x = 0; x < NW; x++) {
        const fx = x / NW * gw, x0 = Math.floor(fx), u = fx - x0, su = u * u * (3 - 2 * u), x1 = (x0 + 1) % gw;
        const a = g[y0 * gw + x0] + (g[y0 * gw + x1] - g[y0 * gw + x0]) * su;
        const b = g[(y0 + 1) * gw + x0] + (g[(y0 + 1) * gw + x1] - g[(y0 + 1) * gw + x0]) * su;
        out[y * NW + x] += (a + (b - a) * sv) * amp;
      }
    }
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot * .55;
  return out;
})();
function noiseAt(lon, lat) {
  let x = (lon + 180) / 360 * NW, y = (90 - lat) / 180 * (NH - 1);
  x = ((x % NW) + NW) % NW; y = clamp(y, 0, NH - 1.001);
  const x0 = Math.floor(x), y0 = Math.floor(y), u = x - x0, v = y - y0, x1 = (x0 + 1) % NW;
  const a = NOISE[y0 * NW + x0] + (NOISE[y0 * NW + x1] - NOISE[y0 * NW + x0]) * u;
  const b = NOISE[(y0 + 1) * NW + x0] + (NOISE[(y0 + 1) * NW + x1] - NOISE[(y0 + 1) * NW + x0]) * u;
  return a + (b - a) * v;
}

// PaleoDEM: decompressione (gzip in base64, righe a differenze)
let DEM = null;
async function loadDem() {
  const d = D.dem; if (!d || !window.DecompressionStream) return;
  try {
    const bin = Uint8Array.from(atob(d.b64), ch => ch.charCodeAt(0));
    const stream = new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"));
    const buf = new Uint8Array(await new Response(stream).arrayBuffer());
    const w = d.w, h = d.h, q = new Int8Array(buf.length);
    for (let r = 0; r < buf.length / w; r++) { let u = 0; const o = r * w; for (let x = 0; x < w; x++) { u = (u + buf[o + x]) & 255; q[o + x] = u > 127 ? u - 256 : u; } }
    const LUT = new Float32Array(256); for (let i = -128; i < 128; i++) LUT[i & 255] = Math.sign(i) * Math.pow(i / 1.6, 2);
    DEM = {w, h, times: d.times, q, LUT, cache: new Map()};
    TEX.t = NaN; draw();
  } catch (e) { console.warn("PaleoDEM non disponibile", e); }
}
function demGrid(t) {
  const key = Math.round(t * 100) / 100;
  if (DEM.cache.has(key)) return DEM.cache.get(key);
  const T = DEM.times; let i = 0; while (i < T.length - 2 && T[i + 1] < t) i++;
  const u = clamp01((t - T[i]) / (T[i + 1] - T[i])), n = DEM.w * DEM.h, a = i * n, b = (i + 1) * n, out = new Float32Array(n), L = DEM.LUT, q = DEM.q;
  for (let k = 0; k < n; k++) { const ea = L[q[a + k] & 255], eb = L[q[b + k] & 255]; out[k] = ea + (eb - ea) * u; }
  if (DEM.cache.size > 6) DEM.cache.delete(DEM.cache.keys().next().value);
  DEM.cache.set(key, out); return out;
}
function demAt(g, lon, lat) {
  const w = DEM.w, h = DEM.h;
  let x = lon + 180, y = 90 - lat; x = ((x % 360) + 360) % 360; y = clamp(y, 0, h - 1.001);
  const x0 = Math.floor(x), y0 = Math.floor(y), u = x - x0, v = y - y0, x1 = (x0 + 1) % w;
  const a = g[y0 * w + x0] + (g[y0 * w + x1] - g[y0 * w + x0]) * u;
  const b = g[(y0 + 1) * w + x0] + (g[(y0 + 1) * w + x1] - g[(y0 + 1) * w + x0]) * u;
  return a + (b - a) * v;
}

// clima globale: scarto di temperatura rispetto a oggi (°C, stime arrotondate dalle curve di paleotemperatura)
const GT = [[0, 0], [0.5, 0], [3, 2], [5, 3], [15, 5], [34, 7], [45, 10], [56, 14], [66, 9], [90, 12], [145, 7], [200, 7], [250, 12], [260, 8], [300, 0], [340, 3], [360, 6], [420, 7], [445, 1], [450, 9], [541, 9], [750, 5], [5000, 5]];
const MZ = [[0, 1], [8, .92], [14, .62], [20, .3], [27, .22], [34, .36], [42, .6], [52, .8], [62, .66], [72, .45], [90, .3]];   // umidità per fascia di latitudine
const grassF = t => clamp01((30 - t) / 15);   // praterie: si diffondono dall'Oligocene-Miocene
function smooth(a, b, x) { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); }
function mixC(o, a, b, u) { o[0] = a[0] + (b[0] - a[0]) * u; o[1] = a[1] + (b[1] - a[1]) * u; o[2] = a[2] + (b[2] - a[2]) * u; return o; }
const C = {
  rain: [30, 84, 40], temp: [62, 106, 52], boreal: [46, 80, 60], wood: [112, 138, 66], steppe: [186, 174, 108], scrub: [146, 140, 92],
  desert: [224, 198, 146], redDesert: [200, 156, 112], tundra: [140, 138, 114], bareDry: [190, 156, 116], bareWet: [118, 108, 96], basalt: [84, 80, 76],
  high: [150, 126, 100], rock: [136, 130, 124], snow: [242, 246, 250], ice: [234, 241, 247],
  shallow: [104, 190, 206], shelf: [58, 142, 186], slope: [28, 92, 156], deep: [14, 48, 102], tropShallow: [92, 204, 210], seaIce: [214, 228, 238],
  archSea: [44, 98, 84], crust: [44, 28, 22], lava: [255, 112, 36], magma: [170, 58, 24],
  salt: [222, 204, 168], scorch: [132, 86, 62], brine: [70, 118, 112]
};
// tabella colore dei biomi (temperatura × umidità) per l'epoca t
function biomeLUT(t) {
  const pf = plantF(t), gf = grassF(t), red = t > 200 && t < 300 ? .7 : t > 145 && t <= 200 ? .3 : 0;
  const NTk = 64, NM = 32, L = new Uint8Array(NTk * NM * 3), o = [0, 0, 0], v = [0, 0, 0], f = [0, 0, 0], bare = [0, 0, 0], des = [0, 0, 0], st = [0, 0, 0];
  for (let i = 0; i < NTk; i++) {
    const T = -30 + i * 65 / (NTk - 1);
    for (let j = 0; j < NM; j++) {
      const M = j / (NM - 1);
      mixC(f, C.boreal, C.temp, smooth(2, 12, T)); mixC(f, f, C.rain, smooth(15, 24, T));
      mixC(des, C.desert, C.redDesert, red);
      mixC(st, C.scrub, C.steppe, gf);
      mixC(v, des, st, smooth(.14, .34, M)); mixC(v, v, C.wood, smooth(.34, .55, M)); mixC(v, v, f, smooth(.52, .76, M));
      mixC(v, C.tundra, v, smooth(-3, 6, T));
      mixC(bare, C.bareDry, C.bareWet, M); if (t > 2500) mixC(bare, bare, C.basalt, .7);
      mixC(o, bare, v, pf);
      const k = (i * NM + j) * 3; L[k] = o[0]; L[k + 1] = o[1]; L[k + 2] = o[2];
    }
  }
  return L;
}
// distanza (in pixel) dal pixel più vicino di valore diverso, con la maschera m (1 = terra)
function distField(m, w, h, val) {
  const D2 = new Float32Array(w * h), BIG = 1e6;
  for (let i = 0; i < m.length; i++) D2[i] = m[i] === val ? BIG : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; let d = D2[i]; if (!d) continue;
    const l = x > 0 ? i - 1 : i + w - 1;
    d = Math.min(d, D2[l] + 1);
    if (y > 0) { const u = i - w; d = Math.min(d, D2[u] + 1, D2[x > 0 ? u - 1 : u + w - 1] + 1.414, D2[x < w - 1 ? u + 1 : u - w + 1] + 1.414); }
    D2[i] = d;
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x; let d = D2[i]; if (!d) continue;
    const r = x < w - 1 ? i + 1 : i - w + 1;
    d = Math.min(d, D2[r] + 1);
    if (y < h - 1) { const b = i + w; d = Math.min(d, D2[b] + 1, D2[x > 0 ? b - 1 : b + w - 1] + 1.414, D2[x < w - 1 ? b + 1 : b - w + 1] + 1.414); }
    D2[i] = d;
  }
  return D2;
}
// distanza (in pixel, lungo la riga) dal mare più vicino verso est (dir = 1) o verso ovest (dir = −1)
function seaAlong(m, w, h, dir) {
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const o = y * w; let d = w;
    for (let pass = 0; pass < 2; pass++) for (let k = 0; k < w; k++) {
      const x = dir > 0 ? w - 1 - k : k, i = o + x;
      d = m[i] ? d + 1 : 0; if (pass) out[i] = Math.min(d, w);
    }
  }
  return out;
}

const TEX = {t: NaN, w: 0, h: 0, rgba: null, sea: null, cv: document.createElement("canvas"), res: 0};
const RCV = document.createElement("canvas");
function buildTex(t, tw) {
  const th = tw / 2, n = tw * th, kmPx = 40030 / tw;
  RCV.width = tw; RCV.height = th;
  const rc = RCV.getContext("2d", {willReadFrequently: true});
  const ep = d3.geoEquirectangular().scale(tw / (2 * Math.PI)).translate([tw / 2, th / 2]).precision(.3), epath = d3.geoPath(ep, rc);
  // 1) terre del modello di placche, con l'indice del poligono (serve a ritrovare le coordinate attuali)
  rc.clearRect(0, 0, tw, th);
  const land = t <= 4000 ? landAt(t) : {list: []};
  land.list.forEach((o, i) => { const k = i + 1; rc.fillStyle = `rgb(${k & 255},${k >> 8},0)`; rc.beginPath(); epath({type: "Polygon", coordinates: [o.ring]}); rc.fill(); });
  const idd = rc.getImageData(0, 0, tw, th).data;
  // 2) ghiacci dell'ultima glaciazione (maschera a parte)
  const cl = climate(t), fI = iceF(t);
  let iceM = null;
  const fc = t < 0 ? cl.fut : null;
  // nel futuro: calotte disegnate solo finché i continenti sono quasi fermi e fa abbastanza freddo
  if (t < 2.7 && t > -3 && state.layers.climate && (!fc || fc.iceN != null)) {
    rc.clearRect(0, 0, tw, th); rc.fillStyle = "#fff";
    for (const sh of ICE_SHEETS) {
      let f = sh.off >= 0 ? clamp01((fI - sh.off) / (1 - sh.off)) : (-sh.off + (1 + sh.off) * fI);
      if (fc && sh.off === -1) f = Math.max(fI, clamp01((80 - fc.iceN) / 6));   // Groenlandia: si ritira se il ghiaccio artico arretra
      if (f < .04) continue; rc.beginPath(); epath(iceSheetGeo(sh, Math.min(1, f))); rc.fill();
    }
    iceM = rc.getImageData(0, 0, tw, th).data;
  }
  // 3) quota
  const E = new Float32Array(n), RI = new Int16Array(n), mask = new Uint8Array(n);
  const lonC = new Float32Array(tw), latC = new Float32Array(th);
  for (let x = 0; x < tw; x++) lonC[x] = (x + .5) / tw * 360 - 180;
  for (let y = 0; y < th; y++) latC[y] = 90 - (y + .5) / th * 180;
  for (let i = 0; i < n; i++) { const a = idd[4 * i + 3]; RI[i] = a > 127 ? (idd[4 * i] + (idd[4 * i + 1] << 8)) - 1 : -1; }
  const useDem = DEM && t <= 540, sl = seaLevel(t);
  if (useDem && t <= -0.02) {
    // futuro con i continenti spostati: rilievo di oggi letto nelle coordinate attuali di ogni pixel di terra,
    // fondali oceanici stimati dalla distanza dalla terra
    const g = demGrid(0), m0 = new Uint8Array(n);
    for (let y = 0; y < th; y++) {
      const la = latC[y] * RAD, cla = Math.cos(la), sla = Math.sin(la);
      for (let x = 0; x < tw; x++) {
        const i = y * tw + x, r = RI[i], o = r >= 0 ? land.list[r] : null;
        if (!o || !o.q) continue;
        const lo = lonC[x] * RAD, q = o.q, p = rotV([q[0], -q[1], -q[2], -q[3]], cla * Math.cos(lo), cla * Math.sin(lo), sla);
        E[i] = demAt(g, Math.atan2(p[1], p[0]) / RAD, Math.asin(clamp(p[2], -1, 1)) / RAD); m0[i] = 1;
      }
    }
    const dS0 = distField(m0, tw, th, 0);
    for (let i = 0; i < n; i++) { if (!m0[i]) E[i] = -60 - 4300 * smooth(0, 5, dS0[i] * kmPx / 111); E[i] -= sl; mask[i] = E[i] > 0 ? 1 : 0; }
  } else if (useDem) {
    const g = demGrid(Math.max(0, t));
    for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++) { const i = y * tw + x; E[i] = demAt(g, lonC[x], latC[y]) - (t < 0.5 ? sl : 0); mask[i] = E[i] > 0 ? 1 : 0; }
  } else {
    for (let i = 0; i < n; i++) mask[i] = RI[i] >= 0 ? 1 : 0;
  }
  const dLand = distField(mask, tw, th, 1), dSea = distField(mask, tw, th, 0);
  const dEast = seaAlong(mask, tw, th, 1), dWest = seaAlong(mask, tw, th, -1);
  // coordinate attuali dei pixel di terra (per il rumore che si muove con le placche)
  const NZ = new Float32Array(n);
  for (let y = 0; y < th; y++) {
    const la = latC[y] * RAD, cla = Math.cos(la), sla = Math.sin(la);
    for (let x = 0; x < tw; x++) {
      const i = y * tw + x, lo = lonC[x] * RAD, r = RI[i];
      let vx = cla * Math.cos(lo), vy = cla * Math.sin(lo), vz = sla;
      if (r >= 0 && land.list[r] && land.list[r].q) { const q = land.list[r].q, p = rotV([q[0], -q[1], -q[2], -q[3]], vx, vy, vz); vx = p[0]; vy = p[1]; vz = p[2]; }
      NZ[i] = noiseAt(Math.atan2(vy, vx) / RAD, Math.asin(clamp(vz, -1, 1)) / RAD);
    }
  }
  for (let i = 0; i < n; i++) {
    const nz = NZ[i];
    if (useDem) { E[i] += mask[i] ? nz * 160 + Math.max(0, E[i] - 600) * nz * .35 : nz * 120; if (mask[i] && E[i] < 5) E[i] = 5; if (!mask[i] && E[i] > -5) E[i] = -5; }
    else if (mask[i]) E[i] = 120 + 900 * smooth(0, 9, dLand[i] * kmPx / 111) * (.55 + .45 * nz) + Math.max(0, nz) * 900;
    else E[i] = -60 - 4300 * smooth(0, 5, dSea[i] * kmPx / 111);
  }
  // 4) colori
  const LUT = biomeLUT(t), dT = fc ? clamp(fc.dT, -15, 60) : interp(GT, t) - (t < 0.5 ? 6 * fI : 0), arid = (cl.arid - .45) * .45;
  // futuro rovente: terre bruciate, poi superficie fusa; fondali rimasti all'asciutto quando gli oceani evaporano
  const scorch = fc ? smooth(45, 300, fc.dT) : 0, molten = fc ? smooth(700, 1400, fc.dT) : 0, dryBed = fc && sl < -150;
  const rgba = new Uint8ClampedArray(n * 4), sea = new Uint8Array(n), o = [0, 0, 0], tmp = [0, 0, 0];
  const hadean = t > 4400, hadeanOcean = t > 4000 && !hadean, archean = t > 2400, proter = t > 541;
  for (let y = 0; y < th; y++) {
    const lat = latC[y], al = Math.abs(lat), Tlat = -18 + 46 * Math.pow(Math.cos(lat * RAD), 1.3) + dT, M0 = interp(MZ, al);
    for (let x = 0; x < tw; x++) {
      const i = y * tw + x, e = E[i], nz = NZ[i];
      if (hadean) {
        const lo = lonC[x], r1 = 1 - Math.abs((nz - noiseAt(lo + 4, lat + 3)) * 2.4), r2 = 1 - Math.abs((noiseAt(lo + 90, lat) - noiseAt(lo + 92.5, lat - 2)) * 2.4);
        const glow = Math.max(smooth(.86, .97, r1), smooth(.9, .985, r2) * .8) * (.65 + .35 * clamp01((t - 4400) / 140)) + Math.max(0, nz) * .12;
        mixC(o, t > 4480 ? C.magma : C.crust, C.lava, glow); sea[i] = 0;
      } else if (mask[i] && !hadeanOcean) {
        const T = Tlat - 6.5 * e / 1000;
        // umidità: fascia di latitudine, distanza dal mare, venti dominanti (alisei da est ai tropici, venti occidentali alle medie latitudini)
        const kmE = dEast[i] * kmPx * Math.cos(lat * RAD), kmW = dWest[i] * kmPx * Math.cos(lat * RAD);
        const trade = smooth(32, 22, al), west = smooth(34, 44, al) * smooth(70, 58, al);
        let M = M0 * (.25 + .75 * Math.exp(-dSea[i] * kmPx / 1300)) + trade * .32 * Math.exp(-kmE / 900) - trade * .12 * Math.exp(-kmW / 600) + west * .28 * Math.exp(-kmW / 1200) + nz * .2 - arid;
        const ti = clamp(Math.round((T + 30) / 65 * 63), 0, 63), mj = clamp(Math.round(M * 31), 0, 31), k = (ti * 32 + mj) * 3;
        o[0] = LUT[k]; o[1] = LUT[k + 1]; o[2] = LUT[k + 2];
        if (e > 500) mixC(o, o, C.high, smooth(500, 2600, e) * .8);
        if (e > 2800) mixC(o, o, C.rock, smooth(2800, 4500, e) * .8);
        if (e > 1200 && T < -2) mixC(o, o, C.snow, smooth(-2, -9, T));
        // calotte e ghiacci
        let ice = 0;
        if (state.layers.climate) {
          if (cl.snow) ice = Math.max(ice, cl.snow);
          if (cl.s != null) ice = Math.max(ice, smooth(cl.s + 2, cl.s - 2, lat + nz * 3));
          if (cl.n != null && t >= 2.7) ice = Math.max(ice, smooth(cl.n - 2, cl.n + 2, lat + nz * 3));
          if (iceM && iceM[4 * i + 3] > 127) ice = 1;
        }
        if (ice > 0) mixC(o, o, C.ice, ice);
        if (fc) {
          if (dryBed && e + sl < 0) mixC(o, o, C.salt, .45 * smooth(0, -2000, e + sl) + .45);
          if (scorch > 0) mixC(o, o, C.scorch, scorch * (.8 + .2 * nz));
          if (molten > 0) {
            const lo = lonC[x], r1 = 1 - Math.abs((nz - noiseAt(lo + 4, lat + 3)) * 2.4);
            mixC(o, o, C.crust, molten * .8); mixC(o, o, C.lava, molten * smooth(.8, .97, r1));
          }
        }
        sea[i] = 0;
      } else {
        const d = -e;
        if (d < 200) mixC(o, C.shallow, C.shelf, smooth(10, 200, d));
        else if (d < 1500) mixC(o, C.shelf, C.slope, smooth(200, 1500, d));
        else mixC(o, C.slope, C.deep, smooth(1500, 4500, d));
        if (d < 160 && Tlat > 18) mixC(o, o, C.tropShallow, .5 * (1 - d / 160));
        if (archean) mixC(o, o, C.archSea, .55); else if (proter) mixC(o, o, C.archSea, .18);
        if (hadeanOcean && mask[i]) mixC(o, o, C.basalt, .8);
        if (dryBed) mixC(o, o, C.brine, .55);
        let si = 0;
        if (state.layers.climate) {
          if (cl.snow) si = cl.snow * (.85 + .15 * nz);
          if (cl.s != null) si = Math.max(si, smooth(cl.s - 2, cl.s - 7, lat + nz * 2));
          if (cl.n != null) si = Math.max(si, smooth(cl.n + 4, cl.n + 9, lat + nz * 2));
        }
        if (si > 0) mixC(o, o, C.seaIce, si);
        sea[i] = si > .5 ? 0 : 1;
      }
      rgba[4 * i] = o[0]; rgba[4 * i + 1] = o[1]; rgba[4 * i + 2] = o[2]; rgba[4 * i + 3] = 255;
    }
  }
  // 5) ombreggiatura del rilievo (luce da nord-ovest)
  const kL = 1 / (kmPx * 1000) * 16, kS = kL * .2;
  for (let y = 1; y < th - 1; y++) for (let x = 0; x < tw; x++) {
    const i = y * tw + x, l = x > 0 ? i - 1 : i + tw - 1, r = x < tw - 1 ? i + 1 : i - tw + 1;
    const gx = E[r] - E[l], gy = E[i + tw] - E[i - tw];
    const s = clamp(1 + (gy - gx) * (mask[i] ? kL : kS), .55, 1.35);
    rgba[4 * i] *= s; rgba[4 * i + 1] *= s; rgba[4 * i + 2] *= s;
  }
  TEX.t = t; TEX.w = tw; TEX.h = th; TEX.rgba = rgba; TEX.sea = sea; TEX.res = tw;
  TEX.cv.width = tw; TEX.cv.height = th; TEX.cv.getContext("2d").putImageData(new ImageData(rgba, tw, th), 0, 0);
}

// qualità: ridotta mentre si trascina o si anima, piena da fermi
let MOVING = false, moveTimer = 0, texTimer = 0;
function kick() { MOVING = true; clearTimeout(moveTimer); moveTimer = setTimeout(() => { MOVING = false; draw(); }, 180); }
const TEX_FULL = () => (window.innerWidth >= 1600 ? 2048 : 1024);
function ensureTex() {
  const t = state.t, busy = MOVING || state.playing || tdrag;
  if (TEX.t === t && (TEX.res >= TEX_FULL() || busy)) return;
  // mentre si anima o si trascina il cursore, la texture si ricalcola solo quando l'epoca cambia in modo visibile
  if (busy && TEX.rgba && Math.abs(t2p(TEX.t) - t2p(t)) < .0015) { clearTimeout(texTimer); texTimer = setTimeout(() => { if (!(state.playing || tdrag)) { buildTex(state.t, TEX_FULL()); draw(); } }, 220); return; }
  if (TEX.t !== t || !TEX.rgba) buildTex(t, busy ? 512 : TEX_FULL());
  if (TEX.res < TEX_FULL()) { clearTimeout(texTimer); texTimer = setTimeout(() => { if (!(state.playing || tdrag)) { buildTex(state.t, TEX_FULL()); draw(); } }, 220); }
}
// colore dell'atmosfera: arancione nell'Archeano, azzurro oggi, giallastro e poi rovente nel futuro lontano
function atmRGB(t) {
  if (t > 2400) return [235, 160, 90];
  const o = [150, 196, 240];
  if (t < 0) { const f = futClim(t); mixC(o, o, [236, 196, 128], smooth(20, 150, f.dT)); mixC(o, o, [255, 112, 52], smooth(500, 1400, f.dT)); }
  return o;
}
// raggio del Sole (raggi di oggi) nel futuro: Schröder & Smith 2008, MNRAS 386
const SUN_R = [[FUT_END, 256], [-7590, 256], [-7550, 100], [-7450, 20], [-7300, 5], [-7000, 2.3], [-5400, 1.6], [0, 1]];
function drawSun(t) {
  if (t > -5000) return;
  const R = interp(SUN_R, t), k = clamp01(Math.log(R / 1.4) / Math.log(256 / 1.4));
  const [cx, cy] = proj.translate(), sx = -W * .25, sy = cy - H * .15;
  const rad = 40 + (cx - sx + proj.scale() * 1.25) * Math.pow(k, 1.3);
  const g = ctx.createRadialGradient(sx, sy, rad * .2, sx, sy, rad);
  const core = k < .5 ? "255,214,120" : "255,120,60";
  g.addColorStop(0, `rgba(${core},${.55 + .4 * k})`); g.addColorStop(.75, `rgba(240,90,40,${.25 + .5 * k})`); g.addColorStop(1, "rgba(200,40,20,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
const PCV = document.createElement("canvas");
function renderOrtho(c) {
  const R = proj.scale(), [cx, cy] = proj.translate(), rot = proj.rotate(), lam = rot[0] * RAD, phi = rot[1] * RAD, cP = Math.cos(phi), sP = Math.sin(phi);
  const x0 = Math.max(0, Math.floor(cx - R)), x1 = Math.min(W, Math.ceil(cx + R)), y0 = Math.max(0, Math.floor(cy - R)), y1 = Math.min(H, Math.ceil(cy + R));
  if (x1 <= x0 || y1 <= y0) return;
  let s = MOVING || state.playing ? .6 : Math.min(dpr, 1.5);
  const budget = MOVING || state.playing ? 2.5e5 : 1.4e6, area = (x1 - x0) * (y1 - y0) * s * s;
  if (area > budget) s *= Math.sqrt(budget / area);
  const w = Math.max(1, Math.round((x1 - x0) * s)), h = Math.max(1, Math.round((y1 - y0) * s));
  PCV.width = w; PCV.height = h;
  const pc = PCV.getContext("2d"), img = pc.createImageData(w, h), out = img.data;
  const tw = TEX.w, th = TEX.h, src = TEX.rgba, sea = TEX.sea, bil = Z > 1.6 && !MOVING;
  const Lx = -.5, Ly = .55, Lz = .67, Hn = Math.hypot(Lx, Ly, Lz + 1), Hx = Lx / Hn, Hy = Ly / Hn, Hz = (Lz + 1) / Hn;
  const AC = atmRGB(state.t), inv2pi = 1 / (2 * Math.PI), invpi = 1 / Math.PI;
  let k = 0;
  for (let j = 0; j < h; j++) {
    const sy = (cy - (y0 + (j + .5) / s)) / R;
    for (let i = 0; i < w; i++, k += 4) {
      const sx = (x0 + (i + .5) / s - cx) / R, rr = sx * sx + sy * sy;
      if (rr >= 1) { out[k + 3] = 0; continue; }
      const d = Math.sqrt(1 - rr);
      const lon = Math.atan2(sx, d * cP + sy * sP) - lam, lat = Math.asin(sy * cP - d * sP);
      let u = (lon * inv2pi + .5) * tw; u = ((u % tw) + tw) % tw;
      const v = Math.min(th - 1.001, (.5 - lat * invpi) * th);
      let r, g, b, ti;
      if (bil) {
        const ux = Math.floor(u), vy = Math.floor(v), fu = u - ux, fv = v - vy, ux1 = (ux + 1) % tw, vy1 = Math.min(th - 1, vy + 1);
        const a = (vy * tw + ux) * 4, bb = (vy * tw + ux1) * 4, cc = (vy1 * tw + ux) * 4, dd = (vy1 * tw + ux1) * 4;
        const w0 = (1 - fu) * (1 - fv), w1 = fu * (1 - fv), w2 = (1 - fu) * fv, w3 = fu * fv;
        r = src[a] * w0 + src[bb] * w1 + src[cc] * w2 + src[dd] * w3; g = src[a + 1] * w0 + src[bb + 1] * w1 + src[cc + 1] * w2 + src[dd + 1] * w3; b = src[a + 2] * w0 + src[bb + 2] * w1 + src[cc + 2] * w2 + src[dd + 2] * w3;
        ti = vy * tw + ux;
      } else { ti = (v | 0) * tw + (u | 0); const a = ti * 4; r = src[a]; g = src[a + 1]; b = src[a + 2]; }
      const lm = sx * Lx + sy * Ly + d * Lz, dif = .5 + .62 * (lm > 0 ? lm : 0);
      r *= dif; g *= dif; b *= dif;
      if (sea[ti]) { const nh = sx * Hx + sy * Hy + d * Hz; if (nh > .95) { const sp = Math.pow(nh, 200) * 60; r += sp; g += sp; b += sp; } }
      const lim = Math.pow(1 - d, 2.4) * .65;
      out[k] = r + (AC[0] - r) * lim; out[k + 1] = g + (AC[1] - g) * lim; out[k + 2] = b + (AC[2] - b) * lim; out[k + 3] = 255;
    }
  }
  pc.putImageData(img, 0, 0);
  c.imageSmoothingEnabled = true; c.drawImage(PCV, x0, y0, x1 - x0, y1 - y0);
}
function renderFlat(c) {
  const k = proj.scale(), [tx, ty] = proj.translate(), lam = proj.rotate()[0] * RAD, wpx = 2 * Math.PI * k, hpx = Math.PI * k;
  let x0 = tx + (-Math.PI + lam) * k; x0 = x0 - Math.ceil((x0 - 0) / wpx) * wpx;
  c.save(); c.beginPath(); gp({type: "Sphere"}); c.clip(); c.imageSmoothingEnabled = true;
  for (let x = x0; x < W; x += wpx) c.drawImage(TEX.cv, x, ty - hpx / 2, wpx, hpx);
  c.restore();
}

let HITS = [];
function draw() {
  if (!proj || !D) return;
  const t = state.t, c = ctx, L = state.layers, GL = state.mode === "globe";
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
  HITS = [];
  const sph = {type: "Sphere"};
  ensureTex();
  if (GL) {
    const [cx, cy] = proj.translate(), R0 = proj.scale();
    drawSun(t);
    const ac = atmRGB(t), atm = t > 4400 ? "rgba(255,90,30,.42)" : t > 2400 ? "rgba(225,150,70,.42)" : `rgba(${ac.map(Math.round).join(",")},.5)`;
    const g = c.createRadialGradient(cx, cy, R0 * .97, cx, cy, R0 * 1.12);
    g.addColorStop(0, atm); g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R0 * 1.12, 0, 7); c.fill();
    renderOrtho(c);
    if (t < -7450) { c.fillStyle = `rgba(255,96,40,${.6 * smooth(-7450, -7590, t)})`; c.beginPath(); c.arc(cx, cy, R0, 0, 7); c.fill(); }
    drawMoon(t, cx, cy, R0);
  } else renderFlat(c);
  // reticolo ed equatore, discreti
  c.strokeStyle = "rgba(255,255,255,.09)"; c.lineWidth = .6; c.beginPath(); gp(GRAT); c.stroke();
  c.strokeStyle = "rgba(255,255,255,.35)"; c.setLineDash([4, 4]); c.beginPath(); gp(EQUATOR); c.stroke(); c.setLineDash([]);
  // posizioni schematiche prima di 1 miliardo di anni fa
  if ((t > TECT_MAX && t <= 4000) || (t < -FUT_TECT && t > -1300)) { c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = .8; c.setLineDash([3, 3]); c.beginPath(); gp(landAt(t).geo); c.stroke(); c.setLineDash([]); }
  if (L.today && (t > 0.02 || t < 0)) {
    c.strokeStyle = "#ffe08a"; c.lineWidth = 1; c.globalAlpha = .85; c.setLineDash([2, 3]);
    c.beginPath(); gp(TODAY); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
  }
  c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 1; c.beginPath(); gp(sph); c.stroke();

  if (state.sc) drawScenarioBelow(t);
  if (L.fossils) drawFossils(t);
  if (state.sc) drawScenarioAbove(t);
  if (L.events && !state.sc) drawEvents(t);
  if (L.taxa) drawTaxa(t);
  if (L.names) drawLabels(t);
  if (state.sel && state.sel.mark) drawSelMark(state.sel.mark);
}

function drawMoon(t, cx, cy, R0) {
  if (t < 2500 || t > 4510) return;
  const k = 1 + 2.4 * clamp01((t - 2500) / 2000) + 1.2 * clamp01((t - 1000) / 1500) * .3;
  const r = clamp(R0 * .06 * k, 10, 60);
  let x = cx + R0 * .78 + r * 1.2, y = cy - R0 * .78 - r * .2;
  x = Math.min(x, W - Math.max(r, 85) - 12); y = Math.max(y, (W < 600 ? 150 : 110) + r);
  const g = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r);
  g.addColorStop(0, COL.dark ? "#d7d4cc" : "#e9e6de"); g.addColorStop(1, COL.dark ? "#77736a" : "#a7a398");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.font = `12px ${getComputedStyle(document.body).fontFamily}`; ctx.fillStyle = COL.muted; ctx.textAlign = "center";
  ctx.fillText(t > 3000 ? "la Luna, molto più vicina" : "la Luna", x, y + r + 14);
}

function dot(x, y, r, fill, stroke) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = fill; ctx.fill();
  if (stroke) { ctx.lineWidth = 1; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function drawFossils(t) {
  const s = stageOf(t); if (s < 0) return;
  const k = Math.sqrt(Z), stroke = COL.dark ? "rgba(0,0,0,.45)" : "rgba(255,255,255,.75)";
  for (const g of GKEYS) {
    if (!state.groups[g]) continue;
    const arr = FIDX[g][s]; if (!arr) continue;
    const col = G(g).color;
    ctx.globalAlpha = state.sc ? .4 : .72;
    for (const e of arr) {
      const ce = FCELL[e[0]];
      const ll = paleo(ce.lon, ce.lat, t, cellFb(e[0])); if (!ll || !visible(ll[0], ll[1])) continue;
      const p = proj(ll); if (!p) continue;
      const r = (1.6 + 1.05 * Math.log2(1 + e[2])) * Math.min(1.6, .7 + k * .25);
      dot(p[0], p[1], r, col, stroke);
      HITS.push({x: p[0], y: p[1], r: r + 2, kind: "foss", g, e, s, pri: 1});
    }
    ctx.globalAlpha = 1;
  }
}
function emojiAt(x, y, em, size) {
  ctx.font = `${size}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(em, x, y + 1); ctx.textBaseline = "alphabetic";
}
function taxaAlive(t) { return TAXA_.filter(x => x.from >= t && x.to <= t); }
function drawTaxa(t) {
  const alive = taxaAlive(t), sz = clamp(14 + Z * 2, 16, 26);
  const seen = new Set();
  for (const x of alive) {
    const g = G(x.group);
    x.sitesP.forEach((s, i) => {
      if (i > 0 && !x.star && Z < 2) return;
      const ll = paleo(s.lon, s.lat, t); if (!ll || !visible(ll[0], ll[1])) return;
      const p = proj(ll); if (!p) return;
      const key = Math.round(p[0] / 6) + ":" + Math.round(p[1] / 6); let ox = 0;
      while (seen.has(key + ":" + ox)) ox++;
      seen.add(key + ":" + ox);
      const X = p[0] + ox * sz * .8, Y = p[1] - ox * 2;
      ctx.beginPath(); ctx.arc(X, Y, sz * .62, 0, 7); ctx.fillStyle = COL.panel; ctx.fill();
      ctx.lineWidth = 2.2; ctx.strokeStyle = g.color; ctx.stroke();
      emojiAt(X, Y, g.emoji, sz * .72);
      HITS.push({x: X, y: Y, r: sz * .7, kind: "taxon", x0: x, site: s, pri: 3});
    });
  }
}
const CATCOL = {geo: "#8d6e63", clima: "#4f8fc0", vita: "#2e9e6a", estinzione: "#c0392b", umani: "#d4882a", cosmo: "#6c5ce7"};
function eventsNear(t, pw) {
  const p = t2p(t);
  return EVENTS_.filter(e => {
    const a = t2p(e.t), b = e.t2 != null ? t2p(e.t2) : a;
    return p >= Math.min(a, b) - pw && p <= Math.max(a, b) + pw;
  });
}
function drawEvents(t) {
  for (const e of eventsNear(t, .008)) {
    if (e.lat == null || e.lon == null) continue;
   const ll = paleo(e.lon, e.lat, t); if (!ll || !visible(ll[0], ll[1])) continue;
    const p = proj(ll); if (!p) continue;
    const r = e.big ? 9 : 7, col = CATCOL[e.cat] || COL.accent;
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = col; ctx.strokeStyle = COL.panel; ctx.lineWidth = 2; ctx.fillRect(-r * .7, -r * .7, r * 1.4, r * 1.4); ctx.strokeRect(-r * .7, -r * .7, r * 1.4, r * 1.4);
    ctx.restore();
    HITS.push({x: p[0], y: p[1], r: r + 3, kind: "event", ev: e, pri: 2});
  }
}
function halo(txt, x, y, font, col) {
  ctx.font = font; ctx.textAlign = "center"; ctx.lineJoin = "round";
  ctx.strokeStyle = COL.halo; ctx.lineWidth = 4; ctx.strokeText(txt, x, y);
  ctx.fillStyle = col; ctx.fillText(txt, x, y);
}
function drawLabels(t) {
  if (t > TECT_MAX) return;
  const f = `italic 600 ${clamp(13 + Z * 1.5, 14, 22)}px Alegreya, Georgia, serif`;
  // nome del supercontinente del modello scelto, al centro dei blocchi riuniti
  const M = modelNow();
  if (M && t < -FUT_TECT && t > -1300 && smooth(FUT_TECT, -(M.t || -250), -t) > .6) {
    const ll = modelCenter(M);
    if (visible(ll[0], ll[1])) { const p = proj(ll); if (p) halo(M.name.toUpperCase().split("").join(" "), p[0], p[1], `italic 700 ${clamp(16 + Z * 2, 17, 28)}px Alegreya, Georgia, serif`, MOD_COL[M.id] || COL.ink); }
  }
  for (const l of PLAB) {
    if (t > l.from || (t < l.to && !(l.to === 0 && t > -FUT_TECT * 1.2))) continue;
   const ll = paleo(l.lon, l.lat, t); if (!ll || !visible(ll[0], ll[1])) continue;
    const p = proj(ll); if (!p) continue;
    halo(l.n.toUpperCase().split("").join(" "), p[0], p[1], f, COL.ink);
  }
}
function drawSelMark(m) {
  const ll = m.ll ? m.ll() : null; if (!ll || !visible(ll[0], ll[1])) return;
  const p = proj(ll); if (!p) return;
  ctx.beginPath(); ctx.arc(p[0], p[1], 20, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = COL.accent; ctx.stroke();
}

/* ---------- scenari sul globo ---------- */
const scVis = (o, t) => (o.from == null || t <= o.from + 1e-9) && (o.to == null || t >= o.to - 1e-9);
function blobsGeo(blobs) { return {type: "MultiPolygon", coordinates: blobs.map(([la, lo, km]) => d3.geoCircle().center([lo, la]).radius(km / 111.2).precision(4)().coordinates)}; }
function drawScenarioBelow(t) {
  const sc = state.sc;
  for (const a of sc.areas || []) {
    if (!scVis(a, t)) continue;
    if (!a._geo) a._geo = blobsGeo(a.blobs || []);
    ctx.globalAlpha = .28; ctx.fillStyle = a.color || COL.accent; ctx.beginPath(); gp(a._geo); ctx.fill();
    ctx.globalAlpha = .9; ctx.strokeStyle = a.color || COL.accent; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    // etichetta al centro della prima macchia
    const b = a.blobs && a.blobs[0];
    if (b && state.layers.names) { const ll = scPos(b[1], b[0], t); if (ll && visible(ll[0], ll[1])) { const p = proj(ll); if (p) halo(a.label, p[0], p[1], `600 13px ${getComputedStyle(document.body).fontFamily}`, a.color || COL.ink); } }
  }
}
function scPos(lon, lat, t) { return Math.abs(t) < 2 ? [lon, lat] : paleo(lon, lat, t); }
function drawScenarioAbove(t) {
  const sc = state.sc;
  for (const r of sc.routes || []) {
    if (r.from != null && t > r.from + 1e-9) continue;
    const u = r.from == null || r.to == null ? 1 : clamp01((r.from - t) / Math.max(1e-9, r.from - r.to));
    const pts = (r.pts || []).map(([la, lo]) => scPos(lo, la, t)).filter(Boolean); if (pts.length < 2) continue;
    // lunghezze cumulative
    const segs = []; let tot = 0;
    for (let i = 1; i < pts.length; i++) { const d = d3.geoDistance(pts[i - 1], pts[i]); segs.push(d); tot += d; }
    let rem = tot * u; const line = [pts[0]]; let tip = pts[0], prev = pts[0];
    for (let i = 1; i < pts.length; i++) {
      if (rem >= segs[i - 1]) { line.push(pts[i]); rem -= segs[i - 1]; prev = pts[i - 1]; tip = pts[i]; continue; }
      const f = segs[i - 1] ? rem / segs[i - 1] : 0; tip = d3.geoInterpolate(pts[i - 1], pts[i])(f); prev = pts[i - 1]; line.push(tip); break;
    }
    ctx.strokeStyle = COL.halo; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); gp({type: "LineString", coordinates: line}); ctx.stroke();
    ctx.strokeStyle = r.color || COL.accent; ctx.lineWidth = 3; ctx.beginPath(); gp({type: "LineString", coordinates: line}); ctx.stroke(); ctx.lineCap = "butt";
    if (u < 1 && u > 0 && visible(tip[0], tip[1])) {
      const p = proj(tip), q = proj(d3.geoInterpolate(prev, tip)(.9));
      if (p && q) { const a = Math.atan2(p[1] - q[1], p[0] - q[0]); ctx.fillStyle = r.color || COL.accent; ctx.beginPath(); ctx.moveTo(p[0] + Math.cos(a) * 9, p[1] + Math.sin(a) * 9); ctx.lineTo(p[0] + Math.cos(a + 2.5) * 8, p[1] + Math.sin(a + 2.5) * 8); ctx.lineTo(p[0] + Math.cos(a - 2.5) * 8, p[1] + Math.sin(a - 2.5) * 8); ctx.closePath(); ctx.fill(); }
    }
    if (state.layers.names && r.label && visible(tip[0], tip[1])) { const p = proj(tip); if (p) { ctx.textAlign = "left"; ctx.font = `600 12.5px ${getComputedStyle(document.body).fontFamily}`; ctx.strokeStyle = COL.halo; ctx.lineWidth = 4; ctx.strokeText(r.label, p[0] + 10, p[1] - 8); ctx.fillStyle = r.color || COL.ink; ctx.fillText(r.label, p[0] + 10, p[1] - 8); } }
    ctx.globalAlpha = 1;
  }
  const KC = {fossile: "#9d4edd", sito: "#e76f51", evento: "#2a9d8f", impatto: "#d62828", vulcano: "#f77f00"};
  for (const m of sc.markers || []) {
    if (!scVis(m, t)) continue;
    const ll = scPos(m.lon, m.lat, t); if (!ll || !visible(ll[0], ll[1])) continue;
    const p = proj(ll); if (!p) continue;
    const col = KC[m.kind] || COL.accent;
    dot(p[0], p[1], 7.5, col, COL.panel);
    ctx.beginPath(); ctx.arc(p[0], p[1], 2.5, 0, 7); ctx.fillStyle = COL.panel; ctx.fill();
    if (state.layers.names && Z > 1.4 && m.label) { ctx.textAlign = "left"; ctx.font = `600 12px ${getComputedStyle(document.body).fontFamily}`; ctx.strokeStyle = COL.halo; ctx.lineWidth = 3.5; ctx.strokeText(m.label, p[0] + 10, p[1] + 4); ctx.fillStyle = COL.ink; ctx.fillText(m.label, p[0] + 10, p[1] + 4); }
    HITS.push({x: p[0], y: p[1], r: 11, kind: "scm", m, pri: 3});
  }
}

/* ---------- interazione col globo ---------- */
const pointers = new Map(); let drag = null, pinch = null, moved = false;
cv.addEventListener("pointerdown", e => {
  cv.setPointerCapture(e.pointerId); pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
  moved = false; stopFly();
  if (pointers.size === 1) drag = {x: e.clientX, y: e.clientY, r: ROTV.slice(), py: PANY};
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = {d: Math.hypot(a.x - b.x, a.y - b.y), z: Z}; drag = null; }
});
cv.addEventListener("pointermove", e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (pinch && pointers.size === 2) {
    const [a, b] = [...pointers.values()]; setZoom(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d); moved = true; return;
  }
  if (drag) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 4) moved = true;
    if (!moved) return;
    cv.classList.add("dragging");
    const k = 57.3 / (BASE * Z);   // gradi per pixel
    if (state.mode === "globe") { ROTV = [drag.r[0] + dx * k, clamp(drag.r[1] - dy * k, -88, 88)]; }
    else { ROTV = [drag.r[0] + dx * 180 / (BASE * Z * Math.PI), 0]; PANY = drag.py + dy; }
    kick(); setProj(); draw(); hideTip(); return;
  }
  hover(e);
});
const endPtr = e => {
  pointers.delete(e.pointerId);
  if (pointers.size < 2) pinch = null;
  if (drag && !moved && e.type === "pointerup") pick(e);
  if (pointers.size === 0) { drag = null; cv.classList.remove("dragging"); }
};
cv.addEventListener("pointerup", endPtr); cv.addEventListener("pointercancel", endPtr);
cv.addEventListener("pointerleave", () => { hideTip(); });
cv.addEventListener("wheel", e => { e.preventDefault(); setZoom(Z * Math.exp(-e.deltaY * .0015)); }, {passive: false});
function setZoom(z) { Z = clamp(z, .8, 12); kick(); setProj(); draw(); }
$("zin").onclick = () => setZoom(Z * 1.5);
$("zout").onclick = () => setZoom(Z / 1.5);
$("zreset").onclick = () => { Z = 1; PANY = 0; setProj(); draw(); };
document.querySelectorAll(".viewtoggle button").forEach(b => b.onclick = () => {
  state.mode = b.dataset.mode; document.querySelectorAll(".viewtoggle button").forEach(x => x.setAttribute("aria-pressed", x === b));
  PANY = 0; setProj(); draw();
});
function hitAt(ev) {
  const r = cv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top;
  let best = null, bd = 1e9;
  for (const h of HITS) { const d = Math.hypot(h.x - x, h.y - y); if (d <= h.r + (ev.pointerType === "touch" ? 8 : 0)) { const s = d - h.pri * 4; if (s < bd) { bd = s; best = h; } } }
  return {h: best, x, y};
}
function hover(ev) {
  if (ev.pointerType === "touch") return;
  const {h, x, y} = hitAt(ev);
  cv.classList.toggle("hand", !!h);
  if (!h) { hideTip(); return; }
  let html = "";
  if (h.kind === "foss") { const g = G(h.g); html = `<b>${esc(g.emoji + " " + g.name)}</b><span>${h.e[2]} ritrovament${h.e[2] === 1 ? "o" : "i"} · ${esc(STG[h.s].name)}</span><span>${h.e.slice(3, 6).map(i => "<i>" + esc(F.names[i]) + "</i>").join(", ")}</span>`; }
  else if (h.kind === "taxon") html = `<b>${esc(h.x0.common || h.x0.name)}</b><span><i>${esc(h.x0.name)}</i></span><span>${esc(h.site.name || "")}</span>`;
  else if (h.kind === "event") html = `<b>${esc(h.ev.title)}</b><span>${esc(fmtRange(h.ev.t, h.ev.t2))}</span>`;
  else if (h.kind === "scm") html = `<b>${esc(h.m.label)}</b><span>${esc(firstSentence(h.m.text))}</span>`;
  const tip = $("tip"); tip.innerHTML = html; tip.hidden = false;
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  tip.style.left = clamp(x + 14, 4, W - tw - 4) + "px"; tip.style.top = clamp(y + 14, 4, H - th - 4) + "px";
}
function hideTip() { $("tip").hidden = true; }
function pick(ev) {
  const {h} = hitAt(ev); hideTip();
  if (!h) return;
  if (h.kind === "foss") showFossil(h.g, h.e, h.s);
  else if (h.kind === "taxon") showTaxon(h.x0, h.site);
  else if (h.kind === "event") showEvent(h.ev);
  else if (h.kind === "scm") showScMarker(h.m);
}

/* ---------- volo verso un punto ---------- */
let flyRaf = 0;
function stopFly() { if (flyRaf) cancelAnimationFrame(flyRaf); flyRaf = 0; }
function flyTo(lon, lat, zoom) {
  stopFly();
  const r0 = ROTV.slice(), z0 = Z, z1 = zoom != null ? clamp(zoom, .8, 12) : Math.max(Z, 1.6);
  let r1 = [-lon, state.mode === "globe" ? clamp(-lat, -80, 80) : 0];
  let dl = r1[0] - r0[0]; dl = ((dl + 540) % 360) - 180; r1[0] = r0[0] + dl;
  const t0 = performance.now(), dur = 900;
  const step = now => {
    const u = clamp01((now - t0) / dur), k = d3.easeCubicInOut(u);
    ROTV = [lerp(r0[0], r1[0], k), lerp(r0[1], r1[1], k)]; Z = lerp(z0, z1, k);
    if (state.mode !== "globe") PANY = lerp(PANY, 0, k);
    setProj(); draw();
    if (u < 1) flyRaf = requestAnimationFrame(step); else flyRaf = 0;
  };
  flyRaf = requestAnimationFrame(step);
}
function flyToPresent(lon, lat, zoom) {
  const ll = paleo(lon, lat, state.t) || [lon, lat];
  flyTo(ll[0], ll[1], zoom);
}

/* ---------- schede ---------- */
function openSel(html, mark) {
  const box = $("selBox"); box.innerHTML = `<div class="sel"><button class="x" aria-label="Chiudi la scheda">×</button>${html}</div>`;
  box.hidden = false; state.sel = {mark};
  box.querySelector(".x").onclick = closeSel;
  if (window.innerWidth <= 860) box.scrollIntoView({behavior: "smooth", block: "start"}); else $("panel").scrollTo({top: 0, behavior: "smooth"});
  draw();
}
function closeSel() { $("selBox").hidden = true; $("selBox").innerHTML = ""; state.sel = null; draw(); }
function imgBlock(id) { return `<div class="img" id="${id}"><div class="wait">Cerco un'immagine…</div></div>`; }
function fillImg(id, w, alt) {
  const el = document.getElementById(id); if (!el) return;
  if (!w || !w.img) { el.remove(); return; }
  el.innerHTML = `<img src="${esc(w.img)}" alt="${esc(alt || w.title)}" loading="lazy"><div class="credit">Immagine: <a href="${esc(w.url)}" target="_blank" rel="noopener">Wikipedia${w.lang === "en" ? " (inglese)" : ""}</a> · Wikimedia Commons</div>`;
  const im = el.querySelector("img");
  im.onerror = () => { if (w.thumb && im.src !== w.thumb) im.src = w.thumb; else el.remove(); };
}
function linksHtml(o) {
  const L = [];
  if (o.wiki) L.push(`<a href="${wpLink(o.wiki, "it")}" target="_blank" rel="noopener">📖 Wikipedia</a>`);
  else if (o.wikiEn) L.push(`<a href="${wpLink(o.wikiEn, "en")}" target="_blank" rel="noopener">📖 Wikipedia (inglese)</a>`);
  if (o.ozName) L.push(`<a href="${ozLink(o.ozName, o.ott)}" target="_blank" rel="noopener">🌳 OneZoom</a>`);
  if (o.ott) L.push(`<a href="${otLink(o.ott)}" target="_blank" rel="noopener">🌲 Open Tree of Life</a>`);
  if (o.pbdb) L.push(`<a href="${pbdbLink(o.pbdb)}" target="_blank" rel="noopener">🦴 Paleobiology DB</a>`);
  return L.length ? `<div class="links">${L.join("")}</div>` : "";
}
// futuro: quanto è sicura la previsione, legame con l'oggi (accordi, leggi, missioni), curiosità, fonti
const CERT = {alta: ["Previsione solida", "#2e9e6a", "si basa su leggi fisiche o misure ben note"], media: ["Previsione probabile", "#b8901c", "molti studi sono d'accordo, ma i tempi sono incerti"], bassa: ["Previsione incerta", "#d4682a", "dipende da modelli diversi tra loro"], ipotesi: ["Ipotesi", "#9d4edd", "possibile ma non prevedibile: un esempio di ciò che potrebbe accadere"]};
function certHtml(o) { const c = o && CERT[o.certezza]; return c ? `<div class="cert" style="--cc:${c[1]}" title="${esc(c[2])}"><b>${esc(c[0])}</b><span>${esc(c[2])}</span></div>` : ""; }
function futExtras(o) {
  let h = "";
  if (o.oggi) h += `<div class="oggi"><b>📜 Oggi</b><p>${esc(o.oggi)}</p></div>`;
  if (o.curiosita) h += `<div class="curio"><b>💡 Lo sapevi?</b><p>${esc(o.curiosita)}</p></div>`;
  const f = Array.isArray(o.fonti) ? o.fonti : o.fonti ? [o.fonti] : [];
  if (f.length) h += `<details class="fonti"><summary>Fonti scientifiche</summary><ul>${f.map(s => `<li>${esc(s)}</li>`).join("")}</ul></details>`;
  return h;
}
// immagine di Wikimedia Commons scelta a mano (foto, mappa o ricostruzione), con autore e licenza
function cimg(o) {
  if (!o || !o.file) return "";
  const name = String(o.file).replace(/^File:/i, "");
  if (window.Cerca && window.Cerca.badImg(name)) return "";
  const src = "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(name) + "?width=500", page = "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(name.replace(/ /g, "_"));
  return `<figure class="cimg"><a href="${page}" target="_blank" rel="noopener"><img src="${src}" alt="${esc(o.cap || "")}" loading="lazy" onerror="this.closest('figure').remove()"></a><figcaption>${o.tipo === "ricostruzione" ? "<b>Ricostruzione</b> · " : o.tipo === "mappa" ? "<b>Mappa</b> · " : ""}${esc(o.cap || "")}<span>${esc([o.author, o.lic].filter(Boolean).join(" · "))} · Wikimedia Commons</span></figcaption></figure>`;
}
// modelli del prossimo supercontinente: scelta e scheda
function modButtons() { return MODELLI.map(m => `<button data-mod="${esc(m.id)}" style="--cc:${MOD_COL[m.id] || "#7b6cd9"}" aria-pressed="${state.model === m.id}">${esc(m.name)}</button>`).join(""); }
function bindModButtons(el) { el.querySelectorAll("[data-mod]").forEach(b => b.onclick = () => setModel(b.dataset.mod)); }
function modCard(M) {
  if (!M) return "";
  const sc = (FUT && FUT.supercontinenti || []).find(s => s.id === M.id || s.name === M.name) || {}, wiki = M.wiki || sc.wiki, wikiEn = M.wikiEn || sc.wikiEn;
  return `<div class="modcard" style="--cc:${MOD_COL[M.id] || "#7b6cd9"}"><b>${esc(M.name)}</b> <span class="note">${esc([M.author, M.year].filter(Boolean).join(" "))}${M.t ? " · fra circa " + nfi(-M.t) + " milioni di anni" : ""}</span>
    ${cimg(M.img)}${M.meccanismo ? `<p><b>Come si forma:</b> ${esc(M.meccanismo)}</p>` : ""}<p>${esc(M.text || "")}</p>
    ${M.differenze ? `<p><b>Che cosa cambia rispetto agli altri:</b> ${esc(M.differenze)}</p>` : ""}${futExtras({fonti: M.fonti})}${linksHtml({wiki, wikiEn})}</div>`;
}
function setModel(id) {
  if (!MODELLI.some(m => m.id === id) || state.model === id) return;
  state.model = id; LAND_T = NaN; LAND = null; TEX.t = NaN; QB.clear();
  const md = $("modSel"); if (md) { md.innerHTML = modButtons(); bindModButtons(md); }
  updateHead(); draw(); schedulePanel();
  // si va a guardare il supercontinente (le tappe delle visite scelgono poi la loro inquadratura)
  if (state.t < -FUT_TECT && !state.sc) { const c = modelCenter(modelNow()); if (c) flyTo(c[0], Math.max(-60, Math.min(60, c[1])), Z); }
}
function modelCenter(M) {
  if (!M) return null;
  const s = [0, 0, 0]; Object.values(M.blocks).forEach(b => { const v = vecOf(b[1], b[0]); s[0] += v[0]; s[1] += v[1]; s[2] += v[2]; });
  return toLL(s.map(v => v / Math.hypot(...s)));
}
function showTaxon(x, site) {
  const g = G(x.group), s = site || x.sitesP[0];
  const facts = [["Quando", fmtRange(x.from, x.to)]];
  if (x.fut && x.base) facts.push(["Da chi deriva", x.base]);
  if (x.size) facts.push(["Dimensioni", x.size]);
  if (x.diet) facts.push(["Alimentazione", x.diet]);
  if (x.habitat) facts.push(["Ambiente", x.habitat]);
  const sites = x.sitesP.map((p, i) => `<li><button data-site="${i}">📍 ${esc(p.name || (p.lat + ", " + p.lon))}</button></li>`).join("");
  const id = "img" + Math.random().toString(36).slice(2);
  const oz = x.fut ? (x.baseName || null) : x.name;
  openSel(`<div class="eyebrow"><i class="cdot" style="background:${g.color}"></i>${esc(g.name)}${x.fut ? (x.ipotesi ? " · futuro ipotetico" : " · nel futuro") : ""}</div>
    <h3>${esc(x.common || x.name)}</h3><div class="sci">${x.fut && x.baseName ? `${x.ipotesi ? "discendente ipotetico di" : ""} <i>${esc(x.baseName)}</i>` : esc(x.name)}</div>
    ${x.fut && x.ipotesi ? certHtml({certezza: "ipotesi"}) : ""}
    ${imgBlock(id)}${x.fut && x.ipotesi ? `<div class="note" style="margin:-4px 0 6px">L'immagine mostra l'antenato di oggi, non l'organismo del futuro.</div>` : ""}
    <dl class="facts">${facts.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl>
    <p>${esc(x.text || "")}</p>
    ${x.fut ? futExtras(x) : window.Cerca ? window.Cerca.reconHtml(x.name) : ""}
    ${sites ? `<div class="note" style="margin-top:10px">${x.fut ? "Dove potrebbe vivere (posizioni di oggi; clicca per andarci):" : "Dove sono stati trovati i fossili (clicca per andarci):"}</div><ul class="sites">${sites}</ul>` : ""}
    ${linksHtml({wiki: x.wiki, wikiEn: x.wikiEn, ozName: oz, ott: x.fut ? null : x.ott, pbdb: x.fut ? null : x.name})}
    ${x.from >= state.t && x.to <= state.t ? "" : `<div class="links"><button id="goWhen">⏱ Vai a quando viveva</button></div>`}`,
    s ? {ll: () => paleo(s.lon, s.lat, state.t)} : null);
  $("selBox").querySelectorAll("[data-site]").forEach(b => b.onclick = () => { const p = x.sitesP[+b.dataset.site]; state.sel.mark = {ll: () => paleo(p.lon, p.lat, state.t)}; flyToPresent(p.lon, p.lat, Math.max(Z, 2.2)); });
  if (window.Cerca) window.Cerca.bindRecon($("selBox"));
  const gw = $("goWhen"); if (gw) gw.onclick = () => { if (state.sc && ((x.from + x.to) / 2 > state.sc.from || (x.from + x.to) / 2 < state.sc.to)) exitScenario(); setTime((x.from + x.to) / 2); showTaxon(x, s); };
  if (s) flyToPresent(s.lon, s.lat, Math.max(Z, 1.8));
  wikiBest(x.wiki, x.wikiEn, x.fut ? x.baseName : x.name).then(w => fillImg(id, w, x.common || x.name));
}
function showFossil(gk, e, s) {
  const g = G(gk), st = STG[s], ce = FCELL[e[0]];
  const names = e.slice(3).map(i => F.names[i]);
  const id = "img" + Math.random().toString(36).slice(2);
  const genus = names.length ? names[0].split(" ")[0] : null;
  openSel(`<div class="eyebrow"><i class="cdot" style="background:${g.color}"></i>${esc(g.emoji + " " + g.name)} · fossili</div>
    <h3>${e[2]} ritrovament${e[2] === 1 ? "o" : "i"} fossil${e[2] === 1 ? "e" : "i"}</h3>
    <div class="sci" style="font-style:normal">${esc(st.name)} · ${esc(fmtRange(st.from, st.to))}</div>
    ${names.length ? `<p>I generi più citati in questa zona (con una specie di esempio):</p><ul class="gen">${names.map(n => `<li><i>${esc(n)}</i><span><a href="${wpSearch(n.split(" ")[0], "it")}" target="_blank" rel="noopener">Wikipedia</a><a href="${pbdbLink(n.split(" ")[0])}" target="_blank" rel="noopener">PBDB</a></span></li>`).join("")}</ul>` : `<p>I resti non sono stati attribuiti a un genere preciso.</p>`}
    ${genus ? imgBlock(id) : ""}
    <p class="note">Posizione attuale del luogo: ${nf(Math.abs(ce.lat), 1)}° ${ce.lat >= 0 ? "N" : "S"}, ${nf(Math.abs(ce.lon), 1)}° ${ce.lon >= 0 ? "E" : "O"}. Dati: Paleobiology Database, celle di 2°.</p>
    ${g.text ? `<p>${esc(g.text)}</p>` : ""}
    ${linksHtml({wiki: g.wiki, wikiEn: g.wikiEn, ozName: g.wikiEn || g.name, ott: g.ott})}`,
    {ll: () => paleo(ce.lon, ce.lat, state.t, cellFb(e[0]))});
  if (genus) wikiBest(null, genus).then(async w => { if (!w || !w.img) w = await wikiSum(genus, "it"); fillImg(id, w, genus); });
}
function showEvent(ev) {
  const id = "img" + Math.random().toString(36).slice(2), col = CATCOL[ev.cat] || COL.accent;
  const CN = {geo: "Geologia", clima: "Clima", vita: "Vita", estinzione: "Estinzione", umani: "Esseri umani", cosmo: "Spazio e Sole"};
  openSel(`<div class="eyebrow"><i class="cdot" style="background:${col}"></i>${esc(CN[ev.cat] || "Evento")} · ${esc(fmtRange(ev.t, ev.t2))}</div>
    <h3>${esc(ev.title)}</h3>${certHtml(ev)}${ev.img ? cimg(ev.img) : imgBlock(id)}<p>${esc(ev.text || "")}</p>
    ${futExtras(ev)}
    ${linksHtml({wiki: ev.wiki, wikiEn: ev.wikiEn})}
    ${Math.abs(t2p(ev.t) - t2p(state.t)) > .002 ? `<div class="links"><button id="goWhen">⏱ Vai a questo momento</button></div>` : ""}`,
    ev.lat != null ? {ll: () => paleo(ev.lon, ev.lat, state.t)} : null);
  const gw = $("goWhen"); if (gw) gw.onclick = () => setTime(ev.t);
  if (ev.lat != null) flyToPresent(ev.lon, ev.lat, Math.max(Z, 1.6));
  if (!ev.img) wikiBest(ev.wiki, ev.wikiEn).then(w => fillImg(id, w, ev.title));
}
function showScMarker(m) {
  const x = m.taxon ? TAXA_.find(z => z.id === m.taxon) : null;
  if (x) { showTaxon(x); return; }
  const id = "img" + Math.random().toString(36).slice(2);
  openSel(`<div class="eyebrow">${esc(state.sc ? state.sc.title : "")}</div><h3>${esc(m.label)}</h3>${certHtml(m)}${m.img ? cimg(m.img) : m.wiki || m.wikiEn ? imgBlock(id) : ""}<p>${esc(m.text || "")}</p>${futExtras(m)}${linksHtml({wiki: m.wiki, wikiEn: m.wikiEn})}`, {ll: () => scPos(m.lon, m.lat, state.t)});
  if (!m.img && (m.wiki || m.wikiEn)) wikiBest(m.wiki, m.wikiEn).then(w => fillImg(id, w, m.label));
}

/* ---------- pannello ---------- */
function unitAt(t, level) { return ERAS_.filter(u => u.level === level && t <= u.from + 1e-9 && t >= u.to - 1e-9).sort((a, b) => (a.from - a.to) - (b.from - b.to))[0]; }
function chainAt(t) { return ["eone", "era", "periodo", "epoca"].map(l => unitAt(t, l)).filter(Boolean); }
function supercontinent(t) {
  if (t < 0) {
    if (t > -0.02) return "Continenti come oggi (si spostano di pochi centimetri all'anno).";
    if (t > -FUT_TECT) return "I continenti proseguono i moti di oggi: l'Atlantico si allarga, l'Africa spinge contro l'Europa e chiude il Mediterraneo, l'Australia sale verso il Sud-Est asiatico.";
    if (t > -1300) return `Posizioni schematiche (quelle fra ${FUT_TECT} milioni di anni, tratteggiate). Fra 200 e 300 milioni di anni i continenti potrebbero riunirsi in un nuovo supercontinente, ma i modelli non sono d'accordo su quale.`;
    return "Nessuna previsione possibile: senza oceani la tettonica delle placche potrebbe rallentare fino a fermarsi.";
  }
  if (t > 4400) return "Nessun continente: la superficie è fusa o appena solidificata.";
  if (t > 4000) return "Una crosta primitiva, forse con piccoli frammenti di tipo continentale, in un oceano globale.";
  if (t > 2500) return "Piccoli nuclei di crosta continentale (cratoni) in un oceano globale.";
  if (t > 1800 && t <= 2100) return "Si sta formando il supercontinente Columbia (Nuna).";
  if (t > 1300 && t <= 1800) return "Supercontinente Columbia (Nuna), poi frammentato.";
  if (t > TECT_MAX) return "Continenti in movimento: posizioni molto incerte.";
  if (t > 750) return "Supercontinente Rodinia.";
  if (t > 600) return "Rodinia si spezza; si apre l'oceano Paleo-Pacifico (il Giapeto si aprirà più tardi, tra circa 600 e 550 milioni di anni fa).";
  if (t > 336) return "Gondwana a sud e continenti minori (Laurentia, Baltica, Siberia).";
  if (t > 175) return "Supercontinente Pangea, circondato dall'oceano Panthalassa.";
  if (t > 100) return "La Pangea si divide in Laurasia e Gondwana; nasce l'Atlantico.";
  if (t > 34) return "I continenti si avvicinano alle posizioni attuali; l'India corre verso l'Asia.";
  return "Continenti quasi come oggi.";
}
let panelT = NaN, panelRaf = 0;
function schedulePanel() { if (!panelRaf) panelRaf = requestAnimationFrame(() => { panelRaf = 0; updatePanel(); }); }
let taxaAll = false;
function updatePanel() {
  const t = state.t; panelT = t;
  const ch = chainAt(t), last = ch[ch.length - 1];
  const cl = climate(t);
  const day = interp(DAY, t), o2 = interp(O2, t), fc = cl.fut;
  const sgn = v => (v > 0 ? "+" : v < 0 ? "−" : "") + nf(Math.abs(v), Math.abs(v) < 10 && v % 1 ? 1 : 0);
  const life = !fc ? "" : fc.life != null && fc.life < .02 ? "nessuna forma di vita conosciuta potrebbe sopravvivere" : fc.animals != null && fc.animals < .05 ? "restano solo microbi, in rifugi sempre più piccoli" : fc.plants != null && fc.plants < .1 ? "senza piante: gli animali sono in declino" : fc.plants != null && fc.plants < .8 ? "piante in declino per la scarsità di CO₂" : "piante e animali, molto diversi da quelli di oggi";
  const SC = FUT && FUT.supercontinenti && t < -150 && t > -500 ? FUT.supercontinenti : null;
  $("whenBox").innerHTML = `<h2>Quando</h2>
    <div class="chain">${ch.map(u => `<span style="background:${u.color}" title="${esc(fmtRange(u.from, u.to))}">${esc(u.name)}</span>`).join("")}</div>
    <h3>${esc(last ? last.name : "")}${last ? ` <small style="font-family:var(--f-body);font-size:14px;color:var(--muted);font-weight:400">${esc(fmtRange(last.from, last.to))}</small>` : ""}</h3>
    ${last && last.text ? `<p>${esc(last.text)}</p>` : ""}
    ${fc ? `<p class="note futnote">🔭 <b>Futuro possibile.</b> Una ricostruzione basata sugli studi scientifici di oggi, non una profezia: più ci si allontana, più le previsioni sono incerte. Il futuro vicino degli esseri umani è in <a href="sapiens.html?t=-0.000074">«Sapiens in Tempore»</a>.</p>${FUT && FUT.scenari && FUT.scenari.length && !state.sc ? `<div class="links">${FUT.scenari.map((s, i) => `<button data-fsc="${i}" class="pri">▶ ${esc(s.title)}</button>`).join("")}</div>` : ""}` : ""}
    <dl class="facts box">
      <dt>Continenti</dt><dd>${esc(supercontinent(t))}</dd>
      ${cl.note ? `<dt>Clima</dt><dd>${esc(cl.note)}</dd>` : ""}
      ${fc && fc.dT != null ? `<dt>Temperatura media</dt><dd>${Math.abs(fc.dT) < .3 ? "come oggi" : "circa " + sgn(fc.dT) + " °C rispetto a oggi"}</dd>` : ""}
      ${fc && fc.sea != null && (fc.ocean == null || fc.ocean > .97) ? `<dt>Livello del mare</dt><dd>${Math.abs(fc.sea) < .5 ? "come oggi" : "circa " + sgn(fc.sea) + " m rispetto a oggi"}</dd>` : ""}
      ${fc && fc.ocean != null && fc.ocean <= .97 ? `<dt>Oceani</dt><dd>${fc.ocean < .01 ? "evaporati: non resta acqua liquida" : "ne resta circa il " + nfi(fc.ocean * 100) + "%"}</dd>` : ""}
      ${fc && fc.co2 != null ? `<dt>CO₂ nell'aria</dt><dd>circa ${nfi(fc.co2)} ppm (oggi circa 425)</dd>` : ""}
      ${fc && fc.lum != null ? `<dt>Il Sole</dt><dd>${Math.abs(fc.lum - 1) < .005 ? "come oggi" : fc.lum < 3 ? "circa il " + nfi((fc.lum - 1) * 100) + "% più luminoso di oggi" : "circa " + nfi(fc.lum) + " volte più luminoso di oggi"}</dd>` : ""}
      ${life ? `<dt>Vita</dt><dd>${esc(life)}</dd>` : ""}
      <dt>Ossigeno nell'aria</dt><dd>${o2 < .01 ? "quasi assente" : "circa " + nf(o2, o2 < 3 ? 1 : 0) + "% (oggi 21%)"}</dd>
      <dt>Durata del giorno</dt><dd>circa ${nf(day, day < 20 ? 0 : 1)} ore</dd>
    </dl>
    ${MODELLI.length && t < -FUT_TECT && t > -1300 ? `<div class="note" style="margin-top:10px">🌐 Il prossimo supercontinente: ${MODELLI.length} ipotesi. Scegline una per vederla sul globo (le posizioni sono schematiche, ricavate dalle mappe pubblicate).</div>
      <div class="futsel inpanel" role="group" aria-label="Modello del supercontinente">${modButtons()}</div>${modCard(modelNow())}` :
    SC ? `<div class="note" style="margin-top:10px">Quattro modelli del prossimo supercontinente:</div><ul class="gen">${SC.map(s => `<li><span><b>${esc(s.name)}</b> · ${esc(s.author || "")}${s.year ? " " + s.year : ""}<br><span style="color:var(--muted);font-size:13px">${esc(s.text || "")}</span></span><span>${s.wiki ? `<a href="${wpLink(s.wiki, "it")}" target="_blank" rel="noopener">Wikipedia</a>` : s.wikiEn ? `<a href="${wpLink(s.wikiEn, "en")}" target="_blank" rel="noopener">Wikipedia</a>` : ""}</span></li>`).join("")}</ul>` : ""}`;
  bindModButtons($("whenBox"));
  $("whenBox").querySelectorAll("[data-fsc]").forEach(b => b.onclick = () => enterScenario(FUT.scenari[+b.dataset.fsc]));
  // eventi vicini
  const pool = state.sc ? (state.sc.steps || []).map((s, i) => ({t: s.t, title: s.title, text: s.text, step: i})) : EVENTS_;
  const p = t2p(t);
  const near = pool.map(e => ({e, d: Math.abs(t2p(e.t) - p) - (e.big ? .004 : 0)})).sort((a, b) => a.d - b.d).slice(0, 6).map(o => o.e).sort((a, b) => b.t - a.t);
  $("evList").innerHTML = near.map((e, i) => `<li><button data-i="${i}"><span class="y">${esc(fmtAge(e.t, "short"))}</span><span><span class="t">${e.cat ? `<i class="cdot" style="background:${CATCOL[e.cat] || COL.accent}"></i>` : ""}${esc(e.title)}</span><span class="d">${esc(firstSentence(e.text))}</span></span></button></li>`).join("");
  $("evList").querySelectorAll("button").forEach(b => b.onclick = () => { const e = near[+b.dataset.i]; if (e.step != null) goStep(e.step); else { setTime(e.t); showEvent(e); } });
  // protagonisti
  const alive = taxaAlive(t).sort((a, b) => (b.star ? 1 : 0) - (a.star ? 1 : 0) || (a.from - a.to) - (b.from - b.to));
  const lim = taxaAll ? alive.length : (window.innerWidth > 1600 ? 16 : 12);
  $("taxaList").innerHTML = alive.slice(0, lim).map((x, i) => { const g = G(x.group); return `<button data-i="${i}" title="${esc(x.name)}"><span class="em" style="background:${g.color}33">${g.emoji}</span><span class="nm"><b>${esc(x.common || x.name)}</b><i>${esc(x.name)}</i></span></button>`; }).join("");
  $("taxaList").querySelectorAll("button").forEach(b => b.onclick = () => showTaxon(alive[+b.dataset.i]));
  const mb = $("taxaMore"); mb.hidden = alive.length <= 12; mb.textContent = taxaAll ? "Mostra meno" : `Mostra tutti (${alive.length})`;
  mb.onclick = () => { taxaAll = !taxaAll; updatePanel(); };
  $("taxaNote").textContent = alive.length ? (t < 0 ? "Organismi possibili del futuro: alcuni sono specie di oggi destinate a resistere a lungo, altri sono ipotesi basate sull'evoluzione. Clicca per la scheda." : "Clicca un organismo per la scheda, le immagini e i collegamenti all'albero della vita.") :
    t < 0 ? (fc && fc.life != null && fc.life < .02 ? "Nessuna forma di vita: la Terra è diventata sterile." : "Nessun organismo previsto per questo momento.") :
    t > 3500 ? "Non ci sono ancora tracce sicure di vita." : t > 541 ? "La vita è fatta soprattutto di microbi: i fossili sono rari e microscopici." : "Nessun protagonista scelto per questo momento: guarda i fossili sul globo.";
  // gruppi di fossili
  const s = stageOf(t);
  $("stageNote").textContent = s >= 0 ? `Piano geologico: ${STG[s].name} (${fmtRange(STG[s].from, STG[s].to)}). Ogni pallino riunisce i ritrovamenti di una zona di circa 200 km.` : t < 0 ? "Il futuro non ha ancora fossili: forse, fra milioni di anni, saranno i nostri resti e quelli degli animali di oggi." : "In quest'epoca non ci sono fossili di animali o piante: solo tracce di microbi.";
  $("grpList").innerHTML = GKEYS.map(k => {
    const g = G(k), arr = s >= 0 && FIDX[k][s] ? FIDX[k][s] : [], n = arr.reduce((a, e) => a + e[2], 0);
    return `<label class="${n ? "" : "empty"}" title="${esc(g.text)}"><input type="checkbox" data-g="${k}" ${state.groups[k] ? "checked" : ""}><span>${g.emoji}</span><span><i class="cdot" style="background:${g.color}"></i>${esc(g.name)}</span><span class="n">${n ? nfi(n) : "—"}</span></label>`;
  }).join("");
  $("grpList").querySelectorAll("input").forEach(i => i.onchange = () => { state.groups[i.dataset.g] = i.checked; draw(); });
}
function firstSentence(s) { if (!s) return ""; const m = String(s).match(/^.{20,160}?[.!?](\s|$)/); return m ? m[0].trim() : String(s).slice(0, 140) + (String(s).length > 140 ? "…" : ""); }
$("grpAll").onclick = () => { GKEYS.forEach(k => state.groups[k] = true); updatePanel(); draw(); };
$("grpNone").onclick = () => { GKEYS.forEach(k => state.groups[k] = false); updatePanel(); draw(); };

function legend() {
  const sw = h => `<svg width="30" height="18" viewBox="0 0 30 18" aria-hidden="true">${h}</svg>`;
  $("legend").innerHTML = [
    [sw(`<circle cx="15" cy="9" r="7" fill="var(--panel)" stroke="#d62828" stroke-width="2"/><text x="15" y="13" font-size="9" text-anchor="middle">🦖</text>`), "Protagonista: un organismo famoso, nel luogo dei suoi fossili"],
    [sw(`<circle cx="9" cy="9" r="3" fill="#2a9d8f"/><circle cx="20" cy="9" r="6" fill="#d62828"/>`), "Fossili di un gruppo (più grande = più ritrovamenti)"],
    [sw(`<rect x="10" y="4" width="10" height="10" transform="rotate(45 15 9)" fill="#c0392b"/>`), "Evento geologico, climatico o biologico"],
    [sw(`<rect x="1" y="3" width="28" height="12" rx="2" fill="#9ebf86"/><rect x="1" y="3" width="28" height="5" rx="2" fill="#dcc795"/>`), "Terre emerse: verdi dove c'erano piante, ocra nelle fasce aride"],
    [sw(`<rect x="1" y="3" width="28" height="12" rx="2" fill="#fbfdff" stroke="#9fbfd3"/>`), "Ghiacci (calotte polari, Terra a palla di neve)"],
    [sw(`<path d="M2 9h26" stroke="var(--accent)" stroke-dasharray="2 3" stroke-width="2"/>`), "Coste di oggi (livello «Coste di oggi»)"],
    [sw(`<path d="M2 9h26" stroke="var(--muted)" stroke-dasharray="4 4"/>`), "Equatore"]
  ].map(([s, t]) => `<div>${s}<span>${t}</span></div>`).join("");
}

/* ---------- linea del tempo ---------- */
const track = $("track"), thumb = $("thumb");
function buildTrack() {
  const sc = state.sc;
  const dom = TL.domain(), d0 = dom[0], d1 = dom[dom.length - 1];
  const inDom = u => u.from > d1 && u.to < d0;
  const seg = u => { const a = t2p(Math.min(u.from, d0)), b = t2p(Math.max(u.to, d1)); return [a, b]; };
  const row = (list, el) => {
    el.innerHTML = list.filter(inDom).map(u => { const [a, b] = seg(u); return `<div style="left:${a * 100}%;width:${(b - a) * 100}%;background:${u.color}" title="${esc(u.name + " · " + fmtRange(u.from, u.to))}">${(b - a) > .05 ? esc(u.name) : (b - a) > .025 ? esc(u.name.slice(0, 3)) + "." : ""}</div>`; }).join("");
  };
  let L1, L2;
  if (!sc) {
    L1 = ERAS_.filter(u => (u.level === "eone" && u.name !== "Fanerozoico") || (u.level === "era" && u.to < 541.1));
    L2 = ERAS_.filter(u => u.level === "periodo" || (u.level === "era" && u.from > 541.1 && !ERAS_.some(p => p.level === "periodo" && p.from <= u.from && p.to >= u.to)));
  } else {
    const span = sc.from - sc.to;
    const lv = span > 150 ? ["era", "periodo"] : span > 8 ? ["periodo", "epoca"] : ["epoca", "epoca"];
    L1 = ERAS_.filter(u => u.level === lv[0]); L2 = ERAS_.filter(u => u.level === lv[1]);
    if (span <= 8) { L1 = ERAS_.filter(u => u.level === "periodo"); L2 = ERAS_.filter(u => u.level === "epoca"); }
    if (sc.to < 0) { L1 = ERAS_.filter(u => u.fut && u.level === "eone"); L2 = ERAS_.filter(u => u.fut && u.level === "periodo"); }
  }
  row(L1, $("band1")); row(L2, $("band2"));
  // puntini: eventi principali o tappe dello scenario
  if (!sc) $("evdots").innerHTML = EVENTS_.filter(e => e.big).map(e => `<div class="evdot" style="left:${t2p(e.t) * 100}%;background:${CATCOL[e.cat] || "#888"}" title="${esc(e.title)}"></div>`).join("");
  else $("evdots").innerHTML = (sc.steps || []).map((s, i) => `<div class="stepdot${i === state.step ? " cur" : ""}" data-step="${i}" style="left:${t2p(s.t) * 100}%" title="${esc(s.title)}"></div>`).join("");
  $("evdots").querySelectorAll("[data-step]").forEach(d => d.addEventListener("pointerdown", e => { e.stopPropagation(); goStep(+d.dataset.step); }));
  // tacche
  let ticks;
  if (!sc) ticks = [[4567, "4,57 Ga", 1], [4000, "4 Ga"], [3000, "3 Ga"], [2500, "2,5 Ga"], [2000, "2 Ga"], [1000, "1 Ga", 2], [541, "541 Ma"], [444, "444"], [359, "359"], [252, "252 Ma", 1], [201, "201"], [145, "145"], [66, "66 Ma", 1], [23, "23"], [2.58, "2,6 Ma"], [0.3, "300 ka"], [0, "oggi", 1], [-10, "+10 Ma"], [-1000, "+1 Ga", 2], [FUT_END, "+7,6 Ga", 2]];
  else {
    const n = 6; ticks = d3.range(n + 1).map(i => { const tt = sc.dom ? p2t(i / n) : sc.from - (sc.from - sc.to) * i / n; return [tt, fmtUnit(tt, sc.unit), i === 0 || i === n || i === n / 2 ? 1 : 0]; });
  }
  // zona del futuro sulla linea del tempo
  const pf = sc ? (sc.to < 0 ? clamp01(t2p(0)) : null) : P_NOW;
  $("futZone").hidden = pf == null || pf >= 1; if (pf != null) $("futZone").style.left = pf * 100 + "%";
  // tacche «2»: chiave solo se la linea è larga (sul telefono si sovrapporrebbero)
  const wide = track.getBoundingClientRect().width >= 760;
  ticks = ticks.map(([tt, lab, key]) => [tt, lab, key === 1 || (key === 2 && wide) ? 1 : 0]);
  $("ticks").innerHTML = ticks.map(([tt, lab, key], i) => `<div class="tick${key ? " key" : ""}${i === 0 ? " edge-l" : i === ticks.length - 1 ? " edge-r" : ""}" style="left:${t2p(tt) * 100}%">${esc(lab)}</div>`).join("");
  thumb.setAttribute("aria-valuemin", "0"); thumb.setAttribute("aria-valuemax", "1000");
  track.classList.toggle("narrow", track.getBoundingClientRect().width < 760);
}
function updateThumb() {
  const p = t2p(state.t);
  thumb.style.left = p * 100 + "%"; $("fill").style.width = p * 100 + "%";
  thumb.setAttribute("aria-valuenow", Math.round(p * 1000)); thumb.setAttribute("aria-valuetext", fmtAge(state.t));
}
function trackPos(ev) { const r = track.getBoundingClientRect(); return clamp01((ev.clientX - r.left) / r.width); }
let tdrag = false;
track.addEventListener("pointerdown", e => { tdrag = true; track.setPointerCapture(e.pointerId); stopPlay(); setTime(p2t(trackPos(e))); });
track.addEventListener("pointermove", e => { if (tdrag) setTime(p2t(trackPos(e))); });
track.addEventListener("pointerup", () => tdrag = false); track.addEventListener("pointercancel", () => tdrag = false);
thumb.addEventListener("keydown", e => {
  const p = t2p(state.t);
  if (e.key === "ArrowLeft") { e.preventDefault(); setTime(p2t(p - .002)); }
  else if (e.key === "ArrowRight") { e.preventDefault(); setTime(p2t(p + .002)); }
  else if (e.key === "PageUp") { e.preventDefault(); jumpEv(-1); }
  else if (e.key === "PageDown") { e.preventDefault(); jumpEv(1); }
  else if (e.key === "Home") { e.preventDefault(); setTime(p2t(0)); }
  else if (e.key === "End") { e.preventDefault(); setTime(p2t(1)); }
});
function jumpEv(dir) {
  if (state.sc) { const n = (state.sc.steps || []).length; if (!n) return; goStep(clamp(state.step + dir, 0, n - 1)); return; }
  const p = t2p(state.t), list = EVENTS_.filter(e => e.big).map(e => e.t).sort((a, b) => b - a);
  const tgt = dir > 0 ? list.find(tt => t2p(tt) > p + 1e-4) : list.slice().reverse().find(tt => t2p(tt) < p - 1e-4);
  if (tgt != null) { setTime(tgt); const ev = EVENTS_.find(e => e.t === tgt && e.big); if (ev) showEvent(ev); }
}
$("prevEv").onclick = () => jumpEv(-1); $("nextEv").onclick = () => jumpEv(1);

/* ---------- tempo ---------- */
function setTime(t) {
  const dom = TL.domain(); t = clamp(t, dom[dom.length - 1], dom[0]);
  state.t = t; updateThumb(); updateHead(); draw(); schedulePanel();
  if (state.sc) syncStepToTime();
}
function updateHead() {
  const t = state.t, ch = chainAt(t), u = ch[ch.length - 1];
  $("eraLabel").innerHTML = u ? `<i style="background:${u.color}"></i>${esc(ch.map(x => x.name).slice(-2).join(" · "))}` : "";
  $("yearLabel").textContent = fmtAge(t);
  const md = $("modSel");
  if (md) { const on = MODELLI.length > 0 && t < -FUT_TECT && t > -1300; if (on && md.hidden) { md.innerHTML = modButtons(); bindModButtons(md); } md.hidden = !on; }
  const cl = climate(t);
  const msg = t > 4400 ? "Superficie fusa o appena solidificata: nessun continente, nessun oceano stabile." :
    t > 4000 ? "I primi oceani: la crosta dell'Adeano è quasi tutta scomparsa, ne restano solo minuscoli cristalli di zircone." :
    t > TECT_MAX ? "Prima di 1 miliardo di anni fa la posizione dei continenti è molto incerta: sono mostrati solo i nuclei di crosta già esistenti." :
    cl.snow >= 1 ? "Terra a palla di neve: ghiaccio fino all'equatore." :
    t < -7450 ? "Il Sole, diventato una gigante rossa, raggiunge l'orbita della Terra: probabilmente la inghiotte." :
    t < -FUT_TECT ? (MODELLI.length && t > -1300 ? `Futuro lontano: continenti secondo il modello «${(modelNow() || {}).name || ""}» (posizioni schematiche).` : "Futuro lontano: continenti in posizione schematica, previsioni sempre più incerte.") : "";
  $("subLabel").textContent = msg || (t > 0.02 ? "Continenti nella posizione dell'epoca" : t < -0.02 ? "Futuro possibile: i continenti proseguono i moti di oggi" : t < 0 ? "Futuro possibile: dipende anche dalle nostre scelte" : "");
  $("subLabel").classList.toggle("warn", !!msg);
}

/* ---------- riproduzione ---------- */
let playRaf = 0, lastTs = 0;
function play() {
  if (state.playing) { stopPlay(); return; }
  if (t2p(state.t) >= .999) setTime(p2t(0));
  state.playing = true; $("playIcon").innerHTML = '<path d="M3 2h4v12H3zM9 2h4v12H9z"/>'; $("play").setAttribute("aria-label", "Pausa");
  lastTs = performance.now();
  const step = now => {
    if (!state.playing) return;
    const dt = Math.min(.1, (now - lastTs) / 1000); lastTs = now;
    const sp = (state.sc ? .035 : .018) * SPEEDS[speedI];
    const p = t2p(state.t) + sp * dt;
    setTime(p2t(p));
    if (p >= 1) { stopPlay(); return; }
    playRaf = requestAnimationFrame(step);
  };
  playRaf = requestAnimationFrame(step);
}
// velocità di riproduzione: si cambia con − / + (anche durante la riproduzione) o con i tasti − e +
const SPEEDS = [.25, .5, 1, 2, 4, 8];
let speedI = 2;
function setSpeed(i) {
  speedI = clamp(i, 0, SPEEDS.length - 1);
  $("spdVal").textContent = String(SPEEDS[speedI]).replace(".", ",") + "×";
  $("spdDown").disabled = speedI === 0; $("spdUp").disabled = speedI === SPEEDS.length - 1;
}
$("spdDown").onclick = () => setSpeed(speedI - 1);
$("spdUp").onclick = () => setSpeed(speedI + 1);
document.addEventListener("keydown", e => {
  if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
  if (e.key === "+" || e.key === "=") setSpeed(speedI + 1);
  else if (e.key === "-") setSpeed(speedI - 1);
});
setSpeed(2);
function stopPlay() { state.playing = false; if (playRaf) cancelAnimationFrame(playRaf); playRaf = 0; $("playIcon").innerHTML = '<path d="M4 2l10 6-10 6z"/>'; $("play").setAttribute("aria-label", "Avvia"); }
$("play").onclick = play;

/* ---------- scenari ---------- */
function openScenChooser() {
  stopPlay();
  const box = $("scenList");
  if (!SCENARI_.length) { box.innerHTML = `<p class="note">Gli scenari non sono disponibili.</p>`; }
  else box.innerHTML = `<section><div class="ch-grid">${SCENARI_.map((s, i) => `<button class="ch-card" data-i="${i}" style="--cc:${s.color || "var(--accent)"}"><span class="ch-sw"></span><span class="ch-name">${esc(s.title)}</span><span class="ch-when">${esc(fmtUnit(s.from, s.unit))} → ${esc(fmtUnit(s.to, s.unit))}</span><span class="ch-intro">${esc(s.sub || firstSentence(s.intro))}</span></button>`).join("")}</div></section>`;
  box.querySelectorAll(".ch-card").forEach(b => b.onclick = () => { closeChooser("scenChooser"); enterScenario(SCENARI_[+b.dataset.i]); });
  $("scenChooser").hidden = false; const f = box.querySelector(".ch-card"); if (f) f.focus();
}
function closeChooser(id) { $(id).hidden = true; }
document.querySelectorAll(".chooser").forEach(ch => {
  ch.addEventListener("click", e => { if (e.target === ch || e.target.closest("[data-close]")) ch.hidden = true; });
});
document.addEventListener("keydown", e => { if (e.key === "Escape") document.querySelectorAll(".chooser").forEach(ch => ch.hidden = true); });
$("scenBtn").onclick = openScenChooser;

function enterScenario(sc) {
  stopPlay(); closeSel();
  state.sc = sc; state.step = -1;
  TL = d3.scaleLinear().domain(sc.dom || [sc.from, sc.to]).range(sc.rng || [0, 1]).clamp(true);
  $("scBar").hidden = false; $("scBarT").textContent = sc.title;
  $("tlHint").innerHTML = `<span>Scenario: ${esc(sc.title)} · la linea del tempo va da ${esc(fmtUnit(sc.from, sc.unit))} a ${esc(fmtUnit(sc.to, sc.unit))}</span><span>I cerchi sulla linea sono le tappe della visita</span>`;
  buildTrack(); renderScenBox();
  goStep(0);
}
function exitScenario() {
  if (!state.sc) return;
  const t = state.t;
  state.sc = null; state.step = -1;
  TL = d3.scaleLinear().domain(MAIN_DOM).range(MAIN_RNG).clamp(true);
  $("scBar").hidden = true; $("scenBox").hidden = true; $("scenBox").innerHTML = "";
  $("tlHint").innerHTML = `<span>Trascina il globo per farlo girare e il cursore per viaggiare nel tempo</span><span>La scala non è uniforme: le ere più recenti sono allargate</span>`;
  buildTrack(); setTime(t);
}
$("scExit").onclick = exitScenario;
function renderScenBox() {
  const sc = state.sc; if (!sc) return;
  const st = sc.steps || [], i = state.step, s = st[i];
  $("scenBox").hidden = false;
  $("scenBox").innerHTML = `<div class="sel" style="border-color:${sc.color || "var(--accent)"}">
    <div class="eyebrow">Scenario speciale${s ? ` · tappa ${i + 1} di ${st.length}` : ""}</div>
    <h3>${esc(s ? s.title : sc.title)}</h3>
    ${s ? `<div class="sci" style="font-style:normal">${esc(fmtAge(s.t))}${s.modello && modelNow() ? " · modello «" + esc(modelNow().name) + "»" : ""}</div>${certHtml(s)}${cimg(s.img)}<p>${esc(s.text)}</p>` : `<p>${esc(sc.intro || "")}</p>`}
    <div class="stepnav"><button id="stPrev" ${i <= 0 ? "disabled" : ""}>‹ Precedente</button><button id="stNext" class="pri" ${i >= st.length - 1 ? "disabled" : ""}>Successiva ›</button></div>
    ${s ? futExtras(s) : ""}
    <details style="margin-top:10px"${i <= 0 ? " open" : ""}><summary>Introduzione e tappe</summary><p style="color:var(--ink)">${esc(sc.intro || "")}</p>
    <ul class="steps">${st.map((x, k) => `<li><button data-k="${k}" class="${k === i ? "cur" : ""}"><span class="k">${k + 1}</span><span>${esc(x.title)} <span style="color:var(--muted);font-size:12.5px">· ${esc(fmtUnit(x.t, sc.unit))}</span></span></button></li>`).join("")}</ul></details>
    <div class="links"><button id="stExit">Esci dallo scenario</button></div></div>`;
  $("stPrev").onclick = () => goStep(i - 1); $("stNext").onclick = () => goStep(i + 1); $("stExit").onclick = exitScenario;
  $("scenBox").querySelectorAll("[data-k]").forEach(b => b.onclick = () => goStep(+b.dataset.k));
}
function goStep(i) {
  const sc = state.sc; if (!sc || !sc.steps || !sc.steps.length) return;
  i = clamp(i, 0, sc.steps.length - 1); state.step = i;
  const s = sc.steps[i];
  if (s.modello) { if (state.model !== s.modello) setModel(s.modello); }
  setTime(s.t);
  if (s.view) { const [lon, lat, z] = s.view; const ll = Math.abs(s.t) < 2 ? [lon, lat] : (paleo(lon, lat, s.t) || [lon, lat]); flyTo(ll[0], ll[1], z ? clamp(z * 1.0, .9, 8) : 1.2); }
  renderScenBox(); buildTrack(); updateThumb();
  if (window.innerWidth <= 860) $("scenBox").scrollIntoView({behavior: "smooth", block: "nearest"}); else $("panel").scrollTo({top: 0, behavior: "smooth"});
}
function syncStepToTime() {
  const st = state.sc.steps || []; let k = -1;
  for (let i = 0; i < st.length; i++) if (st[i].t >= state.t - 1e-9) k = i;
  if (k !== state.step && k >= 0 && !tdrag && !state.playing) return;
  if (k !== state.step && k >= 0) { state.step = k; renderScenBox(); $("evdots").querySelectorAll(".stepdot").forEach((d, i) => d.classList.toggle("cur", i === k)); }
}

/* ---------- ambienti 3D ---------- */
function loadThree() {
  if (window.THREE) return true;
  const src = $("threeSrc"); if (!src) return false;
  const s = document.createElement("script"); s.textContent = src.textContent; document.head.appendChild(s);
  return !!window.THREE;
}
function openEnvChooser() {
  stopPlay();
  const PE = window.PaleoEnv, box = $("envList");
  if (!PE || !PE.list) { box.innerHTML = `<p class="note">Gli ambienti 3D non sono disponibili.</p>`; $("envChooser").hidden = false; return; }
  const near = PE.forTime ? PE.forTime(state.t) : [];
  const nearIds = new Set(near.map(e => e.id));
  const card = e => `<button class="ch-card" data-env="${esc(e.id)}" style="--cc:${e.color || "var(--accent)"}"><span class="ch-sw"></span><span class="ch-name">${esc(e.name)}</span><span class="ch-when">${esc(fmtAge(e.from, "short"))}${e.to !== e.from ? " – " + esc(fmtAge(e.to, "short")) : ""} · ${esc(e.place || "")}</span><span class="ch-intro">${esc(e.intro || "")}</span></button>`;
  const others = PE.list.filter(e => !nearIds.has(e.id)).sort((a, b) => b.from - a.from);
  box.innerHTML = (near.length ? `<section><h3>Adatti a ${esc(fmtAge(state.t).toLowerCase())}</h3><div class="ch-grid">${near.map(card).join("")}</div></section>` : "") +
    `<section><h3>${near.length ? "Altre epoche" : "Tutti gli ambienti"}</h3><div class="ch-grid">${others.map(card).join("")}</div></section>`;
  box.querySelectorAll(".ch-card").forEach(b => b.onclick = () => openEnv(b.dataset.env));
  $("envChooser").hidden = false; const f = box.querySelector(".ch-card"); if (f) f.focus();
}
function openEnv(id) {
  closeChooser("envChooser");
  try { loadThree(); } catch (e) { alert("Questo dispositivo non riesce a caricare il motore 3D."); return; }
  try {
    window.PaleoEnv.open(id, {
      onExit: () => { resize(); },
      onShowOnMap: (lat, lon, ma) => { if (ma != null) { if (state.sc && (ma > state.sc.from || ma < state.sc.to)) exitScenario(); setTime(ma); } flyToPresent(lon, lat, 2.4); },
      // le schede delle specie di oggi sono nel globo «Sapiens in Tempore»
      onSpecies: sid => { location.href = "sapiens.html?specie=" + encodeURIComponent(sid); }
    });
  } catch (e) { console.error(e); alert("Questo dispositivo non riesce a mostrare il paesaggio in 3D (serve WebGL)."); }
}
$("envBtn").onclick = openEnvChooser;

/* ---------- ricerca di una specie o di un genere qualsiasi ---------- */
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function localSearch(q) {
  const k = norm(q), out = [];
  for (const x of TAXA_) if (norm(x.common).includes(k) || norm(x.name).includes(k)) out.push({label: x.common || x.name, sci: x.name, sub: G(x.group).name + " · " + fmtRange(x.from, x.to) + " · nel globo", emoji: G(x.group).emoji, pick: () => { if (state.sc) exitScenario(); setTime((x.from + x.to) / 2); showTaxon(x); }});
  for (const p of PEOPLE) if (norm(p.name).includes(k)) out.push({label: p.name, sub: "Scienziato · " + (p.idea || p.field || ""), emoji: "🔬", pick: () => showPerson(p)});
  return out.sort((a, b) => (norm(a.label).startsWith(k) ? 0 : 1) - (norm(b.label).startsWith(k) ? 0 : 1));
}
let searchSeq = 0;
async function showSearch(r) {
  const my = ++searchSeq;
  openSel(`<div class="eyebrow">🔎 Ricerca</div><h3>${esc(r.label || r.sci)}</h3><div class="sci">${esc(r.sci)}</div><p class="note">Raccolgo le informazioni da Paleobiology Database, GBIF, Open Tree of Life e Wikipedia…</p>`, null);
  const inf = await window.Cerca.info(r);
  if (my !== searchSeq) return;
  const fa = window.Cerca.firstAppearance(inf);
  const extra = `<div class="links">${fa != null ? `<button id="sGo">⏱ Vai alla sua comparsa (${esc(fmtAge(Math.min(4567, fa), "short"))})</button>` : ""}<a href="sapiens.html?cerca=${encodeURIComponent(inf.sci)}">🧍 Dove vive oggi: apri «Sapiens in Tempore»</a></div>`;
  openSel(window.Cerca.cardHtml(inf, {goTime: true, extra}), null);
  const box = $("selBox");
  box.querySelectorAll("[data-cls]").forEach(b => b.onclick = () => showSearch({sci: b.dataset.cls, label: b.dataset.cls}));
  const go = tt => { if (state.sc) exitScenario(); setTime(Math.min(4567, tt)); };
  box.querySelectorAll("[data-go]").forEach(b => b.onclick = () => go(+b.dataset.go));
  const sg = $("sGo"); if (sg) sg.onclick = () => go(fa);
}

/* ---------- scienziati ---------- */
// anno di nascita (se manca, stimato dall'anno della scoperta)
function bornY(p) { return p.born || (p.t != null ? Math.round(2026 - p.t * 1e6) - 40 : 3000); }
const PEOPLE = (typeof SAP !== "undefined" && SAP.people ? SAP.people : []).filter(p => p && p.id).sort((a, b) => bornY(a) - bornY(b));
function showPerson(p) {
  const id = "img" + Math.random().toString(36).slice(2);
  openSel(`<div class="eyebrow">🔬 ${esc(p.field || "Scienza")}</div>
    <h3>${esc(p.name)}</h3><div class="sci" style="font-style:normal">${esc(p.born ? p.born + "–" + (p.died || "") : "")}${p.nat ? " · " + esc(p.nat) : ""}</div>
    ${imgBlock(id)}
    <dl class="facts">${p.idea ? `<dt>L'idea</dt><dd>${esc(p.idea)}</dd>` : ""}${p.work ? `<dt>Opera</dt><dd>${esc(p.work)}</dd>` : ""}${p.place ? `<dt>Dove</dt><dd>${esc(p.place)}</dd>` : ""}</dl>
    <p>${esc(p.text || "")}</p>
    ${linksHtml({wiki: p.wiki, wikiEn: p.wiki ? null : p.wikiEn})}
    <div class="links"><a href="sapiens.html?persona=${encodeURIComponent(p.id)}">🧍 Vedi i luoghi sul globo «Sapiens in Tempore»</a></div>`, null);
  wikiBest(p.wiki, p.wikiEn).then(w => fillImg(id, w, p.name));
}
function openPeopleChooser() {
  stopPlay();
  const box = $("peopleAll"), by = {};
  PEOPLE.forEach(p => { const c = bornY(p) < 1700 ? "Prima di Linneo" : bornY(p) < 1800 ? "Settecento" : bornY(p) < 1870 ? "Ottocento" : bornY(p) < 1930 ? "Novecento" : "Oggi"; (by[c] || (by[c] = [])).push(p); });
  box.innerHTML = Object.keys(by).map(c => `<section><h3>${esc(c)}</h3><div class="ch-grid">${by[c].map(p => `<button class="ch-card" data-pid="${esc(p.id)}" style="--cc:#5b4bb7"><span class="ch-sw"></span><span class="ch-name">${esc(p.name)}</span><span class="ch-when">${esc(p.born ? p.born + "–" + (p.died || "") : "")}</span><span class="ch-intro">${esc(p.idea || p.field || "")}</span></button>`).join("")}</div></section>`).join("") || `<p class="note">Nessuno scienziato disponibile.</p>`;
  box.querySelectorAll("[data-pid]").forEach(b => b.onclick = () => { closeChooser("peopleChooser"); showPerson(PEOPLE.find(p => p.id === b.dataset.pid)); });
  $("peopleChooser").hidden = false; const f = box.querySelector(".ch-card"); if (f) f.focus();
}
if ($("peopleBtn")) { if (PEOPLE.length) $("peopleBtn").onclick = openPeopleChooser; else $("peopleBtn").hidden = true; }
if (window.Cerca && $("searchBox")) window.Cerca.mountUI($("searchBox"), {local: localSearch, onPick: showSearch});

/* ---------- avvio ---------- */
function start() {
  readCols(); legend();
  const mq = matchMedia("(prefers-color-scheme: dark)");
  if (mq.addEventListener) mq.addEventListener("change", () => { readCols(); draw(); });
  new ResizeObserver(() => resize()).observe($("mapwrap"));
  buildTrack();
  // da dove partire: parametro ?t= (in Ma) oppure 66 Ma
  const q = new URLSearchParams(location.search), qt = parseFloat(q.get("t"));
  ROTV = [-15, -10];
  resize();
  setTime(isFinite(qt) ? qt : 67);
  $("loading").hidden = true;
  const qc = q.get("cerca"); if (qc && window.Cerca) showSearch({sci: qc, label: qc});
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw());
  window.addEventListener("resize", () => { if (!state.sc) buildTrack(); else buildTrack(); updateThumb(); });
}
start();
})();
