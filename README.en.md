<p align="center"><img src="docs/logo.png" alt="Dragon Ball: Survivors" width="560"></p>

# Dragon Ball: Survivors

> 🇮🇹 Versione italiana: [README.md](README.md)

A *Vampire Survivors*-style survivor-like inspired by Dragon Ball: you move, the weapons fire on their own, you collect experience, level up, transform and survive until the final boss. It runs in the browser, on PC and phone, as **a single HTML file** (Canvas 2D and plain JavaScript, no dependencies).

> ⚠️ Unofficial, non-profit fan project. Not affiliated with Toei Animation, Shueisha, Bandai Namco or the heirs of Akira Toriyama. See [DISCLAIMER.md](DISCLAIMER.md).

![Menu](docs/screens/menu.jpg)

## Contents

1. [How to play](#how-to-play)
2. [Controls](#controls)
3. [Game modes](#game-modes)
4. [In a run](#in-a-run)
5. [Characters, weapons and transformations](#characters-weapons-and-transformations)
6. [Trinkets and Gacha](#trinkets-and-gacha)
7. [Stages, enemies and bosses](#stages-enemies-and-bosses)
8. [Permanent progression](#permanent-progression)
9. [Online and co-op](#online-and-co-op)
10. [Screens and options](#screens-and-options)
11. [Build and development](#build-and-development)
12. [Project layout](#project-layout)
13. [License and credits](#license-and-credits)

---

## How to play

1. From the menu pick **Play** (or **Quick start**), then the stage, the character, the **companion** and how many weapons to bring (1 to 5).
2. You move; **the weapons attack on their own**. With `Tab` you choose who to hit (closest, most or least Health, the boss).
3. Enemies drop **experience gems**: collect them to level up and pick a card (weapon, upgrade, etc.).
4. At the right levels you **transform** (Super Saiyan, Ultra Instinct…): each form gives bonuses for the rest of the run.
5. Survive **30 minutes**, then defeat the stage's **final boss**. You get 30 seconds to collect the loot before the victory screen.
6. If you die you still keep the zenny you earned. **Zenny** buys permanent upgrades in the Shop, characters and Gacha tickets.

![Character select](docs/screens/characters.jpg)

## Controls

### Keyboard and mouse

| Action | Keys |
|---|---|
| Move | `W` `A` `S` `D` / arrow keys |
| Character ability (Kaioken, Berserk, beams, clones, time stop…) | `R` or `X` |
| Dash (damages what it crosses, brief invulnerability) | `Shift` |
| Senzu Bean (heals 50% and gives a stat bonus, from the bag) | `H` |
| Companion ability | `Q` |
| Interact (altars, totems, chests, Swap Machine, Hyperbolic Time Chamber…) | `E` or `F` |
| Change weapon target | `Tab` |
| Pause (map, stats, event log, settings) | `Esc` or `P` |
| Pick a card in choice windows | `1`–`9` (`0` = the tenth) |
| Press the highlighted button / leave the Hyperbolic Time Chamber | `Space` |
| Confirm / back in menus | `Enter` or `Space` / `Esc` or `⌫` |
| Camera zoom | mouse wheel (50–150%, in steps of 10%) |
| FPS counter and diagnostics | `F2` or `` ` `` |

The **Kamehameha** is charged by holding the ability key. Every key can be rebound in **Settings → Controls**.

### Gamepad

| Action | Button |
|---|---|
| Move / menus | D-pad |
| Confirm / interact | A |
| Back | B |
| Companion ability | X |
| Character ability | Y |
| Senzu Bean | LB |
| Dash | RB |
| Change target | left stick click |
| Pause | Start |
| Diagnostics | Select |

### Phone and tablet

On-screen virtual joystick and large buttons with the icons for **ability**, **Dash**, **Senzu Bean**, **companion** and **Interact** (`E`). The interface shrinks to leave more of the field visible, and the pause map can be dragged with a finger.

---

## Game modes

| Mode | How it works |
|---|---|
| **Classic** | A 30-minute run per stage that ends with the final boss. A single difficulty: the challenge grows with time (more enemies from minute 3, stronger every 5 minutes, minibosses and elites). |
| **x2** | Unlocks by reaching a stage's final boss: the run lasts half as long, experience is reduced and enemies are tougher. No zenny multiplier. |
| **Endless** | Unlocks by winning the stage ("Continue"): weapons climb to Lv 100, cooldown can drop to 0.2 s, Zeno-sama's shop shows up every 5 minutes and every 50 levels you get 100 coins while enemies keep getting stronger. From the pause menu you set priorities and auto-pick for upgrades. |
| **Quick start** | Starts right away with the last character and stage used. |
| **Weekly challenge** | Same stage, character and seed for everyone for a week: the leaderboard's first place comes back at you as a ghost. |
| **Co-op** | Up to 4 players in the same world (BETA). See [Online and co-op](#online-and-co-op). |

---

## In a run

### Combat
- **Automatic attack**: every weapon behaves differently (projectiles, beams, orbits, fire zones, chain lightning, meteors…). Hits feel heavy: arcade damage numbers (red for crits), combos, a kill **Streak** with a bar and tiers (50, 100, 200, 500).
- **Weaknesses**: every boss has one. Some enemy attacks can be destroyed.
- **Ki Clash**, **Last breath**, allies that come to help, boss and transformation cutscenes (the camera tightens and everything stops until the aura bursts).
- **Level-up**: besides the cards you can use **Reroll**, **Skip** and **Ban** (Shop tools) and automatic level-up with your priorities (Settings).

### What you find on the map
Every run has a different, living map (weather, day/night, animated sea and lava, creatures, breakable objects).

| Element | What it does |
|---|---|
| **Chests** | One per boss and a supply chest every 5 minutes, in five rarities, with upgrades and trinkets. |
| **Zenny and items** | Coins, zenny bags, hearts, magnet, temporary power-ups, experience, Luck. Loot spots show up more often with extra loot. |
| **Dragon Balls** | Collect 7 to summon **Shenron** (4 wishes offered among second life, power, luck, tickets, immortality, transformation, legend). The 3 **Super Balls** guarded by the Tamagami call **Porunga**. |
| **Altars and springs** | Power Altar, healing Spring, Sacrifice Altar, Experience Fountain, Coin Stash, Challenge Altars (stronger bosses in exchange for more chests). Used with `E`. |
| **Totems** | 8 powers: Fortune, Risk, Vitality, Fury, Wealth, Guardian, Storm, Spirit. |
| **Hyperbolic Time Chamber** | Buy the next form in advance (with at least 70% of the required level) and face a Master who mimics your weapons. |
| **Swap Machine** | Shows up in about 12% of runs: put up to 3 trinkets in, it works for ~10 seconds **while you play** (progress bar above it) and gives back different trinkets of the same rarity, with equal or better perfection. |
| **Tunnel** | One shows up every 15 minutes: a one-way tunnel with a boss at the end and 3 chests. |
| **Zeno Portal** | Zeno-sama's shop. |
| **Surprise visits** | A character arrives with a 60-second mission; Training Circle, Capsule Corp, a golden Saibaman that runs off with the loot. |
| **Traps and healing zones** | Rare, but dangerous or precious. |
| **Themed events** | Each stage has an event in which enemies transform (announced in 6 languages). |
| **Hordes, elites, minibosses** | Themed hordes (the first at 2 minutes, then one every 5) led by an elite, a miniboss every 5 minutes, enemies that rank up. |

The pause map (large, zoomable) shows where the pickups are; arrows at the screen edges point to important items.

### Companions
Dende, Mini Shenron, Mini Droid, Bubbles, Mini Bu and Saibaman: they collect distant experience, have an ability (`Q`) and release a shockwave when you are surrounded.

---

## Characters, weapons and transformations

### 58 playable characters
Each has starting weapons, stats, a **transformation line** (up to 8 forms, with painted auras) and a **unique ability** with an upgraded version in the final form.

| Line | Characters |
|---|---|
| Saiyans | Goku, Vegeta, Trunks, Gohan, Goten, Gotenks, Vegito, Gogeta, Kefla, Raditz, Nappa, Bardock, Turles, Great Saiyaman, Caulifla, Kale, Broly |
| Namekians | Piccolo, Nail, King Piccolo |
| Humans | Krillin, Yamcha, Tien, Chiaotzu, Master Roshi, Mr. Satan, Videl, Bulma, Yajirobe, Pan, Mr. Popo, Uub |
| Androids | C-16, C-17, C-18, C-21, Dr. Gero |
| Frieza and troops | Frieza, Cooler, Frost, Captain Ginyu, Zarbon, Recoome, Guldo, Dabura |
| Cell · Majin | Cell · Majin Buu |
| Pride Troopers | Toppo, Hit, Jiren, Dyspo |
| Gods and Zamasu | Beerus, Whis, King Kai, Zamasu, Goku Black, Fused Zamasu, Zeno-sama |

You have **4 from the start** (Goku, Vegeta, Piccolo, Krillin); the others unlock with a condition (win stages, reach a level, defeat a number of enemies or bosses) **or by buying them** with zenny. The **Achievements** screen tells you what to do for each unlock.

**Character fusions**: Vegito and Gogeta (Potara / Metamoran), Gotenks, Kefla and Fused Zamasu are played for one run with both parents at **Mastery 5**.

### Abilities
Kaioken (x10/x20), Berserk, Final Flash, Special Beam Cannon, Solar Flare, Furious Slash, Dodon Ray, Wolf Fang Fist, clones, Justice Sphere, Super Ghost Kamikaze, barriers, absorption, time stop, erasure, rewind, jackpot and more. When you use an ability its icon rises above the hero; if it lasts for a while you see a ring that empties. Every ability has **dedicated icons** on buttons, cards and tooltips.

### 24 weapons
Ki Blast, Kamehameha, Destructo Disc, Spirit Bomb, Aura, Solar Flare, Sword, Eccentric Blows, Piercing Beam, Rebel Spear, Double Sunday, Destroyer Cannon, Elegant Dance, Ginyu Boomerang, Hellzone Grenade, Time Skip, Powerful Impact, Destruction Sphere, Angelic Lightning, Fusion Meteor, Big Bang Kamehameha, Garlic Cannon, Big Bang Attack, Dynamite Kick.

- Every weapon goes up to **Lv 5**, **evolves** (chest or Grimoire condition) and has 5 more levels.
- **12 double evolutions** (fusions of two weapons, also from the Grimoire): Ki Storm, Final Kamehameha, Kienzan Blade, Universal Spirit Bomb, Explosive Aura, Divine Judgement, Hellish Lances, Big Bang Kick, Time Flash, Ginyu Sunday, Emperor's Dance, Final Explosion.
- Weapons unlock into the pool by winning a stage with a character who starts with that weapon. The Shop's **Weapon Blacklist** lets you ban some.
- Effects are **painted animations** (evolutions included) with 8-bit sounds.

### 11 passive upgrades
Zenkai (damage), Vigor (Health), Fast Flight (speed), Scouter (pickup range), Gravity Chamber (cooldown), Battle Armor, Senzu Beans (regeneration), Meditation (experience), Amount, Luck, Area. Some are also needed for evolutions.

### Senzu Beans and Dash
The **Senzu bag** (up to 3) heals 50% Health and raises a stat for the run. The **Dash** damages what it crosses and grants invulnerability; it has a cooldown of a few seconds.

---

## Trinkets and Gacha

**173 trinkets** in 5 rarities (Common, Rare, Epic, Legendary, Mythic), each with stats and a special effect. Every copy has a **Perfection from 0 to 100** (at 100 the aura is Ultra Instinct) and can have extra stats.

- **Gacha**: 1- or 10-pull tickets with animation (auto-open, adjustable speed), Super Balls.
- **Bag**: collects your trinkets, with sorting, filters by rarity and stat (including the ones that matter), selling and the Shop's extra slots.
- **Reroll**: rerolls Perfection (200 zenny per roll, −2% every 10 rolls down to −50%), with stat locking and **auto reroll** up to a target.
- **Fusion**: three trinkets of the same type give the highest rarity with the best perfection of each stat; three of the same rarity raise it by one tier.
- **In a run**: trinkets are found in chests; after the final boss you pick 2 to bring to the Bag. The **Swap Machine** regenerates them.

---

## Stages, enemies and bosses

| # | Stage | Unlock |
|---|---|---|
| 1 | Muten Island | — |
| 2 | Snake Way | win stage 1 |
| 3 | Saiyan Plains | win stage 2 |
| 4 | Planet Vegeta | win stage 3 |
| 5 | Planet Namek | win stage 4 |
| 6 | Android Ruins | win stage 5 |
| 7 | Cell Games Arena | win stage 6 |
| 8 | Hell | win stage 7 |
| 9 | Buu's Dimension | win stage 8 |
| 10 | Realm of the Gods | win stage 9 |
| 11 | **Tournament of Power** | win stage 10 |

Stages follow Dragon Ball's canonical order (Dragon Ball → Z → Super). Each map has its own music, painted obstacles, weather and themed event; **Snake Way** is made of reachable islands, the **Tournament of Power** is fought in a closed circular arena.

- **Enemies**: over 140 variants with different AI (chasers, shooters, kamikazes, shielded, dodgers…), with **ranks** that make them stronger and recolor them as the minutes pass.
- **Bosses**: around a hundred bosses and minibosses (Raditz, Nappa and Vegeta, Frieza and Cooler, Cell, Janemba, Omega Shenron, Jiren…). They transform, have signature moves, a weakness and a power-up during the run. The **Guide/Glossary** describes every enemy and boss.
- **Enemy album**: discovering 10, 25 and 50 gives rewards.

---

## Permanent progression

- **Shop**: permanent upgrades with rising cost (Greed, Study, Vitality, Regeneration, Damage, Agility, Magnetism, Saiyan Armor, Rhythm, Luck, Area, Critical Eye, Beam Duration, Second Life, Broly's Scream!, Dragon Ball Scanner, Amount, Extra Trinket, Weapon Blacklist, Reroll, Skip, Ban).
- **Achievements and Objectives**: hundreds of goals with zenny and ticket rewards (kills, bosses, trinket collection, perfection, fusions, pulls…), plus **daily quests**.
- **Mastery**: each character levels up to Lv 10 by playing it; at **Lv 5** you get a passive, and character fusions unlock with the parents at Mastery 5.
- **Pacts**: 7 voluntary curses (iron, fury, horde, wind, crystal, fasting, oblivion) for tougher runs and higher pay.
- **Grimoire**: recipes for every evolution, requirements and progress per weapon, with a kill diary.
- **Career**: play time, runs, wins, enemies and bosses defeated, favorite weapon and character, enemies per saga.
- **Build codes**: copy your build's code at the end of a run and paste a friend's to view it.
- **End-of-run card** to share, in-game patch notes (📜).

---

## Online and co-op

- **Account and cloud** (optional): sign up with email and password (with code-based recovery) or with Google; the save syncs across devices, with conflict handling.
- **Leaderboards** per stage and metric, the **Weekly challenge** with the first place's ghost, weekly **community events**.
- **Co-op (BETA)**: rooms with a code, friends, invites, player search, chat and leaderboard. Up to **4 players** in the same run; one player's card choice doesn't stop the others.
- Server-side checks and anti-cheat protections for the leaderboards.

Without an account the game works perfectly well **offline**: the save lives in the browser (encoded).

---

## Screens and options

**Main menu**: Play · Quick start · Co-op · Growth (Shop, Gacha, Bag) · Progress (Unlocks, Achievements, Career, Leaderboards) · Options · Grimoire · Guide/Glossary · Patch notes · Account.

**Options**: language (**Italian, English, Spanish, French, German, Portuguese**), graphics (dynamic resolution, effect opacity and reduction, death animations, fullscreen, zoom), audio (music, effects, quieter evolved weapons), gameplay (auto level-up, priorities, Kamehameha, tickets), rebindable controls for keyboard and gamepad.

**Technology**: all the graphics are pixel art, partly generated by code and partly painted (characters, auras, weapons, maps, icons); sound effects are synthesized in 8-bit style, music is MP3 (one per map, plus the boss themes). The game adjusts its own resolution to stay smooth in the busiest moments.

---

## Build and development

You need **Python 3** (for the bundler) and, optionally, **Node.js** (syntax checks and tests).

```bash
python3 build.py --check    # builds dist/dragon-ball-survivors.html and checks the syntax with node
```

Open `dist/dragon-ball-survivors.html` in a modern browser: it is self-contained and also works offline. If `esbuild` is installed the page is minified.

- **Music and effects**: `assets/*.mp3` files (see [assets/README.md](assets/README.md)); if missing, synthesized audio is used.
- **Publishing**: the `.github/workflows/deploy.yml` workflow builds the game and publishes it to GitHub Pages on every push to `main`.
- The game notices new versions on its own (`dist/version.json`) and offers to reload.

## Project layout

```
build.py              bundler: merges src/ and the assets into a single HTML
src/index.html        page
src/css/              styles (style, skin, gacha, mobile, loader)
src/js/
  util.js data.js     utilities and data (weapons, characters, stages, enemies, bosses, trinkets, companions, shop…)
  i18n*.js            translations (it, en, es, fr, de, pt)
  game.js             game logic (no DOM) and MapDirector (events, totems, rooms, Swap Machine)
  weapons*.js wfx.js  weapon behavior and painted animations
  world.js mapx.js …  maps, terrain, obstacles, islands, sea, lava, themed events
  sprites*.js pose.js procedural and painted sprites, weapon poses
  renderer.js         drawing (canvas, HUD, effects)
  ui*.js app.js       screens, input, main loop
  gacha.js ui_gacha.js ui_trin.js   Gacha, Bag, Reroll, Fusion, Swap Machine
  save.js cloud.js    save, sync and leaderboards
  audio.js            synthesized 8-bit effects and music
assets/
  ui/                 logo, bar atlases, menu art, card frames
  icons/              icons: shop, weapons, trinkets, abilities, HUD
  sprites/            sprite sheets and sources (see assets/sprites/README.md)
  *.mp3               music and effects
tools/                scripts that generate atlases and sprite sheets from the sources
tests/                simulations and Puppeteer tests (python3 tools/run_tests.py)
docs/                 logo and screenshots
```

```bash
python3 tools/run_tests.py   # runs the test suite
node tests/check_i18n.js     # checks the translations in every language
```

> Balance has also been checked with a deliberately weak bot: a real player's experience may be easier. Reports and suggestions are welcome in the issues.

## License and credits

The **code** is under the [MIT](LICENSE) license. Dragon Ball names, characters and trademarks are **not covered** by this license and belong to their respective owners ([DISCLAIMER.md](DISCLAIMER.md)). Graphics and music credits in [CREDITS.md](CREDITS.md).
