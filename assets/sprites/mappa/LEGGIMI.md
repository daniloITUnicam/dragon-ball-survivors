# Oggetti della mappa: sprite da migliorare

Questi PNG sono segnaposto disegnati dal codice (`tools/gen_mapobj.py`). Sostituiscili con la versione buona tenendo **lo stesso nome file** e rifai la build: il gioco li prende da solo.

**Stato (v137):** 16 su 18 sono già quelli definitivi (ritagliati dal fondo magenta con `tools/key_mapobj.py` + `tools/key_mapobj_fix.py`). Mancano ancora **actscouter.png** e **actdig.png**.

## Regole (valgono per tutti)

- **Una riga di fotogrammi** affiancati, tutti larghi uguale. Il numero di fotogrammi è nella tabella (e in `assets/sprites/sprites.json`, chiave `cols`): se ne cambi il numero, cambia anche `cols`.
- **Sfondo trasparente.** Niente ombra a terra: l'ombra la disegna il gioco.
- L'oggetto **poggia sul bordo inferiore** del fotogramma. Tutti i fotogrammi di un file condividono la stessa linea del terreno (il gioco li disegna con lo stesso spostamento del fotogramma 0).
- **Risoluzione libera.** Il gioco misura la parte non trasparente del fotogramma 0 e la scala all'altezza in gioco della tabella, quindi puoi consegnare 256 px o 512 px per fotogramma. Il margine trasparente non conta.
- Vista **frontale leggermente dall'alto**, come gli altari e i forzieri. Contorno scuro di 1–2 px.
- Il gioco specchia a caso gli oggetti da rompere, quindi la luce deve funzionare anche specchiata.

## Oggetti da rompere: `brk<tipo>.png`, 3 fotogrammi

I tre fotogrammi sono: **intero | danneggiato (sotto metà vita) | macerie** (le macerie restano a terra 2,5 s e poi svaniscono).

| File | Cosa | Altezza in gioco | Pianeti |
|---|---|---|---|
| `brkbush.png` | cespuglio con bacche | 46 | Pianura, Isola di Muten, Regno degli Dei, Namek |
| `brkcrate.png` | cassa Capsule Corp | 44 | quasi tutti |
| `brkbarrel.png` | barile rosso | 46 | Isola, Rovine, Pianeta Vegeta, Arena |
| `brkrock.png` | masso incrinato | 40 | Pianura, Rovine, Pianeta Vegeta, Inferno |
| `brkamphora.png` | anfora di terracotta | 44 | Isola, Regno degli Dei, Via del Serpente, Dimensione di Bu |
| `brkcrystal.png` | cristallo blu | 52 | Namek, Torneo del Potere, Dimensione di Bu |
| `brkscrap.png` | rottame di androide | 40 | Rovine, Arena |
| `brktomb.png` | lapide | 50 | Inferno |
| `brklantern.png` | lanterna di pietra | 56 | Inferno, Regno degli Dei, Via del Serpente |
| `brkpod.png` | baccello di Saibaman (nel nido) | 38 | nido di Saibaman |
| `brksupply.png` | cassa grande dei rifornimenti | 62 | rifornimenti col paracadute |

## Attività: `act<nome>.png`

