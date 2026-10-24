# Globo «Sapiens» — formato dei contenuti

Pagina `sapiens.html`: globo da 60 000 anni fa (t = 0.06) a oggi (anno 2026, t = 0).
Ogni file di questa cartella è JavaScript puro (nessun import) e aggiunge dati all'oggetto globale `SAP`:

```js
var SAP = window.SAP = window.SAP || {species: [], events: [], scenari: [], dispersal: [], hotspots: [], people: [], stats: {}};
SAP.species.push( {...}, {...} );
```

## Convenzioni (obbligatorie)

- **Tempo in Ma** (milioni di anni fa, positivi): 50 000 anni fa = `0.05`; 11 700 anni fa = `0.0117`.
  Per le date storiche: `t = (2026 - anno) / 1e6` scritto già calcolato, es. anno 1662 → `0.000364`; anno 1936 → `0.00009`; anno 2006 → `0.00002`. Oggi = `0`.
- **Coordinate attuali** in gradi decimali: `lat` (+ nord), `lon` (+ est).
- Testi in **italiano**, chiari per ragazzi di 11–14 anni, ma scientificamente precisi e aggiornati (2024–2026). Frasi brevi. 2–5 frasi per `text`.
  Quando un dato è discusso, dirlo («secondo alcuni studi», «datazione discussa»).
- Nessuna immagine: le immagini arrivano da Wikipedia tramite `wiki` (titolo della voce italiana) e `wikiEn` (titolo della voce inglese). Metti **titoli esatti** di voci esistenti.
- `name` = nome scientifico accettato (binomio o genere) scritto esattamente: serve a cercare OneZoom / Open Tree of Life / GBIF in automatico.
- Stringhe con virgolette doppie; dentro i testi usa «» o apostrofi tipografici, mai `"` non escapate.

## SAP.species — organismi (umani, estinti, viventi)

```js
{
  id: "mammut-lanoso",              // unico, minuscolo con trattini
  name: "Mammuthus primigenius",    // nome scientifico
  common: "Mammut lanoso",          // nome italiano
  group: "mammiferi",               // umani | mammiferi | uccelli | rettili | anfibi | pesci | invertebrati | piante | funghi
  from: 0.4,                        // comparsa (Ma). Per specie viventi da molto tempo basta 0.07
  to: 0.004,                        // estinzione (Ma); 0 = vive ancora
  iucn: "EX",                       // CR EN VU NT LC DD EW EX, oppure null per specie preistoriche (estinte prima del 1500)
  trend: "decreasing",              // facoltativo, solo viventi: decreasing | stable | increasing | unknown
  star: true,                       // facoltativo: specie molto rilevante, sempre visibile
  places: [[71.2, -179.5, "Isola di Wrangel"], [52, 100, "Siberia"]],  // dove vive oggi / dove visse (fossili). 1–6 punti, il primo è il più rappresentativo
  range: [[60, 90, 2500], [55, 20, 1500]],   // facoltativo: areale approssimato come cerchi [lat, lon, raggio km]
  size: "altezza 3 m, 6 t", diet: "erbivoro", habitat: "steppa fredda", // facoltativi, brevi
  pop: "circa 3 900 individui maturi (2023)",  // facoltativo, viventi minacciati
  cause: "caccia, riscaldamento, isolamento genetico", // facoltativo: minacce (viventi) o cause dell'estinzione (estinti)
  text: "…",
  wiki: "Mammuthus primigenius", wikiEn: "Woolly mammoth",
  sci: ["linneo"]                   // facoltativo: id di SAP.people collegati (chi l'ha descritta/studiata)
}
```

## SAP.dispersal — dove vive Homo sapiens (arrivi)

`[lat, lon, raggio_km, t_arrivo, "luogo", "prova (sito, datazione, fonte)"]`. Il globo disegna un'area che si allarga
dopo l'arrivo. Per `t_arrivo` maggiore di 0.06 metti 0.06 (presente all'inizio). Copri tutto il mondo abitato, isole comprese.

## SAP.events — eventi sulla linea del tempo

```js
{t: 0.0117, t2: null, title: "…", text: "…", cat: "umani", lat: 37.2, lon: 38.9, big: true, wiki: "…", wikiEn: "…", sci: ["darwin"]}
```
`cat`: umani | clima | estinzione | natura | conservazione | scienza. `big: true` solo per i 25–40 eventi più importanti dell'intero globo
(ogni file ne marca al massimo una decina).

## SAP.scenari — scenari con linea del tempo ingrandita

Stesso formato del globo principale:
```js
{id, title, sub, from: 0.06, to: 0.03, unit: "ka" | "anni", color: "#hex", intro,
 steps: [{t, title, text, view: [lon, lat, zoom]}],              // 8–16 tappe, t decrescenti; zoom 1 = globo intero, 3 = regione
 areas: [{label, color, from, to, blobs: [[lat, lon, km], …]}],   // facoltativo
 routes: [{label, color, from, to, pts: [[lat, lon], …]}],        // facoltativo: percorso disegnato tra from e to
 markers: [{lat, lon, label, kind: "fossile"|"sito"|"evento", from, to, text, wiki, wikiEn, taxon: "id-specie"}]}
```
`unit: "ka"` mostra migliaia di anni, `"anni"` mostra le date (a.C./d.C.).

## SAP.hotspots — punti caldi della biodiversità

`{name, blobs: [[lat, lon, km], …], text, wiki, wikiEn}`

## SAP.people — scienziati

```js
{id: "darwin", name: "Charles Darwin", born: 1809, died: 1882, nat: "inglese",
 t: 0.000167,                       // momento chiave (es. 1859 L'origine delle specie)
 lat: 51.33, lon: 0.05, place: "Down House, Kent",
 field: "evoluzione", idea: "selezione naturale",   // brevissimo
 text: "…",                          // 3–5 frasi: cosa ha scoperto, perché conta oggi
 work: "L'origine delle specie (1859)",
 places: [[-0.7, -90.5, "Galápagos"]], // facoltativo: altri luoghi importanti
 wiki: "Charles Darwin", wikiEn: "Charles Darwin"}
```

## SAP.stats — numeri di oggi (oggetto, con fonte e anno)
