// futuro.js — i futuri possibili: dal 2026 a circa un milione di anni da oggi.
// Tre scenari (ottimistico, probabile, pessimistico) basati sulle conoscenze di oggi (IPCC AR6, UNEP, IPBES, IUCN, WWF, ONU…).
// CONVENZIONE DEL TEMPO: in Ma, il FUTURO è NEGATIVO. Anno Y → t = -(Y - 2026) / 1e6, già calcolato.
//   2030 → -0.000004; 2050 → -0.000024; 2100 → -0.000074; 2300 → -0.000274; 3026 → -0.001; 12026 → -0.01; un milione di anni → -1.
// Nessuno può prevedere il futuro: gli scenari sono «se… allora…», non profezie. Aggiornato a fine ottobre 2026.
var SAP = window.SAP = window.SAP || {species: [], events: [], scenari: [], dispersal: [], hotspots: [], people: [], stats: {}};

SAP.futuro = {

// =====================================================================
// SCENARI — serie: [t, dT, mare, co2, pop, ghiaccio, coralli, bio]
//   dT = riscaldamento rispetto al 1850–1900 (°C; oggi circa 1,4 come media degli ultimi anni, 1,37 di origine umana nel 2025)
//   mare = livello del mare rispetto a oggi (m)          co2 = anidride carbonica nell'aria (ppm)
//   pop = popolazione mondiale (miliardi; null = impossibile da stimare)
//   ghiaccio = indice del ghiaccio (1 = oggi): nei primi secoli conta soprattutto il ghiaccio marino artico d'estate,
//              nei millenni le calotte di Groenlandia e Antartide; nelle glaciazioni torna a 1 (in realtà sarebbe molto di più)
//   coralli = copertura delle barriere coralline tropicali (1 = oggi)   bio = indice della biodiversità (1 = oggi, tipo Living Planet Index)
// Oltre i 100 000 anni i valori sono SCHEMATICI: mostrano l'alternanza di glaciazioni e interglaciali prevista dai modelli,
// non date precise.
// =====================================================================
scen: {
 ott: {name: "Ottimistico", ssp: "SSP1-1.9 / SSP1-2.6", color: "#2a9d8f",
  intro: "Il mondo riduce in fretta le emissioni: zero emissioni nette di CO₂ verso il 2050–2070 e poi un po' di CO₂ tolta dall'aria. Il riscaldamento supera di poco 1,5 °C, arriva a circa 1,6 °C verso il 2040–2050 e poi scende lentamente: nel 2100 è tra 1,0 e 1,8 °C (IPCC AR6, SSP1-1.9: 1,4 °C; SSP1-2.6: 1,8 °C). Il mare sale comunque: 28–62 cm entro il 2100 (rispetto al 1995–2014) e 6–7 m in 10 000 anni, perché le calotte reagiscono lentamente. Le barriere coralline perdono il 70–90% ma restano rifugi da cui ripartire. Gli obiettivi di Kunming-Montréal (30% di terre e mari protetti entro il 2030) vengono raggiunti e la curva della biodiversità si «piega» verso il 2050 (Leclère et al. 2020). La popolazione arriva a circa 9 miliardi e poi cala (circa 7 nel 2100). La prossima glaciazione arriva dopo circa 100 000 anni, invece dei 50 000 che avremmo avuto senza le emissioni umane (Ganopolski et al. 2016).",
  series: [
   [0, 1.4, 0, 427, 8.3, 1, 1, 1],
   [-0.000004, 1.5, 0.04, 435, 8.5, 0.95, 0.6, 0.98],
   [-0.000014, 1.6, 0.1, 438, 8.8, 0.85, 0.4, 0.98],
   [-0.000024, 1.6, 0.15, 430, 8.9, 0.85, 0.3, 1.0],
   [-0.000044, 1.5, 0.22, 418, 8.8, 0.9, 0.3, 1.02],
   [-0.000074, 1.4, 0.32, 400, 7.0, 0.95, 0.35, 1.05],
   [-0.000124, 1.3, 0.55, 380, null, 1, 0.45, 1.06],
   [-0.000274, 1.2, 0.9, 360, null, 1, 0.55, 1.08],
   [-0.001, 1.1, 1.8, 340, null, 0.95, 0.7, 1.1],
   [-0.002, 1.0, 2.5, 330, null, 0.95, 0.75, 1.1],
   [-0.005, 0.9, 4.5, 320, null, 0.9, 0.8, 1.1],
   [-0.01, 0.8, 6.5, 315, null, 0.85, 0.85, 1.1],
   [-0.02, 0.6, 7.5, 305, null, 0.85, 0.9, 1.1],
   [-0.05, 0.3, 8, 290, null, 0.85, 0.9, 1.1],
   [-0.1, -0.5, 0, 260, null, 1, 0.9, 1.05],
   [-0.13, -2.5, -40, 230, null, 1, 0.7, 1.0],
   [-0.17, -4.5, -90, 200, null, 1, 0.5, 0.95],
   [-0.2, 0.0, 0, 275, null, 1, 0.8, 1.0],
   [-0.3, -5, -110, 190, null, 1, 0.5, 0.95],
   [-0.32, 0.0, 0, 275, null, 1, 0.8, 1.0],
   [-0.42, -4.5, -100, 195, null, 1, 0.5, 0.95],
   [-0.44, 0.0, 0, 275, null, 1, 0.8, 1.0],
   [-0.53, -5, -110, 190, null, 1, 0.5, 0.95],
   [-0.55, 0.0, 0, 275, null, 1, 0.8, 1.0],
   [-0.65, -5, -110, 190, null, 1, 0.5, 0.95],
   [-0.67, 0.0, 0, 275, null, 1, 0.8, 1.0],
   [-0.77, -5, -110, 190, null, 1, 0.5, 0.95],
   [-0.79, 0.0, 0, 275, null, 1, 0.8, 1.0],
   [-0.88, -4.5, -100, 195, null, 1, 0.5, 0.95],
   [-0.9, 0.0, 0, 275, null, 1, 0.8, 1.0],
   [-1, -3, -60, 220, null, 1, 0.6, 1.0]
  ]},

 prob: {name: "Probabile", ssp: "SSP2-4.5 (politiche attuali, circa 2,6–2,8 °C)", color: "#e9c46a",
  intro: "Il mondo continua più o meno con le politiche di oggi. Secondo l'Emissions Gap Report 2025 dell'UNEP le politiche in vigore portano a circa 2,8 °C nel 2100 e le promesse (NDC) a 2,3–2,5 °C; il Climate Action Tracker stima circa 2,6 °C. È vicino allo scenario IPCC SSP2-4.5 (2,7 °C, intervallo 2,1–3,5 °C). La soglia di 1,5 °C viene superata stabilmente verso il 2030. Il mare sale di circa 44–76 cm entro il 2100 (rispetto al 1995–2014), di 2–6 m o più in 2 000 anni e di oltre 10 m nei millenni, con la Groenlandia che fonde lentamente. Il ghiaccio marino artico sparisce in molte estati dal 2040–2050. Le barriere coralline come le conosciamo scompaiono quasi del tutto. La popolazione arriva a circa 10,3 miliardi verso il 2084 e poi cala (ONU, World Population Prospects 2024). Molte specie si spostano verso i poli e in quota; quelle che non possono spostarsi rischiano l'estinzione. La prossima glaciazione è rinviata probabilmente di qualche centinaio di migliaia di anni (stima molto incerta: 100 000–500 000 anni).",
  series: [
   [0, 1.4, 0, 427, 8.3, 1, 1, 1],
   [-0.000004, 1.55, 0.04, 440, 8.5, 0.85, 0.5, 0.97],
   [-0.000014, 1.8, 0.1, 470, 9.2, 0.6, 0.15, 0.92],
   [-0.000024, 2.0, 0.18, 500, 9.7, 0.45, 0.08, 0.88],
   [-0.000044, 2.3, 0.28, 545, 10.2, 0.35, 0.05, 0.82],
   [-0.000058, 2.45, 0.36, 575, 10.3, 0.3, 0.04, 0.79],
   [-0.000074, 2.7, 0.48, 600, 10.2, 0.25, 0.03, 0.75],
   [-0.000124, 3.0, 0.85, 610, null, 0.2, 0.03, 0.7],
   [-0.000274, 3.3, 1.8, 560, null, 0.15, 0.04, 0.65],
   [-0.001, 3.0, 5, 470, null, 0.55, 0.1, 0.65],
   [-0.002, 2.8, 7, 440, null, 0.5, 0.15, 0.65],
   [-0.005, 2.5, 11, 410, null, 0.45, 0.2, 0.68],
   [-0.01, 2.2, 15, 395, null, 0.45, 0.25, 0.7],
   [-0.02, 1.8, 17, 370, null, 0.45, 0.35, 0.72],
   [-0.05, 1.2, 18, 330, null, 0.5, 0.6, 0.75],
   [-0.1, 0.6, 16, 300, null, 0.6, 0.75, 0.8],
   [-0.2, 0.3, 12, 285, null, 0.7, 0.8, 0.82],
   [-0.3, -0.5, 0, 260, null, 1, 0.8, 0.85],
   [-0.35, -3, -50, 220, null, 1, 0.6, 0.85],
   [-0.4, -5, -100, 195, null, 1, 0.5, 0.85],
   [-0.43, 0.0, 0, 275, null, 1, 0.8, 0.88],
   [-0.53, -5, -110, 190, null, 1, 0.5, 0.88],
   [-0.55, 0.0, 0, 275, null, 1, 0.8, 0.9],
   [-0.65, -5, -110, 190, null, 1, 0.5, 0.9],
   [-0.67, 0.0, 0, 275, null, 1, 0.8, 0.9],
   [-0.77, -5, -110, 190, null, 1, 0.5, 0.9],
   [-0.79, 0.0, 0, 275, null, 1, 0.8, 0.92],
   [-0.88, -4.5, -100, 195, null, 1, 0.5, 0.92],
   [-0.9, 0.0, 0, 275, null, 1, 0.8, 0.92],
   [-1, -3, -60, 220, null, 1, 0.6, 0.92]
  ]},

 pess: {name: "Pessimistico", ssp: "SSP5-8.5 (+ punti di non ritorno)", color: "#e63946",
  intro: "Le emissioni continuano a crescere per gran parte del secolo (scenario IPCC SSP5-8.5, oggi considerato poco probabile ma utile come «caso peggiore»). Nel 2100 il riscaldamento è di circa 4,4 °C (3,3–5,7 °C) e nel 2300 potrebbe arrivare a 7–14 °C. Il mare sale di 63 cm–1 m entro il 2100 e, se le calotte antartiche cedono più in fretta (evento poco probabile ma possibile), fino a 2 m nel 2100 e 15 m nel 2300 (IPCC AR6). Si superano diversi punti di non ritorno (Armstrong McKay et al. 2022): perdita delle barriere coralline, fusione del permafrost, forse deperimento di parte dell'Amazzonia e forte indebolimento o collasso della corrente atlantica (AMOC) dopo il 2100. In 10 000 anni il mare può salire di decine di metri. La biodiversità crolla: se si perdessero tutte le specie oggi minacciate, l'estinzione di massa potrebbe completarsi in pochi secoli (Barnosky et al. 2011). Popolazione molto incerta (7–12 miliardi nel 2100 a seconda dei modelli). Le glaciazioni sono rinviate di oltre mezzo milione di anni (Talento e Ganopolski 2021). La natura si riprenderà, ma in milioni di anni.",
  series: [
   [0, 1.4, 0, 427, 8.3, 1, 1, 1],
   [-0.000004, 1.6, 0.05, 445, 8.5, 0.8, 0.4, 0.95],
   [-0.000014, 2.0, 0.12, 500, 9.1, 0.5, 0.08, 0.88],
   [-0.000024, 2.4, 0.2, 565, 9.5, 0.3, 0.03, 0.8],
   [-0.000044, 3.2, 0.35, 700, 9.7, 0.15, 0.02, 0.68],
   [-0.000074, 4.4, 0.7, 1135, 9.5, 0.08, 0.01, 0.5],
   [-0.000124, 6.0, 1.25, 1800, null, 0.05, 0.01, 0.4],
   [-0.000274, 9.0, 4, 2000, null, 0.03, 0.01, 0.33],
   [-0.001, 8.5, 10, 1700, null, 0.4, 0.02, 0.33],
   [-0.002, 8, 20, 1500, null, 0.35, 0.03, 0.33],
   [-0.005, 7, 30, 1200, null, 0.3, 0.04, 0.34],
   [-0.01, 6, 40, 1000, null, 0.3, 0.05, 0.35],
   [-0.02, 5, 45, 850, null, 0.3, 0.1, 0.36],
   [-0.05, 4, 50, 650, null, 0.3, 0.2, 0.38],
   [-0.1, 3, 52, 500, null, 0.3, 0.3, 0.4],
   [-0.2, 2, 45, 400, null, 0.35, 0.4, 0.45],
   [-0.4, 1, 30, 330, null, 0.4, 0.5, 0.48],
   [-0.6, 0, 10, 280, null, 0.5, 0.6, 0.5],
   [-0.7, -3, -50, 220, null, 1, 0.5, 0.52],
   [-0.8, -5, -100, 195, null, 1, 0.45, 0.55],
   [-0.85, 0.0, 0, 275, null, 1, 0.6, 0.57],
   [-0.95, -4, -80, 200, null, 1, 0.5, 0.58],
   [-1, -1, -30, 240, null, 1, 0.6, 0.6]
  ]}
},

// =====================================================================
// EVENTI DEL FUTURO
// =====================================================================
events: [
{t: 0, scen: "tutti", title: "Il punto di partenza: 2026", text: "Il 2024 è stato il primo anno solare oltre 1,5 °C sopra il periodo 1850–1900 (1,55 °C, WMO); il 2025 è stato il secondo o terzo più caldo (circa 1,43 °C). Il riscaldamento causato dall'uomo vale circa 1,37 °C e cresce di 0,27 °C ogni dieci anni. L'anidride carbonica supera i 425 ppm: secondo l'IPCC non era così alta da almeno 2 milioni di anni; valori simili si trovano nel Pliocene, circa 3 milioni di anni fa, quando il mare era più alto di vari metri.", cat: "clima", lat: 19.54, lon: -155.58, big: true, certezza: "alta",
 oggi: "WMO, State of the Global Climate 2025; Indicators of Global Climate Change (Forster et al., 2025–2026): al ritmo attuale il «bilancio di carbonio» per 1,5 °C (circa 130 miliardi di tonnellate di CO₂) si esaurisce in circa tre anni.",
 curiosita: "Le misure di CO₂ più lunghe del mondo si fanno dal 1958 sul vulcano Mauna Loa, alle Hawaii: la loro curva a dente di sega si chiama «curva di Keeling», dal nome del chimico Charles David Keeling.",
 fonti: ["WMO 2026", "Forster et al. 2025, ESSD", "NOAA GML"], wiki: "Curva di Keeling", wikiEn: "Keeling Curve"},

{t: 0, scen: "tutti", title: "Living Planet Report 2026: −73%", text: "L'8 ottobre 2026 WWF e Società zoologica di Londra pubblicano il nuovo Indice del pianeta vivente: le popolazioni di vertebrati seguite dagli scienziati sono diminuite in media del 73% tra il 1970 e il 2022. Il calo più forte riguarda l'acqua dolce (−85%) e l'America latina (−95%). È una media delle variazioni, non vuol dire che il 73% degli animali sia morto: circa metà delle popolazioni è stabile o in crescita.", cat: "natura", lat: 51.535, lon: -0.153, big: true, certezza: "alta",
 oggi: "WWF/ZSL, Living Planet Report 2026 («The Science of Hope»); IPBES 2019: circa un milione di specie minacciate di estinzione.",
 curiosita: "Lo stesso rapporto segnala che le tigri selvatiche sono aumentate di oltre il 70% in 15 anni: la conservazione funziona quando è fatta bene.",
 fonti: ["WWF Living Planet Report 2026", "IPBES 2019"], wiki: null, wikiEn: "Living Planet Index"},

{t: 0, scen: "tutti", title: "COP17 di Erevan: a metà strada verso il 2030", text: "Dal 19 al 30 ottobre 2026 i paesi della Convenzione sulla diversità biologica si riuniscono a Erevan, in Armenia, per controllare a che punto sono i 23 obiettivi di Kunming-Montréal. Un rapporto ONU preparatorio dice che meno della metà degli obiettivi esaminati è sulla buona strada.", cat: "conservazione", lat: 40.18, lon: 44.51, certezza: "alta",
 oggi: "Quadro globale per la biodiversità di Kunming-Montréal (2022): 30% di terre e mari protetti e 30% degli ecosistemi degradati in ripristino entro il 2030.",
 curiosita: "Molti paesi non avevano ancora consegnato le loro strategie nazionali per la biodiversità (NBSAP), che dovevano essere pronte per il 2024.",
 fonti: ["CBD COP17", "Down To Earth, ottobre 2026"], wiki: "Convenzione sulla diversità biologica", wikiEn: "Kunming-Montreal Global Biodiversity Framework"},

{t: 0, scen: "tutti", title: "Onkalo: il primo deposito definitivo di scorie nucleari", text: "Il 22 ottobre 2026 la Finlandia concede la licenza di esercizio a Onkalo, il primo deposito geologico al mondo per il combustibile nucleare esaurito, a circa 430 m di profondità nella roccia dell'isola di Olkiluoto. Le scorie, chiuse in contenitori di rame e argilla, dovranno restare isolate per circa 100 000 anni: più a lungo di tutta la storia di Homo sapiens fuori dall'Africa.", cat: "tecnologia", lat: 61.24, lon: 21.44, certezza: "alta",
 oggi: "Licenza del governo finlandese del 22/10/2026 dopo la valutazione di sicurezza positiva dell'autorità STUK (agosto 2026); lo smaltimento inizierà dopo gli ultimi collaudi.",
 curiosita: "Come avvisare gli umani tra 100 000 anni, che forse non capiranno nessuna delle nostre lingue? Negli anni Ottanta due studiosi proposero perfino di creare «gatti-raggio» che cambiano colore vicino alle radiazioni, e di tramandarne il significato con canzoni e leggende.",
 fonti: ["Posiva/STUK 2026", "Governo finlandese, 22/10/2026"], wiki: null, wikiEn: "Onkalo spent nuclear fuel repository"},

{t: -0.000004, scen: "tutti", title: "Si supera 1,5 °C come media di lungo periodo", text: "L'Accordo di Parigi parla di medie su vent'anni, non di un singolo anno caldo. Con le emissioni attuali la media di lungo periodo supera 1,5 °C intorno al 2030 in tutti gli scenari. Nello scenario ottimistico si tratta di un «sorpasso» temporaneo: la temperatura arriva a circa 1,6 °C e poi scende, se si tolgono grandi quantità di CO₂ dall'aria.", cat: "clima", lat: null, lon: null, big: true, certezza: "alta",
 oggi: "Accordo di Parigi (2015): restare «ben sotto» 2 °C e fare sforzi per 1,5 °C. Parere della Corte internazionale di giustizia (23 luglio 2025): 1,5 °C è l'obiettivo principale e gli stati hanno obblighi giuridici di agire.",
 curiosita: "Ogni decimo di grado conta: tra 1,5 e 2 °C, secondo l'IPCC, la quota di specie di insetti che perdono metà del loro areale triplica, dal 6 al 18%.",
 fonti: ["IPCC AR6 WGI SPM", "Forster et al. 2025", "ICJ 2025"], wiki: "Accordo di Parigi (2015)", wikiEn: "Paris Agreement"},

{t: -0.000004, scen: "tutti", title: "Scadenza dell'Agenda 2030 e del «30×30»", text: "Nel 2030 scadono i 17 Obiettivi di sviluppo sostenibile dell'ONU, tra cui il 13 (clima), il 14 (vita sott'acqua) e il 15 (vita sulla terra), e l'obiettivo di proteggere il 30% di terre e mari. Nel 2024 erano protetti circa il 17,6% delle terre e l'8,4% degli oceani. Nello scenario ottimistico l'obiettivo è raggiunto; in quello probabile solo in parte.", cat: "conservazione", lat: 40.75, lon: -73.97, big: true, certezza: "alta",
 oggi: "Agenda 2030 (ONU, 2015); Quadro di Kunming-Montréal (2022), obiettivo 3; Protected Planet Report 2024 (UNEP-WCMC e IUCN). Il Rapporto ONU sugli SDG 2025 indica che solo circa un terzo dei traguardi è in linea o in moderato progresso.",
 curiosita: "L'idea del 30×30 nasce dagli studi su quanto spazio serve alla natura: alcuni biologi, come E. O. Wilson con il progetto «Half-Earth», proponevano addirittura di proteggere metà del pianeta.",
 fonti: ["ONU, SDG Report 2025", "Protected Planet Report 2024"], wiki: "Obiettivi di sviluppo sostenibile", wikiEn: "Sustainable Development Goals"},

{t: -0.000004, scen: ["ott", "prob"], title: "Triplicare le rinnovabili", text: "Alla COP28 di Dubai (2023) i paesi si sono impegnati a triplicare la capacità di energia rinnovabile entro il 2030 e ad «allontanarsi dai combustibili fossili». Solare ed eolico crescono più in fretta del previsto e nella prima metà del 2025 le rinnovabili hanno prodotto più elettricità del carbone (Ember). Nello scenario ottimistico l'obiettivo è raggiunto; in quello probabile la crescita è forte ma non basta.", cat: "tecnologia", lat: 25.2, lon: 55.27, certezza: "media",
 oggi: "Consenso degli Emirati (COP28, 2023); alla COP30 di Belém (2025) non c'è stato accordo su una «tabella di marcia» per uscire dai fossili: il Brasile la porta avanti fuori dai negoziati ONU.",
 curiosita: "Dal 2010 il prezzo dell'elettricità solare è sceso di circa il 90%: è uno dei «punti di non ritorno positivi» descritti dal Global Tipping Points Report.",
 fonti: ["Decisione COP28 1/CMA.5", "Global Tipping Points Report 2025", "Ember 2025"], wiki: "Fonti di energia rinnovabili", wikiEn: "Renewable energy"},

{t: -0.000004, scen: "tutti", title: "Le macchine che pensano: IA nella scienza", text: "L'intelligenza artificiale aiuta già la scienza: AlphaFold prevede la forma delle proteine (premio Nobel per la chimica 2024) e alcuni modelli fanno previsioni del tempo rapide quanto quelle tradizionali. In tutti gli scenari l'IA diventa uno strumento normale per studiare clima, malattie e specie. Ma consuma molta energia: i centri dati usavano circa l'1,5% dell'elettricità mondiale nel 2024 e potrebbero più che raddoppiare entro il 2030 (IEA).", cat: "tecnologia", lat: 51.53, lon: -0.13, certezza: "alta",
 oggi: "Regolamento europeo sull'IA (AI Act, 2024): divieti dal 2025, regole per i grandi modelli dall'agosto 2025, obblighi per i sistemi «ad alto rischio» rinviati al 2027–2028 dall'accordo «omnibus» del maggio 2026. In Italia la legge 132/2025 sull'IA è in vigore dal 10 ottobre 2025.",
 curiosita: "Il primo premio Nobel legato all'IA è stato doppio: nel 2024 Hinton e Hopfield hanno vinto quello per la fisica, Hassabis, Jumper e Baker quello per la chimica.",
 fonti: ["IEA, Energy and AI 2025", "Regolamento (UE) 2024/1689", "Legge 132/2025"], wiki: "AlphaFold", wikiEn: "AlphaFold"},

{t: -0.000004, scen: ["ott", "prob"], title: "Gene drive: le prime zanzare in natura?", text: "Un «gene drive» è un pezzo di DNA, costruito con CRISPR, che si trasmette a quasi tutta la prole invece che alla metà: in poche generazioni può rendere sterili le femmine di zanzara Anopheles che portano la malaria. Nessun gene drive è stato ancora liberato in natura. Nel 2025 il Burkina Faso ha fermato il progetto Target Malaria (che lì sperimentava zanzare modificate senza gene drive); le ricerche continuano in Uganda e in laboratorio, anche in Italia (Polo GGB di Terni).", cat: "tecnologia", lat: 11.18, lon: -4.3, certezza: "media",
 oggi: "Protocollo di Cartagena sulla biosicurezza (2000) e decisioni della CBD sulla biologia sintetica; linee guida OMS sui vettori geneticamente modificati (2021). Nel 2024 la malaria ha ucciso circa 600 000 persone, soprattutto bambini africani (OMS).",
 curiosita: "Le prove in gabbie grandi come serre, a Terni, hanno mostrato che un gene drive può far scomparire una popolazione di zanzare in circa un anno (Hammond et al. 2021).",
 fonti: ["Hammond et al. 2021, Nature Communications", "Science, settembre 2025"], wiki: null, wikiEn: "Gene drive"},

{t: -0.000004, scen: ["ott", "prob"], title: "Rinoceronti bianchi del nord in provetta", text: "Restano solo due femmine di rinoceronte bianco settentrionale, Najin e Fatu, in Kenya. Il consorzio BioRescue usa ovuli prelevati a loro e sperma congelato per creare embrioni, da impiantare in femmine di rinoceronte bianco meridionale. Nel 2024 è stata annunciata la prima gravidanza di rinoceronte ottenuta in provetta (con embrioni meridionali).", cat: "conservazione", lat: 0.05, lon: 36.9, certezza: "media", taxon: "rinoceronte-bianco",
 oggi: "Convenzione CITES (1973) e Lista Rossa IUCN; il rinoceronte bianco settentrionale è considerato funzionalmente estinto.",
 curiosita: "L'ultimo maschio, Sudan, è morto nel 2018 a Ol Pejeta: il suo sperma congelato è una delle ultime speranze della sottospecie.",
 fonti: ["BioRescue, comunicato gennaio 2024"], wiki: "Ceratotherium simum cottoni", wikiEn: "Northern white rhinoceros"},

{t: -0.000006, scen: ["ott", "prob"], title: "Un «mammut» nato da un'elefantessa?", text: "L'azienda Colossal Biosciences vuole far nascere un elefante asiatico modificato con geni di mammut lanoso (pelo, grasso, orecchie piccole). Nel 2025 annunciava un piccolo entro il 2028; nel 2026 il suo amministratore ha spostato la data ai primi anni 2030. Non sarebbe un vero mammut, ma un «sostituto» (proxy). La gravidanza di un elefante dura 22 mesi.", cat: "scienza", lat: 32.78, lon: -96.8, certezza: "bassa", taxon: "mammut-lanoso",
 oggi: "Principi guida IUCN SSC sulla creazione di «proxy» di specie estinte (2016). Nell'aprile 2025 il gruppo di specialisti dei canidi IUCN ha dichiarato che i «metalupi» di Colossal non sono metalupi né loro sostituti.",
 curiosita: "Nel marzo 2025 Colossal ha presentato il «topo lanoso»: topi con un pelo lungo e dorato ottenuto modificando geni legati al pelo del mammut.",
 fonti: ["Colossal Biosciences 2025", "IUCN SSC Canid Specialist Group, 18/04/2025", "TIME 2026"], wiki: "De-estinzione", wikiEn: "De-extinction"},

{t: -0.000013, scen: ["ott", "prob"], title: "ITER: il Sole in una scatola?", text: "Il reattore sperimentale a fusione ITER, in Francia, dovrebbe iniziare gli esperimenti scientifici nel 2034 e quelli con deuterio e trizio nel 2039 (calendario del 2024). La fusione potrebbe dare energia senza CO₂ e quasi senza scorie di lunga durata, ma le centrali commerciali difficilmente arriveranno prima della seconda metà del secolo: troppo tardi per risolvere da sola la crisi climatica.", cat: "tecnologia", lat: 43.71, lon: 5.76, certezza: "media",
 oggi: "Progetto internazionale ITER (UE, Cina, India, Giappone, Corea, Russia, USA), accordo del 2006.",
 curiosita: "Dentro ITER il plasma dovrà arrivare a 150 milioni di gradi, dieci volte più caldo del centro del Sole.",
 fonti: ["ITER Organization, nuovo calendario 2024"], wiki: "ITER", wikiEn: "ITER"},

{t: -0.000014, scen: "tutti", title: "La prima estate artica senza ghiaccio", text: "Gli scienziati dicono «senza ghiaccio» quando nel Mar Glaciale Artico resta meno di 1 milione di km² di ghiaccio marino (oggi a settembre ce ne sono circa 4–5). Secondo l'IPCC accadrà almeno una volta prima del 2050 in tutti gli scenari; alcuni studi la anticipano agli anni 2030. Nello scenario ottimistico resta un evento raro; in quello pessimistico diventa la regola e d'estate le navi attraversano il Polo Nord.", cat: "clima", lat: 85, lon: 0, big: true, certezza: "alta",
 oggi: "Monitoraggio satellitare del National Snow and Ice Data Center (NSIDC) e di Copernicus; Consiglio Artico. Nel 2025 la IUCN ha spostato la foca dal cappuccio a «In pericolo» per la perdita del ghiaccio.",
 curiosita: "Il ghiaccio rimasto più a lungo sarà quello a nord della Groenlandia e del Canada: per questo lo chiamano «l'ultima area di ghiaccio».",
 fonti: ["IPCC AR6 WGI SPM B.2.5", "Kim et al. 2023, Nature Communications", "Heuzé e Jahn 2024, Nature Communications"], wiki: "Banchisa", wikiEn: "Arctic sea ice decline", taxon: "orso-polare"},

{t: -0.000014, scen: "tutti", title: "Il buco dell'ozono si chiude (quasi)", text: "Grazie al Protocollo di Montréal (1987), che ha vietato i CFC, lo strato di ozono si sta riparando. Secondo la valutazione WMO-UNEP del 2022 torna ai valori del 1980 verso il 2040 nella maggior parte del mondo, verso il 2045 sull'Artide e verso il 2066 sull'Antartide. È la prova che un accordo mondiale ben rispettato può risolvere un problema globale.", cat: "conservazione", lat: -75, lon: 0, big: true, certezza: "alta",
 oggi: "Protocollo di Montréal (1987), ratificato da tutti i paesi del mondo (198 parti); Emendamento di Kigali (2016) sugli HFC, che potrebbe evitare fino a circa 0,4 °C di riscaldamento entro il 2100.",
 curiosita: "Il buco fu scoperto nel 1985 da tre scienziati del British Antarctic Survey: all'inizio pensarono che il loro strumento fosse rotto, perché i valori erano troppo bassi.",
 fonti: ["WMO/UNEP Scientific Assessment of Ozone Depletion 2022"], wiki: "Buco nell'ozono", wikiEn: "Ozone depletion"},

{t: -0.000014, scen: ["ott", "prob"], title: "Coralli «allenati» al caldo", text: "Gli scienziati dell'Australian Institute of Marine Science incrociano coralli delle acque più calde e li espongono a temperature alte per selezionare quelli più resistenti («evoluzione assistita»). Si conservano anche spermatozoi e larve di corallo congelati. Non può salvare tutte le barriere, ma può creare rifugi da cui ripartire se il clima si stabilizza.", cat: "conservazione", lat: -19.3, lon: 147.06, certezza: "media", taxon: "corallo-corno-alce",
 oggi: "Global Tipping Points Report 2025: le barriere coralline tropicali hanno superato il loro punto di non ritorno (soglia centrale circa 1,2 °C). Tra il 2023 e il 2025 il quarto sbiancamento globale ha colpito oltre l'80% delle barriere (NOAA, ICRI).",
 curiosita: "I coralli del Golfo di Aqaba, nel Mar Rosso, sopportano temperature più alte di quelle di oggi: i loro antenati, durante la risalita dall'Oceano Indiano, hanno attraversato lo stretto caldissimo di Bab el-Mandeb.",
 fonti: ["AIMS, Reef Restoration and Adaptation Program", "Global Tipping Points Report 2025"], wiki: "Sbiancamento dei coralli", wikiEn: "Coral bleaching"},

{t: -0.000014, scen: "tutti", title: "La Marmolada senza ghiacciaio", text: "Il 3 luglio 2022 un pezzo del ghiacciaio della Marmolada è crollato e ha ucciso 11 persone, dopo giorni di caldo record. Il ghiacciaio è arretrato di circa 1 200 m dal 1888. Secondo glaciologi del Comitato Glaciologico Italiano, delle università di Padova e Parma e dell'OGS, se continua così sparirà prima del 2040 e difficilmente supererà il 2060 anche se la fusione rallenta.", cat: "clima", lat: 46.43, lon: 11.86, big: true, certezza: "media",
 oggi: "Carovana dei ghiacciai di Legambiente e CGI (rapporti annuali); l'ONU ha proclamato il 2025 Anno internazionale della conservazione dei ghiacciai e il periodo 2025–2034 Decennio di azione per le scienze criosferiche.",
 curiosita: "Nel 1991 la fusione di un ghiacciaio delle Alpi Venoste ha restituito Ötzi, l'uomo vissuto 5 300 anni fa: i ghiacciai che spariscono restituiscono anche storia.",
 fonti: ["OGS, comunicato 2022", "Legambiente-CGI, Carovana dei ghiacciai 2024"], wiki: "Marmolada", wikiEn: "Marmolada"},

{t: -0.000014, scen: "ott", title: "L'IA che conta le specie", text: "Fototrappole, registratori di suoni, DNA ambientale (eDNA: tracce di DNA nell'acqua o nel suolo) e satelliti producono miliardi di dati. Programmi di IA riconoscono animali nelle foto e canti di uccelli nelle registrazioni. Nello scenario ottimistico questi strumenti permettono di controllare in tempo reale gli obiettivi di Kunming-Montréal.", cat: "tecnologia", lat: null, lon: null, certezza: "media",
 oggi: "Quadro di monitoraggio del Kunming-Montréal (2022) e piattaforme come GBIF e iNaturalist.",
 curiosita: "L'app Merlin del Cornell Lab riconosce centinaia di specie di uccelli dal canto registrato con il telefono.",
 fonti: ["CBD, Monitoring Framework 2022"], wiki: null, wikiEn: "Environmental DNA"},

{t: -0.000021, scen: "tutti", title: "Intelligenza artificiale «generale»? Gli esperti non sono d'accordo", text: "Un'IA «generale» saprebbe fare quasi tutti i compiti intellettuali meglio degli esseri umani. In un sondaggio su 2 778 ricercatori (Grace et al. 2024) la stima mediana dava il 50% di probabilità entro il 2047, tredici anni prima rispetto al sondaggio precedente; ma le risposte vanno da «entro pochi anni» a «mai». Non è una previsione: è un'opinione, e gli esperti sono molto divisi.", cat: "tecnologia", lat: null, lon: null, certezza: "ipotesi",
 oggi: "Risoluzioni ONU sull'IA (marzo 2024; agosto 2025, A/RES/79/325): Gruppo scientifico internazionale indipendente sull'IA (40 esperti, nominati nel febbraio 2026) e Dialogo globale sulla governance dell'IA. International AI Safety Report (2025 e 2026), coordinato da Yoshua Bengio.",
 curiosita: "Nel 1956, al convegno di Dartmouth che diede il nome all'«intelligenza artificiale», gli organizzatori pensavano che bastasse un'estate di lavoro per fare grandi passi avanti.",
 fonti: ["Grace et al. 2024, arXiv:2401.02843", "International AI Safety Report 2026", "ONU A/RES/79/325"], wiki: "Intelligenza artificiale forte", wikiEn: "Artificial general intelligence"},

{t: -0.000024, scen: "pess", title: "IA fuori controllo o usata male", text: "Molti ricercatori temono che sistemi di IA molto potenti possano essere usati per armi, disinformazione o attacchi informatici, o sfuggire al controllo umano. Altri pensano che questi rischi siano esagerati e che i problemi veri siano lavoro, privacy e disuguaglianze. Il filosofo Toby Ord (2020) ha stimato «1 su 10» il rischio di una catastrofe esistenziale dovuta all'IA in questo secolo: è un'opinione personale, non un calcolo scientifico.", cat: "tecnologia", lat: null, lon: null, certezza: "ipotesi",
 oggi: "Vertici sulla sicurezza dell'IA di Bletchley Park (2023), Seul (2024), Parigi (2025) e Nuova Delhi (2026). Nel gennaio 2026 l'«Orologio dell'apocalisse» degli scienziati atomici è stato messo a 85 secondi dalla mezzanotte, anche per l'IA.",
 curiosita: "Nel 2023 centinaia di ricercatori hanno firmato una frase di una riga: ridurre il rischio di estinzione dovuto all'IA dovrebbe essere una priorità mondiale, come pandemie e guerra nucleare.",
 fonti: ["Ord 2020, The Precipice", "Bulletin of the Atomic Scientists 2026", "CAIS Statement 2023"], wiki: null, wikiEn: "Existential risk from artificial intelligence"},

{t: -0.000024, scen: "ott", title: "Zero emissioni nette di CO₂", text: "Nello scenario più ottimistico (SSP1-1.9) il mondo arriva a zero emissioni nette di CO₂ intorno al 2050: quanta CO₂ si emette, tanta se ne toglie dall'aria con foreste, suoli e macchine. Il riscaldamento si ferma subito dopo. L'Unione europea ha per legge la neutralità climatica al 2050 e un taglio del 90% entro il 2040.", cat: "clima", lat: 50.85, lon: 4.35, certezza: "media",
 oggi: "Legge europea sul clima (2021) e modifica del 2026 (−90% al 2040, con al massimo il 5% di crediti internazionali dal 2036). L'Italia ha il Piano nazionale integrato energia e clima (PNIEC, 2024).",
 curiosita: "Le macchine che catturano CO₂ dall'aria esistono già, per esempio in Islanda, ma oggi ne tolgono quantità minuscole: tutte insieme meno di quanto il mondo emette in pochi secondi.",
 fonti: ["IPCC AR6 SPM", "Regolamento (UE) 2021/1119"], wiki: "Neutralità carbonica", wikiEn: "Net-zero emissions"},

{t: -0.000024, scen: "tutti", title: "Le Alpi salgono", text: "Con il caldo piante e animali si spostano verso l'alto. Sulle cime d'Europa il numero di specie vegetali aumenta sempre più in fretta (Steinbauer et al. 2018), ma le specie dei piani più alti, come la pernice bianca, la stella alpina o la salamandra di Lanza, non hanno un «piano di sopra» dove andare. Lo stambecco già sale di quota e cambia orari per evitare il caldo.", cat: "natura", lat: 45.52, lon: 7.27, certezza: "alta", taxon: "stambecco",
 oggi: "Convenzione delle Alpi (1991); rete Natura 2000 e direttiva Habitat (1992); Regolamento europeo sul ripristino della natura (2024).",
 curiosita: "Al Gran Paradiso gli stambecchi d'estate pascolano sempre più di notte, quando fa fresco, ma al buio rischiano di più con i lupi (Brivio et al. 2024, Proceedings of the Royal Society B).",
 fonti: ["Steinbauer et al. 2018, Nature", "Brivio et al. 2024, Proceedings of the Royal Society B"], wiki: "Capra ibex", wikiEn: "Alpine ibex"},

{t: -0.000024, scen: "tutti", title: "Il Mediterraneo diventa tropicale", text: "Il Mediterraneo si scalda più in fretta della media degli oceani. Specie arrivate dal Mar Rosso attraverso il canale di Suez, come il pesce scorpione e il pesce palla maculato (velenoso), si sono già stabilite nei mari italiani. La tartaruga Caretta caretta depone sempre più a nord, anche in Toscana, Liguria e Francia. Nello scenario pessimistico le ondate di calore marine diventano quasi continue e spazzano via gorgonie, nacchere e posidonia.", cat: "natura", lat: 37.5, lon: 15.1, certezza: "alta", taxon: "caretta-caretta",
 oggi: "Convenzione di Barcellona per il Mediterraneo (1976); Strategia marina UE (2008); Rapporto MedECC 2020 sul clima del Mediterraneo.",
 curiosita: "Il pesce palla maculato (Lagocephalus sceleratus) contiene tetrodotossina, un veleno mortale anche dopo la cottura: in Italia è vietato venderlo.",
 fonti: ["MedECC 2020", "ISPRA"], wiki: "Migrazione lessepsiana", wikiEn: "Lessepsian migration"},

{t: -0.000024, scen: ["prob", "pess"], title: "Estati italiane da 2003", text: "L'estate del 2003 in Europa, con circa 70 000 morti, era eccezionale; con 2 °C di riscaldamento globale estati così diventano frequenti. Nel 2022 il caldo ha causato in Italia circa 18 000 morti, il numero più alto d'Europa (Ballester et al. 2023). Il record europeo di temperatura, 48,8 °C, è stato misurato vicino a Floridia, in Sicilia, l'11 agosto 2021.", cat: "clima", lat: 37.08, lon: 15.15, certezza: "alta",
 oggi: "Piano nazionale di adattamento ai cambiamenti climatici (PNACC, approvato nel dicembre 2023); piani regionali contro il caldo del Ministero della Salute.",
 curiosita: "Il record di Floridia è stato verificato e riconosciuto ufficialmente dall'Organizzazione meteorologica mondiale.",
 fonti: ["Ballester et al. 2023, Nature Medicine", "WMO, archivio degli estremi"], wiki: "Ondata di calore", wikiEn: "Heat wave"},

{t: -0.000024, scen: ["prob", "pess"], title: "Zanzare tropicali in Italia", text: "La zanzara tigre è arrivata in Italia nel 1990, a Genova, nei copertoni usati. Con il caldo diventa più attiva e più a lungo: nel 2007 in Romagna c'è stata un'epidemia di chikungunya e nel 2024 a Fano un focolaio di dengue con circa 200 casi. Nello scenario probabile la stagione delle zanzare si allunga e serviranno sorveglianza e prevenzione.", cat: "umani", lat: 43.84, lon: 13.02, certezza: "alta",
 oggi: "Piano nazionale di prevenzione, sorveglianza e risposta alle arbovirosi (PNA 2020–2025) del Ministero della Salute; rete europea di sorveglianza ECDC.",
 curiosita: "Uno studio del 2025 su Science ha mostrato che la «zanzara della metropolitana di Londra» non si è evoluta nei tunnel, come si credeva: la sua forma che punge l'uomo è nata migliaia di anni fa nel Mediterraneo, forse nell'antico Egitto.",
 fonti: ["ISS, EpiCentro", "Haba et al. 2025, Science"], wiki: "Aedes albopictus", wikiEn: "Aedes albopictus"},

{t: -0.000024, scen: "tutti", title: "Città che affondano: Giacarta", text: "Giacarta, in Indonesia, sprofonda in alcuni quartieri di diversi centimetri all'anno perché si pompa acqua dal sottosuolo, mentre il mare sale. Nel 2022 l'Indonesia ha deciso di spostare la capitale a Nusantara, nel Borneo. Anche il delta del Po si è abbassato di metri nel Novecento per l'estrazione di acqua e metano.", cat: "umani", lat: -6.13, lon: 106.82, certezza: "alta",
 oggi: "Legge indonesiana n. 3/2022 sulla nuova capitale; in Italia le estrazioni di metano nel delta del Po furono fermate negli anni Sessanta.",
 curiosita: "Per molte città costiere oggi l'abbassamento del suolo (subsidenza) fa salire il mare «relativo» più in fretta del riscaldamento globale.",
 fonti: ["Nicholls et al. 2021, Nature Climate Change"], wiki: "Giacarta", wikiEn: "Jakarta"},

{t: -0.000024, scen: "tutti", title: "Isole costruite più in alto: le Maldive", text: "Le Maldive sono il paese più basso del mondo: in media circa 1,5 m sul mare. Dagli anni Novanta hanno costruito Hulhumalé, un'isola artificiale alta circa 2 m, e progettano città galleggianti. Nello scenario ottimistico l'adattamento funziona per tutto il secolo; in quello pessimistico molte isole diventano inabitabili.", cat: "umani", lat: 4.21, lon: 73.54, certezza: "media",
 oggi: "Fondo per perdite e danni (COP27–COP28) e Obiettivo globale sull'adattamento con 59 indicatori (COP30, 2025).",
 curiosita: "Nel 2009 il governo delle Maldive ha tenuto una riunione dei ministri sott'acqua, con muta e bombole, per chiedere al mondo di ridurre le emissioni.",
 fonti: ["IPCC AR6 WGII, cap. 15"], wiki: null, wikiEn: "Hulhumalé"},

{t: -0.000024, scen: ["prob", "pess"], title: "Megaincendi", text: "Con il caldo e la siccità gli incendi diventano più grandi e frequenti, in Australia, Canada, Mediterraneo e Amazzonia. Gli incendi australiani del 2019–2020 hanno colpito circa 3 miliardi di animali (stima WWF 2020). Nel 2023 gli incendi canadesi hanno bruciato oltre 15 milioni di ettari, un record.", cat: "natura", lat: -35.5, lon: 150, certezza: "alta",
 oggi: "UNEP, Spreading like Wildfire (2022): gli incendi estremi potrebbero aumentare del 30% entro il 2050 e del 50% entro il 2100.",
 curiosita: "Alcune piante australiane, come molti eucalipti, sono adattate al fuoco: germogliano dal tronco bruciato pochi mesi dopo l'incendio.",
 fonti: ["UNEP 2022", "WWF Australia 2020"], wiki: "Incendi in Australia del 2019-2020", wikiEn: "2019–20 Australian bushfire season"},

{t: -0.000024, scen: "tutti", title: "Lo «zoo congelato»", text: "Dal 1975 il Frozen Zoo di San Diego conserva cellule vive di oltre mille specie a −196 °C. Da cellule congelate nel 1980 è nato nel 2020 Kurt, clone di cavallo di Przewalski; da cellule del 1988 è nata Elizabeth Ann, clone di furetto dai piedi neri, e nel 2024 un'altra femmina clonata, Antonia, ha avuto dei piccoli. Così si recupera diversità genetica perduta.", cat: "conservazione", lat: 32.74, lon: -117.15, certezza: "alta", taxon: "furetto-piedi-neri",
 oggi: "Quadro di Kunming-Montréal, obiettivo 4: mantenere la diversità genetica delle specie selvatiche e domestiche.",
 curiosita: "La «donatrice» di Elizabeth Ann, una femmina chiamata Willa, era morta oltre trent'anni prima della nascita del suo clone.",
 fonti: ["San Diego Zoo Wildlife Alliance", "US Fish and Wildlife Service 2021, 2024"], wiki: "Clonazione", wikiEn: "Frozen zoo"},

{t: -0.000034, scen: "pess", title: "Fine delle barriere coralline come le conosciamo", text: "Con oltre 2 °C l'IPCC stima la perdita di più del 99% dei coralli costruttori di barriera. Al posto delle barriere restano rocce coperte di alghe, spugne e coralli molli. Ne soffrono circa un quarto delle specie marine e quasi un miliardo di persone che dipendono dalle barriere per pesca, turismo e protezione delle coste.", cat: "estinzione", lat: -18.29, lon: 147.7, big: true, certezza: "alta", taxon: "corallo-corno-cervo",
 oggi: "IPCC SR1.5 (2018): −70–90% a 1,5 °C, oltre −99% a 2 °C. Global Tipping Points Report 2025. Iniziativa internazionale per le barriere coralline (ICRI).",
 curiosita: "Nella storia della Terra le barriere coralline sono già sparite dopo alcune estinzioni di massa: dopo quella della fine del Permiano ci vollero circa 10 milioni di anni perché tornassero.",
 fonti: ["IPCC SR1.5", "Global Tipping Points Report 2025"], wiki: "Barriera corallina", wikiEn: "Coral reef"},

{t: -0.000034, scen: "prob", title: "Il triplo della plastica", text: "Senza nuove regole, l'OCSE stima che i rifiuti di plastica quasi triplicheranno entro il 2060, fino a circa un miliardo di tonnellate all'anno. Le microplastiche si trovano già dalla Fossa delle Marianne alla neve dell'Antartide e nel sangue umano. Gli strati di plastica saranno uno dei «fossili» della nostra epoca.", cat: "natura", lat: 46.22, lon: 6.14, certezza: "media",
 oggi: "Negoziati ONU per un trattato sulla plastica: le sessioni di Busan (2024) e Ginevra (agosto 2025) si sono chiuse senza accordo; nel febbraio 2026 è stato eletto un nuovo presidente, il cileno Julio Cordano.",
 curiosita: "La frase «nel 2050 ci sarà più plastica che pesci nel mare» viene da un rapporto del 2016 ed è stata molto criticata: i dati sulla quantità di pesci e di plastica sono troppo incerti per un confronto così.",
 fonti: ["OCSE, Global Plastics Outlook 2022", "UNEP INC"], wiki: "Inquinamento causato dalla plastica", wikiEn: "Plastic pollution"},

{t: -0.000034, scen: "pess", title: "La tentazione della geoingegneria", text: "Se il caldo diventasse insopportabile, qualche paese potrebbe tentare di schermare il Sole spargendo particelle nella stratosfera. Raffredderebbe il pianeta ma non toglierebbe la CO₂ (il mare continuerebbe ad acidificarsi) e, se si smettesse di colpo, il caldo tornerebbe in pochi anni («shock di terminazione»). Potrebbe anche cambiare i monsoni. Oggi è solo oggetto di studio.", cat: "tecnologia", lat: 15.14, lon: 120.35, certezza: "ipotesi",
 oggi: "Decisione X/33 della Convenzione sulla diversità biologica (2010): moratoria sulla geoingegneria che possa colpire la biodiversità. L'Assemblea ONU per l'ambiente non ha trovato un accordo nel 2019 e nel 2024.",
 curiosita: "L'eruzione del vulcano Pinatubo, nelle Filippine, nel 1991 ha raffreddato la Terra di circa 0,5 °C per un paio d'anni: è il «modello naturale» della geoingegneria solare.",
 fonti: ["IPCC AR6 WGI, cap. 4", "CBD X/33"], wiki: "Geoingegneria", wikiEn: "Solar radiation modification"},

{t: -0.000044, scen: ["prob", "pess"], title: "Il permafrost si scioglie", text: "Il permafrost è il terreno gelato tutto l'anno dell'Artico: contiene circa il doppio del carbonio dell'atmosfera. Scongelandosi fa crollare strade e case e libera CO₂ e metano, che scaldano ancora di più. Secondo l'IPCC una parte importante del permafrost vicino alla superficie sparisce entro il 2100, tanto più quanto più alte sono le emissioni.", cat: "clima", lat: 68.5, lon: 161, certezza: "alta",
 oggi: "Armstrong McKay et al. 2022: fusione improvvisa del permafrost boreale possibile già intorno a 1,5 °C. Consiglio Artico e programma AMAP.",
 curiosita: "Nel 2016, nella penisola di Jamal in Siberia, un'estate caldissima scongelò la carcassa di una renna morta di antrace decenni prima: l'epidemia uccise migliaia di renne e un ragazzo.",
 fonti: ["IPCC AR6 WGI cap. 9", "Armstrong McKay et al. 2022, Science"], wiki: "Permafrost", wikiEn: "Permafrost"},

{t: -0.000054, scen: ["prob", "pess"], title: "Il MOSE si alza sempre più spesso", text: "Dal 3 ottobre 2020 Venezia si difende dall'acqua alta con il MOSE: 78 paratoie che si alzano alle bocche della laguna. Con il mare più alto di 50 cm il MOSE dovrebbe chiudersi moltissime volte all'anno, con danni per il porto e per il ricambio d'acqua della laguna. Verso fine secolo, nello scenario pessimistico, servirà una nuova soluzione.", cat: "umani", lat: 45.42, lon: 12.34, certezza: "media",
 oggi: "Legge speciale per Venezia (1973 e seguenti); Venezia e la sua laguna sono patrimonio mondiale UNESCO dal 1987.",
 curiosita: "Dal 1872 Venezia è scesa di circa 30 cm rispetto al mare: in parte per il mare che sale, in parte per l'estrazione di acqua dal sottosuolo, vietata dagli anni Settanta.",
 fonti: ["Umgiesser 2020, Journal for Nature Conservation", "CNR-ISMAR"], wiki: "MOSE", wikiEn: "MOSE"},

{t: -0.000054, scen: ["prob", "pess"], title: "Bangladesh: vivere con le alluvioni", text: "Il Bangladesh ha 170 milioni di abitanti e gran parte del paese è un enorme delta pochi metri sopra il mare. Grazie ai rifugi anti-ciclone e ai sistemi di allerta, i morti per cicloni sono crollati dagli anni Settanta a oggi. Ma l'acqua salata entra nei campi e nei pozzi. La Banca mondiale stima che entro il 2050 fino a 216 milioni di persone nel mondo potrebbero spostarsi all'interno del proprio paese a causa del clima (scenario peggiore).", cat: "umani", lat: 22.5, lon: 90.0, certezza: "media",
 oggi: "Banca mondiale, Groundswell (2021); Piano Delta del Bangladesh 2100 (2018); Fondo ONU per perdite e danni (2023).",
 curiosita: "Il ciclone Bhola del 1970 uccise circa 300 000 persone; il ciclone Amphan del 2020, altrettanto forte, ne uccise circa un centinaio grazie alle evacuazioni.",
 fonti: ["World Bank, Groundswell 2021"], wiki: "Bangladesh", wikiEn: "Bangladesh"},

{t: -0.000058, scen: "tutti", title: "Il picco della popolazione umana", text: "Secondo l'ONU (World Population Prospects 2024) la popolazione mondiale, oggi circa 8,3 miliardi, arriverà al massimo di circa 10,3 miliardi verso il 2084 e poi calerà lentamente. La probabilità che il picco arrivi entro il secolo è dell'80%. Nello scenario ottimistico, con più istruzione per le ragazze, il picco arriva prima (circa 9 miliardi verso il 2060). Per la prima volta dalla peste nera del Trecento la popolazione umana diminuirà.", cat: "umani", lat: null, lon: null, big: true, certezza: "media",
 oggi: "ONU-DESA, World Population Prospects 2024; Obiettivi di sviluppo sostenibile 4 e 5 (istruzione e parità di genere).",
 curiosita: "In 63 paesi, tra cui Cina, Germania, Giappone e Italia, la popolazione ha già raggiunto il massimo e sta calando.",
 fonti: ["UN WPP 2024", "KC e Lutz 2017, SSP"], wiki: "Popolazione mondiale", wikiEn: "World population"},

{t: -0.000058, scen: ["prob", "pess"], title: "Pinguini imperatori dimezzati", text: "Il pinguino imperatore alleva i piccoli sul ghiaccio marino attaccato alla costa: se si rompe troppo presto, i pulcini, senza piume impermeabili, annegano o muoiono di freddo. Nel 2022 quattro colonie del Mare di Bellingshausen hanno perso quasi tutti i piccoli. Nell'aprile 2026 la IUCN lo ha classificato «In pericolo»: la popolazione dovrebbe dimezzarsi entro gli anni 2080.", cat: "estinzione", lat: -70, lon: -85, certezza: "alta", taxon: "pinguino-imperatore",
 oggi: "Lista Rossa IUCN, aggiornamento del 9 aprile 2026 (pinguino imperatore e otaria orsina antartica «In pericolo»); Trattato antartico (1959) e CCAMLR.",
 curiosita: "Le colonie di pinguini imperatori si contano dallo spazio: le loro macchie marroni di guano sul ghiaccio si vedono nelle foto satellitari.",
 fonti: ["IUCN 2026", "Fretwell et al. 2023, Communications Earth & Environment", "Jenouvrier et al. 2021, Global Change Biology"], wiki: "Aptenodytes forsteri", wikiEn: "Emperor penguin"},

{t: -0.000074, scen: "ott", title: "2100: un pianeta più caldo ma stabile", text: "Nello scenario ottimistico la temperatura nel 2100 è circa 1,4–1,8 °C sopra il periodo preindustriale e in lenta discesa. Il mare è salito di 30–60 cm e continua a salire piano. Molti ecosistemi danneggiati si stanno riprendendo grazie al ripristino della natura; alcune specie sono state salvate con zoo, banche dei semi e reintroduzioni.", cat: "clima", lat: null, lon: null, big: true, certezza: "media",
 oggi: "IPCC AR6 WGI, tabella SPM.1 (SSP1-1.9 e SSP1-2.6); Leclère et al. 2020: con aree protette, agricoltura più efficiente e diete diverse si può invertire il declino della biodiversità prima del 2050.",
 curiosita: "Anche nello scenario migliore il mare continuerà a salire per secoli: gli oceani e le calotte sono «lenti» come una pentola grande sul fuoco.",
 fonti: ["IPCC AR6 WGI SPM", "Leclère et al. 2020, Nature"], wiki: "Riscaldamento globale", wikiEn: "Climate change"},

{t: -0.000074, scen: "prob", title: "2100: quasi 3 gradi", text: "Con le politiche di oggi nel 2100 il riscaldamento è di circa 2,6–2,8 °C. Il mare è salito di circa mezzo metro e le inondazioni costiere che oggi capitano una volta al secolo succedono ogni anno in molti porti. Circa un quinto dell'umanità vive in luoghi più caldi della «nicchia climatica» in cui l'uomo ha sempre vissuto (Lenton et al. 2023).", cat: "clima", lat: null, lon: null, big: true, certezza: "media",
 oggi: "UNEP Emissions Gap Report 2025 («Off target»): 2,8 °C con le politiche attuali, 2,3–2,5 °C con le promesse; Climate Action Tracker. Gli Stati Uniti sono usciti dall'Accordo di Parigi il 27 gennaio 2026.",
 curiosita: "Lenton e colleghi hanno calcolato che limitare il riscaldamento a 1,5 °C invece di 2,7 °C ridurrebbe di cinque volte il numero di persone esposte a caldo pericoloso.",
 fonti: ["UNEP EGR 2025", "Lenton et al. 2023, Nature Sustainability"], wiki: "Riscaldamento globale", wikiEn: "Climate change"},

{t: -0.000074, scen: "pess", title: "2100: oltre 4 gradi", text: "Nello scenario pessimistico il riscaldamento nel 2100 è di circa 4,4 °C (3,3–5,7). In alcune zone del Golfo Persico e dell'Asia meridionale il caldo umido supera per alcuni giorni i limiti che il corpo umano sopporta all'aperto. Il mare è salito di 60 cm–1 m (fino a quasi 2 m se le calotte antartiche cedono in fretta). I raccolti di mais e grano nelle zone tropicali calano.", cat: "clima", lat: 26, lon: 51, big: true, certezza: "media",
 oggi: "IPCC AR6 WGI e WGII (2021–2022). Lo scenario SSP5-8.5 oggi è considerato improbabile perché le rinnovabili crescono, ma resta il riferimento per il «caso peggiore».",
 curiosita: "Per misurare il caldo umido si usa la «temperatura di bulbo umido»: è quella di un termometro avvolto in un panno bagnato. Oltre circa 31–35 °C il sudore non riesce più a raffreddarci.",
 fonti: ["IPCC AR6", "Pal ed Eltahir 2016, Nature Climate Change", "Vecellio et al. 2022"], wiki: "Temperatura di bulbo umido", wikiEn: "Wet-bulb temperature"},

{t: -0.000074, scen: "ott", title: "Il mare nel 2100: 30–60 cm", text: "Nello scenario ottimistico il livello medio del mare nel 2100 è più alto di circa 28–62 cm rispetto al periodo 1995–2014 (IPCC). È già abbastanza per far arretrare spiagge e aumentare l'acqua alta, ma Venezia, Olanda e le grandi città possono difendersi.", cat: "clima", lat: 52.37, lon: 4.9, certezza: "alta",
 oggi: "IPCC AR6 WGI, SPM B.5.3; Programma Delta dei Paesi Bassi (aggiornato ogni anno).",
 curiosita: "Circa un quarto dei Paesi Bassi si trova sotto il livello del mare: il paese esiste grazie a dighe e pompe, un tempo mosse dai mulini a vento.",
 fonti: ["IPCC AR6 WGI SPM"], wiki: "Aumento del livello del mare", wikiEn: "Sea level rise"},

{t: -0.000074, scen: "prob", title: "Il mare nel 2100: circa mezzo metro", text: "Con circa 2,7 °C il mare sale di 44–76 cm entro il 2100 (IPCC). In Italia, secondo le mappe dell'ENEA, potrebbero finire a rischio di inondazione migliaia di km² di pianure costiere: il delta del Po, la laguna di Venezia, la costa romagnola, la piana di Fondi, il golfo di Cagliari e Oristano. Le coste basse delle isole del Pacifico diventano molto più difficili da abitare.", cat: "clima", lat: 44.95, lon: 12.4, certezza: "alta",
 oggi: "PNACC 2023; Direttiva europea sulle alluvioni (2007); mappe ENEA dei rischi costieri (2017–2024).",
 curiosita: "Il delta del Po cresce verso il mare da secoli: la città di Adria, che ha dato il nome all'Adriatico, era un porto e oggi si trova a più di 20 km dalla costa.",
 fonti: ["IPCC AR6 WGI SPM", "ENEA"], wiki: "Delta del Po", wikiEn: "Po (river)"},

{t: -0.000074, scen: "pess", title: "Il mare nel 2100: fino a 1 metro e oltre", text: "Con le emissioni più alte il mare sale di 63 cm–1 m entro il 2100. Se le calotte antartiche diventano instabili (evento poco probabile ma non escluso) si arriva vicino a 2 m. Gli atolli corallini, come Tuvalu e Kiribati, diventano inabitabili soprattutto perché le onde di tempesta salinizzano l'acqua dolce, prima ancora di essere sommersi.", cat: "clima", lat: -8.52, lon: 179.2, certezza: "media",
 oggi: "Trattato «Falepili» tra Australia e Tuvalu (firmato nel 2023, in vigore dal 2024): 280 visti all'anno per vivere in Australia; al primo sorteggio del 2025 si è iscritta circa metà della popolazione.",
 curiosita: "Nel 2014 Kiribati ha comprato circa 2 400 ettari di terra sull'isola di Vanua Levu, nelle Figi, per coltivare cibo ed eventualmente accogliere i suoi abitanti.",
 fonti: ["IPCC AR6 WGI SPM", "Storlazzi et al. 2018, Science Advances", "DFAT Australia"], wiki: "Tuvalu", wikiEn: "Australia–Tuvalu relations"},

{t: -0.000074, scen: ["prob", "pess"], title: "Le Alpi quasi senza ghiacciai", text: "Uno studio del 2025 su Science calcola che con un riscaldamento stabile di 2 °C le Alpi conserverebbero solo il 10–15% del ghiaccio del 2020; con 2,7 °C nel mondo resterebbe circa un quarto del ghiaccio dei ghiacciai. Fiumi come il Po riceverebbero meno acqua d'estate, proprio quando serve all'agricoltura. Nel 2025 il crollo del ghiacciaio del Birch ha sepolto il villaggio svizzero di Blatten, evacuato in tempo.", cat: "clima", lat: 46.42, lon: 7.82, certezza: "alta",
 oggi: "Anno internazionale della conservazione dei ghiacciai (ONU, 2025); monitoraggio del Comitato Glaciologico Italiano e del World Glacier Monitoring Service.",
 curiosita: "Anche se il riscaldamento si fermasse oggi, il 39% del ghiaccio dei ghiacciai del mondo andrebbe comunque perso nei prossimi secoli (Zekollari et al. 2025).",
 fonti: ["Zekollari et al. 2025, Science", "Rounce et al. 2023, Science"], wiki: "Ritiro dei ghiacciai", wikiEn: "Retreat of glaciers since 1850"},

{t: -0.000074, scen: "prob", title: "La corrente atlantica rallenta", text: "La Circolazione meridionale atlantica (AMOC), di cui fa parte la Corrente del Golfo, porta calore verso l'Europa. L'IPCC la considera molto probabilmente in indebolimento nel XXI secolo, ma con fiducia media non in collasso prima del 2100. Il dibattito è aperto: uno studio del 2023 (Ditlevsen) stimava un collasso possibile già tra il 2025 e il 2095; uno del 2025 (Baker et al.) trova invece che nei modelli l'AMOC si indebolisce ma non si spegne del tutto.", cat: "clima", lat: 50, lon: -30, big: true, certezza: "media",
 oggi: "Global Tipping Points Report 2025; rete di misura RAPID dell'Atlantico a 26°N (dal 2004).",
 curiosita: "Durante l'ultima glaciazione l'AMOC si è spenta e riaccesa più volte: in Groenlandia la temperatura cambiava di 10 °C in pochi decenni.",
 fonti: ["IPCC AR6 WGI", "Ditlevsen e Ditlevsen 2023, Nature Communications", "Baker et al. 2025, Nature", "van Westen et al. 2024, Science Advances"], wiki: "Circolazione termoalina", wikiEn: "Atlantic meridional overturning circulation"},

{t: -0.000074, scen: "pess", title: "L'Amazzonia diventa savana?", text: "Una foresta pluviale fa piovere su sé stessa: gli alberi rimettono in aria l'acqua che poi ricade. Se si disbosca troppo e fa troppo caldo, il ciclo si rompe e parte della foresta può trasformarsi in savana degradata. Si stima che il 10–47% dell'Amazzonia sarà esposto a più stress insieme entro il 2050 (Flores et al. 2024). La soglia è incerta: circa 3,5 °C (2–6 °C) di riscaldamento, oppure il 20–25% di foresta tagliata (oggi circa il 17–18%).", cat: "natura", lat: -5, lon: -60, certezza: "bassa",
 oggi: "Fondo «Foreste tropicali per sempre» (TFFF) lanciato alla COP30 di Belém (2025); Regolamento europeo contro la deforestazione importata (2023, applicazione rinviata).",
 curiosita: "Ogni giorno l'Amazzonia libera nell'aria circa 20 miliardi di tonnellate d'acqua: più di quanta ne porta al mare il Rio delle Amazzoni. Questi «fiumi volanti» portano la pioggia fino al sud del Brasile.",
 fonti: ["Flores et al. 2024, Nature", "Armstrong McKay et al. 2022, Science", "Lovejoy e Nobre 2018"], wiki: "Amazzonia", wikiEn: "Amazon rainforest"},

{t: -0.000074, scen: "pess", title: "Orsi polari solo nell'alto Artico", text: "L'orso polare caccia le foche dal ghiaccio marino. Se il ghiaccio manca troppi mesi, digiuna troppo a lungo. Secondo Molnár e colleghi (2020), con emissioni alte quasi tutte le popolazioni smetterebbero di riprodursi entro il 2100, tranne poche nell'alto Artico canadese. Con riduzioni moderate alcune popolazioni sopravvivono oltre il 2100.", cat: "estinzione", lat: 76, lon: -95, certezza: "media", taxon: "orso-polare",
 oggi: "Accordo internazionale per la conservazione degli orsi polari (1973) tra Canada, Danimarca, Norvegia, Russia e USA; IUCN: «Vulnerabile».",
 curiosita: "In natura sono stati trovati ibridi tra orso polare e grizzly («pizzly»): le analisi genetiche del 2017 hanno mostrato che otto di loro discendevano da una sola femmina di orso polare.",
 fonti: ["Molnár et al. 2020, Nature Climate Change", "Pongracz et al. 2017, Arctic"], wiki: "Ursus maritimus", wikiEn: "Polar bear"},

{t: -0.000074, scen: ["ott", "prob", "pess"], title: "Le banche dei semi come arca", text: "Nel Global Seed Vault delle Svalbard, scavato nel permafrost di un'isola artica, sono conservati dal 2008 oltre 1,3 milioni di campioni di semi da quasi tutti i paesi. In ogni scenario queste banche permettono di recuperare varietà coltivate perdute e di creare piante adatte al nuovo clima.", cat: "conservazione", lat: 78.24, lon: 15.49, certezza: "alta",
 oggi: "Trattato internazionale sulle risorse fitogenetiche per l'alimentazione e l'agricoltura (FAO, 2001); Crop Trust.",
 curiosita: "Il primo prelievo dal «caveau dell'apocalisse» è avvenuto nel 2015: il centro di ricerca ICARDA, fuggito da Aleppo per la guerra in Siria, ha ritirato i suoi semi per ricominciare in Libano e Marocco.",
 fonti: ["Crop Trust", "NordGen"], wiki: "Svalbard Global Seed Vault", wikiEn: "Svalbard Global Seed Vault"},

{t: -0.000074, scen: "ott", title: "Prime basi su Marte?", text: "Le agenzie spaziali e alcune aziende parlano di mandare persone su Marte entro qualche decennio. Nel 2026 la missione Artemis II ha portato quattro astronauti attorno alla Luna, la prima volta dal 1972. Ma vivere su Marte è difficilissimo: radiazioni, gravità pari al 38% di quella terrestre, suolo tossico (perclorati), niente aria respirabile. Molti scienziati pensano che una vera colonia autosufficiente richieda molto più di un secolo.", cat: "tecnologia", lat: null, lon: null, certezza: "ipotesi",
 oggi: "Trattato sullo spazio extra-atmosferico (ONU, 1967): nessuno stato può possedere la Luna o i pianeti. Accordi Artemis (dal 2020, firmati anche dall'Italia).",
 curiosita: "Artemis II è partita il 1° aprile 2026 ed è ammarata nel Pacifico il 10 aprile: tra i quattro astronauti c'era Christina Koch, la donna con il volo spaziale singolo più lungo della storia.",
 fonti: ["NASA 2026", "Weinersmith e Weinersmith 2023, A City on Mars"], wiki: "Colonizzazione di Marte", wikiEn: "Colonization of Mars"},

{t: -0.000124, scen: "pess", title: "Possibile collasso della corrente atlantica", text: "Con emissioni altissime alcuni modelli mostrano che dopo il 2100 l'AMOC potrebbe spegnersi. L'Europa nord-occidentale si raffredderebbe rispetto al resto del mondo che si scalda, le piogge tropicali si sposterebbero verso sud e il mare salirebbe di più sulle coste americane. È uno dei punti di non ritorno più discussi: la probabilità è incerta.", cat: "clima", lat: 60, lon: -30, certezza: "bassa",
 oggi: "Armstrong McKay et al. 2022: soglia del collasso circa 4 °C (1,4–8 °C). Nel 2024 oltre 40 climatologi hanno scritto ai governi nordici che il rischio è stato sottovalutato.",
 curiosita: "Il film «The Day After Tomorrow» (2004) mostrava un collasso dell'AMOC in pochi giorni: nella realtà ci vorrebbero decenni, e non arriverebbe una glaciazione.",
 fonti: ["van Westen et al. 2024, Science Advances", "Baker et al. 2025, Nature"], wiki: "Circolazione termoalina", wikiEn: "Atlantic meridional overturning circulation"},

{t: -0.000274, scen: "ott", title: "2300: mare più alto di 0,3–3 m", text: "Anche con emissioni basse il mare continua a salire: nel 2300 è più alto di 0,3–3,1 m rispetto al 1995–2014 (IPCC AR6, SSP1-2.6). Le città costiere hanno avuto quasi tre secoli per adattarsi.", cat: "clima", lat: null, lon: null, certezza: "media",
 oggi: "IPCC AR6 WGI, SPM B.5.4.",
 curiosita: "Durante l'ultimo interglaciale, circa 125 000 anni fa, il clima era solo poco più caldo di quello preindustriale, ma il mare era più alto di 6–9 m.",
 fonti: ["IPCC AR6 WGI SPM", "Dutton et al. 2015, Science"], wiki: "Aumento del livello del mare", wikiEn: "Sea level rise"},

{t: -0.000274, scen: "pess", title: "L'Antartide occidentale cede", text: "La calotta dell'Antartide occidentale poggia su un fondale sotto il livello del mare: l'acqua calda può infilarsi sotto e farla scivolare in mare. Se cede, il mare sale di circa 3,3 m, ma in secoli o millenni. Con le emissioni più alte il mare nel 2300 è più alto di 1,7–6,8 m e, nel caso peggiore poco probabile, fino a circa 15 m (IPCC).", cat: "clima", lat: -75.5, lon: -106.8, certezza: "bassa",
 oggi: "Armstrong McKay et al. 2022: soglia della calotta occidentale circa 1,5 °C (1–3 °C). Collaborazione internazionale sul ghiacciaio Thwaites (USA-Regno Unito, 2018–2025).",
 curiosita: "Il ghiacciaio Thwaites, grande quasi come la Gran Bretagna, è soprannominato «il ghiacciaio dell'apocalisse» (Doomsday Glacier) dai giornalisti, non dagli scienziati che lo studiano.",
 fonti: ["IPCC AR6 WGI SPM B.5.4", "Bamber et al. 2009, Science"], wiki: "Ghiacciaio Thwaites", wikiEn: "Thwaites Glacier"},

{t: -0.000474, scen: "pess", title: "La sesta estinzione di massa", text: "Una «estinzione di massa» vuol dire perdere almeno tre quarti delle specie in un tempo geologicamente breve: è successo 5 volte in 540 milioni di anni. Oggi siamo lontani da quella soglia (le estinzioni documentate sono poche centinaia di vertebrati), ma il ritmo è da decine a centinaia di volte superiore al normale. Secondo Barnosky e colleghi (2011), se si perdessero tutte le specie minacciate la soglia sarebbe raggiunta in 240–540 anni.", cat: "estinzione", lat: null, lon: null, big: true, certezza: "ipotesi",
 oggi: "IPBES Global Assessment 2019; Lista Rossa IUCN (ottobre 2025): 48 646 specie minacciate su 172 620 valutate.",
 curiosita: "I paleontologi chiamano l'estinzione causata dall'uomo «sesta» perché le prime cinque sono quelle dell'Ordoviciano, del Devoniano, del Permiano, del Triassico e del Cretaceo (quella dei dinosauri).",
 fonti: ["Barnosky et al. 2011, Nature", "Ceballos et al. 2015, Science Advances", "IPBES 2019"], wiki: "Estinzione dell'Olocene", wikiEn: "Holocene extinction"},

{t: -0.001, scen: "tutti", title: "Mille anni dopo: la CO₂ è ancora qui", text: "Una parte della CO₂ che emettiamo viene assorbita in pochi secoli da oceani e piante, ma il 20–40% resta nell'aria per migliaia di anni e una piccola parte per centinaia di migliaia di anni, finché le rocce non la «mangiano» lentamente con l'erosione. Per questo il riscaldamento causato oggi dura moltissimo, anche quando le emissioni sono finite.", cat: "clima", lat: null, lon: null, certezza: "alta",
 oggi: "IPCC AR6 WGI, cap. 5; il concetto di «emissioni nette zero» nasce proprio dal fatto che il riscaldamento dipende dal totale accumulato.",
 curiosita: "Il geochimico David Archer l'ha chiamata «la lunga coda»: la CO₂ dei combustibili fossili influirà sul clima più a lungo dei rifiuti nucleari e della plastica.",
 fonti: ["Archer et al. 2009, Annual Review of Earth and Planetary Sciences"], wiki: "Ciclo del carbonio", wikiEn: "Carbon cycle"},

{t: -0.001, scen: ["prob", "pess"], title: "La Groenlandia perde il suo ghiaccio (lentamente)", text: "Se si fondesse tutta, la calotta della Groenlandia alzerebbe il mare di circa 7,4 m. La soglia oltre cui la fusione diventa inarrestabile è stimata intorno a 1,5 °C (0,8–3 °C), ma servono da molti secoli a decine di migliaia di anni. Con 2–3 °C stabili gran parte della calotta sparisce in qualche millennio; con il riscaldamento più forte molto prima.", cat: "clima", lat: 72, lon: -40, certezza: "media",
 oggi: "Armstrong McKay et al. 2022, Science; programma europeo di monitoraggio PROMICE.",
 curiosita: "Sotto la calotta della Groenlandia i carotaggi di Camp Century hanno trovato resti di muschi e piante di circa 400 000 anni fa: allora una parte dell'isola era libera dai ghiacci.",
 fonti: ["Armstrong McKay et al. 2022", "Christ et al. 2023, Science"], wiki: "Groenlandia", wikiEn: "Greenland ice sheet"},

{t: -0.01, scen: "ott", title: "Fra 10 000 anni: mare più alto di 6–7 metri", text: "Anche limitando il riscaldamento a 1,5 °C, nei prossimi 10 000 anni il mare salirebbe di circa 6–7 m, come durante l'ultimo interglaciale (IPCC). Le coste di oggi saranno cambiate, ma lentamente, al ritmo di pochi centimetri per decennio.", cat: "clima", lat: null, lon: null, certezza: "media",
 oggi: "IPCC AR6 WGI, SPM B.5.4 e Clark et al. 2016.",
 curiosita: "Diecimila anni fa, alla fine dell'ultima glaciazione, il mare era 40–50 m più basso di oggi e l'Adriatico settentrionale era una grande pianura.",
 fonti: ["IPCC AR6 WGI SPM", "Clark et al. 2016, Nature Climate Change"], wiki: "Aumento del livello del mare", wikiEn: "Sea level rise"},

{t: -0.01, scen: "prob", title: "Fra 10 000 anni: mare più alto di 10–20 metri", text: "Con 2,5–3 °C il mare può salire di 10–20 m nei prossimi 10 000 anni. Con +15 m sarebbero sott'acqua gran parte del delta del Po, Venezia, Ravenna, la Pianura Padana orientale fino a Ferrara e Rovigo, e grandi città come Shanghai, Amsterdam e New Orleans.", cat: "clima", lat: 44.8, lon: 11.8, certezza: "bassa",
 oggi: "IPCC AR6 WGI, SPM B.5.4: 8–13 m in 10 000 anni con 2 °C, 28–37 m con 5 °C.",
 curiosita: "Ferrara è a circa 9 m sul livello del mare: in un futuro così, sarebbe una città costiera o un'isola.",
 fonti: ["IPCC AR6 WGI SPM", "Clark et al. 2016"], wiki: "Pianura Padana", wikiEn: "Po Valley"},

{t: -0.01, scen: "pess", title: "Fra 10 000 anni: mare più alto di 30–50 metri", text: "Con 5 °C o più il mare può salire di 28–37 m in 10 000 anni (IPCC) e, se si bruciassero tutti i combustibili fossili, di circa 50 m (Clark et al. 2016). Mezza Pianura Padana sarebbe un golfo dell'Adriatico, come durante il Pliocene. Fondendosi l'intera Antartide (non previsto in questo intervallo) il mare salirebbe di circa 58 m.", cat: "clima", lat: 45.0, lon: 10.5, certezza: "bassa",
 oggi: "IPCC AR6 WGI, SPM B.5.4.",
 curiosita: "Nel Pliocene, 3 milioni di anni fa, con circa 400 ppm di CO₂ come oggi, il mare entrava nella Pianura Padana: in Piemonte e in Emilia si trovano conchiglie marine fossili di quell'epoca, per esempio ad Asti.",
 fonti: ["IPCC AR6 WGI SPM", "Clark et al. 2016, Nature Climate Change"], wiki: "Pliocene", wikiEn: "Pliocene"},

{t: -0.01, scen: "tutti", title: "Evoluzione umana: continua", text: "Homo sapiens non ha smesso di evolvere. Negli ultimi 10 000 anni si sono diffusi la digestione del latte da adulti (persistenza della lattasi), l'adattamento all'alta quota dei tibetani (gene EPAS1, ereditato dai Denisoviani) e la milza più grande dei Bajau, «nomadi del mare» che si immergono in apnea. Nei prossimi 10 000 anni l'evoluzione continuerà, ma le migrazioni e gli incroci tra popolazioni rendono difficile che nascano differenze grandi.", cat: "umani", lat: 30, lon: 90, certezza: "media", taxon: "sapiens",
 oggi: "Convenzione di Oviedo sui diritti dell'uomo e la biomedicina (1997): vieta modifiche ereditarie del genoma umano. Dichiarazione UNESCO sul genoma umano (1997).",
 curiosita: "I denti del giudizio spesso non hanno spazio perché mangiamo cibi morbidi e la mandibola cresce meno: è soprattutto un effetto dell'ambiente, non una prova che stiano «sparendo» per evoluzione.",
 fonti: ["Huerta-Sánchez et al. 2014, Nature", "Ilardo et al. 2018, Cell", "Evershed et al. 2022, Nature"], wiki: "Intolleranza al lattosio", wikiEn: "Recent human evolution"},

{t: -0.01, scen: ["ott", "prob"], title: "Popolazioni umane nello spazio", text: "Se un giorno piccole popolazioni umane vivessero per molte generazioni su Marte o su stazioni spaziali, isolate dalla Terra, potrebbero evolvere in modo diverso: per la bassa gravità, le radiazioni e la deriva genetica, cioè i cambiamenti casuali tipici delle piccole popolazioni. È un'ipotesi: oggi nessun essere umano ha vissuto nello spazio più di 437 giorni di fila.", cat: "umani", lat: null, lon: null, certezza: "ipotesi",
 oggi: "Trattato sullo spazio extra-atmosferico (1967); ricerche mediche sugli astronauti della Stazione spaziale internazionale (NASA Twins Study, 2019).",
 curiosita: "Il record di permanenza nello spazio, 437 giorni, è del cosmonauta russo Valerij Poljakov, sulla stazione Mir (1994–1995).",
 fonti: ["Garrett-Bakelman et al. 2019, Science", "Solomon 2016, Future Humans"], wiki: "Valerij Vladimirovič Poljakov", wikiEn: "Valeri Polyakov"},

{t: -0.1, scen: "tutti", title: "Gli strati dell'Antropocene", text: "Fra 100 000 anni un geologo troverebbe nelle rocce un livello sottile e strano: plutonio dei test nucleari degli anni Cinquanta, microplastiche, cemento, alluminio, ossa di pollo a miliardi, pollini di piante coltivate e un cambiamento brusco nei fossili. Nel 2024 i geologi hanno respinto la proposta di un'epoca ufficiale «Antropocene», ma tutti riconoscono che l'impatto umano lascerà una traccia nelle rocce.", cat: "scienza", lat: 43.65, lon: -79.38, certezza: "alta",
 oggi: "Voto della Sottocommissione sulla stratigrafia del Quaternario (IUGS), marzo 2024; il lago Crawford, in Canada, era il sito proposto per il «chiodo d'oro».",
 curiosita: "I polli da allevamento sono così numerosi (circa 70 miliardi macellati all'anno) e così diversi dai loro antenati selvatici che alcuni ricercatori li considerano un «fossile guida» del nostro tempo (Bennett et al. 2018).",
 fonti: ["Bennett et al. 2018, Royal Society Open Science", "IUGS 2024"], wiki: "Antropocene", wikiEn: "Anthropocene"},

{t: -0.1, scen: "tutti", title: "Le scorie devono restare chiuse", text: "Il deposito di Onkalo e quelli simili sono progettati per isolare il combustibile nucleare esaurito per circa 100 000 anni: in questo tempo la radioattività scende a livelli vicini a quelli del minerale di uranio originale. Nel frattempo potrebbero passare una o più glaciazioni, con calotte di ghiaccio spesse chilometri sopra la Finlandia: anche per questo si scava nella roccia antica e stabile.", cat: "tecnologia", lat: 61.24, lon: 21.44, certezza: "media",
 oggi: "Convenzione congiunta sulla sicurezza della gestione del combustibile esaurito e dei rifiuti radioattivi (AIEA, 1997); in Italia la ricerca del sito per il deposito nazionale di superficie per i rifiuti a bassa e media attività è ancora in corso.",
 curiosita: "Il documentario «Into Eternity» (2010) è girato dentro Onkalo e chiede: come diremo a chi verrà di non scavare qui?",
 fonti: ["Posiva", "AIEA"], wiki: "Rifiuto radioattivo", wikiEn: "Deep geological repository"},

{t: -0.1, scen: "ott", title: "Torna l'era glaciale (fra circa 100 000 anni)", text: "Le glaciazioni dipendono da piccoli cambiamenti dell'orbita terrestre (cicli di Milanković) e dalla CO₂. Senza l'uomo la prossima sarebbe iniziata fra circa 50 000 anni; con le emissioni dello scenario ottimistico il calo di CO₂ è abbastanza lento da rinviarla di circa 50 000 anni. Le calotte tornano a crescere su Canada e Scandinavia, il mare scende e le Alpi si ricoprono di ghiacciai.", cat: "clima", lat: 60, lon: -80, big: true, certezza: "media",
 oggi: "Ganopolski, Winkelmann e Schellnhuber 2016 (Nature); Klemann e Ganopolski 2025: oltre 1 000 miliardi di tonnellate di carbonio emesse rinviano la glaciazione oltre 100 000 anni.",
 curiosita: "Durante l'ultima glaciazione il ghiacciaio del Ticino arrivava fino al Lago Maggiore e oltre, e le morene dei ghiacciai alpini formano oggi le colline attorno a Ivrea (Serra d'Ivrea) e al lago di Garda.",
 fonti: ["Ganopolski et al. 2016, Nature", "Talento e Ganopolski 2021, Earth System Dynamics"], wiki: "Cicli di Milanković", wikiEn: "Milankovitch cycles"},

{t: -0.3, scen: "prob", title: "Torna l'era glaciale (molto più tardi)", text: "Con le emissioni dello scenario probabile la CO₂ resta alta abbastanza a lungo da saltare una o più «occasioni» orbitali per una glaciazione. La prossima potrebbe iniziare tra circa 100 000 e 500 000 anni: la data è molto incerta e dipende dal totale di carbonio che bruceremo.", cat: "clima", lat: 60, lon: -80, certezza: "bassa",
 oggi: "Talento e Ganopolski 2021: già le emissioni passate influiscono sul clima per mezzo milione di anni e rendono molto improbabile una glaciazione nei prossimi 120 000 anni.",
 curiosita: "Negli ultimi 800 000 anni le glaciazioni si sono ripetute circa ogni 100 000 anni: noi viviamo in un interglaciale, l'Olocene, iniziato 11 700 anni fa.",
 fonti: ["Talento e Ganopolski 2021, Earth System Dynamics"], wiki: "Glaciazione", wikiEn: "Glacial period"},

{t: -0.6, scen: "pess", title: "Torna l'era glaciale (fra oltre mezzo milione di anni)", text: "Se bruciassimo 3 000 miliardi di tonnellate di carbonio o più (circa quattro volte quanto emesso finora, contando anche le foreste tagliate), i modelli prevedono un emisfero nord senza grandi calotte per circa mezzo milione di anni: la prossima glaciazione arriverebbe solo verso 600 000 anni da oggi. L'uomo avrebbe cambiato il ritmo del clima terrestre per un tempo più lungo dell'intera storia di Homo sapiens.", cat: "clima", lat: 60, lon: -80, certezza: "bassa",
 oggi: "Talento e Ganopolski 2021, Earth System Dynamics.",
 curiosita: "Homo sapiens esiste da circa 300 000 anni (Jebel Irhoud, Marocco): mezzo milione di anni senza glaciazioni sarebbe una cosa mai vista dalla nostra specie.",
 fonti: ["Talento e Ganopolski 2021"], wiki: "Glaciazione", wikiEn: "Glacial period"},

{t: -0.5, scen: ["prob", "pess"], title: "Nuove specie dopo le estinzioni", text: "Dopo ogni grande estinzione i sopravvissuti hanno occupato gli spazi vuoti e si sono diversificati: dopo la fine dei dinosauri nacquero in pochi milioni di anni balene, pipistrelli e primati. Con mezzo milione di anni nascono nuove specie soprattutto tra insetti, roditori, uccelli e pesci dei laghi, e sulle isole. Ma per tornare alla ricchezza di oggi servono milioni di anni: dopo le estinzioni di massa la ripresa ha richiesto circa 10 milioni di anni (Kirchner e Weil 2000).", cat: "natura", lat: null, lon: null, certezza: "ipotesi",
 oggi: "Quadro di Kunming-Montréal, obiettivo A per il 2050: fermare le estinzioni causate dall'uomo e moltiplicare per dieci la velocità di recupero.",
 curiosita: "Nel lago Vittoria, in Africa, sono nate centinaia di specie di pesci ciclidi in meno di 15 000 anni: l'evoluzione può essere velocissima.",
 fonti: ["Kirchner e Weil 2000, Nature", "Seehausen 2006"], wiki: "Radiazione adattativa", wikiEn: "Adaptive radiation"},

{t: -1, scen: "tutti", title: "Un milione di anni: Homo sapiens c'è ancora?", text: "Una specie di mammifero dura in media circa 1–2 milioni di anni; Homo erectus è vissuto per quasi 2 milioni di anni. Homo sapiens esiste da circa 300 000 anni. Fra un milione di anni potremmo esserci ancora, essere cambiati tanto da sembrare (tra virgolette) un «altro Homo», o essere spariti. A differenza delle altre specie, però, noi possiamo capire i rischi e decidere come agire.", cat: "umani", lat: 31.86, lon: -8.87, big: true, certezza: "ipotesi", taxon: "sapiens",
 oggi: "Costituzione italiana, art. 9 (modificato nel 2022): la Repubblica tutela l'ambiente, la biodiversità e gli ecosistemi, «anche nell'interesse delle future generazioni».",
 curiosita: "Nel 1993 l'astrofisico J. Richard Gott usò il «principio copernicano» (non viviamo in un momento speciale) per stimare, con il 95% di fiducia, che l'umanità durerà ancora tra 5 100 e 7,8 milioni di anni. È un ragionamento curioso e molto discusso, non una previsione scientifica.",
 fonti: ["Gott 1993, Nature", "Hublin et al. 2017, Nature", "Barnosky et al. 2011"], wiki: "Homo sapiens", wikiEn: "Human extinction"},

{t: -1, scen: "pess", title: "Dopo di noi", text: "Se l'umanità sparisse, la natura si riprenderebbe: lo mostrano la zona di Černobyl', dove lupi, alci e cavalli di Przewalski vivono senza persone, e la Zona demilitarizzata coreana. In milioni di anni nuove specie riempirebbero il pianeta; delle nostre città resterebbero strati di rocce, i fondali di cemento dei porti e qualche oggetto sulla Luna.", cat: "natura", lat: 51.39, lon: 30.1, certezza: "ipotesi",
 oggi: "Riserva della biosfera radiologica ed ecologica di Černobyl' (Ucraina, 2016).",
 curiosita: "Sulla Luna restano, tra le altre cose, sei bandiere americane, le impronte degli astronauti e le orme dei rover: senza vento né pioggia, potrebbero durare milioni di anni, consumate solo dai micrometeoriti.",
 fonti: ["Deryabina et al. 2015, Current Biology"], wiki: "Zona di alienazione", wikiEn: "Chernobyl exclusion zone"}
],

// =====================================================================
// ORGANISMI DEL FUTURO (ipotetici o in arrivo) — base = antenato reale per OneZoom/GBIF
// =====================================================================
species: [
{id: "fut-sapiens-terra", name: "ipotetica: Homo sapiens del futuro (sulla Terra)", common: "Umani del futuro", base: "Homo sapiens", group: "umani", from: 0, to: -1, iucn: null, ipotesi: true, scen: ["ott", "prob", "pess"],
 places: [[0, 20, "tutto il mondo"]],
 text: "Fra decine o centinaia di migliaia di anni gli esseri umani continueranno a evolvere: per le malattie, l'alimentazione, il clima e, forse, per le biotecnologie. Ma finché le popolazioni restano collegate da migrazioni e matrimoni, i geni si rimescolano e difficilmente nascerà una nuova specie. È un'ipotesi basata su ciò che sappiamo dell'evoluzione recente.",
 curiosita: "Uno studio del 2020 ha notato che l'arteria mediana dell'avambraccio, che di solito scompare prima della nascita, resta in un adulto su tre, contro uno su dieci un secolo fa: un possibile piccolo esempio di evoluzione in corso (dato discusso).",
 fonti: ["Lucas et al. 2020, Journal of Anatomy", "Hawks et al. 2007, PNAS"], wiki: "Evoluzione umana", wikiEn: "Recent human evolution"},

{id: "fut-homo-spazio", name: "ipotetica: «Homo» delle colonie spaziali", common: "«Altro Homo» nello spazio (ipotesi)", base: "Homo sapiens", group: "umani", from: -0.1, to: -1, iucn: null, ipotesi: true, scen: ["ott"],
 places: [[0, 0, "fuori dalla Terra (Marte, stazioni spaziali)"]],
 text: "Una popolazione rimasta isolata per centinaia di migliaia di anni su un altro pianeta potrebbe diventare, tra virgolette, un «altro Homo»: lo stesso è successo ai Neanderthal e ai Denisoviani, separati per centinaia di migliaia di anni dai nostri antenati. Bassa gravità, radiazioni e piccole popolazioni guiderebbero il cambiamento. È fantascienza ragionata, non una previsione.",
 curiosita: "Homo floresiensis, l'«hobbit» dell'isola di Flores, è diventato alto circa un metro vivendo isolato su un'isola: l'isolamento cambia anche gli esseri umani.",
 fonti: ["Solomon 2016, Future Humans", "Brown et al. 2004, Nature"], wiki: "Colonizzazione dello spazio", wikiEn: "Space colonization"},

{id: "fut-pizzly", name: "ibrido orso polare × grizzly («pizzly»)", common: "Pizzly (ibridi artici)", base: "Ursus maritimus", group: "mammiferi", from: 0.00002, to: -0.0005, iucn: null, ipotesi: true, scen: ["prob", "pess"],
 places: [[71.5, -117.0, "Isola di Banks e Isola Victoria (Canada)"]],
 text: "Ibridi veri: il primo fu ucciso da un cacciatore nel 2006 nell'Artico canadese. Con il ghiaccio che si scioglie, gli orsi polari passano più tempo a terra e i grizzly salgono verso nord: gli incontri aumentano. L'ipotesi è che gli ibridi diventino più comuni, ma finora sono rari e quasi tutti figli di pochi individui.",
 curiosita: "Anche narvalo e beluga si sono incrociati: nel 2019 il DNA di un cranio trovato in Groenlandia ha confermato il «narluga».",
 fonti: ["Pongracz et al. 2017, Arctic", "Skovrind et al. 2019, Scientific Reports"], wiki: "Orso grolare", wikiEn: "Grizzly–polar bear hybrid"},

{id: "fut-anolis-urbano", name: "ipotetica: lucertole urbane", common: "Anolidi di città", base: "Anolis cristatellus", group: "rettili", from: 0, to: -0.01, iucn: null, ipotesi: true, scen: ["ott", "prob", "pess"],
 places: [[18.4, -66.1, "San Juan (Porto Rico)"]],
 text: "A Porto Rico gli anolidi delle città hanno zampe più lunghe e più lamelle adesive sulle dita di quelli dei boschi: si arrampicano meglio su muri e pali lisci, e la differenza è ereditaria (Winchell et al. 2016). Le città sono «laboratori» di evoluzione rapida: nei prossimi secoli le specie urbane potrebbero diventare sempre più diverse da quelle di campagna.",
 curiosita: "Dopo gli uragani del 2017 sono sopravvissuti soprattutto gli anolidi con le dita più grandi, che si aggrappano meglio ai rami: selezione naturale in diretta (Donihue et al. 2018).",
 fonti: ["Winchell et al. 2016, Evolution", "Donihue et al. 2018, Nature"], wiki: "Anolis", wikiEn: "Anolis cristatellus"},

{id: "fut-trifoglio-urbano", name: "ipotetica: trifogli di città", common: "Trifoglio bianco urbano", base: "Trifolium repens", group: "piante", from: 0, to: -0.01, iucn: null, ipotesi: true, scen: ["ott", "prob", "pess"],
 places: [[43.65, -79.38, "Toronto"], [45.46, 9.19, "Milano"]],
 text: "Uno studio su 160 città di 26 paesi (Santangelo et al. 2022) ha mostrato che il trifoglio bianco in città produce meno cianuro, una difesa contro gli erbivori, rispetto a quello di campagna. È uno dei primi esempi di evoluzione parallela in città di tutto il mondo. In futuro le piante urbane potrebbero adattarsi a caldo, inquinamento e terreni asfaltati.",
 curiosita: "Nello studio, chiamato GLUE, i campioni sono stati raccolti da 287 scienziati, anche in Italia.",
 fonti: ["Santangelo et al. 2022, Science"], wiki: "Trifolium repens", wikiEn: "Trifolium repens"},

{id: "fut-piccione", name: "ipotetica: piccioni urbani più scuri", common: "Piccioni di città", base: "Columba livia", group: "uccelli", from: 0, to: -0.01, iucn: null, ipotesi: true, scen: ["prob", "pess"],
 places: [[48.86, 2.35, "Parigi"], [41.9, 12.48, "Roma"]],
 text: "I piccioni di città con piume più scure sembrano trattenere nelle penne più zinco e piombo, eliminandoli dal corpo (Chatelain et al. 2014). Se l'inquinamento urbano resta alto, i colori scuri potrebbero diffondersi. È lo stesso meccanismo della falena delle betulle (Biston betularia), diventata nera nell'Inghilterra industriale e poi tornata chiara con l'aria pulita.",
 curiosita: "La forma nera della falena delle betulle è nata da un «gene saltatore» entrato nel suo DNA intorno al 1819, all'inizio della rivoluzione industriale (van't Hof et al. 2016).",
 fonti: ["Chatelain et al. 2014, Biology Letters", "van't Hof et al. 2016, Nature"], wiki: "Columba livia", wikiEn: "Rock dove"},

{id: "fut-ratto", name: "ipotetica: ratti del futuro", common: "Ratti vincenti", base: "Rattus norvegicus", group: "mammiferi", from: 0, to: -1, iucn: null, ipotesi: true, scen: ["prob", "pess"],
 places: [[40.71, -74.0, "New York"], [51.5, -0.12, "Londra"], [41.9, 12.5, "Roma"]],
 text: "I ratti vivono ovunque ci siano esseri umani e si riproducono in fretta: sono tra le specie che vincono nell'Antropocene. Uno studio del 2025 su 16 città ha trovato più segnalazioni di ratti in 11 di esse, soprattutto dove fa più caldo. Il geologo Jan Zalasiewicz ha ipotizzato che, in milioni di anni, i discendenti dei ratti potrebbero diversificarsi in molte nuove specie, grandi e piccole, come fecero i mammiferi dopo i dinosauri.",
 curiosita: "Sulle isole i roditori tendono a diventare giganti: sull'isola di Flores vive un ratto, Papagomys armandvillei, lungo con la coda circa 80 cm.",
 fonti: ["Richardson et al. 2025, Science Advances", "Zalasiewicz 2008, The Earth After Us"], wiki: "Rattus norvegicus", wikiEn: "Brown rat"},

{id: "fut-medusa", name: "ipotetica: mari di meduse", common: "Meduse vincenti", base: "Aurelia aurita", group: "invertebrati", from: 0, to: -0.001, iucn: null, ipotesi: true, scen: ["pess"],
 places: [[43.5, 15.0, "Adriatico"], [34.0, 129.0, "Mare del Giappone"]],
 text: "In alcuni mari le meduse sembrano aumentare grazie alla pesca eccessiva (meno concorrenti), all'acqua più calda e alle zone povere di ossigeno. Ma i dati sono scarsi: uno studio internazionale del 2013 (Condon et al.) non ha trovato una prova chiara di un aumento mondiale. L'ipotesi di un «oceano delle meduse» resta discussa.",
 curiosita: "Nel 2009 la medusa gigante di Nomura, larga fino a 2 m, ha fatto rovesciare un peschereccio giapponese di 10 tonnellate che ne aveva troppe nella rete.",
 fonti: ["Condon et al. 2013, PNAS", "Richardson et al. 2009, Trends in Ecology & Evolution"], wiki: "Aurelia aurita", wikiEn: "Jellyfish bloom"},

{id: "fut-corallo-resistente", name: "ipotetica: coralli resistenti al caldo (evoluzione assistita)", common: "«Supercoralli»", base: "Acropora tenuis", group: "invertebrati", from: -0.000004, to: -0.01, iucn: null, ipotesi: true, scen: ["ott", "prob"],
 places: [[-18.3, 147.7, "Grande barriera corallina"], [29.5, 34.95, "Golfo di Aqaba (Mar Rosso)"]],
 text: "Coralli ottenuti incrociando colonie che hanno resistito agli sbiancamenti e associandoli ad alghe simbionti più resistenti. Nello scenario ottimistico popolano rifugi da cui le barriere ripartono dopo il picco del caldo; in quello probabile servono soprattutto a salvare alcune specie. Non funzionano se il riscaldamento continua senza fermarsi.",
 curiosita: "Molti coralli si riproducono tutti insieme in poche notti all'anno, dopo una luna piena: gli scienziati raccolgono le uova in quelle notti per fare i loro incroci.",
 fonti: ["van Oppen et al. 2015, PNAS", "AIMS"], wiki: "Acropora", wikiEn: "Assisted evolution"},

{id: "fut-mammut-proxy", name: "elefante asiatico «mammutizzato» (proxy, annunciato)", common: "«Mammut» di Colossal", base: "Elephas maximus", group: "mammiferi", from: -0.000006, to: -0.0005, iucn: null, ipotesi: true, scen: ["ott", "prob"],
 places: [[68.5, 161.4, "Pleistocene Park (Siberia, proposto)"]],
 text: "Un elefante asiatico con decine o centinaia di geni modificati per avere pelo lungo, grasso e orecchie piccole. Colossal Biosciences sostiene che potrebbe aiutare a mantenere la tundra-steppa e il permafrost, ma molti ecologi dubitano: servirebbero migliaia di animali e l'elefante asiatico è già «In pericolo». La data (prima 2028, ora primi anni 2030) è un annuncio dell'azienda, non un risultato.",
 curiosita: "Il Pleistocene Park, in Siberia, è un esperimento di Sergey e Nikita Zimov: con cavalli, bisonti e buoi muschiati cercano di ricreare la steppa dei mammut.",
 fonti: ["Colossal Biosciences", "IUCN SSC 2016, Guiding principles on creating proxies of extinct species"], wiki: "Mammuthus primigenius", wikiEn: "De-extinction"},

{id: "fut-metalupo-proxy", name: "lupo grigio con geni di metalupo (2025)", common: "«Metalupi» di Colossal", base: "Canis lupus", group: "mammiferi", from: 0.000001, to: -0.0001, iucn: null, ipotesi: true, scen: ["ott", "prob"],
 places: [[32.78, -96.8, "Stati Uniti (luogo segreto)"]],
 text: "Il 7 aprile 2025 Colossal ha presentato Romolo, Remo e Khaleesi: lupi grigi con 20 modifiche in 14 geni scelti confrontandoli con il DNA del metalupo (Aenocyon dirus), estinto circa 13 000 anni fa. Il gruppo di specialisti dei canidi dell'IUCN ha dichiarato che non sono metalupi né loro sostituti e che il progetto non aiuta la conservazione.",
 curiosita: "Il metalupo e il lupo grigio non sono parenti stretti: le loro linee si sono separate circa 5–6 milioni di anni fa (Perri et al. 2021).",
 fonti: ["IUCN SSC Canid Specialist Group 2025", "Perri et al. 2021, Nature"], wiki: "Aenocyon dirus", wikiEn: "Dire wolf"},

{id: "fut-elefante-senza-zanne", name: "elefanti senza zanne", common: "Elefanti senza zanne", base: "Loxodonta africana", group: "mammiferi", from: 0.00005, to: -0.0002, iucn: null, ipotesi: true, scen: ["prob", "pess"],
 places: [[-18.96, 34.35, "Parco nazionale di Gorongosa (Mozambico)"]],
 text: "Fatto reale: durante la guerra civile del Mozambico (1977–1992) i bracconieri uccisero soprattutto elefanti con le zanne per l'avorio. Le femmine senza zanne, più rare, sopravvissero, e la loro proporzione è salita da circa il 18% a circa la metà (Campbell-Staton et al. 2021). L'ipotesi: se il bracconaggio continua, l'uomo può cambiare l'aspetto di una specie in pochi decenni.",
 curiosita: "Il carattere «senza zanne» è legato al cromosoma X ed è letale per i maschi: per questo gli elefanti senza zanne sono quasi tutti femmine.",
 fonti: ["Campbell-Staton et al. 2021, Science"], wiki: "Loxodonta africana", wikiEn: "African bush elephant"},

{id: "fut-merluzzo", name: "ipotetica: pesci più piccoli", common: "Merluzzi «rimpiccioliti»", base: "Gadus morhua", group: "pesci", from: 0, to: -0.001, iucn: null, ipotesi: true, scen: ["prob", "pess"],
 places: [[47.5, -52.0, "Terranova (Canada)"], [70, 20, "Mare di Barents"]],
 text: "La pesca prende i pesci più grandi: così si avvantaggiano quelli che maturano prima e restano piccoli. Nei merluzzi del Nord Atlantico l'età della maturità è scesa molto nel Novecento, in parte per evoluzione. Con il mare più caldo e meno ossigeno, i pesci potrebbero diventare in media ancora più piccoli.",
 curiosita: "Il crollo del merluzzo di Terranova nel 1992 fece perdere il lavoro a circa 35 000 persone: la pesca fu chiusa e, più di trent'anni dopo, la popolazione non si è ancora ripresa del tutto.",
 fonti: ["Olsen et al. 2004, Nature", "Cheung et al. 2013, Nature Climate Change"], wiki: "Gadus morhua", wikiEn: "Fisheries-induced evolution"},

{id: "fut-rondine", name: "ipotetica: uccelli con ali più corte", common: "Rondini delle scogliere «da autostrada»", base: "Petrochelidon pyrrhonota", group: "uccelli", from: 0.00004, to: -0.001, iucn: null, ipotesi: true, scen: ["ott", "prob", "pess"],
 places: [[41.2, -101.7, "Nebraska (Stati Uniti)"]],
 text: "Le rondini americane che nidificano sotto i ponti stradali del Nebraska, in 30 anni, hanno sviluppato ali più corte e muoiono molto meno investite: con ali corte si decolla e si gira più in fretta (Brown e Brown 2013). Strade, luci e rumori stanno già selezionando gli animali.",
 curiosita: "In alcune città gli uccelli cantano più acuto o di notte, per farsi sentire sopra il rumore del traffico.",
 fonti: ["Brown e Brown 2013, Current Biology"], wiki: null, wikiEn: "Cliff swallow"},

{id: "fut-zanzara-urbana", name: "ipotetica: zanzare delle città calde", common: "Zanzare urbane", base: "Culex pipiens", group: "invertebrati", from: 0, to: -0.001, iucn: null, ipotesi: true, scen: ["prob", "pess"],
 places: [[51.5, -0.12, "Londra"], [45.07, 7.69, "Torino"]],
 text: "La forma «molestus» della zanzara comune punge l'uomo, si riproduce senza pasto di sangue e vive in cantine e metropolitane. Gli incroci con la forma che punge gli uccelli favoriscono la trasmissione del virus West Nile. Con città più calde queste zanzare potrebbero restare attive quasi tutto l'anno.",
 curiosita: "Per decenni si è raccontato che la zanzara si fosse evoluta nei tunnel della metropolitana di Londra in poco più di cent'anni; nel 2025 il DNA ha smentito la storia: è molto più antica.",
 fonti: ["Haba et al. 2025, Science", "Byrne e Nichols 1999, Heredity"], wiki: "Culex pipiens", wikiEn: "Culex pipiens molestus"},

{id: "fut-pesce-scorpione", name: "pesce scorpione nel Mediterraneo", common: "Pesce scorpione (invasore)", base: "Pterois miles", group: "pesci", from: 0.00001, to: -0.001, iucn: null, ipotesi: true, scen: ["prob", "pess"],
 places: [[36.7, 15.1, "Sicilia sud-orientale"], [34.7, 33.0, "Cipro"]],
 text: "Arrivato dal Mar Rosso attraverso il canale di Suez, il pesce scorpione si è diffuso in pochi anni nel Mediterraneo orientale e ha raggiunto le coste italiane. Mangia moltissimi piccoli pesci e non ha predatori abituali. Con il mare più caldo potrebbe colonizzare gran parte del Mediterraneo. In alcune zone si promuove la pesca e la vendita della sua carne, ottima.",
 curiosita: "Ha spine velenose, ma la carne è commestibile: a Cipro e in Grecia ci sono gare di pesca subacquea per catturarlo.",
 fonti: ["Azzurro et al. 2017", "ISPRA"], wiki: "Pterois miles", wikiEn: "Pterois miles"},

{id: "fut-halophila", name: "ipotetica: praterie tropicali al posto della posidonia", common: "Alofila (pianta marina invasiva)", base: "Halophila stipulacea", group: "piante", from: 0, to: -0.001, iucn: null, ipotesi: true, scen: ["pess"],
 places: [[37.7, 12.5, "Sicilia occidentale"], [32.8, 35.0, "Israele"]],
 text: "Halophila stipulacea è una piccola pianta marina del Mar Rosso, entrata nel Mediterraneo dopo l'apertura del canale di Suez (1869). Sopporta acque calde meglio della posidonia. Se la posidonia regredisse per il caldo, alcuni studi ipotizzano che piante come questa ne occupino in parte lo spazio, ma senza i suoi enormi depositi di carbonio e senza la stessa ricchezza di vita.",
 curiosita: "Le «matte» di posidonia, gli intrecci di radici e sedimento sotto le praterie, possono avere migliaia di anni e conservano carbonio da tutto quel tempo.",
 fonti: ["Chefaoui et al. 2018, Global Change Biology", "Winters et al. 2020, Frontiers in Marine Science"], wiki: "Halophila stipulacea", wikiEn: "Halophila stipulacea"},

{id: "fut-cervo-nano", name: "ipotetica: cervi nani delle isole", common: "Nani delle isole del futuro", base: "Cervus elaphus", group: "mammiferi", from: -0.2, to: -1, iucn: null, ipotesi: true, scen: ["prob", "pess"],
 places: [[40.1, 9.1, "Sardegna"], [42.15, 9.1, "Corsica"]],
 text: "Sulle isole i grandi mammiferi tendono a rimpicciolire (nanismo insulare) e i piccoli a ingrandirsi: nel Mediterraneo vivevano elefanti nani a Cipro, Creta, Sicilia e Malta, e la capra Myotragus alle Baleari. In centinaia di migliaia di anni, senza grandi predatori, cervi e cinghiali delle isole potrebbero diventare forme nane. Il cervo sardo è già più piccolo del cervo europeo.",
 curiosita: "L'elefante nano di Tilo, in Grecia, alto circa un metro, è forse sopravvissuto fino a circa 4 000 anni fa (datazione discussa), quando a Creta si costruivano già i palazzi minoici.",
 fonti: ["Lomolino 2005, Journal of Biogeography", "van der Geer et al. 2010, Evolution of Island Mammals"], wiki: "Nanismo insulare", wikiEn: "Insular dwarfism"}
],

// =====================================================================
// DESTINO DELLE SPECIE DI OGGI — chiave = id di SAP.species; [t_fine o null (sopravvive), testo]
// t_fine = momento stimato di estinzione funzionale o reale nello scenario (stime indicative basate sugli studi citati)
// =====================================================================
fate: {
 "orso-polare": {ott: [null, "Sopravvive: con circa 1,5–1,8 °C il ghiaccio estivo artico resiste in molte zone (Molnár et al. 2020)."], prob: [-0.000174, "Scompare da gran parte dell'Artico entro il 2100; resistono poche popolazioni dell'alto Artico canadese, poi a rischio."], pess: [-0.000094, "Quasi tutte le popolazioni smettono di riprodursi entro il 2100; sopravvivono forse solo nelle isole della Regina Elisabetta, fino a circa il 2120."]},
 "pinguino-imperatore": {ott: [null, "Diminuisce ma sopravvive nelle colonie più a sud del Mare di Ross e del Mare di Weddell (Jenouvrier et al. 2021)."], prob: [null, "Si dimezza entro gli anni 2080 (IUCN 2026, «In pericolo»); oltre il 2100 resta solo in poche colonie."], pess: [-0.000074, "Con le politiche attuali o peggio il 98% delle colonie è «quasi estinto» entro il 2100 (Jenouvrier et al. 2021)."]},
 "corallo-corno-alce": {ott: [null, "Sopravvive in rifugi e grazie alla riproduzione assistita in Florida e ai Caraibi."], prob: [-0.000034, "Estinzione funzionale in natura verso il 2060: sopravvive soprattutto in vivai e banche di gameti congelati."], pess: [-0.000014, "Le ondate di calore marine (come quella del 2023 in Florida) lo fanno sparire dalle barriere già negli anni 2040."]},
 "corallo-corno-cervo": {ott: [null, "Sopravvive in rifugi e vivai di corallo."], prob: [-0.000034, "Estinzione funzionale in natura verso il 2060."], pess: [-0.000014, "Scompare dalle barriere negli anni 2040."]},
 "pesce-pagliaccio": {ott: [null, "Sopravvive, ma le anemoni sbiancano anche loro: popolazioni ridotte."], prob: [null, "Sopravvive in poche barriere e in acquacoltura; molto ridotto in natura."], pess: [-0.000124, "Senza barriere e anemoni sane, a rischio di estinzione in natura dopo il 2100."]},
 "posidonia": {ott: [null, "Arretra nel Mediterraneo orientale ma resiste, aiutata da boe al posto delle ancore e acque più pulite."], prob: [null, "Perde gran parte delle praterie più basse e calde; resiste nel Mediterraneo nord-occidentale."], pess: [-0.000074, "Rischio di estinzione funzionale entro il 2100 con il riscaldamento più forte (Chefaoui et al. 2018)."]},
 "pinna-nobilis": {ott: [null, "Sopravvive grazie a pochi individui resistenti al parassita Haplosporidium e alla riproduzione in laboratorio."], prob: [-0.000024, "Già «In pericolo critico» dal 2019: senza rimedi si estingue in natura verso il 2050."], pess: [-0.000014, "Le ultime popolazioni nelle lagune scompaiono entro il 2040."]},
 "corallo-rosso": {ott: [null, "Sopravvive soprattutto in profondità, dove l'acqua resta fresca."], prob: [null, "Le colonie più superficiali muoiono nelle ondate di calore; sopravvive sotto i 40–50 m."], pess: [-0.000274, "Ondate di calore sempre più profonde e acidificazione lo riducono a pochi rifugi profondi entro il 2300."]},
 "foca-monaca": {ott: [null, "Continua a crescere, come negli ultimi anni (IUCN «Vulnerabile» dal 2023), e torna a partorire anche in Italia."], prob: [null, "Sopravvive, ma il mare che sale e le spiagge occupate riducono le grotte adatte ai piccoli."], pess: [-0.000124, "Grotte allagate, pesca in crisi e Mediterraneo troppo caldo la riportano verso l'estinzione dopo il 2100."]},
 "caretta-caretta": {ott: [null, "Sopravvive e nidifica sempre più a nord, anche sulle coste italiane."], prob: [null, "Sopravvive spostandosi a nord; ma le sabbie troppo calde producono quasi solo femmine."], pess: [null, "Sopravvive ma con forte squilibrio tra i sessi: sopra circa 29 °C nella sabbia nascono soprattutto femmine e sopra 33 °C le uova muoiono."]},
 "tartaruga-liuto": {ott: [null, "Le popolazioni atlantiche resistono; quelle del Pacifico, già crollate, vengono salvate a fatica."], prob: [-0.000074, "La popolazione del Pacifico orientale scompare entro il 2100 se continuano reti e palangari."], pess: [-0.000074, "Spiagge di deposizione sommerse e sabbie troppo calde: le popolazioni del Pacifico spariscono entro il 2100."]},
 "stambecco": {ott: [null, "Sopravvive salendo di quota e pascolando di notte."], prob: [null, "Sopravvive ma con meno piccoli: l'erba di alta quota cresce prima e i capretti nascono «in ritardo» (Pettorelli et al. 2007)."], pess: [null, "Sopravvive nei massicci più alti, con popolazioni ridotte e più isolate."]},
 "pernice-bianca": {ott: [null, "Sopravvive sulle Alpi più alte."], prob: [null, "Perde gran parte del suo habitat alpino (fino a due terzi secondo alcuni modelli); resta sopra i 2 500 m."], pess: [-0.000174, "Sulle Alpi resta solo su poche cime isolate e rischia di sparire dalle Alpi italiane dopo il 2100; sopravvive nell'Artico."]},
 "farfalla-apollo": {ott: [null, "Sopravvive in quota e grazie al ripristino dei prati."], prob: [null, "Scompare dalle zone più basse (già successo in parte della Germania e della Scandinavia meridionale), resta in montagna."], pess: [-0.000174, "Rischia di scomparire da quasi tutta l'Europa meridionale."]},
 "salamandra-lanza": {ott: [null, "Sopravvive nelle valli del Monviso e del Pellice."], prob: [null, "Areale ridotto: vive solo in poche valli delle Alpi Cozie e non può salire più in alto."], pess: [-0.000174, "Estati secche e calde la riducono a poche popolazioni isolate: possibile estinzione dopo il 2100."]},
 "gipeto": {ott: [null, "Continua il ritorno sulle Alpi iniziato con le reintroduzioni del 1986."], prob: [null, "Sopravvive: si nutre di ossa di animali morti, che non mancano."], pess: [null, "Sopravvive, se non ritornano veleni e munizioni al piombo."]},
 "abete-nebrodi": {ott: [null, "Sopravvive: le piantine coltivate vengono messe a dimora sulle Madonie."], prob: [null, "Sopravvive soprattutto in vivai, orti botanici e banche dei semi; in natura restano poche decine di alberi."], pess: [-0.000124, "Siccità e incendi possono uccidere gli ultimi 30 alberi selvatici; sopravvive solo in coltivazione."]},
 "orso-marsicano": {ott: [null, "Supera i 100 individui ed esce dal Parco d'Abruzzo verso altri Appennini."], prob: [null, "Resta intorno a 50–70 animali: il pericolo maggiore sono auto, veleni e piccole dimensioni della popolazione."], pess: [-0.000124, "Una popolazione così piccola rischia l'estinzione per malattie, incendi o pochi anni sfortunati."]},
 "lupo": {ott: [null, "Sopravvive ovunque: specie adattabile."], prob: [null, "Sopravvive ovunque: specie adattabile."], pess: [null, "Sopravvive: tra i vincitori, se non torna la persecuzione."]},
 "tonno-rosso": {ott: [null, "Popolazione sana grazie alle quote di pesca (ICCAT)."], prob: [null, "Sopravvive, ma si sposta verso nord, fino al Mare del Nord e alla Norvegia, dove sta già tornando."], pess: [null, "Sopravvive, ma con aree di deposizione mediterranee troppo calde in estate."]},
 "anguilla-europea": {ott: [null, "Si riprende con il divieto di pesca delle ceche e la rimozione delle dighe inutili."], prob: [null, "Rimane «In pericolo critico»: le correnti atlantiche più deboli portano meno larve verso l'Europa."], pess: [-0.000124, "Con l'AMOC molto indebolita la sua migrazione dal Mar dei Sargassi potrebbe fallire."]},
 "koala": {ott: [null, "Sopravvive grazie alla protezione delle foreste di eucalipto."], prob: [-0.000024, "Nel Nuovo Galles del Sud il governo stimava l'estinzione locale entro il 2050 senza interventi (inchiesta parlamentare 2020); sopravvive altrove."], pess: [null, "Scompare da gran parte dell'Australia orientale per caldo, siccità e incendi; resiste nel sud e nelle isole."]},
 "orango-borneo": {ott: [null, "Sopravvive grazie a moratorie sulla deforestazione e olio di palma certificato."], prob: [null, "Continua a diminuire (oltre 100 000 persi tra 1999 e 2015); sopravvive nei parchi."], pess: [-0.000074, "Con foreste tagliate e incendi, entro il 2100 restano solo poche popolazioni isolate."]},
 "orango-tapanuli": {ott: [null, "Sopravvive se la diga di Batang Toru e le strade non dividono la foresta."], prob: [-0.000074, "Con meno di 800 individui in una sola foresta, rischia l'estinzione entro il secolo."], pess: [-0.000034, "La grande scimmia più rara del mondo scompare verso il 2060."]},
 "vaquita": {ott: [null, "Se le reti da posta spariscono dal Golfo di California, i circa 10 superstiti possono ancora riprodursi."], prob: [-0.000009, "Senza controllo della pesca illegale del totoaba, si estingue entro il 2035."], pess: [-0.000004, "Si estingue entro il 2030, come il baiji cinese nel 2006."]},
 "balena-franca-nordatlantica": {ott: [null, "Sopravvive grazie a limiti di velocità per le navi e corde senza nodi o senza funi («ropeless»)."], prob: [-0.000124, "Circa 380 individui: con collisioni e reti continua a calare, estinzione funzionale dopo il 2100."], pess: [-0.000054, "Il cibo (copepodi) si sposta per il mare più caldo e le balene incontrano più navi: estinzione verso il 2080."]},
 "farfalla-monarca": {ott: [null, "La migrazione dal Canada al Messico continua grazie all'asclepiade piantata lungo le rotte."], prob: [null, "La migrazione si riduce; la specie sopravvive con popolazioni non migratrici."], pess: [-0.000074, "La grande migrazione nordamericana crolla: secondo alcuni modelli quasi scomparsa entro il 2100."]},
 "bombo-macchia-ruggine": {ott: [null, "Sopravvive grazie alla protezione negli USA (dal 2017) e alla riduzione dei pesticidi."], prob: [null, "Sopravvive in pochi luoghi del Midwest."], pess: [-0.000074, "Caldo e pesticidi lo fanno sparire entro il 2100."]},
 "krill-antartico": {ott: [null, "Resta abbondante."], prob: [null, "Si sposta verso sud e diminuisce intorno alla Penisola antartica."], pess: [null, "Sopravvive ma molto ridotto nel Mare di Scozia: un problema per balene, foche e pinguini."]},
 "tricheco": {ott: [null, "Sopravvive."], prob: [null, "Senza ghiaccio d'estate si ammassa sulle spiagge, dove i piccoli muoiono schiacciati nelle fughe."], pess: [null, "Sopravvive molto ridotto nell'alto Artico."]},
 "narvalo": {ott: [null, "Sopravvive."], prob: [null, "Sopravvive, ma il ghiaccio meno spesso fa arrivare più navi e orche, suoi predatori."], pess: [null, "Sopravvive in poche zone dell'Artico canadese e groenlandese."]},
 "foca-cappuccio": {ott: [null, "Sopravvive."], prob: [null, "Continua a calare: dal 2025 è «In pericolo»."], pess: [-0.000174, "Senza banchisa per partorire nell'Atlantico nord-occidentale, rischia l'estinzione dopo il 2100."]},
 "rinoceronte-giava": {ott: [null, "Sopravvive e si crea una seconda popolazione fuori da Ujung Kulon."], prob: [-0.000074, "Con circa 50 animali in un solo parco, un vulcano (il Krakatoa è vicino), uno tsunami o il bracconaggio possono eliminarlo."], pess: [-0.000024, "Si estingue verso il 2050."]},
 "rinoceronte-sumatra": {ott: [null, "Sopravvive grazie all'allevamento in cattività e alla fecondazione assistita."], prob: [-0.000034, "Meno di 50 animali, sparsi: estinzione probabile verso il 2060."], pess: [-0.000014, "Si estingue entro il 2040."]},
 "elefante-foresta": {ott: [null, "Sopravvive grazie ai parchi dell'Africa centrale."], prob: [null, "Sopravvive ma diminuisce per bracconaggio e strade nelle foreste."], pess: [-0.000174, "Molto ridotto; a rischio di estinzione dopo il 2100."]},
 "tigre": {ott: [null, "Continua a crescere come in India e Nepal."], prob: [null, "Sopravvive; le Sundarbans però vengono in parte sommerse dal mare."], pess: [null, "Sopravvive in India e Russia; le tigri delle Sundarbans perdono gran parte della foresta di mangrovie."]},
 "leopardo-nevi": {ott: [null, "Sopravvive."], prob: [null, "Perde fino a un terzo del suo habitat sull'Himalaya per la salita della foresta."], pess: [null, "Sopravvive in un'area molto ridotta."]},
 "sequoia-gigante": {ott: [null, "Sopravvive."], prob: [null, "Sopravvive, ma i megaincendi del 2020–2021 ne hanno ucciso il 13–19% dei grandi alberi in due anni."], pess: [null, "Sopravvive in pochi boschi protetti e in coltivazione in tutto il mondo."]},
 "caffe-arabica": {ott: [null, "Sopravvive grazie a nuove varietà resistenti al caldo."], prob: [null, "Le aree adatte alla coltivazione si dimezzano circa entro il 2050 (Bunn et al. 2015); il caffè selvatico d'Etiopia è minacciato."], pess: [null, "Coltivato solo in montagna e in poche regioni; quello selvatico rischia l'estinzione."]},
 "kakapo": {ott: [null, "Supera i 300 individui sulle isole senza predatori della Nuova Zelanda."], prob: [null, "Sopravvive con la gestione intensiva, ma soffre di malattie e poca diversità genetica."], pess: [null, "Sopravvive solo se la gestione continua: è totalmente dipendente dall'uomo."]},
 "rana-dorata-panama": {ott: [null, "Torna in natura grazie a rane allevate e resistenti al fungo chitridio."], prob: [null, "Sopravvive solo in cattività: in natura non si vede dal 2009."], pess: [null, "Sopravvive solo in cattività."]},
 "volpe-artica": {ott: [null, "Sopravvive."], prob: [null, "Si ritira a nord: la volpe rossa, più grande, la sostituisce."], pess: [null, "Sopravvive solo nell'alto Artico."]},
 "renna": {ott: [null, "Sopravvive."], prob: [null, "Diminuisce: piogge d'inverno ghiacciano la neve e le renne non raggiungono il cibo."], pess: [null, "Molto ridotta nelle zone meridionali; resiste a nord."]},
 "sapiens": {ott: [null, "Sopravvive e, forse, si diffonde nel Sistema solare."], prob: [null, "Sopravvive, con molte sofferenze evitabili e migrazioni per il clima."], pess: [null, "Quasi certamente sopravvive anche al riscaldamento peggiore: le minacce più gravi per l'estinzione umana vengono da guerra nucleare, pandemie artificiali e forse IA, non dal solo clima (valutazioni discusse)."]}
},

// =====================================================================
// ACCORDI, LEGGI, AGENDE E RAPPORTI DI OGGI
// =====================================================================
agende: [
{id: "parigi", title: "Accordo di Parigi", year: 2015, kind: "accordo", status: "In vigore dal 2016; quasi tutti i paesi del mondo. Gli Stati Uniti ne sono usciti il 27 gennaio 2026 e nel gennaio 2026 hanno annunciato l'uscita anche dall'UNFCCC e dall'IPCC.", text: "Ogni paese presenta piani nazionali (NDC) ogni cinque anni, sempre più ambiziosi. Nel 2025 è arrivata la terza tornata (NDC 3.0, con obiettivi al 2035).", target: "Riscaldamento «ben sotto» 2 °C, sforzi per 1,5 °C; zero emissioni nette nella seconda metà del secolo.", wiki: "Accordo di Parigi (2015)", wikiEn: "Paris Agreement", url: "https://unfccc.int/process-and-meetings/the-paris-agreement"},
{id: "cop28", title: "Consenso degli Emirati (COP28)", year: 2023, kind: "accordo", status: "Decisione adottata a Dubai; attuazione volontaria.", text: "Per la prima volta un testo ONU chiede di «allontanarsi dai combustibili fossili» nei sistemi energetici, in modo giusto e ordinato.", target: "Triplicare le rinnovabili e raddoppiare l'efficienza energetica entro il 2030; zero netto al 2050.", wiki: "XXVIII Conferenza delle Parti dell'UNFCCC", wikiEn: "2023 United Nations Climate Change Conference", url: "https://unfccc.int/cop28"},
{id: "cop30", title: "COP30 di Belém: «Mutirão globale»", year: 2025, kind: "accordo", status: "Concluso il 22 novembre 2025. Nessuna tabella di marcia per i fossili nel testo finale; il Brasile ne avvia una fuori dai negoziati. La COP31 si tiene ad Antalya (Turchia) nel novembre 2026.", text: "Decisione «Mutirão globale» (parola indigena per lavoro collettivo), Belém Mission to 1.5 e acceleratore volontario di attuazione; 59 indicatori per l'obiettivo globale sull'adattamento; lancio del fondo Tropical Forest Forever Facility.", target: "Triplicare la finanza per l'adattamento entro il 2035.", wiki: "XXX Conferenza delle Parti dell'UNFCCC", wikiEn: "2025 United Nations Climate Change Conference", url: "https://unfccc.int/cop30"},
{id: "icj", title: "Parere consultivo della Corte internazionale di giustizia sul clima", year: 2025, kind: "legge", status: "Emesso all'unanimità il 23 luglio 2025; non vincolante ma molto autorevole.", text: "Su richiesta dell'Assemblea ONU, nata da una campagna di studenti delle isole Vanuatu, la Corte afferma che gli stati hanno obblighi giuridici di proteggere il clima. Non agire, anche con nuove licenze o sussidi ai fossili, può essere un «illecito internazionale».", target: "1,5 °C come obiettivo principale; obblighi di mitigazione, adattamento e cooperazione.", wiki: "Corte internazionale di giustizia", wikiEn: "International Court of Justice", url: "https://www.icj-cij.org/case/187"},
{id: "agenda2030", title: "Agenda 2030 e Obiettivi di sviluppo sostenibile", year: 2015, kind: "agenda", status: "In corso fino al 2030; secondo l'ONU (2025) solo circa un terzo dei traguardi è in linea o in moderato progresso.", text: "17 obiettivi adottati da tutti i paesi ONU: tra questi il 13 (lotta al cambiamento climatico), il 14 (vita sott'acqua) e il 15 (vita sulla terra).", target: "Raggiungere i 169 traguardi entro il 2030.", wiki: "Obiettivi di sviluppo sostenibile", wikiEn: "Sustainable Development Goals", url: "https://sdgs.un.org/goals"},
{id: "kmgbf", title: "Quadro globale per la biodiversità di Kunming-Montréal", year: 2022, kind: "accordo", status: "Adottato alla COP15 della CBD (dicembre 2022); verifica di metà percorso alla COP17 di Erevan (ottobre 2026).", text: "23 obiettivi per il 2030 e 4 traguardi per il 2050. La COP16 (Cali 2024, Roma 2025) ha creato il «Fondo di Cali» per i dati genetici digitali e un piano per la finanza.", target: "30% di terre e mari protetti e 30% degli ecosistemi degradati in ripristino entro il 2030 («30×30»); fermare le estinzioni causate dall'uomo.", wiki: "Convenzione sulla diversità biologica", wikiEn: "Kunming-Montreal Global Biodiversity Framework", url: "https://www.cbd.int/gbf"},
{id: "ripristino", title: "Regolamento europeo sul ripristino della natura", year: 2024, kind: "legge", status: "Regolamento (UE) 2024/1991, in vigore dal 18 agosto 2024; i piani nazionali di ripristino vanno presentati entro settembre 2026.", text: "Prima legge europea che obbliga a ripristinare gli ecosistemi: foreste, fiumi, zone umide, praterie di posidonia, impollinatori, spazi verdi urbani.", target: "Misure di ripristino sul 20% di terre e mari dell'UE entro il 2030 e su tutti gli ecosistemi che ne hanno bisogno entro il 2050; 25 000 km di fiumi senza sbarramenti.", wiki: "Ripristino ecologico", wikiEn: "Nature Restoration Law", url: "https://environment.ec.europa.eu/topics/nature-and-biodiversity/nature-restoration-law_en"},
{id: "leggeclima", title: "Legge europea sul clima e obiettivo 2040", year: 2021, kind: "legge", status: "Regolamento (UE) 2021/1119; modifica con l'obiettivo 2040 approvata dal Parlamento e adottata dal Consiglio il 5 marzo 2026.", text: "Fa parte del Green Deal europeo (2019). Rende obbligatori per legge gli obiettivi climatici dell'Unione.", target: "−55% di emissioni nette entro il 2030 e −90% entro il 2040 rispetto al 1990 (con al massimo il 5% di crediti internazionali dal 2036); neutralità climatica al 2050.", wiki: "Green Deal europeo", wikiEn: "European Green Deal", url: "https://climate.ec.europa.eu/eu-action/european-climate-law_en"},
{id: "bbnj", title: "Trattato sull'alto mare (BBNJ)", year: 2023, kind: "accordo", status: "Adottato nel 2023; 60 ratifiche raggiunte il 19 settembre 2025, in vigore dal 17 gennaio 2026. Prima conferenza delle parti prevista entro gennaio 2027.", text: "Protegge la biodiversità delle acque internazionali, quasi due terzi dell'oceano, che prima non avevano regole comuni per creare aree protette.", target: "Permette aree marine protette in alto mare: necessarie per proteggere il 30% degli oceani entro il 2030.", wiki: null, wikiEn: "High Seas Treaty", url: "https://www.un.org/bbnjagreement/en"},
{id: "montreal", title: "Protocollo di Montréal ed Emendamento di Kigali", year: 1987, kind: "accordo", status: "Ratificato da tutti i paesi ONU; Kigali (2016) in vigore dal 2019. Lo strato di ozono si sta riprendendo.", text: "Ha eliminato circa il 99% delle sostanze che distruggono l'ozono. Kigali riduce gli HFC, gas che non distruggono l'ozono ma scaldano il clima.", target: "Ozono ai livelli del 1980 verso il 2040 (2066 sull'Antartide); riduzione degli HFC dell'80–85% entro la fine degli anni 2040.", wiki: "Protocollo di Montréal", wikiEn: "Montreal Protocol", url: "https://ozone.unep.org/treaties/montreal-protocol"},
{id: "minamata", title: "Convenzione di Minamata sul mercurio", year: 2013, kind: "accordo", status: "In vigore dal 2017; alla COP6 (Ginevra, 2025) i paesi hanno deciso di eliminare le otturazioni dentali con amalgama entro il 2034.", text: "Prende il nome dalla città giapponese dove negli anni Cinquanta migliaia di persone furono avvelenate dal mercurio scaricato in mare da una fabbrica.", target: "Ridurre estrazione, uso ed emissioni di mercurio.", wiki: "Convenzione di Minamata sul mercurio", wikiEn: "Minamata Convention on Mercury", url: "https://minamataconvention.org"},
{id: "plastica", title: "Trattato globale sulla plastica (in negoziazione)", year: 2022, kind: "accordo", status: "Mandato ONU del 2022; le sessioni di Busan (2024) e Ginevra (agosto 2025) si sono chiuse senza accordo. Nel febbraio 2026 è stato eletto il nuovo presidente, Julio Cordano (Cile).", text: "I paesi discutono se limitare la produzione di plastica nuova o solo migliorare riciclo e gestione dei rifiuti.", target: "Porre fine all'inquinamento da plastica, anche in mare (obiettivo ancora da definire).", wiki: "Inquinamento causato dalla plastica", wikiEn: "Global plastic pollution treaty", url: "https://www.unep.org/inc-plastic-pollution"},
{id: "cites", title: "CITES", year: 1973, kind: "accordo", status: "In vigore dal 1975, 185 parti; la CoP20 si è tenuta a Samarcanda (Uzbekistan) tra novembre e dicembre 2025.", text: "Regola il commercio internazionale di animali e piante selvatici: oltre 40 000 specie protette.", target: "Nessuna specie minacciata dal commercio internazionale.", wiki: "Convenzione sul commercio internazionale delle specie minacciate di estinzione", wikiEn: "CITES", url: "https://cites.org"},
{id: "ramsar", title: "Convenzione di Ramsar sulle zone umide", year: 1971, kind: "accordo", status: "In vigore; COP15 a Victoria Falls (Zimbabwe) nel luglio 2025. L'Italia ha oltre 50 siti Ramsar.", text: "Il primo trattato moderno per la natura. Secondo il Global Wetland Outlook 2025, dal 1970 si è perso circa il 22% delle zone umide.", target: "Uso saggio e conservazione delle zone umide.", wiki: "Convenzione di Ramsar", wikiEn: "Ramsar Convention", url: "https://www.ramsar.org"},
{id: "cms", title: "Convenzione di Bonn sulle specie migratrici (CMS)", year: 1979, kind: "accordo", status: "In vigore; rapporto «Stato delle specie migratrici del mondo» (2024).", text: "Protegge animali che attraversano i confini: uccelli, balene, tartarughe, squali. Il rapporto 2024 trova che il 44% delle popolazioni elencate è in calo e il 22% delle specie è minacciato.", target: "Conservare le specie migratrici e le loro rotte.", wiki: null, wikiEn: "Convention on the Conservation of Migratory Species of Wild Animals", url: "https://www.cms.int"},
{id: "iucn", title: "Lista Rossa IUCN delle specie minacciate", year: 1964, kind: "rapporto", status: "Aggiornamento di ottobre 2025 (Abu Dhabi): 172 620 specie valutate, 48 646 minacciate; aggiornamento del 9 aprile 2026 (pinguino imperatore «In pericolo»).", text: "Il «termometro» della biodiversità: classifica le specie da «Minor preoccupazione» a «Estinta».", target: "Valutare almeno 260 000 specie (obiettivo «Barometro della vita»).", wiki: "Lista rossa IUCN", wikiEn: "IUCN Red List", url: "https://www.iucnredlist.org"},
{id: "ipcc", title: "IPCC, Sesto rapporto di valutazione (AR6)", year: 2023, kind: "rapporto", status: "Completato nel 2023; il Settimo rapporto (AR7) è in preparazione per il 2028–2029.", text: "Migliaia di scienziati riassumono tutto ciò che si sa sul clima. Afferma che è «inequivocabile» che l'influenza umana ha riscaldato atmosfera, oceani e terre.", target: "Fornire la base scientifica agli accordi sul clima.", wiki: "Gruppo intergovernativo sul cambiamento climatico", wikiEn: "IPCC Sixth Assessment Report", url: "https://www.ipcc.ch/assessment-report/ar6/"},
{id: "ipbes", title: "IPBES: valutazioni sulla biodiversità", year: 2019, kind: "rapporto", status: "Valutazione globale 2019; valutazioni «Nexus» e «Cambiamento trasformativo» (dicembre 2024); «Imprese e biodiversità» (2026).", text: "L'«IPCC della natura». Nel 2019 ha stimato che circa un milione di specie animali e vegetali è minacciato di estinzione e che il 75% delle terre emerse è stato profondamente modificato dall'uomo.", target: "Base scientifica per la Convenzione sulla diversità biologica.", wiki: "Piattaforma intergovernativa sulla biodiversità e i servizi ecosistemici", wikiEn: "Intergovernmental Science-Policy Platform on Biodiversity and Ecosystem Services", url: "https://www.ipbes.net"},
{id: "egr", title: "UNEP, Emissions Gap Report 2025 «Off target»", year: 2025, kind: "rapporto", status: "Pubblicato il 4 novembre 2025.", text: "Misura la distanza tra le emissioni previste e quelle necessarie. Con le politiche attuali circa 2,8 °C; con le promesse 2,3–2,5 °C (nel 2024: 3,1 °C e 2,6–2,8 °C).", target: "Per restare a 1,5 °C le emissioni del 2030 dovrebbero scendere del 40% rispetto al 2019.", wiki: "Programma delle Nazioni Unite per l'ambiente", wikiEn: "United Nations Environment Programme", url: "https://www.unep.org/resources/emissions-gap-report-2025"},
{id: "gtpr", title: "Global Tipping Points Report 2025", year: 2025, kind: "rapporto", status: "Pubblicato il 13 ottobre 2025 (oltre 160 scienziati, coordinato dall'Università di Exeter).", text: "Conclude che le barriere coralline tropicali hanno superato il loro punto di non ritorno: è il primo sistema della Terra a farlo. Indica anche «punti di non ritorno positivi», come la diffusione di solare e auto elettriche.", target: "Avvertire i governi prima della COP30.", wiki: null, wikiEn: "Tipping points in the climate system", url: "https://global-tipping-points.org"},
{id: "wmo", title: "WMO, State of the Global Climate", year: 2025, kind: "rapporto", status: "Rapporto annuale; quello sul 2025 è stato pubblicato nel 2026.", text: "Il 2024 è stato il primo anno solare oltre 1,5 °C (1,55 °C); il 2025 il secondo o terzo più caldo (circa 1,43 °C); gli ultimi 11 anni sono i più caldi mai misurati.", target: "Monitorare il clima mondiale e gli eventi estremi.", wiki: "Organizzazione meteorologica mondiale", wikiEn: "World Meteorological Organization", url: "https://wmo.int"},
{id: "lpr", title: "WWF, Living Planet Report 2026", year: 2026, kind: "rapporto", status: "Pubblicato l'8 ottobre 2026.", text: "Le popolazioni di vertebrati monitorate sono calate in media del 73% tra il 1970 e il 2022 (35 803 popolazioni di 5 790 specie).", target: "Misurare lo stato della natura e i progressi verso il 2030.", wiki: null, wikiEn: "Living Planet Report", url: "https://www.livingplanetindex.org"},
{id: "wpp", title: "ONU, World Population Prospects 2024", year: 2024, kind: "rapporto", status: "Revisione del luglio 2024.", text: "La popolazione mondiale arriverà a circa 10,3 miliardi verso la metà degli anni 2080 e scenderà a circa 10,2 miliardi nel 2100.", target: "Stime demografiche per i piani di sviluppo.", wiki: "Popolazione mondiale", wikiEn: "World Population Prospects", url: "https://population.un.org/wpp/"},
{id: "costituzione", title: "Costituzione italiana, articoli 9 e 41 (riforma del 2022)", year: 2022, kind: "legge", status: "Legge costituzionale n. 1 dell'11 febbraio 2022, in vigore.", text: "L'articolo 9 ora dice che la Repubblica «tutela l'ambiente, la biodiversità e gli ecosistemi, anche nell'interesse delle future generazioni» e che la legge tutela gli animali. L'articolo 41 dice che l'attività economica non può danneggiare la salute e l'ambiente.", target: "Protezione dell'ambiente come principio fondamentale dello Stato.", wiki: "Costituzione della Repubblica Italiana", wikiEn: "Constitution of Italy", url: "https://www.gazzettaufficiale.it/eli/id/2022/02/22/22G00019/sg"},
{id: "pnacc", title: "Piano nazionale di adattamento ai cambiamenti climatici (PNACC)", year: 2023, kind: "agenda", status: "Approvato dal Ministero dell'Ambiente nel dicembre 2023.", text: "Indica 361 azioni per adattare l'Italia a caldo, siccità, alluvioni, mare che sale e incendi.", target: "Ridurre i rischi del clima che cambia in tutti i settori.", wiki: null, wikiEn: "Climate change adaptation", url: "https://www.mase.gov.it/pagina/piano-nazionale-di-adattamento-ai-cambiamenti-climatici"},
{id: "aiact", title: "Regolamento europeo sull'intelligenza artificiale (AI Act)", year: 2024, kind: "legge", status: "Regolamento (UE) 2024/1689, in vigore dal 1° agosto 2024: divieti dal febbraio 2025, regole per i modelli di uso generale dall'agosto 2025. Con l'accordo «omnibus digitale» del maggio 2026 gli obblighi per i sistemi ad alto rischio slittano al dicembre 2027 e all'agosto 2028.", text: "Prima legge al mondo che regola l'IA in base al rischio: vieta per esempio il «punteggio sociale» delle persone e impone trasparenza sui contenuti generati.", target: "IA sicura, trasparente e rispettosa dei diritti fondamentali.", wiki: "Legge sull'intelligenza artificiale", wikiEn: "Artificial Intelligence Act", url: "https://artificialintelligenceact.eu"},
{id: "leggeia", title: "Legge italiana sull'intelligenza artificiale (132/2025)", year: 2025, kind: "legge", status: "In vigore dal 10 ottobre 2025; decreti attuativi in preparazione.", text: "Prima legge nazionale di un paese UE che accompagna l'AI Act: regole per sanità, lavoro, scuola, giustizia; AgID e ACN come autorità; reato per la diffusione di falsi creati con l'IA («deepfake») dannosi.", target: "Uso dell'IA «antropocentrico», trasparente e sicuro.", wiki: "Intelligenza artificiale", wikiEn: "Artificial intelligence", url: "https://www.gazzettaufficiale.it/eli/id/2025/09/25/25G00143/sg"},
{id: "onu-ia", title: "ONU: risoluzioni sull'IA, Gruppo scientifico e Dialogo globale", year: 2024, kind: "iniziativa", status: "Risoluzione A/RES/78/265 (marzo 2024); A/RES/79/325 (agosto 2025) istituisce il Gruppo scientifico internazionale indipendente sull'IA (40 membri nominati nel febbraio 2026, mandato fino al 2029) e il Dialogo globale sulla governance dell'IA.", text: "Prime decisioni di tutti i paesi ONU sull'IA: promuoverla per lo sviluppo sostenibile e valutarne rischi e impatti con un rapporto scientifico annuale.", target: "IA «sicura, protetta e affidabile» per tutti.", wiki: "Organizzazione delle Nazioni Unite", wikiEn: "Regulation of artificial intelligence", url: "https://www.un.org/global-dialogue-ai-governance/en"},
{id: "vertici-ia", title: "Vertici internazionali sull'IA", year: 2023, kind: "iniziativa", status: "Bletchley Park (novembre 2023), Seul (maggio 2024), Parigi (febbraio 2025), Nuova Delhi (febbraio 2026).", text: "Incontri tra governi, aziende e scienziati. Da Bletchley è nato l'International AI Safety Report (2025, 2026), coordinato da Yoshua Bengio.", target: "Capire e ridurre i rischi dei sistemi di IA più potenti.", wiki: null, wikiEn: "AI Safety Summit 2023", url: "https://internationalaisafetyreport.org"},
{id: "falepili", title: "Trattato Falepili tra Australia e Tuvalu", year: 2023, kind: "accordo", status: "Firmato nel novembre 2023, in vigore dal 28 agosto 2024; primo sorteggio dei visti nel 2025.", text: "Primo accordo che offre a un intero popolo minacciato dal mare la possibilità di trasferirsi in un altro paese, con diritto di vivere, studiare e lavorare.", target: "280 visti all'anno per i cittadini di Tuvalu.", wiki: "Tuvalu", wikiEn: "Australia–Tuvalu relations", url: "https://www.dfat.gov.au/geo/tuvalu/australia-tuvalu-falepili-union-treaty"},
{id: "svalbard", title: "Svalbard Global Seed Vault", year: 2008, kind: "iniziativa", status: "Aperto nel febbraio 2008; oltre 1,3 milioni di campioni.", text: "Una copia di sicurezza dei semi delle banche genetiche di tutto il mondo, scavata nel permafrost di un'isola artica norvegese.", target: "Conservare la diversità delle piante coltivate per sempre.", wiki: "Svalbard Global Seed Vault", wikiEn: "Svalbard Global Seed Vault", url: "https://www.seedvault.no"}
],

// =====================================================================
// FONTI
// =====================================================================
fonti: [
 "IPCC 2021, Climate Change 2021: The Physical Science Basis, Summary for Policymakers (AR6 WGI). doi:10.1017/9781009157896.001",
 "IPCC 2018, Global Warming of 1.5 °C (SR1.5). https://www.ipcc.ch/sr15/",
 "IPCC 2022, AR6 WGII, Impacts, Adaptation and Vulnerability. doi:10.1017/9781009325844",
 "UNEP 2025, Emissions Gap Report 2025: Off target. https://www.unep.org/resources/emissions-gap-report-2025",
 "Climate Action Tracker, Warming Projections Global Update (novembre 2025). https://climateactiontracker.org",
 "WMO 2026, State of the Global Climate 2025. https://wmo.int",
 "Forster P. M. et al. 2025, Indicators of Global Climate Change 2024, Earth System Science Data 17: 2641. doi:10.5194/essd-17-2641-2025",
 "Lenton T. M. et al. (a cura di) 2025, Global Tipping Points Report 2025, University of Exeter. https://global-tipping-points.org",
 "Armstrong McKay D. I. et al. 2022, Exceeding 1.5 °C global warming could trigger multiple climate tipping points, Science 377: eabn7950. doi:10.1126/science.abn7950",
 "IPBES 2019, Global Assessment Report on Biodiversity and Ecosystem Services. doi:10.5281/zenodo.3831673",
 "WWF 2026, Living Planet Report 2026. https://www.worldwildlife.org/publications/2026-living-planet-report/",
 "IUCN 2025–2026, Red List updates (10 ottobre 2025; 9 aprile 2026). https://iucn.org",
 "United Nations DESA 2024, World Population Prospects 2024. https://population.un.org/wpp/",
 "Ganopolski A., Winkelmann R., Schellnhuber H. J. 2016, Critical insolation–CO2 relation for diagnosing past and future glacial inception, Nature 529: 200–203. doi:10.1038/nature16494",
 "Talento S., Ganopolski A. 2021, Reduced-complexity model for the impact of anthropogenic CO2 emissions on future glacial cycles, Earth System Dynamics 12: 1275–1293. doi:10.5194/esd-12-1275-2021",
 "Archer D. et al. 2009, Atmospheric lifetime of fossil fuel carbon dioxide, Annual Review of Earth and Planetary Sciences 37: 117–134. doi:10.1146/annurev.earth.031208.100206",
 "Clark P. U. et al. 2016, Consequences of twenty-first-century policy for multi-millennial climate and sea-level change, Nature Climate Change 6: 360–369. doi:10.1038/nclimate2923",
 "Ditlevsen P., Ditlevsen S. 2023, Warning of a forthcoming collapse of the Atlantic meridional overturning circulation, Nature Communications 14: 4254. doi:10.1038/s41467-023-39810-w",
 "van Westen R. M., Kliphuis M., Dijkstra H. A. 2024, Physics-based early warning signal shows that AMOC is on tipping course, Science Advances 10: eadk1189. doi:10.1126/sciadv.adk1189",
 "Baker J. A. et al. 2025, Continued Atlantic overturning circulation even under climate extremes, Nature 638: 987–994. doi:10.1038/s41586-024-08544-0",
 "Flores B. M. et al. 2024, Critical transitions in the Amazon forest system, Nature 626: 555–564. doi:10.1038/s41586-023-06970-0",
 "Kim Y.-H. et al. 2023, Observationally-constrained projections of an ice-free Arctic even under a low emission scenario, Nature Communications 14: 3139. doi:10.1038/s41467-023-38511-8",
 "Zekollari H. et al. 2025, Glacier preservation doubled by limiting warming to 1.5 °C versus 2.7 °C, Science. doi:10.1126/science.adu4675",
 "Rounce D. R. et al. 2023, Global glacier change in the 21st century: every increase in temperature matters, Science 379: 78–83. doi:10.1126/science.abo1324",
 "Barnosky A. D. et al. 2011, Has the Earth's sixth mass extinction already arrived?, Nature 471: 51–57. doi:10.1038/nature09678",
 "Ceballos G. et al. 2015, Accelerated modern human–induced species losses, Science Advances 1: e1400253. doi:10.1126/sciadv.1400253",
 "Kirchner J. W., Weil A. 2000, Delayed biological recovery from extinctions throughout the fossil record, Nature 404: 177–180. doi:10.1038/35004564",
 "Leclère D. et al. 2020, Bending the curve of terrestrial biodiversity needs an integrated strategy, Nature 585: 551–556. doi:10.1038/s41586-020-2705-y",
 "Lenton T. M. et al. 2023, Quantifying the human cost of global warming, Nature Sustainability 6: 1237–1247. doi:10.1038/s41893-023-01132-6",
 "Molnár P. K. et al. 2020, Fasting season length sets temporal limits for global polar bear persistence, Nature Climate Change 10: 732–738. doi:10.1038/s41558-020-0818-9",
 "Jenouvrier S. et al. 2021, The call of the emperor penguin: legal responses to species threatened by climate change, Global Change Biology 27: 5008–5029. doi:10.1111/gcb.15806",
 "Fretwell P. T. et al. 2023, Emperor penguins breeding failure in the Bellingshausen Sea, Communications Earth & Environment 4: 273. doi:10.1038/s43247-023-00927-x",
 "Chefaoui R. M., Duarte C. M., Serrão E. A. 2018, Dramatic loss of seagrass habitat under projected climate change in the Mediterranean Sea, Global Change Biology 24: 4919–4928. doi:10.1111/gcb.14401",
 "Storlazzi C. D. et al. 2018, Most atolls will be uninhabitable by the mid-21st century because of sea-level rise exacerbating wave-driven flooding, Science Advances 4: eaap9741. doi:10.1126/sciadv.aap9741",
 "Ballester J. et al. 2023, Heat-related mortality in Europe during the summer of 2022, Nature Medicine 29: 1857–1866. doi:10.1038/s41591-023-02419-z",
 "Haba Y. et al. 2025, Ancient origin of an urban underground mosquito, Science (23 ottobre 2025). https://eeb.princeton.edu/news/uncovering-ancient-mystery-london-underground-mosquito",
 "van't Hof A. E. et al. 2016, The industrial melanism mutation in British peppered moths is a transposable element, Nature 534: 102–105. doi:10.1038/nature17951",
 "Winchell K. M. et al. 2016, Phenotypic shifts in urban areas in the tropical lizard Anolis cristatellus, Evolution 70: 1009–1022. doi:10.1111/evo.12925",
 "Donihue C. M. et al. 2018, Hurricane-induced selection on the morphology of an island lizard, Nature 560: 88–91. doi:10.1038/s41586-018-0352-3",
 "Santangelo J. S. et al. 2022, Global urban environmental change drives adaptation in white clover, Science 375: 1275–1281. doi:10.1126/science.abk0989",
 "Campbell-Staton S. C. et al. 2021, Ivory poaching and the rapid evolution of tusklessness in African elephants, Science 374: 483–487. doi:10.1126/science.abe7389",
 "Brown C. R., Brown M. B. 2013, Where has all the road kill gone?, Current Biology 23: R233–R234. doi:10.1016/j.cub.2013.02.023",
 "Pongracz J. D. et al. 2017, Recent hybridization between a polar bear and grizzly bears in the Canadian Arctic, Arctic 70: 151–160. doi:10.14430/arctic4643",
 "Condon R. H. et al. 2013, Recurrent jellyfish blooms are a consequence of global oscillations, PNAS 110: 1000–1005. doi:10.1073/pnas.1210920110",
 "Hammond A. et al. 2021, Gene-drive suppression of mosquito populations in large cages as a bridge between lab and field, Nature Communications 12: 4589. doi:10.1038/s41467-021-24790-6",
 "IUCN SSC Canid Specialist Group 2025, Conservation perspectives on gene editing in wild canids (18 aprile 2025). https://canids.org",
 "IUCN SSC 2016, Guiding principles on creating proxies of extinct species for conservation benefit. https://iucn.org",
 "Huerta-Sánchez E. et al. 2014, Altitude adaptation in Tibetans caused by introgression of Denisovan-like DNA, Nature 512: 194–197. doi:10.1038/nature13408",
 "Ilardo M. A. et al. 2018, Physiological and genetic adaptations to diving in sea nomads, Cell 173: 569–580. doi:10.1016/j.cell.2018.03.054",
 "Evershed R. P. et al. 2022, Dairying, diseases and the evolution of lactase persistence in Europe, Nature 608: 336–345. doi:10.1038/s41586-022-05010-7",
 "Lucas T. et al. 2020, A newly discovered evolutionary trend: the median artery in the forearm, Journal of Anatomy 237: 623–631. doi:10.1111/joa.13224",
 "Hublin J.-J. et al. 2017, New fossils from Jebel Irhoud, Morocco and the pan-African origin of Homo sapiens, Nature 546: 289–292. doi:10.1038/nature22336",
 "Gott J. R. 1993, Implications of the Copernican principle for our future prospects, Nature 363: 315–319. doi:10.1038/363315a0",
 "Ord T. 2020, The Precipice: Existential Risk and the Future of Humanity, Bloomsbury.",
 "Grace K. et al. 2024, Thousands of AI authors on the future of AI. arXiv:2401.02843",
 "International AI Safety Report 2026 (coord. Y. Bengio). https://internationalaisafetyreport.org",
 "IEA 2025, Energy and AI. https://www.iea.org/reports/energy-and-ai",
 "Regolamento (UE) 2024/1689 sull'intelligenza artificiale; Legge italiana 23 settembre 2025, n. 132.",
 "Corte internazionale di giustizia 2025, Obligations of States in respect of Climate Change, parere consultivo del 23 luglio 2025. https://www.icj-cij.org/case/187",
 "WMO/UNEP 2022, Scientific Assessment of Ozone Depletion: 2022. https://ozone.unep.org",
 "Bennett C. E. et al. 2018, The broiler chicken as a signal of a human reconfigured biosphere, Royal Society Open Science 5: 180325. doi:10.1098/rsos.180325",
 "Posiva / STUK 2026, licenza di esercizio del deposito di Onkalo (22 ottobre 2026). https://www.posiva.fi",
 "Bulletin of the Atomic Scientists 2026, Doomsday Clock Statement (27 gennaio 2026). https://thebulletin.org",
 "Legge costituzionale 11 febbraio 2022, n. 1 (modifica degli articoli 9 e 41 della Costituzione)."
]
};

