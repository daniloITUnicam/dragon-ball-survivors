'use strict';
/* ====== v115 UI: leaderboards + weekly challenge (main menu), nickname, the share card (end screen) ====== */
const OT={
  boards:T6('Classifiche','Leaderboards','Clasificaciones','Classements','Bestenlisten','Classificações'),
  weekly:T6('Sfida settimanale','Weekly challenge','Desafío semanal','Défi hebdomadaire','Wochen-Herausforderung','Desafio semanal'),
  byStage:T6('Per scenario','By stage','Por escenario','Par scénario','Nach Szenario','Por cenário'),
  m_t:T6('Tempo','Time','Tiempo','Temps','Zeit','Tempo'),m_kills:T6('Uccisioni','Kills','Bajas','Éliminations','Kills','Abates'),m_dmg:T6('Danni','Damage','Daño','Dégâts','Schaden','Dano'),
  nick:T6('Soprannome','Nickname','Apodo','Pseudo','Spitzname','Apelido'),save:T6('Salva','Save','Guardar','Enregistrer','Speichern','Salvar'),
  nickHint:T6('3-16 caratteri: lettere, numeri, spazio . _ -','3-16 characters: letters, digits, space . _ -','3-16 caracteres: letras, números, espacio . _ -','3-16 caractères : lettres, chiffres, espace . _ -','3-16 Zeichen: Buchstaben, Ziffern, Leerzeichen . _ -','3-16 caracteres: letras, números, espaço . _ -'),
  nickTaken:T6('Soprannome già usato.','Nickname already taken.','Apodo ya en uso.','Pseudo déjà pris.','Spitzname schon vergeben.','Apelido já em uso.'),
  nickBad:T6('Soprannome non valido.','Invalid nickname.','Apodo no válido.','Pseudo invalide.','Ungültiger Spitzname.','Apelido inválido.'),
  netErr:T6('Connessione non riuscita.','Connection failed.','Conexión fallida.','Connexion échouée.','Verbindung fehlgeschlagen.','Falha na conexão.'),
  signIn:T6('Accedi con un account per comparire in classifica.','Sign in with an account to appear on the boards.','Inicia sesión con una cuenta para aparecer en las clasificaciones.','Connecte-toi à un compte pour apparaître dans les classements.','Melde dich mit einem Konto an, um in den Bestenlisten zu erscheinen.','Entre com uma conta para aparecer nas classificações.'),
  needNick:T6('Scegli un soprannome: in classifica si vede solo quello.','Pick a nickname: it is all the boards show of you.','Elige un apodo: es lo único que muestran las clasificaciones.','Choisis un pseudo : c\'est tout ce que les classements montrent de toi.','Wähle einen Spitznamen: nur er erscheint in den Bestenlisten.','Escolha um apelido: é só isso que as classificações mostram.'),
  offline:T6('Online non disponibile in questa versione.','Online is not available in this build.','Online no disponible en esta versión.','En ligne indisponible dans cette version.','Online in dieser Version nicht verfügbar.','Online indisponível nesta versão.'),
  loading:T6('Caricamento…','Loading…','Cargando…','Chargement…','Laden…','Carregando…'),
  empty:T6('Ancora nessun punteggio: sii il primo!','No scores yet: be the first!','Aún no hay puntuaciones: ¡sé el primero!','Pas encore de score : sois le premier !','Noch keine Punkte: sei der Erste!','Nenhuma pontuação ainda: seja o primeiro!'),
  play:T6('Gioca la sfida','Play the challenge','Jugar el desafío','Jouer le défi','Herausforderung spielen','Jogar o desafio'),
  ends:T6('Termina tra','Ends in','Termina en','Se termine dans','Endet in','Termina em'),
  sameFor:T6('Stesso scenario, personaggio, difficoltà e generazione casuale per tutti. Nessun patto.','Same stage, character, difficulty and random generation for everybody. No pacts.','Mismo escenario, personaje, dificultad y generación aleatoria para todos. Sin pactos.','Même scénario, personnage, difficulté et génération aléatoire pour tous. Sans pactes.','Gleiches Szenario, gleiche Figur, Schwierigkeit und Zufallsgenerierung für alle. Keine Pakte.','Mesmo cenário, personagem, dificuldade e geração aleatória para todos. Sem pactos.'),
  share:T6('Scheda da condividere','Share card','Ficha para compartir','Carte à partager','Teilen-Karte','Card para compartilhar'),
  copied:T6('Scheda copiata negli appunti e scaricata: incollala su Discord.','Card copied to the clipboard and downloaded: paste it in Discord.','Ficha copiada al portapapeles y descargada: pégala en Discord.','Carte copiée dans le presse-papiers et téléchargée : colle-la sur Discord.','Karte in die Zwischenablage kopiert und heruntergeladen: in Discord einfügen.','Card copiado para a área de transferência e baixado: cole no Discord.'),
  saved:T6('Scheda scaricata.','Card downloaded.','Ficha descargada.','Carte téléchargée.','Karte heruntergeladen.','Card baixado.'),
  comm:T6('Comunità','Community','Comunidad','Communauté','Community','Comunidade'),
  commD:T6('Obiettivi della settimana per tutti i giocatori insieme: le partite di ognuno contano. Quando un obiettivo è raggiunto, tutti riscattano un Ticket 10× Fortunato.','This week\'s goals for all players together: everybody\'s runs count. When a goal is reached, everybody claims a Lucky Ticket 10×.','Objetivos de la semana para todos los jugadores juntos: cuentan las partidas de todos. Al alcanzar un objetivo, todos reclaman un Ticket 10× de la Suerte.','Objectifs de la semaine pour tous les joueurs ensemble : les parties de chacun comptent. Quand un objectif est atteint, tout le monde récupère un Ticket 10× Chanceux.','Wochenziele für alle Spieler zusammen: jede Runde zählt. Ist ein Ziel erreicht, holt sich jeder ein Glücksticket 10×.','Metas da semana para todos os jogadores juntos: as partidas de todos contam. Quando uma meta é atingida, todos resgatam um Ticket 10× da Sorte.'),
  claim:T6('Riscatta','Claim','Reclamar','Récupérer','Abholen','Resgatar'),got:T6('Riscattato','Claimed','Reclamado','Récupéré','Abgeholt','Resgatado'),reward:T6('Ticket 10× Fortunato','Lucky Ticket 10×','Ticket 10× de la Suerte','Ticket 10× Chanceux','Glücksticket 10×','Ticket 10× da Sorte'),
  claimed:T6('Ticket 10× Fortunato aggiunto!','Lucky Ticket 10× added!','¡Ticket 10× de la Suerte añadido!','Ticket 10× Chanceux ajouté !','Glücksticket 10× hinzugefügt!','Ticket 10× da Sorte adicionado!'),
  sent:T6('Punteggio in classifica!','Score posted to the board!','¡Puntuación en la clasificación!','Score publié au classement !','Punkte in der Bestenliste!','Pontuação na classificação!')
};
Object.assign(UI.prototype,{
  boardsBtn(){return h('button',{class:'btn','data-fid':'boards',onclick:()=>{this.sfx();this.push('boards',{tab:'weekly'});}},'🏆 '+this.tr(OT.boards));},
  nickRow(){
    const cl=this.app.cloud;
    if(!cl.enabled)return h('p',{class:'sub'},this.tr(OT.offline));
    if(!cl.uid)return h('div',{class:'row nickrow'},h('span',null,this.tr(OT.signIn)),h('button',{class:'btn small','data-fid':'bacct',onclick:()=>{this.sfx();this.push('account');}},'👤'));
    const st=this.nickEdit||(this.nickEdit={on:!cl.nick,msg:''});
    if(cl.nick&&!st.on)return h('div',{class:'row nickrow'},h('span',null,this.tr(OT.nick)+': '),h('b',null,cl.nick),h('button',{class:'btn small alt','data-fid':'nedit',onclick:()=>{st.on=true;st.msg='';this.rebuild(true);}},'✎'));
    const inp=h('input',{type:'text',maxlength:16,value:cl.nick||'','data-fid':'nick',placeholder:this.tr(OT.nick)});
    const go=async()=>{const e=await cl.setNick(inp.value);if(!e){st.on=false;st.msg='';this.sfx('buy');}else{st.msg=this.tr(e==='taken'?OT.nickTaken:e==='net'?OT.netErr:OT.nickBad);}this.rebuild(true);};
    inp.addEventListener('keydown',ev=>{ev.stopPropagation();if(ev.key==='Enter')go();});
    return h('div',{class:'nickbox'},h('p',{class:'sub'},this.tr(OT.needNick)),h('div',{class:'row nickrow'},inp,h('button',{class:'btn small primary','data-fid':'nsave',onclick:go},this.tr(OT.save))),
      h('p',{class:'sub nickmsg'},st.msg||this.tr(OT.nickHint)));
  },
  /* the list fills itself when the server answers (and only if the screen is still the same one) */
  boardList(stage,diff,metric,week){
    const box=h('div',{class:'blist'},h('p',{class:'sub'},this.tr(OT.loading)));const cl=this.app.cloud;
    if(!cl.enabled){box.textContent=this.tr(OT.offline);return box;}
    cl.board(stage,diff,metric,week).then(rows=>{box.innerHTML='';
      if(!rows.length){box.appendChild(h('p',{class:'sub'},this.tr(OT.empty)));return;}
      for(const r of rows){const C=CHARS.find(c=>c.id===r.ch);
        box.appendChild(h('div',{class:'brow'+(r.me?' me':'')+(r.rank<=3?' top'+r.rank:'')},h('i',null,'#'+r.rank),h('b',null,r.nick,r.title&&TITLES.text(r.title)?h('small',{class:'btitle'},' « '+this.tr(TITLES.text(r.title))+' »'):null),h('span',{class:'bch'},C?this.tr(C.n):r.ch),
          h('span',{class:'bmeta'},'Lv '+r.lvl+(r.pacts?' ☠'+r.pacts:'')+(r.win?' ✓':'')),h('span',{class:'bval'},Online.fmt(metric,r))));}
    }).catch(()=>{box.innerHTML='';box.appendChild(h('p',{class:'sub'},this.tr(OT.netErr)));});
    return box;
  },
  screen_boards(a){
    a=a||{};const st=this.bsel||(this.bsel={tab:a.tab||'weekly',stage:this.save.lastStage||0,diff:'normal',metric:'t'});if(a.tab&&!this._bInit){st.tab=a.tab;}this._bInit=true;
    const tabs=h('div',{class:'row tabs'},[['weekly',OT.weekly],['stage',OT.byStage],['comm',OT.comm]].map(([k,l])=>h('button',{class:'btn small'+(st.tab===k?'':' alt'),'data-fid':'bt'+k,onclick:()=>{this.sfx('uiTab');st.tab=k;this.rebuild(true);}},this.tr(l))));
    const mets=h('div',{class:'row'},BOARD_METRICS.map(m=>h('button',{class:'btn small'+(st.metric===m?'':' alt'),'data-fid':'bm'+m,onclick:()=>{this.sfx();st.metric=m;this.rebuild(true);}},this.tr(OT['m_'+m]))));
    let body;
    if(st.tab==='weekly'){
      const w=Online.weekly(),C=CHARS.find(c=>c.id===w.char),S=STAGES[w.stage],left=Online.weekLeft(),dd=Math.floor(left/864e5),hh=Math.floor(left%864e5/36e5);
      body=[h('div',{class:'wkcard'},h('div',{class:'wkh'},h('b',null,'🗓 '+w.id),h('span',null,this.tr(OT.ends)+' '+dd+'d '+hh+'h')),
        h('div',{class:'wkrow'},h('span',null,'🌍 '+this.tr(S.n)),h('span',null,'🥋 '+this.tr(C.n)),h('span',null,'⚔ '+this.tr(DIFF[w.diff].n))),
        h('p',{class:'sub'},this.tr(OT.sameFor)),
        h('button',{class:'btn primary','data-fid':'wkplay',onclick:()=>{this.sfx('uiStart');this.app.startGame({stage:w.stage,char:w.char,diff:w.diff,x2:false,sandbox:false,pet:this.save.pet,week:w.id,seed:w.seed});}},'▶ '+this.tr(OT.play))),
        mets,this.boardList(w.stage,w.diff,st.metric,w.id)];
    }else if(st.tab==='comm'){body=[h('p',{class:'sub'},this.tr(OT.commD)),this.commList()];
    }else{
      const ss=h('select',{'data-fid':'bstage',onchange:()=>{st.stage=+ss.value;this.rebuild(true);}},STAGE_ORDER.map(i=>h('option',{value:i,selected:st.stage===i},'S'+STAGES[i].no+' '+this.tr(STAGES[i].n))));
      const sd=h('select',{'data-fid':'bdiff',onchange:()=>{st.diff=sd.value;this.rebuild(true);}},Object.keys(DIFF).map(k=>h('option',{value:k,selected:st.diff===k},this.tr(DIFF[k].n))));
      body=[h('div',{class:'row'},ss,sd),mets,this.boardList(st.stage,st.diff,st.metric,null)];
    }
    return h('div',{class:'center boards'},this.header(OT.boards),this.nickRow(),tabs,...body);
  },
  /* v116: the week's community events: progress of everybody's runs, a Lucky Ticket 10× to claim when a goal is reached */
  commList(){const box=h('div',{class:'clist'},h('p',{class:'sub'},this.tr(OT.loading))),cl=this.app.cloud,evs=COMMUNITY.events(),d=this.save;
    if(!cl.enabled){box.textContent=this.tr(OT.offline);return box;}
    cl.community().then(tot=>{box.innerHTML='';for(const ev of evs){const v=tot[ev.key]||0,done=v>=ev.goal,got=!!(d.comm||{})[COMMUNITY.claimKey(ev)];
      box.appendChild(h('div',{class:'crow'+(done?' done':'')},h('b',null,this.tr(COMMUNITY.name(ev))),h('div',{class:'mbar'},h('div',{style:'width:'+Math.min(100,Math.round(100*v/ev.goal))+'%'})),
        h('div',{class:'cfoot'},h('span',null,v.toLocaleString()+' / '+ev.goal.toLocaleString()),
          done?h('button',{class:'btn small'+(got?' alt':' primary'),disabled:got,'data-fid':'cc'+ev.id,onclick:()=>{if(COMMUNITY.claim(this.app,ev)){this.sfx('buy');this.toast({type:'info',msg:this.tr(OT.claimed)});this.rebuild(true);}}},got?'✓ '+this.tr(OT.got):'🎟 '+this.tr(OT.claim)):h('span',{class:'crew'},'🎟 '+this.tr(OT.reward)))));}
    }).catch(()=>{box.innerHTML='';box.appendChild(h('p',{class:'sub'},this.tr(OT.netErr)));});
    return box;},
  shareBtn(res){const g=this.app.game;if(!g||!res)return null;
    return h('button',{class:'btn alt','data-fid':'share',onclick:async()=>{this.sfx();try{const c=Online.card(g,res,x=>this.tr(x));const ok=await Online.share(c,'dbs-'+g.C.id+'-'+STAGES[g.stageIdx].id+'.png');this.toast({type:'info',msg:this.tr(ok?OT.copied:OT.saved)});}catch(e){this.toast({type:'info',msg:String(e.message||e)});}}},'📸 '+this.tr(OT.share));}
});
