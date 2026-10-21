'use strict';
/* ====== Telemetry: gameplay data for balancing the game ======
   Every run records, in memory and without touching the game code (the hooks wrap Game methods at the bottom of this file):
     - run      who/what/how it ended: stage, character, difficulty, result (win / death / quit), duration, level, kills, final stats, weapons, upgrades, trinkets
     - min[]    one row per game minute: level, level-ups, XP gained, kills, enemies alive (average / peak), damage dealt (DPS), damage taken, health (average / lowest),
                healing, coins, gems, pick-ups, distance walked, time with a boss alive, weapons and upgrades with their levels, the stats at that moment
     - s10[]    a point every 10 s: enemies alive, health, damage dealt, kills, level   (the shape of the run)
     - lv[]     every level-up: when, how long since the previous one, enemies alive, health, what was offered, what was picked (and whether it was automatic)
     - boss[]   every boss: when it appeared, time to kill (from spawn and from the first hit), damage taken during the fight, your DPS on it, level, how much health it had left if you did not win
     - et{}     per enemy type: spawned, killed, average health at spawn, average lifetime, damage dealt to you
     - wp{}     per weapon: damage, hits, crits, kills, when it was acquired
     - hb{}     damage taken by source; deaths[] with the last source; lt{} pick-ups by kind; use{} ability / dash / senzu / pet / reroll...; ev[] chests, forms, revives, trials
   The finished run is stored on this device only (localStorage, key TELE_KEY, last TELE_MAX_RUNS runs); nothing is sent anywhere. Settings > Gameplay > Game data:
   switch on/off, download JSON / CSV, copy, delete. tools/analyze_telemetry.py reads the JSON export. Test environment (sandbox) runs are not recorded. */
