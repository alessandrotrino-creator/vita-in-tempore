# Vita in Tempore — il globo della storia della Terra

Un globo interattivo per la scuola che ripercorre la storia della Terra, dalla sua formazione a oggi: continenti in movimento, climi e ghiacci, fossili reali, organismi con immagini e schede, eventi geologici e biologici, scenari ingranditi (dinosauri, estinzioni, Homo sapiens, Neanderthal e Denisova, megafauna…) e ambienti 3D di ogni epoca.

Il file da pubblicare è **`index.html`** (unico, autonomo: contiene librerie, dati e codice).
Serve internet solo per i caratteri, le immagini di Wikipedia e i link esterni.

**Pubblicazione su GitHub Pages:** caricare `index.html` nella radice del repository e attivare Pages
(Settings → Pages → Deploy from a branch → `main` / root). Le cartelle `data/occ` e `data/paleodem` (dati grezzi, oltre 300 MB) sono escluse da `.gitignore`.

**Fonti principali:** PaleoDEM di Scotese & Wright 2018 (PALEOMAP, CC BY 4.0) per rilievi e mari; modelli di placche PALEOMAP e Merdith et al. 2021 (GPlates Web Service, EarthByte); Paleobiology Database (CC BY 4.0) per i fossili; carta cronostratigrafica ICS; Wikipedia/Wikimedia Commons; Open Tree of Life e OneZoom.

## Come è fatto

| Cartella | Contenuto |
|---|---|
| `src/template.html` | pagina, stile (CSS) e struttura (HTML) con i segnaposto `/*@...*/` |
| `src/app.js` | motore: globo (d3), tettonica, fossili, linea del tempo, schede, scenari |
| `src/content.js` | dati scientifici: `ERAS` (scala ICS), `EVENTS`, `TAXA` (protagonisti), `GROUPS` |
| `src/scenari.js` | `SCENARI`: linee del tempo ingrandite con tappe, siti, percorsi, areali |
| `src/ambienti.js` | `window.PaleoEnv`: ambienti del passato in 3D (three.js) |
| `src/*.min.js` | librerie: d3 v7, topojson-client, three.js r128 |
| `data/coste.json` | coste attuali semplificate, con placca (plate ID) ed età di comparsa |
| `data/rot.json` | rotazioni delle placche ogni 5 Ma, 0–1000 Ma (quaternioni × 10 000) |
| `data/fossili.json` | fossili PBDB aggregati in celle di 2° per piano geologico |
| `data/shelf.json` | piattaforma continentale (Natural Earth) per le coste glaciali |
| `tools/` | script PowerShell per rigenerare dati e file finale |

## Rigenerare

```
powershell -File tools\1-coste.ps1           # coste dal GPlates Web Service (Merdith 2021)
powershell -File tools\2-fossili-scarica.ps1 # occorrenze dalla Paleobiology Database (lento)
powershell -File tools\3-fossili-aggrega.ps1 # celle × piani + plate ID
powershell -File tools\4-rotazioni.ps1       # rotazioni delle placche (incrementale)
powershell -File tools\build.ps1             # monta index.html
```

Per provarlo in locale: `powershell -File tools\serve.ps1` e aprire http://localhost:8765/
(con `?t=66` si parte da 66 milioni di anni fa).

## Convenzioni

- Tempo sempre in **Ma** (milioni di anni fa, positivi): 0,0115 = 11 500 anni fa.
- Coordinate dei siti sempre **attuali**: il globo le sposta con la placca su cui si trovano.
- Prima di 1000 Ma il modello non esiste: le terre sono mostrate in modo schematico.
