'use strict';
/* ====== UI: DOM screens (menus, modals). Keyboard/gamepad navigable. ====== */
function h(tag,props,...kids){
  const e=document.createElement(tag);
  if(props)for(const k in props){
    const v=props[k];
    if(k==='class')e.className=v;else if(k==='html')e.innerHTML=v;else if(k==='style')e.style.cssText=v;
    else if(k.startsWith('on'))e[k]=v;else if(v!==false&&v!==null&&v!==undefined)e.setAttribute(k,v===true?'':v);
  }
  for(const c of kids.flat(3)){if(c===null||c===undefined||c===false)continue;e.append(c.nodeType?c:document.createTextNode(String(c)));}
  return e;
}
const glyph=(k,c)=>h('span',{class:'glyph',style:'--c:'+c},k);
/* zenny coin icon (replaces the plain "Z") */
function zIcon(){
  const e=document.createElement('span');e.className='zi';
  e.innerHTML='<svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#7a4e0c"/><circle cx="12" cy="12" r="9.6" fill="#f2b51c"/><circle cx="12" cy="12" r="8" fill="none" stroke="#fff1a8" stroke-width="1.1"/><path d="M7.6 7.4h8.8l-6.2 8.4h6.4" fill="none" stroke="#7a4e0c" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.6 6.2c2-2.6 4.6-3.6 7-3.5" fill="none" stroke="#fff8d0" stroke-width="1.2" stroke-linecap="round" opacity=".8"/></svg>';
  return e;
}
const zAmt=(n,raw)=>h('span',{class:'zv'},zIcon(),raw?n:fmtN(n));

class UI{
  constructor(app){
    this.app=app;this.root=document.getElementById('ui');this.toastBox=document.getElementById('toasts');
    this.stack=[];this.sel={stage:0,diff:app.save.d.diff||'normal',x2:false,char:app.save.d.lastChar||'goku'};
    this.modalEl=null;this.sbEl=document.getElementById('sandbox');
  }
  get t(){return this.app.t;}
  tr(o){return this.app.i18n.t(o);}
  get save(){return this.app.save.d;}
  sfx(n){this.app.audio.sfx(n||'click');}
  btn(key,fn,cls,raw){return h('button',{class:'btn '+(cls||''),onclick:()=>{this.sfx();fn();}},raw?key:this.t(key));}
  /* ---- screen stack ---- */
  show(name,args){this.stack=[];this.root.innerHTML='';this.push(name,args);}
  push(name,args){
    const prev=this.top;if(prev)prev.el.classList.add('hidden');
    const el=this['screen_'+name](args);el.classList.add('screen');
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
    const el=this['screen_'+t.name](t.args);el.classList.add('screen');
    t.el.replaceWith(el);t.el=el;
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
    if(inp.pressed('cancel')){const b=root.querySelector('[data-back]');if(b){this.sfx();b.click();}}
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
    if(best){best.focus({preventScroll:false});best.scrollIntoView({block:'nearest'});this.sfx('click');}
  }

