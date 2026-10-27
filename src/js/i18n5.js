'use strict';
/* ====== Strings added from v52 on (all six languages) ====== */
(function(){
  const L=['it','en','es','fr','de','pt'];
  const ADD={
    quickStart:['Avvio rapido','Quick Start','Inicio rápido','Démarrage rapide','Schnellstart','Início rápido'],
    quickStartD:['Parti subito: il gioco sceglie lo stage e ti mostra cosa ti manca da sbloccare.','Jump right in: the game picks the stage and shows you what is still left to unlock.','Empieza ya: el juego elige el nivel y te muestra qué te falta por desbloquear.','Lancez-vous : le jeu choisit le niveau et montre ce qu\'il reste à débloquer.','Sofort loslegen: Das Spiel wählt die Stufe und zeigt, was noch freizuschalten ist.','Comece já: o jogo escolhe a fase e mostra o que ainda falta desbloquear.'],
    ach:['Obiettivi','Objectives','Objetivos','Objectifs','Ziele','Objetivos'],
    achTitle:['Obiettivi','Objectives','Objetivos','Objectifs','Ziele','Objetivos'],
    unl:['Achievement','Achievements','Logros','Succès','Erfolge','Conquistas'],
    unlTitle:['Achievement','Achievements','Logros','Succès','Erfolge','Conquistas'],
    tab_gameplay:['Partita','Gameplay','Partida','Partie','Spiel','Partida'],
    /* v109 */
    shopOnL:['ATTIVO','ON','ACTIVA','ACTIF','AN','ATIVA'],
    shopOffL:['SPENTO','OFF','APAGADA','INACTIF','AUS','DESLIGADA'],
    shopTogOff:['Clic: disattiva questo potenziamento nelle partite (resta comprato).','Click: switch this upgrade off in your runs (you keep it).','Clic: desactiva esta mejora en las partidas (la conservas).','Clic : désactive cette amélioration en partie (tu la gardes).','Klick: Diese Verbesserung in Runden ausschalten (sie bleibt gekauft).','Clique: desativa esta melhoria nas partidas (continua comprada).'],
    shopTogOn:['Clic: riattiva questo potenziamento nelle partite.','Click: switch this upgrade back on in your runs.','Clic: reactiva esta mejora en las partidas.','Clic : réactive cette amélioration en partie.','Klick: Diese Verbesserung in Runden wieder einschalten.','Clique: reativa esta melhoria nas partidas.'],
    shopAllOff:['Disattiva tutti','Switch all off','Desactivar todas','Tout désactiver','Alle ausschalten','Desativar todas'],
    shopAllOn:['Attiva tutti','Switch all on','Activar todas','Tout activer','Alle einschalten','Ativar todas'],
    shopShiftTip:['Clic: compra 1 livello · Maiusc + clic: compra il massimo ({n} livelli, {z} zenny)','Click: buy 1 level · Shift + click: buy the max ({n} levels, {z} zenny)','Clic: compra 1 nivel · Mayús + clic: compra el máximo ({n} niveles, {z} zenny)','Clic : achète 1 niveau · Maj + clic : achète le maximum ({n} niveaux, {z} zenny)','Klick: 1 Stufe kaufen · Umschalt + Klick: Maximum kaufen ({n} Stufen, {z} Zenny)','Clique: compra 1 nível · Shift + clique: compra o máximo ({n} níveis, {z} zenny)'],
    shopShiftHint:['Tieni premuto Maiusc mentre clicchi per comprare il massimo.','Hold Shift while clicking to buy the max.','Mantén Mayús al hacer clic para comprar el máximo.','Maintiens Maj en cliquant pour acheter le maximum.','Halte Umschalt beim Klicken gedrückt, um das Maximum zu kaufen.','Segure Shift ao clicar para comprar o máximo.'],
    dmgDealtT:['Danni inflitti','Damage dealt','Daño infligido','Dégâts infligés','Verursachter Schaden','Dano causado'],
    dmgTakenT:['Danni subiti','Damage taken','Daño recibido','Dégâts subis','Erlittener Schaden','Dano sofrido'],
    dmgTrap:['Trappole','Traps','Trampas','Pièges','Fallen','Armadilhas'],
    dmgLava:['Lava','Lava','Lava','Lave','Lava','Lava'],
    dmgBossAtk:['Attacchi dei boss','Boss attacks','Ataques de jefes','Attaques de boss','Boss-Angriffe','Ataques de chefes'],
    dmgEnv:['Altro (eventi, ambiente)','Other (events, surroundings)','Otros (eventos, entorno)','Autres (événements, décor)','Sonstiges (Ereignisse, Umgebung)','Outros (eventos, ambiente)'],
    evLog:['Cronologia Eventi','Event History','Historial de eventos','Historique des événements','Ereignisverlauf','Histórico de eventos'],
    evLogEmpty:['Ancora nessun evento in questa partita.','No events in this run yet.','Aún no hay eventos en esta partida.','Aucun événement pour l\'instant dans cette partie.','Noch keine Ereignisse in dieser Runde.','Ainda não há eventos nesta partida.'],
    stProj:['Quantità','Amount','Cantidad','Quantité','Anzahl','Quantidade'],
    statBreakNote:['L\'ultima riga somma abilità, Kaioken, totem e altri effetti attivi.','The last row adds up abilities, Kaioken, totems and other active effects.','La última fila suma habilidades, Kaioken, tótems y otros efectos activos.','La dernière ligne regroupe techniques, Kaioken, totems et autres effets actifs.','Die letzte Zeile fasst Fähigkeiten, Kaioken, Totems und andere aktive Effekte zusammen.','A última linha soma habilidades, Kaioken, totens e outros efeitos ativos.'],
  };
  for(const k in ADD)ADD[k].forEach((v,i)=>{STR[L[i]][k]=v;});
})();
