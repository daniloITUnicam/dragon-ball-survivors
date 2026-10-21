# Sprite che mancano

> **Aggiornamento 16/10/2026 (sera): gli sprite sono sospesi, anche quelli di Goku e le rocce: il gioco usa solo la grafica disegnata dal codice; tutto è in `assets/sprites/_inutilizzati/personaggi/`.** In precedenza:
> **Aggiornamento 16/10/2026:** per ora hanno sprite solo **Goku** (9 forme, fogli a griglia) e gli effetti (Kamehameha, rocce). Tutti gli altri personaggi, boss e nemici sono tornati alla grafica base disegnata dal codice; i vecchi fogli del pack sono in `assets/sprites/_inutilizzati/personaggi/` (non vengono incorporati nel gioco) e le loro righe in `tools/sprite_map_archivio.json`. Qui sotto la lista originale: oggi mancano tutti tranne Goku.

Elenco generato il 16/10/2026 confrontando il gioco (personaggi, forme, boss, nemici, armi, animali, ostacoli) con i fogli in `assets/sprites/`. Dove manca uno sprite il gioco usa la grafica disegnata dal codice, quindi niente è rotto: ogni voce sotto è un miglioramento da caricare.

**Come caricare:** una cartella per forma (frame numerati, sfondo trasparente o bianco) in `assets/sprites/`, poi una riga in `tools/sprite_map.json` (guida: `docs/SPRITES.md`). Per ogni forma servono: **fermo** (1), **camminata** (idealmente 6-9 frame, vedi sotto), **preparazione colpo** (1), **colpo** (1). Opzionali: **posa di carica** (trasformazioni), **posa di scatto**, **scia dello scatto**.

Sono già stati rimossi/sostituiti i frame rotti: posa di carica di Trunks SSJ (era un altro personaggio) e scia dello scatto di Trunks SSJ, Freezer terza forma e Broly full power (erano un personaggio o righe verticali; ora usano la scia base del personaggio).

## 1. Personaggi giocabili senza alcuno sprite (25)

Il numero è quello delle forme (trasformazioni) del personaggio: in ordine di importanza, prima la base, poi le forme che vuoi mostrare davvero (le altre possono riusare la base).

