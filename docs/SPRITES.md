# Sprite personalizzati (spritesheet PNG)

Il gioco disegna i personaggi giocabili con il codice. Se preferisci **usare la tua grafica** (disegnata da te o da un artista), puoi sostituirla con degli spritesheet PNG: niente da programmare, basta mettere i file in `assets/sprites/` e ricompilare.

> Usa solo immagini che hai disegnato tu o di cui hai i diritti.

## 0. Dove stanno i file (`assets/sprites/`)
```
sprites.json      metadati dei fogli in uso (frame, ancoraggi, rects delle rocce...): lo legge build.py
boss/             fogli usati dal gioco: Tamagami (tama1-3, tama1f-3f) e statue (tamas1-3)
effetti/          fxkame.png (raggio del Kamehameha)
rocce/            rocks.png (Namek), lavarocks.png (Inferno)
props/            <mappa>props.png (ostacoli di nove mappe: beach, plains, namek, sky, hell, redrock, waste, other, arena)
_sorgenti/        arte di partenza dei generatori (non nel gioco, versionata): barre/ mirini/ boss/ rocce/
_inutilizzati/    sprite che il gioco non usa (personaggi, vecchie rocce...): archivio versionato, non incorporato
```
Regola del build (`build.py`): incorpora i `.png` di `assets/sprites/` e delle sue sottocartelle con **nome minuscolo senza spazi** (anche i file sciolti nella cartella principale); salta le cartelle che iniziano con `_` e quelle con maiuscole o spazi (frame grezzi di un pack). Il nome del file è l'id del foglio, quindi deve essere unico in tutta la cartella. Una nuova cartella di fogli (es. `personaggi/`) va aggiunta anche a `.gitignore` con `!assets/sprites/<nome>/`, altrimenti git la ignora. Il build id non cambia spostando un foglio da una cartella all'altra.

## 1. Il modello
- [`sprite_template.png`](sprite_template.png): modello vuoto con le 7 caselle numerate, la linea dei piedi (rossa) e il centro (bianca).
- [`sprite_template_mannequin.png`](sprite_template_mannequin.png): lo stesso con un omino neutro che mostra scala e pose da sostituire.
- Per rigenerarli o cambiare misura: `python3 tools/make_sprite_template.py out.png [--mannequin] [--fw 64] [--fh 96]` (serve Pillow).

Programmi comodi per disegnare pixel art: Aseprite, LibreSprite (gratuito), Piskel (nel browser), Pixelorama.

## 2. Formato del foglio
Una **sola riga di 7 frame** (oppure **10**, o **16** con le pose delle armi, vedi sotto) affiancati, tutti della stessa larghezza, sfondo trasparente:

