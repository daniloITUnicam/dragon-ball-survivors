<p align="center"><img src="docs/logo.png" alt="Dragon Ball: Survivors" width="560"></p>

# Dragon Ball: Survivors

> 🇬🇧 English version: [README.en.md](README.en.md)

Un survivor-like in stile *Vampire Survivors* ispirato a Dragon Ball: ti muovi, le armi sparano da sole, raccogli esperienza, sali di livello, ti trasformi e sopravvivi fino al boss finale. Tutto in **un solo file HTML** (Canvas 2D + JavaScript puro, zero dipendenze, nessun asset esterno: grafica generata dal codice, effetti sonori sintetizzati).

> ⚠️ Progetto amatoriale, non ufficiale e senza scopo di lucro. Non è affiliato a Toei Animation, Shueisha, Bandai Namco né agli eredi di Akira Toriyama. Vedi [DISCLAIMER.md](DISCLAIMER.md).

![Menu](docs/screens/menu.jpg)

## Indice

1. [Come si gioca](#come-si-gioca)
2. [Controlli](#controlli)
3. [Novità dell'ultimo aggiornamento](#novità-dellultimo-aggiornamento)
4. [Meccaniche di gioco](#meccaniche-di-gioco)
5. [Contenuti](#contenuti)
6. [Build e sviluppo](#build-e-sviluppo)
7. [Struttura del progetto](#struttura-del-progetto)
8. [Test](#test)
9. [Licenza](#licenza)

---

## Come si gioca

1. Dal menu scegli **Gioca**, poi stage, difficoltà e personaggio (e il tuo **compagno**).
2. Ti muovi con la tastiera (o il gamepad): **le armi attaccano da sole** contro i nemici vicini.
3. I nemici lasciano **gemme di esperienza**: raccoglile per salire di livello e scegliere un potenziamento tra le carte proposte.
4. Raggiungi i livelli richiesti per **trasformarti** (Super Saiyan, Ultra Istinto, ecc.): ogni forma dà bonus permanenti per la run.
5. Sopravvivi fino allo scadere del tempo dello stage e **sconfiggi il boss finale** per vincere. Se muori, tieni comunque gli zenny guadagnati.
6. Gli **zenny** si spendono nel **Negozio** (potenziamenti permanenti) e per **sbloccare i personaggi**.

![Selezione personaggio](docs/screens/characters.jpg)

## Controlli

| Azione | Tastiera | Gamepad |
|---|---|---|
| Movimento | `WASD` / frecce | D-pad |
| Conferma / Annulla | `Invio`, `Spazio` / `Esc`, `Backspace` | A / B |
| Pausa | `Esc` o `P` | Start |
| Interagire (altari, totem, stanza del tempo) | `E` o `F` | A |
| Abilità del compagno | `Q` (o tocca il pulsante in basso a sinistra) | X |
| **Fagiolo Senzu** (dalla borsa) | `H` · pulsante a schermo | LB |
| **Scatto** (danni sul percorso + invulnerabilità, ricarica 4 s) | `Shift` · pulsante a schermo | RB |
| **Abilità del personaggio** (Kaioken, Berserk, raggi, cloni…) | `R` o `X` · pulsante a schermo | Y |
| Debug (FPS ecc.) | `F2` o `` ` `` | Select |

Tutti i tasti sono riassegnabili da **Impostazioni → Comandi**.

---

## Novità dell'ultimo aggiornamento

### 🆕 Aggiornamento di ottobre 2026 (v35 → v40)

**🔄 Aggiornamenti automatici e note di versione (ultime novità)**
- **Nessuna run persa quando esce una versione nuova.** `build.py` marca ogni build con un *id* (hash di tutto il contenuto) e scrive `dist/version.json`; il workflow di GitHub Pages pubblica il file accanto a `index.html`. Il gioco lo legge (senza cache) dopo pochi secondi, poi ogni minuto e quando la scheda torna in primo piano. Se l'id è diverso compare un **avviso gigante con un conto alla rovescia di 10 secondi** (la partita continua e l'avviso non blocca i click); a zero la **partita in corso termina tenendo TUTTE le monete** (niente penalità del 25% per la sconfitta), il salvataggio cloud viene inviato e la **pagina si ricarica da sola**. Nei menu l'avviso è identico ma non c'è nessuna run da chiudere.
- Sicurezze: non fa nulla su `file://`, se `version.json` manca o se il gioco gira in un'anteprima; dopo due ricariche inutili (copia vecchia in cache sul CDN) smette di insistere finché non si ricarica a mano; l'URL viene ripulito dal parametro `?u=`.
- **Note di versione:** il tasto **📜** in alto a destra nel menu principale (con pallino rosso finché c'è una versione non letta) apre l'elenco, con la **data** e i cambiamenti divisi in **Novità**, poi **Correzioni** e **Bilanciamento** (le sezioni vuote spariscono). Per pubblicare una versione basta aggiungere un oggetto **in cima** a `PATCHES` in `src/js/patches.js` (testi `T('italiano','english')`, una riga per modifica).

**🐉 Sfere del Drago e serie di uccisioni**
- **Sprite nuovi** (`assets/dragonballs.webp`, 7 frame 64×64 ricavati dall'immagine di riferimento): ogni sfera ha da **1 a 7 stelle** e in una partita non ne compaiono due uguali finché non le hai tutte; il contatore in basso a destra mostra quali hai.
- **Rimbalzano davvero** sul terreno (lancio, rimbalzi sempre più bassi, poi un saltello ogni 1,6 s) con squash e stretch, **onda d'urto e scintille a ogni atterraggio**, bagliore pulsante, raggi rotanti, colonna di luce e stelline che brillano.
- **Suono dedicato** alla raccolta: `assets/sphere_sound.mp3` (incorporato in `DBS_AUDIO=embed`, copiato in `site/assets/` dal workflow in modalità `link`; se manca si sente il vecchio jingle sintetico).
- **Raccolta:** niente più attrazione e raggio ridotto (11 px invece di 20 + magnete): bisogna **passarci sopra**. Le frecce ai bordi dello schermo restano.
- **Serie di uccisioni:** contatore in alto a destra (si azzera dopo 4 s senza uccisioni); ai traguardi **25, 50, 100, 200, 350, 500, 750, 1000…** un banner, onde di luce e un po' di esperienza (qualche % di livello). Quattro nuovi obiettivi (50 / 200 / 500 / 1000 di fila).

**⚡ Abilità, ricariche e prezzi (ultimi ritocchi)**
- **Le abilità crescono con le trasformazioni:** a metà della linea ottengono un **bonus passivo** nuovo, nella **forma finale** un **effetto potenziato** (onda piccola → enorme, raggio doppio, scudo più lungo, Berserk di 13 s…); i testi sono nella scheda del personaggio e nel tooltip.
- **Ricariche** ridotte del 30% e in calo a ogni livello (−0,2 s, al massimo −10 s). Il **Berserk di Broly** ora dà **+80% danni e +5 armatura** (+8 in forma finale).
- **Prezzi di sblocco** ricalcolati su abilità, statistiche e forza nell'anime. Sotto la scelta della difficoltà non c'è più il testo sul x2 (si legge passando il mouse sul pulsante). Sprite: niente più linee sopra gli occhi.
- La **barra di avanzamento** mostra di nuovo i traguardi: teschio rosso = boss, teschietti bianchi = orde, drago Shenron = boss finale.

**🏆 Obiettivi, menu e Shop di Zeno (ultime novità)**
- **Obiettivi:** ricompense molto più alte (es. Cacciatore 200, Sterminatore 500, completare uno stage 1.000, livello 10 → 50, 25 → 100, Leggenda 500, Esprimi un desiderio 500…) e **oltre 20 nuovi obiettivi** (Zeno-sama, cimelio Mitico, Kaioken ×20, Estremo, 30 minuti, serie di boss, partite giocate, personaggi sbloccati…), un obiettivo per ogni stage (anche Via del Serpente).
- Ogni obiettivo ha una **barra di avanzamento** (es. 100/500 uccisioni, 1/4 stage) e la schermata ha **barra di ricerca** (nome o descrizione), filtro **Nascondi ottenuti** e ordinamento **Più vicini al completamento**.
- **Glossario** e **Grimorio** non sono più nel menu principale: si trovano **in alto a destra nella selezione personaggio**.
- Nel menu principale, a destra, il badge animato **W.I.P.** (work in progress) che rimbalza avanti e indietro.
- **Shop di Zeno:** Zeno-sama rimbalza su e giù; gli oggetti mostrano una **nuvoletta** con gli effetti quando ci si avvicina (distanza media), mentre per **comprarli** bisogna stare proprio sopra l'oggetto: niente acquisti involontari.

**⚡ Effetti e abilità (ultimi ritocchi)**
- Il **modello del personaggio** è sempre disegnato sopra a raggi, proiettili ed effetti: nessuna abilità lo oscura.
- **Elettricità crescente:** a ogni trasformazione le abilità (raggi, dischi, sfere, aure, meteore, onde…) si circondano di archi elettrici animati e scintille che orbitano, sempre più fitti (nella forma base non ce ne sono).
- **Aura del Kaioken** costante e dinamica come nell'anime: bagliore rosso, fiamme a più strati che ondeggiano, anelli a terra, scintille che salgono; più grande e feroce a ×20. Resta sopra a tutti gli effetti.
- **Kamehameha:** raggio che parte dalle mani e si estende, impulsi di energia che scorrono lungo il raggio, testa pulsante con anelli e scintille, sfera di carica con raggi rotanti. La portata cresce di +1% a ogni livello del personaggio (max +30%) e a ogni livello dell'arma. Stesso trattamento per il **Big Bang Kamehameha** (anche evoluto: testa gigante).
- **Modalità Test:** non si guadagnano più zenny, obiettivi, sblocchi né progressi (come l'Ambiente di test).
- Nella schermata degli stage basta **cliccare un livello** per passare alla scelta del personaggio.
- **Freezer** ora ha 7 forme (con **Dorato**) e **Cell** 6 (Imperfetto → Semi-Perfetto con C-17 → Perfetto con C-18 → Super Perfetto → **Dorato** → **Nero**); a ogni forma salgono statistiche, armatura e vita massima (+12%).

**🗺️ Livelli**
- **Via del Serpente** (Stage 2): si cammina *solo* sul corpo del serpente, nemici e oggetti compaiono solo lì. Ogni 2:30 min (in tempo di gioco scalato sulla durata) i nemici diventano più ardui, fino a un'orda di mini-boss; boss finale **Janemba** in due fasi (forma grassa → animazione di trasformazione → Janemba vero con spada e raggio come nel film). Completarlo in Difficile sblocca **Gogeta**.
- **Inferno** ora viene dopo le saghe di Freezer e Cell (Stage 8). Contiene **Freezer** e **Cell** come mini-boss che *si evolvono a ogni 1/N della loro vita*: Freezer in 7 forme (prima forma → seconda → terza → finale → 100% → **Freezer Dorato** → **Freezer Nero**), Cell in 6 (imperfetto → semi-perfetto, assorbe C-17 → perfetto, assorbe C-18 → super perfetto, dopo l'autodistruzione di Goku → **Cell Dorato** → **Cell Nero**). Ogni forma ha animazione di trasformazione, nuove mosse (Disco Distruttore, Raggio Mortale, Sfera della Morte, Supernova, Kamehameha di Cell, Cell Jr., Taiyoken…) e più armatura e più vita massima a ogni forma. Boss finale: Omega Shenron.
- **Anteprima animata** della mappa (vista dall'alto) su ogni card di stage; ordine canonico aggiornato (vedi tabella sotto).

**⏱️ Difficoltà e bilanciamento**
- Durata uguale su tutte le mappe: **Facile 5 min · Normale 10 · Difficile 15 · Estremo 30** (nuova difficoltà *Estremo*: nemici con molta vita, mai one-shot ma pesanti, boss enormi).
- Ogni **90 secondi** i nemici guadagnano **+10% vita e +2% danni** (cumulativo) e rilasciano **+5% esperienza**. In **Estremo**: **+15% vita, +5% danni, +15% armatura** e **+8% esperienza**.
- **+10% vita** a tutti i nemici (boss compresi) in ogni modalità.
- Negozio: potenziamenti leggermente più forti (es. armatura +1/livello, **rigenerazione +0,5 HP/s a livello**), **Scatto rimosso dal negozio** (resta quello base; in gioco si trova il raro trinket *Stivali del Vento*).
- Fix: schermo bianco intermittente (stato del canvas ripulito ogni frame, raggi ellittici blindati).

**💀 Morte e interfaccia**
- Animazione di morte (rallentatore, musica che rallenta), menù entro 2 s con *Riprova*, **riassunto danni per arma e monete raccolte**.
- Schermata di level-up più leggera: il gioco resta visibile sullo sfondo.
- **Modalità Test** (Impostazioni): tutti gli stage e personaggi aperti e negozio gratis; disattivandola tutto torna com'era (con avviso di conferma).

**👹 Nemici molto più vivi**
- Nuovo sistema di **abilità dei nemici** (`src/js/skills.js`): ventagli di ki, anelli, balzi, terremoti, colpi dal cielo, mine, scudo, evocazioni, cura, grido di battaglia, sfere orbitanti, raggi, trottola, tana sotterranea, fendenti. Ogni abilità ha una **preparazione visibile** (nemico che si carica, "!" e alone) e ogni livello ha le sue combinazioni (Saibaman che lasciano pozze acide, Cell Jr. corazzati che evocano Cell Jr., Reaper che si interrano…).
- **Rabbia e trasformazioni** dei nemici: sotto il 50% di vita entrano in furia (aura, più veloci e forti), alcuni **cambiano aspetto** (Super Saiyan, Oozaru, Majin potenziato, demone infuriato, soldato celeste ascendente, cyborg sovraccarico…) o si **evolvono** col tempo.
- Animazioni procedurali: passo, respiro, preparazione e colpo, comparsa con "pop", gelatina per i blob, ondeggiamento dei fantasmi, battito d'ali, impatto al colpo.

**🕳️ Segreti e Shop di Zeno**
- Un segreto per livello, in un momento casuale tra 1:00 e la durata del livello: compare una **freccia con i metri** verso un **altare con un misterioso bottone rosso**. Premendo **E** (come per la Stanza dello Spirito e del Tempo) si apre un portale per lo **Shop di Zeno**.
- Dentro: dimensione "chill" di **60 secondi**, tempo del livello fermo, **abilità e pet disattivati**, **nessuna rigenerazione passiva**. I trinket sono a terra davanti a Zeno-sama: ci si ferma sopra per comprarli (monete della partita), con una **tendina** che mostra oggetto e statistiche.
- La **Fortuna** decide la rarità degli oggetti (fino a leggendario); **1% di oggetti Mitici**.

**🍀 Trinket: uno alla volta, con rarità e Mitico**
- Si porta **un solo trinket**; trovandone un altro (forziere, capsula, desiderio, Zeno) si apre una **finestra di confronto** con avviso di sostituzione.
- Ogni trinket può avere rarità **Comune → Mitica**: le statistiche crescono con la rarità e hanno un tetto per rarità (es. danno: leggendario max 15%, mitico max 20%); i testi si aggiornano da soli. Gli altri tier sono stati ridimensionati di conseguenza. Trovare un trinket ha l'1% di chance di essere Mitico.
- Achievement *Collezionista*: ora "Trova 6 cimeli in una partita".

**🕰️ Stanza dello Spirito e del Tempo**
- Gli scambi di statistiche hanno un malus dimezzato; la trasformazione è offerta solo se arriverebbe entro 10 livelli ed è **alternativa** all'arma (o l'una o l'altra); abilità e pet disattivati anche lì (la rigenerazione resta).

**🧪 Test aggiunti:** `roster_unique`, `roster_smoke`, `testmode`, `snake_way`, `snake_boss`, `canvas_state`, `death_seq`, `hell_minis`, `skills_smoke`, `zeno`, `trinkets`, `trial_offers`.

### 🎵 Musica per mappa e 💨 Scatto universale
**Musica:** metti un brano in `assets/` col nome della mappa (`android ruins.mp3`, `buu dimension.mp3`, `muten island.mp3`, `tournament of power.mp3`, `namek.mp3`…) e suona in quella mappa, in loop con dissolvenza incrociata. Tabella dei nomi e opzioni di peso in [`docs/MUSIC.md`](docs/MUSIC.md). **Scatto (Shift):** ora ce l'hanno tutti i personaggi. Pulsante in basso a sinistra accanto al Kaioken, ricarica 4 s (si migliora nel negozio con *Scatto Fulmineo*: −0,4 s e +15% danno per livello), infligge danni ai nemici che attraversa e dà invulnerabilità temporanea. **Sprite:** i personaggi con sprite del pack camminano normalmente mentre caricano un raggio e allungano il braccio solo allo sparo; boss e Saibaman con arte nel pack la usano (Cabba e Janemba inclusi).

### 🎨 Nuovi sprite dal pack (32 personaggi) e scatto
I personaggi usano ora gli sprite pixel art del pack in `assets/sprites/` al posto di quelli disegnati dal codice: Goku (tutte le forme, dal Kaioken all'Ultra Istinto), Vegeta, Trunks, Gohan, Piccolo, Crilin, Broly, Freezer, Cell, Bu, Bardock, Raditz, Vegito, Gogeta, Gotenks, Androidi 16/17/18, Cooler, Toppo, Hit, Kefla, Caulifla, Kale, Beerus, Whis, Jiren, Black, Zamasu, Frost e Turles. Durante la **trasformazione** compare la posa di carica con l'aura/esplosione disegnata nello sprite, e lo **scatto** (Slancio) usa la posa orizzontale con la scia di velocità. Il **Kamehameha** usa il raggio del pack (bocca, corpo, testa), tinto col colore dell'arma. I personaggi senza sprite nel pack mantengono la grafica generata dal codice. Autori e avvertenze: [`CREDITS.md`](CREDITS.md), strumenti di importazione in [`docs/SPRITES.md`](docs/SPRITES.md).

### 🌦️ Stage vivi, meteo e giorno/notte
- **Stage animati**: ogni pianeta ha laghi e zone di bioma (secco/rigoglioso), terreno animato (onde di luce, schiuma sulle rive, fessure di lava che pulsano, griglia del Torneo), alberi e bandiere che ondeggiano col vento, bagliori sugli ostacoli, fumo dai rottami, torce, e un sacco di scenografia in più. In giro ci sono **creature** (conigli, rane, granchi, lucertole, scorpioni, piccioni…) che scappano quando ti avvicini, farfalle, lucciole, uccelli con la loro ombra, ombre di nuvole, polvere, braci, ceneri, stelle cadenti e così via.
- **Meteo** (pianure, Namecc, Isola di Muten, Pianeta Vegeta, Arena del Cell Game e altri): **pioggia, temporali con fulmini, nebbia, tempeste di sabbia e vento**, che arrivano e se ne vanno nel corso della partita.
- **Giorno/notte** negli stage all'aperto, con alba e tramonto. Da **Impostazioni → Ambiente** puoi attivare/disattivare **ambiente animato**, **meteo** e **ciclo giorno/notte**, scegliere con una barra **quanto giorno e quanto notte** (100% = sempre giorno, 0% = sempre notte) e la **durata del ciclo**. Tutto è solo estetico: il gameplay non cambia, e un controllo automatico riduce gli effetti se il gioco rallenta.

### 🏆 Torneo del Potere finale
Il Torneo del Potere è ora l'**ultimo stage**: 20 minuti, 12 boss con statistiche molto più alte e **evoluzioni durante lo scontro** (Dyspo, Bergamo, Basil, Lavender, Ribrianne, Cabba, Caulifla, Kale, Frost, Hit, Toppo e **Jiren**, che si evolve fino a *Ira Ultima*).

### 🖼️ Nuovo logo e menù dinamico
- Il titolo testuale è sostituito dal **logo ufficiale del progetto** (`assets/logo.webp`, incorporato nel file finale).
- Lo sfondo del menù è ora una **panoramica veloce degli stage** (cambio con taglio diagonale) con **personaggi casuali** che compaiono, **si trasformano**, usano le loro **abilità** (raggi, nova, cloni, barriere…), lanciano onde di ki ed **emote**. Il tutto è **sfocato** per non disturbare i pulsanti.

![Menu dinamico](docs/screens/menu-dynamic.jpg)

### 📖 Grimorio ed evoluzioni con ricetta
- Un'arma evolve quando è **al livello massimo** *e* hai il **potenziamento giusto** (es. **Zenkai + Kamehameha**); l'evoluzione si ottiene da un **forziere**. Ogni arma ha due ricette (una per evoluzione).
- Nelle carte del level up compare un **tooltip con icone**: "Il potenziamento «Zenkai» evolve l'arma «Kamehameha»". Sull'HUD, un'arma al massimo mostra l'icona del potenziamento che le manca (o un **!** quando è pronta). Se un'arma è al massimo, il potenziamento che le serve compare più spesso.
- La **seconda evoluzione** si sblocca **completando tutti gli stage (Normale o Difficile) con quell'arma nell'equipaggiamento**.
- **Grimorio**: elenca tutte le armi, le evoluzioni e le ricette; ciò che non hai sbloccato è **censurato**. Si apre con **Esc** in partita (scheda *Grimorio*), dalla **scelta personaggio** e dal **menù principale**. Mostra anche i progressi sugli stage completati.

![Grimorio](docs/screens/grimoire.jpg)
![Grimorio in partita](docs/screens/grimoire-pause.jpg)
![Tooltip di evoluzione](docs/screens/evo-hint.jpg)

### 🔴 Gemma rossa (accumulo esperienza)
Quando troppe gemme di esperienza affollano la mappa (oltre 90), quelle **più lontane si fondono in un'unica gemma rossa** che accumula l'XP e riduce il lag. La gemma resta **sempre appena fuori dallo schermo** (se ti allontani, ti segue lungo lo stesso lato) (nessun indicatore: sta a te scoprire da che parte). Raccoglila camminandoci contro (o con il Magnete) per ricevere tutto l'XP in una volta.

### 🫘 Borsa Senzu
- Nel menù del level up può comparire una carta **Fagiolo Senzu** (solo lì, **raramente**, circa 1 level up su 10): il fagiolo va nella **borsa** (fino a **3**). Con la borsa piena la carta cura subito il 40%.
- Si mangia in partita con **H** (o dal **pulsante a schermo** accanto a quelli del pet e dell'abilità) e cura il **40%** della vita; non si spreca a vita piena.

![Carta Senzu](docs/screens/senzu-card.jpg)

### 🎵 Musica di Namek
Il pianeta **Namek** ha una traccia dedicata, in **loop** per tutta la durata dello stage (durante i boss torna la musica sintetizzata e poi riprende da dove era). Le tracce (menu e Namek) sono state generate con **Suno** e sono incluse in `assets/` (vedi `assets/README.md`).

### ⚡ Trasformazioni e Kaioken
- **Trasformazioni spettacolari**: durante la carica il tempo rallenta, il personaggio è invulnerabile e l'aura si espande; al rilascio parte un'**onda d'urto che attraversa tutto lo stage** (respinge, stordisce e danneggia i nemici, cancella i proiettili nemici) con effetti di luce, fulmini e suono dedicato.
- **Requisiti più alti**: ogni forma richiede almeno **+10 livelli** rispetto alla precedente (livelli 14, 24, 36, 50, 66, 84, 104, 128).
- **Niente ritorno alle forme precedenti**: una volta trasformato non ha senso depotenziarsi.
- **Kaioken x10 / x20**: dopo la forma Kaioken, la linea Saiyan può attivare con `R` (premi di nuovo per cambiare livello, fino a spegnere):

  | Modalità | Statistiche | Prezzo in vita |
  |---|---|---|
  | x10 | danno ×2, velocità ×1,4, ricarica ÷2 | −4 HP/s |
  | x20 | danno ×4, velocità ×2,2, ricarica ÷4 | −8 HP/s |

  Si disattiva quando vuoi e si spegne da solo sotto il 10% di vita; non si può attivare sotto il 20%.

![Trasformazione](docs/screens/transformation.jpg)
![Kaioken x20](docs/screens/kaioken.jpg)

### 😡 Berserk di Broly
Broly ha un'abilità esclusiva sullo stesso tasto del Kaioken (`R`): **perde il controllo per 10 secondi**.
- Attacca a caso i nemici vicini con scatti ed esplosioni a ripetizione.
- I **comandi sono invertiti** e **non si può disattivare**.
- Bonus: danno ×1,8, armatura +3, danni subiti −30%.
- Aura verde perpetua con fiamme, anelli che si espandono, fulmini e **l'urlo di Broly**.
- Cooldown di 45 secondi.

![Berserk](docs/screens/berserk.jpg)

### 🆕 Terza ondata di novità: suoni arcade, sprite HD e 16 nuovi personaggi

**🕹️ Suoni arcade nei menù.** Ogni pulsante ha ora un suono **in stile arcade, forte e ben udibile** (onde quadre "chip"): un *tick* quando ci passi sopra o ti sposti con tastiera/pad, un *coin-blip* al clic, una discesa di note per **Indietro**, una **fanfara** per **Avvia partita**, un *ding* per gli acquisti e un *buzz* quando provi a usare un pulsante disattivato. Il suono vale per tutti i pulsanti HTML (menù, pausa, level up, modali) e usa il volume degli effetti.

**🎨 Sprite dei nemici e dei boss in alta definizione.** Tutti i nemici, i boss e i compagni sono ora disegnati su una griglia di pixel **più fine** (da 6 a 10 pixel per unità, scelta in base alla dimensione a schermo) con un nuovo passaggio di rifinitura: **contorno colorato** (non più nero piatto), **luce di bordo** in alto a sinistra, **ombra di nucleo** in basso a destra e sfumature morbide. Le creature sono state **ridisegnate da zero** con molto più dettaglio: Saibaman (denti, orecchie, sfera-bomba), Cell Jr., drone con propulsori, gelatine lucide, sfera del vuoto con occhio, spettro incappucciato, **Corazzato/Colosso** a piastre con nucleo luminoso, **lupi** (anche il lupo meccanico), **Raptor** e **Dinosauro** (tirannosauro) distinti, **pterodattili** con ali membranose e il **Scimmione Gigante** muscoloso. I nemici umanoidi hanno **teste arrotondate**, occhi con palpebre e riflessi, rivetti sulle armature, fibbie e ciocche di capelli.

![Nemici in HD](docs/screens/enemies-hd.jpg)
![Glossario](docs/screens/glossary-hd.jpg)

**👥 16 nuovi personaggi giocabili (57 in totale)**, ognuno con arma/e iniziali, abilità, linea di trasformazioni, prezzo e condizione di sblocco propri:

| Personaggio | Parte con | Abilità | Sblocco |
|---|---|---|---|
| **Videl** | Calcio Dinamite + Ki | Calcio Volante (scatto) | Livello 18 in una partita |
| **Bulma** | Colpo di Ki | Invenzione Geniale (più monete del Colpo di Fortuna) | Evolvi un'arma in una partita |
| **Yajirobe** | Spada | Scorta di Senzu (cura) · **parte con 1 Senzu in borsa** | 5.000 nemici in totale |
| **Great Saiyaman** | Raffica di Ki | Posa Eroica (critici) | Completa lo Stage 3 |
| **Chiaotzu** | Raggio Perforante | Paralisi Psichica (stordisce) | Stage 6 in Difficile |
| **Recoome** | Cannone d'Impatto | Calcio Recoome (scatto) · gigante | Completa lo Stage 2 |
| **Guldo** | Salto Temporale | Fermatempo | 15 boss in totale |
| **Turles** | Meteora + Ki | Frutto dell'Albero (assorbe) | Completa lo Stage 7 |
| **Nail** | Lancia Ribelle | Spirito Guerriero (potenziamento) | 2.500 nemici in una partita |
| **Re Kaioh** | Kaioken | Allenamento (potenziamento) | 4 trasformazioni in una partita |
| **Pan** | Sfere Eccentriche + Danza | Sangue Saiyan (potenziamento) | 5 trasformazioni in una partita |
| **Dabura** | Spada + Granata Infernale | Onda Demoniaca (nova) | 60 boss in totale |
| **Mr. Popo** | Fulmine Angelico | Scudo del Genio (barriera) | 80.000 nemici in totale |
| **Uub** | Kamehameha + Sfere | Raggio Puro | Stage 4 in Difficile |
| **Frost** | Raggio Perforante + Fulmine | Raggio Mortale (nova) | Completa uno stage in modalità ×2 |
| **Re Piccolo** | Sfera della Distruzione | Rigenerazione Demoniaca · gigante | 250 boss in totale |

Nuove linee di forme: Chiaotzu, Turles, Demoni (Dabura, Re Piccolo), Squadra Speciale (Recoome, Guldo), Re Kaioh, Frost e Uub; Videl, Pan, Bulma, Yajirobe e Mr. Popo usano la linea Umana, Nail quella Namecciana, il Great Saiyaman quella Saiyan. Nuovi stili di capelli: codini, caschetto e cresta.

![Nuovi personaggi](docs/screens/new-characters.jpg)

**🎨 Carte di level-up più leggibili.** Ogni carta di potenziamento ha ora un **colore che indica cosa fa** (🔴 danno, 🔵 velocità, 🟢 salute/cura, 🟡 ricarica, 🟣 raccolta, 🩵 esperienza, 🟠 area, ⚪ armatura) con una **grande icona sfumata sullo sfondo** (spada = danno, cuore = salute, fulmine = velocità, orologio = ricarica, scudo = armatura, magnete = raccolta, stella = esperienza) e un riquadro con l'effetto in chiaro (es. «+15% danno»). Le tecniche mostrano una riga per ogni statistica che cambia (Danno 10,5→13…).

**🌐 Hosting.** Nuova guida [`docs/HOSTING.md`](docs/HOSTING.md) e workflow GitHub Actions per pubblicare il gioco sul proprio dominio a ogni push.

**☁️ Account e salvataggi cloud (opzionale).** Con un progetto [Supabase](https://supabase.com) gratuito il gioco ha **login/registrazione** (email + password, Google opzionale, reset password) e **salva i progressi per account**, sincronizzati su ogni dispositivo. Si può sempre giocare **come ospite**; se al primo accesso esistono progressi sia sul dispositivo sia nel cloud, il gioco chiede quale usare. Guida completa: [`docs/SUPABASE.md`](docs/SUPABASE.md) (schema SQL in [`supabase/schema.sql`](supabase/schema.sql)).

**🖼️ Sprite dei personaggi in HD + spritesheet personalizzati.** I personaggi giocabili usano ora lo stesso motore HD di nemici e boss (pixel più fini, contorno colorato, luce di bordo e ombra). In più puoi **sostituire la grafica con i tuoi spritesheet PNG** (forma base e trasformazioni, con camminata e attacco): metti i file in `assets/sprites/` e ricompila. Guida e modello vuoto in [`docs/SPRITES.md`](docs/SPRITES.md).

### 👥 Nuovi personaggi (prima ondata)
Dallo stile di *Sparking! ZERO*: **Broly** (con tutte le forme), **Zamasu**, **Zamasu Fuso**, **Goku Black**, **Caulifla**, **Kale**, **Dyspo**, **Dr. Gero**, **Androide 21**.
Forme più **canoniche**:
- **Freezer**: Seconda forma → Terza → Forma finale → 100% → **Golden Frieza** → **Black Frieza**.
- **Cell**: Semi-Perfetto → **Perfetto** → Super Perfetto → **Cell Dorato** → **Cell Black**.
- **Broly**: Super Saiyan → Leggendario → Full Power → Forma furiosa → SSJ Broly → SSJ Full Power.
- Zamasu, Goku Black, Zamasu Fuso, Caulifla e Kale hanno ciascuno la propria linea di forme.

I **prezzi di sblocco sono molto più alti** (da 8.000 a 300.000 zenny): oltre al requisito di gioco si possono comprare, ma serve davvero farmare.

### 🐾 Compagni (pet)
Prima di ogni partita scegli un aiutante in base alla **razza**. Segue il giocatore, **raccoglie le gemme di esperienza vicine** e ha un'**abilità attiva** (`Q`) con ricarica:

| Compagno | Razza | Abilità (potenziata verso il basso) | Ricarica |
|---|---|---|---|
| Dende | Namecciano | **Cura**: ripristina il 7% della vita | 42 s |
| Mini Shenron | Drago | **Raccolta magica**: attira le gemme entro 300 px e dà un piccolo bonus XP (3%) | 55 s |
| Mini Droid | Androide | **Scudo di energia**: invulnerabile per 0,9 s | 55 s |
| Bubbles | Animale della Terra | **Banana fortunata**: qualche zenny e +3% fortuna per 40 s | 50 s |
| Mini Buu | Majin | **Raggio caramella**: stordisce i nemici molto vicini per 0,6 s (0,2 s sui boss) | 38 s |
| Saibaman | Saiyan (pianta) | **Autodistruzione**: piccola esplosione ad area | 30 s |

Le abilità dei pet sono state **ridimensionate di almeno tre quarti**: aiutano, ma non risolvono più la partita.

### 🌀 Genkidama potenziata
- La sfera **diventa più grande a ogni livello** dell'arma e ancora di più nelle **due evoluzioni** (più grande anche l'area d'impatto).
- Nelle evoluzioni, quando la sfera cade: **il terreno trema** (scosse ripetute dello schermo e onde d'urto), si aprono **crepe incandescenti** e la zona **brucia per 5-7 secondi** infliggendo danno nel tempo **contenuto** (circa il 11-13% del danno della sfera ogni mezzo secondo).

### 🍀 Fortuna, totem e trinket
- Il **Totem** compare **una sola volta per partita** (premi `E`) e ti offre **3 poteri a caso su 8**:

| Totem | Effetto |
|---|---|
| Fortuna | +1% fortuna a ogni level up, per tutta la partita |
| Rischio | XP ×2 ma +50% danni subiti per 150 s |
| Vitalità | +15% salute massima, +0,4 HP/s e cura immediata del 30% |
| Furia | +12% danno ma ricarica +8% più lenta |
| Ricchezza | +35% zenny e +25% raccolta |
| Guardiano | una barriera blocca un colpo, si ricarica ogni 25 s |
| Tempesta | ogni 22 s un fulmine colpisce fino a 4 nemici vicini |
| Spirito | ogni 35 s un impulso cura il 6% e stordisce i vicini |

- **Trinket con rarità** (Comune, Raro, Epico, Leggendario): la fortuna sposta le probabilità verso le rarità alte.
- **Ogni boss lascia un forziere con 4 trinket tra cui scegliere 1**; con la fortuna le opzioni salgono **fino a 10**.

![Scelta del trinket](docs/screens/trinket-pick.jpg)
![Totem](docs/screens/totem.jpg)

### 🎯 Abilità uniche per ogni personaggio
Ogni personaggio ha una **abilità attiva** (tasto `R` o **pulsante a schermo** accanto a quello del pet, con nome, ricarica e stato). I pulsanti per Kaioken (Goku) e Berserk (Broly) sono lì. Sono **16 meccaniche** diverse, tarate per non essere troppo forti:

![Pulsante abilità](docs/screens/ability-button.jpg)

Kaioken ×10/×20 · Berserk · Raggio potente · Nova di ki · Rigenerazione · Accecamento · Scatto invulnerabile · Cloni (3, sparano) · Occhio critico (+35% crit) · Barriera · Assorbimento · Fermo tempo (1,8 s) · Cancellazione · Riavvolgimento (recupera 6 s di vita persa) · Jackpot · Potenziamento temporaneo.

Le abilità sono descritte nel pannello del personaggio.

### 🌍 Ambiente: trappole e zone di cura
Nei livelli compaiono (non troppo spesso) **zone di cura passiva** (3% della vita massima al secondo) e **trappole a punte** che si attivano a intervalli e danneggiano **sia te sia i nemici**. Imparare a posizionarsi diventa parte della strategia.

![Zona di cura](docs/screens/heal-zone.jpg)
![Trappola](docs/screens/trap.jpg)

### 🕰️ Stanza dello Spirito e del Tempo ampliata
Ora dura **1 minuto**, con **arena più grande**, **ostacoli** (pilastri) e **3 pulsanti** da calpestare che attivano **trappole che danneggiano il boss** (ma anche te, se resti nel raggio).
- Il boss ha la **barra di vita** e **attacchi ad area sostanziali** (zone rosse di avvertimento: schianto, nova, meteore, raffiche, onde).
- Alla fine puoi spendere le monete in un negozio: gli **upgrade già acquistati o gratuiti spariscono** dalla lista e, **se li hai presi tutti, il negozio si chiude** e esci dal rift.

![Stanza dello Spirito e del Tempo](docs/screens/spirit-room.jpg)

### ⚔️ Armi: 5 livelli → evoluzione → 5 livelli → seconda evoluzione
- Ogni arma ha **5 livelli**; al massimo, il forziere la **evolve** e riparte da 1 per **altri 5 livelli** (e poi la seconda evoluzione, dopo aver completato tutti gli stage con quell'arma).
- Ogni livello delle evoluzioni dà poco: **+5% danno, −1,5% ricarica, +2% area** (niente numeri esagerati).
- **Colpo di Ki**: molti meno proiettili (da 1 a 3 prima dell'evoluzione, 4 al massimo) e **perforazione +1 solo nella seconda evoluzione**.
- La **Genkidama**, il **Kamehameha** e gli altri raggi hanno nuovi effetti sonori (vedi sotto).

### 👹 Nemici più duri, ondate di tiratori e mosse nuove
- Più **vita** per tutti i nemici e i boss, e **danni molto più alti** (a inizio partita senza negozio non fanno più 8-9 punti).
- I nemici da distanza **non sono più sparsi per tutta la partita**: arrivano in **ondate di 1 minuto** ogni 2-3 minuti, con avvertimento; poi spariscono.
- Nuove **mosse**:
  - **Salto** (lupi, raptor): si accovacciano, saltano in arco e atterrano con un'onda d'urto.
  - **Schianto** (bruti, dinosauri, colossi…): fermi, un **cerchio rosso** avvisa e poi esplodono ad area.
  - **Zig-zag** (cellule, fantasmi, pterodattili…): avanzano in modo ondeggiante.
- Dopo il passaggio di trasformazione c'è ora **il tempo di vedere l'animazione** (circa 4 s) prima del level up.

### 🔥 I boss si potenziano
Se impieghi **troppo tempo** (circa 85 s, poi 70 s) a sconfiggere un boss, questo **si trasforma**: si carica con aura e fiamme, rilascia un'**onda d'urto**, **recupera il 30%** (22% la seconda volta) della vita, diventa più forte e veloce e **impara nuovi attacchi** (schianto, nova, lancia, tempesta, meteore, raffiche). Fino a 2 volte per boss; è invulnerabile durante la carica.

![Boss che si potenzia](docs/screens/boss-powerup.jpg)
![Zona di schianto](docs/screens/slam-zone.jpg)

**Attacchi firmati dei boss.** Ogni boss ha ora 3 attacchi speciali in più (il boss finale li ha tutti e 6), scelti tra: **Muro di ki** (una parete di colpi con un varco), **Raggi incrociati** (quattro linee di esplosioni con avvertimento), **Lampo** (si teletrasporta vicino a te e spara a ventaglio), **Sfere a ricerca** (orbe che ti inseguono), **Vortice** (ti risucchia verso di lui prima di esplodere) e **Cerchio mortale** (otto esplosioni che si chiudono attorno a te). Gli attacchi sono sempre segnalati da cerchi rossi o proiettili visibili.

**Durante i boss:** i nemici normali spawnano un po' meno (−30% di ritmo, −20% di massimo). Nel **boss finale** invece la folla **aumenta** (+50% ritmo, +30% massimo) e i nemici hanno **più vita e armatura** ma infliggono un po' meno danni (−15%); il boss finale ha **+30% vita**, **più armatura** e infligge **−10% di danni**.

### 🔊 Audio rinnovato
Nuovo **Kamehameha elettrico** (carica crepitante e sparo distorto), suoni più "da anime" per Ki e per tutte le armi, effetti dedicati alle **evoluzioni**, **vento d'aura** nelle trasformazioni e suoni per ogni abilità e mossa nemica.

### ⚖️ Bilanciamento
- **Tutti i potenziamenti che aumentano il danno sono a tempo** (es. oggetti raccolti +15% per 12 s, altari 30 s).
- **Esperienza ridotta ulteriormente** e curva dei livelli più lenta: forme alte si raggiungono solo negli stage lunghi e difficili.
- I nemici non uccidono più in un colpo: il danno subito per colpo è limitato a una frazione della vita massima (anche meno per trappole e proiettili dei boss).
- Livelli facili meno banali, livelli difficili senza forme esagerate.

### 🎨 Animazioni, interfaccia e audio
- **Personaggi animati** nel menu di selezione (respirano, sbattono le palpebre, fanno espressioni e pose) e **in partita** (emote al level up, espressioni di dolore o sorpresa, sorriso dopo un boss).
- Gli **zenny** non compaiono più nel menu principale; altrove sono mostrati con un'**icona-moneta d'oro** al posto della "Z".
- **Musica del menu** a file (propagata anche alla selezione personaggio); le altre musiche sono sintetizzate.
- Interfaccia in **6 lingue**: Italiano, English, Español, Français, Deutsch, Português (i nomi dei contenuti di gioco sono tradotti solo in italiano e inglese, le altre lingue usano l'inglese).

---

## Meccaniche di gioco

### Combattimento e armi
- **Attacco automatico**: ogni arma ha il suo comportamento (proiettili, raggi, orbite, zone di fuoco, fulmini a catena, meteore…).
- Puoi portare **fino a 5 armi** e **5 potenziamenti passivi diversi**, ciascuno **fino al livello 5** (le armi poi si evolvono e hanno altri 5 livelli per evoluzione).
- **23 armi**: Colpo di Ki, Kamehameha, Disco Distruttore, Genkidama, Kaioken (aura), Taiyoken, Spada, Colpi Eccentrici, Raggio Perforante, Lancia Ribelle, Doppio Sunday, Cannone Distruttore, Danza Elegante, Boomerang Ginyu, Granata Infernale, Salto Temporale, Impatto Potente, Sfera della Distruzione, Fulmine Angelico, Meteora di Fusione, Big Bang Kamehameha, Calcio Dinamite, Raffica di Ki.
- **Evoluzioni**: un'arma al livello massimo può evolversi (tramite forziere). Ogni evoluzione richiede **arma al massimo + potenziamento specifico** (vedi Grimorio). Una **seconda evoluzione** per arma si sblocca **completando tutti gli stage (Normale+) con quell'arma nell'equipaggiamento**.
- Le armi si **sbloccano** nella pool dei level up completando uno stage o raggiungendo il livello 50 con un personaggio che parte con quell'arma.
- **Passivi**: Zenkai (+15% danno), Vigore (+20 HP), Volo veloce (+8% velocità), Scouter (raccolta), Camera Gravitazionale (−8% ricarica), Armatura, Fagioli Senzu (rigenerazione), Meditazione (+12% XP).

### Esperienza, livelli e trasformazioni
- Ogni livello propone carte (arma, potenziamento, ecc.).
- Ogni personaggio ha una **linea di trasformazioni** (Saiyan, Namecciano, Umano, Androide, Freezer, Cell, Broly, Zamasu, Goku Black, Zamasu Fuso, Caulifla, Kale, Pride Troopers, Dei, Majin, più le linee dei personaggi della terza ondata): fino a **8 forme** (Ultra Istinto alla fine di alcune linee).
- Le forme scattano ai livelli **14, 24, 36, 50, 66, 84, 104, 128** e dànno bonus a danno, velocità, ricarica, armatura, rigenerazione e riduzione dei danni, oltre a un nuovo aspetto e colore dell'aura.
- Nella Stanza dello Spirito e del Tempo si può **comprare in anticipo** la forma successiva, ma solo se hai raggiunto almeno il 70% del livello richiesto.

### Oggetti, struttura della run e mappa
- **Forzieri** (uno per boss e uno di rifornimento ogni 5 minuti) con ricompense e trinket.
- **Oggetti a terra**: monete, cuore, magnete, potenziamenti temporanei di danno/velocità, XP, fortuna, capsule.
- **Sfere del Drago**: raccogline 7 per esprimere un desiderio (seconda vita, potere, fortuna).
- **Eventi sulla mappa**: Altare del Potere (bonus temporaneo), Sorgente curativa, Altare del Sacrificio (arma +1 in cambio di metà vita), Fonte dell'esperienza, Deposito di monete, Totem, Stanza dello Spirito e del Tempo.
- **Trinket (20)** in 4 rarità: Scouter rotto, Marsupio Senzu, Fascia da allenamento, Stivali gravitazionali, Radar del Drago, Orecchino Potara, Mantello Namecciano, Nyoibo, Nuvola Speedy, Capsula Hoi-Poi, Cuore di Kaioh, Aureola angelica, Orologio della Stanza del Tempo, Sfera del Drago a 4 stelle, Cristallo divino, Armatura reale Saiyan, Anello del Tempo, Specchio di Kaioh, Cuore del Drago, Furia Saiyan.

### Stage, difficoltà e modalità
| # | Stage | Sblocco |
|---|---|---|
| 1 | Isola di Muten | — |
| 2 | Via del Serpente | clear Stage 1 |
| 3 | Pianura Saiyan | clear Stage 2 |
| 4 | Pianeta Vegeta | clear Stage 3 |
| 5 | Pianeta Namek | clear Stage 4 |
| 6 | Rovine degli Androidi | clear Stage 5 |
| 7 | Arena dei Cell Game | clear Stage 6 |
| 8 | Inferno | clear Stage 7 |
| 9 | Dimensione di Bu | clear Stage 8 |
| 10 | Regno degli Dei | clear Stage 9 |
| 11 | **Torneo del Potere** (finale) | clear Stage 10 |

Gli stage seguono l'**ordine canonico di Dragon Ball** (Dragon Ball → Z → Super) e la difficoltà cresce di stage in stage. Chi aveva già dei progressi non perde nulla: uno stage già completato resta aperto.

Ogni stage ha **nemici dedicati** (oltre 130 varianti totali, ciascuno con IA diversa: inseguimento, tiratori, kamikaze, schermati, schivatori…) e **boss** a tempi prefissati (es. Raditz, Nappa e Vegeta nelle Pianure Saiyan; Freezer su Namek; Cell ai Cell Game; Janemba su Via del Serpente; Freezer e Cell evoluti + Omega Shenron all'Inferno; Jiren al Torneo del Potere). Una **Guida/Glossario** nel menu descrive ogni nemico e boss.

**Difficoltà**

| | Salute nemici | Danni nemici | Quantità | Zenny | Durata |
|---|---|---|---|---|---|
| Facile | ×0,9 | ×0,7 | ×0,8 | ×0,7 | 5 min |
| Normale | ×1 | ×1 | ×1 | ×1 | 10 min |
| Difficile | ×2 | ×1,5 | ×1,4 | ×1,35 | 15 min |
| Estremo | ×4 | ×1,8 | ×1,5 | ×2,4 | 30 min |

**Modalità x2** (si sblocca raggiungendo il boss finale di uno stage): tempo e zenny doppi, esperienza ridotta, nemici più duri.
**Modalità Sandbox** (Impostazioni): provi liberamente armi, forme ed evoluzioni.

### Progressione permanente
- **Negozio** (12 potenziamenti, costo crescente, fino al livello 6 ciascuno; Seconda Vita fino a 2): Avidità, Studio, Vitalità, Rigenerazione, Potenza, Agilità, Magnetismo, Armatura, Tempo, Fortuna, Occhio acuto, **Seconda Vita** (revive).
- **Obiettivi**: 90 achievement con ricompensa in zenny (uccisioni, boss, maestria con le armi, seconde evoluzioni, saghe…).
- **Personaggi**: 4 disponibili subito (Goku, Vegeta, Piccolo, Crilin); gli altri si sbloccano con una **condizione** (completare stage, anche in Difficile, raggiungere un livello, sconfiggere tot nemici/boss) **oppure comprandoli** con zenny.
- Salvataggio automatico nel browser (localStorage); reset dalle Impostazioni.

![Stage](docs/screens/stages.jpg)
![Boss](docs/screens/boss.jpg)

### Personaggi giocabili

| Linea di forme | Personaggi |
|---|---|
| Saiyan | Goku, Vegeta, Trunks, Gohan, Goten, Gotenks, Vegito, Gogeta, Kefla, Raditz, Nappa, Bardock, Great Saiyaman |
| Namecciano | Piccolo, Nail |
| Umano | Crilin, Yamcha, Tensing, Muten, Mr. Satan, Videl, Bulma, Yajirobe, Pan, Mr. Popo |
| Androide | C-18, C-17, C-16, Dr. Gero, Androide 21 |
| Freezer | Freezer, Cooler, Capitan Ginyu, Zarbon |
| Cell · Majin | Cell · Majin Bu |
| Pride Troopers | Toppo, Hit, Jiren, Dyspo |
| Dei | Beerus, Whis |
| Linee dedicate | Broly, Zamasu, Zamasu Fuso, Goku Black, Caulifla, Kale, Chiaotzu, Turles, Dabura e Re Piccolo (Demoni), Recoome e Guldo (Squadra Speciale), Re Kaioh, Frost, Uub |

---

## Build e sviluppo

Servono solo **Python 3** (per il bundler) e, opzionalmente, **Node.js** (per i controlli di sintassi e i test).

```bash
python3 build.py --check      # crea dist/dragon-ball-survivors.html e controlla la sintassi con node
```

Apri `dist/dragon-ball-survivors.html` in un browser moderno (consigliato Chrome/Edge/Firefox): è **autosufficiente**, funziona anche offline (i font Google sono opzionali, c'è un fallback).

Per la **musica del menu** è già inclusa in `assets/menu.mp3` (vedi [assets/README.md](assets/README.md)); per cambiarla sostituisci il file; se manca viene usata una musica sintetizzata.

**Pubblicarlo con GitHub Pages**: dopo `python3 build.py`, copia `dist/dragon-ball-survivors.html` in `docs/index.html` (o usa una GitHub Action) e abilita Pages su `main` / cartella `docs`.

## Struttura del progetto

```
build.py              bundler: unisce src/ in un unico HTML
src/index.html        pagina
src/css/style.css     stile
src/js/
  util.js data.js     utilità e dati (armi, personaggi, stage, nemici, boss, trinket, pet, negozio…)
  i18n*.js            traduzioni (it, en, es, fr, de, pt)
  weapons*.js         comportamento delle armi
  world.js            terreno, ostacoli, zone di cura e trappole
  save.js             salvataggio, progressione, obiettivi, impostazioni
  game.js             logica di gioco (senza DOM) + MapDirector (eventi, totem, stanza)
  sprites.js          sprite procedurali dei personaggi (con espressioni)
  sprites_hd.js       pipeline HD per nemici, boss e pet (contorno colorato, luci) e creature ridisegnate
  audio.js            effetti sonori sintetizzati e musica
  cloud.js            account e sincronizzazione salvataggi (Supabase)
  update.js           avviso di nuova versione (version.json), conto alla rovescia e ricarica
  patches.js ui_patch.js   note di versione (dati + schermata)
  ui_account.js       schermate login / registrazione / conflitto
  input.js renderer.js ui.js ui2.js app.js   input, rendering, interfaccia e ciclo principale
tests/                simulazioni e test con puppeteer
docs/screens/         screenshot usati in questo README
```

## Test

Test headless in Node (simulano partite complete con un bot) e test end-to-end con Puppeteer:

```bash
node tests/check_i18n.js      # verifica le traduzioni in tutte le lingue
node tests/kai.js             # Kaioken x10/x20 (statistiche, consumo, spegnimento)
node tests/bers.js            # Berserk di Broly (durata, cooldown, non annullabile)
node tests/totem.js           # totem unico + 8 poteri
node tests/abil.js            # tutte le abilità dei 57 personaggi
node tests/newchars.js        # i 16 nuovi personaggi: dati, sblocchi, Senzu di Yajirobe, run complete
node tests/ui_sfx.js          # suoni arcade dei pulsanti (hover, clic, indietro) - richiede puppeteer
node tests/sheet_hd.js en out.png   # anteprima di tutti gli sprite nemici (anche: boss, o chiavi separate da virgola)
node tests/shot_enemies.js out.png  # screenshot in partita con tutti i nemici
node tests/boss.js            # potenziamento dei boss, schianti
node tests/boss2.js           # attacchi firmati dei boss, regole di spawn
node tests/spirit.js          # stanza dello Spirito e del Tempo
node tests/senzu.js           # borsa Senzu
node tests/gems.js            # gemma rossa (accumulo XP)
node tests/sim.js             # simulazione con tutti i personaggi
node tests/death.js 0 normal 6 goku     # bilanciamento: stage, difficoltà, partite, personaggio
node tests/lvfull.js "1,2,5,10" normal  # ritmo di livelli e forme
# e2e/smoke (richiedono puppeteer e un browser): e2e.js e2e2.js e2e3.js e2e4.js smoke5.js smoke6.js smoke7.js
```

> Nota: il bilanciamento è stato verificato con un bot volutamente debole; l'esperienza reale di una persona può essere più facile. Segnalazioni e proposte sono benvenute nelle issue.

## Licenza

Il **codice** è sotto licenza [MIT](LICENSE). Nomi, personaggi e marchi di Dragon Ball **non sono coperti** da questa licenza e appartengono ai rispettivi proprietari ([DISCLAIMER.md](DISCLAIMER.md)).