- [ ] **Yamcha** (`yamcha`, linea human): base + 8 forme (Concentrazione, Modalità Illuminata, Potere Nascosto, Ultimo Sforzo, Cuore Puro, Armonia Totale, Istinto Superiore (segno), Istinto Superiore)
- [ ] **Tenshinhan** (`tien`, linea human): base + 8 forme (Concentrazione, Modalità Illuminata, Potere Nascosto, Ultimo Sforzo, Cuore Puro, Armonia Totale, Istinto Superiore (segno), Istinto Superiore)
- [ ] **Genio Tartaruga** (`muten`, linea human): base + 8 forme (Concentrazione, Modalità Illuminata, Potere Nascosto, Ultimo Sforzo, Cuore Puro, Armonia Totale, Istinto Superiore (segno), Istinto Superiore)
- [ ] **Goten** (`goten`, linea saiyan): base + 8 forme (Kaioken, Super Saiyan, Super Saiyan 2, Super Saiyan 3, Super Saiyan God, Super Saiyan Blue, Ultra Istinto (segno), Ultra Istinto Completo)
- [ ] **Mr. Satan** (`satan`, linea human): base + 8 forme (Concentrazione, Modalità Illuminata, Potere Nascosto, Ultimo Sforzo, Cuore Puro, Armonia Totale, Istinto Superiore (segno), Istinto Superiore)
- [ ] **Nappa** (`nappa`, linea saiyan): base + 8 forme (Kaioken, Super Saiyan, Super Saiyan 2, Super Saiyan 3, Super Saiyan God, Super Saiyan Blue, Ultra Istinto (segno), Ultra Istinto Completo)
- [ ] **Capitan Ginyu** (`ginyu`, linea freezer): base + 6 forme (Seconda Forma, Terza Forma, Forma Finale, Cento Percento, Freezer Dorato, Freezer Nero)
- [ ] **Zarbon** (`zarbon`, linea freezer): base + 6 forme (Seconda Forma, Terza Forma, Forma Finale, Cento Percento, Freezer Dorato, Freezer Nero)
- [ ] **Dyspo** (`dyspo`, linea pride): base + 8 forme (Postura da Guerriero, Muscoli Tesi, Pugno Potente, Aura Rossa, Piena Potenza, Oltre il Limite, Orgoglio Supremo, Il Più Forte)
- [ ] **Dr. Gero** (`gero`, linea android): base + 8 forme (Barriera Energetica, Raffica Rapida, Colpi Calibrati, Energia Infinita, Potenza Cyborg, Equilibrio Perfetto, Istinto Superiore (segno), Istinto Superiore)
- [ ] **C-21** (`c21`, linea android): base + 8 forme (Barriera Energetica, Raffica Rapida, Colpi Calibrati, Energia Infinita, Potenza Cyborg, Equilibrio Perfetto, Istinto Superiore (segno), Istinto Superiore)
- [ ] **Videl** (`videl`, linea human): base + 8 forme (Concentrazione, Modalità Illuminata, Potere Nascosto, Ultimo Sforzo, Cuore Puro, Armonia Totale, Istinto Superiore (segno), Istinto Superiore)
- [ ] **Bulma** (`bulma`, linea human): base + 8 forme (Concentrazione, Modalità Illuminata, Potere Nascosto, Ultimo Sforzo, Cuore Puro, Armonia Totale, Istinto Superiore (segno), Istinto Superiore)
- [ ] **Yajirobe** (`yajirobe`, linea human): base + 8 forme (Concentrazione, Modalità Illuminata, Potere Nascosto, Ultimo Sforzo, Cuore Puro, Armonia Totale, Istinto Superiore (segno), Istinto Superiore)
- [ ] **Great Saiyaman** (`saiyaman`, linea saiyan): base + 8 forme (Kaioken, Super Saiyan, Super Saiyan 2, Super Saiyan 3, Super Saiyan God, Super Saiyan Blue, Ultra Istinto (segno), Ultra Istinto Completo)
- [ ] **Chiaotzu** (`chaozu`, linea chaozu): base + 4 forme (Telecinesi, Dodon Ray Potenziato, Autodistruzione, Mente Perfetta)
- [ ] **Recoome** (`recoome`, linea force): base + 5 forme (Posa Ginyu, Forza Bruta, Assalto Totale, Sinergia di Squadra, Squadra Speciale)
- [ ] **Guldo** (`guldo`, linea force): base + 5 forme (Posa Ginyu, Forza Bruta, Assalto Totale, Sinergia di Squadra, Squadra Speciale)
- [ ] **Nail** (`nail`, linea namek): base + 8 forme (Aura Namecciana, Fusione con Nail, Fusione con Dio, Super Namek, Piccolo Arancione, Namek Divino, Istinto Superiore (segno), Istinto Superiore)
- [ ] **Re Kaioh** (`kingkai`, linea kai): base + 4 forme (Allenamento di Re Kaioh, Kaioken x3, Kaioken x10, Kaioken x20)
- [ ] **Pan** (`pan`, linea human): base + 8 forme (Concentrazione, Modalità Illuminata, Potere Nascosto, Ultimo Sforzo, Cuore Puro, Armonia Totale, Istinto Superiore (segno), Istinto Superiore)
- [ ] **Dabura** (`dabura`, linea demon): base + 4 forme (Ira Demoniaca, Sigillo Infernale, Potere Oscuro, Re dei Demoni)
- [ ] **Mr. Popo** (`popo`, linea human): base + 8 forme (Concentrazione, Modalità Illuminata, Potere Nascosto, Ultimo Sforzo, Cuore Puro, Armonia Totale, Istinto Superiore (segno), Istinto Superiore)
- [ ] **Uub** (`uub`, linea uub): base + 4 forme (Ki Puro, Energia Bu, Potere Nascosto, Campione della Terra)
- [ ] **Re Piccolo** (`kpiccolo`, linea demon): base + 4 forme (Ira Demoniaca, Sigillo Infernale, Potere Oscuro, Re dei Demoni)

## 2. Personaggi con sprite, ma con forme che riusano lo sprite di un'altra forma

Il personaggio ha già grafica; le forme elencate non hanno uno sprite proprio e mostrano quello della forma precedente (non cambia aspetto quando si trasforma). Basta una cartella per forma. Sono elencate solo le linee con trasformazioni visive (Saiyan, Freezer, Cell, Bu, Broly, ecc.).

