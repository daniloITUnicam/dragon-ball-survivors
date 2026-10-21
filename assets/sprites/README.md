# assets/sprites

Gli sprite del gioco, divisi per uso. Guida completa: [`docs/SPRITES.md`](../../docs/SPRITES.md). Autori dei personaggi: [`CREDITS.md`](../../CREDITS.md).

| Cartella | Contenuto | Nel gioco | In git |
|---|---|---|---|
| `boss/` | Tamagami `tama1-3`, forma Furia `tama1f-3f`, statue `tamas1-3` | sì | sì |
| `effetti/` | `fxkame.png` (raggio del Kamehameha) | sì | sì |
| `rocce/` | `rocks.png` (Namek), `lavarocks.png` (Inferno, con animazioni) | sì | sì |
| `props/` | `beachprops.png`, `redrockprops.png`, `wasteprops.png`, `otherprops.png`, `arenaprops.png` (gli ostacoli di Isola di Muten, Pianeta Vegeta, Rovine degli Androidi, Dimensione di Bu, Arena dei Cell Game: rects e ancore in `sprites.json`) | sì | sì |
| `sprites.json` | metadati di tutti i fogli sopra (frame, ancoraggi, rects, animazioni) | sì | sì |
| `_sorgenti/` | arte di partenza dei generatori: `barre/` (barre EXP e Salute), `mirini/` (pannelli del TAB), `boss/` (fogli dei Tamagami), `rocce/` (fogli delle rocce), `props/` (immagini di partenza degli ostacoli) | no | sì |
| `_inutilizzati/` | sprite che il gioco non usa: `personaggi/` (fogli di Goku e degli altri, con il loro `sprites.json`), `boss/` (riferimento Furia), `rocce-vecchie/` (i 20 pezzi del vecchio atlas) | no | sì (archivio) |

- `build.py` incorpora i `.png` di queste cartelle e delle altre sottocartelle con nome minuscolo; salta quelle che iniziano con `_` e quelle con maiuscole o spazi. Il nome del file è l'id del foglio, unico in tutta la cartella.
- Per rigenerare i fogli dalle sorgenti: `python3 tools/import_tama.py` (boss), `python3 tools/make_rocks.py` (rocce); le barre e i mirini del gioco (`assets/*.webp`) con `tools/gen_hpbar.py`, `gen_xpbar.py`, `gen_tgt.py`.
- Una cartella nuova di fogli (es. `personaggi/` per riattivare un personaggio) va aggiunta a `.gitignore` con una riga `!assets/sprites/<nome>/`, altrimenti git la ignora.
