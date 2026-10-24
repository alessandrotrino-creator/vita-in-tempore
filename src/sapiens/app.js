(() => {
"use strict";
const $ = id => document.getElementById(id);
const D = window.DATA || {};
const S = Object.assign({species: [], events: [], scenari: [], dispersal: [], hotspots: [], people: [], stats: {}}, window.SAP || {});
const ENR = D.enrich || {species: {}, people: {}};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const clamp01 = v => clamp(v, 0, 1);
const lerp = (a, b, u) => a + (b - a) * u;
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const RAD = Math.PI / 180;
const NOW_YEAR = 2026;
const T0 = 0.06;   // inizio del globo: 60 000 anni fa
const yearT = y => (NOW_YEAR - y) / 1e6;

/* ---------- formati ---------- */
const NF = {};
const nf = (v, d) => (NF[d] || (NF[d] = new Intl.NumberFormat("it-IT", {maximumFractionDigits: d, minimumFractionDigits: d}))).format(v);
const nfi = v => nf(Math.round(v), 0);
function fmtAge(t, mode) {
  const sh = mode === "short";
  if (t <= 2e-7) return sh ? "oggi" : "Oggi";
  const y = t * 1e6;
  if (y < 4000) {
    const yr = Math.round(NOW_YEAR - y);
    return yr > 0 ? (sh ? yr + " d.C." : "Anno " + yr + " d.C.") : (sh ? (1 - yr) + " a.C." : "Anno " + (1 - yr) + " a.C.");
  }
  if (y >= 100000) return nfi(Math.round(y / 1000) * 1000) + (sh ? " anni fa" : " anni fa");
  if (y >= 10000) return nfi(Math.round(y / 100) * 100) + " anni fa";
  return nfi(Math.round(y / 10) * 10) + " anni fa";
}
function fmtUnit(t, unit) {
  if (unit === "ka") return t <= 2e-7 ? "oggi" : nfi(t * 1000) + " ka";
  return fmtAge(t, "short");
}
function fmtRange(a, b) {
  if (a == null) return "";
  if (b == null || Math.abs(a - b) < 1e-9) return fmtAge(a);
  if (b <= 2e-7) return "da " + fmtAge(a, "short") + " a oggi";
  return "da " + fmtAge(a, "short") + " a " + fmtAge(b, "short");
}
function firstSentence(s) { if (!s) return ""; const m = String(s).match(/^.{20,160}?[.!?](\s|$)/); return m ? m[0].trim() : String(s).slice(0, 140) + (String(s).length > 140 ? "…" : ""); }

/* ---------- linea del tempo: scala a tratti (gli ultimi secoli allargati) ---------- */
const MAIN_DOM = [T0, 0.03, 0.0117, 0.005, yearT(1), yearT(1500), yearT(1900), 0];
const MAIN_RNG = [0, .2, .4, .54, .66, .79, .91, 1];
let TL = d3.scaleLinear().domain(MAIN_DOM).range(MAIN_RNG).clamp(true);
const t2p = t => TL(t), p2t = p => TL.invert(clamp01(p));

/* ---------- periodi ---------- */
const GEO = [
  {name: "Pleistocene superiore", from: 0.129, to: 0.0117, color: "#fff2c7", text: "L'ultima parte dell'«era glaciale»: fasi fredde e fasi più miti si alternano, il livello del mare è più basso di decine di metri e grandi mammiferi popolano tutti i continenti."},
  {name: "Olocene", from: 0.0117, to: 0, color: "#fde9c9", text: "L'epoca calda in cui viviamo, iniziata 11 700 anni fa con la fine dell'ultima glaciazione. Il clima stabile permette la nascita dell'agricoltura, dei villaggi e delle città."}
];
const AGES = [
  {name: "Paleolitico medio", from: 0.3, to: 0.045, color: "#d9c3a5", text: "Strumenti di pietra scheggiata preparati con cura (tecnica Levallois): li usano sia i Neanderthal sia i Sapiens."},
  {name: "Paleolitico superiore", from: 0.045, to: 0.0117, color: "#e3cfa0", text: "Lame, punte, aghi d'osso, ornamenti, arte nelle grotte e strumenti musicali. Si vive di caccia, pesca e raccolta."},
  {name: "Mesolitico", from: 0.0117, to: 0.0095, color: "#c8d8a8", text: "Dopo la glaciazione: piccoli gruppi di cacciatori-raccoglitori nei boschi, sulle coste e lungo i fiumi. Nel Vicino Oriente nascono già i primi villaggi agricoli."},
  {name: "Neolitico", from: 0.0095, to: 0.0055, color: "#b5d39a", text: "Agricoltura, allevamento, villaggi, ceramica e pietra levigata. Le date cambiano da regione a regione: in Italia il Neolitico inizia circa 8000 anni fa."},
  {name: "Età dei metalli", from: 0.0055, to: 0.0028, color: "#e2b98a", text: "Rame, bronzo e poi ferro. Nascono le prime città, gli stati e la scrittura (Mesopotamia ed Egitto, circa 3200 a.C.)."},
  {name: "Età antica", from: 0.0028, to: yearT(476), color: "#e6c27a", text: "Grandi civiltà e imperi in tutto il mondo: Grecia, Roma, Persia, India, Cina, Mesoamerica."},
  {name: "Medioevo", from: yearT(476), to: yearT(1492), color: "#c9b18f", text: "Dalla caduta dell'Impero romano d'Occidente alla scoperta europea dell'America."},
  {name: "Età moderna", from: yearT(1492), to: yearT(1815), color: "#b9c6d8", text: "Esplorazioni, scambio colombiano, rivoluzione scientifica. Nascono la classificazione dei viventi (Linneo) e lo studio dei fossili."},
  {name: "Età contemporanea", from: yearT(1815), to: 0, color: "#a9c3cf", text: "Industria, città enormi, medicina moderna: la popolazione umana passa da 1 a 8 miliardi e la pressione sulla natura cresce come mai prima."}
];
const unitAt = (L, t) => L.find(u => t <= u.from + 1e-12 && t >= u.to - 1e-12) || null;

/* ---------- clima del passato recente (valori arrotondati) ---------- */
const SEA = [[0, 0], [0.006, -1], [0.008, -15], [0.0105, -45], [0.0125, -60], [0.0145, -80], [0.0165, -100], [0.019, -122], [0.026, -125], [0.029, -110], [0.035, -85], [0.045, -75], [0.06, -85], [0.07, -70]];
function interp(arr, x) {
  if (x <= arr[0][0]) return arr[0][1];
  for (let i = 1; i < arr.length; i++) if (x <= arr[i][0]) { const [a, va] = arr[i - 1], [b, vb] = arr[i]; return va + (vb - va) * (x - a) / (b - a); }
  return arr[arr.length - 1][1];
}
const seaLevel = t => interp(SEA, t);
const iceF = t => clamp01(-seaLevel(t) / 125);
// temperatura media globale rispetto al 1850–1900 (°C): Tierney et al. 2020, Osman et al. 2021, Copernicus/WMO
const TEMP = [[0, 1.5], [yearT(2015), 1.1], [yearT(1980), .3], [yearT(1950), .15], [yearT(1900), 0], [yearT(1700), -.25], [yearT(1500), -.1], [0.002, 0], [0.006, .1], [0.0105, -.4], [0.0117, -1.5], [0.0129, -3], [0.0147, -2], [0.0175, -5], [0.019, -6], [0.026, -6], [0.03, -5], [0.04, -4.5], [0.05, -4.5], [0.06, -5]];
// anidride carbonica nell'aria (ppm): carote di ghiaccio antartiche, poi Mauna Loa
const CO2 = [[0, 427], [yearT(2020), 414], [yearT(2010), 390], [yearT(2000), 370], [yearT(1980), 339], [yearT(1960), 317], [yearT(1900), 296], [yearT(1850), 285], [yearT(1500), 280], [0.002, 278], [0.007, 261], [0.0105, 265], [0.0129, 240], [0.0147, 238], [0.018, 190], [0.022, 186], [0.03, 200], [0.04, 205], [0.05, 210], [0.06, 215]];
const greenSahara = t => smooth(0.0148, 0.0118, t) * smooth(0.0048, 0.0058, t);   // Periodo umido africano

/* ---------- stato ---------- */
const state = {
  t: 0.05, mode: "globe", playing: false, sel: null, sc: null, step: -1,
  layers: {humans: true, species: true, gbif: true, threat: false, events: true, people: true, hotspots: false, names: true, climate: true, today: false},
  fGroup: null, fCat: null
};
Object.keys(state.layers).forEach(l => {
  const el = $("l-" + l); if (!el) return;
  el.checked = state.layers[l];
  el.addEventListener("change", () => { state.layers[l] = el.checked; if (l === "climate" || l === "today") TEX.key = ""; draw(); schedulePanel(); });
});

/* ---------- gruppi e categorie IUCN ---------- */
const GDEF = {
  umani: ["Specie umane", "#e76f51", "🧍"], mammiferi: ["Mammiferi", "#9d4edd", "🐘"], uccelli: ["Uccelli", "#f4a261", "🐦"],
  rettili: ["Rettili", "#7f9f3f", "🦎"], anfibi: ["Anfibi", "#4c9a5a", "🐸"], pesci: ["Pesci e squali", "#2a7fb8", "🐟"],
  invertebrati: ["Invertebrati", "#c2557a", "🦋"], piante: ["Piante e alghe", "#3f8f3a", "🌿"], funghi: ["Funghi", "#a0785a", "🍄"]
};
const G = k => { const d = GDEF[k] || [k, "#888", "•"]; return {name: d[0], color: d[1], emoji: d[2]}; };
const IUCN = {
  EX: ["Estinta", "#000000"], EW: ["Estinta in natura", "#542344"], CR: ["In pericolo critico", "#d81e05"], EN: ["In pericolo", "#fc7f3f"],
  VU: ["Vulnerabile", "#f9e814"], NT: ["Quasi minacciata", "#cce226"], LC: ["Minor preoccupazione", "#60c659"], DD: ["Dati insufficienti", "#d1d1c6"]
};
const CAT_ORDER = ["EX", "EW", "CR", "EN", "VU", "NT", "LC", "DD"];
const THREAT = new Set(["CR", "EN", "VU"]);
const TREND = {decreasing: "↘ in calo", increasing: "↗ in aumento", stable: "→ stabile", unknown: "andamento sconosciuto"};
const iucnBadge = c => c && IUCN[c] ? `<span class="iucn ${c}" style="background:${IUCN[c][1]}" title="${esc(IUCN[c][0])}">${c}</span>` : "";
const HUMCOL = ["#e0213a", "#3a86ff", "#8338ec", "#2a9d8f", "#06a77d", "#ff006e"];

const SPECIES = S.species.filter(x => x && x.id && x.places && x.places.length);
const BYID = new Map(SPECIES.map(x => [x.id, x]));
const PEOPLE = (S.people || []).filter(p => p && p.id).sort((a, b) => bornY(a) - bornY(b));
const PBYID = new Map(PEOPLE.map(p => [p.id, p]));
const EVENTS = (S.events || []).filter(e => e && e.t != null).slice().sort((a, b) => b.t - a.t);
const SCENARI = S.scenari || [];
const HUMANS = SPECIES.filter(x => x.group === "umani" && /^Homo\b/.test(x.name || "") || x.group === "umani" && /denisov/i.test(x.id + x.common));
HUMANS.forEach((x, i) => x._col = /sapiens/.test(x.name) ? HUMCOL[0] : HUMCOL[1 + (i % (HUMCOL.length - 1))]);
const SAP_SP = HUMANS.find(x => /sapiens/.test(x.name));
const alive = (x, t) => x.from >= t - 1e-12 && x.to <= t + 1e-12;

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
  if (b && b.img) return Object.assign({}, b, {urlIt: a && a.url});
  return a || b;
}
// galleria: le immagini della voce di Wikipedia (prima inglese, più ricca di foto, poi italiana)
const MCACHE = {};
async function wikiMedia(title, lang) {
  const key = lang + ":" + title;
  if (key in MCACHE) return MCACHE[key];
  const p = (async () => {
    try {
      const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title.replace(/ /g, "_"))}?redirect=true`);
      if (!r.ok) return [];
      const j = await r.json();
      return (j.items || []).filter(it => it.type === "image" && it.srcset && it.srcset.length && !(window.Cerca && (window.Cerca.badImg(it.title) || window.Cerca.badImg(it.caption && it.caption.text))) && !/Status_|iucn|Commons-logo|Wiki[a-z]*-logo|Icon|Flag_of|Disambig|Pencil|Lock|Symbol|Question_book|Edit-clear|Crystal_Clear|Nuvola|OOjs|Taxonomy|Speaker|Sound|\.(ogg|oga|wav|mp3|webm)$/i.test(it.title)).slice(0, 12).map(it => {
        const ss = it.srcset.slice().sort((a, b) => parseFloat(b.scale) - parseFloat(a.scale));
        const fix = u => (u.startsWith("//") ? "https:" + u : u);
        return {src: fix(it.srcset[0].src), big: fix(ss[0].src).replace(/\/\d+px-/, "/960px-"), title: it.title, cap: it.caption && it.caption.text};
      });
    } catch (e) { return []; }
  })();
  MCACHE[key] = p; return p;
}
const ozLink = (name, ott) => `https://www.onezoom.org/life/@${encodeURIComponent(String(name).replace(/ /g, "_"))}${ott ? "=" + ott : ""}`;
const otLink = ott => `https://tree.opentreeoflife.org/opentree/argus/ottol@${ott}`;
const wpLink = (t, lang) => `https://${lang || "it"}.wikipedia.org/wiki/${encodeURIComponent(String(t).replace(/ /g, "_"))}`;
const iucnLink = name => `https://www.iucnredlist.org/search?query=${encodeURIComponent(name)}&searchType=species`;
const gbifLink = (key, name) => key ? `https://www.gbif.org/species/${key}` : `https://www.gbif.org/species/search?q=${encodeURIComponent(name)}`;
const pbdbLink = name => `https://paleobiodb.org/classic/checkTaxonInfo?taxon_name=${encodeURIComponent(name)}`;
const enrS = x => x._e || (ENR.species && ENR.species[x.id]) || {};
const enrP = p => (ENR.people && ENR.people[p.id]) || {};

/* ---------- miniature per i simboli sul globo ---------- */
const IMGS = new Map(); let imgRedraw = 0;
function thumbUrl(o, isPerson) {
  const sf = !isPerson && window.Cerca && window.Cerca.safeImg(o.name); if (sf) return sf.thumb;
  const e = isPerson ? enrP(o) : enrS(o), u = e.thumb || e.img || null;
  return u && window.Cerca && window.Cerca.badImg(u) ? null : u;
}
function getImg(key, url) {
  if (!url) return null;
  let im = IMGS.get(key);
  if (!im) {
    im = new Image(); im.decoding = "async"; im.referrerPolicy = "no-referrer";
    im.onload = () => { if (!imgRedraw) imgRedraw = setTimeout(() => { imgRedraw = 0; draw(); }, 120); };
    im.onerror = () => { im._bad = true; };
    im.src = url; IMGS.set(key, im);
  }
  return im.complete && im.naturalWidth && !im._bad ? im : null;
}

/* ---------- proiezione ---------- */
const cv = $("map"), ctx = cv.getContext("2d");
let W = 0, H = 0, dpr = 1, proj = null, gp = null, BASE = 1, Z = 1, ROTV = [-40, -12], PANY = 0;
const DARK = () => getComputedStyle(document.documentElement).getPropertyValue("--bg").trim().toLowerCase() === "#0e1517";
let COL = {};
function readCols() {
  const g = n => getComputedStyle(document.documentElement).getPropertyValue("--" + n).trim();
  ["bg", "panel", "ink", "muted", "line", "accent", "halo", "chip"].forEach(k => COL[k] = g(k));
  COL.dark = DARK(); COL.font = getComputedStyle(document.body).fontFamily;
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
    BASE = proj.scale(); proj.scale(BASE * Z).rotate([ROTV[0], ROTV[1]]);
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

/* ---------- calotte dell'ultima glaciazione (disegnate a mano, come nel globo principale) ---------- */
const ICE_SHEETS = [
  {c: [-85, 60], off: .05, pts: [[-150, 60], [-135, 57], [-128, 50], [-123, 47.5], [-117, 48], [-110, 48.5], [-100, 47], [-96, 44], [-93.6, 41.6], [-89, 40], [-86, 39.5], [-82, 39], [-80, 40.5], [-75, 41], [-73, 40.7], [-70, 41.3], [-66, 43], [-60, 44], [-55, 46], [-52, 48], [-55, 52], [-60, 57], [-64, 60], [-63, 64], [-62, 67], [-68, 71], [-75, 76], [-85, 80], [-95, 82], [-110, 79], [-125, 76], [-128, 71], [-135, 68], [-138, 64], [-142, 62], [-150, 62], [-150, 60]]},
  {c: [18, 64], off: .15, pts: [[-10, 54], [-10.5, 52], [-6, 51.5], [-3, 51.5], [0, 52.5], [4, 53.5], [8, 53], [10, 53.5], [13, 52.5], [18, 52.5], [22, 53.5], [26, 54.5], [30, 55], [32, 56.5], [35, 58], [40, 61], [45, 63], [50, 64], [55, 65], [60, 66], [65, 68], [70, 72], [75, 75], [80, 78], [70, 80], [55, 81], [40, 81], [25, 80.5], [15, 79], [10, 72], [5, 65], [-2, 62], [-5, 60], [-8, 58], [-10, 56], [-10, 54]]},
  {c: [10, 46.3], off: -.12, pts: [[5.5, 45], [7, 44.2], [7.4, 45.07], [9, 45.6], [11, 45.5], [14, 46], [16, 47], [13, 47.9], [10, 47.7], [7, 47.4], [6, 46.5], [5.5, 45]]},
  {c: [-73, -47], off: -.2, pts: [[-75, -56], [-72, -55], [-71, -50], [-71.5, -44], [-71.5, -38], [-73.5, -38], [-75, -45], [-76, -52], [-75, -56]]}
];
function iceSheetGeo(sh, f) {
  const [cx, cy] = sh.c; let ring = sh.pts.map(([x, y]) => [cx + (x - cx) * f, cy + (y - cy) * f]);
  const poly = {type: "Polygon", coordinates: [ring]};
  if (d3.geoArea(poly) > 2 * Math.PI) ring.reverse();
  return poly;
}

/* ---------- globo fisico ----------
   Base: immagine Blue Marble (NASA) di oggi + rilievo ETOPO1. Nel passato il mare si abbassa e scopre le piattaforme,
   le calotte avanzano e un modello semplice del clima (lo stesso del globo principale) calcola come cambia la vegetazione:
   il colore di oggi viene spostato della differenza tra il clima dell'epoca e quello attuale. */
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
function smooth(a, b, x) { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); }
function mixC(o, a, b, u) { o[0] = a[0] + (b[0] - a[0]) * u; o[1] = a[1] + (b[1] - a[1]) * u; o[2] = a[2] + (b[2] - a[2]) * u; return o; }
const C = {
  rain: [30, 84, 40], temp: [62, 106, 52], boreal: [46, 80, 60], wood: [112, 138, 66], steppe: [186, 174, 108], scrub: [146, 140, 92],
  desert: [224, 198, 146], tundra: [140, 138, 114], high: [150, 126, 100], rock: [136, 130, 124], snow: [242, 246, 250], ice: [234, 241, 247], seaIce: [214, 228, 238]
};
const MZ = [[0, 1], [8, .92], [14, .62], [20, .3], [27, .22], [34, .36], [42, .6], [52, .8], [62, .66], [72, .45], [90, .3]];
const LUT = (() => {
  const NTk = 64, NM = 32, L = new Uint8Array(NTk * NM * 3), o = [0, 0, 0], v = [0, 0, 0], f = [0, 0, 0];
  for (let i = 0; i < NTk; i++) {
    const T = -30 + i * 65 / (NTk - 1);
    for (let j = 0; j < NM; j++) {
      const M = j / (NM - 1);
      mixC(f, C.boreal, C.temp, smooth(2, 12, T)); mixC(f, f, C.rain, smooth(15, 24, T));
      mixC(v, C.desert, C.steppe, smooth(.14, .34, M)); mixC(v, v, C.wood, smooth(.34, .55, M)); mixC(v, v, f, smooth(.52, .76, M));
      mixC(o, C.tundra, v, smooth(-3, 6, T));
      const k = (i * NM + j) * 3; L[k] = o[0]; L[k + 1] = o[1]; L[k + 2] = o[2];
    }
  }
  return L;
})();
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

// dati di base: rilievo (gzip+base64, righe a differenze) e immagine della Terra
let TERRA = null, BM = null;
async function loadTerra() {
  const d = D.terra; if (!d || !window.DecompressionStream) return;
  const bin = Uint8Array.from(atob(d.b64), ch => ch.charCodeAt(0));
  const buf = new Uint8Array(await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer());
  const w = d.w, h = d.h, E = new Float32Array(w * h);
  const L = new Float32Array(256); for (let i = -128; i < 128; i++) L[i & 255] = Math.sign(i) * Math.pow(i / 1.6, 2);
  for (let r = 0; r < h; r++) { let u = 0; const o = r * w; for (let x = 0; x < w; x++) { u = (u + buf[o + x]) & 255; E[o + x] = L[u]; } }
  TERRA = {w, h, res: d.res, E};
}
function loadBM() {
  return new Promise(res => {
    if (!D.bm) { res(); return; }
    const im = new Image();
    im.onload = () => {
      const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
      const g = c.getContext("2d", {willReadFrequently: true}); g.drawImage(im, 0, 0);
      BM = {w: c.width, h: c.height, d: g.getImageData(0, 0, c.width, c.height).data}; res();
    };
    im.onerror = () => res();
    im.src = D.bm;
  });
}
function terraAt(lon, lat) {
  const T = TERRA, k = 1 / T.res;
  let x = (lon + 180) * k, y = (90 - lat) * k; x = ((x % T.w) + T.w) % T.w; y = clamp(y, 0, T.h - 1.001);
  const x0 = Math.floor(x), y0 = Math.floor(y), u = x - x0, v = y - y0, x1 = (x0 + 1) % T.w, E = T.E;
  const a = E[y0 * T.w + x0] + (E[y0 * T.w + x1] - E[y0 * T.w + x0]) * u;
  const b = E[(y0 + 1) * T.w + x0] + (E[(y0 + 1) * T.w + x1] - E[(y0 + 1) * T.w + x0]) * u;
  return a + (b - a) * v;
}
const BASES = {};
function baseFor(tw) {
  if (BASES[tw]) return BASES[tw];
  const th = tw / 2, n = tw * th, E = new Float32Array(n), NZ = new Float32Array(n), rgb = new Uint8ClampedArray(n * 3);
  for (let y = 0; y < th; y++) {
    const lat = 90 - (y + .5) / th * 180;
    for (let x = 0; x < tw; x++) {
      const lon = (x + .5) / tw * 360 - 180, i = y * tw + x;
      E[i] = TERRA ? terraAt(lon, lat) : 0;
      NZ[i] = noiseAt(lon, lat);
      if (BM) {
        // media dei pixel dell'immagine che cadono in questo pixel
        const sx = BM.w / tw, sy = BM.h / th, x0 = Math.floor(x * sx), y0 = Math.floor(y * sy), nx = Math.max(1, Math.round(sx)), ny = Math.max(1, Math.round(sy));
        let r = 0, g = 0, b = 0, c = 0;
        for (let yy = 0; yy < ny; yy++) for (let xx = 0; xx < nx; xx++) { const k = ((y0 + yy) * BM.w + (x0 + xx)) * 4; r += BM.d[k]; g += BM.d[k + 1]; b += BM.d[k + 2]; c++; }
        rgb[3 * i] = r / c; rgb[3 * i + 1] = g / c; rgb[3 * i + 2] = b / c;
      }
    }
  }
  // costa di oggi (per il livello «Coste di oggi»)
  const coast = new Uint8Array(n);
  for (let y = 1; y < th - 1; y++) for (let x = 0; x < tw; x++) {
    const i = y * tw + x; if (E[i] <= 0) continue;
    const l = x > 0 ? i - 1 : i + tw - 1, r = x < tw - 1 ? i + 1 : i - tw + 1;
    if (E[l] <= 0 || E[r] <= 0 || E[i - tw] <= 0 || E[i + tw] <= 0) coast[i] = 1;
  }
  return (BASES[tw] = {tw, th, n, E, NZ, rgb, coast, P0: null});
}
function climParams(t) {
  return {sl: seaLevel(t), fI: iceF(t), dT: interp(TEMP, Math.max(t, yearT(1900))), green: greenSahara(t)};
}
// colori del modello climatico per le terre emerse (null sul mare)
function procColors(b, P) {
  const {tw, th, n, E, NZ} = b, kmPx = 40030 / tw;
  const mask = new Uint8Array(n);
  for (let i = 0; i < n; i++) mask[i] = E[i] - P.sl > 0 ? 1 : 0;
  const dLand = distField(mask, tw, th, 1), dEast = seaAlong(mask, tw, th, 1), dWest = seaAlong(mask, tw, th, -1);
  const out = new Uint8ClampedArray(n * 3), o = [0, 0, 0];
  const aridG = .16 * P.fI;
  for (let y = 0; y < th; y++) {
    const lat = 90 - (y + .5) / th * 180, al = Math.abs(lat), cl = Math.cos(lat * RAD);
    const amp = .45 + 1.25 * smooth(20, 70, al);   // le alte latitudini si raffreddano di più
    const Tlat = -18 + 46 * Math.pow(cl, 1.3) + P.dT * amp, M0 = interp(MZ, al);
    const trade = smooth(32, 22, al), west = smooth(34, 44, al) * smooth(70, 58, al);
    const sah = P.green ? P.green * smooth(8, 14, lat) * smooth(34, 27, lat) : 0;
    for (let x = 0; x < tw; x++) {
      const i = y * tw + x; if (!mask[i]) continue;
      const e = Math.max(0, E[i] - P.sl), nz = NZ[i];
      const T = Tlat - 6.5 * e / 1000;
      const kmE = dEast[i] * kmPx * cl, kmW = dWest[i] * kmPx * cl;
      let M = M0 * (.25 + .75 * Math.exp(-dLand[i] * kmPx / 1300)) + trade * .32 * Math.exp(-kmE / 900) - trade * .12 * Math.exp(-kmW / 600) + west * .28 * Math.exp(-kmW / 1200) + nz * .2 - aridG;
      if (sah) { const lon = (x + .5) / tw * 360 - 180; M += .95 * sah * smooth(-20, -12, lon) * smooth(48, 38, lon); }
      const ti = clamp(Math.round((T + 30) / 65 * 63), 0, 63), mj = clamp(Math.round(M * 31), 0, 31), k = (ti * 32 + mj) * 3;
      o[0] = LUT[k]; o[1] = LUT[k + 1]; o[2] = LUT[k + 2];
      if (e > 500) mixC(o, o, C.high, smooth(500, 2600, e) * .8);
      if (e > 2800) mixC(o, o, C.rock, smooth(2800, 4500, e) * .8);
      if (e > 1200 && T < -2) mixC(o, o, C.snow, smooth(-2, -9, T));
      out[3 * i] = o[0]; out[3 * i + 1] = o[1]; out[3 * i + 2] = o[2];
    }
  }
  return {mask, col: out};
}
const TEX = {key: "", w: 0, h: 0, rgba: null, sea: null, cv: document.createElement("canvas"), res: 0};
const RCV = document.createElement("canvas");
function texKey(t, tw) {
  const P = climParams(t);
  return [tw, Math.round(P.sl), Math.round(P.fI * 60), Math.round(P.dT * 4), Math.round(P.green * 25), state.layers.climate ? 1 : 0, state.layers.today && t > yearT(1500) ? 1 : 0].join(",");
}
function buildTex(t, tw) {
  const b = baseFor(tw), {th, n, E, rgb} = b, P = climParams(t);
  if (!b.P0) b.P0 = procColors(b, climParams(0));
  const pc = state.layers.climate ? procColors(b, P) : {mask: null, col: null};
  // calotte
  let iceM = null;
  if (state.layers.climate && P.fI > .03) {
    RCV.width = tw; RCV.height = th;
    const rc = RCV.getContext("2d", {willReadFrequently: true});
    const ep = d3.geoEquirectangular().scale(tw / (2 * Math.PI)).translate([tw / 2, th / 2]).precision(.3), epath = d3.geoPath(ep, rc);
    rc.clearRect(0, 0, tw, th); rc.fillStyle = "#fff";
    for (const sh of ICE_SHEETS) {
      const f = sh.off >= 0 ? clamp01((P.fI - sh.off) / (1 - sh.off)) : (-sh.off + (1 + sh.off) * P.fI);
      if (f < .04) continue; rc.beginPath(); epath(iceSheetGeo(sh, Math.min(1, f))); rc.fill();
    }
    rc.filter = "none"; iceM = rc.getImageData(0, 0, tw, th).data;
  }
  const rgba = new Uint8ClampedArray(n * 4), sea = new Uint8Array(n), P0 = b.P0.col, Pt = pc.col, o = [0, 0, 0];
  const kmPx = 40030 / tw, kL = 1 / (kmPx * 1000) * 16, showCoast = state.layers.today && t > yearT(1500);
  for (let y = 0; y < th; y++) {
    const lat = 90 - (y + .5) / th * 180;
    for (let x = 0; x < tw; x++) {
      const i = y * tw + x, j = 3 * i, e = E[i];
      let r = rgb[j], g = rgb[j + 1], bb = rgb[j + 2];
      const land = Pt ? pc.mask[i] : e > 0;
      if (land && Pt) {
        if (e > 0) {
          // terra anche oggi: colore reale spostato dalla differenza di clima
          r += Pt[j] - P0[j]; g += Pt[j + 1] - P0[j + 1]; bb += Pt[j + 2] - P0[j + 2];
        } else {
          // piattaforma scoperta dal mare basso: colore del modello, con un po' di ombreggiatura
          const l = x > 0 ? i - 1 : i + tw - 1, rr = x < tw - 1 ? i + 1 : i - tw + 1, gy = y > 0 && y < th - 1 ? E[i + tw] - E[i - tw] : 0;
          const s = clamp(1 + (gy - (E[rr] - E[l])) * kL * 3, .8, 1.15);
          r = Pt[j] * s; g = Pt[j + 1] * s; bb = Pt[j + 2] * s;
        }
        if (iceM && iceM[4 * i + 3] > 127) { o[0] = r; o[1] = g; o[2] = bb; mixC(o, o, C.ice, .95); r = o[0]; g = o[1]; bb = o[2]; }
      } else if (!land && P.fI > .2 && state.layers.climate) {
        // banchisa più estesa nelle fasi glaciali
        const si = Math.max(smooth(80 - 14 * P.fI, 84 - 12 * P.fI, lat + NZ(i, b) * 3), smooth(-(66 - 8 * P.fI), -(70 - 8 * P.fI), lat + NZ(i, b) * 3));
        if (si > 0) { o[0] = r; o[1] = g; o[2] = bb; mixC(o, o, C.seaIce, si * .9); r = o[0]; g = o[1]; bb = o[2]; }
      }
      if (showCoast && b.coast[i]) { r = r * .3 + 255 * .7; g = g * .3 + 224 * .7; bb = bb * .3 + 138 * .7; }
      rgba[4 * i] = r; rgba[4 * i + 1] = g; rgba[4 * i + 2] = bb; rgba[4 * i + 3] = 255;
      sea[i] = land ? 0 : 1;
    }
  }
  TEX.w = tw; TEX.h = th; TEX.rgba = rgba; TEX.sea = sea; TEX.res = tw;
  TEX.cv.width = tw; TEX.cv.height = th; TEX.cv.getContext("2d").putImageData(new ImageData(rgba, tw, th), 0, 0);
}
function NZ(i, b) { return b.NZ[i]; }

let MOVING = false, moveTimer = 0, texTimer = 0;
function kick() { MOVING = true; clearTimeout(moveTimer); moveTimer = setTimeout(() => { MOVING = false; draw(); }, 180); }
const TEX_FULL = () => (window.innerWidth >= 1600 ? 2048 : 1024);
function ensureTex() {
  if (!TERRA && !BM) return false;
  const t = state.t, busy = MOVING || state.playing || tdrag, full = TEX_FULL();
  const kFull = texKey(t, full);
  if (TEX.key === kFull) return true;
  if (busy && TEX.rgba) {
    // mentre ci si muove: texture leggera, rifatta solo se il clima cambia in modo visibile
    const kLow = texKey(t, 1024);
    if (TEX.key.split(",").slice(1).join() !== kLow.split(",").slice(1).join()) { buildTex(t, 1024); TEX.key = kLow; }
    clearTimeout(texTimer); texTimer = setTimeout(() => { if (!(state.playing || tdrag)) draw(); }, 240);
    return true;
  }
  buildTex(t, full); TEX.key = kFull; return true;
}

/* ---------- osservazioni GBIF della specie scelta (sovrapposte al globo) ---------- */
const OV = {key: null, w: 1024, h: 512, a: null, cv: document.createElement("canvas"), loading: false, n: 0};
function gbifTiles(key, fossil) {
  const bor = fossil ? ["FOSSIL_SPECIMEN", "PRESERVED_SPECIMEN", "MATERIAL_SAMPLE", "OCCURRENCE"] : ["HUMAN_OBSERVATION", "PRESERVED_SPECIMEN", "MACHINE_OBSERVATION", "MATERIAL_SAMPLE", "OBSERVATION", "OCCURRENCE", "MATERIAL_CITATION"];
  const q = `srs=EPSG:4326&style=classic.point&taxonKey=${key}` + bor.map(b => "&basisOfRecord=" + b).join("");
  return [0, 1].map(x => `https://api.gbif.org/v2/map/occurrence/density/0/${x}/0@1x.png?${q}`);
}
function clearOverlay() { OV.key = null; OV.a = null; OV.n = 0; draw(); }
function loadOverlay(key, fossil, done) {
  OV.key = key + (fossil ? "f" : ""); OV.a = null; OV.loading = true;
  const want = OV.key, urls = gbifTiles(key, fossil);
  Promise.all(urls.map(u => new Promise((res, rej) => { const im = new Image(); im.crossOrigin = "anonymous"; im.onload = () => res(im); im.onerror = rej; im.src = u; }))).then(ims => {
    if (OV.key !== want) return;
    const c = OV.cv; c.width = OV.w; c.height = OV.h; const g = c.getContext("2d", {willReadFrequently: true});
    g.clearRect(0, 0, OV.w, OV.h);
    ims.forEach((im, k) => g.drawImage(im, k * OV.w / 2, 0, OV.w / 2, OV.h));
    const d = g.getImageData(0, 0, OV.w, OV.h).data, a = new Uint8Array(OV.w * OV.h);
    let cnt = 0;
    for (let i = 0; i < a.length; i++) if (d[4 * i + 3] > 20) { a[i] = 1; cnt++; }
    // ingrossa i punti di un pixel, così si vedono anche da lontano
    const a2 = new Uint8Array(a.length);
    for (let y = 1; y < OV.h - 1; y++) for (let x = 1; x < OV.w - 1; x++) { const i = y * OV.w + x; if (a[i] || a[i - 1] || a[i + 1] || a[i - OV.w] || a[i + OV.w]) a2[i] = a[i] ? 2 : 1; }
    OV.a = a2; OV.n = cnt; OV.loading = false;
    // versione colorata per il planisfero
    const img = g.createImageData(OV.w, OV.h);
    for (let i = 0; i < a2.length; i++) if (a2[i]) { img.data[4 * i] = 255; img.data[4 * i + 1] = 40; img.data[4 * i + 2] = 200; img.data[4 * i + 3] = a2[i] === 2 ? 240 : 150; }
    g.putImageData(img, 0, 0);
    draw(); if (done) done(cnt);
  }).catch(() => { OV.loading = false; if (OV.key === want) { OV.key = null; if (done) done(-1); } });
}

/* ---------- disegno del globo ---------- */
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
  const tw = TEX.w, th = TEX.h, src = TEX.rgba, sea = TEX.sea, bil = Z > 1.6 && !MOVING, ov = OV.a, ovx = OV.w / tw, ovy = OV.h / th, hv = HOV.d, hvx = HOV.w / tw, hvy = HOV.h / th;
  const Lx = -.5, Ly = .55, Lz = .67, Hn = Math.hypot(Lx, Ly, Lz + 1), Hx = Lx / Hn, Hy = Ly / Hn, Hz = (Lz + 1) / Hn;
  const AC = [150, 196, 240], inv2pi = 1 / (2 * Math.PI), invpi = 1 / Math.PI;
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
      if (hv) { const hk = (((v * hvy) | 0) * HOV.w + ((u * hvx) | 0)) * 4, ha = hv[hk + 3] / 255; if (ha) { r += (hv[hk] - r) * ha; g += (hv[hk + 1] - g) * ha; b += (hv[hk + 2] - b) * ha; } }
      if (ov) { const oa = ov[((v * ovy) | 0) * OV.w + ((u * ovx) | 0)]; if (oa) { const m = oa === 2 ? .92 : .6; r += (255 - r) * m; g += (40 - g) * m; b += (200 - b) * m; } }
      const lm = sx * Lx + sy * Ly + d * Lz, dif = .55 + .55 * (lm > 0 ? lm : 0);
      r *= dif; g *= dif; b *= dif;
      if (sea[ti]) { const nh = sx * Hx + sy * Hy + d * Hz; if (nh > .95) { const sp = Math.pow(nh, 200) * 55; r += sp; g += sp; b += sp; } }
      const lim = Math.pow(1 - d, 2.4) * .65;
      out[k] = r + (AC[0] - r) * lim; out[k + 1] = g + (AC[1] - g) * lim; out[k + 2] = b + (AC[2] - b) * lim; out[k + 3] = 255;
    }
  }
  pc.putImageData(img, 0, 0);
  c.imageSmoothingEnabled = true; c.drawImage(PCV, x0, y0, x1 - x0, y1 - y0);
}
function renderFlat(c) {
  const k = proj.scale(), [tx, ty] = proj.translate(), lam = proj.rotate()[0] * RAD, wpx = 2 * Math.PI * k, hpx = Math.PI * k;
  let x0 = tx + (-Math.PI + lam) * k; x0 = x0 - Math.ceil(x0 / wpx) * wpx;
  c.save(); c.beginPath(); gp({type: "Sphere"}); c.clip(); c.imageSmoothingEnabled = true;
  for (let x = x0; x < W; x += wpx) { c.drawImage(TEX.cv, x, ty - hpx / 2, wpx, hpx); if (HOV.d) c.drawImage(HOV.cv, x, ty - hpx / 2, wpx, hpx); if (OV.a) c.drawImage(OV.cv, x, ty - hpx / 2, wpx, hpx); }
  c.restore();
}

