'use strict';
/* ====== Strings added later (pets, totems, trinket choice, traps) for all six UI languages ====== */
(function(){
  const L=['it','en','es','fr','de','pt'];
  const ADD={
    pickTitle:['Scegli un cimelio','Choose a trinket','Elige una reliquia','Choisis une relique','Wähle ein Relikt','Escolha uma relíquia'],
    pickSub:['Il boss ha lasciato {n} cimeli: prendine uno. Più fortuna, più scelta.','The boss dropped {n} trinkets: take one. More luck, more choice.','El jefe dejó {n} reliquias: toma una. Más suerte, más opciones.','Le boss a laissé {n} reliques : prends-en une. Plus de chance, plus de choix.','Der Boss ließ {n} Relikte fallen: nimm eins. Mehr Glück, mehr Auswahl.','O chefe deixou {n} relíquias: pegue uma. Mais sorte, mais opções.'],
    pickTag:['Scelta del boss','Boss reward','Premio del jefe','Récompense du boss','Boss-Belohnung','Prêmio do chefe'],
    pickOf:['Scegli 1 cimelio tra {n}','Choose 1 of {n} trinkets','Elige 1 de {n} reliquias','Choisis 1 relique sur {n}','Wähle 1 von {n} Relikten','Escolha 1 de {n} relíquias'],
    totemTitle:['Totem','Totem','Tótem','Totem','Totem','Totem'],
    totemSub:['Scegli un solo potere.','Choose a single power.','Elige un solo poder.','Choisis un seul pouvoir.','Wähle nur eine Kraft.','Escolha um único poder.'],
    totemLuckN:['Totem della Fortuna','Totem of Luck','Tótem de la Suerte','Totem de la Chance','Totem des Glücks','Totem da Sorte'],
    totemLuckD:['+1% fortuna a ogni livello, per tutta la partita.','+1% luck on every level-up for the rest of the run.','+1% de suerte en cada nivel durante toda la partida.','+1 % de chance à chaque niveau pour toute la partie.','+1 % Glück bei jedem Levelaufstieg für den Rest des Durchgangs.','+1% de sorte a cada nível durante toda a partida.'],
    totemRiskN:['Totem del Rischio','Totem of Risk','Tótem del Riesgo','Totem du Risque','Totem des Risikos','Totem do Risco'],
    totemRiskD:['Esperienza x2, ma subisci il 50% di danni in più per 150 secondi.','XP x2, but you take 50% more damage for 150 seconds.','XP x2, pero recibes un 50% más de daño durante 150 segundos.','XP x2, mais tu subis 50 % de dégâts en plus pendant 150 secondes.','EP x2, aber du erleidest 150 Sekunden lang 50 % mehr Schaden.','XP x2, mas você sofre 50% mais dano por 150 segundos.'],
    totemPrompt:['Usa il Totem','Use the Totem','Usa el Tótem','Utiliser le Totem','Totem benutzen','Usar o Totem'],
    buffRisk:['Rischio: XP x2','Risk: XP x2','Riesgo: XP x2','Risque : XP x2','Risiko: EP x2','Risco: XP x2'],
    buffTotem:['Totem Fortuna','Luck Totem','Tótem Suerte','Totem Chance','Glückstotem','Totem Sorte'],
    inHeal:['Zona di cura','Healing zone','Zona de curación','Zone de soin','Heilzone','Zona de cura'],
    trialHint:['Pesta i pulsanti rossi: le trappole colpiscono il Maestro!','Step on the red buttons: the traps hit the Master!','¡Pisa los botones rojos: las trampas golpean al Maestro!','Marche sur les boutons rouges : les pièges frappent le Maître !','Tritt auf die roten Knöpfe: die Fallen treffen den Meister!','Pise nos botões vermelhos: as armadilhas atingem o Mestre!'],
    abilityLabel:['Abilità (tasto R)','Ability (key R)','Habilidad (tecla R)','Capacité (touche R)','Fähigkeit (Taste R)','Habilidade (tecla R)'],
    petLabel:['Compagno','Companion','Compañero','Compagnon','Begleiter','Companheiro'],
    petNone:['Nessuno','None','Ninguno','Aucun','Keiner','Nenhum'],
    petNoneDesc:['Nessun compagno: parti da solo.','No companion: you go alone.','Sin compañero: vas solo.','Pas de compagnon : tu pars seul.','Kein Begleiter: du gehst allein.','Sem companheiro: você vai sozinho.'],
    petPassive:['Raccoglie anche l\'esperienza vicina.','Also collects nearby XP.','También recoge la experiencia cercana.','Ramasse aussi l\'expérience proche.','Sammelt auch nahe Erfahrung ein.','Também coleta a experiência próxima.'],
    petCd:['Ricarica {n}s.','Cooldown {n}s.','Recarga {n}s.','Recharge {n}s.','Abklingzeit {n}s.','Recarga {n}s.'],
    act_kaioken:['Abilità del personaggio','Character ability','Habilidad del personaje','Capacité du personnage','Charakter-Fähigkeit','Habilidade do personagem'],
    act_pet:['Abilità compagno','Companion ability','Habilidad del compañero','Capacité du compagnon','Begleiter-Fähigkeit','Habilidade do companheiro']
  };
  for(const k in ADD)ADD[k].forEach((v,i)=>{STR[L[i]][k]=v;});
})();
