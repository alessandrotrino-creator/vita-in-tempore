# Vita in Tempore — il globo della storia della Terra

Atlante didattico in italiano per la scuola: un globo interattivo che ripercorre la storia della Terra dalla formazione (4,57 miliardi di anni fa) a oggi. Mostra continenti in movimento, clima e ghiacci, fossili reali, organismi «protagonisti» con immagini, eventi, scenari ingranditi e ambienti 3D di ogni epoca. Fa coppia con «Lupus in Tempore» (atlante storico di una collega, Wolf Team · I.C. Almese).

Il progetto contiene **due globi collegati tra loro**:
- **`index.html` — «Vita in Tempore»**: la storia della Terra da 4,57 miliardi di anni fa a oggi.
- **`sapiens.html` — «Sapiens in Tempore»**: da 60 000 anni fa a oggi. Colonizzazione del mondo da parte di Homo sapiens, le altre specie umane (Neanderthal, Denisoviani, H. floresiensis, H. luzonensis), la megafauna e le estinzioni, la biodiversità di oggi con lo stato IUCN e gli scienziati che l'hanno studiata.

Entrambi hanno una **barra di ricerca** (`src/cerca.js`) per qualsiasi specie o genere: quando è comparso (PBDB), dove vive (GBIF), stato IUCN, classificazione, OneZoom.

Pubblicato su GitHub Pages: i file pubblicati sono **`index.html`** e **`sapiens.html`** nella radice del repository. Ognuno è un file unico e autonomo: librerie, dati e codice sono inclusi. Internet serve per i caratteri (Google Fonts), le immagini e i testi di Wikipedia, la ricerca, le osservazioni GBIF e i link esterni.

Il gioco deve funzionare bene su PC, smartphone (verticale e orizzontale) e LIM (lavagna interattiva, schermi da 1920×1080 in su). Ogni modifica va verificata su tutti e tre.

## Regole di lavoro

- **`index.html` non si modifica a mano**: si modificano i file in `src/` (e i dati in `data/`) e poi si rigenera con `tools/build.ps1`.
- **Correttezza scientifica prima di tutto.** Ogni dato deve essere coerente con la letteratura recente e condivisa: per la geologia la carta ICS e i modelli GPlates, per la paleontologia la Paleobiology Database e la letteratura primaria, per l'evoluzione umana gli studi dei gruppi di riferimento (Pääbo/MPI-EVA, Reich, Stringer, Hublin, Manzi, Barbujani, la scuola di Cavalli-Sforza). Se una data o un'interpretazione è dibattuta, il testo lo dice. Non inventare date, siti o coordinate.
- Interfaccia e testi in **italiano**, chiari per studenti dalle medie alle superiori; spiegare i termini tecnici. Niente «anello mancante», «discende dalla scimmia» o «razze» umane.
- **Non toccare ciò che non serve**: cambia solo ciò che la richiesta riguarda.
- Dopo ogni modifica l'utente carica su GitHub il file rigenerato (`index.html` e/o `sapiens.html`): ricordaglielo.

## Struttura

| Percorso | Contenuto |
|---|---|
| `index.html` | file finale generato (≈ 9 MB) |
| `src/template.html` | pagina: CSS (token colore su `:root`, tema chiaro/scuro automatico) e HTML, con i segnaposto `/*@D3*/`, `/*@TOPO*/`, `/*@THREE*/`, `/*@DATA*/`, `/*@CONTENT*/`, `/*@SCENARI*/`, `/*@AMBIENTI*/`, `/*@APP*/` |
| `src/app.js` | motore in un'unica IIFE (vedi sotto) |
| `src/content.js` | `ERAS` (scala ICS: eoni, ere, periodi, epoche), `EVENTS` (~150), `TAXA` (~190 protagonisti), `GROUPS` (21 gruppi) |
| `src/scenari.js` | `SCENARI` (13 linee del tempo ingrandite con tappe, siti, percorsi, areali) |
| `src/ambienti.js` | `window.PaleoEnv` = `{list, forTime, open}`: 19 ambienti 3D (three.js), con CSS proprio (classi `pe-`) |
| `src/d3.v7.min.js`, `src/topojson-client.min.js`, `src/three.r128.min.js` | librerie (three.js è caricato solo quando si apre un ambiente, da `<script type="text/plain" id="threeSrc">`) |
| `data/coste_pm.json`, `data/coste.json` | coste attuali semplificate con placca ed età di comparsa, modello PALEOMAP (0–750 Ma) e Merdith 2021 (750–1000 Ma): `{p: plate ID, b: età di comparsa in Ma, c: [lon,lat,…]}` (per PALEOMAP `b` non si usa) |
| `data/rot_pm.json`, `data/rot.json` | rotazioni delle placche ogni 5 Ma (PALEOMAP 0–750, Merdith 0–1000): quaternioni × 10 000; `0,0,0,0` = placca non esistente |
| `data/rotcache*.json`, `data/pids*.txt` | cache ed elenchi di placche per lo script delle rotazioni |
| `data/dem.json` | PaleoDEM di Scotese & Wright 2018 (1°, ogni 5 Ma, 0–540 Ma): byte con scala a radice (`q = ±round(1,6·√|quota|)`), righe a differenze, gzip, base64; si decomprime nel browser con `DecompressionStream` |
| `data/paleodem/` | CSV originali dei PaleoDEM (fonte di `dem.json`) |
| `data/fossili.json` | fossili PBDB: `stages` (piani ICS), `cells` ([lon, lat, pid Merdith, pid PALEOMAP] in celle di 2°), `names`, `groups` (per gruppo: [cella, piano, n. occorrenze, indici dei nomi più frequenti]) |
| `data/shelf.json` | piattaforma continentale (Natural Earth, TopoJSON) per le coste glaciali |
| `data/occ/` | CSV grezzi PBDB (esclusi da git) |
| `tools/` | script PowerShell (sul PC non ci sono Python né Node) |

