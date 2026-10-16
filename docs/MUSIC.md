# Musica

Metti i brani in `assets/` (`.mp3`, `.ogg`, `.m4a`, `.wav`): il nome del file decide dove suonano. Nessuna configurazione.

| Nome del file (anche con maiuscole o trattini) | Dove suona |
|---|---|
| `menu` | menu principale |
| `saiyan plains`, `plains` | Pianura Saiyan |
| `namek` | Pianeta Namek |
| `android ruins`, `ruins` | Rovine degli Androidi |
| `buu dimension`, `dimension` | Dimensione di Bu |
| `tournament of power`, `tournament` | Torneo del Potere |
| `muten island`, `roshi island`, `kame house` | Isola di Muten |
| `planet vegeta`, `vegeta` | Pianeta Vegeta |
| `cell games`, `cell game` | Arena dei Cell Game |
| `realm of the gods`, `gods` | Regno degli Dei |
| `hell`, `inferno` | Inferno |

Si usa il nome più lungo contenuto nel nome del file (anche in italiano: `isola di muten.mp3`, `pianeta namek.mp3`…). Gli alias sono in `STAGE_KEYS` in `build.py`. I file che non corrispondono a nulla vengono segnalati e ignorati. Le fasi con boss usano ancora la musica sintetizzata e, finito il boss, il brano della mappa riparte da dove era.

**Effetti sonori da file.** `assets/sphere_sound.mp3` non è musica: è il suono di raccolta delle Sfere del Drago (viene saltato dal riconoscimento dei brani). Con `DBS_AUDIO=embed` è incorporato nell'HTML, con `link` resta in `assets/` (il workflow copia tutti gli `.mp3`). Se manca, il gioco usa il vecchio jingle sintetico. Altri effetti da file si aggiungono in `SFX_FILES` (`build.py`) e `FILE_SFX` (`audio.js`).

**Loop.** Ogni brano si ripete all'infinito con una dissolvenza incrociata di ~3 secondi fra la fine e l'inizio (due elementi audio si sovrappongono), quindi senza buchi né click anche se il file non è fatto per il loop. Cambiando mappa il brano precedente sfuma e, se si torna, riprende dal punto in cui era.

**Dimensione.** Per default i brani sono incorporati nell'HTML (`python3 build.py`): file unico, ma pesante. Opzioni di `build.py` (variabili d'ambiente):
- `DBS_AUDIO=link`: niente base64, il gioco carica `assets/<file>` accanto a `index.html` (qualità piena, pagina leggera). Lo usa il deploy su GitHub Pages, che copia i file audio nel sito.
- `DBS_AUDIO_BUDGET_MB=<n>`: se i brani superano n MB li ricodifica con `ffmpeg` (mp3, bitrate calcolato per stare nel budget, minimo 40 kbps). Serve per i servizi che limitano il peso del singolo HTML (es. 16 MB).
