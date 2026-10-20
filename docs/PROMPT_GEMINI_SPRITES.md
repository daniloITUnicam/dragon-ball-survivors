# Prompt per Gemini: sprite che servono (v57)

Cosa serve: **7 personaggi + 5 effetti + 1 icona** (lista in `docs/TODO.md` e `docs/SPRITES_ABILITA.md`).
Regola d'oro: **allega sempre uno screenshot di riferimento dall'anime** del personaggio (Gemini copia molto meglio un'immagine che una descrizione). Se il riferimento e il testo discordano, vince il riferimento.
Tutti i prompt sono in inglese perché Gemini li capisce meglio. Procedura generale e strumento di importazione: [`SPRITES_AI.md`](SPRITES_AI.md).

## 0. Stile (da incollare UNA volta all'inizio della chat)

```
You are going to make 2D game sprites for a Dragon Ball fan game. Keep exactly the same style for everything I ask:
- chibi proportions (the head is about one third of the body height), full body, facing right (side view)
- pixel art look: clean 1 px dark outline, limited palette, flat shading with two tones (base + shadow), no anti-aliasing, no gradients, no blur
- pure flat magenta background (#FF00FF), no ground, no shadow, no text, no frame, no energy effects unless I ask for an effect
- the whole body visible, centered, feet near the bottom edge, square image, same character scale every time
- follow the official anime design of the character (colors, hair, clothes). If I attach a reference image, it has priority over my text.
Reply "ok" and wait for the first request.
```

## 1. Personaggi (7 frame ciascuno)

### 1.1 Riferimento (una richiesta per personaggio, con lo screenshot allegato)

```
Character: [NAME] ([WHERE HE/SHE APPEARS]). [KEY DETAILS]
Draw the idle standing sprite of this character (this will be the reference for all the other frames).
Same style rules as before. Keep it simple and readable at small size.
```

Sostituisci con una riga di questa tabella:

| Personaggio | `[NAME] ([WHERE])` | `[KEY DETAILS]` (riassunto: l'immagine allegata vince) |
|---|---|---|
| C-13 | Android 13 (Dragon Ball Z movie "Super Android 13!") | tall, muscular android in his movie battle outfit |
| Super C-13 | Super Android 13 (same movie, final form) | the huge transformed form after absorbing the chips of 14 and 15, much bigger and bulkier than Android 13 |
| C-14 | Android 14 (same movie) | tall, strong, grim android in his movie outfit |
| C-15 | Android 15 (same movie) | short, stocky android in his movie outfit |
| C-18 | Android 18 (Cell Saga) | short blonde hair, blue eyes, her Cell Saga outfit with the denim vest |
| C-19 | Android 19 (Dr. Gero's android, Android Saga) | round and pale, baggy clothes and pointed hat, energy-absorbing palms |
| C-21 | Android 21 (Dragon Ball FighterZ, lab-coat form) | scientist look with glasses and lab coat |
| C-21 Majin | Android 21 (Dragon Ball FighterZ, Majin form) | pink Majin-style skin, long white hair, her Majin form outfit |
| Kaioshin | Shin, the Supreme Kai of Universe 7 | lavender skin, white hair, pointed ears with the Potara earring, Kai outfit |
| Dai Kaioshin | Grand Supreme Kai (Dai Kaioshin) of Universe 7 | the huge, elderly Grand Supreme Kai |
| Champa | Champa, God of Destruction of Universe 6 | Beerus's twin brother, bigger and chubbier, Egyptian-style God of Destruction outfit |
| Zeno-sama | Zeno, the Omni-King (Dragon Ball Super) | tiny child-like body, big round head, innocent smile, long-sleeved robe with big sleeves |

### 1.2 Frame 0-6 (una richiesta per frame, con il riferimento allegato)

```
Use the attached image as the exact character reference: same face, hair, outfit, colors, proportions, outline thickness and art style.
Redraw the same character, same size and same position in the frame (feet at the same height), facing right, in this pose: [POSE].
Pure flat magenta background (#FF00FF). Do NOT add energy balls, beams, auras, speed lines, shadows or text.
```

`[POSE]` per frame: **0** `idle standing` · **1** `walking, left foot forward` · **2** `walking, passing pose` · **3** `walking, right foot forward` · **4** `walking, passing pose` · **5** `attack wind-up: right fist pulled back` · **6** `attack thrust: right arm punching forward`.
Salva come `c13_00.png` … `c13_06.png` (id: `c13`, `c13s`, `c14`, `c15`, `c18`, `c19`, `c21`, `c21m`, `shin`, `daikai`, `champa`, `zeno`) e mandameli: li converto con `tools/sheet_from_frames.py`.

## 2. Effetti (una richiesta ciascuno, sfondo magenta, bordi netti)

Per tutti: `Pure flat magenta background (#FF00FF). Hard edges, no anti-aliasing, no soft glow fading into the background, no text.` Colori **chiari al centro**: il gioco li ricolora.

**Cannone Speciale di Piccolo** (`fx_sbc.png`)
```
Pixel art game effect, horizontal strip, 4:1 ratio: the Special Beam Cannon (Makankosappo) of Piccolo from Dragon Ball, shooting to the right.
Left part: a small muzzle burst. Middle: a thin beam made of a tight corkscrew spiral (like a drill) of white-yellow energy with violet spiral edges, long and straight, with a clean 1 px dark outline.
Right end: a small pointed tip. Style: 16-bit pixel art, two-tone shading.
```

**Sfera oscura di Toppo** (`fx_dark.png`)
```
Pixel art game effect, 6 frames in a horizontal row, each square: a dark sphere of destruction thrown by Toppo from Dragon Ball Super.
A black core with a dark purple body, a crackling magenta-violet rim and small electric arcs, pulsing slightly from frame to frame. Clean 1 px dark outline, two-tone shading, centered in each frame.
```

**Granata Infernale** (`fx_hz.png`)
```
Pixel art game effect, 4 frames in a horizontal row, each square: a small glowing lime-green energy sphere (the Hellzone Grenade of Piccolo from Dragon Ball), with a bright white-green core and a thin ring around it that tightens and loosens from frame to frame. Clean 1 px dark outline, two-tone shading, centered in each frame.
```

**Aura (ex Kaioken)** (`fx_aura.png`)
```
Pixel art game effect, 6 frames in a horizontal row, each frame portrait 3:4: a flame-like ki aura that surrounds a standing character (the character is NOT drawn, the middle is empty), red-orange with a bright yellow core, flickering upwards with pointed flame tips, from frame to frame the flames move. Clean 1 px dark outline, two-tone shading.
```

**Icona globale dei cimeli** (`trinket_icon.png`, 5 varianti)
```
Pixel art icon, 64x64, a mystic trinket (a small round talisman with a gem in the center, on a short chain) on a rounded-square badge, in a Dragon Ball style. Draw FIVE versions in one row, identical except for the color of the badge and the gem:
1 Common #b8c4d0 (silver-grey), 2 Rare #4ab0ff (blue), 3 Epic #c05aff (purple), 4 Legendary #ffb020 (gold), 5 Mythic #ff3b8a (pink-red, with a few sparkles).
Clean 1 px dark outline, two-tone shading, flat magenta background (#FF00FF).
```

## 3. Icone del negozio — completate (v59)
Tutte le 20 icone del negozio sono nel gioco (`assets/shopicons/<id>.webp`, 128 px): `hp`, `armor`, `speed`, `exp`, `might`, `crit`, `scan`, `broly`, `gold`, `regen`, `magnet`, `cd`, `luck`, `revive`, `proj`, `tslot`, `ban`, `rr`, `sk`, `bn`.
Per sostituirne una basta rigenerarla in stile pixel art Dragon Ball (icona singola centrata, bordo scuro, aura di fiamme, senza testo) e rimettere il file con lo stesso nome; `build.py` la incorpora da solo.

## 4. Cosa fare dopo
Mandami i PNG (anche più per volta) con i nomi indicati: collego io gli effetti nel gioco e converto i personaggi in fogli sprite (`assets/sprites/<id>.png`).
Se Gemini sbaglia il colore o il disegno di un frame, rigenera **solo quel frame** con lo stesso riferimento allegato; non ricominciare da capo.