let HITS = [];
function draw() {
  if (!proj) return;
  const t = state.t, c = ctx, L = state.layers, GL = state.mode === "globe";
  c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
  c.fillStyle = COL.bg; c.fillRect(0, 0, W, H);
  HITS = [];
  const ok = ensureTex();
  if (ok) humanOverlay(t);
  if (GL) {
    const [cx, cy] = proj.translate(), R0 = proj.scale();
    const g = c.createRadialGradient(cx, cy, R0 * .97, cx, cy, R0 * 1.12);
    g.addColorStop(0, "rgba(120,175,235,.5)"); g.addColorStop(1, "rgba(0,0,0,0)");
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R0 * 1.12, 0, 7); c.fill();
    if (ok) renderOrtho(c);
  } else if (ok) renderFlat(c);
  c.strokeStyle = "rgba(255,255,255,.08)"; c.lineWidth = .6; c.beginPath(); gp(GRAT); c.stroke();
  c.strokeStyle = "rgba(255,255,255,.3)"; c.setLineDash([4, 4]); c.beginPath(); gp(EQUATOR); c.stroke(); c.setLineDash([]);
  c.strokeStyle = "rgba(0,0,0,.35)"; c.lineWidth = 1; c.beginPath(); gp({type: "Sphere"}); c.stroke();

  if (L.hotspots) drawHotspots();
  if (L.humans) drawHumans(t);
  if (state.sc) drawScenarioBelow(t);
  if (L.events && !state.sc) drawEvents(t);
  const marks = [];
  if (L.people) collectPeople(t, marks);
  if (L.species) collectSpecies(t, marks);
  if (L.species && L.gbif) collectGbif(t, marks);
  if (state.sc) collectScenario(t, marks);
  placeMarks(marks);
  if (state.sc) drawScenarioRoutes(t);
  if (state.sel && state.sel.mark) drawSelMark(state.sel.mark);
}

