'use strict';
/* ====== UI part 2: settings, controls, modals, end screen, toasts, sandbox panel ====== */
const WS_LAB={dmg:['Danno','Damage'],n:['Colpi','Shots'],cd:['Ricarica','Cooldown'],pi:['Perfora','Pierce'],rad:['Raggio','Radius'],r:['Raggio','Radius'],wid:['Spessore','Width'],len:['Gittata','Range'],stun:['Stun','Stun']};
const _f=v=>String(Math.round(v*10)/10).replace('.',',');
function wsDelta(id,a,b){
  const st=WS[id];if(!st)return null;const it=[],en=[];
  for(const k in WS_LAB){
    if(!st[k]||st[k][a]===undefined||st[k][b]===undefined||st[k][a]===st[k][b])continue;
    const u=k==='cd'||k==='stun'?'s':'';
    const t=_f(st[k][a])+'→'+_f(st[k][b])+u;it.push(WS_LAB[k][0]+' '+t);en.push(WS_LAB[k][1]+' '+t);
    if(it.length>=3)break;
  }
  return it.length?T(it.join(' · '),en.join(' · ')):null;
}
const BUFF_NAMES={might:T('Danno','Damage'),spd:T('Velocità','Speed'),cd:T('Ricarica','Cooldown'),hp:T('Salute','Health'),regen:T('Rigenerazione','Regeneration'),magnet:T('Raccolta','Pickup')};
const WISH_NAMES={revive:T('Seconda vita','Second life'),power:T('Potere','Power'),fortune:T('Fortuna','Fortune')};
Object.assign(UI.prototype,{
  /* ---------- settings ---------- */
  screen_settings(a){
    const tab=(a&&a.tab)||'general',s=this.save.settings;
    const apply=()=>{this.app.applySettings();};
    const row=(label,ctl,desc)=>h('div',{class:'srow'},h('div',{class:'sl'},h('b',null,label),desc?h('small',null,desc):null),ctl);
    const toggle=(label,key,desc,cb)=>row(label,h('button',{class:'btn small'+(s[key]?'':' alt'),'data-fid':'t'+key,onclick:()=>{this.sfx();s[key]=!s[key];apply();if(cb)cb();this.rebuild(true);}},s[key]?this.t('on'):this.t('off')),desc);
    const slider=(label,key,min,max,step,fmt)=>{
      const out=h('span',{class:'val'},fmt(s[key]));
      const inp=h('input',{type:'range',min,max,step,value:s[key],'data-fid':'s'+key,oninput:()=>{s[key]=+inp.value;out.textContent=fmt(s[key]);apply();}});
      inp.onchange=()=>this.sfx('click');
      return row(label,h('div',{class:'sld'},inp,out));
    };
    const select=(label,key,opts)=>{
      const sel=h('select',{'data-fid':'sel'+key,onchange:()=>{s[key]=sel.value;apply();this.rebuild(true);}},opts.map(([v,l])=>h('option',{value:v,selected:s[key]===v},l)));
      return row(label,sel);
    };
    let body;
    if(tab==='general'){
      body=[select(this.t('lang'),'lang',LANGS),
        toggle(this.t('fullscreen'),'fullscreen'),
        toggle(this.t('showFps'),'fps'),toggle(this.t('shake'),'shake'),toggle(this.t('dmgNums'),'dmgNum'),
        toggle(this.t('sandboxOpt'),'sandbox',this.t('sandboxOptDesc')),
        row(this.t('resetSave'),h('button',{class:'btn small bad','data-fid':'reset',onclick:()=>{
          if(this.resetArm){this.app.save.reset();this.app.applySettings();this.resetArm=false;this.toast({type:'info',msg:this.t('resetDone')});this.show('main');}
          else{this.resetArm=true;this.toast({type:'info',msg:this.t('resetConfirm')});setTimeout(()=>{this.resetArm=false;},4000);}
        }},this.t('reset')))];
    }else if(tab==='audio'){
      const pc=v=>Math.round(v*100)+'%';
      body=[slider(this.t('master'),'master',0,1,.05,pc),slider(this.t('music'),'music',0,1,.05,pc),slider(this.t('sfxVol'),'sfx',0,1,.05,pc)];
    }else if(tab==='video'){
      body=[select(this.t('resolution'),'res',[['native',this.t('resNative')],['720','1280×720 (HD)'],['1080','1920×1080 (Full HD)']]),
        s.res==='native'?slider(this.t('renderScale'),'scale',.5,2,.25,v=>Math.round(v*100)+'%'):null,
        toggle(this.t('fullscreen'),'fullscreen'),toggle(this.t('showFps'),'fps')];
    }else body=this.controlsPanel();
    const tabs=['general','audio','video','controls'].map(k=>h('button',{class:'btn small'+(tab===k?'':' alt'),'data-fid':'tab'+k,onclick:()=>{this.sfx();this.top.args={tab:k};this.rebuild();}},this.t('tab_'+k)));
    return h('div',null,this.header('settings'),h('div',{class:'row tabs'},tabs),h('div',{class:'settings'},body));
  },
  controlsPanel(){
    const inp=this.app.input,B=inp.binds;
    const rows=ACTIONS.map(a=>{
      const slot=(dev,i)=>{
        const v=(B[dev][a]||[])[i];
        const b=h('button',{class:'btn small alt bind','data-fid':'b'+dev+a+i,onclick:()=>{
          this.sfx();
          if(dev==='pad'&&!inp.getPad()){this.toast({type:'info',msg:this.t('noPad')});return;}
          b.textContent=this.t(dev==='kb'?'pressKey':'pressBtn');b.classList.add('wait');
          inp.startRebind(a,dev,i,()=>this.rebuild(true));
        }},dev==='kb'?Input.keyLabel(v):Input.padLabel(v));
        return b;
      };
      return h('div',{class:'crow'},h('span',{class:'an'},this.t('act_'+a)),slot('kb',0),slot('kb',1),slot('pad',0),slot('pad',1));
    });
    return[h('p',{class:'sub'},inp.padName?('🎮 '+this.t('padConnected')+': '+inp.padName.slice(0,50)):this.t('noPad')),
      h('div',{class:'crow head'},h('span'),h('span',{class:'ch',style:'grid-column:2 / span 2'},this.t('keyboard')),h('span',{class:'ch',style:'grid-column:4 / span 2'},this.t('gamepad'))),
      rows,h('p',{class:'sub'},this.t('rebindHint')),
      h('div',{class:'row'},h('button',{class:'btn small alt','data-fid':'rstb',onclick:()=>{this.sfx();inp.resetBinds();this.rebuild();}},this.t('resetControls')))];
  },
  /* ---------- pause ---------- */
  screen_pause(){
    const g=this.app.game,S=g.S,p=g.p,t=k=>this.t(k);
    const none=()=>h('div',{class:'cd'},t('none'));
    const sec=(key,kids)=>h('div',{class:'psec'},h('h3',null,t(key)),kids&&kids.length?kids:none());
    const pips=(n,max,gold)=>h('div',{class:'pips'},Array.from({length:max},(_,i)=>h('i',{class:i<n?'on':''})));
    const weapons=[...g.weapons.values()].map(w=>h('div',{class:'prow'},glyph(w.def.k,w.color),
      h('div',{class:'col'},h('div',{class:'cn'},(w.evo?'★'.repeat(w.evo)+' ':'')+this.tr(w.evo?w.evoName:w.def.n)),pips(w.lv,WMAX),
        h('div',{class:'cd'},this.tr(w.def.d)+(w.evo?' · '+this.tr(w.evo>=2?w.def.evo2D:w.def.evoD):'')))));
    const kr=(k,v)=>h('div',{class:'krow'},h('span',null,t(k)),h('b',null,v));
    const stats=[kr('stHp',Math.round(p.hp)+' / '+p.maxHp),kr('stPower','x'+S.might.toFixed(2)),kr('stSpeed','x'+S.spd.toFixed(2)),kr('stCooldown','x'+S.cd.toFixed(2)),
      kr('stArmor',S.armor.toFixed(1)),kr('stRegen',S.regen.toFixed(1)+'/s'),kr('stCrit',Math.round(S.crit*100)+'% (x'+S.critDmg+')'),kr('stDodge',Math.round(S.dodge*100)+'%'),
      kr('stArea','x'+S.area.toFixed(2)),kr('stLuck',Math.round(S.luck*100)+'%'),kr('stXp','x'+S.xp.toFixed(2)),kr('stGold','x'+(S.gold*(g.x2?2:1)).toFixed(2)),kr('stMagnet',Math.round(S.magnet))];
    const fe=g.formEntry;
    const ups=[kr('passSlots',g.passCount()+' / '+MAX_PASSIVES),kr('formLabel',fe?this.tr(fe.n):t('baseForm')+' ('+g.formsUnlocked+'/'+g.formMax+')'),
      ...Object.keys(g.pass).filter(id=>g.pass[id]>0).map(id=>h('div',{class:'prow'},glyph(PASS[id].k,PASS[id].c),h('div',{class:'col'},h('div',{class:'cn'},this.tr(PASS[id].n)),pips(g.pass[id],5),h('div',{class:'cd'},this.tr(PASS[id].d))))),
      ...g.tempBuffs.map(b=>kr('tempBuffs',this.tr(BUFF_NAMES[b.k])+' ('+Math.ceil(b.t)+'s)')),
      g.luckBonus>0?kr('stLuck','+'+Math.round(g.luckBonus*100)+'%'):null];
    const trins=g.trinkets.map(id=>{const tr=TRINKETS.find(x=>x.id===id);return h('div',{class:'prow'},glyph(tr.k,RARITY[tr.r].c),h('div',{class:'col'},h('div',{class:'cn',style:'color:'+RARITY[tr.r].c},this.tr(tr.n)+' · '+this.tr(RARITY[tr.r].n)),h('div',{class:'cd'},this.tr(tr.d))));});
    const wishes=[kr('balls',g.balls+' / 7'),...g.wishLog.map(w=>kr('wishLabel',this.tr(WISH_NAMES[w])))];
    return h('div',{class:'pausescr'},h('h2',null,this.t('pause')),
      h('div',{class:'row'},
        h('button',{class:'btn primary','data-focus':true,'data-back':true,onclick:()=>{this.sfx();this.app.resume();}},this.t('resume')),
        this.btn('glossary',()=>this.push('glossary'),'alt'),
        this.btn('settings',()=>this.push('settings',{tab:'general'}),'alt'),
        this.btn('quitMenu',()=>this.app.endRunManually(),'alt')),
      h('div',{class:'pgrid'},sec('pauseWeapons',weapons),sec('pauseStats',stats),sec('pauseUpgrades',ups.filter(Boolean)),sec('pauseTrinkets',trins),sec('pauseWishes',wishes)));
  },
  /* ---------- sandbox config ---------- */
  screen_sandboxCfg(){
    const sel=this.sel;
    const stage=h('select',{'data-fid':'sbs',onchange:()=>{sel.stage=+stage.value;}},STAGES.map((s,i)=>h('option',{value:i,selected:sel.stage===i},'S'+s.id+' '+this.tr(s.n))));
    const ch=h('select',{'data-fid':'sbc',onchange:()=>{sel.char=ch.value;}},CHARS.map(c=>h('option',{value:c.id,selected:sel.char===c.id},this.tr(c.n))));
    const df=h('select',{'data-fid':'sbd',onchange:()=>{sel.diff=df.value;}},Object.keys(DIFF).map(k=>h('option',{value:k,selected:sel.diff===k},this.tr(DIFF[k].n))));
    return h('div',null,this.header('sandbox'),h('p',{class:'sub'},this.t('sbDesc')),
      h('div',{class:'settings'},h('div',{class:'srow'},h('b',null,this.t('chooseStage')),stage),h('div',{class:'srow'},h('b',null,this.t('chooseChar')),ch),h('div',{class:'srow'},h('b',null,this.t('difficulty')),df)),
      h('div',{class:'row'},this.btn('start',()=>{this.app.startGame({stage:sel.stage,char:sel.char,diff:sel.diff,x2:false,sandbox:true});},'primary')));
  },
  /* ---------- modals (level up / chest / wish) ---------- */
  describe(o){
    if(o.type==='w'){const w=WEAPONS[o.id];return{k:w.k,c:w.c,n:w.n,tag:o.lv?this.t('weaponLv',{n:o.lv+1}):this.t('newWeapon'),d:(((this.app.game&&this.app.game.weapons.get(o.id))||{}).evo?T('+5% danno · −1,5% ricarica · +2% area','+5% damage · −1.5% cooldown · +2% area'):o.lv&&wsDelta(o.id,o.lv-1,o.lv))||w.d};}
    if(o.type==='p'){const p=PASS[o.id],g=this.app.game,used=g?g.passCount():0;return{k:p.k,c:p.c,n:p.n,tag:(o.lv?this.t('passLv',{n:o.lv+1}):this.t('newPass'))+' · '+this.t('passSlots',{a:o.lv?used:used+1,b:MAX_PASSIVES}),d:p.d};}
    if(o.type==='z')return{k:'金',c:'#ffd23f',n:T('Zenny','Zeni'),tag:this.t('treasure'),d:T('+'+o.v+' zenny','+'+o.v+' zenny')};
    return{k:'豆',c:'#8be07a',n:T('Senzu','Senzu'),tag:this.t('heal'),d:T('Recuperi il 40% della salute.','Recover 40% HP.')};
  },
  describeReward(r){
    if(r.k==='evo'){const w=WEAPONS[r.id],wp=this.app.game&&this.app.game.weapons.get(r.id),sec=wp&&wp.evo>=1;return{k:w.k,c:'#ffd23f',n:sec?w.evo2:w.evo,tag:'★ '+this.t(sec?'evolution2':'evolution'),d:sec?w.evo2D:w.evoD,evo:true};}
    if(r.k==='up')return this.describe(r.o);
    if(r.k==='pick')return{k:'袋',c:'#ffd23f',n:T(this.t('pickTitle'),this.t('pickTitle')),tag:this.t('pickTag'),d:T(this.t('pickOf',{n:r.opts.length}),this.t('pickOf',{n:r.opts.length}))};
    if(r.k==='trinket'){const t=TRINKETS.find(x=>x.id===r.id);return{k:t.k,c:RARITY[t.r].c,n:t.n,tag:this.tr(RARITY[t.r].n),d:t.d};}
    return this.describe({type:'z',v:r.v});
  },
  card(info,i,onclick,extra){
    return h('button',{class:'card opt'+(info.evo?' evo':'')+(extra||''),style:'--d:'+(i*.3)+'s','data-fid':'o'+i,onclick},
      glyph(info.k,info.c),h('div',{class:'col'},h('div',{class:'cn'},this.tr(info.n)),h('div',{class:'cl',style:'color:'+info.c},info.tag),h('div',{class:'cd'},this.tr(info.d))),
      i<3&&onclick?h('span',{class:'key'},i+1):null);
  },
  openModal(m,g){
    this.closeModal();
    let el;
    if(m.type==='level'){
      el=h('div',{class:'screen modal'},h('h2',null,this.t('levelUpTitle',{n:g.lvl})),
        h('div',{class:'cards'},m.options.map((o,i)=>this.card(this.describe(o),i,()=>{this.sfx('lvl');this.app.resolveModal(i);}))));
    }else if(m.type==='chest'){
      el=h('div',{class:'screen modal'},h('h2',null,this.t('chestTitle')),
        h('div',{class:'cards'},m.rewards.map((r,i)=>this.card(this.describeReward(r),i,null,' reveal'))),
        h('div',{class:'row'},h('button',{class:'btn primary','data-focus':true,style:'animation-delay:1.4s',onclick:()=>{this.sfx('chest');this.app.resolveModal(0);}},this.t('collect'))));
    }else if(m.type==='pick'){
      const cs=m.opts.map((id,i)=>{const c=this.card(this.describeReward({k:'trinket',id}),i,()=>{this.sfx('chest');this.app.resolveModal(i);},m.opts.length>6?' tiny':'');c.style.setProperty('--d',(i*.07)+'s');return c;});
      el=h('div',{class:'screen modal'},h('h2',null,this.t('pickTitle')),h('p',{class:'sub'},this.t('pickSub',{n:m.opts.length})),h('div',{class:'cards many'},cs));
    }else if(m.type==='totem'){
      const W=(m.opts||['luck','risk']).map(id=>TOTEMS.find(t=>t.id===id)).filter(Boolean);
      el=h('div',{class:'screen modal wish'},h('h2',null,this.t('totemTitle')),h('p',{class:'sub'},this.t('totemSub')),
        h('div',{class:'cards'},W.map((w,i)=>{
          const lk=w.id==='luck'||w.id==='risk';
          return this.card({k:w.k,c:w.c,n:lk?T(this.t(w.id==='luck'?'totemLuckN':'totemRiskN'),this.t(w.id==='luck'?'totemLuckN':'totemRiskN')):w.n,tag:'🗿',d:lk?T(this.t(w.id==='luck'?'totemLuckD':'totemRiskD'),this.t(w.id==='luck'?'totemLuckD':'totemRiskD')):w.d},i,()=>{this.sfx('shrine');this.app.resolveModal(i);});
        })));
    }else if(m.type==='trial'){
      const NAMES={might:T('Danno','Damage'),spd:T('Velocità','Speed'),cd:T('Ricarica','Cooldown'),hp:T('Salute','Health')},STEP={might:.10,spd:.10,cd:.08,hp:.12};
      const cards=m.offers.map((o,i)=>{
        if(o.sold)return null;   /* bought / free upgrades disappear */
        let info;
        if(o.kind==='form'){const e=LINES[g.C.line||'saiyan'][g.formsUnlocked];info={k:'変',c:e.aura,n:e.n,tag:this.t('trialForm'),d:T('Sblocchi subito la prossima trasformazione.','Unlock the next transformation right away.')};}
        else if(o.kind==='weapon'){const w=WEAPONS[o.wid];info={k:w.k,c:w.c,n:w.n,tag:this.t('trialWeapon'),d:T('+1 livello a quest\'arma.','+1 level for this weapon.')};}
        else{const p=Math.round(STEP[o.a]*100),q=Math.round(STEP[o.b]*135);info={k:'力',c:'#c9a0ff',n:T('Scambio statistica','Stat swap'),tag:this.t('trialSwap'),d:T('-'+p+'% '+NAMES[o.a].it+'  →  +'+q+'% '+NAMES[o.b].it,'-'+p+'% '+NAMES[o.a].en+'  →  +'+q+'% '+NAMES[o.b].en)};}
        const ok=!o.sold&&(m.freePick||g.run.coins>=o.price);
        const el=this.card(Object.assign({},info,{tag:o.sold?this.t('trialSold'):((m.freePick?this.t('trialFree'):'Z '+o.price)+' · '+info.tag)}),i,()=>{if(g.buyOffer(i)){this.sfx('buy');if(m.offers.every(x=>x.sold)){this.app.resolveModal(0);}else this.openModal(g.modal,g);}else this.sfx('hit');});
        el.disabled=!ok;if(!ok)el.classList.add('locked');
        return el;
      }).filter(Boolean);
      el=h('div',{class:'screen modal'},h('h2',null,this.t('trialShopTitle')),h('p',{class:'sub'},m.freePick?this.t('trialFreeDesc'):this.t('trialShopDesc',{n:Math.floor(g.run.coins)})),
        h('div',{class:'cards trialcards'},cards),
        h('div',{class:'row'},h('button',{class:'btn primary','data-focus':true,'data-back':true,onclick:()=>{this.sfx();this.app.resolveModal(0);}},this.t('trialLeave'))));
    }else{
      const W=[{k:'復',c:'#8be07a',n:T('Seconda vita','Second life'),d:T('Ottieni una resurrezione.','Gain a revive.')},
        {k:'力',c:'#ffd23f',n:T('Potere','Power'),d:T('Tutte le armi guadagnano un livello.','All weapons gain a level.')},
        {k:'金',c:'#ffb13b',n:T('Fortuna','Fortune'),d:T('Zenny e un cimelio casuale.','Zenny and a random trinket.')}];
      el=h('div',{class:'screen modal wish'},h('h2',null,this.t('wishTitle')),h('p',{class:'sub'},this.t('wishDesc')),
        h('div',{class:'cards'},W.map((w,i)=>this.card({k:w.k,c:w.c,n:w.n,tag:'🐉',d:w.d},i,()=>{this.sfx('ball');this.app.resolveModal(i);}))));
    }
    this.modalEl=el;this.root.append(el);
    const f=this.focusables(el)[0];if(f)setTimeout(()=>f.focus({preventScroll:true}),30);
    if(this.top)this.top.el.classList.add('hidden');
  },
  closeModal(){if(this.modalEl){this.modalEl.remove();this.modalEl=null;}},
  /* ---------- end of run ---------- */
  screen_end(res){
    const g=this.app.game,labels={coins:'rw_coins',kills:'rw_kills',time:'rw_time',bosses:'rw_bosses',clear:'rw_clear'};
    const st=(k,v)=>[h('span',null,this.t(k)),h('b',null,v)];
    const unlocked=(res.unlocked||[]).map(id=>CHARS.find(c=>c.id===id)),ach=(res.ach||[]).map(id=>ACHIEVEMENTS.find(a=>a.id===id));
    return h('div',{class:'center end'},h('h2',{class:res.win?'win':'lose'},res.win?this.t('stageClear'):this.t('defeat')),
      h('div',{class:'sumgrid'},st('time',fmtT(res.t)),st('kills',res.kills),st('level',res.lvl),st('bossKills',res.bossKills)),
      res.sandbox?h('p',{class:'sub'},this.t('sbNoReward')):
      h('div',{class:'rewards'},h('h3',null,this.t('rewards')),
        res.lines.map(l=>h('div',{class:'rline'},h('span',null,this.t(labels[l.k])),h('b',null,zAmt(l.v,true)))),
        h('div',{class:'rline'},h('span',null,this.t('multiplier')),h('b',null,'x'+res.mult.toFixed(2)+(res.x2?' (x2)':''))),
        h('div',{class:'rline total'},h('span',null,this.t('total')),h('b',null,zAmt(res.total,true)))),
      unlocked.length?h('p',{class:'good'},'🔓 '+this.t('charUnlocked')+': '+unlocked.map(c=>this.tr(c.n)).join(', ')):null,
      res.win&&!res.sandbox&&!this.save.clears.slice(0,5).every(c=>c>0)?h('p',{class:'sub'},this.t('endlessHint')):null,
      ach.length?h('p',{class:'good'},'★ '+this.t('achUnlocked')+': '+ach.map(a=>this.tr(a.n)).join(', ')):null,
      h('div',{class:'row'},
        res.win&&!res.sandbox&&!g.continued&&this.save.clears.slice(0,5).every(c=>c>0)?h('button',{class:'btn primary','data-focus':true,onclick:()=>{this.sfx();this.app.continueRun();}},this.t('continue')):null,
        h('button',{class:'btn'+(res.win?' alt':' primary'),'data-focus':!res.win||g.continued||res.sandbox?true:null,onclick:()=>{this.sfx();this.app.retry();}},this.t('retry')),
        h('button',{class:'btn alt','data-back':true,onclick:()=>{this.sfx();this.app.toMenu();}},this.t('toMenu'))));
  },
  /* ---------- toasts ---------- */
  toast(n){
    let title='',body='',cls='info';
    if(n.type==='ach'){title=this.t('achUnlocked');body=this.tr(n.a.n)+'  +Z '+n.a.reward;cls='ach';this.sfx('ach');}
    else if(n.type==='unlock'){title=this.t('charUnlocked');body=this.tr(n.c.n);cls='unlock';this.sfx('ach');}
    else if(n.type==='weapon'){const w=WEAPONS[n.id];title=this.t(n.evo2?'evo2Unlocked':'weaponUnlocked');body=this.tr(n.evo2?w.evo2:w.n);cls='ach';this.sfx('ach');}
    else if(n.type==='x2'){title=this.t('x2Unlocked');body=this.t('x2UnlockedBody',{n:n.stage+1});cls='ach';this.sfx('ach');}
    else{body=n.msg;}
    const el=h('div',{class:'toast '+cls},title?h('b',null,title):null,h('span',null,body));
    this.toastBox.append(el);setTimeout(()=>el.classList.add('out'),4200);setTimeout(()=>el.remove(),4800);
  },
  /* ---------- sandbox panel (in game) ---------- */
  toggleSandbox(g){
    if(!g||!g.sandbox)return;
    if(this.sbEl.classList.contains('hidden')){this.buildSandbox(g);this.sbEl.classList.remove('hidden');}
    else this.sbEl.classList.add('hidden');
  },
  hideSandbox(){this.sbEl.classList.add('hidden');},
  buildSandbox(g){
    const sel=(opts,val)=>h('select',null,opts.map(([v,l])=>h('option',{value:v,selected:v===val},l)));
    const b=(label,fn)=>h('button',{class:'btn tiny',onclick:()=>{fn();this.sfx('click');}},label);
    const row=(label,...els)=>h('div',{class:'sbrow'},h('span',null,label),els);
    const p=g.p;
    const wsel=sel(Object.keys(WEAPONS).map(id=>[id,this.tr(WEAPONS[id].n)]));
    const tsel=sel(TRINKETS.map(t=>[t.id,'['+this.tr(RARITY[t.r].n)[0]+'] '+this.tr(t.n)]));
    const esel=sel(Object.keys(ENEMIES).map(id=>[id,this.tr(ENEMIES[id].n)]));
    const bsel=sel(Object.keys(BOSSES).filter(id=>BOSSES[id].hp>0).map(id=>[id,this.tr(BOSSES[id].n)]));
    const lsel=sel(['coin','heal','magnet','dmg','haste','xp','capsule','ball'].map(k=>[k,k]));
    const fsel=sel(['shrine','spring','altar','font','cache'].map(k=>[k,k]));
    const frm=sel([[-1,this.t('baseForm')],...LINES[g.C.line||'saiyan'].map((f,i)=>[i,(i+1)+'. '+this.tr(f.n)])],g.formIdx);
    const spd=sel([[0,'0x'],[.5,'0.5x'],[1,'1x'],[2,'2x'],[4,'4x']],g.timeScale);
    const close=h('button',{class:'btn tiny alt',onclick:()=>this.hideSandbox()},'✕');
    this.sbEl.innerHTML='';
    this.sbEl.append(h('div',{class:'sbhead'},h('b',null,'SANDBOX'),close),
      row(this.t('sbLevel'),b('+1',()=>g.setLevel(g.lvl+1)),b('+5',()=>g.setLevel(g.lvl+5)),b('+10',()=>g.setLevel(g.lvl+10)),b('+50',()=>g.setLevel(g.lvl+50))),
      row(this.t('sbForm'),frm,b('OK',()=>{const i=+frm.value;if(i<=g.formIdx)return;g.formsUnlocked=Math.max(g.formsUnlocked,i+1);g.formIdx=i;g.recalc();})),
      row(this.t('sbWeapon'),wsel,b('+',()=>{const id=wsel.value,had=g.weapons.has(id),w=g.addWeapon(id);if(had)w.upgrade();g.recalc();}),b('max',()=>{const w=g.addWeapon(wsel.value);w.lv=WMAX;}),b('★',()=>{const w=g.addWeapon(wsel.value);w.lv=WMAX;g.evolveWeapon(wsel.value);})),
      row(this.t('sbTrinket'),tsel,b('+',()=>g.addTrinket(tsel.value)),b('rnd',()=>{const id=g.rollTrinket();if(id)g.addTrinket(id);})),
      row(this.t('sbEnemy'),esel,b('x1',()=>g.spawnEnemyById(esel.value,1)),b('x10',()=>g.spawnEnemyById(esel.value,10)),b('x50',()=>g.spawnEnemyById(esel.value,50))),
      row(this.t('sbBoss'),bsel,b('go',()=>g.spawnBoss(bsel.value,false)),b(this.t('sbKillAll'),()=>{for(const e of g.en)if(!e.boss&&!e.dead)g.damageEnemy(e,1e12);})),
      row(this.t('sbTime'),b('+1m',()=>g.jumpTo(g.t+60)),b('+5m',()=>g.jumpTo(g.t+300)),b(this.t('sbNextBoss'),()=>{const n=g.bossQ.find(x=>!x.done);if(n)g.jumpTo(n.t);}),spd,b('OK',()=>{g.timeScale=+spd.value;})),
      row(this.t('sbLoot'),lsel,b('go',()=>g.spawnLoot(lsel.value,p.x+40,p.y)),fsel,b('go',()=>{g.feat.push({kind:fsel.value,x:p.x+120,y:p.y,t:0,ttl:100,used:false,dead:false});})),
      row(this.t('sbChest'),b(this.t('sbNormal'),()=>g.spawnChestHere(false)),b(this.t('sbFinal'),()=>g.spawnChestHere(true)),b(this.t('sbWish'),()=>{g.balls=6;g.spawnLoot('ball',p.x+30,p.y);}),b(this.t('sbTrial'),()=>g.startTrial())),
      row(this.t('sbPlayer'),b(this.t('sbHeal'),()=>g.heal(g.p.maxHp)),b('-50%',()=>{g.p.hp=Math.max(1,g.p.hp*.5);}),b(g.sb.god?'God ✓':'God',()=>{g.sb.god=!g.sb.god;this.buildSandbox(g);}),b(g.sb.nospawn?'NoSpawn ✓':'NoSpawn',()=>{g.sb.nospawn=!g.sb.nospawn;this.buildSandbox(g);}),
        b('+XP',()=>{g.addXp(g.need);})));
  }
});
