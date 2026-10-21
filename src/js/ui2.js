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
/* same data as wsDelta, but as a list of {icon, text} so each change gets its own icon */
function wsFx(id,a,b){
  const st=WS[id];if(!st)return null;const out=[];
  for(const k in WS_LAB){
    if(!st[k]||st[k][a]===undefined||st[k][b]===undefined||st[k][a]===st[k][b])continue;
    const u=k==='cd'||k==='stun'?'s':'',t=_f(st[k][a])+'→'+_f(st[k][b])+u;
    out.push({i:WS_ICON[k]||'star',t:T(WS_LAB[k][0]+' '+t,WS_LAB[k][1]+' '+t)});
    if(out.length>=3)break;
  }
  return out.length?out:null;
}
const BUFF_NAMES={might:T('Danno','Damage'),spd:T('Velocità','Speed'),cd:T('Ricarica','Cooldown'),hp:T('Salute','Health'),regen:T('Rigenerazione','Regeneration'),magnet:T('Raccolta','Pickup')};
const WISH_NAMES={revive:T('Seconda vita','Second life'),power:T('Potere','Power'),fortune:T('Fortuna','Fortune'),tickets:T('10 Ticket','10 Tickets')};
Object.assign(UI.prototype,{
  /* ---------- settings ---------- */
  screen_settings(a){
    const tab=(a&&a.tab)||'general',s=this.save.settings;
    const apply=()=>{this.app.applySettings();};
    const row=(label,ctl,desc)=>h('div',{class:'srow'},h('div',{class:'sl'},h('b',null,label),desc?h('small',null,desc):null),ctl);
    const toggle=(label,key,desc,cb)=>row(label,h('button',{class:'btn small'+(s[key]?'':' alt'),'data-fid':'t'+key,onclick:()=>{this.sfx();s[key]=!s[key];apply();if(cb)cb();this.rebuild(true);}},s[key]?this.t('on'):this.t('off')),desc);
    const slider=(label,key,min,max,step,fmt,desc)=>{
      const out=h('span',{class:'val'},fmt(s[key]));
      const inp=h('input',{type:'range',min,max,step,value:s[key],'data-fid':'s'+key,oninput:()=>{s[key]=+inp.value;out.textContent=fmt(s[key]);apply();}});
      inp.onchange=()=>this.sfx('click');
      return row(label,h('div',{class:'sld'},inp,out),desc);
    };
    const select=(label,key,opts)=>{
      const sel=h('select',{'data-fid':'sel'+key,onchange:()=>{s[key]=sel.value;apply();this.rebuild(true);}},opts.map(([v,l])=>h('option',{value:v,selected:s[key]===v},l)));
      return row(label,sel);
    };
    let body;
    if(tab==='general'){
      body=[select(this.t('lang'),'lang',LANGS),
        toggle(this.t('fullscreen'),'fullscreen'),
        toggle(this.t('showFps'),'fps'),
        toggle(this.t('streamerMode'),'streamer',this.t('streamerDesc')),
        row(this.t('sandboxOpt'),h('button',{class:'btn small'+(s.sandbox?'':' alt'),'data-fid':'tsandbox',onclick:()=>{
          if(!this.sbArm){this.sbArm=true;this.toast({type:'info',msg:this.t(s.sandbox?'sbWarnOff':'sbWarnOn')});setTimeout(()=>{if(this.sbArm){this.sbArm=false;if(this.top&&this.top.name==='settings')this.rebuild(true);}},6000);this.sfx();this.rebuild(true);return;}
          this.sbArm=false;this.sfx();
          if(s.sandbox){s.sandbox=false;const n=this.app.progress.revertTest();apply();if(!this.stageOpen(this.save.lastStage))this.save.lastStage=5;if(!this.charOpen(this.save.lastChar))this.save.lastChar='goku';this.toast({type:'info',msg:this.t('sbReverted',{n})});}
          else{s.sandbox=true;apply();}
          this.rebuild(true);}},this.sbArm?'\u26A0 '+this.t('act_confirm'):(s.sandbox?this.t('on'):this.t('off'))),
          this.sbArm?this.t(s.sandbox?'sbWarnOff':'sbWarnOn'):this.t('sandboxOptDesc')),
        row(this.t('resetSave'),h('button',{class:'btn small bad','data-fid':'reset',onclick:()=>{
          if(this.resetArm){this.app.save.reset();this.app.applySettings();this.resetArm=false;this.toast({type:'info',msg:this.t('resetDone')});this.show('main');}
          else{this.resetArm=true;this.toast({type:'info',msg:this.t('resetConfirm')});setTimeout(()=>{this.resetArm=false;},4000);}
        }},this.t('reset')))];
    }else if(tab==='gameplay'){
      body=[toggle(this.t('shake'),'shake'),toggle(this.t('dmgNums'),'dmgNum'),
        toggle(this.t('trinRefuse'),'trinRefuse',this.t('trinRefuseD')),
        row(this.t('lvAuto'),h('button',{class:'btn small','data-fid':'prioOpen',onclick:()=>{this.sfx('uiTab');this.push('priority');}},this.t('prioBtn')+' ›'),this.t('prioRowD')),
        row(this.t('teleTitle'),h('button',{class:'btn small','data-fid':'teleOpen',onclick:()=>{this.sfx('uiTab');this.push('telemetry');}},this.t('teleExp')+' ›'),this.t('teleRowD')),
        toggle(this.tr(T('Scelta automatica a potenziamenti al massimo','Auto-choose when everything is maxed')),'zAuto',this.tr(T('Quando ogni arma e potenziamento è al massimo, il sacco di zenny più grande viene scelto da solo a ogni livello.','When every weapon and upgrade is maxed, the biggest bag of zenny is picked by itself on every level-up.'))),
        toggle(this.tr(T('Apertura automatica ticket','Auto-open tickets')),'tkAuto',this.tr(T('Dopo aver aperto un ticket 1× o 10×, apre da solo il successivo, uno alla volta. Puoi fermarlo in qualsiasi momento.','After opening a 1× or 10× ticket, the next one opens by itself, one at a time. You can stop it at any moment.')))];
    }else if(tab==='audio'){
      const pc=v=>Math.round(v*100)+'%';
      body=[slider(this.t('master'),'master',0,1,.05,pc),slider(this.t('music'),'music',0,1,.05,pc),slider(this.t('sfxVol'),'sfx',0,1,.05,pc)];
    }else if(tab==='video'){
      body=[select(this.t('resolution'),'res',[['native',this.t('resNative')],['720','1280×720 (HD)'],['1080','1920×1080 (Full HD)']]),
        s.res==='native'?slider(this.t('renderScale'),'scale',.5,2,.25,v=>Math.round(v*100)+'%'):null,
        toggle(this.t('fullscreen'),'fullscreen'),toggle(this.t('showFps'),'fps'),
        toggle(this.t('reduceFx'),'reduceFx',this.t('reduceFxDesc')),
        slider(this.t('fxOpacity'),'fxAlpha',0,100,5,v=>Math.round(v)+'%',this.t('fxOpacityDesc'))];
    }else if(tab==='world'){
      const dn=v=>this.t('dayWord')+' '+Math.round(v)+'% · '+this.t('nightWord')+' '+(100-Math.round(v))+'%';
      body=[toggle(this.t('ambientFx'),'ambient',this.t('ambientFxDesc')),
        toggle(this.t('weatherFx'),'weather',this.t('weatherFxDesc')),
        toggle(this.t('dayNight'),'dayNight',this.t('dayNightDesc')),
        s.dayNight?slider(this.t('dnShare'),'dnDay',0,100,5,dn):null,
        s.dayNight?select(this.t('dnLen'),'dnLen',[['180','3 min'],['300','5 min'],['480','8 min']]):null,
        s.dayNight?h('p',{class:'sub'},this.t('dnShareDesc')):null];
    }else body=this.controlsPanel();
    const tabs=['general','gameplay','audio','video','world','controls'].map(k=>h('button',{class:'btn small'+(tab===k?'':' alt'),'data-fid':'tab'+k,onclick:()=>{this.sfx('uiTab');this.top.args={tab:k};this.rebuild();}},this.t('tab_'+k)));
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
  /* ---------- automatic level-up: Settings > Gameplay > "Priorities" opens its own menu with the on/off switch and the priority list ---------- */
  /* the weapons and upgrades of the run (up to 10: 5 weapons + 5 upgrades); the top one is taken first when it shows up among the cards. ▲ ▼ move a row */
  prioRows(g,after){
    const list=g.enPrio(),def=k=>k[0]==='w'?WEAPONS[k.slice(2)]:PASS[k.slice(2)];
    const mv=(i,d)=>{const l=list.slice(),j=i+d;if(j<0||j>=l.length)return;[l[i],l[j]]=[l[j],l[i]];g.setPrio(l);this.sfx();after();};
    return list.map((k,i)=>h('div',{class:'prow endprio'},h('b',{class:'epn'},i+1),glyph(def(k).k,def(k).c),h('div',{class:'col'},h('div',{class:'cn'},this.tr(def(k).n))),
      h('button',{class:'btn small alt epb','data-fid':'epu'+i,title:this.t('endUp'),disabled:i===0,onclick:()=>mv(i,-1)},'▲'),
      h('button',{class:'btn small alt epb','data-fid':'epd'+i,title:this.t('endDown'),disabled:i===list.length-1,onclick:()=>mv(i,1)},'▼')));
  },
  screen_priority(){
    const g=this.app.game,st=this.save.settings,rb=()=>this.rebuild(true),on=this.t(st.lvAuto?'on':'off');
    /* the switch carries the explanation in a tooltip (hover / keyboard focus) */
    const sw=h('button',{class:'btn small tipabove'+(st.lvAuto?'':' alt'),'data-fid':'lvautosw','data-tip':this.t('lvAutoD'),'aria-label':this.t('lvAuto')+': '+on+'. '+this.t('lvAutoD'),
      onclick:()=>{this.sfx();st.lvAuto=!st.lvAuto;this.app.save.write();rb();}},on);
    return h('div',null,this.header('prioBtn'),h('div',{class:'settings'},
      h('div',{class:'srow'},h('div',{class:'sl'},h('b',null,this.t('lvAuto'))),sw),
      h('h3',{class:'h3s'},this.t('endPrio')),
      g?[h('p',{class:'sub'},this.t('endPrioD')),h('div',{class:'prlist'},this.prioRows(g,rb))]:h('p',{class:'sub'},this.t('prioHint'))));
  },
  /* ---------- game data (telemetry): switch, summary of the last run, export, delete ---------- */
  screen_telemetry(){
    const st=this.save.settings,rb=()=>this.rebuild(true),runs=TeleStore.load(),last=runs[runs.length-1],on=this.t(st.tele!==false?'on':'off');
    const sw=h('button',{class:'btn small tipabove'+(st.tele!==false?'':' alt'),'data-fid':'telesw','data-tip':this.t('teleSwD'),'aria-label':this.t('teleSw')+': '+on+'. '+this.t('teleSwD'),
      onclick:()=>{this.sfx();st.tele=st.tele===false;this.app.save.write();rb();}},on);
    const ex=(key,name,get,mime)=>h('button',{class:'btn small','data-fid':'tx_'+name,onclick:()=>{this.sfx();TeleStore.download('dbs-'+name+(mime==='application/json'?'.json':'.csv'),get(),mime).then(ok=>{if(!ok)this.toast({type:'info',msg:this.t('teleFail')});});}},this.t(key));
    const csv=k=>()=>TeleStore.csv(k,runs),kb=Math.round(TeleStore.json(runs).length/1024);
    const sum=[];
    if(last){
      const mm=x=>Math.floor(x/60)+':'+String(Math.floor(x%60)).padStart(2,'0'),stg=STAGES.find(x=>x.id===last.stage);
      sum.push(h('p',{class:'sub'},this.t('teleLastL',{r:this.t('teleRes_'+last.res),st:stg?this.tr(stg.n):last.stage,d:last.diff,t:mm(last.dur),l:last.lvl,k:last.kills})));
      for(const b of last.boss||[]){const bd=BOSSES[b.id],n=bd?this.tr(bd.n):b.id;
        sum.push(h('p',{class:'sub'},b.killed?this.t('teleBossL',{b:n,t:b.kt,d:b.taken}):this.t('teleBossN',{b:n,h:Math.round((b.hpLeft||0)*100)})));}
    }
    const clr=h('button',{class:'btn small bad','data-fid':'teleclear',onclick:()=>{
      if(this.teleArm){TeleStore.clear();this.teleArm=false;this.toast({type:'info',msg:this.t('teleCleared')});rb();}
      else{this.teleArm=true;this.toast({type:'info',msg:this.t('teleClearSure')});setTimeout(()=>{this.teleArm=false;},4000);}
    }},this.t('teleClear'));
    const cp=h('button',{class:'btn small alt','data-fid':'tx_copy',onclick:async()=>{this.sfx();try{await navigator.clipboard.writeText(TeleStore.json(runs));this.toast({type:'info',msg:this.t('teleCopied')});}catch(e){this.toast({type:'info',msg:this.t('teleFail')});}}},this.t('teleCopy'));
    return h('div',null,this.header('teleTitle'),h('div',{class:'settings'},
      h('div',{class:'srow'},h('div',{class:'sl'},h('b',null,this.t('teleSw'))),sw),
      h('p',{class:'sub'},this.t('teleRowD')),
      runs.length?[h('p',{class:'sub'},this.t('teleCount',{n:runs.length,k:kb})),h('h3',{class:'h3s'},this.t('teleLast')),sum,
        h('h3',{class:'h3s'},this.t('teleExp')),
        h('div',{class:'row wrap'},ex('teleJson','all',()=>TeleStore.json(runs),'application/json'),ex('teleCsvR','runs',csv('runs'),'text/csv'),ex('teleCsvM','minutes',csv('minutes'),'text/csv'),
          ex('teleCsvL','levels',csv('levels'),'text/csv'),ex('teleCsvB','bosses',csv('bosses'),'text/csv'),ex('teleCsvW','weapons',csv('weapons'),'text/csv'),ex('teleCsvE','enemies',csv('enemies'),'text/csv'),cp),
        h('div',{class:'row'},clr)]
      :h('p',{class:'sub'},this.t('teleNone'))));
  },
  /* ---------- pause ---------- */
  screen_pause(a){
    const tab=(a&&a.tab)||this.lastPauseTab||'run',g=this.app.game,S=g.S,p=g.p,t=k=>this.t(k);
    const none=()=>h('div',{class:'cd'},t('none'));
    const sec=(key,kids)=>h('div',{class:'psec'},h('h3',null,t(key)),kids&&kids.length?kids:none());
    const pips=(n,max,gold)=>h('div',{class:'pips'},Array.from({length:max},(_,i)=>h('i',{class:i<n?'on':''})));
    const weapons=[...g.weapons.values()].map(w=>h('div',{class:'prow'},glyph(w.def.k,w.color),
      h('div',{class:'col'},h('div',{class:'cn'},(w.evo?'★'.repeat(w.evo)+' ':'')+this.tr(w.evo?w.evoName:w.def.n)+(w.xl>0?' · Lv '+w.lvShow:''),this.weaponInfo(w,g)),pips(w.lv,WMAX),
        h('div',{class:'cd'},this.tr(w.def.d)+(w.evo?' · '+this.tr(w.evo>=2?w.def.evo2D:w.def.evoD):'')))));
    const kr=(k,v)=>h('div',{class:'krow'},h('span',null,k===null?t('passSlots').replace(/\s*[:(]?\s*\{a\}\s*\/\s*\{b\}\)?/,''):t(k)),h('b',null,v));
    const stats=[kr('stHp',Math.round(p.hp)+' / '+p.maxHp),kr('stPower','x'+S.might.toFixed(2)),kr('stSpeed','x'+S.spd.toFixed(2)),kr('stCooldown','x'+S.cd.toFixed(2)),
      kr('stArmor',S.armor.toFixed(1)),kr('stRegen',S.regen.toFixed(1)+'/s'),kr('stCrit',Math.round(S.crit*100)+'% (x'+S.critDmg+')'),kr('stDodge',Math.round(S.dodge*100)+'%'),
      kr('stArea','x'+S.area.toFixed(2)),kr('stLuck',Math.round(S.luck*100)+'%'),kr('stXp','x'+S.xp.toFixed(2)),kr('stGold','x'+S.gold.toFixed(2)),kr('stMagnet',Math.round(S.magnet))];
    const fe=g.formEntry;
    const ups=[kr(null,g.passCount()+' / '+MAX_PASSIVES),kr('senzuTitle',g.senzu+' / '+SENZU_MAX),kr('formLabel',fe?this.tr(fe.n):t('baseForm')+' ('+g.formsUnlocked+'/'+g.formMax+')'),
      ...Object.keys(g.pass).filter(id=>g.pass[id]>0).map(id=>h('div',{class:'prow'},PASS_IMG[id]&&SHOP_IMG[PASS_IMG[id]]?imgGlyph(SHOP_IMG[PASS_IMG[id]],PASS[id].c):glyph(PASS[id].k,PASS[id].c),h('div',{class:'col'},h('div',{class:'cn'},this.tr(PASS[id].n)),pips(g.pass[id],5),h('div',{class:'fx'},h('span',{class:'fxi',style:'--c:'+(CAT_COL[PASS_ICON[id]]||PASS[id].c)},h('b',null,this.tr(PASS[id].d))))))),
      ...g.tempBuffs.map(b=>kr('tempBuffs',this.tr(BUFF_NAMES[b.k])+' ('+Math.ceil(b.t)+'s)')),
      g.luckBonus>0?kr('stLuck','+'+Math.round(g.luckBonus*100)+'%'):null];
    const trins=g.trinkets.map(id=>{const tr=TRINKETS.find(x=>x.id===id),rr=g.trR(id),pf=hasPf(tr)?g.trP(id):null;return h('div',{class:'prow'},glyph(tr.k,RARITY[rr].c),h('div',{class:'col'},h('div',{class:'cn',style:'color:'+RARITY[rr].c},this.tr(tr.n)+' · '+this.tr(RARITY[rr].n)+(pf!=null?' · '+pf+'%':'')),h('div',{class:'cd'},this.tr(trinDesc(tr,rr,pf))),this.perfBar(pf)));});
    /* abilities of the run (character ability, dash, Senzu, pet): the same explanations as the HUD hover */
    const ablist=[];
    for(const z of [{k:'ability'},{k:'dash'},{k:'senzu'},{k:'pet'}]){const tb=this.tipFor(z,g);if(tb)ablist.push(h('div',{class:'prow'},tb.querySelector('.glyph'),h('div',{class:'col'},tb.querySelector('.tiph b'),h('div',{class:'cd'},tb.querySelector('.tiph i')?tb.querySelector('.tiph i').textContent:''),h('div',{class:'cd'},tb.querySelector('p').textContent))));}
    const wishes=[kr('balls',g.balls+' / 7'),...g.wishLog.map(w=>kr('wishLabel',this.tr(WISH_NAMES[w])))];
    const tabs=h('div',{class:'row tabs'},
      ['run','grim'].map(k=>h('button',{class:'btn small'+(tab===k?'':' alt'),'data-fid':'pt'+k,onclick:()=>{this.sfx('uiTab');this.lastPauseTab=k;this.top.args={tab:k};this.rebuild(true);}},k==='run'?this.t('runTab'):'📖 '+this.t('grimoire'))));
    const btns=h('div',{class:'row'},
        h('button',{class:'btn primary','data-focus':true,'data-back':true,onclick:()=>{this.sfx();this.app.resume();}},this.t('resume')),
        this.btn('glossary',()=>this.push('glossary'),'alt'),
        this.btn('unl',()=>this.push('unl'),'alt'),
        this.btn('ach',()=>this.push('ach'),'alt'),
        this.btn('settings',()=>this.push('settings',{tab:'general'}),'alt'),
        this.btn('quitMenu',()=>this.app.endRunManually(),'alt'));
    return h('div',{class:'pausescr'},h('h2',null,this.t(tab==='grim'?'grimoire':'pause')),btns,tabs,
      tab==='grim'?this.grimBody():h('div',{class:'pgrid'},sec('pauseWeapons',weapons),h('div',{class:'psec'},h('h3',null,this.tr(T('Abilità','Abilities'))),ablist),sec('pauseStats',stats),sec('pauseUpgrades',ups.filter(Boolean)),sec('pauseTrinkets',trins),sec('pauseWishes',wishes)));
  },
  /* ---------- sandbox config ---------- */
  screen_sandboxCfg(){
    const sel=this.sel;
    const stage=h('select',{'data-fid':'sbs',onchange:()=>{sel.stage=+stage.value;}},STAGE_ORDER.map(i=>h('option',{value:i,selected:sel.stage===i},'S'+STAGES[i].no+' '+this.tr(STAGES[i].n))));
    const ch=h('select',{'data-fid':'sbc',onchange:()=>{sel.char=ch.value;}},CHARS.map(c=>h('option',{value:c.id,selected:sel.char===c.id},this.tr(c.n))));
    const df=h('select',{'data-fid':'sbd',onchange:()=>{sel.diff=df.value;}},Object.keys(DIFF).map(k=>h('option',{value:k,selected:sel.diff===k},this.tr(DIFF[k].n))));
    return h('div',null,this.header('sandbox'),h('p',{class:'sub'},this.t('sbDesc')),
      h('div',{class:'settings'},h('div',{class:'srow'},h('b',null,this.t('chooseStage')),stage),h('div',{class:'srow'},h('b',null,this.t('chooseChar')),ch),h('div',{class:'srow'},h('b',null,this.t('difficulty')),df)),
      h('div',{class:'row'},this.btn('start',()=>{this.app.startGame({stage:sel.stage,char:sel.char,diff:sel.diff,x2:false,sandbox:true});},'primary')));
  },
  /* ---------- modals (level up / chest / wish) ---------- */
  describe(o){
    if(o.type==='w'){const w=WEAPONS[o.id],g=this.app.game,wp=g&&g.weapons.get(o.id),ev=wp?wp.evo:0,pid=evoPass(o.id,ev);
      const evoNow=((this.app.game&&this.app.game.weapons.get(o.id))||{}).evo;
      const fx=o.xl!=null?[{i:'dmg',t:'+'+(XL_DMG*100).toString().replace('.',',')+'% '+this.t('xlDmg')},{i:'area',t:'+'+(XL_AREA*100).toString().replace('.',',')+'% '+this.t('xlArea')},{i:'cd',t:'−'+(XL_CD*100).toString().replace('.',',')+'% '+this.t('xlCd')}]:evoNow?[{i:'dmg',t:T('+5% danno','+5% damage')},{i:'cd',t:T('−1,5% ricarica','−1.5% cooldown')},{i:'area',t:T('+2% area','+2% area')}]:(o.lv?wsFx(o.id,o.lv-1,o.lv):null);
      return{k:w.k,c:w.c,n:w.n,cat:evoNow?'dmg':(fx?fx[0].i:'wpn'),fx,lvt:o.xl!=null?'Lv '+(o.lv+o.xl)+'→'+(o.lv+o.xl+1):o.lv?'Lv '+o.lv+'→'+(o.lv+1):'Lv 1',tag:o.lv?this.t('wpnTag'):this.t('newWeapon'),d:(fx?null:w.d),
        hints:pid&&(!g||ev<g.maxEvo(o.id))?[{pid,wid:o.id,evo:ev}]:null};}
    if(o.type==='p'){const p=PASS[o.id],g=this.app.game,used=g?g.passCount():0;
      const hints=g?[...g.weapons.values()].filter(w=>w.evo<g.maxEvo(w.id)&&evoPass(w.id,w.evo)===o.id).map(w=>({pid:o.id,wid:w.id,evo:w.evo,ready:w.maxed})):null;
      return{k:p.k,c:p.c,img:PASS_IMG[o.id],n:p.n,cat:PASS_ICON[o.id],fx:[{i:PASS_ICON[o.id],t:p.d}],lvt:o.lv?'Lv '+o.lv+'→'+(o.lv+1):'Lv 1',tag:o.lv?this.t('upgTag'):this.t('newPass'),d:null,hints:hints&&hints.length?hints:null};}
    if(o.type==='z')return{k:'金',c:'#ffd23f',cat:'coin',n:T('Zenny','Zeni'),tag:this.t('treasure'),d:T('+'+o.v+' zenny','+'+o.v+' zenny')};
    {const gg=this.app.game,n=gg?gg.senzu:0,full=n>=SENZU_MAX;
      return{k:'豆',c:'#8be07a',cat:'hp',n:T('Fagiolo Senzu','Senzu Bean'),tag:this.t('senzuTitle'),d:T(full?this.t('senzuFull',{b:SENZU_MAX}):this.t('senzuBagged',{a:n+1,b:SENZU_MAX}),full?this.t('senzuFull',{b:SENZU_MAX}):this.t('senzuBagged',{a:n+1,b:SENZU_MAX}))};}
  },
  describeReward(r){
    if(r.k==='evo'){const w=WEAPONS[r.id],wp=this.app.game&&this.app.game.weapons.get(r.id),sec=wp&&wp.evo>=1;return{k:w.k,c:'#ffd23f',n:sec?w.evo2:w.evo,tag:'★ '+this.t(sec?'evolution2':'evolution'),d:sec?w.evo2D:w.evoD,evo:true,cat:'star',hints:[{pid:evoPass(r.id,sec?1:0),wid:r.id,evo:sec?1:0}]};}
    if(r.k==='up')return this.describe(r.o);
    if(r.k==='pick')return{k:'袋',c:'#ffd23f',n:T(this.t('pickTitle'),this.t('pickTitle')),tag:this.t('pickTag'),d:T(this.t('pickOf',{n:r.opts.length}),this.t('pickOf',{n:r.opts.length}))};
    if(r.k==='trinket'){const t=TRINKETS.find(x=>x.id===r.id),rr=r.rar!=null?r.rar:t.r;return{k:t.k,c:RARITY[rr].c,n:t.n,tag:this.tr(RARITY[rr].n)+(hasPf(t)&&r.pf!=null?' · '+r.pf+'%':''),d:trinDesc(t,rr,r.pf),pf:hasPf(t)&&r.pf!=null?r.pf:null};}
    return this.describe({type:'z',v:r.v});
  },
  card(info,i,onclick,extra){
    const fc=info.cat&&CAT_COL[info.cat];
    return h('button',{class:'card opt'+(info.evo?' evo':'')+(fc?' cat':'')+(extra||''),style:'--d:'+(.12+i*.1)+'s'+(fc?';--fc:'+fc:''),'data-fid':'o'+i,title:info.hints?info.hints.map(x=>this.tr(this.evoSentence(x.pid,x.wid,x.evo))).join('\n'):null,onclick},
      fc?h('span',{class:'bgic','aria-hidden':'true'},siIcon(info.cat,fc)):null,
      info.img&&SHOP_IMG[info.img]?imgGlyph(SHOP_IMG[info.img],info.c):glyph(info.k,info.c),
      h('div',{class:'col'},h('div',{class:'cn'},this.tr(info.n),info.lvt?h('span',{class:'lvt'},info.lvt):null),
        h('div',{class:'cl',style:'color:'+(fc||info.c)},info.tag),
        info.fx?h('div',{class:'fx'},info.fx.map(x=>h('span',{class:'fxi',style:'--c:'+(CAT_COL[x.i]||fc||info.c)},h('b',null,this.tr(x.t))))):null,
        info.d?h('div',{class:'cd'},this.tr(info.d)):null,
        info.pf!=null?this.perfBar(info.pf):null,
        info.hints?info.hints.map(x=>this.evoHint(x.pid,x.wid,x.evo,x.ready)):null),
      i<10&&onclick?h('span',{class:'key'},i===9?0:i+1):null);
  },
  /* the "refuse lower-rarity trinkets" switch, also reachable from the trinket windows (it is the same setting as in Settings) */
  refuseToggle(){
    const s=this.save.settings,b=h('button',{class:'btn small alt trtog','data-fid':'trref',title:this.t('trinRefuseD'),onclick:e=>{this.sfx();s.trinRefuse=!s.trinRefuse;this.app.applySettings();set();e.currentTarget.blur();}});
    const set=()=>{b.textContent=this.t('trinRefuse')+': '+this.t(s.trinRefuse?'on':'off');b.classList.toggle('on',!!s.trinRefuse);};set();
    return h('div',{class:'row trrow'},b);
  },
  openModal(m,g){
    const again=!!(this.modalEl&&this.modalEl.isConnected&&this.modalEl.classList.contains('modal')&&this.modalEl.dataset.mt===m.type);   /* the same window rebuilt in place (e.g. after a purchase): no new intro animation */
    this.closeModal(true);
    let el;
    if(m.type==='level'){
      /* shop helpers: Reroll (redraw the 3 cards), Skip (take nothing), Ban (remove a weapon / upgrade from the run) */
      const ru=g.ru,r0=g.ru0,redo=()=>this.openModal(g.modal,g);
      const tb=(id,icon,lab,n,fn,on)=>r0[id]>0?h('button',{class:'btn small'+(on?' primary':' alt')+(n>0?'':' locked'),disabled:n<=0&&!on,'data-fid':'lv'+id,title:this.tr(SHOP.find(x=>x.id===(id==='rr'?'rr':id==='sk'?'sk':'bn')).d),onclick:()=>{const r=fn();if(r){this.sfx(id==='bn'?'uiBack':'uiTab');redo();}else if(r===false)this.sfx('uiErr');}},icon+' '+this.tr(lab)+' ('+n+')'):null;
      const tools=[tb('rr','🎲',T('Reroll','Reroll'),ru.rr,()=>g.rerollLevel()),
        tb('sk','⏭',T('Salta','Skip'),ru.sk,()=>{if(!g.skipLevel())return false;this.sfx('uiTab');this.app.resolveModal(-1);return null;}),
        tb('bn','🚫',T('Ban','Ban'),ru.bn,()=>{m.banMode=!m.banMode;return true;},m.banMode)].filter(Boolean);
      /* everything maxed: three bags of zenny; "Auto-choose" takes the biggest one now and on every level-up until a weapon or upgrade choice shows up again */
      if(m.maxed)tools.unshift(h('button',{class:'btn small primary','data-fid':'lvauto',title:this.tr(T('Sceglie da solo il sacco più grande finché non torna una scelta di arma o potenziamento (si può tenere sempre attiva dalle impostazioni di gioco).','Takes the biggest bag by itself until a weapon or upgrade choice shows up again (it can be kept always on in the gameplay settings).')),
        onclick:()=>{this.sfx('uiTab');g.autoZ=true;const bi=m.options.reduce((b,o,i)=>(o.v||0)>(m.options[b].v||0)?i:b,0);this.app.resolveModal(bi);}},'⚡ '+this.tr(T('Scelta automatica','Auto-choose'))));
      el=h('div',{class:'screen modal'+(m.banMode?' banmode':'')},h('h2',null,m.banMode?this.tr(T('Scegli cosa bandire','Choose what to ban')):this.t('levelUpTitle',{n:g.lvl})),
        m.banMode?h('p',{class:'sub'},this.tr(T('Clicca un\'arma o un potenziamento: non uscirà più per il resto della partita.','Click a weapon or upgrade: it will not show up again for the rest of the run.'))):null,
        m.maxed?h('p',{class:'sub'},this.tr(T('Tutto al massimo: scegli un sacco di zenny.','Everything is maxed: pick a bag of zenny.'))):null,
        h('div',{class:'cards'},m.options.map((o,i)=>{
          const c=this.card(this.describe(o),i,()=>{
            if(m.banMode){if(g.banLevel(i)){this.sfx('uiBack');redo();}else this.sfx('uiErr');return;}
            this.sfx('lvl');this.app.resolveModal(i);});
          if(m.rec===i&&!m.banMode){   /* recommended card: star + short reason */
            const WHY={evo:T('Per evolvere un\'arma','Evolves a weapon'),wevo:T('Arma quasi evoluta','Nearly evolved'),hp:T('Poca salute','Low health'),armor:T('Poca armatura','Low armor')};
            c.classList.add('recd');c.append(h('span',{class:'recstar',title:this.tr(WHY[m.recWhy]||WHY.evo)},'★'),h('span',{class:'recwhy'},'★ '+this.tr(WHY[m.recWhy]||WHY.evo)));
          }
          return c;})),
        tools.length?h('div',{class:'row lvtools'},tools):null);
    }else if(m.type==='chest'){
      el=h('div',{class:'screen modal'},h('h2',null,this.t('chestTitle')),
        h('div',{class:'cards'},m.rewards.map((r,i)=>this.card(this.describeReward(r),i,null,' reveal'))),
        h('div',{class:'row'},h('button',{class:'btn primary','data-focus':true,style:'animation-delay:1.4s',onclick:()=>{this.sfx('chest');this.app.resolveModal(0);}},this.t('collect'))));
    }else if(m.type==='pick'){
      const cs=m.opts.map((id,i)=>{const c=this.card(this.describeReward({k:'trinket',id,rar:(m.rars||[])[i],pf:(m.pfs||[])[i]}),i,()=>{this.sfx('chest');this.app.resolveModal(i);},m.opts.length>6?' tiny':'');c.style.setProperty('--d',(i*.07)+'s');return c;});
      el=h('div',{class:'screen modal'},h('h2',null,this.t('pickTitle')),h('p',{class:'sub'},this.t('pickSub',{n:m.opts.length})),h('div',{class:'cards many'},cs),this.refuseToggle());
    }else if(m.type==='tswap'){
      /* every trinket slot is taken: compare the new trinket with what you carry and choose which one to replace (or keep them all) */
      const nt=TRINKETS.find(x=>x.id===m.nw.id),curs=m.curs,multi=curs.length>1,sn=trinStats(nt,m.nw.rar,m.nw.pf),G=this.app.game,sd=G?G.sd:0;
      const weak=curs.reduce((b,c,i)=>c.rar<curs[b].rar?i:b,0),np=hasPf(nt)?(m.nw.pf!=null?m.nw.pf:PF_NOM):null;
      const sc=(id,r,pf)=>G.trinScore(id,r,pf);
      /* perfection before -> after, and what the sale of a found trinket pays */
      const dl=(a,b2)=>{if(a==null||b2==null)return null;const d=b2-a;return h('div',{class:'tsdelta '+(d>0?'up':d<0?'down':'eq')},this.t('perfLabel')+' '+a+'% → '+b2+'%',h('b',null,d>0?' ▲ +'+d:d<0?' ▼ '+d:' ='));};
      const sell=(lbl,r)=>h('div',{class:'tssell'},lbl+' ',zAmt(trinketSale(r,sd)));
      const col=(t,r,pf,mine,other,tag,extra,plain)=>{
        const keys=[...new Set([...mine.map(x=>x.k),...other.map(x=>x.k)])];
        const rows=(plain?mine.map(a=>h('div',{class:'tsrow eq'},this.tr(a.t))):keys.map(k=>{const a=mine.find(x=>x.k===k),b=other.find(x=>x.k===k),va=a?a.v:0,vb=b?b.v:0;
          return h('div',{class:'tsrow '+(va>vb?'up':va<vb?'down':'eq')},a?this.tr(a.t):'—',h('b',null,va>vb?' ▲':va<vb?' ▼':''));}));
        const sp=t.x||(t.sp?t.d:null);
        return h('div',{class:'tscol'+(pf!=null&&pf>=100?' perfect':''),style:'--c:'+RARITY[r].c},h('div',{class:'tstag'},tag),
          h('div',{class:'tshead'},glyph(t.k,RARITY[r].c),h('div',null,h('div',{class:'cn',style:'color:'+RARITY[r].c},this.tr(t.n)),h('div',{class:'cd'},this.tr(RARITY[r].n)))),
          this.perfBar(pf),h('div',{class:'tsrows'},rows),sp?h('div',{class:'tsx'},this.tr(sp)):null,extra||null);};
      const rep=(i,lbl)=>h('button',{class:'btn'+(i===weak?' primary':' alt'),'data-focus':i===weak?true:null,onclick:()=>{this.sfx('chest');this.app.resolveModal(i);}},(multi?(i+1)+' · ':'')+lbl);
      const curCols=curs.map((c,i)=>{const ct=TRINKETS.find(x=>x.id===c.id),cp=hasPf(ct)?(c.pf!=null?c.pf:PF_NOM):null,st=trinStats(ct,c.rar,c.pf);
        return col(ct,c.rar,cp,st,sn,this.t(c.src==='bag'?'swapCurBag':'swapCur'),h('div',{class:'tsextra'},dl(cp,np),c.src==='bag'?null:sell(this.t('swapSellOld'),c.rar),multi?h('div',{class:'row tsbtn'},rep(i,this.t('swapReplace'))):null));});
      const c0=curs[0],cmp=sc(m.nw.id,m.nw.rar,m.nw.pf)-Math.max(...curs.map(c=>sc(c.id,c.rar,c.pf))),vd=cmp>0?'up':cmp<0?'down':'eq';
      const verdict=h('div',{class:'tsverdict '+vd},this.t(cmp>0?'swapBetter':cmp<0?'swapWorse':'swapSame'));
      const newCol=col(nt,m.nw.rar,np,sn,multi?[]:trinStats(TRINKETS.find(x=>x.id===c0.id),c0.rar,c0.pf),this.t('swapNew'),h('div',{class:'tsextra'},multi?null:dl(hasPf(TRINKETS.find(x=>x.id===c0.id))?(c0.pf!=null?c0.pf:PF_NOM):null,np),multi?null:verdict,m.buy?null:sell(this.t('swapSellNew'),m.nw.rar)),multi);
      el=h('div',{class:'screen modal'},h('h2',null,this.t(multi?'swapTitleN':'swapTitle1')),
        h('p',{class:'sub'},this.t(multi?'swapSubN':'swapSub1',{n:curs.length})),
        h('div',{class:'tswap'+(multi?' multi':'')},multi?[newCol,h('div',{class:'tsarrow'},'→'),...curCols]:[curCols[0],h('div',{class:'tsarrow'},'→'),newCol]),
        h('p',{class:'tswarn'},'⚠ '+this.t('swapWarn')),
        h('div',{class:'row'},multi?null:rep(0,this.t('swapReplace')),
          h('button',{class:'btn alt','data-back':true,onclick:()=>{this.sfx();this.app.resolveModal(curs.length);}},(multi?(curs.length+1)+' · ':'')+this.t(multi?'swapKeepN':'swapKeep'))),
        m.buy?null:this.refuseToggle());
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
        if(o.kind==='form'){const e=LINES[g.C.line||'saiyan'][g.formsUnlocked];info={k:'変',c:e.aura,n:e.n,tag:this.t('trialForm'),d:T('Sblocchi subito la prossima trasformazione. (Alternativa all\'arma)','Unlock the next transformation right away. (Alternative to the weapon)')};}
        else if(o.kind==='weapon'){const w=WEAPONS[o.wid];info={k:w.k,c:w.c,n:w.n,tag:this.t('trialWeapon'),d:T('+1 livello a quest\'arma. (Alternativa alla trasformazione)','+1 level for this weapon. (Alternative to the transformation)')};}
        else{const p=Math.round(STEP[o.a]*100*TRIAL_MALUS),q=Math.round(STEP[o.b]*135);info={k:'力',c:'#c9a0ff',n:T('Scambio statistica','Stat swap'),tag:this.t('trialSwap'),d:T('-'+p+'% '+NAMES[o.a].it+'  →  +'+q+'% '+NAMES[o.b].it,'-'+p+'% '+NAMES[o.a].en+'  →  +'+q+'% '+NAMES[o.b].en)};}
        const ok=!o.sold&&(m.freePick||g.run.coins>=o.price);
        const el=this.card(Object.assign({},info,{tag:o.sold?this.t('trialSold'):((m.freePick?this.t('trialFree'):'Z '+o.price)+' · '+info.tag)}),i,()=>{if(g.buyOffer(i)){this.sfx('buy');if(m.offers.every(x=>x.sold)){this.app.resolveModal(0);}else this.openModal(g.modal,g);}else this.sfx('uiErr');});
        el.disabled=!ok;if(!ok)el.classList.add('locked');
        return el;
      }).filter(Boolean);
      el=h('div',{class:'screen modal'},h('h2',null,this.t('trialShopTitle')),h('p',{class:'sub'},m.freePick?this.t('trialFreeDesc'):this.t('trialShopDesc',{n:Math.floor(g.run.coins)})),
        h('div',{class:'cards trialcards'},cards),
        h('div',{class:'row'},h('button',{class:'btn primary','data-focus':true,'data-back':true,onclick:()=>{this.sfx();this.app.resolveModal(0);}},this.t('trialLeave'))));
    }else{
      const W=[{k:'復',c:'#8be07a',n:T('Seconda vita','Second life'),d:T('Ottieni una resurrezione.','Gain a revive.')},
        {k:'力',c:'#ffd23f',n:T('Potere','Power'),d:T('Tutte le armi guadagnano un livello.','All weapons gain a level.')},
        {k:'金',c:'#ffb13b',n:T('Fortuna','Fortune'),d:T('Zenny e un cimelio casuale.','Zenny and a random trinket.')},
        {k:'券',c:'#ff9ad0',n:T('10 Ticket','10 Tickets'),d:T('Un Ticket 10× per il Gacha dei Cimeli: 10 estrazioni di cimeli.','A 10× Ticket for the Trinket Gacha: 10 trinket pulls.')}];
      el=h('div',{class:'screen modal wish'},h('h2',null,this.t('wishTitle')),h('p',{class:'sub'},this.t('wishDesc')),
        h('div',{class:'cards'},W.map((w,i)=>this.card({k:w.k,c:w.c,n:w.n,tag:'🐉',d:w.d},i,()=>{this.sfx('ball');this.app.resolveModal(i);}))));
    }
    if(el.classList.contains('modal')){el.dataset.mt=m.type;if(again)el.classList.add('noanim');}
    this.modalEl=el;this.root.append(el);
    const f=this.focusables(el)[0];if(f)setTimeout(()=>f.focus({preventScroll:true}),30);
    if(this.top)this.top.el.classList.add('hidden');
  },
  /* tooltip content for a HUD zone (see Renderer.zones) */
  tipFor(z,g){
    const hd=(c,glyphK,name,sub)=>h('div',{class:'tiph'},glyph(glyphK,c),h('div',null,h('b',{style:'color:'+c},this.tr(name)),sub?h('i',null,sub):null));
    const T2=(it,en)=>this.tr(T(it,en)),box=kids=>h('div',{class:'tipbox'},kids);
    if(z.k==='weapon'){const w=g.weapons.get(z.id);if(!w)return null;
      return box([hd(w.color,w.def.k,w.evo?w.evoName:w.def.n,(w.evo?'★'.repeat(w.evo)+' ':'')+'Lv '+w.lv+'/'+WMAX),h('p',null,this.tr(w.def.d)+(w.evo?' · '+this.tr(w.evo>=2?w.def.evo2D:w.def.evoD):'')),
        w.maxed&&w.evo<g.maxEvo(w.id)?h('p',{class:'tipnote'},this.tr(this.evoSentence(evoPass(w.id,w.evo),w.id,w.evo))):null]);}
    if(z.k==='pass'){const P=PASS[z.id];if(!P)return null;const ws=[...g.weapons.values()].filter(w=>w.evo<g.maxEvo(w.id)&&evoPass(w.id,w.evo)===z.id);
      return box([hd(P.c,P.k,P.n,'Lv '+(g.pass[z.id]||0)+'/5'),h('p',null,this.tr(P.d)),ws.length?h('p',{class:'tipnote'},T2('Serve per evolvere: ','Needed to evolve: ')+ws.map(w=>this.tr(w.def.n)).join(', ')):null]);}
    if(z.k==='trinket'){const t=TRINKETS.find(x=>x.id===z.id);if(!t)return null;const rr=g.trR(z.id),pf=hasPf(t)?g.trP(z.id):null;return box([hd(RARITY[rr].c,t.k,t.n,this.tr(RARITY[rr].n)+(pf!=null?' · '+pf+'%':'')),h('p',null,this.tr(trinDesc(t,rr,pf))),this.perfBar(pf),pf!=null&&pf>=100?h('p',{class:'tipnote'},this.t('perfUI')):null]);}
    if(z.k==='ability'){const a=g.abil;if(!a)return null;return box([hd(a.c,a.k,a.n,a.cd?T2('Ricarica ','Cooldown ')+g.abCdMax+'s':a.m==='berserk'?T2('Ricarica ','Cooldown ')+g.bersCdMax+'s':null),h('p',null,this.tr(a.d)),
      ...(ABIL_TIER[a.m]?[h('p',{class:'tipnote abt'+(g.abTier>=1?' on':'')},'◆ '+T2('Forma centrale: ','Middle form: ')+this.tr(ABIL_TIER[a.m].p)+(g.abTier>=1?' ×'+(Math.round(g.passK()*100)/100).toString().replace('.',','):'')),h('p',{class:'tipnote abt'+(g.abTier>=2?' on':'')},'★ '+T2('Forma finale: ','Final form: ')+this.tr(ABIL_TIER[a.m].f))]:[])]);}
    if(z.k==='pet'){const q=g.pet;if(!q)return null;const d=q.d;return box([hd(d.c,d.k,d.n,this.tr(d.ab)+' · '+T2('Ricarica ','Cooldown ')+d.cd+'s'),h('p',null,this.tr(d.d))]);}
    if(z.k==='target')return box([hd('#ff8a5a','的',T('Bersaglio delle armi','Weapon target'),'['+(this.app.renderer.keyHints.target||'Tab')+']'),h('p',null,T2('Premi il tasto per cambiare chi puntano le armi: il più vicino, il nemico con più Salute, quello con meno Salute o il boss.','Press the key to change what your weapons aim at: the closest enemy, the one with the most HP, the one with the least HP, or the boss.'))]);
    if(z.k==='dash')return box([hd('#7fd4ff','走',T('Scatto','Dash'),T2('Ricarica ','Cooldown ')+Math.round(g.dashCdMax)+'s'),h('p',null,T2('Breve scatto invulnerabile nella direzione in cui ti muovi: danneggia i nemici che attraversi.','A short invulnerable dash in your movement direction: it damages the enemies you pass through.'))]);
    if(z.k==='senzu')return box([hd('#8be07a','豆',T('Fagiolo Senzu','Senzu Bean'),g.senzu+'/'+SENZU_MAX),h('p',null,T2('Mangia un fagiolo: recuperi il 50% della salute e un parametro casuale sale per il resto della partita. Se la borsa è piena, i nuovi si mangiano subito.','Eat a bean: restores 50% of your health and a random stat rises for the rest of the run. Pick-ups beyond a full bag are eaten at once.'))]);
    return null;
  },
  /* the window fades out (0.22 s) instead of vanishing; instant=true when another one is about to replace it */
  closeModal(instant){
    const m=this.modalEl;if(!m)return;this.modalEl=null;
    if(instant||!m.classList.contains('modal')){m.remove();return;}
    m.classList.add('leaving');m.style.pointerEvents='none';try{if(m.contains(document.activeElement))document.activeElement.blur();}catch(e){}
    setTimeout(()=>m.remove(),240);
  },
  /* ---------- end of run ---------- */
  /* damage dealt by each weapon (icon, name, level, bar, damage, share) */
  dmgSummary(res){
    const dm=res.dmg||{},ids=Object.keys(dm).filter(k=>dm[k]>0).sort((a,b)=>dm[b]-dm[a]),tot=ids.reduce((s,k)=>s+dm[k],0)||1,top=dm[ids[0]]||1,ws=res.ws||{};
    const nm=k=>k==='other'?this.t('dmgOther'):(WEAPONS[k]?this.tr(WEAPONS[k].n):k),cl=k=>k==='other'?'#9aa4b8':(WEAPONS[k]&&WEAPONS[k].c)||'#ffb13b';
    const fmt=v=>v>=1e6?(v/1e6).toFixed(2)+'M':v>=1e4?(v/1e3).toFixed(1)+'K':String(Math.round(v));
    const row=k=>{const w=ws[k],lv=w?(w.evo?'★'+(w.evo>1?'★':''):'Lv'+w.lv)+(w.xl?' Lv'+(w.lv+w.xl):''):'';
      return h('div',{class:'wrow',style:'--c:'+cl(k)},h('span',{class:'wic',style:'--c:'+cl(k)},k==='other'?'気':(WEAPONS[k]?WEAPONS[k].k:'?')),
        h('div',{class:'wmid'},h('div',{class:'wtop'},h('span',{class:'wn'},nm(k)),lv?h('small',{class:'wlv'},lv):null),
          h('span',{class:'dbar'},h('i',{style:'width:'+Math.max(3,Math.round(dm[k]/top*100))+'%;background:'+cl(k)}))),
        h('b',{class:'wv'},fmt(dm[k]),h('small',null,Math.round(dm[k]/tot*100)+'%')));};
    return h('div',{class:'dmgsum'},h('h3',null,this.t('dmgSummary')),
      ids.length?ids.slice(0,10).map(row):h('p',{class:'sub'},'—'));
  },
  screen_end(res){
    const g=this.app.game,labels={coins:'rw_coins',kills:'rw_kills',time:'rw_time',bosses:'rw_bosses',clear:'rw_clear'};
    const chip=(k,v,i)=>h('div',{class:'echip c'+i},h('span',null,this.t(k)),h('b',null,v));
    const tk=!res.sandbox&&res.tickets?['t1','t10','l10'].filter(k=>res.tickets[k]):[];
    /* Endless: a button next to Retry / Menu, locked until this stage has been cleared on Extreme (and the stage is won in this run) */
    const canEnd=!!res.win&&!g.continued&&(!!res.sandbox||!!res.xc),showEnd=!g.continued;
    const lockWhy=!res.xc&&!res.sandbox?this.t('endlessLockX'):this.t('endlessLockW');
    /* banner: a hexagonal metal plate with a Dragon Ball at each end, the title (two lines when it has two words) across it */
    const ttl=String(res.win?this.t('stageClear'):this.t('defeat')),tw=ttl.trim().split(/\s+/),tlines=tw.length>1?[tw[0],tw.slice(1).join(' ')]:[ttl];
    const tline=x=>h('span',{class:'tl'},h('i',{class:'b','aria-hidden':'true'},x),h('i',{class:'m','aria-hidden':'true'},x),h('i',{class:'f'},x));
    const banner=h('div',{class:'ebanner'+(res.win?'':' lose')},
      h('div',{class:'eplate'},h('i'),h('i'),h('i')),h('div',{class:'eball l'},gball(4,60)),h('div',{class:'eball r'},gball(7,60)),
      h('h2',{class:'etitle'+(tlines.length<2?' one':''),'aria-label':ttl},tlines.map(tline)));
    return h('div',{class:'center end end2'},banner,
      h('div',{class:'endcols'},
        h('div',{class:'endl'},
          h('div',{class:'esum'},chip('time',fmtT(res.t),1),chip('kills',res.kills,2),chip('level',res.lvl,3),chip('bosses',res.bossKills,4)),
          res.sandbox?h('p',{class:'sub'},this.t('sbNoReward')):
          h('div',{class:'rewards compact'},
            res.lines.filter(l=>l.v>0||l.k==='coins').map(l=>h('div',{class:'rline'},h('span',null,this.t(labels[l.k])),h('b',null,zAmt(l.v,true)))),
            h('div',{class:'rline'},h('span',null,this.t('multiplier')),h('b',null,'x'+res.mult.toFixed(2))),
            h('div',{class:'rline total'},h('span',null,this.t('total')),h('b',null,zAmt(res.total,true)))),
          !res.sandbox&&res.kept&&res.kept.length?h('div',{class:'echips kept'},res.kept.map(k=>{const i=this.tinfo(k.id,k.r,k.p);return h('span',{class:'tchip tkept',style:'--c:'+i.c,title:this.t(k.up?'trinketsUp':'trinketsKept')+'\n'+i.name+' · '+i.rar+(i.perf!=null?' · '+i.perf+'%':'')},glyph(i.t.k,i.c),i.name+(k.up?' ↑':''));})):null,
          tk.length||(!res.sandbox&&res.sold)?h('div',{class:'echips'},
            tk.map(k=>h('span',{class:'tchip',title:this.t('ticketsFound')},h('i',{class:'tk'}),res.tickets[k]+'× '+this.t(k==='t1'?'tkT1':k==='t10'?'tkT10':'tkL10'))),
            !res.sandbox&&res.sold?h('span',{class:'tchip',title:this.t('trinketsSold')},'💰 '+res.sold):null):null),
        h('div',{class:'endr'},this.dmgSummary(res))),
      h('div',{class:'row'},
        h('button',{class:'btn primary','data-focus':!canEnd?true:null,onclick:()=>{this.sfx();this.app.retry();}},this.t('retry')),
        h('button',{class:'btn alt','data-back':true,onclick:()=>{this.sfx();this.app.toMenu();}},this.t('toMenu')),
        showEnd?h('span',{class:'endwrap'},
          h('button',{class:'btn alt endless'+(canEnd?'':' locked'),disabled:!canEnd,'data-focus':canEnd?true:null,'data-fid':'endless',
            onclick:()=>{if(!canEnd)return;this.sfx();this.app.continueRun();}},canEnd?h('span',{class:'inf'},'∞ '):h('span',{class:'lk','aria-hidden':'true'}),this.t('endlessBtn')),
          /* the explanation opens above the button on hover / focus (readable, not a line at the bottom of the screen) */
          h('div',{class:'etip',role:'tooltip'},h('b',{class:'etn'},'∞ '+this.t('endlessBtn')),
            canEnd?null:h('p',{class:'etlock'},'🔒 '+lockWhy),
            h('ul',null,String(this.t('endlessDesc')).split(/(?<=[.!?])\s+/).filter(Boolean).map(x=>h('li',null,x))),
            (STAGES[res.stage]&&STAGES[res.stage].endNote)?h('p',{class:'etred'},this.tr(STAGES[res.stage].endNote)):null)):null));
  },
  /* ---------- toasts ---------- */
  /* a small face of a character (first frame of its emote sheet, otherwise the head of its sprite) for the notifications; null when nothing can be drawn */
  portrait(c,sz){
    try{
      const cv=document.createElement('canvas');cv.width=sz;cv.height=sz;cv.className='tport';const g=cv.getContext('2d');g.imageSmoothingEnabled=true;
      const sid=Sprites.emoSheet(c.id,99),S=sid&&Sprites.sheets[sid];
      if(S&&S.img){const s=Math.min(S.fw,S.fh)*.92;g.drawImage(S.img,(S.fw-s)/2,S.fh*.04,s,s,0,0,sz,sz);return cv;}
      const sp=Sprites.player('menu:'+c.id+':-1',cfgForForm(c,-1),0,false);
      if(!sp||!sp.c)return null;
      g.imageSmoothingEnabled=!sp.px;const w=sp.c.width;g.drawImage(sp.c,0,0,w,w,0,0,sz,sz);return cv;
    }catch(e){return null;}
  },
  toast(n){
    let title='',body='',cls='info';
    if(n.type==='ach'){title=this.t('achUnlocked');body=[this.tr(n.a.n),'  ',h('span',{class:'zv'},'+',zIcon(),n.a.reward),n.a.tk?Object.keys(n.a.tk).map(k=>['  ',tkChip(k,n.a.tk[k])]):null];cls='ach';this.sfx('ach');}
    else if(n.type==='quest'){title=this.tr(T('Missione completata!','Quest complete!'));body=[this.tr(dqText(n.q)),'  ',h('span',{class:'zv'},'+',zIcon(),n.q.reward)];cls='ach';this.sfx('ach');}
    else if(n.type==='qbonus'){title=this.tr(T('Tutte le missioni giornaliere!','All daily quests done!'));body=[this.tr(T('Bonus','Bonus')),'  ',h('span',{class:'zv'},'+',zIcon(),n.v)];cls='ach';this.sfx('ach');}
    else if(n.type==='tfound'){title=this.tr(n.kind==='l10'?T('Ticket fortunato trovato!','Lucky ticket found!'):T('Ticket trovato!','Ticket found!'));body=[tkChip(n.kind,n.n),' ',this.tr(TK_NAME[n.kind])];cls='ach tfound';}
    else if(n.type==='unlock'){title=this.t('charUnlocked');body=this.tr(n.c.n);cls='unlock';this.sfx('ach');}
    else if(n.type==='weapon'){const w=WEAPONS[n.id];title=this.t(n.evo2?'evo2Unlocked':'weaponUnlocked');body=[h('span',{class:'tgl',style:'--c:'+w.c},w.k),' ',this.tr(n.evo2?w.evo2:w.n)];cls='ach';this.sfx('ach');}
    else if(n.type==='x2'){title=this.t('x2Unlocked');body=this.t('x2UnlockedBody',{n:n.stage+1});cls='ach';this.sfx('ach');}
    else{body=n.msg;}
    /* the face of the character on the right: the one unlocked, or the one that earned the achievement */
    const pc=n.type==='unlock'?n.c:n.type==='ach'?((this.app.game&&this.app.game.C)||CHARS.find(c=>c.id===this.save.lastChar)):null,pv=pc?this.portrait(pc,72):null;
    const el=h('div',{class:'toast '+cls+(pv?' hasp':'')},title?h('b',null,title):null,h('span',null,body),pv);
    this.toastBox.append(el);
    if(n.type&&n.type!=='info'){   /* unlocks / achievements: after a pause the notification slides back up and fades away over 3 seconds */
      setTimeout(()=>{el.style.maxHeight=el.offsetHeight+'px';el.classList.add('retire');},3500);
      setTimeout(()=>el.classList.add('collapse'),6500);setTimeout(()=>el.remove(),6850);
    }else{setTimeout(()=>el.classList.add('out'),4200);setTimeout(()=>el.remove(),4800);}
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
    const lsel=sel(['coin','bag','heal','magnet','dmg','haste','xp','capsule','ball','sball'].map(k=>[k,k]));
    const fsel=sel(['shrine','spring','altar','font'].map(k=>[k,k]));
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