| Frame | Uso |
|---|---|
| 0 | fermo (idle) |
| 1, 2, 3, 4 | ciclo di camminata |
| 5 | preparazione dell'attacco (carica) |
| 6 | colpo / lancio |
| 7 *(opz.)* | posa di carica della trasformazione (con l'aura/esplosione già disegnata) |
| 8 *(opz.)* | posa di scatto (corpo orizzontale) |
| 9 *(opz.)* | scia di velocità, disegnata dietro lo scatto |
| 10-15 *(opz.)* | pose delle armi: 10 carica del Kamehameha, 11 raggio / colpi a due mani, 12 sfera del Colpo di Ki, 13 lancio del Colpo di Ki, 14 braccia alzate (Genkidama), 15 braccio al cielo. Con i punti `hand` in `sprites.json`. Guida, prompt per un generatore AI e strumento per assemblare il foglio: [`SPRITES_AI.md`](SPRITES_AI.md) |

I frame 7-9 sono facoltativi: nel `sprites.json` il campo `has` elenca quali sono davvero presenti (es. `"has":[8,9]`). Quelli assenti usano la grafica del gioco (aura procedurale, posa normale con immagini residue).

- Misura consigliata: **64 × 96 px per frame** (foglio di 448 × 96). Il personaggio sta in piedi con i **piedi sulla linea rossa** (2 px sopra il bordo basso) e centrato.
- Disegna il personaggio **rivolto verso destra**: il gioco lo specchia da solo quando va a sinistra.
- Il contorno lo disegni tu nello sprite. Il lampeggio quando si viene colpiti, l'ombra, le aure e i bagliori delle trasformazioni li aggiunge il gioco.
- I fogli importati dal pack (vedi sotto) hanno `cols: 10`. Con meno di 7 colonne le pose mancanti usano l'ultima disponibile (1 sola colonna = sprite fisso).

## 3. Nomi dei file
Il nome è l'`id` del personaggio (quello in `src/js/data.js`, es. `goku`, `vegeta`, `piccolo`…).

| File | Quando viene usato |
|---|---|
| `<id>.png` | forma base |
| `<id>_0.png` | prima trasformazione, `<id>_1.png` la seconda, ecc. |

Se per una trasformazione non c'è un file, il gioco usa la **trasformazione precedente più alta disponibile** (o la base). Se un personaggio non ha nessun foglio, mantiene la grafica generata dal codice. Puoi quindi sostituire i personaggi uno alla volta.

La schermata di selezione, il menu animato e il gioco usano gli stessi fogli.

## 4. Misure diverse (opzionale)
Per sprite più grandi crea `assets/sprites/sprites.json`:

```json
{
  "default": { "ppu": 4 },
  "goku":    { "ppu": 4, "ax": 64, "ay": 188 },
  "goku_0":  { "cols": 7 }
}
```

| Campo | Significato | Default |
|---|---|---|
| `ppu` | pixel del foglio per unità di gioco. 2 = frame alto 96 px; 4 = frame alto 192 px (stessa altezza in gioco) | 2 |
| `cols` | numero di frame nella riga | 7 |
| `fw`, `fh` | larghezza/altezza del singolo frame | foglio ÷ `cols`, altezza foglio |
| `ax`, `ay` | punto dei piedi dentro il frame, in px | centro, 2 px dal fondo |

Le voci per un file specifico (`goku_0`) sovrascrivono `default`.

## 5. Provarlo
1. Metti i PNG in `assets/sprites/` (o in una sua sottocartella con nome minuscolo, vedi la sezione 0).
2. `python3 build.py`: stampa una riga `sprites: goku 448x96px, 7 frames` per ogni foglio letto e avvisa se il nome o la larghezza non sono validi.
3. Apri `dist/dragon-ball-survivors.html` e scegli il personaggio.

Su GitHub Pages basta committare i PNG: la build automatica li incorpora.

## 6. Importare un pack di frame (tools/import_pack.py)
Per i personaggi del gioco i fogli sono generati da un pack di frame numerati (una cartella per forma, sfondo bianco o trasparente) messo in `assets/sprites/`. Lo script `tools/import_pack.py` legge `tools/sprite_map.json` (per ogni personaggio e forma: cartella sorgente e numero dei frame di idle, camminata, preparazione, colpo, carica, scatto, scia), scontorna lo sfondo, allinea i piedi, ingrandisce 2× e scrive `<id>[_<forma>].png` + `sprites.json`:

```
python3 tools/import_pack.py --review _cs/rev          # tutti i personaggi, con fogli di controllo
python3 tools/import_pack.py goku vegeta               # solo alcuni
python3 tools/contact.py ...                           # contact sheet numerati per scegliere i frame
```

`--review` salva, per ogni personaggio, un'immagine con tutte le forme: è il modo più rapido per accorgersi di un frame sbagliato (correggi il numero in `sprite_map.json` e rilancia). Le cartelle `_cs/` sono di lavoro e non vanno committate.

I frame di camminata (1-4) **non** vengono presi dal pack (salvo la camminata fatta a mano, qui sotto) (sono pose di combattimento: in loop sembrano un ballo): `import_pack.py` li ricava dal frame fermo, con il busto immobile e le gambe che oscillano dall'anca (`synth_walk`). Per una forma si può regolare l'altezza dell'anca con `"hip"` (0-1, default .62) o tornare ai frame del pack con `"walk_pack": true` nella mappa.

**Camminata fatta a mano.** Dove esiste un ciclo di camminata disegnato apposta (oggi: Goku base e Gogeta, in `assets/sprites/Goku walk/` e `Gogeta walk/`, frame già ritagliati `walk_<n>.png` con sfondo trasparente) la forma lo usa al posto di `synth_walk`: nella mappa `"walk_dir": "<cartella>"`, `"walk_n": [numeri nell'ordine del ciclo]` e `"idle_n"` (frame fermo, usato anche come riferimento di scala: tutti i frame sono scalati come l'idle del pack). I frame oltre il quarto finiscono in colonne extra dopo le 10 standard e `sprites.json` riceve `"walk": [indici dei frame]` (es. `[1,2,3,4,10,11,12,13]`); il gioco li percorre a 12 fotogrammi/s (`Sprites.walkFrame`). Le forme senza `walk_dir` (trasformazioni, altri personaggi) restano sulla camminata sintetica: per estenderla basta una cartella per forma e la stessa voce nella mappa.

**Rocce dei pianeti.** Solo **Namek** e **Inferno** disegnano le rocce da uno sprite atlas (`assets/sprites/rocce/rocks.png` e `rocce/lavarocks.png`); gli altri pianeti hanno ancora le rocce disegnate dal codice. Gli atlas non vengono più dall'importer del pack ma da `tools/make_rocks.py` (`python3 tools/make_rocks.py [namek] [lava]`), che parte dai fogli in `assets/sprites/_sorgenti/rocce/` (`rocks.png`; `lavarocks_sheet.png`, `lavarocks_anim.png`, `lavarocks_anim2.png`), toglie lo sfondo, dimezza i fogli "finto pixel art" 2x, ritaglia ogni roccia e scrive la voce in `sprites.json`: `rects` ([x,y,w,h] di ogni roccia), `kinds` (`{big, mix, spire, crater}` = quali rocce può usare una definizione di ostacolo), `anim` (`{roccia: [rects degli altri fotogrammi]}`, tutti nella stessa tela e con la stessa base), `pp` (rocce che fanno ping-pong), `fps` (5) e `dry` (rocce senza lava: niente bagliore né braci). In `src/js/world.js` `ROCK(peso, tipo)` definisce un ostacolo-roccia (nessun disegno procedurale: non viene piazzato finché l'atlas non è decodificato) e `World.cell` sceglie lo sprite in modo deterministico dal tipo; la **collisione** è un cerchio ricavato dall'impronta (`min(.36·larghezza, .55·altezza)`, scala 1.2 px/px con tetto di 150 px di larghezza) e una roccia viene piazzata solo se **tutta la base sta sulla terraferma** (mai nell'acqua o sulla riva). **A terra**: `Sprites.rockImg` misura la base di ogni sprite (le ultime righe opache: centro, larghezza) e ancora lo sprite lì; `Renderer.drawRock` lo disegna con quel punto sulla posizione dell'ostacolo, affondato di 2 px e tagliato alla linea del suolo (la base è piatta e a filo del terreno), **senza ombra e senza decorazioni aggiunte**: la roccia è solo lo sprite, quindi non fluttua. **Animate** (Inferno: vulcano grande, lastra che cola, doppio cratere, masso, masso medio, guglia, piccolo vulcano): `Sprites.rockFrame` cicla i fotogrammi con una fase diversa per ogni roccia; tutti i fotogrammi usano la base del primo. Le rocce con lava hanno, come la vecchia roccia di lava, un bagliore sul terreno e scintille (`Ambient.puffAt('ember')`, spente con "Riduci effetti"). Per animare altre rocce: [`PROMPT_GEMINI_ROCCE_LAVA.md`](PROMPT_GEMINI_ROCCE_LAVA.md). Test: `tests/rocks_ground.js`; guardare le rocce: `node tests/shot_rocks.js <tema>` (in gioco) e `node tests/shot_rocks_zoom.js <tema>` (una per una, tutti i fotogrammi).