  /* ================= SCREENS ================= */
  header(titleKey,backFn){
    return h('div',{class:'hdr'},
      h('button',{class:'btn small alt','data-back':true,onclick:()=>{this.sfx();(backFn||(()=>this.pop()))();}},'← '+this.t('back')),
      h('h2',null,this.t(titleKey)),
      h('div',{class:'zen'},zAmt(this.save.zenny)));
  }
  screen_main(){
    const d=this.save,s=d.settings;
    return h('div',{class:'main'},
      h('div',{class:'logo'},h('h1',null,'Dragon Ball:',h('br'),'Survivors'),h('div',{class:'balls'},[1,2,3,4,5,6,7].map(()=>h('i')))),
      h('div',{class:'menu'},
        this.btn('play',()=>{this.sel.stage=Math.min(this.sel.stage,this.maxStage());this.push('stages');},'primary'),
        this.btn('shop',()=>this.push('shop')),
        this.btn('ach',()=>this.push('ach')),
        this.btn('glossary',()=>this.push('glossary')),
        this.btn('settings',()=>this.push('settings',{tab:'general'})),
        s.sandbox?this.btn('sandbox',()=>this.push('sandboxCfg'),'alt'):null),
      h('div',{class:'foot'},
        h('span',{class:'hint'},this.app.input.mode==='pad'?('🎮 '+(this.app.input.padName||'').slice(0,40)):this.t('kbHint'))));
  }
  stageOpen(i){const q=STAGES[i].req!==undefined?STAGES[i].req:i-1;return i===0||this.save.clears[q]>0;}
  maxStage(){return this.stageOpen(this.sel.stage)?this.sel.stage:0;}
  screen_stages(){
    const d=this.save,sel=this.sel;
    if(!this.stageOpen(sel.stage))sel.stage=0;
    const x2ok=!!d.x2[sel.stage];if(!x2ok)sel.x2=false;
    const cards=STAGES.map((s,i)=>{
      const locked=!this.stageOpen(i),b=d.best[String(i)];
      return h('button',{class:'card stage'+(i===sel.stage?' sel':'')+(locked?' locked':''),'data-fid':'st'+i,disabled:locked,
        style:'--sky:'+THEMES[s.theme].sky+';--hi:'+THEMES[s.theme].hi,
        onclick:()=>{this.sfx();sel.stage=i;this.rebuild(true);}},
        h('div',{class:'stnum'},'STAGE '+s.id),h('div',{class:'cn'},this.tr(s.n)),
        h('div',{class:'cd'},this.t('duration')+': '+fmtT(s.time/(sel.x2?2:1))+(sel.x2?' (x2)':'')+' · '+this.t('bosses')+': '+s.bosses.length),
        h('div',{class:'cd'},this.t('rewardMult')+' x'+s.zenny),
        locked?h('div',{class:'cl bad'},this.t('stageLocked',{n:(s.req!==undefined?s.req:i-1)+1})):
          h('div',{class:'cl'},(d.clears[i]?'★ '+this.t('clears')+': '+d.clears[i]:this.t('notCleared'))+(b?' · '+this.t('best')+': '+b.kills+' '+this.t('kills'):'')));
    });
    const diffs=Object.keys(DIFF).map(k=>h('button',{class:'btn small'+(sel.diff===k?'':' alt'),'data-fid':'df'+k,onclick:()=>{this.sfx();sel.diff=k;d.diff=k;this.app.save.write();this.rebuild(true);}},this.tr(DIFF[k].n)));
    return h('div',null,this.header('chooseStage'),
      h('div',{class:'row'},h('span',{class:'lbl'},this.t('difficulty')),diffs,
        h('button',{class:'btn small'+(sel.x2?'':' alt'),disabled:!x2ok,'data-fid':'x2',title:x2ok?this.t('x2Desc'):this.t('x2Locked'),
          onclick:()=>{this.sfx();sel.x2=!sel.x2;this.rebuild(true);}},'x2 '+(x2ok?(sel.x2?this.t('on'):this.t('off')):'🔒'))),
      h('p',{class:'sub'},x2ok?this.t('x2Desc'):this.t('x2Locked')),
      h('div',{class:'grid stages'},cards),
      h('div',{class:'row'},this.btn('next',()=>this.push('chars'),'primary')));
  }
  screen_chars(){
    const d=this.save,sel=this.sel;
    if(!d.unlocked.includes(sel.char))sel.char='goku';
    const peekId=sel.peek&&!d.unlocked.includes(sel.peek)?sel.peek:null;
    const C=CHARS.find(c=>c.id===(peekId||sel.char));
    this.anim=[];
    const cards=CHARS.map((c,ci)=>{
      const open=d.unlocked.includes(c.id),cv=document.createElement('canvas');cv.width=78;cv.height=96;
      this.anim.push({cv,c,open,seed:hash(ci,7),key:'',w:78,h:96,base:90,k:(c.u||1.95)/Sprites.S*1.1});
      const isSel=peekId?c.id===peekId:c.id===sel.char;
      return h('button',{class:'char'+(isSel?' sel':'')+(open?'':' locked'),'data-fid':'c'+c.id,onclick:()=>{this.sfx();if(open){sel.char=c.id;sel.peek=null;}else sel.peek=c.id;this.rebuild(true);}},
        cv,h('b',null,open?this.tr(c.n):'???'));
    });
    const line=LINES[C.line||'saiyan'];
    const big=document.createElement('canvas');big.width=170;big.height=190;
    this.anim.push({cv:big,c:C,open:!peekId,seed:.3,key:'',w:170,h:190,base:178,k:(C.u||1.95)/Sprites.S*2.9,big:true,forms:peekId?0:Math.min(((d.maxForm||{})[C.id]||0),LINES[C.line||'saiyan'].length)});
    const lock=peekId?h('div',{class:'lockbox'},h('div',null,h('b',null,this.t('reqLabel')+': '),this.tr(C.lock)),
      C.price?h('button',{class:'btn small'+(d.zenny>=C.price?'':' alt'),disabled:d.zenny<C.price,'data-fid':'buychar',onclick:()=>{
        if(this.app.progress.buyChar(C.id)){this.sfx('buy');sel.char=C.id;sel.peek=null;this.toast({type:'info',msg:this.t('charBought',{c:this.tr(C.n)})});this.rebuild();}
      }},(()=>{const pt=this.t('buyChar',{n:'\u0001'}).split('\u0001');return[pt[0],zAmt(C.price),pt[1]||''];})()):null):null;
    const startBtn=h('button',{class:'btn primary',disabled:!!peekId,'data-fid':'start',onclick:()=>{this.sfx();d.lastChar=sel.char;d.lastStage=sel.stage;this.app.save.write();this.app.startGame({stage:sel.stage,char:sel.char,diff:sel.diff,x2:sel.x2,sandbox:false,pet:d.pet});}},this.t('start'));
    const detail=h('div',{class:'detail'},
      h('div',{class:'preview'},big),
      h('h3',null,this.tr(C.n)),h('p',null,this.tr(C.d)),lock,
      h('div',{class:'chips'},h('span',{class:'lbl'},this.t('startWeapons')+': '),C.start.map(id=>h('span',{class:'chip',style:'--c:'+WEAPONS[id].c},glyph(WEAPONS[id].k,WEAPONS[id].c),this.tr(WEAPONS[id].n)))),
      h('div',{class:'stats'},
        h('span',null,'HP '+C.hp),h('span',null,this.t('stSpeed')+' x'+C.spd),h('span',null,this.t('stPower')+' x'+C.might)),
      (()=>{const ab=ABIL[C.id];return ab?h('div',{class:'abbox',style:'--c:'+ab.c},h('span',{class:'lbl'},this.t('abilityLabel')),h('div',{class:'abrow'},glyph(ab.k,ab.c),h('b',null,this.tr(ab.n)),ab.cd?h('i',null,ab.cd+'s'):null),h('p',null,this.tr(ab.d))):null;})(),
      h('div',{class:'formsList'},h('span',{class:'lbl'},this.t('forms')),
        line.map((f,i)=>i<((d.maxForm||{})[C.id]||0)?h('div',{class:'frm',style:'--c:'+f.aura},h('i',null,this.t('lv')+' '+FORM_TIERS[i].lvl),this.tr(f.n)):h('div',{class:'frm',style:'--c:#6a7a90'},h('i',null,'???'),this.t('formHidden')))),
      this.petPicker(),startBtn);
    return h('div',null,this.header('chooseChar'),
      h('div',{class:'split'},h('div',{class:'grid chars'},cards),detail));
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
  animate(dt){
    this.animT=(this.animT||0)+dt;
    const t=this.animT,list=this.anim;if(!list||!list.length||!this.top||this.top.name!=='chars')return;
    for(const a of list){
      if(!a.cv.isConnected)continue;
      const par=a.cv.parentElement,hot=a.big||(par&&(par.matches(':hover')||par.classList.contains('sel')||par===document.activeElement));
      if(a.pet){
        const dy=Math.round(Math.sin(t*3+a.seed*9)*1.5),fr=hot?1+((t*8)|0)%4:0,key=fr+':'+dy;
        if(key===a.key)continue;a.key=key;
        const g=a.cv.getContext('2d');g.imageSmoothingEnabled=false;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,a.w,a.h);
        const sp=Sprites.forSp(a.pet.sp,fr,false);g.translate(a.w/2,a.base+dy);g.scale(a.k,a.k);g.drawImage(sp.c,-sp.ox,-sp.oy);continue;
      }
      let form=-1;if(a.big&&a.forms>0)form=Math.floor(t/3.2)%(a.forms+1)-1;
      const po=charPose(t,a.seed,hot),dy=Math.round(po.dy),key=a.open?po.f+':'+(po.ex||'')+':'+dy+':'+form+(a.big&&po.fx?':'+((t*20)|0):''):'x';
      if(key===a.key)continue;a.key=key;
      const g=a.cv.getContext('2d');g.imageSmoothingEnabled=false;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,a.w,a.h);
      const cfg=cfgForForm(a.c,form),ck='menu:'+a.c.id+':'+form;
      if(a.big&&form>=0){const col=LINES[a.c.line||'saiyan'][form].aura;GLOW.at(g,a.w/2,a.base-60,70+Math.sin(t*9)*6,col,.55);}
      const sp=Sprites.player(ck,cfg,po.f,false,po.ex);
      g.translate(a.w/2+(po.lean||0)*2,a.base+dy);g.scale(a.k,a.k);g.drawImage(sp.c,-sp.ox,-sp.oy);
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
    const draw=(cv,sp,vis)=>{
      const g=cv.getContext('2d');g.imageSmoothingEnabled=false;
      const spr=Sprites.forSp(sp,0,false),k=Math.min((cv.width/2-4)/Math.max(spr.ox,spr.c.width-spr.ox),(cv.height-10)/spr.oy);
      g.save();g.translate(cv.width/2,cv.height-6);g.scale(k,k);g.drawImage(spr.c,-spr.ox,-spr.oy);g.restore();
      if(!vis){g.globalCompositeOperation='source-atop';g.fillStyle='#0b1a2b';g.fillRect(0,0,cv.width,cv.height);}
    };
    const cards=ids.map(id=>{
      const cv=document.createElement('canvas');cv.width=76;cv.height=76;draw(cv,defs[id].sp,!!seen[id]);
      return h('button',{class:'char g'+(id===cur?' sel':'')+(seen[id]?'':' locked'),'data-fid':'g'+id,onclick:()=>{this.sfx();gs[tab]=id;this.rebuild(true);}},cv,h('b',null,seen[id]?this.tr(defs[id].n):'???'));
    });
    const big=document.createElement('canvas');big.width=160;big.height=160;draw(big,def.sp,isSeen);
    const stages=STAGES.filter(s=>tab==='enemies'?s.roster.some(r=>r[0]===cur):s.bosses.some(b=>b[0]===cur)).map(s=>'S'+s.id).join(', ')||'—';
    const info=isSeen?[
      h('p',null,this.tr(descs[cur])),
      h('div',{class:'krow'},h('span',null,this.t('glossBehavior')),h('b',null,this.tr(AI_TEXT[def.ai]||AI_TEXT.chase))),
      h('div',{class:'krow'},h('span',null,this.t('glossHp')),h('b',null,fmtN(def.hp))),
      h('div',{class:'krow'},h('span',null,this.t('glossDmg')),h('b',null,def.dmg)),
      h('div',{class:'krow'},h('span',null,this.t('glossSpeed')),h('b',null,def.spd)),
      h('div',{class:'krow'},h('span',null,this.t('glossStages')),h('b',null,stages))
    ]:[h('p',null,this.t('glossHint'))];
    const tabs=['enemies','bosses'].map(k=>h('button',{class:'btn small'+(tab===k?'':' alt'),'data-fid':'gt'+k,onclick:()=>{this.sfx();this.top.args={tab:k};this.rebuild();}},this.t(k==='enemies'?'glossEnemies':'glossBosses')));
    return h('div',null,this.header('glossary'),
      h('div',{class:'row tabs'},tabs),h('p',{class:'sub'},this.t('glossSeen',{a:got,b:ids.length})),
      h('div',{class:'split'},h('div',{class:'grid chars gl'},cards),
        h('div',{class:'detail'},h('div',{class:'row'},big),h('h3',null,isSeen?this.tr(def.n):'???'),info)));
  }
  screen_shop(){
    const d=this.save;
    const cards=SHOP.map(it=>{
      const lv=d.shop[it.id]||0,maxed=lv>=it.max,cost=maxed?0:shopCost(it,lv),can=!maxed&&d.zenny>=cost;
      return h('div',{class:'card shopi'},
        glyph(it.k,'#ffd23f'),h('div',{class:'col'},h('div',{class:'cn'},this.tr(it.n)),h('div',{class:'cd'},this.tr(it.d)),
          h('div',{class:'pips'},Array.from({length:it.max},(_,i)=>h('i',{class:i<lv?'on':''})))),
        h('button',{class:'btn small'+(can?'':' alt'),disabled:maxed||!can,'data-fid':'sh'+it.id,onclick:()=>{if(this.app.progress.buy(it.id)){this.sfx('buy');this.rebuild(true);const el=this.top.el.querySelector('[data-fid="sh'+it.id+'"]');if(el&&el.parentElement)el.parentElement.classList.add('bought');}}},
          maxed?this.t('maxed'):zAmt(cost)));
    });
    return h('div',null,this.header('shopTitle'),h('p',{class:'sub'},this.t('shopDesc')),h('div',{class:'grid shop'},cards),
      h('div',{class:'row'},this.btn('refund',()=>{const v=this.app.progress.refundAll();this.toast({type:'info',msg:this.t('refundDone',{n:v})});this.rebuild();},'small alt')));
  }
  screen_ach(){
    const d=this.save,done=ACHIEVEMENTS.filter(a=>d.ach[a.id]).length;
    const cards=ACHIEVEMENTS.map(a=>{
      const ok=!!d.ach[a.id];
      return h('div',{class:'card achi'+(ok?' done':'')},glyph(ok?'★':'☆',ok?'#ffd23f':'#6a7a90'),
        h('div',{class:'col'},h('div',{class:'cn'},this.tr(a.n)),h('div',{class:'cd'},this.tr(a.d)),h('div',{class:'cl'},'+',zAmt(a.reward,true),ok?' ✓':'')));
    });
    return h('div',null,this.header('achTitle'),h('p',{class:'sub'},this.t('achCount',{a:done,b:ACHIEVEMENTS.length})),h('div',{class:'grid ach'},cards));
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
