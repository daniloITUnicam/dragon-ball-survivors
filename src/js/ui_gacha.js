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
/* v136: pictures used only as CSS backgrounds (the Potara earring, the Gacha shop scene): their URL from the sprite pack, as CSS rules added once */
let _guiCss=false;
function guiCss(){
  if(_guiCss)return;_guiCss=true;const u=id=>SPRITE_PACK[id]&&SPRITE_PACK[id].u,r=[];
  if(u('potara'))r.push('.potara{background-image:url("'+u('potara')+'")}');
  if(u('gachabg'))r.push('.gscene{background-image:url("'+u('gachabg')+'")}');
  if(r.length){const s=document.createElement('style');s.textContent=r.join('');document.head.append(s);}
}
/* every trinket carries the Potara earring: a tiny one beside its name, a bigger one in the corner of the choice cards */
function potara(cls){guiCss();return h('i',{class:'potara'+(cls?' '+cls:''),'aria-hidden':'true'});}
/* the summon video: where the universe sphere sits at the end, in video px (1280x720), and how the colour of the best trinket spreads over the portal
   (radius as a share of the video width, opacity of the tint, both by video time); the rarity "!" sounds at GV_RING s */
const GV_W=1280,GV_H=720,GV_C=[640,372],GV_END=[640,386],GV_RING=3.2;
const GV_R=[[0,.07],[1,.08],[2.5,.16],[4,.21],[6.2,.21],[6.8,.12],[7.2,.3],[8,.12],[10,.1]],GV_O=[[0,0],[2.2,0],[3.2,1],[10,1]];
const gvAt=(P,t)=>{if(t<=P[0][0])return P[0][1];for(let i=1;i<P.length;i++)if(t<=P[i][0]){const a=P[i-1],b=P[i];return a[1]+(b[1]-a[1])*(t-a[0])/(b[0]-a[0]);}return P[P.length-1][1];};

