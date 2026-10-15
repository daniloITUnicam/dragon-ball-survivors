# Sprite personalizzati (spritesheet PNG)

Il gioco disegna i personaggi giocabili con il codice. Se preferisci **usare la tua grafica** (disegnata da te o da un artista), puoi sostituirla con degli spritesheet PNG: niente da programmare, basta mettere i file in `assets/sprites/` e ricompilare.

> Usa solo immagini che hai disegnato tu o di cui hai i diritti.

## 1. Il modello
- [`sprite_template.png`](sprite_template.png): modello vuoto con le 7 caselle numerate, la linea dei piedi (rossa) e il centro (bianca).
- [`sprite_template_mannequin.png`](sprite_template_mannequin.png): lo stesso con un omino neutro che mostra scala e pose da sostituire.
- Per rigenerarli o cambiare misura: `python3 tools/make_sprite_template.py out.png [--mannequin] [--fw 64] [--fh 96]` (serve Pillow).

Programmi comodi per disegnare pixel art: Aseprite, LibreSprite (gratuito), Piskel (nel browser), Pixelorama.

## 2. Formato del foglio
Una **sola riga di 7 frame** affiancati, tutti della stessa larghezza, sfondo trasparente:

| Frame | Uso |
|---|---|
| 0 | fermo (idle) |
| 1, 2, 3, 4 | ciclo di camminata |
| 5 | preparazione dell'attacco (carica) |
| 6 | colpo / lancio |

- Misura consigliata: **64 × 96 px per frame** (foglio di 448 × 96). Il personaggio sta in piedi con i **piedi sulla linea rossa** (2 px sopra il bordo basso) e centrato.
- Disegna il personaggio **rivolto verso destra**: il gioco lo specchia da solo quando va a sinistra.
- Il contorno lo disegni tu nello sprite. Il lampeggio quando si viene colpiti, l'ombra, le aure e i bagliori delle trasformazioni li aggiunge il gioco.
- Con meno di 7 colonne le pose mancanti usano l'ultima disponibile (1 sola colonna = sprite fisso).

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
1. Metti i PNG in `assets/sprites/`.
2. `python3 build.py`: stampa una riga `sprites: goku 448x96px, 7 frames` per ogni foglio letto e avvisa se il nome o la larghezza non sono validi.
3. Apri `dist/dragon-ball-survivors.html` e scegli il personaggio.

Su GitHub Pages basta committare i PNG: la build automatica li incorpora.

## Nota tecnica
I fogli vengono incorporati come base64 nel file HTML (aumenta il peso del file). Il test `tests/sprites_pack.js` verifica caricamento, ricerca delle forme e assenza di errori.
