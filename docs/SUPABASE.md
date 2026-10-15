# Login e salvataggi cloud con Supabase

Il gioco resta **un solo file HTML statico** (ospitato su GitHub Pages). Per il login e i salvataggi per account parla direttamente con Supabase dal browser, senza server tuo. Se non configuri nulla, il pulsante **Account** non compare e il gioco salva solo sul dispositivo, come prima.

## Come funziona
- **Ospite**: si gioca subito, i progressi stanno nel `localStorage` del browser.
- **Con account**: email + password (e Google, opzionale). Ogni modifica ai progressi viene caricata nel cloud dopo ~4 secondi (e quando chiudi/nascondi la scheda). Al login i progressi si scaricano su qualsiasi dispositivo.
- **Cosa viene salvato nel cloud**: zenny, personaggi sbloccati, negozio, imprese, statistiche, record, ecc. **Non** le impostazioni di questo dispositivo (volume, risoluzione, tasti, lingua).
- **Primo accesso con progressi già presenti** su dispositivo e nel cloud: il gioco chiede quale salvataggio usare (l'altro viene sovrascritto).
- **Esci**: dopo aver caricato le ultime modifiche, svuota i progressi locali di quel dispositivo (restano nel cloud), così su un PC condiviso la persona dopo parte da zero. Se sei offline e ci sono modifiche non caricate, i dati locali NON vengono cancellati.
- Sicurezza: la tabella `saves` ha le regole **Row Level Security**: ogni account legge e scrive solo la propria riga. La chiave "anon/publishable" è pubblica per progettazione e può stare nel codice.

## Configurazione (una volta sola, ~10 minuti)

### 1. Crea il progetto Supabase
1. Registrati su <https://supabase.com> (piano Free) → **New project** (scegli una regione europea, imposta una password del database e conservala).
2. Quando è pronto vai in **SQL Editor → New query**, incolla tutto il contenuto di [`supabase/schema.sql`](../supabase/schema.sql) e premi **Run**. Crea la tabella `saves` con le regole di sicurezza.

### 2. Prendi URL e chiave
**Project Settings → API** (o *API Keys*): copia
- **Project URL** (`https://xxxx.supabase.co`)
- la chiave pubblica **anon** (JWT lunga) oppure **publishable** (`sb_publishable_...`).

**Non** usare mai la chiave `service_role` / `secret`: è privata e non va nel gioco.

### 3. Dai gli URL del sito a Supabase
**Authentication → URL Configuration**:
- **Site URL**: l'indirizzo del gioco, es. `https://TUO-UTENTE.github.io/dragon-ball-survivors/`
- **Redirect URLs**: aggiungi lo stesso indirizzo (e `http://localhost:8000/` se provi in locale).

Senza questo, i link nelle email (conferma, reset password) e il login Google rimandano all'indirizzo sbagliato.

### 4. Email di conferma
In **Authentication → Providers → Email** puoi tenere **Confirm email** attivo (consigliato: l'utente riceve un link) oppure disattivarlo (si entra subito dopo la registrazione). Con le email integrate di Supabase il limite è basso (poche email l'ora): per un gioco con tanti utenti conviene configurare un SMTP tuo (**Authentication → SMTP Settings**, es. Resend/Brevo, hanno piani gratuiti) oppure disattivare la conferma.

### 5. Collega il gioco
Hai due modi, scegline uno:

**A) Variabili del repository GitHub (consigliato).** Nel repo: **Settings → Secrets and variables → Actions → tab Variables → New repository variable**:

| Nome | Valore |
|---|---|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | chiave anon/publishable |
| `SUPABASE_GOOGLE` | `1` solo se hai attivato Google (vedi sotto), altrimenti non crearla |

Poi rilancia il deploy (**Actions → Deploy → Run workflow**, o un push).

**B) File nel repo.** Copia `cloud.config.example.json` in `cloud.config.json`, compila `url` e `key` e fai commit. (I valori sono pubblici, va bene committarli.)

In locale: `SUPABASE_URL=... SUPABASE_ANON_KEY=... python3 build.py` oppure il file `cloud.config.json`; poi apri `dist/dragon-ball-survivors.html` da un piccolo server (`python3 -m http.server -d dist`), perché il login Google richiede un indirizzo http(s).

### 6. (Opzionale) Login con Google
1. In Google Cloud Console crea un **OAuth Client ID** di tipo *Web application*; come *Authorized redirect URI* metti quello mostrato in Supabase (**Authentication → Providers → Google**, `https://xxxx.supabase.co/auth/v1/callback`).
2. Incolla Client ID e Secret in Supabase, attiva il provider Google.
3. Imposta `SUPABASE_GOOGLE=1` (o `"google": true` nel file) e ricompila.

## Limiti da conoscere
- **Piano Free**: il progetto va in pausa dopo ~1 settimana senza attività (si riattiva dal pannello) e ha limiti su utenti e spazio; verifica i valori attuali su <https://supabase.com/pricing>. Un salvataggio pesa pochi KB.
- **Anti-cheat**: il gioco gira nel browser, quindi un giocatore esperto può modificare il proprio salvataggio. Va bene per un gioco personale; classifiche competitive richiederebbero controlli lato server.
- **Più dispositivi insieme**: vince l'ultimo salvataggio (per data). Non si fondono due partite giocate in parallelo su dispositivi diversi.
- **Eliminazione account**: per ora si cancella dal pannello Supabase (**Authentication → Users**); i dati nella tabella `saves` spariscono con l'utente (`on delete cascade`).

## Test
`tests/mock_supabase.js` simula Supabase in memoria; `tests/cloud_e2e.js` prova registrazione, login, refresh del token, sincronizzazione, conflitto, logout e modalità offline:

```bash
SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=testkey DBS_OUT=/tmp/o/cloud.html python3 build.py
node tests/cloud_e2e.js
```
