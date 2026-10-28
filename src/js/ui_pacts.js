'use strict';
/* ====== v115 UI: Pacts (stage screen, save.pacts) and character Mastery (character screen, end screen) ====== */
Object.assign(UI.prototype,{
  pactsOpen(){return this.testAll()||this.save.clears.some(c=>c>0);},   /* after the first cleared stage */
  pactsBtn(){
    const d=this.save,on=this.pactsOpen(),n=on?d.pacts.length:0,b=Math.round(pactBonus(d.pacts)*100);
    const lab=this.tr(T6('Patti','Pacts','Pactos','Pactes','Pakte','Pactos'));
    return h('button',{class:'btn small'+(n?' pactOn':' alt'),'data-fid':'pacts',disabled:!on,
      title:this.tr(on?T6('Maledizioni volontarie: la partita è più dura, la paga più alta.','Voluntary curses: a harder run, a bigger payout.','Maldiciones voluntarias: partida más dura, mejor paga.','Malédictions volontaires : une partie plus dure, une meilleure paye.','Freiwillige Flüche: härtere Runde, höherer Lohn.','Maldições voluntárias: partida mais difícil, pagamento maior.'):T6('Si sbloccano completando uno scenario.','Unlocked by clearing a stage.','Se desbloquean al completar un escenario.','Débloqués en terminant un scénario.','Werden durch das Abschließen eines Szenarios freigeschaltet.','Desbloqueados ao completar um cenário.')),
      onclick:()=>{this.sfx('uiTab');this.push('pacts');}},'☠ '+lab+(on?(n?' ('+n+') +'+b+'%':''):' 🔒'));
  },
  screen_pacts(){
    const d=this.save,sum=()=>Math.round(pactBonus(d.pacts)*100),tk=()=>d.pacts.length?Math.max(1,Math.floor(pactBonus(d.pacts)/PACT_TK+1e-6)):0;
    const cards=PACTS.map(p=>{const on=d.pacts.includes(p.id);
      return h('button',{class:'card opt pact'+(on?' sel':''),'data-fid':'pk'+p.id,style:'--c:'+p.c,onclick:()=>{
        this.sfx(on?'uiBack':'uiTab');d.pacts=on?d.pacts.filter(x=>x!==p.id):d.pacts.concat(p.id);this.app.save.write();this.rebuild(true);}},
        glyph(p.k,p.c),h('div',{class:'col'},h('div',{class:'cn'},this.tr(p.n)+(on?' ✓':'')),h('div',{class:'cd'},this.tr(p.d)),h('div',{class:'cd pb'},'+'+Math.round(p.b*100)+'% zenny')));});
    const summary=d.pacts.length?this.tr(T6(`Bonus: +${sum()}% zenny e ${tk()} ticket 1× per scenario completato.`,`Bonus: +${sum()}% zenny and ${tk()} 1× ticket(s) per cleared stage.`,`Bonus: +${sum()}% zenny y ${tk()} ticket(s) 1× por escenario completado.`,`Bonus : +${sum()} % de zenny et ${tk()} ticket(s) 1× par scénario terminé.`,`Bonus: +${sum()} % Zenny und ${tk()} 1×-Ticket(s) pro abgeschlossenem Szenario.`,`Bônus: +${sum()}% de zenny e ${tk()} ticket(s) 1× por cenário completado.`))
      :this.tr(T6('Nessun patto attivo.','No active pacts.','Ningún pacto activo.','Aucun pacte actif.','Keine aktiven Pakte.','Nenhum pacto ativo.'));
    return h('div',{class:'center'},this.header(T6('Patti e maledizioni','Pacts & Curses','Pactos y maldiciones','Pactes et malédictions','Pakte und Flüche','Pactos e maldições')),
      h('p',{class:'sub'},this.tr(T6('Scegli le maledizioni per le prossime partite: ognuna rende tutto più difficile e alza la ricompensa. Restano attive finché non le togli.','Pick curses for your next runs: each one makes things harder and raises the reward. They stay on until you remove them.','Elige maldiciones para tus próximas partidas: cada una lo hace todo más difícil y sube la recompensa. Siguen activas hasta que las quites.','Choisis des malédictions pour tes prochaines parties : chacune rend tout plus difficile et augmente la récompense. Elles restent actives jusqu\'à ce que tu les retires.','Wähle Flüche für deine nächsten Runden: jeder macht alles schwerer und erhöht die Belohnung. Sie bleiben aktiv, bis du sie entfernst.','Escolha maldições para as próximas partidas: cada uma deixa tudo mais difícil e aumenta a recompensa. Ficam ativas até você removê-las.'))),
      h('div',{class:'pactgrid'},cards),h('p',{class:'pactsum'},summary),
      h('div',{class:'row'},d.pacts.length?h('button',{class:'btn small alt','data-fid':'pkclear',onclick:()=>{this.sfx('uiBack');d.pacts=[];this.app.save.write();this.rebuild(true);}},this.tr(T6('Togli tutti','Clear all','Quitar todos','Tout retirer','Alle entfernen','Remover todos'))):null,
        this.btn('back',()=>this.pop(),'primary')));
  }
,
  /* character screen: level, bar, the four rewards, the colour picker */
  masteryBox(C){
    const d=this.save,r=(d.mastery||{})[C.id]||{xp:0,skin:0},L=Mastery.lvOf(r.xp),T_=x=>this.tr(x);
    const rw=(lv,txt)=>h('div',{class:'mrw'+(L.lv>=lv?' got':'')},h('i',null,(L.lv>=lv?'✓ ':'🔒 ')+this.t('lv')+' '+lv),h('span',null,txt));
    const skinBtns=MAST_SKINS.map((deg,i)=>{const open=L.lv>=MAST_SKIN_LV[i],on=(r.skin||0)===i;
      return h('button',{class:'btn small mskin'+(on?'':' alt'),'data-fid':'mskin'+i,disabled:!open,style:'--h:'+deg+'deg',title:open?'':this.t('lv')+' '+MAST_SKIN_LV[i],
        onclick:()=>{this.sfx();const rec=Mastery.rec(d,C.id);rec.skin=i;this.app.save.write();this.rebuild(true);}},h('b',{class:'msw'}),i?(open?String.fromCharCode(64+i):'🔒'):T_(T6('Base','Base','Base','Base','Basis','Base')));});
    return h('div',{class:'mastbox'},
      h('div',{class:'mhead'},h('span',{class:'lbl'},T_(T6('Maestria','Mastery','Maestría','Maîtrise','Meisterschaft','Maestria'))),h('b',null,this.t('lv')+' '+L.lv+(L.lv>=MAST_MAX?' ★':'')),
        L.lv>=MAST_TITLE_LV?h('span',{class:'mtitle'},'« '+T_(Mastery.title(C.id))+' »'):null),
      h('div',{class:'mbar'},h('div',{style:'width:'+(L.need?Math.round(100*L.into/L.need):100)+'%'})),
      h('div',{class:'msub'},L.need?L.into+' / '+L.need+' XP':T_(T6('Livello massimo','Max level','Nivel máximo','Niveau max','Maximales Level','Nível máximo'))),
      h('div',{class:'mrws'},rw(MAST_SKIN_LV[1],T_(T6('Colori alternativi A','Alternative colours A','Colores alternativos A','Couleurs alternatives A','Alternative Farben A','Cores alternativas A'))),
        rw(MAST_PASS_LV,T_(T6('Passiva: ','Passive: ','Pasiva: ','Passif : ','Passiv: ','Passiva: '))+T_(Mastery.passiveText(C.id))),
        rw(MAST_SKIN_LV[2],T_(T6('Colori alternativi B','Alternative colours B','Colores alternativos B','Couleurs alternatives B','Alternative Farben B','Cores alternativas B'))),
        rw(MAST_TITLE_LV,T_(T6('Titolo: ','Title: ','Título: ','Titre : ','Titel: ','Título: '))+T_(Mastery.title(C.id)))),
      h('div',{class:'row mskins'},skinBtns));
  },
  /* end screen: XP gained, level-up */
  masteryLine(m){if(!m)return null;const C=CHARS.find(c=>c.id===m.id),up=m.l1>m.l0;
    return h('div',{class:'mline'+(up?' up':'')},h('span',null,this.tr(T6('Maestria ','Mastery ','Maestría ','Maîtrise ','Meisterschaft ','Maestria '))+(C?this.tr(C.n):'')+' · '+this.t('lv')+' '+m.l1+(up?' ▲':'')),
      h('b',null,'+'+m.xp+' XP'),h('div',{class:'mbar'},h('div',{style:'width:'+(m.need?Math.round(100*m.into/m.need):100)+'%'})));}
});
