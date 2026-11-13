'use strict';
/* ====== v136: trinket windows: the choice of the trinkets that go home after a win (tpick), the Reroll and the Fusion of the Gacha shop ====== */
const TP_SORT={new:'🆕',old:'⏳',rar:'★',perf:'％',name:'Aa',stat:'＋'};
Object.assign(UI.prototype,{
  /* a yes / no question over everything; resolves true / false */
  ask(o){
    return new Promise(res=>{
      const prev=this.modalEl,close=v=>{ov.remove();if(this.modalEl===ov)this.modalEl=prev;res(v);};
      const yes=h('button',{class:'btn primary','data-fid':'askyes',onclick:()=>{this.sfx('uiStart');close(true);}},o.yes);
      const ov=h('div',{class:'uask'},h('div',{class:'uaskp'},h('h3',null,o.title),o.body?h('div',{class:'uaskb'},o.body):null,
        h('div',{class:'row'},yes,h('button',{class:'btn alt','data-back':true,'data-fid':'askno',onclick:()=>{this.sfx('uiBack');close(false);}},o.no))));
      this.root.append(ov);this.modalEl=ov;yes.focus({preventScroll:true});
    });
  },
  /* v136b: the rarity filter of the trinket screens, in the left column under the sort buttons, from Mythic down to Common */
  rarChips(st,onChange){
    /* every rarity has a chip (on / off) and a tick that keeps ONLY that rarity on; ticking it again turns them all back on */
    const rows=[4,3,2,1,0].map(r=>{
      const chip=h('button',{class:'rchip','data-fid':'rc'+r,style:'--c:'+RARITY[r].c,onclick:()=>{this.sfx('uiTab');st.rar[r]=st.rar[r]?0:1;paint();onChange();}},this.tr(RARITY[r].n));
      const solo=h('button',{class:'rsolo','data-fid':'rs'+r,'data-tip':this.t('rarOnly'),'aria-label':this.t('rarOnly'),style:'--c:'+RARITY[r].c,
        onclick:()=>{this.sfx('uiTab');const only=st.rar.every((v,i)=>i===r?v:!v);for(let i=0;i<5;i++)st.rar[i]=only||i===r?1:0;paint();onChange();}},'✓');
      return{r,chip,solo,el:h('div',{class:'rarrow'},chip,solo)};
    });
    const paint=()=>{for(const x of rows){x.chip.classList.toggle('on',!!st.rar[x.r]);x.solo.classList.toggle('on',st.rar.every((v,i)=>i===x.r?v:!v));}};
    paint();
    return h('div',{class:'rarcol'},h('div',{class:'rarlbl'},this.t('gRarity')),rows.map(x=>x.el));
  },

  /* a filterable trinket grid: the one of every trinket screen (bag, run trinkets, reroll, fusion, the choice after a win). st: the filters (kept by the
     caller), items: [{k,id,r,p,f,at}], o.onclick(it) (none: plain cards), o.card(it) -> extra tcard options, o.sorts: the sort buttons, o.empty: text key when there is none */
  tlist(st,items,o){
    const grid=h('div',{class:'baggrid'}),shown=h('span',{class:'achshown'});
    for(const it of items)it.i=this.tinfo(it.id,it.r,it.p,it.f);
    const pv=it=>it.i.perf==null?-1:it.i.perf,sv=it=>{const e=it.i.stats.find(x=>x.k===st.stat);return e?e.v:-1;};
    const cmp={rar:(x,y)=>y.r-x.r,perf:(x,y)=>pv(y)-pv(x),name:(x,y)=>x.i.name.localeCompare(y.i.name),new:(x,y)=>(y.at||0)-(x.at||0),old:(x,y)=>(x.at||0)-(y.at||0),stat:(x,y)=>st.stat?sv(y)-sv(x):0};
    /* several sorts can be on at once: st.sort is the list of active keys in the order they were switched on (the first is the main one; the next break its ties) */
    if(!Array.isArray(st.sort))st.sort=st.sort?[st.sort]:[];
    const order=st.sort.concat(['rar','perf','name']);
    const byAll=(x,y)=>{for(const k of order){const c=cmp[k](x,y);if(c)return c;}return 0;};
    /* stat filter: the stats that at least one trinket of this screen has, in the order of TLAB */
    const L10=this.app.i18n.lang==='it'?0:1,statLab=k=>(TLAB[k]||[k,k])[L10],has=new Set();
    for(const it of items)for(const e of it.i.stats)has.add(e.k);
    if(st.stat&&!has.has(st.stat))st.stat='';
    const fill=()=>{
      const q=RAR_NORM(st.q.trim()),list=items.filter(it=>st.rar[it.r]&&(!st.stat||it.i.stats.some(e=>e.k===st.stat))&&(!q||RAR_NORM(it.i.name+' '+it.i.desc+' '+it.i.rar).includes(q))).sort(byAll);
      grid.replaceChildren(...(list.length?list.map(it=>this.tcard(it.id,it.r,Object.assign({p:it.p,fu:it.f,fid:'t'+it.k},o.onclick?{btn:true,onclick:()=>{this.sfx();o.onclick(it);}}:{},o.card?o.card(it):{}))):[h('p',{class:'sub'},this.t(items.length?'bagNone':(o.empty||'bagEmpty')))]));
      shown.textContent=this.t('bagShown',{a:list.length,b:items.length});
    };
    const chips=this.rarChips(st,fill);
    const search=h('input',{type:'text',class:'achsearch','data-fid':'tlq',placeholder:'🔍 '+this.t('bagSearch'),value:st.q,autocomplete:'off',spellcheck:'false',oninput:e=>{st.q=e.target.value;fill();}});
    const statSel=h('select',{class:'achsearch tlstat','data-fid':'tlstat','aria-label':this.t('bagSort_stat'),onchange:e=>{this.sfx('uiTab');st.stat=e.target.value;fill();}},
      h('option',{value:''},this.t('bagStatAll')),Object.keys(TLAB).filter(k=>has.has(k)).map(k=>h('option',{value:k,selected:st.stat===k},statLab(k))));
    statSel.value=st.stat||'';
    const marks=[],sb=(o.sorts||['rar','perf','name','new']).concat(['stat']).map(k=>{const lab=this.t('bagSort_'+k),n=h('i',{class:'bsn'});
      const mark=()=>{const i=st.sort.indexOf(k);b.classList.toggle('on',i>=0);n.textContent=i>=0&&st.sort.length>1?i+1:'';};
      const b=h('button',{class:'bsortb','data-sort':k,'data-fid':'ts_'+k,'data-tip':this.t('bagSortBy')+': '+lab,'aria-label':lab,
        onclick:()=>{this.sfx('uiTab');const i=st.sort.indexOf(k);if(i>=0)st.sort.splice(i,1);else{st.sort=st.sort.filter(x=>!(k==='new'&&x==='old')&&!(k==='old'&&x==='new'));st.sort.push(k);}
          order.length=0;order.push(...st.sort,'rar','perf','name');for(const m of marks)m();fill();}},TP_SORT[k],n);
      marks.push(mark);return b;});
    for(const m of marks)m();
    fill();
    /* the same layout as the trinket bag: search on top; sort buttons and rarities in the left column; the grid; the caller's side panel on the right */
    return{tools:h('div',{class:'achtools tltools'},search,statSel,shown),left:h('div',{class:'bsorts'},h('div',{class:'bsorti'},sb),chips),grid,fill};
  },
  /* what a fused trinket took from the others: "Fused with: Broken Scouter (crit chance), ..." */
  fuText(fu){const L=this.app.i18n.lang==='it'?0:1;return this.tr(T('Fuso con: ','Fused with: '))+fu.map(e=>this.tr(trinDef(e.id).n)+' ('+(TLAB[e.k]||[e.k,e.k])[L]+')').join(', ');},
  /* big card of a trinket for the side panels */
  tdet(id,r,p,f,extra){
    const i=this.tinfo(id,r,p,f),el=h('div',{class:'bagdet tdet'});el.style.setProperty('--c',i.c);
    el.append(...[h('div',{class:'bdhead'},tGlyph(i.t.id,i.c),h('div',null,h('div',{class:'cn',style:'color:'+i.c},potara(),i.name),h('div',{class:'ctag'},i.rar+(i.fu?' · ⚗':'')))),this.perfBar(i.perf),
      ...(extra||[]),
      h('div',{class:'stl'},i.stats.length?i.stats.map(s=>h('span',{style:'color:#9affb0'},this.tr(s.t))):null),
      i.t.sp||i.t.x?h('p',null,this.tr(i.t.sp&&!i.t.m?i.t.d:(trinX(i.t,i.perf)||i.t.d))):null,
      i.fu?h('p',{class:'cd'},'⚗ '+this.fuText(i.fu)):null,
    ].filter(Boolean));
    return el;
  },

  /* ---------- after a win: which found trinkets go home ---------- */
  screen_tpick(a){
    const g=a.g,bag=this.save.bag,sel=a.sel||(a.sel=[]),st=a.st||(a.st={q:'',rar:[1,1,1,1,1],sort:'rar'}),sd=g.sdR||0;
    const items=a.list.map((x,ix)=>{const own=bag.find(b=>b.id===x.id&&b.r===x.r),pf=hasPf(trinDef(x.id)),op=own?(own.p!=null?own.p:PF_NOM):null;
      return{k:x.id,id:x.id,r:x.r,p:x.p,at:ix,s:!own?'new':pf&&x.p>op?'up':'dup',op};});
    const badge=it=>h('span',{class:'tpst '+it.s},it.s==='new'?this.tr(T('Nuovo','New')):it.s==='up'?this.tr(T('Migliora il tuo','Upgrades yours'))+' '+it.op+'→'+it.p+'%':this.tr(T('Già nella sacca','Already in the bag')));
    const side=h('div',{class:'bagside'}),cnt=h('b',{class:'tpcnt'}),names=h('span',{class:'tpnames'});
    const look=it=>{a.look=it.k;side.replaceChildren(this.tdet(it.id,it.r,it.p,null,[badge(it),h('p',{class:'cd'},this.tr(T('Se non lo scegli viene venduto per','If you do not pick it, it is sold for'))+' ',zAmt(trinketSale(it.r,sd),true))]));};
    const upd=()=>{cnt.textContent=sel.length+' / '+KEEP_N;names.textContent=sel.map(k=>{const it=items.find(x=>x.k===k);return it?this.tr(trinDef(it.id).n):'';}).join(' · ');conf.classList.toggle('primary',sel.length>0);};
    const L=this.tlist(st,items,{onclick:it=>{
      const i=sel.indexOf(it.k);
      if(i>=0)sel.splice(i,1);
      else if(sel.length>=KEEP_N){this.sfx('uiErr');this.toast({type:'info',msg:this.tr(T('Puoi portarne via solo '+KEEP_N+': togli prima la spunta a uno dei due.','You can only take '+KEEP_N+' home: untick one of the two first.'))});return;}
      else sel.push(it.k);
      look(it);L.fill();upd();},
      card:it=>({check:sel.includes(it.k),sel:a.look===it.k,badge:badge(it)})});
    const conf=h('button',{class:'btn','data-fid':'tpok',onclick:async()=>{
      const ch=sel.map(k=>items.find(x=>x.k===k)).filter(Boolean),rest=items.filter(x=>!sel.includes(x.k)),z=rest.reduce((s,x)=>s+trinketSale(x.r,sd),0);
      const body=h('div',null,
        ch.length?h('div',{class:'tpconf'},ch.map(it=>this.tcard(it.id,it.r,{p:it.p}))):h('p',{class:'bad'},this.tr(T('Non hai scelto nessun cimelio.','You picked no trinket.'))),
        ch.length&&ch.length<KEEP_N?h('p',{class:'cd'},this.tr(T('Ne hai scelto solo '+ch.length+' su '+KEEP_N+'.','You picked only '+ch.length+' of '+KEEP_N+'.'))):null,
        h('p',{class:'cd'},this.tr(T('Gli altri '+rest.length+' cimeli verranno venduti per','The other '+rest.length+' trinkets will be sold for'))+' ',zAmt(z,true),'.'));
      if(!await this.ask({title:this.tr(T('Sei sicuro dei cimeli scelti?','Are you sure about these trinkets?')),body,yes:this.tr(T('Sì, portali nella sacca','Yes, put them in the bag')),no:this.tr(T('No, torna alla scelta','No, back to the choice'))}))return;
      this.sfx('chest');a.cb(sel.slice());}},'✓ '+this.tr(T('Conferma','Confirm')));
    const first=items.find(x=>x.k===a.look)||[...items].sort((x,y)=>y.r-x.r||(y.p||0)-(x.p||0))[0];if(first)look(first);
    upd();
    return h('div',{class:'tpick'},
      h('div',{class:'hdr'},h('h2',null,this.tr(T('Cimeli da portare a casa','Trinkets to take home'))),h('div',{class:'zen'},zAmt(this.save.zenny))),
      h('p',{class:'sub'},this.tr(T('Boss finale sconfitto! Spunta i '+KEEP_N+' cimeli trovati in questa partita che vuoi tenere nella sacca: gli altri vengono venduti. I cimeli con cui sei entrato restano tuoi.',
        'Final boss defeated! Tick the '+KEEP_N+' trinkets found in this run you want to keep in your bag: the others are sold. The trinkets you brought in stay yours.'))),
      L.tools,h('div',{class:'bagsplit'},L.left,L.grid,side),
      h('div',{class:'tpfoot'},h('span',null,this.tr(T('Scelti','Picked'))+' ',cnt),names,conf));
  },

  /* ---------- Gacha shop > Reroll ---------- */
  screen_reroll(){
    const P=this.app.progress,d=this.save,st=this.rrF||(this.rrF={q:'',rar:[1,1,1,1,1],sort:'rar'}),test=!!d.settings.sandbox;
    if(!this.rrSel||!P.bagGet(this.rrSel)){this.rrSel=d.bag[0]?trinketKey(d.bag[0].id,d.bag[0].r):null;this.rrPend=null;}
    const items=d.bag.map(b=>({k:trinketKey(b.id,b.r),id:b.id,r:b.r,p:b.p,f:b.f,at:b.at}));
    const L=this.tlist(st,items,{onclick:it=>{if(this.rrAutoOn&&Date.now()-(this.rrBeat||0)>4000)this.rrAutoOn=false;if(this.rrAutoOn)return this.sfx('uiErr');if(this.rrPend){if(!(this.modalEl&&this.modalEl.isConnected&&this.modalEl.classList.contains('rrm'))){this.rrOpen=true;this.rrModal();}return this.sfx('uiErr');}this.sfx('uiMove');this.rrSel=it.k;this.rebuild(true);},card:it=>({sel:it.k===this.rrSel,eq:(d.equips||[]).some(e=>e&&trinketKey(e.id,e.r)===it.k)})});
    const b=this.rrSel&&P.bagGet(this.rrSel),side=h('div',{class:'bagside'});
    if(this.rrAutoOn&&Date.now()-(this.rrBeat||0)>4000)this.rrAutoOn=false;   /* a loop that died without cleaning up */
    if(this.rrPend&&!this.rrOpen)this.rrPend=null;   /* a roll left without a choice keeps the old trinket */
    if(b){
      const run=!!this.rrAutoOn;
      this.rrAutoEl=h('small',{class:'rrautost'});
      side.append(this.tdet(b.id,b.r,b.p,b.f,[
        run?h('button',{class:'btn','data-fid':'rrstop',onclick:()=>{this.sfx('rrStop');this.rrAutoOn=false;}},'⏹ '+this.tr(T('Ferma l\'auto reroll','Stop auto reroll')))
          :h('button',{class:'btn primary','data-fid':'rrpf',title:this.tr(T('Apre il menù: blocca le statistiche, imposta l\'auto reroll e gli obiettivi, poi rerolla la perfezione.','Opens the menu: lock stats, set the auto reroll and the goals, then reroll the perfection.')),
            onclick:()=>{this.sfx('rrOpen');this.rrOpen=true;this.rrModal();}},'🎲 '+this.tr(T('Menù rerolling','Rerolling menu'))),
        this.rrAutoEl,
        ]));
    }else side.append(h('p',{class:'sub'},this.t('bagEmpty')));
    return h('div',{class:'gwork'},this.header(T('Reroll dei cimeli','Trinket reroll'),null,[this.maxStatsBtn()]),
      h('p',{class:'sub'},this.tr(T('Scegli un cimelio della sacca e rerolla la sua perfezione. Paghi il tiro e poi tieni il nuovo risultato o riprovi. Dal menù del risultato puoi passare all\'auto reroll.','Pick a trinket from your bag and reroll its perfection. You pay for the roll, then keep the new result or roll again. From the result menu you can switch to auto reroll.'))),
      L.tools,h('div',{class:'bagsplit'},L.left,L.grid,side),
      h('div',{class:'rrfoot'},h('span',null,this.tr(T('Avvisami prima di rerollare cimeli di rarità da','Warn me before rerolling trinkets of rarity from'))),
        h('select',{class:'achsearch rrw','data-fid':'rrwarn',onchange:e=>{d.settings.rrWarn=+e.target.value;this.app.save.write();}},
          [[0,T('Comune','Common')],[1,T('Raro','Rare')],[2,T('Epico','Epic')],[3,T('Leggendario','Legendary')],[4,T('Mitico','Mythic')],[5,T('Mai (nessun avviso)','Never (no warning)')]].map(([v,n])=>h('option',{value:v,selected:v===this.rrWarnLv()},this.tr(n)+(v<5?' ↑':''))))));
  },
  /* the rarity from which a reroll asks first (Settings: rrWarn; default Legendary; 5 = never) */
  rrWarnLv(){const v=this.save.settings.rrWarn;return v==null?3:v;},
  async rrWarn(b){
    if(!b||b.r<this.rrWarnLv())return true;
    return this.ask({title:this.tr(T('Rerollare questo cimelio?','Reroll this trinket?')),body:h('div',null,h('div',{class:'tpconf'},this.tcard(b.id,b.r,{p:b.p,fu:b.f})),
      h('p',{class:'cd'},this.tr(T('È di rarità ','It is of rarity '))+this.tr(RARITY[b.r].n)+'. '+this.tr(T('Il reroll costa zenny e potresti ritrovarti con un risultato peggiore.','A reroll costs zenny and the result may be worse.')))),
      yes:'🎲 '+this.tr(T('Rerolla','Reroll')),no:this.tr(T('Annulla','Cancel'))});
  },
  /* auto reroll of the perfection: rolls until a roll reaches the chosen perfection (or the zenny run out / the player stops it), then shows the usual before / after choice */
  /* the padlock of one stat of the trinket being rerolled: open at first; closing it freezes the stat (price by rarity), opening it is free. after(): redraw */
  rrLockBtn(key,after){
    const P=this.app.progress,b=P.bagGet(this.rrSel),on=!!(b&&b.ls&&b.ls[key]!=null),fee=b?P.keepFee(b.r):0;
    return h('button',{class:'rrlk'+(on?' on':''),'data-fid':'rrlk_'+key,title:on?this.tr(T('Bloccata: i reroll non la cambiano. Clicca per sbloccarla (gratis).','Locked: rerolls do not change it. Click to unlock (free).'))
        :this.tr(T('Blocca: i reroll non la cambieranno. Costo: ','Lock: rerolls will not change it. Cost: '))+(fee?fee+' Z':this.tr(T('gratis','free'))),
      onclick:()=>{if(on){P.unlockStat(this.rrSel,key);this.sfx('rrUnlock');}else if(!P.lockStat(this.rrSel,key)){this.sfx('uiErr');return;}else this.sfx('rrLock');
        const z=document.querySelector('.hdr .zen');if(z)z.replaceChildren(zAmt(this.save.zenny));if(after)after();}},on?'🔒':'🔓');
  },
  /* tooltip line about the roll price: every 10 paid rolls the next ones cost 2% less */
  rrDiscTip(){const P=this.app.progress,pc=Math.round(P.rerollDisc()*100),n=(this.save.gacha&&this.save.gacha.rrPaid)||0;
    return this.tr(T('Ogni 10 tiri il costo dei successivi scende del 2% (massimo 50%). Sconto attuale: '+pc+'% · tiri fatti: '+n+'.','Every 10 rolls the cost of the next ones drops by 2% (50% at most). Current discount: '+pc+'% · rolls so far: '+n+'.'));},
  rrTargetV(){const v=this.save.settings.rrTarget;return v==null?80:v;},
  rrDisp(k,v){return k==='armor'||k==='regen'?Math.round(v*10)/10:k==='proj'?v:Math.round(v*100);},   /* a stat value as the cards show it */
  rrGoalOf(key){if(!this.rrGoal||this.rrGoal.k!==key)this.rrGoal={k:key,v:{}};return this.rrGoal.v;},
  /* the perfection at which the auto reroll stops: the one chosen and every stat goal (the lowest perfection that gives that value); bad: a goal no perfection reaches */
  rrNeed(b){
    let need=this.rrTargetV(),bad=false;const G=this.rrGoalOf(b.id+'|'+b.r),t=trinDef(b.id);
    const b0=this.app.progress.bagGet(this.rrSel);
    for(const k in G){if(b0&&b0.ls&&b0.ls[k]!=null)continue;let hit=null;for(let p=0;p<=100&&hit==null;p++){const e=trinStats(t,b.r,p,b.f).find(x=>x.k===k);if(e&&this.rrDisp(k,e.v)>=G[k])hit=p;}
      if(hit==null)bad=true;else need=Math.max(need,hit);}
    return{need,bad};
  },
  async rrAuto(skipWarn){
    const P=this.app.progress,d=this.save,k=this.rrSel,b=P.bagGet(k),nd=b?this.rrNeed(b):null,tg=nd?nd.need:80;
    if(!b||this.rrAutoOn||!P.canWork(b))return;
    if(nd.bad||!P.freeStats(b).length){this.sfx('uiErr');return;}
    if((b.p!=null?b.p:PF_NOM)>=tg){this.sfx('uiErr');this.toast({type:'info',msg:this.tr(T('Questo cimelio ha già '+tg+'% di perfezione o più.','This trinket already has '+tg+'% perfection or more.'))});return;}
    if(!skipWarn&&!await this.rrWarn(b))return;
    this.sfx('rrAutoGo');this.rrAutoOn=true;this.rrBeat=Date.now();
    let n=0,hit=null,why='',best=null,fail=null;
    try{
      this.rebuild(true);
      while(this.rrAutoOn&&n<2000){
        if(!this.top||this.top.name!=='reroll')break;   /* left the screen: stop paying */
        const o=P.rerollRoll('pf',k,true);if(!o){why=this.tr(T('Zenny finiti.','Out of zenny.'));break;}
        n++;this.rrBeat=Date.now();if(!best||o.p>best.p)best=o;
        if(n%20===0)this.app.save.write();   /* one write per 20 rolls: a write per roll (JSON + checksum + cloud sync) slows the loop down */
        try{this.sfx('rrTickAuto');}catch(e){}
        if(this.rrAutoEl&&this.rrAutoEl.isConnected)this.rrAutoEl.textContent=this.tr(T('Tiri: ','Rolls: '))+n+' · '+this.tr(T('ultimo ','last '))+o.p+'%';
        if(o.p>=tg){hit=o;break;}
        await new Promise(r=>setTimeout(r,35));
      }
    }catch(e){fail=e;}
    this.app.save.write();
    const stopped=!hit&&!why&&!fail&&this.rrAutoOn===false;this.rrAutoOn=false;
    if(!this.top||this.top.name!=='reroll')return;   /* the player left the screen */
    const lab=fail?this.tr(T('Errore durante l\'auto reroll: ','Error during the auto reroll: '))+(fail.message||fail):why||(stopped?this.tr(T('Fermato.','Stopped.')):this.tr(T('Troppi tiri senza risultato.','Too many rolls without a result.')));
    /* it ends with the window: the roll that reached the goal, or (stopped / out of zenny / error / too many rolls) the best one found if it beats the current perfection */
    const res=hit||(best&&best.p>(b.p!=null?b.p:PF_NOM)?best:null);   /* a best roll that is not better than the trinket would only force a paid "keep the old one" */
    try{
      if(res){this.rrPend=res;this.rrKind='pf';this.rrOpen=true;this.rrReveal=true;this.rebuild(true);this.rrModal();
        if(!hit)this.toast({type:'info',msg:lab+' '+this.tr(T('Tiri: ','Rolls: '))+n+' · '+this.tr(T('il migliore è nella finestra.','the best one is in the window.'))});}
      else{this.rebuild(true);this.toast({type:'info',msg:lab+' '+this.tr(T('Tiri: ','Rolls: '))+n});}
    }catch(e){   /* the window failed: never leave the screen stuck */
      this.rrPend=null;this.rrOpen=false;this.rrReveal=false;document.querySelectorAll('.uask.rrm').forEach(x=>x.remove());
      try{this.rebuild(true);}catch(e2){}
      this.toast({type:'info',msg:this.tr(T('Errore nella finestra del reroll: ','Reroll window error: '))+(e.message||e)});
    }
  },

  /* v136b: a reroll opens its own window: before and after, every stat with a green ▲ (better) or red ▼ (worse), and the choice */
  rrRoll(kind){
    const P=this.app.progress,o=P.rerollRoll('pf',this.rrSel);if(!o){this.sfx('uiErr');return;}
    this.sfx('rrRoll');setTimeout(()=>this.sfx('gStop'+Math.min(3,o.r)),240);this.rrPend=o;this.rrKind=kind;this.rrOpen=true;this.rebuild(true);this.rrModal();
  },
  rrModal(){
    const P=this.app.progress,d=this.save,b=P.bagGet(this.rrSel),o=this.rrPend,idle=!o;if(!b){this.rrOpen=false;return;}   /* idle: the menu opened before any roll (locks, auto reroll, goals) */
    const prev=this.modalEl,L=this.app.i18n.lang==='it'?0:1;
    const close=()=>{ov.remove();if(this.modalEl===ov)this.modalEl=prev;this.rrOpen=false;};
    const fee=P.keepFee(b.r),canKeep=d.zenny>=fee;
    const done=nw=>{if(!nw&&!P.payKeep(b.r)){this.sfx('uiErr');return;}   /* keeping the old perfection is paid (by rarity) */
      close();this.sfx(nw?'buy':'uiBack');
      if(nw){const k=P.rerollApply(this.rrSel,o);if(k)this.rrSel=k;this.toast({type:'info',msg:this.tr(T('Tenuto il nuovo cimelio','Kept the new trinket'))});}
      this.rrPend=null;this.rebuild(true);};
    const tA=trinDef(b.id),tB=o?trinDef(o.id):tA,pA=hasPfE(tA,b.f)?(b.p!=null?b.p:PF_NOM):null,pB=o&&hasPfE(tB,o.f)?(o.p!=null?o.p:PF_NOM):null;
    const oP=pB!=null?PFS(pB,b.ls):null,sA=trinStats(tA,b.r,pA!=null?pA:PF_NOM,b.f),sB=o?trinStats(tB,o.r,oP!=null?oP:PF_NOM,o.f):[];   /* locked stats keep their own perfection */
    let up=0,dn=0;
    const reopen=()=>{close();this.rrOpen=true;this.rrModal();};   /* a lock changes what the roll does to the stats: draw it again */
    const lockBtn=k=>this.rrLockBtn(k,reopen);
    const row=(lab,a,c,va,vb,lk)=>{const dir=vb>va?'up':vb<va?'down':'eq';if(dir==='up')up++;if(dir==='down')dn++;
      return h('div',{class:'rrrow '+dir},h('span',{class:'rrk'},lab),h('span',{class:'rra'},a||'—'),h('b',{class:'rrar'},dir==='up'?'▲':dir==='down'?'▼':'='),h('span',{class:'rrb'},c||'—'),lk?lockBtn(lk):h('span'));};
    const rows=[],rv=(k,v)=>k==='armor'||k==='regen'?Math.round(v*10):k==='proj'?v:Math.round(v*100);   /* compared as shown (a stat that rounds to the same number is unchanged) */
    if(idle){if(pA!=null)rows.push(h('div',{class:'rrrow eq'},h('span',{class:'rrk'},this.tr(T('Perfezione','Perfection'))),h('span',{class:'rra'},pA+'%'),h('b',{class:'rrar'}),h('span',{class:'rrb'}),h('span')));
      for(const x of sA)rows.push(h('div',{class:'rrrow eq'},h('span',{class:'rrk'},(TLAB[x.k]||[x.k,x.k])[L]),h('span',{class:'rra'},this.tr(x.t)),h('b',{class:'rrar'}),h('span',{class:'rrb'}),lockBtn(x.k)));}
    else{
    if(pA!=null||pB!=null)rows.push(row(this.tr(T('Perfezione','Perfection')),pA!=null?pA+'%':null,pB!=null?pB+'%':null,pA||0,pB||0));
      for(const k of [...new Set([...sA.map(x=>x.k),...sB.map(x=>x.k)])]){const a=sA.find(x=>x.k===k),c=sB.find(x=>x.k===k);
        rows.push(row((TLAB[k]||[k,k])[L],a?this.tr(a.t):null,c?this.tr(c.t):null,a?rv(k,a.v):0,c?rv(k,c.v):0,a?k:null));}
      const fxA=trinX(tA,pA)||(tA.sp?tA.d:null),fxB=trinX(tB,pB)||(tB.sp?tB.d:null);
      if(tA.xf&&o.id===b.id&&pA!=null&&pB!=null){const a=FXK(pA),c=FXK(pB);if(c>a)up++;else if(c<a)dn++;}   /* the effect follows the perfection too */
      if((o.id!==b.id||(fxA&&fxB&&this.tr(fxA)!==this.tr(fxB)))&&(fxA||fxB))rows.push(h('div',{class:'rrrow fx'},h('span',{class:'rrk'},this.tr(T('Effetto','Effect'))),h('span',{class:'rra'},fxA?this.tr(fxA):'—'),h('b',{class:'rrar'},'⇄'),h('span',{class:'rrb'},fxB?this.tr(fxB):'—'),h('span')));
      }
    const verdict=idle?['eq','']:up&&!dn?['up',T('Migliore','Better')]:dn&&!up?['down',T('Peggiore','Worse')]:up||dn?['mix',T('In parte migliore, in parte peggiore','Partly better, partly worse')]:['eq',T('Uguale','The same')];
    const kind='pf',c=P.rerollCost(kind,b.r),canAgain=P.canWork(b)&&d.zenny>=c,tg=this.rrTargetV();
    /* the stat goals: the best each stat can reach on this trinket (perfection 100), what it has now, and a value that stops the auto reroll (stats grow with the perfection, so
       every goal is just a minimum perfection: the highest of them, and the perfection chosen above, is the stop) */
    const maxS=trinStats(tA,b.r,100,b.f),goal=this.rrGoalOf(b.id+'|'+b.r),needEl=h('small',{class:'rrneed'});
    const updNeed=()=>{const n=this.rrNeed(b);needEl.className='rrneed'+(n.bad?' bad':'');
      needEl.textContent=n.bad?this.tr(T('Un valore scelto non è raggiungibile.','A chosen value cannot be reached.')):this.tr(T('Si ferma da perfezione ≥ ','Stops from perfection ≥ '))+n.need+'%';
      const st=ov.querySelector('[data-fid="rrauto"]');if(st){const dis=!canAgain||n.bad||(b.p!=null?b.p:PF_NOM)>=n.need;st.disabled=dis;st.classList.toggle('alt',dis);st.classList.toggle('primary',!dis);}};
    const goalPanel=h('div',{class:'uaskp rrside2 rrgoal',style:this.rrGoalOpen?'':'display:none'},
      h('p',{class:'cd'},this.tr(T('Massimo ottenibile per ogni statistica e valore che vuoi ottenere (vuoto = nessun obiettivo).','The most each stat can reach and the value you want (empty = no goal).'))),
      maxS.map(m=>{const k=m.k,cur=sA.find(x=>x.k===k),lkd=!!(b.ls&&b.ls[k]!=null),inp=h('input',{type:'number',class:'achsearch rrgv',disabled:lkd,min:0,step:(k==='armor'||k==='regen')?0.1:1,placeholder:cur?String(this.rrDisp(k,cur.v)):'',value:goal[k]!=null?goal[k]:'','data-fid':'rrg_'+k,
          oninput:e=>{const v=parseFloat(e.target.value);if(v>0)goal[k]=v;else delete goal[k];updNeed();}});
        return h('label',{class:'rrg'},h('span',{class:'rrgk'},(lkd?'🔒 ':'')+(TLAB[k]||[k,k])[L]),h('small',null,this.tr(T('max ','max '))+this.rrDisp(k,m.v)+(cur?' · '+this.tr(T('ora ','now '))+this.rrDisp(k,cur.v):'')),inp);}));
    const goalBtn=h('button',{class:'btn small alt rrgbtn','data-fid':'rrgoals',onclick:()=>{this.rrGoalOpen=!this.rrGoalOpen;goalPanel.style.display=this.rrGoalOpen?'':'none';}},'🎯 '+this.tr(T('Obiettivi statistiche','Stat goals')));
    const ov=h('div',{class:'uask rrm'},h('div',{class:'rrwrap'},h('div',{class:'uaskp rrmp'},
      h('h3',null,'🎲 '+this.tr(T('Menù rerolling','Rerolling menu'))),
      idle?h('div',{class:'rrcards'},h('div',null,this.tcard(b.id,b.r,{p:b.p,fu:b.f})))
        :h('div',{class:'rrcards'},h('div',null,h('div',{class:'rrlab'},this.tr(T('Prima','Before'))),this.tcard(b.id,b.r,{p:b.p,fu:b.f})),h('div',{class:'rrarrow'},'→'),
          h('div',{class:'rrnew '+verdict[0]},h('div',{class:'rrlab'},this.tr(T('Nuovo','New'))),this.tcard(o.id,o.r,{p:oP!=null?oP:o.p,fu:o.f}))),
      idle?h('p',{class:'cd'},this.tr(T('Blocca le statistiche da non cambiare (sbloccare è gratis), poi rerolla o avvia l\'auto reroll.','Lock the stats you want to keep (unlocking is free), then reroll or start the auto reroll.'))):h('div',{class:'rrverdict '+verdict[0]},this.tr(verdict[1])),
      h('div',{class:'rrtable'},rows),
      idle?h('div',{class:'row'},
        (()=>{const can=canAgain&&hasPfE(tA,b.f)&&P.freeStats(b).length>0;return h('button',{class:'btn'+(can?' primary':' alt'),disabled:!can,'data-fid':'rrnew',title:this.rrDiscTip(),onclick:async()=>{if(await this.rrWarn(b)){close();this.rrRoll(kind);}}},'🎲 '+this.tr(T('Rerolla la perfezione','Reroll perfection'))+' · ',c?zAmt(c,true):this.tr(T('gratis','free')));})(),
        h('button',{class:'btn alt','data-back':true,'data-fid':'rrclose',onclick:close},this.tr(T('Chiudi','Close'))))
      :h('div',{class:'row'},
        h('button',{class:'btn primary','data-fid':'rrnew',onclick:()=>done(true)},'✓ '+this.tr(T('Tieni il nuovo','Keep the new one'))),
        h('button',{class:'btn'+(canAgain?'':' alt'),disabled:!canAgain,'data-fid':'rragain',title:this.tr(T('Scarta questo tiro e rerolla di nuovo','Discard this roll and reroll again'))+' '+this.rrDiscTip(),
          onclick:()=>{close();this.rrPend=null;this.rrRoll(kind);}},'🎲 '+this.tr(T('Riprova','Again'))+' · ',c?zAmt(c,true):this.tr(T('gratis','free')))),
      ),
      /* the small menus on the right: auto reroll, and under it the stat goals (the maximum of each stat and the value that stops the auto reroll) */
      h('div',{class:'rrcol'},
        h('div',{class:'uaskp rrside2'},h('h3',null,'⏩ '+this.tr(T('Auto reroll','Auto reroll'))),
          h('p',{class:'cd'},this.tr(T('Rerolla la perfezione in automatico finché si verificano tutte le condizioni scelte. Ogni tiro si paga.','Rerolls the perfection automatically until all the chosen conditions are met. Every roll is paid.'))),
          (()=>{const sel=h('select',{class:'achsearch rrtg','data-fid':'rrtarget','aria-label':this.tr(T('Perfezione da ottenere','Perfection to reach')),onchange:e=>{d.settings.rrTarget=+e.target.value;this.app.save.write();updNeed();}},
            [0,50,60,70,75,80,85,90,95,100].map(v=>h('option',{value:v,selected:v===tg},v?'≥ '+v+'%':this.tr(T('Perfezione: qualsiasi','Any perfection')))));sel.value=String(tg);return sel;})(),
          needEl,
          h('button',{class:'btn primary','data-fid':'rrauto',title:this.rrDiscTip(),onclick:()=>{const n=this.rrNeed(b);if(n.bad||(b.p!=null?b.p:PF_NOM)>=n.need){this.sfx('uiErr');return;}close();this.rrPend=null;this.rrAuto(true);}},'⏩ '+this.tr(T('Avvia','Start')))),
        goalBtn,goalPanel)));
    this.root.append(ov);this.modalEl=ov;updNeed();const f=ov.querySelector('[data-fid="rrnew"]');if(f)f.focus({preventScroll:true});
    const reveal=!idle&&this.rrReveal&&pA!=null&&pB!=null;this.rrReveal=false;
    if(reveal)this.rrRevealFx(ov,pA,+(oP!=null?oP:pB));
  },
  /* the result of an auto reroll, slowly: the perfection zooms up towards the player, counts from the old number to the new one (a tick per step, flashes on the way), a big flash,
     then it slams down into its place in the table, the ground cracks and the window shakes. A click anywhere skips it; whatever happens, the window ends up usable. */
  rrRevealFx(ov,pA,pB){
    const A=this.app.audio,tr=x=>this.tr(x),up=pB>pA,eq=pB===pA,d=Math.abs(pB-pA);
    const beep=(f,dur,type,vol,sl,dl)=>{try{if(A&&A.ctx&&A.s.sfx>0)A.toneAt(f,dur,type||'square',vol||.06,sl||0,dl||0);}catch(e){}};
    const mp=ov.querySelector('.rrmp'),cell=ov.querySelector('.rrrow .rrb'),root=this.root;
    const big=h('div',{class:'rrbig'+(up?'':' dn')},Math.round(pA)+'%'),lab=h('div',{class:'rrbiglab'},tr(T('Perfezione','Perfection'))),dl=h('div',{class:'rrdelta'}),fl=h('div',{class:'rrflash'}),
      fx=h('div',{class:'rrfx'},fl,lab,big,dl);
    ov.append(fx);ov.classList.add('rrhidefx','rrbusy');
    let skip=false;fx.addEventListener('pointerdown',()=>{skip=true;});
    const alive=()=>ov.isConnected;
    const wait=ms=>new Promise(r=>{const t0=performance.now(),f=()=>{if(skip||!alive()||performance.now()-t0>=ms)r();else requestAnimationFrame(f);};f();});
    const tween=(ms,fn)=>new Promise(r=>{const t0=performance.now(),f=()=>{if(!alive()){r();return;}const t=skip?1:Math.min(1,(performance.now()-t0)/ms);fn(t);if(t>=1)r();else requestAnimationFrame(f);};f();});
    const place=(x,y,s)=>{big.style.transform='translate(-50%,-50%) translate('+x+'px,'+y+'px) scale('+s+')';};
    const finish=()=>{if(!alive())return;fx.remove();ov.classList.remove('rrhidefx','rrbusy');};
    (async()=>{
      try{
        if(eq){finish();return;}
        const S=2.7;place(0,0,.15);big.style.opacity='0';
        this.sfx('rrZoom');
        await tween(520,t=>{const e=1-Math.pow(1-t,3),o=Math.min(1,t*3);big.style.opacity=String(o);place(0,0,.15+(S-.15)*(e+Math.sin(e*Math.PI)*.12));});
        place(0,0,S);await wait(180);
        /* the count: slow, and slower still towards the end; a tick per step, rising in pitch; a flash every few steps */
        const D=Math.min(5200,2600+d*45);let last=Math.round(pA),bump=0;
        await tween(D,t=>{const e=1-Math.pow(1-t,2.4),v=Math.round(pA+(pB-pA)*e);
          if(v!==last){const stepUp=v>last;last=v;bump=1;big.textContent=v+'%';dl.textContent=(v>=pA?'+':'−')+Math.abs(Math.round(v-pA));
            beep(stepUp?300+e*1300:1500-e*1100,.035,'square',.05);if(Math.abs(v-pA)%5===0)fl.animate([{opacity:0},{opacity:up?.32:.16},{opacity:0}],{duration:240});}
          bump=Math.max(0,bump-.07);const sh=up?bump*.7:0;
          place((Math.random()-.5)*6*bump,(Math.random()-.5)*6*bump,S*(1+.08*bump)+sh*0);
          big.style.setProperty('--g',String(Math.round(40+e*60)));});
        big.textContent=Math.round(pB)+'%';place(0,0,S);
        if(!alive())return;
        /* final flash */
        this.sfx(up?'rrFlash':'rrLose');
        if(up)await new Promise(r=>{fl.animate([{opacity:0},{opacity:.95,offset:.25},{opacity:0}],{duration:420}).onfinish=r;setTimeout(r,500);});
        else await wait(350);
        if(!alive())return;
        /* the slam into the place of the number in the table */
        const fr=fx.getBoundingClientRect(),k=(fr.width/Math.max(1,fx.offsetWidth))||1,br=big.getBoundingClientRect(),cr=cell?cell.getBoundingClientRect():null;
        const tx=cr?((cr.left+cr.width/2)-(br.left+br.width/2))/k:0,ty=cr?((cr.top+cr.height/2)-(br.top+br.height/2))/k:0;
        if(!skip)await tween(230,t=>{const e=t*t*t;place(tx*e,ty*e,S+(1-S)*e);});
        /* impact */
        const ix=cr?(cr.left+cr.width/2-fr.left)/k:fx.offsetWidth/2,iy=cr?(cr.top+cr.height/2-fr.top)/k:fx.offsetHeight/2;
        big.remove();lab.remove();dl.remove();ov.classList.remove('rrhidefx');if(cell)cell.classList.add('rrimpact');
        this.sfx(up?'rrSlam':'uiBack');
        const amp=up?1:.25;
        for(const el of [mp,root])try{el.animate([{transform:'translate(0,0)'},{transform:`translate(${-9*amp}px,${6*amp}px)`},{transform:`translate(${8*amp}px,${-7*amp}px)`},{transform:`translate(${-6*amp}px,${4*amp}px)`},{transform:`translate(${4*amp}px,${-3*amp}px)`},{transform:`translate(${-2*amp}px,${1*amp}px)`},{transform:'translate(0,0)'}],{duration:520,easing:'ease-out'});}catch(e){}
        if(up&&!skip){
          setTimeout(()=>this.sfx('rrCrack'),60);
          const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.setAttribute('class','rrcrack');svg.setAttribute('width',fx.offsetWidth);svg.setAttribute('height',fx.offsetHeight);
          for(let i=0;i<11;i++){const a=i/11*Math.PI*2+Math.random()*.4;let x=ix,y=iy,pts=[x+','+y];const L=90+Math.random()*Math.max(160,fx.offsetWidth*.28);
            for(let r=0;r<L;r+=14+Math.random()*18){x+=Math.cos(a+(Math.random()-.5)*.9)*(14+Math.random()*18);y+=Math.sin(a+(Math.random()-.5)*.9)*(14+Math.random()*18);pts.push(x.toFixed(1)+','+y.toFixed(1));}
            const pl=document.createElementNS(NS,'polyline');pl.setAttribute('points',pts.join(' '));pl.setAttribute('pathLength','1');svg.append(pl);}
          fx.append(svg);
          for(let i=0;i<16;i++){const dust=h('i',{class:'rrdust'});dust.style.left=ix+'px';dust.style.top=iy+'px';dust.style.setProperty('--dx',((Math.random()-.5)*340).toFixed(0)+'px');dust.style.setProperty('--dy',(-40-Math.random()*130).toFixed(0)+'px');dust.style.animationDelay=(Math.random()*.08)+'s';fx.append(dust);}
          fl.animate([{opacity:.5},{opacity:0}],{duration:260});
          await wait(1100);
        }else await wait(300);
        if(up)this.sfx('rrWin');
      }catch(e){}
      finally{finish();}
    })();
  },

  /* "Maximum stats": a detailed window with the wall of every stat (the most a trinket of each rarity can give, at perfection 100), the trinkets that carry it and the values
     per rarity and perfection. Fusion never goes above these walls: a stat is always capped at TCAP x rarity scale x the best perfection factor of the resulting rarity. */
  statFmt(k,v){const L=this.app.i18n.lang==='it'?0:1;if(k==='armor'||k==='regen'){const n=Math.round(v*10)/10;return '+'+(L?n:String(n).replace('.',','));}return k==='cd'?'-'+Math.round(v*100)+'%':k==='proj'?'+'+Math.round(v):'+'+Math.round(v*100)+'%';}
  ,maxStatsBtn(){return h('button',{class:'btn small alt','data-fid':'maxstats',onclick:()=>{this.sfx('rrOpen');this.maxStatsModal();}},'📊 '+this.tr(T('Massimi','Maximums')));}
  ,maxStatsModal(){
    const L=this.app.i18n.lang==='it'?0:1,prev=this.modalEl,close=()=>{ov.remove();if(this.modalEl===ov)this.modalEl=prev;},HI=PF_SPREAD[1];
    const keys=[...Object.keys(TCAP),'proj'],lab=k=>k==='proj'?this.tr(T('quantità','amount')):(TLAB[k]||[k,k])[L];
    const rar=r=>h('span',{style:'color:'+RARITY[r].c},this.tr(RARITY[r].n));
    const wall=(k,r)=>k==='proj'?trinProj(r,100):Math.round(TCAP[k]*RS[r]*HI*1000)/1000;   /* the best a trinket of rarity r can give: cap x scale x perfection 100 */
    const own=k=>TRINKETS.filter(t=>t.m&&(k in t.m));   /* trinkets that carry the stat */
    const at=(t,k,r,pf)=>{const m=trinMods0(t,r,pf);return m[k]||0;};
    let tab='stat',q='',rr=4;const body=h('div',{class:'msbody'});
    const tabs=h('div',{class:'mstabs'});
    const draw=()=>{
      tabs.replaceChildren(...[['stat',T('Per statistica','By stat')],['trin',T('Per cimelio','By trinket')],['rules',T('Regole e limiti','Rules and limits')]].map(([id,n])=>h('button',{class:'btn small'+(tab===id?' primary':' alt'),'data-fid':'ms_'+id,onclick:()=>{tab=id;draw();}},this.tr(n))));
      if(tab==='stat'){
        body.replaceChildren(h('p',{class:'cd'},this.tr(T('Il massimo che un cimelio di ogni rarità può dare per ogni statistica (perfezione 100%). Tocca una riga per vedere quali cimeli la portano e quanto danno.','The most a trinket of each rarity can give for every stat (perfection 100%). Tap a row to see which trinkets carry it and how much they give.'))),
          h('div',{class:'mstab'},h('div',{class:'msrow msh'},h('span',null,this.tr(T('Statistica','Stat'))),[0,1,2,3,4].map(r=>rar(r))),
            keys.map(k=>{const row=h('div',{class:'msrow'},h('b',null,lab(k)),[0,1,2,3,4].map(r=>h('span',null,k==='proj'&&r<3?'—':this.statFmt(k,wall(k,r))))),
              det=h('div',{class:'msdet',style:'display:none'});
              const ts=k==='proj'?TRINKETS.filter(t=>t.m&&('proj' in t.m)):own(k);
              const items=ts.length?ts.map(t=>h('div',{class:'msit'},h('span',null,this.tr(t.n)),h('small',null,k==='proj'?this.tr(T('Leggendario 2 (3 a perfezione 100) · Mitico 3 (4 da 50, 5 a 100)','Legendary 2 (3 at perfection 100) · Mythic 3 (4 from 50, 5 at 100)')):[0,1,2,3,4].map(r=>{const v=at(t,k,r,100);return v?this.statFmt(k,v):'—';}).join(' · '))))
                :[h('p',{class:'cd'},this.tr(T('Nessun cimelio la porta (si ottiene solo da altre fonti).','No trinket carries it (it comes from other sources only).')))];
              det.append(...items);
              row.onclick=()=>{det.style.display=det.style.display==='none'?'':'none';row.classList.toggle('open');};
              return h('div',{class:'msgrp'},row,det);})));
      }else if(tab==='trin'){
        const rs=h('div',{class:'msrs'},[0,1,2,3,4].map(r=>h('button',{class:'btn small'+(rr===r?' primary':' alt'),onclick:()=>{rr=r;draw();}},this.tr(RARITY[r].n))));
        const inp=h('input',{type:'text',class:'achsearch msq',placeholder:'🔍 '+this.tr(T('Cerca cimelio o statistica…','Search trinket or stat…')),value:q,oninput:e=>{q=e.target.value;list();}});
        const lst=h('div',{class:'mslist'});
        const list=()=>{const n=q.trim().toLowerCase();
          lst.replaceChildren(...TRINKETS.filter(t=>t.m&&Object.keys(t.m).length&&(t.r<=rr||canAt(t,rr))).filter(t=>canAt(t,rr)||t.r===rr).filter(t=>!n||this.tr(t.n).toLowerCase().includes(n)||Object.keys(t.m).some(k=>lab(k).toLowerCase().includes(n))).map(t=>{
            const rows=Object.keys(t.m).map(k=>{const a=[0,50,100].map(p=>at(t,k,rr,p));return h('div',{class:'mstr'},h('span',null,lab(k)),h('span',{class:'mstv'},k==='proj'?this.statFmt(k,a[2]):a.map(v=>this.statFmt(k,v)).join(' / ')));});
            return h('div',{class:'msit2'},h('b',null,this.tr(t.n)),h('div',{class:'mstrs'},rows),t.x?h('small',null,'✦ '+this.tr(trinX(t,100))):null);}));
          if(!lst.childNodes.length)lst.append(h('p',{class:'cd'},this.tr(T('Nessun risultato.','No results.'))));};
        body.replaceChildren(h('p',{class:'cd'},this.tr(T('Per la rarità scelta: ogni statistica a perfezione 0% / 50% / 100%. L\'ultimo valore è il massimo raggiungibile.','For the chosen rarity: every stat at perfection 0% / 50% / 100%. The last value is the most it can reach.'))),rs,inp,lst);list();
      }else{
        body.replaceChildren(h('div',{class:'msrules'},
          h('p',null,'▸ '+this.tr(T('Ogni statistica ha un tetto per rarità: tetto base × moltiplicatore di rarità (Comune ×0,35, Raro ×0,55, Epico ×0,75, Leggendario ×1, Mitico ×1,33) × 1,12 a perfezione 100%.','Every stat has a cap per rarity: base cap × rarity multiplier (Common x0.35, Rare x0.55, Epic x0.75, Legendary x1, Mythic x1.33) × 1.12 at perfection 100%.'))),
          h('p',null,'▸ '+this.tr(T('La fusione non supera mai questi tetti: dopo aver unito i cimeli ogni statistica viene ricalcolata sulla rarità del risultato e limitata al suo massimo.','Fusion never goes above these caps: after merging, every stat is worked out again for the resulting rarity and held to its maximum.'))),
          h('p',null,'▸ '+this.tr(T('Tre copie dello stesso cimelio: una rarità in più (fino a Mitico) e, per ogni statistica, la migliore perfezione tra le tre.','Three copies of the same trinket: one rarity up (to Mythic) and, for every stat, the best perfection of the three.'))),
          h('p',null,'▸ '+this.tr(T('Tre cimeli diversi: resta quello con la perfezione più alta e prende fino a 2 statistiche dagli altri, ognuna entro il proprio tetto.','Three different trinkets: the one with the highest perfection stays and takes up to 2 stats from the others, each within its own cap.'))),
          h('p',null,'▸ '+this.tr(T('Quantità: Leggendario 2 (3 a perfezione 100), Mitico 3 (4 da perfezione 50, 5 a 100).','Amount: Legendary 2 (3 at perfection 100), Mythic 3 (4 from perfection 50, 5 at 100).'))),
          h('p',null,'▸ '+this.tr(T('Effetti speciali (Furia Saiyan, Cristallo Divino): ×0,6 a perfezione 0, ×1 a 50, ×1,4 a 100.','Special effects (Saiyan Fury, Divine Crystal): x0.6 at perfection 0, x1 at 50, x1.4 at 100.')))));
      }};
    const ov=h('div',{class:'uask msw'},h('div',{class:'uaskp mswp'},h('h3',null,'📊 '+this.tr(T('Statistiche massime','Maximum stats'))),tabs,body,
      h('div',{class:'row'},h('button',{class:'btn alt','data-back':true,'data-fid':'msclose',onclick:close},this.tr(T('Chiudi','Close'))))));
    this.root.append(ov);this.modalEl=ov;draw();
  },

  /* the result of a fusion, animated: the rarity changes, then the perfection and every stat count up from the base trinket's value to the new one (a tick per step, a flash when a
     row is done, a fanfare at the end). A click anywhere skips to the end. bf: the base trinket before ({id,r,p,ls,f}); k: the key of the new one. */
  fuseFx(bf,k){
    const P=this.app.progress,nb=P.bagGet(k);if(!nb)return;
    const L=this.app.i18n.lang==='it'?0:1,tB=trinDef(bf.id),tN=trinDef(nb.id),pOf=(t,b)=>hasPfE(t,b.f)?(b.p!=null?+b.p:PF_NOM):null,pA=pOf(tB,bf),pB=pOf(tN,nb);
    const A=trinStats(tB,bf.r,PFS(pA!=null?pA:PF_NOM,bf.ls),bf.f),C=trinStats(tN,nb.r,PFS(pB!=null?pB:PF_NOM,nb.ls),nb.f);
    const fmt=(key,v)=>{if(key==='armor'||key==='regen'){const n=Math.round(v*10)/10;return '+'+(L?n:String(n).replace('.',','));}return key==='cd'?'-'+Math.round(v*100)+'%':key==='proj'?'+'+Math.round(v):'+'+Math.round(v*100)+'%';};
    const rows=[];
    if(bf.r!==nb.r)rows.push({lab:this.tr(T('Rarità','Rarity')),txtA:this.tr(RARITY[bf.r].n),txtB:this.tr(RARITY[nb.r].n),colB:RARITY[nb.r].c,up:true});
    if(pA!=null&&pB!=null)rows.push({lab:this.tr(T('Perfezione','Perfection')),a:pA,b:pB,f:v=>Math.round(v)+'%',up:pB>pA});
    for(const c of C){const a=A.find(x=>x.k===c.k),va=a?a.v:0,lab=(TLAB[c.k]||[c.k,c.k])[L];
      rows.push({lab:lab+(a?'':' ★'),a:va,b:c.v,f:v=>fmt(c.k,v),up:c.v>va&&(c.k==='proj'?c.v>va:Math.round(c.v*100)>Math.round(va*100)||c.k==='armor'||c.k==='regen'),isNew:!a});}
    const els=rows.map(r=>h('div',{class:'fzr'},h('span',{class:'fzl'},r.lab),h('span',{class:'fza'},r.txtA||(r.isNew?'—':r.f(r.a))),h('b',{class:'fzar'},'▶'),h('b',{class:'fzb'},r.txtB||(r.isNew?'':r.f(r.a)))));
    const inf=this.tinfo(nb.id,nb.r,nb.p,nb.f);
    const ok=h('button',{class:'btn primary','data-fid':'fzok',onclick:()=>{ov.remove();if(this.modalEl===ov)this.modalEl=prev;}},'✓ '+this.tr(T('Ottimo','Great')));ok.disabled=true;
    const prev=this.modalEl,ov=h('div',{class:'uask fzfx'},h('div',{class:'uaskp fzp'},h('h3',null,'⚗ '+this.tr(T('Fusione riuscita!','Fusion done!'))),
      h('div',{class:'fzhead',style:'--c:'+inf.c},tGlyph(inf.t.id,inf.c),h('div',null,h('b',{style:'color:'+inf.c},inf.name),h('small',null,inf.rar+(inf.perf!=null?' · '+inf.perf+'%':'')))),
      h('div',{class:'fzrows'},els),ok));
    this.root.append(ov);this.modalEl=ov;
    let skip=false;ov.addEventListener('pointerdown',()=>{skip=true;});
    const alive=()=>ov.isConnected,wait=ms=>new Promise(r=>{const t0=performance.now(),f=()=>{if(skip||!alive()||performance.now()-t0>=ms)r();else requestAnimationFrame(f);};f();});
    const tween=(ms,fn)=>new Promise(r=>{const t0=performance.now(),f=()=>{if(!alive()){r();return;}const t=skip?1:Math.min(1,(performance.now()-t0)/ms);fn(t);if(t>=1)r();else requestAnimationFrame(f);};f();});
    (async()=>{
      try{
        for(let i=0;i<rows.length&&alive();i++){
          const r=rows[i],el=els[i],bEl=el.querySelector('.fzb');el.classList.add('on');
          if(r.txtB){await wait(260);bEl.textContent=r.txtB;bEl.style.color=r.colB;el.classList.add('up','flash');this.sfx('rrFlash');await wait(420);continue;}
          if(r.isNew){await wait(240);bEl.textContent=r.f(r.b);el.classList.add('up','flash','new');this.sfx('rrLock');await wait(380);continue;}
          if(r.b===r.a){bEl.textContent=r.f(r.b);await wait(120);continue;}
          let last=-1;await tween(Math.min(1100,500+Math.abs(r.b-r.a)*(r.f(1).includes('%')?1:100)*3),t=>{const v=r.a+(r.b-r.a)*(1-Math.pow(1-t,3)),s=r.f(v);if(s!==last){last=s;bEl.textContent=s;if(t<1)this.sfx('rrTickAuto');}});
          bEl.textContent=r.f(r.b);if(r.up){el.classList.add('up','flash');this.sfx('rrSlam');}await wait(260);
        }
        if(alive())this.sfx('rrWin');
      }catch(e){}
      finally{if(alive()){rows.forEach((r,i)=>{const b=els[i].querySelector('.fzb');els[i].classList.add('on');if(r.txtB){b.textContent=r.txtB;b.style.color=r.colB;}else b.textContent=r.f(r.b);if(r.up)els[i].classList.add('up');});ok.disabled=false;try{ok.focus({preventScroll:true});}catch(e){}}}
    })();
  },

  /* ---------- Fusion (from the Gacha shop or the bag) ----------
     v141: three slots in a row filled from the bag grid below, each with its stats under it; then the result: every stat the final trinket has more than the base
     (the one that stays) is shown "before ──▶ after" on a highlighted row, and only the stats it gains from the other two are written in green */
  screen_fuse(){
    const P=this.app.progress,d=this.save,st=this.fuF||(this.fuF={q:'',rar:[1,1,1,1,1],sort:'rar'}),test=!!d.settings.sandbox;
    const sl=this.fuSel=(this.fuSel||[]).filter(k=>P.bagGet(k));
    const items=d.bag.map(b=>({k:trinketKey(b.id,b.r),id:b.id,r:b.r,p:b.p,f:b.f,at:b.at,b})).filter(it=>P.canWork(it.b));
    const toggle=k=>{const i=sl.indexOf(k);if(i>=0)sl.splice(i,1);else if(sl.length<3)sl.push(k);else{this.sfx('uiErr');return;}this.rebuild(true);};
    const L=this.tlist(st,items,{onclick:it=>toggle(it.k),card:it=>({check:sl.includes(it.k),eq:(d.equips||[]).some(e=>e&&trinketKey(e.id,e.r)===it.k)})});
    const plan=sl.length===3?P.fusePlan(sl):null,ok=plan&&!plan.block,rv=(k,v)=>k==='armor'||k==='regen'?Math.round(v*10):k==='proj'?v:Math.round(v*100);   /* compared as shown */
    const give=(b,s)=>!!(ok&&plan.f.some(e=>e.id===b.id&&e.k===s.k)&&b!==plan.base);   /* the stat this slot gives to the result */
    const slot=i=>{const k=sl[i],b=k&&P.bagGet(k);
      if(!b)return h('div',{class:'fcol'},h('div',{class:'fslotb'},h('span',{class:'tplus'},'+'),h('small',null,this.tr(T('Scegli dalla sacca','Pick from the bag')))),h('div',{class:'fstats'}));
      const inf=this.tinfo(b.id,b.r,b.p,b.f),isBase=ok&&b===plan.base;
      return h('div',{class:'fcol'},
        h('button',{class:'fslotb on'+(isBase?' base':''),style:'--c:'+inf.c,'data-fid':'fs'+i,title:this.tr(T('Clicca per toglierlo','Click to remove')),onclick:()=>{this.sfx('uiBack');toggle(k);}},
          tGlyph(inf.t.id,inf.c),h('div',{class:'fsn'},h('b',{style:'color:'+inf.c},inf.name),h('small',null,inf.rar+(inf.perf!=null?' · '+inf.perf+'%':''))),
          isBase?h('span',{class:'fbase'},this.tr(T('BASE','BASE'))):null,h('span',{class:'fsx'},'✕')),
        h('div',{class:'fstats'},inf.stats.length?inf.stats.map(s=>h('span',{class:give(b,s)?'give':''},(give(b,s)?'▶ ':'')+this.tr(s.t))):h('span',{class:'mute'},'—')));};
    /* result: the base trinket before -> after */
    let res;
    if(plan&&plan.block)res=h('div',{class:'fcol fres'},h('p',{class:'bad'},this.tr(T('Hai già questo cimelio a questa rarità nella sacca: il risultato lo duplicherebbe. Cambia uno dei tre.','You already have this trinket at this rarity in your bag: the result would duplicate it. Change one of the three.'))));
    else if(ok){
      const bs=plan.base,A=trinStats(trinDef(bs.id),bs.r,PFS(hasPfE(trinDef(bs.id),bs.f)?(bs.p!=null?bs.p:PF_NOM):PF_NOM,bs.ls),bs.f),C=trinStats(trinDef(plan.id),plan.r,PFS(plan.p,plan.ls),plan.f),inf=this.tinfo(plan.id,plan.r,plan.p,plan.f);
      const rows=[];
      if(plan.r!==bs.r)rows.push(h('div',{class:'frow up'},h('span',{class:'fa',style:'color:'+RARITY[bs.r].c},this.tr(RARITY[bs.r].n)),h('b',{class:'far'},'───▶'),h('span',{class:'fb',style:'color:'+RARITY[plan.r].c},this.tr(RARITY[plan.r].n))));
      for(const c of C){const a=A.find(x=>x.k===c.k);
        if(!a)rows.push(h('div',{class:'frow new'},h('span',{class:'fb'},this.tr(c.t)),h('small',null,this.tr(T('nuova','new')))));
        else if(rv(c.k,c.v)>rv(a.k,a.v))rows.push(h('div',{class:'frow up'},h('span',{class:'fa'},this.tr(a.t)),h('b',{class:'far'},'───▶'),h('span',{class:'fb'},this.tr(c.t))));
        else rows.push(h('div',{class:'frow eq'},h('span',{class:'fb'},this.tr(c.t))));}
      res=h('div',{class:'fcol fres'},
        h('div',{class:'fslotb on res',style:'--c:'+inf.c},tGlyph(inf.t.id,inf.c),h('div',{class:'fsn'},h('b',{style:'color:'+inf.c},inf.name),h('small',null,inf.rar+' · '+inf.perf+'%'))),
        h('div',{class:'fstats frows'},rows),
        h('button',{class:'btn primary fgo','data-fid':'fusego',onclick:async()=>{
          const body=h('div',null,h('div',{class:'tpconf'},sl.map(k=>{const b=P.bagGet(k);return this.tcard(b.id,b.r,{p:b.p,fu:b.f});})),
            h('p',{class:'cd'},this.tr(T('Questi tre cimeli verranno consumati e diventeranno uno solo.','These three trinkets will be used up and become a single one.'))));
          if(!await this.ask({title:this.tr(T('Fondere questi cimeli?','Fuse these trinkets?')),body,yes:'⚗ '+this.tr(T('Fondi','Fuse')),no:this.tr(T('Annulla','Cancel'))}))return;
          const bf={id:bs.id,r:bs.r,p:bs.p,ls:bs.ls,f:bs.f},k=P.fuse(sl);if(!k){this.sfx('uiErr');return;}
          this.sfx('transform');this.fuSel=[];this.bagSel=k;this.fuDone=k;this.rebuild(true);this.fuseFx(bf,k);}},'⚗ '+this.tr(T('Fondi','Fuse'))));
    }else res=h('div',{class:'fcol fres'},h('div',{class:'fslotb res'},h('span',{class:'tplus'},'?'),h('small',null,this.tr(T('Inserisci 3 cimeli per vedere il risultato.','Put in 3 trinkets to see the result.')))),h('div',{class:'fstats'}));
    const done=this.fuDone&&P.bagGet(this.fuDone);this.fuDone=null;
    return h('div',{class:'gwork'},this.header(T('Fusione dei cimeli','Trinket fusion'),null,[this.maxStatsBtn()]),
      h('p',{class:'sub'},this.tr(T('Tre cimeli della sacca diventano uno: resta quello con la perfezione più alta e prende la statistica migliore degli altri due (al massimo 2 in più). Se i tre sono della stessa rarità il risultato sale di una rarità (fino a Mitico); altrimenti ha la rarità più alta dei tre. Tre copie dello stesso cimelio uniscono la migliore perfezione di ogni statistica. Le statistiche non superano mai il massimo della rarità.',
        'Three trinkets from your bag become one: the one with the highest perfection stays and takes the best stat of the other two (2 extra at most). If the three have the same rarity the result goes up one rarity (up to Mythic); otherwise it has the highest rarity of the three. Three copies of the same trinket merge the best perfection of every stat. Stats never go past the cap of their rarity.'))),
      done?h('div',{class:'fdone'},h('b',null,'⚗ '+this.tr(T('Fusione riuscita!','Fusion done!'))),this.tcard(done.id,done.r,{p:done.p,fu:done.f})):null,
      h('div',{class:'fwb'},slot(0),slot(1),slot(2),h('div',{class:'fwarr'},'═▶'),res),
      L.tools,h('div',{class:'bagsplit'},L.left,L.grid));
  }
});