| File | Fotogrammi | Altezza in gioco | Note |
|---|---|---|---|
| `actchute.png` | 2: paracadute aperto con le corde (la cassa pende sotto il punto in basso al centro) / telo afflosciato a terra | 64 | il fotogramma 1 è disegnato piccolo accanto alla cassa |
| `actnest.png` | 1: buca di terra smossa vista dall'alto | 30 | ci stanno sopra i 4 baccelli |
| `actnimbus.png` | 4: Nuvola d'oro che si gonfia leggermente (ciclo) | 30 | gira a 6–8 fotogrammi al secondo |
| `actsenzu.png` | 4: pianta con 3, 2, 1, 0 fagioli (l'ultimo appassito) | 50 | |
| `actgravity.png` | 2: Camera Gravitazionale spenta / accesa (luci rosse) | 58 | esce da una nuvola di fumo di capsula |
| `actscouter.png` | 2: scouter a terra, lente spenta / accesa (lampeggia) | 16 | |
| `actdig.png` | 2: cumulo di terra con la X / buca scavata | 22 | |

Le animazioni di comparsa (colonna di fumo, caduta, rimbalzo, bagliori, anelli, scintille) le fa il codice: negli sprite servono solo gli oggetti.

## Prompt per Gemini

Usa questo prompt, sostituendo la riga **OGGETTO** con quella della lista sotto. Chiedi un'immagine per volta e uniscile in una riga, oppure chiedi direttamente la striscia.

```
Pixel-art sprite sheet for a 2D top-down action game in the style of Dragon Ball (bright anime colours, chunky pixels, clean 1-2 px dark outline, no anti-aliasing, no blur).
One horizontal strip of N frames of the same object, equally spaced, all the same size, the object standing on the bottom edge of each frame, seen from the front and slightly from above.
OBJECT: <descrizione>
Transparent background (or one flat pure magenta #FF00FF background edge to edge). No ground, no cast shadow, no text, no logo, no frame borders.
```

- **brkbush** (N=3): `a round leafy green bush with a few red berries | the same bush half torn apart, broken twigs showing | a few leaves and two snapped twigs lying on the ground`
- **brkcrate** (N=3): `a small white and light-grey futuristic Capsule Corporation supply crate with a blue band | the same crate cracked and dented, lid ajar | broken white panels and a blue strip scattered flat on the ground`
- **brkbarrel** (N=3): `a red metal barrel with dark bands and a white stripe | the same barrel dented with a hole | broken red staves in a small dark-red puddle`
- **brkrock** (N=3): `a grey boulder with a crack | the same boulder with a big chunk broken off | a pile of rubble`
- **brkamphora** (N=3): `a terracotta amphora with two handles and a dark painted band | the same amphora cracked with a chipped rim | terracotta shards`
- **brkcrystal** (N=3): `a cluster of three glowing blue crystal prisms on a small rock | the same cluster with the tallest prism snapped | blue crystal shards on the rock base`
- **brkscrap** (N=3): `a pile of android scrap: a dented metal robot head with a red eye and a bent antenna | the same pile sparking, the eye dim | scattered bolts and metal plates`
- **brktomb** (N=3): `a grey rounded gravestone with a carved cross and moss, on a stone slab | the same gravestone cracked and tilted | broken stone pieces on the slab`
- **brklantern** (N=3): `a Japanese stone lantern (toro) with a glowing warm window | the same lantern with the roof knocked askew, light flickering | a heap of lantern stones`
- **brkpod** (N=3): `a green Saibaman seed pod half buried in a dirt mound, with darker veins | the same pod with glowing yellow-green cracks | the pod split open, empty shell halves and green goo`
- **brksupply** (N=3): `a large white futuristic Capsule Corporation supply crate with blue bands, grey straps and yellow-black hazard stripes at the bottom | the same crate cracked and dented | the crate burst open, empty`
- **actchute** (N=2): `a white and blue striped parachute canopy with cords converging to one point at the bottom centre | the same parachute collapsed as a crumpled cloth lying on the ground`
- **actnest** (N=1): `a shallow pit of freshly dug brown earth seen from above, with cracks and a few green slime spots`
- **actnimbus** (N=4): `the golden Flying Nimbus cloud (Kinto'un), fluffy, bright yellow-gold with orange shading, gently puffing between frames`
- **actsenzu** (N=4): `a small bushy Senzu bean plant with a thin trunk and three small green beans hanging | the same plant with two beans | with one bean | with no beans, leaves drooping and yellowing`
- **actgravity** (N=2): `a round white Capsule Corporation gravity training room: a dome on short legs with a blue band, round windows and a small door, lights off | the same dome with the windows and the top light glowing red`
- **actscouter** (N=2): `a Saiyan scouter lying on the ground on its side: grey earpiece and a green glass lens | the same with the lens glowing bright green and a small glint`
- **actdig** (N=2): `a small mound of brown earth marked with a red X | the same spot dug out: a dark hole with dirt piled around`

Quando me li mandi li ritaglio, li porto alla misura giusta e controllo in gioco che poggino bene a terra.