Gli effetti delle armi si importano con la voce `"weapons"` della mappa: `fxkame.png` (raggio del Kamehameha: esplosione alla bocca, corpo, testa) è il frame 46 di *Goku SSJ 2*; il gioco allunga il corpo alla lunghezza del raggio e lo tinge col colore dell'arma (`Sprites.drawBeam` in `src/js/sheets.js`, test `tests/sprites_beam.js`).

Copertura attuale: 32 personaggi/linee hanno grafica dal pack (Goku e le sue forme, Vegeta, Trunks, Gohan, Piccolo, Crilin, Broly, Freezer, Cell, Bu, Bardock, Raditz, Vegito, Gogeta, Gotenks, androidi 16/17/18, Cooler, Toppo, Hit, Kefla, Caulifla, Kale, Beerus, Whis, Jiren, Black, Zamasu, Frost, Turles). Gli altri mantengono la grafica generata dal codice.

## 7. Fogli a griglia e emote (tools/import_grid.py)
Per Goku le 9 forme arrivano da fogli a griglia (una immagine per forma + una con carica/scatto/scia). `tools/import_grid.py --src "assets/sprite test/goku" --out "assets/sprites/Goku nuovo"` taglia i frame (camminata 00-04, kamehameha 10-17, carica 20-23, scatto 30-33, emote `emote/e0-3.png`); poi `tools/import_pack.py goku` usa l'opzione `grid` della mappa:
- carica e scatto sono animati: dopo le 10 colonne standard il foglio ha colonne extra e `sprites.json` contiene `pw` (frame della carica) e `dh` (frame dello scatto); il gioco li scorre con `Sprites.poseFrame` (carica = avanzamento della trasformazione, scatto = durata dello scatto);
- le emote diventano il foglio `emo<id>[_<forma>].png` (4 ritratti affiancati) mostrato nella scelta personaggio (`Sprites.emoSheet`), che cicla le emote della forma mostrata;
- `grid_use: ["power","dash"]` con `keep_sheet` aggiunge solo carica/scatto a un foglio già costruito (usato per Kaioken); `fx_keep` riusa la scia del foglio esistente.