Object.assign(UI.prototype,{
  /* ---------- helpers ---------- */
  tdef(id){return trinDef(id);},
  /* name, rarity and effect text of a trinket at a rarity, in the language of the player */
  tinfo(id,r,p,fu){const t=this.tdef(id),pf=hasPfE(t,fu)?(p!=null?p:PF_NOM):null;return{t,c:RARITY[r].c,name:this.tr(t.n),rar:this.tr(RARITY[r].n),desc:this.tr(trinDesc(t,r,pf,fu)),stats:trinStats(t,r,pf,fu),perf:pf,fu:isFused(fu)?fu:null};},
  /* perfection of a trinket: a bar (0-100%) and, at 100%, the Ultra Instinct shimmer */
  perfBar(p,compact){if(p==null)return null;return h('div',{class:'perf'+(p>=100?' ui':'')+(compact?' sm':''),style:'--p:'+p+'%;--pc:'+perfColor(p),title:this.t('perfLabel')+' '+p+' / 100'+(p>=100?' · '+this.t('perfUI'):'')},
    compact?null:h('span',{class:'pe'},'0'),h('span',{class:'pbar'},h('i')),compact?h('span',{class:'pv'},p):h('span',{class:'pe'},'100'),compact?null:h('b',null,this.t('perfLabel')+' '+p+' / 100'+(p>=100?' ✦':'')));},
  fmtDate(ts){try{return new Date(ts).toLocaleString(this.app.i18n.lang,{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}catch(e){return new Date(ts).toISOString().slice(0,16).replace('T',' ');}},
  /* a trinket as a small card (bag) */
  tcard(id,r,o){
    o=o||{};const i=this.tinfo(id,r,o.p,o.fu);
    return h(o.btn?'button':'div',{class:'tcard r'+r+(o.sel?' sel':'')+(o.eq?' eq':'')+(i.perf!=null&&i.perf>=100?' perfect':''),style:'--c:'+i.c,'data-fid':o.fid,onclick:o.onclick,title:i.name+' · '+i.rar+(i.perf!=null?' · '+i.perf+'%':'')+'\n'+i.desc},
      glyph(i.t.k,i.c),i.fu?h('span',{class:'tfz',title:this.tr(T('Cimelio fuso','Fused trinket'))},'⚗'):null,o.check!=null?h('span',{class:'tchk'+(o.check?' on':'')},o.check?'✓':''):null,h('div',{class:'col'},h('div',{class:'cn',style:'color:'+i.c},potara(),i.name),h('div',{class:'ctag'},i.rar+(i.perf!=null?' · '+i.perf+'%':'')),h('div',{class:'cd'},i.desc),this.perfBar(i.perf,true),o.badge||null));
  },
  /* ---------- trinket slot in the character screen ---------- */
  trinketSlot(){
    const d=this.save,n=this.app.progress.trinketSlots(),eqs=(d.equips||[d.equip]).slice(0,3);
    const one=i=>{
      const eq=eqs[i],t=eq&&this.tdef(eq.id);
      if(eq&&!t){d.equips[i]=null;d.equip=d.equips[0];}
      const be=t&&d.bag.find(b=>b.id===eq.id&&b.r===eq.r),inf=t?this.tinfo(eq.id,eq.r,be&&be.p,be&&be.f):null;
      const sfx=n>1?String(i+1):'';
      const slot=h('button',{class:'tslot'+(t?' on r'+eq.r+(inf.perf!=null&&inf.perf>=100?' perfect':''):''),style:t?'--c:'+inf.c:'','data-fid':'tslot'+sfx,title:t?inf.name+' · '+inf.rar+'\n'+inf.desc:this.t('slotEmpty'),
        onclick:()=>{this.sfx();this.push('bag',{pick:true,slot:i});}},
        t?[glyph(t.k,inf.c),h('span',{class:'tsn'},potara(),inf.name),this.perfBar(inf.perf,true)]:h('span',{class:'tplus'},'+'));
      return h('div',{class:'tsone'},slot,
        t?h('button',{class:'btn tiny alt unq','data-fid':'tunq'+sfx,onclick:()=>{this.sfx('uiBack');this.app.progress.equipTrinket(null,0,i);this.rebuild(true);}},'✕ '+this.t('bagUnequip')):null);
    };
    return h('div',{class:'tslotwrap'+(n>1?' multi':'')},h('span',{class:'lbl'},this.t(n>1?'trinketSlots':'trinketSlot')),
      h('div',{class:'tsrow'},Array.from({length:n},(_,i)=>one(i))));
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
    /* v136: full screen, on Kami's Lookout with the summoning portal (the first frame of the summon video: a pull starts from this very picture) */
    guiCss();if(GACHA_VIDEO&&!this.gvFail)this.gvidEl();   /* the video starts loading now */
    const hdr=this.header('gachaTitle',null,[h('button',{class:'btn small alt','data-fid':'gbag',onclick:()=>{this.sfx();this.push('bag',{});}},'🎒 '+this.t('bagBtn')+' ('+d.bag.length+')'),
      h('button',{class:'btn small alt','data-fid':'greroll',onclick:()=>{this.sfx();this.push('reroll');}},'🎲 '+this.tr(T('Reroll','Reroll'))),
      h('button',{class:'btn small alt','data-fid':'gfuse',onclick:()=>{this.sfx();this.push('fuse');}},'⚗ '+this.tr(T('Fusione','Fusion')))]);
    {const t2=hdr.querySelector('h2');if(t2)t2.prepend(potara('ph'));}
    return h('div',{class:'gsrc gfull'},h('div',{class:'gscene','aria-hidden':'true'},h('div',{class:'gsglow'})),hdr,
      h('div',{class:'gcap'},h('span',null,this.t('gachaSub')),h('b',null,this.t('gColl',{a:d.bag.length,b:total}))),
      test?h('p',{class:'good gcap'},this.t('gTest')):null,
      h('div',{class:'gspace'}),
      !test&&this.app.progress.ticketCount()===0?h('p',{class:'gnote gcap'},this.t('gNoTk')):null,
      h('div',{class:'gtk'},cards),
      rates);
  },
  gachaPull(kind,times){
    times=times||1;
    const res=this.app.progress.gachaPull(kind,times);
    if(!res){this.sfx('uiErr');return;}
    this.gachaReveal(res,kind,times);
  },
  /* v136b: closing a pull: the results shrink into the portal while the shop zooms back out around it */
  gachaZoomOut(){
    const o=this.gov;if(!o){this.rebuild(true);return;}
    if(o.__stop)o.__stop();this.gov=null;if(this.modalEl===o)this.modalEl=null;
    this.rebuild(true);
    const sc=this.root.querySelector('.gsrc.gfull');if(sc){sc.classList.remove('gzin');void sc.offsetWidth;sc.classList.add('gzin');}
    o.classList.add('gzout');setTimeout(()=>{o.remove();if(sc)sc.classList.remove('gzin');},700);
  },
  closeReveal(){
    const o=this.gov;if(!o)return;
    if(o.__stop)o.__stop();o.remove();this.gov=null;if(this.modalEl===o)this.modalEl=null;
  },
  /* the summon: dragon-ball slot reels stop one after another (more stars = rarer, more light and sound), a big banner for Legendary and Mythic, then the trinkets pop in one by one */
  /* v136: the summon video, one element kept for every pull (it loads once) */
  gvidEl(){
    let v=this._gvid;
    if(!v){v=document.createElement('video');v.className='gvv';v.preload='auto';v.playsInline=true;v.setAttribute('playsinline','');v.setAttribute('aria-hidden','true');
      v.addEventListener('error',()=>{this.gvFail=true;});v.src=GACHA_VIDEO;this._gvid=v;}
    return v;
  },
  gachaReveal(res,kind,times){
    this.closeReveal();
    times=times||1;
    const n=res.length,best=res.reduce((m,x)=>Math.max(m,x.r),0),A=this.app.audio,bulk=n>10;   /* bulk (up to 100 pulls): one quick reel for the best result, then a compact list of everything */
    /* v136: with the video (published site): the portal opens, the balls whirl and take the colour of the best trinket (8-bit "!" by rarity),
       the universe is born; then the trinkets fly out of it one by one to their place and show their stats once there. Without it: the reels below */
    const vid=!!GACHA_VIDEO&&!this.gvFail?this.gvidEl():null;
    const ov=h('div',{class:'gov '+(bulk?'bulk n1':'n'+(n>1?10:1))+(vid?' gvid pre':'')});this.gov=ov;this.modalEl=ov;
    let skip=false,gone=false,tick=0,spinT=0;const pend=new Set();
    /* v136: speed ×1 / ×2 / ×4 (Settings: gSpd), changed with the button at any time: every wait, reel and the auto-open follow it */
    const SP=[1,2,4],st0=this.save.settings;let spd=SP.includes(st0.gSpd)?st0.gSpd:1;
    const snd=s=>{if(!skip&&!gone)A.sfx(s);};
    const later=(ms,fn)=>{if(skip||gone){fn();return;}const o={fn};o.id=setTimeout(()=>{pend.delete(o);fn();},ms/spd);pend.add(o);};
    const wait=ms=>new Promise(r=>later(ms,r));
    const doSkip=()=>{if(skip)return;skip=true;ov.classList.add('fast');clearInterval(tick);clearInterval(spinT);if(vSkip)vSkip();const l=[...pend];pend.clear();for(const o of l){clearTimeout(o.id);o.fn();}};
    ov.__stop=()=>{gone=true;clearInterval(tick);clearInterval(spinT);cancelAnimationFrame(raf);if(vid){vid.pause();vid.onended=null;}for(const o of pend)clearTimeout(o.id);pend.clear();};
    const title=h('div',{class:'gtitle'},this.t('gSpinning'));
    const reels=h('div',{class:'greels'}),els=[];
    const skipBtn=h('button',{class:'btn small alt gskip','data-fid':'gskip',onclick:doSkip},this.t('gSkip'));
    const spdBtn=h('button',{class:'btn small gspd','data-fid':'gspd',title:this.tr(T('Velocità dell\'apertura (anche automatica)','Opening speed (auto-open too)')),onclick:()=>{
      spd=SP[(SP.indexOf(spd)+1)%SP.length];st0.gSpd=spd;this.app.save.write();if(vid)vid.playbackRate=spd;spdBtn.textContent='⏩ ×'+spd;ov.style.setProperty('--spd',spd);this.sfx('uiTab');}},'⏩ ×'+spd);
    ov.style.setProperty('--spd',spd);
    let tint=null,vSkip=null,raf=0;
    if(vid){tint=h('div',{class:'gvtint r'+best});ov.append(vid,tint,h('div',{class:'gvdim'}));vid.pause();try{vid.currentTime=0;}catch(e){}vid.playbackRate=spd;
      const S=this.save.settings;vid.volume=clamp((S.master!=null?S.master:1)*(S.sfx!=null?S.sfx:1),0,1);vid.muted=false;}
    ov.append(spdBtn,title,reels);if(!vid)ov.append(skipBtn);   /* v136b: the video cannot be skipped (the speed button still speeds it up) */
    ov.addEventListener('pointerdown',e=>{if(vid||e.target.closest('button'))return;doSkip();});
    this.root.append(ov);(vid?spdBtn:skipBtn).focus({preventScroll:true});
    const sparks=(el,c,cnt,dist)=>{if(FXL&&FXL.on)cnt=Math.ceil(cnt/2);for(let i=0;i<cnt;i++){const a=Math.random()*TAU,d=dist*(.5+Math.random()*.7),s=h('i',{class:'gspark',style:'--c:'+c+';--x:'+Math.cos(a)*d+'px;--y:'+Math.sin(a)*d+'px'});el.append(s);setTimeout(()=>s.remove(),950);}};
    /* the reels: a strip of random balls that ends on the ball of the rarity found (v136: a big pull shows every ball instead, see run) */
    const K=14,dur=n>1?i=>1.3+i*.23:()=>2.3;
    if(!bulk)res.forEach((x,i)=>{
      const strip=h('div',{class:'gstrip'}),w=h('div',{class:'greel'},strip);
      els.push({w,strip,x});reels.append(w);
    });
    const Z=parseFloat(getComputedStyle(ov).getPropertyValue('--z'))||128;
    for(const e of els){
      for(let k=0;k<K;k++)e.strip.append(gball(1+Math.floor(Math.random()*7),Z));
      e.strip.append(gball(GACHA.stars[e.x.r],Z));
    }
    let stage=reels;
    /* v136: a big pull (more than 10): every ball spins in a grid sized to the screen, and they stop one after another, the rarest last */
    const spinAll=async()=>{
      const bg=h('div',{class:'gballs'}),wr=res.map(()=>{const b=gball(1+((Math.random()*7)|0),48);const w=h('span',{class:'gbw'},b);bg.append(w);return{w,b};});
      reels.replaceWith(bg);stage=bg;
      {const g=5,W=Math.min(1040,innerWidth*.96-8),H=Math.max(150,innerHeight-230);let bs=0,bc=1;
        for(let c=1;c<=n;c++){const rw=Math.ceil(n/c),sz=Math.min((W-(c-1)*g)/c,(H-(rw-1)*g)/rw);if(sz>bs){bs=sz;bc=c;}}
        bs=Math.max(22,Math.min(90,Math.floor(bs)));bg.style.setProperty('--cols',bc);for(const o of wr)o.b.style.setProperty('--z',bs+'px');}
      const live=new Set(wr.map(o=>o.b));
      spinT=setInterval(()=>{for(const b of live)b.style.setProperty('--n',1+((Math.random()*7)|0));},85);
      const order=res.map((_,i)=>i).sort((p,q)=>res[p].r-res[q].r||p-q),T0=800,span=Math.min(2800,500+n*26);
      order.forEach((ix,j)=>later(T0+span*j/n,()=>{const o=wr[ix],x=res[ix];live.delete(o.b);o.b.style.setProperty('--n',GACHA.stars[x.r]);o.w.classList.add('stop','r'+x.r);
        if(x.r>=2)sparks(o.w,RARITY[x.r].c,3+x.r*3,22+x.r*8);if(x.r>=2||j%4===0)snd('gStop'+Math.min(3,x.r));}));
      await wait(T0+span+500);clearInterval(spinT);
    };
    /* the video, with the rarity tint following it frame by frame; resolves when it ends (or is skipped) */
    let rang=false;
    const geo=()=>{const W=ov.clientWidth||innerWidth,H=ov.clientHeight||innerHeight,k=Math.max(W/GV_W,H/GV_H);return{k,ox:(W-GV_W*k)/2,oy:(H-GV_H*k)/2};};
    const setTint=t=>{const G=geo();tint.style.setProperty('--x',(G.ox+GV_C[0]*G.k)+'px');tint.style.setProperty('--y',(G.oy+GV_C[1]*G.k)+'px');tint.style.setProperty('--r',(gvAt(GV_R,t)*GV_W*G.k)+'px');tint.style.opacity=gvAt(GV_O,t);};
    const ring=()=>{if(rang||gone)return;rang=true;A.sfx('gRar'+best);};
    const playVideo=()=>new Promise(res2=>{
      let ok=false;const fin=()=>{if(ok)return;ok=true;cancelAnimationFrame(raf);clearTimeout(wd);vid.onended=null;setTint(10);ring();res2();};
      const wd=setTimeout(fin,16000);
      vSkip=()=>{try{if(isFinite(vid.duration))vid.currentTime=Math.max(0,vid.duration-.04);}catch(e){}vid.pause();fin();};
      vid.onended=fin;vid.onerror=()=>{this.gvFail=true;fin();};
      const frame=()=>{if(ok||gone)return;const t=vid.currentTime;setTint(t);if(t>=GV_RING)ring();raf=requestAnimationFrame(frame);};
      setTint(0);raf=requestAnimationFrame(frame);
      const p=vid.play();if(p&&p.catch)p.catch(()=>{vid.muted=true;const q=vid.play();if(q&&q.catch)q.catch(()=>{this.gvFail=true;fin();});});
    });
    /* a card / tile flies out of the universe to its place, then shows its stats */
    const fly=(el,x)=>new Promise(res2=>{
      if(gone){res2();return;}
      const G=geo(),r=el.getBoundingClientRect(),dx=G.ox+GV_END[0]*G.k-(r.left+r.width/2),dy=G.oy+GV_END[1]*G.k-(r.top+r.height/2),dur=(bulk?.38:.62)/spd;
      el.style.transition='none';el.style.transform='translate('+dx+'px,'+dy+'px) scale(.06)';el.style.opacity='0';el.classList.remove('hid');void el.offsetWidth;
      el.style.transition='transform '+dur+'s cubic-bezier(.2,.9,.25,1.12),opacity '+(.18/spd)+'s';el.style.transform='';el.style.opacity='';
      if(!bulk||x.r>=2)snd('gPop'+x.r);
      later(dur*1000*spd,()=>{el.classList.add('landed');if(x.r>=1)sparks(el,RARITY[x.r].c,2+x.r*3,bulk?20:40);res2();});
    });
    const run=async()=>{
      void reels.offsetHeight;
      if(vid){await playVideo();ov.classList.remove('pre');ov.classList.add('post');}
      else if(bulk)await spinAll();
      else{
      els.forEach((e,i)=>{
        e.strip.style.transition='transform '+(dur(i)/spd)+'s cubic-bezier(.16,.72,.14,1)';e.strip.style.transform='translateY('+(-K*Z)+'px)';
        later(dur(i)*1000,()=>{e.strip.style.transition='none';e.strip.style.transform='translateY('+(-K*Z)+'px)';e.w.classList.add('stop','r'+e.x.r);snd('gStop'+Math.min(3,e.x.r));sparks(e.w,RARITY[e.x.r].c,5+e.x.r*5,34+e.x.r*14);});
      });
      tick=setInterval(()=>snd('gTick'),(n>1?70:55)*Math.max(1,spd/2));
      const last=Math.max(...els.map((_,i)=>dur(i)));
      await wait(last*1000+450);clearInterval(tick);
      }
      if(best>=3&&!skip&&!vid){await this.gachaBanner(ov,best,res,snd,wait,A);}
      /* the cards */
      title.textContent=bulk?this.t('gDoneN',{n}):this.t(n>1?'gDone10':'gDone1');
      const cards=h('div',{class:bulk?'gtiles':'gcards'});stage.replaceWith(cards);
      let bestSnd=-1;
      if(bulk){
        /* every pull is shown (100 at most), one small tile each, resized to fill the screen; hover / tap a tile for its stats */
        const tip=h('div',{class:'gtip'});ov.append(tip);
        const showTip=(el,x,i,ev)=>{
          const eff=i.t.x&&i.t.m?this.tr(i.t.x):'';
          tip.replaceChildren(...[h('div',{class:'gtip-h',style:'--c:'+i.c},glyph(i.t.k,i.c),h('div',null,h('b',{style:'color:'+i.c},potara(),i.name),h('small',null,i.rar+(i.perf!=null?' · '+i.perf+'%':'')+(x.up!=null?' ↑':'')))),
            this.perfBar(i.perf),
            i.stats.length?h('div',{class:'stl'},i.stats.map(q=>h('span',{style:'color:#9affb0'},this.tr(q.t)))):h('div',{class:'gtip-d'},i.desc),
            eff?h('div',{class:'gtip-d'},eff):null,
            x.dup?h('div',{class:'gtip-t gdup'},this.t('gDup'),x.coins?[' · +',zAmt(x.coins,true)]:null):h('div',{class:'gtip-t gnew'},this.t('gNew')),
            x.up!=null?h('div',{class:'gtip-t gup'},this.t('gPerfUp',{a:x.up,b:x.p})):null].filter(Boolean));
          tip.style.setProperty('--c',i.c);tip.classList.add('on');
          const r=el.getBoundingClientRect(),tw=tip.offsetWidth,th=tip.offsetHeight,vw=innerWidth,vh=innerHeight;
          let px=ev&&ev.clientX!=null&&ev.type!=='focus'?ev.clientX+14:r.right+8,py=ev&&ev.clientY!=null&&ev.type!=='focus'?ev.clientY+14:r.top;
          if(px+tw>vw-8)px=Math.max(8,(ev&&ev.clientX!=null&&ev.type!=='focus'?ev.clientX:r.left)-tw-14);
          if(py+th>vh-8)py=Math.max(8,vh-th-8);
          tip.style.left=px+'px';tip.style.top=py+'px';
        };
        const hideTip=()=>tip.classList.remove('on');
        const list=[...res].sort((p,q)=>q.r-p.r||((q.p||0)-(p.p||0))||((!q.dup)-(!p.dup)));
        list.forEach((x,ix)=>{
          const i=this.tinfo(x.id,x.r,x.p);bestSnd=Math.max(bestSnd,x.r);
          const el=h('div',{class:'gtile r'+x.r+(i.perf!=null&&i.perf>=100?' perfect':'')+(x.dup?'':' fresh')+(vid?' hid':''),tabindex:'0',style:'--c:'+i.c+';--d:'+Math.min(ix*.012,1.2)+'s'},potara('ptile'),glyph(i.t.k,i.c),
            i.perf!=null?h('span',{class:'gtp',style:'--p:'+i.perf+'%;--pc:'+perfColor(i.perf)},h('i')):null,
            x.dup?null:h('span',{class:'gnd',title:this.t('gNew')}));
          el.addEventListener('pointerenter',ev=>showTip(el,x,i,ev));el.addEventListener('pointermove',ev=>{if(tip.classList.contains('on'))showTip(el,x,i,ev);});
          el.addEventListener('pointerleave',hideTip);el.addEventListener('focus',ev=>showTip(el,x,i,ev));el.addEventListener('blur',hideTip);
          cards.append(el);
        });
        /* the grid size that fits all the tiles in the space left by the title, the summary and the buttons */
        const fit=()=>{
          if(gone||!cards.isConnected)return;
          const g=6,W=Math.min(1040,innerWidth*.96-8),H=Math.max(150,innerHeight-258),nn=list.length;let bc=1,bs=0;
          for(let c=1;c<=nn;c++){const rw=Math.ceil(nn/c),sz=Math.min((W-(c-1)*g)/c,(H-(rw-1)*g)/rw);if(sz>bs){bs=sz;bc=c;}}
          bs=Math.max(30,Math.min(96,Math.floor(bs)));
          cards.style.setProperty('--cols',bc);cards.style.setProperty('--s',bs+'px');
        };
        fit();addEventListener('resize',fit);
        const st1=ov.__stop;ov.__stop=()=>{removeEventListener('resize',fit);st1();};
        if(vid){const els2=[...cards.children],step=Math.max(14,Math.min(90,1800/list.length));   /* the rarest come out last */
          for(let j=list.length-1;j>=0;j--){fly(els2[j],list[j]);await wait(step);}await wait(450);}
        else if(!skip)snd('gPop'+best);
      }
      else if(vid){   /* every card takes its place in the grid first (hidden), then they come out of the universe one by one */
        const els2=res.map(x=>{const i=this.tinfo(x.id,x.r,x.p),el=h('div',{class:'gcard hid r'+x.r+(i.perf!=null&&i.perf>=100?' perfect':''),style:'--c:'+i.c},potara('pcard'),glyph(i.t.k,i.c),h('div',{class:'cn',style:'color:'+i.c},i.name),h('div',{class:'ctag'},i.rar),this.perfBar(i.perf),h('div',{class:'cd'},i.desc),x.up!=null?h('span',{class:'gup'},this.t('gPerfUp',{a:x.up,b:x.p})):null,
          x.dup?h('span',{class:'gdup'},this.t('gDup'),x.coins?[' · +',zAmt(x.coins,true)]:null):h('span',{class:'gnew'},this.t('gNew')));cards.append(el);bestSnd=Math.max(bestSnd,x.r);return el;});
        for(let j=0;j<res.length;j++){await fly(els2[j],res[j]);await wait(n>1?140:0);}
      }
      else for(const x of res){
        const i=this.tinfo(x.id,x.r,x.p),el=h('div',{class:'gcard r'+x.r+(i.perf!=null&&i.perf>=100?' perfect':''),style:'--c:'+i.c},glyph(i.t.k,i.c),h('div',{class:'cn',style:'color:'+i.c},i.name),h('div',{class:'ctag'},i.rar),this.perfBar(i.perf),h('div',{class:'cd'},i.desc),x.up!=null?h('span',{class:'gup'},this.t('gPerfUp',{a:x.up,b:x.p})):null,
          x.dup?h('span',{class:'gdup'},this.t('gDup'),x.coins?[' · +',zAmt(x.coins,true)]:null):h('span',{class:'gnew'},this.t('gNew')));
        cards.append(el);bestSnd=Math.max(bestSnd,x.r);
        if(!skip){snd('gPop'+x.r);sparks(el,i.c,2+x.r*3,40);}
        await wait(n>1?250:0);
      }
      if(skip&&!gone&&!vid)A.sfx('gPop'+bestSnd);
      skipBtn.remove();
      const nNew=res.filter(x=>!x.dup).length,nDup=n-nNew,coins=res.reduce((s,x)=>s+(x.coins||0),0),test=this.testAll();
      const left=this.save.tickets[kind],again=test?times:Math.min(times,left,this.app.progress.gachaMaxTimes(kind)),can=test||left>0;
      const foot=h('div',{class:'row'},
        can?h('button',{class:'btn primary','data-fid':'again',onclick:()=>{this.sfx('uiStart');this.gachaPull(kind,again);}},this.t('gAgain')+(again>1?' ×'+again:'')+(test?'':' ('+left+')')):null,
        h('button',{class:'btn alt','data-fid':'gbag2',onclick:()=>{this.sfx();this.closeReveal();this.push('bag',{});}},'🎒 '+this.t('bagBtn')),
        h('button',{class:'btn alt','data-back':true,'data-fid':'gclose',onclick:()=>{this.sfx('uiBack');this.gachaZoomOut();}},this.t('gClose')));
      /* setting "auto-open": the next 1x / 10x ticket opens by itself, one at a time, until the player closes the window or presses Stop */
      const nk=(!test&&this.save.settings.tkAuto&&!bulk)?['t1','t10'].sort((a,b)=>(b===kind)-(a===kind)).find(k=>this.save.tickets[k]>0):null;
      if(nk){
        const at=setTimeout(()=>{if(!gone&&this.gov===ov)this.gachaPull(nk,1);},2400/spd);
        const st0=ov.__stop;ov.__stop=()=>{clearTimeout(at);st0();};
        const stop=h('button',{class:'btn small bad','data-fid':'gstop',onclick:()=>{clearTimeout(at);stop.remove();this.save.settings.tkAuto=false;this.app.save.write();this.sfx('uiBack');}},'⏹ '+this.tr(T('Ferma apertura automatica','Stop auto-open')));
        foot.prepend(stop);
      }else if(!test&&!bulk&&(kind==='t1'||kind==='t10')&&left>0){   /* v136: switch the auto-open on from here (the speed button speeds it up) */
        foot.prepend(h('button',{class:'btn small','data-fid':'gauto',title:this.tr(T('Apre da solo un ticket dopo l\'altro (si ferma con Stop o chiudendo). Impostazioni > Apertura automatica ticket.','Opens one ticket after another by itself (Stop or close to end it). Settings > Auto-open tickets.')),
          onclick:()=>{this.save.settings.tkAuto=true;this.app.save.write();this.sfx('uiStart');this.gachaPull(kind,1);}},'▶ '+this.tr(T('Apertura automatica','Auto-open'))));
      }
      [...foot.children].forEach((b,i)=>{b.classList.add('gslide');b.style.setProperty('--i',i);});   /* v136b: the buttons slide in one after another */
      ov.append(h('div',{class:'gsum gslide'},h('span',{class:'good'},this.t('gSummary',{n:nNew,d:nDup})),coins?h('span',null,'+',zAmt(coins,true)):null),foot);
      const f=(can?foot.querySelector('[data-fid="again"]'):null)||foot.querySelector('[data-fid="gclose"]');if(f)f.focus({preventScroll:true});
    };
    run();
  },
  /* the big lettering: Mythic = flash, rays, shaking screen and the jackpot sound; Legendary = a shorter golden one */
  async gachaBanner(ov,rar,res,snd,wait,A){
    const myth=rar>=4,it=res.find(x=>x.r===rar),nm=it?this.tr(trinDef(it.id).n):'';
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
    const all=d.bag.map(b=>({b,i:this.tinfo(b.id,b.r,b.p,b.f)}));
    const eqks=(d.equips||[d.equip]).filter(Boolean).map(e=>trinketKey(e.id,e.r)),slotSel=a.slot!=null?a.slot:null,here=slotSel!=null&&d.equips&&d.equips[slotSel],eqk=here?trinketKey(here.id,here.r):(eqks[0]||'');
    if(!this.bagSel||!d.bag.some(b=>trinketKey(b.id,b.r)===this.bagSel))this.bagSel=eqk&&d.bag.some(b=>trinketKey(b.id,b.r)===eqk)?eqk:(d.bag[0]?trinketKey(d.bag[0].id,d.bag[0].r):'');
    const grid=h('div',{class:'baggrid'}),det=h('div',{class:'bagdet'}),shown=h('span',{class:'achshown'});
    const sorts={new:(x,y)=>y.b.at-x.b.at,old:(x,y)=>x.b.at-y.b.at,rar:(x,y)=>y.b.r-x.b.r||(y.i.perf||0)-(x.i.perf||0)||x.i.name.localeCompare(y.i.name),perf:(x,y)=>(y.i.perf==null?-1:y.i.perf)-(x.i.perf==null?-1:x.i.perf)||y.b.r-x.b.r||x.i.name.localeCompare(y.i.name),name:(x,y)=>x.i.name.localeCompare(y.i.name)||y.b.r-x.b.r};
    const fill=()=>{
      const q=RAR_NORM(st.q.trim());
      const list=all.filter(o=>st.rar[o.b.r]&&(!q||RAR_NORM(o.i.name+' '+o.i.desc+' '+o.i.rar).includes(q))).sort(sorts[st.sort]||sorts.new);
      grid.replaceChildren(...(list.length?list.map(o=>{const k=trinketKey(o.b.id,o.b.r);return this.tcard(o.b.id,o.b.r,{p:o.b.p,fu:o.b.f,btn:true,sel:k===this.bagSel,eq:eqks.includes(k),fid:'t'+k,onclick:()=>{this.sfx();this.bagSel=k;this.rebuild(true);}});}):[h('p',{class:'sub'},this.t(all.length?'bagNone':'bagEmpty'))]));
      shown.textContent=this.t('bagShown',{a:list.length,b:all.length});
    };
    const sel=d.bag.find(b=>trinketKey(b.id,b.r)===this.bagSel);
    if(sel){
      const i=this.tinfo(sel.id,sel.r,sel.p,sel.f),isEq=eqks.includes(this.bagSel),eqSlot=isEq?(d.equips||[]).findIndex(e=>e&&trinketKey(e.id,e.r)===this.bagSel):-1;
      det.style.setProperty('--c',i.c);
      det.append(...[h('div',{class:'bdhead'},glyph(i.t.k,i.c),h('div',null,h('div',{class:'cn',style:'color:'+i.c},potara(),i.name),h('div',{class:'ctag'},i.rar))),this.perfBar(i.perf),
        isEq&&(slotSel==null||eqSlot===slotSel)?h('button',{class:'btn alt','data-fid':'bunq',onclick:()=>{this.sfx('uiBack');this.app.progress.equipTrinket(null,0,eqSlot);this.rebuild(true);}},this.t('bagUnequip')):
          h('button',{class:'btn primary','data-fid':'beq',onclick:()=>{this.sfx('uiStart');this.app.progress.equipTrinket(sel.id,sel.r,slotSel);this.toast({type:'info',msg:this.t('bagEquipped',{n:i.name})});if(pick)this.pop();else this.rebuild(true);}},this.t('bagEquip')),
        h('div',{class:'stl'},i.stats.length?i.stats.map(s=>h('span',{style:'color:#9affb0'},this.tr(s.t))):null),
        i.t.sp||i.t.x?h('p',null,this.tr(i.t.sp&&!i.t.m?i.t.d:(i.t.x||i.t.d))):null,
        i.fu?h('p',{class:'cd'},'⚗ '+this.fuText(i.fu)):null,
        h('p',{class:'cd'},this.t('bagGot',{d:this.fmtDate(sel.at)})),
        h('p',{class:'cd'},this.t('bagMarket')+': ',zAmt(ZENO_PRICE[sel.r],true)),
        sel.t?h('p',{class:'cd'},'🧪 Test'):null].filter(Boolean));
    }else det.append(h('p',{class:'sub'},this.t('bagEmpty')),h('button',{class:'btn','data-fid':'bgo',onclick:()=>{this.sfx();this.pop();if(!this.stack.some(s=>s.name==='gacha'))this.push('gacha');}},this.t('bagToGacha')));
    const chips=this.rarChips(st,()=>this.rebuild(true));
    const search=h('input',{type:'text',class:'achsearch','data-fid':'bagq',placeholder:'🔍 '+this.t('bagSearch'),value:st.q,autocomplete:'off',spellcheck:'false',oninput:e=>{st.q=e.target.value;fill();}});
    /* the sort options: a column of icons on the left, each with a tooltip */
    const SORT_ICON={new:'🆕',old:'⏳',rar:'★',perf:'％',name:'Aa'};
    const sortBtns=['new','old','rar','perf','name'].map(k=>{const lab=this.t('bagSort_'+k);
      return h('button',{class:'bsortb'+(st.sort===k?' on':''),'data-sort':k,'data-fid':'bs_'+k,'data-tip':this.t('bagSortBy')+': '+lab,'aria-label':lab,'aria-pressed':st.sort===k?'true':'false',
        onclick:()=>{this.sfx('uiTab');st.sort=k;for(const b of sortBtns){const on=b.dataset.sort===k;b.classList.toggle('on',on);b.setAttribute('aria-pressed',on?'true':'false');}fill();}},SORT_ICON[k]);});
    fill();
    return h('div',null,this.header('bagTitle'),pick?h('p',{class:'sub'},this.t('bagPickHint')):null,
      h('div',{class:'achtools'},search,shown),
      h('div',{class:'bagsplit'},h('div',{class:'bsorts'},h('div',{class:'bsorti'},sortBtns),chips),grid,h('div',{class:'bagside'},det)));
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
