'use strict';
/* ====== UI: DOM screens (menus, modals). Keyboard/gamepad navigable. ====== */
function h(tag,props,...kids){
  const e=document.createElement(tag);
  if(props)for(const k in props){
    const v=props[k];
    if(k==='class')e.className=v;else if(k==='style')e.style.cssText=v;
    else if(k.startsWith('on'))e[k]=v;else if(v!==false&&v!==null&&v!==undefined)e.setAttribute(k,v===true?'':v);
  }
  for(const c of kids.flat(3)){if(c===null||c===undefined||c===false)continue;e.append(c.nodeType?c:document.createTextNode(String(c)));}
  return e;
}
const LOGO_URL=('__LOGO__'?'data:image/webp;base64,__LOGO__':'');
const WIP_URL=('__WIP__'?'data:image/webp;base64,__WIP__':'');
const glyph=(k,c)=>h('span',{class:'glyph',style:'--c:'+c},k);
/* pixel-art icon (shop upgrades): a framed tile in the upgrade's colour */
const imgGlyph=(src,c)=>h('span',{class:'glyph gimg',style:'--c:'+c},h('img',{src,alt:'',draggable:'false'}));
/* zenny coin icon (replaces the plain "Z") */
function zIcon(){
  const e=document.createElement('span');e.className='zi';
  e.innerHTML='<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#7a4e0c"/><circle cx="12" cy="12" r="9.6" fill="#f2b51c"/><circle cx="12" cy="12" r="8" fill="none" stroke="#fff1a8" stroke-width="1.1"/><path d="M7.6 7.4h8.8l-6.2 8.4h6.4" fill="none" stroke="#7a4e0c" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.6 6.2c2-2.6 4.6-3.6 7-3.5" fill="none" stroke="#fff8d0" stroke-width="1.2" stroke-linecap="round" opacity=".8"/></svg>';
  return e;
}
const zAmt=(n,raw)=>h('span',{class:'zv'},zIcon(),raw?n:fmtN(n));
/* a ticket as an item: "+1 [ticket 10×]" (the same icon in the Achievement cards, the notifications and the "found" message) */
const TK_LAB={t1:'1×',t10:'10×',l10:'10×'},TK_NAME={t1:T('Ticket 1×','1× Ticket'),t10:T('Ticket 10×','10× Ticket'),l10:T('Ticket Lucky 10×','Lucky 10× Ticket')};
const tkChip=(kind,n)=>h('span',{class:'tkr',title:(window.__app&&__app.ui?__app.ui.tr(TK_NAME[kind]):TK_NAME[kind].en)},'+'+(n||1)+' ',h('i',{class:'tkico '+kind},h('b',null,TK_LAB[kind])),kind==='l10'?h('small',{class:'tkl'},'Lucky'):null);

