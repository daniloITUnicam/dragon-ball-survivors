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
    O('db21','Cacciatore di sfere','Ball Hunter','Trova 21 Sfere del Drago in totale.','Find 21 Dragon Balls in total.',700,s=>s.balls>=21,PG(s=>s.balls,21)),
    O('db77','Radar infallibile','Flawless Radar','Trova 77 Sfere del Drago in totale.','Find 77 Dragon Balls in total.',2500,s=>s.balls>=77,PG(s=>s.balls,77)),
    O('wish10','Desideri a raffica','Wish Spree','Evoca Shenron 10 volte in totale.','Summon Shenron 10 times in total.',2200,s=>s.wishes>=10,PG(s=>s.wishes,10)),
    O('wish25','Amico di Shenron','Shenron’s Friend','Evoca Shenron 25 volte in totale.','Summon Shenron 25 times in total.',5000,s=>s.wishes>=25,PG(s=>s.wishes,25)),
    /* ---- Achievement challenges by difficulty: tickets (and a little zenny) ---- */
    C(1,{t1:1},'c_pf3','Schivata perfetta','Perfect Dodge','Sconfiggi 3 boss senza subire danni (in totale).','Defeat 3 bosses without taking damage (in total).',300,s=>s.perfect>=3,PG(s=>s.perfect,3)),
    C(1,{t1:1},'c_ks100','Cento di fila','A Hundred in a Row','Fai una serie di 100 uccisioni consecutive in una partita.','Chain 100 kills in a row in one run.',300,s=>s.run.streak>=100,PG(s=>s.rec.streak,100)),
    C(1,{t1:1},'c_lv35','Allievo modello','Model Pupil','Raggiungi il livello 35 in una partita.','Reach level 35 in a run.',300,s=>s.run.lvl>=35,PG(s=>s.rec.lvl,35)),
    C(2,{t1:3},'c_hard3','Tre prove dure','Three Hard Trials','Completa 3 stage con almeno un Patto attivo.','Clear 3 stages with at least one Pact on.',800,s=>s.hardClears>=3,PG(s=>s.hardClears,3)),
    C(2,{t1:3},'c_ev4','Evoluzione a catena','Chain Evolution','Evolvi 4 armi in una partita.','Evolve 4 weapons in one run.',800,s=>s.run.evos>=4,PG(s=>s.rec.evos,4)),
    C(2,{t1:3},'c_ks400','Quattrocento colpi','Four Hundred Blows','Fai una serie di 400 uccisioni consecutive in una partita.','Chain 400 kills in a row in one run.',800,s=>s.run.streak>=400,PG(s=>s.rec.streak,400)),
    C(2,{t1:3},'c_coin4k','Tasche piene','Pockets Full','Raccogli 4.000 monete in una sola partita.','Collect 4,000 coins in a single run.',800,s=>s.run.coins>=4000,PG(s=>s.rec.coins,4000)),
    C(3,{t10:1},'c_ext3','Tre Inferni','Three Hells','Completa 3 stage con almeno 3 Patti attivi.','Clear 3 stages with at least 3 Pacts on.',2000,s=>s.extremeClears>=3,PG(s=>s.extremeClears,3)),
    C(3,{t10:1},'c_pf10','Intoccabile ×10','Untouchable ×10','Sconfiggi 10 boss senza subire danni (in totale).','Defeat 10 bosses without taking damage (in total).',2000,s=>s.perfect>=10,PG(s=>s.perfect,10)),
    C(3,{t10:1},'c_k9k','Annientamento','Annihilation','9.000 nemici in una partita.','9,000 enemies in one run.',2000,s=>s.run.kills>=9000,PG(s=>s.rec.kills,9000)),
    C(3,{t10:1},'c_lv90','Quasi al limite','Almost at the Limit','Raggiungi il livello 90 in una partita.','Reach level 90 in a run.',2000,s=>s.run.lvl>=90,PG(s=>s.rec.lvl,90)),
    C(4,{l10:1},'c_ext8','Dominatore dell’Inferno','Lord of Hell','Completa 8 stage con almeno 3 Patti attivi.','Clear 8 stages with at least 3 Pacts on.',5000,s=>s.extremeClears>=8,PG(s=>s.extremeClears,8)),
    C(4,{l10:1},'c_ks1500','Millecinquecento','Fifteen Hundred','Fai una serie di 1.500 uccisioni consecutive in una partita.','Chain 1,500 kills in a row in one run.',5000,s=>s.run.streak>=1500,PG(s=>s.rec.streak,1500)),
    C(4,{l10:1},'c_hard11','Tutto coi Patti','Everything with Pacts','Completa 11 stage con almeno un Patto attivo.','Clear 11 stages with at least one Pact on.',5000,s=>s.hardClears>=11,PG(s=>s.hardClears,11))
  );
}
/* ====== v142: many more small objectives (gold) and the trinket goals (tickets): collection, perfection, fusions, rerolls, pulls. The objectives for buying shop upgrades are gone. ====== */
{
  const R=['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII'],nf=(n,l)=>n.toLocaleString(l);
  const O=(id,it,en,dit,den,reward,test,prog)=>{const o=A(id,it,en,dit,den,reward,test,prog);o.cat='obj';return o;};
  const C=(tier,tk,id,it,en,dit,den,reward,test,prog)=>{const o=A(id,it,en,dit,den,reward,test,prog);o.cat='ach';o.tier=tier;o.tk=tk;return o;};
  /* a family of goals on one counter: thresholds with their small rewards; the text comes from two templates ({n} = the number) */
  const fam=(pre,itN,enN,itD,enD,get,list,u)=>{list.forEach(([n,rw],i)=>{
    const disp=u==='t'?(n>=3600?(n/3600)+' h':(n/60)+' min'):null,txt=(t,l)=>t.replace('{n}',disp||nf(n,l));
    ACHIEVEMENTS.push(O(pre+n,itN+' '+R[i],enN+' '+R[i],txt(itD,'it-IT'),txt(enD,'en-US'),rw,s=>get(s)>=n,PG(get,n,u)));});};
  fam('n_k','Sterminatore','Exterminator','Sconfiggi {n} nemici in totale.','Defeat {n} enemies in total.',s=>s.kills,[[250,60],[500,80],[2500,200],[750000,1800],[1000000,2500]]);
  fam('n_b','Cacciatore','Hunter','Sconfiggi {n} boss in totale.','Defeat {n} bosses in total.',s=>s.bosses,[[2,50],[3,60],[5,90],[15,200],[40,350],[75,500],[150,800],[300,1200],[400,1500],[750,2000],[1000,2500]]);
  fam('n_el','Cacciaélite','Elite Chaser','Sconfiggi {n} nemici élite in totale.','Defeat {n} elite enemies in total.',s=>s.elites,[[5,60],[25,150],[100,300],[400,700],[600,900],[2500,1800],[5000,2500]]);
  fam('n_w','Vittorioso','Victor','Vinci {n} partite.','Win {n} runs.',s=>s.wins,[[2,80],[3,100],[10,300],[15,400],[50,900],[75,1200],[150,2000],[250,2500]]);
  fam('n_r','Guerriero','Warrior','Gioca {n} partite.','Play {n} runs.',s=>s.runs,[[2,40],[5,80],[25,250],[75,500],[150,900],[500,2000],[1000,3000]]);
  fam('n_ch','Cercaforzieri','Chest Seeker','Apri {n} forzieri in totale.','Open {n} chests in total.',s=>s.chests,[[5,60],[25,150],[75,350],[100,450],[250,900],[300,1000],[1000,2500]]);
  fam('n_db','Radar acceso','Radar On','Trova {n} Sfere del Drago in totale.','Find {n} Dragon Balls in total.',s=>s.balls,[[3,80],[14,250],[35,500],[50,700],[100,1500],[150,2200]]);
  fam('n_wi','Evocatore','Summoner','Evoca Shenron {n} volte in totale.','Summon Shenron {n} times in total.',s=>s.wishes,[[2,200],[3,300],[15,1000],[50,3000]]);
  fam('n_ev','Armaiolo','Armorer','Evolvi {n} armi in totale.','Evolve {n} weapons in total.',s=>s.evos,[[2,80],[5,160],[25,500],[75,1000],[100,1400],[300,2500]]);
  fam('n_p','Allenamento','Training','Gioca per {n} in totale.','Play for {n} in total.',s=>s.playT,[[600,80],[1800,150],[7200,500],[10800,700],[36000,1800],[108000,3000]],'t');
  fam('n_zk','Cliente di Zeno','Zeno Regular','Entra {n} volte nel negozio di Zeno.','Enter Zeno’s Shop {n} times.',s=>s.zeno,[[3,80],[5,120],[25,500],[50,900]]);
  fam('n_zb','Compratore','Buyer','Compra {n} cimeli da Zeno-sama.','Buy {n} trinkets from Zeno-sama.',s=>s.zbuys,[[3,100],[5,160],[50,1000],[75,1500],[200,2500]]);
  fam('n_z','Risparmiatore','Saver','Guadagna {n} zenny in totale.','Earn {n} zenny in total.',s=>s.zenny,[[1000,60],[5000,120],[25000,300],[50000,600],[200000,1200],[250000,1500],[750000,2500]]);
  fam('n_pf','Intoccabile','Untouchable','Sconfiggi {n} boss senza subire danni (in totale).','Defeat {n} bosses without taking damage (in total).',s=>s.perfect,[[2,150],[5,350],[20,1000],[50,2500]]);
  fam('n_hc','Prova dei Patti','Pact Trial','Completa {n} stage con almeno un Patto attivo.','Clear {n} stages with at least one Pact on.',s=>s.hardClears,[[2,200],[5,500],[8,900],[20,2000],[30,3000]]);
  fam('n_xc','Patti estremi','Extreme Pacts','Completa {n} stage con almeno 3 Patti attivi.','Clear {n} stages with at least 3 Pacts on.',s=>s.extremeClears,[[2,400],[5,900],[10,1800],[15,2500],[20,3000]]);
  fam('n_x2','Doppia sfida','Double Trouble','Completa {n} stage in modalità x2.','Clear {n} stages in x2 mode.',s=>s.x2Clears,[[2,200],[5,500],[10,1000]]);
  fam('n_lv','Crescita','Growth','Raggiungi il livello {n} in una partita.','Reach level {n} in a run.',s=>s.rec.lvl,[[5,30],[15,80],[20,100],[30,200],[40,300],[60,600],[80,1000],[100,2000]]);
  fam('n_rk','Strage','Slaughter','Sconfiggi {n} nemici in una sola partita.','Defeat {n} enemies in a single run.',s=>s.rec.kills,[[500,60],[2000,250],[4000,500],[5000,700],[7500,1100],[10000,1800]]);
  fam('n_t','Sopravvivenza','Survival','Sopravvivi {n} in una partita.','Survive {n} in a run.',s=>s.rec.t,[[180,60],[900,200],[1500,400],[2400,900]],'t');
  fam('n_ks','Serie','Streak','Fai una serie di {n} uccisioni consecutive.','Chain {n} kills in a row.',s=>s.rec.streak,[[25,50],[75,150],[150,250],[300,400],[750,900],[2000,2000],[2500,2500]]);
  fam('n_co','Monete','Coins','Raccogli {n} monete in una sola partita.','Collect {n} coins in a single run.',s=>s.rec.coins,[[500,80],[1000,150],[3000,400],[6000,900],[8000,1400]]);
  fam('n_tr','Raccoglitore','Collector','Trova {n} cimeli in una sola partita.','Find {n} trinkets in a single run.',s=>s.rec.trinkets,[[3,60],[10,300],[15,600],[20,1000]]);
  fam('n_lg','Leggendari in corsa','Legendary Run','Trova {n} cimeli leggendari in una sola partita.','Find {n} legendary trinkets in a single run.',s=>s.rec.legendary,[[2,300],[3,600],[5,1500]]);
  fam('n_my','Mitici in corsa','Mythic Run','Trova {n} cimeli mitici in una sola partita.','Find {n} mythic trinkets in a single run.',s=>s.rec.mythic,[[2,2000]]);
  /* ---- trinket goals: tickets (t1 = Ticket 1×, t10 = Ticket 10×, l10 = Lucky Ticket 10×) ---- */
  const T_=(f,max)=>PG(s=>f(s.tr),max);
  const g=(tier,tk,id,it,en,dit,den,gold,f,max)=>ACHIEVEMENTS.push(C(tier,tk,id,it,en,dit,den,gold,s=>f(s.tr)>=max,T_(f,max)));
  /* collection */
  g(1,{t1:1},'g_n5','Primi cimeli','First Trinkets','Possiedi 5 cimeli nella sacca.','Own 5 trinkets in your bag.',200,t=>t.n,5);
  g(1,{t1:3},'g_n25','Piccola collezione','Small Collection','Possiedi 25 cimeli nella sacca.','Own 25 trinkets in your bag.',400,t=>t.n,25);
  g(2,{t10:1},'g_n50','Collezionista','Collector','Possiedi 50 cimeli nella sacca.','Own 50 trinkets in your bag.',800,t=>t.n,50);
  g(2,{t10:2},'g_n100','Grande collezione','Big Collection','Possiedi 100 cimeli nella sacca.','Own 100 trinkets in your bag.',1500,t=>t.n,100);
  g(3,{l10:3},'g_n200','Museo dei cimeli','Trinket Museum','Possiedi 200 cimeli nella sacca.','Own 200 trinkets in your bag.',3000,t=>t.n,200);
  g(1,{t1:2},'g_ep5','Cimeli epici','Epic Trinkets','Possiedi 5 cimeli epici.','Own 5 epic trinkets.',300,t=>t.own(2),5);
  g(2,{t10:1},'g_lg1','Leggenda in tasca','Legend in Your Pocket','Possiedi un cimelio leggendario.','Own a legendary trinket.',600,t=>t.own(3),1);
  g(3,{l10:2},'g_lg5','Cinque leggende','Five Legends','Possiedi 5 cimeli leggendari.','Own 5 legendary trinkets.',1500,t=>t.own(3),5);
  g(4,{l10:10},'g_lg15','Pantheon','Pantheon','Possiedi 15 cimeli leggendari.','Own 15 legendary trinkets.',4000,t=>t.own(3),15);
  g(3,{l10:3},'g_my1','Mito vivente','Living Myth','Possiedi un cimelio mitico.','Own a mythic trinket.',2000,t=>t.own(4),1);
  g(3,{l10:6},'g_my3','Tre miti','Three Myths','Possiedi 3 cimeli mitici.','Own 3 mythic trinkets.',3000,t=>t.own(4),3);
  g(4,{l10:20},'g_my10','Olimpo','Olympus','Possiedi 10 cimeli mitici.','Own 10 mythic trinkets.',5000,t=>t.own(4),10);
  g(4,{l10:50},'g_my25','Dio dei cimeli','Trinket God','Possiedi 25 cimeli mitici.','Own 25 mythic trinkets.',8000,t=>t.own(4),25);
  /* perfection */
  g(1,{t1:1},'g_p60','Ben riuscito','Well Rolled','Ottieni un cimelio con almeno il 60% di perfezione.','Get a trinket with at least 60% perfection.',200,t=>t.cnt(-1,60),1);
  g(1,{t1:2},'g_p75','Quasi perfetto','Almost Perfect','Ottieni un cimelio con almeno il 75% di perfezione.','Get a trinket with at least 75% perfection.',400,t=>t.cnt(-1,75),1);
  g(2,{t10:1},'g_p85','Eccellente','Excellent','Ottieni un cimelio con almeno l’85% di perfezione.','Get a trinket with at least 85% perfection.',800,t=>t.cnt(-1,85),1);
  g(2,{t10:2},'g_p92','Capolavoro','Masterpiece','Ottieni un cimelio con almeno il 92% di perfezione.','Get a trinket with at least 92% perfection.',1500,t=>t.cnt(-1,92),1);
  g(3,{l10:3},'g_p97','Sfiorare la perfezione','Touching Perfection','Ottieni un cimelio con almeno il 97% di perfezione.','Get a trinket with at least 97% perfection.',2500,t=>t.cnt(-1,97),1);
  g(3,{l10:10},'g_p100','Perfezione','Perfection','Ottieni un cimelio con il 100% di perfezione.','Get a trinket with 100% perfection.',4000,t=>t.cnt(-1,100),1);
  g(3,{l10:10},'g_p100x3','Tre perfetti','Three Perfect','Possiedi 3 cimeli con il 100% di perfezione.','Own 3 trinkets with 100% perfection.',5000,t=>t.cnt(-1,100),3);
  g(4,{l10:40},'g_p100x10','Dieci perfetti','Ten Perfect','Possiedi 10 cimeli con il 100% di perfezione.','Own 10 trinkets with 100% perfection.',9000,t=>t.cnt(-1,100),10);
  /* perfect (100%) by rarity */
  g(2,{t10:1},'g_pr0','Comune perfetto','Perfect Common','Ottieni un cimelio comune perfetto (100%).','Get a perfect (100%) common trinket.',800,t=>t.cnt(0,100),1);
  g(2,{t10:2},'g_pr1','Raro perfetto','Perfect Rare','Ottieni un cimelio raro perfetto (100%).','Get a perfect (100%) rare trinket.',1200,t=>t.cnt(1,100),1);
  g(3,{l10:5},'g_pr2','Epico perfetto','Perfect Epic','Ottieni un cimelio epico perfetto (100%).','Get a perfect (100%) epic trinket.',2500,t=>t.cnt(2,100),1);
  g(4,{l10:30},'g_pr3','Leggendario perfetto','Perfect Legendary','Ottieni un cimelio leggendario perfetto (100%).','Get a perfect (100%) legendary trinket.',6000,t=>t.cnt(3,100),1);
  g(4,{l10:100},'g_pr4','Mitico perfetto','Perfect Mythic','Ottieni un cimelio mitico perfetto (100%).','Get a perfect (100%) mythic trinket.',15000,t=>t.cnt(4,100),1);
  g(3,{l10:4},'g_m50','Mitico solido','Solid Mythic','Ottieni un cimelio mitico con almeno il 50% di perfezione.','Get a mythic trinket with at least 50% perfection.',2000,t=>t.cnt(4,50),1);
  g(3,{l10:8},'g_m75','Mitico raffinato','Refined Mythic','Ottieni un cimelio mitico con almeno il 75% di perfezione.','Get a mythic trinket with at least 75% perfection.',3500,t=>t.cnt(4,75),1);
  g(4,{l10:20},'g_m90','Mitico quasi perfetto','Near-Perfect Mythic','Ottieni un cimelio mitico con almeno il 90% di perfezione.','Get a mythic trinket with at least 90% perfection.',6000,t=>t.cnt(4,90),1);
  g(4,{l10:40},'g_m100x3','Tre mitici perfetti','Three Perfect Mythics','Possiedi 3 cimeli mitici perfetti (100%).','Own 3 perfect (100%) mythic trinkets.',12000,t=>t.cnt(4,100),3);
  /* fusions */
  g(1,{t1:1},'g_f1','Prima fusione','First Fusion','Esegui una fusione di cimeli.','Perform a trinket fusion.',200,t=>t.fu,1);
  g(1,{t1:3},'g_f5','Alchimista','Alchemist','Esegui 5 fusioni di cimeli.','Perform 5 trinket fusions.',400,t=>t.fu,5);
  g(2,{t10:2},'g_f25','Fornace attiva','Busy Furnace','Esegui 25 fusioni di cimeli.','Perform 25 trinket fusions.',1200,t=>t.fu,25);
  g(3,{l10:5},'g_f100','Maestro della fusione','Fusion Master','Esegui 100 fusioni di cimeli.','Perform 100 trinket fusions.',3500,t=>t.fu,100);
  g(4,{l10:20},'g_f300','Fusione senza fine','Endless Fusion','Esegui 300 fusioni di cimeli.','Perform 300 trinket fusions.',7000,t=>t.fu,300);
  g(1,{t1:2},'g_fs1','Tre in uno','Three in One','Fondi tre copie dello stesso cimelio.','Fuse three copies of the same trinket.',400,t=>t.fuS,1);
  g(2,{t10:2},'g_fs10','Salire di rarità','Rarity Climber','Fondi tre copie dello stesso cimelio 10 volte.','Fuse three copies of the same trinket 10 times.',1500,t=>t.fuS,10);
  g(3,{l10:5},'g_fs50','Ascesa continua','Constant Ascent','Fondi tre copie dello stesso cimelio 50 volte.','Fuse three copies of the same trinket 50 times.',4000,t=>t.fuS,50);
  g(3,{l10:5},'g_fm1','Fusione mitica','Mythic Fusion','Ottieni un cimelio mitico con una fusione.','Get a mythic trinket through a fusion.',3000,t=>t.fuM,1);
  g(4,{l10:25},'g_fm10','Forgiamiti','Mythic Forge','Ottieni 10 cimeli mitici con le fusioni.','Get 10 mythic trinkets through fusions.',7000,t=>t.fuM,10);
  /* rerolls */
  ACHIEVEMENTS.push(O('g_r10','Primo tentativo','First Try','Esegui 10 reroll.','Perform 10 rerolls.',150,s=>s.tr.rr>=10,T_(t=>t.rr,10)));
  g(1,{t1:1},'g_r50','Mano calda','Hot Hand','Esegui 50 reroll.','Perform 50 rerolls.',300,t=>t.rr,50);
  g(1,{t1:3},'g_r200','Giocatore d’azzardo','Gambler','Esegui 200 reroll.','Perform 200 rerolls.',700,t=>t.rr,200);
  g(2,{t10:2},'g_r1000','Rerolla tutto','Reroll Everything','Esegui 1.000 reroll.','Perform 1,000 rerolls.',2000,t=>t.rr,1000);
  g(3,{l10:5},'g_r5000','Ossessione','Obsession','Esegui 5.000 reroll.','Perform 5,000 rerolls.',4500,t=>t.rr,5000);
  g(4,{l10:25},'g_r20000','Dado infinito','Infinite Dice','Esegui 20.000 reroll.','Perform 20,000 rerolls.',9000,t=>t.rr,20000);
  /* pulls */
  ACHIEVEMENTS.push(O('g_pl1','Prima estrazione','First Pull','Esegui un’estrazione nel Gacha.','Make a pull in the Gacha.',100,s=>s.tr.pulls>=1,T_(t=>t.pulls,1)));
  ACHIEVEMENTS.push(O('g_pl10','Fortuna del principiante','Beginner’s Luck','Esegui 10 estrazioni nel Gacha.','Make 10 pulls in the Gacha.',200,s=>s.tr.pulls>=10,T_(t=>t.pulls,10)));
  g(1,{t1:2},'g_pl50','Estrattore','Puller','Esegui 50 estrazioni nel Gacha.','Make 50 pulls in the Gacha.',400,t=>t.pulls,50);
  g(2,{t10:1},'g_pl100','Cento estrazioni','A Hundred Pulls','Esegui 100 estrazioni nel Gacha.','Make 100 pulls in the Gacha.',800,t=>t.pulls,100);
  g(2,{t10:3},'g_pl500','Mille tentazioni','Many Temptations','Esegui 500 estrazioni nel Gacha.','Make 500 pulls in the Gacha.',2000,t=>t.pulls,500);
  g(3,{l10:5},'g_pl1000','Re del Gacha','Gacha King','Esegui 1.000 estrazioni nel Gacha.','Make 1,000 pulls in the Gacha.',4000,t=>t.pulls,1000);
  g(1,{t1:1},'g_lg_p1','Colpo di fortuna','Lucky Strike','Estrai un cimelio leggendario dal Gacha.','Pull a legendary trinket from the Gacha.',300,t=>t.legend,1);
  g(2,{t10:1},'g_lg_p10','Leggende estratte','Pulled Legends','Estrai 10 cimeli leggendari dal Gacha.','Pull 10 legendary trinkets from the Gacha.',1200,t=>t.legend,10);
  g(3,{l10:3},'g_lg_p50','Pioggia di leggende','Legend Rain','Estrai 50 cimeli leggendari dal Gacha.','Pull 50 legendary trinkets from the Gacha.',3000,t=>t.legend,50);
  g(3,{l10:2},'g_my_p1','Mitico dal Gacha','Mythic from the Gacha','Estrai un cimelio mitico dal Gacha.','Pull a mythic trinket from the Gacha.',2500,t=>t.mythics,1);
  g(4,{l10:10},'g_my_p5','Cinque miti','Five Myths','Estrai 5 cimeli mitici dal Gacha.','Pull 5 mythic trinkets from the Gacha.',6000,t=>t.mythics,5);
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
  {k:'balls',get:s=>s.balls,t:[[1,150],[3,350]],it:'Trova {n} Sfere del Drago',en:'Find {n} Dragon Balls',it1:'Trova 1 Sfera del Drago',en1:'Find 1 Dragon Ball'}
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
