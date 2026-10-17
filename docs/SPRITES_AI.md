# Pose delle armi: sprite opzionali con un generatore AI (Gemini & co.)

**Non serve nessuno sprite per far funzionare le animazioni.** Il gioco disegna da solo le braccia dei personaggi procedurali (`src/js/pose.js`): il Kamehameha si carica con le due mani anche mentre il personaggio cammina, il Colpo di Ki cresce sul palmo e parte dalla mano, e le altre armi hanno la loro posa (Genkidama, Taiyoken, fulmini…).
Questa guida serve solo se vuoi **grafica tua** (disegnata a mano o fatta con un'AI) per quelle pose: i frame **10-15** del foglio sprite, che si aggiungono ai frame 0-9 già descritti in [`SPRITES.md`](SPRITES.md).

> Usa solo immagini che hai creato tu o di cui hai i diritti. Controlla le condizioni d'uso del generatore che scegli.

## 1. I frame da fare

I frame 0-6 (fermo, camminata, attacco) sono quelli di sempre. I nuovi sono **facoltativi**: se un frame manca il gioco usa i frame normali. **Disegna sempre il personaggio rivolto verso destra**; il gioco lo specchia quando mira a sinistra.

| Frame | Quando si vede | Come deve essere la posa |
|---|---|---|
| **10** | Kamehameha: carica (0,5-0,65 s) | Due mani a coppa davanti al petto, palmi che si guardano, **spazio vuoto tra le mani** (lo riempie la sfera disegnata dal gioco), gambe piegate, busto in avanti |
| **11** | Kamehameha / Big Bang: raggio in uscita; colpi a due mani (Doppio Sunday, Cannone) | Entrambe le braccia **tese in avanti**, polsi uniti, palmi aperti in avanti, gambe larghe, espressione feroce |
| **12** | Colpo di Ki: la sfera si carica | Mano destra davanti alla spalla, palmo aperto verso l'avanti (la sfera è sul palmo: lasciala vuota), braccio sinistro rilassato |
| **13** | Colpo di Ki: lancio | Braccio destro **teso in avanti**, palmo aperto appena lanciato, busto in avanti, braccio sinistro indietro |
| **14** | Genkidama: carica | Entrambe le braccia **alzate sopra la testa**, mani aperte verso l'alto, sguardo in su |
| **15** | Fulmine Angelico, Meteore, Sfera della Distruzione | Un braccio alzato verso il cielo (indice puntato), l'altro sul fianco |

Altre pose (Taiyoken, Impatto Potente…) usano i frame normali: non servono sprite dedicati.

**Il punto della mano.** Nei frame 10, 12, 13, 14 il gioco deve sapere *dove* disegnare la sfera di energia o da dove parte il colpo. Si indica con un **puntino ciano puro (#00FFFF)** dipinto nel frame, grosso 6-10 px (sul disegno grande), che lo strumento (§4) cancella e converte in coordinate:

| Frame | Dove mettere il puntino |
|---|---|
| 10 | al centro dello spazio tra le due mani (dove sta la sfera) |
| 12 | al centro del palmo, un po' più avanti (dove cresce la sfera) |
| 13 | al centro del palmo teso (da qui parte il colpo) |
| 14 | sopra la testa, circa un'altezza di testa sopra i capelli (dove compare la sfera) |
| 11, 15 | facoltativo |

Senza il puntino il frame viene usato lo stesso, ma la sfera/il colpo restano nella posizione standard (petto).

## 2. Procedura con un generatore AI

Il segreto è la **coerenza**: il personaggio deve restare identico in tutti i frame. Quindi non descrivere il personaggio ogni volta: crea **un'immagine di riferimento** e allegala a *ogni* richiesta.

1. **Riferimento.** Genera (o disegna) un'immagine del personaggio fermo, rivolto a destra, con il prompt del §3.1. Ripeti finché stile, proporzioni e colori vanno bene. Questa è la tua "bibbia".
2. **Un frame per richiesta.** Allega l'immagine di riferimento e usa il prompt di posa del §3.2 con la descrizione del frame. Se il generatore ha la modalità "modifica immagine" / "image editing" (in Gemini: carica l'immagine e chiedi la modifica), usala: tiene meglio il personaggio.
3. **Controlla subito.** Capelli, vestiti, colori della cintura e dei guanti, spessore del contorno: se un frame deriva, rigenera *quel* frame (non ricominciare da capo).
4. **Stessa inquadratura.** Chiedi sempre figura intera, piedi in basso al centro, sfondo piatto. Lo strumento allinea comunque i piedi, ma una scala molto diversa tra i frame si nota.
5. **Salva i file numerati**: `frames/goku/00.png` (fermo), `01.png`…`06.png`, e poi `10.png`…`15.png`. Basta *un* numero nel nome (`goku_12.png` va bene).
   Per la camminata (1-4) puoi chiedere "walk cycle, frame 1 of 4: left foot forward…" oppure usare i frame che hai già.

Suggerimenti:
- Sfondo **magenta pieno #FF00FF** (o verde #00FF00): si toglie da solo. Evita sfondi sfumati o con ombre.
- Niente **effetti** nei frame (sfere, raggi, aure, linee di velocità, ombre): li aggiunge il gioco.
- Per la pixel art puoi usare l'opzione `--nearest` dello strumento e una dimensione di frame piccola (96 px di altezza); per uno stile "cartoon" liscio lascia il filtro di default e usa 192 px.
- Se l'AI aggiunge una sfera o un raggio, scrivi di nuovo "no energy ball, no beam, no glow": l'area tra le mani deve restare vuota.

## 3. I prompt

Sono in inglese perché i generatori li capiscono meglio; sostituisci le parti tra `[parentesi]`.

### 3.1 Riferimento (una volta sola)

```
Game sprite of [CHARACTER NAME] from Dragon Ball, full body, standing idle, facing right (side view),
chibi proportions (the head is about one third of the body height), [pixel art with a clean 1 px dark outline,
limited palette, flat shading with two tones, no anti-aliasing | clean cartoon style with a thick dark outline and flat colors],
[outfit and colors: orange gi, blue undershirt and wristbands, blue belt and boots, black spiky hair].
Pure flat magenta background (#FF00FF), no ground, no shadow, no text, no energy effects.
The whole body is visible, centered, feet near the bottom edge. Square image.
```

### 3.2 Posa (una richiesta per frame, con il riferimento allegato)

```
Use the attached image as the exact character reference: same face, hair, outfit, colors, proportions,
outline thickness and art style. Redraw the same character, same size and same position in the frame
(feet at the same height), facing right, in this new pose: [POSE].
Pure flat magenta background (#FF00FF). Do NOT add energy balls, beams, auras, speed lines, shadows or text.
[MARKER INSTRUCTION]
```

Sostituisci `[POSE]` e `[MARKER INSTRUCTION]` con una di queste coppie:

**Frame 10 - Kamehameha, carica**
- POSE: `both arms bent in front of the chest-low, hands cupped together with the palms facing each other and a clear empty gap between them, as if holding an invisible sphere; knees bent, torso leaning slightly forward, determined expression`
- MARKER: `Paint one small pure cyan (#00FFFF) dot exactly in the middle of the empty gap between the hands.`

**Frame 11 - Kamehameha, sparo**
- POSE: `both arms fully extended straight forward to the right, wrists together, open palms facing forward, wide stable stance with legs apart, torso leaning forward, fierce shouting expression`
- MARKER: `Paint one small pure cyan (#00FFFF) dot at the center of the palms.`

**Frame 12 - Colpo di Ki, la sfera si carica**
- POSE: `right hand raised in front of the shoulder with the open palm facing forward, as if holding a small invisible ball on the palm; left arm relaxed down and slightly back; calm focused expression`
- MARKER: `Paint one small pure cyan (#00FFFF) dot slightly in front of the center of the right palm.`

**Frame 13 - Colpo di Ki, lancio**
- POSE: `right arm fully extended straight forward with the open palm facing forward, just after throwing an energy blast; left arm pulled back; torso leaning forward`
- MARKER: `Paint one small pure cyan (#00FFFF) dot at the center of the extended right palm.`

**Frame 14 - Genkidama**
- POSE: `both arms raised straight up above the head, open hands pointing up, looking up at the sky, legs together`
- MARKER: `Paint one small pure cyan (#00FFFF) dot above the head, at about one head-height above the top of the hair, between the hands.`

**Frame 15 - Mano al cielo**
- POSE: `right arm raised straight up pointing at the sky with the index finger, left hand on the hip, looking up`
- MARKER: *(nessuno)*

Frame 0-6 (se li vuoi rifare): `idle standing`, `walking, left foot forward`, `walking, passing pose`, `walking, right foot forward`, `walking, passing pose`, `attack wind-up: right fist pulled back`, `attack thrust: right arm punching forward`.

## 4. Dai frame al foglio (strumento incluso)

```
python3 tools/sheet_from_frames.py goku frames/goku --write-json
```

Lo script (`tools/sheet_from_frames.py`, serve Pillow + numpy + scipy):
- toglie lo sfondo piatto (o usa la trasparenza che c'è già),
- legge e **cancella i puntini ciano**, salvando le coordinate,
- dà a tutti i frame la **stessa scala** (decide il frame più alto, compresa la sfera sopra la testa del frame 14), allinea i **piedi** e il **centro delle gambe**,
- scrive `assets/sprites/goku.png` (una riga di frame) e stampa la voce per `sprites.json` (`cols`, `fw`, `fh`, `ppu`, `ax`, `ay`, `has`, `hand`); con `--write-json` la unisce a `assets/sprites/sprites.json`.

Opzioni utili: `--fh 96 --nearest` (pixel art piccola), `--fh 192` (default), `--fw` (larghezza del frame se le braccia tese escono), `--margin` (spazio sopra la figura più alta), `--units` (altezza del personaggio in unità di gioco, default 44 come i procedurali).
Per una trasformazione usa l'id con il numero: `python3 tools/sheet_from_frames.py goku_0 frames/goku_ssj ...`.

Poi, come per tutti gli sprite: `python3 build.py` (stampa una riga `sprites: goku …` per foglio) e apri `dist/dragon-ball-survivors.html`. Su GitHub Pages basta committare il PNG e `sprites.json`.

## 5. Cosa succede nel gioco

- Frame **10** durante la carica del Kamehameha (la sfera cresce nel punto ciano), **11** per tutta la durata del raggio, **12** mentre la sfera del Colpo di Ki cresce (e il frame **13** per il lancio, con il colpo che parte dal punto ciano), **14** per la Genkidama, **15** per i fulmini e le meteore.
- Il personaggio si gira verso il bersaglio mentre compie il gesto.
- Quando un frame di posa è attivo sostituisce anche la camminata (le gambe del frame di posa restano ferme): se vuoi gambe in movimento durante il gesto, i personaggi procedurali lo fanno già; con gli sprite disegni tu le gambe nella posa.
- Un foglio senza i frame 10-15 funziona come prima: i colpi di Ki partono dal petto e il Kamehameha usa i frame normali, come prima.

## 6. Problemi comuni

| Sintomo | Causa / rimedio |
|---|---|
| Il personaggio "salta" tra un frame e l'altro | Scale diverse nei frame generati: rigenera quello fuori scala; lo strumento allinea i piedi ma non può correggere una posa disegnata molto più grande |
| Bordo magenta intorno al personaggio | Sfondo non piatto o anti-aliasing: usa `--nearest`, oppure rigenera con "no anti-aliasing, hard edges" |
| La sfera compare nel punto sbagliato | Puntino ciano fuori posto: spostalo e rilancia lo strumento (o modifica a mano `hand` in `sprites.json`: coordinate in px del frame, personaggio rivolto a destra) |
| Il puntino ciano resta visibile | Il colore non era ciano puro: ridipingilo #00FFFF più grande (almeno 6 px) |
| Il frame è tagliato in alto | Braccia alzate più alte dell'idle: aumenta `--margin` |