class UI{
  constructor(app){
    this.app=app;this.root=document.getElementById('ui');this.toastBox=document.getElementById('toasts');
    this.stack=[];this.sel={stage:0,diff:app.save.d.diff||'normal',x2:false,char:app.save.d.lastChar||'goku'};
    this.modalEl=null;this.sbEl=document.getElementById('sandbox');
    this.bindArcadeSounds();
  }
  /* Arcade sounds for every DOM button (menus, modals, pause, level-up cards). Individual handlers may still
     call sfx() with a specific sound; the generic click only fires when none was played in the same instant. */
  bindArcadeSounds(){
    const au=()=>this.app.audio,btnOf=e=>e.target&&e.target.closest?e.target.closest('button'):null;
    document.addEventListener('pointerover',e=>{
      const b=btnOf(e);if(!b||b.disabled||e.pointerType==='touch')return;
      if(e.relatedTarget&&b.contains(e.relatedTarget))return;
      au().sfx('uiMove');
    });
    document.addEventListener('pointerdown',e=>{
      const b=btnOf(e);if(b&&b.disabled)au().sfx('uiErr');
    });
    document.addEventListener('click',e=>{
      const b=btnOf(e);if(!b||b.disabled)return;
      const a=au();if(performance.now()-(a.lastUi||0)<45)return;
      a.sfx(b.dataset.back!==undefined?'uiBack':b.classList.contains('primary')?'uiClick':b.classList.contains('tab')?'uiTab':'uiClick');
    });
  }
  get t(){return this.app.t;}
  tr(o){return this.app.i18n.t(o);}
  get save(){return this.app.save.d;}
  sfx(n){this.app.audio.sfx(n||'click');}
  btn(key,fn,cls,raw){return h('button',{class:'btn '+(cls||''),'data-fid':raw?null:'b_'+key,onclick:()=>{this.sfx();fn();}},raw?key:this.t(key));}
  /* ---- screen stack ---- */
  show(name,args){this.stack=[];this.root.innerHTML='';this.push(name,args);}
  push(name,args){
    const prev=this.top;if(prev)prev.el.classList.add('hidden');
    const el=this['screen_'+name](args);el.classList.add('screen');
    el.classList.add('enter');setTimeout(()=>el.classList.remove('enter'),360);   /* a short fade/slide when a screen opens (not when it is rebuilt in place) */
    this.root.append(el);this.stack.push({name,args,el});this.focusFirst();
  }
  pop(){
    const s=this.stack.pop();if(s)s.el.remove();
    const t=this.top;if(t){t.el.classList.remove('hidden');this.rebuild();}
  }
  get top(){return this.stack[this.stack.length-1];}
  rebuild(keepFocus){
    const t=this.top;if(!t)return;
    const fid=keepFocus&&document.activeElement&&document.activeElement.dataset?document.activeElement.dataset.fid:null;
    /* keep the scroll position of the screen (and of its inner scroll boxes) when it is rebuilt in place */
    const SB='.wgrid,.grimdetail,.detail,.split>*',old=t.el,sc=old.scrollTop,inner=[...old.querySelectorAll(SB)].map(e=>e.scrollTop);
    const el=this['screen_'+t.name](t.args);el.classList.add('screen');
    t.el.replaceWith(el);t.el=el;
    if(sc||inner.some(v=>v)){el.scrollTop=sc;[...el.querySelectorAll(SB)].forEach((e,i)=>{if(inner[i])e.scrollTop=inner[i];});}
    if(fid){const f=el.querySelector('[data-fid="'+fid+'"]');if(f){f.focus({preventScroll:true});return;}}
    this.focusFirst();
  }
  clear(){this.stack=[];this.root.innerHTML='';}
  get active(){return this.stack.length>0;}
  focusFirst(){
    const t=this.top;if(!t)return;
    const f=t.el.querySelector('[data-focus]')||this.focusables(t.el)[0];
    if(f)setTimeout(()=>f.focus({preventScroll:true}),20);
  }
  focusables(root){return[...root.querySelectorAll('button:not([disabled]),input,select')].filter(e=>e.offsetParent!==null);}
  /* ---- gamepad / keyboard navigation (called each frame while a screen is open) ---- */
  update(){
    const inp=this.app.input,t=this.top;if(!t||inp.rebind)return;
    const root=this.modalEl&&this.modalEl.isConnected?this.modalEl:t.el;
    for(const d of['up','down','left','right'])if(inp.navPressed(d))this.nav(d,root);
    if(inp.pressed('confirm')){
      const a=document.activeElement;
      if(a&&root.contains(a)&&a.tagName==='BUTTON'&&!this.confirmGuard){a.click();}
    }
    if(inp.pressed('cancel')){const b=root.querySelector('[data-back]');if(b){this.sfx('uiBack');b.click();}}
  }
  nav(dir,root){
    const a=document.activeElement;
    if(a&&root.contains(a)&&(dir==='left'||dir==='right')){
      if(a.tagName==='INPUT'&&a.type==='range'){const st=+(a.step||1);a.value=+a.value+(dir==='left'?-st:st);a.dispatchEvent(new Event('input'));return;}
      if(a.tagName==='SELECT'){const i=a.selectedIndex+(dir==='left'?-1:1);if(i>=0&&i<a.options.length){a.selectedIndex=i;a.dispatchEvent(new Event('change'));}return;}
    }
    const list=this.focusables(root);if(!list.length)return;
    if(!a||!root.contains(a)||!list.includes(a)){list[0].focus({preventScroll:true});return;}
    const r=a.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
    let best=null,bs=1e9;
    for(const e of list){
      if(e===a)continue;const q=e.getBoundingClientRect(),ex=q.left+q.width/2,ey=q.top+q.height/2,dx=ex-cx,dy=ey-cy;
      let ok=false,sc=0;
      if(dir==='right'&&dx>6){ok=true;sc=dx+Math.abs(dy)*2.2;}
      else if(dir==='left'&&dx<-6){ok=true;sc=-dx+Math.abs(dy)*2.2;}
      else if(dir==='down'&&dy>6){ok=true;sc=dy+Math.abs(dx)*2.2;}
      else if(dir==='up'&&dy<-6){ok=true;sc=-dy+Math.abs(dx)*2.2;}
      if(ok&&sc<bs){bs=sc;best=e;}
    }
    if(best){best.focus({preventScroll:false});best.scrollIntoView({block:'nearest'});this.sfx('uiMove');}
  }

