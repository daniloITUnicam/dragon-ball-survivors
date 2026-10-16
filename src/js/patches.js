'use strict';
/* ====== Patch notes (shown by the 📜 button on the main menu) ======
   HOW TO ADD A RELEASE: put a new object at the TOP of PATCHES.
     id    unique string, normally the date ('2026-10-16'; for a second release on the same day '2026-10-16b'). When the id is not the one the
           player has already read, the 📜 button shows a red dot.
     date  'YYYY-MM-DD' - shown in the player's language.
     new   new features                (section "Novità / What's new",  hidden when empty)
     fix   bug fixes                   (section "Correzioni / Bug fixes", hidden when empty)
     bal   balance changes             (section "Bilanciamento / Balance", hidden when empty)
   Every entry is T('italiano','english'). Keep one line per change, written for players, not for programmers. */
const PATCHES=[
  {id:'2026-10-16',date:'2026-10-16',
    new:[
      T("Aggiornamento automatico: quando esce una nuova versione compare un avviso con un conto alla rovescia di 10 secondi. La partita in corso viene terminata con tutte le monete guadagnate e la pagina si ricarica da sola.","Automatic updates: when a new version is released a notice appears with a 10 second countdown. The run in progress ends with every coin you earned and the page reloads by itself."),
      T("Note di aggiornamento: il tasto 📜 in alto a destra nel menu principale elenca tutte le versioni, con la data.","Patch notes: the 📜 button at the top right of the main menu lists every release, with its date."),
      T("Le abilità dei personaggi crescono con le trasformazioni: a metà della linea ottengono un nuovo bonus passivo, nella forma finale un effetto potenziato (onde enormi, raggi doppi, scudi più lunghi...).","Character abilities grow with transformations: halfway along the line they gain a new passive bonus, and in the final form an empowered effect (huge waves, double beams, longer shields...)."),
      T("La barra di avanzamento della partita mostra di nuovo i traguardi: teschio rosso per i boss, piccoli teschi bianchi per le orde, il drago Shenron per il boss finale.","The run progress bar shows its milestones again: a red skull for bosses, small white skulls for hordes, the Shenron dragon for the final boss."),
      T("Zeno-sama rimbalza nel suo negozio e spiega gli oggetti con una nuvoletta quando ti avvicini, così non li compri per sbaglio. Hai fino a 1 minuto per scegliere.","Zeno-sama bounces around his shop and explains each item in a speech bubble when you get close, so you do not buy anything by accident. You have up to 1 minute to choose."),
      T("Obiettivi: filtro per nascondere quelli ottenuti, barra di ricerca, ordinamento per i più vicini al completamento, barra di progresso su ognuno e molti nuovi obiettivi creativi.","Achievements: a filter to hide the ones you already have, a search bar, sorting by closest to completion, a progress bar on each one and many new creative achievements."),
      T("Grimorio e Glossario si aprono dalla selezione del personaggio (in alto a destra).","The Grimoire and the Glossary now open from the character select screen (top right)."),
      T("Sfere del Drago ridisegnate: sette sprite (da 1 a 7 stelle) che rimbalzano sul terreno con bagliori, raggi, colonna di luce e onda d'urto a ogni rimbalzo. Ogni sfera ha un numero di stelle diverso e il contatore in basso a destra mostra quali hai già.","Dragon Balls redrawn: seven sprites (1 to 7 stars) that bounce on the ground with glows, rays, a pillar of light and a shock wave at every landing. Every ball has a different number of stars and the counter at the bottom right shows which ones you already have."),
      T("Suono dedicato quando raccogli una Sfera del Drago.","A dedicated sound when you pick up a Dragon Ball."),
      T("Serie di uccisioni: un contatore in alto a destra conta i nemici sconfitti di fila; ai traguardi (25, 50, 100, 200...) ricevi un po' di esperienza. Quattro nuovi obiettivi dedicati.","Kill streak: a counter at the top right counts enemies defeated in a row; at the milestones (25, 50, 100, 200...) you get a little experience. Four new achievements."),
      T("Nuovo badge W.I.P. animato nel menu principale.","New animated W.I.P. badge on the main menu."),
      T("Nuovi stage Via del Serpente e Inferno, con Freezer e Cell che evolvono durante lo scontro.","New stages Snake Way and Hell, with Freezer and Cell evolving during the fight."),
      T("Attacchi speciali dei nemici, segreti da scoprire, Shop di Zeno-sama, rarità dei trinket, scariche elettriche e aura del Kaioken.","Special enemy attacks, secrets to discover, Zeno-sama's Shop, trinket rarities, electric discharges and the Kaioken aura.")
    ],
    fix:[
      T("Gli sprite dei personaggi non hanno più linee che attraversano gli occhi.","Character sprites no longer have lines running across the eyes."),
      T("Tolto il testo sotto la scelta della difficoltà: la spiegazione della modalità x2 si legge passando il mouse sul pulsante.","Removed the text under the difficulty choice: the x2 mode explanation is shown when you hover the button.")
    ],
    bal:[
      T("Sfere del Drago: raggio di raccolta molto più piccolo e nessuna attrazione, devi passarci sopra. Le frecce ai bordi dello schermo indicano dove sono.","Dragon Balls: a much smaller pick-up radius and no attraction, you have to walk over them. The arrows at the screen edge show where they are."),
      T("Ricompense degli obiettivi molto più alte (per esempio Cacciatore 200, Sterminatore 500, completare uno stage 1000 monete). Chi li ha già ottenuti non riceve la differenza.","Achievement rewards are much higher (for example Hunter 200, Exterminator 500, clearing a stage 1000 coins). Achievements you already unlocked do not pay the difference."),
      T("Ricarica delle abilità più corta e in calo a ogni livello (fino a 10 secondi in meno al livello massimo).","Ability cooldowns are shorter and shrink with every level (up to 10 seconds less at the maximum level)."),
      T("Berserk di Broly: +80% di danni e +5 di armatura mentre è attivo (+8 nella forma finale).","Broly's Berserk: +80% damage and +5 armor while it lasts (+8 in the final form)."),
      T("Prezzi di sblocco dei personaggi ricalcolati in base ad abilità, statistiche e forza nell'anime: i più deboli costano meno, i più forti di più.","Character unlock prices recalculated from abilities, stats and strength in the anime: the weakest cost less, the strongest cost more."),
      T("Nemici più equilibrati nel tempo: ogni 1:30 +10% vita e +2% danni (prima +20% e +4%), in cambio rilasciano +5% esperienza. In modalità Estrema: +15% vita, +5% danni, +15% armatura e +8% esperienza.","Enemies scale more evenly: every 1:30 they get +10% HP and +2% damage (before: +20% and +4%) and drop +5% more experience. In Extreme mode: +15% HP, +5% damage, +15% armor and +8% experience.")
    ]},
  {id:'2026-10-15',date:'2026-10-15',
    new:[
      T("Account e salvataggi cloud: accedi per ritrovare i tuoi progressi su ogni dispositivo.","Accounts and cloud saves: log in to find your progress on every device.")
    ],fix:[],bal:[]}
];
/* the date of a release, written the way the player's language writes dates */
function patchDate(p,lang){
  try{return new Date(p.date+'T12:00:00').toLocaleDateString(lang||'it',{day:'numeric',month:'long',year:'numeric'});}catch(e){return p.date;}
}
