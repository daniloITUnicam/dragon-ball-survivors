# TODO — Dragon Ball: Survivors

Aggiornato il 20 ottobre 2026 (v56). Voci con 🎨 = **serve uno sprite / un asset dall'utente** (ricordarlo ogni volta che si parla di sprite).

## 🎨 Asset da fornire
- [ ] 🎨 Piccolo — **Cannone Speciale Makankosappo** (sprite e animazione dell'abilità unica).
- [ ] 🎨 Toppo — **Sfera della Giustizia**: sfera oscura lanciata dal personaggio.
- [ ] 🎨 Icona **globale del cimelio** colorata per rarità (slot, borsa, notifiche).
- [x] ~~Sprite di **Dyspo** sbagliato~~ → rifatto in v56 (viola come Beerus, orecchie da coniglio, tuta rosso/grigia, guanti e stivali bianchi). Se vuoi uno sprite vero: `assets/sprites/dyspo.png` lo sostituisce.
- [ ] 🎨 Sprite dei boss canonici di Rovine degli Androidi, ora **procedurali provvisori**: Androide 13, Super C-13, 14, 15, 18, 19, 21 e Forma Majin (C-16 e C-17 hanno già il loro foglio).
- [ ] 🎨 Sprite del **Kaioshin (Shin)**, del **Dai Kaioshin** e di **Champa** (provvisori); **Zeno-sama** giocabile usa l'immagine del negozio: un vero foglio `zeno.png` (idle, camminata, attacchi) lo sostituirebbe (`assets/sprites/`).
- [ ] 🎨 Sprite dell'**arma Granata Infernale** (sfere di ki intorno al nemico) e dell'**arma Aura** (ex Kaioken).
- [ ] 🎨 Suono del **level-up** mancante (cercare e proporre alternative).
- [ ] 🎨 Sprite per le altre armi e abilità: **elenco con priorità, formati e dimensioni in [`docs/SPRITES_ABILITA.md`](SPRITES_ABILITA.md)** (consiglio: `fx_ball`, `fx_beam`, `fx_nova`, `fx_dash` per prime; poi `fx_genki`, `fx_hakai`, `fx_disc`, `fx_aura`).

## 🗓 Rilasci pianificati
- **v55 – Boss e personaggi (FATTO, note `2026-10-20d`)**: vedi sotto in «Fatto». Da decidere: **Cooler** e **Janemba** non compaiono più in nessuno stage (erano nel Regno degli Dei, ora Kaioshin/Champa/Beerus): dove metterli?
- **v56 – Grafica (FATTO, note `2026-10-20e`)**: ragni dei barili naturali, ombre al posto dei gabbiani, critici rossi + numeri in stile arcade (+0,3 s), Dyspo rifatto. **Resta**: suono del level-up (da cercare).
- **v57 (FATTO, note `2026-10-20f`)**: Cooler su Namek, slot cimeli extra, Maestro che imita le armi, reset password con codice, login Google, fix Tamagami. Prompt Gemini per gli sprite mancanti: [`PROMPT_GEMINI_SPRITES.md`](PROMPT_GEMINI_SPRITES.md).
- **21/10 (FATTO, note `2026-10-21`)**: barra del roll 0-100, Quantità, Scanner Sfere del Drago, Urlo di Broly!, Armatura +2, 128 nuovi cimeli (`tools/gen_trinkets.py`).
- **v58 – Nucleo di gioco (da discutere)**: partita unica da 30 minuti con interruttori Modalità Iperbolica / Maledizione della Distruzione (vedi sotto).
- **Refactor #95**: estrarre `TrinketSystem`, `ZenoShop`, `Director/Spawner`, `Loot`, `Forms` da `Game`; HUD/mondo/overlay da `Renderer` (nessun cambio di comportamento, suite completa dopo ogni estrazione).

## 🗺 Mappa ESC (idea, non fatta)
- Mappa del livello nel menu di pausa con drop, loot e punti di interesse (icone personalizzate per ogni raccolta, non quelle dell'esperienza).
- Statistiche del personaggio spostate a sinistra.
- Coordinate in pixel in basso a sinistra (mouse / giocatore).

## 🔧 Nucleo di gioco e backend (idea, non fatta)
- Eliminare Facile / Normale / Difficile / Estremo e unificare in una partita da **30 minuti**: 0–10 semplice, 10–20 medio-difficile, 20–25 difficile, 25–30 estremo.
- Interruttori: **«Modalità Iperbolica»** (+50% velocità di gioco/timer) e **«Maledizione della Distruzione»** (più HP e spawn dei nemici, zenny ed esperienza ×2).
- Menu di login: via l'immagine di sfondo; **reset password** (il link di Supabase punta a `localhost:3000` con errore `otp_expired`: impostare l'URL di reindirizzamento); **login con Google** (`cloud.js` ha già `google()` e `recover`).

## ✅ Fatto
- v55 (Boss, nemici e personaggi, sezione 5 della richiesta del 20 ottobre): note di patch `2026-10-20d` — trasformazioni +50% HP / +20% statistiche, Freezer e Cell con tutte le forme, morte del boss finale, Dodoria / Dr. Gero / Super Buu con mosse speciali, Rovine degli Androidi con un androide canonico ogni 5 minuti (nota rossa dell'Infinito), Regno degli Dei con Kaioshin e Champa, boss della Stanza dello Spirito che copia le tue abilità (−40%), Piccolo (Cannone Speciale, Granata Infernale con 2 evoluzioni), Toppo, Gotenks (fantasmi che copiano le armi, SSJ…Blue), Kaioken→Aura (a Jiren), **Zeno-sama giocabile** (numeri da Queen Sigma, sblocco: tutti gli stage in Estremo + tutte le armi), rinforzo dei nemici ogni 10 minuti, barre della vita sopra la testa. Richiesta originale in `docs/RICHIESTE_20_10_sez5-7.md`.
- v52: vedi le note di patch (`2026-10-20`) e il README.
- v54 (Cimeli e compagni, sezione 4 della richiesta del 20 ottobre): note di patch `2026-10-20c` — Perfezione 0–100% per cimelio (tiro ±12%, aura Ultra Istinto al 100%, Mitici coerenti, ordinamento borsa, scambio migliorato, slot HUD, «Salta i cimeli inferiori»), forziere del boss a 4 cimeli, compagno che porta l'XP e onda d'urto.
- v53 (Gameplay / bilanciamento / armi, sezione 3 della richiesta del 20 ottobre): note di patch `2026-10-20b`. Indicatori TAB: foglio dell'utente integrato (`assets/sprites/_sorgenti/mirini/tgt_src.jpg` → `tools/gen_tgt.py` → `assets/tgt.webp`). Sprite dei Tamagami (normali, Furia, statue) integrati dai fogli dell'utente (`assets/sprites/_sorgenti/boss/` → `tools/import_tama.py` → `assets/sprites/boss/tama*.png`).