  /* ================= SCREENS ================= */
  header(titleKey,backFn,extra){
    return h('div',{class:'hdr'},
      h('button',{class:'btn small alt','data-back':true,onclick:()=>{this.sfx('uiBack');(backFn||(()=>this.pop()))();}},'← '+this.t('back')),
      h('h2',null,this.t(titleKey)),
      extra?h('div',{class:'hx'},extra):null,
      h('div',{class:'zen'},zAmt(this.save.zenny)));
  }
  screen_main(){
    const d=this.save,s=d.settings;
    return h('div',{class:'main'},
      h('div',{class:'mtop'},this.patchBtn(),this.cloudMenuBtn()),
      /* the title, with the "Work in progress" badge hopping at its bottom right (decorative, never intercepts clicks) */
      h('div',{class:'logo'},LOGO_URL?h('img',{class:'logoimg',src:LOGO_URL,alt:'Dragon Ball: Survivors',draggable:'false'}):h('h1',null,'Dragon Ball:',h('br'),'Survivors'),
        WIP_URL?h('div',{class:'wip','aria-hidden':'true',title:'Work in progress'},h('div',{class:'wipin'},h('img',{src:WIP_URL,alt:'W.I.P.',draggable:'false'}))):null),
      h('div',{class:'menu'},
        this.btn('play',()=>{this.sel.stage=Math.min(this.sel.stage,this.maxStage());this.push('stages');},'primary'),
        h('button',{class:'btn quickbtn','data-fid':'quick',title:this.t('quickStartD'),onclick:()=>{this.sfx('uiStart');this.quickStart();}},'⚡ '+this.t('quickStart')),
        this.btn('shop',()=>this.push('shop')),
        this.btn('gachaBtn',()=>this.push('gacha')),
        this.btn('unl',()=>this.push('unl')),
        this.btn('ach',()=>this.push('ach')),
        this.btn('settings',()=>this.push('settings',{tab:'general'})),
        this.testAll()?this.btn('sandbox',()=>this.push('sandboxCfg'),'alt'):null),
      h('div',{class:'foot'},
        h('span',{class:'hint'},this.app.input.mode==='pad'?('🎮 '+(this.app.input.padName||'').slice(0,40)):this.t('kbHint'))));
  }
  testAll(){return !!this.save.settings.sandbox&&this.app.cloud.canTest;}   /* Test mode: switched on in Settings, and only for the owner's account and the whitelist */
  charOpen(id){return this.testAll()||this.save.unlocked.includes(id);}
  stageOpen(i){const st=STAGES[i];return this.testAll()||st.pos===0||this.save.clears[i]>0||this.save.clears[STAGE_ORDER[st.pos-1]]>0;}
  maxStage(){return this.stageOpen(this.sel.stage)?this.sel.stage:STAGE_ORDER[0];}
  screen_stages(){
    const d=this.save,sel=this.sel;sel.claim=false;
    if(!this.stageOpen(sel.stage))sel.stage=STAGE_ORDER[0];
    const x2ok=this.testAll()||!!d.x2[sel.stage];if(!x2ok)sel.x2=false;
    const cards=STAGE_ORDER.map(i=>{
      const s=STAGES[i],locked=!this.stageOpen(i),b=d.best[String(i)];
      return h('button',{class:'card stage'+(i===sel.stage?' sel':'')+(locked?' locked':''),'data-fid':'st'+i,disabled:locked,
        style:'--sky:'+THEMES[s.theme].sky+';--hi:'+THEMES[s.theme].hi,
        onclick:()=>{this.sfx();sel.stage=i;this.push('chars');}},
        h('canvas',{class:'stprev',width:240,height:96,'data-theme':s.theme,'data-seed':String(i)}),
        h('div',{class:'stnum'},'STAGE '+s.no),h('div',{class:'cn'},this.tr(s.n)),
        h('div',{class:'cd'},this.t('duration')+': '+fmtT(DIFF[sel.diff].dur/(sel.x2?2:1))+(sel.x2?' (x2)':'')+' · '+this.t('bosses')+': '+bossPlan(s,DIFF[sel.diff].dur,sel.diff).length),
        this.stageStats(i),
        locked?h('div',{class:'cl bad'},this.t('stageLocked',{n:STAGES[STAGE_ORDER[s.pos-1]].no})):
          h('div',{class:'cl'},(d.clears[i]?'★ '+this.t('clears')+': '+d.clears[i]:this.t('notCleared'))+(b?' · '+this.t('best')+': '+b.kills+' '+this.t('kills'):'')));
    });
    /* the special scenario that exists only while you hold all 7 Super Dragon Balls */
    if(d.sball.length>=SB_TOTAL)cards.unshift(h('button',{class:'card stage superc','data-fid':'superc',onclick:()=>{this.sfx('uiStart');this.push('superWish');}},
      h('div',{class:'sballs'},Array.from({length:SB_TOTAL},(_,i)=>gball(i+1,34))),h('div',{class:'cn'},this.t('sbStage')),h('div',{class:'cd'},this.t('sbStageD'))));
    const diffs=Object.keys(DIFF).map(k=>h('button',{class:'btn small'+(sel.diff===k?'':' alt'),'data-fid':'df'+k,onclick:()=>{this.sfx();sel.diff=k;d.diff=k;this.app.save.write();this.rebuild(true);}},this.tr(DIFF[k].n)));
    return h('div',null,this.header('chooseStage',null,this.gearBtn()),
      h('div',{class:'row topact'},this.btn('next',()=>this.push('chars'),'primary')),
      h('div',{class:'row'},h('span',{class:'lbl'},this.t('difficulty')),diffs,
        /* the explanation lives in the tooltip (on the wrapper too, so it also shows while the button is locked) */
        h('span',{class:'x2wrap',title:x2ok?this.t('x2Desc'):this.t('x2Locked')},
          h('button',{class:'btn small'+(sel.x2?'':' alt'),disabled:!x2ok,'data-fid':'x2',title:x2ok?this.t('x2Desc'):this.t('x2Locked'),
            onclick:()=>{this.sfx();sel.x2=!sel.x2;this.rebuild(true);}},'x2 '+(x2ok?(sel.x2?this.t('on'):this.t('off')):'🔒')))),
      h('div',{class:'grid stages'},cards));
  }
  screen_chars(){
    const d=this.save,sel=this.sel;
    if(!this.charOpen(sel.char))sel.char='goku';
    const peekId=sel.peek&&!this.charOpen(sel.peek)?sel.peek:null;
    const C=CHARS.find(c=>c.id===(peekId||sel.char));
    this.anim=[];
    const mk=(c,ci)=>{
      const open=this.charOpen(c.id),cv=document.createElement('canvas');cv.width=78;cv.height=96;
      this.anim.push({cv,c,open,seed:hash(ci,7),key:'',w:78,h:96,base:90,k:(c.u||1.95)/Sprites.S*1.1,card:true});
      const isSel=peekId?c.id===peekId:c.id===sel.char;
      return h('button',{class:'char'+(isSel?' sel':'')+(open?'':' locked'),'data-fid':'c'+c.id,onclick:()=>{this.sfx();if(open){sel.char=c.id;sel.peek=null;}else sel.peek=c.id;this.rebuild(true);}},
        cv,h('b',null,open?this.tr(c.n):'???'));
    };
    /* the grid is filled by the search box / sort selector without rebuilding the whole screen (so typing keeps its focus) */
    const grid=h('div',{class:'grid chars'}),cnt=h('span',{class:'chcount'});
    const fill=()=>{
      this.anim=(this.anim||[]).filter(a=>!a.card);
      const list=this.charList();
      grid.replaceChildren(...(list.length?list.map(({c,i})=>mk(c,i)):[h('p',{class:'sub'},this.tr(T('Nessun personaggio trovato.','No characters found.')))]));
      cnt.textContent=list.length+' / '+CHARS.length;
    };
    fill();
    const tools=this.charTools(fill,cnt);
    const line=LINES[C.line||'saiyan'];
    const big=document.createElement('canvas');big.width=170;big.height=190;
    this.anim.push({cv:big,c:C,open:!peekId,seed:.3,key:'',w:170,h:190,base:178,k:(C.u||1.95)/Sprites.S*2.9,big:true,forms:peekId?0:Math.min(((d.maxForm||{})[C.id]||0),LINES[C.line||'saiyan'].length)});
    /* portrait of the emotes (sheet emo<id>[_<form>]): cycles the 4 emotes of the form shown by the big sprite */
    let portrait=null;
    if(!peekId&&Sprites.emoSheet(C.id,99)){
      const pv=document.createElement('canvas');pv.width=166;pv.height=152;portrait=pv;
      this.anim.push({cv:pv,c:C,emo:true,forms:this.anim[this.anim.length-1].forms,key:'',w:166,h:152});
    }
    const claim=!!sel.claim&&d.sball.length>=SB_TOTAL;if(sel.claim&&!claim)sel.claim=false;
    const lock=peekId?h('div',{class:'lockbox'},h('div',null,h('b',null,this.t('reqLabel')+': '),this.tr(C.lock)),
      claim?h('button',{class:'btn small','data-fid':'sbclaim',onclick:()=>{
        if(this.app.progress.useSuperBalls('char',C.id)){this.sfx('uiStart');sel.char=C.id;sel.peek=null;sel.claim=false;this.toast({type:'info',msg:this.t('sbClaimed',{c:this.tr(C.n)})});this.rebuild();}
      }},'🐉 '+this.t('sbClaim')):
      C.price?h('button',{class:'btn small'+(d.zenny>=C.price?'':' alt'),disabled:d.zenny<C.price,'data-fid':'buychar',onclick:()=>{
        if(this.app.progress.buyChar(C.id)){this.sfx('buy');sel.char=C.id;sel.peek=null;this.toast({type:'info',msg:this.t('charBought',{c:this.tr(C.n)})});this.rebuild();}
      }},(()=>{const pt=this.t('buyChar',{n:'\u0001'}).split('\u0001');return[pt[0],zAmt(C.price),pt[1]||''];})()):null):null;
    const startBtn=h('button',{class:'btn primary',disabled:!!peekId,'data-fid':'start',onclick:()=>{this.sfx('uiStart');d.lastChar=sel.char;d.lastStage=sel.stage;this.app.save.write();this.app.startGame({stage:sel.stage,char:sel.char,diff:sel.diff,x2:sel.x2,sandbox:false,pet:d.pet});}},this.t('start'));
    const detail=h('div',{class:'detail'},
      h('div',{class:'preview'},portrait?h('div',{class:'emoframe'},portrait):null,big,this.trinketSlot(),this.weaponCount()),
      h('h3',null,this.tr(C.n)),h('p',null,this.tr(C.d)),lock,
      h('div',{class:'chips'},h('span',{class:'lbl'},this.t('startWeapons')+': '),C.start.map(id=>h('span',{class:'chip',style:'--c:'+WEAPONS[id].c},glyph(WEAPONS[id].k,WEAPONS[id].c),this.tr(WEAPONS[id].n)))),
      h('div',{class:'stats'},
        h('span',null,'HP '+C.hp),h('span',null,this.t('stSpeed')+' x'+C.spd),h('span',null,this.t('stPower')+' x'+C.might)),
      (()=>{const ab=ABIL[C.id];return ab?h('div',{class:'abbox',style:'--c:'+ab.c},h('span',{class:'lbl'},this.t('abilityLabel')),h('div',{class:'abrow'},glyph(ab.k,ab.c),h('b',null,this.tr(ab.n)),ab.cd?h('i',{title:this.tr(T('La ricarica diminuisce a ogni livello (fino a −10 s).','Cooldown shrinks with every level (up to −10 s).'))},abBase(ab.cd)+'s ↓'):null),h('p',null,this.tr(ab.d)),
        ABIL_TIER[ab.m]?h('p',{class:'abtier'},h('span',null,'◆ '+this.tr(T('Forma centrale: ','Middle form: '))),this.tr(ABIL_TIER[ab.m].p)):null,
        ABIL_TIER[ab.m]?h('p',{class:'abtier fin'},h('span',null,'★ '+this.tr(T('Forma finale: ','Final form: '))),this.tr(ABIL_TIER[ab.m].f)):null):null;})(),
      h('div',{class:'formsList'},h('span',{class:'lbl'},this.t('forms')),
        line.map((f,i)=>i<((d.maxForm||{})[C.id]||0)?h('div',{class:'frm',style:'--c:'+f.aura},h('i',null,this.t('lv')+' '+FORM_TIERS[i].lvl),this.tr(f.n)):h('div',{class:'frm',style:'--c:#6a7a90'},h('i',null,'???'),this.t('formHidden')))),
      this.petPicker());
    /* Glossary and Grimoire live here (top right of the character screen) instead of the main menu */
    const refBtns=[this.gearBtn(),h('button',{class:'btn small alt','data-fid':'cgloss',onclick:()=>{this.sfx();this.push('glossary');}},'📚 '+this.t('glossary')),
      h('button',{class:'btn small alt','data-fid':'cgrim',onclick:()=>{this.sfx();this.push('grimoire');}},'📖 '+this.t('grimoire')),
      h('button',{class:'btn small alt','data-fid':'cbag',onclick:()=>{this.sfx();this.push('bag',{});}},'🎒 '+this.t('bagBtn')),
      h('button',{class:'btn small alt','data-fid':'cunl',onclick:()=>{this.sfx();this.push('unl');}},'🏆 '+this.t('unl')),
      h('button',{class:'btn small alt','data-fid':'cobj',onclick:()=>{this.sfx();this.push('ach');}},'🎯 '+this.t('ach'))];
    return h('div',{class:'cscr'},this.header('chooseChar',claim?()=>{sel.claim=false;sel.peek=null;this.pop();}:null,refBtns),
      claim?h('div',{class:'claimbar'},'🐉 '+this.t('sbClaimBar')):null,
      h('div',{class:'row topact'},startBtn,peekId?null:h('button',{class:'btn quickbtn','data-fid':'cquick',title:this.t('quickStartD'),onclick:()=>{this.sfx('uiStart');this.quickStart(sel.char);}},'⚡ '+this.t('quickStart'))),
      h('div',{class:'split'},h('div',{class:'chcol'},tools,grid),detail));
  }
  /* ---- pet picker (companion shown under the character list) ---- */
  petPicker(){
    const d=this.save,cur=d.pet||'dende',P=PETS.find(x=>x.id===cur);
    const btns=PETS.map(pt=>{
      const cv=document.createElement('canvas');cv.width=48;cv.height=48;
      this.anim.push({cv,pet:pt,seed:hash(pt.id.length,3),key:'',w:48,h:48,base:44,k:(pt.sp.u||1.4)/Sprites.S*.95});
      return h('button',{class:'pet'+(pt.id===cur?' sel':''),'data-fid':'pet'+pt.id,title:this.tr(pt.n),onclick:()=>{this.sfx();d.pet=pt.id;this.app.save.write();this.rebuild(true);}},cv,h('b',null,this.tr(pt.n)));
    });
    btns.push(h('button',{class:'pet none'+(cur==='none'?' sel':''),'data-fid':'petnone',onclick:()=>{this.sfx();d.pet='none';this.app.save.write();this.rebuild(true);}},h('span',{class:'nopet'},'✕'),h('b',null,this.t('petNone'))));
    return h('div',{class:'petbox'},h('span',{class:'lbl'},this.t('petLabel')),h('div',{class:'pets'},btns),
      P?h('div',{class:'petinfo',style:'--c:'+P.c},h('b',null,this.tr(P.race)+' · '+this.tr(P.ab)),h('span',null,this.tr(P.d)+' '+this.t('petPassive')+' '+this.t('petCd',{n:P.cd}))):h('div',{class:'petinfo'},this.t('petNoneDesc')));
  }
  /* ---- character / pet idle animations (blinks, expressions, little combat poses) ---- */
  /* stage cards: a small animated top-down view of each map (the terrain renderer pointed at a tiny canvas, slowly panning) */
  animStages(dt){
    this.pvAcc=(this.pvAcc||0)+dt;if(this.pvAcc<1/24)return;const step=this.pvAcc;this.pvAcc=0;
    const r=this.app.renderer,old=r.ctx,S=.4,W=240,H=96,t=this.animT;
    for(const cv of document.querySelectorAll('canvas.stprev')){
      const th=cv.dataset.theme,seed=+cv.dataset.seed||0,pc=cv.getContext('2d'),Sc=th==='void'?.2:S,vw=W/Sc,vh=H/Sc;   /* (the ring of the Tournament of Power is shown wider, so the tower fits) */
      let cx=seed*733+t*26,cy=seed*411+Math.sin(t*.25+seed)*60;
      if(th==='snake'){cx=((t*40+seed*50)%6000)-3000;cy=Snake.f(cx)-vh/2;}
      if(th==='void'){cx=Math.sin(t*.25)*120-vw/2+200;cy=-228-vh/2;}   /* the tower and its shadow, swaying slowly */
      try{r.ctx=pc;pc.setTransform(Sc,0,0,Sc,-cx*Sc,-cy*Sc);pc.imageSmoothingEnabled=false;r.terrain(cx,cy,vw,vh,t,th);if(th==='void'){pc.translate(0,TOPARENA.TR*.4);TopArt.tower(pc,t);}}catch(e){}
      r.ctx=old;pc.setTransform(1,0,0,1,0,0);
      const g=pc.createLinearGradient(0,H*.45,0,H);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(8,14,28,.55)');pc.fillStyle=g;pc.fillRect(0,0,W,H);
    }
    r.ctx=old;
  }
  animate(dt){
    this.animT=(this.animT||0)+dt;
    if(this.top&&this.top.name==='stages'){this.animStages(dt);return;}
    if(this.top&&this.top.name==='quick')this.animStages(dt);
    const t=this.animT,list=this.anim;if(!list||!list.length||!this.top||(this.top.name!=='chars'&&this.top.name!=='quick'))return;
    for(const a of list){
      if(!a.cv.isConnected)continue;
      const par=a.cv.parentElement,hot=a.big||(par&&(par.matches(':hover')||par.classList.contains('sel')||par===document.activeElement));
      if(a.pet){
        const dy=Math.round(Math.sin(t*3+a.seed*9)*1.5),fr=hot?1+((t*8)|0)%4:0,key=fr+':'+dy;
        if(key===a.key)continue;a.key=key;
        const g=a.cv.getContext('2d');g.imageSmoothingEnabled=true;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,a.w,a.h);
        const sp=Sprites.forSp(a.pet.sp,fr,false),kk=a.k*Sprites.S/(sp.s||Sprites.S);g.translate(a.w/2,a.base+dy);g.scale(kk,kk);g.drawImage(sp.c,-sp.ox,-sp.oy);continue;
      }
      if(a.emo){
        const fm=a.forms>0?Math.floor(t/3.2)%(a.forms+1)-1:-1,sid=Sprites.emoSheet(a.c.id,fm),S=sid&&Sprites.sheets[sid];if(!S)continue;
        const ix=Math.floor(t/1.1)%S.cols,key=sid+':'+ix;if(key===a.key)continue;a.key=key;
        const g=a.cv.getContext('2d');g.imageSmoothingEnabled=true;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,a.w,a.h);g.drawImage(S.img,ix*S.fw,0,S.fw,S.fh,0,0,a.w,a.h);continue;
      }
      let form=-1;if(a.big&&a.forms>0)form=Math.floor(t/3.2)%(a.forms+1)-1;
      const po=charPose(t,a.seed,hot),dy=Math.round(po.dy),key=a.open?po.f+':'+(po.ex||'')+':'+dy+':'+form+(a.big&&po.fx?':'+((t*20)|0):''):'x';
      if(key===a.key)continue;a.key=key;
      const g=a.cv.getContext('2d');g.imageSmoothingEnabled=false;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,a.w,a.h);
      const cfg=cfgForForm(a.c,form),ck='menu:'+a.c.id+':'+form;
      if(a.big&&form>=0){const col=LINES[a.c.line||'saiyan'][form].aura;GLOW.at(g,a.w/2,a.base-60,70+Math.sin(t*9)*6,col,.55);}
      const sp=Sprites.player(ck,cfg,po.f,false,po.ex);
      g.translate(a.w/2+(po.lean||0)*2,a.base+dy);{let kp=a.k*Sprites.pk(sp);if(a.big&&sp.px)kp=Math.min(kp,(a.base-6)/sp.oy);g.scale(kp,kp);}   /* tall sheets must not be cut by the canvas top */g.imageSmoothingEnabled=!sp.px;g.drawImage(sp.c,-sp.ox,-sp.oy);
      if(!a.open){g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-atop';g.fillStyle='#0b1a2b';g.fillRect(0,0,a.w,a.h);g.globalCompositeOperation='source-over';}
      else if(a.big&&po.fx){g.setTransform(1,0,0,1,0,0);GLOW.at(g,a.w/2+44,a.base-62,30,'#ffe9a0',.9);}
    }
  }
  /* ---- glossary: enemies & bosses, unseen ones are shown as silhouettes ---- */
  screen_glossary(a){
    const tab=(a&&a.tab)||'enemies',seen=this.save.seen||{},gs=this.glossSel||(this.glossSel={});
    const defs=tab==='enemies'?ENEMIES:BOSSES,ids=Object.keys(defs).filter(k=>tab==='enemies'||defs[k].hp>0),descs=tab==='enemies'?ENEMY_DESC:BOSS_DESC;
    const got=ids.filter(k=>seen[k]).length;
    const cur=ids.includes(gs[tab])?gs[tab]:ids[0],def=defs[cur],isSeen=!!seen[cur];
    const draw=(cv,sp,vis,id)=>{
      const g=cv.getContext('2d');g.imageSmoothingEnabled=true;
      const spr=(Sprites.packPortrait&&Sprites.packPortrait(id,tab!=='enemies'))||Sprites.forSp(sp,0,false),k=Math.min((cv.width/2-4)/Math.max(spr.ox,spr.c.width-spr.ox),(cv.height-10)/spr.oy);
      g.save();g.translate(cv.width/2,cv.height-6);g.scale(k,k);g.drawImage(spr.c,-spr.ox,-spr.oy);g.restore();
      if(!vis){g.globalCompositeOperation='source-atop';g.fillStyle='#0b1a2b';g.fillRect(0,0,cv.width,cv.height);}
    };
    const cards=ids.map(id=>{
      const cv=document.createElement('canvas');cv.width=76;cv.height=76;draw(cv,defs[id].sp,!!seen[id],id);
      return h('button',{class:'char g'+(id===cur?' sel':'')+(seen[id]?'':' locked'),'data-fid':'g'+id,onclick:()=>{this.sfx();gs[tab]=id;this.rebuild(true);}},cv,h('b',null,seen[id]?this.tr(defs[id].n):'???'));
    });
    const big=document.createElement('canvas');big.width=160;big.height=160;draw(big,def.sp,isSeen,cur);
    const stages=STAGES.filter(s=>tab==='enemies'?s.roster.some(r=>r[0]===cur):stageHasBoss(s,cur)).map(s=>'S'+s.no).join(', ')||'—';
    const info=isSeen?[
      h('p',null,this.tr(descs[cur])),
      h('div',{class:'krow'},h('span',null,this.t('glossBehavior')),h('b',null,this.tr(AI_TEXT[def.ai]||AI_TEXT.chase))),
      h('div',{class:'krow'},h('span',null,this.t('glossHp')),h('b',null,fmtN(def.hp))),
      h('div',{class:'krow'},h('span',null,this.t('glossDmg')),h('b',null,def.dmg)),
      h('div',{class:'krow'},h('span',null,this.t('glossSpeed')),h('b',null,def.spd)),
      h('div',{class:'krow'},h('span',null,this.t('glossStages')),h('b',null,stages))
    ]:[h('p',null,this.t('glossHint'))];
    const tabs=['enemies','bosses'].map(k=>h('button',{class:'btn small'+(tab===k?'':' alt'),'data-fid':'gt'+k,onclick:()=>{this.sfx('uiTab');this.top.args={tab:k};this.rebuild();}},this.t(k==='enemies'?'glossEnemies':'glossBosses')));
    return h('div',null,this.header('glossary'),
      h('div',{class:'row tabs'},tabs),h('p',{class:'sub'},this.t('glossSeen',{a:got,b:ids.length})),
      h('div',{class:'split'},h('div',{class:'grid chars gl'},cards),
        h('div',{class:'detail'},h('div',{class:'row'},big),h('h3',null,isSeen?this.tr(def.n):'???'),info)));
  }
  screen_shop(){
    const d=this.save;
    const cards=SHOP.map(it=>{
      const lv=d.shop[it.id]||0,maxed=lv>=it.max,cost=maxed?0:shopCost(it,lv),can=!maxed&&(this.testAll()||d.zenny>=cost);
      return h('div',{class:'card shopi',style:'--c:'+it.c},
        SHOP_IMG[it.id]?imgGlyph(SHOP_IMG[it.id],it.c):glyph(it.k,it.c),h('div',{class:'col'},h('div',{class:'cn',style:'color:'+it.c},this.tr(it.n)),h('div',{class:'cd'},this.tr(it.d)),
          h('div',{class:'pips'},Array.from({length:it.max},(_,i)=>h('i',{class:i<lv?'on':''}))),
          it.id==='ban'&&lv>0?h('button',{class:'btn small primary banman','data-fid':'shbanm',onclick:()=>{this.sfx();this.push('bans');}},this.t('banManage',{a:d.banned.length,b:lv})):null),
        h('button',{class:'btn small'+(can?'':' alt'),disabled:maxed||!can,'data-fid':'sh'+it.id,onclick:()=>{if(this.app.progress.buy(it.id)){this.sfx('buy');this.rebuild(true);const el=this.top.el.querySelector('[data-fid="sh'+it.id+'"]');if(el&&el.parentElement)el.parentElement.classList.add('bought');}}},
          maxed?this.t('maxed'):(this.testAll()?'FREE':zAmt(cost))));
    });
    /* what is left to buy: every remaining level of every upgrade at its current price */
    const rest=SHOP.reduce((s,it)=>{let t=0;for(let l=d.shop[it.id]||0;l<it.max;l++)t+=shopCost(it,l);return s+t;},0),all=SHOP.reduce((s,it)=>{let t=0;for(let l=0;l<it.max;l++)t+=shopCost(it,l);return s+t;},0);
    return h('div',null,this.header('shopTitle'),h('p',{class:'sub'},this.t('shopDesc')),
      h('p',{class:'sub shoptot','data-fid':'shtot'},this.tr(T('Costo per comprare tutto: ','Cost to buy everything: ')),zAmt(all,true),' · ',this.tr(T('ancora da comprare: ','still to buy: ')),zAmt(rest,true)),
      h('div',{class:'grid shop'},cards),
      h('div',{class:'row'},this.btn('refund',()=>{const v=this.app.progress.refundAll();this.toast({type:'info',msg:this.t('refundDone',{n:v})});this.rebuild();},'small alt')));
  }
  /* weapon blacklist: every purchase of the shop upgrade gives one ban; banned weapons never come up as new weapons among the level-up cards */
  screen_bans(){
    const d=this.save,cap=d.shop.ban||0,ids=Object.keys(WEAPONS).filter(id=>d.wu[id]||d.banned.includes(id)||this.testAll());
    const cards=ids.map(id=>{
      const w=WEAPONS[id],on=d.banned.includes(id);
      return h('button',{class:'bancard'+(on?' on':''),style:'--c:'+w.c,'data-fid':'ban'+id,onclick:()=>{if(this.app.progress.toggleBan(id)){this.sfx(on?'uiBack':'uiStart');this.rebuild(true);}else this.sfx('uiErr');}},
        glyph(w.k,w.c),h('div',{class:'col'},h('div',{class:'cn'},this.tr(w.n)),h('div',{class:'cd'},this.t(on?'banOn':'banOff'))));
    });
    return h('div',null,this.header('banTitle'),h('p',{class:'sub'},this.t('banDesc',{a:d.banned.length,b:cap})),h('div',{class:'bangrid'},cards));
  }
}

