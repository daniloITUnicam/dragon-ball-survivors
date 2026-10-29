'use strict';
/* ====== v119 UI: co-op hub (main menu > Co-op) and the room lobby. Layout: three columns of coloured panels, a bottom bar in the room.
   Both screens are built once and then patched in place by COOP events (inputs keep their focus and text). ====== */
const CO={
  title:T6('Co-op','Co-op','Cooperativo','Coop','Koop','Co-op'),sub:T6('Gioca con i tuoi amici','Play with your friends','Juega con tus amigos','Joue avec tes amis','Spiel mit deinen Freunden','Jogue com seus amigos'),
  withF:T6('Con gli amici','With friends','Con amigos','Avec des amis','Mit Freunden','Com amigos'),n24:T6('2-4 giocatori','2-4 players','2-4 jugadores','2-4 joueurs','2-4 Spieler','2-4 jogadores'),
  create:T6('Crea una stanza','Create a room','Crear una sala','Créer un salon','Raum erstellen','Criar uma sala'),createD:T6('Scegli tu mappa e difficoltà, poi invita i tuoi amici.','You pick the map and the difficulty, then invite your friends.','Tú eliges mapa y dificultad, luego invitas a tus amigos.','Tu choisis la carte et la difficulté, puis invites tes amis.','Du wählst Karte und Schwierigkeit und lädst dann deine Freunde ein.','Você escolhe o mapa e a dificuldade e depois convida seus amigos.'),
  or:T6('OPPURE','OR','O','OU','ODER','OU'),joinC:T6('Entra con un codice','Join with a code','Entrar con un código','Rejoindre avec un code','Mit Code beitreten','Entrar com um código'),joinD:T6('Te lo dà chi ha creato la stanza.','The room creator gives it to you.','Te lo da quien creó la sala.','Le créateur du salon te le donne.','Der Ersteller des Raums gibt ihn dir.','Quem criou a sala te passa.'),
  join:T6('Entra','Join','Entrar','Rejoindre','Beitreten','Entrar'),how:T6('Come si gioca','How to play','Cómo se juega','Comment jouer','So wird gespielt','Como jogar'),
  find:T6('Trova una partita','Find a match','Buscar partida','Trouver une partie','Spiel finden','Encontrar partida'),findD:T6('Ti mettiamo in squadra con altri giocatori che cercano compagni.','We team you up with other players who are also looking for a team.','Te emparejamos con otros jugadores que también buscan equipo.','On t\'associe à d\'autres joueurs qui cherchent aussi une équipe.','Wir bringen dich mit anderen Spielern zusammen, die auch ein Team suchen.','Juntamos você com outros jogadores que também procuram equipe.'),
  searching:n=>T6(n+' giocatori in cerca ora',n+' players searching now',n+' jugadores buscando ahora',n+' joueurs en recherche',n+' Spieler suchen gerade',n+' jogadores procurando agora'),
  mode:T6('MODALITÀ','MODE','MODO','MODE','MODUS','MODO'),team:T6('SQUADRA','TEAM','EQUIPO','ÉQUIPE','TEAM','EQUIPE'),map:T6('MAPPA','MAP','MAPA','CARTE','KARTE','MAPA'),diff:T6('DIFFICOLTÀ','DIFFICULTY','DIFICULTAD','DIFFICULTÉ','SCHWIERIGKEIT','DIFICULDADE'),
  any:T6('Qualsiasi','Any','Cualquiera','Toutes','Beliebig','Qualquer'),classic:T6('Classico','Classic','Clásico','Classique','Klassisch','Clássico'),endless:T6('Infinito','Endless','Infinito','Infini','Endlos','Infinito'),
  duo:T6('Duo','Duo','Dúo','Duo','Duo','Dupla'),trio:T6('Trio','Trio','Trío','Trio','Trio','Trio'),squad:T6('Squadra','Squad','Escuadra','Escouade','Squad','Esquadrão'),
  board:T6('Classifica co-op','Co-op leaderboard','Clasificación cooperativa','Classement coop','Koop-Bestenliste','Classificação co-op'),best:T6('LA TUA MIGLIOR SQUADRA','YOUR BEST TEAM','TU MEJOR EQUIPO','TA MEILLEURE ÉQUIPE','DEIN BESTES TEAM','SUA MELHOR EQUIPE'),
  noTeam:T6('Ancora nessuna squadra in questa classifica','No team on this board yet','Aún no hay equipo en esta clasificación','Pas encore d\'équipe dans ce classement','Noch kein Team in dieser Liste','Nenhuma equipe nesta classificação ainda'),
  boardSoon:T6('Le squadre compariranno qui con le partite co-op (in arrivo).','Teams will show up here with co-op runs (coming soon).','Los equipos aparecerán aquí con las partidas cooperativas (próximamente).','Les équipes apparaîtront ici avec les parties coop (bientôt).','Teams erscheinen hier mit den Koop-Runden (bald).','As equipes aparecerão aqui com as partidas co-op (em breve).'),
  invites:T6('Inviti','Invitations','Invitaciones','Invitations','Einladungen','Convites'),invitesE:T6('Quando un amico ti invita nella sua stanza, compare qui.','When a friend invites you to their room, it will show up here.','Cuando un amigo te invite a su sala, aparecerá aquí.','Quand un ami t\'invite dans son salon, ça apparaît ici.','Wenn dich ein Freund in seinen Raum einlädt, erscheint es hier.','Quando um amigo te convidar para a sala dele, aparece aqui.'),
  invitesYou:n=>T6(n+' ti invita',n+' invites you',n+' te invita',n+' t\'invite',n+' lädt dich ein',n+' te convida'),
  friendReq:n=>T6(n+' vuole essere tuo amico',n+' wants to be your friend',n+' quiere ser tu amigo',n+' veut être ton ami',n+' möchte dein Freund sein',n+' quer ser seu amigo'),
  accept:T6('Accetta','Accept','Aceptar','Accepter','Annehmen','Aceitar'),decline:T6('Rifiuta','Decline','Rechazar','Refuser','Ablehnen','Recusar'),
  inRoom:c=>T6('Sei nella stanza '+c,'You are in room '+c,'Estás en la sala '+c,'Tu es dans le salon '+c,'Du bist in Raum '+c,'Você está na sala '+c),back:T6('Torna alla stanza','Back to the room','Volver a la sala','Retour au salon','Zurück zum Raum','Voltar à sala'),
  room:T6('Stanza','Room','Sala','Salon','Raum','Sala'),leave:T6('Esci dalla stanza','Leave room','Salir de la sala','Quitter le salon','Raum verlassen','Sair da sala'),
  dest:T6('Destinazione','Destination','Destino','Destination','Ziel','Destino'),youDecide:T6('Scegli tu','You decide','Decides tú','Tu décides','Du entscheidest','Você decide'),hostDecides:T6('Sceglie l\'host','The host decides','Decide el anfitrión','L\'hôte décide','Der Host entscheidet','O anfitrião decide'),
  yourTeam:T6('La tua squadra','Your team','Tu equipo','Ton équipe','Dein Team','Sua equipe'),you:T6('Tu','You','Tú','Toi','Du','Você'),readyB:T6('Pronto','Ready','Listo','Prêt','Bereit','Pronto'),
  slotS:T6('In cerca…','Searching…','Buscando…','Recherche…','Suche…','Procurando…'),slotF:T6('Posto libero','Free slot','Plaza libre','Place libre','Freier Platz','Vaga livre'),slotI:T6('Oppure invita un amico','Or invite a friend','O invita a un amigo','Ou invite un ami','Oder lade einen Freund ein','Ou convide um amigo'),
  chat:T6('Chat della stanza','Room chat','Chat de la sala','Chat du salon','Raum-Chat','Chat da sala'),chatC:T6('Cancellata all\'avvio','Cleared at start','Se borra al empezar','Effacé au départ','Wird beim Start gelöscht','Apagado no início'),
  chatE:T6('Saluta la squadra. I messaggi si cancellano quando parte la partita.','Say hi to your team. Messages are deleted when the run starts.','Saluda a tu equipo. Los mensajes se borran al empezar la partida.','Dis bonjour à ton équipe. Les messages sont effacés au départ.','Sag deinem Team hallo. Nachrichten werden beim Start gelöscht.','Diga oi para a equipe. As mensagens são apagadas quando a partida começa.'),
  msg:T6('Scrivi alla stanza…','Message the room…','Escribe a la sala…','Écris au salon…','Schreib dem Raum…','Escreva para a sala…'),
  invite:T6('Invita','Invite','Invitar','Inviter','Einladen','Convidar'),findMates:T6('Trova compagni','Find teammates','Buscar compañeros','Trouver des équipiers','Mitspieler finden','Encontrar parceiros'),
  findMatesD:T6('Chi cerca una partita può entrare finché la squadra non è completa.','Anyone looking for a match can join until the team is complete.','Quien busque partida puede entrar hasta completar el equipo.','Ceux qui cherchent une partie peuvent rejoindre tant que l\'équipe n\'est pas complète.','Wer ein Spiel sucht, kann beitreten, bis das Team voll ist.','Quem procura partida pode entrar até a equipe ficar completa.'),
  code:T6('CODICE STANZA','ROOM CODE','CÓDIGO DE SALA','CODE DU SALON','RAUMCODE','CÓDIGO DA SALA'),copy:T6('Copia link','Copy link','Copiar enlace','Copier le lien','Link kopieren','Copiar link'),share:T6('Condividi','Share','Compartir','Partager','Teilen','Compartilhar'),
  copied:T6('Copiato!','Copied!','¡Copiado!','Copié !','Kopiert!','Copiado!'),friends:T6('Amici','Friends','Amigos','Amis','Freunde','Amigos'),
  noFriends:T6('Non hai ancora amici: aggiungili con il loro soprannome.','You have no friends yet: add them by their nickname.','Aún no tienes amigos: añádelos con su apodo.','Tu n\'as pas encore d\'amis : ajoute-les avec leur pseudo.','Du hast noch keine Freunde: füge sie mit ihrem Spitznamen hinzu.','Você ainda não tem amigos: adicione pelo apelido.'),
  addF:T6('Aggiungi','Add','Añadir','Ajouter','Hinzufügen','Adicionar'),nickPh:T6('Soprannome','Nickname','Apodo','Pseudo','Spitzname','Apelido'),pending:T6('In attesa','Pending','Pendiente','En attente','Ausstehend','Pendente'),
  online:T6('online','online','en línea','en ligne','online','online'),offline:T6('offline','offline','desconectado','hors ligne','offline','offline'),inviteSent:T6('Invito inviato!','Invite sent!','¡Invitación enviada!','Invitation envoyée !','Einladung gesendet!','Convite enviado!'),
  nOfReady:(a,b)=>T6(a+' di '+b+' pronti',a+' of '+b+' ready',a+' de '+b+' listos',a+' sur '+b+' prêts',a+' von '+b+' bereit',a+' de '+b+' prontos'),need2:T6('Servono almeno 2 giocatori','At least 2 players are needed','Se necesitan al menos 2 jugadores','Il faut au moins 2 joueurs','Mindestens 2 Spieler nötig','São necessários pelo menos 2 jogadores'),
  allReady:T6('Tutti pronti!','Everyone is ready!','¡Todos listos!','Tout le monde est prêt !','Alle bereit!','Todos prontos!'),waitReady:T6('In attesa che tutti siano pronti','Waiting for everyone to be ready','Esperando a que todos estén listos','En attente que tout le monde soit prêt','Warten, bis alle bereit sind','Esperando todos ficarem prontos'),
  destB:T6('DESTINAZIONE','DESTINATION','DESTINO','DESTINATION','ZIEL','DESTINO'),start:T6('Avvia!','Start!','¡Empezar!','Lancer !','Start!','Começar!'),imReady:T6('Sono pronto!','I\'m ready!','¡Estoy listo!','Je suis prêt !','Ich bin bereit!','Estou pronto!'),notReady:T6('Non pronto','Not ready','No listo','Pas prêt','Nicht bereit','Não pronto'),
  gone:T6('Non sei più nella stanza.','You are no longer in the room.','Ya no estás en la sala.','Tu n\'es plus dans le salon.','Du bist nicht mehr im Raum.','Você não está mais na sala.'),
  pick:T6('Scegli il personaggio','Pick your character','Elige tu personaje','Choisis ton personnage','Wähle deine Figur','Escolha seu personagem'),
  err:{not_found:T6('Stanza non trovata.','Room not found.','Sala no encontrada.','Salon introuvable.','Raum nicht gefunden.','Sala não encontrada.'),full:T6('La stanza è piena.','The room is full.','La sala está llena.','Le salon est plein.','Der Raum ist voll.','A sala está cheia.'),
    started:T6('La partita è già iniziata.','The run has already started.','La partida ya empezó.','La partie a déjà commencé.','Die Runde hat schon begonnen.','A partida já começou.'),bad:T6('Il codice ha 4 caratteri.','The code has 4 characters.','El código tiene 4 caracteres.','Le code a 4 caractères.','Der Code hat 4 Zeichen.','O código tem 4 caracteres.'),
    self:T6('Quello sei tu!','That is you!','¡Ese eres tú!','C\'est toi !','Das bist du!','Esse é você!'),already:T6('Siete già amici.','You are already friends.','Ya sois amigos.','Vous êtes déjà amis.','Ihr seid schon Freunde.','Vocês já são amigos.'),
    sent:T6('Richiesta inviata.','Request sent.','Solicitud enviada.','Demande envoyée.','Anfrage gesendet.','Pedido enviado.'),accepted:T6('Ora siete amici!','You are friends now!','¡Ahora sois amigos!','Vous êtes amis !','Ihr seid jetzt Freunde!','Agora vocês são amigos!'),
    too_many:T6('Troppe richieste in sospeso.','Too many pending requests.','Demasiadas solicitudes pendientes.','Trop de demandes en attente.','Zu viele offene Anfragen.','Pedidos pendentes demais.'),not_friend:T6('Puoi invitare solo i tuoi amici.','You can only invite your friends.','Solo puedes invitar a tus amigos.','Tu ne peux inviter que tes amis.','Du kannst nur Freunde einladen.','Você só pode convidar amigos.'),
    net:T6('Connessione non riuscita.','Connection failed.','Conexión fallida.','Connexion échouée.','Verbindung fehlgeschlagen.','Falha na conexão.')},
  how1:T6('Crea una stanza o entra con il codice di un amico.','Create a room or join with a friend\'s code.','Crea una sala o entra con el código de un amigo.','Crée un salon ou rejoins avec le code d\'un ami.','Erstelle einen Raum oder tritt mit dem Code eines Freundes bei.','Crie uma sala ou entre com o código de um amigo.'),
  how2:T6('L\'host sceglie mappa, modalità e difficoltà.','The host picks map, mode and difficulty.','El anfitrión elige mapa, modo y dificultad.','L\'hôte choisit la carte, le mode et la difficulté.','Der Host wählt Karte, Modus und Schwierigkeit.','O anfitrião escolhe mapa, modo e dificuldade.'),
  how3:T6('Ognuno sceglie il personaggio (clicca la tua scheda) e preme «Sono pronto!».','Everyone picks a character (click your card) and presses "I\'m ready!".','Cada uno elige personaje (pulsa tu ficha) y pulsa «¡Estoy listo!».','Chacun choisit son personnage (clique ta carte) et appuie sur « Je suis prêt ! ».','Jeder wählt eine Figur (klick deine Karte) und drückt „Ich bin bereit!“.','Cada um escolhe o personagem (clique no seu card) e aperta «Estou pronto!».'),
  how4:T6('Nella partita: stessa mappa, stessi nemici; esperienza in comune, bottino a chi lo raccoglie.','In the run: same map, same enemies; shared experience, loot to whoever picks it up.','En la partida: mismo mapa, mismos enemigos; experiencia compartida, el botín para quien lo recoja.','En partie : même carte, mêmes ennemis ; expérience partagée, butin à qui le ramasse.','In der Runde: gleiche Karte, gleiche Gegner; geteilte Erfahrung, Beute für den, der sie aufhebt.','Na partida: mesmo mapa, mesmos inimigos; experiência compartilhada, o saque para quem pegar.')
};
Object.assign(UI.prototype,{
  coopBtn(){return h('button',{class:'btn','data-fid':'coop',onclick:()=>{this.sfx();this.push('coop');}},'👥 '+this.tr(CO.title));},
  coopErr(r){const e=CO.err[r];if(e)this.toast({type:'info',msg:this.tr(e)});},
  /* a character's idle frame on a small canvas */
  coopChar(id,w,hgt){const cv=document.createElement('canvas');cv.width=w;cv.height=hgt;const C=CHARS.find(c=>c.id===id)||CHARS[0];
    try{const sp=Sprites.player(C.id+':0',C.cfg,0,false,null),g=cv.getContext('2d'),k=Math.min((hgt-6)/sp.oy,(w-4)/sp.c.width)*1;g.imageSmoothingEnabled=!sp.px;g.translate(w/2,hgt-3);g.scale(k,k);g.drawImage(sp.c,-sp.ox,-sp.oy);}catch(e){}return cv;},
  /* the panel shell: coloured header with an icon, a title and an aside */
  coopPanel(cls,icon,title,aside,...body){return h('div',{class:'cpanel '+cls},title?h('div',{class:'cph'},h('span',{class:'cpi'},icon),h('b',null,this.tr(title)),aside?h('span',{class:'cpa'},aside):null):null,h('div',{class:'cpb'},...body));},
  coopSeg(opts,cur,fn,fid){return h('div',{class:'cseg'},opts.map(([v,l,lock])=>h('button',{class:'csb'+(v===cur?' on':'')+(lock?' locked':''),disabled:!!lock,'data-fid':(fid||'cs')+String(v),onclick:()=>{this.sfx();fn(v);}},this.tr(l)+(lock?' 🔒':''))));},
  coopGate(){const cl=this.app.cloud;if(COOP.ready())return null;return h('div',{class:'cgate'},h('p',{class:'sub'},this.tr(T6('La co-op richiede un account e un soprannome.','Co-op needs an account and a nickname.','El modo cooperativo requiere una cuenta y un apodo.','La coop demande un compte et un pseudo.','Koop braucht ein Konto und einen Spitznamen.','O co-op precisa de uma conta e um apelido.'))),this.nickRow());},
  /* ================= hub ================= */
  screen_coop(){
    COOP.app=this.app;const d=this.save,hs=this.coopHub||(this.coopHub={mode:'classic',size:0,stage:null,diff:null,bsize:2,bdiff:'normal',bstage:0});
    const top=h('div',{class:'chead'},h('button',{class:'btn small alt','data-back':true,onclick:()=>{this.sfx('uiBack');this.pop();}},'← '+this.t('back')),
      h('div',{class:'ctitle'},h('b',null,this.tr(CO.title)),h('span',null,this.tr(CO.sub)+' · BETA')));
    const gate=this.coopGate();
    if(gate)return h('div',{class:'coop'},top,gate);
    const inRoom=COOP.code?h('div',{class:'cinroom'},h('span',null,'🏠 '+this.tr(CO.inRoom(COOP.code))),h('button',{class:'btn small primary','data-fid':'cback',onclick:()=>{this.sfx();this.push('coopRoom');}},this.tr(CO.back)+' ›')):null;
    /* left: with friends */
    const boxes=[0,1,2,3].map(i=>{const b=h('input',{class:'cbox',maxlength:1,'data-fid':'cb'+i,autocomplete:'off',spellcheck:false});
      b.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Backspace'&&!b.value&&i)boxes[i-1].focus();if(e.key==='Enter')go();});
      b.addEventListener('input',()=>{b.value=b.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(-1);if(b.value&&i<3)boxes[i+1].focus();jb.disabled=boxes.map(x=>x.value).join('').length!==4;});
      b.addEventListener('paste',e=>{const t=(e.clipboardData.getData('text')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,4);if(t.length){e.preventDefault();t.split('').forEach((ch,j)=>boxes[j].value=ch);jb.disabled=t.length!==4;}});return b;});
    const go=async()=>{const c=boxes.map(x=>x.value).join('');try{const r=await COOP.join(c);if(r==='ok'){this.sfx('uiStart');this.push('coopRoom');}else this.coopErr(r);}catch(e){this.coopErr('net');}};
    const jb=h('button',{class:'btn cbig gray','data-fid':'cjoin',disabled:true,onclick:go},this.tr(CO.join));
    const left=h('div',{class:'ccol'},
      this.coopPanel('green','👥',CO.withF,this.tr(CO.n24),
        h('div',{class:'cblock'},h('h3',null,this.tr(CO.create)),h('p',null,this.tr(CO.createD)),
          h('button',{class:'btn cbig green','data-fid':'ccreate',onclick:async()=>{this.sfx('uiStart');try{await COOP.create(4,false);this.push('coopRoom');}catch(e){this.coopErr('net');}}},'👥 '+this.tr(CO.create))),
        h('div',{class:'cor'},h('span',null,this.tr(CO.or))),
        h('div',{class:'cblock'},h('h3',null,this.tr(CO.joinC)),h('p',null,this.tr(CO.joinD)),h('div',{class:'cboxes'},boxes),jb)),
      this.coopPanel('purple','✨',CO.how,null,h('ol',{class:'chow'},[CO.how1,CO.how2,CO.how3,CO.how4].map(x=>h('li',null,this.tr(x))))));
    /* centre: find a match + leaderboard */
    const nS=h('div',{class:'csearch'},this.tr(CO.searching(COOP.searching)));
    const opts=h('div',{class:'copts'},
      h('div',{class:'corow'},h('label',null,this.tr(CO.mode)),this.coopSeg([['classic',CO.classic],['endless',CO.endless]],hs.mode,v=>{hs.mode=v;this.rebuild(true);},'fm')),
      h('div',{class:'corow'},h('label',null,this.tr(CO.team)),this.coopSeg([[0,CO.any],[2,CO.duo],[3,CO.trio],[4,CO.squad]],hs.size,v=>{hs.size=v;this.rebuild(true);},'fs')),
      h('div',{class:'corow'},h('label',null,this.tr(CO.map)),h('div',{class:'cchips'},[h('button',{class:'cchip'+(hs.stage==null?' on':''),'data-fid':'fmapany',onclick:()=>{this.sfx();hs.stage=null;this.rebuild(true);}},'🌐 '+this.tr(CO.any))].concat(
        STAGE_ORDER.map(i=>{const open=this.stageOpen(i);return h('button',{class:'cchip'+(hs.stage===i?' on':'')+(open?'':' locked'),disabled:!open,'data-fid':'fmap'+i,onclick:()=>{this.sfx();hs.stage=i;this.rebuild(true);}},this.tr(STAGES[i].n)+(open?'':' 🔒'));})))),
      h('div',{class:'corow'},h('label',null,this.tr(CO.diff)),this.coopSeg([[null,CO.any]].concat(Object.keys(DIFF).map(k=>[k,DIFF[k].n])),hs.diff,v=>{hs.diff=v;this.rebuild(true);},'fd')));
    const find=h('div',{class:'cfind'},h('div',{class:'cfl'},h('span',{class:'cbeta'},'BETA'),h('h1',null,this.tr(CO.find)),h('p',null,this.tr(CO.findD)),
      h('button',{class:'btn cbig red','data-fid':'cfindgo',onclick:async()=>{this.sfx('uiStart');try{await COOP.find(hs);this.push('coopRoom');}catch(e){this.coopErr('net');}}},'🌐 '+this.tr(CO.find)),nS),opts);
    const brows=h('div',{class:'cbrows'},h('p',{class:'sub'},this.tr(CO.boardSoon))),bme=h('div',{class:'cbme'},h('span',null,this.tr(CO.best)),h('b',null,this.tr(CO.noTeam)));
    const loadB=()=>COOP.board({size:hs.bsize,mode:hs.bdiff==='endless'?'endless':'classic',stage:hs.bstage,diff:hs.bdiff==='endless'?'normal':hs.bdiff}).then(L=>{if(!brows.isConnected)return;brows.innerHTML='';
      if(!L||!L.length){brows.appendChild(h('p',{class:'sub'},this.tr(CO.noTeam)));return;}
      for(const r of L)brows.appendChild(h('div',{class:'cbrow'+(r.rank<=3?' top'+r.rank:'')+(r.me?' me':'')},h('i',null,r.rank<=3?['🥇','🥈','🥉'][r.rank-1]:'#'+r.rank),h('div',{class:'cbav'},(r.chs||[]).map(id=>this.coopChar(id,34,34))),
        h('div',{class:'cbn'},h('b',null,(r.members||[]).join(' · ')),h('small',null,(r.win?'✓ ':'')+fmtT(r.t))),h('div',{class:'cbk'},h('b',null,Online.big(r.kills)),h('small',null,'KO'))));
      const m=L.find(r=>r.me);if(m){bme.innerHTML='';bme.append(h('span',null,this.tr(CO.best)),h('b',null,'#'+m.rank+' · '+m.members.join(' · ')+' · '+Online.big(m.kills)+' KO'));}}).catch(()=>{});
    const board=this.coopPanel('orange','🏅',CO.board,null,
      h('div',{class:'cbtabs'},this.coopSeg([[2,CO.duo],[3,CO.trio],[4,CO.squad]],hs.bsize,v=>{hs.bsize=v;this.rebuild(true);},'bs'),
        this.coopSeg(Object.keys(DIFF).filter(k=>k!=='easy').map(k=>[k,DIFF[k].n]).concat([['endless',CO.endless]]),hs.bdiff,v=>{hs.bdiff=v;this.rebuild(true);},'bd')),
      h('div',{class:'cchips'},STAGE_ORDER.map(i=>h('button',{class:'cchip'+(hs.bstage===i?' on':''),'data-fid':'bmap'+i,onclick:()=>{this.sfx();hs.bstage=i;this.rebuild(true);}},this.tr(STAGES[i].n)))),brows,bme);
    loadB();
    const centre=h('div',{class:'ccol wide'},this.coopPanel('greenfind','',null,null,find),board);
    /* right: invitations (and friend requests) */
    const inv=h('div',{class:'cinv'});
    const drawInv=()=>{inv.innerHTML='';const L=COOP.invites||[],R=(COOP.friends||[]).filter(f=>f.status==='incoming');
      if(!L.length&&!R.length){inv.appendChild(h('div',{class:'cempty'},h('div',{class:'cemi'},'📮'),h('p',null,this.tr(CO.invitesE))));return;}
      for(const i of L)inv.appendChild(h('div',{class:'cinvr'},h('div',null,h('b',null,this.tr(CO.invitesYou(i.nick))),h('small',null,this.tr(CO.room)+' '+i.code)),
        h('button',{class:'btn small primary','data-fid':'ij'+i.code,onclick:async()=>{this.sfx('uiStart');try{const r=await COOP.join(i.code);if(r==='ok')this.push('coopRoom');else this.coopErr(r);}catch(e){this.coopErr('net');}}},this.tr(CO.join))));
      for(const f of R)inv.appendChild(h('div',{class:'cinvr'},h('div',null,h('b',null,this.tr(CO.friendReq(f.nick)))),h('div',{class:'row'},
        h('button',{class:'btn small primary','data-fid':'fa'+f.nick,onclick:()=>{this.sfx();COOP.respond(f.nick,true);}},this.tr(CO.accept)),h('button',{class:'btn small alt','data-fid':'fd'+f.nick,onclick:()=>{this.sfx();COOP.respond(f.nick,false);}},this.tr(CO.decline)))));};
    drawInv();
    const right=h('div',{class:'ccol'},this.coopPanel('blue','💌',CO.invites,null,inv));
    const root=h('div',{class:'coop hub'},top,inRoom,h('div',{class:'cgrid3'},left,centre,right));
    /* live parts */
    const off=COOP.on(k=>{if(!root.isConnected){off();return;}if(k==='searching')nS.textContent=this.tr(CO.searching(COOP.searching));if(k==='invites'||k==='friends')drawInv();});
    COOP.loadSearching();COOP.loadInvites();COOP.loadFriends();
    clearInterval(this._cHubT);this._cHubT=setInterval(()=>{if(!root.isConnected){clearInterval(this._cHubT);return;}COOP.loadSearching();COOP.loadInvites();},8000);
    return root;
  },
  /* ================= room ================= */
  screen_coopRoom(){
    COOP.app=this.app;const d=this.save,el={};
    const top=h('div',{class:'chead'},h('button',{class:'btn small alt','data-back':true,onclick:()=>{this.sfx('uiBack');this.pop();}},'← '+this.t('back')),
      el.title=h('div',{class:'ctitle'},h('b',null,this.tr(CO.room)+' '+(COOP.code||'····')),h('span',null,this.tr(CO.title)+' · BETA')),
      h('div',{class:'cspacer'}),h('button',{class:'btn small bad','data-fid':'cleave',onclick:async()=>{this.sfx('uiBack');await COOP.leave();this.pop();}},'🚪 '+this.tr(CO.leave)));
    el.dest=h('div',{class:'cdest'});el.team=h('div',{class:'cteam'});el.teamN=h('span',{class:'cpa'});el.chat=h('div',{class:'cchat'});el.inv=h('div',{class:'cinvite'});el.bar=h('div',{class:'cbar'});el.destA=h('span',{class:'cpa'});
    /* chat input (kept across updates) */
    const inp=h('input',{type:'text',maxlength:120,class:'cmsg','data-fid':'cmsg',placeholder:this.tr(CO.msg)});
    const send=()=>{const v=inp.value;inp.value='';COOP.say(v);};inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')send();});
    const chatBox=h('div',{class:'cchatwrap'},el.chat,h('div',{class:'cquick'},COOP_QUICK.map((q,i)=>h('button',{class:'cqk','data-fid':'cq'+i,onclick:()=>{this.sfx();COOP.say(this.tr(q));}},this.tr(q)))),
      h('div',{class:'csend'},inp,h('button',{class:'btn primary csendb','data-fid':'csend',onclick:send},'➤')));
    const left=h('div',{class:'ccol'},this.coopPanel('orange','🧭',CO.dest,el.destA,el.dest));
    const centre=h('div',{class:'ccol wide'},h('div',{class:'cteamh'},h('b',null,this.tr(CO.yourTeam)),el.teamN),el.team,this.coopPanel('purple','💬',CO.chat,this.tr(CO.chatC),chatBox));
    const right=h('div',{class:'ccol'},this.coopPanel('blue','✉',CO.invite,null,el.inv));
    const root=h('div',{class:'coop room'},top,h('div',{class:'cgrid3'},left,centre,right),el.bar);
    this.coopEl=el;el.root=root;
    const off=COOP.on(k=>{if(!root.isConnected){off();return;}
      if(k==='state'){this.coopDraw();}
      else if(k==='friends')this.coopDrawInvite();
      else if(k.startsWith('gone:')){this.toast({type:'info',msg:this.tr(CO.gone)});if(this.top&&this.top.name==='coopRoom')this.pop();}});
    this.coopDraw();COOP.loadFriends();COOP.poll(true);
    clearInterval(this._cFrT);this._cFrT=setInterval(()=>{if(!root.isConnected){clearInterval(this._cFrT);return;}COOP.loadFriends();},10000);
    return root;
  },
  coopDraw(){const el=this.coopEl;if(!el||!el.root.isConnected)return;const s=COOP.st;
    el.title.firstChild.textContent=this.tr(CO.room)+' '+(COOP.code||'····');
    if(!s){el.team.innerHTML='';el.team.appendChild(h('p',{class:'sub'},'…'));return;}
    this.coopDrawDest(s);this.coopDrawTeam(s);this.coopDrawChat();this.coopDrawInvite();this.coopDrawBar(s);},
  coopDrawDest(s){const el=this.coopEl,host=s.me_host,st=STAGES[s.stage]||STAGES[0];el.destA.textContent=this.tr(host?CO.youDecide:CO.hostDecides);
    const key=[s.stage,s.mode,s.diff,host].join('|');if(el.destKey===key)return;el.destKey=key;el.dest.innerHTML='';
    el.dest.append(h('div',{class:'cdcard',style:'--sky:'+THEMES[st.theme].sky+';--hi:'+THEMES[st.theme].hi},h('canvas',{class:'stprev',width:240,height:96,'data-theme':st.theme,'data-seed':String(s.stage)}),
        h('div',{class:'cdname'},h('b',null,this.tr(st.n)),h('small',null,'STAGE '+st.no+' · '+this.tr(DIFF[s.diff].n)))),
      h('label',{class:'clab'},this.tr(CO.mode)),this.coopSeg([['classic',CO.classic],['endless',CO.endless]].map(x=>host?x:x.concat(x[0]!==s.mode)),s.mode,v=>COOP.set({mode:v}),'rm'),
      h('label',{class:'clab'},this.tr(CO.map)),h('div',{class:'cmaps'},STAGE_ORDER.map(i=>{const open=this.stageOpen(i),on=i===s.stage;
        return h('button',{class:'cmap'+(on?' on':'')+(open?'':' locked'),disabled:!host||!open,'data-fid':'rmap'+i,onclick:()=>{this.sfx();COOP.set({stage:i});}},h('span',null,this.tr(STAGES[i].n)),on?h('i',null,'✓'):open?null:h('i',null,'🔒'));})),
      h('label',{class:'clab'},this.tr(CO.diff)),this.coopSeg(Object.keys(DIFF).map(k=>host?[k,DIFF[k].n]:[k,DIFF[k].n,k!==s.diff]),s.diff,v=>COOP.set({diff:v}),'rd'));},
  coopDrawTeam(s){const el=this.coopEl,M=s.members||[];el.teamN.textContent=this.tr(CO.room)+' · '+M.length+'/'+s.size;
    const key=JSON.stringify([M,s.size,s.open]);if(el.teamKey===key)return;el.teamKey=key;el.team.innerHTML='';
    for(let i=0;i<s.size;i++){const m=M[i];
      if(m){const C=CHARS.find(c=>c.id===m.ch)||CHARS[0];
        el.team.appendChild(h('button',{class:'cslot full'+(m.me?' me':'')+(m.ready||m.host?' ready':''),'data-fid':'slot'+i,disabled:!m.me,title:m.me?this.tr(CO.pick):'',onclick:()=>{if(m.me){this.sfx();this.coopPick();}}},
          h('div',{class:'csart',style:'--c:'+((LINES[C.line||'saiyan']||[])[0]||{}).aura},this.coopChar(C.id,120,120),
            h('div',{class:'cstags'},m.host?h('span',{class:'ctag crown'},'👑'):null,m.me?h('span',{class:'ctag you'},this.tr(CO.you)):null),
            m.ready||m.host?h('span',{class:'ctag rdy'},'✓ '+this.tr(CO.readyB)):null),
          h('div',{class:'csname'},h('b',null,this.tr(C.n))),h('div',{class:'csnick'},h('b',null,m.nick),m.title&&TITLES.text(m.title)?h('small',null,this.tr(TITLES.text(m.title))):null)));}
      else el.team.appendChild(h('div',{class:'cslot empty'},h('span',{class:'csnum'},String(i+1)),h('div',{class:'csball'},'🐉'),h('b',null,this.tr(s.open?CO.slotS:CO.slotF)),h('small',null,this.tr(CO.slotI))));}},
  coopDrawChat(){const el=this.coopEl,L=COOP.msgs;const key=L.length?L[L.length-1].id+':'+L.length:'0';if(el.chatKey===key)return;el.chatKey=key;el.chat.innerHTML='';
    if(!L.length){el.chat.appendChild(h('p',{class:'cchate'},this.tr(CO.chatE)));return;}
    for(const m of L)el.chat.appendChild(h('div',{class:'cline'+(m.me?' me':'')},h('b',null,m.nick+': '),h('span',null,m.text)));el.chat.scrollTop=el.chat.scrollHeight;},
  coopDrawInvite(){const el=this.coopEl;if(!el||!el.root.isConnected)return;const s=COOP.st;if(!s)return;const host=s.me_host,F=COOP.friends||[];
    const key=JSON.stringify([s.open,s.size,host,F,(s.members||[]).length]);if(el.invKey===key)return;el.invKey=key;
    const keepNick=el.addInp&&el.addInp.value;el.inv.innerHTML='';
    const code=(COOP.code||'????').split('');
    el.inv.append(
      h('div',{class:'cibox'},h('div',{class:'cirow'},h('div',null,h('b',null,this.tr(CO.findMates)),h('p',null,this.tr(CO.findMatesD))),
          h('button',{class:'ctoggle'+(s.open?' on':''),disabled:!host,'data-fid':'copen',onclick:()=>{this.sfx();COOP.set({open:!s.open});}},h('i'))),
        this.coopSeg([[2,CO.duo],[3,CO.trio],[4,CO.squad]].map(x=>host?x.concat(x[0]<(s.members||[]).length):x.concat(x[0]!==s.size)),s.size,v=>COOP.set({size:v}),'rs')),
      h('div',{class:'cibox'},h('label',{class:'clab c'},this.tr(CO.code)),h('div',{class:'ccode'},code.map(ch=>h('span',null,ch))),
        h('div',{class:'row'},h('button',{class:'btn small primary','data-fid':'ccopy',onclick:async()=>{this.sfx();try{await navigator.clipboard.writeText(COOP.link(COOP.code));this.toast({type:'info',msg:this.tr(CO.copied)});}catch(e){this.toast({type:'info',msg:COOP.link(COOP.code)});}}},this.tr(CO.copy)),
          h('button',{class:'btn small alt','data-fid':'cshare',onclick:async()=>{this.sfx();const u=COOP.link(COOP.code);try{if(navigator.share)await navigator.share({title:'Dragon Ball Survivors',text:this.tr(CO.room)+' '+COOP.code,url:/^https?:/.test(u)?u:undefined});else{await navigator.clipboard.writeText(u);this.toast({type:'info',msg:this.tr(CO.copied)});}}catch(e){}}},this.tr(CO.share)))));
    /* friends */
    const add=el.addInp=h('input',{type:'text',maxlength:16,class:'cadd','data-fid':'cadd',placeholder:this.tr(CO.nickPh),value:keepNick||''});add.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')doAdd();});
    const doAdd=async()=>{const n=add.value.trim();if(!n)return;try{const r=await COOP.addFriend(n);this.coopErr(r);if(r==='sent'||r==='accepted')add.value='';}catch(e){this.coopErr('net');}};
    const list=h('div',{class:'cflist'});
    const inRoom=new Set((s.members||[]).map(m=>m.nick));
    for(const f of F){const row=h('div',{class:'cfrow'},h('span',{class:'cdot'+(f.online?' on':'')}),h('div',{class:'cfn'},h('b',null,f.nick),h('small',null,f.status==='friend'?this.tr(f.online?CO.online:CO.offline)+(f.room?' · '+f.room:''):this.tr(f.status==='incoming'?CO.friendReq(''):CO.pending))));
      if(f.status==='friend')row.appendChild(inRoom.has(f.nick)?h('i',{class:'cin'},'✓'):h('button',{class:'btn small primary','data-fid':'cinv'+f.nick,onclick:async()=>{this.sfx();try{const r=await COOP.invite(f.nick);this.toast({type:'info',msg:this.tr(r==='sent'?CO.inviteSent:CO.err[r]||CO.err.net)});}catch(e){this.coopErr('net');}}},this.tr(CO.invite)));
      else if(f.status==='incoming')row.appendChild(h('div',{class:'row'},h('button',{class:'btn small primary','data-fid':'cfa'+f.nick,onclick:()=>{this.sfx();COOP.respond(f.nick,true);}},'✓'),h('button',{class:'btn small alt','data-fid':'cfd'+f.nick,onclick:()=>{this.sfx();COOP.respond(f.nick,false);}},'✕')));
      list.appendChild(row);}
    if(!F.length)list.appendChild(h('div',{class:'cempty'},h('div',{class:'cemi'},'🤝'),h('p',null,this.tr(CO.noFriends))));
    el.inv.append(h('div',{class:'cibox grow'},h('label',{class:'clab'},this.tr(CO.friends)),h('div',{class:'csend'},add,h('button',{class:'btn small primary','data-fid':'caddb',onclick:doAdd},this.tr(CO.addF))),list));},
  coopDrawBar(s){const el=this.coopEl,M=s.members||[],me=M.find(m=>m.me)||{},nReady=M.filter(m=>m.ready||m.host).length,all=nReady===M.length,st=STAGES[s.stage]||STAGES[0];
    const key=JSON.stringify([M,s.size,s.status,s.stage,s.diff,s.mode]);if(el.barKey===key)return;el.barKey=key;el.bar.innerHTML='';
    const av=h('div',{class:'cavs'});for(let i=0;i<s.size;i++){const m=M[i];av.appendChild(m?h('div',{class:'cav'+(m.ready||m.host?' ok':'')},this.coopChar(m.ch,44,44)):h('div',{class:'cav empty'}));}
    const msg=M.length<2?CO.need2:all?CO.allReady:CO.waitReady;
    const canStart=s.me_host&&M.length>=2&&all&&s.status==='lobby';
    const btn=s.me_host?h('button',{class:'btn cstart'+(canStart?' go':''),disabled:!canStart,'data-fid':'cstart',onclick:async()=>{this.sfx('uiStart');try{const r=await COOP.start();if(r!=='ok')this.coopErr(r);}catch(e){this.coopErr('net');}}},'🐉 '+this.tr(CO.start))
      :h('button',{class:'btn cstart'+(me.ready?'':' go'),'data-fid':'cready',onclick:()=>{this.sfx();COOP.me({ready:!me.ready});}},me.ready?'✕ '+this.tr(CO.notReady):'✓ '+this.tr(CO.imReady));
    el.bar.append(av,h('div',{class:'cbarm'},h('b',null,this.tr(CO.nOfReady(nReady,M.length))),h('small',null,this.tr(msg))),h('div',{class:'cspacer'}),
      h('div',{class:'cbard'},h('small',null,this.tr(CO.destB)),h('b',null,this.tr(st.n)),h('span',{class:'cdiff d-'+s.diff},this.tr(DIFF[s.diff].n)+(s.mode==='endless'?' · ∞':''))),btn);
},
  /* v120: while the co-op run connects: who is in, a way out */
  coopConnecting(G){let ov=document.getElementById('coopconn');
    if(!G.net||G.started){if(ov)ov.remove();return;}
    if(!ov){ov=h('div',{id:'coopconn',class:'cpick'});this.root.appendChild(ov);}
    const peers=G.net.openPeers,names=(G.st.members||[]).map(m=>m.nick).filter(n=>n!==G.me);
    ov.innerHTML='';ov.appendChild(h('div',{class:'cpickb cconn'},h('h3',null,this.tr(T6('Connessione alla squadra…','Connecting to the team…','Conectando con el equipo…','Connexion à l\'équipe…','Verbinde mit dem Team…','Conectando à equipe…'))),
      h('div',{class:'cconnl'},(G.role==='host'?names:[G.host]).map(n=>{const ok=G.role==='host'?G.ready.has(n):peers.includes(n);return h('div',{class:'cfrow'},h('span',{class:'cdot'+(ok?' on':'')}),h('b',null,n),h('small',null,ok?'✓':'…'));})),
      h('p',{class:'sub'},this.tr(G.role==='host'?T6('La partita parte quando tutti sono collegati (al massimo 20 secondi).','The run starts when everyone is connected (20 seconds at most).','La partida empieza cuando todos estén conectados (20 segundos como máximo).','La partie démarre quand tout le monde est connecté (20 secondes max).','Die Runde startet, wenn alle verbunden sind (höchstens 20 Sekunden).','A partida começa quando todos estiverem conectados (no máximo 20 segundos).'):T6('In attesa dell\'host…','Waiting for the host…','Esperando al anfitrión…','En attente de l\'hôte…','Warte auf den Host…','Esperando o anfitrião…'))),
      h('button',{class:'btn small alt','data-fid':'cconnx',onclick:()=>{this.sfx('uiBack');COOPG.stop();ov.remove();}},this.t('back'))));},
  /* own character: a small overlay with the unlocked roster */
  coopPick(){const d=this.save,el=this.coopEl;if(!el)return;const own=this.testAll()?CHARS:CHARS.filter(c=>d.unlocked.includes(c.id));
    const ov=h('div',{class:'cpick',onclick:e=>{if(e.target===ov)ov.remove();}},h('div',{class:'cpickb'},h('h3',null,this.tr(CO.pick)),h('div',{class:'cpickg'},own.map(C=>h('button',{class:'cpk','data-fid':'pk_'+C.id,onclick:()=>{this.sfx();COOP.me({ch:C.id});ov.remove();}},this.coopChar(C.id,64,64),h('small',null,this.tr(C.n)))))));
    el.root.appendChild(ov);}
});
