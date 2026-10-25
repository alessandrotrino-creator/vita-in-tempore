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
| `src/sapiens/viventi.js` | specie di oggi con stato IUCN, punti caldi della biodiversità, eventi di conservazione, scenari, numeri di oggi (scelte soprattutto fra le minacciate) |
| `src/sapiens/viventi-mondo.js` | 146 specie tipiche, anche comuni, delle regioni che avevano pochi simboli (Sahara e Nord Africa, Asia centrale, Russia e Siberia, Canada e Groenlandia, India e Sud-Est asiatico, Giappone, Australia, Nuova Guinea, Pacifico, Americhe, Foresta Atlantica, Africa, Artico, Antartide), con 2–3 luoghi distribuiti nell'areale. Per controllare le zone vuote si contano i luoghi per regione (vedi la sessione del 24/10/2026); stati IUCN sempre confrontati con `tools/arricchisci.html` |
| `src/sapiens/scienziati.js` | `SAP.people` (scienziati: anche nel globo principale), eventi della scienza, scenari |
| `src/cerca.js` | `window.Cerca`: ricerca (Wikidata, GBIF, PBDB, Open Tree, Wikipedia), comune ai due globi |
| `data/terra.json` | ETOPO1 (NOAA) ogni 0,25°, stesso formato compresso di `dem.json` (da `tools/7-terra.ps1`) |
| `data/bluemarble.jpg` | NASA Blue Marble Next Generation (luglio 2004, con rilievo e batimetria) 2048×1024 |
| `data/sapiens-enrich.json` | per ogni specie: OTT (OneZoom), chiave GBIF, IUCN secondo GBIF (controllo), immagini; per ogni scienziato: ritratto. Si rigenera con `tools/arricchisci.html` |