function dot(x, y, r, fill, stroke) { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.lineWidth = 1; ctx.strokeStyle = stroke; ctx.stroke(); } }
function halo(txt, x, y, font, col, align) {
  ctx.font = font; ctx.textAlign = align || "center"; ctx.lineJoin = "round";
  ctx.strokeStyle = COL.halo; ctx.lineWidth = 4; ctx.strokeText(txt, x, y);
  ctx.fillStyle = col; ctx.fillText(txt, x, y);
}
function emojiAt(x, y, em, size) {
  ctx.font = `${size}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(em, x, y + 1); ctx.textBaseline = "alphabetic";
}
function blobsGeo(blobs) { return {type: "MultiPolygon", coordinates: blobs.map(([la, lo, km]) => d3.geoCircle().center([lo, la]).radius(Math.max(5, km) / 111.2).precision(5)().coordinates)}; }

// punti caldi della biodiversità
function drawHotspots() {
  for (const h of S.hotspots || []) {
    if (!h._geo) h._geo = blobsGeo(h.blobs || []);
    ctx.globalAlpha = .2; ctx.fillStyle = "#1faa59"; ctx.beginPath(); gp(h._geo); ctx.fill();
    ctx.globalAlpha = .85; ctx.strokeStyle = "#1faa59"; ctx.lineWidth = 1.2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    const b = h.blobs && h.blobs[0];
    if (b && state.layers.names && Z >= 1.6 && visible(b[1], b[0])) { const p = proj([b[1], b[0]]); if (p) halo(h.name, p[0], p[1], `600 12px ${COL.font}`, COL.dark ? "#8fe0b0" : "#11653a"); }
  }
}
// dove vivono le specie umane
let HUMGEO = {k: "", sap: null};
function sapiensGeo(t) {
  const k = Math.round(t * 2e4);
  if (HUMGEO.k === k) return HUMGEO.sap;
  const blobs = [];
  for (const d of S.dispersal || []) {
    const [la, lo, km, ta] = d; if (ta < t && ta < T0 - 1e-9) continue;
    const f = ta >= T0 - 1e-9 ? 1 : .35 + .65 * smooth(0, .003, ta - t);
    blobs.push([la, lo, km * f]);
  }
  HUMGEO = {k, sap: blobs.length ? blobsGeo(blobs) : null};
  return HUMGEO.sap;
}
// le aree si disegnano in una mappa a parte (equirettangolare) e si colorano solo le terre emerse dell'epoca
const HOV = {key: "", w: 1024, h: 512, d: null, cv: document.createElement("canvas")};
function humanOverlay(t) {
  if (!state.layers.humans || !TEX.sea) { HOV.d = null; HOV.key = ""; return; }
  const key = Math.round(t * 2e4) + "|" + TEX.key;
  if (HOV.key === key) return;
  HOV.key = key;
  const c = HOV.cv; c.width = HOV.w; c.height = HOV.h;
  const g = c.getContext("2d", {willReadFrequently: true});
  const path = d3.geoPath(d3.geoEquirectangular().scale(HOV.w / (2 * Math.PI)).translate([HOV.w / 2, HOV.h / 2]).precision(.5), g);
  g.clearRect(0, 0, HOV.w, HOV.h);
  for (const x of HUMANS.slice().sort((a, b) => (a === SAP_SP) - (b === SAP_SP))) {
    if (!alive(x, t)) continue;
    let geo;
    if (x === SAP_SP && (S.dispersal || []).length) geo = sapiensGeo(t);
    else { if (!x.range || !x.range.length) continue; if (!x._geo) x._geo = blobsGeo(x.range); geo = x._geo; }
    if (!geo) continue;
    // le specie che stanno per scomparire sbiadiscono
    const fade = x.to > 0 ? clamp(.35 + .65 * (t - x.to) / 0.006, .35, 1) : 1;
    g.globalAlpha = (x === SAP_SP ? .4 * (t > .004 ? 1 : Math.max(.12, t / .004)) : .55) * fade; g.fillStyle = x._col; g.beginPath(); path(geo); g.fill();
    if (x !== SAP_SP) { g.globalAlpha = .9 * fade; g.strokeStyle = x._col; g.lineWidth = 1.2; g.setLineDash([4, 3]); g.stroke(); g.setLineDash([]); }
  }
  g.globalAlpha = 1;
  const img = g.getImageData(0, 0, HOV.w, HOV.h), d = img.data, sx = TEX.w / HOV.w, sy = TEX.h / HOV.h;
  let any = false;
  for (let y = 0; y < HOV.h; y++) for (let x = 0; x < HOV.w; x++) {
    const k = (y * HOV.w + x) * 4; if (!d[k + 3]) continue;
    if (TEX.sea[((y * sy) | 0) * TEX.w + ((x * sx) | 0)]) d[k + 3] = 0; else any = true;
  }
  g.putImageData(img, 0, 0);
  HOV.d = any ? d : null;
}
function drawHumans(t) {
  // etichette degli arrivi recenti di Homo sapiens
  if (state.layers.names && Z >= 1.25 && t > yearT(1700) && !state.sc) {
    for (const d of S.dispersal || []) {
      const [la, lo, , ta, place] = d;
      if (ta >= T0 - 1e-9 || ta < t || ta - t > 0.0025 * Math.max(1, t / 0.01) || !visible(lo, la)) continue;
      const p = proj([lo, la]); if (p) halo("Sapiens: " + place, p[0], p[1] + 4, `600 12px ${COL.font}`, COL.dark ? "#ffb59a" : "#9a3412");
    }
  }
}
const CATCOL = {umani: "#d4882a", clima: "#4f8fc0", estinzione: "#c0392b", natura: "#2e9e6a", conservazione: "#1faa59", scienza: "#5b4bb7"};
function eventsNear(t, pw) {
  const p = t2p(t);
  return EVENTS.filter(e => { const a = t2p(e.t), b = e.t2 != null ? t2p(e.t2) : a; return p >= Math.min(a, b) - pw && p <= Math.max(a, b) + pw; });
}
function drawEvents(t) {
  for (const e of eventsNear(t, .01)) {
    if (e.lat == null || e.lon == null || !visible(e.lon, e.lat)) continue;
    const p = proj([e.lon, e.lat]); if (!p) continue;
    const r = e.big ? 9 : 7, col = CATCOL[e.cat] || COL.accent;
    ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(Math.PI / 4);
    ctx.fillStyle = col; ctx.strokeStyle = COL.panel; ctx.lineWidth = 2; ctx.fillRect(-r * .7, -r * .7, r * 1.4, r * 1.4); ctx.strokeRect(-r * .7, -r * .7, r * 1.4, r * 1.4);
    ctx.restore();
    HITS.push({x: p[0], y: p[1], r: r + 3, kind: "event", ev: e, pri: 2});
  }
}

// simboli con foto: specie, scienziati, siti degli scenari. Si dispongono per importanza evitando le sovrapposizioni.
function speciesShown(t) {
  const L = state.layers, present = t < yearT(1700), out = [];
  for (const x of SPECIES) {
    const isAlive = alive(x, t), ghost = !isAlive && (x.iucn === "EX" || x.iucn === "EW") && x.to > t && t < yearT(1500) && (L.threat || state.fCat === x.iucn);
    if (!isAlive && !ghost) continue;
    if (L.threat && isAlive && !THREAT.has(x.iucn) && x.iucn !== "EW" && x.group !== "umani") continue;
    if (state.fGroup && x.group !== state.fGroup) continue;
    if (state.fCat && x.iucn !== state.fCat) continue;
    out.push({x, ghost, present});
  }
  return out;
}
function collectSpecies(t, marks) {
  const present = t < yearT(1700);
  for (const {x, ghost} of speciesShown(t)) {
    // nel passato le specie ancora viventi oggi restano sullo sfondo: si vedono solo le più note, o ingrandendo
    // (le piante e gli animali domestici, comparsi da poco, restano visibili)
    if (!present && !x.to && x.from >= T0 && x.group !== "umani" && (Z < 2.2 || state.sc) && !state.fGroup && !state.fCat) continue;
    // durante uno scenario: solo le specie di cui parla, le più note e gli umani
    if (state.sc) { const st = state.sc._taxa || (state.sc._taxa = new Set((state.sc.markers || []).map(m => m.taxon).filter(Boolean))); if (st.has(x.id) || (!(x.star && present) && x.group !== "umani")) continue; }
    let pri = x.star ? 60 : 10;
    if (x.group === "umani") pri += 70;
    if (present && x.iucn) pri += {CR: 40, EN: 30, VU: 20, EW: 35, EX: 12, NT: 6}[x.iucn] || 0;
    if (!present && x.to > 0) pri += 45;          // nel passato in primo piano le specie che poi si estinguono
    if (state.sel && state.sel.id === x.id) pri += 500;
    const many = Z >= 2.4 || (x.star && Z >= 1.7);
    x.places.forEach((pl, i) => { if (i === 0 || many) marks.push({kind: "sp", x, pl, i, pri: pri - i * 8, ghost, ll: [pl[1], pl[0]]}); });
  }
}
function collectPeople(t, marks) {
  for (const p of PEOPLE) {
    if (p.t == null || p.t < t - 1e-12 || p.lat == null) continue;
    marks.push({kind: "pe", p, pri: (state.sel && state.sel.pid === p.id ? 500 : 0) + 25, ll: [p.lon, p.lat]});
  }
}
function collectScenario(t, marks) {
  for (const m of state.sc.markers || []) {
    if (!scVis(m, t)) continue;
    const x = m.taxon && BYID.get(m.taxon);
    // i siti legati a una specie si mostrano con la sua foto
    if (x) marks.push({kind: "sp", x, pl: [m.lat, m.lon, m.label], i: 0, pri: 95, ghost: false, ll: [m.lon, m.lat]});
    else marks.push({kind: "scm", m, pri: 90, ll: [m.lon, m.lat]});
  }
}
/* ---------- altre specie osservate (GBIF) ----------
   Nel presente, ingrandendo, si scaricano fino a 300 foto verificate di iNaturalist (tramite GBIF) nella zona inquadrata
   e si mostrano le specie più fotografate (al massimo 60), con la loro foto. Le specie già schedate a mano restano in primo piano. */
let LABELS = [];   // nomi da scrivere sotto i simboli (placeMarks li mette solo dove c'è spazio)
const INAT = "50c9509d-22c7-4a22-a47d-8c48425ef4a7";   // iNaturalist, osservazioni «research grade»
const GB = {key: "", list: [], byId: new Map(), cache: new Map(), timer: 0, names: new Map()};
const BYNAME = new Map(SPECIES.map(x => [x.name, x]));
const spById = id => BYID.get(id) || GB.byId.get(id);
const GBCLS = {Mammalia: "mammiferi", Aves: "uccelli", Amphibia: "anfibi", Squamata: "rettili", Testudines: "rettili", Crocodylia: "rettili", Reptilia: "rettili",
  Actinopterygii: "pesci", Elasmobranchii: "pesci", Holocephali: "pesci", Sarcopterygii: "pesci", Myxini: "pesci", Petromyzonti: "pesci"};
// GBIF non sempre dà la classe dei pesci: un cordato che non è mammifero, uccello, rettile, anfibio o tunicato è un pesce
const gbGroup = r => r.kingdomKey === 6 ? "piante" : r.kingdomKey === 5 ? "funghi" : GBCLS[r.class] || (r.phylum === "Chordata" && !/^(Ascidiacea|Thaliacea|Appendicularia|Leptocardii)$/.test(r.class || "") ? "pesci" : "invertebrati");
const gbOn = () => state.layers.species && state.layers.gbif && state.t < yearT(1950) && Z >= 2.6 && !state.sc;
const inatSize = (u, s) => String(u).replace(/\/(original|large|medium|small|square)\.(jpe?g|png)/i, `/${s}.$2`);
function gbLic(l) { const m = String(l || "").match(/(publicdomain\/zero|by(-nc)?(-nd)?(-sa)?)\/[\d.]+/i); return !m ? "" : /zero/i.test(m[1]) ? "CC0" : "CC " + m[1].toUpperCase(); }
function gbArea() {
  const c = proj.invert && proj.invert([W / 2, H / 2]); if (!c || !isFinite(c[0])) return null;
  const half = clamp(60 / Z, 1.5, 22), step = half / 2;
  const la = Math.round(c[1] / step) * step, lo = Math.round(c[0] / step) * step, hl = Math.min(170, half / Math.max(.25, Math.cos(la * Math.PI / 180)));
  const r = v => Math.round(v * 100) / 100;
  return {key: [r(la), r(lo), r(half)].join(","), la0: r(Math.max(-89, la - half)), la1: r(Math.min(89, la + half)), lo0: r(Math.max(-180, lo - hl)), lo1: r(Math.min(180, lo + hl))};
}
// il conto alla rovescia riparte solo se cambia la zona inquadrata (i ridisegni per le miniature non lo devono azzerare)
function gbRequest() {
  const a0 = gbArea(); if (!a0 || a0.key === GB.key || a0.key === GB.pend) return;
  GB.pend = a0.key; clearTimeout(GB.timer);
  GB.timer = setTimeout(async () => {
    GB.pend = "";
    if (!gbOn()) return;
    const a = gbArea(); if (!a || a.key === GB.key) return;
    if (MOVING || a.key !== a0.key) { gbRequest(); return; }
    GB.key = a.key;
    let list = GB.cache.get(a.key);
    if (!list) {
      try {
        // la zona si divide in 3 × 3 riquadri: da ognuno le specie più fotografate, così i simboli si distribuiscono
        // (altrimenti vincerebbero sempre le regioni con più osservazioni, come l'Europa)
        const N = 3, dla = (a.la1 - a.la0) / N, dlo = (a.lo1 - a.lo0) / N, cells = [];
        for (let i = 0; i < N; i++) for (let k = 0; k < N; k++) cells.push([a.la0 + i * dla, a.la0 + (i + 1) * dla, a.lo0 + k * dlo, a.lo0 + (k + 1) * dlo]);
        const r2 = v => Math.round(v * 100) / 100;
        const res = await Promise.all(cells.map(([la0, la1, lo0, lo1]) => fetch(`https://api.gbif.org/v1/occurrence/search?datasetKey=${INAT}&mediaType=StillImage&hasCoordinate=true&hasGeospatialIssue=false&decimalLatitude=${r2(la0)},${r2(la1)}&decimalLongitude=${r2(lo0)},${r2(lo1)}&limit=60`).then(r => r.json()).catch(() => ({}))));
        const seen = new Set(), picked = [];
        for (const j of res) {
          const by = new Map();
          for (const r of j.results || []) {
            if (!r.speciesKey || !r.species || r.speciesKey === 2436436 || r.decimalLatitude == null || seen.has(r.speciesKey)) continue;
            const m = (r.media || []).find(m => m.identifier && /^https?:/.test(m.identifier)); if (!m) continue;
            const o = by.get(r.speciesKey) || {n: 0, r, m}; o.n++; by.set(r.speciesKey, o);
          }
          for (const o of [...by.values()].sort((p, q) => q.n - p.n).slice(0, 9)) { seen.add(o.r.speciesKey); picked.push(o); }
        }
        list = picked.filter(o => !BYNAME.has(o.r.species)).map(({n, r, m}) => {
          const id = "gb" + r.speciesKey, old = GB.byId.get(id);
          if (old) return old;
          const x = {id, name: r.species, common: GB.names.get(r.speciesKey) || null, group: gbGroup(r), from: 0.07, to: 0,
            iucn: IUCN[r.iucnRedListCategory] ? r.iucnRedListCategory : null, wiki: r.species, wikiEn: r.species,
            places: [[r.decimalLatitude, r.decimalLongitude, r.verbatimLocality || r.locality || "Osservazione su iNaturalist"]],
            _n: n, _gb: {key: r.speciesKey, img: inatSize(m.identifier, "medium"), big: inatSize(m.identifier, "large"), credit: m.rightsHolder || m.creator || "", lic: gbLic(m.license), url: `https://www.gbif.org/occurrence/${r.key}`},
            _e: {gbif: r.speciesKey, thumb: inatSize(m.identifier, "small")}};
          GB.byId.set(id, x); return x;
        });
        GB.cache.set(a.key, list);
      } catch (e) { GB.key = ""; return; }
    }
    if (GB.key !== a.key) return;
    GB.list = list; draw(); gbNames(list);
  }, 650);
}
// nomi italiani (quando esistono) dalla tassonomia di GBIF, pochi alla volta
async function gbNames(list) {
  for (const x of list) {
    if (x.common || GB.names.has(x._gb.key)) continue;
    GB.names.set(x._gb.key, null);
    try {
      const j = await (await fetch(`https://api.gbif.org/v1/species/${x._gb.key}/vernacularNames?limit=200`)).json();
      const v = (j.results || []).find(v => v.language === "ita");
      if (v && v.vernacularName) { const nm = v.vernacularName.charAt(0).toUpperCase() + v.vernacularName.slice(1); GB.names.set(x._gb.key, nm); x.common = nm; }
    } catch (e) {}
  }
  schedulePanel();
}
function collectGbif(t, marks) {
  if (!gbOn()) return;
  gbRequest();
  for (const x of GB.list) {
    if (state.fGroup && x.group !== state.fGroup) continue;
    if (state.fCat && x.iucn !== state.fCat) continue;
    if (state.layers.threat && !THREAT.has(x.iucn)) continue;
    const pl = x.places[0];
    marks.push({kind: "sp", x, pl, i: 0, pri: 1 + Math.min(4, x._n) + (state.sel && state.sel.id === x.id ? 500 : 0), ghost: false, ll: [pl[1], pl[0]], gb: true});
  }
}
function placeMarks(marks) {
  const sz = clamp(15 + Z * 2.5, 17, 30) * (window.innerWidth >= 1600 ? 1.15 : 1);
  marks.sort((a, b) => b.pri - a.pri);
  const placed = [];
  // meno simboli a globo intero, di più ingrandendo; lo schermo è diviso in riquadri con un massimo di simboli ciascuno,
  // così ogni zona (anche la Siberia o la Groenlandia) mostra le sue specie più importanti invece di lasciare tutto alle zone più ricche
  const cap = Z < 1.3 ? 60 : Z < 2 ? 100 : Z < 3 ? 160 : 320;
  const cell = sz * 4.2, perCell = Z < 1.3 ? 2 : Z < 2 ? 3 : Z < 3 ? 4 : 99, cells = new Map();
  const cellOk = (x, y) => (cells.get(Math.floor(x / cell) + "," + Math.floor(y / cell)) || 0) < perCell;
  const take = (x, y) => { const k = Math.floor(x / cell) + "," + Math.floor(y / cell); cells.set(k, (cells.get(k) || 0) + 1); };
  const free = (x, y, r) => !placed.some(q => Math.hypot(q.x - x, q.y - y) < (q.r + r) * .82);
  for (const m of marks) {
    if (!visible(m.ll[0], m.ll[1])) continue;
    const p = proj(m.ll); if (!p) continue;
    const r = m.kind === "scm" ? 8 : m.kind === "pe" ? sz * .5 : sz * (m.gb ? .44 : m.x && m.x.star ? .62 : .52);
    const pinned = m.pri >= 500 || m.kind === "scm";   // la specie scelta e i siti degli scenari si mostrano sempre
    if (placed.length < cap && free(p[0], p[1], r) && (pinned || cellOk(p[0], p[1]))) { placed.push({x: p[0], y: p[1], r, m}); take(p[0], p[1]); continue; }
    // simboli sovrapposti: da vicino si prova a spostarli appena più in là, nella zona intorno; a globo intero restano nascosti
    let spot = null;
    if (placed.length < cap && m.kind !== "scm" && Z >= 1.8) for (const k of Z >= 3 ? [1, 1.8] : [1]) {
      for (let a = 0; a < 8 && !spot; a++) { const ang = (a + (k > 1 ? .5 : 0)) * Math.PI / 4, d = r * 1.9 * k, x = p[0] + Math.cos(ang) * d, y = p[1] + Math.sin(ang) * d; if (free(x, y, r)) spot = [x, y]; }
      if (spot) break;
    }
    if (spot && cellOk(spot[0], spot[1])) { placed.push({x: spot[0], y: spot[1], r, m, ax: p[0], ay: p[1]}); take(spot[0], spot[1]); continue; }
    // nessuno spazio libero: se cade proprio sullo stesso punto di un simbolo di specie entra nel suo gruppo (si apre con un clic, una per una);
    // altrimenti resta nascosta e compare ingrandendo
    if (m.kind !== "sp" || m.ghost) continue;
    let best = null, bd = 1e9;
    for (const q of placed) if (q.m.kind === "sp" && !q.m.ghost) { const qx = q.ax != null ? q.ax : q.x, qy = q.ay != null ? q.ay : q.y, d = Math.hypot(qx - p[0], qy - p[1]); if (d < bd) { bd = d; best = q; } }
    if (best && bd < Math.min(best.r, r) * .6) { const g = best.grp || (best.grp = [best.m.x]); if (!g.includes(m.x)) g.push(m.x); }
  }
  // si disegnano dal meno importante, così i più importanti stanno sopra
  LABELS = [];
  for (let k = placed.length - 1; k >= 0; k--) {
    const {x, y, r, m, grp} = placed[k];
    if (m.kind === "sp") drawSpMark(m, x, y, r, grp && grp.length > 1 ? grp : null, k);
    else if (m.kind === "pe") drawPeMark(m.p, x, y, r);
    else drawScMark(m.m, x, y);
  }
  // nomi: si scrivono dal più importante e solo dove non coprono altri nomi o altri simboli
  const boxes = [];
  for (const L of LABELS.sort((a, b) => a.k - b.k)) {
    ctx.font = L.font; const w = ctx.measureText(L.txt).width + 6, h = 15, bx = L.x - w / 2, by = L.y - 12;
    if (boxes.some(b => bx < b[0] + b[2] && bx + w > b[0] && by < b[1] + b[3] && by + h > b[1])) continue;
    if (placed.some((q, i) => i !== L.k && q.x + q.r > bx && q.x - q.r < bx + w && q.y + q.r > by && q.y - q.r < by + h)) continue;
    boxes.push([bx, by, w, h]); halo(L.txt, L.x, L.y, L.font, COL.ink);
  }
}
function drawSpMark(m, X, Y, r, grp, k) {
  const x = m.x, g = G(x.group), present = state.t < yearT(1700);
  const ring = x.group === "umani" ? x._col || g.color : present && x.iucn && IUCN[x.iucn] ? IUCN[x.iucn][1] : g.color;
  ctx.globalAlpha = m.ghost ? .6 : 1;
  ctx.beginPath(); ctx.arc(X, Y, r, 0, 7); ctx.fillStyle = COL.panel; ctx.fill();
  const im = getImg("s:" + x.id, thumbUrl(x));
  if (im) {
    ctx.save(); ctx.beginPath(); ctx.arc(X, Y, r - 1.5, 0, 7); ctx.clip();
    const s = Math.max(2 * r / im.naturalWidth, 2 * r / im.naturalHeight), w = im.naturalWidth * s, h = im.naturalHeight * s;
    if (m.ghost) ctx.filter = "grayscale(1)";
    ctx.drawImage(im, X - w / 2, Y - h / 2, w, h); ctx.filter = "none"; ctx.restore();
  } else emojiAt(X, Y, g.emoji, r * 1.15);
  ctx.lineWidth = m.gb ? 1.6 : x.star ? 3.2 : 2.4; ctx.strokeStyle = ring === "#000000" && COL.dark ? "#888" : ring; ctx.beginPath(); ctx.arc(X, Y, r, 0, 7); ctx.stroke();
  if (m.ghost) { halo("†", X + r * .8, Y - r * .55, `700 ${Math.round(r * .9)}px Georgia,serif`, COL.ink); }
  ctx.globalAlpha = 1;
  if (grp) {
    // gruppo di specie nello stesso punto: numero in un cerchietto; il clic apre l'elenco diviso per classe
    const bx = X + r * .78, by = Y - r * .78, br = Math.max(8, r * .46), txt = String(grp.length);
    dot(bx, by, br, COL.accent, COL.panel);
    ctx.font = `700 ${Math.round(br * 1.15)}px ${COL.font}`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#fff"; ctx.fillText(txt, bx, by + .5); ctx.textBaseline = "alphabetic";
  }
  if (state.layers.names && (x.star || Z >= 2.2) && !m.ghost && !m.i && !m.gb && k != null) LABELS.push({k, txt: x.common || x.name, x: X, y: Y + r + 12, font: `600 ${Z >= 2.2 ? 12.5 : 12}px ${COL.font}`});
  HITS.push(grp ? {x: X, y: Y, r: r + 4, kind: "grp", list: grp, pl: m.pl, pri: 3} : {x: X, y: Y, r: r + 2, kind: "sp", x0: x, pl: m.pl, pri: 3});
}
// elenco delle specie raggruppate in un punto, divise per classe; ognuna apre la sua scheda (con «Torna all'elenco»)
function showGroup(list, pl) {
  const order = Object.keys(GDEF), by = {};
  for (const x of list) (by[x.group] = by[x.group] || []).push(x);
  const html = order.filter(k => by[k]).map(k => `<div class="note" style="margin-top:10px">${G(k).emoji} ${esc(G(k).name)} (${by[k].length})</div><div class="taxa">${by[k].map(x => spButton(x)).join("")}</div>`).join("");
  openSel(`<div class="eyebrow">📍 ${esc(pl && pl[2] ? pl[2] : "In questa zona")}</div><h3>${list.length} specie vicine</h3><p class="note">Sul globo sono troppo vicine per vederle separate: scegline una.</p>${html}`, {mark: pl ? {ll: () => [pl[1], pl[0]]} : null});
  const box = $("selBox");
  box.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => showSpecies(spById(b.dataset.sp), null, () => showGroup(list, pl)));
}
function drawPeMark(p, X, Y, r) {
  const s = r * 1.7;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(X - s / 2, Y - s / 2, s, s, 5) : ctx.rect(X - s / 2, Y - s / 2, s, s);
  ctx.fillStyle = COL.panel; ctx.fill();
  const im = getImg("p:" + p.id, thumbUrl(p, true));
  if (im) {
    ctx.save(); ctx.clip();
    const k = Math.max(s / im.naturalWidth, s / im.naturalHeight), w = im.naturalWidth * k, h = im.naturalHeight * k;
    ctx.filter = "sepia(.35)"; ctx.drawImage(im, X - w / 2, Y - s / 2 - Math.max(0, (h - s) * .15), w, h); ctx.filter = "none"; ctx.restore();
  } else emojiAt(X, Y, "🔬", r * 1.1);
  ctx.lineWidth = 2.2; ctx.strokeStyle = CATCOL.scienza; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(X - s / 2, Y - s / 2, s, s, 5) : ctx.rect(X - s / 2, Y - s / 2, s, s); ctx.stroke();
  if (state.layers.names && Z >= 1.8) halo(p.name, X, Y + s / 2 + 12, `600 12px ${COL.font}`, COL.dark ? "#c7bdff" : "#3b2f8f");
  HITS.push({x: X, y: Y, r: s * .6, kind: "pe", p, pri: 2.5});
}
function drawSelMark(m) {
  const ll = m.ll ? m.ll() : null; if (!ll || !visible(ll[0], ll[1])) return;
  const p = proj(ll); if (!p) return;
  ctx.beginPath(); ctx.arc(p[0], p[1], 24, 0, 7); ctx.lineWidth = 3; ctx.strokeStyle = COL.accent; ctx.stroke();
}

