# Sprite consigliati per armi e abilità (v56)

Oggi **tutti gli effetti** di armi e abilità sono disegnati dal codice (sfere, raggi, anelli, aure); l'unico effetto che usa uno sprite importato è il **raggio del Kamehameha** (`assets/sprites/fxkame.png`: sfogo | corpo sottile | testa a bulbo, colorato per arma). Questa guida dice **quali sprite darebbero il salto di qualità maggiore** e in che formato consegnarli. Quando ne carichi uno, basta dirmi il nome del file: lo collego io (come per `fxkame`).

## Formato (vale per tutti)
- **PNG con trasparenza**, pixel art con contorno scuro di 1 px (stesso stile dei personaggi), luce dall'alto a sinistra.
- **Proiettili e raggi guardano a destra (+x)**; il gioco li ruota e li specchia.
- Animazioni = **strip orizzontale** (frame affiancati, tutti della stessa dimensione). Indica solo quanti frame sono.
- Colori **chiari/quasi bianchi al centro e tinta neutra**: il gioco ricolora l'effetto col colore dell'arma/personaggio (come con `fxkame`), così un solo sprite serve a più armi.
- Nome file: `fx_<nome>.png` in `assets/sprites/` (es. `fx_disc.png`).

## Priorità 1 — usati da molte armi/abilità
| File | Cosa | Dimensione · frame | Usato da |
|---|---|---|---|
| `fx_ball.png` | sfera di ki con alone e scia | 24×24 · 4 | Colpo di Ki, Colpi Eccentrici, Doppio Sunday, Raggio Perforante |
| `fx_beam.png` | **kit raggio**: sfogo \| corpo \| testa (come `fxkame`), versione "sottile" e "larga" | 175×83 · 1 | Final Flash (Vegeta), Raggio Mortale (Frost), Cannone Oculare (C-16), Lama Spirituale (Vegito), Raggio Puro (Uub) |
| `fx_nova.png` | onda d'urto/esplosione che si espande, anello + raggi | 192×192 · 8 | Supernova (Freezer, Cooler), Esplosione Saiyan (Nappa), Onda Saiyan (Caulifla), Onda Demoniaca (Dabura) |
| `fx_dome.png` | cupola/barriera a esagoni semitrasparente | 128×128 · 4 | Barriera Energetica (C-18), Barriera Perfetta (C-17), Posa Ginyu, Scudo del Genio (Popo) |
| `fx_dash.png` | scia di velocità + sagoma sbiadita (afterimage) | 96×32 · 4 | Pugno Zanna di Lupo, Scatto Fulmineo, Pugno Inarrestabile, Velocità Suprema, Calcio Recoome, Calcio Volante, Lama di Ki |
| `fx_heal.png` | scintille verdi a croce che salgono | 48×64 · 6 | Rigenerazione Elastica (Bu), Energia Infinita (Gero), Scorta di Senzu, Rigenerazione Demoniaca |

## Priorità 2 — armi con un'identità forte
| File | Cosa | Dimensione · frame | Arma |
|---|---|---|---|
| `fx_disc.png` | disco di energia con bordo seghettato che ruota | 40×40 · 4 | Disco Distruttore |
| `fx_genki.png` | **sfera gigante** con vortice interno + frame di carica (sfera piccola che cresce) | 160×160 · 6 | Genkidama |
| `fx_hakai.png` | sfera viola-nera con crepe luminose e piccoli frammenti | 72×72 · 6 | Sfera della Distruzione, Hakai (Beerus) |
| `fx_dark.png` | sfera oscura con nucleo nero e alone viola | 56×56 · 6 | **Sfera della Giustizia di Toppo** (richiesta) |
| `fx_slash.png` | arco di taglio a mezzaluna, 3 frame di dissolvenza | 96×64 · 3 | Spada, Fendente Furioso, Lama di Giudizio |
| `fx_flare.png` | lampo accecante a stella con anelli | 128×128 · 6 | Taiyoken |
| `fx_hz.png` | **Granata Infernale**: sfera verde luminosa + anello di aggancio che si stringe | 32×32 · 4 | Granata Infernale (richiesta) |
| `fx_sbc.png` | **Cannone Speciale**: raggio a spirale (trivella) giallo-bianco | 175×64 · 1 (kit raggio) | Cannone Speciale di Piccolo (richiesta) |
| `fx_boomer.png` | boomerang di ki a mezzaluna che ruota | 40×40 · 4 | Boomerang Ginyu |
| `fx_lance.png` | lancia di luce con punta e scia | 96×24 · 2 | Lancia Ribelle |
| `fx_bolt.png` | 3 varianti di segmento di fulmine | 64×32 · 3 | Fulmine Angelico |
| `fx_meteor.png` | meteora infuocata con coda | 80×80 · 4 | Meteora di Fusione |
| `fx_kick.png` | impatto del calcio + onda a "X" | 80×80 · 5 | Calcio Dinamite |
| `fx_shock.png` | onda d'urto circolare con crepe a terra | 160×80 · 8 | Impatto Potente |
| `fx_aura.png` | fiamma d'aura che avvolge il corpo (sovrapposta al personaggio) | 48×64 · 6 | Aura (ex Kaioken), Kaioken, Potenziale Nascosto, Furia Incontrollata |

## Priorità 3 — abilità uniche particolari
| File | Cosa | Dimensione · frame | Abilità |
|---|---|---|---|
| `fx_absorb.png` | spirale/coda che risucchia, con puntini che entrano | 96×96 · 6 | Assorbimento (Cell), Appetito Insaziabile (C-21), Frutto dell'Albero (Turles) |
| `fx_clock.png` | orologio/anello temporale che si ferma, lancette | 128×128 · 8 | Salto Temporale (Hit), Fermatempo (Guldo) |
| `fx_rewind.png` | spirale al contrario con frecce, tinta azzurra | 128×128 · 8 | Riavvolgimento (Whis) |
| `fx_erase.png` | sfera che cancella: contorno che si disintegra in quadratini | 96×96 · 8 | Hakai (Beerus), Cancellazione (Zeno), Giudizio Divino |
| `fx_ghost.png` | fantasmino sorridente (Gotenks) di fronte e di lato | 32×40 · 4 | Fantasmi Kamikaze |
| `fx_buff.png` | anello + frecce che salgono (potenziamento) | 64×64 · 6 | Rivolta Saiyan, Mostro Zarbon, Sangue Saiyan, Fusione Furiosa |
| `fx_sparkle.png` | monete/stelle di fortuna | 48×48 · 6 | Colpo di Fortuna, Invenzione Geniale |

## Cosa farebbe più differenza (se ne puoi fare pochi)
1. **fx_ball** + **fx_beam** + **fx_nova** + **fx_dash**: coprono ~25 tra armi e abilità.
2. **fx_genki**, **fx_hakai**, **fx_disc**, **fx_aura**: le armi più riconoscibili.
3. **fx_dark**, **fx_hz**, **fx_sbc**: i tre effetti nuovi che hai già chiesto (Toppo, Granata Infernale, Piccolo).

Riferimenti per lo stile: gli sprite d'attacco di *Dragon Ball Z: Buu's Fury / Supersonic Warriors* (GBA) per sfere e raggi, *Dragon Ball FighterZ* per gli effetti d'aura, il tuo `fxkame.png` come misura di dettaglio.
