'use strict';
/* ====== v117 UI: career stats (main menu), titles (career screen, shown on the leaderboards), build codes (end screen: copy; character screen: paste) ====== */
const CT={
  career:T6('Carriera','Career','Carrera','Carrière','Karriere','Carreira'),title:T6('Titolo','Title','Título','Titre','Titel','Título'),none:T6('Nessuno','None','Ninguno','Aucun','Keiner','Nenhum'),
  code:T6('Codice build','Build code','Código de build','Code de build','Build-Code','Código da build'),copied:T6('Codice copiato!','Code copied!','¡Código copiado!','Code copié !','Code kopiert!','Código copiado!'),
  paste:T6('Incolla una build','Paste a build','Pegar una build','Coller une build','Build einfügen','Colar uma build'),bad:T6('Codice non valido.','Invalid code.','Código no válido.','Code invalide.','Ungültiger Code.','Código inválido.')
};
const BUILD={
  /* DBS1-<base64url of a compact JSON>: character, stage, difficulty, pacts, weapons [id, level, evolutions, fused], trinkets [id, rarity] */
  encode(g){const o={c:g.C.id,s:g.stageIdx,d:g.diffId,p:g.pacts||[],w:[...g.weapons.values()].map(w=>[w.id,w.lv,w.evo|0,w.fz?1:0]),t:g.trinkets.slice(0,24).map(id=>[id,g.tRar[id]|0]),l:g.lvl|0,f:g.formsUnlocked|0};
    const b=btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');return 'DBS1-'+b;},
  decode(s){s=String(s||'').trim();if(!/^DBS1-[A-Za-z0-9_-]{8,3000}$/.test(s))return null;
    try{let b=s.slice(5).replace(/-/g,'+').replace(/_/g,'/');while(b.length%4)b+='=';const o=JSON.parse(decodeURIComponent(escape(atob(b))));
      /* only known ids survive: the code comes from someone else */
      const C=CHARS.find(c=>c.id===o.c);if(!C)return null;
      return{c:C.id,s:STAGES[o.s]?o.s|0:0,d:DIFF[o.d]?o.d:'normal',p:(Array.isArray(o.p)?o.p:[]).filter(id=>PACTS.some(x=>x.id===id)).slice(0,7),
        w:(Array.isArray(o.w)?o.w:[]).filter(x=>Array.isArray(x)&&WEAPONS[x[0]]).slice(0,8).map(x=>[x[0],clamp(x[1]|0,1,WMAX),clamp(x[2]|0,0,2),x[3]?1:0]),
        t:(Array.isArray(o.t)?o.t:[]).filter(x=>Array.isArray(x)&&TRINKETS.some(q=>q.id===x[0])).slice(0,24).map(x=>[x[0],clamp(x[1]|0,0,4)]),l:clamp(o.l|0,1,3000),f:clamp(o.f|0,0,9)};}catch(e){return null;}}
};
const TITLES={
  /* codes: m:<char> (Mastery 10), w:<weapon>:<tier 0-2> (weapon diary) */
  list(save){const out=[];for(const C of CHARS)if(Mastery.lv(save,C.id)>=MAST_TITLE_LV)out.push('m:'+C.id);
    for(const id in WEAPONS){const n=(save.wk||{})[id]||0;WD_TIERS.forEach((t,i)=>{if(n>=t.n)out.push('w:'+id+':'+i);});}return out;},
  text(code){const a=String(code||'').split(':');if(a[0]==='m'&&CHARS.some(c=>c.id===a[1]))return Mastery.title(a[1]);
    if(a[0]==='w'&&WEAPONS[a[1]]&&WD_TIERS[+a[2]]){const W=WEAPONS[a[1]].n,t=WD_TIERS[+a[2]].t;return T6(t.it+' di '+W.it,(W.en||W.it)+' '+t.en,t.es+' de '+(W.en||W.it),t.fr+' de '+(W.en||W.it),(W.en||W.it)+'-'+t.de,t.pt+' de '+(W.en||W.it));}return null;}
};
Object.assign(Cloud.prototype,{
  async setTitle(code){if(!this.uid||!this.nick)return false;const t=await this.token();await this.req('/rest/v1/profiles?user_id=eq.'+encodeURIComponent(this.uid),{method:'PATCH',token:t,headers:{Prefer:'return=minimal'},body:{title:code||null}});this.title=code||null;return true;}
});
Object.assign(UI.prototype,{
  careerBtn(){return h('button',{class:'btn','data-fid':'career',onclick:()=>{this.sfx();this.push('career');}},'📊 '+this.tr(CT.career));},
  screen_career(){
    const d=this.save,s=d.stats||{},T_=x=>this.tr(x),hm=sec=>{sec=Math.floor(sec||0);return Math.floor(sec/3600)+'h '+String(Math.floor(sec%3600/60)).padStart(2,'0')+'m';};
    const fav=Object.entries(d.wk||{}).sort((a,b)=>b[1]-a[1])[0],boss=Object.entries(d.bk||{}).sort((a,b)=>b[1]-a[1])[0],main=Object.entries(d.mastery||{}).sort((a,b)=>b[1].xp-a[1].xp)[0];
    const row=(l,v)=>h('div',{class:'krow'},h('span',null,T_(l)),h('b',null,v));
    const rows=[row(T6('Tempo di gioco','Play time','Tiempo de juego','Temps de jeu','Spielzeit','Tempo de jogo'),hm(s.playT)),row(T6('Partite','Runs','Partidas','Parties','Runden','Partidas'),String(s.runs||0)),
      row(T6('Vittorie','Wins','Victorias','Victoires','Siege','Vitórias'),String(s.wins||0)),row(T6('Nemici sconfitti','Enemies defeated','Enemigos derrotados','Ennemis vaincus','Besiegte Gegner','Inimigos derrotados'),(s.kills||0).toLocaleString()),
      row(T6('Boss sconfitti','Bosses defeated','Jefes derrotados','Boss vaincus','Besiegte Bosse','Chefes derrotados'),(s.bosses||0).toLocaleString()),row(T6('Livello più alto','Highest level','Nivel más alto','Niveau max','Höchstes Level','Nível mais alto'),String(s.maxLevel||0)),
      row(T6('Desideri','Wishes','Deseos','Vœux','Wünsche','Desejos'),String(s.wishes||0)),row(T6('Evoluzioni','Evolutions','Evoluciones','Évolutions','Entwicklungen','Evoluções'),String(s.evos||0)),
      row(T6('Arma preferita','Favourite weapon','Arma favorita','Arme préférée','Lieblingswaffe','Arma favorita'),fav&&WEAPONS[fav[0]]?T_(WEAPONS[fav[0]].n)+' ('+fav[1].toLocaleString()+')':'—'),
      row(T6('Boss più sconfitto','Most defeated boss','Jefe más derrotado','Boss le plus vaincu','Meistbesiegter Boss','Chefe mais derrotado'),boss&&BOSSES[boss[0]]?T_(BOSSES[boss[0]].n)+' (×'+boss[1]+')':'—'),
      row(T6('Personaggio più giocato','Most played character','Personaje más jugado','Personnage le plus joué','Meistgespielte Figur','Personagem mais jogado'),main&&CHARS.find(c=>c.id===main[0])?T_(CHARS.find(c=>c.id===main[0]).n)+' · '+this.t('lv')+' '+Mastery.lvOf(main[1].xp).lv:'—')];
    /* kills per saga = per stage */
    const sk=d.sk||{},saga=STAGE_ORDER.map(i=>[i,sk[i]||0]).filter(x=>x[1]>0),mx=Math.max(1,...saga.map(x=>x[1]));
    const sagaRows=saga.map(([i,n])=>h('div',{class:'srow'},h('span',null,T_(STAGES[i].n)),h('div',{class:'mbar'},h('div',{style:'width:'+Math.round(100*n/mx)+'%'})),h('b',null,n.toLocaleString())));
    /* titles */
    const L=TITLES.list(d),cur=d.title||'',cl=this.app.cloud;
    const sel=h('select',{'data-fid':'tsel',onchange:()=>{d.title=sel.value||'';this.app.save.write();if(cl.uid&&cl.nick)cl.setTitle(d.title).catch(()=>{});this.sfx();}},
      [h('option',{value:'',selected:!cur},T_(CT.none))].concat(L.map(c=>h('option',{value:c,selected:c===cur},T_(TITLES.text(c))))));
    return h('div',{class:'center career'},this.header(CT.career),
      h('div',{class:'cargrid'},h('div',{class:'carcol'},rows),h('div',{class:'carcol'},h('h3',null,T_(T6('Nemici per saga','Enemies by saga','Enemigos por saga','Ennemis par saga','Gegner nach Saga','Inimigos por saga'))),sagaRows.length?sagaRows:h('p',{class:'sub'},'—'),
        h('h3',null,T_(CT.title)),L.length?sel:h('p',{class:'sub'},T_(T6('Si ottengono con la Maestria 10 e con il diario delle armi.','Earned with Mastery 10 and the weapon diary.','Se obtienen con la Maestría 10 y el diario de armas.','S\'obtiennent avec la Maîtrise 10 et le journal des armes.','Gibt es mit Meisterschaft 10 und dem Waffentagebuch.','Obtidos com a Maestria 10 e o diário das armas.'))))));
  },
  /* end screen: the build code */
  codeBtn(){const g=this.app.game;if(!g)return null;return h('button',{class:'btn alt','data-fid':'bcode',onclick:async()=>{const c=BUILD.encode(g);let ok=false;try{await navigator.clipboard.writeText(c);ok=true;}catch(e){}this.sfx();this.toast({type:'info',msg:ok?this.tr(CT.copied):c});}},'🔗 '+this.tr(CT.code));},
  /* character screen: paste a friend's code and look at the build */
  pasteBtn(){return h('button',{class:'btn small alt','data-fid':'bpaste',onclick:()=>{this.sfx();this.push('buildView',{});}},'📋 '+this.tr(CT.paste));},
  screen_buildView(a){a=a||{};const inp=h('input',{type:'text','data-fid':'bcin',value:a.code||'',placeholder:'DBS1-…',style:'width:min(560px,90vw)'});inp.addEventListener('keydown',e=>e.stopPropagation());
    const B=a.code?BUILD.decode(a.code):null,T_=x=>this.tr(x);
    const show=()=>{this.top.args={code:inp.value};this.rebuild(true);};
    let body=null;
    if(a.code&&!B)body=h('p',{class:'sub'},T_(CT.bad));
    else if(B){const C=CHARS.find(c=>c.id===B.c);
      body=h('div',{class:'bview'},h('h3',null,T_(C.n)+' · '+T_(STAGES[B.s].n)+' · '+T_(DIFF[B.d].n)+' · '+this.t('lv')+' '+B.l),
        B.p.length?h('div',{class:'chips'},B.p.map(id=>{const P=PACTS.find(x=>x.id===id);return h('span',{class:'chip',style:'--c:'+P.c},'☠ '+T_(P.n));})):null,
        h('div',{class:'chips'},B.w.map(([id,lv,ev,fz])=>{const W=WEAPONS[id];return h('span',{class:'chip',style:'--c:'+W.c},glyph(W.k,W.c),T_(ev>=2?W.evo2:ev?W.evo:W.n)+' Lv'+lv+(fz?' ✦':''));})),
        h('div',{class:'chips'},B.t.map(([id,r])=>{const t=trinDef(id);return h('span',{class:'tchip',style:'--c:'+RARITY[r].c,title:T_(t.n)},glyph(t.k,RARITY[r].c),T_(t.n));})));}
    return h('div',{class:'center'},this.header(CT.paste),h('div',{class:'row'},inp,h('button',{class:'btn primary','data-fid':'bcgo',onclick:show},'OK')),body);}
});
