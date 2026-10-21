# Prompt per Gemini: rocce di lava animate (Inferno)

Servono per le rocce dell'**Inferno** che ancora sono ferme. Il gioco usa già 7 rocce animate (vulcano grande, lastra che cola, doppio cratere, masso, masso medio che cola, guglia, piccolo vulcano): le immagini sono in `assets/sprites/_archivio/lavarocks_anim.png` e `lavarocks_anim2.png`, il foglio statico è `lavarocks_sheet.png`. Procedura di importazione: [`SPRITES.md`](SPRITES.md) ("Rocce dei pianeti") e `tools/make_rocks.py`.

Regola d'oro: **allega sempre il foglio statico `lavarocks_sheet.png`** (e, per lo stile del loop, uno dei fogli animati già fatti). Se l'immagine e il testo discordano, vince l'immagine. I prompt sono in inglese perché Gemini li capisce meglio.

## 1. Quali rocce mancano

Numeri = numero della roccia nell'atlas `lavarocks.png` (`node tests/shot_rocks_zoom.js hell` le mostra una per una con il numero nel nome del file).

| Roccia | Animazione da chiedere | Frame |
|---|---|---|
| lastre grandi (0, 1, 2, 5) | le crepe di lava pulsano (si accendono e si spengono a turno), una goccia scende da una crepa | 4 |
| cumulo/cono di macerie (7, 18) | brace che si accende e si spegne tra i sassi, un po' di fumo | 4 |
| guglie con la punta incandescente (11, 12, 13, 14) | la punta brilla più forte / più debole, una scintilla sale | 3-4 |
| piccoli crateri e rocce con lava (10, 15, 16, 19) | la lava del cratere ribolle, una bolla scoppia, un filo di fumo | 3-4 |
| sassi piccoli (20-27) | **non servono**: sono volutamente fermi (sassi spenti, senza lava) | - |

## 2. Prompt (da incollare con il foglio statico allegato)

```
Make a looping pixel-art sprite animation sheet for a 2D game, matching the attached sheet of lava rocks EXACTLY (same rocks, same palette, same dark outline, same two-tone shading, same chunky pixels).

Rocks to animate: [LIST, e.g. "the three big flat slabs on the top row"].
Layout: ONE ROW PER ROCK, 4 COLUMNS = 4 frames of its loop. Every cell has the same size and the rock is drawn at the same size and in the same position in all four cells of its row (the base of the rock never moves, nothing is cropped).
What changes between frames - ONLY the lava, glow, embers and smoke: [ANIMATION, e.g. "the lava cracks pulse: frame 1 dim, frame 2 brighter, frame 3 brightest with a drip leaving the lowest crack, frame 4 dim again"]. The rock's own shape and outline stay identical in all frames.
The loop must be seamless: frame 4 flows back into frame 1 (do not make a final "rest" frame that differs from the first).
Style: pixel art look, hard pixel edges, no anti-aliasing, no blur, no gradients, no motion lines, no text, no labels, no grid lines, no ground, no cast shadow.
Background: ONE flat uniform dark grey (#151515) behind every sprite, with some empty margin around each rock.
Square image, 1024x1024.
```

Sostituisci `[LIST]` e `[ANIMATION]` con una riga della tabella. Una richiesta per gruppo (non mescolare lastre e guglie nella stessa immagine: il modello tende a cambiare la forma).

## 3. Controlli prima di consegnare l'immagine

- Lo sfondo è **un solo grigio piatto** (#151515, tolleranza ±8): è così che `tools/make_rocks.py` lo toglie. Se è sfumato o a scacchi, rigenera.
- La roccia ha **la stessa forma in tutti i frame** (cambiano solo lava, bagliore, fumo, brace). Se la forma "balla", la base si sposta e la roccia sembra scivolare a terra.
- Frame 4 → frame 1 deve essere un passaggio morbido (il gioco li ripete in loop a 5 fotogrammi al secondo; per la roccia 8 va avanti e indietro: ping-pong).
- Le rocce devono toccare terra: la base piatta, nessuna ombra disegnata (il gioco non ne aggiunge: la base deve già sembrare appoggiata).

## 4. Dopo aver generato

1. Salva l'immagine in `assets/sprites/_archivio/lavarocks_anim3.png`.
2. In `tools/make_rocks.py` aggiungi le righe alla lista `ANIM` (riga/colonna di ogni roccia nel nuovo foglio e numero della roccia statica a cui appartiene), poi `python3 tools/make_rocks.py lava`.
3. `DBS_AUDIO=link python3 build.py`, `node tests/shot_rocks_zoom.js hell` per guardare ogni roccia da vicino e `python3 tools/run_tests.py rocks` per il test.
