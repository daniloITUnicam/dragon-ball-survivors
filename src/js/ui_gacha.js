'use strict';
/* ====== UI: Gacha shop and summon animation, trinket bag, trinket slot, Super Shenron ====== */
let _gballCss=false;
/* a Dragon Ball with n stars, cut from the sprite sheet of the game (the sheet is added to the page once, as a CSS rule) */
function gball(n,z,cls){
  if(!_gballCss){_gballCss=true;if(DBALLS_URL){const s=document.createElement('style');s.textContent='.gball:not(.nosheet){background-image:url("'+DBALLS_URL+'")}';document.head.append(s);}}
  n=clamp(Math.round(n)||1,1,7);
  return h('i',{class:'gball'+(DBALLS_URL?'':' nosheet')+(cls?' '+cls:''),style:'--z:'+z+'px;--n:'+n,'aria-hidden':'true'},DBALLS_URL?null:'★'.repeat(Math.min(n,3)));
}
const RAR_NORM=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');

Object.assign(UI.prototype,{
  /* ---------- helpers ---------- */
  tdef(id){return TRINKETS.find(x=>x.id===id);},
  /* name, rarity and effect text of a trinket at a rarity, in the language of the player */
  tinfo(id,r,p){const t=this.tdef(id),pf=hasPf(t)?(p!=null?p:PF_NOM):null;return{t,c:RARITY[r].c,name:this.tr(t.n),rar:this.tr(RARITY[r].n),desc:this.tr(trinDesc(t,r,pf)),stats:trinStats(t,r,pf),perf:pf};},
  /* perfection of a trinket: a bar (0-100%) and, at 100%, the Ultra Instinct shimmer */
  perfBar(p,compact){if(p==null)return null;return h('div',{class:'perf'+(p>=100?' ui':'')+(compact?' sm':''),style:'--p:'+p+'%;--pc:'+perfColor(p),title:this.t('perfLabel')+' '+p+'%'+(p>=100?' · '+this.t('perfUI'):'')},h('span',{class:'pbar'},h('i')),compact?null:h('b',null,this.t('perfLabel')+' '+p+'%'+(p>=100?' ✦':'')));},
  fmtDate(ts){try{return new Date(ts).toLocaleString(this.app.i18n.lang,{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}catch(e){return new Date(ts).toISOString().slice(0,16).replace('T',' ');}},
  /* a trinket as a small card (bag) */
  tcard(id,r,o){
    o=o||{};const i=this.tinfo(id,r,o.p);
    return h(o.btn?'button':'div',{class:'tcard r'+r+(o.sel?' sel':'')+(o.eq?' eq':'')+(i.perf!=null&&i.perf>=100?' perfect':''),style:'--c:'+i.c,'data-fid':o.fid,onclick:o.onclick,title:i.name+' · '+i.rar+(i.perf!=null?' · '+i.perf+'%':'')+'\n'+i.desc},
      glyph(i.t.k,i.c),h('div',{class:'col'},h('div',{class:'cn',style:'color:'+i.c},i.name),h('div',{class:'ctag'},i.rar+(i.perf!=null?' · '+i.perf+'%':'')),h('div',{class:'cd'},i.desc),this.perfBar(i.perf,true)));
  },
  /* ---------- trinket slot in the character screen ---------- */
  trinketSlot(){
    const d=this.save,eq=d.equip,t=eq&&this.tdef(eq.id);
    if(eq&&!t)d.equip=null;
    const be=t&&d.bag.find(b=>b.id===eq.id&&b.r===eq.r),i=t?this.tinfo(eq.id,eq.r,be&&be.p):null;
    const slot=h('button',{class:'tslot'+(t?' on r'+eq.r+(i.perf!=null&&i.perf>=100?' perfect':''):''),style:t?'--c:'+i.c:'','data-fid':'tslot',title:t?i.name+' · '+i.rar+'\n'+i.desc:this.t('slotEmpty'),
      onclick:()=>{this.sfx();this.push('bag',{pick:true});}},
      t?[glyph(t.k,i.c),h('span',{class:'tsn'},i.name),this.perfBar(i.perf,true)]:h('span',{class:'tplus'},'+'));
    return h('div',{class:'tslotwrap'},h('span',{class:'lbl'},this.t('trinketSlot')),slot,
      t?h('button',{class:'btn tiny alt unq','data-fid':'tunq',onclick:()=>{this.sfx('uiBack');this.app.progress.equipTrinket(null);this.rebuild(true);}},'✕ '+this.t('bagUnequip')):null);
  },
  /* ---------- Gacha shop ---------- */
  screen_gacha(){
    const d=this.save,tk=d.tickets,test=this.testAll();
    const kinds=[['t1','1×'],['t10','10×'],['l10','10×']];
    const cards=kinds.map(([k,lab])=>{
      const n=tk[k],K=GACHA.kinds[k],mx=this.app.progress.gachaMaxTimes(k);
      /* 1, 10 or 100 pulls at most: the buttons light up as the tickets allow (no "all" button: a big pull is capped at 100) */
      const presets=(k==='t1'?[1,10,100]:[1,10]).filter(t=>t<=mx);
      const btn=t=>{const can=test||n>=t;
        return h('button',{class:'btn small'+(can?' primary':' alt'),disabled:!can,'data-fid':'pull'+k+'x'+t,title:this.t('gUses',{n:t}),onclick:()=>{this.sfx('uiStart');this.gachaPull(k,t);}},this.t('gPullN',{n:t*K.n}),h('small',{class:'gtu'},this.t('gUses',{n:t})));};
      return h('div',{class:'tkcard '+k},
        h('div',{class:'tkimg'},lab,h('small',null,k==='l10'?'LUCKY':'TICKET')),
        h('div',{class:'cn'},this.t(k==='t1'?'tkT1':k==='t10'?'tkT10':'tkL10')),
        h('div',{class:'cd'},this.t(k==='t1'?'tkT1D':k==='t10'?'tkT10D':'tkL10D')),
        h('div',{class:'tkcount'},test?'∞':'× '+n),
        h('div',{class:'gpb'},presets.map(btn)),
        TICKET_PRICE[k]?(()=>{
          const pr=ticketPrice(k),wk=k==='t10'&&isWeekend(),can=!test&&d.zenny>=pr;
          return h('button',{class:'btn small tkbuy'+(can?'':' alt'),disabled:!can,'data-fid':'buy'+k,
            title:this.tr(k==='t10'?T('Ticket 10×: 10 estrazioni, '+fmtN(TICKET_PRICE.t10)+' zenny. Sabato e domenica costa il 20% in meno ('+fmtN(ticketPrice('t10',new Date(2026,0,3)))+').'+(wk?' Oggi lo sconto è attivo!':''),'10× ticket: 10 pulls, '+fmtN(TICKET_PRICE.t10)+' zenny. On Saturday and Sunday it costs 20% less ('+fmtN(ticketPrice('t10',new Date(2026,0,3)))+').'+(wk?' The discount is active today!':'')):T('Ticket 1×: 1 estrazione, '+fmtN(TICKET_PRICE.t1)+' zenny.','1× ticket: 1 pull, '+fmtN(TICKET_PRICE.t1)+' zenny.')),
            onclick:()=>{if(this.app.progress.buyTicket(k,1)){this.sfx('buy');this.rebuild(true);}else this.sfx('uiErr');}},
            this.tr(T('Compra','Buy'))+' · ',zAmt(pr,true),wk?h('small',{class:'tkoff'},' −20%'):null);})():null);
    });
    const total=[0,1,2,3,4].reduce((s,r)=>s+gachaPool(r).length,0);
    const rates=h('details',{class:'grates'},h('summary',null,this.t('gRates')),
      h('table',null,h('tr',null,h('th',null,this.t('gRarity')),h('th',null,this.t('gNormal')),h('th',null,this.t('gLucky')),h('th',null,this.t('gPool'))),
        [0,1,2,3,4].map(r=>h('tr',null,h('td',{style:'color:'+RARITY[r].c},this.tr(RARITY[r].n)),h('td',null,GACHA.rates.n[r]+'%'),h('td',null,GACHA.rates.l[r]+'%'),h('td',null,String(gachaPool(r).length))))),
      h('p',{class:'gnote'},this.t('gRatesNote')));
    const orb=h('div',{class:'orbit'});
    [1,2,3,4,5,6,7].forEach((n,i)=>{const b=gball(n,44);b.style.cssText+=';--dx:'+((i-3)*46)+'px;--dy:'+(-Math.abs(i-3)*3)+'px;--dl:'+(-i*.35)+'s';orb.append(b);});
    return h('div',{class:'gsrc'},this.header('gachaTitle',null,[h('button',{class:'btn small alt','data-fid':'gbag',onclick:()=>{this.sfx();this.push('bag',{});}},'🎒 '+this.t('bagBtn')+' ('+d.bag.length+')')]),
      h('div',{class:'gtop'},orb,h('p',{class:'sub'},this.t('gachaSub')),h('div',{class:'gnote'},this.t('gColl',{a:d.bag.length,b:total}))),
      test?h('p',{class:'good'},this.t('gTest')):null,
      h('div',{class:'gtk'},cards),
      !test&&this.app.progress.ticketCount()===0?h('p',{class:'gnote'},this.t('gNoTk')):null,
      rates);
  },
  gachaPull(kind,times){
    times=times||1;
    const res=this.app.progress.gachaPull(kind,times);
    if(!res){this.sfx('uiErr');return;}
    this.gachaReveal(res,kind,times);
  },
  closeReveal(){
    const o=this.gov;if(!o)return;
    if(o.__stop)o.__stop();o.remove();this.gov=null;if(this.modalEl===o)this.modalEl=null;
  },
  /* the summon: dragon-ball slot reels stop one after another (more stars = rarer, more light and sound), a big banner for Legendary and Mythic, then the trinkets pop in one by one */
  gachaReveal(res,kind,times){
    this.closeReveal();
    times=times||1;
    const n=res.length,best=res.reduce((m,x)=>Math.max(m,x.r),0),A=this.app.audio,bulk=n>10;   /* bulk (up to 100 pulls): one quick reel for the best result, then a compact list of everything */
    const ov=h('div',{class:'gov '+(bulk?'bulk n1':'n'+(n>1?10:1))});this.gov=ov;this.modalEl=ov;
    let skip=false,gone=false,tick=0;const pend=new Set();
    const snd=s=>{if(!skip&&!gone)A.sfx(s);};
    const later=(ms,fn)=>{if(skip||gone){fn();return;}const o={fn};o.id=setTimeout(()=>{pend.delete(o);fn();},ms);pend.add(o);};
    const wait=ms=>new Promise(r=>later(ms,r));
    const doSkip=()=>{if(skip)return;skip=true;ov.classList.add('fast');clearInterval(tick);const l=[...pend];pend.clear();for(const o of l){clearTimeout(o.id);o.fn();}};
    ov.__stop=()=>{gone=true;clearInterval(tick);for(const o of pend)clearTimeout(o.id);pend.clear();};
    const title=h('div',{class:'gtitle'},this.t('gSpinning'));
    const reels=h('div',{class:'greels'}),els=[];
    const skipBtn=h('button',{class:'btn small alt gskip','data-fid':'gskip',onclick:doSkip},this.t('gSkip'));
    ov.append(title,reels,skipBtn);
    ov.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;doSkip();});
    this.root.append(ov);skipBtn.focus({preventScroll:true});
    const sparks=(el,c,cnt,dist)=>{if(FXL&&FXL.on)cnt=Math.ceil(cnt/2);for(let i=0;i<cnt;i++){const a=Math.random()*TAU,d=dist*(.5+Math.random()*.7),s=h('i',{class:'gspark',style:'--c:'+c+';--x:'+Math.cos(a)*d+'px;--y:'+Math.sin(a)*d+'px'});el.append(s);setTimeout(()=>s.remove(),950);}};
    /* the reels: a strip of random balls that ends on the ball of the rarity found */
    const K=14,dur=bulk?()=>1.5:n>1?i=>1.3+i*.23:()=>2.3;
    (bulk?[res.reduce((m,x)=>x.r>m.r?x:m,res[0])]:res).forEach((x,i)=>{
      const strip=h('div',{class:'gstrip'}),w=h('div',{class:'greel'},strip);
      els.push({w,strip,x});reels.append(w);
    });
    const Z=parseFloat(getComputedStyle(ov).getPropertyValue('--z'))||128;
    for(const e of els){
      for(let k=0;k<K;k++)e.strip.append(gball(1+Math.floor(Math.random()*7),Z));
      e.strip.append(gball(GACHA.stars[e.x.r],Z));
    }
    const run=async()=>{
      void reels.offsetHeight;
      els.forEach((e,i)=>{
        e.strip.style.transition='transform '+dur(i)+'s cubic-bezier(.16,.72,.14,1)';e.strip.style.transform='translateY('+(-K*Z)+'px)';
        later(dur(i)*1000,()=>{e.strip.style.transition='none';e.strip.style.transform='translateY('+(-K*Z)+'px)';e.w.classList.add('stop','r'+e.x.r);snd('gStop'+Math.min(3,e.x.r));sparks(e.w,RARITY[e.x.r].c,5+e.x.r*5,34+e.x.r*14);});
      });
      tick=setInterval(()=>snd('gTick'),n>1?70:55);
      const last=Math.max(...els.map((_,i)=>dur(i)));
      await wait(last*1000+450);clearInterval(tick);
      if(best>=3&&!skip){await this.gachaBanner(ov,best,res,snd,wait,A);}
      /* the cards */
      title.textContent=bulk?this.t('gDoneN',{n}):this.t(n>1?'gDone10':'gDone1');
      const cards=h('div',{class:bulk?'gtiles':'gcards'});reels.replaceWith(cards);
      let bestSnd=-1;
      if(bulk){
        /* the same trinket at the same rarity is shown once with its count; the best come first, new ones before duplicates */
        const grp=new Map();for(const x of res){const k=trinketKey(x.id,x.r),e=grp.get(k)||{x,c:0,nw:false,coins:0,p:-1,up:false};e.c++;e.coins+=x.coins||0;if(!x.dup)e.nw=true;if(x.p>e.p)e.p=x.p;if(x.up!=null)e.up=true;grp.set(k,e);}
        [...grp.values()].sort((p,q)=>q.x.r-p.x.r||(q.nw-p.nw)||q.c-p.c).forEach((e,ix)=>{
          const i=this.tinfo(e.x.id,e.x.r,e.p);bestSnd=Math.max(bestSnd,e.x.r);
          cards.append(h('div',{class:'gtile r'+e.x.r,style:'--c:'+i.c+';--d:'+Math.min(ix,40)*.02+'s',title:i.name+' · '+i.rar+'\n'+i.desc},glyph(i.t.k,i.c),
            h('div',{class:'gtn'},h('b',{style:'color:'+i.c},i.name),h('small',null,i.rar+(i.perf!=null?' · '+i.perf+'%':'')+(e.up?' ↑':''))),
            h('span',{class:'gtc'},'×'+e.c),e.nw?h('span',{class:'gnew'},this.t('gNew')):h('span',{class:'gdup'},this.t('gDup'))));
        });
        if(!skip)snd('gPop'+best);
      }
      else for(const x of res){
        const i=this.tinfo(x.id,x.r,x.p),el=h('div',{class:'gcard r'+x.r+(i.perf!=null&&i.perf>=100?' perfect':''),style:'--c:'+i.c},glyph(i.t.k,i.c),h('div',{class:'cn',style:'color:'+i.c},i.name),h('div',{class:'ctag'},i.rar),this.perfBar(i.perf),h('div',{class:'cd'},i.desc),x.up!=null?h('span',{class:'gup'},this.t('gPerfUp',{a:x.up,b:x.p})):null,
          x.dup?h('span',{class:'gdup'},this.t('gDup'),x.coins?[' · +',zAmt(x.coins,true)]:null):h('span',{class:'gnew'},this.t('gNew')));
        cards.append(el);bestSnd=Math.max(bestSnd,x.r);
        if(!skip){snd('gPop'+x.r);sparks(el,i.c,2+x.r*3,40);}
        await wait(n>1?250:0);
      }
      if(skip&&!gone)A.sfx('gPop'+bestSnd);
      skipBtn.remove();
      const nNew=res.filter(x=>!x.dup).length,nDup=n-nNew,coins=res.reduce((s,x)=>s+(x.coins||0),0),test=this.testAll();
      const left=this.save.tickets[kind],again=test?times:Math.min(times,left,this.app.progress.gachaMaxTimes(kind)),can=test||left>0;
      const foot=h('div',{class:'row'},
        can?h('button',{class:'btn primary','data-fid':'again',onclick:()=>{this.sfx('uiStart');this.gachaPull(kind,again);}},this.t('gAgain')+(again>1?' ×'+again:'')+(test?'':' ('+left+')')):null,
        h('button',{class:'btn alt','data-fid':'gbag2',onclick:()=>{this.sfx();this.closeReveal();this.push('bag',{});}},'🎒 '+this.t('bagBtn')),
        h('button',{class:'btn alt','data-back':true,'data-fid':'gclose',onclick:()=>{this.sfx('uiBack');this.closeReveal();this.rebuild(true);}},this.t('gClose')));
      /* setting "auto-open": the next 1x / 10x ticket opens by itself, one at a time, until the player closes the window or presses Stop */
      const nk=(!test&&this.save.settings.tkAuto&&!bulk)?['t1','t10'].sort((a,b)=>(b===kind)-(a===kind)).find(k=>this.save.tickets[k]>0):null;
      if(nk){
        const at=setTimeout(()=>{if(!gone&&this.gov===ov)this.gachaPull(nk,1);},2400);
        const st0=ov.__stop;ov.__stop=()=>{clearTimeout(at);st0();};
        const stop=h('button',{class:'btn small bad','data-fid':'gstop',onclick:()=>{clearTimeout(at);stop.remove();this.sfx('uiBack');}},'⏹ '+this.tr(T('Ferma apertura automatica','Stop auto-open')));
        foot.prepend(stop);
      }
      ov.append(h('div',{class:'gsum'},h('span',{class:'good'},this.t('gSummary',{n:nNew,d:nDup})),coins?h('span',null,'+',zAmt(coins,true)):null),foot);
      const f=(can?foot.querySelector('[data-fid="again"]'):null)||foot.querySelector('[data-fid="gclose"]');if(f)f.focus({preventScroll:true});
    };
    run();
  },
  /* the big lettering: Mythic = flash, rays, shaking screen and the jackpot sound; Legendary = a shorter golden one */
  async gachaBanner(ov,rar,res,snd,wait,A){
    const myth=rar>=4,it=res.find(x=>x.r===rar),nm=it?this.tr(TRINKETS.find(q=>q.id===it.id).n):'';
    const el=h('div',{class:'gjack'+(myth?'':' leg')},h('div',{class:'grays'}),myth?h('div',{class:'gflash'}):null,
      h('div',{class:'gbanner'},this.t(myth?'gMythic':'gLegend')),h('div',{class:'gsub'},myth?this.t('gJackpot'):nm));
    for(let i=0;i<14;i++){const s=h('i',{class:'gstar',style:'--x:'+Math.round(Math.random()*92+2)+'%;--y:'+Math.round(Math.random()*90+2)+'%;--s:'+Math.round(14+Math.random()*34)+'px;--d:'+(Math.random()*1.2).toFixed(2)+'s;--c:'+(myth?'#ff7ac8':'#ffb020')},'✦');el.append(s);}
    ov.append(el);
    if(myth){snd('gMythic');ov.classList.add('shake');setTimeout(()=>ov.classList.remove('shake'),520);}
    await wait(myth?3200:1700);
    el.style.transition='opacity .4s';el.style.opacity='0';await wait(400);el.remove();
  },
  /* ---------- trinket bag ---------- */
  screen_bag(a){
    a=a||{};const d=this.save,pick=!!a.pick,st=this.bagF||(this.bagF={q:'',rar:[1,1,1,1,1],sort:'new'});
    const all=d.bag.map(b=>({b,i:this.tinfo(b.id,b.r,b.p)}));
    const eqk=d.equip?trinketKey(d.equip.id,d.equip.r):'';
    if(!this.bagSel||!d.bag.some(b=>trinketKey(b.id,b.r)===this.bagSel))this.bagSel=eqk&&d.bag.some(b=>trinketKey(b.id,b.r)===eqk)?eqk:(d.bag[0]?trinketKey(d.bag[0].id,d.bag[0].r):'');
    const grid=h('div',{class:'baggrid'}),det=h('div',{class:'bagdet'}),shown=h('span',{class:'achshown'});
    const sorts={new:(x,y)=>y.b.at-x.b.at,old:(x,y)=>x.b.at-y.b.at,rar:(x,y)=>y.b.r-x.b.r||(y.i.perf||0)-(x.i.perf||0)||x.i.name.localeCompare(y.i.name),perf:(x,y)=>(y.i.perf==null?-1:y.i.perf)-(x.i.perf==null?-1:x.i.perf)||y.b.r-x.b.r||x.i.name.localeCompare(y.i.name),name:(x,y)=>x.i.name.localeCompare(y.i.name)||y.b.r-x.b.r};
    const fill=()=>{
      const q=RAR_NORM(st.q.trim());
      const list=all.filter(o=>st.rar[o.b.r]&&(!q||RAR_NORM(o.i.name+' '+o.i.desc+' '+o.i.rar).includes(q))).sort(sorts[st.sort]||sorts.new);
      grid.replaceChildren(...(list.length?list.map(o=>{const k=trinketKey(o.b.id,o.b.r);return this.tcard(o.b.id,o.b.r,{p:o.b.p,btn:true,sel:k===this.bagSel,eq:k===eqk,fid:'t'+k,onclick:()=>{this.sfx();this.bagSel=k;this.rebuild(true);}});}):[h('p',{class:'sub'},this.t(all.length?'bagNone':'bagEmpty'))]));
      shown.textContent=this.t('bagShown',{a:list.length,b:all.length});
    };
    const sel=d.bag.find(b=>trinketKey(b.id,b.r)===this.bagSel);
    if(sel){
      const i=this.tinfo(sel.id,sel.r,sel.p),isEq=this.bagSel===eqk;
      det.style.setProperty('--c',i.c);
      det.append(...[glyph(i.t.k,i.c),h('div',{class:'cn',style:'color:'+i.c},i.name),h('div',{class:'ctag'},i.rar),this.perfBar(i.perf),
        h('div',{class:'stl'},i.stats.length?i.stats.map(s=>h('span',{style:'color:#9affb0'},this.tr(s.t))):null),
        i.t.sp||i.t.x?h('p',null,this.tr(i.t.sp&&!i.t.m?i.t.d:(i.t.x||i.t.d))):null,
        h('p',{class:'cd'},this.t('bagGot',{d:this.fmtDate(sel.at)})),
        h('p',{class:'cd'},this.t('bagMarket')+': ',zAmt(ZENO_PRICE[sel.r],true)),
        sel.t?h('p',{class:'cd'},'🧪 Test'):null,
        isEq?h('button',{class:'btn alt','data-fid':'bunq',onclick:()=>{this.sfx('uiBack');this.app.progress.equipTrinket(null);this.rebuild(true);}},this.t('bagUnequip')):
          h('button',{class:'btn primary','data-fid':'beq',onclick:()=>{this.sfx('uiStart');this.app.progress.equipTrinket(sel.id,sel.r);this.toast({type:'info',msg:this.t('bagEquipped',{n:i.name})});if(pick)this.pop();else this.rebuild(true);}},this.t('bagEquip'))].filter(Boolean));
    }else det.append(h('p',{class:'sub'},this.t('bagEmpty')),h('button',{class:'btn','data-fid':'bgo',onclick:()=>{this.sfx();this.pop();if(!this.stack.some(s=>s.name==='gacha'))this.push('gacha');}},this.t('bagToGacha')));
    const chips=h('div',{class:'rchips'},[0,1,2,3,4].map(r=>h('button',{class:'rchip'+(st.rar[r]?' on':''),style:'--c:'+RARITY[r].c,'data-fid':'rc'+r,onclick:()=>{this.sfx('uiTab');st.rar[r]=st.rar[r]?0:1;this.rebuild(true);}},this.tr(RARITY[r].n))));
    const search=h('input',{type:'text',class:'achsearch','data-fid':'bagq',placeholder:'🔍 '+this.t('bagSearch'),value:st.q,autocomplete:'off',spellcheck:'false',oninput:e=>{st.q=e.target.value;fill();}});
    const sortSel=h('select',{class:'bagsort','data-fid':'bsort',onchange:e=>{st.sort=e.target.value;fill();}},['new','old','rar','perf','name'].map(k=>h('option',{value:k,selected:st.sort===k?'':null},this.t(({new:'bagSort_new',old:'bagSort_old',rar:'bagSort_rar',perf:'bagSort_perf',name:'bagSort_name'})[k]))));
    sortSel.value=st.sort;
    fill();
    return h('div',null,this.header('bagTitle'),pick?h('p',{class:'sub'},this.t('bagPickHint')):null,
      h('div',{class:'achtools'},search,sortSel,shown),h('div',{class:'achtools'},chips),
      h('div',{class:'bagsplit'},grid,det));
  },
  /* ---------- Super Shenron: the 7 Super Dragon Balls spent on a reward (opened from the stage menu) ---------- */
  screen_superWish(){
    const d=this.save,have=new Set(d.sball),all=d.unlocked.length>=CHARS.length;
    const balls=h('div',{class:'sballs'},Array.from({length:SB_TOTAL},(_,i)=>gball(i+1,64,have.has(i+1)?'':'off')));
    return h('div',{class:'center'},this.header('sbTitle'),balls,h('p',{class:'sub'},this.t('sbWishDesc')),
      h('div',{class:'supbox'},
        h('button',{class:'card opt','data-fid':'sbchar',disabled:all,onclick:()=>{this.sfx('uiStart');this.pop();this.sel.claim=true;this.push('chars');}},
          glyph('人','#ffd23f'),h('div',{class:'col'},h('div',{class:'cn'},this.t('sbChar')),h('div',{class:'cd'},this.t(all?'sbNoChar':'sbCharD')))),
        h('button',{class:'card opt','data-fid':'sblucky',onclick:()=>{
          if(this.app.progress.useSuperBalls('lucky')){this.sfx('uiStart');this.toast({type:'info',msg:this.t('sbLuckyGot')});this.pop();this.push('gacha');}
        }},glyph('券','#ff9ad0'),h('div',{class:'col'},h('div',{class:'cn'},this.t('sbLucky')),h('div',{class:'cd'},this.t('sbLuckyD'))))));
  }
});
