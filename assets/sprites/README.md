# assets/sprites

Gli sprite del gioco, divisi per uso. Guida completa: [`docs/SPRITES.md`](../../docs/SPRITES.md). Autori dei personaggi: [`CREDITS.md`](../../CREDITS.md).

| Cartella | Contenuto | Nel gioco | In git |
|---|---|---|---|
| `boss/` | Tamagami `tama1-3`, forma Furia `tama1f-3f`, statue `tamas1-3` | sì | sì |
| `effetti/` | `fxkame.png` (raggio del Kamehameha) | sì | sì |
| `rocce/` | `rocks.png` (Namek), `lavarocks.png` (Inferno, con animazioni) | sì | sì |
| `props/` | `<mappa>props.png` per `beach`, `plains`, `namek`, `sky`, `hell`, `redrock`, `waste`, `other`, `arena` (gli ostacoli di ogni mappa tranne il Vuoto: rects e ancore in `sprites.json`) | sì | sì |
| `terreni/` | `<mappa>ground.png` per `plains`, `namek`, `waste`, `other`, `redrock`, `sky`: il terreno dipinto, una texture uniforme che si ripete senza giunture (32 px d'arte per casella; generata da `python3 tools/make_terrain.py` dalle immagini in `_sorgenti/terreni/`) | sì | sì |
| `mobile/` | `mobjoy.png`: il joystick touch dei telefoni (anello, sfera, scia di fuoco, Sfera del Drago che indica la direzione), ruotato dal gioco a qualsiasi angolo; generato da `python3 tools/make_joystick.py` da `_sorgenti/mobile/joystick.png`. Si decodifica solo su telefono | sì | sì |
| `aure/` | `aura<id>.png`: le aure dipinte (8 fotogrammi in loop) di Kaioken (`kaio`, `kaio2` = x20), Super Saiyan 1-2-3, God, Blue, Ultra Istinto (`uis`, `mui`) e quella bianca (`base`) che il gioco colora per le altre forme; generate da `python3 tools/make_auras.py` dalle griglie 4×2 su nero in `_sorgenti/aure/` (vedi `docs/gemini_goku/AURE_GEMINI.md`) |
| `personaggi/` | `goku.png`, `goku_0`, `goku_1`, `goku_3`…`goku_7.png`: Goku a sprite (base, Kaioken, Super Saiyan 1 e 3, God, Blue, Ultra Istinto segno e completo; il Super Saiyan 2 usa `goku_1`), dal pack `GOKU fases` con `tools/import_pack.py`; la camminata di tutte le forme viene da `_sorgenti/camminata/` (vedi `docs/SPRITES.md`) | sì | sì |
| `sprites.json` | metadati di tutti i fogli sopra (frame, ancoraggi, rects, animazioni) | sì | sì |
| `_sorgenti/` | arte di partenza dei generatori: `barre/` (barre EXP e Salute), `mirini/` (pannelli del TAB), `boss/` (fogli dei Tamagami), `rocce/` (fogli delle rocce), `props/` (immagini di partenza degli ostacoli), `mobile/` (`joystick.png`, il foglio 3x3 del joystick, per `tools/make_joystick.py`), `terreni/` (terreni dipinti dei pianeti, `<mappa>.png/.jpg`, per `tools/make_terrain.py`), `camminata/` (cicli di camminata di Goku ricavati dai video / dalle immagini di Gemini con `tools/walk_from_video.py` e `walk_from_strip.py`: `walk_0` = sprite fermo, `walk_1..8`), `isole/` (isole della Via del Serpente a 1x e `<tipo>_x2.webp` ingrandite da `tools/esrgan_np.py`, per `tools/gen_isles.py`) | no | sì |
| `_inutilizzati/` | sprite che il gioco non usa: `personaggi/` (fogli degli altri personaggi e i vecchi fogli a griglia di Goku, con il loro `sprites.json`), `boss/` (riferimento Furia), `rocce-vecchie/` (i 20 pezzi del vecchio atlas) | no | sì (archivio) |

- `build.py` incorpora i `.png` di queste cartelle e delle altre sottocartelle con nome minuscolo; salta quelle che iniziano con `_` e quelle con maiuscole o spazi. Il nome del file è l'id del foglio, unico in tutta la cartella.
- Per rigenerare i fogli dalle sorgenti: `python3 tools/import_tama.py` (boss), `python3 tools/make_rocks.py` (rocce); le barre e i mirini del gioco (`assets/*.webp`) con `tools/gen_hpbar.py`, `gen_xpbar.py`, `gen_tgt.py`.
- Una cartella nuova di fogli (es. `personaggi/` per riattivare un personaggio) va aggiunta a `.gitignore` con una riga `!assets/sprites/<nome>/`, altrimenti git la ignora.
