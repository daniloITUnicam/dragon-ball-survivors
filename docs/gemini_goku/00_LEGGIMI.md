# Sprite pixel art di Goku con Gemini: come usare questi file

| File | Per chi | Da allegare a Gemini? |
|---|---|---|
| `00_LEGGIMI.md` | per te | no |
| `01_STYLE_AND_FORMAT.md` | Gemini: stile pixel art, misure, formato dell'immagine | sì, a ogni chat |
| `02_FRAMES_AND_POSES.md` | Gemini: i 16 frame del gioco e le pose | sì, a ogni chat |
| `03_REQUESTS.md` | Gemini: le richieste, in ordine | sì, a ogni chat |

I file per Gemini sono in inglese perché li segue meglio.

**Immagini di riferimento.** I file descrivono formato, stile e pose, non l'aspetto del personaggio: quello Gemini lo prende dall'immagine di riferimento che alleghi per ogni forma (9 forme in tutto, tabella qui sotto). Gemini copia molto meglio un'immagine che una descrizione. Usa immagini che puoi usare e rispetta le condizioni d'uso di Gemini.

## Le 9 forme e i nomi dei file da salvare

| Forma | Nel gioco | Salva come |
|---|---|---|
| Base | `goku` | `goku_base_A.png`, `goku_base_B.png`, `goku_base_E.png` |
| Kaioken | `goku_0` | `goku_kaioken_A.png`, `_B`, `_E` |
| Super Saiyan | `goku_1` | `goku_ssj_A.png`, `_B`, `_E` |
| Super Saiyan 2 | `goku_2` | `goku_ssj2_A.png`, `_B`, `_E` |
| Super Saiyan 3 | `goku_3` | `goku_ssj3_A.png`, `_B`, `_E` |
| Super Saiyan God | `goku_4` | `goku_god_A.png`, `_B`, `_E` |
| Super Saiyan Blue | `goku_5` | `goku_blue_A.png`, `_B`, `_E` |
| Ultra Istinto (segno) | `goku_6` | `goku_uisign_A.png`, `_B`, `_E` |
| Ultra Istinto Completo | `goku_7` | `goku_mui_A.png`, `_B`, `_E` |

`A` = frame 0-7 (fermo, camminata, pugno, posa della trasformazione), `B` = frame 8-15 (scatto, scia, pose delle armi), `E` = 4 ritratti per la scelta del personaggio (facoltativo).

## Procedura

1. **Forma base, foglio A.** Nuova chat: allega `01`, `02`, `03` e il riferimento della forma base, poi scrivi:
   `Read the three attached files carefully. Then do request R1.`
2. **Controlla** con la lista qui sotto. Se un solo frame è sbagliato non rifare tutto:
   `Fix only cell 3 (frame 2): the left foot must be on the baseline. Keep every other cell identical.`
3. **Forma base, foglio B.** Allega il foglio A appena salvato e scrivi `Do request R2.` (qui Gemini mette i puntini ciano sulle mani).
4. **Ritratti** (facoltativo): `Do request R3.`
5. **Ogni trasformazione.** Allega **il foglio A della forma base** e il riferimento della forma, poi scrivi `Do request R4 for: Super Saiyan`. Poi il foglio B della base + riferimento: `Do request R5 for: Super Saiyan`. Ritratti: `Do request R6 for: Super Saiyan`.
   Partire sempre dai fogli della base (non da una forma già trasformata) tiene identiche pose, misure e posizioni in tutte le forme.

Se dopo qualche richiesta Gemini comincia a confondersi (cambia scala, aggiunge aure), apri una chat nuova e riallega i tre file.

## Lista di controllo per ogni immagine

- 8 sprite, 4 per riga su 2 righe, separati: nessuno tocca un altro o il bordo.
- Sfondo magenta pieno, senza griglie, cornici, numeri o scritte.
- Tutti rivolti a destra, corpo della stessa grandezza, piedi alla stessa altezza.
- Nessuna aura, sfera, raggio, fiamma od ombra a terra. Unica eccezione: il frame 9 (cella 2 del foglio B), che contiene solo le linee di velocità.
- Foglio B della **base**: puntini ciano nelle celle 3, 4, 5, 6 e 7. Nelle trasformazioni **niente puntini**: riuso le posizioni della base.
- Pixel art vera: pixel quadrati e netti, senza sfumature morbide.

## Quando hai le immagini

Mandami i PNG con quei nomi, anche una forma alla volta. Li taglio io: tolgo lo sfondo, allineo i piedi, leggo i puntini e collego i fogli nel gioco al posto della grafica generata dal codice.
Se Gemini non riesce a mettere 8 sprite in un'immagine, va bene anche un frame per immagine. In quel caso usa i nomi `goku_base_00.png` … `goku_base_15.png` e la richiesta R7.