- **Texture**: l'immagine di oggi (Blue Marble) si sposta della differenza tra il clima dell'epoca e quello attuale calcolata con lo stesso modello dei biomi del globo principale; il mare si abbassa con `SEA` e scopre le piattaforme (colore del modello); `ICE_SHEETS` per le calotte; `greenSahara(t)` per il periodo umido africano. Ricalcolata solo quando cambia la chiave `texKey`.
- **Sovrapposizioni equirettangolari** campionate in `renderOrtho`: `HOV` (aree delle specie umane, solo sulle terre emerse dell'epoca) e `OV` (osservazioni GBIF della specie scelta, dalle mappe `api.gbif.org/v2/map`, EPSG:4326, zoom 0).
- **Simboli**: `collectSpecies`/`collectPeople` → `placeMarks` li dispone per importanza evitando le sovrapposizioni; bordo = colore IUCN vicino al presente, colore del gruppo nel passato. Pulizia della vista: massimo di simboli che cresce con lo zoom (60 → 320) e, in più, lo schermo diviso in riquadri (lato 4,2 × la taglia del simbolo) con 2/3/4 simboli al massimo per riquadro, così ogni zona mostra le sue specie più importanti; i nomi si scrivono dopo i simboli, dal più importante, solo dove non coprono altri nomi o simboli (`LABELS`). Da zoom 1,8 un simbolo sovrapposto si prova a spostare appena più in là (senza linee); solo le specie che cadono proprio sullo stesso punto finiscono in un gruppo (cerchietto con il numero, `drawSpMark(…, grp)`), che si apre con `showGroup`: elenco diviso per classe, ogni specie apre la sua scheda con «‹ Torna all'elenco».
- **Altre specie osservate (GBIF)** (strato `gbif`, interruttore «Altre specie osservate», acceso): nel presente e con zoom ≥ 2 la zona inquadrata si divide in 3 × 3 riquadri; per ognuno si chiedono a GBIF 60 osservazioni con foto di iNaturalist «research grade» (`datasetKey` 50c9509d-…) e si tengono le 9 specie più fotografate (al massimo circa 80). Simboli più piccoli, senza nome sul globo; le specie già schedate a mano (`BYNAME`) non si ripetono. Scheda automatica (`x._gb`): foto da Wikipedia o, se manca, quella dell'osservazione con autore e licenza; testo dal riassunto di Wikipedia italiana (o inglese); nome italiano da `species/{key}/vernacularNames` di GBIF; avviso che la scheda non è controllata a mano. Il conto alla rovescia (650 ms) riparte solo se cambia la zona: i ridisegni per le miniature non devono azzerarlo. GBIF non sempre dà la classe dei pesci: `gbGroup` mette tra i pesci i cordati non classificati.
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

### Modelli 3D veri (`modelli/`, `k.model`)
- Gli animali possono usare un modello glTF/GLB animato, messo nella cartella `modelli/` del repository (accanto a `index.html`, da caricare su GitHub insieme ai file). `k.model(url, {len, v0, clip, rot, sRef}, items, fallback)` disegna subito l'animale fatto dal codice (`fallback`, un `k.herd`) e lo sostituisce quando il file è arrivato; se il file manca o la pagina è aperta dal disco (`file://`) resta quello semplice (in console: un 404 e un avviso, non è un errore).
- `build.ps1` aggiunge a three.js `src/three.gltfloader.r128.js` e `src/three.skeletonutils.r128.js` (dagli esempi di three r128).
- Il modello si scala alla lunghezza `len` (metri), si appoggia al terreno e si gira da solo verso la direzione di marcia (se cammina all'indietro, impostare `rot`); il passo si accelera o rallenta in base alla velocità (`v0` = velocità naturale dell'animazione).
- Scegliere modelli con anatomia e colori fedeli alla specie, licenza CC0, CC BY o CC BY-NC (uso scolastico non commerciale), e citarne l'autore. Gli autori compaiono nella scheda iniziale dell'ambiente (`credit`, «Modelli 3D: …»).
- **Un ecosistema alla volta e completo** (richiesta dell'utente): niente animali vecchi mescolati ai nuovi. Se una specie non ha un modello fedele, la si sostituisce con un'altra specie tipica dello stesso ambiente e si aggiornano introduzione e cartelli.
- **Appennino completo** (tutti modelli veri, circa 7 MB in tutto): orso bruno («Realistic Animated Bear», WildMesh 3D, CC BY; il loro «BEAR DEMO» è un baribal nero americano, scartato), lupo, cinghiale e volpe («… Realistic 3D Model (DEMO FREE)», WildMesh 3D, CC BY-NC), corvo imperiale («Crow» di alexanders823, CC BY). Camoscio, cervo e aquila reale non hanno modelli gratuiti fedeli: tolti dalla scena; il cartello dell'aquila è diventato quello del corvo imperiale, quello del camoscio dice che vive più in alto. 60 fps su PC, telefono e LIM (provati nel browser del PC), tutti caricati in 1–2 s.
- **Savana completa** (circa 9,4 MB, 39 animali; 60 fps): elefante africano («African Elephant» di jimmyho905, CC BY, animazione `Loco_WalkSlow`), gnu (16, la migrazione), bufalo cafro, leonesse (due ferme con `Breathing`, una che cammina: lo stesso file con due `k.model`), iena macchiata, facocero e faraona (WildMesh 3D, CC BY-NC). Tolti: zebre (l'unico modello realistico è una zebra di Grévy, che non vive nel Serengeti), giraffe (solo giraffe reticolate; nel Serengeti vive la giraffa masai), leone maschio (solo modelli low-poly) e avvoltoi (nessun modello). I cartelli della giraffa e degli avvoltoi sono diventati «Il bufalo africano» e «La iena macchiata».
- **Oceano aperto completo** (circa 25 MB, 57 animali, 9 tipi; 60 fps, ~850 000 triangoli su PC): manta, squalo balena, squalo mako, tartaruga caretta (DigitalLife3D, CC BY-NC: modelli scientifici ricostruiti da riprese di animali veri), tonno pinna gialla (dhjwdwd), capodoglio (AneesAnimates), balenottera azzurra (dannzjs), sgombro (1shxxn), tutti CC BY. La manta ha morph target difettosi (uno attivo al 100% la trasforma in un enorme telo bianco): `noMorph: true` in `k.model` li toglie. Squalo balena (8,4 MB) e capodoglio (4,6 MB) hanno moltissimi vertici e non si possono alleggerire con PowerShell. I «diavoli di mare» dell'introduzione sono diventati «le mante e i loro parenti diavoli di mare».
- **Le Americhe dei giganti complete** (ambiente del passato in `ambienti.js`, circa 5,3 MB, 24 animali; 60 fps): modelli low-poly del Natural History Museum of Los Angeles (utente NHMLA su Sketchfab, CC BY-NC-SA 4.0; ricostruzioni dai fossili di La Brea con descrizione scientifica pubblicata, doi 10.26879/1191): mammut colombiano, mastodonte americano, bradipo di Harlan (Paramylodon), smilodonte, lupo terribile, bisonte antico, cavallo occidentale, teratorno (animazione `Teratorn_Gliding`, plana in cerchio). Tolti gliptodonte ed Eremotherium (nessun modello): i cartelli «Bradipi giganti» e «Gliptodonti» sono diventati «Bradipi di terra» e «Il mastodonte americano» (zanna macellata di Page-Ladson, fiume Aucilla, circa 14 500 anni fa). Il caricatore mostra 4 avvisi innocui («'morphTargets' parameter is undefined») con questi file.
- Steppa dei mammut e dinosauri **non** completabili: mancano rinoceronte lanoso e Megaloceros; i dinosauri animati gratuiti sono quasi tutti presi da videogiochi o film (licenza non valida), inventati o anatomicamente superati.
- **Ambienti del passato con modelli veri «dove disponibili»** (sessione del 25/10/2026, circa 36 MB in tutto; qui gli animali veri convivono con quelli fatti dal codice, perché per molte specie non esiste un modello valido):
  - Giurassico (Morrison): stegosauro (Ferocious Industries, CC BY), allosauro (Anees Animates, CC BY-NC; `rot: PI / 2`), pterosauro Rhamphorhynchus (Robear, CC BY, plana). Sauropodi fatti dal codice: il «brachiosaurus» di Made_Rex è un modello a pagamento di HATOGAME ricaricato (licenza non valida), il «Diplodocus carnegii» di gutaro non ha scheletro né forme da diplodoco, Apatosaurus/Camarasaurus di toro_ardido vengono da Jurassic World Evolution.
  - Mare giurassico (Holzmaden): pliosauro (animalanimator, CC BY; il cartello «Plesiosauri» ora cita Hauffiosaurus, pliosauro di Holzmaden), ammoniti (Emil van Dam, CC BY; `rot: PI`, nuotano con la conchiglia davanti). Il Cryptoclidus di Zelkami è stato scartato: lo scheletro lo mostra in verticale. Ittiosauri (quello di pro_alba non ha texture) e belemniti restano fatti dal codice.
  - Cretaceo (Hell Creek): tirannosauro (animalanimator, «Science-Based», CC BY), triceratopo (D.art, CC BY-NC), Quetzalcoatlus (agusardwinata, CC BY). Edmontosauri fatti dal codice.
  - Devoniano (palude di Tiktaalik): Tiktaalik (kelskora, CC BY; `rot: PI / 2`). Il Tiktaalik di nobilishornet è una copia dello stesso modello.
  - Eocene (Messel): coccodrilli Diplocynodon resi con l'alligatore di WildMesh 3D (CC BY-NC; Diplocynodon era un alligatoroide).
  - Cambriano (Burgess): Opabinia (hymenoptera0908, CC BY; `rot: 2.1`) e Hallucigenia (huykhoi2407, CC BY).
  - Nessun modello valido per Triassico (Herrerasaurus, Eoraptor, rincosauri, cinodonti: solo copie da videogiochi o scansioni statiche da milioni di facce), Permiano, Carbonifero (la Meganeura di nobilishornet deriva da Dinoraul), Ordoviciano, Ediacara, Rhynie, Laetoli (Lucy a corpo intero nuda, esclusa), steppa (planeta-elefante = videogiochi). Gli utenti kenchoo e slang107123456789 ricaricano modelli di Walking with Dinosaurs: non usarli.
  - Il verso dei modelli va controllato nel motore, non nel visore: l'ingombro calcolato con lo scheletro può far sbagliare la rotazione automatica (allosauro e Tiktaalik camminavano di lato o all'indietro). Metodo: vista dall'alto fissa sull'animale e confronto tra testa e spostamento.
  - Alcuni file danno avvisi innocui «Custom UV set … not yet supported» del caricatore r128.
  - Per scaricare: con l'accesso fatto nel browser integrato, `/i/archives/latest?archiveType=glb&model=<uid>&textureMaxResolution=1024` restituisce un indirizzo S3 firmato che si scarica con `curl` (dopo una decina di richieste Sketchfab risponde 429 per qualche minuto). Allosauro, tirannosauro e pliosauro hanno anche le texture ridotte a 512 px.
- `fmtMa` sotto 1 Ma moltiplicava per 1000 invece che per un milione («da 130 anni fa»): ora arrotonda alle centinaia di anni.
- I crediti dei modelli stanno in un `<details>` «Modelli 3D da Sketchfab: autori e licenze» nella scheda iniziale (sul telefono, aperti, coprirebbero i pulsanti).
- **Corvo** (`crowCtl` in `ecosistemi.js`, con `o.ctl` di `k.model`): ha una sola animazione, «TakeOff» (10,5 s): fino a 6,8 s becchetta, poi batte le ali. Sta sul tronco caduto (punto più alto dell'anello centrale del tronco), becchetta, decolla, fa due giri accelerando e rallentando, e si riposa con il decollo al contrario. Un secondo corvo vola sempre in alto.
- Da Sketchfab si scarica solo con un account: l'utente fa l'accesso nel browser integrato, poi dalla pagina si chiede `/i/models/<uid>/download` e `/i/archives/latest?archiveType=glb&model=<uid>&textureMaxResolution=1024` e si salva il file con un link `download` (finisce in Download come `.tmp`). Scegliere il GLB con texture a 1024 px.
- **`tools\glb-snellisci.ps1 -In … -Out modelli\x.glb -Keep '<regex animazioni>'`**: tiene solo le animazioni che servono (copia solo il pezzo di dati di ciascuna: Sketchfab mette tutte le animazioni in un unico blocco) e trasforma in JPEG le texture dei materiali non trasparenti. L'orso è passato da 13,3 a 1 MB.
- WildMesh 3D offre gratis anche leonessa, bufalo, facocero, iena, gnu, alce, muflone delle Rocciose (bighorn), fagiano, oca e coniglio; i modelli di «planeta-elefante» sono ripresi da videogiochi (Zoo Tycoon, L'era glaciale): non usarli.
- L'ingombro del modello si calcola sui vertici deformati dallo scheletro (`boneTransform`): `Box3.setFromObject` sbaglia con le mesh con scheletro esportate da Sketchfab (il lupo galleggiava di 1,3 m).

## Ricostruzioni delle altre specie umane (`src/cerca.js`, `REC`)
Le schede delle specie umane e degli ominini dei due globi mostrano il riquadro «Come poteva apparire: ricostruzioni» (`Cerca.reconHtml(nome scientifico)` + `Cerca.bindRecon(box)`, con un visore proprio). Le immagini sono file di Wikimedia Commons scelti a mano (`Special:FilePath?width=`), con didascalia, autore e licenza, e l'avviso che sono ricostruzioni credibili ma non ritratti veri.
- Specie con ricostruzioni: Neanderthal, Denisoviani (cranio di Harbin, sia `Homo longi` sia `Homo sp. (Denisova)`), H. floresiensis, H. erectus, Paranthropus, H. habilis, H. heidelbergensis, H. naledi, Lucy. Per H. luzonensis c'è solo una nota (nessun cranio noto).
- Autori preferiti: fratelli Kennis (Neanderthal Museum), John Gurche (Smithsonian), Cicero Moraes (approssimazioni facciali forensi).
- **Foto di Homo sapiens**: la voce italiana di Wikipedia ha come immagine una spiaggia nudista (Bundesarchiv, «FKK-Strände»). In `data/sapiens-enrich.json` la voce `sapiens` non ha più `img/thumb/full`, e `tools/arricchisci.html` non cerca più l'immagine di Homo sapiens; le pagine usano la coppia akha di `SAFE` in `cerca.js`.
- **Solo teste o figure vestite**: sono state escluse le ricostruzioni a corpo intero nude (Lucy intera, A. sediba, la donna di Gibilterra). Prima di aggiungere un'immagine guardarla e controllarne la licenza su Commons.

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
