'use strict';
/* ====== v136: trinket windows: the choice of the trinkets that go home after a win (tpick), the Reroll and the Fusion of the Gacha shop ====== */
const TP_SORT={rar:'★',perf:'％',name:'Aa',new:'🆕'};
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
    return h('div',{class:'rarcol'},h('div',{class:'rarlbl'},this.t('gRarity')),[4,3,2,1,0].map(r=>{const b=h('button',{class:'rchip'+(st.rar[r]?' on':''),style:'--c:'+RARITY[r].c,'data-fid':'rc'+r,
      onclick:()=>{this.sfx('uiTab');st.rar[r]=st.rar[r]?0:1;b.classList.toggle('on',!!st.rar[r]);onChange();}},this.tr(RARITY[r].n));return b;}));
  },
  /* a filterable trinket grid. st: the filters (kept by the caller), items: [{k,id,r,p,f,at}], o.onclick(it), o.card(it) -> extra tcard options */
  tlist(st,items,o){
    const grid=h('div',{class:'baggrid'}),shown=h('span',{class:'achshown'});
    for(const it of items)it.i=this.tinfo(it.id,it.r,it.p,it.f);
    const pv=it=>it.i.perf==null?-1:it.i.perf;
    const sorts={rar:(x,y)=>y.r-x.r||pv(y)-pv(x)||x.i.name.localeCompare(y.i.name),perf:(x,y)=>pv(y)-pv(x)||y.r-x.r,name:(x,y)=>x.i.name.localeCompare(y.i.name)||y.r-x.r,new:(x,y)=>(y.at||0)-(x.at||0)};
    const fill=()=>{
      const q=RAR_NORM(st.q.trim()),list=items.filter(it=>st.rar[it.r]&&(!q||RAR_NORM(it.i.name+' '+it.i.desc+' '+it.i.rar).includes(q))).sort(sorts[st.sort]||sorts.rar);
      grid.replaceChildren(...(list.length?list.map(it=>this.tcard(it.id,it.r,Object.assign({p:it.p,fu:it.f,btn:true,fid:'t'+it.k,onclick:()=>{this.sfx();o.onclick(it);}},o.card?o.card(it):{}))):[h('p',{class:'sub'},this.t(items.length?'bagNone':'bagEmpty'))]));
      shown.textContent=this.t('bagShown',{a:list.length,b:items.length});
    };
    const chips=this.rarChips(st,fill);
    const search=h('input',{type:'text',class:'achsearch','data-fid':'tlq',placeholder:'🔍 '+this.t('bagSearch'),value:st.q,autocomplete:'off',spellcheck:'false',oninput:e=>{st.q=e.target.value;fill();}});
    const sb=Object.keys(TP_SORT).filter(k=>k!=='new'||o.byNew!==false).map(k=>{const lab=this.t('bagSort_'+k);
      return h('button',{class:'bsortb'+(st.sort===k?' on':''),'data-sort':k,'data-fid':'ts_'+k,'data-tip':this.t('bagSortBy')+': '+lab,'aria-label':lab,
        onclick:()=>{this.sfx('uiTab');st.sort=k;for(const b of sb)b.classList.toggle('on',b.dataset.sort===k);fill();}},TP_SORT[k]);});
    fill();
    /* the same layout as the trinket bag: search on top; sort buttons and rarities in the left column; the grid; the caller's side panel on the right */
    return{tools:h('div',{class:'achtools tltools'},search,shown),left:h('div',{class:'bsorts'},h('div',{class:'bsorti'},sb),chips),grid,fill};
  },
  /* what a fused trinket took from the others: "Fused with: Broken Scouter (crit chance), ..." */
  fuText(fu){const L=this.app.i18n.lang==='it'?0:1;return this.tr(T('Fuso con: ','Fused with: '))+fu.map(e=>this.tr(trinDef(e.id).n)+' ('+(TLAB[e.k]||[e.k,e.k])[L]+')').join(', ');},
  /* big card of a trinket for the side panels */
  tdet(id,r,p,f,extra){
    const i=this.tinfo(id,r,p,f),el=h('div',{class:'bagdet tdet'});el.style.setProperty('--c',i.c);
    el.append(...[h('div',{class:'bdhead'},glyph(i.t.k,i.c),h('div',null,h('div',{class:'cn',style:'color:'+i.c},potara(),i.name),h('div',{class:'ctag'},i.rar+(i.fu?' · ⚗':'')))),this.perfBar(i.perf),
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
    const L=this.tlist(st,items,{onclick:it=>{if(this.rrPend)return this.sfx('uiErr');this.rrSel=it.k;this.rebuild(true);},card:it=>({sel:it.k===this.rrSel,eq:(d.equips||[]).some(e=>e&&trinketKey(e.id,e.r)===it.k)})});
    const b=this.rrSel&&P.bagGet(this.rrSel),side=h('div',{class:'bagside'});
    if(this.rrPend&&!this.rrOpen)this.rrPend=null;   /* a roll left without a choice keeps the old trinket */
    if(b){
      const can=P.canWork(b),roll=kind=>this.rrRoll(kind);
      const btn=(kind,ico,lab,tip)=>{const c=P.rerollCost(kind,b.r),ok=can&&d.zenny>=c&&(kind!=='pf'||hasPfE(trinDef(b.id),b.f));
        return h('button',{class:'btn'+(ok?' primary':' alt'),disabled:!ok,'data-fid':'rr'+kind,title:this.tr(tip),onclick:()=>roll(kind)},ico+' '+this.tr(lab)+' · ',c?zAmt(c,true):this.tr(T('gratis','free')));};
      side.append(this.tdet(b.id,b.r,b.p,b.f,[
        btn('pf','🎲',T('Rerolla la perfezione','Reroll perfection'),T('Un nuovo tiro di perfezione: poi scegli se tenere il nuovo o il vecchio.','A new perfection roll: then you choose whether to keep the new or the old one.')),
        btn('id','🔄',T('Rerolla il cimelio','Reroll the trinket'),T('Un altro cimelio della stessa rarità, con la stessa perfezione (e le stesse fusioni): poi scegli se tenerlo.','Another trinket of the same rarity, with the same perfection (and fusions): then you choose whether to keep it.')),
        test&&!can?h('p',{class:'bad'},this.tr(T('In modalità Test si possono rerollare solo i cimeli estratti in Test.','In Test mode only the trinkets pulled in Test can be rerolled.'))):null]));
    }else side.append(h('p',{class:'sub'},this.t('bagEmpty')));
    return h('div',{class:'gwork'},this.header(T('Reroll dei cimeli','Trinket reroll')),
      h('p',{class:'sub'},this.tr(T('Scegli un cimelio della sacca e rerolla la sua perfezione o il cimelio stesso (stessa rarità). Paghi il tiro, poi decidi tu se tenere il nuovo o il vecchio.','Pick a trinket from your bag and reroll its perfection or the trinket itself (same rarity). You pay for the roll, then you decide whether to keep the new or the old one.'))),
      L.tools,h('div',{class:'bagsplit'},L.left,L.grid,side));
  },

  /* v136b: a reroll opens its own window: before and after, every stat with a green ▲ (better) or red ▼ (worse), and the choice */
  rrRoll(kind){
    const P=this.app.progress,o=P.rerollRoll(kind,this.rrSel);if(!o){this.sfx('uiErr');return;}
    this.sfx('gStop'+Math.min(3,o.r));this.rrPend=o;this.rrKind=kind;this.rrOpen=true;this.rebuild(true);this.rrModal();
  },
  rrModal(){
    const P=this.app.progress,d=this.save,b=P.bagGet(this.rrSel),o=this.rrPend;if(!b||!o){this.rrOpen=false;return;}
    const prev=this.modalEl,L=this.app.i18n.lang==='it'?0:1;
    const close=()=>{ov.remove();if(this.modalEl===ov)this.modalEl=prev;this.rrOpen=false;};
    const done=nw=>{close();this.sfx(nw?'buy':'uiBack');
      if(nw){const k=P.rerollApply(this.rrSel,o);if(k)this.rrSel=k;this.toast({type:'info',msg:this.tr(T('Tenuto il nuovo cimelio','Kept the new trinket'))});}
      this.rrPend=null;this.rebuild(true);};
    const tA=trinDef(b.id),tB=trinDef(o.id),pA=hasPfE(tA,b.f)?(b.p!=null?b.p:PF_NOM):null,pB=hasPfE(tB,o.f)?(o.p!=null?o.p:PF_NOM):null;
    const sA=trinStats(tA,b.r,pA!=null?pA:PF_NOM,b.f),sB=trinStats(tB,o.r,pB!=null?pB:PF_NOM,o.f);
    let up=0,dn=0;
    const row=(lab,a,c,va,vb)=>{const dir=vb>va?'up':vb<va?'down':'eq';if(dir==='up')up++;if(dir==='down')dn++;
      return h('div',{class:'rrrow '+dir},h('span',{class:'rrk'},lab),h('span',{class:'rra'},a||'—'),h('b',{class:'rrar'},dir==='up'?'▲':dir==='down'?'▼':'='),h('span',{class:'rrb'},c||'—'));};
    const rows=[],rv=(k,v)=>k==='armor'||k==='regen'?Math.round(v*10):k==='proj'?v:Math.round(v*100);   /* compared as shown (a stat that rounds to the same number is unchanged) */
    if(pA!=null||pB!=null)rows.push(row(this.tr(T('Perfezione','Perfection')),pA!=null?pA+'%':null,pB!=null?pB+'%':null,pA||0,pB||0));
    for(const k of [...new Set([...sA.map(x=>x.k),...sB.map(x=>x.k)])]){const a=sA.find(x=>x.k===k),c=sB.find(x=>x.k===k);
      rows.push(row((TLAB[k]||[k,k])[L],a?this.tr(a.t):null,c?this.tr(c.t):null,a?rv(k,a.v):0,c?rv(k,c.v):0));}
    const fxA=tA.x||(tA.sp?tA.d:null),fxB=tB.x||(tB.sp?tB.d:null);
    if(o.id!==b.id&&(fxA||fxB))rows.push(h('div',{class:'rrrow fx'},h('span',{class:'rrk'},this.tr(T('Effetto','Effect'))),h('span',{class:'rra'},fxA?this.tr(fxA):'—'),h('b',{class:'rrar'},'⇄'),h('span',{class:'rrb'},fxB?this.tr(fxB):'—')));
    const verdict=up&&!dn?['up',T('Migliore','Better')]:dn&&!up?['down',T('Peggiore','Worse')]:up||dn?['mix',T('In parte migliore, in parte peggiore','Partly better, partly worse')]:['eq',T('Uguale','The same')];
    const kind=this.rrKind,c=P.rerollCost(kind,b.r),canAgain=P.canWork(b)&&d.zenny>=c;
    const ov=h('div',{class:'uask rrm'},h('div',{class:'uaskp rrmp'},
      h('h3',null,(kind==='pf'?'🎲 ':'🔄 ')+this.tr(kind==='pf'?T('Reroll della perfezione','Perfection reroll'):T('Reroll del cimelio','Trinket reroll'))),
      h('div',{class:'rrcards'},h('div',null,h('div',{class:'rrlab'},this.tr(T('Prima','Before'))),this.tcard(b.id,b.r,{p:b.p,fu:b.f})),h('div',{class:'rrarrow'},'→'),
        h('div',{class:'rrnew '+verdict[0]},h('div',{class:'rrlab'},this.tr(T('Nuovo','New'))),this.tcard(o.id,o.r,{p:o.p,fu:o.f}))),
      h('div',{class:'rrverdict '+verdict[0]},this.tr(verdict[1])),
      h('div',{class:'rrtable'},rows),
      h('div',{class:'row'},
        h('button',{class:'btn primary','data-fid':'rrnew',onclick:()=>done(true)},'✓ '+this.tr(T('Tieni il nuovo','Keep the new one'))),
        h('button',{class:'btn'+(canAgain?'':' alt'),disabled:!canAgain,'data-fid':'rragain',title:this.tr(T('Scarta questo tiro (tieni il vecchio) e rerolla di nuovo','Discard this roll (keep the old one) and reroll again')),
          onclick:()=>{close();this.rrPend=null;this.rrRoll(kind);}},'🎲 '+this.tr(T('Riprova','Again'))+' · ',c?zAmt(c,true):this.tr(T('gratis','free'))),
        h('button',{class:'btn alt','data-back':true,'data-fid':'rrold',onclick:()=>done(false)},this.tr(T('Tieni il vecchio','Keep the old one'))))));
    this.root.append(ov);this.modalEl=ov;const f=ov.querySelector('[data-fid="rrnew"]');if(f)f.focus({preventScroll:true});
  },

  /* ---------- Gacha shop > Fusion ---------- */
  screen_fuse(){
    const P=this.app.progress,d=this.save,st=this.fuF||(this.fuF={q:'',rar:[1,1,1,1,1],sort:'rar'}),test=!!d.settings.sandbox;
    const sl=this.fuSel=(this.fuSel||[]).filter(k=>P.bagGet(k));
    const items=d.bag.map(b=>({k:trinketKey(b.id,b.r),id:b.id,r:b.r,p:b.p,f:b.f,at:b.at,b})).filter(it=>P.canWork(it.b));
    const toggle=k=>{const i=sl.indexOf(k);if(i>=0)sl.splice(i,1);else if(sl.length<3)sl.push(k);else{this.sfx('uiErr');return;}this.rebuild(true);};
    const L=this.tlist(st,items,{onclick:it=>toggle(it.k),card:it=>({check:sl.includes(it.k),eq:(d.equips||[]).some(e=>e&&trinketKey(e.id,e.r)===it.k)})});
    const slot=i=>{const k=sl[i],b=k&&P.bagGet(k);
      return b?h('div',{class:'fslot on'},this.tcard(b.id,b.r,{p:b.p,fu:b.f,btn:true,fid:'fs'+i,onclick:()=>{this.sfx('uiBack');toggle(k);}}),h('span',{class:'fsx'},'✕'))
        :h('div',{class:'fslot'},h('span',{class:'tplus'},'+'),h('small',null,this.tr(T('Scegli dalla sacca','Pick from the bag'))));};
    const plan=sl.length===3?P.fusePlan(sl):null;
    const res=plan&&plan.block?h('div',{class:'bagdet tdet fempty'},h('p',{class:'bad'},this.tr(T('Hai già questo cimelio a questa rarità nella sacca: il risultato lo duplicherebbe. Cambia uno dei tre.','You already have this trinket at this rarity in your bag: the result would duplicate it. Change one of the three.'))))
      :plan?this.tdet(plan.id,plan.r,plan.p,plan.f,[h('button',{class:'btn primary','data-fid':'fusego',onclick:async()=>{
        const body=h('div',null,h('div',{class:'tpconf'},sl.map(k=>{const b=P.bagGet(k);return this.tcard(b.id,b.r,{p:b.p,fu:b.f});})),
          h('p',{class:'cd'},this.tr(T('Questi tre cimeli verranno consumati e diventeranno uno solo.','These three trinkets will be used up and become a single one.'))));
        if(!await this.ask({title:this.tr(T('Fondere questi cimeli?','Fuse these trinkets?')),body,yes:'⚗ '+this.tr(T('Fondi','Fuse')),no:this.tr(T('Annulla','Cancel'))}))return;
        const k=P.fuse(sl);if(!k){this.sfx('uiErr');return;}
        this.sfx('transform');this.fuSel=[];this.bagSel=k;this.fuDone=k;this.rebuild(true);}},'⚗ '+this.tr(T('Fondi','Fuse')))])
      :h('div',{class:'bagdet tdet fempty'},h('p',{class:'sub'},this.tr(T('Inserisci 3 cimeli per vedere il risultato.','Put in 3 trinkets to see the result.'))));
    const done=this.fuDone&&P.bagGet(this.fuDone);this.fuDone=null;
    return h('div',{class:'gwork'},this.header(T('Fusione dei cimeli','Trinket fusion')),
      h('p',{class:'sub'},this.tr(T('Tre cimeli della sacca diventano uno: resta quello con la perfezione più alta, portato alla rarità più alta dei tre, e prende la statistica migliore di ciascuno degli altri due. Al massimo 2 statistiche in più: se fondi di nuovo un cimelio fuso, le vecchie vengono sostituite.',
        'Three trinkets from your bag become one: the one with the highest perfection stays, raised to the highest rarity of the three, and takes the best stat of each of the other two. 2 extra stats at most: fusing a fused trinket again replaces the old ones.'))),
      test?h('p',{class:'good'},this.tr(T('Modalità Test: si fondono solo i cimeli estratti in Test.','Test mode: only the trinkets pulled in Test can be fused.'))):null,
      done?h('div',{class:'fdone'},h('b',null,'⚗ '+this.tr(T('Fusione riuscita!','Fusion done!'))),this.tcard(done.id,done.r,{p:done.p,fu:done.f})):null,
      L.tools,
      h('div',{class:'bagsplit'},L.left,L.grid,h('div',{class:'bagside fbench'},h('div',{class:'rarlbl'},this.tr(T('Cimeli da fondere','Trinkets to fuse'))+' · '+sl.length+' / 3'),
        h('div',{class:'fslots'},[0,1,2].map(slot)),h('div',{class:'rrarrow fdown'},'↓'),res)));
  }
});
