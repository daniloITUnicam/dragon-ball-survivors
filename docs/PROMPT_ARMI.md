# Prompt per rifare la grafica delle armi

Riferimento visivo: `armi_frame.zip` (12 frame per arma e per livello) e `armi_panoramica.jpg`.
Oggi le armi sono disegnate dal codice; con questi fogli ogni arma usa un'immagine. Quando un foglio è pronto mettilo in
`assets/sprites/effetti/` con il nome indicato (es. `fxki.png`, `fxki_1.png`, `fxki_2.png`) e lo collego al gioco.

## Come usarli

1. Scrivi all'AI il **prompt dell'arma** e, subito dopo, il **blocco comune** del suo tipo (A–F, sotto).
2. Allega come riferimento il `_tutti_i_frame.jpg` della cartella corrispondente: serve per forma, tempi e colori, non da copiare.
3. Un livello alla volta (base, evoluzione 1, evoluzione 2). Quando hai la base, per le evoluzioni allega anche il foglio base e chiedi
   *"same sprite sheet, same layout and frame size, evolved version: …"*: così i tre restano coerenti.
4. Prompt in inglese: i generatori di immagini lo seguono meglio.

**Sfondo.** Quasi tutti gli effetti luminosi il gioco li disegna in modo additivo (si sommano alla scena): per questi chiedi uno
**sfondo nero pieno (#000000)**, che nel gioco sparisce da solo e che le AI fanno molto meglio della trasparenza. Solo dove il blocco
dice *trasparente* (oggetti solidi: lancia, boomerang, proiettile del cannone, meteora) serve un PNG con sfondo trasparente.

**Controllo prima di mandarmelo:** tutti i frame della stessa misura, in griglia regolare, l'effetto centrato nello stesso punto in ogni
frame, niente testo, niente bordi tra i frame, niente personaggi.

---

## Blocchi comuni (da incollare dopo il prompt dell'arma)

**A · Proiettile in volo (loop)**
```
2D game VFX sprite sheet, 8 frames in a single horizontal row, each frame 128x128 px, the projectile centered in every frame and
flying to the RIGHT, seamless looping animation (frame 8 flows back into frame 1). Anime cel-shaded energy style: white-hot core,
saturated colored body, soft outer glow, a few crisp spark shapes. Pure solid black background (#000000), no gradient in the
background, no text, no characters, no border between frames, consistent scale in all frames.
```

**B · Raggio (tre parti: partenza, corpo ripetibile, punta)**
```
2D game VFX sprite sheet for an energy beam that travels to the RIGHT, 3 rows x 6 frames, every cell 256x128 px.
Row 1: the muzzle burst at the beam origin (left side of the cell), looping. Row 2: a beam BODY segment that tiles seamlessly
left-to-right (its left and right edges must match exactly so it can repeat), looping flow of energy. Row 3: the beam tip / impact
splash (right side of the cell), looping. Same beam thickness and vertical center in all rows. Anime cel-shaded energy: white core,
colored body, thin bright edge lines, soft glow. Pure solid black background (#000000), no text, no characters, no border between cells.
```

**C · Area vista dall'alto (cerchio a terra)**
```
2D game VFX sprite sheet, top-down 3/4 view (circles slightly flattened vertically, ratio 1 : 0.8), 8 frames in a single horizontal
row, each frame 256x256 px, the effect centered, looping animation. Anime cel-shaded energy style, bright rim, darker transparent-
looking interior, sparks and particles. Pure solid black background (#000000), no text, no characters, no border between frames.
```

**D · Fendente / arco ravvicinato**
```
2D game VFX sprite sheet, 6 frames in a single horizontal row, each frame 256x256 px, a sweeping arc around the center of the frame,
starting on the left and finishing on the right (one-shot animation: build-up, full arc, fade-out). Anime cel-shaded slash style:
sharp crescent shape, white leading edge, colored trail that thins out, small speed lines. Pure solid black background (#000000),
no text, no characters, no border between frames.
```

**E · Esplosione / impatto (una volta)**
```
2D game VFX sprite sheet, 8 frames in a single horizontal row, each frame 192x192 px, explosion centered, one-shot animation:
flash, expanding blast, ring of debris and sparks, fading smoke. Anime cel-shaded explosion style with bold shapes and a white-hot
center. Pure solid black background (#000000), no text, no characters, no border between frames.
```

**F · Oggetto solido in volo (sfondo trasparente)**
```
2D game sprite sheet, 8 frames in a single horizontal row, each frame 128x128 px, the object centered and pointing / flying to the
RIGHT, looping animation. Anime cel-shaded, clean dark outline, 3-4 shades per color, glowing energy parts. TRANSPARENT background
(PNG with alpha), no shadow on the ground, no text, no characters, no border between frames.
```

---

## Le armi

Per ogni arma: file da produrre, blocco comune, prompt base, prompt delle due evoluzioni. Colore principale tra parentesi.

### 1 · Colpo di Ki / Ki Blast (giallo #ffd23f) — `fxki` · blocco A
- **Base:** `A small round ki energy blast, golden yellow (#ffd23f) with a white core, a short tapered tail behind it and tiny crackling sparks.`
- **Evo 1 (Supernova di Ki):** `Bigger, brighter piercing ki blast, golden yellow with white-hot core, a longer comet tail and a thin spinning ring of energy around it.`
- **Evo 2 (Ki Cataclisma):** `Large fierce piercing ki blast, golden yellow and white with orange edges, long comet tail, electric arcs crackling around the sphere.`
- In più, blocco E, `fxkihit`: `small golden ki impact burst, yellow (#ffd23f) and white`.

### 2 · Kamehameha (azzurro #59c8ff) — `fxkame` · blocco B
- **Base:** `Classic anime energy wave, cyan blue (#59c8ff) with a white core, a spherical burst at the origin, smooth flowing body, a round crackling tip.`
- **Evo 1 (Kamehameha Divino):** `Gigantic electrified energy wave, cyan blue and white, thick body wrapped in lightning arcs, bigger origin sphere with spikes of light.`
- **Evo 2 (Kamehameha Ultra):** `Massive energy wave, even wider, cyan and white with a faint golden outer edge, heavy lightning, shock rings at the origin.`

### 3 · Disco Distruttore / Destructo Disc (arancio #ffb13b) — `fxdisc` · blocco A
- **Base:** `A flat spinning energy disc seen slightly from above, orange-yellow (#ffb13b) with a razor-thin bright white edge and a translucent center, spinning motion streaks.`
- **Evo 1 (Kienzan Supremo):** `Larger spinning energy disc, orange and white, sharper serrated glowing rim, stronger spin streaks.`
- **Evo 2 (Kienzan Cataclisma):** `Giant spinning energy disc, orange, white and a hint of red, double rim, sparks flying off the edge.`

### 4 · Genkidama / Spirit Bomb (azzurro #8ad8ff) — `fxspirit` (sfera) · blocco A con frame 192x192, più `fxspirithit` · blocco E
- **Base:** `A huge glowing sphere of gathered energy, pale sky blue (#8ad8ff) with a bright white center, soft swirling light on its surface, small motes of light being drawn into it.`
- **Evo 1 (Genkidama Suprema):** `Even larger sphere of energy, pale blue and white, rippling surface, a halo of light around it.`
- **Evo 2 (Genkidama Divina):** `Enormous electric sphere of energy, pale blue and white, lightning crawling on its surface and arcing outward.`
- Impatto: `massive pale blue energy explosion with a dome of light and lightning tendrils`.

### 5 · Aura (rosso #ff5a3d) — `fxaura` · blocco C
- **Base:** `A burning energy aura on the ground around a character (empty center), red-orange (#ff5a3d) flames rising from a glowing ring, small embers.`
- **Evo 1 (Aura Divina):** `Huge burning aura ring, red-orange with a golden inner glow, taller flames, embers spiraling.`
- **Evo 2 (Aura del Dio):** `Immense aura, red, gold and white, double ring of flames, intense heat shimmer, sparks.`

### 6 · Taiyoken / Solar Flare (bianco caldo #fff7b0) — `fxflare` · blocco E
- **Base:** `A blinding flash of light: a white and pale yellow (#fff7b0) starburst with long sharp rays, expanding quickly and fading.`
- **Evo 1 (Taiyoken Supremo):** `Bigger blinding starburst, white and pale yellow, more rays, a bright ring wave.`
- **Evo 2 (Taiyoken Assoluto):** `Overwhelming flash, white and pale gold, a full sun disc with rays across the whole frame, double ring wave.`

### 7 · Spada / Sword (bianco azzurro #cfe8ff) — `fxslash` · blocco D
- **Base:** `A sword slash arc in front of the character (about 120 degrees), icy white-blue (#cfe8ff) with a sharp white edge.`
- **Evo 1 (Lama Suprema):** `A full 360-degree sword slash ring, white-blue, sharp, with a faint second trail.`
- **Evo 2 (Lama del Dio):** `A fast full 360-degree slash, white-blue and silver, double ring, glittering sparks along the edge.`

### 8 · Colpi Eccentrici / Homing Orbs (rosa #ff6bd0) — `fxhoming` · blocco A
- **Base:** `A small homing energy orb, magenta pink (#ff6bd0) with a white core, a curving wispy tail.`
- **Evo 1 (Sfere Divine):** `Brighter homing orb, pink and white, a longer curving tail and a small orbiting spark.`
- **Evo 2 (Sfere del Destino):** `Glowing orb of fate, pink, white and violet, a long curling tail, two orbiting sparks.`

### 9 · Raggio Perforante / Piercing Beam (rosa #ff4fa0) — `fxdbeam` · blocco B con celle 256x64 (raggio sottile)
- **Base:** `A very thin piercing finger beam, hot pink (#ff4fa0) with a white core, a small bright dot at the origin, a tiny spark at the tip.`
- **Evo 1 (Raggio Mortale):** `Thin deadly beam, hot pink and white, sharper and brighter, small crackles along it.`
- **Evo 2 (Raggio dell'Imperatore):** `Thin regal deadly beam, hot pink, white and violet, sharp glints along its length.`

### 10 · Lancia Ribelle / Rebel Javelin (arancio #ff7a3a) — `fxjavelin` · blocco F
- **Base:** `A spear made of ki energy, orange (#ff7a3a), long and thin with a sharp glowing tip and a short energy trail.`
- **Evo 1 (Lancia dell'Ultimo Saiyan):** `Longer energy spear, orange and white, a bigger tip, flames licking along the shaft.`
- **Evo 2 (Lancia della Rivolta):** `Fierce energy spear, orange, red and white, a jagged tip, a long burning trail.`

### 11 · Doppio Sunday / Double Sunday (viola #d98aff) — `fxdsunday` (colpo) · blocco A, più `fxdsundayhit` · blocco E
- **Base:** `A violet (#d98aff) energy shot with a white core, a short tail.` Impatto: `violet energy blast`.
- **Evo 1 (Doppio Sunday Supremo):** `Bigger violet energy shot, brighter, a spiral tail.` Impatto: `bigger violet energy blast with a ring`.
- **Evo 2 (Sunday Cataclisma):** `Large violet and white energy shot, crackling.` Impatto: `wide violet explosion with lightning`.

### 12 · Cannone Distruttore / Break Cannon (arancio #ffb13b) — `fxbreaker` (proiettile) · blocco F, più `fxbreakerhit` · blocco E
- **Base:** `A heavy round energy shell, orange (#ffb13b) with a dark metallic core and a glowing rim, a smoke trail.` Impatto: `big orange explosion with debris`.
- **Evo 1 (Cannone Distruttore Max):** `Larger energy shell, orange and red, a fiery trail.` Impatto: `much larger orange explosion with a shock ring`.
- **Evo 2 (Cannone Apocalisse):** `Twin glowing shells side by side, orange, red and white.` Impatto: `huge apocalyptic explosion, orange, red and white, mushroom of smoke`.

### 13 · Danza Elegante / Elegant Dance (verde #7fe0a0) — `fxspiral` · blocco A con frame 64x64 (colpo piccolo)
- **Base:** `A small elegant energy shot, mint green (#7fe0a0) with a white core, shaped like a pointed petal.`
- **Evo 1 (Danza Elegante Suprema):** `Sharper piercing petal-shaped shot, mint green and white, a thin trail.`
- **Evo 2 (Danza del Principe):** `Royal petal-shaped shot, mint green, white and a gold edge, a thin trail.`

### 14 · Boomerang Ginyu / Ginyu Boomerang (viola #d070ff) — `fxboomer` · blocco F
- **Base:** `A spinning boomerang made of purple (#d070ff) energy, crescent shaped, motion blur of the spin.`
- **Evo 1 (Boomerang Speciale):** `Bigger spinning energy boomerang, purple and white, a glowing trail.`
- **Evo 2 (Forza Ginyu):** `Large spinning energy boomerang, purple, white and pink, sparkles along the edge.`

### 15 · Granata Infernale / Hellzone Grenade (verde lime #c8ff3a) — `fxhellzone` (sfera) · blocco A con frame 64x64, più `fxhellzonehit` · blocco E
- **Base:** `A small floating ki sphere, lime green (#c8ff3a) with a white core, pulsing.` Impatto: `a lime green implosion then explosion, many small spheres collapsing into one blast`.
- **Evo 1 (Granata Infernale Suprema):** `Brighter lime sphere with a faint ring.` Impatto: `bigger lime green blast`.
- **Evo 2 (Granata Infernale Divina):** `Lime and white sphere with sparks.` Impatto: `wide lime and white blast with lightning`.

### 16 · Salto Temporale / Time Skip (azzurro #9ab4ff) — `fxchrono` · blocco C
- **Base:** `A translucent clock face on the ground, periwinkle blue (#9ab4ff), thin hour marks, the hands sweeping around, frozen-time sparkles.`
- **Evo 1 (Salto Temporale Perfetto):** `Larger clock face, periwinkle and white, double ring of marks, glass-like shine.`
- **Evo 2 (Tempo Spezzato):** `Shattering clock face, periwinkle and white, cracks spreading across it, shards of glass-like light.`

### 17 · Impatto Potente / Power Impact (rosso #ff4a4a) — `fxshock` · blocco C
- **Base:** `A shockwave ring expanding on the ground, red (#ff4a4a) with a white leading edge, dust kicked up.`
- **Evo 1 (Impatto Supremo):** `Bigger double shockwave ring, red and white, stronger dust.`
- **Evo 2 (Impatto Assoluto):** `Wide triple shockwave, red, white and orange, cracks in the ground.`

### 18 · Sfera della Distruzione / Sphere of Destruction (viola #b060ff) — `fxhakai` · blocco A con frame 192x192
- **Base:** `A dark sphere of destruction, black core with a violet (#b060ff) burning edge, wisps of purple energy peeling off.`
- **Evo 1 (Hakai Supremo):** `Bigger destruction sphere, black and violet, wisps spiraling INTO it (it pulls things in).`
- **Evo 2 (Hakai Divino):** `Large divine destruction sphere, black, violet and a thin white edge, a swirling vortex of purple light around it.`

### 19 · Fulmine Angelico / Angelic Bolt (azzurro #8ad8ff) — `fxchain` · blocco B con celle 256x96
- **Base:** `A jagged lightning bolt jumping between targets, pale blue (#8ad8ff) with a white core, small branches.`
- **Evo 1 (Fulmine del Cielo):** `Brighter, thicker lightning bolt, pale blue and white, more branches.`
- **Evo 2 (Tempesta Angelica):** `Heavy storm lightning, pale blue, white and a hint of gold, many branches and sparks.`

### 20 · Meteora di Fusione / Fusion Meteor (arancio #ff9a3a) — `fxmeteor` (meteora che cade) · blocco F, più `fxmeteorhit` · blocco E
- **Base:** `A small flaming meteor falling diagonally (from top-left to bottom-right), orange (#ff9a3a) fire trail, rocky core.` Impatto: `orange fiery impact with rock debris`.
- **Evo 1 (Pioggia di Meteore):** `Bigger flaming meteor, orange and red, longer trail.` Impatto: `bigger fiery impact with a crater ring`.
- **Evo 2 (Cataclisma Cometa):** `Large comet, orange, red and white-hot, very long trail.` Impatto: `huge fiery impact with a shock ring`.

### 21 · Big Bang Kamehameha (azzurro #59c8ff) — `fxsweep` · blocco B
- **Base:** `A wide energy beam, cyan blue (#59c8ff) with a white core, a big spherical origin, rippling body.` (Nel gioco ruota attorno al personaggio.)
- **Evo 1 (Big Bang Doppio):** `Same beam, brighter and wider, golden sparks along the edge.`
- **Evo 2 (Big Bang Trinità):** `Same beam, even brighter, cyan, white and gold, lightning along the edge.`

### 22 · Calcio Dinamite / Dynamite Kick (giallo #ffe24d) — `fxdyn` · blocco E con frame 256x256
- **Base:** `A close-range blast in front of the character, yellow (#ffe24d) and white, a big star-shaped flash, speed lines pushing outward.`
- **Evo 1 (Calcio Dinamite Super):** `A double blast, yellow and orange, two overlapping star flashes.`
- **Evo 2 (Calcio Campione):** `A wide champion blast, yellow, orange and white, big ring wave and confetti-like sparks.`

---

## Dopo
Mandami i fogli (anche uno alla volta): li ritaglio, li allineo, scrivo i dati in `sprites.json` e li collego all'arma, con la
grafica attuale come riserva finché un livello non ha il suo foglio.
