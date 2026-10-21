# Sicurezza

Il gioco gira tutto nel browser, quindi la sicurezza ha due parti: quello che fa **il gioco** per proteggere chi lo usa, e quello che va **configurato su Supabase** (lì stanno gli account veri). Qui sotto c'è l'elenco di entrambe.

## Cosa fa il gioco

| Misura | Dove | Cosa evita |
|---|---|---|
| **Content-Security-Policy** (meta tag) con lo script del gioco ammesso **per hash** | `build.py`, `src/index.html` | uno script o un `onclick=""` iniettato non viene eseguito; niente `unsafe-eval`, niente plugin, niente `<base>`, niente invio di form |
| `referrer: no-referrer` | `src/index.html` | l'indirizzo della pagina non finisce ad altri siti |
| **JSON sicuro** (`safeJSON`, `deepMerge`) che scarta `__proto__`, `constructor`, `prototype` | `src/js/util.js` | *prototype pollution* da salvataggi, risposte del server o dati incollati |
| **Pulizia dei salvataggi** (`sanitizeData`): numeri non finiti → 0, tetto a ±10¹⁵, testi ≤ 4000 caratteri, liste ≤ 50 000, profondità ≤ 14; il denaro è sempre un intero ≥ 0 | `src/js/util.js`, `src/js/save.js` | salvataggi manomessi o corrotti (anche dal cloud) che bloccano il gioco o gonfiano la memoria |
| Un salvataggio cloud deve essere un oggetto di dimensione ragionevole | `src/js/cloud.js` (`apply`) | dati strani dal server |
| **Sessione** accettata solo se ha `access_token` e `refresh_token` testuali | `src/js/cloud.js` | sessioni finte scritte nel `localStorage` o nell'indirizzo |
| **Login Google a prova di CSRF**: il ritorno con `access_token` senza `type` vale solo se questo dispositivo ha appena premuto il pulsante Google (flag con scadenza di 15 minuti) | `src/js/cloud.js` (`start`, `google`) | un link truccato che ti collegherebbe all'account di un altro, così i tuoi progressi finirebbero lì |
| **Password**: ≥ 8 caratteri, non un solo carattere ripetuto, non l'email, non una password famosa (`Cloud.weakPw`) | `src/js/cloud.js`, `src/js/ui_account.js` | password banali alla registrazione e al reset |
| **Blocco di un minuto** dopo 5 password sbagliate in 5 minuti (contatore nel browser, sopravvive al ricaricamento) | `src/js/cloud.js` (`signIn`) | tentativi a raffica dal gioco. Il limite vero sta nel server (vedi sotto) |
| L'indirizzo del progetto Supabase deve essere **https** (solo `localhost` può essere `http`) | `src/js/cloud.js` (`urlOk`) | password o token spediti in chiaro |
| Testo degli errori nell'indirizzo (`#error_description=`) tagliato a 200 caratteri e mostrato come testo semplice | `src/js/cloud.js` | messaggi truccati da un link |
| `h()` non accetta più `innerHTML` | `src/js/ui.js` | nessun punto del menu può inserire HTML da dati esterni |

La chiave pubblica (*anon*) di Supabase nel gioco è fatta per essere pubblica. **Non usare mai** la chiave `service_role` / `secret`: dà accesso a tutto.

La CSP è attiva nella versione pubblicata sul sito (`DBS_AUDIO=link`, quella del workflow di GitHub Pages). La versione "tutto in un file" (`DBS_AUDIO=embed`) non la ha, perché chi la ospita (per esempio una pagina di anteprima) aggiunge script propri che una regola della pagina bloccherebbe. Si può forzare con `DBS_CSP=1` o togliere con `DBS_CSP=0`.

## Cosa configurare su Supabase

1. **Row Level Security** attiva su `public.saves` e ogni account può leggere/scrivere solo la propria riga: lo fa `supabase/schema.sql` (rieseguirlo è sicuro, aggiunge anche il controllo «il salvataggio è un oggetto»).
2. **Authentication → Providers → Email** (o *Sign In / Providers*, a seconda della versione del pannello): lunghezza minima della password a 8 o più e *Confirm email* attivo.
3. **Authentication → Rate Limits**: lascia i limiti predefiniti (o più bassi) per accessi e invio email: sono quelli che fermano davvero un attacco, il blocco del gioco può essere aggirato da chi non usa il gioco.
4. **Authentication → URL Configuration**: *Site URL* = l'indirizzo del gioco; in *Redirect URLs* solo gli indirizzi tuoi (niente `*` su domini che non controlli).
5. **Email**: se tieni *Confirm email* acceso o attivi `SUPABASE_RESET=1` serve un **SMTP tuo** (vedi `docs/SUPABASE.md`): il servizio di prova invia solo ai membri del team. In alternativa spegni *Confirm email* e lascia il recupero password spento (configurazione minima: «Password dimenticata?» mostra solo un avviso).
6. Se qualcuno scrive nel database in modo anomalo, controlla *Logs → Auth* e *Database → Logs*.

## Cosa non c'è (e perché)

Il gioco è a un giocatore e i punteggi non sono pubblici: non c'è una classifica da proteggere dai trucchi, quindi un salvataggio modificato a mano riguarda solo chi lo fa. Per questo il controllo sui salvataggi serve a non far **rompere** il gioco, non a impedire di barare.

## Test

`node tests/security.js` (salvataggio avvelenato, JSON sicuro, CSP con una partita avviata e script iniettato che non deve partire) e `node tests/cloud_e2e.js` (password, blocco, ritorno da Google non avviato qui). Tutti i test: `python3 tools/run_tests.py -j 3`.
