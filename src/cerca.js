/* =====================================================================
   Ricerca di una specie o di un genere qualsiasi (comune ai due globi).
   Fonti, interrogate dal browser:
   - Wikidata: nomi italiani → nome scientifico (proprietà P225)
   - GBIF: nomi scientifici, classificazione, stato IUCN, osservazioni per continente
   - Paleobiology Database: prima (e ultima) comparsa nei fossili
   - Open Tree of Life (TNRS): identificativo OTT per OneZoom
   - Wikipedia: immagine e riassunto
   ===================================================================== */
window.Cerca = (() => {
  "use strict";
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
  const getJ = async (u, o) => { const r = await fetch(u, o); if (!r.ok) throw new Error(r.status); return r.json(); };
  const RANK = {KINGDOM: "Regno", PHYLUM: "Phylum", CLASS: "Classe", ORDER: "Ordine", FAMILY: "Famiglia", GENUS: "Genere", SPECIES: "Specie", SUBSPECIES: "Sottospecie", VARIETY: "Varietà"};
  const KING = {Animalia: "Animali", Plantae: "Piante", Fungi: "Funghi", Bacteria: "Batteri", Archaea: "Archei", Chromista: "Cromisti (alghe brune, diatomee…)", Protozoa: "Protozoi", Viruses: "Virus"};
  const CONT = {AFRICA: "Africa", ANTARCTICA: "Antartide", ASIA: "Asia", EUROPE: "Europa", NORTH_AMERICA: "Nord America", OCEANIA: "Oceania", SOUTH_AMERICA: "Sud America"};
  const CONT_LL = {AFRICA: [20, 5], ANTARCTICA: [0, -80], ASIA: [95, 35], EUROPE: [15, 50], NORTH_AMERICA: [-100, 45], OCEANIA: [140, -20], SOUTH_AMERICA: [-60, -15]};
  const IUCN = {EX: ["Estinta", "#000000"], EW: ["Estinta in natura", "#542344"], CR: ["In pericolo critico", "#d81e05"], EN: ["In pericolo", "#fc7f3f"], VU: ["Vulnerabile", "#f9e814"], NT: ["Quasi minacciata", "#cce226"], LC: ["Minor preoccupazione", "#60c659"], DD: ["Dati insufficienti", "#d1d1c6"]};
  /* ---------- immagini adatte alla scuola ----------
     Alcune voci di Wikipedia mostrano persone nude (per esempio la voce italiana «Homo sapiens»).
     SAFE sostituisce l'immagine per nome scientifico; badImg scarta i file con nomi o didascalie che indicano nudità. */
  const C = "https://upload.wikimedia.org/wikipedia/commons/thumb/";
  const SAFE = {
    "Homo sapiens": {img: C + "6/68/Akha_cropped_hires.JPG/500px-Akha_cropped_hires.JPG", thumb: C + "6/68/Akha_cropped_hires.JPG/330px-Akha_cropped_hires.JPG", url: "https://commons.wikimedia.org/wiki/File:Akha_cropped_hires.JPG", lang: "commons", cap: "Una coppia akha nel nord della Thailandia"}
  };
  const BAD = /FKK|nudis|naturis|nudit|nudes?\b|\bnud[aeio]\b|_nud[aeio][_.]|naked|nackt|desnud|topless|genital|penis|vulva|pubic|erotic/i;
  const badImg = s => !!s && BAD.test(decodeURIComponent(String(s)));
  const safeImg = name => SAFE[name] || null;

  /* ---------- ricostruzioni di come apparivano le altre specie umane ----------
     Scelte a mano su Wikimedia Commons (licenze libere), solo teste o figure vestite.
     Autori: fratelli Kennis (Neanderthal Museum), John Gurche (Smithsonian), Cicero Moraes (approssimazioni facciali forensi pubblicate). */
  const REC = {
    "Homo neanderthalensis": [
      {f: "Neanderthal man reconstruction, Natural History Museum, London.jpg", cap: "Testa di un uomo di Neanderthal, ricostruzione esposta al Natural History Museum di Londra", cr: "Foto Werner Ustorf · CC BY-SA 2.0"},
      {f: "Homo sapiens neanderthalensis-Mr. N.jpg", cap: "«Mr. N», ricostruzione a grandezza naturale del Neanderthal Museum di Mettmann (Germania), vicino al luogo del primo ritrovamento", cr: "Neanderthal Museum · CC BY-SA 4.0"},
      {f: "Homo sapiens neanderthalensis-Jäger.jpg", cap: "Cacciatore neanderthaliano vestito di pelli, Neanderthal Museum di Mettmann", cr: "Neanderthal Museum · CC BY-SA 4.0"}],
    "Homo longi": [
      {f: "Homo longi - forensic facial approximation.jpg", cap: "Approssimazione facciale del cranio di Harbin («uomo drago»), attribuito ai Denisoviani nel 2025", cr: "Cicero Moraes · CC BY 4.0"},
      {f: "Homo longi - forensic facial approximation 2.jpg", cap: "Lo stesso volto di profilo: si notano le arcate sopra gli occhi e il viso largo", cr: "Cicero Moraes · CC BY 4.0"}],
    "Homo floresiensis": [
      {f: "Homo floresiensis v 2-0.jpg", cap: "Approssimazione facciale dello scheletro LB1 di Liang Bua (versione 2.0), realizzata per la mostra «Facce. I molti volti della storia umana»", cr: "Cicero Moraes e collaboratori · CC BY 4.0"},
      {f: "Homo floresiensis - facial approximation - color 1.jpg", cap: "Un'altra versione dello stesso volto, ricostruita in 3D a partire dal cranio", cr: "Cicero Moraes · CC BY-SA 4.0"}],
    "Homo luzonensis": {none: "Non mostriamo ricostruzioni: di questa specie si conoscono solo denti e poche ossa di mani e piedi, nessun cranio. Qualsiasi volto sarebbe inventato."},
    "Homo erectus": [
      {f: "Homo.erectus.adult.female.smithsonian.timevanson.flickr.jpg", cap: "Volto di una donna Homo erectus, ricostruzione di John Gurche per lo Smithsonian (Washington)", cr: "Foto Tim Evanson · CC BY-SA 2.0"},
      {f: "Homo-erectus Turkana-Boy (Ausschnitt) Fundort Nariokotome, Kenia, Rekonstruktion im Neanderthal Museum.jpg", cap: "Il «ragazzo del Turkana» (Kenya, circa 1,5 milioni di anni fa), ricostruzione di Kennis & Kennis per il Neanderthal Museum", cr: "Neanderthal Museum · CC BY-SA 4.0"},
      {f: "Homo erectus reconstruction, Natural History Museum, London.jpg", cap: "Testa di Homo erectus esposta al Natural History Museum di Londra", cr: "Foto Werner Ustorf · CC BY-SA 2.0"}],
    "Paranthropus": [
      {f: "Paranthropus boisei facial reconstruction at the Smithsonian National Museum of Natural History.jpg", cap: "Paranthropus boisei, ricostruzione di John Gurche per lo Smithsonian: notate le guance larghe e la mascella enorme", cr: "Foto Ryan Schwark · CC0"},
      {f: "Paranthropus boisei - forensic facial reconstruction.png", cap: "Paranthropus boisei, approssimazione facciale basata sulla scansione 3D di un cranio", cr: "Cicero Moraes · CC BY-SA 4.0"}],
    "Homo habilis": [{f: "Homo habilis - forensic facial reconstruction.png", cap: "Approssimazione facciale di Homo habilis", cr: "Cicero Moraes · CC BY-SA 4.0"}],
    "Homo heidelbergensis": [{f: "Homo heidelbergensis - forensic facial reconstruction.png", cap: "Dal cranio al volto, passo dopo passo: così si costruisce un'approssimazione facciale (Homo heidelbergensis)", cr: "Cicero Moraes · CC BY-SA 4.0"}],
    "Homo naledi": [{f: "Homo naledi facial reconstruction.jpg", cap: "Approssimazione facciale di Homo naledi, dai crani della grotta Rising Star (Sudafrica)", cr: "Cicero Moraes e collaboratori · CC BY 4.0"}],
    "Australopithecus afarensis": [{f: "Lucy - Australopithecus afarensis - forensic facial approximation.jpg", cap: "Approssimazione facciale di Lucy", cr: "Cicero Moraes · CC BY 4.0"}]
  };
  REC["Homo sp. (Denisova)"] = REC["Homo longi"];
  const FP = (f, w) => "https://commons.wikimedia.org/wiki/Special:FilePath/" + encodeURIComponent(f) + "?width=" + w;
  const REC_NOTE = "Sono ricostruzioni, non ritratti. Si parte dal cranio fossile e si aggiungono muscoli e spessori della pelle misurati negli esseri umani e nelle grandi scimmie di oggi: per questo la forma del viso è credibile. Colore di pelle, occhi e capelli, peli, espressione e vestiti sono invece in gran parte ipotesi (per i Neanderthal qualche indizio viene dal DNA). Artisti diversi ottengono volti un po' diversi dallo stesso cranio.";
  function reconHtml(name) {
    const r = REC[name]; if (!r) return "";
    if (r.none) return `<div class="rc"><div class="rc-h">Come poteva apparire?</div><p class="rc-w">${esc(r.none)}</p></div>`;
    return `<div class="rc"><div class="rc-h">Come poteva apparire: ricostruzioni</div><div class="rc-g">${r.map((m, i) => `<button data-rc="${i}" data-rn="${esc(name)}" title="${esc(m.cap)}" style="background-image:url('${esc(FP(m.f, 330))}')"><span class="sr">${esc(m.cap)}</span></button>`).join("")}</div><p class="rc-w">⚠️ ${esc(REC_NOTE)} Clicca un'immagine per ingrandirla e leggere chi l'ha realizzata.</p></div>`;
  }
  let rcCss = false;
  function bindRecon(box) {
    if (!rcCss) { rcCss = true; const st = document.createElement("style"); st.textContent = `.rc{margin:10px 0 0;padding:8px 10px;border:1px solid var(--line);border-radius:8px}.rc-h{font-weight:700;font-size:14px}.rc-g{display:flex;gap:6px;overflow-x:auto;margin:6px 0 2px;padding-bottom:4px;scrollbar-width:thin}.rc-g button{flex:none;width:96px;height:112px;border:1px solid var(--line);border-radius:7px;padding:0;background:#0003 center/cover no-repeat;cursor:zoom-in}.rc-w{font-size:12.5px;color:var(--muted);margin:4px 0 0;line-height:1.45}.rc .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)}
.rc-lb{position:fixed;inset:0;z-index:200;background:#000d;display:grid;place-items:center;padding:16px;cursor:zoom-out}.rc-lb figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:8px;max-width:100%;max-height:100%}.rc-lb img{max-width:min(1000px,100%);max-height:calc(100vh - 130px);object-fit:contain;border-radius:6px;background:#222}.rc-lb figcaption{color:#e6e6e6;font-size:13px;text-align:center;max-width:720px;line-height:1.45}.rc-lb a{color:#ffc9a6}
@media (min-width:1600px) and (min-height:900px){.rc-g button{width:130px;height:150px}.rc-h{font-size:17px}.rc-w{font-size:15px}.rc-lb figcaption{font-size:16px}}`; document.head.appendChild(st); }
    box.querySelectorAll("[data-rc]").forEach(b => b.onclick = () => {
      const m = REC[b.dataset.rn][+b.dataset.rc], lb = document.createElement("div"); lb.className = "rc-lb";
      lb.innerHTML = `<figure><img src="${esc(FP(m.f, 960))}" alt="${esc(m.cap)}"><figcaption>${esc(m.cap)}<br><b>Ricostruzione, non ritratto:</b> forma del viso credibile, colori e capelli ipotetici.<br>${esc(m.cr)} · <a href="https://commons.wikimedia.org/wiki/File:${esc(encodeURIComponent(m.f.replace(/ /g, "_")))}" target="_blank" rel="noopener">fonte e licenza</a></figcaption></figure>`;
      const close = () => { lb.remove(); document.removeEventListener("keydown", kd); }, kd = e => { if (e.key === "Escape") close(); };
      lb.addEventListener("click", e => { if (e.target.tagName !== "A") close(); }); document.addEventListener("keydown", kd);
      document.body.appendChild(lb);
    });
  }
  const nf =(v, d) => new Intl.NumberFormat("it-IT", {maximumFractionDigits: d, minimumFractionDigits: 0}).format(v);
  const fmtMa = ma => ma >= 1000 ? nf(ma / 1000, 2) + " miliardi di anni fa" : ma >= 1 ? nf(ma, ma >= 100 ? 0 : ma >= 10 ? 1 : 2) + " milioni di anni fa" : ma > 0.0117 ? nf(Math.round(ma * 1e6 / 1000) * 1000, 0) + " anni fa" : ma > 0 ? nf(Math.round(ma * 1e6 / 100) * 100, 0) + " anni fa" : "oggi";

  /* ---------- suggerimenti mentre si scrive ---------- */
  async function wikidataSuggest(q) {
    try {
      const s = await getJ(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(q)}&language=it&uselang=it&type=item&limit=12&format=json&origin=*`);
      const ids = (s.search || []).map(x => x.id); if (!ids.length) return [];
      const e = await getJ(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${ids.join("|")}&props=claims|sitelinks|labels|descriptions&languages=it|en&sitefilter=itwiki|enwiki&format=json&origin=*`);
      const out = [];
      for (const id of ids) {
        const it = e.entities && e.entities[id]; if (!it || !it.claims || !it.claims.P225) continue;
        const sci = it.claims.P225[0].mainsnak.datavalue && it.claims.P225[0].mainsnak.datavalue.value; if (!sci) continue;
        const lab = it.labels && (it.labels.it || it.labels.en);
        const d = it.descriptions && (it.descriptions.it || it.descriptions.en);
        out.push({kind: "taxon", sci, label: lab && lab.value.toLowerCase() !== sci.toLowerCase() ? lab.value : sci, sub: d ? d.value : "", wikiIt: it.sitelinks && it.sitelinks.itwiki && it.sitelinks.itwiki.title, wikiEn: it.sitelinks && it.sitelinks.enwiki && it.sitelinks.enwiki.title, qid: id});
      }
      return out;
    } catch (e) { return []; }
  }
  async function gbifSuggest(q) {
    try {
      const a = await getJ(`https://api.gbif.org/v1/species/suggest?q=${encodeURIComponent(q)}&limit=8&datasetKey=d7dddbf4-2cf0-4f39-9b2a-bb099caae36c`);
      return a.filter(x => RANK[x.rank]).map(x => ({kind: "taxon", sci: x.canonicalName || x.scientificName, label: x.canonicalName || x.scientificName, sub: (RANK[x.rank] || x.rank) + (x.family ? " · " + x.family : x.order ? " · " + x.order : x.class ? " · " + x.class : ""), gbif: x.key}));
    } catch (e) { return []; }
  }
  function attach(o) {
    const inp = o.input, box = o.list;
    let timer = 0, seq = 0, items = [], cur = -1;
    const render = () => {
      box.hidden = !items.length;
      box.innerHTML = items.map((r, i) => `<li role="option" id="cerca-o${i}" aria-selected="${i === cur}"><button type="button" data-i="${i}" tabindex="-1">${r.emoji ? `<span class="em">${r.emoji}</span>` : ""}<span><b>${esc(r.label)}</b>${r.sci && r.label !== r.sci ? ` <i>${esc(r.sci)}</i>` : ""}<small>${esc(r.sub || "")}</small></span></button></li>`).join("");
      inp.setAttribute("aria-expanded", items.length ? "true" : "false");
      if (cur >= 0) inp.setAttribute("aria-activedescendant", "cerca-o" + cur); else inp.removeAttribute("aria-activedescendant");
      box.querySelectorAll("[data-i]").forEach(b => b.addEventListener("mousedown", e => { e.preventDefault(); choose(+b.dataset.i); }));
    };
    const choose = i => {
      const r = items[i]; if (!r || r.wait) return;
      items = []; cur = -1; render(); inp.blur();
      if (r.pick) r.pick(); else o.onPick(r);
    };
    const run = async () => {
      const q = inp.value.trim(), my = ++seq;
      if (q.length < 2) { items = []; render(); return; }
      const loc = (o.local ? o.local(q) : []).slice(0, 6);
      items = loc.concat([{label: "Cerco…", sub: "Wikidata e GBIF", wait: true}]); cur = -1; render();
      const [wd, gb] = await Promise.all([wikidataSuggest(q), gbifSuggest(q)]);
      if (my !== seq) return;
      const seen = new Set(loc.map(r => (r.sci || "").toLowerCase()));
      const add = [];
      for (const r of wd.concat(gb)) { const k = r.sci.toLowerCase(); if (seen.has(k)) { const w = add.find(a => a.sci.toLowerCase() === k); if (w && r.gbif) w.gbif = r.gbif; continue; } seen.add(k); add.push(r); }
      items = loc.concat(add).slice(0, 12);
      if (!items.length) items = [{label: "Nessun risultato", sub: "Prova con il nome scientifico (es. Panthera) o un altro nome italiano", wait: true}];
      render();
    };
    inp.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(run, 280); });
    inp.addEventListener("focus", () => { if (inp.value.trim().length >= 2 && !items.length) run(); });
    inp.addEventListener("blur", () => setTimeout(() => { items = []; cur = -1; render(); }, 150));
    inp.addEventListener("keydown", e => {
      if (e.key === "ArrowDown" && items.length) { e.preventDefault(); cur = (cur + 1) % items.length; render(); }
      else if (e.key === "ArrowUp" && items.length) { e.preventDefault(); cur = (cur - 1 + items.length) % items.length; render(); }
      else if (e.key === "Enter") { e.preventDefault(); const i = cur >= 0 ? cur : items.findIndex(r => !r.wait); if (i >= 0 && !items[i].wait) choose(i); else run(); }
      else if (e.key === "Escape") { items = []; render(); }
    });
  }

  /* ---------- informazioni complete su un taxon ---------- */
  async function pbdb(name) {
    try {
      const j = await getJ(`https://paleobiodb.org/data1.2/taxa/single.json?name=${encodeURIComponent(name)}&show=app`);
      const r = j.records && j.records[0];
      if (!r) return null;
      if (r.fea == null) return {name, none: true, extant: r.ext == 1};
      return {name, fea: +r.fea, fla: +r.fla, lea: r.lea != null ? +r.lea : null, lla: r.lla != null ? +r.lla : null, extant: r.ext == 1, noc: r.noc};
    } catch (e) { return null; }
  }
  async function wikiSum(title, lang) {
    if (!title) return null;
    try {
      const j = await getJ(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}?redirect=true`);
      if (j.type === "disambiguation") return null;
      if (/^(Homo sapiens|Human|Humans|Essere umano|Umano)$/i.test(j.title)) return Object.assign({title: j.title, extract: j.extract, url: j.content_urls && j.content_urls.desktop.page, lang}, SAFE["Homo sapiens"]);
      let img = j.thumbnail && j.thumbnail.source;
      if (badImg(img)) img = null;
      if (img && /\/\d+px-/.test(img) && j.originalimage && j.originalimage.width > 500) img = img.replace(/\/\d+px-/, "/500px-");
      return {title: j.title, img, thumb: j.thumbnail && j.thumbnail.source, extract: j.extract, url: j.content_urls && j.content_urls.desktop.page, lang};
    } catch (e) { return null; }
  }
  async function info(r) {
    const name = r.sci;
    let m = null;
    try { m = await getJ(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`); } catch (e) {}
    const key = r.gbif || (m && m.matchType !== "NONE" ? (m.acceptedUsageKey || m.usageKey) : null);
    let sp = null;
    if (key) { try { sp = await getJ(`https://api.gbif.org/v1/species/${key}`); } catch (e) {} }
    const rank = (sp && sp.rank) || (m && m.rank) || "";
    const canon = (sp && sp.canonicalName) || (m && m.canonicalName) || name;
    const cls = ["kingdom", "phylum", "class", "order", "family", "genus"].map(k => ({k, v: (sp && sp[k]) || (m && m[k])})).filter(x => x.v && x.v !== canon);
    // prima comparsa: il taxon cercato e i gruppi che lo contengono
    const chain = [{k: rank.toLowerCase(), v: canon}].concat(cls.slice().reverse().filter(x => /genus|family|order|class|phylum/.test(x.k)));
    const [fos, occ, iu, ott, wp] = await Promise.all([
      Promise.all(chain.map(c => pbdb(c.v).then(p => p && Object.assign(p, {rank: c.k})))),
      key ? getJ(`https://api.gbif.org/v1/occurrence/search?taxonKey=${key}&limit=0&facet=continent&facetLimit=8`).catch(() => null) : null,
      key && /SPECIES/.test(rank) ? getJ(`https://api.gbif.org/v1/species/${key}/iucnRedListCategory`).catch(() => null) : null,
      fetch("https://api.opentreeoflife.org/v3/tnrs/match_names", {method: "POST", headers: {"content-type": "application/json"}, body: JSON.stringify({names: [canon]})}).then(x => x.json()).then(j => { const mm = j.results && j.results[0] && j.results[0].matches && j.results[0].matches[0]; return mm ? mm.taxon.ott_id : null; }).catch(() => null),
      (async () => (r.wikiIt && await wikiSum(r.wikiIt, "it")) || await wikiSum(canon, "it") || (r.wikiEn && await wikiSum(r.wikiEn, "en")) || await wikiSum(canon, "en"))()
    ]);
    let img = wp;
    if (wp && (!wp.img || badImg(wp.img))) { const en = await wikiSum(r.wikiEn || canon, "en"); img = en && en.img && !badImg(en.img) ? en : null; }
    if (SAFE[canon]) img = SAFE[canon];
    const cont = occ && occ.facets && occ.facets[0] ? occ.facets[0].counts.map(c => ({k: c.name, n: c.count})) : [];
    return {
      sci: canon, author: sp && sp.authorship, label: r.label && r.label !== canon ? r.label : (wp && wp.lang === "it" && wp.title.toLowerCase() !== canon.toLowerCase() ? wp.title : null),
      rank, kingdom: (sp && sp.kingdom) || (m && m.kingdom), cls, gbif: key,
      fossils: (fos || []).filter(Boolean), occN: occ ? occ.count : null, cont,
      iucn: iu && iu.code && IUCN[iu.code] ? iu.code : null, ott, wp, img
    };
  }
  // prima comparsa più affidabile del taxon (o del gruppo più piccolo che lo contiene), in Ma
  function firstAppearance(inf) { const f = inf.fossils.find(x => !x.none); return f ? (f.fea + f.fla) / 2 : null; }
  function contCenter(inf) { const c = (inf.cont || []).find(x => CONT_LL[x.k] && x.k !== "ANTARCTICA"); return c ? CONT_LL[c.k] : null; }

  /* ---------- scheda ---------- */
  function cardHtml(inf, o) {
    o = o || {};
    const RK = RANK[inf.rank] || "Taxon", king = KING[inf.kingdom] || inf.kingdom || "";
    const self = inf.fossils.find(f => f.rank === (inf.rank || "").toLowerCase());
    const extinct = self && self.extant === false;
    const fosRows = inf.fossils.filter(f => !f.none).map(f => {
      const rk = RANK[f.rank.toUpperCase()] || f.rank, a = f.fea, b = f.fla;
      const when = Math.abs(a - b) < Math.max(.05, a * .15) ? "circa " + fmtMa((a + b) / 2) : `tra ${fmtMa(a).replace(/ fa$/, "")} e ${fmtMa(b)}`;
      return `<li><span class="rk">${esc(rk)}</span> <i>${esc(f.name)}</i>: ${esc(when)}${f.extant === false && f.lla != null ? ` · ultimi fossili ${esc(fmtMa(f.lla))}` : ""}${o.goTime ? ` <button class="lnk" data-go="${(a + b) / 2}">⏱ vai</button>` : ""}</li>`;
    }).join("");
    const noSelf = !self || self.none;
    const totC = inf.cont.reduce((s, c) => s + c.n, 0);
    const contRows = inf.cont.filter(c => CONT[c.k]).map(c => `<li><span>${esc(CONT[c.k])}</span><span class="bar"><i style="width:${Math.max(3, Math.round(100 * c.n / Math.max(1, inf.cont[0].n)))}%"></i></span><span class="n">${nf(c.n, 0)}</span></li>`).join("");
    const L = [];
    if (inf.wp) L.push(`<a href="${esc(inf.wp.url)}" target="_blank" rel="noopener">📖 Wikipedia${inf.wp.lang === "en" ? " (inglese)" : ""}</a>`);
    if (inf.ott) L.push(`<a href="https://tree.opentreeoflife.org/opentree/argus/ottol@${inf.ott}" target="_blank" rel="noopener">🌲 Open Tree of Life</a>`);
    if (inf.gbif) L.push(`<a href="https://www.gbif.org/species/${inf.gbif}" target="_blank" rel="noopener">🗺️ GBIF</a>`);
    if (inf.iucn || /SPECIES/.test(inf.rank)) L.push(`<a href="https://www.iucnredlist.org/search?query=${encodeURIComponent(inf.sci)}&searchType=species" target="_blank" rel="noopener">🟥 Lista Rossa IUCN</a>`);
    L.push(`<a href="https://paleobiodb.org/classic/checkTaxonInfo?taxon_name=${encodeURIComponent(inf.sci)}" target="_blank" rel="noopener">🦴 Paleobiology DB</a>`);
    return `<div class="eyebrow">🔎 Ricerca · ${esc(RK)}${king ? " · " + esc(king) : ""}</div>
      <h3>${esc(inf.label || inf.sci)}</h3><div class="sci">${esc(inf.sci)}${inf.author ? ` <span style="font-style:normal">${esc(inf.author.replace(inf.sci, "").trim())}</span>` : ""}</div>
      ${inf.iucn ? `<div class="iucnrow"><span class="iucn ${inf.iucn}" style="background:${IUCN[inf.iucn][1]}">${inf.iucn}</span><b>${esc(IUCN[inf.iucn][0])}</b><span class="tr">· Lista Rossa IUCN</span></div>` : ""}
      ${extinct ? `<div class="iucnrow"><span class="iucn EX" style="background:#000">†</span><b>Estinto</b><span class="tr">· secondo la Paleobiology Database</span></div>` : ""}
      ${inf.img && inf.img.img ? `<div class="img"><img src="${esc(inf.img.img)}" alt="${esc(inf.label || inf.sci)}" loading="lazy"><div class="credit">Immagine: <a href="${esc(inf.img.url)}" target="_blank" rel="noopener">Wikipedia${inf.img.lang === "en" ? " (inglese)" : ""}</a> · Wikimedia Commons</div></div>` : ""}
      ${inf.cls.length ? `<div class="note" style="margin-top:8px">Classificazione (clicca per cercare il gruppo):</div><div class="clsrow">${inf.cls.map(c => `<button class="lnk" data-cls="${esc(c.v)}" title="${esc(RANK[c.k.toUpperCase()] || c.k)}">${esc(c.v)}</button>`).join("<span>›</span>")}</div>` : ""}
      ${inf.wp && inf.wp.extract ? `<p>${esc(inf.wp.extract.length > 600 ? inf.wp.extract.slice(0, 600).replace(/\s\S*$/, "") + "…" : inf.wp.extract)}</p>` : ""}
      <div class="note" style="margin-top:10px"><b>Quando è comparso sulla Terra</b>: i fossili più antichi registrati nella Paleobiology Database.</div>
      ${fosRows ? `<ul class="fos">${fosRows}</ul>` : `<p class="note">Nessun fossile registrato per questo gruppo.</p>`}
      ${noSelf && fosRows ? `<p class="note">Per ${esc(inf.sci)} non ci sono fossili registrati: è indicata la comparsa dei gruppi che lo contengono (un gruppo più ampio è sempre più antico).</p>` : ""}
      <p class="note">Le date dipendono dai fossili trovati finora: il gruppo può essere nato prima, e alcune attribuzioni antiche sono discusse. Le stime fatte con il DNA («orologio molecolare») a volte danno date più antiche.</p>
      <div class="note" style="margin-top:10px"><b>Dove vive (o è vissuto)</b>: osservazioni e reperti registrati in GBIF${inf.occN != null ? `, ${nf(inf.occN, 0)} in tutto` : ""}.</div>
      ${contRows ? `<ul class="cont">${contRows}</ul>` : `<p class="note">Nessuna osservazione su un continente in GBIF${inf.occN ? " (forse vive in mare aperto)" : ""}.</p>`}
      ${totC && inf.occN && totC < inf.occN * .6 ? `<p class="note">Molte osservazioni sono in mare, fuori dai continenti.</p>` : ""}
      ${o.extra || ""}
      <a class="ozbig" href="https://www.onezoom.org/life/@${encodeURIComponent(inf.sci.replace(/ /g, "_"))}${inf.ott ? "=" + inf.ott : ""}" target="_blank" rel="noopener"><span class="ic">🌳</span><span><b>Esplora l'albero della vita</b><span>OneZoom: i suoi parenti più stretti e la strada fino all'origine della vita.</span></span></a>
      <div class="links">${L.join("")}</div>`;
  }
  const CSS = `
.cerca{position:relative}
.cerca input{width:100%;font:inherit;font-size:15px;padding:9px 12px 9px 36px;border-radius:999px;border:1px solid var(--line);background:var(--chip) no-repeat 12px 50%/16px;color:var(--ink);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Ccircle cx='8.5' cy='8.5' r='5.5' fill='none' stroke='%23889' stroke-width='2'/%3E%3Cpath d='M13 13l5 5' stroke='%23889' stroke-width='2.4' stroke-linecap='round'/%3E%3C/svg%3E")}
.cerca input:focus{outline:2px solid var(--accent);outline-offset:1px}
.cerca ul{position:absolute;left:0;right:0;top:calc(100% + 4px);z-index:30;list-style:none;margin:0;padding:4px;background:var(--panel);border:1px solid var(--line);border-radius:12px;box-shadow:0 10px 30px #0004;max-height:min(420px,60vh);overflow:auto}
.cerca li button{display:flex;gap:8px;align-items:flex-start;width:100%;text-align:left;border:0;background:transparent;padding:7px 9px;border-radius:8px;cursor:pointer;font:inherit;color:var(--ink)}
.cerca li[aria-selected="true"] button,.cerca li button:hover{background:var(--accent-soft)}
.cerca li b{font-size:14.5px}.cerca li i{color:var(--muted);font-size:13.5px}
.cerca li small{display:block;color:var(--muted);font-size:12.5px;line-height:1.25}
.cerca li .em{font-size:18px;line-height:1.2}
.cerca .hint{font-size:12px;color:var(--muted);margin:4px 4px 0}
.sel .clsrow{display:flex;flex-wrap:wrap;gap:3px 5px;align-items:center;font-size:13px;margin-top:3px}
.sel .clsrow span{color:var(--muted)}
.sel .lnk{border:0;background:transparent;color:var(--accent);cursor:pointer;padding:0;font:inherit;font-size:13px}
.sel ul.fos,.sel ul.cont{list-style:none;margin:6px 0 0;padding:0;font-size:13.5px;display:flex;flex-direction:column;gap:3px}
.sel ul.fos .rk{display:inline-block;min-width:66px;color:var(--muted);font-size:12.5px}
.sel ul.cont li{display:grid;grid-template-columns:96px 1fr 56px;gap:8px;align-items:center}
.sel ul.cont .bar{height:8px;border-radius:4px;background:var(--line);overflow:hidden}
.sel ul.cont .bar i{display:block;height:100%;background:var(--accent)}
.sel ul.cont .n{text-align:right;font-variant-numeric:tabular-nums;color:var(--muted);font-size:12.5px}
.sel .iucnrow{display:flex;align-items:center;gap:8px;margin-top:8px;font-size:14px;flex-wrap:wrap}
.sel .iucnrow .tr{color:var(--muted);font-size:13px}
.sel .iucn{display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:20px;padding:0 6px;border-radius:4px;font-weight:700;font-size:12px;color:#fff}
.sel .iucn.VU,.sel .iucn.NT,.sel .iucn.LC,.sel .iucn.DD{color:#1d2622}
.sel .ozbig{display:flex;gap:10px;align-items:center;margin-top:10px;padding:10px 12px;border-radius:var(--r);border:1px solid var(--accent);background:var(--accent-soft);text-decoration:none;color:var(--ink)}
.sel .ozbig b{font-family:var(--f-display);font-size:16px;display:block}
.sel .ozbig span{font-size:12.5px;color:var(--muted)}
.sel .ozbig .ic{font-size:26px;flex:none}
@media (min-width:1600px) and (min-height:900px){.cerca input{font-size:17px;padding:11px 14px 11px 40px}.cerca li b{font-size:16px}}
`;
  function mountUI(container, o) {
    const st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    container.innerHTML = `<div class="cerca"><label class="sr" for="cercaIn">Cerca una specie o un genere</label><input id="cercaIn" type="search" autocomplete="off" spellcheck="false" placeholder="Cerca una specie o un genere (es. lupo, Quercus)…" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="cercaList"><ul id="cercaList" role="listbox" hidden></ul><p class="hint">Qualsiasi essere vivente o estinto: nome italiano o scientifico.</p></div>`;
    attach({input: container.querySelector("input"), list: container.querySelector("ul"), local: o.local, onPick: o.onPick});
  }
  return {attach, mountUI, info, cardHtml, firstAppearance, contCenter, IUCN, CONT, safeImg, badImg, reconHtml, bindRecon};
})();