/* ---------- scenari ---------- */
const scVis = (o, t) => (o.from == null || t <= o.from + 1e-12) && (o.to == null || t >= o.to - 1e-12);
function drawScenarioBelow(t) {
  for (const a of state.sc.areas || []) {
    if (!scVis(a, t)) continue;
    if (!a._geo) a._geo = blobsGeo(a.blobs || []);
    ctx.globalAlpha = .26; ctx.fillStyle = a.color || COL.accent; ctx.beginPath(); gp(a._geo); ctx.fill();
    ctx.globalAlpha = .9; ctx.strokeStyle = a.color || COL.accent; ctx.lineWidth = 1.2; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
    const b = a.blobs && a.blobs[0];
    if (b && state.layers.names && a.label && visible(b[1], b[0])) { const p = proj([b[1], b[0]]); if (p) halo(a.label, p[0], p[1], `600 13px ${COL.font}`, a.color || COL.ink); }
  }
}
function drawScenarioRoutes(t) {
  for (const r of state.sc.routes || []) {
    if (r.from != null && t > r.from + 1e-12) continue;
    const u = r.from == null || r.to == null ? 1 : clamp01((r.from - t) / Math.max(1e-12, r.from - r.to));
    const pts = (r.pts || []).map(([la, lo]) => [lo, la]); if (pts.length < 2) continue;
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
    if (state.layers.names && r.label && visible(tip[0], tip[1])) { const p = proj(tip); if (p) halo(r.label, p[0] + 10, p[1] - 8, `600 12.5px ${COL.font}`, r.color || COL.ink, "left"); }
  }
}
const KC = {fossile: "#9d4edd", sito: "#e76f51", evento: "#2a9d8f", impatto: "#d62828", vulcano: "#f77f00"};
function drawScMark(m, X, Y) {
  const col = KC[m.kind] || COL.accent;
  dot(X, Y, 7.5, col, COL.panel);
  ctx.beginPath(); ctx.arc(X, Y, 2.5, 0, 7); ctx.fillStyle = COL.panel; ctx.fill();
  if (state.layers.names && Z > 1.4 && m.label) halo(m.label, X + 10, Y + 4, `600 12px ${COL.font}`, COL.ink, "left");
  HITS.push({x: X, y: Y, r: 11, kind: "scm", m, pri: 3});
}

