'use strict';
/* ====== v52: Achievements (unlocks + challenges), Objectives (gold only) and the daily quests ======
   - ACHIEVEMENTS keeps one list; `cat` tells the screen: 'ach' = the Achievement screen (weapon unlocks, second evolutions, challenges by difficulty),
     'obj' = the Objectives screen (gold-farming goals). Characters are listed in the Achievement screen from CHARS (their `lock` text).
   - Challenges (cat 'ach', tier 1-4) pay tickets (a.tk) on top of zenny.
   - Daily quests: DQ_N quests drawn from DQ every DQ_MS (6 h) from the slot number, the same on every device; finishing all of them pays DQ_BONUS. */
for(const a of ACHIEVEMENTS){a.cat=/^(wu_|we_)/.test(a.id)?'ach':'obj';}
{
  const O=(...a)=>{const o=A(...a);o.cat='obj';return o;};
  const C=(tier,tk,...a)=>{const o=A(...a);o.cat='ach';o.tier=tier;o.tk=tk;return o;};
  ACHIEVEMENTS.push(
    /* ---- Objectives: more gold to farm ---- */
    O('b10','Cacciatore di taglie','Bounty Hunter','Sconfiggi 10 boss in totale.','Defeat 10 bosses in total.',300,s=>s.bosses>=10,PG(s=>s.bosses,10)),
    O('b250','Sterminatore di boss','Boss Slayer','Sconfiggi 250 boss in totale.','Defeat 250 bosses in total.',4000,s=>s.bosses>=250,PG(s=>s.bosses,250)),
    O('b500','Incubo dei boss','Boss Nightmare','Sconfiggi 500 boss in totale.','Defeat 500 bosses in total.',8000,s=>s.bosses>=500,PG(s=>s.bosses,500)),
    O('k5k','Orda in frantumi','Horde Breaker','Sconfiggi 5.000 nemici in totale.','Defeat 5,000 enemies in total.',350,s=>s.kills>=5000,PG(s=>s.kills,5000)),
    O('k25k','Sterminio','Extermination','Sconfiggi 25.000 nemici in totale.','Defeat 25,000 enemies in total.',1200,s=>s.kills>=25000,PG(s=>s.kills,25000)),
    O('k50k','Piaga cosmica','Cosmic Plague','Sconfiggi 50.000 nemici in totale.','Defeat 50,000 enemies in total.',2000,s=>s.kills>=50000,PG(s=>s.kills,50000)),
    O('k250k','Distruttore di mondi','World Destroyer','Sconfiggi 250.000 nemici in totale.','Defeat 250,000 enemies in total.',6000,s=>s.kills>=250000,PG(s=>s.kills,250000)),
    O('k500k','Fine di ogni cosa','End of All Things','Sconfiggi 500.000 nemici in totale.','Defeat 500,000 enemies in total.',12000,s=>s.kills>=500000,PG(s=>s.kills,500000)),
    O('el10','Caccia agli élite','Elite Hunt','Sconfiggi 10 nemici élite in totale.','Defeat 10 elite enemies in total.',200,s=>s.elites>=10,PG(s=>s.elites,10)),
    O('el50','Spezzaélite','Elite Breaker','Sconfiggi 50 nemici élite in totale.','Defeat 50 elite enemies in total.',600,s=>s.elites>=50,PG(s=>s.elites,50)),
    O('el200','Terrore degli élite','Elite Terror','Sconfiggi 200 nemici élite in totale.','Defeat 200 elite enemies in total.',1500,s=>s.elites>=200,PG(s=>s.elites,200)),
    O('el1000','Nessun élite è al sicuro','No Elite Is Safe','Sconfiggi 1.000 nemici élite in totale.','Defeat 1,000 elite enemies in total.',5000,s=>s.elites>=1000,PG(s=>s.elites,1000)),
    O('w1','Prima vittoria','First Victory','Vinci una partita.','Win a run.',200,s=>s.wins>=1,PG(s=>s.wins,1)),
    O('w5','Vincitore abituale','Regular Winner','Vinci 5 partite.','Win 5 runs.',500,s=>s.wins>=5,PG(s=>s.wins,5)),
    O('w25','Serie vincente','Winning Streak','Vinci 25 partite.','Win 25 runs.',1500,s=>s.wins>=25,PG(s=>s.wins,25)),
    O('w100','Imbattibile','Undefeated','Vinci 100 partite.','Win 100 runs.',5000,s=>s.wins>=100,PG(s=>s.wins,100)),
    O('p1h','Un’ora di battaglia','An Hour of Battle','Gioca per 1 ora in totale.','Play for 1 hour in total.',300,s=>s.playT>=3600,PG(s=>s.playT,3600,'t')),
    O('p5h','Allenamento intensivo','Intensive Training','Gioca per 5 ore in totale.','Play for 5 hours in total.',1200,s=>s.playT>=18000,PG(s=>s.playT,18000,'t')),
    O('p20h','Vita da guerriero','A Warrior’s Life','Gioca per 20 ore in totale.','Play for 20 hours in total.',4000,s=>s.playT>=72000,PG(s=>s.playT,72000,'t')),
    O('p50h','Stanza dello Spirito e del Tempo','Hyperbolic Time','Gioca per 50 ore in totale.','Play for 50 hours in total.',10000,s=>s.playT>=180000,PG(s=>s.playT,180000,'t')),
    O('ev10','Fabbro di armi','Weaponsmith','Evolvi 10 armi in totale.','Evolve 10 weapons in total.',400,s=>s.evos>=10,PG(s=>s.evos,10)),
    O('ev50','Maestro armaiolo','Master Armorer','Evolvi 50 armi in totale.','Evolve 50 weapons in total.',1500,s=>s.evos>=50,PG(s=>s.evos,50)),
    O('ev200','Leggenda delle armi','Weapon Legend','Evolvi 200 armi in totale.','Evolve 200 weapons in total.',5000,s=>s.evos>=200,PG(s=>s.evos,200)),
    O('ch150','Svuotaforzieri','Chest Emptier','Apri 150 forzieri in totale.','Open 150 chests in total.',1500,s=>s.chests>=150,PG(s=>s.chests,150)),
    O('ch500','Re dei forzieri','Chest King','Apri 500 forzieri in totale.','Open 500 chests in total.',4000,s=>s.chests>=500,PG(s=>s.chests,500)),
    O('runs100','Instancabile combattente','Tireless Fighter','Gioca 100 partite.','Play 100 runs.',1500,s=>s.runs>=100,PG(s=>s.runs,100)),
    O('runs250','Leggenda vivente','Living Legend','Gioca 250 partite.','Play 250 runs.',4000,s=>s.runs>=250,PG(s=>s.runs,250)),
    O('z500k','Milionario in erba','Budding Millionaire','Guadagna 500.000 zenny in totale.','Earn 500,000 zenny in total.',6000,s=>s.zenny>=500000,PG(s=>s.zenny,500000)),
    O('z1m','Miliardario galattico','Galactic Billionaire','Guadagna 1.000.000 zenny in totale.','Earn 1,000,000 zenny in total.',12000,s=>s.zenny>=1000000,PG(s=>s.zenny,1000000)),
    O('zb25','Amico di Zeno-sama','Zeno-sama’s Friend','Compra 25 cimeli da Zeno-sama.','Buy 25 trinkets from Zeno-sama.',1500,s=>s.zbuys>=25,PG(s=>s.zbuys,25)),
    O('zb100','Socio di Zeno-sama','Zeno-sama’s Partner','Compra 100 cimeli da Zeno-sama.','Buy 100 trinkets from Zeno-sama.',4000,s=>s.zbuys>=100,PG(s=>s.zbuys,100)),
    O('shop100','Cliente VIP','VIP Customer','Compra 100 potenziamenti nel negozio.','Buy 100 upgrades in the shop.',900,s=>s.shopBuys>=100,PG(s=>s.shopBuys,100)),
    O('db21','Cacciatore di sfere','Ball Hunter','Trova 21 Sfere del Drago in totale.','Find 21 Dragon Balls in total.',700,s=>s.balls>=21,PG(s=>s.balls,21)),
    O('db77','Radar infallibile','Flawless Radar','Trova 77 Sfere del Drago in totale.','Find 77 Dragon Balls in total.',2500,s=>s.balls>=77,PG(s=>s.balls,77)),
    O('wish10','Desideri a raffica','Wish Spree','Evoca Shenron 10 volte in totale.','Summon Shenron 10 times in total.',2200,s=>s.wishes>=10,PG(s=>s.wishes,10)),
    O('wish25','Amico di Shenron','Shenron’s Friend','Evoca Shenron 25 volte in totale.','Summon Shenron 25 times in total.',5000,s=>s.wishes>=25,PG(s=>s.wishes,25)),
    /* ---- Achievement challenges by difficulty: tickets (and a little zenny) ---- */
    C(1,{t1:1},'c_pf3','Schivata perfetta','Perfect Dodge','Sconfiggi 3 boss senza subire danni (in totale).','Defeat 3 bosses without taking damage (in total).',300,s=>s.perfect>=3,PG(s=>s.perfect,3)),
    C(1,{t1:1},'c_ks100','Cento di fila','A Hundred in a Row','Fai una serie di 100 uccisioni consecutive in una partita.','Chain 100 kills in a row in one run.',300,s=>s.run.streak>=100,PG(s=>s.rec.streak,100)),
    C(1,{t1:1},'c_lv35','Allievo modello','Model Pupil','Raggiungi il livello 35 in una partita.','Reach level 35 in a run.',300,s=>s.run.lvl>=35,PG(s=>s.rec.lvl,35)),
    C(2,{t1:3},'c_hard3','Tre prove dure','Three Hard Trials','Completa 3 stage in Difficile o superiore.','Clear 3 stages on Hard or higher.',800,s=>s.hardClears>=3,PG(s=>s.hardClears,3)),
    C(2,{t1:3},'c_ev4','Evoluzione a catena','Chain Evolution','Evolvi 4 armi in una partita.','Evolve 4 weapons in one run.',800,s=>s.run.evos>=4,PG(s=>s.rec.evos,4)),
    C(2,{t1:3},'c_ks400','Quattrocento colpi','Four Hundred Blows','Fai una serie di 400 uccisioni consecutive in una partita.','Chain 400 kills in a row in one run.',800,s=>s.run.streak>=400,PG(s=>s.rec.streak,400)),
    C(2,{t1:3},'c_coin4k','Tasche piene','Pockets Full','Raccogli 4.000 monete in una sola partita.','Collect 4,000 coins in a single run.',800,s=>s.run.coins>=4000,PG(s=>s.rec.coins,4000)),
    C(3,{t10:1},'c_ext3','Tre Inferni','Three Hells','Completa 3 stage in Estremo.','Clear 3 stages on Extreme.',2000,s=>s.extremeClears>=3,PG(s=>s.extremeClears,3)),
    C(3,{t10:1},'c_pf10','Intoccabile ×10','Untouchable ×10','Sconfiggi 10 boss senza subire danni (in totale).','Defeat 10 bosses without taking damage (in total).',2000,s=>s.perfect>=10,PG(s=>s.perfect,10)),
    C(3,{t10:1},'c_k9k','Annientamento','Annihilation','9.000 nemici in una partita.','9,000 enemies in one run.',2000,s=>s.run.kills>=9000,PG(s=>s.rec.kills,9000)),
    C(3,{t10:1},'c_lv90','Quasi al limite','Almost at the Limit','Raggiungi il livello 90 in una partita.','Reach level 90 in a run.',2000,s=>s.run.lvl>=90,PG(s=>s.rec.lvl,90)),
    C(4,{l10:1},'c_ext8','Dominatore dell’Inferno','Lord of Hell','Completa 8 stage in Estremo.','Clear 8 stages on Extreme.',5000,s=>s.extremeClears>=8,PG(s=>s.extremeClears,8)),
    C(4,{l10:1},'c_ks1500','Millecinquecento','Fifteen Hundred','Fai una serie di 1.500 uccisioni consecutive in una partita.','Chain 1,500 kills in a row in one run.',5000,s=>s.run.streak>=1500,PG(s=>s.rec.streak,1500)),
    C(4,{l10:1},'c_hard11','Tutto in Difficile','Everything on Hard','Completa 11 stage in Difficile o superiore.','Clear 11 stages on Hard or higher.',5000,s=>s.hardClears>=11,PG(s=>s.hardClears,11))
  );
}
const TIER_NAMES=[null,T('Facile','Easy'),T('Medio','Medium'),T('Difficile','Hard'),T('Estremo','Extreme')],TIER_COL=[null,'#8be07a','#ffd23f','#ff9a3d','#ff4a6a'];

