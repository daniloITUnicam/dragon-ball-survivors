<p align="center"><img src="docs/logo.png" alt="Dragon Ball: Survivors" width="560"></p>

# Dragon Ball: Survivors

> 🇬🇧 English version: [README.en.md](README.en.md)

Un survivor-like in stile *Vampire Survivors* ispirato a Dragon Ball: ti muovi, le armi sparano da sole, raccogli esperienza, sali di livello, ti trasformi e sopravvivi fino al boss finale. Si gioca nel browser, da PC e da telefono, in **un solo file HTML** (Canvas 2D e JavaScript puro, nessuna dipendenza).

> ⚠️ Progetto amatoriale, non ufficiale e senza scopo di lucro. Non è affiliato a Toei Animation, Shueisha, Bandai Namco né agli eredi di Akira Toriyama. Vedi [DISCLAIMER.md](DISCLAIMER.md).

<p align="center"><img src="docs/screens/it/menu.jpg" alt="Menu" width="860"><br><sub>Menu</sub></p>

## Indice

1. [Come si gioca](#come-si-gioca)
2. [Controlli](#controlli)
3. [Modalità di gioco](#modalità-di-gioco)
4. [Dentro la partita](#dentro-la-partita)
5. [Personaggi, armi e trasformazioni](#personaggi-armi-e-trasformazioni)
6. [Cimeli e Gacha](#cimeli-e-gacha)
7. [Stage, nemici e boss](#stage-nemici-e-boss)
8. [Progressione permanente](#progressione-permanente)
9. [Online e co-op](#online-e-co-op)
10. [Schermate e opzioni](#schermate-e-opzioni)
11. [Grafica e sprite dei personaggi](#grafica-e-sprite-dei-personaggi)
12. [Build e sviluppo](#build-e-sviluppo)
13. [Struttura del progetto](#struttura-del-progetto)
14. [Licenza e crediti](#licenza-e-crediti)

---

## Come si gioca

1. Dal menu scegli **Gioca** (o **Avvio rapido**), poi lo stage, il personaggio, il **compagno** e quante armi portare (da 1 a 5).
2. Ti muovi tu: **le armi attaccano da sole**. Con `Tab` scegli chi colpire (il più vicino, quello con più o meno Salute, il boss).
3. I nemici lasciano **gemme di esperienza**: raccoglile per salire di livello e scegliere una carta (arma, potenziamento, ecc.).
4. Ai livelli giusti ti **trasformi** (Super Saiyan, Ultra Istinto…): ogni forma dà bonus per tutta la partita.
5. Sopravvivi **30 minuti**, poi sconfiggi il **boss finale** dello stage. Hai 30 secondi per raccogliere il bottino prima della schermata di vittoria.
6. Se muori tieni comunque gli zenny guadagnati. Con gli **zenny** compri potenziamenti permanenti nel Negozio, personaggi e ticket del Gacha.

<table><tr><td width="50%"><img src="docs/screens/it/run.jpg" alt="Una partita: armi automatiche, combo e Serie di uccisioni"><br><sub>Una partita: armi automatiche, combo e Serie di uccisioni</sub></td><td width="50%"><img src="docs/screens/it/levelup.jpg" alt="Level-up: tre carte, con Reroll, Skip e Ban"><br><sub>Level-up: tre carte, con Reroll, Skip e Ban</sub></td></tr></table>

## Controlli

### Tastiera e mouse

| Azione | Tasti |
|---|---|
| Muoversi | `W` `A` `S` `D` / frecce |
| Abilità del personaggio (Kaioken, Berserk, raggi, cloni, ferma tempo…) | `R` o `X` |
| Scatto (danni sul percorso e invulnerabilità breve) | `Shift` |
| Fagiolo Senzu (cura 50% e un bonus alle statistiche, dalla borsa) | `H` |
| Abilità del compagno | `Q` |
| Interagire (altari, totem, forzieri, Macchina dello Scambio, Stanza dello Spirito e del Tempo…) | `E` o `F` |
| Cambiare bersaglio delle armi | `Tab` |
| Pausa (mappa, statistiche, cronologia eventi, impostazioni) | `Esc` o `P` |
| Scegliere una carta nelle finestre di scelta | `1`–`9` (`0` = la decima) |
| Premere il pulsante evidenziato / uscire dalla Stanza dello Spirito e del Tempo | `Spazio` |
| Conferma / indietro nei menu | `Invio` o `Spazio` / `Esc` o `⌫` |
| Zoom della telecamera | rotella del mouse (50–150%, a passi del 10%) |
| Contatore FPS e diagnostica | `F2` o `` ` `` |

Il **Kamehameha** si carica tenendo premuto il tasto dell'abilità. Tutti i tasti si riassegnano da **Impostazioni → Comandi**.

### Gamepad

| Azione | Pulsante |
|---|---|
| Muoversi / menu | D-pad |
| Conferma / interagire | A |
| Indietro | B |
| Abilità del compagno | X |
| Abilità del personaggio | Y |
| Fagiolo Senzu | LB |
| Scatto | RB |
| Cambiare bersaglio | pressione dello stick sinistro |
| Pausa | Start |
| Diagnostica | Select |

### Telefono e tablet

Joystick virtuale a schermo e pulsanti grandi con le icone di **abilità**, **Scatto**, **Fagiolo Senzu**, **compagno** e **Interagisci** (`E`). L'interfaccia si rimpicciolisce per lasciare più campo visibile, la mappa in pausa si trascina con il dito.


<p align="center"><img src="docs/screens/it/m_game.jpg" alt="Su telefono: pulsanti touch" width="860"><br><sub>Su telefono: pulsanti touch</sub></p>

---

## Modalità di gioco

| Modalità | Come funziona |
|---|---|
| **Classica** | Una partita da 30 minuti per stage che finisce con il boss finale. Una sola difficoltà: la sfida cresce col tempo (nemici più numerosi dal minuto 3, più forti ogni 5 minuti, miniboss e élite). |
| **x2** | Si sblocca raggiungendo il boss finale di uno stage: la partita dura la metà, l'esperienza è ridotta, i nemici sono più duri. Nessun moltiplicatore di zenny. |
| **Infinita** | Si sblocca vincendo lo stage («Continua»): le armi salgono fino al Lv 100, la ricarica può scendere a 0,2 s, il negozio di Zeno-sama compare ogni 5 minuti e ogni 50 livelli ricevi 100 monete mentre i nemici diventano più forti. Dal menu di pausa imposti priorità e scelta automatica dei potenziamenti. |
| **Avvio rapido** | Parte subito con l'ultimo personaggio e stage usati. |
| **Sfida settimanale** | Stesso stage, personaggio e seme per tutti per una settimana: il primo in classifica ti torna contro come fantasma. |
| **Co-op** | Fino a 4 giocatori nello stesso mondo (BETA). Vedi [Online e co-op](#online-e-co-op). |

---

## Dentro la partita

### Combattimento
- **Attacco automatico**: ogni arma ha il suo comportamento (proiettili, raggi, orbite, zone di fuoco, fulmini a catena, meteore…). I colpi pesano: numeri di danno arcade (rossi per i critici), combo, **Serie** di uccisioni con barra e fasce (50, 100, 200, 500).
- **Debolezze**: ogni boss ne ha una. Alcuni attacchi nemici si possono distruggere.
- **Ki Clash**, **Ultimo respiro**, alleati che arrivano in aiuto, cinematiche dei boss e delle trasformazioni (la telecamera si stringe e tutto si ferma finché l'aura esplode).
- **Level-up**: oltre alle carte puoi usare **Reroll**, **Skip** e **Ban** (strumenti del Negozio) e il level-up automatico con le tue priorità (Impostazioni).

<table><tr><td width="50%"><img src="docs/screens/it/boss.jpg" alt="Un boss con la sua barra e la debolezza"><br><sub>Un boss con la sua barra e la debolezza</sub></td><td width="50%"><img src="docs/screens/it/transform1.jpg" alt="Trasformazione: la telecamera si stringe mentre l'aura esplode"><br><sub>Trasformazione: la telecamera si stringe mentre l'aura esplode</sub></td></tr></table>

### Che cosa trovi sulla mappa
Ogni partita ha una mappa diversa e viva (meteo, giorno/notte, mare e lava animati, creature, oggetti da rompere).

| Elemento | Cosa fa |
|---|---|
| **Forzieri** | Uno per boss e uno di rifornimento ogni 5 minuti, in cinque rarità, con potenziamenti e cimeli. |
| **Zenny e oggetti** | Monete, borse di zenny, cuori, magnete, potenziamenti temporanei, esperienza, Fortuna. I punti di bottino compaiono più spesso con il loot extra. |
| **Sfere del Drago** | Raccogline 7 per evocare **Shenron** (4 desideri proposti tra seconda vita, potere, fortuna, ticket, immortalità, trasformazione, leggenda). Le 3 **Super Sfere** custodite dai Tamagami chiamano **Porunga**. |
| **Altari e sorgenti** | Altare del Potere, Sorgente curativa, Altare del Sacrificio, Fonte dell'esperienza, Deposito di monete, Altari Sfida (boss più forti in cambio di più scrigni). Si usano con `E`. |
| **Totem** | 8 poteri: Fortuna, Rischio, Vitalità, Furia, Ricchezza, Guardiano, Tempesta, Spirito. |
| **Stanza dello Spirito e del Tempo** | Compri in anticipo la forma successiva (con almeno il 70% del livello richiesto) e affronti un Maestro che imita le tue armi. |
| **Macchina dello Scambio** | Compare in circa il 12% delle partite: ci metti fino a 3 cimeli, lavora ~10 secondi **mentre giochi** (barra di avanzamento sopra di lei) e ti restituisce cimeli diversi della stessa rarità, con perfezione uguale o migliore. |
| **Tunnel** | Ne compare uno ogni 15 minuti: tunnel a senso unico con un boss in fondo e 3 casse. |
| **Portale di Zeno** | Il negozio di Zeno-sama. |
| **Visite a sorpresa** | Un personaggio arriva con una missione da 60 secondi; Cerchio di allenamento, Capsule Corp, Saibaman d'oro che scappa col bottino. |
| **Trappole e zone di cura** | Rare ma pericolose o preziose. |
| **Eventi a tema** | Ogni stage ha un evento in cui i nemici si trasformano (annunci in 6 lingue). |
| **Orde, élite, miniboss** | Orde a tema (la prima a 2 minuti, poi una ogni 5) guidate da un élite, un miniboss ogni 5 minuti, nemici che salgono di grado. |

La mappa in pausa (grande, con zoom) mostra dove sono i pickup; frecce ai bordi dello schermo indicano gli oggetti importanti.

<table><tr><td width="50%"><img src="docs/screens/it/altars.jpg" alt="Altari e sorgenti sulla mappa"><br><sub>Altari e sorgenti sulla mappa</sub></td><td width="50%"><img src="docs/screens/it/machine.jpg" alt="Macchina dello Scambio"><br><sub>Macchina dello Scambio</sub></td></tr></table>

<table><tr><td width="50%"><img src="docs/screens/it/totem.jpg" alt="Totem: scegli un solo potere"><br><sub>Totem: scegli un solo potere</sub></td><td width="50%"><img src="docs/screens/it/chamber.jpg" alt="Stanza dello Spirito e del Tempo"><br><sub>Stanza dello Spirito e del Tempo</sub></td></tr></table>

<table><tr><td width="50%"><img src="docs/screens/it/shenron.jpg" alt="Shenron esaudisce un desiderio"><br><sub>Shenron esaudisce un desiderio</sub></td><td width="50%"><img src="docs/screens/it/pause.jpg" alt="Pausa: mappa, statistiche e impostazioni"><br><sub>Pausa: mappa, statistiche e impostazioni</sub></td></tr></table>

### Compagni
Raccolgono l'esperienza lontana, hanno un'abilità (`Q`) e liberano un'onda d'urto quando sei circondato.

| Compagno | Razza | Abilità | ricarica |
|---|---|---|---|
| **Dende** | Namecciano | **Guarigione** — Recuperi il 30% della salute. | 30 s |
| **Mini Shenron** | Drago | **Raccolta Magica** — Attira le gemme di esperienza entro 400 px e dà un bonus di XP pari al 5% del livello. | 40 s |
| **Mini Droide** | Androide | **Scudo Energetico** — Sei invulnerabile per 1,5 secondi. | 40 s |
| **Bubbles** | Animale della Terra | **Banana Fortunata** — Tre monete di zenny a terra e +2,5% fortuna per 50 secondi. | 36 s |
| **Mini Bu** | Majin | **Raggio Caramella** — Stordisce i nemici entro 210 px per 1 secondo (0,4 sui boss). | 28 s |
| **Saibaman** | Saiyan (pianta) | **Autodistruzione** — Esplode infliggendo danni ad area (raggio 160 px). | 22 s |

**Totem** (8 poteri, se ne sceglie uno):

| Totem | Effetto |
|---|---|
| **Totem della Fortuna** | +0,5% fortuna a ogni livello, per tutta la partita. |
| **Totem del Rischio** | Esperienza x2, ma subisci il 50% di danni in più per 3 minuti. |
| **Totem della Vitalità** | +15% salute massima, +0,4 salute/s e cura immediata del 30%. |
| **Totem della Furia** | +12% danno, ma ricarica +8% più lenta. |
| **Totem della Ricchezza** | +35% zenny e +25% raccolta per 150 secondi. |
| **Totem Guardiano** | Una barriera blocca un colpo, poi si ricarica ogni 25s. |
| **Totem della Tempesta** | Ogni 20s un fulmine colpisce fino a 4 nemici vicini. Ogni trasformazione: ricarica −20%. |
| **Totem dello Spirito** | Ogni 20s un impulso cura il 6% (fino al 12% con le trasformazioni) e stordisce i nemici vicini. Ogni trasformazione: ricarica −20%. |

---

## Personaggi, armi e trasformazioni

### 58 personaggi giocabili
Ognuno ha armi di partenza, statistiche, una **linea di trasformazioni** (fino a 8 forme, ai livelli 5, 10, 20, 30, 50, 70, 90 e 120, con aura dipinta) e un'**abilità unica** con una versione potenziata nella forma finale.

<p align="center"><img src="docs/screens/it/chars.jpg" alt="Selezione del personaggio" width="860"><br><sub>Selezione del personaggio</sub></p>

<details>
<summary><b>Tutti i 58 personaggi</b></summary>

| | Nome | Parte con | Abilità | Salute · Velocità · Danno |
|---|---|---|---|---|
| <img src="docs/portraits/goku.png" width="56" alt=""> | **Goku** | Kamehameha | <img src="assets/icons/abilities/goku.webp" width="28" height="28" alt=""> **Kaioken** — Kaioken x10 / x20: danno ×1,5 / ×2, ma perdi 8 / 16 salute al secondo, +1,5 per ogni trasformazione raggiunta. Premi di nuovo per cambiare o spegnere. | 100 · ×1.1 · ×1.1 |
| <img src="docs/portraits/vegeta.png" width="56" alt=""> | **Vegeta** | Cannone Garlick, Attacco Big Bang | <img src="assets/icons/abilities/vegeta.webp" width="28" height="28" alt=""> **Final Flash** — Raggio potente nella direzione del nemico più vicino: colpisce tutto in linea. | 95 · ×1 · ×1.2 |
| <img src="docs/portraits/piccolo.png" width="56" alt=""> | **Piccolo** | Granata Infernale | <img src="assets/icons/abilities/piccolo.webp" width="28" height="28" alt=""> **Cannone Speciale** — Carica per circa 1 secondo, poi spara un raggio a spirale sottilissimo che trafigge tutti i nemici in linea: danno altissimo e stordimento. | 125 · ×0.95 · ×1.1 |
| <img src="docs/portraits/krillin.png" width="56" alt=""> | **Crilin** | Disco Distruttore | <img src="assets/icons/abilities/krillin.webp" width="28" height="28" alt=""> **Taiyoken** — Acceca e stordisce i nemici vicini per 1,7 secondi. | 105 · ×1 · ×1.3 |
| <img src="docs/portraits/trunks.png" width="56" alt=""> | **Trunks** | Spada | <img src="assets/icons/abilities/trunks.webp" width="28" height="28" alt=""> **Fendente Furioso** — Esplosione di ki attorno a te: danni ad area e respinge i nemici. | 100 · ×1.05 · ×1.1 |
| <img src="docs/portraits/yamcha.png" width="56" alt=""> | **Yamcha** | Colpi Eccentrici | <img src="assets/icons/abilities/yamcha.webp" width="28" height="28" alt=""> **Pugno Zanna di Lupo** — Scatto in avanti, invulnerabile, che colpisce chi attraversi. | 95 · ×1.05 · ×1 |
| <img src="docs/portraits/tien.png" width="56" alt=""> | **Tenshinhan** | Taiyoken, Colpo di Ki | <img src="assets/icons/abilities/tien.webp" width="28" height="28" alt=""> **Raggio Dodon** — Raggio potente nella direzione del nemico più vicino: colpisce tutto in linea. | 100 · ×1 · ×0.97 |
| <img src="docs/portraits/gohan.png" width="56" alt=""> | **Gohan** | Colpo di Ki | <img src="assets/icons/abilities/gohan.webp" width="28" height="28" alt=""> **Masenko** — Raggio potente nella direzione del nemico più vicino: colpisce tutto in linea. | 100 · ×1 · ×1 |
| <img src="docs/portraits/muten.png" width="56" alt=""> | **Genio Tartaruga** | Kamehameha | <img src="assets/icons/abilities/muten.webp" width="28" height="28" alt=""> **Kamehameha del Maestro** — Raggio potente nella direzione del nemico più vicino: colpisce tutto in linea. | 90 · ×0.95 · ×1 |
| <img src="docs/portraits/goten.png" width="56" alt=""> | **Goten** | Colpi Eccentrici | <img src="assets/icons/abilities/goten.webp" width="28" height="28" alt=""> **Scatto Fulmineo** — Scatto in avanti, invulnerabile, che colpisce chi attraversi. | 95 · ×1.15 · ×1 |
| <img src="docs/portraits/c18.png" width="56" alt=""> | **C-18** | Colpo di Ki | <img src="assets/icons/abilities/c18.webp" width="28" height="28" alt=""> **Barriera Energetica** — Barriera: invulnerabile per 1,5 secondi. | 105 · ×1 · ×1 |
| <img src="docs/portraits/broly.png" width="56" alt=""> | **Broly** | Aura | <img src="assets/icons/abilities/broly.webp" width="28" height="28" alt=""> **Meteora Gigante** — Scaglia una meteora di ki verde sul nemico più vicino: avanza lentamente crescendo e poi esplode con danni enormi. | 140 · ×0.9 · ×1.25 |
| <img src="docs/portraits/freezer.png" width="56" alt=""> | **Freezer** | Raggio Perforante | <img src="assets/icons/abilities/freezer.webp" width="28" height="28" alt=""> **Supernova Mortale** — Esplosione di ki attorno a te: danni ad area e respinge i nemici. | 88 · ×1 · ×1.2 |
| <img src="docs/portraits/cell.png" width="56" alt=""> | **Cell** | Colpo di Ki | <img src="assets/icons/abilities/cell.webp" width="28" height="28" alt=""> **Assorbimento** — Assorbi energia dai nemici vicini: danni e cura fino al 12% della salute. | 105 · ×1 · ×1.05 |
| <img src="docs/portraits/bu.png" width="56" alt=""> | **Majin Bu** | Aura, Genkidama | <img src="assets/icons/abilities/bu.webp" width="28" height="28" alt=""> **Rigenerazione Elastica** — Rigenera il 15% della salute in 6 secondi. | 165 · ×0.85 · ×0.95 |
| <img src="docs/portraits/gotenks.png" width="56" alt=""> | **Gotenks** | Colpi Eccentrici, Colpo di Ki | <img src="assets/icons/abilities/gotenks.webp" width="28" height="28" alt=""> **Fantasmi Kamikaze** — Evoca 3 fantasmi che volano contro il nemico più vicino e copiano le tue armi attive: attaccano ogni 10 secondi (fino a ogni 4 secondi salendo di livello) e a fine durata esplodono. | 80 · ×1.15 · ×1.05 |
| <img src="docs/portraits/vegito.png" width="56" alt=""> | **Vegito** | Colpo di Ki, Kamehameha | <img src="assets/icons/abilities/vegito.webp" width="28" height="28" alt=""> **Lama Spirituale** — Raggio potente nella direzione del nemico più vicino: colpisce tutto in linea. | 95 · ×1.05 · ×1 |
| <img src="docs/portraits/satan.png" width="56" alt=""> | **Mr. Satan** | Calcio Dinamite | <img src="assets/icons/abilities/satan.webp" width="28" height="28" alt=""> **Colpo di Fortuna** — Monete, una piccola cura e un po' di fortuna per 30 secondi. | 90 · ×0.95 · ×0.95 |
| <img src="docs/portraits/raditz.png" width="56" alt=""> | **Raditz** | Doppio Sunday | <img src="assets/icons/abilities/raditz.webp" width="28" height="28" alt=""> **Doppio Sunday** — Raggio potente nella direzione del nemico più vicino: colpisce tutto in linea. | 100 · ×1 · ×1.1 |
| <img src="docs/portraits/nappa.png" width="56" alt=""> | **Nappa** | Cannone Distruttore | <img src="assets/icons/abilities/nappa.webp" width="28" height="28" alt=""> **Esplosione Saiyan** — Esplosione di ki attorno a te: danni ad area e respinge i nemici. | 130 · ×0.9 · ×1.15 |
| <img src="docs/portraits/ginyu.png" width="56" alt=""> | **Capitan Ginyu** | Boomerang Ginyu | <img src="assets/icons/abilities/ginyu.webp" width="28" height="28" alt=""> **Posa Ginyu** — Barriera: invulnerabile per 1,5 secondi. | 105 · ×1 · ×1.05 |
| <img src="docs/portraits/zarbon.png" width="56" alt=""> | **Zarbon** | Danza Elegante | <img src="assets/icons/abilities/zarbon.webp" width="28" height="28" alt=""> **Mostro Zarbon** — Potenziamento per 8 secondi: danno +25%, velocità +15%. | 95 · ×1.1 · ×1.05 |
| <img src="docs/portraits/bardock.png" width="56" alt=""> | **Bardock** | Lancia Ribelle | <img src="assets/icons/abilities/bardock.webp" width="28" height="28" alt=""> **Rivolta Saiyan** — Potenziamento per 8 secondi: danno +30%. | 100 · ×1.05 · ×1.15 |
| <img src="docs/portraits/c17.png" width="56" alt=""> | **C-17** | Disco Distruttore | <img src="assets/icons/abilities/c17.webp" width="28" height="28" alt=""> **Barriera Perfetta** — Barriera: invulnerabile per 1,5 secondi. | 105 · ×1.05 · ×1 |
| <img src="docs/portraits/c16.png" width="56" alt=""> | **C-16** | Granata Infernale | <img src="assets/icons/abilities/c16.webp" width="28" height="28" alt=""> **Cannone Oculare** — Raggio potente nella direzione del nemico più vicino: colpisce tutto in linea. | 150 · ×0.85 · ×1.15 |
| <img src="docs/portraits/cooler.png" width="56" alt=""> | **Cooler** | Raggio Perforante | <img src="assets/icons/abilities/cooler.webp" width="28" height="28" alt=""> **Supernova Cooler** — Esplosione di ki attorno a te: danni ad area e respinge i nemici. | 92 · ×1 · ×1.2 |
| <img src="docs/portraits/toppo.png" width="56" alt=""> | **Toppo** | Sfera della Distruzione | <img src="assets/icons/abilities/toppo.webp" width="28" height="28" alt=""> **Sfera della Giustizia** — Lancia una sfera oscura sul nemico più vicino: cresce, attira i nemici vicini e poi esplode con danni enormi. | 135 · ×0.95 · ×1.25 |
| <img src="docs/portraits/hit.png" width="56" alt=""> | **Hit** | Salto Temporale | <img src="assets/icons/abilities/hit.webp" width="28" height="28" alt=""> **Salto Temporale** — Ferma il tempo: i nemici sullo schermo restano bloccati per 1,8 secondi. | 90 · ×1.15 · ×1.1 |
| <img src="docs/portraits/kefla.png" width="56" alt=""> | **Kefla** | Meteora di Fusione | <img src="assets/icons/abilities/kefla.webp" width="28" height="28" alt=""> **Fusione Furiosa** — Potenziamento per 8 secondi: danno +30%, velocità +10%. | 100 · ×1.1 · ×1.15 |
| <img src="docs/portraits/beerus.png" width="56" alt=""> | **Beerus** | Aura, Sfera della Distruzione | <img src="assets/icons/abilities/beerus.webp" width="28" height="28" alt=""> **Hakai** — Cancella una parte della vita dei nemici vicini (poco sui boss). | 100 · ×1 · ×1.1 |
| <img src="docs/portraits/jiren.png" width="56" alt=""> | **Jiren** | Impatto Potente, Aura | <img src="assets/icons/abilities/jiren.webp" width="28" height="28" alt=""> **Pugno Inarrestabile** — Scatto in avanti, invulnerabile, che colpisce chi attraversi. | 125 · ×1 · ×1.3 |
| <img src="docs/portraits/whis.png" width="56" alt=""> | **Whis** | Fulmine Angelico | <img src="assets/icons/abilities/whis.webp" width="28" height="28" alt=""> **Riavvolgimento** — Riavvolge il tempo: recuperi la salute persa negli ultimi 6 secondi. | 85 · ×1.2 · ×1 |
| <img src="docs/portraits/gogeta.png" width="56" alt=""> | **Gogeta** | Big Bang Kamehameha, Colpo di Ki | <img src="assets/icons/abilities/gogeta.webp" width="28" height="28" alt=""> **Big Bang Kamehameha** — Raggio potente nella direzione del nemico più vicino: colpisce tutto in linea. | 100 · ×1.05 · ×1.2 |
| <img src="docs/portraits/dyspo.png" width="56" alt=""> | **Dyspo** | Calcio Dinamite | <img src="assets/icons/abilities/dyspo.webp" width="28" height="28" alt=""> **Velocità Suprema** — Scatto in avanti, invulnerabile, che colpisce chi attraversi. | 80 · ×1.28 · ×1 |
| <img src="docs/portraits/caulifla.png" width="56" alt=""> | **Caulifla** | Colpo di Ki | <img src="assets/icons/abilities/caulifla.webp" width="28" height="28" alt=""> **Onda Saiyan** — Esplosione di ki attorno a te: danni ad area e respinge i nemici. | 95 · ×1.1 · ×1.15 |
| <img src="docs/portraits/gero.png" width="56" alt=""> | **Dr. Gero** | Doppio Sunday | <img src="assets/icons/abilities/gero.webp" width="28" height="28" alt=""> **Energia Infinita** — Rigenera il 13% della salute in 6 secondi. | 100 · ×0.88 · ×1.1 |
| <img src="docs/portraits/c21.png" width="56" alt=""> | **C-21** | Colpo di Ki, Boomerang Ginyu | <img src="assets/icons/abilities/c21.webp" width="28" height="28" alt=""> **Appetito Insaziabile** — Assorbi energia dai nemici vicini: danni e cura fino al 12% della salute. | 105 · ×1.05 · ×1.05 |
| <img src="docs/portraits/kale.png" width="56" alt=""> | **Kale** | Big Bang Kamehameha | <img src="assets/icons/abilities/kale.webp" width="28" height="28" alt=""> **Furia Incontrollata** — Potenziamento per 8 secondi: danno +50% (subisci +30% di danni). | 125 · ×0.95 · ×1.25 |
| <img src="docs/portraits/zamasu.png" width="56" alt=""> | **Zamasu** | Spada, Fulmine Angelico | <img src="assets/icons/abilities/zamasu.webp" width="28" height="28" alt=""> **Lama di Giudizio** — Raggio potente nella direzione del nemico più vicino: colpisce tutto in linea. | 100 · ×1 · ×1.05 |
| <img src="docs/portraits/black.png" width="56" alt=""> | **Goku Black** | Spada, Colpo di Ki | <img src="assets/icons/abilities/black.webp" width="28" height="28" alt=""> **Lama di Ki** — Scatto in avanti, invulnerabile, che colpisce chi attraversi. | 95 · ×1.1 · ×1.2 |
| <img src="docs/portraits/fzamasu.png" width="56" alt=""> | **Zamasu Fuso** | Fulmine Angelico, Meteora di Fusione | <img src="assets/icons/abilities/fzamasu.webp" width="28" height="28" alt=""> **Giudizio Divino** — Cancella una parte della vita dei nemici vicini (poco sui boss). | 130 · ×1 · ×1.25 |
| <img src="docs/portraits/videl.png" width="56" alt=""> | **Videl** | Calcio Dinamite, Colpo di Ki | <img src="assets/icons/abilities/videl.webp" width="28" height="28" alt=""> **Calcio Volante** — Scatto in avanti, invulnerabile, che colpisce chi attraversi. | 95 · ×1.1 · ×1.05 |
| <img src="docs/portraits/bulma.png" width="56" alt=""> | **Bulma** | Colpo di Ki | <img src="assets/icons/abilities/bulma.webp" width="28" height="28" alt=""> **Invenzione Geniale** — Monete, una piccola cura e un po' di fortuna per 30 secondi. | 80 · ×1 · ×0.9 |
| <img src="docs/portraits/yajirobe.png" width="56" alt=""> | **Yajirobe** | Spada | <img src="assets/icons/abilities/yajirobe.webp" width="28" height="28" alt=""> **Scorta di Senzu** — Rigenera il 20% della salute in 6 secondi. | 130 · ×0.9 · ×1.15 |
| <img src="docs/portraits/saiyaman.png" width="56" alt=""> | **Great Saiyaman** | Colpo di Ki | <img src="assets/icons/abilities/saiyaman.webp" width="28" height="28" alt=""> **Posa Eroica** — +35% probabilità di critico per 8 secondi. | 100 · ×1.05 · ×1.15 |
| <img src="docs/portraits/chaozu.png" width="56" alt=""> | **Chiaotzu** | Raggio Perforante | <img src="assets/icons/abilities/chaozu.webp" width="28" height="28" alt=""> **Raggio Dodon** — Raggio potente nella direzione del nemico più vicino: colpisce tutto in linea. | 85 · ×1.08 · ×0.95 |
| <img src="docs/portraits/recoome.png" width="56" alt=""> | **Recoome** | Cannone Distruttore | <img src="assets/icons/abilities/recoome.webp" width="28" height="28" alt=""> **Calcio Recoome** — Scatto in avanti, invulnerabile, che colpisce chi attraversi. | 125 · ×0.9 · ×1.3 |
| <img src="docs/portraits/guldo.png" width="56" alt=""> | **Guldo** | Salto Temporale | <img src="assets/icons/abilities/guldo.webp" width="28" height="28" alt=""> **Fermatempo** — Ferma il tempo: i nemici sullo schermo restano bloccati per 1,8 secondi. | 80 · ×0.95 · ×0.95 |
| <img src="docs/portraits/turles.png" width="56" alt=""> | **Turles** | Meteora di Fusione, Colpo di Ki | <img src="assets/icons/abilities/turles.webp" width="28" height="28" alt=""> **Frutto dell'Albero** — Assorbi energia dai nemici vicini: danni e cura fino al 12% della salute. | 100 · ×1.05 · ×1.2 |
| <img src="docs/portraits/nail.png" width="56" alt=""> | **Nail** | Lancia Ribelle | <img src="assets/icons/abilities/nail.webp" width="28" height="28" alt=""> **Spirito Guerriero** — Potenziamento per 8 secondi: danno +40% (subisci +20% di danni). | 110 · ×1.05 · ×1.15 |
| <img src="docs/portraits/kingkai.png" width="56" alt=""> | **Re Kaioh** | Aura | <img src="assets/icons/abilities/kingkai.webp" width="28" height="28" alt=""> **Allenamento di Re Kaioh** — Potenziamento per 8 secondi: danno +30%, velocità +12%. | 115 · ×0.9 · ×1 |
| <img src="docs/portraits/pan.png" width="56" alt=""> | **Pan** | Colpi Eccentrici, Danza Elegante | <img src="assets/icons/abilities/pan.webp" width="28" height="28" alt=""> **Sangue Saiyan** — Potenziamento per 8 secondi: danno +20%, velocità +20%. | 85 · ×1.15 · ×0.95 |
| <img src="docs/portraits/dabura.png" width="56" alt=""> | **Dabura** | Spada, Granata Infernale | <img src="assets/icons/abilities/dabura.webp" width="28" height="28" alt=""> **Onda Demoniaca** — Esplosione di ki attorno a te: danni ad area e respinge i nemici. | 115 · ×0.95 · ×1.2 |
| <img src="docs/portraits/popo.png" width="56" alt=""> | **Mr. Popo** | Fulmine Angelico | <img src="assets/icons/abilities/popo.webp" width="28" height="28" alt=""> **Scudo del Genio** — Barriera: invulnerabile per 1,5 secondi. | 120 · ×0.9 · ×1 |
| <img src="docs/portraits/uub.png" width="56" alt=""> | **Uub** | Kamehameha, Colpi Eccentrici | <img src="assets/icons/abilities/uub.webp" width="28" height="28" alt=""> **Raggio Puro** — Raggio potente nella direzione del nemico più vicino: colpisce tutto in linea. | 100 · ×1.1 · ×1.2 |
| <img src="docs/portraits/frost.png" width="56" alt=""> | **Frost** | Raggio Perforante, Fulmine Angelico | <img src="assets/icons/abilities/frost.webp" width="28" height="28" alt=""> **Raggio Mortale** — Esplosione di ki attorno a te: danni ad area e respinge i nemici. | 105 · ×1.05 · ×1.15 |
| <img src="docs/portraits/kpiccolo.png" width="56" alt=""> | **Re Piccolo** | Sfera della Distruzione | <img src="assets/icons/abilities/kpiccolo.webp" width="28" height="28" alt=""> **Rigenerazione Demoniaca** — Rigenera il 18% della salute in 6 secondi. | 140 · ×0.85 · ×1.3 |
| <img src="docs/portraits/zeno.png" width="56" alt=""> | **Zeno-sama** | Sfera della Distruzione, Genkidama | <img src="assets/icons/abilities/zeno.webp" width="28" height="28" alt=""> **Cancellazione** — Cancella una parte della vita dei nemici vicini (poco sui boss). | 360 · ×1.4 · ×1.65 |

</details>

Ne hai **4 subito** (Goku, Vegeta, Piccolo, Crilin); gli altri si sbloccano con una condizione (vincere stage, raggiungere un livello, sconfiggere tot nemici o boss) **oppure comprandoli** con zenny. La schermata **Achievement** dice cosa fare per ogni sblocco.

**Fusioni di personaggi**: Vegito e Gogeta (Potara / Metamoran), Gotenks, Kefla e Zamasu Fuso si giocano per una partita con entrambi i genitori a **Maestria 5**.

<table><tr><td width="50%"><img src="docs/screens/it/ability.jpg" alt="Abilità del personaggio: Kaioken"><br><sub>Abilità del personaggio: Kaioken</sub></td><td width="50%"><img src="docs/screens/it/chest.jpg" alt="Forziere Leggendario"><br><sub>Forziere Leggendario</sub></td></tr></table>

### Abilità
Kaioken (x10/x20), Berserk, Final Flash, Cannone Speciale, Taiyoken, Fendente Furioso, Raggio Dodon, Pugno Zanna di Lupo, cloni, Sfera della Giustizia, Super Ghost Kamikaze, barriere, assorbimento, ferma tempo, cancellazione, riavvolgimento, jackpot e altre. Quando usi un'abilità l'icona sale sopra l'eroe; se dura nel tempo vedi un anello che si svuota. Ogni abilità ha **icone dedicate** su pulsanti, schede e tooltip.

### 24 armi
<details>
<summary><b>Le 24 armi e le loro evoluzioni</b></summary>

| | Arma | Evoluzione | Seconda evoluzione |
|---|---|---|---|
| <img src="assets/icons/weapons/ki.webp" width="40" height="40" alt=""> | **Colpo di Ki**<br>Spara al nemico più vicino. | **Supernova di Ki**<br>Sei colpi perforanti. | **Ki Cataclisma**<br>Otto colpi perforanti e velocissimi. |
| <img src="assets/icons/weapons/kame.webp" width="40" height="40" alt=""> | **Kamehameha**<br>Onda di energia a lunga gittata. | **Kamehameha Divino**<br>Un raggio gigantesco e carico di scariche. | **Kamehameha Ultra**<br>Raggio ancora più largo, con scarica anche dietro. |
| <img src="assets/icons/weapons/disc.webp" width="40" height="40" alt=""> | **Disco Distruttore**<br>Dischi che orbitano attorno a te. | **Kienzan Supremo**<br>Sei dischi enormi. | **Kienzan Cataclisma**<br>Otto dischi giganti. |
| <img src="assets/icons/weapons/spirit.webp" width="40" height="40" alt=""> | **Genkidama**<br>Una sfera enorme cade sui nemici. | **Genkidama Suprema**<br>Tre sfere devastanti. | **Genkidama Divina**<br>Cinque sfere elettriche. |
| <img src="assets/icons/weapons/aura.webp" width="40" height="40" alt=""> | **Aura**<br>Un'aura brucia chi si avvicina. | **Aura Divina**<br>Aura enorme che rallenta i nemici. | **Aura del Dio**<br>Aura immensa che brucia tutto. |
| <img src="assets/icons/weapons/flare.webp" width="40" height="40" alt=""> | **Taiyoken**<br>Acceca i nemici vicini. | **Taiyoken Supremo**<br>Accecamento lungo e molto danno. | **Taiyoken Assoluto**<br>Accecamento totale e danno enorme. |
| <img src="assets/icons/weapons/slash.webp" width="40" height="40" alt=""> | **Spada**<br>Fendente in arco contro i vicini. | **Lama Suprema**<br>Fendente a 360 gradi. | **Lama del Dio**<br>Fendente a 360 gradi, ancora più rapido. |
| <img src="assets/icons/weapons/homing.webp" width="40" height="40" alt=""> | **Colpi Eccentrici**<br>Sfere che inseguono i nemici. | **Sfere Divine**<br>Sei sfere veloci e potenti. | **Sfere del Destino**<br>Otto sfere inseguitrici. |
| <img src="assets/icons/weapons/dbeam.webp" width="40" height="40" alt=""> | **Raggio Perforante**<br>Trafigge il nemico più resistente. | **Raggio Mortale**<br>Tre raggi mortali. | **Raggio dell'Imperatore**<br>Cinque raggi mortali. |
| <img src="assets/icons/weapons/javelin.webp" width="40" height="40" alt=""> | **Lancia Ribelle**<br>Lance di ki perforanti. | **Lancia dell'Ultimo Saiyan**<br>Più lance, perforano di più. | **Lancia della Rivolta**<br>Una lancia in più, più danno. |
| <img src="assets/icons/weapons/dsunday.webp" width="40" height="40" alt=""> | **Doppio Sunday**<br>Colpi esplosivi su più bersagli. | **Doppio Sunday Supremo**<br>Più colpi, esplosioni più grandi. | **Sunday Cataclisma**<br>Un colpo in più, area maggiore. |
| <img src="assets/icons/weapons/breaker.webp" width="40" height="40" alt=""> | **Cannone Distruttore**<br>Proiettile che esplode a contatto. | **Cannone Distruttore Max**<br>Esplosioni molto più ampie. | **Cannone Apocalisse**<br>Doppia granata, area enorme. |
| <img src="assets/icons/weapons/spiral.webp" width="40" height="40" alt=""> | **Danza Elegante**<br>Spirale di colpi attorno a te. | **Danza Elegante Suprema**<br>Più bracci, perforano. | **Danza del Principe**<br>Un braccio in più, più veloce. |
| <img src="assets/icons/weapons/boomer.webp" width="40" height="40" alt=""> | **Boomerang Ginyu**<br>Va e torna colpendo due volte. | **Boomerang Speciale**<br>Più boomerang, gittata lunga. | **Forza Ginyu**<br>Un boomerang in più, area maggiore. |
| <img src="assets/icons/weapons/hellzone.webp" width="40" height="40" alt=""> | **Granata Infernale**<br>Decine di sfere di ki circondano un nemico e colpiscono tutte insieme: attacco lentissimo, esplosione devastante. | **Granata Infernale Suprema**<br>Circonda 2 nemici alla volta, più sfere e più danno. | **Granata Infernale Divina**<br>Circonda 3 nemici, sfere ancora più numerose ed esplosione più ampia. |
| <img src="assets/icons/weapons/chrono.webp" width="40" height="40" alt=""> | **Salto Temporale**<br>Ferma i nemici e li colpisce. | **Salto Temporale Perfetto**<br>Più colpi, stop più lungo. | **Tempo Spezzato**<br>Due colpi in più, area maggiore. |
| <img src="assets/icons/weapons/shock.webp" width="40" height="40" alt=""> | **Impatto Potente**<br>Onda d'urto che respinge. | **Impatto Supremo**<br>Raggio maggiore, doppia onda. | **Impatto Assoluto**<br>Onde più ampie e forti. |
| <img src="assets/icons/weapons/hakai.webp" width="40" height="40" alt=""> | **Sfera della Distruzione**<br>Sfera che segue e brucia i nemici. | **Hakai Supremo**<br>Attira i nemici verso di sé. | **Hakai Divino**<br>Una sfera in più, più grande. |
| <img src="assets/icons/weapons/chain.webp" width="40" height="40" alt=""> | **Fulmine Angelico**<br>Fulmine che salta tra i nemici. | **Fulmine del Cielo**<br>Più salti, più danno. | **Tempesta Angelica**<br>Due salti in più, raggio maggiore. |
| <img src="assets/icons/weapons/meteor.webp" width="40" height="40" alt=""> | **Meteora di Fusione**<br>Piovono meteore sui nemici. | **Pioggia di Meteore**<br>Più meteore, esplosioni maggiori. | **Cataclisma Cometa**<br>Una meteora in più, area maggiore. |
| <img src="assets/icons/weapons/sweep.webp" width="40" height="40" alt=""> | **Big Bang Kamehameha**<br>Un raggio ruota tutto intorno a te. | **Big Bang Doppio**<br>Due raggi opposti. | **Big Bang Trinità**<br>Tre raggi che ruotano. |
| <img src="assets/icons/weapons/galick.webp" width="40" height="40" alt=""> | **Cannone Garlick**<br>Carica e spara un'onda viola larga dove i nemici sono più fitti: li respinge. | **Cannone Garlick Supremo**<br>Onda più larga e più lunga, spinta più forte. | **Cannone Garlick Finale**<br>L'onda esplode in fondo alla sua corsa. |
| <img src="assets/icons/weapons/bigbang.webp" width="40" height="40" alt=""> | **Attacco Big Bang**<br>Carica una sfera di ki e la scaglia: esplode al contatto. | **Big Bang Finale**<br>Due sfere, esplosioni più ampie. | **Big Bang Galattico**<br>Una sfera in più, esplosioni enormi. |
| <img src="assets/icons/weapons/dyn.webp" width="40" height="40" alt=""> | **Calcio Dinamite**<br>Esplosione ravvicinata che spinge via. | **Calcio Dinamite Super**<br>Doppia esplosione. | **Calcio Campione**<br>Esplosioni più ampie e potenti. |

</details>

<details>
<summary><b>Le 12 evoluzioni doppie</b></summary>

| | Evoluzione | Fusione di |
|---|---|---|
| <img src="assets/icons/abilities/ki_homing.webp" width="40" height="40" alt=""> | **Tempesta di Ki** | Colpo di Ki + Colpi Eccentrici |
| <img src="assets/icons/abilities/kame_breaker.webp" width="40" height="40" alt=""> | **Kamehameha Finale** | Kamehameha + Cannone Distruttore |
| <img src="assets/icons/abilities/disc_slash.webp" width="40" height="40" alt=""> | **Lama Kienzan** | Disco Distruttore + Spada |
| <img src="assets/icons/abilities/spirit_meteor.webp" width="40" height="40" alt=""> | **Genkidama Universale** | Genkidama + Meteora di Fusione |
| <img src="assets/icons/abilities/aura_shock.webp" width="40" height="40" alt=""> | **Aura Esplosiva** | Aura + Impatto Potente |
| <img src="assets/icons/abilities/hakai_chain.webp" width="40" height="40" alt=""> | **Giudizio Divino** | Sfera della Distruzione + Fulmine Angelico |
| <img src="assets/icons/abilities/hellzone_javelin.webp" width="40" height="40" alt=""> | **Lance Infernali** | Granata Infernale + Lancia Ribelle |
| <img src="assets/icons/abilities/sweep_dyn.webp" width="40" height="40" alt=""> | **Calcio Big Bang** | Big Bang Kamehameha + Calcio Dinamite |
| <img src="assets/icons/abilities/flare_chrono.webp" width="40" height="40" alt=""> | **Lampo del Tempo** | Taiyoken + Salto Temporale |
| <img src="assets/icons/abilities/dsunday_boomer.webp" width="40" height="40" alt=""> | **Domenica Ginyu** | Doppio Sunday + Boomerang Ginyu |
| <img src="assets/icons/abilities/spiral_dbeam.webp" width="40" height="40" alt=""> | **Danza dell'Imperatore** | Danza Elegante + Raggio Perforante |
| <img src="assets/icons/abilities/bigbang_galick.webp" width="40" height="40" alt=""> | **Esplosione Finale** | Attacco Big Bang + Cannone Garlick |

</details>

- Ogni arma sale fino al **Lv 5**, si **evolve** (forziere o condizione del Grimorio) e ha altri 5 livelli.
- Le armi si sbloccano nella pool vincendo uno stage con un personaggio che parte con quell'arma. Con la **Lista Nera Armi** del Negozio puoi bandirne.
- Gli effetti sono **animazioni dipinte** (anche per le evoluzioni) con suoni 8-bit.

### 11 potenziamenti passivi
<details>
<summary><b>I 11 potenziamenti passivi</b></summary>

| Nome | Effetto |
|---|---|
| **Zenkai** | +10% danno. |
| **Vigore** | +20 salute massima. |
| **Volo veloce** | +6% velocità. |
| **Scouter** | +10% raggio di raccolta; serve anche per evolvere alcune armi. |
| **Camera Gravitazionale** | -5% ricarica. |
| **Armatura da Battaglia** | Armatura +1: riduce ogni colpo subito. |
| **Fagioli Senzu** | +0,5 salute/s. |
| **Meditazione** | +8% esperienza. |
| **Quantità** | +1 quantità: ogni arma lancia un proiettile in più (i raggi si caricano il 15% più a lungo). |
| **Fortuna** | +2% fortuna: ricompense, loot e carte migliori. |
| **Area** | +6% area: la portata di tutte le armi è più grande. |

</details>

Alcuni servono anche per le evoluzioni.

### Fagioli Senzu e Scatto
La **borsa Senzu** (fino a 3) cura il 50% della Salute e alza una statistica per la partita. Lo **Scatto** fa danno sul percorso e dà invulnerabilità; ha una ricarica di pochi secondi.

---

## Cimeli e Gacha

**173 cimeli** in 5 rarità (Comune, Raro, Epico, Leggendario, Mitico), ognuno con statistiche e un effetto speciale. Ogni esemplare ha una **Perfezione da 0 a 100** (a 100 l'aura è quella dell'Ultra Istinto) e può avere statistiche extra.

- **Gacha**: ticket da 1 o da 10 estrazioni con animazione (apertura automatica, velocità regolabile), Super Sfere.
- **Borsa**: raccoglie i tuoi cimeli, con ordinamento, filtri per rarità e statistica (anche per quelle che contano), vendita e slot extra del Negozio.
- **Reroll**: rilancia la Perfezione (200 zenny a tiro, −2% ogni 10 tiri fino a −50%), con blocco delle statistiche e **auto reroll** fino a un obiettivo.
- **Fusione**: tre cimeli dello stesso tipo danno quello di rarità più alta con la migliore perfezione di ogni statistica; tre della stessa rarità la fanno salire di un grado.
- **In partita**: i cimeli si trovano nei forzieri; dopo il boss finale ne scegli 2 da portare nella Borsa. La **Macchina dello Scambio** li rigenera.


<table><tr><td width="50%"><img src="docs/screens/it/bag.jpg" alt="Borsa dei cimeli"><br><sub>Borsa dei cimeli</sub></td><td width="50%"><img src="docs/screens/it/reroll.jpg" alt="Reroll dei cimeli"><br><sub>Reroll dei cimeli</sub></td></tr></table>

<details>
<summary><b>Tutti i 173 cimeli</b></summary>

<details>
<summary><b>Comune (7)</b></summary>

| | Nome | Effetto |
|---|---|---|
| <img src="assets/icons/trinkets/scouter.webp" width="36" height="36" alt=""> | **Scouter Rotto** | +5% probabilità di critico. |
| <img src="assets/icons/trinkets/senzubag.webp" width="36" height="36" alt=""> | **Sacchetto di Senzu** | +0,6 salute al secondo. |
| <img src="assets/icons/trinkets/bandana.webp" width="36" height="36" alt=""> | **Bandana d'Allenamento** | +8% esperienza. |
| <img src="assets/icons/trinkets/boots.webp" width="36" height="36" alt=""> | **Stivali Gravitazionali** | +8% velocità, +3% danno. |
| <img src="assets/icons/trinkets/radar.webp" width="36" height="36" alt=""> | **Radar del Drago** | +49% raccolta, +25% loot extra. |
| <img src="assets/icons/trinkets/shell.webp" width="36" height="36" alt=""> | **Guscio di Muten Roshi** | +0,7 armatura, +0,3 salute al secondo. |
| <img src="assets/icons/trinkets/gi.webp" width="36" height="36" alt=""> | **Gi da Allenamento Pesante** | +8% salute. |

</details>

<details>
<summary><b>Raro (9)</b></summary>

| | Nome | Effetto |
|---|---|---|
| <img src="assets/icons/trinkets/windboots.webp" width="36" height="36" alt=""> | **Stivali del Vento** | Scatto più rapido: -35% ricarica e +30% danno. |
| <img src="assets/icons/trinkets/potara.webp" width="36" height="36" alt=""> | **Orecchino Potara** | +7% danno, +12% salute. |
| <img src="assets/icons/trinkets/cape.webp" width="36" height="36" alt=""> | **Mantello Namecciano** | +12% schivata. |
| <img src="assets/icons/trinkets/nyoibo.webp" width="36" height="36" alt=""> | **Nyoibo** | +12% area, +4% danno. |
| <img src="assets/icons/trinkets/cloud.webp" width="36" height="36" alt=""> | **Nuvola Speedy** | +15% velocità, -8% ricarica. |
| <img src="assets/icons/trinkets/hoipoi.webp" width="36" height="36" alt=""> | **Capsula Hoi-Poi** | 1,2% di loot extra dai nemici. |
| <img src="assets/icons/trinkets/weights.webp" width="36" height="36" alt=""> | **Pesi da Allenamento** | +6% danno, +8% salute. |
| <img src="assets/icons/trinkets/capsulecard.webp" width="36" height="36" alt=""> | **Tessera Capsule Corp.** | +10% esperienza, +30% loot extra. |
| <img src="assets/icons/trinkets/medal.webp" width="36" height="36" alt=""> | **Medaglia del Torneo** | +15% zenny, +25% raccolta. |

</details>

<details>
<summary><b>Epico (7)</b></summary>

| | Nome | Effetto |
|---|---|---|
| <img src="assets/icons/trinkets/kaioh.webp" width="36" height="36" alt=""> | **Cuore di Kaioh** | Ogni uccisione cura 0,4 salute. |
| <img src="assets/icons/trinkets/halo.webp" width="36" height="36" alt=""> | **Aureola dell'Angelo** | Rinasci una volta con il 50% di salute. |
| <img src="assets/icons/trinkets/timeroom.webp" width="36" height="36" alt=""> | **Orologio dello Spirito** | -10% ricarica, +4% danno. |
| <img src="assets/icons/trinkets/dball4.webp" width="36" height="36" alt=""> | **Sfera a 4 Stelle** | Ogni 4s un'onda d'urto colpisce i vicini. |
| <img src="assets/icons/trinkets/crystal.webp" width="36" height="36" alt=""> | **Cristallo Divino** | +6% probabilità di critico. I critici esplodono per il 40% del danno. |
| <img src="assets/icons/trinkets/mask.webp" width="36" height="36" alt=""> | **Maschera di Jackie Chun** | +6% probabilità di critico, +10% schivata. |
| <img src="assets/icons/trinkets/scroll.webp" width="36" height="36" alt=""> | **Pergamena della Tartaruga** | +14% area, +4% probabilità di critico. |

</details>

<details>
<summary><b>Leggendario (150)</b></summary>

| | Nome | Effetto |
|---|---|---|
| <img src="assets/icons/trinkets/armor.webp" width="36" height="36" alt=""> | **Armatura Saiyan Reale** | +3 armatura, +30% salute. |
| <img src="assets/icons/trinkets/timering.webp" width="36" height="36" alt=""> | **Anello del Tempo** | Ogni 10s i nemici rallentano per 4s. |
| <img src="assets/icons/trinkets/dragonheart.webp" width="36" height="36" alt=""> | **Cuore del Drago** | +12% danno, +8% esperienza, +25% zenny. |
| <img src="assets/icons/trinkets/mirror.webp" width="36" height="36" alt=""> | **Specchio dei Kaioh** | Una barriera blocca un colpo ogni 7,5s. |
| <img src="assets/icons/trinkets/berserk.webp" width="36" height="36" alt=""> | **Furia Saiyan** | +4% danno. +20% danno sotto il 35% di salute. |
| <img src="assets/icons/trinkets/belt.webp" width="36" height="36" alt=""> | **Cintura del Campione** | +8% danno, +2 armatura. |
| <img src="assets/icons/trinkets/cx_might_spd.webp" width="36" height="36" alt=""> | **Anello del Guerriero** | +11% danno, +15% velocità. |
| <img src="assets/icons/trinkets/cx_might_xp.webp" width="36" height="36" alt=""> | **Stivali del Saggio** | +8% danno, +21% esperienza. |
| <img src="assets/icons/trinkets/cx_might_gold.webp" width="36" height="36" alt=""> | **Distintivo della Furia** | +11% danno, +30% zenny. |
| <img src="assets/icons/trinkets/cx_might_crit.webp" width="36" height="36" alt=""> | **Cristallo del Cecchino** | +8% danno, +10% probabilità di critico. |
| <img src="assets/icons/trinkets/cx_might_dodge.webp" width="36" height="36" alt=""> | **Pendente del Pugno Ferreo** | +11% danno, +13% schivata. |
| <img src="assets/icons/trinkets/cx_might_area.webp" width="36" height="36" alt=""> | **Tunica dell'Onda** | +8% danno, +21% area. |
| <img src="assets/icons/trinkets/cx_might_magnet.webp" width="36" height="36" alt=""> | **Collana del Gigante** | +11% danno, +70% raccolta. |
| <img src="assets/icons/trinkets/cx_might_hpPct.webp" width="36" height="36" alt=""> | **Bracciale della Vita** | +8% danno, +32% salute. |
| <img src="assets/icons/trinkets/cx_might_lootRate.webp" width="36" height="36" alt=""> | **Cristallo del Campione** | +11% danno, +50% loot extra. |
| <img src="assets/icons/trinkets/cx_might_armor.webp" width="36" height="36" alt=""> | **Orecchino del Guardiano** | +8% danno, +2,8 armatura. |
| <img src="assets/icons/trinkets/cx_might_regen.webp" width="36" height="36" alt=""> | **Sandali dell'Orgoglio Saiyan** | +11% danno, +0,8 salute al secondo. |
| <img src="assets/icons/trinkets/cx_might_cd.webp" width="36" height="36" alt=""> | **Spilla del Tempo** | +8% danno, -14% ricarica. |
| <img src="assets/icons/trinkets/cx_spd_xp.webp" width="36" height="36" alt=""> | **Diadema del Vento** | +21% velocità, +15% esperienza. |
| <img src="assets/icons/trinkets/cx_spd_gold.webp" width="36" height="36" alt=""> | **Sandali del Mercante** | +15% velocità, +42% zenny. |
| <img src="assets/icons/trinkets/cx_spd_crit.webp" width="36" height="36" alt=""> | **Amuleto del Lampo** | +21% velocità, +7% probabilità di critico. |
| <img src="assets/icons/trinkets/cx_spd_dodge.webp" width="36" height="36" alt=""> | **Medaglione dell'Ombra** | +15% velocità, +18% schivata. |
| <img src="assets/icons/trinkets/cx_spd_area.webp" width="36" height="36" alt=""> | **Bandana della Corsa** | +21% velocità, +15% area. |
| <img src="assets/icons/trinkets/cx_spd_magnet.webp" width="36" height="36" alt=""> | **Capsula della Calamita** | +15% velocità, +98% raccolta. |
| <img src="assets/icons/trinkets/cx_spd_hpPct.webp" width="36" height="36" alt=""> | **Tunica della Nuvola** | +21% velocità, +23% salute. |
| <img src="assets/icons/trinkets/cx_spd_lootRate.webp" width="36" height="36" alt=""> | **Scudo del Predatore** | +15% velocità, +70% loot extra. |
| <img src="assets/icons/trinkets/cx_spd_armor.webp" width="36" height="36" alt=""> | **Medaglione del Falco** | +21% velocità, +2 armatura. |
| <img src="assets/icons/trinkets/cx_spd_regen.webp" width="36" height="36" alt=""> | **Fiala della Rinascita** | +15% velocità, +1,1 salute al secondo. |
| <img src="assets/icons/trinkets/cx_spd_cd.webp" width="36" height="36" alt=""> | **Emblema del Tuono** | +21% velocità, -10% ricarica. |
| <img src="assets/icons/trinkets/cx_xp_gold.webp" width="36" height="36" alt=""> | **Elmo della Fortuna** | +15% esperienza, +42% zenny. |
| <img src="assets/icons/trinkets/cx_xp_crit.webp" width="36" height="36" alt=""> | **Bandana dello Studio** | +21% esperienza, +7% probabilità di critico. |
| <img src="assets/icons/trinkets/cx_xp_dodge.webp" width="36" height="36" alt=""> | **Bastone della Nebbia** | +15% esperienza, +18% schivata. |
| <img src="assets/icons/trinkets/cx_xp_area.webp" width="36" height="36" alt=""> | **Tunica della Meditazione** | +21% esperienza, +15% area. |
| <img src="assets/icons/trinkets/cx_xp_magnet.webp" width="36" height="36" alt=""> | **Corona del Raccoglitore** | +15% esperienza, +98% raccolta. |
| <img src="assets/icons/trinkets/cx_xp_hpPct.webp" width="36" height="36" alt=""> | **Medaglione del Maestro** | +21% esperienza, +23% salute. |
| <img src="assets/icons/trinkets/cx_xp_lootRate.webp" width="36" height="36" alt=""> | **Anello del Bottino** | +15% esperienza, +70% loot extra. |
| <img src="assets/icons/trinkets/cx_xp_armor.webp" width="36" height="36" alt=""> | **Emblema dell'Allenamento** | +21% esperienza, +2 armatura. |
| <img src="assets/icons/trinkets/cx_xp_regen.webp" width="36" height="36" alt=""> | **Pergamena del Senzu** | +15% esperienza, +1,1 salute al secondo. |
| <img src="assets/icons/trinkets/cx_xp_cd.webp" width="36" height="36" alt=""> | **Corona della Sapienza** | +21% esperienza, -10% ricarica. |
| <img src="assets/icons/trinkets/cx_gold_crit.webp" width="36" height="36" alt=""> | **Gemma dell'Occhio Acuto** | +30% zenny, +10% probabilità di critico. |
| <img src="assets/icons/trinkets/cx_gold_dodge.webp" width="36" height="36" alt=""> | **Sandali del Tesoro** | +42% zenny, +13% schivata. |
| <img src="assets/icons/trinkets/cx_gold_area.webp" width="36" height="36" alt=""> | **Corno della Tempesta** | +30% zenny, +21% area. |
| <img src="assets/icons/trinkets/cx_gold_magnet.webp" width="36" height="36" alt=""> | **Guanti dello Zenny** | +42% zenny, +70% raccolta. |
| <img src="assets/icons/trinkets/cx_gold_hpPct.webp" width="36" height="36" alt=""> | **Fascia del Vigore** | +30% zenny, +32% salute. |
| <img src="assets/icons/trinkets/cx_gold_lootRate.webp" width="36" height="36" alt=""> | **Bastone del Banchiere** | +42% zenny, +50% loot extra. |
| <img src="assets/icons/trinkets/cx_gold_armor.webp" width="36" height="36" alt=""> | **Distintivo della Roccia** | +30% zenny, +2,8 armatura. |
| <img src="assets/icons/trinkets/cx_gold_regen.webp" width="36" height="36" alt=""> | **Corno della Capsule Corp.** | +42% zenny, +0,8 salute al secondo. |
| <img src="assets/icons/trinkets/cx_gold_cd.webp" width="36" height="36" alt=""> | **Diadema dello Spirito** | +30% zenny, -14% ricarica. |
| <img src="assets/icons/trinkets/cx_crit_dodge.webp" width="36" height="36" alt=""> | **Fiala della Precisione** | +10% probabilità di critico, +13% schivata. |
| <img src="assets/icons/trinkets/cx_crit_area.webp" width="36" height="36" alt=""> | **Amuleto dell'Esplosione** | +7% probabilità di critico, +21% area. |
| <img src="assets/icons/trinkets/cx_crit_magnet.webp" width="36" height="36" alt=""> | **Elmo del Cacciatore** | +10% probabilità di critico, +70% raccolta. |
| <img src="assets/icons/trinkets/cx_crit_hpPct.webp" width="36" height="36" alt=""> | **Talismano della Tartaruga** | +7% probabilità di critico, +32% salute. |
| <img src="assets/icons/trinkets/cx_crit_lootRate.webp" width="36" height="36" alt=""> | **Gemma dell'Assassino** | +10% probabilità di critico, +50% loot extra. |
| <img src="assets/icons/trinkets/cx_crit_armor.webp" width="36" height="36" alt=""> | **Sigillo dell'Acciaio** | +7% probabilità di critico, +2,8 armatura. |
| <img src="assets/icons/trinkets/cx_crit_regen.webp" width="36" height="36" alt=""> | **Orologio del Colpo Mortale** | +10% probabilità di critico, +0,8 salute al secondo. |
| <img src="assets/icons/trinkets/cx_crit_cd.webp" width="36" height="36" alt=""> | **Spallina dell'Orologio** | +7% probabilità di critico, -14% ricarica. |
| <img src="assets/icons/trinkets/cx_dodge_area.webp" width="36" height="36" alt=""> | **Cintura del Fantasma** | +18% schivata, +15% area. |
| <img src="assets/icons/trinkets/cx_dodge_magnet.webp" width="36" height="36" alt=""> | **Collana del Radar** | +13% schivata, +98% raccolta. |
| <img src="assets/icons/trinkets/cx_dodge_hpPct.webp" width="36" height="36" alt=""> | **Pergamena della Danza** | +18% schivata, +23% salute. |
| <img src="assets/icons/trinkets/cx_dodge_lootRate.webp" width="36" height="36" alt=""> | **Bandana del Saccheggio** | +13% schivata, +70% loot extra. |
| <img src="assets/icons/trinkets/cx_dodge_armor.webp" width="36" height="36" alt=""> | **Diadema del Ninja** | +18% schivata, +2 armatura. |
| <img src="assets/icons/trinkets/cx_dodge_regen.webp" width="36" height="36" alt=""> | **Maschera del Fiore** | +13% schivata, +1,1 salute al secondo. |
| <img src="assets/icons/trinkets/cx_dodge_cd.webp" width="36" height="36" alt=""> | **Amuleto dell'Illusione** | +18% schivata, -10% ricarica. |
| <img src="assets/icons/trinkets/cx_area_magnet.webp" width="36" height="36" alt=""> | **Bracciale dell'Attrazione** | +15% area, +98% raccolta. |
| <img src="assets/icons/trinkets/cx_area_hpPct.webp" width="36" height="36" alt=""> | **Fascia del Vortice** | +21% area, +23% salute. |
| <img src="assets/icons/trinkets/cx_area_lootRate.webp" width="36" height="36" alt=""> | **Orecchino del Corsaro** | +15% area, +70% loot extra. |
| <img src="assets/icons/trinkets/cx_area_armor.webp" width="36" height="36" alt=""> | **Sfera del Cataclisma** | +21% area, +2 armatura. |
| <img src="assets/icons/trinkets/cx_area_regen.webp" width="36" height="36" alt=""> | **Spilla della Guarigione** | +15% area, +1,1 salute al secondo. |
| <img src="assets/icons/trinkets/cx_area_cd.webp" width="36" height="36" alt=""> | **Spallina della Cupola** | +21% area, -10% ricarica. |
| <img src="assets/icons/trinkets/cx_magnet_hpPct.webp" width="36" height="36" alt=""> | **Sandali dell'Eroe** | +70% raccolta, +32% salute. |
| <img src="assets/icons/trinkets/cx_magnet_lootRate.webp" width="36" height="36" alt=""> | **Amuleto del Richiamo** | +98% raccolta, +50% loot extra. |
| <img src="assets/icons/trinkets/cx_magnet_armor.webp" width="36" height="36" alt=""> | **Medaglione della Fortezza** | +70% raccolta, +2,8 armatura. |
| <img src="assets/icons/trinkets/cx_magnet_regen.webp" width="36" height="36" alt=""> | **Bandana dell'Esploratore** | +98% raccolta, +0,8 salute al secondo. |
| <img src="assets/icons/trinkets/cx_magnet_cd.webp" width="36" height="36" alt=""> | **Capsula del Ritmo** | +70% raccolta, -14% ricarica. |
| <img src="assets/icons/trinkets/cx_hpPct_lootRate.webp" width="36" height="36" alt=""> | **Sigillo della Resistenza** | +32% salute, +50% loot extra. |
| <img src="assets/icons/trinkets/cx_hpPct_armor.webp" width="36" height="36" alt=""> | **Polsiera del Muro** | +23% salute, +2,8 armatura. |
| <img src="assets/icons/trinkets/cx_hpPct_regen.webp" width="36" height="36" alt=""> | **Tessera del Colosso** | +32% salute, +0,8 salute al secondo. |
| <img src="assets/icons/trinkets/cx_hpPct_cd.webp" width="36" height="36" alt=""> | **Cintura della Concentrazione** | +23% salute, -14% ricarica. |
| <img src="assets/icons/trinkets/cx_lootRate_armor.webp" width="36" height="36" alt=""> | **Collana della Caccia** | +70% loot extra, +2 armatura. |
| <img src="assets/icons/trinkets/cx_lootRate_regen.webp" width="36" height="36" alt=""> | **Elmo della Fenice** | +50% loot extra, +1,1 salute al secondo. |
| <img src="assets/icons/trinkets/cx_lootRate_cd.webp" width="36" height="36" alt=""> | **Cristallo del Ladro** | +70% loot extra, -10% ricarica. |
| <img src="assets/icons/trinkets/cx_armor_regen.webp" width="36" height="36" alt=""> | **Gemma della Sorgente** | +2 armatura, +1,1 salute al secondo. |
| <img src="assets/icons/trinkets/cx_armor_cd.webp" width="36" height="36" alt=""> | **Tunica della Corazza** | +2,8 armatura, -10% ricarica. |
| <img src="assets/icons/trinkets/cx_regen_cd.webp" width="36" height="36" alt=""> | **Corno del Kata** | +0,8 salute al secondo, -14% ricarica. |
| <img src="assets/icons/trinkets/cx_might_spd_xp.webp" width="36" height="36" alt=""> | **Medaglione del Torneo** | +8% danno, +14% velocità, +12% esperienza. |
| <img src="assets/icons/trinkets/cx_might_spd_lootRate.webp" width="36" height="36" alt=""> | **Mantello dello Scatto** | +8% danno, +14% velocità, +40% loot extra. |
| <img src="assets/icons/trinkets/cx_might_xp_area.webp" width="36" height="36" alt=""> | **Capsula dell'Eco** | +8% danno, +14% esperienza, +12% area. |
| <img src="assets/icons/trinkets/cx_might_gold_crit.webp" width="36" height="36" alt=""> | **Sigillo del Guerriero** | +8% danno, +27% zenny, +6% probabilità di critico. |
| <img src="assets/icons/trinkets/cx_might_gold_regen.webp" width="36" height="36" alt=""> | **Scudo dell'Oro** | +8% danno, +27% zenny, +0,6 salute al secondo. |
| <img src="assets/icons/trinkets/cx_might_crit_armor.webp" width="36" height="36" alt=""> | **Pendente del Bastione** | +8% danno, +6% probabilità di critico, +1,6 armatura. |
| <img src="assets/icons/trinkets/cx_might_dodge_armor.webp" width="36" height="36" alt=""> | **Anello della Furia** | +8% danno, +11% schivata, +1,6 armatura. |
| <img src="assets/icons/trinkets/cx_might_area_regen.webp" width="36" height="36" alt=""> | **Collana dell'Onda** | +8% danno, +14% area, +0,6 salute al secondo. |
| <img src="assets/icons/trinkets/cx_might_hpPct_lootRate.webp" width="36" height="36" alt=""> | **Guanti dell'Abbondanza** | +8% danno, +20% salute, +40% loot extra. |
| <img src="assets/icons/trinkets/cx_might_armor_regen.webp" width="36" height="36" alt=""> | **Spilla del Pugno Ferreo** | +8% danno, +1,8 armatura, +0,6 salute al secondo. |
| <img src="assets/icons/trinkets/cx_spd_xp_magnet.webp" width="36" height="36" alt=""> | **Emblema del Dojo** | +15% velocità, +14% esperienza, +56% raccolta. |
| <img src="assets/icons/trinkets/cx_spd_gold_dodge.webp" width="36" height="36" alt=""> | **Sigillo del Miraggio** | +15% velocità, +27% zenny, +10% schivata. |
| <img src="assets/icons/trinkets/cx_spd_gold_cd.webp" width="36" height="36" alt=""> | **Corona del Vento** | +15% velocità, +27% zenny, -8% ricarica. |
| <img src="assets/icons/trinkets/cx_spd_crit_regen.webp" width="36" height="36" alt=""> | **Spallina dello Sguardo** | +15% velocità, +6% probabilità di critico, +0,6 salute al secondo. |
| <img src="assets/icons/trinkets/cx_spd_dodge_regen.webp" width="36" height="36" alt=""> | **Cintura del Respiro** | +15% velocità, +11% schivata, +0,6 salute al secondo. |
| <img src="assets/icons/trinkets/cx_spd_area_cd.webp" width="36" height="36" alt=""> | **Orecchino del Lampo** | +15% velocità, +14% area, -8% ricarica. |
| <img src="assets/icons/trinkets/cx_spd_hpPct_armor.webp" width="36" height="36" alt=""> | **Elmo della Salute** | +15% velocità, +20% salute, +1,6 armatura. |
| <img src="assets/icons/trinkets/cx_spd_armor_cd.webp" width="36" height="36" alt=""> | **Bandana della Calma** | +15% velocità, +1,8 armatura, -8% ricarica. |
| <img src="assets/icons/trinkets/cx_xp_gold_lootRate.webp" width="36" height="36" alt=""> | **Gemma del Saggio** | +15% esperienza, +27% zenny, +40% loot extra. |
| <img src="assets/icons/trinkets/cx_xp_crit_hpPct.webp" width="36" height="36" alt=""> | **Tunica del Cecchino** | +15% esperienza, +6% probabilità di critico, +18% salute. |
| <img src="assets/icons/trinkets/cx_xp_dodge_hpPct.webp" width="36" height="36" alt=""> | **Corno della Vita** | +15% esperienza, +11% schivata, +18% salute. |
| <img src="assets/icons/trinkets/cx_xp_area_lootRate.webp" width="36" height="36" alt=""> | **Medaglione dello Studio** | +15% esperienza, +14% area, +40% loot extra. |
| <img src="assets/icons/trinkets/cx_xp_magnet_regen.webp" width="36" height="36" alt=""> | **Anello del Drago** | +15% esperienza, +63% raccolta, +0,6 salute al secondo. |
| <img src="assets/icons/trinkets/cx_xp_lootRate_regen.webp" width="36" height="36" alt=""> | **Orecchino della Rinascita** | +15% esperienza, +45% loot extra, +0,6 salute al secondo. |
| <img src="assets/icons/trinkets/cx_gold_crit_magnet.webp" width="36" height="36" alt=""> | **Distintivo del Mercante** | +30% zenny, +6% probabilità di critico, +56% raccolta. |
| <img src="assets/icons/trinkets/cx_gold_dodge_magnet.webp" width="36" height="36" alt=""> | **Spilla dell'Ombra** | +30% zenny, +11% schivata, +56% raccolta. |
| <img src="assets/icons/trinkets/cx_gold_area_hpPct.webp" width="36" height="36" alt=""> | **Pendente del Vigore** | +30% zenny, +14% area, +18% salute. |
| <img src="assets/icons/trinkets/cx_gold_magnet_armor.webp" width="36" height="36" alt=""> | **Fiala della Fortuna** | +30% zenny, +63% raccolta, +1,6 armatura. |
| <img src="assets/icons/trinkets/cx_gold_lootRate_armor.webp" width="36" height="36" alt=""> | **Orologio del Predatore** | +30% zenny, +45% loot extra, +1,6 armatura. |
| <img src="assets/icons/trinkets/cx_crit_dodge_magnet.webp" width="36" height="36" alt=""> | **Medaglione della Calamita** | +7% probabilità di critico, +11% schivata, +56% raccolta. |
| <img src="assets/icons/trinkets/cx_crit_area_hpPct.webp" width="36" height="36" alt=""> | **Talismano dell'Occhio Acuto** | +7% probabilità di critico, +14% area, +18% salute. |
| <img src="assets/icons/trinkets/cx_crit_magnet_armor.webp" width="36" height="36" alt=""> | **Emblema del Raccoglitore** | +7% probabilità di critico, +63% raccolta, +1,6 armatura. |
| <img src="assets/icons/trinkets/cx_crit_lootRate_armor.webp" width="36" height="36" alt=""> | **Sfera del Guardiano** | +7% probabilità di critico, +45% loot extra, +1,6 armatura. |
| <img src="assets/icons/trinkets/cx_dodge_area_hpPct.webp" width="36" height="36" alt=""> | **Polsiera della Nebbia** | +13% schivata, +14% area, +18% salute. |
| <img src="assets/icons/trinkets/cx_dodge_magnet_armor.webp" width="36" height="36" alt=""> | **Tessera del Radar** | +13% schivata, +63% raccolta, +1,6 armatura. |
| <img src="assets/icons/trinkets/cx_dodge_lootRate_armor.webp" width="36" height="36" alt=""> | **Cintura della Roccia** | +13% schivata, +45% loot extra, +1,6 armatura. |
| <img src="assets/icons/trinkets/cx_area_magnet_lootRate.webp" width="36" height="36" alt=""> | **Collana della Tempesta** | +15% area, +63% raccolta, +40% loot extra. |
| <img src="assets/icons/trinkets/cx_area_hpPct_cd.webp" width="36" height="36" alt=""> | **Capsula della Tartaruga** | +15% area, +20% salute, -8% ricarica. |
| <img src="assets/icons/trinkets/cx_magnet_hpPct_lootRate.webp" width="36" height="36" alt=""> | **Bandana del Bottino** | +70% raccolta, +20% salute, +40% loot extra. |
| <img src="assets/icons/trinkets/cx_magnet_armor_regen.webp" width="36" height="36" alt=""> | **Diadema dell'Attrazione** | +70% raccolta, +1,8 armatura, +0,6 salute al secondo. |
| <img src="assets/icons/trinkets/cx_proj_might.webp" width="36" height="36" alt=""> | **Bracciale della Pioggia di Ki** | +2 quantità, +8% danno. |
| <img src="assets/icons/trinkets/cx_proj_crit.webp" width="36" height="36" alt=""> | **Mantello dei Mille Colpi** | +2 quantità, +7% probabilità di critico. |
| <img src="assets/icons/trinkets/cx_proj_cd.webp" width="36" height="36" alt=""> | **Emblema della Raffica** | +2 quantità, -10% ricarica. |
| <img src="assets/icons/trinkets/cx_proj_area.webp" width="36" height="36" alt=""> | **Maschera dello Sciame** | +2 quantità, +15% area. |
| <img src="assets/icons/trinkets/cx_proj_spd.webp" width="36" height="36" alt=""> | **Corno della Tempesta di Ki** | +2 quantità, +15% velocità. |
| <img src="assets/icons/trinkets/cx_proj_hpPct.webp" width="36" height="36" alt=""> | **Medaglione dei Cento Pugni** | +2 quantità, +23% salute. |
| <img src="assets/icons/trinkets/cx_proj_xp.webp" width="36" height="36" alt=""> | **Talismano della Moltitudine** | +2 quantità, +15% esperienza. |
| <img src="assets/icons/trinkets/cx_proj_armor.webp" width="36" height="36" alt=""> | **Bastone della Pioggia di Ki** | +2 quantità, +2 armatura. |
| <img src="assets/icons/trinkets/cx_proj_might_cd.webp" width="36" height="36" alt=""> | **Tunica dei Mille Colpi** | +2 quantità, +6% danno, -8% ricarica. |
| <img src="assets/icons/trinkets/cx_proj_area_crit.webp" width="36" height="36" alt=""> | **Orologio della Raffica** | +2 quantità, +12% area, +6% probabilità di critico. |
| <img src="assets/icons/trinkets/el_redribbon.webp" width="36" height="36" alt=""> | **Distintivo del Red Ribbon** | +34% comparsa élite. |
| <img src="assets/icons/trinkets/el_frieza.webp" width="36" height="36" alt=""> | **Scouter dell'Esercito di Freezer** | +24% comparsa élite, +7% probabilità di critico. |
| <img src="assets/icons/trinkets/el_ginyu.webp" width="36" height="36" alt=""> | **Emblema della Squadra Ginyu** | +24% comparsa élite, +8% danno. |
| <img src="assets/icons/trinkets/el_saiyan.webp" width="36" height="36" alt=""> | **Sangue Saiyan** | +24% comparsa élite, +15% esperienza. |
| <img src="assets/icons/trinkets/el_bounty.webp" width="36" height="36" alt=""> | **Taglia del Cacciatore** | +17% comparsa élite, +30% zenny, +40% loot extra. |
| <img src="assets/icons/trinkets/bd_solo.webp" width="36" height="36" alt=""> | **Gemma del Raggio Eterno** | +30% durata raggi. |
| <img src="assets/icons/trinkets/bd_might.webp" width="36" height="36" alt=""> | **Guanti del Raggio Possente** | +21% durata raggi, +11% danno. |
| <img src="assets/icons/trinkets/bd_spd.webp" width="36" height="36" alt=""> | **Stivali del Raggio Veloce** | +21% durata raggi, +21% velocità. |
| <img src="assets/icons/trinkets/bd_area.webp" width="36" height="36" alt=""> | **Lente del Raggio Largo** | +21% durata raggi, +21% area. |
| <img src="assets/icons/trinkets/bd_cd.webp" width="36" height="36" alt=""> | **Cristallo del Flusso Continuo** | +21% durata raggi, -14% ricarica. |
| <img src="assets/icons/trinkets/bd_crit.webp" width="36" height="36" alt=""> | **Occhio del Raggio Mortale** | +21% durata raggi, +10% probabilità di critico. |
| <img src="assets/icons/trinkets/bd_xp.webp" width="36" height="36" alt=""> | **Pergamena del Maestro dei Raggi** | +21% durata raggi, +21% esperienza. |
| <img src="assets/icons/trinkets/bd_hpPct.webp" width="36" height="36" alt=""> | **Medaglione del Raggio Vitale** | +21% durata raggi, +32% salute. |
| <img src="assets/icons/trinkets/bd_armor.webp" width="36" height="36" alt=""> | **Bracciale del Raggio Saldo** | +21% durata raggi, +2,8 armatura. |
| <img src="assets/icons/trinkets/bd_regen.webp" width="36" height="36" alt=""> | **Fiala del Raggio Curativo** | +21% durata raggi, +1,1 salute al secondo. |
| <img src="assets/icons/trinkets/bd_proj.webp" width="36" height="36" alt=""> | **Corona del Raggio Moltiplicato** | +2 quantità, +15% durata raggi. |

</details>

<details>
<summary><b>Mitico (0)</b></summary>

| | Nome | Effetto |
|---|---|---|

</details>

</details>

---

## Stage, nemici e boss

<p align="center"><img src="docs/screens/it/stages.jpg" alt="Selezione dello stage" width="860"><br><sub>Selezione dello stage</sub></p>

| | Stage | Sblocco | Boss |
|---|---|---|---|
| <img src="docs/screens/stages/stage_1.jpg" width="220" alt=""> | **1. Isola di Muten** | — | Mercenario Tao, Tenshinhan, Jackie Chun, Re Piccolo |
| <img src="docs/screens/stages/stage_2.jpg" width="220" alt=""> | **2. Via del Serpente** | vincere lo stage 1 | Janemba (Forma Grassa) |
| <img src="docs/screens/stages/stage_3.jpg" width="220" alt=""> | **3. Pianura Saiyan** | vincere lo stage 2 | Raditz, Nappa, Vegeta, Scimmione Gigante |
| <img src="docs/screens/stages/stage_4.jpg" width="220" alt=""> | **4. Pianeta Vegeta** | vincere lo stage 3 | Nappa, Bardock, Turles, Scimmione Gigante |
| <img src="docs/screens/stages/stage_5.jpg" width="220" alt=""> | **5. Pianeta Namek** | vincere lo stage 4 | Ginew, Dodoria, Zarbon, Cooler, Freezer |
| <img src="docs/screens/stages/stage_6.jpg" width="220" alt=""> | **6. Rovine degli Androidi** | vincere lo stage 5 | Dr. Gero, C-13, C-14, C-15, C-16, C-17, C-18 |
| <img src="docs/screens/stages/stage_7.jpg" width="220" alt=""> | **7. Arena dei Cell Game** | vincere lo stage 6 | C-16, Cell Max, Cell |
| <img src="docs/screens/stages/stage_8.jpg" width="220" alt=""> | **8. Inferno** | vincere lo stage 7 | Dabura, Freezer (Prima Forma), Cell (Forma Imperfetta), Omega Shenron |
| <img src="docs/screens/stages/stage_9.jpg" width="220" alt=""> | **9. Dimensione di Bu** | vincere lo stage 8 | Dabura, Super Bu, Bu Puro, Majin Bu |
| <img src="docs/screens/stages/stage_10.jpg" width="220" alt=""> | **10. Regno degli Dei** | vincere lo stage 9 | Kaioshin, Dai Kaioshin, Champa, Beerus |
| <img src="docs/screens/stages/stage_11.jpg" width="220" alt=""> | **11. Torneo del Potere** | vincere lo stage 10 | Dyspo, Bergamo, Basil, Lavender, Ribrianne, Cabba, Caulifla, Kale, Frost, Hit, Toppo, Jiren |

Gli stage seguono l'ordine canonico di Dragon Ball (Dragon Ball → Z → Super). Ogni mappa ha la sua musica, i suoi ostacoli dipinti, il suo meteo e un evento a tema; la **Via del Serpente** è fatta di isole raggiungibili, il **Torneo del Potere** si combatte in un'arena circolare chiusa.

- **Nemici**: oltre 140 varianti con IA diverse (inseguimento, tiratori, kamikaze, schermati, schivatori…), con **gradi** che li rendono più forti e colorati col passare dei minuti.
- **Boss**: un centinaio tra boss e miniboss (Raditz, Nappa e Vegeta, Freezer e Cooler, Cell, Janemba, Omega Shenron, Jiren…). Si trasformano, hanno mosse firmate, una debolezza e un potenziamento in corso di partita. La **Guida/Glossario** descrive ogni nemico e boss.
- **Album dei nemici**: scoprirne 10, 25 e 50 dà premi.

---

## Progressione permanente

- **Negozio**: potenziamenti permanenti con costo crescente (Avidità, Studio, Vitalità, Rigenerazione, Danno, Agilità, Magnetismo, Armatura Saiyan, Ritmo, Fortuna, Area, Occhio Critico, Durata Raggi, Seconda Vita, Urlo di Broly!, Scanner Sfere del Drago, Quantità, Cimelio Extra, Lista Nera Armi, Reroll, Skip, Ban).
- **Achievement e Obiettivi**: centinaia di traguardi con premi in zenny e ticket (uccisioni, boss, collezione di cimeli, perfezione, fusioni, estrazioni…), più le **missioni giornaliere**.
- **Maestria**: ogni personaggio sale fino al Lv 10 giocandolo; al **Lv 5** ottieni una passiva e le fusioni di personaggi si sbloccano con i genitori a Maestria 5.
- **Patti**: 7 maledizioni volontarie (ferro, furia, orda, vento, cristallo, digiuno, oblio) per partite più dure e paga più alta.
- **Grimorio**: ricette di tutte le evoluzioni, requisiti e progressi per arma, con diario delle uccisioni.
- **Carriera**: tempo di gioco, partite, vittorie, nemici e boss sconfitti, arma e personaggio preferiti, nemici per saga.
- **Codici delle build**: copia il codice della tua build a fine partita e incolla quello di un amico per vederla.
- **Scheda di fine partita** da condividere, note di versione nel gioco (📜).


<table><tr><td width="50%"><img src="docs/screens/it/shop.jpg" alt="Negozio"><br><sub>Negozio</sub></td><td width="50%"><img src="docs/screens/it/ach.jpg" alt="Obiettivi e missioni giornaliere"><br><sub>Obiettivi e missioni giornaliere</sub></td></tr></table>

<table><tr><td width="50%"><img src="docs/screens/it/unl.jpg" alt="Achievement e sblocchi"><br><sub>Achievement e sblocchi</sub></td><td width="50%"><img src="docs/screens/it/grimoire.jpg" alt="Grimorio"><br><sub>Grimorio</sub></td></tr></table>

<table><tr><td width="50%"><img src="docs/screens/it/glossary.jpg" alt="Glossario dei nemici"><br><sub>Glossario dei nemici</sub></td><td width="50%"><img src="docs/screens/it/pacts.jpg" alt="Patti e maledizioni"><br><sub>Patti e maledizioni</sub></td></tr></table>

<details>
<summary><b>Tutti i potenziamenti del Negozio</b></summary>

| | Nome | Effetto | Livelli max |
|---|---|---|---|
| <img src="assets/icons/shop/gold.webp" width="36" height="36" alt=""> | **Avidità** | +15% zenny per livello. | 6 |
| <img src="assets/icons/shop/exp.webp" width="36" height="36" alt=""> | **Studio** | +10% esperienza per livello. | 6 |
| <img src="assets/icons/shop/hp.webp" width="36" height="36" alt=""> | **Vitalità** | +20 salute massima per livello. | 6 |
| <img src="assets/icons/shop/regen.webp" width="36" height="36" alt=""> | **Rigenerazione** | +0,5 salute/s per livello. | 6 |
| <img src="assets/icons/shop/might.webp" width="36" height="36" alt=""> | **Danno** | +6% danno per livello. | 6 |
| <img src="assets/icons/shop/speed.webp" width="36" height="36" alt=""> | **Agilità** | +4% velocità per livello. | 6 |
| <img src="assets/icons/shop/magnet.webp" width="36" height="36" alt=""> | **Magnetismo** | +5% raccolta per livello. | 6 |
| <img src="assets/icons/shop/armor.webp" width="36" height="36" alt=""> | **Armatura Saiyan** | +2 armatura per livello. | 6 |
| <img src="assets/icons/shop/cd.webp" width="36" height="36" alt=""> | **Ritmo** | -5% ricarica per livello. | 6 |
| <img src="assets/icons/shop/luck.webp" width="36" height="36" alt=""> | **Fortuna** | +2,5% fortuna per livello: più ricompense dai forzieri, loot e cimeli migliori. | 6 |
| <img src="assets/icons/shop/area.webp" width="36" height="36" alt=""> | **Area** | +4% area per livello: la portata di tutte le armi è più grande. | 6 |
| <img src="assets/icons/shop/crit.webp" width="36" height="36" alt=""> | **Occhio Critico** | +4% probabilità di critico per livello. | 6 |
| <img src="assets/icons/shop/bdur.webp" width="36" height="36" alt=""> | **Durata Raggi** | +5% durata dei raggi per livello: Kamehameha, Big Bang e Cannone Garlick restano più a lungo alla massima estensione. | 6 |
| <img src="assets/icons/shop/revive.webp" width="36" height="36" alt=""> | **Seconda Vita** | +1 resurrezione (50% salute) per partita. | 2 |
| <img src="assets/icons/shop/broly.webp" width="36" height="36" alt=""> | **Urlo di Broly!** | +5% frequenza dei nemici per livello: più nemici, più esperienza e bottino, ma anche più pericolo. | 5 |
| <img src="assets/icons/shop/scan.webp" width="36" height="36" alt=""> | **Scanner Sfere del Drago** | +5% frequenza delle Sfere del Drago per livello, anche Super e quelle dei nemici. | 2 |
| <img src="assets/icons/shop/proj.webp" width="36" height="36" alt=""> | **Quantità** | +1 quantità: ogni arma lancia un proiettile in più (i raggi si caricano il 15% più a lungo). | 2 |
| <img src="assets/icons/shop/tslot.webp" width="36" height="36" alt=""> | **Cimelio Extra** | +1 slot cimelio: porti fino a 3 cimeli insieme. | 2 |
| <img src="assets/icons/shop/ban.webp" width="36" height="36" alt=""> | **Lista Nera Armi** | +1 arma bandita: le armi bandite non compaiono più tra i potenziamenti, così le altre escono più spesso. Scegli quali bandire dalla scheda. | 10 |
| <img src="assets/icons/shop/rr.webp" width="36" height="36" alt=""> | **Reroll** | +1 reroll a partita: al level-up ritira tutte e 3 le carte potenziamento. | 5 |
| <img src="assets/icons/shop/sk.webp" width="36" height="36" alt=""> | **Skip** | +1 skip a partita: al level-up salti la scelta senza prendere nulla. | 5 |
| <img src="assets/icons/shop/bn.webp" width="36" height="36" alt=""> | **Ban** | +1 ban a partita: al level-up bandisci un'arma o un potenziamento (a tua scelta) per il resto della partita. | 5 |

</details>

---

## Online e co-op

- **Account e cloud** (facoltativi): registrazione con email e password (con recupero tramite codice) o con Google; il salvataggio si sincronizza tra dispositivi, con gestione dei conflitti.
- **Classifiche** per stage e metrica, **Sfida settimanale** con il fantasma del primo, **eventi della comunità** settimanali.
- **Co-op (BETA)**: stanze con codice, amici, inviti, ricerca di compagni, chat e classifica. Fino a **4 giocatori** nella stessa partita; la scelta delle carte di uno non ferma gli altri.
- Controlli sul server e protezioni anti-cheat per le classifiche.

Senza account il gioco funziona benissimo anche **offline**: il salvataggio è nel browser (codificato).

---

## Schermate e opzioni

**Menu principale**: Gioca · Avvio rapido · Co-op · Crescita (Negozio, Gacha, Borsa) · Progressi (Sblocchi, Achievement, Carriera, Classifiche) · Opzioni · Grimorio · Guida/Glossario · Note di versione · Account.

**Opzioni**: lingua (**italiano, inglese, spagnolo, francese, tedesco, portoghese**), grafica (risoluzione dinamica, opacità e riduzione degli effetti, animazioni di morte, schermo intero, zoom), audio (musica, effetti, armi evolute più silenziose), gameplay (level-up automatico, priorità, Kamehameha, ticket), comandi riassegnabili per tastiera e gamepad.

**Tecnologia**: tutta la grafica è in pixel art, in parte generata dal codice e in parte dipinta (personaggi, aure, armi, mappe, icone); gli effetti sonori sono sintetizzati in stile 8-bit, la musica è in MP3 (una per mappa, più i temi dei boss). Il gioco regola da solo la risoluzione per restare fluido nelle fasi più affollate.

---

## Grafica e sprite dei personaggi

> **Avviso sugli sprite.** I personaggi di questo gioco **non** usano sprite ufficiali di Dragon Ball e non sono una riproduzione fedele dei disegni originali. È una scelta obbligata, non un vezzo.

**Come sono fatti.**
- **Quasi tutti i personaggi sono generati dal codice** (`src/js/sprites.js`): una piccola pixel art "a blocchi" costruita da parametri (colore della pelle, tuta, armatura, stivali, stile dei capelli, accessori). Le **linee di trasformazione** cambiano capelli, colori e **aura**; le pose delle armi (Kamehameha, Genkidama…) sono disegnate dal codice (`src/js/pose.js`). Per questo sono *ispirati* ai personaggi, ma semplificati e riconoscibili solo nei tratti principali.
- **Goku è l'eccezione**: le sue forme (base, Kaioken, Super Saiyan, God, Blue, Ultra Istinto) usano sprite pixel art **fan-made** di artisti terzi, elencati in [CREDITS.md](CREDITS.md). Le sue camminate sono state ricavate da video e immagini generati con un'AI (Gemini) a partire dagli sprite fermi e ricolorate con la stessa tavolozza.
- **Aure, effetti delle armi, terreni e ostacoli** sono illustrazioni generate con strumenti AI e poi pulite, ritagliate e animate da script (`tools/`).

**Perché è difficile ricreare gli originali.**
- **Diritti**: i design appartengono a Toei Animation, Shueisha e Bandai Namco. Gli sprite ufficiali dei giochi non si possono usare, e rifarli fedelmente significherebbe riprodurre opere protette: il gioco resta un omaggio *amatoriale e non commerciale*.
- **Mole di lavoro**: 58 personaggi, fino a 8 forme ciascuno, ognuno con camminata, attacco, pose delle armi e aura, rivolto in più direzioni. Disegnarli a mano, in modo coerente, è un lavoro da un intero team di artisti.
- **Limiti dell'AI**: i generatori di immagini non mantengono lo stesso personaggio da un frame all'altro, non rispettano una griglia di pixel né una tavolozza ristretta, e sbagliano proporzioni e mani. Per questo vanno bene per aure ed effetti, ma non per animare un personaggio fotogramma per fotogramma.
- **Coerenza dello stile**: sprite presi da fonti diverse hanno dimensioni, tavolozze e livelli di dettaglio incompatibili; il gioco li uniforma, ma un set completo e omogeneo dello stesso autore non esiste.

Se sei un titolare dei diritti o l'autore di uno sprite e vuoi chiedere una modifica o una rimozione, apri una issue: verrà gestita subito. Vedi anche [DISCLAIMER.md](DISCLAIMER.md) e [CREDITS.md](CREDITS.md).

---

## Build e sviluppo

Servono **Python 3** (per il bundler) e, opzionalmente, **Node.js** (controlli di sintassi e test).

```bash
python3 build.py --check    # crea dist/dragon-ball-survivors.html e controlla la sintassi con node
```

Apri `dist/dragon-ball-survivors.html` in un browser moderno: è autosufficiente e funziona anche offline. Se `esbuild` è installato la pagina viene minificata.

- **Musica ed effetti**: file in `assets/audio/` (vedi [assets/README.md](assets/README.md)); se mancano si usa audio sintetizzato.
- **Pubblicazione**: il workflow `.github/workflows/deploy.yml` costruisce il gioco e lo pubblica su GitHub Pages a ogni push su `main`.
- Il gioco si accorge da solo delle nuove versioni (`dist/version.json`) e propone di ricaricare.

## Struttura del progetto

```
build.py              bundler: unisce src/ e gli asset in un unico HTML
src/index.html        pagina
src/css/              stili (style, skin, gacha, mobile, loader)
src/js/
  util.js data.js     utilità e dati (armi, personaggi, stage, nemici, boss, cimeli, compagni, negozio…)
  i18n*.js            traduzioni (it, en, es, fr, de, pt)
  game.js             logica di gioco (senza DOM) e MapDirector (eventi, totem, stanze, Macchina dello Scambio)
  weapons*.js wfx.js  comportamento e animazioni dipinte delle armi
  world.js mapx.js …  mappe, terreno, ostacoli, isole, mare, lava, eventi a tema
  sprites*.js pose.js sprite procedurali e dipinti, pose delle armi
  renderer.js         disegno (canvas, HUD, effetti)
  ui*.js app.js       schermate, input, ciclo principale
  gacha.js ui_gacha.js ui_trin.js   Gacha, Borsa, Reroll, Fusione, Macchina dello Scambio
  save.js cloud.js    salvataggio, sincronizzazione e classifiche
  audio.js            effetti 8-bit sintetizzati e musica
assets/
  ui/                 logo, atlanti delle barre, menu, cornici delle carte
  icons/              icone: negozio, armi, cimeli, abilità, HUD
  sprites/            fogli sprite e sorgenti (vedi assets/sprites/README.md)
  audio/              musica (music/menu, stages, bosses) ed effetti sonori (sfx/)
tools/                script che generano atlanti e fogli sprite dalle sorgenti
tests/                simulazioni e test con Puppeteer (python3 tools/run_tests.py)
docs/                 logo e screenshot
```

```bash
python3 tools/run_tests.py   # esegue la batteria di test
node tests/check_i18n.js     # verifica le traduzioni in tutte le lingue
```

> Il bilanciamento è stato verificato anche con un bot volutamente debole: l'esperienza di una persona può essere più facile. Segnalazioni e proposte sono benvenute nelle issue.

## Licenza e crediti

Il **codice** è sotto licenza [MIT](LICENSE). Nomi, personaggi e marchi di Dragon Ball **non sono coperti** da questa licenza e appartengono ai rispettivi proprietari ([DISCLAIMER.md](DISCLAIMER.md)). Crediti di grafica e musica in [CREDITS.md](CREDITS.md).