### Convenzioni dei dati
- **Tempo sempre in Ma** (milioni di anni fa, positivi): 66 = 66 milioni di anni fa, 0.0115 = 11.500 anni fa, 0 = oggi. Le date storiche sono calcolate rispetto al 2026 (`NOW_YEAR`).
- **Coordinate sempre attuali**, `[lat, lon]` nei siti di `TAXA` e negli scenari. Il globo le sposta con la placca su cui si trovano (`pidOf` assegna la placca guardando il poligono di costa che contiene il punto).
- Campi di `TAXA`: `id, name, common, group, from, to, size, diet, habitat, sites:[[lat,lon,"luogo"]], text, wiki, wikiEn, ott, star`.
- Campi di `EVENTS`: `t, t2, title, text, cat ("geo"|"clima"|"vita"|"estinzione"|"umani"), lat, lon, wiki, wikiEn, big`.
- Scenari: `{id, title, sub, from, to, unit ("Ga"|"Ma"|"ka"|"anni"), color, intro, steps:[{t,title,text,view:[lon,lat,zoom]}], markers, routes, areas, lgm}`.
- I titoli Wikipedia (`wiki` italiano, `wikiEn` inglese) e gli OTT id (Open Tree of Life) devono essere verificati prima di inserirli.

### Sezioni di `src/app.js` (in ordine)
- **Formati**: `fmtAge`, `fmtUnit`, `fmtRange` (date in italiano).
- **Linea del tempo**: scala a tratti `MAIN_DOM`/`MAIN_RNG` (le ere recenti sono allargate); negli scenari è lineare tra `from` e `to`.
- **Tettonica**: due modelli (`MP` = PALEOMAP fino a 750 Ma, `MM` = Merdith fino a 1000 Ma, scelti da `modelAt(t)`); `quatAt(M, pid, t)` (slerp tra i passi di 5 Ma), `pidOf(M, lon, lat)`, `paleo(lon, lat, t, fallback)`, `landAt(t)`. Oltre 1000 Ma le terre con età di comparsa sufficiente sono mostrate, tratteggiate, nella posizione di 1000 Ma («schematico»).
- **Fossili**: `STG` (piani), `FIDX` (gruppo → piano → voci), `GDEF` (nomi/colori/emoji di riserva per i gruppi).
- **Clima**: `climate(t)` (palla di neve, calotte, aridità), `plantF(t)`, `SEA` (livello del mare ultimi 500 ka), `DAY`, `O2`, `ICE_SHEETS` (calotte dell'ultima glaciazione).
- **Disegno**: `draw()` su canvas con d3 (`geoOrthographic` per il globo, `geoEquirectangular` per il planisfero); `drawFossils`, `drawTaxa`, `drawEvents`, `drawLabels` (`PLABELS`: nomi dei paleocontinenti), `drawScenarioBelow/Above`.
- **Schede**: `showTaxon`, `showFossil`, `showEvent`, `showScMarker`; immagini da Wikipedia (`wikiSum`: API REST, miniature a 500 px con ripiego sulla miniatura originale); link a Wikipedia, OneZoom, Open Tree of Life, PBDB.
- **Pannello**: `updatePanel` (Quando, eventi vicini, protagonisti, gruppi di fossili).
- **Scenari**: `enterScenario`, `exitScenario`, `goStep`.
- **Ambienti 3D**: `loadThree`, `openEnvChooser`, `openEnv`.
- **Avvio**: `start()`; il parametro `?t=<Ma>` sceglie l'epoca iniziale (predefinita 67 Ma).

## Il globo «Sapiens in Tempore» (`sapiens.html`)

| Percorso | Contenuto |
|---|---|
| `src/sapiens/template.html` | pagina; `/*@BASECSS*/` riceve lo stile di `src/template.html` (stesso aspetto dei due globi) |
| `src/sapiens/app.js` | motore (IUCN, specie con foto, areali umani, GBIF, scienziati, Lista Rossa) |
| `src/sapiens/SCHEMA.md` | **formato dei contenuti**: leggerlo prima di modificarli |
| `src/sapiens/umani.js` | specie umane, domestiche, `SAP.dispersal` (arrivi di Homo sapiens), eventi, 4 scenari, popolazione mondiale |
| `src/sapiens/estinte.js` | megafauna ed estinzioni dal 1500, eventi, scenari «La fine dei giganti» e «La sesta estinzione» |
| `src/sapiens/viventi.js` | specie di oggi con stato IUCN, punti caldi della biodiversità, eventi di conservazione, scenari, numeri di oggi |
| `src/sapiens/scienziati.js` | `SAP.people` (scienziati: anche nel globo principale), eventi della scienza, scenari |
| `src/cerca.js` | `window.Cerca`: ricerca (Wikidata, GBIF, PBDB, Open Tree, Wikipedia), comune ai due globi |
| `data/terra.json` | ETOPO1 (NOAA) ogni 0,25°, stesso formato compresso di `dem.json` (da `tools/7-terra.ps1`) |
| `data/bluemarble.jpg` | NASA Blue Marble Next Generation (luglio 2004, con rilievo e batimetria) 2048×1024 |
| `data/sapiens-enrich.json` | per ogni specie: OTT (OneZoom), chiave GBIF, IUCN secondo GBIF (controllo), immagini; per ogni scienziato: ritratto. Si rigenera con `tools/arricchisci.html` |

- **Texture**: l'immagine di oggi (Blue Marble) si sposta della differenza tra il clima dell'epoca e quello attuale calcolata con lo stesso modello dei biomi del globo principale; il mare si abbassa con `SEA` e scopre le piattaforme (colore del modello); `ICE_SHEETS` per le calotte; `greenSahara(t)` per il periodo umido africano. Ricalcolata solo quando cambia la chiave `texKey`.
- **Sovrapposizioni equirettangolari** campionate in `renderOrtho`: `HOV` (aree delle specie umane, solo sulle terre emerse dell'epoca) e `OV` (osservazioni GBIF della specie scelta, dalle mappe `api.gbif.org/v2/map`, EPSG:4326, zoom 0).
- **Simboli**: `collectSpecies`/`collectPeople` → `placeMarks` li dispone per importanza evitando le sovrapposizioni; bordo = colore IUCN vicino al presente, colore del gruppo nel passato.
- **Parametri**: `?t=<Ma>`, `?cerca=<nome scientifico>`, `?persona=<id>` (anche `index.html?cerca=`).
- **Arricchimento**: con `tools/serve.ps1` attivo aprire `http://localhost:8766/tools/arricchisci.html` (`?tutto=1` rifà tutto). Il server accetta `POST /salva/<nome>.json` solo per scrivere in `data/`. Al termine la pagina elenca specie senza immagine/OTT e le differenze tra lo stato IUCN nei file e quello riportato da GBIF: controllarle.

## Ecosistemi di oggi in 3D (`src/ecosistemi.js`)
Si aggancia a `src/ambienti.js` tramite `window.PaleoEcosistemi`, che riceve gli attrezzi del motore. Gli ambienti hanno `now: true`. Il terzo elemento di un cartello è l'id della specie: apre la scheda nel globo Sapiens (`sapiens.html?specie=` e `?ambiente=`).
Fatti: savana, Amazzonia, barriera corallina, Artico, Appennino, Sahara, taiga dell'Ussuri (Sikhote-Alin), mangrovie delle Sundarbans, Mediterraneo (Egadi, sott'acqua), Antartide (Cape Washington, Mare di Ross), prateria (Tallgrass Prairie Preserve, Oklahoma), oceano aperto (Banco Princesa Alice, Azzorre, sott'acqua). Gli animali vanno messi nel campo visivo iniziale, cioè davanti ai cartelli guardando verso −z, e alberi e rilievi non devono coprirli (lasciare una radura o una fascia libera, come `clear` nella taiga e `view` nelle mangrovie). I colori fatti per vertice non si vedono su modelli con pochi vertici: per le strisce della tigre (`AN.felid({stripes})`) si usano anelli di geometria.

### Qualità grafica degli ambienti 3D (`src/ambienti.js`)
- `G.organic` salda i vertici (`G.weld`) prima di deformarli: le normali si mediano e chiome, rocce e cespugli hanno luce morbida, non a faccette. Non tornare a `toNonIndexed` prima di `computeVertexNormals`.
- `foliage(col)` colora il fogliame più scuro sotto e a chiazze (usato da `conifer`, `broadleaf`, `acacia`, `shrub`); i coni delle conifere hanno 16 lati, le chiome `ico(…, 2)`.
- Il terreno ha `map: k.groundTex` (chiazze chiare/scure in scala lineare, ripetute 40 volte) oltre al `bumpMap`.
- `k.flush`: erba e piantine basse (`shadow: false` e senza `rad`) arrivano fino a 0,35 × il raggio libero attorno a partenza e cartelli.
- Risoluzione: `setPixelRatio(min(2, dpr))` anche sui telefoni. Se il computer fatica si scende a 1,25 e poi si tolgono le ombre, ma **mai sotto 1**: sotto 1 l'immagine diventa sgranata (probabile causa dell'effetto «pixellato» sui computer lenti e sulle LIM).

## Rigenerare

```
powershell -ExecutionPolicy Bypass -File tools\1-coste.ps1           # coste dal GPlates Web Service (Merdith et al. 2021)
powershell -ExecutionPolicy Bypass -File tools\2-fossili-scarica.ps1 # occorrenze PBDB a pagine (lento; -Only "gruppo1,gruppo2")
powershell -ExecutionPolicy Bypass -File tools\3-fossili-aggrega.ps1 # celle di 2° × piani + plate ID
powershell -ExecutionPolicy Bypass -File tools\4-rotazioni.ps1       # rotazioni Merdith (incrementale)
powershell -ExecutionPolicy Bypass -File tools\7-terra.ps1           # rilievo ETOPO e Blue Marble per sapiens.html
powershell -ExecutionPolicy Bypass -File tools\build.ps1             # monta index.html e sapiens.html
```

## Insidie note

- In PowerShell `R` è un alias di `Invoke-History`: non usarlo come nome di funzione.
- I CSV della PBDB possono iniziare con righe di avviso prima dell'intestazione (l'aggregatore le salta).
- Wikimedia accetta solo alcune larghezze di miniatura: 640 px dà errore, 500 px funziona.
- L'API di Wikipedia blocca le richieste troppo fitte (errore 429): `tools/arricchisci.html` fa 2 richieste alla volta, con pause e nuovi tentativi. Per questo le immagini delle specie del globo Sapiens sono precalcolate in `data/sapiens-enrich.json` e non chieste al caricamento.
- iucnredlist.org risponde 403 agli strumenti automatici: per controllare gli stati IUCN usare la checklist IUCN su GBIF (`api.gbif.org/v1/species/{chiave}/iucnRedListCategory`) e i comunicati IUCN.
- `[hidden]{display:none!important}` è nello stile: nascondere gli elementi con `el.hidden`.
- Un `</script` dentro i dati chiuderebbe il tag: `build.ps1` lo trasforma in `<\/script`.
- **Test nel browser integrato**: non apre `file://`. Usare `tools/serve.ps1` (server PowerShell, http://localhost:8765/; con `-Port 8766` come in `.claude/launch.json`). Se la finestra di anteprima è nascosta, `requestAnimationFrame` si ferma e gli screenshot possono scadere: riprovare o usare `read_page`/JavaScript.
- **Test su telefono**: provare sempre con il meta viewport (è già nel template), altrimenti il browser simula una pagina da PC.

## Layout responsive
- **Telefono verticale** (`max-width:860px`): globo sopra, linea del tempo fissa in basso, pannello sotto; la barra dello scenario è nascosta (si esce dal pannello).
- **Telefono orizzontale** (`orientation:landscape` e `max-height:520px`): globo e pannello affiancati, linea del tempo compatta.
- **LIM** (`min-width:1600px` e `min-height:900px`): testi, pulsanti e pannello più grandi.

## Verifica dopo le modifiche
1. Nessun errore in console.
2. Globo, linea del tempo, schede, scenari e ambienti 3D su: PC, telefono verticale (375×812), telefono orizzontale (812×375), LIM (1920×1080).
3. Se si toccano contenuti: date, luoghi e coordinate controllati su fonti autorevoli; titoli Wikipedia esistenti; il file JS resta valido.

## Fonti principali
Scotese & Wright 2018 (PaleoDEM, PALEOMAP); Merdith et al. 2021 (Earth-Science Reviews) e GPlates Web Service (EarthByte); Paleobiology Database (CC BY 4.0); International Chronostratigraphic Chart (ICS); Natural Earth; Wikipedia/Wikimedia Commons; Open Tree of Life; OneZoom.