/* ---------- daily quests ---------- */
const DQ_MS=6*3600*1000,DQ_N=5,DQ_BONUS=1200;
const DQ=[
  {k:'kills',get:s=>s.kills,t:[[300,100],[500,200],[1000,350]],it:'Sconfiggi {n} mostri',en:'Defeat {n} monsters'},
  {k:'bosses',get:s=>s.bosses,t:[[2,150],[4,300],[7,500]],it:'Sconfiggi {n} boss',en:'Defeat {n} bosses'},
  {k:'runs',get:s=>s.runs,t:[[1,100],[3,250],[5,400]],it:'Gioca {n} partite',en:'Play {n} runs',it1:'Gioca 1 partita',en1:'Play 1 run'},
  {k:'wins',get:s=>s.wins,t:[[1,250],[2,450],[3,700]],it:'Vinci {n} stage',en:'Win {n} stages',en1:'Win 1 stage'},
  {k:'chests',get:s=>s.chests,t:[[3,100],[6,200],[10,350]],it:'Apri {n} forzieri',en:'Open {n} chests'},
  {k:'time',get:s=>s.playT/60,t:[[10,100],[25,250],[45,450]],it:'Sopravvivi {n} minuti in totale',en:'Survive {n} minutes in total'},
  {k:'evos',get:s=>s.evos,t:[[1,150],[3,350],[5,600]],it:'Evolvi {n} armi',en:'Evolve {n} weapons',it1:'Evolvi 1 arma',en1:'Evolve 1 weapon'},
  {k:'elites',get:s=>s.elites,t:[[2,120],[5,300],[10,500]],it:'Sconfiggi {n} nemici élite',en:'Defeat {n} elite enemies'},
  {k:'zbuys',get:s=>s.zbuys,t:[[1,200],[2,400]],it:'Compra {n} cimeli da Zeno-sama',en:'Buy {n} trinkets from Zeno-sama',it1:'Compra 1 cimelio da Zeno-sama',en1:'Buy 1 trinket from Zeno-sama'},
  {k:'balls',get:s=>s.balls,t:[[1,150],[3,350]],it:'Trova {n} Sfere del Drago',en:'Find {n} Dragon Balls',it1:'Trova 1 Sfera del Drago',en1:'Find 1 Dragon Ball'},
  {k:'shop',get:s=>s.shopBuys,t:[[1,100],[2,200]],it:'Compra {n} potenziamenti nel negozio',en:'Buy {n} upgrades in the shop',it1:'Compra 1 potenziamento nel negozio',en1:'Buy 1 upgrade in the shop'}
];
/* the text of a quest (with the singular for 1) */
const dqText=q=>T(q.n===1&&q.def.it1?q.def.it1:q.def.it.replace('{n}',q.n.toLocaleString('it-IT')),q.n===1&&q.def.en1?q.def.en1:q.def.en.replace('{n}',q.n.toLocaleString('en-US')));
const dqSlot=(now)=>Math.floor((now||Date.now())/DQ_MS);
/* the quests of a slot: deterministic (a small seeded generator), so every device shows the same ones */
function dqList(slot){
  let x=(slot*2654435761)>>>0;const rnd=()=>{x=(x+0x6D2B79F5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};
  const pool=DQ.slice(),out=[];
  while(out.length<DQ_N&&pool.length){const q=pool.splice(Math.floor(rnd()*pool.length),1)[0],ti=Math.min(q.t.length-1,Math.floor(rnd()*q.t.length*1.0));
    out.push({k:q.k,n:q.t[ti][0],reward:q.t[ti][1],tier:ti,def:q});}
  return out.sort((a,b)=>a.reward-b.reward);
}
Object.assign(Progress.prototype,{
  /* the state of today's slot: the cumulative counters at its start (base), which quests are done and whether the bonus was paid */
  dqState(sv){
    const d=this.d,slot=dqSlot();let q=d.dq;
    if(!q||q.slot!==slot)q=d.dq={slot,base:null,done:[],bonus:false};
    if(!q.base&&sv){q.base={};for(const D of DQ)q.base[D.k]=D.get(sv);this.save.write();}
    return q;
  },
  /* current progress of every quest: [{n,cur,reward,def,done}] */
  dqView(sv){
    sv=sv||this.statsView(null);const q=this.dqState(sv),list=dqList(q.slot);
    return list.map((x,i)=>{const cur=Math.max(0,x.def.get(sv)-(q.base?q.base[x.k]:0));return Object.assign({},x,{cur:Math.min(x.n,cur),done:!!q.done[i]||cur>=x.n});});
  },
  /* pays the quests that were finished (called with every achievement check) */
  checkDaily(g,sv){
    if(this.blocked(g))return;
    sv=sv||this.statsView(g);const q=this.dqState(sv),list=dqList(q.slot);let changed=false;
    list.forEach((x,i)=>{
      if(q.done[i])return;const cur=Math.max(0,x.def.get(sv)-q.base[x.k]);
      if(cur>=x.n){q.done[i]=1;this.d.zenny+=x.reward;changed=true;this.notify({type:'quest',q:x});}
    });
    if(!q.bonus&&list.length&&list.every((_,i)=>q.done[i])){q.bonus=true;this.d.zenny+=DQ_BONUS;changed=true;this.notify({type:'qbonus',v:DQ_BONUS});}
    if(changed)this.save.write();
  }
});