// =====================================================================
// SCENARI GUIDATI DEL FUTURO (stesso formato di SAP.scenari; t negativi = futuro)
// =====================================================================
SAP.scenari.push(
{id: "futuro-secolo", title: "Il secolo decisivo (2026–2100)", sub: "Che cosa dipende dalle scelte di oggi",
 from: 0, to: -0.000074, unit: "anni", color: "#e9c46a", futuro: true,
 intro: "Nessuno conosce il futuro, ma la scienza può dire che cosa succede «se…». Le emissioni dei prossimi decenni decidono se il riscaldamento si fermerà intorno a 1,5–2 °C o salirà a 3–4 °C, e con esso il destino di coralli, ghiacciai, coste e milioni di specie. Questo percorso segue lo scenario probabile (politiche attuali) e indica quando gli altri due scenari divergono.",
 steps: [
  {t: 0, title: "2026: il punto di partenza", text: "CO₂ oltre 425 ppm, riscaldamento umano di circa 1,37 °C, popolazioni di vertebrati calate in media del 73% dal 1970. Stati Uniti fuori dall'Accordo di Parigi; Unione europea con l'obiettivo −90% al 2040.", view: [12, 30, 1]},
  {t: -0.000004, title: "2030: le scadenze", text: "Scadono l'Agenda 2030 e l'obiettivo 30×30. La media di lungo periodo supera 1,5 °C. Nello scenario ottimistico le emissioni calano già in fretta; in quello probabile restano quasi ferme.", view: [0, 20, 1]},
  {t: -0.000014, title: "2040: ghiacci e coralli", text: "Prima estate artica quasi senza ghiaccio (forse prima). Il ghiacciaio della Marmolada è quasi scomparso. Le barriere coralline tropicali hanno subito sbiancamenti ripetuti.", view: [11.86, 46.43, 4]},
  {t: -0.000024, title: "2050: un mondo più caldo di 2 °C", text: "Nello scenario probabile si arriva a circa 2 °C; in quello ottimistico il mondo raggiunge zero emissioni nette di CO₂. Estati come quella del 2003 diventano normali in Italia; il Mediterraneo ospita sempre più specie tropicali.", view: [13, 40, 3]},
  {t: -0.000044, title: "2070: il permafrost e le città costiere", text: "Il permafrost artico perde una parte importante del suo ghiaccio. Venezia alza il MOSE molto spesso; Giacarta, Bangkok e Dacca lottano contro il mare e la subsidenza.", view: [100, 30, 2]},
  {t: -0.000058, title: "2084: il picco della popolazione", text: "L'umanità arriva a circa 10,3 miliardi e poi comincia a diminuire, per la prima volta dalla peste nera (ONU). Nello scenario ottimistico il picco arriva prima e più in basso.", view: [30, 10, 1]},
  {t: -0.000074, title: "2100: tre futuri", text: "Ottimistico: 1,4–1,8 °C, mare +30–60 cm, natura in ripresa. Probabile: circa 2,7 °C, mare +45–75 cm, barriere coralline quasi scomparse. Pessimistico: circa 4,4 °C, mare fino a 1 m e oltre, orsi polari e pinguini imperatori vicini all'estinzione.", view: [0, 0, 1]}
 ],
 markers: [
  {lat: 46.43, lon: 11.86, label: "Marmolada", kind: "evento", from: 0, to: -0.000034, text: "Il ghiacciaio più grande delle Dolomiti potrebbe sparire prima del 2040.", wiki: "Marmolada", wikiEn: "Marmolada"},
  {lat: 45.42, lon: 12.34, label: "Venezia e il MOSE", kind: "sito", from: 0, to: -0.000074, text: "78 paratoie mobili contro l'acqua alta, in funzione dal 2020.", wiki: "MOSE", wikiEn: "MOSE"},
  {lat: -8.52, lon: 179.2, label: "Tuvalu", kind: "sito", from: 0, to: -0.000074, text: "Atollo minacciato dal mare: dal 2024 i suoi abitanti possono trasferirsi in Australia con il trattato Falepili.", wiki: "Tuvalu", wikiEn: "Australia–Tuvalu relations"},
  {lat: -18.29, lon: 147.7, label: "Grande barriera corallina", kind: "sito", from: 0, to: -0.000074, text: "Sbiancamenti di massa nel 2016, 2017, 2020, 2022, 2024 e 2025.", taxon: "corallo-corno-cervo", wiki: "Grande barriera corallina", wikiEn: "Great Barrier Reef"},
  {lat: 61.24, lon: 21.44, label: "Onkalo", kind: "sito", from: 0, to: -0.000074, text: "Primo deposito definitivo di combustibile nucleare esaurito (licenza 2026).", wiki: null, wikiEn: "Onkalo spent nuclear fuel repository"}
 ]},

{id: "futuro-mare", title: "Il mare che sale (2026–12026)", sub: "Diecimila anni di coste che cambiano",
 from: 0, to: -0.01, unit: "anni", color: "#3a8fd0", futuro: true,
 intro: "Il mare sale perché l'acqua calda si dilata e perché fondono ghiacciai e calotte. È un processo lento ma lunghissimo: anche se smettessimo di emettere CO₂ oggi, il mare continuerebbe a salire per secoli. Quanto salirà in 10 000 anni dipende da quanto carbonio bruceremo in questo secolo: circa 6–7 m con 1,5 °C, 8–13 m con 2 °C, 28–37 m con 5 °C (IPCC AR6).",
 steps: [
  {t: 0, title: "Oggi: +4,5 mm all'anno", text: "Il mare sale circa il doppio più in fretta che negli anni Novanta: dal 1901 è salito di circa 20 cm.", view: [0, 20, 1]},
  {t: -0.000024, title: "2050: +15–25 cm", text: "In tutti gli scenari, perché il riscaldamento già avvenuto continua a scaldare l'oceano. Le inondazioni di marea diventano frequenti a Venezia, Miami, Giacarta.", view: [-80.2, 25.8, 3]},
  {t: -0.000074, title: "2100: da 30 cm a 1 metro", text: "Ottimistico +28–62 cm, probabile +44–76 cm, pessimistico +63 cm–1 m (fino a quasi 2 m se l'Antartide cede in fretta). Gli atolli del Pacifico diventano difficili da abitare.", view: [179.2, -8.5, 3]},
  {t: -0.000274, title: "2300: da 30 cm a 7 metri", text: "Con emissioni basse +0,3–3 m; con emissioni alte +1,7–6,8 m, fino a circa 15 m nel caso peggiore.", view: [12.3, 45, 4]},
  {t: -0.001, title: "3026: la Groenlandia si scioglie", text: "Con 2–3 °C stabili la calotta della Groenlandia (7,4 m di mare) continua a perdere ghiaccio per millenni. L'Antartide occidentale (circa 3,3 m) potrebbe cedere.", view: [-40, 72, 2]},
  {t: -0.002, title: "4026: 2–6 metri o 20", text: "Secondo l'IPCC in 2 000 anni il mare sale di 2–3 m con 1,5 °C, 2–6 m con 2 °C, 19–22 m con 5 °C.", view: [4.9, 52.4, 3]},
  {t: -0.01, title: "12026: nuove coste", text: "Ottimistico: +6–7 m, come nell'ultimo interglaciale. Probabile: +10–20 m, Venezia e il delta del Po sott'acqua. Pessimistico: +30–50 m, l'Adriatico entra nella Pianura Padana come nel Pliocene.", view: [11.5, 44.8, 3]}
 ],
 markers: [
  {lat: 44.95, lon: 12.4, label: "Delta del Po", kind: "sito", from: 0, to: -0.01, text: "Terra bassa che sprofonda: tra le zone italiane più esposte al mare che sale.", wiki: "Delta del Po", wikiEn: "Po (river)"},
  {lat: 52.37, lon: 4.9, label: "Paesi Bassi", kind: "sito", from: 0, to: -0.002, text: "Un quarto del paese è sotto il livello del mare: il Programma Delta prepara dighe e spazi per l'acqua.", wiki: "Piano Delta", wikiEn: "Delta Works"},
  {lat: -75.5, lon: -106.8, label: "Ghiacciaio Thwaites", kind: "sito", from: 0, to: -0.01, text: "Il ghiacciaio che potrebbe destabilizzare l'Antartide occidentale.", wiki: "Ghiacciaio Thwaites", wikiEn: "Thwaites Glacier"},
  {lat: 72, lon: -40, label: "Calotta della Groenlandia", kind: "sito", from: 0, to: -0.01, text: "7,4 m di mare congelati.", wiki: "Groenlandia", wikiEn: "Greenland ice sheet"}
 ]},

{id: "futuro-lontano", title: "Il futuro lontano di Homo sapiens (fino a 1 milione di anni)", sub: "Glaciazioni, evoluzione e il destino della nostra specie",
 from: 0, to: -1, unit: "ka", color: "#8e7cc3", futuro: true,
 intro: "Su tempi lunghi il clima torna a essere guidato dall'orbita della Terra e dalle rocce che assorbono la CO₂. Ma le nostre emissioni lasciano un'impronta per centinaia di migliaia di anni, rinviando la prossima glaciazione. Intanto l'evoluzione continua, per noi e per tutte le specie. Le tappe lontane sono ipotesi ragionate, non previsioni.",
 steps: [
  {t: 0, title: "Oggi: un interglaciale «prolungato»", text: "Viviamo nell'Olocene, un periodo caldo tra due glaciazioni, iniziato 11 700 anni fa. Senza l'uomo, questo interglaciale sarebbe comunque durato a lungo: circa 50 000 anni.", view: [10, 45, 1]},
  {t: -0.001, title: "1 000 anni: la lunga coda della CO₂", text: "Il 20–40% della CO₂ emessa è ancora nell'aria. Il mare continua a salire.", view: [0, 30, 1]},
  {t: -0.01, title: "10 000 anni: l'evoluzione continua", text: "Come nei 10 000 anni passati (latte, alta quota, apnea), gli esseri umani si adattano a cibi, malattie e ambienti nuovi, ma restano un'unica specie.", view: [90, 30, 2]},
  {t: -0.1, title: "100 000 anni: torna il ghiaccio?", text: "Nello scenario ottimistico inizia la prossima glaciazione; negli altri il clima è ancora troppo caldo. Le scorie di Onkalo hanno quasi finito il loro periodo di isolamento.", view: [-80, 60, 2]},
  {t: -0.3, title: "300 000 anni: tanti anni quanti ne ha la nostra specie", text: "Homo sapiens è comparso circa 300 000 anni fa in Africa. Fra altri 300 000 anni potremmo essere molto cambiati, o esserci diffusi oltre la Terra.", view: [-8.9, 31.9, 3]},
  {t: -0.6, title: "600 000 anni: l'ultima glaciazione rinviata", text: "Nello scenario pessimistico, con oltre 3 000 miliardi di tonnellate di carbonio bruciate, solo ora tornano le calotte nell'emisfero nord.", view: [20, 65, 2]},
  {t: -1, title: "1 milione di anni: e noi?", text: "Una specie di mammifero dura in media 1–2 milioni di anni. Homo sapiens potrebbe esserci ancora, essere diventato (tra virgolette) un «altro Homo», o essere sparito. Il futuro non è scritto.", view: [20, 0, 1]}
 ],
 markers: [
  {lat: 31.86, lon: -8.87, label: "Jebel Irhoud", kind: "fossile", from: 0, to: -1, text: "I più antichi fossili di Homo sapiens, circa 300 000 anni fa.", taxon: "sapiens", wiki: "Jebel Irhoud", wikiEn: "Jebel Irhoud"},
  {lat: 61.24, lon: 21.44, label: "Onkalo", kind: "sito", from: 0, to: -0.1, text: "Scorie nucleari isolate per circa 100 000 anni.", wiki: null, wikiEn: "Onkalo spent nuclear fuel repository"},
  {lat: 78.24, lon: 15.49, label: "Svalbard Global Seed Vault", kind: "sito", from: 0, to: -0.01, text: "La copia di sicurezza dei semi del mondo.", wiki: "Svalbard Global Seed Vault", wikiEn: "Svalbard Global Seed Vault"}
 ]}
);
