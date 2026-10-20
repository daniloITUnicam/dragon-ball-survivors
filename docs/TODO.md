# TODO — Dragon Ball: Survivors

Aggiornato il 20 ottobre 2026 (v52). Voci con 🎨 = **serve uno sprite / un asset dall'utente** (ricordarlo ogni volta che si parla di sprite).

## 🎨 Asset da fornire
- [ ] 🎨 Piccolo — **Cannone Speciale Makankosappo** (sprite e animazione dell'abilità unica).
- [ ] 🎨 Toppo — **Sfera della Giustizia**: sfera oscura lanciata dal personaggio.
- [ ] 🎨 Icona **globale del cimelio** colorata per rarità (slot, borsa, notifiche).
- [ ] 🎨 Sprite sheet degli **indicatori TAB** (più vicino / HP+ / HP− / boss): arrivato, da ritagliare in v53 (mostrare solo l'attivo, a sinistra nell'area cerchiata in rosso).
- [ ] 🎨 Sprite di **Dyspo** sbagliato (viola, stessa razza di Beerus): cercare riferimenti e rifarlo.
- [ ] 🎨 Sprite dei **Tamagami** (statue guardiane delle 3 Super Sfere) + animazioni + attacchi.
- [ ] 🎨 Sprite dei boss canonici di Rovine degli Androidi: 13, 14, 15, 16, 17, 18, 19, 21 (+ Cell Perfetto, Gero).
- [ ] 🎨 Sprite dei Kaioshin / Dei della Distruzione e di Zeno come boss finale.
- [ ] 🎨 Suono del **level-up** mancante (cercare e proporre alternative).
- [ ] 🎨 Suggerire sprite per le altre abilità.

## 🗓 Rilasci pianificati
- **v53 – Gameplay / bilanciamento / armi**: distanza di respawn +50% dal bordo alto, rallentamento nemici per difficoltà (descritto nella scelta stage), Facile −20% Salute nemici/boss, abilità usabili nell'allenamento, impostazione armi 1–5 con sfere (sotto la selezione personaggio), TAB per cambiare bersaglio, passivi dei personaggi più forti con la crescita (tetto Lv 100) e ricariche −35%, nerf (Camera Gravitazionale 5%, Meditazione 8%, Zenkai 10%, Volo veloce 6%), totem (tempesta 20 s con −20% a trasformazione, spirito con cura fino al 12%, rischio 3 minuti), Ki Blast al posto di Ki Barrage, freccia rossa +15% danno attratta, tutto al massimo → sacchi di zenni + «scelta automatica», Senzu (stat casuale + 50% HP), via i funghi da terra che danno un cimelio, Super Sfere a 3 con indicatore in basso a destra, niente camminata sull'acqua, lava 10% vita/s.
- **v54 – Cimeli e compagni**: i compagni raccolgono XP visibile e la portano al giocatore, onda d'urto quando circondati (5 s), forzieri 6→4 cimeli, impostazione «salta cimeli inferiori», schermata scambio cimelio migliorata, rework cimeli (indicatore di perfezione 0–100%, mitico con statistiche coerenti, aura Ultra Istinto al 100%, ordinamento borsa), UI slot cimeli.
- **v55 – Boss e personaggi**: trasformazioni dei nemici (+50% HP, +20% statistiche), morte del boss finale, Piccolo (Makankosappo, Hellzone Grenade), Toppo, Gotenks (SSJ…), Freezer su Namek, Dodoria, Cell, Androidi canonici, Dr. Gero, Super Buu, Regno degli Dei, Stanza del Tempo.
- **v56 – Audio / grafica**: ragni dei barili, ombre dei gabbiani, critici rossi + font arcade, suono level-up, Dyspo.
- **Refactor #95**: estrarre `TrinketSystem`, `ZenoShop`, `Director/Spawner`, `Loot`, `Forms` da `Game`; HUD/mondo/overlay da `Renderer` (nessun cambio di comportamento, suite completa dopo ogni estrazione).

## 🗺 Mappa ESC (idea, non fatta)
- Mappa del livello nel menu di pausa con drop, loot e punti di interesse (icone personalizzate per ogni raccolta, non quelle dell'esperienza).
- Statistiche del personaggio spostate a sinistra.
- Coordinate in pixel in basso a sinistra (mouse / giocatore).

## 🔧 Nucleo di gioco e backend (idea, non fatta)
- Eliminare Facile / Normale / Difficile / Estremo e unificare in una partita da **30 minuti**: 0–10 semplice, 10–20 medio-difficile, 20–25 difficile, 25–30 estremo.
- Interruttori: **«Modalità Iperbolica»** (+50% velocità di gioco/timer) e **«Maledizione della Distruzione»** (più HP e spawn dei nemici, zenny ed esperienza ×2).
- Menu di login: via l'immagine di sfondo; **reset password** (il link di Supabase punta a `localhost:3000` con errore `otp_expired`: impostare l'URL di reindirizzamento); **login con Google** (`cloud.js` ha già `google()` e `recover`).

## ✅ Fatto in v52
Vedi le note di patch (`2026-10-20`) e il README.