**Ostacoli da foglio (tutte le mappe tranne il Vuoto).** `assets/sprites/props/<tema>props.png` (`beachprops`, `plainsprops`, `namekprops`, `skyprops`, `hellprops`, `redrockprops`, `wasteprops`, `otherprops`, `arenaprops`; Namek e Inferno tengono le loro rocce dagli atlas `rocks`/`lavarocks`: solo i `ROCK` non usano il foglio) è un atlas con gli ostacoli della mappa, uno per rettangolo; qui sotto l'esempio dell'Isola di Muten (gli altri fogli seguono lo stesso schema, nell'ordine delle loro definizioni in `OBSTACLES`; `gd:1` = pavimento che non blocca, come il ring dei Cell Game); `sprites.json` (`beachprops`) ha `rects` ([x,y,w,h]), `anch` (il punto d'appoggio [x,y] di ogni sprite, dentro il suo rettangolo) e `names`. L'ordine è quello di `OBSTACLES.beach` (`world.js`): palma, panchina, Kame House, cespuglio, scalinata, cassa, cassa doppia, barile, lapide con croce, lapide «EROSO», agave, mucchio di rocce. Ogni definizione è avvolta da `IM(def, indice, scala, {ww, lu, nf})`: `scala` = px di mondo per px di sprite (0.42 sulla spiaggia (barile 0.284), circa 0.5 sulle altre mappe, 0.586 la Kame House, 1.173 il ring, 0.5-1.06 sulle Pianure (fonte a bassa risoluzione)), `ww` = larghezza disegnata (la base non deve toccare l'acqua), `lu` = px di mondo per unità d'arte di `ObjLife` (ragni, uccelli e candele sono rimasti dove stavano sull'arte vecchia), `nf` = mai specchiato (scritte). `PROP_SHEET` (`world.js`) dice quale foglio usa quale mappa; `Renderer.getObst` ritaglia gli sprite dall'atlas (li disegna lisciati, a differenza delle rocce) e li rifà quando il foglio viene decodificato; finché non c'è, vale l'arte procedurale. Il **peso** di comparsa è il primo numero di `OB`/`OBS`, la **densità** della mappa `OB_DENS`. L'immagine di partenza è in `assets/sprites/_sorgenti/props/beach_ostacoli.jpg`. Test: `tests/beachprops.js [mappa] [prefisso-screenshot]` (mappa: beach, plains, namek, sky, hell, redrock, waste, other, arena).

Stato attuale (21/10/2026): il gioco incorpora solo i fogli in `assets/sprites/boss/` (Tamagami e statue), `effetti/` (`fxkame.png`) e `rocce/` (`rocks.png` Namek, `lavarocks.png` Inferno), descritti da `assets/sprites/sprites.json`. I fogli dei personaggi (Goku compreso, `goku*.png`, `emogoku*.png`...) e le vecchie rocce sono in `assets/sprites/_inutilizzati/` (ignorata dalla build). Per riattivare un personaggio: copia i suoi `.png` in una cartella di `assets/sprites/` con nome minuscolo (es. `personaggi/`), le sue voci di `_inutilizzati/personaggi/sprites.json` in `sprites.json` e la riga di `tools/sprite_map_archivio.json` in `tools/sprite_map.json`.

## Nota tecnica
I fogli vengono incorporati come base64 nel file HTML (aumenta il peso del file). I test `tests/sprites_pack.js` (tutti i personaggi, base e forma massima) e `tests/sprites_goku.js` (trasformazione e scatto) verificano caricamento, ricerca delle forme e assenza di errori.
