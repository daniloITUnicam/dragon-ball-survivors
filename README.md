<p align="center"><img src="docs/logo.png" alt="Dragon Ball: Survivors" width="560"></p>

# Dragon Ball: Survivors

> 🇬🇧 English version: [README.en.md](README.en.md)

Un survivor-like in stile *Vampire Survivors* ispirato a Dragon Ball: ti muovi, le armi sparano da sole, raccogli esperienza, sali di livello, ti trasformi e sopravvivi fino al boss finale. Tutto in **un solo file HTML** (Canvas 2D + JavaScript puro, zero dipendenze, nessun asset esterno: grafica generata dal codice, effetti sonori sintetizzati).

> ⚠️ Progetto amatoriale, non ufficiale e senza scopo di lucro. Non è affiliato a Toei Animation, Shueisha, Bandai Namco né agli eredi di Akira Toriyama. Vedi [DISCLAIMER.md](DISCLAIMER.md).

![Menu](docs/screens/menu.jpg)

## Indice

1. [Come si gioca](#come-si-gioca)
2. [Controlli](#controlli)
3. [Novità dell'ultimo aggiornamento](#novità-dellultimo-aggiornamento)
4. [Meccaniche di gioco](#meccaniche-di-gioco)
5. [Contenuti](#contenuti)
6. [Build e sviluppo](#build-e-sviluppo)
7. [Struttura del progetto](#struttura-del-progetto)
8. [Test](#test)
9. [Licenza](#licenza)

---

## Come si gioca

1. Dal menu scegli **Gioca**, poi stage, difficoltà e personaggio (e il tuo **compagno**).
2. Ti muovi con la tastiera (o il gamepad): **le armi attaccano da sole** contro i nemici vicini.
3. I nemici lasciano **gemme di esperienza**: raccoglile per salire di livello e scegliere un potenziamento tra le carte proposte.
4. Raggiungi i livelli richiesti per **trasformarti** (Super Saiyan, Ultra Istinto, ecc.): ogni forma dà bonus permanenti per la run.
5. Sopravvivi fino allo scadere del tempo dello stage e **sconfiggi il boss finale** per vincere. Se muori, tieni comunque gli zenny guadagnati.
6. Gli **zenny** si spendono nel **Negozio** (potenziamenti permanenti) e per **sbloccare i personaggi**.

![Selezione personaggio](docs/screens/characters.jpg)

## Controlli

| Azione | Tastiera | Gamepad |
|---|---|---|
| Movimento | `WASD` / frecce | D-pad |
| Conferma / Annulla | `Invio`, `Spazio` / `Esc`, `Backspace` | A / B |
| Pausa | `Esc` o `P` | Start |
| Interagire (altari, totem, stanza del tempo) | `E` o `F` | A |
| Abilità del compagno | `Q` (o tocca il pulsante in basso a sinistra) | X |
| **Fagiolo Senzu** (dalla borsa) | `H` · pulsante a schermo | LB |
| **Scatto** (danni sul percorso + invulnerabilità, ricarica 4 s) | `Shift` · pulsante a schermo | RB |
| **Abilità del personaggio** (Kaioken, Berserk, raggi, cloni…) | `R` o `X` · pulsante a schermo | Y |
| Debug (FPS ecc.) | `F2` o `` ` `` | Select |

Tutti i tasti sono riassegnabili da **Impostazioni → Comandi**.

---

## Novità dell'ultimo aggiornamento

### 🆕 Aggiornamento del 21 ottobre 2026 (barra del roll dei cimeli)

Nuovi potenziamenti del negozio (**Quantità**: +1 proiettile per arma, max 2; **Scanner Sfere del Drago**: +5% comparsa per livello, max 2; **Urlo di Broly!**: +5% frequenza dei nemici per livello, max 5, da 666), Armatura Saiyan +2 per livello, **128 nuovi cimeli** (combinazioni di 2-3 statistiche, a tutte le rarità; 10 con Quantità solo a Leggendario/Mitico, fino a +5 con roll 100) e la barra del roll da 0 a 100 su ogni cimelio. Voce `2026-10-21` delle note di patch; i cimeli si rigenerano con `tools/gen_trinkets.py`.

### 🆕 Aggiornamento del 20 ottobre 2026, parte 6 (Cooler, cimeli extra, Maestro, password e Google)

Dettaglio nelle **note di patch del gioco** (voce `2026-10-20f`): Cooler boss del tardo Pianeta Namek con tre forme, slot extra dei cimeli visibili (fino a 3), il Maestro della Stanza dello Spirito e del Tempo imita le tue armi, password dimenticata con codice a 6 cifre, pulsante «Continua con Google» e correzione dello sprite dei Tamagami. Configurazione di Supabase: [`docs/SUPABASE.md`](docs/SUPABASE.md). Prompt per Gemini degli sprite mancanti: [`docs/PROMPT_GEMINI_SPRITES.md`](docs/PROMPT_GEMINI_SPRITES.md).

### 🆕 Aggiornamento del 20 ottobre 2026, parte 5 (ragni, ombre, numeri di danno, Dyspo)

Dettaglio con numeri nelle **note di patch del gioco** (📜 nel menu: voce `2026-10-20e`, `src/js/patches.js`).

- **Ragni dei barili naturali** (`ObjLife.crawl`, `ObjLife.dangle`, `ObjLife.spider`): comportamento come funzione pura del tempo (nessuno stato). Ciclo di 6,5 s: gira, cammina verso un punto a caso (le zampe seguono la distanza percorsa, partenza e frenata morbide), poi si ferma e fa 2 cose a caso tra alzare testa e zampe anteriori, pulirsi, guardarsi intorno, scuotere una zampa. Il ragno appeso (14 s) si cala, dondola, risale a scatti e riposa. Nuovo disegno: addome, testa, otto zampe snodate con andatura alternata.
- **Ombre al posto dei gabbiani** (`Ambient.birdShadow`, `Ambient.flockShadows`, `Ambient.ground`): niente più stormi nel cielo né uccelli singoli disegnati; resta l'ombra sul terreno (alpha 0,10, ~20-30 px), in formazione a V, ancorata al mondo, che scorre a 36-50 px/s. Anche i gabbiani posati su casse, barili e lapidi (Isola di Muten, Pianura Saiyan, Arena dei Cell Game) sono stati tolti.
- **Numeri di danno arcade** (`Renderer.dmgSpr`, `DMG_T = 1,1`, `Game.floatText` classi 0 = danno, 6 = critico): carattere Anton (Google Fonts, in coda a Impact/Arial Black), inclinato, sfumatura bianco-giallo, contorno scuro, bordo 3D e bordi a pixel; **critici rossi**, più grandi e con tremolio; restano 1,1 s (prima 0,8 s). Al massimo 46 numeri di danno insieme.
- **Dyspo rifatto** (viola come Beerus, orecchie da coniglio `ears:'rabbit'`, tuta rossa/grigia, guanti e stivali bianchi) per personaggio e boss; **Beerus** più viola.
- **Guida sprite per armi e abilità:** [`docs/SPRITES_ABILITA.md`](docs/SPRITES_ABILITA.md) (cosa fare per prima, formati e dimensioni).
- **🧪 Test aggiunto:** `v56` (continuità e varietà del comportamento dei ragni, niente gabbiani posati, ombre in vista ~40% del tempo e leggere, durata e classe dei numeri di danno, critici rossi, sprite dei numeri in cache e a bordi netti); `shot_v56.js` e `shot_dyspo.js` per gli screenshot.

### 🆕 Aggiornamento del 20 ottobre 2026, parte 4 (boss, nemici e personaggi)

Il dettaglio con tutti i numeri è nelle **note di patch del gioco** (📜 nel menu: voce `2026-10-20d`, `src/js/patches.js`).

- **Trasformazioni dei boss** (`Game.bossTransform`, `TRANS_K = 1,2`, `TRANS_HEAL = 0,5`): +50% della Salute massima (nuova) e +20% di Salute massima, danno, velocità (`spdK`) e armatura a ogni forma. **Freezer** (Namek) e **Cell** (Arena dei Cell Game) attraversano tutte le forme (`p2`, `p2at = 0,6`, `morph`), con +2,5% di velocità a forma.
- **Morte del boss finale** (`Game.startVictory/updateVictory`, `VIC_T = 4,2`): 4,2 s al rallentatore con esplosioni crescenti, onda bianca e «VITTORIA!» prima del menu di fine stage.
- **Mosse speciali dei boss** (`BOSSES[id].sig`, `startBossMove/updateBossMove/updateHeld/updateRain`): Dodoria **lancio di corpo** (3 s di avviso, traiettoria larga quanto il corpo), Dr. Gero e C-19 **presa** che risucchia 5/15/25/35% di Salute in 3 s, Super Buu **pioggia di ki** (50/55/60/70 palline, 2% di Salute ciascuna).
- **Rovine degli Androidi** (`STAGES[2].abs`, `bossPlan`, `ANDROID_SEQ`, `ANDROID_K`): un androide canonico ogni 5 minuti in tempo reale (13, 14, 15, 16, 17, 18; Infinito: 19 e 21 e poi il giro riparte +35% di Salute); il primo androide a fine partita è il boss finale. Nuovi boss `c13/c13s/c14/c15/c18/c19/c21/c21m` (sprite provvisori procedurali) e mosse canoniche in `bossAttack` (`bd.lb` rinomina una mossa, `bd.ext` elenca le mosse speciali, `e.bar` = barriera −88% danni). Nota rossa dell'Infinito: `STAGES[2].endNote`. **Cell** non è più nelle Rovine.
- **Regno degli Dei**: boss `shin`, `daikai`, `champa` al posto di Zarbon, Cooler e Janemba; Beerus resta il boss finale.
- **Stanza dello Spirito e del Tempo** (`Game.sparCopy`, `SPAR_COPY_P`, `SPAR_COPY_MUL`): il Maestro copia un attacco su due l'abilità unica o un'arma del giocatore con −40% di danno.
- **Piccolo / Toppo / Gotenks**: Cannone Speciale (`sbc`), Sfera della Giustizia oscura (`sphere`), Fantasmi Kamikaze che copiano le armi (`ghosts`, `GHOST_KIND`); arma **Granata Infernale** (`HellzoneWeapon`, 2 evoluzioni); Kaioken → **Aura** (a Jiren); Gotenks SSJ → SSJ Blue.
- **Zeno-sama giocabile** (`CHARS.zeno`, `LINES.zeno`, `ABIL.zeno`): numeri da Regina Sigma di Vampire Survivors un po' più alti, non in vendita, si sblocca con tutti gli stage completati in Estremo e tutte le armi sbloccate (`runCtx.allX/allW`); sprite = immagine del suo negozio registrata come foglio (`Sprites.zenoSheet`).
- **Difficoltà**: il rinforzo a scatti dei nemici (Normale/Difficile/Estremo) ora ogni 10 minuti invece di 1:30 (`ESC_EVERY`; Facile resta 60 s). **Barre della vita dei nemici sopra la testa.**
- **🧪 Test aggiunto:** `v55` (trasformazioni, Freezer/Cell, morte del boss finale, Piccolo/Toppo/Gotenks, Dodoria/Gero/Buu, calendario degli androidi, mosse dei nuovi boss, Regno degli Dei, Zeno-sama, Stanza dello Spirito); `shot_v55b/c/d.js` e `shot_zeno.js` fanno gli screenshot.

### 🆕 Aggiornamento del 20 ottobre 2026, parte 3 (Perfezione dei cimeli, compagni, forzieri a 4 cimeli)

Il dettaglio con tutti i numeri prima/dopo è nelle **note di patch del gioco** (📜 nel menu: voce `2026-10-20c`, `src/js/patches.js`).

- **Compagno** (`Game.updatePet`, `petFindGem`, `petRelease`, costanti `PET_*`): va a prendere le gemme XP entro 340 px da te ma fuori dal tuo raggio di raccolta, ne porta fino a 3 sopra la testa (`gem.held`, disegnate in `Renderer.drawPet`) e le consegna al ritorno; **onda d'urto** (≥ 5 nemici entro 165 px su almeno 3 quadranti, 210 px, 12 + 1,1/livello, ricarica 5 s).
- **Perfezione dei cimeli 0–100%** (`PF_SPREAD`, `pfK`, `rollPf`, `hasPf`, `trinMods(t,r,pf)` in `data.js`): statistiche −12% … +12% attorno al valore della rarità (50% = nominale); fasce di rarità non sovrapposte (Mitico minimo > Leggendario massimo); i cimeli solo-effetto non ne hanno. In partita `Game.tPf`/`trP(id)`; le offerte (forziere, scelta del boss, negozio di Zeno) portano il loro `pf`; il gacha salva `bag[].p` (doppione migliore ⇒ aggiorna `p`, `res.up`), i salvataggi vecchi ripartono da 50 (`Save.normalize`).
- **Aura Ultra Istinto** a 100% (`Game.perfAura`, `Renderer.drawPlayer`; cornice pulsante in `style`/`gacha.css`); **Mitici coerenti**: solo cimeli con statistiche (`rarOf`).
- **Interfaccia**: `UI.perfBar` (borsa, scheda personaggio, forziere, negozio di Zeno, pausa, suggerimenti); ordinamento borsa «Perfezione»; **scambio cimelio** con differenza %, verdetto Migliore/Peggiore/Pari e zenny incassati; **slot HUD** 30 px con barra di Perfezione e slot vuoti tratteggiati; impostazione **«Salta i cimeli inferiori»** (`trinScore`/`autoRefuse`: rarità, poi Perfezione).
- **Forziere del boss: 4 cimeli** (`TRIN_PICK`, `pickCount`; prima 4 + fino a 6 con la Fortuna).
- **🧪 Test aggiunto:** `v54` (Perfezione e fasce, forziere a 4, Mitici, salta-inferiori, compagno che porta XP, onda d'urto, gacha/migrazione, scambio, aura, ordinamento della borsa).

### 🆕 Aggiornamento del 20 ottobre 2026, parte 2 (armi a scelta, TAB, Tamagami, mondo più severo)

Il dettaglio con tutti i numeri prima/dopo è nelle **note di patch del gioco** (📜 nel menu: voce `2026-10-20b`, `src/js/patches.js`).

- **Armi per partita 1–5** (`settings.weapons`, `Game.maxW`): 5 sfere del Drago sotto la Selezione personaggio (`UI.weaponCount`); il livello-up non propone armi nuove a slot pieni.
- **TAB = bersaglio** (`Game.cycleTarget`/`pickTarget`, azione `target`): più vicino → più Salute → meno Salute → boss; `nearest()` rispetta la modalità. Pannello illustrato nell'HUD a sinistra (`TgtArt`, `assets/tgt.webp` da `tools/gen_tgt.py`).
- **Super Sfere del Drago: 3** (`SB_TOTAL`) con un **Tamagami** ciascuna (`wakeTamagami`, boss `tama1/2/3` + forma Furia): la statua si risveglia a 340 px, la sfera resta bloccata finché non cade; indicatore in basso a destra (`drawSuperBall`, `Renderer`).
- **Grafica dei Tamagami** (`assets/sprites/boss/tama1/2/3.png`, Furia `tama1f/2f/3f.png`, statue `tamas1/2/3.png`): fogli da 9 frame (0 fermo, 1-4 camminata, 5 carica, 6 colpo, 7 speciale, 8 colpito) importati dai sorgenti in `assets/sprites/_sorgenti/boss/` con `tools/import_tama.py` (rimozione dello sfondo magenta, ritaglio frame per frame, scala per riga, ancora ai piedi). `Sprites.BOSS_SHEET` collega l'id del boss al foglio, `Sprites.BOSS_SHEET_F` il foglio della Furia (`e.pf`); il frame lo sceglie `drawEnemy` (`e.lp` = ultimo schema d'attacco, `TAMA_WEAPON` = schemi con arma, `e.pwUntil` = posa di potenziamento). Senza i PNG restano gli sprite procedurali.
- **Mondo**: niente camminata sull'acqua (`blockWater`), lava −10% Salute massima/s (`updateLava`), nemici +50% più lontani sopra lo schermo (`TOP_K`), velocità nemici per difficoltà (`stageSpd`), statistiche nemici nella scheda stage (`UI.stageStats`).
- **Level-up al massimo**: 3 sacchi di zenny + «⚡ Scelta automatica» (`Game.autoZ`, `settings.zAuto`); **Senzu** cura il 50% e alza una statistica a caso (`eatSenzu`); freccia rossa attirata; capsule Hoi-Poi a terra rimosse.
- **Abilità**: usabili nella Stanza dello Spirito e del Tempo; passivi dei personaggi ×1,5 → ×6,45 (Lv 100, `passK`); ricariche −35% (`ABIL_CD_K`).
- **Bilanciamento**: Facile Salute ×0,72; Zenkai +10%, Volo veloce +6%, Camera Gravitazionale −5%, Meditazione +8%; Totem Tempesta / Spirito 20 s (−20% a trasformazione; cura fino al 12%), Rischio 3 minuti; **Ki Barrage rimossa** (Ki Blast −15% e parte al suo posto).
- **🧪 Test aggiunto:** `v53` (numeri di bilanciamento, bersagli TAB, armi per partita, sacchi di zenny e scelta automatica, Senzu, totem, Tamagami e Super Sfere, acqua e lava).

### 🆕 Aggiornamento del 20 ottobre 2026 (menu rinnovati, negozio potenziato, Achievement, missioni giornaliere)

Il dettaglio con tutti i numeri prima/dopo è nelle **note di patch del gioco** (📜 nel menu: voce `2026-10-20`, `src/js/patches.js`).

**🧭 Menu e interfaccia** (`ui3.js`, `ui4.js`)
- ⚙ Impostazioni in Selezione stage e Selezione personaggio; nuova scheda **Partita** (Tremolio schermo, Numeri dei danni, Rifiuta cimeli di rarità inferiore, Apertura automatica ticket).
- Selezione personaggio: **ricerca** (nome, razza, universo, serie, arma di partenza) e **ordinamento** (`CH_SORTS`, `CHAR_META`), salvati in `settings.charSort/charDesc`.
- **⚡ Avvio rapido** (`UI.qsTargets`, `screen_quick`): personaggio con slot cimelio, stage consigliato, cosa manca da sbloccare; «Un altro suggerimento».
- Pausa: **«i» sulle armi** con le statistiche numeriche (`weaponStatRows`): valore finale, base e «+» verde con la quantità aggiunta.
- Animazioni di ingresso/uscita delle finestre, notifiche che si ritirano verso l'alto in 3 s, descrizione dell'Infinita al passaggio del mouse; le note di patch aperte dal menu restano «lette» anche dopo la sincronizzazione cloud (`Cloud.newerPatch`, `pushSeen`).
- «Potenza» → **«Danno»**.

**💰 Negozio ed economia** (`data.js` `SHOP`, `game.js`, `gacha.js`)
- Potenziamenti più forti e prezzi base +20%; nuovi **Reroll / Salta / Ban** (fino a 5 ciascuno) sulla finestra di level-up (`Game.rerollLevel/skipLevel/banLevel`, `banRun`). Costo totale del Negozio: **115.166** zenny (prima 73.115).
- Boss: ticket 10× al **100%**; Élite: ticket 1× al 100%; **acquisto ticket** (1× 1.000, 10× 10.000, −20% sabato e domenica; `ticketPrice`, `Progress.buyTicket`); **apertura automatica** dei ticket (impostazione).
- **Serie di uccisioni**: +50 monete ogni 50 uccisioni di fila, barra nascosta −1,5% ogni 0,5 s, cioè −3% al secondo: la serie finisce ~33 s dopo l'ultima uccisione (`CK_*`, `Game.cstk`).
- Zeno-sama: Epico e oltre −30%, un oggetto gratis a caso per visita, musica non più rallentata, rimbalzo più marcato.
- La modalità x2 non dà più il moltiplicatore di zenny finale.

**🏆 Achievement, Obiettivi e missioni** (`quests.js`, `ui4.js`)
- Nuova schermata **Achievement** (`screen_unl`): cosa fare per sbloccare personaggi, armi, seconde evoluzioni + 14 sfide per difficoltà con ticket; «???» sull'arma finché non è sbloccata.
- **Obiettivi** (`screen_ach`): solo traguardi in zenny (36 nuovi) + **missioni giornaliere** (5 ogni 6 ore, bonus se completate tutte; `dqList`, `Progress.checkDaily`). Ricerca, «Nascondi completati», «Più vicini al completamento» salvati in `settings.objF/achF`.

### 🆕 Aggiornamento del 17 ottobre 2026, parte 2 (modalità Infinita, eventi di mappa, animazioni delle armi)

Il dettaglio con tutti i numeri prima/dopo è nelle **note di patch del gioco** (📜 nel menu: voce `2026-10-17b`, `src/js/patches.js`).

**♾️ Modalità Infinita** (`Game.continueAfterWin`, costanti `ENDLESS_*` in `data.js`)
- **Armi fino al Lv 100**: un'arma al Lv 5 dell'ultima evoluzione disponibile sale per altri 95 livelli (`Weapon.xl`): +4% danno, +1,2% dimensione, −0,5% ricarica per livello; la ricarica totale (statistica × arma) non scende sotto 0,2 s (`cdXl`, `cdMin`). Le carte «livello extra» compaiono in `upgradePool` solo in Infinita.
- **Monete −10% ogni 15 s** (`coinK`: ×0,9 a catena, nessun avviso in partita, scritto solo nella descrizione del pulsante in 6 lingue). Il bonus dei 50 livelli non decade.
- **Ogni 50 livelli** (`checkMilestone`): +100 monete e 4 scatti di crescita dei nemici in un colpo (Normale/Difficile +40% Salute, +8% Danni; Facile +4%/+4%; Estrema +60%/+20%/+60% Armatura) con messaggio elegante. Il tempo non rafforza più i nemici (`escSteps` fisso). Curva XP dolce (`endlessNeed`: ~12 s a livello, +0,1 s a livello).
- **Negozio di Zeno-sama** (il pulsante rosso) ogni 300 s, aperto 240 s; qualità dei cimeli legata alla Fortuna.
- **Level-up automatico** (ogni modalità, `settings.lvAuto`): `levelUp` → `autoLevel` sceglie la carta con `autoPick` e non apre il menu; interruttore e lista nel menu proprio *Impostazioni > Partita > Priorità* (`UI.screen_priority`, interruttore con tooltip `data-tip`; la lista si ordina solo durante la partita): `enPrio`, fino a 10 voci (5 armi + 5 potenziamenti), salvate in `settings.lvPrio`, ordinate con ▲ ▼ (`UI.prioRows`).
- **Dati di gioco / telemetria** (`src/js/telemetry.js`, impostazione `tele`, di base accesa): agganci attorno ai metodi di `Game` (nessuna modifica al codice di gioco) registrano per partita righe al minuto (`min`), ogni 10 s (`s10`), per level-up (`lv`), boss (`boss`), tipo di nemico (`et`), arma, fonte di danno (`hb`), morti, oggetti raccolti (`lt`) e usi (`use`); a fine partita il record va in `localStorage` (`TELE_KEY`, ultime 40 partite, solo sul dispositivo). Impostazioni > Partita > *Dati di gioco*: interruttore, ultimo riepilogo, export JSON/CSV, copia, cancella. Le partite sandbox non si registrano. Analisi: `python3 tools/analyze_telemetry.py dbs-all.json`. Test: `tests/telemetry.js`.
- **Perfezione dei cimeli** (`rollPf`, `data.js`): curva `PF_CURVE` (probabilità di ottenere X o più, interpolata in scala logaritmica): mediana 25%, ≥50% 1 su 30, ≥80% 1 su 330, ≥90% 1 su 600, 100% = 1 su 1000; la Fortuna moltiplica il tiro per `1+0,25·Fortuna`.
- **Animazione di morte** (`src/js/corpse.js`): ogni nemico ucciso resta 0,55 s e si dissolve (istantanea disegnata una volta con `drawEnemy`, maschere a pixel, bordo bianco, scintille); i boss 1,15 s più un'onda d'urto di 3 anelli (`Game.bossShock`). Max 40 corpi (10 boss), niente con «Riduci effetti».
- **Niente sull'acqua** (`Game.dryPos`): oggetti, power-up, gemme, Sfere e forzieri vengono spostati sul punto asciutto più vicino. **Raccolta**: tutti gli oggetti a terra (tranne le Sfere) sono attirati dal raggio `S.magnet` come l'EXP. **Forziere**: Spazio preme «Raccogli».
- **Musica dei boss generici**: `assets/generic boss battle.mp3` → chiave `bossgen` (`GENERIC_BOSS` in `build.py`) per ogni boss che non è il finale della mappa; i temi dei boss finali hanno chiave `fboss<id>`.
- **Musica del boss finale di Cell**: `assets/perfect cell theme.mp3` → chiave `fboss8` (`BOSS_KEYS` in `build.py`); `app.js` la usa quando il boss finale è vivo (vedi `docs/MUSIC.md`).
- **Pagamento**: dopo «Continua» si pagano solo le monete guadagnate dopo la vittoria (`rewardLines`: `run.coins − min(bank.coins, run.minC)`); quello che si spende da Zeno consuma prima le vecchie.

**🎬 Eventi di mappa** (`src/js/events.js` dati + logica, `src/js/events_draw.js` animazioni)
- Una scena per ognuno degli 11 stage (`MAP_EVENTS[theme]`): annuncio con titolo e sottotitolo in 6 lingue, punti d'arrivo segnati a terra, animazioni dedicate (semi, navicelle, capsule, portali, marcia, paracadute, uova, colonne di luce e sfere della distruzione, fessure, meteore) e **trasformazioni dei nemici** (`skMorph`) con etichetta. Durata 34-38 s, prima volta a 170-250 s (Pianura Saiyan 260-330 s), poi dopo 260-400 s. Rimossi i testi «respiro / tiratori in arrivo / ondata di kamikaze»; i kamikaze compaiono solo negli eventi.
- Gabbiani e Nuvola Speciale come effetto visivo anche sulle altre mappe (`Ambient.flocks / Ambient.nimbus`).

**🥋 Animazioni del personaggio per arma** (`src/js/pose.js`)
- I personaggi procedurali sono dipinti **senza braccia** (frame `20+n`; `30+n` = faccia feroce) e le braccia sono disegnate dal gioco con la **cinematica inversa a due ossa** (`Pose.ik`): le gambe continuano a camminare. **Kamehameha**: carica con le due mani a coppa attorno alla sfera che cresce, anche in movimento; allo sparo le braccia si tendono. **Colpo di Ki**: la sfera cresce sul palmo mentre la ricarica finisce (stessa cadenza) e parte dalla mano (`Pose.tip`). Pose anche per le altre armi (`ARM_FIRE`). Il personaggio si gira verso il bersaglio durante il gesto.
- Per chi usa **sprite propri**: frame facoltativi 10-15 nei fogli e punti `hand` in `sprites.json`; guida con i prompt per Gemini e simili in [`docs/SPRITES_AI.md`](docs/SPRITES_AI.md) e strumento `tools/sheet_from_frames.py`.

**🖥️ Interfaccia e bilanciamento**
- **Barra Esperienza** e **barra della Salute** con la nuova grafica (`xpbar.js`, `hpbar.js`; atlanti generati da `tools/gen_xpbar.py` e `tools/gen_hpbar.py` a partire da `assets/sprites/_sorgenti/barre/`). La barra della Salute mostra il **ritratto del personaggio in gioco**, aggiornato a ogni trasformazione. Sugli schermi stretti restano le barre sottili.
- Il Gacha si chiama ora **Gacha dei Cimeli**.
- **Difficoltà**: i nemici nuovi crescono ogni **60 s** (prima 90): Facile +1% / +1%; Normale e Difficile +10% Salute / +2% Danni; Estrema +15% / +5% / +15% Armatura. Estrema: ogni 30 s +2% frequenza di comparsa e +1% tetto di nemici (60 scatti al massimo).
- **Broly, Berserk** 6 s (8 s nella forma finale; prima 10 e 13) e mira imprecisa (±0,5 rad). La **Calamita** attira anche Borse di zenny e monete. Via del Serpente: isole più rare (una ogni 3.800 px, prima 1.900).
- **🧪 Test aggiunti:** `endless`, `events`, `pose`, `hpbar`; screenshot: `shot_pose`, `shot_hp`.

### 🆕 Aggiornamento del 17 ottobre 2026 (mappe vive, ritmo più calmo, nuove scelte)

Il dettaglio con tutti i numeri prima/dopo è nelle **note di patch del gioco** (📜 nel menu: voce `2026-10-17`, `src/js/patches.js`).

**🗺️ Mappe diverse a ogni partita e animate**
- **Mappe casuali** (`MAP.roll()` in `world.js`, chiamato da `Game`): ogni partita estrae un seme che sposta ostacoli, laghi, tonalità del terreno, decorazioni, trappole, pozze di cura e, sulla Via del Serpente, l'andamento del corpo e le isole. L'area di partenza (250 px) è sempre libera e all'asciutto. `window.__MAPSEED = 0` ripristina la mappa classica, un numero fisso rigioca quel layout (utile nei test). Test: `map_random`.
- **Mare, laghi e lava** (`src/js/sea.js`): il livello d'acqua è un campo di rumore disegnato in chunk 64×64 «pixel» da 4 px, 8 fasi (schiuma che avanza e si ritira, creste d'onda, riflessi), con una palette per Isola di Muten, Pianura Saiyan, Pianeta Namek e **lava** (Inferno). Pesci che saltano e bolle di lava che scoppiano in scintille. Solo scenografia: `Sea.wet(theme,x,y)` tiene fuori da acqua e battigia ostacoli, decorazioni, trappole e pozze di cura.
- **Isola di Muten** ridisegnata a partire da un'immagine di riferimento: sabbia con increspature, battigia bagnata, schiuma, rocce, casse, barili, lapidi, agavi, palme, tane, conchiglie, stelle marine. Pittura dei nuovi oggetti in `src/js/mapart.js` (`MA`), ostacoli a tema per ogni mappa in `OBSTACLES` (`world.js`), nuove particelle d'ambiente in `ambient.js`.
- **Ostacoli da foglio sprite** (`assets/sprites/props/{beach,redrock,waste,other,arena}props.png`, rects e ancore in `sprites.json`): gli ostacoli di Isola di Muten, Pianeta Vegeta, Rovine degli Androidi, Dimensione di Bu e Arena dei Cell Game usano l'arte rifatta (`IM(...)` in `OBSTACLES`, foglio scelto da `PROP_SHEET`); ogni ostacolo ha un peso di comparsa (primo numero di `OB`/`OBS`) e la densità della mappa è `OB_DENS`. L'arte procedurale resta come ripiego finché il foglio non è decodificato. Un ostacolo con `gd` (il ring dei Cell Game, 900 px) è un pavimento disegnato da `Renderer.groundProps` sotto a tutto e non blocca mai. Test: `beachprops [mappa]`.
- **Oggetti con vita** (`src/js/objlife.js`, `ObjLife.draw`): ragni che camminano sul bordo di botti e casse o penzolano dal filo, gabbiani e corvi, granchi, candele con falene, gatti, mosche, cristalli, lanterne, rocce di lava che sputano braci. Solo grafica, disattivata con gli effetti ambientali spenti.
- **Via del Serpente** (`snake_art.js`, `Snake` in `world.js`, `MapDirector.islands`): corpo lungo 22.000 px per lato (prima 12.000), 9 tipi di **isole fluttuanti** percorribili con 3 potenziamenti ciascuna (una volta sola, nome annunciato), uccelli, nebbia e Nuvola Speciale. Test: `snake_isles`, `snake_way`.

**🧯 Meno caos, più leggibilità**
- **Densità** (`SPAWN_K = 0,85`, `CAP_K = 0,78`): ritmo di comparsa a fine stage 8,5× (prima 12×), tetto nemici ×0,78; Facile 0,7 (prima 0,8). Eventi più radi (orde, branchi, Ondata di Kamikaze e di Tiratori, oggetti a terra, eventi «Qualcosa è apparso»), ×1,5 in modalità x2 (`evK`); ondata da 15 s con più nemici (ritmo ×2,6, tetto ×1,5, ogni 110-160 s di calma, la prima a 150-190 s). Il cumulo di monete a terra non c'è più. I nemici fuori schermo riappaiono davanti a te (dal lato in cui stai andando).
- **Fuoco nemico con budget** (`SHOT_*`, `EB_CAP`, `Game.shotOK/shotRefill/shotN/shotCdK`): salve ×0,67, attesa ×1,8 (×2,6 sulla Via del Serpente), una **riserva di colpi condivisa** (12, ricarica 6/s; Via del Serpente 8 e 3,4/s), al massimo 90 proiettili nemici (prima 230). I proiettili delle abilità costano mezzo colpo. I proiettili dei boss non sono nel budget.
- **Le armi distruggono i proiettili nemici** (`cutOne/cutC/cutBeam/cutArc`): raggi, esplosioni, aree, fendenti e proiettili. 
- **Difficoltà** (poi ripristinata, vedi sopra): ogni 90 s i nemici nuovi crescevano di Salute +1% / Danno +1% (Normale) e +2% / +1% / Armatura +5% (Estrema). Il colpo ad area del Cavernicolo Gigante (Isola di Muten) carica 0,5 s in più.

**⚖️ Armi, economia, sblocchi**
- Colpo di Ki evoluto −50% di danno (`KI_EVO_DMG`). Kamehameha: durata del raggio 0,95 → 0,64 s sui livelli 1-5 (prima 0,6 s), evoluzioni 0,80 → 0,68 s e 0,78 → 0,62 s; larghezza ×1,2 / ×2,6 / ×3,1 (prima ×1 / ×1,8 / ×2,1); la base è celeste con un denso alone blu (`KAME_*`).
- **Zenny −20% ovunque** (`ZMUL = 0,8`): monete 4-32, Borsa 20-1040, Élite 20, boss 48, bonus primo completamento 160 per stage, Desiderio 240, doppioni del Gacha 64 / 144 / 320 / 640 / 1280, vendita dei cimeli. Il Gacha estrae fino a **100 alla volta** (×1/×10/×100).
- Negozio: **Cimelio Extra** (fino a 3 cimeli, 3.600 e 10.800 zenny) e **Lista Nera Armi** (fino a 10 ban, da 420 zenny ×1,4). Armi sbloccate vincendo uno stage con chi le possiede. Impostazione **«Rifiuta cimeli di rarità inferiore»**.
- Trasformazioni: **Kaioken e Ultra Istinto solo per Goku**; gli altri Saiyan hanno «Furia Saiyan»; **Vegeta** parte da «Orgoglio Saiyan» e finisce con **Ultra Ego**; Re Kaioh usa Gravità x10/x100 e Maestro Celeste (`SSJ_FORMS`, linee `vegeta` e `saiyan2` in `data.js`).

**🖥️ Interfaccia**
- **Fine stage** riprogettata (titolo compatto con due Sfere del Drago, riepilogo e ricompense a sinistra, danno delle armi con icona e livello a destra); personaggi sbloccati come notifica di 5 s; **Infinita** come pulsante accanto a Riprova/Menu, bloccato finché lo stage non è completato in Estrema. Tasti **1-9/0** e **Spazio** in tutte le finestre di scelta. Sfera di Esperienza con animazione e suono che sale di tono. Nuovi sprite animati per i potenziamenti a terra (+22%). Note di patch con titolo, riassunto e gruppi.
- **🧪 Test aggiunti:** `map_random`, `snake_isles` (isole, budget di fuoco, proiettili tagliati); screenshot: `shot_map`, `shot_props`, `shot_life`, `shot_loot`, `shot_patch`.

### 🆕 Aggiornamento di ottobre 2026 (v35 → v40)

**🎰 Gacha, Borsa dei trinket e Super Sfere del Drago (ultime novità)**
- **Gacha** (pulsante nel menu principale, `src/js/gacha.js` + `src/js/ui_gacha.js`): i **ticket** trovati in partita si spendono per estrarre **trinket**. Tre tipi: **Ticket 1×** (1 estrazione), **Ticket 10×** (10) e **Ticket 10× Fortunato** (10 con probabilità più alte). Si estrae prima la **rarità**, poi uno dei trinket di quella rarità (aggiungere trinket non rende i Mitici più rari).

| Rarità | Ticket normali | Ticket 10× Fortunato | Doppione (80% del valore di Zeno-sama) | Vendita in partita (stage 1) |
|---|---|---|---|---|
| Comune | 72% | 45% | 64 | (80 + 20) × 0,8 = 80 |
| Raro | 20% | 32% | 144 | (180 + 50) × 0,8 = 184 |
| Epico | 6% | 15% | 320 | (400 + 150) × 0,8 = 440 |
| Leggendario | 1,5% | 6% | 640 | (800 + 400) × 0,8 = 960 |
| Mitico | 0,5% | 2% | 1280 | (1600 + 1000) × 0,8 = 2080 |

- **Estrazione animata**: una colonna di Sfere del Drago gira e si ferma sulla sfera della rarità (1, 2, 3, 5 o 7 stelle: più stelle, più scintille e suoni più alti). **Leggendario**: scritta dorata. **Mitico**: lampo, raggi, schermo che trema, scritta «MITICO!» e **suono da jackpot** (`gMythic` in `audio.js`). Con 10 estrazioni i trinket compaiono uno dopo l'altro con pop-in e suono; «Salta» mostra tutto subito. Ogni carta è marcata **NUOVO** o **DUPLICATO** (il doppione paga il valore di mercato di Zeno-sama in zenny).
- **Borsa dei trinket** (dal Gacha e dalla selezione del personaggio): tutti i trinket ottenuti, con filtro per rarità, **ricerca per nome o effetto**, ordinamento per data di ottenimento (più/meno recenti), rarità o nome. Una voce per ogni coppia trinket + rarità.
- **Slot Trinket** nella selezione del personaggio (a destra dello sprite): il **+** apre la Borsa e il trinket scelto parte con te in ogni partita (**uno solo**, alla rarità ottenuta, non conta come «trinket trovato» per gli obiettivi). Se lo sostituisci in partita, quello della Borsa resta tuo.
- **Trinket trovati in partita**: quando li sostituisci o li rifiuti li vendi; **quelli ancora portati a fine partita entrano nella Borsa** (`Game.keepHeld` → `Progress.keepTrinket`, uno per cimelio + rarità; un doppione si vende, o ne migliora la perfezione se più alta; chip nella schermata finale). Vendita: ricevi il valore di mercato di Zeno-sama (+30% per livello di difficoltà dello stage, `trinketSale`) più un bonus per rarità (+20 / +50 / +150 / +400 / **+1000** per il Mitico). Non succede nel negozio di Zeno-sama né con il trinket della Borsa.
- **8 nuovi trinket a sole statistiche** (Guscio di Muten Roshi, Gi da Allenamento Pesante, Pesi da Allenamento, Tessera Capsule Corp., Medaglia del Torneo, Maschera di Jackie Chun, Pergamena della Tartaruga, Cintura del Campione): esistono a tutte le rarità (statistiche minime nei Comuni, al massimo nei Mitici, con i tetti `TCAP`). Il pool conta 29 trinket, 22-25 per rarità.
- **Fonti di ticket**: ogni **Élite** → Ticket 1×; ogni **boss** → 20% di un Ticket 10×; la quarta scelta del desiderio delle Sfere del Drago, **«10 Ticket»** → un Ticket 10×. I ticket si salvano a fine partita (anche in caso di sconfitta, una sola volta anche con «Continua») e sono elencati nella schermata finale; un contatore è nell'interfaccia in partita.
- **Super Sfere del Drago** (`supPlan`/`updateSuperPlan`, `drawSuperBall`): negli **ultimi 3 stage** (Dimensione di Bu, Regno degli Dei, Torneo del Potere) le Sfere normali non compaiono più. Nel **55%** delle partite, tra il 28% e il 55% della durata, ne cade una **gigante dal bagliore dorato** a 520-700 px (freccia dorata ai bordi), **sorvegliata** da un anello di 16 nemici (+3 per livello di difficoltà, +30% vita) quando ti avvicini a meno di 340 px. Dalla v53 sono **3** (1-3 stelle, una per **Tamagami**), si salvano in `save.sball` e **restano tra una partita e l'altra**.
- **Super Shenron**: con tutte e 3 le Super Sfere compare, come prima carta del menu degli stage, lo scenario speciale dove le 3 si consumano per un **Ticket 10× Fortunato** (porta al Gacha) oppure per **sbloccare gratis un personaggio a scelta** (porta alla selezione del personaggio, dove «Ottieni gratis» sostituisce l'acquisto).
- **Modalità Test**: estrazioni gratis e illimitate; i trinket ottenuti spariscono quando la disattivi. **Salvataggio**: corretto `deepMerge` (un valore predefinito `null`, come lo slot Trinket, non può più far fallire il caricamento).
- **🧪 Test aggiunti:** `gacha` (probabilità su 300.000 estrazioni, ticket, doppioni, borsa, slot, vendita in partita, fonti di ticket, Super Sfere, Super Shenron e tutte le schermate).

**🔄 Aggiornamenti automatici e note di versione (ultime novità)**
- **Nessuna run persa quando esce una versione nuova.** `build.py` marca ogni build con un *id* (hash di tutto il contenuto) e scrive `dist/version.json`; il workflow di GitHub Pages pubblica il file accanto a `index.html`. Il gioco lo legge (senza cache) dopo pochi secondi, poi ogni minuto e quando la scheda torna in primo piano. Se l'id è diverso compare un **avviso gigante con un conto alla rovescia di 10 secondi** (la partita continua e l'avviso non blocca i click); a zero la **partita in corso termina tenendo TUTTE le monete** (niente penalità del 25% per la sconfitta), il salvataggio cloud viene inviato e la **pagina si ricarica da sola**. Nei menu l'avviso è identico ma non c'è nessuna run da chiudere.
- Sicurezze: non fa nulla su `file://`, se `version.json` manca o se il gioco gira in un'anteprima; dopo due ricariche inutili (copia vecchia in cache sul CDN) smette di insistere finché non si ricarica a mano; l'URL viene ripulito dal parametro `?u=`.
- **Note di versione:** il tasto **📜** in alto a destra nel menu principale (con pallino rosso finché c'è una versione non letta) apre l'elenco, con la **data** e i cambiamenti divisi in **Novità**, poi **Correzioni** e **Bilanciamento** (le sezioni vuote spariscono). Per pubblicare una versione basta aggiungere un oggetto **in cima** a `PATCHES` in `src/js/patches.js` (testi `T('italiano','english')`, una riga per modifica).

**🐉 Sfere del Drago e serie di uccisioni**
- **Sprite nuovi** (`assets/dragonballs.webp`, 7 frame 64×64 ricavati dall'immagine di riferimento): ogni sfera ha da **1 a 7 stelle** e in una partita non ne compaiono due uguali finché non le hai tutte; il contatore in basso a destra mostra quali hai.
- **Rimbalzano davvero** sul terreno (lancio, rimbalzi sempre più bassi, poi un saltello ogni 1,6 s) con squash e stretch, **onda d'urto e scintille a ogni atterraggio**, bagliore pulsante, raggi rotanti, colonna di luce e stelline che brillano.
- **Suono dedicato** alla raccolta: `assets/sphere_sound.mp3` (incorporato in `DBS_AUDIO=embed`, copiato in `site/assets/` dal workflow in modalità `link`; se manca si sente il vecchio jingle sintetico).
- **Suono del level-up**: `assets/level_up_sound.mp3` (chiave `levelup` in `SFX_FILES`), riprodotto a velocità ×2 (`playBuf('levelup',.9,2)`); finché non è decodificato suona l'accordo sintetizzato. Il suono della scelta della carta (`lvl`) non cambia.
- **Raccolta:** niente più attrazione e raggio ridotto (11 px invece di 20 + magnete): bisogna **passarci sopra**. Le frecce ai bordi dello schermo restano.
- **Serie di uccisioni:** contatore in alto a destra (si azzera dopo 4 s senza uccisioni); ai traguardi **25, 50, 100, 200, 350, 500, 750, 1000…** un banner, onde di luce e un po' di esperienza (qualche % di livello). Quattro nuovi obiettivi (50 / 200 / 500 / 1000 di fila).

**🌊 Ondate, élite, sfera garantita ed effetti ridotti**
- **Ritmo a ondate** (`updateWave` in `src/js/game.js`): calma → **picco di 15 s** (spawn ×1,75, tetto ×1,2, banner rosso) → **respiro di 12 s** (spawn ×0,3, banner azzurro, **pioggia di 10-16 gemme** attorno al giocatore pari a circa il 9% di un livello, e le gemme dei nemici valgono **+50%**) → di nuovo calma per 38-52 s (× radice della durata). Il picco **non parte** durante un boss, a meno di 22 s da un'orda, durante le ondate di kamikaze o tiratori, a meno di 25 s da un boss o negli ultimi istanti; se arriva un boss a metà picco, finisce subito. Costanti in cima a `game.js` (`WAVE_SURGE`, `WAVE_REST`, `WAVE_RATE`, `REST_RATE`, `REST_GEM`...).
- **Nemici élite** (`planElites`/`spawnElite`/`eliteDown`): da 2 a 6 per partita (uno ogni ~210 s), distribuiti tra i boss e mai a meno di 28 s da uno; nascono più forti a ogni uscita. Sono una versione grande (×1,35), dorata e con barra della vita del nemico più forte della lista (×9 vita, +45% danni, armatura, quasi immuni al respingimento, esperienza ×6). Compaiono come **stella dorata sulla barra di avanzamento**; non arrivano durante un picco o un boss. Alla sconfitta lasciano **sempre un forziere** (un potenziamento o un'evoluzione **più un oggetto garantito**, non la scelta da boss), monete e gemme.
- **Borsa di zenny** (`bagValue`, `MapDirector.spawnLootPoint`): il mucchio di monete che ogni tanto compare sulla mappa è una **borsa** (~36% dei bottini a terra, circa una ogni 3 minuti) con il valore scritto sopra. Valore = `0,8 × 1000 × t / 1800`, arrotondato a 5 (min 20, max 1040): 20 all'inizio, ~265 al minuto 10, 400 al 15, **800 al 30** (prima del −20% agli zenny: 25-1300, 1000 al 30). Dura 90 s, ha la freccia sul bordo schermo ed è attratta dal magnete. Aggiunge al totale della partita il valore *base*: i bonus agli zenny (Avidità, Totem della Ricchezza, Jackpot…) si applicano a fine partita su tutto.
- **Valore delle monete** (`coinValue`): ogni moneta a terra (nemici, bottini sulla mappa, Bubbles) vale `5 + 35 × t / 1800` zenny, **da 5 a 40 al minuto 30, mai oltre 40** (il tetto evita il farming con molti nemici). Il Jackpot e il Deposito di monete mantengono la propria scala.
- **Negozio:** «Rimborsa tutto» restituisce il **100%** degli zenny spesi (senza percentuale sul pulsante).
- **Sfera del Drago garantita** (`updateBallPlan`): ogni `clamp(durata×0,28; 100; 270)` secondi (la prima dopo il 75% dell'intervallo) ne cade una a 280-420 px dal giocatore, **mai due insieme, mai durante un boss, mai nell'ultimo minuto**; resta 150 s e la freccia ai bordi la indica. Il drop casuale dai nemici (0,07%) resta.
- **Effetti ridotti** (Impostazioni > Video, `settings.reduceFx`, flag globale `FXL.on`): −60% particelle, meno fulmini, **niente scariche elettriche, colonne di luce, fiamme del Kaioken e raggi rotanti** delle sfere, bagliori al 60%, lampi del -70%, tremolio schermo ridotto, particelle d'ambiente dimezzate. Gli anelli d'urto restano perché portano informazioni di gioco. Testo tradotto in 6 lingue.
- **Opacità degli effetti** (slider 0-100% sotto «Effetti ridotti», `settings.fxAlpha`, `FXL.a`): scala l'opacità di tutto ciò che è *del giocatore*: armi e proiettili, raggi, particelle, anelli, aure (trasformazioni, Kaioken, Berserk), cariche; 0% = invisibili. Il rendering avvolge `globalAlpha` del contesto (`fxBegin`/`fxEnd` in `renderer.js`) con una curva `a^1,7` (gli strati additivi si sommano oltre il 100%, quindi una scala lineare sembrerebbe invariata fino a valori bassi). **Non toccati**: sprite del personaggio, proiettili e zone di pericolo dei nemici, interfaccia.
- **Menu principale:** titolo più grande (fino a 980 px, 45% dell'altezza) e più in alto; il badge **W.I.P.** ora è ancorato in basso a destra del titolo (non più sul bordo destro dello schermo).

**⚡ Abilità, ricariche e prezzi (ultimi ritocchi)**
- **Le abilità crescono con le trasformazioni:** a metà della linea ottengono un **bonus passivo** nuovo, nella **forma finale** un **effetto potenziato** (onda piccola → enorme, raggio doppio, scudo più lungo, Berserk di 13 s…); i testi sono nella scheda del personaggio e nel tooltip.
- **Ricariche** ridotte del 30% e in calo a ogni livello (−0,2 s, al massimo −10 s). Il **Berserk di Broly** ora dà **+80% danni e +5 armatura** (+8 in forma finale).
- **Prezzi di sblocco** ricalcolati su abilità, statistiche e forza nell'anime. Sotto la scelta della difficoltà non c'è più il testo sul x2 (si legge passando il mouse sul pulsante). Sprite: niente più linee sopra gli occhi.
- La **barra di avanzamento** mostra di nuovo i traguardi: teschio rosso = boss, teschietti bianchi = orde, drago Shenron = boss finale.

**🏆 Obiettivi, menu e Shop di Zeno (ultime novità)**
- **Obiettivi:** ricompense molto più alte (es. Cacciatore 200, Sterminatore 500, completare uno stage 1.000, livello 10 → 50, 25 → 100, Leggenda 500, Esprimi un desiderio 500…) e **oltre 20 nuovi obiettivi** (Zeno-sama, cimelio Mitico, Kaioken ×20, Estremo, 30 minuti, serie di boss, partite giocate, personaggi sbloccati…), un obiettivo per ogni stage (anche Via del Serpente).
- Ogni obiettivo ha una **barra di avanzamento** (es. 100/500 uccisioni, 1/4 stage) e la schermata ha **barra di ricerca** (nome o descrizione), filtro **Nascondi ottenuti** e ordinamento **Più vicini al completamento**.
- **Glossario** e **Grimorio** non sono più nel menu principale: si trovano **in alto a destra nella selezione personaggio**.
- Nel menu principale, a destra, il badge animato **W.I.P.** (work in progress) che rimbalza avanti e indietro.
- **Shop di Zeno:** Zeno-sama rimbalza su e giù; gli oggetti mostrano una **nuvoletta** con gli effetti quando ci si avvicina (distanza media), mentre per **comprarli** bisogna stare proprio sopra l'oggetto: niente acquisti involontari.

**⚡ Effetti e abilità (ultimi ritocchi)**
- Il **modello del personaggio** è sempre disegnato sopra a raggi, proiettili ed effetti: nessuna abilità lo oscura.
- **Elettricità crescente:** a ogni trasformazione le abilità (raggi, dischi, sfere, aure, meteore, onde…) si circondano di archi elettrici animati e scintille che orbitano, sempre più fitti (nella forma base non ce ne sono).
- **Aura del Kaioken** costante e dinamica come nell'anime: bagliore rosso, fiamme a più strati che ondeggiano, anelli a terra, scintille che salgono; più grande e feroce a ×20. Resta sopra a tutti gli effetti.
- **Kamehameha:** raggio che parte dalle mani e si estende, impulsi di energia che scorrono lungo il raggio, testa pulsante con anelli e scintille, sfera di carica con raggi rotanti. La portata cresce di +1% a ogni livello del personaggio (max +30%) e a ogni livello dell'arma. Stesso trattamento per il **Big Bang Kamehameha** (anche evoluto: testa gigante).
- **Modalità Test:** non si guadagnano più zenny, obiettivi, sblocchi né progressi (come l'Ambiente di test).
- Nella schermata degli stage basta **cliccare un livello** per passare alla scelta del personaggio.
- **Freezer** ora ha 7 forme (con **Dorato**) e **Cell** 6 (Imperfetto → Semi-Perfetto con C-17 → Perfetto con C-18 → Super Perfetto → **Dorato** → **Nero**); a ogni forma salgono statistiche, armatura e vita massima (+12%).

**🗺️ Livelli**
- **Via del Serpente** (Stage 2): si cammina *solo* sul corpo del serpente, nemici e oggetti compaiono solo lì. Ogni 2:30 min (in tempo di gioco scalato sulla durata) i nemici diventano più ardui, fino a un'orda di mini-boss; boss finale **Janemba** in due fasi (forma grassa → animazione di trasformazione → Janemba vero con spada e raggio come nel film). Completarlo in Difficile sblocca **Gogeta**.
- **Inferno** ora viene dopo le saghe di Freezer e Cell (Stage 8). Contiene **Freezer** e **Cell** come mini-boss che *si evolvono a ogni 1/N della loro vita*: Freezer in 7 forme (prima forma → seconda → terza → finale → 100% → **Freezer Dorato** → **Freezer Nero**), Cell in 6 (imperfetto → semi-perfetto, assorbe C-17 → perfetto, assorbe C-18 → super perfetto, dopo l'autodistruzione di Goku → **Cell Dorato** → **Cell Nero**). Ogni forma ha animazione di trasformazione, nuove mosse (Disco Distruttore, Raggio Mortale, Sfera della Morte, Supernova, Kamehameha di Cell, Cell Jr., Taiyoken…) e più armatura e più vita massima a ogni forma. Boss finale: Omega Shenron.
- **Anteprima animata** della mappa (vista dall'alto) su ogni card di stage; ordine canonico aggiornato (vedi tabella sotto).

**⏱️ Difficoltà e bilanciamento**
- Durata uguale su tutte le mappe: **Facile 5 min · Normale 10 · Difficile 15 · Estremo 30** (nuova difficoltà *Estremo*: nemici con molta vita, mai one-shot ma pesanti, boss enormi).
- Ogni **90 secondi** i nemici guadagnano **+10% vita e +2% danni** (cumulativo) e rilasciano **+5% esperienza**. In **Estremo**: **+15% vita, +5% danni, +15% armatura** e **+8% esperienza**.
- **+10% vita** a tutti i nemici (boss compresi) in ogni modalità.
- Negozio: potenziamenti leggermente più forti (es. armatura +1/livello, **rigenerazione +0,5 HP/s a livello**), **Scatto rimosso dal negozio** (resta quello base; in gioco si trova il raro trinket *Stivali del Vento*).
- Fix: schermo bianco intermittente (stato del canvas ripulito ogni frame, raggi ellittici blindati).

**💀 Morte e interfaccia**
- Animazione di morte (rallentatore, musica che rallenta), menù entro 2 s con *Riprova*, **riassunto danni per arma e monete raccolte**.
- Schermata di level-up più leggera: il gioco resta visibile sullo sfondo.
- **Modalità Test** (Impostazioni): tutti gli stage e personaggi aperti e negozio gratis; disattivandola tutto torna com'era (con avviso di conferma).

**👹 Nemici molto più vivi**
- Nuovo sistema di **abilità dei nemici** (`src/js/skills.js`): ventagli di ki, anelli, balzi, terremoti, colpi dal cielo, mine, scudo, evocazioni, cura, grido di battaglia, sfere orbitanti, raggi, trottola, tana sotterranea, fendenti. Ogni abilità ha una **preparazione visibile** (nemico che si carica, "!" e alone) e ogni livello ha le sue combinazioni (Saibaman che lasciano pozze acide, Cell Jr. corazzati che evocano Cell Jr., Reaper che si interrano…).
- **Rabbia e trasformazioni** dei nemici: sotto il 50% di vita entrano in furia (aura, più veloci e forti), alcuni **cambiano aspetto** (Super Saiyan, Oozaru, Majin potenziato, demone infuriato, soldato celeste ascendente, cyborg sovraccarico…) o si **evolvono** col tempo.
- Animazioni procedurali: passo, respiro, preparazione e colpo, comparsa con "pop", gelatina per i blob, ondeggiamento dei fantasmi, battito d'ali, impatto al colpo.

**🕳️ Segreti e Shop di Zeno**
- Un segreto per livello, in un momento casuale tra 1:00 e la durata del livello: compare una **freccia con i metri** verso un **altare con un misterioso bottone rosso**. Premendo **E** (come per la Stanza dello Spirito e del Tempo) si apre un portale per lo **Shop di Zeno**.
- Dentro: dimensione "chill" di **60 secondi**, tempo del livello fermo, **abilità e pet disattivati**, **nessuna rigenerazione passiva**. I trinket sono a terra davanti a Zeno-sama: ci si ferma sopra per comprarli (monete della partita), con una **tendina** che mostra oggetto e statistiche.
- La **Fortuna** decide la rarità degli oggetti (fino a leggendario); **1% di oggetti Mitici**.

**🍀 Trinket: uno alla volta, con rarità e Mitico**
- Si porta **un trinket** (fino a **3** con il potenziamento del Negozio «Cimelio Extra», 2 acquisti); con tutti gli slot occupati, trovarne un altro (forziere, capsula, desiderio, Zeno) apre una **finestra di confronto** che mostra tutti quelli che porti e chiede quale sostituire (o se tenerli). L'impostazione **«Salta i cimeli inferiori»** (prima «Rifiuta cimeli di rarità inferiore») vende subito quelli peggiori di tutti i tuoi (rarità più bassa, o stessa rarità con meno **Perfezione**). Ogni cimelio ha una **Perfezione** 0–100% (statistiche −12%…+12%, 100% = aura Ultra Istinto): vedi l'aggiornamento parte 3.
- Ogni trinket può avere rarità **Comune → Mitica**: le statistiche crescono con la rarità e hanno un tetto per rarità (es. danno: leggendario max 15%, mitico max 20%); i testi si aggiornano da soli. Gli altri tier sono stati ridimensionati di conseguenza. Trovare un trinket ha l'1% di chance di essere Mitico.
- Achievement *Collezionista*: ora "Trova 6 cimeli in una partita".

**🕰️ Stanza dello Spirito e del Tempo**
- Gli scambi di statistiche hanno un malus dimezzato; la trasformazione è offerta solo se arriverebbe entro 10 livelli ed è **alternativa** all'arma (o l'una o l'altra); abilità e pet disattivati anche lì (la rigenerazione resta).

**🧪 Test aggiunti:** `roster_unique`, `roster_smoke`, `testmode`, `snake_way`, `snake_boss`, `canvas_state`, `death_seq`, `hell_minis`, `skills_smoke`, `zeno`, `trinkets`, `trial_offers`, `waves` (ondate, élite, sfera garantita), `reducefx`, `dende`, `pets_bag` (compagni, borsa e valore delle monete), `refund`.

### 🎵 Musica per mappa e 💨 Scatto universale
**Musica:** metti un brano in `assets/` col nome della mappa (`android ruins.mp3`, `buu dimension.mp3`, `muten island.mp3`, `tournament of power.mp3`, `namek.mp3`…) e suona in quella mappa, in loop con dissolvenza incrociata. Tabella dei nomi e opzioni di peso in [`docs/MUSIC.md`](docs/MUSIC.md). **Scatto (Shift):** ora ce l'hanno tutti i personaggi. Pulsante in basso a sinistra accanto al Kaioken, ricarica 4 s (si migliora nel negozio con *Scatto Fulmineo*: −0,4 s e +15% danno per livello), infligge danni ai nemici che attraversa e dà invulnerabilità temporanea. **Sprite:** i personaggi con sprite del pack camminano normalmente mentre caricano un raggio e allungano il braccio solo allo sparo; boss e Saibaman con arte nel pack la usano (Cabba e Janemba inclusi).

### 🎨 Nuovi sprite dal pack (32 personaggi) e scatto
I personaggi usano ora gli sprite pixel art del pack in `assets/sprites/` al posto di quelli disegnati dal codice: Goku (tutte le forme, dal Kaioken all'Ultra Istinto), Vegeta, Trunks, Gohan, Piccolo, Crilin, Broly, Freezer, Cell, Bu, Bardock, Raditz, Vegito, Gogeta, Gotenks, Androidi 16/17/18, Cooler, Toppo, Hit, Kefla, Caulifla, Kale, Beerus, Whis, Jiren, Black, Zamasu, Frost e Turles. Durante la **trasformazione** compare la posa di carica con l'aura/esplosione disegnata nello sprite, e lo **scatto** (Slancio) usa la posa orizzontale con la scia di velocità. Il **Kamehameha** usa il raggio del pack (bocca, corpo, testa), tinto col colore dell'arma. I personaggi senza sprite nel pack mantengono la grafica generata dal codice. Autori e avvertenze: [`CREDITS.md`](CREDITS.md), strumenti di importazione in [`docs/SPRITES.md`](docs/SPRITES.md).

### 🌦️ Stage vivi, meteo e giorno/notte
- **Stage animati**: ogni pianeta ha laghi e zone di bioma (secco/rigoglioso), terreno animato (onde di luce, schiuma sulle rive, fessure di lava che pulsano, griglia del Torneo), alberi e bandiere che ondeggiano col vento, bagliori sugli ostacoli, fumo dai rottami, torce, e un sacco di scenografia in più. In giro ci sono **creature** (conigli, rane, granchi, lucertole, scorpioni, piccioni…) che scappano quando ti avvicini, farfalle, lucciole, uccelli con la loro ombra, ombre di nuvole, polvere, braci, ceneri, stelle cadenti e così via.
- **Meteo** (pianure, Namecc, Isola di Muten, Pianeta Vegeta, Arena del Cell Game e altri): **pioggia, temporali con fulmini, nebbia, tempeste di sabbia e vento**, che arrivano e se ne vanno nel corso della partita.
- **Giorno/notte** negli stage all'aperto, con alba e tramonto. Da **Impostazioni → Ambiente** puoi attivare/disattivare **ambiente animato**, **meteo** e **ciclo giorno/notte**, scegliere con una barra **quanto giorno e quanto notte** (100% = sempre giorno, 0% = sempre notte) e la **durata del ciclo**. Tutto è solo estetico: il gameplay non cambia, e un controllo automatico riduce gli effetti se il gioco rallenta.

### 🏆 Torneo del Potere finale
Il Torneo del Potere è ora l'**ultimo stage**: 20 minuti, 12 boss con statistiche molto più alte e **evoluzioni durante lo scontro** (Dyspo, Bergamo, Basil, Lavender, Ribrianne, Cabba, Caulifla, Kale, Frost, Hit, Toppo e **Jiren**, che si evolve fino a *Ira Ultima*).

### 🖼️ Nuovo logo e menù dinamico
- Il titolo testuale è sostituito dal **logo ufficiale del progetto** (`assets/logo.webp`, incorporato nel file finale).
- Lo sfondo del menù è ora una **panoramica veloce degli stage** (cambio con taglio diagonale) con **personaggi casuali** che compaiono, **si trasformano**, usano le loro **abilità** (raggi, nova, cloni, barriere…), lanciano onde di ki ed **emote**. Il tutto è **sfocato** per non disturbare i pulsanti.

![Menu dinamico](docs/screens/menu-dynamic.jpg)

### 📖 Grimorio ed evoluzioni con ricetta
- Un'arma evolve quando è **al livello massimo** *e* hai il **potenziamento giusto** (es. **Zenkai + Kamehameha**); l'evoluzione si ottiene da un **forziere**. Ogni arma ha due ricette (una per evoluzione).
- Nelle carte del level up compare un **tooltip con icone**: "Il potenziamento «Zenkai» evolve l'arma «Kamehameha»". Sull'HUD, un'arma al massimo mostra l'icona del potenziamento che le manca (o un **!** quando è pronta). Se un'arma è al massimo, il potenziamento che le serve compare più spesso.
- La **seconda evoluzione** si sblocca **completando tutti gli stage (Normale o Difficile) con quell'arma nell'equipaggiamento**.
- **Grimorio**: elenca tutte le armi, le evoluzioni e le ricette; ciò che non hai sbloccato è **censurato**. Si apre con **Esc** in partita (scheda *Grimorio*), dalla **scelta personaggio** e dal **menù principale**. Mostra anche i progressi sugli stage completati.

![Grimorio](docs/screens/grimoire.jpg)
![Grimorio in partita](docs/screens/grimoire-pause.jpg)
![Tooltip di evoluzione](docs/screens/evo-hint.jpg)

### 🔴 Gemma rossa (accumulo esperienza)
Quando troppe gemme di esperienza affollano la mappa (oltre 90), quelle **più lontane si fondono in un'unica gemma rossa** che accumula l'XP e riduce il lag. La gemma resta **sempre appena fuori dallo schermo** (se ti allontani, ti segue lungo lo stesso lato) (nessun indicatore: sta a te scoprire da che parte). Raccoglila camminandoci contro (o con il Magnete) per ricevere tutto l'XP in una volta.

### 🫘 Borsa Senzu
- Nel menù del level up può comparire una carta **Fagiolo Senzu** (solo lì, **raramente**, circa 1 level up su 10): il fagiolo va nella **borsa** (fino a **3**). Con la borsa piena la carta cura subito il 50% e alza una statistica a caso.
- Si mangia in partita con **H** (o dal **pulsante a schermo** accanto a quelli del pet e dell'abilità) e cura il **40%** della vita; non si spreca a vita piena.

![Carta Senzu](docs/screens/senzu-card.jpg)

### 🎵 Musica di Namek
Il pianeta **Namek** ha una traccia dedicata, in **loop** per tutta la durata dello stage (durante i boss torna la musica sintetizzata e poi riprende da dove era). Le tracce (menu e Namek) sono state generate con **Suno** e sono incluse in `assets/` (vedi `assets/README.md`).

### ⚡ Trasformazioni e Kaioken
- **Trasformazioni spettacolari**: durante la carica il tempo rallenta, il personaggio è invulnerabile e l'aura si espande; al rilascio parte un'**onda d'urto che attraversa tutto lo stage** (respinge, stordisce e danneggia i nemici, cancella i proiettili nemici) con effetti di luce, fulmini e suono dedicato.
- **Requisiti più alti**: ogni forma richiede almeno **+10 livelli** rispetto alla precedente (livelli 14, 24, 36, 50, 66, 84, 104, 128).
- **Niente ritorno alle forme precedenti**: una volta trasformato non ha senso depotenziarsi.
- **Kaioken x10 / x20**: dopo la forma Kaioken, la linea Saiyan può attivare con `R` (premi di nuovo per cambiare livello, fino a spegnere):

  | Modalità | Statistiche | Prezzo in vita |
  |---|---|---|
  | x10 | danno ×2, velocità ×1,4, ricarica ÷2 | −4 HP/s |
  | x20 | danno ×4, velocità ×2,2, ricarica ÷4 | −8 HP/s |

  Si disattiva quando vuoi e si spegne da solo sotto il 10% di vita; non si può attivare sotto il 20%.

![Trasformazione](docs/screens/transformation.jpg)
![Kaioken x20](docs/screens/kaioken.jpg)

### 😡 Berserk di Broly
Broly ha un'abilità esclusiva sullo stesso tasto del Kaioken (`R`): **perde il controllo per 10 secondi**.
- Attacca a caso i nemici vicini con scatti ed esplosioni a ripetizione.
- I **comandi sono invertiti** e **non si può disattivare**.
- Bonus: danno ×1,8, armatura +3, danni subiti −30%.
- Aura verde perpetua con fiamme, anelli che si espandono, fulmini e **l'urlo di Broly**.
- Cooldown di 45 secondi.

![Berserk](docs/screens/berserk.jpg)

### 🆕 Terza ondata di novità: suoni arcade, sprite HD e 16 nuovi personaggi

**🕹️ Suoni arcade nei menù.** Ogni pulsante ha ora un suono **in stile arcade, forte e ben udibile** (onde quadre "chip"): un *tick* quando ci passi sopra o ti sposti con tastiera/pad, un *coin-blip* al clic, una discesa di note per **Indietro**, una **fanfara** per **Avvia partita**, un *ding* per gli acquisti e un *buzz* quando provi a usare un pulsante disattivato. Il suono vale per tutti i pulsanti HTML (menù, pausa, level up, modali) e usa il volume degli effetti.

**🎨 Sprite dei nemici e dei boss in alta definizione.** Tutti i nemici, i boss e i compagni sono ora disegnati su una griglia di pixel **più fine** (da 6 a 10 pixel per unità, scelta in base alla dimensione a schermo) con un nuovo passaggio di rifinitura: **contorno colorato** (non più nero piatto), **luce di bordo** in alto a sinistra, **ombra di nucleo** in basso a destra e sfumature morbide. Le creature sono state **ridisegnate da zero** con molto più dettaglio: Saibaman (denti, orecchie, sfera-bomba), Cell Jr., drone con propulsori, gelatine lucide, sfera del vuoto con occhio, spettro incappucciato, **Corazzato/Colosso** a piastre con nucleo luminoso, **lupi** (anche il lupo meccanico), **Raptor** e **Dinosauro** (tirannosauro) distinti, **pterodattili** con ali membranose e il **Scimmione Gigante** muscoloso. I nemici umanoidi hanno **teste arrotondate**, occhi con palpebre e riflessi, rivetti sulle armature, fibbie e ciocche di capelli.

![Nemici in HD](docs/screens/enemies-hd.jpg)
![Glossario](docs/screens/glossary-hd.jpg)

**👥 16 nuovi personaggi giocabili (57 in totale)**, ognuno con arma/e iniziali, abilità, linea di trasformazioni, prezzo e condizione di sblocco propri:

| Personaggio | Parte con | Abilità | Sblocco |
|---|---|---|---|
| **Videl** | Calcio Dinamite + Ki | Calcio Volante (scatto) | Livello 18 in una partita |
| **Bulma** | Colpo di Ki | Invenzione Geniale (più monete del Colpo di Fortuna) | Evolvi un'arma in una partita |
| **Yajirobe** | Spada | Scorta di Senzu (cura) · **parte con 1 Senzu in borsa** | 5.000 nemici in totale |
| **Great Saiyaman** | Colpo di Ki | Posa Eroica (critici) | Completa lo Stage 3 |
| **Chiaotzu** | Raggio Perforante | Paralisi Psichica (stordisce) | Stage 6 in Difficile |
| **Recoome** | Cannone d'Impatto | Calcio Recoome (scatto) · gigante | Completa lo Stage 2 |
| **Guldo** | Salto Temporale | Fermatempo | 15 boss in totale |
| **Turles** | Meteora + Ki | Frutto dell'Albero (assorbe) | Completa lo Stage 7 |
| **Nail** | Lancia Ribelle | Spirito Guerriero (potenziamento) | 2.500 nemici in una partita |
| **Re Kaioh** | Kaioken | Allenamento (potenziamento) | 4 trasformazioni in una partita |
| **Pan** | Sfere Eccentriche + Danza | Sangue Saiyan (potenziamento) | 5 trasformazioni in una partita |
| **Dabura** | Spada + Granata Infernale | Onda Demoniaca (nova) | 60 boss in totale |
| **Mr. Popo** | Fulmine Angelico | Scudo del Genio (barriera) | 80.000 nemici in totale |
| **Uub** | Kamehameha + Sfere | Raggio Puro | Stage 4 in Difficile |
| **Frost** | Raggio Perforante + Fulmine | Raggio Mortale (nova) | Completa uno stage in modalità ×2 |
| **Re Piccolo** | Sfera della Distruzione | Rigenerazione Demoniaca · gigante | 250 boss in totale |

Nuove linee di forme: Chiaotzu, Turles, Demoni (Dabura, Re Piccolo), Squadra Speciale (Recoome, Guldo), Re Kaioh, Frost e Uub; Videl, Pan, Bulma, Yajirobe e Mr. Popo usano la linea Umana, Nail quella Namecciana, il Great Saiyaman quella Saiyan. Nuovi stili di capelli: codini, caschetto e cresta.

![Nuovi personaggi](docs/screens/new-characters.jpg)

**🎨 Carte di level-up più leggibili.** Ogni carta di potenziamento ha ora un **colore che indica cosa fa** (🔴 danno, 🔵 velocità, 🟢 salute/cura, 🟡 ricarica, 🟣 raccolta, 🩵 esperienza, 🟠 area, ⚪ armatura) con una **grande icona sfumata sullo sfondo** (spada = danno, cuore = salute, fulmine = velocità, orologio = ricarica, scudo = armatura, magnete = raccolta, stella = esperienza) e un riquadro con l'effetto in chiaro (es. «+15% danno»). Le tecniche mostrano una riga per ogni statistica che cambia (Danno 10,5→13…).

**🌐 Hosting.** Nuova guida [`docs/HOSTING.md`](docs/HOSTING.md) e workflow GitHub Actions per pubblicare il gioco sul proprio dominio a ogni push.

**☁️ Account e salvataggi cloud (opzionale).** Con un progetto [Supabase](https://supabase.com) gratuito il gioco ha **login/registrazione** (email + password, Google opzionale, reset password) e **salva i progressi per account**, sincronizzati su ogni dispositivo. Si può sempre giocare **come ospite**; se al primo accesso esistono progressi sia sul dispositivo sia nel cloud, il gioco chiede quale usare. Guida completa: [`docs/SUPABASE.md`](docs/SUPABASE.md) (schema SQL in [`supabase/schema.sql`](supabase/schema.sql)). Misure di sicurezza e impostazioni consigliate: [`docs/SECURITY.md`](docs/SECURITY.md).

**🖼️ Sprite dei personaggi in HD + spritesheet personalizzati.** I personaggi giocabili usano ora lo stesso motore HD di nemici e boss (pixel più fini, contorno colorato, luce di bordo e ombra). In più puoi **sostituire la grafica con i tuoi spritesheet PNG** (forma base e trasformazioni, con camminata e attacco): metti i file in `assets/sprites/` e ricompila. Guida e modello vuoto in [`docs/SPRITES.md`](docs/SPRITES.md).

### 👥 Nuovi personaggi (prima ondata)
Dallo stile di *Sparking! ZERO*: **Broly** (con tutte le forme), **Zamasu**, **Zamasu Fuso**, **Goku Black**, **Caulifla**, **Kale**, **Dyspo**, **Dr. Gero**, **Androide 21**.
Forme più **canoniche**:
- **Freezer**: Seconda forma → Terza → Forma finale → 100% → **Golden Frieza** → **Black Frieza**.
- **Cell**: Semi-Perfetto → **Perfetto** → Super Perfetto → **Cell Dorato** → **Cell Black**.
- **Broly**: Super Saiyan → Leggendario → Full Power → Forma furiosa → SSJ Broly → SSJ Full Power.
- Zamasu, Goku Black, Zamasu Fuso, Caulifla e Kale hanno ciascuno la propria linea di forme.

I **prezzi di sblocco sono molto più alti** (da 8.000 a 300.000 zenny): oltre al requisito di gioco si possono comprare, ma serve davvero farmare.

### 🐾 Compagni (pet)
Prima di ogni partita scegli un aiutante in base alla **razza**. Segue il giocatore, **raccoglie le gemme di esperienza vicine** e ha un'**abilità attiva** (`Q`) con ricarica:

| Compagno | Razza | Abilità (potenziata verso il basso) | Ricarica |
|---|---|---|---|
| Dende | Namecciano | **Cura**: ripristina il 30% della vita | 30 s |
| Mini Shenron | Drago | **Raccolta magica**: attira le gemme entro 400 px e dà un bonus XP del 5% del livello | 40 s |
| Mini Droid | Androide | **Scudo di energia**: invulnerabile per 1,5 s | 40 s |
| Bubbles | Animale della Terra | **Banana fortunata**: 3 monete a terra e +5% fortuna per 50 s | 36 s |
| Mini Buu | Majin | **Raggio caramella**: stordisce i nemici entro 210 px per 1 s (0,4 s sui boss) | 28 s |
| Saibaman | Saiyan (pianta) | **Autodistruzione**: esplosione ad area (raggio 160 px, 12 danni + 0,8 per livello) | 22 s |

Le abilità dei pet sono state **ridimensionate di almeno tre quarti**: aiutano, ma non risolvono più la partita.

### 🌀 Genkidama potenziata
- La sfera **diventa più grande a ogni livello** dell'arma e ancora di più nelle **due evoluzioni** (più grande anche l'area d'impatto).
- Nelle evoluzioni, quando la sfera cade: **il terreno trema** (scosse ripetute dello schermo e onde d'urto), si aprono **crepe incandescenti** e la zona **brucia per 5-7 secondi** infliggendo danno nel tempo **contenuto** (circa il 11-13% del danno della sfera ogni mezzo secondo).

### 🍀 Fortuna, totem e trinket
- Il **Totem** compare **una sola volta per partita** (premi `E`) e ti offre **3 poteri a caso su 8**:

| Totem | Effetto |
|---|---|
| Fortuna | +1% fortuna a ogni level up, per tutta la partita |
| Rischio | XP ×2 ma +50% danni subiti per 180 s |
| Vitalità | +15% salute massima, +0,4 HP/s e cura immediata del 30% |
| Furia | +12% danno ma ricarica +8% più lenta |
| Ricchezza | +35% zenny e +25% raccolta |
| Guardiano | una barriera blocca un colpo, si ricarica ogni 25 s |
| Tempesta | ogni 20 s (−20% a ogni trasformazione) un fulmine colpisce fino a 4 nemici vicini |
| Spirito | ogni 20 s (−20% a ogni trasformazione) un impulso cura dal 6% fino al 12% e stordisce i vicini |

- **Trinket con rarità** (Comune, Raro, Epico, Leggendario): la fortuna sposta le probabilità verso le rarità alte.
- **Ogni boss lascia un forziere con 4 trinket tra cui scegliere 1**; con la fortuna le opzioni salgono **fino a 10**.

![Scelta del trinket](docs/screens/trinket-pick.jpg)
![Totem](docs/screens/totem.jpg)

### 🎯 Abilità uniche per ogni personaggio
Ogni personaggio ha una **abilità attiva** (tasto `R` o **pulsante a schermo** accanto a quello del pet, con nome, ricarica e stato). I pulsanti per Kaioken (Goku) e Berserk (Broly) sono lì. Sono **16 meccaniche** diverse, tarate per non essere troppo forti:

![Pulsante abilità](docs/screens/ability-button.jpg)

Kaioken ×10/×20 · Berserk · Raggio potente · Nova di ki · Rigenerazione · Accecamento · Scatto invulnerabile · Cloni (3, sparano) · Occhio critico (+35% crit) · Barriera · Assorbimento · Fermo tempo (1,8 s) · Cancellazione · Riavvolgimento (recupera 6 s di vita persa) · Jackpot · Potenziamento temporaneo.

Le abilità sono descritte nel pannello del personaggio.

### 🌍 Ambiente: trappole e zone di cura
Nei livelli compaiono (non troppo spesso) **zone di cura passiva** (3% della vita massima al secondo) e **trappole a punte** che si attivano a intervalli e danneggiano **sia te sia i nemici**. Imparare a posizionarsi diventa parte della strategia.

![Zona di cura](docs/screens/heal-zone.jpg)
![Trappola](docs/screens/trap.jpg)

### 🕰️ Stanza dello Spirito e del Tempo ampliata
Ora dura **1 minuto**, con **arena più grande**, **ostacoli** (pilastri) e **3 pulsanti** da calpestare che attivano **trappole che danneggiano il boss** (ma anche te, se resti nel raggio).
- Il boss ha la **barra di vita** e **attacchi ad area sostanziali** (zone rosse di avvertimento: schianto, nova, meteore, raffiche, onde).
- Alla fine puoi spendere le monete in un negozio: gli **upgrade già acquistati o gratuiti spariscono** dalla lista e, **se li hai presi tutti, il negozio si chiude** e esci dal rift.

![Stanza dello Spirito e del Tempo](docs/screens/spirit-room.jpg)

### ⚔️ Armi: 5 livelli → evoluzione → 5 livelli → seconda evoluzione
- Ogni arma ha **5 livelli**; al massimo, il forziere la **evolve** e riparte da 1 per **altri 5 livelli** (e poi la seconda evoluzione, dopo aver completato tutti gli stage con quell'arma).
- Ogni livello delle evoluzioni dà poco: **+5% danno, −1,5% ricarica, +2% area** (niente numeri esagerati).
- **Colpo di Ki**: molti meno proiettili (da 1 a 3 prima dell'evoluzione, 4 al massimo) e **perforazione +1 solo nella seconda evoluzione**.
- La **Genkidama**, il **Kamehameha** e gli altri raggi hanno nuovi effetti sonori (vedi sotto).

### 👹 Nemici più duri, ondate di tiratori e mosse nuove
- Più **vita** per tutti i nemici e i boss, e **danni molto più alti** (a inizio partita senza negozio non fanno più 8-9 punti).
- I nemici da distanza **non sono più sparsi per tutta la partita**: arrivano in **ondate di 1 minuto** ogni 2-3 minuti, con avvertimento; poi spariscono.
- Nuove **mosse**:
  - **Salto** (lupi, raptor): si accovacciano, saltano in arco e atterrano con un'onda d'urto.
  - **Schianto** (bruti, dinosauri, colossi…): fermi, un **cerchio rosso** avvisa e poi esplodono ad area.
  - **Zig-zag** (cellule, fantasmi, pterodattili…): avanzano in modo ondeggiante.
- Dopo il passaggio di trasformazione c'è ora **il tempo di vedere l'animazione** (circa 4 s) prima del level up.

### 🔥 I boss si potenziano
Se impieghi **troppo tempo** (circa 85 s, poi 70 s) a sconfiggere un boss, questo **si trasforma**: si carica con aura e fiamme, rilascia un'**onda d'urto**, **recupera il 30%** (22% la seconda volta) della vita, diventa più forte e veloce e **impara nuovi attacchi** (schianto, nova, lancia, tempesta, meteore, raffiche). Fino a 2 volte per boss; è invulnerabile durante la carica.

![Boss che si potenzia](docs/screens/boss-powerup.jpg)
![Zona di schianto](docs/screens/slam-zone.jpg)

**Attacchi firmati dei boss.** Ogni boss ha ora 3 attacchi speciali in più (il boss finale li ha tutti e 6), scelti tra: **Muro di ki** (una parete di colpi con un varco), **Raggi incrociati** (quattro linee di esplosioni con avvertimento), **Lampo** (si teletrasporta vicino a te e spara a ventaglio), **Sfere a ricerca** (orbe che ti inseguono), **Vortice** (ti risucchia verso di lui prima di esplodere) e **Cerchio mortale** (otto esplosioni che si chiudono attorno a te). Gli attacchi sono sempre segnalati da cerchi rossi o proiettili visibili.

**Durante i boss:** i nemici normali spawnano un po' meno (−30% di ritmo, −20% di massimo). Nel **boss finale** invece la folla **aumenta** (+50% ritmo, +30% massimo) e i nemici hanno **più vita e armatura** ma infliggono un po' meno danni (−15%); il boss finale ha **+30% vita**, **più armatura** e infligge **−10% di danni**.

### 🔊 Audio rinnovato
Nuovo **Kamehameha elettrico** (carica crepitante e sparo distorto), suoni più "da anime" per Ki e per tutte le armi, effetti dedicati alle **evoluzioni**, **vento d'aura** nelle trasformazioni e suoni per ogni abilità e mossa nemica.

### ⚖️ Bilanciamento
- **Tutti i potenziamenti che aumentano il danno sono a tempo** (es. oggetti raccolti +15% per 12 s, altari 30 s).
- **Esperienza ridotta ulteriormente** e curva dei livelli più lenta: forme alte si raggiungono solo negli stage lunghi e difficili.
- I nemici non uccidono più in un colpo: il danno subito per colpo è limitato a una frazione della vita massima (anche meno per trappole e proiettili dei boss).
- Livelli facili meno banali, livelli difficili senza forme esagerate.

### 🎨 Animazioni, interfaccia e audio
- **Personaggi animati** nel menu di selezione (respirano, sbattono le palpebre, fanno espressioni e pose) e **in partita** (emote al level up, espressioni di dolore o sorpresa, sorriso dopo un boss).
- Gli **zenny** non compaiono più nel menu principale; altrove sono mostrati con un'**icona-moneta d'oro** al posto della "Z".
- **Musica del menu** a file (propagata anche alla selezione personaggio); le altre musiche sono sintetizzate.
- Interfaccia in **6 lingue**: Italiano, English, Español, Français, Deutsch, Português (i nomi dei contenuti di gioco sono tradotti solo in italiano e inglese, le altre lingue usano l'inglese).

---

## Meccaniche di gioco

### Combattimento e armi
- **Attacco automatico**: ogni arma ha il suo comportamento (proiettili, raggi, orbite, zone di fuoco, fulmini a catena, meteore…).
- Puoi portare **fino a 5 armi** e **5 potenziamenti passivi diversi**, ciascuno **fino al livello 5** (le armi poi si evolvono e hanno altri 5 livelli per evoluzione).
- **22 armi**: Colpo di Ki, Kamehameha, Disco Distruttore, Genkidama, Kaioken (aura), Taiyoken, Spada, Colpi Eccentrici, Raggio Perforante, Lancia Ribelle, Doppio Sunday, Cannone Distruttore, Danza Elegante, Boomerang Ginyu, Granata Infernale, Salto Temporale, Impatto Potente, Sfera della Distruzione, Fulmine Angelico, Meteora di Fusione, Big Bang Kamehameha, Calcio Dinamite.
- **Evoluzioni**: un'arma al livello massimo può evolversi (tramite forziere). Ogni evoluzione richiede **arma al massimo + potenziamento specifico** (vedi Grimorio). Una **seconda evoluzione** per arma si sblocca **completando tutti gli stage (Normale+) con quell'arma nell'equipaggiamento**.
- Le armi si **sbloccano** nella pool dei level up semplicemente **vincendo uno stage** con un personaggio che parte con quell'arma (un secondo personaggio con la stessa arma non sblocca nulla di nuovo). Con il potenziamento del Negozio «Lista Nera Armi» (fino a 10) si possono **bandire** armi: non compaiono più come nuove armi tra i potenziamenti.
- **Passivi**: Zenkai (+10% danno), Vigore (+20 HP), Volo veloce (+6% velocità), Scouter (raccolta), Camera Gravitazionale (−5% ricarica), Armatura, Fagioli Senzu (rigenerazione), Meditazione (+8% XP).

### Esperienza, livelli e trasformazioni
- Ogni livello propone carte (arma, potenziamento, ecc.).
- Ogni personaggio ha una **linea di trasformazioni** (Saiyan, Namecciano, Umano, Androide, Freezer, Cell, Broly, Zamasu, Goku Black, Zamasu Fuso, Caulifla, Kale, Pride Troopers, Dei, Majin, più le linee dei personaggi della terza ondata): fino a **8 forme** (Ultra Istinto alla fine di alcune linee).
- Le forme scattano ai livelli **14, 24, 36, 50, 66, 84, 104, 128** e dànno bonus a danno, velocità, ricarica, armatura, rigenerazione e riduzione dei danni, oltre a un nuovo aspetto e colore dell'aura.
- Nella Stanza dello Spirito e del Tempo si può **comprare in anticipo** la forma successiva, ma solo se hai raggiunto almeno il 70% del livello richiesto.

### Oggetti, struttura della run e mappa
- **Forzieri** (uno per boss e uno di rifornimento ogni 5 minuti) con ricompense e trinket.
- **Oggetti a terra**: monete (4-32 zenny secondo il momento), borsa di zenny, cuore, magnete, potenziamenti temporanei di danno/velocità, XP, fortuna.
- **Sfere del Drago**: raccogline 7 per esprimere un desiderio (seconda vita, potere, fortuna).
- **Eventi sulla mappa**: Altare del Potere (bonus temporaneo), Sorgente curativa, Altare del Sacrificio (arma +1 in cambio di metà vita), Fonte dell'esperienza, Deposito di monete, Totem, Stanza dello Spirito e del Tempo.
- **Trinket (20)** in 4 rarità: Scouter rotto, Marsupio Senzu, Fascia da allenamento, Stivali gravitazionali, Radar del Drago, Orecchino Potara, Mantello Namecciano, Nyoibo, Nuvola Speedy, Capsula Hoi-Poi, Cuore di Kaioh, Aureola angelica, Orologio della Stanza del Tempo, Sfera del Drago a 4 stelle, Cristallo divino, Armatura reale Saiyan, Anello del Tempo, Specchio di Kaioh, Cuore del Drago, Furia Saiyan.

### Stage, difficoltà e modalità
| # | Stage | Sblocco |
|---|---|---|
| 1 | Isola di Muten | — |
| 2 | Via del Serpente | clear Stage 1 |
| 3 | Pianura Saiyan | clear Stage 2 |
| 4 | Pianeta Vegeta | clear Stage 3 |
| 5 | Pianeta Namek | clear Stage 4 |
| 6 | Rovine degli Androidi | clear Stage 5 |
| 7 | Arena dei Cell Game | clear Stage 6 |
| 8 | Inferno | clear Stage 7 |
| 9 | Dimensione di Bu | clear Stage 8 |
| 10 | Regno degli Dei | clear Stage 9 |
| 11 | **Torneo del Potere** (finale) | clear Stage 10 |

Gli stage seguono l'**ordine canonico di Dragon Ball** (Dragon Ball → Z → Super) e la difficoltà cresce di stage in stage. Chi aveva già dei progressi non perde nulla: uno stage già completato resta aperto.

Ogni stage ha **nemici dedicati** (oltre 130 varianti totali, ciascuno con IA diversa: inseguimento, tiratori, kamikaze, schermati, schivatori…) e **boss** a tempi prefissati (es. Raditz, Nappa e Vegeta nelle Pianure Saiyan; Freezer su Namek; Cell ai Cell Game; Janemba su Via del Serpente; Freezer e Cell evoluti + Omega Shenron all'Inferno; Jiren al Torneo del Potere). Una **Guida/Glossario** nel menu descrive ogni nemico e boss.

**Difficoltà**

| | Salute nemici | Danni nemici | Quantità | Zenny | Durata |
|---|---|---|---|---|---|
| Facile | ×0,9 | ×0,7 | ×0,8 | ×0,7 | 5 min |
| Normale | ×1 | ×1 | ×1 | ×1 | 10 min |
| Difficile | ×2 | ×1,5 | ×1,4 | ×1,35 | 15 min |
| Estremo | ×4 | ×1,8 | ×1,5 | ×2,4 | 30 min |

**Modalità x2** (si sblocca raggiungendo il boss finale di uno stage): tempo e zenny doppi, esperienza ridotta, nemici più duri.
**Modalità Sandbox** (Impostazioni): provi liberamente armi, forme ed evoluzioni.

### Progressione permanente
- **Negozio** (12 potenziamenti, costo crescente, fino al livello 6 ciascuno; Seconda Vita fino a 2): Avidità, Studio, Vitalità, Rigenerazione, Potenza, Agilità, Magnetismo, Armatura, Tempo, Fortuna, Occhio acuto, **Seconda Vita** (revive).
- **Obiettivi**: traguardi con ricompensa in zenny (uccisioni, boss, élite, vittorie, ore di gioco…) + **5 missioni giornaliere** che cambiano ogni 6 ore. Le condizioni di sblocco di personaggi e armi sono nella schermata **Achievement**.
- **Personaggi**: 4 disponibili subito (Goku, Vegeta, Piccolo, Crilin); gli altri si sbloccano con una **condizione** (completare stage, anche in Difficile, raggiungere un livello, sconfiggere tot nemici/boss) **oppure comprandoli** con zenny.
- Salvataggio automatico nel browser (localStorage); reset dalle Impostazioni.

![Stage](docs/screens/stages.jpg)
![Boss](docs/screens/boss.jpg)

### Personaggi giocabili

| Linea di forme | Personaggi |
|---|---|
| Saiyan | Goku, Vegeta, Trunks, Gohan, Goten, Gotenks, Vegito, Gogeta, Kefla, Raditz, Nappa, Bardock, Great Saiyaman |
| Namecciano | Piccolo, Nail |
| Umano | Crilin, Yamcha, Tensing, Muten, Mr. Satan, Videl, Bulma, Yajirobe, Pan, Mr. Popo |
| Androide | C-18, C-17, C-16, Dr. Gero, Androide 21 |
| Freezer | Freezer, Cooler, Capitan Ginyu, Zarbon |
| Cell · Majin | Cell · Majin Bu |
| Pride Troopers | Toppo, Hit, Jiren, Dyspo |
| Dei | Beerus, Whis |
| Linee dedicate | Broly, Zamasu, Zamasu Fuso, Goku Black, Caulifla, Kale, Chiaotzu, Turles, Dabura e Re Piccolo (Demoni), Recoome e Guldo (Squadra Speciale), Re Kaioh, Frost, Uub |

---

## Build e sviluppo

Servono solo **Python 3** (per il bundler) e, opzionalmente, **Node.js** (per i controlli di sintassi e i test).

```bash
python3 build.py --check      # crea dist/dragon-ball-survivors.html e controlla la sintassi con node
```

Apri `dist/dragon-ball-survivors.html` in un browser moderno (consigliato Chrome/Edge/Firefox): è **autosufficiente**, funziona anche offline (i font Google sono opzionali, c'è un fallback).

Per la **musica del menu** è già inclusa in `assets/menu.mp3` (vedi [assets/README.md](assets/README.md)); per cambiarla sostituisci il file; se manca viene usata una musica sintetizzata.

**Pubblicarlo con GitHub Pages**: dopo `python3 build.py`, copia `dist/dragon-ball-survivors.html` in `docs/index.html` (o usa una GitHub Action) e abilita Pages su `main` / cartella `docs`.

## Struttura del progetto

```
build.py              bundler: unisce src/ in un unico HTML
src/index.html        pagina
src/css/style.css     stile (gacha.css: Gacha, Borsa, slot Trinket)
src/js/
  util.js data.js     utilità e dati (armi, personaggi, stage, nemici, boss, trinket, pet, negozio…)
  i18n*.js            traduzioni (it, en, es, fr, de, pt)
  weapons*.js         comportamento delle armi
  world.js            seme della mappa (MAP), terreno, ostacoli, zone di cura e trappole, Via del Serpente
  mapart.js           pittura degli oggetti a tema (casse, barili, lapidi, agavi, cristalli…) e decorazioni a terra
  sea.js objlife.js   mare, laghi e lava animati / piccola vita sugli oggetti (ragni, uccelli, candele…)
  snake_art.js        isole fluttuanti, nuvole e dettagli della Via del Serpente
  save.js             salvataggio, progressione, obiettivi, impostazioni
  gacha.js            Gacha: ticket, probabilità, Borsa dei trinket, vendita, Super Sfere
  game.js             logica di gioco (senza DOM) + MapDirector (eventi, totem, stanza)
  sprites.js          sprite procedurali dei personaggi (con espressioni)
  pose.js             braccia del personaggio per arma (cinematica inversa), pose di Kamehameha, Colpo di Ki e altre armi
  events.js events_draw.js   eventi di mappa a tema (dati, logica, animazioni)
  xpbar.js hpbar.js (+ *_meta.js)   barre Esperienza e Salute con la grafica in assets/ (atlanti da tools/gen_xpbar.py e gen_hpbar.py)
  sprites_hd.js       pipeline HD per nemici, boss e pet (contorno colorato, luci) e creature ridisegnate
  audio.js            effetti sonori sintetizzati e musica
  cloud.js            account e sincronizzazione salvataggi (Supabase)
  update.js           avviso di nuova versione (version.json), conto alla rovescia e ricarica
  patches.js ui_patch.js   note di versione (dati + schermata)
  ui_account.js       schermate login / registrazione / conflitto
  input.js renderer.js ui.js ui2.js app.js   input, rendering, interfaccia e ciclo principale
  ui_gacha.js         schermata Gacha e animazione, Borsa, slot Trinket, Super Shenron
tests/                simulazioni e test con puppeteer
docs/screens/         screenshot usati in questo README
```

## Test

Test headless in Node (simulano partite complete con un bot) e test end-to-end con Puppeteer:

```bash
node tests/check_i18n.js      # verifica le traduzioni in tutte le lingue
node tests/map_random.js      # mappe casuali: seed, area di partenza libera, Via del Serpente su 25 seed (puppeteer)
node tests/snake_isles.js     # isole della Via del Serpente, budget del fuoco nemico, proiettili tagliati (puppeteer)
node tests/endless.js         # modalità Infinita: monete, 50 livelli, armi Lv 100, Zeno, pagamento, scalatura, Berserk, Calamita (puppeteer)
node tests/events.js          # eventi di mappa: i 11 stage, annunci, trasformazioni, fine evento (puppeteer)
node tests/pose.js            # animazioni delle armi: frame senza braccia, IK, Kamehameha / Colpo di Ki, pose, frame 10-15 degli sprite (puppeteer)
node tests/hpbar.js           # barra della Salute con ritratto dinamico (puppeteer); screenshot: shot_pose.js, shot_hp.js
node tests/shot_map.js beach out.png 1024 576 water 0   # screenshot di una mappa (anche shot_props, shot_life, shot_loot, shot_patch)
node tests/v53.js             # v53 gameplay: bilanciamento, TAB, armi per partita, sacchi di zenny, Senzu, totem, Tamagami, acqua e lava (puppeteer)
node tests/v56.js             # v56 ragni, ombre degli uccelli, numeri di danno arcade e critici rossi (puppeteer)
node tests/v54.js             # v54 cimeli e compagni: Perfezione, forziere a 4, salta-inferiori, compagno (XP + onda d'urto), gacha, scambio, aura (puppeteer)
node tests/eco52.js           # v52 economia: Reroll/Salta/Ban, Zeno, ticket, serie monete, Achievement, Obiettivi, missioni (puppeteer)
node tests/ui52.js            # v52 interfaccia: ingranaggio, ricerca/ordine personaggi, Avvio rapido, notifiche (puppeteer)
node tests/gacha.js           # Gacha: probabilità, ticket, Borsa, slot, vendita, Super Sfere (puppeteer)
node tests/kai.js             # Kaioken x10/x20 (statistiche, consumo, spegnimento)
node tests/bers.js            # Berserk di Broly (durata, cooldown, non annullabile)
node tests/totem.js           # totem unico + 8 poteri
node tests/abil.js            # tutte le abilità dei 58 personaggi
node tests/newchars.js        # i 16 nuovi personaggi: dati, sblocchi, Senzu di Yajirobe, run complete
node tests/ui_sfx.js          # suoni arcade dei pulsanti (hover, clic, indietro) - richiede puppeteer
node tests/sheet_hd.js en out.png   # anteprima di tutti gli sprite nemici (anche: boss, o chiavi separate da virgola)
node tests/shot_enemies.js out.png  # screenshot in partita con tutti i nemici
node tests/boss.js            # potenziamento dei boss, schianti
node tests/boss2.js           # attacchi firmati dei boss, regole di spawn
node tests/spirit.js          # stanza dello Spirito e del Tempo
node tests/senzu.js           # borsa Senzu
node tests/gems.js            # gemma rossa (accumulo XP)
node tests/sim.js             # simulazione con tutti i personaggi
node tests/death.js 0 normal 6 goku     # bilanciamento: stage, difficoltà, partite, personaggio
node tests/lvfull.js "1,2,5,10" normal  # ritmo di livelli e forme
# e2e/smoke (richiedono puppeteer e un browser): e2e.js e2e2.js e2e3.js e2e4.js smoke5.js smoke6.js smoke7.js
```

> Nota: il bilanciamento è stato verificato con un bot volutamente debole; l'esperienza reale di una persona può essere più facile. Segnalazioni e proposte sono benvenute nelle issue.

## Licenza

Il **codice** è sotto licenza [MIT](LICENSE). Nomi, personaggi e marchi di Dragon Ball **non sono coperti** da questa licenza e appartengono ai rispettivi proprietari ([DISCLAIMER.md](DISCLAIMER.md)).