/* ---------- interazione ---------- */
const pointers = new Map(); let drag = null, pinch = null, moved = false;
cv.addEventListener("pointerdown", e => {
  cv.setPointerCapture(e.pointerId); pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
  moved = false; stopFly();
  if (pointers.size === 1) drag = {x: e.clientX, y: e.clientY, r: ROTV.slice(), py: PANY};
  if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = {d: Math.hypot(a.x - b.x, a.y - b.y), z: Z}; drag = null; }
});
cv.addEventListener("pointermove", e => {
  if (pointers.has(e.pointerId)) pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
  if (pinch && pointers.size === 2) { const [a, b] = [...pointers.values()]; setZoom(pinch.z * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d); moved = true; return; }
  if (drag) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.hypot(dx, dy) > 4) moved = true;
    if (!moved) return;
    cv.classList.add("dragging");
    const k = 57.3 / (BASE * Z);
    if (state.mode === "globe") ROTV = [drag.r[0] + dx * k, clamp(drag.r[1] - dy * k, -88, 88)];
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
cv.addEventListener("pointerleave", () => hideTip());
cv.addEventListener("wheel", e => { e.preventDefault(); setZoom(Z * Math.exp(-e.deltaY * .0015)); }, {passive: false});
function setZoom(z) { Z = clamp(z, .8, 14); kick(); setProj(); draw(); }
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
function hotspotAt(x, y) {
  if (!state.layers.hotspots) return null;
  const ll = proj.invert && proj.invert([x, y]); if (!ll || (state.mode === "globe" && !visible(ll[0], ll[1]))) return null;
  for (const h of S.hotspots || []) for (const [la, lo, km] of h.blobs || []) if (d3.geoDistance(ll, [lo, la]) * 6371 < km) return h;
  return null;
}
function hover(ev) {
  if (ev.pointerType === "touch") return;
  const {h, x, y} = hitAt(ev);
  const hs = h ? null : hotspotAt(x, y);
  cv.classList.toggle("hand", !!(h || hs));
  if (!h && !hs) { hideTip(); return; }
  let html = "";
  if (hs) html = `<b>${esc(hs.name)}</b><span>Punto caldo della biodiversità</span>`;
  else if (h.kind === "sp") { const c = h.x0.iucn && IUCN[h.x0.iucn]; html = `<b>${esc(h.x0.common || h.x0.name)}</b><span><i>${esc(h.x0.name)}</i></span>${c ? `<span>${iucnBadge(h.x0.iucn)} ${esc(c[0])}</span>` : ""}<span>${esc(h.pl[2] || "")}</span>`; }
  else if (h.kind === "grp") { const n = {}; h.list.forEach(x => { n[x.group] = (n[x.group] || 0) + 1; }); html = `<b>${h.list.length} specie vicine</b><span>${Object.keys(GDEF).filter(k => n[k]).map(k => `${G(k).emoji} ${n[k]} ${esc(G(k).name.toLowerCase())}`).join(" · ")}</span><span>Clicca per vederle una per una</span>`; }
  else if (h.kind === "pe") html = `<b>${esc(h.p.name)}</b><span>${esc(lifeYears(h.p))}</span><span>${esc(h.p.idea || h.p.field || "")}</span>`;
  else if (h.kind === "event") html = `<b>${esc(h.ev.title)}</b><span>${esc(fmtRange(h.ev.t, h.ev.t2))}</span>`;
  else if (h.kind === "scm") html = `<b>${esc(h.m.label)}</b><span>${esc(firstSentence(h.m.text))}</span>`;
  const tip = $("tip"); tip.innerHTML = html; tip.hidden = false;
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  tip.style.left = clamp(x + 14, 4, W - tw - 4) + "px"; tip.style.top = clamp(y + 14, 4, H - th - 4) + "px";
}
function hideTip() { $("tip").hidden = true; }
function pick(ev) {
  const {h, x, y} = hitAt(ev); hideTip();
  if (!h) { const hs = hotspotAt(x, y); if (hs) showHotspot(hs); return; }
  if (h.kind === "sp") showSpecies(h.x0, h.pl);
  else if (h.kind === "grp") showGroup(h.list, h.pl);
  else if (h.kind === "pe") showPerson(h.p);
  else if (h.kind === "event") showEvent(h.ev);
  else if (h.kind === "scm") showScMarker(h.m);
}

/* ---------- volo verso un punto ---------- */
let flyRaf = 0;
function stopFly() { if (flyRaf) cancelAnimationFrame(flyRaf); flyRaf = 0; }
function flyTo(lon, lat, zoom) {
  stopFly();
  const r0 = ROTV.slice(), z0 = Z, z1 = zoom != null ? clamp(zoom, .8, 14) : Math.max(Z, 1.6);
  const r1 = [-lon, state.mode === "globe" ? clamp(-lat, -80, 80) : 0];
  let dl = r1[0] - r0[0]; dl = ((dl + 540) % 360) - 180; r1[0] = r0[0] + dl;
  const t0 = performance.now(), dur = 900;
  const step = now => {
    const u = clamp01((now - t0) / dur), k = d3.easeCubicInOut(u);
    ROTV = [lerp(r0[0], r1[0], k), lerp(r0[1], r1[1], k)]; Z = lerp(z0, z1, k);
    if (state.mode !== "globe") PANY = lerp(PANY, 0, k);
    MOVING = u < 1; setProj(); draw();
    if (u < 1) flyRaf = requestAnimationFrame(step); else { flyRaf = 0; MOVING = false; draw(); }
  };
  flyRaf = requestAnimationFrame(step);
}

/* ---------- schede ---------- */
function openSel(html, sel) {
  const box = $("selBox"); box.innerHTML = `<div class="sel"><button class="x" aria-label="Chiudi la scheda">×</button>${html}</div>`;
  box.hidden = false; state.sel = sel || {};
  box.querySelector(".x").onclick = closeSel;
  if (window.innerWidth <= 860) box.scrollIntoView({behavior: "smooth", block: "start"}); else $("panel").scrollTo({top: 0, behavior: "smooth"});
  draw();
}
function closeSel() { $("selBox").hidden = true; $("selBox").innerHTML = ""; state.sel = null; if (OV.key) clearOverlay(); else draw(); }
const uid = () => "u" + Math.random().toString(36).slice(2);
function imgBlock(id) { return `<div class="img" id="${id}"><div class="wait">Cerco un'immagine…</div></div>`; }
function fillImg(id, w, alt) {
  const el = document.getElementById(id); if (!el) return;
  if (!w || !w.img) { el.remove(); return; }
  const cred = w.credit != null ? `Foto: ${esc(w.credit || "utente")}${w.lic ? " (" + esc(w.lic) + ")" : ""} · <a href="${esc(w.url)}" target="_blank" rel="noopener">iNaturalist, tramite GBIF</a>` : `Immagine: <a href="${esc(w.url)}" target="_blank" rel="noopener">Wikipedia${w.lang === "en" ? " (inglese)" : ""}</a> · Wikimedia Commons`;
  el.innerHTML = `<img src="${esc(w.img)}" alt="${esc(alt || w.title)}" loading="lazy" style="cursor:zoom-in" referrerpolicy="no-referrer"><div class="credit">${cred}</div>`;
  const im = el.querySelector("img");
  im.onerror = () => { if (w.thumb && im.src !== w.thumb) im.src = w.thumb; else el.remove(); };
  im.onclick = () => lightbox(w.big || (w.full ? w.full.replace(/\/commons\/(.)\/(..)\/([^/]+)$/, "/commons/thumb/$1/$2/$3/960px-$3") : w.img), alt || w.title, w.url, w.img);
}
function fillGallery(id, it, en) {
  const el = document.getElementById(id); if (!el) return;
  (async () => {
    let items = en ? await wikiMedia(en, "en") : [];
    if (items.length < 3 && it) items = items.concat(await wikiMedia(it, "it"));
    const seen = new Set(); items = items.filter(m => !seen.has(m.title) && seen.add(m.title)).slice(1, 12);
    if (!items.length) { el.remove(); return; }
    el.innerHTML = `<div class="note">Altre immagini (clicca per ingrandire):</div><div class="gal">${items.map((m, k) => `<button data-k="${k}" title="${esc(m.cap ? m.cap.replace(/<[^>]+>/g, "") : m.title.replace(/^File:/, ""))}" style="background-image:url('${esc(m.src)}')"></button>`).join("")}</div>`;
    el.querySelectorAll("[data-k]").forEach(b => b.onclick = () => { const m = items[+b.dataset.k]; lightbox(m.big, (m.cap || "").replace(/<[^>]+>/g, "") || m.title.replace(/^File:/, ""), "https://commons.wikimedia.org/wiki/" + encodeURIComponent(m.title.replace(/ /g, "_")), m.src); });
  })();
}
function lightbox(src, cap, link, fallback) {
  const lb = $("lightbox"), im = lb.querySelector("img");
  im.onerror = () => { if (fallback && im.src !== fallback) im.src = fallback; };
  im.src = src; im.alt = cap || "";
  lb.querySelector("figcaption").innerHTML = `${esc(cap || "")}${link ? ` · <a href="${esc(link)}" target="_blank" rel="noopener">fonte e licenza</a>` : ""}`;
  lb.hidden = false;
}
$("lightbox").addEventListener("click", e => { if (e.target.tagName !== "A") $("lightbox").hidden = true; });
function linkRow(L) { return L.length ? `<div class="links">${L.join("")}</div>` : ""; }
const A = (href, txt) => `<a href="${esc(href)}" target="_blank" rel="noopener">${txt}</a>`;
function ozBlock(name, ott, label) {
  return `<a class="ozbig" href="${esc(ozLink(name, ott))}" target="_blank" rel="noopener"><span class="ic">🌳</span><span><b>${esc(label || "Trovala nell'albero della vita")}</b><span>OneZoom: guarda i suoi parenti più stretti e risali l'albero fino all'origine della vita.</span></span></a>`;
}
function lifeYears(p) { return p.born ? `${p.born}–${p.died || ""}`.replace(/–$/, " –") + (p.nat ? " · " + p.nat : "") : ""; }
function sciButtons(ids) {
  const ps = (ids || []).map(i => PBYID.get(i)).filter(Boolean);
  return ps.length ? `<div class="note" style="margin-top:10px">Scienziati legati a questa storia:</div><div class="links">${ps.map(p => `<button data-pid="${esc(p.id)}">🔬 ${esc(p.name)}</button>`).join("")}</div>` : "";
}
function bindSci(box) { box.querySelectorAll("[data-pid]").forEach(b => b.onclick = () => showPerson(PBYID.get(b.dataset.pid))); }

function showSpecies(x, place, back) {
  const g = G(x.group), e = enrS(x), pl = place || x.places[0], present = !x.to;
  const facts = [];
  if (x.group === "umani" || x.to > 0 || x.from < T0) facts.push(["Quando", x.to > 0 ? fmtRange(x.from, x.to) : x.from < T0 ? "da " + fmtAge(x.from, "short") + " a oggi" : "vive oggi"]);
  if (x.to > 0 && x.to < yearT(1500)) facts.push(["Estinta", x.to < yearT(1990) ? "nel " + Math.round(NOW_YEAR - x.to * 1e6) : fmtAge(x.to)]);
  if (x.size) facts.push(["Dimensioni", x.size]);
  if (x.diet) facts.push(["Alimentazione", x.diet]);
  if (x.habitat) facts.push(["Ambiente", x.habitat]);
  if (x.pop) facts.push(["Popolazione", x.pop]);
  if (x.cause) facts.push([x.to > 0 ? "Perché è scomparsa" : "Minacce", x.cause]);
  const id = uid(), gid = uid();
  const places = x.places.map((p, i) => `<li><button data-site="${i}">📍 ${esc(p[2] || (p[0] + ", " + p[1]))}</button></li>`).join("");
  const c = x.iucn && IUCN[x.iucn];
  const canGbif = e.gbif && x.group !== "umani";
  openSel(`${back ? `<div class="links" style="margin:0 0 8px"><button id="grpBack">‹ Torna all'elenco</button></div>` : ""}<div class="eyebrow"><i class="cdot" style="background:${g.color}"></i>${esc(g.name)}${x.to > 0 && x.iucn !== "EW" ? " · estinta" : ""}</div>
    <h3>${esc(x.common || x.name)}</h3><div class="sci">${esc(x.name)}</div>
    ${c ? `<div class="iucnrow">${iucnBadge(x.iucn)}<b>${esc(c[0])}</b>${x.trend && TREND[x.trend] ? `<span class="tr">${esc(TREND[x.trend])}</span>` : ""}<span class="tr">· Lista Rossa IUCN</span></div>` : ""}
    ${imgBlock(id)}
    ${facts.length ? `<dl class="facts">${facts.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${esc(b)}</dd>`).join("")}</dl>` : ""}
    ${x._gb ? `<p id="gbTxt">Cerco la descrizione…</p><p class="note">Scheda automatica: la specie è tra le più fotografate in questa zona su iNaturalist (osservazioni verificate, dati GBIF); il testo viene da Wikipedia e non è stato controllato a mano.</p>` : `<p>${esc(x.text || "")}</p>`}
    ${window.Cerca ? window.Cerca.reconHtml(x.name) : ""}
    <div id="${gid}"></div>
    ${ozBlock(x.name, e.ott)}
    ${canGbif ? `<div class="links"><button id="gbifBtn">🗺️ ${present ? "Dove è stata osservata" : "Dove sono stati trovati i resti"} (GBIF)</button></div><div class="gbifnote" id="gbifNote"></div>` : ""}
    ${places ? `<div class="note" style="margin-top:10px">Luoghi (clicca per andarci):</div><ul class="sites">${places}</ul>` : ""}
    ${linkRow([
      x._gb ? A(x._gb.url, "📷 L'osservazione (iNaturalist)") : x.wiki ? A(wpLink(x.wiki, "it"), "📖 Wikipedia") : x.wikiEn ? A(wpLink(x.wikiEn, "en"), "📖 Wikipedia (inglese)") : "",
      e.ott ? A(otLink(e.ott), "🌲 Open Tree of Life") : "",
      x.iucn && x.iucn !== "EX" || present ? A(iucnLink(x.name), "🟥 Lista Rossa IUCN") : x.iucn === "EX" ? A(iucnLink(x.name), "⬛ Lista Rossa IUCN") : "",
      x.group !== "umani" ? A(gbifLink(e.gbif, x.name), "🗺️ GBIF") : "",
      x.to > yearT(1500) ? A(pbdbLink(x.name), "🦴 Paleobiology DB") : ""
    ].filter(Boolean))}
    ${sciButtons(x.sci)}
    ${alive(x, state.t) ? "" : `<div class="links"><button id="goWhen">⏱ Vai a quando viveva</button></div>`}`,
    {id: x.id, mark: pl ? {ll: () => [pl[1], pl[0]]} : null});
  const box = $("selBox");
  const gb = $("grpBack"); if (gb) gb.onclick = back;
  box.querySelectorAll("[data-site]").forEach(b => b.onclick = () => { const p = x.places[+b.dataset.site]; state.sel.mark = {ll: () => [p[1], p[0]]}; flyTo(p[1], p[0], Math.max(Z, 2.4)); });
  bindSci(box);
  if (window.Cerca) window.Cerca.bindRecon(box);
  const gw = $("goWhen"); if (gw) gw.onclick = () => { const tt = x.to > 0 ? Math.min(x.from, x.to + Math.min(.002, (x.from - x.to) * .3)) : Math.min(x.from, state.t); if (state.sc && (tt > state.sc.from || tt < state.sc.to)) exitScenario(); setTime(tt); showSpecies(x, pl); };
  if (canGbif) {
    const btn = $("gbifBtn"), note = $("gbifNote"), fossil = x.to > yearT(1500);
    const on = () => { btn.textContent = "Nascondi le osservazioni"; note.textContent = "Caricamento da GBIF…"; loadOverlay(e.gbif, fossil, n => { note.innerHTML = n < 0 ? "Non riesco a caricare i dati di GBIF (serve internet)." : n === 0 ? "Nessuna osservazione con coordinate in GBIF." : `<span style="color:#e028c0">●</span> In magenta i luoghi con osservazioni registrate in GBIF${fossil ? " (soprattutto reperti fossili e di museo)" : ""}. Non è l'areale ufficiale: alcuni punti possono essere animali in cattività o errori.`; }); };
    btn.onclick = () => { if (OV.key) { clearOverlay(); btn.textContent = `🗺️ ${present ? "Dove è stata osservata" : "Dove sono stati trovati i resti"} (GBIF)`; note.textContent = ""; } else on(); };
    if (OV.key && OV.key !== e.gbif + (fossil ? "f" : "")) clearOverlay();
    if (present && state.t < yearT(1900)) on();
  } else if (OV.key) clearOverlay();
  if (pl) flyTo(pl[1], pl[0], Math.max(Z, 1.8));
  const sf = window.Cerca && window.Cerca.safeImg(x.name), okE = e.img && !(window.Cerca && window.Cerca.badImg(e.img));
  const pre = sf ? Promise.resolve(Object.assign({title: x.common}, sf)) : okE ? Promise.resolve({img: e.img, thumb: e.thumb, full: e.full, url: e.url || wpLink(x.wikiEn || x.wiki, e.lang || "en"), lang: e.lang, title: x.common}) : wikiBest(x.wiki, x.wikiEn, x.name);
  // specie automatiche: se Wikipedia non ha una foto si usa quella dell'osservazione, con autore e licenza
  pre.then(w => fillImg(id, (w && w.img) || !x._gb ? w : {img: x._gb.img, big: x._gb.big, url: x._gb.url, credit: x._gb.credit, lic: x._gb.lic}, x.common || x.name));
  if (x._gb) (async () => {
    const it = await wikiSum(x.name, "it"), en = it && it.extract ? null : await wikiSum(x.name, "en"), w = it && it.extract ? it : en, el = $("gbTxt"); if (!el) return;
    el.innerHTML = w && w.extract ? `${esc(w.extract)} <a href="${esc(w.url)}" target="_blank" rel="noopener">(Wikipedia${w === en ? ", in inglese" : ""})</a>` : "Non c'è ancora una descrizione su Wikipedia.";
  })();
  // niente galleria automatica per le specie umane: le voci di Wikipedia contengono anche foto di persone nude
  if (x.group !== "umani") fillGallery(gid, x.wiki, x.wikiEn); else { const g = $(gid); if (g) g.remove(); }
}
function showPerson(p) {
  if (!p) return;
  const id = uid(), gid = uid();
  const sp = SPECIES.filter(x => (x.sci || []).includes(p.id)), ev = EVENTS.filter(e => (e.sci || []).includes(p.id));
  const places = [[p.lat, p.lon, p.place]].concat(p.places || []).filter(q => q[0] != null);
  openSel(`<div class="eyebrow" style="color:${CATCOL.scienza}">🔬 ${esc(p.field || "Scienza")}</div>
    <h3>${esc(p.name)}</h3><div class="sci" style="font-style:normal">${esc(lifeYears(p))}</div>
    ${imgBlock(id)}
    <dl class="facts">${p.idea ? `<dt>L'idea</dt><dd>${esc(p.idea)}</dd>` : ""}${p.work ? `<dt>Opera</dt><dd>${esc(p.work)}</dd>` : ""}${p.t != null ? `<dt>Quando</dt><dd>${esc(fmtAge(p.t))}</dd>` : ""}</dl>
    <p>${esc(p.text || "")}</p>
    ${places.length ? `<div class="note" style="margin-top:10px">Luoghi (clicca per andarci):</div><ul class="sites">${places.map((q, i) => `<li><button data-site="${i}">📍 ${esc(q[2] || "")}</button></li>`).join("")}</ul>` : ""}
    ${sp.length ? `<div class="note" style="margin-top:10px">Specie legate alle sue ricerche:</div><div class="links">${sp.map(x => `<button data-sp="${esc(x.id)}">${G(x.group).emoji} ${esc(x.common || x.name)}</button>`).join("")}</div>` : ""}
    ${ev.length ? `<div class="note" style="margin-top:10px">Momenti sulla linea del tempo:</div><div class="links">${ev.map((e, i) => `<button data-ev="${i}">⏱ ${esc(e.title)}</button>`).join("")}</div>` : ""}
    <div id="${gid}"></div>
    ${linkRow([p.wiki ? A(wpLink(p.wiki, "it"), "📖 Wikipedia") : "", p.wikiEn ? A(wpLink(p.wikiEn, "en"), "📖 Wikipedia (inglese)") : ""].filter(Boolean))}
    ${p.t != null && Math.abs(t2p(p.t) - t2p(state.t)) > .002 ? `<div class="links"><button id="goWhen">⏱ Vai al momento della scoperta</button></div>` : ""}`,
    {pid: p.id, mark: {ll: () => [p.lon, p.lat]}});
  const box = $("selBox");
  box.querySelectorAll("[data-site]").forEach(b => b.onclick = () => { const q = places[+b.dataset.site]; state.sel.mark = {ll: () => [q[1], q[0]]}; flyTo(q[1], q[0], Math.max(Z, 2.6)); });
  box.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => showSpecies(BYID.get(b.dataset.sp)));
  box.querySelectorAll("[data-ev]").forEach(b => b.onclick = () => { const e = ev[+b.dataset.ev]; setTime(e.t); showEvent(e); });
  const gw = $("goWhen"); if (gw) gw.onclick = () => { if (state.sc) exitScenario(); setTime(p.t); showPerson(p); };
  if (OV.key) clearOverlay();
  flyTo(p.lon, p.lat, Math.max(Z, 2));
  const e = enrP(p);
  (e.img ? Promise.resolve({img: e.img, thumb: e.thumb, full: e.full, url: e.url || wpLink(p.wiki, "it"), lang: e.lang}) : wikiBest(p.wiki, p.wikiEn)).then(w => fillImg(id, w, p.name));
  fillGallery(gid, p.wiki, p.wikiEn);
}
function showEvent(ev) {
  const id = uid(), col = CATCOL[ev.cat] || COL.accent;
  const CN = {clima: "Clima", estinzione: "Estinzione", umani: "Esseri umani", natura: "Natura", conservazione: "Conservazione", scienza: "Scienza"};
  openSel(`<div class="eyebrow"><i class="cdot" style="background:${col}"></i>${esc(CN[ev.cat] || "Evento")} · ${esc(fmtRange(ev.t, ev.t2))}</div>
    <h3>${esc(ev.title)}</h3>${imgBlock(id)}<p>${esc(ev.text || "")}</p>
    ${linkRow([ev.wiki ? A(wpLink(ev.wiki, "it"), "📖 Wikipedia") : ev.wikiEn ? A(wpLink(ev.wikiEn, "en"), "📖 Wikipedia (inglese)") : ""].filter(Boolean))}
    ${sciButtons(ev.sci)}
    ${Math.abs(t2p(ev.t) - t2p(state.t)) > .002 ? `<div class="links"><button id="goWhen">⏱ Vai a questo momento</button></div>` : ""}`,
    ev.lat != null ? {mark: {ll: () => [ev.lon, ev.lat]}} : {});
  bindSci($("selBox"));
  const gw = $("goWhen"); if (gw) gw.onclick = () => setTime(ev.t);
  if (OV.key) clearOverlay();
  if (ev.lat != null) flyTo(ev.lon, ev.lat, Math.max(Z, 1.6));
  wikiBest(ev.wiki, ev.wikiEn).then(w => fillImg(id, w, ev.title));
}
function showHotspot(h) {
  const id = uid();
  const inside = SPECIES.filter(x => !x.to && x.places.some(p => (h.blobs || []).some(([la, lo, km]) => d3.geoDistance([p[1], p[0]], [lo, la]) * 6371 < km)));
  openSel(`<div class="eyebrow" style="color:#1faa59">Punto caldo della biodiversità</div><h3>${esc(h.name)}</h3>${imgBlock(id)}<p>${esc(h.text || "")}</p>
    ${inside.length ? `<div class="note" style="margin-top:10px">Specie di questa zona sul globo:</div><div class="links">${inside.map(x => `<button data-sp="${esc(x.id)}">${iucnBadge(x.iucn)} ${esc(x.common || x.name)}</button>`).join("")}</div>` : ""}
    <p class="note">I punti caldi (hotspot) sono 36 regioni che ospitano moltissime specie che vivono solo lì e hanno già perso almeno il 70% della vegetazione originaria (N. Myers 2000, Conservation International).</p>
    ${linkRow([h.wiki ? A(wpLink(h.wiki, "it"), "📖 Wikipedia") : h.wikiEn ? A(wpLink(h.wikiEn, "en"), "📖 Wikipedia (inglese)") : ""].filter(Boolean))}`,
    {mark: null});
  $("selBox").querySelectorAll("[data-sp]").forEach(b => b.onclick = () => showSpecies(BYID.get(b.dataset.sp)));
  const b = h.blobs && h.blobs[0]; if (b) flyTo(b[1], b[0], Math.max(Z, 2));
  if (h.wiki || h.wikiEn) wikiBest(h.wiki, h.wikiEn).then(w => fillImg(id, w, h.name)); else $(id).remove();
}
function showScMarker(m) {
  const x = m.taxon ? BYID.get(m.taxon) : null;
  if (x) { showSpecies(x, [m.lat, m.lon, m.label]); return; }
  const p = m.person ? PBYID.get(m.person) : null;
  if (p) { showPerson(p); return; }
  const id = uid();
  openSel(`<div class="eyebrow">${esc(state.sc ? state.sc.title : "")}</div><h3>${esc(m.label)}</h3>${m.wiki || m.wikiEn ? imgBlock(id) : ""}<p>${esc(m.text || "")}</p>${linkRow([m.wiki ? A(wpLink(m.wiki, "it"), "📖 Wikipedia") : m.wikiEn ? A(wpLink(m.wikiEn, "en"), "📖 Wikipedia (inglese)") : ""].filter(Boolean))}`, {mark: {ll: () => [m.lon, m.lat]}});
  if (m.wiki || m.wikiEn) wikiBest(m.wiki, m.wikiEn).then(w => fillImg(id, w, m.label));
}

/* ---------- ricerca di una specie o di un genere qualsiasi ---------- */
const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function localSearch(q) {
  const k = norm(q), out = [];
  for (const x of SPECIES) if (norm(x.common).includes(k) || norm(x.name).includes(k)) out.push({label: x.common || x.name, sci: x.name, sub: G(x.group).name + (x.iucn && IUCN[x.iucn] ? " · " + IUCN[x.iucn][0] : "") + " · nel globo", emoji: G(x.group).emoji, pick: () => { const tt = alive(x, state.t) ? state.t : x.to > 0 ? Math.min(x.from, x.to + .001) : Math.min(T0, x.from); if (state.sc) exitScenario(); setTime(tt); showSpecies(x); }});
  for (const p of PEOPLE) if (norm(p.name).includes(k)) out.push({label: p.name, sub: "Scienziato · " + (p.idea || p.field || ""), emoji: "🔬", pick: () => { if (state.sc) exitScenario(); if (p.t != null) setTime(p.t); showPerson(p); }});
  return out.sort((a, b) => (norm(a.label).startsWith(k) ? 0 : 1) - (norm(b.label).startsWith(k) ? 0 : 1));
}
let searchSeq = 0;
async function showSearch(r) {
  const my = ++searchSeq;
  openSel(`<div class="eyebrow">🔎 Ricerca</div><h3>${esc(r.label || r.sci)}</h3><div class="sci">${esc(r.sci)}</div><p class="note">Raccolgo le informazioni da GBIF, Paleobiology Database, Open Tree of Life e Wikipedia…</p>`, {});
  if (!window.Cerca) return;
  const inf = await window.Cerca.info(r);
  if (my !== searchSeq) return;
  const living = !(inf.fossils.find(f => f.rank === (inf.rank || "").toLowerCase() && f.extant === false));
  const fa = window.Cerca.firstAppearance(inf);
  const extra = `${inf.gbif ? `<div class="links"><button id="sGbif">🗺️ Mostra sul globo le osservazioni GBIF</button></div><div class="gbifnote" id="sGbifNote"></div>` : ""}
    ${fa != null && fa > T0 ? `<div class="links"><a href="index.html?cerca=${encodeURIComponent(inf.sci)}">🌍 Guarda la sua comparsa nel globo «Vita in Tempore»</a></div>` : ""}`;
  openSel(window.Cerca.cardHtml(inf, {extra}), {});
  const box = $("selBox");
  box.querySelectorAll("[data-cls]").forEach(b => b.onclick = () => showSearch({sci: b.dataset.cls, label: b.dataset.cls}));
  const im = box.querySelector(".img img"); if (im && inf.img) im.onclick = () => lightbox(inf.img.img, inf.label || inf.sci, inf.img.url, inf.img.thumb);
  const btn = $("sGbif");
  if (btn) {
    const note = $("sGbifNote");
    const on = () => { btn.textContent = "Nascondi le osservazioni"; note.textContent = "Caricamento da GBIF…"; loadOverlay(inf.gbif, !living, n => { note.innerHTML = n < 0 ? "Non riesco a caricare i dati di GBIF (serve internet)." : n === 0 ? "Nessuna osservazione con coordinate." : `<span style="color:#e028c0">●</span> In magenta i luoghi con osservazioni o reperti registrati in GBIF. Non è l'areale ufficiale: alcuni punti possono essere in cattività, coltivati o errati.`; }); };
    btn.onclick = () => { if (OV.key) { clearOverlay(); btn.textContent = "🗺️ Mostra sul globo le osservazioni GBIF"; note.textContent = ""; } else on(); };
    on();
  } else if (OV.key) clearOverlay();
  const c = window.Cerca.contCenter(inf); if (c) flyTo(c[0], c[1], 1.1);
}
if (window.Cerca) window.Cerca.mountUI($("searchBox"), {local: localSearch, onPick: showSearch});

