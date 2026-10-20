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
  };
  for(const k in ADD)ADD[k].forEach((v,i)=>{STR[L[i]][k]=v;});
})();
