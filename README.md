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
| Abilità del compagno | `Q` o `Shift sinistro` (o tocca il pulsante in basso a sinistra) | X |
| **Kaioken x10/x20** (linea Saiyan) · **Berserk** (Broly) | `R` o `X` | Y |
| Debug (FPS ecc.) | `F2` o `` ` `` | Select |

Tutti i tasti sono riassegnabili da **Impostazioni → Comandi**.

---

## Novità dell'ultimo aggiornamento

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

### 👥 Nuovi personaggi (41 in totale)
Dallo stile di *Sparking! ZERO*: **Broly** (con tutte le forme), **Zamasu**, **Zamasu Fuso**, **Goku Black**, **Caulifla**, **Kale**, **Dyspo**, **Dr. Gero**, **Androide 21**.
Forme più **canoniche**:
- **Freezer**: Seconda forma → Terza → Forma finale → 100% → **Golden Frieza** → **Black Frieza**.
- **Cell**: Semi-Perfetto → **Perfetto** → Super Perfetto → **Cell Dorato** → **Cell Black**.
- **Broly**: Super Saiyan → Leggendario → Full Power → Forma furiosa → SSJ Broly → SSJ Full Power.
- Zamasu, Goku Black, Zamasu Fuso, Caulifla e Kale hanno ciascuno la propria linea di forme.

I **prezzi di sblocco sono molto più alti** (da 8.000 a 300.000 zenny): oltre al requisito di gioco si possono comprare, ma serve davvero farmare.

### 🐾 Compagni (pet)
Prima di ogni partita scegli un aiutante in base alla **razza**. Segue il giocatore, **raccoglie le gemme di esperienza vicine** e ha un'**abilità attiva** (`Q`) con ricarica:

| Compagno | Razza | Abilità | Ricarica |
|---|---|---|---|
| Dende | Namecciano | **Cura**: ripristina il 30% della vita | 42 s |
| Mini Shenron | Drago | **Raccolta magica**: attira tutte le gemme e dà XP bonus | 55 s |
| Mini Droid | Androide | **Scudo di energia**: invulnerabile per 3,5 s | 55 s |
| Bubbles | Animale della Terra | **Banana fortunata**: zenny e +12% fortuna per 40 s | 50 s |
| Mini Buu | Majin | **Raggio caramella**: stordisce i nemici vicini per 2,5 s | 38 s |
| Saibaman | Saiyan (pianta) | **Autodistruzione**: esplosione ad area | 30 s |

### 🌀 Genkidama potenziata
- La sfera **diventa più grande a ogni livello** dell'arma e ancora di più nelle **due evoluzioni** (più grande anche l'area d'impatto).
- Nelle evoluzioni, quando la sfera cade: **il terreno trema** (scosse ripetute dello schermo e onde d'urto), si aprono **crepe incandescenti** e la zona **brucia per 5-7 secondi** infliggendo danno nel tempo **contenuto** (circa il 11-13% del danno della sfera ogni mezzo secondo).

### 🍀 Fortuna, totem e trinket
- **Totem della Fortuna** compaiono sulla mappa (premi `E`). Scegli: **+fortuna a ogni level up** oppure **XP ×2 ma danni subiti +50%** (per 150 s).
- **Trinket con rarità** (Comune, Raro, Epico, Leggendario): non sono più tutti leggendari. La fortuna sposta le probabilità verso le rarità alte.
- **Ogni boss lascia un forziere con 4 trinket tra cui scegliere 1**; con la fortuna le opzioni salgono **fino a 10**.

![Scelta del trinket](docs/screens/trinket-pick.jpg)
![Totem](docs/screens/totem.jpg)

### 🌍 Ambiente: trappole e zone di cura
Nei livelli compaiono (non troppo spesso) **zone di cura passiva** (3% della vita massima al secondo) e **trappole a punte** che si attivano a intervalli e danneggiano **sia te sia i nemici**. Imparare a posizionarsi diventa parte della strategia.

![Zona di cura](docs/screens/heal-zone.jpg)
![Trappola](docs/screens/trap.jpg)

### 🕰️ Stanza dello Spirito e del Tempo ampliata
Ora dura **1 minuto**, con **arena più grande**, **ostacoli** (pilastri) e **3 pulsanti** da calpestare che attivano **trappole che danneggiano il boss** (ma anche te, se resti nel raggio). Alla fine puoi spendere le monete in un negozio di potenziamenti.

![Stanza dello Spirito e del Tempo](docs/screens/spirit-room.jpg)

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
- Puoi portare **fino a 5 armi** e **5 potenziamenti passivi diversi**, ciascuno **fino al livello 5**.
- **23 armi**: Colpo di Ki, Kamehameha, Disco Distruttore, Genkidama, Kaioken (aura), Taiyoken, Spada, Colpi Eccentrici, Raggio Perforante, Lancia Ribelle, Doppio Sunday, Cannone Distruttore, Danza Elegante, Boomerang Ginyu, Granata Infernale, Salto Temporale, Impatto Potente, Sfera della Distruzione, Fulmine Angelico, Meteora di Fusione, Big Bang Kamehameha, Calcio Dinamite, Raffica di Ki.
- **Evoluzioni**: un'arma al livello massimo può evolversi (tramite forziere). Una **seconda evoluzione** per arma si sblocca completando uno stage in **Difficile** con un personaggio che parte con quell'arma.
- Le armi si **sbloccano** nella pool dei level up completando uno stage o raggiungendo il livello 50 con un personaggio che parte con quell'arma.
- **Passivi**: Zenkai (+15% danno), Vigore (+20 HP), Volo veloce (+8% velocità), Scouter (raccolta), Camera Gravitazionale (−8% ricarica), Armatura, Fagioli Senzu (rigenerazione), Meditazione (+12% XP).

### Esperienza, livelli e trasformazioni
- Ogni livello propone carte (arma, potenziamento, ecc.).
- Ogni personaggio ha una **linea di trasformazioni** (Saiyan, Namecciano, Umano, Androide, Freezer, Cell, Broly, Zamasu, Goku Black, Zamasu Fuso, Caulifla, Kale, Pride Troopers, Dei, Majin): fino a **8 forme** (Ultra Istinto alla fine di alcune linee).
- Le forme scattano ai livelli **14, 24, 36, 50, 66, 84, 104, 128** e dànno bonus a danno, velocità, ricarica, armatura, rigenerazione e riduzione dei danni, oltre a un nuovo aspetto e colore dell'aura.
- Nella Stanza dello Spirito e del Tempo si può **comprare in anticipo** la forma successiva, ma solo se hai raggiunto almeno il 70% del livello richiesto.

### Oggetti, struttura della run e mappa
- **Forzieri** (uno per boss e uno di rifornimento ogni 5 minuti) con ricompense e trinket.
- **Oggetti a terra**: monete, cuore, magnete, potenziamenti temporanei di danno/velocità, XP, fortuna, capsule.
- **Sfere del Drago**: raccogline 7 per esprimere un desiderio (seconda vita, potere, fortuna).
- **Eventi sulla mappa**: Altare del Potere (bonus temporaneo), Sorgente curativa, Altare del Sacrificio (arma +1 in cambio di metà vita), Fonte dell'esperienza, Deposito di monete, Totem, Stanza dello Spirito e del Tempo.
- **Trinket (20)** in 4 rarità: Scouter rotto, Marsupio Senzu, Fascia da allenamento, Stivali gravitazionali, Radar del Drago, Orecchino Potara, Mantello Namecciano, Nyoibo, Nuvola Speedy, Capsula Hoi-Poi, Cuore di Kaioh, Aureola angelica, Orologio della Stanza del Tempo, Sfera del Drago a 4 stelle, Cristallo divino, Armatura reale Saiyan, Anello del Tempo, Specchio di Kaioh, Cuore del Drago, Furia Saiyan.

### Stage, difficoltà e modalità
| # | Stage | Durata | Sblocco |
|---|---|---|---|
| 1 | Pianure Saiyan | 8 min | — |
| 2 | Pianeta Namecc | 10 min | clear Stage 1 |
| 3 | Rovine degli Androidi | 12 min | clear Stage 2 |
| 4 | Dimensione di Buu | 14 min | clear Stage 3 |
| 5 | Torneo del Potere | 15 min | clear Stage 4 |
| 6 | Isola di Muten | 8 min | clear Stage 1 |
| 7 | Pianeta Vegeta | 10 min | clear Stage 2 |
| 8 | Arena del Cell Game | 12 min | clear Stage 3 |
| 9 | Regno degli Dei | 14 min | clear Stage 4 |
| 10 | Inferno | 15 min | clear Stage 5 |

Ogni stage ha **nemici dedicati** (47 tipi totali, ciascuno con IA diversa: inseguimento, tiratori, kamikaze, schermati, schivatori…) e **boss** a tempi prefissati (45 boss totali; es. Raditz, Nappa, Vegeta e la Grande Scimmia nello Stage 1; Freezer nello Stage 2; Cell nello Stage 3; Kid Buu nello Stage 4; Jiren nello Stage 5; Broly nello Stage 10). Una **Guida/Glossario** nel menu descrive ogni nemico e boss.

**Difficoltà**

| | Salute nemici | Danni nemici | Quantità | Zenny |
|---|---|---|---|---|
| Facile | ×0,9 | ×0,7 | ×0,8 | ×0,7 |
| Normale | ×1 | ×1 | ×1 | ×1 |
| Difficile | ×2 | ×1,5 | ×1,4 | ×1,35 |

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
| Saiyan | Goku, Vegeta, Trunks, Gohan, Goten, Gotenks, Vegito, Gogeta, Kefla, Raditz, Nappa, Bardock |
| Namecciano | Piccolo |
| Umano | Crilin, Yamcha, Tensing, Muten, Mr. Satan |
| Androide | C-18, C-17, C-16, Dr. Gero, Androide 21 |
| Freezer | Freezer, Cooler, Capitan Ginyu, Zarbon |
| Cell · Majin | Cell · Majin Bu |
| Pride Troopers | Toppo, Hit, Jiren, Dyspo |
| Dei | Beerus, Whis |
| Linee dedicate | Broly, Zamasu, Zamasu Fuso, Goku Black, Caulifla, Kale |

---

## Build e sviluppo

Servono solo **Python 3** (per il bundler) e, opzionalmente, **Node.js** (per i controlli di sintassi e i test).

```bash
python3 build.py --check      # crea dist/dragon-ball-survivors.html e controlla la sintassi con node
```

Apri `dist/dragon-ball-survivors.html` in un browser moderno (consigliato Chrome/Edge/Firefox): è **autosufficiente**, funziona anche offline (i font Google sono opzionali, c'è un fallback).

Per la **musica del menu** metti il tuo file in `assets/menu.mp3` (vedi [assets/README.md](assets/README.md)); senza il file viene usata una musica sintetizzata.

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
  sprites.js          sprite procedurali (con espressioni)
  audio.js            effetti sonori sintetizzati e musica
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
node tests/sim.js             # simulazione con tutti i personaggi
node tests/death.js 0 normal 6 goku     # bilanciamento: stage, difficoltà, partite, personaggio
node tests/lvfull.js "1,2,5,10" normal  # ritmo di livelli e forme
# e2e/smoke (richiedono puppeteer e un browser): e2e.js e2e2.js e2e3.js e2e4.js smoke5.js smoke6.js smoke7.js
```

> Nota: il bilanciamento è stato verificato con un bot volutamente debole; l'esperienza reale di una persona può essere più facile. Segnalazioni e proposte sono benvenute nelle issue.

## Licenza

Il **codice** è sotto licenza [MIT](LICENSE). Nomi, personaggi e marchi di Dragon Ball **non sono coperti** da questa licenza e appartengono ai rispettivi proprietari ([DISCLAIMER.md](DISCLAIMER.md)).