/* ---------- pannello ---------- */
let panelRaf = 0;
function schedulePanel() { if (!panelRaf) panelRaf = requestAnimationFrame(() => { panelRaf = 0; updatePanel(); }); }
let taxaAll = false;
const POP = (S.stats.umani && S.stats.umani.popolazione || []).slice().sort((a, b) => a[0] - b[0]);
function popAt(t) {
  if (POP.length < 2) return null;
  if (t <= POP[0][0]) return POP[0][1];
  for (let i = 1; i < POP.length; i++) if (t <= POP[i][0]) { const [a, va] = POP[i - 1], [b, vb] = POP[i], u = (t - a) / (b - a); return Math.exp(Math.log(va) + (Math.log(vb) - Math.log(va)) * u); }
  return POP[POP.length - 1][1];
}
function fmtPop(v) {
  if (v == null) return "";
  if (v >= 1e9) return "circa " + nf(v / 1e9, v >= 1e10 ? 0 : 1) + " miliardi";
  if (v >= 1e6) return "circa " + nf(v / 1e6, v >= 1e7 ? 0 : 1) + " milioni";
  return "circa " + nfi(Math.round(v / 1e4) * 1e4);
}
function updatePanel() {
  const t = state.t, gu = unitAt(GEO, t), au = unitAt(AGES, t), P = climParams(t), temp = interp(TEMP, t), co2 = interp(CO2, t), pop = popAt(t);
  const humAlive = HUMANS.filter(x => alive(x, t));
  $("whenBox").innerHTML = `<h2>Quando</h2>
    <div class="chain">${[gu, au].filter(Boolean).map(u => `<span style="background:${u.color}" title="${esc(fmtRange(u.from, u.to))}">${esc(u.name)}</span>`).join("")}</div>
    <h3>${esc(fmtAge(t))}</h3>
    ${au ? `<p>${esc(au.text)}</p>` : gu ? `<p>${esc(gu.text)}</p>` : ""}
    <dl class="facts box">
      <dt>Temperatura</dt><dd>${Math.abs(temp) < .05 ? "come nel 1850–1900" : (temp > 0 ? "+" : "−") + nf(Math.abs(temp), 1) + " °C rispetto al 1850–1900"}${t > 0.012 ? " (stima)" : ""}</dd>
      <dt>Livello del mare</dt><dd>${P.sl > -1 ? (t < yearT(1900) ? "circa 20 cm più alto che nel 1900, e sale" : "come oggi") : "circa " + nfi(-P.sl) + " m più basso di oggi"}</dd>
      <dt>CO₂ nell'aria</dt><dd>circa ${nfi(co2)} ppm${t < yearT(1950) ? " (prima dell'industria: 280)" : ""}</dd>
      ${pop ? `<dt>Esseri umani</dt><dd>${fmtPop(pop)}</dd>` : ""}
      <dt>Specie umane</dt><dd>${humAlive.length ? humAlive.map(x => x.common || x.name).join(", ") : "—"}</dd>
    </dl>`;
  // specie umane
  $("humSec").hidden = !HUMANS.length;
  $("humList").innerHTML = humAlive.concat(HUMANS.filter(x => !alive(x, t))).map(x => spButton(x, !alive(x, t))).join("");
  bindSpButtons($("humList"), humAlive.concat(HUMANS.filter(x => !alive(x, t))));
  $("humNote").textContent = humAlive.length > 1 ? `In questo momento sulla Terra vivono ${humAlive.length} specie umane diverse. Le aree colorate sul globo mostrano dove.` : "Oggi siamo rimasti soli: Homo sapiens è l'unica specie umana vivente. Nel nostro DNA però restano tracce di Neanderthal e Denisoviani.";
  // Lista Rossa (solo vicino al presente)
  const showRed = t < yearT(1700);
  $("redSec").hidden = !showRed;
  if (showRed) {
    const cnt = {}; SPECIES.forEach(x => { if (x.iucn && (alive(x, t) || x.iucn === "EX" || x.iucn === "EW")) cnt[x.iucn] = (cnt[x.iucn] || 0) + 1; });
    $("redList").innerHTML = CAT_ORDER.filter(c => cnt[c]).map(c => `<button data-c="${c}" aria-pressed="${state.fCat === c}" title="${esc(IUCN[c][0])}">${iucnBadge(c)}<b>${cnt[c]}</b>${esc(IUCN[c][0])}</button>`).join("");
    $("redList").querySelectorAll("[data-c]").forEach(b => b.onclick = () => { state.fCat = state.fCat === b.dataset.c ? null : b.dataset.c; draw(); updatePanel(); });
    $("redStats").innerHTML = statsHtml(S.stats.oggi, S.stats.estinzioni);
  }
  // eventi vicini
  const pool = state.sc ? (state.sc.steps || []).map((s, i) => ({t: s.t, title: s.title, text: s.text, step: i})) : EVENTS;
  const p = t2p(t);
  const near = pool.map(e => ({e, d: Math.abs(t2p(e.t) - p) - (e.big ? .004 : 0)})).sort((a, b) => a.d - b.d).slice(0, 6).map(o => o.e).sort((a, b) => b.t - a.t);
  $("evList").innerHTML = near.map((e, i) => `<li><button data-i="${i}"><span class="y">${esc(fmtAge(e.t, "short"))}</span><span><span class="t">${e.cat ? `<i class="cdot" style="background:${CATCOL[e.cat] || COL.accent}"></i>` : ""}${esc(e.title)}</span><span class="d">${esc(firstSentence(e.text))}</span></span></button></li>`).join("");
  $("evList").querySelectorAll("button").forEach(b => b.onclick = () => { const e = near[+b.dataset.i]; if (e.step != null) goStep(e.step); else { setTime(e.t); showEvent(e); } });
  // specie del momento
  const shown = speciesShown(t).map(o => o.x).filter(x => x.group !== "umani");
  const present = t < yearT(1700), rank = {CR: 0, EW: 1, EN: 2, VU: 3, EX: 4, NT: 5, DD: 6, LC: 7};
  shown.sort((a, b) => present ? ((rank[a.iucn] ?? 8) - (rank[b.iucn] ?? 8) || (b.star ? 1 : 0) - (a.star ? 1 : 0)) : ((b.to > 0) - (a.to > 0) || (b.star ? 1 : 0) - (a.star ? 1 : 0)));
  $("taxaTitle").textContent = present ? "Le specie di oggi" : "Chi vive in quest'epoca";
  const allAlive = SPECIES.filter(x => x.group !== "umani" && alive(x, t));
  const gc = {}; allAlive.forEach(x => gc[x.group] = (gc[x.group] || 0) + 1);
  $("grpFilt").innerHTML = `<button data-g="" aria-pressed="${!state.fGroup}">Tutti</button>` + Object.keys(GDEF).filter(k => gc[k]).map(k => `<button data-g="${k}" aria-pressed="${state.fGroup === k}">${G(k).emoji} ${esc(G(k).name)} <span style="opacity:.6">${gc[k]}</span></button>`).join("");
  $("grpFilt").querySelectorAll("[data-g]").forEach(b => b.onclick = () => { state.fGroup = b.dataset.g || null; draw(); updatePanel(); });
  const lim = taxaAll ? shown.length : (window.innerWidth > 1600 ? 18 : 12);
  $("taxaList").innerHTML = shown.slice(0, lim).map(x => spButton(x, !alive(x, t))).join("");
  bindSpButtons($("taxaList"), shown.slice(0, lim));
  const mb = $("taxaMore"); mb.hidden = shown.length <= 12; mb.textContent = taxaAll ? "Mostra meno" : `Mostra tutte (${shown.length})`;
  mb.onclick = () => { taxaAll = !taxaAll; updatePanel(); };
  $("taxaNote").textContent = shown.length ? (present ? "Il colore del bordo è lo stato di conservazione della Lista Rossa IUCN. Clicca una specie per foto, scheda, osservazioni sul globo e albero della vita." : "Clicca una specie per foto, scheda e albero della vita. In evidenza quelle che poi si estingueranno.") : "Nessuna specie con questi filtri.";
  // scienziati
  const linked = new Set();
  speciesShown(t).forEach(o => (o.x.sci || []).forEach(i => linked.add(i)));
  near.forEach(e => (e.sci || []).forEach(i => linked.add(i)));
  let ppl = PEOPLE.filter(q => linked.has(q.id));
  if (t < yearT(1700)) ppl = PEOPLE.filter(q => q.t != null && q.t >= t).sort((a, b) => Math.abs(a.t - t) - Math.abs(b.t - t)).slice(0, 8).concat(ppl);
  ppl = [...new Set(ppl)].slice(0, 8);
  $("peopleSec").hidden = !PEOPLE.length;
  $("peopleList").innerHTML = ppl.map(q => `<button data-pid="${esc(q.id)}">${phStyle(thumbUrl(q, true), "🔬")}<span><b>${esc(q.name)}</b><i>${esc(q.idea || q.field || "")}</i></span></button>`).join("") || `<p class="note">Clicca «Tutti gli scienziati» per conoscere chi ha studiato la vita.</p>`;
  bindSci($("peopleList"));
}
function phStyle(url, em, ring) { return `<span class="ph" style="${url ? `background-image:url('${esc(url)}');` : ""}${ring ? `border-color:${ring}` : ""}">${url ? "" : em}</span>`; }
function spButton(x, faded) {
  const g = G(x.group), present = state.t < yearT(1700), ring = x.group === "umani" ? x._col : present && x.iucn && IUCN[x.iucn] ? IUCN[x.iucn][1] : g.color;
  return `<button data-sp="${esc(x.id)}" title="${esc(x.name)}"${faded ? ' style="opacity:.55"' : ""}>${phStyle(thumbUrl(x), g.emoji, ring)}<span class="nm"><b>${esc(x.common || x.name)}</b><i>${esc(x.name)}</i></span>${present && x.iucn ? iucnBadge(x.iucn) : ""}</button>`;
}
function bindSpButtons(el, list) { el.querySelectorAll("[data-sp]").forEach(b => b.onclick = () => showSpecies(spById(b.dataset.sp))); }
function statsHtml(oggi, est) {
  const row = r => `<div class="stat"><b>${esc(r.value)}</b> ${esc(r.label)}${r.note ? `<div class="note" style="margin-top:2px">${esc(r.note)}</div>` : ""}${r.fonte ? `<div class="note" style="margin-top:2px">Fonte: ${esc(r.fonte)}${r.anno ? ", " + esc(r.anno) : ""}</div>` : ""}</div>`;
  const v = oggi && oggi.voci ? oggi.voci.filter(r => r && r.value) : [];
  let h = v.length ? `<h3 style="font-size:17px;margin:14px 0 0">${esc(oggi.titolo || "I numeri di oggi")}</h3>${oggi.aggiornato ? `<p class="note">Aggiornato a ${esc(oggi.aggiornato)}</p>` : ""}${v.slice(0, 5).map(row).join("")}${v.length > 5 ? `<details style="margin-top:8px"><summary>Altri numeri (${v.length - 5})</summary>${v.slice(5).map(row).join("")}</details>` : ""}` : "";
  if (est && est.testo) h += `<details style="margin-top:8px"><summary>${esc(est.titolo || "Le estinzioni")}</summary><p style="color:var(--ink)">${esc(est.testo)}</p>${est.nota ? `<p>${esc(est.nota)}</p>` : ""}${est.fonti ? `<p>Fonti: ${esc(est.fonti)}</p>` : ""}</details>`;
  return h;
}
function legend() {
  const sw = h => `<svg width="30" height="20" viewBox="0 0 30 20" aria-hidden="true">${h}</svg>`;
  $("legend").innerHTML = [
    [sw(`<circle cx="15" cy="10" r="8" fill="#9aa" stroke="#d81e05" stroke-width="3"/>`), "Specie: foto nel cerchio; il bordo è lo stato IUCN (oggi) o il gruppo (nel passato)"],
    [`<span style="display:flex;gap:2px">${CAT_ORDER.map(c => iucnBadge(c)).join("")}</span>`, ""],
    [sw(`<rect x="7" y="2" width="16" height="16" rx="4" fill="#ccc" stroke="${CATCOL.scienza}" stroke-width="2"/>`), "Scienziato o scienziata, nel luogo della scoperta"],
    [sw(`<rect x="1" y="3" width="28" height="14" rx="3" fill="#e0213a66" stroke="#e0213a"/>`), "Dove vive Homo sapiens (l'area cresce con le migrazioni)"],
    [sw(`<rect x="1" y="3" width="28" height="14" rx="3" fill="#3a86ff44" stroke="#3a86ff" stroke-dasharray="4 3"/>`), "Dove vivono le altre specie umane"],
    [sw(`<rect x="10" y="5" width="10" height="10" transform="rotate(45 15 10)" fill="#c0392b"/>`), "Evento (umani, clima, estinzioni, scienza, conservazione)"],
    [sw(`<rect x="1" y="3" width="28" height="14" rx="3" fill="#1faa5933" stroke="#1faa59" stroke-dasharray="4 3"/>`), "Punto caldo della biodiversità"],
    [sw(`<circle cx="9" cy="10" r="2.5" fill="#ff28c8"/><circle cx="17" cy="7" r="2.5" fill="#ff28c8"/><circle cx="22" cy="13" r="2.5" fill="#ff28c8"/>`), "Osservazioni GBIF della specie scelta"],
    [sw(`<rect x="1" y="3" width="28" height="14" rx="3" fill="#eef3f8" stroke="#9fbfd3"/>`), "Calotte di ghiaccio dell'ultima glaciazione"]
  ].map(([s, t]) => `<div>${s}<span>${t}</span></div>`).join("");
  const more = [S.stats.fontiUmani, S.stats.fonti].filter(Boolean);
  if (more.length) $("srcMore").textContent = more.join(" ");
}