const TELE_KEY='dragonball-survivors-telemetry-v1',TELE_MAX_RUNS=40,TELE_MAX_CHARS=2400000;
const tlR1=x=>Math.round(x*10)/10,tlR2=x=>Math.round(x*100)/100;
const TeleStore={
  load(){try{const raw=localStorage.getItem(TELE_KEY);if(!raw)return[];const a=(typeof safeJSON==='function'?safeJSON:JSON.parse)(raw);return Array.isArray(a)?a:[];}catch(e){return[];}},
  save(a){try{let s=JSON.stringify(a);while(s.length>TELE_MAX_CHARS&&a.length>1){a.shift();s=JSON.stringify(a);}localStorage.setItem(TELE_KEY,s);return true;}catch(e){return false;}},
  add(run){const a=this.load();a.push(run);while(a.length>TELE_MAX_RUNS)a.shift();return this.save(a);},
  clear(){try{localStorage.removeItem(TELE_KEY);}catch(e){}},
  count(){return this.load().length;},
  json(runs){return JSON.stringify(runs||this.load());},
  /* CSV of one table over all runs: kind = runs | minutes | s10 | levels | bosses | weapons | enemies | damage */
  csv(kind,runs){
    runs=runs||this.load();
    const head=['run','ts','stage','char','diff','x2','endless','res'],rows=[];let cols=null;
    const meta=r=>[r.id,r.ts,r.stage,r.char,r.diff,r.x2?1:0,r.endless?1:0,r.res];
    const fmt=v=>v==null?'':typeof v==='object'?Object.keys(v).map(k=>k+':'+v[k]).join('|'):v;
    const push=(r,o)=>{if(!cols)cols=Object.keys(o);else for(const k of Object.keys(o))if(!cols.includes(k))cols.push(k);rows.push([meta(r),o]);};
    for(const r of runs){
      if(kind==='runs'){const o=Object.assign({},r.S||{});for(const k of['dur','lvl','kills','bossKills','coins','maxHp','forms','maxStreak','senzu','revives','ver'])o[k]=r[k];o.deaths=(r.deaths||[]).length;o.weapons=(r.weapons||[]).map(w=>w.id+':'+w.lv+(w.evo?'e'+w.evo:'')).join('|');o.pass=r.pass;o.trinkets=(r.tr||[]).join('|');push(r,Object.assign({dur:o.dur},o));}
      else if(kind==='minutes')for(const m of r.min||[])push(r,m);
      else if(kind==='s10')for(const m of r.s10||[])push(r,{t:m[0],enemies:m[1],hp:m[2],dealt:m[3],kills:m[4],lvl:m[5]});
      else if(kind==='levels')for(const l of r.lv||[])push(r,l);
      else if(kind==='bosses')for(const b of r.boss||[])push(r,b);
      else if(kind==='weapons')for(const w of r.weapons||[])push(r,w);
      else if(kind==='enemies')for(const k in r.et||{}){const e=r.et[k];push(r,{enemy:k,spawned:e.sp,killed:e.k,hpAvg:e.sp?Math.round(e.hp/e.sp):0,lifeAvg:e.k?tlR1(e.life/e.k):0,dmgOut:Math.round(e.dmgOut),hits:e.hits});}
      else if(kind==='damage')for(const k in r.hb||{})push(r,{source:k,taken:Math.round(r.hb[k])});
    }
    if(!cols)return head.join(',')+'\n';
    const esc=v=>{v=String(fmt(v));return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
    return head.concat(cols).join(',')+'\n'+rows.map(([m,o])=>m.concat(cols.map(c=>o[c])).map(esc).join(',')).join('\n')+'\n';
  },
  /* inside the published page (claude.ai artifact) the viewer only allows saving through its own "downloads" capability; everywhere else a normal download */
  async download(name,text,mime){
    try{const C=window.claude;if(C&&typeof C.use==='function'){const d=await C.use('downloads');
      if(d){try{await d.save({filename:name,data:text});}catch(e){const c=e&&e.code;if(c!=='declined'&&c!=='rate_limited'&&c!=='too_large')throw e;}return true;}}}catch(e){}
    try{const b=new Blob([text],{type:mime||'text/plain'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),3000);return true;}catch(e){return false;}
  }
};
class Telemetry{
  constructor(g){
    this.g=g;this.id=Date.now().toString(36)+Math.random().toString(36).slice(2,6);
    this.min=[];this.s10=[];this.lv=[];this.boss=[];this.open=[];this.deaths=[];this.ev_=[];
    this.et={};this.wp={};this.hb={};this.lt={};this.use_={};this.lastHit=null;this.offer=null;this.lvRow=null;this.eid=null;
    this.tot={dealt:0,taken:0,heal:0,xp:0,coins:0,kills:0,spawned:0,gems:0,crits:0,dodges:0,blocks:0};
    this.m=this.blank();this.c=this.blank();this.nextM=60;this.next10=10;this.px=null;this.py=null;this.done=false;this.run=null;this.part=1;this.inAuto=false;this.t0=0;
  }
  /* recording is off in the test environment (sandbox) and when the player turned it off in Settings */
  get on(){const g=this.g;return !this.done&&!g.sandbox&&!(g.save&&g.save.settings&&g.save.settings.tele===false);}
  blank(){return{T:0,enS:0,enMax:0,hpS:0,hpMin:1,bossT:0,kills:0,spawned:0,dealt:0,hits:0,crits:0,taken:0,hurts:0,dodges:0,blocks:0,heal:0,regen:0,xp:0,coins:0,gems:0,loot:0,walked:0,lvUps:0};}
  eName(e){if(!this.eid){this.eid=new Map();for(const k in ENEMIES)this.eid.set(ENEMIES[k],k);}const n=this.eid.get(e.def);if(n)return n;const d=e.def||{},nm=d.n&&typeof d.n==='object'?d.n.en:d.n;return nm||d.ai||'?';}
  etab(e){const k=this.eName(e);return this.et[k]||(this.et[k]={sp:0,k:0,hp:0,life:0,dmgOut:0,hits:0});}
  wtab(k){return this.wp[k]||(this.wp[k]={t:tlR1(this.g.t||0),lv0:this.g.lvl||1,dmg:0,hits:0,crit:0,kills:0});}
  srcKey(s){return !s?'unknown':(s.boss||s.bd)?'boss:'+(s.bid||(s.bd&&s.bd.id)||'?'):s.def?this.eName(s):s.bs?'boss-shot':s.trap?'trap':s.pct?'pct':'other';}
  /* ---- time: called after every game step with the game seconds that passed ---- */
  tick(dt){
    const g=this.g,p=g.p,m=this.m,c=this.c;if(!(dt>0)||!p)return;
    const en=g.en.length,hp=p.maxHp>0?Math.max(0,p.hp/p.maxHp):1;
    m.T+=dt;m.enS+=en*dt;if(en>m.enMax)m.enMax=en;m.hpS+=hp*dt;if(hp<m.hpMin)m.hpMin=hp;if(g.bossAlive>0)m.bossT+=dt;
    if(!(g.trial)&&p.hp<p.maxHp-.01&&g.S.regen>0)m.regen+=Math.min(g.S.regen*dt,p.maxHp-p.hp);
    if(this.px!==null)m.walked+=Math.hypot(p.x-this.px,p.y-this.py);this.px=p.x;this.py=p.y;
    c.T+=dt;c.enS+=en*dt;c.hpS+=hp*dt;
    for(const b of this.boss)if(b.killed&&!b.fin)this.finBoss(b);
    while(g.t>=this.nextM){this.closeMinute(this.nextM/60);this.nextM+=60;}
    while(g.t>=this.next10){this.close10();this.next10+=10;}
  }
  close10(){const g=this.g,c=this.c,T=c.T||1;this.s10.push([Math.round(g.t),tlR1(c.enS/T),tlR2(c.hpS/T),Math.round(c.dealt),c.kills,g.lvl]);this.c=this.blank();}
  closeMinute(n,partial){
    const g=this.g,m=this.m,S=g.S,T=m.T||1,w={},ps={};
    for(const [id,x] of g.weapons)w[id]=x.lv+(x.evo?'e'+x.evo:'');
    for(const k in g.pass)if(g.pass[k]>0)ps[k]=g.pass[k];
    this.min.push({m:n,t:tlR1(partial?g.t:n*60),T:tlR1(m.T),lvl:g.lvl,lvUps:m.lvUps,xp:tlR1(m.xp),kills:m.kills,spawned:m.spawned,enAvg:tlR1(m.enS/T),enMax:m.enMax,
      dealt:Math.round(m.dealt),dps:tlR1(m.dealt/T),hits:m.hits,crits:m.crits,taken:Math.round(m.taken),tps:tlR1(m.taken/T),hurts:m.hurts,dodges:m.dodges,blocks:m.blocks,
      hpAvg:tlR2(m.hpS/T),hpMin:tlR2(m.hpMin),heal:Math.round(m.heal),regenHeal:Math.round(m.regen),coins:Math.round(m.coins),gems:m.gems,loot:m.loot,walked:Math.round(m.walked),boss:tlR2(m.bossT/T),
      nW:g.weapons.size,nP:Object.keys(ps).length,maxHp:Math.round(g.p.maxHp),esc:g.escSteps?g.escSteps():0,
      might:tlR2(S.might),spd:tlR2(S.spd),cd:tlR2(S.cd),armor:tlR1(S.armor),regen:tlR2(S.regen),crit:tlR2(S.crit),critDmg:tlR2(S.critDmg||0),dodge:tlR2(S.dodge||0),area:tlR2(S.area),luck:tlR2(S.luck),xpm:tlR2(S.xp),gold:tlR2(S.gold||0),proj:S.proj||0,taken:tlR2(S.taken||1),magnet:Math.round(S.magnet),w,p:ps});
    this.m=this.blank();
  }
  /* ---- things that happen ---- */
  dealt(e,dd,crit){if(this.g.trial)return;
    const g=this.g,m=this.m,c=this.c;m.dealt+=dd;c.dealt+=dd;m.hits++;this.tot.dealt+=dd;
    const w=this.wtab(g.curW||'other');w.dmg+=dd;w.hits++;if(crit){m.crits++;w.crit++;this.tot.crits++;}
    if(e.boss&&e._tl){const b=e._tl;b.dealt+=dd;if(b.fh==null)b.fh=tlR1(g.t);if(b.killed&&!b.fin)this.finBoss(b);}
  }
  kill(e){if(this.g.trial)return;
    const g=this.g;this.m.kills++;this.c.kills++;this.tot.kills++;this.wtab(g.curW||'other').kills++;
    if(e.boss){this.bossKill(e);return;}
    const E=this.etab(e);E.k++;E.life+=e.age||0;
  }
  spawn(e){if(this.g.trial)return;if(!e||!e.def||e.def.ai==='boss')return;const E=this.etab(e);E.sp++;E.hp+=e.max||e.hp||0;this.m.spawned++;this.tot.spawned++;}
  hurt(d,src){if(this.g.trial)return;
    const k=this.srcKey(src),m=this.m;m.taken+=d;m.hurts++;this.tot.taken+=d;this.hb[k]=(this.hb[k]||0)+d;
    if(src&&src.def&&!src.boss){const E=this.etab(src);E.dmgOut+=d;E.hits++;}
    for(const b of this.open)b.taken+=d;
  }
  avoid(block){if(this.g.trial)return;if(block){this.m.blocks++;this.tot.blocks++;}else{this.m.dodges++;this.tot.dodges++;}}
  xp(a){if(this.g.trial)return;this.m.xp+=a;this.tot.xp+=a;}
  heal(v){if(this.g.trial)return;if(v>0){this.m.heal+=v;this.tot.heal+=v;}}
  coins(v){if(this.g.trial)return;if(v>0){this.m.coins+=v;this.tot.coins+=v;}}
  gem(){if(this.g.trial)return;this.m.gems++;this.tot.gems++;}
  loot(k){if(this.g.trial)return;this.m.loot++;this.lt[k]=(this.lt[k]||0)+1;}
  use(k){this.use_[k]=(this.use_[k]||0)+1;}
  weapon(id){this.wtab(id);}
  ev(k,o){if(this.ev_.length<300)this.ev_.push(Object.assign({k,t:tlR1(this.g.t),lvl:this.g.lvl},o));}
  death(){const g=this.g,h=this.lastHit;this.deaths.push({t:tlR1(g.t),lvl:g.lvl,by:h?h.k:'?',en:g.en.length,boss:g.bossAlive>0,kills:g.kills});}
  /* ---- level-ups ---- */
  lvStart(){const g=this.g,prev=this.lv.length?this.lv[this.lv.length-1].t:this.t0,p=g.p;if(g.trial)return;this.m.lvUps++;this.offer=null;
    this.lvRow={lvl:g.lvl+1,t:tlR1(g.t),dt:tlR1(g.t-prev),en:g.en.length,hp:tlR2(p.maxHp>0?p.hp/p.maxHp:1),need:Math.round(g.need),rt:g.rt};this.lv.push(this.lvRow);}
  offered(opts){this.offer=(opts||[]).map(o=>this.optKey(o));}
  /* the window / automatic choice is over: what was offered, the advised card, whether it was automatic */
  lvEnd(lm,auto){const r=this.lvRow;if(!r||r.opts)return;r.opts=this.offer;r.auto=auto?1:0;if(lm&&lm.rec!=null&&lm.options)r.rec=this.optKey(lm.options[lm.rec]);}
  lvPick(o,i,m){const r=this.lvRow;if(!r||r.pick!==undefined)return;if(r.opts===undefined){r.opts=this.offer;r.auto=m?0:1;if(m&&m.rec!=null&&m.options)r.rec=this.optKey(m.options[m.rec]);}
    r.pick=o?this.optKey(o):'skip';if(m&&m.rec!=null)r.fr=(i===m.rec)?1:0;if(!r.auto)r.ct=tlR1(this.g.rt-r.rt);delete r.rt;}
  optKey(o){const k=this.g.optKey?this.g.optKey(o):null;return k||(o.type==='z'?'z':o.type);}
  /* ---- bosses ---- */
  bossSpawn(e){
    const g=this.g,p=g.p,b={id:e.bid,final:e.final?1:0,tama:e.tama?1:0,t0:tlR1(g.t),lvl:g.lvl,hp:Math.round(e.max),php:tlR2(p.maxHp>0?p.hp/p.maxHp:1),en:g.en.length,dealt:0,taken:0,fh:null,killed:0};
    Object.defineProperty(b,'e',{value:e,enumerable:false});e._tl=b;this.boss.push(b);this.open.push(b);
  }
  bossKill(e){
    const b=e._tl,g=this.g,p=g.p;if(!b||b.killed)return;
    b.killed=1;b.t1=tlR1(g.t);b.kt=tlR1(g.t-b.t0);b.lvl1=g.lvl;b.php1=tlR2(p.maxHp>0?p.hp/p.maxHp:1);b.ft=tlR1(g.t-(b.fh!=null?b.fh:b.t0));
    this.open=this.open.filter(x=>x!==b);
  }
  /* the numbers of a dead boss are closed once the killing blow has been added to its damage (damageEnemy hook, or the next tick) */
  finBoss(b){if(b.fin)return;b.fin=1;b.dps=tlR1(b.dealt/Math.max(1,b.ft||1));b.dealt=Math.round(b.dealt);b.taken=Math.round(b.taken);}
  /* ---- end of the run ---- */
  end(win){
    if(this.done)return;const g=this.g;
    try{
      if(this.m.T>1)this.closeMinute(Math.ceil(g.t/60),true);
      for(const b of this.boss){if(b.killed){this.finBoss(b);continue;}b.fin=1;b.dealt=Math.round(b.dealt);b.taken=Math.round(b.taken);b.dur=tlR1(g.t-b.t0);if(b.e)b.hpLeft=tlR2(Math.max(0,b.e.hp)/(b.e.max||1));}
      const S=g.S,R={};for(const k of['might','spd','cd','armor','regen','crit','critDmg','dodge','area','luck','xp','gold','magnet','proj','taken','lootRate'])R[k]=tlR2(S[k]||0);
      const run={id:this.id+(this.part>1?'-'+this.part:''),part:this.part,ts:Date.now(),ver:typeof BUILD_ID!=='undefined'?BUILD_ID:'',stage:g.stage.id,char:(g.C&&g.C.id)||'',diff:g.diffId,x2:g.x2?1:0,endless:g.endless?1:0,
        res:win?'win':(g.p.hp<=0||g.dying?'death':'quit'),dur:tlR1(g.t),lvl:g.lvl,kills:g.kills,bossKills:g.run.bossKills,coins:Math.round(g.run.coins),maxHp:Math.round(g.p.maxHp),
        forms:g.formsUnlocked,maxStreak:g.run.streak||0,senzu:g.senzu,revives:g.revives,S:R,
        weapons:[...g.weapons].map(([id,w])=>Object.assign({id,lv:w.lv,evo:w.evo||0},this.wp[id]?{dmg:Math.round(this.wp[id].dmg),hits:this.wp[id].hits,crit:this.wp[id].crit,kills:this.wp[id].kills,t:this.wp[id].t}:{})),
        pass:Object.fromEntries(Object.keys(g.pass).filter(k=>g.pass[k]>0).map(k=>[k,g.pass[k]])),tr:(g.trinkets||[]).map(id=>id+'@'+g.trR(id)),
        dmgBy:Object.fromEntries(Object.entries(g.dmgBy||{}).map(([k,v])=>[k,Math.round(v)])),
        tot:Object.fromEntries(Object.entries(this.tot).map(([k,v])=>[k,Math.round(v)])),et:this.et,hb:Object.fromEntries(Object.entries(this.hb).map(([k,v])=>[k,Math.round(v)])),lt:this.lt,use:this.use_,
        deaths:this.deaths,ev:this.ev_,boss:this.boss,lv:this.lv,min:this.min,s10:this.s10};
      this.run=run;g.tlRun=run;
      if(this.on)TeleStore.add(run);
    }catch(e){}
    this.done=true;
  }
  /* the player went on after the victory (Endless): the next record only holds what happens from now on */
  next(){this.part++;this.done=false;this.min=[];this.s10=[];this.lv=[];this.boss=[];this.open=[];this.deaths=[];this.ev_=[];this.et={};this.wp={};this.hb={};this.lt={};this.use_={};this.tot={dealt:0,taken:0,heal:0,xp:0,coins:0,kills:0,spawned:0,gems:0,crits:0,dodges:0,blocks:0};this.t0=this.g.t;}
}
/* ---- hooks: wrap the Game methods (the game code itself is not touched). pre() runs before and may return a value for post(result,args,pre) ---- */
(function(){
  if(typeof Game==='undefined')return;
  const P=Game.prototype;
  Object.defineProperty(P,'tl',{get(){return this._tl||(this._tl=new Telemetry(this));},configurable:true});
  const hook=(name,pre,post)=>{
    const o=P[name];if(typeof o!=='function')return;
    P[name]=function(...a){
      const T=this.tl,on=T.on;let c;
      if(on&&pre){try{c=pre.call(this,a,T);}catch(e){}}
      const r=o.apply(this,a);
      if(on&&post){try{post.call(this,r,a,c,T);}catch(e){}}
      return r;
    };
  };
  hook('update',function(){return this.t;},function(r,a,t0,T){T.tick(this.t-t0);});
  hook('damageEnemy',a=>a[0].dead?null:a[0].hp,function(r,a,h0,T){if(h0==null)return;const dd=h0-Math.max(0,a[0].hp);if(dd>0)T.dealt(a[0],dd,a[4]);});
  hook('killEnemy',a=>a[0].dead?1:0,function(r,a,was,T){if(!was&&a[0].dead&&!a[0].sparring)T.kill(a[0]);});
  hook('hurt',function(a,T){T.lastHit={k:T.srcKey(a[1]),t:tlR1(this.t)};return{h:this.p.hp,inv:this.p.inv,bar:this.barrierReady};},function(r,a,c,T){
    const d=c.h-this.p.hp;if(d>0)T.hurt(d,a[1]);else if(!(c.inv>0)&&this.p.inv>0&&this.p.inv<=.41&&!this.sb.god)T.avoid(c.bar&&!this.barrierReady);});
  hook('addXp',null,function(r,a,c,T){T.xp(a[0]*this.S.xp);});
  hook('heal',function(){return this.p.hp;},function(r,a,h,T){T.heal(this.p.hp-h);});
  hook('addZenny',function(){return this.run.coins;},function(r,a,c0,T){T.coins(this.run.coins-c0);});
  hook('collectLoot',(a,T)=>{T.loot(a[0].k);},null);
  hook('gemPick',(a,T)=>{T.gem();},null);
  hook('mkEnemy',null,function(r,a,c,T){T.spawn(r);});
  hook('spawnBoss',null,function(r,a,c,T){const e=this.en[this.en.length-1];if(e&&e.boss&&!e._tl&&!e.sparring)T.bossSpawn(e);});
  hook('levelUp',(a,T)=>{T.lvStart();},function(r,a,c,T){if(this.modal&&this.modal.type==='level')T.lvEnd(this.modal,false);});
  hook('levelOptions',null,function(r,a,c,T){T.offered(r);});
  hook('autoLevel',(a,T)=>{T.inAuto=true;T.lvEnd(a[0],true);},function(r,a,c,T){T.inAuto=false;});
  hook('applyOption',(a,T)=>{if(T.inAuto)T.lvPick(a[0],0,null);},null);
  hook('resolveModal',function(a,T){const m=this.modal;if(m&&m.type==='level')T.lvPick(a[0]>=0?(m.options[a[0]]||m.options[0]):null,a[0],m);},null);
  hook('chestRewards',null,function(r,a,c,T){T.ev('chest',{fin:a[0]?1:0,boss:a[1]?1:0,elite:a[2]?1:0,rw:(r||[]).map(x=>x.k+(x.id?':'+x.id:x.o?':'+T.optKey(x.o):''))});});
  hook('unlockForm',null,function(r,a,c,T){T.ev('form',{n:this.formsUnlocked});});
  hook('startTrial',function(){return this.trial;},function(r,a,had,T){if(!had&&this.trial)T.ev('trial',{n:this.trialN});});
  hook('revive',null,function(r,a,c,T){T.ev('revive');});
  hook('startDeath',(a,T)=>{if(!(T.g.dying||T.g.ended))T.death();},null);
  hook('addWeapon',function(a){return this.weapons.has(a[0]);},function(r,a,had,T){if(!had&&this.weapons.has(a[0]))T.weapon(a[0]);});
  for(const [m,k] of [['dash','dash'],['useAbility','ability'],['useSenzu','senzu'],['usePet','pet'],['rerollLevel','reroll'],['skipLevel','skip'],['banLevel','ban']])
    hook(m,null,function(r,a,c,T){if(r)T.use(k);});
  hook('continueAfterWin',null,function(r,a,c,T){T.next();});
  hook('finish',function(a,T){if(!this.ended)T.end(a[0]);},null);
})();