- [ ] **Vegeta** (`vegeta`): già con sprite: base, Super Saiyan, Super Saiyan God, Super Saiyan Blue. Mancano: Kaioken, Super Saiyan 2, Super Saiyan 3, Ultra Istinto (segno), Ultra Istinto Completo
- [ ] **Trunks** (`trunks`): già con sprite: base, Super Saiyan. Mancano: Kaioken, Super Saiyan 2, Super Saiyan 3, Super Saiyan God, Super Saiyan Blue, Ultra Istinto (segno), Ultra Istinto Completo
- [ ] **Gohan** (`gohan`): già con sprite: base, Super Saiyan, Super Saiyan 2, Ultra Istinto Completo. Mancano: Kaioken, Super Saiyan 3, Super Saiyan God, Super Saiyan Blue, Ultra Istinto (segno)
- [ ] **Broly** (`broly`): già con sprite: base, Super Saiyan. Mancano: Super Saiyan Leggendario, Leggendario Pieno Potere, Furia Selvaggia, Super Saiyan Broly, Super Saiyan Pieno Potere
- [ ] **Freezer** (`freezer`): già con sprite: base, Terza Forma, Forma Finale, Cento Percento, Freezer Dorato. Mancano: Seconda Forma, Freezer Nero
- [ ] **Cell** (`cell`): già con sprite: base, Semi-Perfetto, Cell Perfetto. Mancano: Super Perfetto, Cell Dorato, Cell Nero
- [ ] **Majin Bu** (`bu`): già con sprite: base, Bu Cattivo, Super Bu, Bu Gohan, Bu Puro. Mancano: Bu Grasso, Bu Gotenks, Bu Originale, Bu Infinito
- [ ] **Gotenks** (`gotenks`): già con sprite: base. Mancano: Kaioken, Super Saiyan, Super Saiyan 2, Super Saiyan 3, Super Saiyan God, Super Saiyan Blue, Ultra Istinto (segno), Ultra Istinto Completo
- [ ] **Vegito** (`vegito`): già con sprite: base, Super Saiyan, Super Saiyan Blue. Mancano: Kaioken, Super Saiyan 2, Super Saiyan 3, Super Saiyan God, Ultra Istinto (segno), Ultra Istinto Completo
- [ ] **Raditz** (`raditz`): già con sprite: base, Super Saiyan. Mancano: Kaioken, Super Saiyan 2, Super Saiyan 3, Super Saiyan God, Super Saiyan Blue, Ultra Istinto (segno), Ultra Istinto Completo
- [ ] **Bardock** (`bardock`): già con sprite: base, Super Saiyan. Mancano: Kaioken, Super Saiyan 2, Super Saiyan 3, Super Saiyan God, Super Saiyan Blue, Ultra Istinto (segno), Ultra Istinto Completo
- [ ] **Cooler** (`cooler`): già con sprite: base. Mancano: Seconda Forma, Terza Forma, Forma Finale, Cento Percento, Freezer Dorato, Freezer Nero
- [ ] **Kefla** (`kefla`): già con sprite: Kaioken. Mancano: base, Super Saiyan, Super Saiyan 2, Super Saiyan 3, Super Saiyan God, Super Saiyan Blue, Ultra Istinto (segno), Ultra Istinto Completo
- [ ] **Gogeta** (`gogeta`): già con sprite: base. Mancano: Kaioken, Super Saiyan, Super Saiyan 2, Super Saiyan 3, Super Saiyan God, Super Saiyan Blue, Ultra Istinto (segno), Ultra Istinto Completo
- [ ] **Caulifla** (`caulifla`): già con sprite: base. Mancano: Super Saiyan, Super Saiyan 2, Super Saiyan 2 Pieno Potere
- [ ] **Kale** (`kale`): già con sprite: base, Super Saiyan Berserk. Mancano: Berserk Pieno Potere, Leggendaria Furia
- [ ] **Zamasu** (`zamasu`): già con sprite: base. Mancano: Corpo Immortale, Lama del Giudizio, Ira Santa, Disprezzo Divino, Giustizia Assoluta
- [ ] **Goku Black** (`black`): già con sprite: base, Super Saiyan Rosé. Mancano: Ki Divino, Rosé Pieno Potere, Rosé Evoluto
- [ ] **Zamasu Fuso** (`fzamasu`): già con sprite: base. Mancano: Fusione Stabile, Metà Corrotto, Corruzione Completa, Corruzione Infinita
- [ ] **Turles** (`turles`): già con sprite: base. Mancano: Ki Oscuro, Frutto dell'Albero, Potere Ancestrale, Re Saiyan Oscuro
- [ ] **Frost** (`frost`): già con sprite: base, Forma Finale. Mancano: Maschera Gentile, Veleno Latente, Frost Furioso