/* ---------- linea del tempo ---------- */
const track = $("track"), thumb = $("thumb");
function buildTrack() {
  const sc = state.sc, dom = TL.domain(), d0 = dom[0], d1 = dom[dom.length - 1];
  const row = (list, el) => {
    el.innerHTML = list.filter(u => u.from > d1 && u.to < d0).map(u => { const a = t2p(Math.min(u.from, d0)), b = t2p(Math.max(u.to, d1)); return `<div style="left:${a * 100}%;width:${(b - a) * 100}%;background:${u.color}" title="${esc(u.name + " · " + fmtRange(u.from, u.to))}">${(b - a) > .07 ? esc(u.name) : (b - a) > .035 ? esc(u.name.split(" ")[0].slice(0, 6)) + "." : ""}</div>`; }).join("");
  };
  row(GEO, $("band1")); row(AGES, $("band2"));
  if (!sc) $("evdots").innerHTML = EVENTS.filter(e => e.big).map(e => `<div class="evdot" style="left:${t2p(e.t) * 100}%;background:${CATCOL[e.cat] || "#888"}" title="${esc(e.title)}"></div>`).join("");
  else $("evdots").innerHTML = (sc.steps || []).map((s, i) => `<div class="stepdot${i === state.step ? " cur" : ""}" data-step="${i}" style="left:${t2p(s.t) * 100}%" title="${esc(s.title)}"></div>`).join("");
  $("evdots").querySelectorAll("[data-step]").forEach(d => d.addEventListener("pointerdown", e => { e.stopPropagation(); goStep(+d.dataset.step); }));
  let ticks;
  if (!sc) ticks = [[T0, track.getBoundingClientRect().width < 500 ? "60 000" : "60 000 anni fa", 1], [0.03, "30 000"], [0.0117, "11 700", 1], [0.005, "5000"], [yearT(1), "anno 1", 1], [yearT(1500), "1500"], [yearT(1900), "1900"], [0, "oggi", 1]];
  else { const n = 6; ticks = d3.range(n + 1).map(i => { const tt = sc.from - (sc.from - sc.to) * i / n; return [tt, fmtUnit(tt, sc.unit), i === 0 || i === n || i === n / 2 ? 1 : 0]; }); }
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
const tEnd = () => { if (tdrag) { tdrag = false; draw(); } };
track.addEventListener("pointerup", tEnd); track.addEventListener("pointercancel", tEnd);
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
  if (state.sc) { const n = (state.sc.steps || []).length; if (n) goStep(clamp(state.step + dir, 0, n - 1)); return; }
  const p = t2p(state.t), list = EVENTS.filter(e => e.big).map(e => e.t).sort((a, b) => b - a);
  const tgt = dir > 0 ? list.find(tt => t2p(tt) > p + 1e-4) : list.slice().reverse().find(tt => t2p(tt) < p - 1e-4);
  if (tgt != null) { setTime(tgt); const ev = EVENTS.find(e => e.t === tgt && e.big); if (ev) showEvent(ev); }
}
$("prevEv").onclick = () => jumpEv(-1); $("nextEv").onclick = () => jumpEv(1);

