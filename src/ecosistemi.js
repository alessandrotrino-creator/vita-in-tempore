/* =====================================================================
   Ecosistemi di oggi in 3D. Si aggancia al motore di src/ambienti.js
   (che chiama window.PaleoEcosistemi con i suoi attrezzi) e aggiunge
   nuovi ambienti (ENVS, con now: true), paesaggi (LAND) e modelli.
   Ogni cartello può avere un terzo elemento: l'id della specie nel globo
   «Sapiens in Tempore» (src/sapiens/*.js), per aprirne la scheda.
   ===================================================================== */
window.PaleoEcosistemi = (X) => {
  "use strict";
  const {ENVS, LAND, PL, AN, G, mk, eyes, legs4, shag, tailW, rr, fbm, vnoise, smooth, lerp, dist, PI, TAU, C_, NQ, pm, amat, smat, sea, ringList, group, walkSp, farHills} = X;
  const T = () => X.T3();

  /* ---------- nuovi modelli ---------- */
  // grande felino (leone, giaguaro, tigre): o.col, o.spots, o.stripes, o.mane, o.tuft
  AN.felid = (o = {}) => {
    const b = mk(), C = new (T().Color)(o.col || '#c8a060'), D = new (T().Color)(o.spot || '#2e2216');
    const cf = o.spots ? (x, y, z, c) => { c.copy(C); const v = vnoise(x * 16 + 3, y * 16 + z * 16), w = Math.abs(v - .62); if (w < .05) c.lerp(D, .95); else if (v > .7) c.lerp(D, .35); }
      : (x, y, z, c) => c.copy(C);
    // strisce della tigre: anelli scuri appena più grandi del corpo, inclinati
    if (o.stripes) for (let i = 0; i < 9; i++) { const x = -.78 + i * .19, g = G.ell(.035, .3, .27, 8, 5); g.rotateZ(.3 + (i % 2) * .15); b.add(G.tr(g, x, .93 + (x + .78) * .06, 0), o.spot || '#2e2216'); }
    b.add(G.loft([[-1.0, .82, 0, .05], [-.88, .9, 0, .2], [-.75, .92, 0, .25, .22], [-.2, .88, 0, .27, .23], [.45, .98, 0, .28, .25], [.75, 1.03, 0, .19, .17], [.95, 1.05, 0, .17, .16], [1.15, .99, 0, .12, .12], [1.25, .95, 0, .08, .09]], 10), cf, {belly: o.bel || '#eadfc6'});
    b.add(G.loft([[-.95, .86, 0, .04], [-1.35, .66, 0, .03], [-1.6, .5, 0, .025]], 5, true), cf, {wave: .6});
    if (o.tuft) b.add(G.tr(G.ell(.06, .08, .06, 6, 4), -1.62, .48, 0), '#3a2a1a');
    if (o.mane) b.add(G.organic(G.tr(G.ell(.3, .34, .32, 10, 8), .88, 1.04, 0), .08, 3), shag(o.mane, 6, .35));
    for (const z of [-1, 1]) b.add(G.tr(G.ell(.04, .06, .05, 6, 4), 1.03, 1.18, z * .11), o.col || '#c8a060');
    eyes(b, 1.18, 1.06, .08, .016, '#3a3010');
    legs4(b, .45, -.7, .16, .16, .72, .76, .1, .1, cf, {f: {kn: -.02, an: .02, ft: .07}, h: {kn: .1, an: -.12, ft: .07}});
    return b.geo({ao: .8, aoH: .35});
  };
  // zebra: corpo di cavallo con le strisce
  AN.zebra = (o = {}) => {
    const b = mk(), s = o.s || 1, W = new (T().Color)('#f2efe6'), K = new (T().Color)('#1d1b19');
    const cf = (x, y, z, c) => { const v = y < 1.0 * s ? y * 34 / s : x * 21 / s + Math.sin(y * 5) * .7; c.copy(Math.sin(v) > 0 ? W : K); if (x > 1.35 * s && y < 1.6 * s) c.copy(K); };
    b.add(G.loft([[-.95, 1.32, 0, .33, .28], [-.3, 1.3, 0, .38, .32], [.45, 1.32, 0, .36, .3], [.7, 1.45, 0, .28, .22], [.95, 1.75, 0, .18, .14], [1.1, 1.9, 0, .13, .1], [1.35, 1.64, 0, .11, .09], [1.5, 1.44, 0, .08, .07]].map(p => [p[0] * s, p[1] * s, 0, p[3] * s, p[4] * s]), 10), cf);
    b.add(G.loft([[-1.0 * s, 1.35 * s, 0, .05 * s], [-1.15 * s, 1.0 * s, 0, .05 * s], [-1.2 * s, .7 * s, 0, .03 * s]], 5, true), '#2a2622', {wave: .6});
    b.add(G.loft([[.65 * s, 1.62 * s, 0, .05 * s, .03 * s], [.95 * s, 1.95 * s, 0, .06 * s, .03 * s], [1.1 * s, 2.02 * s, 0, .04 * s, .02 * s]], 4, true), cf);
    for (const z of [-1, 1]) b.add(G.tr(G.cone(.045 * s, .16 * s, 4), 1.12 * s, 1.95 * s, z * .06 * s), '#e8e4da');
    eyes(b, 1.3 * s, 1.75 * s, .085 * s, .018 * s);
    legs4(b, .48 * s, -.82 * s, .16 * s, .16 * s, 1.08 * s, 1.15 * s, .075 * s, .1 * s, cf, {f: {kn: -.03 * s, an: .02 * s, ft: .05 * s}, h: {kn: .14 * s, an: -.14 * s, ft: .05 * s}});
    return b.geo({ao: .8, aoH: .35});
  };
  // tartaruga marina
  AN.turtle = (L = 1, o = {}) => {
    const b = mk(), sh = o.col || '#6a5a32';
    b.add(G.organic(G.tr(G.ell(.5 * L, .15 * L, .4 * L, 16, 8), 0, .05 * L, 0), .015 * L, 5 / L), (x, y, z, c) => { c.set(sh); const v = Math.sin(x / L * 22) * Math.sin(z / L * 22); if (v > .3) c.multiplyScalar(.7); else if (v < -.5) c.lerp(C_('#a08a50'), .5); });
    b.add(G.tr(G.ell(.46 * L, .06 * L, .36 * L, 14, 6), 0, -.02 * L, 0), '#d8c8a0');
    b.add(G.loft([[.4 * L, .02 * L, 0, .07 * L], [.58 * L, .04 * L, 0, .075 * L], [.7 * L, .03 * L, 0, .06 * L]], 8, true), '#7a7050');
    eyes(b, .66 * L, .07 * L, .05 * L, .012 * L);
    for (const z of [-1, 1]) {
      const f = G.leaf(.55 * L, .17 * L, 4, 0); f.rotateY(z * -(PI / 2 + .45)); f.translate(.2 * L, 0, z * .3 * L); b.add(f, '#7a7050', {wing: 1.1, upN: .4});
      const r = G.leaf(.22 * L, .1 * L, 3, 0); r.rotateY(z * -(PI / 2 + 2.2)); r.translate(-.35 * L, 0, z * .22 * L); b.add(r, '#7a7050', {wing: .6, upN: .4});
    }
    return b.geo({});
  };
  // manta: un grande «aquilone» che batte le ali
  AN.manta = (L = 4) => {
    const b = mk(), w = L * .5;
    const body = G.shape([[.45 * L, 0], [.05 * L, w], [-.25 * L, 0], [.05 * L, -w]]); body.rotateX(PI / 2);
    b.add(body, (x, y, z, c) => c.set('#2a2e34'), {wing: .9});
    b.add(G.tr(G.ell(.3 * L, .06 * L, .16 * L, 12, 6), .05 * L, 0, 0), '#30343a', {belly: '#e8e8e4'});
    for (const z of [-1, 1]) b.add(G.loft([[.3 * L, 0, z * .1 * L, .02 * L], [.45 * L, 0, z * .12 * L, .015 * L]], 4, true), '#2a2e34');
    b.add(G.loft([[-.2 * L, 0, 0, .015 * L], [-.6 * L, 0, 0, .005 * L]], 4, true), '#2a2e34');
    return b.geo({});
  };
  /* ---------- nuove piante e coralli ---------- */
  PL.baobab = (h = 12) => {
    const b = mk(), tc = '#9a8a78';
    b.add(G.organic(G.loft([[0, 0, 0, h * .17], [0, h * .35, 0, h * .16], [0, h * .62, 0, h * .11], [0, h * .7, 0, h * .06]], 12, true), h * .02, .4), (x, y, z, c) => c.set(tc).multiplyScalar(.85 + .2 * Math.sin(Math.atan2(z, x) * 9 + y)));
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + rr(0, .5), l = h * rr(.18, .3), ex = Math.cos(a) * l, ez = Math.sin(a) * l, y = h * .66;
      b.add(G.loft([[0, y, 0, h * .035], [ex * .6, y + l * .5, ez * .6, h * .022], [ex, y + l * .75, ez, h * .012]], 6, true), tc);
      b.add(G.organic(G.tr(G.ico(h * .07, 1), ex, y + l * .82, ez), h * .02, 3), '#6a7f3a', {k: rr(.85, 1.1)}); }
    return b.geo({ao: .6, aoH: .7, wave: (x, y) => Math.max(0, y - h * .75) / h * .5});
  };
  PL.mound = (h = 2.5, col = '#b07a4a') => mk().add(G.organic(G.loft([[0, 0, 0, h * .32], [0, h * .5, 0, h * .2], [.05 * h, h * .85, 0, h * .09], [.08 * h, h, 0, h * .03]], 9, true), h * .06, 2 / h), col).geo({ao: .6, aoH: .8});
  PL.staghorn = (h = .8, col = '#c86a8a') => {
    const parts = [];
    const br = (p, dir, len, r, d) => { const e = p.clone().addScaledVector(dir, len); parts.push(G.loft([[p.x, p.y, p.z, r], [e.x, e.y, e.z, r * .8]], 6, true)); if (d === 0) return;
      for (let i = 0; i < 2; i++) br(e, dir.clone().applyAxisAngle(new (T().Vector3)(rr(-1, 1), 0, rr(-1, 1)).normalize(), rr(.35, .7)).normalize(), len * rr(.7, .9), r * .8, d - 1); };
    for (let i = 0; i < 3; i++) br(new (T().Vector3)(rr(-.1, .1), 0, rr(-.1, .1)), new (T().Vector3)(rr(-.4, .4), 1, rr(-.4, .4)).normalize(), h * .35, h * .06, 3);
    const C = new (T().Color)(col);
    return mk().add(X.cat ? X.cat(parts) : parts[0], (x, y, z, c) => c.copy(C).lerp(C_('#f4e8e0'), smooth(h * .7, h * 1.2, y) * .6)).geo({ao: .6, aoH: .5});
  };
  PL.fanCoral = (h = 1.2, col = '#8a3a9a') => {
    const g = new (T().CircleGeometry)(h * .55, 18, 0, PI); const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 3) * .05 * h);
    g.computeVertexNormals();
    const C = new (T().Color)(col);
    return mk().add(g, (x, y, z, c) => { c.copy(C); if (Math.sin(x * 40) * Math.sin(y * 40) > .5) c.multiplyScalar(.6); }).add(G.loft([[0, -.1 * h, 0, .03 * h], [0, .05 * h, 0, .025 * h]], 5, true), col).geo({wave: (x, y) => Math.max(0, y) / h * .7});
  };
  PL.anemone = (r = .5, col = '#e070a0') => {
    const parts = []; for (let i = 0; i < 40; i++) { const a = rr(0, TAU), d = rr(0, r * .8), x = Math.cos(a) * d, z = Math.sin(a) * d, l = r * rr(.5, .9);
      parts.push(G.loft([[x, 0, z, r * .035], [x * 1.2, l * .6, z * 1.2, r * .03], [x * 1.4, l, z * 1.4, r * .02]], 4, true)); }
    parts.push(G.tr(G.ell(r * .85, r * .2, r * .85, 12, 6), 0, 0, 0));
    const C = new (T().Color)(col);
    return mk().add(X.cat ? X.cat(parts) : parts[0], (x, y, z, c) => c.copy(C).lerp(C_('#ffe0f0'), smooth(r * .3, r * .9, y) * .7)).geo({wave: (x, y) => y / r * .8});
  };
  PL.clam = (L = 1) => mk().add(G.organic(G.tr(G.ell(.5 * L, .22 * L, .3 * L, 14, 8), 0, .1 * L, 0), .04 * L, 6 / L), (x, y, z, c) => { c.set('#d8d0b8'); if (y > .16 * L) c.set(Math.sin(x / L * 30) > 0 ? '#2a5ab8' : '#3aa0a8'); }).geo({});
  PL.lily = (r = 1) => { const g = G.cyl(r, r * 1.02, .06, 24); return mk().add(g, (x, y, z, c) => { c.set('#4a7a2a'); if (Math.hypot(x, z) > r * .93) c.set('#8a3a3a'); else if (Math.sin(Math.atan2(z, x) * 12) > .9) c.multiplyScalar(.8); }).geo({}); };

  /* ---------- elenco ---------- */
  const E = (o) => ENVS.push(Object.assign({now: true, era: 'Oggi', when: 'ecosistema di oggi', from: 0.0117, to: 0, ma: 0}, o));
  E({id: 'eco-savana', name: 'La savana africana', place: 'Serengeti (Tanzania)', lat: -2.33, lon: 34.83, color: '#d0a040',
    intro: 'Una prateria punteggiata di acacie e baobab, con una pozza d’acqua. È la stagione della grande migrazione: una mandria di gnu attraversa la pianura, gli elefanti vanno a bere, bufali e facoceri pascolano, le leonesse riposano all’ombra di un’acacia, due iene si aggirano in cerca di cibo e le faraone razzolano tra l’erba.',
    facts: [
      ['L’elefante africano di savana', 'È il più grande animale terrestre: un maschio può superare le 6 tonnellate. Abbattendo alberi e scavando pozze crea spazi aperti e acqua per molte altre specie. È «In pericolo» (IUCN 2021) a causa del bracconaggio per l’avorio e della perdita di territorio.', 'elefante-savana'],
      ['La grande migrazione', 'Ogni anno circa un milione e mezzo di gnu, con centinaia di migliaia di zebre e gazzelle, compie un grande giro tra il Serengeti e il Masai Mara seguendo le piogge e l’erba fresca. È uno degli spettacoli naturali più grandi del pianeta.'],
      ['Il leone', 'È l’unico felino che vive in gruppi, i branchi. Le femmine cacciano insieme, i maschi difendono il territorio. In Africa ne restano poche decine di migliaia: è «Vulnerabile» per la perdita di prede e territorio e per i conflitti con gli allevatori.', 'leone'],
      ['Il bufalo africano', 'Vive in mandrie che possono superare il migliaio di animali. È così robusto che quasi solo i leoni, cacciando in gruppo, riescono ad abbatterlo, e la mandria difende insieme i piccoli. Ha bisogno di bere ogni giorno, quindi non si allontana mai troppo dall’acqua.'],
      ['Acacie e baobab', 'Le acacie si difendono con spine e, alcune, ospitando formiche che pungono gli erbivori. Il baobab immagazzina migliaia di litri d’acqua nel tronco e può vivere più di mille anni.', 'baobab-africano'],
      ['La iena macchiata', 'Non è solo uno spazzino: caccia da sé gran parte del suo cibo, soprattutto gnu e zebre. Vive in clan guidati dalle femmine e, con mascelle potentissime, rompe e digerisce anche le ossa. Insieme agli avvoltoi ripulisce la savana dalle carcasse.']]});
  E({id: 'eco-amazzonia', name: 'La foresta amazzonica', place: 'Foresta pluviale lungo un fiume, Amazzonia (Brasile)', lat: -3.1, lon: -60.0, color: '#2e8a4a',
    intro: 'Una foresta pluviale calda e umida lungo un fiume. Alberi altissimi formano un tetto di foglie, sotto c’è penombra. Nel fiume nuotano i delfini rosa e sulle rive aspettano i caimani; tra i rami passano scimmie e pappagalli.',
    facts: [
      ['La foresta più grande del mondo', 'L’Amazzonia copre circa 5,5 milioni di km², quasi 20 volte l’Italia, in nove paesi. Ospita circa una specie conosciuta su dieci e ogni anno se ne scoprono di nuove. Il suo fiume porta al mare un quinto di tutta l’acqua dolce dei fiumi della Terra.'],
      ['Una foresta a piani', 'In alto spuntano alberi giganti oltre i 50 metri; sotto c’è la volta, un tetto continuo di chiome dove vive gran parte degli animali; più in basso il sottobosco, in penombra, con felci, palme e giovani alberi che aspettano un raggio di luce.'],
      ['L’ara giacinto', 'È il pappagallo più grande del mondo, lungo fino a un metro, blu cobalto. Con il becco fortissimo apre le noci di palma. È «Vulnerabile» per la cattura per il commercio e la perdita di habitat.', 'ara-giacinto'],
      ['Il delfino rosa', 'Il boto vive solo nei fiumi del Sud America. Il collo flessibile gli permette di nuotare tra i tronchi della foresta allagata. È «In pericolo»: muore nelle reti e viene ucciso per farne esca.', 'boto'],
      ['La noce del Brasile', 'Questo albero gigante produce frutti solo se le sue api impollinatrici trovano la foresta intatta intorno. I semi li spargono gli agouti, roditori che li nascondono e poi li dimenticano.', 'noce-brasile'],
      ['Una foresta in pericolo', 'Circa un quinto della foresta amazzonica è già stato abbattuto, soprattutto per pascoli e campi di soia. Gli scienziati temono che oltre una certa soglia parte della foresta possa trasformarsi in savana.']]});
  E({id: 'eco-barriera', name: 'La barriera corallina', place: 'Grande Barriera Corallina (Australia)', lat: -18.3, lon: 147.7, color: '#20a0c0',
    intro: 'Un mare caldo e trasparente, pochi metri sotto la superficie. Coralli di tutte le forme e colori, anemoni, pesci a sciami, una tartaruga verde che nuota e una manta che passa lenta: la barriera corallina è la «foresta pluviale del mare».',
    facts: [
      ['I coralli sono animali', 'Ogni corallo è una colonia di minuscoli polipi, parenti delle meduse, che costruiscono uno scheletro di calcare. Dentro di loro vivono alghe microscopiche che con la luce del sole producono cibo: per questo i coralli crescono solo in acque limpide e poco profonde.'],
      ['Lo sbiancamento', 'Se l’acqua resta troppo calda per settimane, i coralli espellono le alghe e diventano bianchi: se il caldo dura, muoiono. Tra il 2023 e il 2025 c’è stato il più grande evento di sbiancamento mai registrato, che ha colpito oltre l’80% delle barriere del mondo.'],
      ['Il pesce pagliaccio', 'Vive tra i tentacoli urticanti dell’anemone, protetto da uno strato di muco. In cambio pulisce l’anemone e lo difende. Tutti i pesci pagliaccio nascono maschi: il più grande del gruppo diventa femmina.', 'pesce-pagliaccio'],
      ['La tartaruga verde', 'Bruca le praterie di alghe e fanerogame marine e torna a deporre le uova sulla stessa spiaggia dove è nata. Grazie a decenni di protezione molte popolazioni sono in ripresa: nel 2025 la IUCN l’ha spostata nella categoria «Minor preoccupazione».', 'tartaruga-verde'],
      ['Il pesce Napoleone', 'Può superare i 2 metri e vivere 30 anni. Mangia anche le stelle marine corona di spine che distruggono i coralli. È «In pericolo» perché è molto ricercato nei ristoranti di pesce vivo.', 'pesce-napoleone'],
      ['La tridacna gigante', 'È il più grande mollusco con conchiglia: supera il metro e i 200 kg. Come i coralli, ospita alghe che le danno cibo e colori. Raccolta per la carne e la conchiglia, è stata dichiarata «In pericolo critico» nel 2024.', 'tridacna-gigante']]});

  /* ---------- paesaggi ---------- */
  LAND['eco-savana'] = (k) => {
    const WH = [6, -30, 6];
    const H = (x, z) => { let h = .3 + fbm(x * .02, z * .02, 3) * 1.1 + farHills(x, z, 9, 90, 150); const dw = dist(x - WH[0], z - WH[1]); return h - smooth(WH[2] + 2, WH[2] - 2, dw) * 1.2; };
    k.H = H;
    const wet = (x, z) => dist(x - WH[0], z - WH[1]) < WH[2] + .4;
    k.sky({top: '#4a88d0', hor: '#ece2c8', fog: [90, 460], sunDir: [.45, .7, -.4]});
    k.lights({sky: '#e0e8f0', ground: '#a08a50', hemi: 1, sun: '#fff0d6', sunI: 1.45, dir: [.45, .7, -.4]});
    k.clouds(18, 70, 130, {op: .85});
    k.terrain(H, (x, y, z, s, c) => { c.set('#a89a5a'); c.lerp(C_('#7e8442'), smooth(.4, .7, fbm(x * .08, z * .08, 3)) * .7); if (y < -.2) c.lerp(C_('#6a5a40'), .8); });
    k.water(-.35, '#7a7048', .85, (WH[2] + 3) * 2, (WH[2] + 3) * 2, WH[0], WH[1], {round: true});
    const open = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => wet(x, z) ? null : f(x, z));
    k.plant(PL.tuft(.8, '#9a9a50', '#e2cf8a'), open(NQ(k, 3200), 2, 60, (x, z) => ({x, z, s: rr(.6, 1.3)})), pm(k, .12, 1.4), {shadow: false, v: .25});
    k.plant(PL.tuft(.9, '#a8a058', '#e8d898', 5), open(NQ(k, 1500), 55, 130, (x, z) => ({x, z, s: rr(1, 1.8)})), pm(k, .12, 1.4), {shadow: false, v: .25});
    k.plant(PL.acacia(7, '#6a8a38'), open(NQ(k, 45), 14, 130, (x, z) => ({x, z, s: rr(.7, 1.3)})), pm(k, .2, .7), {rad: 1});
    const BAO = [[-26, -34], [34, 12], [-50, 30]];
    k.plant(PL.acacia(7.5, '#6a8a38'), [{x: -15, z: -19, y: H(-15, -19), r: 1, s: 1.15}, {x: 22, z: -22, y: H(22, -22), r: 2, s: 1}], pm(k, .2, .7), {rad: 1});
    k.plant(PL.baobab(13), BAO.map(([x, z]) => ({x, z, y: H(x, z), r: rr(0, TAU), s: rr(.9, 1.15)})), smat(k), {rad: 2});
    k.plant(PL.mound(2.4), open(NQ(k, 14), 10, 90, (x, z) => ({x, z, s: rr(.6, 1.2)})), smat(k), {rad: .8});
    k.plant(PL.shrub(.8, '#6a7a3a'), open(NQ(k, 70), 6, 100, (x, z) => ({x, z, s: rr(.5, 1.3)})), pm(k, .05, .8), {shadow: false});
    k.plant(PL.rock(2, '#9a8a78'), open(NQ(k, 20), 50, 120, (x, z) => ({x, z, s: rr(.6, 2.2), sy: rr(.5, .9)})), smat(k), {rad: 1.5});
    // tutti gli animali sono nel campo visivo iniziale (si guarda verso −z) o subito dietro; modelli 3D veri (cartella modelli/), se mancano restano quelli fatti dal codice
    const elephants = group(k, 5, WH[0], WH[1], WH[2] + 4, .08, {da: .35, dr: 1.5, s0: .7, s1: 1.1});
    k.model('modelli/elefante.glb', {len: 6.2, v0: .9, clip: /walk/i, sRef: 1.05, credit: 'jimmyho905 (elefante, CC BY 4.0)'}, elephants, () => k.herd(AN.proboscid({tusk: 'up', col: '#7d746c', bel: '#8a8178', s: 1.05, tl: .62, tw: .8, ear: 1}), amat(k, {leg: .28, sp: walkSp(.6, 2.6), wave: .1, k: .5}), elephants));
    const gnus = group(k, NQ(k, 16), -30, -52, 22, .05, {da: .1, dr: 5, sc: 3, s0: .62, s1: .72});
    k.model('modelli/gnu.glb', {len: 2.3, v0: 1.4, clip: /walk/i, sRef: .67, credit: 'WildMesh 3D (gnu, bufalo, leonessa, iena, facocero, faraona; CC BY-NC 4.0)'}, gnus, () => k.herd(AN.bison({col: '#5c5852'}), amat(k, {leg: .35, sp: walkSp(.9, 1.15)}), gnus, {shadow: false}));
    const buffalos = group(k, 4, 4, 26, 9, -.1, {da: .3, dr: 2});
    k.model('modelli/bufalo.glb', {len: 3, v0: 1.3, clip: /walk/i, sRef: 1}, buffalos, () => k.herd(AN.bison({col: '#3a3632'}), amat(k, {leg: .35, sp: walkSp(.9, 1.15)}), buffalos));
    // leonesse: due riposano all'ombra dell'acacia, una cammina
    const lionsRest = [{path: k.stay(-17, -16, 2.5), s: 1}, {path: k.stay(-15, -21.5, -.6), s: 1}], lionWalk = [{path: k.circ(-15, -19, 5.5, .2, 1), s: 1}];
    k.model('modelli/leonessa.glb', {len: 2.6, clip: /breath/i}, lionsRest, () => k.herd(AN.felid({col: '#cfac70', tuft: true}), amat(k, {wave: .02, k: 0, sp: .4}), lionsRest.map(l => Object.assign({}, l, {s: 1.1}))));
    k.model('modelli/leonessa.glb', {len: 2.6, v0: 1.3, clip: /walk/i}, lionWalk, () => k.herd(AN.felid({col: '#cfac70', tuft: true}), amat(k, {leg: .4, sp: walkSp(1.1, .8)}), lionWalk.map(l => Object.assign({}, l, {s: 1.1}))));
    const hyenas = group(k, 2, 24, -21, 5, -.22, {da: .5, dr: 1});
    k.model('modelli/iena.glb', {len: 1.6, v0: 1.2, clip: /walk/i, sRef: 1}, hyenas, () => k.herd(AN.canid({col: '#a08a60', bel: '#c8b890'}), amat(k, {leg: .4, sp: walkSp(1.1, .7)}), hyenas));
    const warthogs = group(k, 3, 12, -9, 4, .25, {da: .4, dr: .8});
    k.model('modelli/facocero.glb', {len: 1.5, v0: 1.1, clip: /walk/i, sRef: 1}, warthogs, () => k.herd(AN.bear({col: '#6a625a'}), amat(k, {leg: .35, sp: walkSp(.9, .4)}), warthogs.map(w => Object.assign({}, w, {s: .45}))));
    const fowls = group(k, 6, -4, -1, 2.2, .2, {da: .3, dr: .5});
    k.model('modelli/faraona.glb', {len: .55, v0: .45, clip: /walk/i, sRef: 1}, fowls, () => k.herd(AN.bird(.5, '#3a3a40'), amat(k, {leg: .4, sp: 5}), fowls, {shadow: false}));
    return {H, spawn: [0, 4, 0], inside: (x, z) => dist(x, z) < 80 && !wet(x, z), signOk: (x, z) => !wet(x, z), exp: .9, envI: .75};
  };

  LAND['eco-amazzonia'] = (k) => {
    const zc = x => -18 + Math.sin(x * .025) * 9;
    const H = (x, z) => .6 + fbm(x * .03, z * .03, 3) * 1.4 - smooth(13, 5, Math.abs(z - zc(x))) * 2.6 + farHills(x, z, 8, 90, 150);
    k.H = H;
    const river = (x, z) => H(x, z) < .05;
    k.sky({top: '#7aa6c8', hor: '#d8e4d8', fog: [24, 170], fogCol: '#a8bca8', sunDir: [.3, .8, -.4], haze: .6});
    k.lights({sky: '#d8ecd8', ground: '#3a4a2a', hemi: 1.1, sun: '#fff4dc', sunI: 1.05, dir: [.3, .8, -.4]});
    k.terrain(H, (x, y, z, s, c) => { c.set('#4a4028'); c.lerp(C_('#3a5a26'), smooth(.4, .7, fbm(x * .12, z * .12, 3)) * .8); if (y < .3) c.lerp(C_('#6a5a40'), .7); });
    k.water(0, '#2f4a3e', .78, 900);
    const dry = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => H(x, z) > .45 ? f(x, z) : null);
    // piani della foresta: alberi emergenti, volta, palme, sottobosco
    const NEAR = [[-13, 4], [13, 2], [-8, 22], [17, 18], [-22, 12], [4, 30]].filter(([x, z]) => H(x, z) > .5);
    const TREES = NEAR.map(([x, z]) => ({x, z, y: H(x, z), r: rr(0, TAU), s: rr(.75, .9)})).concat(dry(NQ(k, 22), 14, 95, (x, z) => ({x, z, s: rr(.85, 1.2)})));
    k.plant(PL.broadleaf(38, '#2c5a28', '#6a5a46', {w: .3, blobs: 9}), TREES, pm(k, .3, .5), {rad: 2});
    k.plant(PL.broadleaf(22, '#3a6a2c', '#5a4a38', {w: .32, blobs: 7}), dry(NQ(k, 90), 8, 110, (x, z) => ({x, z, s: rr(.7, 1.2)})), pm(k, .25, .6), {rad: 1.2});
    k.plant(PL.broadleaf(14, '#3d7032', '#5a4a38', {w: .3, blobs: 6, flowers: 18, fcol: '#f080b0', fs: .25}), dry(NQ(k, 25), 8, 90, (x, z) => ({x, z, s: rr(.7, 1.1)})), pm(k, .25, .6), {rad: 1});
    k.plant(PL.palm(12, '#3f7a34'), dry(NQ(k, 50), 5, 100, (x, z) => ({x, z, s: rr(.7, 1.3)})), pm(k, .25, .8), {rad: .8});
    k.plant(PL.treeFern(5, '#3f7a3a'), dry(NQ(k, 60), 4, 70, (x, z) => ({x, z, s: rr(.6, 1.2)})), pm(k, .15, .9), {rad: .5});
    k.plant(PL.fern(1.1, '#3f7a34'), dry(NQ(k, 700), 2, 60, (x, z) => ({x, z, s: rr(.6, 1.4)})), pm(k, .12, 1.1), {shadow: false});
    k.plant(PL.fanPalm(.3, '#4a7a3a'), dry(NQ(k, 200), 2, 60, (x, z) => ({x, z, s: rr(.6, 1.2)})), pm(k, .08, 1), {shadow: false});
    k.plant(PL.lily(1), ringList(k, NQ(k, 30), 6, 60, (x, z) => H(x, z) < -.4 ? {x, z, y: .03, s: rr(.6, 1.1)} : null), smat(k), {shadow: false});
    // animali: caimani sulla riva, delfini rosa nel fiume, giaguaro, scimmie sugli alberi, pappagalli in volo
    const shore = []; for (let x = -40; x <= 40 && shore.length < 3; x += 23) { const z = zc(x) + 6.5; shore.push({path: k.stay(x, z, rr(-1, 1), Math.max(H(x, z), -.08)), s: rr(.9, 1.2)}); }
    k.herd(AN.croc(3), amat(k, {wave: .02, k: 1, sp: .3}), shore.concat([{path: k.stay(-5, zc(-5) + 6.5, .4, Math.max(H(-5, zc(-5) + 6.5), -.08)), s: 1.2}]));
    k.herd(AN.fish({L: 2.2, h: .4, w: .36, col: '#d99aa8', bel: '#f2ccd4', tail: 'fork', dorsal: false, pect: .8}), amat(k, {wave: .06, k: 1.5, sp: 2}, true), [0, 1].map(i => ({path: t => { const x = -30 + ((t * 2.2 + i * 25) % 60); return [x, -.25 + Math.sin(t * 1.3 + i) * .45, zc(x) + (i ? 2 : -2)]; }})), {pitch: .6});
    k.herd(AN.felid({col: '#d0a050', spots: true, spot: '#2a1c10'}), amat(k, {leg: .4, sp: walkSp(.7, .74)}), [{path: k.circ(4, -6, 2.5, .1, 1), s: 1.15}]);
    k.herd(AN.primate(), amat(k, {wave: .3, k: 0, sp: 1.2}), TREES.slice(0, Math.max(3, NEAR.length)).flatMap(p => [0, 1].map(j => ({path: k.stay(p.x + (j ? -1.4 : 1.6), p.z + (j ? 1 : 0), rr(0, TAU), H(p.x, p.z) + 38 * p.s * .62), s: 4}))), {shadow: false});
    k.herd(AN.bird(1.1, '#2a3a9a'), amat(k, {flap: .9, sp: 7}, true), Array.from({length: NQ(k, 4)}, (_, i) => ({path: k.circ(rr(-15, 15), zc(0) + rr(-5, 5), rr(12, 22), (i % 2 ? 1 : -1) * rr(.25, .35), rr(0, TAU), rr(14, 22), 2), roll: (i % 2 ? -1 : 1) * .3})), {shadow: false});
    k.herd(AN.bird(1, '#c8261c'), amat(k, {flap: .9, sp: 7}, true), Array.from({length: NQ(k, 4)}, (_, i) => ({path: k.circ(rr(-25, 25), rr(-30, 10), rr(15, 25), (i % 2 ? 1 : -1) * rr(.2, .3), rr(0, TAU), rr(18, 26), 2), roll: (i % 2 ? -1 : 1) * .3})), {shadow: false});
    k.drift(NQ(k, 120), {col: '#5ab8ff', add: true, size: [.05, .1], alpha: .8, R: 18, h0: .5, h1: 6, vel: [.3, .1, .2], tw: 5, wob: 1});
    return {H, spawn: [0, 1, 0], inside: (x, z) => dist(x, z) < 70 && H(x, z) > .35, signOk: (x, z) => H(x, z) > .5, exp: 1.05, envI: .8};
  };

  LAND['eco-barriera'] = (k) => {
    const H = (x, z) => fbm(x * .03, z * .03, 3) * 1.6 + Math.max(0, fbm(x * .07 + 3, z * .07) - .5) * 5 + smooth(50, 100, dist(x, z)) * 7 * fbm(x * .02, z * .02 + 5);
    k.H = H;
    sea(k, {top: '#a8f0f0', hor: '#38a8c0', bot: '#0e4058', fog: .028, surf: 11, rayOp: .14, sunI: .7});
    k.terrain(H, (x, y, z, s, c) => { c.set('#d8ccaa'); c.lerp(C_('#a8987a'), smooth(.45, .75, fbm(x * .25, z * .25, 2)) * .7); c.lerp(C_('#8a7a6a'), smooth(.6, .8, fbm(x * .5 + 7, z * .5, 2)) * .5); }, {caustics: {i: .3, scale: .4}});
    const bed = (n, r0, r1, f) => ringList(k, n, r0, r1, f);
    const COL = ['#e0708a', '#f0a050', '#a070d0', '#60c0b0', '#e8d060', '#d85a5a'];
    COL.forEach((c, i) => k.plant(PL.staghorn(.9, c), bed(NQ(k, 110), 2.5, 38, (x, z) => ({x, z, s: rr(.9, 2.4)})), smat(k), {rad: .5}));
    k.plant(PL.coralTab(1, '#c8a060'), bed(NQ(k, 120), 2.5, 40, (x, z) => ({x, z, s: rr(.8, 2.4), sy: rr(.6, 1.1)})), smat(k), {rad: .7});
    k.plant(PL.coralTab(1, '#8a9a5a'), bed(NQ(k, 90), 2.5, 40, (x, z) => ({x, z, s: rr(.7, 2)})), smat(k), {rad: .6});
    k.plant(PL.coralTab(1, '#b06a9a'), bed(NQ(k, 70), 2.5, 40, (x, z) => ({x, z, s: rr(.6, 1.8)})), smat(k), {rad: .6});
    k.plant(PL.fanCoral(1.4, '#9a3aa8'), bed(NQ(k, 80), 3, 40, (x, z) => ({x, z, s: rr(.6, 1.4)})), pm(k, .08, .5), {rad: .3, shadow: false});
    k.plant(PL.fanCoral(1.2, '#e05a3a'), bed(NQ(k, 60), 3, 40, (x, z) => ({x, z, s: rr(.6, 1.3)})), pm(k, .08, .5), {rad: .3, shadow: false});
    const ANEM = [[3.5, -6], [-5, -8], [7, 3], [-7, 4]];
    k.plant(PL.anemone(.6, '#e874a8'), ANEM.map(([x, z]) => ({x, z, y: H(x, z), s: 1.3})), pm(k, .12, .8), {shadow: false});
    k.plant(PL.clam(1.1), [{x: -3, z: -15, y: H(-3, -15), r: .5, s: 1}, {x: 12, z: -12, y: H(12, -12), r: 2, s: .8}], smat(k), {rad: .8});
    k.plant(PL.seaweed(.6, '#4a8a3a'), bed(NQ(k, 60), 3, 45, (x, z) => ({x, z, s: rr(.6, 1.2)})), pm(k, .07, .6), {shadow: false});
    const sw = (n, f) => Array.from({length: n}, f);
    // pesci pagliaccio attorno agli anemoni
    k.herd(AN.fish({L: .12, h: .05, w: .025, tail: 'round', cf: (x, y, z, c) => { c.set(Math.abs(x) < .012 || Math.abs(x - .035) < .008 || Math.abs(x + .035) < .008 ? '#ffffff' : '#ff7a1a'); }}), amat(k, {wave: .02, k: 30, sp: 12}, true), sw(9, (_, i) => { const a = ANEM[i % 3]; return {path: k.circ(a[0], a[1], rr(.3, .7), rr(.6, 1) * (i % 2 ? 1 : -1), rr(0, TAU), H(a[0], a[1]) + rr(.5, .9), .1), s: 1.4}; }), {shadow: false, pitch: .3});
    k.herd(AN.fish({L: .5, h: .16, w: .07, col: '#3ab0a0', bel: '#a8e0c8', fcol: '#e86aa0', tail: 'fork'}), amat(k, {wave: .04, k: 9, sp: 7}, true), sw(NQ(k, 10), () => ({path: k.circ(rr(-15, 15), rr(-25, 5), rr(3, 9), rr(.15, .3) * (k.r() < .5 ? 1 : -1), rr(0, TAU), rr(1.5, 4), .4)})), {pitch: .4});
    k.herd(AN.fish({L: 1.8, h: .6, w: .3, col: '#3a7a8a', bel: '#7ab0a8', tail: 'round', cf: X.mottled('#2a7a8a', 6, .3, '#5ab0a0')}), amat(k, {wave: .04, k: 3, sp: 3}, true), [{path: k.circ(-5, -20, 10, .08, 1, 4, .5)}], {pitch: .4});
    k.herd(AN.fish({L: .2, h: .06, w: .03, col: '#f0d040', bel: '#fff0a0', tail: 'fork'}), amat(k, {wave: .03, k: 16, sp: 11}, true), sw(NQ(k, 70), (_, i) => ({path: k.circ(-8 + rr(-1.2, 1.2), -12 + rr(-1.2, 1.2), rr(4, 6), .35, i * .08, rr(3, 5), .3)})), {pitch: .5, shadow: false});
    k.herd(AN.fish({L: .25, h: .08, w: .03, col: '#4a6ad8', bel: '#a8c0f0', tail: 'fork'}), amat(k, {wave: .03, k: 16, sp: 11}, true), sw(NQ(k, 50), (_, i) => ({path: k.circ(10 + rr(-1, 1), -4 + rr(-1, 1), rr(3, 4.5), -.4, i * .1, rr(2, 4), .3)})), {pitch: .5, shadow: false});
    k.herd(AN.turtle(1.1, '#6a5a32'), amat(k, {flap: .35, sp: 1.6}, true), [{path: k.circ(0, -14, 13, .07, 0, 5, 1)}], {pitch: .5});
    k.herd(AN.manta(4.5), amat(k, {flap: .35, sp: 1.1}, true), [{path: k.circ(6, -30, 24, -.045, 2, 8, 1.2)}], {pitch: .4, shadow: false});
    k.herd(AN.shark(1.9), amat(k, {wave: .08, k: 2.5, sp: 4}, true), [{path: k.circ(-14, -26, 20, .09, 3, 6, .8)}], {pitch: .5});
    return {H, spawn: [0, 0, 0], eye: 2.6, under: true, signScale: .85, signLift: .8, inside: (x, z) => dist(x, z) < 55, exp: 1.15, envI: .45, speed: .7, pitch: -.1};
  };

  /* =================== passaggio 2: Artico, Appennino, Sahara =================== */
  // orso (bruno o polare)
  AN.bear = (o = {}) => {
    const b = mk(), col = o.col || '#5a3e26', hc = shag(col, 5, o.polar ? .12 : .35);
    const nk = o.polar ? .15 : 0;
    b.add(G.loft([[-1.0, .95, 0, .05], [-.9, 1.0, 0, .4, .38], [-.3, 1.12, 0, .5, .45], [.3, o.polar ? 1.12 : 1.25, 0, .5, .44], [.65, 1.12, 0, .38, .34], [.9 + nk, 1.05, 0, .24, .22], [1.15 + nk, 1.0, 0, .2, .18], [1.38 + nk, .94, 0, .12, .11], [1.5 + nk, .9, 0, .06, .06]], 11), hc, {belly: o.bel});
    for (const z of [-1, 1]) b.add(G.tr(G.ell(.06, .07, .05, 6, 4), 1.08 + nk, 1.2, z * .13), col);
    b.add(G.tr(G.ell(.05, .04, .05, 6, 4), 1.52 + nk, .92, 0), '#1a1410');
    eyes(b, 1.3 + nk, 1.05, .1, .02);
    legs4(b, .55, -.62, .27, .27, .9, .95, .15, .17, hc, {f: {kn: -.02, an: .02, ft: .1}, h: {kn: .1, an: -.08, ft: .12}});
    return b.geo({ao: .75, aoH: .35});
  };
  // canidi: lupo, volpe artica, fennec (o.ear grandi)
  AN.canid = (o = {}) => {
    const b = mk(), col = o.col || '#8a7a68', hc = shag(col, 7, .3), e = o.ear || .07;
    b.add(G.loft([[-.7, .7, 0, .05], [-.6, .72, 0, .17, .15], [-.1, .74, 0, .2, .17], [.35, .78, 0, .19, .16], [.55, .86, 0, .12, .1], [.7, .93, 0, .11, .1], [.86, .89, 0, .07, .07], [1.0, .86, 0, .035, .035]], 10), hc, {belly: o.bel || '#d8d0c0'});
    b.add(G.loft([[-.68, .72, 0, .06], [-.95, .55, 0, .08], [-1.15, .4, 0, .05]], 7, true), hc, {wave: .5});
    for (const z of [-1, 1]) b.add(G.tr(G.cone(e * .55, e * 1.7, 5), .7, .98, z * .065), col);
    eyes(b, .86, .95, .06, .014, '#2a2010');
    legs4(b, .4, -.5, .1, .1, .6, .63, .05, .06, hc, {f: {kn: -.02, an: .02, ft: .05}, h: {kn: .1, an: -.1, ft: .05}});
    return b.geo({ao: .8, aoH: .35});
  };
  // tricheco (o.tusks) e foca
  AN.pinniped = (o = {}) => {
    const b = mk(), col = o.col || '#8a6a58';
    b.add(G.loft([[-1.4, .12, 0, .1, .14], [-1.0, .28, 0, .35, .4], [-.2, .48, 0, .6, .62], [.5, .55, 0, .58, .55], [.95, .66, 0, .36, .34], [1.2, .62, 0, .27, .27], [1.35, .55, 0, .18, .19]], 11), mottled(col, 3, .25), {belly: o.bel || col});
    for (const z of [-1, 1]) { const f = G.leaf(.55, .25, 3, 0); f.rotateY(z * -(PI / 2 + .7)); f.translate(.55, .12, z * .45); b.add(f, '#5a4438', {upN: .5});
      const r = G.leaf(.45, .3, 3, 0); r.rotateY(z * -2.9); r.translate(-1.3, .12, z * .08); b.add(r, '#5a4438', {upN: .5}); }
    if (o.tusks) for (const z of [-1, 1]) b.add(G.tr(G.cone(.035, .55, 6).rotateX(PI).rotateZ(-.15), 1.32, .48, z * .07), '#efe6d0');
    eyes(b, 1.27, .7, .14, .02);
    return b.geo({wave: tailW(-.8, -1.4, .6)});
  };
  const mottled = X.mottled;
  // dromedario
  AN.camel = () => {
    const b = mk(), col = '#c8a070', C = new (T().Color)(col);
    b.add(G.loft([[-1.0, 1.65, 0, .3, .26], [-.45, 1.75, 0, .42, .34], [.25, 1.75, 0, .4, .32], [.6, 1.7, 0, .28, .22], [.95, 1.5, 0, .12, .11], [1.25, 1.6, 0, .1, .09], [1.4, 2.05, 0, .09, .08], [1.55, 2.2, 0, .11, .09], [1.85, 2.15, 0, .07, .07]], 10), col, {belly: '#d8b888'});
    b.add(G.organic(G.tr(G.ell(.45, .42, .3, 12, 8), -.15, 2.05, 0), .04, 4), (x, y, z, c) => c.copy(C).multiplyScalar(.95));
    b.add(G.loft([[-1.0, 1.65, 0, .04], [-1.15, 1.2, 0, .03]], 4, true), '#6a5030', {wave: .5});
    for (const z of [-1, 1]) b.add(G.tr(G.ell(.03, .05, .03, 5, 4), 1.55, 2.32, z * .07), col);
    eyes(b, 1.7, 2.24, .07, .018);
    legs4(b, .55, -.75, .2, .2, 1.65, 1.6, .08, .09, col, {f: {kn: -.03, an: .02, ft: .1}, h: {kn: .15, an: -.15, ft: .1}});
    return b.geo({ao: .8, aoH: .35});
  };
  // capre e antilopi: camoscio (horn 'hook'), stambecco ('ibex'), addax ('spiral')
  AN.caprine = (o = {}) => {
    const b = mk(), s = o.s || .62, col = o.col || '#6a4a30', C = new (T().Color)(col), F = o.face ? new (T().Color)(o.face) : null;
    const cf = (x, y, z, c) => { c.copy(C); if (F && x > 1.25 * s && y > 2.4 * s) c.lerp(F, .8); };
    b.add(G.loft([[-1.0, 1.8, 0, .38, .32], [-.3, 1.85, 0, .45, .38], [.5, 1.95, 0, .45, .38], [.75, 2.1, 0, .3, .27], [1.0, 2.45, 0, .2, .18], [1.15, 2.65, 0, .16, .13], [1.42, 2.55, 0, .12, .1], [1.58, 2.45, 0, .07, .07]].map(p => [p[0] * s, p[1] * s, 0, p[3] * s, p[4] * s]), 10), cf, {belly: o.bel || '#d8c8a8'});
    for (const z of [-1, 1]) {
      const hx = 1.15 * s, hy = 2.8 * s, hz = z * .07 * s, hc = o.hcol || '#2a2420';
      if (o.horn === 'hook') b.add(G.loft([[hx, hy, hz, .025 * s], [hx - .02 * s, hy + .3 * s, hz, .02 * s], [hx - .12 * s, hy + .38 * s, hz, .012 * s]], 5, true), hc);
      else if (o.horn === 'ibex') b.add(G.loft([[hx, hy, hz, .07 * s], [hx - .3 * s, hy + .55 * s, hz * 1.5, .05 * s], [hx - .8 * s, hy + .6 * s, hz * 2, .03 * s], [hx - 1.1 * s, hy + .3 * s, hz * 2.2, .015 * s]], 6, true), (x, y, zz, c) => c.set('#8a7a60').multiplyScalar(Math.sin(y * 40) > .6 ? .75 : 1));
      else if (o.horn === 'spiral') { const P = []; for (let i = 0; i <= 10; i++) { const t = i / 10; P.push([hx - t * .5 * s, hy + t * .75 * s, hz + z * (.05 + .1 * Math.sin(t * 9)) * s, (.035 - t * .025) * s]); } b.add(G.loft(P, 5, true), '#d8ccb0'); }
    }
    for (const z of [-1, 1]) b.add(G.tr(G.cone(.04 * s, .14 * s, 4).rotateZ(-.9), 1.1 * s, 2.72 * s, z * .1 * s), col);
    eyes(b, 1.36 * s, 2.62 * s, .1 * s, .018 * s);
    legs4(b, .52 * s, -.85 * s, .18 * s, .18 * s, 1.35 * s, 1.42 * s, .09 * s, .12 * s, col, {f: {kn: -.03 * s, an: .02 * s, ft: .05 * s}, h: {kn: .16 * s, an: -.16 * s, ft: .05 * s}});
    return b.geo({ao: .8, aoH: .35});
  };
  AN.orca = (L = 6) => AN.fish({L, h: L * .2, w: L * .17, tail: 'fork', dorsal: true, pect: 1.1, col: '#121416',
    cf: (x, y, z, c) => { c.set('#121416'); if (y < -.25 * L * .2) c.set('#f0f0ee'); else if (x > .28 * L && x < .4 * L && y > 0 && Math.abs(z) > .1 * L * .17) c.set('#f0f0ee'); },
    extra: (b, LL, h) => b.add(G.shape([[-.06 * LL, 0], [0, 1.4 * h], [.08 * LL, 0]]).translate(0, .4 * h, 0), '#121416')});
  PL.datePalm = (h = 10) => PL.palm(h, '#5a8a3a', '#8a7050', 14);
  PL.beech = (h = 18) => PL.broadleaf(h, '#4a7a32', '#8a8a80', {w: .3, blobs: 8});
  PL.floe = (r = 3) => { const g = G.cyl(r, r * .95, .5, 9); return mk().add(G.organic(g, r * .12, 1 / r), (x, y, z, c) => c.set(y > .4 ? '#f4f8fb' : '#a8d0e0')).geo({}); };

  E({id: 'eco-artico', name: 'Il mare Artico', place: 'Banchisa delle Svalbard (Norvegia)', lat: 78.2, lon: 15.6, color: '#8ac8e8',
    intro: 'Estate artica: il sole non tramonta mai e la banchisa si rompe in lastre di ghiaccio che galleggiano sul mare. Un orso polare cammina sul ghiaccio, i trichechi riposano sui lastroni, nell’acqua passano le orche.',
    facts: [
      ['L’orso polare', 'È il più grande carnivoro terrestre. Caccia le foche aspettandole ai buchi nel ghiaccio: senza banchisa non può nutrirsi. È «Vulnerabile» perché il ghiaccio marino estivo si riduce con il riscaldamento globale.', 'orso-polare'],
      ['Il ghiaccio che scompare', 'Dal 1979 i satelliti misurano la banchisa artica: alla fine dell’estate la sua estensione si riduce in media di circa il 12–13% ogni dieci anni. L’Artico si scalda circa quattro volte più in fretta del resto del pianeta.'],
      ['Il tricheco', 'Usa le zanne, che sono canini lunghissimi, per tirarsi fuori dall’acqua e per farsi spazio nel gruppo. Si nutre di molluschi del fondale, che trova con i baffi sensibilissimi. È «Vulnerabile».', 'tricheco'],
      ['La foca dal cappuccio', 'Il maschio gonfia una specie di palloncino rosso dal naso per farsi notare. I piccoli vengono allattati per soli quattro giorni, il periodo più breve tra i mammiferi. Nel 2025 è stata dichiarata «In pericolo».', 'foca-cappuccio'],
      ['La civetta delle nevi', 'È bianca per mimetizzarsi sulla neve e caccia anche di giorno, perché d’estate al Polo il sole non tramonta. La sua popolazione è diminuita molto: è «Vulnerabile».', 'civetta-nevi'],
      ['L’orca', 'Il più grande dei delfini vive in gruppi familiari guidati dalle femmine più anziane. Ogni gruppo ha un suo «dialetto» di richiami e tecniche di caccia insegnate ai giovani. Con meno ghiaccio, le orche arrivano sempre più a nord.', 'orca']]});
  E({id: 'eco-appennino', name: 'La faggeta dell’Appennino', place: 'Parco Nazionale d’Abruzzo, Lazio e Molise (Italia)', lat: 41.8, lon: 13.8, color: '#6aa040',
    intro: 'Un bosco di faggi secolari con una radura, un ruscello e le cime dell’Appennino sullo sfondo. Nella radura passano l’orso bruno marsicano, un branco di lupi, una volpe e un gruppo di cinghiali; sul tronco caduto si posa un corvo imperiale. Più in alto, sulle rupi, vive il camoscio appenninico.',
    facts: [
      ['L’orso bruno marsicano', 'Vive solo nell’Appennino centrale ed è una popolazione unica al mondo, separata dagli altri orsi da migliaia di anni. Ne restano circa 50–60: ogni orso conta. Mangia soprattutto frutti, ghiande, faggiola e insetti.', 'orso-marsicano'],
      ['Il lupo appenninico', 'Negli anni ’70 in Italia restavano circa cento lupi. Grazie alla protezione oggi sono oltre 3000 (stima ISPRA 2022) e sono tornati anche sulle Alpi. Il lupo regola il numero di cervi e cinghiali.', 'lupo'],
      ['Il camoscio appenninico', 'Vive più in alto, sulle praterie e sulle rupi sopra il bosco. Negli anni ’20 ne sopravvivevano una trentina, proprio in questo parco. Con la protezione e le reintroduzioni oggi sono alcune migliaia. Ha un disegno bianco e nero sul collo diverso da quello del camoscio delle Alpi.', 'camoscio-appenninico'],
      ['Le faggete vetuste', 'Alcuni faggi di queste valli hanno più di 500 anni: sono tra i più antichi d’Europa. Nel 2017 l’UNESCO le ha dichiarate Patrimonio dell’Umanità insieme ad altre antiche faggete europee.'],
      ['Il corvo imperiale', 'È il più grande dei passeriformi: le ali aperte superano il metro. È molto intelligente e spesso segue i lupi per mangiare i resti delle loro prede. Le coppie restano insieme per tutta la vita.'],
      ['Un parco storico', 'Il Parco Nazionale d’Abruzzo è nato nel 1923, tra i primi d’Italia, proprio per salvare l’orso e il camoscio. Oggi è un esempio di convivenza tra natura e paesi di montagna.']]});
  E({id: 'eco-sahara', name: 'Il deserto del Sahara', place: 'Dune e oasi del Sahara (Algeria)', lat: 24.5, lon: 9.5, color: '#e0a050',
    intro: 'Dune di sabbia, rocce scolpite dal vento e un’oasi con palme da dattero. Di giorno fa caldissimo, di notte freddo. Qui vivono animali capaci di resistere a lungo senza bere.',
    facts: [
      ['Il deserto caldo più grande', 'Il Sahara copre circa 9 milioni di km², quasi quanto gli Stati Uniti. Solo una piccola parte è fatta di dune: il resto sono pianure di sassi, altipiani e montagne. In certi punti non piove per anni.'],
      ['Il Sahara era verde', 'Tra circa 14 500 e 5000 anni fa il Sahara era coperto di savane, laghi e fiumi, con ippopotami, coccodrilli e giraffe. Lo raccontano i fossili e le pitture rupestri del Tassili. Guardalo sul globo: il deserto diventa verde!'],
      ['L’addax', 'È l’antilope del deserto più adatta alla sabbia: zoccoli larghi, pelo chiaro, e può vivere quasi senza bere. A causa della caccia ne restano meno di cento in natura: è «In pericolo critico».'],
      ['Il fennec', 'È la volpe più piccola del mondo. Le grandi orecchie disperdono il calore e gli permettono di sentire gli insetti sotto la sabbia. Esce di notte, quando fa fresco.'],
      ['Il dromedario', 'Non esiste più allo stato selvatico: è stato addomesticato in Arabia circa 3000 anni fa. La gobba contiene grasso, non acqua; può perdere un quarto del suo peso in acqua e recuperarlo bevendo oltre 100 litri in pochi minuti.'],
      ['Il ghepardo sahariano', 'È una sottospecie chiara e snella del ghepardo, che caccia di notte. Ne restano forse 250 adulti, sparsi su un territorio immenso: è tra i grandi felini più rari della Terra. Il ghepardo come specie è «Vulnerabile».', 'ghepardo']]});

  LAND['eco-artico'] = (k) => {
    const fl = (x, z) => fbm(x * .035 + 5, z * .035 - 3, 3);
    const H = (x, z) => { const d = dist(x, z); let h = fl(x, z) > .58 || d < 20 ? .45 + fbm(x * .2, z * .2, 2) * .15 : -3; if (d < 20) h = Math.max(h, .45); return h + smooth(120, 170, d) * 25 * fbm(x * .02, z * .02, 3); };
    k.H = H;
    const ice = (x, z) => H(x, z) > .3;
    k.sky({top: '#7aa8d0', hor: '#e8eef2', fog: [70, 420], sunDir: [.6, .25, -.5], sunSize: .7, glow: 1.1});
    k.lights({sky: '#e0ecf4', ground: '#c8d8e0', hemi: 1.15, sun: '#fff4e4', sunI: 1.2, dir: [.6, .25, -.5]});
    k.clouds(14, 60, 110, {op: .7});
    k.terrain(H, (x, y, z, s, c) => { c.set('#f2f6f9'); c.lerp(C_('#d0e2ec'), smooth(.45, .7, fbm(x * .2, z * .2, 2)) * .6); if (y < .2) c.set('#5a7a8a'); if (y > 3) c.set(s > .35 ? '#6a6a6a' : '#eef2f4'); });
    k.water(0, '#24485a', .85, 900);
    k.plant(PL.floe(3), ringList(k, NQ(k, 40), 25, 90, (x, z) => H(x, z) < 0 ? {x, z, y: -.3, s: rr(.4, 1.4), r: rr(0, TAU)} : null), smat(k), {shadow: false});
    k.herd(AN.bear({col: '#eee8d8', polar: true, bel: '#e8e0cc'}), amat(k, {leg: .35, sp: walkSp(.8, .95)}), [{path: k.circ(-6, -14, 7, .07, 0), s: 1.4}]);
    k.herd(AN.pinniped({tusks: true, col: '#9a7462', bel: '#b08a78'}), amat(k, {wave: .03, k: 0, sp: .3}), [[10, -12, 2], [12.5, -14, 1.2], [9, -16, 2.6]].map(([x, z, r]) => ({path: k.stay(x, z, r), s: rr(1, 1.2)})));
    k.herd(AN.pinniped({col: '#7a8088', bel: '#c0c4c4'}), amat(k, {wave: .03, k: 0, sp: .3}), [[-15, 2, .5], [17, 4, 2.4]].map(([x, z, r]) => ({path: k.stay(x, z, r), s: .7})));
    k.herd(AN.canid({col: '#f0f0ee', ear: .05, bel: '#ffffff'}), amat(k, {leg: .4, sp: walkSp(1, .6)}), [{path: k.circ(4, 8, 5, -.12, 2), s: .6}]);
    k.herd(AN.orca(6), amat(k, {wave: .06, k: 1, sp: 2}, true), [0, 1, 2].map(i => ({path: t => { const a = t * .05 + i * .25; return [Math.cos(a) * 36, -.6 + Math.sin(t * .9 + i * 2) * .7, Math.sin(a) * 36 - 10]; }})), {pitch: .6});
    k.herd(AN.bird(1.3, '#f6f6f2'), amat(k, {flap: .5, sp: 3}, true), [{path: k.circ(0, -10, 16, .12, 0, 12, 2), roll: -.3}]);
    k.herd(AN.bird(.6, '#e0e0e0'), amat(k, {flap: 1, sp: 8}, true), Array.from({length: NQ(k, 8)}, (_, i) => ({path: k.circ(rr(-20, 20), rr(-30, 0), rr(8, 20), (i % 2 ? 1 : -1) * rr(.3, .4), rr(0, TAU), rr(6, 14), 1), roll: (i % 2 ? -1 : 1) * .3})), {shadow: false});
    return {H, spawn: [0, 6, 0], inside: (x, z) => dist(x, z) < 60 && ice(x, z), signOk: ice, exp: .85, envI: .9};
  };

  LAND['eco-appennino'] = (k) => {
    const zc = x => 14;
    const H = (x, z) => .5 + fbm(x * .03, z * .03, 3) * 2 + smooth(-40, -110, z) * (25 + fbm(x * .02, z * .02, 3) * 35) - smooth(2.2, .8, Math.abs(z - zc(x))) * .6 + farHills(x, z, 14, 90, 150);
    k.H = H;
    const clear = (x, z) => dist(x, z + 6) < 16;
    k.sky({top: '#4a86d0', hor: '#e2eaee', fog: [60, 380], sunDir: [.4, .7, -.3]});
    k.lights({sky: '#dce8f2', ground: '#5a6a3a', hemi: 1, sun: '#fff4e2', sunI: 1.3, dir: [.4, .7, -.3]});
    k.clouds(16, 80, 140, {op: .8});
    k.terrain(H, (x, y, z, s, c) => { c.set('#5a7a32'); c.lerp(C_('#7a9a42'), smooth(.4, .7, fbm(x * .1, z * .1, 3)) * .6); if (!clear(x, z) && z > -40) c.lerp(C_('#6a5434'), .45); if (y > 18) c.lerp(C_('#8a8478'), smooth(18, 26, y)); if (y > 34) c.lerp(C_('#f2f4f6'), smooth(34, 40, y)); });
    k.water(.25, '#5a8aa0', .8, 400, 4, 0, 14);
    const wood = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => !clear(x, z) && H(x, z) < 16 && Math.abs(z - zc(x)) > 2.5 ? f(x, z) : null);
    k.plant(PL.beech(20), wood(NQ(k, 140), 10, 100, (x, z) => ({x, z, s: rr(.75, 1.25)})), pm(k, .25, .6), {rad: 1.2});
    k.plant(PL.conifer(16, '#2a4a30'), wood(NQ(k, 30), 30, 110, (x, z) => z < -30 ? {x, z, s: rr(.7, 1.2)} : null), pm(k, .2, .7), {rad: 1});
    k.plant(PL.tuft(.4, '#6a8a3a', '#a8b860'), ringList(k, NQ(k, 1800), 1, 28, (x, z) => clear(x, z) || k.r() < .3 ? {x, z, s: rr(.6, 1.2)} : null), pm(k, .1, 1.4), {shadow: false});
    k.plant(PL.fern(.8, '#4a7a34'), wood(NQ(k, 400), 6, 60, (x, z) => ({x, z, s: rr(.6, 1.2)})), pm(k, .1, 1), {shadow: false});
    k.plant(PL.rock(1, '#8a8680'), ringList(k, NQ(k, 40), 5, 80, (x, z) => ({x, z, s: rr(.3, 1.3), sy: rr(.5, .9)})), smat(k), {rad: .6});
    const logG = PL.log(7, .4, '#5a4a3a'), LR = .7, LY = H(-9, -3) + .3;
    k.plant(logG, [{x: -9, z: -3, y: LY, r: LR, s: 1}], smat(k));
    // punto più alto dell'anello centrale del tronco (che è un po' storto): lì si posa il corvo
    let lt = [0, -9, 0]; { const lp = logG.attributes.position; for (let i = 0; i < lp.count; i++) if (Math.abs(lp.getX(i)) < .5 && lp.getY(i) > lt[1]) lt = [lp.getX(i), lp.getY(i), lp.getZ(i)]; }
    // animali con modelli 3D veri (cartella modelli/); se il file manca restano quelli fatti dal codice
    const bears = [{path: k.circ(-7, -12, 4.5, .17, 1), s: 1.15}];
    k.model('modelli/orso.glb', {len: 1.85, v0: 1, clip: /walk/i, sRef: 1.15, credit: 'WildMesh 3D (orso CC BY 4.0; lupo, cinghiale e volpe CC BY-NC 4.0)'}, bears, () => k.herd(AN.bear({col: '#5a3e26'}), amat(k, {leg: .35, sp: walkSp(.6, .95)}), bears));
    const boars = group(k, 4, -14, -24, 5, .17, {da: .3, dr: 1, s0: .8, s1: 1.05});
    k.model('modelli/cinghiale.glb', {len: 1.4, v0: 1.2, clip: /walk/i, sRef: .95}, boars, () => k.herd(AN.bear({col: '#3e3630'}), amat(k, {leg: .35, sp: walkSp(.9, .5)}), boars.map(b => Object.assign({}, b, {s: b.s * .55}))));
    const foxes = [{path: k.circ(17, -5, 4, -.26, 0), s: 1}];
    k.model('modelli/volpe.glb', {len: 1.05, v0: 1.3, clip: /walk/i, sRef: 1}, foxes, () => k.herd(AN.canid({col: '#b8642a', bel: '#f0e8dc'}), amat(k, {leg: .4, sp: walkSp(1, .4)}), foxes.map(f => Object.assign({}, f, {s: .7}))));
    // corvi imperiali: uno sta sul tronco caduto, decolla, fa due giri e torna a posarsi (atterraggio = decollo al contrario); l'altro vola sempre in alto
    const LOG = [-9 + lt[0] * Math.cos(LR) + lt[2] * Math.sin(LR), LY + lt[1], -3 - lt[0] * Math.sin(LR) + lt[2] * Math.cos(LR)], CL = 6.8, CF = 6.9; // animazione «TakeOff»: fino a CL il corvo becchetta sul tronco, poi batte le ali; da CF alla fine si ripete in volo
    const crowCtl = (t, i, D) => {
      const R = 9, v = 5.5, acc = 2, laps = 2, Ltot = laps * TAU * R, fly = Ltot / v + acc, rise = D - CL, T = 4 + CL + fly + CL + 3;
      const flap = u => CF + ((u % (D - CF)) + (D - CF)) % (D - CF);
      if (i === 1) { const a = t * v / 16; return {p: [Math.cos(a) * 16 + 4, 24 + Math.sin(t * .3) * 2, Math.sin(a) * 16 - 26], yaw: -a - PI / 2, roll: -.3, at: flap(t)}; }
      const s = t % T, yaw0 = 1.2, cx = LOG[0] + Math.sin(yaw0) * R, cz = LOG[2] + Math.cos(yaw0) * R, a0 = Math.atan2(LOG[2] - cz, LOG[0] - cx);
      if (s < 4) return {p: LOG, yaw: yaw0, at: 0};
      if (s < 4 + CL) return {p: LOG, yaw: yaw0, at: s - 4};
      const f = s - 4 - CL;
      if (f < fly) { // parte piano, accelera, poi rallenta prima di posarsi
        const ea = v / acc, d = f < acc ? ea * f * f / 2 : (fly - f < acc ? Ltot - ea * (fly - f) ** 2 / 2 : v * (f - acc / 2)), u = d / Ltot, a = a0 + u * laps * TAU, h = Math.sin(u * PI) * 10;
        return {p: [cx + Math.cos(a) * R, LOG[1] + h, cz + Math.sin(a) * R], yaw: -a - PI / 2, roll: -.3 * Math.sin(u * PI), at: f < rise ? CL + f : (fly - f < rise ? D - (rise - (fly - f)) : flap(f))}; }
      const l = s - 4 - CL - fly; return {p: LOG, yaw: yaw0, at: Math.max(0, CL - l)};
    };
    k.model('modelli/corvo.glb', {len: 1.3, ctl: crowCtl, credit: 'alexanders823 (corvo, CC BY 4.0)'}, [{}, {}], () => k.herd(AN.bird(1.2, '#1a1a1c'), amat(k, {flap: .3, sp: 4}, true), [{path: k.circ(-9, -3, 9, .6, 0, 9, 3), roll: -.3}, {path: k.circ(4, -26, 16, .34, 0, 24, 2), roll: -.3}]));
    // lupi: modello 3D vero se c'è il file modelli/lupo.glb, altrimenti quello fatto dal codice
    const wolves = group(k, 3, 10, -16, 6, -.14, {da: .25, dr: 1, s0: 1.2, s1: 1.35});
    k.model('modelli/lupo.glb', {len: 1.45, v0: 1.3, clip: /walk|cammin/i, sRef: 1.27}, wolves, () => k.herd(AN.canid({col: '#8a7864', bel: '#d8ccb8'}), amat(k, {leg: .4, sp: walkSp(1.1, .63)}), wolves));
    return {H, spawn: [0, 6, 0], inside: (x, z) => dist(x, z) < 70 && H(x, z) < 14 && Math.abs(z - zc(x)) > 1.2, signOk: clear, exp: .9, envI: .75};
  };

  LAND['eco-sahara'] = (k) => {
    const OA = [-14, -24, 9];
    const dune = (x, z) => { const u = x * .05 + Math.sin(z * .03) * 1.5; return Math.pow(Math.abs(Math.sin(u)), 1.8) * 4 * (.5 + fbm(x * .01, z * .01, 2)); };
    const H = (x, z) => { const d = dist(x - OA[0], z - OA[1]); return .3 + dune(x, z) * smooth(OA[2] + 6, OA[2] + 22, d) * smooth(6, 25, dist(x, z + 4)) + farHills(x, z, 16, 90, 150) - smooth(4, 1, d) * 1.2; };
    k.H = H;
    const oasis = (x, z) => dist(x - OA[0], z - OA[1]) < OA[2];
    k.sky({top: '#3c7ad8', hor: '#f2dcb4', fog: [90, 470], sunDir: [.4, .85, -.2], sunSize: .6, glow: 1.2});
    k.lights({sky: '#f0e4d0', ground: '#d0a060', hemi: 1, sun: '#fff2dc', sunI: 1.6, dir: [.4, .85, -.2]});
    k.terrain(H, (x, y, z, s, c) => { c.set('#e0b070'); c.lerp(C_('#d09858'), smooth(.4, .7, fbm(x * .05, z * .05, 3)) * .6); if (oasis(x, z)) c.lerp(C_('#7a7a40'), .7); if (y > 10) c.lerp(C_('#9a6a48'), .6); });
    k.water(-.6, '#3a7a8a', .85, 7, 7, OA[0], OA[1], {round: true});
    k.plant(PL.datePalm(10), ringList(k, NQ(k, 20), 3, OA[2], (x, z) => ({x, z, s: rr(.8, 1.2)}), OA[0], OA[1]), pm(k, .2, .8), {rad: .6});
    k.plant(PL.tuft(.5, '#7a8a3a', '#b0a860'), ringList(k, NQ(k, 300), 2, OA[2] + 1, (x, z) => ({x, z, s: rr(.6, 1.2)}), OA[0], OA[1]), pm(k, .1, 1.4), {shadow: false});
    k.plant(PL.acacia(5, '#7a8a48'), ringList(k, NQ(k, 8), 20, 80, (x, z) => ({x, z, s: rr(.6, 1)})), pm(k, .15, .7), {rad: .8});
    k.plant(PL.rock(2.5, '#9a6a48'), ringList(k, NQ(k, 18), 25, 100, (x, z) => ({x, z, s: rr(.5, 2), sy: rr(.6, 1.4)})), smat(k), {rad: 2});
    k.herd(AN.camel(), amat(k, {leg: .3, sp: walkSp(.7, 1.6)}), group(k, 4, -2, -14, 11, .03, {da: .2, dr: 1}));
    k.herd(AN.caprine({horn: 'spiral', col: '#e8e0d0', face: '#6a4a30', s: .6}), amat(k, {leg: .4, sp: walkSp(.6, .9)}), group(k, 3, 18, -18, 6, -.04, {da: .5, dr: 1.5}));
    k.herd(AN.canid({col: '#e8cc98', ear: .16, bel: '#f4e8d0'}), amat(k, {leg: .4, sp: walkSp(1, .4)}), [{path: k.circ(5, -6, 2.5, .15, 0), s: .45}]);
    k.herd(AN.felid({col: '#e0c48c', spots: true, spot: '#8a6a40'}), amat(k, {leg: .4, sp: walkSp(.8, .74)}), [{path: k.circ(-22, -6, 5, -.07, 1), s: .95}]);
    k.herd(AN.bird(1.6, '#5a4a3a'), amat(k, {flap: .15, sp: 1.2}, true), [{path: k.circ(-6, -20, 18, .1, 0, 26, 3), roll: -.35}]);
    return {H, spawn: [0, 6, 0], inside: (x, z) => dist(x, z) < 75 && !oasis(x, z) || (oasis(x, z) && dist(x - OA[0], z - OA[1]) > 4.5), exp: .85, envI: .8};
  };

  /* =================== passaggio 3: taiga, mangrovie, Mediterraneo =================== */
  // mangrovia con radici a trampolo
  PL.mangrove = (h = 9, col = '#3a6a2a') => {
    const b = mk(), tc = '#5a4a3a', y0 = h * .28;
    b.add(G.loft([[0, y0 * .8, 0, h * .04], [0, h * .6, 0, h * .03], [0, h * .7, 0, h * .02]], 7, true), tc);
    for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + rr(0, .4), R = h * rr(.2, .32), cx = Math.cos(a), cz = Math.sin(a);
      b.add(G.loft([[0, y0, 0, h * .018], [cx * R * .5, y0 * 1.05, cz * R * .5, h * .015], [cx * R * .9, y0 * .4, cz * R * .9, h * .012], [cx * R, -.1, cz * R, h * .01]], 5, true), tc); }
    const r = h * .3;
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + rr(0, .6), d = i === 0 ? 0 : r * rr(.45, .75), y = h * (i === 0 ? .86 : rr(.68, .8)), s = r * (i === 0 ? .6 : rr(.4, .55));
      b.add(G.organic(G.tr(G.ico(s, 1), Math.cos(a) * d, y, Math.sin(a) * d), s * .32, 1.2 / s, i), col, {k: rr(.82, 1.1)}); }
    return b.geo({ao: .5, aoH: .85, wave: (x, y) => Math.max(0, y - h * .55) / h * .6});
  };
  // pneumatofori: radici a punta che spuntano dal fango
  PL.pneumato = (r = 1.5) => { const parts = []; for (let i = 0; i < 30; i++) { const a = rr(0, TAU), d = Math.sqrt(rr(0, 1)) * r, x = Math.cos(a) * d, z = Math.sin(a) * d; parts.push(G.loft([[x, -.05, z, .05], [x, rr(.25, .6), z, .015]], 5, true)); }
    return mk().add(X.cat(parts), '#a8987a').geo({}); };
  // nacchera (Pinna nobilis) piantata nella sabbia
  PL.pinna = (L = .7) => mk().add(G.organic(G.tr(G.ell(.18 * L, .5 * L, .07 * L, 10, 8), 0, .35 * L, 0), .02 * L, 8 / L), (x, y, z, c) => { c.set('#7a5a48'); if (Math.sin(y / L * 60) > .6) c.multiplyScalar(.75); }).geo({});

  E({id: 'eco-taiga', name: 'La taiga dell’Ussuri', place: 'Monti Sikhote-Alin, Estremo Oriente russo', lat: 45.3, lon: 136.2, color: '#4a7a50',
    intro: 'Autunno nella taiga dei monti Sikhote-Alin: abeti, pini coreani e larici dorati si mescolano a betulle e aceri gialli e rossi. Nel fiume risalgono i salmoni e li aspettano l’orso bruno e il grande gufo pescatore. Nel bosco cammina il re della taiga: la tigre dell’Amur.',
    facts: [
      ['La tigre dell’Amur', 'È la tigre che vive più a nord, con una pelliccia lunga per inverni a −30 °C. Negli anni ’40 in Russia ne restavano meno di 40; protetta dal 1947, oggi sono circa 750, cuccioli compresi (censimento russo del 2022). Ogni tigre ha bisogno di centinaia di km² di foresta.', 'tigre'],
      ['La foresta più grande della Terra', 'La taiga, o foresta boreale, fa il giro dell’emisfero nord: Scandinavia, Russia, Canada, Alaska. È il bioma terrestre più esteso e comprende più di un quarto delle foreste del mondo. Le conifere hanno aghi e forma a cono, che lascia scivolare la neve.'],
      ['Il pino coreano, albero del cibo', 'I suoi grandi pinoli nutrono cinghiali, cervi, scoiattoli, orsi e la nocciolaia, un uccello che li nasconde nel terreno e così pianta nuovi alberi. Più pinoli vuol dire più cinghiali e cervi, cioè più prede per la tigre.'],
      ['Il gufo pescatore di Blakiston', 'È uno dei gufi più grandi del mondo, con un’apertura alare di quasi due metri. Caccia pesci, soprattutto salmoni, nei tratti di fiume che non gelano, e nidifica nei tronchi cavi degli alberi più vecchi. È «In pericolo».'],
      ['Salmoni che nutrono la foresta', 'In estate e in autunno i salmoni risalgono i fiumi dal mare per deporre le uova, poi muoiono. Orsi, gufi e aquile li mangiano e lasciano i resti nel bosco: così le sostanze nutrienti del mare arrivano nel suolo e fanno crescere gli alberi.'],
      ['Il leopardo dell’Amur', 'Più a sud, nella stessa regione, vive uno dei felini più rari del mondo. Nel 2007 ne restavano circa 30; con il parco nazionale «Terra del leopardo», nato nel 2012, oggi sono più di cento. È ancora «In pericolo critico».']]});
  E({id: 'eco-mangrovie', name: 'Le mangrovie delle Sundarbans', place: 'Delta del Gange e del Brahmaputra (Bangladesh e India)', lat: 21.9, lon: 89.4, color: '#5a8a5a',
    intro: 'Nel grande delta del Gange e del Brahmaputra la marea sale e scende due volte al giorno tra migliaia di canali. Le mangrovie vivono nell’acqua salata, su radici a trampolo, e dal fango spuntano radici che respirano. Sulla riva aspetta un coccodrillo e nel bosco cammina una tigre.',
    facts: [
      ['La foresta di mangrovie più grande del mondo', 'Le Sundarbans coprono circa 10 000 km² tra Bangladesh e India. Il nome viene forse dal sundri, l’albero più comune. La parte indiana e quella del Bangladesh sono Patrimonio dell’Umanità UNESCO dal 1987 e dal 1997.', 'sundri'],
      ['Le tigri che nuotano', 'Le tigri delle Sundarbans attraversano a nuoto canali larghi anche chilometri e mangiano pure pesci e granchi. Sono più di 200, divise tra India e Bangladesh. Il mare che sale e l’acqua sempre più salata riducono il loro territorio.', 'tigre'],
      ['Radici che respirano', 'Nel fango salato manca l’ossigeno. Molte mangrovie fanno spuntare radici a punta, i pneumatofori, che respirano l’aria quando la marea è bassa. Altre si reggono su radici a trampolo, che le tengono salde quando l’acqua sale.'],
      ['Il perioftalmo, un pesce che cammina', 'Con la bassa marea esce dall’acqua e saltella sul fango usando le pinne come zampe. Respira anche con la pelle e la bocca, purché restino bagnate. Accanto a lui i granchi violinisti agitano la loro chela gigante.'],
      ['Il coccodrillo marino', 'È il rettile più grande del mondo e nelle Sundarbans caccia lungo i canali. In India e in Bangladesh ci sono centri che allevano i piccoli e poi li liberano nei fiumi.', 'coccodrillo-marino'],
      ['Uno scudo contro i cicloni', 'Le mangrovie frenano onde e vento: le Sundarbans hanno attenuato la forza dei cicloni Sidr (2007) e Amphan (2020), proteggendo milioni di persone. Il loro fango conserva moltissimo carbonio, per ettaro più di molte foreste di terraferma.']]});
  E({id: 'eco-mediterraneo', name: 'Il mare Mediterraneo', place: 'Area marina protetta delle Isole Egadi (Sicilia)', lat: 37.95, lon: 12.3, color: '#2a70c0',
    intro: 'Sott’acqua alle Egadi: una prateria di posidonia ondeggia sulla sabbia chiara, tra rocce coperte di alghe, gorgonie e spugne. Passano una tartaruga caretta e un branco di tonni rossi, le cernie si affacciano dalle tane e, con un po’ di fortuna, si incontra una foca monaca.',
    facts: [
      ['La prateria di posidonia', 'Non è un’alga ma una pianta con fiori e frutti, che vive solo nel Mediterraneo. Le sue praterie producono ossigeno, frenano le onde e sono la «nursery» di moltissimi pesci. Crescono di pochi centimetri all’anno: un’ancora distrugge in un attimo decenni di crescita.', 'posidonia'],
      ['La nacchera', 'È la conchiglia più grande del Mediterraneo, fino a 1,2 m, e vive piantata nella posidonia. Dal 2016 un parassita ne ha uccise quasi tutte: è «In pericolo critico». Se ne vedi una viva non toccarla e segnalala ai ricercatori.', 'pinna-nobilis'],
      ['La foca monaca', 'La foca più rara del mondo oggi si nasconde nelle grotte marine. Alle Egadi è tornata a farsi vedere, come in Sardegna e in Puglia. Nel 2023 la IUCN l’ha spostata da «In pericolo» a «Vulnerabile».', 'foca-monaca'],
      ['La tartaruga caretta', 'È la tartaruga marina più comune del Mediterraneo: mangia meduse, granchi e molluschi. Depone le uova sulle spiagge, sempre più spesso anche in Italia. La minacciano ami e reti, la plastica scambiata per meduse e le spiagge illuminate di notte.', 'caretta-caretta'],
      ['Il tonno rosso', 'Può superare i 3 metri e nuota velocissimo. Negli anni 2000 la pesca eccessiva lo stava facendo sparire; con le quote di pesca decise dal 2007 è tornato abbondante. A Favignana, nelle Egadi, c’era una delle tonnare più famose.', 'tonno-rosso'],
      ['Un mare che si scalda', 'Il Mediterraneo si scalda più in fretta degli oceani. Le ondate di calore marine fanno morire gorgonie e spugne e arrivano specie dei mari caldi: oggi le specie aliene sono più di mille, molte entrate dal Mar Rosso attraverso il canale di Suez.']]});

  LAND['eco-taiga'] = (k) => {
    const zc = x => -16 + Math.sin(x * .04) * 4;
    const H = (x, z) => { const h = .55 + fbm(x * .03, z * .03, 3) * 1.6 * (.25 + .75 * smooth(14, 30, dist(x * .7, z + 7))) + smooth(-45, -120, z) * (30 + fbm(x * .02, z * .02, 3) * 40) + farHills(x, z, 16, 90, 150); return lerp(h, -.4, smooth(4.5, 1.8, Math.abs(z - zc(x)))); };
    k.H = H;
    // radura che scende fino al fiume e continua sull'altra riva
    const riv = (x, z) => Math.abs(z - zc(x)) < 3.2, clear = (x, z) => dist(x * .7, z + 7) < 15;
    k.sky({top: '#5a8ad0', hor: '#e4e8ea', fog: [60, 380], sunDir: [.5, .55, -.35]});
    k.lights({sky: '#dce6f0', ground: '#6a5a3a', hemi: 1, sun: '#fff0d8', sunI: 1.3, dir: [.5, .55, -.35]});
    k.clouds(16, 80, 140, {op: .8});
    k.terrain(H, (x, y, z, s, c) => { c.set('#5a5630'); c.lerp(C_('#7a6a38'), smooth(.4, .7, fbm(x * .1, z * .1, 3)) * .7); if (clear(x, z)) c.lerp(C_('#8a8a48'), .6); if (y < .35) c.lerp(C_('#8a8478'), .8); if (y > 12) c.lerp(C_('#3a4a30'), smooth(12, 18, y)); if (y > 48) c.lerp(C_('#8a8478'), smooth(48, 56, y)); });
    k.water(.1, '#4a7080', .8, 400, 14, 0, -16);
    const wood = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => !clear(x, z) && H(x, z) < 16 && Math.abs(z - zc(x)) > 4.5 ? f(x, z) : null);
    k.plant(PL.conifer(18, '#24402c'), wood(NQ(k, 90), 10, 110, (x, z) => ({x, z, s: rr(.8, 1.3)})), pm(k, .2, .7), {rad: 1});
    k.plant(PL.conifer(20, '#2e4a2a', '#6a4a30'), wood(NQ(k, 50), 10, 110, (x, z) => ({x, z, s: rr(.8, 1.2)})), pm(k, .2, .7), {rad: 1});
    k.plant(PL.conifer(20, '#c8a040'), wood(NQ(k, 30), 12, 110, (x, z) => ({x, z, s: rr(.7, 1.1)})), pm(k, .2, .7), {rad: 1});
    k.plant(PL.broadleaf(14, '#d8b030', '#e4e0d6', {w: .22, blobs: 6}), wood(NQ(k, 45), 9, 90, (x, z) => ({x, z, s: rr(.7, 1.1)})), pm(k, .25, .6), {rad: .8});
    k.plant(PL.broadleaf(10, '#c04a2a', '#5a4636', {w: .3, blobs: 6}), wood(NQ(k, 25), 9, 80, (x, z) => ({x, z, s: rr(.7, 1.1)})), pm(k, .25, .6), {rad: .8});
    k.plant(PL.broadleaf(14, '#8a7a30', '#5a4636', {w: .3, blobs: 7}), wood(NQ(k, 30), 9, 90, (x, z) => ({x, z, s: rr(.7, 1.2)})), pm(k, .25, .6), {rad: 1});
    k.plant(PL.conifer(16, '#24402c'), ringList(k, NQ(k, 160), 45, 140, (x, z) => z < -40 && H(x, z) < 50 ? {x, z, s: rr(.8, 1.3)} : null), pm(k, .2, .7), {rad: 1});
    k.plant(PL.tuft(.5, '#7a7a3a', '#c0a860'), ringList(k, NQ(k, 1200), 1, 30, (x, z) => (clear(x, z) || k.r() < .3) && !riv(x, z) ? {x, z, s: rr(.6, 1.2)} : null), pm(k, .1, 1.4), {shadow: false});
    k.plant(PL.fern(.8, '#8a7a3a'), wood(NQ(k, 350), 6, 60, (x, z) => ({x, z, s: rr(.6, 1.2)})), pm(k, .1, 1), {shadow: false});
    k.plant(PL.shrub(.7, '#8a5a2a'), wood(NQ(k, 60), 6, 70, (x, z) => ({x, z, s: rr(.5, 1.2)})), pm(k, .05, .8), {shadow: false});
    k.plant(PL.rock(1, '#8a8680'), ringList(k, NQ(k, 40), 5, 80, (x, z) => ({x, z, s: rr(.3, 1.3), sy: rr(.5, .9)})), smat(k), {rad: .6});
    k.plant(PL.log(7, .4, '#5a4a3a'), [{x: 9, z: -2, y: H(9, -2) + .3, r: .4, s: 1}], smat(k));
    // la tigre nella radura, l'orso che pesca, i cervi, i salmoni nel fiume, il gufo pescatore
    k.herd(AN.felid({col: '#d8823a', stripes: true, spot: '#1e1610', bel: '#f2e8d8'}), amat(k, {leg: .4, sp: walkSp(.7, .74)}), [{path: k.circ(-5, -6, 4.5, .07, 1), s: 1.35}]);
    k.herd(AN.bear({col: '#4a3220'}), amat(k, {wave: .02, k: 0, sp: .4}), [{path: k.stay(7, zc(7) + 3.4, PI / 2), s: 1.1}]);
    k.herd(AN.deer({col: '#8a5a38', horns: true, s: .7}), amat(k, {leg: .38, sp: walkSp(.6, 1)}), group(k, 4, 16, -4, 5, .04, {da: .4, dr: 1.5}));
    k.herd(AN.fish({L: .8, h: .2, w: .12, col: '#b0403a', bel: '#d8a090', tail: 'fork'}), amat(k, {wave: .05, k: 6, sp: 5}, true), Array.from({length: NQ(k, 8)}, (_, i) => ({path: t => { const x = -30 + ((t * 1.4 + i * 7.5) % 60); return [x, -.12 + Math.sin(t * 2 + i) * .05, zc(x) + (i % 3 - 1) * .9]; }})), {pitch: .3, shadow: false});
    k.herd(AN.bird(1.9, '#7a6248'), amat(k, {flap: .3, sp: 1.6}, true), [{path: k.circ(0, -16, 10, .12, 0, 9, 2), roll: -.3}]);
    k.herd(AN.bird(.5, '#4a3a30'), amat(k, {flap: 1, sp: 8}, true), Array.from({length: NQ(k, 6)}, (_, i) => ({path: k.circ(rr(-15, 15), rr(-10, 5), rr(5, 12), (i % 2 ? 1 : -1) * rr(.3, .45), rr(0, TAU), rr(6, 12), 1), roll: (i % 2 ? -1 : 1) * .3})), {shadow: false});
    return {H, spawn: [0, 6, 0], inside: (x, z) => dist(x, z) < 70 && H(x, z) < 16 && !riv(x, z), signOk: (x, z) => clear(x, z) && Math.abs(z - zc(x)) > 5, exp: .9, envI: .75};
  };

  LAND['eco-mangrovie'] = (k) => {
    const zc = x => -20 + Math.sin(x * .035) * 6, zc2 = x => 18 + Math.sin(x * .05 + 1) * 4;
    const dch = (x, z) => Math.min(Math.abs(z - zc(x)), Math.abs(z - zc2(x)));
    const H = (x, z) => .35 + fbm(x * .05, z * .05, 3) * .6 - smooth(9, 4, dch(x, z)) * 1.6;
    k.H = H;
    k.sky({top: '#7aa0c8', hor: '#dcdcd0', fog: [40, 230], fogCol: '#c8ccc0', sunDir: [.4, .7, -.4], haze: .4});
    k.lights({sky: '#e0e8e0', ground: '#4a4a30', hemi: 1.05, sun: '#fff2dc', sunI: 1.2, dir: [.4, .7, -.4]});
    k.terrain(H, (x, y, z, s, c) => { c.set('#5a4a38'); c.lerp(C_('#4a5032'), smooth(.35, .6, y) * smooth(.4, .7, fbm(x * .1, z * .1, 3))); if (y < .2) c.lerp(C_('#4a3e30'), .7); });
    k.water(0, '#4a6a62', .9, 900);
    // davanti alla partenza resta una fascia libera fino al canale, per vedere gli animali sulla riva
    const view = (x, z) => Math.abs(x) < 16 && z > zc(x) - 3 && z < 6;
    const land = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => H(x, z) > .3 && !view(x, z) ? f(x, z) : null);
    const edge = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => { const h = H(x, z); return h > -.15 && h < .35 && !view(x, z) ? f(x, z) : null; });
    k.plant(PL.mangrove(9, '#3a6a2a'), edge(NQ(k, 70), 8, 110, (x, z) => ({x, z, s: rr(.7, 1.2)})), pm(k, .2, .6), {rad: 1.5});
    k.plant(PL.broadleaf(16, '#2e5a2a', '#4a3a2c', {w: .28, blobs: 7}), land(NQ(k, 90), 9, 110, (x, z) => ({x, z, s: rr(.7, 1.2)})), pm(k, .25, .6), {rad: 1.2});
    k.plant(PL.mangrove(7, '#4a7a34'), land(NQ(k, 40), 9, 90, (x, z) => ({x, z, s: rr(.7, 1.1)})), pm(k, .2, .6), {rad: 1.2});
    k.plant(PL.cycad(3, '#4f7f3a', '#4a3a2a'), edge(NQ(k, 60), 6, 90, (x, z) => ({x, z, s: rr(.8, 1.3)})), pm(k, .15, .9), {rad: .5});
    k.plant(PL.pneumato(1.6), ringList(k, NQ(k, 240), 3, 40, (x, z) => { const h = H(x, z); return h > -.1 && h < .5 ? {x, z, s: rr(.8, 1.4)} : null; }), smat(k), {shadow: false});
    k.plant(PL.fern(.8, '#4a7a34'), land(NQ(k, 200), 5, 60, (x, z) => ({x, z, s: rr(.6, 1.1)})), pm(k, .1, 1), {shadow: false});
    // la tigre, il coccodrillo sulla riva e uno che nuota, i cervi pomellati con i macachi, perioftalmi e granchi sul fango, uccelli
    k.herd(AN.felid({col: '#d8823a', stripes: true, spot: '#1e1610', bel: '#f2e8d8'}), amat(k, {leg: .4, sp: walkSp(.7, .74)}), [{path: k.circ(-9, -5, 4, .07, 0), s: 1.25}]);
    const cz = zc(6) + 6.8;
    k.herd(AN.croc(4.5), amat(k, {wave: .02, k: 1, sp: .3}), [{path: k.stay(6, cz, PI / 2 + .4, Math.max(H(6, cz), -.08)), s: 1}]);
    k.herd(AN.croc(4), amat(k, {wave: .06, k: 1.5, sp: 1.5}), [{path: t => { const x = 30 - ((t * 1.2) % 60); return [x, -.18, zc(x) + 1]; }}], {shadow: false});
    k.herd(AN.deer({col: '#b0703a', horns: true, s: .5, bel: '#efe4d0'}), amat(k, {leg: .38, sp: walkSp(.6, .7)}), group(k, 5, 13, -5, 4, .04, {da: .45, dr: 1.2}));
    k.herd(AN.primate(), amat(k, {leg: .4, wave: .2, k: 0, sp: 1.5}), [[10, -2, 1], [11.5, -1, 2.4], [15, -2.5, .3]].map(([x, z, r]) => ({path: k.stay(x, z, r), s: 1.6})), {shadow: false});
    const mud = (n, f) => Array.from({length: n}, (_, i) => { for (let j = 0; j < 30; j++) { const x = rr(-12, 14), z = zc(x) + rr(5.5, 8.5); if (H(x, z) > -.02) return f(x, z, i); } return f(0, zc(0) + 8, i); });
    k.herd(AN.fish({L: .15, h: .035, w: .03, col: '#6a6048', bel: '#a89a78', tail: 'round'}), amat(k, {wave: .02, k: 20, sp: 3}), mud(NQ(k, 14), (x, z, i) => ({path: k.circ(x, z, .3, (i % 2 ? 1 : -1) * .25, rr(0, TAU)), dy: .03, s: 1.5})), {shadow: false});
    k.herd(AN.smallArthro(.07, '#d04a2a', 4), amat(k, {leg: .6, sp: 9}), mud(NQ(k, 24), (x, z, i) => ({path: k.circ(x, z, rr(.2, .6), (i % 2 ? 1 : -1) * rr(.05, .15), rr(0, TAU)), s: 1.4})), {shadow: false});
    k.herd(AN.bird(1.1, '#f4f4ee'), amat(k, {flap: .4, sp: 2.5}, true), Array.from({length: NQ(k, 4)}, (_, i) => ({path: k.circ(rr(-15, 15), -18 + rr(-5, 5), rr(10, 18), (i % 2 ? 1 : -1) * rr(.12, .18), rr(0, TAU), rr(8, 14), 2), roll: (i % 2 ? -1 : 1) * .3})), {shadow: false});
    k.herd(AN.bird(.4, '#2a6ab8'), amat(k, {flap: 1, sp: 9}, true), Array.from({length: NQ(k, 3)}, (_, i) => ({path: k.circ(rr(-10, 10), zc(0) + rr(-2, 2), rr(4, 8), (i % 2 ? 1 : -1) * .5, rr(0, TAU), rr(1.5, 3), .5), roll: (i % 2 ? -1 : 1) * .3})), {shadow: false});
    return {H, spawn: [0, 2, 0], inside: (x, z) => dist(x, z) < 60 && H(x, z) > .2, signOk: (x, z) => H(x, z) > .3, exp: 1, envI: .8};
  };

  LAND['eco-mediterraneo'] = (k) => {
    const rk = (x, z) => Math.max(0, fbm(x * .06 + 7, z * .06 - 2, 3) - .55);
    const H = (x, z) => fbm(x * .03, z * .03, 3) * 1.4 + rk(x, z) * 9 + smooth(45, 90, dist(x, z)) * 6 * fbm(x * .02, z * .02 + 5);
    k.H = H;
    const sand = (x, z) => rk(x, z) < .02;
    sea(k, {top: '#a0e0f4', hor: '#2a80c0', bot: '#0a2e58', fog: .025, surf: 12, rayOp: .16, sunI: .75});
    k.terrain(H, (x, y, z, s, c) => { c.set('#dcd0b4'); c.lerp(C_('#b8ac90'), smooth(.45, .75, fbm(x * .25, z * .25, 2)) * .6); if (!sand(x, z)) { c.lerp(C_('#7a7a68'), .8); c.lerp(C_('#6a7a4a'), smooth(.4, .7, fbm(x * .4, z * .4, 2)) * .6); } }, {caustics: {i: .3, scale: .4}});
    const ROCK = [[-8, -16, 2.6], [10, -22, 3.2], [-3, -30, 3.6]];
    k.plant(PL.rock(1, '#7a7a68'), ROCK.map(([x, z, s]) => ({x, z, y: H(x, z) - .3, s, sy: .7})), smat(k), {rad: 2});
    const near = (n, f) => ringList(k, n, 2, 45, (x, z) => !sand(x, z) || ROCK.some(([rx, rz, s]) => dist(x - rx, z - rz) < s + 1.2) ? f(x, z) : null);
    k.plant(PL.tuft(1, '#2e5e28', '#8a9a50', 10), ringList(k, NQ(k, 3500), 2.5, 32, (x, z) => sand(x, z) && !ROCK.some(([rx, rz, s]) => dist(x - rx, z - rz) < s + .5) && fbm(x * .08 - 4, z * .08 + 9, 2) > .3 ? {x, z, s: rr(1, 1.6)} : null), pm(k, .12, .6), {shadow: false, v: .2});
    k.plant(PL.pinna(.8), [[4, -9], [-6, -12], [9, -14]].map(([x, z]) => ({x, z, y: H(x, z), r: rr(0, TAU), s: rr(.9, 1.1)})), smat(k), {shadow: false});
    k.plant(PL.fanCoral(1.4, '#b8283a'), near(NQ(k, 60), (x, z) => ({x, z, s: rr(.6, 1.3)})), pm(k, .08, .5), {rad: .3, shadow: false});
    k.plant(PL.fanCoral(1.1, '#e0c040'), near(NQ(k, 30), (x, z) => ({x, z, s: rr(.6, 1.1)})), pm(k, .08, .5), {rad: .3, shadow: false});
    k.plant(PL.staghorn(.35, '#c8282a'), near(NQ(k, 50), (x, z) => ({x, z, s: rr(.7, 1.3)})), smat(k), {rad: .2, shadow: false});
    k.plant(PL.sponge(.6, '#e0a030'), near(NQ(k, 40), (x, z) => ({x, z, s: rr(.6, 1.4)})), smat(k), {rad: .3});
    k.plant(PL.seaweed(.5, '#6a8a3a'), near(NQ(k, 80), (x, z) => ({x, z, s: rr(.6, 1.2)})), pm(k, .07, .6), {shadow: false});
    const sw = (n, f) => Array.from({length: n}, f);
    k.herd(AN.pinniped({col: '#4a4a48', bel: '#9a9a90'}), amat(k, {wave: .05, k: 1.5, sp: 1.5}, true), [{path: k.circ(-2, -18, 9, .08, 1, 3.5, 1), s: .9}], {pitch: .4});
    k.herd(AN.turtle(1, '#8a5a2a'), amat(k, {flap: .35, sp: 1.6}, true), [{path: k.circ(4, -12, 8, -.07, 2, 4, .8)}], {pitch: .5});
    k.herd(AN.fish({L: 2.2, h: .5, w: .4, col: '#1e2a4a', bel: '#c8ccd4', tail: 'fork', dorsal2: true}), amat(k, {wave: .05, k: 2.5, sp: 4}, true), sw(NQ(k, 8), (_, i) => ({path: k.circ(rr(-1.5, 1.5), -30 + rr(-1.5, 1.5), 14 + rr(-1.5, 1.5), .14, i * .12, rr(6, 8.5), .4)})), {pitch: .4});
    k.herd(AN.fish({L: 1.1, h: .32, w: .22, tail: 'round', cf: X.mottled('#5a4630', 6, .3, '#8a7a5a')}), amat(k, {wave: .04, k: 3, sp: 2.5}, true), ROCK.map(([x, z, s], i) => ({path: k.circ(x, z, s + 1.5, (i % 2 ? 1 : -1) * .1, rr(0, TAU), H(x, z) + 1.2, .3)})), {pitch: .3});
    k.herd(AN.fish({L: .12, h: .04, w: .02, col: '#2a2a3a', bel: '#4a4a5a', tail: 'fork'}), amat(k, {wave: .02, k: 30, sp: 12}, true), sw(NQ(k, 60), (_, i) => { const [x, z, s] = ROCK[i % 3]; return {path: k.circ(x + rr(-1, 1), z + rr(-1, 1), rr(1.5, s + 2), (i % 2 ? 1 : -1) * rr(.2, .4), rr(0, TAU), H(x, z) + rr(2, 4), .3)}; }), {pitch: .4, shadow: false});
    k.herd(AN.fish({L: .35, h: .1, w: .05, col: '#a8b0b0', bel: '#d8dcd0', tail: 'fork'}), amat(k, {wave: .03, k: 14, sp: 9}, true), sw(NQ(k, 40), (_, i) => ({path: k.circ(6 + rr(-1.5, 1.5), -6 + rr(-1.5, 1.5), rr(3, 5), -.25, i * .12, rr(1.2, 2.2), .2)})), {pitch: .4, shadow: false});
    return {H, spawn: [0, 0, 0], eye: 2.6, under: true, signScale: .85, signLift: .8, inside: (x, z) => dist(x, z) < 55, exp: 1.1, envI: .45, speed: .7, pitch: -.1};
  };

  /* =================== passaggio 4: Antartide, prateria, oceano aperto =================== */
  // pinguino imperatore (o.chick: pulcino grigio con la maschera bianca)
  AN.penguin = (o = {}) => {
    const b = mk(), K = '#1c1e24';
    const cf = o.chick ? (x, y, z, c) => { c.set('#a8a8a4'); if (y > .78) c.set(x > .03 && y < .95 ? '#f2f2ee' : K); }
      : (x, y, z, c) => { c.set(K); if (x > .03 && y < .86) c.set(y > .7 ? '#f4ecd0' : '#f4f2ea'); if (y > .84 && y < .95 && Math.abs(z) > .06 && x > -.04) c.set('#f0b030'); };
    b.add(G.loft([[-.02, .05, 0, .12, .1], [0, .3, 0, .2, .17], [.02, .6, 0, .19, .16], [.03, .85, 0, .12, .11], [.05, .97, 0, .1, .09], [.06, 1.04, 0, .06, .06]], 10, true), cf);
    if (!o.chick) b.add(G.loft([[.1, 1.0, 0, .025], [.24, .96, 0, .008]], 5, true), '#2a2622');
    for (const z of [-1, 1]) { b.add(G.loft([[0, .72, z * .17, .04, .015], [-.02, .48, z * .2, .035, .012], [-.03, .32, z * .2, .02, .01]], 5, true), o.chick ? '#a8a8a4' : K);
      b.add(G.tr(G.ell(.07, .025, .04, 6, 4), .04, .02, z * .07), '#2a2622'); }
    eyes(b, .1, 1.0, .06, .012);
    return b.geo({});
  };
  // cane della prateria, in piedi sulla tana
  AN.pdog = () => { const b = mk(), col = '#b08a5a';
    b.add(G.loft([[0, .02, 0, .08, .08], [0, .12, 0, .1, .09], [.01, .24, 0, .08, .075], [.02, .3, 0, .05, .05]], 8, true), col, {belly: '#d8c0a0'});
    b.add(G.tr(G.ell(.05, .045, .045, 6, 4), .03, .34, 0), col); eyes(b, .07, .35, .03, .008);
    return b.geo({}); };
  // fiori di prateria: steli con capolini
  PL.flower = (h = .9, col = '#b06ab0') => { const st = [], hd = [];
    for (let i = 0; i < 5; i++) { const x = rr(-.12, .12), z = rr(-.12, .12), l = h * rr(.75, 1.1); st.push(G.loft([[0, 0, 0, .012], [x, l, z, .008]], 4, true)); hd.push(G.tr(G.ico(h * .06, 0), x, l, z)); }
    return mk().add(X.cat(st), '#5a7a3a').add(X.cat(hd), col).geo({wave: (x, y) => y / h * .7}); };
  // iceberg tabulare
  PL.berg = (r = 8) => mk().add(G.organic(G.cyl(r, r * 1.08, r * .7, 10), r * .12, 1 / r), (x, y, z, c) => c.set(y > r * .2 ? '#f4f8fb' : '#9ad0e4')).geo({});

  E({id: 'eco-antartide', name: 'L’Antartide', place: 'Cape Washington, Mare di Ross', lat: -74.65, lon: 165.4, color: '#a8d8f0',
    intro: 'Primavera antartica sul ghiaccio marino del Mare di Ross. Una colonia di pinguini imperatore si stringe con i pulcini, le foche di Weddell riposano accanto ai loro buchi nel ghiaccio. Oltre il bordo della banchisa, tra iceberg grandi come palazzi, passano le orche.',
    facts: [
      ['Il pinguino imperatore', 'È il pinguino più grande e l’unico animale che si riproduce sul ghiaccio marino nel cuore dell’inverno antartico. Il maschio tiene l’uovo sulle zampe per circa due mesi, senza mangiare, stretto agli altri per non congelare. Se il ghiaccio si rompe troppo presto, i pulcini non sopravvivono.', 'pinguino-imperatore'],
      ['Il krill, base di tutto', 'Questo piccolo gamberetto, lungo circa 6 cm, vive in sciami immensi: forse 300–500 milioni di tonnellate in tutto. Lo mangiano balene, pinguini, foche e pesci. Le sue larve si nutrono delle alghe che crescono sotto il ghiaccio marino.', 'krill-antartico'],
      ['La foca di Weddell', 'È il mammifero che si riproduce più a sud sulla Terra. Passa l’inverno sotto il ghiaccio e tiene aperti i buchi per respirare raschiandoli con i denti. Si immerge per centinaia di metri e può restare sott’acqua più di un’ora.'],
      ['Le orche del ghiaccio', 'In Antartide vivono diversi tipi di orche, con prede e abitudini diverse. Alcune cacciano le foche in gruppo: nuotano insieme verso un lastrone di ghiaccio e sollevano un’onda che fa scivolare la foca in acqua.', 'orca'],
      ['Il parco marino del Mare di Ross', 'Nel 2016 i paesi della commissione CCAMLR hanno creato qui un’area marina protetta di 1,55 milioni di km², cinque volte l’Italia. In gran parte è vietato pescare: è uno degli ultimi mari quasi intatti del pianeta.'],
      ['Il ghiaccio che cambia', 'Il ghiaccio marino antartico cresce d’inverno e si scioglie d’estate. Per decenni è rimasto stabile, ma nel 2023 ha toccato il valore più basso mai misurato dai satelliti. Meno ghiaccio vuol dire meno krill e meno posti sicuri per i pinguini.']]});
  E({id: 'eco-prateria', name: 'La prateria nordamericana', place: 'Tallgrass Prairie Preserve, Flint Hills (Oklahoma, USA)', lat: 36.85, lon: -96.42, color: '#c0a050',
    intro: 'Fine estate nelle Grandi Pianure: colline coperte di erba alta, punteggiate di fiori. Una mandria di bisonti pascola, le antilocapre corrono veloci, i cani della prateria fanno la guardia davanti alle tane e tra i fiori volano le farfalle monarca.',
    facts: [
      ['Il bisonte americano', 'Nell’Ottocento i bisonti erano decine di milioni; nel 1889 ne restavano meno di mille, sterminati per le pelli e per affamare i nativi americani. Qui ne sono stati liberati 300 nel 1993: oggi la mandria conta circa 2 500 animali.', 'bisonte-americano'],
      ['Una prateria quasi scomparsa', 'La prateria a erba alta copriva gran parte del centro degli Stati Uniti; oggi ne resta meno del 4%, perché il suo suolo fertilissimo è diventato campi di mais e grano. Le erbe hanno radici profonde fino a 2–3 metri, che trattengono il suolo e immagazzinano carbonio.'],
      ['Il fuoco che rinnova', 'Gli incendi, accesi dai fulmini e un tempo anche dai nativi americani, bruciano gli arbusti e impediscono al bosco di avanzare. Dopo il fuoco l’erba ricresce tenera e i bisonti vanno a brucarla. Ancora oggi la prateria si cura con fuochi controllati.'],
      ['Il cane della prateria', 'Non è un cane ma uno scoiattolo di terra che vive in grandi «città» di tane. Le sentinelle avvisano gli altri con richiami diversi a seconda del predatore in arrivo. Le loro tane danno rifugio a gufi, serpenti e furetti.'],
      ['La farfalla monarca', 'I suoi bruchi mangiano solo l’asclepiade, una pianta della prateria. In autunno le monarche volano fino alle montagne del Messico, a migliaia di chilometri. Con meno prateria e più erbicidi l’asclepiade scarseggia e le monarche diminuiscono.', 'farfalla-monarca'],
      ['Il furetto dai piedi neri', 'Mangia quasi solo cani della prateria. Nel 1979 era creduto estinto, ma nel 1981 un cane di un allevatore ne scoprì una colonia nel Wyoming. Dagli ultimi 18 individui, allevati in cattività, sono nati i furetti liberati di nuovo nelle praterie. È «In pericolo».']]});
  E({id: 'eco-oceano', name: 'L’oceano aperto', place: 'Banco Princesa Alice, Azzorre (Portogallo)', lat: 37.85, lon: -29.1, color: '#1a5aa0',
    intro: 'In mezzo all’Atlantico una montagna sottomarina sale dal fondo, a oltre mille metri, fino a circa 30 metri dalla superficie. Intorno c’è solo blu. Qui d’estate si radunano le mante e i loro parenti diavoli di mare; passano tonni, squali mako, una tartaruga caretta, banchi di sgombri e uno squalo balena, mentre più al largo nuotano un capodoglio e una balenottera azzurra.',
    facts: [
      ['Il mondo più grande', 'L’oceano aperto, lontano dalle coste, è di gran lunga l’ambiente più vasto della Terra: è la maggior parte dello spazio in cui la vita può esistere. Gli animali qui non hanno rifugi e percorrono distanze enormi; le montagne sottomarine sono come oasi dove trovano cibo.'],
      ['Il più piccolo produttore', 'Il Prochlorococcus è un batterio così piccolo che ne starebbero migliaia in un millimetro, ma è l’essere fotosintetico più abbondante della Terra. Insieme alle alghe microscopiche del plancton, produce circa metà dell’ossigeno del pianeta.', 'prochlorococcus'],
      ['Il capodoglio', 'Si immerge anche per più di un’ora, oltre i mille metri di profondità per cacciare calamari, anche giganti. Alle Azzorre i capodogli furono cacciati con le lance fino al 1987; oggi gli stessi villaggi vivono del whale watching.', 'capodoglio'],
      ['La balenottera azzurra', 'È l’animale più grande mai esistito, fino a 30 metri. In primavera passa al largo delle Azzorre durante le sue migrazioni e si nutre di krill. Quasi sterminata nel Novecento, si sta riprendendo lentamente.', 'balenottera-azzurra'],
      ['Lo squalo balena', 'Il pesce più grande del mondo mangia solo plancton e piccoli pesci. Vive nei mari tropicali, ma negli ultimi anni lo si avvista sempre più spesso anche alle Azzorre, quando l’acqua d’estate è più calda. È «In pericolo».', 'squalo-balena'],
      ['Le tartarughe venute dalla Florida', 'Le piccole tartarughe caretta nate sulle spiagge della Florida si lasciano portare dalle correnti attraverso l’Atlantico. Molte passano anni nelle acque delle Azzorre, mangiando meduse, prima di tornare in America da adulte.', 'caretta-caretta']]});

  LAND['eco-antartide'] = (k) => {
    const fl = (x, z) => fbm(x * .035 + 5, z * .035 - 3, 3);
    const edgeZ = x => -26 + (fbm(x * .04 + 3, 1.7, 2) - .5) * 10;
    const H = (x, z) => { const d = dist(x, z); let h = z > edgeZ(x) || d < 18 ? .5 + fbm(x * .15, z * .15, 2) * .2 : fl(x, z) > .62 ? .4 : -3; return h + smooth(130, 180, d) * 40 * fbm(x * .02, z * .02, 3); };
    k.H = H;
    const ice = (x, z) => H(x, z) > .3, COL = [-4, -14], colony = (x, z) => dist(x - COL[0], z - COL[1]) < 8;
    k.sky({top: '#6a9ad0', hor: '#eef2f6', fog: [80, 460], sunDir: [.6, .2, -.5], sunSize: .7, glow: 1.2});
    k.lights({sky: '#e4eef6', ground: '#d0e0ea', hemi: 1.15, sun: '#fff0e0', sunI: 1.25, dir: [.6, .2, -.5]});
    k.clouds(12, 60, 110, {op: .6});
    k.terrain(H, (x, y, z, s, c) => { c.set('#f4f8fb'); c.lerp(C_('#d4e4ee'), smooth(.45, .7, fbm(x * .2, z * .2, 2)) * .6); if (colony(x, z)) c.lerp(C_('#c8b8a0'), .35 * smooth(8, 3, dist(x - COL[0], z - COL[1]))); if (y < .2) c.set('#4a6a7a'); if (y > 4) c.set(s > .4 ? '#4a4a4e' : '#eef2f4'); });
    k.water(0, '#1a3a4a', .88, 900);
    k.plant(PL.floe(3), ringList(k, NQ(k, 40), 28, 90, (x, z) => H(x, z) < 0 ? {x, z, y: -.3, s: rr(.4, 1.4), r: rr(0, TAU)} : null), smat(k), {shadow: false});
    k.plant(PL.berg(8), [[-30, -70], [25, -85], [60, -55]].map(([x, z]) => ({x, z, y: -1.5, r: rr(0, TAU), s: rr(.9, 1.6), sy: rr(.8, 1.3)})), smat(k), {shadow: false});
    // colonia di pinguini, pulcini, foche di Weddell, orche oltre il bordo, uccelli
    const huddle = (n, R) => Array.from({length: n}, () => { const a = rr(0, TAU), d = Math.sqrt(rr(0, 1)) * R; return {path: k.stay(COL[0] + Math.cos(a) * d, COL[1] + Math.sin(a) * d, rr(0, TAU)), s: rr(1, 1.15)}; });
    k.herd(AN.penguin(), amat(k, {wave: .02, k: 0, sp: .5}), huddle(NQ(k, 70), 5.5));
    k.herd(AN.penguin({chick: true}), amat(k, {wave: .02, k: 0, sp: .5}), huddle(NQ(k, 18), 4).map(p => Object.assign(p, {s: rr(.5, .6)})));
    k.herd(AN.penguin(), amat(k, {wave: .03, k: 0, sp: .8}), [0, 1, 2].map(i => ({path: k.circ(6, -10, 3, .12, i * .5), s: 1.1})));
    k.herd(AN.pinniped({col: '#5a5e66', bel: '#8a8e94'}), amat(k, {wave: .03, k: 0, sp: .3}), [[12, -8, 2], [15, -13, 1], [-17, -6, .4]].map(([x, z, r]) => ({path: k.stay(x, z, r), s: rr(1, 1.15)})));
    k.herd(AN.orca(7), amat(k, {wave: .06, k: 1, sp: 2}, true), [0, 1, 2, 3].map(i => ({path: t => { const x = 40 - ((t * 2.5 + i * 6) % 80); return [x, -.6 + Math.sin(t * .9 + i * 2) * .7, edgeZ(x) - 6 - i * 1.5]; }})), {pitch: .6});
    k.herd(AN.bird(.9, '#f6f6f2'), amat(k, {flap: .8, sp: 6}, true), Array.from({length: NQ(k, 6)}, (_, i) => ({path: k.circ(rr(-20, 20), rr(-30, 0), rr(8, 18), (i % 2 ? 1 : -1) * rr(.25, .35), rr(0, TAU), rr(6, 14), 1), roll: (i % 2 ? -1 : 1) * .3})), {shadow: false});
    k.herd(AN.bird(1.3, '#5a4a3a'), amat(k, {flap: .4, sp: 3}, true), [{path: k.circ(-4, -14, 9, .15, 0, 7, 1), roll: -.3}], {shadow: false});
    return {H, spawn: [0, 6, 0], inside: (x, z) => dist(x, z) < 60 && ice(x, z) && !colony(x, z), signOk: (x, z) => ice(x, z) && dist(x - COL[0], z - COL[1]) > 8.5, exp: .85, envI: .9};
  };

  LAND['eco-prateria'] = (k) => {
    const TW = [7, -9, 7], town = (x, z) => dist(x - TW[0], z - TW[1]) < TW[2];
    const H = (x, z) => .3 + fbm(x * .02, z * .02, 3) * 4 * smooth(6, 30, dist(x, z)) + farHills(x, z, 8, 90, 150);
    k.H = H;
    k.sky({top: '#3a7ad0', hor: '#e6e2d0', fog: [100, 480], sunDir: [.5, .6, -.3]});
    k.lights({sky: '#e0e8f0', ground: '#9a8a50', hemi: 1, sun: '#fff0d6', sunI: 1.4, dir: [.5, .6, -.3]});
    k.clouds(20, 70, 130, {op: .9});
    k.terrain(H, (x, y, z, s, c) => { c.set('#7a8040'); c.lerp(C_('#a08a50'), smooth(.4, .7, fbm(x * .08, z * .08, 3)) * .7); if (town(x, z)) c.lerp(C_('#8a7050'), .7 * smooth(TW[2], TW[2] - 2, dist(x - TW[0], z - TW[1]))); if (s > .45) c.lerp(C_('#a8a090'), .6); });
    const open = (n, r0, r1, f) => ringList(k, n, r0, r1, (x, z) => town(x, z) ? null : f(x, z));
    k.plant(PL.tuft(1, '#6a7a3a', '#a06a4a', 10), open(NQ(k, 4500), 2, 40, (x, z) => ({x, z, s: rr(.8, 1.3)})), pm(k, .15, 1.2), {shadow: false, v: .25});
    k.plant(PL.tuft(1, '#6a7a3a', '#b08a50', 8), open(NQ(k, 2500), 38, 75, (x, z) => ({x, z, s: rr(1, 1.6)})), pm(k, .15, 1.2), {shadow: false, v: .25});
    k.plant(PL.tuft(.9, '#8a8a48', '#d0b870', 6), open(NQ(k, 1500), 50, 140, (x, z) => ({x, z, s: rr(1, 1.8)})), pm(k, .12, 1.2), {shadow: false, v: .25});
    k.plant(PL.tuft(.25, '#7a8a40', '#a8a860', 5), ringList(k, NQ(k, 300), .5, TW[2], (x, z) => ({x, z, s: rr(.7, 1.2)}), TW[0], TW[1]), pm(k, .1, 1.4), {shadow: false});
    [['#b06ab0', 220], ['#e08aa8', 120], ['#e0c030', 160], ['#f2f0ea', 80]].forEach(([c, n]) => k.plant(PL.flower(1, c), open(NQ(k, n), 2, 50, (x, z) => ({x, z, s: rr(.7, 1.2)})), pm(k, .12, 1.3), {shadow: false}));
    k.plant(PL.mound(.5, '#8a6a48'), ringList(k, NQ(k, 14), 1, TW[2] - 1, (x, z) => ({x, z, s: rr(1.2, 1.8), sy: .25}), TW[0], TW[1]), smat(k), {rad: .3});
    k.plant(PL.broadleaf(16, '#5a7a3a', '#6a5a48', {w: .32, blobs: 7}), ringList(k, NQ(k, 14), 60, 120, (x, z) => z > 20 ? {x, z, s: rr(.8, 1.2)} : null), pm(k, .25, .6), {rad: 1.2});
    k.plant(PL.rock(1.2, '#b0a890'), open(NQ(k, 25), 15, 90, (x, z) => ({x, z, s: rr(.4, 1.4), sy: rr(.4, .7)})), smat(k), {rad: .8});
    // bisonti, antilocapre, cani della prateria, coyote, poiana, farfalle monarca
    k.herd(AN.bison({col: '#5a3e28'}), amat(k, {leg: .35, sp: walkSp(.6, 1.15)}), group(k, NQ(k, 18), -10, -36, 12, .02, {da: .12, dr: 4, sc: 3, s0: .85, s1: 1.05}));
    k.herd(AN.bison({col: '#5a3e28'}), amat(k, {leg: .35, sp: walkSp(.5, 1.15)}), group(k, 3, -12, -13, 4, -.02, {da: .5, dr: 1, s0: 1.05, s1: 1.15}));
    k.herd(AN.caprine({horn: 'hook', col: '#c08a50', face: '#f0e8d8', bel: '#f4ece0', s: .5}), amat(k, {leg: .45, sp: walkSp(1.5, .7)}), group(k, 5, 24, -26, 8, .12, {da: .25, dr: 1.5}));
    k.herd(AN.pdog(), amat(k, {wave: .02, k: 0, sp: .5}), Array.from({length: NQ(k, 10)}, () => { const a = rr(0, TAU), d = rr(1, TW[2] - 1.5); return {path: k.stay(TW[0] + Math.cos(a) * d, TW[1] + Math.sin(a) * d, rr(0, TAU)), s: 1.2}; }));
    k.herd(AN.canid({col: '#a08a6a', bel: '#d8ccb8'}), amat(k, {leg: .4, sp: walkSp(1, .5)}), [{path: k.circ(TW[0], TW[1], TW[2] + 3, -.07, 2), s: .7}]);
    k.herd(AN.bird(1.3, '#6a4a30'), amat(k, {flap: .2, sp: 1.2}, true), [{path: k.circ(4, -14, 16, .1, 0, 20, 3), roll: -.35}], {shadow: false});
    k.herd(AN.bird(.12, '#e07a1a'), amat(k, {flap: 1, sp: 6}, true), Array.from({length: NQ(k, 10)}, () => ({path: k.circ(rr(-8, 4), rr(-10, -3), rr(.6, 2), rr(.4, .9) * (k.r() < .5 ? 1 : -1), rr(0, TAU), H(0, -6) + rr(1, 2.2), .5)})), {shadow: false});
    return {H, spawn: [0, 6, 0], inside: (x, z) => dist(x, z) < 80, signOk: (x, z) => !town(x, z), exp: .9, envI: .75};
  };

  LAND['eco-oceano'] = (k) => {
    const H = (x, z) => fbm(x * .05, z * .05, 3) * 2 + Math.max(0, fbm(x * .1 + 3, z * .1, 2) - .55) * 4 - smooth(16, 40, dist(x, z)) * 45;
    k.H = H;
    sea(k, {top: '#7ac8f0', hor: '#1a5aa8', bot: '#04183a', fog: .022, surf: 20, rayOp: .12, sunI: .6});
    k.terrain(H, (x, y, z, s, c) => { c.set('#7a7468'); c.lerp(C_('#9a8a6a'), smooth(.4, .7, fbm(x * .3, z * .3, 2)) * .6); c.lerp(C_('#6a7a4a'), smooth(.5, .8, fbm(x * .5 + 3, z * .5, 2)) * .5); }, {caustics: {i: .2, scale: .3}});
    const top = (n, f) => ringList(k, n, 2, 22, (x, z) => H(x, z) > -4 ? f(x, z) : null);
    k.plant(PL.rock(1.2, '#6a665e'), top(NQ(k, 40), (x, z) => ({x, z, s: rr(.5, 2), sy: rr(.5, .9)})), smat(k), {rad: 1});
    k.plant(PL.seaweed(.6, '#7a8a3a'), top(NQ(k, 120), (x, z) => ({x, z, s: rr(.6, 1.3)})), pm(k, .07, .6), {shadow: false});
    k.plant(PL.sponge(.5, '#d89040'), top(NQ(k, 40), (x, z) => ({x, z, s: rr(.6, 1.3)})), smat(k), {rad: .3});
    k.plant(PL.fanCoral(1, '#c0a060'), top(NQ(k, 30), (x, z) => ({x, z, s: rr(.6, 1.2)})), pm(k, .08, .5), {rad: .3, shadow: false});
    // pesce con macchie chiare fatte di geometria (squalo balena)
    const dots = (b, L, h, w) => { for (let i = 0; i < 70; i++) { const x = rr(-.3, .35) * L, f = 1 - Math.pow(x / (.5 * L), 2), a = rr(-1.6, 1.6); b.add(G.tr(G.ell(.012 * L, .012 * L, .012 * L, 5, 3), x, Math.cos(a) * h * .46 * f, Math.sin(a) * w * .46 * f), '#e8eef0'); } };
    // modelli 3D veri (cartella modelli/); se mancano restano quelli fatti dal codice
    const mantas = Array.from({length: NQ(k, 9)}, (_, i) => ({path: k.circ(-4 + rr(-2, 2), -18 + rr(-2, 2), 9 + rr(-2, 2), .07, i * .25, rr(5, 9), 1), s: rr(.85, 1.1)}));
    k.model('modelli/manta.glb', {len: 4, v0: .65, sRef: 1, noMorph: true, credit: 'DigitalLife3D (manta, squalo balena, squalo mako, tartaruga caretta; CC BY-NC 4.0)'}, mantas, () => k.herd(AN.manta(2.6), amat(k, {flap: .4, sp: 1.3}, true), mantas, {pitch: .4, shadow: false}));
    const wshark = [{path: k.circ(6, -20, 16, -.035, 1, 7, 1.5)}];
    k.model('modelli/squalobalena.glb', {len: 9, v0: .6}, wshark, () => k.herd(AN.fish({L: 9, h: 1.4, w: 1.5, col: '#3a4a5a', bel: '#d8dcd8', tail: 'hetero', pect: 1.2, extra: dots}), amat(k, {wave: .08, k: .8, sp: 1.2}, true), wshark, {pitch: .3}));
    const sperm = [{path: t => { const x = 60 - ((t * 1.6) % 120); return [x, 14, -45]; }}];
    k.model('modelli/capodoglio.glb', {len: 13, v0: 1.6, credit: 'AneesAnimates (capodoglio, CC BY 4.0)'}, sperm, () => k.herd(AN.fish({L: 12, h: 2.2, w: 1.8, col: '#4a4a50', bel: '#5a5a60', tail: 'fork', dorsal: false, pect: .5, sp: [[-.5, 0, .04, .03], [-.36, 0, .2, .18], [-.1, 0, .42, .4], [.2, .02, .5, .45], [.42, .04, .5, .42], [.5, .03, .45, .35]]}), amat(k, {wave: .06, k: .5, sp: .8}, true), sperm, {shadow: false}));
    const blue = [{path: t => { const x = -70 + ((t * 2) % 140); return [x, 10, -60]; }}];
    k.model('modelli/balenottera.glb', {len: 24, v0: 2, credit: 'dannzjs (balenottera azzurra, CC BY 4.0)'}, blue, () => k.herd(AN.fish({L: 22, h: 2.6, w: 2.6, col: '#6a7a8a', bel: '#8a9aa8', tail: 'fork', dx: -.3, pect: .6}), amat(k, {wave: .05, k: .3, sp: .6}, true), blue, {shadow: false}));
    const tunas = Array.from({length: NQ(k, 12)}, (_, i) => ({path: k.circ(rr(-1.5, 1.5), -10 + rr(-1.5, 1.5), 18 + rr(-1.5, 1.5), .2, i * .1, rr(8, 11), .4), s: rr(.85, 1.1)}));
    k.model('modelli/tonno.glb', {len: 1.7, v0: 3.6, sRef: 1, credit: 'dhjwdwd (tonno pinna gialla, CC BY 4.0)'}, tunas, () => k.herd(AN.fish({L: 1.6, h: .35, w: .3, col: '#1e2a4a', bel: '#c8ccd4', tail: 'fork', dorsal2: true}), amat(k, {wave: .05, k: 3, sp: 5}, true), tunas, {pitch: .4}));
    const makos = [0, 1].map(i => ({path: k.circ(-10 + i * 18, -24, 12, (i ? 1 : -1) * .08, i * 2, 4 + i * 2, .8)}));
    k.model('modelli/mako.glb', {len: 2.6, v0: 1}, makos, () => k.herd(AN.shark(2.4), amat(k, {wave: .08, k: 2.5, sp: 4}, true), makos, {pitch: .5}));
    const turtle = [{path: k.circ(3, -8, 6, .09, 0, 5, .6)}];
    k.model('modelli/caretta.glb', {len: 1.1, v0: .55}, turtle, () => k.herd(AN.turtle(.7, '#8a5a2a'), amat(k, {flap: .35, sp: 1.8}, true), turtle, {pitch: .5}));
    const macks = Array.from({length: NQ(k, 30)}, (_, i) => ({path: k.circ(8 + rr(-1.2, 1.2), -6 + rr(-1.2, 1.2), rr(3, 5), -.3, i * .2, rr(2, 4), .3), s: rr(.85, 1.15)}));
    k.model('modelli/sgombro.glb', {len: .35, v0: 1.2, sRef: 1, credit: '1shxxn (sgombro, CC BY 4.0)'}, macks, () => k.herd(AN.fish({L: .45, h: .12, w: .06, col: '#a8b8c0', bel: '#e0e4e0', tail: 'fork'}), amat(k, {wave: .03, k: 12, sp: 9}, true), macks, {pitch: .5, shadow: false}));
    return {H, spawn: [0, 0, 0], eye: 2.6, under: true, signScale: .85, signLift: .8, inside: (x, z) => dist(x, z) < 16 && H(x, z) > -4, exp: 1.1, envI: .45, speed: .7, pitch: -.05};
  };
};
