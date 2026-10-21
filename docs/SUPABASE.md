# Login e salvataggi cloud con Supabase

Il gioco resta **un solo file HTML statico** (ospitato su GitHub Pages). Per il login e i salvataggi per account parla direttamente con Supabase dal browser, senza server tuo. Se non configuri nulla, il pulsante **Account** non compare e il gioco salva solo sul dispositivo, come prima.

## Come funziona
- **Ospite**: si gioca subito, i progressi stanno nel `localStorage` del browser.
- **Con account**: email + password, oppure **Google**. Ogni modifica ai progressi viene caricata nel cloud dopo ~4 secondi (e quando chiudi/nascondi la scheda). Al login i progressi si scaricano su qualsiasi dispositivo.
- **Password dimenticata**: **spenta di serie**. Il pulsante «Password dimenticata?» c'è, ma passandoci sopra (o toccandolo) mostra un avviso: il recupero non è disponibile, bisogna creare un nuovo account o entrare con Google; il modulo di registrazione lo ricorda. Non parte nessuna email (i progressi del dispositivo restano lì). Si può accendere con `SUPABASE_RESET=1` (vedi «Reset password» sotto): serve però un SMTP tuo e il modello email.
- **Cosa viene salvato nel cloud**: zenny, personaggi sbloccati, negozio, imprese, statistiche, record, ecc. **Non** le impostazioni di questo dispositivo (volume, risoluzione, tasti, lingua).
- **Primo accesso con progressi già presenti** su dispositivo e nel cloud: il gioco chiede quale salvataggio usare (l'altro viene sovrascritto).
- **Esci**: dopo aver caricato le ultime modifiche, svuota i progressi locali di quel dispositivo (restano nel cloud), così su un PC condiviso la persona dopo parte da zero. Se sei offline e ci sono modifiche non caricate, i dati locali NON vengono cancellati.
- Sicurezza: la tabella `saves` ha le regole **Row Level Security**: ogni account legge e scrive solo la propria riga. La chiave "anon/publishable" è pubblica per progettazione e può stare nel codice.

## Configurazione minima, senza email (consigliata se non vuoi toccare altro)
1. Crea il progetto, esegui `supabase/schema.sql` e metti `SUPABASE_URL` / `SUPABASE_ANON_KEY` (passi 1, 2 e 5 qui sotto).
2. **Authentication → Providers → Email → Confirm email: spegni.** Così la registrazione entra subito, senza email di conferma, e **non serve nessun SMTP**.
3. Non fare altro: niente Site URL da cambiare, niente modello «Reset Password». «Password dimenticata?» mostra solo l'avviso. Il pulsante «Continua con Google» c'è sempre; finché il provider non è attivo su Supabase (passo 6) spiega che Google non è ancora attivo.

Contro: gli indirizzi non vengono verificati (chiunque può registrare un'email non sua) e una password persa non si recupera. Per un gioco senza classifica pubblica va bene; se un giorno servono, segui i passi 3, 4 e 6.

## Configurazione completa (una volta sola, ~10 minuti)

### 1. Crea il progetto Supabase
1. Registrati su <https://supabase.com> (piano Free) → **New project** (scegli una regione europea, imposta una password del database e conservala).
2. Quando è pronto vai in **SQL Editor → New query**, incolla tutto il contenuto di [`supabase/schema.sql`](../supabase/schema.sql) e premi **Run**. Crea la tabella `saves` con le regole di sicurezza.

### 2. Prendi URL e chiave
**Project Settings → API** (o *API Keys*): copia
- **Project URL** (`https://xxxx.supabase.co`)
- la chiave pubblica **anon** (JWT lunga) oppure **publishable** (`sb_publishable_...`).

**Non** usare mai la chiave `service_role` / `secret`: è privata e non va nel gioco.

### 3. Dai gli URL del sito a Supabase  ← **la causa del link che finisce su `localhost:3000`**
**Authentication → URL Configuration**:
- **Site URL**: l'indirizzo del gioco, es. `https://TUO-UTENTE.github.io/dragon-ball-survivors/` (**non** lasciare `http://localhost:3000`, che è il valore di partenza).
- **Redirect URLs**: aggiungi lo stesso indirizzo, e `http://localhost:8000/` se provi in locale (puoi usare un carattere jolly: `https://TUO-UTENTE.github.io/**`).

Senza questo i link nelle email (conferma, reset password) e il login Google rimandano all'indirizzo sbagliato (`localhost:3000`).

### 4. Email: conferma e reset password
In **Authentication → Providers → Email** puoi tenere **Confirm email** attivo (consigliato: l'utente riceve un link) oppure disattivarlo (si entra subito dopo la registrazione). Con le email integrate di Supabase il limite è basso (poche email l'ora): per un gioco con tanti utenti conviene configurare un SMTP tuo (**Authentication → SMTP Settings**, es. Resend/Brevo, hanno piani gratuiti) oppure disattivare la conferma.

#### SMTP tuo (obbligatorio per i giocatori veri)
Se in **Authentication → Emails → SMTP Settings** vedi «Set up SMTP», significa che stai usando il servizio di prova di Supabase: invia **solo agli indirizzi del team del progetto** e al massimo **2 email all'ora**. Chi si registra con un altro indirizzo non riceve né la conferma né il reset. Va quindi attivato un SMTP tuo (**Enable custom SMTP**):

| Servizio | Host | Porta | Username / Password | Limite gratuito |
|---|---|---|---|---|
| **Gmail** (il più rapido) | `smtp.gmail.com` | `465` | il tuo indirizzo Gmail / una **Password per le app** (serve la verifica in due passaggi; myaccount.google.com → Sicurezza) | ~500 al giorno |
| **Brevo** | `smtp-relay.brevo.com` | `587` | login e chiave SMTP dalla pagina *SMTP & API* | 300 al giorno |
| Resend / Postmark / SES | vedi il loro pannello | | | dipende dal piano (spesso serve un dominio tuo) |

*Sender email* = l'indirizzo che hai verificato (con Gmail, lo stesso Gmail), *Sender name* = `Dragon Ball: Survivors`. Dopo il salvataggio il limite predefinito è 30 email all'ora: si regola in **Authentication → Rate Limits**.

#### Reset password: il codice nell'email (facoltativo: `SUPABASE_RESET=1`)
Per mostrare «Password dimenticata?» aggiungi la variabile `SUPABASE_RESET` = `1` (stessa pagina delle altre: *Settings → Secrets and variables → Actions → Variables*; in locale `"reset": true` in `cloud.config.json`) e fai il deploy. Prima configura SMTP e modello qui sotto, altrimenti il codice non arriva.

Il link «reimposta la password» è **monouso**: se il programma di posta (Gmail, Outlook, antivirus) lo apre per controllarlo, quando clicchi tu trovi `error_code=otp_expired` («Email link is invalid or has expired»). Per questo il gioco accetta anche il **codice** scritto nell'email, che nessuno scanner può consumare e che non dipende da nessun indirizzo di reindirizzamento.

1. **Authentication → Emails → Templates → Reset Password** (in alcune versioni: *Email Templates*).
2. Sostituisci il corpo con questo (oggetto a piacere, es. `Reimposta la password di Dragon Ball: Survivors`):

```html
<h2>Reimposta la password</h2>
<p>Il tuo codice di verifica è:</p>
<p style="font-size:26px;letter-spacing:4px"><b>{{ .Token }}</b></p>
<p>Nel gioco apri <b>Account → Password dimenticata?</b>, scrivi l'email, inserisci il codice e scegli la nuova password. Il codice vale poco tempo e si usa una volta sola.</p>
<p>Se preferisci puoi aprire il link: <a href="{{ .ConfirmationURL }}">reimposta la password</a></p>
```

3. (Facoltativo) **Authentication → Providers → Email**: *Email OTP Length* (6 va bene) e *Email OTP Expiration* (es. 3600 s).

Se non modifichi il template, l'email contiene solo il link: il gioco funziona lo stesso (il link porta alla schermata «nuova password»), ma può dare l'errore di cui sopra; in quel caso mostra un messaggio e apre direttamente il modulo per chiedere un nuovo codice.
Limite di Supabase: una email di reset al minuto per indirizzo (il gioco lo spiega con un conto alla rovescia).

### 5. Collega il gioco
Hai due modi, scegline uno:

**A) Variabili del repository GitHub (consigliato).** Nel repo: **Settings → Secrets and variables → Actions → tab Variables → New repository variable**:

| Nome | Valore |
|---|---|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_ANON_KEY` | chiave anon/publishable |
| `SUPABASE_GOOGLE` | facoltativa (dalla v57 il pulsante Google compare da solo quando il provider è attivo su Supabase) |
| `SUPABASE_RESET` | facoltativa: `1` mostra «Password dimenticata?» (richiede SMTP + modello email, vedi sopra). Spenta di serie |

Poi rilancia il deploy (**Actions → Deploy → Run workflow**, o un push).

**B) File nel repo.** Copia `cloud.config.example.json` in `cloud.config.json`, compila `url` e `key` e fai commit. (I valori sono pubblici, va bene committarli.)

In locale: `SUPABASE_URL=... SUPABASE_ANON_KEY=... python3 build.py` oppure il file `cloud.config.json`; poi apri `dist/dragon-ball-survivors.html` da un piccolo server (`python3 -m http.server -d dist`), perché il login Google richiede un indirizzo http(s).

### 6. Login con Google (account Gmail)
Dalla v57 **non serve più impostare `SUPABASE_GOOGLE`**: il gioco legge da Supabase se il provider è attivo e mostra da solo il pulsante «Continua con Google» (con «oppure» sopra) nelle schermate di accesso e registrazione.

1. **Google Cloud Console** (<https://console.cloud.google.com>) → crea un progetto → **APIs & Services → OAuth consent screen** (tipo *External*, nome app, email di contatto; aggiungi il tuo account come *Test user* finché l'app non è pubblicata) → **Credentials → Create credentials → OAuth client ID** di tipo *Web application*.
2. **Authorized redirect URIs**: quello mostrato in Supabase (**Authentication → Providers → Google**), `https://xxxx.supabase.co/auth/v1/callback`. Gli *Authorized JavaScript origins* sono facoltativi (puoi mettere l'indirizzo del gioco).
3. Copia **Client ID** e **Client secret** in Supabase (**Authentication → Providers → Google**), attiva il provider e salva.
4. Controlla che **Site URL** e **Redirect URLs** (punto 3) contengano l'indirizzo del gioco: dopo l'accesso Google si torna lì.

Come funziona nel gioco: si apre Google, si sceglie l'account e si torna al gioco già connessi. Se la pagina è dentro un frame (anteprima incorporata, dove Google rifiuta di aprirsi) il gioco usa una **finestra popup** e la scheda principale si connette da sola quando la finestra si chiude. Un account creato con Google e uno creato con email e password con **lo stesso indirizzo** vengono uniti da Supabase (stesso utente) se l'email è verificata.
Limite: nell'anteprima dei messaggi/artifact l'indirizzo della pagina non è un indirizzo `https` usabile come ritorno: lì usa email e password, oppure apri il gioco dal tuo sito.

## Modalità test (solo per te e per chi autorizzi)

La modalità test (Impostazioni > Generale) e la voce «Dati di gioco» esistono solo per il tuo account e per quelli in lista. Il tuo indirizzo e la lista fissa **non stanno nel repository**: build.py li legge da `tester.config.json` (nella `.gitignore`; copia `tester.config.example.json`) oppure dalle variabili d'ambiente `TEST_OWNER` e `TEST_LIST` (indirizzi separati da virgola; su GitHub: Settings > Secrets, da passare al passo di build in `deploy.yml` come per `SUPABASE_URL`). Nella pagina finisce solo un'impronta degli indirizzi (`testHash`), non l'indirizzo.

Per aggiungere altri giocatori dal gioco serve la tabella `public.testers` (è in `supabase/schema.sql`). Dopo aver eseguito lo script inserisci il tuo indirizzo come proprietario, una volta sola, nello SQL Editor:

```sql
insert into public.testers (email, owner) values ('la-tua-email@esempio.com', true);
```

Poi, con la modalità test accesa, in Impostazioni > Generale compare il menu a tendina «Giocatori autorizzati»: da lì aggiungi o rimuovi un giocatore per indirizzo e-mail (deve avere un account). Una build fatta con `DBS_TEST=1` ha la modalità test per tutti (solo per sviluppo locale).

## Limiti da conoscere
- **Piano Free**: il progetto va in pausa dopo ~1 settimana senza attività (si riattiva dal pannello) e ha limiti su utenti e spazio; verifica i valori attuali su <https://supabase.com/pricing>. Un salvataggio pesa pochi KB.
- **Anti-cheat**: il gioco gira nel browser, quindi un giocatore esperto può modificare il proprio salvataggio. Va bene per un gioco personale; classifiche competitive richiederebbero controlli lato server.
- **Più dispositivi insieme**: vince l'ultimo salvataggio (per data). Non si fondono due partite giocate in parallelo su dispositivi diversi.
- **Eliminazione account**: per ora si cancella dal pannello Supabase (**Authentication → Users**); i dati nella tabella `saves` spariscono con l'utente (`on delete cascade`).

## Test
`tests/mock_supabase.js` simula Supabase in memoria (anche `/auth/v1/settings`, codici di recupero e `/auth/v1/verify`); `tests/cloud_e2e.js` prova registrazione, login, refresh del token, sincronizzazione, conflitto, **reset password con codice e con link, link scaduto, pulsante Google e passaggio di sessione dal popup**, logout e modalità offline:

```bash
SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_ANON_KEY=testkey DBS_OUT=/tmp/o/cloud.html python3 build.py
node tests/cloud_e2e.js
```
