'use strict';
/* ====== v115: guided first run — contextual hints, each shown once (save.hints), polled from the game state ====== */
const HINT_DUR=7,HINT_GAP=4,HINT_POLL=.5;
/* when(g): the moment it is worth saying; txt(k): k = renderer key labels (k._pad with a gamepad) */
const HINTS=[
  {id:'move',when:g=>g.t>.6,
    txt:k=>T6(`Muoviti con ${k._pad?'lo stick sinistro':'WASD o le frecce'}: le armi sparano da sole.`,`Move with ${k._pad?'the left stick':'WASD or the arrows'}: your weapons fire on their own.`,`Muévete con ${k._pad?'el stick izquierdo':'WASD o las flechas'}: tus armas disparan solas.`,`Déplace-toi avec ${k._pad?'le stick gauche':'ZQSD/WASD ou les flèches'} : tes armes tirent toutes seules.`,`Bewege dich mit ${k._pad?'dem linken Stick':'WASD oder den Pfeiltasten'}: deine Waffen feuern von selbst.`,`Mova-se com ${k._pad?'o analógico esquerdo':'WASD ou as setas'}: suas armas atiram sozinhas.`)},
  {id:'gem',when:g=>g.gm.length>0&&g.t>4,
    txt:()=>T6('Raccogli le gemme dei nemici: riempiono la barra e ti fanno salire di livello.','Pick up the gems enemies drop: they fill the bar and level you up.','Recoge las gemas de los enemigos: llenan la barra y te suben de nivel.','Ramasse les gemmes des ennemis : elles remplissent la barre et te font monter de niveau.','Sammle die Edelsteine der Gegner: sie füllen die Leiste und bringen dich ein Level höher.','Pegue as gemas dos inimigos: elas enchem a barra e sobem seu nível.')},
  {id:'level',when:g=>g.lvl>=2,
    txt:()=>T6('A ogni livello scegli un\'arma o un potenziamento: un\'arma al massimo più il suo potenziamento abbinato si evolve da uno scrigno.','Each level, pick a weapon or an upgrade: a maxed weapon plus its matching upgrade evolves from a chest.','En cada nivel elige un arma o una mejora: un arma al máximo con su mejora asociada evoluciona en un cofre.','À chaque niveau, choisis une arme ou une amélioration : une arme au maximum avec son amélioration associée évolue dans un coffre.','Wähle bei jedem Level eine Waffe oder Verbesserung: eine maximierte Waffe mit passender Verbesserung entwickelt sich aus einer Truhe.','A cada nível, escolha uma arma ou melhoria: uma arma no máximo com sua melhoria correspondente evolui de um baú.')},
  {id:'dash',when:g=>g.t>22,
    txt:k=>T6(`[${k.dash||'Shift'}] scatto: attraversi i nemici senza subire danni.`,`[${k.dash||'Shift'}] dash: you pass through enemies without taking damage.`,`[${k.dash||'Shift'}] esquiva: atraviesas a los enemigos sin recibir daño.`,`[${k.dash||'Shift'}] ruée : tu traverses les ennemis sans subir de dégâts.`,`[${k.dash||'Shift'}] Sprint: du durchquerst Gegner ohne Schaden.`,`[${k.dash||'Shift'}] avanço: você atravessa os inimigos sem sofrer dano.`)},
  {id:'ability',when:g=>g.t>40&&g.abReady,
    txt:k=>T6(`[${k.kaioken||'R'}] abilità speciale del personaggio: tienila per i momenti difficili.`,`[${k.kaioken||'R'}] your character's special ability: save it for tough moments.`,`[${k.kaioken||'R'}] habilidad especial del personaje: guárdala para los momentos difíciles.`,`[${k.kaioken||'R'}] capacité spéciale du personnage : garde-la pour les moments difficiles.`,`[${k.kaioken||'R'}] Spezialfähigkeit der Figur: heb sie dir für harte Momente auf.`,`[${k.kaioken||'R'}] habilidade especial do personagem: guarde-a para os momentos difíceis.`)},
  {id:'kcharge',when:g=>g.t>60&&g.weapons.has('kame'),
    txt:k=>T6(`Tieni premuto [${k.kaioken||'R'}] per caricare un Kamehameha più grosso.`,`Hold [${k.kaioken||'R'}] to charge a bigger Kamehameha.`,`Mantén [${k.kaioken||'R'}] para cargar un Kamehameha más grande.`,`Maintiens [${k.kaioken||'R'}] pour charger un Kamehameha plus gros.`,`Halte [${k.kaioken||'R'}] gedrückt für ein größeres Kamehameha.`,`Segure [${k.kaioken||'R'}] para carregar um Kamehameha maior.`)},
  {id:'senzu',when:g=>g.senzu>0&&g.p.hp<g.p.maxHp*.6,
    txt:k=>T6(`[${k.senzu||'F'}] mangia un Fagiolo Senzu per curarti.`,`[${k.senzu||'F'}] eat a Senzu Bean to heal.`,`[${k.senzu||'F'}] come una Semilla del Ermitaño para curarte.`,`[${k.senzu||'F'}] mange un Haricot Magique pour te soigner.`,`[${k.senzu||'F'}] iss eine Magische Bohne, um dich zu heilen.`,`[${k.senzu||'F'}] coma um Feijão dos Deuses para se curar.`)},
  {id:'chest',when:g=>g.chests.length>0,
    txt:()=>T6('Uno scrigno! Toccalo per armi, potenziamenti e cimeli.','A chest! Touch it for weapons, upgrades and trinkets.','¡Un cofre! Tócalo para armas, mejoras y reliquias.','Un coffre ! Touche-le pour des armes, des améliorations et des reliques.','Eine Truhe! Berühre sie für Waffen, Verbesserungen und Relikte.','Um baú! Toque nele para armas, melhorias e relíquias.')},
  {id:'ball',when:g=>g.loot.some(l=>l.k==='ball'&&!l.alt),
    txt:()=>T6('Una Sfera del Drago! Raccoglile tutte e 7 per evocare Shenron ed esprimere un desiderio.','A Dragon Ball! Gather all 7 to summon Shenron and make a wish.','¡Una Esfera del Dragón! Reúne las 7 para invocar a Shenlong y pedir un deseo.','Une Dragon Ball ! Réunis les 7 pour invoquer Shenron et faire un vœu.','Ein Dragonball! Sammle alle 7, um Shenlong zu rufen und dir etwas zu wünschen.','Uma Esfera do Dragão! Junte as 7 para invocar Shenlong e fazer um desejo.')},
  {id:'form',when:g=>g.formsUnlocked>0,
    txt:()=>T6('Trasformazione! Ogni forma rende più forte il personaggio: le prossime arrivano salendo di livello.','Transformation! Each form makes your character stronger: the next ones come as you level up.','¡Transformación! Cada forma hace más fuerte al personaje: las siguientes llegan al subir de nivel.','Transformation ! Chaque forme rend ton personnage plus fort : les suivantes arrivent en montant de niveau.','Verwandlung! Jede Form macht deine Figur stärker: die nächsten kommen mit den Levels.','Transformação! Cada forma deixa seu personagem mais forte: as próximas vêm subindo de nível.')},
];
const Hints={
  on(g){const s=g.save;return !!s&&!(s.settings&&s.settings.hints===false)&&!(s.hints&&s.hints._vet);},
  /* polled from Game.update: one hint at a time, a short gap between two, never during a window or the summoning */
  tick(g,dt){
    const H=g.hintS||(g.hintS={cur:null,gap:1,poll:0});
    if(H.cur){H.cur.t+=dt;if(H.cur.t>=HINT_DUR){H.cur=null;H.gap=HINT_GAP;}return;}
    if(H.gap>0){H.gap-=dt;return;}
    if((H.poll-=dt)>0)return;H.poll=HINT_POLL;
    if(g.modal||g.summon||g.ended||!this.on(g))return;
    const seen=g.save.hints||(g.save.hints={});
    for(const h of HINTS)if(!seen[h.id]&&h.when(g)){seen[h.id]=1;H.cur={id:h.id,t:0};if(g.env.save&&g.env.save.write)g.env.save.write();return;}
  },
  /* all hints come back (Settings) */
  reset(save){save.hints={};},
  text(id,k){const h=HINTS.find(x=>x.id===id);return h?h.txt(k||{}):'';}
};
