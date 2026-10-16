'use strict';
/* ====== i18n: UI strings (data names use T(it,en) objects) ====== */
const STR={
 it:{
  play:'Gioca',shop:'Negozio',ach:'Obiettivi',settings:'Impostazioni',sandbox:'Ambiente di test',back:'Indietro',start:'Inizia',next:'Avanti',
  kbHint:'Frecce/WASD per muoverti · Invio per scegliere',
  chooseStage:'Scegli lo stage',chooseChar:'Scegli il personaggio',difficulty:'Difficoltà',duration:'Durata',bosses:'Boss',rewardMult:'Zenny',
  stageLocked:'Completa lo Stage {n}',clears:'Completato',notCleared:'Da completare',best:'Record',kills:'sconfitti',
  x2Desc:'Modalità x2: tempo e zenny doppi, esperienza ridotta, nemici più duri.',x2Locked:'Modalità x2: raggiungi il boss finale di questo stage per sbloccarla.',
  on:'Sì',off:'No',startWeapons:'Armi iniziali',forms:'Trasformazioni',stSpeed:'Velocità',stPower:'Potenza',lockedTip:'Bloccato: {c}',
  shopTitle:'Negozio',shopDesc:'Potenziamenti permanenti validi per tutti i personaggi. Ogni acquisto aumenta il prezzo del 25%.',maxed:'MAX',refund:'Rimborsa tutto (90%)',refundDone:'Rimborsati {n} zenny.',
  achTitle:'Obiettivi',achCount:'{a} / {b} completati',achUnlocked:'Obiettivo sbloccato!',charUnlocked:'Personaggio sbloccato',
  x2Unlocked:'Modalità x2 sbloccata!',x2UnlockedBody:'Ora disponibile nello Stage {n}.',
  tab_general:'Generali',tab_audio:'Audio',tab_video:'Video',tab_controls:'Controlli',
  lang:'Lingua',fullscreen:'Schermo intero',showFps:'Mostra FPS',shake:'Tremolio schermo',dmgNums:'Numeri dei danni',
  dmgSummary:'Danni per arma',dmgOther:'Altro (abilità, scatto, pet)',coinsCollected:'Monete raccolte',sandboxOpt:'Ambiente di test',sandboxOptDesc:'Sblocca tutti i livelli e personaggi e rende gratuiti gli acquisti del negozio. Disattivandolo, gli acquisti fatti in Test vengono annullati.',sbWarnOn:'Attenzione: il Test sblocca tutto e rende gratis il negozio. Disattivandolo, gli acquisti fatti in Test verranno annullati. Premi di nuovo per attivare.',sbWarnOff:'Attenzione: disattivando il Test, gli acquisti fatti in Test verranno annullati. Premi di nuovo per confermare.',sbReverted:'Test disattivato: {n} acquisti annullati.',
  resetSave:'Cancella i salvataggi',reset:'Cancella',resetConfirm:'Premi di nuovo per cancellare tutto.',resetDone:'Salvataggio cancellato.',
  master:'Volume generale',music:'Volume musica',sfxVol:'Volume effetti',resolution:'Risoluzione',resNative:'Nativa (finestra)',renderScale:'Scala di rendering',
  keyboard:'Tastiera',gamepad:'Controller',noPad:'Nessun controller rilevato: premi un pulsante per attivarlo.',padConnected:'Controller collegato',
  rebindHint:'Clicca un tasto e premi il nuovo ingresso (Esc per annullare). Stick sinistro e D-pad funzionano sempre.',pressKey:'Premi un tasto...',pressBtn:'Premi un pulsante...',resetControls:'Ripristina controlli',
  act_up:'Su',act_down:'Giù',act_left:'Sinistra',act_right:'Destra',act_confirm:'Conferma',act_cancel:'Indietro',act_pause:'Pausa',act_interact:'Interagisci',act_formPrev:'Forma precedente',act_formNext:'Forma successiva',act_debug:'Pannello test',
  pause:'Pausa',resume:'Riprendi',quitMenu:'Termina e riscuoti',
  sbDesc:'Prova tutte le meccaniche: nel gioco apri il pannello con F2 / Select (configurabile).',sbNoReward:'Ambiente di test: nessuna ricompensa salvata.',
  sbLevel:'Livello',sbForm:'Forma',sbWeapon:'Arma',sbTrinket:'Cimelio',sbEnemy:'Nemico',sbBoss:'Boss',sbKillAll:'Elimina tutti',sbTime:'Tempo',sbNextBoss:'Prossimo boss',
  sbLoot:'Loot/Mappa',sbChest:'Forziere',sbNormal:'Normale',sbFinal:'Finale',sbWish:'Sfere',sbPlayer:'Giocatore',sbHeal:'Cura',
  lv:'LV',baseForm:'Forma base',nextForm:'prossima al livello',changeForm:'cambia forma',buffDmg:'Danni +15%',buffHaste:'Fuoco rapido',buffSlow:'Tempo rallentato',
  altarPrompt:'Sacrifica metà vita per potenziare un\'arma',
  levelUpTitle:'Livello {n}: scegli',chestTitle:'Forziere!',wishTitle:'Shenron esaudisce un desiderio',wishDesc:'Hai riunito le sette Sfere del Drago.',collect:'Raccogli',
  newWeapon:'Nuova tecnica',weaponLv:'Tecnica · livello {n}',newPass:'Nuovo potenziamento',passLv:'Potenziamento · livello {n}',evolution:'Evoluzione',heal:'Cura',treasure:'Tesoro',
  stageClear:'Stage completato!',defeat:'Sconfitta',time:'Tempo',level:'Livello',bossKills:'Boss sconfitti',rewards:'Ricompense',multiplier:'Moltiplicatore',total:'Totale',
  rw_coins:'Zenny raccolti',rw_kills:'Nemici sconfitti',rw_time:'Tempo di sopravvivenza',rw_bosses:'Boss',rw_clear:'Bonus stage',
  continue:'Continua',retry:'Riprova',toMenu:'Menu',
  pauseWeapons:'Armi',pauseStats:'Statistiche',pauseUpgrades:'Potenziamenti ricevuti',pauseTrinkets:'Cimeli',pauseWishes:'Desideri e Sfere',none:'Nessuno',
  stHp:'Salute',stCooldown:'Ricarica',stArmor:'Armatura',stRegen:'Rigenerazione',stCrit:'Critico',stDodge:'Schivata',stArea:'Area',stLuck:'Fortuna',stXp:'Esperienza',stGold:'Zenny',stMagnet:'Raccolta',
  tempBuffs:'Bonus temporaneo',wishLabel:'Desiderio',formLabel:'Forma',balls:'Sfere del Drago',evolution2:'Seconda evoluzione',
  weaponUnlocked:'Arma sbloccata!',evo2Unlocked:'Seconda evoluzione sbloccata!',endlessHint:'Modalità infinita: completa tutti e 5 gli stage per sbloccarla.',
  glossary:'Glossario',glossEnemies:'Nemici',glossBosses:'Boss',glossSeen:'Incontrati: {a} / {b}',glossHint:'Non hai ancora incontrato questo nemico: affrontalo in partita per scoprirlo.',glossBehavior:'Comportamento',glossHp:'Vita base',glossDmg:'Danno base',glossSpeed:'Velocità',glossStages:'Compare in',
  buyChar:'Acquista per {n}',charBought:'{c} sbloccato!',reqLabel:'Requisito (oppure acquistalo)',
  trialTrain:'Allenamento',trialFree:'GRATIS',trialFreeDesc:'Maestro sconfitto! Scegli un potenziamento gratuito.',trialShopTitle:'Stanza dello Spirito e del Tempo',trialShopDesc:'Allenamento concluso! Hai {n} zenny da spendere in questa partita.',trialLeave:'Esci dalla stanza',trialForm:'Trasformazione',trialWeapon:'Arma',trialSwap:'Scambio',trialSold:'Acquistato',chamberPrompt:'Entra nella Stanza dello Spirito e del Tempo',formHidden:'non ancora raggiunta',passSlots:'Potenziamenti diversi {a}/{b}',sbTrial:'Stanza'
 },
 en:{
  play:'Play',shop:'Shop',ach:'Achievements',settings:'Settings',sandbox:'Test environment',back:'Back',start:'Start',next:'Next',
  kbHint:'Arrows/WASD to move · Enter to select',
  chooseStage:'Choose a stage',chooseChar:'Choose a character',difficulty:'Difficulty',duration:'Length',bosses:'Bosses',rewardMult:'Zenny',
  stageLocked:'Clear Stage {n}',clears:'Cleared',notCleared:'Not cleared',best:'Best',kills:'kills',
  x2Desc:'x2 mode: double time and zenny, reduced XP, tougher enemies.',x2Locked:'x2 mode: reach this stage\'s final boss to unlock it.',
  on:'On',off:'Off',startWeapons:'Starting weapons',forms:'Transformations',stSpeed:'Speed',stPower:'Power',lockedTip:'Locked: {c}',
  shopTitle:'Shop',shopDesc:'Permanent upgrades for every character. Every purchase raises the price by 25%.',maxed:'MAX',refund:'Refund all (90%)',refundDone:'Refunded {n} zenny.',
  achTitle:'Achievements',achCount:'{a} / {b} completed',achUnlocked:'Achievement unlocked!',charUnlocked:'Character unlocked',
  x2Unlocked:'x2 mode unlocked!',x2UnlockedBody:'Now available in Stage {n}.',
  tab_general:'General',tab_audio:'Audio',tab_video:'Video',tab_controls:'Controls',
  lang:'Language',fullscreen:'Fullscreen',showFps:'Show FPS',shake:'Screen shake',dmgNums:'Damage numbers',
  dmgSummary:'Damage by weapon',dmgOther:'Other (abilities, dash, pet)',coinsCollected:'Coins collected',sandboxOpt:'Test environment',sandboxOptDesc:'Unlocks every stage and character and makes shop purchases free. Turning it off reverts the purchases made in Test.',sbWarnOn:'Warning: Test unlocks everything and makes the shop free. Turning it off reverts purchases made in Test. Press again to enable.',sbWarnOff:'Warning: turning Test off reverts the purchases made in Test. Press again to confirm.',sbReverted:'Test off: {n} purchases reverted.',
  resetSave:'Delete save data',reset:'Delete',resetConfirm:'Press again to delete everything.',resetDone:'Save data deleted.',
  master:'Master volume',music:'Music volume',sfxVol:'Effects volume',resolution:'Resolution',resNative:'Native (window)',renderScale:'Render scale',
  keyboard:'Keyboard',gamepad:'Controller',noPad:'No controller detected: press any button to activate it.',padConnected:'Controller connected',
  rebindHint:'Click a slot, then press the new input (Esc to cancel). Left stick and D-pad always work.',pressKey:'Press a key...',pressBtn:'Press a button...',resetControls:'Reset controls',
  act_up:'Up',act_down:'Down',act_left:'Left',act_right:'Right',act_confirm:'Confirm',act_cancel:'Back',act_pause:'Pause',act_interact:'Interact',act_formPrev:'Previous form',act_formNext:'Next form',act_debug:'Test panel',
  pause:'Paused',resume:'Resume',quitMenu:'End run and collect',
  sbDesc:'Try every mechanic: in game, open the panel with F2 / Select (rebindable).',sbNoReward:'Test environment: no rewards are saved.',
  sbLevel:'Level',sbForm:'Form',sbWeapon:'Weapon',sbTrinket:'Trinket',sbEnemy:'Enemy',sbBoss:'Boss',sbKillAll:'Kill all',sbTime:'Time',sbNextBoss:'Next boss',
  sbLoot:'Loot/Map',sbChest:'Chest',sbNormal:'Normal',sbFinal:'Final',sbWish:'Balls',sbPlayer:'Player',sbHeal:'Heal',
  lv:'LV',baseForm:'Base form',nextForm:'next at level',changeForm:'change form',buffDmg:'Damage +15%',buffHaste:'Rapid fire',buffSlow:'Time slowed',
  altarPrompt:'Sacrifice half your HP to upgrade a weapon',
  levelUpTitle:'Level {n}: choose',chestTitle:'Chest!',wishTitle:'Shenron grants a wish',wishDesc:'You gathered all seven Dragon Balls.',collect:'Collect',
  newWeapon:'New technique',weaponLv:'Technique · level {n}',newPass:'New upgrade',passLv:'Upgrade · level {n}',evolution:'Evolution',heal:'Heal',treasure:'Treasure',
  stageClear:'Stage cleared!',defeat:'Defeat',time:'Time',level:'Level',bossKills:'Bosses defeated',rewards:'Rewards',multiplier:'Multiplier',total:'Total',
  rw_coins:'Zenny collected',rw_kills:'Enemies defeated',rw_time:'Survival time',rw_bosses:'Bosses',rw_clear:'Stage bonus',
  continue:'Continue',retry:'Retry',toMenu:'Menu',
  pauseWeapons:'Weapons',pauseStats:'Stats',pauseUpgrades:'Upgrades received',pauseTrinkets:'Trinkets',pauseWishes:'Wishes & Balls',none:'None',
  stHp:'Health',stCooldown:'Cooldown',stArmor:'Armor',stRegen:'Regeneration',stCrit:'Crit',stDodge:'Dodge',stArea:'Area',stLuck:'Luck',stXp:'Experience',stGold:'Zenny',stMagnet:'Pickup',
  tempBuffs:'Temporary buff',wishLabel:'Wish',formLabel:'Form',balls:'Dragon Balls',evolution2:'Second evolution',
  weaponUnlocked:'Weapon unlocked!',evo2Unlocked:'Second evolution unlocked!',endlessHint:'Endless mode: clear all 5 stages to unlock it.',
  glossary:'Glossary',glossEnemies:'Enemies',glossBosses:'Bosses',glossSeen:'Encountered: {a} / {b}',glossHint:'You have not met this enemy yet: face it in a run to discover it.',glossBehavior:'Behavior',glossHp:'Base HP',glossDmg:'Base damage',glossSpeed:'Speed',glossStages:'Appears in',
  buyChar:'Buy for {n}',charBought:'{c} unlocked!',reqLabel:'Requirement (or buy it)',
  trialTrain:'Training',trialFree:'FREE',trialFreeDesc:'Master defeated! Pick one upgrade for free.',trialShopTitle:'Room of Spirit and Time',trialShopDesc:'Training complete! You have {n} zenny to spend this run.',trialLeave:'Leave the room',trialForm:'Transformation',trialWeapon:'Weapon',trialSwap:'Swap',trialSold:'Purchased',chamberPrompt:'Enter the Room of Spirit and Time',formHidden:'not reached yet',passSlots:'Different upgrades {a}/{b}',sbTrial:'Room'
 }
};
class I18n{
  constructor(){this.lang='it';}
  setLang(l){this.lang=STR[l]?l:'en';}
  t(k,vars){
    let s;
    if(k&&typeof k==='object')s=k[this.lang]||k.en||k.it;
    else s=(STR[this.lang]&&STR[this.lang][k])||STR.en[k]||STR.it[k]||k;
    if(vars)for(const v in vars)s=s.split('{'+v+'}').join(vars[v]);
    return s;
  }
}
