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
      i.t.sp||i.t.x?h('p',null,this.tr(i.t.sp&&!i.t.m?i.t.d:(i.t.x||i.t.d))):null,
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
    const L=this.tlist(st,items,{onclick:it=>{if(this.rrPend||this.rrAutoOn)return this.sfx('uiErr');this.rrSel=it.k;this.rebuild(true);},card:it=>({sel:it.k===this.rrSel,eq:(d.equips||[]).some(e=>e&&trinketKey(e.id,e.r)===it.k)})});
    const b=this.rrSel&&P.bagGet(this.rrSel),side=h('div',{class:'bagside'});
    if(this.rrPend&&!this.rrOpen)this.rrPend=null;   /* a roll left without a choice keeps the old trinket */
    if(b){
      const can=P.canWork(b),run=!!this.rrAutoOn;
      this.rrAutoEl=h('small',{class:'rrautost'});
      side.append(this.tdet(b.id,b.r,b.p,b.f,[
        run?h('button',{class:'btn','data-fid':'rrstop',onclick:()=>{this.rrAutoOn=false;}},'⏹ '+this.tr(T('Ferma l\'auto reroll','Stop auto reroll')))
          :h('button',{class:'btn primary','data-fid':'rrpf',title:this.tr(T('Apre il menù: blocca le statistiche, imposta l\'auto reroll e gli obiettivi, poi rerolla la perfezione.','Opens the menu: lock stats, set the auto reroll and the goals, then reroll the perfection.')),
            onclick:()=>{this.sfx();this.rrOpen=true;this.rrModal();}},'🎲 '+this.tr(T('Menù rerolling','Rerolling menu'))),
        this.rrAutoEl,
        test&&!can?h('p',{class:'bad'},this.tr(T('In modalità Test si possono rerollare solo i cimeli estratti in Test.','In Test mode only the trinkets pulled in Test can be rerolled.'))):null]));
    }else side.append(h('p',{class:'sub'},this.t('bagEmpty')));
    return h('div',{class:'gwork'},this.header(T('Reroll dei cimeli','Trinket reroll')),
      h('p',{class:'sub'},this.tr(T('Scegli un cimelio della sacca e rerolla la sua perfezione. Paghi il tiro, poi decidi tu: tenere il nuovo (gratis) o il vecchio (a pagamento, in base alla rarità). Dal menù del risultato puoi passare all\'auto reroll.','Pick a trinket from your bag and reroll its perfection. You pay for the roll, then you decide: keep the new one (free) or the old one (paid, by rarity). From the result menu you can switch to auto reroll.'))),
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
      h('p',{class:'cd'},this.tr(T('È di rarità ','It is of rarity '))+this.tr(RARITY[b.r].n)+'. '+this.tr(T('Il reroll costa zenny e potresti ritrovarti con un risultato peggiore (puoi sempre tenere il vecchio).','A reroll costs zenny and the result may be worse (you can always keep the old one).')))),
      yes:'🎲 '+this.tr(T('Rerolla','Reroll')),no:this.tr(T('Annulla','Cancel'))});
  },
  /* auto reroll of the perfection: rolls until a roll reaches the chosen perfection (or the zenny run out / the player stops it), then shows the usual before / after choice */
  /* the padlock of one stat of the trinket being rerolled: open at first; closing it freezes the stat (price by rarity), opening it is free. after(): redraw */
  rrLockBtn(key,after){
    const P=this.app.progress,b=P.bagGet(this.rrSel),on=!!(b&&b.ls&&b.ls[key]!=null),fee=b?P.keepFee(b.r):0;
    return h('button',{class:'rrlk'+(on?' on':''),'data-fid':'rrlk_'+key,title:on?this.tr(T('Bloccata: i reroll non la cambiano. Clicca per sbloccarla (gratis).','Locked: rerolls do not change it. Click to unlock (free).'))
        :this.tr(T('Blocca: i reroll non la cambieranno. Costo: ','Lock: rerolls will not change it. Cost: '))+(fee?fee+' Z':this.tr(T('gratis','free'))),
      onclick:()=>{if(on){P.unlockStat(this.rrSel,key);this.sfx('uiBack');}else if(!P.lockStat(this.rrSel,key)){this.sfx('uiErr');return;}else this.sfx('buy');
        const z=document.querySelector('.hdr .zen');if(z)z.replaceChildren(zAmt(this.save.zenny));if(after)after();}},on?'🔒':'🔓');
  },
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
    this.rrAutoOn=true;this.rebuild(true);
    let n=0,hit=null,why='';
    while(this.rrAutoOn&&n<2000){
      if(this.top.name!=='reroll'){this.rrAutoOn=false;return;}   /* left the screen: stop paying */
      const o=P.rerollRoll('pf',k);if(!o){why=this.tr(T('Zenny finiti.','Out of zenny.'));break;}
      n++;this.sfx('uiTab');
      if(this.rrAutoEl&&this.rrAutoEl.isConnected)this.rrAutoEl.textContent=this.tr(T('Tiri: ','Rolls: '))+n+' · '+this.tr(T('ultimo ','last '))+o.p+'%';
      if(o.p>=tg){hit=o;break;}
      await new Promise(r=>setTimeout(r,35));
    }
    const stopped=!hit&&!why&&this.rrAutoOn===false;this.rrAutoOn=false;
    if(this.stack[this.stack.length-1].name!=='reroll')return;   /* the player left the screen */
    if(hit){this.sfx('gStop'+Math.min(3,hit.r));this.rrPend=hit;this.rrKind='pf';this.rrOpen=true;this.rebuild(true);this.rrModal();}
    else{this.rebuild(true);this.toast({type:'info',msg:(why||(stopped?this.tr(T('Fermato.','Stopped.')):this.tr(T('Troppi tiri senza risultato.','Too many rolls without a result.'))))+' '+this.tr(T('Tiri: ','Rolls: '))+n});}
  },

  /* v136b: a reroll opens its own window: before and after, every stat with a green ▲ (better) or red ▼ (worse), and the choice */
  rrRoll(kind){
    const P=this.app.progress,o=P.rerollRoll('pf',this.rrSel);if(!o){this.sfx('uiErr');return;}
    this.sfx('gStop'+Math.min(3,o.r));this.rrPend=o;this.rrKind=kind;this.rrOpen=true;this.rebuild(true);this.rrModal();
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
      const fxA=tA.x||(tA.sp?tA.d:null),fxB=tB.x||(tB.sp?tB.d:null);
      if(o.id!==b.id&&(fxA||fxB))rows.push(h('div',{class:'rrrow fx'},h('span',{class:'rrk'},this.tr(T('Effetto','Effect'))),h('span',{class:'rra'},fxA?this.tr(fxA):'—'),h('b',{class:'rrar'},'⇄'),h('span',{class:'rrb'},fxB?this.tr(fxB):'—'),h('span')));
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
      idle&&!P.canWork(b)?h('p',{class:'bad'},this.tr(T('In modalità Test si possono rerollare solo i cimeli estratti in Test.','In Test mode only the trinkets pulled in Test can be rerolled.'))):null,
      h('div',{class:'rrtable'},rows),
      idle?h('div',{class:'row'},
        (()=>{const can=canAgain&&hasPfE(tA,b.f)&&P.freeStats(b).length>0;return h('button',{class:'btn'+(can?' primary':' alt'),disabled:!can,'data-fid':'rrnew',onclick:async()=>{if(await this.rrWarn(b)){close();this.rrRoll(kind);}}},'🎲 '+this.tr(T('Rerolla la perfezione','Reroll perfection'))+' · ',c?zAmt(c,true):this.tr(T('gratis','free')));})(),
        h('button',{class:'btn alt','data-back':true,'data-fid':'rrclose',onclick:close},this.tr(T('Chiudi','Close'))))
      :h('div',{class:'row'},
        h('button',{class:'btn primary','data-fid':'rrnew',onclick:()=>done(true)},'✓ '+this.tr(T('Tieni il nuovo','Keep the new one'))),
        h('button',{class:'btn'+(canAgain?'':' alt'),disabled:!canAgain,'data-fid':'rragain',title:this.tr(T('Scarta questo tiro (tieni il vecchio) e rerolla di nuovo','Discard this roll (keep the old one) and reroll again')),
          onclick:()=>{close();this.rrPend=null;this.rrRoll(kind);}},'🎲 '+this.tr(T('Riprova','Again'))+' · ',c?zAmt(c,true):this.tr(T('gratis','free'))),
        h('button',{class:'btn alt','data-back':true,'data-fid':'rrold',disabled:!canKeep,title:this.tr(T('Tenere il vecchio costa in base alla rarità.','Keeping the old one costs by rarity.')),onclick:()=>done(false)},this.tr(T('Tieni il vecchio','Keep the old one'))+' · ',fee?zAmt(fee,true):this.tr(T('gratis','free')))),
      ),
      /* the small menus on the right: auto reroll, and under it the stat goals (the maximum of each stat and the value that stops the auto reroll) */
      h('div',{class:'rrcol'},
        h('div',{class:'uaskp rrside2'},h('h3',null,'⏩ '+this.tr(T('Auto reroll','Auto reroll'))),
          h('p',{class:'cd'},this.tr(T('Rerolla la perfezione in automatico finché si verificano tutte le condizioni scelte. Ogni tiro si paga.','Rerolls the perfection automatically until all the chosen conditions are met. Every roll is paid.'))),
          (()=>{const sel=h('select',{class:'achsearch rrtg','data-fid':'rrtarget','aria-label':this.tr(T('Perfezione da ottenere','Perfection to reach')),onchange:e=>{d.settings.rrTarget=+e.target.value;this.app.save.write();updNeed();}},
            [0,50,60,70,75,80,85,90,95,100].map(v=>h('option',{value:v,selected:v===tg},v?'≥ '+v+'%':this.tr(T('Perfezione: qualsiasi','Any perfection')))));sel.value=String(tg);return sel;})(),
          needEl,
          h('button',{class:'btn primary','data-fid':'rrauto',onclick:()=>{const n=this.rrNeed(b);if(n.bad||(b.p!=null?b.p:PF_NOM)>=n.need){this.sfx('uiErr');return;}close();this.rrPend=null;this.rrAuto(true);}},'⏩ '+this.tr(T('Avvia','Start')))),
        goalBtn,goalPanel)));
    this.root.append(ov);this.modalEl=ov;updNeed();const f=ov.querySelector('[data-fid="rrnew"]');if(f)f.focus({preventScroll:true});
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
      const bs=plan.base,A=trinStats(trinDef(bs.id),bs.r,hasPfE(trinDef(bs.id),bs.f)?(bs.p!=null?bs.p:PF_NOM):PF_NOM,bs.f),C=trinStats(trinDef(plan.id),plan.r,plan.p,plan.f),inf=this.tinfo(plan.id,plan.r,plan.p,plan.f);
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
          const k=P.fuse(sl);if(!k){this.sfx('uiErr');return;}
          this.sfx('transform');this.fuSel=[];this.bagSel=k;this.fuDone=k;this.rebuild(true);}},'⚗ '+this.tr(T('Fondi','Fuse'))));
    }else res=h('div',{class:'fcol fres'},h('div',{class:'fslotb res'},h('span',{class:'tplus'},'?'),h('small',null,this.tr(T('Inserisci 3 cimeli per vedere il risultato.','Put in 3 trinkets to see the result.')))),h('div',{class:'fstats'}));
    const done=this.fuDone&&P.bagGet(this.fuDone);this.fuDone=null;
    return h('div',{class:'gwork'},this.header(T('Fusione dei cimeli','Trinket fusion')),
      h('p',{class:'sub'},this.tr(T('Tre cimeli della sacca diventano uno: resta quello con la perfezione più alta, portato alla rarità più alta dei tre, e prende la statistica migliore di ciascuno degli altri due. Al massimo 2 statistiche in più: se fondi di nuovo un cimelio fuso, le vecchie vengono sostituite.',
        'Three trinkets from your bag become one: the one with the highest perfection stays, raised to the highest rarity of the three, and takes the best stat of each of the other two. 2 extra stats at most: fusing a fused trinket again replaces the old ones.'))),
      test?h('p',{class:'good'},this.tr(T('Modalità Test: si fondono solo i cimeli estratti in Test.','Test mode: only the trinkets pulled in Test can be fused.'))):null,
      done?h('div',{class:'fdone'},h('b',null,'⚗ '+this.tr(T('Fusione riuscita!','Fusion done!'))),this.tcard(done.id,done.r,{p:done.p,fu:done.f})):null,
      h('div',{class:'fwb'},slot(0),slot(1),slot(2),h('div',{class:'fwarr'},'═▶'),res),
      L.tools,h('div',{class:'bagsplit'},L.left,L.grid));
  }
});