/* ====== Swap Machine window (a map structure, MapDirector 'swapper'): pick up to MACH_MAX carried trinkets, then a ~MACH_SECS s animation - the trinkets circle inside
   the dome, flash and turn into the new ones - and the results come out of the drawer. The swap itself is rolled by Game.swapRun when the animation starts ====== */
Object.assign(UI.prototype,{
  swapperModal(m,g){
    const tx=(a,b)=>this.tr(T(a,b)),F=MACH,S=innerWidth<700?.78:1.15,TAUU=Math.PI*2,sel=m.sel||[];
    const pos=(x,y)=>'left:'+(x/F.w*100).toFixed(2)+'%;top:'+(y/F.h*100).toFixed(2)+'%';
    const spr=h('div',{class:'mchs'}),dome=h('div',{class:'mdome'}),draw=h('div',{class:'mdraw',style:pos(F.drawer.x,F.drawer.y)}),fl=h('div',{class:'mfl',style:pos(F.dome.x,F.dome.y)});
    if(F.url)spr.style.backgroundImage='url('+F.url+')';
    const fig=h('div',{class:'mchf',style:'--s:'+S},spr,fl,dome,draw);
    let fr=-1;const setFrame=i=>{if(i===fr)return;fr=i;spr.style.backgroundPosition='calc('+(-(i%4)*F.w)+'px*var(--s)) calc('+(-((i/4)|0)*F.h)+'px*var(--s))';};setFrame(7);
    const panel=h('div',{class:'mpanel'}),note=h('p',{class:'mnote'});
    const rows=g.trinkets.map(id=>({id,r:g.trR(id),p:g.trP(id),fu:!!g.tFu[id]}));
    const cnt=h('b',{class:'mcnt'}),go=h('button',{class:'btn primary','data-fid':'mchgo','data-focus':true,onclick:()=>start()},'⚡ '+tx('Avvia lo scambio','Start the swap'));
    const rowEls=[];
    const upd=()=>{cnt.textContent=sel.length+' / '+MACH_MAX;go.disabled=!sel.length;for(const e of rowEls)e.el.classList.toggle('on',sel.includes(e.id));};
    const lst=h('div',{class:'mlist'},rows.map(r=>{
      const t=trinDef(r.id),c=RARITY[r.r].c,pf=hasPfE(t,null)?r.p:null,cb=h('input',{type:'checkbox'});cb.disabled=r.fu;
      cb.addEventListener('change',()=>{
        if(cb.checked){if(sel.length>=MACH_MAX){cb.checked=false;this.sfx('uiErr');return;}sel.push(r.id);}else{const i=sel.indexOf(r.id);if(i>=0)sel.splice(i,1);}
        this.sfx('uiTab');upd();});
      const el=h('label',{class:'mrow'+(r.fu?' off':''),style:'--c:'+c,title:r.fu?tx('I cimeli fusi non si possono scambiare.','Fused trinkets cannot be swapped.'):''},cb,h('span',{class:'mck'}),tGlyph(r.id,c),
        h('div',{class:'mrn'},h('b',{style:'color:'+c},this.tr(t.n)),h('small',null,this.tr(RARITY[r.r].n)+(pf!=null?' · '+pf+'%':'')+(r.fu?' · ⚗ '+tx('fuso','fused'):''))),pf!=null?this.perfBar(pf,true):null);
      rowEls.push({id:r.id,el});return el;}));
    const sub=h('p',{class:'sub'},tx('Scegli fino a '+MACH_MAX+' cimeli: ognuno diventa un altro cimelio della stessa rarità, con perfezione uguale o maggiore. Il nuovo cimelio è casuale.','Pick up to '+MACH_MAX+' trinkets: each becomes another trinket of the same rarity, with equal or better perfection. The new trinket is random.'));
    const leave=h('button',{class:'btn alt','data-back':true,onclick:()=>{this.sfx('uiBack');this.app.resolveModal(0);}},tx('Esci','Leave'));
    const btns=h('div',{class:'row'},go,leave);
    panel.append(h('div',{class:'mhead'},tx('Cimeli che porti','Trinkets you carry'),cnt),lst,note);
    const root=h('div',{class:'screen modal mchm'},h('h2',null,'⚙ '+tx('Macchina dello Scambio','Swap Machine')),sub,h('div',{class:'mwrap'},fig,panel),btns);
    const collect=m.phase==='collect';
    if(collect)panel.replaceChildren(h('div',{class:'mhead'},tx('Il macchinario si apre…','The machine is opening…')));
    upd();
    let busy=false;
    const alive=()=>root.isConnected,wait=ms=>new Promise(r=>setTimeout(r,ms));
    /* select phase: the machine starts and works on the map (the bar above it); the window closes so you can keep playing */
    const start=()=>{
      if(busy||!sel.length)return;
      if(!g.mchStart(m.f,[...sel])){this.sfx('uiErr');note.textContent=tx('Nessun cimelio compatibile: la macchina non può scambiarli.','No compatible trinket: the machine cannot swap them.');return;}
      busy=true;this.sfx('rrOpen');this.app.resolveModal(0);
    };
    /* collect phase: the shortened show - the trinkets circle in the dome, flash and change, then the drawer opens */
    const play=(res,T0)=>{
      busy=true;
      sub.remove();btns.remove();
      const bar=h('i'),lbl=h('span',null),bw=h('div',{class:'mbar'},bar),status=h('div',{class:'mstat'},h('b',{class:'mst'},tx('Scambio in corso…','Swapping…')),lbl);
      panel.replaceChildren(status,bw);fig.classList.add('shk');
      const n=res.length,flips=res.map((_,i)=>n===1?.62:.5+.13*i),cols=res.map(r=>RARITY[r.o.r].c);
      const items=res.map((r,i)=>{const el=h('div',{class:'mit'},tGlyph(r.o.id,cols[i]));dome.append(el);return{el,r,a:i*TAUU/n,flipped:false,sh:0,col:cols[i]};});
      const rnd=()=>TRINKETS[(Math.random()*TRINKETS.length)|0].id;
      const t0=performance.now();let last=t0,fU=0,nextTick=0,nextSpark=0;
      const stg=q=>q<.2?tx('Scansione dei cimeli…','Scanning the trinkets…'):q<.5?tx('Disassemblaggio…','Taking apart…'):q<.82?tx('Ricomposizione…','Recomposing…'):tx('Finalizzazione…','Finishing…');
      const burst=(it)=>{fl.classList.remove('go');void fl.offsetWidth;fl.style.setProperty('--c',it.col);fl.classList.add('go');fU=performance.now()+260;this.sfx('rrFlash');};
      const spark=()=>{const s=h('i',{class:'spk',style:'left:'+(8+Math.random()*84).toFixed(1)+'%;top:'+(12+Math.random()*76).toFixed(1)+'%;--a:'+((Math.random()*360)|0)+'deg'});fig.append(s);setTimeout(()=>s.remove(),520);};
      const tick=now=>{
        if(!alive())return;
        const q=Math.min(1,(now-t0)/T0),dt=Math.min(.08,(now-last)/1000);last=now;
        bar.style.width=(q*100).toFixed(1)+'%';lbl.textContent=Math.round(q*100)+'% · '+stg(q);
        for(let i=0;i<items.length;i++){
          const it=items[i],fq=flips[i];
          if(!it.flipped&&q>=fq){it.flipped=true;it.el.replaceChildren(tGlyph(it.r.n.id,it.col));it.el.classList.add('pop');burst(it);}
          else if(!it.flipped&&q>fq-.12&&now>it.sh){it.sh=now+110;it.el.replaceChildren(tGlyph(rnd(),it.col));}   /* it morphs through other trinkets just before the flash */
          const w=it.flipped?1.4+3.2*(1-(q-fq)/(1-fq)):1.4+8*Math.pow(q/fq,3);it.a+=w*dt;
          const s=Math.sin(it.a),dp=(s+1)/2;
          it.el.style.cssText='left:'+((F.dome.x+F.dome.rx*Math.cos(it.a))/F.w*100).toFixed(2)+'%;top:'+((F.dome.y+F.dome.ry*s)/F.h*100).toFixed(2)+'%;transform:translate(-50%,-50%) scale('+(.7+.4*dp).toFixed(2)+');opacity:'+(.6+.4*dp).toFixed(2)+';z-index:'+((dp*10)|0);
        }
        setFrame(now<fU?5:q<.08?7:q>.93?2:(((now/110)|0)%2?4:0));
        if(now>nextTick){nextTick=now+520;this.sfx('mchTick');}
        if(now>nextSpark&&Ambient.on){nextSpark=now+90;spark();}
        if(q<1)requestAnimationFrame(tick);else reveal(items,res);
      };
      requestAnimationFrame(tick);
    };
    /* the drawer opens: a capsule falls from the dome into it, then each new trinket comes out and slides into its place */
    const reveal=async(items,res)=>{
      if(!alive())return;
      fig.classList.remove('shk');setFrame(3);this.sfx('rrWin');
      for(const it of items)it.el.classList.add('out');
      const ok=h('button',{class:'btn primary','data-fid':'mchok','data-focus':true,onclick:()=>{this.sfx('chest');this.app.resolveModal(0);}},'✓ '+tx('Ritira i cimeli','Collect the trinkets'));ok.disabled=true;
      const cards=res.map(r=>{
        const dp=hasPf(trinDef(r.n.id))?r.n.p-r.o.p:null,c=this.tcard(r.n.id,r.n.r,{p:r.n.p}),
          from=h('div',{class:'mfrom'},tx('Era: ','Was: ')+this.tr(trinDef(r.o.id).n)+(dp!=null?' · '+r.o.p+'% → '+r.n.p+'%':''),dp>0?h('b',{class:'up'},' ▲ +'+dp):null);
        return h('div',{class:'mrc'},c,from);});
      const out=h('div',{class:'mres'},cards);
      panel.replaceChildren(h('div',{class:'mhead'},tx('Il cassetto si apre!','The drawer opens!')),out,h('div',{class:'row'},ok));
      cards.forEach(c=>{c.style.opacity='0';});
      await wait(450);
      for(let i=0;i<cards.length&&alive();i++){
        const cap=h('div',{class:'mcap',style:pos(F.dome.x,F.dome.y)});fig.append(cap);
        cap.animate([{left:(F.dome.x/F.w*100)+'%',top:(F.dome.y/F.h*100)+'%',opacity:1,transform:'translate(-50%,-50%) scale(1)'},{left:(F.drawer.x/F.w*100)+'%',top:(F.drawer.y/F.h*100)+'%',opacity:.9,transform:'translate(-50%,-50%) scale(.8)'}],{duration:520,easing:'cubic-bezier(.5,0,.8,.6)',fill:'forwards'});
        await wait(540);cap.remove();if(!alive())return;
        this.sfx('rrSlam');
        const c=cards[i];c.style.opacity='1';
        const dr=draw.getBoundingClientRect(),cr=c.getBoundingClientRect();
        c.animate([{transform:'translate('+(dr.left+dr.width/2-(cr.left+cr.width/2))+'px,'+(dr.top+dr.height/2-(cr.top+cr.height/2))+'px) scale(.12)',opacity:0},{opacity:1,offset:.3},{transform:'none',opacity:1}],{duration:700,easing:'cubic-bezier(.2,.9,.3,1.08)'});
        this.sfx('trinket');await wait(620);
      }
      if(alive()){ok.disabled=false;try{ok.focus({preventScroll:true});}catch(e){}}
    };
    if(collect)setTimeout(()=>{if(root.isConnected)play(m.f.job.res,2800);},450);
    return root;
  }
});