/* ---------- tempo ---------- */
function setTime(t) {
  const dom = TL.domain(); t = clamp(t, dom[dom.length - 1], dom[0]);
  state.t = t; updateThumb(); updateHead(); draw(); schedulePanel();
  if (state.sc) syncStepToTime();
}
function updateHead() {
  const t = state.t, gu = unitAt(GEO, t), au = unitAt(AGES, t);
  $("eraLabel").innerHTML = gu ? `<i style="background:${(au || gu).color}"></i>${esc([gu.name, au && au.name].filter(Boolean).join(" · "))}` : "";
  $("yearLabel").textContent = fmtAge(t);
  const P = climParams(t);
  $("subLabel").textContent = P.sl < -60 ? `Era glaciale: il mare è ${nfi(-P.sl)} m più basso di oggi e grandi calotte coprono il nord.` : P.sl < -15 ? `Il ghiaccio si scioglie: il mare sale (oggi −${nfi(-P.sl)} m).` : P.green > .3 ? "Il Sahara è verde: savane, laghi e fiumi dove oggi c'è il deserto." : t < yearT(1950) ? "La «grande accelerazione»: popolazione, consumi e perdita di natura crescono rapidamente." : "";
  $("subLabel").classList.remove("warn");
}

/* ---------- riproduzione ---------- */
let playRaf = 0, lastTs = 0;
const SPEEDS = [.25, .5, 1, 2, 4, 8];
let speedI = 2;
function play() {
  if (state.playing) { stopPlay(); return; }
  if (t2p(state.t) >= .999) setTime(p2t(0));
  state.playing = true; $("playIcon").innerHTML = '<path d="M3 2h4v12H3zM9 2h4v12H9z"/>'; $("play").setAttribute("aria-label", "Pausa");
  lastTs = performance.now();
  const step = now => {
    if (!state.playing) return;
    const dt = Math.min(.1, (now - lastTs) / 1000); lastTs = now;
    const p = t2p(state.t) + (state.sc ? .035 : .018) * SPEEDS[speedI] * dt;
    setTime(p2t(p));
    if (p >= 1) { stopPlay(); return; }
    playRaf = requestAnimationFrame(step);
  };
  playRaf = requestAnimationFrame(step);
}
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
function stopPlay() { const was = state.playing; state.playing = false; if (playRaf) cancelAnimationFrame(playRaf); playRaf = 0; $("playIcon").innerHTML = '<path d="M4 2l10 6-10 6z"/>'; $("play").setAttribute("aria-label", "Avvia"); if (was) draw(); }
$("play").onclick = play;

/* ---------- scenari ---------- */
function openScenChooser() {
  stopPlay();
  const box = $("scenList");
  box.innerHTML = SCENARI.length ? `<section><div class="ch-grid">${SCENARI.map((s, i) => `<button class="ch-card" data-i="${i}" style="--cc:${s.color || "var(--accent)"}"><span class="ch-sw"></span><span class="ch-name">${esc(s.title)}</span><span class="ch-when">${esc(fmtUnit(s.from, s.unit))} → ${esc(s.to <= 2e-7 ? "oggi" : fmtUnit(s.to, s.unit))}</span><span class="ch-intro">${esc(s.sub || firstSentence(s.intro))}</span></button>`).join("")}</div></section>` : `<p class="note">Gli scenari non sono disponibili.</p>`;
  box.querySelectorAll(".ch-card").forEach(b => b.onclick = () => { closeChooser("scenChooser"); enterScenario(SCENARI[+b.dataset.i]); });
  $("scenChooser").hidden = false; const f = box.querySelector(".ch-card"); if (f) f.focus();
}
function closeChooser(id) { $(id).hidden = true; }
document.querySelectorAll(".chooser").forEach(ch => ch.addEventListener("click", e => { if (e.target === ch || e.target.closest("[data-close]")) ch.hidden = true; }));
document.addEventListener("keydown", e => { if (e.key === "Escape") { document.querySelectorAll(".chooser").forEach(ch => ch.hidden = true); $("lightbox").hidden = true; } });
$("scenBtn").onclick = openScenChooser;
function enterScenario(sc) {
  stopPlay(); closeSel();
  state.sc = sc; state.step = -1;
  TL = d3.scaleLinear().domain([sc.from, sc.to]).range([0, 1]).clamp(true);
  $("scBar").hidden = false; $("scBarT").textContent = sc.title;
  $("tlHint").innerHTML = `<span>Scenario: ${esc(sc.title)} · da ${esc(fmtUnit(sc.from, sc.unit))} a ${esc(sc.to <= 2e-7 ? "oggi" : fmtUnit(sc.to, sc.unit))}</span><span>I cerchi sulla linea sono le tappe della visita</span>`;
  buildTrack(); renderScenBox(); goStep(0);
}
function exitScenario() {
  if (!state.sc) return;
  const t = state.t;
  state.sc = null; state.step = -1;
  TL = d3.scaleLinear().domain(MAIN_DOM).range(MAIN_RNG).clamp(true);
  $("scBar").hidden = true; $("scenBox").hidden = true; $("scenBox").innerHTML = "";
  $("tlHint").innerHTML = `<span>Trascina il globo per farlo girare e il cursore per viaggiare nel tempo</span><span>La scala non è uniforme: gli ultimi secoli sono allargati</span>`;
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
    ${s ? `<div class="sci" style="font-style:normal">${esc(fmtAge(s.t))}</div><p>${esc(s.text)}</p>` : `<p>${esc(sc.intro || "")}</p>`}
    <div class="stepnav"><button id="stPrev" ${i <= 0 ? "disabled" : ""}>‹ Precedente</button><button id="stNext" class="pri" ${i >= st.length - 1 ? "disabled" : ""}>Successiva ›</button></div>
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
  setTime(s.t);
  if (s.view) { const [lon, lat, z] = s.view; flyTo(lon, lat, z ? clamp(z, .9, 8) : 1.2); }
  renderScenBox(); buildTrack(); updateThumb();
  if (window.innerWidth <= 860) $("scenBox").scrollIntoView({behavior: "smooth", block: "nearest"}); else $("panel").scrollTo({top: 0, behavior: "smooth"});
}
function syncStepToTime() {
  const st = state.sc.steps || []; let k = -1;
  for (let i = 0; i < st.length; i++) if (st[i].t >= state.t - 1e-12) k = i;
  if (k !== state.step && k >= 0 && !tdrag && !state.playing) return;
  if (k !== state.step && k >= 0) { state.step = k; renderScenBox(); $("evdots").querySelectorAll(".stepdot").forEach((d, i) => d.classList.toggle("cur", i === k)); }
}

/* ---------- oggi: la biodiversità ---------- */
$("todayBtn").onclick = () => {
  if (state.sc) exitScenario();
  stopPlay(); closeSel(); setTime(0);
  if (!state.layers.species) { state.layers.species = true; $("l-species").checked = true; }
  flyTo(20, 5, 1);
  setTimeout(() => { const r = $("redSec"); if (window.innerWidth <= 860) r.scrollIntoView({behavior: "smooth", block: "start"}); else $("panel").scrollTo({top: r.offsetTop - 10, behavior: "smooth"}); }, 120);
};

/* ---------- scienziati ---------- */
// anno di nascita (se manca, stimato dall'anno della scoperta)
function bornY(p) { return p.born || (p.t != null ? Math.round(2026 - p.t * 1e6) - 40 : 3000); }
function openPeopleChooser() {
  stopPlay();
  const box = $("peopleAll");
  const by = {};
  PEOPLE.forEach(p => { const c = bornY(p) < 1700 ? "Prima di Linneo" : bornY(p) < 1800 ? "Settecento" : bornY(p) < 1870 ? "Ottocento" : bornY(p) < 1930 ? "Novecento" : "Oggi"; (by[c] || (by[c] = [])).push(p); });
  box.innerHTML = Object.keys(by).map(c => `<section><h3>${esc(c)}</h3><div class="ch-grid">${by[c].map(p => { const u = thumbUrl(p, true); return `<button class="ch-card" data-pid="${esc(p.id)}" style="--cc:${CATCOL.scienza}">${u ? `<span class="ph" style="background-image:url('${esc(u)}')"></span>` : `<span class="ch-sw"></span>`}<span class="ch-name">${esc(p.name)}</span><span class="ch-when">${esc(lifeYears(p))}</span><span class="ch-intro">${esc(p.idea || p.field || "")}</span></button>`; }).join("")}</div></section>`).join("") || `<p class="note">Nessuno scienziato disponibile.</p>`;
  box.querySelectorAll("[data-pid]").forEach(b => b.onclick = () => { closeChooser("peopleChooser"); const p = PBYID.get(b.dataset.pid); if (state.sc) exitScenario(); if (p.t != null) setTime(p.t); showPerson(p); });
  $("peopleChooser").hidden = false; const f = box.querySelector(".ch-card"); if (f) f.focus();
}
$("peopleBtn").onclick = openPeopleChooser; $("peopleMore").onclick = openPeopleChooser;

/* ---------- ambienti 3D ---------- */
function loadThree() {
  if (window.THREE) return true;
  const src = $("threeSrc"); if (!src || !src.textContent.trim()) return false;
  const s = document.createElement("script"); s.textContent = src.textContent; document.head.appendChild(s);
  return !!window.THREE;
}
function openEnvChooser() {
  stopPlay();
  const PE = window.PaleoEnv, box = $("envList");
  if (!PE || !PE.list) { box.innerHTML = `<p class="note">Gli ambienti 3D non sono disponibili.</p>`; $("envChooser").hidden = false; return; }
  const now = PE.list.filter(e => e.now), past = PE.list.filter(e => !e.now && e.to < 0.2).sort((a, b) => b.ma - a.ma);
  const card = e => `<button class="ch-card" data-env="${esc(e.id)}" style="--cc:${e.color || "var(--accent)"}"><span class="ch-sw"></span><span class="ch-name">${esc(e.name)}</span><span class="ch-when">${esc(e.now ? e.place : (e.when || "") + " · " + (e.place || ""))}</span><span class="ch-intro">${esc(e.intro || "")}</span></button>`;
  box.innerHTML = (now.length ? `<section><h3>Ecosistemi di oggi</h3><div class="ch-grid">${now.map(card).join("")}</div></section>` : "") + `<section><h3>Il passato recente</h3><div class="ch-grid">${past.map(card).join("")}</div></section><p class="note" style="margin-top:14px">Altri paesaggi di epoche più antiche (dinosauri, foreste del Carbonifero, Ediacara…) sono nel globo <a href="index.html">«Vita in Tempore»</a>.</p>`;
  box.querySelectorAll(".ch-card").forEach(b => b.onclick = () => openEnv(b.dataset.env));
  $("envChooser").hidden = false; const f = box.querySelector(".ch-card"); if (f) f.focus();
}
function openEnv(id) {
  closeChooser("envChooser");
  try { loadThree(); } catch (e) { alert("Questo dispositivo non riesce a caricare il motore 3D."); return; }
  try {
    window.PaleoEnv.open(id, {
      onExit: () => resize(),
      onShowOnMap: (lat, lon, ma) => { if (ma != null) { if (state.sc) exitScenario(); setTime(Math.min(T0, ma)); } flyTo(lon, lat, 2.4); },
      onSpecies: sid => { const x = BYID.get(sid); if (!x) return; if (state.sc) exitScenario(); if (!alive(x, state.t)) setTime(x.to > 0 ? x.to + .0005 : 0); showSpecies(x); }
    });
  } catch (e) { console.error(e); alert("Questo dispositivo non riesce a mostrare il paesaggio in 3D (serve WebGL)."); }
}
$("envBtn").onclick = openEnvChooser;
if (!window.PaleoEnv) $("envBtn").hidden = true;

/* ---------- avvio ---------- */
async function start() {
  readCols(); legend();
  const mq = matchMedia("(prefers-color-scheme: dark)");
  if (mq.addEventListener) mq.addEventListener("change", () => { readCols(); draw(); });
  new ResizeObserver(() => resize()).observe($("mapwrap"));
  buildTrack();
  const q = new URLSearchParams(location.search), qt = parseFloat(q.get("t"));
  resize();
  setTime(isFinite(qt) ? qt : 0.05);
  try { await Promise.all([loadTerra(), loadBM()]); } catch (e) { console.warn("Dati del globo non disponibili", e); }
  TEX.key = ""; draw();
  $("loading").hidden = true;
  const qc = q.get("cerca"); if (qc && window.Cerca) showSearch({sci: qc, label: qc});
  const qp = q.get("persona") && PBYID.get(q.get("persona")); if (qp) { if (qp.t != null) setTime(qp.t); showPerson(qp); }
  const qs = q.get("specie") && BYID.get(q.get("specie")); if (qs) { setTime(qs.to > 0 ? Math.min(T0, qs.to + .0005) : 0); showSpecies(qs); }
  const qa = q.get("ambiente"); if (qa && window.PaleoEnv) openEnv(qa);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => draw());
  window.addEventListener("resize", () => { buildTrack(); updateThumb(); });
}
start();
})();
