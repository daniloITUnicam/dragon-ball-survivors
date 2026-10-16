# Pubblicare il gioco sul tuo dominio

Il gioco è **un solo file HTML statico** (`dist/dragon-ball-survivors.html`): non serve nessun server applicativo, qualsiasi hosting di file statici va bene.

## Opzione consigliata: GitHub Pages + dominio tuo (gratis, deploy a ogni push)

1. **Crea il repository** su GitHub e fai il primo push (`git remote add origin ...` e `git push -u origin main`; il ramo deve chiamarsi `main`).
2. Nel repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Il workflow `.github/workflows/deploy.yml` è già incluso: a ogni push compila e pubblica il gioco.
3. **Dominio personalizzato**: crea nella radice del repo un file `CNAME` con una sola riga, il tuo dominio (es. `gioco.tuodominio.it`), poi in *Settings → Pages → Custom domain* inseriscilo.
4. **DNS** (dal pannello del tuo registrar):
   - sottodominio (`gioco.tuodominio.it`): record **CNAME** → `<tuo-utente>.github.io`
   - dominio principale (`tuodominio.it`): quattro record **A** → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (e opzionalmente i quattro **AAAA** indicati nella documentazione GitHub)
5. Dopo che il DNS si è propagato (da pochi minuti a qualche ora) attiva **Enforce HTTPS** nelle impostazioni di Pages.

Da quel momento: `git push` → il sito si aggiorna da solo in circa un minuto.

## Alternative equivalenti
- **Cloudflare Pages** / **Netlify**: collega il repo, comando di build `python3 build.py`, cartella di output `dist` (rinomina o aggiungi una regola per servire `dragon-ball-survivors.html` come indice). Domini personalizzati e HTTPS inclusi.
- **Server tuo (VPS)**: copia `dist/dragon-ball-survivors.html` come `index.html` in una cartella servita da nginx/Caddy; con uno script `git pull && python3 build.py && cp dist/*.html /var/www/gioco/index.html` (o un webhook) ottieni lo stesso flusso.

## Cose da sapere
- **Musica**: `assets/menu.mp3` e `assets/namek.mp3` (generate con Suno) sono nel repository, quindi la build automatica le incorpora e il sito ha l'audio completo. Il file HTML finale pesa circa 8 MB: la prima apertura può richiedere qualche secondo.
- **Aggiornamenti senza perdere la partita**: `python3 build.py` scrive anche `dist/version.json` (l'id della build). Il workflow lo pubblica accanto a `index.html`; se usi un altro hosting **copia `version.json` insieme a `index.html`**. Il gioco lo controlla ogni minuto: se cambia mostra un avviso di 10 secondi, termina la partita in corso salvando tutte le monete e ricarica la pagina. Senza `version.json` (o in locale) la funzione resta semplicemente spenta. Le note di versione si scrivono in `src/js/patches.js`.
- **Salvataggi**: senza account stanno nel `localStorage` del browser (legati a dominio e dispositivo). Con un progetto Supabase gratuito il gioco ha **login e salvataggi cloud per account**: vedi [SUPABASE.md](SUPABASE.md).