Le linee **Umani, Androidi, Namecciani, Pride, Dei, Demoni, Forza Ginyu, Kai, Uub, Chiaotzu** hanno solo variazioni di aura (nessun cambio d'aspetto): per questi personaggi basta lo sprite base, non servono sprite per le forme.

Note: **Kefla** non ha lo sprite della forma base (la forma 0 usa quello a capelli neri e tutte le forme SSJ lo riusano: serve almeno la versione bionda). **Goten** nel pack ha solo pose della fusione.

## 3. Camminata a mano
Oggi solo **Gogeta** ha un ciclo di camminata lungo (9 frame). **Goku** (9 forme) ha la camminata a 4 frame dei suoi fogli nuovi (`Goku nuovo`, forma Kaioken esclusa: usa la camminata sintetica); tutti gli altri personaggi e le trasformazioni di Gogeta usano una camminata sintetica (gambe che oscillano). Per migliorarla serve, per ogni forma, un ciclo di camminata con le sole gambe che si muovono (6-9 frame; vanno bene sheet 3x3 come quello di Goku). Priorità: forme SSJ di Goku, Vegeta, Trunks, Gohan, Piccolo.

## 4. Frame opzionali che mancano nei fogli esistenti
Posa di carica (usata quando ci si trasforma): manca in quasi tutte le forme; ce l'hanno solo Goku (tutte le 9 forme, ora con carica e scatto a 4 frame animati), Gohan 7, Vegeta SSJ/God, Trunks SSJ (ora rimossa: da rifare), Freezer 2ª forma, Broly Leggendario, C-17, Bardock SSJ, Raditz. Mancano anche: posa di scatto di **Whis**; scia di scatto di Cabba, Raditz, Vegito, Saibaman.

## 5. Boss senza sprite (19 su 60)

- [ ] **Nappa** (`nappa`)
- [ ] **Scimmione Gigante** (`ape`)
- [ ] **Ginew** (`ginew`)
- [ ] **Zarbon** (`zarbon`)
- [ ] **Dr. Gero** (`gero`)
- [ ] **Dabura** (`dabura`)
- [ ] **Dodoria** (`dodoria`)
- [ ] **Dyspo** (`dyspo`)
- [ ] **Bergamo** (`bergamo`)
- [ ] **Basil** (`basil`)
- [ ] **Lavender** (`lavender`)
- [ ] **Mercenario Tao** (`tao`)
- [ ] **Tenshinhan** (`tenshin`)
- [ ] **Jackie Chun** (`jackie`)
- [ ] **Re Piccolo** (`kingpiccolo`)
- [ ] **Omega Shenron** (`omega`)
- [ ] **Dyspo (Velocità Suprema)** (`dyspo2`)
- [ ] **Ribrianne** (`ribrianne`)
- [ ] **Ribrianne (Magia Radiosa)** (`ribrianne2`)

Boss che usano lo sprite di un'altra forma (da sostituire con uno proprio se vuoi che cambino aspetto): 
Cooler Forma Finale (usa Cooler), Beerus Ira Divina (Beerus), Toppo Dio della Distruzione e Giustizia Suprema (Toppo), Hit Pure Progress (Hit), Jiren Piena Potenza / Oltre i Limiti / Ira Ultima (Jiren), Kale Leggendaria e Berserk (stesso sprite), Caulifla SS e SS2 (Caulifla base), Super Janemba (Janemba), Broly Leggendario (Broly full power), Cell Max (Cell perfetto), Freezer (forma 3 al posto della finale).

## 6. Nemici senza sprite (46 su 47: solo il Saibaman ce l'ha)

- [ ] **Kamikaze (corrono ed esplodono)**: Saibaman Kamikaze, Saibaman Blu, Androide Kamikaze, Majin Kamikaze
- [ ] **Umanoidi (servono fermo + camminata + attacco)**: Soldato Alieno, Tiratore, Soldato Saiyan, Soldato di Freezer, Appule, Soldato Scudiero, Brutale, Guerriero d'Elite, Cecchino, Spadaccino Lampo, Bruto Rosa, Androide, Demone, Mago Oscuro, Guerriero dell'Universo, Angelo Servitore, Assassino, Soldato Red Ribbon, Cavernicolo, Saibaman Rosso, Ninja Murasaki, Guerriero Namecciano, Lanciere Namecciano, Cannoniere di Freezer, Elite Red Ribbon, Cavernicolo Gigante, Ninja Ombra
- [ ] **Bestie**: Dinosauro, Raptor, Lupo del Deserto, Lupo Nero, Lupo Meccanico
- [ ] **Cell Jr.**: Cell Jr.
- [ ] **Droni (volano)**: Drone
- [ ] **Golem**: Corazzato, Colosso
- [ ] **Fantasmi**: Spettro
- [ ] **Gelatine**: Gelatina Rosa, Gelatina Piccola
- [ ] **Sfere**: Sfera del Vuoto
- [ ] **Uccelli**: Pterodattilo, Pterodattilo di Fuoco

## 7. Armi ed effetti (solo il Kamehameha ha lo sprite)

Per ognuna servono i frame dell'effetto (proiettile/raggio/esplosione); il Kamehameha è già fatto.

- [ ] Colpo di Ki (`ki`)
- [ ] Disco Distruttore (`disc`)
- [ ] Genkidama (`spirit`)
- [ ] Kaioken (`aura`)
- [ ] Taiyoken (`flare`)
- [ ] Spada (`slash`)
- [ ] Colpi Eccentrici (`homing`)
- [ ] Raggio Perforante (`dbeam`)
- [ ] Lancia Ribelle (`javelin`)
- [ ] Doppio Sunday (`dsunday`)
- [ ] Cannone Distruttore (`breaker`)
- [ ] Danza Elegante (`spiral`)
- [ ] Boomerang Ginyu (`boomer`)
- [ ] Granata Infernale (`hellzone`)
- [ ] Salto Temporale (`chrono`)
- [ ] Impatto Potente (`shock`)
- [ ] Sfera della Distruzione (`hakai`)
- [ ] Fulmine Angelico (`chain`)
- [ ] Meteora di Fusione (`meteor`)
- [ ] Big Bang Kamehameha (`sweep`)
- [ ] Calcio Dinamite (`dyn`)
- [ ] Raffica di Ki (`barrage`)

## 8. Animali domestici (6)

- [ ] Dende (`dende`)
- [ ] Mini Shenron (`shenron`)
- [ ] Mini Droide (`droid`)
- [ ] Bubbles (`bubbles`)
- [ ] Mini Bu (`buu`)
- [ ] Saibaman (`saibaman`)

## 9. Ostacoli dei pianeti

Le **rocce** sono già con sprite (pianure, spiaggia, rifiuti, Pianeta Vegeta, arena). Restano disegnati dal codice: alberi (pianure, spiaggia, Namecc), montagne, edifici/capsule, rovine, veicoli, colonne, nuvole, guglie. Per pianeta:

- Pianura Saiyan: albero, montagna con neve, casa-capsula
- Pianeta Namek: albero namecciano, colonna di roccia azzurra, montagna verde, astronave
- Rovine degli Androidi: auto distrutta, torre in rovina, palo/croce
- Dimensione di Bu: colonna rosa, nuvola, cupola-casa di Bu
- Torneo del Potere: pilastro cristallino, lastra, rovina
- Isola di Muten: palma, casa di Muten, corallo/conchiglia
- Pianeta Vegeta: capsula, tronco bruciato (le guglie hanno sprite)
- Arena dei Cell Game: colonna, palo, piedistallo
- Regno degli Dei: colonna bianca, nuvola, torre, tempio
- Inferno: roccia di lava, guglia di ossa, teschio

## 10. Non inclusi in questo elenco
Terreno e sfondi dei pianeti, oggetti raccoglibili (sfere, scrigni, Senzu), icone dell'interfaccia e particelle restano grafica generata dal codice.

## Già usabili dal pack ma non ancora collegati
Nel pack sul PC ci sono cartelle che il gioco non usa e che potrebbero coprire forme mancanti: Goku SSJ4, Goku SSJ Kaioken, Goku Blue Kaioken, Vegeta SSJ4 / Majin Vegeta / Vegeta Blue Full Power, Bardock SSJ4, Broly SSJ4 / Terza forma, Goku Black SSJ / Goku Black 1, Hitto 2, Gohan Possuido, Trunks Armadura, Vegito SSJ1, Zamasu fusione robotica. Dimmi quali forme vuoi e le collego.


## Emote nel menù di scelta personaggio
Solo **Goku** ha le 4 emote per forma (`emogoku[_forma].png`, ritratti 166x152). Per gli altri personaggi il menù mostra solo lo sprite: per aggiungerle basta un foglio nello stesso formato di Goku (vedi `tools/import_grid.py`).