/* idle script for menu characters: breathing + blink for everyone, a little show for the one in focus */
function charPose(t,seed,active){
  const T0=t+seed*7.3;
  if(!active){
    const ph=T0%4.6;let ex=null;
    if(ph>4.42)ex='blink';else if((T0%13.7)>13.0)ex=(Math.floor(T0/13.7)%2)?'happy':'smug';
    return{f:0,ex,dy:Math.sin(T0*2.2)*.9};
  }
  const m=T0%7.2,br=Math.sin(T0*3)*1.2;
  if(m<1.5)return{f:0,ex:null,dy:br};
  if(m<1.8)return{f:0,ex:'blink',dy:br};
  if(m<2.5)return{f:0,ex:'smug',dy:br};
  if(m<2.85)return{f:5,ex:null,dy:0,lean:-1};
  if(m<3.4)return{f:6,ex:null,dy:0,lean:1,fx:true};
  if(m<4.9)return{f:1+((m*9)|0)%4,ex:null,dy:-Math.abs(Math.sin(m*9))*1.4};
  if(m<5.9)return{f:0,ex:'happy',dy:-Math.abs(Math.sin(m*6))*3};
  if(m<6.5)return{f:0,ex:'wow',dy:0};
  return{f:0,ex:m>6.9?'blink':null,dy:br};
}
